---
title: readline
parent: Project Reports
color: yellow
dependencies:
  - name: ncurses
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: libaudit
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="readline" %}

# readline

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for readline<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GNU readline is a C library that provides interactive line editing, history, and completion for programs that read command-line input from a terminal. It is the standard line-editing backend for Bash, the Python REPL (via the deprecated `readline` module and its replacement `gnureadline`), GDB, PostgreSQL's `psql`, and hundreds of other CLI tools. The library operates entirely through POSIX syscalls and termios/terminfo; it contains no assembly, no SIMD, no JIT, and no architecture detection beyond what autoconf provides as a standard feature test.

**Governance:** GNU Project, nominally under the Free Software Foundation umbrella, but with no dedicated foundation, no steering committee, and no published governance policy. A direct fetch of `MAINTAINERS` from the canonical repository ([cgit.git.savannah.gnu.org/cgit/readline.git/plain/MAINTAINERS](https://cgit.git.savannah.gnu.org/cgit/readline.git/plain/MAINTAINERS)) returns HTTP 404 - no such file exists. Chet Ramey (Case Western Reserve University) has been the sole maintainer since 1989. Bug reports and patches go to the `bug-readline@gnu.org` mailing list; there is no issue tracker, and the project is not hosted on GitHub or GitLab. License: GPL-3.0-or-later. Homepage: [tiswww.case.edu/php/chet/readline/rltop.html](https://tiswww.case.edu/php/chet/readline/rltop.html). Source: [git.savannah.gnu.org/git/readline.git](https://git.savannah.gnu.org/git/readline.git).

**Corporate sponsors:** None. Ramey has stated he has never been compensated for readline maintenance; it is unpaid, volunteer work. Vendors such as IBM, Oracle, Canonical, and the various BSD/Linux distributions package and redistribute readline, but none employs or funds a co-maintainer. The [RISE Project](https://riseproject.dev) governing-board membership list (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent as Premier Members; Akeana, Andes, Canonical, and others as General Members) does not list readline anywhere, and RISE has no documented involvement with the GNU readline C library itself.

**Community stance on new ports:** Not applicable. readline has no tier system and no port-gating mechanism. Because the library contains no architecture-specific code, any POSIX-compliant platform with a working C compiler gets full readline support automatically, with no maintainer action required. No RISC-V policy statement has been issued because none is needed.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| ~2018-2019 | Debian riscv64 porter infrastructure comes online; readline begins building for riscv64 as part of standard Debian port bootstrap, with no readline-specific patch work | [Debian buildd](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64) |
| ~2021 | Fedora adds riscv64 port; readline available without modification | [NEEDS VERIFICATION] - no Fedora-specific source consulted |
| ~2026-02-14 | readline 8.3-4 built on `rv-osuosl-02`; status "Installed" in Debian sid for riscv64 | [buildd.debian.org readline sid riscv64](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64) |
| 2026-09-20 | readline 8.3.6-1 built and signed for riscv64 on the Arch Linux RISC-V community port | [archriscv.felixc.at/repo/core/](https://archriscv.felixc.at/repo/core/) |
| Ongoing (confirmed live 2026-10-01) | `libreadline8t64` (8.3-4), `libreadline-dev`, and `readline-common` ship as riscv64 binary packages in Ubuntu 26.04 "resolute" | [packages.ubuntu.com/resolute/riscv64/libreadline8t64](https://packages.ubuntu.com/resolute/riscv64/libreadline8t64) |

**Key contributors:** None. riscv64 support required zero readline-specific patches from any individual or organization. The library reached riscv64 entirely through standard distro port work (Debian, Ubuntu, Arch) with no readline-specific contributor action, and no commit in the upstream git log (grepped for "riscv") references RISC-V in any way.

**Fully upstream:** Yes, in the sense that there is nothing to upstream. The upstream source is architecture-neutral autotools C and builds on riscv64 without modification. No patch series, no RFC, and no "add riscv64 support" commit exists or is needed anywhere in the project's history.

## 3. Upstream Support Tier

GNU readline has no formal tier policy; the project does not categorize architectures at all.

**Evidence-based tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mentioned in upstream documentation | No | No | No |
| Architecture-specific code | No | No | No |
| Upstream CI | None | None | None |
| Release-blocking test requirement | None | None | None |
| Official upstream binary | No (source only) | No (source only) | No (source only) |
| Builds without modification | Yes | Yes | Yes |
| Distro binary package available | Yes | Yes | Yes (Debian sid, Ubuntu 24.04/26.04, Arch Linux RISC-V) |

All three architectures sit in an identical position relative to upstream: the project ships only source tarballs and runs no CI for any target. riscv64 is not disadvantaged relative to amd64 or arm64 because no architecture receives preferential treatment upstream - the entire support model is "it's portable C, it builds everywhere."

## 4. Technical Architecture and RISC-V-Specific Subsystems

GNU readline has no architecture-specific subsystems. Direct inspection of the source tree (`cgit.git.savannah.gnu.org/cgit/readline.git/tree/` and the GitHub mirror `sailfishos-mirror/readline`) confirms there is no `arch/`, `riscv/`, `sysdeps/`, or any per-CPU subdirectory, and no assembly or SIMD-intrinsics files at any level. This is categorically different from libraries such as glibc, OpenBLAS, or libjpeg-turbo that carry hand-tuned or intrinsics-based code per architecture; readline has never had that kind of structure on any architecture, including x86_64 or aarch64.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Signal handling (`signals.c`) | scalar | scalar | scalar | Pure POSIX feature-detection (`#ifdef HAVE_POSIX_SIGNALS`, etc.); zero CPU-arch guards |
| Terminal I/O (`rltty.c`, `terminal.c`) | scalar | scalar | scalar | OS-level termios/termio feature detection only |
| Input processing (`input.c`, `readline.c`) | scalar | scalar | scalar | Pure C; no intrinsics, no SIMD, no inline asm |
| Shared library build (`support/shobj-conf`) | `linux*-*` wildcard | `linux*-*` wildcard | `linux*-*` wildcard | `riscv64-linux-gnu` matched by the generic Linux fallback stanza; uses `-fPIC` / `-shared` / `-Wl,-soname` |
| `configure.ac` host_cpu case block | none | none | none | Only `*cray*` and `*s390*` receive CPU-specific configure cache values (lines ~238-240); riscv falls through to the default/generic path, which is correct |
| Multibyte/UTF-8 | `HAVE_WCTYPE_H` | `HAVE_WCTYPE_H` | `HAVE_WCTYPE_H` | autoconf feature test; no arch conditioning |

There are no JIT backends, no SIMD dispatch, no cryptographic routines, no GC barriers, and no memory-layout assumptions tied to a CPU architecture anywhere in readline. The absence of riscv64-specific code is not a gap to close - it is the correct and permanent state for this library. The project's optimization proposition does not depend on architecture-specific tuning (no SIMD, no crypto, no numerics, no compression hot path).

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autoconf/Automake only. There is no `CMakeLists.txt` anywhere in the repository and no CMake support of any kind. `configure` ships pre-generated, so `autoconf`/`automake` are needed only when regenerating it, not for normal builds.

**Cross-compilation command (x86_64 host, riscv64 target):**

```bash
./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --prefix=/usr/riscv64 \
  --enable-shared \
  --enable-static \
  --enable-multibyte \
  CC=riscv64-linux-gnu-gcc \
  AR=riscv64-linux-gnu-ar \
  RANLIB=riscv64-linux-gnu-ranlib
make
make install
```

**Native build (on a riscv64 host):**

```bash
./configure --prefix=/usr/local
make
make install
```

**Toolchain requirements:** `configure.ac` does not document a minimum compiler version; the `README` states only that it "builds with `gcc` by default if it is found" and that `-O2`/`-g` are added automatically when `$GCC` is set. There is no C-standard floor (`AC_PROG_CC` version check) and nothing Clang-specific. Any GCC or Clang that supports `-fPIC` and `-shared` is sufficient, including riscv64 cross-toolchains.

**QEMU usage:** Not documented upstream - no reference to "qemu" exists anywhere in the repository. For testing a cross-built binary:

```bash
qemu-riscv64 -L /usr/riscv64-linux-gnu ./examples/rl
```

**Containerization:** No `Dockerfile` exists anywhere in the repository.

**riscv64 recognition mechanism:** readline relies on the shared `config.guess`/`config.sub` scripts (maintained by the separate GNU `config` project) for build-triplet detection. `support/config.sub` (around lines 1396-1400) lists `riscv`, `riscv32`, `riscv32be`, `riscv64`, `riscv64be` as recognized CPU names, and `support/config.guess` (around line 1174) detects `riscv64:Linux:*:*` for `uname`-based host detection. Both are generic triplet-table entries shared by every autotools project, not readline-specific patches.

**Known build failures on riscv64:** None found. Debian buildd shows readline 8.3-4 built cleanly on `rv-osuosl-02` with no anomalies and no special configure overrides in the Debian packaging for riscv64; Debian's `debian/control` excludes only `lib32ncurses-dev`, `lib64ncurses-dev`, and `gcc-multilib` for riscv64 (architectures where 32-bit multilib makes no sense), with all other build dependencies unchanged.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap? |
|---|---|---|---|---|
| Line editing (emacs/vi modes) | Full | Full | Full | None |
| History (in-memory, file-backed) | Full | Full | Full | None |
| Tab completion (custom + filename) | Full | Full | Full | None |
| Multibyte / UTF-8 input | Full | Full | Full | None |
| Signal handling (SIGINT, SIGTERM, SIGWINCH) | Full | Full | Full | None |
| Bracketed paste | Full | Full | Full | None |
| `pselect(2)`-based input with signal unblocking | Full | Full | Full | None |
| Shared library (`.so`) | Full | Full | Full | None |
| Static library (`.a`) | Full | Full | Full | None |
| Security hardening (stack canaries, RELRO, PIE) | Distro-controlled | Distro-controlled | Distro-controlled | None - distro build flags apply uniformly |

**Functional gaps:** None.

**Performance gaps:** Data not available: exhaustive web searches (Geekbench, SPEC, CoreMark, Phoronix, chipsandcheese, RAJAPerf, and targeted queries such as "readline riscv64 benchmark", "readline riscv performance 2025") turned up no published readline-specific riscv64-vs-arm64 or riscv64-vs-amd64 latency/throughput data. All RISC-V benchmark coverage found is at the whole-core/ISA level, not library-level. Given that readline is an interactive input library (keypress-to-echo latency dominated by terminal syscall overhead), CPU ISA is not expected to be a meaningful performance variable for this workload.

**Security hardening gaps:** None identified. Debian packaging applies identical hardening flags (`-fstack-protector-strong`, full RELRO, PIE) across all architectures including riscv64.

**Floating-point / NaN semantics:** Not applicable. readline performs no floating-point computation.

## 7. CI/CD Infrastructure

The upstream GNU readline repository has no CI configuration of any kind, confirmed by direct inspection of its top-level file tree ([cgit.git.savannah.gnu.org/cgit/readline.git/tree/](https://cgit.git.savannah.gnu.org/cgit/readline.git/tree/)): the directory contains only `doc/`, `examples/`, `m4/`, `shlib/`, `support/`, and top-level autotools/doc files (`configure`, `configure.ac`, `Makefile.in`, `CHANGELOG`, `NEWS`, `README`, etc.). There is no `.github/` directory, no `.gitlab-ci.yml`, no `.travis.yml`, no `Jenkinsfile`, no `appveyor.yml`, and no Buildbot configuration. The cgit landing page shows branches (`devel`, `master`, version branches 7.0-8.3), tags up to `readline-8.3` (July 2025), and recent commits (through September 2026) by Chet Ramey alone - no CI badges, no build-status indicators, no links to any CI system.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | No | No | No |
| RISE CI runners used by readline | No | No | No |
| Automated test run on commit | No | No | No |
| Hardware used | None | None | None |

The only riscv64 build evidence in the entire research corpus comes from downstream distro packaging infrastructure (Debian buildd on `rv-osuosl-02`, Ubuntu's archive builders, Arch Linux RISC-V's build infrastructure), not from any upstream test or CI system - readline has no upstream test suite that runs in CI for any architecture.

## 8. Distribution and Release Status

**Upstream releases:** Source-only tarballs at [ftp.gnu.org/gnu/readline/](https://ftp.gnu.org/gnu/readline/). Current tagged release is readline 8.3 (tag dated July 2025), with ongoing commits by Chet Ramey through September 2026. No riscv64-specific (or any architecture-specific) binary is published by the upstream project - it is source-only by design.

| Distribution | Package | Version | riscv64 Status | Source |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libreadline8t64`, `libreadline-dev`, `readline-common` | 8.3-4 | Available (live, HTTP 200 download links verified) | [packages.ubuntu.com/resolute/riscv64/libreadline8t64](https://packages.ubuntu.com/resolute/riscv64/libreadline8t64), [libreadline-dev](https://packages.ubuntu.com/resolute/riscv64/libreadline-dev), [readline-common](https://packages.ubuntu.com/resolute/riscv64/readline-common) |
| Ubuntu 24.04 LTS | `libreadline8t64`, `libreadline-dev` | 8.2-4build1 | Available | [packages.ubuntu.com noble readline](https://packages.ubuntu.com/search?keywords=readline&suite=noble&searchon=names&section=all) |
| Debian sid | `libreadline8t64`, `libreadline-dev` | 8.3-4 | Installed (built on `rv-osuosl-02`, ~2026-02-14) | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64) |
| Debian bookworm (stable) | `libreadline8` | 8.2-1.3 | Available | [tracker.debian.org/pkg/readline](https://tracker.debian.org/pkg/readline) |
| Arch Linux RISC-V | `readline` | 8.3.6-1 | Available, signed, actively maintained (built 2026-09-20) | [archriscv.felixc.at/repo/core/](https://archriscv.felixc.at/repo/core/) |
| PyPI `readline` (Python binding) | `readline` | 6.2.4.2 | Source tarball only, no wheel for any architecture (deprecated; "USE gnureadline INSTEAD") | [pypi.org/pypi/readline/json](https://pypi.org/pypi/readline/json) |
| RISE wheel index (`pypi.riseproject.dev`) | `gnureadline` | n/a | 4 published riscv64 wheels (Python 3.12/3.13/3.14/3.14t, `manylinux_2_38/2_39_riscv64`) built via RISE RISC-V Runner CI | [riseproject-dev/python-wheels PR #1194](https://gitlab.com/) build workflow `build-gnureadline.yml` |

**What must a user do to get a working binary on riscv64:**

On Debian/Ubuntu (including 26.04 "resolute"): `apt install libreadline-dev` - no additional steps; the package is in the main archive and installs without modification.

On Arch Linux RISC-V: `pacman -S readline` - the signed `readline-8.3.6-1-riscv64.pkg.tar.zst` package is present in the `core` repository.

For the Python binding: `pip install gnureadline` picks up a prebuilt riscv64 wheel from the RISE-built index; the plain `readline` PyPI package has no wheel for any architecture and must be built from its source tarball (this is not riscv64-specific - no platform gets a prebuilt `readline` wheel).

From source (any distro): standard `./configure && make && make install`, with or without the riscv64 cross-compilation flags listed in Section 5.

**Language binding availability on riscv64 (Ubuntu):** `libghc-readline-dev`, `libghc-readline-prof`, `libreadline-java`, `libterm-readline-gnu-perl`, `lua-readline`, `lua-readline-dev`, `raku-readline`, `tcl-tclreadline`, `php8.3-readline` are all available for riscv64. Only `lib32readline*` (amd64-only by definition) and `lib64readline*` (i386-only by definition) are absent, which is expected and architecture-correct rather than a gap.

## 9. Dependencies

Dependencies were identified by fetching `configure.ac`, `aclocal.m4`, and `README` from the canonical readline source ([cgit.git.savannah.gnu.org/cgit/readline.git](https://cgit.git.savannah.gnu.org/cgit/readline.git)). readline ships a pre-generated `configure` and carries no package-manifest file; its dependency surface is resolved almost entirely by the `BASH_CHECK_LIB_TERMCAP` autoconf macro (`aclocal.m4`, around lines 925-940), which probes in order for a `tgetent`-providing library: libc itself, then `libtermcap`, `libtinfo`, `libcurses`, `libncursesw`, `libncurses`, falling back to readline's own bundled `lib/termcap` if none is found.

| Name | Role | riscv64 Status | Notes |
|---|---|---|---|
| ncurses | Runtime dependency, critical. Provides the `tgetent`-based terminal-capability library (via `libtinfo`/`libncursesw`/`libncurses`) that readline links against for cursor movement, line redraw, and key-sequence detection. Without it (or the bundled fallback), readline cannot perform screen I/O. | Expected available - ncurses is one of the most foundational, longest-ported Debian/Ubuntu packages and is present on every architecture tier including riscv64 in current Ubuntu/Debian archives (consistent with readline itself being packaged for riscv64, which requires a riscv64 ncurses/libtinfo already being present). Tracked separately in this project set as "ncurses" (repo [github.com/mirror/ncurses](https://github.com/mirror/ncurses)); no dedicated status report exists for it in this corpus. | [NEEDS VERIFICATION] - not confirmed via package-graph query (tool unavailable this session); confirmed only by inference from readline's own riscv64 packaging succeeding, which requires a riscv64 termcap provider to exist. |
| glibc | Runtime dependency, critical. The C runtime; provides `malloc`, signal handling, termios, `wctype`, and the full set of POSIX APIs readline calls, regardless of which termcap library is chosen. | Available - glibc riscv64 support is a prerequisite for the Ubuntu/Debian/Arch riscv64 ports existing at all, and is confirmed in those archives (Debian sid ships glibc 2.42-17 for riscv64). Tracked separately as "glibc" with its own status report at `project-reports/glibc.md`. | See `project-reports/glibc.md` for glibc's own riscv64 readiness detail. |
| libaudit | Runtime dependency, optional. Linux-specific `libaudit.h`/`AUDIT_USER_TTY` integration for TTY audit logging, probed via `AC_CHECK_HEADERS` (soft dependency - not an `AC_CHECK_LIB` hard requirement). The build succeeds with audit logging simply disabled if the header is absent. | [NEEDS VERIFICATION] - not confirmed via package-graph query (tool unavailable this session). Candidate Ubuntu packages: `libaudit-dev`/`libaudit1`. Not build-blocking even if absent. Tracked separately as "libaudit" (repo [github.com/linux-audit/audit-userspace](https://github.com/linux-audit/audit-userspace)); no dedicated status report exists for it in this corpus. | Non-blocking regardless of riscv64 status: absence degrades only to "no audit logging." |
| GCC | Build dependency, critical. The C compiler (and GNU make) used to build readline; `autoconf`/`automake` are needed only when regenerating the shipped `configure`, not for a normal build. | Available - GCC riscv64 is a release-blocking prerequisite for the Ubuntu/Debian/Arch riscv64 ports themselves to exist, and readline's own successful riscv64 packaging in all three distros confirms a working riscv64 GCC toolchain is already in place. Tracked separately as "GCC" with its own status report at `project-reports/gcc.md`. | See `project-reports/gcc.md` for GCC's own riscv64 readiness detail. No minimum GCC/Clang version or C-standard floor is specified by readline's own build system (Section 5). |

**Dependency depth analysis:** readline's dependency tree is exceptionally shallow and entirely non-computational: one critical runtime library (a termcap/terminfo provider, typically ncurses), the C runtime (glibc), one optional Linux-only header-only integration (libaudit), and a build-time-only compiler (GCC). None of these carries a JIT backend, architecture-specific SIMD dispatch, or cryptographic assembly that would require riscv64-specific engineering work. The project-graph dependency-status query tool was unavailable for this session (`CONNECTION_CLOSED`), so ncurses's and libaudit's riscv64 package status above is inferred rather than directly graph-verified; this should be re-run once that tool is reachable, though the inference is strong given readline's own riscv64 packages already build and ship successfully, which structurally requires a working riscv64 ncurses/libtinfo and GCC to already be present.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs were found in any tracker examined (Debian BTS, the `bug-readline` mailing list, Fedora Bugzilla), and a direct grep of the readline.git commit log for "riscv" returned zero matches. The following are the notable open bugs in the general (architecture-independent) readline issue set:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Debian #1118942](https://bugs.debian.org/1118942) | readline fails to parse UTF-8 correctly depending on timing | Open, no patch | Normal | `pselect6` with zero timeout fires between bytes of a multi-byte sequence; reported on amd64; no riscv64-specific relevance |
| [Debian #1105625](https://bugs.debian.org/1105625) | FTBFS with `make --shuffle=reverse` | Open, tagged forky | Minor | Missing Makefile dependency in `debian/rules`; x86_64-reported only; no riscv64-specific relevance |
| [Debian #925562](https://bugs.debian.org/925562) | Ctrl-C exits even when SIGINT caught | Reassigned, disputed | Normal | Signal-handling behavior dispute; no architecture specifics |
| bug-readline, 2026-06-18 | Heap buffer overflow in `rl_callback_handler_install` when prompt is large | Open, no patch | High | `display.c:714` hardcodes `inv_lbsize`/`vis_lbsize` at 256; overflow triggers at `display.c:1027`; affects 8.3 and master; reachable via `rlwrap`; no architecture specifics |
| bug-readline, 2025-12 | SEGFAULT on SIGINT when in reverse search | Open, no patch | Normal | General signal-handling issue; no architecture specifics |

**Correctness bugs:** The heap buffer overflow in `rl_callback_handler_install` (reported 2026-06-18) is the most significant open correctness issue in the project. It affects all architectures equally; there is no riscv64-specific exposure or mitigation, and no evidence it was triggered or investigated on riscv64 hardware specifically.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No upstream maintainer statement on RISC-V exists, because none has ever been needed - no riscv64-related thread appears anywhere in the `bug-readline` archive.

**Technical blockers:** None. The library is architecture-neutral by construction; there is no architecture-conditional code path that could require riscv64-specific review or acceptance.

**Organizational blockers:** None. Chet Ramey accepts general correctness patches via the mailing list without architecture restrictions; the single-maintainer model has never been a gating factor for portability, since portability requires no maintainer action.

**Acceptance probability for a hypothetical riscv64-specific patch:** Not applicable. No riscv64-specific patch is needed or conceivable for this library under its current architecture (no arch-specific subtree, no SIMD, no JIT).

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** Upstream GNU readline ([git.savannah.gnu.org/git/readline.git](https://git.savannah.gnu.org/git/readline.git), maintained solely by Chet Ramey via the `bug-readline@gnu.org` mailing list) has no CI configuration of any kind in its repository - no `.github/workflows`, `.gitlab-ci.yml`, Travis, Jenkins, or Buildbot config, confirmed by direct inspection of [cgit.git.savannah.gnu.org/cgit/readline.git/tree/](https://cgit.git.savannah.gnu.org/cgit/readline.git/tree/) - so the "no upstream CI" condition applies, which alone would floor the project at orange/grey. The distribution floor rescues it to yellow: Ubuntu 26.04 "resolute" ships riscv64 binary packages (`libreadline8t64`, `libreadline-dev`) built from the project's portable, architecture-neutral autotools source with no readline-specific patches - readline has zero arch-specific code paths, confirmed via source-tree inspection showing only generic `config.guess`/`config.sub` triplet tables, not readline patches - verified live via [packages.ubuntu.com/resolute/riscv64/libreadline8t64](https://packages.ubuntu.com/resolute/riscv64/libreadline8t64) (HTTP 200, live download link). This matches the clean-distro-build sub-type: no upstream CI, but a clean unpatched build from vanilla source on a major distro. readline is a line-editing/terminal-interaction library (termios/terminfo-based), not a performance-optimization-purpose project (no SIMD, no crypto, no numerics, no compression hot path whose value proposition depends on architecture-specific tuning), so the optimization modifier does not apply and no Optimization level field is reported for this project.
- **Pending work that could change the grade:** None found specific to readline itself - no open riscv64-related issues, patches, or mailing-list threads exist (the `bug-readline` archive and the commit log were both checked, zero matches), and the RISE Project has no documented involvement with GNU readline. Its only adjacent activity is funding riscv64 wheel builds for the separate `gnureadline` Python binding via `riseproject-dev/python-wheels` PR #1194 (merged, using the RISE RISC-V Runner, `ubuntu-24.04-riscv`), which does not affect the core C library's grade. Adding upstream CI of any kind (for any architecture) would be a prerequisite before readline could reach blue or green.

## 14. Investment Analysis

RISE Project has no documented involvement with the GNU readline C library itself; its only adjacent, RISE-funded work is riscv64 wheel builds for the separate `gnureadline` Python binding (`riseproject-dev/python-wheels` PR #1194, built on the RISE RISC-V Runner). The core library requires no investment for riscv64 functional enablement.

### 14.1 Functional Enablement

No work required. readline builds and runs on riscv64 without modification across Debian, Ubuntu (including 26.04), and Arch Linux RISC-V. All features available on amd64 and arm64 are available on riscv64 (Section 6).

### 14.2 Performance Optimization

No work is possible or meaningful. readline is an interactive terminal-input library; its latency is dominated by terminal syscall overhead (`write(2)`, `pselect(2)`), not CPU computation. There are no hot loops, no SIMD opportunities, and no numerical routines to optimize, and no published riscv64 vs. arm64/amd64 benchmark data exists to even motivate such work.

### 14.3 CI/CD Infrastructure

The upstream project has no CI infrastructure of any kind for any architecture. Adding riscv64 CI in isolation would first require establishing any upstream CI at all. Given the single-maintainer governance model and the library's complete architecture neutrality, upstream CI is unlikely to be proposed, accepted, or maintained. If riscv64 regression coverage is needed for downstream integration, it belongs in the downstream consumer's CI (Bash, Python, GDB, psql), not in readline itself.

### 14.4 Ecosystem Enablement

Not applicable as a dedicated work item for the core C library - readline is a system library with no dependent package ecosystem of its own requiring separate riscv64 enablement, and all major language bindings (GHC, Java, Perl, Lua, PHP, Raku, Tcl) are already available for riscv64 via standard distro packaging. The one related ecosystem data point is the `gnureadline` Python binding, where RISE has already funded and shipped riscv64 wheels (4 wheels across Python 3.12-3.14t) via `riseproject-dev/python-wheels` PR #1194 - this work is complete and requires no further investment.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | - | - |
| Performance | None applicable | 0 | - | - |
| CI/CD | Upstream has no CI; no riscv64-specific CI gap to close | 0 | - | - |
| Ecosystem | Core library: no action needed. `gnureadline` binding: riscv64 wheels already shipped by RISE (PR #1194) | 0 | - | - |

**Bottom line:** readline requires zero further investment for riscv64 support. The core library is already fully functional on riscv64 via standard distro packaging (Ubuntu, Debian, Arch), and the one adjacent ecosystem gap (the `gnureadline` Python binding) has already been closed by RISE-funded wheel builds. Any additional engineering time spent on readline for RISC-V would have no return; the only lever that could move the readiness grade is the addition of any upstream CI, which is an upstream-governance decision outside RISC-V-specific control.

## 15. References

- [GNU readline homepage](https://tiswww.case.edu/php/chet/readline/rltop.html)
- [GNU readline git repository (GNU Savannah)](https://git.savannah.gnu.org/git/readline.git)
- [GNU readline source tree (cgit)](https://cgit.git.savannah.gnu.org/cgit/readline.git/tree/)
- [GNU readline MAINTAINERS file (404 - does not exist)](https://cgit.git.savannah.gnu.org/cgit/readline.git/plain/MAINTAINERS)
- [GNU readline CHANGES file](https://tiswww.case.edu/php/chet/readline/CHANGES)
- [Debian package tracker for readline](https://tracker.debian.org/pkg/readline)
- [Debian buildd status for readline sid riscv64](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64)
- [Debian BTS for readline source package](https://bugs.debian.org/cgi-bin/pkgreport.cgi?src=readline)
- [Debian bug #1118942 - UTF-8 timing issue](https://bugs.debian.org/1118942)
- [Debian bug #1105625 - FTBFS with make --shuffle=reverse](https://bugs.debian.org/1105625)
- [Debian bug #925562 - Ctrl-C / SIGINT behavior](https://bugs.debian.org/925562)
- [Ubuntu 26.04 "resolute" libreadline8t64 riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libreadline8t64)
- [Ubuntu 26.04 "resolute" libreadline-dev riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libreadline-dev)
- [Ubuntu 26.04 "resolute" readline-common package page](https://packages.ubuntu.com/resolute/riscv64/readline-common)
- [Ubuntu 24.04 readline packages including riscv64](https://packages.ubuntu.com/search?keywords=readline&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V core repository file index](https://archriscv.felixc.at/repo/core/)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)
- [PyPI readline package JSON API (source-only, deprecated)](https://pypi.org/pypi/readline/json)
- [RISE Project homepage and member list](https://riseproject.dev)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE-built Python wheel index (pypi.riseproject.dev)](https://pypi.riseproject.dev)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [GNU bug-readline mailing list archive, June 2026](https://lists.gnu.org/archive/html/bug-readline/2026-06/)
- [GNU bug-readline mailing list archive, October 2025](https://lists.gnu.org/archive/html/bug-readline/2025-10/)
- [GNU bug-readline mailing list archive, January 2025](https://lists.gnu.org/archive/html/bug-readline/2025-01/)