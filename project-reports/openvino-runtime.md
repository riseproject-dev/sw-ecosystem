---
title: OpenVINO Runtime
parent: Project Reports
color: blue
---

# OpenVINO Runtime

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenVINO Runtime<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OpenVINO Runtime is Intel's open-source inference engine for deploying deep learning models across Intel hardware (CPU, GPU, NPU) and select third-party targets (ARM, RISC-V). It provides a unified C++/Python API over a plugin architecture: the `intel_cpu` plugin handles CPU inference via a JIT code-generation backend, with separate plugins for GPU and NPU that are x86-only. The project is licensed Apache 2.0 and hosted at [openvinotoolkit/openvino](https://github.com/openvinotoolkit/openvino).

**Governance:** Intel-owned and Intel-controlled. The `openvinotoolkit` GitHub organization is an Intel entity. CODEOWNERS uses Intel-internal GitHub teams (`openvino-maintainers`, `openvino-ie-cpu-maintainers`). No external foundation (not LF AI, not Apache, not CNCF). No RISE Project involvement: OpenVINO is absent from the [RISE AI/ML WG project list](https://github.com/riseproject-dev/ai-ml-wg/blob/main/docs/projects.md), from all RISE blog posts, and from the RISE wheel builder registry.

**Corporate sponsors:** Intel Corporation exclusively. All top contributors are Intel employees: Ilya Lavrenov (1,155 commits), Ilya Churaev (660 commits), Roman Kazantsev (581 commits). The primary RISC-V developer is Alexandra Sidorova (Intel), with Arseniy Obolenskiy (Intel) leading 2025-2026 RISC-V infrastructure work.

**Community culture on new ports:** Welcoming but Intel-led. Intel has filed 34 "Good First Issue" tickets (#30227-#30260) specifically for RISC-V JIT emitter implementations, and external contributors have successfully merged individual op emitters. GSoC 2024 produced two merged RISC-V PRs. All architectural decisions and CI infrastructure remain Intel-controlled.

**RISC-V tier:** Experimental/community. RISC-V is not listed in the [official system requirements](https://docs.openvino.ai/2026/about-openvino/release-notes-openvino/system-requirements.html), which cover only x86, ARM, Intel GPU, and Intel NPU.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the main repository. No downstream fork or out-of-tree patch set exists.

| Date | Event | Source |
|---|---|---|
| 2022-11-08 | [PR #13897](https://github.com/openvinotoolkit/openvino/pull/13897): First RISC-V toolchain support (LLVM/Clang cross-compile, no JIT). Author: Ilya Lavrenov (Intel). | Merged, release 2022.3.0 |
| 2022-11-29 | [Issue #14321](https://github.com/openvinotoolkit/openvino/issues/14321): Community proposal by Vladimir Dudnik (Intel) to add RISC-V support, noting RVV 1.0 ratification. | Closed 2022-12-02 |
| 2023-09-27 | [PR #20064](https://github.com/openvinotoolkit/openvino/pull/20064): RISC-V Conan build in GHA precommit. | Merged, release 2023.2.0 |
| 2024-04-13 | [PR #24012](https://github.com/openvinotoolkit/openvino/pull/24012): RISCV64 Python wheel setup support. Author: Alexandra Sidorova (Intel). | Merged, release 2024.1.0 |
| 2024-07-10 | [PR #23901](https://github.com/openvinotoolkit/openvino/pull/23901): SHL (T-Head CSI-NN2) submodule + T-Head Xuantie toolchain. First vendor-accelerated executor. | Merged, release 2024.3.0 |
| 2024-08-13 | [PR #25951](https://github.com/openvinotoolkit/openvino/pull/25951): RVV 1.0 build support (GSoC, Zhiyuan Tan, external). | Merged, release 2024.4.0 |
| 2024-10-28 | [PR #27228](https://github.com/openvinotoolkit/openvino/pull/27228): GNU toolchain build path; fixed oneDNN intrinsic prefix issue with GCC. | Merged, release 2024.5.0 |
| 2024-12-20 | [PR #25673](https://github.com/openvinotoolkit/openvino/pull/25673): First CI pipeline for RISC-V CPU tests (QEMU-based). | Merged |
| 2025-03-06 | [PR #28727](https://github.com/openvinotoolkit/openvino/pull/28727): **Landmark** - xbyak_riscv JIT library integrated; `jit_generator` and `jit_uni_eltwise_generic` kernel with RVV 1.0; 10 initial JIT emitters (Add, Sub, Div, Mul, Clamp, Relu, PRelu, Exp, Sigmoid, PowerStatic). Author: Alexandra Sidorova (Intel). | Merged, release 2025.1.0 |
| 2025-04-21 | 34 "Good First Issue" tickets (#30227-#30260) created for individual JIT emitters. | GitHub issues |
| 2025-05 to 2025-11 | 20+ individual JIT emitters merged (Floor, Mod, Negative, Sqrt, logical ops, comparison ops, Mish, HSigmoid, HSwish, Elu, Erf, GeluErf, GeluTanh, Tanh, Round, SoftSign, SquaredDifference). Community contributors. | PRs #30420-#32722 |
| 2025-08-19 | [PR #31787](https://github.com/openvinotoolkit/openvino/pull/31787): **Landmark** - Snippets (kernel fusion) infrastructure enabled for RV64. | Merged, release 2026.0.0 |
| 2025-09-01 | [PR #31925](https://github.com/openvinotoolkit/openvino/pull/31925): TBB made default threading on RISC-V. | Merged |
| 2026-02-03 | [PR #33774](https://github.com/openvinotoolkit/openvino/pull/33774): SHL library removed; Xuantie toolchain removed from build (kept for QEMU testing only). Standardized on riscv-collab toolchain. | Merged, release 2026.1.0 |
| 2026-02-26 | [PR #34344](https://github.com/openvinotoolkit/openvino/pull/34344): Nightly CI run added for RISC-V. | Merged |
| 2026-02-26 | [PR #34372](https://github.com/openvinotoolkit/openvino/pull/34372): Snippets Transpose, Reduce, Softmax support for RV64. | Merged, release 2026.2.0 |
| 2026-03-21 | [PR #34835](https://github.com/openvinotoolkit/openvino/pull/34835): Zvfh (FP16 vector) extension detection and support. | Merged |
| 2026-05-16 | [PR #35952](https://github.com/openvinotoolkit/openvino/pull/35952): CI Docker switched from Xuantie to riscv-collab toolchain. | Merged |
| 2026-06-01 | [PR #36156](https://github.com/openvinotoolkit/openvino/pull/36156): Snippets load/store + convert fusion for RV64. | Merged |
| 2026-06-04 | [PR #36258](https://github.com/openvinotoolkit/openvino/pull/36258): Horizon emitter optimized with native RVV `vfredmax.vs`/`vfredosum.vs`. | Merged |
| 2026-07-09 | [PR #36785](https://github.com/openvinotoolkit/openvino/pull/36785): RegSpillBegin/End emitters for ABI calls in Snippets. | Merged |
| 2026-08-30 | [PR #37746](https://github.com/openvinotoolkit/openvino/pull/37746): BRGEMM support in Snippets for RV64 (OPEN). | Open |

**Key contributors:** Alexandra Sidorova (Intel) - primary architect of JIT backend; Arseniy Obolenskiy (Intel) - 2025-2026 infrastructure and Snippets; Ilya Lavrenov (Intel) - initial toolchain; Zhiyuan Tan (GSoC external) - RVV 1.0 build; 10+ community contributors for individual op emitters.

---

## 3. Upstream Support Tier

**No formal tier system.** OpenVINO does not publish a tiered platform support matrix. RISC-V is treated as experimental based on the following evidence:

- RISC-V is absent from the [official system requirements page](https://docs.openvino.ai/2026/about-openvino/release-notes-openvino/system-requirements.html).
- No riscv64 binary packages are published to any official channel (PyPI, storage.openvinotoolkit.org, GitHub releases).
- CI runs on QEMU emulation only; no native hardware CI exists.
- Build documentation exists at `docs/dev/build_riscv64.md` with validated hardware listed (Lichee Pi 4A, Banana Pi BPI-F3, Orange Pi RV2).

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in system requirements | Yes | Yes | No |
| Official binary packages | Yes (PyPI, storage) | Yes (PyPI, storage) | No |
| CI: builds | Yes | Yes | Yes (cross-compile) |
| CI: tests run | Yes (native) | Yes (native) | Yes (QEMU only) |
| CI: hardware | Native x86 | Native ARM | QEMU on x86 AKS |
| CI: schedule | Every PR + push | Every PR + push | Every PR + Wed/Sat nightly |
| Release-blocking | Yes | Yes | No |
| JIT backend | Xbyak (x86) | Xbyak_aarch64 | Xbyak_riscv |
| Vendor-optimized library | oneDNN + MLAS + ACL | oneDNN + ACL + KleidiAI | oneDNN (partial) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenVINO's CPU inference path uses a JIT code-generation backend built on architecture-specific assembler libraries. For RISC-V, the backend uses [xbyak_riscv](https://github.com/herumi/xbyak_riscv) (analogous to Xbyak for x86 and Xbyak_aarch64 for ARM). There are no raw `.S` assembly files and no raw RVV C intrinsics (`vfloat32m1_t` etc.) in the OpenVINO source - all vector code is emitted at runtime via JIT calls such as `h->vfadd_vv(dst, src1, src2)`.

### ISA Detection

Runtime ISA detection uses a SIGILL-probe approach: the code JIT-generates a small snippet containing the target instruction and executes it, catching `SIGILL` if the CPU does not support it. This is required because Linux does not expose RVV capability via a standard CPUID-equivalent on all kernels.

| ISA | Bit flag | Detection |
|---|---|---|
| G (IMAFD baseline) | `i_bit|m_bit|a_bit|f_bit|d_bit` | `CPU::getInstance().hasExtension()` |
| RVV 1.0 | `v_bit` | SIGILL-probe: JIT-generates `vsetivli` |
| Zvfh (FP16 vectors) | `zvfh_bit` | SIGILL-probe: JIT-generates `vfwcvt_f_f_v`/`vfncvt_f_f_w` |

ISA enum: `isa_undef`, `g`, `gv` (G + RVV 1.0), `gv_zvfh` (G + RVV 1.0 + Zvfh).

Not present: Zba, Zbb, Zbc, Zbs (bit-manipulation), Zfh (scalar FP16), xtheadvector (T-Head vendor), Zvbb/Zvbc (vector crypto).

### JIT Eltwise Kernel

The primary per-node JIT kernel is `jit_uni_eltwise_generic` in `src/plugins/intel_cpu/src/nodes/kernels/riscv64/`. It implements a vectorized main loop with scalar tail handling, multi-input support, and post-ops. The kernel is VLEN-agnostic: it uses `vsetvli`/`vsetivli` and works on any RVV-compliant hardware from 128-bit to 65536-bit VLEN.

**Known performance concern (from PR #28727 review):** Constants loading overhead is higher than on x86 because LMUL-aware constant sharing (storing broadcast constants in the data section as done on x86 and ARM) is not yet implemented. The reviewer (dmitry-gorokhov) flagged this as a planned experiment.

### JIT Emitter Coverage (~40 operations)

Implemented: Abs, Add, Ceil, Clamp, Divide, Elu, Equal, Erf, Exp, Floor, FloorMod, GeluErf, GeluTanh, Greater, GreaterEqual, HSigmoid, HSwish, IsFinite, IsInf, IsNaN, Less, LessEqual, LogicalAnd, LogicalNot, LogicalOr, LogicalXor, Maximum, Minimum, Mish, Mod, Multiply, Negative, NotEqual, Power, PRelu, Relu, Round, Select, Sigmoid, SoftSign, Sqrt, SquaredDifference, Subtract, Tanh, Xor.

Missing (scalar fallback): Swish/SiLU ([issue #30247](https://github.com/openvinotoolkit/openvino/issues/30247), [PR #35852](https://github.com/openvinotoolkit/openvino/pull/35852) open), SoftPlus ([issue #30244](https://github.com/openvinotoolkit/openvino/issues/30244), blocked on missing Log emitter).

### Snippets (Fused Kernel) Infrastructure

Enabled in [PR #31787](https://github.com/openvinotoolkit/openvino/pull/31787) (Aug 2025). Snippets is OpenVINO's tensor compiler that fuses multiple ops into a single JIT-compiled kernel. The RV64 Snippets backend includes: loop emitters, memory emitters (load/store with runtime offset), broadcast, fill/tail-mask, horizon reduction (native `vfredmax.vs`/`vfredosum.vs` since PR #36258), register spill/restore, binary call emitters, and a CPU generator that maps 40+ OV ops to riscv64 JIT emitters. Transpose, Reduce, and Softmax were added in [PR #34372](https://github.com/openvinotoolkit/openvino/pull/34372) (Feb 2026). Load/store + convert fusion was added in [PR #36156](https://github.com/openvinotoolkit/openvino/pull/36156) (Jun 2026).

### Convolution

No dedicated RISC-V convolution kernel exists. The `OV_CPU_INSTANCE_RISCV64` macro in `convolution_implementations.cpp` provides a dispatch stub, but execution falls back to generic (non-JIT) paths. This is a significant performance gap for CNN workloads.

### BRGEMM / Matrix Multiply

[PR #37746](https://github.com/openvinotoolkit/openvino/pull/37746) (open as of Aug 2026) integrates oneDNN RISC-V BRGEMM into Snippets, which would enable matrix-multiply acceleration. Until merged, MatMul uses oneDNN's existing RISC-V path (experimental tier in oneDNN).

### FP16

Zvfh (FP16 vector) is runtime-detected and supported in `jit_conversion_helpers.cpp` for f16 conversion paths. F16 transformation passes in `transformation_pipeline.cpp` are gated on `mayiuse(gv_zvfh)`. All f16 Snippets/Eltwise/MVN/Reduce tests are skipped on hardware without Zvfh.

### Component Comparison

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT assembler library | Xbyak | Xbyak_aarch64 | Xbyak_riscv |
| Eltwise JIT kernel | Yes, full | Yes, full | Yes, ~40 ops (2 missing) |
| Snippets fused kernels | Yes, full | Yes, full | Partial (no BRGEMM yet) |
| Convolution JIT | Yes (AVX-512, AMX) | Yes (ACL, SVE) | No (scalar fallback) |
| GEMM/BRGEMM | oneDNN + MLAS | oneDNN + ACL + KleidiAI | oneDNN only (experimental) |
| FP16 | Yes (AVX-512 FP16) | Yes (NEON FP16) | Yes (Zvfh, runtime-gated) |
| INT8 quantization JIT | Yes | Yes | No [NEEDS VERIFICATION] |
| Vendor library | MLAS (enabled) | ACL + KleidiAI (enabled) | None (MLAS/ACL disabled) |
| ISA extensions used | SSE4.2, AVX2, AVX-512, AMX | NEON, SVE, SVE2, dotprod | RVV 1.0, Zvfh |

---

## 5. Build System, Cross-Compilation, and Toolchain

### Host Requirements

- Host OS: Ubuntu 22.04 (64-bit), x86_64
- CMake >= 3.26 (CI pins `cmake==3.26.4` via pip)
- For RVV builds: `riscv-collab/riscv-gnu-toolchain` tag `2026.05.06` (CI-pinned)
- For non-RVV builds: `gcc-riscv64-linux-gnu` / `g++-riscv64-linux-gnu` from apt
- Ninja 1.13.0 (apt ships 1.10.1 which lacks `--quiet`)
- Python 3.10 (only version verified for cross-compilation on Ubuntu 22.04)

**Why riscv-gnu-toolchain specifically:** GCC from `riscv-collab/riscv-gnu-toolchain` supports RVV 1.0 intrinsics using the `__riscv_` prefix. Standard Clang/LLVM has overloaded functions that work without the prefix; GCC does not. This caused oneDNN's MaxPooling primitive to fail to compile with standard GCC until [PR #27228](https://github.com/openvinotoolkit/openvino/pull/27228) added a CMake detection check. Additionally, `riscv-gnu-toolchain` build breaks with gcc-15 on the host; gcc-14 is required [NEEDS VERIFICATION - from community contributor reports in Good First Issue threads].

### Standard CI Build Command (Option C - RVV 1.0, Ninja)

```sh
cmake -G "Ninja" \
  -DENABLE_INTEL_GPU=OFF \
  -DENABLE_INTEL_NPU=OFF \
  -DENABLE_SAMPLES=OFF \
  -DENABLE_NCC_STYLE=OFF \
  -DENABLE_PYTHON=OFF \
  -DENABLE_TESTS=ON \
  -DENABLE_STRICT_DEPENDENCIES=OFF \
  -DCMAKE_EXPORT_COMPILE_COMMANDS=ON \
  -DENABLE_WHEEL=OFF \
  -DCMAKE_COMPILE_WARNING_AS_ERROR=ON \
  -DCMAKE_TOOLCHAIN_FILE=${OPENVINO_REPO}/cmake/toolchains/riscv64.linux.toolchain.cmake \
  -DTHREADING=OMP \
  -S ${OPENVINO_REPO} \
  -B ${BUILD_DIR}
```

### Key Disabled Flags for riscv64

| Flag | Value | Reason |
|---|---|---|
| `ENABLE_INTEL_GPU` | OFF | GPU plugin not available on riscv64 |
| `ENABLE_INTEL_NPU` | OFF | NPU plugin not available on riscv64 |
| `ENABLE_MLAS_FOR_CPU` | OFF (auto) | Only enabled for x86_64 and AARCH64 |
| `ENABLE_TBBBIND_2_5` | OFF (auto) | Only ON for x86_64 Linux shared builds |
| `ENABLE_SYSTEM_FLATBUFFERS` | OFF (auto) | Disabled when `CMAKE_CROSSCOMPILING AND RISCV64` due to protobuf include path issue |
| `ENABLE_INTEL_OPENMP` | OFF (auto) | Intel OMP prebuilt only for x86_64 Win/Linux |

### QEMU Test Execution

```sh
${RISCV_TOOLCHAIN_ROOT}/bin/qemu-riscv64 \
  -cpu rv64,v=true,vext_spec=v1.0 \
  ${INSTALL_TEST_DIR}/ov_cpu_func_tests \
  --gtest_print_time=1 \
  --gtest_filter="*ActivationLayer*:*EltwiseLayer*:*LogicalLayer*:..."
```

The test Docker image builds QEMU from `riscv-collab/riscv-gnu-toolchain` tag `2026.05.06` (only the `qemu` submodule), configured with `--target-list=riscv64-linux-user`.

### Known Build Issues

- [Issue #23784](https://github.com/openvinotoolkit/openvino/issues/23784) (closed): Cross-compilation failures with oneDNN and FlatBuffers submodules for `rv64gcv` target. Resolved by subsequent PRs.
- [Issue #31525](https://github.com/openvinotoolkit/openvino/issues/31525) (closed): Native compilation on HiFive Unmatched (Arch Linux) failed with "unrecognizable insn" in oneDNN. Resolved Aug 2025.
- sccache is broken for RISC-V CI; GHA custom caching is used as a workaround (noted in PR #33774 review by mryzhov).
- `-latomic` must be linked explicitly for `std::atomic_bool` on riscv64; the `riscv64-gnu.toolchain.cmake` sets `CMAKE_C_STANDARD_LIBRARIES_INIT="-latomic"` to handle this.

### Validated Hardware

- Lichee Pi 4A (RVV 0.7.1)
- Banana Pi BPI-F3 (RVV 1.0)
- Orange Pi RV2 (RVV 1.0)

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps (operations that cannot execute with JIT acceleration)

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Eltwise ops (~40) | JIT | JIT | JIT | Functional parity |
| Swish/SiLU | JIT | JIT | Scalar fallback | PR #35852 open |
| SoftPlus | JIT | JIT | Scalar fallback | Blocked on Log emitter |
| Convolution | JIT (AVX-512, AMX) | JIT (ACL, SVE) | Scalar fallback | No RV64 conv kernel |
| BRGEMM / MatMul | JIT (oneDNN + MLAS) | JIT (oneDNN + ACL) | oneDNN experimental | PR #37746 open |
| Snippets fused kernels | Full | Full | Partial (no BRGEMM) | BRGEMM PR open |
| INT8 quantization | JIT | JIT | Unknown | Data not available: no INT8 JIT emitter found in riscv64 source paths |
| FP16 inference | JIT | JIT | JIT (Zvfh required) | Runtime-gated; hardware must support Zvfh |
| GPU inference | Yes | No | No | Intel GPU only |
| NPU inference | Yes | No | No | Intel NPU only |
| Python bindings | Yes | Yes | Build-only (ENABLE_PYTHON=OFF in CI) | Conan CI enables Python but no test |
| Official binary | Yes | Yes | No | Must build from source |

### Performance Gaps

- **Convolution:** No JIT convolution kernel on riscv64. All CNN inference falls back to scalar reference paths. This is the largest performance gap for vision models.
- **GEMM/BRGEMM:** MLAS is disabled for riscv64 (x86_64 and AARCH64 only). oneDNN BRGEMM for riscv64 is experimental. Until PR #37746 merges, transformer-class models (attention, FFN) lack optimized matrix multiply.
- **Constants loading:** LMUL-aware constant sharing not implemented for riscv64 JIT emitters. Higher per-iteration overhead than x86 or ARM (flagged in PR #28727 review by dmitry-gorokhov; no benchmark numbers published).
- **Swish/SiLU scalar fallback:** Affects all modern LLMs (LLaMA, Mistral, Gemma) that use SiLU as the activation function.

### Correctness / Floating-Point Semantics Gaps

- [Issue #35839](https://github.com/openvinotoolkit/openvino/issues/35839): NaN propagation violation for ONNX `Min` op. OpenVINO returns the finite operand instead of NaN when one input is NaN. Fix PR #35920 patches the riscv64 JIT emitter but is not yet merged.
- [Issue #37039](https://github.com/openvinotoolkit/openvino/issues/37039): LTX-Video produces all-black NaN outputs in fp16 due to T5 text encoder FFN layers overflowing fp16 range (>65504). Affects riscv64 CPU plugin when Zvfh is used.

### Disabled Tests on riscv64

From `skip_tests_config.cpp`:
- `StaticLoopDynamicSubgraphCPUTest` - object not initialized
- `smoke_InterpolateBilinearPillow_Layout_Test` - crash (double free)
- `smoke_InterpolateBicubicPillow_Layout_Test` - crash (double free)
- `CausalMaskPreprocess` - unsupported node type
- All f16 Snippets/Eltwise/MVN/Reduce tests - require Zvfh extension

---

## 7. CI/CD Infrastructure

### Upstream CI

**Workflow 1: [linux_riscv.yml](https://github.com/openvinotoolkit/openvino/blob/master/.github/workflows/linux_riscv.yml)**

- Name: "Linux RISC-V (Ubuntu 22.04, Python 3.10)"
- Triggers: schedule (Wed + Sat 00:00 UTC), pull_request (all PRs, no path filter), merge_group (riscv64 source paths), push to master/releases/**, workflow_dispatch
- All runners: x86_64 AKS (Azure Kubernetes Service). Zero native riscv64 hardware.
- Jobs: Smart_CI (ubuntu-latest) -> Docker (aks-linux-4-cores-16gb-docker-build) -> Build RVV 1.0 (aks-linux-16-cores-32gb, cross-compile) -> CPU_Functional_Tests (aks-linux-4-cores-16gb, QEMU) -> Overall_Status
- Test filter (CONCISE, used on PRs): `*ActivationLayer*:*EltwiseLayer*:*LogicalLayer*:*ComparisonLayer*:*SelectLayer*:*MatMulLayerCPUTest*:*ExtremumLayerCPUTest*:smoke_Snippets*`
- Test filter (NIGHTLY): above plus `smoke_CompareWithRefs*`

**Workflow 2: [linux_riscv_conan.yml](https://github.com/openvinotoolkit/openvino/blob/master/.github/workflows/linux_riscv_conan.yml)**

- Name: "Linux RISC-V with Conan (Ubuntu 22.04, Python 3.10)"
- Triggers: workflow_dispatch, pull_request, push to master/releases/**
- Jobs: Smart_CI -> Docker -> Build -> Overall_Status
- **Build-only. No test execution step.**
- Enables: `ENABLE_INTEL_GPU=ON`, `ENABLE_PYTHON=ON`, `ENABLE_WHEEL=ON`, `BUILD_SHARED_LIBS=OFF`

**Additional riscv64 CI jobs:**
- `clang_tidy.yml`: `Build-riscv64` job, triggered on CPU component changes, builds `openvino_intel_cpu_plugin` with riscv64 toolchain
- `code_style.yml`: `clang-format-riscv64` job, runs clang-format check with riscv64 toolchain

**RISE runners:** None. All CI runs on Intel/Microsoft Azure infrastructure.

### CI Comparison

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes, every PR | Yes, every PR | Yes, every PR |
| Test CI | Yes, every PR, native | Yes, every PR, native | Yes, every PR, QEMU only |
| Nightly schedule | Yes | Yes | Yes (Wed + Sat) |
| Hardware | Native x86 AKS | Native ARM AKS | x86 AKS + QEMU |
| Test scope | Full suite | Full suite | Narrow filter (activation, eltwise, logical, comparison, matmul, snippets) |
| Clang-tidy | Yes | Yes | Yes |
| Python wheel CI | Yes | Yes | Build-only (no test) |
| Release-blocking | Yes | Yes | No |

---

## 8. Distribution and Release Status

**No riscv64 binary packages are available from any official channel.**

| Channel | riscv64 Status | Notes |
|---|---|---|
| PyPI `openvino` | Absent | 866 wheels across 44 versions; platforms: manylinux x86_64, manylinux aarch64, macOS arm64, win_amd64 only |
| PyPI `openvino-runtime` | Package does not exist (HTTP 404) | Renamed to `openvino` in earlier releases |
| GitHub Releases | No binary assets at all | Releases 2026.1.0-2026.3.1 have zero attached binary assets; point to external storage |
| storage.openvinotoolkit.org | Absent | 33,922 files; zero riscv64 toolkit archives; only