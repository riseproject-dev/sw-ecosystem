---
title: SLEEF
categories:
  - libraries
  - ai-ml
---

# SLEEF

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for SLEEF
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

SLEEF (SIMD Library for Evaluating Elementary Functions) is a C library providing SIMD-accelerated implementations of standard math functions (transcendentals, DFT, quad-precision) across multiple architectures. It is consumed by OpenJDK Vector API, PyTorch, LLVM auto-vectorization, and scientific computing runtimes.

**License:** Boost Software License 1.0 (BSL-1.0), permissive.

**Governance:** No foundation affiliation, no governance board. Sole owner and maintainer is Naoki Shibata ([@shibatch](https://github.com/shibatch)). The project solicits financial support from corporations earning over $1M/year from SLEEF-dependent products, framing it as operational risk management. There is no formal tier policy document.

**Corporate contributors:**

| Login | Name | Affiliation | Commits |
|---|---|---|---|
| shibatch | Naoki Shibata | Independent | 358 -- sole maintainer |
| blapie | Pierre Blanchard | Arm Ltd | 53 -- effective co-maintainer |
| joanaxcruz | Joana Cruz | Arm Ltd | 22 |
| xuhancn | Xu Han | Intel Corporation | 5 |
| sh1boot | Simon Hosie | Rivos Inc. | 8 |
| luhenry | Ludovic Henry | Rivos Inc. | 4 |

Arm Ltd employees are the secondary maintainer tier. Rivos Inc. drove the RISC-V port. blapie (Arm) has merged every significant RISC-V PR.

**Community stance on new ports:** The project is receptive to externally driven ports. The full RISC-V port was authored by Rivos Inc. and accepted by blapie. Issues [#432](https://github.com/shibatch/sleef/issues/432) and [#455](https://github.com/shibatch/sleef/issues/455) tracking RISC-V enablement were both closed as completed in November 2023 after the integration PR landed.

**RISE membership:** SLEEF is not a RISE member project. RISE lists member companies. Rivos Inc. (which authored the port) is not on the June 2026 RISE member list either; relevant RISE members include SiFive, NVIDIA, Google, Red Hat, and SpacemiT. The RISE project published one blog post covering SLEEF integration into OpenJDK (authored by Hamlin Li, Rivos), indicating indirect RISE involvement through the OpenJDK working group.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-10 | Issue [#432](https://github.com/shibatch/sleef/issues/432) filed: "Support of RISC-V extension V" | GitHub |
| 2022-10-19 | [PR #448](https://github.com/shibatch/sleef/pull/448): FMA support for RISC-V (luhenry, Rivos) | GitHub |
| 2023-01-13 | [PR #449](https://github.com/shibatch/sleef/pull/449): SiFive initial RVV backend, RVVM1 and RVVM2 (Rivos) | GitHub |
| 2023-11-04 | [PR #477](https://github.com/shibatch/sleef/pull/477) opened: "Integrate RISC-V support" (luhenry, Rivos) -- folds in #448, #449, #468 | GitHub |
| 2023-11-20 | **PR #477 merged by blapie (Arm).** First RISC-V code in mainline. GCC RVV CI commented out due to lack of GCC RVV support at that time; Clang 17 only. | GitHub |
| 2024-01-09 | Issue [#501](https://github.com/shibatch/sleef/issues/501): DFT init infinite loop with 1024-bit QEMU vectors | GitHub |
| 2024-01-17 | [PR #503](https://github.com/shibatch/sleef/pull/503): "Enable libsleefdft and libsleefquad on riscv64" (sh1boot, Rivos) | GitHub |
| 2024-02-15 | **SLEEF 3.6 released** -- first release containing riscv64 libm support | GitHub Releases |
| 2024-03-04 | Issue [#526](https://github.com/shibatch/sleef/issues/526): fixed-vector-length optimization request | GitHub |
| 2024-03-07 | [PR #503](https://github.com/shibatch/sleef/pull/503) merged: libsleefdft + libsleefquad on riscv64 | GitHub |
| 2024-03-07 | [PR #521](https://github.com/shibatch/sleef/pull/521) merged: "Clean up RVV register composition" (sh1boot, Rivos) | GitHub |
| 2024-03-15 | [PR #530](https://github.com/shibatch/sleef/pull/530) merged: "Fix RVV intrinsic version detection" (sh1boot, Rivos) | GitHub |
| 2024-06-10 | **SLEEF 3.6.1 released** -- adds libsleefdft and libsleefquad on riscv64 | GitHub Releases |
| 2024-09-20 | Issue [#579](https://github.com/shibatch/sleef/issues/579): GCC 13 build failure (RVV v0.11 vs v1.0 CMake mismatch) | GitHub |
| 2024-11-01 | [PR #601](https://github.com/shibatch/sleef/pull/601) merged: bump CI GCC to 14 for riscv64 | GitHub |
| 2024-11-11 | [PR #602](https://github.com/shibatch/sleef/pull/602) merged: "Configure.cmake: improve RVV1 check" (orlitzky) | GitHub |
| 2025-01-28 | **SLEEF 3.8 released** | GitHub Releases |
| 2025-02-08 | [PR #624](https://github.com/shibatch/sleef/pull/624) merged: "Add riscv settings" to Jenkinsfile (shibatch) | GitHub |
| 2025-03-26 | **SLEEF 3.9.0 released** | GitHub Releases |

**All RISC-V code is fully upstream.** No downstream forks carry patches not in mainline. The SiFive fork (sifive/sifive-sleef) that predated the port is now superseded.

**Key contributors to the port:** Ludovic Henry (Rivos Inc.), Simon Hosie / sh1boot (Rivos Inc.), with merger credit to Pierre Blanchard (Arm Ltd). A later CMake fix came from Michael Orlitzky (independent).

---

## 3. Upstream Support Tier

No formal written tier policy document exists in the repository. The classification below is derived from the sleef.org environment table and CMake options.

| Platform | GCC | Clang |
|---|---|---|
| RISC-V 64-bit, Linux | Supported | Experimental |

CMakeLists.txt marks both RVVM1 and RVVM2 as **experimental** (both default OFF, warning emitted when enabled). By contrast, AVX2, AVX512F, and AArch64 AdvSIMD carry no such flag and default differently. ARM SVE is not explicitly flagged "experimental" despite being a VLA architecture comparable to RVV [NEEDS VERIFICATION against current sleef.org table].

The upstream README labels RVVM1 and RVVM2 as **"Unmaintained"** -- defined in that document as "may be removed without notice" and "not tested and may not build correctly." This contradicts the active commit history, the addition of Jenkinsfile CI in PR #624 (February 2025, merged by shibatch himself), and the Debian package shipping 3.9.0-1 for riscv64. The "unmaintained" label appears to reflect absence of a named maintainer rather than absence of functional code or active fixes.

**Comparison of upstream tier by architecture:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CMake "experimental" flag | No | No | Yes (both backends) |
| README status | Supported | Supported | Unmaintained |
| CI in GitHub Actions | Yes | Yes | No |
| CI in Jenkinsfile | Yes | Yes | Yes (added Feb 2025) |
| CI public/observable | Yes (GHA) | Yes (GHA) | No (private Jenkins) |
| Release-blocking | Yes | Yes | No |
| Official pre-built binaries | Source-only | Source-only | Source-only |
| Debian package | Yes (3.6.1-3) | Yes | Yes (3.9.0-1 on riscv64) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SLEEF has no JIT engine and no garbage collector. Its RISC-V-specific surface area is entirely in one SIMD helper header, two rename headers, toolchain files, and CMake detection logic.

### 4.1 SIMD Infrastructure (helperrvv.h)

**File:** `src/arch/helperrvv.h`, approximately 650-660 lines.

This is the largest architecture-specific helper file in the codebase, larger than `helpersve.h` (ARM SVE, ~610 lines) and `helperadvsimd.h` (ARM NEON, ~510 lines). It is not a stub. It implements the full SIMD infrastructure layer:

- SP and DP arithmetic (add, sub, mul, div, sqrt, abs, neg, FMA variants)
- Integer arithmetic and bitwise operations
- All comparison predicates
- Load, store, gather, scatter, streaming stores
- Conditional select (`vsel`)
- Type casts and reinterprets
- DFT helpers: `vposneg`, `vnegpos`, `vrev21`, `vreva2`, `vsubadd`, `vmlsubadd`
- Quad/extended-precision compound types (`tdx`, `tdi_t`)
- Two LMUL configurations: RVVM1 (m1/mf2) and RVVM2 (m2/m1)

**ISA extensions required:**

- RVV 1.0 (`__riscv_v >= 1000000`) -- ratified vector extension
- RVV intrinsics v0.12+ (`__riscv_v_intrinsic >= 12000`)
- Bitmanip extensions Zba, Zbb, Zbs (via `-march=rv64gcv_zba_zbb_zbs`)
- No explicit Zvfh or Zve sub-extension gating

**Implementation quality:** Pure C with RVV v1.0 intrinsics. No hand-written assembly (.S files do not exist for riscv64). This matches the SVE approach and is appropriate for a SIMD math library. Two compatibility macros exist for older toolchains (pre-RVV-1.0-rc0 intrinsics) with `-Wuninitialized` suppression, but the production path requires v1.0 intrinsics.

**LMUL variants:**

| Config | F64 type | F32 type | I32 (half-width) | I32 (full-width) |
|---|---|---|---|---|
| RVVM1 | vfloat64m1_t | vfloat32m1_t | vint32mf2_t | vint32m1_t |
| RVVM2 | vfloat64m2_t | vfloat32m2_t | vint32m1_t | vint32m2_t |

**vmask/vint size mismatch (design note from PR #503):** `vmask` uses 64-bit elements even in single-precision code (required by `vcast_vm_i_i`), while `vint` uses 32-bit elements. For RVVM1 SP this means `vmask` needs LMUL=2 while `vint` needs LMUL=0.5 of 64-bit types to keep VLMAX=VECTLENDP. PR #503 resolved this with explicit widening/narrowing (`vncvt_x`, `vwcvtu_x`, `vwcvt_x`, `vnsrl 32`). No TODO or FIXME markers remain in the file.

### 4.2 Math Functions (libm)

`sleefsimddp.c` and `sleefsimdsp.c` include `helperrvv.h` under `#ifdef ENABLE_RVVM1` and `#ifdef ENABLE_RVVM2` guards, each with `ENABLE_RVV_DP` and `ENABLE_RVV_SP` respectively. These are the same source files used for all other architectures; RISC-V gets the same transcendental function set (sin, cos, tan, asin, acos, atan, atan2, exp, exp2, expm1, log, log2, log10, log1p, pow, cbrt, hypot, sinh, cosh, tanh and their fast variants at ULP 1 and ULP 3.5).

A handful of single-precision functions are explicitly excluded for VLA architectures (RVV and SVE alike): `vmulsign_vf_vf_vf`, `vcopysign_vf_vf_vf`, `vsign_vf_vf`, `vorsign_vf_vf_vf`, and the `fi_t`/`dfi_t` struct definitions. These are shared VLA limitations, not riscv64-specific gaps.

### 4.3 DFT (libsleefdft)

Code support added by [PR #503](https://github.com/shibatch/sleef/pull/503) (merged 2024-03-07). `src/dft/CMakeLists.txt` defines 10 RVVM1 and 10 RVVM2 DFT targets (5 widths x 2 precisions). DFT is **disabled in CI** (`-DSLEEF_BUILD_DFT=False`) due to open bug [#501](https://github.com/shibatch/sleef/issues/501): an infinite loop in `src/dft/dft.c` during initialization when QEMU emulates a 1024-bit vector width and `measure()` fails, leaving loop variable `level` never decrementing. The DFT code compiles but its correctness in edge cases with hardware wider than 512 bits is unverified.

### 4.4 Quad Precision (libsleefquad)

Added in [PR #503](https://github.com/shibatch/sleef/pull/503). `src/quad/sleefsimdqp.c` defines `Sleef_rvvm1quad` and `Sleef_rvvm2quad` types and includes the appropriate rename headers. Listed in `SLEEF_SUPPORTED_QUAD_EXTENSIONS` in CMake. No quad-specific open bugs found. CI enforces quad on riscv64 (`-DSLEEF_BUILD_QUAD=TRUE`).

### 4.5 Runtime CPU Dispatch

**Absent.** No `dispriscv64.c.org` file exists. The build system does not generate a runtime dispatcher for RISC-V. Vector width selection (RVVM1 vs RVVM2) is compile-time only. This matches the aarch64 pattern: ARM also has no dispatcher (AdvSIMD vs SVE is compile-time). By contrast, x86 has `dispsse.c.org` and `dispavx.c.org` enabling runtime SSE2/AVX2/AVX512 selection via HWCAP. The absence of a dispatcher means an riscv64 binary must be compiled separately for each LMUL configuration.

### 4.6 Inline Headers

`-DSLEEF_BUILD_INLINE_HEADERS=TRUE` is enforced in Jenkinsfile CI, so riscv64 inline header generation is tested. Rename headers `renamervvm1.h` and `renamervvm2.h` are present.

### Architecture comparison:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD helper | helpersse2/avx/avx512 | helperadvsimd + helpersve | helperrvv (RVV v1.0 intrinsics) |
| Implementation quality | Intrinsics + asm | Intrinsics | Intrinsics |
| Math functions (SP+DP) | Full | Full | Full |
| DFT | Full, CI-enforced | Full, CI-enforced | Code present, CI disabled (bug #501) |
| Quad precision | Full | Full | Full (CI-enforced) |
| Runtime dispatch | Yes (SSE2/AVX2/AVX512) | No | No |
| Fixed-width SIMD variants | Yes (128/256/512-bit) | Fixed (128-bit NEON) | No (VLA only) |
| Assembly (.S files) | Some | Some | None |

---

## 5. Build System, Cross-Compilation, and Toolchain

### Required toolchain versions

- **GCC:** 14+ (riscv64 toolchain file searches `riscv64-linux-gnu-gcc-14` first, then `riscv64-linux-gnu-gcc` with no version fallback to 13 or older). GCC 13 fails: it passes the CMake RVV capability test but cannot compile the library code requiring RVV v1.0 tuple types (`vfloat64m1x4_t`) -- fixed by [PR #602](https://github.com/shibatch/sleef/pull/602).
- **Clang:** 17+ preferred (toolchain file uses `clang-17`). Clang 18+ required if `__riscv_vcreate_*` functions are exercised ([PR #530](https://github.com/shibatch/sleef/pull/530)). Clang 19 is used in Jenkinsfile CI.
- **Architecture flags:** `-march=rv64gcv_zba_zbb_zbs` (both RVVM1 and RVVM2)

### CMake options for riscv64

| Flag | Default | Notes |
|---|---|---|
| -DSLEEF_ENABLE_RVVM1=ON | OFF | Enable RVVM1 (LMUL=1), emits "experimental" warning |
| -DSLEEF_ENABLE_RVVM2=ON | OFF | Enable RVVM2 (LMUL=2), emits "experimental" warning |
| -DSLEEF_ENFORCE_RVVM1=ON | OFF | Fatal error if RVVM1 not detected by compiler |
| -DSLEEF_ENFORCE_RVVM2=ON | OFF | Fatal error if RVVM2 not detected by compiler |
| -DNATIVE_BUILD_DIR=&lt;path&gt; | (none) | Required for cross-compilation |
| -DSLEEF_BUILD_DFT=OFF | OFF | Keep OFF for riscv64 (bug #501) |
| -DSLEEF_BUILD_QUAD=TRUE | OFF | Quad precision, works on riscv64 |
| -DSLEEF_BUILD_INLINE_HEADERS=TRUE | OFF | Inline headers, works on riscv64 |

### Cross-compilation commands

Cross-compilation requires a two-step build. Step 1 produces host tools (`mkrename`, `mkdisp`, `mkalias`). Step 2 uses them during riscv64 compilation.

**Step 1 -- native host build:**

```bash
cmake -S . -B build-native/ \
  -DCMAKE_INSTALL_PREFIX=./install-native \
  -DCMAKE_TOOLCHAIN_FILE=toolchains/native-gcc.cmake \
  -DSLEEF_BUILD_TESTS=OFF \
  -DSLEEF_BUILD_LIBM=ON
cmake --build build-native/ -j $(nproc)
```

**Step 2 -- riscv64 cross-compile (GCC 14):**

```bash
cmake -S . -B build-riscv64/ \
  -DCMAKE_INSTALL_PREFIX=./install-riscv64 \
  -DCMAKE_TOOLCHAIN_FILE=toolchains/riscv64-gcc.cmake \
  -DNATIVE_BUILD_DIR=$(pwd)/build-native \
  -DSLEEF_ENABLE_RVVM1=ON \
  -DSLEEF_ENABLE_RVVM2=ON
cmake --build build-riscv64/ -j $(nproc)
```

**Step 2 alternative -- riscv64 cross-compile (Clang 17):**

```bash
cmake -S . -B build-riscv64/ \
  -DCMAKE_INSTALL_PREFIX=./install-riscv64 \
  -DCMAKE_TOOLCHAIN_FILE=toolchains/riscv64-llvm.cmake \
  -DNATIVE_BUILD_DIR=$(pwd)/build-native \
  -DSLEEF_ENABLE_RVVM1=ON \
  -DSLEEF_ENABLE_RVVM2=ON
cmake --build build-riscv64/ -j $(nproc)
```

**QEMU testing:** Set `SLEEF_TARGET_EXEC_USE_QEMU=1` before `ctest` to run riscv64 test binaries via QEMU user-mode emulation on an x86 host. Without this variable, the cross build imports host tools from `NATIVE_BUILD_DIR` but does not execute riscv64 binaries.

### Known build failures

- **GCC 13:** Fails due to missing RVV v1.0 tuple types. Do not use GCC 13. Fixed by [PR #602](https://github.com/shibatch/sleef/pull/602) (requires GCC 14).
- **Clang 21 + custom sysroot:** Issue [#694](https://github.com/shibatch/sleef/issues/694) (closed) reported linker errors from triple mismatch (`riscv64-linux-gnu` vs `riscv64-unknown-linux-gnu`). Not a SLEEF defect; resolved by aligning toolchain triples.
- **DFT + QEMU 1024-bit vectors:** Bug [#501](https://github.com/shibatch/sleef/issues/501) causes DFT initialization to loop infinitely. Build succeeds; test hangs. Mitigation: disable DFT in CI (`-DSLEEF_BUILD_DFT=False`).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

| Feature | amd64 | arm64 | riscv64 | Gap description |
|---|---|---|---|---|
| SP and DP transcendentals (libm) | Full | Full | Full | None |
| Quad precision (libsleefquad) | Full | Full | Full | None |
| DFT (libsleefdft) | Full | Full | Code present, CI disabled | Bug #501: DFT init loop on wide vectors |
| Runtime SIMD dispatch | Yes | No | No | Must compile separately per LMUL; shared library cannot auto-select |
| Fixed-width vector backends | Yes (128/256/512) | Yes (128 NEON) | No | VLA-only; no 256-bit or 512-bit fixed-width variant |
| Inline headers | Yes | Yes | Yes | None |
| vmulsign, vcopysign, vsign (SP) | Yes | No (SVE) | No (VLA) | Shared VLA limitation; not riscv64-specific |

### Performance gaps

The absence of a runtime dispatcher is the most significant performance gap relative to amd64. On x86, a single `libsleef.so` uses HWCAP to select SSE2 vs AVX2 vs AVX512 at load time. On riscv64, RVVM1 and RVVM2 are separate compilation targets. There is no runtime fallback path; a mismatch between the compiled LMUL and the hardware LMUL wastes vector registers or crashes.

The fixed-vector-length optimization described in issue [#526](https://github.com/shibatch/sleef/issues/526) (using `__riscv_v_fixed_vlen` when `-mrvv-vector-bits=zvl` is passed) is not implemented. The runtime `__riscv_vlenb()` call is used instead. The author estimates this gap is minor.

**Available benchmark data (from OpenJDK PR [#21083](https://github.com/openjdk/jdk/pull/21083), hardware: BananaPi F3, SpacemiT K1 chip, RVV 1.0, JMH, vector size=1024):**

| Benchmark | With SLEEF (ns/op) | Without SLEEF (ns/op) | Speedup |
|---|---|---|---|
| Float256Vector.EXP | 16,170 | 125,594 | 7.77x |
| Float256Vector.LOG1P | 23,836 | 194,624 | 8.17x |
| FloatMaxVector.LOG1P | 22,993 | 190,346 | 8.28x |
| Float256Vector.ATAN2 | 32,809 | 241,230 | 7.35x |
| FloatMaxVector.ATAN2 | 33,659 | 258,396 | 7.68x |
| Float128Vector.EXP | 32,521 | 158,283 | 4.87x |
| Double256Vector.HYPOT | 58,180 | 253,002 | 4.35x |
| DoubleMaxVector.HYPOT | 59,064 | 253,276 | 4.29x |
| Double256Vector.ATAN2 | 83,098 | 373,364 | 4.49x |
| Double128Vector.HYPOT | 111,580 | 374,537 | 3.36x |

Reported average across all benchmarks: approximately 2.38x. These numbers measure the Java Vector API with SLEEF vs without SLEEF on riscv64, not a head-to-head riscv64 vs arm64 comparison.

The SLEEF upstream benchmark page at sleef.org/benchmark.xhtml contains no riscv64 rows. It covers Intel Core i7-6700, AMD Ryzen 9 7950X, and Apple M1 only. No riscv64 vs arm64 or riscv64 vs amd64 SLEEF-native benchmark data is publicly available.

### NaN / floating-point semantics

The RISE blog post for the OpenJDK integration notes that SLEEF calls modify the floating-point rounding mode and that a bridge layer was required to enforce return to RNE mode after SLEEF calls. This is an integration concern for callers, not a SLEEF defect. No open riscv64-specific NaN or correctness issues were found.

---

## 7. CI/CD Infrastructure

### GitHub Actions (.github/workflows/)

Four workflows exist: `build-and-test-macos.yml`, `build-and-test-msys2.yml`, `build-as-subproject.yml`, `build-examples.yml`. Direct inspection of all four files confirms **zero riscv64 references**. No riscv64 job, no cross-compilation, no QEMU invocation exists in any GitHub Actions workflow.

PR #477 (November 2023) included a GitHub Actions CI job for linux-riscv64, but that job is not present in the current workflow files. It has been removed at some point after the initial merge. Issue [#709](https://github.com/shibatch/sleef/issues/709) (opened May 2026) proposes adding QEMU-based riscv64 GitHub Actions CI and has not yet been merged.

### Jenkinsfile

The repository contains a Jenkinsfile at the root with two riscv64 stages, added by [PR #624](https://github.com/shibatch/sleef/pull/624) (merged February 8, 2025, by shibatch):

**Stage: `riscv linux gcc-14`**
- Agent label: `riscv && ubuntu24`
- CC=gcc-14, CXX=g++-14
- CMake flags: `-DSLEEF_ENFORCE_RVVM1=True -DSLEEF_ENFORCE_RVVM2=True -DSLEEF_BUILD_QUAD=TRUE -DSLEEF_BUILD_INLINE_HEADERS=TRUE -DSLEEF_ENFORCE_TESTER4=True -DSLEEF_ENABLE_TESTER=False -DSLEEF_BUILD_DFT=False`
- Runs `ctest -j $(nproc)` and `ninja install`

**Stage: `riscv linux clang-19`**
- Agent label: `riscv && ubuntu24`
- Identical CMake flags
- `HEARTBEAT_CHECK_INTERVAL=86400` (24-hour heartbeat, indicating slow RISC-V hardware)

**Critical observation:** The Jenkinsfile stages have no `-DEMULATOR` flag. The aarch64 stages use `-DEMULATOR=qemu-aarch64-static`. The riscv64 stages do not. This implies one of: (a) the Jenkins agent labeled `riscv && ubuntu24` is real RISC-V hardware, or (b) the tests are built but not executed. The 24-hour heartbeat timeout is consistent with real hardware.

Jenkins is private infrastructure. There is no publicly visible Jenkins dashboard, no status badge in the README, and no public URL linked in the repository. Pass/fail status for these CI stages cannot be independently verified.

### RISE CI Runners

Data not available: no riseproject-dev GitHub repository for SLEEF was found. RISE runner usage by SLEEF is not documented in the repository or in any RISE-published material.

### CI comparison:

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions | Yes, multiple workflows | Yes, multiple workflows | No (removed; issue #709 proposes restoring) |
| Jenkins | Yes | Yes | Yes (added Feb 2025, private) |
| Public CI observable | Yes | Yes | No |
| LMUL/ISA variants tested | SSE2/AVX2/AVX512F | AdvSIMD + SVE | RVVM1 + RVVM2 |
| DFT enforced | Yes | Yes | No (bug #501) |
| Hardware type | x86 | aarch64 | Native riscv64 [NEEDS VERIFICATION] or QEMU |

---

## 8. Distribution and Release Status

### GitHub Releases

SLEEF ships source-only via GitHub Releases. Every release (3.9.0, 3.8, 3.7, 3.6.1, 3.6, and older) contains exactly two assets: `<version>.zip` and `<version>.tar.gz`. No pre-built binaries exist for any architecture. This is consistent for all platforms, not riscv64-specific.

### PyPI

No SLEEF package exists on PyPI. A query to `https://pypi.org/pypi/sleef/json` returns HTTP 404. No riscv64 wheel, no wheel of any kind.

### Debian

`libsleef3` and `libsleef-dev` are in Debian official ports for riscv64:

| Suite | Version | riscv64 status |
|---|---|---|
| Debian stable (bookworm) | 3.6.1-3 | Available |
| Debian sid (unstable) | 3.9.0-1 | Built and installed on `rv-osuosl-04` per buildd.debian.org |

### Ubuntu

Ubuntu 24.04 Noble ships `libsleef3` and `libsleef-dev` at version 3.5.1-3 for amd64, arm64, armhf, and ppc64el only. **riscv64 is not present in Ubuntu 24.04.** This gap means Ubuntu-based CI infrastructure and container workflows targeting Ubuntu 24.04 cannot install SLEEF from apt for riscv64.

### Arch Linux RISC-V

The archriscv.felixc.at package status page was checked. SLEEF does not appear on the build failure list. Full confirmation of a working Arch RISC-V package was not obtainable from the available data. Status: unverified.

### What a user must do to get a working riscv64 binary

On Debian: `apt install libsleef-dev` installs the 3.9.0-1 package.

On Ubuntu 24.04: build from source using the two-step cross-compilation procedure in Section 5, with GCC 14 (`riscv64-linux-gnu-gcc-14`) or Clang 17+.

---

## 9. Dependencies

### Summary table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| TLFloat (shibatch/tlfloat) | Quad/octuple float types for libm and DFT reference; linked into libsleefdft | Yes | No riscv64-specific failures found | Debian sid: libtlfloat-dev available for riscv64 | Fetched at build time via ExternalProject_Add; no riscv64 issues |
| MPFR (libmpfr) | Oracle for correctness testing; not in production library | Yes | Yes (generic C) | Debian riscv64: libmpfr-dev 4.2.2-3 | No RISC-V-specific issues |
| GMP (libgmp) | Arbitrary-precision arithmetic used by MPFR; indirect test dep | Yes | Yes | Debian riscv64: libgmp-dev 6.3.0 | No RISC-V-specific issues |
| FFTW3 (libfftw3, libfftw3f, libfftw3_omp) | Reference FFT for DFT correctness tests; not in production library | Yes | Passes (scalar path) | Debian riscv64: libfftw3-dev 3.3.11-1 | No RVV acceleration in FFTW3; scalar reference only |
| OpenSSL (libssl, libcrypto) | Test utilities only | Yes | Yes | Debian riscv64: libssl-dev 3.6.3-1 | Issue #694 was a toolchain config error, not OpenSSL |
| OpenMP (libgomp) | Parallel-for in libsleefdft and DFT tests | Yes | Yes | Standard GCC runtime for riscv64 | No riscv64-specific issues |

### FFTW3 note

FFTW3 has no RVV vector acceleration. SLEEF DFT tests running on riscv64 compare against a scalar FFTW3 reference implementation. This is a correctness-only concern: the comparison is valid for verifying mathematical correctness, but it means no riscv64 SIMD-vs-SIMD performance comparison between SLEEF DFT and FFTW3 is possible. This does not block builds or correctness testing.

None of these six dependencies are RISC-V-blocking for SLEEF's build or test on riscv64.

---

## 11. Known Bugs and Active Issues

### RISC-V-specific

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#501](https://github.com/shibatch/sleef/issues/501) | dft test gets stuck during initialisation when hardware vector length is very long | Open | Medium | Infinite loop in `src/dft/dft.c` when QEMU emulates 1024-bit RVV vectors and `measure()` fails to populate `p->bestPath`. No assignee, no linked PR. Causes DFT to be excluded from riscv64 CI. |
| [#526](https://github.com/shibatch/sleef/issues/526) | RISC-V: exploit -mrvv-vector-bits=zvl when used | Open | Low | Performance optimization only: use compile-time `__riscv_v_fixed_vlen` instead of runtime `__riscv_vlenb()` when fixed vector length is known. Blocked by CI complexity. luhenry notes this is not suitable for distributed library builds. |
| [#709](https://github.com/shibatch/sleef/issues/709) | [RISC-V] init RISC-V ci | Open | Medium | PR to add QEMU-based GitHub Actions CI for riscv64 with RVVM1 default. Not yet merged as of June 2026. Confirms that current GitHub Actions CI gap is known to the project. |

### Cross-compilation issues (closed/resolved)

| ID | Title | Status | Notes |
|---|---|---|---|
| [#579](https://github.com/shibatch/sleef/issues/579) | Risc V and gcc-13 | Closed | GCC 13 passed CMake capability check but failed to compile library. Fixed by PR #602 (require GCC 14). |
| [#614](https://github.com/shibatch/sleef/issues/614) | Random failures with QEMU in Ubuntu 24.04 | Closed | Random test failures on riscv64 (and ppc64, s390x) after GitHub Actions runner image upgrade to Ubuntu 24.04.1. Not a SLEEF code bug; tracked upstream in actions/runner-images. |
| [#694](https://github.com/shibatch/sleef/issues/694) | Cannot find crtbeginS.o and -lgcc during cross compilation to RISC-V | Closed | Clang 21 + custom sysroot triple mismatch. Toolchain configuration issue, not SLEEF. |

### General correctness bugs (platform-independent, affect riscv64)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#560](https://github.com/shibatch/sleef/issues/560) | Feature detection is not thread-safe | Open | High | Multi-threaded correctness bug; affects all platforms including riscv64 |
| [#570](https://github.com/shibatch/sleef/issues/570) | Atanh returning values slightly outside specified error bound | Open | Medium | All platforms |
| [#600](https://github.com/shibatch/sleef/issues/600) | Exp and pow return infinity too early (premature overflow) | Open | Medium | All platforms |
| [#667](https://github.com/shibatch/sleef/issues/667) | Range of xexpf to clamp to 0 and inf differs in scalar vs SIMD paths | Open | Medium | All platforms |
| [#707](https://github.com/shibatch/sleef/issues/707) | SIMD: PURECFMA scalar dispatch causes SIGILL on x86-64-v2 CPUs | Open | High | x86-specific; no riscv64 analogue identified |

---

## 12. Objections and Upstream Blockers

**"Unmaintained" label in README:** The actual label in the upstream README is "Unmaintained" for RVVM1 and RVVM2. This is contradicted by active commits, Jenkinsfile CI, and the Debian 3.9.0-1 build, but the label will discourage adoption by teams doing due diligence against the README. The label should be updated to "Experimental" to match CMake terminology.

**No named maintainer:** The project has no designated riscv64 maintainer. Rivos Inc. employees who drove the port (luhenry, sh1boot) are not publicly confirmed as still active on SLEEF as of mid-2026. The next RISC-V fix or issue may wait for whoever notices it first.

**No GitHub Actions CI:** The riscv64 GitHub Actions job that was added in PR #477 was removed at some point. Issue #709 proposes restoring it, but has not merged. External contributors submitting riscv64 PRs get no automated feedback on correctness. This slows the review cycle and increases maintainer burden.

**DFT gap:** Bug #501 (DFT init loop on wide vectors) has been open since January 2024 with no assigned fix. DFT is excluded from CI as a workaround. Any consumer of SLEEF DFT on riscv64 with a hardware vector width >= 1024 bits will hit this.

**No runtime dispatcher:** Applications that need to run the same binary across RVV hardware with different natural vector lengths cannot use SLEEF's VLA backends through a single shared library. Each LMUL variant is a separate library. This is the same limitation as SVE; it is a structural constraint of the VLA approach, not a bug, but it is a deployment complexity that amd64 users do not encounter.

**Acceptance probability for new contributions:** High. The project accepted all prior Rivos Inc. contributions. blapie (Arm) is an active reviewer and has merged every RISC-V PR. shibatch personally merged the Jenkinsfile RISC-V settings. New contributions addressing the three open issues (#501, #526, #709) would be accepted with reasonable review turnaround.

---

## 13. Investment Analysis

RISE funded Hamlin Li (Rivos) to integrate SLEEF into OpenJDK. That work is complete (OpenJDK PRs #20781 and #21083 merged) and also contributed SLEEF fixes #536 and #537 upstream. The OpenJDK integration is done; it should not be re-funded.

The Rivos-driven core port (PR #477, #503, #521, #530) is fully upstream and complete. That work should not be re-funded.

Remaining investment opportunities are CI restoration, one correctness bug, and one documentation fix.

### 13.1 Functional Enablement

**DFT init loop bug (#501):** The infinite loop in `src/dft/dft.c` when `measure()` fails on very wide vectors needs a root-cause fix. The loop exit condition depends on `p->bestPath` being populated; the fix requires understanding why `measure()` silently fails. Estimated scope: investigate `measure()` failure mode, add a loop guard or timeout, restore DFT in CI. One engineer familiar with SIMD FFT internals.

**Thread-safety of feature detection (#560):** General correctness bug affecting all platforms. Not riscv64-specific but blocks production use in multi-threaded applications. Not uniquely a riscv64 investment item.

### 13.2 Performance Optimization

**Fixed-vector-length optimization (#526):** Low-priority. The `__riscv_vlenb()` runtime call versus compile-time `__riscv_v_fixed_vlen` macro. The author estimates minimal gain. Not recommended as a funded work item.

**Runtime LMUL dispatcher:** Adding an HWCAP-based dispatcher analogous to amd64's `dispsse.c.org` would allow a single `libsleef.so` to select RVVM1 vs RVVM2 at load time based on hardware vector length. This is a moderate but useful feature for deployment environments with mixed RISC-V hardware. No tracking issue exists for this.

### 13.3 CI/CD Infrastructure

**Restore GitHub Actions CI (#709):** PR #709 proposes QEMU-based riscv64 CI in GitHub Actions. This is the highest-leverage low-effort item: public CI prevents regressions and removes barrier for external contributors. Work is partially drafted. One engineer to complete the PR and get it merged.

### 13.4 Ecosystem Enablement

**Update README "Unmaintained" label:** The "Unmaintained" label in the upstream README should be updated to "Experimental" or "Supported." One-line change. Very low effort; high impact on adoption perception.

**Ubuntu 24.04 riscv64 package:** Ubuntu 24.04 does not ship SLEEF for riscv64. This requires filing a Debian/Ubuntu packaging update or working with the Ubuntu RISC-V porter team. Debian sid already has 3.9.0-1 for riscv64, so the path is: update Ubuntu's package to track Debian sid's version and add riscv64 as a target architecture. This is packaging work, not SLEEF code work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Restore GitHub Actions riscv64 CI (issue #709) | 1 | RISE / any Rivos/SiFive contributor | Critical |
| Functional | Fix DFT init loop on wide vectors (bug #501) | 3-4 | RISE / engineer with SIMD FFT background | High |
| Documentation | Update README "Unmaintained" to "Experimental" | 0.1 | Upstream maintainer (shibatch or blapie) | High |
| Distribution | Add riscv64 to Ubuntu 24.04 SLEEF package | 2 | Ubuntu RISC-V porter team | Medium |
| Performance | Runtime LMUL dispatcher (no tracking issue) | 6-8 | RISE / engineer with SLEEF internals | Medium |
| Performance | Fixed-vector-length optimization (issue #526) | 1 | Low -- author estimates minimal gain | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [shibatch/sleef repository](https://github.com/shibatch/sleef)
- [sleef.org homepage](https://sleef.org/)
- [PR #477: Integrate RISC-V support (merged 2023-11-20)](https://github.com/shibatch/sleef/pull/477)
- [PR #503: Enable libsleefdft and libsleefquad on riscv64 (merged 2024-03-07)](https://github.com/shibatch/sleef/pull/503)
- [PR #521: Clean up RVV register composition (merged 2024-03-07)](https://github.com/shibatch/sleef/pull/521)
- [PR #530: Fix RVV intrinsic version detection (merged 2024-03-15)](https://github.com/shibatch/sleef/pull/530)
- [PR #601: Update GCC version from 13 to 14 in GHA (merged 2024-11-01)](https://github.com/shibatch/sleef/pull/601)
- [PR #602: Configure.cmake: improve RVV1 check (merged 2024-11-11)](https://github.com/shibatch/sleef/pull/602)
- [PR #624: Add riscv settings (merged 2025-02-08)](https://github.com/shibatch/sleef/pull/624)
- [Issue #432: Support of RISC-V extension V (closed)](https://github.com/shibatch/sleef/issues/432)
- [Issue #455: Enable Riscv64 Support (closed)](https://github.com/shibatch/sleef/issues/455)
- [Issue #501: dft test gets stuck during initialisation when hardware vector length is very long (open)](https://github.com/shibatch/sleef/issues/501)
- [Issue #524: RISC-V architecture missing on sleef.org (closed)](https://github.com/shibatch/sleef/issues/524)
- [Issue #526: RISC-V: exploit -mrvv-vector-bits=zvl when used (open)](https://github.com/shibatch/sleef/issues/526)
- [Issue #560: Feature detection is not thread-safe (open)](https://github.com/shibatch/sleef/issues/560)
- [Issue #570: Atanh returning values slightly outside specified error bound (open)](https://github.com/shibatch/sleef/issues/570)
- [Issue #579: Risc V and gcc-13 (closed)](https://github.com/shibatch/sleef/issues/579)
- [Issue #600: Exp and pow return infinity too early (open)](https://github.com/shibatch/sleef/issues/600)
- [Issue #614: Random failures with QEMU in Ubuntu 24.04 (closed)](https://github.com/shibatch/sleef/issues/614)
- [Issue #667: Range of xexpf to clamp to 0 and inf differs in scalar vs SIMD paths (open)](https://github.com/shibatch/sleef/issues/667)
- [Issue #694: Cannot find crtbeginS.o and -lgcc during cross compilation to RISC-V (closed)](https://github.com/shibatch/sleef/issues/694)
- [Issue #707: SIMD PURECFMA scalar dispatch causes SIGILL on x86-64-v2 CPUs (open)](https://github.com/shibatch/sleef/issues/707)
- [Issue #709: [RISC-V] init RISC-V ci (open)](https://github.com/shibatch/sleef/issues/709)
- [RISE Project blog: OpenJDK Supercharging Vectorized Math with SLEEF (2025-09-24)](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [OpenJDK PR #20781: Embed SLEEF headers into JDK source tree](https://github.com/openjdk/jdk/pull/20781)
- [OpenJDK PR #21083: Intrinsify Vector API math operations using SLEEF on RISC-V](https://github.com/openjdk/jdk/pull/21083)
- [SLEEF PR #536: Mark Sleef_rempitabq* constants as static](https://github.com/shibatch/sleef/pull/536)
- [SLEEF PR #537: Mark SLEEF_ALWAYS_INLINE as always_inline attribute](https://github.com/shibatch/sleef/pull/537)
- [Debian buildd status for SLEEF](https://buildd.debian.org/status/package.php?p=sleef)
- [Debian tracker for SLEEF](https://tracker.debian.org/pkg/sleef)
- [sleef.org benchmark page](https://sleef.org/benchmark.xhtml)
- [commit 87e73dc711: Configure.cmake: improve and unify RISC-V vector extension checks](https://github.com/shibatch/sleef/commit/87e73dc711be495e16aae73b430d6c8a0c4b2544)