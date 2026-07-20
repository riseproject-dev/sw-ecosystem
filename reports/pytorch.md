---
title: PyTorch
categories:
  - python-packages
  - llm-inference
  - ai-ml
---

# PyTorch

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for PyTorch<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

PyTorch is the dominant open-source deep learning framework for research and production training workloads. It is governed by the [PyTorch Foundation](https://pytorch.org/foundation), a directed fund under the Linux Foundation, with a Governing Board whose Chair is Andrew Wafaa (Arm) and a Technical Advisory Council (TAC) chaired by Thomas Viehmann (Lightning AI). The primary codebase lives at [pytorch/pytorch](https://github.com/pytorch/pytorch) under a BSD license. Meta engineers hold the majority of merge authority; the core maintainer with the highest riscv64-related merge activity is malfet (Meta/Apple).

License: BSD-3-Clause. Governance documents: [pytorch-fdn/tac](https://github.com/pytorch-fdn/tac). No GOVERNANCE.md exists in the main pytorch/pytorch repository.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port is 23 months old as of this report. All activity originates from Chinese academic and industry contributors; no Meta engineers have committed RISC-V-specific code.

| Date | Event | PR / Issue | Contributor |
|---|---|---|---|
| Jul 2024 | First RVV kernel merged: DepthwiseConvKernel, ~31% speedup on MobileNet V2, CanMV-K230 | [#127867](https://github.com/pytorch/pytorch/pull/127867) | zhangfeiv0 (ISCAS) |
| Sep 2024 | First RVV vec sublibrary attempt (closed stale Jan 2025) | [#135570](https://github.com/pytorch/pytorch/pull/135570) | zhangfeiv0 (ISCAS) |
| Nov 2024 | Feature request for RISC-V CI filed; placed in Cold Storage | [#141550](https://github.com/pytorch/pytorch/issues/141550) | community |
| Dec 2024 | RISC-V CI (cross-compile on x86) PR opened | [#143979](https://github.com/pytorch/pytorch/pull/143979) | zhangfeiv0 (ISCAS) |
| Feb 2025 | RFC for community review of RISC-V PRs filed, noted months without maintainer attention | [#147513](https://github.com/pytorch/pytorch/issues/147513) | zhangfeiv0 (ISCAS) |
| Aug 2025 | Opt-in cross-compilation CI merged (`.github/workflows/riscv64.yml`) | [#143979](https://github.com/pytorch/pytorch/pull/143979) | zhangfeiv0 (ISCAS) |
| Aug 2025 | lintrunner exclusion for riscv64 merged | [#160172](https://github.com/pytorch/pytorch/pull/160172) | zgat (UltraRisc) |
| Oct 2025 | GCC 14.2 ICE in DepthwiseConvKernel.cpp fixed | [#165717](https://github.com/pytorch/pytorch/pull/165717) | (maintainer) |
| Nov 2025 | Inductor cpp_builder `-march=native` crash on riscv fixed | [#167071](https://github.com/pytorch/pytorch/pull/167071) | langc23 (ZTE) |
| Nov 2025 | oneDNN backend enabled for RISC-V; ~8.85x speedup for mul on SG2044 | [#166602](https://github.com/pytorch/pytorch/pull/166602) | zhangfeiv0 (ISCAS) |
| Jan 2026 | RFC for structured RISC-V support roadmap (5 phases) filed | [#171659](https://github.com/pytorch/pytorch/issues/171659) | XuanTie team (Alibaba DAMO) |
| Feb 2026 | lintrunner re-enabled on riscv64 CI | [#173993](https://github.com/pytorch/pytorch/pull/173993) | yuzibo (Debian) |
| Feb 2026 | RVV vec sublibrary revised and reopened (currently open) | [#175746](https://github.com/pytorch/pytorch/pull/175746) | cltang |
| Feb 2026 | RVV detection macro fix (`__riscv_v`) opened (currently stale) | [#174275](https://github.com/pytorch/pytorch/pull/174275) | cltang |
| Apr 2026 | CUDA bindings disabled on riscv64 CI | [#173663](https://github.com/pytorch/pytorch/pull/173663) | yuzibo (Debian) |
| Apr 2026 | RISE CI relay (native hardware) added | [#181739](https://github.com/pytorch/pytorch/pull/181739) | luhenry (RISE/Rivos) |
| Apr 2026 | Master tracking issue for full enablement opened | [#180975](https://github.com/pytorch/pytorch/issues/180975) | fernchen (Alibaba/XuanTie) |
| May 2026 | MKL restricted to x86 only, unblocking riscv64 CI | [#178778](https://github.com/pytorch/pytorch/pull/178778) | yuzibo (Debian) |
| May 2026 | Inductor `cpp.march` knob added; RISC-V case explicitly handled | [#184297](https://github.com/pytorch/pytorch/pull/184297) | jansel (Meta) |
| May 2026 | Native fp16 conversion paths for RISC-V opened (blocked by CLA) | [#183254](https://github.com/pytorch/pytorch/pull/183254) | Ag-Cu |
| May 2026 | OSDC runner migration merged | [#183649](https://github.com/pytorch/pytorch/pull/183649) | huydhn (Meta) |

Key observation: the first two years of RISC-V work were entirely from ISCAS/RVSC researchers with no dedicated reviewer assigned. The first force-merge (PR #127867, Jul 2024) was justified by the reviewer (ezyang) as "the very first riscv kernel" with explicit uncertainty about long-term maintenance. All subsequent merges involving RISC-V code paths have continued to use force-merge or rely on malfet as an ad-hoc reviewer with no CODEOWNERS assignment.

---

## 3. Upstream Support Tier

PyTorch has no formally published platform tier policy. In practice, three informal tiers exist based on CI access and reviewer SLAs.

**Tier 1 (Meta-maintained):** x86_64 Linux, macOS (aarch64 + x86), Windows. Mandatory CI; reviewer SLAs enforced.

**Tier 2 (partner-maintained):** aarch64 Linux, ROCm/AMD, Intel XPU. CI present; AMD, Intel, and Arm provide dedicated reviewers and backend ownership.

**Tier 3 (opt-in, community-maintained):** RISC-V. Characteristics:
- Cross-compilation CI only; no riscv64 runner in PyTorch's own fleet
- RISC-V code merged under force-flag ("lint is green, rest is not compiled")
- No CODEOWNERS entry for RISC-V; malfet handles reviews ad-hoc
- Core team policy: "we won't block you, but you own maintenance"

The [RISE Project RFC (rfcs#77)](https://github.com/pytorch/rfcs/pull/77), opened July 2025 by luhenry, is the first formal proposal to elevate RISC-V to an officially supported tier. It offers RISE-provided CI hardware and named maintenance ownership. Meta's albanD responded positively but placed all maintenance responsibility on RISE. As of June 2026 the RFC remains open/draft.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 In-tree code (pytorch/pytorch)

**Architecture detection.** `CMakeLists.txt` sets `CPU_RISCV=ON` when `CMAKE_SYSTEM_PROCESSOR` matches `^(riscv64)`. This flag gates the oneDNN build path.

**ATen SIMD vector library.** The `aten/src/ATen/cpu/vec/` dispatch layer has zero RISC-V code. The `CPUCapability` enum in `aten/src/ATen/native/DispatchStub.h` lists: DEFAULT, VSX, ZVECTOR, SVE256, SVE128, AVX2, AVX512. No RVV entry exists. No `vec_rvv.h` file exists in the tree.

**oneDNN/MKLDNN.** `cmake/Modules/FindMKLDNN.cmake` enables oneDNN when `CPU_RISCV` is set and `USE_MKLDNN=ON`, but explicitly disables `DNNL_EXPERIMENTAL_UKERNEL` on RISC-V (`IF(CPU_POWER OR CPU_RISCV) SET(DNNL_EXPERIMENTAL_UKERNEL OFF)`). The CMakeLists.txt option description explicitly lists riscv64 as a supported MKLDNN platform. However, the PyTorch CI `build.sh` sets `USE_MKLDNN=0` for all riscv64 builds, so oneDNN is not exercised in CI. PR [#166602](https://github.com/pytorch/pytorch/pull/166602) (merged Nov 2025) enables `torch.backends.mkldnn.is_available()` to return True on riscv64; the merge is real but CI does not validate it.

**Inductor C++ backend.** PR [#167071](https://github.com/pytorch/pytorch/pull/167071) (merged Nov 2025) fixed a crash where `-march=native` was passed to g++ on RISC-V, which requires ISA strings starting with `rv32`/`rv64`. PR [#184297](https://github.com/pytorch/pytorch/pull/184297) (merged May 2026) adds a `cpp.march` configuration knob, explicitly handling the RISC-V case alongside ppc64le and macOS.

**TorchScript NNC JIT.** `torch/csrc/jit/tensorexpr/llvm_jit.cpp` uses `InitializeAllTargets()` (generic LLVM initialization). No RISC-V-specific target initialization or RVV code path exists.

**ATen native CPU kernels.** No `*Kernel.rvv.cpp` files exist. The depthwise conv RVV path from PR #127867 is the only in-tree RVV kernel.

### 4.2 Third-party submodules

**cpuinfo** (`third_party/cpuinfo`, submodule at commit `bc3c01e`). Full RISC-V topology and ISA extension detection is implemented in `src/riscv/`. Detected extensions: I, M, A, F, D, C, V (RVV), Zfh, Zvfh -- via `getauxval(AT_HWCAP)` and the `sys_riscv_hwprobe` syscall. This is the source of truth for runtime ISA dispatch across XNNPACK and PyTorch. However, `cpuinfo_has_riscv_zvfh()` is missing from the public API, which directly causes XNNPACK issue [#9886](https://github.com/google/XNNPACK/issues/9886) (100+ FP16 test failures).

**XNNPACK** (`third_party/XNNPACK`, submodule at commit `51a0103`). This is the most substantial RISC-V implementation in the PyTorch dependency tree.

- RVV (F32/QS8/QU8) microkernels: 344 total source files (136 production + 208 non-production) covering GEMM, IGEMM, depthwise conv, avgpool, maxpool, SPMM, elementwise ops, reduction, type conversion, transpose, pack. ISA: RVV V extension. Dtypes: f32, qs8, qu8, s8, u8, qd8-f32. Source: `gen/rvv_microkernels.bzl`.
- RVV FP16 (Zvfh) microkernels: 212 total source files (70 production + 142 non-production) covering the same kernel categories for f16 and f16/f32 mixed dtypes. ISA: RVV + Zvfh (`-march=rv64gcv_zvfh`). Source: `gen/rvvfp16arith_microkernels.bzl`.
- Compile flags: `-march=rv64gcv -mabi=lp64d` (RVV), `-march=rv64gcv_zvfh -mabi=lp64d` (FP16 RVV).
- Copyright on generated kernels: SiFive 2024.
- CI status: **broken**. 100+ RVV FP16 tests failing (issue #9886, open since April 2026). Root cause: `xnn_arch_riscv_vector_fp16_arith` flag is unconditionally enabled (PR #9516), bypassing the cpuinfo Zvfh check. The cpuinfo fix (missing `cpuinfo_has_riscv_zvfh()`) is a cross-project blocker. Operator tests are permanently excluded from CI and not run on merge to master.
- XNNPACK is not enabled for riscv64 in PyTorch's cmake integration by default. The architecture allowlist in `cmake/Dependencies.cmake` does not include `riscv64`, causing a warning: "Target architecture is not supported in XNNPACK." XNNPACK must be explicitly enabled.

**OpenBLAS.** Default BLAS/LAPACK backend for CPU matrix ops. Cross-compilation works with GCC 14+; GCC 13 falls back silently to scalar. ZVL256B TRSM has a correctness bug (draft PR #5830, unassigned). DGEMM correctness fix merged but not released in v0.3.33. LAPACK correctness unvalidated on riscv64. No native CI hardware upstream.

**SLEEF.** SIMD-optimized transcendentals. RISC-V integrated in v3.6 (Nov 2023). CI with QEMU. No riscv64-specific open blockers. Note: PyTorch only enables SLEEF on ARM via `AT_BUILD_ARM_VEC256_WITH_SLEEF`; the RVV path in PyTorch ATen is separate.

### 4.3 RVV ATen vectorization work-in-progress

PR [#175746](https://github.com/pytorch/pytorch/pull/175746) (open since Feb 2026) is the revised attempt to add RVV support to PyTorch's ATen `Vectorized<>` template library. Key details:

- Internal representation adjusted to compile without fixed-size `-mrvv-vector-bits=`, but still assumes 128x2 = 256-bit vector size.
- Approved by luhenry (RISE). Blocked by: (1) one lint failure on `vec_common_rvv.h`, (2) unresolved architectural concern about scalable-vector memory copying in `Vectorized<>`, (3) no maintainer (malfet) response to luhenry's five design options for scalable-vector support.
- The architectural concern is the same one that has blocked SVE support in `Vectorized<>` (PR [#153471](https://github.com/pytorch/pytorch/pull/153471)), where malfet has stated that making `size()` dynamic "will likely result in a significant slowdown" and requires a rigorous test plan against named hardware.
- If merged, this would enable RVV dispatch for ATen elementwise and vectorizable operations, which is the prerequisite for Phase 2 kernel work in the tracking issue.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Compiler requirements

- GCC minimum: 11.3 (enforced with fatal CMake error)
- Clang minimum: 16 (enforced with fatal CMake error)
- Official RISC-V CI uses GCC 14 (`gcc-14-riscv64-linux-gnu` / `g++-14-riscv64-linux-gnu`)
- CMake minimum: 3.27; CI pins cmake==4.0.0 via pip
- Python: 3.12.3 in the CI Docker image

### 5.2 Required cmake and environment variables for cross-compilation

Set in `.ci/pytorch/build.sh` for the `*riscv64*` build environment:

```
CMAKE_CROSSCOMPILING=TRUE
CMAKE_SYSTEM_NAME=Linux
CMAKE_SYSTEM_PROCESSOR=riscv64
USE_CUDA=0
USE_MKLDNN=0
SLEEF_TARGET_EXEC_USE_QEMU=ON
```

Build invoked via: `python -m build --wheel --no-isolation` after activating the crossenv at `/opt/riscv-cross-env/bin/activate`.

### 5.3 Recommended `-DUSE_X=OFF` flags for riscv64

The following features must be disabled explicitly. NNPACK, QNNPACK, and XNNPACK have architecture allowlists that exclude riscv64 and emit warnings rather than hard errors if not explicitly disabled:

```
-DUSE_CUDA=OFF
-DUSE_MKLDNN=OFF
-DUSE_NNPACK=OFF
-DUSE_PYTORCH_QNNPACK=OFF
-DUSE_XNNPACK=OFF
-DUSE_FBGEMM=OFF
```

FBGEMM is x86/AArch64 only with no architecture guard; it will fail to build on riscv64 if not disabled. NNPACK and psimd are effectively unmaintained (no commits since ~2020; psimd archived May 2024) and have no RISC-V support.

### 5.4 Cross-compilation Docker image (`.ci/docker/ubuntu-cross-riscv/Dockerfile`)

Base: `--platform=linux/amd64 ubuntu:noble`

Sysroot (`/opt/sysroot`) cross-compiled for `riscv64-linux-gnu`:
- zlib 1.3.2
- libffi 3.4.6
- bzip2 1.0.8
- xz 5.4.6
- OpenSSL 3.2.1 (configure target: `linux64-riscv64`)
- SQLite3 3.45.2
- Python 3.12.3 (shared, with `--with-build-python=/usr/bin/python3`, `--with-ensurepip=no`)

All configured with `--host=riscv64-linux-gnu --build=x86_64-linux-gnu --prefix=/opt/sysroot`. OpenSSL uses `./Configure linux64-riscv64 --prefix=/opt/sysroot`.

Key environment variables in the image:
```
CC=riscv64-linux-gnu-gcc-14
CXX=riscv64-linux-gnu-g++-14
QEMU_LD_PREFIX=/usr/riscv64-linux-gnu/
SYSROOT=/opt/sysroot
```

crossenv activates a host-build Python that cross-installs packages into the riscv64 sysroot. CI additionally installs: `setuptools pyyaml typing_extensions wheel`.

### 5.5 QEMU setup in CI runners

`.github/workflows/_linux-build.yml` (lines 297-317) performs the following when `BUILD_ENVIRONMENT` contains `riscv64`:

```bash
sudo mount binfmt_misc -t binfmt_misc /proc/sys/fs/binfmt_misc 2>/dev/null || true
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes || true
```

Verifies `/proc/sys/fs/binfmt_misc/qemu-riscv64` exists. Passes `--privileged` to the Docker container. The QEMU LD prefix is set to `/usr/riscv64-linux-gnu/` in the Dockerfile.

Note: PR [#182278](https://github.com/pytorch/pytorch/pull/182278) for a native (non-QEMU) build image hit a QEMU availability failure in CI (`exec format error` on QEMU setup step) and has not been resolved because the PyTorch CI runners appear to be inside containers that block QEMU kernel module installation. This remains an open blocker for in-tree native builds.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Subsystem | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| ATen SIMD vectorization | AVX2 + AVX512 dispatch | NEON + SVE256/SVE128 dispatch | None -- scalar only (PR #175746 pending) | Full gap; all tensor ops run at scalar speed |
| ATen native RVV kernels | N/A | N/A | DepthwiseConv only (1 kernel) | Near-total gap; no GEMM, no attention, no normalization, no elementwise |
| oneDNN backend | Full (primary backend) | Enabled (GEMM, conv) | Enabled in cmake; disabled in CI; INT8 incomplete | Partial; correctness unvalidated in CI; experimental |
| XNNPACK (mobile/edge) | Supported | Full with NEON microkernels | Compile-disabled by default; FP16 CI broken | Significant; requires explicit enable + cpuinfo fix |
| FBGEMM (quantized server) | Full | Full | Not supported | Full gap; no INT8/INT4 server quantization path |
| Inductor C++ backend | Full (`-march=native` on x86) | Supported | `-march=native` fixed (PR #167071); `cpp.march` knob added (PR #184297) | Functional; no RVV autovectorization tuning |
| torch.compile/Triton | Full | Partial | Not started (Phase 3/4 in tracking issue #180975) | Full gap |
| CUDA/GPU | Full | Full | Not applicable (USE_CUDA=0) | N/A by architecture |
| Distributed (NCCL, Gloo) | Full | Full | Gloo may build (architecture-agnostic C++); no riscv64 CI; NCCL not applicable | Unvalidated |
| fp16 conversion (c10::Half) | Native | Native | Software fallback (PR #183254 pending, blocked by CLA) | Performance gap; all fp16 tensor init and conversion is software |
| BF16 vector kernels | Full AVX512-BF16 dispatch | Full | None | Full gap |

---

## 7. CI/CD Infrastructure

### 7.1 In-tree CI (pytorch/pytorch)

One workflow file: [`.github/workflows/riscv64.yml`](https://github.com/pytorch/pytorch/blob/main/.github/workflows/riscv64.yml)

**Trigger:** `push` on tags matching `ciflow/riscv64/*`, or `workflow_dispatch`. Not triggered on `pull_request` or `schedule`. Requires a human to manually apply a `ciflow/riscv64/*` tag to trigger.

**Jobs:** One job: `pytorch-linux-noble-riscv64-py3_12-gcc14-cross-build`. No test jobs. No `test-matrix` input is passed. The workflow builds PyTorch for riscv64 and stops.

**Runner:** `linux.c7i.2xlarge` -- an Intel x86 EC2 instance (c7i series). RISC-V emulated via QEMU user-static. There is no native riscv64 runner in PyTorch's in-tree CI fleet.

**Build config:** Ubuntu Noble, Python 3.12, GCC 14, CPU only (no CUDA), cross-compilation + QEMU.

This CI does not gate PRs. No riscv64 check appears as a required status on pull requests.

### 7.2 Out-of-tree CI (riseproject-dev/pytorch-ci)

Repository: [riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci), 41 commits.

**Architecture:** Follows PyTorch RFC-0050 (cross-repo CI relay). The in-tree relay was added by PRs [#181739](https://github.com/pytorch/pytorch/pull/181739) (merged Apr 28, 2026) and [#181977](https://github.com/pytorch/pytorch/pull/181977) (merged May 6, 2026).

**Trigger:** Monitors pytorch/pytorch for `ciflow/riscv64/*` tags; dispatches full native builds via `out-of-tree-ci.yml`.

**Runner:** `ubuntu-24.04-riscv` label on RISE Runners infrastructure (Scaleway EM-RV1 bare-metal servers). Actual riscv64 hardware, no QEMU.

**Build environment:** `pytorch-linux-noble-riscv64-py3.12-gcc14`, GCC 14, Python 3.12, Ubuntu 24.04 Noble.

**sccache:** Custom build (`luhenry/sccache` fork with Redis coordinator support) at `62.210.239.26:6379`, backed by Scaleway S3 (`s3.fr-par.scw.cloud`). Build timeout: 24 hours. Image polling: up to 180 minutes.

**Patches applied to PyTorch source** (via `pytorch-build-sh.patch`):
- Cross-compilation condition narrowed: `*riscv64*` becomes `*riscv64*cross*`
- Native riscv64 build variables added: `USE_CUDA=0`, `USE_MKLDNN=0`
- WERROR disabled (`riscv64 builds currently fail when WERROR=1`) [NEEDS VERIFICATION -- single source, the patch file itself]
- sccache re-enabled for riscv64 (only s390x now excluded)

**Job volume:** 870 jobs logged for PyTorch as of May 6, 2026, since service launch on March 19, 2026 -- approximately 125 jobs/week.

**Test status:** Testing is ongoing but no public pass-rate data has been published as of June 2026.

**Goal:** Reach PyTorch CI Level 3 (non-blocking checks on labeled PRs in upstream pytorch/pytorch). The RISE blog states this is expected "fairly soon" as of May 2026.

### 7.3 RuyiAI-Stack fork CI

Repository: [RuyiAI-Stack/pytorch](https://github.com/RuyiAI-Stack/pytorch) -- a RISC-V specific fork maintained by ISCAS/Ruyi Community, currently tracking PyTorch 2.13.0a0+git1449fa4.

This fork tracks riscv64-specific correctness failures and maintains a test blocklist (PR [#1](https://github.com/RuyiAI-Stack/pytorch/pull/1)). It runs on THead C920 64-core hardware, Debian 13, GCC 14.2. It is not affiliated with the official pytorch/pytorch CI and its patches are not upstreamed. It serves as the primary tracker for riscv64 correctness failures (see Section 11).

---

## 8. Distribution and Release Status

### 8.1 PyPI (pip install torch)

**No riscv64 binary exists.** Confirmed via direct API query of [pypi.org/pypi/torch/json](https://pypi.org/pypi/torch/json). Latest version: 2.12.1. Total files: 24. Platforms present: `macosx_14_0_arm64`, `manylinux_2_28_aarch64`, `manylinux_2_28_x86_64`, `win_amd64`. Zero files contain "riscv64" in any of the 48 torch versions ever published on PyPI.

Installing PyTorch on riscv64 requires a source build. This takes multiple hours on QEMU-emulated builds and approximately 1 hour on bare-metal riscv64 hardware (estimated from CI build timeout of 24 hours and sccache infrastructure being required to make it tractable).

**RISE wheel builder** ([gitlab.com project 56254198](https://gitlab.com/riseproject/python/wheel_builder)): Provides 80+ pre-built riscv64 wheels including numpy, scipy, pandas, safetensors, tokenizers, sentencepiece, onnx, ml-dtypes, and others. PyTorch is NOT listed. The wheel builder is maintained by Rivos and BayLibre, funded by RISE.

### 8.2 Debian

PyTorch version 2.12.0+dfsg2-4 is packaged in Debian sid (unstable). Declared architectures: amd64, arm64, ppc64el, riscv64, s390x. Build status for riscv64: built and installed, on build server `rv-osuosl-03`. Source: [tracker.debian.org/pkg/pytorch](https://tracker.debian.org/pkg/pytorch).

This package is in Debian unstable only. It is not available in Ubuntu 24.04 Noble (PyTorch is not packaged in Ubuntu at all; confirmed via packages.ubuntu.com search returning no results for pytorch or python3-torch).

### 8.3 GitHub releases

PyTorch does not publish pre-built binary wheels via GitHub release assets. Releases (v2.12.0, v2.12.1) attach only source tarballs: `pytorch-vX.Y.Z.tar.gz` and `torch-X.Y.Z.tar.gz`.

### 8.4 Summary

| Channel | riscv64 available | Notes |
|---|---|---|
| PyPI (pip install torch) | No | x86_64, aarch64 only; 48 versions, zero riscv64 files |
| GitHub releases | No | Source tarballs only, no binary wheels |
| RISE wheel builder | No | 80+ packages but not torch |
| Ubuntu 24.04 Noble | No | Package not in distro |
| Debian sid (unstable) | Yes | v2.12.0+dfsg2-4, built on rv-osuosl-03 |
| Arch Linux RISC-V | Unknown | Site did not return parseable data during research |

---

## 9. Dependencies

The table below covers dependencies with relevance to SIMD/vectorization, JIT backends, numerics, memory allocation, or serialization. GPU-only stacks and pure-Python dependencies are omitted.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Critical Blockers |
|---|---|---|---|---|---|
| OpenBLAS | Default BLAS/LAPACK for CPU matmul | Green (GCC 14+ required; GCC 13 falls back to scalar) | Partial -- BLAS L1/L2/L3 under QEMU; LAPACK disabled in upstream CI (QEMU timeout) | v0.3.33 in Debian sid; Ubuntu 24.04 ships v0.3.26 (missing DYNAMIC_ARCH and ZVL targets) | ZVL256B TRSM correctness bug (draft PR #5830, unassigned); LAPACK correctness unvalidated; no native CI hardware |
| oneDNN | Deep learning primitives for conv, matmul, pooling | Green (GCC 14 required; JIT via xbyak_riscv compiles and generates RVV code) | Green for SMOKE tests (QEMU, vlen=128/256); no native hardware CI | Debian sid `libdnnl3.6` v3.12.1; no upstream binary; status: Experimental | INT8 quantized conv/matmul missing; f16 reduction overflow bug (PR #5361 open); LLVM libomp build failure on native riscv64 ([llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026)) blocks Clang deployments |
| XNNPACK | Inference kernels for Mobile/ExecuTorch; quantized and float ops | Green (cross-compile via Clang + QEMU) | Broken -- 100+ RVV FP16 tests failing (issue #9886); operator tests excluded from CI | No binary releases; Debian sid build from Nov 2024 snapshot | FP16 runtime detection bug (PR #9516 unconditionally enables Zvfh flag); missing `cpuinfo_has_riscv_zvfh()` (cross-project root cause); BF16 absent; old cpuinfo syscall build failure (issue #4650) unresolved |
| cpuinfo | Runtime CPU feature detection (ISA extensions, core topology) | Green -- Linux riscv64 builds; Android riscv64 CI added 2024 | Green for basic functionality (QEMU CI) | No standalone binary release | Missing `cpuinfo_has_riscv_zvfh()` API -- direct root cause of XNNPACK issue #9886; issue #148 ("Improve support for RISC-V on Linux") open since 2023 |
| SLEEF | SIMD transcendental math (sin, cos, log, exp) | Green -- riscv64 integrated in v3.6 (Nov 2023) | Green -- CI with QEMU; known QEMU flakes resolved (Feb 2025) | v3.9.0 (March 2025); libsleefdft and libsleefquad enabled for riscv64 since v3.6.1 | None. Note: PyTorch only enables SLEEF on ARM; RVV path in ATen is separate |
| FBGEMM | Quantized 8-bit matrix ops for x86/AArch64 server inference | Not supported (x86/AArch64-only) | N/A | N/A | riscv64 is not a target; PyTorch disables FBGEMM on riscv64 at configure time |
| NNPACK | Acceleration primitives for feed-forward nets (older, largely superseded by XNNPACK) | Unknown -- no riscv64 issues or PRs; project has had no commits since ~2020 | Unknown | No release | No riscv64 porting effort; psimd (dependency) archived May 2024; superseded by XNNPACK |
| psimd | Portable SIMD abstraction used by NNPACK | Archived (read-only since May 2024) | N/A | N/A | Archived; no RISC-V support; no future development possible |
| Gloo | CPU collective communications (AllReduce, distributed training) | Unknown -- no riscv64 issues or PRs found; architecture-agnostic C++ may build | Unknown | No riscv64 binary | No riscv64 porting work tracked; transport-layer untested |
| pthreadpool | Thread pool for XNNPACK/NNPACK dispatch | Green -- pure C, architecture-agnostic | Green | No standalone binary | No riscv64 blockers |
| mimalloc | High-performance memory allocator (auto-enabled on AArch64 Linux) | Likely builds (architecture-agnostic C) | Unknown | No riscv64 binary | Not auto-enabled for riscv64 in PyTorch CMake (ARM-specific flag) |
| protobuf | Serialization for ONNX and Caffe2 | Build works (issues #14549 and #12266 resolved 2023-2024) | Unknown | No official riscv64 `protoc` binary (prebuilt PRs #23206/#23205 abandoned Aug 2025) | No prebuilt `protoc` for riscv64; source build only |
| ONNX | Model exchange format | Builds (protobuf dependency resolved) | Unknown | No riscv64 binary from upstream | Depends on protobuf riscv64 support; no riscv64-specific ONNX CI known |
| OpenMP | Pragma-based parallelism (ATen kernels, oneDNN) | Green with GCC libgomp; LLVM libomp fails to build on native riscv64 ([llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026)) | Green with GCC; LLVM path untestable on native hardware | `libgomp` in all distros; libomp available via LLVM packages | LLVM libomp native build failure blocks Clang-toolchain deployments |
| OpenSSL | Optional TLS for Gloo distributed backend | Green -- full riscv64 support including RVV-accelerated crypto since OpenSSL 3.x | Green (Debian/Ubuntu CI) | Available in all major Linux distributions | No known blockers |
| NumPy | N-dimensional array library; primary numerical interface for PyTorch interop | Green -- riscv64 CI via QEMU | Green | Official riscv64 wheel on PyPI | No known blockers; cited in PyTorch issue #141550 as the model for PyTorch riscv64 CI approach |

---

## 10. Ecosystem Status

### 10.1 Corporate contributors

| Organization | Affiliation | Active Contributors | Recent Contributions |
|---|---|---|---|
| ISCAS (Institute of Software, Chinese Academy of Sciences) | RISE General Member | zhangfeiv0 | First RVV kernel (Jul 2024), first CI PR, oneDNN enablement, multiple RFCs |
| Alibaba DAMO / XuanTie | RISE Premier Member (as DAMO Academy) | fernchen | RFC #171659, tracking issue #180975 |
| RISE Project / Rivos | RISE Premier Member (Rivos former; RISE org) | luhenry | Native CI relay PRs, RVV vec review, native build image |
| ZTE | unknown affiliation | langc23 | Inductor cpp_builder fix (PR #167071) |
| Debian RISC-V | N/A | yuzibo | lintrunner, CUDA bindings, MKL restriction |
| UltraRisc | unknown | zgat | lintrunner exclusion (PR #160172) |
| Meta | N/A | malfet, huydhn, jansel | Maintainer reviews, CI infra, Inductor cpp.march |

No contributions from: Qualcomm, SiFive, NVIDIA, Google, Arm, Intel, AMD, Red Hat (all RISE Premier or Governing Board members for PyTorch Foundation). Zero RISC-V contributions from any PyTorch Governing Board member organization's engineering teams, except Alibaba.

### 10.2 RISE Project involvement

RISE is the primary organizational driver of riscv64 PyTorch CI infrastructure as of 2026. Key activities:

- [RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) launched March 19, 2026: free native riscv64 CI for any open-source GitHub project, using Scaleway EM-RV1 bare-metal servers, label `ubuntu-24.04-riscv`. As of May 6, 2026: 13,000+ total jobs across 197 repositories; 99.78% completion rate; ~445 jobs/day.
- [riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci): PyTorch out-of-tree CI, 870 jobs in 7 weeks (as of May 6, 2026).
- [riseproject-dev/executorch](https://github.com/riseproject-dev/executorch): Fork of pytorch/executorch for edge/embedded riscv64 inference work.
- PyTorch is NOT listed on the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/). The wheel builder provides 80+ other packages for riscv64 (numpy, scipy, safetensors, tokenizers, onnx, etc.) but not torch/torchvision/torchaudio.

RISE Premier members: Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba/T-Head), Tenstorrent. Former Premier members visible in 2024 slides: Intel, Rivos, Ventana Micro, Samsung, Imagination Technologies.

RISE was restructured into 5 working groups effective June 25, 2026: Enablement/Optimization, Developer Tooling, Platform, AI/ML, Bare Metal. The AI/ML WG is newly consolidated and may drive future PyTorch work.

### 10.3 ExecuTorch

[riseproject-dev/executorch](https://github.com/riseproject-dev/executorch) is an active fork of [pytorch/executorch](https://github.com/pytorch/executorch) (PyTorch's on-device AI inference framework, BSD licensed). 11,998 commits. CI configured. This indicates exploratory work on riscv64 edge inference deployment of LLMs and vision models. No published releases or prebuilt packages from this fork were found. [NEEDS VERIFICATION -- fork activity and CI details from single research source]

---

## 11. Known Bugs and Active Issues

### 11.1 Open upstream issues (pytorch/pytorch)

| Issue | Title | Opened | Category |
|---|---|---|---|
| [#180975](https://github.com/pytorch/pytorch/issues/180975) | [Tracking] RISC-V PyTorch enablement | Apr 21, 2026 | Umbrella tracking; 4-phase roadmap |
| [#175193](https://github.com/pytorch/pytorch/issues/175193) | ZLib Reference outdated in riscv ci dockerfile | Feb 17, 2026 | Infrastructure; partially fixed by PR #175237 |
| [#147513](https://github.com/pytorch/pytorch/issues/147513) | [RFC] Request for Feedback on PRs Adding RISC-V and RVV Support | Feb 20, 2025 | Stalled feature/performance work |
| [#141550](https://github.com/pytorch/pytorch/issues/141550) | RISC-V CI support | Nov 26, 2024 | CI infrastructure; in "Cold Storage" on project board |

### 11.2 Correctness failures tracked in RuyiAI-Stack fork

Hardware: THead C920 64-core, Debian 13, GCC 14.2, PyTorch 2.13.0a0+git1449fa4.

| Issue | Test | Category |
|---|---|---|
| [#34](https://github.com/RuyiAI-Stack/pytorch/issues/34) | [Tracking] core test failures on riscv64 | 32 total failures being tracked |
| [#30](https://github.com/RuyiAI-Stack/pytorch/issues/30) | test_dispatch_symbolic_meta_outplace_masked_logaddexp_cpu_float16 | Float16 NaN/precision |
| [#29](https://github.com/RuyiAI-Stack/pytorch/issues/29) | test_dispatch_symbolic_meta_outplace_div_floor_rounding_cpu_int64 | Integer floor rounding correctness |
| [#28](https://github.com/RuyiAI-Stack/pytorch/issues/28) | test_dispatch_meta_outplace_unique_cpu_float64 | Uniqueness op correctness |
| [#27](https://github.com/RuyiAI-Stack/pytorch/issues/27) | test_dtypeview_int16_float64_cpu | Dtype view/cast correctness |
| [#26](https://github.com/RuyiAI-Stack/pytorch/issues/26) | test_cpu_cpp_fallback_foreach_map_clamp_min | foreach op fallback failure |
| [#25](https://github.com/RuyiAI-Stack/pytorch/issues/25) | test_shutdown_terminates_sidecar_worker_pool | Worker pool instability |

Note: these failures are tracked in a downstream fork, not in upstream pytorch/pytorch. They have not been triaged or acknowledged by Meta maintainers.

### 11.3 riscv64 test blocklist (RuyiAI-Stack, PR #1)

The following test categories are permanently blocked on riscv64 in the RuyiAI-Stack fork:

- All distributed tests (`inductor/test_distributed_patterns`, `fx/test_dce_pass`, all `export/test_*`)
- Quantization engine tests (NoQEngine not supported; QNNPACK not supported on riscv64)
- `test_binary_ufuncs`, `test_decomp` -- blocked with note "TODO precision" (open correctness concern)
- `profiler/test_profiler` -- "scalar value not equal, need to fix"
- Inductor CPU algorithm selector tests -- "L1 cache size = 0, need to fix"
- `test_proxy_tensor` -- z3-solver build failure

### 11.4 Key open PRs with blockers

| PR | Title | Blocker |
|---|---|---|
| [#175746](https://github.com/pytorch/pytorch/pull/175746) | RISC-V Vector Extension (RVV) support for ATen | Lint failure on `vec_common_rvv.h`; unresolved `Vectorized<>` scalable-vector design question; no malfet response to five design options presented by luhenry |
| [#174275](https://github.com/pytorch/pytorch/pull/174275) | Adjust to use `__riscv_v` macro | Marked Stale June 20, 2026; jgong5 never re-approved after branch reset; unrelated `macos-py3-arm64` CI failure blocked 5 merge attempts; auto-close in 30 days |
| [#183254](https://github.com/pytorch/pytorch/pull/183254) | Add RISC-V native fp16 conversion paths | EasyCLA failure (author's commit email not linked to GitHub account); missing `topic: not user facing` label; no reviewer assigned |
| [#182278](https://github.com/pytorch/pytorch/pull/182278) | [CI] Add native build image for linux-riscv64 | malfet has not re-reviewed after luhenry addressed objections; QEMU unavailable on PyTorch CI runners; luhenry has offered to remove the image from in-tree docker-builds.yml to reduce burden |

---

## 12. Objections and Upstream Blockers

### 12.1 Meta's structural position

Meta's maintainers (primarily malfet) have not objected to RISC-V work, but they have not committed resources to it. The documented pattern is:

- RISC-V PRs are merged under force-flag, not standard CI green
- Reviews are ad-hoc from malfet with no SLA
- New CI infrastructure for riscv64 requires malfet's explicit approval and is reviewed slowly (PR #182278 has been open 7 weeks without re-review after revisions)
- The `Vectorized<>` scalable-vector architecture question (PR #175746) mirrors an unresolved SVE question (PR #153471) where malfet's stated concern -- dynamic `size()` causing "significant slowdown" -- has blocked both ARM SVE and RISC-V RVV for over a year

### 12.2 No CI gating

RISC-V CI does not gate any PyTorch PR. There is no mechanism by which a riscv64 regression would block a merge. This means RISC-V code paths will accumulate breakage silently until explicitly tested.

The macro fix PR [#174275](https://github.com/pytorch/pytorch/pull/174275) is a concrete example: it fixes a correctness issue with Clang 20+ that would cause silent incorrect RVV detection on new toolchains, has been approved by a reviewer, but has been blocked for 5 months by an unrelated CI failure and is now going stale.

### 12.3 No RISC-V CODEOWNERS

There is no `RISC-V` entry in CODEOWNERS. When RISC-V code changes are submitted, there is no automatic reviewer assignment. This means reviews depend on the submitter finding a maintainer willing to review, which has historically been the primary bottleneck (PR #135570 stalled for months before being abandoned; PR #147513 was filed specifically because earlier PRs had been open "for months without maintainer attention").

### 12.4 XNNPACK not in default build for riscv64

The architecture allowlist in `cmake/Dependencies.cmake` does not include `riscv64` for XNNPACK, NNPACK, or QNNPACK. Users who do not know to explicitly set `-DUSE_XNNPACK=ON` will get a silent "Target architecture is not supported in XNNPACK" warning and lose 344 production RVV microkernels (the largest body of RISC-V-optimized code in the entire dependency tree).

### 12.5 Dependency version mismatches in distros

Ubuntu 24.04 (the current LTS, the base for PyTorch CI) ships OpenBLAS v0.3.26, which is missing `DYNAMIC_ARCH` support and ZVL targets added in later versions. The official CI cross-compiles OpenBLAS from source to avoid this. Downstream users on Ubuntu 24.04 using system OpenBLAS will get reduced BLAS performance.

---

## 13. Investment Analysis

This section identifies the work required to bring riscv64 to each maturity level for PyTorch, and provides effort estimates and priority classifications.

Assumptions:
- "Functional" means: PyTorch installs, runs inference on standard models (ResNet, BERT, LLaMA), and produces correct results on riscv64 hardware.
- "Performant" means: inference throughput is within 2x of arm64 on equivalent hardware for the same model and batch size.
- "Supported" means: riscv64 is a Tier 2 platform with in-tree CI gating PRs.

Effort estimates are in engineer-weeks for a senior engineer familiar with both PyTorch internals and RISC-V. They do not include ramp-up time.

### 13.1 Functional Enablement

The following items block basic functional use of PyTorch on riscv64. Most are already partially done by the community; the effort estimate is to complete and upstream them.

**Fix RVV detection macro ([#174275](https://github.com/pytorch/pytorch/pull/174275)).**
PR exists, approved, blocked by stale status and unrelated CI flake. Needs: re-approval from jgong5; removal of Stale label; or reopen with fresh branch. Risk: if this PR auto-closes, the breakage on Clang 20+ will remain unaddressed.
Effort: 1 person-week. Priority: Critical (correctness regression on new toolchains).

**Fix XNNPACK FP16 test failures (XNNPACK issue [#9886](https://github.com/google/XNNPACK/issues/9886)).**
Root cause: missing `cpuinfo_has_riscv_zvfh()` in pytorch/cpuinfo. Two-repo fix: add the API to cpuinfo, update XNNPACK to use it. Requires upstreaming to both pytorch/cpuinfo and google/XNNPACK, then updating the submodule pins in pytorch/pytorch.
Effort: 2-3 person-weeks. Priority: Critical (FP16 inference broken on all Zvfh hardware).

**Merge fp16 conversion paths ([#183254](https://github.com/pytorch/pytorch/pull/183254)).**
PR exists. Blocked by EasyCLA email link issue (author action required) and missing label. Once unblocked, needs a reviewer assignment and technical review.
Effort: 0.5 person-weeks (if author fixes CLA; 1.5 if rebasing and re-review needed). Priority: High (performance gap for all fp16 workloads).

**Merge RVV ATen vec support ([#175746](https://github.com/pytorch/pytorch/pull/175746)).**
PR exists with one approval. Blocked by lint failure and unresolved `Vectorized<>` scalable-vector architecture question. The architectural question requires a decision from malfet on which of luhenry's five options to pursue. If option 1 (keep suboptimized copy code) is accepted, the lint fix may be sufficient to unblock. If a deeper redesign is required (options 4-5), this becomes a 3-6 month effort.
Effort: 1-2 person-weeks if option 1 accepted; 12-20 person-weeks for full scalable-vector `Vectorized<>` redesign. Priority: Critical for Phase 2 kernel work; without this, all ATen vectorization remains scalar.

**Enable XNNPACK for riscv64 by default.**
Add `riscv64` to the architecture allowlist in `cmake/Dependencies.cmake` for XNNPACK. Requires validating that the build succeeds without errors (not just a warning) and that the XNNPACK FP16 CI issue is resolved first.
Effort: 1 person-week. Priority: High (without this, 344 production RVV microkernels are invisible to default builds).

**Add riscv64 to CODEOWNERS.**
Designate named reviewers for `module: risc-v` labeled PRs. Without this, every RISC-V PR requires the submitter to find a willing reviewer. The RISE RFC (rfcs#77) proposes luhenry as the designated reviewer.
Effort: 0.1 person-weeks (process, not code). Priority: High (structural bottleneck for all future work).

### 13.2 Performance Optimization

**Validate and enable oneDNN backend for riscv64 in CI.**
`USE_MKLDNN=0` is currently hardcoded in CI despite cmake-level support. Enabling it requires: (1) validating correctness on riscv64 hardware, (2) addressing the INT8 conv/matmul gap, (3) resolving the f16 reduction overflow bug (oneDNN PR #5361). PR [#166602](https://github.com/pytorch/pytorch/pull/166602) reports 8.85x speedup for mul operations with oneDNN+RVV on SG2044; broader validation is needed.
Effort: 3-5 person-weeks. Priority: High (largest near-term performance lever; oneDNN upstream already has RVV support).

**Implement Phase 2 ukernel library (tracking issue [#180975](https://github.com/pytorch/pytorch/issues/180975), section 2).**
This is the full set of optimized ATen operators: GEMM/GEMV (FP32/FP16/BF16/INT8), Conv2d (direct + depthwise), SDPA/attention, RoPE, normalization (LayerNorm, RMSNorm), activation (GELU, SiLU), pooling. Analogous to KleidiAI for ARM.
Prerequisites: RVV ATen vec merged (PR #175746), cpuinfo Zvfh API, RVV dispatch entry in `CPUCapability` enum.
This is the work in tracking issue #180975 Phase 2. No PRs exist yet. The XuanTie/ISCAS teams have stated intent but no PRs have been filed.
Effort: 40-80 person-weeks for production-quality GEMM + attention + normalization. Priority: High for competitive inference throughput.

**OpenBLAS ZVL256B TRSM correctness fix.**
Draft PR #5830 exists upstream (unassigned). Affects LAPACK triangular solve correctness on VLEN=256 hardware. Effort: 2-3 person-weeks to complete and upstream.
Priority: Medium (affects LAPACK; most deep learning workloads do not call TRSM directly, but PyTorch's linear algebra module does).

### 13.3 CI/CD Infrastructure

**Merge native build image ([#182278](https://github.com/pytorch/pytorch/pull/182278)).**
PR exists. Blocked by malfet not re-reviewing after revisions. luhenry has offered to remove the image from in-tree docker-builds.yml to reduce burden on Meta. If this concession is accepted, the path to merge is clear.
Effort: 0.5 person-weeks (revisions already done; needs follow-up with malfet). Priority: High (prerequisite for moving native CI in-tree).

**Establish in-tree native riscv64 test job.**
Currently there is no test job in `riscv64.yml`. Adding one requires: (1) native runner access (RISE Runners provide this); (2) a test matrix (subset of pytorch test suite that runs in reasonable time); (3) malfet approval to add the job.
Effort: 3-5 person-weeks. Priority: High (without tests, regressions are invisible; this is the primary structural gap).

**Reach PyTorch CI Level 3 (non-blocking PR checks).**
The RISE project states this goal for their out-of-tree CI. In-tree Level 3 requires: (1) in-tree native CI running; (2) sufficient test pass rate that the check is meaningful; (3) official workflow in riscv64.yml with test jobs. The RISE blog estimated this is achievable "fairly soon" as of May 2026 for their out-of-tree infrastructure; in-tree depends on Meta approval.
Effort: 5-10 person-weeks (in-tree integration), assuming RISE provides hardware. Priority: Medium (nice-to-have for upstreaming confidence; not blocking functionality).

**Produce riscv64 PyPI wheels.**
No riscv64 torch wheel exists on PyPI. The RISE wheel builder serves 80+ packages but not torch. Producing wheels requires: (1) functional build; (2) manylinux riscv64 base image; (3) CI to build and upload. PR [#177722](https://github.com/pytorch/pytorch/pull/177722) was closed by the author while awaiting review. A new attempt would need to use AlmaLinux Kitten 10 or equivalent manylinux riscv64 base.
Effort: 5-10 person-weeks. Priority: High (the single highest user-facing friction point; currently requires hours of source build to install PyTorch on riscv64).

### 13.4 Ecosystem Enablement

**torch.compile / Inductor backend for RISC-V (Phase 3 in #180975).**
No work has started. Requires: Triton or a C++ Inductor backend that generates RVV code; variable-length vector optimization in the code generator; benchmarking and correctness validation. This is a 12-24 month research-and-engineering effort.
Effort: 60-120 person-weeks. Priority: Low (prerequisite work in Phases 1-2 not yet complete).

**Triton / TileLang RISC-V support (Phase 4 in #180975).**
No work has started. Dependency on Phase 3. Not scoped here.
Priority: Low.

**ExecuTorch riscv64 (edge inference).**
[riseproject-dev/executorch](https://github.com/riseproject-dev/executorch) exists as a fork. No published packages or validated models. Requires separate analysis.
Priority: Medium (highest near-term relevance for embedded RISC-V deployments where full PyTorch is not appropriate).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner (current or proposed) | Priority |
|---|---|---|---|---|
| Functional | Fix RVV detection macro PR #174275 | 1 | cltang / RISE | Critical |
| Functional | Fix XNNPACK FP16 (cpuinfo Zvfh API + XNNPACK) | 2-3 | RISE / cpuinfo maintainers | Critical |
| Functional | Merge RVV ATen vec PR #175746 (option 1: accept copy overhead) | 1-2 | cltang / malfet decision needed | Critical |
| Functional | Add riscv64 to XNNPACK default build | 1 | any | High |
| Functional | Merge fp16 conversion PR #183254 | 0.5-1.5 | Ag-Cu (CLA fix) | High |
| Functional | Add riscv64 to CODEOWNERS | 0.1 | luhenry / RISE | High |
| Performance | Validate + enable oneDNN in CI | 3-5 | ISCAS / XuanTie | High |
| Performance | Phase 2 ukernel library (GEMM, attention, normalization) | 40-80 | ISCAS / XuanTie (stated intent) | High |
| Performance | OpenBLAS ZVL256B TRSM fix | 2-3 | unassigned | Medium |
| CI/CD | Merge native build image PR #182278 | 0.5 | luhenry / malfet re-review | High |
| CI/CD | In-tree native test job | 3-5 | RISE + Meta | High |
| CI/CD | riscv64 PyPI wheel production | 5-10 | RISE | High |
| CI/CD | CI Level 3 (non-blocking PR checks) | 5-10 | RISE + Meta | Medium |
| Ecosystem | ExecuTorch riscv64 validation | Separate analysis needed | RISE | Medium |
| Ecosystem | torch.compile / Inductor RISC-V backend | 60-120 | XuanTie / ISCAS (Phase 3) | Low |
| Ecosystem | Triton / TileLang RISC-V | not scoped | -- | Low |

**Critical path to functional production use:** Fix PR #174275, fix cpuinfo Zvfh API, merge PR #175746 (with malfet decision), enable oneDNN in CI. Total: 8-12 person-weeks assuming Meta provides timely reviews. The primary risk is Meta review latency, not engineering capacity.

**Critical path to competitive inference performance:** Complete Phase 2 ukernel library (40-80 person-weeks). This work is stated as intent by XuanTie/ISCAS but no PRs exist. Until Phase 2 is complete, all non-XNNPACK inference paths run at scalar speed.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

1. [pytorch/pytorch master tracking issue #180975](https://github.com/pytorch/pytorch/issues/180975) -- RISC-V enablement roadmap, April 2026
2. [pytorch/pytorch RFC #171659](https://github.com/pytorch/pytorch/issues/171659) -- RISC-V Architecture Support Roadmap, January 2026
3. [pytorch/pytorch PR #127867](https://github.com/pytorch/pytorch/pull/127867) -- First RVV kernel merged, July 2024
4. [pytorch/pytorch PR #175746](https://github.com/pytorch/pytorch/pull/175746) -- RVV ATen vec support, open February 2026
5. [pytorch/pytorch PR #174275](https://github.com/pytorch/pytorch/pull/174275) -- RVV detection macro fix, stale June 2026
6. [pytorch/pytorch PR #182278](https://github.com/pytorch/pytorch/pull/182278) -- Native build image for riscv64, open May 2026
7. [pytorch/pytorch PR #183254](https://github.com/pytorch/pytorch/pull/183254) -- Native fp16 conversion, open May 2026
8. [pytorch/pytorch PR #166602](https://github.com/pytorch/pytorch/pull/166602) -- oneDNN backend for RISC-V, merged November 2025
9. [pytorch/pytorch PR #181739](https://github.com/pytorch/pytorch/pull/181739) -- RISE CI relay added, merged April 2026
10. [pytorch/pytorch PR #181977](https://github.com/pytorch/pytorch/pull/181977) -- CI relay redirect, merged May 2026
11. [pytorch/pytorch PR #184297](https://github.com/pytorch/pytorch/pull/184297) -- Inductor cpp.march knob, merged May 2026
12. [pytorch/pytorch issue #141550](https://github.com/pytorch/pytorch/issues/141550) -- RISC-V CI support, in Cold Storage
13. [riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci) -- RISE out-of-tree CI, 41 commits
14. [riseproject-dev/executorch](https://github.com/riseproject-dev/executorch) -- ExecuTorch RISC-V fork
15. [RISE blog: RISE RISC-V Runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) -- May 12, 2026
16. [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/) -- May 14, 2025
17. [RuyiAI-Stack/pytorch issue #34](https://github.com/RuyiAI-Stack/pytorch/issues/34) -- 32 core test failures on riscv64
18. [RuyiAI-Stack/pytorch PR #1](https://github.com/RuyiAI-Stack/pytorch/pull/1) -- riscv64 test blocklist
19. [PyPI torch package](https://pypi.org/pypi/torch/json) -- no riscv64 binary in any version
20. [Debian tracker: pytorch](https://tracker.debian.org/pkg/pytorch) -- v2.12.0+dfsg2-4 built for riscv64 in sid
21. [XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886) -- 100+ RVV FP16 test failures
22. [PyTorch Foundation governance](https://github.com/pytorch-fdn/tac) -- TAC documents
23. [llvm-project issue #87026](https://github.com/llvm/llvm-project/issues/87026) -- LLVM libomp native riscv64 build failure