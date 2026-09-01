---
title: PaddlePaddle Lite
parent: Project Reports
color: red
---

# PaddlePaddle Lite

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Red<br/>
**Scope:** RISC-V (riscv64/linux) support status for PaddlePaddle Lite<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

PaddlePaddle Lite is a lightweight inference framework targeting mobile, embedded, and edge devices. It is the on-device inference counterpart to the full PaddlePaddle training framework. Supported backends are: ARM (armv7/armv8, Android/Linux/iOS/OHOS/QNX), x86, OpenCL, Metal (Apple), XPU (Baidu Kunlun), and NNAdapter (a C-interface hardware abstraction layer for third-party accelerators). The project is licensed Apache-2.0.

Governance is corporate-controlled by Baidu, Inc. There is no foundation affiliation (not Apache, Linux Foundation, CNCF, or equivalent). The top ten contributors by commit count are all Baidu employees (RayLiu2015: 916 commits, zhupengyang: 391, DannyIsFunny: 372, chenjiaoAngel: 323, smilejames: 317, Eclipsess: 298, hjchen2: 271, xiebaiyuan: 259, hong19860320: 207, dolphin8: 199). There is no meaningful external corporate co-maintainership. A community contributor program (PFCC - Paddle Framework Contributor Club) exists with biweekly meetings, but technical direction is set by Baidu.

Baidu is not a RISE Project member. PaddlePaddle Lite does not appear in any RISE blog post, funded RFP, or working group deliverable. It appears only in the local `project-reports/queue.yml` as a candidate for future analysis.

New hardware ports are handled via the NNAdapter HAL, which decouples hardware from the inference engine. Baidu actively recruits chip vendors to implement NNAdapter adapters. However, all existing NPU integrations were done by or in close partnership with the chip vendor (Huawei, Qualcomm, Cambricon, etc.). CPU-only architecture ports (such as a RISC-V CPU backend) require kernel-level work and have no current champion inside or outside Baidu.

The project's last release was v2.14-rc (July 2024) and last commit was May 2025. Community issues (#10710, #10700) have raised questions about whether the project is abandoned [NEEDS VERIFICATION on current maintainer activity level].

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-11-25 | User asks if K210 (Kendryte RISC-V MCU) is supported. Two maintainers reply: "not supported." No roadmap response given. Issue closed 2020-11-29. | [Issue #4825](https://github.com/PaddlePaddle/Paddle-Lite/issues/4825) |
| 2024-03-27 | User asks when Paddle will support RV1106 (Rockchip RISC-V SoC). Assigned to @csy0225. Closed 2025-01-26 without RISC-V support being added. | [Issue #10480](https://github.com/PaddlePaddle/Paddle-Lite/issues/10480) |
| 2024-03-25 | PR #10477 adds LoongArch compile options. Closed without merge. | [PR #10477](https://github.com/PaddlePaddle/Paddle-Lite/pull/10477) |
| 2025-01-17 | PR #10624 adds LoongArch LASX support. Closed without merge. | [PR #10624](https://github.com/PaddlePaddle/Paddle-Lite/pull/10624) |

Note: the research data initially stated LoongArch was "added Jan 2025 (PR #10624)." Direct API verification confirmed both LoongArch PRs were closed without merging. The current `CMakeLists.txt` contains no `LOONGARCH` option. This discrepancy is noted: the initial summary was incorrect; the verified finding is that LoongArch is also absent from the merged codebase.

There are zero RISC-V commits, zero RISC-V PRs (open or closed), and zero RISC-V source files anywhere in the repository across all 35 branches. The port history is a complete blank.

## 3. Upstream Support Tier

Paddle-Lite has no formal tier policy document. In practice, ARM (Android and Linux) is the primary target with deep hand-tuned kernel coverage. x86 is a secondary target. All other architectures are either absent or handled via NNAdapter.

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Backend directory | `lite/backends/x86/` (full) | `lite/backends/arm/` (full) | Not present |
| Kernel implementations | 134 files | 149 files | 0 files |
| SIMD coverage | AVX/AVX2/AVX512/SSE | NEON/FP16/SVE/SVE2/SDOT | None |
| CMake option | `LITE_WITH_X86=ON` (default) | `LITE_WITH_ARM=ON` | Not present |
| Toolchain file | N/A (host) | `cmake/os/armlinux.cmake` | Not present |
| CI coverage | Yes | Yes | None |
| Official release binaries | Yes | Yes | None |
| PyPI wheels | Yes (x86_64) | No | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Paddle-Lite's performance-critical path is organized around per-architecture backend directories under `lite/backends/` and per-architecture kernel directories under `lite/kernels/`. Each architecture provides hand-tuned implementations of convolution, GEMM, pooling, activation, and quantization operators.

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD dispatch | AVX/AVX2/AVX512 (cmake/simd.cmake) | NEON, FP16 (ARMv8.2), SVE, SVE2 | Missing - no RVV dispatch |
| Inline assembly | Yes (multiple files) | Yes (2589-line conv kernels, multiple files) | Missing |
| FP16 inference | Via MKL | 51 dedicated files (ARMv8.2) | Missing |
| INT8 quantized inference | Via MKL | Full (SDOT, GEMM, 186 math files total) | Missing |
| JIT code generation | xbyak (x86 JIT assembler) | Not applicable | Missing - xbyak is x86-only |
| NNAdapter HAL | Supported | Supported | Not applicable (CPU backend absent) |
| Target type enum (`paddle_place.h`) | `kX86` | `kARM` | No `kRISCV` entry |
| Build script `--arch` option | `x86` | `armv8`, `armv7hf`, `armv7` | Not listed |

The ARM backend contains 186 math files including hand-written inline assembly, NEON intrinsics, ARMv8.2 FP16, SVE/SVE2, and INT8 SDOT kernels. The x86 backend contains 110 math files with AVX/MKL/JIT. The riscv64 backend does not exist at any level - no directory, no stub, no placeholder.

The `TargetType` enum in `lite/api/paddle_place.h` lists: `kHost, kX86, kCUDA, kARM, kOpenCL, kAny, kFPGA, kNPU, kXPU, kBM, kMLU, kRKNPU, kAPU, kHuaweiAscendNPU, kImaginationNNA, kIntelFPGA, kMetal, kNNAdapter`. There is no `kRISCV` entry.

## 5. Build System, Cross-Compilation, and Toolchain

The primary build entry point is `lite/tools/build_linux.sh`. The `--arch` parameter accepts: `armv8` (default), `armv7hf`, `armv7`, `x86`. There is no `riscv64` option.

The `cmake/os/` directory contains: `android.cmake`, `armlinux.cmake`, `armmacos.cmake`, `common.cmake`, `ios.cmake`, `ohos.cmake`, `qnx.cmake`, `windows.cmake`. There is no `riscv.cmake` or `riscv64.cmake`.

The `ARM_TARGET_OS_LIST` in `cmake/os/common.cmake` is hardcoded as: `android armlinux ios ios64 armmacos qnx ohos`. Passing `riscv64` without patching the source would fail.

Minimum toolchain requirements (from `cmake/flags.cmake`):
- GCC >= 4.8 (enforced as fatal error; required for C++11)
- Clang >= 3.3
- CMake >= 3.10 (3.10.3 recommended; installed in `Dockerfile.mobile`)

The official `Dockerfile.mobile` (`lite/tools/Dockerfile.mobile`) installs cross-compilers for: `aarch64-linux-gnu`, `arm-linux-gnueabi`, `arm-linux-gnueabihf`, Android NDK r17c and r20b. It does not install `riscv64-linux-gnu-gcc`.

QEMU usage is not documented anywhere in the build system. No QEMU references exist in any build script, Dockerfile, CI config, or documentation. The project uses `scp` to copy binaries to target hardware for testing.

To build for the closest supported architecture (armlinux/armv8):

```bash
./lite/tools/build_linux.sh \
  --arch=armv8 \
  --toolchain=gcc \
  --with_extra=OFF \
  --with_cv=OFF \
  --with_log=ON \
  --with_opencl=OFF
```

No equivalent command exists for riscv64. Adding riscv64 support would require: (1) a new `cmake/os/riscv64.cmake` toolchain file setting `CMAKE_SYSTEM_PROCESSOR=riscv64` and `CMAKE_C_COMPILER=riscv64-linux-gnu-gcc`; (2) adding `riscv64` to `ARM_TARGET_OS_LIST` in `cmake/os/common.cmake` or creating a separate `LITE_WITH_RISCV` CMake path; (3) adding `riscv64` to the `--arch` option in `build_linux.sh`; (4) implementing or stubbing `lite/backends/riscv/` kernel directory.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| FP32 inference | Full | Full | Not functional (no backend) |
| FP16 inference | Partial (MKL) | Full (ARMv8.2, 51 files) | Not functional |
| INT8 quantized inference | Partial (MKL) | Full (SDOT, GEMM) | Not functional |
| OpenCL GPU backend | Yes | Yes | ICD loader builds; no GPU hardware |
| NNAdapter HAL | Yes | Yes | Not applicable (CPU absent) |
| Python API | Yes | No upstream wheel | No |
| Model optimization tool | Yes | Yes | Not functional |
| Benchmark tool | Yes | Yes | Not functional |

The gap between arm64 and riscv64 is total: riscv64 cannot run any inference at all because there is no backend. The gap is not a performance gap - it is a functional absence.

The LoongArch64 correctness issue (#10694, open 2025-09-06) is relevant as an analog: PP-HumanSeg produces output mean=9.96e-06, std=1.47e-05 on LoongArch64 versus correct output on x86_64. This demonstrates that Paddle-Lite has correctness bugs on non-ARM architectures even when a port exists, suggesting that a new riscv64 port would require significant validation work beyond initial compilation.

## 7. CI/CD Infrastructure

The `.github/` directory contains only `CODEOWNERS`, `ISSUE_TEMPLATE/`, and `PULL_REQUEST_TEMPLATE.md`. There are zero GitHub Actions workflow files. The `.github/workflows/` directory does not exist on any of the checked branches (`develop`, `release/v2.14`, `release/v2.13`, `release/v2.12`).

The only CI configuration is `.travis.yml`, which runs a pre-commit code style check (clang-format, cpplint) on `ubuntu xenial` x86. It does not build the project and has no architecture matrix.

CI scripts in `tools/ci_tools/` cover: Android armv7/armv8, ARM Linux armv8, x86, XPU, NNAdapter, iOS, macOS. No riscv64 CI script exists.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (ci_autoscan_x86.sh) | Yes (ci_autoscan_arm_linux.sh) | None |
| Test CI | Yes | Yes (armv8 only) | None |
| GitHub Actions | None for any arch | None for any arch | None |
| RISE runners | No | No | No |
| QEMU emulation | No | No | No |

The string `riscv` does not appear in any CI configuration file. This was confirmed by direct file reads across all CI scripts.

## 8. Distribution and Release Status

GitHub releases checked: v2.14-rc (66 assets), v2.13-rc (111 assets), v2.12 (94 assets), v2.11 (94 assets), v2.10 (69 assets) - 434 total assets. Zero assets contain "riscv" or "riscv64" in any release across the entire release history.

Release asset platforms: Android armv7/armv8 (clang/gcc, shared/static), ARM Linux armv7hf/armv8, iOS armv7/armv8, x86 Linux/macOS/Windows, Apple M1, specialized NPU targets (Huawei Kirin, MediaTek APU, Rockchip NPU, Kunlun XPU).

PyPI package `paddlelite` (note: `paddlepaddle-lite` returns HTTP 404): 17 versions (2.6.0 to 2.14rc0), 214 total files. Platforms: `manylinux1_x86_64`, `macosx_*`, `win_amd64` only. Zero riscv64 wheels across all 17 versions.

RISE wheel builder: HTTP 302 redirect to pypi.org - package not indexed.

Ubuntu 26.04 (resolute): no `paddle*` packages exist at all. Debian tracker returns HTTP 404 for both `paddle-lite` and `paddlepaddle-lite`. Arch Linux RISC-V: not listed. conda-forge linux-riscv64: not present.

To obtain a working riscv64 binary, a user would need to port the project from scratch: write a new CMake toolchain file, implement a new backend directory, and build from source with a riscv64 cross-compiler. No pre-built path exists.

## 9. Dependencies

The table below covers Paddle-Lite's third-party dependencies and their riscv64 status. x86-specific dependencies (MKL-ML, xbyak, libxsmm) are included because they represent hard blockers or conditional blockers for any riscv64 build attempt.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking? |
|---|---|---|---|---|---|
| FlatBuffers | Model serialization (always required, bundled) | Yes | Yes | Yes (Ubuntu resolute universe) | No |
| Protocol Buffers | Model format parsing (always required, bundled at tag 9f75c5aa) | Yes | Yes | Yes (Ubuntu resolute main, 3.21.12) | No |
| Eigen | Dense linear algebra (bundled pre-3.4 snapshot) | Yes (scalar fallback) | Yes | Yes (Ubuntu resolute universe, 3.4.0, header-only) | No (scalar fallback works; RVV backend only in master post-3.4) |
| OpenBLAS | BLAS/LAPACK numerics (x86 path) | Yes | Yes | Yes (Ubuntu resolute universe, 0.3.32) | No |
| MKL-ML | Intel MKL for ML (x86 path, WITH_MKLML=ON) | No (x86-only binary) | No | No | Hard blocker for x86 path; irrelevant for riscv64 (must be disabled) |
| oneDNN/MKL-DNN | x86 deep learning primitives (x86 path, WITH_MKLDNN=ON, requires AVX2) | Yes (RISC-V CI added Oct 2025) | Yes (QEMU CI) | Yes (Ubuntu resolute universe, 3.9.1) | Conditional - Paddle-Lite's mkldnn.cmake is x86-only; JIT backend early-stage |
| xbyak | x86 JIT assembler (x86 JIT path) | No (x86-only) | No | No | Hard blocker for x86 JIT path; must be disabled for riscv64 |
| libxsmm | Sparse/dense matrix ops (WITH_LIBXSMM=OFF default) | No (x86 JIT) | No | No | Conditional blocker if enabled; default OFF, not a blocker for basic builds |
| xxHash | Fast hash (x86 path, v0.6.5) | Yes | Yes | Yes (Ubuntu resolute main) | No (open issue #1018: RVV optimization proposal, not blocking correctness) |
| gflags | Command-line flags (non-ARM path) | Yes | Yes | Yes (Ubuntu resolute universe) | No |
| glog | Logging (non-ARM path) | Yes | Yes | Yes (Ubuntu resolute universe) | No |
| googletest | Unit testing | Yes | Yes | Yes (Ubuntu resolute universe) | No |
| OpenMP (libgomp) | Parallelism (LITE_WITH_OPENMP=ON default) | Yes | Yes | Yes (Ubuntu resolute main) | No |
| OpenCL | GPU/accelerator backend (LITE_WITH_OPENCL=OFF default) | Yes (ICD loader) | Runtime-dependent | Yes (ICD loader, Ubuntu resolute main) | No for build; no riscv64 OpenCL GPU hardware widely available |
| Python / pybind11 | Python API (LITE_WITH_PYTHON=OFF default) | Yes | Yes | Yes (Ubuntu resolute main+universe) | No |
| arm_dnn_library (KleidiAI) | ARM NEON NN kernels (LITE_WITH_ARM_DNN_LIBRARY=OFF default) | No (ARM NEON only) | No | No | Not relevant for riscv64 |
| zlib | Compression (always required) | Yes | Yes | Yes (Ubuntu resolute main) | No |
| LZ4 | Compression | Yes | Yes | Yes (Ubuntu resolute main, v1.10.0+) | No |
| zstd | Compression | Yes | Yes | Yes (Ubuntu resolute main) | No |

The two hard blockers for a riscv64 build are MKL-ML and xbyak. Both are x86-only and must be disabled via CMake flags (`-DWITH_MKLML=OFF -DWITH_MKLDNN=OFF`). Since Paddle-Lite's x86 path auto-disables these when cross-compiling for ARM (via `cmake/os/common.cmake`), the same mechanism would apply to riscv64 once a toolchain file exists. The infrastructure dependencies (FlatBuffers, Protobuf, gflags, glog, gtest, OpenMP, zlib, LZ4, zstd, OpenBLAS) are all available in Ubuntu 26.04 riscv64 and are not blockers.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4825](https://github.com/PaddlePaddle/Paddle-Lite/issues/4825) | Has anyone tried deploying to K210 board? | Closed 2020-11-29 | Informational | Only RISC-V mention in project history. Maintainer confirmed: "not supported." No roadmap response given. |
| [#10480](https://github.com/PaddlePaddle/Paddle-Lite/issues/10480) | When will paddle support RV1106 chip? | Closed 2025-01-26 | Informational | RV1106 is a Rockchip RISC-V SoC. Closed without RISC-V support being added. |
| [#10437](https://github.com/PaddlePaddle/Paddle-Lite/issues/10437) | INT8 quantized model severe performance regression on ARM Android | Open (updated 2025-01-24) | High - performance | On Khadas Edge2 (Cortex-A76 @2.2GHz): ResNet50 fp32=216ms, ResNet50 int8=281ms. INT8 is 3.2x slower than fp32; expected ~87ms. Affects ARM, not riscv64, but indicates active correctness/performance debt. |
| [#10714](https://github.com/PaddlePaddle/Paddle-Lite/issues/10714) | ARM int8/uint8 calib dequant SEGV on exact-size buffers | Open (created 2026-07-30) | Medium - correctness/safety | ARM `int8_to_fp32` NEON loads read past `numel` on exact-size external buffers. Intermittent SEGV via `ShareExternalMemory`. |
| [#10694](https://github.com/PaddlePaddle/Paddle-Lite/issues/10694) | PP-HumanSeg output correctness error on LoongArch64 | Open (created 2025-09-06) | High - correctness | Output mean=9.96e-06, std=1.47e-05 on LoongArch64 vs correct output on x86_64. Directly relevant as a RISC-V analog: new architecture ports have correctness bugs even after initial compilation. |
| [Paddle #75010](https://github.com/PaddlePaddle/Paddle/issues/75010) | Cross-compilation for RISC-V from x86 broken | Open (created 2025-09-01) | Build blocker (main Paddle, not Lite) | `eager_generator` binary compiled as RISC-V during x86 cross-compilation, cannot execute on host. `WITH_RISCV=ON` flag exists in main Paddle but cross-compilation is broken in Paddle 2.6. |

There are no riscv64-specific correctness or performance bugs in Paddle-Lite because riscv64 has never been attempted. Issue #10694 (LoongArch64 correctness) is the most relevant signal: it shows that Paddle-Lite has correctness bugs on non-ARM architectures even when a port is attempted, and that those bugs remain open.

## 12. Objections and Upstream Blockers

**No stated objections exist** because no RISC-V port has been proposed. The 2020 maintainer response to the K210 question ("not supported") was a statement of current status, not a rejection of future work. The "any plans?" follow-up question received no response.

**Technical blockers:**

1. No `LITE_WITH_RISCV` CMake option exists. The build system has no riscv64 code path.
2. No `cmake/os/riscv64.cmake` toolchain file exists.
3. No `lite/backends/riscv/` directory exists. The `host/` backend (pure C++ fallback, 239 kernel files) could serve as a starting point for a scalar-only port, but this has not been done.
4. No `kRISCV` entry in the `TargetType` enum in `lite/api/paddle_place.h`.
5. The ARM backend's deep NEON/SVE optimization (186 math files, hand-written inline assembly) has no RVV equivalent. A scalar-only port would be functionally correct but performance-uncompetitive.
6. The LoongArch64 correctness bug (#10694, open) demonstrates that non-ARM ports require significant validation work beyond initial compilation.

**Organizational blockers:**

1. Baidu controls all technical direction. External contributors can submit PRs but cannot merge without Baidu maintainer approval.
2. Both LoongArch PRs (#10477, #10624) were closed without merge, suggesting Baidu is not actively accepting new architecture ports from external contributors at this time [NEEDS VERIFICATION on current policy].
3. The project shows signs of reduced maintainer activity (last release v2.14-rc July 2024, last commit May 2025, community questions about abandonment).
4. Baidu is not a RISE member. There is no organizational channel for RISE to influence Paddle-Lite's roadmap.

**Acceptance probability:** Low. The combination of Baidu-only governance, apparent maintenance slowdown, two unmerged LoongArch PRs, and zero RISC-V engagement over five years of community requests indicates that upstream acceptance of a RISC-V port would require either Baidu internal prioritization or a sustained external contribution effort with no guarantee of merge.

## 13. Readiness Assessment

- **Color:** Red (confirmed broken/non-functional on riscv64 - architecture entirely absent)
- **Release provider:** None

The project has zero RISC-V support at every level: no backend directory, no CMake option, no toolchain file, no kernel implementations, no CI, no release artifacts, and no open work items. The only RISC-V mentions in the project's five-year history are two closed community questions (2020, 2024) answered with "not supported." This is not a stalled port or a partial implementation - it is a complete absence. The `red` grade reflects that riscv64 is confirmed non-functional: the architecture cannot be targeted at all, not even with a scalar fallback, because the build system has no riscv64 code path. See [Issue #4825](https://github.com/PaddlePaddle/Paddle-Lite/issues/4825) and the full backend directory inventory confirming zero riscv64 files across 5,406 repository entries.

No pending work exists that would change this grade. There are no open RISC-V PRs, no RISE involvement, and no funded work items. The two LoongArch PRs (#10477, #10624) that were closed without merge suggest the upstream is not currently accepting new architecture ports.

## 14. Investment Analysis

RISE has no prior investment in PaddlePaddle Lite. All work described below is greenfield.

### 14.1 Functional Enablement

The minimum viable port requires: (1) `cmake/os/riscv64.cmake` toolchain file; (2) `LITE_WITH_RISCV` CMake option and integration into `CMakeLists.txt`; (3) `riscv64` entry in `build_linux.sh --arch`; (4) `kRISCV` target type in `lite/api/paddle_place.h`; (5) a scalar kernel backend under `lite/backends/riscv/` or reuse of the existing `lite/backends/host/` generic C++ backend; (6) disabling x86-specific paths (MKL-ML, xbyak) for riscv64 builds; (7) validation against the existing ARM test suite to catch correctness issues analogous to #10694.

The `host/` backend (239 kernel files, pure C++) provides a scalar fallback that could be reused or adapted. This would produce a functionally correct but unoptimized riscv64 build.

Estimated effort: 4-8 person-weeks for a scalar-only functional port, assuming the `host/` backend can be reused with minimal modification and upstream maintainers are responsive to review.

### 14.2 Performance Optimization

A scalar-only port using the `host/` backend would be significantly slower than the ARM backend. Closing the performance gap requires RVV (RISC-V Vector) kernel implementations for the high-impact operators: convolution, GEMM, depthwise convolution, pooling, and activation functions. The ARM backend's 186 math files represent the scope of work needed for full parity.

Estimated effort: 20-40 person-weeks for RVV-optimized kernels covering the top-10 operators by inference time (convolution, GEMM, depthwise conv, batch norm, activation). Full parity with the ARM backend (FP16, INT8, SVE-equivalent RVV) would require 60-100 person-weeks.

### 14.3 CI/CD Infrastructure

The project has no GitHub Actions CI at all (the `.github/workflows/` directory does not exist). Adding riscv64 CI requires: (1) creating a GitHub Actions workflow for riscv64 cross-compilation; (2) adding QEMU-based riscv64 test execution or use of RISE native runners; (3) integrating with the existing `tools/ci_tools/` script structure.

Estimated effort: 2-3 person-weeks to add cross-compilation CI; 1-2 additional person-weeks to add QEMU or RISE runner-based test execution.

### 14.4 Ecosystem Enablement

The `paddlelite` PyPI package has no riscv64 wheels. Building riscv64 wheels requires: (1) functional riscv64 build (Section 14.1); (2) manylinux-compatible riscv64 wheel build infrastructure; (3) upload to PyPI or RISE wheel builder.

Estimated effort: 2-3 person-weeks after functional enablement is complete.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | CMake toolchain file, LITE_WITH_RISCV option, build_linux.sh integration | 1 | External contributor / RISE | Critical |
| Functional | kRISCV target type, API integration | 1 | External contributor / RISE | Critical |
| Functional | Scalar backend (reuse host/ or new riscv/ directory) | 2-4 | External contributor / RISE | Critical |
| Functional | Disable x86-only deps (MKL-ML, xbyak) for riscv64 | 0.5 | External contributor / RISE | Critical |
| Functional | Correctness validation (analogous to LoongArch #10694) | 2-3 | External contributor / RISE | Critical |
| Performance | RVV kernels for top-10 operators (conv, GEMM, depthwise, BN, activation) | 20-40 | External contributor / RISE | High |
| Performance | FP16 and INT8 RVV kernels | 20-30 | External contributor / RISE | Medium |
| CI/CD | GitHub Actions riscv64 cross-compilation workflow | 1-2 | External contributor / RISE | High |
| CI/CD | QEMU or RISE runner test execution | 1-2 | External contributor / RISE | High |
| Ecosystem | riscv64 PyPI wheel build and upload | 2-3 | External contributor / RISE | Medium |
| Upstream | Maintainer engagement and PR review coordination | 2-4 (ongoing) | RISE / Baidu | Critical |

**Total for functional enablement:** 6-10 person-weeks.
**Total for functional + CI + ecosystem:** 10-16 person-weeks.
**Total for full performance parity:** 50-90 person-weeks.

The dominant risk is upstream acceptance. Both LoongArch PRs were closed without merge. Any investment should be preceded by direct engagement with Baidu maintainers to confirm willingness to review and merge a riscv64 port before committing engineering resources.

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [PaddlePaddle/Paddle-Lite repository](https://github