---
title: MNN
parent: Project Reports
color: orange
---

# MNN

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for MNN<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MNN (Mobile Neural Network) is a lightweight, high-performance deep learning inference engine developed and maintained by Alibaba Group. It targets mobile, embedded, and edge deployment scenarios, with primary optimization for ARM (S-tier in Alibaba's own 4-tier support matrix) and x86 AVX2/AVX512 (also S-tier). The project supports multiple backends including CPU, Vulkan, OpenCL, Metal, and CUDA, with the CPU backend being the primary target for RISC-V work.

Governance is entirely corporate. MNN is owned by Alibaba Group with no neutral foundation membership (no CNCF, LF, Apache, or similar). No MAINTAINERS, OWNERS, CODEOWNERS, or GOVERNANCE.md files exist. A CLA is required via [cla-assistant.io/alibaba/MNN](https://cla-assistant.io/alibaba/MNN). The lead maintainer is `wangzhaode` (Wang Zhaode, Alibaba, 563 commits), with `jxt1234` (429 commits) and `Juude` (Jinde Song, Alibaba, 207 commits) as core contributors. The project bot `MNNTeam` accounts for 523 commits. Community communication is primarily in Chinese via DingTalk groups.

Alibaba DAMO is a RISE Premier Member. ISCAS (Institute of Software, Chinese Academy of Sciences) and SpacemiT are RISE General Members. These three organizations are the primary drivers of MNN's RISC-V port. However, MNN itself is not a RISE project and has received no RISE-funded RFP.

The maintainer stance toward RISC-V is lukewarm. In November 2025, maintainer `v0jiuqi` responded to a user question about official RISC-V support plans with a single word: "not at this time" (issue [#4022](https://github.com/alibaba/MNN/issues/4022)). In August 2026, lead maintainer `wangzhaode` rejected a proposal to give RISC-V its own backend module (issue [#4780](https://github.com/alibaba/MNN/issues/4780)). Despite this, community-contributed RVV PRs have been accepted and merged throughout 2025-2026, and merge velocity has improved from 47 days (August 2025) to 4 days (March 2026).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-08-05 | First RVV commit: `MNNMatrixProd` optimization by Liu Yudong (ISCAS), SHA `815ed5d6` | [PR #3779](https://github.com/alibaba/MNN/pull/3779) |
| 2025-09-22 | PRs #3779 and #3813 merged; first RVV code in mainline | [PR #3779](https://github.com/alibaba/MNN/pull/3779), [PR #3813](https://github.com/alibaba/MNN/pull/3813) |
| 2025-09-30 | Release 3.2.4: first MNN release containing RVV code | GitHub releases |
| 2025-11-20 | PR #3913 merged (MatrixAdd/Sub/Max RVV) | [PR #3913](https://github.com/alibaba/MNN/pull/3913) |
| 2025-11-25 | Maintainer responds "not at this time" to official RISC-V support question | [Issue #4022](https://github.com/alibaba/MNN/issues/4022) |
| 2025-12-22 | Bulk merge of 10 RVV optimization PRs (#4021-#4079 range) | Multiple PRs |
| 2026-02-07 | Release 3.4.0: bulk RVV optimizations shipped | GitHub releases |
| 2026-03-29 | PR #4331 merged (Int8 GEMM + `CoreFunctions::supportRVV` field, SG2044 hardware) | [PR #4331](https://github.com/alibaba/MNN/pull/4331) |
| 2026-04-08 | PR #4359 merged (Int8 functions RVV) | [PR #4359](https://github.com/alibaba/MNN/pull/4359) |
| 2026-05-06 | PR #4426 merged (CommonOptFunction RVV adaptation, SG2044) | [PR #4426](https://github.com/alibaba/MNN/pull/4426) |
| 2026-06-12 | PR #4531 merged (fix RVV pack/unpack correctness errors) | [PR #4531](https://github.com/alibaba/MNN/pull/4531) |
| 2026-07-02 | PR #4590 merged (fix dirty data in RVV AccumulateSequence) | [PR #4590](https://github.com/alibaba/MNN/pull/4590) |
| 2026-07-30 | PR #4690 merged (replace HWCAP/SIGILL detection with `riscv_hwprobe` syscall) | [PR #4690](https://github.com/alibaba/MNN/pull/4690) |
| 2026-07-31 | PR #4702 merged (SpacemiT K3 IME2 LLM inference optimization) | [PR #4702](https://github.com/alibaba/MNN/pull/4702) |
| 2026-08-17 | Issue #4780 opened and closed same day: RISC-V backend separation rejected by `wangzhaode` | [Issue #4780](https://github.com/alibaba/MNN/issues/4780) |

All RISC-V work is fully upstream in the `alibaba/MNN` main branch. No downstream fork carries RISC-V patches. The primary contributors are Liu Yudong (`ihb2032`, ISCAS), `Sherlockzhangjinge` (Sophgo/SG2044 ecosystem), and `jxgxxx` (Sophgo/SG2044 ecosystem). SpacemiT contributed the vendor IME2 kernels. Alibaba's own engineers contributed at least one PR (`luke-opus`, PR #4484, SiLu/ExpC8 kernels on T-Head RV64GCV hardware).

## 3. Upstream Support Tier

MNN uses a 4-tier system (S/A/B/C). RISC-V is not listed in the official support matrix. ARM (S-tier) and x86 AVX2/AVX512 (S-tier) are the primary optimized targets. A generic "Native" CPU backend exists (rated B-tier) that compiles on any architecture, but RISC-V is not named as a supported platform.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official support tier | S (AVX2/AVX512) | S (ARMv8/ARM82) | Not listed |
| CI build | Yes (ubuntu-latest) | Yes (Android NDK cross) | No |
| CI test execution | Yes | Yes (Android device farm) [NEEDS VERIFICATION] | No |
| Upstream binary release | Yes (linux_x64) | Yes (android_armv8, ios_armv82) | No |
| PyPI wheel | Yes (manylinux2014_x86_64) | Yes (manylinux2014_aarch64) | No |
| Maintainer-acknowledged | Yes | Yes | "Not at this time" |

## 4. Technical Architecture and RISC-V-Specific Subsystems

MNN's CPU backend is organized as a set of architecture-specific kernel libraries compiled with ISA-specific flags and linked into the main CPU backend. For RISC-V, all code lives in `source/backend/cpu/riscv/` within the CPU backend - not a separate backend module. This architectural constraint was explicitly enforced by `wangzhaode` in August 2026 (issue [#4780](https://github.com/alibaba/MNN/issues/4780)).

There is no JIT compiler in MNN. All kernels are ahead-of-time compiled. There is no GC. Cryptographic operations are not part of MNN's scope.

### SIMD / Vector Kernels

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Implementation format | C++ intrinsics + inline asm (.S) | Hand-written AArch64 assembly (105 .S files) | C++ RVV intrinsics (79 .cpp files, 0 .S files) |
| FP32 MatMul (packed) | AVX2/AVX512 | NEON/ARM82 | RVV 1.0 intrinsics, eP=16/hP=4 tile |
| FP32 MatMul (remain) | AVX2/AVX512 | NEON/ARM82 | RVV 1.0, eSize=1 scalar fallback present |
| Int8 GEMM 16x4 | SSE/AVX | NEON/ARM82 | RVV 1.0 (vwmul/vwredsum), scalar post-processing |
| W4/W2/W3 Int8 GEMM | AVX2/AVX512 | ARM82/ARM86 | Missing from base RVV; SpacemiT IME2 only |
| BF16 MatMul | AVX512BF16 | ARM BF16 | Missing |
| FP16 MatMul | AVX512FP16 | ARM82 FP16 | Missing from base RVV; Zvfh used in SpacemiT IME2 only |
| Sparse MatMul | Yes | Yes (4 .S files) | Missing |
| Depthwise Conv | Yes | Yes | RVV 1.0 intrinsics |
| Im2col | Yes | Yes | Partial - explicit "placeholder" comment in source; scalar fallback for LP=1/pack=4 |
| Softmax | Yes | Yes | RVV 1.0 (two-pass max-reduce + exp-sum) |
| LayerNorm/RMSNorm | Yes | Yes | RVV 1.0 (vfredusum + vectorized normalize) |
| SiLu | Yes | Yes | RVV 1.0 (MNNExp + Newton-Raphson reciprocal) |
| GELU | Yes | Yes | RVV 1.0 tanh-approx; erf path is scalar |
| Attention (decode) | Yes | Yes | RVV 1.0 fast path (seqLen=1) |
| Attention (prefill) | Yes | Yes | Falls back to CPUAttention (no RVV prefill path) |
| Image color conversion | Yes | Yes | RVV 1.0 (20 files, complete) |
| Bilinear/cubic resize | Yes | Yes | RVV 1.0 (8 files, complete) |
| Vendor ISA extension | N/A | ARM SME2 | SpacemiT K3 IME2 (`_xsmtvdotii`), optional |

### Runtime Detection

Runtime detection uses the `riscv_hwprobe(2)` Linux syscall (syscall 258, requires kernel 6.4+), merged in PR [#4690](https://github.com/alibaba/MNN/pull/4690). Detected extensions: RVV 1.0 (`V`), Zvfh, Zvfhmin. The previous detection mechanism (HWCAP/SIGILL probing) was replaced because it was unsafe when threads migrate across CPUs. The `CoreFunctions::supportRVV` field gates all RVV dispatch in `CommonOptFunction.cpp` (line 5082) and `Int8FunctionsOpt.cpp`.

### SpacemiT K3 IME2 Vendor Path

An optional vendor-specific path exists for SpacemiT K3 hardware, enabled with `-DMNN_RVV_SPACEMIT_IME2=ON`. This compiles a separate `MNNSpacemitIme2` CMake target with `-march=rv64gcv_xsmtvdotii -mabi=lp64d -fno-stack-protector`. Key files: `MNNSpacemitIme2GemmInt8.cpp` (5,764 lines, W8/W4 GEMM with TCM staging via `dlopen("libspine_tcm.so")`), `MNNSpacemitIme2GemmI8I4Local.cpp` (2,362 lines, i8xi4 GEMM adapted from llama.cpp SpacemiT kernels), and `MNNSpacemitIme2AttentionKernels.cpp` (537 lines, fused attention with Zvfh FP16 KV cache). When IME2 is enabled, `MNNRvvFastPathRegistration.cpp` is replaced by the IME2 registration entry point.

Benchmark on SpacemiT K3 (W4B64 asymmetric, 8 threads): Qwen3-0.6B achieves 381 tokens/s prefill (pp512) and 54 tokens/s decode (tg128); Qwen3-1.7B achieves 169 tokens/s prefill and 24.9 tokens/s decode. Source: [`docs/perf/riscv_k3_ime2_asymmetric_w4b64.md`](https://github.com/alibaba/MNN/blob/master/docs/perf/riscv_k3_ime2_asymmetric_w4b64.md).

## 5. Build System, Cross-Compilation, and Toolchain

### Required Toolchain Versions

| Tool | Minimum | Reason |
|---|---|---|
| CMake | 3.6 | `cmake_minimum_required(VERSION 3.6)` in root CMakeLists.txt |
| GCC (general) | 4.9 | Stated in `docs/compile/engine.md` |
| GCC (RVV 1.0) | ~10+ | `-march=rv64gcv` requires GCC 10+ or Clang 13+ from upstream RISC-V GNU toolchain; MNN does not state this explicitly |
| GCC (SpacemiT IME2) | SpacemiT-patched | `-march=rv64gcv_xsmtvdotii` requires a SpacemiT-patched compiler |
| Linux kernel (runtime) | 6.4+ | `riscv_hwprobe` syscall 258 required for runtime RVV detection |

### Cross-Compilation (generic riscv64)

```bash
mkdir build && cd build
cmake .. \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DMNN_USE_RVV=ON \
  -DMNN_BUILD_SHARED_LIBS=ON \
  -DMNN_OPENCL=OFF -DMNN_VULKAN=OFF -DMNN_CUDA=OFF \
  -DMNN_METAL=OFF -DMNN_OPENGL=OFF \
  -DMNN_ARM82=OFF -DMNN_KLEIDIAI=OFF -DMNN_AVX2=OFF
make -j$(nproc)
```

`-DMNN_AVX2=OFF` is required because `MNN_AVX2` defaults to ON and will fail on riscv64. `-DMNN_KLEIDIAI=OFF` is required because KleidiAI is ARM-only and defaults to ON.

### Toolchain File

The only riscv64 toolchain file in the repository is `apps/frameworks/sherpa-mnn/toolchains/riscv64-linux-gnu.toolchain.cmake`, copied from Tencent ncnn. It sets `-march=rv64gc` (no V extension). To use RVV kernels, `-DMNN_RVV_MARCH=rv64gcv` must be passed separately or `CMAKE_C_FLAGS`/`CMAKE_CXX_FLAGS` must be overridden. There is no dedicated riscv64 toolchain file in `cmake/` or `project/cross-compile/`.

### SpacemiT K3 with IME2

```bash
cmake .. \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DMNN_USE_RVV=ON \
  -DMNN_RVV_SPACEMIT_IME2=ON \
  -DMNN_RVV_MARCH=rv64gcv \
  -DMNN_BUILD_LLM=ON \
  -DMNN_SUPPORT_TRANSFORMER_FUSE=ON \
  -DMNN_LOW_MEMORY=ON \
  -DMNN_BUILD_SHARED_LIBS=ON \
  -DMNN_OPENCL=OFF -DMNN_VULKAN=OFF -DMNN_CUDA=OFF \
  -DMNN_METAL=OFF -DMNN_OPENGL=OFF \
  -DMNN_ARM82=OFF -DMNN_KLEIDIAI=OFF -DMNN_AVX2=OFF
```

### QEMU

QEMU is not referenced anywhere in the MNN repository. MNN's own documentation (`skills/riscv-cpu-optimize/references/remote-validation.md`) explicitly states that ISA, VLEN, core topology, TCM, and sustained bandwidth must be validated on target hardware. No Dockerfiles for riscv64 exist in the repository.

### Known Build Failures

PR [#4547](https://github.com/alibaba/MNN/pull/4547) (open as of 2026-08-25) identified a build failure on riscv64 with GCC 15.2 and `MNN_USE_RVV=ON`: `CoreFunctions` is only forward-declared in `CPUQuantizedAdd.cpp`, requiring `#include "compute/CommonOptFunction.h"`. This is a recurring pattern - multiple prior PRs (#4454, #4586, #4588) fixed similar missing-include build failures. The contributor addressed this in commit `0bb67203` but the PR is not yet merged.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps (operations that cannot execute with RVV acceleration)

| Gap | Impact | Notes |
|---|---|---|
| W4/W2/W3 Int8 GEMM (base RVV) | High for LLM inference | Only available via SpacemiT IME2 vendor path; generic riscv64 has no low-bit weight GEMM |
| BF16 MatMul | Medium | No Zfbfmin/Zvfbfmin support; ARM and x86 have dedicated BF16 paths |
| FP16 MatMul (base RVV) | Medium | Zvfh used only in SpacemiT IME2 attention kernels; base RVV path has no FP16 GEMM |
| Attention prefill | High for LLM | Falls back to `CPUAttention` (scalar/generic); only decode (seqLen=1) has RVV fast path |
| Sparse MatMul | Low-medium | ARM64 has 4 dedicated .S files; riscv64 has none |
| GELU erf path | Low | `MNNGeluStandardCommon` is scalar on riscv64 |
| Im2col (LP=1, pack=4) | Medium | Source contains explicit "placeholder" comment; falls through to scalar loop |

### Performance Gaps (measured, RVV vs scalar on riscv64)

All benchmarks are RVV vs scalar C++ on riscv64 hardware. No riscv64 vs arm64 cross-architecture comparison exists in the public record.

| Function | Hardware | Speedup (RVV vs scalar) | Source |
|---|---|---|---|
| MNNPackC4ForMatMul_A (l=32768) | BPI-F3 (SpacemiT K1) | 63.42x | [PR #3813](https://github.com/alibaba/MNN/pull/3813) |
| MNNPackC4ForMatMul_A (l=4096) | BPI-F3 | 60.05x | [PR #3813](https://github.com/alibaba/MNN/pull/3813) |
| generalIm2col (e=64, l=1024) | SG2044 | 9.33x | [PR #4426](https://github.com/alibaba/MNN/pull/4426) |
| MNNPackedMatMulFP32 (M=16, K=256, N=64) | SG2044 | 8.21x | [PR #4426](https://github.com/alibaba/MNN/pull/4426) |
| MNNSumWeightInt8 | SG2044 | 7.12x | [PR #4433](https://github.com/alibaba/MNN/pull/4433) |
| MNNQuantScaleFP32 (batch=100k) | SG2044 | 7.33x | [PR #4426](https://github.com/alibaba/MNN/pull/4426) |
| MNNAsyQuantFunc | SG2044 | 6.60x | [PR #4433](https://github.com/alibaba/MNN/pull/4433) |
| MNNAccumulateSequenceNumber | SG2044 | 5.39x | [PR #4433](https://github.com/alibaba/MNN/pull/4433) |
| MNNPackedMatMulRemainFP32 (M=15) | SG2044 | 5.80x | [PR #4426](https://github.com/alibaba/MNN/pull/4426) |
| MNNMaxFloat (65536 elements) | SG2044 | 5.02x | [PR #4036](https://github.com/alibaba/MNN/pull/4036) |
| MNNMatrixProd (1024x1024) | BPI-F3 | 4.28x | [PR #3779](https://github.com/alibaba/MNN/pull/3779) |
| CPUQuantizedAdd (802816 elements) | SG2044 | 4.30x | [PR #4547](https://github.com/alibaba/MNN/pull/4547) |
| MNNPackC4ForMatMul_A (eReal=1) | BPI-F3 | 0.33x (RVV SLOWER) | [PR #3813](https://github.com/alibaba/MNN/pull/3813) |

The RVV regression for very thin matrices (eReal=1) is a known limitation: vectorization overhead exceeds benefit when the inner dimension is 1.

### Tile Size Gap

MNN's riscv64 MatMul pack mode returns eP=16, lP=1, hP=4. ARM64 uses larger tiles. This is a conservative choice that limits throughput on wide-VLEN hardware (e.g., SG2044 with VLEN=256 or VLEN=512).

### Security Hardening

Data not available: no search was performed for CFI, stack canaries, or RISC-V-specific hardening flags in MNN's build system beyond the noted `-fno-stack-protector` in the SpacemiT IME2 target.

### Floating-Point Correctness

The `vsmul`/`vssra` RNU (round-to-nearest-up) mode in RVV fixed-point operations does not match the scalar `RoundingDivideByPOT` formula for negative tie cases. PR [#4547](https://github.com/alibaba/MNN/pull/4547) identified two uint8 outputs differing by 1 LSB across 500,000 randomized test cases. The contributor fixed this by removing the `vssra` RNU shortcut and implementing the full `RoundingDivideByPOT` formula. No NaN/floating-point correctness bugs specific to RISC-V were found in the issue tracker (the `riscv nan floating` search returned zero results; NaN bugs in MNN are CUDA/OpenCL-specific).

## 7. CI/CD Infrastructure

All 16 GitHub Actions workflow files and `.travis.yml` were read directly. Zero riscv64 references exist in any CI file.

| CI Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (`linux.yml`, `ubuntu-latest`) | Yes (Android NDK cross in `android.yml`) | No |
| Test execution CI | Yes | Yes (Android) [NEEDS VERIFICATION] | No |
| Release packaging CI | Yes (`mnn_release.yml`, `linux_x64`) | Yes (`android_armv8`, `ios_armv82`) | No |
| PyPI wheel CI | Yes (`pymnn_linux.yml`) | Yes (`pymnn_release.yml`, `manylinux2014_aarch64`) | No |
| QEMU emulation | No | No | No |
| Self-hosted RISC-V runner | No | No | No |
| RISE runners | No | No | No |

The merged RVV source code is compiled on `ubuntu-latest` (x86_64) in CI. It is not compiled with RVV flags in CI - the `linux.yml` workflow covers only SSE/AVX512 variants. No riscv64 binary is built, linked, or executed in any CI pipeline.

## 8. Distribution and Release Status

| Channel | riscv64 Available | Notes |
|---|---|---|
| GitHub releases (latest: 3.6.1) | No | All Linux assets are `linux_x64` only; checked all 63 releases |
| PyPI (`mnn`, latest: 3.6.1) | No | 35 wheels across 9 versions; only `manylinux2014_aarch64` and `manylinux2014_x86_64` |
| RISE wheel builder | No | MNN absent from all 80 packages; RISE redirects to PyPI |
| Ubuntu 26.04 (resolute) riscv64 | No | Not packaged; `jamnntpd` is an unrelated NNTP daemon |
| Debian sid riscv64 | No | Not packaged |
| Arch Linux RISC-V | No | Not found (inconclusive due to SPA rendering) |

To obtain a working riscv64 binary, a user must build from source with `-DMNN_USE_RVV=ON`, a RISC-V cross-compiler or native toolchain supporting `-march=rv64gcv`, and Linux kernel 6.4+ on the target for `riscv_hwprobe` runtime detection. The build requires explicitly disabling ARM-specific flags (`-DMNN_KLEIDIAI=OFF`, `-DMNN_ARM82=OFF`, `-DMNN_AVX2=OFF`).

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| FlatBuffers | Model serialization (always required) | Yes (pure C++) | No upstream riscv64 CI | Distro only (Debian sid) | Architecture-agnostic |
| Protocol Buffers | Converter serialization | Yes | Yes (upstream CI) | Yes (upstream + distro) | No issues |
| Vulkan | GPU backend (optional) | Yes (headers) | No (no riscv64 GPU HW) | Yes (distro) | Optional; no riscv64 GPU hardware |
| OpenCL | GPU backend (optional) | Yes (headers) | No | Yes (distro) | Optional |
| oneDNN | x86 CPU accel (optional) | Yes (experimental) | Weekly QEMU CI | Yes (upstream + distro) | Experimental; Intel retains merge control |
| Eigen | Linear algebra (converter/training) | Yes (RVV backend merged Nov 2025) | Partial (`allow_failure: true`) | Yes (header-only + distro) | `allow_failure: true` in CI |
| OpenBLAS | BLAS backend (optional) | Yes (RVV 1.0, DYNAMIC_ARCH) | QEMU-only | Yes (upstream + distro) | Known DGEMM correctness bug on ZVL256B (PR #5815 open) |
| SLEEF | Vectorized math (transcendentals) | Yes (RVVM1/RVVM2) | Yes (Jenkinsfile CI) | Yes (3.6+, distro) | README labels RVVM1/RVVM2 "Unmaintained" |
| xxHash | Fast hashing | Yes (RVV 1.0 merged Jun 2025) | Yes (QEMU vlen=128/256/512) | Yes (v0.8.3+, distro) | No issues |
| LZ4 | Compression | Yes (riscv64 detection v1.10.0) | Tier 3 QEMU CI | Yes (v1.10.0+, distro) | Several RVV optimization PRs unmerged |
| zstd | Compression | Yes (64-bit detection fixed Dec 2025) | Yes (QEMU vlen=128/256/512) | Yes (upstream + distro) | RVV optimization PRs stalled (3-6 month latency) |
| zlib | Compression | Yes (pure C) | OpenBSD/riscv64 only | Yes (v1.3.2, distro) | No Linux riscv64 CI; RVV Adler32 PR unmerged |
| snappy | Compression | Yes (riscv64 CI workflow) | Yes (QEMU-based) | Yes (upstream + distro) | Mostly maintenance mode |
| OpenSSL | TLS/crypto (optional) | Yes (first-class since May 2022) | Yes (13 riscv64 CI configs) | Yes (3.4/3.5/3.6/4.0, distro) | No issues |
| Highway | SIMD abstraction (image codecs, optional) | Yes (RVV 1.0 since 2021) | Yes (QEMU CI merged Jun 2026) | Yes (upstream + distro) | Mature riscv64 support |
| XNNPACK | Neural network kernels (optional) | Yes (`cmake-linux-riscv64` CI) | Yes (QEMU-based) | No versioned releases | F32-RSUM disabled on riscv64 (multi-thread correctness issue) |
| cpuinfo | CPU feature detection | Yes (QEMU CI + Android NDK cross) | Build-only (no test execution) | No versioned releases | uarch returns "unknown"; cache info empty |
| ruy | Matrix multiplication (TFLite path) | Yes (scalar fallback only) | No upstream CI | No versioned releases | No RVV optimizations; scalar only; significant performance gap |
| NNPACK | Neural network accel (legacy, optional) | No - build aborts at configure time | No | No | CRITICAL if enabled: build fails on riscv64; unmaintained since 2020 |
| KleidiAI | ARM micro-kernels | N/A (ARM-only) | N/A | N/A | Not used on riscv64; MNN gates on aarch64 only |
| half (vendored) | IEEE 754 FP16 type | Yes (pure C++ header) | Yes | Yes | Architecture-agnostic |

### Critical Dependency Notes

**