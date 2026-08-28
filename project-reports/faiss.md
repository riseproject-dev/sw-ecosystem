---
title: FAISS
parent: Project Reports
categories:
  - agentic-ai
---

# FAISS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for FAISS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[FAISS](https://faiss.ai/) (Facebook AI Similarity Search) is a library for efficient similarity search and dense vector clustering. The repository is [facebookresearch/faiss](https://github.com/facebookresearch/faiss). It is MIT-licensed and copyright Meta Platforms, Inc.

FAISS is a corporate-led project with no independent foundation or community governance. Development is driven by Meta's Fundamental AI Research (FAIR) group. Commits are synced from Meta's internal monorepo via `meta-codesync[bot]`, confirming that internal development drives the project rather than external community contributions. There is no PLATFORMS.md, SUPPORT.md, or CODEOWNERS file in the repository; platform support is determined ad hoc by Meta maintainers.

The project is not a member of or funded by the RISE Project (RISC-V Software Ecosystem). A full scrape of all 27 RISE Project blog posts (May 2024 through June 2026) found no mention of FAISS. The RISE Python wheel builder lists 76 packages; FAISS is not among them. The riseproject-dev GitHub organization contains no FAISS repository.

Active maintainers with RISC-V-relevant commits include: alexanderguzhva (Meta FAIR, drove RVV scaffolding), mnorris11 (Meta, merged RISC-V fast_scan work, active reviewer), and mdouze (Meta FAIR, authored CI cross-compile job).

---

## 2. Port History and Upstreaming Timeline

All RISC-V activity in facebookresearch/faiss is recent and concentrated in two bursts: an external community contribution in August 2025 (stalled) and a Meta-internal scaffolding push in April-May 2026 (fully merged).

| Date | PR | Author | Description | Status |
|---|---|---|---|---|
| 2025-08-04 | [#4503](https://github.com/facebookresearch/faiss/pull/4503) | vsvnakers / lyd1992 (ISCAS, external) | RVV intrinsics for ScalarQuantizer decode_8_components; 1.56x speedup on physical RISC-V hardware | Open / backlog |
| 2026-04-20 | [#5128](https://github.com/facebookresearch/faiss/pull/5128) | alexanderguzhva (Meta) | RVV platform + sq-rvv.cpp with real RVV intrinsics (QT_4bit_uniform + L2) | Closed without merge (superseded by #5156) |
| 2026-04-29 | [#5156](https://github.com/facebookresearch/faiss/pull/5156) | alexanderguzhva (Meta) | Full RVV scaffolding: RISCV_RVV in SIMDLevel enum, dispatch integration, stub overrides | Merged 2026-05-05 (commit 0320279), v1.14.2 |
| 2026-05-06 | [#5184](https://github.com/facebookresearch/faiss/pull/5184) | mdouze (Meta) | CI cross-compile job for riscv64 with RVV dynamic dispatch | Merged 2026-05-07 (commit 7a8e4dd), v1.14.2 |
| 2026-05-16 | [#5216](https://github.com/facebookresearch/faiss/pull/5216) | mnorris11 (Meta) | Move fast_scan RVV forwarders to impl-riscv.cpp; fix 27-44x FastScan QPS regression in DD mode | Merged 2026-05-18 (commit a9f5baa), v1.14.2 |
| 2026-05-26 | [#5233](https://github.com/facebookresearch/faiss/pull/5233) | mnorris11 (Meta) | Per-SIMD TU for PQ scan (AVX2 gather inlining); includes rvv.cpp in the pattern | Merged 2026-05-26, v1.14.2 |
| 2026-04-07 | [#5057](https://github.com/facebookresearch/faiss/pull/5057) | mulugetam (external) | Fix static SIMD dispatch falling to scalar for avx512/arm_sve; encodes RISCV_RVV -> NONE fallback | Merged 2026-05-28 (commit a4e417f), v1.14.3 |

**Key observations:**

- The first merged RISC-V commit landed May 5, 2026. No RISC-V code existed in any prior release.
- PR #5128 was closed without merging because PR #5156 took a different architectural approach and superseded it the following day.
- The external contributor's RVV work (PR #4503, August 2025) predates the Meta-internal merge by nine months but remains unmerged due to API changes.
- No master tracking issue for the riscv64 port exists.

---

## 3. Upstream Support Tier

FAISS has no published platform tier policy. Based on observed maintainer behavior and CI configuration, riscv64 status can be characterized as follows:

- **Build support:** Explicit, first-class. The CMakeLists.txt detects `riscv64|riscv` and selects `FAISS_SIMD_RVV_SRC`. A dedicated toolchain file exists at `cmake/toolchains/riscv64-linux-gnu.cmake`.
- **CI status:** Cross-compile with SIMD smoke test only. No native runner. No full test suite execution.
- **Performance status:** Scaffolding. One real RVV kernel exists (ScalarQuantizer QT_4bit_uniform + L2). All other hot paths fall back to scalar.
- **Release binary status:** No riscv64 binary available via PyPI or GitHub Releases. Debian sid has a native build of version 1.13.2 (pre-RVV).
- **Stated maintainer intent:** Meta engineers have expressed that they "hope RISC-V guys will populate various SIMD things for RaBitQ etc." This signals an expectation of community contribution rather than Meta-driven performance work.

Effective tier: **community-maintained with Meta scaffolding**. Upstream will accept correct RVV contributions but has not committed internal resources to performance optimization.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 SIMD Dispatch Architecture

FAISS uses a per-SIMD translation unit (TU) design. Each SIMD level (AVX2, AVX512, NEON, RISCV_RVV, etc.) has dedicated `.cpp` files that are compiled with architecture-specific flags. A central dispatch mechanism (`simd_dispatch.h`) routes function calls to the appropriate TU at runtime (dynamic dispatch, `FAISS_OPT_LEVEL=dd`) or compile time (static, `FAISS_OPT_LEVEL=generic/avx2/etc.`).

`SIMDLevel::RISCV_RVV` is registered in the `SIMDLevel` enum in `faiss/utils/simd_levels.h`. The fallback chain is `RISCV_RVV -> NONE` (terminal leaf; no sub-level of RVV exists). Detection is purely compile-time via `#if defined(__riscv) && defined(COMPILE_SIMD_RISCV_RVV)`; there is no runtime HWCAP probe.

The `simd_width<RISCV_RVV>()` function is statically asserted to block because RVV uses variable-length vector registers incompatible with the fixed-256-bit `simdlib` abstraction. No `simdlib_rvv.h` exists; unlike AVX2 and NEON, RVV bypasses the simdlib abstraction layer entirely.

### 4.2 RVV Source File Inventory

`FAISS_SIMD_RVV_SRC` in `faiss/CMakeLists.txt` lists 7 source files. All are compiled with `-march=rv64gcv_zvfhmin -mabi=lp64d` and the preprocessor define `COMPILE_SIMD_RISCV_RVV`.

| File | Functional Area | RVV Intrinsics Present | Status |
|---|---|---|---|
| `faiss/impl/scalar_quantizer/sq-rvv.cpp` | ScalarQuantizer decode | Yes (12 intrinsics) | Partial -- QT_4bit_uniform + L2 only |
| `faiss/impl/fast_scan/impl-riscv.cpp` | FastScan scanner factory | None | Stub -- all 6 forwarders delegate to NONE |
| `faiss/impl/pq_code_distance/rvv.cpp` | PQ code distance | None | Stub -- explicit comment "no RVV-optimized PQ code distance exists yet" |
| `faiss/impl/binary_hamming/rvv.cpp` | Binary Hamming indices | None | Stub |
| `faiss/utils/simd_impl/distances_rvv.cpp` | fvec_L2sqr, fvec_inner_product, fvec_L1, etc. | None | Stub -- ~160 lines, zero RVV intrinsics |
| `faiss/utils/simd_impl/rabitq_rvv.cpp` | RaBitQ bitwise ops | None | Stub -- 4 functions, all call NONE |
| `faiss/utils/hamming_distance/hamming_rvv.cpp` | Hamming distance | None | Stub |

Two headers also exist:

- `faiss/utils/hamming_distance/hamming_computer-rvv.h`: 9 HammingComputer structs, all inheriting from NONE via `FAISS_INHERIT_HAMMING_RVV` macro. Comment: "There is no RVV-optimized HammingComputer implementation yet."
- `cmake/toolchains/riscv64-linux-gnu.cmake`: Cross-compilation toolchain (complete and functional).

### 4.3 The One Working RVV Kernel

`sq-rvv.cpp` contains the only file with actual `<riscv_vector.h>` intrinsics. It implements a fast path for `DCTemplate<Codec4bit_Uniform, SimilarityL2>`. The 12 intrinsics used are:

`__riscv_vsetvl_e8m1`, `__riscv_vle8_v_u8m1`, `__riscv_vand_vx_u8m1`, `__riscv_vsrl_vx_u8m1`, `__riscv_vmaxu_vv_u8m1`, `__riscv_vminu_vv_u8m1`, `__riscv_vsub_vv_u8m1`, `__riscv_vwmulu_vv_u16m2`, `__riscv_vadd_vv_u16m2`, `__riscv_vmv_v_x_u32m1`, `__riscv_vwredsumu_vs_u16m2_u32m1`, `__riscv_vmv_x_s_u32m1_u32`.

The approach uses integer RVV (u8/u16/u32) with widening multiply for squared L2 computation. No floating-point RVV types (`vfloat32m1_t`) are used. The `zvfhmin` extension is enabled via the march flag but its use within this specific kernel is not confirmed by the research findings [NEEDS VERIFICATION].

Meta reviewer mdouze noted this approach "could be a model on how to implement SVE that is also variable-width" and "That's a cool optimization that I never came to implement. We should implement it as well for AVX and friends."

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Architecture Detection

`faiss/CMakeLists.txt` detects riscv64 via:

```cmake
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "(riscv64|riscv)")
  set(FAISS_SIMD_SRC ${FAISS_SIMD_RVV_SRC})
```

The toolchain file sets `CMAKE_SYSTEM_PROCESSOR=riscv64`, triggering this branch during cross-compilation.

### 5.2 Cross-Compile Setup (Official CI Method)

Required host packages on Ubuntu 24.04:

- `gcc-riscv64-linux-gnu`, `g++-riscv64-linux-gnu`
- `libopenblas-dev:riscv64` (from Ubuntu Ports via `dpkg --add-architecture riscv64`)
- `libgomp1:riscv64`
- `qemu-user-static` (for binary verification)

The CI script creates a sysroot symlink required by CMake's library discovery:

```
/usr/riscv64-linux-gnu/usr/lib/riscv64-linux-gnu -> /usr/lib/riscv64-linux-gnu
```

### 5.3 CMake Configure Command

```sh
cmake -B build \
  -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/riscv64-linux-gnu.cmake \
  -DFAISS_OPT_LEVEL=dd \
  -DFAISS_ENABLE_GPU=OFF \
  -DFAISS_ENABLE_PYTHON=OFF \
  -DFAISS_ENABLE_C_API=OFF \
  -DBUILD_TESTING=ON \
  -DBUILD_SHARED_LIBS=ON \
  -DBLA_VENDOR=OpenBLAS \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_BUILD_RPATH=/usr/lib/riscv64-linux-gnu
```

### 5.4 Required Disabled Flags

| Flag | Value for riscv64 | Reason |
|---|---|---|
| `-DFAISS_ENABLE_GPU` | Must be OFF | No CUDA or ROCm on riscv64 |
| `-DFAISS_ENABLE_PYTHON` | OFF recommended for cross-builds | SWIG/Python discovery unreliable when cross-compiling |
| `-DFAISS_ENABLE_CUVS` | Default OFF | cuVS requires CUDA |
| `-DFAISS_ENABLE_SVS` | Default OFF | SVS is Intel-only |
| `-DFAISS_ENABLE_MKL` | Default ON (no-op on riscv64) | CMake silently falls through to OpenBLAS; not a blocker |

`FAISS_OPT_LEVEL=dd` is the correct value for riscv64. The `avx2`, `avx512`, and `sve` levels do not apply. In `dd` mode, RVV is treated as always present if compiled with `rv64gcv` -- no runtime HWCAP detection occurs.

### 5.5 Toolchain File: `cmake/toolchains/riscv64-linux-gnu.cmake`

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER   riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

### 5.6 No Dockerfile

No riscv64-specific Dockerfile exists in the repository. The CI uses multiarch apt on a standard Ubuntu runner. No `.ci/docker/Dockerfile.riscv64` or equivalent is present.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 (AVX2/AVX512) | arm64 (NEON/SVE) | riscv64 (RVV) | riscv64 Gap |
|---|---|---|---|---|
| ScalarQuantizer distance | Full -- hand-tuned intrinsics for all codecs | Full -- NEON intrinsics (~530 lines in sq-neon.cpp) | Partial -- one codec/metric pair (QT_4bit_uniform + L2) uses real RVV; all others scalar | All codec/metric combos except QT_4bit_uniform + L2 |
| Vector distances (fvec_L2sqr, fvec_inner_product, etc.) | Full -- AVX2/AVX512 intrinsics | Partial -- 2 of 7 functions use NEON; rest delegate | Scalar -- all 15 functions call NONE | All distance functions |
| FastScan scanner | Full | Partial (SVE forwards to NEON) | Scalar -- all 6 forwarders in impl-riscv.cpp call NONE | All FastScan kernels |
| PQ code distance | Full -- AVX2 gather inlining in per-SIMD TU | Partial -- NEON dispatch wrapper | Scalar -- explicit comment "no RVV-optimized PQ code distance exists yet" | All PQ scan kernels |
| RaBitQ (bitwise ops) | Full -- AVX2/AVX512 hand-tuned | Scalar (rabitq_neon.cpp delegates to NONE) | Scalar -- all 4 functions call NONE | All RaBitQ kernels |
| Binary Hamming indices | Full (AVX2/AVX512) | Partial | Scalar | All Hamming ops |
| Hamming computers | Full -- AVX2/AVX512 popcount | Full -- NEON XOR+vcnt+vaddv (~245-line header) | Scalar -- 9 structs all inherit from NONE, no RVV intrinsics | All HammingComputer variants |
| simdlib abstraction layer | Full (simdlib_avx2.h, simdlib_avx512.h) | Full (simdlib_neon.h) | Missing -- no simdlib_rvv.h | simdlib prevents broader SIMD-templated paths from using RVV |
| SIMD dispatch / build plumbing | Full | Full | Full -- RISCV_RVV registered in enum, dispatch table, fallback chain | None |
| GPU indexes (IVF-Flat GPU, RAFT) | Full (CUDA) | Partial (no CUDA on ARM typically) | None | CUDA/ROCm unavailable on riscv64; all GPU indexes absent |

**Summary of functional gaps:** 6 of 7 RISC-V TUs contain zero intrinsics and deliver scalar performance. The simdlib abstraction layer has no RVV variant, blocking the simdlib-templated code paths from benefiting from RVV regardless of future kernel work. All GPU indexes are absent with no path to availability.

---

## 7. CI/CD Infrastructure

### 7.1 CI Job Details

File: `.github/workflows/build-pull-request.yml`<br/>
Trigger: Called from `build.yml`, which fires on push to main, PRs to main, version tags (`v*`), and `workflow_dispatch`.

Job name: `linux-riscv64-DD-cmake` ("Linux riscv64 Dynamic Dispatch cross-compile (cmake)")<br/>
Runner: `ubuntu-latest` (x86_64 host; no native riscv64 runner)<br/>
Dependency: Requires `linux-x86_64-cmake` to pass first.

CMake flags used: `-DFAISS_OPT_LEVEL=dd -DFAISS_ENABLE_GPU=OFF -DBUILD_TESTING=ON -DBUILD_SHARED_LIBS=ON -DFAISS_ENABLE_PYTHON=OFF -DFAISS_ENABLE_C_API=OFF -DBLA_VENDOR=OpenBLAS -DCMAKE_BUILD_TYPE=Release`

Build target: `faiss_test` (includes `test_factory_tools`, prevents linker from pruning FAISS internals).

### 7.2 Test Execution

The CI job does run tests under QEMU, but with a narrow filter:

```sh
qemu-riscv64-static -L /usr/riscv64-linux-gnu \
  build/tests/faiss_test \
  --gtest_filter="SIMDConfig.*:SIMDLevel.*:CompileOptions.*"
```

This tests SIMD dispatch infrastructure (compile options, level detection), not FAISS algorithmic correctness. No index build, search, recall, or correctness tests are executed on riscv64.

The CI also verifies that the output binary is a RISC-V ELF and that shared library resolution succeeds under QEMU ldd. `perf_tests` are explicitly skipped when `CMAKE_CROSSCOMPILING` is set.

### 7.3 What CI Does Not Cover

- Full GTest suite (index correctness, approximate recall, codec roundtrip)
- Python bindings (`FAISS_ENABLE_PYTHON=OFF`)
- C API (`FAISS_ENABLE_C_API=OFF`)
- Native hardware execution (QEMU only)
- GPU indexes (not applicable)

### 7.4 Coverage in Other CI Workflows

riscv64 is absent from: `nightly.yml`, `build-release.yml`, `build-pip.yml`, `build-pip-gpu.yml`, `autoclose.yml`, `retry_build.yml`, `index-io-backward-compatibility.yml`, `update-doxygen.yml`, `publish-docs.yml`. No Jenkinsfile, `.gitlab-ci.yml`, or `.cirrus.yml` exists.

Self-hosted native RISC-V runners were discussed in [PR #5128](https://github.com/facebookresearch/faiss/pull/5128). Maintainer mnorris11 stated: "We would need a self-hosted runner as the Github Actions runners don't seem to support it." No self-hosted RISC-V runner has been added.

---

## 8. Distribution and Release Status

### 8.1 Release Versions with riscv64 Support

| Release | Date | riscv64 Source Support | Notes |
|---|---|---|---|
| v1.14.2 | 2026-05-21 | First release with RVV scaffolding (PRs #5156, #5184, #5216) | Source-only; no binary artifacts |
| v1.14.3 | After 2026-05-22 | Adds static dispatch SIMD fallback fix (PR #5057) | Source-only; no binary artifacts |
| v1.14.1 and earlier | -- | No riscv64 support | -- |

### 8.2 Binary Package Availability

| Channel | Version | riscv64 Available |
|---|---|---|
| GitHub Releases (binary assets) | v1.14.3 | No -- every release ships only auto-generated source archives (.zip, .tar.gz) |
| PyPI `faiss` | 1.5.3 (abandoned ~2019) | No -- only manylinux1_x86_64 and macosx_10_13_x86_64 wheels |
| PyPI `faiss-cpu` | Up to 1.9.0.post1 [NEEDS VERIFICATION for exact latest] | No -- wheels for x86_64, aarch64/arm64 (Linux and macOS), win_amd64 only |
| RISE Python wheel builder | -- | No -- FAISS absent from the 76-package list |
| Ubuntu 24.04 noble | -- | No -- package not present in noble at all |
| Ubuntu jammy / later dev suites | -- | Yes -- libfaiss-dev, python3-faiss list riscv64 as a supported arch |
| Debian sid | 1.13.2-1+b1 | Yes -- native build on rv-manda-02 (2026-05-22, build time 11h42m); status "Maybe-Successful" |
| Arch Linux RISC-V (archriscv) | -- | No -- package absent |

**Notes on Debian sid entry:** The version 1.13.2-1+b1 predates all RVV work (RVV landed in upstream v1.14.2). This binary delivers no RVV acceleration. The "Maybe-Successful" status reflects riscv64's Tier-2 ports architecture classification in Debian rather than a confirmed clean build. The `/filelist` endpoint returned "No such package in this suite on this architecture," which may indicate this package is in `debian-ports` rather than the main Debian archive, requiring additional `sources.list` configuration [NEEDS VERIFICATION].

**Conclusion:** riscv64 users cannot `pip install faiss-cpu`. No prebuilt binary with RVV support exists in any distribution channel as of June 2026. Source builds are possible but require correctly configured SWIG include paths (issue #4321).

---

## 9. Dependencies

### 9.1 Mandatory Dependencies on riscv64

| Dependency | Role | riscv64 Build Status | riscv64 Binary Availability | Notes |
|---|---|---|---|---|
| OpenBLAS | BLAS/LAPACK backend for training (GEMM, k-means, PQ training) | Green -- RVV 1.0 support since v0.3.28; ZVL128B/ZVL256B targets | Debian sid v0.3.33; Ubuntu 24.04 v0.3.26 | Ubuntu 24.04 version is old, missing DYNAMIC_ARCH and ZVL targets. LAPACK tests explicitly disabled in upstream CI. TRSM has a correctness bug blocking ZVL256B enabling. |
| Intel MKL | Preferred BLAS/LAPACK (FAISS_ENABLE_MKL=ON default) | Not available -- x86 only | Not available | CMake falls through silently to OpenBLAS on riscv64; no user-visible error. |
| OpenMP (libgomp / libomp) | Parallelism for index search and training | Green -- libgomp ships with all standard riscv64 GCC toolchains | Available in standard riscv64 Linux packages | No riscv64-specific OpenMP issues identified. |
| GCC RVV toolchain | Compile-time for -march=rv64gcv_zvfhmin | Partial -- GCC 13 may silently produce scalar code for RVV paths; GCC 14+ recommended | gcc-riscv64-linux-gnu available via Ubuntu multiarch | No minimum GCC version is documented by FAISS upstream [NEEDS VERIFICATION on GCC 13 vs 14 behavior for these specific intrinsics]. |
| CMake >= 3.24.0 | Build system | Green | Available on all standard Linux distributions | No riscv64-specific CMake issues. |
| glibc | C runtime, pthreads, libm | Green -- riscv64 support since glibc 2.27 | Available on all standard riscv64 Linux distributions | No known issues. |

### 9.2 Optional Dependencies (Unavailable on riscv64)

| Dependency | Role | Status |
|---|---|---|
| CUDA / cuBLAS | GPU-accelerated index search and training | Not available -- CUDA has no riscv64 port. FAISS GPU indexes entirely absent. |
| ROCm / hipBLAS | AMD GPU backend | Not available -- no riscv64 ROCm port. |
| cuVS | NVIDIA approximate nearest neighbor GPU algorithms | Not available -- CUDA dependency. |
| SVS | Intel Scalable Vector Search | Not available -- Intel-only. |

### 9.3 Python Binding Dependencies

| Dependency | Role | riscv64 Status |
|---|---|---|
| SWIG | Python wrapper code generator (build-time only, runs on host) | Green for native builds; issue #4321 (closed) traced a riscv64 pip install failure to misconfigured SWIG include paths in the PyPI source distribution |
| CPython >= 3.11 | Python extension target | Green -- official riscv64 support since Python 3.11 |
| faiss-cpu wheel (PyPI) | Prebuilt binary distribution | Not available -- no riscv64 wheel in any faiss-cpu release |

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

None. FAISS is not a funded or tracked project within the RISE Project. Meta is not a RISE member at any tier. The RISE AI/ML Working Group and the 2025 Gemini credit recipients program do not name FAISS as a workload. The RISE Python wheel builder does not include FAISS.

### 10.2 Community Activity

All RISC-V FAISS work originates from two sources:

1. External contributors from ISCAS (Institute of Computing Technology, Chinese Academy of Sciences): vsvnakers and lyd1992 authored PR #4503. ISCAS is a RISE General Member. Their PR has been blocked since September 2025.

2. Meta FAIR employees (alexanderguzhva, mnorris11, mdouze): drove all merged RISC-V scaffolding in April-May 2026.

No RISC-V hardware vendor (SiFive, SpacemiT, Andes Technology) has contributed to FAISS RISC-V work. No blog posts, conference papers, or benchmarking reports comparing FAISS on riscv64 vs arm64 or vs x86_64 have been published anywhere findable via web search or the RISE Project blog.

### 10.3 Downstream Users and Integrations

[PR #5128](https://github.com/facebookresearch/faiss/pull/5128) and [PR #5156](https://github.com/facebookresearch/faiss/pull/5156) reference Knowhere PRs #1594 and #1605 (Knowhere is a vector index library used by Milvus). This indicates at least one downstream project is actively tracking FAISS RISC-V work.

Data not available: Full scope of downstream projects that have picked up or plan to pick up FAISS riscv64 support.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Issues

**[Issue #4321](https://github.com/facebookresearch/faiss/issues/4321) -- "riscv64 device build failed" (Closed 2025-04-29)**

A user attempted `pip install faiss-cpu` on a riscv64 machine (as a dependency of browser-use). Build failed during SWIG code generation due to header path resolution errors (`platform_macros.h` not found). This is a build system / include path issue in the PyPI source distribution, not a riscv64 code incompatibility. No riscv64-specific fix was applied; the issue was closed.

**[PR #4503](https://github.com/facebookresearch/faiss/pull/4503) -- ScalarQuantizer RVV optimization (Open, backlog since 2025-12-08)**

Authored by vsvnakers (ISCAS). Adds RVV intrinsics to `decode_8_components` in ScalarQuantizer.cpp. Code was reviewed positively by alexanderguzhva ("the code looks good") and formatting issues were addressed. Blocked because the PR targets the old `#ifdef`-based SIMD API; maintainers directed the author to rebase against the new per-SIMD TU framework (PR #4557). No activity since September 2025. The new framework (impl-riscv.cpp, sq-rvv.cpp) is now merged and ready to receive this work, but no rebase has been initiated.

**No NaN / floating-point correctness bugs:** GitHub search for "riscv nan", "riscv floating", and "riscv correctness" in the repository returned zero results.

### 11.2 Structural Risks

**Static dispatch silent fallback (PR #5057 context):** PR #5057 fixed a bug where static SIMD dispatch silently fell to `SIMDLevel::NONE` for avx512_spr, avx512, and arm_sve builds. The fix explicitly encodes `RISCV_RVV -> NONE` in the fallback chain. A reviewer (mnorris11) proposed a refactor as `get_simd_fallback(SIMDLevel)`. The RISCV_RVV case is now handled, but the original bug class (dispatch masks that inadvertently exclude a platform level) remains a risk pattern.

**No runtime RVV detection:** RVV is assumed always available on riscv64 builds. There is no `getauxval(AT_HWCAP)` or equivalent HWCAP probe. If a riscv64 system lacks the V extension, a build compiled with `rv64gcv` will generate illegal instructions. This is not a bug in FAISS per se (the toolchain flag controls this), but users building for heterogeneous riscv64 hardware need awareness.

**FastScan QPS regression (PR #5216 context):** PR #5216 bundled a fix for a 27-44x FastScan QPS regression in DD mode caused by kernels using scalar types instead of real SIMD intrinsics. The regression was present prior to the May 2026 merge burst. This class of bug (stub delegating to NONE but incurring overhead) is latent in all current riscv64 stubs.

---

## 12. Objections and Upstream Blockers

**Objection 1: PR #4503 is blocked on a SIMD refactor.**

The refactor (PR #4557 -> the new per-SIMD TU architecture in #5156/#5216) is now complete and merged. The blocker is gone. What remains is the mechanical work of rebasing PR #4503 against sq-rvv.cpp. Maintainers have not done this; the external author has not resumed activity. This is a coordination gap, not a technical blocker.

**Objection 2: Maintainers said "we'd rather have a PR against that new API."**

This was stated in September 2025. The new API has been merged. The objection no longer applies.

**Objection 3: No native CI runner.**

Confirmed. mnorris11 stated: "We would need a self-hosted runner as the Github Actions runners don't seem to support it." The current CI is cross-compile + QEMU only. A self-hosted RISC-V runner or a QEMU-based full test execution would be required to close this gap.

**Objection 4: No simdlib_rvv.h.**

The simdlib abstraction is used by some SIMD-templated code paths. Without it, those paths cannot benefit from RVV intrinsics. The approach taken in sq-rvv.cpp (bypassing simdlib entirely with direct intrinsics) is a valid pattern but requires hand-implementing each kernel. Mdouze noted this approach is architecturally sound and suggested it as a model for ARM SVE as well.

**Objection 5: mdouze questioned "will the code be optimized with RVV anytime soon?"**

This concern was recorded during the PR #5156 review. No Meta engineer answered definitively. The project merged the scaffolding expecting community contributors to implement the kernels. This is an accurate characterization of the current situation.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

**Goal:** Enable riscv64 users to build and use FAISS correctly (scalar performance acceptable; correctness required).

The current state is functionally complete for CPU-only workloads. The library builds, links, and runs correctly on riscv64 (verified via QEMU in CI). All SIMD paths fall back to scalar; no correctness regressions are expected from the stub implementations. The remaining functional gap is the PyPI wheel absence.

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| Fix PyPI faiss-cpu riscv64 wheel | Investigate and fix SWIG include path issue (issue #4321); add riscv64 wheel to faiss-cpu release pipeline | 2-4 weeks | High |
| Add full FAISS test suite to riscv64 CI | Run complete GTest suite under QEMU in `linux-riscv64-DD-cmake` job; enable Python tests | 1-2 weeks | High |

### 13.2 Performance Optimization

**Goal:** Achieve meaningful SIMD acceleration on riscv64 relative to scalar.

The only measured data point is the 1.56x speedup in PR #4503 (ScalarQuantizer decode_8_components on physical RISC-V hardware, EulixOS). No published data exists for distance functions, PQ scan, RaBitQ, or FastScan on riscv64.

The highest-impact functions for a vector similarity search workload are distance computations (fvec_L2sqr, fvec_inner_product) and FastScan / PQ scan (used in IVF indexes at query time). Neither has any RVV implementation.

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| Rebase and merge PR #4503 | Update ScalarQuantizer RVV optimization against new sq-rvv.cpp API | 1-2 weeks | High |
| Implement RVV distance kernels | fvec_L2sqr, fvec_inner_product, fvec_norm_L2sqr, fvec_L1, batch-4/NY variants in distances_rvv.cpp | 3-6 weeks | High |
| Implement RVV FastScan forwarders | Replace impl-riscv.cpp NONE delegates with real RVV kernel calls; implement accumulate_to_mem and scanner factory | 4-8 weeks | Medium |
| Implement RVV PQ code distance | pq_code_distance_8bit_single_impl, _four_impl in rvv.cpp; requires understanding the gather pattern from avx2 | 3-5 weeks | Medium |
| Implement RVV RaBitQ kernels | bitwise_and/xor_dot_product, popcount, compute_inner_product using RVV bit manipulation | 3-5 weeks | Medium |
| Implement RVV Hamming computers | HammingComputer16/32/64 and GenHammingComputer variants using RVV XOR + popcount | 2-4 weeks | Low |
| Implement simdlib_rvv.h | RVV variant of the simdlib abstraction layer to unblock simdlib-templated code paths | 4-8 weeks | Low |

### 13.3 CI/CD Infrastructure

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| Native riscv64 runner or full QEMU test execution | Run complete GTest suite on riscv64; requires either self-hosted native runner or QEMU full-test job | 1-3 weeks setup | High |
| riscv64 Python wheel in faiss-cpu release | Add riscv64 target to the faiss-cpu PyPI build pipeline (likely manylinux riscv64 or equivalent) | 2-4 weeks | High |
| Benchmark job for riscv64 | Cross-platform perf job to track distance/FastScan/RaBitQ throughput on riscv64 vs arm64 baseline | 2-3 weeks | Medium |

### 13.4 Ecosystem Enablement

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| Publish riscv64 vs arm64 benchmark data | Run benchs/bench_rabitq.py and equivalent on riscv64 hardware; publish results | 1-2 weeks | Medium |
| Engage RISE AI/ML WG | Propose FAISS as a tracked workload for RISE optimization efforts | 1 week | Low |
| Coordinate with Knowhere / Milvus | Knowhere PRs #1594/#1605 track FAISS RISC-V; coordinate testing on Milvus riscv64 stack | Ongoing | Low |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix riscv64 faiss-cpu PyPI wheel (SWIG include path) | 2-4 | Distribution / Meta | High |
| Functional | Full test suite in riscv64 CI | 1-2 | Meta or contributor | High |
| Performance | Rebase and land PR #4503 (ScalarQuantizer RVV) | 1-2 | External (ISCAS) or internal | High |
| Performance | RVV distance kernels (fvec_L2sqr, fvec_inner_product, etc.) | 3-6 | Internal | High |
| Performance | RVV FastScan forwarders | 4-8 | Internal | Medium |
| Performance | RVV PQ code distance | 3-5 | Internal | Medium |
| Performance | RVV RaBitQ kernels | 3-5 | Internal | Medium |
| Performance | RVV Hamming computers | 2-4 | Internal | Low |
| Performance | simdlib_rvv.h abstraction layer | 4-8 | Internal | Low |
| CI/CD | Native runner or full QEMU test execution | 1-3 | Meta or self-hosted | High |
| CI/CD | riscv64 wheel in faiss-cpu release pipeline | 2-4 | Meta | High |
| CI/CD | Cross-platform benchmark job | 2-3 | Internal | Medium |
| Ecosystem | riscv64 vs arm64 published benchmarks | 1-2 | Internal | Medium |
| Ecosystem | RISE AI/ML WG engagement | 1 | BD | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [facebookresearch/faiss repository](https://github.com/facebookresearch/faiss)
- [faiss/CMakeLists.txt -- SIMD/RVV/OpenMP/BLAS arch detection](https://github.com/facebookresearch/faiss/blob/main/faiss/CMakeLists.txt)
- [cmake/toolchains/riscv64-linux-gnu.cmake](https://github.com/facebookresearch/faiss/blob/main/cmake/toolchains/riscv64-linux-gnu.cmake)
- [faiss/utils/simd_levels.h -- SIMDLevel::RISCV_RVV enum](https://github.com/facebookresearch/faiss/blob/main/faiss/utils/simd_levels.h)
- [faiss/utils/simd_levels.cpp -- compile-time detection](https://github.com/facebookresearch/faiss/blob/main/faiss/utils/simd_levels.cpp)
- [PR #4503 -- Add RVV optimizations for ScalarQuantizer (open, backlog)](https://github.com/facebookresearch/faiss/pull/4503)
- [PR #5057 -- Fix static SIMD dispatch to scalar for avx512/arm_sve (merged 2026-05-28)](https://github.com/facebookresearch/faiss/pull/5057)
- [PR #5128 -- Introduce RVV platform and ScalarQuantizer (closed without merge)](https://github.com/facebookresearch/faiss/pull/5128)
- [PR #5156 -- Introduce RVV (merged 2026-05-05, v1.14.2)](https://github.com/facebookresearch/faiss/pull/5156)
- [PR #5184 -- CI: cross-compile for riscv64 with RVV dynamic dispatch (merged 2026-05-07, v1.14.2)](https://github.com/facebookresearch/faiss/pull/5184)
- [PR #5216 -- Move RISC-V fast_scan forwarders to impl-riscv.cpp (merged 2026-05-18, v1.14.2)](https://github.com/facebookresearch/faiss/pull/5216)
- [PR #5233 -- Per-SIMD TU for PQ scan including rvv.cpp (merged 2026-05-26, v1.14.2)](https://github.com/facebookresearch/faiss/pull/5233)
- [Issue #4321 -- riscv64 device build failed (closed 2025-04-29)](https://github.com/facebookresearch/faiss/issues/4321)
- [faiss-cpu on PyPI](https://pypi.org/project/faiss-cpu/)
- [Debian buildd status for faiss](https://buildd.debian.org/status/package.php?p=faiss)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)