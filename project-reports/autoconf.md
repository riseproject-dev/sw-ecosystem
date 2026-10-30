---
title: autoconf
parent: Project Reports
color: green
dependencies:
  - name: Perl
    relation: runtime-dependency
    criticality: critical
  - name: GNU M4
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="autoconf" %}

# autoconf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for autoconf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GNU Autoconf generates `configure` scripts that adapt a package's build to many kinds of UNIX-like systems. It is written in M4, shell, Perl and Make. It has no compiled code and no architecture-specific source tree. Its README names two required dependencies, GNU M4 (1.4.8 or later, 1.4.16 or later recommended) and Perl (5.006 or later), and lists no optional ones. The scripts it generates are self-contained, so end users of a released package do not need autoconf, M4 or Perl ([GNU Autoconf](https://www.gnu.org/software/autoconf/), [GitHub mirror](https://github.com/autotools-mirror/autoconf)).

**Governance and sponsors**
- The project is part of GNU. The gnu.org page says it is "Supported by the Free Software Foundation" and that "Development of Autoconf, and GNU in general, is a volunteer effort." It is not a Linux Foundation or Apache project.
- No formal governance document was found. The model is GNU maintainer-led, working through Savannah and the bug-autoconf and autoconf-patches mailing lists.
- AUTHORS names Paul Eggert and Eric Blake as current maintainers. Ralf Wildenhues, Stepan Kasal and Benoit Sigoure are named as past helpers ([AUTHORS](https://gnu.googlesource.com/autoconf/+/refs/heads/master/AUTHORS)).
- Commits since 2024-01-01, by author: Paul Eggert 89, Zack Weinberg 40, Bruno Haible 11, Kamila Szewczyk 4, KO Myung-Hun 2, Jose E. Marchesi 2, Collin Funk 2, Yann E. Morin 1. The latest commit seen was 2026-10-29.
- Data not available: maintainer employers. The sources name none, and the AUTHORS email addresses date from FSF copyright paperwork.
- License: GPL-3.0-or-later with the Autoconf configure-script exception. The source headers say "either version 3 of the License, or (at your option) any later version", and the tree contains `COPYINGv3` (GPLv3) and `COPYING.EXCEPTION`. The top-level `COPYING` file is the GPLv2 text.
- `AUTHORS` (read from a clone of the Savannah repository) says the primary maintainers are Paul Eggert and Eric Blake, with help from Ralf Wildenhues, Stepan Kasal and Benoit Sigoure. The repository has no MAINTAINERS file.

**Community stance on new ports**
- No explicit policy was found. In practice, new architectures are handled through `config.guess` and `config.sub` updates. These two files come from the separate GNU config repository (`config.git`) and are bundled into autoconf and automake. Anyone can submit a patch.
- RISE membership: the [RISE members page](https://riseproject.dev/members/) lists 8 premier and 12 general members. Neither GNU nor the FSF is on it.

## 2. Port History and Upstreaming Timeline

Autoconf has no riscv64 port to upstream. Every riscv64 event found concerns the bundled `config.guess` and `config.sub`, autoconf-archive macros, or downstream projects with stale copies of the scripts. The full history of the Savannah clone (latest commit `f8111206`, 2026-10-29, latest tag v2.73) has no commit message mentioning RISC-V, and no riscv64 PR or issue exists in autoconf's own repository.

| Date | Event | Source |
|---|---|---|
| 2016-04-22 | Karsten Merker posts four meta-riscv patches. Two update autoconf 2.69's and automake 1.15's `config.{sub,guess}` to config.git commit `706fbe57e39d59f319d338de13b20cecbf7c638c`. Outcome not visible in the truncated thread. | [sw-dev thread](https://groups.google.com/a/groups.riscv.org/g/sw-dev/c/2zx0TEzd9xo) |
| 2018-04-21 | autoconf-archive patch #9577 (AX_BOOST_BASE: add riscv64 to lib64 architectures) closed as Done, pushed as `8f4fd41543fdf0726cf2863ca90fce3cb085c236`. This is autoconf-archive, not autoconf. | [autoconf-archive-maintainers](https://lists.gnu.org/archive/html/autoconf-archive-maintainers/2018-04/msg00014.html) |
| 2018-06-20 | Palmer Dabbelt posts "[PATCH] Add riscv as an alias for riscv32" to config-patches. The alias is not present in the current `config.sub`. | [config-patches](https://lists.gnu.org/archive/html/config-patches/2018-06/msg00003.html) |
| 2021-02-25 | sifive/freedom-e-sdk issue #586 opened: autoconf compiler sanity checks fail with a bare-metal riscv64 toolchain. Open, repo archived 2024-07-03. | [issue #586](https://github.com/sifive/freedom-e-sdk/issues/586) |
| 2023-02-02 | reiserfsprogs fails on riscv64gc because its `config.guess` (timestamp 2014-11-04) is too old. No reply retrieved. | [LKML post](https://lkml.indiana.edu/hypermail/linux/kernel/2302.0/01704.html) |
| 2023-03-08/09 | Privoxy packager reports stale `config.guess`. A maintainer replies that a licensing issue prevents updating the autoconf files. | [privoxy-users](https://lists.privoxy.org/pipermail/privoxy-users/2023-March/000730.html) |
| 2023-03-29/31 | m17n-list: old `config.guess`/`config.sub` cannot build on RISC-V. Fix confirmed on Arch Linux RISC-V on 03-31. [NEEDS VERIFICATION] (single source) | [m17n-list](https://lists.nongnu.org/archive/html/m17n-list/2023-03/msg00008.html) |
| 2024-09-03 | OpenJDK jdk8u-dev PR #573 (8199138, RISC-V Zero support) opened. It touches the JDK's own `config.guess` and regenerates `generated-configure.sh` with autoconf 2.69. | [PR #573](https://github.com/openjdk/jdk8u-dev/pull/573) |
| 2024-10-06 | Maxima bug #4382: the 5.47.0 tarball ships 2013-era `config.guess`/`config.sub`. Open as of 2024-10-07. | [Maxima bug #4382](https://sourceforge.net/p/maxima/bugs/4382) |
| 2025-07-10 | Timestamp of the current bundled `config.guess` and `config.sub` in the GitHub mirror, both with riscv32/riscv64 support. Confirmed from a clone of the Savannah repository. | [build-aux](https://github.com/autotools-mirror/autoconf/tree/master/build-aux) |
| 2026-06-02 | PR #573 closed, pushed as commit `fa25bd7`, labels `backport` and `integrated`. | [PR #573](https://github.com/openjdk/jdk8u-dev/pull/573) |

PR #573 was opened 2024-09-03 and integrated 2026-06-02, per the fetched PR page.

**Key contributors:** Karsten Merker (Debian, meta-riscv, 2016), Palmer Dabbelt (config-patches, 2018), Peter Simons (autoconf-archive #9577), DingliZhang (jdk8u backport, original patch by Gui Cao), RealFYang (sponsor), Andrew John Hughes (reviewer). Employers are not given in the sources. In the autoconf tree, `build-aux/config.sub` has listed `riscv`, `riscv32`, `riscv32be`, `riscv64` and `riscv64be` as CPU names since the 2016-02-06 sync (commit `2ca0d575`, Paul Eggert). The first RISC-V commit in config.git itself was not checked.

**Is it fully upstream?** Autoconf needs no port. The bundled `config.guess` and `config.sub` (both timestamp 2025-07-10) handle riscv: `config.sub` accepts `riscv`, `riscv32`, `riscv32be`, `riscv64` and `riscv64be` as CPU names, and `config.guess` recognizes riscv32/riscv64 on Linux. The proposed 2018 alias expanding bare `riscv` to riscv32 is not in the current `config.sub`.

## 3. Upstream Support Tier

- **Formal tier policy:** None. Neither the project page nor the repository documents tiered platform support. Autoconf says only that it adapts packages "to many kinds of UNIX-like systems."
- **CI:** None found for any architecture (see Section 7).
- **Release-blocking:** Data not available. No release-blocking platform list was found.
- **Official binaries:** None. Autoconf is distributed as source, and distributions package it.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal tier | None defined | None defined | None defined |
| Architecture-specific code in autoconf | None | None | None |
| Triplet recognition (`config.guess`/`config.sub`) | Not checked | Not checked | Present (riscv32/riscv64 and be variants), timestamp 2025-07-10 |
| Upstream CI | None found | None found | None found |
| Packaged by distros | Data not available | Data not available | Ubuntu resolute, Alpine v3.23 [NEEDS VERIFICATION] (Section 8) |

The amd64 and arm64 columns were not researched. Autoconf has no architecture-specific code, so there is no reason to expect a difference.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Autoconf is an M4 and shell tool that generates `configure` scripts. It has no JIT, no SIMD dispatch, no crypto, no assembly and no GC barriers. No `arch/` directory exists in the GitHub mirror. No `.S` files were seen at the top level, but subdirectories (`lib`, `build-aux` and others) were not opened, so files inside them cannot be ruled out.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core macros, m4 and generated configure shell code | n/a (architecture-neutral) | n/a | n/a |
| JIT backends | None | None | None |
| SIMD dispatch | None | None | None |
| `build-aux/config.guess` (2025-07-10) | Not checked | Not checked | Full. Branch for riscv32/riscv64 (and be) on Linux yields `riscv64-unknown-linux-<libc>`, detects gnu, musl, uclibc, dietlibc, llvm |
| `build-aux/config.sub` (2025-07-10) | Not checked | Not checked | Full. Accepts riscv, riscv32, riscv32be, riscv64, riscv64be |
| Bare `riscv` alias to riscv32 | Not applicable | Not applicable | Absent: `config.sub` accepts `riscv` as a plain CPU name, with no alias to riscv32 |

Both config scripts were read from a clone of the Savannah repository. Gentoo's gnuconfig package carries a riscv keyword, which is consistent but was not checked line by line ([Gentoo gnuconfig](https://packages.gentoo.org/packages/sys-devel/gnuconfig)).

The riscv64-relevant surface is the host-triplet scripts. Packages that vendor old copies fail on riscv64 until the copies are refreshed (Section 11).

## 5. Build System, Cross-Compilation, and Toolchain

**Build documentation.** The README, read from a clone of the Savannah repository, names only GNU M4 (1.4.8 or later, 1.4.16 or later recommended) and Perl (5.006 or later) as requirements for producing configuration scripts. autoconf's own build commands, toolchain minimums, QEMU usage and any Dockerfile were not found.

- **Required tools:** GNU M4 1.4.8 or later (1.4.16 or later recommended), and Perl 5.006 or later ([GitHub mirror](https://github.com/autotools-mirror/autoconf)). Both are needed to run autoconf's `autoconf`, `autoheader` and `autom4te` tools, not to run generated `configure` scripts.
- **Build command:** Not verified. The research notes only that, as far as is known, autoconf uses `./configure && make` and not CMake.
- **Cross-compilation:** Autoconf is architecture-independent, so there is nothing to cross-compile for riscv64. Distributions package it as arch "all" (Section 8).

**Known build failures for packages that use autoconf on riscv64**
- **Stale `config.guess`/`config.sub`:** The configure error is "checking build system type... ./config.guess: unable to guess system type" followed by "cannot guess build type" (reiserfsprogs, Maxima). The fix is `autoreconf -fi` with current autotools, or refreshing the two files from config.git.
- **Refresh needs automake as well:** On an Ubuntu 16.04 system, upgrading autoconf to 2.72 alone left Maxima's `config.guess` outdated. Also upgrading automake to 1.17 produced a recent file ([Maxima bug #4382](https://sourceforge.net/p/maxima/bugs/4382)). [NEEDS VERIFICATION] (single source)
- **Autoconf 2.71 did not help in one report:** K. Handa's Lubuntu 22.04 shipped autoconf 2.71, which he said was still older than needed ([m17n-list](https://lists.nongnu.org/archive/html/m17n-list/2023-03/msg00008.html)). [NEEDS VERIFICATION] (single source)
- **Bare-metal toolchains:** autoconf's link and run sanity checks fail with `riscv64-unknown-elf-gcc` (freedom-e-sdk #586). This is not specific to riscv64.
- **Freestanding configure:** A libkernaux commit requires Autoconf 2.70 to avoid stdarg.h warnings about missing prerequisite headers. It is reportedly tracked on Savannah, but the commit page returned HTTP 503 and no bug number was retrieved ([libkernaux commit](https://git.causa-arcana.com/tailix/libkernaux/commit/042d15f832c630a5f317cc6347e34c1d4d20429c)). [NEEDS VERIFICATION]
- **Obsolete macros:** A FreeBSD riscv64 package-fallout log shows obsolete-macro warnings such as AC_TRY_LINK. These are warnings, not failures ([FreeBSD pkg-fallout](https://lists.freebsd.org/archives/freebsd-pkg-fallout/2022-July/241314.html)).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Generate `configure` scripts | Not checked | Not checked | Works. The package is built and published for riscv64 in Ubuntu resolute |
| Host triplet detection | Not checked | Not checked | Present in bundled scripts (2025-07-10) |
| Run autoconf's own testsuite | Data not available | Data not available | Data not available. No riscv64 test results were found (bug-autoconf threads covered Apple arm64 and ppc64; RTEMS logs are build output, not autoconf test results) |

- **Functional gaps:** None found in autoconf. The functional gaps are in downstream projects with stale vendored scripts.
- **Performance gaps:** Data not available. No benchmark of autoconf or `configure` runtime on RISC-V was found. Autoconf has no SIMD or vector code, so a SIMD-driven gap does not apply. `configure` runtime is dominated by process spawning, compiler invocations and shell, which was not measured. The closest RISC-V data found is unrelated to autoconf: arXiv 2606.15490 (Sophgo SG2044 astrophysical codes: RISC-V about 3-6x slower than x86 and 5-9x slower than ARM) ([arXiv 2606.15490](https://arxiv.org/pdf/2606.15490)). The search summary was not verified against the paper. It does not predict `configure` times.
- **Security hardening gaps:** Not applicable. Autoconf has no compiled code.
- **NaN and floating-point semantics:** Not applicable.

## 7. CI/CD Infrastructure

No riscv64 CI could be confirmed, and no CI of any kind was found. The check is partial.

- The GitHub mirror top level has `.gitattributes`, `.gitignore`, `.prev-version`, `.x-update-copyright`, `GNUmakefile`, `Makefile.am`, `bootstrap`, `cfg.mk`, `configure.ac`, `maint.mk`, `manifest.scm`, `shell.nix`, plus `bin`, `build-aux`, `doc`, `lib`, `m4`, `man` and `tests`. There is no `.github/workflows`, `.gitlab-ci.yml`, `.travis.yml`, Jenkinsfile or Cirrus config. `.github` returned HTTP 404 ([GitHub mirror](https://github.com/autotools-mirror/autoconf)).
- The Savannah bare repository index shows no CI files, and `.gitlab-ci.yml` there returned HTTP 404. The [Savannah project page](https://savannah.gnu.org/projects/autoconf/) has no CI, buildbot or riscv64 mention.
- Not read: `Makefile.am`, `cfg.mk` and `maint.mk`.
- Searches for autoconf riscv64 CI, buildbot, Jenkins and GitLab found CI for other projects only.
- **RISE runners:** The [RISE RISC-V Runners docs](https://riscv-runners.riseproject.dev/docs/getting-started/configure) list Autoconf among the build tools preinstalled on the `ubuntu-24.04-riscv` and `ubuntu-26.04-riscv` images. This is not autoconf CI. Per the [runner announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), the service is free, uses the label `runs-on: ubuntu-24.04-riscv`, and runs on Scaleway EM-RV1 bare-metal servers, one job per node in an ephemeral Kubernetes pod.
- The alpine package build (Section 8) is distro-side validation, not upstream CI.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI config found | No | No | No |
| Distro package built | Data not available | Data not available | Ubuntu resolute (Launchpad), Alpine [NEEDS VERIFICATION] |
| Native runners available | Data not available | Data not available | RISE runners (not used by autoconf) |

## 8. Distribution and Release Status

| Channel | riscv64 status | Evidence |
|---|---|---|
| Ubuntu 26.04 (resolute) | Available. `autoconf 2.72-3.1ubuntu2`, pocket Release, status Published, `ubuntu/resolute/riscv64` | Launchpad API `getPublishedBinaries` query returned HTTP 200 with one entry. See the [Launchpad archive API](https://api.launchpad.net/devel/ubuntu/+archive/primary). Covers the `autoconf` binary only. |
| Alpine v3.23 | `autoconf 2.72-r1` on riscv64 [NEEDS VERIFICATION] | Search result only, not re-fetched: [Alpine package page](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/autoconf) |
| Debian | Not verified for riscv64. sources.debian.org lists autoconf 2.73-2 in forky and sid, 2.72-3.1 in trixie, 2.71-3 in bookworm. The buildd and packages.debian.org pages showed no riscv64 status. | The package is arch "all" in Debian and Ubuntu, so it is very likely installable on riscv64. |
| Arch Linux RISC-V | Unverified. The [archriscv.felixc.at](https://archriscv.felixc.at/) landing page did not list autoconf, and direct repo index fetches returned HTTP 404. | Not confirmed either way. |
| PyPI | Not applicable. The PyPI `autoconf` (2026.7.15.1, "PyAuto Configration") is an unrelated project with pure-Python `py3-none-any` files only. | [PyPI JSON](https://pypi.org/pypi/autoconf/json) |
| RISE wheel builder | None. RISE has no autoconf package. | [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) |

A user needs no special steps: install the distribution package (`apt install autoconf` on Ubuntu resolute). Packages with stale vendored `config.guess`/`config.sub` need `autoreconf -fi` or refreshed copies. The Ubuntu package page content and the package-graph database were not checked.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Perl | Runtime dependency, critical. Required (5.006 or later) to run `autoconf`, `autoheader`, `autom4te` and related scripts. | Data not available (not checked) | Data not available | Data not available | Data not available. `project-reports/perl.md` does not exist yet. Perl is tracked in `projects.yml`. |
| GNU M4 | Runtime dependency, critical. Required (1.4.8 or later, 1.4.16 or later recommended) macro processor that autoconf's macros run on. | Data not available (not checked) | Data not available | Data not available | Data not available. Not in `projects.yml`, so there is no report to link. |

- Both dependencies come from the README. `configure.ac` and `INSTALL` were not used to derive them, and it was not confirmed whether autoconf depends on texinfo or GNU make, both of which are tracked in `projects.yml`.
- Whether M4 or Perl is in Ubuntu 26.04 riscv64 under the names `m4`, `perl` or `perl-base` was not checked.
- Neither dependency has JIT, SIMD or crypto involvement relevant to autoconf. Data not available: recursion into M4 and Perl dependencies (not researched).
- The readiness grade inherits riscv64 from m4 and perl by construction. Autoconf's package is arch "all", so it cannot be installed unless those two are installable.

## 11. Known Bugs and Active Issues

None of these is an open bug in autoconf's own tracker. Data not available: Savannah autoconf bug tracker contents, which were not queried. All are downstream or tangential.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Maxima #4382](https://sourceforge.net/p/maxima/bugs/4382) | 5.47.0 release `config.{guess,sub}` outdated | Open (last update 2024-10-07) | Medium (build failure on riscv64) | Release script copies files from the installed autoconf. Upgrading automake as well was needed. [NEEDS VERIFICATION] |
| [freedom-e-sdk #586](https://github.com/sifive/freedom-e-sdk/issues/586) | Compilation of examples fails because of inapplicable autoconf checks | Open, repo archived 2024-07-03 | Low | Bare-metal toolchain, not riscv64-specific. Suspected related: riscv-pk#7. |
| [reiserfsprogs report](https://lkml.indiana.edu/hypermail/linux/kernel/2302.0/01704.html) | Fail to build from sources on riscv64gc | No reply or fix retrieved | Medium | `config.guess` dated 2014-11-04. |
| [privoxy-users 000730](https://lists.privoxy.org/pipermail/privoxy-users/2023-March/000730.html) | Update config.guess to add riscv64 | Not fixed as of 2023-03-09 | Medium | Maintainer cites a licensing issue. |
| [config-patches 2018-06](https://lists.gnu.org/archive/html/config-patches/2018-06/msg00003.html) | riscv as alias for riscv32 | Not present in the current `config.sub` | Low | None needed unless a project relies on the alias. |
| [m17n-list 2023-03](https://lists.nongnu.org/archive/html/m17n-list/2023-03/msg00008.html) | `config.guess`/`config.sub` too old for RISC-V | Resolved by replacing scripts | Medium | [NEEDS VERIFICATION] |
| JDK-8285630 | riscv64 cross-build failure in the JDK's own `config.sub` | Not tracked here | n/a | OpenJDK's copy, not GNU autoconf ([JDK-8285630](https://bugs.openjdk.org/browse/JDK-8285630)). |

**Correctness bugs:** None found in autoconf on riscv64. One generic issue exists: the freestanding-configure stdarg.h behavior fixed in Autoconf 2.70, with no Savannah number retrieved. [NEEDS VERIFICATION]

## 12. Objections and Upstream Blockers

- **Stated objections to riscv64 in autoconf:** None found.
- **Downstream objections:** Privoxy declines to update vendored autoconf files, citing a licence issue (details in a December 2020 privoxy-devel post, not read). OpenJDK reviewer gnu-andrew called the in-tree generated `configure` a "recurring problem" and wanted to backport JDK-8195689 to remove it ([PR #573](https://github.com/openjdk/jdk8u-dev/pull/573)). [NEEDS VERIFICATION] for the Privoxy licence detail.
- **Technical blockers:** None in autoconf. Blockers are projects that vendor generated `configure` and `config.*` files and need `autoreconf -fi`.
- **Organizational blockers:** The research could not read the MAINTAINERS file or Savannah history. No funded RISE work or RISC-V member company involvement was found.
- **Acceptance probability:** Data not available. No riscv64 patch to autoconf is pending, so there is nothing to estimate. The channel for any future triplet change is config-patches (config.git).

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream

**Justification.** Autoconf is M4, shell, Perl and Make with no compiled or architecture-specific code, so it runs on riscv64 by construction, and it inherits riscv64 from m4 and perl. The Debian/Ubuntu package is arch "all", and Launchpad shows [autoconf 2.72-3.1ubuntu2 Published on ubuntu/resolute/riscv64](https://api.launchpad.net/devel/ubuntu/+archive/primary); [Alpine also ships 2.72-r1 on riscv64](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/autoconf). The bundled [config.guess and config.sub](https://github.com/autotools-mirror/autoconf/tree/master/build-aux) (2025-07-10) recognise riscv32/riscv64. No stored report exists, so report_date is none. The as_of date is the 2026-10-30 live checks, with confidence medium-high. Upstream has no riscv64 CI, which the shortcut does not penalize. The riscv64 pain seen in the wild is stale `config.guess`/`config.sub` copies vendored by other projects (Privoxy, Maxima, reiserfsprogs), fixed by `autoreconf -fi`. That is not an autoconf defect.

**Pending work that could change the grade**
- No open autoconf-specific riscv64 PRs or issues were found. RISE has no autoconf work, and its riscv64 runner image only preinstalls Autoconf.
- Unverified: the first RISC-V commit in config.git, and the Debian riscv64 buildd status.
- GNU M4 and Perl were not checked for riscv64 and have no stored reports. `project-reports/perl.md` does not exist yet.

## 14. Investment Analysis

**RISE check.** RISE has no autoconf work: no blog post, repo, funded project or wheel is about it. The two mentions are the runner image preinstall and a passing reference to Autotools in the [SpeexDSP post](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/) (RP020, 40,000 EUR award, which added a Meson build alongside existing Autotools and CMake builds). The check is partial: the org repo list was unavailable, the OpenSBI post was truncated, and PyPI at pypi.riseproject.dev and the RISE wiki were not checked. None of the work below is covered by RISE. Effort figures are the author's estimates, not sourced data.

### 14.1 Functional Enablement

Autoconf needs no functional riscv64 work. Two verification tasks remain: check whether config.git merged the 2018 `riscv` alias, and run `git log -S riscv` on config.sub in a clone of `https://git.savannah.gnu.org/git/config.git`. Separately, confirm riscv64 status of GNU M4 and Perl, which are the actual runtime blockers, and create `project-reports/perl.md`.

### 14.2 Performance Optimization

No work justified. Autoconf has no SIMD or hot compiled code, and no autoconf RISC-V benchmark exists. An optional measurement of `configure` wall time on riscv64 hardware against arm64 would establish a baseline.

### 14.3 CI/CD Infrastructure

Upstream has no CI of any kind. Adding riscv64 CI would require upstream to adopt CI first, and the research found no sign of interest. The RISE runners (`ubuntu-24.04-riscv`) are available free if upstream or a downstream tester wants to run the autoconf testsuite natively. A lower-cost option is a scheduled job in our own infrastructure that builds autoconf from the GitHub mirror and runs its testsuite on riscv64. No riscv64 test results for the autoconf testsuite were found.

### 14.4 Ecosystem Enablement

The leverage is downstream: projects that vendor old `config.guess`/`config.sub`. Tracking and fixing these (Maxima, Privoxy, reiserfsprogs, and others found by scanning) with `autoreconf -fi` or refreshed scripts is the effective action. Maxima needs a newer automake at tarball time as well as a newer autoconf.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify config.git riscv alias status, first riscv commit in config.sub | 0.5 | Internal | Low |
| Functional | Confirm riscv64 status of GNU M4 and Perl; write `project-reports/perl.md` | 1-2 | Internal | High |
| Performance | Measure `configure` wall time on riscv64 vs arm64 (optional baseline) | 1 | Internal | Low |
| CI/CD | Scheduled riscv64 job building autoconf and running its testsuite (RISE runners or own infrastructure) | 1-2 | Internal | Medium |
| Ecosystem | Scan top dependent projects for stale vendored `config.guess`/`config.sub`; file or send refresh patches | 2-4 | Internal / downstream maintainers | Medium |

## 15. References

- [GNU Autoconf project page](https://www.gnu.org/software/autoconf/)
- [Autoconf GitHub mirror (autotools-mirror/autoconf)](https://github.com/autotools-mirror/autoconf)
- [Autoconf build-aux directory (config.guess, config.sub)](https://github.com/autotools-mirror/autoconf/tree/master/build-aux)
- [Autoconf Savannah project page](https://savannah.gnu.org/projects/autoconf/)
- [Autoconf AUTHORS (gnu.googlesource.com)](https://gnu.googlesource.com/autoconf/+/refs/heads/master/AUTHORS)
- [RISC-V sw-dev thread: Native riscv sw development / architecture triplets / qemu](https://groups.google.com/a/groups.riscv.org/g/sw-dev/c/2zx0TEzd9xo)
- [config-patches: Add riscv as an alias for riscv32 (2018-06)](https://lists.gnu.org/archive/html/config-patches/2018-06/msg00003.html)
- [autoconf-archive patch #9577: AX_BOOST_BASE riscv64](https://lists.gnu.org/archive/html/autoconf-archive-maintainers/2018-04/msg00014.html)
- [OpenJDK jdk8u-dev PR #573: 8199138 Add RISC-V support to Zero](https://github.com/openjdk/jdk8u-dev/pull/573)
- [OpenJDK bug JDK-8285630](https://bugs.openjdk.org/browse/JDK-8285630)
- [privoxy-users: Update config.guess to add riscv64 support](https://lists.privoxy.org/pipermail/privoxy-users/2023-March/000730.html)
- [sifive/freedom-e-sdk issue #586](https://github.com/sifive/freedom-e-sdk/issues/586)
- [Maxima bug #4382](https://sourceforge.net/p/maxima/bugs/4382)
- [LKML: reiserfsprogs fails to build on riscv64gc](https://lkml.indiana.edu/hypermail/linux/kernel/2302.0/01704.html)
- [m17n-list 2023-03: config.guess/config.sub too old for RISC-V](https://lists.nongnu.org/archive/html/m17n-list/2023-03/msg00008.html)
- [libkernaux commit (freestanding configure)](https://git.causa-arcana.com/tailix/libkernaux/commit/042d15f832c630a5f317cc6347e34c1d4d20429c)
- [FreeBSD pkg-fallout 2022-July](https://lists.freebsd.org/archives/freebsd-pkg-fallout/2022-July/241314.html)
- [Gentoo gnuconfig package](https://packages.gentoo.org/packages/sys-devel/gnuconfig)
- [Launchpad primary archive API (autoconf on ubuntu/resolute/riscv64)](https://api.launchpad.net/devel/ubuntu/+archive/primary)
- [Alpine v3.23 autoconf riscv64 package](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/autoconf)
- [PyPI autoconf (unrelated project)](https://pypi.org/pypi/autoconf/json)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners: configure your workflow](https://riscv-runners.riseproject.dev/docs/getting-started/configure)
- [RISE announcement: RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog: SpeexDSP optimizations for RISC-V](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/)
- [arXiv 2606.15490: Sophgo SG2044 study](https://arxiv.org/pdf/2606.15490)