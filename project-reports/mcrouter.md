---
title: mcrouter
---

# mcrouter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for mcrouter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

mcrouter is a memcached protocol router developed and operated by Meta (Facebook) as internal cache-infrastructure software, released as open source under the `facebook` GitHub org. Per the project README, it "is a core component of cache infrastructure at Facebook and Instagram, handling almost 5 billion requests per second at peak" (this figure is from the README itself, single-source, [NEEDS VERIFICATION]).

Governance is informal and corporate, not foundation-based. There is no GOVERNANCE.md, MAINTAINERS, OWNERS, or CODEOWNERS file in the repository (all return 404). Contributions require Meta's CLA ([code.facebook.com/cla](https://code.facebook.com/cla)), and per CONTRIBUTING.md, PRs are merged by Meta staff after internal review, consistent with a public GitHub repo that mirrors an internal Meta monorepo via "ShipIt." License is MIT, copyright "Meta Platforms, Inc. and its affiliates."

Top contributors by all-time commit count (GitHub `contributors` API, company field self-reported and not independently verified):
- andreazevedo (Andre Azevedo Pinto) - 412 contributions, profile lists Google (unclear if this reflects a post-Meta job change)
- jmswen - 209 contributions, profile lists @facebook
- stuclar (Stuart Clark) - 184 contributions, profile lists Facebook
- alikhtarov (Anton Likhtarov) - 152 contributions, no company listed, recent commit activity consistent with continued Meta employment [NEEDS VERIFICATION]
- spalamarchuk - 144 contributions, no company listed
- Several recent top committers use Meta's internal automated commit identity pattern (`generatedunixname*`), indicating bot-generated commits from Meta's internal tooling.
- One external contributor, mszabo-wikia (Mate Szabo), lists @slackhq and notes contributions are in a personal capacity; contributed 11 commits.

There is no identified corporate co-maintainer outside Meta. This is a single-vendor project with occasional individual external patches, not multi-company co-maintenance.

On RISC-V specifically, there is no documented community stance, positive or negative. Exhaustive searches (`gh search issues/prs/commits/code` for "riscv" and "riscv64", and `gh api search/issues` with the same terms) all return zero results in `facebook/mcrouter`. There has been no request, discussion, or rejection of a RISC-V port. Silence, not opposition.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, PR, or issue has ever been filed against facebook/mcrouter | [gh search issues/prs/commits/code, 0 results for "riscv"/"riscv64"](https://github.com/facebook/mcrouter) |

There is no port history to report. No key contributors exist for a RISC-V port because none has been attempted. mcrouter is not upstream-RISC-V-enabled in any respect: no architecture-conditional code, no CI job, no toolchain file, no documentation.

The only related historical precedent is [facebook/mcrouter#41 "Add support for aarch64 timer"](https://github.com/facebook/mcrouter/pull/41) (2015, merged), which is an ARM64 timer port, not RISC-V. It demonstrates the codebase has, in the past, required architecture-specific timer porting work (in `Clocks.cpp`), which is directly relevant to what a RISC-V port would need to do in the same file.

## 3. Upstream Support Tier

No formal architecture-tier policy document exists (no PLATFORMS.md, SUPPORT.md, or `docs/platforms/` file found; all return 404). The de facto tier structure is: x86_64 is the only tier that exists.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI (GitHub Actions) | Yes (`ubuntu-24.04`, sole job) | No matrix entry | No matrix entry |
| Release-blocking | N/A - only x86_64 CI exists at all | N/A | N/A |
| Official binaries | None (source-only releases, all 5 checked releases have empty asset arrays) | None | None |
| Historical porting precedent | N/A | [#41 aarch64 timer support (2015, merged)](https://github.com/facebook/mcrouter/pull/41) | None |

mcrouter ships no prebuilt binaries for any architecture, so the "tier" gap for riscv64 is a gap versus a project that is itself single-architecture (x86_64 CI only) and source-only in distribution. This is a materially different situation from projects where arm64 has an established tier and riscv64 lags behind it: here, arm64 also has no CI, no release binaries, and no current-day architecture-specific code path beyond the same generic fallbacks riscv64 would use.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The entire mcrouter repository (1199 paths scanned via recursive git-tree listing) contains exactly three files with architecture-conditional (`#ifdef`) logic. There is no JIT in mcrouter, no SIMD/vector code, and no assembly files (`.S`) anywhere in the tree.

| File | amd64 (x86_64) | arm64 (aarch64) | riscv64 | Quality rating for riscv64 |
|---|---|---|---|---|
| `mcrouter/lib/Clocks.cpp` | `rdtsc` inline asm cycle counter | `mrs cntvct_el0` inline asm | No `#elif` guard; falls into unconditional `#else` -> `#error Unsupported CPU. Consider implementing your own Clock.` | **Missing / build blocker** - see Section 5 |
| `mcrouter/lib/fbi/cpp/LowerBoundPrefixMap.cpp` | Falls to generic `std::upper_bound` via `#else` | Branchless CSEL-friendly custom `branchlessUpperBound` | No guard; falls to the same generic `std::upper_bound`/`sorted_vector_map::upper_bound()` path as x86_64 | **Scalar/generic fallback** - functionally complete, not perf-tuned |
| `mcrouter/lib/network/McServerRequestContext.h` | Falls into final `#else`: `static_assert(sizeof(...) == 32)` | 32-bit ARM (`__ARM_ARCH && !__aarch64__`) gets a distinct 24-byte branch; `__aarch64__` itself falls to the same 32-byte `#else` as x86_64 | No explicit branch; falls to the same 32-byte `#else` | **Untested assumption** - compiles under the generic assumption, never confirmed against real riscv64 ABI output |

A fourth guard family in `Clocks.cpp` (`__i386__`, `__powerpc__`) is legacy 32-bit/PowerPC code and does not interact with the riscv64 question.

No ISA extensions (RVV, Zba, Zbb, etc.) are referenced anywhere in the mcrouter repository itself. mcrouter's direct dependency **folly** does have riscv64 portability macros at the `folly/Portability.h` level (`#if defined(__riscv) ... #define FOLLY_RISCV64 1 ... constexpr bool kIsArchRISCV64 = FOLLY_RISCV64 == 1;`), but this gap in mcrouter's own tree is separate and is the concrete build blocker described in Section 5.

## 5. Build System, Cross-Compilation, and Toolchain

**Build blocker (concrete, source-level):** `mcrouter/lib/Clocks.cpp` has no riscv64 branch in its CPU-cycle-counter dispatch. Compiling mcrouter on riscv64 today hits the unconditional `#error Unsupported CPU. Consider implementing your own Clock.` at compile time, unless someone adds an `#elif defined(__riscv)` branch (e.g. falling back to `gettimeofday()`/`clock_gettime()`, matching the pattern used for the ARM fallback path). No PR or issue addressing this exists upstream.

**Build system inconsistency (independent of riscv64):** the repository has two parallel, not-fully-reconciled build paths. The root `CMakeLists.txt` (`cmake_minimum_required(VERSION 3.16 FATAL_ERROR)`, `CMAKE_CXX_STANDARD 20` required) appears to be the authoritative modern build description, but the actual OSS install script for Ubuntu 24.04 (`mcrouter/scripts/recipes/mcrouter.sh`) still drives the legacy autotools flow (`autoreconf --install && ./configure ... && make && make install`), not the root CMakeLists.txt. Any RISC-V build effort needs to establish which path is authoritative before proceeding.

Toolchain requirement: C++20 (`CMAKE_CXX_STANDARD 20` in root CMakeLists.txt). mcrouter itself does not state a compiler minimum, but its hard dependency folly documents GCC 10+/Clang 12+ as its C++20 baseline; this is an inference from folly's documentation, not a statement from mcrouter's own docs [NEEDS VERIFICATION].

Hard dependencies via `find_package(... CONFIG REQUIRED)`: folly, wangle, fizz, fmt, FBThrift, gflags, glog, Boost >= 1.69.0 (context, filesystem, program_options, regex, system, thread), OpenSSL, LibEvent, ZLIB. None of these `find_package` calls have architecture conditionals. There is also a hard `find_program(RAGEL_EXECUTABLE ragel)` dependency (`FATAL_ERROR` if absent).

No toolchain file exists (`cmake/riscv64.cmake` or any `cmake/toolchain-*.cmake` - none present). The only two Dockerfiles in the repo (`mcrouter/scripts/docker/ubuntu/Dockerfile` from `ubuntu:focal`, `mcrouter/scripts/docker/almalinux/Dockerfile` from `almalinux:latest`) are generic x86_64 base images with no `--platform`, `ARCH`, or cross-compile logic. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists (all 404). No mention of QEMU anywhere in the repository - no `qemu-user`, `qemu-system-riscv64`, or emulation-based cross build/test step.

The `install_ubuntu_24.04.sh` apt package list has no architecture qualifiers and no `dpkg --print-architecture` branching:
```
autoconf binutils-dev bison cmake flex g++ gcc git libboost1.83-all-dev libbz2-dev
libdouble-conversion-dev libevent-dev libgflags-dev libgoogle-glog-dev libgmock-dev
libgtest-dev libjemalloc-dev liblz4-dev liblzma-dev liblzma5 libsnappy-dev
libsodium-dev libssl-dev libtool libunwind8-dev libxxhash-dev libzstd-dev make
ninja-build pkg-config python3-dev ragel sudo
```
Of these, `libjemalloc-dev`, `libdouble-conversion-dev`, `libgoogle-glog-dev`, `libgflags-dev`, `ragel`, and `libsodium-dev` all show a riscv64 binary in Debian sid. `libunwind8-dev` and `libboost1.83-all-dev` (versioned names) were not directly confirmed for riscv64 - only the unversioned `libunwind-dev`/`libunwind8` and `libboost-all-dev` exist in sid - flagged as unconfirmed rather than assumed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles at all | Yes | Yes (implied by aarch64 branches existing; not independently CI-verified either) | **No - hits `#error Unsupported CPU` in `Clocks.cpp`** unless patched |
| Cycle-accurate timer | `rdtsc` inline asm | `mrs cntvct_el0` inline asm | Would require a new fallback (e.g. `gettimeofday()`); no implementation exists to characterize |
| Branchless prefix-map lookup | Generic `std::upper_bound` | Custom branchless CSEL optimization | Generic `std::upper_bound` (same as amd64) - correctness unaffected, no performance data measured on any architecture in these findings |
| Struct-layout assumption (`McServerRequestContext`) | 32 bytes, exercised in production at scale | 32 bytes, same as amd64 | 32 bytes assumed via generic `#else`, **never validated on real riscv64 ABI output** |
| CI validation of any of the above | Yes (build only, no arch-specific test coverage evident) | No | No |

No SIMD, JIT, or GC-barrier code exists in mcrouter for any architecture, so there is no vector/SIMD gap to characterize beyond what's listed above. No NaN/floating-point semantics issues were found or searched for in mcrouter's own code (out of scope given no floating-point-heavy architecture-specific code exists). Security hardening: no architecture-specific hardening code (e.g. CFI, stack protector variants) was found for any architecture in these findings; not further characterized.

## 7. CI/CD Infrastructure

The repository has exactly one CI workflow file, `.github/workflows/build.yml` (verified via direct GitHub API/raw-content read, 549 bytes), reproduced here in full:

```yaml
name: build

on:
  push:
    branches:
      - main
      - github_action
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Build dependencies
        run: |
          ./mcrouter/scripts/install_ubuntu_24.04.sh "$(pwd)"/mcrouter-install deps
      - name: Build mcrouter
        run: |
          mkdir -p "$(pwd)"/mcrouter-install/install
          ./mcrouter/scripts/install_ubuntu_24.04.sh "$(pwd)"/mcrouter-install mcrouter
```

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists (all 404). No `workflow_dispatch` or `schedule` trigger. No matrix strategy, no test-run step, no QEMU setup action, no cross-compilation toolchain.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes (`ubuntu-24.04` GitHub-hosted runner) | No | No |
| QEMU/cross-build | N/A (native) | No | No |
| RISE runner usage | No | No | No |

There is no RISE Project engagement of any kind. Confirmed by checking the full list of 55 `riseproject-dev` org repositories (none named or related to mcrouter), org-scoped code and repository searches (`gh api search/code?q=mcrouter+org:riseproject-dev` and `search/repositories`, both 0 results), the RISE wheel-builder catalog of 74 supported packages (mcrouter absent), and the RISE blog sitemap (32 published posts, May 2024-July 2026, none referencing mcrouter, memcached, or Meta caching infrastructure). Meta/Facebook is not listed among RISE's Premier or General members.

## 8. Distribution and Release Status

mcrouter ships **no prebuilt binaries on any channel checked, for any architecture** - this is not a riscv64-specific gap but a project-wide characteristic.

| Channel | Result |
|---|---|
| GitHub Releases | 5 most recent releases checked (v0.41.0-release, v0.40.0, v0.39.0, v0.38.0-release, v0.37.0-release); all have empty `assets` arrays. Source-only. |
| PyPI | `https://pypi.org/pypi/mcrouter/json` returns [HTTP 404](https://pypi.org/pypi/mcrouter/json) - no package exists |
| Ubuntu 24.04 (noble) | Not packaged (`packages.ubuntu.com` returns no results for any architecture) |
| Debian | Not packaged; [tracker.debian.org/pkg/mcrouter](https://tracker.debian.org/pkg/mcrouter) returns 404. Debian's buildd status shows "No entry in riscv64 database" - true for any architecture, not riscv64-specific |
| Arch Linux RISC-V | No entry found on the Arch RISC-V package overview page |

**What a user must do to get a working binary:** build from source using Meta's `getdeps.py`/`fbcode_builder` tooling (or the legacy autotools recipe scripts described in Section 5), on any architecture, including x86_64. There is no "download a binary" path for mcrouter at all today.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| [Folly](https://github.com/facebook/folly) | Core C++ utility library (async, containers, IOBuf) | Broken | Not run | Not packaged for riscv64 in Debian | [#2493](https://github.com/facebook/folly/issues/2493) open GCC 14 riscv64 build failure; [#2416](https://github.com/facebook/folly/issues/2416) open template/declaration-ordering error; [#2173](https://github.com/facebook/folly/issues/2173) ("How should I run folly on riscv64?") closed without a documented fix path |
| [wangle](https://github.com/facebook/wangle) | Async networking/services on Folly | Untracked | Untracked | Not packaged for riscv64 in Debian | 0 riscv64 issues filed; inherits Folly's build risk via linkage |
| [fizz](https://github.com/facebookincubator/fizz) | TLS 1.3 for mcrouter's secure transport | Untracked | Untracked | Not packaged for riscv64 in Debian | 0 riscv64 issues filed |
| [FBThrift](https://github.com/facebook/fbthrift) | RPC/serialization (Memcache thrift service) | Untracked | Untracked | Not packaged for riscv64 in Debian | 0 riscv64 issues filed |
| [fmt](https://github.com/fmtlib/fmt) | String formatting | Presumed OK (pure C++, no SIMD) | Unverified | Packaged for riscv64 in Debian sid | No riscv64 issues found |
| [glog](https://github.com/google/glog) | Logging | Presumed OK | Unverified | Packaged for riscv64 in Debian sid | Not independently verified beyond package presence |
| [gflags](https://github.com/gflags/gflags) | CLI flag parsing | Presumed OK | Unverified | Packaged for riscv64 in Debian sid | Not independently verified beyond package presence |
| Boost (>=1.69, context/filesystem/program_options/regex/system/thread) | General-purpose C++ libs; `Boost::context` uses arch-specific asm for fiber switching | Builds (riscv64 asm context-switch support exists upstream) | Unverified | Packaged for riscv64 in Debian sid | `Boost::context` is highest-risk component (hand-written asm per architecture); no open riscv64 issues found but no real build independently confirmed |
| [OpenSSL](https://github.com/openssl/openssl) | TLS/crypto | OK | OK | Released; Debian sid riscv64 up to date (3.6.3-1) | 81 total riscv64-tagged issues, 15 open (mostly RVV/Zvkb crypto-acceleration feature work, not build blockers). Mature support |
| [LibEvent](https://github.com/libevent/libevent) | Event loop | OK, 0 riscv64 issues filed | Unverified, no reported failures | Released; Debian sid riscv64 up to date (2.1.13-stable-1) | See [project-reports/libevent.md](libevent.md) |
| zlib | Compression | OK | OK (1 closed issue, test addition not a bug) | Released; Debian sid riscv64 up to date | See [project-reports/zlib.md](zlib.md) |
| [zstd](https://github.com/facebook/zstd) | Compression (`ZstdCompressionCodec`, disabled by default via `DISABLE_COMPRESSION`) | OK, active RVV SIMD work in progress | OK | Released; not confirmed in Debian riscv64 buildd table this pass | [#4622](https://github.com/facebook/zstd/pull/4622) open perf PR (4-way fast decompression on riscv64); [#4524/#4523](https://github.com/facebook/zstd/pull/4524) merged Zicclsm support; older [#3134](https://github.com/facebook/zstd/issues/3134) and [#749](https://github.com/facebook/zstd/issues/749) closed/resolved. See [project-reports/zstd.md](zstd.md) |
| [LZ4](https://github.com/lz4/lz4) | Fast compression codec, used via `Lz4CompressionCodec`/`Lz4Immutable` and as zstd dependency | OK, active RVV vectorization contributions | OK | Released; Debian sid riscv64 up to date (1.10.0-10) | [#1778](https://github.com/lz4/lz4/pull/1778), [#1734](https://github.com/lz4/lz4/pull/1734) (RVV xxHash, 3.04x speedup), [#1738](https://github.com/lz4/lz4/pull/1738) (RVV LZ4_count), [#1678](https://github.com/lz4/lz4/pull/1678) (4.7-4.8x decompression speedup) all open/in-progress perf work; [#1298](https://github.com/lz4/lz4/pull/1298), [#1648](https://github.com/lz4/lz4/pull/1648)/[#1639](https://github.com/lz4/lz4/pull/1639) merged. See [project-reports/lz4.md](lz4.md) |
| [Snappy](https://github.com/google/snappy) | Compression codec (install script deps) | OK | OK | Released; Debian sid riscv64 up to date (1.2.2-2+b2) | No functional riscv64 issues; [#208](https://github.com/google/snappy/pull/208) closed (benchmark submodule update). See [project-reports/snappy.md](snappy.md) |
| [jemalloc](https://github.com/jemalloc/jemalloc) | Memory allocator | OK now, required patches historically | OK | Released; Debian sid riscv64 up to date (5.3.1-2) | [#2399](https://github.com/jemalloc/jemalloc/issues/2399) open cross-build question; [#2323](https://github.com/jemalloc/jemalloc/issues/2323) closed (added riscv64gc support); [#1401](https://github.com/jemalloc/jemalloc/issues/1401) closed (atomics FTBFS fix). See [project-reports/jemalloc.md](jemalloc.md) |
| [libunwind](https://github.com/libunwind/libunwind) | Stack unwinding, likely pulled transitively via Folly/glog | Mostly OK, C++ exception edge cases | Partial - C++ exception tests fail on some configs | Released; Debian sid riscv64 up to date | [#519](https://github.com/libunwind/libunwind/issues/519) open (`Ltest-cxx-exceptions` fails on Ubuntu 20.04 riscv64); [#1032](https://github.com/libunwind/libunwind/issues/1032) closed (disabled C++ exception support on RISC-V by default). See [project-reports/libunwind.md](libunwind.md) |
| xz / liblzma | Compression, likely transitive | OK | Unverified | Released; Debian sid riscv64 up to date | [#146](https://github.com/tukaani-project/xz/issues/146) closed (enabled `TUKLIB_FAST_UNALIGNED_ACCESS` for RISC-V). See [project-reports/xz.md](xz.md) |
| bzip2 | Compression, transitive | Unverified via GitHub (sourceware.org-hosted, no issue tracker checked) | Unverified | Released; Debian sid riscv64 up to date | See [project-reports/bzip2.md](bzip2.md) for detail on Anubis bot protection gaps |
| libsodium | Crypto, optional/transitive | Not checked this pass | Not checked | Not checked this pass | Not in scope.yml |
| double-conversion | Float-to-string conversion (Folly dependency) | Not checked this pass | Not checked | Not checked this pass | Not in scope.yml |
| ICU | Unicode/i18n, likely transitive via Folly | Not checked this pass | Not checked | Not checked this pass | Not in scope.yml |

**Deep dive - critical path:** mcrouter's `CMakeLists.txt` declares `find_package(folly/wangle/fizz/FBThrift CONFIG REQUIRED)`, all four of which are hard-required, not optional. Folly currently has two open riscv64 build failures ([#2493](https://github.com/facebook/folly/issues/2493), [#2416](https://github.com/facebook/folly/issues/2416)), and none of Folly, wangle, fizz, or FBThrift appear in Debian's riscv64 buildd tracking at all, meaning no downstream distro is currently attempting to build this stack for riscv64. A broken Folly build is therefore a hard blocker for mcrouter on riscv64, independent of and prior to the `Clocks.cpp` compile error described in Section 5. By contrast, the widely-used lower-level libraries mcrouter also depends on (OpenSSL, LibEvent, zlib, zstd, LZ4, Snappy, jemalloc, Boost) build, test, and release cleanly on riscv64, several with active RVV/Zicclsm performance work in flight.

## 10. Ecosystem Status

Not applicable. mcrouter is a standalone C++ daemon with no dependent package ecosystem (no PyPI, npm, Maven, or similar downstream consumer packages found; mcrouter itself has no PyPI package, confirmed 404).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue, PR, or commit exists in facebook/mcrouter | N/A | N/A | Confirmed via `gh search issues/prs/commits/code` for "riscv"/"riscv64" (0 results each) and `gh api search/issues` for both terms (`total_count: 0`) |

There is no tracking issue for RISC-V support and no correctness/performance discussion referencing the architecture in facebook/mcrouter itself. The dependency-level bugs relevant to a future riscv64 port are listed in Section 9 (Folly build failures [#2493](https://github.com/facebook/folly/issues/2493), [#2416](https://github.com/facebook/folly/issues/2416); libunwind exception test failure [#519](https://github.com/libunwind/libunwind/issues/519)).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No issue or discussion exists in which RISC-V support was requested and rejected, or discussed at all.

**Technical blockers:**
1. `mcrouter/lib/Clocks.cpp` has no riscv64 branch and hits `#error Unsupported CPU` at compile time - a concrete, small, source-level fix (add an `#elif defined(__riscv)` branch, e.g. a `gettimeofday()` fallback matching the ARM pattern).
2. Folly (a hard `find_package ... REQUIRED` dependency) currently has two open riscv64 build failures ([#2493](https://github.com/facebook/folly/issues/2493), [#2416](https://github.com/facebook/folly/issues/2416)) that would need to be resolved upstream in Folly before mcrouter can build at all on riscv64.
3. No riscv64 CI, toolchain file, or Docker image exists; all would need to be authored from scratch.
4. The repo's build system is internally inconsistent (CMake root file vs. autotools-driven install scripts), which is a pre-existing engineering debt independent of riscv64 that any porting effort would need to navigate.

**Organizational blockers:** mcrouter has no external co-maintainers and no foundation governance; all merge decisions run through Meta's internal review/ShipIt process. There is no RISE Project engagement or funding directed at mcrouter, and Meta is not a RISE member per the RISE membership list retrieved.

**Acceptance probability:** Unverifiable from available data. There is no precedent (positive or negative) for how Meta's mcrouter maintainers would respond to an external riscv64 PR, since no such PR, issue, or discussion has ever been filed. Given the project's single-vendor governance and internal-monorepo-mirror workflow, any port would need to clear Meta's internal CLA/review process, and its practical priority for Meta is unknown since mcrouter's production fleet is stated in the README to be Facebook/Instagram's own datacenter infrastructure (x86_64), not multi-architecture by design.

## 13. Investment Analysis

RISE has not funded or performed any mcrouter-specific work. Confirmed: mcrouter is absent from the full 55-repository `riseproject-dev` GitHub org, absent from the 74-package RISE wheel-builder catalog, and absent from all 32 RISE blog posts (May 2024-July 2026). All investment sizing below is therefore new work, not a refinement of prior RISE effort.

### 13.1 Functional Enablement
- Add a riscv64 branch to `mcrouter/lib/Clocks.cpp` (fallback cycle-counter implementation): small, well-scoped fix given the existing ARM fallback pattern as a template.
- Confirm/patch the Folly build failures blocking the dependency chain ([#2493](https://github.com/facebook/folly/issues/2493), [#2416](https://github.com/facebook/folly/issues/2416)) - this work is upstream in Folly, not in mcrouter, and its scope is not characterized in these findings beyond the two open issue links; effort cannot be sized without inspecting Folly's own riscv64 status in detail (out of scope for this report).
- Validate the `McServerRequestContext` struct-size `static_assert` against a real riscv64 build/ABI.
- Reconcile or at minimum work around the CMake-vs-autotools build system split for a riscv64 target.

### 13.2 Performance Optimization
- Cycle-accurate timer: currently no riscv64-specific implementation exists; adding one (e.g. via `rdcycle` where permitted) is optional relative to the `gettimeofday()` functional fallback.
- Branchless prefix-map lookup: aarch64 has a hand-tuned CSEL-friendly variant; riscv64 has none. Whether riscv64's branch predictor characteristics warrant a similar optimization is an open, unmeasured question per the research findings, not something with existing data to size against.
- No SIMD/vector (RVV) work is applicable within mcrouter's own code, since none of its architecture-conditional files use SIMD.

### 13.3 CI/CD Infrastructure
- No riscv64 CI exists for mcrouter (nor does arm64 CI exist, for comparison). Establishing a riscv64 CI job requires adding a QEMU-based or hardware-backed runner and a matrix strategy to the sole `.github/workflows/build.yml` file, which today has none.

### 13.4 Ecosystem Enablement
Not applicable (Section 10).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `Clocks.cpp` | Data not available: no effort estimate found in research; likely small given existing ARM pattern to follow, but not independently sized | Unassigned | Critical |
| Functional | Resolve/track Folly riscv64 build failures ([#2493](https://github.com/facebook/folly/issues/2493), [#2416](https://github.com/facebook/folly/issues/2416)) blocking mcrouter's dependency chain | Data not available: this is upstream Folly work, scope not characterized in these findings | Unassigned (upstream Folly) | Critical |
| Functional | Validate `McServerRequestContext` struct-size assumption on real riscv64 build | Data not available: no effort estimate found | Unassigned | High |
| CI/CD | Add riscv64 CI runner/matrix entry to `build.yml` | Data not available: no effort estimate found; no arm64 precedent exists to model from either | Unassigned | Medium |
| Functional | Reconcile CMake-vs-autotools build system split (pre-existing debt, not riscv64-specific but blocks a clean port) | Data not available: no effort estimate found | Unassigned | Medium |
| Performance | Branchless prefix-map lookup for riscv64 (parity with aarch64) | Data not available: no benchmark data exists to justify priority | Unassigned | Low |
| Performance | Cycle-accurate timer for riscv64 (parity with amd64/aarch64) | Data not available: no benchmark data exists to justify priority | Unassigned | Low |

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [facebook/mcrouter (GitHub repository)](https://github.com/facebook/mcrouter)
- [facebook/mcrouter .github/workflows/build.yml](https://github.com/facebook/mcrouter/blob/main/.github/workflows/build.yml)
- [facebook/mcrouter releases (GitHub API)](https://api.github.com/repos/facebook/mcrouter/releases?per_page=5)
- [facebook/mcrouter PR #41 - Add support for aarch64 timer](https://github.com/facebook/mcrouter/pull/41)
- [facebook/mcrouter issue #402](https://github.com/facebook/mcrouter/issues/402)
- [Meta CLA](https://code.facebook.com/cla)
- [mcrouter package on PyPI (404)](https://pypi.org/pypi/mcrouter/json)
- [mcrouter on Debian tracker (404)](https://tracker.debian.org/pkg/mcrouter)
- [Arch Linux RISC-V package overview](https://archriscv.felixc.at/?q=mcrouter)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Project wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub org](https://github.com/riseproject-dev)
- [facebook/folly issue #2493 - riscv64 build failure with GCC 14](https://github.com/facebook/folly/issues/2493)
- [facebook/folly issue #2416 - template/declaration ordering error](https://github.com/facebook/folly/issues/2416)
- [facebook/folly issue #2173 - How should I run folly on riscv64?](https://github.com/facebook/folly/issues/2173)
- [facebook/zstd PR #4622 - riscv64 4-way fast decompression loop](https://github.com/facebook/zstd/pull/4622)
- [facebook/zstd PR #4524 - RISC-V Zicclsm support](https://github.com/facebook/zstd/pull/4524)
- [facebook/zstd issue #3134](https://github.com/facebook/zstd/issues/3134)
- [facebook/zstd issue #749](https://github.com/facebook/zstd/issues/749)
- [lz4/lz4 PR #1778](https://github.com/lz4/lz4/pull/1778)
- [lz4/lz4 PR #1734 - RVV xxHash speedup](https://github.com/lz4/lz4/pull/1734)
- [lz4/lz4 PR #1738 - RVV LZ4_count](https://github.com/lz4/lz4/pull/1738)
- [lz4/lz4 PR #1678 - decompression speedup](https://github.com/lz4/lz4/pull/1678)
- [lz4/lz4 PR #1298 - basic riscv64 support](https://github.com/lz4/lz4/pull/1298)
- [lz4/lz4 PR #1648](https://github.com/lz4/lz4/pull/1648)
- [lz4/lz4 PR #1639](https://github.com/lz4/lz4/pull/1639)
- [google/snappy PR #208](https://github.com/google/snappy/pull/208)
- [jemalloc/jemalloc issue #2399](https://github.com/jemalloc/jemalloc/issues/2399)
- [jemalloc/jemalloc issue #2323](https://github.com/jemalloc/jemalloc/issues/2323)
- [jemalloc/jemalloc issue #1401](https://github.com/jemalloc/jemalloc/issues/1401)
- [libunwind/libunwind issue #519](https://github.com/libunwind/libunwind/issues/519)
- [libunwind/libunwind issue #1032](https://github.com/libunwind/libunwind/issues/1032)
- [tukaani-project/xz issue #146](https://github.com/tukaani-project/xz/issues/146)
- [project-reports/libevent.md](libevent.md)
- [project-reports/zlib.md](zlib.md)
- [project-reports/zstd.md](zstd.md)
- [project-reports/lz4.md](lz4.md)
- [project-reports/snappy.md](snappy.md)
- [project-reports/jemalloc.md](jemalloc.md)
- [project-reports/libunwind.md](libunwind.md)
- [project-reports/xz.md](xz.md)
- [project-reports/bzip2.md](bzip2.md)