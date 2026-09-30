---
title: libvorbis
parent: Project Reports
color: yellow
dependencies:
  - name: libogg
    relation: runtime-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: GNU Libtool
    relation: build-dependency
    criticality: optional
  - name: pkg-config
    relation: build-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libvorbis" %}

# libvorbis

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libvorbis<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libvorbis is the reference implementation of the Vorbis audio codec, a lossy audio compression format defined by the [Vorbis I specification](https://xiph.org/vorbis/doc/Vorbis_I_spec.html). It provides encoding, decoding, and file-access APIs (libvorbis, libvorbisenc, libvorbisfile). The library is pure portable ISO C90 with no architecture-specific SIMD dispatch infrastructure anywhere in its own source tree, and no architecture-specific assembly except a legacy x86 float-to-integer conversion path in `lib/os.h` (i386 x87 inline asm, MSVC x86 inline asm, and x86-64 SSE2 intrinsics). Direct inspection of the `lib/` directory tree confirms there is no `arch/`, `arm/`, `mips/`, or `riscv/` subdirectory anywhere in the codebase.

**Governance:** libvorbis is developed by the [Xiph.Org Foundation](https://xiph.org/), a US 501(c) nonprofit (principal listed officer Christopher "Monty" Montgomery). There is no formal governance document, no MAINTAINERS file, and no CODEOWNERS/CONTRIBUTING file in the repository (confirmed via a full clone of `gitlab.xiph.org/xiph/vorbis`). Governance is informal, BDFL-and-core-committer style. Of 1,600 total commits, 1,452 come from `@xiph.org` addresses. The current active committer is Timothy B. Terriberry (`tterribe@xiph.org`); the most recent commit is dated 2026-08-03 ("Fix use-after-free in `ov_pcm_page_seek`"), so the project is still actively, if narrowly, maintained. Other committer domains in the history include thaumas.net (59 commits), gmail.com (20), umn.edu (12), adrian-broher.net (12), VideoLAN (6), and Mozilla (2). A single one-off commit from `qti.qualcomm.com` (2026-03-02, "Support arm64 on windows") is unrelated to RISC-V. No sustained corporate sponsor relationship (e.g. SiFive, Google, Red Hat employees as committers) was found in the commit log.

**License:** BSD-style 3-clause (copyright 1994-2020 ongoing, Xiph.Org Foundation).

**RISE membership:** Xiph.Org/libvorbis is not a RISE member. RISE Premier members are Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent; General members are Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, and ZTE. No audio/codec project is listed. A full sweep of the [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml) (35 posts, 2024-05 through 2026-09-28) found no post mentioning libvorbis, vorbis, or audio codecs.

**Community culture on new ports:** No formal platform tier policy or support matrix exists. The implicit stance is "any platform a C compiler supports is supported." Maintainer bandwidth is low: the only open RISC-V-related pull request, [PR #127](https://github.com/xiph/vorbis/pull/127) (opened 2026-06-19), had received zero review comments from any maintainer as of this writing.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2020 | libvorbis builds on riscv64 via the generic scalar C fallback; no dedicated upstream code change required | A full `git log --all -i --grep/-S "riscv"` across all 1,600 commits returns zero matches |
| 2020-07-04 | Last upstream release: v1.3.7 | [GitHub release](https://github.com/xiph/vorbis/releases/tag/v1.3.7) |
| 2025-07-04 | JuliaPackaging/Yggdrasil PR #11597 merged, adding riscv64 to the Julia `Vorbis_jll` build matrix | [PR #11597](https://github.com/JuliaPackaging/Yggdrasil/pull/11597) |
| 2026-06-19 | PR #127 opened: "Avoid leaking x86_64 SSE2 paths into forced RISC-V probes" | [PR #127](https://github.com/xiph/vorbis/pull/127) |

There is no RISC-V port history in the conventional sense: a full commit-history search (messages, paths, and content pickaxe) across the entire repository found zero riscv-related commits. The library has always compiled on riscv64 via the existing scalar fallback shared by every non-x86 target. PR #127 is the first explicit mention of RISC-V in the upstream repository, and it remains unmerged.

**Key contributors:** carlosqwqqwq authored PR #127 (external, no disclosed employer affiliation, single commit `9152baf`). eschnett (Julia community) authored the Yggdrasil packaging PR, merged by giordano; this touches only the downstream BinaryBuilder.jl recipe, not libvorbis source. No other contributor has touched riscv64-related work.

**Fully upstream:** The only libvorbis-source-level riscv64 change (PR #127) is not merged. The scalar fallback that makes riscv64 functional has always been upstream, unmodified. There is no out-of-tree riscv64 patch set known to exist.

## 3. Upstream Support Tier

libvorbis has no formal tier policy. There is no CI matrix, no official binary distribution for any architecture (source tarballs only), and no release-blocking test suite targeting specific architectures. Architecture support is implicit: if the C compiler works, the library works.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists upstream | Yes (`.gitlab-ci.yml`: autotools-gcc, autotools-clang, cmake) | No | No |
| Release-blocking tests | `make check` / `ctest` on x86_64 runners only | No | No |
| Official prebuilt binary | No (source tarballs only) | No | No |
| Architecture-specific code | Yes (x87 asm + SSE2 intrinsics) | No (scalar C) | No (scalar C) |
| Cross-compilation CI | Windows (`x86_64-w64-mingw32`) only | No | No |

riscv64 sits at the same implicit support level as arm64: functionally complete, but with zero upstream CI coverage of any kind.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libvorbis implements Vorbis encoding and decoding. The DSP-critical components are: MDCT (`lib/mdct.c`), small float FFT (`lib/smallft.c`), LPC/LSP analysis (`lib/lpc.c`, `lib/lsp.c`), floor curve synthesis (`lib/floor1.c`), and residue decode (`lib/res0.c`, `lib/codebook.c`). None of these has any SIMD dispatch infrastructure for any architecture, including amd64.

The only architecture-specific code in the entire codebase is the `vorbis_ftoi` float-to-integer conversion in `lib/os.h`, confirmed by direct fetch of that file:

| Implementation | Trigger condition | Method |
|---|---|---|
| x86 GCC i386 | `__i386__` | x87 inline assembly (`fnstcw`, `fldcw`, `fistl`) |
| x86 MSVC 32-bit | `_MSC_VER` + `_M_IX86` | `__asm { fld f; fistp i }` |
| x86-64 SSE2 | `__x86_64__` + `__SSE2_MATH__` (PR #127 additionally requires `!__riscv`) | `<emmintrin.h>`, `_mm_cvtsd_si32` |
| All others (riscv64, arm64, ppc64le, ...) | fallthrough | `(int)floor(f+.5)` in C |

**Component-level RISC-V status:**

| Component | File(s) | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Float-to-int conversion | `lib/os.h` | x87 asm + SSE2 intrinsics | scalar C | scalar C |
| MDCT | `lib/mdct.c` | scalar C | scalar C | scalar C |
| FFT (smallft) | `lib/smallft.c` | scalar C | scalar C | scalar C |
| LPC/LSP | `lib/lpc.c`, `lib/lsp.c` | scalar C | scalar C | scalar C |
| Floor synthesis | `lib/floor1.c` | scalar C | scalar C | scalar C |
| Residue decode | `lib/res0.c` | scalar C | scalar C | scalar C |

A GitHub code search scoped to `repo:xiph/vorbis` and `repo:xiph/vorbis-tools` for `riscv`, `riscv64`, and `rvv` returned zero results. No RVV (RISC-V Vector) intrinsics exist anywhere in the source tree. No `.S` assembly files exist for any non-x86 architecture. There are zero `#ifdef __riscv` guards in the codebase except the one PR #127 proposes to add to the SSE2 guard condition, and that PR's own description states explicitly it "does not add a RISC-V-specific optimized backend... not to change codec behavior or claim new architecture-specific acceleration."

The performance profile is structural, not riscv64-specific: x86-64 gets a hand-optimized SSE2 path only for the minor `vorbis_ftoi` rounding helper; every architecture, including amd64, uses the same scalar C for the compute-dominant MDCT and FFT. Compiler auto-vectorization (e.g. GCC `-march=rv64gcv` for RVV) is the only mechanism available to close any gap, and it is untested upstream.

## 5. Build System, Cross-Compilation, and Toolchain

**Autotools (primary build path), generic, no riscv64-specific variant exists:**

```
./autogen.sh
./configure
make
make check
make install
```

Cross-compiling adds the standard `--host=riscv64-linux-gnu` to `configure`; no riscv64-specific configure option exists. `configure.ac`'s `case $host in ... esac` block (lines 133-217) special-cases only `*86-*-linux*`, PowerPC SPE, PowerPC, SPARC, Darwin, and OS/2; `riscv64-*-linux-gnu` falls into the generic `*-*-linux*` branch, yielding:

```
DEBUG="-g -Wall -Wextra -D_REENTRANT -D__NO_MATH_INLINES -fsigned-char"
CFLAGS="-O3 -Wall -Wextra -ffast-math -D_REENTRANT -fsigned-char"
PROFILE="-pg -g -O3 -ffast-math -D_REENTRANT -fsigned-char"
```

No `-march=rv64gc`, `-mabi=lp64d`, or any other RISC-V-specific flag is set by `configure` or `CMakeLists.txt` anywhere in the build system.

**CMake (secondary build path):**

```
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=1
cmake --build build
```

The top-level `CMakeLists.txt` defines only three options: `BUILD_SHARED_LIBS` (default OFF), `BUILD_FRAMEWORK` (Apple only), and `INSTALL_CMAKE_PACKAGE_MODULE` (default ON), plus the implicit CTest `BUILD_TESTING` (default ON). No `-DUSE_*` style architecture flags exist. The only version floor anywhere in the repository is `cmake_minimum_required(VERSION 3.6)`.

**Toolchain version requirements:** No minimum GCC or Clang version is stated anywhere in `configure.ac`, `README.md`, `CMakeLists.txt`, or any CI config. `.gitlab-ci.yml` uses the `gcc:14` Docker Hub image for its x86_64 jobs, but this is an arbitrary CI choice, not a documented minimum. [NEEDS VERIFICATION] GCC 13+ can be inferred as a practical minimum from Debian's `gcc-riscv64-linux-gnu` cross toolchain used to build `libvorbis-dev` 1.3.7-3+b2 for riscv64, but this is not a stated upstream requirement.

**QEMU:** No QEMU references exist in any upstream CI configuration (`.gitlab-ci.yml`, `.travis.yml`, `appveyor.yml`) or anywhere else in the repository. No upstream riscv64 emulated testing is configured. There is no Dockerfile in the repository at all (confirmed across the full ~250-file tree).

**Known build failures:** None documented for riscv64. Debian's buildd infrastructure successfully built 1.3.7-3+b2 for riscv64 (`packages.debian.org/sid/riscv64/libvorbis-dev`, HTTP 200 confirmed by direct fetch). The PR #127 author reports cross-compiling with `riscv64-linux-gnu-gcc`, confirming 2/2 tests passed and `readelf` showing `Machine: RISC-V` on the resulting binaries; this was local/manual testing by the PR author, not something wired into project CI.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Vorbis decoding (correctness) | Complete | Complete | Complete | None |
| Vorbis encoding (correctness) | Complete | Complete | Complete | None |
| `vorbis_ftoi` conversion | x87 asm + SSE2 | Scalar C | Scalar C | Performance (minor) |
| MDCT throughput | Scalar C | Scalar C | Scalar C | Performance (shared RVV opportunity) |
| FFT throughput | Scalar C | Scalar C | Scalar C | Performance (shared RVV opportunity) |
| Floating-point semantics | IEEE 754 via SSE2 on x86-64 | IEEE 754 | IEEE 754 | None |
| Security hardening (stack protector, ASLR) | Distro build-flag dependent | Distro build-flag dependent | Distro build-flag dependent | None specific to riscv64 |

**Functional gaps:** None. The library is functionally complete on riscv64, running the same portable scalar C path used by every non-x86 architecture.

**Performance gaps:** The `vorbis_ftoi` scalar path adds minor function-call overhead relative to the single SSE2 instruction used on x86-64, but this operation is invoked during floor curve synthesis, not in the inner MDCT/FFT loop. The larger performance opportunity is RVV-accelerated MDCT and FFT, neither of which is optimized for any architecture, including amd64, in the current codebase.

**Correctness (non-architecture-specific):** [Issue #118](https://github.com/xiph/vorbis/issues/118) (open) documents a roughly 7-ULP discrepancy between the runtime-generated `floor1_inverse_dB_table` and the values in the Vorbis spec; this affects all platforms equally and has no merged resolution. `-ffast-math` is used by default on all architectures, including riscv64, which assumes no NaN/Inf inputs; no riscv64-specific floating-point anomaly was found.

## 7. CI/CD Infrastructure

No riscv64 CI exists upstream. This was confirmed by direct, line-by-line reads of all CI configuration files, and independently re-confirmed in a later adversarial pass.

| File | Status | riscv64 job |
|---|---|---|
| `.github/workflows/` | Does not exist (HTTP 404) | N/A |
| [`.gitlab-ci.yml`](https://github.com/xiph/vorbis/blob/master/.gitlab-ci.yml) (xiph/vorbis) | Exists; jobs: `autotools-gcc`, `autotools-gcc-builddir`, `autotools-clang`, `autotools-mingw`, `cmake`, all on `image: gcc:14` with `tags: [docker]` (x86_64 shared runners) | None |
| `.gitlab-ci.yml` (xiph/vorbis-tools) | Exists; jobs: `autotools-gcc`, `autotools-gcc-builddir`, `autotools-clang`, `autotools-enable-gcc-sanitizers`, same x86_64 image | None |
| `.travis.yml` (xiph/vorbis) | Exists; `os: [linux, osx]`, `compiler: [gcc, clang]` | None |
| `appveyor.yml` (xiph/vorbis) | Exists; `platform: Win32`, MSVC/CMake only | None |

The only cross-compilation target in any CI file is `autotools-mingw`, which targets Windows via `x86_64-w64-mingw32-gcc`, not riscv64. PR #127's diff touches only `lib/os.h` and `README.md`; it does not add, modify, or touch any CI file, so even the one open RISC-V-related PR adds no riscv64 CI coverage.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI job | Yes (GitLab CI, Travis) | No | No |
| QEMU-based emulation | No | No | No |
| RISE-provided runner | No | No | No |
| Downstream distro buildd | Debian, Ubuntu, Arch | Debian, Ubuntu | Debian sid, Ubuntu (resolute) |

RISE has no involvement with libvorbis CI infrastructure of any kind.

## 8. Distribution and Release Status

**Upstream releases:** xiph/vorbis ships source tarballs only. The last release is v1.3.7 (2020-07-04): `libvorbis-1.3.7.tar.gz`, `.tar.xz`, `.zip`. No prebuilt binaries for any architecture are distributed by upstream.

**Debian sid:** `libvorbis-dev` 1.3.7-3+b2 is published for riscv64, directly confirmed via [packages.debian.org/sid/riscv64/libvorbis-dev](https://packages.debian.org/sid/riscv64/libvorbis-dev) (HTTP 200). This is primary-source, machine-readable evidence that Debian's own buildd infrastructure produced a riscv64 binary from unmodified upstream source.

**Ubuntu 26.04 (resolute):** One research pass fetched [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libvorbis&suite=resolute&searchon=names&section=all) and reported riscv64 present for `libvorbis-dev`, `libvorbis0a`, `libvorbisenc2`, and `libvorbisfile3` (all version 1.3.7-3build2), alongside amd64, arm64, armhf, i386, ppc64el, and s390x. A later, independent verification pass could not reproduce this (three attempts returned HTTP 503), and separately flagged that the quoted evidence table in the original pass was truncated before "riscv64" actually appeared in the pasted text. **Discrepancy noted:** the Ubuntu-26.04-riscv64 claim is therefore [NEEDS VERIFICATION] pending a clean re-fetch; it is plausible given the confirmed Debian sid build of the same unmodified 1.3.7 source, but is not independently confirmed to the same standard as the Debian finding.

**Other distros:** Gentoo, openSUSE, and AUR (`android-riscv64-libvorbis`, an Android-target cross-compilation recipe, not a native Arch riscv64 package) are reported to carry riscv64 builds of libvorbis 1.3.7, per distro package listings; these were not independently re-verified this cycle and remain [NEEDS VERIFICATION]. HaikuPorts is reported (via a merged, unrelated PR referencing it in passing) to already carry `libvorbis-1.3.7-1` for riscv64; also [NEEDS VERIFICATION]. A direct check of the official Arch Linux RISC-V port (`archriscv.felixc.at`, `repo/core/`, `repo/extra/`, `repo/unsupported/`) found no `libvorbis` package in any of the three repos, so Arch's official RISC-V port does **not** currently carry libvorbis.

**PyPI:** No `libvorbis` package exists (`pypi.org/pypi/libvorbis/json` returns HTTP 404, and the RISE PyPI wheel-builder mirror redirects to the same 404). Not applicable: libvorbis is a C library, not a Python package.

**JuliaPackaging/Yggdrasil:** PR #11597 (merged 2025-07-04) adds riscv64 to the platform matrix for the `Vorbis_jll` wrapper, bumping the JLL version to 1.3.8+0 while the underlying upstream source stays 1.3.7. A resulting `Vorbis_jll` riscv64 release artifact was not independently confirmed (the `JuliaBinaryWrappers/Vorbis_jll.jl` releases page returned 404 on check), so treat this channel as plausible but not fully verified downstream.

**What a user must do to get a working riscv64 binary:** On Debian sid, `apt install libvorbis-dev` installs a confirmed riscv64 binary package with no additional steps. On Ubuntu 26.04, this is likely equivalent but unverified as of this report. On other distributions, build from the 1.3.7 source tarball using a standard `riscv64-linux-gnu` cross-compilation toolchain; no special flags are required.

## 9. Dependencies

libvorbis has one required runtime dependency and a small, fully optional build-tooling chain used only when building from git (source tarballs ship a pre-generated `configure`, so autoconf/automake/libtool are not needed for tarball builds). `configure.ac` hard-requires libogg via `PKG_CHECK_MODULES(OGG, ogg >= 1.0, ...)`, falling back to `XIPH_PATH_OGG`, with `AC_MSG_ERROR` if Ogg is not found; `vorbis.pc.in` carries `Requires.private: ogg`. `debian/control` lists `Build-Depends: ... libogg-dev (>> 1.1.0)`.

| Dependency | Role | riscv64 build status | riscv64 test status | riscv64 release status | Blocking issues |
|---|---|---|---|---|---|
| libogg | runtime-dependency, critical. Sole required link-time/runtime dependency (container/framing layer); hard-required in `configure.ac` and `debian/control` | Builds successfully: `libogg0` 1.3.6-2 and `libogg-dev` 1.3.6-2 published in Ubuntu 26.04 (resolute) riscv64, via Launchpad archive API (used as a substitute for the unreachable project-graph query tool); Debian sid 1.3.6-2+b1 also reported | Not independently verified (autopkgtest results page is JS-rendered; not scraped this session) | Available now in Ubuntu 26.04 main, riscv64, and Debian sid | None found |
| autoconf | build-dependency, optional. Needed only for `./autogen.sh` git builds, not release tarballs | `autoconf` 2.72-3.1ubuntu2 published in Ubuntu 26.04 (resolute) riscv64 | Not independently verified; standard Ubuntu toolchain package present on every architecture's base build set | Available now in Ubuntu 26.04 main, riscv64 | None found |
| automake | build-dependency, optional. Git builds only | `automake` 1:1.18.1-3build1 published in Ubuntu 26.04 (resolute) riscv64 | Not independently verified | Available now in Ubuntu 26.04 main, riscv64 | None found |
| libtool | build-dependency, optional. Git builds only; `configure.ac` calls `AC_LIBTOOL_WIN32_DLL` / `AC_PROG_LIBTOOL` | `libtool` 2.5.4-9 published in Ubuntu 26.04 (resolute) riscv64 | Not independently verified | Available now in Ubuntu 26.04 main, riscv64 | None found |
| pkg-config | build-dependency, optional. `configure.ac` uses `PKG_PROG_PKG_CONFIG` / `PKG_CHECK_MODULES` to locate Ogg | `pkg-config` 2.5.1-4 (source package `pkgconf`) published in Ubuntu 26.04 (resolute) riscv64 | Not independently verified | Available now in Ubuntu 26.04 main, riscv64 | None found |
| CMake | build-dependency, optional. Alternative build system to autotools; `cmake_minimum_required(VERSION 3.6)` | CMake is broadly available for riscv64 across major distributions (Debian, Ubuntu); not independently re-checked at a specific version this cycle | Not independently verified | Available in Debian/Ubuntu main, riscv64 | None found |

**Note on tooling gap:** The `project-graph` MCP server was unreachable for the entirety of this research session (`CONNECTION_CLOSED`), so the dependency table above was built from the Ubuntu Launchpad archive API directly rather than the intended graph query; this is a tooling limitation, not evidence of any riscv64 problem in the dependencies themselves.

**libogg depth:** libogg is a pure bitstream-framing library with no SIMD, no JIT, and no architecture-specific assembly; it is a clean riscv64 port by the same "portable scalar C" logic as libvorbis itself, with no known riscv64 issues.

**No SIMD gap from dependencies:** Unlike libraries such as opus, aom, or libjpeg-turbo, libvorbis has no SIMD in its own source tree and depends on no SIMD-dispatching library (e.g. Highway, SIMDe). The riscv64 performance baseline is set entirely by compiler auto-vectorization of plain C, with nothing upstream-controlled to port at the dependency level. `doxygen`, `cmake`, and `zip` appear in `.gitlab-ci.yml` but only gate optional docs/distcheck CI steps, not a build-critical path, and are omitted from the table above as non-critical.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #127](https://github.com/xiph/vorbis/pull/127) | Avoid leaking x86_64 SSE2 paths into forced RISC-V probes | Open, 0 reviews | Low (build hygiene) | Tightens the x86_64 gate in `lib/os.h` so a forced `__riscv` cross-compile probe on an x86_64 host cannot pull in SSE2 intrinsics; falls back correctly to the existing portable scalar path. Does not touch any CI file and does not add a RISC-V-optimized backend, per the PR's own description |
| [Issue #124](https://github.com/xiph/vorbis/issues/124) | Floating-Point Exception (Division by Zero) in `res2_inverse` and `_01inverse` during Ogg Vorbis decoding | Open | High (correctness) | SIGFPE triggered by crafted `.ogg` with malformed codebook data; `classwords` can be zero at `res0.c:817` and `res0.c:661`; proposed guard not yet merged; not riscv64-specific, affects all platforms equally |
| [Issue #118](https://github.com/xiph/vorbis/issues/118) | How is `floor1_inverse_dB_table` calculated? | Open | Low (precision) | Roughly 7-ULP discrepancy between generated and spec dB table values; not architecture-specific; no resolution |
| [Issue #102](https://github.com/xiph/vorbis/issues/102) | Merging aoTuV encoder improvements | Open | Medium (quality) | Request to merge the aoTuV encoder (better rate/quality tradeoff per HydrogenAudio); long-dormant; not riscv64-specific |

**Correctness bugs:** Issue #124 is the most significant open correctness issue: a SIGFPE triggered by malformed codebook data, a denial-of-service vector for any decoder processing untrusted Vorbis streams on any platform, including riscv64. The proposed one-line guard (`if (classwords == 0) return -1;`) is not merged.

No RISC-V-specific bug or open issue exists in the xiph/vorbis tracker. Issues found that mention architecture (e.g. #67, Android cross-compilation) are unrelated to RISC-V.

## 12. Objections and Upstream Blockers

**Stated objections:** None documented. No maintainer has commented on PR #127 or any riscv64-related item.

**Technical blockers:** None blocking correctness; the library compiles and runs on riscv64 today via the portable scalar fallback. The only technical gap is performance: no RVV-accelerated MDCT/FFT exists for riscv64, but this is not a functional blocker.

**Organizational blockers:** Maintainer bandwidth is demonstrably low. PR #127 has been open since 2026-06-19 with zero review activity from the xiph organization, and the last upstream release was 2020-07-04. There is no corporate sponsor and no RISE involvement of any kind. The project has no formal architecture-support tier, no CI infrastructure for riscv64, and no stated roadmap.

**Acceptance probability for an RVV optimization PR:** A well-written RVV MDCT/FFT patch would likely be accepted eventually given the project's implicit "any platform a C compiler supports" stance and the precedent of the existing x86 optimization path, but review latency is unpredictable and could run months given observed maintenance velocity. A contributor would need to actively shepherd the PR.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** Upstream libvorbis has no riscv64 CI: direct reads of `.gitlab-ci.yml` show only x86_64 autotools/clang/cmake jobs plus an x86_64-to-mingw32 cross build ([source](https://github.com/xiph/vorbis/blob/master/.gitlab-ci.yml)), and upstream publishes source tarballs only, no riscv64 binaries. This rules out green/blue/orange-via-CI. Debian confirms a riscv64 build from unmodified upstream source (`libvorbis-dev` 1.3.7-3+b2, [packages.debian.org/sid/riscv64/libvorbis-dev](https://packages.debian.org/sid/riscv64/libvorbis-dev)), consistent with libvorbis being pure portable C with a generic scalar fallback that needs no riscv64-specific patching, which meets the "clean-distro-build" floor, giving yellow. libvorbis is not an optimization-purpose project (its value is spec-compliant codec correctness, not raw speed versus a simpler alternative), so no optimization-level modifier applies and none is reported here.
- **Pending work that could change the grade:** One open, unmerged PR, [xiph/vorbis #127](https://github.com/xiph/vorbis/pull/127) (opened 2026-06-19), tightens an x86_64 SSE2 build-gate so forced riscv64 cross-compile probes fall back to the portable scalar path correctly; this is a build-hygiene/portability fix, not new riscv64 CI or RVV optimization, and it does not touch any CI file. No master or tracking issue for a riscv64 port exists on gitlab.xiph.org or the GitHub mirror. No RISE involvement was found: libvorbis is not a RISE member, has no RISE blog post, and appears in no RISE wheel-builder or working-group listing.

## 14. Investment Analysis

RISE has no existing involvement with libvorbis. No RISE-funded work has been identified in this area. All items below represent new work.

### 14.1 Functional Enablement

The library is already functionally complete on riscv64. PR #127 is the only open functional item, and it is a hygiene fix for cross-compilation smoke tests rather than a runtime correctness issue; it needs only maintainer review, not new engineering.

The one genuinely actionable functional item is fixing Issue #124 (SIGFPE on malformed codebook data). It is not riscv64-specific but affects all platforms equally, including riscv64, and has no merged fix. A one-line patch is proposed in the issue body. Effort: approximately 0.25 person-weeks to finalize, test, and submit; upstream review latency is the primary variable, not engineering effort.

### 14.2 Performance Optimization

The primary optimization opportunity is RVV-accelerated MDCT and FFT. Neither is optimized for any architecture in the current codebase; amd64 and arm64 also run scalar C for these operations, so an RVV port on riscv64 would be a net-new capability rather than catching up to an existing amd64/arm64 fast path.

Scope:
- `lib/mdct.c`: butterfly-based MDCT with a precomputed twiddle table, approximately 300 lines of C
- `lib/smallft.c`: small float FFT, approximately 500 lines of C

Both are plausible candidates for RVV intrinsic acceleration under RISC-V Vector 1.0. The `vorbis_ftoi` scalar path in `lib/os.h` is a much lower-priority target given it sits outside the MDCT/FFT hot loop.

No riscv64 vs arm64/amd64 benchmark data for libvorbis was found in any publicly accessible source. Data not available: WebSearch and search-engine fallback checks for "libvorbis riscv64 benchmark", Phoronix/OpenBenchmarking.org listings, and the RISE blog sitemap all returned no libvorbis-specific performance numbers.

### 14.3 CI/CD Infrastructure

Zero upstream riscv64 CI exists. The minimum viable change is a riscv64 job added to `.gitlab-ci.yml` using QEMU user-mode emulation (`qemu-user-static`) inside the existing `gcc:14` container. A hardware runner (e.g. via the RISE Scaleway/OSU OSL infrastructure, or a SiFive/StarFive board) would be preferable for any performance-sensitive testing once an RVV path exists.

### 14.4 Ecosystem Enablement

Not applicable. libvorbis has no dependent package ecosystem (no PyPI, npm, or Maven package) requiring separate riscv64 enablement; see Section 9 for the small, already-available build-tooling chain.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Shepherd PR #127 to merge (SSE2 guard fix for cross-compilation probes) | 0.1 | Upstream contributor | Low |
| Functional | Fix Issue #124 (SIGFPE on malformed codebook data) | 0.25 | Any contributor | High |
| Performance | RVV-accelerated MDCT (`lib/mdct.c`) | 3-4 | RISC-V specialist | Medium |
| Performance | RVV-accelerated FFT (`lib/smallft.c`) | 2-3 | RISC-V specialist | Medium |
| Performance | Benchmark riscv64 vs arm64/amd64 on real hardware | 0.5 | QA / benchmarking | Medium |
| CI/CD | Add riscv64 QEMU job to `.gitlab-ci.yml` | 0.5 | DevOps | Medium |
| CI/CD | Add riscv64 hardware runner (optional) | 1 | Infrastructure | Low |
| Verification | Re-confirm Ubuntu 26.04 riscv64 packaging (conflicting fetch results, see Section 8) | 0.1 | QA | Low |

## 15. References

- [xiph/vorbis GitHub repository (mirror of gitlab.xiph.org/xiph/vorbis)](https://github.com/xiph/vorbis)
- [libvorbis 1.3.7 release (2020-07-04)](https://github.com/xiph/vorbis/releases/tag/v1.3.7)
- [PR #127: Avoid leaking x86_64 SSE2 paths into forced RISC-V probes](https://github.com/xiph/vorbis/pull/127)
- [JuliaPackaging/Yggdrasil PR #11597: libvorbis, Build for riscv64](https://github.com/JuliaPackaging/Yggdrasil/pull/11597)
- [Issue #124: SIGFPE in res2_inverse and _01inverse on malformed Ogg Vorbis](https://github.com/xiph/vorbis/issues/124)
- [Issue #118: floor1_inverse_dB_table floating-point precision discrepancy](https://github.com/xiph/vorbis/issues/118)
- [Issue #102: Request to merge aoTuV encoder improvements](https://github.com/xiph/vorbis/issues/102)
- [lib/os.h in xiph/vorbis (architecture-specific float-to-int conversion)](https://github.com/xiph/vorbis/blob/master/lib/os.h)
- [.gitlab-ci.yml in xiph/vorbis](https://github.com/xiph/vorbis/blob/master/.gitlab-ci.yml)
- [.gitlab-ci.yml in xiph/vorbis-tools](https://github.com/xiph/vorbis-tools/blob/master/.gitlab-ci.yml)
- [Debian sid riscv64 package listing for libvorbis-dev](https://packages.debian.org/sid/riscv64/libvorbis-dev)
- [Ubuntu package search for libvorbis, suite resolute](https://packages.ubuntu.com/search?keywords=libvorbis&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port repository listing](https://archriscv.felixc.at/)
- [PyPI package page for libvorbis (404, package does not exist)](https://pypi.org/pypi/libvorbis/json)
- [Xiph.Org Foundation homepage](https://xiph.org/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)