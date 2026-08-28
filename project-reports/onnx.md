---
title: ONNX
parent: Project Reports
categories:
  - ai-ml
---

# ONNX

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for ONNX Runtime (microsoft/onnxruntime)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

**Repository:** [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)<br/>
**Homepage:** [onnxruntime.ai](https://onnxruntime.ai/)<br/>
**License:** MIT<br/>
**Governance:** Microsoft-controlled. No independent steering committee. New public APIs require Microsoft team review. Contribution proposals are evaluated against Microsoft's internal roadmap.<br/>
**Primary funding:** Microsoft (Windows, Office, Azure, Bing listed as internal users). The project lists NVIDIA, Intel, AMD, Hugging Face, Adobe, Oracle, and others as adopters, not financial sponsors. No formal sponsorship tier structure is publicly documented.<br/>
**ONNX spec vs. ONNX Runtime:** The ONNX format and schema (onnx/onnx) is hosted under Linux Foundation AI and Data. ONNX Runtime (microsoft/onnxruntime) is a separate, Microsoft-controlled inference engine that consumes ONNX models. This report covers ONNX Runtime unless otherwise stated.<br/>

ONNX Runtime is an inference engine that runs ONNX-format models. Its primary CPU execution path for edge and embedded targets goes through MLAS (Microsoft BLAS), an internal hand-optimized linear algebra library that lives in `onnxruntime/core/mlas/lib/`. MLAS contains architecture-specific SIMD kernels for x86 (assembly), aarch64 (assembly), and -- as of 2026 -- riscv64 (C++ RVV intrinsics). The XNNPACK execution provider is an optional alternative CPU backend. No GPU execution provider exists for riscv64.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port is community-driven, not Microsoft-initiated. Contributors are from SiFive, Andes Technology, Nuclei System Technology, ZTE Corporation, and SpacemiT (hardware test platform). Microsoft has acted as reviewer and gatekeeper; the maintainer hariharans29 has merged all 2026 RVV PRs.

| Date | Event | PR / Issue |
|---|---|---|
| Jun 2023 | Feature request for SHL execution provider (T-HEAD heterogeneous compute library) | [#16544](https://github.com/microsoft/onnxruntime/issues/16544) (open) |
| Sep 2023 | Pre-PR coordination thread, Andes Technology proposes basic RISC-V support | [#17466](https://github.com/microsoft/onnxruntime/issues/17466) (closed) |
| Oct 2023 | First RISC-V PR submitted: scalar MLAS for rv64imafdc, no vector extension | [#18115](https://github.com/microsoft/onnxruntime/pull/18115) (closed without merge Jul 2025) |
| Jan 25, 2024 | First RISC-V commit merged: riscv64 cross-compilation toolchain and `--rv64` build flag. Author: Phoebe Chen (SiFive). | [#19238](https://github.com/microsoft/onnxruntime/pull/19238) MERGED |
| Apr 5, 2024 | Cross-compilation documentation merged; documents ~6.8% test failure rate on QEMU | [#19239](https://github.com/microsoft/onnxruntime/pull/19239) MERGED |
| Mar 22, 2024 | Inference accuracy collapse reported: 15% vs 86% on LicheeRV Nano (C906, rv64imafdcv0p7xthead) | [#20030](https://github.com/microsoft/onnxruntime/issues/20030) (open, unresolved) |
| Jul 5, 2024 | SGEMM packing-width mismatch fix proposed | [#21261](https://github.com/microsoft/onnxruntime/pull/21261) (closed as stale Jul 2025) |
| Oct 22, 2024 | Incorrect inference results on riscv64 reported, root cause identified as SGEMM CopyPackB 4-wide vs 16-wide mismatch | [#22530](https://github.com/microsoft/onnxruntime/issues/22530) (closed May 2026) |
| Apr 30, 2025 | RVV support tracking issue filed, Nuclei System Technology | [#24596](https://github.com/microsoft/onnxruntime/issues/24596) (closed as stale Dec 2025) |
| Sep 28, 2025 | DeviceDiscoveryTest.HasCpuDevice fails on riscv64 / Alpine Linux musl | [#26187](https://github.com/microsoft/onnxruntime/issues/26187) (open) |
| Mar 25, 2026 | WASM scalar SGEMM packing fix merged; incidentally fixes riscv64 SGEMM correctness (issue #22530) | [#27819](https://github.com/microsoft/onnxruntime/pull/27819) MERGED |
| Apr 30, 2026 | First RVV-vectorized MLAS kernels: SGEMM (3.6x) and Softmax (3.0-3.2x). Author: velonica0 (SiFive). Closes #17466 and #24596. | [#28261](https://github.com/microsoft/onnxruntime/pull/28261) MERGED |
| Apr 30, 2026 | INT8 GEMM and FP32 GEMV early submission, immediately superseded | [#28287](https://github.com/microsoft/onnxruntime/pull/28287) (closed same day) |
| May 6, 2026 | MLAS_TARGET_RISCV64 macro proposal, closed because #28261 and #27819 already landed both goals | [#28110](https://github.com/microsoft/onnxruntime/pull/28110) (closed by author) |
| May 12, 2026 | RVV NCHWc convolution (pointwise: 30x, depthwise: 12x) and pooling (max: 20x) kernels | [#28411](https://github.com/microsoft/onnxruntime/pull/28411) MERGED |
| May 19, 2026 | NaN canonical form test fix for riscv64 (F extension mandates 0x7fc00000) | [#28538](https://github.com/microsoft/onnxruntime/pull/28538) MERGED |
| May 20, 2026 | Depthwise kernel compilation error fix (ZTE Corporation) | [#28506](https://github.com/microsoft/onnxruntime/pull/28506) MERGED |
| May 23, 2026 | RVV LLM operators: FP16 GEMM (up to 191x), FP16/FP32 Cast, RotaryEmbedding, RMSNorm. Qwen3-0.6B: 6.5 tok/s on K3. | [#28518](https://github.com/microsoft/onnxruntime/pull/28518) MERGED |
| May 24, 2026 | SGEMM optimization PR filed (ZTE), VLEN portability concerns raised by maintainer | [#28655](https://github.com/microsoft/onnxruntime/pull/28655) OPEN |
| Jun 9, 2026 | RVV INT8 GEMM/GEMV, M=1 routing, six activation kernels. bge-base INT8: 2.93x speedup. | [#28308](https://github.com/microsoft/onnxruntime/pull/28308) MERGED |

**Key observation:** The riscv64 port was dormant from January 2024 (cross-compile toolchain) to March 2026 (SGEMM correctness fix). In the 10 weeks from April 30, 2026 to June 9, 2026, five PRs adding substantial RVV kernel coverage merged. This is a recent, concentrated burst of activity from SiFive and affiliated contributors, not sustained long-term investment.

---

## 3. Upstream Support Tier

ONNX Runtime does not publish a formal named-tier policy (Tier 1/2/3) in public documentation. The compatibility matrix lists Windows, Linux (CentOS 7), macOS, Android (API 28), and iOS (12) as primary tested platforms. RISC-V appears only in the cross-compilation build guide, labeled as Linux/riscv64 requiring cross-compilation. There is no CI badge, no official test matrix entry, and no release artifact for riscv64.

**Effective tier (inferred):** Experimental / community-supported. Build infrastructure exists; RVV kernels are merging; no CI, no official binary, no Microsoft commitment to maintaining the port.

No single master tracking issue for the riscv64 port exists. No official milestone or project board tracks the riscv64 work.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 MLAS (Primary CPU Kernel Library)

MLAS is the dominant performance path for CPU inference in ONNX Runtime. It is an internal library at `onnxruntime/core/mlas/lib/`. The riscv64 subdirectory contains 11 RVV kernel files, all using C++ intrinsics from `<riscv_vector.h>` (no hand-written assembly).

| File | Lines (est.) | Purpose | ISA | Status |
|---|---|---|---|---|
| `sgemm_kernel_rvv.cpp` | ~200 | FP32 GEMM | RVV m4 | Complete |
| `sgemm_pack_b_rvv.cpp` | ~115 | GEMM B-panel packing | RVV m4 | Complete |
| `softmax_kernel_rvv.cpp` | ~250 | Softmax / log-softmax | RVV m1 | Complete |
| `qgemm_kernel_rvv.cpp` | ~350 | INT8 GEMM, 4 signedness variants, GEMV fast path | RVV u8m1/u16m2/u32m4 | Mostly complete (2-row tile missing, GEMV threshold pending profiling) |
| `activation_kernel_rvv.cpp` | ~200 | Erf, Tanh, Logistic, Exp, SiLU, GeluErf | RVV m4 | Complete |
| `sconv_depthwise_kernel_rvv.cpp` | ~200 | 3x3 stride-1 depthwise convolution | RVV m4 | Complete |
| `sconv_nchwc_kernel_rvv.cpp` | ~300 | NCHWc direct/depthwise/pointwise conv + max/avg pooling | RVV m4, VLEN>=128 assumed | Complete |
| `layernorm_kernel_rvv.cpp` | ~120 | LayerNorm and RMSNorm | RVV m4+m1 | Complete |
| `rotary_embedding_kernel_rvv.cpp` | ~100 | RoPE transformer positional embedding | RVV m4 | FP32 complete; FP16 path = nullptr (stub) |
| `halfgemm_kernel_rvv.cpp` | ~150 | FP16 GEMM | RVV + Zvfh | Complete (requires Zvfh extension) |
| `cast_kernel_rvv.cpp` | ~60 | FP16 <-> FP32 type conversion | Zvfhmin | Complete (requires Zvfh build gate) |

**RVV design:** All kernels use VLEN-agnostic `vsetvl` calls. Runtime dispatch queries `__riscv_vlenb()` at startup to set `NchwcBlockSize` (16 if VLEN>=128, 1 otherwise). The `ORT_MLAS_RISCV_FORCE_SCALAR` environment variable bypasses RVV dispatch.

**Dispatch infrastructure:** `platform.cpp` populates `MLAS_PLATFORM` under `#if defined(MLAS_TARGET_RISCV64)`. A `#define MLAS_TARGET_RISCV64` macro is set in `mlas.h` when `(__riscv && __riscv_xlen == 64)`. There is no dynamic CPUID-style dispatcher; the platform struct is populated once at startup.

**One known dispatch issue from review:** In PR #28261, Copilot flagged that RVV kernel declarations in `mlasi.h` were enabled whenever `MLAS_TARGET_RISCV64` was defined, even without `MLAS_USE_RVV`, potentially causing link errors on scalar-only riscv64 builds. Whether this was resolved before merge is not stated in the research data. [NEEDS VERIFICATION]

### 4.2 Execution Providers

- **CPU EP (via MLAS):** Fully wired for riscv64. All 11 RVV kernel files are dispatched through the CPU EP.
- **XNNPACK EP:** Build system supports `--use_xnnpack` with `--rv64`. XNNPACK itself has substantial riscv64 RVV kernel coverage (206 RVV files), but its CI is broken as of April 2026 (see Section 9).
- **No other EPs:** No CUDA, TensorRT, OpenVINO, CoreML, or DirectML EP for riscv64. The [SHL EP request](https://github.com/microsoft/onnxruntime/issues/16544) for T-HEAD heterogeneous compute (filed June 2023) remains open with no implementation activity.
- **No JIT backend:** No RISC-V JIT or code-generation backend exists in the ORT runtime itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Flags and Variables

Build system support landed in PR #19238 (merged January 2024, author: Phoebe Chen, SiFive). The following flags are defined in `tools/ci_build/build_args.py` and processed by `tools/ci_build/build.py`:

| Flag | CMake variable injected | Purpose |
|---|---|---|
| `--rv64` | `CMAKE_TOOLCHAIN_FILE=cmake/riscv64.toolchain.cmake`, `onnxruntime_CROSS_COMPILING=ON` | Enables riscv64 cross-compilation |
| `--riscv_toolchain_root <path>` | `RISCV_TOOLCHAIN_ROOT:PATH=<path>` | Path to riscv64-unknown-linux-gnu GCC toolchain |
| `--riscv_qemu_path <path>` | `RISCV_QEMU_PATH:PATH=<path>` | Optional QEMU user-mode emulator for cross-compile test runs |
| `--enable_rvv` | `onnxruntime_USE_RVV=ON` | Builds RVV MLAS kernels with `-march=rv64gcv -mabi=lp64d` |
| (cmake extra define) | `onnxruntime_USE_RVV_ZVFH=ON` | Adds Zvfh kernels with `-march=rv64gcv_zvfh -mabi=lp64d` |

### 5.2 Toolchain File

`cmake/riscv64.toolchain.cmake` (copyright SiFive, Inc. 2024 / Phoebe Chen, MIT License) hardcodes `riscv64-unknown-linux-gnu-gcc` / `g++`. When `RISCV_QEMU_PATH` is set, it configures `CMAKE_CROSSCOMPILING_EMULATOR` to allow CTest to transparently execute riscv64 ELF binaries under QEMU with `-L ${CMAKE_SYSROOT}`.

### 5.3 Typical Build Commands

Minimal cross-compile (no tests):
```
./build.sh --parallel --config Release --rv64 \
  --riscv_toolchain_root /path/to/riscv64-unknown-linux-gnu \
  --skip_tests
```

With RVV MLAS kernels:
```
./build.sh --parallel --config Release --rv64 \
  --riscv_toolchain_root /path/to/riscv64-unknown-linux-gnu \
  --enable_rvv --skip_tests
```

With tests via QEMU:
```
./build.sh --parallel --config Debug --rv64 \
  --riscv_toolchain_root /path/to/riscv64-unknown-linux-gnu \
  --riscv_qemu_path /path/to/qemu-riscv64
```

### 5.4 Requirements

| Requirement | Value |
|---|---|
| CMake | >= 3.28 |
| Host OS | Linux |
| GCC | >= 9 (GCC 8.x explicitly unsupported per docs) |
| Toolchain source | riscv-gnu-toolchain releases (`riscv64-glibc-ubuntu-22.04-llvm-nightly-*.tar.gz`) |
| Clang support | Not stated for riscv64 target; toolchain file hardcodes GCC |

### 5.5 Notable Build Gaps

- **No riscv64 Docker image.** `tools/ci_build/github/linux/docker/` contains only `aarch64/` and `x86_64/` subdirectories. No `riscv64/` directory, no `Dockerfile.riscv64`.
- **CF-protection hardening disabled.** `build.py` applies `-fcf-protection` only when not `--rv64`. This is correct (the flag is x86-specific), but it means the riscv64 build implicitly lacks control-flow integrity hardening. [NEEDS VERIFICATION on whether an equivalent riscv64 flag is applied]
- **`CMAKE_REQUIRED_FLAGS` overwrite.** Both PR #28261 and PR #28518 review comments noted that the MLAS build logic overwrites `CMAKE_REQUIRED_FLAGS` instead of save/restoring it, which can interfere with subsequent CMake feature checks. This was flagged by reviewers but not confirmed as fixed before merge in the research data.
- **`protoc` binary.** `protobuf` (a dependency) has no pre-built `protoc` binary for riscv64 in official releases. PRs [#23205 and #23206](https://github.com/protocolbuffers/protobuf) to add protoc riscv64 prebuilts were abandoned mid-2025. Cross-compilation toolchains must build `protoc` from source.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 MLAS Kernel Coverage Comparison

| Operation | amd64 | aarch64 | riscv64 | Notes |
|---|---|---|---|---|
| FP32 SGEMM | Hand-asm (SSE2/AVX/AVX-512 tiers) | Hand-asm (NEON) | RVV intrinsics | Covered |
| FP32 SGEMM pack-B | Hand-asm | Hand-asm | RVV intrinsics | Covered |
| FP32 SGEMV (M=1) | Dedicated kernel | NEON | Via M=1 routing added in PR #28308 | Covered |
| INT8 GEMM (4 signedness variants) | Hand-asm + VNNI | NEON Dot-product/Sdot/Smmla | RVV widening MAC | Covered (2-row tile missing, minor) |
| FP16 GEMM | AVX-512 FP16 / AMX | KleidiAI / NEON | RVV Zvfh | Covered (Zvfh required) |
| FP16 <-> FP32 cast | AVX-512 | NEON | RVV Zvfhmin | Covered (Zvfh required) |
| Softmax | AVX2/AVX-512 | NEON | RVV | Covered |
| Activation kernels (Erf, Tanh, Logistic, Exp, SiLU, GeluErf) | x86 SIMD | NEON | RVV | Covered |
| LayerNorm / RMSNorm | x86 SIMD | NEON | RVV | Covered |
| Rotary Embedding (FP32) | x86 SIMD | NEON | RVV | Covered |
| Rotary Embedding (FP16) | x86 SIMD | NEON | **nullptr (stub)** | Gap: FP16 RoPE not implemented |
| NCHWc convolution (pointwise, depthwise) | x86 SIMD | NEON | RVV | Covered |
| Max/Avg pooling | x86 SIMD | NEON | RVV | Covered |
| BF16 GEMM | AVX-512 BF16 / AMX | NEON / SME | **Not present** | Gap: no BF16 kernels |
| KleidiAI integration | N/A | Yes (ARM micro-kernel library) | **N/A** | Not applicable to riscv64 |

### 6.2 Execution Provider Coverage

| EP | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CPU (MLAS) | Full | Full | Substantial (11 kernel files, some gaps above) |
| XNNPACK | Supported | Supported | Build-system supported; runtime broken (see Section 9) |
| CUDA / TensorRT / ROCm | Supported | Partial | Not supported |
| CoreML / DirectML / OpenVINO | Supported | Partial | Not supported |
| SHL (T-HEAD heterogeneous) | N/A | N/A | Issue open, no implementation |

### 6.3 Quantitative Architecture Comparison

The amd64 MLAS directory contains approximately 50 files of hand-written x86 assembly with SSE2/AVX/AVX-512 tiers. The aarch64 MLAS directory contains approximately 30 files of hand-written ARM assembly with NEON/Sdot/Smmla/Ummla tiers. The riscv64 directory contains 11 files of C++ RVV intrinsics. The riscv64 port covers the critical inference operators but has a shallower optimization depth (fewer tile variants, no assembly-level optimization, no multi-VLEN specialization beyond the VLEN=128 threshold check for NchwcBlockSize).

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in microsoft/onnxruntime.**

This was confirmed by reading all 46 (or 47) GitHub Actions workflow files under `.github/workflows/`. None of the workflow files contain any reference to "riscv", "riscv64", or "rv64". There is no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` in the repository.

**Architectures in active CI:**
- x64 Linux (Debug + Release)
- arm64 Linux (Debug + Release)
- Android arm64-v8a (NNAPI)
- x64/arm64 Windows
- macOS
- iOS
- WASM (via `linux-wasm-ci-build-and-test-workflow.yml`)

**What the build system supports but CI does not exercise:**
- `cmake/riscv64.toolchain.cmake` cross-compilation toolchain
- `--rv64`, `--riscv_toolchain_root`, `--riscv_qemu_path`, `--enable_rvv` flags in `build_args.py`
- QEMU-based cross-compile testing (configured in the toolchain file via `CMAKE_CROSSCOMPILING_EMULATOR`)

**Implication:** Every merged RISC-V PR -- including the 5 RVV kernel PRs from April-June 2026 -- was merged without any automated build verification or test execution on riscv64 within the ORT CI pipeline. Review and benchmarking were done by the contributors on physical SpacemiT K3 hardware or QEMU locally. Regression testing is entirely manual.

PR #19239 (documentation companion to the initial cross-compile PR) explicitly documented approximately 6.8% test failure rate when running under QEMU. No subsequent PR has reported an updated failure rate or addressed those failures. [NEEDS VERIFICATION on whether the QEMU test failure rate has improved with the correctness fix in PR #27819]

---

## 8. Distribution and Release Status

### 8.1 Official Upstream Binaries (Microsoft)

**No riscv64 binary exists in any official Microsoft release.**

- **GitHub Releases (v1.27.0, latest as of research):** 11 assets. Architectures: aarch64, x64 (Linux), arm64/arm64x/x64 (Windows), arm64 (macOS). No riscv64 asset. Release notes mention RVV code, but no riscv64 binary is shipped.
- **PyPI -- onnxruntime:** 24 wheel filenames enumerated from the PyPI JSON API. Architecture tags: aarch64, x86_64, arm64 (macOS), win_amd64, win_arm64. No riscv64 wheel.
- **PyPI -- onnx (schema/IR library, not Runtime):** 24 wheel filenames enumerated. Architecture tags: x86_64, aarch64, win32, win_amd64, win_arm64, universal2 (macOS), wasm32. No riscv64 wheel.

### 8.2 Third-Party / Distribution Packages

| Source | Package | riscv64 Status | Version | Notes |
|---|---|---|---|---|
| Debian sid (buildd) | onnxruntime | YES -- Installed | 1.23.2+dfsg-6+b3 | Debian-packaged, built from source. "+dfsg" = stripped. Predates all RVV merges. |
| Debian sid (buildd) | onnx (schema) | YES -- Installed | 1.20.0-5 | Built on rv-manda-03 |
| RISE wheel builder (GitLab project 56254198) | onnx (schema only, NOT Runtime) | YES | 1.21.0 | manylinux_2_39_riscv64, requires RISC-V-specific patches per release. Maintained by RISE (Rivos, BayLibre). |
| PyPI official | onnx | NO | 1.22.0 (latest) | No riscv64 wheel |
| Ubuntu 24.04 | onnx packages | N/A | 1.14.1-2.1build2 | Ubuntu 24.04 does not support riscv64 as a release architecture |

**Distinction:** The RISE wheel builder provides riscv64 wheels for `onnx` (the schema and IR library) only, not for `onnxruntime` (the inference engine). These are different packages with different purposes.

**Debian onnxruntime package note:** Version 1.23.2+dfsg is 4 releases behind upstream (v1.27.0) and predates the SGEMM correctness fix (PR #27819, March 2026) and all RVV acceleration PRs (April-June 2026). Anyone relying on the Debian package for riscv64 gets a build without any of the recently merged RVV kernels and possibly with incorrect SGEMM outputs.

---

## 9. Dependencies

### 9.1 MLAS (Internal)

MLAS is not an external dependency; it is internal to onnxruntime. The riscv64 RVV kernels are now present (11 files). See Section 4.1 for detail.

### 9.2 External Critical Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| **XNNPACK** | CPU neural-network inference backend (alternative to MLAS for XNNPACK EP) | Builds. Dedicated `cmake-linux-riscv64` CI job exists in XNNPACK upstream. | **BROKEN:** 100+ RVV test targets failing ([#9886](https://github.com/google/XNNPACK/issues/9886), open Apr 2026). Operator tests excluded from CI (`--label-exclude operator`). Root cause: FP16 kernels enabled unconditionally without runtime Zvfh detection. | No releases (zero tags). Debian: `0.0~git20241108` (debports, 18 months stale). | [#9886](https://github.com/google/XNNPACK/issues/9886): broken Zvfh detection causes FP16 failures. Root cause is `pytorch/cpuinfo` missing `cpuinfo_has_riscv_zvfh()`. **Critical for XNNPACK EP.** |
| **cpuinfo** | CPU feature detection (ISA extension probing for XNNPACK and MLAS dispatch) | Builds on Linux riscv64. CI via QEMU. | CI via QEMU (PR #288 to upgrade to Ubuntu 24.04 was abandoned without merge). No native hardware CI. | Not a separately released artifact; FetchContent only. | `cpuinfo_has_riscv_zvfh()` function missing -- direct root cause of XNNPACK #9886. |
| **protobuf** | Model serialization (ONNX `.pb` files); generates C++ stubs | Builds as of v21.12 | No dedicated riscv64 CI known at v21.12 | No pre-built `protoc` binary for riscv64 in official releases. PRs #23205/#23206 abandoned mid-2025. | Missing `protoc` forces build-from-source in cross-compilation workflows. Medium severity. |
| **Eigen** | Dense linear algebra (pre/post-processing, optimizer math) | Header-only, architecture-independent | Not applicable | `libeigen3-dev` available as arch-independent Debian package | No riscv64 vectorization in Eigen for ORT's usage. Scalar fallback. Not a correctness blocker; performance could improve with RVV Eigen but ORT does not use Eigen for hot inference paths. |
| **Abseil-cpp** | C++ utilities (containers, hashing, CRC, synchronization) | Builds on riscv64 | No dedicated riscv64 CI | Available in Debian/Ubuntu | [#1986](https://github.com/abseil/abseil-cpp/issues/1986): CRC32C hardware acceleration missing for RISC-V (software fallback works; performance gap only). Not a correctness blocker. |
| **mimalloc** | High-performance memory allocator | Builds on riscv64. SV39 MMU alignment issue (#939) resolved Dec 2024. | No dedicated riscv64 CI known | Available via vcpkg and some Linux distros | [#1299](https://github.com/microsoft/mimalloc/issues/1299) / [#1296](https://github.com/microsoft/mimalloc/issues/1296): Two competing open PRs for runtime VA space detection via `hwprobe` (SV57 vs SV39). Not merged as of data collection. Correctness fine; potential performance degradation on non-default page table configurations. |
| **pthreadpool** | Thread pool for XNNPACK parallel dispatch | Architecture-agnostic C. Builds on any target. | No riscv64 issues filed. | FetchContent only. | None. |
| **FlatBuffers** | ORT internal model format serialization | Builds on riscv64. | No riscv64 test failures reported. | Available in Debian/Ubuntu. | None. Used at model load time, not inference. |
| **pybind11** | Python bindings for onnxruntime Python package | Header-only, no arch-specific code. | No riscv64 issues filed. | Available as Debian package. | None. |
| **re2** | Regular expression engine (graph pattern matching) | Builds on riscv64. | No riscv64 test concerns found. | Available in Debian/Ubuntu. | None. |
| **onnx schema** (onnx/onnx) | ONNX schema and protobuf definitions | Builds on riscv64. | No riscv64 test concerns found. | Available as Python package (pure Python/protobuf). Depends on protobuf (see above). | Inherits protoc build concern from protobuf. |

### 9.3 Dependency Blocking Summary

| Dependency | Blocks riscv64 ORT? | Severity |
|---|---|---|
| XNNPACK (#9886: Zvfh detection broken) | Yes -- FP16 inference via XNNPACK EP produces wrong results or crashes on QEMU | Critical (for XNNPACK EP) |
| cpuinfo (missing `cpuinfo_has_riscv_zvfh()`) | Yes -- root cause of XNNPACK #9886 | Critical (for XNNPACK EP) |
| protobuf (no protoc riscv64 prebuilt) | Partial -- blocks native cross-compilation workflows; workaround is build-from-source | Medium |
| mimalloc (#1299/#1296 open) | No -- correctness fine | Low |
| abseil-cpp (#1986 CRC32C) | No -- software fallback present | Low |
| MLAS (internal, 11 RVV kernel files) | Not a blocker -- kernels are present and actively developed | None |
| Eigen, pthreadpool, FlatBuffers, re2, pybind11, onnx schema | No | None |

---

## 10. Ecosystem Status

### 10.1 RISE Project

RISE (RISC-V Software Ecosystem) is the Linux Foundation project coordinating riscv64 software enablement. Premier members include: Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), and Tenstorrent. General members include SpacemiT and ZTE -- both of whom have contributed to the ORT riscv64 port.

RISE has an AI/ML Working Group (lead: Leye Wang, Peking University / BOSC) focused on "optimizing open-source AI software for RISC-V architectures."

**RISE involvement with ONNX Runtime:** No direct RISE project funding for ONNX Runtime was found. No RISE blog post mentions ONNX Runtime by name (27 blog posts scanned; search at riseproject.dev returned no ONNX results). The RISE wheel builder provides riscv64 wheels for `onnx` (the schema library) -- not for `onnxruntime` -- and requires RISC-V-specific patches for each release.

**SiFive** is both a RISE Premier member and the company that contributed the initial riscv64 cross-compile support (Phoebe Chen, PR #19238) and the first RVV kernels (velonica0, PR #28261 and #28518). The connection between RISE membership and ORT contributions appears to be personnel overlap rather than a funded work item.

### 10.2 Hardware

All published ORT riscv64 benchmarks were run on **SpacemiT K3 (X60/X100 CPU, VLEN=256, RVA22 profile)**. SpacemiT is a RISE General Member. No benchmarks from other riscv64 hardware platforms (SiFive HiFive, Sophgo SG2044, StarFive JH7110, etc.) appear in the merged PR data, though PR #28655 (open) reports data from an SG2044.

The C906 accuracy regression ([#20030](https://github.com/microsoft/onnxruntime/issues/20030)) involves a different platform with a non-standard ISA encoding (`rv64imafdcv0p7xthead`), which is T-HEAD's pre-ratification RVV variant -- not compatible with ratified RVV 1.0 kernels.

### 10.3 Community Contribution Pattern

Contributors active in 2026 ORT riscv64 work:
- **velonica0** (SiFive): PRs #28261, #28411, #28518
- **qiurui144**: PRs #28287, #28308, #28538
- **zejianzhang1982** (ZTE Corporation): PRs #28506, #28655
- **hariharans29** (Microsoft): reviewer and merger for all 2026 riscv64 PRs

The ORT CONTRIBUTING.md requires feature requests to use the feature request template for alignment before coding. Non-trivial features are evaluated against the ORT roadmap. All the riscv64 RVV PRs followed this path and were accepted. The pattern suggests openness to well-scoped, self-maintained MLAS kernel additions, but no Microsoft commitment to own the platform long-term.

---

## 11. Known Bugs and Active Issues

### 11.1 Unresolved Correctness Bugs

**[#20030](https://github.com/microsoft/onnxruntime/issues/20030) -- Inference accuracy collapse on LicheeRV Nano (C906)**
- Status: Open (filed March 22, 2024), "contributions welcome", no fix posted
- Hardware: LicheeRV Nano (Allwinner D1, C906, `rv64imafdcv0p7xthead` -- non-standard RVV variant)
- Symptom: 3-layer CNN accuracy 15.23% (riscv64) vs 86.09% (x86). Compiler flags: `-mcpu=c906fdv -march=rv64imafdcv0p7xthead -mcmodel=medany -mabi=lp64d`.
- Root cause: Unidentified. The C906 uses T-HEAD's pre-ratification RVV 0.7.1 variant (`v0p7xthead`), which is incompatible with ratified RVV 1.0 intrinsics used in the ORT kernels.
- Risk assessment: This issue predates all the RVV kernel work. The v0p7xthead ISA is not RVV 1.0 compliant; attempting to run RVV 1.0 code on C906 hardware is a configuration error. The bug is real but the affected hardware (Allwinner D1, StarFive JH7110 -- both using the C906) falls outside the target ISA for the current kernel set.

**NaN canonical form mismatch (PR [#18115](https://github.com/microsoft/onnxruntime/pull/18115), closed without merge)**
- The RISC-V F extension (ch. 11.3) canonicalizes all NaN results to `0x7fc00000`, discarding payload bits. IEEE 754-2019 retains NaN payload bits through arithmetic operations. This causes MLAS activation test failures on riscv64.
- The symptom was addressed for the merged activation kernels via PR #28538 (relaxing test NaN comparison to accept any NaN rather than bit-exact match). However, the underlying behavioral difference between riscv64 and other platforms is inherent to the ISA and is not eliminated -- it is worked around at the test level.

**SGEMM packing-width mismatch (issue [#22530](https://github.com/microsoft/onnxruntime/issues/22530), closed May 2026)**
- Root cause: `CopyPackB` packed 4-wide but `TransposePackB` consumed 16-wide (WASM scalar path inheritance). Fixed by PR #27819 (March 2026), a WASM scalar fix that incidentally resolved the riscv64 case.
- The fix was not a riscv64-targeted patch. Riscv64 correctness was a side effect of fixing a WASM bug. This is relevant because it implies riscv64 was not a first-class test target -- the bug existed from January 2024 (PR #19238) to March 2026 without a dedicated fix.

### 11.2 Open Infrastructure Bugs

**[#26187](https://github.com/microsoft/onnxruntime/issues/26187) -- DeviceDiscoveryTest.HasCpuDevice fails on riscv64 / Alpine Linux**
- Status: Open (filed September 28, 2025), assigned to edgchen1, no fix posted
- Affects: onnxruntime v1.23.0 on Alpine Linux (musl libc), GCC 15.2.0
- Confirmed on riscv64, aarch64, ppc64le, loongarch64
- Impact: Blocks Alpine Linux packaging of ORT v1.23.0 and later

### 11.3 Open PRs with Known Issues

**PR [#28655](https://github.com/microsoft/onnxruntime/pull/28655) -- SGEMM kernel optimization (open, ZTE Corporation)**
- VLEN portability regression: proposes replacing VLEN-agnostic `vfloat32m4_t` kernel with `vfloat32m1_t` hardcoded to 4-wide blocks. On VLEN>=256 hardware (the SpacemiT K3 used for all ORT riscv64 benchmarks), leaves 3/4 of vector register width idle.
- Independent benchmark by velonica0 on K3 hardware: ~0.9% improvement (within noise), contradicting the author's claimed 15% on SG2044 (VLEN=128).
- Potential underflow bug: reviewer hariharans29 flagged that `k_shift` computation could wrap around if `CountK == 0`.
- 3-row and 4-row tile paths dropped, reducing coverage.
- Status: awaiting author response; no maintainer approval.

---

## 12. Objections and Upstream Blockers

**Objection 1: "The XNNPACK EP is broken on riscv64, so ORT cannot use accelerated inference via that path."**
- Valid. The XNNPACK upstream CI has 100+ failing riscv64 tests (issue #9886) due to unconditional FP16 kernel activation without runtime Zvfh detection. The root cause (missing `cpuinfo_has_riscv_zvfh()` in `pytorch/cpuinfo`) has not been fixed as of the research data. Using `--use_xnnpack` on riscv64 will produce incorrect results for FP16 model paths or crash under QEMU.
- Mitigation: MLAS (the default CPU EP) is not affected. All 11 RVV kernel files in MLAS are independent of XNNPACK.

**Objection 2: "There is no CI, so regressions will go undetected."**
- Valid. There is no automated riscv64 build or test in ORT CI. Contributors do manual testing on K3 hardware or QEMU. Regressions in non-riscv64 code paths (e.g., a WASM fix incidentally breaking riscv64, as with issue #22530 in reverse) could go undetected for months.
- Mitigation: Adding a QEMU-based CI job is a relatively bounded engineering task. QEMU riscv64 CI is already in use upstream for cpuinfo, oneDNN, and other projects.

**Objection 3: "No official binary exists for riscv64, so deployment requires building from source."**
- Valid. No upstream Microsoft binary (PyPI wheel, GitHub Release tarball) exists for riscv64. The Debian package (v1.23.2) predates all RVV acceleration. Any deployment on riscv64 today requires a cross-compile from source using the toolchain from PR #19238.
- Mitigation: Publishing a PyPI wheel requires CI (objection 2) and a release engineering decision from Microsoft.

**Objection 4: "The Debian riscv64 package provides RVV-accelerated ORT."**
- Invalid. The Debian package is version 1.23.2+dfsg. All RVV kernels merged April-June 2026 (PRs #28261, #28308, #28411, #28518). The Debian package does not contain any RVV acceleration.

**Objection 5: "RISC-V support is at parity with arm64."**
- Invalid. The aarch64 MLAS directory contains approximately 30 files of hand-written assembly with multiple NEON/Sdot/Smmla/Ummla tiers plus KleidiAI integration. The riscv64 directory contains 11 C++ intrinsic files with no assembly and no multi-VLEN specialization beyond a single VLEN threshold check. aarch64 has full CI coverage; riscv64 has none. aarch64 has official Microsoft binary releases; riscv64 has none.

**Objection 6: "The port is stable because multiple PRs have been merged."**
- Partially valid. The recent burst of merges (5 PRs in 10 weeks) demonstrates active development. However, correctness issue #20030 remains open, the DeviceDiscovery test failure (#26187) blocks Alpine Linux packaging, and the SGEMM was broken for two years (January 2024 to March 2026) before it was incidentally fixed by a WASM patch. The track record indicates that riscv64 correctness issues are not caught quickly without CI.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The basic functional path -- cross-compiling ORT for riscv64, loading an ONNX model, running FP32 inference through the CPU EP with RVV MLAS kernels -- works as of June 2026, provided the build uses the merged RVV kernels (post-PR #28261) and not the Debian package. The following functional gaps remain:

| Gap | Severity | Upstream Status |
|---|---|---|
| FP16 RotaryEmbedding (RoPE) -- stub (nullptr) | Medium -- affects LLM inference with FP16 inputs | No PR filed |
| BF16 GEMM | Medium -- increasingly common in quantized LLM workflows | No activity |
| XNNPACK EP broken for FP16 (dependency: cpuinfo missing Zvfh detection) | High -- renders XNNPACK EP unsafe to use | Open: XNNPACK #9886, cpuinfo missing function |
| SHL EP (T-HEAD hardware) | Low -- niche hardware, single open issue with no implementation | Issue #16544, open since June 2023 |
| DeviceDiscoveryTest.HasCpuDevice failure on Alpine Linux / musl | Medium -- blocks packaging | Issue #26187, open since September 2025 |
| Inference correctness on T-HEAD C906 (`v0p7xthead`) | Medium -- affects deployed Allwinner D1 / StarFive JH7110 hardware | Issue #20030, open since March 2024, unresolved |

### 13.2 Performance Optimization

Benchmark data (all from SpacemiT K3, VLEN=256, comparing RVV to scalar MLAS fallback):

| Kernel | Speedup vs scalar | Source PR |
|---|---|---|
| FP32 SGEMM (compute-only) | 3.3x - 3.6x | #28261 |
| FP32 Softmax | 3.0x - 3.2x | #28261 |
| Depthwise NCHWc Conv | 10.8x - 12.5x | #28411 |
| Pointwise NCHWc Conv | 29.4x - 30.4x | #28411 |
| Max Pooling | 12.5x - 20.0x | #28411 |
| INT8 GEMV (K=N=384, 1 thread) | 7.1x vs compiler autovec | #28308 |
| INT8 end-to-end bge-base-zh-v1.5 | 2.93x | #28308 |
| FP16 GEMM (32x768x768) | 187.9x | #28518 |
| FP16/FP32 Cast | 4.8x - 11.3x | #28518 |
| RotaryEmbedding (dim=256, non-interleaved) | 13.0x | #28518 |
| RMSNorm (hidden=4096) | 6.6x | #28518 |
| Qwen3-0.6B token generation (end-to-end, K3) | 6.5 tok/s (FP32) | #28518 |

**No riscv64 vs arm64 or riscv64 vs x86 cross-architecture benchmarks were found in the research data.** All published data is within-platform (riscv64 scalar vs RVV). Data not available: cross-architecture comparison of ORT riscv64 vs ORT aarch64 on equivalent hardware.

**Performance gaps remaining:**
- FP32 SGEMM: the open PR #28655 claims 15% further improvement but is under review for VLEN portability concerns and shows only 0.9% on K3 hardware. No additional merged optimization work is in progress.
- INT8 GEMV memory-bound regression at large sizes (K=N=4096: 0.82x vs autovec) per #28308 benchmark data.
- FP16 paths require Zvfh (ratified RISC-V extension for half-precision vector). Hardware support varies; K3 supports it, but many deployed riscv64 boards do not.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to ORT requires the following components:

1. A riscv64 QEMU-based Docker image (analogous to existing `aarch64/` Docker directory). No such image exists.
2. A GitHub Actions workflow triggering the riscv64 cross-compile + QEMU test run.
3. A decision on which tests to run (the 6.8% failure rate documented in PR #19239 is a ceiling; the correctness fixes since then may have reduced it, but the current failure rate is unknown).
4. Optionally: native hardware CI using RISE's free riscv64 CI runners (mentioned in the RISE blog "RISE RISC-V Runners: six weeks in", May 2026, which lists llama.cpp and PyTorch as users).

Without CI, every MLAS kernel addition is merged without automated regression verification. The two-year window during which SGEMM produced incorrect results (January 2024 to March 2026) is the concrete cost of this gap.

### 13.4 Ecosystem Enablement

**PyPI wheel:** Publishing an official `onnxruntime` wheel to PyPI for riscv64 is gated on (a) CI that produces and validates the wheel, and (b) a Microsoft release engineering decision. The RISE wheel builder currently covers `onnx` (schema library) but not `onnxruntime`. Filling this gap would make ORT accessible to Python-based ML workflows on riscv64 without a source build.

**Debian package currency:** The current Debian sid package (v1.23.2) is 4 releases behind and has none of the RVV acceleration. Upstreaming a Debian package update to v1.27.0 is a Debian maintainer task, not an ORT task, but RVV acceleration will be absent from the Debian ecosystem until this is updated.

**cpuinfo fix:** Upstreaming `cpuinfo_has_riscv_zvfh()` to `pytorch/cpuinfo` unblocks the XNNPACK EP for Zvfh-capable hardware. This is a targeted, bounded contribution that resolves a chain of issues (#9886 in XNNPACK, and downstream FP16 inference correctness in any ORT build using `--use_xnnpack`).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix FP16 RotaryEmbedding (currently nullptr stub) | 1-2 | MLAS contributor | High |
| Functional | Add BF16 GEMM kernel | 3-5 | MLAS contributor | Medium |
| Functional | Fix DeviceDiscoveryTest.HasCpuDevice on musl libc (issue #26187) | 1-2 | Microsoft (assigned to edgchen1) or contributor | Medium |
| Functional | Add `cpuinfo_has_riscv_zvfh()` to pytorch/cpuinfo (unblocks XNNPACK #9886) | 1 | cpuinfo contributor / RISE AI-ML WG | High |
| Performance | Resolve PR #28655 (SGEMM VLEN portability + missing tile paths) | 2-3 | zejianzhang1982 (ZTE) + hariharans29 review | Medium |
| Performance | INT8 GEMV memory-bound regression at large sizes | 2-4 | MLAS contributor | Low |
| CI/CD | Add riscv64 Docker image for cross-compile builds | 1 | Microsoft or contributor | Critical |
| CI/CD | Add riscv64 QEMU-based GitHub Actions workflow | 1-2 | Microsoft or contributor | Critical |
| CI/CD | Investigate and reduce 6.8% QEMU test failure rate (documented in PR #19239) | 2-4 | Contributor | High |
| Ecosystem | Publish official riscv64 onnxruntime PyPI wheel | 2-4 (plus Microsoft release infra decision) | Microsoft | High |
| Ecosystem | Update Debian onnxruntime package to v1.27.0 | 0.5 (Debian maintainer task) | Debian maintainer | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [microsoft/onnxruntime -- main repository](https://github.com/microsoft/onnxruntime)
- [PR #19238 -- Enable RISC-V 64-bit Cross-Compiling Support](https://github.com/microsoft/onnxruntime/pull/19238)
- [PR #19239 -- Cross-Compilation Documentation for RISC-V](https://github.com/microsoft/onnxruntime/pull/19239)
- [PR #18115 -- Basic RISC-V Support (closed)](https://github.com/microsoft/onnxruntime/pull/18115)
- [PR #21261 -- Scalar MlasSgemm CopyPackB for RISCV (closed)](https://github.com/microsoft/onnxruntime/pull/21261)
- [PR #27819 -- fix non-SIMD sgemm implementation](https://github.com/microsoft/onnxruntime/pull/27819)
- [PR #28110 -- Add MLAS_TARGET_RISCV64 macro (closed)](https://github.com/microsoft/onnxruntime/pull/28110)
- [PR #28261 -- Add RISC-V Vector (RVV) support for CPU Execution Provider](https://github.com/microsoft/onnxruntime/pull/28261)
- [PR #28287 -- RVV INT8 GEMM and GEMV kernels (closed)](https://github.com/microsoft/onnxruntime/pull/28287)
- [PR #28308 -- RVV INT8 GEMM/GEMV, M=1 routing, and activation kernels](https://github.com/microsoft/onnxruntime/pull/28308)
- [PR #28411 -- RVV convolution and pooling kernels](https://github.com/microsoft/onnxruntime/pull/28411)
- [PR #28506 -- Correcting compilation errors in riscv64 depthwise kernel](https://github.com/microsoft/onnxruntime/pull/28506)
- [PR #28518 -- RVV-Optimized LLM Operators for RISC-V](https://github.com/microsoft/onnxruntime/pull/28518)
- [PR #28538 -- accept canonical NaN in activation NaN round-trip check](https://github.com/microsoft/onnxruntime/pull/28538)
- [PR #28655 -- Optimize RISC-V RVV SGEMM kernel performance (open)](https://github.com/microsoft/onnxruntime/pull/28655)
- [Issue #16544 -- Add SHL Execution Provider for RISC-V (open)](https://github.com/microsoft/onnxruntime/issues/16544)
- [Issue #17466 -- Proposal to Contribute RISC-V Support (closed)](https://github.com/microsoft/onnxruntime/issues/17466)
- [Issue #20030 -- Inference Accuracy Collapse on RISC-V Platform (open)](https://github.com/microsoft/onnxruntime/issues/20030)
- [Issue #22530 -- Discrepancies in ONNX Runtime Inference Results on RISC-V (closed)](https://github.com/microsoft/onnxruntime/issues/22530)
- [Issue #24596 -- Plan to add RISC-V Vector (RVV) support to MLAS (closed stale)](https://github.com/microsoft/onnxruntime/issues/24596)
- [Issue #26187 -- DeviceDiscoveryTest.HasCpuDevice fails on riscv64 (open)](https://github.com/microsoft/onnxruntime/issues/26187)
- [MLAS riscv64 kernel directory](https://github.com/microsoft/onnxruntime/tree/main/onnxruntime/core/mlas/lib/riscv64)
- [cmake/riscv64.toolchain.cmake](https://github.com/microsoft/onnxruntime/blob/main/cmake/riscv64.toolchain.cmake)
- [cmake/onnxruntime_mlas.cmake](https://github.com/microsoft/onnxruntime/blob/main/cmake/onnxruntime_mlas.cmake)
- [XNNPACK issue #9886 -- 100+ riscv64 RVV CI failures](https://github.com/google/XNNPACK/issues/9886)
- [Debian buildd -- onnxruntime riscv64 status](https://buildd.debian.org/status/package.php?p=onnxruntime&suite=sid)
- [Debian buildd -- onnx riscv64 status](https://buildd.debian.org/status/package.php?p=onnx&suite=sid)
- [RISE wheel builder -- onnx riscv64 wheels](https://riseproject.gitlab.io/python/wheel_builder/packages/onnx.html)
- [RISE project -- member list](https://riseproject.dev)
- [PyPI -- onnxruntime](https://pypi.org/project/onnxruntime/)
- [PyPI -- onnx](https://pypi.org/project/onnx/)