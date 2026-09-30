---
title: bzip2
parent: Project Reports
color: yellow
categories:
  - libraries
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: Valgrind
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="bzip2" %}

# bzip2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for bzip2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="bzip2" %}

## 1. Project Overview

bzip2 is a lossless data-compression library and command-line tool implementing the Burrows-Wheeler block-sorting algorithm combined with Huffman coding, producing `.bz2` files. The codebase is approximately 8,000 lines of pure C89 with no architecture-specific assembly, no SIMD, and no JIT on any platform.

**Two upstreams, now effectively one stable branch plus an archived fork.** The named repository for this report, [sourceware.org/git/bzip2.git](https://sourceware.org/git/bzip2.git), is the stable 1.0.x line maintained by Mark Wielaard (Red Hat employee). It is not dormant: a `shortlog` of the repository shows commits as recent as 2026-07-11 ("bzip2recover: create output block files safely with `O_EXCL`", Naveed Khan), with a run of `bzip2recover` hardening and safety fixes through June-July 2026 from Mark Wielaard, Naveed Khan, and Josef Schlehofer. The latest tag remains `bzip2 1.0.8` (2019-07-13); no 1.0.9 or 1.1 tag has been cut on this repository. The second, feature-branch upstream, [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) (formerly maintained by Micah Snyder, targeting a 1.1+ release with CMake and Meson build systems), was **archived on or around 2026-07-08**, confirmed by fetching the live repository page, whose description now reads: "This fork for v1.1+ development has been archived due to lack of interest, and because there are better options available through the Rust ecosystem." No 1.1.0 release was ever tagged. This repository is now read-only.

**Governance.** There is no foundation affiliation and no formal governance body for the C codebase. sourceware.org is a community service historically associated with the GCC/binutils toolchain projects, but bzip2 has no formal membership in that or any other body. Neither sourceware.org's bzip2 nor the archived gitlab.com/bzip2/bzip2 is RISE Project-affiliated, and bzip2 is not listed on [riseproject.dev](https://riseproject.dev) or its [members page](https://riseproject.dev/members/).

**License.** BSD-style license ("bzip2-1.0.6"). The original author noted the license is believed patent-free but could not guarantee it.

**New corporate-sponsored successor: Trifecta Tech Foundation's Rust rewrite.** The "better options" the GitLab archival notice refers to are two Rust projects maintained by the **Trifecta Tech Foundation** (a nonprofit maintaining "digital commons" open-source software for critical infrastructure) under its Data Compression initiative:
- [**libbzip2-rs**](https://github.com/trifectatechfoundation/libbzip2-rs): a from-scratch, safety-oriented Rust reimplementation of libbzip2, originally derived via c2rust translation of the original C source, publishing a drop-in C-ABI-compatible `libbz2-rs-sys` crate.
- [**bzip2** (the Rust crate)](https://github.com/trifectatechfoundation/bzip2-rs): the higher-level Rust bindings crate; as of v0.6.0 (2025-06-17) it defaults to the pure-Rust `libbz2-rs-sys` backend rather than linking the C library, citing simpler cross-compilation (WebAssembly, Windows, Android) and 4-14% performance gains over the C implementation.

**Corporate sponsors (of Trifecta Tech Foundation generally, not bzip2 specifically):** Gold sponsors Canonical and Google (each reported at roughly EUR 40,000/year for 2026); Silver sponsor AWS. The bzip2-rs/libbzip2-rs work itself was funded through project-specific grants: NLnet Foundation, NGI Zero Core (an NLnet-administered fund backed by the European Commission's Next Generation Internet programme), and the Dutch Ministry of the Interior. No corporate sponsor is tied to the original C codebase; sponsorship attaches to the Rust rewrite, not to sourceware.org's stable 1.0.x branch or the now-archived gitlab.com/bzip2/bzip2 fork.

**Prior maintainers.** Julian Seward (original author, 1996-2019, no corporate affiliation documented). Federico Mena Quintero (Red Hat/GNOME, June 2019 - June 2022). Micah Snyder took over the 1.1+ branch from Federico Mena Quintero in June 2022 and maintained it until its 2026-07 archival.

**Incidental RISE contact, not investment.** bzip2 (as `libbz2`) is bundled as a system dependency inside two unrelated riscv64 Python wheel builds maintained by the RISE Project's wheel-builder program: `riseproject-dev/python-wheels` PR [#2347](https://github.com/riseproject-dev/python-wheels/pull/2347) ("osmium: Add version 4.3.1", merged 2026-09-26) and PR [#2348](https://github.com/riseproject-dev/python-wheels/pull/2348) ("Add libuuu riscv64 wheel build", merged 2026-09-26, which replaced vcpkg with system packages including `bzip2`). This is packaging of bzip2 as a transitive dependency of other wheels, not development or porting work on bzip2 itself, and does not change the "no RISE investment in bzip2" conclusion below.

**Community stance on new ports.** For the C codebase: not applicable. bzip2 is architecture-agnostic portable C89; no porting work has ever been required for any architecture with a working compiler, and the community has never tracked architecture support as a distinct concern - confirmed directly by reading the sourceware.org source tree (Makefile-only, no arch-conditioned files) and by a full review of the archived GitLab fork's 40 issues and 69 merge requests, none of which mention riscv, riscv64, or RISC-V. For the Rust successor: no stated stance on riscv64 either way was found. Its CI matrix (`.github/workflows/checks.yaml`, read in full from a shallow clone) covers x86_64, aarch64, i686, s390x, wasm32-wasip1, and Apple/Windows targets; **no riscv64 target is present**, and a GitHub issue search for "riscv" in that repository returns zero results.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (no date) | bzip2 first written in pure portable C89 with no architecture-specific code; all architectures supported by construction | [sourceware.org/git/bzip2.git](https://sourceware.org/git/bzip2.git) |
| 2019-07-13 | Last tagged release: 1.0.8 | [sourceware.org/git tags](https://sourceware.org/git/?p=bzip2.git;a=tags) |
| 2022-06 | Micah Snyder takes over the 1.1+ feature branch on GitLab; CMake and Meson build systems added there (not on sourceware.org) | [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) |
| Ongoing | sourceware.org stable branch receives active `bzip2recover` hardening commits through June-July 2026 (Wielaard, Khan, Schlehofer); last commit 2026-07-11; no 1.0.9/1.1 tag cut; no riscv64-related commit anywhere in history | [sourceware.org/git shortlog](https://sourceware.org/git/?p=bzip2.git;a=shortlog) |
| Ongoing | Debian sid ships 1.0.8-6+b2 on riscv64, built on builder rv-manda-04 | [buildd.debian.org bzip2](https://buildd.debian.org/status/package.php?p=bzip2) |
| Ongoing | Ubuntu 24.04 Noble ships 1.0.8-5.1 on riscv64 | [packages.ubuntu.com/noble/bzip2](https://packages.ubuntu.com/noble/bzip2) |
| Ongoing | Ubuntu 26.04 Resolute ships 1.0.8-6build2 on riscv64, on an older build revision than the 1.0.8-6ubuntu0.1 security update already present for amd64/arm64/i386 | [packages.ubuntu.com/resolute/bzip2](https://packages.ubuntu.com/resolute/bzip2) |
| 2025-06-17 | Trifecta Tech Foundation's `bzip2` Rust crate v0.6.0 switches its default backend from linked C `libbz2` to the pure-Rust `libbz2-rs-sys`, citing simplified cross-compilation and 4-14% performance gains | [trifectatech.org blog](https://trifectatech.org/blog/bzip2-crate-switches-from-c-to-rust/) |
| 2026-07-08 (approx.) | `gitlab.com/bzip2/bzip2` (the C 1.1+ feature branch) archived by its maintainer, now read-only; archival notice cites "lack of interest" and "better options available through the Rust ecosystem" | [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) |
| 2026-09-26 | bzip2 (`libbz2`) incidentally bundled into two unrelated RISE-built riscv64 Python wheels (osmium, libuuu); not bzip2-project work | [PR #2347](https://github.com/riseproject-dev/python-wheels/pull/2347), [PR #2348](https://github.com/riseproject-dev/python-wheels/pull/2348) |

**No RISC-V-specific commit exists in either upstream, C or Rust.** A full review of all 40 GitLab issues (IID #20-#60) and all 69 merge requests (!29-!69) on the now-archived C 1.1+ branch returned zero mentions of riscv, riscv64, or RISC-V. The sourceware.org Bugzilla has 10 open bugs, none architecture-specific; its own issue/commit search returned zero riscv hits as well. `trifectatechfoundation/libbzip2-rs` (cloned shallow and grepped in full) contains zero references to "riscv" anywhere in its tracked files, and a GitHub issue search for "riscv" in that repository returns no results. **There is no "first riscv64 commit" in this project's history because riscv64 has never needed one.**

The single tangential, non-bzip2-project artifact found across all research passes is [riscvarchive/riscv-gcc#70](https://github.com/riscvarchive/riscv-gcc/issues/70), a closed 2017 GCC internal-compiler-error report filed against the RISC-V GCC toolchain fork (not bzip2), which used a minimized snippet of `bzip2.c` as its crash-reproduction case under `-O2 -mcmodel=medany` on `rv64imafd`. It is a 2017-era compiler bug, not a bzip2 defect, and not related to any riscv64 port work for bzip2.

**Key contributors for riscv64:** none, in either codebase. **Fully upstream:** yes, trivially - there is nothing to upstream, in the C project or its Rust successor.

## 3. Upstream Support Tier

Neither bzip2 upstream has a formal architecture-tier policy. The two repositories differ sharply in CI posture:

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| sourceware.org/git/bzip2.git CI | None (no CI config of any kind exists in this repository) | None | None |
| Archived gitlab.com/bzip2/bzip2 CI (frozen since 2026-07-08) | Yes (Debian Testing, Ubuntu Bionic, Fedora 35/rawhide, openSUSE Leap/Tumbleweed) | No | No |
| Release-blocking | N/A (no CI gates a release on either repo) | N/A | N/A |
| Official upstream binaries | No (source only) | No | No |
| Distro binary packages | Yes | Yes | Yes (Debian, Ubuntu) |

The repository named in this report, sourceware.org/git/bzip2.git, has **no CI infrastructure for any architecture**, confirmed by a complete file-tree listing (47 tracked files: Makefile, Makefile-libbz2_so, README variants, `.c`/`.h` sources, sample `.bz2` test files, and shell scripts; no `.gitlab-ci.yml`, `.github/`, `.travis.yml`, `.cirrus.yml`, or Buildbot/Jenkins configuration). The now-archived gitlab.com/bzip2/bzip2 fork did have amd64/i386 CI, but that repository is a different, superseded codebase and is now read-only. riscv64 coverage for the code that actually ships comes entirely from distro build farms (Debian buildd, Ubuntu Launchpad), not from either upstream's CI.

## 4. Technical Architecture and RISC-V-Specific Subsystems

bzip2 has no architecture-specific subsystems on any platform. This was verified two ways: a full GitLab API file-tree listing of the (now-archived) gitlab.com/bzip2/bzip2 repository (85 items), and, independently, full-source clones of two GitHub mirrors - `libarchive/bzip2` (tracks the archived CMake/Meson branch) and `nemequ/bzip2` (tracks the stable sourceware.org Makefile branch) - grepped in full for `.S`/`.asm` files, `riscv`, `__x86_64__`, `__aarch64__`, `__ARM_`, `__SSE`, `__AVX`, `__NEON`, `__asm__`, `intrinsic`, and endianness handling (`endian`, `__BYTE_ORDER`, `BIGENDIAN`). Every category returned zero matches in both mirrors. The only `#if`/`#ifdef` conditionals anywhere in the codebase are OS-level (`_WIN32`, `OS2`, `MSDOS`, `BZ_UNIX`, `_MSC_VER`, `BZ_DEBUG`), not CPU-architecture-level; riscv64 Linux takes the identical `BZ_UNIX` path as amd64 and arm64 Linux. Core types (`Int32`, `UInt32`, `Int16`, `UInt16` in `bzlib_private.h`) are plain C `int`/`short`, not fixed-width or machine-specific.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Block sort (blocksort.c, approximately 62% of CPU time) | Scalar C | Scalar C | Scalar C |
| Compression (compress.c) | Scalar C | Scalar C | Scalar C |
| Decompression (decompress.c) | Scalar C | Scalar C | Scalar C |
| Huffman coding (huffman.c) | Scalar C | Scalar C | Scalar C |
| CRC table (crctable.c) | Scalar C | Scalar C | Scalar C |
| bzip2recover | Scalar C | Scalar C | Scalar C |
| SIMD acceleration | None | None | None |
| Assembly | None | None | None |
| JIT | None | None | None |

No component rates "full" (hand-tuned) or "partial" (intrinsics) on any architecture, including bzip2's primary amd64 target - this is a uniform, portable-C89 codebase by design. The absence of riscv64-specific code is not a gap; it matches the project's design on every platform, and riscv64 support is not a stub, because there is no separate architecture-specific code path for it to be a stub of.

**Performance note.** GitLab issue [#40](https://gitlab.com/bzip2/bzip2/-/issues/40) ("mainGtU() improvement", opened 2022-03-28, still open on the now-archived fork) identifies that approximately 62% of bzip2 execution time is spent in `blocksort.c::mainGtU()`, a lexicographic compare loop. A proof-of-concept patch achieves 10-20% compression speedup on x86 and ARM64 by batching byte comparisons into 8-byte `unsigned long long` reads with an endian swap. No riscv64 measurements were taken, the patch fails 3 test cases from the large test suite, and it has not been merged. This opportunity applies equally to all architectures including riscv64, but the archived, read-only state of the repository it lives in means it cannot currently be merged there without the fork being revived, or the patch being re-targeted at sourceware.org.

## 5. Build System, Cross-Compilation, and Toolchain

**The two upstreams use entirely different build systems; this is the single largest correction versus a superficial reading of the project.** sourceware.org/git/bzip2.git - the repository this report is scoped to - builds with **plain GNU Make only**. A full tree listing (confirmed via gitweb `a=tree`) contains no `CMakeLists.txt`, no `meson.build`, no `configure` script, and no CI or Docker configuration of any kind; only `Makefile`, `Makefile-libbz2_so`, `README`, and `README.COMPILATION.PROBLEMS` govern the build. The CMake/Meson build system with `-DENABLE_X=ON/OFF`-style options and `-DUSE_OLD_SONAME=ON` belongs exclusively to the now-archived gitlab.com/bzip2/bzip2 1.1+ fork, not to the actively-shipped 1.0.x branch.

**Native riscv64 build (sourceware.org, Makefile):**

```sh
make
# builds libbz2.a, bzip2, bzip2recover; runs 6 built-in self-tests automatically
make install PREFIX=/usr/local
```

There is no `configure` step. Debian's and Ubuntu's riscv64 packages (Section 8) are all built from this 1.0.8 Makefile branch, not from the GitLab CMake/Meson fork.

**Shared library build:**

```sh
make -f Makefile-libbz2_so
```

The README states this Makefile "seems to work for Linux-ELF ... with gcc," with no platform-specific caveat for or against riscv64.

**Cross-compiling to riscv64.** No `--host`/toolchain-file mechanism exists; cross-compilation is done via Make variable overrides:

```sh
make CC=riscv64-linux-gnu-gcc AR=riscv64-linux-gnu-ar RANLIB=riscv64-linux-gnu-ranlib
```

No riscv64-specific `CFLAGS` are needed or documented (`CFLAGS=-Wall -Winline -O2 -g -D_FILE_OFFSET_BITS=64` is the stock setting).

**The archived GitLab fork's CMake/Meson build system**, for reference (frozen at its 2026-07-08 archival state, no longer accepting changes without the repository being unarchived):

```sh
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_SHARED_LIB=ON -DENABLE_STATIC_LIB=ON -DENABLE_APP=ON
cmake --build .
ctest -C Release -V
```

Cross-compiling that fork's CMake build to riscv64 requires an externally supplied toolchain file (`CMAKE_SYSTEM_PROCESSOR riscv64`, `CMAKE_C_COMPILER riscv64-linux-gnu-gcc`, `CMAKE_FIND_ROOT_PATH` set); its Meson build requires an externally supplied cross file with an `exe_wrapper` (for example `qemu-riscv64-static`) for test execution. `-DUSE_OLD_SONAME=ON` restores the 1.0.x `libbz2.so.1.0` SONAME for ABI compatibility with packages expecting it, versus the fork's own `libbz2.so.1`.

**Toolchain version requirements.** Neither upstream declares an explicit compiler minimum; the C standard is C89. The practical floor for riscv64 is a toolchain constraint, not a bzip2 constraint: GCC 7+ or Clang 5+ (first releases with mainline, non-experimental riscv64 target support). Meson >= 0.50.0 and Python >= 3.5 apply only to the archived fork's Meson path.

**QEMU.** No QEMU usage anywhere in either repository (no CI exists on sourceware.org to reference it; the archived fork's `.gitlab-ci.yml`/`.appveyor.yml` do not use it either). Any `exe_wrapper` needed for Meson cross-testing on the archived fork must be supplied externally.

**Dockerfile.** No Dockerfile exists in either repository.

**Known build failures on riscv64.** None found in any tracked source, mailing list, or bug tracker.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compression | Yes | Yes | Yes |
| Decompression | Yes | Yes | Yes |
| bzip2recover (damaged archive recovery) | Yes | Yes | Yes |
| Shared library (libbz2) | Yes | Yes | Yes |
| Static library (libbz2) | Yes | Yes | Yes |
| CLI tool (bzip2, bunzip2, bzcat) | Yes | Yes | Yes |
| SIMD acceleration | No (not implemented on any arch) | No | No |

**Functional gaps:** none. bzip2 provides identical functionality on riscv64 as on amd64 and arm64.

**Performance gaps.** The `mainGtU()` hot path (GitLab issue #40) accounts for approximately 62% of compression CPU time. The unmerged proof-of-concept achieves 10-20% speedup on x86/ARM64; this is equally applicable to riscv64 (little-endian, 64-bit), but has not been measured there and is currently stranded on the archived fork.

Data not available: published throughput benchmarks comparing riscv64 vs amd64 or arm64 for bzip2. An extensive search (RISE blog site-search, GitHub repository and code search, Bing, DuckDuckGo, Phoronix, OpenBenchmarking.org) found no quantitative comparison for bzip2 specifically in the 2024-2026 timeframe; Phoronix and OpenBenchmarking.org both returned HTTP 403 to automated fetches and would need to be checked manually. The nearest adjacent data point, RISE's "Project RP009: LLVM SPEC Optimization" post (2025-05-08, SPEC CPU 2017-based, up to 15.7% gains from scheduling-model work), does not include a bzip2 sub-benchmark and does not name bzip2.

**Security hardening gaps.** GitLab MR [!68](https://gitlab.com/bzip2/bzip2/-/merge_requests/68) (open): off-by-one global-buffer-overflow in the `bzip2recover` block scanner. GitLab MR [!69](https://gitlab.com/bzip2/bzip2/-/merge_requests/69) (open): allocation-size overflow-checked helper hardening. Both are architecture-agnostic and affect all platforms equally; both live on the now-archived, read-only GitLab fork, so neither can currently be merged there.

**Floating-point / NaN semantics.** Not applicable. bzip2 uses no floating-point arithmetic.

## 7. CI/CD Infrastructure

**sourceware.org/git/bzip2.git** (the repository this report is scoped to) has **no CI configuration of any kind**, confirmed by its complete 47-file tree listing: no `.gitlab-ci.yml`, no `.github/workflows`, no `.travis.yml`, no `.cirrus.yml`, no Jenkinsfile or Buildbot configuration.

**The archived gitlab.com/bzip2/bzip2 fork** did define CI, in `.gitlab-ci.yml` (fetched and read in full) and `.appveyor.yml` (Windows), both grepped for "riscv" with zero matches:

| Job | Architecture | OS | Notes |
|---|---|---|---|
| debian-testing | amd64 | Debian Testing | Frozen at archival |
| ubuntu-bionic | amd64 | Ubuntu 18.04 | Frozen at archival |
| ubuntu-bionic-i386 | i386 | Ubuntu 18.04 | Frozen at archival |
| fedora-35 / fedora-rawhide | amd64 | Fedora | Frozen at archival |
| opensuse-leap / opensuse-tumbleweed | amd64 | openSUSE | Frozen at archival |
| AppVeyor (MSVC/MinGW) | x86/amd64 | Windows | Frozen at archival |

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| sourceware.org CI job | No (none exist) | No | No |
| Archived GitLab fork CI job | Yes (frozen) | No | No |
| RISE runners | No | No | No |
| QEMU emulation in CI | No | No | No |
| Distro build farm | Yes | Yes | Yes (Debian rv-manda-04) |

**riscv64 CI verdict:** no upstream riscv64 CI exists in either repository, and the repository this report is scoped to has no CI for any architecture. Distro build infrastructure (Debian buildd, Ubuntu Launchpad) provides the only automated riscv64 build validation that exists for bzip2 today.

## 8. Distribution and Release Status

**Latest tagged release:** 1.0.8, 2019-07-13, on sourceware.org/git/bzip2.git. The archived gitlab.com/bzip2/bzip2 fork had 1.1.0 in development (`meson.build` declared version 1.1.0) but no 1.1.0 tag was ever cut before archival.

| Distribution | Version | riscv64 Available | Notes |
|---|---|---|---|
| Debian sid | 1.0.8-6+b2 | Yes, INSTALLED | Built on rv-manda-04 |
| Ubuntu 24.04 Noble | 1.0.8-5.1 | Yes | All standard Ubuntu architectures: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x |
| Ubuntu 26.04 Resolute | 1.0.8-6build2 | Yes | Confirmed live via the per-architecture download table on [packages.ubuntu.com/resolute/bzip2](https://packages.ubuntu.com/resolute/bzip2). This build is on the same generation as `armhf` and has **not** yet been rebuilt against the newer 1.0.8-6ubuntu0.1 security update that amd64/arm64/i386 already carry - a gap worth tracking against CVE-2026-42250 (Section 11) |
| Arch Linux RISC-V | Unknown | Unknown | `archriscv.felixc.at` has no package-tracker entry specifically for bzip2; status remains [NEEDS VERIFICATION] |
| PyPI | N/A | N/A | No PyPI package named "bzip2" exists (HTTP 404 on `/pypi/bzip2/json`; the `/simple/bzip2/` index lists zero files) |
| RISE wheel builder | N/A | N/A | The RISE-hosted PyPI mirror redirects straight through to the same empty PyPI index; bzip2 is not tracked in the [RISE wheel_builder roster](https://riseproject.gitlab.io/python/wheel_builder/) (approximately 80 packages, checked in full). bzip2 is only bundled incidentally as `libbz2` inside two unrelated wheels (Section 1) |
| Upstream source tarball | 1.0.8 | Source only | No architecture-specific patches required for riscv64 |

**What a user must do to get a working riscv64 binary:** install from the Debian or Ubuntu package manager (`apt install bzip2`). No special steps, no patches, and no source build are required.

## 9. Dependencies

bzip2's own source has no runtime library dependency beyond the C standard library; it links only against glibc. The remaining direct dependencies below are build- and test-time only, and it is worth flagging a discrepancy the live research surfaced: **CMake, Meson, and Ninja apply to the now-archived gitlab.com/bzip2/bzip2 1.1+ fork's build system, not to the sourceware.org 1.0.x branch that Debian and Ubuntu actually package**, which builds with plain GNU Make and needs none of the three. Both facts are reported below rather than reconciled away, per the project's dual-upstream reality.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glibc | Runtime-dependency (critical): the only library bzip2 links against; requires standard POSIX headers only | Yes | Covered by glibc's own test suite | Released in all major distros | None. See the glibc status report at project-reports/glibc.md |
| Python | Build-dependency (critical): on the archived GitLab fork, drives Meson's `install_links.py` and the `tests/runtest.py` test runner; not required at all for the sourceware.org Makefile build that Debian/Ubuntu actually use | Yes | N/A (host tool) | Released for riscv64 | None. See the Python status report at project-reports/python.md |
| CMake | Build-dependency (critical, per the direct-dependency list): one of the archived GitLab fork's two build systems; not used by sourceware.org's Makefile-only build | Yes | N/A (host tool) | Available in all major distros for riscv64 | None. No dedicated project-reports entry exists yet for CMake |
| Meson | Build-dependency (optional): the archived GitLab fork's alternative build system; not used by sourceware.org's Makefile-only build. Implicitly needs `pkg-config` for `.pc` generation | Yes | N/A (host tool) | Available in all major distros for riscv64 | None. No dedicated project-reports entry exists yet for Meson |
| Ninja | Build-dependency (optional): Meson's preferred backend on the archived GitLab fork | Yes | N/A (host tool) | Available in all major distros for riscv64 | None |
| Valgrind | Test-dependency (optional): memory-check test mode. The current GitHub mirror of the archived fork shows only a single, weak hit for "valgrind" - a prose mention in `docs/manual.xml` - with no wiring into `tests/CMakeLists.txt` or `.gitlab-ci.yml`; the earlier claim of a dedicated Valgrind CI test stage is [NEEDS VERIFICATION] against the canonical sourceware.org history rather than a downstream mirror | riscv64 support present, still maturing | Partial/unconfirmed riscv64 test coverage for bzip2 specifically | riscv64 support present but less mature than x86_64 | Not a hard blocker either way; test infrastructure appears to skip gracefully when Valgrind is absent. See the Valgrind status report at project-reports/valgrind.md |
| xsltproc / docbook toolchain (perl, xmllint, pdfxmltex, pdftops) | Indirect build-dependency, optional: documentation-only path (`ENABLE_DOCS=ON`) in the archived fork's CMakeLists.txt; not in binary packages | Available on riscv64 | N/A (host tools) | Available in Debian/Ubuntu riscv64 | None |
| pkg-config | Indirect build-dependency, optional: used by the archived fork's `meson.build` for `.pc` file generation | Available on riscv64 | N/A (host tool) | Available in all major distros | None |

**Verification caveat:** the `project-graph` MCP server was unavailable for the entirety of this research (`CONNECTION_CLOSED`), so none of the riscv64 build/test/release rows above are graph-confirmed; they rest on direct fetches of the GitLab API repository tree, `packages.ubuntu.com`, and `buildd.debian.org` instead. No dependency in this table has a JIT, SIMD, crypto, or numerics component that requires riscv64-specific work for bzip2's use case.

## 11. Known Bugs and Active Issues

**GitLab (gitlab.com/bzip2/bzip2, now archived/read-only) - issues with cross-architecture impact:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#40](https://gitlab.com/bzip2/bzip2/-/issues/40) | mainGtU() improvement | Open (frozen, repo archived) | Performance | Approximately 62% of compression CPU time; PoC patch achieves 10-20% speedup on x86 and ARM64; fails 3 test cases; no riscv64 measurement; affects all architectures equally |
| [#56](https://gitlab.com/bzip2/bzip2/-/issues/56) | Weird return in BZ2_decompress | Open (frozen, repo archived) | Correctness (potential UB) | Plausible undefined behavior on invalid input; no riscv64-specific trigger identified; affects all architectures |

**GitLab merge requests with correctness implications (also frozen by the archival):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [!68](https://gitlab.com/bzip2/bzip2/-/merge_requests/68) | bzip2recover off-by-one global-buffer-overflow | Open, cannot currently be merged (repo read-only) | Correctness / Security | Buffer overflow in the block scanner; affects all architectures |
| [!69](https://gitlab.com/bzip2/bzip2/-/merge_requests/69) | Allocation-size overflow-checked helper hardening | Open, cannot currently be merged (repo read-only) | Security hardening | Integer overflow hardening; affects all architectures |

**Debian Bug Tracking System:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1138255](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138255) | CVE-2026-42250 | Open | Important | Filed 2026; details not fully retrieved in research; no riscv64-specific component identified, but Ubuntu 26.04's riscv64 build of bzip2 (1.0.8-6build2) is on an older revision than the patched build already shipped for amd64/arm64/i386 (Section 8), worth confirming whether this CVE is the reason |

**RISC-V-specific bugs: zero.** No riscv64-specific open issue exists in the GitLab tracker (40 issues reviewed), the Debian BTS (27 bugs reviewed), or sourceware.org Bugzilla (10 open bugs reviewed). A GitHub issue search on `libarchive/bzip2` for "riscv" also returns zero results. The only RISC-V mention anywhere in the GitLab issue history is closed issue #6, which notes "Linux/RISC-V (core-only bare metal target, no std)" as a platform that cannot use Rust - a Rust-bootstrapping concern unrelated to bzip2 correctness. The one tangential artifact outside the bzip2 project itself, the closed 2017 [riscvarchive/riscv-gcc#70](https://github.com/riscvarchive/riscv-gcc/issues/70) compiler ICE report (Section 2), has no bearing on bzip2's own defect list.

## 12. Objections and Upstream Blockers

**Stated objections to riscv64:** none. No upstream developer has objected to or commented on riscv64 support in any tracked forum, on either upstream.

**Technical blockers:** none. The pure C89 codebase compiles and runs correctly on riscv64 without modification, on both the sourceware.org Makefile branch and the archived GitLab CMake/Meson fork.

**Organizational blockers:** the practical blocker is not riscv64-specific but structural: the GitLab 1.1+ fork, which held the only build-system modernization and the two open security-hardening MRs, is now archived and read-only, so no further merges can land there without the repository being revived or that work being re-targeted at sourceware.org.

**Acceptance probability for riscv64 patches:** not applicable; no patches are needed for functional support. If a performance patch (for example, an optimized `mainGtU()`) were submitted to sourceware.org, acceptance probability is uncertain given the existing PoC already fails 3 test cases on all architectures, indicating correctness standards that must be satisfied first, and given that sourceware.org has no CI at all to validate such a change automatically.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- Not an optimization-purpose project: bzip2's value proposition is compression ratio via Burrows-Wheeler block sorting, not raw throughput superiority over a simpler alternative - it is in fact typically slower than gzip - so no optimization level applies.
- **Justification:** bzip2's actual upstream repository ([sourceware.org/git/bzip2.git](https://sourceware.org/git/bzip2.git)) has no CI configuration of any kind - only a Makefile, README, and source, confirmed by a full file-tree listing at [sourceware.org/git/?p=bzip2.git;a=tree](https://sourceware.org/git/?p=bzip2.git;a=tree). The now-archived [gitlab.com/bzip2/bzip2](https://gitlab.com/bzip2/bzip2) fork does have `.gitlab-ci.yml`/`.appveyor.yml`, but those jobs cover only amd64/i386/Windows, with zero riscv64 job. With no upstream riscv64 CI, the distribution floor applies: Debian sid ([rv-manda-04](https://buildd.debian.org/status/package.php?p=bzip2)) and Ubuntu 24.04/26.04 ([packages.ubuntu.com/resolute/bzip2](https://packages.ubuntu.com/resolute/bzip2)) both build and ship riscv64 binaries, and no riscv64-specific packaging patches were found anywhere, consistent with bzip2 being pure architecture-agnostic portable C89 with zero `.S`/SIMD/`arch/`-conditioned code. This is a clean, unpatched distro build with no upstream CI validation, which caps the color at yellow rather than orange.
- **Pending work that could change the grade:** the open GitLab issue #40 (mainGtU() speedup PoC, unmerged, fails 3 tests) and open security-hardening MRs !68/!69 exist on the now-archived C 1.1+ fork but are architecture-agnostic, not riscv64-specific, and cannot currently be merged there since the repository is read-only. There is no RISE involvement, no riscv64 CI job, and no open riscv64-tagged issue or PR anywhere in the bzip2 C or Rust (Trifecta Tech Foundation libbzip2-rs) ecosystems that would change this grade. Adding a riscv64 QEMU job to upstream CI - sourceware.org has none at all to extend, so this would mean building CI from scratch there, or reviving the archived GitLab fork's `.gitlab-ci.yml` - is the only lever that could raise the color to blue or green.

## 14. Investment Analysis

RISE has no involvement with bzip2 beyond incidentally bundling `libbz2` inside two unrelated riscv64 wheel builds (Section 1); there is no prior RISE work on bzip2 itself to deduct from any of the estimates below.

### 14.1 Functional Enablement

No work needed. bzip2 builds and runs correctly on riscv64 by construction, on both upstreams, and Debian sid and Ubuntu 24.04/26.04 ship working riscv64 packages built from unmodified sourceware.org source.

### 14.2 Performance Optimization

One actionable opportunity exists: the `mainGtU()` hot path (GitLab issue #40). A 10-20% compression throughput improvement is achievable on all architectures; the existing PoC targets x86 and ARM64 by batching byte comparisons into 8-byte word reads with an endian swap, a technique that applies equally to little-endian riscv64. The work involves fixing the 3 existing test failures, benchmarking on riscv64 hardware, and - since the patch's current home (the archived GitLab fork) is read-only - re-targeting the submission at sourceware.org, the actual active upstream. This benefits all architectures, not riscv64 alone. No riscv64-specific SIMD opportunity exists, because bzip2 has no SIMD on any architecture.

### 14.3 CI/CD Infrastructure

sourceware.org/git/bzip2.git has no CI system of any kind to extend; adding riscv64 (or any architecture) validation there means standing up a CI pipeline from nothing, not adding one job to an existing matrix. This is a materially larger lift than the equivalent item would be for a project with an existing, extensible CI file. An alternative, lower-effort path is reviving the archived gitlab.com/bzip2/bzip2 fork and adding a riscv64 QEMU job to its existing `.gitlab-ci.yml`, but that requires the fork's maintainer (or a new one) to un-archive it first, which is outside a contributor's unilateral control.

### 14.4 Ecosystem Enablement

Not applicable. bzip2 has no dependent package ecosystem of its own requiring separate riscv64 enablement; where it appears in other ecosystems (for example bundled inside RISE-built Python wheels, Section 1), it is a transitive system dependency, not a package bzip2 itself must publish or maintain.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | Fix and re-submit the mainGtU() optimization (issue #40) against sourceware.org: correct the 3 failing test cases, benchmark on riscv64, submit upstream | 2-4 | Compiler/performance engineer | Low |
| Performance | Measure bzip2 throughput on riscv64 hardware vs amd64 and arm64 baselines (no published data exists today) | 0.5 | Performance engineer | Low |
| CI/CD | Stand up a minimal CI pipeline for sourceware.org/git/bzip2.git covering amd64 plus riscv64 via QEMU, since none exists to extend | 1-2 | Build engineer | Low |
| Security | Re-target and upstream MR !68 (bzip2recover buffer overflow) and MR !69 (integer overflow hardening) at sourceware.org, since the archived GitLab fork can no longer accept merges | 1 | Security engineer | Medium |

**Overall investment recommendation.** bzip2 requires no investment for riscv64 functional support; it works today, on both the stable Makefile branch that distros ship and the archived CMake/Meson fork. The open security items (MR !68/!69, CVE-2026-42250) warrant attention regardless of architecture, and the fact that their current home is archived and read-only should be resolved before riscv64-specific investment is considered. The performance work (issue #40) is low priority given bzip2 is a mature format increasingly displaced by zstd and xz, and given its Rust successor (libbzip2-rs) is where new corporate sponsorship is actually flowing. Total optional investment: 4-7 person-weeks across CI, security re-targeting, and performance measurement combined.

## 15. References

- [bzip2 sourceware.org homepage](https://sourceware.org/bzip2/)
- [bzip2 sourceware.org git (stable 1.0.x upstream)](https://sourceware.org/git/bzip2.git)
- [sourceware.org git file tree](https://sourceware.org/git/?p=bzip2.git;a=tree)
- [sourceware.org git tags](https://sourceware.org/git/?p=bzip2.git;a=tags)
- [sourceware.org git shortlog](https://sourceware.org/git/?p=bzip2.git;a=shortlog)
- [sourceware.org Makefile](https://sourceware.org/git/?p=bzip2.git;a=blob_plain;f=Makefile;hb=HEAD)
- [sourceware.org Makefile-libbz2_so](https://sourceware.org/git/?p=bzip2.git;a=blob_plain;f=Makefile-libbz2_so;hb=HEAD)
- [sourceware.org README](https://sourceware.org/git/?p=bzip2.git;a=blob_plain;f=README;hb=HEAD)
- [bzip2 GitLab repository (gitlab.com/bzip2/bzip2), archived approximately 2026-07-08](https://gitlab.com/bzip2/bzip2)
- [bzip2 .gitlab-ci.yml](https://gitlab.com/bzip2/bzip2/-/raw/master/.gitlab-ci.yml)
- [bzip2 .appveyor.yml](https://gitlab.com/bzip2/bzip2/-/raw/master/.appveyor.yml)
- [libarchive/bzip2 GitHub mirror](https://github.com/libarchive/bzip2)
- [nemequ/bzip2 GitHub mirror (stable Makefile branch)](https://github.com/nemequ/bzip2)
- [GitLab issue #40 - mainGtU() improvement](https://gitlab.com/bzip2/bzip2/-/issues/40)
- [GitLab issue #56 - Weird return in BZ2_decompress](https://gitlab.com/bzip2/bzip2/-/issues/56)
- [GitLab MR !68 - bzip2recover buffer overflow](https://gitlab.com/bzip2/bzip2/-/merge_requests/68)
- [GitLab MR !69 - allocation-size overflow-checked helper](https://gitlab.com/bzip2/bzip2/-/merge_requests/69)
- [Debian bug #1138255 (CVE-2026-42250)](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138255)
- [Debian buildd status for bzip2](https://buildd.debian.org/status/package.php?p=bzip2)
- [Ubuntu 24.04 Noble bzip2 package](https://packages.ubuntu.com/noble/bzip2)
- [Ubuntu 26.04 Resolute bzip2 package](https://packages.ubuntu.com/resolute/bzip2)
- [riscvarchive/riscv-gcc issue #70 - ICE minimized from bzip2.c](https://github.com/riscvarchive/riscv-gcc/issues/70)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE wheel builder package roster](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE python-wheels PR #2347 - osmium 4.3.1 (bundles libbz2)](https://github.com/riseproject-dev/python-wheels/pull/2347)
- [RISE python-wheels PR #2348 - libuuu riscv64 wheel (bundles bzip2)](https://github.com/riseproject-dev/python-wheels/pull/2348)
- [Trifecta Tech Foundation homepage](https://trifectatech.org/)
- [Trifecta Tech Foundation - Data compression initiative](https://trifectatech.org/initiatives/data-compression/)
- [Trifecta Tech Foundation blog - bzip2 crate switches from C to Rust](https://trifectatech.org/blog/bzip2-crate-switches-from-c-to-rust/)
- [Canonical becomes Gold Sponsor of Trifecta Tech Foundation](https://canonical.com/blog/canonical-becomes-gold-sponsor-of-trifecta-tech-foundation)
- [libbzip2-rs GitHub repository](https://github.com/trifectatechfoundation/libbzip2-rs)
- [libbzip2-rs CI workflow](https://github.com/trifectatechfoundation/libbzip2-rs/blob/main/.github/workflows/checks.yaml)
- [bzip2-rs (Rust bindings crate) GitHub repository](https://github.com/trifectatechfoundation/bzip2-rs)
- [scivision.dev - "BZip2 1.1 development archived"](https://www.scivision.dev/bzip-1.1-archived)
