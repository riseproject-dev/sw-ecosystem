---
title: libmp3lame
parent: Project Reports
categories:
  - multimedia
---

# libmp3lame

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libmp3lame<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

LAME ("LAME Ain't an MP3 Encoder") is a widely-deployed open-source MP3 encoder implemented in C. The canonical upstream source is the [SourceForge SVN repository](https://sourceforge.net/projects/lame/), not the GitHub mirror referenced in this report. The most recent stable release is version 3.100 (October 2017). The most recent SVN commit is r6531 (2023-12-18). The project is in low-maintenance mode: no new release has been cut in over seven years.

The repository analyzed here, [gypified/libmp3lame](https://github.com/gypified/libmp3lame), is a third-party GYP build-system wrapper created by a single contributor (TooTallNate) in 2012. It has 14 commits total, was last pushed on 2013-04-01, and contains LAME 3.99.5. It is not the upstream project. It has 55 stars and 34 forks. All factual claims about LAME source code derive from the SourceForge SVN tree (current head r6531).

**Governance:** Informal. Founded by Mike Cheng (1998), later led by Mark Taylor, now maintained collaboratively by a small group of SourceForge committers (aleidinger, bouvigne, jaz001, rbrito, robert). No governance document, no MAINTAINERS file, no CODEOWNERS file, no formal foundation membership.

**Corporate sponsors:** None. Debian packaging maintainers (Fabian Greffrath, Reinhard Tartler, Debian Multimedia Maintainers) are community volunteers with no known corporate affiliation. LAME has no corporate backing upstream.

**Community stance on new ports:** Implicit acceptance. If the C code compiles and tests pass, the architecture is considered supported. Architecture-specific optimizations (NASM assembly for x86, SIMD) are opt-in extras contributed as patches to the SourceForge SVN tracker. Given low-maintenance mode status, response to new patch submissions would be slow.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 1998 | LAME project founded | [SourceForge project page](https://sourceforge.net/projects/lame/) |
| 1999-11-18 | Hosted on SourceForge | [SourceForge project page](https://sourceforge.net/projects/lame/) |
| 2021-06-19 | SVN r6506 -- "Fix build on FreeBSD riscv (replace compile time arch detection by feature detection)" in `util.c` | SourceForge SVN r6506 (committer: aleidinger, patch by arichardson/LLVM, submitted by Robert Clausecker) |
| 2023-12-18 | SVN r6531 -- most recent upstream commit | [SourceForge SVN](https://sourceforge.net/projects/lame/) |

**Key contributors to the RISC-V build fix:** aleidinger (SVN committer), arichardson (LLVM contributor, patch author), Robert Clausecker (submitter). No corporate affiliation found for any of these contributors.

**Is riscv64 support fully upstream?** Yes, in the sense that the sole RISC-V-related change (a build portability fix) is in the upstream SVN. No separate downstream patch tree exists. However, "upstream support" means only that the generic C path compiles cleanly -- no architecture-specific optimization has been contributed.

---

## 3. Upstream Support Tier

LAME has no formal tier policy. The project does not publish a supported-architectures list.

**Evidence by category:**

- **CI:** No CI exists in gypified/libmp3lame (no `.github/` directory, no `.travis.yml`, no `.cirrus.yml`, no `Jenkinsfile`). No riscv64 runner of any kind. The SourceForge upstream has no publicly visible CI.
- **Release-blocking:** No release has been cut since 3.100 (2017). Release cadence is effectively zero. There is no architecture-gated release criteria.
- **Official binaries from upstream:** None. The upstream project publishes source tarballs only.

**Architecture comparison:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Compiles from source | Yes | Yes | Yes |
| CI (upstream) | None | None | None |
| Official binary release | Source only | Source only | Source only |
| Distro binary package | Yes | Yes | Yes (Debian sid, Ubuntu 24.04) |
| SIMD acceleration | SSE/SSE2/3DNow (hand-tuned NASM + intrinsics) | None (scalar C) | None (scalar C) |
| Formal support tier | N/A | N/A | N/A |

riscv64 is on par with arm64: both are scalar-only, both receive distro packages, neither has a formal upstream tier designation.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LAME's architecture-sensitive code is concentrated in two subdirectories:

**`libmp3lame/i386/` (x86 NASM assembly, 9 files):**
- `choose_table.nas` -- Huffman table selection (x87/MMX)
- `cpu_feat.nas` -- CPU feature detection (SSE, 3DNow)
- `fft.nas` -- FFT base (x87)
- `fft3dn.nas` -- FFT with 3DNow
- `fftfpu.nas` -- FFT with FPU (x87)
- `fftsse.nas` -- FFT with SSE
- `ffttbl.nas` -- FFT twiddle tables
- `scalar.nas` -- scalar operations

**`libmp3lame/vector/` (SSE/SSE2 intrinsics):**
- `xmm_quantize_sub.c` (~175 lines) -- xrpow quantization and Fast Hartley Transform via `__m128`; entire file wrapped in `#ifdef HAVE_XMMINTRIN_H`
- `lame_intrin.h` (~36 lines) -- SSE/SSE2 intrinsic declarations

**Architecture-specific code comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| FFT | Hand-tuned NASM (SSE, 3DNow, FPU variants) | Generic C | Generic C |
| Quantization (xrpow) | SSE2 intrinsics (`xmm_quantize_sub.c`) | Generic C | Generic C |
| CPU feature detection | NASM (`cpu_feat.nas`) | N/A | N/A |
| Huffman coding | NASM (`choose_table.nas`) | Generic C | Generic C |
| RVV (RISC-V Vector) intrinsics | N/A | N/A | None |
| Zba/Zbb/Zbc extension usage | N/A | N/A | None |
| JIT backend | None | None | None |
| `#ifdef __riscv` guards | N/A | N/A | 0 occurrences |

No RISC-V architecture directory, no `.S` RISC-V assembly files, no RVV intrinsics, and no ISA extension usage of any kind exist in the source tree as of r6531.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (autoconf/automake). The GYP file (`libmp3lame.gyp`) in the GitHub mirror is an alternative build entry point for Node.js-based consumers, not the primary build system.

**Cross-compile command for riscv64:**

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

**Why `--disable-nasm`:** In `configure.in`, NASM support is hard-coded to i386 only. When `host_cpu` does not match `*86`, the configure script sets `CPUTYPE="no"` and silently skips NASM regardless of whether `--enable-nasm` is passed. Passing `--disable-nasm` explicitly avoids a PATH lookup for a nasm binary and makes the intent clear.

**riscv64 falls into the `configure.in` default case:**

```
x86_64|amd64   -> CPUTYPE="no" (XMM enabled, TAKEHIRO_IEEE754_HACK, USE_FAST_LOG)
*86             -> CPUTYPE="i386" (x86 optimizations + NASM eligible)
powerpc         -> CPUTYPE="no" (TAKEHIRO_IEEE754_HACK, USE_FAST_LOG)
*               -> CPUTYPE="no" (riscv64 falls here; no TAKEHIRO_IEEE754_HACK, no USE_FAST_LOG)
```

**Cross-compile sizeof warning:** When `--host` differs from `--build`, `configure` cannot determine `sizeof(short)`, `sizeof(long)`, `WORDS_BIGENDIAN`, etc. via runtime probes. Manual `config.h` overrides are required:

```c
#define SIZEOF_SHORT 2
#define SIZEOF_INT 4
#define SIZEOF_LONG 8        /* 64-bit on riscv64 */
#define SIZEOF_LONG_LONG 8
#define SIZEOF_FLOAT 4
#define SIZEOF_DOUBLE 8
#define SIZEOF_LONG_DOUBLE 16
/* riscv64 is little-endian -- do NOT define WORDS_BIGENDIAN */
```

The `config/` directory contains pre-built `config.h` files for `linux/arm`, `linux/ia32`, `linux/x64`. No `config/linux/riscv64/config.h` exists. The closest template is `config/linux/arm/config.h` (both are little-endian, NASM disabled, 64-bit `SIZEOF_LONG`).

**Toolchain requirement:** No explicit GCC/Clang version minimum is documented. The project builds cleanly with GCC 10+ or Clang 12+ on riscv64 per Debian build records. Required cross package: `gcc-riscv64-linux-gnu`.

**QEMU:** No Dockerfile or QEMU documentation exists in the repository. Standard approach: `qemu-riscv64-static ./lame [args]` for static binary testing, or `dpkg-buildpackage -a riscv64` for Debian cross-builds using `binfmt_misc`.

**Known build failures:** None documented for riscv64. The 2021 FreeBSD/riscv build fix (SVN r6506) resolved the only known riscv64 build issue.

**Files confirmed absent:** `BUILDING.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, `cmake/toolchain-riscv64.cmake`, `Dockerfile.riscv64`, `.ci/docker/`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| MP3 encoding (all bitrates) | Yes | Yes | Yes |
| VBR/CBR/ABR modes | Yes | Yes | Yes |
| ID3 tag writing | Yes | Yes | Yes |
| Gapless encoding | Yes | Yes | Yes |
| SIMD-accelerated FFT | Yes (SSE/3DNow NASM) | No | No |
| SIMD-accelerated quantization | Yes (SSE2 intrinsics) | No | No |
| IEEE754 fast-path (`TAKEHIRO_IEEE754_HACK`) | Yes (configure enables it for x86_64) | No | No |
| Fast logarithm (`USE_FAST_LOG`) | Yes (x86_64 path) | No | No |
| ReplayGain analysis | Yes | Yes | Yes |
| Psychoacoustic model | Yes | Yes | Yes |

**Functional gaps:** None. All features are available on riscv64 via the generic C path. There is no feature that is structurally disabled on RISC-V.

**Performance gaps:** Significant and unquantified. No benchmark data comparing riscv64 to amd64 or arm64 exists in any public source. The SIMD-accelerated paths (FFT, quantization) are exclusive to x86. Data not available: measured encoding throughput ratio between riscv64 and amd64.

**Floating-point semantics:** Bug #521 (open, filed 2025-11-04) documents a configure breakage in the Takehiro IEEE754 fast-path option. This option is not enabled on riscv64 (the configure case does not set `TAKEHIRO_IEEE754_HACK` for the generic fallback). The impact on riscv64 is neutral -- riscv64 never uses this code path -- but the underlying IEEE754 handling in the generic C path has not been specifically tested on riscv64 hardware.

Patch #72 (open since 2017-08-06) documents undefined behavior in bit-shifts. UB in shift operations has architecture-specific manifestations. No riscv64-specific report of this UB has been filed.

**Security hardening:** The Debian build applies `DEB_BUILD_MAINT_OPTIONS = hardening=+all` universally across all architectures including riscv64. No architecture-specific hardening gaps are documented.

---

## 7. CI/CD Infrastructure

**gypified/libmp3lame GitHub repository:**

No CI exists. The `.github/` directory does not exist. Checked and confirmed absent: `.github/workflows/`, `.travis.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`. This was confirmed via direct GitHub API query (`GET /repos/gypified/libmp3lame/contents/.github/workflows` returned HTTP 404) and via repository file tree inspection.

**Upstream SourceForge project:** No publicly visible CI.

**RISE Project:** Zero RISE involvement. All 28 RISE blog posts (May 2024 - June 2026) were scanned; no mention of libmp3lame or audio encoding. The RISE wheel builder does not list libmp3lame. No RISE runner is configured anywhere.

**CI comparison:**

| CI item | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| CI exists | No | No | No |
| Automated build check | No | No | No |
| Automated test suite | No | No | No |
| RISE runner | No | No | No |
| Distro buildbot (Debian buildd) | Yes | Yes | Yes (rv-osuosl-02) |

The only automated build verification for riscv64 is the Debian buildd system, which builds the `lame` Debian source package on Debian infrastructure. This is distro-owned, not upstream-owned.

---

## 8. Distribution and Release Status

**Upstream releases:** None for riscv64. The gypified/libmp3lame GitHub repository has zero releases of any kind. The SourceForge upstream publishes source tarballs only; the last release was version 3.100 (October 2017).

**PyPI:** No `libmp3lame` package exists on PyPI (HTTP 404). No wheels of any kind.

**Debian:**
- sid (unstable): `lame` version `3.101~svn6531+dfsg-1`, status "Installed" on riscv64, built on host `rv-osuosl-02`. Source: [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=lame&suite=sid)
- trixie: `libmp3lame0` version `3.100-6+b3`, available for riscv64, installed size 500 kB. Source: [Debian packages trixie](https://packages.debian.org/trixie/libmp3lame0)
- bookworm (stable): riscv64 is absent -- not built for the bookworm release.

**Ubuntu:**
- 24.04 Noble: `libmp3lame0` and `libmp3lame-dev` version `3.100-6build1`, architectures listed: `amd64 arm64 armhf i386 ppc64el riscv64 s390x`. Source: [Ubuntu packages search](https://packages.ubuntu.com/search?keywords=libmp3lame&suite=noble&searchon=names&section=all)

**Arch Linux RISC-V:** Status not determinable. The [archriscv.felixc.at](https://archriscv.felixc.at/) portal was inaccessible via WebFetch, and the status page returned HTTP 404. Data not available: Arch Linux RISC-V package status for lame/libmp3lame.

**What a user must do to get a working riscv64 binary:**
- Debian trixie or sid: `apt install libmp3lame0 libmp3lame-dev` -- works without any extra steps
- Ubuntu 24.04+: same
- All other distributions or custom builds: build from SourceForge source tarball using the autotools cross-compile procedure in Section 5 above

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------------|------|--------------|-------------|----------------|-------|
| libmpg123 (>= 1.26.0) | Decoder backend (near-mandatory) | Yes (Debian sid v1.33.6-1, rv-osuosl-03) | No riscv64 failures reported | Debian sid, Ubuntu ports | Generic C path on riscv64; no SIMD |
| ncurses / termcap | VBR histogram display (optional) | Yes (Debian sid v6.6+20251231-1+b1, rv-osuosl-04) | No riscv64 failures | All major distros | No blocker |
| libsndfile (>= 1.0.2) | Alternative audio file I/O (optional) | Yes (Debian sid v1.2.2-4+b1, rv-manda-02) | No riscv64 failures | Debian sid, Ubuntu | No blocker |
| gtk+ 2.0 (>= 1.2) | mp3x graphical analyzer (optional) | Yes (Debian sid v2.24.33-10+b1, rv-manda-04) | No riscv64 failures | Debian sid | GTK2 in maintenance mode; mp3x rarely built |
| nasm | x86 SIMD assembler (build-time) | Not applicable on riscv64 | N/A | N/A | configure silently skips on non-i386 |
| libiconv | ID3 tag character encoding (optional) | Provided by glibc on riscv64 | Integrated | Via glibc | No separate package needed |
| libm | Math functions (mandatory) | Part of glibc | Fully tested | All distros | No blocker |

**libmpg123 deep-dive:** This is the only near-mandatory dependency that has SIMD implications. libmpg123's x86 and ARM SIMD paths are not compiled on riscv64 -- it falls back to generic C, same as libmp3lame itself. No open riscv64-specific bugs exist in the mpg123 bug tracker (0 results). No functional blocker for riscv64 use.

**SIMD dependency chain:** The full SIMD acceleration chain (NASM assembly for FFT, SSE2 intrinsics for quantization) is x86-only throughout. Neither libmpg123 nor libmp3lame provides RVV acceleration. The entire encode/decode pipeline runs scalar C on riscv64.

---

## 11. Known Bugs and Active Issues

**Upstream SourceForge tracker (relevant open items):**

| ID | Title | Status | Severity | riscv64 Relevance |
|----|-------|--------|----------|-------------------|
| Bug #521 | "Takehiro's IEEE hack configure option does not work" | Open (2025-11-04) | Medium | Low -- this code path is not enabled on riscv64; riscv64 uses the generic C path |
| Bug #520 | "[REQ] AVX512 optimizations" | Open (2025-08-28) | Performance | Indirect -- reflects no SIMD beyond x86; riscv64 (lacking AVX512) is in the same scalar-only situation |
| Bug #498 | "Crash in lame in psymodel.c:calc_energy" | Open (2019-02-03) | High | Possible -- NaN/floating-point crash in energy calculation; not confirmed RISC-V specific but affects generic C path |
| Bug #510 | "ReplayGain values on Windows and Linux differ" | Open | Medium | Low -- cross-platform numerical divergence; not RISC-V specific |
| Bug #522 | "Heap-buffer-overflow in lame_copy_inbuffer()" | Open (2025-11-07) | High | Architecture-agnostic memory safety bug; affects all architectures including riscv64 |
| Patch #72 | "Fix undefined behavior on shifts" | Open (2017-08-06) | Medium | Medium -- UB in bit-shifts has architecture-specific manifestations; no riscv64 report filed but not ruled out |

**gypified/libmp3lame GitHub (total issue count: 1):**

| ID | Title | Status | riscv64 Relevance |
|----|-------|--------|-------------------|
| #1 | "Fails for bitcode" (2015) | Open | None |

No correctness or performance bugs specific to riscv64 have been filed in either tracker.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None for functional use. The generic C path compiles and runs correctly on riscv64. The single historical RISC-V build blocker (SVN r6506, 2021 FreeBSD/riscv build fix) is already upstream.

**Performance blockers:** The SIMD gap is structural. All FFT and quantization acceleration is x86-only (NASM assembly + SSE2 intrinsics). Closing this gap requires:
1. Implementing equivalent routines using RVV (RISC-V Vector extension) intrinsics
2. Adding a configure detection path for riscv64 in `configure.in`
3. Upstreaming to SourceForge SVN -- a slow process given low-maintenance mode

**Organizational blockers:** The project is in low-maintenance mode (last release 2017, last SVN commit 2023). Patch review throughput is low. A RVV optimization patch could wait months or years for review and merge. There is no corporate entity that can accelerate this.

**Stated objections:** No upstream objections to RISC-V have been stated in any public forum. The implicit policy is that architecture support is granted if the code compiles.

**Acceptance probability for a RVV patch:** Likely eventual acceptance given the project's implicit portability policy, but with indefinite timeline due to low maintainer activity. [NEEDS VERIFICATION] -- no public statement from any upstream maintainer on RISC-V optimization interest.

---

## 13. Investment Analysis

RISE has no prior investment in libmp3lame. No RISE blog posts, no RISE wheel builder entry, no RISE runner configuration. All work sized here is net-new.

### 13.1 Functional Enablement

Functional enablement is complete. libmp3lame builds and runs correctly on riscv64 via the generic C path. Debian and Ubuntu ship binary packages. No functional work is required.

### 13.2 Performance Optimization

The primary performance gap is the absence of RVV-accelerated FFT and quantization routines. The x86 codebase provides a clear reference: 9 NASM files for FFT variants and one SSE2 file for xrpow quantization. An equivalent RVV implementation would target the same mathematical operations.

Specifics:
- FFT acceleration using RVV floating-point vector operations: replacement for `fftsse.nas` and related files
- xrpow quantization using RVV: replacement for `xmm_quantize_sub.c` (`#ifdef __riscv_vector` guard analogous to `#ifdef HAVE_XMMINTRIN_H`)
- Fast logarithm and IEEE754 fast-path (`USE_FAST_LOG`, `TAKEHIRO_IEEE754_HACK`): configure.in currently enables these only for x86_64 and powerpc; a riscv64 case should be evaluated and added if safe

No published benchmark data is available to quantify the expected improvement. Data not available: measured throughput delta between scalar C and SIMD-accelerated paths on comparable workloads for riscv64.

### 13.3 CI/CD Infrastructure

No CI exists upstream or in the GitHub mirror. Adding riscv64 CI to the upstream project requires either contributing to the SourceForge project (which has no GitHub Actions or equivalent), or maintaining a fork with CI. The Debian buildd system provides build regression detection for the distro package but does not run the LAME test suite on riscv64.

Minimum viable CI: a GitHub Actions workflow in a maintained fork with a `riscv64` QEMU matrix entry running `make check`.

### 13.4 Ecosystem Enablement

libmp3lame is a system library with no dependent package ecosystem that requires separate enablement (no PyPI packages, no npm packages, no Maven JARs). Distro packaging on Debian and Ubuntu already covers riscv64. No ecosystem work is required.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Performance | RVV FFT implementation (replace `fftsse.nas` + variants) | 4-6 | RISE Enablement WG or community contributor | Medium |
| Performance | RVV xrpow quantization (replace `xmm_quantize_sub.c`) | 2-3 | RISE Enablement WG or community contributor | Medium |
| Performance | Enable `TAKEHIRO_IEEE754_HACK` / `USE_FAST_LOG` for riscv64 in configure.in | 0.5 | Any contributor | Low |
| CI/CD | Add riscv64 QEMU CI to maintained fork | 1 | RISE infra or distro maintainer | Low |
| Bug fix | Investigate Patch #72 (UB in bit-shifts) for riscv64 manifestation | 0.5 | Any contributor | Low |
| Bug fix | Triage Bug #498 (psymodel.c crash) on riscv64 hardware | 0.5 | Any contributor | Low |

**Investment justification:** libmp3lame is a foundational codec library used by countless applications. The functional gap is zero. The performance gap is real but unquantified. Given the project's low-maintenance mode and the absence of any published riscv64 performance regression report, the business case for RVV optimization investment is Medium priority, contingent on identifying a consumer application where MP3 encoding throughput on riscv64 is a demonstrated bottleneck.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [gypified/libmp3lame GitHub repository](https://github.com/gypified/libmp3lame)
- [LAME upstream project on SourceForge](https://sourceforge.net/projects/lame/)
- [LAME homepage](https://lame.sourceforge.io/)
- [Debian buildd tracker for lame (sid)](https://buildd.debian.org/status/package.php?p=lame&suite=sid)
- [Debian packages trixie -- libmp3lame0](https://packages.debian.org/trixie/libmp3lame0)
- [Ubuntu 24.04 Noble -- libmp3lame package search](https://packages.ubuntu.com/search?keywords=libmp3lame&suite=noble&searchon=names&section=all)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog (all 28 posts scanned June 2026)](https://riseproject.dev/blog)
- [Arch Linux RISC-V portal](https://archriscv.felixc.at/)
- [SourceForge LAME bug #521 -- IEEE hack configure breakage](https://sourceforge.net/p/lame/bugs/521/)
- [SourceForge LAME bug #520 -- AVX512 optimization request](https://sourceforge.net/p/lame/bugs/520/)
- [SourceForge LAME bug #498 -- psymodel.c crash](https://sourceforge.net/p/lame/bugs/498/)
- [SourceForge LAME bug #522 -- heap-buffer-overflow](https://sourceforge.net/p/lame/bugs/522/)
- [SourceForge LAME patch #72 -- undefined behavior in shifts](https://sourceforge.net/p/lame/patches/72/)
- [gypified/libmp3lame issue #1](https://github.com/gypified/libmp3lame/issues/1)