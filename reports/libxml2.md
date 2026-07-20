---
title: libxml2
categories:
  - libraries
---

# libxml2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libxml2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libxml2 is a C XML parsing and manipulation library. It implements XML 1.0, HTML 4/5 parsing, XPath 1.0, XPointer, XInclude, XML Schemas, and RelaxNG. It is the de facto XML library on Linux and macOS, used by GNOME, Python (via lxml), PHP, Ruby (via nokogiri), and thousands of other projects. The library is written in portable C89/C11 with no architecture-specific SIMD, assembly, or JIT components.

**Governance:** libxml2 is hosted in the GNOME GitLab organization at [gitlab.gnome.org/GNOME/libxml2](https://gitlab.gnome.org/GNOME/libxml2). It is not an official GNOME project in a governed sense -- the project README explicitly calls it "open-source software written by hobbyists and maintained by volunteers." There is no formal foundation, no steering committee, and no platform support tier policy.

**License:** MIT.

**Corporate maintainers (from commit history):**

- Nick Wellnhofer (nwellnhof) -- 2,862 commits, dominant historical maintainer. Employed by/founder of aevum GmbH (Munich). Has launched a commercial fork "libxml2 Enterprise Edition" (AGPL + commercial dual license) with SIMD acceleration and security hardening, and appears to have stepped back from upstream [NEEDS VERIFICATION].
- Daniel Garcia (danigm) -- current most active committer. Employed by SUSE.
- Daniel Veillard (veillard) -- original author, 399 commits. Red Hat employee historically.

**Community stance on new ports:** The project has no documented concept of supported vs. unsupported architectures. It targets standard C and relies on toolchains and distributions to handle architecture support. There is no process for requesting a new port because no such process is necessary -- libxml2 compiles on riscv64 without any project-level change. The project enforces a strict no-AI/LLM policy (prohibits LLM-generated issues, patches, or comments).

**RISE Project involvement:** libxml2 has no documented involvement with the RISE Project. All 27 RISE blog posts (May 2024 through June 2026) were checked -- none mention libxml2. libxml2 does not appear in the RISE wheel builder package list. GNOME is not a RISE member organization.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 1998 | libxml2 created by Daniel Veillard in portable C; no arch-specific code from the start | [gitlab.gnome.org/GNOME/libxml2](https://gitlab.gnome.org/GNOME/libxml2) commit history |
| Undated | Debian/Ubuntu ports build libxml2 for riscv64 without any upstream patch; first RISC-V build date not recorded in public tracker | [Debian buildd](https://buildd.debian.org/status/package.php?p=libxml2&suite=sid) |
| 2025-05-04 | Issue #904: libxml2 2.14.2 breaks librsvg tests specifically on riscv64 -- only known architecture-specific incident; closed 2025-05-07 | [GitLab issue #904](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/904) |
| 2025-08-13 | Issue #971 opened: catalog code uses double-checked locking patterns unsafe on weakly-ordered architectures including riscv64 | [GitLab issue #971](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971) |
| 2026-06-05 | Debian sid libxml2 2.15.3+dfsg-1 built successfully on rv-osuosl-02 for riscv64, status "Installed" | [Debian buildd sid](https://buildd.debian.org/status/package.php?p=libxml2&suite=sid) |

There is no "first RISC-V specific commit" because the project never required one. The library compiled on riscv64 without modification from the first time a RISC-V toolchain attempted it.

**Key contributors to riscv64 enablement:** None -- riscv64 support was implicit. Levi Zim (kxxt, Arch Linux RISC-V porter) is the only person who has filed a riscv64-specific issue (#904).

---

## 3. Upstream Support Tier

libxml2 has no formal tier policy. The project does not distinguish between architectures in any document, CI configuration, or release process.

**Practical tier assessment derived from CI and release evidence:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI coverage | Yes (GitLab CI, all jobs) | No | No |
| Release-blocking tests | Yes (CI is gating) | No | No |
| Official upstream binaries | No (source tarballs only) | No | No |
| Distro binary packages | Yes | Yes | Yes |
| Distro build status | Current | Current | Current |

amd64 is the only architecture with upstream CI. arm64 and riscv64 are in the same position: both receive distribution-level builds without upstream project involvement.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libxml2 has no architecture-specific subsystems of any kind. The complete source tree was checked: no `arch/`, `simd/`, `x86/`, `arm/`, or `riscv/` directories exist. The only non-portable directory is `win32/`, which contains Windows DLL export definitions (OS-level, not CPU-level).

**Architecture-specific file inventory:**

| Architecture | Dedicated source files | SIMD intrinsics | Arch-guarded code paths |
|---|---|---|---|
| x86 / x86_64 | 0 | 0 | 0 |
| AArch64 / ARM | 0 | 0 | 0 |
| riscv64 | 0 | 0 | 0 |
| Other | 0 | 0 | 0 |

The only architecture-sensitive items in the entire codebase are:
- `configure.ac`: Alpha (`alpha*`) receives `-mieee` compiler flag for IEEE float handling -- a compiler flag, not a source branch.
- `configure.ac`: HP-UX (`hppa*`) receives a preprocessor limit flag.
- `encoding.c`: portable runtime endianness detection (no arch guards).
- `parser.c`: z/OS EBCDIC `#pragma convert` (IBM mainframe only).

**Component quality matrix:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| XML parsing core | scalar C | scalar C | scalar C |
| String operations | scalar C | scalar C | scalar C |
| Encoding/conversion | scalar C | scalar C | scalar C |
| Hash / dict | scalar C | scalar C | scalar C |
| Buffer management | scalar C | scalar C | scalar C |
| XPath / XPointer | scalar C | scalar C | scalar C |
| XSD / RelaxNG | scalar C | scalar C | scalar C |

riscv64 is not disadvantaged relative to amd64 or arm64 because no architecture receives any SIMD or hand-tuned implementation. The scalar C code is the complete and only implementation.

Nick Wellnhofer's commercial fork "libxml2 Enterprise Edition" reportedly adds SIMD acceleration, but this is not upstreamed and is not available in the open-source library.

---

## 5. Build System, Cross-Compilation, and Toolchain

libxml2 supports GNU Autotools, CMake, and Meson. The maintainers describe CMake as "mainly for Windows." All three produce the same binary.

No riscv64-specific toolchain file, Dockerfile, or cross-compilation guide exists in the repository. The string "riscv" does not appear in any tracked file.

**Native riscv64 build (Autotools) -- commands derived from Debian sid build:**

```sh
./configure \
    --build=riscv64-linux-gnu \
    --prefix=/usr \
    --with-python=no \
    --enable-static \
    --with-http \
    --with-schematron \
    --with-legacy \
    --with-zlib \
    --with-lzma \
    CFLAGS="-O2 -g"

make -j$(nproc)
make check
```

**Cross-compilation from x86_64 (Autotools):**

```sh
./configure \
    --build=x86_64-linux-gnu \
    --host=riscv64-linux-gnu \
    --prefix=/usr \
    --with-python=no \
    --with-iconv \
    --with-zlib \
    --without-modules \
    CC=riscv64-linux-gnu-gcc \
    AR=riscv64-linux-gnu-ar \
    RANLIB=riscv64-linux-gnu-ranlib \
    CFLAGS="-O2"
```

**Flags to disable for cross-compilation:**

| Flag | Reason |
|---|---|
| `--without-modules` / `-DLIBXML2_WITH_MODULES=OFF` | dlopen probing fails without a target sysroot; link detection breaks at cross-configure time |
| `--without-python` / `-DLIBXML2_WITH_PYTHON=OFF` | Python interpreter must be the target's Python; host Python cannot substitute |
| `--without-history` / `-DLIBXML2_WITH_READLINE=OFF` | readline/history detection requires binary execution; fails in strict cross mode |

All other features (iconv, zlib, lzma, threads, all XML features) are purely compile-time checks and work without QEMU.

**Toolchain minimums:** No riscv64-specific minimum is documented. CMakeLists.txt requires cmake >= 3.18 and sets `CMAKE_C_STANDARD 11`. The Debian sid build used GCC 15.2.0. Practically, GCC 7+ (C11 support) is sufficient.

**QEMU:** The Debian sid riscv64 build was a native build on `rv-osuosl-02.debian.org` (not QEMU-emulated). For cross-compilation testing from x86_64, `qemu-riscv64-static` works; the test suite is entirely userspace with no kernel requirements.

**Known build failures:** None documented for riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. libxml2 has no architecture-conditional feature flags. Every XML feature (XPath, XPointer, XSD, RelaxNG, HTML parser, catalog, namespace handling) compiles and runs identically on riscv64.

**Performance gaps:** libxml2 has no SIMD acceleration on any architecture in the upstream source. The commercial fork by Nick Wellnhofer reportedly adds SIMD, but it is not open-source. Performance on riscv64 vs amd64 or arm64 is determined entirely by microarchitecture (instruction throughput, cache behavior), not by any code difference in libxml2 itself.

The only available benchmark data is from MR !95 (closed without merging, 2020-12-29), measuring `xmlStrlen` on x86_64:
- `xmlStrlen` vs glibc `strlen` on an entire HTML file: 25.09x slower
- On average-sized strings: 9.91x slower
- On large strings: 30.32x slower
- End-to-end parsing speedup from the proposed patch (not merged): ~12% (67,855 ms to 59,767 ms)

No riscv64-specific benchmark data exists in any public source.

**Security hardening gaps:** None specific to riscv64. Clang ASAN/MSAN CI runs only on x86_64. The same sanitizer gap applies to arm64.

**Floating-point / NaN semantics:** The Alpha-specific `-mieee` flag in `configure.ac` confirms the codebase is aware of IEEE floating-point edge cases on some architectures. RISC-V mandates IEEE 754 compliance. No libxml2-level floating-point issue specific to riscv64 is documented.

---

## 7. CI/CD Infrastructure

**Summary:** libxml2 has no riscv64 CI of any kind.

The official CI is GitLab-based (`.gitlab-ci.yml`). There is no `.github/workflows/` directory in the repository (confirmed by HTTP 404 on the GitHub API path). No `.cirrus.yml` or `Jenkinsfile` exists.

The complete CI matrix:

| Job class | Architecture | OS | Toolchain |
|---|---|---|---|
| GCC variants (C89, minimum, medium, legacy, static) | x86_64 | Ubuntu 26.04 | GCC |
| Clang ASAN / MSAN | x86_64 | Ubuntu 26.04 | Clang |
| MinGW Windows | i686, x86_64 | Wine / Ubuntu | MinGW |
| CMake Linux | x86_64 | Ubuntu 26.04 | GCC, Clang |
| CMake Windows | x86_64 | MSVC | MSVC v141 |
| Meson | x86_64 | Ubuntu 26.04 | GCC |
| Downstream integration (lxml, nokogiri, php) | x86_64 | Ubuntu 26.04 | GCC |

**Comparison:**

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI jobs | Yes (all jobs) | No | No |
| RISE CI runners | No | No | No |
| Hardware runners | Yes (GitLab.com shared) | No | No |
| Release-blocking | Yes | No | No |

riscv64 CI coverage is identical to arm64 coverage: zero. Both architectures are validated only through distribution package builds.

---

## 8. Distribution and Release Status

libxml2 upstream does not publish binary releases. All official releases are source tarballs at [download.gnome.org/sources/libxml2/](https://download.gnome.org/sources/libxml2/). The latest release series is 2.14, with the most recent release being 2.14.6.

**riscv64 binary package status:**

| Distribution | Package | Version | Status | Notes |
|---|---|---|---|---|
| Debian sid | libxml2, libxml2-dev, libxml2-utils, python3-libxml2 | 2.15.3+dfsg-1 | Installed (built on rv-osuosl-02, 2026-06-05) | No architecture-specific patches applied |
| Ubuntu 24.04 (Noble) | libxml2, libxml2-dev, libxml2-utils, python3-libxml2 | 2.9.14+dfsg-1.3ubuntu3 | Available (ports channel) | Security patch revision behind amd64 (see Section 11) |
| Arch Linux RISC-V | libxml2 | 2.15.3-1 | Available in [core] (pkg: libxml2-2.15.3-1-riscv64.pkg.tar.zst, SHA256 885e8502...) | Also: libxml2-docs-2.15.3-1 and libxml2-legacy-2.13.9-2 in [extra] |

**What a user must do to get a working binary:** `apt install libxml2-dev` on Debian/Ubuntu riscv64 or `pacman -S libxml2` on Arch RISC-V. No source build required.

**Python bindings (lxml):** The `lxml` package on PyPI (the primary Python consumer of libxml2) publishes 14 riscv64 wheels for CPython 3.9 through 3.14 on manylinux and musllinux platforms (`lxml-6.1.1-cpXXX-cpXXX-manylinux_2_38_riscv64.whl` and `musllinux_1_2_riscv64.whl`). Note: the PyPI package is named `lxml`, not `libxml2`; no package named `libxml2` exists on PyPI.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| zlib | Compressed XML stream support | Pass (Debian sid 1:1.3.dfsg+really1.3.2-3, built on rv-manda-03) | Distro-level only | All major distros | None open |
| zlib-ng (optional replacement) | Drop-in zlib with RVV SIMD | Pass under QEMU in upstream CI | Emulated only; reduced corpus | Available | RVV hwcap detection unsafe on Linux <6.5 (crash risk) |
| ICU / icu4c | Unicode charset conversion | Pass (Debian sid 78.3-2, built on rv-manda-02) | Distro-level only | Debian sid riscv64 | None; ICU has no RISC-V SIMD (generic C only) |
| libiconv / glibc iconv | Character encoding fallback | Pass (part of glibc riscv64) | Part of glibc test suite | All riscv64 distros | None |
| readline | Interactive xmllint shell (optional) | Pass (Debian sid 8.3-4, built on rv-osuosl-02, ~131 days ago) | Distro-level only | All major distros | None |
| pthreads (glibc) | Thread-safe XML parsing | Pass (part of glibc) | Part of glibc test suite | All riscv64 distros | None -- though see Issue #971 (Section 11) |
| libdl (glibc) | Dynamic module loading | Pass (part of glibc) | Part of glibc test suite | All riscv64 distros | None |
| libm (glibc) | Math library | Pass (glibc supports riscv64 soft-float and hard-float ABIs) | Part of glibc test suite | All riscv64 distros | None |
| Python3 / python3-dev | Python bindings | Pass (python3-libxml2 2.15.3+dfsg-1 in Debian sid riscv64) | Distro-level only | Debian sid riscv64 | None |

**Deeper note on zlib-ng:** zlib-ng implements RVV (RISC-V Vector) acceleration for hash and inflate operations. The RVV code requires Linux kernel >= 6.5 for safe runtime hardware capability detection via `hwcap`. On kernels below 6.5, the compile-time code path can cause SIGILL crashes on hardware without RVV. This is not a libxml2 issue -- libxml2 links against whatever zlib implementation the system provides -- but any deployment using zlib-ng on riscv64 with kernel < 6.5 is at risk. Deployments using standard zlib (not zlib-ng) are unaffected.

No other dependency has riscv64-specific SIMD code that introduces a correctness or safety concern.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | RISC-V relevance |
|---|---|---|---|---|
| [#971](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971) | Catalog code is not thread-safe on weakly-ordered architectures | Open (opened 2025-08-13) | Correctness -- data race / undefined behavior | Directly affects riscv64: RISC-V has a weak memory model. Multi-threaded applications using XML catalogs may read uninitialized data silently. |
| [#904](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/904) | libxml2 2.14.2 breaks librsvg tests specifically on riscv64 | Closed (2025-05-04 to 2025-05-07) | Architecture-specific rendering regression | Root cause not explicitly documented in the issue; closed after 3 days, suggesting the problem was traced to librsvg or the rendering pipeline rather than libxml2. |

**Correctness bugs for riscv64:**

Issue #971 is the critical item. The double-checked locking pattern used in `catalog.c` is:
```c
if (!xmlCatalogInitialized) xmlInitializeCatalog();
if (catal->children == NULL) xmlFetchXMLCatalogFile(catal);
```
This is only safe on strongly-ordered architectures (x86). On riscv64 (and ARM, POWER), concurrent readers and writers to the global catalog in `xmlLoadCatalog` or `xmlCatalogAdd` can produce torn reads. The proposed fixes are: R/W locks (`pthread_rwlock` / SRW on Windows), C11 atomics, or removing the double-check entirely. The issue was open as of 2025-08-16 with no assigned fix.

**Ubuntu 24.04 security patch gap:** Ubuntu 24.04 riscv64 carries libxml2 at patch revision `2.9.14+dfsg-1.3ubuntu3` while amd64/i386 carry `2.9.14+dfsg-1.3ubuntu3.8`. The riscv64 port has not received the security updates applied to primary architectures. This is a distribution-level issue, not an upstream libxml2 issue, but it represents a concrete security exposure for riscv64 Ubuntu deployments [NEEDS VERIFICATION -- the specific CVEs addressed in the .8 revision were not enumerated in the research findings].

**Total open riscv64 issues in Debian tracker for libxml2:** Zero. The Debian tracker shows 26 open bugs for libxml2, none architecture-specific to riscv64.

---

## 12. Objections and Upstream Blockers

No upstream objections to riscv64 support are documented. The project has no acceptance barrier for new architectures because it makes no architecture-specific commitments.

**Practical blockers:**

1. **No upstream riscv64 CI.** The project does not gate releases on any riscv64 test results. A regression introduced in a release would only be caught by distribution build CI (Debian, Fedora, etc.), potentially with a lag.

2. **Issue #971 (thread safety on weak-memory architectures) is open.** This is a latent correctness bug that affects any riscv64 deployment using XML catalogs in a multi-threaded context. No assignee, no patch, no timeline as of the research date.

3. **No SIMD path for riscv64 in the open-source library.** The commercial libxml2 Enterprise Edition fork reportedly adds SIMD. If that work is not upstreamed, riscv64 (and all other architectures) remain on scalar C indefinitely.

4. **Accepting patches from AI tools is explicitly prohibited.** The project's no-AI/LLM policy means any AI-assisted contribution pipeline is blocked at the contribution level.

---

## 13. Investment Analysis

RISE has no documented involvement with libxml2. All items below are unaddressed gaps.

### 13.1 Functional Enablement

libxml2 is fully functional on riscv64. No functional work is needed. The only functional correctness item is Issue #971.

### 13.2 Performance Optimization

libxml2 has no SIMD implementation on any architecture in the open-source library. The commercial fork by Nick Wellnhofer reportedly adds SIMD (details and ISA coverage not available in the research findings). Implementing RVV-accelerated string scanning, encoding detection, or XML tokenization would address the performance gap but requires upstream agreement from the current maintainers (SUSE / aevum). Given the project's hobbyist governance model and the existence of a competing commercial implementation, upstream acceptance probability is uncertain.

No riscv64-specific benchmark data exists to quantify the performance gap. Any sizing of SIMD work would require benchmarking first.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to the upstream GitLab pipeline would require a self-hosted GitLab runner on riscv64 hardware. The project uses `.gitlab-ci.yml` exclusively; GitHub Actions is not in scope.

### 13.4 Ecosystem Enablement

The `lxml` Python package already ships 14 riscv64 wheels on PyPI. No ecosystem enablement work is needed for Python. Other libxml2 consumers (nokogiri, php) are tested as downstream jobs in the upstream CI (on x86_64 only) -- adding riscv64 downstream integration tests is a CI infrastructure item.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix Issue #971 (double-checked locking / weak-memory catalog race) | 1-2 | RISC-V ecosystem engineer | High |
| CI/CD | Add riscv64 GitLab CI runner and job to .gitlab-ci.yml | 2-3 | Infrastructure + upstream coordination | Medium |
| Performance | Benchmark libxml2 XML parsing throughput on riscv64 vs arm64 and amd64 | 1 | Performance engineer | Medium |
| Performance | Implement RVV-accelerated string scanning / tokenizer (after benchmarking confirms gap) | 4-8 | RISC-V SIMD engineer | Low (upstream acceptance uncertain) |
| Distribution | Investigate and close Ubuntu 24.04 riscv64 security patch gap (lagging .3 vs .8) | 1 | Canonical / Ubuntu porter | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libxml2 GitLab upstream](https://gitlab.gnome.org/GNOME/libxml2)
- [libxml2 GitHub mirror](https://github.com/GNOME/libxml2)
- [libxml2 source releases](https://download.gnome.org/sources/libxml2/)
- [GitLab issue #971 -- catalog thread safety on weak-memory architectures](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971)
- [GitLab issue #904 -- 2.14.2 breaks librsvg tests on riscv64](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/904)
- [GitLab MR !95 -- xmlStrlen performance benchmark (closed, not merged)](https://gitlab.gnome.org/GNOME/libxml2/-/merge_requests/95)
- [Debian buildd libxml2 sid status](https://buildd.debian.org/status/package.php?p=libxml2&suite=sid)
- [Ubuntu 24.04 libxml2 package page](https://packages.ubuntu.com/noble/libxml2)
- [Arch RISC-V mirror -- ISCAS](https://mirror.iscas.ac.cn/archriscv/repo/core/)
- [lxml PyPI package (Python bindings)](https://pypi.org/project/lxml/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [libxml2 .gitlab-ci.yml](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/.gitlab-ci.yml)
- [libxml2 CMakeLists.txt](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/CMakeLists.txt)
- [libxml2 meson.build](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/meson.build)
- [libxml2 configure.ac](https://gitlab.gnome.org/GNOME/libxml2/-/blob/master/configure.ac)