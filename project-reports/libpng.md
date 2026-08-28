---
title: libpng
parent: Project Reports
categories:
  - multimedia
  - android
---

# libpng

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libpng<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libpng is the reference implementation of the PNG image format. It is a C library with no formal foundation, no governance board, and no tiered platform policy. The project is maintained by a single individual, Cosmin Truta (ctruta), who has held the maintainer role since 2018. Corporate contributors credited in the AUTHORS file include Google LLC, Samsung Group, SpacemiT Hangzhou Technology, Arm Holdings, Apple Inc., and Loongson Technology. No company holds a controlling stake.

The canonical active development repository is [pnggroup/libpng](https://github.com/pnggroup/libpng). The [glennrp/libpng](https://github.com/glennrp/libpng) repository is a read-only mirror. All RISC-V activity is in pnggroup/libpng. License: PNG Reference Library License version 2, a custom permissive license with no copyleft.

libpng is not a member of the RISE project and is not listed on riseproject.dev.

---

## 2. Port History and Upstreaming Timeline

RISC-V Vector (RVV) support was introduced into the libpng16 branch on pnggroup/libpng in May 2025 and has required sustained remediation through December 2025.

| Date | Event | Reference |
|---|---|---|
| Dec 2021 | PR #405 opened -- initial RVV support for RVV 0.7.1 (Allwinner D1). Status at time of research: open. | [pnggroup/libpng](https://github.com/pnggroup/libpng) |
| May 1, 2025 | First commit adding `riscv/` directory. Commit `cc5ee6b` "Add optimized RISC-V Vector functions" authored by Dragos Tiselice (Google), committed by ctruta. Same day: "Fix and improve the RISC-V Vector (RVV) implementation" by Filip Wasil (Samsung) and Manfred Schlaegl. | [pnggroup/libpng](https://github.com/pnggroup/libpng) |
| May 14, 2025 | [PR #666](https://github.com/pnggroup/libpng/pull/666) "RISC-V RVV extension" merged. 38 comments -- the most discussed RISC-V PR. Adds `riscv/riscv_init.c`, `riscv/filter_rvv_intrinsics.c`, `riscv/.editorconfig`. Authors: filipwasil (Samsung), dragostis (Google). Target release: v1.6.49. | [PR #666](https://github.com/pnggroup/libpng/pull/666) |
| May 26, 2025 | [PR #683](https://github.com/pnggroup/libpng/pull/683) merged -- autotools update for RISC-V. | [PR #683](https://github.com/pnggroup/libpng/pull/683) |
| Jun 12, 2025 | [PR #699](https://github.com/pnggroup/libpng/pull/699) merged -- fix autodetection of RVV support. Released in v1.6.49. | [PR #699](https://github.com/pnggroup/libpng/pull/699) |
| Jun 17, 2025 | [PR #702](https://github.com/pnggroup/libpng/pull/702) merged -- fix fallback when RVV revision < 1.0. | [PR #702](https://github.com/pnggroup/libpng/pull/702) |
| Jun 18, 2025 | [PR #704](https://github.com/pnggroup/libpng/pull/704) merged -- separate autotools and CMake build flows. Both #702 and #704 released in v1.6.50. | [PR #704](https://github.com/pnggroup/libpng/pull/704) |
| Jun 18, 2025 | [Issue #705](https://github.com/pnggroup/libpng/issues/705) opened -- configure.ac forcibly enables V extension, crashing non-vector builds. Closed. | [Issue #705](https://github.com/pnggroup/libpng/issues/705) |
| Jun 24, 2025 | [Issue #711](https://github.com/pnggroup/libpng/issues/711) opened -- crash on T-Head C920 (RVV 0.7.1) due to raw inline assembly targeting wrong RVV version. Closed. | [Issue #711](https://github.com/pnggroup/libpng/issues/711) |
| Jun 28, 2025 | [PR #713](https://github.com/pnggroup/libpng/pull/713) manually integrated by ctruta -- assembly-to-intrinsics conversion, configure.ac -march override fix. Released in v1.6.50. GitHub records it as closed rather than merged. | [PR #713](https://github.com/pnggroup/libpng/pull/713) |
| Jul 15, 2025 | [PR #721](https://github.com/pnggroup/libpng/pull/721) manually integrated by ctruta -- restricts RVV support to 1.0 only via `<riscv_vector.h>` compile-time detection. Released in v1.6.51. GitHub records it as closed. | [PR #721](https://github.com/pnggroup/libpng/pull/721) |
| Dec 4, 2025 | [Issue #769](https://github.com/pnggroup/libpng/issues/769) opened -- paeth3/paeth4 RVV produces wrong pixel values on Spacemit K1 with libpng 1.6.51, causing 52 OpenCV test failures. Closed. | [Issue #769](https://github.com/pnggroup/libpng/issues/769) |
| Dec 2, 2025 | [PR #763](https://github.com/pnggroup/libpng/pull/763) opened -- correctness and optimization fix; abandoned (targeted wrong branch). | [PR #763](https://github.com/pnggroup/libpng/pull/763) |
| Dec 2-4, 2025 | [PR #766](https://github.com/pnggroup/libpng/pull/766) opened -- Paeth filter correctness fix; absorbed directly into tree by ctruta without GitHub merge. Released around v1.6.52. | [PR #766](https://github.com/pnggroup/libpng/pull/766) |
| Dec 5, 2025 | [PR #771](https://github.com/pnggroup/libpng/pull/771) merged -- removes reference to non-existent intrinsic `__riscv_vaaddu_wx_u8m1`, which caused build failure when `-march=rv64gv` was passed. Released in v1.6.53. | [PR #771](https://github.com/pnggroup/libpng/pull/771) |

The RISC-V port has required 8 PRs and 4 issues from initial merge through December 2025. All 4 issues are now closed. No open RISC-V-specific issues remain in the repository.

---

## 3. Upstream Support Tier

libpng has no formal tiered platform policy. Architecture-specific optimizations are structured as optional subdirectories (`arm/`, `riscv/`, `intel/`, etc.) compiled conditionally. The build system defaults RVV to **off** (unlike ARM NEON, Intel SSE, and PowerPC VSX, which default to on).

The CI pipeline runs only on x86-64 (Linux, macOS) and ARM64 (Windows). No RISC-V CI is automated. All RISC-V validation has been performed manually on contributor hardware (Spacemit K1, Banana Pi F3, StarFive JH7110) and ad-hoc QEMU runs by the maintainer. The maintainer explicitly acknowledged forgetting to apply `-march=rv64gv` during review of PR #766, which allowed a non-existent intrinsic to reach the mainline, requiring a follow-up fix in PR #771.

There is no documented SLA or support commitment for RISC-V. The work has been driven entirely by external contributors from Google, Samsung, SpacemiT, and the OpenCV team.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source File Inventory

| File | Purpose | Status |
|---|---|---|
| `riscv/filter_rvv_intrinsics.c` | RVV C intrinsics implementation of all 7 PNG read filter reconstruction functions | Complete implementation |
| `riscv/riscv_init.c` | Runtime dispatch -- assigns RVV filter function pointers based on bpp | Complete implementation |
| `riscv/.editorconfig` | Editor style config only; contains a FIXME note on style, not code | Non-code |

No `.S` assembly files exist. No JIT backend. No Zba/Zbb/Zbc/Zbs bit-manipulation usage. The only ISA used is RVV 1.0 via C intrinsics from `<riscv_vector.h>`.

### 4.2 Filter Function Coverage

The `riscv/filter_rvv_intrinsics.c` implements the following functions:

- `png_read_filter_row_up_rvv` -- Up filter using `vuint8m8` wide vector loads
- `png_read_filter_row_sub3_rvv` and `sub4_rvv` -- Sub filter for 3 bpp and 4 bpp
- `png_read_filter_row_avg3_rvv` and `avg4_rvv` -- Average filter using `__riscv_vaaddu_vv_u8m1`
- `png_read_filter_row_paeth3_rvv` and `paeth4_rvv` -- Paeth predictor using widened subtraction and min comparisons

All 7 variants are implemented. Compilation guards: `PNG_RISCV_RVV_IMPLEMENTATION == 1` and `PNG_READ_SUPPORTED`. Vector types used: `vuint8m8_t`, `vuint8m1_t`, `vuint16m2_t`.

### 4.3 Runtime Dispatch

`riscv/riscv_init.c` exports `png_init_filter_functions_rvv(png_structp pp, unsigned int bpp)`. It always assigns the Up filter, and assigns sub/avg/paeth variants conditionally on bpp==3 or bpp==4. The function is declared in `pngpriv.h` and called when `PNG_RISCV_RVV_OPT > 0 && __riscv_v >= 1000000`.

There is no runtime CPU feature detection (no `check.h` equivalent for RISC-V). Feature presence is determined at compile time by the availability of `<riscv_vector.h>`. A binary compiled with RVV enabled cannot fall back at runtime on a non-vector RISC-V CPU.

### 4.4 Scope Limitations

The RISC-V port covers the **read path only** (filter reconstruction for decompressed scanlines). There is no write-path SIMD. There is no palette expansion optimization (absent for all architectures except ARM, so this is not a RISC-V-specific gap).

### 4.5 Architecture Comparison

| Arch | Source files | Filter coverage | Runtime detection | Hand asm | Palette |
|---|---|---|---|---|---|
| riscv | 2 | 7 of 7 | No (compile-time only) | No | No |
| intel | 2 | 6 of 7 (no Up) | Yes | No | No |
| loongarch | 2 | 7 of 7 | No | No | No |
| powerpc | 2 | 7 of 7 | Yes | No | No |
| arm | 4 | 7 of 7 | Yes | Yes | Yes |
| mips | 3 | 7 of 7 | Yes | Yes | No |

On filter coverage, RISC-V matches or exceeds Intel (which omits the Up filter). RISC-V is materially behind ARM and MIPS in terms of runtime detection, hand-tuned assembly, and overall code volume. ARM is approximately 3x the line count for filter code alone and has the most complete and battle-tested SIMD port in the codebase.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake

Architecture is matched by the regex `^(riscv)` against `CMAKE_SYSTEM_PROCESSOR`. `PNG_RISCV_RVV` defaults to **off**. When enabled, CMake runs a compile-time probe of `<riscv_vector.h>` with specific RVV 1.0 intrinsics (`__riscv_vreinterpret_v_u64m1_u8m1`, `__riscv_vle64_v_u64m1`, `__riscv_vle32_v_f32m1`, `__riscv_vfmv_f_s_f32m1_f32`). If the compiler cannot compile this probe, CMake aborts with `FATAL_ERROR`. CMake minimum required version: 3.14.

Cross-compilation command (RVV disabled, safe for all riscv64 targets):

```sh
cmake /path/to/libpng \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_AR=riscv64-linux-gnu-ar \
  -DCMAKE_RANLIB=riscv64-linux-gnu-ranlib \
  -DPNG_RISCV_RVV=off \
  -DCMAKE_BUILD_TYPE=Release
```

### 5.2 Autoconf/configure

```sh
CC=riscv64-linux-gnu-gcc \
AR=riscv64-linux-gnu-ar \
RANLIB=riscv64-linux-gnu-ranlib \
./configure \
  --host=riscv64-linux-gnu \
  --prefix=/usr/local \
  --enable-riscv-rvv=no
```

To enable RVV: `--enable-riscv-rvv=yes`. To disable all hardware optimizations: `--disable-hardware-optimizations`.

### 5.3 CI Cross-Compilation Environment File

`ci/targets/linux/ci_env.riscv64-linux-gnu.sh` exists in the repository. It sets `CI_TARGET_ARCH=riscv64`, `CI_TARGET_SYSTEM=linux`, `CI_TARGET_ABI=gnu`, and configures `CC=riscv64-linux-gnu-gcc`, `AR=riscv64-linux-gnu-ar`, `RANLIB=riscv64-linux-gnu-ranlib`, plus matching CMake cross-compile variables. No GitHub Actions workflow or other automated CI pipeline sources this file. It is a developer convenience script, not a CI integration.

### 5.4 Toolchain Version Requirements

No explicit minimum compiler version is declared. For RVV support, the compiler must compile `<riscv_vector.h>` with RVV 1.0 intrinsics. In practice: GCC >= 13 (first release with complete RVV 1.0 API; GCC 12 has partial support); Clang/LLVM >= 14. For non-RVV builds: any modern `riscv64-linux-gnu-gcc` from the Debian/Ubuntu cross toolchain package is sufficient.

### 5.5 QEMU

The repository contains no QEMU configuration or QEMU-specific scripts. The CI scripts do not reference QEMU. No `QEMU_` or emulator variables are set in the riscv64 CI environment file. The maintainer has used QEMU manually (noted in PR #766 discussion) but this is not automated.

### 5.6 Missing Build Infrastructure

| Item | Status |
|---|---|
| `cmake/toolchain-riscv64.cmake` | Not present |
| `cmake/riscv64.cmake` | Not present |
| `Dockerfile.riscv64` | Not present |
| `docs/cross-compilation.md` | Not present |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 | arm64 | amd64 |
|---|---|---|---|
| Read filter SIMD (all 7 variants) | Yes (RVV 1.0 intrinsics) | Yes (NEON intrinsics + asm) | Partial (SSE2, 6 of 7 -- no Up filter) |
| Write filter SIMD | No | No | No |
| Palette expansion SIMD | No | Yes | No |
| Runtime CPU feature detection | No | Yes | Yes |
| Hand-written assembly fallback | No | Yes | No |
| Default-on in build system | No | Yes | Yes |
| Automated CI coverage | No | Partial (Windows ARM64 only) | Yes (Linux x86-64) |

The primary functional gap versus arm64 is the absence of runtime CPU detection. On arm64 and amd64, the build can produce a binary that falls back to scalar code on hardware lacking the extension. On riscv64, if RVV is compiled in, it will execute on any riscv64 hardware regardless of whether that hardware has the V extension -- a binary compiled for RVV 1.0 will crash on pre-1.0 hardware (demonstrated by the C920 crash in issue #711). The only mitigation is to not compile with RVV on non-uniform hardware fleets.

---

## 7. CI/CD Infrastructure

**No automated riscv64 CI exists.** This is confirmed by direct inspection of all CI configuration files.

| CI file | Architectures covered | riscv64 present |
|---|---|---|
| `.github/workflows/lint.yml` | ubuntu-latest (x86-64) | No |
| `.github/workflows/verify-linux.yml` | ubuntu-latest (x86-64) | No |
| `.github/workflows/verify-macos.yml` | macos-latest (x86-64 / arm64) | No |
| `.github/workflows/verify-windows.yml` | windows-2025 (x64), windows-11-arm (ARM64) | No |
| `.appveyor.yml` | x86, x64, arm64, i686, x86_64 (Windows) | No |
| `.gitlab-ci.yml` | Not present | N/A |
| `.cirrus.yml` | Not present | N/A |

The string "riscv" does not appear in any workflow file. The `verify-linux.yml` workflow runs a native x86-64 build with address and undefined-behavior sanitizers only.

The consequence is operational: the non-existent intrinsic `__riscv_vaaddu_wx_u8m1` in PR #766 (December 2025) went undetected through review because the maintainer did not apply `-march=rv64gv` to his local test run. PR #771 was required to fix the resulting build failure. Automated riscv64 CI via QEMU cross-compilation would have caught this before merge.

---

## 8. Distribution and Release Status

**Upstream GitHub releases are source-only.** glennrp/libpng has no GitHub release assets at all. pnggroup/libpng distributes source tarballs only. No prebuilt binaries are distributed by upstream.

**Debian:** libpng1.6 version 1.6.58-1 is built and installed for riscv64 in Debian sid. Built on buildd `rv-manda-02`. All architectures including riscv64 show status "Installed." Source: [Debian buildd status](https://buildd.debian.org/status/package.php?p=libpng1.6&suite=sid).

**Ubuntu:** libpng16-16t64, libpng-dev, and libpng-tools are available for riscv64 in Ubuntu 24.04 Noble (version 1.6.43-5ubuntu0.6) and Ubuntu 26.04 Resolute (version 1.6.57-1). riscv64 appears in the "ports" tier (ports.ubuntu.com) rather than the main archive, but official packages exist. Source: [packages.ubuntu.com](https://packages.ubuntu.com).

**Arch Linux RISC-V (archriscv.felixc.at):** The package tracker did not return confirming data through the research tooling. The project policy states all non-blacklisted packages from Arch Linux [core] and [extra] are ported, and libpng is a fundamental [extra] package. Direct file URL probing for expected filenames returned 404. [NEEDS VERIFICATION]

**PyPI:** No libpng package exists on PyPI (HTTP 404). Not a relevant channel for this C library.

**RISE wheel builder (GitLab):** Redirected to PyPI simple index, which returned 404. Not applicable.

**Current stable version:** 1.6.58 as of research date. The December 2025 correctness fixes (paeth filter, missing intrinsic) are present in 1.6.53 and later. Debian sid (1.6.58-1) and Ubuntu Resolute (1.6.57-1) postdate these fixes. Ubuntu Noble (1.6.43-5ubuntu0.6) [NEEDS VERIFICATION -- the version number 1.6.43 predates the RVV port entirely, which suggests Ubuntu Noble ships libpng without RVV enabled or with a backport; the security patch suffix `ubuntu0.6` indicates a distro-maintained version].

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Open Blockers |
|---|---|---|---|---|---|
| zlib | DEFLATE compression/decompression -- required for all PNG encode/decode | Passing -- no SIMD paths, portable C compiles cleanly | Unknown -- no riscv64 CI upstream; no test failures reported; GitHub issues search for "riscv64" returns 0 results | Shipping -- v1.3.1 (Feb 2024) is portable; all Linux distros ship riscv64 packages | None |
| zlib-ng | Drop-in zlib replacement used by some distros as zlib provider; includes SIMD acceleration | Passing -- riscv64 build fixed in v2.2.x (Feb 2026, PRs #2148 and #2152 fixed `crc32_riscv64_zbc` undeclared symbol and no-RVV fallback build failure) | Passing -- riscv64 included in CI matrix as of Jan 2026; cross-compilation tested | Shipping -- active riscv64 maintenance; fixes landed in v2.2.x | None |
| libm (glibc) | `pow()` for PNG gamma correction on Unix; conditional dependency | Passing | Passing | Shipping | None |
| RVV intrinsics (`<riscv_vector.h>`) | SIMD filter row acceleration (optional) | Passing with GCC >= 13 or Clang >= 14 and appropriate -march flag | Partial -- no automated riscv64 CI in libpng; validated on Spacemit K1 by asmorkalov (OpenCV) in PR #771 | Released in v1.6.53 (Dec 2025) after intrinsic bug fix | No open blockers; CI gap remains |

---

## 10. Ecosystem Status

**RISE involvement:** None. No libpng entry appears on riseproject.dev, in the RISE wheel builder package list (76 packages, libpng absent), in any of the 27 RISE blog posts (May 2024 through June 2026), or in any GitHub repository or code in the riseproject-dev organization (API search returns 0 results).

**OpenCV integration:** asmorkalov (Alexander Smorkalov, OpenCV.ai) filed [issue #769](https://github.com/pnggroup/libpng/issues/769) and authored [PR #771](https://github.com/pnggroup/libpng/pull/771) after the paeth correctness bug caused 52 OpenCV image I/O test failures on Spacemit K1. libpng 1.6.53 was validated as correct within OpenCV (confirmed in OpenCV PR opencv/opencv#28111 and issue opencv/opencv#28126). The OpenCV project is an active riscv64 consumer of libpng and has effectively served as downstream CI.

**Downstream hardware:**
- Spacemit K1 (SpacemiT, VLEN=256-bit): active validation platform for libpng RVV
- Banana Pi F3 (also K1): used in PR #704 validation
- StarFive JH7110 (no vector extension): exposed the autodetection bug in PR #702
- T-Head C920 (Alibaba/DAMO Academy, RVV 0.7.1): confirmed crash behavior in issue #711; also reported as Gentoo bug #958203

**Performance data:** The only quantitative data from a 2021-2022 bachelor's thesis by Manfred Schlaegl (JKU Linz) on an Allwinner D1/Xuantie C906 board (RVV Draft 0.7.1) shows speedups over scalar ranging from 1.13x (paeth3) to 5.43x (up3/up4). These numbers predate the RVV 1.0 rewrite and the Paeth correctness fix; they do not reflect current performance on 1.0-compliant hardware. From PR #763 (chLFF, Spacemit K1 MUSEBOOK, VLEN=256-bit, GCC 14, Dec 2025): the `vaaddu` optimization achieved approximately 14% speedup over scalar for the paeth filter after the correctness fix. No riscv64-vs-arm64 or riscv64-vs-amd64 comparative benchmark data exists in any source consulted.

---

## 11. Known Bugs and Active Issues

As of the research date, **no open RISC-V-specific issues exist** in pnggroup/libpng. The 12 currently open issues are general correctness or security bugs not specific to RISC-V architecture.

The closed RISC-V bug history is summarized below:

| Issue/PR | Summary | Root Cause | Resolution |
|---|---|---|---|
| [Issue #705](https://github.com/pnggroup/libpng/issues/705) | configure.ac prepended `-march=rc64gv1p0` to compile tests, forcibly enabling V extension, causing compiler crashes on `-march=rv64g` and build failures on `-march=rv64id` | configure.ac line ~720 overwrote CFLAGS for compiler probe | Fixed in PR #713 commit `d9f649a` |
| [Issue #711](https://github.com/pnggroup/libpng/issues/711) | Runtime crash on T-Head C920 (RVV 0.7.1); raw `asm volatile` targeting different RVV version; no compile-time version guard | Raw inline assembly with no ISA version check | Fixed in PR #713 (asm to intrinsics) and PR #721 (compile-time `__riscv_v >= 1000000` guard) |
| [Issue #769](https://github.com/pnggroup/libpng/issues/769) | paeth3/paeth4 RVV produced wrong pixel values on Spacemit K1 with libpng 1.6.51; 52 OpenCV image I/O test failures | Mask-agnostic (`_m`) intrinsics gave no guarantees on masked-off elements; broken absolute-value computation in vectorized Paeth predictor | Fixed in PR #766 (absorbed directly by ctruta); `_m` replaced with `_mu` (mask-undisturbed); abs computation corrected using `rsub zero + minu` pattern |
| [PR #771](https://github.com/pnggroup/libpng/pull/771) | Build failure with `-march=rv64gv`; intrinsic `__riscv_vaaddu_wx_u8m1` does not exist | Non-existent intrinsic introduced by PR #766 manual integration; reviewer did not apply the V march flag during review | Replaced with correct intrinsic; fix validated on Spacemit K1 via OpenCV; released in libpng 1.6.53 |

The December 2025 correctness regression (issue #769, PR #771) is the most significant: a build that appeared to compile and link correctly produced silently wrong output on a real riscv64 board. The bug was caught only because the OpenCV team ran a comprehensive image test suite on physical hardware.

---

## 12. Objections and Upstream Blockers

**No active blockers.** All RISC-V issues are closed. The maintainer (ctruta) is supportive of RISC-V work and personally shepherded all merges.

**Reviewer friction (resolved):** John Bowler (jbowler), a long-standing contributor, expressed skepticism during PR #666 review, citing concerns about documentation quality (links to wikis and Google Drive documents) and macro discipline (`-Wundef`). His objections were technical, not philosophical. All were resolved before merge. He subsequently reviewed and approved PR #713 and PR #721, providing detailed feedback that improved the implementation.

**Structural risks (not blockers):**

1. Single maintainer: all merge decisions pass through ctruta. The review incident in PR #771 (maintainer forgot to apply `-march=rv64gv` during review) shows that the absence of automated CI amplifies single-point-of-failure risk for RISC-V code quality.

2. No runtime detection: the compile-time-only RVV enablement strategy means libpng cannot produce a universal riscv64 binary that works correctly on both vector and non-vector hardware. Any fleet with mixed hardware must either disable RVV system-wide or ship separate binaries.

3. RVV off by default: unlike ARM, Intel, and PowerPC, RISC-V RVV is not enabled in the default build. Distribution packages may or may not enable it depending on their build configuration. The Ubuntu Noble version number (1.6.43) predates the RVV port entirely, suggesting RVV may not be active in that distribution's libpng builds.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The RISC-V port is functionally complete for the read path. All 7 PNG filter variants are implemented and correct as of v1.6.53. No write-path SIMD exists, but this is a gap shared with arm64 and amd64. The remaining functional gap relative to arm64 is the absence of runtime CPU feature detection, which constrains deployment on heterogeneous hardware.

### 13.2 Performance Optimization

The only available performance figure is a 14% speedup over scalar for the paeth filter on Spacemit K1 (VLEN=256-bit, Dec 2025). No throughput figures in MB/s, no cross-architecture comparisons, and no formal benchmark results from pngtest or any external harness are available in any source consulted. The 2021-2022 thesis data (RVV 0.7.1, Allwinner D1) reports 1.13x-5.43x across filter types, but this is not applicable to current RVV 1.0 code on current hardware.

Performance on VLEN=128-bit (typical for many shipping riscv64 cores) is unknown -- no benchmark data was found for this configuration. The Spacemit K1 is VLEN=256-bit.

### 13.3 CI/CD Infrastructure

There is no automated riscv64 CI. The ci_env.riscv64-linux-gnu.sh environment file exists and is correct, but no GitHub Actions workflow executes it. Adding QEMU-based riscv64 cross-compilation to the verify-linux.yml workflow is the highest-leverage near-term infrastructure investment. The December 2025 correctness regression would have been caught by such infrastructure.

### 13.4 Ecosystem Enablement

libpng is a transitive dependency of a large fraction of the Linux userspace image processing stack (OpenCV, ImageMagick, Qt, browsers, etc.). The OpenCV team has already demonstrated downstream riscv64 integration testing. Investing in upstream libpng riscv64 CI produces leverage across all of these consumers.

Distribution packages in Debian and Ubuntu already ship riscv64 binaries. The primary gap is not availability but correctness assurance -- the last correctness bug was found and fixed only because the OpenCV team ran physical hardware tests.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU-based riscv64 cross-compile and test lane to verify-linux.yml | 1 | Upstream (with external contributor patch) | Critical |
| CI/CD | Wire ci_env.riscv64-linux-gnu.sh into the GitHub Actions matrix | 0.5 | Upstream | Critical |
| Functional | Implement runtime RVV feature detection (check.h equivalent) to allow safe universal binaries | 3 | External contributor | High |
| Performance | Benchmark RVV filter implementations on VLEN=128-bit hardware (produce MB/s figures) | 2 | External contributor | High |
| Performance | Benchmark RVV vs scalar vs auto-vectorization on multiple riscv64 cores | 2 | External contributor | Medium |
| Functional | Enable RVV by default in CMake/configure when compiler probe passes | 0.5 | Upstream | Medium |
| Functional | Add write-path (encoder) SIMD for riscv64 | 6 | External contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [pnggroup/libpng (canonical upstream)](https://github.com/pnggroup/libpng)
- [glennrp/libpng (read-only mirror)](https://github.com/glennrp/libpng)
- [Issue #698 -- RVV autodetection flaw (linked from PR #699)](https://github.com/pnggroup/libpng/issues/698)
- [Issue #705 -- configure.ac overrides build environment](https://github.com/pnggroup/libpng/issues/705)
- [Issue #711 -- crashes on C920 core](https://github.com/pnggroup/libpng/issues/711)
- [Issue #769 -- paeth3/paeth4 RVV inaccurate results](https://github.com/pnggroup/libpng/issues/769)
- [PR #666 -- RISC-V RVV extension (initial port)](https://github.com/pnggroup/libpng/pull/666)
- [PR #699 -- fix autodetection of RVV support](https://github.com/pnggroup/libpng/pull/699)
- [PR #702 -- fix fallback when RVV rev. < 1.0](https://github.com/pnggroup/libpng/pull/702)
- [PR #704 -- separated build flow for autotools and cmake](https://github.com/pnggroup/libpng/pull/704)
- [PR #713 -- libpng16 build fixes for riscv (assembly to intrinsics)](https://github.com/pnggroup/libpng/pull/713)
- [PR #721 -- RISCV support only RVV 1.0](https://github.com/pnggroup/libpng/pull/721)
- [PR #763 -- correct and optimize RVV implementations (abandoned)](https://github.com/pnggroup/libpng/pull/763)
- [PR #766 -- fix and improve RVV png_read_filter (absorbed directly)](https://github.com/pnggroup/libpng/pull/766)
- [PR #771 -- fixed RISC-V RVV code build](https://github.com/pnggroup/libpng/pull/771)
- [Debian buildd status -- libpng1.6 riscv64](https://buildd.debian.org/status/package.php?p=libpng1.6&suite=sid)
- [Ubuntu packages -- libpng Noble](https://packages.ubuntu.com/search?keywords=libpng&suite=noble&searchon=names&section=all)
- [OpenCV issue opencv/opencv#28126](https://github.com/opencv/opencv/issues/28126)
- [OpenCV PR opencv/opencv#28111](https://github.com/opencv/opencv/pull/28111)
- [mschlaegl/libpng_rvv-doc -- JKU Linz bachelor thesis benchmark data](https://github.com/mschlaegl/libpng_rvv-doc)