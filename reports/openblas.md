---
title: OpenBLAS
categories:
  - libraries
  - ai-ml
---

# OpenBLAS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenBLAS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[OpenBLAS](https://www.openblas.net/) ([github.com/xianyi/OpenBLAS](https://github.com/xianyi/OpenBLAS), mirrored at [github.com/OpenMathLib/OpenBLAS](https://github.com/OpenMathLib/OpenBLAS)) is a BSD-licensed, high-performance BLAS (Basic Linear Algebra Subprograms) and LAPACK implementation. It is the default BLAS backend for numpy, scipy, and a large fraction of the scientific Python and HPC software stack on Linux. It is not affiliated with the RISE Project.

**Governance:** No formal steering committee, no governance charter. The project operates under two maintainers: Zhang Xianyi (founder, PerfXLab Technologies, GitHub: xianyi) and Martin Kroeker (co-maintainer and de facto release manager, GitHub: martin-frbg). Martin Kroeker reviews the overwhelming majority of PRs and sets technical direction. The project migrated from `xianyi/OpenBLAS` to the [OpenMathLib](https://github.com/OpenMathLib) GitHub organization in 2023 for operational reasons; OpenMathLib is backed by PerfXLab Technologies.

**License:** BSD (based on GotoBLAS2 1.13 BSD version).

**Funding:** Chan-Zuckerberg Foundation EOSS grants (Cycles 1 and 3, Dec 2019 to Sep 2021) via NumFOCUS. An early 2013 BountySource crowdfunding campaign with approximately 30 individual backers. No current named corporate sponsor is publicly listed. CI infrastructure provided by OSUOSL (PowerPC/IBM Z), Microsoft Azure (general CI), and Cirrus CI.

**RISE connection (indirect):** The RISE wheel_builder project (maintained by Rivos Inc. and Baylibre) previously built and hosted riscv64 Python wheels for `scipy-openblas32` and `scipy-openblas64` (bundling OpenBLAS v0.3.27 through v0.3.31). Those wheels are now deprecated because upstream PyPI began publishing official riscv64 wheels. No RISE-funded work targets OpenBLAS directly.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-04-28 | [PR #1526](https://github.com/xianyi/OpenBLAS/pull/1526): Initial RISC-V port merged by martin-frbg. Generic C scalar target only, adapted from ARM implementations. Author noted "existing blocking and packing algorithms are suboptimal." | PR #1526 |
| 2020-12-07 | C910V target contributed by PingTouGe Semiconductor (T-Head/Alibaba), credited in commit. Released in v0.3.13 (Dec 12, 2020). First vectorized RISC-V kernels, using RVV 0.7.1. | [xianyi/OpenBLAS releases](https://github.com/xianyi/OpenBLAS/releases) |
| 2022 | Multiple CPU detection fixes for riscv64 ([PR #3619](https://github.com/xianyi/OpenBLAS/pull/3619), [#3629](https://github.com/xianyi/OpenBLAS/pull/3629), [#3630](https://github.com/xianyi/OpenBLAS/pull/3630), [#3707](https://github.com/xianyi/OpenBLAS/pull/3707)); first GitHub Actions cross-compile CI ([PR #3722](https://github.com/xianyi/OpenBLAS/pull/3722)). | PRs listed |
| 2023 | x280 (RVV 1.0, VLEN=512) and semi-generic RISCV64_ZVL128B / RISCV64_ZVL256B targets added via `risc-v` branch. Tracking issue [#4050](https://github.com/xianyi/OpenBLAS/issues/4050) opened to generalize RVV 1.0 support across VLEN values. | Issue #4050 |
| 2024-02-03 | [PR #4355](https://github.com/xianyi/OpenBLAS/pull/4355): RISC-V 128-bit target formally added. `risc-v` branch merged to develop ([Issue #4385](https://github.com/xianyi/OpenBLAS/issues/4385) closed). DYNAMIC_ARCH support added for riscv64 targets (v0.3.28). | Issues/PRs listed |
| 2024 | GEMM-to-GEMV forwarding ([PR #4831](https://github.com/xianyi/OpenBLAS/pull/4831)), NRM2 support for negative increments ([PR #4560](https://github.com/xianyi/OpenBLAS/pull/4560)), CMake riscv64 generic support ([PR #4778](https://github.com/xianyi/OpenBLAS/pull/4778)). | PRs listed |
| 2025 (v0.3.31) | SBGEMM, SHGEMM, SBGEMV, SHGEMV kernels added for ZVL128B and ZVL256B. GEMV_T 4x+ speedup. BF16/FP16 infrastructure. | [PR #5481](https://github.com/xianyi/OpenBLAS/pull/5481), [#5492](https://github.com/xianyi/OpenBLAS/pull/5492), [#5444](https://github.com/xianyi/OpenBLAS/pull/5444) |
| 2026-02-20 | [PR #5640](https://github.com/xianyi/OpenBLAS/pull/5640): FP16/BF16 GEMM accumulation improvements. Released in v0.3.32. | PR #5640 |
| 2026-04-11 | [PR #5674](https://github.com/xianyi/OpenBLAS/pull/5674): GEMM edge-case performance, up to 9x faster for SGEMM and 3x for DGEMM on non-aligned dimensions. Released in v0.3.33 (2026-04-23). | PR #5674 |
| 2026-05-19 | [PR #5815](https://github.com/xianyi/OpenBLAS/pull/5815): Correctness fix for DGEMM contiguous memory check on ZVL256B. Unreleased as of report date. | PR #5815 |
| 2026-06-07 | [PR #5830](https://github.com/xianyi/OpenBLAS/pull/5830) (draft): RVV TRSM kernels wired for ZVL128B. ZVL256B excluded due to known correctness bug. | PR #5830 |

---

## 3. Upstream Support Tier

OpenBLAS does not publish a formal platform tier policy. In practice, RISC-V targets are treated as first-class: they appear in the README alongside x86 and aarch64, they have dedicated CI workflows, and they receive active kernel development. The comparison is:

- **x86/aarch64:** Have native CI runners, hand-written assembly, and decades of tuning. They are the primary revenue-justifying architectures for the companies contributing to OpenBLAS.
- **RISC-V:** Has three CI workflows (all QEMU-based, no native runners), 221 kernel files in C with RVV intrinsics (zero assembly), and active corporate contributions from Alibaba/T-Head, PLCT/ISCAS, and IBM (handle: ChipKerchner). The project accepts RISC-V work without friction and does not treat it as secondary.

The most critical practical limitation is that all RISC-V CI runs under QEMU emulation on x86 runners. No native RISC-V hardware exists in the upstream CI pipeline. Performance regressions, cache-sensitive bugs, and multi-core race conditions are not caught by CI.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Supported Targets

| Target | Description | ISA String |
|---|---|---|
| `RISCV64_GENERIC` | Generic scalar RV64GC | `rv64imafdc`, `-mabi=lp64d` |
| `C910V` | T-Head C910/C920, RVV 0.7.1 | `rv64imafdcv0p7_zfh_xtheadc`, `-mabi=lp64d`, `-mtune=c920` |
| `x280` | T-Head x280, RVV 1.0, VLEN=512 | `rv64imafdcv_zba_zbb_zfh_zvl512b`, `-mabi=lp64d` |
| `RISCV64_ZVL128B` | RVV 1.0, VLEN=128 | `rv64imafdcv` + optional `_zvfh_zfh` + `_zvfbfwma`, `_zvl128b` |
| `RISCV64_ZVL256B` | RVV 1.0, VLEN=256 | `rv64imafdcv` + optional `_zvfh_zfh` + `_zvfbfwma`, `_zvl256b` |

`DYNAMIC_ARCH=1` expands to `RISCV64_GENERIC + RISCV64_ZVL128B + RISCV64_ZVL256B` at build time and dispatches at runtime using the `riscv_hwprobe` syscall (Linux 6.5+, `NR_riscv_hwprobe=258`) with fallback to `AT_HWCAP` plus direct `vsetvli`/`csrr vtype` detection. `Zvl256b` is selected when `VLENB >= 32`; `Zvl128b` when `VLENB >= 16`.

No RISC-V 32-bit target exists. No bare-metal (riscv64-unknown-elf) target is supported; [Issue #5017](https://github.com/xianyi/OpenBLAS/issues/5017) confirmed this is out of scope.

### 4.2 Kernel File Inventory

Total kernel files in `kernel/riscv64/`: 221 C files, 0 assembly files. For comparison: x86_64 has 515 files (255 assembly), aarch64 has 225 files (74 assembly). riscv64 matches aarch64 in total count but is entirely C-intrinsics, with no hand-written assembly.

Kernel categories:

- **`_rvv.c` files (approximately 95 files):** RVV 1.0 standard intrinsics (`#include <riscv_vector.h>`). Cover all BLAS L1 operations for real/complex, single/double, plus GEMM packing, SYMV, HEMV, OMATCOPY, ZGEMM packing. Used by x280 target and as the foundation for ZVL targets.

- **`_rvv_v1*.c` files:** x280-specific TRSM, TRMM, SYMM copy kernels; DGEMM/SGEMM vl-agnostic kernels (`gemmkernel_rvv_v1x8.c`, `zgemmkernel_rvv_v1x4.c`). ISA requires RVV 1.0 + Zba + Zbb.

- **`*_zvl128b.c` files (10 files, approximately 316 KB):** Auto-generated by `generate_kernel.py`. Fixed tile sizes tuned for VLEN=128. Covers SGEMM (8x8), DGEMM (8x4), CGEMM (8x4), ZGEMM (4x4), TRMM variants, SBGEMM (8x8, Zvfbfwma), SHGEMM (8x8, Zvfh).

- **`*_zvl256b.c` files (10 files, approximately 649 KB):** Auto-generated by `generate_kernel.py`. Fixed tile sizes for VLEN=256. SGEMM (16x8), DGEMM (8x8), CGEMM (8x8), ZGEMM (8x4), TRMM variants, SBGEMM (16x8), SHGEMM (16x8).

- **`_c910v.c` files (2 files, approximately 70 KB):** T-Head proprietary intrinsics via XuanTie toolchain. SGEMM 16x4, DGEMM 8x4. RVV 0.7.1 with `RISCV_0p10_INTRINSICS` compat macro.

- **`_vector.c` files (approximately 48 files):** Length-agnostic RVV intrinsics. Used by C910V (BLAS L1/L2) and ZVL256B. Includes SBGEMV/SHGEMV (BF16/FP16 GEMV).

- **Generic scalar (approximately 52 files):** `RISCV64_GENERIC` target, no vector, plain C.

No JIT backend. No LASWP (row swap) RISC-V-specific kernel; falls through to generic.

### 4.3 ISA Extension Coverage

| Extension | Status |
|---|---|
| RVV 0.7.1 (pre-standard) | C910V only, requires XuanTie vendor toolchain |
| RVV 1.0 (V) | All ZVL128B, ZVL256B, x280 targets |
| Zvl128b (VLEN>=128) | Runtime-detected via `detect_riscv64.c`, selected dynamically |
| Zvl256b (VLEN>=256) | Runtime-detected via `detect_riscv64.c` |
| Zvl512b (VLEN>=512) | x280 compile-time flag only; no separate zvl512b kernel files |
| Zvfh (Float16) | SHGEMM/SHGEMV kernels, requires `BUILD_HFLOAT16=1` |
| Zvfbfwma (BFloat16) | SBGEMM/SBGEMV kernels, requires `BUILD_BFLOAT16=1` |
| Zfh (scalar FP16) | x280 and ZVL targets with `BUILD_HFLOAT16=1` |
| Zba, Zbb | x280 march flags only; no explicit intrinsics in kernel code |
| Xtheadc (T-Head custom) | C910V only |
| Zve32f, Zve64d, etc. | Not distinguished; targets use full V extension |

### 4.4 CPU Detection

Static detection (`cpuid_riscv64.c`) reads `/proc/cpuinfo`: if `model name` contains `"T-HEAD C910"` and the `isa` field contains `v`, it selects `C910V`. All other riscv64 CPUs map to `RISCV64_GENERIC`. ZVL targets are not auto-selected at build time without `DYNAMIC_ARCH=1` or explicit `TARGET=`.

Runtime detection (`driver/others/dynamic_riscv64.c`) uses `riscv_hwprobe` (Linux 6.5+) with fallback to `AT_HWCAP` plus `detect_riscv64_rvv100()` (inline `vsetvli`/`csrr vtype`/`slt` sequence to distinguish RVV 1.0 from 0.7.1).

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Make Build

riscv64 sets `NO_BINARY_MODE=1` and `BINARY_DEFINED=1` unconditionally; the `-m64` flag is excluded by an explicit `ifneq ($(ARCH), riscv64)` guard. `GEMM_GEMV_FORWARD=1` is set for riscv64 (fused GEMM/GEMV path).

Key make variables:

| Variable | Effect |
|---|---|
| `TARGET=RISCV64_ZVL256B` | Selects ZVL256B target |
| `DYNAMIC_ARCH=1` | Builds GENERIC + ZVL128B + ZVL256B with runtime dispatch |
| `BUILD_BFLOAT16=1` | Adds `_zvfbfwma` to `-march`; enables SBGEMM |
| `BUILD_HFLOAT16=1` | Adds `_zvfh_zfh` to `-march`; enables SHGEMM |
| `NO_SHARED=1` | Static library only (required for C910V cross-compile) |
| `CROSS=1` | Suppresses post-build test invocation |
| `NOFORTRAN=1` | Skip Fortran; cannot build bundled LAPACK |

Cross-compile for ZVL256B with BF16/FP16 using the riscv-collab LLVM toolchain (version used in CI: 15.1.0, nightly 2025-08-29):

```
make TARGET=RISCV64_ZVL256B BINARY=64 ARCH=riscv64 BUILD_BFLOAT16=1 BUILD_HFLOAT16=1 \
     CROSS=1 HOSTCC=gcc HOSTFC=gfortran \
     CC='clang --rtlib=compiler-rt -target riscv64-unknown-linux-gnu \
         --sysroot /opt/riscv/sysroot \
         --gcc-toolchain=/opt/riscv/lib/gcc/riscv64-unknown-linux-gnu/15.1.0/' \
     FC='riscv64-unknown-linux-gnu-gfortran' -j$(nproc)
```

For C910V, only the XuanTie-900-gcc V2.8.0 vendor toolchain is supported (march string `rv64imafdcv0p7_zfh_xtheadc` is vendor-specific; upstream GCC/Clang do not support it).

### 5.2 CMake Build

CMake support exists (`CMakeLists.txt`) but is described as experimental. Cross-compile example:

```
cmake -S . -B build \
  -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_Fortran_COMPILER=riscv64-linux-gnu-gfortran \
  -DTARGET=RISCV64_GENERIC -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
```

CMake adds default compiler options for RISCV via [PR #5509](https://github.com/xianyi/OpenBLAS/pull/5509) (merged Oct 2025). CMake DYNAMIC_ARCH support for riscv64 generic was added in [PR #4778](https://github.com/xianyi/OpenBLAS/pull/4778).

### 5.3 Compiler Requirements

- **RISCV64_GENERIC:** Any GCC supporting rv64imafdc (GCC 7+; Debian/Ubuntu `gcc-riscv64-linux-gnu` sufficient).
- **RISCV64_ZVL128B / ZVL256B:** GCC >= 14 required for correct RVV 1.0 code generation. **GCC 13 compiles without error but produces scalar fallback code in all RVV kernel paths.** This is detectable only by disassembly. PR [#5819](https://github.com/xianyi/OpenBLAS/pull/5819) (merged 2026-06-18) documents this requirement. The upstream CI uses Clang 15.1.0 with `--rtlib=compiler-rt`, not GCC.
- **C910V:** XuanTie-900-gcc V2.8.0 only; no upstream compiler supports the required march string.
- **Zvfh / Zvfbfwma:** Clang 17+ or GCC 14+; required for SHGEMM and SBGEMM kernels respectively.

### 5.4 QEMU Testing

ZVL targets use prebuilt `qemu-riscv64` v10.1 (hosted on a GitHub Gist by martin-frbg). CPU strings:

```
# ZVL128B
QEMU_CPU=rv64,g=true,c=true,v=true,vext_spec=v1.0,vlen=128,elen=64

# ZVL256B with BF16/FP16
QEMU_CPU=rv64,g=true,c=true,v=true,vext_spec=v1.0,vlen=256,elen=64,zfh=true,zvfh=true,zvfbfwma=true
```

C910V uses the XUANTIE-RV fork of QEMU (commit `e0ace167`, tagged `xuantie-qemu-9.0`), built from source with a patch from the revyos project. This is not upstream QEMU.

No Dockerfile for riscv64 cross-compilation exists in the repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 BLAS L1

All L1 operations (amax, amin, asum, axpy, axpby, copy, dot, iamax, iamin, imax, imin, max, min, nrm2, rot, rotm, scal, sum, swap) are implemented in C with RVV intrinsics for all three primary targets (ZVL128B, ZVL256B, x280). Real and complex variants (s/d/c/z) are covered. FP16 (SHGEMV, SHAXPY) and BF16 (SBGEMV) added in v0.3.31.

**Status: complete for RVV 1.0 targets.**

### 6.2 BLAS L2

GEMV (N and T transpose forms) implemented with RVV and _vector.c variants. SYMV (L and U), HEMV (LM and UV), GBMV: RVV implementations present. SBGEMV and SHGEMV added ([PR #5481](https://github.com/xianyi/OpenBLAS/pull/5481), v0.3.31). Cache-friendly GEMV_N traversal added ([PR #5476](https://github.com/xianyi/OpenBLAS/pull/5476), v0.3.31).

**Status: good coverage; no documented gaps for standard operations.**

### 6.3 BLAS L3

| Routine | ZVL128B | ZVL256B | x280 | C910V |
|---|---|---|---|---|
| SGEMM | `sgemm_kernel_8x8_zvl128b.c` | `sgemm_kernel_16x8_zvl256b.c` | `gemmkernel_rvv_v1x8.c` | `sgemm_kernel_16x4_c910v.c` |
| DGEMM | `dgemm_kernel_8x4_zvl128b.c` | `dgemm_kernel_8x8_zvl256b.c` | `gemmkernel_rvv_v1x8.c` | `dgemm_kernel_8x4_c910v.c` |
| CGEMM | `cgemm_kernel_8x4_zvl128b.c` | `cgemm_kernel_8x8_zvl256b.c` | `zgemmkernel_rvv_v1x4.c` | generic fallback |
| ZGEMM | `zgemm_kernel_4x4_zvl128b.c` | `zgemm_kernel_8x4_zvl256b.c` | `zgemmkernel_rvv_v1x4.c` | generic fallback |
| SBGEMM | `sbgemm_kernel_8x8_zvl128b.c` (Zvfbfwma) | `sbgemm_kernel_16x8_zvl256b.c` | not present | not present |
| SHGEMM | `shgemm_kernel_8x8_zvl128b.c` (Zvfh) | `shgemm_kernel_16x8_zvl256b.c` | not present | not present |
| TRSM (all 4 variants) | **no RVV kernel (gap, PR #5830 draft)** | **no RVV kernel + correctness bug** | `trsm_kernel_*_rvv_v1.c` | generic fallback |
| TRMM | `dtrmm/ctrmm/strmm/ztrmm_*_zvl128b.c` | same | `trmmkernel_rvv_v1x8.c` | generic fallback |
| SYMM | `_rvv.c` copy kernels | same | `symm_{l,u}copy_rvv_v1.c` | generic fallback |
| HEMM | `_rvv.c` copy kernels | same | `zhemm_{lt,ut}copy_rvv_v1.c` | generic fallback |
| LASWP | generic fallback | generic fallback | generic fallback | generic fallback |

**Critical gap: TRSM has no RVV kernel for ZVL128B or ZVL256B.** The x280 TRSM kernels exist (`trsm_kernel_{LN,LT,RN,RT}_rvv_v1.c`) but are not wired to ZVL targets. [PR #5830](https://github.com/xianyi/OpenBLAS/pull/5830) (draft, opened 2026-06-07) wires them for ZVL128B only. The ZVL256B wiring was attempted and found to produce incorrect results; that bug is unresolved and unassigned as of 2026-06-07.

TRSM is a dependency of LAPACK routines including LU factorization, Cholesky, and triangular solves. Any workload calling DGETRS, DPOTRS, or DTRTRS will fall through to the scalar TRSM implementation on ZVL targets.

### 6.4 LAPACK

Bundled netlib LAPACK is compiled for riscv64. No RISC-V-specific LAPACK kernel implementations exist (only generic). LAPACK tests are never executed in upstream CI (explicitly disabled with `exit 0` in `riscv64_vector.yml`, with comment "these take a very long time"). LAPACK correctness on riscv64 is validated only by downstream distribution packaging, if at all.

---

## 7. CI/CD Infrastructure

### 7.1 Workflow Files

Three of 13 GitHub Actions workflow files contain RISC-V content:

**`.github/workflows/riscv64_vector.yml` -- "riscv64 zvl256b qemu test"**
- Trigger: `on: [push, pull_request]`
- Guard: `if: github.repository == 'OpenMathLib/OpenBLAS'` -- does NOT run on forks or on the `xianyi/OpenBLAS` mirror
- Runner: `ubuntu-latest` (x86_64)
- Execution: QEMU user-mode emulation with prebuilt `qemu-riscv64` v10.1
- Toolchain: LLVM nightly 15.1.0 (build dated 2025-08-29) from `riscv-collab/riscv-gnu-toolchain`
- Matrix: RISCV64_ZVL128B (vlen=128), RISCV64_ZVL256B (vlen=256 with Zvfh/Zvfbfwma), DYNAMIC_ARCH=1 (vlen=256)
- Tests run: CBLAS and BLAS level 1/2/3 for s/d/c/z; ZVL256B additionally runs `test_sbgemm`, `test_sbgemv`, `test_shgemm`, `test_shgemv`, `test_bgemm`
- Tests NOT run: netlib LAPACK tests (bypassed with `exit 0`)

**`.github/workflows/c910v.yml` -- "c910v qemu test"**
- Trigger: `on: [push, pull_request]`
- Guard: same OpenMathLib guard
- Runner: `ubuntu-latest` (x86_64)
- Toolchain: XuanTie-900-gcc V2.8.0 (Alibaba OCC download)
- QEMU: XUANTIE-RV fork at commit `e0ace167`, plus revyos patch (built from source -- not upstream QEMU)
- Matrix: RISCV64_GENERIC (Debian cross-compiler), C910V (XuanTie compiler)
- Tests: full BLAS level 1/2/3 and CBLAS with retry logic (up to 10 retries, escalating timeout for flaky tests)

**`.github/workflows/dynamic_arch.yml` -- "continuous build" (partial)**
- Contains one riscv64 cross-build entry (`TARGET=RISCV64_GENERIC`, triple: `riscv64-linux-gnu`)
- Cross-compile only; no test execution step

**Not present:** No native riscv64 runners. No scheduled (cron) triggers for any RISC-V job. No `.gitlab-ci.yml`. `Jenkinsfile` and `.cirrus.yml` contain no RISC-V references.

### 7.2 Known CI Limitations

- QEMU user-mode emulation does not model cache behavior, pipeline timing, or memory latency. Performance regressions on real silicon are not caught.
- The OpenMathLib guard means contributor PRs submitted to `xianyi/OpenBLAS` from forks may not trigger the primary vector CI.
- The LLVM toolchain is a pinned nightly tarball from a specific date. If that tarball becomes unavailable, CI silently fails to build.
- The C910V workflow uses a non-upstream QEMU fork. Bugs in that fork are invisible.
- LAPACK correctness is not tested on any riscv64 target.

---

## 8. Distribution and Release Status

### 8.1 Upstream Releases

GitHub releases (v0.3.29 through v0.3.33) contain binary assets only for Windows (x86, x64, ARM64). No riscv64 binary assets exist in any upstream release. Linux riscv64 users must build from source or use distribution packages.

Most recent release: **v0.3.33** (2026-04-23). As of report date, two correctness/doc fixes for riscv64 have merged to develop since v0.3.33 ([PR #5815](https://github.com/xianyi/OpenBLAS/pull/5815), [PR #5819](https://github.com/xianyi/OpenBLAS/pull/5819)) and are unreleased.

### 8.2 Debian

`libopenblas0` **0.3.33+ds-3** is available for riscv64 in Debian unstable (sid). Build status "Installed" on `rv-manda-02` buildd, build dated approximately 34 days prior to report date. The full set of 14 libopenblas packages is available at riscv64 (standard and 64-bit index variants). Exact .deb confirmed: `libopenblas0_0.3.33+ds-3_riscv64.deb`, size 44K, SHA256 `356f608b6d96fb60b3826426f3300d1640474321b36dab686da6ebe409958454`.

Note: `tracker.debian.org/pkg/openblas` did not list riscv64 in its architecture display; the `packages.debian.org` and FTP mirror data are more authoritative and confirm riscv64 is present. This is a discrepancy between two sources; the direct mirror evidence is the stronger signal.

### 8.3 Ubuntu 24.04 LTS (Noble)

`libopenblas0` **0.3.26+ds-1** available in the `universe` component for riscv64. All 16 OpenBLAS packages (standard and 64-bit index, OpenMP/pthread/serial variants) are available. This is version 0.3.26, which predates the DYNAMIC_ARCH riscv64 support (added in 0.3.28) and the ZVL128B/ZVL256B targets.

### 8.4 PyPI

No standalone `openblas` package exists on PyPI (HTTP 404). numpy and scipy bundle OpenBLAS internally in their riscv64 wheels. The RISE wheel_builder project previously provided `scipy-openblas64` riscv64 wheels (versions 0.3.27 through 0.3.31); those are deprecated now that upstream PyPI provides riscv64 wheels.

### 8.5 Arch Linux RISC-V

Data not available: the `archriscv.felixc.at` package index could not be successfully queried. Availability is unknown from this source.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build Status | riscv64 Test Status | Notable Issues |
|---|---|---|---|---|
| glibc | C runtime, pthreads, libm, `riscv_hwprobe` syscall | Green (rv64gc lp64d supported since glibc 2.27) | Mostly green; SIGILL in `__memset_vector` if RVV disabled via `prctl()` after process start (introduced Dec 2025, no upstream bug filed) | Ubuntu 24.04 ships glibc 2.39, which predates three crash-class fixes (IFUNC gp-pointer BZ #32269, hwprobe prototype BZ #32932, preinit alignment BZ #32228); deployments on Ubuntu 24.04 risk IFUNC resolver SIGSEGV |
| GCC / GFortran | Kernel code generation; Fortran required for bundled LAPACK | Green for rv64gc (GCC 12+); GCC 14+ required for ZVL128B/ZVL256B | ZVL targets require GCC 14+ to exercise RVV paths; GCC 13 silently produces scalar fallback | GCC 13 false-passes ZVL builds; detectable only by disassembly. CI uses Clang 15.1.0, not GCC, so this risk is not caught by CI |
| Binutils / objcopy | Symbol renaming, linking, assembling | Green (riscv64 supported since binutils 2.28+) | Green | None known |
| pthreads | SMP threading backend (`USE_THREAD`) | Green | Green | Part of glibc; see glibc row |
| OpenMP (libgomp/libomp) | Optional threading backend (`USE_OPENMP=1`) | Green | Green | None known for riscv64 |
| Bundled netlib LAPACK | LAPACK routines, Fortran-compiled by default | Green | **Not tested in upstream CI (explicitly disabled)** | LAPACK correctness on riscv64 is unvalidated by upstream |
| QEMU riscv64 (CI only, not runtime) | All riscv64 test execution | N/A | QEMU cannot model cache or pipeline; performance regressions on real silicon not caught | No native riscv64 CI hardware; QEMU is the only test environment |

---

## 10. Ecosystem Status

**Active contributors with confirmed affiliations (RISC-V-specific work):**

| Contributor | Affiliation | Area |
|---|---|---|
| PingTouGe Semiconductor / T-Head | Alibaba/DAMO | C910V and x280 kernel contributions, XuanTie toolchain integration |
| PLCT Lab (Guoyuan Li and others) | Institute of Software, Chinese Academy of Sciences (ISCAS) | RVV kernel development |
| ChipKerchner | IBM | RVV LMUL tuning, BF16/FP16 kernel improvements (active since late 2024) |
| sh-zheng | Unknown (PLCT Lab affiliation [NEEDS VERIFICATION]) | Tracking issue #4050, ZVL128B TRSM PR #5830 |
| k-yeung | Unknown | PR #5561, ZVL128B/ZVL256B GEMM rewrite |

**Community engagement:** [Issue #5062](https://github.com/xianyi/OpenBLAS/issues/5062) (closed Feb 2025) confirmed that adding a new RISC-V uArch (Tenstorrent Ascalon) requires changes to the RISC-V tree. Tenstorrent is a RISE Premier Member; no RISE-funded OpenBLAS work was identified in the research.

**RISE connection summary:** No RISE RFP funds OpenBLAS directly. Indirect connection: the RISE wheel_builder project (Rivos/Baylibre) shipped riscv64 `scipy-openblas64` wheels as a bridge until PyPI supported riscv64 natively. That work is now deprecated.

---

## 11. Known Bugs and Active Issues

### 11.1 Correctness Bugs

**[Issue #5811](https://github.com/xianyi/OpenBLAS/issues/5811) / [PR #5815](https://github.com/xianyi/OpenBLAS/pull/5815) -- DGEMM correctness regression on ZVL256B (FIXED, unreleased)**
- Hardware: SpaceMiT K1 (C908 core, RVA22, RVV 1.0, VLEN=256)
- Symptom: `A^T @ A` on a 50x50 float64 matrix produced minimum eigenvalue of -2.779 (correct value: +1.405e-02); `numpy.linalg.cholesky` threw `LinAlgError`. Not reproducible on Pine64 Star64 (no RVV).
- Regression range: v0.3.31 to v0.3.33 (approximately 250 commits)
- Root cause: incorrect contiguous memory check logic in SGEMM/DGEMM RVV kernels; test coverage lacked cases where `ldc != M`
- Fix merged to develop 2026-05-19; milestone 0.3.34; not yet in a release

**[PR #5830](https://github.com/xianyi/OpenBLAS/pull/5830) -- RVV TRSM produces wrong results on ZVL256B (OPEN, unassigned)**
- The draft PR explicitly documents that the existing RVV TRSM kernels (`trsm_kernel_{LN,LT,RN,RT}_rvv_v1.c`) produce incorrect results when used with VLEN=256. Example cited: 3x3 lower triangular solve returns wrong values.
- ZVL256B TRSM is therefore using a generic scalar fallback, which is both slower and the only correct option.
- The bug is unresolved, unassigned, and its root cause is not documented in the PR.

### 11.2 Performance Regressions

**GEMV_T register spill regression (fixed in v0.3.31):** [PR #5427](https://github.com/xianyi/OpenBLAS/pull/5427) introduced a 4x slowdown in GEMV_T on K1/C908 (112M vs 443M cycles on 1023x1023 FP32 GEMV, 100 iterations). Root cause: LMUL=8 combined with 4-way manual unrolling requires 64 vector register slots, exceeding the 32 available architectural registers, causing stack spills. Fixed by [PR #5444](https://github.com/xianyi/OpenBLAS/pull/5444) with 4x+ speedup recovery.

### 11.3 Open Performance and Feature Gaps

**[PR #5561](https://github.com/xianyi/OpenBLAS/pull/5561) (open since Dec 2025):** SGEMM/DGEMM/CGEMM/ZGEMM kernel rewrite for ZVL128B/ZVL256B. CI failure confirmed on real hardware (Banana Pi BPI-F3) for all four GEMM variants on both targets. Reviewer ChipKerchner is blocking merger pending scoping to a platform-specific kernel file rather than the shared ZVL targets, due to concern about regressions on out-of-order hardware. Stalled since March 2026.

**[PR #5830](https://github.com/xianyi/OpenBLAS/pull/5830) (draft, open since Jun 2026):** RVV TRSM for ZVL128B. Draft, no CI pass, no review comments. ZVL256B excluded due to the correctness bug above.

**[Issue #4050](https://github.com/xianyi/OpenBLAS/issues/4050) (open since May 2023):** "risc-v vector v1.0 support." Tracks TRSM gap (directly connected to PR #5830) and ZVL target unification. A 2024-02-06 comment identified that `c/zsymv` kernels also have no RVV implementation. No milestone, no assignee.

---

## 12. Objections and Upstream Blockers

**Martin Kroeker is the primary gatekeeper for all RISC-V work.** He reviews the majority of PRs and sets architecture direction. His stated positions:

- On auto-detecting `RISCV64_GENERIC` ([PR #5821](https://github.com/xianyi/OpenBLAS/pull/5821)): "The generic target is the one of last resort and poorest performance... If you're cross-compiling for unknown riscv64 targets, you'd be much better off doing a DYNAMIC_ARCH build." This PR was effectively NAKed.

- On the GEMM rewrite for ZVL targets ([PR #5561](https://github.com/xianyi/OpenBLAS/pull/5561)): Agreed old kernels should not be deleted; concerned about hardware-specific tuning being applied to shared targets. Stalled after March 2026 review.

- On TRMM/SYMM kernel infrastructure ([PR #5573](https://github.com/xianyi/OpenBLAS/pull/5573)): NAKed the `COMM` kernel abstraction; directed that changes should use `ifdef` guards in `kernel/Makefile.L3`, as was done for SVE. No follow-up commits from the PR author since February 2026.

**ChipKerchner (IBM) is an active secondary reviewer for RISC-V kernel work.** He is blocking [PR #5561](https://github.com/xianyi/OpenBLAS/pull/5561) pending CI fix and scoping to a platform-specific kernel file. His concern: "We shouldn't be making such a huge change decision based on a BananaPi" -- referring to the risk that ZVL target changes tuned for one in-order core (SpaceMiT K1/C908) will regress on out-of-order designs.

**The ZVL256B TRSM correctness bug is self-blocking.** Until the root cause is identified, TRSM cannot be enabled for ZVL256B. No one is assigned to investigate it.

**The LAPACK test gap is structural.** Upstream CI cannot run netlib LAPACK tests on riscv64 because they time out under QEMU emulation. This is not a solvable problem without native hardware runners.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The missing TRSM RVV kernel for ZVL256B is the most consequential functional gap. TRSM is on the critical path for LAPACK drivers (`DGETRS`, `DPOTRS`, `DTRTRS`, triangular solves in LU/Cholesky/QR), which are in turn required by virtually all dense linear algebra software above the BLAS level. The correctness bug blocking ZVL256B TRSM must be diagnosed before the kernel can be enabled.

**Recommended work items:**

| Item | Description | Effort | Priority |
|---|---|---|---|
| F1 | Diagnose and fix ZVL256B TRSM correctness bug | 2-4 person-weeks | Critical |
| F2 | Wire TRSM kernels for ZVL128B (extend PR #5830 from draft to mergeable) | 1 person-week | High |
| F3 | Wire TRSM kernels for ZVL256B (blocked on F1) | 1 person-week | High |
| F4 | Implement or wire `c/zsymv` RVV kernels for ZVL targets (gap from issue #4050) | 2-3 person-weeks | Medium |
| F5 | LAPACK correctness validation on riscv64 (requires native hardware or extensive QEMU test suite) | 4-8 person-weeks | Medium |

### 13.2 Performance Optimization

Quantitative performance data from PR discussions (all are relative speedups on specific hardware; no cross-architecture GFLOPS comparisons exist in the research):

- GEMM edge cases (small M or N), ZVL256B: up to 9x faster for SGEMM, 3x for DGEMM (v0.3.33, [PR #5674](https://github.com/xianyi/OpenBLAS/pull/5674))
- GEMV_T, ZVL256B (after unrolling fix): 4x+ recovery (v0.3.31, [PR #5444](https://github.com/xianyi/OpenBLAS/pull/5444))
- GEMV_N cache-friendly traversal: claimed up to 10x faster [NEEDS VERIFICATION -- no methodology details available] ([PR #5476](https://github.com/xianyi/OpenBLAS/pull/5476))
- SBGEMV/SHGEMV: up to 32x faster vs scalar baseline (v0.3.31, [PR #5481](https://github.com/xianyi/OpenBLAS/pull/5481))
- SGEMM packing vectorization: 5-9% overall SGEMM improvement; DGEMM packing regression mitigated by disabling for double precision ([PR #5422](https://github.com/xianyi/OpenBLAS/pull/5422))

Data not available: absolute GFLOPS figures for any RISC-V target; cross-architecture comparisons against aarch64 or x86_64.

The open [PR #5561](https://github.com/xianyi/OpenBLAS/pull/5561) is the highest-potential in-flight optimization: a GEMM kernel rewrite with claimed 3x SHGEMM and 1.5x SBGEMM speedups, plus up to 5.7x improvement for low-M GEMM. It is stalled due to CI failures and reviewer concerns about hardware-specific tuning. Resolving this requires a CI-passing implementation that satisfies ChipKerchner's concern about non-BananaPi hardware.

**Recommended work items:**

| Item | Description | Effort | Priority |
|---|---|---|---|
| P1 | Unblock PR #5561: fix CI failure, scope to platform-specific kernel per ChipKerchner's request, benchmark on out-of-order RISC-V hardware | 3-6 person-weeks | High |
| P2 | Tune ZVL128B GEMM for hardware other than BananaPi (once P-series or other OOO RISC-V hardware is available) | 4-8 person-weeks | Medium |
| P3 | DGEMM packing vectorization (currently disabled for double precision after regression in PR #5422) | 2-3 person-weeks | Medium |
| P4 | Zvl512b dedicated kernel files (currently x280 uses vl-agnostic `_rvv_v1` kernels; a fixed-512b kernel could improve register utilization) | 4-8 person-weeks | Low |

### 13.3 CI/CD Infrastructure

The absence of native riscv64 CI runners is the single largest structural gap. It means:
- Performance regressions are invisible until reported by users on real hardware
- Cache-sensitive correctness bugs (as in issue #5811) can persist across multiple releases
- LAPACK tests cannot run

QEMU emulation is sufficient for functional correctness of scalar and vectorized code paths but is not a substitute for hardware testing.

**Recommended work items:**

| Item | Description | Effort | Priority |
|---|---|---|---|
| C1 | Add native riscv64 hardware runner(s) to OpenMathLib/OpenBLAS CI (requires hardware sponsorship and runner configuration) | 1-2 person-weeks setup + hardware | High |
| C2 | Enable LAPACK netlib tests on riscv64 CI (requires native runner or acceptance of long QEMU runs; C1 is a prerequisite) | 1 person-week | High |
| C3 | Add performance regression test harness for riscv64 (requires native runner; C1 is prerequisite) | 3-5 person-weeks | Medium |
| C4 | Pin toolchain to a stable release rather than a nightly tarball to reduce CI fragility | 1 person-week | Medium |

### 13.4 Ecosystem Enablement

The primary downstream consumers of OpenBLAS on riscv64 are numpy and scipy. Both now ship official riscv64 wheels on PyPI (the RISE wheel_builder bridge is deprecated). The Debian `libopenblas0` package is at 0.3.33 on riscv64. Ubuntu 24.04 ships 0.3.26, which is two major feature cycles behind (missing DYNAMIC_ARCH, ZVL targets, BF16/FP16 kernels).

**Recommended work items:**

| Item | Description | Effort | Priority |
|---|---|---|---|
| E1 | Coordinate Ubuntu backport of OpenBLAS >= 0.3.28 to bring DYNAMIC_ARCH and ZVL targets to the LTS release | 1-2 person-weeks | High |
| E2 | Add new RISC-V uArch targets (e.g., Tenstorrent Ascalon, confirmed needed in issue #5062) | 2-4 person-weeks per target | Medium |
| E3 | Document Tenstorrent Ascalon uArch integration requirements (issue #5062 was closed without a kernel being merged) | Data not available: no PR was identified for Tenstorrent Ascalon kernels | Medium |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | F1: Diagnose and fix ZVL256B TRSM correctness bug | 2-4 | Unassigned | Critical |
| Functional | F2: Wire TRSM kernels for ZVL128B (complete PR #5830) | 1 | sh-zheng (draft) | High |
| Functional | F3: Wire TRSM kernels for ZVL256B (blocked on F1) | 1 | Unassigned | High |
| Functional | F4: Implement c/zsymv RVV kernels for ZVL targets | 2-3 | Unassigned | Medium |
| Functional | F5: LAPACK correctness validation on riscv64 | 4-8 | Unassigned | Medium |
| Performance | P1: Unblock PR #5561 GEMM rewrite | 3-6 | k-yeung (stalled) | High |
| Performance | P2: Tune ZVL128B GEMM for OOO hardware | 4-8 | Unassigned | Medium |
| Performance | P3: DGEMM packing vectorization | 2-3 | Unassigned | Medium |
| Performance | P4: Zvl512b dedicated kernel files | 4-8 | Unassigned | Low |
| CI/CD | C1: Native riscv64 hardware runner | 1-2 + hardware | Unassigned | High |
| CI/CD | C2: Enable LAPACK tests (requires C1) | 1 | Unassigned | High |
| CI/CD | C3: Performance regression harness (requires C1) | 3-5 | Unassigned | Medium |
| CI/CD | C4: Stabilize toolchain pin | 1 | Unassigned | Medium |
| Ecosystem | E1: Ubuntu 24.04 backport (>= 0.3.28) | 1-2 | Unassigned | High |
| Ecosystem | E2: New RISC-V uArch targets (per target) | 2-4 | Unassigned | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [OpenBLAS GitHub (xianyi)](https://github.com/xianyi/OpenBLAS)
- [OpenBLAS GitHub (OpenMathLib)](https://github.com/OpenMathLib/OpenBLAS)
- [OpenBLAS Homepage](https://www.openblas.net/)
- [Issue #4050 -- risc-v vector v1.0 support (tracking, open)](https://github.com/xianyi/OpenBLAS/issues/4050)
- [Issue #4385 -- Merge risc-v branch into develop (closed)](https://github.com/xianyi/OpenBLAS/issues/4385)
- [Issue #5062 -- New uArch in RISC-V tree: Tenstorrent Ascalon (closed)](https://github.com/xianyi/OpenBLAS/issues/5062)
- [Issue #5279 -- Lack of FP16/BF16 Precision Support for GEMM Kernels on RISCV (closed)](https://github.com/xianyi/OpenBLAS/issues/5279)
- [Issue #5811 -- DGEMM regression between 0.3.31 and 0.3.33 (closed)](https://github.com/xianyi/OpenBLAS/issues/5811)
- [PR #1526 -- Add support for RISC-V (merged 2018-04-28)](https://github.com/xianyi/OpenBLAS/pull/1526)
- [PR #4355 -- Add RISC-V Vector 128-bit target (merged 2024-01-19)](https://github.com/xianyi/OpenBLAS/pull/4355)
- [PR #4504 -- Add builds and unit tests for new RISCV platforms to CI (merged 2024-02-16)](https://github.com/xianyi/OpenBLAS/pull/4504)
- [PR #4778 -- Add support for RISCV64_GENERIC in cmake (merged 2024-07-11)](https://github.com/xianyi/OpenBLAS/pull/4778)
- [PR #4831 -- Enable GEMM-to-GEMV forwarding for RISCV and PPC (merged 2024-08-03)](https://github.com/xianyi/OpenBLAS/pull/4831)
- [PR #5211 -- Optimizing GEMV on the RISC-V V Extension (merged 2025-04-10)](https://github.com/xianyi/OpenBLAS/pull/5211)
- [PR #5291 -- Fix performance issue in RISCV64_ZVL256 when OPENBLAS_K is small (merged 2025-06-10)](https://github.com/xianyi/OpenBLAS/pull/5291)
- [PR #5422 -- Add vectorized packing in ZVL128B and ZVL256B (merged 2025-08-16)](https://github.com/xianyi/OpenBLAS/pull/5422)
- [PR #5427 -- Optimize gemv_t_vector.c for RISCV64_ZVL256B (merged 2025-08-25)](https://github.com/xianyi/OpenBLAS/pull/5427)
- [PR #5432 -- Fix RVV 1.0 detection code (merged 2025-09-05)](https://github.com/xianyi/OpenBLAS/pull/5432)
- [PR #5444 -- Remove manual unrolling in gemv_t_vector.c for riscv (merged 2025-09-13)](https://github.com/xianyi/OpenBLAS/pull/5444)
- [PR #5454 -- Add BF16 sbgemm support on RISCV (merged 2025-09-23)](https://github.com/xianyi/OpenBLAS/pull/5454)
- [PR #5476 -- Cache-friendly matrix traversal for GEMV_N (RISCV) (merged 2025-10-01)](https://github.com/xianyi/OpenBLAS/pull/5476)
- [PR #5481 -- Add SBGEMV and SHGEMV routines to RISC-V (merged 2025-10-07)](https://github.com/xianyi/OpenBLAS/pull/5481)
- [PR #5509 -- CMake: Add default compiler options for RISCV (merged 2025-10-17)](https://github.com/xianyi/OpenBLAS/pull/5509)
- [PR #5527 -- Prevent possible bfloat16 conversion - RISC-V (merged 2025-11-06)](https://github.com/xianyi/OpenBLAS/pull/5527)
- [PR #5561 -- Improve SGEMM/DGEMM/CGEMM/ZGEMM kernels for ZVL128B and ZVL256B (open)](https://github.com/xianyi/OpenBLAS/pull/5561)
- [PR #5573 -- Add interleaving to sgemm and dgemm; disentangle trmm/symm (open)](https://github.com/xianyi/OpenBLAS/pull/5573)
- [PR #5640 -- Added FP16/BF16 GEMM accumulation improvements for RISC-V (merged 2026-02-20)](https://github.com/xianyi/OpenBLAS/pull/5640)
- [PR #5674 -- Improve performance on edges of GEMM for RISC-V (merged 2026-04-11)](https://github.com/xianyi/OpenBLAS/pull/5674)
- [PR #5815 -- Fix contiguous memory check for SGEMM and DGEMM in RISC-V (merged 2026-05-19)](https://github.com/xianyi/OpenBLAS/pull/5815)
- [PR #5819 -- docs: clarify RISC-V RVV target selection and GCC 14+ requirement (merged 2026-06-18)](https://github.com/xianyi/OpenBLAS/pull/5819)
- [PR #5821 -- Add RISC-V 64-bit (riscv64) generic target support (open, effectively NAKed)](https://github.com/xianyi/OpenBLAS/pull/5821)
- [PR #5830 -- Enable RVV-optimized TRSM kernels for RISCV64_ZVL128B (open draft)](https://github.com/xianyi/OpenBLAS/pull/5830)
- [Debian packages.ubuntu.com -- libopenblas0 Noble riscv64](https://packages.ubuntu.com/noble/riscv64/libopenblas0/download)
- [Debian buildd status -- openblas sid](https://buildd.debian.org/status/package.php?p=openblas&suite=sid)
- [riscv-gnu-toolchain nightly releases](https://github.com/riscv-collab/riscv-gnu-toolchain/releases)
- [RISE Project member list](https://riseproject.dev)
- [RISE wheel_builder -- scipy-openblas64 riscv64 wheels](https://riseproject.gitlab.io/python/wheel_builder/packages/scipy-openblas64.html)