---
title: libunwind
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: critical
  - name: automake
    relation: build-dependency
    criticality: critical
  - name: GNU Libtool
    relation: build-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: libabigail
    relation: test-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libucontext
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libunwind" %}

# libunwind

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for libunwind<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libunwind is a portable C library for determining the call chain of a program at runtime. It supports local unwinding (inspecting the current process stack), remote unwinding (inspecting another process via ptrace), and execution context save/restore. It is used as a backend by profilers, crash reporters, C++ exception handlers, and debuggers.

**License:** MIT (the Savannah project page describes it as the equivalent "X11 license").

**Governance:** libunwind is not part of the GNU Project despite the nongnu.org homepage; it is hosted on Savannah's "non-GNU software" area, which GNU Savannah provides to any free-software project. Original Savannah project admins are Arun Sharma, Dave Watson, and David Mosberger-Tang (Mosberger-Tang, at HP Labs, originated the library for IA-64/HP-UX). There is no formal steering committee, no CII membership, no platform-tier charter, and no PLATFORMS.md or SUPPORT.md in the repository. The GitHub mirror (the canonical development location) currently carries the tagline "in need of new / additional maintainer, mail/open issue if interested," indicating chronic under-resourcing. libunwind is not a RISE member project and does not appear in RISE's Premier or General member lists.

**Corporate affiliations of active contributors** (inferred from commit-email domains; libunwind has no formal "corporate maintainer" designation):
- Stephen M. Webb (bregma) - BlackBerry/QNX (commits under swebb@blackberry.com); de facto lead maintainer and merge gatekeeper for nearly all recent commits, including every RISC-V patch since 2023.
- Matt Turner (mattst88) - Netflix (Senior Software Engineer); most active 2026 contributor, author of the RISC-V ABI baseline work, the elfxx link fix, the rv32 jmp_buf offset fix, and the signal-frame fix series (PR #1059).
- Adam Lackorzynski - Kernkonzept (L4Re microkernel; email @l4re.org); author of the 2025-2026 RISC-V DWARF FP-register fixes.
- Gregory Leocadie (gleocadie) - Datadog; attempted a RISC-V fix in 2024.
- Dave Watson (djwatson) - historically Meta/Facebook (unconfirmed current employer); merged the original RISC-V port in 2021.
- Zhaofeng Li - independent/community contributor; authored the entire initial RISC-V port.

**Community culture on new ports:** No formal review tier or written acceptance policy exists. The project is small and maintainer-constrained but still receptive to new architecture ports on a case-by-case basis: a RISC-V FreeBSD port was accepted in 2025, a LoongArch64 port exists, and an OpenRISC (or1k) Linux port (PR #1057) is actively under review as of 2026. Ports are merged by the single active maintainer (bregma) after ad hoc technical review (register mapping, signal-frame handling, ABI baseline updates) rather than any documented tier/approval process.

RISE has no funded project or blog post about libunwind itself. RISE's only technical touchpoint is indirect: the RISE-funded `python-wheels` project (built on RISE RISC-V Runners) builds and patches two profiler packages, austin-dist and scalene, that depend on libunwind for native stack unwinding on riscv64 (see Section 12).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-12-08 | Issue #99 "risc-v architecture support" opened (original feature request) | [Issue #99](https://github.com/libunwind/libunwind/issues/99) |
| 2020-01-10 | Issue #151 "configure: error: Unknown ELF target: riscv64" opened (build failure on v1.3.1) | [Issue #151](https://github.com/libunwind/libunwind/issues/151) |
| 2021-06-25 | First RISC-V commit (abd15da8), Linux riscv64-only, by Zhaofeng Li | [Commit abd15da8](https://github.com/libunwind/libunwind/commit/abd15da8afb35b92ed0cb2c47f6564775b976c24) |
| 2021-07-06 | PR #267 "Add port for Linux on RISC-V (riscv)" merged by Dave Watson | [PR #267](https://github.com/libunwind/libunwind/pull/267) |
| 2021-08-27 | PR #290 Makefile.am missing riscv header fix merged | [PR #290](https://github.com/libunwind/libunwind/pull/290) |
| 2021-11-26 | v1.6.0 released, first stable release containing the riscv64 port | [v1.6.0 tag](https://github.com/libunwind/libunwind/releases/tag/v1.6.0) |
| 2022-08-10 | Issue #395 (cross-build FP-size/configure errors) closed as a configure-usage issue, not a code defect | [Issue #395](https://github.com/libunwind/libunwind/issues/395) |
| 2023-05-26 | Issue #519 "Ltest-cxx-exceptions fails for Ubuntu20.04-riscv64" opened, still open | [Issue #519](https://github.com/libunwind/libunwind/issues/519) |
| 2023-05-31 | PR #532 merged, XFAIL applied to Ltest-cxx-exceptions on riscv | [PR #532](https://github.com/libunwind/libunwind/pull/532) |
| 2023-06-04 | v1.7.0 released, includes the XFAIL workaround | [v1.7.0 tag](https://github.com/libunwind/libunwind/releases/tag/v1.7.0) |
| 2023-12-14 | PR #684 adds libabigail ABI-diff baselines, riscv included | [PR #684](https://github.com/libunwind/libunwind/pull/684) |
| 2024-01-14 | v1.8.0 released (branch-point for the v1.8 release line, diverging from master) | [v1.8.0 tag](https://github.com/libunwind/libunwind/releases/tag/v1.8.0) |
| 2024-06-11 | Issue #765 "CMake support for RISCV" opened, still open | [Issue #765](https://github.com/libunwind/libunwind/issues/765) |
| 2025-04-19 | PR #854 "riscv: Add dwarf_{put,get}fp for double-size words" opened (fixes RV32D FP-width bug) | [PR #854](https://github.com/libunwind/libunwind/pull/854) |
| 2025-04-28 | Issue #857 "Support for FreeBSD 15 riscv64" opened, still open | [Issue #857](https://github.com/libunwind/libunwind/issues/857) |
| 2025-05-02 | PR #854 merged | [PR #854](https://github.com/libunwind/libunwind/pull/854) |
| 2025-05-23 | PR #866 "add initial freebsd riscv support" merged, direct response to #857 | [PR #866](https://github.com/libunwind/libunwind/pull/866) |
| 2025-08-07 | PR #871 "Implement Gresume for freebsd riscv64" merged | [PR #871](https://github.com/libunwind/libunwind/pull/871) |
| 2025-09-04 | v1.8.3 released, latest tagged release; does not include #866/#871 (those landed on master after the v1.8 branch point) | [v1.8.3 tag](https://github.com/libunwind/libunwind/releases/tag/v1.8.3) |
| 2026-04-02 to 06 | PR #972 "riscv: Fix, simplification and new mode" merged, fixes a dwarf_getfp pointer-misuse bug and adds flen==32-on-rv64 support | [PR #972](https://github.com/libunwind/libunwind/pull/972) |
| 2026-05-28 | PR #1032 "Do not enable C++ exception support on RISC-V by default" opened by andreas-schwab | [PR #1032](https://github.com/libunwind/libunwind/pull/1032) |
| 2026-07-20 | PR #1032 closed unmerged; equivalent fix merged as PR #1035 ("Closes: #1032", commit bda7a226), disabling `--enable-cxx-exceptions` by default globally, not riscv-only | [PR #1032](https://github.com/libunwind/libunwind/pull/1032) |
| 2026-08-31 | Commits `d60002c4` (fixes a riscv32 fatal build bug: link the elfxx helper, not elf64) and `993139bd` (adds rv32 jmp_buf offsets, fixes libunwind-setjmp not building on riscv32) land on master | [Commit d60002c4](https://github.com/libunwind/libunwind/commit/d60002c4) |
| 2026-09-01 to 10 | PR #1050 bumps SONAMEs to .so.11 and adds/regenerates ABI baselines for every cross-compiled architecture including riscv | [PR #1050](https://github.com/libunwind/libunwind/pull/1050) |
| 2026-09-17 to 18 | PR #1059 "Fix unwinding and resuming through signal frames" merged, touches riscv signal-frame handling (validate-flag restore, `use_prev_instr`/`pi_valid` clearing, `dwarf_get()` error checks, `sigcontext_format` reset) | [PR #1059](https://github.com/libunwind/libunwind/pull/1059) |

**Note on release status:** the v1.8.x release line (latest tag v1.8.3, 2025-09-04) was cut from a separate `v1.8-stable` branch that diverged from `master` at the v1.8-branchpoint (2023-11-29); `master` is not a descendant of v1.8.3. As of the checked-out commit (`d9e7b9a`, 2026-09-22), `master` is roughly 440 commits ahead of that branch point and contains the FreeBSD riscv64 work (#866, #871), the global C++-exceptions-default change (#1035), the riscv32 build fixes, the ABI-baseline/SONAME bump (#1050), and the signal-frame fix series (#1059), none of which have shipped in a numbered release as of 2026-09-30.

**Key contributors:** Zhaofeng Li authored the entire initial port (PR #267, PR #290, commit abd15da8), no declared corporate affiliation. kasperk81 authored PR #866 and PR #871 (FreeBSD riscv64 scaffolding), no declared affiliation. Adam Lackorzynski (Kernkonzept) authored PR #854 and the PR #972 fix series. bregma (BlackBerry/QNX) merged the XFAIL (PR #532) and most of the recent riscv-touching work as maintainer gatekeeper. Matt Turner (Netflix) authored the 2026 ABI-baseline, elfxx-link, rv32 jmp_buf, and signal-frame fix commits.

The Linux riscv64 port is fully upstream and has been in stable releases since v1.6.0 (November 2021); there is no out-of-tree patchset. FreeBSD riscv64 support exists only on master, unreleased, and is incomplete (see Section 11).

## 3. Upstream Support Tier

libunwind has no formal tier system, no documented architecture support policy, and no release-blocking SLA per platform. The README lists supported platforms with checkmarks and no tiers.

Evidence-based comparison:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI on every PR/push | Yes | Yes | Yes (QEMU user-mode, autotools + Meson jobs) |
| Tests run in CI (`make check`/`meson test`) | Yes | Yes | Yes, no `qemu_skip`/`qemu_xfail` list (unlike ppc64/sh4/sparc64) |
| CI uses native hardware | Yes | Yes (GitHub-hosted) | No, cross-compile on x86_64 + QEMU emulation only |
| ABI check in CI (libabigail) | Yes | Yes | Yes |
| Gtrace.c (fast unwind path) | Yes | Yes | Absent |
| longjmp.S | Yes | Yes | Absent |
| siglongjmp.S | Yes, full | Yes, full | Stub (bare `ret`) |
| CMake build support | Yes | Yes | No, riscv64 is not an accepted `TARGET` value |
| C++ exception support | Enabled by default | Enabled by default | Disabled by default since the PR #1035 change (globally, not riscv-specific) |
| FreeBSD support | Yes | Yes | Partial, merged but `Gtest-exc` failures reported unresolved |
| Official binary packages | Distro | Distro | Distro (Ubuntu 26.04 "resolute": `libunwind8` 1.8.3-0ubuntu1) |
| GitHub release binaries | None (source tarball only) | None | None |

riscv64 receives full build-and-test CI coverage under QEMU, which is materially better than several other cross targets in the same matrix (ppc64, sh4, sparc64 all carry `qemu_skip` lists for known-broken tests; riscv64 does not). It remains behind amd64/arm64 in feature completeness (Gtrace, longjmp, CMake, native CI hardware).

## 4. Technical Architecture and RISC-V-Specific Subsystems

libunwind's architecture-specific work divides into context save/restore assembly, register maps, signal-frame detection, DWARF register accessors, resume logic, and fast-trace infrastructure. There is no JIT, SIMD, or cryptographic component anywhere in libunwind.

### Component-by-Component Analysis

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| `getcontext.S` / `setcontext.S` | Full | Full | Full | Scalar assembly; saves/restores integer and FP regs, FCSR |
| `siglongjmp.S` | Full | Full | Stub, bare `ret` | Explicitly commented "dummy implementation for now" |
| `longjmp.S` | Full | Full | Absent | Not present in `src/riscv/` at all |
| `Gregs.c`/`Lregs.c` | Full | Full | Partial | Live `/* FIXME: Is IP valid? */` comment |
| `Ginit.c` | Full | Full | Full, with FIXME | `/* FIXME: Floating-point? */` in `uc_addr()` |
| `Gresume.c`/`riscv_local_resume` | Full | Full | Linux-only path; touched by the PR #1059 signal-frame fix series | No JIT backend on any architecture in this repo |
| `Gis_signal_frame.c` | Full | Full | Full (Linux only) | Opcode match for `rt_sigreturn`; `RISCV_SCF_LINUX_RT_SIGFRAME` |
| `Gstep.c` | Large, arch-tuned | Large, arch-tuned | Thin DWARF wrapper | No architecture-specific fast path |
| `Gtrace.c`/`Gstash_frame.c` | Full | Full | Absent | Fast-path profiling/tracing infrastructure entirely unimplemented |
| `dwarf_getfp`/`dwarf_putfp` | Full | Full | Fixed 2025-2026 | PR #854 fixed RV32D width mismatch; PR #972 fixed a pointer-misuse bug producing garbage FP values and added flen==32-on-rv64 support |
| DWARF register map | 66 regs | 96 regs | 66 regs (32 int + 32 fp + 2 pseudo) | No vector (RVV) register slots |
| `UNW_TDEP_CURSOR_LEN` | Tuned | Tuned | 4096, placeholder | `/* FIXME for riscv: Figure out a more reasonable size */` in `include/tdep-riscv/libunwind_i.h` |
| jmp_buf/setjmp offsets | Full | Full | Fixed for rv32 in commit `993139bd` (2026-08-31), previously a fatal build failure | `libunwind-setjmp` did not build on riscv32 before this fix |
| ELF width handling | elf64 | elf64 | `USE_ELFXX` (special-cased with mips/loongarch64 since riscv can be 32- or 64-bit); link bug fixed in commit `d60002c4` (2026-08-31) | riscv is one of only three architectures needing this conditional |
| RVV (vector extension) | N/A | N/A | Absent | Confirmed via GitHub code search: `vfloat32m1_t repo:libunwind/libunwind` and `rvv repo:libunwind/libunwind` both return 0 results |

### ISA Extension Coverage

| Extension | Used | Where |
|---|---|---|
| RV32I/RV64I base integer | Yes | `getcontext.S`, `setcontext.S`, `asm.h` |
| F (single-precision FP) | Yes | `asm.h`, `getcontext.S`/`setcontext.S` (conditional) |
| D (double-precision FP) | Yes | `asm.h`, `libunwind_i.h` |
| RVV (Vector) | No | Not referenced anywhere in the repository |
| Zba/Zbb/Zbc bitmanip | No | Not applicable to this library |

The port is architecturally complete for its purpose (DWARF CFI-based stack unwinding, signal-frame handling, ptrace/coredump register access, get/setcontext) and is wired into both build systems, CI, and ABI-compatibility tracking on par with x86_64, aarch64, ppc64, s390x, and loongarch64. It covers only scalar general-purpose and floating-point registers. There is no vector/SIMD-aware unwinding and no JIT backend for riscv64 (libunwind has no JIT backend for any architecture in this repository, so this is not riscv-specific).

## 5. Build System, Cross-Compilation, and Toolchain

libunwind has no `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `Dockerfile` anywhere in the repository. Build instructions live in `README.md`.

### Meson (primary, canonical per README)

```
meson setup build --prefix=PREFIX
meson compile -C build
meson install -C build
```
`meson.build` requires `meson_version: '>=0.61.0'`, `c_std=c11`, `cpp_std=c++11`. No minimum GCC/Clang version is declared in the build files; CI standardizes on GCC 14 and Clang 18 for native x86 jobs, and GCC 14 exclusively for the riscv64 cross job (no Clang riscv64 cross job exists).

Cross-compiling for riscv64 uses the checked-in cross file `cross/riscv64-unknown-linux-gnu.ini` (binaries: `riscv64-unknown-linux-gnu-{gcc,g++,ar,nm,strip}`, `exe_wrapper` pointing at `meson-qemu-exe-wrapper --qemu=qemu-riscv64`).

Exact CI command (`build-gnu-cross-meson` job, container `ubuntu:26.04`):
```
meson setup build-meson --optimization=g -Dcxx_exceptions=enabled \
  --cross-file cross/riscv64-unknown-linux-gnu.ini \
  --cross-file /tmp/meson-ci-binaries.ini
meson compile -C build-meson -j$(nproc)
meson test -C build-meson -j$(nproc) --timeout-multiplier 2
```
Toolchain packages: `meson ninja-build abigail-tools g++-14-riscv64-linux-gnu qemu-user liblzma-dev:riscv64 zlib1g-dev:riscv64`.

### Autotools (README describes this path as "deprecated, planned for removal", but still runs in CI)

```
autoreconf -i
./configure --prefix=PREFIX
make
make install
```
Exact CI command (`build-gnu-cross` job, matrix `host: riscv64-linux-gnu`, `qemu: riscv64`, `gccver: 14`, container `ubuntu:26.04`):
```
autoreconf -i
mkdir build && cd build
CC=riscv64-linux-gnu-gcc-14 CXX=riscv64-linux-gnu-g++-14 \
../configure --build=$(config/config.guess) \
             --host=riscv64-linux-gnu \
             --with-testdriver="$(pwd)/libtool execute $(pwd)/../scripts/qemu-test-driver" \
             --enable-debug --enable-coredump --enable-cxx-exceptions
CFLAGS="-Wall -Wextra -g -Og -fstrict-aliasing -Wstrict-aliasing -Werror=strict-aliasing" \
  make -C build -j$(nproc)
make -C build/src abi-check
make check -j$(nproc) LOG_DRIVER_FLAGS="--qemu-arch riscv64" \
           QEMU_LD_PREFIX="/usr/riscv64-linux-gnu" \
           LDFLAGS="-L/usr/riscv64-linux-gnu/lib"
```
Toolchain packages: `autoconf automake libtool make g++-14-riscv64-linux-gnu qemu-user xz-utils abigail-tools liblzma-dev:riscv64`.

### CMake: explicitly does not support riscv64

The root `CMakeLists.txt` is Visual Studio/Windows-remote oriented (`message(FATAL_ERROR "This CMake file is currently only designed for building on Visual Studio")` unless the generator matches `^Visual Studio.*$`). Its `$ENV{TARGET}` dispatch recognizes only `x86_64-linux-gnu`, `aarch64-linux-gnu`, `arm-linux-gnueabihf`, `s390x-linux-gnu`, and `loongarch64-linux-gnu`. riscv64 is not an accepted `TARGET` value; a CMake riscv64 build fails with `FATAL_ERROR "Unrecognize value in environment variable TARGET"`. `grep -in riscv CMakeLists.txt` returns no matches. This is tracked as Issue #765, open since 2024-06-11 with no PR filed.

### Feature flags

libunwind has no `-DUSE_X=OFF` CMake convention. Meson uses `-D<option>=disabled|enabled|auto` (`coredump`, `ptrace`, `nto`, `setjmp`, `cxx_exceptions` default `disabled`, `minidebuginfo`, `zlibdebuginfo`, `debug_logs`, etc.); Autotools uses `--enable-X`/`--disable-X`. riscv32/riscv64 are explicitly allow-listed for `coredump` (`meson.build` ~line 255) and `configure.ac` auto-detects `enable_coredump=yes` for the `riscv*` host case. riscv is one of only three architectures (with mips, loongarch64) requiring the `USE_ELFXX` conditional rather than a fixed elf32/elf64 choice, because riscv can be 32- or 64-bit; `configure.ac` sets `use_elfxx=yes` accordingly. A link bug in this dispatch (linking the wrong elf-width helper) caused a fatal riscv32 build failure, fixed in commit `d60002c4` (2026-08-31).

### QEMU usage

Two independent QEMU wrapper mechanisms exist, both riscv64-applicable. Meson's `scripts/meson-qemu-exe-wrapper` invokes `qemu-riscv64 -L <sysroot> -E LD_LIBRARY_PATH=<ldpath> <binary> <args>`, sysroot auto-detected from the cross-gcc, with `--xfail=NAME:NAME` support to turn known-broken tests into SKIP. Autotools uses `scripts/qemu-test-driver` driven by `LOG_DRIVER_FLAGS="--qemu-arch riscv64"`. The package installed in CI containers is `qemu-user` (Ubuntu). riscv64 carries no `qemu_skip`/`qemu_xfail` entries in either CI matrix, unlike ppc64, sh4, and sparc64.

### Known build friction (historical)

Issue #395 (closed 2022-08-10) documented a 1.6.2-era cross-build failure ("Unsupported RISC-V floating-point size", "unknown type name unw_word_t") that turned out to be a configure-usage issue (missing `--build`/`--host` pairing), not a code defect; resolved once the reporter set both flags correctly, per maintainer bregma's guidance.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Local unwinding | Full | Full | Full | None |
| Remote unwinding (ptrace) | Full | Full | Full | None |
| DWARF unwinding | Full | Full | Full | None |
| Signal frame detection/resume | Full | Full | Linux only | Low |
| C++ exception unwinding | Enabled by default | Enabled by default | Disabled by default (global policy change, PR #1035) | High |
| Fast trace path (`Gtrace.c`) | Full | Full | Absent | High |
| Frame cache (`Gstash_frame.c`) | Full | Full | Absent | High |
| `siglongjmp` support | Full | Full | Stub (bare `ret`) | Medium |
| `longjmp` support | Full | Full | Absent | Medium |
| FP register save/restore | Full | Full | Present, fixed 2025-2026 (PR #854, PR #972) | Medium, recently closed |
| `libunwind-setjmp` on riscv32 | N/A | N/A | Fixed 2026-08-31 (was a fatal build error before commit `993139bd`) | Resolved |
| RVV register support | N/A | N/A | Absent | Medium |
| FreeBSD support | Full | Full | Partial, merged but `Gtest-exc` infinite-loop/segfault failures reported | High (blocking for FreeBSD use case) |
| CMake build | Full | Full | Absent | Medium |
| Native CI runner | Yes | Yes | No, QEMU only | Low |

### Performance data

No riscv64-specific benchmark numbers exist in any source found, including the GitHub issue tracker, the RISE blog, and web search. The only real libunwind performance numbers found are for the unrelated LLVM `libunwind` codebase (ClickHouse `llvm-project` PR #131, DWARF unwind-rule caching), which explicitly excludes riscv64 (compiles only on Linux x86-64 and AArch64) and is not part of `libunwind/libunwind`. Data not available: riscv64 vs arm64 or riscv64 vs amd64 throughput/latency for stack unwinding, exception handling, or signal-frame resume on this codebase.

The structural gap is corroborated architecturally: the riscv64 `Gstep.c` is a thin wrapper delegating entirely to generic DWARF unwinding with no architecture-specific optimization, unlike the large, arch-tuned amd64/arm64 implementations, and the fast-trace path (`Gtrace.c`) is entirely absent on riscv64.

### NaN / floating-point semantics

No RISC-V NaN-handling or floating-point-semantics bug was found in any issue or PR search ("riscv nan floating point unwind register" and related queries returned no libunwind-repo hits). The FP-related riscv bugs found were register-width mismatches (RV32D, flen==32-on-rv64), not NaN semantics.

## 7. CI/CD Infrastructure

### Workflow inventory (confirmed by direct file check of the current tree, commit `d9e7b9a`)

| Workflow | riscv64 included | Notes |
|---|---|---|
| [CI-linux-gnu.yml](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-gnu.yml) | Yes | `build-gnu-cross` (autotools) and `build-gnu-cross-meson` (Meson) jobs both include a riscv64 matrix entry |
| CI-freebsd.yml | No | Tests only x86_64 and aarch64, despite the README listing FreeBSD/RISC-V as supported |
| CI-win.yml | No | Windows targets only |
| codeql-analysis.yml | No | Not a build/test CI |
| groom-issues.yml | No | Issue-bot automation, not CI |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository root. A prior musl-libc CI workflow no longer runs riscv64 jobs: the tangential-PR list surfaced merged PR #1054, "remove Linux/musl CI jobs", and a direct file check of the current workflow directory did not find a musl workflow among the files present. Current riscv64 CI coverage is therefore limited to `CI-linux-gnu.yml`.

### CI-linux-gnu.yml detail

- Trigger: `pull_request` (paths filter excluding README/doc, but including this workflow file itself) and `push` to branches matching `v[0-9].*` or `master`. No `workflow_dispatch`, no `schedule`.
- Runner: `ubuntu-24.04` (x86_64 GitHub-hosted), container `ubuntu:26.04` (also x86_64). Both riscv64 jobs cross-compile with `riscv64-linux-gnu-gcc-14` and execute the resulting binaries via QEMU user-mode emulation (`qemu-user`, `qemu-riscv64`). This is cross-compile-plus-emulation, not native riscv64 hardware.
- `build-gnu-cross` matrix entry: `{target: riscv64, host: riscv64-linux-gnu, qemu: riscv64, gccver: 14, container: ubuntu:26.04, dpkg_arch: riscv64}`. Runs `make check` under `--qemu-arch riscv64`, plus `make -C build/src abi-check`.
- `build-gnu-cross-meson` matrix entry: `{host: riscv64-linux-gnu, qemu: riscv64, gccver: 14, container: ubuntu:26.04, meson_cross: riscv64-unknown-linux-gnu, dpkg_arch: riscv64}`. Runs `meson test` via the qemu exe-wrapper.
- No `qemu_skip`/`qemu_xfail` entry exists for riscv64 in either matrix, unlike ppc64, sh4, and sparc64, which all carry documented test-skip lists for known QEMU-related failures. This indicates the full riscv64 test suite currently passes.

### RISE Runners

No RISE runner infrastructure is used by libunwind's CI. Both workflows use standard GitHub-hosted x86_64 runners with container-based cross toolchains and QEMU emulation, not native RISC-V hardware. RISE has no involvement with libunwind's CI (no RISE blog post, no RISE-built package, no RISE runner usage).

### Comparison Table

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI workflows including this arch | 3 (native GNU x2, FreeBSD) | 3 | 1 (CI-linux-gnu.yml, 2 jobs: autotools + Meson) |
| Tests run on every PR/push | Yes | Yes | Yes |
| Native hardware runner | Yes | Yes (GitHub-hosted) | No, QEMU only |
| FreeBSD CI | Yes | Yes | No |
| ABI check | Yes | Yes | Yes |
| Known-flaky test skip list | No | No | No (present for ppc64/sh4/sparc64, absent for riscv64) |

## 8. Distribution and Release Status

**Upstream releases:** libunwind publishes source tarballs only. The v1.8.3 release assets (`libunwind-1.8.3.tar.gz`, `.tar.gz.asc`, `v1.8.3.zip`, `v1.8.3.tar.gz`) contain no architecture-specific binaries of any kind, for any architecture. This is a general upstream policy, not a riscv64-specific gap.

**PyPI:** No `libunwind` package exists on PyPI (`https://pypi.org/pypi/libunwind/json` returns HTTP 404). Not applicable; libunwind is a C library, not a Python package.

**Distribution packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libunwind8` | 1.8.3-0ubuntu1 | Confirmed built, riscv64 listed in the package's architecture line alongside amd64, arm64, armhf, i386, ppc64el, s390x |
| Debian sid | `libunwind-dev` | 1.8.1-0.4 | Installed, built on a riscv64 buildd (rv-osuosl-04) |
| Ubuntu 24.04 "noble" | `libunwind-dev`/`libunwind8` | 1.6.2-3build1 | Available via the ports archive, substantially behind upstream |
| Arch Linux RISC-V | `libunwind` | [NEEDS VERIFICATION] | No entry confirmed in the archriscv packaging tracker at time of research |

**Release provider conclusion:** the only confirmed riscv64 binary release channel is the Ubuntu archive (distro), not an upstream-published binary and not a RISE-built package. This is consistent with the Blue readiness grade's `release_provider: distro`.

**Version currency:** Ubuntu 24.04 ships v1.6.2 on riscv64, missing all RISC-V fixes from 2025-2026 (PR #854, PR #866/#871, PR #972, and the still-unreleased PR #1050/#1059). Ubuntu 26.04's v1.8.3 package is current with the latest tagged release but still predates the unreleased master-branch fixes (FreeBSD riscv64 completion work, the signal-frame fix series, the rv32 build fixes). A user needing the latest riscv64 correctness fixes must build from git master using either Meson or Autotools; no packaged distribution currently ships those fixes.

## 9. Dependencies

libunwind is a C autotools/Meson/CMake project with no package-manager manifest (no `package.json`/`Cargo.toml`/`go.mod`). Dependencies below are drawn from `configure.ac`, `meson.build`, `meson_options.txt`, and the CI workflow's package-install steps.

| Name | Role | riscv64 status | Notes |
|---|---|---|---|
| GCC | Build dependency, critical | Green | `riscv64-linux-gnu-gcc-14` used throughout CI; Ubuntu 26.04 package `g++-14-riscv64-linux-gnu`. No hardcoded riscv64 `-march`/`-mabi` flags in the build files |
| autoconf | Build dependency, critical | Host tool, not riscv64-specific | Runs on the x86_64 CI runner to generate the Autotools `configure` script; not itself compiled for riscv64 |
| automake | Build dependency, critical | Host tool, not riscv64-specific | Same as autoconf |
| libtool | Build dependency, critical | Host tool, not riscv64-specific | Used both for the build and as the wrapper for the Autotools QEMU test driver (`libtool execute`) |
| Meson | Build dependency, critical | Host tool, requires `>=0.61.0` | The primary, README-canonical build system; ships a dedicated `cross/riscv64-unknown-linux-gnu.ini` cross file |
| Ninja | Build dependency, optional | Host tool, `ninja-build` Ubuntu package installed alongside Meson in CI | Default Meson backend |
| CMake | Build dependency, optional | Red for riscv64 | `CMakeLists.txt` explicitly does not accept riscv64 as a `TARGET` value and is otherwise Visual Studio oriented (Issue #765, open) |
| QEMU | Test dependency, critical | Green | `qemu-user` package providing `qemu-riscv64`; used by both the Meson exe-wrapper and the Autotools test driver; no riscv64 test-skip list exists |
| libabigail | Test dependency, optional | Green | `abigail-tools` Ubuntu package; riscv ABI baselines exist at `src/abi/riscv/linux-gnu/{32,64}/` (10 XML files), kept current via PR #684 and PR #1050 |
| xz (liblzma) | Runtime dependency, optional | Green (build), partial (test) | Gated behind `--enable-minidebuginfo`/`-Dminidebuginfo`, used only to decompress LZMA-compressed `.gnu_debugdata` ELF sections. Debian sid ships 5.8.3-1 built on riscv64; Arch Linux RISC-V ships 5.8.3-1; Ubuntu carries it via the ports archive (not main), lagging upstream. xz has no dedicated riscv64 CI runner and no hardware CRC acceleration path for riscv64 (generic C fallback); neither gap is libunwind-blocking, since libunwind uses only section decompression |
| zlib | Runtime dependency, optional | Green | Same `--enable-minidebuginfo`/`-Dzlibdebuginfo` gating, used for zlib-compressed `.gnu_debugdata` sections. Debian sid ships 1.3.2-3 on riscv64; Arch Linux RISC-V ships 1:1.3.2-3; Ubuntu ships zlib1g in the main archive. No dedicated riscv64 CI in madler/zlib, not release-blocking |
| libucontext | Runtime dependency, optional | Green, narrower relevance now | Needed only for musl builds lacking native `ucontext`; packaged for riscv64 in Alpine edge. Its CI-tested relevance has shrunk since PR #1054 removed the project's Linux/musl CI jobs, so musl-on-riscv64 is no longer continuously verified upstream |

**Indirect/test-only dependencies identified via research (not part of the direct list but load-bearing for CI):** `libgcc_s` (provides `_Unwind_Resume` for the now-opt-in C++ exception path; ships with the GCC riscv64 cross-toolchain, green), `libpthread` and `libdl` (POSIX threading/dynamic-loading, used by tests only, standard on riscv64 Linux, green).

No dependency in this table has a JIT, SIMD-dispatch, or cryptographic component relevant to riscv64 enablement. liblzma 5.6+ includes a RISC-V BCJ filter (`HAVE_ENCODER_RISCV`), the largest filter in that project, but it is a compression-format concern unrelated to libunwind's use of xz, which is limited to section decompression.

## 11. Known Bugs and Active Issues

### Open

| ID | Title | Opened | Severity | Notes |
|---|---|---|---|---|
| [Issue #519](https://github.com/libunwind/libunwind/issues/519) | Ltest-cxx-exceptions fails for Ubuntu20.04-riscv64 | 2023-05-26 | Medium, effectively mooted rather than fixed | The underlying DWARF-unwind SIGABRT was never root-caused. It was sidestepped by PR #1035, which disables `--enable-cxx-exceptions` by default globally (not riscv-specific). Still open, not formally closed |
| [Issue #765](https://github.com/libunwind/libunwind/issues/765) | CMake support for RISCV | 2024-06-11 | Medium | No PR filed; autotools and Meson both support riscv64, CMake does not |
| [Issue #857](https://github.com/libunwind/libunwind/issues/857) | Support for FreeBSD 15 riscv64 | 2025-04-28 | Medium-High, most-discussed open thread (13 comments) | PRs #866 and #871 added initial scaffolding, but reporter rdunkle34 found real segfaults and an infinite loop in `Gtest-exc` pegging CPU at 100% on 2025-05-24; implementer kasperk81 concluded riscv64/FreeBSD "requires further work." No further activity recorded since |

### Recently merged (correctness fixes)

| ID | Title | Merged | Severity | Description |
|---|---|---|---|---|
| [PR #1059](https://github.com/libunwind/libunwind/pull/1059) | Fix unwinding and resuming through signal frames | 2026-09-18 | High | Multi-arch signal-frame correctness fix set, substantially touching riscv (validate-flag restore, `use_prev_instr`/`pi_valid` clearing, `dwarf_get()` error checks, `sigcontext_format` reset). Unreleased (master only) |
| [Commit d60002c4](https://github.com/libunwind/libunwind/commit/d60002c4) | riscv, loongarch64: link the elfxx helper, not elf64 | 2026-08-31 | Critical for riscv32 | Fatal riscv32 build bug |
| [Commit 993139bd](https://github.com/libunwind/libunwind/commit/993139bd) | riscv: add the rv32 jmp_buf offsets | 2026-08-31 | Critical for riscv32 | `libunwind-setjmp` did not build on riscv32 before this |
| [PR #972](https://github.com/libunwind/libunwind/pull/972) | riscv: Fix, simplification and new mode | 2026-04-06 | Critical | `dwarf_getfp` took the address of a pointer variable rather than casting through it, producing garbage FP register values during stack unwinding on any riscv build exercising FP register access; also adds flen==32-on-rv64 support |
| [PR #854](https://github.com/libunwind/libunwind/pull/854) | riscv: Add dwarf_{put,get}fp for double-size words | 2025-05-02 | High | Fixed RV32D FP register width mismatch, previously causing corrupt FP register values |

### Closed/historical context

Issue #395 (build friction, closed as a configure-usage issue, 2022-08-10), Issue #151 ("Unknown ELF target: riscv64", closed 2023-06-23), Issue #99 (original 2018 tracking issue, closed 2019-06-12, superseded by PR #267), Issue #531 (duplicate of #519, closed not-planned, 2023-05-31).

### Discrepancy note

The originating PR for the C++-exceptions-default policy change, PR #1032 ("Do not enable C++ exception support on RISC-V by default"), was itself closed unmerged on 2026-07-20; the actually-merged fix is PR #1035 (commit `bda7a226`, "Closes: #1032"), which generalizes the change to disable `--enable-cxx-exceptions` by default on all architectures, not riscv-specifically. Some summary sources (including the readiness-grading justification in Section 13) refer to this fix as "PR #1032 merged"; the PR-level verification against the GitHub PR pages and a full git clone's merge history shows the actual merged commit is under PR #1035. Both PRs are cited here per the project's verification policy given this discrepancy.

## 12. Objections and Upstream Blockers

No stated architectural objection to riscv64 support exists. The initial port (PR #267) was accepted without controversy, and the two most recent riscv64-adjacent architecture ports (FreeBSD/riscv64 in 2025, OpenRISC under review via PR #1057 in 2026) show continued receptiveness.

**C++ exception support:** The PR #1032/#1035 debate reveals the maintainers' actual rationale is not a riscv-specific technical objection but a general policy stance. When contributor mattst88 pushed back that C++ exception support looked functional on RISC-V per CI, author andreas-schwab replied "It's incompatible," and maintainer bregma reframed the decision: "I don't think the C++ language runtime should be built by default on any target," citing risk that distro packagers could inadvertently replace vendor-supplied C++ runtimes. The underlying riscv64 DWARF-unwind abort that originally motivated Issue #519 was never root-caused; it was made moot rather than fixed.

**Maintainer bandwidth:** The repository explicitly states it needs additional maintainers. All riscv64-specific fixes in 2025-2026 (PR #854, #866, #871, #972, and the rv32 build fixes) came from external contributors (Adam Lackorzynski/Kernkonzept, kasperk81, Zhaofeng Li-successor contributors) rather than a maintainer with dedicated riscv64 ownership.

**Missing Gtrace.c:** No upstream interest in implementing the fast-trace path for riscv64 has been expressed in any issue or PR found. No contributor has raised the topic.

**siglongjmp.S stub:** The dummy `ret` implementation has been in the repository since the initial 2021 port with no objection and no open work item.

**FreeBSD riscv64:** Issue #857 is the clearest current blocker: real segfaults and an infinite CPU-pegging loop in `Gtest-exc` were reported by the hardware tester (rdunkle34) on 2025-05-24, and implementer kasperk81 explicitly concluded more work is needed. No further comment is recorded since, suggesting the thread has stalled for lack of a contributor with FreeBSD/riscv64 hardware access.

**Acceptance probability for new riscv64 work:** High for correctness fixes; all riscv64 PRs in the 2025-2026 window (PR #854, #866, #871, #972, the rv32 build fixes) were merged within days to weeks of opening. More complex contributions (Gtrace implementation, longjmp, RVV register support) would require review by someone with both riscv64 hardware and libunwind internals knowledge, which is scarce in the current contributor pool.

**RISE's indirect touchpoint:** RISE does not fund or blog about libunwind, and libunwind is not among the packages RISE's `wheel_builder`/`python-wheels` project lists as built. However, RISE's `python-wheels` project (`riseproject-dev/python-wheels`, built on the RISE RISC-V Runners, publishing at `pypi.riseproject.dev`) builds two profiler packages that depend on libunwind for native stack unwinding on riscv64: austin-dist (the `austinp` native-stack-sampling variant segfaults on riscv64 inside libunwind's `_Uelf64_lookup_symbol_from_dynamic`/`_Uriscv_get_proc_name` ELF symbol lookup, so the riscv64 wheel ships plain `austin` without native unwinding, PR #2148) and scalene (whose own Python-side platform allowlist excluded riscv64 despite libunwind's `src/riscv/` supporting the `UNW_LOCAL_ONLY` API it needs, fixed via a RISE patch, PR #2343). These are downstream workarounds for gaps in libunwind or its consumers, not contributions to libunwind itself.

## 13. Readiness Assessment

**Color:** Blue<br/>
**Release provider:** distro

**Justification:** Upstream CI ([`.github/workflows/CI-linux-gnu.yml`](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-gnu.yml), both the autotools `build-gnu-cross` and the `build-gnu-cross-meson` jobs) cross-compiles for `riscv64-linux-gnu` and runs the full `make check`/`meson test` suite under QEMU user-mode emulation on every PR and push to master, with no `qemu_skip` list for riscv64 (unlike ppc64/sh4/sparc64), indicating the test suite currently passes. Since this is build-and-test (not build-only), and since upstream GitHub releases are source-only tarballs with no architecture-specific binaries (confirmed on the v1.8.3 release assets), this meets build=yes/test=yes/release=no, which is Blue per the color table. The only confirmed riscv64 binary release channel is Ubuntu (`libunwind8` 1.8.3-0ubuntu1, riscv64 listed in the architecture line for Ubuntu 26.04 "resolute"), i.e. release_provider=distro rather than upstream, so it does not qualify for Green.

**Pending work that could change the grade:** Open Issue #765 (CMake support for RISC-V; autotools/Meson only today). Open Issue #857 (FreeBSD 15 riscv64 support; initial scaffolding merged via PR #866/#871 but incomplete, blocked on real `Gtest-exc` segfault/infinite-loop failures). Open Issue #519 (historical `Ltest-cxx-exceptions` riscv64 failure), substantially mitigated by the merged PR #1032 fix disabling C++ exceptions by default on RISC-V (per this research's own PR-verification cross-check, the fix that actually merged is PR #1035, which generalizes the change to all architectures and closes #1032; see the discrepancy note in Section 11). No RISE involvement with libunwind itself (no RISE blog post, no RISE-built package, no RISE runner usage in its CI); RISE's only indirect touchpoint is via downstream consumers (austin-dist, scalene) patching around a riscv64 libunwind symbol-lookup segfault. The `project-graph` MCP server was unreachable during grading (CONNECTION_CLOSED), so the intended SPARQL-based cross-check could not be run; the grade rests on direct CI-file and Ubuntu packages.ubuntu.com verification instead.

## 14. Investment Analysis

RISE has no funded project or published work directly on libunwind. All riscv64-specific work to date has come from individual contributors (Zhaofeng Li, Adam Lackorzynski/Kernkonzept, kasperk81) with no organizational backing, plus indirect downstream patching by RISE's `python-wheels` project for austin-dist and scalene.

### 14.1 Functional Enablement

**Priority 1, fix `siglongjmp.S` stub:** The current implementation is a bare `ret`. This affects any code path that calls `_UI_siglongjmp_cont` or `_UI_longjmp_cont` after unwinding across a setjmp frame. Requires knowledge of the riscv64 setjmp ABI and the libunwind internal resume protocol; a reference implementation exists in arm64's `siglongjmp.S`.

**Priority 2, implement `longjmp.S`:** Related to above; entirely absent for riscv64. Same skill set required.

**Priority 3, stabilize FreeBSD riscv64:** Issue #857's `Gtest-exc` infinite-loop/segfault failures, reported 2025-05-24, remain the live blocker to completing the FreeBSD port that PR #866/#871 started. Requires FreeBSD/riscv64 hardware access (e.g. VisionFive2, as used by the original reporter) and signal-handling debugging.

**Priority 4, add RVV (vector extension) register support:** The DWARF register map has no vector register slots. Code compiled with RVV that saves/restores vector registers in the call frame cannot be correctly unwound. Requires extending DWARF register numbering per the RISC-V ELF psABI specification for vector registers, extending the register map in `dwarf-config.h`/`libunwind-riscv.h`, and adding save/restore assembly. Highest-effort functional item; no upstream work or discussion found on this topic.

**Priority 5, CMake build system for riscv64:** Add riscv64 to the accepted `TARGET` dispatch in `CMakeLists.txt` (Issue #765, open since 2024, no PR). Lower priority since both autotools and Meson already work.

**Priority 6, resolve live FIXME comments:** `Gregs.c` ("Is IP valid?"), `Ginit.c` ("Floating-point?"), `include/tdep-riscv/libunwind_i.h` (`UNW_TDEP_CURSOR_LEN` placeholder). Note that the PR #1059 signal-frame fix series (2026-09) already addressed related correctness gaps (validate-flag restore, `pi_valid` clearing); these specific FIXME comments were not confirmed resolved by that PR and should be re-verified once it ships in a release.

### 14.2 Performance Optimization

**Implement `Gtrace.c`/`Gstash_frame.c` for riscv64:** Highest-impact performance item. The fast-trace path used by profilers is entirely absent on riscv64, while full implementations exist for amd64 and arm64. Requires deep knowledge of riscv64 frame layout, return-address conventions, and the libunwind internal frame-cache API. No quantitative benchmark data exists anywhere to size the expected improvement; data not available.

**Optimize `Gstep.c`:** The riscv64 step function is a thin wrapper delegating entirely to generic DWARF unwinding with no frame-pointer fast path or leaf-function shortcut, both present on mature architectures. Lower priority than Gtrace.

### 14.3 CI/CD Infrastructure

**Native riscv64 runner:** Both current riscv64 CI jobs use QEMU user-mode emulation on x86_64 hosts, not real hardware. QEMU emulation is slower and can mask timing-dependent bugs (plausibly relevant to the FreeBSD `Gtest-exc` infinite loop in Issue #857). RISE's own RISC-V Runners infrastructure (bare-metal riscv64 boards via Scaleway, free GitHub-App CI, `ubuntu-24.04-riscv` label) is a candidate to add here, but libunwind has never adopted it; this would be a new integration, not a resumption of existing RISE work.

**FreeBSD riscv64 CI:** `CI-freebsd.yml` tests only x86_64 and aarch64 despite the README claiming FreeBSD/RISC-V support. Adding riscv64 there would require a FreeBSD riscv64 runner, which does not currently exist in GitHub Actions or RISE infrastructure. Lower priority until Issue #857's functional blockers are resolved.

**Musl coverage:** PR #1054 removed the project's Linux/musl CI jobs entirely, so riscv64-under-musl (relevant to the `libucontext` dependency) is no longer continuously verified upstream in any form.

### 14.4 Ecosystem Enablement

Not applicable. libunwind is a system library with no dependent package ecosystem of its own (no PyPI, npm, Maven, or similar package manager distribution); it is consumed directly by compilers, debuggers, and profiling tools, which each carry their own separate riscv64 enablement status. Section 10 is omitted per the project's category (system library/standalone tool, not a package-ecosystem hub).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `siglongjmp.S` stub, implement proper `_UI_siglongjmp_cont`/`_UI_longjmp_cont` for riscv64 | 2 | Upstream contributor (riscv64 ABI expertise) | High |
| Functional | Implement `longjmp.S` for riscv64 | 1 | Same as above | High |
| Functional | Stabilize FreeBSD riscv64 (resolve `Gtest-exc` infinite loop/segfault, Issue #857) | 4 | Contributor with FreeBSD/riscv64 hardware | High |
| Functional | Add RVV (vector extension) register support: DWARF map, save/restore assembly, register accessors | 8 | riscv64 ABI expert + libunwind internals knowledge | Medium |
| Functional | Resolve live FIXME comments in `Gregs.c`, `Ginit.c`, `libunwind_i.h` (re-verify against PR #1059) | 1 | Upstream contributor | Medium |
| Performance | Implement `Gtrace.c` and `Gstash_frame.c` for riscv64 | 10 | Senior engineer, riscv64 frame layout + libunwind internals | High |
| Performance | Optimize `Gstep.c` with frame-pointer fast path and leaf-function shortcut | 4 | riscv64 engineer | Medium |
| CI/CD | Add a native riscv64 runner to `CI-linux-gnu.yml` (candidate: RISE RISC-V Runners) | 2 | Infrastructure | Medium |
| Functional | CMake build system support for riscv64 (Issue #765) | 3 | Build system engineer | Low |

## 15. References

- [Issue #99: risc-v architecture support (2018-12-08)](https://github.com/libunwind/libunwind/issues/99)
- [Issue #151: configure error Unknown ELF target riscv64 (2020-01-10)](https://github.com/libunwind/libunwind/issues/151)
- [PR #267: Add port for Linux on RISC-V (merged 2021-07-06)](https://github.com/libunwind/libunwind/pull/267)
- [Commit abd15da8: Add port for Linux on RISC-V (2021-06-25)](https://github.com/libunwind/libunwind/commit/abd15da8afb35b92ed0cb2c47f6564775b976c24)
- [PR #290: Makefile.am Add missing riscv header to noinst (merged 2021-08-27)](https://github.com/libunwind/libunwind/pull/290)
- [Issue #395: failed to cross build libunwind for riscv64 (2022-07-29, closed)](https://github.com/libunwind/libunwind/issues/395)
- [Issue #519: Ltest-cxx-exceptions fails for Ubuntu20.04-riscv64 (2023-05-26, open)](https://github.com/libunwind/libunwind/issues/519)
- [Issue #531: riscv64-linux fails Ltest-cxx-exceptions (2023-05-31, closed)](https://github.com/libunwind/libunwind/issues/531)
- [PR #532: Temporarily XFAIL Ltest-cxx-exceptions for riscv (merged 2023-05-31)](https://github.com/libunwind/libunwind/pull/532)
- [PR #684: Add use of libabigail for ABI checks (merged 2024-05-14)](https://github.com/libunwind/libunwind/pull/684)
- [Issue #765: CMake support for RISCV (2024-06-11, open)](https://github.com/libunwind/libunwind/issues/765)
- [PR #854: riscv Add dwarf_{put,get}fp for double-size words (merged 2025-05-02)](https://github.com/libunwind/libunwind/pull/854)
- [Issue #857: Support for FreeBSD 15 riscv64 (2025-04-28, open)](https://github.com/libunwind/libunwind/issues/857)
- [PR #866: add initial freebsd riscv support (merged 2025-05-23)](https://github.com/libunwind/libunwind/pull/866)
- [PR #871: Implement Gresume for freebsd riscv64 (merged 2025-08-07)](https://github.com/libunwind/libunwind/pull/871)
- [PR #972: riscv Fix, simplification and new mode (merged 2026-04-06)](https://github.com/libunwind/libunwind/pull/972)
- [PR #1032: Do not enable C++ exception support on RISC-V by default (closed unmerged 2026-07-20)](https://github.com/libunwind/libunwind/pull/1032)
- [PR #1050: Bump SONAMEs to .so.11 and add ABI baselines for every cross-compiled architecture (merged 2026-09-10)](https://github.com/libunwind/libunwind/pull/1050)
- [PR #1059: Fix unwinding and resuming through signal frames (merged 2026-09-18)](https://github.com/libunwind/libunwind/pull/1059)
- [Commit d60002c4: riscv, loongarch64, link the elfxx helper not elf64 (2026-08-31)](https://github.com/libunwind/libunwind/commit/d60002c4)
- [Commit 993139bd: riscv, add the rv32 jmp_buf offsets (2026-08-31)](https://github.com/libunwind/libunwind/commit/993139bd)
- [CI-linux-gnu.yml workflow](https://github.com/libunwind/libunwind/blob/master/.github/workflows/CI-linux-gnu.yml)
- [Ubuntu 26.04 resolute libunwind packages](https://packages.ubuntu.com/search?keywords=libunwind&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 noble libunwind packages](https://packages.ubuntu.com/search?keywords=libunwind&suite=noble&searchon=names&section=all)
- [Debian tracker for libunwind](https://tracker.debian.org/pkg/libunwind)
- [libunwind v1.8.3 release](https://github.com/libunwind/libunwind/releases/tag/v1.8.3)
- [libunwind homepage](https://www.nongnu.org/libunwind/)
- [libunwind GitHub repository](https://github.com/libunwind/libunwind)
- [RISE Project blog post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE easy installation of binary Python packages on riscv64 devices (2025-05-14)](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [riseproject-dev/python-wheels PR #2148 (austin-dist riscv64 libunwind segfault workaround)](https://github.com/riseproject-dev/python-wheels/pull/2148)
- [riseproject-dev/python-wheels PR #2343 (scalene riscv64 libunwind allowlist fix)](https://github.com/riseproject-dev/python-wheels/pull/2343)