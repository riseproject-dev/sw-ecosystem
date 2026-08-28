---
title: RediSearch
parent: Project Reports
---

# RediSearch

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for RediSearch<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

RediSearch is a full-text search, vector similarity, and secondary index module for Redis, implemented as a C-language Redis module with an expanding Rust subsystem. It was created in 2016 by Dvir Volk (dvirsky, now at Google) and Mark Nunberg (mnunberg1). As of Redis 8, the standalone module is being folded into Redis core as the "Redis Query Engine," ending standalone module releases. Ongoing development on the `master` branch targets future major Redis versions.

Governance is corporate-controlled. Redis Ltd. (formerly Redis Labs, formerly Garantia Data) drives all major decisions. Active Redis Ltd. employees dominate the commit log with verified @redis.com email domains (jonathan.keinan@redis.com, ofir.yanai@redis.com, and others). External contributors are present - Magnus Markling (Mandolin Consulting AB), Guillaume Desmottes (gnome.org), Luca Palmieri (Mainmatter), Guy Korland (FalkorDB) - but do not control direction.

License: RSALv2 (Redis Source Available License 2.0) OR SSPLv1 OR AGPLv3 (tri-license, beginning with Redis 8). Prior releases (2.x series) are under RSALv2 and SSPLv1 only. Neither RSALv2 nor SSPLv1 is OSI-approved open source. Community-driven architecture ports are possible under the license terms but any patch contributing RISC-V support must be submitted upstream under these license conditions.

No RISE Project involvement: RediSearch does not appear in the RISE member list, the RISE wheel builder, any RISE blog post, or any RISE working group materials. The RISE package list (80+ packages, fetched directly) does not include RediSearch.

Community stance on new ports: CONTRIBUTING.md focuses on feature contributions and new commands with no mention of architecture porting. Given the in-progress merger into Redis 8 core, the likelihood of the RediSearch team sponsoring a RISC-V port in the standalone module is low. Any RISC-V path would need to route through the upstream Redis core project.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2019 (approx.) | `redis-redisearch` 1.2.2-4 packaged for Debian/Ubuntu, including riscv64 | [Debian tracker](https://tracker.debian.org/pkg/redisearch) |
| February 2025 | `redisearch` 1.2.2 removed from Debian testing, blocked by bug #1091247; remains in unstable/sid | [Debian tracker](https://tracker.debian.org/pkg/redisearch) |
| May-June 2026 | Three Rust refactoring PRs (#9816, #9834, #9839) merged to master; automated bots flag latent riscv64 FFI ABI mismatch; no human response; no tracking issue filed | [PR #9816](https://github.com/RediSearch/RediSearch/pull/9816), [PR #9834](https://github.com/RediSearch/RediSearch/pull/9834), [PR #9839](https://github.com/RediSearch/RediSearch/pull/9839) |

No intentional RISC-V port has ever been started. No contributor with riscv64 as a stated goal has opened an issue or PR. The Debian/Ubuntu 1.2.2 packaging is a distro-driven effort against a version that is approximately five upstream major versions behind the current 2.10.x series and seven years old. There is no ongoing port activity in upstream RediSearch.

---

## 3. Upstream Support Tier

RediSearch publishes no formal platform tier document (no PLATFORMS.md or SUPPORT.md was found in the repository). The supported platform matrix is derived exclusively from CI configuration.

The `flow-build-artifacts.yml` workflow hard-codes architecture choices as `x86_64` and `aarch64`. The `generate-matrix.yml` file, which drives the matrix for all build and test workflows, contains `x86_64` and `aarch64` entries only - `riscv64` is absent. This was confirmed by fetching and searching all 59 GitHub Actions workflow files in `.github/workflows/`.

Supported OS targets for the two official architectures: Ubuntu (20.04/22.04/24.04/26.04), Rocky Linux (8/9/10), Debian (Bookworm/Trixie), Amazon Linux 2023, Azure Linux 3, Alpine 3.23, macOS 14/15/26. 32-bit targets are explicitly unsupported (README).

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Official CI | Yes - PR, nightly, release | Yes - PR, nightly, release | No |
| Official binaries | Yes (module .so per OS/arch/distro) | Yes | No |
| Docker image (redis/redis-stack) | Yes (linux/amd64) | Yes (linux/arm64) | No |
| Release-blocking | Yes | Yes | No |
| Distro packages (current version) | Yes | Yes | No (only v1.2.2 in Debian unstable) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RediSearch's architecture-sensitive subsystems fall into three categories: the VectorSimilarity library (SIMD-critical), Intel SVS (x86-only), and utility functions (hash, compression, float parsing).

**VectorSimilarity (RedisAI/VectorSimilarity, git submodule)**

This is the performance-critical core for all KNN/ANN vector search. The `src/VecSim/spaces/CMakeLists.txt` contains two explicit `CMAKE_SYSTEM_PROCESSOR` branches: one for `x86_64`/`AMD64` (AVX-512F, AVX-512BF16, AVX2, SSE, F16C, etc.) and one for `aarch64`/`arm64` (NEON, NEON+dotprod, NEON FP16/BF16, SVE, SVE2). RISC-V is absent from both branches. No `cmake/riscv64InstructionFlags.cmake` file exists (the repo has `cmake/x86_64InstructionFlags.cmake` and `cmake/aarch64InstructionFlags.cmake`). The `space_includes.h` header includes `cpuinfo_x86.h` under `CPU_FEATURES_ARCH_X86_64` and `cpuinfo_aarch64.h` under `CPU_FEATURES_ARCH_AARCH64`, with no `CPU_FEATURES_ARCH_RISCV` guard.

On riscv64, the build links `VectorSimilaritySpaces_no_optimization` only, compiled from `L2/L2.cpp` and `IP/IP.cpp`. All distance computations (FP32, FP64, INT8, UINT8, BF16, FP16) run as scalar C++. No RVV, Zba, Zbb, or any RISC-V ISA extension is referenced anywhere in VectorSimilarity.

**Intel SVS (intel/ScalableVectorSearch, fetched by VectorSimilarity cmake/svs.cmake at v0.3.2)**

`cmake/svs.cmake` gates `USE_SVS` on `x86_64`/`AMD64` only. On riscv64, the entire Vamana graph index for billion-scale vector search is silently disabled at configure time (`SVS_LVQ_SUPPORTED=0`). The `VecSimAlgorithm_SVS` index type is unavailable on riscv64.

**cpu_features (google/cpu_features v0.10.1, fetched by VectorSimilarity)**

Functional on riscv64 (`impl_riscv_linux.c` merged in v0.9.0). Two open PRs (#447, #448 adding B-ext/half-fp extensions; #468 fixing zicsr/zifencei parsing) indicate incomplete RISC-V extension detection. Does not block compilation but would fail to report RVV capability even if RVV kernels were added.

**siphash.c.inc (dictionary hash)**

The `UNALIGNED_LE_CPU` fast path (unaligned memory reads) is whitelisted for x86-64, AArch64, and a small set of other architectures. riscv64 is not in the whitelist and takes the aligned-read scalar path. Functionally correct; minor performance regression vs x86_64.

**fast_float.h (numeric string-to-float parsing)**

x86_64 uses an SSE2-accelerated path; aarch64 uses NEON. riscv64 falls to the scalar path. Correctly detects 64-bit via `SIZE_MAX=0xffffffffffffffff`. Functionally correct.

**miniz.h (compression)**

`MINIZ_USE_UNALIGNED_LOADS_AND_STORES` is 1 on x86_64 and 0 on aarch64 and riscv64. Scalar path on riscv64. Functionally correct.

**FieldMask FFI type (Rust-C boundary)**

Three merged PRs (#9816, #9834, #9839, merged May-June 2026 to master) introduced a Rust `FieldMask` alias keyed on `target_pointer_width`. Automated review bots flagged a potential riscv64 ABI mismatch (Rust `u128` vs C `uint64_t` via architecture whitelist) at P1 severity on two of the three PRs, and no human reviewer responded before merging. However, the final adversarial check of the committed source reports that the generated C header uses `UINTPTR_MAX` guards and the `cheadergen::config(skip)` directive resolves the type. This finding is contradicted by the PR review record, which states the comments were not addressed before merge and no follow-up issue was filed. The discrepancy between the bot-flagged behavior and the final committed state is unresolved by the available research. [NEEDS VERIFICATION: independent build and ABI check on riscv64 of master branch post-#9839]

**Component summary table**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| VectorSimilarity L2/IP kernels | Hand-tuned AVX-512/AVX2/SSE | Hand-tuned NEON/SVE/SVE2 | Scalar fallback only |
| VectorSimilarity index types | HNSW, FLAT, SVS (Vamana), tiered | HNSW, FLAT, tiered | HNSW, FLAT, tiered (SVS missing) |
| siphash | Unaligned fast path | Aligned scalar | Aligned scalar |
| fast_float | SSE2 | NEON | Scalar |
| miniz | Unaligned | Aligned | Aligned |
| FieldMask FFI type | Correct | Correct | Disputed - see text |
| CPU feature detection | Full CPUID | Full HWCAP | Functional, incomplete extension list |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Declared minimum toolchain versions** (from `.install/min_versions.sh` and `verify_build_deps.sh`):
- GCC: 10
- G++: 10
- CMake: 3.25

No Clang minimum is stated for standard builds. LTO builds (Linux only) require `clang-N` and `clang++-N` where N matches rustc's LLVM major version (currently LLVM 21) plus `lld-N` as the linker.

**Standard build commands:**

```
make build
./build.sh
./build.sh DEBUG=1
make build TESTS=1
LTO=1 make build
```

`build.sh` constructs the CMake invocation with `-UCMAKE_TOOLCHAIN_FILE` as a cache-busting directive (actively unsets any cached toolchain file from a previous build). This is not a cross-compilation hook.

**riscv64 cross-compilation:** No cross-compilation toolchain file exists in the repository. Searches for `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, and `Dockerfile.riscv64` all return 404. No QEMU-based emulation is configured anywhere in the 59 GitHub Actions workflow files. No cross-compilation path for riscv64 is documented or implemented.

**Docker:** The `Dockerfile` at repo root is parameterized via `ARG BASE_IMAGE`. All CI invocations use `ubuntu:noble`, `rockylinux:9`, or `alpine:3.23` base images for x86_64 and aarch64 only. No riscv64 base image variant is used or documented.

**Known build failures on riscv64:** None filed. The absence of CI means no systematic build failure tracking exists for riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Full-text search (inverted index, BM25, TF-IDF) | Yes | Yes | Yes (scalar) |
| Vector search - HNSW | Yes (AVX-512 accelerated) | Yes (NEON/SVE accelerated) | Yes (scalar fallback, severe perf penalty) |
| Vector search - FLAT (brute force) | Yes (AVX-512 accelerated) | Yes (NEON/SVE accelerated) | Yes (scalar fallback, severe perf penalty) |
| Vector search - SVS/Vamana (billion-scale) | Yes (x86-only, Intel library) | No | No |
| Tiered HNSW index | Yes | Yes | Yes (scalar) |
| Geospatial (Boost.Geometry rtree) | Yes | Yes | Yes |
| Numeric range filters | Yes | Yes | Yes |
| Aggregation pipeline | Yes | Yes | Yes |
| JSON integration (ReJSON) | Yes | Yes | Yes (if Redis+ReJSON built for riscv64) |
| LTO build | Yes (Clang/lld) | Yes (Clang/lld) | Data not available: no riscv64 LTO build attempted |
| Sanitizer builds (ASAN, MSAN) | Yes | Yes | Data not available |

**Functional gap:** SVS/Vamana index type is architecturally disabled on riscv64. Users requiring billion-scale approximate nearest neighbor via the `VecSimAlgorithm_SVS` type have no path on riscv64.

**Performance gap:** All vector distance computations (inner product, L2, cosine similarity) on riscv64 use scalar C++ fallbacks. The Redis benchmark blog post reports that multi-threaded Redis Query Engine scales 16x higher throughput vs single-threaded for gist-960 (1M vectors, 960-dim) on x86_64 with AVX-512. That figure reflects SIMD-accelerated distance computation; the riscv64 scalar path will not achieve comparable throughput. No riscv64-specific benchmark data exists - specific throughput regression cannot be quantified from the available research.

**SIGILL risk:** Three open GitHub issues (#3024, #4097, #4402) document `SIGILL` (signal 4) crashes from `FP32_InnerProductSIMD16Ext_SSE_impl` being invoked on CPUs that do not support SSE. The root cause is runtime SIMD dispatch calling SSE code without correct CPU capability guards. On riscv64, where no SSE support exists, this crash path represents a correctness risk if the dispatcher's architecture detection returns a false positive. No riscv64-specific SIGILL bug has been filed, but the preconditions for the same failure mode exist.

---

## 7. CI/CD Infrastructure

All 59 GitHub Actions workflow files in `.github/workflows/` were fetched via the GitHub API and searched for the string "riscv". Zero matches were found across all files. No GitLab CI (`.gitlab-ci.yml`), Jenkins (`Jenkinsfile`), or Cirrus CI (`.cirrus.yml`) configuration was found in the repository.

| CI category | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| PR validation | Yes (ubuntu, rocky, debian, amzn, alpine) | Yes | No |
| Nightly | Yes | Yes | No |
| Release pipeline | Yes | Yes | No |
| Benchmark CI (redisbench-admin) | Yes (explicitly --architectures x86_64,aarch64) | Yes | No |
| RISE-hosted runners | No | No | No |
| QEMU emulation | No | No | No |
| Self-hosted runners | Yes (EC2) | Yes (EC2 Graviton) | No |

The `benchmark-flow.yml` workflow passes `--architectures x86_64,aarch64` explicitly to the redisbench-admin compare step, confirming that benchmark infrastructure is scoped to these two architectures by design.

---

## 8. Distribution and Release Status

**GitHub Releases:** The five most recent releases (v2.10.31, v2.8.38, v2.6.37, v2.10.30, v2.8.37) all have zero binary assets attached. No prebuilt `.so` module files are distributed via GitHub Releases for any architecture.

**Docker Hub (redis/redis-stack):** Published only for `linux/amd64` and `linux/arm64`. No `linux/riscv64` manifest or image exists.

**PyPI (`redisearch` package):** Latest version 2.1.1. Files: `redisearch-2.1.1-py3-none-any.whl` (pure Python, no native code) and `redisearch-2.1.1.tar.gz`. No riscv64-specific wheel. The Python client requires no architecture-specific packaging.

**RISE wheel builder:** The RISE PyPI mirror at gitlab.com/api/v4/projects/56254198/packages/pypi/simple/redisearch/ redirects to pypi.org. RediSearch is not in the RISE wheel builder package list (80+ packages, confirmed absent).

**Ubuntu 24.04 noble:** `redis-redisearch` 1:1.2.2-4 is available in the universe repository with riscv64 listed as a supported architecture alongside amd64, arm64, armhf, ppc64el, and s390x.

**Debian:** `redisearch` 1:1.2.2-4 in unstable/sid. Autopkgtest on riscv64 passes. The package was removed from Debian testing in February 2025 due to bug #1091247 and has not returned. It is blocked from migrating to testing.

**Arch Linux RISC-V:** Not packaged.

| Channel | riscv64 available? | Version | Notes |
|---------|-------------------|---------|-------|
| GitHub Releases | No | N/A | No binary assets in any release |
| Docker Hub | No | N/A | amd64 and arm64 only |
| PyPI | N/A (pure Python) | 2.1.1 | No native code |
| RISE wheel builder | No | N/A | Not listed |
| Ubuntu 24.04 noble | Yes | 1.2.2-4 | Universe repository; v1.x vs current upstream v2.10 |
| Debian unstable/sid | Yes (tests pass) | 1.2.2-4 | Blocked from testing; 7 years behind upstream |
| Arch Linux RISC-V | No | N/A | Not packaged |

A user who needs RediSearch on riscv64 today must build from source at the current 2.x upstream or accept the severely outdated 1.2.2 Debian package. No upstream-supported binary distribution path exists.

---

## 9. Dependencies

**Summary table**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| VectorSimilarity (git submodule, RedisAI/VectorSimilarity) | HNSW/FLAT/tiered vector index, SIMD distance kernels | Compiles (scalar fallback only) | No riscv64 CI | No | No RVV kernels; x86 SIMD dispatch has SIGILL risk if CPU detection fails |
| Intel SVS (intel/ScalableVectorSearch v0.3.2) | Vamana billion-scale vector index | Not built (cmake guard, x86_64 only) | N/A | x86-only | Hard x86 requirement in cmake/options.cmake |
| cpu_features (google/cpu_features v0.10.1) | Runtime CPU capability detection for SIMD dispatch | Builds (riscv impl present since v0.9.0) | Functional; open PRs #447, #468 fix incomplete extension detection | v0.11.0 | Two open correctness PRs; does not block build |
| hiredis (git submodule) | Redis cluster connection client | Builds cleanly | No riscv64 CI | Not tracked | None |
| libuv (git submodule) | Async I/O | Builds cleanly; PRs #5019 and #5177 (both merged) fix riscv64 issues | No riscv64 CI lane | No riscv64 artifact | No blocking issues; riscv64 fixes already merged |
| snowball (git submodule) | Stemming algorithms | Builds cleanly (pure C/algorithm) | No riscv64 CI | N/A | None |
| Boost 1.88.0 (fetched at CMake time) | Boost.Geometry header-only, rtree/spatial indexing | Builds cleanly | N/A | N/A | None |
| OpenSSL (system library) | TLS for hiredis | riscv64 assembly optimizations in OpenSSL upstream; available via apt | Covered by OpenSSL CI | Yes (apt) | None for RediSearch usage |
| jemalloc (indirect, via Redis server) | Default allocator when USE_REDIS_ALLOCATOR=ON | riscv64 support in upstream jemalloc | Upstream coverage | Available | None |
| Rust workspace (~60 internal crates + external) | Inverted index, query engine, trie, numerics, serialization | Rust tier-2 target riscv64gc-unknown-linux-gnu; all external crates (crc32fast, icu4x/icu_casemap, ahash, bumpalo, serde) are portable Rust | Rust tier-2: builds and tests pass, no guaranteed Rust project CI | Rust std/core available | RediSearch's own Rust CI matrix covers x86_64 and aarch64 only |
| googletest (git submodule, test-only) | Unit test framework | Builds on riscv64 | N/A | N/A | None |

**VectorSimilarity deep-dive:** The `getCpuOptimizationFeatures()` helper in VectorSimilarity's dispatch layer returns `cpu_features::X86Features` for any non-AArch64 architecture, including riscv64. This means on riscv64, the dispatcher calls the x86 feature detection path, which on a non-x86 CPU will return all feature flags as false. The scalar fallback should then be selected correctly. However, the three open SIGILL issues (#3024, #4097, #4402) demonstrate that the same dispatch mechanism has produced incorrect results on x86 hardware with disabled SSE, suggesting the guard logic has known bugs. Independent verification that the scalar path is reliably selected on riscv64 hardware is required before production use.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity for riscv64 | Notes |
|----|-------|--------|---------------------|-------|
| #3024 | Server crashed by signal 4, si_code 2 (Redis 7.0.4) | Open | High | SIGILL in FP32_InnerProductSIMD16Ext_SSE_impl; last updated 2025-04-07; demonstrates broken SIMD dispatch guard |
| #4097 | Redis 7.2.1 crashed by signal 4, si_code 2 | Open | High | Same SIGILL pattern as #3024 |
| #4402 | Redis 6.2.13 crashed by signal 4, si_code 2 | Open | High | Same SIGILL pattern; SSE intrinsic called on non-SSE CPU |
| #1707 | Tests fail on PowerPC - big/little endian support | Open | Medium | PPC big-endian test failures; indicates limited non-x86 test coverage in the codebase generally |
| #388 | Compile for armv7 on Raspberry Pi 3 crashes with segfault | Open | Low | Stale (v1.2.0); signal 11 in strlen on armv7; not directly relevant but indicates history of non-tier1 arch issues |
| PR #9839 riscv64 ABI | FieldMask width mismatch (u128 Rust vs uint64_t C on riscv64) | Unresolved (merged without fix) | Medium-High | Flagged P1 by automated bots on PR #9839 and PR #9816; no human response; adversarial check suggests cheadergen skip resolves it but this is contradicted by the PR record; requires independent verification |

**Correctness risk summary for riscv64:** The three SIGILL issues represent the most immediate risk for a riscv64 deployment. They confirm that RediSearch's SIMD dispatch logic has produced incorrect behavior on CPUs without the expected instruction set extensions. A riscv64 bring-up must verify, on hardware or accurate emulation, that the scalar fallback is correctly and consistently selected before any of the SSE or NEON kernel paths are attempted.

---

## 12. Objections and Upstream Blockers

**No stated objections found.** There are zero GitHub issues, PRs, or mailing list threads discussing RISC-V support for RediSearch. The absence of any discussion means there is also no formal rejection - RISC-V simply has not been raised.

**Technical blockers:**

1. VectorSimilarity has no RVV kernel infrastructure. Adding riscv64 SIMD support requires implementing the full set of vectorized distance kernels (FP32, FP64, INT8, UINT8, BF16, FP16 variants of L2 and inner product) as a new architecture branch in `src/VecSim/spaces/CMakeLists.txt` and corresponding `.cpp` files. The x86 and AArch64 implementations provide the pattern; the RVV intrinsics API differs substantially from AVX/NEON.

2. cpu_features riscv64 extension detection is incomplete (open PRs #447, #468). Feature detection must be reliable before SIMD dispatch can be added, or the dispatch table must use a conservative compile-time check rather than runtime detection.

3. Intel SVS will remain unavailable on riscv64. This is a hard architectural dependency on Intel ISA features with no path to RISC-V support from Intel.

4. The FieldMask FFI ABI dispute (PR #9839 and #9816) must be resolved with a definitive build and ABI test on riscv64 before the master branch is declared safe for riscv64.

**Organizational blockers:**

1. The license (RSALv2/SSPLv1/AGPLv3) does not block upstream contributions but limits downstream commercialization. A Qualcomm or third-party RISC-V port would need to be submitted upstream under these terms.

2. The standalone RediSearch module is being sunset in favor of Redis 8 core integration. Any investment should target the Redis 8 upstream codebase rather than the standalone module, to avoid rework.

3. Redis Ltd. has not signaled any intent to support RISC-V and is not a RISE member. Without Redis Ltd. engagement, CI additions and release engineering for riscv64 would need external contributors to maintain runners and build pipelines.

---

## 13. Investment Analysis

RISE has done no RediSearch enablement work. All cost sizing below starts from zero.

### 13.1 Functional Enablement

Minimum to get a riscv64 build of the current 2.x module that passes existing tests on scalar code paths:

- Verify and fix FieldMask FFI ABI on riscv64 (1 person-week): build master on riscv64, run FFI boundary tests, either confirm the cheadergen skip resolves the type mismatch or file and fix a bug.
- Verify SIMD dispatch safety: confirm the three SIGILL-class issues (#3024, #4097, #4402) cannot manifest on riscv64 (1 person-week): instrument the dispatch path, run vector search under ASAN and with a scalar-forced build.
- Update the cmake matrix and CI to include riscv64 as a build target (2 person-weeks): modify `generate-matrix.yml`, `flow-build-artifacts.yml`, and `task-build.yml`; add a riscv64 runner (hardware or QEMU) to the self-hosted runner pool.

### 13.2 Performance Optimization

VectorSimilarity RVV kernel implementation is the dominant performance work:

- Implement RVV 1.0 kernels for FP32 L2 and inner product (the most common vector search types): 6-8 person-weeks for initial implementation, unit tests against scalar reference, and integration with the cmake dispatch system.
- Extend to FP64, INT8, UINT8, BF16, FP16 variants: 6-8 additional person-weeks.
- Add runtime RVV capability detection via cpu_features (depends on cpu_features PRs #447/#468 merging): 1 person-week.
- Performance validation against aarch64 NEON baseline using the existing microbenchmark infrastructure (flow-micro-benchmarks.yml, extended to riscv64): 2 person-weeks.

Intel SVS cannot be ported to riscv64. Users requiring billion-scale Vamana indexing have no mitigation path short of upstreaming an RVV-based graph index, which is out of scope for an initial enablement effort.

### 13.3 CI/CD Infrastructure

- Provision riscv64 self-hosted runner (Scaleway or RISC-V board farm) and integrate with the existing EC2 runner start/stop workflow pattern (`task-start-ec2-runner.yml`/`task-stop-ec2-runner.yml`): 2-3 person-weeks.
- Add riscv64 to nightly and PR validation pipelines: 1 person-week (depends on runner availability).
- No RISE runner infrastructure is currently available for RediSearch; the RISE wheel builder does not cover C-language Redis modules.

### 13.4 Ecosystem Enablement

The PyPI `redisearch` Python client is pure Python (`py3-none-any`). No ecosystem enablement work is needed for the client. The C-language module itself is the only artifact requiring riscv64 build infrastructure. No Section 10 analysis applies.

Updating the Debian/Ubuntu packaging from 1.2.2 to current 2.x for riscv64 is a distro maintenance task requiring the Debian maintainer to update the package. This is outside the RediSearch upstream project's control.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Verify/fix FieldMask FFI ABI on riscv64 | 1 | Upstream contributor | Critical |
| Functional | Verify SIMD dispatch scalar fallback safety (SIGILL risk) | 1 | Upstream contributor | Critical |
| CI/CD | Add riscv64 CI runner and matrix entry | 3 | Upstream contributor + infra | High |
| Performance | VectorSimilarity RVV FP32 L2/IP kernels | 7 | Upstream contributor | High |
| Performance | VectorSimilarity RVV remaining data types (FP64/INT8/UINT8/BF16/FP16) | 7 | Upstream contributor | Medium |
| Performance | cpu_features riscv64 extension detection (unblock PRs #447, #468) | 1 | cpu_features upstream | Medium |
| Performance | Benchmark riscv64 vs aarch64 baseline | 2 | Upstream contributor | Medium |
| Distribution | Debian packaging update (1.2.2 to 2.x, riscv64) | 2 | Debian maintainer | Low |

**Total estimated effort:** 24-26 person-weeks (functional + CI + basic RVV performance). Intel SVS remains permanently out of scope for riscv64.

**Strategic note:** RediSearch is being merged into Redis 8 core. Any investment in the standalone module will need to be rebased against Redis 8's query engine codebase. Timing investment to coincide with the Redis 8 stabilization cycle would minimize rework. Redis Ltd. is not a RISE member; upstream adoption of riscv64 CI and releases requires either Redis Ltd. engagement or a maintained external fork, both of which carry ongoing support costs.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [RediSearch GitHub repository](https://github.com/RediSearch/RediSearch)
- [RediSearch homepage (Redis Query Engine docs)](https://redis.io/docs/interact/search-and-query/)
- [VectorSimilarity repository (RedisAI/VectorSimilarity)](https://github.com/RedisAI/VectorSimilarity)
- [PR #9839 - move redisearch_types.h types to rqe_core crate](https://github.com/RediSearch/RediSearch/pull/9839)
- [PR #9816 - Move more QAST types to Rust](https://github.com/RediSearch/RediSearch/pull/9816)
- [PR #9834 - ttl_table: define FieldExpiration in Rust](https://github.com/RediSearch/RediSearch/pull/9834)
- [RediSearch issue #3024 - signal 4 crash Redis 7.0.4](https://github.com/RediSearch/RediSearch/issues/3024)
- [RediSearch issue #4097 - signal 4 crash Redis 7.2.1](https://github.com/RediSearch/RediSearch/issues/4097)
- [RediSearch issue #4402 - signal 4 crash Redis 6.2.13](https://github.com/RediSearch/RediSearch/issues/4402)
- [RediSearch issue #1707 - Tests fail on PowerPC](https://github.com/RediSearch/RediSearch/issues/1707)
- [RediSearch issue #388 - armv7 segfault](https://github.com/RediSearch/RediSearch/issues/388)
- [Debian tracker for redisearch](https://tracker.debian.org/pkg/redisearch)
- [Ubuntu 24.04 noble - redis-redisearch package](https://packages.ubuntu.com/search?keywords=RediSearch&suite=noble)
- [PyPI - redisearch 2.1.1](https://pypi.org/project/redisearch/)
- [Redis benchmark blog post - vector database comparison](https://redis.io/blog/benchmarking-results-for-vector-databases/)
- [RISE Project member list](https://riseproject.dev/members/)
- [cpu_features PR #447 - RISC-V B-ext and half-fp extensions](https://github.com/google/cpu_features/pull/447)
- [cpu_features PR #468 - zicsr/zifencei parsing fix](https://github.com/google/cpu_features/pull/468)
- [libuv PR #5019 - cpu_relax for riscv64](https://github.com/libuv/libuv/pull/5019)
- [libuv PR #5177 - UV_FS_O_DIRECT fix on riscv64](https://github.com/libuv/libuv/pull/5177)