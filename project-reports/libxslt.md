---
title: libxslt
parent: Project Reports
color: yellow
dependencies:
  - name: libxml2
    relation: runtime-dependency
    criticality: critical
  - name: libgcrypt
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libxslt" %}

# libxslt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libxslt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libxslt is a C library implementing the XSLT 1.0 stylesheet transformation specification (W3C), built on top of libxml2. It also ships libexslt, which implements the EXSLT extension function set (math, strings, dates, sets, crypto). The companion binary `xsltproc` is the reference command-line XSLT processor. The library is used by system software, document toolchains, and language runtimes (Python bindings via the `lxml` package and libxslt's own native Python bindings) wherever XML stylesheet transformation is needed.

The upstream canonical repository is [gitlab.gnome.org/GNOME/libxslt](https://gitlab.gnome.org/GNOME/libxslt). A read-only GitHub mirror exists at [github.com/GNOME/libxslt](https://github.com/GNOME/libxslt); an unofficial mirror also exists at github.com/gerph/libxslt. The project is hosted under the GNOME namespace on GNOME's own GitLab instance (created 2018-05-23) but is not a formal GNOME Foundation governance project: there is no board oversight, no written governance policy, and no MAINTAINERS file in the repository (fetch attempts return 404). The only governance record is the DOAP metadata file (`libxslt.doap`), which lists a single maintainer with no affiliation or contact information.

License: MIT. Original copyright: Daniel Veillard, 2001-2002 (individual). libexslt adds Thomas Broyer and Charlie Bozeman as copyright holders (2001-2002, individual). No corporate entity holds the copyright.

**Governance and maintainers:**

- Nick Wellnhofer (nwellnhof) - long-time maintainer, announced on GNOME Discourse ("Stepping down as libxslt maintainer," 12 Mar 2025) that libxslt was "more or less unmaintained." The project was formally marked unmaintained around July 2025.
- Ivan Chavero (imcsk8) - volunteered and became sole maintainer in August 2025, vouched for by Federico Mena Quintero. No company affiliation for Chavero was found in any source (GitHub, GitLab, Wikipedia, web search).
- Since August 2025, commit activity shows a small set of individual contributors (Ivan Chavero, David King, Daniel Garcia Moreno, Darafei Praliaskouski, Alexander Richardson, and others) merging community patches. This pattern reads as ordinary volunteer/distro-maintainer activity, not corporate-funded engineering. No corporate maintainers with identifiable company affiliations could be found for this project.

There is no corporate sponsorship or corporate-maintainer structure behind libxslt. The GNOME Foundation provides infrastructure hosting only; it does not direct development, fund releases, or maintain a corporate advisory board for libxslt specifically.

The project is not a member of the [RISE Project](https://riseproject.dev) (RISC-V Software Ecosystem). libxslt does not appear anywhere on riseproject.dev: the site's own search for "libxslt" returns "Sorry, no results were found," libxslt is absent from the 80-package RISE Python wheel-builder list, and 0 of 764 issues in the `riseproject-dev/python-wheels` tracker mention it. None of RISE's published RFPs target XML/XSLT processing.

**Community stance on new ports:** libxslt has no explicit port policy and no architecture tier policy document. The only active community discussion found (the March 2025 Discourse thread) concerned the project's unmaintained status generally and whether GNOME should tag orphaned projects; it made no mention of architecture ports or RISC-V. As a pure portable C library, libxslt has never needed porting work for any architecture; the implicit policy is that anything that builds with a standard C compiler is supported.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port history because no port was necessary. libxslt contains zero architecture-specific code. A direct GitLab API search of the `GNOME/libxslt` project (issues and merge requests, "riscv" and "risc" in title and description, all states) returns zero results. A separate GitLab API commit search for "riscv" across the full repository history returns 20 commits, but every one is a false positive (unrelated titles such as bug fixes, merges, and "Remove Nick from AUTHORS") - none is a RISC-V-related change. No master tracking issue for a riscv64 port exists, because none is needed.

RISC-V support arrived implicitly, at the distribution packaging layer, once distributions brought up riscv64 ports and began building the library from unmodified upstream source.

| Date | Event | Source |
|------|-------|--------|
| Undated (~2018-2020) | Debian riscv64 port brings up libxslt as part of the base system; no patches required | Debian ports archive |
| 2024-06-12 | v1.1.40 released (source-only) | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2024-06-19 | v1.1.41 released | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2024-07-04 | v1.1.42 released | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2025-03-12 | v1.1.43 released | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2025-03-12 | Nick Wellnhofer announces stepping down as maintainer (GNOME Discourse) | GNOME Discourse |
| 2025-07 (approx.) | Project formally marked unmaintained | GNOME Discourse thread |
| 2025-08 | Ivan Chavero becomes sole maintainer | GNOME Discourse / GitLab commit history |
| 2025-11-30 | v1.1.45 released (current) | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2026-01-27 | Arch Linux RISC-V port builds `libxslt-1.1.45-2-riscv64.pkg.tar.zst` | [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/) |
| 2026-03-26 | Debian sid builds libxslt 1.1.45-0.1 natively on rv-osuosl-04; status "Installed" | [Debian buildd](https://buildd.debian.org/status/package.php?p=libxslt&suite=sid) |
| 2026-09-01/04 | conda-forge/libxslt-feedstock PR #51 adds `linux-riscv64` to the conda-forge build matrix (packaging-only, no source change); merged | [GitHub PR #51](https://github.com/conda-forge/libxslt-feedstock/pull/51) |
| 2026 (resolute cycle) | Ubuntu 26.04 "resolute" lists riscv64 binaries for all 5 libxslt-related packages | [Ubuntu package search](https://packages.ubuntu.com/search?suite=resolute&arch=riscv64&keywords=libxslt) |

There is no "first riscv64 commit" date in the upstream repository, and none is needed: the library is fully upstream for every architecture by construction.

## 3. Upstream Support Tier

libxslt has no published tier policy of any kind. The CI configuration (`.gitlab-ci.yml`, verified by direct fetch from both `gitlab.gnome.org/GNOME/libxslt` and the GitHub mirror) covers 21 jobs, all restricted to x86_64 Linux (GCC, GCC c89, GCC static, Clang ASan, Clang MSan), Windows (MinGW w64-x86_64/i686 and MSVC v141 x64/x86 via CMake), plus `dist` and `pages` jobs. No job name, runner tag, comment, or variable anywhere in the file contains "riscv," "riscv64," "risc-v," "arm," or "aarch64" in any form.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Yes (GitLab, GCC + Clang, sanitizers) | No | No |
| Release-blocking tests | Yes | No | No |
| Official prebuilt binaries from upstream | No (source-only releases) | No | No |
| Debian package | Yes (1.1.45-0.1) | Yes | Yes (1.1.45-0.1, native build on rv-osuosl-04) |
| Ubuntu package (resolute, 26.04) | Yes | Yes | Yes (all 5 libxslt-related packages) |
| Arch Linux RISC-V package | Yes (1.1.45) | Data not available | Yes (1.1.45-2, confirmed via HTTP 200 on the binary artifact) |

Upstream ships source-only releases for every architecture; no prebuilt binaries are published by the project for any of them. From upstream's perspective, riscv64 is at parity with arm64: neither is exercised in CI, neither receives upstream-built binaries, and both build cleanly from source without modification.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libxslt is a pure portable C library. The top-level source tree (`.gitlab-ci`, `doc`, `examples`, `libexslt`, `libxslt`, `m4`, `python`, `tests`, `vms`, `win32`, `xsltproc`) contains no `arch/`, `simd/`, `x86/`, `arm/`, or `riscv/` directory, no `.S`/`.s`/`.asm` assembly files, and no files named with `simd`, `neon`, `sse`, `avx`, `riscv`, or `vector`. The full inventory of architecture-specific code in the repository:

- Assembly files: 0
- SIMD intrinsics: 0
- JIT compilation: 0 (libxslt is a tree-walking interpreter, not a JIT)
- Cryptographic acceleration: 0 in libxslt itself; EXSLT crypto delegates entirely to libgcrypt
- GC barriers or memory-model fences: 0
- `#ifdef __riscv` guards: 0

The only architecture-conditional code found anywhere in the build system is a `configure.ac` block for `alpha*-*-linux*` that adds the `-mieee` flag; no other architecture, including riscv64, receives any special handling.

**Component analysis:** there are no arch-specific components to rate individually on libxslt's own full/partial/scalar/missing scale, because none were ever written to be architecture-differentiated in the first place. Every "component" is plain portable C compiled generically, identically on every target.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| XSLT transformation engine | scalar C | scalar C | scalar C |
| XPath evaluation | scalar C (via libxml2) | scalar C (via libxml2) | scalar C (via libxml2) |
| String processing | scalar C | scalar C | scalar C |
| Number formatting | scalar C | scalar C | scalar C |
| EXSLT math/date/string extensions | scalar C | scalar C | scalar C |
| EXSLT crypto (optional) | via libgcrypt | via libgcrypt | via libgcrypt |
| Profiler | scalar C | scalar C | scalar C |

All SIMD-sensitive operations relevant to XSLT processing (XML parsing, UTF-8 validation, tree traversal) live in libxml2, a dependency, not in libxslt code (see Section 9).

**Floating-point and NaN semantics:** libxslt uses standard IEEE 754 double-precision arithmetic for XPath number evaluation. RISC-V's D extension mandates IEEE 754-2008 compliance. No riscv64-specific floating-point correctness issue was found. Open issue #169 (non-IEEE-754 NaN handling on NetBSD/VAX) is explicitly not applicable to riscv64, which defines `NAN` and uses standard IEEE 754 semantics.

## 5. Build System, Cross-Compilation, and Toolchain

libxslt supports two build systems: Autotools (primary) and CMake (>= 3.18 required; the Windows/MSVC CI job additionally pins CMake 3.19.4). No minimum compiler version is stated in `configure.ac` or `CMakeLists.txt`; the code requires only C89/C99-level support plus POSIX (`_POSIX_C_SOURCE=200112L` is explicitly exercised in the `gcc:c89` CI job).

**Actual upstream CI invocations** (`.gitlab-ci/test.sh`, arch-generic):

```
sh autogen.sh
make -sj$(nproc)
./configure --with-crypto --with-plugins --with-libxml-src=../libxml2
CFLAGS="$CFLAGS -Werror" make -s
CFLAGS="$CFLAGS -Werror" make -s check
```

**CMake invocation** (`.gitlab-ci/test_cmake.sh`):

```
cmake -DBUILD_SHARED_LIBS=$BUILD_SHARED_LIBS -DCMAKE_INSTALL_PREFIX=libxml2-install \
      -DCMAKE_BUILD_TYPE=RelWithDebInfo -DLIBXML2_WITH_TESTS=OFF \
      -S libxml2-source -B libxml2-build
cmake --build libxml2-build --target install

cmake -DBUILD_SHARED_LIBS="$BUILD_SHARED_LIBS" -DCMAKE_INSTALL_PREFIX=libxslt-install \
      -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCMAKE_C_FLAGS='-Werror' \
      -DLIBXSLT_WITH_CRYPTO=ON -DLIBXSLT_WITH_MODULES=ON \
      -DLIBXSLT_WITH_DEBUG=ON -DLIBXSLT_WITH_DEBUGGER=ON \
      -S . -B libxslt-build
cmake --build libxslt-build --target install
(cd libxslt-build && ctest -VV)
```

Neither invocation contains a `-march=riscv64` flag or a riscv CMake toolchain file; cross-compiling for riscv64 would require a user-supplied `CMAKE_TOOLCHAIN_FILE` with `CMAKE_SYSTEM_PROCESSOR=riscv64` and `CMAKE_C_COMPILER=riscv64-linux-gnu-gcc`. No libxslt-specific cross-compilation documentation exists. README.md states plainly that libxslt has no independent build documentation ("The build system is similar to libxml2's; refer to libxml2's README for build instructions").

**CI container:** libxslt's CI reuses libxml2's Dockerfile (`registry.gitlab.gnome.org/gnome/libxml2`), based on `FROM ubuntu:26.04` with no architecture pin; nothing in the Dockerfile itself addresses multi-arch builds beyond standard Docker `--platform` selection.

**Verified native riscv64 build (Debian sid, 2026-03-26):** host rv-osuosl-04.debian.org (native riscv64 hardware, not QEMU), GCC 15.2.0, binutils 2.46. Exact configure invocation:

```
./configure --build=riscv64-linux-gnu --prefix=/usr --libdir=${prefix}/lib/riscv64-linux-gnu \
  --disable-maintainer-mode --disable-dependency-tracking --without-python \
  --with-history --disable-static --with-crypto
```

`configure` output confirms `checking whether we are cross compiling... no`; no riscv64-specific toolchain file or configure flag is required. Compiler flags applied (`-Wall -Wextra ... -g -O2 -Werror=implicit-function-declaration -fstack-protector-strong -Wformat -Werror=format-security -D_FORTIFY_SOURCE=2`) are identical to those used on amd64.

**QEMU usage:** none found anywhere in the build pipeline. Upstream CI runs exclusively on x86_64/Windows runners; Debian builds natively on riscv64 hardware.

**Known build failures on riscv64:** none reported in any tracked distribution or upstream source.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| XSLT 1.0 conformance | Full | Full | Full | None |
| EXSLT extensions | Full | Full | Full | None |
| xsltproc binary | Full | Full | Full | None |
| Python bindings | Full | Full | Full (if Python available) | None in libxslt itself |
| Extension modules (dlopen) | Full | Full | Full | None |
| Crypto (EXSLT crypto, optional) | via libgcrypt | via libgcrypt | via libgcrypt | None in libxslt; see Section 9 for libgcrypt bignum gap |
| Profiler | Full | Full | Full | None |
| Debugger | Full | Full | Full | None |
| Thread-safe stylesheet contexts | Full | Full | Full | None |

**Functional gaps:** none. No feature that works on amd64 or arm64 fails to work on riscv64.

**Performance gaps:** libxslt itself introduces no architecture-specific performance gap; all transformation operations are scalar C, identical across architectures. XSLT throughput on riscv64 relative to amd64/arm64 is determined by CPU microarchitecture and by libxml2's performance on riscv64, not by anything in libxslt. No libxslt-specific benchmark data comparing riscv64 to other architectures exists in any searched source, including Phoronix, riseproject.dev's blog, and general RISC-V benchmark venues (chipsandcheese, RiVEC).

**Security hardening:** the Debian riscv64 build enables `-fstack-protector-strong`, `-D_FORTIFY_SOURCE=2`, `-Wformat`, `-Werror=format-security` - identical to the amd64 flags. No hardening gap exists.

**Floating-point correctness:** as noted in Section 4, IEEE 754 compliance on riscv64 is equivalent to amd64/arm64; no known NaN or rounding-mode issue applies.

## 7. CI/CD Infrastructure

**No upstream riscv64 CI exists**, confirmed by directly reading `.gitlab-ci.yml` at both [gitlab.gnome.org/GNOME/libxslt](https://gitlab.gnome.org/GNOME/libxslt/-/raw/master/.gitlab-ci.yml) and the [GitHub mirror](https://github.com/GNOME/libxslt/blob/master/.gitlab-ci.yml). The `.github/` directory does not exist in the GNOME/libxslt repository (the GitHub REST API returns HTTP 404 for it); there are zero GitHub Actions workflows.

The 21-job GitLab pipeline: `gcc`, `gcc:c89`, `gcc:static`, `clang:asan`, `clang:msan`, `mingw:w64-x86_64:shared`, `.mingw:msys:shared` (disabled), `cmake:linux:gcc:{shared,static}`, `cmake:linux:clang:{shared,static}`, `cmake:mingw:w64-i686:{shared,static}`, `cmake:mingw:w64-x86_64:{shared,static}`, `cmake:msvc:v141:{x64,x86}:{shared,static}`, `dist`, `pages`. Runner tags used: `asan`, `win32-ps`. The only architecture tokens anywhere in the file are `x86_64`, `i686`, `x64`, `x86`, `Win32`.

| CI attribute | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Upstream CI job | Yes | No | No |
| Sanitizer builds (ASan/MSan) | Yes | No | No |
| Windows cross-build | Yes | No | No |
| RISE runner | No | No | No |
| Downstream distro build/test | Debian (native) | Debian (native) | Debian (native, rv-osuosl-04) |

riscv64 is exercised only within Debian's own build infrastructure. The Debian buildd at rv-osuosl-04 is a real riscv64 machine (not emulation) and runs the full build and install verification; this is downstream infrastructure, not upstream CI. No QEMU-based cross-compilation job exists anywhere in the known build pipeline, and no RISE-operated runner is used for libxslt.

## 8. Distribution and Release Status

**Upstream releases:** source-only archives; no prebuilt binaries for any architecture are shipped by upstream. No release asset filename contains "riscv64" or "riscv." Most recent release: v1.1.45 (2025-11-30).

**PyPI:** the package `libxslt` does not exist on PyPI (`pypi.org/pypi/libxslt/json` and `pypi.org/simple/libxslt/` both return HTTP 404, confirmed via direct `curl`). This is not a Python package; Python bindings to it ship as `lxml`, a separate project not covered by this report.

**RISE wheel builder:** not applicable. A query against the RISE GitLab PyPI mirror (`gitlab.com/.../packages/pypi/simple/libxslt/`) redirects to PyPI, which itself 404s.

**Distribution packages:**

| Distribution | Package(s) | Version | riscv64 status | Evidence |
|-------------|------------|---------|-----------------|----------|
| Debian sid | libxslt1.1, libxslt1-dev | 1.1.45-0.1 | Installed (native build, rv-osuosl-04) | [Debian buildd](https://buildd.debian.org/status/package.php?p=libxslt&suite=sid) |
| Ubuntu 24.04 (Noble) | libxslt1.1, libxslt1-dev | 1.1.39-0exp1build1 | Available via ports (two minor versions behind upstream) | [Ubuntu package search](https://packages.ubuntu.com/search?keywords=libxslt&suite=noble&searchon=names&section=all) |
| Ubuntu 26.04 (resolute) | libxslt1.1, libxslt1-dev, libxml-libxslt-perl, libxsltc-java, libxslthl-java | 1.1.45-based | Available; all 5 libxslt-related packages confirmed under the riscv64 filter | [Ubuntu package search, resolute/riscv64](https://packages.ubuntu.com/search?suite=resolute&arch=riscv64&keywords=libxslt) |
| Arch Linux RISC-V | libxslt, libxslt-docs, perl-xml-libxslt | 1.1.45-2 | Available; binary confirmed downloadable (HTTP 200, `content-type: application/zstd`, 225189 bytes, last-modified 27-Jan-2026) | [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/) |

**What a user must do to get a working riscv64 binary:**

- Debian sid: `apt install libxslt1.1 libxslt1-dev` - no compilation required, current version (1.1.45).
- Ubuntu 26.04 (resolute): `apt install libxslt1.1` - current version, native riscv64 binary.
- Ubuntu 24.04 (ports): `apt install libxslt1.1` - available at 1.1.39; users requiring 1.1.45 must build from source.
- Arch Linux RISC-V: `pacman -S libxslt` from the community riscv64 repository.
- From source on any riscv64 Linux system: standard `./configure && make && make install` with no special flags; any reasonably modern GCC/Clang with riscv64 backend support (GCC >= 7 / Clang >= 9, general timeline for mature riscv64 codegen) is sufficient.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|-----------|------|---------------|--------------|-----------------|-------|
| libxml2 | runtime-dependency, critical. XML parsing and XPath; libxslt is literally "an XSLT processor based on libxml2" (`Requires: libxml-2.0` in the pkg-config file). | Clean - Debian sid 2.15.3+dfsg-1 built successfully on riscv64 (2026-06-05); pure portable C, no arch-specific code. | No upstream riscv64 CI (0 riscv jobs in libxml2's own CI, matching libxslt's pattern). | Current via Debian sid, Ubuntu (24.04 ports and 26.04 resolute), Arch Linux RISC-V. | Open issue [GNOME/libxml2#971](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971): double-checked locking in catalog code uses relaxed atomics unsafe on weakly-ordered architectures, including riscv64. Non-blocking for single-threaded or non-catalog use; potential data race for multithreaded catalog resolution. Also see [GNOME/libxml2#904](https://gitlab.gnome.org/GNOME/libxml2/-/issues/904): libxml2 2.14.2 broke librsvg tests specifically on riscv64 (opened 2025-05-04, closed 2025-05-07); the sibling report [GNOME/librsvg#1168](https://gitlab.gnome.org/GNOME/librsvg/-/issues/1168) remains open ("Needs Diagnosis"/"Needs Information"), so root cause was not confirmed fixed even though the libxml2-side issue was closed quickly. This is a librsvg/libxml2 interaction, not a libxslt issue, but it is the nearest verified riscv64-specific correctness bug anywhere in the GNOME XML stack libxslt depends on. |
| libgcrypt | runtime-dependency, optional (>= 1.1.42, gated by `--with-crypto` / `LIBXSLT_WITH_CRYPTO`). Provides the EXSLT crypto extension functions in libexslt. | Clean. RV extension detection (V, Zbb, Zbc, Zvkned, Zvknha, Zvknhb) is automatic via configure probes; no architecture-specific work needed in libxslt itself. | No automated riscv64 CI job in libgcrypt; newer SIMD/crypto paths tested only under QEMU upstream, not on physical riscv64 hardware. | Ubuntu 24.04 ships 1.10.3-2build1 (predates all RISC-V acceleration, which landed in 1.11.1+); Arch Linux RISC-V ships 1.12.2-1 (current, with acceleration). | Bug T7647 (fixed in 1.11.2): `simd-common-riscv.h` missing from the 1.11.1 release tarball broke all riscv64 tarball builds. No `mpi/riscv/` bignum assembly exists - RSA/ECDH/ECDSA/EdDSA key operations fall back to generic C (a performance gap, not a correctness issue, and irrelevant to EXSLT crypto, which only uses symmetric hash functions). Poly1305 has no RV acceleration. |
| Python | build-dependency, optional (gated by `--with-python` / `LIBXSLT_WITH_PYTHON`). Builds libxslt's own Python C-extension bindings, linked against `python-${PYTHON_VERSION}`. | Builds, with caveats: required a `-latomic` link fix (2023) and a `CTYPES_PASS_BY_REF_HACK` workaround for riscv64. | Actively broken in the CPython 3.15 beta series on riscv64: `test_frame_pointer_unwind` ([#150919](https://github.com/python/cpython/issues/150919)) and `test_c_stack_unwind` ([#151040](https://github.com/python/cpython/issues/151040)) both fail (Fedora 44, June 2026); zero riscv64 coverage in any of CPython's 23 GitHub Actions workflow files. | riscv64 is untiered in PEP 11 (effectively Tier 0/unsupported); an unofficial riscv64 buildbot exists but is tagged "unstable." | No Tier-2 copy-and-patch JIT support on riscv64 (hard `ValueError`/`TRAMPOLINE_SIZE 0`); perf-profiling trampoline work incomplete/disabled; open stack-unwinding regressions in 3.15 betas; not blocking for libxslt's C core, which does not require the JIT. |
| libgpg-error (transitive, via libgcrypt) | Critical build-time dependency of libgcrypt (>= 1.56 required). | Not independently researched in depth this cycle. | Not independently researched. | Available on riscv64 - Debian sid ships v1.61-2. | No dedicated status report exists for this dependency; it is not a top-level tracked project. |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | RISC-V relevance |
|----|-------|--------|----------|-----------------|
| [libxslt #131](https://gitlab.gnome.org/GNOME/libxslt/-/issues/131) | AVTs are precompiled only for attributes of Literal Result Elements | Open | Low | Architecture-agnostic general performance refactor idea (filed 2024-12-25 by maintainer Nick Wellnhofer); no arch tag. |
| [libxslt #130](https://gitlab.gnome.org/GNOME/libxslt/-/issues/130) | Optimize variable lookup | Open | Low | Architecture-agnostic; same filer and date as #131. |
| [libxslt #169](https://gitlab.gnome.org/GNOME/libxslt/-/issues/169) | libexslt cannot be built on NetBSD/VAX (NAN undefined) | Open | Low | Not applicable - riscv64 uses IEEE 754 with `NAN` defined. |
| [libxslt #24](https://gitlab.gnome.org/GNOME/libxslt/-/issues/24) | xsltproc performance with large text output | Open | Low | Architecture-agnostic; string concatenation overhead affects all platforms equally. |
| [libxml2 #971](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971) | Double-checked locking unsafe on weakly-ordered architectures (riscv64, arm) | Open | Medium (multithreaded catalog use only) | Affects riscv64 via the libxml2 dependency; not a libxslt bug. |
| [libxml2 #904](https://gitlab.gnome.org/GNOME/libxml2/-/issues/904) | libxml2 2.14.2 breaks librsvg tests specifically on riscv64 | Closed (2025-05-07, 3 days after opening) | Medium | riscv64-specific regression in a libxslt-adjacent library; closed quickly, but the sibling issue below suggests root cause may not be fully confirmed. |
| [librsvg #1168](https://gitlab.gnome.org/GNOME/librsvg/-/issues/1168) | SVG reference tests failing with libxml2 2.14.2 on riscv64 | Open ("Needs Diagnosis"/"Needs Information") | Medium | Same symptom family as libxml2 #904 (~28 SVG reference/filter tests fail only on riscv64, Arch Linux, not reproducible on x86_64 with the same libxml2 version); not a libxslt issue but flagged as the nearest verified riscv64 correctness bug in the dependent XML stack. |

**Correctness bugs specific to riscv64 in libxslt itself:** none found. A direct GitLab API query against `GNOME/libxslt` for "riscv" (all states, title + description) returns zero matches.

**Performance bugs specific to riscv64 in libxslt itself:** none found. No libxslt-specific riscv64 benchmark or regression report exists in any searched source.

One environment issue was found in an external project: EESSI `dev.eessi.io-riscv#34` (open), where `lxml` failed to build on a BSC HCA RISC-V cluster because `libxslt-dev` was not installed on batch nodes. This is a packaging/environment gap in a downstream CI system, not a libxslt bug.

## 12. Objections and Upstream Blockers

No objections, technical blockers, or organizational blockers to riscv64 support in libxslt were found. The project has no architecture tier policy that would need updating, no riscv64 porting patch pending review, and no maintainer statement opposing riscv64 support. The current sole maintainer (Ivan Chavero, since August 2025) has not commented on architecture support at all; the only relevant community discussion (the 2025 Discourse thread) concerned the project's unmaintained status, not ports.

The only upstream gap - absence of riscv64 in CI - is not a deployment blocker. Debian's native riscv64 buildd and the Arch Linux RISC-V community repository both serve as functional substitutes for riscv64 build verification today.

Adding a riscv64 CI job to `.gitlab-ci.yml` would require either a GNOME GitLab riscv64 runner or a QEMU-based cross-compilation job; neither currently exists for any non-x86 architecture in this project. Given the maintainer's demonstrated willingness to accept community patches (e.g., the September 2025 test update contributed by a community RISC-V/loong64 contributor), a CI-addition patch would likely face no principled objection, but no such patch has been proposed or discussed as of this report date.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- Not an optimization-purpose project; no optimization-level rating applies.
- **Justification:** Upstream libxslt's `.gitlab-ci.yml` has zero riscv64 jobs (only x86_64/i686/Win32 across gcc/clang/mingw/msvc), confirmed by directly reading [gitlab.gnome.org/GNOME/libxslt/-/raw/master/.gitlab-ci.yml](https://gitlab.gnome.org/GNOME/libxslt/-/raw/master/.gitlab-ci.yml) and its [GitHub mirror](https://github.com/GNOME/libxslt/blob/master/.gitlab-ci.yml), so there is no upstream CI floor to apply. However, Debian sid builds libxslt 1.1.45-0.1 natively on riscv64 hardware (buildd rv-osuosl-04) and Ubuntu 26.04 "resolute" lists riscv64 binaries for all 5 libxslt packages ([packages.ubuntu.com](https://packages.ubuntu.com/search?suite=resolute&arch=riscv64&keywords=libxslt)), both from unmodified upstream source, since libxslt has zero architecture-specific code (no `.S` files, no `arch/riscv/`, no `#ifdef __riscv` anywhere). Applying the clean-distro-build floor raises the grade to yellow rather than orange.
- **Pending work that could change the grade:** no open RISC-V-related issues or merge requests exist at [gitlab.gnome.org/GNOME/libxslt](https://gitlab.gnome.org/GNOME/libxslt) (zero results via the project's own issues/MR API search for "riscv"/"risc"). The only RISC-V-related artifact anywhere is the merged downstream [conda-forge/libxslt-feedstock PR #51](https://github.com/conda-forge/libxslt-feedstock/pull/51), which only adds a linux-riscv64 entry to conda-forge's build matrix with no libxslt source changes. No RISE involvement was found: libxslt is absent from RISE's Python wheel-builder package list, riseproject.dev's own site search returns zero results for "libxslt," and 0/764 issues in `riseproject-dev/python-wheels` mention it.

## 14. Investment Analysis

**RISE pre-coverage:** no RISE RFP covers libxslt, and no RISE-funded work of any kind has touched the project (confirmed via riseproject.dev site search, the RISE wheel-builder package list, and the `riseproject-dev/python-wheels` issue tracker). All investment sizing below reflects fully uncovered work.

### 14.1 Functional Enablement

No functional enablement work is needed. libxslt is fully functional on riscv64 today. Debian sid and Ubuntu 26.04 (resolute) both ship the current upstream release (1.1.45) built natively on riscv64, and the Arch Linux RISC-V repository independently confirms a working riscv64 binary.

### 14.2 Performance Optimization

libxslt contains no architecture-specific code path and no SIMD or JIT for any architecture. There is no libxslt-internal optimization work to fund for riscv64, because there is no optimization work for any architecture - the library is scalar C throughout. Any XSLT throughput improvement on riscv64 would have to come from libxml2 (string/UTF-8 processing) or from the underlying CPU microarchitecture, not from libxslt.

### 14.3 CI/CD Infrastructure

The only gap is the absence of upstream riscv64 CI. A riscv64 CI job could be added to `.gitlab-ci.yml` using QEMU user-mode emulation (no riscv64 GitLab runner currently exists for this project). Estimated effort: 1 person-week (write job, validate locally, submit merge request, respond to review). Acceptance probability is high given the maintainer's track record of accepting community patches and the absence of any objection on record. Value is low-to-medium: the library already builds correctly on riscv64 across three independent distribution channels, so CI would primarily catch future regressions rather than enable anything new.

### 14.4 Ecosystem Enablement

Not applicable. libxslt has no dependent package ecosystem of its own that requires independent riscv64 enablement. The `lxml` Python package, which embeds libxslt, is a separate project; its riscv64 wheel availability is tracked separately and is out of scope here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | None required | 0 | - | - |
| Performance | None in libxslt scope; libxml2 UTF-8/string work is the relevant target | 0 | - | - |
| CI/CD | Add riscv64 QEMU job to `.gitlab-ci.yml` | 1 | Community / Qualcomm | Low |
| Ecosystem | None (no dependent package ecosystem) | 0 | - | - |
| Dependency: libxml2 #971 | Fix double-checked locking for weakly-ordered architectures | 2-3 (in libxml2, not here) | libxml2 maintainer / contributor | Medium (multithreaded catalog use only) |
| Dependency: libgcrypt bignum | Add riscv64 `mpi/riscv/` acceleration for RSA/ECDH/ECDSA/EdDSA (perf only) | 2-4 (in libgcrypt, not here) | libgcrypt maintainer / contributor | Low (irrelevant to EXSLT crypto's symmetric-only usage) |

**Total libxslt-specific investment required: 1 person-week (optional CI job only).**

The library is production-ready on riscv64 today with no investment, confirmed independently across Debian sid, Ubuntu 26.04 resolute, and Arch Linux RISC-V. The CI gap is a quality-of-life improvement for future regression detection, not a prerequisite for deployment.

## 15. References

- [libxslt GitLab repository (canonical)](https://gitlab.gnome.org/GNOME/libxslt)
- [libxslt GitHub mirror](https://github.com/GNOME/libxslt)
- [libxslt .gitlab-ci.yml (canonical)](https://gitlab.gnome.org/GNOME/libxslt/-/raw/master/.gitlab-ci.yml)
- [libxslt .gitlab-ci.yml (GitHub mirror)](https://github.com/GNOME/libxslt/blob/master/.gitlab-ci.yml)
- [libxslt GitLab releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases)
- [libxslt issue #131: AVTs precompiled only for Literal Result Element attributes](https://gitlab.gnome.org/GNOME/libxslt/-/issues/131)
- [libxslt issue #130: Optimize variable lookup](https://gitlab.gnome.org/GNOME/libxslt/-/issues/130)
- [libxslt issue #169: NAN undefined on NetBSD/VAX](https://gitlab.gnome.org/GNOME/libxslt/-/issues/169)
- [libxslt issue #24: xsltproc performance with large text output](https://gitlab.gnome.org/GNOME/libxslt/-/issues/24)
- [libxml2 issue #971: double-checked locking on weakly-ordered architectures](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971)
- [libxml2 issue #904: 2.14.2 breaks librsvg tests on riscv64](https://gitlab.gnome.org/GNOME/libxml2/-/issues/904)
- [librsvg issue #1168: SVG reference tests failing with libxml2 2.14.2 on riscv64](https://gitlab.gnome.org/GNOME/librsvg/-/issues/1168)
- [Debian buildd status for libxslt (sid)](https://buildd.debian.org/status/package.php?p=libxslt&suite=sid)
- [Ubuntu 24.04 (noble) libxslt package search](https://packages.ubuntu.com/search?keywords=libxslt&suite=noble&searchon=names&section=all)
- [Ubuntu 26.04 (resolute) libxslt riscv64 package search](https://packages.ubuntu.com/search?suite=resolute&arch=riscv64&keywords=libxslt)
- [Arch Linux RISC-V port repository listing](https://archriscv.felixc.at/repo/extra/)
- [conda-forge/libxslt-feedstock PR #51: Support linux-riscv64 platform](https://github.com/conda-forge/libxslt-feedstock/pull/51)
- [RISE Project](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels issue tracker](https://github.com/riseproject-dev/python-wheels/issues)
- [CPython issue #150919: test_frame_pointer_unwind failing on riscv64](https://github.com/python/cpython/issues/150919)
- [CPython issue #151040: test_c_stack_unwind failing on riscv64](https://github.com/python/cpython/issues/151040)
- [EESSI dev.eessi.io-riscv issue #34](https://github.com/EESSI/dev.eessi.io-riscv)