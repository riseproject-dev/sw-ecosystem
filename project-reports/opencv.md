---
title: OpenCV
parent: Project Reports
color: blue
dependencies:
  - name: oneTBB
    relation: runtime-dependency
    criticality: optional
  - name: Eigen
    relation: runtime-dependency
    criticality: optional
  - name: LAPACK
    relation: runtime-dependency
    criticality: optional
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: libwebp
    relation: runtime-dependency
    criticality: optional
  - name: libtiff
    relation: runtime-dependency
    criticality: optional
  - name: OpenJPEG
    relation: runtime-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: optional
  - name: FFmpeg
    relation: runtime-dependency
    criticality: optional
  - name: OpenCL
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="opencv" %}

# OpenCV

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenCV<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenCV (Open Source Computer Vision Library) is a C++ computer-vision and machine-learning library with Python, Java and other bindings, distributed under the Apache License 2.0. It is stewarded by the Open Source Vision Foundation, a US-registered 501(c)(3) nonprofit operating publicly as "OpenCV.org" / "OpenCV Foundation." The predecessor umbrella took over support in August 2012.

Governance is a loose foundation-over-corporate-core-team model rather than a formal multi-stakeholder consortium. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository; decision-making is de facto concentrated in a small core team of long-tenured committers. There is no publicly located board roster or bylaws document, and opencv.org itself returns HTTP 403 to automated fetches, so governance detail beyond the GitHub-repo-visible facts is [NEEDS VERIFICATION].

Corporate history of support: Intel (founded the project in 1999, later acquired Itseez in 2016), Willow Garage (funded the core team for about 5 years), Itseez (pre-acquisition core-team funding), Xperience AI, OpenCV.ai (present-day company operating as OpenCV's core commercial dev team - Alexander Alekhin, Vadim Pisarevsky and others), NVIDIA (Android/embedded Linux/WinRT/CUDA ports), AMD (about 3 years of support), and the Shenzhen Institute of Artificial Intelligence and Robotics for Society (AIRS, current core-team support). A tiered Gold/Silver/Bronze sponsorship program is referenced by search snippets but the current sponsor roster could not be independently fetched (opencv.org blocks automated access) - [NEEDS VERIFICATION].

No formal platform-tier policy exists (no Tier-1/Tier-2 document analogous to LLVM or Rust). Architecture support is added ad hoc through PRs and CI, historically driven by whichever vendor contributes and maintains the relevant intrinsics/HAL backend and toolchain files (ARM/NEON via Carotene, MIPS/MSA, IBM/VSX, and RISC-V/RVV all entered this way). The community stance toward new ports is receptive: a vendor contributes intrinsics, a toolchain file, and ongoing maintenance, and the small core team reviews and merges through normal code review, with no published acceptance criteria beyond that.

**Note on RISE membership:** OpenCV/opencv.org itself is not listed as a RISE Project member (Premier or General tier). The two organizations that did the bulk of the RISC-V/RVV implementation work in OpenCV - Alibaba (T-Head) and the Institute of Software, Chinese Academy of Sciences (CAS) - are themselves RISE members, but their OpenCV contributions were made directly to opencv/opencv, not routed through a RISE-branded OpenCV fork.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-04-28 | First RISC-V-related merge: [PR #17145](https://github.com/opencv/opencv/pull/17145), "Added initial version of cmake toolchain for RISC-V architecture," by asmorkalov | GitHub commit search |
| 2020-08-04 | [PR #17922](https://github.com/opencv/opencv/pull/17922) merged - GSoC project adding `riscv64-clang` toolchain file and initial C++ universal-intrinsics RVV support | GitHub PR search |
| 2020-12-02 | [PR #18228](https://github.com/opencv/opencv/pull/18228) merged - follow-on GSoC work implementing the Universal Intrinsics HAL for RVV | GitHub PR search |
| 2021-05-25 | [PR #19778](https://github.com/opencv/opencv/pull/19778) merged - RVV 0.7.1 vector support (Alibaba/T-Head, damonyu1989) | GitHub PR search |
| 2022-07-19 | [PR #22179](https://github.com/opencv/opencv/pull/22179) merged - "[GSoC] New universal intrinsic backend for RVV," a rewritten/more complete backend | GitHub PR search |
| 2023-02-20 | [PR #23246](https://github.com/opencv/opencv/pull/23246) merged - RVV 0.7 support added to the mainline RVV-intrinsics syntax | GitHub PR search |
| 2023-10-16 | "Enable RISC-V CI" merged (referenced via commit `ce2b9f83f7`, PR #24401) - turns on continuous QEMU-based RISC-V/RVV CI | GitHub commit search |
| 2024-05-28 | [PR #25167](https://github.com/opencv/opencv/pull/25167) merged - 3rdparty NDSRVP library (Andes P-extension 0.5.2 optimizations) | GitHub PR search |
| 2024-07-19 | [PR #25883](https://github.com/opencv/opencv/pull/25883) merged - upgrades RVV intrinsics, removes the obsolete legacy backend | GitHub PR search |
| 2025-07-09 | OpenCV blog: [Introducing HAL riscv-rvv](https://opencv.org/introducing-hal-riscv-rvv-unleashing-the-power-of-risc-v-cpus-with-rvv-1-0/) - HAL riscv-rvv, available since OpenCV 4.12, covers 119 core/imgproc functions | OpenCV blog |
| 2025-05-05 | [Issue #27279](https://github.com/opencv/opencv/issues/27279) / [#27281](https://github.com/opencv/opencv/issues/27281) opened - RVV accuracy regressions in 5.x remap/warpPerspective (still open) | GitHub issue search |
| 2026-05-14 | [PR #28144](https://github.com/opencv/opencv/pull/28144) merged - upgrades warpPerspective precision, disables the RVV SIMD path for warpPerspective/remap on RISC-V as a mitigation | GitHub PR fetch, deep-read |
| 2026-05-17/18 | [PR #29047](https://github.com/opencv/opencv/pull/29047) opened (still open as of this report) - restores RVV SIMD for warpAffine/warpPerspective while fixing accuracy | GitHub PR search |
| 2026-08-31 | [PR #29832](https://github.com/opencv/opencv/pull/29832) merged - SIMD support for FP8 (RVV path) | GitHub PR search |

**Key contributors by organization:** T-Head / Alibaba (`intrin_rvv071.hpp`, RVV 0.7.1 support, GSoC 0.7.1 work by damonyu1989/yulj) - Institute of Software, Chinese Academy of Sciences (`intrin_rvv_scalable.hpp`, modern scalable intrinsics backend) - SpaceMIT Inc. (`hal/riscv-rvv/` HAL plugin, 2025 copyright headers, real-hardware validation on SpacemiT MUSE Pi/K1) - Andes Technology (RVP052 packed-SIMD extension, NDSRVP third-party library, Andes toolchain) - individual community contributors asmorkalov (OpenCV.ai, maintainer, files/merges/triages most riscv issues), fengyuentau (RVV HAL fixes), mshabunin (RVV-intrinsics-v1.0 transition, PR #23383), vpisarev (early API-compatibility negotiation with the upstream RVV intrinsics working group), hanliutong (RVV universal-intrinsic maintainer), and recent contributors satyam102006 and Ave-Misumi (5.x remap/warp regression fixes).

**Is it fully upstream?** Yes - all RISC-V code lives in the mainline `opencv/opencv` repository (no long-lived fork), is exercised by upstream PR-gated CI, and continues to receive active commits through 2026 (see Section 7, Section 11).

## 3. Upstream Support Tier

No formal, documented tier policy exists for platforms, including RISC-V (confirmed: nothing in `SECURITY.md`, `CONTRIBUTING.md`, `README.md`, or repo docs formalizes support tiers). Support is de facto driven by whichever silicon vendor contributes and keeps CI/toolchains working.

Evidence of practical support level:
- riscv64 PR-gated CI exists and blocks merges to `4.x`/`5.x` on failure (build + test execution) - see Section 7.
- No upstream-published riscv64 binary release exists for OpenCV itself (GitHub Releases ship only Android/iOS/Windows bundles and docs, for every architecture, not a riscv64-specific gap).
- Mainline PyPI `opencv-python` does not carry a riscv64 wheel (`https://pypi.org/pypi/opencv-python/json` inspected - no riscv64 entry in `urls`).
- A third party (the RISE wheel builder) fills the gap for Python distribution; distro packaging fills the gap for system libraries (Ubuntu 26.04 ships `python3-opencv` and the `libopencv-*` family for riscv64).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Yes | Yes | Yes (self-hosted riscv64 runner, `opencv-ru-lin-riscv`) |
| Upstream CI runs tests | Yes | Yes | Yes (`opencv_test_core`, `_imgproc`, `_dnn` via QEMU RVV1.0; broader nightly matrix on real hardware) |
| Upstream-published binary | No (GitHub Releases: Android/iOS/Windows bundles only, no generic Linux) | No (same) | No (same) |
| PyPI wheel (mainline) | Yes | Yes | No |
| Dedicated HAL/SIMD backend | IPP (proprietary, x86-only) | NEON/Carotene | RVV `hal/riscv-rvv` |
| Distro packaging | Ubuntu, Debian, Fedora, Arch | Ubuntu, Debian, Fedora, Arch | Ubuntu 26.04 (universe/ports) confirmed |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Repo inspected at `opencv/opencv` HEAD `23212f1427ccb1aa027d91e0737f08b1af07d44c` (2026-09-07, `5.x` branch), cloned to `/home/user/opencv/opencv`. No `.S` assembly files exist for RISC-V anywhere in the tree - all RISC-V-specific code is C/C++ using RVV C intrinsics (`riscv_vector.h`).

**hal/riscv-rvv/ - dedicated HAL plugin (primary component).** A self-contained static library (`rvv_hal`) that OpenCV's HAL layer loads to replace generic core/imgproc/dnn/features2d kernels with RVV 1.0 implementations. 61 files, 24,225 total lines, authored mainly by Institute of Software CAS and SpaceMIT Inc. (2025 copyright headers). Gated on `__riscv_v == 1000000` (RVV 1.0) or the T-Head 0.7.1 draft ABI. Covers:
- `src/core/` (24 files) - atan, cart/polar conversion, cholesky/LU/QR/SVD, compare, convertScale, copy-mask, div, dotprod, DXT, exp/log/sqrt, flip, LUT, magnitude, mean, merge/split, minmax, norm (1087+1215 lines across two files), transpose.
- `src/imgproc/` (26 files) - bilateral filter, box filter, Canny, color conversion (`color.cpp`, 3159 lines, the largest file in the HAL), filter/gaussian/median blur, histogram, integral, Laplacian, moments, morphology, pyramids, resize (1216 lines, documented coverage matrix), Scharr, sep-filter, Sobel, spatial gradient, threshold, warp (1196 lines, affine/perspective).
- `src/dnn/` (3 files) - conv (550 lines, blocked NCHWc RVV convolution with fused activation/residual epilogue), depthwise, pooling.
- `src/features2d/` (2 files) - FAST corner detector.

Coverage is real but partial by design: 39 of the 61 `.cpp`/`.hpp` files contain `CV_HAL_ERROR_NOT_IMPLEMENTED` fallback branches for unsupported type/channel/parameter combinations (e.g. `resize.cpp` has 15, `warp.cpp` 15, `color.cpp` 34) - unsupported cases fall through to the generic/universal-intrinsics path. This is standard OpenCV HAL practice, not a stub module.

**Universal-intrinsics RVV backends** (`modules/core/include/opencv2/core/hal/`): `intrin_rvv_scalable.hpp` (2721 lines, modern scalable RVV 1.0 backend, actively maintained - 2026 AMD copyright alongside 2022 ISCAS authorship) and `intrin_rvv071.hpp` (2899 lines, legacy T-Head/C906 0.7.1 draft-ABI backend, kept for backward compatibility, also carries a 2026 AMD copyright plus original 2015 PingTouGe Semiconductor authorship).

**DNN module** additional RVV-specialized branches inside otherwise-generic SIMD-dispatch files (`conv_winograd_f63.simd.hpp`, `fast_gemm_kernels.simd.hpp`, `conv_depthwise.simd.hpp`, `conv2_kernels.simd.hpp`, int8 kernels), plus a separate vendor extension: `modules/dnn/src/int8layers/layers_rvp052.hpp` (36 lines), gated on `__riscv_dsp && __ANDES`, using Andes' proprietary `nds_intrinsic.h` for the RVP052 packed-SIMD DSP draft extension - Andes-specific, distinct from standard RVV.

**Other RISC-V-conditional code:** `modules/video/src/lkpyramid.cpp` (Lucas-Kanade), `modules/imgproc/src/equalize_hist.simd.hpp`, `modules/core/src/{mean,arithm,matmul,convert_scale}.simd.hpp`, `modules/geometry/.../levmarq.cpp`, `modules/ptcloud/src/pose_graph.cpp`.

**Bundled third-party libraries carry their own RISC-V code:** zlib-ng (`3rdparty/zlib-ng/arch/riscv/`, 7 files, ~403 lines, runtime HWCAP V-bit detection), MLAS (`3rdparty/mlas/lib/riscv64/`, SGEMM RVV kernels, 390 lines, intrinsics-only - no ASM kernels for RISC-V, unlike x86/ARM/Power paths in the same build), libpng (`3rdparty/libpng/riscv/`, PNG row-filter RVV acceleration, 335 lines).

**ISA extensions targeted:** base G+C (general+compressed), V (RVV 1.0, primary), Zvfh/Zvfhmin (vector half-precision float). Andes RVP052 (vendor DSP/packed-SIMD draft) is used in one narrow int8 header. No Zba/Zbb/Zbc/Zbs (Bitmanip), Zicond, or Zicboz extension usage was found anywhere in the codebase.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated HAL plugin | IPP (proprietary blob, x86-only) | Carotene (NEON) | `hal/riscv-rvv` (24,225 lines, 119 functions) |
| Universal intrinsics | SSE/AVX | NEON | RVV 1.0 scalable + RVV 0.7.1 legacy |
| DNN SIMD kernels | AVX2/AVX512 paths | NEON paths | RVV paths + Andes RVP052 (int8, narrow) |
| Assembly | Yes (some) | Yes (some) | None (intrinsics only) |
| Bitmanip / crypto extensions | N/A (x86 equivalents used) | N/A | Not used (Zba/Zbb/Zbc/Zbs absent) |

## 5. Build System, Cross-Compilation, and Toolchain

Toolchain files (`platforms/linux/`): `riscv64-clang.toolchain.cmake`, `riscv64-gcc.toolchain.cmake`, `riscv64-071-gcc.toolchain.cmake` (T-Head 0.7.1 legacy toolchain), `riscv64-andes-gcc.toolchain.cmake` (adds `-mext-dsp -D__ANDES=1`), `riscv-gnu.toolchain.cmake`, plus `flags-riscv64.cmake`.

Representative CI build invocation (from Issue [#22715](https://github.com/opencv/opencv/issues/22715)):
```
cmake -GNinja ${OPENCV_SRC_DIR} -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF
-DCMAKE_TOOLCHAIN_FILE=${OPENCV_SRC_DIR}/platforms/linux/riscv64-clang.toolchain.cmake
-DRISCV_CLANG_BUILD_ROOT=/opt/riscv -DRISCV_GCC_INSTALL_ROOT=/opt/riscv/
-DRISCV_RVV_SCALABLE=ON -DBUILD_WITH_DEBUG_INFO=ON -DOPENCV_DISABLE_THREAD_SUPPORT=ON
```
`platforms/linux/flags-riscv64.cmake` selects among `-march=rv64gc_v_zvfh`, `rv64gc_v_zvfhmin`, `rv64gcv`, or plain `rv64gc` based on `ENABLE_RVV_ZVFH`/`ENABLE_RVV_ZVFHMIN`/`ENABLE_RVV`/`RISCV_RVV_SCALABLE`. `cmake/OpenCVCompilerOptimizations.cmake` defines `CPU_ALL_OPTIMIZATIONS = RVV;FP16;RVV_ZVFH` for the RISCV platform. RVV is required, not optional, when the toolchain file is used (`-DCPU_BASELINE=RVV -DCPU_BASELINE_REQUIRE=RVV`).

**QEMU usage:** PR CI runs tests via `qemu-riscv64 -cpu rv64,v=true,vext_spec=v1.0 -L /opt/riscv/sysroot` inside a container built on real riscv64 hardware (see Section 7) - QEMU is used for RVV emulation/testing on a physical riscv64 host, not for a fully emulated x86-hosted build.

**Known build failures:**
- [Issue #22949](https://github.com/opencv/opencv/issues/22949): OpenCV fails to build on platforms where `int32_t == long int` (affects riscv32 bare-metal targets, e.g. esp-idf) - template specialization issues from implicit int/long conversions.
- Compiler-specific bug: a real GCC compiler bug in the RISC-V `vsetvl` pass (GCC PR#119547) caused a SIGSEGV that reproduced only under GCC 14.2 Release builds, not Clang - see Section 11 (#26936).
- [Issue #21494](https://github.com/opencv/opencv/issues/21494): building for T-Head's Xuantie-906 CPU via the `riscv64-071-gcc` toolchain produced an "illegal instruction" runtime crash - early real-hardware toolchain/compat issue.

**Compiler toolchain versions required, and why:** LLVM 16 was required to consume the compatible RVV-intrinsics-v0.12/v1.0 transition headers (per Issue [#22608](https://github.com/opencv/opencv/issues/22608) and PR #23383); GCC 14.2 exposed a since-fixed vsetvl-pass compiler bug specific to RISC-V code generation.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature area | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core arithmetic (add/sub/convertScale/norm/dotprod) | Full SIMD (SSE/AVX + IPP) | Full SIMD (NEON) | RVV-accelerated, but with an open accuracy issue class (see below) |
| imgproc filters (Gaussian/box/median/bilateral/Sobel/Scharr/Canny) | Full SIMD | Full SIMD | RVV-accelerated |
| imgproc resize | Full SIMD, multiple interpolation modes | Full SIMD | RVV-accelerated with a documented per-type coverage matrix; bit-exactness for 8U INTER_LINEAR fixed by [PR #29473](https://github.com/opencv/opencv/pull/29473) (2026-07-08) |
| imgproc warp (affine/perspective) / remap | Full SIMD, float precision (5.x) | Full SIMD | RVV path **disabled** for warpPerspective/remap on RISC-V since [PR #28144](https://github.com/opencv/opencv/pull/28144) (2026-05-14) - forces the scalar fallback pending [PR #29047](https://github.com/opencv/opencv/pull/29047) (open) |
| DNN convolution / pooling / attention | Full SIMD + IPP/MLAS | Full SIMD | RVV kernels landing incrementally through 2026 (conv, depthwise, max/average pooling, attention-softmax, Winograd) - functional but a more recent, less mature code path than core/imgproc |
| FP16 support | Yes | Yes | Added [PR #25743](https://github.com/opencv/opencv/pull/25743) (2024-06-11); FP8 added [PR #29832](https://github.com/opencv/opencv/pull/29832) (2026-08-31) |
| GAPI (graph API) | Fully tested | Fully tested | [Issue #19844](https://github.com/opencv/opencv/issues/19844) - GAPI tests fail intermittently on RISC-V+QEMU since 2021, still open |
| IPP-accelerated paths | Yes (proprietary) | N/A | N/A by design (x86-only blob, silently no-op elsewhere - not a riscv64-specific gap) |

**Functional gaps:** the RVV-accelerated `warpPerspective` and `remap` code paths are currently switched off on RISC-V in the 5.x line, so users get correct but non-vectorized (slower) output for those two operations until [PR #29047](https://github.com/opencv/opencv/pull/29047) lands. GAPI's RISC-V test reliability has been an open, unresolved issue since 2021.

**Performance gaps:** where the RVV HAL is engaged, OpenCV's own benchmark reports a mean single-core uplift exceeding 200% at 1920x1080 versus the generic scalar path on SpacemiT K1 (see Section 12/14 sourcing in Section "benchmarks"). Where the RVV path is disabled (warpPerspective/remap), performance reverts to the unaccelerated scalar baseline - a real, currently-shipping performance gap versus amd64/arm64 for those two functions.

**Correctness/floating-point semantics issues:**
- The root cause of the still-open [#27279](https://github.com/opencv/opencv/issues/27279)/[#27281](https://github.com/opencv/opencv/issues/27281) is a mismatch introduced when 5.x's `remap`/`warpPerspective` moved from fixed-point to float arithmetic ([PR #27265](https://github.com/opencv/opencv/pull/27265)), which the RVV kernels did not track precisely enough to pass accuracy tests.
- [Issue #24746](https://github.com/opencv/opencv/issues/24746) - "ties-to-even" rounding behavior diverged on RISC-V RVV (closed).
- [Issue #25226](https://github.com/opencv/opencv/issues/25226) - RVV instruction-count scales linearly with hardware VLEN under QEMU, an efficiency/scaling anomaly for the "vector-length-agnostic" programming model, opposite of the expected sub-linear scaling (closed as informational).

## 7. CI/CD Infrastructure

riscv64 CI is real, active, and PR-gating. Entry point in `opencv/opencv/.github/workflows/PR-5.x.yaml`:
```yaml
Linux-RISC-V-Clang:
  uses: opencv/ci-gha-workflow/.github/workflows/OCV-PR-5.x-RISCV.yaml@main
```
Triggered on `pull_request` targeting `5.x`. The job definitions live in the separate `opencv/ci-gha-workflow` repository and are invoked via `workflow_call`:

| Workflow (opencv/ci-gha-workflow) | Trigger | Purpose |
|---|---|---|
| `OCV-PR-5.x-RISCV.yaml` | `pull_request` (paths-filtered) + `workflow_call` | Build+test opencv core (5.x) + build opencv_contrib on riscv64 |
| `OCV-PR-4.x-RISCV.yaml` | same | Same for 4.x |
| `OCV-Contrib-PR-5.x-RISCV.yaml` / `OCV-Contrib-PR-4.x-RISCV.yaml` | same | Build opencv_contrib against 5.x / 4.x |
| `OCV-Nightly-RISCV.yaml` | `schedule: '0 0 * * 6'` (weekly) + `workflow_dispatch` | Matrix nightly build across 4 RISC-V toolchain variants x 2 branches |

**Runner:** `runs-on: opencv-ru-lin-riscv` - a self-hosted, real riscv64 runner (not `ubuntu-latest`, not GitHub-hosted QEMU emulation). Container image `quay.io/opencv-ci/opencv-ubuntu-22.04-riscv-main:20240709` bundles an LLVM/clang riscv toolchain and a self-built QEMU. Tests execute via `TEST_RUNNER: '/opt/riscv/bin/qemu-riscv64 -cpu rv64,v=true,vext_spec=v1.0 -L /opt/riscv/sysroot'` (RVV 1.0 enabled). PR-gated tests run: `opencv_test_core`, `opencv_test_imgproc`, `opencv_test_dnn`.

**Nightly matrix** (broader, four toolchain/vendor variants, max-parallel 3):
- `071` - legacy T-Head toolchain (`-DCORE=C910V`), deployed and run remotely on real hardware host `lichee1`.
- `main` - upstream clang/RVV, deployed and run remotely on real hardware host `canmv1`.
- `nds` - Andes vendor toolchain (`-DWITH_NDSRVP=ON`), local to the runner.
- `sc` - SpacemiT toolchain, local to the runner.

Two of the four nightly variants (`071`, `main`) run on genuine physical riscv64 boards over SSH, not QEMU.

One dead reference: the plain x86 `OCV-PR-Linux.yaml` workflow has a commented-out `# runs-on: opencv-ru-lin-riscv` line, superseded by `opencv-cn-lin-x86-64` - not live CI.

No GitLab CI, Cirrus CI, or Jenkins configuration exists for riscv64 (or at all) in either `opencv/opencv` or `opencv/ci-gha-workflow`.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (GitHub-hosted) | Yes (GitHub-hosted/self-hosted) | Yes (self-hosted `opencv-ru-lin-riscv`) |
| CI runs tests | Yes | Yes | Yes, via QEMU (RVV1.0) for PR jobs; real hardware for 2 of 4 nightly variants |
| PR-blocking | Yes | Yes | Yes (`Linux-RISC-V-Clang` job on PRs to 4.x/5.x) |
| RISE runner usage in opencv/opencv CI itself | N/A | N/A | Not found - the self-hosted `opencv-ru-lin-riscv` runner appears to be OpenCV's own infrastructure, not a RISE-branded runner. RISE runners are used by `riseproject-dev/python-wheels` to build the riscv64 wheel, a separate pipeline (see Section 8/10). |

## 8. Distribution and Release Status

- **GitHub Releases (opencv/opencv):** No riscv64 assets - and no generic Linux binaries for any architecture. Releases (5.0.0, 4.14.0, 4.13.0, etc.) ship only `android-sdk.zip`, `ios-framework.zip`, `windows.exe`, and `docs.zip`.
- **Mainline PyPI `opencv-python`:** latest 5.0.0.93; `urls` array contains only standard win/mac/linux x86_64 (+ headless) wheels. No riscv64 wheel.
- **RISE wheel builder** (GitLab project 56254198, [`riseproject-dev/python-wheels`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/opencv-python/)): publishes `opencv_python-5.0.0.93-cp37-abi3-manylinux_2_39_riscv64.whl`, and equivalents for `opencv-contrib-python` and `opencv-python-headless`, built on RISE's own riscv64 runner hardware per the repo README.
- **Ubuntu 26.04 ("resolute"):** `python3-opencv` 4.10.0+dfsg-7ubuntu5 confirmed available for riscv64 (`https://packages.ubuntu.com/resolute/riscv64/python3-opencv`), universe/ports, 1,855.0 kB; the broader `libopencv-*` 410 family is also listed as present in resolute (49 matching packages), though only `python3-opencv`'s architecture list was individually verified.
- **The literal package name "opencv"** does not exist on PyPI or the RISE builder; the correct upstream project name is `opencv-python`.

**What a user must do to get a working riscv64 binary today:** either (a) `apt install python3-opencv` on Ubuntu 26.04/resolute (or the equivalent Debian package, versions unverified in this report), (b) `pip install` against the RISE wheel index for `opencv-python`/`opencv-contrib-python`/`opencv-python-headless`, or (c) build from source using the in-tree riscv64 toolchain files - there is no path to a riscv64 binary published directly by opencv/opencv itself.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| oneTBB | Optional threading (`WITH_TBB`, default OFF) | Ubuntu 26.04 `libtbb12` 2022.3.0-2 [ports/universe] | Unofficial community port, no upstream riscv64 CI | No official upstream riscv64 binary | 8-bit atomic `-latomic` auto-link bug, PR #987 unmerged since Dec 2022 (patched downstream by Debian/Gentoo). See `project-reports/onetbb.md` |
| Eigen | Optional linear-algebra backend | `libeigen3-dev` 3.4.0-5 [universe], header-only | CI exists but every riscv64 job runs `allow_failure: true` | RVV vectorization requires explicit `-DEIGEN_RISCV64_USE_RVV10` opt-in, not shipped in a versioned release | Provisional-supported, not release-gating. See `project-reports/eigen.md` |
| LAPACK (Reference-LAPACK) | Optional backend | `liblapack3` 3.12.1-7ubuntu1 [ports] | Portable Fortran, no riscv64-specific SIMD, 0 relevant open issues | Distro packaging | Lowest risk of the numerics deps |
| OpenBLAS | Optional BLAS/LAPACK provider | `libopenblas0` 0.3.32+ds-5 [meta pkg]; Debian sid 0.3.33+ds-3 | `RISCV64_GENERIC` target supported with GCC 7+ | No upstream GitHub-release riscv64 binary (Windows-only assets) | See `project-reports/openblas.md` |
| zlib | Compression | `zlib1g` 1:1.3.dfsg+really1.3.1-1ubuntu3 | OpenBSD/riscv64 vmactions CI passes cleanly | Distro packaging | Pure C, no SIMD gap |
| zlib-ng | Optional zlib replacement (`WITH_ZLIB_NG`, default OFF) | **Not packaged** - `packages.ubuntu.com/resolute/riscv64/zlib-ng` returns "No such package" | 6 riscv64 CI jobs upstream (GCC/Clang, with/without RVV, with/without Zbc), all via QEMU | No riscv64 wheel/binary; source-only | Absent from Ubuntu entirely (also absent in 24.04) |
| libjpeg-turbo | JPEG codec (`WITH_JPEG`, default ON) | `libjpeg-turbo8` 2.1.5-4ubuntu4 [ports] - pre-RVV series | No upstream riscv64 CI at all | RVV SIMD merged to dev Feb 2026, first ships in 3.2, not in any distro yet; maintainer refused riscv64 release binaries (Issue #885, "won't implement") | Single unpaid maintainer in stated funding deficit; Ubuntu resolute ships un-accelerated 2.1.5 |
| libpng | PNG codec (`WITH_PNG`, default ON) | `libpng16-16t64` 1.6.57-1 [ports] | No automated riscv64 CI upstream | Debian sid 1.6.58-1, Ubuntu resolute 1.6.57-1, both postdate the Dec 2025 RVV correctness fixes (Paeth filter) | RVV off by default (unlike ARM/Intel/PPC) |
| libwebp | WebP codec (`WITH_WEBP`, default ON) | `libwebp7` 1.5.0-0.1build1 | Builds cleanly on Debian sid and Arch RISC-V, zero riscv64 issues | Debian/Ubuntu ship current versions | Cleanest codec dependency |
| libtiff | TIFF codec (`WITH_TIFF`, default ON) | `libtiff6` 4.7.0-3ubuntu4 [ports] | Not independently researched this session | Packaged for riscv64 | No project report exists yet - recommend follow-up |
| OpenJPEG | JPEG2000 codec (`WITH_OPENJPEG`, default ON) | `libopenjp2-7` 2.5.4-1 | 0 riscv64 issues found on `uclouvain/openjpeg` (also no confirmation of active RVV work) | Packaged for riscv64 | Likely scalar-only; low priority (minor codec) |
| Protobuf | DNN serialization (`WITH_PROTOBUF`, default ON) | `libprotobuf32t64` 3.21.12-15ubuntu1 | Closed issues #12266 ("Add riscv64 support"), #14549 ("Build fails on RISCV") | No official protoc riscv64 binary (Issue #17798); source/distro build required | Build-tooling gap, not runtime correctness |
| FFmpeg | Optional video I/O (`WITH_FFMPEG`, default ON except Android) | `ffmpeg` 7:8.0.1-3ubuntu2 | Debian trixie ships `ffmpeg_7.1.4-0+deb13u1_riscv64.deb`; in-repo CI + FATE infra | Actively packaged and current | Strong SIMD coverage per `project-reports/ffmpeg.md`, some gaps remain |
| OpenCL (ICD loader) | Runtime GPU/JIT kernel compilation (`WITH_OPENCL`, default ON except Android) | `ocl-icd-libopencl1` 2.3.4-1 | Loader itself is arch-neutral; no riscv64 GPU-driver ecosystem currently exists to dispatch to | Loader packaged; OpenCL devices scarce on riscv64 boards | Real-world blocker is the absence of riscv64 OpenCL drivers, not the loader |
| IPP (ippicv) | Intel-proprietary SIMD primitives | N/A | N/A | N/A | Not applicable to riscv64 by design (x86/macOS-Intel only); OpenCV silently no-ops it off-x86 |

**Cross-cutting observations:** OpenCV's core build graph carries no direct cryptographic dependency (no OpenSSL/libcrypto/mbedTLS reference). No dedicated memory allocator is pulled in (TBB's own scalable allocator, `libtbbmalloc2`, is packaged for riscv64 but TBB is off by default). Everything needed to build the default OpenCV configuration is present in Ubuntu 26.04 riscv64; the real risk sits in accuracy/performance rather than availability - several image-codec dependencies (libjpeg-turbo, libpng) ship pre-RVV or RVV-off-by-default versions in resolute, and OpenCV's own RVV kernels carry open accuracy regressions (Section 11) as of this report.

## 11. Known Bugs and Active Issues

**Currently OPEN:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [27279](https://github.com/opencv/opencv/issues/27279) | Imgproc_Remap_Test.accuracy fails with RISC-V RVV in 5.x | Open (created 2025-05-05, last updated 2026-06-01) | Correctness | RVV SIMD path disabled as mitigation ([PR #28144](https://github.com/opencv/opencv/pull/28144)); real fix pending [PR #29047](https://github.com/opencv/opencv/pull/29047) |
| [27280](https://github.com/opencv/opencv/issues/27280) | Imgproc_WarpAffine_Test.accuracy fails with RISC-V RVV in 5.x | Open | Correctness | Same root cause as #27279 |
| [27281](https://github.com/opencv/opencv/issues/27281) | Imgproc_WarpPerspective_Test.accuracy fails with RISC-V RVV in 5.x | Open (created 2025-05-05, last updated 2026-06-01) | Correctness | Same root cause and mitigation as #27279 |
| [22949](https://github.com/opencv/opencv/issues/22949) | Build fails where `int32_t == long int` (riscv32 bare-metal, e.g. esp-idf) | Open | Build | Narrow (riscv32/bare-metal), not riscv64/Linux |
| [19844](https://github.com/opencv/opencv/issues/19844) | GAPI test fails intermittently on RISC-V (cross build + QEMU) | Open since 2021-04-02 | Test reliability | `"Couldn't grab the very first frame"` assertion in gapi streaming cap |
| [29064](https://github.com/opencv/opencv/pull/29064) | RVV: add RVV HAL optimizations for bayer2Gray | Open PR | Enhancement | Not yet merged |
| [29494](https://github.com/opencv/opencv/pull/29494) | core: add RVV cvRound fast path | Open PR | Enhancement | Not yet merged |

**Recently CLOSED (context on churn rate and resolution pattern):**

| ID | Title | Notes |
|---|---|---|
| [28124](https://github.com/opencv/opencv/issues/28124) | RISC-V HAL `flip` in-place corruption (real hardware, Spacemit K1) | Closed via [PR #28180](https://github.com/opencv/opencv/pull/28180); interim mitigation [PR #28125](https://github.com/opencv/opencv/pull/28125) disabled in-place flip entirely for 11 days |
| [26936](https://github.com/opencv/opencv/issues/26936) | `Core_ConvertScale` SIGSEGV on RISC-V RVV with GCC 14.2 | Root-caused to a GCC compiler bug (vsetvl pass, GCC PR#119547); OpenCV shipped a defensive workaround in [PR #27006](https://github.com/opencv/opencv/pull/27006) ahead of the upstream GCC fix |
| [27044](https://github.com/opencv/opencv/issues/27044) | calib3d/photo test failures on RISC-V | Resolved same month |
| [22608](https://github.com/opencv/opencv/issues/22608) | Incompatible change for RVV intrinsics (multi-year API-break RFC) | Opened 2022-10-07, closed 2025-02-11 - ~2.5 years to resolve, gated on LLVM 16 support and PR #23383 |
| [24746](https://github.com/opencv/opencv/issues/24746) | Ties-to-even rounding fails on RISC-V | Closed |
| [24358](https://github.com/opencv/opencv/issues/24358) | `Core_DotProduct.accuracy` fails on RISC-V RVV | Closed |
| [23559](https://github.com/opencv/opencv/issues/23559) | Segfault at `countNonZero8u` on RISC-V RVV 0.7.1 (real hardware, Allwinner D1) | Closed |
| [22715](https://github.com/opencv/opencv/issues/22715) | RVV 1.0 bring-up: consolidated crash/failure list (2022-10 snapshot) | Closed - functioned as de facto tracking issue |

**Correctness bugs highlighted separately:** the three open 5.x accuracy regressions (#27279/#27280/#27281) are currently masked, not fixed - [PR #28144](https://github.com/opencv/opencv/pull/28144) disabled the RVV SIMD path for `warpPerspective`/`remap` on RISC-V (`#if !defined(__riscv)`), forcing the slow-but-correct scalar fallback. Four competing fix PRs were opened and closed without merging before #28144 landed ([#28079](https://github.com/opencv/opencv/pull/28079), [#28098](https://github.com/opencv/opencv/pull/28098), [#28099](https://github.com/opencv/opencv/pull/28099), [#28103](https://github.com/opencv/opencv/pull/28103)), and the genuine fix that restores both correctness and RVV performance is [PR #29047](https://github.com/opencv/opencv/pull/29047), still open, targeting milestone 5.1, with benchmarks in the PR showing up to 6.58x speedup versus the disabled-SIMD fallback on some operations (and some cases still slower or within 1%, per the deep-read of that PR thread).

A recurring pattern across this issue history: correctness regressions on RISC-V are frequently resolved short-term by disabling the RVV-optimized path (falls back to portable scalar code) rather than fixing the vector code immediately, with a proper vectorized fix following later - seen in both the flip in-place bug (#28124/#28125/#28180) and the current warp/remap regression.

## 12. Objections and Upstream Blockers

No stated objections to RISC-V support were found in any searched issue, PR, or forum thread - the tone throughout (e.g. [vpisarev's comment on #22608](https://github.com/opencv/opencv/issues/22608): "RISC-V support mattered to OpenCV... If it's renamed, no big deal, we can update our code") indicates the core team is accommodating of RISC-V-driven changes.

**Technical blockers, currently active:**
- The 5.x `warpPerspective`/`remap` RVV accuracy regression (Section 11) is the single most consequential open technical blocker - it currently trades correctness for disabled acceleration, and the real fix (#29047) is still in review.
- The upstream RVV-intrinsics-v1.0 breaking-change transition (#22608) took roughly 2.5 years (2022-10 to 2025-02) to fully absorb, illustrating that OpenCV's RISC-V support is coupled to, and gated by, external RVV-intrinsics-spec and toolchain (LLVM/GCC) churn outside OpenCV's own control.
- A real GCC 14.2 compiler bug (#26936) demonstrates the RISC-V toolchain ecosystem itself is still immature enough to introduce silent miscompilation risk in Release builds; OpenCV shipped a source-level workaround rather than waiting for the compiler fix.

**Organizational blockers:** none identified. RISC-V work is contributed and maintained by external vendors (Alibaba/T-Head, Institute of Software CAS, SpaceMIT, Andes) with the OpenCV.ai-affiliated core team (asmorkalov, mshabunin) reviewing and merging through normal process - the same pattern used for ARM/NEON, MIPS, and IBM/VSX ports historically.

**Acceptance probability for further RISC-V investment:** high. The project has accepted RISC-V contributions continuously since 2020 with no rejected architectural proposals found, has dedicated CI infrastructure (Section 7), and treats RISC-V-specific bug reports (Section 11) with the same triage priority as other platforms (median time-to-close for correctness issues in the low single-digit weeks, per the closed-issue dates above, excluding the multi-year #22608 API-transition RFC which was externally gated).

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** RISE
- **Optimization level:** partial

**Justification:** OpenCV's upstream CI builds riscv64 and runs the test suite (PR-gated `Linux-RISC-V-Clang` job on a self-hosted riscv64 runner, executing `opencv_test_core`/`_imgproc`/`_dnn` via QEMU RVV1.0, plus a weekly nightly matrix with two variants running on real hardware) - see the [`PR-5.x.yaml`](https://github.com/opencv/opencv/blob/5.x/.github/workflows/PR-5.x.yaml) entry point and [`OCV-PR-5.x-RISCV.yaml`](https://github.com/opencv/ci-gha-workflow) reusable workflow. Tests currently pass. However, opencv/opencv itself does not publish a riscv64 binary through any channel (GitHub Releases ship only Android/iOS/Windows bundles; mainline PyPI `opencv-python` carries no riscv64 wheel), so the release-provider prerequisite for green is not met. This places OpenCV at the CI: build=yes, test=yes, release=no cell of the color model, i.e. blue.

The consumable riscv64 release that does exist for OpenCV's Python distribution is provided by RISE, not upstream: `riseproject-dev/python-wheels` builds and publishes riscv64 wheels for `opencv-python`, `opencv-contrib-python`, and `opencv-python-headless` on RISE's own riscv64 hardware, per its [package manifest](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/opencv-python/) and repository README. Ubuntu 26.04 also packages `python3-opencv` and the `libopencv-*` family for riscv64 from unmodified upstream source, providing an independent distro-level release path.

**Optimization-purpose assessment:** OpenCV's RVV-specific code (`hal/riscv-rvv/`, 24,225 lines across 61 files, covering 119 core/imgproc functions per the [OpenCV blog](https://opencv.org/introducing-hal-riscv-rvv-unleashing-the-power-of-risc-v-cpus-with-rvv-1-0/), plus scalable and legacy universal-intrinsics backends and DNN kernels) covers the primary hot-path operations that justify choosing RVV-accelerated OpenCV over the generic scalar fallback - core arithmetic, imgproc filters/resize/color-conversion, and DNN convolution/pooling. That places the coverage level at "partial": the main differentiating operations are implemented and deliver a real, benchmarked speedup (mean uplift exceeding 200% single-core at 1920x1080 on SpacemiT K1, per the same blog post), but a currently-shipping gap exists where the RVV path for `warpPerspective`/`remap` is deliberately disabled on RISC-V pending [PR #29047](https://github.com/opencv/opencv/pull/29047), and per-operation `NOT_IMPLEMENTED` fallbacks remain common by HAL design. A "partial" optimization level caps at blue, which matches the CI-derived primary color - the optimization modifier does not change the assigned color here.

**Pending work that could change the grade:** (1) [PR #29047](https://github.com/opencv/opencv/pull/29047), open, would restore RVV acceleration for warpPerspective/remap while fixing the accuracy regression - closing this would remove the current warp/remap performance gap but would not by itself change the color (release-provider is the binding constraint for reaching green). (2) An upstream-published riscv64 binary (a GitHub Release asset, or an official PyPI riscv64 wheel) would be the single change that could move OpenCV to green, since CI build+test is already satisfied. (3) [Issue #19844](https://github.com/opencv/opencv/issues/19844) (GAPI test flakiness) has been open since 2021 with no recent activity found and represents lingering CI-reliability risk, though it does not currently block the PR-gated core/imgproc/dnn jobs.

## 14. Investment Analysis

RISE's already-completed/funded work relevant to OpenCV: (a) [`riseproject-dev/python-wheels`](https://gitlab.com/riseproject/python/wheel_builder) builds and ships riscv64 wheels for `opencv-python`, `opencv-contrib-python`, and `opencv-python-headless` on RISE's own riscv64 runner hardware, including documented build gotchas specific to OpenCV's RVV dispatch probing; (b) a 10xEngineers/RISE collaboration published a blog post ([Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/), 2026-07-07) that used and hand-optimized OpenCV's C++ API in a YOLOv8n pipeline, achieving 17.3x single-thread / 12.9x multi-thread speedups on a Banana Pi BPI-F3 after replacing selected OpenCV ops with RVV-vectorized code; (c) OpenCV itself is queued for its own future project-report in this repository's `project-reports/.queue.yml` but the RVV wheel-building and packaging work is already covered - do not re-size that.

### 14.1 Functional Enablement

The core functional gap is the disabled RVV path for `warpPerspective`/`remap` on RISC-V - already being addressed by open community PR #29047, not something a chip company needs to fund from scratch, though reviewing and helping land it would accelerate closure. GAPI's long-standing intermittent RISC-V test failure (#19844, open since 2021) has no visible active owner and would benefit from dedicated triage.

### 14.2 Performance Optimization

DNN RVV kernel coverage (convolution, pooling, attention-softmax, Winograd) is newer and less mature than the core/imgproc HAL, with kernels still landing incrementally through 2026 - an area where additional silicon-vendor-funded engineering (in the OpenCV historical pattern of vendor-contributed, vendor-maintained backends) would compound on already-benchmarked gains (200%+ uplift class already demonstrated for core/imgproc).

### 14.3 CI/CD Infrastructure

Upstream CI infrastructure is already comprehensive (self-hosted riscv64 runner, PR-gating, real-hardware nightly matrix across four toolchain vendors) - no CI investment is needed; a chip company's opportunity here is contributing runner capacity/hardware for its own silicon variant (following the existing pattern of `lichee1`/`canmv1`/SpacemiT-hosted nightly jobs) rather than building CI from scratch.

### 14.4 Ecosystem Enablement

Not applicable as a dedicated section per this report's scope rules - OpenCV's own Python packaging (opencv-python family) is already covered by RISE (Section 8), and OpenCV is consumed as a downstream test dependency by other ecosystem projects rather than having its own large plugin/extension ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review/help land [PR #29047](https://github.com/opencv/opencv/pull/29047) restoring correct+fast RVV warpPerspective/remap | 1-2 | Silicon vendor contributor + OpenCV.ai review | High |
| Functional | Root-cause and fix GAPI RISC-V test flakiness ([#19844](https://github.com/opencv/opencv/issues/19844)) | 2-4 | New contributor (no current owner) | Medium |
| Performance | Expand DNN RVV kernel coverage (remaining conv/pooling/attention variants) beyond what already landed through 2026 | 6-10 | Silicon vendor (SpaceMIT/Andes-pattern) | Medium |
| Performance | Investigate Zvfh/Zvfhmin and Bitmanip (Zba/Zbb) applicability to close remaining scalar-fallback gaps in `hal/riscv-rvv` | 4-8 | Silicon vendor | Low-Medium |
| Distribution | Sponsor/contribute an official upstream riscv64 binary channel (GitHub Release asset or official PyPI wheel) to move release_provider from RISE/distro to upstream | 2-4 (packaging/CI work, not code) | OpenCV.ai + sponsor | Medium (would move color toward green) |
| CI/CD | Contribute additional real-hardware runner capacity for the nightly matrix (own silicon variant) | 1-2 (setup) + ongoing hosting | Silicon vendor | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-07.)

## 16. References

- [OpenCV GitHub repository](https://github.com/opencv/opencv)
- [OpenCV homepage](https://opencv.org/)
- [OpenCV RISC-V wiki page](https://github.com/opencv/opencv/wiki/OpenCV-RISC-V)
- [Introducing HAL riscv-rvv: Unleashing the power of RISC-V CPUs with RVV 1.0](https://opencv.org/introducing-hal-riscv-rvv-unleashing-the-power-of-risc-v-cpus-with-rvv-1-0/)
- [Optimizing OpenCV for the RISC-V Architecture](https://opencv.org/blog/optimizing-opencv-for-the-risc-v-architecture/)
- [Issue #22715 - RVV 1.0 crashed/failed test list](https://github.com/opencv/opencv/issues/22715)
- [Issue #22608 - Incompatible change for RVV intrinsics](https://github.com/opencv/opencv/issues/22608)
- [Issue #27279 - Imgproc_Remap_Test.accuracy fails with RISC-V RVV](https://github.com/opencv/opencv/issues/27279)
- [Issue #27280 - Imgproc_WarpAffine_Test.accuracy fails with RISC-V RVV](https://github.com/opencv/opencv/issues/27280)
- [Issue #27281 - Imgproc_WarpPerspective_Test.accuracy fails with RISC-V RVV](https://github.com/opencv/opencv/issues/27281)
- [Issue #19844 - GAPI test fails on RISC-V](https://github.com/opencv/opencv/issues/19844)
- [Issue #28124 - RISC-V HAL flip in-place corruption](https://github.com/opencv/opencv/issues/28124)
- [Issue #26936 - Core_ConvertScale SIGSEGV on RISC-V RVV with GCC 14.2](https://github.com/opencv/opencv/issues/26936)
- [Issue #22949 - Build fails where int32_t == long int](https://github.com/opencv/opencv/issues/22949)
- [PR #17145 - Initial RISC-V cmake toolchain](https://github.com/opencv/opencv/pull/17145)
- [PR #17922 - Build riscv with c++ intrinsics](https://github.com/opencv/opencv/pull/17922)
- [PR #18228 - Universal intrinsics implementation with RISC-V vector extension](https://github.com/opencv/opencv/pull/18228)
- [PR #22179 - New universal intrinsic backend for RVV](https://github.com/opencv/opencv/pull/22179)
- [PR #23246 - RVV 0.7 support in mainline RVV intrinsics](https://github.com/opencv/opencv/pull/23246)
- [PR #24841 - Update intrin_rvv071.hpp for modern toolchain](https://github.com/opencv/opencv/pull/24841)
- [PR #25167 - 3rdparty NDSRVP library](https://github.com/opencv/opencv/pull/25167)
- [PR #25743 - Add FP16 support for RISC-V](https://github.com/opencv/opencv/pull/25743)
- [PR #25883 - Upgrade RVV intrinsic, cleanup obsolete backend](https://github.com/opencv/opencv/pull/25883)
- [PR #27006 - Fix issues in RISC-V Vector Universal Intrinsic](https://github.com/opencv/opencv/pull/27006)
- [PR #28125 - Interim disable of RISC-V in-place flip](https://github.com/opencv/opencv/pull/28125)
- [PR #28144 - Upgrade warpPerspective precision, fix RISC-V accuracy regressions](https://github.com/opencv/opencv/pull/28144)
- [PR #28180 - Real fix for RISC-V HAL flip](https://github.com/opencv/opencv/pull/28180)
- [PR #29047 - Fix WarpAffine and WarpPerspective accuracy on RISC-V RVV](https://github.com/opencv/opencv/pull/29047)
- [PR #29473 - imgproc: make RVV HAL resize bit-exact for 8U INTER_LINEAR](https://github.com/opencv/opencv/pull/29473)
- [PR #29832 - SIMD support for FP8](https://github.com/opencv/opencv/pull/29832)
- [PR-5.x.yaml workflow entry point](https://github.com/opencv/opencv/blob/5.x/.github/workflows/PR-5.x.yaml)
- [opencv/ci-gha-workflow reusable workflows repository](https://github.com/opencv/ci-gha-workflow)
- [PyPI opencv-python package JSON](https://pypi.org/pypi/opencv-python/json)
- [RISE wheel builder - opencv-python package index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/opencv-python/)
- [Ubuntu 26.04 (resolute) riscv64 python3-opencv package page](https://packages.ubuntu.com/resolute/riscv64/python3-opencv)
- [riseproject-dev/python-wheels GitHub repository](https://github.com/riseproject-dev/python-wheels)
- [RISE blog - Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [ppl.cv RISC-V benchmark documentation](https://github.com/openppl-public/ppl.cv/blob/master/docs/riscv_benchmark.md)
- [Volokitin et al., "Improved vectorization of OpenCV algorithms for RISC-V CPUs," arXiv:2311.12808](https://arxiv.org/abs/2311.12808)
- [Optimizing OpenCV for the RISC-V Architecture (2021 GSoC retrospective blog post)](https://opencv.org/blog/optimizing-opencv-for-the-risc-v-architecture/)
- [project-reports/onetbb.md, eigen.md, openblas.md, zlib.md, zlib-ng.md, libjpeg-turbo.md, libpng.md, libwebp.md, ffmpeg.md](https://github.com/riseproject-dev/sw-ecosystem) (this repository's prior dependency reports, referenced for Section 9)