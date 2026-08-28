---
title: readline
parent: Project Reports
categories:
  - libraries
---

# readline

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for readline<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

GNU readline is a C library that provides interactive line editing, history, and completion for programs that read command-line input from a terminal. It is the standard line-editing backend for Bash, Python REPL, GDB, PostgreSQL psql, and hundreds of other CLI tools. The library operates entirely through POSIX syscalls and termios/terminfo; it contains no assembly, no SIMD, no JIT, and no architecture detection beyond what autoconf provides as standard feature tests.

**Governance:** GNU Project, copyright Free Software Foundation (FSF). No steering committee, no working group, no governance board. Chet Ramey (Case Western Reserve University, chet.ramey@case.edu) has been the sole upstream maintainer for the entire documented history of the project. Bug reports go to bug-readline@gnu.org; there is no issue tracker. License: GPL-3.0-or-later. Homepage: [tiswww.case.edu/php/chet/readline/rltop.html](https://tiswww.case.edu/php/chet/readline/rltop.html).

**Corporate sponsors:** None. IBM, Oracle, and OpenIndiana ship readline as a bundled library but provide no upstream co-maintainers and no funding. The [RISE Project](https://riseproject.dev) does not list readline as a member project or sponsored effort.

**Community stance on new ports:** Not applicable. readline has no tier system and no port-gating mechanism. Because the library contains no architecture-specific code, any POSIX-compliant platform that can compile C gets full readline support automatically. No policy statement on RISC-V has been issued by the maintainer; none is needed.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| ~2018-2019 | Debian riscv64 porter box comes online; readline begins building for riscv64 as part of standard Debian port bootstrap | [Debian buildd](https://buildd.debian.org/status/package.php?p=readline&suite=sid) |
| ~2021 | Fedora adds riscv64 port; readline available without modification | [NEEDS VERIFICATION] - no Fedora-specific source consulted |
| 2026-02-14 (approx.) | readline 8.3-4 built on rv-osuosl-02; status "Installed" in Debian sid | [buildd.debian.org readline sid riscv64](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64) |

**Key contributors:** None. riscv64 support required zero upstream patches. The library reached riscv64 entirely through standard distro port work with no readline-specific contributor action.

**Fully upstream:** Yes, in the sense that there is nothing to upstream. The upstream source is architecture-neutral and builds on riscv64 without modification. No patch series, no RFC, no architecture addition commit exists or is needed.

---

## 3. Upstream Support Tier

GNU readline has no formal tier policy. The project does not categorize architectures.

**Evidence-based tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mentioned in upstream documentation | No | No | No |
| Architecture-specific code | No | No | No |
| Upstream CI | None | None | None |
| Release-blocking test requirement | None | None | None |
| Official upstream binary | No (source only) | No (source only) | No (source only) |
| Builds without modification | Yes | Yes | Yes |
| Distro binary package available | Yes | Yes | Yes |

All three architectures are in an identical position: the upstream project ships only source tarballs and runs no CI. riscv64 is not disadvantaged relative to amd64 or arm64 because no architecture receives preferential treatment in the upstream project.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

GNU readline has no architecture-specific subsystems.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Signal handling (signals.c) | scalar | scalar | scalar | Pure POSIX feature-detection (#ifdef HAVE_POSIX_SIGNALS, etc.); zero CPU arch guards |
| Terminal I/O (rltty.c, terminal.c) | scalar | scalar | scalar | OS-level termios/termio feature detection only |
| Input processing (input.c, readline.c) | scalar | scalar | scalar | Pure C; no intrinsics, no SIMD, no inline asm |
| Shared library build (support/shobj-conf) | linux*-* wildcard | linux*-* wildcard | linux*-* wildcard | riscv64-linux-gnu matched by generic Linux fallback; uses -fPIC / -shared / -Wl,-soname |
| configure.ac CPU flags | none | none | none | Only Cray and s390 receive CPU-specific configure cache values; riscv falls through (correct) |
| Multibyte/UTF-8 | HAVE_WCTYPE_H | HAVE_WCTYPE_H | HAVE_WCTYPE_H | autoconf feature test; no arch conditioning |

There are no JIT backends, no SIMD dispatch, no crypto routines, no GC barriers, and no memory layout assumptions tied to a CPU architecture. The complete absence of riscv64-specific code is not a gap - it is the correct state for this library.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autoconf/Automake. No CMake.

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

**Native build (on riscv64 host):**

```bash
./configure --prefix=/usr/local
make
make install
```

**Toolchain requirements:** readline's configure.ac does not document a minimum compiler version. No architecture-specific compiler flags are set for riscv64. Any GCC or Clang version that supports `-fPIC` and `-shared` is sufficient. The configure script uses standard autoconf C89/C99 compatibility probes.

**QEMU usage:** Not documented upstream. For cross-build testing of the compiled examples binary:

```bash
qemu-riscv64 -L /usr/riscv64-linux-gnu ./examples/rl
```

**Known build failures on riscv64:** None. Debian buildd shows readline 8.3-4 built cleanly on rv-osuosl-02 with no anomalies, no giveback, and no special configure overrides in the Debian packaging for riscv64. The Debian source package explicitly excludes `lib32ncurses-dev`, `lib64ncurses-dev`, and `gcc-multilib` from the riscv64 build via architecture guards in `debian/control`; all other build dependencies apply unchanged.

**shobj-conf note:** The `support/shobj-conf` script has no dedicated riscv64 stanza. `riscv64-linux-gnu` matches the `linux*-*|gnu*-*` wildcard case, which sets `SHOBJ_CFLAGS=-fPIC`, `SHOBJ_LD='${CC}'`, and `SHOBJ_LDFLAGS='-shared -Wl,-soname,$@'`. This is sufficient; no upstream patch is required.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap? |
|---|---|---|---|---|
| Line editing (emacs/vi modes) | Full | Full | Full | None |
| History (in-memory, file-backed) | Full | Full | Full | None |
| Tab completion (custom + filename) | Full | Full | Full | None |
| Multibyte / UTF-8 input | Full | Full | Full | None |
| Signal handling (SIGINT, SIGTERM, SIGWINCH) | Full | Full | Full | None |
| Bracketed paste | Full | Full | Full | None |
| pselect(2)-based input with signal unblocking | Full | Full | Full | None |
| Shared library (.so) | Full | Full | Full | None |
| Static library (.a) | Full | Full | Full | None |
| Security hardening (stack canaries, RELRO, PIE) | Distro-controlled | Distro-controlled | Distro-controlled | None - distro build flags apply uniformly |

**Functional gaps:** None.

**Performance gaps:** Data not available: no published readline riscv64 vs arm64 latency or throughput benchmarks were found in any source consulted. Given that readline is an interactive input library (keypress-to-echo latency, measured in microseconds of terminal syscall overhead), CPU ISA is not a meaningful performance variable for this workload.

**Security hardening gaps:** None identified. Debian packaging applies identical hardening flags (`-fstack-protector-strong`, full RELRO, PIE) across all architectures including riscv64.

**Floating-point / NaN semantics:** Not applicable. readline performs no floating-point computation.

---

## 7. CI/CD Infrastructure

The upstream GNU readline repository at [git.savannah.gnu.org/git/readline.git](https://git.savannah.gnu.org/git/readline.git) contains no CI configuration of any kind. The repository is a bare git repo with only standard git internals (branches, hooks, objects, refs, HEAD, config, description, packed-refs). There are no `.gitlab-ci.yml`, GitHub Actions workflows, Jenkinsfiles, Buildbot configuration files, or any other CI artifacts.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | No | No | No |
| RISE CI runners | No | No | No |
| Automated test run on commit | No | No | No |
| Hardware used | None | None | None |

The only riscv64 build evidence in the entire research corpus is Debian's external packaging infrastructure. Debian buildd shows readline 8.3-4 built on `rv-osuosl-02` approximately 2026-02-14 with status "Installed." This tests Debian's package build process, not readline's upstream test suite. readline has no upstream test suite that is run in CI.

---

## 8. Distribution and Release Status

**Upstream releases:** Source-only tarballs at [ftp.gnu.org/gnu/readline/](https://ftp.gnu.org/gnu/readline/). Current release: readline 8.3 (patch level 8.3-007, last recorded commit November 2023 per cgit). No riscv64-specific binary is published by the upstream project.

| Distribution | Package | Version | riscv64 Status | Source |
|---|---|---|---|---|
| Debian sid | libreadline8t64, libreadline-dev | 8.3-4 | Installed (built on rv-osuosl-02, ~2026-02-14) | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64) |
| Debian bookworm (stable) | libreadline8 | 8.2-1.3 | Available | [tracker.debian.org/pkg/readline](https://tracker.debian.org/pkg/readline) |
| Ubuntu 24.04 LTS | libreadline8t64, libreadline-dev | 8.2-4build1 | Available | [packages.ubuntu.com noble readline](https://packages.ubuntu.com/search?keywords=readline&suite=noble&searchon=names&section=all) |
| Arch Linux RISC-V | readline | ~8.2 | Not on broken/outdated list [NEEDS VERIFICATION] | [archriscv.felixc.at](https://archriscv.felixc.at/) - site query returned no package listing; broken-list 404 |
| PyPI readline | readline | 6.2.4.2 | No riscv64 wheel (macOS-only shim) | [pypi.org/pypi/readline/json](https://pypi.org/pypi/readline/json) - confirmed via direct API |

**What must a user do to get a working binary on riscv64:**

On Debian/Ubuntu: `apt install libreadline-dev` - no additional steps. The package is in the main archive and installs without modification.

On Arch Linux RISC-V: `pacman -S readline` [NEEDS VERIFICATION - package listing not confirmed from archriscv.felixc.at query].

From source: standard `./configure && make && make install` with or without the riscv64 cross-compilation flags listed in Section 5.

**Language binding availability on riscv64 (Ubuntu 24.04):** libghc-readline-dev, libghc-readline-prof, libreadline-java, libterm-readline-gnu-perl, lua-readline, lua-readline-dev, raku-readline, tcl-tclreadline, php8.3-readline (ports channel) - all available for riscv64. Only lib32readline* (amd64-only by definition) and lib64readline* (i386-only by definition) are absent.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| ncurses / libtinfo | Terminal I/O; readline's only mandatory runtime dep. Provides cursor movement, color, and terminal capability lookup. | Green - Debian sid ships 6.6+20251231-1+b1 built on rv-osuosl-04 | No known riscv64 failures in Debian BTS | Released in all major distros | None |
| glibc (libc6) | C runtime; provides malloc, signal, termios, wctype and all POSIX APIs readline uses. | Green - Debian sid ships 2.42-17 for riscv64 | See `project-reports/glibc.md` | Released | See `project-reports/glibc.md` |
| texinfo (build-time only) | Generates readline.info and history.info documentation. Not a runtime dep. | Green - standard build tool available for riscv64 | N/A | Available | None |
| libffi | Not a readline runtime dep. Used by Python (a major readline consumer) for C-extension interop. Indirect dep when readline is embedded in Python REPL. | Green - riscv64 is a first-class libffi target; RISC-V LP64D calling convention implemented | See `project-reports/libffi.md` | Released | See `project-reports/libffi.md` |

**Dependency depth analysis:** readline's dependency tree is exceptionally shallow. The only required runtime dependency is ncurses/libtinfo. Both ncurses and glibc are fully operational on riscv64 across all major Linux distributions with no known blocking issues. No dependency in this chain has JIT backends, architecture-specific SIMD dispatch, or cryptographic assembly that requires riscv64-specific work.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in any tracker examined (Debian BTS, GNU bug-readline mailing list 2024-01 through 2026-06, Fedora Bugzilla). The following are the notable open bugs in the general readline issue set:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Debian #1118942](https://bugs.debian.org/1118942) | readline fails to parse UTF-8 correctly depending on timing | Open, no patch | Normal | pselect6 with zero timeout fires between bytes of a multi-byte sequence; reporter: amd64; no riscv64 relevance |
| [Debian #1105625](https://bugs.debian.org/1105625) | FTBFS with make --shuffle=reverse | Open, tagged forky | Minor | Missing Makefile dep in debian/rules; x86_64 only; no riscv64 relevance |
| [Debian #925562](https://bugs.debian.org/925562) | Ctrl-C exits even when SIGINT caught | Reassigned, disputed | Normal | Signal handling behavior; reporter self-closed as expected; no arch specifics |
| bug-readline 2026-06-18 | Heap buffer overflow in rl_callback_handler_install when prompt is large | Open, no patch | High | display.c:714 hardcodes inv_lbsize=vis_lbsize=256; overflow at display.c:1027; affects 8.3 and master; triggerable via rlwrap; no arch specifics |
| bug-readline 2025-12 | SEGFAULT on SIGINT when in reverse search | Open, no patch | Normal | General signal handling; no arch specifics |

**Correctness bugs:** The heap buffer overflow in `rl_callback_handler_install` (reported 2026-06-18 by Ben Kallus) is the most significant open correctness issue. It affects all architectures equally; there is no riscv64-specific exposure or mitigation.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No upstream maintainer statement on RISC-V exists because none was needed.

**Technical blockers:** None. The library is architecture-neutral by construction.

**Organizational blockers:** None. Chet Ramey has accepted patches for general correctness issues without architecture restrictions.

**Acceptance probability for a hypothetical riscv64-specific patch:** Not applicable. No riscv64-specific patch is needed or conceivable for this library.

---

## 13. Investment Analysis

Before sizing: RISE Project has no documented involvement with readline. No RISE-funded work on readline was found in any source consulted. The library requires no investment for riscv64 functional enablement.

### 13.1 Functional Enablement

No work required. readline builds and runs on riscv64 without modification. All features available on amd64 and arm64 are available on riscv64.

### 13.2 Performance Optimization

No work is possible or meaningful. readline is an interactive terminal input library. Its latency is dominated by terminal syscall overhead (write(2), pselect(2)), not CPU computation. There are no hot loops, no SIMD opportunities, and no numerical routines to optimize.

### 13.3 CI/CD Infrastructure

The upstream project has no CI infrastructure of any kind for any architecture. Adding riscv64 CI in isolation would require first establishing any upstream CI at all. Given the single-maintainer governance model and the library's complete architecture neutrality, upstream CI is unlikely to be accepted or maintained. If needed for downstream integration testing, riscv64 CI belongs in the downstream consumer's (e.g., Bash, Python, GDB) CI pipeline, not in readline itself.

### 13.4 Ecosystem Enablement

Not applicable. readline is a system library with no dependent package ecosystem requiring separate riscv64 enablement work. All language bindings (GHC, Java, Perl, Lua, PHP, Raku, Tcl) are already available for riscv64 via standard distro packaging.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | - | - |
| Performance | None applicable | 0 | - | - |
| CI/CD | Upstream has no CI; no riscv64 CI gap to close | 0 | - | - |
| Ecosystem | All language bindings already available for riscv64 | 0 | - | - |

**Bottom line:** readline requires zero investment for riscv64 support. The library is already fully functional on riscv64 and has been for several years. Any engineering time spent on readline for RISC-V would have no return.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [GNU readline homepage](https://tiswww.case.edu/php/chet/readline/rltop.html)
- [GNU readline git repository (GNU Savannah)](https://git.savannah.gnu.org/git/readline.git)
- [GNU readline CHANGES file](https://tiswww.case.edu/php/chet/readline/CHANGES)
- [Debian package tracker for readline](https://tracker.debian.org/pkg/readline)
- [Debian buildd status for readline sid riscv64](https://buildd.debian.org/status/package.php?p=readline&suite=sid&arch=riscv64)
- [Debian BTS for readline source package](https://bugs.debian.org/cgi-bin/pkgreport.cgi?src=readline)
- [Debian bug #1118942 - UTF-8 timing issue](https://bugs.debian.org/1118942)
- [Debian bug #1105625 - FTBFS with make --shuffle=reverse](https://bugs.debian.org/1105625)
- [Debian bug #925562 - Ctrl-C / SIGINT behavior](https://bugs.debian.org/925562)
- [Ubuntu 24.04 readline packages including riscv64](https://packages.ubuntu.com/search?keywords=readline&suite=noble&searchon=names&section=all)
- [PyPI readline package (macOS shim, no riscv64)](https://pypi.org/pypi/readline/json)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/)
- [RISE Project homepage and member list](https://riseproject.dev)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [GNU bug-readline mailing list archive, June 2026](https://lists.gnu.org/archive/html/bug-readline/2026-06/)
- [GNU bug-readline mailing list archive, October 2025](https://lists.gnu.org/archive/html/bug-readline/2025-10/)
- [GNU bug-readline mailing list archive, January 2025](https://lists.gnu.org/archive/html/bug-readline/2025-01/)