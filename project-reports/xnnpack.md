---
title: XNNPACK
categories:
  - libraries
  - ai-ml
---

# XNNPACK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for XNNPACK<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

XNNPACK is a high-performance neural network inference kernel library maintained by Google under the BSD 3-Clause license. It is the CPU backend for TensorFlow Lite, PyTorch Mobile/ExecuTorch, and MediaPipe. The library is source-only with no versioned releases; consumers pin to git commits via CMake `FetchContent` or Bazel workspace rules. Governance is Google-internal: all code flows through Google's internal Piper monorepo via a `copybara-service[bot]` import mechanism. There is no independent steering committee, no MAINTAINERS file, and no public RFC process.

XNNPACK explicitly lists RISC-V as a supported inference platform in its README alongside ARM and x86: "a highly optimized solution for neural network inference on ARM, x86, WebAssembly, and RISC-V platforms." Targets stated as supported: RV32GC and RV64GC.

The project has no versioned GitHub releases. The [releases page](https://github.com/google/XNNPACK/releases) is empty.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port was initiated by Google's primary XNNPACK maintainer, not by an external contributor. This is a meaningful signal: the port is architecturally integrated, not a peripheral patch series.

| Date | Event | PR/Issue | Author |
|---|---|---|---|
| Jun 28, 2022 | First RISC-V commit: `cmake/riscv64.toolchain` and `scripts/build-linux-riscv64.sh`, enabling cross-compilation targeting `riscv64-linux-gnu` via QEMU. Commit SHA: `c27614d`. | - | Marat Dukhan (Google) |
| Jul 27, 2022 | Bazel build target `:riscv64` added. | [PR #3288](https://github.com/google/XNNPACK/pull/3288) | - |
| Dec 13, 2023 | CI job `cmake-linux-riscv64` added with RISC-V Vector (RVV) enabled. | [PR #5829](https://github.com/google/XNNPACK/pull/5829) | bhbruce, phoebesv |
| Jan 2024 | RVV vbinary f32 kernels added. CI migrated to Clang toolchain. | [PR #5877](https://github.com/google/XNNPACK/pull/5877) | phoebesv |
| Apr-May 2024 | F32-GEMM and F32-RSUM RVV kernels added. F32-RSUM subsequently disabled on RISC-V due to multi-thread correctness issue. | [PR #5893](https://github.com/google/XNNPACK/pull/5893), [PR #5940](https://github.com/google/XNNPACK/pull/5940), [PR #6450](https://github.com/google/XNNPACK/pull/6450) | - |
| Jul 2024 | Sharded test macro added to split slow tests under QEMU. | [PR #6724](https://github.com/google/XNNPACK/pull/6724) | - |
| Aug 2024 | QS8/QU8 vadd/vaddc RVV kernels added. | [PR #5776](https://github.com/google/XNNPACK/pull/5776) | - |
| Jan-Mar 2025 | RISC-V CI Dockerized. `riscv-gnu-toolchain` updated to verified release. Ubuntu 22.04 to 24.04 upgrade. | [PR #9422](https://github.com/google/XNNPACK/pull/9422), [PR #9423](https://github.com/google/XNNPACK/pull/9423), [PR #8157](https://github.com/google/XNNPACK/pull/8157) | alexander-shaposhnikov, gonnet |
| Feb 2025 | QS8-DWCONV and QS8-GEMM/IGEMM RVV kernels added. Benchmarks on SpacemiT K1 show 10x-18x speedup over scalar. | [PR #7638](https://github.com/google/XNNPACK/pull/7638), [PR #7639](https://github.com/google/XNNPACK/pull/7639) | - |
| Mar-Apr 2025 | riscv64 and riscv64-rvv GitHub Actions workflows consolidated into one. RVV transpose enabled only on RISC-V. | [PR #9665](https://github.com/google/XNNPACK/pull/9665), [PR #8270](https://github.com/google/XNNPACK/pull/8270) | dsharletg |
| Jan-Feb 2026 | F16 (Zvfh) vunary and vbinary RVV kernels added. `XNN_ENABLE_RISCV_FP16_VECTOR` enabled unconditionally -- regression introduced. | [PR #9516](https://github.com/google/XNNPACK/pull/9516) | ken-unger |
| Mar 2026 | QEMU updated to 10.2.1. Partial fix for `RISCV_HWPROBE_EXT_ZVFH` macro missing under Clang 19.1. | [PR #9739](https://github.com/google/XNNPACK/pull/9739), [PR #9903](https://github.com/google/XNNPACK/pull/9903) | ken-unger |
| Apr 2026 | Maxpool/avgpool RVV kernels added. Complete RVV reduce kernels added. More F16 unary RVV kernels added. | [PR #9622](https://github.com/google/XNNPACK/pull/9622), [PR #9692](https://github.com/google/XNNPACK/pull/9692), [PR #9693](https://github.com/google/XNNPACK/pull/9693) | ken-unger |

The cadence of merged RISC-V PRs has accelerated: roughly 5 per year in 2022-2023, roughly 15 in 2024, and more than 20 in the 18-month window covering 2025 and the first half of 2026.

There is no master tracking issue or RISC-V roadmap document in the repository.

---

## 3. Upstream Support Tier

XNNPACK does not publish a platform tier policy (no PLATFORMS.md, SUPPORT.md, or equivalent document). However, upstream behavior defines an implicit tier:

- RISC-V has a dedicated CI job (`cmake-linux-riscv64`) that triggers on every PR approval and every non-master branch push.
- The port was initiated by the project's primary maintainer (Marat Dukhan), not an external contributor.
- The README lists RISC-V alongside ARM and x86 as supported inference platforms.
- More than 300 RISC-V-specific source files exist in the repository (PROD and NON-PROD kernels combined).

These indicators place RISC-V at the level of a maintained tier, not an experimental port. However, several conditions weaken this classification relative to ARM and x86:

- All CI is QEMU-emulated on x86_64 runners. No native riscv64 hardware runner exists in the CI infrastructure.
- Operator tests are unconditionally excluded from CI via `--label-exclude operator`.
- Tests are not run on merge to master (`on-pr-merge-to-master.yml` passes `run-tests: false`).
- One open issue ([#9886](https://github.com/google/XNNPACK/issues/9886)) documents 100+ test failures in the current CI environment as of April 2026. The CI is currently broken for RVV FP16.
- A cpuinfo build failure for RISC-V ([issue #4650](https://github.com/google/XNNPACK/issues/4650)) has been open unresolved since April 2023 -- three years.

Correct characterization: RISC-V is a first-class declared target with a real kernel investment, but second-class test coverage relative to arm64 and amd64, and currently broken FP16 CI.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 ISA Extensions Targeted

| Extension | Status | Notes |
|---|---|---|
| RVV v1.0 (V extension) | Production | Base vector; all f32/int8 kernels |
| Zvfh (FP16 vector) | Production but broken detection | 70 production kernels; runtime detection is defective (see section 11) |
| Zba, Zbb, Zbc, Zbs | QEMU configured, no kernels | Set in `cmake/riscv64.toolchain` QEMU CPU string; no kernel naming convention uses these |
| BF16 (Zfbfmin, Zvfbfmin) | Missing | No RVV BF16 kernels anywhere in the codebase |

### 4.2 Hardware Detection

Located in `src/configs/hardware-config.c` and `src/xnnpack/hardware-config.h`, guarded by `XNN_ARCH_RISCV`:

- **RVV detection:** `getauxval(AT_HWCAP) & COMPAT_HWCAP_ISA_V`
- **Zvfh detection:** `riscv_hwprobe` syscall (number 258), flag `RISCV_HWPROBE_EXT_ZVFH = (1ULL << 30)`, with fallback for Linux kernels older than 6.4
- **Vector length:** inline assembly `.word 0xC22022F3` (CSRR t0, vlenb) at startup; result stored in `hardware_config.vlenb`
- **Flags exposed:** `xnn_arch_riscv_vector` (bit 0), `xnn_arch_riscv_vector_fp16_arith` (bit 1)

All kernel tile sizes are computed dynamically from `vlenb` at runtime. There are no hardcoded VLEN=128/256/512 assumptions in the dispatch or microkernel code.

The `RISCV_HWPROBE_EXT_ZVFH` macro is absent in Clang 19.1; [PR #9903](https://github.com/google/XNNPACK/pull/9903) added a compile-time guard. However, the runtime detection logic is defective in a different way: [PR #9516](https://github.com/google/XNNPACK/pull/9516) changed `xnn_arch_riscv_vector_fp16_arith` to be unconditionally set whenever the V extension is present, bypassing the `cpuinfo_has_riscv_zvfh()` call. This is the root cause of [issue #9886](https://github.com/google/XNNPACK/issues/9886).

### 4.3 Kernel Implementation Style

All RISC-V kernels are written in C using `<riscv_vector.h>` intrinsics (`vfloat32m4_t`, `__riscv_vfmacc_vf_f32m4`, etc.). The files under `src/` with the `-rvv.c` or `-rvvfp16arith.c` suffix are auto-generated from `.c.in` templates by the `tools/xngen` code generator.

Two non-generated, hand-written files exist:
- `src/f32-argmaxpool/f32-argmaxpool-9p8x-rvv-u1v.c` (attributed to Imagination Technologies)
- `src/f32-conv-hwc2chw/f32-conv-hwc2chw-3x3s2p1c3x2v-rvv-2x2.c`

There are no hand-written `.S` assembly files for RISC-V. There is no JIT backend for RISC-V. The intrinsics-only style is the correct idiom for RVV because the length-agnostic ISA design makes classical cycle-level hand-scheduling impractical, but it also means there is no microarchitecture-specific tuning (no Cortex-X equivalent variants for any RISC-V core).

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Core Files

- `cmake/riscv64.toolchain` -- CMake toolchain definition
- `scripts/build-linux-riscv64.sh` -- canonical cross-build script
- `docker/Dockerfile.riscv` -- CI Docker image definition
- `.github/workflows/build.yml` -- CI job definition (`cmake-linux-riscv64`)

### 5.2 CMake Configure Command (as used in CI)

```
scripts/build-linux-riscv64.sh \
  -DCMAKE_BUILD_TYPE=Release \
  -DXNNPACK_ENABLE_RISCV_VECTOR=ON \
  -DUSE_GNU_SOURCE=ON \
  -DRISCV_TOOLCHAIN_ROOT=/opt/riscv \
  -DRISCV_QEMU_ROOT=/opt/qemu
```

For developer builds with tests and benchmarks:

```
mkdir -p build/linux/riscv64 && cd build/linux/riscv64
cmake ../../.. \
  -DCMAKE_TOOLCHAIN_FILE=$PWD/cmake/riscv64.toolchain \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -GNinja \
  -DXNNPACK_LIBRARY_TYPE=static \
  -DXNNPACK_BUILD_BENCHMARKS=ON \
  -DXNNPACK_BUILD_TESTS=ON \
  -DHAVE_POSIX_REGEX=0 \
  -DHAVE_STEADY_CLOCK=0 \
  -DHAVE_STD_REGEX=0
cmake --build . -- -j$(nproc)
```

### 5.3 RISC-V CMake Flags

| Flag | Default | Effect |
|---|---|---|
| `-DXNNPACK_ENABLE_RISCV_VECTOR=ON` | ON | Enables RVV microkernels; sets `-march=rv64gcv -mabi=lp64d`; QEMU gets `v=true,vlen=...` |
| `-DXNNPACK_ENABLE_RISCV_FP16_VECTOR=ON` | unset | Enables Zvfh (rvvfp16arith) microkernels; adds `-march=rv64gcv_zvfh`; adds `zfh=true,zvfh=true` to QEMU CPU string |
| `-DVLEN=512` | 512 | Vector register length for QEMU (power-of-two, 32-65536) |
| `-DRISCV_TOOLCHAIN_ROOT=/opt/riscv` | unset | Path to riscv-gnu-toolchain; if unset, uses `riscv64-linux-gnu-gcc` from PATH |
| `-DRISCV_QEMU_ROOT=/opt/qemu` | unset | Path to QEMU install; if unset, uses `qemu-riscv64` from PATH |
| `-DUSE_GNU_SOURCE=ON` | unset | Adds `-D_GNU_SOURCE` compile definition |

### 5.4 Docker Image

`ghcr.io/google/xnnpack/riscv:latest` -- built from `docker/Dockerfile.riscv`.

Stage 1 builds QEMU 10.2.1 from source (user-mode only, `riscv64-linux-user` target, static binary).

Stage 2 (final image, base `ubuntu:24.04`) installs:
- `crossbuild-essential-riscv64` (GCC 13, used as fallback sysroot)
- RISC-V LLVM nightly toolchain: `riscv64-glibc-ubuntu-24.04-llvm-nightly-2025.01.20-nightly` from [riscv-collab/riscv-gnu-toolchain releases](https://github.com/riscv-collab/riscv-gnu-toolchain/releases/download/2025.01.20/), extracted to `/opt/riscv`
- QEMU binary from Stage 1 at `/opt/qemu/bin/qemu-riscv64`

Toolchain versions as of the current Dockerfile:

| Component | Version |
|---|---|
| RISC-V cross-compiler | riscv64-glibc-ubuntu-24.04-llvm-nightly-2025.01.20 (Clang/LLVM nightly) |
| QEMU | 10.2.1 (built from source) |
| Host Ubuntu | 24.04 |

### 5.5 QEMU CPU String

With RVV enabled and FP16 disabled:
```
rv64,zba=true,zbb=true,zbc=true,zbs=true,v=true,vlen=512,elen=64,vext_spec=v1.0
```

With FP16 additionally enabled:
```
rv64,zba=true,zbb=true,zbc=true,zbs=true,v=true,vlen=512,elen=64,vext_spec=v1.0,zfh=true,zvfh=true
```

Default VLEN is 512. [PR #9642](https://github.com/google/XNNPACK/pull/9642) added the QEMU CPU option for RVV FP16; [PR #9739](https://github.com/google/XNNPACK/pull/9739) updated to QEMU 10.2.1.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Kernel Count

| Target extension | Production kernel files |
|---|---|
| RVV (V extension, f32+int) | 136 |
| Zvfh (FP16 vector) | 70 |
| Total RISC-V production | 206 |

For comparison: aarch64 NEON has 900+ generated files in the f32-gemm subtree alone, plus 40+ hand-written `.S` assembly files for that one operation, with microarchitecture-specific variants for Cortex-A53, A55, A75, etc. The RVV kernel count is approximately 20% of the aarch64 depth for equivalent operation categories, with zero assembly and zero microarchitecture specialization.

### 6.2 Component Coverage Matrix

| Component | F32 | F16 (Zvfh) | QS8/QU8 | BF16 |
|---|---|---|---|---|
| GEMM (NxK matrix multiply) | partial -- MR=1,7; NR=4v | partial -- MR=1,7; NR=4v; broken detection | partial -- QS8-QC8W MR=1,4; QU8 MR=1,4; QD8 MR=1,4 | missing |
| IGEMM (indirect GEMM for conv) | partial | partial | partial -- qs8-qc8w, qd8; qu8-igemm missing from PROD | missing |
| DWCONV (depthwise convolution) | partial -- 3p/4p/9p/25p 8vc | partial -- 3p/4p/9p/25p 8vc | partial -- qs8-qc8w and qs8 3p/9p/25p; qu8 9p/25p (missing 3p); dispatch bug | missing |
| DWCONV2D-CHW | partial -- 3x3p1 and 3x3s2p1 only | missing | missing | missing |
| SPMM (sparse matrix multiply) | partial | partial | missing | missing |
| Maxpool / avgpool | partial | partial | partial (s8/u8 maxpool) | missing |
| Argmaxpool | partial | missing | missing | missing |
| Unary activations (relu, elu, tanh, sigmoid, gelu, hswish, sqrt, exp, log, sin, cos, rsqrt) | partial -- full set | partial -- full set; broken detection | partial -- vlrelu | missing |
| Rounding (rndd/rndne/rndu/rndz) | partial | partial | - | missing |
| Binary elementwise (add, sub, mul, div, min, max, prelu, sqrdiff, copysign) | partial -- full set | partial -- full set; broken detection | partial -- vadd/vaddc/vmul/vmulc | missing |
| Reduction (rsum, rmax, rmin, rdsum, rdmax, rdmin) | partial -- full set | partial -- full set | partial -- qs8/qu8 rsum/rdsum | missing |
| Type conversion (vcvt) | partial -- f32-qs8, f32-qu8, qs8-f32, qu8-f32 | partial -- f16-f32, f32-f16; f16-qs8 missing | partial -- qs8-vcvt, qu8-vcvt | missing |
| Packing (packw, transposec) | partial | - | partial | missing |
| Vmulcaddc | partial | partial | - | missing |
| Direct conv HWC (non-CHW) | missing | missing | missing | missing |
| GEMM for non-dynamic-quantized QC4W | missing | missing | - | - |

"Partial" throughout means: real, correct, RVV-intrinsics kernel exists; no hand-tuned assembly; narrower MR/NR parameter space than arm64; no microarchitecture variants.

### 6.3 Confirmed Gaps

- BF16 (Zfbfmin/Zvfbfmin): no kernels whatsoever.
- F32 direct convolution in HWC layout (`f32-conv-hwc`): neon and scalar only, no RVV.
- DWCONV2D-CHW 5x5 kernels: 3x3 present, 5x5 absent (present for aarch64/NEON).
- QU8-IGEMM: not in PROD cmake list; QU8-GEMM is present.
- F16-to-QS8/QU8 conversion: no RISC-V branch; scalar fallback only.
- All BF16 conversion paths: scalar fallback only.
- Microarchitecture-specific tuning: absent by implementation style (all intrinsics-generated).
- Hand-written assembly: absent entirely.

---

## 7. CI/CD Infrastructure

### 7.1 Job Definition

The RISC-V CI job is `cmake-linux-riscv64` defined in [`.github/workflows/build.yml`](https://github.com/google/XNNPACK/blob/master/.github/workflows/build.yml) as a reusable `workflow_call` job.

Runner: `ubuntu-24.04-16core` -- an x86_64 GitHub-hosted runner. There is no native riscv64 runner. All riscv64 execution is QEMU emulation.

Container: `ghcr.io/google/xnnpack/riscv:latest`

Build flags: `-DCMAKE_BUILD_TYPE=Release -DXNNPACK_ENABLE_RISCV_VECTOR=ON -DUSE_GNU_SOURCE=ON -DRISCV_TOOLCHAIN_ROOT=/opt/riscv -DRISCV_QEMU_ROOT=/opt/qemu`

Test command: `ctest --output-on-failure --label-exclude operator --parallel $(nproc)` (working directory: `build/linux/riscv64`)

Timeout: 60 minutes.

Caching: ccache with key prefix `ccache-riscv64-`.

### 7.2 Trigger Matrix

| Trigger workflow | Tests run? | Notes |
|---|---|---|
| `on-push.yml` (non-master branch push) | Yes | Default `run-tests: true` |
| `on-pr-approved.yml` (PR approval event) | Yes | Default `run-tests: true` |
| `on-pr-merge-to-master.yml` (push to master) | **No** | Explicitly passes `run-tests: false`; only cache update occurs |

Tests are not run on merge to master. A broken commit can land on master without RISC-V test verification.

### 7.3 Test Exclusions

Operator tests are permanently excluded from CI via `--label-exclude operator`. These are the integration-level tests that exercise full operator semantics end-to-end; they are excluded because QEMU execution is too slow for the CI time budget.

### 7.4 Current CI State

[Issue #9886](https://github.com/google/XNNPACK/issues/9886) (opened April 6, 2026, no fix as of report date) documents 100+ RVV test targets failing in the current CI environment. Categories of failure include: f16_gemm, f16_vabs, f16_vclamp, f16_vcos, f16_vgelu, f16_vsin, convolution_nhwc_test, batch_matrix_multiply_nc_test, mobilenet subgraph. The RISC-V FP16 CI is currently broken.

### 7.5 Docker Image Publishing

[`.github/workflows/publish-docker.yml`](https://github.com/google/XNNPACK/blob/master/.github/workflows/publish-docker.yml) builds and pushes the `standard` Docker image for `linux/amd64`, `linux/arm64`, and `linux/riscv64` platforms using QEMU/Buildx. The `riscv` cross-compilation toolchain image is built for `linux/amd64` only. Trigger: push to master touching `docker/**`, or `workflow_dispatch`.

---

## 8. Distribution and Release Status

XNNPACK publishes no binary releases on GitHub. The repository has zero release tags.

| Distribution channel | riscv64 binary available | Notes |
|---|---|---|
| GitHub Releases (google/XNNPACK) | No | Zero releases of any kind |
| PyPI | No | Package `xnnpack` does not exist on PyPI (HTTP 404) |
| RISE wheel builder (GitLab project 56254198) | No | Redirects to PyPI; package not found |
| Ubuntu 24.04 Noble (`libxnnpack-dev`, `libxnnpack0`) | Yes | Version `0.0~git20221221.51a9875-1build1`; `universe` component; December 2022 snapshot; 3.5+ years stale |
| Debian bookworm (stable) | No | amd64/arm64/armhf/i386 only |
| Debian trixie/forky/sid (`libxnnpack-dev`, `libxnnpack0.20241108`) | Yes | Version `0.0~git20241108.4ea82e5-2+b1`; status "Installed" on buildd (`rv-manda-04`); November 2024 snapshot; ~19 months stale; debports secondary build; not in maintainer's architecture list |
| Arch Linux RISC-V (archriscv.felixc.at) | No | Not packaged |

The Debian sid binary is the only confirmed riscv64 binary artifact. It is a debports opportunistic build of an 18-month-stale snapshot, carrying version prefix `0.0~` (pre-release). It predates all 2025-2026 RVV kernel additions (QS8-GEMM, F16 kernels, complete reduce/pool kernels). It cannot be used to evaluate current RVV performance.

---

## 9. Dependencies

XNNPACK consumes five build-time dependencies via CMake `FetchContent`.

### 9.1 cpuinfo (pytorch/cpuinfo)

Role: CPU feature detection at runtime -- queries ISA extensions to select kernels.

riscv64 status: Builds on Linux riscv64. Android riscv64 support added in 2024. CI exists via QEMU.

**Critical open issue:** `pytorch/cpuinfo` does not yet expose a `cpuinfo_has_riscv_zvfh()` function. This is the direct root cause of [XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886). As of April 2026, ken-unger committed to filing a cpuinfo PR adding this function, but no such PR has appeared. The `riscv_hwprobe` syscall infrastructure to detect Zvfh exists in `hardware-config.c`, but the XNNPACK-to-cpuinfo interface for this flag is missing.

[XNNPACK issue #4650](https://github.com/google/XNNPACK/issues/4650) (open since April 2023): `syscall` is undeclared in `cpuinfo-source/src/api.c` during RISC-V cross-compilation under ISO C99 strict mode. No upstream response in three years.

### 9.2 pthreadpool (google/pthreadpool)

Role: Thread pool for parallel kernel dispatch.

riscv64 status: Fully architecture-agnostic C library. No RISC-V-specific code paths. No riscv64 issues filed. Not a concern.

### 9.3 Google Test (google/googletest)

Role: Unit test framework (build-time only, does not affect the production shared library).

riscv64 status: Builds. [googletest issue #3756](https://github.com/google/googletest/issues/3756) (open since February 2022): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64. Test-only dependency; no runtime impact.

### 9.4 Google Benchmark (google/benchmark)

Role: Microbenchmark framework (build-time only).

riscv64 status: Functional. Two known riscv64 bugs fixed: cycleclock type-conversion bug fixed in [PR #1802](https://github.com/google/benchmark/pull/1802) (June 2024); CPU frequency estimation fixed in [PR #1549](https://github.com/google/benchmark/pull/1549) (February 2023). No open riscv64 issues. Not a blocker.

### 9.5 KleidiAI (ARM-software/kleidiai)

Role: AArch64-optimized i8mm/NEON microkernels.

riscv64 status: Not applicable. The CMake guard is `if(CMAKE_SYSTEM_PROCESSOR MATCHES "^(aarch64.*)$" AND XNNPACK_ENABLE_KLEIDIAI)`. The dependency is never fetched or compiled on riscv64 targets.

### 9.6 Dependency Severity Summary

| Dependency | riscv64 concern | Severity |
|---|---|---|
| cpuinfo | Missing `cpuinfo_has_riscv_zvfh()`; 3-year-old build failure | High -- directly blocks FP16 correctness |
| pthreadpool | None | None |
| googletest | Thread count test fails | Low -- test-only |
| googlebenchmark | None (prior bugs fixed) | None |
| kleidiai | Not applicable | Not applicable |

---

## 10. Ecosystem Status

### 10.1 Primary Test Hardware

The only physical RISC-V hardware with published XNNPACK RVV benchmark numbers is the **SpacemiT K1 SoC** (BananaPi BPI-F3): 8 cores at 1600 MHz, VLEN=256, L1 32 KiB/core, L2 512 KiB x2. SpacemiT is a RISE General Member.

Contributors reference the BananaPi BPI-F3 by name in multiple PRs and issues. No other real hardware platform appears in any XNNPACK RISC-V benchmark data. There are no published results for SiFive, StarFive, Kendryte, Alibaba XuanTie, or any other RISC-V vendor's hardware.

### 10.2 RISE Project Involvement

Google is a Premier Member of the RISE Project (RISC-V Software Ecosystem, hosted under the Linux Foundation). RISE Premier Members also include Andes Technology, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), and Tenstorrent.

XNNPACK is not a named RISE project workstream. The RISE Project blog (28 posts spanning May 2024 to June 2026) contains zero mentions of XNNPACK. The RISE AI/ML Working Group (one of five working groups restructured effective June 25, 2026) would encompass this domain, but no public deliverable connects the working group to XNNPACK specifically.

The December 2025 RISE post "Announcing the 2025 AI & RISC-V Gemini Credit Recipients" lists five academic research recipients for a Google/RISE Gemini compute credit program. No XNNPACK work is mentioned.

SpacemiT's role as both the manufacturer of the BPI-F3 (the primary XNNPACK RISC-V benchmark platform) and a RISE General Member represents an indirect ecosystem connection, but no formal collaboration is documented.

### 10.3 Active Contributors

| Contributor | Affiliation | Primary RISC-V work |
|---|---|---|
| Marat Dukhan (`Maratyszcza`) | Google | Founded port; primary architect |
| fbarchard (Frank Barchard) | Google | CI maintenance, Zvfh detection, toolchain |
| gonnet | Google | Toolchain and CI infrastructure |
| alexander-shaposhnikov | Google | Docker/CI Dockerization |
| dsharletg | Google | GitHub Actions consolidation; primary reviewer for FP16 correctness |
| ken-unger | Google | Active RVV microkernel contributor (Zvfh, avgpool, maxpool, reduce) |
| phoebesv | Unknown | RISC-V Clang toolchain CI (Jan 2024) [NEEDS VERIFICATION on affiliation] |
| bhbruce (Bruce Lai) | Unknown | RISC-V toolchain/QEMU paths (Dec 2023) [NEEDS VERIFICATION on affiliation] |
| kozinove | Unknown | PR #8740 (vexp/vtanh, open/stalled) |

---

## 11. Known Bugs and Active Issues

### 11.1 Issue #9886 -- RVV tests failing on QEMU (OPEN, High Severity)

URL: [https://github.com/google/XNNPACK/issues/9886](https://github.com/google/XNNPACK/issues/9886)
Opened: April 6, 2026 by fbarchard. No assignee. No linked fix PR.

Root cause: [PR #9516](https://github.com/google/XNNPACK/pull/9516) (merged February 13, 2026) changed `xnn_arch_riscv_vector_fp16_arith` to be set whenever the V extension is present, without checking `cpuinfo_has_riscv_zvfh()`. The original code comment read: "There is no HWCAP for fp16 so disable by default." PR #9516 removed this conservative default without implementing a replacement runtime check. QEMU does not enable Zvfh by default, causing illegal instruction faults when FP16 kernels execute.

Affected test categories: f16_gemm_minmax_test, f16_vabs/vclamp/vcos/vgelu/vsin/vsqr/vsqrt, convolution_nhwc_test (10/10 failures), batch_matrix_multiply_nc_test (5/5 failures), mobilenet subgraph, rdsum2_test.

[PR #9903](https://github.com/google/XNNPACK/pull/9903) (merged April 7, 2026) added a compile-time guard for the `RISCV_HWPROBE_EXT_ZVFH` macro missing in Clang 19.1. This is a different and narrower fix. Issue #9886 remains open after #9903 merged.

dsharlet's explicit requirement (stated in the #9516 review thread, February 26, 2026): implement runtime detection/disabling in `hardware-config.c` using a `cpuinfo_has_riscv_zvfh()` call. ken-unger committed to filing a `pytorch/cpuinfo` PR as prerequisite work. As of April 2026, that cpuinfo PR has not appeared.

### 11.2 Issue #4650 -- RISC-V cpuinfo build error (OPEN, Medium Severity)

URL: [https://github.com/google/XNNPACK/issues/4650](https://github.com/google/XNNPACK/issues/4650)
Opened: April 13, 2023. No comments. No assignee. No activity in three years.

Exact error: `api.c:319:23: error: call to undeclared function 'syscall'; ISO C99 and later do not support implicit function declarations` in `cpuinfo-source/src/api.c` at `syscall(__NR_getcpu, &cpu, NULL, NULL)`.

Reporter's workaround: disable cpuinfo entirely, citing identical resolution in the IREE project ([openxla/iree issue #11152](https://github.com/openxla/iree/issues/11152)).

### 11.3 Issue #8052 -- xN-transpose-test fails cross-compiling for riscv64 (OPEN, Low Severity)

URL: [https://github.com/google/XNNPACK/issues/8052](https://github.com/google/XNNPACK/issues/8052)
Opened: March 16, 2025. No comments. No assignee.

Single test (#253 of 654) fails when cross-compiling from x86 Ubuntu 24.04 using `riscv64-glibc-ubuntu-24.04-llvm-nightly-2025.01.20` toolchain. All other 653 tests pass. No error message beyond test name provided. May be related to [PR #8270](https://github.com/google/XNNPACK/pull/8270) (enabled RVV transpose only on RISC-V, merged April 16, 2025) but the issue was not closed after that merge.

### 11.4 Issue #8800 -- Build fails with strict-aliasing violations (OPEN, Low-Medium Severity)

URL: [https://github.com/google/XNNPACK/issues/8800](https://github.com/google/XNNPACK/issues/8800)
Opened: August 19, 2025 by eli-schwartz. No comments. No assignee.

Build with `-Werror=strict-aliasing` fails on generated files: `*(const uint16_t*) &params->scalar.min` casts `float*` to `uint16_t*`. Reported in AVX-generated files but the same code generation pattern likely affects RVV-generated files. Related Gentoo bug: [https://bugs.gentoo.org/953467](https://bugs.gentoo.org/953467).

### 11.5 dwconv-config.c dispatch bug (OPEN, Medium Severity) [NEEDS VERIFICATION]

In `src/configs/dwconv-config.c`, the RISC-V QU8 dispatch block writes into `qs8_dwconv_config` instead of `qu8_dwconv_config`. This is a functional error: QU8 depthwise convolution on RISC-V will silently use the QS8 configuration. No issue or PR has been filed for this specific bug based on available research data.

### 11.6 Issue #8087 -- vrnd kernels for RVV incorrect (CLOSED April 2026)

URL: [https://github.com/google/XNNPACK/issues/8087](https://github.com/google/XNNPACK/issues/8087)

RVV rounding kernels (rndd/rndne/rndu/rndz) used float-to-int32 cast and back, producing undefined behavior for out-of-range floats and destroying infinities/NaNs. Partial fix submitted in PR #7971. Closed April 2026. Resolved.

### 11.7 PR #8740 -- vexp and vtanh for RISC-V (OPEN, stalled since July 2025)

URL: [https://github.com/google/XNNPACK/pull/8740](https://github.com/google/XNNPACK/pull/8740)
Opened: July 28, 2025 by kozinove. Last activity: November 2025.

Blockers: CLA not signed (flagged by google-cla bot July 28, 2025). Algorithmic concerns from fbarchard unresolved (lookup table vs. portable polynomial template `rational-9-8.c.in`). No merge decision made.

---

## 12. Objections and Upstream Blockers

### 12.1 The cpuinfo Zvfh detection chain

The following defects form a connected failure chain:

1. `pytorch/cpuinfo` does not expose `cpuinfo_has_riscv_zvfh()`.
2. `XNNPACK/hardware-config.c` therefore cannot implement the runtime guard dsharlet requires.
3. [PR #9516](https://github.com/google/XNNPACK/pull/9516) unconditionally enables FP16 code paths, breaking 100+ tests on QEMU ([issue #9886](https://github.com/google/XNNPACK/issues/9886)).
4. This chain has been explicitly described in the review thread for #9516 since February 2026. No fix has landed as of April 2026.

Any contributor addressing RISC-V FP16 correctness must fix cpuinfo first, then XNNPACK. The cpuinfo change is cross-project coordination.

### 12.2 No native CI runner

All RISC-V CI runs under QEMU on x86_64. QEMU emulation is acknowledged by contributors as insufficient for accurate out-of-order performance benchmarking. The SpacemiT K1 BPI-F3 is the only real hardware used for benchmarks, and it is used manually by individual contributors, not in automated CI. A regression in QEMU-emulated correctness can pass CI while hiding a real-hardware performance problem, and vice versa.

### 12.3 Tests not run on merge to master

`on-pr-merge-to-master.yml` passes `run-tests: false`. The canary merge does not run RISC-V tests. Issues introduced on master may not surface until the next PR approval cycle.

### 12.4 Operator test exclusion

The `--label-exclude operator` flag permanently excludes the most comprehensive test tier. This is a known infrastructure compromise due to QEMU speed, not a deliberate policy choice. End-to-end correctness of RISC-V operator dispatch (the integration between the dispatch layer and microkernels) has no automated CI coverage.

### 12.5 Stale unresolved issues

[Issue #4650](https://github.com/google/XNNPACK/issues/4650) (cpuinfo syscall build error) has been open for three years with zero engagement. This pattern -- an issue filed, no upstream response, no close -- indicates that RISC-V build system reliability for external consumers using non-standard compiler configurations is not being actively maintained.

### 12.6 Google-internal governance model

Development happens in Google's internal Piper monorepo; GitHub is a mirror. External contributors must sign a Google CLA. PR #8740 has been stalled for nearly a year partly due to the CLA requirement. There is no public roadmap, no RFC process, and no community forum. Influencing the RISC-V roadmap requires either being a Google employee on the XNNPACK team, or having enough traction as an external contributor that Google engineers prioritize review. The latter is difficult to guarantee at the pace required for a chip company's engineering roadmap.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

These items address correctness gaps that prevent RISC-V from being a reliable production target.

**13.1.1 Fix cpuinfo Zvfh detection**

File a PR to `pytorch/cpuinfo` adding `cpuinfo_has_riscv_zvfh()` using `riscv_hwprobe` syscall (258) with `RISCV_HWPROBE_EXT_ZVFH`. Then update `XNNPACK/src/configs/hardware-config.c` to call this function instead of unconditionally setting `xnn_arch_riscv_vector_fp16_arith`. This fixes the entire [issue #9886](https://github.com/google/XNNPACK/issues/9886) failure chain (100+ broken tests). dsharlet has explicitly accepted this approach.

Effort: 1-2 person-weeks (cpuinfo PR + XNNPACK integration PR + CI validation). Priority: Critical -- FP16 CI is currently broken.

**13.1.2 Fix QU8 dwconv dispatch bug in dwconv-config.c**

The QU8 RISC-V dispatch block writes to `qs8_dwconv_config`. One-line fix. Effort: 0.5 person-weeks (fix + tests). Priority: High.

**13.1.3 Fix cpuinfo syscall build failure (issue #4650)**

Add `#include <unistd.h>` or equivalent in `cpuinfo-source/src/api.c` to declare `syscall`. The fix is in the cpuinfo dependency, not XNNPACK itself. Effort: 0.5 person-weeks. Priority: High -- blocks external consumers from cross-compiling.

**13.1.4 Add QU8-IGEMM RVV kernels**

QU8-GEMM exists; QU8-IGEMM is missing from the PROD cmake list. Required for depthwise+indirect-conv paths. Effort: 1 person-week (template adaptation from QU8-GEMM). Priority: Medium.

**13.1.5 Add F16-to-QS8/QU8 conversion RVV kernels**

`f16-qs8-vcvt` and `f16-qu8-vcvt` have no RISC-V branch; scalar fallback only. Required for quantized models with FP16 activations. Effort: 1 person-week. Priority: Medium.

### 13.2 Performance Optimization

These items increase throughput on real hardware. All published benchmarks are on SpacemiT K1 (VLEN=256). The investment value depends on the specific target hardware and VLEN.

**13.2.1 Add BF16 GEMM and unary/binary RVV kernels (Zvfbfmin)**

No BF16 RVV kernels exist. Required for BF16 inference workloads. The arm64 BF16 path (neonbf16) has 50+ kernels; RISC-V has zero. Effort: 4-8 person-weeks (GEMM + igemm + elementwise set, templated from F32 analogs). Priority: High if target hardware supports BF16 (Zvfbfmin is ratified in RVV v1.0-based profiles).

**13.2.2 Broaden GEMM MR/NR tile search for specific target VLEN**

Current MR values are 1 and 7; NR is always 4v. For VLEN=256 (K1) or VLEN=512 (hypothetical targets), wider MR tiles (MR=10, 14) may improve throughput by increasing register reuse. The aarch64 GEMM has 15+ distinct MR values per NR. Effort: 2-4 person-weeks per microarchitecture profile (autotuning + validation). Priority: Medium.

**13.2.3 Complete vexp/vtanh RVV kernels (PR #8740)**

PR #8740 has been stalled since July 2025 due to CLA and algorithmic review. Benchmarks on K1 show 2x speedup for F32 (630 MB/s vs 308 MB/s scalar) and 55x for F16 (567 MB/s vs 10 MB/s scalar). Resolve the CLA issue and adapt the implementation to use the `rational-9-8.c.in` portable template as fbarchard requested. Effort: 1-2 person-weeks. Priority: Medium.

**13.2.4 Add DWCONV2D-CHW 5x5 RVV kernel**

Currently only 3x3 CHW depthwise is present for RISC-V. 5x5 depthwise convolution kernels are present for aarch64 and amd64. Required for networks using larger depthwise filter sizes. Effort: 1-2 person-weeks. Priority: Medium.

### 13.3 CI/CD Infrastructure

These items increase reliability and catch regressions earlier.

**13.3.1 Add native riscv64 runner or hardware-in-the-loop CI**

All current CI is QEMU-based. QEMU cannot accurately characterize out-of-order performance or expose hardware-specific bugs (e.g., memory ordering, actual Zvfh availability on production silicon). A single BPI-F3 board connected to a self-hosted GitHub Actions runner would provide the first native riscv64 CI in the project. This requires a physical board, network connectivity, and runner registration. Effort: 1-2 person-weeks (setup) + ongoing maintenance. Priority: High for any serious RISC-V commitment.

**13.3.2 Enable operator tests in CI**

Operator tests are excluded via `--label-exclude operator` due to QEMU speed. With a native runner, this exclusion can be removed. Without a native runner, a QEMU-based solution would require significant test sharding. Effort: 1 person-week with native runner. Priority: High alongside 13.3.1.

**13.3.3 Enable test execution on merge to master**

`on-pr-merge-to-master.yml` currently passes `run-tests: false`. Change to `run-tests: true`. Requires either native runner (to make this affordable in CI time) or acceptance that QEMU-based tests on master are worth the 60-minute timeout cost. Effort: 0.5 person-weeks. Priority: Medium.

### 13.4 Ecosystem Enablement

**13.4.1 Publish a binary riscv64 package**

The only riscv64 binary available is a debports build of a November 2024 snapshot, 18+ months behind upstream master and not in the Debian maintainer's architecture list. Publishing a riscv64 `.deb`, a Conan package, or a vcpkg port from current master would enable external developers to consume the library without cross-compiling. Effort: 2-4 person-weeks (packaging + CI for package builds). Priority: Medium.

**13.4.2 Resolve PR #8740 (vexp/vtanh, external contributor)**

An external contributor has an open PR stalled since July 2025. Facilitating CLA completion and providing clear algorithmic guidance will unblock a community contributor and improve the project's signal to future external RISC-V contributors. Effort: 0.5 person-weeks (review time). Priority: Low.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix cpuinfo Zvfh detection (cpuinfo PR + XNNPACK hardware-config.c) | 1-2 | cpuinfo team + XNNPACK | Critical |
| Functional | Fix QU8 dwconv dispatch bug (dwconv-config.c) | 0.5 | XNNPACK | High |
| Functional | Fix cpuinfo syscall build failure (issue #4650) | 0.5 | cpuinfo team | High |
| Functional | Add QU8-IGEMM RVV kernels | 1 | XNNPACK | Medium |
| Functional | Add F16-to-QS8/QU8 conversion RVV kernels | 1 | XNNPACK | Medium |
| Performance | Add BF16 GEMM + elementwise RVV kernels (Zvfbfmin) | 4-8 | XNNPACK | High |
| Performance | GEMM MR/NR tile search for target VLEN | 2-4 | XNNPACK | Medium |
| Performance | Complete vexp/vtanh RVV kernels (unblock PR #8740) | 1-2 | XNNPACK + contributor | Medium |
| Performance | Add DWCONV2D-CHW 5x5 RVV kernel | 1-2 | XNNPACK | Medium |
| CI/CD | Add native riscv64 CI runner (hardware-in-the-loop) | 1-2 + maintenance | Infrastructure | High |
| CI/CD | Enable operator tests in CI | 1 | XNNPACK | High |
| CI/CD | Enable test execution on merge to master | 0.5 | XNNPACK | Medium |
| Ecosystem | Publish riscv64 binary package | 2-4 | Distribution | Medium |
| Ecosystem | Resolve PR #8740 (external contributor) | 0.5 | XNNPACK reviewer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/XNNPACK repository](https://github.com/google/XNNPACK)
- [cmake/riscv64.toolchain](https://github.com/google/XNNPACK/blob/master/cmake/riscv64.toolchain)
- [CMakeLists.txt](https://github.com/google/XNNPACK/blob/master/CMakeLists.txt)
- [src/configs/hardware-config.c](https://github.com/google/XNNPACK/blob/master/src/configs/hardware-config.c)
- [src/configs/gemm-config.c](https://github.com/google/XNNPACK/blob/master/src/configs/gemm-config.c)
- [src/configs/dwconv-config.c](https://github.com/google/XNNPACK/blob/master/src/configs/dwconv-config.c)
- [src/configs/unary-elementwise-config.c](https://github.com/google/XNNPACK/blob/master/src/configs/unary-elementwise-config.c)
- [cmake/gen/rvv_microkernels.cmake](https://github.com/google/XNNPACK/blob/master/cmake/gen/rvv_microkernels.cmake)
- [cmake/gen/rvvfp16arith_microkernels.cmake](https://github.com/google/XNNPACK/blob/master/cmake/gen/rvvfp16arith_microkernels.cmake)
- [.github/workflows/build.yml](https://github.com/google/XNNPACK/blob/master/.github/workflows/build.yml)
- [.github/workflows/publish-docker.yml](https://github.com/google/XNNPACK/blob/master/.github/workflows/publish-docker.yml)
- [Issue #9886 -- RVV tests failing on qemu](https://github.com/google/XNNPACK/issues/9886)
- [Issue #8052 -- xN-transpose-test fails cross-compiling riscv64](https://github.com/google/XNNPACK/issues/8052)
- [Issue #4650 -- RISC-V cpuinfo build error](https://github.com/google/XNNPACK/issues/4650)
- [Issue #8800 -- Build fails with strict-aliasing violations](https://github.com/google/XNNPACK/issues/8800)
- [PR #9516 -- [RVV] Add F16 vunary and vbinary rvv kernels](https://github.com/google/XNNPACK/pull/9516)
- [PR #9903 -- [RVV] fix RISCV_HWPROBE_EXT_ZVFH when not defined](https://github.com/google/XNNPACK/pull/9903)
- [PR #9622 -- [RVV] Add missing maxpool and avgpool rvv kernels](https://github.com/google/XNNPACK/pull/9622)
- [PR #9692 -- [RVV] complete rvv reduce kernels](https://github.com/google/XNNPACK/pull/9692)
- [PR #9693 -- [RVV] more rvv fp16 unary kernels + f32-vcopysign](https://github.com/google/XNNPACK/pull/9693)
- [PR #8740 -- vector implementation of vexp and vtanh for RISC-V](https://github.com/google/XNNPACK/pull/8740)
- [PR #7638 -- [RVV] add qs8-dwconv support for risc-v](https://github.com/google/XNNPACK/pull/7638)
- [PR #7639 -- [RVV] Add qs8-gemm/igemm support for risc-v](https://github.com/google/XNNPACK/pull/7639)
- [Debian buildd -- xnnpack riscv64](https://buildd.debian.org/status/package.php?p=xnnpack)
- [RISE Project member list](https://riseproject.dev)
- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [googletest issue #3756 -- riscv64 thread count test failure](https://github.com/google/googletest/issues/3756)