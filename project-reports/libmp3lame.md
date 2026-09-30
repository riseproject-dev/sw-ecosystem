---
title: libmp3lame
parent: Project Reports
color: yellow
dependencies:
  - name: libmpg123
    relation: runtime-dependency
    criticality: critical
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
  - name: libsndfile
    relation: runtime-dependency
    criticality: optional
  - name: GTK4
    relation: runtime-dependency
    criticality: optional
  - name: CMocka
    relation: test-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libmp3lame" %}

# libmp3lame

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libmp3lame<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LAME ("LAME Ain't an MP3 Encoder") is a widely deployed open-source MP3 encoder implemented in C. The canonical upstream source is the [SourceForge SVN repository](https://sourceforge.net/projects/lame/) (source-only distribution; "we provide source code only" per the project page). There is no GitHub presence for the canonical project - `gypified/libmp3lame` is a third-party GYP build-system wrapper (14 commits, last pushed 2013-04-01, packaging LAME 3.99.5) and is not upstream.

The project was in low-maintenance mode for over seven years (last release 3.100, October 2017) until 2026, when it released **3.101 on 2026-07-09** and then **4.0 on 2026-07-11**, two days apart - the first releases since 2017. SVN trunk remains active after the 4.0 release: one live check found trunk at r6834 (2026-09-17), a second found r6835 (2026-09-19); both post-date the 4.0 release and this discrepancy (r6834 vs r6835) reflects two separate live reads on different days rather than a contradiction in the underlying data.

**Governance:** Informal, unchanged by the 4.0 release. Founded by Mike Cheng (1998), later led by Mark Taylor (who stepped down in early 2003), now run collaboratively by a small group of SourceForge committers (`aleidinger`, `bouvigne`, `jaz001`, `rbrito`, `robert`). No foundation, no governance document, no MAINTAINERS or CODEOWNERS file. `lame.sourceforge.io` could not be fetched directly (HTTP 403); governance details above are corroborated from the SourceForge project page, Wikipedia, and OpenHub rather than a direct read of that domain.

**Corporate sponsors:** None found. Debian packaging maintainers (Fabian Greffrath, Reinhard Tartler, the Debian Multimedia Maintainers team) and Alpine's packager are community volunteers with no known corporate affiliation to LAME itself. libmp3lame does **not** appear on the [RISE (RISC-V Software Ecosystem) members list](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). RISE's only connection to this project is indirect: it builds and publishes a third-party Python binding, `lameenc`, that statically links libmp3lame (see Section 12).

**Community stance on new ports:** Implicit acceptance, unchanged. No formal RFC/tiering process exists; if the portable C code compiles and tests pass, the architecture is treated as supported. Architecture-specific optimization (x86 NASM assembly, SSE/AVX/NEON intrinsics) is contributed ad hoc via the SourceForge patch tracker.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 1998 | LAME project founded | [SourceForge project page](https://sourceforge.net/projects/lame/) |
| 1999-11-18 | Hosted on SourceForge | [SourceForge project page](https://sourceforge.net/projects/lame/) |
| 2017-10-13 | LAME 3.100 released | [SourceForge files](https://sourceforge.net/projects/lame/files/lame/) |
| 2021-06-15 | Patch #96 opened - "Fix build on riscv64/FreeBSD" (Robert Clausecker) | [Patch #96](https://sourceforge.net/p/lame/patches/96/) |
| 2021-06-19 | Patch #96 committed to SVN trunk by Alexander Leidinger ("Committed. Thanks!") | [Patch #96](https://sourceforge.net/p/lame/patches/96/) |
| 2026-07-09 | LAME 3.101 released - first tagged release to contain the Patch #96 riscv64/FreeBSD fix | [SourceForge files](https://sourceforge.net/projects/lame/files/lame/) |
| 2026-07-11 | LAME 4.0 released - GTK4 migration, new SIMD work (SSE2-by-default, AVX2, AVX-512, ARM NEON), security fixes | [SourceForge LAME 4.0 files](https://sourceforge.net/projects/lame/files/lame/4.0/) |
| 2026-07-27 | RISE blog: "SALTyRN" post on auto-translating ARM NEON kernels to RVV via LLMs - methodologically adjacent, does not mention LAME | [SALTyRN post](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/) |
| 2026-09-06 | RISE's `python-wheels` project publishes `lameenc` v1.8.4 riscv64 wheels (third-party binding, not libmp3lame itself) | riseproject-dev/python-wheels, `docs/packages/lameenc.yaml` |
| 2026-09-17 / 2026-09-19 | SVN trunk at r6834 / r6835 (two independent live reads; see Section 1) | SourceForge SVN |

**Key contributors to the sole RISC-V-specific change:** Robert Clausecker (submitter, patch derived from LLVM's `fpsetmask`/riscv64 fix at [reviews.llvm.org/D89557](https://reviews.llvm.org/D89557)), Alexander Leidinger (SVN committer). No corporate affiliation was found for either.

**Is riscv64 support fully upstream?** Yes, in the narrow sense that the one RISC-V-related change (a build-portability fix) is committed to upstream SVN and shipped in 3.101 and 4.0. No downstream riscv64-specific patch tree exists anywhere (see Section 13 for how this drives the readiness grade). "Upstream support" here means only that the generic C path compiles cleanly - no riscv64 architecture-specific optimization work exists or has been proposed.

## 3. Upstream Support Tier

LAME has no formal tier policy and publishes no supported-architectures list.

**Evidence by category:**
- **CI:** None exists anywhere in the project. Direct reads of the SVN trunk file listing (`https://sourceforge.net/p/lame/svn/HEAD/tree/trunk/lame/`) confirm no `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, `.github/workflows`, `appveyor.yml`, or `azure-pipelines.yml` anywhere in the tree. This was independently re-verified twice against the live tree (see Section 7).
- **Release-blocking:** No architecture-gated release criteria exist. 3.101 and 4.0 (2026-07-09 / 2026-07-11) are the first releases since 2017; riscv64 was not a gating factor for either.
- **Official binaries from upstream:** None. Source tarballs only, for every architecture including amd64.

**Architecture comparison:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Compiles from source | Yes | Yes | Yes |
| CI (upstream) | None | None | None |
| Official binary release | Source only | Source only | Source only |
| Distro binary package | Yes | Yes | Yes (Ubuntu 26.04 resolute, Debian sid/trixie, Arch Linux RISC-V) |
| SIMD acceleration (LAME 4.0) | SSE2 (default), AVX2, AVX-512 | NEON | None (scalar C) |
| Formal support tier | N/A | N/A | N/A |

riscv64 is functionally on par with arm64 for buildability and packaging, but as of 4.0 it has fallen further behind on SIMD: arm64 now has a NEON path where it previously had none.

## 4. Technical Architecture and RISC-V-Specific Subsystems

LAME's architecture-sensitive code lives in two subdirectories, both C-intrinsics/asm only - there is no JIT backend of any kind in LAME.

**`libmp3lame/i386/` (x86 NASM assembly):** `choose_table.nas` (Huffman table selection), `cpu_feat.nas` (SSE/3DNow feature detection), `fft.nas`/`fft3dn.nas`/`fftfpu.nas`/`fftsse.nas`/`ffttbl.nas` (FFT variants), `scalar.nas`.

**`libmp3lame/vector/` (SIMD intrinsics, confirmed by direct fetch of the directory listing and `Makefile.am` as of the 4.0-era tree):**
- x86/x86-64: `xmm_quantize_sub.c` (SSE, wrapped in `#ifdef HAVE_XMMINTRIN_H`), `avx2_*.c` (new in 4.0 - vectorized quantization, Huffman table search, VBR noise estimation), `avx512_quantize_lines.c` (new in 4.0)
- ARM: `neon_choose_table.c` (new in 4.0)
- **riscv64: no entry of any kind.**

**Architecture-specific code comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| FFT | Hand-tuned NASM (SSE, 3DNow, FPU variants) | Generic C | Generic C |
| Quantization (xrpow) | SSE2 + AVX2 + AVX-512 intrinsics | NEON intrinsics (4.0+) | Generic C |
| CPU feature detection | NASM (`cpu_feat.nas`) | N/A | N/A |
| Huffman coding | NASM (`choose_table.nas`) | NEON intrinsics (4.0+) | Generic C |
| RVV (RISC-V Vector) intrinsics | N/A | N/A | None |
| JIT backend | None | None | None |
| `#ifdef __riscv` guards | N/A | N/A | 0 occurrences |

**Verdict (re-confirmed by direct fetch of the SVN tree, not just the changelog): SCALAR.** Not "full" - zero hand-tuned riscv64 assembly exists. Not "partial" - zero RVV C intrinsics exist; the `vector/` dispatch layer branches only for x86 (SSE/AVX2/AVX-512) and ARM (NEON), with no riscv64 entry at all. Not "missing" - the library compiles and runs correctly via the portable reference C implementation, proven in production by Debian/Ubuntu/Arch riscv64 binary packages built from this exact source tree. riscv64 gets a complete, functional, entirely unoptimized encoder. The single riscv-specific commit in LAME's history (Patch #96) exists only to unblock the build on riscv64/FreeBSD, not to accelerate encoding; no riscv branch of the optimization layer was ever started.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (`configure`/`Makefile.am`, generated via `autogen.sh`). No CMake, no `CMakeLists.txt` exists anywhere in the tree - confirmed directly against the SVN trunk file listing, which also confirms no Dockerfile and no QEMU documentation of any kind ship with the project.

**Cross-compile command for riscv64** (standard autotools cross-compilation; no riscv64-specific configure flag is documented anywhere upstream):

```
CC=riscv64-linux-gnu-gcc \
CFLAGS="-O2" \
LDFLAGS="-Wl,--as-needed" \
./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --disable-nasm \
  --with-pic \
  --disable-mp3x \
  --disable-gtktest \
  --prefix=/usr
```

**Why `--disable-nasm`:** `configure.ac` hard-codes NASM eligibility to `*86` hosts; on any other `host_cpu`, `CPUTYPE` is forced to `"no"` and NASM is silently skipped regardless of `--enable-nasm`. `--disable-nasm` simply avoids an unnecessary `nasm` PATH lookup.

**riscv64 falls into the `configure.ac` generic default case** (no `TAKEHIRO_IEEE754_HACK`, no `USE_FAST_LOG` - those are enabled only for the x86_64 and powerpc cases).

**Cross-compile `sizeof` overrides** (needed because `--host` differs from `--build`, so `configure`'s runtime probes cannot run):

```c
#define SIZEOF_SHORT 2
#define SIZEOF_INT 4
#define SIZEOF_LONG 8        /* 64-bit on riscv64 */
#define SIZEOF_LONG_LONG 8
#define SIZEOF_FLOAT 4
#define SIZEOF_DOUBLE 8
#define SIZEOF_LONG_DOUBLE 16
/* riscv64 is little-endian - do NOT define WORDS_BIGENDIAN */
```

No pre-built `config/linux/riscv64/config.h` exists in the tree; the closest template remains `config/linux/arm/config.h` (both little-endian, NASM disabled, 64-bit `SIZEOF_LONG`).

**Toolchain requirement:** No GCC/Clang minimum version is documented for riscv64 specifically. The library builds cleanly with GCC 10+ or Clang 12+ on riscv64 per Debian build records. Required cross package: `gcc-riscv64-linux-gnu`.

**QEMU:** No Dockerfile or QEMU documentation exists upstream. Standard approach: `qemu-riscv64-static ./lame [args]` for static-binary testing, or `dpkg-buildpackage -a riscv64` under `binfmt_misc` for Debian-style cross-builds.

**Known build failures:** None open. The sole historical riscv64 build failure (FreeBSD `fpsetenv()`/`fp_except_t` incompatibility) was fixed by Patch #96 in 2021 and has shipped since LAME 3.101 (2026-07-09). A stale marker (`BROKEN_riscv64= fails to compile: needs FP_X_INV from empty sys/riscv/include/ieeefp.h`) persists in the outdated `freebsd/freebsd-ports-gnome` mirror's `audio/lame/Makefile`, but the **official** FreeBSD ports tree (`cgit.freebsd.org/ports/plain/audio/lame/Makefile`) carries no such marker and builds cleanly on riscv64; the ports-gnome marker should be treated as stale, not current status.

**Files confirmed absent:** `BUILDING.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, `cmake/toolchain-riscv64.cmake`, `Dockerfile.riscv64`, `.ci/docker/`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| MP3 encoding (all bitrates) | Yes | Yes | Yes |
| VBR/CBR/ABR modes | Yes | Yes | Yes |
| ID3 tag writing | Yes | Yes | Yes |
| Gapless encoding | Yes | Yes | Yes |
| SIMD-accelerated FFT | Yes (NASM) | No | No |
| SIMD-accelerated quantization | Yes (SSE2/AVX2/AVX-512) | Yes (NEON, 4.0+) | No |
| IEEE754 fast-path (`TAKEHIRO_IEEE754_HACK`) | Yes | No | No |
| Fast logarithm (`USE_FAST_LOG`) | Yes (x86_64 path) | No | No |
| ReplayGain analysis | Yes | Yes | Yes |
| Psychoacoustic model | Yes | Yes | Yes |

**Functional gaps:** None. All features are available on riscv64 via the generic C path; nothing is structurally disabled.

**Performance gaps:** Significant and growing. LAME 4.0's changelog (`doc/html/history.html`) gives exact x86/ARM figures with no riscv64/RVV equivalent anywhere:
- SSE2 (now default on all x86 builds): "about 5 to 9 percent on a Xeon X5675, and 0 to 3 percent on a Core i7-10700."
- AVX2 on Core i7-10700: CBR ~16% faster with GCC, ~22% faster with MSVC; VBR ~6% faster with MSVC, "roughly unchanged with GCC."
- AVX-512: "about 6.5% of a `-b 320` encode on an Intel Ice Lake part."
- ARM NEON (new in 4.0): "about 3.5% of a `-b 320` encode and about 1% of a `-V` one."
- RISC-V/RVV: zero mentions in the changelog, zero files in `libmp3lame/vector/` or anywhere else in the tree.

No third-party riscv64-vs-arm64/amd64 benchmark was found in two independent research passes (Phoronix and OpenBenchmarking.org both returned HTTP 403; comparable projects in this repository, e.g. `ffmpeg` and `filament`, independently report the same absence of codec/SIMD benchmark data on riscv64). **Data not available: measured encoding throughput ratio between riscv64 and amd64/arm64.** The gap is widening, not static - x86 and ARM both gained measurable speedups in 4.0 while riscv64 remains 100% scalar.

**Floating-point semantics:** Bug #521 ("Takehiro's IEEE hack configure option broken") is now **closed-fixed** (fix landed in the dev tree, targeted for 4.1); this code path is not enabled on riscv64 regardless (the generic-C `configure.ac` case never sets `TAKEHIRO_IEEE754_HACK`), so the fix is neutral for riscv64. Patch #72 (undefined behavior in signed left-shifts) is also now **closed-fixed** (2026-08-09, "similar fix done independently... will be in lame 4.1"). No riscv64-specific manifestation of either was ever filed.

**Security hardening:** LAME 4.0 fixed two issues, both architecture-agnostic in their code path: a stack buffer overflow in the Blade-compatible `lame_enc.dll` (`beInitStream()`, CVSS 8.4) - Windows-DLL-only, not relevant to riscv64 - and an integer underflow in the AIFF header parser (`parse_aiff_header()`, CVSS 5.5) causing an unbounded hang on crafted tiny files - this is generic C code and does affect riscv64 builds equally with every other architecture. No CVE IDs were assigned in the published changelog text.

## 7. CI/CD Infrastructure

**Upstream SourceForge project:** No CI of any kind exists, for any architecture. This was verified directly, twice, against the live SVN trunk file listing (`https://sourceforge.net/p/lame/svn/HEAD/tree/trunk/lame/`): directories are `ACM, Dll, debian, doc, dshow, frontend, include, libmp3lame, m4, mac, maintainer, misc, mpglib, po, test, vc_solution`; build/config files are `.clang-format, .gitignore, Makefile.am, Makefile.am.global, Makefile.in, Makefile.MSVC, configure, configure.ac, acinclude.m4, aclocal.m4, config.guess, config.sub, config.h.in, config.rpath, configMS.h, depcomp, install-sh, ltmain.sh, missing, test-driver, compile`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, `.github/workflows`, `appveyor.yml`, or buildbot config is present. The project builds exclusively through manual local autotools invocation.

**`gypified/libmp3lame` GitHub mirror:** No CI either - `GET /repos/gypified/libmp3lame/contents/.github/workflows` returns HTTP 404; no `.travis.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

**RISE Project:** No RISE runner or CI is configured for libmp3lame itself. RISE's only riscv64 build infrastructure touching this codebase at all is the `build-lameenc.yml` GitHub Actions workflow in `riseproject-dev/python-wheels`, which runs on RISE's native `ubuntu-24.04-riscv` runner fleet - but it builds the third-party `lameenc` Python binding (which statically links a locally-compiled LAME 3.100), not libmp3lame's own test suite or build. This is downstream packaging infrastructure for a different project, not CI for libmp3lame.

**CI comparison:**

| CI item | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| CI exists (upstream) | No | No | No |
| Automated build check (upstream) | No | No | No |
| Automated test suite (upstream) | No | No | No |
| RISE runner (for libmp3lame itself) | No | No | No |
| Distro buildbot (Debian buildd) | Yes | Yes | Yes |

The only automated build verification for riscv64 anywhere in the chain is each distro's own buildd infrastructure (Debian, Ubuntu, Arch Linux RISC-V), which builds the packaged `lame`/`libmp3lame` source unmodified. This is distro-owned, not upstream-owned, and produces no test-suite signal back to the LAME project.

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs only, for every architecture including amd64. Current releases: 3.101 (2026-07-09) and 4.0 (2026-07-11), both containing the Patch #96 riscv64/FreeBSD build fix.

**PyPI:** No `libmp3lame` package exists (`https://pypi.org/pypi/libmp3lame/json` returns HTTP 404) - expected, since libmp3lame is a C library, not a Python package. (A separate third-party Python binding, `lameenc`, which statically links libmp3lame, is covered in Section 12; it is not published by the libmp3lame project.)

**Ubuntu 26.04 "resolute":** Live-verified via direct byte-exact mirror fetch, not just the search page:

| Package | Version | Architectures |
|---|---|---|
| `libmp3lame-dev` | 3.101~svn6525+dfsg-2 | amd64 arm64 armhf i386 ppc64el **riscv64** s390x |
| `libmp3lame0` | 3.101~svn6525+dfsg-2 | amd64 arm64 armhf i386 ppc64el **riscv64** s390x |
| `libmp3lame-ocaml` | 0.3.7-4build2 | amd64 arm64 armhf ppc64el **riscv64** s390x |
| `libmp3lame-ocaml-dev` | 0.3.7-4build2 | amd64 arm64 armhf ppc64el **riscv64** s390x |

`HEAD http://ports.ubuntu.com/pool/main/l/lame/libmp3lame-dev_3.101~svn6525+dfsg-2_riscv64.deb` returned HTTP 200, content-length 351786 bytes, exact byte match against the package index. The same pattern was confirmed for `libmp3lame0`.

**Debian:** sid/trixie ship `libmp3lame0`/`libmp3lame-dev` for riscv64 built from the same `3.101~svn6525+dfsg-2` source.

**Arch Linux RISC-V** (`archriscv.felixc.at`): `repo/extra/` contains `lame-4.0-1-riscv64.pkg.tar.zst`; live `HEAD` request returned HTTP 200, content-length 319726, last-modified 2026-07-19. This confirms and extends the prior report's "status not determinable" finding for Arch.

**What a user must do to get a working riscv64 binary:** Debian sid/trixie or Ubuntu 26.04+: `apt install libmp3lame0 libmp3lame-dev` - works with no extra steps. Arch Linux RISC-V: install `lame` from the `extra` repository. Any other distribution or custom build: build from the SourceForge source tarball using the autotools cross-compile procedure in Section 5.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|---|
| libmpg123 | Runtime dependency (MP3 decode backend for the `lame`/`mp3rtp` frontend tools) | Critical | Yes - found in Ubuntu 26.04 resolute (`libmpg123-0t64`/`libmpg123-dev`, `PKG_CHECK_MODULES libmpg123 >= 1.26.0`); `libmp3lame0` directly depends on `libmpg123-0t64` + `libc6` | No riscv64 failures found | Debian sid/trixie, Ubuntu 26.04 resolute | Generic C path on riscv64, no SIMD; no open riscv64-specific bugs in its tracker |
| ncurses | Runtime dependency (VBR histogram display in the `lame` frontend, probed via `termcap`/`curses`/`ncurses` in `configure.ac`) | Optional | Yes - found in Ubuntu 26.04 resolute (`libncurses6`/`libncurses-dev`) | No riscv64 failures found | Debian/Ubuntu riscv64 | No blocker |
| libsndfile | Runtime dependency (alternate audio file I/O backend, `PKG_CHECK_MODULES sndfile >= 1.0.2`) | Optional | Yes - found in Ubuntu 26.04 resolute (`libsndfile1`/`libsndfile1-dev`) | No riscv64 failures found | Debian/Ubuntu riscv64 | No blocker |
| GTK4 | Runtime dependency (`mp3x` graphical analyzer frontend, `PKG_CHECK_MODULES gtk4 >= 4.10`) - supersedes GTK2 as of the current `configure.ac` on trunk | Optional | Yes - found in Ubuntu 26.04 resolute (`libgtk-4-1`/`libgtk-4-dev`) | No riscv64-specific issues found | Debian/Ubuntu riscv64 | GTK2 is no longer what current trunk builds against; the `mp3x` tool is rarely built by distro packages regardless |
| CMocka | Test dependency (build-time only, required solely when `--enable-unit-tests` is explicitly passed to `configure`) | Optional | Yes - found in Ubuntu 26.04 resolute (`libcmocka0`/`libcmocka-dev`) | Not itself under test (it is the test framework) | Debian/Ubuntu riscv64 | Newly identified in the 4.0-era build; no effect on the default build when omitted |
| GCC | Build dependency (compiler toolchain; `gcc-riscv64-linux-gnu` for cross-compilation) | Critical | Yes - LAME builds cleanly with GCC 10+ on riscv64 per Debian build records | N/A (toolchain, not a runtime artifact) | Available on all major riscv64 distros | No documented riscv64-specific minimum version or rationale exists upstream |
| autoconf | Build dependency (regenerates `configure` from `configure.ac`) | Optional | Yes - standard package on riscv64 distros | N/A | Debian/Ubuntu riscv64 | Only needed when regenerating the build system; release tarballs ship a pre-generated `configure` |
| automake | Build dependency (regenerates `Makefile.in` from `Makefile.am`) | Optional | Yes - standard package on riscv64 distros | N/A | Debian/Ubuntu riscv64 | Same caveat as autoconf |
| nasm (indirect, x86 assembler) | Build-time, x86-only | Not applicable on riscv64 | Present as a riscv64 package in Ubuntu 26.04 resolute, but not used on the libmp3lame riscv64 build path - `configure.ac` forces `--disable-nasm`-equivalent behavior off `*86` hosts | N/A | N/A | Not a real riscv64 dependency of this project |
| libm (indirect, math functions) | Mandatory, provided transitively by glibc | Critical | Bundled with glibc on all Debian/Ubuntu riscv64 builds | Fully exercised via glibc | Bundled with glibc | No blocker |
| libiconv (indirect, ID3 tag character encoding) | Optional | Optional | Provided by glibc on riscv64, no separate package needed | Integrated | Via glibc | No blocker |

**libmpg123 deep-dive:** The only near-mandatory dependency with SIMD implications. Its x86/ARM SIMD paths are not compiled on riscv64 either - it falls back to the same generic C approach as libmp3lame itself. No open riscv64-specific bugs exist in its tracker. No functional blocker. A dedicated status report for libmpg123 is tracked in this repository's `projects.yml` but no report file exists for it yet, so its own readiness grade cannot be cited here.

**SIMD dependency chain:** The acceleration chain across this dependency set (NASM/SSE2/AVX2/AVX-512 for libmp3lame, similarly x86-first optimization in libmpg123) is entirely x86-first, with ARM NEON now present in libmp3lame 4.0. No dependency in this chain provides RVV acceleration; the full encode/decode pipeline runs scalar C on riscv64 end to end.

## 11. Known Bugs and Active Issues

**Upstream SourceForge tracker, checked live 2026-09-30.** Several items that were open as of the prior report pass have since closed, targeted at the unreleased 4.1:

| ID | Title | Status | riscv64 Relevance |
|----|-------|--------|-------------------|
| Bug #522 | Heap-buffer-overflow in `lame_copy_inbuffer()` | Closed-fixed | Architecture-agnostic memory-safety fix; benefits riscv64 equally with every other architecture |
| Bug #521 | Takehiro's IEEE hack configure option broken | Closed-fixed | None - this code path is never enabled on riscv64 |
| Bug #520 | [REQ] AVX512 optimizations | Closed | AVX2 and full AVX-512 work landed in the dev tree instead; no riscv64-equivalent request exists |
| Bug #498 | Crash in `psymodel.c:calc_energy` | Closed (2026-08-23) | Root cause: uninitialized float -> NaN from malformed input; generic C fix, applies to riscv64 |
| Patch #72 | Undefined behavior in signed left-shifts | Closed (2026-08-09) | Generic C fix; no riscv64-specific manifestation was ever filed |

**Currently open bugs (11 total, none RISC-V-specific):** #506 (VBR V0 psychoacoustic problem, 2020), #492 (20kHz clipping at CBR 320kbps, 2018), #485 (ID3 "Album Artist" unsupported, 2017), #455 (LAME tag weirdness since 3.99, 2017), #431 (resampler quality, 2012), #422 (lowpass differs per channel, 2012), #384 (low-bitrate quality regression vs 3.96, 2010), #359 (CBR rumble/distortion in 3.98.x, 2009), #330 (17kbps voice quality, 2009), #329 (wrong TLEN tag, 2009), #298 (`lame_enc.dll` crash, 2008).

**`gypified/libmp3lame` GitHub mirror (total issue count: 1):** #1, "Fails for bitcode" (2015, open) - unrelated to riscv64.

No correctness or performance bug specific to riscv64 has ever been filed in either tracker.

## 12. Objections and Upstream Blockers

**Technical blockers:** None for functional use. The generic C path compiles and runs correctly on riscv64. The single historical RISC-V build blocker (Patch #96, 2021) is already upstream and has shipped since 3.101.

**Performance blockers:** The SIMD gap is structural and, as of 4.0, has widened rather than closed - x86 gained AVX2/AVX-512 and ARM gained NEON, riscv64 gained nothing. Closing it requires: (1) implementing equivalent FFT/quantization routines using RVV intrinsics, following the same pattern as the new `avx2_*.c`/`avx512_quantize_lines.c`/`neon_choose_table.c` files in `libmp3lame/vector/`; (2) adding a riscv64 detection/dispatch path in `configure.ac`; (3) upstreaming to SourceForge SVN.

**RISE involvement - indirect only, does not close this gap:** RISE does not work on libmp3lame itself. Its `python-wheels` project builds and publishes `lameenc` (a third-party Python binding, [chrisstaite/lameenc](https://github.com/chrisstaite/lameenc), LGPL-3.0-or-later) that statically links a locally-compiled LAME 3.100 for riscv64, on RISE's own `ubuntu-24.04-riscv` GitHub Actions runner, published to `pypi.riseproject.dev`. Latest release: `lameenc-v1.8.4-20260906211002` (2026-09-06, commit `47f131b`), wheels for cp310-cp314t against `manylinux_2_39_riscv64`. This work includes a local, not-yet-upstreamed patch widening `license-files` in `lameenc`'s own `pyproject.toml` for LGPL compliance, and a separate `gpl-sources.tar` artifact - none of which touches libmp3lame's own source, build system, or test suite. (Note: `riseproject.gitlab.io/python/wheel_builder/`, a 93-package index, does not list `lameenc` or `libmp3lame` - this appears to be a stale/partial mirror, since the live `pypi.riseproject.dev` index does carry `lameenc`.) No RISE blog post mentions libmp3lame, MP3, or audio encoding under any of the three site-search terms tried (`libmp3lame`, `mp3`, `lame`).

**Organizational blockers:** The project resumed active maintenance in mid-2026 after seven years of dormancy (3.101 and 4.0 both released within days of each other, SVN trunk active through at least mid-September 2026), which somewhat lowers the "slow review" risk noted in earlier assessments of this project, though no riscv64-specific proposal has yet been submitted to test actual turnaround time.

**Stated objections:** None found in any public forum. The implicit policy remains that architecture support is granted if the code compiles.

**Acceptance probability for an RVV patch:** [NEEDS VERIFICATION] - no public statement from any upstream maintainer on RISC-V optimization interest. The renewed 2026 release cadence and the precedent of accepting AVX2/AVX-512/NEON work into 4.0 suggest a well-formed RVV patch would plausibly be reviewed, but this is inferred from general project behavior, not a direct statement.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- No upstream CI of any kind exists for libmp3lame, confirmed by direct read of the SourceForge SVN trunk tree ([https://sourceforge.net/p/lame/svn/HEAD/tree/trunk/lame/](https://sourceforge.net/p/lame/svn/HEAD/tree/trunk/lame/)) - no `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, or `.github/workflows`. The distribution floor applies: Ubuntu 26.04 "resolute", Debian sid/trixie, and Arch Linux RISC-V all ship working riscv64 binary packages (verified live via HTTP 200 / byte-exact mirror fetches, e.g. [packages.ubuntu.com libmp3lame search](https://packages.ubuntu.com/search?keywords=libmp3lame&suite=resolute&searchon=names&section=all)) built from unmodified upstream source. The only riscv64-relevant fix - SourceForge Patch #96, the `fpsetenv()`/FreeBSD build-portability fix - was committed to upstream SVN trunk in 2021, so no downstream riscv64-specific packaging patches were ever needed. This matches the "clean-distro-build" yellow sub-type rather than orange (downstream-only-with-patches) or grey.
- **Pending work that could change the grade:** LAME 4.0 was released 2026-07-11, unrelated to the color itself but material to the rest of this report's factual content (GTK2 -> GTK4, the new CMocka dependency, the 2026 bug-tracker churn). RISE's involvement is only indirect - it builds the third-party `lameenc` Python binding for riscv64, not libmp3lame itself - and does not change libmp3lame's own color. No open riscv64-specific patches or CI proposals exist upstream that would move the grade.

## 14. Investment Analysis

Before sizing: RISE has made no investment in libmp3lame itself. Its only related work - the `lameenc` Python-binding wheel pipeline - covers a downstream consumer, not libmp3lame's own source, build system, or CI, so none of the items below are already funded or in progress.

### 14.1 Functional Enablement

Complete. libmp3lame builds and runs correctly on riscv64 via the generic C path. Debian, Ubuntu, and Arch Linux RISC-V all ship working binary packages built from unmodified upstream source. No functional work is required.

### 14.2 Performance Optimization

The primary gap is the absence of RVV-accelerated FFT and quantization routines, and this gap widened with 4.0's new AVX2/AVX-512/NEON work. The updated 4.0 codebase gives a clearer reference set than before:
- FFT acceleration using RVV floating-point vector operations, replacing the `fftsse.nas` family
- xrpow quantization using RVV, following the pattern of the new `avx2_*.c`/`avx512_quantize_lines.c`/`neon_choose_table.c` files in `libmp3lame/vector/` (an `#ifdef __riscv_vector` guard analogous to `#ifdef HAVE_XMMINTRIN_H`)
- Evaluating `USE_FAST_LOG`/`TAKEHIRO_IEEE754_HACK` for a riscv64 case in `configure.ac`, if numerically safe

No published benchmark data exists to quantify the expected improvement, on riscv64 or in comparison to the newly measured x86/ARM figures in Section 6. **Data not available: measured throughput delta between scalar C and SIMD-accelerated paths for riscv64.**

### 14.3 CI/CD Infrastructure

No CI exists upstream or in any mirror, for any architecture. Adding riscv64 CI requires either contributing CI to the SourceForge project directly (which has no GitHub Actions equivalent available) or maintaining a fork. The Debian buildd network and Arch Linux RISC-V's own build infrastructure provide build-regression detection for their packages but run no LAME test suite on riscv64. Minimum viable CI: a GitHub Actions workflow in a maintained fork or third-party mirror with a riscv64 QEMU matrix entry running `make check`.

### 14.4 Ecosystem Enablement

libmp3lame is a system library with no dependent package ecosystem of its own that requires separate riscv64 enablement (no PyPI, npm, or Maven package published by the project). Distro packaging on Debian, Ubuntu, and Arch already covers riscv64. The one adjacent ecosystem artifact, `lameenc` (a third-party Python binding), is already built and published for riscv64 by RISE, independent of libmp3lame's own release process. No ecosystem work is required for libmp3lame itself.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Performance | RVV FFT implementation (replace `fftsse.nas` + variants) | 4-6 | RISE Enablement WG or community contributor | Medium |
| Performance | RVV xrpow quantization (parallel to the new `avx2_*.c`/`neon_choose_table.c` work) | 2-3 | RISE Enablement WG or community contributor | Medium |
| Performance | Evaluate `TAKEHIRO_IEEE754_HACK` / `USE_FAST_LOG` for riscv64 in `configure.ac` | 0.5 | Any contributor | Low |
| CI/CD | Add riscv64 QEMU CI to a maintained fork (no upstream CI system exists to extend) | 1 | RISE infra or distro maintainer | Low |
| Benchmarking | Produce a first riscv64 vs amd64/arm64 throughput benchmark (none exists anywhere today) | 0.5-1 | RISE Enablement WG or community contributor | Low |

**Investment justification:** libmp3lame is a foundational codec library used by countless applications. The functional gap is zero; the distro floor (Section 13) already delivers working riscv64 binaries with no patches needed. The performance gap is real, unquantified, and widening as LAME 4.0 added AVX2/AVX-512/NEON paths with nothing for riscv64. Given the project's newly-resumed but still small-team maintenance model, and the absence of any published riscv64 performance regression report or a demonstrated bottleneck in a real riscv64 consumer application, the business case for RVV optimization investment remains Medium priority at most, contingent on identifying such a consumer.

## 15. References

- [LAME upstream project on SourceForge](https://sourceforge.net/projects/lame/)
- [LAME homepage](https://lame.sourceforge.io/)
- [LAME 4.0 release files](https://sourceforge.net/projects/lame/files/lame/4.0/)
- [SourceForge SVN trunk tree](https://sourceforge.net/p/lame/svn/HEAD/tree/trunk/lame/)
- [SourceForge SVN changelog/history.html](https://sourceforge.net/p/lame/svn/HEAD/tree/trunk/lame/doc/html/history.html)
- [SourceForge LAME patch #96 - fix build on riscv64/FreeBSD](https://sourceforge.net/p/lame/patches/96/)
- [reviews.llvm.org/D89557 - the LLVM fix Patch #96 was derived from](https://reviews.llvm.org/D89557)
- [SourceForge LAME bug #522 - heap-buffer-overflow](https://sourceforge.net/p/lame/bugs/522/)
- [SourceForge LAME bug #521 - IEEE hack configure breakage](https://sourceforge.net/p/lame/bugs/521/)
- [SourceForge LAME bug #520 - AVX512 optimization request](https://sourceforge.net/p/lame/bugs/520/)
- [SourceForge LAME bug #498 - psymodel.c crash](https://sourceforge.net/p/lame/bugs/498/)
- [SourceForge LAME patch #72 - undefined behavior in shifts](https://sourceforge.net/p/lame/patches/72/)
- [SourceForge LAME bug tracker](https://sourceforge.net/p/lame/bugs/)
- [gypified/libmp3lame GitHub repository](https://github.com/gypified/libmp3lame)
- [gypified/libmp3lame issue #1](https://github.com/gypified/libmp3lame/issues/1)
- [Ubuntu 26.04 resolute - libmp3lame package search](https://packages.ubuntu.com/search?keywords=libmp3lame&suite=resolute&searchon=names&section=all)
- [Debian packages trixie - libmp3lame0](https://packages.debian.org/trixie/libmp3lame0)
- [Arch Linux RISC-V portal](https://archriscv.felixc.at/)
- [FreeBSD official ports Makefile (cgit)](https://cgit.freebsd.org/ports/plain/audio/lame/Makefile)
- [Stale freebsd-ports-gnome mirror Makefile](https://github.com/freebsd/freebsd-ports-gnome/blob/master/audio/lame/Makefile)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE SALTyRN blog post - NEON to RVV kernel translation](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [chrisstaite/lameenc - third-party Python binding built for riscv64 by RISE](https://github.com/chrisstaite/lameenc)
- [pypi.riseproject.dev - lameenc riscv64 wheel index](https://pypi.riseproject.dev/)
- [PyPI JSON API - libmp3lame (404, no such package)](https://pypi.org/pypi/libmp3lame/json)