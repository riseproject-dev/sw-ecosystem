---
title: OpenBLAS
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: optional
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: riscv-gnu-toolchain
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: LAPACK
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="openblas" %}

# OpenBLAS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenBLAS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[OpenBLAS](https://www.openblas.net/) ([github.com/xianyi/OpenBLAS](https://github.com/xianyi/OpenBLAS), canonically tracked today as [github.com/OpenMathLib/OpenBLAS](https://github.com/OpenMathLib/OpenBLAS) after a 2023 org move) is a BSD-3-Clause-licensed, high-performance BLAS (Basic Linear Algebra Subprograms) and LAPACK implementation derived from GotoBLAS2 1.13. It is the default BLAS backend for numpy, scipy, and a large fraction of the scientific Python and HPC software stack on Linux. It is not itself a RISE Project member (RISE membership is corporate/organizational only - see Section 10).

**Governance:** No formal steering committee, charter, or MAINTAINERS/CODEOWNERS file (a direct fetch of such a file 404s). Governance is informal and maintainer-led: Zhang Xianyi (founder, GitHub `xianyi`) and Martin Kroeker (co-maintainer, de facto release manager and primary PR reviewer, GitHub `martin-frbg`) make essentially all architecture-direction calls. Contribution bar is low-friction: fork, write a test, send a PR, add yourself to `CONTRIBUTORS.md`. This same open pattern produced the RISC-V, LoongArch64, CSKY, Elbrus E2000, and WASM ports, all contributed by outside/first-time corporate or individual contributors rather than through a gatekept acceptance process.

**License and funding:** BSD-3-Clause. Historical funding came from the Chan-Zuckerberg Foundation (Dec 2019-Sep 2021) routed through NumFOCUS/the NumPy Foundation (`BACKERS.md`), and an earlier 2013 BountySource crowdfunding campaign. No current named corporate sponsor is publicly listed for the project as a whole; CI infrastructure is provided by OSUOSL, Microsoft Azure, and Cirrus CI (the last of which carries no RISC-V jobs).

**RISC-V-specific corporate contributors:** PingTouGe Semiconductor Co., Ltd. (T-Head/Alibaba) contributed the original RVV 0.7.1 C910/C906 kernels (Oct 2020) and continues to maintain the XuanTie toolchain/QEMU-fork CI path. PLCT Lab (Institute of Software, Chinese Academy of Sciences) contributed the RVV 1.0 intrinsic port. IBM (`ChipKerchner`) is an active secondary reviewer and contributor on RVV LMUL tuning and BF16/FP16 kernels since late 2024. Arm is currently the single most active corporate contributor group to OpenBLAS overall (2024-2026), but its work targets AArch64/SVE/SME, not RISC-V.

**RISE connection (indirect, active):** OpenBLAS is tracked by RISE's System Libraries working group alongside glibc, OpenSSL, LAPACK, oneDAL, and jemalloc. RISE does not fund OpenBLAS as a named project (there is no "RP### - OpenBLAS" funded-project page, unlike e.g. RP013 for PyTorch ATen operators); instead, RISE funds OpenBLAS work indirectly as a layer beneath PyTorch and the Python wheel ecosystem. Concretely: the `riseproject-dev/python-wheels` wheel_builder project (maintained by Rivos Inc. and Baylibre) bundles OpenBLAS variants (`scipy-openblas32`, `scipy-openblas64`) into riscv64 numpy/scipy wheels, and `riseproject-dev/pytorch-ci` builds PyTorch against OpenBLAS on RISE's self-hosted `ubuntu-24.04-riscv` RISC-V runners (Scaleway EM-RV1 hardware). A 2026-08-18 RISE blog post ("PyTorch is available on riscv64!", authored by Ludovic Henry of Qualcomm) states plainly: "Very little of this was PyTorch work. Most of it was in the layers below" - naming OpenBLAS, SLEEF, and NumPy as the actual riscv64 enablement work. [Source: riseproject.dev PyTorch post](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-04-16 | [Issue #1525](https://github.com/OpenMathLib/OpenBLAS/issues/1525) opened by outside contributor `jerryz123` offering a working RISC-V fork; maintainer `xianyi` accepts same day ("We like to merge your RISC-V PR"). | Issue #1525 |
| 2018-04-28 | [PR #1526](https://github.com/xianyi/OpenBLAS/pull/1526) merged: initial generic RV64 scalar port, adapted from ARM kernels, author notes packing/blocking as suboptimal. | PR #1526 |
| 2018-05-23 | v0.3.0 released - first release containing RISC-V support. | GitHub releases |
| 2020-10-07/2020-12-07 | C910V target contributed by PingTouGe Semiconductor (T-Head/Alibaba); first vectorized RISC-V kernels, RVV 0.7.1; shipped in v0.3.13 (2020-12-12). PR #2899 ("Add support for RISC-V Vector"), the original outside RVV fork, was closed unmerged 2020-11-10 - a different, later, successful RVV effort replaced it. | xianyi/OpenBLAS releases |
| 2021-07-02 to 2023-01-29 | Series of build/cross-compile fixes and clarifying issues (#3290, #3277, #3294, #3606, #3646, #3732, #3859, #3889) as early adopters hit lp64 ABI, ILP64, and cross-compile breakage. | Issues listed |
| 2022-11-08 | [Issue #3808](https://github.com/OpenMathLib/OpenBLAS/issues/3808) - PLCT Lab contributors (`ken-unger`, `HellerZheng`) announce a new RVV-1.0-compliant kernel set (48+ new `*_rvv.c` files) targeting SiFive X280, built as a dedicated `risc-v` staging branch rather than modifying C910V code. 19-comment thread documents the blocking chain: RVV-intrinsics-API instability pre-freeze, GCC13/LLVM16 compiler mismatches, and reliance on QEMU for all testing (no contributor-side real hardware). | Issue #3808 |
| 2023-05-22 | [Issue #4050](https://github.com/OpenMathLib/OpenBLAS/issues/4050) opened ("risc-v vector v1.0 support"): flags that the new RVV-1.0 kernels hardcode SiFive X280 VLEN=512 assumptions (`-riscv-v-vector-bits-min=512`, fixed-immediate `vl`, tail-undisturbed policy gaps) that would not generalize to other RVV-1.0 implementations. **Still open as of 2026-10-01**, with no PR or sub-issue formally closing it. | Issue #4050 |
| 2023-12-21 | [Issue #4385](https://github.com/OpenMathLib/OpenBLAS/issues/4385) opened by `luhenry` (RISE/Qualcomm): requests the `risc-v` branch be merged into `develop`, noting numpy and other downstream consumers track `develop`, not feature branches. martin-frbg names the actual blocker: PR #3919 (C910 compiler-compatibility fix) had to land first. | Issue #4385 |
| 2024-01-19 | [PR #4355](https://github.com/OpenMathLib/OpenBLAS/pull/4355) merged: RISCV64_ZVL128B target formally added. | PR #4355 |
| 2024-02-03 | [PR #4472](https://github.com/OpenMathLib/OpenBLAS/pull/4472) ("Merge risc-v branch to develop") merged by martin-frbg: 58 commits, +41,327/-2,576 lines across 177 files. Closes both #3808 and #4385. First shipped in v0.3.27 (2024-04-04, confirmed via the PR's own GitHub milestone field). A post-merge C910V QEMU hang was found and fixed by follow-up PR #4497 within a week. | PR #4472 |
| 2024-02-16 to 2024-08-03 | CI expanded to cover new RISC-V platforms (PR #4504), CMake generic riscv64 support added (PR #4778), GEMM-to-GEMV forwarding enabled for RISC-V/PPC (PR #4831). | PRs listed |
| 2025 (v0.3.31) | SBGEMM/SHGEMM/SBGEMV/SHGEMV (BF16/FP16) kernels land for ZVL128B/ZVL256B (PRs #5290, #5454, #5481/#5492). GEMV_T register-spill regression (PR #5427) found and fixed (PR #5444). SiFive U74 target added with a hand-written scalar assembly 4x4 GEMM kernel (PR #5903, merged 2026-07-14). [Issue #5279](https://github.com/OpenMathLib/OpenBLAS/issues/5279) "Lack of FP16/BF16 precision support for GEMM kernels on RISCV" formally closed 2025-12-30. | PRs/issue listed |
| 2026-01-16/18 | [Issue #5608](https://github.com/OpenMathLib/OpenBLAS/issues/5608) "Undefined behaviour in dynamic_riscv64.c" - the bug that broke the v0.3.33 build (an undeclared-variable compile error hit by the RISE PyTorch-CI team) - fixed via PR #5609, shipped in v0.3.34. | Issue #5608, RISE PyTorch blog |
| 2026-05-12 to 2026-08-16 | TRSM RVV kernels wired for RVV targets in four stages: PR #5807 (wire TRSM/complex-SYMV/complex-GEMM-copy RVV kernels, 2026-05-12), PR #5895 (Add TRSM RVV Kernels for ZVL Targets, 2026-07-08), PR #5928 (make TRSM `_rvv_v1` kernels VLEN-agnostic, 2026-07-18), PR #5830 (Enable RVV-optimized TRSM kernels for RISCV64_ZVL128B, 2026-08-16). This closes what was, as of mid-2026, the most consequential functional gap in the port (Section 6.3). | PRs #5807, #5895, #5928, #5830 |
| 2026-05-13/19 | [Issue #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) - DGEMM correctness regression (v0.3.31 to v0.3.33) on riscv64_zvl256b (SpaceMiT K1): `AᵀA` min eigenvalue went from +1.405e-02 (correct) to -2.779e+00 (wrong), breaking `numpy.linalg.cholesky`. Fixed (PR #5815 cited in prior reporting; root-caused to incorrect contiguous-memory check logic in the RVV kernels). | Issue #5811 |
| 2026-07-13/14 | First architecture-aware cache-size runtime tuning for RISC-V: `get_L2_size()`/`blas_set_parameter()` (commit `269e1cd5`, PR #5909), replacing fixed compile-time P/Q/R blocking. | Commit 269e1cd5 |
| 2026-09-01/02 | Commits `3beb72da`/`c3c6b293` (PR #5991) fix a false-success bug in RISC-V CI: prior to this, RISC-V jobs could report green even when the underlying BLAS/LAPACK test binaries failed. This materially limits confidence in test results reported before September 2026. | Commit c3c6b293 |
| 2026-09-21/28 | CGEMM/ZGEMM/CTRMM complex-MAC accumulator optimizations (PRs #6050-6053), ZVL256B AXPY LMUL m2 to m4 widening (PR #6056), ZVL256B SGEMM K-loop unroll-by-2 (PR #6054), ZVL256B ROTM unit-stride loads/stores (PR #6070, open), C910V-on-upstream-GCC enablement (PR #6068, open), RISCV64_ZVL1024B wide-VLEN target for SpacemiT K3 A100 (PR #6066, open). | PRs listed |

The port is fully upstream in `develop` (not a fork or out-of-tree patch set); the last RISC-V-touching commit found predates this report by 3 days (2026-09-28), confirming active, ongoing maintenance rather than a completed-and-abandoned port.

## 3. Upstream Support Tier

OpenBLAS publishes no formal platform-tier policy document (no `PLATFORMS.md`/`SUPPORT.md`). In practice, riscv64 is treated as a first-class target: it is documented in the README and `TargetList.txt` alongside x86 and aarch64, has three dedicated CI workflow files, and receives a steady stream of kernel-level contributions through 2026.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner type | Native hardware | Native hardware | QEMU user-mode emulation only (no native runner upstream) |
| Hand-written assembly | Extensive (hundreds of files) | Significant | None - entirely C intrinsics |
| Release binaries | Prebuilt (release assets) | Prebuilt (release assets) | None - GitHub releases ship Windows x86/x64/ARM64 assets only, no riscv64 filenames in v0.3.34 |
| PyPI distribution | Via numpy/scipy wheel bundling | Via numpy/scipy wheel bundling | No standalone `openblas` PyPI package exists (404); numpy/scipy bundle it internally, historically bridged for riscv64 by RISE's wheel_builder |
| Build-blocking status | Release-blocking | Release-blocking | Not release-blocking (build/test only, see Section 13) |
| Active corporate contributors | Intel, AMD | Arm (most active overall, 2024-2026) | PingTouGe/T-Head, PLCT Lab/ISCAS, IBM |

The single most consequential practical limitation remains that every riscv64 CI job runs under QEMU on x86-64 runners - no native RISC-V hardware exists anywhere in upstream's CI pipeline, and (per Section 2) a false-success CI bug went undetected until September 2026, meaning some historical "passing" riscv64 CI runs prior to that date may not have actually executed what they claimed to.

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Supported targets

| Target | Description | ISA string |
|---|---|---|
| `RISCV64_GENERIC` | Generic scalar RV64GC, no vector extension | `rv64imafdc -mabi=lp64d` |
| `C910V` | T-Head C910/C920, legacy RVV 0.7.1 (vendor `xtheadc`) | `rv64imafdcv0p7_zfh_xtheadc -mabi=lp64d -mtune=c920` |
| `x280` | SiFive X280, RVV 1.0, VLEN=512, Zba/Zbb | `rv64imafdcv_zba_zbb_zfh_zvl512b -mabi=lp64d` |
| `RISCV64_ZVL128B` | RVV 1.0, VLEN>=128 | `rv64imafdcv[_zvfbfwma][_zvfh_zfh] -mabi=lp64d` |
| `RISCV64_ZVL256B` | RVV 1.0, VLEN>=256 | `rv64imafdcv[_zvfbfwma][_zvfh_zfh]_zvl256b -mabi=lp64d` |
| `U74` | SiFive U74/StarFive JH7110/VisionFive2, no vector unit | `rv64imafdc_zba_zbb -mabi=lp64d -mtune=sifive-u74`, hand-written assembly 4x4 DGEMM kernel (`kern_u74.S`, 267 lines) |
| `RISCV64_ZVL1024B` (open PR #6066, not yet merged) | Wide-VLEN target for SpacemiT K3 A100 | Not yet finalized |

`DYNAMIC_ARCH=1` builds `RISCV64_GENERIC + RISCV64_ZVL128B + RISCV64_ZVL256B` in a single binary and dispatches at runtime via the Linux `riscv_hwprobe` syscall (kernel 6.5+), falling back to `AT_HWCAP` plus an inline `vsetvli`/`csrr vtype` probe (`driver/others/detect_riscv64.c`, ported from VideoLAN dav1d) to distinguish RVV 1.0 from the incompatible RVV 0.7.1. No RISC-V 32-bit target exists; no bare-metal (`riscv64-unknown-elf`) target is supported ([Issue #5017](https://github.com/OpenMathLib/OpenBLAS/issues/5017) confirms this is explicitly out of scope).

### 4.2 Kernel source inventory

`kernel/riscv64/` holds 229 files (219 `.c`, 1 `.S`, plus a Python code generator and Makefile configs). Pattern:

- `*_rvv.c` (~95 files): RVV-1.0 standard intrinsics, `#include <riscv_vector.h>`. Covers all BLAS L1 operations in s/d/c/z, used by x280 and as the basis for ZVL kernels.
- `*_rvv_v1*.c`: x280-specific TRSM/TRMM/SYMM-copy and vl-agnostic GEMM kernels, requires RVV 1.0 + Zba + Zbb.
- `*_zvl128b.c` / `*_zvl256b.c` (10 files each): auto-generated by `kernel/riscv64/generate_kernel.py` (673 lines), fixed tile sizes per VLEN. Covers SGEMM/DGEMM/CGEMM/ZGEMM, TRMM, SBGEMM, SHGEMM.
- `_c910v.c` (2 files): T-Head proprietary intrinsics via the XuanTie toolchain (SGEMM 16x4, DGEMM 8x4), gated by the `RISCV_0p10_INTRINSICS` compat macro in `common_riscv64.h`.
- `_vector.c` (~48 files): length-agnostic RVV intrinsics used by C910V (L1/L2) and ZVL256B.
- Generic scalar (~52 files): plain C, no vectorization, used by `RISCV64_GENERIC`.

No JIT backend exists in OpenBLAS (not applicable to this project class).

### 4.3 ISA extension coverage

| Extension | Status |
|---|---|
| RVV 0.7.1 (pre-standard) | C910V only, vendor XuanTie toolchain required |
| RVV 1.0 (V) | ZVL128B, ZVL256B, x280 |
| Zvl128b / Zvl256b (runtime VLEN detect) | Detected via `driver/others/detect_riscv64.c`, dispatched by `dynamic_riscv64.c` |
| Zvl512b | x280 compile-time flag only, no separate kernel files; PR #6066 (open) would add a dedicated ZVL1024B |
| Zvfh (scalar/vector FP16) | SHGEMM/SHGEMV, requires `BUILD_HFLOAT16=1`, GCC14+/Clang17+ |
| Zvfbfwma (BF16) | SBGEMM/SBGEMV, requires `BUILD_BFLOAT16=1` |
| Zba, Zbb | x280 and U74 march flags only, no explicit bit-manipulation intrinsics in kernel C code |
| Xtheadc (T-Head vendor) | C910V only |

### 4.4 Comparison to amd64/arm64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD/vector kernels | Hand-tuned AVX2/AVX-512 assembly | Hand-tuned NEON/SVE/SME | RVV-1.0 C intrinsics (no assembly), RVV-0.7.1 for C910V legacy |
| GEMM | Full hand-tuned assembly | Full hand-tuned assembly | RVV intrinsics, VLEN-specific tiles; cache-aware blocking added July 2026 |
| TRSM | Full | Full | RVV kernels merged across ZVL128B/ZVL256B/x280 as of Aug 2026 (previously generic-only, Section 6.3) |
| Complex GEMM (CGEMM/ZGEMM) | Full | Full | RVV kernels present for ZVL128B/ZVL256B/x280 (actively optimized through Sept 2026); still falls back to generic scalar C on C910V |
| LASWP (row pivot swap) | Optimized | Optimized | Generic scalar C fallback on all riscv64 targets - no RVV-specific kernel exists |
| Runtime CPU dispatch | Mature, decades of tuning | Mature | `riscv_hwprobe`-based, added 2024, actively hardened through Jan 2026 (UB fix, PR #5609) |

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Make build

riscv64 unconditionally sets `NO_BINARY_MODE=1`/`BINARY_DEFINED=1` and excludes the `-m64` flag via an explicit `ifneq` guard; `GEMM_GEMV_FORWARD=1` is set for riscv64.

```sh
# C910V (RVV 0.7.1) - requires the vendor XuanTie-900-gcc toolchain; no upstream GCC/Clang supports this march string
make HOSTCC=gcc TARGET=C910V CC=riscv64-unknown-linux-gnu-gcc FC=riscv64-unknown-linux-gnu-gfortran

# x280 (RVV 1.0, SiFive-tuned)
make HOSTCC=gcc TARGET=x280 NUM_THREADS=8 CC=riscv64-unknown-linux-gnu-clang FC=riscv64-unknown-linux-gnu-gfortran

# RISCV64_ZVL256B, generic RVV 1.0, 256-bit, cross-compiled with Clang
make TARGET=RISCV64_ZVL256B CFLAGS="-DTARGET=RISCV64_ZVL256B" \
  BINARY=64 ARCH=riscv64 CC='clang -target riscv64-unknown-linux-gnu' \
  AR=riscv64-unknown-linux-gnu-ar AS=riscv64-unknown-linux-gnu-gcc \
  LD=riscv64-unknown-linux-gnu-gcc FC=riscv64-unknown-linux-gnu-gfortran \
  HOSTCC=gcc HOSTFC=gfortran -j
```

### 5.2 CMake build

No CMake toolchain file exists for riscv64 anywhere in the repository (`cmake/riscv64.cmake` / `cmake/toolchain-riscv64.cmake` do not exist). Cross-compilation requires passing `CMAKE_C_COMPILER`/`CMAKE_Fortran_COMPILER`/`CMAKE_SYSTEM_PROCESSOR` directly on the command line, the same pattern used for other embedded targets (ARMV5, Android, OHOS):

```sh
cmake -S . -B build \
  -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_Fortran_COMPILER=riscv64-linux-gnu-gfortran \
  -DTARGET=RISCV64_GENERIC -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
```

[PR #5509](https://github.com/OpenMathLib/OpenBLAS/pull/5509) (merged 2025-10-17) added default CMake compiler options for RISC-V; `BUILD_BFLOAT16`/`BUILD_HFLOAT16` are the two CMake options that are riscv64-specific in effect, appending `_zvfbfwma`/`_zvfh_zfh` to `-march` (`cmake/system.cmake`, `cmake/cc.cmake`).

### 5.3 Compiler requirements - exact and consequential

> "GCC 14 or later is required on current OpenBLAS releases when building the `RISCV64_ZVL128B` or `RISCV64_ZVL256B` targets. GCC 13 does not implement the segmented load/store intrinsics (`__riscv_vsseg*`) used by the `_rvv.c` kernels; under GCC 13 the build still completes and produces a library, but the affected routines fall back to scalar code paths. Functional tests will pass on the resulting library; only disassembly-level verification detects the regression." (`docs/install.md`, documented via [PR #5819](https://github.com/OpenMathLib/OpenBLAS/pull/5819), merged 2026-06-18)

Documented verification method:

```sh
riscv64-linux-gnu-objdump -d libopenblas*.a | \
    grep -c 'vle64\|vfmacc\|vsetvli\|vlse64\|vfmul\|vfadd\|vfredosum'
```

Expected count ~12,000-14,000 for a correctly vectorized v0.3.33 build (GCC14: ~12,691; GCC15: ~14,355). This is a silent-correctness-class risk: a GCC13 build neither errors nor fails its own test suite, it simply loses vectorization.

- **RISCV64_GENERIC:** any GCC supporting rv64imafdc (GCC 7+).
- **C910V:** XuanTie-900-gcc V2.8.0 vendor toolchain only; upstream GCC/Clang do not support the `xtheadc` march string. [PR #6068](https://github.com/OpenMathLib/OpenBLAS/pull/6068) (open, 2026-09-28) proposes enabling a C910V build path on upstream GCC - unmerged as of this report.
- **Zvfh/Zvfbfwma:** Clang 17+ or GCC 14+.
- **CI toolchain:** upstream's own CI does not use plain-release GCC or Clang - it uses a pinned nightly Clang build (`riscv-collab/riscv-gnu-toolchain`, version 15.1.0, nightly dated 2025-08-29), invoked as `clang --rtlib=compiler-rt -target riscv64-unknown-linux-gnu --sysroot /opt/riscv/sysroot --gcc-toolchain=/opt/riscv/lib/gcc/riscv64-unknown-linux-gnu/15.1.0/`. This pin is a CI-fragility risk: if that specific nightly tarball becomes unavailable, CI silently fails to build.

### 5.4 QEMU testing

ZVL targets use a custom pre-built `qemu-riscv64` v10.1 hosted on a maintainer's GitHub Gist (not the distro `qemu-user` package, even though `apt install qemu-user qemu-kvm` is run first):

```
QEMU_CPU (RISCV64_ZVL128B): rv64,g=true,c=true,v=true,vext_spec=v1.0,vlen=128,elen=64
QEMU_CPU (RISCV64_ZVL256B): rv64,g=true,c=true,v=true,vext_spec=v1.0,vlen=256,elen=64,zfh=true,zvfh=true,zvfbfwma=true
QEMU_CPU (DYNAMIC_ARCH=1):  rv64,g=true,c=true,v=true,vext_spec=v1.0,vlen=256,elen=64
```

C910V testing uses a separate, non-upstream **XuanTie QEMU fork** (`XUANTIE-RV/qemu`, pinned commit `e0ace167`, branch `xuantie-qemu-9.0`, plus two extra patches) built from source with `--target-list=riscv64-linux-user --disable-system`. No riscv64 Dockerfile or container-based CI exists anywhere in the repository.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 BLAS L1

All L1 operations (amax, amin, asum, axpy, axpby, copy, dot, iamax, iamin, nrm2, rot, rotm, scal, swap, etc.) are implemented with RVV intrinsics for ZVL128B, ZVL256B, and x280, covering real and complex, single and double precision, plus FP16 (SHAXPY etc.) and BF16 variants added through 2025. **Status: complete for RVV-1.0 targets.**

### 6.2 BLAS L2

GEMV (N/T), SYMV, HEMV, GBMV, SBGEMV, SHGEMV all have RVV implementations. Cache-friendly GEMV_N traversal and a GEMV_T register-spill fix both landed in 2025. **Status: complete coverage, no documented gaps for standard operations.**

### 6.3 BLAS L3

| Routine | ZVL128B | ZVL256B | x280 | C910V |
|---|---|---|---|---|
| SGEMM/DGEMM | RVV kernel, continuously optimized (K-loop unroll PR #6054, Sept 2026) | RVV kernel | `_rvv_v1` vl-agnostic kernel | vendor-intrinsic kernel |
| CGEMM/ZGEMM | RVV kernel (complex-MAC accumulator optimizations, PRs #6050-6053, Sept 2026) | RVV kernel | RVV kernel | generic scalar C fallback |
| TRSM (all 4 variants) | RVV kernel, merged via PRs #5807/#5895/#5928/#5830 (2026-05 to 2026-08) | RVV kernel, merged same chain | `_rvv_v1` kernel | generic scalar C fallback |
| TRMM | RVV kernel | RVV kernel | `_rvv_v1` kernel | generic scalar C fallback |
| SYMM/HEMM | RVV copy kernels | RVV copy kernels | `_rvv_v1` copy kernels | generic scalar C fallback |
| SBGEMM/SHGEMM (BF16/FP16) | RVV kernel | RVV kernel | not present | not present |
| LASWP (row pivot swap) | generic scalar C fallback | generic scalar C fallback | generic scalar C fallback | generic scalar C fallback |

**TRSM, previously the most consequential functional gap in the port (no RVV kernel existed for any ZVL target as of mid-2026), is now closed** via the four-PR chain in Section 2 (#5807, #5895, #5928, #5830), completed 2026-08-16. What remains open per the current readiness grade: **complex GEMM (CGEMM/ZGEMM) and LASWP still fall back to generic scalar C on the legacy C910V target, and LASWP falls back to generic scalar C across every riscv64 target without exception.** LASWP underlies LU-factorization-based LAPACK routines (`DGETRF`/`DGETRS`), so any such call pays a non-vectorized row-swap cost on riscv64 regardless of target.

### 6.4 LAPACK

Bundled netlib LAPACK compiles for riscv64 but has no RISC-V-specific kernel implementations (generic C/Fortran only). LAPACK's own test suite is explicitly skipped in upstream CI with a hardcoded `exit 0` ("these take a very long time"), meaning **LAPACK correctness on riscv64 is not validated by upstream CI at all** - only the BLAS layer is exercised under QEMU.

## 7. CI/CD Infrastructure

Three of the repository's GitHub Actions workflow files carry RISC-V content; none use native riscv64 hardware.

**`.github/workflows/riscv64_vector.yml`** ("riscv64 zvl256b qemu test")
- Trigger: `push`/`pull_request` (no `workflow_dispatch`, no schedule). Guard: `if: github.repository == 'OpenMathLib/OpenBLAS'` - does not run on forks, including the `xianyi/OpenBLAS` mirror.
- Runner: `ubuntu-latest` (x86-64). Toolchain: pinned Clang nightly 15.1.0 (2025-08-29) + `riscv-gnu-toolchain`. Emulation: custom-built `qemu-riscv64` v10.1.
- Matrix: `RISCV64_ZVL128B`, `RISCV64_ZVL256B` (+BF16/HF16 builds), `DYNAMIC_ARCH=1`/`RISCV64_GENERIC`.
- Runs BLAS/LAPACK cblat/dblat/sblat/zblat/ctest suites and, on ZVL256B, `test_sbgemm`/`test_sbgemv`/`test_shgemm`/`test_shgemv`/`test_bgemm`. **Netlib LAPACK tests are present in the workflow but explicitly bypassed** (`echo "Skipping netlib tests in CI"; exit 0`).

**`.github/workflows/c910v.yml`** ("c910v qemu test")
- Same trigger/guard pattern, `ubuntu-latest` runner. Toolchain: vendor Xuantie-900-gcc (Aliyun OSS download), static linking (`NO_SHARED=1`). Emulation: the non-upstream XuanTie QEMU fork (commit `e0ace167`, branch `xuantie-qemu-9.0`, plus two patches).
- Matrix: `RISCV64_GENERIC`, `C910V`. Runs `openblas_utest`/`openblas_utest_ext` and full L1/L2/L3 BLAS test suites (s/d/c/z) with retry-on-timeout wrapping.

**`.github/workflows/dynamic_arch.yml`** ("continuous build")
- Has `workflow_dispatch` in addition to `push`/`pull_request`. Its `cross_build` job cross-compiles `TARGET=RISCV64_GENERIC` alongside mips64el/mipsel/alpha on `ubuntu-22.04` - **build only, no execution/testing under QEMU.**

No `.gitlab-ci.yml` exists in the repository. `Jenkinsfile` targets s390x only. `.cirrus.yml` is entirely commented out and only ever covered Apple M-series macOS. Neither contains any RISC-V reference.

**Material CI caveat:** a false-success bug in the RISC-V CI jobs - where a job could report green even when underlying BLAS/LAPACK test binaries failed - was identified and fixed only in September 2026 ([commit `c3c6b293`](https://github.com/OpenMathLib/OpenBLAS/commit/c3c6b2937e717809c4a37bfb3eec8d5d092dab1b), PR #5991). This means CI-green status on riscv64 jobs prior to that fix should not be taken at face value.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | Native | Native | QEMU user-mode only (no native runner) |
| Test suite executed | Full BLAS + LAPACK | Full BLAS + LAPACK | BLAS only; LAPACK explicitly skipped |
| RISE-provided runners used by OpenBLAS CI | n/a | n/a | None directly - RISE's `ubuntu-24.04-riscv` runners back `pytorch-ci`/`python-wheels`, not `OpenMathLib/OpenBLAS`'s own CI |

## 8. Distribution and Release Status

**Upstream GitHub releases:** v0.3.34 (latest, confirmed by direct fetch of the releases page) ships only `OpenBLAS-0.3.34.tar.gz`/`.zip` (source) and Windows x64/x86/WoA64 zips. No asset filename contains "riscv" or "riscv64" in any recent release. Release notes mention RISC-V code fixes (SGEMM/DGEMM on ZVL256B), confirming active RISC-V work in source without a corresponding binary release artifact.

**PyPI:** No `openblas`, `pyopenblas`, or similarly-named package exists (`pypi.org/pypi/openblas/json` returns HTTP 404; confirmed independently twice). OpenBLAS is a C/Fortran library, not a Python package in its own right; numpy and scipy bundle it internally via `scipy-openblas32`/`scipy-openblas64` build dependencies. A RISE/GitLab mirror check (`gitlab.com/.../packages/pypi/simple/openblas/`) 302-redirects back to the 404ing PyPI URL - no separate RISE-built wheel for a package literally named "openblas" exists; the actual RISE artifact is the `scipy-openblas32`/`scipy-openblas64` bundling inside numpy/scipy wheels (Section 10).

**Debian:** `libopenblas0` and the 15 related riscv64 packages (`libopenblas-dev`, `libopenblas64-0`, OpenMP/pthread/serial variants, etc.) are built and shipping for riscv64 in Debian unstable/sid, version **0.3.33+ds-3**.

**Ubuntu 26.04 (resolute):** confirmed via direct package-search fetch - riscv64 binaries for the full `libopenblas*`/`libopenblas64-*` package set (standard, OpenMP, pthread, serial, dev variants) at version **0.3.32+ds-5**.

**Ubuntu 24.04 LTS (noble):** `libopenblas0` **0.3.26+ds-1** in the `universe` component for riscv64 - this predates DYNAMIC_ARCH riscv64 support (added v0.3.28) and the ZVL128B/ZVL256B targets, meaning LTS users on noble get a materially older, less-vectorized build than what upstream `develop` now provides.

**Conclusion / what a user must do:** there is no official upstream riscv64 binary via GitHub Releases or PyPI. A working riscv64 OpenBLAS comes from (a) building from source against the documented toolchain requirements in Section 5, or (b) a distro package - Debian sid and Ubuntu 26.04 (resolute) carry current-generation (0.3.32-0.3.33) builds; Ubuntu 24.04 LTS carries a stale 0.3.26 build lacking DYNAMIC_ARCH/ZVL/BF16/FP16 support. This distro-mediated distribution is the basis for the `release_provider: distro` classification in Section 13.

**Arch Linux RISC-V:** Data not available - the `archriscv.felixc.at` package index could not be queried in this research pass.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| GCC | build-dependency, critical | Green for RISCV64_GENERIC (GCC 7+) | GCC 14+ required to exercise RVV paths on ZVL128B/ZVL256B; GCC 13 silently emits scalar fallback (Section 5.3) | riscv64 GCC packages ship broadly across distros | Version-skew correctness trap undetected by functional tests, only by disassembly |
| GNU binutils | build-dependency, optional | Green (riscv64 support since 2.28+) | Green | Ships broadly | None known |
| GNU make | build-dependency, critical | Green - primary build driver (`Makefile.riscv64`) | Green | Ships broadly | Default/primary build path for all riscv64 targets |
| CMake | build-dependency, optional | Builds, but no riscv64 toolchain file exists in-tree; cross-compile flags must be passed manually | Less exercised than the Make path in upstream CI | Ships broadly | Default compiler options added via PR #5509 (Oct 2025); still described as the secondary/experimental build path for riscv64 |
| riscv-gnu-toolchain | build-dependency, critical | Pinned nightly 15.1.0 (2025-08-29) used in upstream CI's Clang build; also the standard cross GCC toolchain for non-CI builds | Toolchain version pin is a CI-fragility point - if the pinned nightly disappears, CI silently fails to build | n/a (toolchain, not shipped) | https://github.com/riscv-collab/riscv-gnu-toolchain |
| Python | build-dependency, optional | Drives `kernel/riscv64/generate_kernel.py` (673 lines), the code generator that emits the ZVL128B/ZVL256B tiled GEMM kernel `.c` files; also runs the (CI-skipped) netlib LAPACK `testing.py` harness | n/a (generator script, not itself tested) | n/a | Build-time only, not a runtime dependency |
| glibc | runtime-dependency, critical | Green (rv64gc/lp64d supported since glibc 2.27) | Mostly green; the `riscv_hwprobe` syscall that DYNAMIC_ARCH dispatch depends on requires Linux kernel 6.5+ | Ships in all riscv64 distros | Ubuntu 24.04's glibc 2.39 predates several IFUNC/hwprobe crash-class fixes [NEEDS VERIFICATION - single-source claim from prior dependency-chain research, not independently re-confirmed in this pass] |
| OpenMP | runtime-dependency, optional | Green (`USE_OPENMP=1` threading backend, ships with GCC's libgomp) | Green | Ships with riscv64 GCC | None known |
| LAPACK | runtime-dependency, critical | Green (bundled netlib LAPACK compiles for riscv64) | **Not exercised in upstream CI** - explicitly skipped with `exit 0` (Section 6.4, Section 7) | Compiled into OpenBLAS itself, not separately packaged | Structurally unvalidated correctness risk on riscv64, independent of the BLAS-layer bugs tracked in Section 11 |
| QEMU | test-dependency, critical | n/a | All riscv64 CI test execution runs through QEMU (stock `qemu-riscv64` v10.1 custom build for ZVL/generic targets, a non-upstream XuanTie fork for C910V); cannot model cache/pipeline behavior, so performance regressions and some concurrency bugs are invisible to CI | riscv64 QEMU packages ship broadly for local use | No native riscv64 CI hardware exists upstream as an alternative |

## 10. Ecosystem Status

OpenBLAS is not itself a plugin host, but it sits beneath a large, actively-tracked ecosystem of Python numerical packages that must themselves ship working riscv64 builds, and that ecosystem is exactly the channel through which riscv64 OpenBLAS reaches end users (Section 8 shows there is no direct upstream riscv64 release).

**RISE wheel_builder** (`riseproject-dev/python-wheels`, maintained by Rivos Inc. and Baylibre): as of its 2025-05-14 announcement, builds and serves prebuilt riscv64 wheels for 49 Python packages (numpy, scipy, pandas, Pillow, matplotlib, PyYAML, etc.) targeting CPython 3.10-3.13 with pip >=24.1, manylinux_2_35. Install time via wheel_builder is ~25 seconds on a VisionFive 2 versus ~15 minutes building numpy from source - a roughly 35x reduction in time-to-working-binary for the riscv64 scientific Python stack. Its numpy v2.2.2 wheels bundle `scipy-openblas64` version 0.3.28.0.2, identical to what PyPI ships for numpy v2.2.2 on other architectures, giving riscv64 users the same OpenBLAS bill-of-materials as amd64/arm64 users. The project's own wheel-builder index (`riseproject.gitlab.io/python/wheel_builder/`) lists `scipy-openblas32` and `scipy-openblas64` among its 86 tracked packages.

**PyTorch riscv64 wheels** (`riseproject-dev/pytorch-ci`): per the 2026-08-18 RISE blog post, OpenBLAS performs the matrix-multiply work for PyTorch's riscv64 wheel builds (oneDNN/MKLDNN is disabled on riscv64). Built on the `ubuntu-24.04-riscv` self-hosted RISE runner label (Scaleway EM-RV1 hardware); since late April 2026 the CI has handled 40,000+ relay events across ~3,900 builds (cold-cache ~20h, hot-cache ~1h30 at 99%+ cache hit rate). A full test run on 2026-08-14 executed 212,038 tests (165,591 passed, 191 failed, 46,256 skipped) - the OpenBLAS-dependent matmul path is part of what that suite exercises.

**No dedicated OpenBLAS fork or repo exists in the `riseproject-dev` GitHub org** - a direct search for "OpenBLAS"/"openblas" under that org returns zero repositories. OpenBLAS is consumed, patched upstream when bugs are hit (e.g., the v0.3.33 `dynamic_riscv64.c` build break, Section 2), and tracked as a dependency inside `python-wheels`, `pytorch-ci`, and the `system-libraries-wg` working group, not maintained as a separate RISE project.

**Net assessment:** riscv64 coverage of the downstream numpy/scipy/PyTorch ecosystem that depends on OpenBLAS is good and actively maintained via RISE infrastructure, even though OpenBLAS itself has no official upstream riscv64 release (Section 8). This is a materially different risk profile from "the dependency itself is unported" - the gap is purely in upstream's own release/packaging practice, not in ecosystem-wide enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4050](https://github.com/OpenMathLib/OpenBLAS/issues/4050) | risc-v vector v1.0 support (VLEN/X280-tuning generalization) | **Open** since 2023-05-22 | Design/architecture | No PR or sub-issue formally closes it; last substantive comment 2024-02-06 confirming `c/zsymv` kernels still lack RVV implementations |
| [#5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) | DGEMM correctness regression (v0.3.31->v0.3.33) on riscv64_zvl256b, non-PSD `AᵀA` output, breaks `numpy.linalg.cholesky` | Closed 2026-05-19 | **Correctness** | Isolated to the ZVL256B RVV kernel path; not reproducible on SiFive U74 (no RVV, falls to generic) |
| [#5428](https://github.com/OpenMathLib/OpenBLAS/issues/5428) | RISCV64_ZVL128B and ZVL256B targets broken by a march change assuming non-mandatory Zvfh/Zfh extensions, breaking SIGILL dynamic-dispatch detection | Closed 2025-09-09 | **Correctness/build** | Opened 2025-08-26 |
| [#5608](https://github.com/OpenMathLib/OpenBLAS/issues/5608) | Undefined behaviour in `dynamic_riscv64.c` | Closed 2026-01-16 | Build-breaking | This is the bug that broke v0.3.33 for the RISE PyTorch-CI team; fixed in v0.3.34 |
| [#5430](https://github.com/OpenMathLib/OpenBLAS/issues/5430) | Register spillage in GEMV from manual 4-way unrolling (LMUL=8 exceeds 32 available vector registers) | Closed 2025-08-27 | Performance | Fixed by PR #5444, 4x+ speedup recovery |
| [#5286](https://github.com/OpenMathLib/OpenBLAS/issues/5286) | Performance regression: TARGET=RISCV64_ZVL256B significantly slower than RISCV64_GENERIC for HBMV | Closed 2025-05-28 | Performance | User-reported with benchmark images (no extractable numeric text) |
| [#5279](https://github.com/OpenMathLib/OpenBLAS/issues/5279) | Lack of FP16/BF16 precision support for GEMM kernels on RISC-V | Closed 2025-12-30 | Feature gap | Closed by the SBGEMM/SHGEMM kernel work (PRs #5454, #5290, #5481/#5492) |
| [#4719](https://github.com/OpenMathLib/OpenBLAS/issues/4719) | Test segmentation fault with v0.3.27 on RISC-V | Closed | Correctness | 27-comment thread |
| [#4941](https://github.com/OpenMathLib/OpenBLAS/issues/4941) | Error when QEMU-testing riscv64_zvl128b | Closed | CI/tooling | |

**Correctness bugs are the category to weight most heavily**: #5811 and #5428 both show that the ZVL128B/ZVL256B RVV kernel paths have shipped silently-wrong results in released versions (v0.3.31-v0.3.33) that were only caught by downstream users (SpaceMiT K1 / BananaPi F3 hardware), not by upstream's own QEMU-based CI. Combined with the September 2026 discovery that RISC-V CI itself had a false-success bug (Section 7), the realistic confidence level in "CI green equals correct" for this port's history prior to late 2026 should be treated as lower than for amd64/arm64.

## 12. Objections and Upstream Blockers

**Martin Kroeker (martin-frbg) is the primary gatekeeper for essentially all RISC-V-touching PRs.** His stated positions on file:

- On an auto-detecting generic-target PR: "The generic target is the one of last resort and poorest performance... If you're cross-compiling for unknown riscv64 targets, you'd be much better off doing a DYNAMIC_ARCH build." Effectively a rejection.
- On the 2024 branch-merge decision (Issue #4385): he initially pushed back that RVV support beyond C910V was "stuck in the mess of incompatible and/or unfinished specifications," then conceded the RVV-1.0 intrinsics API was close to freezing once `luhenry` (RISE/Qualcomm) pointed out GCC 14/Clang 17 support was imminent - an example of the gate relaxing once toolchain maturity was demonstrated, not an indefinite block.
- On PR #4472 (the actual merge): worried openly about the changeset's size (58 commits, +41k/-2.5k lines, 177 files) "touching files outside riscv64-specific modules," and about merging before a native-hardware CI job existed at all ("we do not have any CI job that runs on actual RISC-V hardware yet"). Approved and merged once author `sergei-lewis` argued that further fork divergence was the bigger risk.

**ChipKerchner (IBM)** is an active secondary reviewer on RISC-V kernel PRs, with a recurring theme of concern about hardware-specific tuning (particularly work validated only on SpaceMiT/BananaPi in-order cores) regressing on out-of-order RISC-V implementations.

**No evidence of organizational resistance to RISC-V as an architecture class** - the contribution pattern (fork/test/PR, low review friction, multiple outside-corporate contributors landing architecture-defining work) is the same one that onboarded LoongArch64, CSKY, and WASM. The practical blockers that have mattered historically are technical and sequencing-related (compiler/intrinsics-API immaturity pre-2024, lack of native test hardware, CI reliability), not maintainer opposition to RISC-V itself.

**The structural LAPACK test gap (Section 6.4, Section 9) is self-perpetuating**: upstream CI cannot run netlib LAPACK tests on riscv64 because they time out under QEMU emulation, and no native hardware runner exists to replace QEMU for that purpose.

## 13. Readiness Assessment

- **Color:** blue (n/a - blue has no sub-type; CI builds and tests riscv64 but upstream does not publish a riscv64 release artifact)
- **Release provider:** distro
- **Optimization level (optimization-purpose project):** partial - primary GEMM (SGEMM/DGEMM/CGEMM/ZGEMM, BF16/FP16), TRSM (merged via PRs #5830/#5895/#5928 in 2026), TRMM, and full BLAS L1/L2 all have RVV-1.0 intrinsics for the ZVL128B/ZVL256B/x280 targets; complex GEMM (CGEMM/ZGEMM) and LASWP still fall back to generic scalar C on the legacy C910V target, and LASWP falls back to generic scalar C in general across all riscv64 targets. Coverage is broad but not fully comparable to amd64/arm64 everywhere.

**Justification:** Three upstream GitHub Actions workflows ([riscv64_vector.yml](https://github.com/OpenMathLib/OpenBLAS/blob/develop/.github/workflows/riscv64_vector.yml), [c910v.yml](https://github.com/OpenMathLib/OpenBLAS/blob/develop/.github/workflows/c910v.yml)) cross-compile for riscv64 and actually execute the BLAS/LAPACK test suites under QEMU user-mode emulation (stock `qemu-riscv64` for ZVL128B/ZVL256B/generic, a XuanTie QEMU fork for C910V) - so this is build=yes/test=yes. Upstream does not publish a riscv64 release artifact itself: GitHub Releases ship only Windows/source assets (no riscv64 filenames in the v0.3.34 release) and no `openblas` package exists on PyPI; the consumable riscv64 binary instead comes from Debian (`libopenblas0` 0.3.33+ds-3, riscv64) and Ubuntu packaging (0.3.32+ds-5 on 26.04/resolute, 0.3.26+ds-1 on 24.04/noble) - i.e. `release_provider = distro`, not upstream - which places the project at build=yes/test=yes/release=no, i.e. blue, per the color table.

**Pending work that could change the grade:** Open [PR #5561](https://github.com/OpenMathLib/OpenBLAS/pull/5561) (SGEMM/DGEMM/CGEMM/ZGEMM kernel rewrite for ZVL128B/ZVL256B, stalled since Dec 2025 over reviewer concerns about hardware-specific tuning) and [PR #5573](https://github.com/OpenMathLib/OpenBLAS/pull/5573) (interleaving / TRMM-SYMM disentangling, open since Dec 2025) could change RVV coverage further; tracking issue [#4050](https://github.com/OpenMathLib/OpenBLAS/issues/4050) (RVV-1.0 design/VLEN portability) remains open since 2023; recent correctness regressions ([#5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) DGEMM on ZVL256B, [#5428](https://github.com/OpenMathLib/OpenBLAS/issues/5428) broken ZVL128B/256B targets) were found and fixed in 2025-2026, indicating the port is actively maintained but still maturing. No upstream GitHub-release or PyPI riscv64 artifact effort was found in flight that would move this to green. On the RISE side, the wheel_builder and PyTorch-CI efforts (Section 10) could in principle extend to publishing an OpenBLAS-specific riscv64 artifact channel, but no such effort was identified as in flight.

## 14. Investment Analysis

Before sizing new work: RISE has already substantially reduced the ecosystem-level enablement cost through wheel_builder (49-package riscv64 wheel coverage including numpy/scipy bundling OpenBLAS) and PyTorch-CI (RISC-V hardware runners already exercising OpenBLAS-backed matmul at scale, 40,000+ CI events since April 2026). That work should not be re-sized below. What remains uncovered by RISE is upstream-OpenBLAS-side kernel/CI/release work.

### 14.1 Functional Enablement

TRSM, the single largest functional gap identified as of mid-2026, is now closed upstream (Section 2, Section 6.3). The remaining functional gaps are narrower:

| Item | Description | Effort | Priority |
|---|---|---|---|
| F1 | Port C910V complex GEMM (CGEMM/ZGEMM) off the generic scalar fallback onto RVV 0.7.1 intrinsics | 2-3 person-weeks | Medium |
| F2 | Implement an RVV LASWP kernel for ZVL128B/ZVL256B (currently generic scalar C on every riscv64 target) | 1-2 person-weeks | Medium |
| F3 | Implement `c/zsymv` RVV kernels for ZVL targets (gap identified in Issue #4050, still unaddressed) | 2-3 person-weeks | Medium |
| F4 | LAPACK correctness validation on riscv64 (currently entirely untested in upstream CI) | 4-8 person-weeks | High |

### 14.2 Performance Optimization

Representative, source-cited speedups already delivered (all relative to the pre-patch OpenBLAS baseline on the same riscv64 hardware; no cross-architecture GFLOPS comparison exists in current research):

- AXPY, ZVL256B/SpaceMiT X100: SAXPY +25-30%, DAXPY +29-40% across sizes 256-1024, bit-identical output (PR #6056).
- GEMV-N, ZVL256B: SGEMV up to +30%, DGEMV up to +31% (PR #6057).
- SGEMM K-loop unroll-by-2, ZVL256B: +3.4% to +5.6% across 256-1024 (PR #6054).
- GEMM edge-case handling (v0.3.33): up to 9x SGEMM, 3x DGEMM on non-aligned dimensions (PR #5674).
- SBGEMV/SHGEMV: up to 32x vs scalar baseline (v0.3.31, PR #5481).
- Academic result (arXiv:2502.13839): optimized vector kernels deliver 1.5x-10x speedup over OpenBLAS baseline for band-matrix BLAS (GBMV/SBMV/TBMV/TBSV) on T-Head TH1520 and SpacemiT K1 hardware, with gains concentrated below bandwidth thresholds of 14-20 diagonals.
- Caveat found in the same research line: for SDOT specifically, the plain Netlib reference implementation has been reported to outperform OpenBLAS by nearly 3x on RISC-V - OpenBLAS is not uniformly the fastest option for every routine.

Data not available: absolute GFLOPS figures enabling a direct riscv64-vs-arm64/amd64 OpenBLAS comparison; no such head-to-head was found in current research despite OpenBLAS 0.3.31 shipping RISC-V and ARM64 improvements in the same release window.

| Item | Description | Effort | Priority |
|---|---|---|---|
| P1 | Unblock open PR #5561 (GEMM rewrite for ZVL128B/ZVL256B) - resolve CI failures, scope to a platform-specific kernel file per reviewer request, validate on out-of-order RISC-V hardware beyond BananaPi | 3-6 person-weeks | High |
| P2 | Land open PR #5573 (TRMM/SYMM disentangling from GEMM) | 2-4 person-weeks | Medium |
| P3 | Evaluate/land the open ZVL1024B target (PR #6066) and C910V-on-upstream-GCC path (PR #6068) for broader hardware reach | 2-4 person-weeks | Medium |

### 14.3 CI/CD Infrastructure

| Item | Description | Effort | Priority |
|---|---|---|---|
| C1 | Sponsor/add a native riscv64 hardware runner to OpenMathLib/OpenBLAS CI | 1-2 person-weeks setup + hardware | High |
| C2 | Enable LAPACK netlib tests on riscv64 CI (requires C1 or acceptance of long QEMU runs) | 1 person-week | High |
| C3 | Audit historical riscv64 CI runs predating the September 2026 false-success fix (PR #5991) for silently-missed failures | 1 person-week | Medium |
| C4 | Pin the CI toolchain to a stable release rather than a dated nightly tarball to reduce build fragility | 1 person-week | Medium |

### 14.4 Ecosystem Enablement

| Item | Description | Effort | Priority |
|---|---|---|---|
| E1 | Coordinate an Ubuntu 24.04 LTS backport of OpenBLAS >=0.3.28 (current noble package is 0.3.26, missing DYNAMIC_ARCH/ZVL/BF16/FP16 entirely) | 1-2 person-weeks | High |
| E2 | Establish an upstream riscv64 release-artifact channel (GitHub Releases or PyPI) so riscv64 is no longer entirely distro-dependent (this is what would move the color grade off blue) | 2-4 person-weeks (process/CI work, not kernel work) | Medium |

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | F4: LAPACK correctness validation on riscv64 | 4-8 | Unassigned | High |
| Functional | F1: C910V complex GEMM off generic fallback | 2-3 | Unassigned | Medium |
| Functional | F2: RVV LASWP kernel | 1-2 | Unassigned | Medium |
| Functional | F3: c/zsymv RVV kernels | 2-3 | Unassigned | Medium |
| Performance | P1: Unblock PR #5561 GEMM rewrite | 3-6 | PR author (stalled) | High |
| Performance | P2: Land PR #5573 TRMM/SYMM disentangling | 2-4 | PR author (stalled) | Medium |
| Performance | P3: ZVL1024B / C910V-on-upstream-GCC | 2-4 | PR authors (open) | Medium |
| CI/CD | C1: Native riscv64 hardware runner | 1-2 + hardware | Unassigned | High |
| CI/CD | C2: Enable LAPACK tests (requires C1) | 1 | Unassigned | High |
| CI/CD | C3: Audit pre-Sept-2026 CI results | 1 | Unassigned | Medium |
| CI/CD | C4: Stabilize toolchain pin | 1 | Unassigned | Medium |
| Ecosystem | E1: Ubuntu 24.04 LTS backport | 1-2 | Unassigned | High |
| Ecosystem | E2: Upstream riscv64 release channel | 2-4 | Unassigned | Medium |

## 15. References

- [OpenBLAS GitHub (xianyi)](https://github.com/xianyi/OpenBLAS)
- [OpenBLAS GitHub (OpenMathLib, canonical org)](https://github.com/OpenMathLib/OpenBLAS)
- [OpenBLAS Homepage](https://www.openblas.net/)
- [Issue #1525 - RISC-V Architecture support](https://github.com/OpenMathLib/OpenBLAS/issues/1525)
- [Issue #3808 - Updated RISC-V vector support for review](https://github.com/OpenMathLib/OpenBLAS/issues/3808)
- [Issue #4050 - risc-v vector v1.0 support (open)](https://github.com/OpenMathLib/OpenBLAS/issues/4050)
- [Issue #4385 - Merge risc-v branch into develop](https://github.com/OpenMathLib/OpenBLAS/issues/4385)
- [Issue #5017 - bare-metal riscv build](https://github.com/OpenMathLib/OpenBLAS/issues/5017)
- [Issue #5279 - Lack of FP16/BF16 precision support for GEMM kernels on RISCV](https://github.com/OpenMathLib/OpenBLAS/issues/5279)
- [Issue #5286 - Performance issues caused by TARGET=RISCV64_ZVL256B](https://github.com/OpenMathLib/OpenBLAS/issues/5286)
- [Issue #5428 - RISCV64_ZVL128B and ZVL256B targets are broken](https://github.com/OpenMathLib/OpenBLAS/issues/5428)
- [Issue #5430 - Register spillage in GEMV from manual 4-way unrolling](https://github.com/OpenMathLib/OpenBLAS/issues/5430)
- [Issue #5608 - Undefined behaviour in dynamic_riscv64.c](https://github.com/OpenMathLib/OpenBLAS/issues/5608)
- [Issue #5811 - DGEMM regression 0.3.31->0.3.33 on riscv64_zvl256b](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [PR #1526 - Add support for RISC-V (merged 2018-04-28)](https://github.com/xianyi/OpenBLAS/pull/1526)
- [PR #4355 - Add RISC-V Vector 128-bit target (merged 2024-01-19)](https://github.com/OpenMathLib/OpenBLAS/pull/4355)
- [PR #4472 - Merge risc-v branch to develop (merged 2024-02-03)](https://github.com/OpenMathLib/OpenBLAS/pull/4472)
- [PR #4504 - Add builds and unit tests for new RISCV platforms to CI](https://github.com/OpenMathLib/OpenBLAS/pull/4504)
- [PR #4778 - Add support for RISCV64_GENERIC in cmake](https://github.com/OpenMathLib/OpenBLAS/pull/4778)
- [PR #4831 - Enable GEMM to GEMV forwarding for RISCV and PPC](https://github.com/OpenMathLib/OpenBLAS/pull/4831)
- [PR #5290 - Add support for FP16 to OpenBLAS and shgemm on RISCV](https://github.com/OpenMathLib/OpenBLAS/pull/5290)
- [PR #5422 - Add and use vectorized packing in ZVL128B/ZVL256B for RISCV](https://github.com/OpenMathLib/OpenBLAS/pull/5422)
- [PR #5432 - fix RVV 1.0 detection code](https://github.com/OpenMathLib/OpenBLAS/pull/5432)
- [PR #5454 - Add support for BF16 sbgemm on RISCV](https://github.com/OpenMathLib/OpenBLAS/pull/5454)
- [PR #5481/#5492 - Add Infrastructure for SHGEMV / Tie in SHGEMV for RISC-V](https://github.com/OpenMathLib/OpenBLAS/pull/5485)
- [PR #5509 - CMake: Add default compiler options for RISCV](https://github.com/OpenMathLib/OpenBLAS/pull/5509)
- [PR #5561 - Improve SGEMM/DGEMM/CGEMM/ZGEMM kernels for ZVL128B/ZVL256B (open)](https://github.com/OpenMathLib/OpenBLAS/pull/5561)
- [PR #5573 - Add interleaving to sgemm/dgemm; disentangle trmm/symm from gemm (open)](https://github.com/OpenMathLib/OpenBLAS/pull/5573)
- [PR #5609 - Avoid integer overflow in dynamic_riscv64.c](https://github.com/OpenMathLib/OpenBLAS/pull/5609)
- [PR #5674 - Improve performance on edges of GEMM for RISC-V](https://github.com/OpenMathLib/OpenBLAS/pull/5674)
- [PR #5807 - riscv64: wire TRSM, complex SYMV, complex GEMM copy RVV kernels](https://github.com/OpenMathLib/OpenBLAS/pull/5807)
- [PR #5819 - docs: clarify RVV target selection and GCC 14+ requirement](https://github.com/OpenMathLib/OpenBLAS/pull/5819)
- [PR #5830 - Enable RVV-optimized TRSM kernels for RISCV64_ZVL128B](https://github.com/OpenMathLib/OpenBLAS/pull/5830)
- [PR #5892 - Enable RVV ROTM for RISC-V ZVL Targets](https://github.com/OpenMathLib/OpenBLAS/pull/5892)
- [PR #5895 - RISC-V: Add TRSM RVV Kernels for ZVL Targets](https://github.com/OpenMathLib/OpenBLAS/pull/5895)
- [PR #5903 - Add SiFive U74 target with scalar 4x4 register-tiled GEMM kernel](https://github.com/OpenMathLib/OpenBLAS/pull/5903)
- [PR #5909 - RISC-V: cache-aware GEMM blocking](https://github.com/OpenMathLib/OpenBLAS/pull/5909)
- [PR #5928 - riscv64: make RVV TRSM (_rvv_v1) kernels VLEN-agnostic](https://github.com/OpenMathLib/OpenBLAS/pull/5928)
- [PR #5955 - Fix RISC-V GEMM/GEMV forwarding in Make builds](https://github.com/OpenMathLib/OpenBLAS/pull/5955)
- [PR #6053 - kernel/riscv64: RVV CGEMM/ZGEMM/CTRMM complex-MAC accumulator optimizations](https://github.com/OpenMathLib/OpenBLAS/pull/6053)
- [PR #6054 - RISC-V: unroll ZVL256B SGEMM kernel K-loop by two](https://github.com/OpenMathLib/OpenBLAS/pull/6054)
- [PR #6056 - RISC-V: widen ZVL256B AXPY vector length to LMUL m4](https://github.com/OpenMathLib/OpenBLAS/pull/6056)
- [PR #6057 - GEMV-N kernel register-blocking](https://github.com/OpenMathLib/OpenBLAS/pull/6057)
- [PR #6066 - Add RISCV64_ZVL1024B (open)](https://github.com/OpenMathLib/OpenBLAS/pull/6066)
- [PR #6068 - Allow the C910V target to build with upstream GCC (open)](https://github.com/OpenMathLib/OpenBLAS/pull/6068)
- [PR #6070 - RISC-V: use unit-stride loads/stores in ZVL256B ROTM kernel (open)](https://github.com/OpenMathLib/OpenBLAS/pull/6070)
- [Commit 269e1cd5 - cache-aware GEMM blocking](https://github.com/OpenMathLib/OpenBLAS/commit/269e1cd505b9bf531a76ffeb0cc7dc753eacb346)
- [Commit c3c6b293 - Ensure RISC-V CI reports test failures](https://github.com/OpenMathLib/OpenBLAS/commit/c3c6b2937e717809c4a37bfb3eec8d5d092dab1b)
- [riscv64_vector.yml CI workflow](https://github.com/OpenMathLib/OpenBLAS/blob/develop/.github/workflows/riscv64_vector.yml)
- [c910v.yml CI workflow](https://github.com/OpenMathLib/OpenBLAS/blob/develop/.github/workflows/c910v.yml)
- [riscv-gnu-toolchain releases](https://github.com/riscv-collab/riscv-gnu-toolchain/releases)
- [RISE blog - Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog - PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE Project member list](https://riseproject.dev)
- [RISE wheel_builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [arXiv:2502.13839 - Performance optimization of BLAS algorithms with band matrices for RISC-V processors](https://arxiv.org/html/2502.13839)
- [CEUR-WS Vol-3785 paper110 - RVV-enabled OpenBLAS LLM inference on SOPHON SG2042](https://ceur-ws.org/Vol-3785/paper110.pdf)
- [RISC-V Summit Europe 2025 - manycore RISC-V accelerator offload for OpenBLAS GEMM](https://riscv-europe.org/summit/2025/media/proceedings/2025-05-15-RISC-V-Summit-Europe-P3.1.01-KOENIG-abstract.pdf)
- [Ubuntu packages - resolute (26.04) search](https://packages.ubuntu.com/search?keywords=OpenBLAS&suite=resolute&searchon=names&section=all)