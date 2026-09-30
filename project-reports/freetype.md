---
title: FreeType
parent: Project Reports
color: yellow
dependencies:
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: HarfBuzz
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: Meson
    relation: build-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: pkg-config
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="freetype" %}

# FreeType

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for FreeType<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

FreeType is a portable C library for rendering TrueType, OpenType, CFF, Type 1, and other font formats. It is the de facto font rasterizer for Linux desktop stacks, Android, ChromeOS, and embedded systems.

**Governance.** FreeType has no formal foundation or governance body. It is hosted on [freedesktop.org GitLab](https://gitlab.freedesktop.org/freetype/freetype) (migrated from Savannah/nongnu.org around January 2021), which provides infrastructure only, not formal governance. A full clone of the repository was searched for `MAINTAINERS`, `GOVERNANCE.md`, and `CODEOWNERS` files at any path - none exist. Contribution happens via GitLab merge requests or patches to the [freetype-devel@nongnu.org](https://lists.nongnu.org/mailman/listinfo/freetype-devel) mailing list. No formal RFC or architecture-port-approval process is documented anywhere.

**Core maintainers:** Werner Lemberg (lemzwerg), the de facto lead maintainer for over 20 years; original authors David Turner (creator, 1995) and Robert Wilhelm (C port, 1997); Alexei Podtelezhnikov (apodtele), the most prolific recent committer; and Suzuki Toshiya. None has a disclosed corporate affiliation tied to their maintainer role.

**Corporate involvement.** No company holds a formal maintainer seat or governance role. Corporate contributions are one-off code donations, not ongoing sponsorship: Adobe donated its CFF (Compact Font Format) rasterizer/engine in 2013, made the default in FreeType 2.5, and Google contributed color-emoji (CBDT/CBLC/sbix) support, largely via Behdad Esfahbod. No sponsor list appears on [freetype.org](https://freetype.org/).

**License:** Dual-licensed under the FreeType License (FTL, a BSD-style license with an advertising/credit clause, GPLv3-compatible but not GPLv2-compatible) or GPL v2. Confirmed via [freetype.org/license.html](https://freetype.org/) and the `docs/FTL.TXT` / `docs/GPLv2.TXT` files in the repository.

**Community stance on new ports.** FreeType's design goal is explicit portability: a small, efficient, highly customizable, portable library in scalar C. It has no concept of architecture "ports" - no `arch/` directory, no per-ISA backend structure, and consequently no port-approval process to document. Any conforming C99 compiler on any target is sufficient. FreeType is **not** a member of RISE (RISC-V Software Ecosystem); checking [riseproject.dev/members](https://riseproject.dev/) shows 8 Premier members (Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 General members (Akeana, Andes, ESWIN, ISCAS, Canonical, Douyin, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) - no font or text-rendering library is listed. No RISE "tier policy" exists or applies to FreeType.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2018 | FreeType's pure-C design requires no architecture-specific port work for any 64-bit target | [freetype.org](https://freetype.org/) |
| circa 2018 | Debian riscv64 port begins; early freetype 2.9.1-1 build recorded as "Maybe-Failed" (unreproduced, not tracked as a live failure) | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=freetype&suite=sid) |
| 2026-04-03 | Debian sid freetype 2.14.3+dfsg-1 built cleanly on rv-osuosl-01, status "Installed" | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=freetype&suite=sid) |
| 2026-03-31 | Arch Linux RISC-V publishes signed `freetype2-2.14.3-1-riscv64.pkg.tar.zst`; dependent packages (haskell-gi-freetype2, vlc-plugin-freetype) rebuilt for riscv64 as recently as 2026-09-30 | [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/) |
| 2026-09-04 | AOSC OS merges PR #17488 (HarfBuzz dependency switched to dlopen), build verified across architecture tiers including RISC-V 64-bit (secondary tier) | [AOSC-Dev/aosc-os-abbs PR #17488](https://github.com/AOSC-Dev/aosc-os-abbs/pull/17488) |
| 2026-09-06 | RISE's `python-wheels` project merges PR #994, adding a riscv64 wheel build for the separate `freetype-py` Python binding (bundles FreeType 2.13.2 compiled from source) | [riseproject-dev/python-wheels PR #994](https://github.com/riseproject-dev/python-wheels/pull/994) |
| Current | Ubuntu 26.04 (Resolute) ships `libfreetype6`/`libfreetype-dev` 2.14.2+dfsg-1 for riscv64 via the Ports archive | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=freetype&suite=resolute) |

No RISC-V-specific commits exist in FreeType's source tree: a full-history search (`git log --all -i --grep="riscv"` across all 8,618 commits of the cloned repository) returned zero matches, and a GitHub code search for `riscv repo:freetype/freetype` returned `total_count: 0`. No first RISC-V commit date exists because no architecture-specific code was ever needed - riscv64 support is implicit in the portable-C baseline, not a discrete port. The distro maintainers responsible for riscv64 package availability (Debian, Ubuntu, Arch Linux RISC-V, AOSC) are all downstream of FreeType, not FreeType upstream itself.

## 3. Upstream Support Tier

FreeType has no documented tier policy. The following table summarizes de facto evidence.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI (`.gitlab-ci.yml`) | Yes (Linux, Windows) | Yes (Windows MSBuild, macOS) | No |
| Release-blocking | Yes | Yes (macOS arm64 runner) | No |
| Official prebuilt binaries from FreeType itself | No (source-only releases) | No | No |
| Debian sid package | Yes | Yes | Yes - 2.14.3+dfsg-1, "Installed" (2026-04-03) |
| Ubuntu 26.04 Resolute package | Yes - 2.14.2+dfsg-1ubuntu0.1 (security pocket) | Yes - 2.14.2+dfsg-1ubuntu0.1 (security pocket) | Yes - 2.14.2+dfsg-1 (Ports pocket, shared with armhf/ppc64el/s390x) |
| Arch Linux (official / RISC-V port) | Yes | Yes | Yes - 2.14.3-1, signed package |
| Upstream CI QEMU emulation | No | No | No |

**Conclusion.** FreeType ships source-only upstream releases for all architectures; the project itself provides no prebuilt binaries for any architecture. riscv64 is entirely absent from the upstream CI pipeline. Because FreeType is pure C with no architecture-specific fast paths outside two narrow, legacy 32-bit spots (Section 4), this CI absence has limited practical consequence for correctness: three independent distributions (Debian sid, Ubuntu 26.04 Ports, Arch Linux RISC-V) build the unmodified upstream source cleanly and ship it. Ubuntu's riscv64 build is worth flagging precisely: it is served from the secondary "Ports" archive alongside armhf/ppc64el/s390x, receiving the unpatched `2.14.2+dfsg-1` build, one revision behind the security-updated `2.14.2+dfsg-1ubuntu0.1` that amd64/arm64/i386 get from the primary archive - a distribution-tier gap, not a functional one.

## 4. Technical Architecture and RISC-V-Specific Subsystems

FreeType has no JIT, no garbage collector, no cryptography, and no SIMD dispatch infrastructure of any kind for any architecture. A full grep of the cloned source tree for `riscv`, `risc-v`, `rv32`, `rv64`, and RVV intrinsics returned zero matches; there is no `arch/` or `riscv/` directory and no `.S` assembly files anywhere in the repository.

FreeType's entire set of architecture-conditional code is four narrow spots, gated on `__arm__`, `__i386__`/`_M_IX86`, `__x86_64__`, or `__aarch64__`:

| Component | What it does | riscv64 path | Rating |
|---|---|---|---|
| `FT_MulFix` (`include/freetype/internal/ftcalc.h`) - core 16.16 fixed-point multiply, used pervasively in glyph scaling/transform | `#ifdef FT_INT64` selects a generic 64-bit C implementation *before* any architecture check; falls to ARM/i386 inline asm (`smull`/`imul`) only if `FT_INT64` is undefined | Uses the generic `FT_INT64` C path - the same path virtually every modern compiler on x86_64 and aarch64 also uses today | Scalar (C fallback), and it is the primary path on every 64-bit target, not a degraded one |
| `TT_MulFix14` (`src/truetype/ttinterp.c`) - TrueType bytecode interpreter multiply | Same `FT_INT64`-first pattern | Same generic 64-bit C path | Scalar (C fallback) |
| `src/smooth/ftgrays.c` anti-aliasing rasterizer | One `__arm__`-gated branch works around a GCC < 7 div/mod-fusion codegen bug, not a performance optimization; no SIMD path exists for any architecture | Uses the single, only rasterizer implementation FreeType has | Scalar (C fallback) - no architecture has anything faster here |
| `src/gzip/crc32.c` (vendored zlib, used only for gzip-compressed embedded font tables, an optional feature) | `W=8` word size plus the `ARMCRC32` hardware instruction, only for `__aarch64__`/`__x86_64__` | Falls to the generic `W=4` braided CRC path | Scalar (C fallback), non-critical vendored code |
| `pngshim.c` SSE byte-shuffle (colored/sbix PNG glyph bitmap conversion, a niche feature) | `__SSE__`-gated vector shuffle | Generic scalar loop | Scalar (C fallback) |

No SIMD or intrinsics (SSE, AVX, NEON, AltiVec, RVV) exist in FreeType for any architecture outside these two narrow, non-critical spots. This is a deliberately portable, scalar-C-first codebase, not one with per-architecture hand-tuned kernels that riscv64 is missing out on. `src/smooth/ftgrays.c` itself carries a comment noting SSE2 intrinsics were tried and found slower than plain C, so even x86 gets no SIMD rasterizer.

The one item that looks like a riscv64-specific technical question is [google/android-riscv64 Issue #40](https://github.com/google/android-riscv64/issues/40) ("external/freetype: optimization (?)", opened 2023-02-02, closed with no comments), which asks whether the arm64-specific configuration block in `ftgrays.c` needs a riscv64 equivalent, given that x86 has heavier tuning than arm64 needed. It was closed without a described resolution or any code change to FreeType. [NEEDS VERIFICATION: reason for closure, since the issue itself carries no comments].

**riscv64 is not missing any implementation that amd64 or arm64 also have.** Every 64-bit platform uses identical C paths for the hottest arithmetic functions in the library.

## 5. Build System, Cross-Compilation, and Toolchain

FreeType supports three build systems: autotools, CMake, and Meson. None ships an upstream riscv64-specific toolchain file or cross-file; standard GNU cross-compilation conventions apply, the same as for any other architecture FreeType has never needed to special-case.

**Compiler requirements:** the only stated requirement in `docs/INSTALL.UNIX` is GNU Make >= 3.81. No document states a GCC or Clang minimum version for any architecture, riscv64 included. `docs/INSTALL.CROSS` requires "a GNU C cross-compiler" (a non-GNU cross compiler is stated as untested) but gives no version number, and its only worked cross-compilation example is MIPS, not riscv64.

**CMake cross-compilation** (minimal, optional deps disabled):

```
cmake -B build \
  -D CMAKE_SYSTEM_NAME=Linux \
  -D CMAKE_SYSTEM_PROCESSOR=riscv64 \
  -D CMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -D FT_DISABLE_BROTLI=TRUE \
  -D FT_DISABLE_BZIP2=TRUE \
  -D FT_DISABLE_HARFBUZZ=TRUE \
  -D FT_DISABLE_PNG=TRUE \
  -D FT_DISABLE_ZLIB=TRUE
cmake --build build --target install
```

No upstream `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists; the `builds/cmake/` directory contains only `FindBrotliDec.cmake`, `FindHarfBuzz.cmake`, `iOS.cmake`, and `testbuild.sh`. `cmake_minimum_required` spans `VERSION 3.12...3.31.0`.

**Autotools cross-compilation** (from `docs/INSTALL.CROSS`):

```
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --build=$(gcc -dumpmachine) \
  --prefix=/usr/local/riscv64-linux-gnu \
  --without-brotli --without-bzip2 \
  --without-harfbuzz --without-png --without-zlib \
  CC=riscv64-linux-gnu-gcc
make -j$(nproc)
make install
```

`INSTALL.CROSS` explicitly warns against setting only `CC=` without `--host` and `--build`. A native C compiler is also required on the host to build the `apinames` tool. Under cross-compilation, `PKG_CONFIG_LIBDIR` must be set to the cross-sysroot pkg-config path for optional dependency detection.

**Meson cross-compilation** requires a cross-file (none is shipped upstream):

```
[binaries]
c = 'riscv64-linux-gnu-gcc'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkg-config = 'pkg-config'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

The exact commands FreeType's own CI runs (host-native, x86_64 only - no riscv64 variant exists) are, for autotools:

```
./autogen.sh
./configure --with-brotli=no --with-bzip2=no --with-harfbuzz=no --with-png=no --with-zlib=no CC=gcc
make -j$(nproc) && make install
```

for Meson:

```
meson setup build --fatal-meson-warnings --default-library=both \
  -Dbrotli=disabled -Dbzip2=disabled -Dharfbuzz=disabled -Dpng=disabled -Dzlib=disabled
meson compile --verbose -C build
meson install -C build
```

and for CMake, the same flags shown above with `TRUE`/`FALSE` toggles. The "libs" CI variants flip these to `--with-X=yes` / `-Dx=enabled` / `-D FT_REQUIRE_X=TRUE`.

**CI Docker image:** FreeType's single Dockerfile (in the separate `freetype/docker-images` repository, producing `registry.freedesktop.org/freetype/docker-images/debian:latest`) is based on `debian:bookworm-20250428-slim` and installs autoconf, automake, clang, cmake, gcc/g++, libbrotli-dev, libbz2-dev, libharfbuzz-dev, libpng-dev, libtool, meson, ninja-build, python3, and zlib1g-dev. It contains no cross-toolchain package (no `gcc-riscv64-linux-gnu`) and no QEMU/binfmt packages - it builds and tests FreeType natively on x86_64 only. No riscv64-oriented Docker image exists in the FreeType GitLab organization.

**QEMU:** no QEMU usage is documented or configured anywhere in FreeType's build system or CI.

**Known build failures:** none current. Debian sid built 2.14.3+dfsg-1 cleanly on rv-osuosl-01 (2026-04-03); no riscv64 build failures are recorded since the unreproduced 2.9.1-1 "Maybe-Failed" result circa 2018.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| TrueType rendering | Full | Full | Full | None |
| CFF/OpenType rendering | Full | Full | Full | None |
| Type 1 rendering | Full | Full | Full | None |
| Bitmap fonts (BDF, PCF) | Full | Full | Full | None |
| WOFF2/Brotli decompression | Full | Full | Full | None |
| LCD subpixel rendering | Full | Full | Full | None |
| Color fonts (COLR, sbix, CBDT) | Full | Full | Full | None |
| Variable fonts | Full | Full | Full | None |
| TrueType bytecode interpreter | Full | Full | Full | None |
| SIMD-accelerated rasterization | None | None | None | No gap - none exists for any architecture |
| RVV vectorization | N/A | N/A | None | General upstream gap, not riscv64-specific |

**Functional gaps:** none. Every FreeType feature is available on riscv64; three independent distributions build and ship the unmodified upstream source.

**Performance gaps:** no FreeType-specific, RISC-V-specific benchmark data exists in any publicly searchable source - checked via general web search, Phoronix/OpenBenchmarking.org, and the full RISE blog archive (68 posts, 2024-05-15 through 2026-09-28), none of which mentions FreeType, fonts, glyph rendering, or rasterization. Since FreeType has no SIMD acceleration for any architecture, any observed riscv64-vs-arm64-vs-amd64 performance delta is attributable to processor microarchitecture and compiler code generation, not to a missing FreeType SIMD path. Architecture-agnostic performance improvements that benefit riscv64 equally:
- FreeType 2.14.0 (2025-09-07): TrueType instruction interpreter approximately 15% faster glyph loading; TrueType/CFF 5-10% faster via 64-bit fixed-point multiply handling; GPOS kerning approximately 3.5x faster.
- FreeType 2.14.2 (2026-03-01): ClearType-like LCD rendering over 40% faster at sizes above 32ppem.
- FreeType 2.13.3 (2024-08-12): the black-and-white rasterizer "much faster" per the changelog.

**Security hardening gaps:** none identified as architecture-specific. CVE-2025-27363 (fixed >= 2.13.1) and the 2.14.1 emergency regression fix (Section 11) apply uniformly across architectures.

**Floating-point / NaN semantics:** FreeType uses 26.6 fixed-point arithmetic internally (integer only, no floating point). No floating-point semantics issues apply on riscv64.

## 7. CI/CD Infrastructure

FreeType's only CI configuration is `.gitlab-ci.yml` on [freedesktop.org GitLab](https://gitlab.freedesktop.org/freetype/freetype), mirrored (read-only) to [github.com/freetype/freetype](https://github.com/freetype/freetype). The GitHub mirror's `.github` directory returns HTTP 404 - there is no GitHub Actions workflow of any kind. No `Jenkinsfile` or `.cirrus.yml` exists. A direct text search of `.gitlab-ci.yml` (fetched via the GitHub mirror raw content, since direct GitLab fetches are blocked by the Anubis anti-bot gate) for "riscv", "riscv64", "risc-v", and "rv64" returned zero matches, independently corroborated by a GitHub code search for `riscv repo:freetype/freetype` returning `total_count: 0` across the entire repository (not just the CI file).

| CI platform | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux (autotools, meson, cmake) | Yes (Debian container, multiple jobs) | No | No |
| Windows (meson/msbuild vs2022) | Yes (amd64 + x86) | Yes (msbuild only) | No |
| macOS (autotools, meson) | No | Yes (`gst-mac-arm` runner tag) | No |
| QEMU emulation for non-native targets | No | No | No |
| RISE CI runners | No | No | No |

The Linux CI jobs run on `registry.freedesktop.org/freetype/docker-images/debian:latest` with no architecture tag (amd64 only, per the Dockerfile in Section 5). The macOS CI runs on an Apple Silicon (ARM64) runner tagged `gst-mac-arm`, which establishes precedent within the project for tagging a non-amd64 runner, though no equivalent riscv64 runner has been added.

**No riscv64 CI exists anywhere in the FreeType project.** riscv64 correctness is validated entirely by downstream distribution build infrastructure (Debian buildd, Ubuntu Ports/Launchpad, Arch Linux RISC-V).

## 8. Distribution and Release Status

**Upstream releases:** FreeType distributes source-only releases (`.tar.gz`, `.tar.xz`, `.zip`) via [download.savannah.gnu.org](https://download.savannah.gnu.org/releases/freetype/). No prebuilt architecture-specific binaries are provided in any release, for any architecture. The [freetype/freetype GitHub mirror](https://github.com/freetype/freetype) has zero GitHub Releases. GitLab's own project page carries no OS-level binary/architecture distribution information - GitLab does not publish riscv64 binaries; that is entirely a downstream-packaging concern.

**Linux distribution packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | libfreetype6, libfreetype-dev, freetype2-demos | 2.14.3+dfsg-1 | "Installed" (rv-osuosl-01, 2026-04-03) |
| Ubuntu 26.04 Resolute | libfreetype6, libfreetype-dev, freetype2-demos | 2.14.2+dfsg-1 | Ports pocket: armhf, ppc64el, riscv64, s390x (one revision behind the `2.14.2+dfsg-1ubuntu0.1` security build served to amd64/arm64/i386 from the primary archive) |
| Arch Linux RISC-V (archriscv.felixc.at) | freetype2, freetype2-demos, freetype2-docs | 2.14.3-1 | Confirmed live: signed `.pkg.tar.zst` + `.sig` at [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/), built 2026-03-31, dependent packages still being rebuilt as recently as 2026-09-30 |
| AOSC OS | freetype (2.14.2-1 packaging) | 2.14.2 | Secondary tier; PR #17488 (2026-09-04, merged) confirms clean build on RISC-V 64-bit alongside Loongson3 and PowerPC64 LE |

Debian sid also ships riscv64 packages derived from the freetype source, including Rust bindings (`librust-freetype-dev`, `librust-freetype-rs-dev`, `librust-freetype-sys-dev`), Haskell bindings, Perl bindings, and `python3-freetype` (architecture `all`, pure Python) [carried from the prior version of this report; not independently re-verified in this pass].

**Python binding (`freetype` on PyPI):** this is a separate, largely abandoned legacy package ("Freetype 2 library bindings") with a single uploaded artifact, `Freetype-Milestone1-py2.4-win32.egg` (Windows 32-bit, Python 2.4 era). No riscv64, or any modern/Linux, wheel exists. This package should not be confused with `freetype-py`, below.

**Python binding (`freetype-py` 2.5.1 on PyPI):** as of this report, RISE's `python-wheels` project has added a riscv64 wheel. [riseproject-dev/python-wheels PR #994](https://github.com/riseproject-dev/python-wheels/pull/994) (merged 2026-09-06 by RISE contributor luhenry) added a CI workflow that compiles FreeType 2.13.2 from source (bundled with HarfBuzz 8.3.0) into a ctypes wrapper for freetype-py, since no upstream riscv64 wheel exists for the PyPI cmake package that freetype-py's normal build would otherwise pull in. The build is tagged `py3-none-manylinux_riscv64` for cp312 only, pins CMake policy to a minimum of 3.5 (the build image ships CMake 4), disables build isolation, pins setuptools below 81, omits musllinux, and patches FreeType's source download to redirect to SourceForge (the default download mirror blocks non-browser clients). All 7 pytest tests passed. The release is tagged `freetype-py-v2.5.1-20260906093331`, published 2026-09-06 09:33 UTC via GitHub Actions. This is tracked by the companion [Issue #1005](https://github.com/riseproject-dev/python-wheels/issues/1005) (open, referencing PR #994 as the fix). FreeType itself is **not** listed among the 89 packages on RISE's [wheel_builder status page](https://riseproject.gitlab.io/python/wheel_builder/); freetype-py's wheel was added via the `python-wheels` repository directly. FreeType also appears bundled (statically linked, not as its own wheel) inside other RISE riscv64 wheel builds for `pygame` (PR #1089), `pedalboard` (PR #759), `kivy` (PR #2548), and `openimageio` (PR #2540).

**What a user must do to get a working binary on riscv64:**
- On Debian/Ubuntu: `apt install libfreetype6` works out of the box (Ubuntu users should note this comes from the Ports archive, not the primary security-tracked archive).
- On Arch Linux RISC-V: `pacman -S freetype2` via the archriscv.felixc.at repository.
- From source: standard autotools, CMake, or Meson cross-compilation as documented in Section 5 - no patches required.
- Python binding: use the distro's `python3-freetype` package, or `pip install freetype-py` (a riscv64 wheel is now published via RISE's build per above), or build `freetype-py` from source.

## 9. Dependencies

| Dependency | Relation | Criticality | riscv64 Status |
|---|---|---|---|
| zlib | runtime-dependency | optional | Available: Ubuntu 26.04 resolute riscv64 (`zlib1g`, `zlib1g-dev`), Debian sid 1:1.3.dfsg+really1.3.2-3. Clean native/cross build; no upstream riscv64 CI (Debian/Ubuntu buildd only validation); no SIMD path on any architecture so no riscv64-specific gap. |
| bzip2 | runtime-dependency | optional | Available: Ubuntu 26.04 resolute riscv64 (`bzip2`, `libbz2-1.0`, `libbz2-dev`), Debian sid 1.0.8-6+b2, Ubuntu resolute 1.0.8-6build2. Portable C89, no arch-specific code; no upstream CI for any architecture (sourceware.org repo has none). A roughly 10-20% `mainGtU()` speedup patch (GitLab issue #40) is unmerged, stuck because the fork it lives in is archived/read-only - not a correctness blocker. |
| libpng | runtime-dependency | optional | Available: Ubuntu 26.04 resolute riscv64 (`libpng16-16t64`, `libpng-dev`), Debian sid 1.6.58-1. Most actively RISC-V-developed of the five optional deps: RVV SIMD merged December 2025 (upstream PR #771) and riscv64-specific correctness fixes landed (PR #769, #711); still lacks automated riscv64 regression testing upstream. |
| HarfBuzz | runtime-dependency | optional | >= 2.0.0 required for the auto-hinting quality improvement; optionally loaded via `dlopen` at runtime (`FT_DYNAMIC_HARFBUZZ`). Available: Ubuntu 26.04 resolute riscv64 (`libharfbuzz0b`, `libharfbuzz-gobject0`, `libharfbuzz-dev`), Debian sid `libharfbuzz0b` 12.3.2-2+b2. Builds cleanly cross-compiled (Meson `exe_wrapper = qemu-riscv64`); no upstream riscv64 CI; no RVV code, scalar-only on riscv64 same as amd64/arm64 - a performance-parity gap, not a correctness one. AOSC PR #17488 switched FreeType's link to HarfBuzz from hard-link to dlopen specifically to simplify this dependency on riscv64 and other secondary-tier architectures. |
| brotli | runtime-dependency | optional | Available: Ubuntu 26.04 resolute riscv64 (`brotli`, `libbrotli1`, `libbrotli-dev`), Debian sid 1.2.0-3. riscv64 support (`BROTLI_TARGET_RISCV64`) has been fully upstream since 2018 (PR #669), tested on a SiFive HiFive Unleashed board. No upstream riscv64 CI/binaries (distro buildd only). An RVV performance-optimization PR (#1410) is stalled on a CLA failure; a follow-up (#1489) was closed unmerged in June 2026 - performance-only gap, not a build/functional blocker. |
| CMake | build-dependency | optional | One of three build systems FreeType supports; present in FreeType's own CI Docker image (amd64-only). Data not available: no direct confirmation was fetched of CMake's own riscv64 packaging status in Ubuntu/Debian/Arch beyond its general presence as a standard cross-platform build tool; not independently verified in this research pass. |
| Meson | build-dependency | optional | One of three build systems FreeType supports; present in FreeType's own CI Docker image. Data not available: CMake caveat above applies equally here - not independently verified. |
| autoconf | build-dependency | optional | Used by the autotools build (`./autogen.sh`); present in FreeType's own CI Docker image. Data not available: riscv64 packaging status not independently verified in this research pass. |
| GCC | build-dependency | critical | FreeType's `docs/INSTALL.CROSS` requires a GNU C cross-compiler and states a non-GNU cross compiler is untested; no version minimum is documented for any architecture. `riscv64-linux-gnu-gcc` is the compiler used in the Section 5 cross-compilation examples and is the toolchain that produces the Debian sid, Ubuntu Ports, and Arch Linux RISC-V builds referenced throughout this report (each distro's own riscv64 GCC toolchain). |
| pkg-config | build-dependency | optional | Used to detect the five optional runtime dependencies at configure time (`docs/INSTALL.UNIX`); under cross-compilation, `PKG_CONFIG_LIBDIR` must point at the cross-sysroot's pkg-config path per `INSTALL.CROSS`. Data not available: riscv64 packaging status not independently verified in this research pass beyond its role in the build. |

All five optional runtime dependencies are available as riscv64 packages in Ubuntu 26.04 (Resolute) and build cleanly, with zero correctness-blocking issues on riscv64 - only two performance-only gaps exist in the dependency chain (brotli's stalled RVV PR, HarfBuzz's lack of RVV vectorization). None of the five runtime dependencies has upstream riscv64 CI of its own; all riscv64 correctness validation for the dependency chain, like for FreeType itself, runs through distro build infrastructure (Debian buildd, Ubuntu Ports).

## 11. Known Bugs and Active Issues

FreeType's own issue tracker, [gitlab.freedesktop.org/freetype/freetype](https://gitlab.freedesktop.org/freetype/freetype), is protected by the Anubis anti-bot challenge system, which blocked every direct automated fetch attempt during this research (returning "Access Denied" or a challenge page, not content). Cross-checking via Google's index (multiple targeted `site:gitlab.freedesktop.org/freetype/freetype riscv` queries) and the `freetype-devel` mailing list archive on marc.info returned no FreeType-upstream riscv64 issue or merge request. The GitHub mirror has no Issues tab at all (its README redirects bug reports to GitLab), so a GitHub-side search is structurally zero by design, not evidence of absence.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none in FreeType's own tracker) | No riscv64-specific FreeType bug or issue found | - | - | Confirmed via Google-index cross-check of the Anubis-blocked GitLab tracker, the mailing list archive, and a zero-result GitHub code search for "riscv". |
| [google/android-riscv64 #40](https://github.com/google/android-riscv64/issues/40) | "external/freetype: optimization (?)" | Closed (2023-02-02) | - | Downstream, not FreeType-upstream. Open question about arm64-style tuning in `ftgrays.c`; closed without comments or a resolution. |
| [matplotlib/matplotlib #25123](https://github.com/matplotlib/matplotlib/issues/25123) | "[Bug]: default to system freetype on riscv64" | Open (since 2023-02-01) | - | Downstream matplotlib build-config issue: its bundled FreeType build fails on riscv64/Ubuntu; requests defaulting to the system FreeType instead. Not a FreeType code bug. |
| [haikuports/haikuports #12788](https://github.com/haikuports/haikuports/issues/12788) | "Build failures on RISCV64" | Open (since 2025-08-18) | type-bug | General riscv64 tracking issue across Haiku's ports tree; FreeType is mentioned only incidentally, via a version constraint needed between freetype and fontconfig. |
| [riseproject-dev/python-wheels #1005](https://github.com/riseproject-dev/python-wheels/issues/1005) | "freetype-py riscv64 support" | Open (since 2026-09-06) | - | Packaging request, resolved in practice by merged PR #994 (Section 8). Not a FreeType code bug. |
| Debian #998064 | "fails to display text containing letter 'e' due to errors in libfreetype after upgrade" | Outstanding | Important | Not architecture-specific. |
| Debian #866960 | ABI/API rounding change causing blank lines between characters for TrueType fonts | Forwarded, tagged wontfix | Important | Affects all architectures, not riscv64-specific. |
| CVE-2025-27363 | Out-of-bounds write in FreeType <= 2.13.0 | Fixed (>= 2.13.1) | High | Not architecture-specific. |
| (unnamed) | 32-bit integer overflow in `src/sdf/ftsdf.c`, potential heap buffer overflow | No CVE assigned | Medium | Not riscv64-specific; Feb 2026. |

**Correctness bugs specific to riscv64:** none found in any accessible source.

**Regression notes:** FreeType 2.14.1 (2025-09-11, emergency patch) fixed critical regressions introduced in 2.14.0 (GitLab issues #1349, #1353, #1354, #1355, #1356). These affected all architectures, not riscv64 specifically.

## 12. Objections and Upstream Blockers

**No objections, technical blockers, or organizational blockers exist for riscv64 in FreeType.** The project's design philosophy is explicit portability; there is no stated opposition to new architectures, no tier policy that would relegate riscv64 to a lower support class, and no maintainer statement objecting to riscv64 use, in any accessible source. Because the library contains no architecture-specific code for any 64-bit target, there is nothing to upstream in the functional sense. Governance is informal (no MAINTAINERS file, no GOVERNANCE.md, no CODEOWNERS - confirmed by full-tree search of a clone), which means nothing structurally blocks adding riscv64 CI, but no such work is currently in progress or proposed in any tracker, mailing-list thread, or merge request found.

The one practical gap - the absence of riscv64 CI - requires no upstream architectural change, only the addition of a CI runner or QEMU user-mode emulation job to `.gitlab-ci.yml`. This is entirely within the project's own precedent: the macOS arm64 CI job runs on a tagged runner (`gst-mac-arm`), establishing that FreeType's CI can and does onboard non-amd64 runners via simple GitLab CI tagging. Probability of acceptance for a riscv64 CI patch is not independently confirmed by any maintainer statement [NEEDS VERIFICATION - upstream maintainer communications on GitLab are inaccessible due to the Anubis bot-protection gate].

## 13. Readiness Assessment

**Color:** yellow (clean-distro-build)
**Release provider:** distro

FreeType's upstream `.gitlab-ci.yml` (mirrored at [github.com/freetype/freetype/blob/master/.gitlab-ci.yml](https://github.com/freetype/freetype/blob/master/.gitlab-ci.yml)) defines jobs for amd64/x86/arm64 only - there is zero riscv64 job and no QEMU usage, and a GitHub code search returned 0 matches for "riscv" anywhere in the repository, so there is no upstream CI for riscv64. The distribution floor then applies: Ubuntu 26.04 ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=freetype&suite=resolute)), Debian sid ([buildd.debian.org](https://buildd.debian.org/status/package.php?p=freetype&suite=sid)), and Arch Linux RISC-V ([archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/)) all build and ship `libfreetype6`/`freetype2` for riscv64 from unmodified upstream source with no riscv64-specific packaging patches found, which upgrades the grade from orange to yellow (clean-distro-build) per the project color-coding rules. FreeType is not an optimization-purpose project - it is a general-purpose font rasterizer running scalar C on every architecture, including amd64 and arm64 - so the optimization modifier does not apply and cannot cap the color further.

**Pending work that could change the grade:** no riscv64-specific open bugs or upstream objections exist. Informal governance, with no MAINTAINERS file or port-approval process, means nothing structurally blocks adding riscv64 CI, but no such work is currently in progress. The only loosely related in-flight item is RISE's `python-wheels` PR #994 (merged 2026-09-06), which adds a riscv64 wheel for the separate `freetype-py` Python binding - this does not touch FreeType's own upstream CI or release status and would not change this grade.

## 14. Investment Analysis

RISE has not funded any work directly on FreeType itself. There is no RISE blog post about FreeType in the 68-post archive checked (2024-05-15 through 2026-09-28), and FreeType is not listed among the 89 packages on RISE's [wheel_builder status page](https://riseproject.gitlab.io/python/wheel_builder/). RISE's only concrete FreeType-adjacent involvement is indirect: FreeType (and the `freetype-py` binding that wraps it) appears as a dependency inside the `riseproject-dev/python-wheels` riscv64 wheel-building effort (PR #994, merged 2026-09-06, ordinary repository maintenance by RISE contributor Ludovic Henry, not a separately announced or funded "RP-xxx" grant project).

### 14.1 Functional Enablement

No work required. FreeType is fully functional on riscv64 as pure C code. All features available on amd64 and arm64 are available on riscv64 without modification, and three independent distributions (Debian, Ubuntu, Arch Linux RISC-V) already confirm this in practice.

### 14.2 Performance Optimization

FreeType contains no SIMD-accelerated rasterization paths for any architecture, including amd64 and arm64. Adding RVV (RISC-V Vector) optimizations to the rasterizer would be a net-new capability across the whole project, not a parity effort specific to riscv64. The anti-aliased rasterizer (`src/smooth/ftgrays.c`) and bitmap blending paths (`ftbitmap.c`) are the primary candidates for vectorization, should the project (or a downstream contributor) choose to pursue SIMD at all. [NEEDS VERIFICATION, single source from the prior version of this report, not independently re-confirmed in this pass]: HarfBuzz developer Behdad Esfahbod announced in February 2026 that a new CPU rasterizer in HarfBuzz ("hb-raster") claims to be "2x or more faster than FreeType's" in initial testing, which would represent competitive pressure on FreeType's rasterizer performance generally, independent of riscv64. No quantitative FreeType riscv64-vs-arm64-vs-amd64 performance data exists in any source checked (Phoronix, OpenBenchmarking.org, academic RVV literature, RISE blog).

### 14.3 CI/CD Infrastructure

The gap is well-defined and bounded: add a riscv64 job to `.gitlab-ci.yml`, using either a physical riscv64 runner or QEMU user-mode emulation. FreeType's CI already onboards a non-amd64 runner via tagging (the macOS `gst-mac-arm` runner), establishing direct in-project precedent for how this would be done.

### 14.4 Ecosystem Enablement

FreeType itself has no dependent package ecosystem requiring separate riscv64 enablement (Section 10 is accordingly omitted from this report). The one adjacent ecosystem item, the `freetype-py` PyPI binding's riscv64 wheel, has already been delivered by RISE via PR #994 (merged 2026-09-06) - this work item should not be re-sized, as it is complete.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | - | - |
| Performance | Add RVV-optimized anti-aliased rasterizer path to `ftgrays.c` | 4-8 | Upstream contributor or RISE | Medium |
| Performance | Add RVV-optimized bitmap blending in `ftbitmap.c` | 2-3 | Upstream contributor or RISE | Low |
| CI/CD | Add riscv64 CI job to `.gitlab-ci.yml` (QEMU or hardware runner, following the `gst-mac-arm` precedent) | 1-2 | RISE or upstream engagement | Medium |
| Ecosystem | Build and publish `freetype-py` riscv64 wheel to PyPI | 0 (already done: RISE PR #994, merged 2026-09-06) | RISE (`python-wheels`) | Complete |

## 15. References

- [FreeType homepage](https://freetype.org/)
- [FreeType repository (GitLab, freedesktop.org)](https://gitlab.freedesktop.org/freetype/freetype)
- [freetype/freetype GitHub mirror](https://github.com/freetype/freetype)
- [FreeType .gitlab-ci.yml (GitHub mirror)](https://github.com/freetype/freetype/blob/master/.gitlab-ci.yml)
- [freetype-devel mailing list](https://lists.nongnu.org/mailman/listinfo/freetype-devel)
- [FreeType download archive (Savannah)](https://download.savannah.gnu.org/releases/freetype/)
- [FreeType license page](https://freetype.org/)
- [Debian buildd riscv64 status for freetype (sid)](https://buildd.debian.org/status/package.php?p=freetype&suite=sid)
- [Debian bug tracker for src:freetype](https://bugs.debian.org/cgi-bin/pkgreport.cgi?src=freetype)
- [Debian bug #998064](https://bugs.debian.org/998064)
- [Debian bug #866960](https://bugs.debian.org/866960)
- [Ubuntu 26.04 Resolute package search for freetype](https://packages.ubuntu.com/search?keywords=freetype&suite=resolute)
- [Arch Linux RISC-V repository (archriscv.felixc.at)](https://archriscv.felixc.at/repo/extra/)
- [PyPI freetype package](https://pypi.org/project/freetype/)
- [PyPI freetype-py package](https://pypi.org/project/freetype-py/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/)
- [RISE wheel builder - supported packages list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels Issue #1005](https://github.com/riseproject-dev/python-wheels/issues/1005)
- [riseproject-dev/python-wheels PR #994](https://github.com/riseproject-dev/python-wheels/pull/994)
- [riseproject-dev/python-wheels PR #1089 (pygame)](https://github.com/riseproject-dev/python-wheels/pull/1089)
- [riseproject-dev/python-wheels PR #759 (pedalboard)](https://github.com/riseproject-dev/python-wheels/pull/759)
- [riseproject-dev/python-wheels PR #2548 (kivy)](https://github.com/riseproject-dev/python-wheels/pull/2548)
- [riseproject-dev/python-wheels PR #2540 (openimageio)](https://github.com/riseproject-dev/python-wheels/pull/2540)
- [riseproject-dev GitHub organization](https://github.com/orgs/riseproject-dev/repositories)
- [google/android-riscv64 Issue #40](https://github.com/google/android-riscv64/issues/40)
- [matplotlib/matplotlib Issue #25123](https://github.com/matplotlib/matplotlib/issues/25123)
- [haikuports/haikuports Issue #12788](https://github.com/haikuports/haikuports/issues/12788)
- [AOSC-Dev/aosc-os-abbs PR #17488](https://github.com/AOSC-Dev/aosc-os-abbs/pull/17488)
- [libpng RVV SIMD PR #771](https://github.com/pnggroup/libpng/pull/771)
- [brotli RVV optimization PR #1410](https://github.com/google/brotli/pull/1410)