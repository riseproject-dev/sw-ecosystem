---
title: TensorFlow Lite Micro (TFLM)
parent: Project Reports
color: orange
---

# TensorFlow Lite Micro (TFLM)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for TensorFlow Lite Micro (TFLM)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

TensorFlow Lite Micro (TFLM) is a C++17 inference runtime for microcontrollers and embedded systems. It is the MCU-focused subset of the TFLite codebase, maintained in a separate repository ([tensorflow/tflite-micro](https://github.com/tensorflow/tflite-micro)) under the `tensorflow` GitHub organization. As of September 4, 2024, TFLite was rebranded to LiteRT; the microcontrollers variant is now marketed as "LiteRT for Microcontrollers." The GitHub repository and codebase are unchanged by the rebrand.

TFLM is architecturally distinct from full TFLite/LiteRT. It uses a GNU Make build system (not Bazel), has no XNNPACK dependency, no Eigen dependency, and no dynamic memory allocation. It targets devices with tens to hundreds of kilobytes of RAM. The primary deployment targets are Arm Cortex-M (with CMSIS-NN optimized kernels), Xtensa DSP (with nnlib-hifi4 kernels), and Hexagon DSP. RISC-V is a secondary target with reference-only kernels.

**Governance:** Google-owned, Google-led. Community governance is exercised through SIG Micro (Special Interest Group for Microcontrollers), a TensorFlow community structure with a public charter at [tensorflow/community](https://github.com/tensorflow/community/blob/master/sigs/micro/CHARTER.md). There is no independent foundation. The license is Apache-2.0. Google CLA is required for contributions.

**Corporate maintainers:**
- Advait Jain (Google) - SIG Micro co-lead, core maintainer
- Neil Tan (Arm) - SIG Micro co-lead
- veblush (Google) - CI and GitHub Actions owner (CODEOWNERS)
- Pete Warden (originally Google, now Useful Sensors) - creator, authored first RISC-V commit

**Platform tier policy:** TFLM uses an informal tiering model documented in [new_platform_support.md](https://github.com/tensorflow/tflite-micro/blob/main/tensorflow/lite/micro/docs/new_platform_support.md). Tier 1 (in-tree, optimized) covers Arm Cortex-M, Hexagon DSP, and Xtensa. Tier 2 (in-tree CI, reference kernels) covers RISC-V (`riscv32_generic`). Community-supported platforms (Arduino, ESP32, etc.) are maintained in vendor-owned external repos. The team's stated preference is the external-repo model for new ports; in-tree ports require an ongoing maintenance commitment.

**Community culture on new ports:** The team is welcoming but explicitly hands-off for vendor-specific ports. Issue #407 (2021) established the policy of moving platform-specific code to external repositories. Issue #3107 (riscv64 support offer, 2025) was closed as stale after 8 months with zero maintainer engagement, which is the clearest signal of current maintainer bandwidth for new RISC-V targets.

**RISE membership:** Google LLC is a Premier Member of the RISE project (EUR 80,000/year, Governing Board seat). TFLM itself is not a RISE project and has no RISE-funded work. TFLM appears as item #3 of 70 in the RISE project queue (`project-reports/queue.yml`) but no dedicated RISE report has been written.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-06-19 | First user reports: `TARGET=riscv32_mcu` build broken (makefile target name mismatch, missing `fixedpoint.h`) | [Issue #203](https://github.com/tensorflow/tflite-micro/issues/203) |
| 2021-07-26 | Pete Warden (Google) merges emergency RISC-V build fix; `riscv32_generic` target established | [PR #321](https://github.com/tensorflow/tflite-micro/pull/321) |
| 2021-07-27 | RISC-V nightly CI script added | [PR #327](https://github.com/tensorflow/tflite-micro/pull/327), [PR #334](https://github.com/tensorflow/tflite-micro/pull/334) |
| 2021-08-02 | Zephyr `zephyr_vexriscv` build fixed | [PR #333](https://github.com/tensorflow/tflite-micro/pull/333) |
| 2021-08-13 | Policy decision: move all platform-specific code to external repos | [Issue #407](https://github.com/tensorflow/tflite-micro/issues/407) |
| 2021-10-19 | Renode-based simulation added for HiFive1 (first actual test execution, not just compilation) | [PR #547](https://github.com/tensorflow/tflite-micro/pull/547) |
| 2023-04-25 | NumPy added to RISC-V CI environment | [PR #1926](https://github.com/tensorflow/tflite-micro/pull/1926) |
| 2023-06-13 | CI switched from untestable `mcu_riscv` (SiFive FE310) to `riscv32_generic` with QEMU; Docker container introduced | [PR #2035](https://github.com/tensorflow/tflite-micro/pull/2035), [PR #2041](https://github.com/tensorflow/tflite-micro/pull/2041) |
| 2023-06-15 | Legacy/untestable RISC-V targets removed | [PR #2061](https://github.com/tensorflow/tflite-micro/pull/2061) |
| 2024-02-07 | `-march`, `-mabi`, `-mcmodel` made configurable in RISC-V makefile | [PR #2447](https://github.com/tensorflow/tflite-micro/pull/2447) |
| 2025-05-23 | Community contributor (cordawyn) reports successful riscv64 compilation in a fork, offers PR | [Issue #3107](https://github.com/tensorflow/tflite-micro/issues/3107) |
| 2026-01-06 | PR #3280 opened: RISC-V 32-bit vector intrinsics kernels (4.1x cycle reduction on person_detection) | [PR #3280](https://github.com/tensorflow/tflite-micro/pull/3280) |
| 2026-01-20 | CI refactored into modular suites; `suite_riscv.yml` created | [PR #3307](https://github.com/tensorflow/tflite-micro/pull/3307) |
| 2026-02-16 | Issue #3107 (riscv64 support) closed as stale with zero maintainer engagement | [Issue #3107](https://github.com/tensorflow/tflite-micro/issues/3107) |
| 2026-07-24 to 2026-08-14 | RISC-V CI broken for ~3 weeks (HardSwishTest quantization range mismatch) | [Issue #3636](https://github.com/tensorflow/tflite-micro/issues/3636), [PR #3640](https://github.com/tensorflow/tflite-micro/pull/3640) |

**Key contributors:**
- Pete Warden (Google/Useful Sensors) - initial RISC-V port
- ddavis-2015 (Google) - CI maintenance, issue triage
- veblush (Google) - CI infrastructure, PR #3640 (HardSwish fix)
- cordawyn (community) - riscv64 fork (unmerged)
- Student team (unidentified affiliation) - PR #3280 (RVV intrinsics, unmerged)

**Upstreaming status:** The riscv32 port is fully upstream. The riscv64 port does not exist upstream. The only riscv64 work is in a community fork ([cordawyn/tflite-micro, branch riscv64-generic](https://github.com/cordawyn/tflite-micro/tree/riscv64-generic)) that is 4 commits ahead and 186 commits behind main as of the research date, and was never submitted as a PR.

## 3. Upstream Support Tier

**Formal tier classification:** RISC-V (`riscv32_generic`) is Tier 2 in TFLM's platform model: in-tree with nightly QEMU CI, reference kernels only, no hardware in CI, no optimized kernel implementations. Tier 1 platforms (Cortex-M, Hexagon, Xtensa) have vendor-supplied optimized kernel backends.

**riscv64 has no tier.** It is not a recognized target in the upstream repository.

| Dimension | amd64 (x86_64) | arm64 (Cortex-M, Tier 1) | riscv32 (Tier 2) | riscv64 |
|---|---|---|---|---|
| In-tree target | Yes (`linux_x86_64`) | Yes (`cortex_m_*`) | Yes (`riscv32_generic`) | No |
| Optimized kernels | Yes (reference + CMSIS-NN for Cortex-M) | Yes (CMSIS-NN) | No (reference only) | No |
| CI | Yes, PR-gated | Yes, PR-gated | Nightly only, not PR-gated by default | None |
| Official binary | PyPI wheel (x86_64 only) | No (source build) | No (source build) | No |
| Hardware in CI | No (QEMU/native) | No (QEMU) | No (QEMU) | N/A |
| Release blocking | Yes | Yes | No | N/A |

## 4. Technical Architecture and RISC-V-Specific Subsystems

TFLM's architecture is a layered C++ framework: a FlatBuffers-based model parser, an interpreter/graph executor, a kernel registry, and platform HAL files (`debug_log.cc`, `micro_time.cc`, `system_setup.cc`). There is no JIT compiler, no GC, and no dynamic dispatch beyond the kernel registry lookup.

**RISC-V-specific code inventory (complete):**

| File | Lines | Purpose | ISA Extensions |
|---|---|---|---|
| `tensorflow/lite/micro/riscv32_generic/debug_log.cc` | 41 | Platform HAL - debug logging | None (pure C++) |
| `tensorflow/lite/micro/tools/make/targets/riscv32_generic_makefile.inc` | 58 | Build target definition | rv32imc only |
| `tensorflow/lite/micro/tools/ci_build/test_riscv.sh` | 43 | CI build and test script | N/A |
| `tensorflow/lite/micro/testing/test_with_qemu.sh` | 47 | QEMU runner (shared with riscv64 fork) | N/A |
| `tensorflow/lite/micro/testing/size_riscv32_binary.sh` | 67 | Binary size measurement | N/A |
| `tensorflow/lite/micro/testing/Dockerfile.riscv` | 24 | Renode-based HiFive1 emulation | N/A |
| `.github/workflows/run_riscv.yml` | 40 | CI entry point | N/A |
| `.github/workflows/suite_riscv.yml` | 29 | CI test suite runner | N/A |

The `riscv32_generic/` platform directory contains exactly one source file (`debug_log.cc`). There are no assembly files, no RVV intrinsics, no SIMD dispatch paths, and no RISC-V subdirectory under `kernels/`. The `kernels/` directory contains optimized subdirectories for `arc_mli`, `ceva`, `cmsis_nn`, `ethos_u`, and `xtensa` - but no `riscv` subdirectory.

**Component-level comparison:**

| Component | amd64 | arm64 (Cortex-M) | riscv32 | riscv64 |
|---|---|---|---|---|
| Convolution kernels | Reference C++ | CMSIS-NN (hand-tuned SIMD) | Reference C++ | Not applicable (no target) |
| Depthwise conv kernels | Reference C++ | CMSIS-NN | Reference C++ | Not applicable |
| Fully-connected kernels | Reference C++ | CMSIS-NN | Reference C++ | Not applicable |
| Pooling kernels | Reference C++ | CMSIS-NN | Reference C++ | Not applicable |
| Matrix multiply (ruy) | kStandardCpp scalar | ARM NEON path | kStandardCpp scalar | kStandardCpp scalar (if target existed) |
| FFT (kissfft) | Scalar C | Scalar C | Scalar C | Scalar C |
| Debug logging | Standard printf | `debug_log.cc` (platform HAL) | `debug_log.cc` (eyalroz_printf) | Not applicable |
| Vector extensions | None used | None (CMSIS-NN uses intrinsics, not vector) | None (PR #3280 pending) | None |

**PR #3280 (open, unreviewed as of research date):** A student team contribution of hand-written Zve32x vector intrinsics kernels for `riscv32`. Benchmarked on Spike simulator with VLEN=128: 4.1x cycle reduction for `person_detection` and 1.47x for `micro_speech` vs scalar baseline. Compiler auto-vectorization produces a 1.5x regression for `micro_speech` (i.e., auto-vectorization is harmful for that workload). This PR targets riscv32, not riscv64, and has been open since January 2026 without maintainer review.

**Known toolchain bug:** Linker relaxation produces incorrect code with the pinned SiFive GCC 8.1.0 toolchain. Workaround `LDFLAGS += -mno-relax` is hardcoded in `riscv32_generic_makefile.inc`. The upstream bug is tracked as `b/279805615` (Google-internal). Fix status is unknown from public sources.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make (minimum version 3.82). TFLM does not use Bazel for its own build. The Bazel complexity that affects full TensorFlow (tracked as RISE item SL_03_002) does not apply to TFLM.

**Toolchain (riscv32_generic, upstream):**

| Item | Value |
|---|---|
| Prefix | `riscv64-unknown-elf-` (bare-metal multilib) |
| Version | SiFive GCC 8.1.0 (snapshot 20181030, 2019 vintage) |
| Auto-download URL | `mirror.tensorflow.org/static.dev.sifive.com/dev-tools/riscv64-unknown-elf-gcc-20181030-x86_64-linux-ubuntu14.tar.gz` |
| ISA | `rv32imc` |
| ABI | `ilp32` |
| Code model | `medany` |
| libc | newlib-nano (`--specs=nano.specs`) |
| System alternative | `apt install gcc-riscv64-unknown-elf` |

**Toolchain (riscv64_generic, community fork only):**

| Item | Value |
|---|---|
| Prefix | `riscv64-linux-gnu-` (Linux userspace) |
| ISA | `rv64gc` |
| ABI | `lp64d` |
| Code model | `medany` |
| libc | glibc (system) |
| Install | `apt install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu libc6-dev-riscv64-cross` |

**Exact build commands (riscv32, upstream):**

```bash
# Download toolchain and third-party deps
make -f tensorflow/lite/micro/tools/make/Makefile \
  TARGET=riscv32_generic third_party_downloads

# Release build
make -j$(nproc) -f tensorflow/lite/micro/tools/make/Makefile \
  TARGET=riscv32_generic BUILD_TYPE=release build

# Debug build and test via QEMU
make -j$(nproc) -f tensorflow/lite/micro/tools/make/Makefile \
  TARGET=riscv32_generic BUILD_TYPE=debug test
```

**Exact build commands (riscv64, community fork only):**

```bash
apt install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu libc6-dev-riscv64-cross

make -f tensorflow/lite/micro/tools/make/Makefile \
  TARGET=riscv64_generic TARGET_ARCH=riscv64 \
  TARGET_TOOLCHAIN_ROOT=/usr/bin/ BUILD_TYPE=debug test \
  QEMU_EXTRA_ARGS="-L /usr/riscv64-linux-gnu"
```

**QEMU usage:** The upstream CI uses `qemu-riscv32 -cpu rv32` (user-mode emulation, not full-system). The community fork uses `qemu-riscv64 -cpu rv64 -L /usr/riscv64-linux-gnu`. The `-L` flag is required for shared library resolution in the riscv64 Linux case. The CI Docker image (`ghcr.io/tflm-bot/tflm-ci:0.6.7`) installs `qemu-user` from Debian bookworm-backports to avoid a known QEMU bug ([QEMU issue #1697](https://gitlab.com/qemu-project/qemu/-/issues/1697)) that causes riscv32 user-mode emulation failures.

**Known build failures:**
- `memory_arena_threshold_test.cc` is disabled on `riscv32_generic` (bug `b/158651472`)
- `USE_TFLM_COMPRESSION` is not supported on `riscv32_generic` (only `linux`/`xtensa`)
- Linker relaxation bug requires `-mno-relax` (bug `b/279805615`)
- Issue #3193: user confusion between `qemu-system-riscv32` (full-system, requires BIOS) and `qemu-riscv32` (user-mode, runs Linux ELF directly); the `riscv32_generic` target requires user-mode QEMU

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (riscv64 vs amd64/arm64):**

| Feature | amd64 | arm64 (Cortex-M) | riscv32 | riscv64 |
|---|---|---|---|---|
| Build and run inference | Yes | Yes | Yes | No (no upstream target) |
| Run test suite | Yes | Yes | Yes (QEMU) | No |
| PyPI wheel available | Yes | No | No | No |
| TFLM compression | Yes | No | No | No |
| Memory arena threshold test | Yes | Yes | No (disabled) | No |
| Zephyr RTOS integration | Yes | Yes | Partial (vexriscv target, historical) | No |

**Performance gaps (riscv32 vs Cortex-M, as proxy for riscv64 vs arm64):**

All RISC-V inference uses scalar reference C++ kernels. Cortex-M uses CMSIS-NN hand-tuned SIMD kernels. The performance delta is not quantified in the research findings for a direct riscv32 vs Cortex-M comparison on the same model. The only available cross-architecture data point is from the research findings: TFLM reference kernels on x86_64 are approximately 30x slower than TFLite with XNNPACK on the same hardware ([Issue #1637](https://github.com/tensorflow/tflite-micro/issues/1637)), which establishes the magnitude of the gap between reference kernels and optimized backends. For riscv64, the gap vs arm64 would be of similar order until RVV kernels are implemented.

**Quantization correctness gap (affects all architectures including riscv64):**

Issue #3252 documents a Double Rounding bug in TFLM reference kernels producing approximately 1.8% off-by-one error rate in quantized outputs. This is a correctness gap vs TFLite (which uses single rounding). Models that pass TFLite validation can fail on TFLM deployment. This bug is open as of the research date and affects any riscv64 deployment.

**Floating-point precision gap:** Issue #3271 documents 9 kernel files with float-to-double precision loss ("Fouble" bug) causing state drift in recurrent models. Open as of research date.

## 7. CI/CD Infrastructure

**riscv32 CI (upstream):**

| Attribute | Value |
|---|---|
| Workflow file | `.github/workflows/run_riscv.yml` -> `.github/workflows/suite_riscv.yml` |
| Trigger | Daily schedule (10:00 UTC) + `workflow_dispatch`; on PRs only when `ci:full` label is applied |
| Runner | `ubuntu-latest` (x86_64 GitHub-hosted runner) |
| Execution | Docker container `ghcr.io/tflm-bot/tflm-ci:0.6.7` |
| Test method | `qemu-riscv32 -cpu rv32` (user-mode emulation) |
| Target | `riscv32_generic` (rv32imc, bare-metal) |
| Failure handling | Auto-creates GitHub issue via `issue_on_error.yml` |
| Recent status | Active; 5 consecutive failures Jul 24 - Aug 14, 2026 (Issue #3636), resolved by PR #3640 |

**riscv64 CI:** None. Zero riscv64 CI exists anywhere in the upstream repository. Confirmed by: `gh search prs "riscv64 repo:tensorflow/tflite-micro"` returning 0 results, `gh search commits "riscv64 repo:tensorflow/tflite-micro"` returning 0 results, and direct inspection of all 26 workflow files.

**RISE runners:** No TFLM CI workflow uses RISE-provided riscv64 runners (`runs-on: ubuntu-24.04-riscv`). No TFLM-related repository exists in `org:riseproject-dev`.

| CI dimension | amd64 | arm64 | riscv32 | riscv64 |
|---|---|---|---|---|
| CI exists | Yes | Yes | Yes (nightly) | No |
| PR-gated | Yes | Yes | No (label required) | No |
| Native runner | Yes | Yes | No (x86 + QEMU) | No |
| RISE runner | N/A | N/A | No | No |
| Hardware in CI | No | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases:** The `tensorflow/tflite-micro` repository has zero GitHub binary releases. The project page explicitly states "There aren't any releases here."

**PyPI (`tflite-micro`):** 209 nightly dev builds exist (earliest: `0.dev20231010131554`, latest as of research: `0.dev20260828023337`). Every wheel across all 209 releases carries the platform tag `manylinux_2_28_x86_64` only. Zero riscv64 wheels exist in the entire release history. There are no stable versioned releases - only rolling nightly dev builds.

**Ubuntu 26.04 (resolute) riscv64:** No TFLM package exists. Searches for `tflite-micro`, `tensorflow-lite-micro`, `libtflite-micro`, and `python3-tflite-micro` return zero results. Note: `libtensorflow-lite-dev` (443.9 kB) and `libtensorflow-lite2.14.1` (1,301.9 kB) do exist for riscv64 in resolute, but these are from the `tensorflow` source package (full TFLite), which is a completely separate project from TFLM.

**RISE wheel builder:** TFLM is not listed in the 70-package supported list at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/packages/supported_packages.html). TFLM is a C++ bare-metal inference framework, not a Python wheel.

**What a user must do to get a working riscv64 binary:**
1. Clone the community fork ([cordawyn/tflite-micro, branch riscv64-generic](https://github.com/cordawyn/tflite-micro/tree/riscv64-generic))
2. Install `gcc-riscv64-linux-gnu`, `g++-riscv64-linux-gnu`, `libc6-dev-riscv64-cross`, and `qemu-user`
3. Build from source using the community fork's `riscv64_generic_makefile.inc`
4. Run tests with `qemu-riscv64 -cpu rv64 -L /usr/riscv64-linux-gnu`

No official binary path exists for riscv64.

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| FlatBuffers v25.9.23 | Model serialization | Builds (pure C++) | Passes (scalar) | `libflatbuffers-dev` in Ubuntu 26.04 riscv64 | No riscv64 CI upstream; `flatc` binary not pre-built for riscv64 |
| kissfft v130 | FFT kernels (MFCC, audio ops) | Builds (pure C) | Passes | `libkissfft-dev` in Ubuntu 26.04 riscv64 | Architecture-agnostic |
| ruy (git 54774a7a) | Matrix multiply backend | Builds (scalar fallback) | No riscv64 CI | `libruy-dev` in Ubuntu 26.04 riscv64 | No `RUY_PLATFORM_RISCV` macro; no RVV kernels; primary performance bottleneck |
| gemmlowp (git fda83bdc) | Legacy quantized matmul (int8 fallback) | Builds (scalar fallback) | No riscv64 CI | `libgemmlowp-dev` in Ubuntu 26.04 riscv64 | No RISC-V detection in `detect_platform.h`; maintenance mode (superseded by ruy) |
| CMSIS-NN (ARM-software) | Cortex-M optimized NN kernels | Not applicable | Not applicable | Not applicable | ARM Cortex-M only by design; TFLM uses reference C kernels on all non-ARM targets |
| Pigweed (google/pigweed) | Embedded utilities (logging, span, assert) | Builds | No riscv64 CI | No Ubuntu package (source only) | Upstream Pigweed has `pw_cpu_exception_risc_v` module; not a blocker |
| eyalroz_printf (git f8ed5a9) | Embedded printf replacement (no heap) | Builds (pure C) | Passes | No Ubuntu package (source only) | Architecture-agnostic |
| nnlib-hifi4 (foss-xtensa) | Xtensa HiFi4 DSP NN kernels | Not applicable | Not applicable | Not applicable | Xtensa-only by design |
| NumPy (Python pip) | Model conversion / test utilities | Builds | Passes | `python3-numpy` in Ubuntu 26.04 riscv64 | Build-time / test utility only |
| TensorFlow (Python pip) | Model training / .tflite generation | No riscv64 wheel | Not tested | No riscv64 PyPI wheel | Build-time only (model conversion); not needed at inference time |

**Deep-dive: ruy**

ruy is the matrix multiply backend used by TFLM for fully-connected and other dense matmul operations. On riscv64, ruy falls through to the `kStandardCpp` scalar path because there is no `RUY_PLATFORM_RISCV` macro and no RVV kernel implementations. The project is in maintenance mode with no stated plan for a RISC-V port. This is the primary performance bottleneck for matrix-multiply-heavy models on any RISC-V target. The Ubuntu 26.04 riscv64 package `libruy-dev` (v0.0.0~git20230215.21a85fe-3) exists but provides only the scalar path.

**Deep-dive: FlatBuffers**

FlatBuffers is used for zero-copy deserialization of the .tflite model flatbuffer. The C++ runtime is pure C++ with no SIMD and builds cleanly on riscv64. The `flatc` compiler binary (used at model conversion time, not inference time) is not pre-built for riscv64 but can be built from source. The `libflatbuffers-dev` package exists in Ubuntu 26.04 riscv64. See [project-reports/flatbuffers.md](project-reports/flatbuffers.md) for the full report.

## 11. Known Bugs and Active Issues

**RISC-V-specific:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #3280](https://github.com/tensorflow/tflite-micro/pull/3280) | RISC-V 32-bit vector intrinsics kernels | Open (unreviewed since Jan 2026) | Performance gap | 4.1x cycle reduction for person_detection on Spike/Zve32x; targets riscv32 only |
| [Issue #3636](https://github.com/tensorflow/tflite-micro/issues/3636) | CI Failure: Run-RISCV | Closed (resolved Aug 14, 2026) | Infrastructure | HardSwishTest output_min=0.f outside valid HardSwish range [-3/8, inf); RISC-V-specific failure; fixed by PR #3640 |
| [Issue #3193](https://github.com/tensorflow/tflite-micro/issues/3193) | RISCV32 QEMU is not working | Closed (stale) | Usability | User confusion: `qemu-system-riscv32` vs `qemu-riscv32`; no fix needed, documentation gap |
| [Issue #3107](https://github.com/tensorflow/tflite-micro/issues/3107) | Support for RISCV64 | Closed (stale, Feb 2026) | Feature gap | Community fork exists; zero maintainer engagement; no PR submitted |
| b/279805615 | Linker relaxation produces incorrect RISC-V code | Unknown (Google-internal) | Correctness | Workaround: `-mno-relax` hardcoded in makefile |

**Cross-platform correctness bugs (affect any riscv64 deployment):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #3252](https://github.com/tensorflow/tflite-micro/issues/3252) | Standardize TFLM Reference Kernels to Single Rounding Requantization | Open | High | ~1.8% off-by-one error rate from Double Rounding; models pass TFLite validation but fail on TFLM deployment ("Validation Trap") |
| [Issue #3271](https://github.com/tensorflow/tflite-micro/issues/3271) | Fix "Fouble" precision errors across TFLM Kernels | Open | High | 9 kernel files with float-to-double precision loss; state drift in recurrent models |
| [Issue #3674](https://github.com/tensorflow/tflite-micro/issues/3674) |