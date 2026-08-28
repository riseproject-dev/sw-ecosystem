---
title: FreeType
categories:
  - libraries
---

# FreeType

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for FreeType
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

FreeType is a portable C library for rendering TrueType, OpenType, CFF, Type 1, and other font formats. It is the de facto font rasterizer for Linux desktop stacks, Android, ChromeOS, and embedded systems. Version 2.14.3 is the current stable release (April 2026).

**Governance.** The project has no formal foundation or governance body. It is maintainer-led, hosted on [freedesktop.org GitLab](https://gitlab.freedesktop.org/freetype/freetype) (migrated from Savannah/nongnu.org in 2021), and uses a patch-review model via the [freetype-devel@nongnu.org](https://lists.nongnu.org/mailman/listinfo/freetype-devel) mailing list.

**Core maintainers:**
- Werner Lemberg (lemzwerg) - lead maintainer; no disclosed corporate affiliation, volunteer
- Alexei Podtelezhnikov (apodtele) - most prolific recent committer (55 of last 100 commits as of mid-2026); no disclosed corporate affiliation
- Suzuki Toshiya - core developer; no disclosed corporate affiliation

**Corporate involvement.** Google and Apple are heavy users (Android/ChromeOS, iOS/macOS) but are not formal sponsors. Adobe donated the CFF rendering engine that became the default in FreeType 2.5 (2013). Mateusz Jurczyk (Google Project Zero) has contributed security fixes. FreeType is NOT a RISE Project member; no RISE blog post in the May 2024 to June 2026 archive mentions FreeType.

**License:** Dual-licensed under the FreeType License (FTL, BSD-style with credit clause) or GPLv2.

**Community stance on new ports.** The project's explicit design goal is "small, efficient, highly customizable, and portable." The codebase contains no architecture-specific assembly beyond legacy 32-bit paths for i386 and arm. Any conforming C99 compiler on any target suffices. New architecture support is transparent from the project's perspective: no port work, no tier decision, no maintainer action required.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2018 | FreeType pure-C design requires no arch-specific port work for any 64-bit target | freetype.org design documentation |
| 2018 (approx.) | Debian riscv64 port begins; early freetype 2.9.1-1 build recorded as "Maybe-Failed" | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=freetype&suite=sid) |
| 2026-04-03 | Debian sid freetype 2.14.3+dfsg-1 built cleanly on rv-osuosl-01, status "Installed", ~14 min build time | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=freetype&suite=sid) |
| Current | Ubuntu 24.04 Noble ships libfreetype6 2.13.2+dfsg-1 for riscv64 as an official tier-1 architecture | [packages.ubuntu.com](https://packages.ubuntu.com/noble/libfreetype6) |

No RISC-V-specific commits exist in the FreeType source tree: searches for "riscv" and "risc-v" in the [freetype/freetype GitHub mirror](https://github.com/freetype/freetype) return zero results across issues, PRs, and commits. No first RISC-V commit date exists because no arch-specific code was ever needed. RISC-V support is implicit, not ported.

**Key contributors to riscv64 availability:** Debian maintainers (not FreeType upstream) are responsible for riscv64 package availability.

---

## 3. Upstream Support Tier

FreeType has no documented tier policy. The following table summarizes the de facto tier evidence.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (Linux, Windows) | Yes (Windows MSBuild, macOS) | No |
| Release-blocking | Yes | Yes (macOS arm64) | No |
| Official prebuilt binaries | No (source-only releases) | No | No |
| Distro packages (Debian sid) | Yes | Yes | Yes (2.14.3+dfsg-1, Installed) |
| Distro packages (Ubuntu Noble) | Yes | Yes | Yes (2.13.2+dfsg-1) |
| Upstream CI QEMU emulation | No | No | No |

**Conclusion.** FreeType ships source-only upstream releases for all architectures, with no prebuilt arch binaries from the project itself. riscv64 is absent from the upstream CI pipeline entirely. However, because FreeType is pure C, this absence has zero practical consequence: Debian and Ubuntu build it cleanly and ship official packages. riscv64 is effectively at functional parity with amd64 and arm64 despite lacking upstream CI coverage.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

FreeType has no JIT, no GC, no cryptography, and no SIMD dispatch infrastructure of any kind. The only architecture-specific code in the entire repository is a single hand-tuned fixed-point multiply function in the TrueType bytecode interpreter.

**TT_MulFix14 in `src/truetype/ttinterp.c`**

The selection chain is:

```
#ifdef FT_INT64            -> 64-bit C path (all 64-bit platforms, including riscv64)
#elif !defined(NO_ASM)
  #if __arm__              -> ARM 32-bit inline asm (~12 lines smull)
  #elif __i386__           -> x86 32-bit inline asm (~11-13 lines imul)
  #ifndef TT_MulFix14      -> pure C fallback
```

The 32-bit ARM and x86 inline assembly paths exist only to handle 32x16-bit fixed-point multiplication efficiently on 32-bit processors that lack 64-bit integer arithmetic. On all 64-bit targets, `FT_INT64` is defined by the compiler and the pure C `int64_t` multiply path is used unconditionally.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TrueType interpreter (TT_MulFix14) | FT_INT64 C path | FT_INT64 C path | FT_INT64 C path |
| Anti-aliased rasterizer (ftgrays.c) | Scalar C | Scalar C | Scalar C |
| All other subsystems (CFF, autofit, bitmap, calc) | Scalar C | Scalar C | Scalar C |
| RVV / NEON / SSE vectorization | None | None | None |
| Inline assembly | 32-bit x86 only (legacy) | 32-bit ARM only (legacy) | None needed |

**riscv64 is not missing any implementation that amd64 or arm64 also have.** The only architecture-specific code in the codebase is 32-bit legacy assembly. Every 64-bit platform uses identical C paths. No RVV, no missing stub, no TODO comment.

The one non-optimization arch guard in the repo is an `#if defined(__GNUC__) && __GNUC__ < 7 && defined(__arm__)` workaround for a specific GCC < 7 compiler bug in `src/smooth/ftgrays.c`. This is not a performance path and does not affect riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

FreeType supports three build systems: autotools, CMake, and Meson. All three produce correct output for riscv64 via standard cross-compilation conventions. No upstream riscv64 toolchain file or cross-file is provided; the standard GNU cross patterns apply.

**Compiler requirements:** C99-compliant compiler. No explicit minimum GCC or Clang version is stated upstream. GCC 7+ and Clang 6+ fully support riscv64 and C99. The build system tests for `-std=c99 -pedantic` and applies `-fvisibility=hidden` when available.

**CMake cross-compilation (minimal, no optional deps):**

```bash
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

No upstream `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists. The `builds/cmake/` directory contains only `FindBrotliDec.cmake`, `FindHarfBuzz.cmake`, `iOS.cmake`, and `testbuild.sh`.

**Autotools cross-compilation** (from `docs/INSTALL.CROSS`):

```bash
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

Upstream `INSTALL.CROSS` explicitly warns against using only `CC=` without `--host` and `--build`. A native C compiler on the host is also required to build the `apinames` tool. For optional dependency detection under cross-compilation, set `PKG_CONFIG_LIBDIR` to the cross-sysroot pkg-config path.

**Meson cross-compilation** requires a cross-file (no upstream file provided):

```ini
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

**QEMU:** No QEMU usage is documented or configured anywhere in the FreeType build system. The project has no practice of running tests under QEMU for cross-compiled targets.

**Known build failures:** None. Debian sid has built 2.14.3+dfsg-1 cleanly on rv-osuosl-01. No riscv64 build failures are recorded in the Debian buildd history since the early 2.9.1-1 "Maybe-Failed" result (circa 2018), which was not reproducible and is not tracked as a known failure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| TrueType rendering | Full | Full | Full | None |
| CFF/OpenType rendering | Full | Full | Full | None |
| Type 1 rendering | Full | Full | Full | None |
| Bitmap fonts (BDF, PCF) | Full | Full | Full | None |
| WOFF2/Brotli decompression | Full (with brotli dep) | Full | Full | None |
| LCD subpixel rendering | Full | Full | Full | None |
| Color fonts (COLR, sbix, CBDT) | Full | Full | Full | None |
| Variable fonts | Full | Full | Full | None |
| TrueType bytecode interpreter | Full | Full | Full | None |
| SIMD-accelerated rasterization | None | None | None | No gap (none exists for any arch) |
| RVV vectorization | N/A | N/A | None | General upstream gap, not riscv64-specific |

**Functional gaps:** None. All FreeType features are available on riscv64.

**Performance gaps:** No RISC-V-specific performance benchmark data exists in any public database. The web search tool returned no results for "FreeType riscv64 benchmark." FreeType has no SIMD acceleration for any architecture; all rasterization is scalar C. Any performance difference between riscv64, amd64, and arm64 is attributable to processor microarchitecture and compiler code generation, not to missing SIMD or JIT paths in FreeType itself.

Recent architecture-agnostic performance improvements that benefit riscv64 equally with other platforms:
- FreeType 2.14.0 (2025-09-07): TrueType instruction interpreter ~15% faster glyph loading; TrueType/CFF 5-10% faster via better 64-bit fixed-point multiply handling; GPOS kern ~3.5x faster. Source: freetype-devel announcement 2025-09-06.
- FreeType 2.14.2 (2026-03-01): ClearType-like LCD rendering >40% faster at sizes above 32ppem. Source: [freetype.org changelog](https://freetype.org/).
- FreeType 2.13.3 (2024-08-12): B/W rasterizer "much faster." Source: freetype.org changelog.

**Security hardening gaps:** None identified. CVE-2025-27363 (out-of-bounds write in <= 2.13.0) and the 2026-03 security fixes (2.14.3) are not architecture-specific.

**Floating-point / NaN semantics:** FreeType uses 26.6 fixed-point arithmetic internally (integer, no floating-point). No floating-point semantics issues on riscv64 are applicable.

---

## 7. CI/CD Infrastructure

FreeType's CI is managed entirely via `.gitlab-ci.yml` on [freedesktop.org GitLab](https://gitlab.freedesktop.org/freetype/freetype). The GitHub mirror has no `.github/workflows/` directory (GitHub API returns 404). No `Jenkinsfile` or `.cirrus.yml` exists.

The complete `.gitlab-ci.yml` was retrieved and inspected. It contains zero occurrences of "riscv", "riscv64", "RISCV", "linux/riscv64", "qemu", or any RISC-V cross-compilation flag.

| CI platform | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux (autotools, meson, cmake) | Yes (Debian container, 7 jobs) | No | No |
| Windows (meson/msbuild vs2022) | Yes (amd64 + x86) | Yes (msbuild only) | No |
| macOS (autotools, meson) | No (ARM runner) | Yes (gst-mac-arm) | No |
| QEMU emulation for non-native targets | No | No | No |
| RISE CI runners | No | No | No |

The Linux CI jobs run on `registry.freedesktop.org/freetype/docker-images/debian:latest` with no architecture tag, meaning amd64 only. The macOS CI runs on an Apple Silicon (ARM64) runner tagged `gst-mac-arm`.

**No riscv64 CI exists anywhere in the FreeType project.** riscv64 correctness is validated entirely via downstream distribution build infrastructure (Debian buildd, Ubuntu launchpad).

---

## 8. Distribution and Release Status

**Upstream releases:** FreeType distributes source-only releases (`.tar.gz`, `.tar.xz`, `.zip`) via [download.savannah.gnu.org](https://download.savannah.gnu.org/releases/freetype/). No prebuilt architecture-specific binaries are provided in any release. The [freetype/freetype GitHub mirror](https://github.com/freetype/freetype) has zero GitHub releases.

**Linux distribution packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | libfreetype6, libfreetype-dev, freetype2-demos | 2.14.3+dfsg-1 | Installed (rv-osuosl-01, 2026-04-03) |
| Ubuntu 24.04 Noble | libfreetype6, libfreetype-dev, freetype2-demos | 2.13.2+dfsg-1 | Official tier-1 (amd64, arm64, armhf, i386, ppc64el, riscv64, s390x) |
| Arch Linux RISC-V (archriscv.felixc.at) | freetype2 | Unknown | [NEEDS VERIFICATION] - archriscv.felixc.at fetch returned no usable data |

Debian sid also ships the following riscv64 packages derived from the freetype source: `librust-freetype-dev` (0.7.2), `librust-freetype-rs-dev` (0.36.0), `librust-freetype-sys-dev` (0.20.1), Haskell bindings, Perl bindings, R bindings, and `python3-freetype` (arch: all, pure Python).

**Python binding (`freetype-py` 2.5.1 on PyPI):** Wheels are published for manylinux_x86_64, manylinux_aarch64, musllinux_x86_64, musllinux_aarch64, macOS universal2, and win_amd64. No riscv64 wheel exists. RISE wheel builder does not cover freetype-py (confirmed: freetype not listed among the 83 RISE-supported packages; [riseproject.gitlab.io wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)). Users on riscv64 must either build from source or use the `python3-freetype` distro package.

**What a user must do to get a working binary on riscv64:**
- On Debian/Ubuntu: `apt install libfreetype6` - works out of the box.
- From source: standard autotools, CMake, or Meson cross-compilation as documented in Section 5 - no patches required.
- Python binding: use `python3-freetype` from the distro package, or build `freetype-py` from source with `pip install freetype-py --no-binary freetype-py`.

---

## 9. Dependencies

All five optional external dependencies of FreeType are available as official Debian sid packages for riscv64 with no open correctness blockers.

| Dependency | Role | riscv64 Build | riscv64 Test (upstream) | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| zlib | Gzip-compressed font decompression | Clean | No upstream riscv64 CI | Debian sid: 1:1.3.dfsg+really1.3.2-3 | None. No SIMD on any arch. |
| libpng | PNG-compressed embedded bitmaps in OT/TT | Clean | No upstream riscv64 CI | Debian sid: 1.6.58-1 | None blocking. RVV SIMD merged Dec 2025 (PR #771), correctness bugs fixed (PR #769, #711). Lacks automated riscv64 regression testing. |
| bzip2 | Bzip2-compressed font decompression | Clean | No upstream CI (sourceware.org, maintenance mode) | Debian sid: 1.0.8-6+b2 | None. No SIMD anywhere. |
| brotli | WOFF2 Brotli decompression | Clean | No upstream riscv64 CI | Debian sid: 1.2.0-3 | RVV performance optimization PR #1410 (open Dec 2025) blocked on CLA failure; alternative PR #1489 closed June 2026. Correctness unaffected. Performance-only gap. |
| HarfBuzz (>= 2.0.0) | OpenType auto-hinting; glyph coverage | Clean | No upstream riscv64 CI | Debian sid: libharfbuzz0b 12.3.2-2 | None. No RVV code in repo. Scalar-only, same as amd64 and arm64. |

**libpng** is the most active RISC-V dependency: it merged RVV SIMD support (PR #771, targeting 1.6.53, December 2025) and fixed riscv64-specific correctness issues (PRs #769, #711). It lacks automated riscv64 CI. FreeType uses libpng only for embedded PNG bitmaps in OpenType/TrueType fonts, a minor use case relative to glyph rasterization.

**brotli** has a stalled RVV performance optimization (PR #1410, CLA failure as of June 2026). WOFF2 decompression correctness is unaffected; this is a performance-only gap for WOFF2 processing.

**HarfBuzz**, when used for dynamic loading (`FT_DYNAMIC_HARFBUZZ=ON`), is loaded via `dlopen` at runtime. The auto-hinting improvement is available on riscv64 if HarfBuzz is present on the target system.

All five dependencies are tracked in dedicated reports in this repository: `./libraries/zlib.md`, `./multimedia/libpng.md`, `./libraries/bzip2.md`, `./libraries/brotli.md`, and `./libraries/harfbuzz.md`.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues were found in any accessible source. The upstream GitLab instance (gitlab.freedesktop.org) is protected by the Anubis bot challenge system and returned "Access Denied: error code 9e4edb5b6b850c41" for all automated fetch attempts. The Savannah bug tracker also returned bot-protection pages. The following findings come from Debian's bug tracker and build records.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | No riscv64-specific FreeType bugs | - | - | GitHub mirror: 0 issues/PRs mentioning riscv. Arch riscv64: no freetype2 patches in archriscv-packages. |
| Debian #998064 | "fails to display text containing letter 'e' due to errors in libfreetype after upgrade" | Outstanding | Important | Not architecture-specific. |
| Debian #866960 | "ABI/API change yielding blank line between characters due to different rounding for TrueType fonts" | Forwarded, tagged wontfix | Important | Affects all architectures; not riscv64-specific. |
| CVE-2025-27363 | Out-of-bounds write in FreeType <= 2.13.0 | Fixed (>= 2.13.1) | High | Not architecture-specific. |
| (unnamed) | 32-bit integer overflow in `src/sdf/ftsdf.c`, potential heap buffer overflow | No CVE assigned in accessible content | Medium | Not riscv64-specific. Feb 2026. |

**Correctness bugs on riscv64:** None found.

**Regression notes:** FreeType 2.14.1 (2025-09-11, emergency patch) fixed critical regressions introduced in 2.14.0 (GitLab issues #1349, #1353, #1354, #1355, #1356). These affected all architectures, not riscv64 specifically.

---

## 12. Objections and Upstream Blockers

**No objections, technical blockers, or organizational blockers exist for riscv64 in FreeType.**

The project's design philosophy is explicit portability. There is no stated opposition to new architectures, no tier policy that would relegate riscv64 to a lower support class, and no maintainer on record objecting to riscv64 use. Because the library contains no architecture-specific code for any 64-bit target, there is nothing to upstream in the functional sense.

The one practical gap - absence of riscv64 CI - requires no upstream architectural change, only the addition of a CI runner or QEMU emulation job. This is entirely within the project's control and precedent (macOS arm64 CI was added via a tagged runner). Probability of acceptance for a riscv64 CI patch: high [NEEDS VERIFICATION against upstream maintainer communications, which are inaccessible due to Anubis protection on freedesktop.org GitLab].

---

## 13. Investment Analysis

RISE has not funded any work on FreeType. There is no RISE blog post, no riseproject-dev GitHub repository, and no RISE wheel builder entry for FreeType as of June 2026.

### 13.1 Functional Enablement

No work required. FreeType is fully functional on riscv64 as pure C code. All features available on amd64 and arm64 are available on riscv64 without modification.

### 13.2 Performance Optimization

FreeType contains no SIMD-accelerated rasterization paths for any architecture, including amd64 and arm64. Adding RVV (RISC-V Vector) optimizations to the rasterizer would be a net-new capability, not a parity effort. The anti-aliased rasterizer (`src/smooth/ftgrays.c`) and the bitmap blending paths are the primary candidates for vectorization.

Context: HarfBuzz developer Behdad Esfahbod announced in February 2026 that a new CPU rasterizer in HarfBuzz (`hb-raster`) claims "2x or more faster than FreeType's" in initial testing (~1,000 lines, no hinting). This indicates competitive pressure on FreeType's rasterizer performance. RVV optimization of FreeType's rasterizer would address both the competitive gap and the general absence of SIMD in FreeType.

No quantitative data is available for FreeType riscv64 vs arm64 vs amd64 performance.

### 13.3 CI/CD Infrastructure

The gap is well-defined and bounded: add a riscv64 CI job to `.gitlab-ci.yml` using either a physical riscv64 runner or QEMU user-mode emulation. FreeType's CI already uses an ARM64 macOS runner via a runner tag (`gst-mac-arm`), establishing precedent for non-amd64 CI.

### 13.4 Ecosystem Enablement

The `freetype-py` Python binding lacks a riscv64 wheel on PyPI. This is a packaging gap, not an upstream code gap. Producing a manylinux riscv64 wheel requires a RISC-V build environment and publishing to PyPI. RISE's wheel builder infrastructure would be a natural home for this, but FreeType is not currently in scope there.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | - | - |
| Performance | Add RVV-optimized anti-aliased rasterizer path to ftgrays.c | 4-8 | Upstream contributor or RISE | Medium |
| Performance | Add RVV-optimized bitmap blending in ftbitmap.c | 2-3 | Upstream contributor or RISE | Low |
| CI/CD | Add riscv64 CI job to .gitlab-ci.yml (QEMU or hardware runner) | 1-2 | RISE or Qualcomm upstream engagement | Medium |
| Ecosystem | Build and publish freetype-py manylinux riscv64 wheel to PyPI | 1 | RISE wheel builder team | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [FreeType homepage](https://freetype.org/)
- [freetype/freetype GitHub mirror](https://github.com/freetype/freetype)
- [FreeType GitLab (freedesktop.org) - Anubis-protected, automated access blocked](https://gitlab.freedesktop.org/freetype/freetype)
- [Debian buildd riscv64 status for freetype (sid)](https://buildd.debian.org/status/package.php?p=freetype&suite=sid)
- [Debian bug tracker for src:freetype](https://bugs.debian.org/cgi-bin/pkgreport.cgi?src=freetype)
- [Ubuntu Noble libfreetype6 package](https://packages.ubuntu.com/noble/libfreetype6)
- [PyPI freetype package](https://pypi.org/project/freetype/)
- [PyPI freetype-py package](https://pypi.org/project/freetype-py/)
- [RISE Project wheel builder - supported packages list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/orgs/riseproject-dev/repositories)
- [FreeType download archive (Savannah)](https://download.savannah.gnu.org/releases/freetype/)
- [freetype-devel mailing list](https://lists.nongnu.org/mailman/listinfo/freetype-devel)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [felixonmars/archriscv-packages GitHub (patch tracking)](https://github.com/felixonmars/archriscv-packages)
- [Debian bug #998064 - font display regression](https://bugs.debian.org/998064)
- [Debian bug #866960 - TrueType rounding ABI change](https://bugs.debian.org/866960)
- [libpng RVV SIMD PR #771](https://github.com/pnggroup/libpng/pull/771)
- [brotli RVV optimization PR #1410](https://github.com/google/brotli/pull/1410)