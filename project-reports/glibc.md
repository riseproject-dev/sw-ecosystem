---
title: glibc
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: gawk
    relation: build-dependency
    criticality: critical
  - name: GNU bison
    relation: build-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: test-dependency
    criticality: optional
  - name: GDB
    relation: test-dependency
    criticality: optional
  - name: elfutils
    relation: test-dependency
    criticality: optional
  - name: libcap
    relation: runtime-dependency
    criticality: optional
  - name: libselinux
    relation: runtime-dependency
    criticality: optional
  - name: libaudit
    relation: runtime-dependency
    criticality: optional
  - name: libgd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="glibc" %}

# glibc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for glibc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

glibc is the GNU C Library, the standard system C library for Linux. It implements the POSIX/SUS userspace ABI between the Linux kernel and all userspace software: dynamic linking, syscall wrappers, threading (NPTL), locale, math (libm), and the C standard library. Every binary that runs on a GNU/Linux system depends on it, directly or transitively. There is no practical alternative for production riscv64 Linux systems. Canonical development happens at [sourceware.org/git/glibc.git](https://sourceware.org/git/glibc.git); there is no GitHub-native issue/PR workflow. Patches are submitted as revision series to the [libc-alpha mailing list](https://sourceware.org/pipermail/libc-alpha/), and bugs are tracked in Sourceware Bugzilla. [github.com/bminor/glibc](https://github.com/bminor/glibc) is an unofficial, read-only mirror, archived 2026-02-15; a GitHub issue search against it for "riscv64" returns zero results, confirming no GitHub-native tracking exists for this project.

**Governance.** glibc is a GNU project, copyright-assigned to the Free Software Foundation (FSF), under the GNU LGPL (LGPL-2.0-or-later 1992-2001, LGPL-2.1-or-later since 2001). It is hosted on sourceware.org, infrastructure largely sponsored by Red Hat. A formal Steering Committee ran the project from 2001 (led by Ulrich Drepper) until March 2012, when the committee voted to dissolve itself and moved to a cooperative, community-driven maintainer model. Today five individuals hold "global maintainer" status with no extra decision-making power beyond ordinary maintainers: Ryan Arnold, Maxim Kuvyrkov, Joseph Myers, Carlos O'Donell, and Alexandre Oliva. Day-to-day authority is distributed across per-area and per-port maintainers listed in the MAINTAINERS wiki page; the live MAINTAINERS content could not be fetched directly (sourceware.org's Anubis anti-bot gate blocks automated fetches), so the port-maintainer list below is reconstructed from mailing-list/commit history [NEEDS VERIFICATION].

**RISC-V port maintainers and employers** (from mailing-list and commit history): Palmer Dabbelt (SiFive, later Google/Rivos), Andrew Waterman (SiFive), Darius Rad (Bluespec), DJ Delorie (Red Hat). FSF copyright-assignment paperwork for the port was filed through these contributors' employers, per glibc's standard new-port prerequisite.

**Corporate sponsors active on RISC-V** (from commit records, 2017-2026):

| Organization | RISE membership | Role |
|---|---|---|
| Linaro | Not listed | Largest all-time contributor (Adhemerval Zanella, 52 RISC-V commits) |
| Red Hat | Premier Member | Core maintainers (Joseph Myers, Florian Weimer, Carlos O'Donell) |
| Rivos Inc. | Not listed as a standalone member | Key RISC-V contributors (Palmer Dabbelt, Evan Green) |
| SiFive | Premier Member | Port founders (Palmer Dabbelt, Kito Cheng, Vincent Chen) |
| ISCAS / PLCT Lab (Institute of Software, Chinese Academy of Sciences) | General Member | Active 2025-2026, author of the RVV str*/mem* suite (Yao Zihong) |
| Tenstorrent | Premier Member (confirmed via RISE member list) | Toolchain WG lead, active reviewer (Peter Bergner) |
| SUSE | Not listed | Active (Andreas Schwab, 7 RISC-V commits) |
| Bluespec | Not listed | Named RISC-V port maintainer (Darius Rad, 7 commits) |
| Google | Premier Member | Linker/toolchain (Fangrui Song, 7 commits) |
| Western Digital | Not listed | Former contributor (Alistair Francis, 5 commits, now lead RV32 port author under WDC affiliation) |
| ZTE Corporation | General Member | Active review 2025 (Zheng Ziyang, RVV memcmp/memrchr) |
| SpacemiT | General Member | Hardware used for RVV benchmarking (X60, X100/K3) |
| Andes Technology | General Member | System Libraries WG lead (Ruinland Chuan-Tzu Tsai) who lists glibc/musl-libc experience |

RISE Premier Members overall: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent. General Members include Akeana, Andes Technology, ESWIN, Institute of Software CAS, Canonical, Douyin Vision, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE. [Source: riseproject.dev/members](https://riseproject.dev/members/). glibc itself holds no RISE membership (membership is organizational, not per-project), but several of glibc's RISC-V maintainers work for RISE Premier Members, giving indirect corporate alignment without a formal relationship.

**Community stance on RISC-V.** The port is mature and unambiguously upstream. New RISC-V extension patches (RVV, Zbb, Zbkb, Zicfilp, Zicfiss) go through the standard mailing-list review process with no reported policy resistance to RISC-V as an architecture. The bar for new contributions is technical quality: reviewers (notably Jeffrey Law) push back on microarchitecture-specific tuning before basic correctness is established, and on hand-written assembly where portable C with compiler intrinsics would do. The RISC-V port moved from first public patch series (mid-2017) to a stable glibc release (Feb 2018) in roughly 2-3 months once kernel and toolchain prerequisites were satisfied and copyright paperwork was in order, reflecting a fast, low-friction acceptance path under the post-2012 cooperative model.

---

## 2. Port History and Upstreaming Timeline

glibc's RISC-V "PRs" are mailing-list patch series, not GitHub PRs; each -vN cover letter is superseded by the next revision until one lands. Two ports exist: RV64 (merged glibc 2.27) and RV32 (merged glibc 2.33).

**RV64 port revisions:**

| Revision | Date | Status | Notes |
|---|---|---|---|
| v1 | 2017-06-14 (Palmer Dabbelt) | superseded | Initial RFC-style port, following the Linux kernel port. [Source](https://groups.google.com/a/groups.riscv.org/g/patches/c/jDlPXTvx7DY/m/QHZ7syTjAwAJ) |
| v3 | - | superseded | Addressed ABI/sigcontext, syscall-handling review feedback. [Source](https://groups.google.com/a/groups.riscv.org/g/patches/c/iZTF5dHDr5A) |
| v5 | 2018-01-24 | superseded | rv64gc/lp64 and rv64gc/lp64d marked stable; under 20 testsuite failures on both. [Source](https://sourceware.org/legacy-ml/libc-alpha/2018-01/msg00789.html) |
| v6 | 2018-01-26 | **merged** | Final revision: rv64imac/lp64, rv64imafdc/lp64, rv64imafdc/lp64d. 16-patch series. Testsuite: rv64imac/lp64 5551 pass/26 fail; rv64gc/lp64d 5563 pass/15 fail (failures were expected cross-test gaps and timeouts). [Source](https://sourceware.org/pipermail/libc-alpha/2018-January/090941.html) |

v6 landed as the basis of RISC-V (rv64) support in **glibc 2.27 (2018-02-01)**. The exact merge commit date/hash could not be independently confirmed against the raw git log (sourceware.org's cgit and inbox.sourceware.org are Anubis-blocked); the 2018-01-30/2018-02-01 window is inferred from the mailing-list and release-note evidence [NEEDS VERIFICATION].

**RV32 port revisions:**

| Revision | Date | Status | Notes |
|---|---|---|---|
| RFC v3 | - | superseded | Blocked pending y2038/64-bit time_t infrastructure. [Source](https://public-inbox.org/libc-alpha/87muh79yt2.fsf@xmission.com/T/) |
| RFC v4 | - | superseded | [Source](https://public-inbox.org/libc-alpha/87h86ja82q.fsf@oldenburg2.str.redhat.com/T/) |
| RFC v5 | 2019-08-29 | superseded | [Source](https://public-inbox.org/libc-alpha/alpine.DEB.2.21.1908291723280.4240@digraph.polyomino.org.uk/T/) |
| PATCH v2 | 2020-06-03 (Alistair Francis) | superseded | Moved from RFC to PATCH once 64-bit time_t groundwork existed; 18 patches (9 Francis, 9 Zong Li); 8 QEMU RV32 test failures remaining (ldconfig, file locking, errno handling, DNS resolution, string formatting, locale conversions). [Source](https://sourceware.org/pipermail/libc-alpha/2020-June/114675.html) |
| PATCH v5 | 2020-08-19 | **merged** | 17 patches (11 Francis, 6 Li); required Linux >=5.4; remaining QEMU system-mode test failures: `elf/tst-libc_dlvsym` (+ static variant), `io/tst-lockf`, `stdlib/tst-strfrom` (+ locale variant) - deemed not a showstopper. [Source](https://sourceware.org/pipermail/libc-alpha/2020-August/117086.html) |

PATCH v5 landed as **glibc 2.33 (2021-02-01)**, adding rv32imac/ilp32, rv32imafdc/ilp32, rv32imafdc/ilp32d. Overall: 2 of 9 tracked patch-series revisions merged (one per port); the rest were normal supersession in mailing-list iteration, not rejections.

**Post-merge activity on master** (commit dates from the bminor/glibc mirror):

| Date | Event | Source |
|---|---|---|
| 2023-09-06 | XTheadBb extension string optimization (string-fz[a,i].h) | [commit 3d6fcf1b](https://github.com/bminor/glibc) |
| 2023-12-19 | BZ #31022 fix: feenvupdate missing FE_DFL_ENV check | [commit 802aef27](https://github.com/bminor/glibc) |
| 2023-12-30 | BZ #31151 fix: implement dl_runtime_profile (ltrace/profiling), modeled on LoongArch | [commit 6b326961](https://github.com/bminor/glibc); [Bugzilla #31151](https://sourceware.org/bugzilla/show_bug.cgi?id=31151) |
| 2024-01-22 | Static PIE support for RISC-V | [commit 6edaa12b](https://github.com/bminor/glibc) |
| 2024-02-05 | Bitmanip Zbb: string-fza.h / string-fzi.h using clz/ctz | [commit 25788431](https://github.com/bminor/glibc) |
| 2024-03-01 | Alignment-ignorant memcpy path, hwprobe vDSO call support, multi-arg IFUNC resolvers | [commits e7919e0d, 78308ce7, 587a1290](https://github.com/bminor/glibc) |
| 2024-10-02 | BZ #32228 fix: .preinit_array not aligned to pointer size | [commit a36814e1](https://github.com/bminor/glibc/commit/a36814e1455093fc9ebfcdf6ef39bb0cf3d447da) |
| 2025-04-22 | Sync NT_RISCV_TAGGED_ADDR_CTRL from Linux 6.13 to elf.h | [commit 4e24e4d9](https://github.com/bminor/glibc/commit/4e24e4d936b57f6e7809032f55cc95a4cf4d2396) |
| 2025-05-24 | BZ #32932 fix: __riscv_hwprobe function prototype corrected | [commit 8af8beb1](https://github.com/bminor/glibc/commit/8af8beb1c488dcfec754431c1626979276046545) |
| 2025-06-20 | getrandom vDSO support for RV64 (Linux 6.16+) | [commit fc6f074e](https://github.com/bminor/glibc/commit/fc6f074e0496fb8a8df491641165f4ed3cdaa3a3) |
| 2025-09-03 | Soft-float _FPU_SETCW fixed for GCC 16 warnings | [commit 273f803](https://github.com/bminor/glibc/commit/273f80374aeb7d746352a098b23d9bb85e908ea8) |
| 2025-09-03 | Vector registers added to __SYSCALL_CLOBBERS; GCC 15 + RVV 1.0 enforced at configure time | [commit 47975914](https://github.com/bminor/glibc/commit/47975914fb106b83c42bc0baf6435a0944a23d30) |
| 2025-10-29 | "[PATCH v1 1/1] riscv: Add RVV memset via multiarch/IFUNC" posted (Yao Zihong) | [pipermail thread](https://sourceware.org/pipermail/libc-alpha/2025-October/171680.html) |
| 2025-10-31 | Zbkb-optimized repeat_bytes helper (packh/packw/pack) | [commit 720e8916](https://github.com/bminor/glibc/commit/720e89163702ffa1e921d926b6c36b53c3ccbee4) |
| 2025-12-19 | RVV-optimized memset with IFUNC dispatch merged (first vectorized string/mem function) | [commit 0b8a996f](https://github.com/bminor/glibc/commit/0b8a996f44b5f4c02991f02cd12bf05b17db4576) |

The RISC-V port is fully upstream. No downstream fork carries significant riscv64-specific patches that have not also been submitted to libc-alpha.

---

## 3. Upstream Support Tier

glibc has no formal, published tier system for architecture ports (unlike, for example, Rust's Tier 1/2/3 model). The de facto requirements, inferred from project norms, are: an identifiable committed maintainer, completed FSF copyright-assignment paperwork, upstream toolchain support already in place (binutils, GCC, Linux kernel), and a passing testsuite. Unmaintained architectures are historically dropped rather than demoted to a formal lower tier.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named upstream maintainer | Yes | Yes | Yes (Darius Rad; Palmer Dabbelt and Adhemerval Zanella are the dominant historical contributors but not confirmed as listed MAINTAINERS entries [NEEDS VERIFICATION]) |
| CI - build | Yes (multiple builders) | Yes (multiple builders) | Yes, one dedicated builder (`glibc-ubuntu-riscv`, id 293); a second (`glibc-fedora-riscv`, id 336) exists but its live status was not re-queried in this pass |
| CI - test execution | Yes | Yes | Not confirmed. The in-tree `scripts/build-many-glibcs.py` CI driver is build-only with no QEMU `test_wrapper` configured for riscv64; nothing in the live buildbot API response distinguishes "cross-compiled successfully" from "testsuite executed and passed" |
| Passes full test suite in CI | Yes | Yes | Contradictory evidence (see below) |
| Included in glibc releases | Yes | Yes | Yes, since glibc 2.27 (RV64) / 2.33 (RV32) |
| Debian official port | Yes | Yes | Yes |
| Ubuntu official port | Yes | Yes | Yes |
| Arch Linux RISC-V official port | N/A (x86_64 is Arch's base arch) | Not applicable to this port | Yes |

**Direct contradiction in the CI evidence.** A live query against `glibc-ubuntu-riscv` (builder id 293, [https://builder.sourceware.org/buildbot/api/v2/builders/293](https://builder.sourceware.org/buildbot/api/v2/builders/293)) in this research pass shows the three most recent build IDs (341936, 342526, 342579) all in state "build successful." This directly contradicts an earlier stored snapshot of the same builder (plus `glibc-fedora-riscv`, id 336) recording it as offline (`masterids: []`) with the last five observed runs all FAILURE, last run Jan 28-30 2025 for 293 and Jun 10 2025 for 336. Both statements cannot describe the same continuous state; either the builders were restored and stabilized between the two observation windows, or "build successful" in the newer query reflects only a cross-compile step rather than a full, previously-failing test run. Neither the newer nor the older snapshot's underlying build logs were read in either research pass, so the actual content of a "build successful" result (cross-compile-only vs. cross-compile-plus-test-execution) is unconfirmed. This unresolved ambiguity is the primary driver of the yellow readiness grade (Section 13).

**CI configuration in source tree.** There is no `.gitlab-ci.yml`, `.github/workflows/`, Jenkinsfile, Buildbot config file, `.travis.yml`, `azure-pipelines.yml`, or `Buildconfig` anywhere in the glibc source tree (confirmed by direct 404 responses against the `bminor/glibc` mirror and a full root-listing check). CI is entirely external, run on the shared Sourceware Buildbot instance, whose master configuration (which builders exist, what they run) lives in a separate, non-glibc repository that was not read in this research. The one file inside the glibc tree that mentions riscv64 CI targets at all is `scripts/build-many-glibcs.py`, which defines build configurations, not a CI pipeline with triggers or a scheduler.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Architecture-specific code lives under `sysdeps/riscv/` (core ABI/arch code: `bits/`, `rv32/`, `rv64/`, `rvd/`, `rvf/`, `rvv/`, `nofpu/`, `nptl/`, `multiarch/`, `sys/`), `sysdeps/riscv/multiarch/` (IFUNC/SIMD-style runtime dispatch), and `sysdeps/unix/sysv/linux/riscv/` (the Linux syscall layer). Confirmed directly against the source tree: [sysdeps/riscv](https://github.com/bminor/glibc/tree/master/sysdeps/riscv), [sysdeps/riscv/multiarch](https://github.com/bminor/glibc/tree/master/sysdeps/riscv/multiarch), [sysdeps/unix/sysv/linux/riscv](https://github.com/bminor/glibc/tree/master/sysdeps/unix/sysv/linux/riscv).

| Subsystem | amd64 | arm64 | riscv64 | ISA extensions used | Quality |
|---|---|---|---|---|---|
| ELF entry point (start.S) | Full | Full | Full | Base ISA (gp init via lla) | Hand-written asm |
| Dynamic linker (dl-machine.h) | Full | Full | Full | Base ISA | Hand-written asm + inline asm |
| PLT trampoline (_dl_runtime_resolve) | Full | Full | Full | Base ISA | Hand-written asm |
| PLT profiling trampoline (_dl_runtime_profile) | Full | Full | Full | Base ISA | Hand-written asm, BZ #31151 (2023) |
| setjmp / longjmp | Full | Full | Full | Base ISA + F/D extensions | Hand-written asm |
| clone / clone3 / vfork | Full | Full | Full | Base ISA | Hand-written asm |
| getcontext / setcontext / swapcontext | Full | Full | Full | Base ISA | Hand-written asm |
| TLS (NPTL) | Full | Full | Full | Base ISA (tp register) | C + headers |
| Atomics (atomic-machine.h) | Full | Full | Full | A extension (AMOs: amoswap, amoadd, amomax/minu) via native instructions, not lock-based fallback | C macros with inline asm |
| FP environment (fenv.h) | Full | Full | Full | F/D extensions | C |
| Single/double-precision libm (rounding family: ceil, floor, round, trunc, rint, nearbyint, roundeven, llrint, llround) | Full | Full | Full, hardware fcvt.* with explicit rounding-mode control | F/D extensions | Hand-written, hardware-instruction tuned |
| Bulk of libm (trig, exp/log, pow, etc.) | Full | Full | Shared portable C, no riscv override (normal for all ports) | - | Generic scalar C |
| long double sqrt (e_sqrtl.c) | Full (hardware) | Full (hardware) | soft-fp quad-precision emulation | - | Correct and unavoidable; no RISC-V hardware implements 128-bit quad FP |
| hwprobe vDSO | N/A | N/A | Full on RV64; absent on RV32 (syscall fallback only) | Base ISA | C |
| getrandom vDSO | Full | Full | Full (RV64, Linux 6.16+) | Base ISA | C |
| memset (scalar fallback) | Full | Full | Full | Base ISA | Hand-written asm |
| memset (vector) | Full (SSE2/AVX) | Full (SVE/ASIMD) | Full, merged Dec 2025, IFUNC-dispatched via hwprobe | V extension (RVV), LMUL=m8 | Hand-written asm, but see Section 6 performance caveat |
| memcpy (scalar) | Full | Full | Full, ifunc-dispatched between `__memcpy_noalignment` (hand-tuned, selected only when hwprobe reports fast misaligned access) and `__memcpy_generic` | Base ISA + Zca | Hand-written asm |
| memcpy / memmove / memcmp / strcmp / strlen / strchr / etc. (vector) | Full | Full | Not merged as of this report; a full 18-routine series is under mailing-list review (see Sections 6, 11) | V extension | Pending |
| string byte-broadcast (repeat_bytes) | Full | Full | Full (Zbkb: packh/packw/pack) | Zbkb extension | Inline asm |
| SWAR zero/equal-byte detection (string-fza.h/string-fzi.h) for generic string algorithms | Full | Full | Partial: activates only when compiled with Zbb/Zbkb/Xtheadbb enabled; falls through to plain scalar C on a baseline rv64gc build | Zbb / Zbkb / Xtheadbb (compile-time only) | Conditional, not runtime-adaptive |
| libmvec (vectorized math) | Full (AVX2/AVX512) | Full (SVE) | Not merged; RFC posted Feb 2026 for log/logf | V + D extensions | RFC stage |
| Static PIE | Full | Full | Merged Jan 2024, but see open Bugzilla #33911/#31773 (Section 11) | Base ISA | C + configure probes; correctness bugs open |
| Control Flow Integrity | Full (CET) | Full (BTI/PAC) | Not merged; v3 under review Dec 2025 | Zicfilp / Zicfiss | Not merged |
| IFUNC dispatch framework | Full | Full | Full | Base ISA + hwprobe | C |

**Verdict on port completeness (from a live, direct source-tree inspection performed adversarially in this research pass).** Every ABI-mandatory subsystem - startup, syscalls, dynamic linking/relocation, atomics, TLS, setjmp/longjmp, ucontext, both RV32 and RV64 ABI variants (separate `.abilist` symbol-version manifests per ABI: ilp32/ilp32d/lp64/lp64d) - is fully and correctly implemented in hand-written riscv assembly or C. No TODO/FIXME/"not implemented"/"stub" markers were found anywhere in `sysdeps/riscv` or `sysdeps/unix/sysv/linux/riscv`. This is not a stub port. Performance tuning, by contrast, is genuinely sparse and concentrated: only memcpy and memset have hand-tuned/vector paths, each gated behind a single runtime hwprobe check with a generic-C fallback; the entire rest of the string/mem family (strlen, strcmp, memcmp, memmove, strchr, memchr, strcat, strspn/strstr/strtok, etc.) is plain scalar generic C with no riscv override at all. A claim that riscv64 glibc is "as optimized as" x86_64/aarch64 would be false; a claim that it is "just a stub" is equally false.

**Known limitation in the merged RVV memset.** The IFUNC resolver does not check whether RVV has been disabled via `prctl(PR_RISCV_V_VSTATE_CTRL_OFF)`. A process that disables RVV after startup and then calls `memset()` receives SIGILL. Documented as a known limitation at merge time (commit 0b8a996f, Dec 2025); no fix has landed as of this report.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** glibc uses GNU Autotools (`configure` + `make`), not CMake; its configuration flags are autoconf-style `--enable-*`/`--disable-*`, not CMake-style `-DUSE_X=OFF`. Builds are always out-of-tree.

**Canonical cross-build command:**

```bash
mkdir -p build-riscv64 && cd build-riscv64
../glibc/configure \
  --prefix=/usr \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  --with-headers=/path/to/sysroot/usr/include \
  --enable-kernel=4.15.0 \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++

make -j"$(nproc)"
make install DESTDIR=/path/to/sysroot
```

The GCC cross-compiler itself must be configured separately with `--with-arch=rv64imafdc --with-abi=lp64d --disable-multilib` (or the appropriate ISA/ABI variant); glibc's own configure derives the target ABI from compiler-predefined macros (`__riscv_xlen`, `__riscv_flen`, `__riscv_float_abi_*`), not from a glibc-level flag.

**Three CI build configurations** defined in `scripts/build-many-glibcs.py` (confirmed by direct fetch of the live file, [raw.githubusercontent.com/bminor/glibc/master/scripts/build-many-glibcs.py](https://raw.githubusercontent.com/bminor/glibc/master/scripts/build-many-glibcs.py)):

```python
self.add_config(arch='riscv64', os_name='linux-gnu', variant='rv64imac-lp64',
                 gcc_cfg=['--with-arch=rv64imac', '--with-abi=lp64', '--disable-multilib'])
self.add_config(arch='riscv64', os_name='linux-gnu', variant='rv64imafdc-lp64',
                 gcc_cfg=['--with-arch=rv64imafdc', '--with-abi=lp64', '--disable-multilib'])
self.add_config(arch='riscv64', os_name='linux-gnu', variant='rv64imafdc-lp64d',
                 gcc_cfg=['--with-arch=rv64imafdc', '--with-abi=lp64d', '--disable-multilib'])
```

plus three riscv32/ilp32 equivalents. This script performs cross-compilation only; it contains no QEMU or Docker/container references, and `run-built-tests` is only set to `yes` when a caller separately supplies `test-wrapper`.

**Required toolchain versions with rationale:**

| Dependency | Minimum | Reason |
|---|---|---|
| GCC | 12.1 | "GCC 12.1 or later is now required to build the GNU C Library" - global requirement across all architectures (INSTALL/NEWS) |
| GCC | 15.0 | Required specifically when building with RVV (-march=...v*); enforced in `sysdeps/riscv/preconfigure.ac` |
| GNU Binutils | 2.39 | "GNU Binutils 2.39 or later is now required" globally; R_RISCV_ALIGN and R_RISCV_RELATIVE relocation support needed for static PIE |
| GNU Binutils | 2.45 | Optional, for SFrame support |
| Linux kernel headers | 3.2 (generic floor) / 4.15 (riscv64-specific floor from the original port submission) | `--with-headers`/`--enable-kernel` minimum; 4.15 is the first mainline kernel release with working riscv64 UAPI headers |
| GNU make | 4.0 | Build orchestration |
| gawk | 3.1.2 + MPFR | Test-harness scripts |
| GNU bison | 2.7 | Parser generation |
| Python | 3.4 | Test-infrastructure scripts |

At the time the riscv64 port was originally submitted (2018), the architecture-specific floor was GCC 7.3.0 / Binutils 2.30 / Linux kernel 4.15 - the earliest versions with working riscv64 codegen and relocations. That historical floor is now superseded by the current global minimum (GCC 12.1+/Binutils 2.39+); any current production build should target the current pairing, not the 2018 floor.

**ABI constraints enforced at configure time.** Configure aborts if: the F extension is present without D (F-only is not supported); a single-float ABI (ilp32f or lp64f) is requested (also tracked as an open gap, Bugzilla #30963, Section 11); or the A extension (atomics) is absent.

**Linker relaxation fallback.** If the linker lacks `R_RISCV_ALIGN` support (probed via `libc_cv_riscv_r_align` at configure time), glibc automatically injects `-Wa,-mno-relax` and `-mno-relax`.

**QEMU / test execution.** There is no Dockerfile or QEMU wrapper anywhere in the glibc source tree (confirmed against the `bminor/glibc` mirror's full root listing). Two documented paths exist via the `test-wrapper` make variable:

```bash
# User-mode QEMU via binfmt_misc (the mode used by build-many-glibcs.py-style CI)
make -j"$(nproc)" check test-wrapper='timeout -k 15m 15m' TIMEOUTFACTOR=10

# System-mode, via the in-tree cross-test-ssh.sh, against a real board or qemu-system-riscv64 reachable over SSH
make test-wrapper='/abs/path/to/glibc/scripts/cross-test-ssh.sh riscv64-target-host' check
```

Neither path is wired into `scripts/build-many-glibcs.py` itself; `test-wrapper` must be supplied by whatever external CI system invokes the script, which is consistent with the Section 3 finding that the in-tree build driver is build-only.

**Kernel header installation for riscv64:**

```bash
make -C linux-src headers_install ARCH=riscv INSTALL_HDR_PATH=/sysroot/usr
```

Both riscv32 and riscv64 map to Linux `ARCH=riscv`.

**GCC 16 compatibility.** A soft-float `_FPU_SETCW` macro produced a set-but-not-used warning under GCC 16; fixed September 2025 (commit 273f803). No other GCC 16 issues are documented.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps** (riscv64 cannot do X at all):

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Control Flow Integrity (CFI) | Yes (CET: IBT+SHSTK) | Yes (BTI+PAC) | No | 38-file v3 patch series under review, Dec 2025; the SSP append to jmp_buf is an ABI change; ucontext shadow-stack handling is described by its own author as an "UNSAFE workaround" |
| libmvec (vectorized math) | Yes (AVX2/AVX512) | Yes (SVE) | No | RFC posted Feb 2026 for log/logf only; licensing question raised (possible veclibm derivation); integration approach not yet approved |
| getrandom vDSO on RV32 | N/A | N/A | No | Only RV64 gets the vDSO path; RV32 falls back to the raw syscall |
| F-only ABI / single-float ABI (ilp32f, lp64f) | N/A | N/A | No | Configure aborts; also tracked as open Bugzilla #30963 |
| cacheflush(2) wrapper | N/A | N/A | No | Open Bugzilla #30597: "cacheflush(2) is not implemented on RISC-V" |
| riscv_hwprobe glibc wrapper | N/A | N/A | Partial | Per the RISE RISC-V Optimization Guide, "glibc does not yet support riscv_hwprobe" as a library-level wrapper for application code; developers must issue the raw `__NR_riscv_hwprobe` (258) syscall directly. This is distinct from glibc's internal, IFUNC-only use of the same mechanism for memcpy/memset dispatch |

**Performance gaps** (feature exists but no vectorized implementation, or vectorization is regressed):

| Function(s) | amd64 | arm64 | riscv64 | Status |
|---|---|---|---|---|
| memcpy, memmove, memchr, memcmp, memcmpeq, memccpy, memrchr, strcmp, strcpy, strlen, strncmp, strnlen, strcat, strchr, stpncpy, strncat, strncpy, strrchr | Vectorized | SVE | Scalar only | "[PATCH v5 00/18] riscv: Add RVV str*/mem* routines" (Yao Zihong, ISCAS/PLCT) under review as of Feb 2026, 75 files / 3328 lines |
| log, logf (libmvec) | Vectorized | SVE | Missing | RFC, Feb 2026; not merged |
| atan2f (SPEC2017 WRF benchmark) | Vectorized | Vectorized | Not optimized | RISC-V has no scalar reciprocal estimator, forcing a vector-unit round trip for a scalar operation (tracked as RISE compilers WG issue #66) |

**Contradiction flagged.** One live benchmark source (a GitHub issue on `msyksphinz/bench_trace_env`, [issue #2](https://github.com/msyksphinz/bench_trace_env/issues/2)) states that "glibc 2.44 added RVV-optimized variants of memcmp, memcpy, memmove, strcmp, strcpy, strlen, etc." and that libc.so.6 went from 1 to 20 ifunc-dispatched string/memory functions. This directly contradicts the patch-tracking evidence above (Section 11), which shows the 18-routine RVV str*/mem* series still under mailing-list review as v5 in Feb 2026, with only memset merged as a vectorized routine (Dec 2025, commit 0b8a996f) as of the last confirmed release. This claim is marked [NEEDS VERIFICATION]: either the bench_trace_env issue is describing a downstream/vendor-patched glibc 2.44 build rather than stock upstream, or the 18-routine series landed on master after the patch-status research in this report was gathered and before glibc 2.44's cut, which would itself need independent confirmation against the actual 2.44 release notes.

**Benchmark data found** (where verified, with primary source):

*SPEC CPU2006 (INT) instruction-count reduction, glibc 2.44 vs 2.42, per the above bench_trace_env source:*

| Benchmark | Instruction reduction | Vector-instr share |
|---|---|---|
| 401.bzip2 | 0.71% | 0.04% |
| 403.gcc | 25.32% | 1.50% |
| 429.mcf | 0.00% | 0.00% |
| 445.gobmk | 2.46% | 0.23% |
| 462.libquantum | 0.00% | 0.00% |
| 473.astar | 0.10% | 0.00% |
| 483.xalancbmk | 3.35% | 0.06% |
| Total (7 benchmarks) | 3.70% | 0.18% |

Biggest wins are on string-heavy workloads (gcc); negligible effect on compute-bound benchmarks (mcf, libquantum, astar). Given the contradiction above about which glibc release these figures actually describe, these numbers should be treated as indicative of RVV string/memory routine impact in general, not as a confirmed-upstream 2.44 characteristic.

*Vector memset lmul sensitivity on real SpacemiT X100 (K3) hardware, [Bugzilla #34334](https://sourceware.org/bugzilla/show_bug.cgi?id=34334), comment by anton@ozlabs.org, 2026-06-30 (cycle counts, lower is better):*

| Length | generic_memset (scalar) | upstream __memset_vector (lmul=8) | lmul=2 variant |
|---|---|---|---|
| 1 B | 6.47 | 14.12 (118% slower) | 9.10 (41% slower) |
| 8 B | 6.83 | 14.10 (106% slower) | 9.10 (33% slower) |
| 32 B | 11.38 | 14.10 (24% slower) | 9.10 (20% faster) |
| 128 B | 12.29 | 14.10 (15% slower) | 10.62 (14% faster) |
| 1024 B | 90.66 | 89.31 (1.5% faster) | 89.40 (1.4% faster) |
| 131072 B | 7720.54 | 7153.91 (7.3% faster) | 7102.45 (8.0% faster) |

This shows the currently merged upstream `lmul=8` vector memset regresses badly, up to roughly 118% slower than scalar, for copies under 128 bytes on this out-of-order core; an experimental `lmul=2` variant recovers most of that loss. The bug is unresolved/untriaged (status UNCONFIRMED).

*Context only, not glibc-specific:* LLVM libc's vector memcpy is reported 2-3x faster than glibc's memcpy for sizes up to ~1KB, converging to parity at larger (bus-saturated) sizes ([source](https://news.ycombinator.com/item?id=36025209)). Early QEMU-era testing of glibc's RVV support reportedly showed memcpy running 2x-60x slower than scalar under emulation, attributed to QEMU's vector unit-stride load/store helper overhead rather than representative of real hardware.

**No quantitative riscv64-vs-arm64 glibc benchmark with a documented methodology was found** despite an extensive search of RISE blog content, Phoronix/OpenBenchmarking, and GitHub. Phoronix's search page returned HTTP 403; OpenBenchmarking's `glibc-bench` test page description contained no comparative riscv64/arm64 results; a GitHub repository search for "glibc riscv64 benchmark" returned zero repositories.

**Floating-point correctness.** BZ #31022 (feenvupdate missing FE_DFL_ENV guard) was fixed in 2023. Soft-float nofpu test ULPs were updated in Jan 2025. No open floating-point correctness bugs specific to riscv64 were found beyond the memset vector-path SIGILL issue below.

**Correctness bug: SIGILL on prctl-disabled RVV + memset().** The merged RVV memset IFUNC resolver selects the vector path based on hwprobe without checking whether the process has disabled RVV via prctl. A process that calls `prctl(PR_RISCV_V_VSTATE_CTRL_OFF)` and then calls `memset()` receives SIGILL. Open since the Dec 2025 merge (commit 0b8a996f); no fix submitted as of this report.

**Related kernel-level correctness issue exposed by glibc's RVV code (not a glibc bug itself).** A random memory-corruption bug on SpacemiT K1 hardware (Banana Pi F3, Milk-V Jupiter) affects glibc 2.43 and 2.44 (both ship vector memset/string ops) combined with Linux 7.1.7-1/7.2.2/7.2.6 and OpenSBI 1.9. Root cause: on the first loop iteration, `vle8.v` loads only the first 16 of 256 bytes while `vse8.v` writes the full 256 bytes, a partial vector-load/trap-handling bug pointing to a kernel/hardware vector context-switch defect, not a glibc logic error - but glibc's RVV memset/string routines are what exposes it. Not reproducible under QEMU (timing-dependent); observed after roughly 1 hour on 8 cores with glibc 2.44, 1-2 days with glibc 2.43. Workarounds: disable RVV via device tree, disable THP, or set `RISCV_ISA_V_UCOPY_THRESHOLD=-1`. A kernel fix ("vector_fpu_regs_status_rmw_fix") is in progress but reduces, not eliminates, the issue as of the cited thread. [Source](https://ratatoskr.run/linux-riscv/2026/08/17480175/t); [kernel patch](https://lore.kernel.org/linux-riscv/20260807-vector_fpu_regs_status_rmw_fix-v1-1-0c16848b60db@intel.com/).

---

## 7. CI/CD Infrastructure

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildbot builders | Multiple, active | Multiple, active | 2 dedicated builders: `glibc-ubuntu-riscv` (id 293) and `glibc-fedora-riscv` (id 336) |
| Build CI | Yes | Yes | Contradictory: a live query of builder 293 shows the three most recent runs (341936, 342526, 342579) as "build successful"; an earlier stored snapshot recorded both builders offline with the last five observed runs all FAILURE. See Section 3 for the full discrepancy |
| Test CI | Yes | Yes | Not confirmed either way. `scripts/build-many-glibcs.py`, the in-tree build driver these builders would plausibly invoke, has no QEMU `test_wrapper` configured for riscv64, so a "build successful" state cannot be assumed to include `make check` under QEMU |
| In-tree CI config | No (external Buildbot) | No (external Buildbot) | No |
| RISE pre-commit CI | Not applicable | Not applicable | RISE's Dec 2024 end-of-year update listed glibc as one of seven projects running pre-commit CI on the RISE build farm; the `riseproject-dev/gcc-postcommit-ci` repository includes a `make check-glibc-linux` target. No public dashboard URL for RISE's glibc CI results was found [NEEDS VERIFICATION] |

**RISE infrastructure context.** RISE's build farm runs "thousands of builds and millions of tests per month" across foundational projects including GCC, LLVM, the Linux kernel, GLIBC, and Python, using Scaleway (EU build farm) and OSU OSL (US board farm) infrastructure. Separately, RISE RISC-V Runners (free GitHub Actions on bare-metal Scaleway EM-RV1 hardware) reported 13,000+ jobs across 197 repos and 87 orgs (Mar 19-May 6 2026, 99.78% completion rate); named consumers include llama.cpp, post-quantum crypto libraries, PyTorch out-of-tree CI, kubetail, Home Assistant, k0s, Kairos, NumPy, and pyca/cryptography. **No glibc project is listed as a named consumer of the RISE RISC-V Runner pool** in that report, distinct from the separate pre-commit build-farm claim above.

**Test execution gate.** `run-built-tests` in `scripts/build-many-glibcs.py` is set to `yes` only when `test-wrapper` is externally supplied for a cross build - this is the gate that determines whether `make check` executes anything at all, rather than only building. No evidence was found confirming this gate is set for the riscv64 configurations on either Sourceware buildbot builder.

---

## 8. Distribution and Release Status

**Upstream release channel.** glibc distributes source tarballs only, from [ftp.gnu.org/gnu/glibc](https://ftp.gnu.org/gnu/glibc/). Current release: glibc 2.44, released 2026-07-24. No binary packages of any kind are distributed upstream, for any architecture - this is true across the board, not riscv64-specific, and on its own supports treating downstream distro builds as the operative release channel for a readiness grade (Section 13).

**Commits pending a numbered release** as of the last confirmed tag (glibc-2.42, 2025-07-28) on the bminor/glibc mirror: RVV memset (0b8a996f, Dec 2025), vector-register __SYSCALL_CLOBBERS fix (47975914, Sep 2025), Zbkb repeat_bytes (720e8916, Oct 2025), soft-float GCC 16 fix (273f803, Sep 2025), atomic-machine.h consolidation (1f5d8663, Sep 2025). These are expected in glibc 2.43 when tagged; given glibc 2.44 is confirmed released (2026-07-24), these commits should already be present in a shipped release, which is itself a minor internal inconsistency in the version-tracking evidence gathered across research passes [NEEDS VERIFICATION].

**Distribution packages, directly confirmed in this research pass:**

| Distribution | Package | Version | riscv64 status | Source |
|---|---|---|---|---|
| Ubuntu 26.04 (resolute) | libc6 (core runtime) | 2.43-2ubuntu2 | Official port, confirmed binary filename `libc6_2.43-2ubuntu2_riscv64.deb` | [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/libc6) |
| Ubuntu 26.04 (resolute) | glibc-tools | 0.0~git3.23fd2b9-0ubuntu2 | riscv64 listed alongside amd64, arm64, armhf, i386, ppc64el, s390x | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=glibc&suite=resolute&searchon=names&section=all) |
| Ubuntu 26.04 (resolute) | glibc-doc, glibc-doc-reference, glibc-source | 2.43-2ubuntu2.4 / 2.42-1 | arch `all` (architecture-independent, expected for docs/source packages) | same |
| Ubuntu Noble (24.04) | libc6 | 2.39-0ubuntu8 | Official port, available | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=glibc&suite=noble&searchon=names&section=all) |
| Debian sid | libc6 | 2.43-4 | Official port, installed, built by buildd machine rv-manda-01. Migration to testing blocked by a policy violation that affects all architectures, not riscv64-specific | [tracker.debian.org](https://tracker.debian.org/pkg/glibc); [buildd status](https://buildd.debian.org/status/package.php?p=glibc&suite=sid) |
| Arch Linux RISC-V | glibc, glibc-locales | 2.44+r50+g1848099f063e-1 | Live `.pkg.tar.zst` binaries confirmed present in the `core` repository | [riscv.mirror.pkgbuild.com/repo/core](https://riscv.mirror.pkgbuild.com/repo/core/) |
| Fedora | glibc | 2.44 | Available for riscv64 in rawhide, inferred from commit activity and architecture inclusion, not a direct package-page fetch [NEEDS VERIFICATION] | - |

All three actively verified distributions (Debian sid, Ubuntu, Arch Linux RISC-V) describe their riscv64 glibc build as an "official port" built from unmodified/unpatched upstream source, which independently supports a clean-distro-build distribution floor.

**PyPI is not a glibc distribution channel.** The PyPI package literally named `glibc` (version 0.6.1) is an unrelated, pure-Python ctypes-based wrapper project, not the C library itself. It ships as a single `py2.py3-none-any` wheel plus sdist, with no riscv64-specific artifact - correctly so, since it is architecture-independent. A separate check of the RISE wheel_builder's GitLab PyPI-simple proxy for a package named `glibc` returns an HTTP 302 redirect straight back to upstream PyPI, confirming it hosts no independent `glibc` package of its own.

**What a user must do to get a working binary.** On Debian, Ubuntu, and Arch Linux RISC-V, glibc for riscv64 installs as a standard distribution package with no extra steps. For cross-compilation, a user must build a cross-toolchain (GCC 12.1+ minimum, GCC 15+ if RVV code paths are desired) targeting `riscv64-linux-gnu`, then configure glibc with `--host=riscv64-linux-gnu` and matching kernel headers as shown in Section 5.

---

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| GCC | build-dependency | critical | Available; riscv64 is a first-class GCC target | N/A | Released | GCC 12.1+ globally required; GCC 15+ required specifically for RVV code paths |
| GNU binutils | build-dependency | critical | Available | N/A | Released | 2.39+ required; R_RISCV_ALIGN/R_RISCV_RELATIVE needed for static PIE |
| GNU make | build-dependency | critical | Available | N/A | Released | 4.0+ required for build orchestration |
| gawk | build-dependency | critical | Available | N/A | Released | 3.1.2+ with MPFR, used in build/test-harness scripts |
| GNU bison | build-dependency | critical | Available | N/A | Released | 2.7+, parser generation |
| Linux kernel | runtime-dependency | critical | Available | N/A | Current kernels ship riscv64 support | Syscall ABI; --enable-kernel=4.15 is the riscv64-specific historical floor |
| Python | test-dependency | optional | Available | Tests pass | 3.13.x ships for riscv64 | 3.4+ required for test-harness scripts; see project-reports/python.md |
| GDB | test-dependency | optional | Built for riscv64 | Known issues | Ships riscv64 support | Used for pretty-printer tests; some known test issues documented in prior glibc reports; see project-reports/gdb.md |
| elfutils | test-dependency | optional | Available | Tests pass | Available | Used for debug/test tooling (eu-readelf in the static-PIE probe); see project-reports/elfutils.md; also the tool whose testsuite originally surfaced Bugzilla #24040 |
| libcap | runtime-dependency | optional | Available | Tests pass | Released | nscd SELinux capability support; see project-reports/libcap.md |
| libselinux | runtime-dependency | optional | Available (per prior scope research) | Tests pass | Released | nscd runtime dependency; not in current project-reports scope |
| libaudit | runtime-dependency | optional | Available (per prior scope research) | Tests pass | Released | nscd audit support; not in current project-reports scope |
| libgd | runtime-dependency | optional | Available (transitively via its own zlib/libpng dependencies, see below) | Tests pass | Released | Used by `memusagestat` for graphical memory-usage plots; not itself directly researched in riscv64 packaging in this pass [NEEDS VERIFICATION] |
| libffi | indirect, runtime-dependency | optional | Full riscv64 support | Tests pass | Released | Pulled in transitively by Python's test-harness scripts; see project-reports/libffi.md |
| zlib | indirect, runtime-dependency | optional | Available | Tests pass | Released | Dependency of libgd (memusagestat); see project-reports/zlib.md |
| libpng | indirect, runtime-dependency | optional | Available | Tests pass | Released | Dependency of libgd (memusagestat); see project-reports/libpng.md |
| GNU texinfo | indirect, build-dependency | optional | Available | N/A | Released | 4.7+, documentation build; not present in projects.yml as its own tracked entry |
| GNU sed | indirect, build-dependency | optional | Available | N/A | Released | 3.02+, used in build scripts; not present in projects.yml |
| Perl 5 | indirect, test-dependency | optional | Available | N/A | Released | Used in test scripts and mtrace tooling |
| PExpect | indirect, test-dependency | optional | Pure-Python, architecture-independent | N/A | Available via pip | GDB pretty-printer test harness dependency; not present in projects.yml |

No blocking dependency issue for riscv64 was found in any of the above. The GCC 15 requirement for RVV code paths is the most consequential version constraint in practice: a distribution shipping GCC 14 or earlier cannot enable the RVV memset IFUNC path at all, regardless of glibc version. A project-graph SPARQL cross-check against Ubuntu's exact riscv64 binary package names (e.g. `gcc-14`/`gcc-riscv64-linux-gnu`, `binutils-riscv64-linux-gnu`, `linux-libc-dev`, `libelf-dev`/`libdw-dev`, `libffi-dev`, `zlib1g-dev`, `libpng-dev`, `libcap-dev`, `libselinux1-dev`, `libaudit-dev`, `texinfo`, `sed`, `perl`, `python3-pexpect`) was attempted but could not be executed - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) in every research pass that tried it. This is a tooling failure, not evidence of package absence, and the dependency availability rows above rest instead on direct distro package-page fetches and the upstream `INSTALL` file rather than the graph database.

---

## 11. Known Bugs and Active Issues

**Resolved correctness bugs:**

| ID | Title | Status | Notes |
|---|---|---|---|
| Bugzilla #24040 | riscv64: unterminated call chain in `__thread_start` | RESOLVED FIXED (commit 85bd1ddbdfdfd13cfd06f7c367519b6ed3360843, 2019-02-13) | Backtrace unwinding looped infinitely in `clone.S`; found via the elfutils testsuite; fix marks `ra` as undefined in `__thread_start`. An earlier pass in this research had recorded this bug's status as "NEW"; a direct read of the Bugzilla thread confirms RESOLVED FIXED is the correct, current status - flagged here as a corrected discrepancy, not a live contradiction. [Source](https://sourceware.org/bugzilla/show_bug.cgi?id=24040) |
| Bugzilla #31151 | [RISC-V] missing support for profile/audit PLT setup | RESOLVED FIXED (Aurelien Jarno, 2023-12-30, target milestone 2.39) | The real glibc-side fix for a riscv64 `--enable-bind-now` regression (`elf/tst-audit1/2/8` segfaults) exposed by a binutils relro change. A separately-numbered "Bug 31133" cited in earlier research is actually a **binutils** bug (RESOLVED INVALID); Andreas Schwab determined the real defect was in glibc and had it filed as #31151, the item that should be cited going forward. [Source](https://sourceware.org/bugzilla/show_bug.cgi?id=31151) |
| BZ #32932 | __riscv_hwprobe function prototype wrong (access attribute, argument types, __THROW) | Fixed, glibc 2.42 | Caused false -Wstringop-overread warnings |
| BZ #32228 | .preinit_array not aligned to pointer size | Fixed, glibc 2.41 | Section holds function pointers; alignment was incorrect |
| BZ #31022 | feenvupdate missing FE_DFL_ENV check | Fixed 2023 | Incorrect FP environment handling |
| BZ #32269 / #31317 | IFUNC resolver cannot access gp pointer | Fixed Feb 2025 | SIGSEGV in IFUNC resolver for PIE objects |
| (no BZ) | Vector registers omitted from __SYSCALL_CLOBBERS | Fixed Sep 2025 | Critical: silent data corruption possible for any code with live vector data across a syscall; affected all glibc built with RVV |

**Open bugs (Sourceware Bugzilla, product=glibc, statuses current as of the live query in this pass):**

| Bugzilla ID | Status | Summary |
|---|---|---|
| [#34334](https://sourceware.org/bugzilla/show_bug.cgi?id=34334) | UNCONFIRMED | Vector memset performance regression on SpacemiT X100 (K3); see Section 6 benchmark table |
| [#33911](https://sourceware.org/bugzilla/show_bug.cgi?id=33911) | UNCONFIRMED | SIGSEGV of `--static-pie` binaries on riscv64 (glibc 2.43, Ubuntu 26.04/riscv64 under QEMU); `./elf/ldconfig --help` and any static-pie binary crashes in `_dl_relocate_static_pie()` |
| [#31773](https://sourceware.org/bugzilla/show_bug.cgi?id=31773) | NEW | Build regression: "read-only segment has dynamic relocations" since the static-pie-enabling commit e0590f41fe1e; static-pie test builds fail to link with GCC 14/binutils 2.40; likely shares a root cause with #33911 |
| [#24484](https://sourceware.org/bugzilla/show_bug.cgi?id=24484) | REOPENED | RISC-V libraries can have read-write `.dynamic` sections, but ld.so loads them read-only; long-standing (opened 2019), causes segfaults in dynamically linked code (e.g., D/druntime) |
| [#30963](https://sourceware.org/bugzilla/show_bug.cgi?id=30963) | NEW | glibc does not support the lp64f ABI variant |
| [#30597](https://sourceware.org/bugzilla/show_bug.cgi?id=30597) | NEW | `cacheflush(2)` is not implemented on RISC-V |
| [#29500](https://sourceware.org/bugzilla/show_bug.cgi?id=29500) | UNCONFIRMED | Some tests time out on riscv64 real hardware |
| [#28956](https://sourceware.org/bugzilla/show_bug.cgi?id=28956) | UNCONFIRMED | Minor documentation issue: name collision for RISC-V in the libm ULP error table |
| [#27414](https://sourceware.org/bugzilla/show_bug.cgi?id=27414) | UNCONFIRMED | riscv32 links-dso-program linking fails when upgrading from 2.32+patches to 2.33 |
| [#23960](https://sourceware.org/bugzilla/show_bug.cgi?id=23960) | UNCONFIRMED | [2.28 Regression] New getdents{64} implementation breaks qemu-user for 32-bit ABIs (explicitly including riscv32); a fix was proposed by Adhemerval Zanella and reportedly carried by Gentoo, but the closing thread (comment #29, Dmitry V. Levin, 2018-12-28) argues the real fix belongs in the Linux kernel rather than glibc, and the thread ends without agreement on which project should carry the fix |

**Open correctness bug (not in Bugzilla, tracked in the memset merge commit message):**

| Title | Status | Severity | Notes |
|---|---|---|---|
| RVV memset IFUNC selects vector path when RVV is prctl-disabled | Open as of this report | High | A process that calls `prctl(PR_RISCV_V_VSTATE_CTRL_OFF)` then `memset()` receives SIGILL; documented in merge commit 0b8a996f (Dec 2025) |

**Active, not-yet-merged patch series on libc-alpha:**

| Series | Author | Status | Scale | Notes |
|---|---|---|---|---|
| "[PATCH v5 00/18] riscv: Add RVV str*/mem* routines" | Yao Zihong (ISCAS/PLCT) | Under review, Feb 2026 | 75 files, 3328 lines | Covers memccpy, memchr, memcmp, memcmpeq, memcpy, memmove, memrchr, stpncpy, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmp, strncpy, strnlen, strrchr. See Section 6 for a conflicting third-party claim that this had already shipped in glibc 2.44 |
| "[PATCH 00/12 -> v3 00/16] Support RISC-V Control Flow Integrity" | Jesse Huang (SiFive) | Under review, v3 Dec 2025 | 38 files, ~1336 lines | Zicfilp + Zicfiss; SSP in jmp_buf is an ABI change; ucontext shadow stack described by its author as an "UNSAFE workaround" |
| "[RFC PATCH 0/5] riscv: Add libmvec routines" | Yao Zihong (ISCAS/PLCT) | RFC, Feb 2026 | 23 files, ~1765 lines | Initial RVV log/logf; open licensing question (possible veclibm derivation); integration approach not yet approved |
| "[PATCH v3] RISC-V: Fix IFUNC resolver cannot access gp pointer" | Yangyu Chen | Under discussion, Jan 2025 | Small | Related to the already-fixed #31317/#32269; residual edge case |
| "[PATCH v2] riscv: Use RISCV_HWPROBE_KEY_MISALIGNED_SCALAR_PERF" | Charlie Jenkins | Under review, May 2025 | Small | Better hwprobe key for misaligned-access performance detection, feeding the memcpy path-selection logic |
| "[RFC PATCH 0/1] riscv: Add Zilsd extension support for setjmp/longjmp on RV32" | Pincheng Wang | RFC, Jan 2026 | Small | RV32 only; Zilsd 64-bit load/store in setjmp |

---

## 12. Objections and Upstream Blockers

**Objections to the RVV string suite.** Review feedback for hand-written assembly string routines has historically favored simpler implementations before microarchitecture-tuned ones; Jeffrey Law explicitly requested a "dead-simple vector implementation" before tuning and supplied a reference loop as guidance. This is a process expectation rather than a hard technical blocker, and v5 of the 18-routine suite is intended to address prior review feedback.

**CFI ABI change.** Appending the shadow-stack pointer (SSP) to `struct __jmp_buf_internal_tag` is a binary ABI change, requiring coordination with downstream distributors - a recurring concern on libc-alpha for every architecture adding CFI support, not riscv-specific. The ucontext shadow-stack management is explicitly labeled "UNSAFE" by the v3 patch's own author. These are concrete, stated technical objections that must be resolved before merge, not review friction.

**libmvec integration approach.** The RFC explicitly asks the list whether the integration approach is acceptable before further implementation investment is made. A licensing question (possible veclibm derivation) is a concrete blocker requiring legal clearance or a clean-room reimplementation before the work can proceed past the RFC stage.

**prctl/RVV memset SIGILL bug.** The open SIGILL bug in the already-merged RVV memset needs a fix before the same IFUNC pattern can safely be extended to additional functions by the pending 18-routine suite - a process that has opted out of vector execution should not crash when calling a standard C library function.

**Static-PIE riscv64 regressions.** Two open bugs (#33911, #31773) point at the same feature area (static PIE, merged Jan 2024) and the same likely root cause (a read-only-segment/dynamic-relocation handling defect surfaced by newer GCC/binutils combinations). Neither has an assigned fix as of this report.

**CI ambiguity.** Whether the Sourceware Buildbot riscv64 builders actually execute the glibc testsuite under QEMU, versus only cross-compiling, is unresolved (Section 3). Until that is confirmed one way or the other, riscv64 regressions cannot be assumed to be caught automatically between patch submission and landing, regardless of the builders' current up/down state.

---

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro
- **Justification:** A live query of glibc's dedicated Sourceware Buildbot riscv64 builder (`glibc-ubuntu-riscv`, id 293, [https://builder.sourceware.org/buildbot/api/v2/builders/293](https://builder.sourceware.org/buildbot/api/v2/builders/293)) shows recent builds (341936, 342526, 342579) as "build successful," but nothing in the findings confirms that pipeline actually runs and passes the glibc test suite rather than just cross-compiling - the in-tree `scripts/build-many-glibcs.py` CI driver is documented as build-only with no QEMU `test_wrapper` configured for riscv64, and an earlier snapshot recorded that same builder (plus `glibc-fedora-riscv`) as offline with all-FAILURE recent runs. Per the color model's CI evidence rule, a riscv64 job that builds but does not confirmedly execute tests caps at yellow, not blue or green. Independently, glibc publishes source tarballs only (no upstream binary releases for any architecture), so the actual consumable riscv64 binaries come from Debian sid, Ubuntu Noble/resolute, and Arch Linux RISC-V, each described as an "official port" built from unmodified/unpatched upstream source - which on its own supports the yellow "clean-distro-build" distribution floor even setting the CI ambiguity aside. glibc is a general-purpose standard C library, not a project whose value proposition is RISC-V-specific speed, so the optimization modifier does not apply: it would still deliver its core value (POSIX/ABI compliance) with purely generic C.
- **Pending work that could change the grade:** Confirming whether `glibc-ubuntu-riscv`/`glibc-fedora-riscv` actually run `make check` under QEMU (not just cross-compile), and whether the newly observed "build successful" runs reflect passing tests, is the single highest-leverage item - the stored snapshot's "offline, all FAILURE" reading flatly contradicts the newer "build successful" reading, and resolving that discrepancy could move the grade in either direction depending on what it turns out to mean. Two active upstream threads could raise the grade if they land: the 18-routine RVV str*/mem* patch series ("[PATCH v5 00/18] riscv: Add RVV str*/mem* routines," Feb 2026, libc-alpha) and any restoration/stabilization of the two riscv64 Buildbot builders. A correctness bug (SIGILL when RVV is prctl-disabled then memset() is called, open since the Dec 2025 RVV memset merge) is also unresolved and would need to be closed before the RVV path can be considered safe to extend further.

---

## 14. Investment Analysis

Before sizing new work: RISE already funds infrastructure and engineer time for the `wheel_builder`/`python-wheels` project (manylinux_2_35 wheels with a glibc >=2.35 version dependency) and lists glibc within the System Libraries Working Group's scope (co-led by Ruinland Chuan-Tzu Tsai, who has prior glibc/musl-libc experience), but the only concrete glibc-specific artifact in that working group is an open, unassigned tracking issue ([#2 "glibc"](https://github.com/riseproject-dev/system-libraries-wg/issues/2), opened 2026-07-15 by luhenry, milestone "future," status "In Progress" on the board, no assignee, no linked PRs). No RISE blog post describing funded glibc engineering work (e.g., the RVV string/memory function effort) was found. There is no dedicated glibc repository or fork in the `riseproject-dev` GitHub organization (an org-wide code search for "glibc" returned zero repositories) - RISE tracks glibc work, it does not host it. RISE pre-commit CI coverage of glibc is claimed in a Dec 2024 post but has no public dashboard; this should be verified before funding new CI infrastructure to avoid duplication.

### 14.1 Functional Enablement

**Control Flow Integrity (Zicfilp + Zicfiss).** A 38-file v3 patch series is under review. Open issues: the ucontext SSP management is self-described as unsafe; the jmp_buf ABI change needs distributor coordination; test coverage for full interaction with signals and setjmp/longjmp is incomplete per review feedback. SiFive (Jesse Huang) is the primary author. Estimated effort to bring v3 to merge-quality: 3-5 person-weeks, contingent on the ABI question reaching community consensus, which has no purely engineering resolution.

**RVV IFUNC prctl bug fix.** The open SIGILL bug in the merged RVV memset (resolver does not check prctl-disabled RVV state) blocks safely extending the same IFUNC pattern to additional string functions. Fix effort: 1-2 person-weeks including an upstream review cycle.

**Static-PIE regression pair (#33911, #31773).** Both point at the same read-only-segment/dynamic-relocation area, likely a shared root cause. Diagnosing and fixing: estimate 1-3 person-weeks, pending confirmation the two bugs are actually the same defect.

**libmvec RVV (log/logf and beyond).** Early-stage RFC with unresolved integration and licensing questions. Log/logf is the initial scope; a full libmvec (sin, cos, exp, etc.) is a multi-person-month effort. The atan2f/WRF case is specifically harder on RISC-V for lack of a scalar reciprocal estimator. Multi-quarter effort with an unclear upstream acceptance timeline given the current RFC status.

### 14.2 Performance Optimization

**RVV str*/mem* 18-routine suite.** v5 (Feb 2026) is in active review with documented gains (memcmp +54.6% on XuanTie C920, +44.8% on SpacemiT X60; memccpy roughly 49% time reduction on SpacemiT X60). The bottleneck is reviewer bandwidth on libc-alpha, not unfinished implementation work. Assigning an engineer to drive review cycles and resolve feedback is the highest-leverage action here. Estimated effort to merge: 2-4 person-weeks of reviewer/author iteration, assuming no fundamental new objections surface. Note the Section 6 discrepancy about whether some of this work may already be shipped in glibc 2.44 under a different accounting - that should be resolved before committing engineering time, to avoid duplicating work already done.

**Vector memset lmul regression (Bugzilla #34334).** Concrete, reproducible hardware data shows the merged lmul=8 memset regresses up to ~118% versus scalar for small copies. A smaller-lmul, alignment-aware variant already shows promising results in the bug thread. Fix/upstream effort: 1-2 person-weeks, low risk, directly improves a subsystem RISE/Qualcomm already has visibility into via the bug thread.

**hwprobe misaligned scalar perf key.** Small patch under review (May 2025), affects memcpy path selection correctness. Low effort (well under 1 person-week), meaningful correctness value.

### 14.3 CI/CD Infrastructure

The central open question is whether the Sourceware Buildbot riscv64 builders execute `make check` under QEMU or only cross-compile - this must be answered (by reading actual build logs on builder 293/336, not just the build-result summary) before sizing further CI investment, since the fix required differs substantially depending on the answer (restoring/stabilizing an existing test-execution path vs. adding QEMU test execution from scratch). Estimated effort: 1 person-week to investigate and confirm current behavior; if test execution needs to be added, 3-6 additional person-weeks including coordination with Red Hat/sourceware.org infrastructure maintainers, given the shared, externally-hosted nature of the Buildbot instance.

### 14.4 Ecosystem Enablement

Not applicable; see Section 9 note. glibc is a system library with no dependent package ecosystem of its own (no Python/npm/Maven-style consumer packages requiring separate riscv64 enablement). It is itself a prerequisite for nearly every other package on Linux, so its correctness and performance affect the entire ecosystem indirectly, but there is no ecosystem-enablement work item distinct from the functional/performance items above.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Confirm whether riscv64 Buildbot builders (293, 336) actually execute the glibc testsuite under QEMU, or only cross-compile | 1 | Red Hat / Qualcomm infra | Critical |
| Functional | Fix prctl/RVV SIGILL in memset IFUNC resolver | 1-2 | PLCT/ISCAS or Qualcomm | Critical |
| Performance | Fix vector memset lmul=8 small-copy regression (Bugzilla #34334) | 1-2 | PLCT/ISCAS or Qualcomm | High |
| Functional | Diagnose and fix static-PIE riscv64 regressions (#33911, #31773) | 1-3 | Qualcomm / distro maintainers | High |
| Performance | Drive RVV str*/mem* 18-routine suite (v5) to merge; reconcile with the glibc 2.44 shipping-status discrepancy first | 2-4 | Qualcomm reviewer + PLCT author | High |
| CI/CD | If test execution is not currently running, add QEMU test execution to at least one riscv64 CI builder | 3-6 | Red Hat / Qualcomm infra | High |
| Functional | Complete RISC-V CFI (Zicfilp+Zicfiss): resolve ucontext safety and jmp_buf ABI questions | 3-5 | SiFive + community consensus | Medium |
| Performance | hwprobe misaligned scalar perf key (small patch, under review) | <1 | Qualcomm reviewer | Medium |
| Performance | libmvec RVV initial (log/logf): resolve licensing, integration approach, implement | 8-16 | PLCT/ISCAS + Qualcomm | Low |

---

## 15. References

- [sourceware.org/git/glibc.git (canonical repository)](https://sourceware.org/git/glibc.git)
- [gnu.org/software/libc (project homepage)](https://www.gnu.org/software/libc/)
- [bminor/glibc GitHub mirror (read-only, archived 2026-02-15)](https://github.com/bminor/glibc)
- [sysdeps/riscv source tree](https://github.com/bminor/glibc/tree/master/sysdeps/riscv)
- [sysdeps/riscv/multiarch source tree](https://github.com/bminor/glibc/tree/master/sysdeps/riscv/multiarch)
- [sysdeps/unix/sysv/linux/riscv source tree](https://github.com/bminor/glibc/tree/master/sysdeps/unix/sysv/linux/riscv)
- [scripts/build-many-glibcs.py](https://raw.githubusercontent.com/bminor/glibc/master/scripts/build-many-glibcs.py)
- [glibc INSTALL file (toolchain minimums)](https://raw.githubusercontent.com/bminor/glibc/master/INSTALL)
- [commit 0b8a996f: riscv: Add RVV memset for both multiarch and non-multiarch builds](https://github.com/bminor/glibc/commit/0b8a996f44b5f4c02991f02cd12bf05b17db4576)
- [commit 47975914: riscv: Add vector registers to __SYSCALL_CLOBBERS](https://github.com/bminor/glibc/commit/47975914fb106b83c42bc0baf6435a0944a23d30)
- [commit fc6f074e: riscv: linux: Add support for getrandom vDSO](https://github.com/bminor/glibc/commit/fc6f074e0496fb8a8df491641165f4ed3cdaa3a3)
- [commit 8af8beb1: riscv: Correct __riscv_hwprobe function prototype, BZ #32932](https://github.com/bminor/glibc/commit/8af8beb1c488dcfec754431c1626979276046545)
- [commit 720e8916: riscv: Add Zbkb optimized repeat_bytes helper](https://github.com/bminor/glibc/commit/720e89163702ffa1e921d926b6c36b53c3ccbee4)
- [commit a36814e1: riscv: align .preinit_array, BZ #32228](https://github.com/bminor/glibc/commit/a36814e1455093fc9ebfcdf6ef39bb0cf3d447da)
- [commit 4e24e4d9: Add NT_RISCV_TAGGED_ADDR_CTRL from Linux 6.13 to elf.h](https://github.com/bminor/glibc/commit/4e24e4d936b57f6e7809032f55cc95a4cf4d2396)
- [commit 273f8037: Fix RISC-V soft-float _FPU_SETCW for GCC 16 warnings](https://github.com/bminor/glibc/commit/273f80374aeb7d746352a098b23d9bb85e908ea8)
- [RISC-V glibc Port v1](https://groups.google.com/a/groups.riscv.org/g/patches/c/jDlPXTvx7DY/m/QHZ7syTjAwAJ)
- [RISC-V glibc Port v3](https://groups.google.com/a/groups.riscv.org/g/patches/c/iZTF5dHDr5A)
- [RISC-V glibc port, v5 (libc-alpha, 2018-01-24)](https://sourceware.org/legacy-ml/libc-alpha/2018-01/msg00789.html)
- [RISC-V glibc port, v6 (libc-alpha, 2018-01-26, merged into glibc 2.27)](https://sourceware.org/pipermail/libc-alpha/2018-January/090941.html)
- [[RFC v3 00/23] RISC-V glibc port for the 32-bit](https://public-inbox.org/libc-alpha/87muh79yt2.fsf@xmission.com/T/)
- [[RFC v4 00/24] RISC-V glibc port for the 32-bit](https://public-inbox.org/libc-alpha/87h86ja82q.fsf@oldenburg2.str.redhat.com/T/)
- [[RFC v5 00/21] RISC-V glibc port for the 32-bit](https://public-inbox.org/libc-alpha/alpine.DEB.2.21.1908291723280.4240@digraph.polyomino.org.uk/T/)
- [[PATCH v2 00/18] glibc port for 32-bit RISC-V (RV32)](https://sourceware.org/pipermail/libc-alpha/2020-June/114675.html)
- [[PATCH v5 00/17] glibc port for 32-bit RISC-V (RV32), merged into glibc 2.33](https://sourceware.org/pipermail/libc-alpha/2020-August/117086.html)
- [libc-alpha: [PATCH v5 00/18] riscv: Add RVV str*/mem* routines (Feb 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174800.html)
- [libc-alpha: [PATCH 00/12] Support RISC-V Control Flow Integrity v1 (Jun 2025)](https://sourceware.org/pipermail/libc-alpha/2025-June/167831.html)
- [libc-alpha: [RFC PATCH 0/5] riscv: Add libmvec routines (Feb 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html)
- [libc-alpha: [PATCH v2] RISC-V: Add vector registers to __SYSCALL_CLOBBERS (Sep 2025)](https://sourceware.org/pipermail/libc-alpha/2025-September/169804.html)
- [libc-alpha: [PATCH v3] riscv: Correct __riscv_hwprobe function prototype (Jun 2025)](https://sourceware.org/pipermail/libc-alpha/2025-June/167557.html)
- [libc-alpha: [PATCH v3] RISC-V: Fix IFUNC resolver cannot access gp pointer (Jan 2025)](https://sourceware.org/pipermail/libc-alpha/2025-January/163560.html)
- [libc-alpha: [RFC PATCH 0/1] riscv: Add Zilsd extension support for setjmp/longjmp on RV32 (Jan 2026)](https://sourceware.org/pipermail/libc-alpha/2026-January/174323.html)
- [libc-alpha: [PATCH v1 1/1] riscv: Add RVV memset via multiarch/IFUNC (Oct 2025)](https://sourceware.org/pipermail/libc-alpha/2025-October/171680.html)
- [Bugzilla #24040: riscv64 unterminated call chain in __thread_start (RESOLVED FIXED)](https://sourceware.org/bugzilla/show_bug.cgi?id=24040)
- [Bugzilla #31151: missing support for profile/audit PLT setup (RESOLVED FIXED)](https://sourceware.org/bugzilla/show_bug.cgi?id=31151)
- [Bugzilla #23960: getdents{64} implementation breaks qemu-user (UNCONFIRMED)](https://sourceware.org/bugzilla/show_bug.cgi?id=23960)
- [Bugzilla #34334: Vector memset performance issues on Spacemit X100 (UNCONFIRMED)](https://sourceware.org/bugzilla/show_bug.cgi?id=34334)
- [Bugzilla #33911: SIGSEGV of --static-pie binaries on riscv64 (UNCONFIRMED)](https://sourceware.org/bugzilla/show_bug.cgi?id=33911)
- [Bugzilla #31773: Build regression, read-only segment has dynamic relocations (NEW)](https://sourceware.org/bugzilla/show_bug.cgi?id=31773)
- [Bugzilla #24484: RISC-V libraries can have read-write .dynamic sections, ld.so loads read-only (REOPENED)](https://sourceware.org/bugzilla/show_bug.cgi?id=24484)
- [Bugzilla #30963: glibc doesn't support lp64f ABI variant (NEW)](https://sourceware.org/bugzilla/show_bug.cgi?id=30963)
- [Bugzilla #30597: cacheflush(2) not implemented on RISC-V (NEW)](https://sourceware.org/bugzilla/show_bug.cgi?id=30597)
- [Bugzilla #29500: Test timeout on RISCV64 real hardware (UNCONFIRMED)](https://sourceware.org/bugzilla/show_bug.cgi?id=29500)
- [Bugzilla #28956: Name collision for RISC-V in libm ULP error table (UNCONFIRMED)](https://sourceware.org/bugzilla/show_bug.cgi?id=28956)
- [Bugzilla #27414: links-dso-program linking fails, riscv32 (UNCONFIRMED)](https://sourceware.org/bugzilla/show_bug.cgi?id=27414)
- [Sourceware Buildbot API: builders listing](https://builder.sourceware.org/buildbot/api/v2/builders)
- [Sourceware Buildbot API: glibc-ubuntu-riscv, builder 293](https://builder.sourceware.org/buildbot/api/v2/builders/293)
- [Sourceware Buildbot API: glibc-fedora-riscv, builder 336](https://builder.sourceware.org/buildbot/api/v2/builders/336)
- [Debian package tracker: glibc](https://tracker.debian.org/pkg/glibc)
- [Debian libc6 sid package page](https://packages.debian.org/sid/libc6)
- [Debian buildd status for glibc/riscv64](https://buildd.debian.org/status/package.php?p=glibc&suite=sid)
- [Ubuntu 26.04 (resolute) libc6 package page](https://packages.ubuntu.com/resolute/riscv64/libc6)
- [Ubuntu package search: glibc, suite resolute](https://packages.ubuntu.com/search?keywords=glibc&suite=resolute&searchon=names&section=all)
- [Ubuntu Noble packages: glibc, riscv64](https://packages.ubuntu.com/search?keywords=glibc&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V core repository (live package listing)](https://riscv.mirror.pkgbuild.com/repo/core/)
- [GNU FTP: glibc releases](https://ftp.gnu.org/gnu/glibc/)
- [PyPI: glibc package (unrelated ctypes wrapper, not the C library)](https://pypi.org/pypi/glibc/json)
- [RISE Project Dec 2024 end-of-year ecosystem update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog: RISE Project Working Group Elections: Results](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)
- [RISE blog: How Kairos is Charting the Stepping Stones of RISC-V Productization](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [RISE blog: Stack-Clash Security Checker for RISC-V](https://riseproject.dev/2024/07/17/stack-clash-security-checker-for-risc-v/)
- [RISE members list](https://riseproject.dev/members/)
- [RISC-V Optimization Guide (riseproject.dev subsite)](https://riscv-optimization-guide.riseproject.dev/)
- [riseproject-dev/system-libraries-wg issue #2: glibc](https://github.com/riseproject-dev/system-libraries-wg/issues/2)
- [RISE compilers-and-toolchains-wg issue #47: mem* and str* in glibc implementation](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/47)
- [RISE compilers-and-toolchains-wg issue #23: mem* and str* inline expansion in GCC](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/23)
- [RISE compilers-and-toolchains-wg issue #66: Improve performance of WRF benchmark (atan2f)](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/66)
- [riseproject-dev/gcc-postcommit-ci (includes check-glibc-linux target)](https://github.com/riseproject-dev/gcc-postcommit-ci)
- [riseproject-dev/python-wheels (wheel_builder project)](https://github.com/riseproject-dev/python-wheels)
- [RISE Python wheel builder docs](https://riseproject.gitlab.io/python/wheel_builder/)
- [conda-forge blog: riscv64 support, targeting glibc 2.39](https://conda-forge.org/blog/2026/09/15/riscv64/)
- [msyksphinz bench_trace_env issue #2: glibc 2.42 vs 2.44 SPEC CPU2006 instruction trace comparison](https://github.com/msyksphinz/bench_trace_env/issues/2)
- [Bugzilla #34334 comment: memset lmul sensitivity on SpacemiT X100](https://sourceware.org/bugzilla/show_bug.cgi?id=34334)
- [linux-riscv: memory corruption on SpacemiT K1 with RVV + THP](https://ratatoskr.run/linux-riscv/2026/08/17480175/t)
- [lore.kernel.org: vector_fpu_regs_status_rmw_fix kernel patch](https://lore.kernel.org/linux-riscv/20260807-vector_fpu_regs_status_rmw_fix-v1-1-0c16848b60db@intel.com/)
- [Hacker News discussion: LLVM libc RISC-V memcpy vs glibc](https://news.ycombinator.com/item?id=36025209)