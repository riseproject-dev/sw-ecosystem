---
title: libxslt
categories:
  - libraries
---

# libxslt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libxslt
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libxslt is a C library implementing the XSLT 1.0 stylesheet transformation specification (W3C), built on top of libxml2. It also ships libexslt, which implements the EXSLT extension function set (math, strings, dates, sets, crypto). The companion binary `xsltproc` is the reference command-line XSLT processor. The library is used by system software, document toolchains, and language runtimes (Python bindings via the `lxml` and native `libxslt` Python wrappers) wherever XML stylesheet transformation is needed.

The upstream canonical repository is [gitlab.gnome.org/GNOME/libxslt](https://gitlab.gnome.org/GNOME/libxslt). A read-only GitHub mirror exists at [github.com/GNOME/libxslt](https://github.com/GNOME/libxslt). The project is hosted under the GNOME namespace but operates independently of the GNOME desktop release cycle. The GNOME Foundation provides infrastructure hosting; it does not direct development, fund releases, or have a corporate advisory board governing libxslt specifically.

License: MIT-style permissive. Original copyright: Daniel Veillard, 2001-2002 (individual). libexslt adds Thomas Broyer and Charlie Bozeman as copyright holders (2001-2002, individual). No corporate entity holds the copyright.

**Governance and maintainers:**

- Nick Wellnhofer (nwellnhof, aevum.de, Munich) -- prior maintainer, stepped down March 2025.
- Ivan Chavero (imcsk8, NorTK, Chihuahua, Mexico) -- current maintainer, added August 2025.
- Michael Catanzaro (mcatanzaro, Red Hat / GNOME) -- contributed metadata cleanup June 2025.
- One commit attributed to a contributor identified as "drott," likely Dominik Rottsches (Google Fonts/Chrome) [NEEDS VERIFICATION].
- Xi Ruoyao (xry111) -- test update committed September 2025 via the new maintainer; a community contributor known for RISC-V and loong64 upstream work across multiple projects.
- Apple engineers -- credited in NEWS for fixing CVE-2025-7424 (type confusion in xmlNode.psvi) in v1.1.44.

No single corporate entity sponsors or controls libxslt. Maintainership is volunteer/individual with ad hoc patches from Apple, Google, and Red Hat contributors.

The project is not a member of the [RISE Project](https://riseproject.dev) (RISC-V Software Ecosystem). No RISE RFP references libxslt. None of the 16 published RISE RFPs (RP001-RP016) target XML/XSLT processing.

**Community stance on new ports:** libxslt has no explicit port policy and no architecture tier policy document. As a pure portable C library, it does not require porting work for new architectures. The implicit policy is: if it builds with a standard C compiler, it is supported.

---

## 2. Port History and Upstreaming Timeline

There is no RISC-V port history because no port was necessary. libxslt contains zero architecture-specific code. No RISC-V-specific commits, issues, pull requests, or patches exist in the upstream repository. All 11 independent search vectors (GitHub Issues API, GitHub PR API, GitHub Commits API, GitLab issues, GitLab merge requests, file tree scan, and multiple web searches) returned zero results for "riscv" or "riscv64."

RISC-V support arrived implicitly when Debian brought up its riscv64 port and began building the library from source on riscv64 hardware. No upstream change was required.

| Date | Event | Source |
|------|-------|--------|
| Undated (~2018-2020) | Debian riscv64 port brings up libxslt as part of base system; no patches required | Debian ports archive |
| 2024-06-12 | v1.1.40 released (source-only) | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2024-06-19 | v1.1.41 released | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2024-07-04 | v1.1.42 released | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2025-03-12 | v1.1.43 released | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2025-11-30 | v1.1.45 released (latest) | [gitlab.gnome.org releases](https://gitlab.gnome.org/GNOME/libxslt/-/releases) |
| 2026-03-26 | Debian sid builds libxslt 1.1.45-0.1 on rv-osuosl-04; status "Installed" | [Debian buildd](https://buildd.debian.org/status/package.php?p=libxslt&suite=sid) |

There is no "first riscv64 commit" date in the upstream repository. The library is fully upstream for all architectures by design.

---

## 3. Upstream Support Tier

libxslt has no published tier policy. The CI configuration covers only x86_64 Linux (GCC and Clang with ASan/MSan), Windows (MinGW and MSVC via CMake), and a dist/pages job. There is no arm64, riscv64, or any non-x86 CI job.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Yes (GitLab, GCC+Clang) | No | No |
| Release-blocking tests | Yes | No | No |
| Official prebuilt binaries from upstream | No | No | No |
| Debian package | Yes (1.1.45-0.1) | Yes | Yes (1.1.45-0.1) |
| Ubuntu package | Yes | Yes | Yes (1.1.39 via ports) |
| Arch Linux package | Yes (1.1.45) | Data not available | 1.1.43 [NEEDS VERIFICATION] |

Upstream ships source-only releases for all architectures. No prebuilt binaries are published by the project for any architecture. riscv64 is at parity with arm64 from the upstream's perspective: neither is tested in CI, neither receives prebuilt binaries, and both build cleanly from source.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libxslt is a pure portable C library. There are no architecture-specific subsystems of any kind. The full inventory of architecture-specific code in the repository:

- Assembly files (`.S`, `.s`, `.asm`): 0
- SIMD intrinsics: 0
- JIT compilation: 0 (libxslt has no JIT; it is an interpreter over an XSLT parse tree)
- Cryptographic acceleration: 0 (when crypto is enabled, it delegates entirely to libgcrypt)
- GC barriers or memory model fences: 0
- `#ifdef __riscv` guards: 0
- `arch/riscv/` or similar directory: does not exist

The only architecture-conditional code in the entire repository is a single `configure.ac` block for `alpha*-*-linux*` that adds the `-mieee` flag. No other architecture receives any special handling.

**Component analysis:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| XSLT transformation engine | scalar C | scalar C | scalar C |
| XPath evaluation | scalar C (via libxml2) | scalar C (via libxml2) | scalar C (via libxml2) |
| String processing | scalar C | scalar C | scalar C |
| Number formatting | scalar C | scalar C | scalar C |
| EXSLT math/date/string extensions | scalar C | scalar C | scalar C |
| EXSLT crypto (optional) | via libgcrypt | via libgcrypt | via libgcrypt |
| Profiler | scalar C | scalar C | scalar C |

The designation "scalar C" applies equally to amd64 and riscv64. There is no performance-optimized path for any architecture within libxslt itself. All SIMD-sensitive operations (XML parsing, UTF-8 validation, tree traversal) are handled by libxml2, which is a dependency -- not libxslt code.

**Floating-point and NaN semantics:** libxslt uses standard IEEE 754 double-precision arithmetic for XPath number evaluation. RISC-V mandates IEEE 754-2008 compliance in the D (double-precision) extension. There are no known floating-point correctness issues on riscv64. Open issue #169 (non-IEEE-754 NaN on NetBSD/VAX) is explicitly not applicable to riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

libxslt supports two build systems: Autotools (primary) and CMake (>= 3.18 required). Both are used in the upstream GitLab CI.

**Verified native riscv64 build (Debian sid, 2026-03-26):**

Host: rv-osuosl-04.debian.org (native riscv64, not QEMU emulation)
Compiler: GCC 15.2.0 (package gcc-15 15.2.0-15)
Linker: /usr/bin/riscv64-linux-gnu-ld from binutils 2.46

Exact autotools configure invocation used by Debian:

```
./configure \
  --build=riscv64-linux-gnu \
  --prefix=/usr \
  --libdir=${prefix}/lib/riscv64-linux-gnu \
  --disable-maintainer-mode \
  --disable-dependency-tracking \
  --without-python \
  --with-history \
  --disable-static \
  --with-crypto
```

`configure` confirmed: `checking whether we are cross compiling... no`. No riscv64-specific toolchain file or configure flag is required.

Compiler flags applied on riscv64 (no `-march=rv64gc` or RISC-V-specific flags added by the build system):

```
-Wall -Wextra -Wshadow -Wpointer-arith -Wcast-align -Wwrite-strings
-Waggregate-return -Wstrict-prototypes -Wmissing-prototypes
-Wnested-externs -Winline -Wredundant-decls
-I/usr/include/libxml2 -g -O2 -Werror=implicit-function-declaration
-ffile-prefix-map=... -fstack-protector-strong
-Wformat -Werror=format-security -D_FORTIFY_SOURCE=2
```

**CMake flags used by upstream CI:**

```
cmake \
  -DBUILD_SHARED_LIBS=ON \
  -DCMAKE_INSTALL_PREFIX=libxslt-install \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DCMAKE_C_FLAGS='-Werror' \
  -DLIBXSLT_WITH_CRYPTO=ON \
  -DLIBXSLT_WITH_MODULES=ON \
  -DLIBXSLT_WITH_DEBUG=ON \
  -DLIBXSLT_WITH_DEBUGGER=ON \
  -S . -B libxslt-build
```

For cross-compilation (e.g., building on x86_64 for riscv64), the standard CMake toolchain file pattern applies with `CMAKE_SYSTEM_PROCESSOR=riscv64` and `CMAKE_C_COMPILER=riscv64-linux-gnu-gcc`. No libxslt-specific cross-compilation documentation exists; this is standard CMake cross-compilation with no project-specific obstacles.

**Minimum toolchain requirements:** No minimum GCC version is stated in `configure.ac` or `CMakeLists.txt`. In practice, any C11-capable GCC (GCC 5+) is sufficient. The autoconf prerequisite is `AC_PREREQ(2.63)`.

**QEMU usage:** None. The upstream CI uses x86_64 runners exclusively. Debian builds natively on riscv64 hardware. There is no QEMU-based cross-compilation in any known build pipeline for libxslt.

**CMake build options:**

| Option | Default | Notes |
|--------|---------|-------|
| `LIBXSLT_WITH_CRYPTO` | OFF | Requires libgcrypt >= 1.1.42 |
| `LIBXSLT_WITH_MODULES` | OFF | Plugin extensions; requires shared libs |
| `LIBXSLT_WITH_PYTHON` | ON | Python C extension bindings |
| `LIBXSLT_WITH_THREADS` | ON | POSIX pthreads |
| `LIBXSLT_WITH_PROFILER` | ON | Profiling support |
| `LIBXSLT_WITH_PROGRAMS` | ON | Builds xsltproc binary |
| `LIBXSLT_WITH_DEBUGGER` | OFF | Debugger support |
| `LIBXSLT_WITH_XSLT_DEBUG` | OFF | Debug trace code |
| `LIBXSLT_WITH_TESTS` | ON | Test suite |

**Known build failures on riscv64:** None. No build failure has been reported in any tracked distribution or upstream source.

---

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

**Functional gaps:** None. There are no features that work on amd64 or arm64 that do not work on riscv64.

**Performance gaps:** libxslt itself introduces no architecture-specific performance gap. All transformation operations are scalar C, identical across all architectures. XSLT processing performance on riscv64 relative to amd64 is determined entirely by CPU microarchitecture (IPC, memory bandwidth, clock frequency) and the performance of libxml2 on riscv64, not by any libxslt-internal gap. No published benchmarks comparing libxslt throughput across architectures exist.

**Security hardening:** The Debian riscv64 build enables `-fstack-protector-strong`, `-D_FORTIFY_SOURCE=2`, `-Wformat`, and `-Werror=format-security`. These are identical to the flags applied on amd64. No hardening gap exists.

**Floating-point correctness:** IEEE 754 compliance on riscv64 (D extension) is equivalent to amd64 and arm64. NaN propagation, infinity handling, and rounding modes are correct on riscv64. Issue #169 (NaN undefined on non-IEEE platforms) does not apply.

---

## 7. CI/CD Infrastructure

**Result: no upstream riscv64 CI exists.**

The `.github/` directory does not exist in the GNOME/libxslt repository (GitHub REST API returns HTTP 404 for `/repos/GNOME/libxslt/contents/.github`). There are zero GitHub Actions workflows.

The upstream CI is entirely GitLab-based. The `.gitlab-ci.yml` (283 lines) defines the following jobs:

| Job | OS | Compiler | Architecture |
|-----|----|----------|--------------|
| gcc | Linux | GCC | x86_64 |
| clang-asan | Linux | Clang + ASan | x86_64 |
| clang-msan | Linux | Clang + MSan | x86_64 |
| cmake-linux | Linux | CMake | x86_64 |
| cmake-mingw | Windows | MinGW | x86_64 |
| cmake-msvc | Windows | MSVC | x86_64 |
| dist | Linux | GCC | x86_64 |
| pages | Linux | - | x86_64 |

Zero lines in `.gitlab-ci.yml` contain "riscv" (case-insensitive). There is no riscv64 runner, no QEMU cross-compilation job, and no architecture matrix.

| CI attribute | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Upstream CI job | Yes | No | No |
| Sanitizer builds | Yes (ASan, MSan) | No | No |
| Windows cross-build | Yes | No | No |
| RISE runner | No | No | No |
| Distribution CI | Debian (native) | Debian (native) | Debian (native, rv-osuosl-04) |

riscv64 is tested only within Debian's own build infrastructure. The Debian buildd at rv-osuosl-04 is a real riscv64 machine (not emulation) and runs the full build and install verification. This is downstream CI, not upstream.

---

## 8. Distribution and Release Status

**Upstream releases:** libxslt publishes source-only archives. No prebuilt binaries for any architecture are shipped by upstream. The five most recent releases are:

| Tag | Date | Assets |
|-----|------|--------|
| v1.1.45 | 2025-11-30 | Source archives (.zip, .tar.gz, .tar.bz2, .tar) |
| v1.1.43 | 2025-03-12 | Source archives + official .tar.xz |
| v1.1.42 | 2024-07-04 | Source archives + official .tar.xz |
| v1.1.41 | 2024-06-19 | Source archives + official .tar.xz |
| v1.1.40 | 2024-06-12 | Source archives + official .tar.xz |

No asset filename contains "riscv64" or "riscv."

**PyPI:** The package `libxslt` does not exist on PyPI (HTTP 404). Not a Python package. No riscv64 wheel exists or is applicable. (Note: `lxml` is a separate Python package that bundles libxslt at build time; lxml riscv64 wheel availability is a separate question not covered by this report.)

**RISE wheel builder:** Not applicable. libxslt is not a Python package. The RISE wheel builder index at `gitlab.com` redirects libxslt queries to PyPI, which returns 404.

**Distribution packages:**

| Distribution | Package | Version | riscv64 Status | Build node |
|-------------|---------|---------|----------------|------------|
| Debian sid | libxslt1.1 | 1.1.45-0.1 | Installed (built successfully) | rv-osuosl-04 |
| Debian sid | libxslt1-dev | 1.1.45-0.1 | Installed | rv-osuosl-04 |
| Ubuntu 24.04 (Noble) | libxslt1.1 | 1.1.39-0exp1build1 | Available via ports | ports.ubuntu.com |
| Ubuntu 24.04 (Noble) | libxslt1-dev | 1.1.39-0exp1build1 | Available via ports | ports.ubuntu.com |
| Arch Linux RISC-V | libxslt | 1.1.43 | Available (Repology) [NEEDS VERIFICATION] | archriscv.felixc.at |

The Debian riscv64 binary package `libxslt1.1` is 159 KB and available for direct download. The libc6 floor on riscv64 is >= 2.42 (vs >= 2.38 on most other architectures), which is a Debian packaging detail, not a libxslt-specific requirement.

**What a user must do to get a working riscv64 binary:**

On Debian sid: `apt install libxslt1.1 libxslt1-dev` -- no compilation required, current version (1.1.45).

On Ubuntu 24.04 (ports): `apt install libxslt1.1` -- available at version 1.1.39 (two minor versions behind upstream). Users requiring 1.1.45 must build from source.

From source on any riscv64 Linux system: standard `./configure && make && make install` with no special flags. GCC 5+ is sufficient.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|-----------|------|---------------|--------------|-----------------|-------|
| libxml2 | Required. XML parsing and XPath. | Clean (Debian sid v2.15.3+dfsg-1, "Installed") | No upstream riscv64 CI | Current via Debian/Ubuntu/Fedora/Arch | Open issue #971: double-checked locking unsafe on weakly-ordered arches including riscv64. Non-blocking for most use cases. |
| libgcrypt | Optional (EXSLT crypto, off by default). | Clean (Debian sid v1.12.2-1, "Installed") | No upstream CI for any arch | Current; v1.12.0 ships AES Zvkned, SHA-256/512 Zvknhb, ChaCha20 RVV | Bignum (mpi/) has no riscv64 assembly; RSA/ECDSA key ops are generic C. Performance gap, not correctness issue. |
| Python (CPython) | Optional (off in Debian build). C extension bindings. | Clean (Debian sid v3.13.14-1, "Installed") | No upstream riscv64 CI | Available via Debian; no manylinux riscv64 wheels on PyPI | No JIT backend on riscv64. Stack unwinding broken in CPython 3.15 betas (active issue). Not blocking for libxslt C core. |
| libm (glibc) | Required on UNIX. Standard math functions. | Full | Tested as part of glibc | Current | No issues. |
| pthreads (glibc/NPTL) | Required (LIBXSLT_WITH_THREADS=ON, default). Thread-safe stylesheet contexts. | Full | Tested as part of glibc | Current | No issues. |
| libdl | Optional (LIBXSLT_WITH_MODULES=ON, off by default). Plugin loading. | Full | Tested as part of glibc | Current | No issues. |

**libxml2 detail (critical dependency):**

libxml2 is the only required non-system dependency. Issue #971 (opened 2025-08-13, open as of report date) identifies that double-checked locking in the catalog resolution code uses relaxed C11 atomics that are unsafe on weakly-ordered memory architectures, including riscv64. For normal XSLT processing that does not use XML catalogs in a multithreaded context, this is not a correctness risk. For applications that do multithreaded catalog resolution, this is a potential data race. The fix had not landed as of the report date. See `reports/libxml2.md` in this repository for the full analysis.

**libgcrypt detail (optional crypto dependency):**

libgcrypt 1.12.0 (released 2026-01-29) introduced riscv64-accelerated paths: AES via Zvkned, SHA-256/SHA-512 via Zvknhb, GCM via Zvkg, ChaCha20 via RVV, and GHASH via Zbb+Zbc. These cover all hash functions used by EXSLT crypto extensions (MD5, SHA-1, SHA-256). The performance gap for riscv64 vs amd64/arm64 on RSA/ECDSA key operations (mpi/ bignum, generic C on riscv64) is irrelevant to XSLT use cases because EXSLT crypto only uses symmetric hash functions, not asymmetric key operations. See `reports/libgcrypt.md` for the full analysis.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | RISC-V relevance |
|----|-------|--------|----------|-----------------|
| #169 | libexslt cannot be built on NetBSD/VAX (NAN undefined) | Open | Low | Not applicable. riscv64 uses IEEE 754 with `NAN` defined. |
| #24 | xsltproc performance with large text output | Open | Low | Architecture-agnostic. String concatenation overhead in xmlStrlen/xmlStrncat affects all platforms equally. |
| libxml2 #971 | Double-checked locking unsafe on weakly-ordered arches (riscv64, arm) | Open | Medium (multithreaded catalog use only) | Affects riscv64 via libxml2 dependency. Not a libxslt bug. |

**Correctness bugs specific to riscv64 in libxslt:** None found.

**Performance bugs specific to riscv64 in libxslt:** None found.

One environment issue was found in an external project: EESSI/dev.eessi.io-riscv issue #34 (open), where `lxml` failed to build on a BSC HCA RISC-V cluster because `libxslt-dev` was not installed on batch nodes. This is a packaging/environment gap, not a libxslt bug.

---

## 12. Objections and Upstream Blockers

There are no objections, technical blockers, or organizational blockers to riscv64 support in libxslt. The project has no architecture tier policy that would need updating, no porting work to accept, and no maintainer statements opposing riscv64 support.

The only upstream gap -- absence of riscv64 in CI -- is not a blocker for deployment. Debian's riscv64 buildd serves as a functional substitute for riscv64 integration testing.

Adding a riscv64 CI job to `.gitlab-ci.yml` would require either a GNOME GitLab riscv64 runner or a QEMU-based cross-compilation job. Neither is currently present for any non-x86 architecture. A patch to add a QEMU riscv64 job would face no principled objections given the maintainers' track record of accepting community patches, but no such patch has been proposed or discussed.

---

## 13. Investment Analysis

**RISE pre-coverage:** No RISE RFP covers libxslt. No RISE-funded work has been done on libxslt. All investment sizing below reflects uncovered work.

### 13.1 Functional Enablement

No functional enablement work is needed. libxslt is fully functional on riscv64 today. Debian sid ships the current upstream release (1.1.45-0.1) built natively on riscv64 hardware.

### 13.2 Performance Optimization

libxslt contains no architecture-specific code paths and no SIMD or JIT for any architecture. Performance on riscv64 is determined by libxml2 (handled separately) and CPU microarchitecture. There is no libxslt-internal optimization work to fund for riscv64 because there is no optimization work for any architecture; the library is scalar C throughout. Any XSLT throughput improvement on riscv64 would require work in libxml2 (string/UTF-8 processing), not in libxslt.

### 13.3 CI/CD Infrastructure

The only gap is absence of upstream riscv64 CI. A riscv64 CI job could be added to `.gitlab-ci.yml` using QEMU user-mode emulation. Estimated effort: 1 person-week (write job, test locally, submit MR, respond to review). Acceptance probability is high given the straightforward nature of the change. Value is low-to-medium: the library already builds correctly on riscv64, so CI would primarily catch future regressions.

### 13.4 Ecosystem Enablement

Not applicable. libxslt has no dependent package ecosystem that requires independent enablement for riscv64. The `lxml` Python package (which embeds libxslt) is a separate project; riscv64 wheel availability for lxml is tracked under the Python ecosystem, not here.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | None required | 0 | - | - |
| Performance | None in libxslt scope; libxml2 UTF-8/string SIMD is the relevant target | 0 | - | - |
| CI/CD | Add riscv64 QEMU job to .gitlab-ci.yml | 1 | Community / Qualcomm | Low |
| Ecosystem | None (no package ecosystem) | 0 | - | - |
| Dependency: libxml2 #971 | Fix double-checked locking for weakly-ordered arches | 2-3 (in libxml2, not here) | libxml2 maintainer / contributor | Medium (for multithreaded catalog use) |

**Total libxslt-specific investment required: 1 person-week (optional CI only).**

The library is production-ready on riscv64 today with no investment. The CI gap is a quality-of-life improvement for future regression detection, not a prerequisite for deployment.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libxslt GitLab repository (canonical)](https://gitlab.gnome.org/GNOME/libxslt)
- [libxslt GitHub mirror](https://github.com/GNOME/libxslt)
- [libxslt GitLab releases API](https://gitlab.gnome.org/api/v4/projects/GNOME%2Flibxslt/releases?per_page=5)
- [Debian buildd status for libxslt (sid)](https://buildd.debian.org/status/package.php?p=libxslt&suite=sid)
- [Debian sid riscv64 package: libxslt1.1](https://packages.debian.org/sid/riscv64/libxslt1.1/download)
- [Ubuntu 24.04 libxslt package search](https://packages.ubuntu.com/search?keywords=libxslt&suite=noble&searchon=names&section=all)
- [Repology: libxslt packages](https://repology.org/project/libxslt/packages)
- [RISE Project RFP index](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [libxslt .gitlab-ci.yml (via GitHub mirror)](https://github.com/GNOME/libxslt/blob/master/.gitlab-ci.yml)
- [libxslt .gitlab-ci/test_cmake.sh (via GitHub mirror)](https://github.com/GNOME/libxslt/blob/master/.gitlab-ci/test_cmake.sh)
- [libxslt issue #169: NAN undefined on NetBSD/VAX](https://gitlab.gnome.org/GNOME/libxslt/-/issues/169)
- [libxslt issue #24: xsltproc performance with large text output](https://gitlab.gnome.org/GNOME/libxslt/-/issues/24)
- [libxml2 issue #971: double-checked locking on weakly-ordered arches](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971)
- [libraries/libxml2](./libraries/libxml2.md)
- [libraries/libgcrypt](./libraries/libgcrypt.md)
- [runtimes/python](./runtimes/python.md)