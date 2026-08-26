---
title: RedisTimeSeries
---

# RedisTimeSeries

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for RedisTimeSeries<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

RedisTimeSeries is a Redis module that adds a native time-series data structure to the Redis server. It provides ingestion, compaction (downsampling), filtering, and range query operations on time-series data exposed through the Redis Serialization Protocol.

**Current status:** Starting with Redis 8, the time-series data structure was merged into the main [redis/redis](https://github.com/redis/redis) repository. The [RedisTimeSeries/RedisTimeSeries](https://github.com/RedisTimeSeries/RedisTimeSeries) repository is now effectively archived as a standalone loadable module and is no longer independently released. Any future platform enablement work must target `redis/redis`, not this repository.

**Governance:** The project is owned entirely by Redis Ltd. (formerly Redis Labs). There is no foundation affiliation (not CNCF, Linux Foundation, Apache, or any other neutral body), no steering committee, and no public roadmap process beyond GitHub issues. The CODEOWNERS file assigns `* danni@redislabs.com` as the sole designated reviewer. All contributions require signing a Contributor License Agreement that assigns IP to Redis Ltd.

**Corporate sponsors:** All significant contributors are Redis Ltd. or Redis Labs employees: LiorKogan (343 commits), gkorland (160 commits), rafie/Rafi Einstein (114 commits), filipecosta90/Filipe Oliveira (78 commits), danni-m/Danni Moiseyev (51 commits). No external corporate contributors of note exist.

**License:** RSALv2 / SSPLv1 (pre-Redis 8) and RSALv2 / SSPLv1 / AGPLv3 (Redis 8 forward, tri-license). RSALv2 and SSPLv1 are source-available but not OSI-approved open source licenses.

**Community stance on new ports:** No formal tier policy. The README states only that 32-bit systems are unsupported. The Makefile actively enforces a hard build error for any architecture other than x64 or arm64v8. Given the corporate-only maintainer base, CLA requiring IP assignment, no community governance, and source-available licensing, there is no mechanism by which external contributors can drive a RISC-V port without Redis Ltd. engineering engagement.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Never | No RISC-V port started, no issue filed, no PR opened | GitHub issue/PR/commit search: 0 results for "riscv" or "riscv64" |
| 2025-11-05 | PR #1804 opened: bumps cpu_features to v0.10.1, which adds riscv to that dependency's arch detection as a side-effect | [PR #1804](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1804) |
| 2025-11-09 | PR #1804 closed without merging due to multiple build system errors flagged by cursor[bot] | [PR #1804](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1804) |

No RISC-V port exists. No contributor from any organization has submitted work toward riscv64 support. The only tangentially related item is the unmerged dependency bump PR #1804, which incidentally included riscv architecture detection in a third-party submodule. That change did not land.

No key contributors with RISC-V involvement. Not upstream.

## 3. Upstream Support Tier

No formal tier policy is documented. The effective supported matrix, derived from the CI and Makefile, is:

| Architecture | CI | Official Binaries | Makefile Guard | Support Level |
|---|---|---|---|---|
| x86_64 (amd64) | Yes - ubuntu-22.04, ubuntu-24.04 | None released (no assets on any release) | Permitted | Primary |
| aarch64 (arm64) | Yes - ubuntu-24.04-arm runners | None released | Permitted | Secondary |
| riscv64 | No | None | Hard error (`$(error)`) | Unsupported |

The Makefile arch detection maps `x86_64`/`amd64` to `x64` and `aarch64`/`arm64` to `arm64v8`. The string `riscv64` is not mapped and falls through to an explicit fatal error. This is not an oversight - the guard was added intentionally.

Note: GitHub releases for v1.12.14, v1.10.24, v1.8.23, v1.12.9, and v1.10.20 all have zero attached binary assets. There are no official pre-built binaries for any architecture from the GitHub release mechanism; users are expected to build from source or use the Docker images.

## 4. Technical Architecture and RISC-V-Specific Subsystems

RedisTimeSeries has one performance-critical subsystem with architecture-specific implementations: the MAX/MIN aggregation compaction path. All other code is generic C with no architecture-specific paths.

**Compaction SIMD (MAX/MIN aggregation)**

The `src/compactions/` directory contains 9 x86-specific SIMD implementations using Intel intrinsics (`<immintrin.h>`): SSE, SSE2, SSE3, SSE4.1, SSE4.2, SSE4a, AVX, AVX2, AVX512F. Runtime dispatch occurs in `src/compaction.c` via `initGlobalCompactionFunctions()`, gated on `#if defined(__x86_64__)`. On all other architectures, the dispatch function selects the scalar fallback `MaxAppendValuesVec` at compile time.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU feature detection | Full: AVX2 + AVX512F runtime detection via cpu_features | Stub: always returns NULL | Stub: always returns NULL |
| MAX/MIN aggregation | 9 hand-tuned SIMD variants (SSE through AVX512F), runtime dispatch | Scalar only (no NEON path implemented) | Scalar only (no RVV path) |
| Compaction dispatch | Runtime CPU dispatch | Compile-time scalar fallback | Compile-time scalar fallback |
| Architecture-specific files | 30 files (arch_features.c/.h + 9 pairs of .c/.h for SSE/AVX) | 0 files | 0 files |

**`#ifdef __riscv`:** 0 results across the entire repository. No riscv64-specific code exists anywhere.

**`#ifdef __aarch64__`:** 0 results. Arm64 is also scalar-only, which establishes that RedisTimeSeries has never invested in post-x86 SIMD.

**Arch feature detection (`src/utils/arch_features.h`):** The `X86Features` struct has two fields (`avx2`, `avx512f`). The `getArchitectureOptimization()` function is conditionally compiled only under `#ifdef CPU_FEATURES_ARCH_X86_64`. On riscv64, the struct is a stub typedef with two dummy int fields and the function always returns NULL.

No JIT, crypto, GC barriers, or other architecture-sensitive subsystems exist in RedisTimeSeries beyond the SIMD compaction path described above.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make wrapping gcc/clang via the `readies` mk framework. CMake is used only for two vendored dependencies: `build/cpu_features/` and `build/dragonbox/`. There is no top-level CMakeLists.txt.

**Hard architecture block in Makefile:**

```makefile
ARCH:=$(shell uname -m | tr '[:upper:]' '[:lower:]' \
  | sed -e 's/^x86_64$$/x64/' \
        -e 's/^amd64$$/x64/' \
        -e 's/^aarch64$$/arm64v8/' \
        -e 's/^arm64$$/arm64v8/')

ifneq ($(ARCH),x64)
ifneq ($(ARCH),arm64v8)
$(error RedisTimeSeries only supports 64-bit architectures (x64, arm64v8). Current architecture: $(ARCH))
endif
endif
```

`riscv64` is not in the sed substitution table. Any `make build` on riscv64 fails immediately with the fatal error above.

**CMake toolchain files:** No `cmake/` directory exists at the repository root. The vendored `build/cpu_features/` CMakeLists.txt (version 0.6.0, pinned) lists supported processors as mips, arm, aarch64, x86, power and emits `FATAL_ERROR "Unsupported architectures ${CMAKE_SYSTEM_PROCESSOR}"` for everything else including riscv64.

**cmake installer script (`.install/install_cmake.sh`):** Provides cmake binaries only for `x86_64` and `aarch64`. On riscv64, the script falls to the `else` branch and silently downloads the aarch64 binary, which will fail at execution. [NEEDS VERIFICATION - script logic inferred from conditional structure]

**QEMU:** No QEMU-based cross-compilation or emulation infrastructure exists anywhere in the repository.

**Required toolchain:**
- GCC: devtoolset-11 (GCC 11) sourced when available via `.github/actions/build-module-and-redis/action.yml`
- cmake >= 3.25.1 (from `.install/install_cmake.sh`)
- No explicit minimum Clang version documented

**Cross-compilation:** Not documented or tested for any target architecture. No cross-compilation flags, toolchain files, or sysroot configuration exists.

**Steps to attempt a riscv64 build (after fixing the Makefile guard):**

1. Patch `Makefile`: add `riscv64` to the arch sed table and either remove the guard or add `riscv64` as a permitted value
2. Patch `build/cpu_features/CMakeLists.txt` (pinned at v0.6.0): add riscv64 handling or update the submodule to a version with riscv64 support
3. Fix `.install/install_cmake.sh`: add riscv64 cmake binary URL or use system cmake
4. Verify that `src/compaction.c` and `src/compactions/*.c` compile cleanly (the x86 SIMD files are conditionally compiled and should be skipped)

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None if the Makefile block is removed. All features (ingestion, compaction, range queries, aggregation, MRANGE, MGET, LABELS, GROUPBY) are implemented in architecture-independent C. The x86 SIMD paths are performance optimizations only and fall through to correct scalar equivalents.

**Performance gaps:**

| Operation | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MAX/MIN aggregation (compaction) | AVX2 or AVX512F SIMD (9 hand-tuned variants, runtime dispatch) | Scalar C loop | Scalar C loop |
| All other operations (ingestion, range query, label filtering) | Scalar | Scalar | Scalar |

The MAX/MIN aggregation SIMD gap between amd64 and riscv64 is real but unquantified - no benchmark data exists for any architecture comparison. The magnitude of the gap depends on compaction workload fraction.

**Security hardening gaps:** Data not available: no audit of compiler hardening flags per architecture was performed during this research.

**Floating-point semantics:** RedisTimeSeries uses double-precision IEEE 754 throughout. The `dragonbox` dependency (jk-jeon/dragonbox) handles float-to-string conversion and is documented as architecture-independent. No floating-point behavioral differences between architectures are expected or documented.

**NaN handling:** Data not available: no riscv64-specific NaN or floating-point edge case testing has been performed.

## 7. CI/CD Infrastructure

All 18 workflow files in `.github/workflows/` were read and confirmed to contain zero instances of "riscv", "riscv64", "rvv", or any RISC-V string.

**`flow-linux.yml`:** The `arch` input accepts `'x64'` or `'arm64'` only. Runner selection: `arm64` maps to `ubuntu-24.04-arm`; everything else maps to `ubuntu-latest` (x86_64). No third branch. No QEMU emulation step.

**`push-docker-images.yml`:** Explicitly constructs a platform list with exactly two entries: `linux/amd64` and `linux/arm64`. No `linux/riscv64`.

**`benchmark-flow.yml`:** Runs on `ubuntu-24.04` x86_64 only, using AWS EC2 instances provisioned with stored credentials. No multi-architecture benchmark runs.

| CI Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (ubuntu-22.04, ubuntu-24.04) | Yes (ubuntu-24.04-arm) | No |
| Test CI | Yes | Yes | No |
| Benchmark CI | Yes (AWS EC2) | No | No |
| Docker image build | Yes (linux/amd64) | Yes (linux/arm64) | No |
| Hardware runners | GitHub-hosted ubuntu | GitHub-hosted ubuntu-arm | None |
| RISE runners | No | No | No |

RISE runner usage: not present. RedisTimeSeries has no RISE project membership and no RISE-provided CI infrastructure.

## 8. Distribution and Release Status

**GitHub releases:** Releases v1.12.14, v1.10.24, v1.8.23, v1.12.9, and v1.10.20 all have zero attached binary assets. No pre-built binaries exist for any architecture from the GitHub release mechanism.

**Docker Hub / OCI images:** Built for `linux/amd64` and `linux/arm64` only. No `linux/riscv64` image.

**PyPI ([redistimeseries 1.4.5](https://pypi.org/project/redistimeseries/)):** This package is the Python client library, not the Redis C module. It ships as `py3-none-any` (pure Python). It installs on riscv64 but is irrelevant to whether the Redis server module operates on riscv64.

**Ubuntu 24.04 (noble):** RedisTimeSeries is not packaged. Search on [packages.ubuntu.com](https://packages.ubuntu.com) returned no results.

**Debian:** [tracker.debian.org/pkg/redistimeseries](https://tracker.debian.org/pkg/redistimeseries) returns HTTP 404. Not tracked in Debian.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=redistimeseries)):** No results. Not present.

**Summary:** There are no pre-built riscv64 binaries for RedisTimeSeries through any distribution channel. A user who needs RedisTimeSeries on riscv64 must build from source after patching the Makefile guard, the cpu_features submodule, and the cmake installer script. Since the project is now merged into Redis 8, the practical path is building `redis/redis` from source on riscv64, not this standalone module repository.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| [google/cpu_features](https://github.com/google/cpu_features) v0.6.0 (pinned) | Runtime CPU feature detection | Blocked - CMakeLists.txt emits FATAL_ERROR for unsupported arches including riscv64 | None | None | v0.10.1+ adds riscv; pinned copy is too old. See `reports/cpu_features.md`. |
| [redis/hiredis](https://github.com/redis/hiredis) | Redis client C library (used by LibMR for cluster comms) | Builds - pure C, no SIMD or arch guards | No riscv64 CI | No riscv64 binary | Issue #1240 assesses porting as "simple" [NEEDS VERIFICATION - issue number from research but content not directly read] |
| [libevent/libevent](https://github.com/libevent/libevent) | Async event loop (used by LibMR) | Builds - pure C, no arch restrictions | No riscv64 CI | No riscv64 binary | Architecture-agnostic. See `reports/libevent.md`. |
| [RedisGears/LibMR](https://github.com/RedisGears/LibMR) | Multi-cluster map-reduce framework | Likely builds - no arch guard found in Makefile | None | None | Depends on hiredis and libevent (both portable). LibMR Makefile has an x86_64 pkg-config path hint, not a guard. |
| [jk-jeon/dragonbox](https://github.com/jk-jeon/dragonbox) | Float-to-string conversion (IEEE 754 correct) | Builds - pure C++, CMake uses ARCH_INDEPENDENT flag | None | None | Algorithm is portable. No arch-specific intrinsics. |
| [lemire/fast_double_parser](https://github.com/lemire/fast_double_parser) | String-to-float parsing | Builds - header-only C++, no arch intrinsics | None | None | Used as `fast_double_parser_c` wrapper. |
| [RedisLabs/RedisModulesSDK](https://github.com/RedisLabs/RedisModulesSDK) (rmutil) | Redis module utility functions | Builds - pure C, no SIMD or arch-specific code | None | None | No riscv64 issues. |
| minunit | Unit testing (macro-only C header) | Builds - no arch dependency | N/A | N/A | No issues. |

**Critical dependency deep-dive: cpu_features**

The vendored copy at `build/cpu_features/` is v0.6.0, pinned via submodule reference added in early 2022. This version's CMakeLists.txt lists five supported architectures (mips, arm, aarch64, x86, power) and emits `FATAL_ERROR "Unsupported architectures ${CMAKE_SYSTEM_PROCESSOR}"` for any other value including riscv64. The upstream library added riscv64 support after v0.6.0, with PRs #447, #368, #369, and #468 still open and issue #247 open since 2022 per `reports/cpu_features.md`. The unmerged PR #1804 in this repository attempted to update to v0.10.1 but was closed with build errors without merging.

This means there are two blocking issues in the cpu_features dependency: (1) the pinned version does not support riscv64 at all, and (2) the upstream riscv64 work itself is not fully merged. Resolving the block requires either backporting riscv64 support into the pinned copy or updating to a version with riscv64 merged upstream.

All other dependencies (hiredis, libevent, LibMR, dragonbox, fast_double_parser, rmutil) are portable C/C++ with no riscv64-specific issues.

## 11. Known Bugs and Active Issues

The following open issues affect correctness or platform portability. None are riscv64-specific.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1453](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1453) | MRANGE: SELECTED_LABELS + GROUPBY returns nil for label values that should be non-nil when all grouped series share the same value | Open | High - correctness bug | Reproducible since April 2023. Affects all platforms including any future riscv64 deployment. Not architecture-specific. |
| [#842](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/842) | make setup fails on Raspberry Pi Buster (armv7/arm32) - paella Python setup error | Open | Medium - build portability | Non-primary arch build failure. Signals build system fragility on non-primary platforms. |
| [#1272](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1272) | Build issue inside Termux/Android (arm64v8): `ushort` unknown type name at compile time | Open | Medium - build portability | Non-standard environment build failure. Signals build system fragility on non-primary platforms. |
| [#1617](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1617) | Performance on CI pruning: faster runs and profiler on demand | Open | Low | CI performance; not correctness. |

**Correctness bug summary:** Issue #1453 is the only confirmed correctness bug. It affects `TS.MRANGE` with `SELECTED_LABELS + GROUPBY` combinations and is present on all supported platforms. Open since April 2023 with no fix merged.

**No riscv64-specific bugs exist** because no one has attempted to build or run RedisTimeSeries on riscv64.

## 12. Objections and Upstream Blockers

**Hard technical blockers (must fix before any riscv64 functionality):**

1. Makefile hard `$(error)` for non-x64/arm64v8 architectures. One-line patch required. No upstream objection on record because no one has proposed the patch.
2. Vendored cpu_features v0.6.0 does not support riscv64. Requires either (a) updating the submodule to a version with merged riscv64 support, or (b) patching the vendored CMakeLists.txt directly. Upstream riscv64 support in cpu_features itself remains incomplete (multiple PRs open, none merged per `reports/cpu_features.md`).
3. cmake installer script does not provide riscv64 cmake binaries.

**Organizational blockers:**

1. The project is effectively archived as a standalone module (merged into Redis 8). Redis Ltd. has no stated interest in maintaining the standalone repo for new platforms. Any riscv64 enablement targeting real-world use must go into `redis/redis`.
2. Redis Ltd. is the sole maintainer. External contributors cannot merge changes without Redis Ltd. approval and CLA signing. No community mechanism exists to drive this work independently.
3. No RISE membership and no RISE-funded work on RedisTimeSeries.
4. Source-available licensing (RSALv2/SSPLv1) limits the range of organizations willing to invest in enabling this project.

**Acceptance probability:** Low for the standalone RedisTimeSeries repository given its archived status. For `redis/redis` (Redis 8), the probability depends on Redis Ltd.'s position on riscv64 support for Redis core, which is outside the scope of this report.

## 13. Investment Analysis

RISE has not funded or contributed any work toward RedisTimeSeries riscv64 enablement. No work needs to be excluded on that basis.

Note: Because RedisTimeSeries is now embedded in Redis 8, investment in the standalone repository is not recommended for production use cases. The analysis below applies to the standalone module and to blocking issues in dependencies that would also affect any Redis 8 riscv64 effort.

### 13.1 Functional Enablement

- Remove Makefile architecture guard and add riscv64 mapping (0.2 person-weeks)
- Update or patch vendored cpu_features submodule to support riscv64 without FATAL_ERROR (0.5 person-weeks; depends on upstream cpu_features riscv64 PRs merging; may require local patch if upstream remains stalled)
- Fix cmake installer script for riscv64 (0.1 person-weeks)
- Validate all modules load and basic functional tests pass on riscv64 (1 person-week)

### 13.2 Performance Optimization

- Implement RVV-based MAX/MIN aggregation compaction to match AVX2 performance tier (3-5 person-weeks; requires RVV intrinsics expertise, benchmarking harness setup on riscv64 hardware)
- Implement riscv64 CPU feature detection in arch_features.c to enable runtime RVV dispatch (0.5 person-weeks; blocked by cpu_features upstream riscv64 support)

### 13.3 CI/CD Infrastructure

- Add riscv64 runner or QEMU emulation step to flow-linux.yml (1 person-week; hardware runner preferred, QEMU acceptable for correctness gating)
- Add linux/riscv64 to push-docker-images.yml platform matrix (0.2 person-weeks)

### 13.4 Ecosystem Enablement

Not applicable. RedisTimeSeries has no significant dependent package ecosystem requiring separate enablement work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Remove Makefile arch guard, add riscv64 mapping | 0.2 | Qualcomm or Redis Ltd. | Critical |
| Functional | Update/patch vendored cpu_features for riscv64 | 0.5 | Qualcomm (cpu_features upstream preferred) | Critical |
| Functional | Fix cmake installer script for riscv64 | 0.1 | Qualcomm | Critical |
| Functional | Basic load and functional test validation on riscv64 | 1.0 | Qualcomm | Critical |
| CI/CD | Add riscv64 CI lane to flow-linux.yml | 1.0 | Qualcomm + Redis Ltd. | High |
| CI/CD | Add linux/riscv64 to Docker image push workflow | 0.2 | Redis Ltd. | High |
| Performance | RVV-based MAX/MIN aggregation compaction | 4.0 | Qualcomm | Medium |
| Performance | riscv64 CPU feature detection (RVV dispatch) | 0.5 | Qualcomm | Medium |

**Total functional enablement:** approximately 1.8 person-weeks.
**Total with CI/CD:** approximately 3.0 person-weeks.
**Total with performance optimization:** approximately 7.0 person-weeks.

**Recommendation caveat:** Given the project's archived status as a standalone module and its absorption into Redis 8, investment in this repository has limited long-term value. The appropriate target for riscv64 investment is `redis/redis` (Redis 8 and later), where these same Makefile, cpu_features, and CI gaps are likely to exist but would benefit the full Redis user base.

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

## 15. References

- [RedisTimeSeries GitHub repository](https://github.com/RedisTimeSeries/RedisTimeSeries)
- [RedisTimeSeries documentation (redis.io)](https://redis.io/docs/data-types/timeseries/)
- [PR #1804: Update cpu_features and fast_parser deps, and add macOS 15](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1804)
- [Issue #1453: MRANGE SELECTED_LABELS + GROUPBY returns nil incorrectly](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1453)
- [Issue #842: make setup fails on Raspberry Pi Buster (armv7/arm32)](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/842)
- [Issue #1272: Build issue inside Termux/Android arm64v8 - ushort unknown type](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1272)
- [google/cpu_features repository](https://github.com/google/cpu_features)
- [google/cpu_features issue #247: RISC-V support](https://github.com/google/cpu_features/issues/247)
- [redis/hiredis repository](https://github.com/redis/hiredis)
- [libevent/libevent repository](https://github.com/libevent/libevent)
- [RedisGears/LibMR repository](https://github.com/RedisGears/LibMR)
- [jk-jeon/dragonbox repository](https://github.com/jk-jeon/dragonbox)
- [lemire/fast_double_parser repository](https://github.com/lemire/fast_double_parser)
- [PyPI: redistimeseries 1.4.5](https://pypi.org/project/redistimeseries/)
- [Debian package tracker - redistimeseries (404)](https://tracker.debian.org/pkg/redistimeseries)
- [Arch Linux RISC-V mirror - redistimeseries search](https://archriscv.felixc.at/?q=redistimeseries)
- [RISE Project homepage](https://riseproject.dev/)
- [redis/redis repository (Redis 8)](https://github.com/redis/redis)