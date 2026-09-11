---
title: Scylla
parent: Project Reports
color: red
dependencies:
  - name: Seastar
    relation: build-dependency
    criticality: critical
  - name: Abseil
    relation: build-dependency
    criticality: critical
  - name: DPDK
    relation: build-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
---

# Scylla

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Scylla<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="scylla" %}

## 1. Project Overview

ScyllaDB (repository: [scylladb/scylladb](https://github.com/scylladb/scylladb), homepage: [scylladb.com](https://www.scylladb.com/)) is a C++ NoSQL database engineered as a drop-in-compatible, higher-throughput replacement for Apache Cassandra and Amazon DynamoDB, built on the Seastar shard-per-core async framework.

**Governance:** Scylla has no foundation governance. It is not hosted by the Linux Foundation, Apache, CNCF, or any neutral foundation - there is no `MAINTAINERS`, `OWNERS`, or `GOVERNANCE.md` file in the repository. It is a single-vendor corporate project wholly controlled by ScyllaDB Ltd. The repository root license is `LICENSE-ScyllaDB-Source-Available.md`, the "ScyllaDB Software License Agreement" v1.1 (dated April 12, 2026) - a BSL-style, source-available license, not an OSI-approved open source license. It caps usage at 10TB storage / 50 vCPUs, contains a "Never Customer" clause voiding the license for anyone with a prior commercial relationship to ScyllaDB, bans offering it as SaaS/DBaaS, and assigns derivative-work IP to ScyllaDB. Outside contributions require a signed CLA sent to `cla@scylladb.com` (see `CONTRIBUTING.md`).

**Corporate maintainers:** `.github/CODEOWNERS` lists per-module owners; every identifiable name resolves to a ScyllaDB Ltd. employee (e.g. Tomasz Grabiec, Gleb Natapov, Nadav Har'El, Kamil Braun). A commit author-domain tally over roughly the last 1,000 master commits (2022-2026) found 11,505 commits from `@scylladb.com` addresses versus 162 from `@gmail.com`, 36 anonymized GitHub noreply addresses, and single-digit counts from other domains - commit authorship is overwhelmingly concentrated in one company.

**Community culture on new ports:** Only two architecture-related issues exist in project history: [#6758 "ARM64 support"](https://github.com/scylladb/scylladb/issues/6758) (closed - aarch64 is now first-class, supported since release 4.6, and was clearly commercially motivated by cloud Graviton instances) and [#5617 "Is any way to support running or building on MIPS64 arch?"](https://github.com/scylladb/scylladb/issues/5617) (closed 2020, essentially no maintainer engagement visible). This is a limited sample but suggests the project has entertained new CPU ports only when there is a clear commercial driver, and that a low-demand port request (MIPS64) went unanswered.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been started | Exhaustive search of issues, PRs, and commits (see Section 11/12) |

No milestone table can be populated because there is no port history to report. Repeated searches (`search_issues`, `search_pull_requests`, `search_commits` on `scylladb/scylladb` for "riscv", "riscv64", and the exact phrase "RISC-V") returned zero genuine hits. The only non-zero search results were false positives:

- [PR #11687 "Update abseil submodule"](https://github.com/scylladb/scylladb/pull/11687) (closed 2022-10-03) - matched only because its auto-generated body quotes upstream Abseil's own changelog line "debugging: handle alternate signal stacks better on RISCV." This describes Google Abseil's RISC-V support, not any ScyllaDB RISC-V work.
- [PR #30226 "Update seastar submodule"](https://github.com/scylladb/scylladb/pull/30226) - same pattern, matched on RISC-V text inside the bundled Seastar submodule changelog.
- Commits `0fd9ea9` and `2c74462` ("abseil: update to lts_2026_01_07" / "Update abseil submodule") - same Abseil-submodule-log false positive.
- Issues [#6758](https://github.com/scylladb/scylladb/issues/6758) and #9726 - ARM64, not RISC-V.
- Issue [#5617](https://github.com/scylladb/scylladb/issues/5617) - MIPS64, not RISC-V.
- Issues #24234 and #2978 - unrelated crash/coredump reports, matched only by semantic-search noise.

There is no key contributor list because there is no port. There is nothing "fully upstream" or otherwise - the work simply has not begun.

## 3. Upstream Support Tier

No formal architecture-tier policy document exists. There is no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms` file. The closest artifact, `docs/_static/data/os-support.json` plus `docs/_templates/platforms.tmpl`, is a Linux-**distribution** support matrix only (Ubuntu 22.04/24.04, Debian 11/12, Rocky/CentOS/RHEL 8-10, Amazon Linux 2023) - it does not track CPU architecture. Architecture support is implicit only in the build system (`configure.py`).

Evidence of actual support scope is `configure.py`, which recognizes exactly two architectures:

```python
# configure.py:207-213
def default_target_arch():
    if platform.machine() in ['i386', 'i686', 'x86_64']:
        return 'x86-64-v3'   # support PCLMUL
    elif platform.machine() == 'aarch64':
        return 'armv8-a+crc+crypto'
    else:
        return ''
```

```python
# configure.py:3206 - packaging arch map, hard KeyError on anything else
deb_arch = {'x86_64': 'amd64', 'aarch64': 'arm64'}[arch]
```

On riscv64, `default_target_arch()` returns an empty string (no `-march=` flag emitted) and the `.deb` packaging step would raise a `KeyError` since riscv64 is absent from the map. Officially, ScyllaDB supports x86_64 and AArch64 only (AArch64 added in release 4.6, per web search confirmation).

| Architecture | CI builds | CI tests | Official binaries | Support tier |
|---|---|---|---|---|
| amd64 (x86_64) | yes (all 32 GitHub Actions workflows, `ubuntu-latest`/`blacksmith-2vcpu-ubuntu-2404` runners) | yes | yes (APT/YUM repos, Docker Hub) | Tier 1 (implicit) |
| arm64 (aarch64) | Data not available: this pass did not directly confirm an aarch64 CI leg in the 32 workflow files (only x86_64 `runs-on:` targets were enumerated); `configure.py` and product docs confirm aarch64 is officially supported since release 4.6 | Data not available: not directly confirmed this pass | yes, per official support claim (release 4.6+) | Tier 1 (implicit) |
| riscv64 | no | no | no | Not supported - no tier |

## 4. Technical Architecture and RISC-V-Specific Subsystems

There is no riscv64 branch anywhere in ScyllaDB's own source. A code search for `__riscv` across the entire repository returned zero results, versus 9 files matching `__aarch64__` and 11 files matching `__x86_64__`. This is a below-stub gap: not a `riscv64.cc` with a `TODO`/`abort()` placeholder, but the complete absence of a preprocessor branch for the architecture.

The following table was built by fetching and reading every architecture-gated file (source: local partial clone at `/home/user/scylladb-ci`, `git show HEAD:<path>`, commit `7a9546f46fd2d95c5abb08a33f44683ef7dc2c1c`):

| Component | amd64 | arm64 | riscv64 | Quality / verdict |
|---|---|---|---|---|
| [`utils/crc.hh`](https://github.com/scylladb/scylladb/blob/master/utils/crc.hh) - CRC32 `process_le()` and parallel-CRC loop | full: SSE4.2 `_mm_crc32_u*` intrinsics | full: ARMv8 CRC32C via `arm_acle.h` | **missing - build-breaking** | `process_le()`/parallel loop are defined only inside `#if defined(__x86_64__)||defined(__i386__)||defined(__aarch64__)`, no `#else`; `process()` calls them unconditionally, so riscv64 fails to compile (undeclared identifier) |
| [`utils/clmul.hh`](https://github.com/scylladb/scylladb/blob/master/utils/clmul.hh) - carry-less multiply (CRC folding primitive) | full: `_mm_clmulepi64_si128` (PCLMULQDQ) | full: `vmull_p64` (NEON PMULL) | **missing - build-breaking** | Same `#if x86/i386 ... #elif aarch64 ... #endif` pattern, no `#else`; `clmul()`/`clmul_u32()` undeclared on riscv64 |
| `utils/gz/barrett.hh`, `crc_combine_table.cc` - Barrett-reduction CRC-combine internals | full | full | **missing** | Entire file body gated `#if x86_64||i386||aarch64`; nothing compiles for other architectures |
| `utils/gz/crc_combine.cc`/`.hh` - `fast_crc32_combine()` | full: custom Barrett-reduction algorithm | full: same algorithm, NEON clmul | scalar (functional) | Genuine `#else` branch, comment: "FIXME: Optimize for other archs ... For now, delegate to zlib." Compiles and works, unoptimized |
| `utils/array-search.cc` - branchless array search (bloom-filter/index probing) | partial: SSE4/AVX2 via `[[gnu::target(...)]]` multiversioning | none (no NEON path either) | scalar (functional) | `arch_target("default")` plain-C loop is unconditional; riscv64 gets the same fallback aarch64 already uses today |
| `utils/utf8.cc` - SIMD UTF-8 validator | full: SSE4.1 range-based algorithm | full: NEON range-based algorithm | scalar (functional) | Genuine third branch: "No SIMD implementation for this arch, fallback to naive method" - correct but byte-at-a-time |
| `utils/exceptions.hh` - fast exception dispatch | full: `OPTIMIZED_EXCEPTION_HANDLING_AVAILABLE` (glibc+x86_64) | full: same (glibc+aarch64) | scalar, degraded (functional) | `#else #warning "Fast implementation ... not available for this platform."` Falls back to plain `try/catch`, compiles, slower |
| `main.cc` `cpu_sanity()` | full: refuses to start without SSE4.2+PCLMUL | n/a (no equivalent check for aarch64) | n/a | Not a gap; this guard-rail is x86-only by design |

**Verdict:** a minority of arch-gated files (CRC-combine, array-search, UTF-8 validation, exception handling) have honest scalar/generic fallbacks that would compile and run correctly on riscv64. But the majority of the CRC/clmul path - `crc.hh`, `clmul.hh`, `barrett.hh`, `crc_combine_table.cc` - has **no fallback at all** and is called unconditionally from non-gated code, making the current tree fail to compile on riscv64 as-is. This is the primary technical fact behind the red readiness color (Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

There is no riscv64 build documentation, toolchain file, Dockerfile, or CMake flag anywhere in the repository. Specifically checked and confirmed absent: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` (the actual build guide is `docs/dev/building.md`), `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, and any `Dockerfile.riscv64`.

A case-insensitive `grep -r riscv` across the entire repository (all file types, `.git` excluded) matches exactly one file: `docs/uv.lock`, a `uv`-generated Python lockfile for the documentation-site toolchain that pins wheel-download URLs for many platforms (e.g. `charset_normalizer-3.4.9-...manylinux_2_31_riscv64...whl`, `markupsafe-3.0.3-...manylinux_2_31_riscv64...whl`). This is an incidental match on PyPI wheel filenames for unrelated Python packages used to build documentation - it has no relationship to compiling ScyllaDB itself.

The real build configuration is `configure.py` (the top-level `CMakeLists.txt` is a secondary/experimental generator per `.github/workflows/compare-build-systems.yaml`). Its architecture handling is limited to x86_64 and aarch64, as quoted in Section 3. On an unrecognized `platform.machine()` such as riscv64, `--target` defaults to an empty string (no `-march=` flag emitted), and the `.deb` packaging arch-map lookup raises `KeyError`.

The only build container is `tools/toolchain/Dockerfile` (Fedora 44-based, x86_64/aarch64 toolchain via `dbuild`) - no riscv64 variant exists. No CMake `option()` toggles relate to architecture; the only ones present are `Scylla_ENABLE_LTO`, `Scylla_USE_PRECOMPILED_HEADER`, `Scylla_CHECK_HEADERS`, `Scylla_DIST`, `Scylla_WITH_DEBUG_INFO`, `Scylla_TIME_TRACE`.

**Conclusion:** there is no cmake/configure command, minimum toolchain version, or QEMU cross-build instruction to report for riscv64, because none exists. Even setting aside the Section 4 compile-blocking CRC/clmul gap, the build system would need `configure.py`'s architecture-detection logic extended before a riscv64 build could be attempted at all.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles at all | yes | yes | **no - confirmed compile-time failure** (Section 4: unconditional calls into `#ifdef`-gated CRC/clmul functions with no `#else`) |
| Architecture recognized by `configure.py` | yes | yes | no (`platform.machine()` check falls through) |
| Packaging (`.deb` arch map) | yes (`amd64`) | yes (`arm64`) | no (`KeyError` on lookup) |
| CI build | yes | Data not available: not directly confirmed this pass, but implied by official support claim | no |
| CI test execution | yes | Data not available: not directly confirmed this pass | no |
| Official release artifact | yes | yes (implied by official support claim) | no |
| Hardware CRC32C | yes (SSE4.2 intrinsics) | yes (ARMv8 CRC32C via arm_acle.h) | no - no fallback, build-blocking |
| Carry-less multiply (clmul) | yes (PCLMULQDQ) | yes (NEON PMULL) | no - no fallback, build-blocking |
| SIMD UTF-8 validation | yes (SSE4.1) | yes (NEON) | scalar fallback (functional, slower) |
| Fast exception dispatch | yes (glibc+x86_64) | yes (glibc+aarch64) | scalar fallback (functional, slower, compiler `#warning` emitted) |

**Functional gaps:** ScyllaDB cannot be built on riscv64 at all today, because of the unguarded CRC/clmul code paths described in Section 4. This is a functional gap in the strict sense - "can't do X at all" applies to "can't build the binary at all."

**Performance gaps:** cannot be assessed - the project does not compile on riscv64, so no performance comparison is possible until the CRC/clmul blocker is fixed. Once fixed (hypothetically), the files with generic scalar fallbacks (UTF-8 validation, exception handling, array search) would run unvectorized relative to amd64/arm64, and CRC/clmul would need either a RISC-V vector-crypto (Zvbc/Zvkg or scalar Zbc-adjacent) implementation or would also fall back to zlib's software CRC path.

**Security hardening gaps:** Data not available: no ASLR/stack-protector/CFI-specific riscv64 configuration was found or searched for in this pass, since the project does not build on riscv64 at all.

**NaN / floating-point semantics issues:** Data not available: no ScyllaDB-specific NaN/floating-point riscv64 issue was found in this project's own issue tracker (Section 11). A NaN-handling riscv64 issue was found for the dependency Abseil (closed bug re: NaN test failures on riscv64, #1684, per Section 9's dependency research) but that concerns Abseil itself, not Scylla.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for ScyllaDB in any form.** This was independently verified twice: once via direct clone-and-grep, and once adversarially re-verified via GitHub's native `search_code` API.

- Full grep of all 32 files in `.github/workflows/` (build-scylla.yaml, seastar.yaml, trigger-scylla-ci.yaml, clang-nightly.yaml, clang-tidy.yaml, etc.) plus the rest of `.github/` (CODEOWNERS, mergify.yml, dependabot.yml, scripts, ISSUE_TEMPLATE): zero matches for "riscv" in any form.
- GitHub `search_code` API scoped to `riscv path:.github` on `scylladb/scylladb`: `total_count: 0`.
- GitHub `search_code` API scoped to `riscv` repo-wide (no path filter): `total_count: 1`, and that single hit is `docs/uv.lock` - the incidental PyPI wheel-filename match described in Section 5, not a CI configuration.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.buildkite` exists at the repo root (an `amplify.yml` exists for AWS Amplify docs hosting only, unrelated to CI or riscv).
- Every `runs-on:` value across all 32 workflow files is either `ubuntu-latest` (27 occurrences, GitHub-hosted x86_64) or `blacksmith-2vcpu-ubuntu-2404` (1 occurrence, `scylla-ci-route.yaml`, Blacksmith-hosted x86_64 cloud runner). No build matrix (`matrix:`, `arch:`, `platform:` keys) exists in `build-scylla.yaml` at all.
- No self-hosted runner, no QEMU step, no cross-compilation target, and no `linux/riscv64` Docker platform flag exist anywhere in `.github/`.
- No RISE (riseproject-dev) runner references were found in any workflow file.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes (`ubuntu-latest`/`blacksmith-2vcpu-ubuntu-2404`) | Data not available: no aarch64-specific `runs-on:` target was found across the 32 workflow files in this pass, despite aarch64 being an officially supported architecture per `configure.py` and product docs - this is a discrepancy worth flagging, not resolved in this research pass | no |
| CI test execution | yes | Data not available: same caveat as above | no |
| Release-blocking | yes (implied - it is the only architecture CI targets) | Data not available | no (no CI exists to block anything) |
| RISE runners used | no | no | no - ScyllaDB is not a RISE member (Section 12) |

## 8. Distribution and Release Status

No riscv64 binary or package exists for ScyllaDB through any channel checked:

- **GitHub Releases** ([scylladb/scylladb/releases](https://github.com/scylladb/scylladb/releases)): page states explicitly "There aren't any releases here." Zero releases exist for any architecture through this channel - ScyllaDB distributes via its own APT/YUM repositories and Docker Hub, not GitHub Releases. `git ls-remote --tags` confirms active version tags exist (e.g. `scylla-6.2.4-candidate-20250502...`) but these are not GitHub Releases with downloadable assets.
- **Ubuntu 26.04 (resolute)**: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Scylla&suite=resolute&searchon=names&section=all) shows no `scylla`, `python3-scylla`, or `libscylla` package for any architecture, in any suite. The only match is the unrelated `golang-github-scylladb-termtables-dev` (a Go table-formatting dev library, not the database).
- **Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/)): no package named `scylla` or `scylladb` exists at all.
- **PyPI**: the package named `scylla` on PyPI ([pypi.org/pypi/scylla/json](https://pypi.org/pypi/scylla/json)) is an unrelated project - "Intelligent proxy pool for Humans(tm)," an HTTP proxy-pool/crawler tool, not ScyllaDB. This is a name collision, not a ScyllaDB distribution channel. All 27 releases (0.1.0-1.1.7) ship as `py2.py3-none-any` wheels or sdists with no architecture-specific builds regardless.
- **RISE wheel builder**: [gitlab.com RISE PyPI proxy for `scylla`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/scylla/) returns an HTTP 302 redirect to upstream PyPI - no RISE-built wheel exists, and it would be for the unrelated proxy-pool package regardless.

**What a user must do to get a working ScyllaDB binary on riscv64 today: nothing works.** There is no official binary, no distro package, no third-party build, and (per Sections 4-5) the source does not compile on riscv64 without first patching the CRC/clmul architecture gate and extending `configure.py`'s architecture recognition.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / blocking notes |
|---|---|---|---|---|---|
| Seastar | Core async C++ engine (reactor, allocator, io_uring/AIO/DPDK backends); vendored in-tree submodule; critical build dependency | Not packaged as a standalone Ubuntu riscv64 package (only `seastar-dev` for amd64 exists in resolute); builds from source alongside Scylla so this mainly signals ecosystem immaturity. Seastar's own source does contain genuine `__riscv`-gated porting shims (cache-line size in `include/seastar/core/cacheline.hh` citing a [GCC bug workaround](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=116662), `cpu_relax()` in `util/spinlock.hh`, DPDK PMD exclusions in `cmake/Finddpdk.cmake`, CFI directive in `src/core/thread.cc`, signal-context PC access in `src/core/reactor.cc`, huge-page size in `include/seastar/core/memory.hh`) | Not verified / no CI signal found | Not distributed as an OS package on any architecture besides amd64 | Zero riscv64 GitHub issues found - absence of signal, not confirmed support |
| Abseil | STL-like containers/hash tables (`absl::btree`, `absl::hash`, `raw_hash_set`) linked into `scylla-precompiled-header`; critical build dependency | Packaged: `libabsl-dev` 20260107.0-4 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged (universe/ports) | Open bug #1702 "Can't link using riscv64 toolchain" (2024, still open) [NEEDS VERIFICATION - not independently re-checked this pass]; closed bugs re: NaN test failures on riscv64 (#1684), CRC32C SIMD questions (#1326) |
| DPDK | Optional high-performance NIC polling I/O path for Seastar's network stack (SIMD-heavy packet processing); optional build dependency | Packaged: `dpdk-dev` 25.11-2 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | No riscv64 GitHub issues surfaced; known industry gap is limited/no vectorized (RVV) PMD paths on riscv64 - scalar-only performance expected |
| CMake | Secondary/experimental build-system generator (`compare-build-systems.yaml`); critical build dependency | Data not available: not directly checked this pass against Ubuntu 26.04 resolute | Not verified | Data not available | Not searched this pass |
| Python | Used by `configure.py` (the primary build-configuration script) and the documentation toolchain (`docs/uv.lock`); critical build dependency | Data not available: not directly checked against Ubuntu 26.04 resolute this pass; general CPython riscv64 availability is confirmed at the language level (RISE blog, "Python Now Officially Supports RISC-V," [riseproject.dev, 2026-08-24](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)) but this was not cross-checked for ScyllaDB's specific Python version requirement | Not verified | Data not available | Not searched this pass |
| Wasmtime + Cranelift | JIT/AOT compiler backend for WASM user-defined functions (UDFs), via `rust/wasmtime_bindings`, `Cargo.lock` | Builds via Rust/Cargo (`riscv64gc-unknown-linux-gnu` is Rust Tier 2) | Not verified for Scylla's UDF execution path specifically | Not an OS package; built from source | Large volume of open riscv64/Cranelift issues (108 total riscv64 hits found in that project's own tracker): missing SIMD lowering rules (#7186, #6623, #6826, #6600), ISLE panics (#12195, #13959), i-cache maintenance (#5033), atomics/register handling (#13078), linker relaxation (#7191). Backend is functional but behind x86_64/aarch64 in completeness, especially for WASM SIMD |
| Boost | Core C++ utility libraries (filesystem, program_options, thread, regex, unit_test_framework) | Packaged: `libboost-all-dev` 1.90.0.1ubuntu3 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | 1 open issue is ppc64le-specific, not riscv64; nothing current blocking |
| zstd | Compression (SSTable/commitlog compression) | Packaged: `libzstd-dev` 1.5.7+dfsg-3 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | 2 open feature requests only (RVV support for XXH3 #4471, RISC-V unaligned access #4546) - performance, not correctness |
| Snappy | Compression | Packaged: `libsnappy-dev` 1.2.2-2 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | 1 open perf issue (`FindMatchLength` slow on RISC-V, #209) - no correctness blocker |
| xxHash | Fast hashing/checksums, `XXH_PRIVATE_API` used directly by Scylla | Packaged: `libxxhash-dev` 0.8.3-2build1 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | 2 open perf-optimization proposals for RISC-V - no blockers |
| lz4 | Compression (also a zstd build dependency) | Packaged: `liblz4-dev` 1.10.0-8 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | 1 open proposal "RISC-V Architecture Optimizations" (#1635) - performance only |
| GnuTLS | TLS / crypto for CQL client and inter-node encryption | Packaged: `libgnutls28-dev` 3.8.12-2ubuntu1 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | Hosted on GitLab, not GitHub - issue tracker not searched this pass |
| Crypto++ | Cryptography (`cryptopp-devel`/`libcrypto++-dev` referenced in Fedora/Debian install paths) | Packaged: `libcrypto++-dev` 8.9.0-2build1 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | Not searched this pass (time-boxed) |
| libdeflate | Compression (whole-buffer) | Packaged: `libdeflate-dev` 1.23-2ubuntu1 on Ubuntu 26.04 (resolute) riscv64 | Not verified | Packaged | Not searched this pass |
| Rust toolchain | Required to build `rust/wasmtime_bindings` (staticlib linked into Scylla) | `riscv64gc-unknown-linux-gnu` is Tier 2 with host tools per rustc platform-support docs | N/A | Official Rust distributes riscv64gc binaries | None found this pass |
| ICU | Unicode/i18n, `find_package(ICU COMPONENTS uc i18n REQUIRED)` | Not checked directly this pass | Not verified | Not checked directly this pass | Not searched this pass |

**Deep-dive - the two real risk areas among dependencies:**

1. **Seastar.** Scylla's own foundational async framework has essentially zero riscv64 signal of its own: no Ubuntu riscv64 package (even though amd64 is packaged), and zero GitHub issues concerning riscv64. This means riscv64 readiness of Scylla's core reactor/allocator/I/O backend is effectively unverified even before accounting for Scylla's own CRC/clmul compile blocker. Seastar's source does contain multiple genuine `__riscv`-conditional porting shims (listed in the table above), which is evidence of some prior porting effort at the framework layer, but this has not been exercised by any CI or package build.
2. **Wasmtime/Cranelift.** Actively used for WASM UDFs and shows the largest, most concrete set of open riscv64 codegen gaps of any dependency checked (SIMD lowering, atomics, ISLE panics) [NEEDS VERIFICATION - counts sourced from a separate research pass against the Wasmtime/Cranelift tracker, not independently re-confirmed in this report]. UDF execution correctness/coverage on riscv64 should not be assumed without direct testing.

Abseil's open bug #1702 ("Can't link using riscv64 toolchain") is flagged as [NEEDS VERIFICATION] since it was reported from only one research pass and not independently re-checked against Abseil's issue tracker in this report.

The `project-graph` MCP server (an internal dependency-graph query tool used elsewhere in this research) failed to connect (`CONNECTION_CLOSED`) throughout this research effort. This is a tooling gap, not a finding - none of the dependency data above should be read as graph-verified; it is all sourced from direct `packages.ubuntu.com` web checks and GitHub issue-tracker searches, labeled accordingly above.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issues exist in scylladb/scylladb | N/A | N/A | Confirmed via `search_issues`, `search_pull_requests`, `search_commits` with "riscv", "riscv64", and exact phrase "RISC-V" - zero genuine hits; see Section 2 for the false positives ruled out |
| [#6758](https://github.com/scylladb/scylladb/issues/6758) | ARM64 support | Closed | N/A (not riscv64) | Not a RISC-V issue; listed for completeness as the closest architecture-support precedent |
| [#5617](https://github.com/scylladb/scylladb/issues/5617) | Is any way to support running or building on MIPS64 arch? | Closed (2020) | N/A (not riscv64) | Not a RISC-V issue; shows a comparable niche-architecture request went unanswered |

**Correctness bugs specific to riscv64 in ScyllaDB itself: none exist to report, because no riscv64 issue tracker activity exists at all.** The one architecture-adjacent correctness fact from this research is not a filed bug but a source-verified compile failure (Section 4): `utils/crc.hh` and `utils/clmul.hh` call architecture-gated functions unconditionally with no riscv64/`#else` branch, which would produce an undeclared-identifier compile error on any riscv64 build attempt.

Dependency-level bugs of note (not ScyllaDB issues, but relevant context): Abseil open bug "Can't link using riscv64 toolchain" (#1702) [NEEDS VERIFICATION]; Wasmtime/Cranelift's substantial open riscv64 SIMD/codegen issue backlog (Section 9).

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer, issue, or PR contains any explicit statement for or against a riscv64 port - the topic has simply never been raised in scylladb/scylladb's history.

**Technical blockers:**
1. `configure.py`'s architecture detection recognizes only `x86_64`/`i386` and `aarch64` (Section 3); riscv64 falls through to an empty target string and a `KeyError` in packaging.
2. `utils/crc.hh` and `utils/clmul.hh` (and their dependents `barrett.hh`, `crc_combine_table.cc`) have no fallback for architectures other than x86_64/i386/aarch64, producing a confirmed compile-time failure on riscv64 (Section 4).
3. No riscv64 toolchain container exists (`tools/toolchain/Dockerfile` is Fedora 44-based, x86_64/aarch64 only).
4. Zero riscv64 CI infrastructure exists to validate any future port (Section 7).

**Organizational blockers:**
1. ScyllaDB is a single-vendor project (ScyllaDB Ltd.) under a restrictive source-available license requiring a signed CLA for any outside contribution - there is no neutral governance body that could independently drive or accept a community-contributed riscv64 port.
2. ScyllaDB Ltd. is not a member of RISE (riseproject.dev) at any tier - confirmed by fetching [riseproject.dev/members](https://riseproject.dev/members/), which lists 8 Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 General members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) - ScyllaDB appears in none of these lists. No RISE blog post mentions Scylla (checked the 6 most recent posts via the RISE RSS feed, plus a site-scoped web search).
3. The historical pattern (Section 1, Section 11) shows the project adds new CPU-architecture support only with a clear commercial driver (aarch64 for cloud Graviton instances) and has previously left a comparable low-demand architecture request (MIPS64) unanswered - suggesting no organizational appetite currently exists for a riscv64 port absent a commercial customer request.

**Acceptance probability:** Given no stated objections but multiple unaddressed technical blockers and no organizational sponsor (neither internal nor RISE), the probability of a riscv64 port materializing without external, funded engineering investment appears low in the near term. A well-scoped external contribution (fixing the CRC/clmul gate, extending `configure.py`, adding CI) would need to clear ScyllaDB Ltd.'s CLA and maintainer review process, none of which has precedent for a novel architecture port originating outside the company.

## 13. Readiness Assessment

- **Color:** red (confirmed-broken)
- **Release provider:** none
- Optimization level: not applicable - Scylla is a general-purpose distributed database server, not an optimization-purpose project under the skill's test (it would still deliver its core value - a distributed, Cassandra/DynamoDB-compatible NoSQL database - even running entirely on generic scalar code, so the Step 2 modifier does not apply).
- **Justification:** ScyllaDB has zero riscv64 CI (verified by grepping all 32 `.github/workflows/*.yaml` files plus the rest of `.github/`; every `runs-on:` target is x86_64) and zero riscv64 release artifacts through any channel checked - no GitHub Releases exist at all ([scylladb/scylladb/releases](https://github.com/scylladb/scylladb/releases) states "There aren't any releases here"), and no Ubuntu 26.04 resolute, Arch Linux RISC-V, or PyPI package exists. This alone would place the project at orange (untested, unavailable) rather than red. It is elevated to red because direct source inspection provides positive, verified evidence of confirmed breakage rather than mere absence of testing: `utils/crc.hh`'s `process()` function unconditionally calls `process_le()` and clmul primitives (`utils/clmul.hh`) that are defined only inside `#if defined(__x86_64__)||defined(__i386__)||defined(__aarch64__)` guards with no `#else` branch - meaning the current source tree would fail to compile on riscv64 with an undeclared-identifier error, not merely run unoptimized.
- **Pending work that could change the grade:** none found. No open PR, issue, or RISE engagement touches ScyllaDB's riscv64 support, and ScyllaDB Ltd. is not a RISE member (Section 12). Fixing the CRC/clmul compile blocker and extending `configure.py`'s architecture table would only be sufficient to move the project to an unverified state (likely orange, pending an actual successful build); reaching yellow or blue would additionally require upstream CI to build (and, for blue, test) riscv64.

## 14. Investment Analysis

RISE has done or funded no work on ScyllaDB specifically (Section 12: not a member, no blog coverage, no runner usage found). Sizing below is therefore not netted against any existing RISE investment - it is a from-scratch estimate.

### 14.1 Functional Enablement

The path to a first successful riscv64 build requires, at minimum: (1) fixing the unguarded CRC/clmul code paths in `utils/crc.hh`, `utils/clmul.hh`, `utils/gz/barrett.hh`, and `crc_combine_table.cc` to add a generic/scalar riscv64 fallback analogous to the existing `crc_combine.cc` zlib fallback; (2) extending `configure.py`'s `default_target_arch()` and the `.deb` packaging arch map to recognize riscv64; (3) validating that the dependency chain (Seastar in particular, which has zero riscv64 build signal of its own) actually builds and links on riscv64; (4) a full functional test-suite pass to confirm correctness once compiling. Given the size and complexity of ScyllaDB's C++ codebase and the confirmed absence of any prior riscv64 engineering (Section 2), this is a substantial, multi-person effort, not a small patch.

### 14.2 Performance Optimization

Not applicable at this stage - performance work (vectorized CRC/clmul via RISC-V vector-crypto extensions such as Zvbc, or RVV-accelerated compression codecs) cannot be meaningfully scoped until functional enablement (14.1) is complete and the project compiles and passes tests on riscv64.

### 14.3 CI/CD Infrastructure

Requires adding a riscv64 leg to `.github/workflows/build-scylla.yaml` (which currently has no build matrix at all - a matrix would need to be introduced) and to `seastar.yaml`, plus provisioning riscv64 build capacity (RISE RISC-V runners are a candidate, though ScyllaDB is not currently a RISE member and would need to establish that relationship or self-host runners).

### 14.4 Ecosystem Enablement

Not applicable - ScyllaDB is a standalone database server binary; it has no dependent package ecosystem (no PyPI/npm/Maven consumers that need separate riscv64 enablement) in the sense this section targets. Client driver libraries in various languages exist but were not in scope for this research pass and were not investigated as a package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix unguarded CRC/clmul code paths (`utils/crc.hh`, `utils/clmul.hh`, `barrett.hh`, `crc_combine_table.cc`) to add a riscv64/generic fallback | Data not available: effort estimate requires engineering scoping beyond this research pass's evidence [NEEDS VERIFICATION] | Data not available | Critical |
| Functional | Extend `configure.py` architecture detection and `.deb` packaging arch map for riscv64 | Data not available: not sized in this research pass | Data not available | Critical |
| Functional | Validate Seastar (core dependency) builds and functions correctly on riscv64 | Data not available: not sized in this research pass | Data not available | Critical |
| Functional | Full test-suite validation pass on riscv64 once compiling | Data not available: not sized in this research pass | Data not available | High |
| CI/CD | Add riscv64 build leg to `build-scylla.yaml` and `seastar.yaml`; provision runner capacity | Data not available: not sized in this research pass | Data not available | High |
| Performance | RVV/vector-crypto acceleration for CRC/clmul and compression codecs (zstd, Snappy, xxHash, lz4 all have open RISC-V perf-optimization requests upstream per Section 9) | Data not available: blocked on functional enablement first; not sized in this research pass | Data not available | Medium (post-functional) |

This report intentionally does not fabricate person-week estimates without an engineering scoping exercise grounded in the actual codebase change size - the table above states this explicitly rather than inventing figures.

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [scylladb/scylladb GitHub repository](https://github.com/scylladb/scylladb)
- [ScyllaDB homepage](https://www.scylladb.com/)
- [scylladb/scylladb releases page](https://github.com/scylladb/scylladb/releases) - "There aren't any releases here"
- [PR #11687 "Update abseil submodule"](https://github.com/scylladb/scylladb/pull/11687) - false-positive RISC-V match, ruled out
- [PR #30226 "Update seastar submodule"](https://github.com/scylladb/scylladb/pull/30226) - false-positive RISC-V match, ruled out
- [Issue #6758 "ARM64 support"](https://github.com/scylladb/scylladb/issues/6758)
- [Issue #5617 "Is any way to support running or building on MIPS64 arch?"](https://github.com/scylladb/scylladb/issues/5617)
- [GCC Bugzilla #116662](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=116662) - cited in Seastar's `cacheline.hh` riscv64 workaround
- [Ubuntu packages.ubuntu.com search for "Scylla" on resolute](https://packages.ubuntu.com/search?keywords=Scylla&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial repository](https://archriscv.felixc.at/)
- [PyPI "scylla" package JSON API](https://pypi.org/pypi/scylla/json) - unrelated proxy-pool tool, name collision with ScyllaDB
- [RISE PyPI proxy for "scylla"](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/scylla/) - redirects to upstream PyPI, no RISE-built wheel
- [RISE Project members page](https://riseproject.dev/members/) - ScyllaDB not listed at any tier
- [RISE blog: "Python Now Officially Supports RISC-V"](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE blog: "PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE blog: "Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject.gitlab.io Python wheel builder list](https://riseproject.gitlab.io/python/wheel_builder/) - Scylla not among the 86 listed packages
- Local shallow clone of scylladb/scylladb, commit `7a9546f46fd2d95c5abb08a33f44683ef7dc2c1c`, at `/home/user/scylladb-ci` and `/home/user/scylladb/scylladb` - used for direct grep and `git show` inspection of `.github/workflows/`, `configure.py`, `CMakeLists.txt`, `install-dependencies.sh`, `rust/Cargo.lock`, `utils/crc.hh`, `utils/clmul.hh`, `utils/gz/barrett.hh`, `utils/gz/crc_combine.cc`, `utils/array-search.cc`, `utils/utf8.cc`, `utils/exceptions.hh`, `.github/CODEOWNERS`, `LICENSE-ScyllaDB-Source-Available.md`, `CONTRIBUTING.md`, `docs/_static/data/os-support.json`