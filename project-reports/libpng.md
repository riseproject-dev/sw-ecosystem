---
title: libpng
parent: Project Reports
color: yellow
dependencies:
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libpng" %}

# libpng

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libpng<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libpng is the reference implementation of the PNG image format, written in C. It has no formal foundation, no governance board, and no documented tiered platform policy (no MAINTAINERS, CODEOWNERS, PLATFORMS.md, SUPPORT.md, or docs/platforms/ file exists in the repository). Governance is informal: the current maintainer is Cosmin Truta (ctruta), who has held the role since 2018. Predecessors were Glenn Randers-Pehrson (1998-2018), Andreas Dilger (1996-1997), and Guy Eric Schalnat/Group 42, Inc. (original author, 1995-1996). Project infrastructure is hosted on SourceForge (mailing lists `png-mng-implement`/`png-mng-misc`); the homepage [libpng.org](http://www.libpng.org/) is maintained separately by Greg Roelofs with no stated institutional affiliation.

License: "PNG Reference Library License version 2," a permissive zlib/libpng-style license, with a legacy version-1 clause retained for libpng 0.5-1.6.35. Copyright is held collectively by "The PNG Reference Library Authors" plus named past maintainers.

Corporate-affiliated contributors credited in AUTHORS.md include Apple Inc. (Zixu Wang), Arm Holdings (Richard Townsend), Google LLC (Dan Field, Dragos Tiselice, Leon Scroggins III, Matt Sarett, Mike Klein, Sami Boukortt, Wan-Teh Chang), Loongson Technology Corporation Ltd. (GuXiWei, JinBo, ZhangLixia), Samsung Group (Filip Wasil), and SpacemiT (Hangzhou) Technology Co. (Liang Junzhao). No company holds a controlling stake; maintainership is personal, not seat-based. By raw commit volume across the full `libpng16` history (4,574 commits): Glenn Randers-Pehrson (~3,469 combined), John Bowler (463), Cosmin Truta (398, current maintainer), Vadim Barkov (36), Filip Wasil/Samsung (14).

The canonical active development repository is [pnggroup/libpng](https://github.com/pnggroup/libpng) (github.com/glennrp/libpng redirects there). In practice, new architecture ports are accepted pragmatically and directly into the source tree once a contributor submits working SIMD-optimized code (filter/palette intrinsics plus a `*_init.c` runtime feature-detection file), modeled on the existing ARM NEON pattern; there is no RFC or committee process. The RISC-V port's origin, an initial contribution from a Google engineer later substantially reworked by Samsung and an independent developer, illustrates this low-friction, corporate-and-community-mixed contribution model.

libpng is not a RISE project member and does not appear on riseproject.dev's member list (8 Premier + 12 General members, none of which is libpng) or in any RISE blog post.

---

## 2. Port History and Upstreaming Timeline

RISC-V Vector (RVV) support entered the `libpng16` branch in May 2025 and required sustained correctness and build-system remediation through December 2025.

| Date | Event | Source |
|---|---|---|
| Dec 15/20, 2021 | [PR #405](https://github.com/pnggroup/libpng/pull/405) opened by mschlaegl: inline-assembly RVV implementation supporting drafts 0.7.1 through 1.0 simultaneously, tested on Allwinner D1 (RVV 0.7.1). Never merged; superseded in practice by PR #666. Status confirmed: still open. | [PR #405](https://github.com/pnggroup/libpng/pull/405) |
| Feb 26, 2024 | Maintainer ctruta states a preference for a C-intrinsics approach (dragostis's prototype) over mschlaegl's inline-assembly approach in #405, while confirming the inline-asm version worked. | [PR #405](https://github.com/pnggroup/libpng/pull/405) |
| Feb 17, 2025 | filipwasil (Samsung) offers to rebase dragostis's (Google) intrinsics prototype on working hardware; this becomes PR #666. | [PR #405](https://github.com/pnggroup/libpng/pull/405) |
| May 2, 2023 (committed) | First RISC-V commit, `cc5ee6b`, "Add optimized RISC-V Vector functions," authored by Dragos Tiselice (Google), signed off by ctruta. Message notes it is "largely based off of the ARM NEON implementation." This is the seed commit later formalized through PR #666. | Local clone, `libpng16` history |
| Mar 7, 2025 - May 14, 2025 | [PR #666](https://github.com/pnggroup/libpng/pull/666) "RISC-V RVV extension" merged (commit `009b90d`, by ctruta). Adds `riscv/riscv_init.c`, `riscv/filter_rvv_intrinsics.c`, `contrib/riscv-rvv/`; autotools and CMake integration; runtime hwprobe-based detection; RVV disabled by default. A reviewer (camel-cdr) caught an ISA-string false-positive bug (custom extensions like `rv64gc_xtheadvector` misparsed as RVV-capable) that was fixed before merge. Tested on Banana Pi F3 (256-bit VLEN), GCC 14.0.1. Released in v1.6.49. | [PR #666](https://github.com/pnggroup/libpng/pull/666) |
| May 19-26, 2025 | [PR #683](https://github.com/pnggroup/libpng/pull/683) merged: configure.ac checks so `-march=rv64gcv1p0` enables RVV compilation and `--enable-riscv-rvv` accepts on/yes/off/no/check/api. | [PR #683](https://github.com/pnggroup/libpng/pull/683) |
| May 27, 2025 | [Issue #678](https://github.com/pnggroup/libpng/issues/678) opened: configure script regression traced to the RISC-V build-file change. [PR #685](https://github.com/pnggroup/libpng/pull/685) and [PR #693](https://github.com/pnggroup/libpng/pull/693) opened and closed as duplicate fixes for the same break. | [Issue #678](https://github.com/pnggroup/libpng/issues/678) |
| Jun 11-17, 2025 | [Issue #698](https://github.com/pnggroup/libpng/issues/698) and [Issue #703](https://github.com/pnggroup/libpng/issues/703): autotools cross-build fails with `undefined reference to png_init_filter_functions_rvv` while the CMake build succeeds with identical flags, on both Debian 12 (GCC 12.2.0) and Mint 22.1/Ubuntu 24.04.2. | [Issue #698](https://github.com/pnggroup/libpng/issues/698), [Issue #703](https://github.com/pnggroup/libpng/issues/703) |
| Jun 12, 2025 | [PR #699](https://github.com/pnggroup/libpng/pull/699) merged: fixed build-time RVV autodetection when `-march` doesn't explicitly declare the V extension. | [PR #699](https://github.com/pnggroup/libpng/pull/699) |
| Jun 17-18, 2025 | [Issue #705](https://github.com/pnggroup/libpng/issues/705) opened: `configure.ac` unconditionally forced `-march=rv64gv1p0` during the RVV compiler probe, crashing on non-vector hardware. [PR #702](https://github.com/pnggroup/libpng/pull/702) (fallback for RVV rev < 1.0) and [PR #704](https://github.com/pnggroup/libpng/pull/704) (separated autotools/CMake build flows) merged. | [Issue #705](https://github.com/pnggroup/libpng/issues/705) |
| Jun 24, 2025 | [Issue #711](https://github.com/pnggroup/libpng/issues/711) opened: crash on T-Head C920 (RVV 0.7.1 hardware) because GCC 15's RVV-1.0 intrinsics did not match; reporter (via a Gentoo bug report) argued for compiler intrinsics over raw instructions to survive spec-version drift. | [Issue #711](https://github.com/pnggroup/libpng/issues/711) |
| Jun 26-28, 2025 | [PR #713](https://github.com/pnggroup/libpng/pull/713) "Libpng16 build fixes for riscv": switched to C intrinsics for RVV ops and stopped the RVV probe from overwriting user `-march` flags. Manually integrated by ctruta ("Integrated in the master branch although GitHub doesn't seem to think so"); GitHub's own status shows "Closed," not "Merged." Released in v1.6.50. | [PR #713](https://github.com/pnggroup/libpng/pull/713) |
| Jul 7-15, 2025 | [PR #721](https://github.com/pnggroup/libpng/pull/721) "RISCV support only RVV 1.0": gates RVV 1.0 support at compile time via the `__riscv_v` macro with forward-compatible version ranges, validated on T-Head hardware, directly answering the #711 concern. Also manually integrated by ctruta, also shows "Closed" in GitHub's data model (`merged_at` is null in both #713 and #721 despite the code being in trunk). Released in v1.6.51. | [PR #721](https://github.com/pnggroup/libpng/pull/721) |
| Dec 2-4, 2025 | [PR #766](https://github.com/pnggroup/libpng/pull/766) "Fix and improve RVV png_read_filter": replaced mask-agnostic intrinsics with mask-undisturbed variants and fixed abs-diff computation; validated on QEMU-RISC-V (no physical hardware at submission). Author closed it after ctruta applied an equivalent fix directly. | [PR #766](https://github.com/pnggroup/libpng/pull/766) |
| Dec 4, 2025 | [Issue #769](https://github.com/pnggroup/libpng/issues/769) opened by asmorkalov (OpenCV): `png_read_filter_row_paeth3_rvv`/`paeth4_rvv` produced wrong pixel values in 1.6.51, causing 52 OpenCV image I/O test failures on Spacemit K1; disabling the two functions resolved all 52 failures. Closed once fixed. | [Issue #769](https://github.com/pnggroup/libpng/issues/769) |
| Dec 5, 2025 | [PR #771](https://github.com/pnggroup/libpng/pull/771) merged: fixed a nonexistent intrinsic, `__riscv_vaaddu_wx_u8m1`. Maintainer ctruta stated in review that his own CI/manual testing "was in fact NOT compiling the vectorized (RVV'ed) code, because...I forgot to pass `-march=rv64gv`" -- i.e. the maintainer's own testing had never exercised the RVV path. Confirmed working with OpenCV on Spacemit K1 in libpng 1.6.53. | [PR #771](https://github.com/pnggroup/libpng/pull/771) |

The RISC-V port required roughly a dozen follow-up PRs and 5 issues from initial merge (May 2025) through the correctness fix in 1.6.53 (December 2025). As of the research date no open RISC-V-specific issue or PR remains against `pnggroup/libpng`.

**Important caveat on "upstream":** the code above is fully present and wired only on the `libpng16` (stable/`master`, currently tracking 1.6.60-dev) branch. GitHub's *default* branch is `libpng18`, a 1.8 development refactor. On `libpng18`, `riscv/riscv_init.c` and `riscv/filter_rvv_intrinsics.c` are present (carried over via the v1.6.59 merge) but orphaned: the new `pngtarget.h` target-dispatch header includes `arm/check.h`, `intel/check.h`, `mips/check.h`, `powerpc/check.h` but no `riscv/check.h`; `CMakeLists.txt` and `configure.ac` on this branch contain zero RISC-V references. A user who clones the default branch today gets plain-C fallback on riscv64 regardless of flags passed, and `manuals/libpng-install.txt` on that branch documents `--enable-riscv-rvv`/`PNG_RISCV_RVV` flags that do not exist there. This is a real, verifiable regression relative to `libpng16`, not a stub -- the code has simply not yet been ported to the new 1.8 dispatch convention.

---

## 3. Upstream Support Tier

libpng has no formal tiered platform policy; architecture-specific optimizations are structured as optional subdirectories (`arm/`, `riscv/`, `intel/`, `mips/`, `powerpc/`, `loongarch/`) compiled conditionally. RVV defaults to **off** in the build system (unlike ARM NEON, Intel SSE, and PowerPC VSX, which default on).

No RISC-V CI is automated (Section 7). All RISC-V validation to date has been manual, on contributor hardware (Spacemit K1, Banana Pi F3) or via QEMU (PR #766). No SLA or support commitment for RISC-V is documented. Work has been driven entirely by external contributors (Google, Samsung, an independent developer, and downstream consumer OpenCV), not by the maintainer proactively.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Native (`ubuntu-latest`) | Partial (native on macOS runner; `windows-11-arm` in verify-windows.yml) | None |
| Official binary distribution | Distro packages; no upstream GitHub Release assets | Distro packages; no upstream GitHub Release assets | Distro packages only (Debian, Ubuntu); no upstream GitHub Release assets |
| SIMD default-on | Yes | Yes | No |
| Wired on default GitHub branch (`libpng18`) | Yes | Yes | No (orphaned source files) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source file inventory (on `libpng16`)

| File | Purpose | Status |
|---|---|---|
| `riscv/filter_rvv_intrinsics.c` (290 lines) | RVV C-intrinsics implementation of the Up, Sub3/4, Avg3/4, Paeth3/4 read-filter reconstruction functions (7 functions plus 3 static helpers) | Complete, no TODO/FIXME/stub markers found |
| `riscv/riscv_init.c` (45 lines) | Runtime dispatch, `png_init_filter_functions_rvv`, assigns filter function pointers by bpp | Complete |
| `riscv/.editorconfig` | Editor style config only | Non-code |

No `.S` assembly files exist for RISC-V. No JIT backend. No Zba/Zbb/Zbc/Zbs bit-manipulation usage in libpng itself. The only ISA extension used is RVV 1.0 via C intrinsics from `<riscv_vector.h>`.

### 4.2 Filter function coverage

All 7 filter variants documented in Section 2 (Up, Sub3, Sub4, Avg3, Avg4, Paeth3, Paeth4) are implemented, gated by `PNG_RISCV_RVV_IMPLEMENTATION == 1` and `PNG_READ_SUPPORTED`. Vector types used: `vuint8m8_t`, `vuint8m1_t`, `vuint16m2_t`.

### 4.3 Runtime dispatch and feature detection

`png_init_filter_functions_rvv(png_structp pp, unsigned int bpp)` always assigns the Up filter and assigns Sub/Avg/Paeth variants conditionally on bpp==3 or bpp==4, exactly matching the dispatch pattern of every other architecture in the codebase. There is, however, **no runtime CPU-feature detection for RISC-V** -- no `check.h`/hwprobe-based equivalent of ARM's dedicated detection layer exists in the source tree (the PR #666 description mentions hwprobe-based detection in `contrib/riscv-rvv/linux.c`, but the actual filter dispatch in `pngpriv.h` gates purely on the compile-time macro `__riscv_v >= 1000000`). A binary compiled with RVV enabled will execute unconditionally on any riscv64 target and will crash on hardware that lacks a matching V-extension revision -- this is precisely the mechanism behind the T-Head C920 crash in Issue #711.

### 4.4 Scope limitations

The RISC-V port covers the read path only (filter reconstruction for decompressed scanlines). There is no write-path (encoder) SIMD and no palette-expansion acceleration for RISC-V; both gaps are shared with most other architectures in the codebase (only ARM has a palette-expansion path).

### 4.5 Architecture comparison (line counts and features, `libpng16`)

| Arch | Files (lines) | Filter coverage | Runtime detection | Hand asm | Palette accel |
|---|---|---|---|---|---|
| riscv | riscv_init.c (45) + filter_rvv_intrinsics.c (290) = 335 | 7 of 7 | No (compile-time only) | No | No |
| intel (SSE2) | intel_init.c (51) + filter_sse2_intrinsics.c (408) = 459 | 6 of 7 (no Up) | Yes | No | No |
| powerpc (VSX) | powerpc_init.c (125) + filter_vsx_intrinsics.c (768) = 893 | 7 of 7 | Yes | No | No |
| loongarch (LSX) | loongarch_lsx_init.c (66) + filter_lsx_intrinsics.c (417) = 483 | 7 of 7 | No | No | No |
| mips (MSA/MMI) | mips_init.c (203) + filter_msa_intrinsics.c (812) + filter_mmi_inline_assembly.c (525) = 1540 | 7 of 7 | Yes | Yes | No |
| arm (NEON) | arm_init.c (138) + filter_neon_intrinsics.c (401) + palette_neon_intrinsics.c (147) + filter_neon.S (60) = 686 | 7 of 7 | Yes | Yes | Yes |

RISC-V is the smallest SIMD port by line count, tracking with it being the newest addition rather than being incomplete: filter-function coverage matches PowerPC and LoongArch, and exceeds Intel SSE2 (which omits the Up filter). It sits at the same intrinsics-only maturity tier as Intel, PowerPC and LoongArch, below ARM NEON (hand asm, runtime detection, palette accel) and MIPS (hand asm, runtime detection).

---

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `docs/` directory exists in the repository on either branch. `manuals/libpng-install.txt` (section XII, "Enabling or disabling hardware optimizations") is the closest equivalent, and on `libpng18` it documents flags that do not exist on that branch (see Section 2). No Dockerfile, riscv64 CMake toolchain file, or QEMU configuration exists anywhere in the repository.

### 5.1 CMake (`libpng16`)

`CMakeLists.txt` matches `CMAKE_SYSTEM_PROCESSOR` against the regex `^(riscv)`. `PNG_RISCV_RVV` is a cache string (`on`/`off`, default `off`; note this is a naming inconsistency with `PNG_HARDWARE_OPTIMIZATIONS`, which takes boolean `ON`/`OFF`). When not `off`, CMake runs a `check_c_source_compiles` probe exercising `__riscv_vreinterpret_v_u64m1_u8m1`, `__riscv_vle64_v_u64m1`, `__riscv_vle32_v_f32m1`, and `__riscv_vfmv_f_s_f32m1_f32`; if the compiler cannot compile this probe, CMake aborts with `FATAL_ERROR`. CMake minimum required version: 3.14.

```
cmake -B build -S . \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_AR=riscv64-linux-gnu-ar \
  -DCMAKE_RANLIB=riscv64-linux-gnu-ranlib \
  -DCMAKE_BUILD_TYPE=Release \
  -DPNG_RISCV_RVV=on \
  -DCMAKE_INSTALL_PREFIX=<install-dir>
cmake --build build --config Release
cmake --build build --config Release --target install
```

On `libpng18` (the default branch), `-DPNG_RISCV_RVV=...` is simply unrecognized -- the option does not exist there.

### 5.2 Autoconf/configure (`libpng16`)

`AC_ARG_ENABLE([riscv-rvv], ...)` accepts `no`/`off`, `yes`/`on` (which sets `PNG_RISCV_RVV_OPT=2` and emits a warning to also pass `-march=rv64gv1p0`), with auto-detection enabling `riscv_rvv=yes` when `$host_cpu` is `riscv64`, gated by the same compile probe as CMake. `Makefile.am` builds `riscv/riscv_init.c` and `riscv/filter_rvv_intrinsics.c` into a `noinst_LTLIBRARIES` sublibrary with `CFLAGS = -march=rv64gv` (no explicit `1p0` suffix) when `PNG_RISCV_RVV` is true.

```
CC=riscv64-linux-gnu-gcc \
AR=riscv64-linux-gnu-ar \
RANLIB=riscv64-linux-gnu-ranlib \
./configure --host=riscv64-linux-gnu --prefix=<install-dir> --enable-riscv-rvv=yes
make
make install
```

To disable all hardware optimizations: `--disable-hardware-optimizations`. `-march=rv64gv1p0` (CMake) / `-march=rv64gv` (autotools default) is the flag actually needed to compile the vectorized path -- its historical absence from the maintainer's own testing (Section 2, PR #771) is what let a nonexistent intrinsic ship in 1.6.51-era code undetected.

### 5.3 CI-adjacent cross-compilation scripts (unused by any CI)

`ci/targets/linux/ci_env.riscv64-linux-gnu.sh` sets `CI_TARGET_ARCH=riscv64`, `CI_CC=riscv64-linux-gnu-gcc`, `CI_AR`, `CI_RANLIB`, and matching `-DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=riscv64` variables; `ci/targets/freebsd/ci_env.riscv64-unknown-freebsd.sh` is the FreeBSD equivalent (sets no `CI_CC`/`CI_AR`/`CI_RANLIB` -- caller must supply a cross toolchain). Per `ci/README.md` these are "Shell environments for cross-platform testing," invoked manually via `source ci/targets/linux/ci_env.riscv64-linux-gnu.sh; CI_NO_TEST=1 ./ci/ci_verify_cmake.sh`. `CI_NO_TEST=1` is required because `ci_build` otherwise runs `ctest`/`make test` unconditionally, and a cross-compiled riscv64 binary cannot execute on a non-riscv64 runner; the repository provides no QEMU/binfmt setup to make that test step work. These scripts are referenced only in `ci/README.md` and are explicitly excluded from lint checks (`ci_lint.sh` skips `ci_env.*.sh`); no `.github/workflows/*.yml` or `.appveyor.yml` sources, calls, or mentions them.

### 5.4 Toolchain version requirements

No explicit minimum compiler version is stated anywhere in the repository; the CMake/configure compile probe exercises specific RVV 1.0 intrinsics rather than checking a version number, so any compiler whose `<riscv_vector.h>` supports those exact intrinsics passes. Observed evidence: GCC 12.2.0 (Debian 12) failed to link RVV builds via autotools with `undefined reference to png_init_filter_functions_rvv` while CMake succeeded with the same toolchain (Issue #703); GCC 14.0.1/14 was used successfully in PR #666 (Banana Pi F3) and PR #763 (Spacemit K1); GCC 15 exposed an intrinsics-version mismatch on T-Head C920 (Issue #711). [NEEDS VERIFICATION]: an exact minimum GCC/Clang version (commonly cited elsewhere as GCC >= 13, Clang >= 14 for a complete RVV 1.0 API) is not stated by the libpng project itself.

### 5.5 QEMU

No QEMU configuration or QEMU-specific scripts exist in the repository (`git grep -ni qemu` returns zero hits). PR #766 was validated on QEMU-RISC-V manually by its author, but this is not automated.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 | arm64 | amd64 |
|---|---|---|---|
| Read-filter SIMD (all 7 variants) | Yes (RVV 1.0 intrinsics, off by default) | Yes (NEON intrinsics + hand asm, on by default) | Partial (SSE2, 6 of 7 -- no Up filter; on by default) |
| Write-filter SIMD | No | No | No |
| Palette expansion SIMD | No | Yes | No |
| Runtime CPU feature detection | No (compile-time `__riscv_v` macro only) | Yes | Yes |
| Hand-written assembly fallback | No | Yes | No |
| Default-on in build system | No | Yes | Yes |
| Wired on default GitHub branch (`libpng18`) | No (orphaned) | Yes | Yes |
| Automated CI coverage | None | Partial (macOS native, Windows ARM64 native) | Full (native Linux) |

The primary functional gap versus arm64 is the absence of runtime CPU feature detection: on arm64/amd64 a distributed binary can gracefully fall back to scalar code on hardware lacking the extension, whereas an RVV-enabled riscv64 binary will execute unconditionally and can crash on hardware with a mismatched or absent V extension (Issue #711, Issue #705). No RISC-V-specific NaN or floating-point semantics issue was found in libpng's own tracker; general RISC-V NaN-boxing discussions found during research (GCC bug 116017, LLVM #225455, cva6 #2449, unicorn-engine #2314) are toolchain/simulator/core-level issues unrelated to libpng.

---

## 7. CI/CD Infrastructure

**No automated riscv64 CI exists.** Confirmed by reading all four GitHub Actions workflow files plus `.appveyor.yml` directly against a fresh clone (HEAD `8334628`, `libpng18`, 2026-09-30); `grep -ni riscv` across `.github/workflows/*.yml` and `.appveyor.yml` returns zero matches.

| CI file | Trigger | Runner(s) | riscv64 present |
|---|---|---|---|
| `.github/workflows/lint.yml` | push/PR on `libpng16`, `libpng18` | `ubuntu-latest` (yamllint + editorconfig-checker) | No |
| `.github/workflows/verify-linux.yml` | push/PR on `libpng16`, `libpng18` | `ubuntu-latest`, native build via `ci_verify_configure.sh` with sanitizers | No |
| `.github/workflows/verify-macos.yml` | push/PR | `macos-latest`, native CMake build | No |
| `.github/workflows/verify-windows.yml` | push/PR | `windows-2025` (x64), `windows-11-arm` (ARM64), CMake via vcpkg | No |
| `.appveyor.yml` | (AppVeyor) | x86/x64 Windows | No |
| `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` | N/A | Not present in repository | N/A |

No riscv64 runner, no QEMU step, and no hidden `workflow_dispatch`-only or label-gated job exists in any config. The unused `ci_env.riscv64-*.sh` scripts described in Section 5.3 are dead/unwired artifacts, not CI. No RISE-operated runner usage for libpng was found anywhere in the riseproject-dev GitHub organization.

The operational consequence is concrete: the nonexistent intrinsic `__riscv_vaaddu_wx_u8m1` shipped in December 2025 review went undetected because the maintainer's local test run never applied `-march=rv64gv` and therefore never compiled the vectorized code path at all (PR #771, maintainer's own words). A QEMU-based riscv64 build+test lane in `verify-linux.yml` would have caught both this build failure and the Paeth correctness regression (Issue #769) before they reached a tagged release.

---

## 8. Distribution and Release Status

**Upstream GitHub releases are nonexistent, not merely source-only.** Both `github.com/glennrp/libpng/releases` and `github.com/pnggroup/libpng/releases` render "There aren't any releases here" -- zero release assets of any kind exist; the project ships via tags and source tarballs referenced from libpng.org/libpng.sourceforge.io, not GitHub Releases.

**Debian:** libpng1.6 builds for riscv64 in Debian sid (status page: [buildd.debian.org](https://buildd.debian.org/status/package.php?p=libpng1.6&suite=sid)). A package search across trixie/forky/sid confirms riscv64 builds of `libpng-dev`, `libpng-tools`, `libpng16-16t64`, `libpng16-16-udeb`, `libpnglite-dev`, and `libpnglite0` (the latter two are the separate, unrelated "pnglite" project).

**Ubuntu:** confirmed directly via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libpng&suite=resolute&searchon=names&section=all) for 26.04 "resolute": `libpng-dev`, `libpng-tools`, and `libpng16-16t64`, all version 1.6.57-1, build for riscv64 alongside amd64/arm64/armhf/i386/ppc64el/s390x. The download page for the riscv64 binary has the exact filename `libpng16-16t64_1.6.57-1_riscv64.deb`, reproduced across two independent fetches. `libimage-png-libpng-perl` 0.59-1 (Perl binding) is also built for riscv64; `libpng++-dev` 0.2.10-1build1 is architecture-independent (`all`) and therefore trivially available. This finding was independently re-verified in an adversarial pass and could not be refuted.

**PyPI, npm, Maven, OCI:** not applicable. `https://pypi.org/pypi/libpng/json` returns HTTP 404 -- no PyPI package named `libpng` exists (expected for a C library). No npm or Maven artifact search was applicable to a C library with no language-specific packaging.

**Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at)): libpng does not appear in the port's package listing at all. [NEEDS VERIFICATION] -- this is a single-source finding; the port's stated policy is to carry all non-blacklisted `[core]`/`[extra]` packages, which would normally include libpng, so its absence from the visible listing should be treated as unconfirmed rather than a firm "not available."

**RISE wheel builder (GitLab):** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libpng/` redirects to the PyPI simple index, which returns 404. Not applicable to a C library; not listed among the 89 packages on the RISE Python wheel_builder page.

**What a user must do today:** on Debian sid or Ubuntu 26.04 (resolute), `apt install libpng16-16t64` (or `libpng-dev`) on a riscv64 system installs a working, unmodified-upstream build (RVV path off by default, so no riscv64-specific patch is required). Outside those two distributions, or for an RVV-accelerated build, a user must build from source on `libpng16` using the commands in Section 5; the default GitHub branch (`libpng18`) cannot currently produce an RVV-accelerated riscv64 build regardless of flags passed (Section 2).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking Issues |
|---|---|---|---|---|---|
| zlib | Runtime dependency, critical -- DEFLATE compression/decompression required for all PNG encode/decode | Passing -- pure portable C, no SIMD in mainline, compiles cleanly on riscv64 | Limited -- only CI target is OpenBSD/riscv64 via vmactions (QEMU); no Linux/riscv64 entry in `configure.yml`'s cross-compile matrix (ARM/AARCH64/PPC/PPC64LE/S390X are present, riscv64 is not) | Shipping -- zlib1g/zlib1g-dev present for riscv64 in Ubuntu 24.04 and Debian sid (source-only upstream releases, no prebuilt binaries for any arch) | Unmerged PR #1099 (RVV-accelerated Adler32, +7% claimed on SG2042) open since 2025-10-28 with no maintainer response; duplicate PR #1267 self-closed 2026-06-10. No RVV/Zbc CRC-32 or `longest_match` SIMD exists for riscv64. Maintainer (madler) has a multi-year precedent of not reviewing architecture-SIMD PRs. None of this blocks correctness of the base build libpng consumes. |
| zlib-ng | Runtime dependency, optional -- drop-in SIMD-accelerated zlib replacement some distros use as the zlib provider | Passing -- full `arch/riscv/` port (adler32_rvv, chunkset_rvv, compare256_rvv, slide_hash_rvv, crc32_zbc, runtime hwprobe/hwcap detection); all files complete, no stubs | Passing in CI -- 6 riscv64 jobs per run (GCC/Clang x cmake/configure) via QEMU; test corpora are skipped on riscv64 because QEMU is too slow, and Clang code coverage is broken on riscv64 | Shipping only via Alpine Linux edge (2.3.3-r0, built 2026-05-11); **not packaged for Debian or Ubuntu at all** -- no Debian buildd entry in any suite, no package in Ubuntu Noble or any supported release | Open: Issue #1670 (`CHUNK_MEMSET_RVV_IMPL` raw pointer cast lacks the `UNALIGNED_OK` guard other architectures use -- portability/correctness risk on strict-alignment targets). Closed/historical: a bogus `HWCAP_ISA_ZBC` bit silently disabled Zbc detection for ~7 months (issues #1997/#1705, fixed by PR #1999/#2130); a SIGSEGV in `chunkset_rvv` from a signed/unsigned comparison bug (fixed). Zbc acceleration is unavailable at runtime on kernels < 6.8 (hwprobe requirement). *Note on discrepancy:* an earlier research pass characterized zlib-ng riscv64 as actively maintained and shipping broadly; the evidence above shows it is CI-passing but distribution availability is narrow (Alpine edge only) -- treat "shipping" claims for this dependency as build/CI maturity, not distro ubiquity. |
| CMake | Build dependency, critical -- generates libpng's CMake build and runs the `PNG_RISCV_RVV` compile probe | Data not available: no riscv64-specific CMake build/test/release data was found in research; CMake's own riscv64 support was not directly investigated. CMake >= 3.14 is libpng's stated minimum. | Data not available: not investigated | Data not available: not investigated | No libpng-specific blockers found; libpng's own CMake RVV wiring is present only on `libpng16`, not on the default `libpng18` branch (Section 2). |
| autoconf | Build dependency, critical -- generates libpng's `configure` script, including the `--enable-riscv-rvv` probe | Data not available: no riscv64-specific autoconf build/test/release data was found in research | Data not available: not investigated | Data not available: not investigated | Two of libpng's own RISC-V build failures (Issue #698, Issue #703) were specifically autotools-path failures (`undefined reference to png_init_filter_functions_rvv`) that did not reproduce via CMake with the same toolchain, indicating a libpng-side autotools/RVV integration gap rather than an autoconf defect per se. |
| GCC | Build dependency, critical -- primary compiler used to build libpng and its RVV intrinsics path | Riscv64 cross-compilation observed working (GCC 14.0.1/14 used successfully in PR #666 and PR #763) and observed failing for RVV linking specifically (GCC 12.2.0 on Debian 12, Issue #703) | Data not available beyond the pass/fail build evidence above | Riscv64 cross toolchain (`riscv64-linux-gnu-gcc`) is the toolchain named throughout libpng's CI env scripts and configure examples | GCC's exact minimum version for the full RVV 1.0 intrinsics API is not documented by libpng itself [NEEDS VERIFICATION]; observed evidence places a working floor somewhere between GCC 12.2.0 (fails RVV autotools link) and GCC 14 (works). |
| LLVM | Build dependency, critical -- alternate compiler toolchain (Clang) referenced for RVV 1.0 testing | Clang 17 and "GCC trunk" were cited as required to test RVV 1.0 hardware/emulation during the #405 development discussion (Feb 2024) | Data not available | Data not available | No LLVM/Clang-specific riscv64 build failure or fix was found in libpng's own issue/PR history; all documented build failures (Issue #698, #703, #705, #711) involve GCC. |

---

## 11. Known Bugs and Active Issues

No open RISC-V-specific issue or PR exists in `pnggroup/libpng` as of the research date. All RISC-V issues found are closed.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #769](https://github.com/pnggroup/libpng/issues/769) | `png_read_filter_row_paeth3(4)` RVV implementation is not accurate | Closed (2025-12-05) | **Correctness -- highest severity found.** Silent pixel-data corruption | OpenCV (vendoring libpng 1.6.51, Spacemit K1, RVV enabled) hit 52 failing image-decode tests; root-caused to mask-agnostic intrinsics and a broken abs-diff computation in the vectorized Paeth filter. Disabling just the two Paeth RVV functions fixed all 52 failures. Fixed via PR #766 (mask-undisturbed intrinsics, corrected abs-diff) and shipped correct in 1.6.53. |
| [PR #771](https://github.com/pnggroup/libpng/pull/771) | Fixed RISC-V RVV code build | Merged (2025-12-05) | Build-breaking | Nonexistent intrinsic `__riscv_vaaddu_wx_u8m1`; exposed that the maintainer's own CI/manual testing had never actually compiled the vectorized RVV path (missing `-march=rv64gv`). |
| [Issue #711](https://github.com/pnggroup/libpng/issues/711) | Crashes on a machine with the C920 core | Closed (2025-07-10) | Correctness/crash | T-Head C920 (RVV 0.7.1) crashed because GCC 15's RVV-1.0 intrinsics did not match the core's spec draft; resolved by moving to compile-time `__riscv_v` version gating (PR #721) rather than raw inline assembly. |
| [Issue #705](https://github.com/pnggroup/libpng/issues/705) | RISCV configure.ac overrides build environment architecture settings | Closed (2025-07-05, per build-fix cascade) | Build-safety | `configure.ac` forced `-march=rv64gv1p0` during the compiler probe regardless of target, risking crashes on non-V hardware and blocking no-vector builds; `-march=rv64g` crashed the compiler on `asm` directives, `-march=rv64id` failed to compile `riscv_init.c`. |
| [Issue #703](https://github.com/pnggroup/libpng/issues/703) | riscv64-linux-gnu-gcc 12.2.0 (Debian 12) good for RVV-enabled builds? | Closed, not planned (2025-06-17) | Build | GCC 12.2.0 failed to link RVV builds via autotools (`undefined reference to png_init_filter_functions_rvv`) though CMake succeeded with the identical toolchain. |
| [Issue #698](https://github.com/pnggroup/libpng/issues/698) | riscv: cmake cross-build works, but configure one doesn't | Closed (2025-06-12) | Build | Same symptom as #703, reproduced on Mint 22.1/Ubuntu 24.04.2 with `--host=riscv64-linux-gnu --enable-hardware-optimizations`. |
| [Issue #678](https://github.com/pnggroup/libpng/issues/678) | configure script produces a syntax error since commit ffb8e8b | Closed (2025-05-27) | Build-breaking | Regression traced to an early RISC-V build-file change; fixed by PR #683/#685/#693 follow-ons. |

---

## 12. Objections and Upstream Blockers

**No active blockers.** All RISC-V issues and PRs found are closed or merged, and the maintainer (ctruta) has consistently shepherded the work to completion.

**Reviewer friction (resolved):** John Bowler (jbowler) was the most persistent critical voice across the multi-year #405 thread and later in Issue #711/#705, repeatedly raising portability and safety objections: inline-assembly fragility in #405 ("appears only works with linux," questioned runtime-detection given incomplete compiler support for unratified RVV revisions), the forced `-march` override risking crashes in #705, and intrinsics-vs-raw-instructions correctness risk in #711 (arguing raw RVV assembly "will break" as the spec evolves). His objections were technical, not philosophical, and were resolved by the intrinsics-based rewrite (PR #666, #713) and compile-time version gating (PR #721). A separate reviewer, camel-cdr, resolved a spec-legitimacy disagreement between jbowler and the implementers by linking the authoritative ratified RVV spec in the official `riscv-isa-manual` repository.

**Structural risks (not active blockers):**

1. **Single-maintainer CI blind spot.** The PR #771 incident, where the maintainer's own local testing silently skipped the vectorized code path for an unknown period because `-march=rv64gv` was never applied, shows that the absence of automated CI directly allowed a latent build defect (and, separately, the Paeth correctness bug) to reach a tagged release undetected.
2. **No runtime detection.** The compile-time-only RVV enablement strategy means libpng cannot produce a single universal riscv64 binary safe across mixed vector/non-vector hardware fleets; a distributor must either disable RVV system-wide or ship separate binaries per target.
3. **RVV off by default, and dead on the default branch.** Distribution packages inherit whichever default applies to the branch/release they package from; Ubuntu 26.04 and Debian sid both ship the plain scalar build (RVV path off by default, consistent with upstream defaults), so no riscv64-specific patch is needed for the packages currently shipping. A distributor wanting the RVV-accelerated build must build from `libpng16` explicitly, since the code is unreachable on the `libpng18` default branch.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** No upstream CI builds or tests riscv64: all four GitHub Actions workflows ([lint.yml](https://github.com/pnggroup/libpng/blob/libpng16/.github/workflows/lint.yml), [verify-linux.yml](https://github.com/pnggroup/libpng/blob/libpng16/.github/workflows/verify-linux.yml), [verify-macos.yml](https://github.com/pnggroup/libpng/blob/libpng16/.github/workflows/verify-macos.yml), [verify-windows.yml](https://github.com/pnggroup/libpng/blob/libpng16/.github/workflows/verify-windows.yml)) plus `.appveyor.yml` were read directly and contain zero "riscv" references, and upstream publishes no GitHub Release binaries at all. The distribution floor applies instead: Debian sid ([buildd.debian.org](https://buildd.debian.org/status/package.php?p=libpng1.6&suite=sid)) and Ubuntu 24.04/26.04 ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libpng&suite=resolute&searchon=names&section=all)) build and ship libpng for riscv64 from effectively unmodified upstream source -- the RVV SIMD path is optional and off by default, so no riscv64 patch is needed to build -- giving the yellow "clean-distro-build" classification.
- **Pending work that could change the grade:** No automated riscv64 CI exists upstream; adding a QEMU-based riscv64 build+test lane to `verify-linux.yml` is the highest-priority gap identified in the investment table below. The optional RVV acceleration path (off by default) had a correctness regression in the vectorized Paeth filter ([Issue #769](https://github.com/pnggroup/libpng/issues/769) / [PR #771](https://github.com/pnggroup/libpng/pull/771)) that shipped in 1.6.51 and was fixed in 1.6.53; this does not affect the base scalar riscv64 build that distros ship. Separately, the default GitHub branch (`libpng18`) has not yet had the RISC-V port migrated to its new `pngtarget.h`/`check.h` dispatch convention, so RVV is currently unreachable there even though it is fully wired on `libpng16`. No RISE project involvement or funded work on libpng was found in any source consulted.

---

## 14. Investment Analysis

RISE has funded no work on libpng (Section 1, Section 10 absence); none of the sizing below is already covered by RISE or any other funded initiative.

### 14.1 Functional Enablement

The RISC-V read-path port is functionally complete on `libpng16` (7 of 7 filter variants, matching PowerPC/LoongArch coverage and exceeding Intel SSE2). The two material functional gaps are (a) the absence of runtime CPU-feature detection, which blocks safe universal-binary distribution across mixed vector/non-vector riscv64 fleets, and (b) the orphaned state of the RISC-V source on the `libpng18` default branch, where it is currently unreachable via any build flag.

### 14.2 Performance Optimization

The only quantitative figures found come from an unaffiliated, non-RISE 2021-2022 academic project (`libpng_rvv`, Manfred Schlaegl, JKU Linz), benchmarked on an Allwinner D1/Xuantie C906 board (RVV draft 0.7.1, not the ratified 1.0 spec now shipped): speedups over scalar C ranged from 1.13x (Paeth3, the hardest filter to vectorize due to serial/branchy logic) to 5.43x (Up3/Up4). These figures predate both the RVV 1.0 rewrite and the Paeth correctness fix and do not reflect current 1.0-compliant hardware. No throughput figures in megapixels/second or MB/s, and no riscv64-vs-arm64 or riscv64-vs-amd64 comparative benchmark, was found in any source consulted for the current (1.6.53+) RVV 1.0 implementation. OpenEmbedded-core CI notes document that libpng's ptest suite consistently times out under QEMU riscv64 emulation (too slow to finish within the ptest-runner window), a build/test-infrastructure problem rather than a hardware performance data point.

### 14.3 CI/CD Infrastructure

No automated riscv64 CI exists (Section 7). The `ci_env.riscv64-linux-gnu.sh` environment file is correct and ready to use but is not invoked by any GitHub Actions workflow. Wiring it into `verify-linux.yml` with a QEMU cross-execution step is the single highest-leverage near-term infrastructure investment; it would have caught both the December 2025 build break (PR #771) and, potentially, the Paeth correctness regression (Issue #769) before release.

### 14.4 Ecosystem Enablement

libpng is a transitive build dependency of a large share of the Linux image-processing stack (OpenCV, browsers, image libraries, etc.), but libpng itself has no dependent package ecosystem of its own that requires separate per-package riscv64 enablement (see omission of Section 10). The most concrete ecosystem signal is that the OpenCV project (asmorkalov) has already served as de facto downstream riscv64 CI for libpng, filing and fixing the Paeth correctness bug and the build-break bug on real Spacemit K1 hardware. Formalizing upstream riscv64 CI would reduce libpng's current reliance on a single downstream consumer to catch regressions.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a QEMU-based riscv64 build+test lane to `verify-linux.yml`, wiring in the existing `ci_env.riscv64-linux-gnu.sh` | 1 | Upstream (external contributor patch) | Critical |
| Functional | Migrate the `riscv/` RVV port to the `libpng18` default branch's `pngtarget.h`/`check.h` dispatch convention (currently orphaned) | 2 | External contributor | Critical |
| Functional | Implement runtime RVV feature detection (a `check.h`/hwprobe equivalent) to allow safe universal riscv64 binaries | 3 | External contributor | High |
| Performance | Produce current (RVV 1.0, 1.6.53+) throughput benchmarks on representative riscv64 hardware (e.g. Spacemit K1, VLEN=128-bit cores), since the only public figures are from a 2021-2022 RVV-0.7.1 thesis | 2 | External contributor | High |
| Performance | Benchmark RVV vs scalar vs auto-vectorization across multiple riscv64 cores and VLEN configurations | 2 | External contributor | Medium |
| Functional | Enable RVV by default in CMake/configure once the compiler probe passes, matching ARM/Intel/PowerPC | 0.5 | Upstream | Medium |
| Functional | Add write-path (encoder) SIMD for riscv64 | 6 | External contributor | Low |

---

## 15. References

- [pnggroup/libpng (canonical upstream)](https://github.com/pnggroup/libpng)
- [glennrp/libpng (redirects to pnggroup/libpng)](https://github.com/glennrp/libpng)
- [PR #405 - Support for RISC-V Vector Extension (open, superseded by #666)](https://github.com/pnggroup/libpng/pull/405)
- [PR #666 - RISC-V RVV extension (merged, v1.6.49)](https://github.com/pnggroup/libpng/pull/666)
- [PR #683 - riscv: autotools update](https://github.com/pnggroup/libpng/pull/683)
- [Issue #678 - configure script produces a syntax error](https://github.com/pnggroup/libpng/issues/678)
- [PR #699 - riscv: fix autodetection of rvv support](https://github.com/pnggroup/libpng/pull/699)
- [Issue #698 - cmake cross-build works, configure one doesn't](https://github.com/pnggroup/libpng/issues/698)
- [Issue #703 - riscv64-linux-gnu-gcc 12.2.0 good for RVV-enabled builds?](https://github.com/pnggroup/libpng/issues/703)
- [PR #702 - fix Fallback when RVV rev. < 1.0](https://github.com/pnggroup/libpng/pull/702)
- [PR #704 - separated build flow for autotools and cmake](https://github.com/pnggroup/libpng/pull/704)
- [Issue #705 - RISCV configure.ac overrides build environment architecture settings](https://github.com/pnggroup/libpng/issues/705)
- [Issue #711 - RISCV: crashes on a machine with the C920 core](https://github.com/pnggroup/libpng/issues/711)
- [PR #713 - Libpng16 build fixes for riscv](https://github.com/pnggroup/libpng/pull/713)
- [PR #721 - RISCV support only RVV 1.0](https://github.com/pnggroup/libpng/pull/721)
- [PR #766 - Fix and improve RVV png_read_filter](https://github.com/pnggroup/libpng/pull/766)
- [Issue #769 - png_read_filter_row_paeth3(4) RVV implementation is not accurate](https://github.com/pnggroup/libpng/issues/769)
- [PR #771 - Fixed RISC-V RVV code build](https://github.com/pnggroup/libpng/pull/771)
- [PR #589 - [libpng18] reworked SIMD code (abandoned)](https://github.com/pnggroup/libpng/pull/589)
- [Debian buildd status - libpng1.6 riscv64 (sid)](https://buildd.debian.org/status/package.php?p=libpng1.6&suite=sid)
- [Ubuntu packages - libpng (resolute/26.04)](https://packages.ubuntu.com/search?keywords=libpng&suite=resolute&searchon=names&section=all)
- [mschlaegl/libpng_rvv-doc - RISC-V Vector Optimized libpng benchmark](https://github.com/mschlaegl/libpng_rvv-doc)
- [EESSI - libpng available software (riscv64)](https://www.eessi.io/docs/available_software_riscv/detail/libpng/)
- [RISE Project - riseproject.dev](https://riseproject.dev)
- [RISE Python wheel_builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [zlib PR #1099 - RVV-accelerated Adler32 (unmerged)](https://github.com/madler/zlib)
- [zlib-ng repository](https://github.com/zlib-ng/zlib-ng)