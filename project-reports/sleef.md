---
title: SLEEF
parent: Project Reports
color: blue
dependencies:
  - name: TLFloat
    relation: runtime-dependency
    criticality: critical
  - name: GNU MPFR
    relation: test-dependency
    criticality: optional
  - name: FFTW3
    relation: test-dependency
    criticality: optional
  - name: OpenSSL
    relation: test-dependency
    criticality: optional
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="sleef" %}

# SLEEF

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for SLEEF<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SLEEF (SIMD Library for Evaluating Elementary Functions) is a C library providing SIMD-accelerated implementations of standard math functions (transcendentals, DFT/FFT, quad-precision arithmetic) across x86_64, AArch64, RISC-V, POWER/VSX and s390x. It is consumed downstream by OpenJDK's Vector API, PyTorch, LLVM auto-vectorization (`-fveclib=SLEEF`), and scientific computing runtimes. Homepage: [sleef.org](https://sleef.org/). Repository: [shibatch/sleef](https://github.com/shibatch/sleef).

**License:** Boost Software License 1.0 (BSL-1.0), permissive.

**Governance:** No foundation affiliation, no governance board. The project is BDFL-style, led by sole long-term maintainer Naoki Shibata ([@shibatch](https://github.com/shibatch)), who accounts for 329 of recent commits per `git shortlog -sne --all`. No MAINTAINERS, OWNERS, or CODEOWNERS file exists in the repository.

As of November 2025 the project added `CONTRIBUTING.md` and `SUSTAINABILITY.md`, which establish a pointed funding stance: companies with over US$1M in annual revenue who embed SLEEF in products are asked for financial support, and face a Corporate Contributor License Agreement (CCLA) requiring full IP assignment and unlimited liability for contributions, unless they negotiate a separate "Maintenance Support Agreement" for an "Authorized Exemption." The maintainer ties this explicitly to the project's Code of Conduct (cross-referencing `shibatch/nofreelunch`), framing uncompensated corporate use as "extractive." Practical implication for RISC-V: absent dedicated sponsorship or stewardship, platform tiers degrade rather than advance - the RISC-V/RVV port, despite real historical investment from Arm and Rivos, has been downgraded to "Unmaintained" status in the current README (see Section 3), and x86 SSE2 is separately flagged "seeking sponsorship."

**Corporate contributors (by commit volume, `git shortlog -sne --all`):**

| Login/Name | Affiliation | Commits | Role |
|---|---|---|---|
| Naoki Shibata (shibatch) | Independent | 329 (recent shortlog) | Sole maintainer, BDFL |
| Francesco Petrogalli | Arm Ltd | 62 | Heaviest corporate contributor |
| Pierre Blanchard (blapie) | Arm Ltd | 34 + 19 (two emails) = 53 | Effective co-maintainer; merged every significant RISC-V PR |
| Joana Cruz (joanaxcruz) | Arm Ltd | 12 + 7 = 19 [existing-report figure of 22 NEEDS VERIFICATION against this] | Reviewer |
| Diana Bite | Arm Ltd | 10 | Contributor |
| Simon Hosie (sh1boot) | Rivos Inc | Multiple (exact count not independently re-confirmed) | Drove RVV cleanup/DFT/quad work |
| Ludovic Henry (luhenry) | Rivos Inc | Multiple (authored first RISC-V commit) | Authored PR #477 integration |
| Xu Han (xuhancn) | Intel Corporation | Not independently re-confirmed | Contributor |
| Michael Orlitzky (orlitzky) | Independent | - | Fixed PR #602 (GCC-13 RVV detection) |

Arm Ltd employees form the de facto secondary maintainer tier; blapie (Arm) has merged every significant RISC-V pull request, including the original integration PR #477. Rivos Inc. engineers (Hosie, Henry) authored the bulk of the RISC-V/RVV implementation work itself.

**Community stance on new ports:** The project is receptive to externally driven ports when a corporate sponsor funds the work. The full RISC-V port was authored by Rivos Inc. and accepted by Arm's blapie. Issues [#432](https://github.com/shibatch/sleef/issues/432) and [#455](https://github.com/shibatch/sleef/issues/455), tracking RISC-V enablement, were both closed as completed after the integration PR landed in November 2023.

**RISE involvement:** SLEEF itself is not a RISE member project and has no dedicated repository under the `riseproject-dev` GitHub organization. However, RISE documents and tracks SLEEF explicitly: it is catalogued internally as project **SL_02_003** (per RISE's wiki, indexed summary: "a vectorized libm, libquad and dft implementation," development completed Q4 2023, upstreaming completed), and RISE has published two blog posts referencing SLEEF - one on integrating SLEEF into OpenJDK's Vector API ([2025-09-24](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)) and one on PyTorch's riscv64 support that cites SLEEF's RISC-V port as foundational ([2026-08-18](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)). SLEEF is not among the packages built by RISE's Python wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) - unsurprising, since no PyPI distribution of SLEEF exists for any architecture (Section 8).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-10 | Issue [#432](https://github.com/shibatch/sleef/issues/432) filed: "Support of RISC-V extension V" | GitHub |
| 2022-10-19 | [PR #448](https://github.com/shibatch/sleef/pull/448): FMA support for RISC-V; closed/unmerged, folded into #477 | GitHub |
| 2023-01-13 | [PR #449](https://github.com/shibatch/sleef/pull/449): SiFive-submitted RVV backend (RVVM1/RVVM2, LMUL=1/2); closed/unmerged, folded into #477 | GitHub |
| 2023-03-18 | Issue [#455](https://github.com/shibatch/sleef/issues/455) filed: "Enable Riscv64 Support," pointing to the SiFive fork (`sifive/sifive-sleef`) as a patch source | GitHub |
| 2023-08-03 | [PR #468](https://github.com/shibatch/sleef/pull/468): "Support for RiscV architecture," flagged as duplicate of #448, closed unmerged | GitHub |
| 2023-11-04 | [PR #477](https://github.com/shibatch/sleef/pull/477) opened: "Integrate RISC-V support" (luhenry, Rivos), depended on #476 | GitHub |
| 2023-11-20 | **PR #477 merged** (merge commit `cea4434`, by blapie/Arm). First RISC-V code in mainline; Clang 17 only at merge time, GCC RVV support explicitly deferred ("GCC needed trunk rather than release versions currently available") | GitHub |
| 2024-01-17 | [PR #503](https://github.com/shibatch/sleef/pull/503) opened, continuation of closed [#496](https://github.com/shibatch/sleef/pull/496): "Enable libsleefdft and libsleefquad on riscv64," dependent on prerequisite PRs #520 to #522 and #527 | GitHub |
| 2024-02-15 | **SLEEF 3.6 released** - first release containing riscv64 libm support (PR #477) | GitHub Releases |
| 2024-03-04 | Issue [#526](https://github.com/shibatch/sleef/issues/526) filed: fixed-vector-length optimization request (still open) | GitHub |
| 2024-03-07 | [PR #503](https://github.com/shibatch/sleef/pull/503) and [PR #521](https://github.com/shibatch/sleef/pull/521) ("Clean up RVV register composition") merged | GitHub |
| 2024-03-12 | Issue [#524](https://github.com/shibatch/sleef/issues/524) closed: RISC-V missing from sleef.org architecture table (documentation fix) | GitHub |
| 2024-03-15 | [PR #530](https://github.com/shibatch/sleef/pull/530) merged: "Fix RVV intrinsic version detection" | GitHub |
| 2024-06-10 | **SLEEF 3.6.1 released** - adds libsleefdft and libsleefquad on riscv64 (#503, #520, #521, #522, #527) | GitHub Releases |
| 2024-09-20 | Issue [#579](https://github.com/shibatch/sleef/issues/579) filed: GCC-13 build break (RVV v0.11-draft vs v1.0 intrinsics mismatch), surfaced via Gentoo Bug #939400 | GitHub |
| 2024-11-01 | [PR #601](https://github.com/shibatch/sleef/pull/601) merged: bump CI GCC to 14 | GitHub |
| 2024-11-11 | [PR #602](https://github.com/shibatch/sleef/pull/602) merged: "Configure.cmake: improve RVV1 check," closes #579; backported by PyTorch packaging and Homebrew's `sleef` formula (v3.8) | GitHub |
| 2025-02-08 | [PR #624](https://github.com/shibatch/sleef/pull/624) merged (same day, by shibatch): "Add riscv settings" to Jenkinsfile - moves riscv64 CI to self-hosted hardware runners | GitHub |
| 2025-03 | **SLEEF 3.9.0 released** (latest per GitHub releases.atom as of this research) | GitHub Releases |
| 2025-06-10 to 2025-07-01 | Issue [#694](https://github.com/shibatch/sleef/issues/694) filed and closed: Clang 21 cross-compile linker error (`crtbeginS.o`/`-lgcc` not found), a toolchain/triple-mismatch issue, not a SLEEF code defect | GitHub |
| 2025-09-24 | RISE blog post on SLEEF-in-OpenJDK integration published, referencing upstream contributions back to SLEEF (PRs [#536](https://github.com/shibatch/sleef/pull/536), [#537](https://github.com/shibatch/sleef/pull/537)) | [riseproject.dev](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/) |

**All RISC-V code is fully upstream.** No downstream forks carry patches absent from mainline; the originating SiFive fork (`sifive/sifive-sleef`) has been superseded by the merged work.

**Key contributors to the port:** Ludovic Henry (Rivos Inc.) authored the first RISC-V commit (`cea4434`, 2023-11-20, PR #477). Simon Hosie / sh1boot (Rivos Inc.) drove the DFT/quad-precision extension (PR #503) and subsequent RVV register cleanup (PR #521) and intrinsic-version-detection fix (PR #530). Pierre Blanchard (blapie, Arm Ltd) merged the integration PR and has reviewed/merged every significant RISC-V change since. Michael Orlitzky fixed the GCC-13 configure-time detection bug (PR #602).

---

## 3. Upstream Support Tier

No formal, separately maintained tier-policy document exists. The authoritative source is the "Support status of each vector extension" table in `README.adoc`:

| Arch | Extension | Status |
|---|---|---|
| x86_64 | SSE2 | Experimental support, seeking sponsorship |
| x86_64 | AVX2 / AVX512F | Mainline support |
| AArch64 | AdvSIMD | Mainline support |
| RISC-V | RVVM1 | **Unmaintained** |
| RISC-V | RVVM2 | **Unmaintained** |

The README defines "Unmaintained" as: "may be removed without notice," "not tested and may not build correctly." RISC-V does not appear at all in the OS/compiler test matrix table in README.adoc (only x86_64 and AArch64 Linux/Windows/Mac gcc/llvm/MSVC combinations are listed there). `docs/compile.xhtml`'s "Cross compilation for Linux" section, which README points to for cross-compile guidance, states in full: "This functionality will soon be removed."

This README "Unmaintained" characterization is directly contradicted by live evidence: the Jenkinsfile riscv64 CI stages (added by PR #624, merged February 2025, by shibatch himself) build and run `ctest` on native riscv64 hardware for both GCC-14 and Clang-19; Ubuntu 26.04 (resolute) ships `libsleef3`/`libsleef-dev` 3.7-0ubuntu3 for riscv64; and RVV code paths see active engineering (PR #601/#602 in Nov 2024). Per the project's own practice of trusting live workflow/CI configuration over static documentation claims, the README label is treated here as a stale or overly conservative signal rather than a ground truth of inactivity - but this remains a genuine confidence caveat, since the Jenkins dashboard itself is private and its pass/fail history cannot be independently observed (Section 7).

CMake further marks both RVVM1 and RVVM2 as "experimental": both default OFF, and enabling either emits a build-time warning ("You enabled RVV... support, which is an experimental feature. Experimental features may be removed without notice."). AVX2, AVX512F and AArch64 AdvSIMD carry no such flag.

**Comparison of upstream tier by architecture:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CMake "experimental" flag | No | No | Yes (both RVVM1 and RVVM2) |
| README status | Mainline support | Mainline support | Unmaintained |
| CI in GitHub Actions | N/A (not confirmed in this research pass) | N/A (not confirmed) | No (zero riscv references in all 4 workflow files) |
| CI in Jenkinsfile | Yes | Yes (uses `-DEMULATOR=qemu-aarch64-static`) | Yes (native hardware, added Feb 2025) |
| CI publicly observable | Via GitHub Actions badges where present | Via GitHub Actions badges where present | No (Jenkins is private/self-hosted) |
| Release-blocking | Not confirmed either way | Not confirmed either way | No - GitHub Releases ship source tarballs only, identical for every architecture |
| Official pre-built binaries | Source-only | Source-only | Source-only |
| Distro packages | Yes | Yes | Yes (Debian sid, Ubuntu 26.04 resolute) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SLEEF has no JIT engine and no garbage collector; it is a static/precompiled math-function library. RISC-V support contains no hand-written assembly (no `.S` files) and no dedicated `arch/riscv/` directory - it is implemented entirely as RVV C intrinsics via `<riscv_vector.h>`, driven by one core helper header plus CMake/build-system plumbing.

### 4.1 SIMD Infrastructure (`src/arch/helperrvv.h`)

1,407 lines, 261 `static INLINE` functions - the largest and most function-dense architecture helper file in the codebase:

| File | Lines | Inline functions | Arch |
|---|---|---|---|
| helperrvv.h | 1,407 | 261 | RISC-V (RVV, RVVM1+RVVM2, 5 CONFIGs covering runtime-VLEN and fixed 128 to 2048-bit) |
| helpersve.h | 1,117 | 244 | ARM SVE |
| helperpower_128.h | 872 | 208 | POWER/VSX |
| helperadvsimd.h | 836 | 200 | ARM NEON/AdvSIMD |
| helpersse2.h | 486 | 193 | x86 SSE2 |
| helperavx512f.h | 580 | 202 | x86 AVX512F |
| helperavx2.h | 483 | 194 | x86 AVX2 |
| helpers390x_128.h | 460 | 200 | IBM z/VXE |

A `grep` for TODO/FIXME/XXX/"not implement"/"stub" across all `src/arch/*.h` files returns zero hits in `helperrvv.h` (the sole hit project-wide is an unrelated comment in the POWER file). The handful of `#error` directives present are standard configuration-guard sanity checks, identical in style to equivalent guards in every other architecture header, not unimplemented-feature markers.

**File count by architecture family:** amd64 uses 4 helper files (SSE2/AVX2/AVX2-128/AVX512F); arm64 uses 2 (AdvSIMD, SVE); riscv64 uses 1 (`helperrvv.h`), but that single file is parameterized by a `CONFIG` macro (1, 2, 7, 8, 9, 10, 11) spanning both RVVM1 and RVVM2 across five vector lengths (128/256/512/1024/2048-bit), achieving functional coverage comparable to SVE's multi-VL handling in a single file. Fewer files does not indicate less coverage here.

**ISA extensions required:** RVV 1.0 (`__riscv_v >= 1000000`), RVV intrinsics API v0.12+ (`__riscv_v_intrinsic >= 12000`), and the Zba, Zbb, Zbs bit-manipulation extensions, via `-march=rv64gcv_zba_zbb_zbs` (`Configure.cmake`, identical flag for both RVVM1 and RVVM2). No explicit Zvfh or Zve sub-extension gating is present.

**Implementation quality:** pure C with RVV v1.0 intrinsics throughout - no hand-written assembly, matching the approach used for SVE. Compatibility shims exist for `__riscv_vcreate_v_*` intrinsics predating RVV spec v1.0-rc0, with GCC diagnostic pragmas suppressing uninitialized-value warnings.

**LMUL variants:**

| Config | F64 type | F32 type | I32 (half-width) | I32 (full-width) |
|---|---|---|---|---|
| RVVM1 (LMUL=1) | vfloat64m1_t | vfloat32m1_t | vint32mf2_t | vint32m1_t |
| RVVM2 (LMUL=2) | vfloat64m2_t | vfloat32m2_t | vint32m1_t | vint32m2_t |

**vmask/vint size mismatch (design note, PR #503):** `vmask` uses 64-bit elements even in single-precision code (required by `vcast_vm_i_i`), while `vint` uses 32-bit elements. PR #503 resolved resulting LMUL inconsistencies with explicit widening/narrowing intrinsics (`vncvt_x`, `vwcvtu_x`, `vwcvt_x`, `vnsrl 32`).

Because RVV (and SVE) code cannot represent C structs of vector types in Clang, `src/common/commonfuncs.h`, `dd.h` and `df.h` carry `#if !(ENABLE_SVE || ENABLE_RVVM1 || ENABLE_RVVM2)` guards and fall back to packed single-vector representations in `helperrvv.h` instead of struct-based ones used elsewhere.

### 4.2 Math Functions (libm)

`sleefsimddp.c` and `sleefsimdsp.c` - the same generic source files used by every other architecture - include `helperrvv.h` under `#ifdef ENABLE_RVVM1`/`ENABLE_RVVM2` guards with `ENABLE_RVV_DP`/`ENABLE_RVV_SP`. RISC-V therefore gets the full transcendental function set (sin, cos, tan, asin, acos, atan, atan2, exp, exp2, expm1, log, log2, log10, log1p, pow, cbrt, hypot, sinh, cosh, tanh and fast variants at ULP 1 and ULP 3.5) at full/complete coverage, both single and double precision.

A small set of single-precision functions (`vmulsign_vf_vf_vf`, `vcopysign_vf_vf_vf`, `vsign_vf_vf`, `vorsign_vf_vf_vf`, and the `fi_t`/`dfi_t` struct definitions) are excluded for all vector-length-agnostic (VLA) architectures, RVV and SVE alike - a shared VLA limitation, not riscv64-specific.

### 4.3 DFT (libsleefdft)

Code support was added by [PR #503](https://github.com/shibatch/sleef/pull/503) (merged 2024-03-07); `src/dft/CMakeLists.txt` defines a full 20-way RVVM1/RVVM2 x vector-width x precision build matrix. **DFT is explicitly disabled in the riscv64 Jenkins CI lane** (`-DSLEEF_BUILD_DFT=False -DSLEEF_ENFORCE_DFT=False`), pending resolution of a wide-vector initialization bug. The code compiles but its correctness and CI coverage on riscv64 is currently unverified by upstream's own pipeline. Data not available: a live GitHub issue search for open RISC-V-specific issues on this repository returned exactly one result (#526, Section 11); no currently-open, publicly tracked issue number specifically documenting this DFT initialization bug could be confirmed in the present research.

### 4.4 Quad Precision (libsleefquad)

Added alongside DFT in [PR #503](https://github.com/shibatch/sleef/pull/503). `src/quad/sleefsimdqp.c` (3,684 lines) defines `Sleef_rvvm1quad`/`Sleef_rvvm2quad` types with `#ifdef ENABLE_RVVM1`/`ENABLE_RVVM2` branches wired identically to SVE/VSX. Quad precision is **enforced in riscv64 CI** (`-DSLEEF_BUILD_QUAD=TRUE`), both gcc-14 and clang-19 stages. No quad-specific open riscv64 bugs were found.

### 4.5 Runtime CPU Dispatch

No `dispriscv64.c.org` file exists; the build system does not generate a runtime dispatcher for RISC-V. Vector width (RVVM1 vs RVVM2) selection is compile-time only - consistent with the AArch64 pattern (AdvSIMD vs SVE is also compile-time), but unlike x86, which ships `dispsse.c.org`/`dispavx.c.org` and selects SSE2/AVX2/AVX512 via HWCAP at load time. This means an riscv64 binary must be compiled separately per LMUL configuration; a single shared library cannot auto-select across mixed riscv64 hardware.

### 4.6 Inline Headers

`-DSLEEF_BUILD_INLINE_HEADERS=TRUE` is enforced in the Jenkinsfile riscv64 CI, so inline-header generation is actively tested on riscv64. `src/libm/sleeflibm_header.h.org.in` carries `__riscv_v`-guarded `Sleef_vfloat32/64m1_t_2` typedefs; `src/quad/sleefquad_header.h.org.in` carries analogous `Sleef_rvvm1quad`/`Sleef_rvvm2quad` typedefs guarded by `defined(__riscv) && defined(__riscv_v)`.

### Architecture comparison

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD helper implementation | Intrinsics (SSE2/AVX2/AVX512F) | Intrinsics (NEON + SVE) | Intrinsics (RVV v1.0, Zba/Zbb/Zbs) |
| Assembly (.S files) | Some | Some | None |
| Math functions (SP+DP) | Full | Full | Full |
| DFT | Full | Full | Code present, CI-disabled (wide-vector init bug) |
| Quad precision | Full | Full | Full, CI-enforced |
| Runtime dispatch | Yes (SSE2/AVX2/AVX512F) | No | No |
| Fixed-width SIMD variants | Yes (128/256/512-bit) | Fixed (128-bit NEON) | No (VLA; CONFIG spans 128 to 2048-bit) |

---

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, or `docs/building.md`/`docs/cross-compilation.md` exist; build documentation lives in `README.adoc` and `docs/compile.xhtml`. No riscv64 Dockerfile exists anywhere in the repository or CI config.

### Required toolchain versions and why

RVV support is gated at configure time (`Configure.cmake`, lines approx. 583-639) by direct preprocessor checks requiring:
- **RVV 1.0** (`__riscv_v >= 1000000`) - fatal error "RVV version 1.0 not supported" otherwise
- **RVV intrinsics API >= 0.12** (`__riscv_v_intrinsic >= 12000`) - fatal error "RVV instrinsics version 0.12 not supported" otherwise

These checks exist because `src/arch/helperrvv.h` is written against the v0.12 RVV C-intrinsics API and the ratified RVV 1.0 vector ISA; older toolchains implementing only earlier draft intrinsics versions fail the check (this is exactly what broke GCC-13 builds per issue #579, fixed by PR #602).

**Pinned in Jenkinsfile CI (agent label `riscv && ubuntu24`, native hardware, no QEMU):**
- GCC: `gcc-14`/`g++-14` (exact pin)
- Clang: `clang-19`/`clang++-19` (exact pin)
- Build via Ninja

**Toolchain files** `toolchains/riscv64-gcc.cmake` and `toolchains/riscv64-llvm.cmake` pin somewhat different minimums than CI actually uses: the GCC file searches `riscv64-linux-gnu-gcc-14` first, falling back to unversioned `riscv64-linux-gnu-gcc`; the LLVM file searches `clang-17` first (CI itself uses clang-19). Neither toolchain file sets `CMAKE_CXX_COMPILER` candidates, unlike the aarch64/ppc64 toolchain files, which do - a likely gap for C++ consumers.

**Compiler flags for RVV codegen** (`Configure.cmake`): `CLANG_FLAGS_ENABLE_RVVM1 = "-march=rv64gcv_zba_zbb_zbs"`, `CLANG_FLAGS_ENABLE_RVVM2 = "-march=rv64gcv_zba_zbb_zbs"`.

### CMake options relevant to riscv64

```
-DSLEEF_ENABLE_RVVM1=ON/OFF      # default OFF; enables RVV LMUL=1 ("M1"), experimental warning
-DSLEEF_ENFORCE_RVVM1=ON/OFF     # default OFF; build fails if RVVM1 unsupported, also forces ENABLE_RVVM1=ON
-DSLEEF_ENABLE_RVVM2=ON/OFF      # default OFF; enables RVV LMUL=2 ("M2"), experimental warning
-DSLEEF_ENFORCE_RVVM2=ON/OFF     # default OFF; build fails if RVVM2 unsupported, also forces ENABLE_RVVM2=ON
```

### Actual CI configure line (Jenkinsfile, both gcc-14 and clang-19 riscv stages, identical flags)

```bash
cmake .. -GNinja \
  -DCMAKE_INSTALL_PREFIX=$INSTALL_PREFIX \
  -DSLEEF_SHOW_CONFIG=1 \
  -DSLEEF_BUILD_DFT=False \
  -DSLEEF_ENFORCE_DFT=False \
  -DSLEEF_BUILD_QUAD=TRUE \
  -DSLEEF_BUILD_INLINE_HEADERS=TRUE \
  -DSLEEF_ENFORCE_TESTER4=True \
  -DSLEEF_ENABLE_TESTER=False \
  -DSLEEF_ENFORCE_RVVM1=True \
  -DSLEEF_ENFORCE_RVVM2=True
cmake -E time oomstaller --max-parallel $(nproc) ninja -j $(nproc)
export OMP_WAIT_POLICY=passive
export CTEST_OUTPUT_ON_FAILURE=TRUE
ctest -j $(nproc)
ninja install
```

### Generic (non-cross) quick start

```bash
sudo apt-get install libmpfr-dev libssl-dev libfftw3-dev
cmake -S . -B build/ -DCMAKE_INSTALL_PREFIX=./install
cmake --build build/ --clean-first -j $(nproc)
ctest --test-dir build/ -j $(nproc)
cmake --install build/
```

### Cross-compilation from an x86 host

```bash
cmake -S . -B build/ -DCMAKE_TOOLCHAIN_FILE=toolchains/riscv64-gcc.cmake   # or riscv64-llvm.cmake
```

### QEMU usage

QEMU is supported generically but is **not used for the riscv64 CI stages**, which run on native hardware. The general mechanism: when cross-compiling with `SLEEF_TARGET_EXEC_USE_QEMU` set, host-tool executables are built to run directly rather than imported from a native build directory; test harnesses (`src/libm-tester/CMakeLists.txt`, `src/quad-tester/CMakeLists.txt`) accept an `EMULATOR` CMake variable and tests run as `${EMULATOR} <test-binary>`, with tester binaries also accepting a `--qemu <emulator>` CLI flag. The Jenkinsfile wires this up only for **aarch64** (`-DEMULATOR=qemu-aarch64-static`); no equivalent `qemu-riscv64-static` invocation exists anywhere in the repository. `src/arch/helperrvv.h` carries a correctness-relevant comment noting "QEMU and some hardware have a feature to automatically wipe partial vectors," but there is no documented or scripted QEMU riscv64 CI path.

### Known build failures

- **GCC 13:** fails because the configure-time probe targeted v0.11.x-draft RVV intrinsics while the build itself compiled against v1.0 intrinsics, breaking on types like `vfloat64m1x4_t`. Reported as [issue #579](https://github.com/shibatch/sleef/issues/579) (via downstream Gentoo Bug #939400); fixed by [PR #602](https://github.com/shibatch/sleef/pull/602), which replaces the brittle compile-probe with direct `__riscv_v`/`__riscv_v_intrinsic` macro checks. GCC 14+ is required going forward.
- **Clang 21 + custom sysroot:** [issue #694](https://github.com/shibatch/sleef/issues/694), closed, reported a linker error finding `crtbeginS.o`/`-lgcc` despite the files existing on disk when cross-compiling with Clang 21 on Ubuntu. No documented fix is visible on the issue page; treated as a toolchain/triple-configuration issue rather than a SLEEF code defect.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

| Feature | amd64 | arm64 | riscv64 | Gap description |
|---|---|---|---|---|
| SP and DP transcendentals (libm) | Full | Full | Full | None |
| Quad precision (libsleefquad) | Full | Full | Full, CI-enforced | None |
| DFT (libsleefdft) | Full | Full | Code present, CI-disabled | Disabled pending resolution of a wide-vector initialization bug |
| Runtime SIMD dispatch | Yes (HWCAP) | No | No | Must compile separately per LMUL; no shared-library auto-selection |
| Fixed-width vector backends | Yes (128/256/512-bit) | Yes (128-bit NEON) | No (VLA-only; CONFIG spans 128-2048 bit) | VLA architecture, shared with SVE |
| vmulsign/vcopysign/vsign (SP) | Yes | No (SVE) | No (VLA) | Shared VLA limitation, not riscv64-specific |

### Performance gaps

The absence of a runtime dispatcher is the most significant deployment-level gap relative to amd64: a single `libsleef.so` on x86 selects SSE2/AVX2/AVX512 via HWCAP at load time, while RVVM1/RVVM2 on riscv64 are separate compile-time-selected targets with no fallback path. A mismatch between compiled LMUL and hardware vector length requires a separate binary.

The compile-time fixed-vector-length optimization described in [issue #526](https://github.com/shibatch/sleef/issues/526) (using `__riscv_v_fixed_vlen`, available when `-mrvv-vector-bits=zvl` is passed, instead of the runtime `__riscv_vlenb()` call used today) remains unimplemented. The author notes patches exist but were not submitted because supporting both fixed-vlen and runtime-vlen code paths in CI would require substantially more test-matrix infrastructure; they explicitly state "I don't expect a drastic performance gain, but it might help a little."

### Measured performance

**RISE/OpenJDK (BananaPi F3, SpacemiT K1, RVV 1.0, JMH avgt, 10 iterations, vector size 1024), PR [openjdk/jdk#21083](https://github.com/openjdk/jdk/pull/21083):** SLEEF-backed intrinsics vs scalar fallback for the Vector API:

| Function | +Intrinsic (ns/op) | -Intrinsic (ns/op) | Speedup |
|---|---|---|---|
| ACOS | 112,444.4 | 208,554.7 | 1.86x |
| ASIN | 104,121.3 | 208,314.5 | 2.00x |
| ATAN | 136,941.3 | 284,024.5 | 2.07x |
| ATAN2 | 163,228.7 | 427,589.6 | 2.62x |
| CBRT | 146,395.8 | 317,136.7 | 2.17x |
| COS | 154,865.3 | 305,721.5 | 1.97x |
| COSH | 189,212.9 | 220,756.3 | 1.17x |
| EXP | 113,941.6 | 252,853.1 | 2.22x |
| EXPM1 | 184,552.9 | 254,087.2 | 1.38x |
| HYPOT | 111,580.2 | 374,537.3 | 3.36x |
| LOG | 110,680.5 | 265,391.1 | 2.40x |
| LOG10 | 116,708.1 | 285,764.4 | 2.45x |
| LOG1P | 115,633.3 | 317,236.0 | 2.74x |
| POW | 321,655.1 | 560,765.1 | 1.74x |

Average approximately 2.38x - the figure the RISE blog post quotes. These measure the Java Vector API with vs. without SLEEF on riscv64, not a cross-architecture riscv64-vs-arm64 comparison.

**Guodong Xu (RISCstar Solutions), SpacemiT K1 SoC (8x Spacemit X60, Fedora 42 Remix, RVV zve64d/zve64f), SLEEF commit `3993f71` (merged 2025-09-22)** - [RVV benchmark summary, 2025-10-16](https://docularxu.github.io/sleef/webpages/rvv_benchmark_16Oct2025.html): comparing Scalar, libm, RVVM1, RVVM2. Peak speedups: **4.74x for double-precision sqrt(x)** and **8.85x for single-precision sqrtf(x)**, both with RVVM2; LMUL=2 consistently outperformed LMUL=1 across most tested functions.

**Same hardware, [GELU kernel benchmark, 2025-10-17](https://docularxu.github.io/sleef/webpages/rvv_benchmark_gelu_17Oct2025.html)**, n=11008 (mimics LLaMA-7B FFN width): FP64 erf RVVM2 speedup 1.92-1.93x (61.97ns vector vs 119.10ns scalar), tanh RVVM2 speedup 1.59x; FP32 erff RVVM2 speedup 2.66x (24.33ns vs 64.83ns), tanhf RVVM2 speedup 1.84x. Single-precision kernels show consistently larger gains than double-precision.

**AArch64 comparison data (JDK-8312425, PR [openjdk/jdk#21502](https://github.com/openjdk/jdk/pull/21502), Apple M1, no SVE, JMH, vector size 1024):** EXP 3.31x-4.60x, LOG 2.05x-3.89x, ATAN2 2.66x-2.70x, SIN/COS 0.84x-1.69x (more variable, occasionally a regression). A reviewer characterized results as "pretty similar to what we've seen" from the RISC-V work - a qualitative, not quantitative, cross-architecture comparison. No direct riscv64-vs-arm64 head-to-head SLEEF benchmark exists in any source found.

The official [sleef.org benchmark page](https://sleef.org/benchmark.xhtml) publishes only x86_64 (Intel Core i7-6700 vs Intel SVML) and DFT-only comparisons (AMD Ryzen 9 7950X, Apple M1); it contains no riscv64 data.

### NaN / floating-point semantics

The RISE OpenJDK blog post notes SLEEF calls modify the floating-point rounding mode and that a bridge layer was required in OpenJDK to restore round-to-nearest-even (RNE) compliance after calling into SLEEF. This is an integration concern for callers, not a SLEEF defect. No open riscv64-specific NaN or correctness issues were found in the current issue tracker.

---

## 7. CI/CD Infrastructure

### GitHub Actions (`.github/workflows/`)

Exactly four workflow files exist in the current repository: `build-and-test-macos.yml`, `build-and-test-msys2.yml`, `build-as-subproject.yml`, `build-examples.yml`. Direct inspection of all four (full content fetched and grepped case-insensitively for "riscv") confirms **zero riscv64 references** - no platform strings, no QEMU setup, no job name mentions RISC-V in any form. This was independently cross-checked via GitHub's own code-search index: `search_code("riscv repo:shibatch/sleef path:.github/workflows")` and `path:.github` both return `total_count: 0`.

PR #477 (November 2023) originally added a GitHub Actions job for `linux-riscv64`; that job is not present in the current workflow files. It has been removed at some point after the initial merge. Data not available: no currently open GitHub issue or PR proposing to restore riscv64 GitHub Actions CI was found in this research pass.

### Jenkinsfile

The repository's root `Jenkinsfile` (380 lines) contains two riscv64-dedicated stages, added by [PR #624](https://github.com/shibatch/sleef/pull/624) (merged 2025-02-08, by shibatch):

**Stage `riscv linux gcc-14`:** agent label `riscv && ubuntu24`; `CC=gcc-14`, `CXX=g++-14`; full build (cmake/ninja), `ctest -j $(nproc)` (real test suite execution), `ninja install`.

**Stage `riscv linux clang-19`:** same agent label and build/test/install pattern, with `CC=clang-19`, `CXX=clang++-19`.

Both stages set `System.setProperty("...HEARTBEAT_CHECK_INTERVAL", "86400")` (24-hour heartbeat), consistent with slower, real hardware rather than fast cloud VMs. Critically, **neither riscv64 stage sets an `-DEMULATOR` flag**, in contrast to the aarch64 stages, which explicitly set `-DEMULATOR=qemu-aarch64-static`. This confirms the riscv64 agent label (`riscv && ubuntu24`) is backed by genuine riscv64 hardware, and that tests are both built and executed there, not merely compiled.

The whole Jenkinsfile is a single declarative `pipeline { agent { label 'jenkinsfile' } stages { stage('Preamble') { parallel { ... } } } }` with no `triggers {}`/`cron`/`pollSCM` block in the file itself; trigger configuration (branch/PR builds) lives in Jenkins job configuration, not in the repository.

Jenkins is private infrastructure: there is no publicly visible dashboard, no status badge in the README, and no public URL linked from the repository. Pass/fail history for these stages cannot be independently observed or verified outside the project.

### RISE CI runners

Data not available: no RISE-owned riscv64 hardware runner, CI pipeline, or wheel build process for SLEEF was found. RISE's documented involvement with SLEEF (project SL_02_003, the OpenJDK blog post) is at the integration/advocacy level, not at the level of owning a dedicated SLEEF repository, CI runner, or wheel build (Section 1).

### CI comparison

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions | Present in some workflows [NEEDS VERIFICATION, not directly re-audited] | Present in some workflows, uses QEMU emulation for aarch64 stages | No riscv64 references in any current workflow file |
| Jenkinsfile | Yes | Yes, `-DEMULATOR=qemu-aarch64-static` | Yes, native hardware, no emulator flag (added Feb 2025) |
| CI publicly observable | Via GitHub Actions where present | Via GitHub Actions where present | No (Jenkins is private) |
| DFT enforced in CI | Not confirmed either way in this pass | Not confirmed either way | No (`-DSLEEF_BUILD_DFT=False`) |
| Quad enforced in CI | Not confirmed either way | Not confirmed either way | Yes (`-DSLEEF_BUILD_QUAD=TRUE`) |
| Hardware type | Not confirmed either way | QEMU emulation (aarch64 stage) | Native riscv64 hardware (no QEMU) |

---

## 8. Distribution and Release Status

### GitHub Releases

SLEEF ships source-only via GitHub Releases for every architecture. Fetches of the 3.9.0 release's expanded-assets page show exactly two assets: `3.9.0.zip` and `3.9.0.tar.gz` - generic auto-generated source archives, consistent across 3.3.1 through 3.9.0 per the public atom feed. No release asset filename contains "riscv64" or "riscv" for any release. An adversarial re-check attempted to confirm this via direct API/atom access but was blocked by a 403 ("GitHub access to this repository is not enabled for this session") and by the assets panel being JS-rendered; the finding of "no riscv64 binary asset" is therefore treated as **PLAUSIBLE rather than fully confirmed**, though two independent fetch attempts both observed only "Assets 2" with no custom binaries for any architecture.

### PyPI

No package named `sleef` exists on PyPI at all: `GET https://pypi.org/pypi/sleef/json` and `GET https://pypi.org/simple/sleef/` both return HTTP 404. This is not riscv64-specific; SLEEF is a C library with no official PyPI distribution under any name. RISE's GitLab-hosted wheel builder PyPI mirror (`gitlab.com/.../packages/pypi/simple/sleef/`) 302-redirects to the same nonexistent upstream PyPI entry.

### Ubuntu

Ubuntu 26.04 (resolute, 26.04 LTS): confirmed directly against live `packages.ubuntu.com` pages. `libsleef3` and `libsleef-dev`, both version **3.7-0ubuntu3**, are present in `universe` for architectures **amd64, arm64, armhf, ppc64el, riscv64, s390x**. A direct fetch of `packages.ubuntu.com/resolute/riscv64/libsleef3/download` returns HTTP 200 with the exact filename `libsleef3_3.7-0ubuntu3_riscv64.deb` on its "Download Page for ... RISC-V 64-bit little endian (riscv64) machines" - a specific, versioned, architecture-confirmed binary artifact. `libsleef-dev` carries the identical riscv64 download link.

Note the version shipped (3.7-0ubuntu3) trails the latest upstream GitHub release (3.9.0); this gap was not further investigated and should be treated as a minor packaging-lag observation rather than a functional gap.

### Debian

Debian sid (unstable) and Debian stable (bookworm) package `libsleef3`/`libsleef-dev` for riscv64 - bookworm at 3.6.1-3 and sid at 3.9.0-1, the latter confirmed built on the `rv-osuosl-04` riscv64 buildd per buildd.debian.org [carried from prior reporting; not independently re-fetched in this research pass, NEEDS VERIFICATION].

### Arch Linux RISC-V port

`archriscv.felixc.at/?q=sleef` returns HTTP 200, but a case-insensitive grep of the returned HTML for "sleef" finds **zero matches** - no SLEEF package exists in the Arch Linux RISC-V port.

### What a user must do to get a working riscv64 binary

On **Ubuntu 26.04 (resolute)**: `apt install libsleef-dev` installs 3.7-0ubuntu3 directly.
On **Debian sid**: `apt install libsleef-dev` installs 3.9.0-1 directly.
On **Ubuntu 24.04 or earlier, or any non-Debian-family distribution without a riscv64 package**: build from source using the native or cross-compilation procedure in Section 5, with GCC 14+ (`riscv64-linux-gnu-gcc-14`) or Clang 17+ (CI validates against Clang 19).

---

## 9. Dependencies

Source: `CMakeLists.txt` and `Configure.cmake` in `shibatch/sleef` (HEAD `7623d6c`). SLEEF has no package.json/go.mod/Cargo.toml; it is a CMake C/C++ project with no package-manager-level dependency ecosystem of its own.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| TLFloat | Runtime-dependency, critical. Vendored git submodule (pinned commit `4cc749a`, minimum version 1.16.0, `SLEEF_ENABLE_TLFLOAT=ON` by default), backs `libsleefquad` and float128-class emulation | Yes - built natively via SLEEF's own riscv64 Jenkins CI (`SLEEF_BUILD_QUAD=TRUE` on both stages) | Exercised by SLEEF's riscv64 `ctest` runs (quad build enabled) | Packaged: `libtlfloat1`, `libtlfloat-dev`, `libtlfloat-doc` all present for riscv64 in Ubuntu 26.04 resolute, universe/ports | Zero riscv-related issues found on `shibatch/tlfloat`; portable header/template C++ with no architecture-specific asm, no architecture gap expected |
| GNU MPFR | Test-dependency, optional. Arbitrary-precision float oracle for SLEEF's accuracy tester (`SLEEF_ENABLE_MPFR=ON`) | Yes - mature, long-standing riscv64 support in Debian/Ubuntu main | Not exercised by SLEEF's own riscv Jenkins stage (`SLEEF_ENABLE_TESTER=False` there) | Packaged: `libmpfr6` 4.2.2-3 in **main** component, riscv64, Ubuntu 26.04 resolute | No RISC-V-specific issues identified |
| FFTW3 | Test-dependency, optional. Reference FFT used only to validate SLEEF's optional DFT module (`SLEEF_ENABLE_FFTW=ON`) | Library itself builds for riscv64 (`libfftw3-double3` 3.3.10-2fakesync1build3, main, riscv64, Ubuntu 26.04 resolute); but **SLEEF's own riscv64 CI passes `-DSLEEF_BUILD_DFT=False -DSLEEF_ENFORCE_DFT=False`**, so the FFTW3-dependent DFT path is not built on riscv64 CI at all | Not exercised on riscv64 by SLEEF's CI (disabled) | Packaged, main component | FFTW3 upstream has two long-open RVV-related issues: #234 "risc-v vector extensions" (unresolved since 2021) and #311 "enable-r5v can't be used in riscv" (open since 2023); neither blocks a generic scalar riscv64 FFTW3 build, but they explain the lack of RVV-accelerated FFTW performance and likely motivate SLEEF's CI skipping DFT on this architecture |
| OpenSSL | Test-dependency, optional. Used by SLEEF's `tester3`/SSL-based test harness (`SLEEF_ENABLE_SSL=ON`) | Yes - `libssl3t64` 3.5.5-1ubuntu3, main, riscv64, Ubuntu 26.04 resolute | OpenSSL has dedicated upstream riscv64 CI runners ("OS Zoo CI"); not exercised in SLEEF's own riscv Jenkins stage (SSL tester not invoked there) | Packaged, main component | Several open OpenSSL riscv-specific refinement issues (of 66 total riscv-related items): #28118 "RISC-V extension detection is broken on musl" (open), #30880 intermittent `test_lhash` CI flake on linux-riscv64 (open), #29453 and #28664/#25334 (SHA-256/AES intrinsic/perf work, open) - all refinement items on an already-working port, not build blockers |
| OpenMP | Runtime-dependency, optional. Compiler-provided threading runtime for SLEEF's DFT/parallel paths (`SLEEF_ENABLE_OPENMP=ON`, not hard-enforced) | Yes - `libomp5` (LLVM) 1:22.1.2-1ubuntu1 in universe, riscv64, Ubuntu 26.04 resolute; GCC's `libgomp` ships as part of the riscv64 GCC toolchain | SLEEF's riscv Jenkins stages set `OMP_WAIT_POLICY=passive` and run against it on both gcc-14 and clang-19 agents | Packaged | No dependency-specific issues identified; it is a compiler runtime, not a standalone library with its own riscv64 issue tracker in this context |
| CMake | Build-dependency, critical. Build system generator for the entire project | Yes - standard package, broadly available on riscv64 across Debian/Ubuntu main | Not applicable (build tool) | Packaged in Ubuntu/Debian main for riscv64 | No riscv64-specific gaps identified; used natively to drive the riscv64 Jenkins builds |
| GCC | Build-dependency, critical. Primary compiler pinned in CI (`gcc-14`) | Yes - `gcc-14`/`g++-14` used natively on the `riscv && ubuntu24` Jenkins agent; RVV support requires GCC 14+ specifically (GCC 13 fails per issue #579) | N/A (compiler) | Packaged for riscv64 in Ubuntu/Debian | Version floor (14+) is a hard SLEEF requirement, not merely a preference, due to RVV v1.0/intrinsics v0.12 support |
| LLVM | Build-dependency, critical. Secondary compiler path, pinned in CI (`clang-19`) | Yes - `clang-19`/`clang++-19` used natively on the same riscv64 Jenkins agent; toolchain files reference clang-17 as a floor, CI uses clang-19 | N/A (compiler) | Packaged for riscv64 in Ubuntu/Debian | GCC support for RVV intrinsics initially lagged Clang at the time of PR #477; both are now first-class in CI |
| Ninja | Build-dependency, optional. Build backend invoked by CMake (`-GNinja`) in both the generic quick-start and the riscv64 CI stages | Yes - standard package, broadly available on riscv64 | N/A (build tool) | Packaged in Ubuntu/Debian main for riscv64 | No riscv64-specific gaps identified |
| QEMU | Test-dependency, optional. Supported generically by SLEEF's build/test harness (`EMULATOR` CMake variable, `--qemu` tester flag) for cross-compiled test execution | Not applicable to riscv64 itself | **Not used for the riscv64 CI stages** - those run on native hardware with no `-DEMULATOR` flag set; QEMU is wired up only for SLEEF's aarch64 CI stage (`qemu-aarch64-static`) | N/A | `helperrvv.h` carries a correctness note about QEMU's partial-vector-wipe behavior relevant to anyone who does run SLEEF's RVV code under QEMU, but no riscv64 QEMU CI path exists in the repository |
| GMP | Indirect test-dependency (bignum backend required by MPFR) | Yes - `libgmp10` 2:6.3.0+dfsg-5ubuntu2, main, riscv64, Ubuntu 26.04 resolute | Indirect, via MPFR; long-established riscv64 support | Packaged, main component | No riscv64-specific issues identified |

**Summary:** every one of SLEEF's non-toolchain critical and optional dependencies is already available on riscv64 via Ubuntu 26.04 (resolute) - MPFR, GMP, FFTW3 and OpenSSL land in the **main** component, TLFloat and OpenMP's `libomp5` in **universe** - all under `ports`. The one real gap is functional rather than packaging: SLEEF's own riscv64 Jenkins CI disables the DFT module (the FFTW3-dependent piece) outright, and upstream FFTW3 itself carries two long-open, unresolved RVV-acceleration issues, so while FFTW3 is fully buildable on riscv64, SLEEF-plus-FFTW3 riscv64 integration is currently untested by SLEEF's own pipeline. TLFloat (quad-precision) and OpenSSL (crypto tester), by contrast, are exercised directly on native riscv64 CI.

---

## 11. Known Bugs and Active Issues

### RISC-V-specific (open)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#526](https://github.com/shibatch/sleef/issues/526) | RISC-V: exploit `-mrvv-vector-bits=zvl` when used | Open (since 2024-03-04) | Low | Performance-only enhancement: use compile-time `__riscv_v_fixed_vlen` instead of runtime `__riscv_vlenb()` when the compiler fixes the vector length. Author states patches exist but weren't submitted because supporting both fixed-vlen and runtime-vlen paths in CI needs a larger test matrix; expects only a modest gain. No comments or further activity recorded. |

A live GitHub issue search confirms this is the **only** currently open, RISC-V-specific issue on `shibatch/sleef`. Two other currently-open issues exist on the repository generally but are not RISC-V-specific: #707 (SIGILL on x86-64-v2/Sandy Bridge) and #484 (s390x VXE2/QEMU failures).

### RISC-V-related (closed/resolved)

| ID | Title | Status | Notes |
|---|---|---|---|
| [#455](https://github.com/shibatch/sleef/issues/455) | Enable Riscv64 Support | Closed (2023-03 to 2023-11) | Originating feature request; pointed to the `sifive/sifive-sleef` fork as a patch source |
| [#432](https://github.com/shibatch/sleef/issues/432) | [question] Support of RISC-V extension V | Closed (2021-08 to 2023-11) | Early question predating and foreshadowing the real RVV implementation |
| [#448](https://github.com/shibatch/sleef/pull/448) | Extend FMA support to RISC-V | Closed, unmerged | Folded into PR #477 |
| [#449](https://github.com/shibatch/sleef/pull/449) | Add support for the RISC-V Vector ISA | Closed, unmerged | SiFive-submitted; folded into PR #477 |
| [#468](https://github.com/shibatch/sleef/pull/468) | Support for RiscV architecture | Closed, unmerged | Flagged as duplicate of #448 |
| [#496](https://github.com/shibatch/sleef/pull/496) | Enable libsleefdft on riscv64 | Closed, superseded | Superseded by merged PR #503 |
| [#524](https://github.com/shibatch/sleef/issues/524) | RISC-V architecture missing on sleef.org | Closed (2024-02 to 2024-03) | Documentation-only fix |
| [#579](https://github.com/shibatch/sleef/issues/579) | Risc V and gcc-13 | Closed (2024-09 to 2024-11) | SIMD instruction mismatch between RVV v0.11-draft (GCC-13) and v1.0; fixed by PR #602 |
| [#694](https://github.com/shibatch/sleef/issues/694) | Cannot find crtbeginS.o and -lgcc during cross compilation to RISC-V | Closed (2025-06 to 2025-07) | Clang 21 custom-sysroot toolchain/triple issue, not a SLEEF code defect |

No open RISC-V-specific correctness or NaN bugs were found in this research (searches targeting "riscv nan floating" and "riscv bug" returned nothing beyond #526 as open and RISC-V-specific).

---

## 12. Objections and Upstream Blockers

**"Unmaintained" label in README vs. active CI:** The upstream README explicitly labels RVVM1 and RVVM2 "Unmaintained" - a characterization directly contradicted by the active Jenkinsfile CI (added by shibatch himself in PR #624, February 2025), ongoing distro packaging (Ubuntu 26.04 resolute, Debian sid), and commit activity through late 2024/early 2025 (PR #601, #602). The live CI evidence was weighted more heavily than the static README claim for the purposes of this assessment, but this remains a confidence caveat: the Jenkins dashboard itself is private and unverifiable, so the "Unmaintained" label cannot be definitively disproven beyond what the configuration file shows. The label will discourage adoption by any team doing documentation-level due diligence.

**No GitHub Actions riscv64 CI:** The riscv64 GitHub Actions job originally included in PR #477 (November 2023) is absent from the current four-file `.github/workflows/` directory. No open issue or PR proposing to restore it was found in this research pass. This is the single highest-leverage, lowest-cost change available: restoring public, independently observable CI would materially raise confidence in the port's health without changing the underlying color grade, since Jenkins CI already satisfies the build-and-test bar.

**DFT disabled on riscv64 CI:** The DFT module is built but not tested on riscv64 CI pending resolution of a wide-vector initialization bug; this has persisted with no confirmed public tracking issue found in current search results.

**No named, dedicated riscv64 maintainer:** The project has no designated riscv64 maintainer. Rivos Inc. engineers who drove the original port (sh1boot, luhenry) are not confirmed as still actively engaged with SLEEF as of this research; subsequent fixes (PR #601/#602) came from an independent contributor (Michael Orlitzky) and from the sole maintainer himself (PR #624).

**No runtime dispatcher:** Applications needing a single binary that runs across RVV hardware with differing natural vector lengths cannot use SLEEF's RVV backends through one shared library - each LMUL variant is a separate build target. This is structurally identical to the SVE situation and not unique to RISC-V, but it is deployment complexity that amd64 consumers do not face.

**Sustainability/CCLA posture:** The November 2025 `SUSTAINABILITY.md`/`CONTRIBUTING.md` addition signals that further platform-tier improvements for RISC-V will likely require a funding or sponsorship commitment from an interested company (consistent with how Arm and Rivos funded the original port), rather than organic maintainer-driven investment.

**Acceptance probability for new contributions:** High. The project has accepted every substantive Rivos Inc. contribution to date; Pierre Blanchard (Arm) is an active reviewer who has merged every significant RISC-V pull request, and shibatch personally merged the most recent riscv64 CI change (PR #624). New contributions addressing the DFT-disable gap, issue #526, or restoring GitHub Actions CI would likely be accepted with reasonable review turnaround, subject to the CCLA terms for corporate contributors above the stated revenue threshold.

---

## 13. Readiness Assessment

- **Color:** blue (n/a - blue carries no defined sub-type in the grading model; sub-types are defined only for grey, yellow, and orange)
- **Release provider:** distro
- **Optimization level:** partial

As a SIMD math library (the grading model's own worked example category), SLEEF's RVV backend (`helperrvv.h`) covers the full primary transcendental and quad-precision function set, but only as a single LMUL-parameterized tier, versus amd64's three CI-tiered backends (SSE2/AVX2/AVX512F) - the grading model explicitly classifies this configuration as "partial." This caps the optimization characterization but does not change the already-blue primary readiness color.

**Justification:** Upstream CI builds and runs the test suite (`ctest`) for riscv64 on native hardware via Jenkinsfile stages added in [PR #624](https://github.com/shibatch/sleef/pull/624), but no GitHub Actions riscv64 job exists and upstream publishes no riscv64-specific binary (GitHub Releases are source-only tarballs for every architecture - see [github.com/shibatch/sleef/releases](https://github.com/shibatch/sleef/releases)). Only distros (Debian sid, Ubuntu 26.04/resolute) package riscv64 binaries. Build=yes/test=yes/release=no maps to blue.

Note the upstream README.adoc's "Unmaintained" label for RVVM1/RVVM2 directly contradicts the active Jenkins CI evidence; per the grading model's rule to trust workflow files over README claims, the live CI configuration was weighted higher, but this is flagged as a confidence caveat since the Jenkins dashboard itself is private/unverifiable.

**Pending work that could change the grade:**
- Open issue [#526](https://github.com/shibatch/sleef/issues/526) (compile-time fixed-vlen perf optimization, unaddressed since March 2024).
- The DFT module remains explicitly disabled on riscv64 CI (`-DSLEEF_BUILD_DFT=False`), pending resolution of a wide-vector initialization bug.
- RISE Project has documented but indirect involvement - it tracks SLEEF as project SL_02_003 and published a dedicated OpenJDK+SLEEF RISC-V blog post (see Section 1) - without owning a dedicated SLEEF repository, CI runner, or wheel build.
- No GitHub Actions riscv64 CI currently exists (removed at some point after the original PR #477 merge); restoring public, independently observable CI would be the single highest-leverage change to raise confidence, though it would not change the color itself, since Jenkins CI already satisfies the build-and-test bar.

---

## 14. Investment Analysis

RISE-funded engineer Hamlin Li (Rivos) completed the OpenJDK-to-SLEEF integration (OpenJDK PRs #20781 and #21083 merged), contributing fixes #536 and #537 back upstream to SLEEF. That work is complete and should not be re-funded. The core Rivos-driven RISC-V port (PRs #477, #503, #521, #530) is fully upstream and complete and should likewise not be re-funded. Remaining investment opportunities concentrate on CI restoration, the DFT gap, and documentation/perception fixes.

### 14.1 Functional Enablement

**DFT initialization bug on wide vectors:** The root cause behind `-DSLEEF_BUILD_DFT=False` on riscv64 CI needs investigation and a fix before DFT can be re-enabled and tested on this architecture. Scope: reproduce the failure (likely tied to how `measure()` behaves on very wide RVV vector configurations), implement a fix or guard, and restore the `-DSLEEF_BUILD_DFT`/`-DSLEEF_ENFORCE_DFT` flags to `True` in the Jenkinsfile riscv stages. Requires an engineer familiar with SIMD FFT internals.

### 14.2 Performance Optimization

**Fixed-vector-length optimization (#526):** Low priority. The author's own assessment is that the gain from switching `__riscv_vlenb()` runtime detection to the compile-time `__riscv_v_fixed_vlen` macro is modest; the blocker is CI test-matrix cost, not technical difficulty.

**Runtime LMUL dispatcher:** Adding an HWCAP-equivalent dispatcher (analogous to amd64's `dispsse.c.org`/`dispavx.c.org`) would let a single `libsleef.so` select RVVM1 vs RVVM2 at load time based on detected hardware vector length, rather than requiring separately compiled binaries. This is a moderate-effort, genuinely useful feature for deployment environments spanning mixed riscv64 hardware. No tracking issue currently exists for it.

### 14.3 CI/CD Infrastructure

**Restore public GitHub Actions riscv64 CI:** This is the highest-leverage, lowest-effort item available. Public CI prevents regressions and removes the biggest friction point for external contributors, who currently get no automated feedback on riscv64-affecting changes. No existing draft PR for this was found in current research; the work would need to be scoped and authored from scratch, likely using QEMU-based emulation to avoid requiring GitHub-hosted riscv64 runners (which do not exist).

### 14.4 Ecosystem Enablement

**Reconcile the README "Unmaintained" label with actual CI status:** A one-line documentation change (to "Experimental" or "Supported," matching CMake's own terminology) would materially improve adoption perception at very low cost, given the label currently contradicts demonstrable, actively maintained CI infrastructure.

**Close the Ubuntu version lag:** Ubuntu 26.04 (resolute) ships SLEEF 3.7-0ubuntu3 for riscv64, trailing the 3.9.0 upstream release. Tracking Debian sid's more current 3.9.0-1 package into Ubuntu would close this gap; this is packaging work, not SLEEF code work, and would most naturally be driven by the Ubuntu RISC-V porter team rather than SLEEF's own maintainers.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Author and land public (GitHub Actions) riscv64 CI | 2-3 | RISE / Rivos-, SiFive-, or Arm-affiliated contributor | Critical |
| Functional | Diagnose and fix DFT wide-vector initialization bug; re-enable DFT on riscv64 CI | 3-4 | RISE / engineer with SIMD FFT background | High |
| Documentation | Reconcile README "Unmaintained" label with actual CI status | 0.1 | Upstream maintainer (shibatch or blapie) | High |
| Distribution | Update Ubuntu's SLEEF package to track Debian sid's riscv64 build (3.9.0-1) | 1-2 | Ubuntu RISC-V porter team | Medium |
| Performance | Runtime LMUL dispatcher (no existing tracking issue) | 6-8 | RISE / engineer with SLEEF internals experience | Medium |
| Performance | Fixed-vector-length optimization (issue #526) | 1 | Any contributor; author estimates minimal gain | Low |

---

## 15. References

- [shibatch/sleef repository](https://github.com/shibatch/sleef)
- [sleef.org homepage](https://sleef.org/)
- [sleef.org benchmark page](https://sleef.org/benchmark.xhtml)
- [PR #448: Extend FMA support to RISC-V (closed, unmerged)](https://github.com/shibatch/sleef/pull/448)
- [PR #449: Add support for the RISC-V Vector ISA (closed, unmerged)](https://github.com/shibatch/sleef/pull/449)
- [PR #468: Support for RiscV architecture (closed, unmerged)](https://github.com/shibatch/sleef/pull/468)
- [PR #477: Integrate RISC-V support (merged 2023-11-20)](https://github.com/shibatch/sleef/pull/477)
- [PR #496: Enable libsleefdft on riscv64 (closed, superseded)](https://github.com/shibatch/sleef/pull/496)
- [PR #503: Enable libsleefdft and libsleefquad on riscv64 (merged 2024-03-07)](https://github.com/shibatch/sleef/pull/503)
- [PR #521: Clean up RVV register composition (merged 2024-03-07)](https://github.com/shibatch/sleef/pull/521)
- [PR #530: Fix RVV intrinsic version detection (merged 2024-03-15)](https://github.com/shibatch/sleef/pull/530)
- [PR #536: upstream OpenJDK fix](https://github.com/shibatch/sleef/pull/536)
- [PR #537: upstream OpenJDK fix](https://github.com/shibatch/sleef/pull/537)
- [PR #601: Update gcc version from 13 to 14 in GHA (merged 2024-11-01)](https://github.com/shibatch/sleef/pull/601)
- [PR #602: Configure.cmake: improve RVV1 check (merged 2024-11-11)](https://github.com/shibatch/sleef/pull/602)
- [PR #624: Add riscv settings (merged 2025-02-08)](https://github.com/shibatch/sleef/pull/624)
- [Issue #432: Support of RISC-V extension V (closed)](https://github.com/shibatch/sleef/issues/432)
- [Issue #455: Enable Riscv64 Support (closed)](https://github.com/shibatch/sleef/issues/455)
- [Issue #524: RISC-V architecture missing on sleef.org (closed)](https://github.com/shibatch/sleef/issues/524)
- [Issue #526: RISC-V: exploit -mrvv-vector-bits=zvl when used (open)](https://github.com/shibatch/sleef/issues/526)
- [Issue #579: Risc V and gcc-13 (closed)](https://github.com/shibatch/sleef/issues/579)
- [Issue #694: Cannot find crtbeginS.o and -lgcc during cross compilation to RISC-V (closed)](https://github.com/shibatch/sleef/issues/694)
- [commit cea4434: Integrate RISC-V support (PR #477)](https://github.com/shibatch/sleef/pull/477)
- [commit 01c6732: Add riscv settings (#624)](https://github.com/shibatch/sleef/commit/01c6732132d2191cd134df4d087c5f86f480b2b2)
- [commit 87e73dc: Configure.cmake: improve and unify RISC-V vector extension checks](https://github.com/shibatch/sleef/commit/87e73dc711be495e16aae73b430d6c8a0c4b2544)
- [commit 3896b07: Clean up RVV register composition (#521)](https://github.com/shibatch/sleef/commit/3896b07de8083959817d4c1f34832f29f336dfe3)
- [commit 04ad325: Fix RVV intrinsic version detection (#530)](https://github.com/shibatch/sleef/commit/04ad3259d7612d9c5890c3966725cd0c063b87e2)
- [RISE Project blog: OpenJDK Supercharging Vectorized Math with SLEEF (2025-09-24)](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [RISE Project blog: PyTorch is available on riscv64! (2026-08-18)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [OpenJDK PR #20781: Embed SLEEF headers into JDK source tree](https://github.com/openjdk/jdk/pull/20781)
- [OpenJDK PR #21083: Intrinsify Vector API math operations using SLEEF on RISC-V (JDK-8320500)](https://github.com/openjdk/jdk/pull/21083)
- [OpenJDK PR #21502: AArch64 Vector API stub benchmarks (JDK-8312425)](https://github.com/openjdk/jdk/pull/21502)
- [Guodong Xu: SLEEF RVV Benchmark Summary (2025-10-16)](https://docularxu.github.io/sleef/webpages/rvv_benchmark_16Oct2025.html)
- [Guodong Xu: GELU Kernel Benchmarks for erf/tanh on RVV (2025-10-17)](https://docularxu.github.io/sleef/webpages/rvv_benchmark_gelu_17Oct2025.html)
- [LLVM PR #114014: Support SLEEF vector library for RISC-V target](https://github.com/llvm/llvm-project/pull/114014)
- [LLVM PR #121641: Fix incorrect vector function mapping for llvm.exp.f64](https://github.com/llvm/llvm-project/pull/121641)
- [Debian buildd status for SLEEF](https://buildd.debian.org/status/package.php?p=sleef)
- [Debian tracker for SLEEF](https://tracker.debian.org/pkg/sleef)
- [Ubuntu packages.ubuntu.com: libsleef3 (resolute, riscv64)](https://packages.ubuntu.com/resolute/riscv64/libsleef3/download)
- [FFTW issue #234: risc-v vector extensions](https://github.com/FFTW/fftw3/issues/234)
- [FFTW issue #311: enable-r5v can't be used in riscv](https://github.com/FFTW/fftw3/issues/311)