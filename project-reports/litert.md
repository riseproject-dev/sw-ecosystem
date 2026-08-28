---
title: LiteRT
categories:
  - python-packages
  - ai-ml
---

# LiteRT

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for LiteRT<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

LiteRT is the on-device ML inference runtime produced by Google AI Edge. It was announced on September 4, 2024 as a rename and rebrand of TensorFlow Lite (TFLite), which Google first shipped in 2017. The rebrand reflects a stated multi-framework vision: LiteRT now accepts models from PyTorch, JAX, and Keras in addition to TensorFlow. The project lives at [google-ai-edge/LiteRT](https://github.com/google-ai-edge/LiteRT) and is documented at [ai.google.dev/edge/litert](https://ai.google.dev/edge/litert).

LiteRT is a corporate open-source project under sole Google stewardship. There is no independent foundation governance (no Linux Foundation, Apache Foundation, or equivalent neutral body). Google retains full strategic control. Contribution requires signing a Google CLA; PRs are reviewed by Google-internal staff and are often processed through Google's internal VCS before being exported to GitHub, which creates a high bar for external architectural contributions.

The license is Apache 2.0.

The sole corporate maintainer is the Google AI Edge team. No MAINTAINERS, CODEOWNERS, or OWNERS file exists in the repository. Hardware vendors with documented NPU acceleration (contributing drivers/SDKs but not core maintainers) include Qualcomm (Android NPU), MediaTek (Android NPU), Intel (Linux/Windows NPU), Google Tensor (first-party Pixel NPU), Samsung S.LSI (provisional), and Broadcom/Raspberry Pi (IoT, provisional).

LiteRT is NOT a member of the [RISE Project](https://riseproject.dev). Google is listed as a RISE Premier Member, but exclusively in the context of RISC-V toolchain and platform work. LiteRT is not named in any RISE deliverable, blog post, or funded project.

---

## 2. Port History and Upstreaming Timeline

There is no port history. LiteRT has no upstream record of RISC-V work of any kind.

Exhaustive search across the [google-ai-edge/LiteRT](https://github.com/google-ai-edge/LiteRT) repository -- covering issues, pull requests, commits, discussions, and all source files -- found zero entries dedicated to RISC-V. The string "riscv" does not appear in any issue title, PR title, commit message, CMakeLists.txt, Bazel BUILD file, or CI workflow.

The only incidental appearance of "riscv" in the entire repository is in [issue #177](https://github.com/google-ai-edge/LiteRT/issues/177) ("Enabling XNNPACK with Raspberry Pi Zero/W", closed October 29, 2025), where `-DXNN_ENABLE_RISCV_VECTOR=1` appears as an incidental CMake sub-build flag within XNNPACK's own build -- not as a RISC-V port request or feature.

The single known attempt to build LiteRT on RISC-V hardware is from an anonymous community member in [issue #37](https://github.com/google-ai-edge/LiteRT/issues/37), who reported a native build attempt on a RISC-V machine using a modified build script and encountered XNNPACK being disabled. No Google response or follow-up action resulted from this report. [NEEDS VERIFICATION: exact date of issue #37 was not captured in the search results.]

The RISE Project AI/ML Workgroup has directed effort toward PyTorch, llama.cpp, and XNNPACK for RISC-V -- not LiteRT. A complete review of all 27 RISE blog posts (May 2024 through June 2026) and the December 2024 RISE webinar PDF returned zero mentions of LiteRT.

**Timeline summary:** No port exists. No port has ever been started upstream. No tracking issue or roadmap entry exists.

---

## 3. Upstream Support Tier

LiteRT has no formal tiered architecture policy. Supported platforms are enumerated by name in the README. Any platform not listed is unsupported by default with no community tier, best-effort tier, or provisional designation available.

The officially supported and documented platforms are: Android (arm64-v8a, x86_64), iOS (arm64), Linux (x86_64), macOS (arm64), Windows (x86_64), Web (WASM), and IoT (Raspberry Pi/Broadcom, marked provisional). The documentation page `developers.google.com/edge/litert/build/riscv` returns HTTP 404 -- no such guide exists.

RISC-V is not listed in the README platform table. RISC-V has no support tier designation of any kind. It is an entirely unrecognized target.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LiteRT's CPU execution model has three kernel modes: `xnnpack` (default), `builtin`, and `reference`. Architecture-specific SIMD optimization is split between LiteRT-internal kernel code and the external XNNPACK library.

**LiteRT-internal SIMD kernels (`tflite/kernels/internal/optimized/`):**

The dispatch model uses two macros: `NEON_OR_PORTABLE()` selects between `NeonFuncname()` on ARM and `PortableFuncname()` (scalar C) on all other architectures; `SSE_OR_PORTABLE()` selects between `SseFuncname()` on SSSE3 and `PortableFuncname()` otherwise. RISC-V hits the portable scalar path on all dispatches.

Files per architecture in this directory:
- ARM NEON: `neon_tensor_utils.cc`, `neon_tensor_utils.h`, `neon_tensor_utils_impl.h`, `neon_check.h` (4 files)
- x86 SSE/SSSE3: `sse_tensor_utils.cc`, `sse_tensor_utils.h`, `sse_tensor_utils_impl.h`, `sse_check.h` (4 files)
- x86 AVX2: `avx2_quantization_utils.h` (1 file)
- riscv64 RVV: 0 files

**4-bit fully connected layer (`tflite/kernels/internal/optimized/4bit/`):**

- ARM NEON aarch64 (sdot): `neon_fully_connected_aarch64_sdot.cc`
- ARM NEON aarch64 (no sdot): `neon_fully_connected_aarch64_nosdot.cc`
- ARM NEON arm32 (sdot): `neon_fully_connected_arm32_sdot.cc`
- ARM NEON arm32 (no sdot): `neon_fully_connected_arm32_nosdot.cc`
- x86 SSE: `sse_fully_connected.cc`, `sse_fully_connected.h`, `sse_fully_connected_impl.h`
- Reference/portable: `fully_connected_reference.cc`, `fully_connected_reference.h`, `fully_connected_reference_impl.h`
- riscv64: 0 files

RISC-V executes the reference scalar path for all 4-bit quantized operations.

**XNNPACK CPU backend:**

When `TFLITE_ENABLE_XNNPACK=ON` (the default), XNNPACK handles the majority of compute-intensive operations. XNNPACK does have upstream RISC-V support (RV32GC and RV64GC with RVV microkernels for f32/int8/f16 ops), and provides a cross-compilation toolchain (`cmake/riscv64.toolchain`) and Docker image (`ghcr.io/google/xnnpack/riscv:latest`). However, LiteRT's build system does not expose XNNPACK's RISC-V capability -- there is no riscv64 CMake preset, no riscv64 Bazel config_setting, and no CI exercising XNNPACK's riscv64 path through LiteRT. See Section 9 for the current state of XNNPACK's own RISC-V CI.

**Vendor/NPU acceleration (`litert/vendors/`):**

Supported SoC vendors: Google Tensor, Qualcomm, MediaTek, Samsung S.LSI, Intel OpenVINO, Broadcom. None of these target RISC-V CPU execution. No riscv64 accelerator registry entry exists in `litert/runtime/accelerators/`.

**No RVV intrinsics anywhere in the repository.** A full-tree search found zero occurrences of RVV types (`vfloat32m1_t` or similar), zero `.S` assembly files for RISC-V, zero Zba/Zbb/Zbc extension usage, and no JIT backend for riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Bazel (`litert/BUILD`):** Defines `config_setting` entries for `linux_x86_64`, `linux_aarch64`, and `linux_armhf`. No `linux_riscv64` config_setting exists. riscv64 is an unrecognized target in the Bazel build graph.

**CMake (`litert/CMakeLists.txt`):** Normalizes `CMAKE_SYSTEM_PROCESSOR` and applies specific logic for x86/amd64 (to disable KleidiAI). No riscv64 condition or branch exists.

**`litert/CMakePresets.json`:** Defines three presets: `default` (host x86_64), `android-arm64` (Android AArch64 with NDK r27), `linux-aarch64-iq8` (AArch64 for Qualcomm IQ8275). No riscv64 preset exists.

**Bazel `.bazelrc` (embedded Linux cross-compilation):** Defines `elinux_aarch64` and `elinux_armhf` configs. No `elinux_riscv64` config.

**Toolchain provision (`tflite/tools/cmake/download_toolchains.sh`):** Downloads GCC 8.3-2019.03 for ARM targets only. No riscv64 toolchain is provided or documented.

**Docker build environment (`docker_build/hermetic_build.Dockerfile`):** Base is `ubuntu:24.04`, Clang 18, Bazel 7.4.1 via Bazelisk 1.18.0, Android NDK r28b. The Bazelisk install script supports only `x86_64` and `aarch64`; riscv64 triggers `exit 1`.

**QEMU:** No QEMU usage is present in any CI script or Dockerfile. There is no cross-compiled binary test harness.

**Cross-compilation pattern for a future riscv64 attempt** (inferred from the aarch64 pattern documented in `tflite/g3doc/guide/build_cmake_arm.md` -- the closest analog, not a supported configuration):

```sh
cmake -DCMAKE_C_COMPILER=<riscv64-gcc> \
  -DCMAKE_CXX_COMPILER=<riscv64-g++> \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DTFLITE_HOST_TOOLS_DIR=<path-to-host-flatc> \
  -DLITERT_ENABLE_GPU=OFF \
  -DLITERT_ENABLE_NPU=OFF \
  -DTFLITE_ENABLE_GPU=OFF \
  -DTFLITE_ENABLE_NNAPI=OFF \
  -DXNNPACK_ENABLE_KLEIDIAI=OFF \
  ../litert/
```

This is not a supported configuration. It would fail today due to unrecognized `CMAKE_SYSTEM_PROCESSOR` handling in LiteRT's CMake files and the dependency chain issues described in Section 9.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| SIMD tensor kernels | SSE/SSSE3/AVX2 intrinsics | NEON intrinsics | scalar fallback (unintentional) |
| 4-bit FC / quantized ops | SSE hand-tuned (3 files) | NEON x4 variants (sdot/nosdot x arch) | reference path (scalar) |
| XNNPACK CPU backend | full support, CI tested | full support, CI tested | upstream support exists; untested through LiteRT |
| Build system recognition | yes (config_setting) | yes (config_setting) | absent |
| Cross-compilation toolchain | native | GCC 8.3 provided | not provided |
| NPU/SoC vendor acceleration | Intel OpenVINO | Google Tensor, Qualcomm, MediaTek | none |
| CI coverage | yes | yes | none |
| Binary packages (PyPI) | manylinux x86_64 | manylinux aarch64 | none |
| Documentation | full | full | none (404) |

The riscv64 column is not a partial implementation. It is a complete absence. There are no stub files, no TODO comments, no placeholder functions, no disabled code paths. RISC-V falls through to scalar C code that was written for portability across all unrecognized architectures, not for RISC-V specifically.

Quantitative performance gap: Data not available. No published benchmark compares LiteRT inference throughput or latency on riscv64 vs arm64 or amd64. The RISE Project blog contains no LiteRT benchmark data. No academic or community benchmark was found through exhaustive web search.

---

## 7. CI/CD Infrastructure

LiteRT uses GitHub Actions exclusively. All 13 workflow files in `.github/workflows/` were individually fetched and inspected. The string "riscv" appears in zero workflow files -- not in a runner label, not in a cross-compilation step, not in a comment, not in a disabled block.

**Complete CI matrix:**

| Workflow file | Target platform | riscv64 present |
|---|---|---|
| `auto-assignment.yml` | issue triage (ubuntu-latest) | NO |
| `clang_tidy.yml` | x86_64 Linux | NO |
| `cmake_android_linux_x86_64.yml` | Android + x86_64 Linux | NO |
| `ios-arm64.yml` | iOS arm64 (macOS host) | NO |
| `linux_nightly_wheel.yml` | Linux x86_64 | NO |
| `linux_x86_64.yml` | Linux x86_64 (Bazel) | NO |
| `macos-arm64.yml` | macOS arm64 | NO |
| `macos_nightly_wheel.yml` | macOS arm64 + ubuntu-latest | NO |
| `mark_stale.yml` | issue management | NO |
| `windows_nightly_wheel.yml` | Windows x86_64 | NO |
| `windows_wheel_release.yml` | Windows x64 | NO |
| `windows_x86_64.yml` | Windows x86_64 (Bazel) | NO |
| `auto-assignment.js` | helper script, not a workflow | NO |

`.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist (HTTP 404 confirmed).

Adding riscv64 CI would require at minimum: a QEMU-based riscv64 runner (as XNNPACK uses), a cross-compilation toolchain step, a host-flatc build step (required for all cross-compilation), and a binary execution harness. No skeleton for any of these exists.

---

## 8. Distribution and Release Status

**GitHub Releases ([google-ai-edge/LiteRT/releases](https://github.com/google-ai-edge/LiteRT/releases)):**

Releases checked: v1.4.1 through v2.1.5. Asset filenames across all releases: `litert_cc_sdk.zip`, `litert_npu_runtime_libraries.zip`, `litert_npu_runtime_libraries_jit.zip`, plus source archives. No asset carries a per-architecture suffix. No riscv64 binary is present.

**PyPI ([ai-edge-litert](https://pypi.org/project/ai-edge-litert/)):**

The canonical PyPI package name is `ai-edge-litert`. The package `litert` does not exist on PyPI (HTTP 404). A live API call to `https://pypi.org/pypi/ai-edge-litert/json` enumerated 231 wheel filenames across all published versions (1.0.0 through 2.1.x). Every wheel carries one of these platform tags: `manylinux_2_17_x86_64`, `manylinux_2_17_aarch64`, `manylinux_2_27_x86_64`, `manylinux_2_27_aarch64`, `macosx_10_15_x86_64`, `macosx_12_0_arm64`, `win_amd64`. The string "riscv" appears in zero filenames. No riscv64 wheel has ever been published.

**RISE Project wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)):**

LiteRT is not present in the RISE wheel builder package list. The builder covers numpy, scipy, scikit-learn, sentencepiece, safetensors, onnx, and others -- not LiteRT.

**Ubuntu 24.04 noble:** `packages.ubuntu.com` search for "LiteRT" returns no results. LiteRT is not in the Ubuntu 24.04 archive.

**Debian:** `tracker.debian.org/pkg/litert` returns HTTP 404. LiteRT is not packaged in Debian.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=litert)):** No results. LiteRT is not in the Arch Linux RISC-V community repository.

**Summary:** No pre-built riscv64 binary for LiteRT exists in any official or community distribution channel. Building from source is the only path, and it is unsupported upstream.

---

## 9. Dependencies

The table below covers all critical LiteRT dependencies and their individual riscv64 status. The blocking chain for production riscv64 use is identified at the end.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| **TensorFlow / TFLite** | Core runtime (LiteRT is a TFLite rebrand); pulled at commit f687502 (~TF 2.21 rc0) | Builds via CMake with effort; native build confirmed (issue #101017, closed); cross-compilation has had repeated linker failures (#77137, #69689) | Not run upstream; TF CI covers x86_64/aarch64 only | No riscv64 wheel on PyPI | [#102159](https://github.com/tensorflow/tensorflow/issues/102159) (OPEN): can't compile TF 2.19.1 on riscv; [#100940](https://github.com/tensorflow/tensorflow/issues/100940) (OPEN): compile TF on riscv64 |
| **XNNPACK** | Accelerated CPU inference backend (default ON); provides RVV microkernels for f32/int8/f16 | Builds; cross-compilation toolchain (`cmake/riscv64.toolchain`) and Docker image (`ghcr.io/google/xnnpack/riscv:latest`) provided; cpuinfo C99 build error (#4650) blocks some configs | CI job `cmake-linux-riscv64` runs on every PR via QEMU; currently BROKEN: 100+ RVV FP16 failures (issue #9886, opened April 2026, unresolved); operator tests permanently excluded | Debian sid `libxnnpack0.20241108` for riscv64 (debports, ~19 months stale); no Arch, no Conan, no vcpkg | [#9886](https://github.com/google/XNNPACK/issues/9886) (OPEN, April 2026): 100+ RVV FP16 test failures; root cause is `xnn_arch_riscv_vector_fp16_arith` unconditionally set (PR #9516), bypassing `cpuinfo_has_riscv_zvfh()` which does not exist in cpuinfo. [#4650](https://github.com/google/XNNPACK/issues/4650) (OPEN, 3 years): `syscall` undeclared under ISO C99/Clang on RISC-V |
| **cpuinfo** | CPU feature detection used by XNNPACK and ruy; selects microkernels at runtime | Partial; builds on riscv64 Linux; Android riscv64 added 2024; `syscall` undeclared under ISO C99/Clang = hard build error | QEMU-based CI only via XNNPACK's Docker image; no standalone riscv64 CI in cpuinfo repo | Not distributed as a standalone binary | [#124](https://github.com/pytorch/cpuinfo/issues/124) (OPEN since Dec 2022): riscv64 support request; no `cpuinfo_has_riscv_zvfh()` function exists -- this is the root cause of XNNPACK #9886. [#148](https://github.com/pytorch/cpuinfo/pull/148) (OPEN since May 2023, unmerged after 3 years): improve RISC-V Linux support |
| **ruy** | Quantized matrix multiply; fallback for non-XNNPACK paths | Builds as plain C++; `platform.h` defines arch macros for x86, ARM-32, ARM-64, PowerPC only -- no RISC-V macro; all SIMD paths are x86/ARM | No riscv64 CI; zero riscv64 issues filed | No binary releases | No blocker issue; ruy has no RISC-V optimized paths and executes scalar reference code only on RISC-V; performance impact limited because XNNPACK supersedes ruy for most ops |
| **Abseil-C++ (absl)** | C++ utilities: strings, hashing, synchronization, status, span, flags; used pervasively | Mostly functional; two open bugs affect riscv64 | riscv64 not a CI target; tests in #2002 are known failures on riscv64-linux-gnu | Header + source; no binary releases | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (OPEN): link failure using riscv64 toolchain. [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (OPEN): `hashtablez_sampler_test` and `cordz_sample_token_test` fail on riscv64-linux-gnu. [#1236](https://github.com/abseil/abseil-cpp/issues/1236) (OPEN): riscv64 ILP32E stack alignment. [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) (OPEN): no hardware CRC32C for RISC-V (Zbc) |
| **FlatBuffers** | Serialization format for `.tflite` model files | Builds; architecture-agnostic serialization; no open riscv64-specific issues | No riscv64 CI; tests pass in practice | No riscv64 binary releases; consumed as source | No known blocking issues |
| **Eigen3** | Linear algebra for matrix ops and numerics in TFLite kernels not covered by XNNPACK/ruy | Header-only template library; builds on any architecture | No riscv64 CI; falls back to scalar (no RVV backend) | Header-only; no binary releases | No blocking issues; scalar fallback only |
| **gemmlowp** | Legacy low-precision matrix multiply; largely superseded by ruy and XNNPACK; still compiled | Architecture-agnostic C++; zero riscv64 issues | No riscv64 CI | No binary releases | No blocking issues; deprecated/maintenance-mode; no SIMD investment for any new architecture |
| **farmhash** | Hash functions used internally | Architecture-agnostic per codebase structure; no known riscv64 issues | No riscv64 CI | Header-only | No blocking issues expected [NEEDS VERIFICATION: GitHub API returned HTTP 403 during search] |
| **sentencepiece** | Tokenizer for LLM-adjacent use cases | Builds; [PR #1196](https://github.com/google/sentencepiece/pull/1196) (merged) added riscv64 to Linux wheel build matrix | No standalone riscv64 CI | PyPI riscv64 wheel added in the release cycle covering PR #1196; [#1250](https://github.com/google/sentencepiece/issues/1250) (OPEN) suggests availability is not obvious to users | [#1250](https://github.com/google/sentencepiece/issues/1250) (OPEN): user requesting riscv64 binary distribution |
| **XLA / TSL** | JIT compiler and tensor standard library; pulled as @xla sub-dependency of @org_tensorflow | Closed PR in TensorFlow `[XLA:CPU] Add support for riscv64` (#32812, closed); no active riscv64 XLA support | No riscv64 XLA CI | Not distributed separately for riscv64 | XLA JIT will not generate optimized code for RISC-V; LiteRT inference without XNNPACK falls back to reference kernels |

**Non-blocking (scalar fallback is functional):** ruy, Eigen3, gemmlowp, FlatBuffers, farmhash all build on riscv64 but provide no RISC-V SIMD acceleration. Inference will execute at scalar throughput for ops not covered by XNNPACK.

**Blocking chain for riscv64 LiteRT production use:**

1. `pytorch/cpuinfo` missing `cpuinfo_has_riscv_zvfh()` (issue #124, open December 2022; PR #148 unmerged 3 years)
2. `google/XNNPACK` FP16 CI broken: 100+ failures (issue #9886, opened April 2026) because of (1)
3. `google/XNNPACK` C99 build error under Clang (issue #4650, open 3 years, no upstream response)
4. `abseil-cpp` linker failure on riscv64 toolchain (issue #1702, open)
5. No riscv64 wheel for `ai-edge-litert` on PyPI
6. LiteRT CI has zero riscv64 coverage

---

## 10. Ecosystem Status

**RISE Project:** Google is a RISE Premier Member. RISE's AI/ML Workgroup (founded by Ludovic Henry, Meta) has produced: an RVV pull request merged into PyTorch mainline, PyTorch ATen operator optimizations for RISC-V, llama.cpp as a first-class CI target on RISE runners (13,000+ jobs over 6 weeks), and XNNPACK RVV vector optimizations. LiteRT is not mentioned in any RISE deliverable. A complete review of all 27 RISE blog posts (May 2024 through June 2026) and the RISE December 2024 webinar PDF returned zero mentions of LiteRT.

**Debian/Ubuntu:** LiteRT is not packaged in Debian or Ubuntu under any name. No ITP (Intent to Package) or RFP (Request for Package) exists.

**Arch Linux RISC-V:** LiteRT is not present.

**Community porting activity:** One confirmed attempt (issue #37, exact date not captured) by an anonymous user who hit XNNPACK being disabled during a native build on RISC-V hardware. No organized community effort (mailing list, fork, downstream package) exists.

**Competitive context:** The RISE AI/ML focus has landed on PyTorch and llama.cpp as primary inference targets for RISC-V. Neither Google nor any RISE member has indicated LiteRT is a target for RISC-V enablement.

---

## 11. Known Bugs and Active Issues

LiteRT has no open RISC-V-specific bugs. The exhaustive issue search returned zero results for every RISC-V query variant. Issue #37 (community build attempt, closed) is the only historical RISC-V-related entry in the tracker.

For completeness, active non-RISC-V correctness issues that would affect any platform, including RISC-V, include:
- [Issue #121](https://github.com/google-ai-edge/LiteRT/issues/121) -- FPE in Conv2d (closed July 21, 2025)
- [Issue #120](https://github.com/google-ai-edge/LiteRT/issues/120) -- FPE in DepthwiseConv2D (closed July 22, 2025)
- [Issue #128](https://github.com/google-ai-edge/LiteRT/issues/128) -- TFLite_Detection_PostProcess produces invalid bounding box coordinates (closed October 29, 2025)

No open floating-point correctness or NaN issues are present in the tracker.

**Performance benchmarks for riscv64:** Data not available. No published benchmark comparing LiteRT inference throughput or latency on riscv64 vs arm64 or amd64 exists in any indexed source -- not in the LiteRT repository, not in RISE publications, not in web-accessible academic or community literature.

---

## 12. Objections and Upstream Blockers

The following issues in upstream dependencies must be resolved before a riscv64 LiteRT port can reach production quality. They are ordered by dependency depth (deepest first).

**Blocker 1 (Severity: Critical) -- cpuinfo missing Zvfh detection**
[pytorch/cpuinfo #124](https://github.com/pytorch/cpuinfo/issues/124) (open December 2022) and [PR #148](https://github.com/pytorch/cpuinfo/pull/148) (open May 2023, unmerged after 3 years). The function `cpuinfo_has_riscv_zvfh()` does not exist. This is the root cause of XNNPACK issue #9886. Three years of upstream inactivity on this PR represents a systemic maintainer responsiveness problem.

**Blocker 2 (Severity: Critical) -- XNNPACK FP16 CI broken**
[google/XNNPACK #9886](https://github.com/google/XNNPACK/issues/9886) (open April 2026). 100+ RVV FP16 test failures because `xnn_arch_riscv_vector_fp16_arith` is set unconditionally by [PR #9516](https://github.com/google/XNNPACK/pull/9516), bypassing the missing `cpuinfo_has_riscv_zvfh()` guard. This means XNNPACK's own riscv64 CI is currently red. Any LiteRT build depending on XNNPACK's FP16 path would produce incorrect results.

**Blocker 3 (Severity: High) -- XNNPACK cpuinfo C99 build error**
[google/XNNPACK #4650](https://github.com/google/XNNPACK/issues/4650) (open 3 years): `syscall` undeclared in cpuinfo on RISC-V under Clang with `-std=c99`. No upstream response in 3 years.

**Blocker 4 (Severity: High) -- abseil-cpp linker failure on riscv64 toolchain**
[abseil/abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) (open). Link failure when using a riscv64 cross-compilation toolchain. Abseil is used pervasively throughout LiteRT and TensorFlow.

**Blocker 5 (Severity: High) -- abseil-cpp test failures on riscv64-linux-gnu**
[abseil/abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) (open): `hashtablez_sampler_test` and `cordz_sample_token_test` fail on riscv64-linux-gnu.

**Non-blockers:**

- ruy has no RISC-V SIMD paths but is superseded by XNNPACK for most ops. No port required for functional correctness, only for performance on XNNPACK-uncovered ops.
- Eigen3 falls back to scalar on RISC-V; no RVV backend. Acceptable as a performance gap item, not a correctness blocker.
- XLA JIT ([tensorflow #32812](https://github.com/tensorflow/tensorflow/pull/32812), closed): LiteRT inference does not require XLA JIT for the standard deployment path.

**Upstream responsiveness assessment:** The 3-year unmerged state of cpuinfo PR #148 and XNNPACK issue #4650 indicates that Google's XNNPACK team is not prioritizing RISC-V maintenance. XNNPACK issue #9886 (April 2026, 100+ CI failures) represents a regression in an already-supported architecture that has not been resolved as of June 2026. This pattern suggests that any RISC-V work contributed without sustained internal Google sponsorship will stall.

---

## 13. Investment Analysis

The following analysis addresses the effort required to bring LiteRT to riscv64 at four capability levels.

### 13.1 Functional Enablement

Goal: LiteRT builds and runs inference on riscv64 hardware, producing correct results at scalar (non-SIMD) throughput.

Required work:
1. Resolve cpuinfo [#148](https://github.com/pytorch/cpuinfo/pull/148) or fork cpuinfo with `cpuinfo_has_riscv_zvfh()` added (prerequisite for XNNPACK #9886).
2. Fix XNNPACK [#9886](https://github.com/google/XNNPACK/issues/9886) FP16 CI failures (contingent on 1).
3. Fix XNNPACK [#4650](https://github.com/google/XNNPACK/issues/4650) cpuinfo C99/Clang build error.
4. Investigate and fix abseil-cpp [#1702](https://github.com/abseil/abseil-cpp/issues/1702) and [#2002](https://github.com/abseil/abseil-cpp/issues/2002) for riscv64.
5. Add riscv64 CMake preset and `CMAKE_SYSTEM_PROCESSOR` handling to LiteRT.
6. Add riscv64 Bazel `config_setting` to LiteRT.
7. Verify cross-compilation with a publicly available riscv64 toolchain (e.g., from SiFive or Ubuntu).
8. Validate end-to-end inference on at least one riscv64 target (SpacemiT X60, SiFive P650, or QEMU).

### 13.2 Performance Optimization

Goal: LiteRT achieves competitive throughput on riscv64 via RVV, approaching arm64 NEON parity on relevant workloads.

Required work:
1. Complete functional enablement (13.1) first.
2. Validate XNNPACK RVV microkernels on target hardware (post #9886 resolution).
3. Add RVV paths to `tflite/kernels/internal/optimized/` for tensor utility functions (analogous to `neon_tensor_utils.cc`): 4 files minimum.
4. Add RVV 4-bit FC kernels to `tflite/kernels/internal/optimized/4bit/` (analogous to the 4 NEON variants): 2-4 files depending on Zvfh/Zve32f split.
5. Profile against arm64 baseline on representative models (MobileNetV3, EfficientDet, DeepLabV3).
6. Benchmark data generation and publication.

Note: XNNPACK's existing RVV microkernels cover the most compute-intensive ops when `TFLITE_ENABLE_XNNPACK=ON`. The LiteRT-layer kernel gaps (items 3-4) affect the non-XNNPACK fallback path and quantized ops not yet covered by XNNPACK.

### 13.3 CI/CD Infrastructure

Goal: riscv64 builds and tests run on every PR to prevent regressions.

Required work:
1. Add QEMU-based riscv64 runner to `.github/workflows/linux_x86_64.yml` or a new dedicated workflow (analogous to XNNPACK's `cmake-linux-riscv64` job).
2. Add host-flatc build step as prerequisite for cross-compiled runs (already required by other cross-compilation workflows).
3. Add riscv64 wheel build to `linux_nightly_wheel.yml`.
4. Configure `manylinux_2_28_riscv64` or equivalent Docker image (not yet standard in PyPA's manylinux suite -- requires verification of riscv64 manylinux availability [NEEDS VERIFICATION]).
5. Add riscv64 runner to the Bazelisk Docker image architecture detection (currently `exit 1` on riscv64).

### 13.4 Ecosystem Enablement

Goal: Pre-built riscv64 packages available through standard distribution channels.

Required work:
1. Publish `ai-edge-litert` riscv64 wheel to PyPI (contingent on 13.3 wheel build step).
2. Submit Debian package (ITP via debian-devel); riscv64 autobuilder would then handle riscv64 builds automatically once x86_64/arm64 packaging is established.
3. Coordinate with RISE AI/ML Workgroup to list LiteRT as an AI/ML inference target alongside llama.cpp and PyTorch.
4. Publish benchmark data (contingent on 13.2).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix cpuinfo `cpuinfo_has_riscv_zvfh()` (PR #148 or fork) | 2 | cpuinfo/XNNPACK upstream contributor | Critical |
| Functional | Fix XNNPACK #9886 FP16 CI failures | 1 | XNNPACK upstream contributor | Critical |
| Functional | Fix XNNPACK #4650 Clang C99 cpuinfo build error | 1 | XNNPACK upstream contributor | Critical |
| Functional | Fix abseil-cpp #1702, #2002 riscv64 linker/test failures | 2 | abseil upstream contributor | High |
| Functional | Add riscv64 CMake preset and processor detection to LiteRT | 1 | LiteRT contributor | High |
| Functional | Add riscv64 Bazel config_setting to LiteRT | 1 | LiteRT contributor | High |
| Functional | Validate cross-compilation and end-to-end inference on riscv64 hardware/QEMU | 2 | LiteRT contributor | High |
| Performance | Add RVV paths to LiteRT-internal tensor utility kernels | 6 | LiteRT contributor | Medium |
| Performance | Add RVV 4-bit FC kernels to LiteRT | 4 | LiteRT contributor | Medium |
| Performance | Profile and benchmark vs arm64 on representative models | 3 | LiteRT contributor | Medium |
| CI/CD | Add QEMU riscv64 runner to LiteRT GitHub Actions | 2 | LiteRT contributor | High |
| CI/CD | Add riscv64 wheel build step to nightly workflow | 2 | LiteRT contributor | High |
| CI/CD | Resolve manylinux riscv64 availability for PyPI wheels | 1 | LiteRT contributor | High |
| Ecosystem | Publish riscv64 wheel to PyPI | 1 | LiteRT contributor | Medium |
| Ecosystem | Submit Debian ITP and coordinate packaging | 3 | Debian packager | Low |
| Ecosystem | Engage RISE AI/ML Workgroup | 1 | Business development | Low |

**Total functional enablement estimate:** ~10 person-weeks, of which ~6 are in upstream dependencies (cpuinfo, XNNPACK, abseil) that require upstream buy-in to land without maintaining a fork.

**Total performance optimization estimate:** ~13 additional person-weeks after functional enablement, assuming XNNPACK RVV microkernels are healthy after #9886 resolution.

**Key risk:** The 3-year unmerged state of cpuinfo PR #148 indicates that contributions to this dependency chain may not be accepted on any predictable timeline without direct upstream maintainer engagement or a sustained Google relationship. Work that cannot land upstream must be carried as a fork, multiplying long-term maintenance cost.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google-ai-edge/LiteRT repository](https://github.com/google-ai-edge/LiteRT)
- [LiteRT homepage](https://ai.google.dev/edge/litert)
- [LiteRT issue #37](https://github.com/google-ai-edge/LiteRT/issues/37) -- riscv64 build attempt (community)
- [LiteRT issue #177](https://github.com/google-ai-edge/LiteRT/issues/177) -- XNNPACK Raspberry Pi Zero (incidental riscv flag)
- [ai-edge-litert on PyPI](https://pypi.org/project/ai-edge-litert/)
- [google/XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886) -- 100+ RVV FP16 CI failures (OPEN, April 2026)
- [google/XNNPACK issue #4650](https://github.com/google/XNNPACK/issues/4650) -- C99 syscall build error on RISC-V (OPEN, 3 years)
- [pytorch/cpuinfo issue #124](https://github.com/pytorch/cpuinfo/issues/124) -- riscv64 support request (OPEN, December 2022)
- [pytorch/cpuinfo PR #148](https://github.com/pytorch/cpuinfo/pull/148) -- improve RISC-V Linux support (OPEN, May 2023, unmerged)
- [abseil/abseil-cpp issue #1702](https://github.com/abseil/abseil-cpp/issues/1702) -- riscv64 toolchain link failure (OPEN)
- [abseil/abseil-cpp issue #2002](https://github.com/abseil/abseil-cpp/issues/2002) -- test failures on riscv64-linux-gnu (OPEN)
- [tensorflow/tensorflow issue #102159](https://github.com/tensorflow/tensorflow/issues/102159) -- can't compile TF 2.19.1 on riscv (OPEN)
- [tensorflow/tensorflow issue #100940](https://github.com/tensorflow/tensorflow/issues/100940) -- compile TF on riscv64 (OPEN)
- [RISE Project](https://riseproject.dev)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [XNNPACK status report](libraries/xnnpack.md)