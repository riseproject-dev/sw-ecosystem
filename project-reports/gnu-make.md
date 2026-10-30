---
title: GNU make
parent: Project Reports
color: orange
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GNU Guile
    relation: runtime-dependency
    criticality: optional
  - name: pkg-config
    relation: build-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: Perl
    relation: test-dependency
    criticality: critical
  - name: gettext
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="gnu-make" %}

# GNU make

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** orange (downstream-only), release provider: distro<br/>
**Scope:** RISC-V (riscv64/linux) support status for GNU make<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GNU make is a build automation tool written in portable C. It uses autoconf and vendored gnulib code (`gl/`). The tree holds `src`, `gl`, `doc`, `tests`, `scripts`, `mk`, `po` and the build and bootstrap files. It has no `arch/` directory. Upstream source: [make.git on Savannah](https://git.savannah.gnu.org/cgit/make.git/). Homepage: [GNU make](https://www.gnu.org/software/make/).

- **Governance:** GNU make is a GNU package. Copyright is held by the Free Software Foundation (`Copyright (C) 1988-2025 Free Software Foundation, Inc.` in the source headers). Development is by individual volunteers. `AUTHORS` credits Paul D. Smith (development from 3.76), Dmitry Goncharov (from 4.3) and Boris Kolpackov (from 3.81). The newest commit in the Savannah clone (2026-04-29) is by Eli Zaretskii. No corporate maintainers were found. Bug reports go to bug-make@gnu.org (`configure.ac`). No MAINTAINERS file exists in the tree.
- **Licence:** GPL-3.0-or-later. `COPYING` is GPLv3, and the source headers say "either version 3 of the License, or (at your option) any later version".
- **Development model:** Development happens on Savannah. Patches go through the bug-make mailing list and the Savannah bug tracker, not through GitHub pull requests. A pull request search in the [GitHub mirror](https://github.com/mirror/make) for "riscv64 make" returned 0 results.
- **Corporate sponsors:** None found.
- **RISE membership:** GNU make and the FSF are not listed on the [RISE members page](https://riseproject.dev/members/).
- **Community stance on new ports:** Data not available. No RISC-V-specific governance, tier policy or port discussion was found. A web search for make maintainer governance returned results only for binutils, GCC, DPDK and coreboot.
- **Dependents:** Existing reports in the `sw-ecosystem` repository reference GNU make in 80 places. For example, the glibc report lists it as a critical build dependency [NEEDS VERIFICATION: local repository only, not independently checked].

## 2. Port History and Upstreaming Timeline

No RISC-V port exists as a distinct body of work. A full clone of `git.savannah.gnu.org/git/make.git` (3184 commits, latest dated 2026-04-29, HEAD `b380278` "[SV 64806] Fix MS-specific format specifier") was searched directly:

- `git log -i -E --grep='risc-?v|rv64|riscv64'` returned 0 commits.
- `git log -G'risc-?v|rv64'` and `-S'riscv'` returned nothing.
- `git grep -i 'risc-\?v'` over every tracked file returned nothing.
- The only "risc" commit message is `c6ac5807` (2015-06-14), "job.c [RISCOS]: Remove logic that is no longer required". That is RISC OS, not RISC-V.

A shallow clone of the GitHub mirror (HEAD `c63a5bc`, dated 2024-08-04) gave the same result.

| Date | Event | Source |
|---|---|---|
| 2022-11-20 | Gentoo bug 882069 (nss build failure with make 4.4 on riscv) closed RESOLVED FIXED, with the fix applied in the nss ebuild | [Gentoo bug 882069](https://bugs.gentoo.org/882069) |
| 2025.06 | EESSI 2025.06 lists GNU make 4.4.1 as available for riscv64 | [EESSI make riscv64](https://www.eessi.io/docs/available_software_riscv/detail/make) |
| 2026-03-03 | Ubuntu 26.04 (resolute) riscv64 `make` 4.4.1-3 published in main (4.4.1-2 superseded) | [Launchpad](https://launchpad.net/ubuntu/resolute/riscv64/make) |
| 2026-04-29 | Latest upstream commit in the Savannah clone | [Savannah clone](https://git.savannah.gnu.org/git/make.git) |

- **Debian sid:** `make` 4.4.1-3 is listed for riscv64 ([packages.debian.org](https://packages.debian.org/sid/riscv64/make)). buildd.debian.org shows it as "Installed", built on rv-osuosl-01. The page reported the build as about 353 days old, which is undated beyond that.
- **Key contributors:** None. No RISC-V-specific commits exist.
- **Fully upstream:** There is nothing RISC-V-specific to upstream. The generic C code is used unchanged.
- **Unchecked:** The Savannah bug tracker, the bug-make archive (lists.gnu.org returned 403), and the debbugs "make" package. An unmerged mailing-list patch cannot be ruled out.

## 3. Upstream Support Tier

- **Formal tier policy:** None found.
- **Evidence of riscv64 support:** None in upstream. There is no riscv64 CI, no release-blocking riscv64 status and no official upstream riscv64 binaries.
- **Upstream CI:** None for any architecture. See Section 7.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal upstream tier | None found | None found | None found |
| Upstream CI | None (no CI in repo) | None (no CI in repo) | None (no CI in repo) |
| Upstream arch-specific code | None found | None found | None found |
| Upstream binaries | None (source release) [NEEDS VERIFICATION] | None [NEEDS VERIFICATION] | None [NEEDS VERIFICATION] |
| Debian/Ubuntu package | Data not available (not searched; Arch core carries make 4.4.1-3 for x86_64) | Data not available (not searched) | Yes, 4.4.1-3 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

GNU make has no architecture-specific subsystems. The Savannah and mirror clones show:

- No `.S` or `.s` files, no files named `*riscv*` or `*asm*`, and no JIT or SIMD dispatch code.
- No `immintrin` or `arm_neon` hits. The only inline-assembly-like hit in `src` and `gl` is `__asm__ ("glob64")` in `gl/lib/glob.in.h`. That is a symbol-alias declaration, not CPU code.
- Architecture macros under `src/`: only two old `__mips` references (`src/makeint.h:115` and a `ChangeLog.2` entry), plus an `__x86_64__`/`__aarch64__`/`__i386__` match in a manifest file under `src/w32`. There is no RISC-V or per-architecture code path.

| Component | amd64 | arm64 | riscv64 | Quality on riscv64 |
|---|---|---|---|---|
| Core engine (`src/*.c`: parser, job control, dependency graph) | portable C | portable C | portable C | scalar, no arch code |
| gnulib replacements (`gl/lib`) | generic C | generic C | generic C | scalar |
| Hand-tuned assembly | none | none | none | not applicable |
| SIMD / intrinsics | none | none | none | not applicable |
| Crypto, JIT, GC barriers | none found | none found | none found | not applicable |
| Build system (`configure`, `build.sh`) | arch-agnostic | arch-agnostic | arch-agnostic | scalar, arch-agnostic |

`config.guess` and `config.sub` are not in the repository. `configure.ac` sets `AC_CONFIG_AUX_DIR([build-aux])`, and the gnulib bootstrap supplies the files at release time. The claim that current gnulib handles riscv64, so tarball builds work, comes from a single finding [NEEDS VERIFICATION].

## 5. Build System, Cross-Compilation, and Toolchain

- **Exact build commands:** Data not available. The upstream documentation could not be fetched because `cgit.git.savannah.gnu.org` did not resolve in the session. Nothing was filled in from memory.
- **Build system:** autotools (`configure.ac`) plus `build.sh`. CMake `-DUSE_X=OFF` style flags probably do not apply. This is unconfirmed.
- **Toolchain minimums and rationale:** Data not available. The research found no toolchain minimum for riscv64 and no reason for one. The generic C code needs no RISC-V-specific compiler feature.
- **QEMU usage:** Data not available.
- **Git checkouts:** Building from a git checkout probably needs autoconf and automake to regenerate `configure`. This comes from a finding the dependency researcher built from memory [NEEDS VERIFICATION].
- **Known build failures:** The only one found is Gentoo bug 882069 (nss with make 4.4). See Section 11. The Gentoo commit message says it fixes "make-4.4 breakage on some arches (hopefully all!)", so the failure is probably not RISC-V specific.
- **Toolchains in use on riscv64:** The RISE Developer Image ships gcc-16.1, clang-21.1.8, glibc-2.43 and cmake-4.3.2 ([RISE slides, RVI Summit EU 2026](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)). The slides give no make build results.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core make functionality (generic C) | Yes | Yes | Yes, via generic code. No functional test results were found, and the upstream test suite was not run on riscv64 in this research. |
| Architecture-specific optimization | None | None | None |
| Loadable objects (`dlopen`, via glibc) | Data not available | Data not available | Data not available |
| Guile integration | Data not available | Data not available | Data not available |

- **Functional gaps:** None found. No riscv64-specific bug, issue or patch was found in the checked sources.
- **Performance gaps:** No GNU make benchmark exists for any architecture. No riscv64 vs arm64 measurement was found. There is no SIMD or assembly to be missing. The closest indirect data is a Phoronix article on Fedora ([Phoronix, 2026-03-10](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages)). It reports GNU Binutils builds on eight cores: x86_64 about 29 min, RISC-V about 143 min, PPC64LE 46 min, AArch64 36 min, i686 25 min. The article is inconsistent about LTO between the figures, so the comparison may not be like-for-like. Make's share of those build times is not broken out. A paper on astrophysical codes ([arXiv 2606.15490](https://arxiv.org/pdf/2606.15490)) is summarized as showing RISC-V about 3-9x slower than x86 and ARM references. It was not opened and does not cover make.
- **Security hardening gaps:** Data not available. No riscv64-specific hardening comparison was found.
- **NaN / floating-point semantics:** Data not available. No issue was found.

## 7. CI/CD Infrastructure

- **Method:** `git.savannah.gnu.org/git/make.git` was cloned at HEAD `b380278` with the full 3184-commit history. The tree was read directly, because the cgit web interface returned a 301 to an unresolvable host and then HTTP 503.
- **Upstream CI:** None. The root has only `.ccls`, `.clangd`, `.dir-locals.el` and `.gitignore`. `git ls-files` shows no `.github/`, `.gitlab-ci.yml`, `.cirrus.yml`, `.travis.yml`, `.circleci/`, `azure-pipelines`, `appveyor`, `Jenkinsfile`, buildbot or `.builds` files. No such file was ever added in history. There are no CI YAML files to read.
- **Not checked:** Savannah-hosted buildbots and external CI outside the repository.
- **Distro build infrastructure:** The Debian riscv64 build ran on rv-osuosl-01 per buildd.debian.org. This is distro infrastructure, not upstream CI.
- **RISE runners:** No use of RISE runners for GNU make was found. The runners use the label `ubuntu-24.04-riscv`, and an open issue in the riscv-runner repository asks for `ubuntu-26.04-riscv`. The [RISE RVI Summit EU 2026 slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf) report 24,000 jobs, 700k minutes, 116 organizations and 264 repositories on the runners. GNU make is not named.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI config in repo | None | None | None |
| RISE runner use | Not applicable | Not applicable | None found |
| Distro buildd | Data not available | Data not available | Debian: 4.4.1-3 Installed (rv-osuosl-01) |

## 8. Distribution and Release Status

| Channel | riscv64 available | Evidence |
|---|---|---|
| Ubuntu 26.04 (resolute) | Yes, package `make` 4.4.1-3, Published in main as of 2026-03-03 | [Launchpad](https://launchpad.net/ubuntu/resolute/riscv64/make). The packages.ubuntu.com pages returned HTTP 500 and the Launchpad API returned HTTP 400. |
| Debian sid | Yes, package `make` (source `make-dfsg`) 4.4.1-3 | [packages.debian.org](https://packages.debian.org/sid/riscv64/make) and buildd.debian.org ("Installed"). The same version is current in Ubuntu. |
| EESSI 2025.06 | Yes, make 4.4.1 | [EESSI](https://www.eessi.io/docs/available_software_riscv/detail/make). No performance data. |
| Arch Linux RISC-V | Not confirmed | The [archriscv.felixc.at](https://archriscv.felixc.at) search did not list make. The status page was only partially read (first 100k of 385k characters), with no `make` row. |
| postmarketOS | A make 3.81 riscv64 package page appeared in search results | Version 3.81 is old. Not otherwise verified [NEEDS VERIFICATION]. |
| PyPI | No | `pypi.org/pypi/gnu-make/json` returned HTTP 404. The RISE wheel-builder simple index for `gnu-make` also returned 404. |
| Upstream release artifacts | Unknown | The upstream release page was not reachable. |

- **User path to a working binary:** Install the distro package `make` on Debian sid or Ubuntu 26.04 riscv64, or use the EESSI stack. No upstream binary is needed. GNU make is a C program, and the generic build applies.
- **Package-name pitfalls:** The names `gnu make`, `python3-gnu-make` and `libgnu-make` are not real packages. The package name is `make`.
- **Packaging patches:** Whether `make-dfsg` carries riscv64-specific patches was not checked. This is the reason for the orange grade (Section 13).

## 9. Dependencies

The dependency list reflects GNU make's usual build and test setup. The upstream `configure.ac` was not used to derive it [NEEDS VERIFICATION]. "Not assessed" means no check was made. It does not mean the package is missing on riscv64.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | build-dependency, critical (any C compiler) | Not assessed here; the existing `gcc` report in the sw-ecosystem repo is colored blue [NEEDS VERIFICATION] | Not assessed | The RISE Developer Image ships gcc-16.1 [NEEDS VERIFICATION] | GCC has a RISC-V maintainer arrangement per web search; details not verified |
| glibc | runtime-dependency, critical (libc, plus `dlopen` for loadable objects) | Not assessed here; the existing `glibc` report is colored yellow [NEEDS VERIFICATION] | Not assessed | The RISE Developer Image ships glibc-2.43 [NEEDS VERIFICATION] | glibc is listed as a RISE Compilers & Toolchains project |
| GNU Guile | runtime-dependency, optional (embedded scripting) | Not assessed | Not assessed | Not assessed | No report; listed in `projects.yml` |
| pkg-config | build-dependency, optional (detects Guile) | Not assessed | Not assessed | Not assessed | No report; listed in `projects.yml` |
| autoconf | build-dependency, optional (git checkouts only: regenerate `configure`) | Not assessed | Not assessed | Not assessed | No report; listed in `projects.yml` |
| automake | build-dependency, optional (git checkouts only) | Not assessed | Not assessed | Not assessed | No report; listed in `projects.yml` |
| Perl | test-dependency, critical (runs the test suite) | Not assessed | Not assessed | Not assessed | No report; listed in `projects.yml` |
| gettext | runtime-dependency, optional (libintl, translations) | Not assessed | Not assessed | Not assessed | Not in `projects.yml`; no report |
| Gnulib | build, vendored portability code (not a separate package) | Not applicable (source code) | Not applicable | Not applicable | Vendored in `gl/` |
| POSIX shell (`/bin/sh`) | runtime, runs recipes | Not assessed | Not assessed | Not assessed | Not in `projects.yml` |
| Linux kernel | runtime | Not assessed | Not assessed | Not assessed | Listed in `projects.yml`; no report |

**Deep-dive:** Of these, only GCC and glibc involve JIT, SIMD or numerics. They have their own reports in the sw-ecosystem repository, and their readiness is not re-derived here. The other dependencies have no JIT, SIMD, crypto or numerics relevance for make. Per-dependency Ubuntu 26.04 riscv64 availability was not checked.

## 11. Known Bugs and Active Issues

Section 10 is omitted: GNU make is a standalone tool with no dependent package ecosystem that needs enabling on riscv64.

No open GNU make bug specific to riscv64 was found. The Savannah bug tracker returned unrelated content and remains unchecked.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Gentoo 882069](https://bugs.gentoo.org/882069) | dev-libs/nss-3.85 build failure on riscv: "No rule to make target" for `certhtml.o` | RESOLVED FIXED 2022-11-20 | Medium | Seen with nss 3.85 and 3.84-r1 under make 4.4. make 4.3 did not fail. make 4.4 changed sub-make behavior, and the sub-make build did not resolve the CPU tag in the object path. Gentoo commit 239fa7c0 set `CPU_TAG` in `Linux.mk` to `nssarch`, confirmed on RISC-V hardware. Probably not RISC-V specific. |
| Savannah #63347 | Upstream bug cited by the Gentoo bug | Unknown | Unknown | The page could not be read. Status unverified [NEEDS VERIFICATION]. |
| Mozilla Bugzilla 1800237 | Mozilla bug cited by the Gentoo bug | Unknown | Unknown | Cited by Gentoo; not read [NEEDS VERIFICATION]. |

**Correctness bugs:** The Gentoo case is the only confirmed correctness problem involving make on RISC-V. It is closed and attributed to make 4.4 sub-make behavior.

**Not make bugs:** These came up in searches but concern other tools:

- FreeBSD 242109, 258358 and 247958 concern a Makefile linker conditional, clang-tblgen and buildworld.
- GNU debbugs #62438 concerns a Guix LLVM cross-compile patch about CMake options.
- LKL pull request 621 reports slow linker relaxation on riscv64.
- A March 2026 linux-riscv thread reports a perf build failure with GCC 13.

## 12. Objections and Upstream Blockers

- **Stated objections:** None found. No RISC-V discussion was found in upstream, bug-make index pages (2001 to 2024 monthly indexes, no RISC-V subjects) or Savannah.
- **Technical blockers:** None found. The code is portable C with no arch-specific code.
- **Organizational blockers:** None found. There is also no RISE involvement and no RISE funding for GNU make.
- **Acceptance probability:** Not applicable for a port, since none is needed. For a CI contribution, upstream has no CI of any kind, so upstream acceptance of CI configuration is Data not available.
- **Coverage gap:** The bug-make archive, the Savannah tracker and the debbugs "make" package were not searched directly, so an unmerged riscv64 patch cannot be ruled out.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification:** Upstream GNU make has no CI of any kind (no `.github`, `.gitlab-ci.yml`, `.cirrus.yml` or `.travis.yml` in a full clone of [make.git](https://git.savannah.gnu.org/git/make.git)), so there is no riscv64 CI. The distribution floor applies: Debian sid and Ubuntu 26.04 ship riscv64 `make` 4.4.1-3 ([Launchpad](https://launchpad.net/ubuntu/resolute/riscv64/make)). Nobody checked whether the packaging carries riscv64-specific patches, so it grades orange (downstream-only) rather than yellow. The code is portable C with no RISC-V or other arch-specific code, and no RISC-V commit, issue or patch was found. The Gentoo make 4.4 breakage seen on riscv ([bug 882069](https://bugs.gentoo.org/882069)) is probably not RISC-V specific and was fixed on 2022-11-20.

**Pending work that could change the grade:**

- No RISC-V PRs, RISE involvement or funded work was found for GNU make. It is not a RISE member project and not in the RISE reward lists.
- Checking the Debian `make-dfsg` packaging diff for riscv64 patches would likely upgrade the grade to yellow (clean-distro-build). The code is portable and nothing suggests patches are needed.
- Unchecked: the Savannah bug tracker, the bug-make archive and the buildd.debian.org status page.

## 14. Investment Analysis

**RISE check:** No RISE work or funding was found for GNU make, so no sizing below is reduced by prior work:

- Not on the [members page](https://riseproject.dev/members/).
- Not in the [Developer Appreciation Program](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf) list, which names Gem5, Delve, VOLK, syscall_intercept, Lightening, SIMD Everywhere and MAMBO.
- Not in the [wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) list.
- No riseproject-dev repository or issue is about GNU make.
- The [RISE blog category](https://riseproject.dev/category/blog/) lists 37 posts (2024-05-15 to 2026-10-20) with none titled for make. The post bodies were not read.
- The [RISE introduction PDF](https://riseproject.dev/wp-content/uploads/sites/25/2026/01/RISE-Introduction.pdf) describes a small-projects porting tier, such as adding linux-riscv64 CI, with a EUR 500 reward. Nothing ties it to make.

The effort figures below are the author's estimates, not figures from the research.

### 14.1 Functional Enablement

No functional enablement work is needed on the evidence found. The remaining work is verification:

- Inspect the Debian `make-dfsg` packaging for riscv64 patches (the only step that could move the grade).
- Search the Savannah tracker and bug-make archive directly for "riscv".
- Run the upstream test suite (needs Perl) on riscv64 hardware and record the results. No test-suite results on riscv64 were found.

### 14.2 Performance Optimization

No arch-specific code exists, so there is no missing SIMD or assembly to add. No GNU make benchmark exists on any architecture. A baseline measurement (same version, comparable hardware, a representative project) would be needed before any optimization case could be made. The Fedora binutils figures above give an indirect signal only.

### 14.3 CI/CD Infrastructure

Upstream has no CI. A riscv64 job would have to run outside the upstream repository, for example on the RISE `ubuntu-24.04-riscv` runners against the GitHub mirror, or through distro buildds. Upstream acceptance of in-repo CI is Data not available.

### 14.4 Ecosystem Enablement

Not applicable. There is no package ecosystem (Section 10 omitted). Dependents of make consume the distro package.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Inspect Debian `make-dfsg` packaging diff for riscv64 patches and update grade | 0.2 | RISE distro-integration WG | High |
| Functional | Search Savannah tracker, bug-make archive and debbugs for riscv issues | 0.2 | RISE system-libraries WG | Medium |
| Functional | Run upstream test suite on riscv64 hardware and publish results | 0.5 | RISE | Medium |
| Performance | Baseline make benchmark, riscv64 vs arm64 | 1 | RISE developer-infrastructure WG | Low |
| CI/CD | External riscv64 CI for make (for example RISE runners against a mirror) | 1 to 2 | RISE developer-infrastructure WG | Medium |
| Ecosystem | None | 0 | Not applicable | Low |

## 15. References

- [GNU make homepage](https://www.gnu.org/software/make/) (returned HTTP 503; not read)
- [make.git on Savannah (cgit)](https://git.savannah.gnu.org/cgit/make.git/)
- [make.git clone URL](https://git.savannah.gnu.org/git/make.git)
- [GitHub mirror of GNU make](https://github.com/mirror/make)
- [Launchpad: Ubuntu resolute riscv64 make](https://launchpad.net/ubuntu/resolute/riscv64/make)
- [Debian sid riscv64 make](https://packages.debian.org/sid/riscv64/make)
- [Debian riscv64 port wiki](https://wiki.debian.org/Ports/riscv64)
- [EESSI: make for riscv64](https://www.eessi.io/docs/available_software_riscv/detail/make)
- [Arch Linux RISC-V](https://archriscv.felixc.at)
- [Gentoo bug 882069](https://bugs.gentoo.org/882069)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog category](https://riseproject.dev/category/blog/)
- [RISE feed](https://riseproject.dev/feed/)
- [RISE RVI Summit EU 2026 slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)
- [RISE introduction PDF](https://riseproject.dev/wp-content/uploads/sites/25/2026/01/RISE-Introduction.pdf)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Phoronix: Fedora RISC-V slow builds](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages)
- [arXiv 2606.15490: Is RISC-V Ready for Massively Parallel Astrophysical Codes?](https://arxiv.org/pdf/2606.15490)
- [bug-make 2024-01 index](https://lists.gnu.org:443/archive/html/bug-make/2024-01/index.html)