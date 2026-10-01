---
title: oneDAL
parent: Project Reports
color: yellow
dependencies:
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: critical
  - name: oneTBB
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: optional
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: oneDPL
    relation: runtime-dependency
    criticality: optional
  - name: Catch2
    relation: test-dependency
    criticality: optional
  - name: OpenRNG
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="onedal" %}

# oneDAL

**Author:** Ludovic Henry <mail@ludovic.dev><br/>
**Date:** 2026-10-01<br/>
**Readiness:** yellow<br/>
**Optimization level:** minimal<br/>
**Scope:** RISC-V (riscv64/linux) support status for oneDAL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

oneDAL (oneAPI Data Analytics Library) is a C++ library implementing the oneAPI specification for classical machine learning and data analytics algorithms (decision forests, PCA, covariance, Gaussian naive Bayes, DBSCAN, SVM, and related primitives). The repository has moved from `oneapi-src/oneDAL` to [uxlfoundation/oneDAL](https://github.com/uxlfoundation/oneDAL); the old location returns "resource does not exist" and all current development happens under the new org.

The project is governed by the UXL Foundation, a Joint Development Foundation project ("The oneDAL project is governed by the UXL Foundation," per the repository's own description, with participation through the AI Special Interest Group and Open Source/Specification Working Groups). Governance is a three-tier merit model defined in [MAINTAINERS.md](https://github.com/uxlfoundation/oneDAL/blob/main/MAINTAINERS.md): Contributor to Code Owner (6+ months as contributor) to Maintainer (12+ months as Code Owner). `.github/CODEOWNERS` enforces this with dedicated GitHub teams per architecture, including `@uxlfoundation/onedal-cpu-risc-v` for all riscv64 paths and `@uxlfoundation/onedal-cpu-aarch64` for AArch64 paths, plus `@uxlfoundation/oneDAL-maintain` owning the governance documents themselves.

Intel dominates both governance and commit volume: of the eight named roles in MAINTAINERS.md, six are Intel employees. The only non-Intel Code Owner seats are architecture-scoped: Fujitsu for AArch64, Rivos Inc for RISC-V. Commit activity over the last 12 months (since 2025-10-01) shows 139 commits from `@intel.com` addresses versus 25 from `@gmail.com` and 1 from `@multicorewareinc.com`.

The compute backend is tiered by design: Intel MKL is the primary, production backend on x86; OpenBLAS is the explicit, documented fallback for every non-x86 architecture (both AArch64 and riscv64), selected via a `ref` (reference/generic) backend configuration since MKL has no non-x86 build.

Community culture toward new architecture ports is CI- and merit-driven rather than bureaucratic. The foundational RISC-V port (PR #2737) was proposed and merged in about 4 days with only implementation-level review comments and no governance debate. New architectures are expected to plug into the existing CPU Features Dispatching mechanism and are formalized purely by adding a CODEOWNERS block and nominating a Code Owner, the same path both AArch64 (Fujitsu) and RISC-V (Rivos) took. Continued 2026 investment (Bazel RISC-V64 cross-compile and OpenRNG backend support, merged September 2026) shows sustained rather than one-off attention.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-01-24 | [Issue #2257](https://github.com/uxlfoundation/oneDAL/issues/2257) opened by amgrigoriev: "Support for RISC-V architecture," the root tracking request, zero comments across its lifetime | Issue #2257 |
| 2024-04-22 | [PR #2737](https://github.com/uxlfoundation/oneDAL/pull/2737) "Add RISC-V clang build" opened by Keeran Rothenfusser (Rivos Inc) | PR #2737 |
| 2024-04-26 | PR #2737 merged by Nikolay Petrov (Intel), approved by luhenry, napetrov (Intel), Alexandr-Solovev (Intel); first release containing it is 2024.5.0 | PR #2737, git tag verification |
| 2024-05-02 | [PR #2762](https://github.com/uxlfoundation/oneDAL/pull/2762) "CI fixes in OpenBLAS builds" merged (QEMU Debian package URL fix); first release 2024.5.0 | PR #2762 |
| 2024-05-17 | [PR #2776](https://github.com/uxlfoundation/oneDAL/pull/2776) merged: fixes `getIndexNumType<unsigned long>`, previously gated to x86_64-only, unblocking 13 example programs on aarch64/riscv64; first release 2024.6.0 | PR #2776 |
| 2025-03-24 | Issue #2257 closed as completed | Issue #2257 |
| 2025-07-10 | [PR #3170](https://github.com/uxlfoundation/oneDAL/pull/3170) merged: more granular x86 CPU feature detection, with incidental RISC-V/ARM `cpu_info` build-error fixes; first release 2025.8.0 | PR #3170 |
| 2025-11-05 | [Issue #3431](https://github.com/uxlfoundation/oneDAL/issues/3431) opened: forest mean/variance vectorization missing for aarch64/riscv, labeled `good first issue`/`help wanted`, open and unassigned | Issue #3431 |
| 2026-02-13 | [Issue #3510](https://github.com/uxlfoundation/oneDAL/issues/3510) opened: ErfInv/CdfNormInv return NaN on non-x86, open and unassigned, blocked on Apache-2.0-compatible license for a fix | Issue #3510 |
| 2026-02-23 | [Issue #3526](https://github.com/uxlfoundation/oneDAL/issues/3526) "[Bazel Migration] RISC-V support with OpenBLAS fallback" opened and closed the same day as not planned; the same author (napetrov) delivered the work directly via PR #3719 five months later instead of tracking it incrementally | Issue #3526 |
| 2026-07-26 | [PR #3719](https://github.com/uxlfoundation/oneDAL/pull/3719) "Bazel: add AArch64/RISC-V64 cross-compile and OpenRNG backend support" opened by napetrov (Intel) | PR #3719 |
| 2026-09-17 | PR #3719 merged; not yet in any tagged release (latest tag 2026.1.0 predates the merge) | PR #3719, git tag verification |
| 2026-09-23 | [PR #3786](https://github.com/uxlfoundation/oneDAL/pull/3786) merged: bumps OpenBLAS dependency to v0.3.34, whose release notes include riscv64-specific SGEMM/DGEMM and STRSM kernel fixes; not yet in a tagged release | PR #3786 |
| 2026-09-28 | [PR #3817](https://github.com/uxlfoundation/oneDAL/pull/3817) opened: build-system cleanup shrinking release libraries and deduplicating flag definitions, incidentally touching `clang.ref.riscv64.mk`; open, unmerged as of research date | PR #3817 |

Key contributors: Keeran Rothenfusser (@keeranroth, Rivos Inc) authored the foundational riscv64 port and holds the formal RISC-V Code Owner seat in MAINTAINERS.md. Nikolay Petrov (@napetrov, Intel) authored the major Bazel riscv64 extension (PR #3719) and most subsequent riscv64-touching work. No master tracking issue links all RISC-V PRs together; #2257 functioned as a silent umbrella request that was closed once functional support existed, with #2737, #2776, #3719 fulfilling it incrementally without formal cross-linking.

The port is fully upstream on the Make build system since 2024.5.0, and the Bazel build system gained equivalent riscv64 support with PR #3719 (merged 2026-09-17), which postdates the most recent tagged release (2026.1.0, 2026-05-26) and is therefore not yet present in any shipped release.

## 3. Upstream Support Tier

No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists, and no formal written policy ranks architectures by support tier. The de facto mechanism is CODEOWNERS: a new architecture gets its own path-scoped rule block (deliberately placed last so it is not shadowed by broader rules) pointing at an architecture-specific GitHub team, which exists only once a Code Owner has been nominated and approved through the standard merit process. riscv64 has a named Code Owner (Rivos) and a dedicated CODEOWNERS team, conferring the same formal standing as AArch64 (Fujitsu). There is no written distinction between a "primary" x86 tier and "secondary" non-x86 tiers in any governance document.

In practice, support depth differs sharply by axis:

| Axis | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Build system - Make | Full, MKL backend | Full, ref/OpenBLAS backend | Full, ref/OpenBLAS backend, clang-only |
| Build system - Bazel | Full, MKL backend | Full, ref backend (merged PR #3719) | Full, ref backend (merged PR #3719, 2026-09-17) |
| CI | GitHub Actions + Azure Pipelines | GitHub Actions (native `ubuntu-24.04-arm`) + Azure Pipelines | Azure Pipelines only, QEMU-emulated, no GitHub Actions |
| Code Owner | Intel (Maintainer tier) | Fujitsu | Rivos Inc |
| Release artifacts | None published in GitHub Releases for any arch (see Section 8) | None | None |
| CPU dispatch tiers | 3 (SSE2, AVX2, AVX512) | 1 (SVE) | 1 (rv64) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

### CPU detection and dispatch

riscv64 is detected at compile time via `#if defined(__riscv) && (__riscv_xlen == 64)`, setting `TARGET_RISCV64` in `cpp/daal/include/services/daal_defines.h`, `cpp/oneapi/dal/common.hpp`, and `dev/bazel/config/cpudetect.cpp`. The dispatcher machinery (`cpu.hpp`, `cpu.cpp`, `cpu_info.cpp`, `dispatcher.hpp`, `env_detect.h/.cpp`, `algorithm_dispatch_container_*.h`) registers `rv64` as a `CpuType`/`CPU_EXTENSION` value through the exact same macro pattern used for x86 tiers and ARM SVE. Dedicated files exist and are structurally identical in size and pattern to their ARM counterparts: `cpp/daal/src/algorithms/kernel_inst_riscv64.h` (48 lines, matches `kernel_inst_arm.h`), `cpp/daal/src/services/internal/riscv64/riscv64_kernel_defines.h` (40 lines, matches `aarch64_kernel_defines.h`), `cpp/oneapi/dal/detail/cpu_info_riscv64_impl.hpp` (43 lines, matches `cpu_info_arm_impl.hpp`).

Runtime CPU-feature probing (`run_cpuid()` in `cpp/daal/src/services/compiler/generic/env_detect_features.cpp`) is a literal stub for riscv64: `// TODO: riscv64 implementation for cpuid`, with `__daal_serv_cpu_detect` returning a fixed `rv64` value. This mirrors ARM's identical `// TODO: ARM implementation for cpuid` stub and reflects that both architectures currently expose exactly one dispatch tier each, so fine-grained probing isn't yet load-bearing - not RISC-V-specific neglect.

### Math backend

riscv64 builds use `-DDAAL_REF -DONEDAL_REF`, selecting the scalar reference math path. Confirmed status:

| Function family | riscv64 behavior |
|---|---|
| sFabs, sMin, sMax, sSqrt, sCeil, sLog, sErf | Standard C `<cmath>` scalar, correct |
| vAdd, vSub, vExp, vTanh, vSqrt, vLog, vLog1p, vErf | `#pragma omp simd` loop, compiler auto-vectorized only |
| sErfInv / vErfInv | Returns `quiet_NaN()`, unimplemented (issue #3510) |
| sCdfNormInv / vCdfNormInv | Returns `quiet_NaN()`, unimplemented (issue #3510) |

The ErfInv/CdfNormInv NaN stubs affect any algorithm that samples from or inverts a normal distribution (Gaussian naive Bayes, quantile regression). The fix is blocked on finding an Apache-2.0-compatible implementation (the natural candidate, a cephes-style routine as used by SciPy, has unclear licensing); the issue is open and unassigned.

### Vectorized kernel coverage (verified by direct source read)

A repo-wide search for hand-written RVV vector intrinsics (`__riscv_v*`, `riscv_vector.h`, `vfloat32m1_t`, `__riscv_vsetvl`) returned zero hits anywhere in oneDAL's own code. Comparing hand-tuned SIMD-intrinsic kernel files by architecture, for the same algorithms (`finiteness_checker`, `svm_train_common`):

| Architecture | Hand-tuned intrinsic files | Example |
|---|---|---|
| x86_64 | 4 dedicated AVX-512/AVX2 files, plus ~21 more files using `immintrin.h` | `finiteness_checker_avx512_impl.i`, `svm_train_common_avx512_impl.i`, `tsne_gradient_descent_avx512_impl.i` |
| aarch64 (SVE) | 2 dedicated SVE files using `arm_sve.h` | `finiteness_checker_sve_impl.i`, `svm_train_common_sve_impl.i` |
| riscv64 | 0 | none; no `_rv64_impl.i` or `_riscv64_impl.i` files exist anywhere |

No `*_rv64.cpp` analog to `*_avx512.cpp` exists; PR #2737's changes to algorithm files were exclusively 2-line preprocessor additions (`#elif defined(TARGET_RISCV64)`) to set `CPU_EXTENSION`. The random forest mean/variance kernel, gated behind an AVX-512 check in `df_regression_train_dense_default_impl.i`, falls through to the unvectorized scalar path on both riscv64 and aarch64 (issue #3431, open, unassigned, `good first issue`).

`subgraph_isomorphism/backend/cpu/compiler_adapt.hpp` has rv64 specializations of `lzcnt`/`popcnt`, but these use portable `__builtin_clz`/`__builtin_clzl`/`__builtin_popcountl`, not RISC-V Zbb bit-manipulation intrinsics; no Zba/Zbb flags are used anywhere in the repo.

### ISA extension flags

Both Make and Bazel compile riscv64 with `-march=rv64gc_v1p0_zvl128b`: base RV64GC plus the Vector extension v1.0, with a minimum guaranteed 128-bit vector register length (`zvl128b`). This flag only enables the compiler's auto-vectorizer; it does not correspond to any hand-written RVV code in oneDAL itself. The real vectorized GEMM/LAPACK performance on riscv64 comes entirely from OpenBLAS's own RVV kernels (a third-party dependency), not from any code oneDAL authored.

### Summary

The dispatch and build infrastructure for riscv64 is complete and functional, structurally on par with AArch64 (same macro pattern, same file sizes, CI-tested cross-compilation that actually runs under QEMU). It is not a stub in the "does not build" sense. But at the algorithm-kernel level, riscv64 is a pure scalar C fallback with zero hand-written RVV intrinsic code, while x86 has 25+ hand-tuned AVX2/AVX-512 files and ARM has at least 2 hand-tuned SVE files for the identical algorithms.

## 5. Build System, Cross-Compilation, and Toolchain

There is no root `CMakeLists.txt`; oneDAL's two build systems are Make and Bazel. No `BUILDING.md` or `docs/cross-compilation.md` exists, and no riscv64-specific Dockerfile exists anywhere (the only Dockerfile, `dev/docker/onedal-dev.Dockerfile`, targets amd64 only). All riscv64 build logic lives in `.ci/pipeline/ci.yml` (Azure Pipelines), `.ci/env/*.sh`, `.ci/scripts/*.sh`, `dev/make/*`, and `dev/bazel/*`.

### Toolchain requirement and the reason for it

**Make build: clang-only.** There is no `gnu.ref.riscv64.mk`; only `clang.ref.riscv64.mk` exists. The exact minimum pinned is LLVM/Clang 18 (`apt.llvm.org/llvm.sh 18`, aliased via `update-alternatives`). GNU cross-gcc is installed in CI but used only as OpenBLAS's `--host-compiler` for build-time host tools, not to compile oneDAL.

**Why GCC cannot build the riscv64 OpenBLAS kernels**, per an explicit code comment at `.ci/pipeline/ci.yml:712-716`: the GNU riscv64 cross-gcc shipped with Ubuntu 24.04 is gcc-13, which lacks the RVV segment-load intrinsics (`vfloat32m4x2_t`, `__riscv_vlseg2e32_v_f32m4x2`) that OpenBLAS's `RISCV64_ZVL128B` kernels require. Clang 18 is used instead for all RISC-V compilation in the Make path.

**Bazel build: GCC for oneDAL itself, clang for OpenBLAS.** PR #3719 brings Bazel to parity using `CC=riscv64-linux-gnu-gcc`/`CXX=riscv64-linux-gnu-g++` to compile oneDAL's own Bazel targets, while still building OpenBLAS with clang specifically to work around the same gcc-13 RVV segment-intrinsic gap. This is a new capability versus Make, where gcc could not be used for oneDAL at all.

Target flag: `-march=rv64gc_v1p0_zvl128b` (single fixed ISA variant; no runtime CPU dispatch, same documented pattern as AArch64 SVE). Pinned dependency versions in CI: `OPENBLAS_VERSION: v0.3.34`, `TBB_VERSION: v2023.1.0` (the OpenBLAS pin was bumped from an earlier version by PR #3786, merged 2026-09-23). CI host: `ubuntu-24.04` (noble), sysroot built via debootstrap for `noble`.

### Exact build commands (Make)

```
.ci/env/apt.sh dev-base
.ci/env/apt.sh gnu-cross-compilers riscv64
.ci/env/apt.sh llvm-version 18
.ci/env/apt.sh qemu-apt
.ci/env/apt.sh build-sysroot <workspace> riscv64 noble sysroot-riscv64

.ci/env/openblas.sh --target RISCV64_ZVL128B --host-compiler gcc --compiler clang \
  --target-arch riscv64 --cross-compile --prefix <OPENBLAS_CACHE_DIR> \
  --sysroot <SYSROOT_CACHE_DIR> --version v0.3.34

.ci/env/tbb.sh --cross-compile \
  --toolchain-file .ci/env/riscv64-clang-crosscompile-toolchain.cmake \
  --target-arch riscv64 --prefix <TBB_CACHE_DIR> --version v2023.1.0

.ci/scripts/build.sh --compiler clang --optimizations rv64 --target daal \
  --backend-config ref --cross-compile --plat lnxriscv64 \
  --sysroot <SYSROOT_CACHE_DIR> --blas-dir <OPENBLAS_CACHE_DIR> --tbb-dir <TBB_CACHE_DIR>
```

This resolves to `make daal PLAT=lnxriscv64 COMPILER=clang REQCPU=rv64 BACKEND_CONFIG=ref`. The makefile hard-errors if `BACKEND_CONFIG` is anything other than `ref` for `lnxriscv64`.

### Exact build commands (Bazel)

```
export CC=riscv64-linux-gnu-gcc
export CXX=riscv64-linux-gnu-g++
export OPENBLASROOT=<OPENBLAS_CACHE_DIR>
bazel build --platforms=@config//:linux_riscv64 --backend_config=ref \
  //cpp/daal:core_dynamic //cpp/oneapi/dal:dynamic
```

The Bazel README states explicitly: "AArch64 and RISC-V64 are only supported with the ref backend... Both ship a single fixed ISA variant (SVE / RVGC), there is no runtime CPU dispatch like on x86." OpenRNG (`--rng_backend=openrng`) is wired but currently validated on ARM only, not riscv64.

### QEMU usage

Install: `qemu-user-static`, `qemu-user`, `binfmt-support`. The Make-path CI job sets `QEMU_LD_PREFIX=<sysroot>`, `QEMU_CPU="max"`, `ARCH_ONEDAL=riscv64`, then runs `daal/cpp` and `oneapi/cpp` example binaries through `qemu-riscv64` via binfmt transparently. The Bazel-path CI job does not run QEMU; it only verifies the output ELF header with `readelf -h ... | grep "RISC-V"`. A reviewer on PR #3719 (Alexandr-Solovev) explicitly asked whether the RISC-V Bazel job should validate the build with examples/tests; napetrov's response was that QEMU execution on the Bazel path was deferred as follow-up work, not implemented in that PR.

### Known build issue (found and fixed during PR #3719 review)

`dal_generate_cpu_dispatcher` initially omitted `ONEDAL_CPU_DISPATCH_A8SVE` and `ONEDAL_CPU_DISPATCH_RV64` macro definitions, which caused 58 of 63 oneAPI examples to throw `unsupported_device` exceptions at the Bazel build stage. This was caught in review and fixed within the same PR (commit `f078186b`) before merge; it did not ship.

### Example exclusions

23 DAAL examples and 1 oneAPI example (`basic_statistics_dense_online`) are explicitly excluded from the riscv64+clang example build via `examples/daal/cpp/target_excludes.cmake` and `examples/oneapi/cpp/target_excludes.cmake` (matched on `CMAKE_SYSTEM_PROCESSOR STREQUAL "riscv64"`). Excluded examples include `assoc_rules_apriori_batch`, `cholesky_dense_batch`, correlation/covariance distributed and online variants, `elastic_net_dense_batch`, `lasso_reg_dense_batch`, several `low_order_moms` variants, `pivoted_qr_dense_batch`, and others.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Build system - Make | Full | Full | Full (clang-only) |
| Build system - Bazel | Full | Full | Full (merged PR #3719, 2026-09-17; GCC for oneDAL, clang for OpenBLAS) |
| CI - GitHub Actions | Yes | Yes (`ubuntu-24.04-arm` native) | No (zero riscv references in any of 17 workflow files, confirmed by direct grep) |
| CI - Azure Pipelines | Yes | Yes | Yes, two jobs: Make+QEMU execution, Bazel build-only |
| CPU dispatch tiers | 3 (SSE2, AVX2, AVX512) | 1 (SVE) | 1 (rv64) |
| Runtime ISA probing | Yes | TODO stub | TODO stub |
| Math - basic ops | MKL | `#pragma omp simd` auto-vectorized | `#pragma omp simd` auto-vectorized |
| Math - ErfInv, CdfNormInv | MKL | NaN stub (#3510) | NaN stub (#3510) |
| BLAS/LAPACK | MKL | OpenBLAS | OpenBLAS (RVV-enabled kernels, third-party) |
| Hand-tuned SIMD intrinsic kernel files | 25+ (AVX2/AVX512) | 2 (SVE) | 0 |
| Forest mean/variance vectorization | Yes (AVX2/AVX512) | No (#3431) | No (#3431) |
| GPU/DPC++ target | Yes | No | No |
| Binary release packages | None (see Section 8) | None | None |

Functional gaps: ErfInv/CdfNormInv return NaN silently on riscv64, with no diagnostic signal, affecting any algorithm using normal-distribution CDF/inverse-CDF or inverse error function. Performance gaps: zero hand-written RVV code anywhere in oneDAL's own kernels; all vectorized speed on riscv64 comes from OpenBLAS, a dependency, not from oneDAL. Security hardening: no riscv64-specific hardening gaps were identified or searched for in the research findings; data not available beyond what is covered above.

## 7. CI/CD Infrastructure

**GitHub Actions: no riscv64 coverage.** All 17 workflow files in `.github/workflows/` (`check-intel-urls.yml`, `ci-aarch64.yml`, `ci-conda-recipe.yml`, `ci-win.yml`, `ci.yml`, `coverity.yml`, `docker-validation-ci.yml`, `docker-validation-nightly.yml`, `docs-release.yml`, `label-enforcement.yml`, `nightly-build.yml`, `nightly-test.yml`, `openssf-scorecard.yml`, `pr-checklist.yml`, `renovate-validation.yml`, `skywalking-eyes.yml`, `slack-pr-notification.yml`) were read directly and case-insensitively grepped for "riscv"/"rv64"/"RISC-V": zero matches in any file. `ci-aarch64.yml` covers AArch64 only, on GitHub-hosted `ubuntu-24.04-arm` runners.

**Azure Pipelines: riscv64 CI is real.** Defined in `.ci/pipeline/ci.yml`, confirmed as the project's main CI config by `.ci/AGENTS.md`. Trigger: every push to `main`/`rls/*` and every PR targeting those branches (`.github` paths are explicitly excluded from the PR path filter, since GitHub Actions workflows reference this file indirectly rather than containing the riscv64 jobs themselves).

Two jobs, both on `pool: vmImage: 'ubuntu-24.04'` (x86_64 hosted, cross-compiled and QEMU-emulated, not native RISC-V hardware):

1. **`LinuxMakeLLVM_OpenBLAS_rv64`**: installs GNU riscv64 cross-compilers, LLVM 18, QEMU; builds a riscv64 sysroot; cross-compiles OpenBLAS and oneTBB; builds `daal` and `onedal_c`; then actually runs the built `daal/cpp` and `oneapi/cpp` examples under QEMU user-mode emulation. This is build and execute/test.
2. **`LinuxBazelGNU_OpenBLAS_rv64`** (added by PR #3719, merged 2026-09-17): cross-compiles OpenBLAS with clang, then `bazel build --platforms=@config//:linux_riscv64 --backend_config=ref //cpp/daal:core_dynamic //cpp/oneapi/dal:dynamic`, verified only via `readelf -h ... | grep "RISC-V"`. Build-only, no QEMU execution; running examples under QEMU on this path was explicitly deferred as follow-up work per PR #3719's review discussion.

| Axis | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| GitHub Actions | Yes | Yes, native ARM runner | No |
| Azure Pipelines | Yes | Yes | Yes, QEMU-emulated on x86_64 host |
| Native hardware runner | Yes | Yes (GitHub-hosted `ubuntu-24.04-arm`) | No |
| Test execution (not just build) | Yes | Yes | Yes, via QEMU, Make path only; Bazel path is build-check only |
| Performance benchmarking in CI | Not confirmed | Not confirmed | None; CI validates functional correctness only |

No RISE Project runner or board-farm infrastructure is used anywhere in oneDAL's CI. Both riscv64 jobs run on standard Azure-hosted x86_64 agents.

## 8. Distribution and Release Status

No riscv64 (or any-architecture) binary release artifacts exist for oneDAL through any channel checked:

| Channel | Result |
|---|---|
| GitHub Releases (uxlfoundation/oneDAL: 2026.1.0, 2026.0.0, 2025.11.0, 2025.10.1, 2025.10.0) | All 5 most recent releases have empty asset arrays; source tarball/zipball only, no binaries at all, any architecture |
| PyPI (`onedal`) | HTTP 404, package does not exist, confirmed via both `pypi.org/pypi/onedal/json` and `pypi.org/simple/onedal/` |
| PyPI (`scikit-learn-intelex`, the actual downstream package bundling oneDAL's Python bindings) | Exists, latest 2026.1.0, 10 wheels, all `manylinux_2_28_x86_64` or `win_amd64`; zero riscv64 wheels |
| RISE GitLab wheel mirror (`gitlab.com/.../packages/pypi/simple/onedal/`) | HTTP 302 redirect to the same 404ing PyPI page; no riscv64 package via this route |
| Ubuntu (all suites, including resolute/26.04) | "Sorry, your search gave no results" for `onedal`, `python3-onedal`, `libonedal`, `libdaal`; no oneDAL-named package in any suite, any architecture |
| conda-forge | Absent from the channel entirely |
| Debian | Package does not exist |
| Arch Linux / archriscv.felixc.at | No "onedal" string found anywhere on the status page |

To obtain a working riscv64 binary today, a user must perform the full cross-compilation workflow described in Section 5: install the GNU and Clang riscv64 cross-toolchains, build a debootstrap sysroot, cross-compile OpenBLAS and oneTBB from source, then cross-compile oneDAL itself with the `ref` backend. No pre-built artifact is distributed through any registry.

## 9. Dependencies

| Dependency | Role | riscv64 Status |
|---|---|---|
| OpenBLAS | Runtime dependency, critical. Sole BLAS/LAPACK backend on riscv64 (MKL substitute) | Builds via cross-compile with `--target RISCV64_ZVL128B`; pinned v0.3.34 (bumped from an earlier version by PR #3786, merged 2026-09-23, whose release notes include riscv64-specific SGEMM/DGEMM and STRSM kernel fixes). Ubuntu resolute ships `libopenblas-dev` 0.3.32+ds-5 for riscv64. Exercised in oneDAL's own QEMU CI. Known gaps: ZVL256B TRSM has no RVV kernel plus a correctness bug (upstream OpenBLAS PR #5830, draft); an OpenBLAS/oneTBB threading race affects all OpenBLAS-backed platforms including riscv64 (oneDAL issue #3329, open). |
| oneTBB | Runtime dependency, critical. Thread-parallel runtime and scalable allocator underpinning oneDAL's parallelism | Builds from source via a dedicated CMake cross-toolchain file; pinned v2023.1.0. Ubuntu resolute ships `libtbb-dev` 2022.3.0-2 for riscv64. Zero upstream oneTBB CI coverage for riscv64 confirmed separately (see project-reports/onetbb.md); oneTBB's own PR #987 (libatomic auto-link) has been open since December 2022. |
| LLVM | Build dependency, critical. Clang 18 is the only compiler that can build oneDAL itself on the Make path, and is used for OpenBLAS's build on both the Make and Bazel paths | Pinned to version 18, installed via apt.llvm.org. Required because the Ubuntu 24.04 default GNU cross-gcc (gcc-13) lacks RVV segment intrinsics (`vfloat32m4x2_t`, `__riscv_vlseg2e32_v_f32m4x2`) that OpenBLAS's riscv64 kernels need. |
| GNU make | Build dependency, critical. The original and still-primary build system; defines `PLAT=lnxriscv64`, `BACKEND_CONFIG=ref` | Fully functional for riscv64 since PR #2737 (2024-04-26); clang-only, no `gnu.ref.riscv64.mk` exists. |
| CMake | Build dependency, critical. Used for oneTBB's cross-compiled build (via a dedicated toolchain file) and for building the example suite against an installed oneDAL package | Functional; riscv64 toolchain file at `.ci/env/riscv64-clang-crosscompile-toolchain.cmake`. |
| QEMU | Test dependency, critical. Emulates riscv64 binaries on the x86_64 Azure CI hosts (`qemu-user-static`, `qemu-user`, `binfmt-support`) | Used by the `LinuxMakeLLVM_OpenBLAS_rv64` job to actually execute built example binaries (`QEMU_CPU="max"`, `QEMU_LD_PREFIX` set to the sysroot). Not used by the Bazel job, which only inspects the ELF header. |
| Bazel | Build dependency, optional. The newer, parallel build system | riscv64 support merged via PR #3719 on 2026-09-17, bringing Bazel to functional parity with Make for build (not yet for QEMU test execution, which is deferred follow-up work). Not in any tagged release yet. |
| OpenMP | Runtime dependency, optional. Secondary threading backend via `libgomp` | Ships with any riscv64 GNU cross-toolchain (GCC itself has mature riscv64 support); oneDAL's riscv64 build uses the system cross-toolchain's libgomp rather than the x86-only conda-forge package pinned elsewhere in `MODULE.bazel`. No blocker identified. |
| oneDPL | Runtime dependency, optional. Parallel STL / SIMD execution policies used by some algorithm implementations | Header-only and architecture-independent in principle; `onedpl-headers` exists in the Ubuntu archive starting with resolute (26.04) as part of oneAPI Base Toolkit packaging, but is not riscv64-functionally-validated. Data not available: no riscv64-specific issues found in `uxlfoundation/oneDPL`. Not a hard blocker for oneDAL's `ref` backend path. |
| Catch2 | Test dependency, optional. C++ test framework, dev-only, not shipped in releases | Ubuntu resolute ships `libcatch2-dev` 3.7.1-0.6 for riscv64; builds with a workaround. Upstream Catch2 issue #2808 (`Werror=cast-align` failure on riscv, opened February 2024, open) requires `-Wno-cast-align`; low severity. |
| OpenRNG | Runtime dependency, optional. Arm-developed VSL-ABI-compatible RNG backend, newly wired as an alternative to OpenBLAS's RNG path | Added by PR #3719; GitLab-hosted by Arm (`gitlab.arm.com/libraries/openrng`), not GitHub. Exercised in the new `LinuxBazelGNU_OpenBLAS_rv64` CI lane, but validated primarily on AArch64; decision-forest segfaults under `ref+OpenRNG` were excluded from CI on AArch64 rather than fixed, per PR #3719's review discussion, and no riscv64 binary package for OpenRNG was found via web search. |

Dependencies referenced in research but excluded from oneDAL's riscv64 path by design (not in the direct-dependency list above, included for completeness): **Intel MKL** is a hard blocker by design on riscv64, a closed-source, x86-only binary with no riscv64 build anywhere; oneDAL's riscv64 build uses `--backend-config ref` specifically to exclude it, with the direct consequence that MKL-backed special-math functions (ErfInv, CdfNormInv) are NaN stubs on riscv64 (issue #3510). **oneCCL** and **Intel MPI (impi)**, used for distributed multi-node compute, are pinned in `MODULE.bazel` as x86-only `manylinux_2_28_x86_64` wheels with no riscv64 build evidence found anywhere; this blocks distributed oneDAL workloads on riscv64 [NEEDS VERIFICATION, based on absence of positive evidence rather than an explicit incompatibility statement from a primary source].

## 10. Ecosystem Status

Not applicable. oneDAL is a standalone C++ library consumed through its own API and, for Python users, through a single downstream wrapper package (scikit-learn-intelex). It has no dependent ecosystem of plugins, extensions, or third-party packages that would themselves need separate riscv64 enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3510](https://github.com/uxlfoundation/oneDAL/issues/3510) | ErfInv/CdfNormInv return NaN on non-x86 | Open, unassigned | Critical, silent correctness failure | No exception is raised; affected algorithms (Gaussian naive Bayes, quantile regression, normal-distribution sampling) silently produce NaN. Blocked on finding an Apache-2.0-compatible replacement for the MKL-backed implementation. |
| [#3431](https://github.com/uxlfoundation/oneDAL/issues/3431) | Vectorized forest mean/variance for aarch64/riscv | Open, unassigned, `good first issue`/`help wanted`/`perf` | Performance gap, not correctness | Random forest mean/variance reduction is vectorized for x86 (AVX2/AVX512) only; riscv64 and aarch64 use the scalar fallback. No quantitative slowdown figure is cited in the issue. |
| [#3329](https://github.com/uxlfoundation/oneDAL/issues/3329) | OpenBLAS/oneTBB threading race condition | Open, unassigned | Latent correctness risk, multi-threaded contexts | `openblas_set_num_threads()` modifies global state; affects every OpenBLAS-backed platform. riscv64 is exclusively OpenBLAS-backed (MKL unavailable), so this applies directly. |
| [#3817](https://github.com/uxlfoundation/oneDAL/pull/3817) | Build-system cleanup touching `clang.ref.riscv64.mk` | Open PR, unmerged as of 2026-09-28/30 | Infrastructure, not correctness | Primarily a binary-size/flag-deduplication cleanup across Make and Bazel; incidentally modifies riscv64 flag definition files. |
| (fixed pre-merge) | Missing `ONEDAL_CPU_DISPATCH_RV64`/`ONEDAL_CPU_DISPATCH_A8SVE` macros | Resolved within PR #3719 before merge (commit `f078186b`) | Was critical (58/63 oneAPI examples threw `unsupported_device`) | Did not ship; documented here as evidence of active, careful review on the riscv64/aarch64 Bazel work. |
| [#2257](https://github.com/uxlfoundation/oneDAL/issues/2257) | Support for RISC-V architecture (root tracking issue) | Closed, completed, 2025-03-24 | N/A | Superseded by incremental delivery (PR #2737, #2776, #3719). |
| [#3526](https://github.com/uxlfoundation/oneDAL/issues/3526) | Bazel RISC-V support with OpenBLAS fallback | Closed, not planned, 2026-02-23 (same day opened) | N/A | Work was delivered directly via PR #3719 instead of being tracked incrementally through this issue. |

No open NaN/floating-point correctness bug beyond #3510 was found specific to RISC-V; a targeted search for "riscv nan floating" surfaced no additional matches.

## 12. Objections and Upstream Blockers

**Objection 1: riscv64 CI is QEMU-emulated on an x86_64 host, not native hardware, and the Bazel lane does not even execute the binaries it builds.** Confirmed directly by reading `.ci/pipeline/ci.yml`: both riscv64 jobs run on `vmImage: 'ubuntu-24.04'`. The Make-path job does run examples under QEMU; the Bazel-path job only checks the ELF header with `readelf`. CI correctness on the Bazel path therefore depends entirely on cross-compilation succeeding, not on any runtime behavior.

**Objection 2: the special-math NaN bug has no resolution timeline.** Confirmed. Issue #3510 is open, unassigned, and blocked on an unresolved license-compatibility question. Algorithms depending on ErfInv or CdfNormInv silently produce incorrect output on riscv64 with no diagnostic.

**Objection 3: no riscv64 binary package exists anywhere, for any oneDAL-named artifact.** Confirmed across every channel checked (GitHub Releases, PyPI, Ubuntu, conda-forge, Debian, Arch). GitHub Releases for the project carry no binary assets at all, for any architecture; this is not a riscv64-specific gap but reflects that oneDAL does not publish release binaries through GitHub at all. Building from source is the only path.

**Objection 4: no published performance data exists for oneDAL on riscv64.** Confirmed. PR #3719 (the main riscv64/AArch64 Bazel enablement) contains only build/compile/link/run correctness checks under QEMU, no benchmark numbers. No arXiv paper, RISE blog post, or conference slide deck with oneDAL-on-riscv64 performance figures was found. The closest adjacent data point, arXiv 2504.04241 ("oneDAL Optimization for ARM Scalable Vector Extension"), is ARM-only and not transferable.

**Objection 5: there is no RISE Project sponsorship or infrastructure behind this work.** Checked directly: riseproject.dev's Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) do not include Intel, oneAPI, the UXL Foundation, or Rivos. 27 RISE blog posts (May 2024 through June 2026) contain zero mentions of oneDAL. The RISE Python wheel builder (80 packages enumerated) does not list oneDAL or scikit-learn-intelex. The riseproject-dev GitHub org (26 repos) has no oneDAL repository, and `search_repositories`/`search_issues` for "oneDAL" across that org return zero results. The one nuance: oneDAL is nominally named as one of four focus areas in a RISE System Libraries Working Group webinar slide deck from December 2024, but RISE's own 2024 achievements list (bionic, dav1d, zlib-ng, XNNPACK) does not include it, meaning that listing produced no traceable deliverable. RISC-V enablement is entirely vendor-driven, by Rivos under UXL Foundation governance, not RISE-sponsored or RISE-resourced.

Acceptance probability for further riscv64 contributions is high: the governance model is CI-merit-driven with no gatekeeping beyond standard code review (PR #2737 merged in 4 days; PR #3719's review consisted of implementation-level feedback, not architectural pushback), and Intel's own engineers (napetrov) are actively extending riscv64 coverage as of two weeks before the research date.

## 13. Readiness Assessment

- **Color:** yellow (optimization-minimal-cap: the primary CI grade is blue, capped to yellow because Section 4's optimization level is "minimal")
- **Release provider:** none
- **Optimization-purpose project:** yes
- **Optimization level:** minimal

oneDAL's primary grade, before the optimization-purpose modifier, is blue: upstream Azure Pipelines CI (`.ci/pipeline/ci.yml`, not GitHub Actions) builds riscv64 and actually runs the built examples under QEMU (`LinuxMakeLLVM_OpenBLAS_rv64`), with a second Bazel job (`LinuxBazelGNU_OpenBLAS_rv64`) build-only; no upstream riscv64 binaries are published anywhere (GitHub Releases have empty asset arrays, and no PyPI/conda-forge/Debian/Ubuntu package exists), giving build=yes, test=yes (via QEMU execution), release=no. See [PR #3719](https://github.com/uxlfoundation/oneDAL/pull/3719) and [MAINTAINERS.md](https://github.com/uxlfoundation/oneDAL/blob/main/MAINTAINERS.md).

Because oneDAL's stated value proposition is "highly optimized algorithmic building blocks" for data analytics, the optimization-purpose modifier applies. Research found zero RVV intrinsics anywhere in oneDAL's own code (`vfloat32m1_t`/`__riscv_vsetvl`/`riscv_vector.h` all absent); algorithm kernels (decision-forest mean/variance and others) fall back to scalar C with only `#pragma omp simd` auto-vectorization; ErfInv/CdfNormInv are unimplemented NaN stubs on riscv64 ([issue #3510](https://github.com/uxlfoundation/oneDAL/issues/3510)); and the only real vectorized speed on riscv64 (OpenBLAS's RVV GEMM/LAPACK kernels) comes from a third-party dependency, not oneDAL's own code. This is a "minimal" optimization level per the grading rubric, which caps the color down from blue to yellow.

**Pending work that could change the grade:** Open [PR #3817](https://github.com/uxlfoundation/oneDAL/pull/3817) (build-system cleanup touching riscv64 flag files, unmerged as of 2026-09-28/30); [issue #3431](https://github.com/uxlfoundation/oneDAL/issues/3431) (forest mean/variance vectorization for riscv64/aarch64, labeled "good first issue"/"help wanted", unassigned); [issue #3510](https://github.com/uxlfoundation/oneDAL/issues/3510) (ErfInv/CdfNormInv NaN on non-x86, blocked on an Apache-2.0-compatible license for a cephes-style fix, unassigned); [issue #3329](https://github.com/uxlfoundation/oneDAL/issues/3329) (OpenBLAS/oneTBB threading race, affects riscv64 since it is OpenBLAS-only). Active, ongoing investment: [PR #3719](https://github.com/uxlfoundation/oneDAL/pull/3719) (Bazel AArch64/RISC-V64 + OpenRNG support) merged 2026-09-17, within the last two weeks of the research date, by Intel's napetrov, with Rivos (keeranroth) holding the formal RISC-V Code Owner seat. No RISE involvement was found: oneDAL is not a RISE member, has zero RISE blog mentions, is absent from RISE's Python wheel builder, and has no riseproject-dev repo or issue references. RISC-V enablement is vendor-driven (Rivos) under UXL Foundation governance, not RISE-sponsored.

## 14. Investment Analysis

RISE has not funded, sponsored, or otherwise resourced any riscv64 work on oneDAL (Section 12, Objection 5); all sizing below assumes a project-funded or Qualcomm-funded contributor pool, not RISE credit.

### 14.1 Functional Enablement

1. **Fix ErfInv/CdfNormInv NaN (issue #3510), pending license resolution.** Requires identifying an Apache-2.0-compatible implementation of the inverse error function and normal-distribution inverse CDF, integrating it as a conditional dependency for non-x86 builds, and adding test coverage. Estimated effort: 2-3 person-weeks (implementation about 1 week, license review about 0.5 week, integration and test about 1 week). The blocker is legal review, not engineering complexity.
2. **Fix the OpenBLAS/oneTBB threading race (issue #3329).** Requires coordinating thread-count management between the TBB scheduler and OpenBLAS's global thread-count state. Estimated effort: 1-2 person-weeks. Shared infrastructure for every non-x86 platform; aarch64 benefits equally.
3. **Bring QEMU test execution to the Bazel riscv64 lane**, closing the gap PR #3719's own reviewer flagged (deferred as follow-up). Estimated effort: 1 person-week, mirroring the Make path's existing QEMU invocation.

### 14.2 Performance Optimization

1. **Vectorized forest mean/variance (issue #3431).** Add `#ifdef TARGET_RISCV64` SIMD-lane blocks to `df_regression_train_dense_default_impl.i`, directly portable from the existing x86 reference implementation. Labeled `good first issue`. No quantitative speedup estimate is available from any source checked. Estimated effort: 1-2 person-weeks.
2. **Hand-written RVV intrinsic math kernels**, replacing `#pragma omp simd` auto-vectorization in the scalar reference math path (vExp, vLog, vTanh, and related functions) with explicit RVV intrinsics. This is the highest-complexity, highest-impact item identified: it is the only path that would move oneDAL off "minimal" optimization level, since currently zero RVV intrinsic code exists anywhere in the project. No existing reference implementation to port from exists in the codebase (ARM's SVE path covers only 2 files, `finiteness_checker` and `svm_train_common`, so even that is not a template for the broader math library). Estimated effort: 4-8 person-weeks per function family, requiring dedicated RVV expertise.
3. **Implement the `run_cpuid()` stub** in `env_detect_features.cpp` to enable runtime dispatch, a prerequisite for having more than one riscv64 dispatch tier to dispatch to. Estimated effort: 1-2 person-weeks. Low priority until a second (RVV-optimized) kernel tier actually exists.

### 14.3 CI/CD Infrastructure

1. **Mirror `ci-aarch64.yml` as a GitHub Actions riscv64 workflow using QEMU.** Estimated effort: 1 person-week. No native hardware required; closes the GitHub Actions parity gap with AArch64.
2. **Add a native riscv64 CI runner** (RISE board-farm style infrastructure, or project-funded hardware). Estimated effort: 2-4 person-weeks for provisioning, CI integration, and validation. Prerequisite for any meaningful hardware performance benchmarking; current QEMU-only coverage cannot characterize real silicon.
3. **Add performance benchmarking to CI** (GEMM throughput, per-algorithm latency for decision forest, PCA, covariance) once native hardware is available. Estimated effort: 2-3 person-weeks. Meaningless on QEMU; requires item 2 first.

### 14.4 Ecosystem Enablement

Not applicable in the package/plugin sense (Section 10). The closest adjacent opportunity is downstream Python packaging: `scikit-learn-intelex` ships no riscv64 wheels today. Adding a riscv64 wheel build for that downstream package, which is outside oneDAL's own repository, would require a conda-forge feedstock or equivalent cross-compilation pipeline. Estimated effort: 2-3 person-weeks, owned by the scikit-learn-intelex maintainers rather than oneDAL's own riscv64 code owner.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner Candidate | Priority |
|---|---|---|---|---|
| Functional | Fix ErfInv/CdfNormInv NaN (issue #3510), pending license resolution | 2-3 | Qualcomm or Rivos contributor | Critical |
| Functional | Fix OpenBLAS/oneTBB threading race (issue #3329) | 1-2 | Qualcomm or shared with AArch64 owner | High |
| Functional | Add QEMU test execution to the Bazel riscv64 CI lane | 1 | Intel (napetrov) or Rivos | High |
| Performance | Vectorized forest mean/variance for riscv64 (issue #3431) | 1-2 | Open for contribution, tagged `good first issue` | High |
| Performance | Hand-written RVV intrinsic math kernels (vExp, vLog, vTanh) | 4-8 | Requires dedicated RVV expertise | Medium |
| Performance | Implement `run_cpuid`/ISA-probing stub | 1-2 | Prerequisite for multi-tier dispatch | Low |
| CI/CD | Migrate riscv64 CI to GitHub Actions (QEMU) | 1 | Qualcomm infra or Rivos | High |
| CI/CD | Add native riscv64 CI runner | 2-4 | Qualcomm hardware or project-funded farm (not RISE) | Medium |
| CI/CD | Add performance benchmarking to CI | 2-3 | Requires native runner first | Medium |
| Ecosystem | riscv64 wheels for scikit-learn-intelex | 2-3 | scikit-learn-intelex maintainers, outside oneDAL's own repo | Low |

## 15. References

- [Issue #2257 - Support for RISC-V architecture](https://github.com/uxlfoundation/oneDAL/issues/2257)
- [PR #2737 - Add RISC-V clang build](https://github.com/uxlfoundation/oneDAL/pull/2737)
- [PR #2762 - CI fixes in OpenBLAS builds](https://github.com/uxlfoundation/oneDAL/pull/2762)
- [PR #2776 - Bugfix in getIndexNumType function](https://github.com/uxlfoundation/oneDAL/pull/2776)
- [PR #3170 - More granular CPU features detection](https://github.com/uxlfoundation/oneDAL/pull/3170)
- [Issue #3329 - Single-threaded BLAS/LAPACK calls create race conditions with OpenBLAS](https://github.com/uxlfoundation/oneDAL/issues/3329)
- [Issue #3431 - Add vectorized algorithm for forest mean/variance in aarch64/riscv](https://github.com/uxlfoundation/oneDAL/issues/3431)
- [Issue #3510 - Add non-x86 versions of special functions](https://github.com/uxlfoundation/oneDAL/issues/3510)
- [Issue #3526 - Bazel Migration RISC-V support with OpenBLAS fallback](https://github.com/uxlfoundation/oneDAL/issues/3526)
- [PR #3719 - Bazel: add AArch64/RISC-V64 cross-compile and OpenRNG backend support](https://github.com/uxlfoundation/oneDAL/pull/3719)
- [PR #3786 - chore(deps): update dependency openmathlib/openblas to v0.3.34](https://github.com/uxlfoundation/oneDAL/pull/3786)
- [PR #3817 - build: shrink release libraries and clean up flag definitions](https://github.com/uxlfoundation/oneDAL/pull/3817)
- [MAINTAINERS.md](https://github.com/uxlfoundation/oneDAL/blob/main/MAINTAINERS.md)
- [UXL Foundation](https://uxlfoundation.org)
- [RISE Project](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Catch2 issue #2808 - Werror=cast-align on riscv](https://github.com/catchorg/Catch2/issues/2808)
- [arXiv 2504.04241 - oneDAL Optimization for ARM Scalable Vector Extension](https://arxiv.org/pdf/2504.04241)

---

This report (`/home/user/sw-ecosystem/project-reports/onedal.md` in the working repository) is the complete standalone deliverable; no files outside the chat response were produced for this task.