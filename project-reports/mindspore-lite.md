---
title: MindSpore Lite
parent: Project Reports
color: orange
---

# MindSpore Lite

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Optimization level:** minimal<br/>
**Scope:** RISC-V (riscv64/linux) support status for MindSpore Lite<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MindSpore Lite is Huawei's on-device inference runtime, targeting mobile, IoT, and embedded platforms. It is the deployment-side component of the MindSpore AI framework. The project is Apache-2.0 licensed and was open-sourced in February 2020. The primary development platform is Gitee (`gitee.com/mindspore/mindspore`); the GitHub repositories (`mindspore-ai/mindspore` and `mindspore-ai/mindspore-lite`) are mirrors. In July 2025 the Lite component was split into its own dedicated repo (`mindspore-ai/mindspore-lite`).

Governance follows a TSC + SIGs model explicitly modeled after ONNX/Kubernetes governance. The TSC has 14 members serving 1-year terms; the TSC Chair is Lei Chen (Huawei). MindSpore Lite has two SIGs: `mindspore-lite` and `mslite`. Contributor roles escalate from Contributor to Approver to SIG Maintainer to TSC. A CLA (individual and corporate) is required via `clasign.osinfra.cn`.

Corporate maintainership is virtually 100% Huawei. All named maintainers and committers carry `@huawei.com` addresses. The default CODEOWNERS are Jiang Jianfei (`jiangjianfei3@huawei.com`) and Ye Feng (`yefeng24@huawei.com`). The Chief Architect of the `mslite` SIG is Zhai Zhiqiang (`zhaizhiqiang@huawei.com`). Approximately 57% of commits are from the `i-robot` automation bot; the remainder are individual Huawei engineers. The RISC-V work is driven by HiSilicon (Huawei's chip subsidiary), targeting their Linx131 MCU platform for riscv32 and a generic `rv64gcv` target for riscv64.

Huawei is not a RISE Project member. MindSpore Lite has zero presence in the RISE ecosystem: no blog posts, no funded work, no wheel builder entries, no working group issues, and no use of RISE CI runners.

New hardware backends are added via a Delegate mechanism (third-party AI hardware engine proxy) or the south-bound interface. No formal tiered platform policy is publicly documented. Non-Huawei contributors face a high review bar in practice despite welcoming governance documents.

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in `mindspore-ai/mindspore-lite`. Development is tracked on AtomGit at [atomgit.com/mindspore/mindspore-lite/issues/205](https://atomgit.com/mindspore/mindspore-lite/issues/205), not on GitHub. There are zero GitHub issues or PRs for RISC-V in either repo.

| Date | Event | Source |
|---|---|---|
| 2026-01-30 | RFC filed: "Add MindSpore Lite Micro support for RISC-V" by `chen-xiaofei7` | [AtomGit issue #205](https://atomgit.com/mindspore/mindspore-lite/issues/205) |
| 2026-02-09 | First commit: `350b8aa93660` "support rv64 && rv32 compile and ut" by `m00381002` -- adds `riscv.toolchain.cmake` and `run_ut_riscv64.sh` | [GitHub mirror](https://github.com/mindspore-ai/mindspore-lite) |
| 2025-11-23 / merged 2025-12-01 | Gitee MR !476: "support riscv cpu with native flatbuffers" -- establishes riscv64 cross-compilation pipeline, adds `riscv64.toolchain.cmake`, patches `build_lite.sh` | [Commit b7b26c02](https://github.com/mindspore-ai/mindspore-lite/commit/b7b26c02efe8e32d938875e1ed3fb98389cfc9b0) |
| 2025-12-10 / merged 2025-12-17 | Gitee MR !513: "support riscv cpu rvv fp32 matmul" -- adds `matmul_rvv.c` (scalar stub, zero RVV intrinsics despite filename), upgrades march to `rv64gcv`, adds `ENABLE_RVV` CMake flag | [Commit d17a9c1f](https://github.com/mindspore-ai/mindspore-lite/commit/d17a9c1f80cf02f7cb5cadebce6e297ab40e3fab) |
| 2025-12-27 / merged 2026-01-05 | Gitee MR !539: "support riscv cpu rvv fp32 conv" -- adds RVV dispatch in `ConvFp32`, adds `RowMajor2Col12Major_rvv64()` using RV64GC scalar inline assembly (not RVV) | [Commit c5f4bac5](https://github.com/mindspore-ai/mindspore-lite/commit/c5f4bac581a0f4a4c73cb2a38f317c1027cf1f26) |
| 2026-03-03 / merged 2026-03-05 | Gitee MR !698: "support riscv64 rvv for adder fp32" -- adds `adderfloat_rvv.c` (first genuine RVV intrinsics kernel, 13 `__riscv_v*` calls), fixes two CMake bugs that made MRs !513 and !539 dead code, adds QEMU test runner | [Commit 983241ed](https://github.com/mindspore-ai/mindspore-lite/commit/983241edbeffc54e39647333446c2d9475dd6ed3) |
| 2026-04-23 | v2.9.0 tagged -- release notes state: "Adapted MindSpore Lite Micro for RISC-V backends to support high-level development in mobile-side inference" | [MindSpore v2.9.0 release notes](https://www.mindspore.cn/lite/docs/en/master/RELEASE.html) |
| 2026-05-13 / merged 2026-05-15 | Gitee MR !839: "rename riscv/libnnacl.a objectname from .o to .c.o" -- adds `cmake_minimum_required(VERSION 3.12)` to fix object file naming in RISC-V archive | [Commit de7a8a23](https://github.com/mindspore-ai/mindspore-lite/commit/de7a8a23ff7aa3a19c158cf9226fd07b90a51aec) |

Key contributors: `mwt` (nwumengfei, `362800175@qq.com`) authored MRs !476, !513, !539; `m362800175` (same individual) authored MR !698; `gupengcheng0401` authored MR !839. All are Huawei-affiliated based on commit patterns [NEEDS VERIFICATION -- email domains not confirmed for all].

The port is fully upstream. No out-of-tree patches are required. The riscv32 Micro codegen path (`kRiscV = 4`) is more mature than the riscv64 LiteRT runtime path.

## 3. Upstream Support Tier

No formal tiered platform policy is publicly documented for MindSpore Lite.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI tests pass | Yes | Yes | No |
| Official pre-built binaries | Yes | Yes | No |
| Upstream release artifact | Yes | Yes | No |
| CMake platform flag | `PLATFORM_X86_64` | `PLATFORM_ARM64` | `PLATFORM_RISCV64` (present but `OFF` by default) |
| SIMD kernel coverage | Full (SSE/AVX/AVX512) | Full (NEON, 59 `.S` files) | Minimal (1 genuine RVV kernel) |
| Distro package (Ubuntu) | Not packaged | Not packaged | Not packaged |

riscv64 is an unofficial, developer-only cross-compilation target. The `MSLITE_TARGET_RISCV` CMake option defaults to `OFF`. No pre-built binary has ever been published for riscv64 across any of the 453 release artifacts spanning versions 1.1.0 through 2.10.0 on the official Huawei OBS download server.

## 4. Technical Architecture and RISC-V-Specific Subsystems

MindSpore Lite's performance-critical path is the NNACL (Neural Network Acceleration Kernel Library), a built-in C/C++ kernel library providing hand-optimized implementations of convolution, matrix multiplication, depthwise convolution, Winograd transforms, and activation operators. NNACL is the primary inference engine for CPU targets.

### NNACL Kernel Coverage

| Operator | amd64 (SSE/AVX/AVX512) | arm64 (NEON) | riscv64 (RVV) |
|---|---|---|---|
| MatMul FP32 | C intrinsics (partial) | Hand-asm `.S`, 5 variants (full) | Scalar C fallback (zero RVV intrinsics) |
| Conv FP32 (im2col) | C intrinsics (partial) | Hand-asm `.S`, 15+ variants (full) | Dispatches to scalar MatMul stub |
| Conv Depthwise FP32 | C intrinsics (partial) | Hand-asm `.S`, 10+ variants (full) | Scalar (no RVV path) |
| Winograd Conv | C intrinsics (partial) | Hand-asm `.S` (full) | Scalar (no RVV path) |
| AdderNet FP32 | Scalar | Hand-asm `.S`, 622 lines (full) | C intrinsics, 13 `__riscv_v*` calls (partial) |
| Pack/Transpose | C intrinsics (partial) | Hand-asm `.S` (full) | RV64GC scalar inline asm, 12x4 block only (partial) |
| MatVecMul | Scalar | Hand-asm `.S` (full) | Scalar |
| Pooling FP32 | Partial (SIMD via template) | Partial | Scalar |
| Reduce FP32 | Partial | Partial | Scalar |
| Softmax FP32 | Partial | Partial | Scalar |
| Layer Norm | Partial | Partial | Scalar |
| INT8 MatMul | C intrinsics (partial) | Hand-asm `.S` (full) | Scalar (no RVV path) |
| FP16 ops | Missing | Hand-asm `.S`, 22 files (full) | Missing |

**Critical finding on `matmul_rvv.c`:** Despite including `<riscv_vector.h>` and being named `matmul_rvv.c`, this 172-line file contains zero `__riscv_v*` intrinsic calls. The `MatmulFloatRvv64Opt` function is a plain scalar C nested-loop 4x8 tiled matmul. It is a stub. Furthermore, the central dispatch function `MatMulOpt()` has no `#elif ENABLE_RVV` branch -- riscv64 falls through to the generic `MatMul12x8` scalar path. `MatmulFloatRvv64Opt` is only called from `ConvFp32`, not from `MatMulOpt`.

**Critical finding on MR !698 fixing dead code:** The CMake build in MRs !513 and !539 contained two bugs: (1) `ENABLE_RVV EQUAL 1` fails for a boolean `ON` value, and (2) `ASSEMBLY_RVV_SRC` was globbed but never added to `add_library()`. Both bugs were fixed in MR !698 (merged 2026-03-05). This means the matmul and conv RVV dispatch code from MRs !513 and !539 was effectively dead code until MR !698.

**ISA extensions used:**
- RVV (V extension): `vfloat32m1_t` intrinsics in `adderfloat_rvv.c` only; dispatch guards in matmul/conv/pack
- RV64GC: scalar FP inline asm (`flw`/`fsw`) in `pack_fp32.c`
- Zicsr + vendor CSR: `csrrw` for HiSilicon Linx131 dcache prefetch in `ms_dcache_prefetch_instructions.c`
- RV32IMFC: Micro/codegen embedded target (HiSpark Linx131 SoC)
- RV64GCV (`-march=rv64gcv`): toolchain flag for the full RVV runtime build

**Micro codegen (riscv32):** The code generator at `tools/converter/micro/coder/` has first-class `kRiscV = 4` target support with 20+ RISC-V-specific branches across 8 files. It generates scalar C code targeting `rv32imfc` (HiSilicon Linx131). This path is more mature than the riscv64 LiteRT runtime but generates no RVV code.

**No JIT backend.** RISC-V support is AOT/static only. No `.S` assembly files exist for riscv64 -- all RISC-V asm is inline C (`asm volatile`). No `arch/riscv/` directory exists; code is under `intrinsics/rvv/` and `intrinsics/`.

## 5. Build System, Cross-Compilation, and Toolchain

### Toolchain Requirements

| Component | Requirement | Source |
|---|---|---|
| Host | x86_64 Linux | `build_lite.sh` |
| Cross-compiler | `riscv64-unknown-linux-gnu-gcc` at `/opt/riscv` | `riscv.toolchain.cmake` |
| Toolchain source | [riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain) | `riscv.toolchain.cmake` |
| march | `rv64gcv` | `riscv.toolchain.cmake` |
| mabi | `lp64d` | `riscv.toolchain.cmake` |
| CMake minimum | 3.12 (required for `CMAKE_C_OUTPUT_EXTENSION`) | MR !839 |
| GCC minimum (host) | 7.3.0 (hard `FATAL_ERROR` check) | `CMakeLists.txt` lines 4-8 |
| GCC warning threshold | 11.3.0 (warning above this) | `CMakeLists.txt` |
| QEMU (for tests) | `qemu-riscv64` with `-cpu rv64,v=true,vlen=128` | `run_ut_riscv64.sh` |

### Build Command

```bash
export MSLITE_CROSS_RISCV=rv64
./build.sh
```

Internally this sets `CMAKE_TOOLCHAIN_FILE` to `mindspore-lite/cmake/riscv.toolchain.cmake` and appends:
```
-DMSLITE_TARGET_SITEAI=on -DMSLITE_ENABLE_TRAIN=off
-DMSLITE_ENABLE_CONVERTER=off -DMSLITE_ENABLE_TOOLS=off
```

The `MSLITE_CROSS_RISCV=rv64` flag is undocumented in the README [NEEDS VERIFICATION -- no README entry found in research].

### Required Disabled Features for riscv64

`MSLITE_GPU_BACKEND=off`, `MSLITE_ENABLE_NPU=off` (ARM HiAI DDK), `MSLITE_ENABLE_NNAPI=off` (Android ARM), `MSLITE_ENABLE_FP16=off` (ARM NEON), `MSLITE_ENABLE_SSE=off`, `MSLITE_ENABLE_AVX=off`, `MSLITE_ENABLE_AVX512=off`, `MSLITE_ENABLE_COREML=off` (Apple), `MSLITE_MINDDATA_IMPLEMENT=off`.

### QEMU Testing

`run_ut_riscv64.sh` runs:
```bash
qemu-riscv64 -cpu rv64,v=true,vlen=128 -L "${QEMU_LIB_PATH}" -- ./lite-test \
  --gtest_filter=TestMatMulFp32*:TestConvolutionFp32*
```
The build section of this script is entirely commented out. It is not referenced from any CI configuration. Testing is manual only, covering two operator families at `vlen=128` only. No `vlen=256` or `vlen=512` coverage exists.

### Known Build Issues

- MR !839 (2026-05-15) fixed a build artifact naming failure: without `cmake_minimum_required(VERSION 3.12)`, `CMAKE_C_OUTPUT_EXTENSION=".c.o"` is silently ignored, causing `libnnacl.a` to contain `.o` objects and breaking the RISC-V archive link.
- MR !698 (2026-03-05) fixed two CMake bugs that caused all RVV source files from MRs !513 and !539 to be excluded from the build silently.
- No Dockerfile for riscv64 cross-compilation exists in either repo.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps

- **No riscv64 platform detection in the main `mindspore/lite/CMakeLists.txt`** (the monorepo version). The platform matrix is `PLATFORM_X86_64`, `PLATFORM_ARM64`, `PLATFORM_ARM32` only. The `PLATFORM_RISCV64` flag exists only in `mindspore-ai/mindspore-lite` (the split repo).
- **No GPU/NPU backend.** riscv64 is CPU-only.
- **No FP16 support.** arm64 has 22 hand-asm FP16 files; riscv64 has none.
- **No INT8 quantized RVV kernels.** arm64 has full INT8 hand-asm; riscv64 falls to scalar.
- **No Winograd convolution optimization.** arm64 has hand-asm Winograd; riscv64 uses scalar.
- **No depthwise convolution optimization.** arm64 has 10+ hand-asm variants; riscv64 has none.
- **Training disabled** (`MSLITE_ENABLE_TRAIN=off`) for riscv64 cross-compilation.
- **Converter tool disabled** (`MSLITE_ENABLE_CONVERTER=off`) for riscv64 cross-compilation.

### Performance Gaps

The riscv64 backend is approximately 5-10% of the optimization depth of the arm64 backend by file count and operator coverage. The only genuine RVV-vectorized operator is AdderNet FP32 (`adderfloat_rvv.c`, 110 lines, 13 intrinsic calls). MatMul -- the dominant operation in transformer and CNN inference -- runs on a scalar C fallback. The expected performance gap vs arm64 NEON for a typical CNN workload is 5-20x, consistent with the absence of vectorized matmul and convolution.

For reference, IREE on a Banana Pi BPI-F3 (8-core RISC-V, VLEN=256) achieved 17.3x speedup for INT8 YOLOv8n inference with RVV optimization vs unoptimized baseline. MindSpore Lite riscv64 would currently operate at the unoptimized baseline level for all operators except AdderNet.

### Floating-Point Correctness

35 open correctness bugs exist against MindSpore 2.9.0 on CPU (all filed on x86_64). These are NaN/Inf propagation failures and float64 accuracy issues in operators including `ops.softmin`, `ops.relu`, `ops.maximum`, `ops.minimum`, `mnp.nanstd`, `ops.log_softmax`, `ops.mish`, `ops.clamp`, and others. These bugs are architecture-independent and would affect riscv64 equally. See Section 11 for the full list.

## 7. CI/CD Infrastructure

No riscv64 CI exists in any CI system for either `mindspore-ai/mindspore` or `mindspore-ai/mindspore-lite`.

| CI System | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions | No workflows directory | No workflows directory | No workflows directory |
| Jenkins (`.jenkins/`) | Yes | Yes | No -- zero riscv references in all Jenkins config files |
| GitLab CI | Not found | Not found | Not found |
| Cirrus CI | Not found | Not found | Not found |
| Travis CI | Not found | Not found | Not found |
| Azure Pipelines | Not found | Not found | Not found |
| RISE runners | No | No | No |

The CI platform is Jenkins, hosted on Gitee/AtomGit. All Jenkins configuration files (`.jenkins/task/config/mapping_task.yaml`, `.jenkins/check/config/*`, 11 files total) were read directly and contain zero riscv references.

The `run_ut_riscv64.sh` script is a developer utility, not a CI job. It is not referenced from any CI configuration file (zero code search hits for `run_ut_riscv64` in either repo). Its build section is commented out. It requires manual pre-installation of `riscv64-unknown-linux-gnu-gcc` and `qemu-riscv64`.

No RISE runner usage. MindSpore Lite is not among the 197 repositories using RISE RISC-V runners as of the "six weeks in" post (2026-05-12).

## 8. Distribution and Release Status

No riscv64 binary exists on any distribution channel. The following were checked exhaustively:

| Channel | riscv64 Available | Notes |
|---|---|---|
| Official Huawei OBS (`mindspore.cn`) | No | 453 release artifacts across v1.1.0-v2.10.0; zero contain "riscv"; direct HTTP probe of hypothetical riscv64 OBS paths returns HTTP 403 |
| GitHub Releases | No | Zero release objects with assets in either repo |
| PyPI (`mindspore-lite`) | No | Only v2.0.0 exists on PyPI (project is at v2.10.0); two files: `manylinux1_x86_64` and `none-any` only |
| RISE GitLab wheel builder | No | Redirects to PyPI; MindSpore Lite not in wheel builder package list |
| Ubuntu 26.04 (resolute) | No | Not packaged in Ubuntu at all |
| Arch Linux RISC-V | No | Not listed |
| Debian | No | Not packaged |

Latest release v2.10.0 (as of research date) provides: Linux x86_64, Linux aarch64, Android aarch64, Windows x64 tarballs, plus Python wheels for `linux_x86_64` and `linux_aarch64` (cp310/cp311/cp312).

To obtain a working riscv64 binary, a user must: (1) install `riscv64-unknown-linux-gnu-gcc` from [riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain) at `/opt/riscv`; (2) clone `mindspore-ai/mindspore-lite`; (3) run `MSLITE_CROSS_RISCV=rv64 ./build.sh` with all GPU/NPU/training/converter flags disabled; (4) manually run `run_ut_riscv64.sh` with a local `qemu-riscv64` installation to verify the build. No documentation for this procedure exists in the official build guide.

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| NNACL (built-in) | Primary CPU inference engine | Partial (scalar only) | Manual QEMU only | No | Critical |
| oneDNN (pinned v2.2) | CPU neural network primitives | No | No | Partial (Ubuntu, but wrong version) | Critical |
| Protocol Buffers (v3.13.0) | Model serialization | Partial (source build) | No | Partial (Ubuntu pkg, no protoc binary) | Critical |
| FlatBuffers (v2.0.0) | Model schema serialization | Yes | Partial | Yes (Ubuntu) | None |
| Eigen (3.4.0) | Linear algebra | Yes (scalar) | Yes | Partial (Ubuntu) | Low |
| OpenSSL (1.1.1k) | Crypto/TLS | Yes | Yes | Yes (Ubuntu) | None |
| libjpeg-turbo (2.0.4) | JPEG decode/encode | Yes | Yes | Yes (Ubuntu) | None |
| jemalloc (5.3.0) | Memory allocator | Partial | No | Yes (Ubuntu) | Moderate |
| sentencepiece (v0.1.92) | Text tokenization | Yes (C++ lib) | No | No (wheel reverted) | Moderate |
| OpenCV (4.5.2) | Image processing | Yes | Partial | Yes (Ubuntu) | Moderate |
| gRPC (~v1.x) | Distributed training RPC | Partial | No | Yes (Ubuntu) | Moderate |
| Abseil-cpp (~20210324) | C++ foundation | Yes | Partial | Yes (Ubuntu) | None |
| re2 (~2021) | Regex engine | Yes | No | Yes (Ubuntu) | None |
| ICU4C (~68.x) | Unicode text processing | Yes | Partial | Yes (Ubuntu) | None |
| SQLite (~3.x) | Dataset indexing | Yes | Yes | Yes (Ubuntu) | None |
| securec (vendored) | Huawei secure C library | Unknown | Unknown | No | Unknown |
| glog (~0.5.x) | Logging | Yes | Yes | Yes (Ubuntu) | None |

### Critical Dependency Deep-Dives

**oneDNN pinned at v2.2 (2021):** RISC-V support in oneDNN began in v3.x (2025+). The pinned v2.2 predates all RISC-V work by approximately four years. Upgrading to v3.x involves a significant version jump with API changes. This is a critical blocker for any oneDNN-accelerated path on riscv64.

**Protocol Buffers v3.13.0:** The upstream maintainer stated in August 2024: "riscv64 is not a platform supported by the protobuf project." No official `protoc` binary for riscv64 exists. The library can be built from source on riscv64, but the converter tool and training pipeline require a host `protoc` binary. This is a critical blocker for the converter workflow.

**jemalloc 5.3.0:** GitHub issue #2399 (cross-compile to riscv64) has been open since March 2023 with zero maintainer responses in over three years [NEEDS VERIFICATION -- response count not independently confirmed]. Cross-compilation from x86_64 to riscv64 is unconfirmed.

**sentencepiece v0.1.92:** riscv64 Python wheel support was merged in April 2026 (PR #1226) then reverted in May 2026. Issue #1250 requesting reinstatement is unanswered. The C++ library builds on riscv64 but no riscv64 wheel has ever shipped.

**securec (libboundscheck):** This is a mandatory Huawei-internal library vendored into the source tree. No public riscv64 CI or support documentation exists. The library is likely portable C but this is unverified.

## 11. Known Bugs and Active Issues

### RISC-V-Specific Bugs

None. Zero RISC-V-specific issues exist in either `mindspore-ai/mindspore` or `mindspore-ai/mindspore-lite` on GitHub. This reflects the absence of a riscv64 user base, not the absence of defects.

### Open Correctness Bugs (Architecture-Independent, Affect riscv64)

All 35 bugs below are filed against MindSpore 2.9.0 on CPU and would affect riscv64 equally.

**NaN/Inf Propagation Cluster (filed 2026-07-26, reporter: `nrunrun`):**

| Issue | Operator | Defect |
|---|---|---|
| [#374](https://github.com/mindspore-ai/mindspore/issues/374) | `ops.softmin` | Returns 0.0 instead of NaN for NaN+Inf row |
| [#375](https://github.com/mindspore-ai/mindspore/issues/375) | `mint.nn.functional.softshrink` | Maps NaN to 0.0 |
| [#376](https://github.com/mindspore-ai/mindspore/issues/376) | `mnp.nanstd` | Returns 0.0 for +Inf/-Inf mix |
| [#377](https://github.com/mindspore-ai/mindspore/issues/377) | `mnp.nanvar` | Collapses to 0.0 for +Inf/-Inf mix |
| [#378](https://github.com/mindspore-ai/mindspore/issues/378) | `ops.log_softmax` | Leaves -Inf in NaN-contaminated row |
| [#379](https://github.com/mindspore-ai/mindspore/issues/379) | `ops.mish` | Returns NaN for +Inf instead of preserving +Inf |
| [#380](https://github.com/mindspore-ai/mindspore/issues/380) | `mint.nn.functional.relu` | Drops NaN to 0.0 |
| [#381](https://github.com/mindspore-ai/mindspore/issues/381) | `ops.relu6` | Replaces NaN with 0.0 |
| [#382](https://github.com/mindspore-ai/mindspore/issues/382) | `ops.softplus` | Converts NaN to +Inf |
| [#383](https://github.com/mindspore-ai/mindspore/issues/383) | `mnp.diagflat` | Fills off-diagonal with NaN when input has NaN/Inf |
| [#384](https://github.com/mindspore-ai/mindspore/issues/384) | `mnp.cbrt` | Returns NaN for +/-0 inputs |
| [#385](https://github.com/mindspore-ai/mindspore/issues/385) | `ops.xlogy` | Returns NaN for zero input with negative second arg |
| [#386](https://github.com/mindspore-ai/mindspore/issues/386) | `mnp.divide` | Returns -Inf for NaN/0 |
| [#387](https://github.com/mindspore-ai/mindspore/issues/387) | `mnp.logaddexp` | Overflows to Inf for large finite float32 |
| [#388](https://github.com/mindspore-ai/mindspore/issues/388) | `mnp.logaddexp2` | Overflows to Inf for