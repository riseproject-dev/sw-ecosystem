---
title: oneDAL
parent: Project Reports
categories:
  - libraries
---

# oneDAL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for oneDAL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

oneDAL (oneAPI Data Analytics Library) is a machine learning and data analytics library implementing the oneAPI specification. The repository was previously hosted at `oneapi-src/oneDAL` and has been migrated to [uxlfoundation/oneDAL](https://github.com/uxlfoundation/oneDAL) under the UXL Foundation, a Joint Development Foundation Project. UXL Foundation Steering Members include Arm, Fujitsu, Google Cloud, Imagination Technologies, Intel, Qualcomm, and Samsung.

The library provides algorithm implementations for classical ML workloads (decision forests, PCA, covariance, Gaussian naive Bayes, DBSCAN, etc.) with a tiered compute backend: Intel MKL as the primary production backend on x86, and OpenBLAS as the fallback for non-x86 architectures.

---

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| April 22, 2024 | [PR #2737](https://github.com/uxlfoundation/oneDAL/pull/2737) opened by Keeran Rothenfusser (Rivosinc) |
| April 26, 2024 | PR #2737 merged by Nikolay Petrov (Intel); foundational riscv64 port complete |
| April 30, 2024 | [Issue #2758](https://github.com/uxlfoundation/oneDAL/issues/2758): riscv64 CI (`LinuxMakeLLVM_OpenBLAS_rv64`) reported failing on Azure Pipelines |
| May 2, 2024 | Issue #2758 closed; CI restored |
| November 5, 2025 | [Issue #3431](https://github.com/uxlfoundation/oneDAL/issues/3431): Random forest vectorized mean/variance missing for riscv64 and aarch64 |
| January 21, 2026 | [PR #3304](https://github.com/uxlfoundation/oneDAL/pull/3304) merged: CPU topology initialization bug fix (all platforms) |
| February 13, 2026 | [Issue #3510](https://github.com/uxlfoundation/oneDAL/issues/3510): Special math functions (ErfInv, CdfNormInv) return NaN on non-x86 |
| February 23, 2026 | [Issue #3526](https://github.com/uxlfoundation/oneDAL/issues/3526): Bazel RISC-V support opened then immediately closed as not planned |

The port was authored entirely by one contributor from Rivosinc (keeranroth). PR #2737 received three approvals: luhenry, napetrov (Intel), and Alexandr-Solovev (Intel). The 4-day review-to-merge cycle indicates no governance friction for the initial port.

There is no master tracking issue for the riscv64 port. [Issue #3530](https://github.com/uxlfoundation/oneDAL/issues/3530) (Bazel master tracking) lists riscv64 as a "Secondary Issues (Post-Blocker)" item but is not a riscv64-specific tracking issue.

---

## 3. Upstream Support Tier

CONTRIBUTING.md and MAINTAINERS.md contain no formal tier or support-level classification. The project uses a code-owner model. The MAINTAINERS.md file (confirmed raw content) lists:

| Person | Employer | Role |
|---|---|---|
| Victoriya Fedotova (@Vika-F) | Intel | Maintainer (oneDAL Architecture) |
| Aleksandr Solovev (@Alexandr-Solovev) | Intel | Maintainer (oneDAL Architecture) |
| Alexander Andreev (@Alexsandruss) | Intel | Maintainer (oneDAL Architecture) |
| Rakshith G B (@rakshithgb-fujitsu) | Fujitsu | Code Owner (AArch64) |
| Keeran Rothenfusser (@keeranroth) | Rivosinc | Code Owner (RISC-V) |
| Nikolay Petrov (@napetrov) | Intel | Maintainer (Release Management) |
| Sergey Yakovlev (@syakov-intel) | Intel | Maintainer (Release Management) |
| Maria Petrova (@maria-Petrova) | Intel | Maintainer (Release Management) |

Intel holds 6 of 8 roles. riscv64 has a named code owner (Rivosinc/keeranroth), which confers the same formal standing as aarch64. There is no documented tier distinction between primary (x86) and secondary (aarch64, riscv64) architectures in governance documents.

In practice, riscv64 and aarch64 share the same depth of implementation: scalar C fallback kernels, OpenBLAS BLAS backend, and no hand-written SIMD algorithm kernels -- with one exception: aarch64 has one hand-coded Sleef SVE vectorized exp path that riscv64 lacks.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### CPU Detection and Dispatch

riscv64 is detected at compile time via `#if defined(__riscv) && (__riscv_xlen == 64)` in `cpp/daal/include/services/daal_defines.h`, which sets `TARGET_RISCV64`. The runtime CPU dispatch system (`cpp/oneapi/dal/backend/dispatcher.hpp`) defines a single dispatch tag `cpu_dispatch_rv64` with no sub-variants (no RVV vs. base split). The `CpuType` enum defines `rv64 = 0, firstCpuType = rv64, lastCpuType = rv64` -- one tier.

The cpuid implementation in `cpp/daal/src/services/compiler/generic/env_detect_features.cpp` is a stub: `run_cpuid()` contains only a comment `// TODO: riscv64 implementation for cpuid`. `daal_serv_cpu_feature_detect()` returns `CpuFeature::unknown`. No runtime ISA probing exists; the dispatcher unconditionally selects `rv64`.

CPU topology is disabled for all non-x86 targets via `DAAL_CPU_TOPO_DISABLED`. The TBB scheduler handle initialization (`daal::setSchedulerHandle`) is x86-only and is skipped on riscv64.

### Math Backend

riscv64 builds use `-DDAAL_REF -DONEDAL_REF`, selecting `service_math_ref.h`. Status by function:

| Function | riscv64 behavior |
|---|---|
| sFabs, sMin, sMax, sSqrt, sCeil, sLog, sErf | Standard C `<cmath>` scalar -- correct |
| vAdd, vSub, vExp, vTanh, vSqrt, vLog, vLog1p, vErf | `#pragma omp simd` loop -- compiler auto-vectorized |
| sErfInv / vErfInv | Returns `std::numeric_limits<float>::quiet_NaN()` -- silent correctness failure |
| sCdfNormInv / vCdfNormInv | Returns `std::numeric_limits<float>::quiet_NaN()` -- silent correctness failure |

The NaN stubs are explicitly marked `// Not implemented` in `service_math_ref.h`. This affects all algorithms that use normal distribution CDF, inverse CDF, or inverse error functions (Gaussian naive Bayes, quantile regression, normal distribution sampling). Issue #3510 is the tracking issue; the proposed fix (cephes/SciPy) is blocked on Apache 2.0 license compatibility.

For comparison: aarch64 has the same NaN stubs for ErfInv/CdfNormInv but has one additional hand-coded path -- Sleef SVE intrinsics for vectorized exp. riscv64 lacks that path and relies entirely on compiler auto-vectorization.

### BLAS/LAPACK

`service_blas_ref.h` and `service_lapack_ref.h` delegate to OpenBLAS, cross-compiled with `--target RISCV64_ZVL128B`. OpenBLAS's own RVV kernels are active. This is the most performant layer in the riscv64 stack; GEMM, SYRK, and LAPACK operations use OpenBLAS RVV code, not scalar fallback.

### Algorithm Kernels

No riscv64-specific algorithm files exist. There are no `*_rv64.cpp` analogs to `*_avx512.cpp`. The changes introduced by PR #2737 to algorithm files were exclusively 2-line preprocessor additions (`#elif defined(TARGET_RISCV64)`) to define `CPU_EXTENSION`. All algorithm computations run on the scalar C path with compiler auto-vectorization where `#pragma omp simd` is present.

Known gap: the random forest mean/variance vectorization added in PR #3362 is gated behind `#if (__CPUID__(DAAL_CPU) == __avx512__)` in `cpp/daal/src/algorithms/dtrees/forest/regression/df_regression_train_dense_default_impl.i` line 180. riscv64 and aarch64 both use the unvectorized scalar path. Issue #3431 is open, labeled `good first issue, help wanted, perf`, with no assignee.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Make-based Build (supported)

The Make build system fully supports riscv64 via:

- `dev/make/function_definitions/riscv64.mk`: defines `BACKEND_CONFIG=ref` (only valid value -- any other backend errors), compiler defaults to `clang`, `OPTFLAG=O2`
- `dev/make/function_definitions/lnxriscv64.mk`: defines `ARCH=riscv64`, `_OS=lnx`, `_IA=riscv64`, TBB/pthread link flags, references export def file `export_lnxriscv64.ref.def`
- `dev/make/compiler_definitions/clang.ref.riscv64.mk`: sets `PLATs.clang = lnxriscv64`, cross-compile target `--target=riscv64-linux-gnu`, flags `-DDAAL_CPU=rv64 -DDAAL_REF -DONEDAL_REF`, and `rv64_OPT.clang = $(-Q)march=rv64gc_v1p0_zvl128b`
- `.ci/env/riscv64-clang-crosscompile-toolchain.cmake`: CMake toolchain file setting `CMAKE_SYSTEM_PROCESSOR=riscv64`, using `clang`/`clang++` with `CMAKE_C_COMPILER_TARGET=riscv64-linux-gnu`, sysroot from `$ONEDAL_SYSROOT`

ISA extension flags: `rv64gc_v1p0_zvl128b` -- RVV 1.0 with minimum 128-bit vector length. These flags are compile-time only; no RVV intrinsics are written in oneDAL source code.

GCC cross-compilation is not supported. There is no `gnu.ref.riscv64.mk` file. Clang is the only supported compiler for riscv64.

The build installs a debootstrap Ubuntu noble (24.04) sysroot via `.ci/env/apt.sh`. Pinned dependency versions in CI:

| Component | Version |
|---|---|
| OpenBLAS | v0.3.27 |
| oneTBB | v2023.0.0 |
| Ubuntu sysroot | noble (24.04) |
| OpenBLAS target | RISCV64_ZVL128B |

OpenBLAS is built with `NO_FORTRAN=1`, `USE_OPENMP=0 USE_THREAD=0 USE_LOCKING=1`, `BINARY=64 INTERFACE64=1` (ILP64 interface, single-threaded, threading delegated to oneTBB).

Clang minimum version: the toolchain cmake file does not pin a version. `rv64gc_v1p0_zvl128b` march string support requires Clang 16+. The CI resolves to Ubuntu 24.04 default clang (18.x).

### Bazel Build (not supported)

[Issue #3526](https://github.com/uxlfoundation/oneDAL/issues/3526) tracked Bazel riscv64 support and was closed as not planned on February 23, 2026 with no comments and no assignee. The master Bazel tracking issue [#3530](https://github.com/uxlfoundation/oneDAL/issues/3530) lists riscv64 as "Secondary Issues (Post-Blocker)" with no owner and no timeline. The existing Make-based riscv64 support is described in the Bazel tracking issue as "experimental."

There is no Dockerfile for riscv64. The development container (`dev/docker/onedal-dev.Dockerfile`) targets amd64 only.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Build system -- Make | Full | Full | Full |
| Build system -- Bazel | Full | Full | Not supported (closed as not planned) |
| CI -- GitHub Actions | Yes | Yes (ubuntu-24.04-arm) | No |
| CI -- Azure Pipelines | Yes | Yes | Yes (QEMU emulation) |
| CPU dispatch tiers | 3 (SSE2, AVX2, AVX512) | 1 (SVE) | 1 (rv64) |
| Runtime ISA probing | Yes | Yes | No (TODO stub) |
| Math -- basic ops | MKL vExp, vLog, etc. | Sleef SVE for float exp; scalar for others | omp simd auto-vectorization |
| Math -- ErfInv, CdfNormInv | MKL | NaN stub | NaN stub |
| BLAS/LAPACK | MKL | OpenBLAS | OpenBLAS (RVV-enabled) |
| Algorithm kernels -- hand-tuned SIMD | Yes (AVX2 + AVX512 paths) | No | No |
| Forest mean/variance vectorization | Yes (AVX2 + AVX512) | No | No |
| GPU/DPC++ target | Yes | No | No |
| Binary packages | Yes (conda-forge, PyPI) | No | No |

riscv64 and aarch64 are at equivalent depth except: (1) aarch64 has one Sleef SVE exp path that riscv64 lacks; (2) aarch64 has GitHub Actions CI with native ARM runners while riscv64 is QEMU-only.

---

## 7. CI/CD Infrastructure

### Azure Pipelines (active)

The riscv64 CI job is defined in `.ci/pipeline/ci.yml` as `LinuxMakeLLVM_OpenBLAS_rv64`. It triggers on every push to `main` and every PR against `main`. It runs on an `ubuntu-24.04` x86_64 hosted runner and uses QEMU for test execution (`QEMU_CPU="max"`, `QEMU_LD_PREFIX` set to the sysroot).

Confirmed active: Azure Pipelines build ID 60530 ran on [PR #3660](https://github.com/uxlfoundation/oneDAL/pull/3660) (merged 2026-06-16) and completed with status `success`. [NEEDS VERIFICATION -- the build ID and PR number come from a single source in the research findings.]

Build steps in the CI job:
1. Install GNU riscv64 cross-compilers (`gcc-riscv64-linux-gnu`, `g++-riscv64-linux-gnu`, `gfortran-riscv64-linux-gnu`)
2. Build Ubuntu noble sysroot via debootstrap
3. Cross-compile OpenBLAS v0.3.27 with `--target RISCV64_ZVL128B`
4. Cross-compile oneTBB v2023.0.0 using the CMake toolchain file
5. Build oneDAL `daal` and `onedal_c` targets with `--plat lnxriscv64 --backend-config ref --optimizations rv64`
6. Run `daal/cpp examples` and `oneapi/cpp examples` under QEMU

No performance benchmarking steps exist in the CI job.

### GitHub Actions (riscv64 absent)

All 16 workflow files in `.github/workflows/` were read. None contain any reference to "riscv", "riscv64", or "RISCV". The only non-x86 GitHub Actions CI is `ci-aarch64.yml`, which uses GitHub-hosted `ubuntu-24.04-arm` runners. riscv64 has no GitHub Actions workflow.

---

## 8. Distribution and Release Status

No riscv64 binary packages exist through any distribution channel. The following were checked directly:

| Channel | Result |
|---|---|
| GitHub Releases (uxlfoundation/oneDAL 2026.1.0, 2026.0.0, 2025.11.0) | Zero binary assets attached; API returns `assets: []` for all three releases |
| PyPI (`scikit-learn-intelex` 2026.1.0, 10 wheels) | All wheels are `manylinux_2_28_x86_64` or `win_amd64`; no riscv64 |
| PyPI (`onedal`) | Package does not exist (404) |
| conda-forge linux-riscv64 | oneDAL absent from channel repodata entirely |
| Debian | Package does not exist in the Debian archive |
| Ubuntu | Package does not exist in Ubuntu noble |
| Arch Linux / archriscv | Not in upstream Arch packages; not in archriscv status list |

The build-from-source workflow introduced by PR #2737 produces functional riscv64 binaries but no pre-built artifacts are distributed through any registry.

Release notes for 2025.5.0 through 2026.1.0 contain no RISC-V mentions. Performance improvements in release notes target x86 SIMD and ARM SVE only.

---

## 9. Dependencies

| Dependency | Role | riscv64 Status | Notes |
|---|---|---|---|
| Intel MKL | Primary numeric backend (BLAS, LAPACK, RNG, FFT, special math) | Hard blocker -- x86-only closed-source binary | The riscv64 build uses `--backend-config ref` which excludes MKL entirely. Special math functions that delegate to MKL return NaN on riscv64 (issue #3510). |
| OpenBLAS | Alternate BLAS/LAPACK backend; sole backend on riscv64 | Functional -- cross-compiled with `RISCV64_ZVL128B` | OpenBLAS v0.3.27 pinned in CI. Multithreading disabled in OpenBLAS; threading provided by oneTBB. Race condition bug between oneTBB and OpenBLAS threading is tracked in issue #3329 (open, Aug 2025) -- applies to all non-MKL platforms including riscv64. |
| oneTBB | Thread parallelism runtime | Builds from source -- toolchain file present | oneTBB v2023.0.0. PyPI/conda-forge binary packages are x86-only; riscv64 requires source build. oneDAL's MODULE.bazel hardcodes x86 PyPI URLs; riscv64 uses the `TBBROOT` env-var override path. |
| Intel MPI / oneCCL | Distributed multi-node compute | Not functional on riscv64 | Both are x86-only binaries. No open-source MPI validation confirmed for riscv64. Blocks distributed oneDAL workloads. [NEEDS VERIFICATION -- oneCCL riscv64 status is based on zero search results; no positive confirmation of incompatibility from a primary source.] |
| OpenMP (libgomp) | Secondary parallelism | Functional via system cross-toolchain | oneDAL MODULE.bazel fetches x86-only conda-forge libgomp; riscv64 builds use the system cross-toolchain libgomp instead. No hard blocker. |
| oneDPL | Parallel STL for some algorithm implementations | Unknown | No riscv64 issues or CI found in uxlfoundation/oneDPL. Data not available: riscv64-specific build or test status for oneDPL. Not a hard blocker for the ref backend path. |
| Catch2 | C++ test framework (dev only) | Builds with workaround | [Issue #2808](https://github.com/catchorg/Catch2/issues/2808) reports `Werror=cast-align` on riscv; filed Feb 2024, status open. Requires `-Wno-cast-align` workaround. Low severity. |
| Intel VTune SDK | Optional profiling | Not available on riscv64 | x86-only binary. Optional; not a blocker. |

---

## 10. Ecosystem Status

### RISE Project

oneDAL is listed as one of four focus areas in the RISE System Libraries Working Group, confirmed from the RISE Webinar December 2024 slide deck PDF. RISE Premier Members as of December 2024 include Google, Intel, Qualcomm, Rivos, Ventana, SiFive, Red Hat, T-Head (Alibaba), Andes, MediaTek, Samsung, and Nvidia.

Despite the listing, no concrete RISE deliverables for oneDAL were found:

- The RISE 2024 System Libraries achievements list bionic, dav1d, zlib-ng, and XNNPACK vector optimizations. oneDAL is not cited in the achievements.
- 27 RISE blog posts from May 2024 through June 2026 contain zero mentions of oneDAL.
- The RISE Python wheel builder (riseproject.gitlab.io) does not list oneDAL (80+ packages enumerated).
- The riseproject-dev GitHub organization (30 repos enumerated) contains no oneDAL repository.
- GitHub API search `oneDAL org:riseproject-dev` returns 0 results.

Keeran Rothenfusser (Rivosinc), the oneDAL RISC-V code owner, is a RISE-adjacent contributor; Rivosinc is not listed as a RISE Premier Member in the December 2024 PDF [NEEDS VERIFICATION -- Rivosinc membership status may have changed; the PDF is from December 2024].

### Intel Involvement

Intel holds 6 of 8 MAINTAINERS.md roles. Two open issues (November 2025 and February 2026) originate from an Intel engineer (david-cortes-intel) and explicitly tag the riscv64 code owner. This indicates Intel is treating riscv64 as a first-class target for new algorithm coverage -- not a maintenance-only inclusion.

### Qualcomm Involvement

Data not available: no Qualcomm-authored contributions to the oneDAL riscv64 port were identified in the research findings.

---

## 11. Known Bugs and Active Issues

### Critical -- Silent Correctness Failure

**[Issue #3510](https://github.com/uxlfoundation/oneDAL/issues/3510)** -- "Add non-x86 versions of special functions" (open, Feb 13, 2026)

`sErfInv()`, `vErfInv()`, `sCdfNormInv()`, and `vCdfNormInv()` in `service_math_ref.h` return `std::numeric_limits<float>::quiet_NaN()` on all non-x86 builds. There is no exception or error; affected algorithms silently produce NaN output. Algorithms impacted include Gaussian naive Bayes, quantile regression, and any algorithm sampling from a normal distribution.

Active blocker for the fix: the cephes library (proposed replacement, used by SciPy) has unclear licensing that may not be compatible with oneDAL's Apache 2.0 license. No alternative has been identified and approved. Issue has no assignee.

### Performance -- Vectorization Gap

**[Issue #3431](https://github.com/uxlfoundation/oneDAL/issues/3431)** -- "Add vectorized algorithm for forest mean/variance in aarch64/riscv" (open, Nov 5, 2025)

Random forest regression mean/variance computation is gated behind `#if (__CPUID__(DAAL_CPU) == __avx512__)`. Both aarch64 and riscv64 use the unvectorized scalar fallback. No quantitative slowdown figure is cited in the issue. Tagged `good first issue, help wanted, perf`. No assignee.

### Latent -- Threading Race Condition

**[Issue #3329](https://github.com/uxlfoundation/oneDAL/issues/3329)** -- "Single-threaded BLAS/LAPACK calls create race conditions with OpenBLAS" (open, Aug 22, 2025)

`openblas_set_num_threads()` modifies global state, causing thread-count corruption in multi-threaded contexts. This applies to all OpenBLAS-backed platforms. riscv64 is exclusively OpenBLAS-backed (MKL is unavailable), so this bug applies directly. Issue has no assignee.

### Infrastructure -- Bazel Not Supported

**[Issue #3526](https://github.com/uxlfoundation/oneDAL/issues/3526)** -- "[Bazel Migration] RISC-V support with OpenBLAS fallback" (closed as not planned, Feb 23, 2026)

Closed with no comments and no timeline. The Bazel migration for x86 is itself incomplete (toolchain consolidation between ICX and DPC++ is unresolved). riscv64 is explicitly categorized as a post-blocker secondary item in the Bazel migration roadmap.

---

## 12. Objections and Upstream Blockers

**Objection 1: The riscv64 CI pipeline is QEMU-only and not in GitHub Actions.**

Confirmed. The `LinuxMakeLLVM_OpenBLAS_rv64` Azure Pipelines job runs on an x86_64 runner with QEMU emulation. No native riscv64 runner is used. This means CI correctness depends on QEMU fidelity. Performance data from CI is meaningless for hardware characterization. The CI validates build and functional correctness only.

**Objection 2: The special math NaN bug has no timeline for resolution.**

Confirmed. Issue #3510 is open, unassigned, and blocked on a license compatibility question that has not been resolved. Algorithms depending on ErfInv or CdfNormInv produce incorrect results on riscv64 without any diagnostic signal. The issue was opened February 2026 and has no comments.

**Objection 3: No riscv64 binary packages exist anywhere.**

Confirmed. Building oneDAL for riscv64 requires the complete cross-compilation workflow: install GNU cross-compilers, build a debootstrap sysroot, cross-compile OpenBLAS and oneTBB from source, then cross-compile oneDAL. No distribution packages exist in conda-forge, PyPI, Debian, Ubuntu, or Arch Linux for riscv64.

**Objection 4: Performance on riscv64 has no published data.**

Confirmed. No benchmark numbers for oneDAL on riscv64 exist in any public source. The RISE 2024 PDF does not include oneDAL performance data. The CI runs functional examples under QEMU but does not measure throughput or latency.

**Objection 5: The Bazel migration blockers also block riscv64 integration.**

Confirmed. Issue #3526 was closed as not planned because the Bazel migration for x86 is itself incomplete. riscv64 Bazel support cannot be unblocked independently of the x86 migration completing its own prerequisite work (ICX/DPC++ toolchain unification, Windows and ARM platform verification).

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 build produces a functionally correct library for most algorithms. The two functional gaps are:

1. **ErfInv / CdfNormInv NaN bug (issue #3510)**: requires identifying an Apache 2.0-compatible implementation of inverse error function and normal distribution inverse CDF, integrating it as a conditional dependency for non-x86 builds, and adding test coverage. Estimated effort: 2-3 person-weeks (implementation 1 week, license review 0.5 week, integration and test 1 week). The blocker is legal review, not engineering complexity.

2. **OpenBLAS threading race condition (issue #3329)**: a latent bug in multi-threaded workloads on any OpenBLAS-backed platform. The fix requires coordinating thread count management between the TBB scheduler and OpenBLAS. Estimated effort: 1-2 person-weeks. This is shared infrastructure for all non-x86 platforms; aarch64 benefits equally.

### 13.2 Performance Optimization

Three layers of performance work are available with distinct cost/impact profiles:

1. **Vectorized forest mean/variance (issue #3431)**: requires adding `#ifdef TARGET_RISCV64` blocks with architecture-specific SIMD lane constants in `df_regression_train_dense_default_impl.i`. The issue is labeled `good first issue` because the x86 reference implementation is directly portable. No quantitative speedup estimate is available from the research findings. Estimated effort: 1-2 person-weeks.

2. **RVV intrinsic math functions**: replacing the `#pragma omp simd` auto-vectorization in `service_math_ref.h` (vExp, vLog, vTanh, etc.) with hand-written RVV intrinsics or a Sleef-based path (mirroring the aarch64 Sleef SVE approach). This is the highest-complexity, highest-impact path. Estimated effort: 4-8 person-weeks per function family. No existing RISC-V Sleef integration exists in the codebase to reference; Sleef does have RVV support upstream [NEEDS VERIFICATION -- Sleef RVV status not confirmed in research findings].

3. **Runtime ISA probing (TODO stub in `env_detect_features.cpp`)**: implementing the `run_cpuid()` stub to enable runtime dispatch between RVV-enabled and base riscv64 paths. Prerequisite for any multi-tier dispatch. Estimated effort: 1-2 person-weeks. Low priority until a second dispatch tier (RVV kernel set) exists to dispatch to.

### 13.3 CI/CD Infrastructure

Current state: Azure Pipelines job on x86_64 + QEMU, no native runner, no GitHub Actions coverage, no performance CI.

Options in increasing investment order:

1. **Migrate riscv64 CI to GitHub Actions**: create a `.github/workflows/ci-riscv64.yml` mirroring the structure of `ci-aarch64.yml`, using QEMU. Estimated effort: 1 person-week. No native runner required. Closes the gap vs. aarch64 in CI infrastructure parity.

2. **Add native riscv64 CI runner**: requires either a RISE board-farm runner (riseproject-dev runner infrastructure exists for other projects) or a Qualcomm-hosted riscv64 machine. Estimated effort: 2-4 person-weeks (runner provisioning, CI integration, validation). This is a prerequisite for any meaningful hardware performance benchmarking.

3. **Add performance benchmarking to CI**: add a benchmark suite (GEMM throughput, algorithm latency for Decision Forest, PCA, covariance) to the riscv64 CI job. Estimated effort: 2-3 person-weeks. Requires native runner to produce useful data; meaningless on QEMU.

### 13.4 Ecosystem Enablement

1. **conda-forge riscv64 packaging**: oneDAL is absent from conda-forge entirely. Packaging for riscv64 requires: adding a conda-forge feedstock, configuring cross-compilation in the feedstock, and handling the OpenBLAS dependency. Estimated effort: 2-3 person-weeks. Enables downstream Python users (scikit-learn-intelex, daal4py) on riscv64.

2. **Bazel build support**: blocked by the upstream Bazel migration state. Not actionable until the x86 Bazel migration completes its prerequisite work. Estimated effort when unblocked: 1 week (issue #3526 estimated internally at 1 week).

3. **RISE engagement**: oneDAL is listed in the RISE System Libraries WG but has produced no 2024 achievements. Formal engagement with the RISE AI/ML WG (created Q1 2026, led by Leye Wang/BOSC) could provide resources (runner access, co-contributors, blog visibility). No effort estimate; this is relationship and coordination work, not engineering.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner Candidate | Priority |
|---|---|---|---|---|
| Functional | Fix ErfInv / CdfNormInv NaN (issue #3510) -- pending license resolution | 2-3 | Qualcomm or Rivosinc contributor | Critical |
| Functional | Fix OpenBLAS threading race (issue #3329) | 1-2 | Qualcomm or shared with aarch64 owner | High |
| Performance | Vectorized forest mean/variance for riscv64 (issue #3431) | 1-2 | keeranroth (Rivosinc) tagged; open for contribution | High |
| Performance | RVV intrinsic math (vExp, vLog, vTanh) via Sleef or direct intrinsics | 4-8 | Requires riscv64 SIMD expertise | Medium |
| CI/CD | Migrate riscv64 CI to GitHub Actions (QEMU) | 1 | Qualcomm infra or Rivosinc | High |
| CI/CD | Add native riscv64 CI runner | 2-4 | Qualcomm hardware or RISE board farm | Medium |
| CI/CD | Add performance benchmarking to CI | 2-3 | Requires native runner first | Medium |
| Ecosystem | conda-forge riscv64 packaging | 2-3 | Qualcomm or community | Medium |
| Ecosystem | Bazel riscv64 support (issue #3526) | 1 (when unblocked) | Intel Bazel migration team must unblock | Low |
| Runtime | Implement cpuid / ISA probing stub | 1-2 | Prerequisite for multi-tier dispatch | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PR #2737 -- Add RISC-V clang build](https://github.com/uxlfoundation/oneDAL/pull/2737)
- [Issue #2758 -- rv64 CI failing](https://github.com/uxlfoundation/oneDAL/issues/2758)
- [PR #3304 -- Fix incorrect CPU topology initialization](https://github.com/uxlfoundation/oneDAL/pull/3304)
- [Issue #3329 -- OpenBLAS threading race condition](https://github.com/uxlfoundation/oneDAL/issues/3329)
- [Issue #3431 -- Vectorized forest mean/variance aarch64/riscv](https://github.com/uxlfoundation/oneDAL/issues/3431)
- [Issue #3510 -- Non-x86 special functions return NaN](https://github.com/uxlfoundation/oneDAL/issues/3510)
- [Issue #3526 -- Bazel RISC-V support (closed as not planned)](https://github.com/uxlfoundation/oneDAL/issues/3526)
- [Issue #3530 -- Bazel master tracking issue](https://github.com/uxlfoundation/oneDAL/issues/3530)
- [MAINTAINERS.md](https://github.com/uxlfoundation/oneDAL/blob/main/MAINTAINERS.md)
- [UXL Foundation](https://uxlfoundation.org)
- [RISE Project](https://riseproject.dev)