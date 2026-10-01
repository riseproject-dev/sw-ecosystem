---
title: ONNX
parent: Project Reports
color: orange
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: riscv-gnu-toolchain
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: ONNX (format/schema)
    relation: runtime-dependency
    criticality: critical
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: XNNPACK
    relation: runtime-dependency
    criticality: optional
  - name: Eigen
    relation: runtime-dependency
    criticality: optional
  - name: Abseil
    relation: runtime-dependency
    criticality: optional
  - name: mimalloc
    relation: runtime-dependency
    criticality: optional
  - name: pthreadpool
    relation: runtime-dependency
    criticality: optional
  - name: FlatBuffers
    relation: runtime-dependency
    criticality: optional
  - name: pybind11
    relation: runtime-dependency
    criticality: optional
  - name: re2
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="onnx" %}

# ONNX

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for ONNX Runtime (microsoft/onnxruntime)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

**Repository:** [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)<br/>
**Homepage:** [onnxruntime.ai](https://onnxruntime.ai/)<br/>
**License:** MIT<br/>

ONNX Runtime is an inference engine that executes ONNX-format models. Its primary CPU execution path for edge and embedded targets runs through MLAS (Microsoft BLAS), an internal hand-optimized linear-algebra library at `onnxruntime/core/mlas/lib/`. MLAS contains architecture-specific SIMD kernels for amd64 (hand-written assembly), aarch64 (hand-written assembly), and, as of 2026, riscv64 (C++ RVV intrinsics). The XNNPACK execution provider is an optional alternative CPU backend. No GPU execution provider exists for riscv64.

**Governance:** onnxruntime.ai and the GitHub repository carry no Linux Foundation AI & Data (or other foundation) affiliation; the site states "Copyright (c) Microsoft. All rights reserved," and the repository's Code of Conduct is the Microsoft Open Source Code of Conduct (contact: opencode@microsoft.com). `CODEOWNERS` assigns review and ownership entirely to Microsoft-org GitHub teams: `@microsoft/onnxruntime-admin` (CODEOWNERS itself, dependency manifests), `@microsoft/onnxruntime-mobile` (FlatBuffers mobile schema), and `@microsoft/onnxruntime-api` (public C/C++, C#, and Python API surfaces). No `MAINTAINERS`, `OWNERS`, or `PLATFORMS.md` file exists. Governance is Microsoft-controlled, not a multi-stakeholder or foundation model. `SUPPORT.md` limits support to GitHub Issues and GitHub Discussions, with no documented SLA or platform-tier policy.

Note: the ONNX model format/schema itself (the separate `onnx/onnx` repository, consumed by ONNX Runtime as a dependency, see Section 9) is historically associated with the Linux Foundation AI & Data Foundation; this report's governance findings above pertain specifically to `microsoft/onnxruntime`, the subject repository, not to `onnx/onnx`.

**Corporate contributors to the RISC-V port** (from commit data, not official maintainer roles): Phoebe Chen (SiFive, commit signed off as phoebe.chen@sifive.com), Zestion (zhuzhentao.zzt@alibaba-inc.com, Alibaba), and velonica0 (email masked; test hardware referenced in commits is SpacemiT K3). The existing project record attributed velonica0's PRs (#28261, #28411, #28518) to SiFive; the SpacemiT K3 hardware signature in velonica0's later PR (#32710) suggests a SpacemiT affiliation instead. Neither attribution is independently confirmed from a public profile or email domain. [NEEDS VERIFICATION]

**Community stance on new ports:** empirically permissive. SiFive's cross-compile PR (#19238) was accepted in January 2024, and optimization PRs from Alibaba and (likely) SpacemiT continued landing through September 2026, gated by normal CODEOWNERS review rather than any formal tiering or membership requirement. The first full attempt at RISC-V support (PR #18115) was closed without merging after nearly two years in review, with a maintainer stating explicitly: "The minimum requirement is that all build pipelines are green" -- a CI bar that, as of this writing, still has not been satisfied for riscv64 (see Sections 3 and 7).

---

## 2. Port History and Upstreaming Timeline

The RISC-V port is community-driven, not Microsoft-initiated. Contributors are affiliated with SiFive, Andes Technology, Alibaba, ZTE Corporation, and (for hardware benchmarking) SpacemiT. Microsoft maintainers (Faith Xu, Hariharan Seshadri/hariharans29, Changming Sun/snnn) have acted as reviewers and gatekeepers.

| Date | Event | Source |
|---|---|---|
| Dec 2018 | Original RISC-V/portability request, closed with no action | [Issue #145](https://github.com/microsoft/onnxruntime/issues/145) |
| Jun 2023 | Feature request for a SHL (T-HEAD heterogeneous RISC-V CPU/NPU) Execution Provider, still open, no implementation | [Issue #16544](https://github.com/microsoft/onnxruntime/issues/16544) |
| Sep 8, 2023 | Tracking discussion: CNOCycle proposes RISC-V support; Microsoft (Faith Xu) sets conditions -- a named long-term maintainer and CI coverage; Andes Technology (NonerKao) commits to maintaining via QEMU | [Issue/Discussion #17466](https://github.com/microsoft/onnxruntime/issues/17466) |
| Oct 26, 2023 | First RISC-V PR: scalar MLAS for rv64imafdc, no vector extension. Stalled on a failing lint/CI bar; closed without merging Jul 3, 2025 (by snnn) | [PR #18115](https://github.com/microsoft/onnxruntime/pull/18115), **closed, not merged** |
| Jan 25, 2024 | First RISC-V commit merged on `main`: riscv64 cross-compilation toolchain and `--rv64` build flag (Phoebe Chen, SiFive). Shipped in v1.17.0. | [PR #19238](https://github.com/microsoft/onnxruntime/pull/19238), **merged** |
| Apr 5, 2024 | Cross-compilation documentation merged into the `gh-pages` branch only (docs site, not shipped in any versioned package release) | [PR #19239](https://github.com/microsoft/onnxruntime/pull/19239), **merged (docs branch only)** |
| Mar 22, 2024 | Inference accuracy collapse reported: 15.23% vs 86.09% accuracy, LicheeRV Nano (C906, non-ratified RVV 0.7.1 ISA). Still open as of Oct 2026. | [Issue #20030](https://github.com/microsoft/onnxruntime/issues/20030), **open** |
| Jul 2024 | Scalar MlasSgemm CopyPackB/TransposePackB fix for RISCV proposed; closed as stale Jul 3, 2025 without merging | [PR #21261](https://github.com/microsoft/onnxruntime/pull/21261), **closed, not merged** |
| Oct 22, 2024 | Inference discrepancies on RISC-V narrowed to `torch.nn.Linear` layers; closed May 2026 | [Issue #22530](https://github.com/microsoft/onnxruntime/issues/22530), closed |
| Apr 30, 2025 | RVV-in-MLAS upstreaming plan filed; closed stale, superseded by #28261 | [Issue #24596](https://github.com/microsoft/onnxruntime/issues/24596), closed |
| Mar 25, 2026 | WASM scalar SGEMM packing-width fix merged; incidentally resolves the riscv64 correctness bug from #22530 (a non-riscv64-targeted fix) | [PR #27819](https://github.com/microsoft/onnxruntime/pull/27819), merged |
| Apr 30, 2026 | First RVV-vectorized MLAS kernels (SGEMM, Softmax); closes #17466 and #24596. First shipped in release v1.26.0. | [PR #28261](https://github.com/microsoft/onnxruntime/pull/28261), **merged** |
| May 6, 2026 | `MLAS_TARGET_RISCV64` macro PR self-closed by author (Shengyu-Wu): already resolved via #27819 and #28261 | [PR #28110](https://github.com/microsoft/onnxruntime/pull/28110), **closed, not merged** |
| Apr 30 - Jun 2026 | INT8 GEMM/GEMV, NCHWc conv/pooling, activation-kernel fixes merge in rapid succession | [#28287](https://github.com/microsoft/onnxruntime/pull/28287) (closed, superseded), [#28308](https://github.com/microsoft/onnxruntime/pull/28308), [#28411](https://github.com/microsoft/onnxruntime/pull/28411), [#28506](https://github.com/microsoft/onnxruntime/pull/28506), [#28538](https://github.com/microsoft/onnxruntime/pull/28538) -- all merged except #28287 |
| May 15-24, 2026 | RVV-optimized LLM operators (FP16 GEMM, cast, RoPE, RMSNorm) merge; SGEMM optimization PR opened, still open | [PR #28518](https://github.com/microsoft/onnxruntime/pull/28518) merged; [PR #28655](https://github.com/microsoft/onnxruntime/pull/28655) **open** |
| Jul 3, 2026 | RVV backend for MLAS QNBitGemm (quantized LLM matmul) merges | [PR #29537](https://github.com/microsoft/onnxruntime/pull/29537), merged |
| Sep 3-23, 2026 | Runtime vector-extension detection regression fixed (PR #32406); further kernel optimizations (PR #32540) and LinearAttention/ReduceMinMax kernels (PR #32710) merge; three further kernel PRs remain open | [#32406](https://github.com/microsoft/onnxruntime/pull/32406), [#32540](https://github.com/microsoft/onnxruntime/pull/32540), [#32710](https://github.com/microsoft/onnxruntime/pull/32710) merged; [#32583](https://github.com/microsoft/onnxruntime/pull/32583), [#32585](https://github.com/microsoft/onnxruntime/pull/32585), [#32608](https://github.com/microsoft/onnxruntime/pull/32608) **open** |
| Sep 7, 2026 | Feature request to activate the existing riscv64/QEMU build-test path in CI, citing #20030 as a 2-year-unresolved consequence of having no CI. Open, unanswered by maintainers. | [Issue #32465](https://github.com/microsoft/onnxruntime/issues/32465), **open** |

**Is it fully upstream?** Partially. Only two PRs have merged source changes that materially advanced riscv64 support into `main` as standalone milestones: #19238 (basic cross-compile, Jan 2024) and #28261 (first RVV kernels, Apr 2026), followed by a dense cluster of 9 further merged kernel PRs through September 2026. Three PRs that specifically targeted the original correctness/NaN issues raised in #17466 and #20030 (#18115, #21261, #28110) were closed without merging; that specific correctness work landed instead as a side effect of an unrelated WASM fix (#27819). The port was dormant for roughly 26 months (Jan 2024 to Mar 2026) before the current burst of kernel work began.

**Key observation:** None of the ~15 merged riscv64 RVV kernel files are built or tested by any automated CI pipeline (see Section 7). Every merge listed above was accepted on the strength of manual QEMU/hardware testing reported in the PR description, not automated verification.

---

## 3. Upstream Support Tier

ONNX Runtime publishes no formal named-tier (Tier 1/2/3) policy. No `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `README.md` content mentions riscv64 or RISC-V anywhere in the repository (`docs/`, 46 files, grepped and confirmed clean). RISC-V support is documented, if at all, only through code comments and the sample build script (Section 5). There is no CI badge, no official test-matrix entry, and no release artifact for riscv64 (Section 7, Section 8).

**Effective tier (inferred):** experimental, community-maintained at the source level. Build tooling and a substantial RVV kernel set exist; no CI, no official binary, and no written Microsoft commitment to maintain the port exist.

| Capability | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CI build + test | Yes | Yes | **No** |
| Official release binaries | Yes (GitHub Releases, PyPI, NuGet) | Yes | **No** |
| Hand-tuned kernel depth | ~55 asm/intrinsic files | ~19 asm/intrinsic files | 15 C++ intrinsic files, no assembly |
| Documented build path | Primary | Primary | Sample script only, "you may need to make changes before using it" (script's own comment) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Location model

No `arch/riscv/` top-level directory and no `.S` assembly files exist for riscv64 (unlike amd64/aarch64). RISC-V support is a pure C++ intrinsics backend under `onnxruntime/core/mlas/lib/riscv64/`, dispatched through `MLAS_PLATFORM` function-pointer tables in `platform.cpp`, the same mechanism used for AVX2/AVX512/NEON/SVE. No RISC-V-specific JIT backend or execution provider exists; this is CPU-EP kernel acceleration only.

### 4.2 MLAS kernel inventory (verified by direct clone, not GitHub's code-search index, which undercounted)

15 complete, non-stub files, 6,708 total lines:

| File | Lines | Purpose | ISA gate |
|---|---|---|---|
| `sgemm_kernel_rvv.cpp` | 275 | FP32 SGEMM compute, dynamic `vsetvli`, any VLEN | RVV (`MLAS_USE_RVV`, `-march=rv64gcv`) |
| `sgemm_pack_b_rvv.cpp` | 115 | SGEMM B-matrix packing | RVV |
| `qgemm_kernel_rvv.cpp` | 499 | INT8 quantized GEMM via `vwmacc.vv` widening MAC | RVV |
| `qnbitgemm_kernel_rvv.cpp` | 1,049 | 4/8-bit quantized MatMulNBits: GEMV, CompFp32, CompInt8 | RVV |
| `hqnbitgemm_kernel_rvv.cpp` | 340 | FP16-activation path of n-bit quantized GEMM | Zvfh (`-march=rv64gcv_zvfh`) |
| `halfgemm_kernel_rvv.cpp` | 239 | Half-precision (FP16) GEMM | Zvfh |
| `cast_kernel_rvv.cpp` | 62 | FP16/FP32 cast | Zvfhmin |
| `softmax_kernel_rvv.cpp` | 286 | Softmax/LogSoftmax primitives | RVV |
| `layernorm_kernel_rvv.cpp` | 109 | LayerNorm/RMSNorm | RVV |
| `activation_kernel_rvv.cpp` | 310 | Erf, Tanh, Logistic, Exp, SiLU, GeluErf, LMUL=4 | RVV |
| `conv_activation_kernel_rvv.cpp` | 291 | Fused activation for conv (Identity/Relu/LeakyRelu/Clip/HardSigmoid) | RVV |
| `rotary_embedding_kernel_rvv.cpp` | 108 | RoPE, interleaved and non-interleaved | RVV |
| `sconv_depthwise_kernel_rvv.cpp` | 731 | NCHW depthwise conv, 3x3 specialized + general, runtime LMUL 1/2/4 | RVV |
| `sconv_nchwc_kernel_rvv.cpp` | 1,203 | NCHWc direct/depthwise/pointwise conv, BlockSize=16 | RVV |
| `linear_attention_kernel_rvv.cpp` | 1,091 | Linear/gated/delta recurrent attention | RVV |

This supersedes an earlier count of 11 files; a direct `grep -rl __riscv` against a live clone (HEAD `9ae8f3e`) found 17 files total (the 15 kernel files plus `mlas.h` and `cmake/onnxruntime_mlas.cmake`), while GitHub's hosted code-search index returned only 3 hits for the same query -- the index should not be relied on for completeness claims on this repository.

ISA extensions used: RVV "V" base vector extension throughout, plus Zvfh/Zvfhmin for the three FP16 files. No Zba/Zbb/Zbc/Zbs bit-manipulation extensions are used anywhere. Only two TODO(perf) comments exist in the entire kernel set (`qgemm_kernel_rvv.cpp`, a GEMV microbench note and a missing 2-row tile), neither blocking functionality.

The existing-report claim that `rotary_embedding_kernel_rvv.cpp`'s FP16 path is a `nullptr` stub, and that no BF16 GEMM kernel exists, were not independently re-confirmed in this round of research. [NEEDS VERIFICATION]

### 4.3 Dispatch and runtime detection

`platform.cpp` populates `MLAS_PLATFORM` under `#if defined(MLAS_TARGET_RISCV64)`. Runtime vector-extension detection uses `getauxval(AT_HWCAP) & COMPAT_HWCAP_ISA_V` to decide whether RVV kernels are installed into the dispatch table at all -- this check was itself found broken and restored by [PR #32406](https://github.com/microsoft/onnxruntime/pull/32406) (merged Sep 2026): prior to that fix, RVV kernels could run without verifying hardware support for the V extension. A test-only `ORT_MLAS_RISCV_FORCE_SCALAR` environment variable forces the scalar fallback path regardless of hardware. When the V-extension isn't detected, dispatch pointers fall back to `MlasGemmQuantDispatchDefault`/generic C kernels, matching the degradation pattern used for every other architecture block in the same file.

### 4.4 Execution Providers

- **CPU EP (via MLAS):** fully wired for riscv64, independent of the gaps below.
- **XNNPACK EP:** build-system supported (`--use_xnnpack` with `--rv64`), but its upstream riscv64 test suite is broken (100+ failing RVV test targets, see Section 9).
- **No other EPs:** no CUDA, TensorRT, OpenVINO, CoreML, or DirectML EP exists for riscv64. The SHL EP request ([#16544](https://github.com/microsoft/onnxruntime/issues/16544), filed Jun 2023) remains open with no implementation activity.
- **No RISC-V JIT backend** exists in ORT itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 No standalone build documentation

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists in the repository. RISC-V build knowledge lives entirely in code and scripts, not prose docs.

### 5.2 Reference build script -- `tools/scripts/build_riscv64.sh`

Authored by SiFive (Phoebe Chen, 2024, MIT License). Host-restricted to Ubuntu. Interactively prompts for a toolchain path and downloads a prebuilt toolchain from `riscv-collab/riscv-gnu-toolchain` releases:
- Version: `2023.11.20`
- File: `riscv64-glibc-ubuntu-22.04-llvm-nightly-2023.11.20-nightly.tar.gz`
- SHA256: `98d6531b757fac01e065460c19abe8974976c607a8d88631cc5c1529d90ba7ba`

(Despite the "llvm-nightly" filename, this archive ships the GNU toolchain binaries actually used, `riscv64-unknown-linux-gnu-gcc`/`g++`, plus a bundled `qemu-riscv64`.) The script's own comment reads: "The script is a sample ... you should ensure that your environment meets ORT requirements. You may need to make changes before using it."

### 5.3 CMake toolchain file -- `cmake/riscv64.toolchain.cmake`

Sets `CMAKE_SYSTEM_PROCESSOR riscv64`, requires `RISCV_TOOLCHAIN_ROOT` to be defined (fatal error otherwise), points at `riscv64-unknown-linux-gnu-gcc`/`g++`, and wires `qemu-riscv64` in as `CMAKE_CROSSCOMPILING_EMULATOR` (invoked as `qemu-riscv64 -L <sysroot> <test-binary>`) when `RISCV_QEMU_PATH` is set.

### 5.4 Build driver flags (`tools/ci_build/build_args.py`, `build.py`)

| Flag | Effect |
|---|---|
| `--rv64` | Cross-compile target; also disables telemetry support (`target_supports_telemetry` returns `False`) |
| `--riscv_toolchain_root <path>` | Required with `--rv64`; raises `BuildError` if missing |
| `--riscv_qemu_path <path>` | Required unless `--skip_tests` is also passed; raises `BuildError` otherwise |
| `--enable_rvv` | Sets `onnxruntime_USE_RVV=ON`, builds RVV MLAS kernels |
| (cmake extra define only, no CLI flag) `onnxruntime_USE_RVV_ZVFH=ON` | Adds the three Zvfh FP16 kernel files |

Example build command (test run via QEMU):
```
python3 tools/ci_build/build.py --build_dir build/Linux --rv64 --parallel \
  --config RelWithDebInfo --cmake_generator=Ninja \
  --riscv_qemu_path=<path-to-qemu-riscv64> \
  --riscv_toolchain_root=<path-to-riscv64-unknown-linux-gnu> \
  --enable_rvv
```

### 5.5 Toolchain version requirement

`cmake/CMakeLists.txt` (lines 306-308) enforces, globally for all architectures including riscv64: **GCC >= 11.1 is a hard `FATAL_ERROR` if violated.** This is a direct code-read finding and corrects an earlier claim that GCC >= 9 was the minimum; the "GCC >= 9 / GCC 8.x unsupported" figure may reflect outdated documentation rather than the actual enforced gate. [NEEDS VERIFICATION on the source of the "GCC >= 9" figure]

Enabling RVV kernels is not separately version-gated; instead, `cmake/onnxruntime_mlas.cmake` runtime-probes compiler support via `check_cxx_source_compiles` with `-march=rv64gcv -mabi=lp64d`. If the probe fails, the build does **not** fail -- it falls back to scalar MLAS kernels with only a `WARNING`, silently losing RVV acceleration.

### 5.6 Notable build gaps

- **No riscv64 Dockerfile anywhere** in the repository (`dockerfiles/`, `tools/ci_build/github/linux/docker/`, `.devcontainer/` all checked -- only `aarch64/` and `x86_64/` subdirectories exist under the CI docker tree).
- **`protoc` has no riscv64 prebuilt binary** in official Protocol Buffers releases (PRs #23205/#23206 to add one were abandoned mid-2025), forcing cross-compilation workflows to build `protoc` from source.
- **No riscv64-specific CF-protection equivalent:** `-fcf-protection` (x86-specific) is simply skipped for `--rv64` builds; no equivalent control-flow-integrity hardening flag is applied. [NEEDS VERIFICATION]
- **No provider-disabling logic exists for riscv64** in any cmake file (grepped `onnxruntime_providers*.cmake`, `onnxruntime_external_deps.cmake`, `CMakeLists.txt` -- zero matches); all non-CPU EPs simply default to OFF, so nothing needs to be explicitly disabled.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Operation | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| FP32 SGEMM | Hand-asm (SSE2/AVX/AVX-512 tiers) | Hand-asm (NEON) | RVV intrinsics, covered |
| INT8 GEMM (4 signedness variants) | Hand-asm + VNNI | NEON Dot/Sdot/Smmla | RVV widening MAC, covered |
| FP16 GEMM | AVX-512 FP16 / AMX | KleidiAI / NEON | RVV Zvfh, covered (requires Zvfh hardware) |
| Softmax, activations (Erf/Tanh/Logistic/Exp/SiLU/GeluErf) | x86 SIMD | NEON | RVV, covered |
| LayerNorm / RMSNorm | x86 SIMD | NEON | RVV, covered |
| RoPE | x86 SIMD | NEON | RVV, covered (FP16 path previously reported as stub; not re-confirmed this round, [NEEDS VERIFICATION]) |
| NCHWc convolution, pooling | x86 SIMD | NEON | RVV, covered |
| LinearAttention / gated-delta attention | x86 SIMD | NEON | RVV, covered (added Sep 2026, PR #32710) |
| QNBitGemm (quantized LLM matmul) | x86 SIMD | NEON | RVV, covered (added Jul 2026, PR #29537) |
| BF16 GEMM | AVX-512 BF16 / AMX | NEON / SME | Not present per existing-report claim, not independently re-confirmed this round [NEEDS VERIFICATION] |
| KleidiAI integration | N/A | Yes | N/A -- ARM-specific, no riscv64 equivalent |

**Known correctness/semantics gap:** the RISC-V F extension (IEEE 754-2019-vs-RISC-V spec divergence) canonicalizes all NaN results to `0x7fc00000`, discarding payload bits, which initially broke MLAS activation test assertions. This was worked around at the test level (accepting any canonical NaN rather than bit-exact match, [PR #28538](https://github.com/microsoft/onnxruntime/pull/28538)) rather than being an implementation defect; the underlying ISA-level behavioral difference remains.

**Cross-architecture performance, not just feature coverage:** independent third-party benchmarking on SpacemiT K3 ([IREE issue #24772](https://github.com/iree-org/iree/issues/24772)) found ONNX Runtime consistently behind IREE, ExecuTorch, and LiteRT on the same riscv64 hardware for several model/precision combinations -- e.g. INT8 ResNet50: ORT 1,012ms vs ExecuTorch 43.0ms vs IREE 196.0ms vs LiteRT 120.7ms; INT8 VGG16: ORT 2,474ms vs ExecuTorch 120.6ms vs IREE 772.0ms. The same study reports ONNX Runtime could not load bf16 models on this platform at all. Data not available: a controlled, apples-to-apples riscv64-vs-arm64 ONNX Runtime benchmark on equivalent hardware; no such study was found in this or prior research.

**Independent RVV-acceleration benchmark** (Sanchez-Yun et al., Univ. of Malaga, RISC-V Summit Europe 2026, custom RVV convolution EP overriding MLAS scalar fallback, Banana Pi BPI-F3, ORT v1.24.2, 6 CNNs, 50-run average): average 2.77x speedup, peak ~3x, ranging from 2.11x (AlexNet) to 3.35x (GoogleNet).

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in microsoft/onnxruntime, confirmed exhaustively.** A direct clone-and-grep of commit `9ae8f3e86b7ecb6f51759103f31fba0c35e94ccc` (HEAD, 2026-10-01) found zero "riscv"/"rv64"/"rvv" references across all 52 GitHub Actions workflow files in `.github/workflows/`, all 72 composite actions in `.github/actions/`, all 18 top-level Azure Pipelines definitions plus 106 stage/template files under `tools/ci_build/github/azure-pipelines/`, and all 209 `.yml`/`.yaml` files in the repository. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists. This was independently verified twice in this research pass with identical results.

**What exists in the source tree but is wired to no CI trigger** (no `on: push`, `pull_request`, `workflow_dispatch`, or `schedule` references any of it, and no pipeline runner is configured for it):
1. `cmake/riscv64.toolchain.cmake`
2. `tools/scripts/build_riscv64.sh` (explicitly a manual, interactive sample script)
3. `tools/ci_build/build.py` `--rv64`/`--riscv_toolchain_root`/`--riscv_qemu_path` flags
4. `tools/ci_build/build_args.py` `--enable_rvv` flag
5. The riscv64 MLAS kernel sources and their CMake wiring
6. `#if defined(MLAS_TARGET_RISCV64)` dispatch guards

This is exactly what [Issue #32465](https://github.com/microsoft/onnxruntime/issues/32465) (opened Sep 7, 2026, still open and unanswered) states in its own words: a build/test path exists but is not activated in CI.

| Architecture | CI build | CI test | Hardware used |
|---|---|---|---|
| amd64 | Yes | Yes | GitHub-hosted / Microsoft-hosted runners |
| aarch64 | Yes | Yes | GitHub-hosted / Microsoft-hosted runners |
| riscv64 | **No** | **No** | None (manual testing only, reported in PR descriptions on SpacemiT K3, Banana Pi BPI-F3, A210/C920V2) |

**RISE runner relevance:** RISE operates native bare-metal riscv64 GitHub Actions runners on Scaleway EM-RV1 hardware (announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)), used by other projects (llama.cpp, PyTorch per the existing project record). No evidence was found that `microsoft/onnxruntime`'s own CI pipeline uses these runners; Issue #32465 asks for GitHub-hosted (not self-hosted) runners with QEMU rather than native hardware.

**Concrete cost of the CI gap:** a 2024-era SGEMM packing-width mismatch (root cause of [Issue #22530](https://github.com/microsoft/onnxruntime/issues/22530)) went undetected for roughly 14 months (Jan 2024 to Mar 2026) until an unrelated WASM fix (PR #27819) incidentally corrected it. The still-open [Issue #20030](https://github.com/microsoft/onnxruntime/issues/20030) correctness regression (86% to 15% accuracy) has been open and unaddressed for over 2 years as of this writing, and is the explicit motivating example cited in Issue #32465.

---

## 8. Distribution and Release Status

### 8.1 Official Microsoft binaries -- none for riscv64

- **PyPI `onnxruntime`:** no riscv64 wheel in any checked version.
- **PyPI `onnx` (schema):** no riscv64 wheel exists across the entire version history, confirmed by downloading and parsing the complete PyPI JSON API response (996KB, all releases). One pass reported the latest version as 1.23.1 shipping wheels for x86_64, i686, aarch64, arm64 (macOS), ppc64le, and s390x; a separate verification pass reported the latest version as 1.22.0 shipping only `manylinux_2_28_x86_64` and `manylinux_2_28_aarch64`. These two passes disagree on the exact current release and its non-riscv64 architecture list [NEEDS VERIFICATION], but both independently confirm the one load-bearing fact: **no riscv64 wheel has ever been published for `onnx` on PyPI.**
- **GitHub Releases (`microsoft/onnxruntime`):** checked v1.30.0, v1.29.1, and v1.28.2. Asset filenames are consistently `onnxruntime-linux-{aarch64,x64}-*.tgz`, `onnxruntime-osx-arm64-*.tgz`, `onnxruntime-win-{arm64,arm64x,x64}-*.zip`, plus CUDA variants and source archives -- no filename contains "riscv" in any of the three releases. v1.30.0's release notes mention a RISC-V-related fix ("restored runtime vector-extension checks on RISC-V," i.e. PR #32406) but that is a source change, not a prebuilt riscv64 binary asset. v1.26.0 (tagged 2026-05-04) was the first release whose notes credit RVV CPU EP support (PR #28261), again as source code only.

### 8.2 Third-party and distribution packages

| Source | Package | riscv64 status | Version |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | `python3-onnxruntime`, `libonnxruntime1.23`, `libonnxruntime-dev`, `libonnxruntime-providers`, `onnxruntime-tools` | **Yes, confirmed down to the binary.** `python3-onnxruntime_1.23.2+dfsg-6ubuntu1_riscv64.deb`, exact size 11,661,018 bytes, verified via live download-page fetch. | 1.23.2+dfsg-6ubuntu1 |
| Ubuntu 26.04 "resolute" | `python3-onnx`, `libonnx-dev`, `libonnx1t64`, `libonnx-testdata` | Yes, confirmed with working riscv64 download links | 1.20.0-1 |
| Debian sid (buildd) | `onnxruntime` (source package) | Yes, buildd status "Installed"; riscv64-patch status unconfirmed | 1.23.2+dfsg |
| Debian sid (buildd) | `onnx` (schema) | Yes, "Installed," built on `rv-manda-03` | 1.20.0-5 |
| RISE wheel builder (GitLab project 56254198) | `onnx` | Yes, 18 package files across 5 versions | 1.19.1, 1.20.0, 1.20.1, 1.21.0, 1.22.0 (`manylinux_2_39_riscv64`) |
| `riseproject-dev/python-wheels` (GitHub) | `onnx` | Yes | 1.23.0, 1.23.1 |
| PyPI official | `onnx`, `onnxruntime` | **No** | n/a |

**What a user must do to get a working riscv64 ONNX Runtime binary today:** either accept the Ubuntu 26.04 "resolute" or Debian sid package at version 1.23.2+dfsg (4 releases behind upstream v1.30.0, predating all merged RVV kernel PRs from PR #28261 onward -- i.e. no RVV acceleration), or cross-compile from source using the toolchain and flags in Section 5, with no automated verification that the resulting binary is correct (Section 7). There is no officially released riscv64 wheel, GitHub release asset, or NuGet package from Microsoft at any version.

---

## 9. Dependencies

Note: the `project-graph` MCP server used to cross-check Ubuntu 26.04 riscv64 package-graph availability failed to connect for this entire research session (`CONNECTION_CLOSED`, confirmed on repeated retries). This is a tooling failure, not an empty-result signal; where a Ubuntu riscv64 availability figure below is missing, it reflects this gap, not an absence of packaging.

| Dependency | Relation / criticality | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|---|
| **CMake** | build-dependency, critical | Build system, processes `riscv64.toolchain.cmake` | Architecture-independent; packaged for riscv64 in all major distros | N/A (host tool) | Packaged in Debian/Ubuntu | None found |
| **riscv-gnu-toolchain** | build-dependency, critical | Cross-compilation toolchain (`riscv64-unknown-linux-gnu-gcc`/`g++`), bundles `qemu-riscv64` | The pinned release (`2023.11.20`) is validated by the sample script; global GCC >= 11.1 gate also applies | Used as the cross-build toolchain for QEMU-based testing | Downloaded from `riscv-collab/riscv-gnu-toolchain` GitHub Releases | Not wired to any CI (Section 7); only manually invoked |
| **googletest** | test-dependency, critical | ORT's unit-test framework | Data not available: no targeted riscv64-specific search was conducted for googletest in this research pass; it is an architecture-agnostic C++ library with no SIMD/arch-specific code paths | Same | Not separately released; FetchContent | None found |
| **QEMU** | test-dependency, critical | User-mode riscv64 emulator (`qemu-riscv64`), wired as `CMAKE_CROSSCOMPILING_EMULATOR` for cross-compiled test execution | Mature riscv64 support; bundled in the recommended toolchain archive | Not itself exercised by any ORT CI (Section 7); Issue #32465 explicitly proposes adding a QEMU-based CI job | Packaged in all major distros | Not blocking QEMU itself; the gap is that no CI invokes it |
| **Protocol Buffers** | runtime-dependency, critical | Model (`.onnx`/`.pb`) serialization, C++ stub codegen | Builds (v21.12+ confirmed; current ORT pin v33.6) | Historical riscv64 build-fail issues (protobuf #14549, #12266) both closed/resolved | No pre-built `protoc` riscv64 binary in official releases (PRs #23205/#23206 to add one abandoned mid-2025) | Missing prebuilt `protoc` forces build-from-source in cross-compile workflows. Medium severity. |
| **ONNX (format/schema)** | runtime-dependency, critical | Model format/schema definitions and Python IR library (`onnx/onnx`) | Builds on riscv64 | No riscv64 test concerns found | No official PyPI wheel; available via Ubuntu 26.04 resolute, Debian sid, RISE wheel builder, and `riseproject-dev/python-wheels` (see Section 8.2) | Inherits the protoc build concern from Protocol Buffers |
| **cpuinfo** | runtime-dependency, critical | CPU/ISA feature probing, feeds both XNNPACK and MLAS dispatch | Builds on Linux riscv64 (reported via QEMU CI upstream) | `pytorch/cpuinfo` issue #124 "Add: RISC-V support" still open since 2022, indicating incomplete riscv64 support tracking | Not separately released; FetchContent only | **Missing `cpuinfo_has_riscv_zvfh()` -- direct root cause of XNNPACK issue #9886.** Does not affect MLAS's own runtime detection path (`getauxval`-based, Section 4.3), only the XNNPACK EP. |
| **XNNPACK** | runtime-dependency, optional | Alternate SIMD/neural-net microkernel CPU backend (XNNPACK EP) | Builds; a dedicated `cmake-linux-riscv64` CI job exists upstream | **Broken:** 100+ RVV test targets fail ([google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886), open since Apr 2026); operator tests excluded from CI. Also open: [#8052](https://github.com/google/XNNPACK/issues/8052) (cross-compile transpose-test failure), [#4650](https://github.com/google/XNNPACK/issues/4650) (RISC-V cpuinfo build error) | No tagged releases (zero tags); Debian ships a stale `0.0~git20241108` | Unconditional FP16/Zvfh kernel activation without runtime detection causes wrong results or crashes. **Critical only for the optional XNNPACK EP; ORT's default MLAS CPU path is unaffected.** |
| **Eigen** | runtime-dependency, optional | Header-only dense linear algebra (pre/post-processing, not ORT's hot inference path) | Header-only, architecture-independent; compiles anywhere a C++ compiler targets riscv64 | Not applicable (no arch-specific code paths) | Available as an arch-independent package | None found |
| **Abseil** | runtime-dependency, optional | C++ utilities: containers, hashing, CRC32C checksums, synchronization | Builds on riscv64 | Open: [abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) "Can't link using riscv64 toolchain" (Jul 2024). Closed: #1684 (NegativeNaN test), #1561 (riscv protobuf-via-abseil build failure). The existing project record separately cites issue #1986 for the CRC32C gap; this round's research surfaced #1702 instead. These may refer to the same underlying hardware-acceleration gap under different issue numbers. [NEEDS VERIFICATION] | Packaged in Debian/Ubuntu | CRC32C hardware acceleration unavailable on RISC-V; software fallback works (performance-only gap, not correctness) |
| **mimalloc** | runtime-dependency, optional | High-performance memory allocator | Builds on riscv64; an SV39 MMU alignment bug ([#939](https://github.com/microsoft/mimalloc/issues/939)) was fixed Dec 2024 | Two PRs (#1296/#1299) for `hwprobe`-based VA-space detection (SV39 vs SV57) were reported as open in the prior project record; not independently re-surfaced in this round's search. [NEEDS VERIFICATION] | Available via vcpkg and some distros | Correctness unaffected; performance-only risk on non-default page-table configurations |
| **pthreadpool** | runtime-dependency, optional | Thread pool for XNNPACK dispatch | Architecture-agnostic C, builds on any target | No riscv64-specific issues found | FetchContent only, not separately released | None found |
| **FlatBuffers** | runtime-dependency, optional | ORT internal model serialization format | Builds on riscv64 | No riscv64 test failures surfaced | Packaged in Debian/Ubuntu | None found |
| **pybind11** | runtime-dependency, optional | Python bindings for the onnxruntime Python package | Header-only, no arch-specific code | No riscv64 issues filed | Available as a Debian package | None found |
| **re2** | runtime-dependency, optional | Regex engine for graph pattern matching | Builds on riscv64 | No riscv64-specific issues found (only unrelated ARM64 CI issues #527/#519) | Packaged in Debian/Ubuntu | None found |

**Additional indirect dependencies found via `cmake/deps.txt` recursion, not in the originally supplied dependency set:**

| Dependency | Role | riscv64 status | Notes |
|---|---|---|---|
| mbedtls | TLS/crypto (networking support, e.g. with curl) | No riscv64-specific open issue found; the only historical hit (#3066, "hardening flag causes crash") is 32-bit-only, not riscv64/rv64 | New in the current `cmake/deps.txt`; not yet tracked by a dedicated project report |
| curl | HTTP client (networking) | No riscv64-specific issues found | New in the current `cmake/deps.txt`; not yet tracked by a dedicated project report |

Not applicable to riscv64 (ARM-specific or GPU-only, no riscv64 code path exists or is planned in ORT): `kleidiai`/`kleidiai-qmx` (ARM NEON/SME microkernels); `cutlass`, `deep_gemm`, `cudnn_frontend`, `dawn`, `dawn_agility_sdk`, `directx_headers`, `vulkan_headers` (CUDA/Vulkan/DirectX/WebGPU kernel libraries, gating GPU EPs only).

**Cross-cutting finding:** the dependency-chain's actual riscv64 blocker is narrow and well-localized -- `pytorch/cpuinfo`'s missing `cpuinfo_has_riscv_zvfh()` function is the root cause of XNNPACK issue #9886 (100+ failing RVV tests from unconditional FP16/Zvfh kernel activation). Fixing it in `cpuinfo` would unblock both `cpuinfo`'s own riscv64 completeness and the XNNPACK execution provider. ORT's default/primary CPU path (MLAS) does not depend on XNNPACK or on cpuinfo's Zvfh detection and is unaffected by this gap.

---

## 10. Ecosystem Status

ONNX Runtime does not itself define a plugin/extension ecosystem analogous to Kubernetes operators or npm packages, but a real downstream Python-package ecosystem depends on `onnx`/`onnxruntime` being available on riscv64, and this ecosystem is actively being built out by RISE rather than by Microsoft:

- **RISE GitLab wheel builder** ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) lists `onnx` among 85 riscv64-targeted Python packages it builds wheels for.
- **`riseproject-dev/python-wheels`** (GitHub, 26-repo org, this repo has 797 open issues) actively publishes riscv64 wheels for: `onnx` (v1.23.0, v1.23.1), `onnxoptimizer` (v0.4.2), `sherpa-onnx` (v1.13.7, v1.13.8), and `sherpa-onnx-core` (v1.13.6 through v1.13.8). An open issue in that repo ("sherpa-onnx riscv64 support," #1847) tracks further work. This session's GitHub access was scoped only to `riseproject-dev/sw-ecosystem`, so the `python-wheels` README could not be read directly; wheel-build activity is inferred from release/PR history (`riseproject-dev[bot]`-driven, plus at least one human contributor, luhenry).
- **`k2-fsa/sherpa-onnx`**, a speech-recognition project built on top of `onnxruntime`, maintains its own riscv64 wheel builds and documentation ([riscv64 embedded Linux install guide](https://k2-fsa.github.io/sherpa/onnx/install/riscv64-embedded-linux.html)), independently corroborating downstream demand.
- **`ucb-bar/onnxruntime-riscv`** is an unmaintained UC Berkeley fork from ~2021 focused on RISC-V accelerator support; not part of the upstream project and not actively developed.

No direct RISE project funding for `microsoft/onnxruntime` itself was found. The one RISE blog post that touches ONNX ("Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V," [2026-07-07](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/), 10xEngineers in collaboration with RISE) uses ONNX only as an interchange format feeding IREE's `iree-import-onnx`; it does not benchmark or fund ONNX Runtime itself.

**Net picture:** the downstream Python ecosystem that depends on ONNX/ONNX Runtime riscv64 availability is being filled by RISE and community wheel-building infrastructure (schema library `onnx`, and consumer packages `onnxoptimizer`/`sherpa-onnx`), not by official Microsoft release engineering, mirroring the distro-only availability pattern described in Section 8.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#20030](https://github.com/microsoft/onnxruntime/issues/20030) | Inference accuracy collapse on LicheeRV Nano (C906) | Open since 2024-03-22 | **Critical correctness** | 86.09% to 15.23% accuracy on a 3-layer CNN. Hardware uses T-HEAD's pre-ratification RVV 0.7.1 variant (`rv64imafdcv0p7xthead`), not ratified RVV 1.0 -- possibly a hardware/ISA-mismatch configuration issue rather than an ORT defect, but unresolved and unexplained after 2+ years. Explicitly cited as motivation in #32465. |
| [#32465](https://github.com/microsoft/onnxruntime/issues/32465) | Activate existing RISCV64 QEMU build/test path in CI | Open since 2026-09-07, unanswered by maintainers | **Critical process gap** | Proposes running MLAS-only unit tests on GitHub-hosted runners, nightly or on `onnxruntime/core/mlas/**` changes. Three open questions to maintainers (hidden pipeline? scoped QEMU job acceptable? GitHub Actions vs Azure Pipelines?) remain unanswered. |
| [#26187](https://github.com/microsoft/onnxruntime/issues/26187) | `DeviceDiscoveryTest.HasCpuDevice` fails on ppc64le/aarch64/loongarch64/riscv64 (Alpine/musl) | Open since 2025-09-28 | Medium | Blocks Alpine Linux packaging of ORT v1.23.0+; assigned to edgchen1, no fix posted |
| [#16544](https://github.com/microsoft/onnxruntime/issues/16544) | Add SHL (T-HEAD) Execution Provider for RISC-V | Open since 2023-06-30 | Low | No implementation activity, no comments |
| [PR #28655](https://github.com/microsoft/onnxruntime/pull/28655) | SGEMM RVV optimization | Open | Medium | VLEN-portability regression flagged: hardcodes 4-wide blocks (`vfloat32m1_t`), idling 3/4 of vector width on VLEN>=256 hardware (the SpacemiT K3 used for most ORT benchmarks). Independent reviewer benchmark on K3 showed ~0.9% improvement vs the author's claimed 15% on SG2044 (VLEN=128). A potential `k_shift` underflow was also flagged. |
| [PR #32583](https://github.com/microsoft/onnxruntime/pull/32583) | RISC-V pause hint support for SpinPause | Open since 2026-09-14 | Low | Continuing kernel/runtime work, unmerged as of Oct 2026 |
| [PR #32585](https://github.com/microsoft/onnxruntime/pull/32585) | Rewrite RVV CompInt8 QNBitGemm kernels | Open since 2026-09-14 | Low | Continuing kernel work, unmerged |
| [PR #32608](https://github.com/microsoft/onnxruntime/pull/32608) | RVV fused activation fast path | Open since 2026-09-15 | Low | Continuing kernel work, unmerged |

**Closed but load-bearing history:**
- [#17466](https://github.com/microsoft/onnxruntime/issues/17466) -- the original tracking proposal (2023), closed by PR #28261.
- [#22530](https://github.com/microsoft/onnxruntime/issues/22530) -- SGEMM `CopyPackB`/`TransposePackB` packing-width mismatch producing numerically wrong output specifically for `torch.nn.Linear` layers; root cause lived in the WASM scalar code shared with riscv64 from Jan 2024 to Mar 2026, fixed incidentally by PR #27819, not by a riscv64-targeted patch.
- The NaN canonical-form divergence (IEEE 754 payload-preserving vs RISC-V's mandated `0x7fc00000`) was worked around at the test level by PR #28538; the underlying ISA-level behavior difference is unchanged.
- [#24596](https://github.com/microsoft/onnxruntime/issues/24596) -- RVV-in-MLAS plan, superseded by PR #28261.

---

## 12. Objections and Upstream Blockers

**Objection 1: "The XNNPACK EP is broken on riscv64."**
Valid. Upstream XNNPACK has 100+ failing riscv64 tests (issue #9886), root-caused to a missing `cpuinfo_has_riscv_zvfh()` function. `--use_xnnpack` on riscv64 risks incorrect FP16 results or crashes. Mitigation: ORT's default CPU EP (MLAS) does not depend on XNNPACK and is unaffected.

**Objection 2: "There is no CI, so regressions go undetected."**
Valid and demonstrated. No riscv64 CI exists anywhere in the repository (Section 7, verified exhaustively across 52 workflow files, 72 composite actions, and 124 Azure Pipelines files). The concrete, already-realized cost is the ~14-month-undetected SGEMM packing bug (#22530) and the still-open 2+-year accuracy regression (#20030). Issue #32465 proposes a bounded fix (MLAS-only QEMU tests on GitHub-hosted runners) but is unanswered as of this writing.

**Objection 3: "No official binary exists, so deployment requires building from source."**
Valid. No PyPI wheel or GitHub Release asset exists for riscv64 at any checked version (v1.28.2 through v1.30.0). The only path to a prebuilt binary is the Ubuntu 26.04/Debian sid package at v1.23.2+dfsg, which predates every merged RVV kernel PR.

**Objection 4: "The Debian/Ubuntu riscv64 package provides RVV-accelerated ORT."**
Invalid. The packaged version (1.23.2+dfsg) predates PR #28261 (Apr 2026, the first merged RVV kernel) by several releases; the distro package ships scalar-only MLAS kernels on riscv64.

**Objection 5: "RISC-V support is at parity with arm64."**
Invalid. aarch64 has ~19 hand-written assembly files plus KleidiAI integration, full CI coverage, and official Microsoft binaries. riscv64 has 15 C++ intrinsic files with no assembly, no multi-VLEN specialization beyond basic `vsetvli` dynamic sizing, no CI, and no official binary.

**Objection 6: "The port is stable because many PRs have merged recently."**
Partially valid. 9+ kernel PRs merged April-September 2026 demonstrate active, accelerating development. But #20030 remains open, #26187 blocks Alpine packaging, and the SGEMM correctness bug (#22530) went uncaught for 14 months precisely because nothing automatically tested riscv64. Recent merge velocity does not substitute for CI coverage.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

ONNX Runtime (microsoft/onnxruntime) has no upstream riscv64 CI: a direct grep of all 52 GitHub Actions workflow files, 72 composite actions, and the full Azure Pipelines tree (18 top-level pipelines + 106 stage/template files) found zero "riscv"/"rv64" references, so none of the 15 merged RVV MLAS kernel files (e.g. [PR #28261](https://github.com/microsoft/onnxruntime/pull/28261)) are built or tested automatically. Upstream also publishes no riscv64 binaries (PyPI wheels, GitHub Release assets checked through v1.30.0). The only riscv64 availability is a Debian sid build of the `onnxruntime` source package (1.23.2+dfsg, buildd status "Installed"), with riscv64-patch status unconfirmed, so the distribution floor caps the color at orange (downstream-only) rather than yellow. ONNX Runtime is a general-purpose ML inference engine, not a RISC-V-specific optimization library -- its value proposition is architecture-agnostic model execution, not RISC-V performance -- so no optimization-level rating applies to this project.

**Pending work that could change the grade:** Open issue [#32465](https://github.com/microsoft/onnxruntime/issues/32465) (Sep 2026) explicitly asks Microsoft to wire the existing riscv64/QEMU build-test path into CI, citing the 2-year-unresolved correctness bug [#20030](https://github.com/microsoft/onnxruntime/issues/20030) (86% to 15% accuracy collapse on a RISC-V board) as motivation. Four open PRs ([#28655](https://github.com/microsoft/onnxruntime/pull/28655), [#32583](https://github.com/microsoft/onnxruntime/pull/32583), [#32585](https://github.com/microsoft/onnxruntime/pull/32585), [#32608](https://github.com/microsoft/onnxruntime/pull/32608)) continue RVV kernel work as of September 2026. Contributing companies SiFive and SpacemiT are RISE members (though `onnxruntime` itself is not a RISE member project), and SiFive authored both the original cross-compile support ([PR #19238](https://github.com/microsoft/onnxruntime/pull/19238)) and the first RVV kernels ([PR #28261](https://github.com/microsoft/onnxruntime/pull/28261)), suggesting possible future RISE-adjacent CI investment, though none has materialized as of this writing.

---

## 14. Investment Analysis

Before sizing new work: RISE has not funded or operated CI for `microsoft/onnxruntime` itself. RISE's contribution to this project's riscv64 story is indirect -- member-company engineers (SiFive, likely SpacemiT) authoring kernel PRs, and separate RISE infrastructure (wheel builder, `python-wheels` repo) covering the `onnx` schema package and downstream consumers (`sherpa-onnx`, `onnxoptimizer`), not `onnxruntime` itself. No work below is already covered by RISE funding.

### 14.1 Functional Enablement

The functional CPU-EP inference path (cross-compile, load an ONNX model, run FP32/INT8/FP16 inference via MLAS RVV kernels) works as of the Sep 2026 kernel set, provided the build uses source post-#28261 rather than the stale Debian package. Remaining gaps: the FP16 RoPE and BF16 GEMM gaps reported in the prior project record were not re-confirmed this round [NEEDS VERIFICATION]; the XNNPACK EP is unsafe to use for FP16 paths pending the `cpuinfo_has_riscv_zvfh()` fix; the `DeviceDiscoveryTest.HasCpuDevice` failure blocks Alpine/musl packaging (#26187); the C906/non-ratified-RVV correctness issue (#20030) remains unexplained.

### 14.2 Performance Optimization

Multiple independently reported benchmarks show the merged RVV kernels deliver real speedups over scalar fallback (2.77x average across 6 CNNs per the Malaga/RISC-V Summit study; 2-3x per PR #32540's model-level benchmarks; up to 9.7x on reduce-min/max micro-benchmarks per PR #32710). However, third-party cross-framework comparison on identical riscv64 hardware (IREE issue #24772) shows ONNX Runtime trailing ExecuTorch, IREE, and LiteRT on several model/precision combinations, most severely at INT8 (e.g. ResNet50: ORT 1,012ms vs ExecuTorch 43.0ms), and unable to load bf16 models at all on that platform. Closing this competitive gap, not just beating ORT's own scalar fallback, is unaddressed work with no open PR targeting it specifically.

### 14.3 CI/CD Infrastructure

The single highest-leverage, best-scoped investment is standing up the CI job proposed in Issue #32465: a GitHub-hosted-runner, QEMU-based, MLAS-unit-test-only job triggered on changes under `onnxruntime/core/mlas/**`. This requires (a) a riscv64 Docker image (none currently exists; only `aarch64/` and `x86_64/` exist under `tools/ci_build/github/linux/docker/`), and (b) a GitHub Actions workflow invoking `build.py --rv64 --riscv_qemu_path ... --enable_rvv`. This is a bounded, well-understood engineering task; the blocker is a maintainer decision, which has sat unanswered for over three weeks as of this writing (filed Sep 7, 2026, data cutoff Oct 1, 2026).

### 14.4 Ecosystem Enablement

Publishing an official riscv64 `onnxruntime` PyPI wheel is gated on CI existing (14.3) plus a Microsoft release-engineering decision; RISE's wheel builder currently covers only the `onnx` schema package, not `onnxruntime` itself, leaving a gap for Python-based ML workflows on riscv64 that want RVV-accelerated inference without a source build. Upstreaming `cpuinfo_has_riscv_zvfh()` to `pytorch/cpuinfo` is a small, targeted contribution that resolves the XNNPACK EP blocker as a side effect.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Stand up a riscv64 Docker image for cross-compile builds | 1 | Microsoft or contributor | Critical |
| CI/CD | Add a riscv64 QEMU-based GitHub Actions workflow answering Issue #32465 | 1-2 | Microsoft (decision needed) or contributor | Critical |
| Functional | Investigate and resolve the C906/pre-ratified-RVV correctness bug (#20030), or document it as an unsupported hardware configuration | 2-4 | Contributor, needs physical or emulated C906 access | High |
| Functional | Fix `cpuinfo_has_riscv_zvfh()` in pytorch/cpuinfo, unblocking XNNPACK #9886 | 1 | cpuinfo contributor / RISE AI-ML working group | High |
| Functional | Fix `DeviceDiscoveryTest.HasCpuDevice` on musl libc (#26187) | 1-2 | Microsoft (assigned, edgchen1) or contributor | Medium |
| Performance | Merge/rework PR #28655 to restore VLEN-agnostic SGEMM tiling without the VLEN=256 regression | 2-3 | ZTE author + Microsoft review | Medium |
| Performance | Close the ORT-vs-ExecuTorch/IREE/LiteRT competitive gap at INT8, per IREE issue #24772 data | 4-8 | MLAS contributor | Medium |
| Ecosystem | Publish an official riscv64 `onnxruntime` PyPI wheel | 2-4 (plus Microsoft release-infra decision) | Microsoft | High |
| Ecosystem | Update the Debian/Ubuntu `onnxruntime` package to a current release with RVV kernels | 0.5 (distro maintainer task) | Debian/Ubuntu maintainer | Medium |

---

## 15. References

- [microsoft/onnxruntime -- main repository](https://github.com/microsoft/onnxruntime)
- [onnxruntime.ai -- homepage](https://onnxruntime.ai/)
- [Issue #145 -- original RISC-V/portability request (2018, closed)](https://github.com/microsoft/onnxruntime/issues/145)
- [Issue #16544 -- Add SHL Execution Provider for RISC-V (open)](https://github.com/microsoft/onnxruntime/issues/16544)
- [Issue #17466 -- Proposal to contribute RISC-V support (tracking, closed by PR #28261)](https://github.com/microsoft/onnxruntime/issues/17466)
- [Issue #20030 -- Inference accuracy collapse on RISC-V (open)](https://github.com/microsoft/onnxruntime/issues/20030)
- [Issue #22530 -- Discrepancies in ONNX Runtime inference results on RISC-V (closed)](https://github.com/microsoft/onnxruntime/issues/22530)
- [Issue #24596 -- Plan to add RVV support to MLAS (closed, stale)](https://github.com/microsoft/onnxruntime/issues/24596)
- [Issue #26187 -- DeviceDiscoveryTest.HasCpuDevice fails on riscv64 and other archs (open)](https://github.com/microsoft/onnxruntime/issues/26187)
- [Issue #32465 -- Activate existing RISCV64 QEMU build/test path in CI (open)](https://github.com/microsoft/onnxruntime/issues/32465)
- [PR #18115 -- Basic RISC-V Support (closed, not merged)](https://github.com/microsoft/onnxruntime/pull/18115)
- [PR #19238 -- Enable RISC-V 64-bit Cross-Compiling Support (merged)](https://github.com/microsoft/onnxruntime/pull/19238)
- [PR #19239 -- Cross-Compilation Documentation for RISC-V (merged, gh-pages only)](https://github.com/microsoft/onnxruntime/pull/19239)
- [PR #21261 -- Scalar MlasSgemm CopyPackB/TransposePackB for RISCV (closed, not merged)](https://github.com/microsoft/onnxruntime/pull/21261)
- [PR #27819 -- WASM scalar sgemm fix (merged, incidentally fixes riscv64)](https://github.com/microsoft/onnxruntime/pull/27819)
- [PR #28110 -- Add MLAS_TARGET_RISCV64 macro (closed, not merged)](https://github.com/microsoft/onnxruntime/pull/28110)
- [PR #28261 -- Add RISC-V Vector (RVV) support for CPU Execution Provider (merged)](https://github.com/microsoft/onnxruntime/pull/28261)
- [PR #28287 -- RVV INT8 GEMM/GEMV early submission (closed, superseded)](https://github.com/microsoft/onnxruntime/pull/28287)
- [PR #28308 -- RVV INT8 GEMM/GEMV, M=1 routing, activation kernels (merged)](https://github.com/microsoft/onnxruntime/pull/28308)
- [PR #28411 -- RVV convolution/pooling kernels (merged)](https://github.com/microsoft/onnxruntime/pull/28411)
- [PR #28506 -- Fix compile error in sconv_depthwise_kernel_rvv.cpp (merged)](https://github.com/microsoft/onnxruntime/pull/28506)
- [PR #28518 -- RVV-optimized LLM operators for RISC-V (merged)](https://github.com/microsoft/onnxruntime/pull/28518)
- [PR #28538 -- Accept canonical NaN in activation round-trip check (merged)](https://github.com/microsoft/onnxruntime/pull/28538)
- [PR #28655 -- Optimize RISC-V RVV SGEMM kernel performance (open)](https://github.com/microsoft/onnxruntime/pull/28655)
- [PR #29537 -- RVV backend for MLAS QNBitGemm (merged)](https://github.com/microsoft/onnxruntime/pull/29537)
- [PR #32406 -- Restore the runtime vector extension check on riscv64 (merged)](https://github.com/microsoft/onnxruntime/pull/32406)
- [PR #32540 -- Riscv64 RVV kernel optimizations (merged)](https://github.com/microsoft/onnxruntime/pull/32540)
- [PR #32583 -- Add RISC-V pause hint support to SpinPause (open)](https://github.com/microsoft/onnxruntime/pull/32583)
- [PR #32585 -- Rewrite the RVV CompInt8 QNBitGemm kernels (open)](https://github.com/microsoft/onnxruntime/pull/32585)
- [PR #32608 -- Add RVV fused activation fast path on riscv64 (open)](https://github.com/microsoft/onnxruntime/pull/32608)
- [PR #32710 -- RVV LinearAttention and ReduceMinimumMaximumF32 kernels (merged)](https://github.com/microsoft/onnxruntime/pull/32710)
- [MLAS riscv64 kernel directory](https://github.com/microsoft/onnxruntime/tree/main/onnxruntime/core/mlas/lib/riscv64)
- [cmake/riscv64.toolchain.cmake](https://github.com/microsoft/onnxruntime/blob/main/cmake/riscv64.toolchain.cmake)
- [cmake/onnxruntime_mlas.cmake](https://github.com/microsoft/onnxruntime/blob/main/cmake/onnxruntime_mlas.cmake)
- [tools/scripts/build_riscv64.sh](https://github.com/microsoft/onnxruntime/blob/main/tools/scripts/build_riscv64.sh)
- [XNNPACK issue #9886 -- 100+ riscv64 RVV CI failures](https://github.com/google/XNNPACK/issues/9886)
- [XNNPACK issue #8052 -- cross-compile transpose-test failure](https://github.com/google/XNNPACK/issues/8052)
- [XNNPACK issue #4650 -- RISC-V cpuinfo build error](https://github.com/google/XNNPACK/issues/4650)
- [pytorch/cpuinfo issue #124 -- Add RISC-V support](https://github.com/pytorch/cpuinfo/issues/124)
- [abseil-cpp issue #1702 -- Can't link using riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [mimalloc issue #939 -- unable to obtain aligned memory on RISC-V SV39 MMU (fixed)](https://github.com/microsoft/mimalloc/issues/939)
- [Debian buildd -- onnxruntime riscv64 status](https://buildd.debian.org/status/package.php?p=onnxruntime&suite=sid)
- [Debian buildd -- onnx riscv64 status](https://buildd.debian.org/status/package.php?p=onnx&suite=sid)
- [packages.ubuntu.com -- python3-onnxruntime (resolute, riscv64)](https://packages.ubuntu.com/resolute/python3-onnxruntime)
- [packages.ubuntu.com -- python3-onnx (resolute, riscv64)](https://packages.ubuntu.com/resolute/python3-onnx)
- [RISE wheel builder -- onnx package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels)
- [RISE project -- member list](https://riseproject.dev/members/)
- [RISE blog -- Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [RISE blog -- Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISC-V Summit Europe 2026 -- ONNX Runtime Convolution Acceleration on RISC-V via RVV](https://cfp.riscv-europe.org/eu-summit-2026/talk/WHMPM8/)
- [IREE issue #24772 -- IREE vs ExecuTorch vs ONNX Runtime vs LiteRT on SpacemiT K3](https://github.com/iree-org/iree/issues/24772)
- [arXiv 2504.03774 -- Exploring energy consumption of AI frameworks on a 64-core RV64 server CPU](https://arxiv.org/html/2504.03774v1)
- [arXiv 2405.15380 -- Full-stack evaluation of ML inference workloads for RISC-V systems](https://arxiv.org/abs/2405.15380)
- [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)
- [ucb-bar/onnxruntime-riscv (unmaintained fork)](https://github.com/ucb-bar/onnxruntime-riscv)
- [PyPI -- onnxruntime](https://pypi.org/project/onnxruntime/)
- [PyPI -- onnx](https://pypi.org/project/onnx/)