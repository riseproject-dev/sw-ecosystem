---
title: libfdk-aac
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libfdk-aac" %}

# libfdk-aac

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libfdk-aac<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[libfdk-aac](https://github.com/mstorsjo/fdk-aac) is an open-source packaging of the Fraunhofer IIS FDK AAC codec library, maintained by Martin Storsjo (mstorsjo) as a personal GitHub project. The underlying codec code originates from Fraunhofer-Gesellschaft zur Forderung der angewandten Forschung e.V. (Fraunhofer IIS, Erlangen, Germany), copyright 1995-2018. The repository periodically merges `aosp/main` from Google's Android tree, which is how ongoing AOSP contributions reach it.

The library provides AAC-LC, HE-AACv1, and HE-AACv2 encode and decode. It is consumed by FFmpeg (optional AAC encoder), GStreamer (`gstreamer-plugins-bad` fdk-aac plugin), and Android (AOSP media stack).

**Governance:** None in the sense of a foundation, steering committee, or published policy. There is no MAINTAINERS, CODEOWNERS, PLATFORMS.md, or SUPPORT.md file, and no `docs/` directory. The only governance-flavored artifact is an `OWNERS` file inherited from the AOSP mirror relationship (`jmtrivi@google.com`, plus an AOSP janitors include), which reflects Android/Google's internal review process for the mirror, not an active governance body for the standalone GitHub project. Martin Storsjo is the sole gatekeeper for the public repository. `documentation/` contains only two codec-spec PDFs (`aacDecoder.pdf`, `aacEncoder.pdf`), not platform or build documentation.

**Corporate involvement:** Effectively none beyond Fraunhofer's original authorship and the AOSP merge relationship. All recent commits (CMake fixes, CI expansion to aarch64/macOS/MSVC-arm64 through 2025-2026) are authored by Martin Storsjo; his employer is not stated in the repository.

**Community culture on new ports:** Architecture-specific contributions have been accepted historically: s390x SIMD support was added via [PR #159](https://github.com/mstorsjo/fdk-aac/pull/159) (merged December 2023, approximately 500 lines of vector intrinsics), SPARC architecture detection via [PR #178](https://github.com/mstorsjo/fdk-aac/pull/178) (merged February 2025), and an AArch64 assembly optimization was attempted via [PR #47](https://github.com/mstorsjo/fdk-aac/pull/47) (closed, not merged). No one has filed a RISC-V optimization request, and no contributor is currently working on one. The maintainer has been actively broadening CI/architecture coverage (aarch64, MSVC arm64) through 2025-2026, which suggests general openness to new-architecture work via the standard PR process, but nothing RISC-V-specific has ever been proposed or discussed.

**License:** Fraunhofer FDK AAC Codec Library license (BSD-style redistribution terms per the repository `NOTICE` file). Source must be made available alongside binaries, the "Fraunhofer FDK AAC" name must be altered in modified versions, and the license explicitly states no patent license is granted for encoder/decoder use (patent licensing must be obtained separately via Via Licensing). This restricts which distributions can ship it in default/free sections, independent of architecture. The AOSP-inherited `METADATA` file also flags `license_type: BY_EXCEPTION_ONLY`, an AOSP-internal constraint on Google's own use, not one governing public GitHub consumers.

**RISE Project involvement:** None. Confirmed by direct enumeration of the full RISE blog post history (35 posts via the WordPress sitemap, 2024-05-15 through 2026-09-28) with no post mentioning libfdk-aac, fdk-aac, or audio/AAC codec work; by absence from the [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) (85 packages, none audio-codec related, and not applicable in any case since libfdk-aac is not a Python package); and by a zero-result GitHub search for libfdk-aac repositories in the `riseproject-dev` org. libfdk-aac and Fraunhofer do not appear on the [RISE members list](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Institute of Software Chinese Academy of Sciences, Canonical, Douyin/ByteDance, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-05-13 | Single commit `3aabcb6abd` adds RISC-V architecture detection to `libFDK/include/FDK_archdef.h`: 6 preprocessor `#define` lines selecting 16-bit lookup tables and 32x16 multiply preference (generic C path, no SIMD) | [commit 3aabcb6abd](https://github.com/mstorsjo/fdk-aac/commit/3aabcb6abd1b32344370758aaae424735ca061a6) |
| 2022-05-13 | Commit authored by Zhang Ye (haocheng.zy@alibaba-inc.com), committed by Mao Han (han_mao@linux.alibaba.com), both at Alibaba | [commit 3aabcb6abd](https://github.com/mstorsjo/fdk-aac/commit/3aabcb6abd1b32344370758aaae424735ca061a6) |
| 2023-2026 | Debian and Ubuntu package the codec as part of releases 2.0.2/2.0.3 and build riscv64 `.deb` packages using the generic C fallback path, current through Ubuntu 26.04 "resolute" | [Debian tracker](https://tracker.debian.org/pkg/fdk-aac), [Ubuntu 26.04 resolute package page](https://packages.ubuntu.com/resolute/riscv64/libfdk-aac2) |

No further RISC-V-related commit, issue, or PR exists anywhere in the repository history. Confirmed repo-wide by `git grep -i riscv` against a fresh clone (HEAD `2212850`, 2026-09-26): exactly one match, the `FDK_archdef.h` line above. GitHub commit search (`riscv repo:mstorsjo/fdk-aac`) independently returns 0 results.

The port is fully upstream in the narrow sense that the 2022 architecture-detection commit is on `master`. It is not fully upstream in any engineering sense: there is no riscv64 CI, no SIMD optimization, and no RISC-V contributor actively maintaining the target. The 2022 commit is the entirety of RISC-V-specific work ever done on this project.

---

## 3. Upstream Support Tier

The project has no documented tier policy; no PLATFORMS.md, SUPPORT.md, or equivalent exists.

**Evidence-based tier assignment:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner in upstream repo | Yes (`ubuntu-latest`) | Yes (`ubuntu-24.04-arm`, macOS universal, MSVC ARM64, llvm-mingw aarch64) | No |
| SIMD/intrinsic optimization | Yes (`x86/` headers) | Yes (`arm/` headers and `.cpp` files) | No (generic C fallback only) |
| Official GitHub release binaries | No (no GitHub releases exist for any architecture; source-tag-only project) | No | No |
| Architecture characterization in `FDK_archdef.h` | Yes (full) | Yes (full) | Yes (6 lines, 2022) |
| Distro binary packages | Yes (all major distros) | Yes (all major distros) | Yes: Debian sid/trixie, Ubuntu 24.04 (noble) and 26.04 (resolute) |

riscv64 compiles, links, and produces correct output via the generic C fallback path, and is packaged by at least two major distributions, but receives zero upstream CI coverage and zero SIMD acceleration. It sits below amd64/arm64 as a third-tier target: functionally supported through downstream build farms, not through any upstream engineering investment.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libfdk-aac is a fixed-point AAC codec. Its performance-critical operations are: fixed-point multiply (32x16, 32x32, MLA), fixed-point multiply-accumulate for filter banks, complex multiply for the MDCT/FFT butterfly, arithmetic shift with saturation (scale), count-leading-zeros (clz) for normalization, absolute value (abs), and FFT scramble. Each has architecture-specific intrinsic implementations for ARM, MIPS, x86, and (partially) PowerPC. None has a RISC-V implementation.

**Architecture-specific file inventory** (verified by direct repository listing against HEAD `2212850`):

| Arch | Header files (`libFDK/include/<arch>/`) | Implementation files (`libFDK/src/<arch>/`) | Total |
|------|---|---|---|
| x86 | 4 (`abs_x86.h`, `clz_x86.h`, `fixmul_x86.h`, `fixpoint_math_x86.h`) | 0 | 4 |
| arm | 6 (`clz_arm.h`, `scale_arm.h`, `fixmul_arm.h`, `fixmadd_arm.h`, `scramble_arm.h`, `cplx_mul_arm.h`) | 2 (`scale_arm.cpp`, `fft_rad2_arm.cpp`) | 8 |
| riscv | 0 | 0 | 0 |

arm64 is the most complete port (intrinsic headers plus standalone `.cpp` implementations). x86 has intrinsic headers only. riscv64 has zero files of either kind, and no `libFDK/include/riscv/` or `libFDK/src/riscv/` directory exists.

**Per-component status:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| abs | intrinsics | generic (no dedicated file) | missing, generic C |
| clz | intrinsics (`__builtin_clz`) | intrinsics (`__builtin_clz` + ARM hint) | missing, generic C loop |
| fixmul (32x16) | intrinsics | intrinsics | missing, 64-bit C cast fallback |
| fixmadd | generic (no dedicated file) | intrinsics | missing, generic C |
| fixpoint_math | intrinsics | generic (no dedicated file) | missing, generic C |
| scale (shift+sat) | generic (no dedicated file) | intrinsics + dedicated `.cpp` | missing, generic C |
| cplx_mul (FFT) | generic (no dedicated file) | intrinsics | missing, generic C |
| FFT scramble | generic (no dedicated file) | intrinsics | missing, generic C |
| Architecture tuning (`FDK_archdef.h`) | full | full | scalar flags only (16-bit tables, MULT_32x16 preference); no SIMD/RVV |

**ISA extensions used on riscv64:** none. The 2022 commit selects `ARCH_PREFER_MULT_32x16`, `SINETABLE_16BIT`, `POW2COEFF_16BIT`, `LDCOEFF_16BIT`, and `WINDOWTABLE_16BIT`, compile-time flags that cause the generic C code to use 16-bit ROM tables (reducing memory bandwidth) and prefer 32x16 over 32x32 multiplies. No Zba, Zbb, Zbc, or RVV (Vector) extension is referenced anywhere in the repository; confirmed by GitHub code search across the terms `riscv`, `riscv64`, `rvv`, `vfloat32m1_t`, `zbb`, `rv64`, `__riscv_vector`, and `.S`-extension files, all returning either zero matches or only the single `FDK_archdef.h` hit.

**Functional correctness:** the codec compiles and runs on riscv64 via the generic C path. Debian and Ubuntu build it successfully as part of routine package builds. No known correctness bugs exist for riscv64 (Section 11).

**Performance:** no benchmark data exists. Multiple targeted searches (GitHub issue/PR search, general web search across 2024-2026, academic search for RVV-intrinsic benchmark suites, and the RISE Project blog) found zero cycles/frame, fps, or throughput figures for libfdk-aac on any riscv64 silicon. General RVV benchmark literature exists (for example arXiv:2511.18867, "VecIntrinBench", showing 2.98x-78x speedups on generic kernels such as memcpy and matrix operations), but none of it covers libfdk-aac or any AAC codec. Because every hot path (fixmul, cplx_mul/FFT, scale, clz, abs) runs generic scalar C on riscv64, the absence of benchmark data is consistent with the absence of any comparative performance engineering on this target. Data not available: no published cycles/frame figures for libfdk-aac on any riscv64 silicon.

---

## 5. Build System, Cross-Compilation, and Toolchain

libfdk-aac supports two build systems, autoconf/automake (`configure.ac`, `Makefile.am`, `autogen.sh`) and CMake (`CMakeLists.txt`, minimum version 3.5.1, `>= 3.15` recommended). Neither has any riscv64-specific logic; a direct read of `CMakeLists.txt` at HEAD `2212850` confirms only 4 build options exist in total, none architecture-related:

```
option(BUILD_SHARED_LIBS "Build shared library" ON)
option(BUILD_PROGRAMS "Build extra utilities" OFF)
option(FDK_AAC_INSTALL_CMAKE_CONFIG_MODULE "Install CMake package configuration file" ON)
option(FDK_AAC_INSTALL_PKGCONFIG_MODULE "Install pkg-config .pc file" ON)
```

No `CMAKE_SYSTEM_PROCESSOR` branch, toolchain file, or `-DUSE_X=OFF` pattern exists anywhere in the repository.

**Cross-compilation with autoconf:**

```
autoreconf -fi
./configure \
  --host=riscv64-linux-gnu \
  --prefix=/usr \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++ \
  AR=riscv64-linux-gnu-ar
make -j$(nproc)
```

**Cross-compilation with CMake:**

```
cmake -S . -B build \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_INSTALL_PREFIX=/usr \
  -DBUILD_PROGRAMS=OFF
cmake --build build -j$(nproc)
```

No riscv64-specific CMake toolchain file exists in the repository, and none is required because the codebase has no `CMAKE_SYSTEM_PROCESSOR` branches to select.

**Toolchain requirements:** C++98 minimum. No minimum GCC or Clang version is documented anywhere in the repository for any architecture, riscv64 included; CI simply uses whatever compiler ships on `ubuntu-latest` / `ubuntu-24.04-arm` / `macos-latest`. GCC riscv64 support has been complete since GCC 7. On Debian/Ubuntu, `gcc-riscv64-linux-gnu` and `g++-riscv64-linux-gnu` are the standard cross-toolchain packages.

**QEMU:** no QEMU setup exists in upstream CI; a repo-wide case-insensitive search for "qemu" returns zero matches. To run the test suite on a cross-compiled riscv64 binary, `qemu-riscv64-static` with binfmt_misc registration would need to be set up manually; no such script is provided by the project.

**Known build failures on riscv64:** none reported. Zero issues and zero PRs in the tracker mention a riscv64 build failure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| AAC-LC decode | Yes | Yes | Yes |
| HE-AACv1 decode (SBR) | Yes | Yes | Yes |
| HE-AACv2 decode (PS) | Yes | Yes | Yes |
| AAC-LC encode | Yes | Yes | Yes |
| HE-AACv1 encode | Yes | Yes | Yes |
| SIMD-accelerated fixed-point multiply | Yes (x86 intrinsics) | Yes (ARM intrinsics) | No (generic C) |
| SIMD-accelerated FFT/MDCT | Partial (complex mul) | Partial (complex mul, scramble) | No |
| SIMD-accelerated scale/shift | No (generic C) | Yes (ARM intrinsics) | No |
| clz hardware acceleration | Yes | Yes | No (generic C loop) [NEEDS VERIFICATION: GCC may still emit a riscv64 `clz`-class instruction from `__builtin_clz` without an explicit dispatch path; this was not independently tested against a Zbb-capable target] |
| 16-bit ROM tables (memory optimization) | Yes | Yes | Yes (set by the 2022 commit) |
| CI-validated correctness | Yes | Yes (macOS arm64, MSVC ARM64) | No |

**Functional gaps:** none. All codec features work on riscv64 via the generic C path.

**Performance gaps:** every SIMD-accelerated hot path falls back to generic C on riscv64. The magnitude of the regression relative to arm64/NEON or amd64 cannot be quantified because no benchmark data exists (Section 4).

**Security hardening gaps:** no riscv64-specific stack protection, shadow call stack, or CFI configuration exists in the build system. This is not a riscv64-specific regression: neither arm64 nor amd64 has project-level security hardening configuration either. Data not available: no published security audit of the riscv64 code path.

**Floating-point / NaN semantics:** the codec is fixed-point throughout; floating point is not used in the audio pipeline, so NaN-sensitivity issues structurally do not apply. Consistent with this, a GitHub issue search for "nan" in the repository returns zero results.

---

## 7. CI/CD Infrastructure

The upstream CI is a single file, [`.github/workflows/ci.yml`](https://github.com/mstorsjo/fdk-aac/blob/master/.github/workflows/ci.yml) (270 lines, triggered `on: [push, pull_request]` with no branch/label restriction). Verified by a fresh repository clone at HEAD `2212850` and a direct, complete read of the file, plus a case-insensitive `grep -in riscv` (zero matches) and a repository-wide `git grep -in riscv` (exactly one match, the `FDK_archdef.h` architecture-detection line, which is source code, not CI configuration). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

The job matrix comprises 15 jobs: `linux-autotools` and `linux-cmake` (runners `ubuntu-latest`, `ubuntu-24.04-arm`), `linux-sanitizers-gcc-autotools`, `linux-sanitizers-clang-cmake`, `macos-autotools`, `macos-cmake`, `mingw-cross-autotools`, `mingw-cross-cmake`, `msys-cmake`, `msvc-cmake`, `msvc-cmake-ninja-arm64`, `msvc-cmake-arm64`, `llvm-mingw` (aarch64-w64-mingw32 target), `linux-ffmpeg`, `check-archive`, and `check-install`.

**CI coverage by target:**

| Target | CI present | Runner | Test depth |
|--------|-----------|--------|------------|
| Linux x86_64 (autotools/cmake) | Yes | `ubuntu-latest` | Build + sanitizers (ASan, UBSan) |
| Linux aarch64 | Yes | `ubuntu-24.04-arm` | Build |
| macOS (universal) | Yes | `macos-latest` | Build |
| Windows x86_64/ARM/ARM64 (MSVC) | Yes | `windows-latest` | Build |
| MinGW x86_64 / aarch64 (llvm-mingw) | Yes | `ubuntu-latest` | Cross-compile |
| FFmpeg integration (x86_64) | Yes | `ubuntu-latest` | Build + functional |
| **riscv64 (any form)** | **No** | **None** | **None** |

**RISE runners:** not used. The RISE Project announced the [RISE RISC-V Runners program](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) on 2026-03-24 (free, native RISC-V CI on GitHub), with a six-weeks-in follow-up post on 2026-05-04. libfdk-aac does not use them; no evidence of any onboarding attempt exists.

**QEMU emulation in CI:** not present.

Adding riscv64 CI would require either a QEMU-based cross-compilation job (functional validation only) or onboarding to the RISE RISC-V Runners program (functional and, if native hardware is used, performance validation).

---

## 8. Distribution and Release Status

**GitHub releases:** none. Confirmed directly against `https://github.com/mstorsjo/fdk-aac/releases` ("There aren't any releases here"). The project ships source only via git tags; no binary release assets of any kind exist for any architecture, so there is nothing to check for riscv64 release-asset naming.

**Distribution packages:**

| Distribution | Package name | riscv64 available | Version | Notes |
|---|---|---|---|---|
| [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/resolute/riscv64/libfdk-aac2) | `libfdk-aac2`, `libfdk-aac-dev` | Yes | 2.0.2-3~ubuntu5 | Verified via the architecture-specific download page: real binary, 462.1 kB package size, 780.0 kB installed size, live download link. Also ships for amd64, arm64, armhf, i386, ppc64el, s390x |
| [Ubuntu 24.04 "noble"](https://packages.ubuntu.com/search?keywords=libfdk-aac&suite=noble) | `libfdk-aac2`, `libfdk-aac-dev` | Yes | 2.0.2-3~ubuntu4 | 460.4 kB download |
| [Debian sid/trixie](https://tracker.debian.org/pkg/fdk-aac) | `libfdk-aac2t64`, `libfdk-aac-dev` | Yes | 2.0.3-1 | non-free/misc section |
| openSUSE Tumbleweed | `libfdk-aac` (RPM) | Reported available | 2.0.3 | [NEEDS VERIFICATION: single source, not independently confirmed via a direct openSUSE package-page fetch in this research pass] |
| [Arch Linux RISC-V port](https://archriscv.felixc.at/?q=fdk-aac) | `libfdk-aac` | No | 2.0.3-2 (x86_64 only, in Arch `extra`) | Not carried in the archriscv community port; checked directly, homepage and search return no match |
| PyPI | n/a | n/a | n/a | `https://pypi.org/pypi/libfdk-aac/json` returns HTTP 404; no Python wrapper exists (fdk-aac is a C library, not a Python package) |
| Fedora | `fdk-aac` | Unknown | Unknown | Data not available: Koji build system was not accessible during research |

All riscv64 binaries listed above are built from unmodified upstream source via the generic C fallback path; no riscv64-specific packaging patches were identified in any distribution's packaging metadata.

**To get a working riscv64 binary:**

- Ubuntu 24.04/26.04: `apt install libfdk-aac-dev` (universe repo)
- Debian sid/trixie: `apt install libfdk-aac-dev` (non-free repo must be enabled)
- Any other distribution: build from source using the cross-compilation steps in Section 5

No native riscv64 hardware validation by the Debian or Ubuntu build farms was confirmed in this research; distro builds are compile-only unless the packaging metadata states otherwise [NEEDS VERIFICATION: whether Debian's `rv-manda-03` buildd or Ubuntu's build infrastructure runs the fdk-aac test suite under emulation as part of the package build].

---

## 9. Dependencies

libfdk-aac is intentionally self-contained: all codec subsystems (libAACdec, libAACenc, libSBR, libMpegTP, libFDK, libSYS) are bundled within the repository, and there is no external codec/DSP library dependency. The only dependencies are the toolchain and runtime C/C++ libraries.

| Dependency | Role | riscv64 status |
|---|---|---|
| GCC (build-dependency, critical) | Primary C/C++ compiler used by upstream CI and by Debian/Ubuntu package builds | Complete riscv64 support since GCC 7; ships as the standard cross/native toolchain on all riscv64-supporting distributions, no blocking issues |
| CMake (build-dependency, critical) | One of the two supported build systems (minimum 3.5.1) | Host-tool only, not cross-compiled; ships for riscv64 as a standard build dependency on Debian/Ubuntu, no blocking issues |
| autoconf (build-dependency, optional) | Part of the alternative autotools build path (`autogen.sh` / `configure.ac`) | Host-tool only; ships for riscv64 as a standard build dependency, no blocking issues |
| automake (build-dependency, optional) | Part of the alternative autotools build path | Host-tool only; ships for riscv64 as a standard build dependency, no blocking issues |
| GCC (runtime-dependency, critical) | Supplies the libstdc++ C++ runtime that all fdk-aac sources link against (the codebase is entirely C++) | libstdc++ ships in every riscv64 GCC toolchain and every riscv64 distribution runtime image; no blocking issues |
| glibc (runtime-dependency, critical) | C library; also supplies libm, used only for `sin()` at fixed-point table-generation time (not in the real-time encode/decode path) | glibc's riscv64 port is first-class and ships as a standard package on Debian, Ubuntu, Arch RISC-V, and Fedora; see the dedicated [glibc RISC-V readiness report](./glibc.md) for detail; no blocking issues |

No JIT backend, external SIMD library, numerics library, crypto library, compression library, or external memory allocator exists anywhere in fdk-aac's dependency chain. The per-architecture intrinsic headers under `libFDK/include/{x86,arm,mips,ppc}/` are bundled, optional, in-tree source files, not external dependencies; none has a riscv64 equivalent, which is the project's actual performance gap (Section 4), not a dependency-availability problem. Because every listed dependency (GCC, CMake, autoconf, automake, glibc) already has mature, first-class riscv64 support across major distributions, the dependency chain is not a blocker to libfdk-aac's riscv64 readiness; the gap is entirely in upstream's own lack of riscv64 CI and SIMD optimization.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:** none. GitHub issue and PR searches for "riscv" and "riscv64" in `repo:mstorsjo/fdk-aac` return zero results, confirmed independently across multiple passes this session (GitHub MCP search tools and direct github.com web searches, the latter used as a substitute during periods when the MCP search tool was rate-limited). A search for "nan" also returns zero results, consistent with the codec being entirely fixed-point.

**Open issue potentially relevant to any future riscv64 SIMD work:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#166](https://github.com/mstorsjo/fdk-aac/issues/166) | Are CPU specific optimizations with -mcpu supported? | Open (filed 2024-02-08) | Medium | Reports a performance regression on aarch64 caused by `-mcpu` flags disabling conditional SIMD paths. Not RISC-V-specific, but a cautionary precedent for any future riscv64 SIMD/RVV PR that gates code on compiler `-march`/`-mcpu` flags |

**Open PRs (none RISC-V related):**

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| [#168](https://github.com/mstorsjo/fdk-aac/pull/168) | Visual Studio / NuGet packaging | Open (Feb 2024) | Unrelated to riscv64 |
| [#139](https://github.com/mstorsjo/fdk-aac/pull/139) | Meson build system | Open (Oct 2021) | Would affect all targets if merged; stalled |
| [#40](https://github.com/mstorsjo/fdk-aac/pull/40) | Whitespace cleanup | Open (Jan 2016) | Stale |
| [#37](https://github.com/mstorsjo/fdk-aac/pull/37) | Typo fix | Open (Jan 2016) | Stale |

No correctness bugs are open for riscv64, and no riscv64 build failure has ever been reported in the issue tracker.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** none. The generic C path compiles and runs correctly on riscv64 today. A contributor could submit a PR adding `libFDK/include/riscv/` headers with RVV intrinsics without any known upstream technical obstacle.

**Stated objections:** none on record. No maintainer has expressed opposition to riscv64 work in any issue, PR, or commit. The project's acceptance of s390x SIMD ([PR #159](https://github.com/mstorsjo/fdk-aac/pull/159)) and SPARC detection ([PR #178](https://github.com/mstorsjo/fdk-aac/pull/178)) establishes precedent for accepting new-architecture contributions.

**Organizational blockers:** the project is a single-maintainer personal repository (Martin Storsjo). PR review throughput is low: two of the four currently open PRs date to January 2016 and remain unmerged nearly a decade later. A RISC-V optimization PR could sit in review for an extended period. The maintainer has expressed no RISC-V-specific interest anywhere in the available record.

**License blocker:** the Fraunhofer FDK AAC license's no-patent-license term restricts which distributors can ship riscv64 (or any-architecture) binaries in default/free repository sections, but it does not block upstream code contribution or building from source, independent of architecture. For internal chip-company use, or for Debian's non-free channel, the license is workable as-is.

**Acceptance probability:** high for a minimal PR (riscv64 CI job, QEMU-based). Medium-to-low for a full RVV optimization PR, given the low maintainer review bandwidth evidenced by the multi-year-stale open PRs and the absence of a second reviewer.

---

## 13. Readiness Assessment

- **Color:** Yellow (clean-distro-build)
- **Release provider:** distro

**Justification:** Upstream mstorsjo/fdk-aac has no riscv64 CI at all: its only CI file, [.github/workflows/ci.yml](https://github.com/mstorsjo/fdk-aac/blob/master/.github/workflows/ci.yml), has zero riscv/riscv64 matches across its 15 jobs (confirmed by direct file read and repo-wide `git grep -i riscv`, which found only the unrelated `#elif defined(__riscv)` preprocessor stub in `libFDK/include/FDK_archdef.h`), and it publishes no GitHub Releases or binary assets of any kind. Per the distribution floor used by this grading methodology, this would default to orange, except that a Linux distribution builds it from unmodified upstream source: Ubuntu 26.04 "resolute" ships `libfdk-aac2`/`libfdk-aac-dev` 2.0.2-3~ubuntu5 for riscv64 as a real downloadable binary ([packages.ubuntu.com/resolute/riscv64/libfdk-aac2](https://packages.ubuntu.com/resolute/riscv64/libfdk-aac2), 462.1 kB, verified via direct fetch of the architecture-specific download page), built via the project's generic C fallback path with no riscv64-specific packaging patches identified. This satisfies the "clean-distro-build" yellow floor rather than the patched/uncertain "downstream-only" orange tier. libfdk-aac is a fixed-point AAC codec whose value proposition is standards-compliant encode/decode correctness (it is the Fraunhofer reference implementation), not RISC-V-specific speed superiority over a simpler alternative, so this is not graded as an optimization-purpose project, notwithstanding that its only RISC-V-aware code (`FDK_archdef.h` lines 225-231, a 2022 Alibaba commit) is limited to generic table-format/multiply-preference flags with no RVV/SIMD implementation.

**Pending work that could change the grade:** no open PRs or issues target riscv64 (the repository's 4 open PRs, #37, #40, #139, #168, and its issues are all unrelated; the one semi-relevant open issue, [#166](https://github.com/mstorsjo/fdk-aac/issues/166), on `-mcpu` flags disabling conditional SIMD on aarch64, is a cautionary precedent for any future riscv64 SIMD work, not active riscv64 work itself). No RISE Project involvement was found (absent from the RISE blog, the wheel builder list, and `riseproject-dev` org repos/issues). No upstream riscv64 CI job or tracking issue exists to escalate this beyond yellow; adding a QEMU-based riscv64 CI job to `ci.yml`, or onboarding to RISE RISC-V Runners, would be the concrete next step toward blue.

---

## 14. Investment Analysis

RISE has done nothing for libfdk-aac (Section 1). All work scoped below is net-new; none of it is already covered by RISE funding or infrastructure.

### 14.1 Functional Enablement

Functional correctness on riscv64 is already complete via the 2022 Alibaba commit and is already distributed by Ubuntu and Debian. No additional functional-enablement work is required.

### 14.2 Performance Optimization

The performance gap relative to arm64 is the primary technical deficiency, and it is unquantified because no benchmark exists. Priority order for hot-path optimization, based on the codec's operation profile (Section 4):

1. `fixmul.h`, 32x16 and 32x32 fixed-point multiply, called in every filter bank and spectral-coefficient operation. An RVV widening multiply (`vwmul`) would directly accelerate this.
2. `cplx_mul.h`, complex multiply for MDCT/FFT butterflies. RVV interleaved vector arithmetic.
3. `scale.h`, arithmetic right shift with saturation. Zbb extension (`sra` + `max`) or RVV.
4. `clz.h`, count leading zeros. Zbb's single-instruction `clz`.
5. `abs.h`, absolute value. Zbb's single-instruction `abs`.
6. FFT index scramble (arm-equivalent `scramble_arm.h`). Lower priority.

The analogous s390x SIMD PR (#159) was approximately 500 lines. A complete RVV optimization covering items 1-5 is estimated at 600-900 lines across 5 header files, with no prior art in the upstream repository to build from.

### 14.3 CI/CD Infrastructure

A QEMU-based riscv64 CI job can be added to `.github/workflows/ci.yml` with a `qemu-user-static` cross-compile step; this validates correctness only, not performance. A native riscv64 CI job using the RISE RISC-V Runners program (announced 2026-03-24, six-weeks-in update posted 2026-05-04) would provide both correctness and performance signal, but libfdk-aac has not onboarded to it and no evidence of an attempt exists.

### 14.4 Ecosystem Enablement

libfdk-aac has no language-level package ecosystem: no PyPI package (confirmed 404), no npm package, no Maven artifact. Its only distribution surface is system `.deb`/`.rpm` packages, which Debian and Ubuntu already provide for riscv64 (Section 8). No ecosystem-enablement work is required beyond what distributions already do.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None; generic C path is correct and already ships in Debian/Ubuntu riscv64 | 0 | n/a | n/a |
| Performance | Implement `libFDK/include/riscv/` headers with RVV intrinsics for fixmul, cplx_mul, scale, clz, abs | 4-6 | Compiler/codec engineer with RVV experience | High: required for real-time use on embedded or mobile riscv64 |
| Performance | Benchmark vs arm64 NEON to quantify the gap before and after optimization | 1 | Performance engineer | High: justifies and validates the optimization work |
| CI/CD | Add a riscv64 QEMU cross-compile job to upstream `ci.yml` and submit as a PR | 0.5 | Any engineer | Medium |
| CI/CD | Onboard to RISE RISC-V Runners for native-hardware CI | 1 | DevOps / RISE liaison | Medium |
| Distro packaging | Request Arch Linux RISC-V (archriscv) package addition | 0.25 | Any contributor | Low |
| Upstream PR | Submit the performance-optimization PR and shepherd it through review given low maintainer bandwidth | 1-2 (review cycles) | Senior engineer | High: blocks upstream acceptance |

Total estimated effort: 7.75-10.75 person-weeks for a complete, upstreamed, CI-validated RVV optimization.

---

## 15. References

- [mstorsjo/fdk-aac repository](https://github.com/mstorsjo/fdk-aac)
- [Commit 3aabcb6abd, RISC-V architecture detection (Zhang Ye / Alibaba, 2022-05-13)](https://github.com/mstorsjo/fdk-aac/commit/3aabcb6abd1b32344370758aaae424735ca061a6)
- [PR #159, s390x SIMD support (merged Dec 2023)](https://github.com/mstorsjo/fdk-aac/pull/159)
- [PR #178, SPARC architecture detection (merged Feb 2025)](https://github.com/mstorsjo/fdk-aac/pull/178)
- [PR #47, AArch64 assembly optimization (closed, not merged)](https://github.com/mstorsjo/fdk-aac/pull/47)
- [PR #168, Visual Studio / NuGet packaging (open)](https://github.com/mstorsjo/fdk-aac/pull/168)
- [PR #139, Meson build system (open)](https://github.com/mstorsjo/fdk-aac/pull/139)
- [Issue #166, CPU-specific optimizations with -mcpu (open, Feb 2024)](https://github.com/mstorsjo/fdk-aac/issues/166)
- [Upstream CI workflow, .github/workflows/ci.yml](https://github.com/mstorsjo/fdk-aac/blob/master/.github/workflows/ci.yml)
- [GitHub Releases page (no releases exist)](https://github.com/mstorsjo/fdk-aac/releases)
- [Ubuntu 26.04 resolute, libfdk-aac2 riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libfdk-aac2)
- [Ubuntu 24.04 noble package search, libfdk-aac](https://packages.ubuntu.com/search?keywords=libfdk-aac&suite=noble&searchon=names&section=all)
- [Debian package tracker, fdk-aac](https://tracker.debian.org/pkg/fdk-aac)
- [Arch Linux RISC-V port tracker](https://archriscv.felixc.at/?q=fdk-aac)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners, six weeks in (2026-05-04)](https://riseproject.dev/2026/05/04/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [glibc RISC-V readiness report](./glibc.md)