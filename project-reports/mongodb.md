---
title: MongoDB
parent: Project Reports
color: red
---

{% include dependency-graph.html slug="dependencies" subset="mongodb" %}

# MongoDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for MongoDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MongoDB is a document-oriented NoSQL database server developed and controlled by MongoDB, Inc. (NASDAQ: MDB). It is not governed by a foundation (not Apache, not Linux Foundation, not CNCF); all commit and merge authority sits inside GitHub org `mongodb` and the internal engineering org `10gen` (MongoDB Inc.'s original company name).

Governance mechanics, as found in-repo: `OWNERS.yml` (CODEOWNERS-style) scopes every approval path to `10gen/*` teams (`10gen/mongo-default-approvers`, `10gen/server-root-ownership`, `10gen/devprod-build`, `10gen/server-programmability`, `10gen/devprod-test-infrastructure`, `10gen/code-review-team-ssdlc`, `10gen/platsec-server`, `10gen/server-release`, `10gen/devprod-release-infrastructure`). No external or third-party corporate co-maintainers appear anywhere in ownership. `CONTRIBUTING.rst` welcomes community PRs generically but documents no formal governance body, steering committee, or platform-acceptance process.

License: AGPL for versions before Oct 16, 2018, and the Server Side Public License (SSPL) v1 for everything after. SSPL is authored by MongoDB itself, is not OSI-approved, and is not generally classified as open source by Debian/Fedora/OSI. This is relevant to "corporate sponsorship": MongoDB's source availability is a unilateral corporate license decision, not a foundation-mediated one, and there is effectively one company behind the project.

**Community culture on new ports:** No public signal of openness or resistance to a RISC-V port specifically. The absence of any riscv-tagged commits, issues, or wiki references, combined with a closed, single-vendor-controlled `OWNERS.yml` structure and no written new-architecture-acceptance policy, indicates any RISC-V port would have to be championed entirely through informal contributions with no established path or precedent, dependent on 10gen/MongoDB Inc. engineering judgment rather than a documented, foundation-style RFC process.

**RISE membership:** MongoDB, Inc. is not a member of RISE (riseproject.dev). Confirmed current RISE members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent (Premier) and Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision (ByteDance), Institute of Software CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE (General). MongoDB appears in neither tier.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-12-06 | Commit `2752e629`, "SERVER-61929 Add basic riscv64 support" - adds riscv64 to SConstruct `processor_macros`, adds a GCC-10 `is_always_lock_free` static-assert workaround in `atomic_word.h`, adds riscv64 to IntelRDFPMathLib's 64-bit little-endian branch, and flags WiredTiger's SConscript with `RISCV64_HOST`. Author: Andrew Morrow (acmorrow). | [commit](https://github.com/mongodb/mongo/commit/2752e6291178bb3df11f766985061bbba81f3b6d) |
| 2021-12-09 | Commit pushed to master by the internal Evergreen Agent. | same commit |
| 2021-12-15 | Commit `d83f7628`, "Import wiredtiger ... WT-8497 Add support for builds targeting riscv64" - imports upstream WiredTiger's riscv64 build-target support (autoconf/CMake detection, `cmake/configs/riscv64/linux/config.cmake` pinning `-march=rv64imafdc -mabi=lp64d`, `src/checksum/riscv64/crc32-riscv64.c`, riscv64 barrier macros in `include/gcc.h`), targeting WiredTiger release 5.3.0. Author: Luke Chen (lukech). | [commit](https://github.com/mongodb/mongo/commit/d83f762866dd50a02e0416e44c37320ecc3832b3) |
| 2023-09-18 | Community forum post "Assessment of the difficulty in porting CPU architecture for mongodb" reports a codebase scan showing "high complexity" for a RISC-V port due to substantial architecture-specific code; no staff response captured. | [forum thread](https://www.mongodb.com/community/forums/t/assessment-of-the-difficulty-in-porting-cpu-architecture-for-mongodb/245116) |
| 2025-05-28 | Two community forum threads report from-source riscv64 build failures (`hardware_destructive_interference_size` compile error; missing riscv64 wheel for `mongo-ninja-python`); no official MongoDB response found, unresolved as of the latest activity captured (June 2025). | [thread 1](https://www.mongodb.com/community/forums/t/in-risc-v-platform-unable-to-build-mongodb/322388), [thread 2](https://www.mongodb.com/community/forums/t/unable-to-build-mongodb-from-source-code-on-riscv-platform/322387) |
| No follow-up date found | No riscv64 CI, no riscv64 platform target, no riscv64 Dockerfile has been added to the repo since 2021. | repo grep, this report's research |

**Key contributors:** Andrew Morrow (acmorrow, MongoDB Inc.) and Luke Chen (lukech, MongoDB Inc.) - both 2021 commits are internal MongoDB Inc. employees pushed via the Evergreen Agent, not community pull requests. No PRs exist for riscv64 work at all: `search_pull_requests` for `riscv`/`riscv64` against `mongodb/mongo` returns zero results in every query tried, and GitHub Issues are disabled entirely for this repository (confirmed by a zero-hit sanity search on the generic term "test"). MongoDB's real bug/feature tracking is internal JIRA (`jira.mongodb.org`, project SERVER and WT), not readable without authentication; the relevant tickets are SERVER-61929 and WT-8497.

**Is it fully upstream?** Partially and only at the source level. The two 2021 commits landed on `master` and are still present in the current tree (`search_code` for `riscv64` in the live repo returns hits in the modern Bazel config), so the toolchain-glue-level changes are upstream. However, this support was never wired into the current Bazel-based build system that MongoDB now uses (see Section 5), was never given CI coverage, and was never advertised as a supported architecture in `docs/building.md`. No further upstreaming has occurred since December 2021.

## 3. Upstream Support Tier

MongoDB documents no formal, publicly available platform-tier policy (Tier 1/2/3 or equivalent). `docs/building.md` states supported architectures flatly:

> "MongoDB supports the following architectures: arm64, ppc64le, s390x, and x86-64."

riscv64 is absent, with no experimental or in-progress designation. No `SUPPORT.md` exists (404), and no `docs/platforms/` directory was found.

Evidence used to determine tier:
- CI: no `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, or top-level `.cirrus.yml` exist in the repo. MongoDB's real CI is Evergreen (`etc/evergreen.yml`); a full grep of the publicly accessible Evergreen configuration for "riscv" returns zero hits.
- Release-blocking: not applicable, since there is no riscv64 CI job to be release-blocking or not.
- Official binaries: MongoDB's download center lists 19 OS/architecture combinations and zero are RISC-V-based [NEEDS VERIFICATION: exact current list not re-fetched this session, based on prior verification pass].

| Architecture | CI builds | CI tests | Official binary | Tier |
|---|---|---|---|---|
| amd64/x86-64 | yes | yes | yes | supported |
| arm64 | yes | yes | yes | supported |
| ppc64le | yes | yes | yes | supported |
| s390x | yes | yes | yes | supported |
| riscv64 | no | no | no | not supported |

## 4. Technical Architecture and RISC-V-Specific Subsystems

MongoDB's own source tree (`src/mongo/`) has essentially no RISC-V-specific code - one conditional-compile guard in `src/mongo/platform/atomic.h`:

```cpp
#if !defined(__riscv)
    MONGO_STATIC_ASSERT(std::atomic<WordType>::is_always_lock_free);  // NOLINT
#endif
```

This suppresses a static assertion that fails under GCC 10 on riscv64 for small atomic types (e.g. `bool`), rather than fixing the underlying issue. There is no `arch/riscv/` directory anywhere in MongoDB's own tree, no `.S` assembly files, no JIT backend, and no SIMD dispatch for riscv64 in `src/mongo/` (a repo-wide search for the RVV intrinsic type `vfloat32m1_t` returns zero results).

Real RISC-V architecture code exists only in vendored third-party dependencies under `src/third_party/`:

| Component | riscv64 implementation | ISA extensions | Quality |
|---|---|---|---|
| WiredTiger CRC32C checksum | `src/checksum/riscv64/crc32-riscv64.c` (63 lines) | none used | Stub: unconditionally returns the software checksum path (`__wt_checksum_sw`); byte-for-byte identical to the loongarch64 stub. No Zbc/carry-less-multiply use. Additionally **not wired into MongoDB's actual Bazel build** - `WT_FILELIST_RISCV64_HOST` is defined in `dist/filelist.bzl` but never imported by `src/third_party/wiredtiger/BUILD.bazel`, so the file is dead code from the build's perspective. |
| WiredTiger memory barriers | `src/include/gcc.h`, `#elif defined(__riscv) && (__riscv_xlen == 64)` branch | plain `fence`/`nop` | Functionally complete but not perf-tuned: `WT_PAUSE()` uses a bare `nop` instead of the `Zihintpause` extension's `pause` instruction, with an in-code comment stating compiler support for `Zihintpause` did not exist at the time (Dec 2021). |
| SpiderMonkey (mozjs) JS JIT | `src/third_party/mozjs/extract/js/src/jit/riscv64/` - 57 files, ~33,300 lines | I, M, A, F, D, C, Zicsr, Zifencei, and V/RVV (present but gated behind `#ifdef CAN_USE_RVV`, not enabled in this build) | Full, production-grade JIT backend (Assembler, MacroAssembler, CodeGenerator, Lowering, Simulator, Trampoline, Disassembler) - but this is inherited wholesale from upstream Mozilla SpiderMonkey, not MongoDB engineering effort. |
| Boost.Context fiber switching | `libs/context/src/asm/{jump,make,ontop}_riscv64_sysv_elf_gas.S` | RV64 SysV ABI asm | Complete, hand-written assembly. |
| libunwind | `src/third_party/unwind/dist/src/riscv/` (full port: `Gget_save_loc.c`, `Ginit.c`, `Gstep.c`, `getcontext.S`, `setcontext.S`, etc.) | RV64 | Complete arch port including assembly context save/restore. |
| Abseil stack-trace capture | `stacktrace_riscv-inl.inc` (203 lines) | frame-pointer walking | Functional, generic frame-walk implementation. |
| tcmalloc | riscv conditionals in `config.h`, `segv_handler.cc`, `tcmalloc.cc` | none | No dedicated riscv fast paths; falls through generic code. |
| IntelRDFPMathLib (Decimal128) | none needed | n/a | Pure C99, no per-architecture assembly - portable by construction. |

Comparison table, per the color model's optimization lens (for context only - this report does not treat MongoDB as an optimization-purpose project; see Section 13):

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| WiredTiger checksum | SSE4.2 hardware CRC32 intrinsics (full) | inline asm `crc32c*` instructions (full) | scalar software fallback only (stub) |
| SpiderMonkey JIT | full hand-tuned backend | full hand-tuned backend | full backend present (inherited from upstream Mozilla, not MongoDB) |
| Atomics | compiler stock | compiler stock | compiler stock plus one assert-suppression workaround |

## 5. Build System, Cross-Compilation, and Toolchain

MongoDB's build system is Bazel (not CMake/SCons; there is no top-level `CMakeLists.txt` or `SConstruct` in the current tree - those exist only inside vendored `src/third_party/*` libraries). `docs/building.md` states required tooling:

- C++20-capable compiler: GCC 14.2, Clang 19.1, Apple Xcode 16.4, or Visual Studio 2022 17.0
- Python 3.13
- ~13 GB free disk space

Standard build commands (for supported architectures only):
```bash
python buildscripts/install_bazel.py
export PATH=~/.local/bin:$PATH
bazel build install-dist-test
bazel-bin/install/bin/mongod --version
```

**No riscv64 build path exists in this system:**
- `bazel/platforms/BUILD.bazel` (325 lines) defines `platform()` targets for windows (amd64), macos (arm64/amd64), linux ppc64le, linux s390x, and linux arm64/amd64 across a fixed distro list (ubuntu18/20/22/24, amazon_linux_2/2023/2023_3, debian12, rhel8/9/10, suse15), plus wasm32. There is no `linux_riscv64` platform target.
- The hermetic MongoDB toolchain (`bazel/toolchains/cc/mongo_linux/*.bzl`) pins prebuilt GCC/Clang/GDB tarballs from MongoDB's own S3 bucket, keyed per distro; no riscv64 entry exists, so `--platforms` cannot select a working hermetic toolchain for riscv64 even if a platform target existed.
- `buildscripts/install_bazel.py`'s bootstrap logic does not explicitly exclude riscv64 but would attempt to fetch `bazelisk-linux-riscv64` from MongoDB's S3 bucket, a binary very unlikely to exist given the rest of the findings [NEEDS VERIFICATION: not directly tested].
- Only two Bazel helper files reference "riscv64" at all: `bazel/platforms/local_config_platform_extension.bzl` and `bazel/toolchains/cc/mongo_windows/lib_cc_configure.bzl`, both of which are generic host-architecture-name mapping utilities (`if arch in ["riscv64"]: return "riscv64"`), shared identically across aarch64, ppc64le, s390x, and mips64 entries - they do not define any toolchain, platform, or build rule.
- No riscv64 Dockerfile exists (checked `.ci/docker/`, `docker/`, and a code search for `riscv64 filename:Dockerfile` - zero matches). All Dockerfiles in the repo target only the already-supported architectures.
- No QEMU usage for riscv64 appears anywhere in MongoDB's own build/CI tooling (checked `.py/.sh/.yml/.yaml/.bzl/.bazel` outside vendored trees).

**Known build failures (from user reports, not an official issue tracker since GitHub Issues are disabled):**
- Compile failure around `hardware_destructive_interference_size` when building on riscv64/OpenEuler with GCC 12.3.1, glibc 2.38, reported 2025-05-28, unresolved. [Source: forum thread](https://www.mongodb.com/community/forums/t/in-risc-v-platform-unable-to-build-mongodb/322388)
- `mongo-ninja-python`, a build-time Python dependency, ships only prebuilt wheels with no riscv64 wheel and no documented source fallback, per `pyproject.toml`. [Source: forum thread](https://www.mongodb.com/community/forums/t/unable-to-build-mongodb-from-source-code-on-riscv-platform/322387)
- The same thread cites "Mozilla's mozjs (the JS engine MongoDB embeds) has no upstream riscv64 support" as a critical blocker. **This is contradicted by direct source inspection** (Section 4 above), which finds a full ~33,300-line riscv64 JIT backend vendored in `src/third_party/mozjs/extract/js/src/jit/riscv64/`. The discrepancy is unresolved in these findings - it may reflect a build-routing failure (the vendored riscv64 backend not being selected by the build) rather than a true absence of riscv64 code in mozjs. Flagged as a contradiction, not resolved.

**Bottom line:** Getting `mongod` building on riscv64 today would require adding a `platform()` block to `bazel/platforms/BUILD.bazel`, a working cross/hermetic riscv64 toolchain (none published by MongoDB), and importing `WT_FILELIST_RISCV64_HOST` with a `@platforms//cpu:riscv64` select into `src/third_party/wiredtiger/BUILD.bazel` - none of which exist upstream as of the commit examined (`6d990baca59ce7cdddded93409e0266d1ac6a45a`, 2026-09-10).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64/arm64 | riscv64 |
|---|---|---|
| Official build target | yes (docs/building.md) | no |
| Bazel `platform()` definition | yes | no |
| Hermetic toolchain | yes | no |
| CI build | yes | no |
| CI test execution | yes | no |
| Official release binary | yes | no |
| Distro package (current) | yes (multiple) | no (see Section 8) |
| Hardware-accelerated storage checksum (WiredTiger) | yes (SSE4.2 / ARM CRC32 instructions) | no (scalar software fallback, and even that path is disconnected from the current Bazel build) |
| JS JIT (SpiderMonkey) | yes | present in vendored source, build-routing unverified |
| Spin-lock pause optimization | yes (`pause` / `yield`) | no (`nop` placeholder, documented as blocked on compiler support as of Dec 2021) |

**Functional gaps:** Cannot build `mongod`/`mongos` at all through the documented, supported build path - riscv64 is entirely absent from the Bazel platform matrix. Users attempting a from-source build via the older SCons-era entry points report unresolved compile failures as of mid-2025.

**Performance gaps:** Even in a hypothetical successful build, WiredTiger's page checksum - a core, high-frequency storage-engine hot path - would fall back to the generic software CRC32C implementation, versus hardware-accelerated SSE4.2/ARM CRC32 instructions on the officially supported architectures. Spin-lock pausing uses a bare `nop` instead of the `Zihintpause` extension.

**Security hardening gaps:** Data not available: no riscv64-specific hardening (ASLR, stack protector, CFI) documentation or code was found or searched for in this research pass.

**NaN / floating-point semantics issues:** No riscv64-specific NaN or floating-point semantics bug was found in GitHub, JIRA (via a full-text search that returned no RISC-V-relevant hits), or web search for MongoDB or WiredTiger.

## 7. CI/CD Infrastructure

Confirmed by direct repository inspection (live clone, HEAD `6d990baca59ce7cdddded93409e0266d1ac6a45a`):

- `.github/workflows/` does not exist at all in the repo (the only `.github/` content is `actions/pr-approval-recency/`, templates, and ownership files) - there is no GitHub Actions CI of any kind, for any architecture.
- No `.gitlab-ci.yml`, no `Jenkinsfile`, no top-level `.cirrus.yml`.
- MongoDB's actual CI system is Evergreen (`etc/evergreen.yml` plus ~30 included component files). A full grep of `etc/evergreen.yml`, `etc/evergreen_nightly.yml`, `etc/evergreen_timeouts.yml`, `etc/evergreen_lint.yml`, `etc/evergreen-pebt.yml`, and everything under `evergreen/` for "riscv" (any casing) returns zero hits.
- **Critical visibility caveat:** the actual Evergreen build-variant matrix (`etc/evergreen_yml_components/variants/**`, `monguard/.evergreen/*`, `src/mongo/db/modules/atlas/*`) is referenced by `etc/evergreen.yml` but does not exist in this public GitHub mirror - `git ls-files` confirms these paths are absent from the tracked tree. This is MongoDB's internal Perforce-backed monorepo with internal/enterprise-only build-variant definitions filtered out of the public mirror. **If a riscv64 Evergreen build variant exists, it is not visible from the public repository at all** - this is an inherent visibility limit, not a search miss, and is the single largest source of residual uncertainty in this report.
- No RISE runner references (`riseproject-dev`, RISE runner labels) found anywhere in MongoDB's own repo.
- No riscv64 Docker platform matrix entry, no QEMU riscv64 emulation step, found anywhere in the accessible CI configuration.

| Architecture | CI build | CI test | Runner type | RISE runners used |
|---|---|---|---|---|
| amd64 | yes (internal Evergreen, not publicly visible) | yes | native | no |
| arm64 | yes (internal Evergreen, not publicly visible) | yes | native | no |
| riscv64 | not visible / likely none | not visible / likely none | n/a | no |

## 8. Distribution and Release Status

**Official MongoDB Inc. binaries:** The official download center lists architecture/OS combinations including Amazon Linux 2023, Debian 12, macOS, RHEL/CentOS 8/9/10, SUSE 15, Ubuntu 20.04/22.04/24.04, and Windows, across ARM64 and x64 - RISC-V does not appear in any of these. MongoDB does not use GitHub Releases at all (`github.com/mongodb/mongo/releases` returns "There aren't any releases here"), so there are zero GitHub-hosted riscv64 assets by construction.

**PyPI:** No package named `mongodb` exists on PyPI (`https://pypi.org/pypi/mongodb/json` returns HTTP 404) - the actual official Python driver is `pymongo`, a differently-named package not checked for riscv64 availability in this pass since it is driver tooling, not the server.

**RISE wheel builder:** Mirrors the PyPI 404 - no `mongodb` package exists there either, for the same naming reason.

**Ubuntu:** Verified via the authoritative Launchpad API (not the scraped HTML page, which returned repeated 503s):
- Focal (20.04) riscv64: `mongodb-server` version `1:3.6.9+really3.6.8+90~g8e540c0b6d-0ubuntu5.3`, last published 2021-10-04. MongoDB 3.6 is a pre-SSPL, AGPL-era release that MongoDB Inc. itself declared End-of-Life in April 2021.
- Jammy (22.04) riscv64: zero entries. This directly contradicts a RISC-V International blog claim (cited in one research pass) that MongoDB packages are available via Ubuntu 22.04 LTS on riscv64 - that claim is refuted by direct Launchpad API query.
- Noble (24.04) riscv64: zero entries.
- Resolute (26.04) riscv64: zero entries - **no current Ubuntu release ships a MongoDB server package for riscv64.**

**Debian:** `tracker.debian.org/pkg/mongodb` states "This package is not part of any Debian distribution" - MongoDB is not packaged in Debian at all, on any architecture, not just riscv64.

**Arch Linux RISC-V port** (archriscv.felixc.at): MongoDB is not listed at all.

**What a user must do to get a working binary today:** There is none available through any official or distribution channel checked. A user would have to build from source, and the two 2025-05-28 community forum threads document that even this path currently fails with an unresolved compile error.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| WiredTiger | Storage engine (build-dependency, critical) | Vendored copy has `src/checksum/riscv64/crc32-riscv64.c` and `cmake/configs/riscv64/linux/config.cmake`; upstream WiredTiger CMake build recognizes riscv64 as `WT_ARCH` | No public CI evidence found for riscv64 specifically | Not tracked as a standalone release | Not wired into MongoDB's current Bazel build (`WT_FILELIST_RISCV64_HOST` never imported) - dead code from mongo's build perspective |
| SpiderMonkey | JS engine / JIT (build-dependency, critical) | Vendored tree has a full `js/src/jit/riscv64/` backend (~33,300 lines) inherited from upstream Mozilla | Not independently queried; `mongodb-forks/spidermonkey` has 0 GitHub issues (passive mirror) | Tier status unclear | Community forum claims "no riscv64 support" for mozjs, contradicted by source inspection - unresolved discrepancy |
| Bazel | Build system (build-dependency, critical) | No `linux_riscv64` platform target defined; no riscv64 hermetic toolchain | n/a | n/a | This is the binding constraint preventing any riscv64 build today |
| SCons | Build system (build-dependency, optional) | Legacy build system; the 2021 riscv64 commits targeted SCons, which MongoDB has since moved away from | n/a | n/a | Superseded by Bazel; SCons-era riscv64 glue is stale |
| Abseil | Core C++ utility library (build-dependency, critical) | Mixed - riscv64 build/link issues reported upstream (open issue: "Can't link using riscv64 toolchain"; ILP32E stack-alignment gap) | NaN-related test failure fixed upstream | riscv64 supported but rough edges | See project-reports/abseil-cpp.md (color: orange) |
| Boost | Broad C++ utility base, incl. Context (build-dependency, critical) | Boost.Context has hand-written riscv64 assembly (`jump/make/ontop_riscv64_sysv_elf_gas.S`); long-standing mature riscv64 support in practice | Not independently queried this pass | Not independently queried this pass | Registry entry exists in this repo, no dedicated report yet |
| tcmalloc | Memory allocator (runtime-dependency, critical) | No riscv64-specific fast paths; falls through generic code; no riscv64 CI signal found upstream (only aarch64/arm64 threads surfaced) | No riscv64 CI signal | Unclear | See project-reports/tcmalloc.md (color: orange) |
| libunwind | Stack unwinding (build-dependency, optional) | Vendored full riscv port exists (`src/riscv/`, incl. assembly) | Open upstream issue: `Ltest-cxx-exceptions` fails on Ubuntu 20.04 riscv64 | Open upstream issue: CMake build has no riscv64 support at all | See project-reports/libunwind.md (color: blue) |
| gRPC | RPC framework (build-dependency, optional) | History of riscv64 breakage (SIGILL, missing `-latomic`), both now closed/fixed upstream | Fixed upstream per closed issues | Closed issue notes riscv64 Python wheels were not published (packaging gap) | See project-reports/grpc.md (color: yellow) |
| Protocol Buffers | Serialization (build-dependency, critical) | A closed Abseil issue traces a riscv64 protobuf build failure back to Abseil, since fixed | Not independently queried this pass | Not independently queried this pass | Registry entry exists, no dedicated report cited in findings |
| c-ares | Async DNS resolution (build-dependency, optional) | Not independently queried this pass; portable C library | - | - | Data not available: not directly researched this session |
| GCC | Compiler toolchain (build-dependency, critical) | GCC 14.2 required by MongoDB's documented toolchain minimums; GCC's own riscv64 support is mature, but the specific `hardware_destructive_interference_size` build failure was reported against GCC 12.3.1 in the community forum | n/a | n/a | Toolchain version used in the failing forum report (12.3.1) is below MongoDB's stated minimum (14.2) for other architectures - version mismatch may be a contributing factor, not confirmed |
| glibc | Runtime C library (runtime-dependency, critical) | The failing forum build used glibc 2.38; not independently assessed for riscv64-specific gaps in this pass | Data not available | Data not available | glibc riscv64 support is generally considered mature industry-wide, but this was not independently re-verified in this research pass |

Critical vendored dependency deep-dives (WiredTiger, SpiderMonkey) are detailed in Section 4.

## 11. Known Bugs and Active Issues

MongoDB does not use GitHub Issues (disabled repo-wide) and JIRA content is not fetchable without authentication, so there is no ticket-numbered bug list available. The concrete, citable known problems come entirely from MongoDB Community Forum threads:

| ID / Source | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Forum thread](https://www.mongodb.com/community/forums/t/in-risc-v-platform-unable-to-build-mongodb/322388) | "In RISC-V platform Unable to build MongoDB" | Open, unresolved, no staff response found | High (build-blocking) | `hardware_destructive_interference_size` compile failure, GCC 12.3.1/glibc 2.38, OpenEuler riscv64, reported 2025-05-28 |
| [Forum thread](https://www.mongodb.com/community/forums/t/unable-to-build-mongodb-from-source-code-on-riscv-platform/322387) | "Unable to build MongoDB from source code on RISCV platform" | Open, unresolved, updates through 2025-06-18, no staff response found | High (build-blocking) | Missing `mongo-ninja-python` riscv64 wheel with no source fallback; claims mozjs lacks riscv64 support (contradicted by source inspection - see Section 5) |
| [Forum thread](https://www.mongodb.com/community/forums/t/assessment-of-the-difficulty-in-porting-cpu-architecture-for-mongodb/245116) | "Assessment of the difficulty in porting CPU architecture for mongodb" | Open, 2023-09-18, no captured response | Informational | User's own codebase scan found "high complexity" for a RISC-V port due to substantial architecture-specific code |
| JIRA SERVER-61929 | "Add basic riscv64 support" | Presumed resolved/closed (commit landed 2021-12-06/09) | n/a | Content not fetchable without JIRA auth; only known via the commit that references it |
| JIRA WT-8497 | WiredTiger riscv64 build-target support | Presumed resolved/closed (commit landed 2021-12-15) | n/a | Content not fetchable without JIRA auth |

**Correctness bugs, highlighted separately:** No NaN or floating-point-semantics-specific RISC-V bug was found for MongoDB or WiredTiger in any source (GitHub, JIRA full-text search, or web search). The one correctness-adjacent item is the `is_always_lock_free` static-assert suppression for riscv64 in `atomic_word.h` (Section 4) - this is a workaround for a GCC-10 codegen quirk affecting small atomic types, not a data-correctness bug, but it represents an assertion being silently disabled rather than fixed.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No MongoDB Inc. statement, JIRA comment, or forum response explicitly rejects a RISC-V port; the absence is one of omission (riscv64 simply is not on the documented supported-architecture list) rather than active refusal.

**Technical blockers:**
- No riscv64 `platform()` target or hermetic toolchain in the current Bazel build system (Section 5).
- WiredTiger's vendored riscv64 checksum code is disconnected from the actual Bazel build graph.
- An unresolved `hardware_destructive_interference_size` compile failure blocks from-source builds as of the most recent evidence (mid-2025).
- A build-time Python dependency (`mongo-ninja-python`) has no riscv64 wheel and no documented source fallback.

**Organizational blockers:**
- Single-vendor governance (MongoDB Inc./10gen) with no external co-maintainers and no documented new-architecture-acceptance process.
- GitHub Issues disabled and internal JIRA not publicly accessible, so there is no visible, trackable place for the community to file or follow a riscv64 request through to resolution.
- MongoDB is not a RISE member and has received no RISE engineering investment for the server itself (RISE's involvement is limited to Python driver wheels - `pymongo`, `pymongocrypt` - built because "upstream are not yet ready," per the `python-wheels` project README).

**Acceptance probability:** Low to moderate in the near term absent a triggering event. There is no active internal effort (no commits since Dec 2021, no CI wiring added, no RISE relationship), and the path to landing a fix would depend entirely on 10gen/MongoDB Inc. engineering prioritization with no established community RFC channel. A RISC-V vendor or major customer sponsoring the engineering work directly (functional fixes plus CI plus release packaging) is the most plausible path to a status change; grassroots community PRs face a structural headwind given the closed `OWNERS.yml` model and disabled GitHub Issues.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none - no upstream, distro, RISE, or third-party channel currently ships a working riscv64 MongoDB server binary. (RISE's `python-wheels` project builds riscv64 wheels for `pymongo`/`pymongocrypt`, the Python driver, but this is not the MongoDB server and must not be conflated with a server release.)
- MongoDB is not treated as an optimization-purpose project under this framework (it is a general-purpose document database, not a project whose primary value proposition is architecture-tuned speed), so Section 2 of the color model (optimization gap / optimization level) does not apply and is omitted from the header.
- **Justification:** MongoDB has zero upstream riscv64 CI (no `.github/workflows/`, no GitLab CI/Jenkinsfile/Cirrus config, and a full grep of the accessible Evergreen CI configuration returns zero riscv references), and [docs/building.md](https://github.com/mongodb/mongo/blob/master/docs/building.md) explicitly lists supported architectures as "arm64, ppc64le, s390x, and x86-64" with riscv64 absent. No official binary exists on any channel checked, and no current Ubuntu release ships a riscv64 `mongodb-server` package (Launchpad API confirms zero entries for Jammy, Noble, and Resolute; only a stale, EOL, pre-SSPL MongoDB 3.6.9 build from 2021 ever existed and was never carried forward). Two independent [MongoDB Community Forum threads from 2025-05-28](https://www.mongodb.com/community/forums/t/in-risc-v-platform-unable-to-build-mongodb/322388) document unresolved from-source build failures with no official response, which is the deciding fact that moves this from "untested" (orange) to "confirmed broken" (red): the one build path available to a determined user is documented as failing, and that failure is unresolved as of the most recent evidence found.
- **Caveat on confidence:** one research pass found MongoDB's vendored SpiderMonkey carries a full, complete riscv64 JIT backend (~33,300 lines), which is in direct tension with a forum user's claim that "mozjs has no upstream riscv64 support" cited as their build blocker. This discrepancy is unresolved in the available findings and is noted rather than silently reconciled; it does not change the overall color, since the CI/release/distribution facts independently support red, but it does mean the specific root cause of the reported build failure is not fully pinned down.
- **Pending work that could change the grade:** None identified. No open GitHub PR touches riscv64, MongoDB is not a RISE member, no RISE blog post or dedicated riseproject-dev repo covers the MongoDB server, and no engineering activity on riscv64 has been found in the repository since the two December 2021 commits. The only currently active riscv64 work anywhere near the MongoDB ecosystem is RISE's wheel-building for the Python driver (`pymongo`, `pymongocrypt`), which does not touch the server and would not by itself change this grade.

## 14. Investment Analysis

RISE has invested in riscv64 wheel-building for MongoDB's Python driver tooling (`pymongo`, `pymongocrypt`) via `riseproject-dev/python-wheels`, running on RISE's native `ubuntu-24.04-riscv` runners - this work is already done and should not be re-sized. RISE has made no investment in the MongoDB server itself.

### 14.1 Functional Enablement

The immediate blocking work is getting a from-source build working again: resolving the `hardware_destructive_interference_size` compile failure, providing a riscv64 path for the `mongo-ninja-python` build dependency (source build or riscv64 wheel), and reconciling why the vendored SpiderMonkey riscv64 JIT backend is not evidently being used successfully by the reported failing builds. Beyond that, riscv64 needs to be added as a first-class Bazel `platform()` target with a working hermetic or cross-compile toolchain, and WiredTiger's vendored riscv64 checksum code needs to be wired into the current `BUILD.bazel` (importing `WT_FILELIST_RISCV64_HOST` behind a `@platforms//cpu:riscv64` select).

### 14.2 Performance Optimization

Once functional enablement lands, the WiredTiger CRC32C checksum path (currently a pure software fallback) is the clearest performance target, given that x86 and arm64 both have hand-tuned, hardware-accelerated implementations for this same hot path. A second, lower-priority item is replacing the `WT_PAUSE()` `nop` placeholder with the `Zihintpause` `pause` instruction once compiler support is broadly available (the original 2021 commit already flagged this as blocked on toolchain maturity, not a design decision).

### 14.3 CI/CD Infrastructure

No riscv64 CI exists at any layer. Standing up build (and ideally test) coverage in MongoDB's internal Evergreen system is a prerequisite for any of the above work being maintainable long-term, since without it a working riscv64 build would silently regress again exactly as happened after the December 2021 commits. RISE's native riscv64 runner infrastructure (already used for the driver wheel builds) is a plausible, already-proven compute source if MongoDB Inc. or a sponsor chose to stand up such CI, but this would require MongoDB Inc.'s own Evergreen system to gain riscv64 variants, which RISE runners alone cannot substitute for given Evergreen (not GitHub Actions) is MongoDB's actual CI backbone.

### 14.4 Ecosystem Enablement

Not applicable as a distinct workstream for the server itself under this section's scope (Section 10 is omitted for this report - MongoDB the server is not a package-ecosystem project of the kind Section 10 targets). Driver-level ecosystem work (`pymongo`, `pymongocrypt`) is already covered by RISE and is not sized here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Diagnose and fix the `hardware_destructive_interference_size` compile failure on riscv64 | Data not available: no root-cause diagnosis exists yet to size a fix from | MongoDB Inc. (10gen) or sponsor | Critical |
| Functional | Provide a riscv64 path for `mongo-ninja-python` (source build or wheel) | Data not available: scope depends on the package's build complexity, not assessed | MongoDB Inc. / RISE (driver-adjacent precedent exists) | Critical |
| Functional | Add `linux_riscv64` `platform()` target and cross/hermetic toolchain to Bazel build | Data not available: no prior sizing found; comparable arch additions (e.g. s390x) not benchmarked in this research | MongoDB Inc. (10gen) | Critical |
| Functional | Wire WiredTiger's vendored riscv64 checksum file into `BUILD.bazel` | Data not available: small, well-scoped change based on code inspection, but not independently estimated | MongoDB Inc. (10gen) | High |
| Performance | Hardware-accelerated WiredTiger CRC32C for riscv64 (Zbc/carry-less-multiply) | Data not available: not sized | MongoDB Inc. (10gen) | Medium |
| Performance | Replace `WT_PAUSE()` `nop` with `Zihintpause` `pause` instruction | Data not available: small, but blocked on compiler maturity, not effort | MongoDB Inc. (10gen) | Low |
| CI/CD | Add riscv64 build (and ideally test) variant to internal Evergreen configuration | Data not available: internal Evergreen variant definitions are not visible in the public repo, so scope cannot be sized from available research | MongoDB Inc. (10gen), potentially using RISE runner infrastructure | Critical |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [MongoDB commit 2752e629 - "SERVER-61929 Add basic riscv64 support"](https://github.com/mongodb/mongo/commit/2752e6291178bb3df11f766985061bbba81f3b6d)
- [MongoDB commit d83f7628 - "Import wiredtiger ... WT-8497 Add support for builds targeting riscv64"](https://github.com/mongodb/mongo/commit/d83f762866dd50a02e0416e44c37320ecc3832b3)
- [MongoDB docs/building.md (supported architectures)](https://github.com/mongodb/mongo/blob/master/docs/building.md)
- [MongoDB releases page (no releases exist)](https://github.com/mongodb/mongo/releases)
- [MongoDB Community Forum - "In RISC-V platform Unable to build MongoDB"](https://www.mongodb.com/community/forums/t/in-risc-v-platform-unable-to-build-mongodb/322388)
- [MongoDB Community Forum - "Unable to build MongoDB from source code on RISCV platform"](https://www.mongodb.com/community/forums/t/unable-to-build-mongodb-from-source-code-on-riscv-platform/322387)
- [MongoDB Community Forum - "Assessment of the difficulty in porting CPU architecture for mongodb"](https://www.mongodb.com/community/forums/t/assessment-of-the-difficulty-in-porting-cpu-architecture-for-mongodb/245116)
- [RISC-V International blog - "RISC-V Public Beta Platform Release - Database Adaptation Evaluation On RISC-V Server"](https://riscv.org/blog/risc-v-public-beta-platform-release-%C2%B7-database-adaptation-evaluation-on-risc-v-server/)
- [Launchpad - mongodb-server, Ubuntu Focal, riscv64](https://launchpad.net/ubuntu/focal/riscv64/mongodb-server)
- [Debian package tracker - mongodb (not part of any Debian distribution)](https://tracker.debian.org/pkg/mongodb)
- [riseproject-dev/python-wheels - pymongo/pymongocrypt riscv64 wheel-build workflows](https://github.com/riseproject-dev/python-wheels)
- [RISE project members list](https://riseproject.dev/)
- [MongoDB JIRA SERVER-61929 (content not fetchable without auth)](https://jira.mongodb.org/browse/SERVER-61929)
- project-reports/reports/abseil-cpp.md (this repo's registry - color: orange)
- project-reports/reports/tcmalloc.md (this repo's registry - color: orange)
- project-reports/reports/libunwind.md (this repo's registry - color: blue)
- project-reports/reports/grpc.md (this repo's registry - color: yellow)
