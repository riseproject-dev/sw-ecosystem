---
title: oneDNN
categories:
  - libraries
  - ai-ml
---

# oneDNN

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for oneDNN<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

oneDNN (formerly DNNL, oneAPI Deep Neural Network Library) is a high-performance primitives library for deep learning inference and training. It provides architecture-optimized implementations of convolution, matrix multiplication, normalization, pooling, activation, and reorder operations. oneDNN is the backend used by PyTorch, TensorFlow, OpenVINO, and other frameworks on Intel hardware, and is the reference implementation of the oneAPI oneDNN specification.

**Repository:** [oneapi-src/oneDNN](https://github.com/oneapi-src/oneDNN) (mirror: [uxlfoundation/oneDNN](https://github.com/uxlfoundation/oneDNN))
**License:** Apache 2.0
**Governance:** [UXL Foundation](https://uxlfoundation.org), a Joint Development Foundation Project. Steering Members: Arm, Fujitsu, Google Cloud, Imagination Technologies, Intel, Qualcomm, and Samsung.
**Latest upstream release:** v3.12.1

---

## 2. Port History and Upstreaming Timeline

The RISC-V port spans five years, with three distinct phases: dormant stub (2021-2024), active intrinsics development (2025), and JIT backend transition (late 2025 to present).

| Date | Milestone | PR | Contributor | Affiliation |
|---|---|---|---|---|
| Sep 2021 | First RISC-V defines and platform detect | [#1148](https://github.com/oneapi-src/oneDNN/pull/1148) | aaronfranke | External |
| Feb 2023 | First RVV NCHW pooling kernel (intrinsics) | [#1521](https://github.com/oneapi-src/oneDNN/pull/1521) | pazamelin | External |
| Aug 2024 | Fix missing include for RV64 builds | [#2053](https://github.com/oneapi-src/oneDNN/pull/2053) | alvoron | Intel |
| Mar 2025 | Intrinsics update | [#2929](https://github.com/oneapi-src/oneDNN/pull/2929) | zhangfeiv0 | ISCAS |
| Jun 2025 | Dynamic -march flag for RV64 | [#3455](https://github.com/oneapi-src/oneDNN/pull/3455) | krishnasai-mcw | Microchip Technology |
| Sep 2025 | RVV matmul kernel (first formal kernel) | [#3784](https://github.com/oneapi-src/oneDNN/pull/3784) | krishnasai-mcw | Microchip Technology |
| Sep 2025 | f32 GEMM via RVV intrinsics | [#3785](https://github.com/oneapi-src/oneDNN/pull/3785) | xiazhuozhao | ISCAS |
| Oct 2025 | CI workflow added | [#3963](https://github.com/oneapi-src/oneDNN/pull/3963) | (ISCAS team) | ISCAS |
| Nov 2025 | Zvfh runtime detection | [#4322](https://github.com/oneapi-src/oneDNN/pull/4322) | (ISCAS team) | ISCAS |
| Dec 2025 | xbyak_riscv JIT library integrated | [#4395](https://github.com/oneapi-src/oneDNN/pull/4395) | zhangfeiv0 | ISCAS |
| Dec 2025 | RISC-V team added to CODEOWNERS | [#4488](https://github.com/oneapi-src/oneDNN/pull/4488) | vpirogov (Intel) | ISCAS content |
| Jan 2026 | f16 softmax via Zvfh | [#4491](https://github.com/oneapi-src/oneDNN/pull/4491) | xiazhuozhao | ISCAS |
| Feb 2026 | Weekly CI test job added | [#4479](https://github.com/oneapi-src/oneDNN/pull/4479) | zhangfeiv0 | ISCAS |
| Mar 2026 | f32 JIT BRGEMM kernel | [#4824](https://github.com/oneapi-src/oneDNN/pull/4824) | zhangjian29 | ZTE/ISCAS |
| May 2026 | BRGEMM matmul, Winograd conv, JIT IP/eltwise/bnorm | Multiple | ISCAS/SpacemiT | ISCAS/SpacemiT |
| Jun 2026 | f16 and BF16 BRGEMM JIT kernels; Zvfbfwma support | [#5294](https://github.com/oneapi-src/oneDNN/pull/5294), [#5295](https://github.com/oneapi-src/oneDNN/pull/5295) | velonica0 | SpacemiT |

The RISC-V port required approximately four years from first commit to formal CODEOWNERS recognition. Active kernel development by ISCAS, SpacemiT, and ZTE began in earnest in mid-2025. There is no dedicated tracking issue or formal roadmap. Work is tracked organically via the `platform:cpu-rv64` label.

---

## 3. Upstream Support Tier

oneDNN does not use a numbered tier system. It uses a binary classification:

- **Optimized / fully supported:** Intel x64, AMD64, AArch64, Intel Graphics
- **Experimental (limited testing validation):** RISC-V RV64, Power ISA (PPC64), IBMz (s390x), NVIDIA GPU, AMD GPU

The README states explicitly: "Power ISA (PPC64), IBMz (s390x), and RISC-V (RV64) support is **experimental** with limited testing validation."

No formal promotion criteria are documented. The RISC-V team (ISCAS, ZTE) holds Code Owner status for the `src/cpu/rv64/` path and the xbyak_riscv subcomponent, but does not hold Maintainer status. The top-level Core team (all Intel) retains fallback authority and merge control for architecture decisions. Intel effectively controls acceptance of new platform work.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source Layout

All RISC-V code lives under `src/cpu/rv64/`. The directory is self-contained with its own CMakeLists.txt, ISA detection, JIT base class, and all primitive implementations.

```
src/cpu/rv64/
  cpu_isa_traits.cpp / .hpp        -- ISA detection: V, Zvfh, Zvfbfwma
  jit_generator.hpp                -- Base JIT class over xbyak_riscv
  brgemm/
    jit_brgemm_kernel.cpp          -- f32, f16, bf16 BRGEMM (1193 lines)
  gemm/
    jit_rvv_gemm_kernel.cpp        -- f32 GEMM, LMUL=m4, 7-column unroll (339 lines)
  injectors/
    jit_uni_eltwise_injector.cpp   -- Full eltwise fwd+bwd; relu/tanh/exp/gelu/etc.
    jit_uni_binary_injector.cpp
    jit_uni_postops_injector.cpp
  jit_rvv_1x1_conv_kernel.cpp      -- 1x1 direct conv (582 lines)
  jit_rvv_layernorm_kernel.cpp     -- f32+f16 layer normalization (750 lines)
  jit_rvv_softmax_kernel.cpp       -- f32+f16 softmax (406 lines)
  jit_uni_pool_kernel.cpp          -- Pooling (812 lines)
  jit_uni_pooling.cpp              -- (665 lines)
  rvv_brgemm_conv.cpp              -- Direct conv via BRGEMM
  rvv_winograd_convolution.cpp     -- Winograd F(2x2,3x3) (697 lines)
  [+14 additional .cpp files]

third_party/xbyak_riscv/           -- Vendored: herumi/xbyak_riscv tag 1.10
```

Approximately 37 compiled .cpp files in rv64 vs approximately 300+ for x64 and 175+ for aarch64.

### 4.2 ISA Extensions Used

| Extension | Usage |
|---|---|
| RVV 1.0 (V) | All JIT kernels; runtime-detected via `mayiuse(v)` |
| Zvfh | f16 softmax, layernorm, brgemm, eltwise injector; runtime-detected |
| Zvfbfwma | BF16 widening FMA in brgemm kernel; detected via SIGILL trap-probe (firmware workaround -- see section 9) |
| F / D extensions | Scalar float/double; used in layernorm f16 kernel for `fsqrt_d` precision |

Zb* (Zba/Zbb) extensions are not detected or used.

### 4.3 JIT Backend

All RISC-V vector code is JIT-generated at runtime via xbyak_riscv. There are no `.S` assembly files and no static SIMD function-dispatch table. Primitives call `mayiuse(v)` / `mayiuse(zvfh)` in their `pd_t::init()` methods. All JIT kernel bodies are wrapped in `#if defined(XBYAK_RISCV_V) && XBYAK_RISCV_V == 1`; the `#else` path emits only `ret()`. Code buffer size is 256 KB per kernel.

The xbyak_riscv library (herumi/xbyak_riscv, vendored at tag 1.10, upstream at 1.30) provides typed register wrappers (`VReg`, `FReg`, `Reg`) and instruction emitters (e.g., `vsetvli(...)`, `vfmacc_vf(...)`).

### 4.4 Primitive Coverage

| Primitive | Status | Extensions | Notes |
|---|---|---|---|
| GEMM (f32) | Complete | V | LMUL=m4, 7-col unroll, 4x K unroll |
| BRGEMM (f32) | Complete | V | K-blocking BK=256; dispatch: ow>=20 && ic>=16 |
| BRGEMM (f16) | Complete | V, Zvfh | Merged Jun 2026 |
| BRGEMM (bf16) | Complete | V, Zvfbfwma | Merged Jun 2026; SIGILL-probe dispatch |
| Matmul (f32) | Complete | V | Uses BRGEMM matmul path |
| Convolution direct (f32) | Complete | V | 1x1 JIT; GEMM conv; BRGEMM conv |
| Convolution Winograd (f32) | Complete | V | F(2x2,3x3); batch-parallel |
| Depthwise conv f16 k3s1/k3s2 | In progress | V, Zvfh | PR [#5345](https://github.com/oneapi-src/oneDNN/pull/5345) open, 1/2 approvals |
| Pooling NCHW/NHWC (f32) | Complete | V | JIT via jit_uni_pooling |
| Softmax (f32, f16) | Complete | V, Zvfh | Polynomial exp; LMUL m1/m2/m4 |
| Layer normalization (f32, f16) | Complete | V, Zvfh | 4x unroll; D-ext sqrt |
| Group normalization (f32) | Complete | V | Refactored Jun 2026 |
| Batch normalization (f32) | Partial | V | Inference-only forward; no backward, no stats |
| Inner product (f32, s8/u8) | Complete | V | vwmul+vwredsum for int8 |
| Eltwise (f32, f16) | Complete | V, Zvfh | Full fwd+bwd; relu/tanh/exp/gelu/logistic/swish |
| Binary (f32) | Complete | V | JIT |
| Reorder (multi-dtype) | In progress | V | PR [#5363](https://github.com/oneapi-src/oneDNN/pull/5363) open, 1/2 approvals; 26x-204x speedup vs prior |
| Reduction (f32, f16) | In progress | V, Zvfh | PR [#5361](https://github.com/oneapi-src/oneDNN/pull/5361) open, 0 approvals; active correctness bug |

Primitives not covered by rv64-specific code fall back to architecture-agnostic reference implementations.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Toolchain Requirements

- **Compiler:** GCC 14 (`gcc-14-riscv64-linux-gnu` / `g++-14-riscv64-linux-gnu`). Pinned exactly in `.github/automation/riscv/ci.json`. Required because RVV intrinsics ABI (`__riscv_v_intrinsic >= 12000`, v0.12 API) stabilized in GCC 14. No documented floor for older GCC. Clang is not documented or used for riscv64 in CI.
- **Toolchain file:** `cmake/toolchains/riscv64.cmake` (hardcodes `riscv64-linux-gnu-gcc-14`).

### 5.2 CMake Architecture Detection

`CMakeLists.txt` detects riscv64 via:

```cmake
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^(rv.*|RV.*|riscv.*|RISCV.*)")
    set(DNNL_TARGET_ARCH "RV64")
```

This fires automatically when using the toolchain file. It can also be forced with `-DDNNL_TARGET_ARCH=RV64`.

### 5.3 RVV / Architecture Flag Selection

`cmake/platform.cmake` auto-selects the `-march=` flag:

1. Tests if the toolchain compiles `<riscv_vector.h>` with `-march=rv64gcv` -> sets `CAN_COMPILE_RVV_INTRINSICS`
2. Tests `-march=rv64gcv_zvfh` for Zvfh fp16 -> sets `CAN_COMPILE_ZVFH_INTRINSICS`
3. Sets `RV64_MARCH_FLAG` to one of: `-march=rv64gcv_zvfh`, `-march=rv64gcv`, or `-march=rv64gc`
4. Defines `-DDNNL_RISCV_USE_RVV_INTRINSICS` and/or `-DDNNL_RISCV_USE_ZVFH_INTRINSICS`

Override: `-DONEDNN_ARCH_OPT_FLAGS="-march=rv64gcv"` forces a specific march string. If the provided `-march=` string lacks `gcv`, both RVV and Zvfh are disabled regardless of compiler capability.

### 5.4 Reference CMake Configure Command

From `.github/automation/riscv/build.sh`:

```bash
cmake -Bbuild -S. \
  -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/riscv64.cmake \
  -DONEDNN_BUILD_GRAPH=ON \
  -DDNNL_CPU_RUNTIME=OMP \
  -DONEDNN_WERROR=ON \
  -DDNNL_BUILD_FOR_CI=ON \
  -DONEDNN_TEST_SET=SMOKE \
  -DCMAKE_BUILD_TYPE=RelWithAssert \
  -GNinja
cmake --build build --parallel $(nproc)
```

### 5.5 Key Build Flags

| Flag | CI Value | Notes |
|---|---|---|
| `CMAKE_TOOLCHAIN_FILE` | `cmake/toolchains/riscv64.cmake` | Required for cross-compile |
| `DNNL_CPU_RUNTIME` | `OMP` | OpenMP; use `NONE` for sequential |
| `CMAKE_BUILD_TYPE` | `RelWithAssert` | |
| `ONEDNN_ARCH_OPT_FLAGS` | not set (auto) | Override `-march=` if needed |
| `DNNL_TARGET_ARCH` | auto as `RV64` | Can force explicitly |
| `ONEDNN_GPU_RUNTIME` | `NONE` (default) | No GPU support on RV64 |

### 5.6 Key Files

- `cmake/toolchains/riscv64.cmake` -- toolchain file
- `cmake/platform.cmake` -- RVV/Zvfh detection and `-march=` selection
- `cmake/options.cmake` -- `ONEDNN_ARCH_OPT_FLAGS` and all build options
- `.github/automation/riscv/ci.json` -- GCC 14 version pin
- `.github/automation/riscv/common.sh` -- sets CC/CXX and CMAKE_TOOLCHAIN_FILE
- `.github/automation/riscv/build.sh` -- cmake configure + build
- `.github/automation/riscv/test.sh` -- QEMU_LD_PREFIX, ctest invocation

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The rv64 implementation has approximately 37 compiled source files vs approximately 300+ for x64 and approximately 175+ for aarch64. The following gaps are structural, not incidental.

### 6.1 Missing vs aarch64

| Feature | aarch64 | rv64 | Gap |
|---|---|---|---|
| Batch normalization (backward) | Full | Missing | No bwd BN on rv64 |
| Batch normalization (training stats) | Full | Missing | No stats computation |
| INT8 convolution (s8s8/u8s8) | Full (ACL) | Partial (IP only) | No INT8 conv, matmul, or pooling on rv64 |
| RNN (LSTM/GRU/Vanilla) | Full | Not present | No rv64 RNN kernels |
| Shuffle | Subdirectory present | Not present | |
| ukernel API | Subdirectory present | Not present | |
| Depthwise conv (f32) | Full | Missing (f16 in progress) | Only f16 dwconv in review |
| Reorder (all dtypes, JIT) | Full | In progress | PR [#5363](https://github.com/oneapi-src/oneDNN/pull/5363) not yet merged |
| Reduction | Full | In progress | PR [#5361](https://github.com/oneapi-src/oneDNN/pull/5361), active correctness bug |
| INT4 / FP8 / FP4 | Not in scope for either | Not in scope | Not a gap specific to rv64 |
| ACL integration | Optional accelerated backend | Not applicable | ACL is AArch64-only by design |

### 6.2 Data Type Coverage

| dtype | Matmul | Conv | Pooling | Softmax | LayerNorm | Eltwise |
|---|---|---|---|---|---|---|
| f32 | Yes | Yes | Yes | Yes | Yes | Yes |
| f16 | Yes (BRGEMM) | Partial (dwconv in review) | Yes (NCHW f16 merged Jan 2026) | Yes | Yes | Yes |
| bf16 | Yes (BRGEMM) | No | No | No | No | No |
| s8/u8 | No (no INT8 matmul) | No | No | No | No | No |
| s32 | No | No | No | No | No | No |

BF16 support is limited to the BRGEMM path (merged Jun 2026). No BF16 convolution or normalization kernels exist. INT8 quantized inference paths (s8s8, u8s8, with zero-point and scale compensation) exist only for inner product, not for convolution or matmul.

---

## 7. CI/CD Infrastructure

### 7.1 Workflow Summary

Two CI workflows exist for RISC-V. Both run on x86_64 GitHub-hosted runners (`ubuntu-24.04`) using QEMU user-mode emulation. There are no native riscv64 hardware runners in either workflow.

| Workflow | Trigger | Runner | Emulation | Test scope | VLEN |
|---|---|---|---|---|---|
| `ci-riscv.yml` | push/PR to rv64 paths + manual | ubuntu-24.04 (x86) | QEMU with `vext_spec=v1.0` | SMOKE tests | 128, 256 |
| `weekly-riscv.yml` | Saturday 05:00 UTC + manual | ubuntu-24.04 (x86) | QEMU with `vext_spec=v1.0` | SMOKE tests, 10 partitions | 128 only |

### 7.2 What CI Actually Tests

The `ci-riscv.yml` workflow uses path filters: it only triggers on PRs that touch `src/cpu/rv64/**`, `cmake/**`, `include/**`, `src/common/**`, `tests/**`, or `CMakeLists.txt`. A PR modifying generic CPU code that regresses rv64 behavior does not trigger this workflow.

The weekly workflow runs a full CI-scale test suite split across 10 parallel QEMU jobs. The heaviest individual test (`test_graph_unit_dnnl_sdp_decomp_cpu`) has an empirical runtime of approximately 12,322 seconds under QEMU. GitHub Actions caps job runtime at 6 hours (21,600 seconds). As a result, the slowest tests are permanently excluded from the CI test set via `skipped-tests.sh`, even in the weekly `CI` mode [NEEDS VERIFICATION -- the 12,322s figure is from `.github/automation/riscv/test.sh` but the actual exclusion logic was not separately confirmed against the live skipped-tests.sh content].

QEMU tests cover vlen=128 (both workflows) and vlen=256 (ci-riscv only). No test configuration simulates Zvfbfwma beyond compile-time detection.

### 7.3 No Native Hardware CI

No native riscv64 hardware runner exists in any CI configuration. All benchmark data reported in PRs (section 8.3) was measured on physical SpacemiT/SG2044 boards by contributors manually, not by automated CI.

---

## 8. Distribution and Release Status

### 8.1 Upstream Releases

The oneapi-src/oneDNN upstream repository (latest: v3.12.1) publishes **zero binary assets** on any GitHub Release. All releases are source-only tags. No riscv64 pre-built library, wheel, or archive exists from the upstream project for any release. [Verified via GitHub API: all 5 most recent releases have empty `assets` arrays.]

### 8.2 PyPI

The `onednn` PyPI package (latest: `2026.0.0`) distributes wheels for `manylinux_2_28_x86_64` and `win_amd64` only. No riscv64 wheel exists in any of the 12 releases on PyPI. [Verified via live PyPI JSON API.]

No riscv64 oneDNN wheel is present in the RISE wheel builder (riseproject.gitlab.io/python/wheel_builder/) either.

### 8.3 Linux Distribution Packages

| Distribution | Package | riscv64 Status | Version | Notes |
|---|---|---|---|---|
| Debian unstable (sid) | `libdnnl3.6` / `libdnnl-dev` | **Available** | 3.12.1+ds-3 | Debian-repackaged (`+ds` = stripped non-DFSG content); not upstream binary |
| Ubuntu (stonking/resolute) | `libdnnl3.6` | **Available** | 3.9.1+ds-2 | Debian-derived; significantly behind upstream 3.12.1 |
| Ubuntu 24.04 (Noble) | N/A | **Not present** | N/A | Package not in Noble repositories |
| Arch Linux RISC-V | N/A | **Unconfirmed** | N/A | Not found in archriscv.felixc.at index |

The Debian and Ubuntu packages are maintainer-modified source repackagings. Whether they exercise RVV JIT code paths on actual riscv64 hardware versus falling back to scalar reference paths is unverified. [NEEDS VERIFICATION]

---

## 9. Dependencies

### 9.1 xbyak_riscv

**Role:** RVV JIT code generator for all `jit_rvv_*` and `jit_uni_*` kernels on rv64. Vendored at `third_party/xbyak_riscv/`, pinned to tag 1.10.

**RISC-V status:** Header-only C++11, compiles on any riscv64 toolchain. No riscv64-specific open issues upstream.

**Gap:** Upstream is at tag 1.30. oneDNN vendors 1.10. Zvfbfwma support in upstream xbyak_riscv 1.30 requires binutils 2.43+; this is not reflected in the vendored copy. PR [#5318](https://github.com/oneapi-src/oneDNN/pull/5318) added Zvfbfwma support to the vendored copy via a local patch rather than a version bump. No issue has been filed for the version lag.

### 9.2 OpenMP (default CPU threading, `DNNL_CPU_RUNTIME=OMP`)

**Role:** Default multi-threaded execution. OpenMP SIMD pragmas also used for compiler-vectorized fallbacks.

**RISC-V status:**
- GCC libgomp: builds and works on riscv64. Used in CI.
- LLVM libomp: fails to build on native riscv64 hardware. Open issue [llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026): "Cannot find Threads" in CMake config; standalone build hits a Perl/FindBin.pm error. Unassigned. No linked PR.

**Impact:** Any deployment relying on Clang/LLVM toolchain with libomp cannot use threaded oneDNN on native riscv64 hardware without resolving this upstream issue.

### 9.3 oneTBB (optional, `DNNL_CPU_RUNTIME=TBB`)

**Role:** Alternative CPU threading runtime.

**RISC-V status:** riscv64 toolchain file merged April 2023 ([PR #1086](https://github.com/uxlfoundation/oneTBB/pull/1086)). riscv64 is not listed in SYSTEM_REQUIREMENTS.md under any supported tier (neither official nor community-supported). No CI pipeline for riscv64 exists in oneTBB post-2023. Latest release: 2023.0.0 (April 2026) [NEEDS VERIFICATION -- the release version "2023.0.0" published April 2026 appears anomalous; the release date is from the research findings and has not been separately confirmed].

### 9.4 OpenBLAS (optional, `DNNL_BLAS_VENDOR=OPENBLAS`)

**Role:** Optional external BLAS backend. Default is `DNNL_BLAS_VENDOR=NONE` (uses oneDNN's internal BLAS). When selected, provides SGEMM/DGEMM for GEMM-based convolution and inner product.

**RISC-V status:** Full riscv64 support including RVV 1.0 targets (ZVL128B, ZVL256B), DYNAMIC_ARCH runtime dispatch. Latest release v0.3.33 (2026-04-23).

**Open issues:**
- ZVL256B TRSM correctness bug: unresolved, unassigned, draft PR [#5830](https://github.com/xianyi/OpenBLAS/pull/5830).
- DGEMM correctness regression fixed in develop but unreleased [NEEDS VERIFICATION].
- GCC 14+ required for ZVL kernel paths. GCC 13 silently falls back to scalar. No toolchain guard enforced.
- LAPACK correctness untested on riscv64 in CI (timeout under QEMU).

Ubuntu 24.04 ships OpenBLAS 0.3.26, which is missing DYNAMIC_ARCH and ZVL targets.

### 9.5 Googletest (test framework, vendored)

**RISC-V status:** `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 -- returns 0 instead of thread count. Open since 2022: [google/googletest#3756](https://github.com/google/googletest/issues/3756). Labeled as bug, assigned, no fix merged. Does not affect oneDNN test correctness directly (oneDNN does not use `GetThreadCount` assertions).

### 9.6 GPU and Non-CPU Dependencies

Arm Compute Library (ACL), Level Zero, ngen, and OpenCL are all not applicable to riscv64 by design. ITTnotify and spdlog compile as no-ops or pure portable code on riscv64 with no issues.

---

## 10. Ecosystem Status

### 10.1 Contributing Organizations

The RISC-V code base has received contributions from:

- **ISCAS** (Institute of Software, Chinese Academy of Sciences): Primary contributor. Named code owners: Fei Zhang (@zhangfeiv0), Xia Zhuozhao (@xiazhuozhao). Responsible for JIT infrastructure integration, GEMM, normalization, softmax, CI setup, and governance.
- **SpacemiT**: Active contributor since late 2025. Primary hardware platform (SG2042, SG2044, X100, K3) used for all published benchmarks. Contributors include velonica0, xinghai-zh. Responsible for BF16/F16 BRGEMM kernels and f16 depthwise conv.
- **ZTE Corporation**: Named code owner: Jian Zhang (@zhangjian29). Contributed f32 JIT BRGEMM foundation kernel ([#4824](https://github.com/oneapi-src/oneDNN/pull/4824)), Winograd convolution ([#4735](https://github.com/oneapi-src/oneDNN/pull/4735)), pooling JIT.
- **Microchip Technology**: krishnasai-mcw contributed early dynamic -march support and matmul/GEMM kernels in mid-2025. No contributions since.
- **Intel**: Core maintainers hold fallback authority. Intel's involvement in rv64 is limited to infrastructure (alvoron's include fix in 2024, vpirogov committing the CODEOWNERS update).

The RISC-V team has no Maintainer-level access. Intel's Core team can override any RISC-V team decision.

### 10.2 RISE Project Involvement

ISCAS and SpacemiT are both General Members of the RISE Project. ZTE is not listed as a RISE member. Intel is not a RISE member.

Despite this, the oneDNN RISC-V work is not conducted through a named RISE project, funded RFP, or coordinated RISE initiative. All 27 RISE blog posts (May 2024 through June 2026) contain zero mentions of oneDNN. oneDNN does not appear in the RISE wheel builder. The work is driven entirely through the uxlfoundation/oneDNN GitHub repository by individual contributors employed at ISCAS and SpacemiT.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Correctness Bugs

**PR [#5361](https://github.com/oneapi-src/oneDNN/pull/5361) -- f16 accumulation overflow in reduction kernel (open, 0 approvals)**

In `jit_uni_reduction_kernel.cpp`, for f16 mean reduction:

```
vfncvt_f_f_w(v_data, v_red);   // f32 sum -> f16 (truncates range)
vfmv_f_s(f_tmp, v_data);
fcvt_s_h(Reg(f_tmp.getIdx()), Reg(f_tmp.getIdx()));
```

This performs `f32(f16(sum_f32))`, which produces wrong results when the accumulated f32 sum exceeds f16's representable range (~65504).

Reproduction:
```
./benchdnn --reduction --mode=C --impl=jit:uni \
  --sdt=f16 --ddt=f16 --stag=x --dtag=x --alg=mean 65536:1
```

This bug is present in an open PR and is not yet in main. It must be resolved before this PR merges.

### 11.2 Recently Resolved Correctness Bugs

**Issue [#4638](https://github.com/uxlfoundation/oneDNN/issues/4638) -- SIGILL crash on RVV-disabled hardware (closed Feb 2026)**

Building on an rv64gc machine (SG2042, no RVV) with a compiler that supports `-march=rv64gcv_zvfh` caused CMake to enable that flag globally. Compiler-autovectorized static initializers embedded vector instructions before any runtime ISA guard could fire, causing SIGILL on 226/227 tests. Fixed by PR [#4685](https://github.com/oneapi-src/oneDNN/pull/4685) via `__attribute__((target("arch=+v")))` scoping.

This bug means any rv64gc chip (no V extension) would have crashed with the oneDNN binary built on a Zvfh-capable toolchain. The fix is in main.

**Issue [#3934](https://github.com/oneapi-src/oneDNN/issues/3934) -- matmul dropout attribute rejected (closed Nov 2025)**

RVV matmul path threw `unsupported format tag` / `invalid_arguments` when dropout attribute was used on a 1x1:1x1 matmul shape. Reproduced on 64-core RISC-V hardware with Clang 17.0.6 and oneDNN v3.10.0. Fixed by PR [#4197](https://github.com/oneapi-src/oneDNN/pull/4197).

**PR [#5363](https://github.com/oneapi-src/oneDNN/pull/5363) -- JIT reorder non-scalar zero-point and s32 scale correctness (open, 1/2 approvals)**

Two correctness bugs were caught in review before merge:

1. Non-scalar zero-points entered JIT path and produced wrong results on shapes like `--sdt=u8 --ddt=s8 --attr-zero-points=src:per_dim_1 4x17`. Fix: reject non-scalar src/dst zero-point masks in `pd_t::create()`.
2. s32->s32 with `scale_adjust != 1.f` entered f32 JIT path (f32 cannot represent all int32 values beyond 2^24). Fix: `jit_uni_reorder_kernel_f32_t::applicable()` now rejects this case.

Both fixes are included in the PR and verified by reviewer. Not yet in main.

### 11.3 Zvfbfwma Runtime Detection Workaround

PR [#5295](https://github.com/oneapi-src/oneDNN/pull/5295) documents that `/proc/cpuinfo` and `riscv_hwprobe` do not reliably expose the Zvfbfwma extension on current silicon (Linux kernel support for the Zvfbfwma HWPROBE bit requires kernel 6.15+). The workaround is a SIGILL probe: `sigaction(SIGILL)` + `sigsetjmp` wraps one `vfwmaccbf16.vf` instruction at library initialization time. Success is cached in the `Riscv64Cpu` singleton as `mayiuse(zvfbfwma)`.

This probe fires at runtime on every process launch. If the kernel does not suppress SIGILL correctly under emulation (e.g., QEMU versions before Zvfbfwma support), this probe will misfire. The correctness of the detection under QEMU in the weekly CI is unverified. [NEEDS VERIFICATION]

---

## 12. Objections and Upstream Blockers

**Threading runtime gap (OpenMP/LLVM):** LLVM libomp does not build on native riscv64 hardware ([llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026)). Any deployment on a LLVM-toolchain-based riscv64 system must use GCC libgomp or the sequential (`NONE`) runtime.

**Experimental classification with no promotion path:** oneDNN's README explicitly labels rv64 as experimental. No documented criteria exist for promotion. The decision rests with Intel's Core team. Given Intel's lack of commercial interest in RISC-V silicon, there is no organizational incentive for Intel to promote RISC-V to a first-class tier.

**Code owner vs. maintainer distinction:** The RISC-V team (ISCAS, ZTE) can review PRs in their CODEOWNERS paths but cannot merge. All merges require approval from Intel maintainers (`vpirogov`, `dzarukin`). This creates a dependency on Intel reviewer bandwidth.

**INT8 quantized inference is incomplete:** No INT8 convolution, INT8 matmul (aside from a gemm path in inner product), or INT8 normalization kernels exist on rv64. Inference deployment using quantized models (INT8 post-training quantization) is not fully supported.

**No GPU runtime:** GPU support is not planned for rv64. `ONEDNN_GPU_RUNTIME=NONE` is the only valid configuration. Deployment scenarios requiring GPU acceleration on RISC-V are outside oneDNN's scope.

**CI covers QEMU only; no hardware regression testing:** All automated testing runs under QEMU vlen=128 and vlen=256 on x86 hardware. Hardware-specific bugs (cache behavior, memory subsystem, actual silicon errata) are not caught by CI. All hardware benchmark data in PRs is collected manually on SpacemiT boards by contributors.

**xbyak_riscv version lag:** oneDNN vendors tag 1.10 while upstream is at 1.30. New extensions (Zvfbfwma in PR #5318) are patched locally rather than via a version bump. This divergence will complicate future upstreaming and may cause conflicts with xbyak_riscv releases.

**Zvfbfwma SIGILL probe reliability:** The runtime detection mechanism for Zvfbfwma (SIGILL trap-probe) is a firmware workaround that may not function correctly under all emulation environments or in signal-restricted deployments (e.g., seccomp profiles). [NEEDS VERIFICATION]

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The rv64 port supports f32 inference for the main DNN operator set (conv, matmul/GEMM, pooling, softmax, layernorm, eltwise, inner product). F16 coverage is approximately 70% complete (softmax, layernorm, eltwise, brgemm, pooling -- missing f16 conv general, f16 batchnorm, f16 group norm). BF16 is limited to BRGEMM only. INT8 inference (s8/u8) is limited to inner product only.

Key missing items that block production inference deployment:

| Gap | Effort estimate | Blocking scenario |
|---|---|---|
| INT8 conv + matmul (s8/u8, zero-points, per-channel scales) | 6-10 person-weeks | Quantized model inference (ResNet, MobileNet, BERT int8) |
| BF16 conv and normalization | 3-5 person-weeks | BF16 training and mixed-precision inference |
| RNN (LSTM/GRU) | 4-6 person-weeks | Sequence models, speech recognition |
| Reduction kernel correctness (PR #5361) | <1 person-week | Mean/max reduction over large tensors in transformers |
| Reorder full dtype (PR #5363) | <1 person-week | Quantization workflow correctness |
| f16 depthwise conv (PR #5345) | <1 person-week | MobileNet f16 inference |

### 13.2 Performance Optimization

Benchmark data from PRs (all on SpacemiT hardware, VLEN=128 unless noted):

| Kernel | Before (baseline) | After | Speedup | Hardware | Source |
|---|---|---|---|---|---|
| f16 BRGEMM matmul | scalar ref (0.007 Gflops) | JIT (0.007 Gflops, 1,682 ms) | ~2,796x | Spacemit X100 | [PR #5294](https://github.com/oneapi-src/oneDNN/pull/5294) |
| BF16 BRGEMM matmul (4096x4096) | scalar emulation (0.084 Gflops) | JIT (20.4 Gflops) | 242x | Spacemit X100 | [PR #5295](https://github.com/oneapi-src/oneDNN/pull/5295) |
| Reorder f32->s8 per_dim_0 | intrinsics/generic | JIT | 173x | RV64 hw (unspec.) | [PR #5363](https://github.com/oneapi-src/oneDNN/pull/5363) |
| Reorder s8->s8 | intrinsics/generic | JIT | 204x | RV64 hw (unspec.) | [PR #5363](https://github.com/oneapi-src/oneDNN/pull/5363) |
| Winograd conv ResNet-50 (avg) | gemm:rvv | JIT Winograd | ~18.9x | SG2044, 8-core | [PR #4735](https://github.com/oneapi-src/oneDNN/pull/4735) |
| MobileNet depthwise conv f16 (best) | ref:any | dw_k3s1:rvv | 15x | Spacemit X100 | [PR #5345](https://github.com/oneapi-src/oneDNN/pull/5345) |
| NHWC pooling (googlenet_v3 ave) | intrinsics | JIT | 3.1x | SG2044, single core | [PR #5198](https://github.com/oneapi-src/oneDNN/pull/5198) |
| f32 JIT GEMM matmul (aggregate) | reference | JIT | 1.27x | SG2044, single core | [PR #4410](https://github.com/oneapi-src/oneDNN/pull/4410) |
| Convolution aggregate (various) | reference | JIT GEMM | 1.56x | SG2044, single core | [PR #4410](https://github.com/oneapi-src/oneDNN/pull/4410) |

The large speedups (100x+) for BF16/F16 BRGEMM and reorder reflect the absence of any prior vectorized path, not an optimization of an existing one. The f32 JIT GEMM gains (1.27-1.56x) represent incremental optimization. No cross-architecture comparison data (rv64 vs arm64 or x86) exists in any PR or publication.

Performance work items with clear return on investment:

| Work Item | Expected Gain | Effort | Source Evidence |
|---|---|---|---|
| INT8 BRGEMM matmul + conv | High (similar to bf16 BRGEMM, 100x+ vs scalar) | 6-10 person-weeks | BF16 BRGEMM precedent in PR #5295 |
| Reduction correctness + optimization | Moderate (232x claimed, blocked by bug) | 1-2 person-weeks | PR [#5361](https://github.com/oneapi-src/oneDNN/pull/5361) |
| BF16 conv and normalization | Moderate | 3-5 person-weeks | BF16 BRGEMM infrastructure in place |
| f16 depthwise conv (complete PR #5345) | 3-15x vs ref:any | <1 person-week | PR [#5345](https://github.com/oneapi-src/oneDNN/pull/5345) benchmark data |

### 13.3 CI/CD Infrastructure

Current CI provides automated build verification and SMOKE-level functional testing on every PR that touches rv64 paths. Full-suite weekly tests confirm no catastrophic regressions.

Gaps:

| Gap | Impact | Effort |
|---|---|---|
| No native hardware CI runner | Performance regressions not caught; VLEN variations beyond 128/256 not tested; Zvfbfwma path not tested in CI | Requires hardware lab + self-hosted runner infra |
| QEMU Zvfbfwma support not confirmed | BF16 path correctness untested in CI | Investigation + QEMU version pin or skip |
| Path filter excludes generic CPU code changes | Regressions in shared code silently break rv64 | Broaden path filter or add periodic full build |
| Weekly full test set incompletely covered | Slowest tests permanently excluded due to 6h QEMU cap | Native hardware runner would eliminate QEMU timeout |

### 13.4 Ecosystem Enablement

| Area | Current State | Gap |
|---|---|---|
| Binary distribution | Debian/Ubuntu packages exist but are maintainer-repackaged, behind upstream, and not official | No upstream binary; no PyPI riscv64 wheel |
| Framework integration (PyTorch, TF, OpenVINO) | Not documented for rv64 | No published build instructions for riscv64 PyTorch using oneDNN backend |
| RISE coordination | ISCAS is a RISE General Member; no RISE-funded oneDNN project | No coordinated ecosystem push |
| Documentation | No rv64-specific build guide; cross-compile instructions derivable from CI scripts only | No official docs |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix f16 reduction overflow bug (PR #5361) | <1 | SpacemiT/ISCAS | Critical |
| Functional | Merge reorder JIT (PR #5363, needs 2nd review) | <1 | Qualcomm review candidate | Critical |
| Functional | Merge f16 depthwise conv (PR #5345, needs 2nd review) | <1 | Qualcomm review candidate | High |
| Functional | INT8 conv + matmul (s8/u8, per-channel scales, zero-points) | 6-10 | Qualcomm or contracted ISCAS/SpacemiT | Critical |
| Functional | BF16 conv and normalization kernels | 3-5 | Qualcomm or SpacemiT | High |
| Functional | RNN (LSTM/GRU) JIT kernels | 4-6 | Qualcomm | Medium |
| Performance | INT8 BRGEMM micro-kernel (quantized matmul) | 6-10 | Qualcomm | High |
| Performance | Reduction optimization (fix bug, then tune) | 1-2 | Qualcomm or ISCAS | High |
| Performance | Winograd f16 extension | 2-3 | SpacemiT (primary) | Medium |
| CI/CD | Resolve LLVM libomp riscv64 build failure ([#87026](https://github.com/llvm/llvm-project/issues/87026)) | 2-4 (upstream LLVM) | LLVM community; Qualcomm LLVM team relevant | High |
| CI/CD | Native hardware CI runner (self-hosted) | 4-8 (infra) + ongoing | Qualcomm lab infra | High |
| CI/CD | Zvfbfwma SIGILL probe -- verify under QEMU and seccomp | 1 | Qualcomm | Medium |
| CI/CD | Broaden PR path filter to include generic CPU code | <1 | Submit PR upstream | Medium |
| Ecosystem | Upstream riscv64 PyPI wheel or artifact | 3-5 | Coordinate with Intel/UXL | Medium |
| Ecosystem | INT8 inference build guide for riscv64 | 1 | Qualcomm (documentation) | Low |
| Governance | Qualify for Maintainer status (not just Code Owner) | Long-term | Requires sustained Intel confidence | Low |

---

## 14. Updates

No updates. Initial report dated 2026-06-17.

---

## 15. References

- [oneapi-src/oneDNN repository](https://github.com/oneapi-src/oneDNN)
- [uxlfoundation/oneDNN repository](https://github.com/uxlfoundation/oneDNN)
- [PR #4395 -- xbyak_riscv JIT integration](https://github.com/oneapi-src/oneDNN/pull/4395)
- [PR #4479 -- Weekly RISC-V CI](https://github.com/oneapi-src/oneDNN/pull/4479)
- [PR #4488 -- RISC-V CODEOWNERS](https://github.com/oneapi-src/oneDNN/pull/4488)
- [PR #4685 -- Build flag fix for SIGILL on rv64gc](https://github.com/oneapi-src/oneDNN/pull/4685)
- [PR #4824 -- f32 JIT BRGEMM kernel](https://github.com/oneapi-src/oneDNN/pull/4824)
- [PR #5079 -- f32 binary JIT kernel](https://github.com/oneapi-src/oneDNN/pull/5079)
- [PR #5198 -- NHWC pooling JIT](https://github.com/oneapi-src/oneDNN/pull/5198)
- [PR #5239 -- JIT migration: matmul/conv/softmax/pooling](https://github.com/oneapi-src/oneDNN/pull/5239)
- [PR #5294 -- f16 BRGEMM JIT kernel](https://github.com/oneapi-src/oneDNN/pull/5294)
- [PR #5295 -- BF16 BRGEMM JIT kernel](https://github.com/oneapi-src/oneDNN/pull/5295)
- [PR #5305 -- Forward pooling refactored to jit_uni_pooling](https://github.com/oneapi-src/oneDNN/pull/5305)
- [PR #5345 -- f16 NHWC depthwise conv (open)](https://github.com/oneapi-src/oneDNN/pull/5345)
- [PR #5361 -- f32/f16 RVV reduction kernel (open, correctness bug)](https://github.com/oneapi-src/oneDNN/pull/5361)
- [PR #5363 -- JIT reorder (open)](https://github.com/oneapi-src/oneDNN/pull/5363)
- [Issue #3934 -- matmul dropout attribute failure (closed)](https://github.com/oneapi-src/oneDNN/issues/3934)
- [Issue #4638 -- SIGILL on rv64gc hardware (closed)](https://github.com/uxlfoundation/oneDNN/issues/4638)
- [llvm/llvm-project#87026 -- libomp fails to build on native riscv64](https://github.com/llvm/llvm-project/issues/87026)
- [google/googletest#3756 -- GetThreadCount returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [oneTBB PR #1086 -- riscv64 toolchain file](https://github.com/uxlfoundation/oneTBB/pull/1086)
- [OpenBLAS PR #5830 -- ZVL256B TRSM correctness (draft)](https://github.com/xianyi/OpenBLAS/pull/5830)
- [RISE Project member list](https://riseproject.dev)
- [UXL Foundation](https://uxlfoundation.org)
- [herumi/xbyak_riscv upstream](https://github.com/herumi/xbyak_riscv)
- [Debian onednn tracker](https://tracker.debian.org/pkg/onednn)
- [PyPI onednn package](https://pypi.org/project/onednn/)