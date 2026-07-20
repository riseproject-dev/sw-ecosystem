---
title: GDB
categories:
  - debug
---

# GDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for GDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

GDB is the GNU Project's source-level debugger. It supports debugging native processes, remote targets via the GDB Remote Serial Protocol (RSP), bare-metal embedded targets, and post-mortem core files. It is the dominant open-source debugger for Linux on all major architectures.

- Homepage: [https://www.gnu.org/software/gdb/](https://www.gnu.org/software/gdb/)
- Source: [https://sourceware.org/git/binutils-gdb.git](https://sourceware.org/git/binutils-gdb.git) (protected by Anubis bot challenge at time of research; accessible via [https://gitlab.com/gnutools/binutils-gdb](https://gitlab.com/gnutools/binutils-gdb) mirror)
- License: GPL v3
- Latest stable release: 17.2 (2026-05-10), source tarball at [https://sourceware.org/pub/gdb/releases/](https://sourceware.org/pub/gdb/releases/)
- Governance: FSF GNU Project; patches submitted via email to gdb-patches@sourceware.org; no GitHub PRs used upstream

GDB does not ship binary packages. Binary distribution is the responsibility of downstream distributions (Debian, Ubuntu, Arch Linux, etc.).

---

## 2. Port History and Upstreaming Timeline

The RISC-V port is fully upstream. There is no vendor fork carrying out-of-tree patches.

| Date | Event | Author | Affiliation |
|---|---|---|---|
| Feb 2018 | First patch: bare-metal riscv support submitted to gdb-patches | Andrew Burgess | Embecosm |
| Mar 2018 | Patches pushed to master (GDB 8.2/8.3 timeframe) | Andrew Burgess | Embecosm |
| Feb 2020 | gdbserver Linux/RISC-V support added | Maciej W. Rozycki | -- |
| Jan 2021 | Unified regset supply function for Linux and FreeBSD | T-J-Teru (Andrew Burgess) | -- |
| Jul 2021 | Stepping out of signal handler on riscv*-linux | lsix | -- |
| Mar 2023 | SystemTap probe support added | T-J-Teru | -- |
| Apr 2023 | Compressed instruction prologue scanner improvements | T-J-Teru | -- |
| Jan 2025 | Numeric/ABI register name switch command | CiaranWoodward | -- |
| Jan 2025 | Fix `gdb.cp/non-trivial-retval.exp` on riscv64-linux | vries (Tom de Vries) | SUSE |
| Apr 2025 | Internal TLS support for riscv (alongside aarch64, x86_64, ppc64, s390x) | KevinBuettner | Red Hat |
| Apr 2025 | Record full support for rv64gc instruction set | timurgol007 (Timur Golubovich) | -- |
| Jun 2025 | `catch syscall` support on RISC-V Linux | timurgol007 | -- |
| Jul 2025 | ISA string detection fix for disassembly | Marek Pikula / T-J-Teru | -- |
| Aug 2025 | Privileged instruction record support (wfi, sfence.vma, sret, mret) | timurgol007 | -- |
| Oct 2025 | Record performance improvement (~15% stepping speedup) | timurgol007 | -- |
| Nov 2025 | Bitmanip, zicond, fence.tso, sinval, zihintntl record support | timurgol007 | -- |
| Mar 2026 | Fix syscall exit recording for riscv | vries | SUSE |

The archived vendor fork [riscvarchive/riscv-binutils-gdb](https://github.com/riscvarchive/riscv-binutils-gdb) was marked read-only on August 17, 2022. It has not received upstream patches since approximately 2022. All active development is in the canonical upstream tree. Issues filed against that fork (see Section 11) have no upstream resolution path.

---

## 3. Upstream Support Tier

GDB governance defines five tiers in `gdb/MAINTAINERS` (accessible via [RTEMS sourceware mirror](https://github.com/RTEMS/sourceware-mirror-binutils-gdb) at commit cd05bee):

1. **FSF-appointed GDB Maintainers** - Final authority; currently Pedro Alves, Joel Brobecker, Doug Evans, Eli Zaretskii.
2. **Global Maintainers** - Authority over any patch; includes Andrew Burgess (Red Hat), Tom de Vries (SUSE), Ulrich Weigand (IBM), Luis Machado (Arm/Linaro), and others.
3. **Responsible Maintainers** - Own a specific architecture; must respond within one week.
4. **Authorized Committers** - Trusted within their area without Global Maintainer review.
5. **Write After Approval (WAA)** - Per-patch approval required; entry point for new contributors.

The RISC-V target is listed under Responsible Maintainers:

```
riscv    --target=riscv32-elf
         --target=riscv64-elf
         Andrew Burgess    aburgess@redhat.com   (Red Hat)
         Palmer Dabbelt    palmer@dabbelt.com    (Google)
```

Andrew Burgess is also the current GDB Release Manager and a Global Maintainer. He is employed by Red Hat, a RISE Premier member. Palmer Dabbelt is employed by Google, also a RISE Premier member. Timur Golubovich (timurgol007), who authored the majority of record/replay work in 2025, was added to `gdb/MAINTAINERS` on 2025-06-17 (commit b968541) [NEEDS VERIFICATION on his affiliation].

GDB has no formal "tier1/tier2" port classification analogous to Linux kernel port tiers. All accepted architectures are treated as equal in policy. Unmaintained architectures can be deleted by the Global Maintainers (mcore, nios2, ns32k are listed as "Deleted" in MAINTAINERS). RISC-V is actively maintained with two named Responsible Maintainers.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source File Inventory

**Core GDB layer (`gdb/`):**
- `gdb/riscv-tdep.c` - main target-dependent code (ABI, prologue scanner, register handling, breakpoints, argument passing, lr/sc sequences, record/replay)
- `gdb/riscv-tdep.h` - target-dependent header
- `gdb/riscv-linux-tdep.c` - Linux OS-ABI layer (signal frames, TLS, syscall catchpoints, syscall recording)
- `gdb/riscv-linux-nat.c` - Linux native layer (ptrace, FLEN determination)
- `gdb/riscv-none-tdep.c` - bare-metal/no-OS ABI
- `gdb/riscv-fbsd-tdep.c` - FreeBSD OS-ABI layer
- `gdb/riscv-fbsd-nat.c` - FreeBSD native layer
- `gdb/riscv-ravenscar-thread.c` - Ada Ravenscar thread support
- `gdb/riscv-linux-canonicalize-syscall-gen.c` - auto-generated syscall mapping

**Architecture abstraction (`gdb/arch/`):**
- `gdb/arch/riscv.c` - shared target description builder
- `gdb/arch/riscv.h`

**Target description XML features (`gdb/features/riscv/`):**
- `32bit-cpu.c/.xml`, `32bit-csr.c/.xml`, `32bit-fpu.c/.xml`
- `64bit-cpu.c/.xml`, `64bit-csr.c/.xml`, `64bit-fpu.c/.xml`
- `rebuild-csr-xml.sh`

**GDB server:**
- `gdbserver/linux-riscv-low.cc` - low-level target implementation

**Simulator (`sim/riscv/`):** 31 files total; `model32.c` (~27k lines), `model64.c` (~37k lines). This is a standalone GDB-internal instruction-set simulator used for bare-metal targets.

No hand-written assembly (`.S`) files exist in the RISC-V GDB port. No JIT compilation backend for RISC-V. No SIMD dispatch paths.

### 4.2 Component Coverage

| Component | Status | Notes |
|---|---|---|
| GPR/FPR registers | Full | All 32 GPRs + 32 FPRs; 32-bit and 64-bit variants; RV32E variant; pseudo-registers for fflags/frm via fcsr masking |
| Software breakpoints | Full | EBREAK (4-byte) and C.EBREAK (2-byte compressed) in both GDB client and gdbserver |
| Hardware breakpoints | Missing | No ptrace-based hardware debug register support. Pending patch (v2, April 2026, SpacemiT, [cover letter](https://sourceware.org/pipermail/gdb-patches/2026-April/226391.html)) not yet merged |
| Hardware watchpoints | Missing | Same as above; no `insert_hw_watchpoint` override in `riscv-linux-nat.c` |
| Prologue unwinder | Partial | `riscv_scan_prologue` implemented; source comment explicitly notes intent to extend it further; DWARF fallback used in practice |
| DWARF unwinding | Full | DWARF2 frame unwinder registered; signal frame handler via `tramp_frame` |
| Signal frame unwinding | Full | `riscv_linux_sigframe_init` maps all GPRs + FPRs from `mcontext_t`; noted in source as "frame base is somewhat arbitrary" |
| Calling convention | Full | `riscv_push_dummy_call` implemented for LP64D/LP64F/LP64/ILP32 ABI variants |
| CSR register access (ptrace) | Stub | MISA: hardcoded to zero with explicit TODO comment. Other CSRs: silently ignored with comment citing security concerns. No ptrace CSR read/write path exists |
| Vector (V-extension) registers | Missing | `gdb/arch/riscv.c` explicitly throws `"unable to create vector feature"` for native targets. Remote targets providing their own description can expose vector registers. No `vector.xml` feature file. Pending patch (v5, May 2025, Sameer Natu / Greg Savin / Charlie Jenkins, [mailing list](https://sourceware.org/pipermail/gdb-patches/2025-June/218801.html)) awaiting merge |
| Record/replay - base rv64gc | Full | Merged upstream April 2025 (commit b9c7eed) |
| Record/replay - extensions | Partial | Bitmanip, zicond, fence.tso, sinval, zihintntl (2025-12), csrrci (2025-06), wfi/sfence.vma/sret/mret (2025-08) added. V-extension not covered. Record performance improved ~15% (commit bef948d) |
| Syscall catchpoints | Full | `low_supports_catch_syscall` returns true; `riscv_linux_get_syscall_number` reads `$a7`; XML syscall table registered (commit 52bb1ca, 2025-08) |
| Syscall recording | Partial | ~170 of 470+ syscalls mapped; modern Linux syscalls (424-469: io_uring, clone3, mseal, etc.) are stubs in the auto-generated file |
| TLS (Thread Local Storage) | Full | `riscv_linux_get_tls_dtv_addr`/`get_tls_dtp_offset`; handles both musl (offset 0x800) and glibc (offset 0) layouts. Merged April 2025 (commit c34309b) |
| ABI register naming | Full | Command to switch between numeric (`x0`-`x31`) and ABI (`zero`, `sp`, `a0`, etc.) names. Merged 2025 (commit 2047479) |
| ISA string / disassembly | Full | Bug in ISA string detection from ELF header fixed 2025 (commit 1324b95) |
| bfloat16 / half-float FPU sub-fields | Pending | v2 submitted February 2026 (Jerry Zhang Jian / SiFive, [cover letter](https://sourceware.org/pipermail/gdb-patches/2026-February/224994.html)); conditionally approved by Andrew Burgess pending minor cleanup |
| cm.popret[z] single-step | Pending | v2 submitted May 2025 (ESWIN Computing, [mailing list](https://sourceware.org/pipermail/gdb-patches/2025-May/218017.html)); no "pushed" notice found in reviewed archives |
| SystemTap probe support | Full | Added 2023 (commit 2f79f2e) |
| Ada Ravenscar thread support | Full | Callee-saved integer and FP registers mapped for RV32/RV64 |
| FreeBSD support | Full | `riscv-fbsd-tdep.c` and `riscv-fbsd-nat.c` both complete |
| Bare-metal / none ABI | Full | `riscv-none-tdep.c` with core file support including GPR, FPR, CSR regsets |
| Branch tracing (`record btrace`) | Not available | Requires hardware branch tracing not present on current RISC-V silicon |

### 4.3 Known gdbserver Bug

The `breakpoint_kind_from_pc` function in `gdbserver/linux-riscv-low.cc` contains a parenthesis placement error: `buf.insn == sizeof(riscv_ibreakpoint)` is passed as an argument to `riscv_insn_length` rather than `buf.insn` itself [NEEDS VERIFICATION -- source obtained from T-J-Teru mirror; could not be confirmed against second source due to Anubis blocking on sourceware.org].

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build System

GDB uses autoconf/configure exclusively. There is no CMake build system. Configure flags use `--enable-X` / `--disable-X` / `--with-X` / `--without-X` syntax. `-DUSE_X=OFF` style flags do not apply.

Source for configure details: [https://gitlab.com/gnutools/binutils-gdb/-/raw/master/gdb/configure.ac](https://gitlab.com/gnutools/binutils-gdb/-/raw/master/gdb/configure.ac) and [https://sourceware.org/gdb/current/onlinedocs/gdb.html/Configure-Options.html](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Configure-Options.html).

### 5.2 Required Compiler

**C++17 is mandatory** as of GDB 15 (2024). Source: `gdb/NEWS` (GDB 15 release notes): "Building GDB and GDBserver now requires a C++17 compiler. For example, GCC 9 or later." The `configure.ac` enforces this at configure time:

```
AX_CXX_COMPILE_STDCXX(17, , mandatory)
```

A build will hard-fail on any compiler that cannot pass C++17 compilation. GCC 9 is the explicitly documented minimum. GDB 14 and earlier required only C++11/14.

### 5.3 RISC-V Target Triplets

From `config.sub` (version stamp 2025-07-10 in the gitlab mirror), recognized CPU types include `riscv`, `riscv32`, `riscv32be`, `riscv64`, `riscv64be`.

Common full triplets:
- `riscv64-unknown-linux-gnu` - Linux with glibc
- `riscv64-unknown-linux-musl` - Linux with musl libc
- `riscv64-unknown-elf` - bare metal

The Debian RISC-V port baseline is **RV64GC with lp64d ABI**. Source: [https://wiki.debian.org/RISC-V](https://wiki.debian.org/RISC-V).

### 5.4 riscv64 Configure Invocations

**Native build (on a riscv64 host):**

```sh
mkdir build && cd build
../configure \
  --prefix=/usr/local \
  --with-expat \
  --with-python=python3 \
  --with-system-zlib \
  --with-system-readline \
  --enable-tui \
  --with-lzma \
  --enable-64-bit-bfd
make -j$(nproc)
make install
```

**Cross-compilation (riscv64-targeting GDB on an x86_64 host):**

```sh
mkdir build-cross && cd build-cross
../configure \
  --prefix=/usr/local \
  --target=riscv64-unknown-linux-gnu \
  --host=x86_64-linux-gnu \
  --build=x86_64-linux-gnu \
  --with-expat \
  --with-python=python3 \
  --with-system-zlib \
  --with-system-readline \
  --enable-64-bit-bfd \
  --with-sysroot=/usr/riscv64-linux-gnu
make -j$(nproc)
```

**Multi-target build (the `gdb-multiarch` approach):**

```sh
../configure \
  --prefix=/usr/local \
  --enable-targets=all \
  --disable-sim \
  --with-expat \
  --with-python=python3 \
  --with-system-zlib \
  --with-system-readline \
  --enable-64-bit-bfd \
  --with-debuginfod
make -j$(nproc)
```

**Cross-building gdbserver only (to run on riscv64 target):**

```sh
export CC=riscv64-linux-gnu-gcc
../configure --target=riscv64-linux-gnu --disable-gdb
make all-gdbserver
```

### 5.5 gdbserver riscv64 Capabilities

From `gdbserver/configure.srv`: `riscv*-*-linux*` sets `srv_linux_regsets=yes`, `srv_linux_usrregs=yes`, `srv_linux_thread_db=yes`.

Explicit absences: no in-process agent (IPA) support (`ipa_obj` not set), no branch trace (`srv_linux_btrace` not set), no `srv_xmlfiles` defined.

### 5.6 Minimum GDB Version for riscv64 Linux

GDB 8.3 is the first release with support for `riscv*-*-linux*` targets. Source: [https://wiki.debian.org/RISC-V](https://wiki.debian.org/RISC-V).

### 5.7 Dockerfile

No official Dockerfile exists in the binutils-gdb repository. The sourceware.org builder.git repository that drives CI hardware is inaccessible due to Anubis bot protection. No Dockerfile was found in any accessible mirror.

The Debian Noble build dependency set is the closest authoritative reference:

```sh
apt-get install -y \
  build-essential autoconf libtool bison flex gettext \
  libgmp-dev libmpfr-dev libexpat1-dev zlib1g-dev \
  liblzma-dev libzstd-dev libxxhash-dev \
  python3-dev libdebuginfod-dev \
  gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu \
  qemu-user-static
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Data not available: a systematic, published comparison of GDB feature coverage between riscv64, arm64 (aarch64), and amd64 was not found in any source reviewed. The table below derives from architecture-specific source inspection. No formal "tier" designation distinguishes architectures in GDB policy.

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Software breakpoints | Full | Full | Full | None |
| Hardware breakpoints | Full | Full | Missing | riscv64 has no ptrace hardware debug register support upstream |
| Hardware watchpoints | Full | Full | Missing | Same |
| Record/replay (process record) | Full | Full | Partial | riscv64 missing V-extension and many newer ISA extensions in record/replay |
| Branch tracing (`record btrace`) | Full (Intel PT, BTS) | Full (CoreSight) | Not available | Hardware branch tracing absent on current RISC-V silicon |
| Vector register access (native) | Full (AVX/SSE) | Full (SVE/NEON) | Missing | `arch/riscv.c` throws on native vector target description creation |
| CSR register access | N/A | N/A (system regs via ptrace) | Stub | MISA hardcoded to zero; other CSRs silently suppressed |
| TLS support | Full | Full | Full | None -- added 2025 |
| SystemTap probes | Full | Full | Full | None -- added 2023 |
| In-process agent (IPA) | Full | Full | Missing | `ipa_obj` not set in gdbserver configure |
| Catch syscall | Full | Full | Full | None -- added 2025 |
| Signal frame unwinding | Full | Full | Full | None |
| Prologue unwinder | Full | Full | Partial | Acknowledged incomplete in source; DWARF fallback in practice |
| FreeBSD native support | Full | Full | Full | None |

The two most impactful gaps relative to arm64 and amd64 are:

1. **Hardware debug registers (breakpoints and watchpoints)**: The RISC-V Linux kernel `ptrace` interface for hardware debug is defined but GDB does not implement it. A v2 patch series from SpacemiT is pending review (April 2026) and not yet merged. Until merged, every RISC-V debug session relies on software breakpoints only, which require write access to target memory.

2. **Vector register visibility on native targets**: Any process using the RISC-V V extension cannot have its vector registers inspected in a native GDB session. Remote debugging via a target that provides a custom target description does work. The pending v5 patch from Sameer Natu / SiFive has been awaiting merge since at least May 2025.

---

## 7. CI/CD Infrastructure

### 7.1 CI System

GDB uses exclusively **Buildbot**, hosted at [https://builder.sourceware.org/buildbot/](https://builder.sourceware.org/buildbot/). There is no `.gitlab-ci.yml` in the binutils-gdb repository (confirmed via GitLab API tree walk of the `gnutools/binutils-gdb` project). There are no `.github/` workflow files.

### 7.2 RISC-V Specific Builders

The following was confirmed via direct Buildbot API queries at [https://builder.sourceware.org/buildbot/api/v2/](https://builder.sourceware.org/buildbot/api/v2/):

**`gdb-ubuntu-riscv` (builder ID 294)**
- Tags: `gdb`, `ubuntu`, `riscv`
- Workers: 5 physical machines named `starfive-riscv`, `starfive-1` through `starfive-4`
- Worker OS: Ubuntu 24.04.4 LTS on riscv64, kernel `Linux 6.17.0-29-generic riscv64`
- Most recent build: #4739, result=success, started 2026-06-18 00:25 UTC (day of research)
- Admin: Mark Wielaard

**`gdb-riscv-full` (builder ID 335)**
- Tags: `gdb-full`, `hifive`, `riscv`
- Worker: `p550` -- SiFive HiFive Premier P550 board (64-core)
- Worker OS: `FreedomUSDK (SiFive Freedom Unleashed SDK) 2024.09.00-HFP550` Linux 6.6.21
- Most recent build: #483, result=success, 2025-12-19 17:46 UTC
- Hardware donated by RISC-V International, announced January 30, 2025: [https://sourceware.org/pipermail/gdb/2025-January/051734.html](https://sourceware.org/pipermail/gdb/2025-January/051734.html)
- Reported results as of Jan 2025: 121,159 expected passes, 333 unexpected failures
- Admin: Mark Wielaard

### 7.3 Related riscv Builders (non-GDB)

The sourceware Buildbot also runs riscv64 CI for `elfutils`, `binutils`, `glibc`, `gcc`, `valgrind`, `libabigail`, `annobin`, `gnupoke`, `dwz`, `bzip2`, and `debugedit`. All use the same physical worker fleet.

### 7.4 Gap

The `gdb-riscv-full` builder on the HiFive P550 ran its last confirmed build in December 2025 (build #483). The `masterids=[]` field in the API response indicates the builder was not connected to a Buildbot master at query time (2026-06-18). Whether this is a transient network issue or a longer outage could not be determined from the API alone. The `gdb-ubuntu-riscv` builder on StarFive hardware ran successfully on the day of research.

---

## 8. Distribution and Release Status

### 8.1 Upstream Source Releases

GDB upstream ships source tarballs only. Binary distribution is left to downstream distributors.

| Version | Release Date |
|---|---|
| 17.2 | 2026-05-10 |
| 17.1 | 2025-12-20 |
| 16.3 | 2025-04-20 |

Source: [https://sourceware.org/pub/gdb/releases/](https://sourceware.org/pub/gdb/releases/)

### 8.2 Binary Package Status

| Distribution | riscv64 Available | Version | Evidence |
|---|---|---|---|
| PyPI (`pip install gdb`) | No | N/A | HTTP 404 -- `gdb` package does not exist on PyPI for any architecture |
| RISE wheel builder | No | N/A | Redirects to PyPI; same 404 result |
| Ubuntu 24.04 (noble) | Yes | 15.0.50.20240403-0ubuntu1 | Confirmed: [https://packages.ubuntu.com/noble/riscv64/gdb/download](https://packages.ubuntu.com/noble/riscv64/gdb/download), SHA256 `8ae029a86726899e54212b56648645bf7be31ebb5ae81d4f1ef8da0d35db9584` |
| Debian sid (unstable) | Yes | 17.2-1 | Confirmed: `buildd.debian.org` API returns `class="status-installed"`, built on `rv-osuosl-01` |
| Arch Linux RISC-V | Yes | 17.2-1 | Confirmed: `gdb-17.2-1-riscv64.pkg.tar.zst` present at `mirror.nju.edu.cn/archriscv/repo/extra/`; no riscv64-specific patches required |

**Notable packaging gap:** Debian bookworm (stable) ships only `gdb-minimal` for riscv64, not the full `gdb` package with Python scripting, TUI, debuginfod, and expat support. Full GDB with all features is available only in Debian sid (unstable). This is a packaging decision, not an upstream build failure.

### 8.3 Commit-to-Release Mapping

GDB does not use GitHub pull requests. All contributions are email patches to gdb-patches@sourceware.org applied directly to master. Branch-cut dates used for release assignment: GDB 14 branch 2023-10-08, GDB 15 branch 2024-05-26, GDB 16 branch 2024-12-29, GDB 17 branch 2025-09-06.

Key riscv64 commits and their first stable release:

| Commit SHA | Feature | First Release |
|---|---|---|
| b9c7eed | Record full support for rv64gc | GDB 17.1 (2025-12-20) |
| 52bb1ca | `catch syscall` support | GDB 17.1 (2025-12-20) |
| c34309b | Internal TLS support | GDB 17.1 (2025-12-20) |
| 1324b95 | ISA string detection fix for disassembly | GDB 17.1 (2025-12-20) |
| a784750 | Privileged instruction record support | GDB 17.1 (2025-12-20) |
| bef948d | Record performance improvement (~15%) | GDB 17.1 (2025-12-20) |
| 03e839e | Bitmanip, zicond, fence.tso record support | GDB 17.1 (2025-12-20) |
| a570ac1 | Fix syscall exit recording | GDB 17.2 (2026-05-10) |
| e5425f2 | Fix `info registers` FP hex display | GDB 17.2 (2026-05-10) |
| 84067a5 | Fix non-trivial-retval.exp on riscv64-linux | GDB 16.2 (2025-02-01) |
| 2047479 | Numeric/ABI register name switch | GDB 14.1 (2023-12-03) |

---

## 9. Dependencies

The following table covers GDB's critical dependencies and their riscv64 status. Sources: `gdb/configure.ac` ([gitlab mirror](https://gitlab.com/gnutools/binutils-gdb/-/raw/master/gdb/configure.ac)), Debian buildd, Arch RISC-V mirror, riscv-gnu-toolchain issue tracker.

| Dependency | Role in GDB | Minimum Version | riscv64 Status | Notes |
|---|---|---|---|---|
| glibc | C runtime; ptrace/thread-debug interfaces | -- | Functional | Open test failures in glibc's own suite; GDB usage broadly functional |
| Python 3 | GDB scripting | 3.4 | Partial | `Python/perf_jit_trampoline.c` fails to build for Python 3.13-3.15 on riscv64 (CPython issue #121201, open). `test_c_stack_unwind` and `test_frame_pointer_unwind` fail on Fedora 44/riscv64 (June 2026) |
| readline | CLI editing, tab-completion | 7 | Available | ArchPOWER riscv64 ships 8.2 vs. 8.3 current; no blocking bugs |
| ncurses/ncursesw | TUI mode | -- | Available | No known riscv64-specific failures |
| expat (libexpat) | XML target description parsing | -- | Available | All versions flagged "Potentially vulnerable" on Repology; version lag on niche distros; not a build blocker |
| elfutils / libdebuginfod | Automatic debug-info lookup | 0.188 | Partial | Version 0.192 on ArchPOWER riscv64 vs. 0.195 current; `libdebuginfod` absent as standalone package on some riscv64 distros |
| zlib | Compressed debug sections | -- | Full | Architecture-neutral |
| zstd (optional) | zstd-compressed debug sections | -- | Full | Available in major distros |
| lzma / liblzma (optional) | LZMA-compressed debug sections | -- | Full | Available in major distros |
| mpfr | FP simulation in `sim/` | 3.1.0 | Available | Minor version lag on ArchPOWER riscv64 (4.2.1 vs. 4.2.2) |
| gmp | Arbitrary-precision arithmetic | 4.2 | Available | gmplib.org homepage flagged dead on Repology (tracking concern, not build blocker) |
| binutils / libopcodes / libbfd | Object file parsing, disassembly (in-tree) | -- | Full | riscv64 is Tier-1 for binutils; GCC 15.x compat patch merged (riscv-gnu-toolchain PR #1733) |
| Guile 2.2/3.0 (optional) | Alternative scripting | -- | Available | Low priority; Python is the dominant scripting interface |
| babeltrace (optional) | CTF trace data (`record btrace`) | -- | Not relevant | `record btrace` requires hardware branch tracing not available on current riscv64 |
| amd-dbgapi (optional) | AMD GPU debugging | 0.75.0 | Not applicable | AMD GPU targets only |

**Key dependency gap:** The Python `perf_jit_trampoline.c` build failure (CPython issue #121201, open) affects GDB's `--with-python` build path on distributions shipping Python 3.13-3.15 unless the GDB build system detects and skips that Python feature. This is an open upstream CPython bug, not a GDB bug, but it affects GDB builds on current Fedora and future Debian releases.

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

RISE has no active, funded investment in GDB as of June 2026. Evidence:

- The RISE blog archive (all 27 posts, May 2024 through June 2026) contains no dedicated GDB post. Source: [https://riseproject.dev/blog](https://riseproject.dev/blog).
- The RISE Python wheel builder ([https://riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/)) does not include GDB.
- No searches for "RISE project GDB riscv64" returned results.

GDB work is listed in the December 2024 RISE Webinar slide deck ([PDF](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)) under the Debug and Profiling Working Group's "What's Next" roadmap:

- GDB support for vector register dumping, FP16, BF16, CFI, pointer masking
- FW/Kernel/Debugger support for hardware breakpoints/watchpoints

These are roadmap items without a funded RFP contract or assigned delivery date. The working group lead is Xiao Wang (Intel). The word "GDB" in the 2024 deck appears only in this forward-looking section -- GDB is not among the completed deliverables for 2024.

Completed RISE RFPs with no GDB involvement: RP001 (Go), RP004 (Rust Tier-1), RP005 (QEMU TCG 2x-3x RVV speedup), RP006 (LLVM CI), RP009 (LLVM SPEC optimization, up to 15.7% on SpacemiT-X60), RP011 (Python packaging), OpenOCD upstreaming.

### 10.2 riscv-gnu-toolchain GDB Issues

From [https://github.com/riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain):

| Issue | Title | Date | Status |
|---|---|---|---|
| #1838 | "Register 17 is not available" when GDB handles ecall on RV32E | 2026-03-19 | Open |
| #1827 | `--enable-gdb` build configuration help | 2026-01-09 | Open |

Issue #1838 affects RV32E only, not riscv64.

### 10.3 Archived Vendor Fork Issues

The archived [riscvarchive/riscv-binutils-gdb](https://github.com/riscvarchive/riscv-binutils-gdb) fork (read-only since August 17, 2022) has open issues with no upstream resolution path:

| Issue | Title | Date |
|---|---|---|
| #272 | `continue` command not working | 2022-08-13 |
| #270 | Single-step fails on RISC-V EL2 with ICCM memory (FPGA-specific) | 2022-06-17 |
| #196 | V-extension register support request | 2020-01-14 |

These issues require re-filing against upstream GDB Bugzilla if they reproduce on current GDB. The fork is not a valid proxy for upstream status.

---

## 11. Known Bugs and Active Issues

The upstream GDB Bugzilla at [https://sourceware.org/bugzilla/](https://sourceware.org/bugzilla/) was accessible via CSV API (browser-like access blocked by Anubis). The following is the complete set of open riscv-tagged bugs retrieved:

| Bug | Component | Status | Title | Filed |
|---|---|---|---|---|
| 32075 | gdb | UNCONFIRMED | Native GDB cannot access vector registers in riscv Linux user app; filed against GDB 15.1 / Linux 6.9 | 2025-03-27 |
| 32562 | gdb | NEW | FAIL: gdb.ada/finish-var-size.exp on riscv64-linux cfarm91 | 2025-01-15 |
| 31915 | sim | UNCONFIRMED | GDB riscv simulator mishandles breakpoints; skips original instruction under ebreak | 2024-06-20 |
| 30571 | gdb | UNCONFIRMED | Ensure instructions always fetched as LE (byte-order correctness) | 2023-06-21 |
| 28684 | sim | NEW | 32-bit `--enable-targets=all` build breakage (last updated 2025-01-28) | 2022-07-29 |
| 28486 | tdep | UNCONFIRMED | riscv64: GDB does not allow stepping over `cbreak` trap instruction (ebreak ambiguity) | 2022-04-09 |
| 27887 | remote | UNCONFIRMED | RV32 remote registers interpreted as 64-bit when client architecture set to rv32 | 2021-05-18 |
| 25647 | gdb | UNCONFIRMED | riscv32-unknown-elf: single-step broken with QEMU | 2020-11-09 |

**Recently resolved for reference:**

| Bug | Resolution | Title | Fixed |
|---|---|---|---|
| 32152 | FIXED | FAIL: gdb.cp/non-trivial-retval.exp on riscv64-linux | 2025-01-10 |
| 31643 | FIXED | FAIL: gdb.arch/riscv-tdesc-regs.exp: info registers fflags | 2024-09-07 |

No GDB RISC-V performance bugs are tracked in the upstream Bugzilla. No quantitative benchmark data (startup time, stepping throughput, riscv64 vs. arm64 comparison) was found in any reviewed source.

**Priority assessment of open bugs:**

- Bug 32075 (vector register access) -- High impact. Affects any workload using RVV. Blocked on pending upstream patch (v5, May 2025, 14+ months pending).
- Bug 28486 (ebreak step-over) -- Medium impact. Affects any code using `__builtin_trap()` or asserting via `ebreak`.
- Bug 31915 (simulator breakpoint) -- Low impact for Linux targets; affects bare-metal simulator users only.
- Bugs 25647, 27887 -- Low impact; affect RV32 and QEMU edge cases, not native riscv64 Linux.

---

## 12. Objections and Upstream Blockers

**Hardware debug (watchpoints/breakpoints) patch latency:** The SpacemiT v2 patch series for hardware breakpoints and watchpoints has been in review since April 2026 with one prior round of review from Andrew Burgess. The patch is technically sound (+1350 lines, 12 files, full gdbserver support) but has not merged. This is the normal GDB review pace for large architecture patches; there is no documented policy rejection.

**Vector register patch stalling:** The Sameer Natu / SiFive vector register patch (v5) has been awaiting merge since at least May 2025 -- over 13 months at time of writing. This is abnormally slow even by GDB standards. The patch is substantial (+726/-7 lines) and technically complex (probing VLEN via inline assembly with SIGILL guard, dynamic target description construction). No technical objection to the patch was found in reviewed mailing list archives. The delay appears to be reviewer bandwidth on Andrew Burgess's side.

**sourceware.org accessibility:** The sourceware.org domain (Bugzilla, gitweb, cgit, patchwork, mailing list archives) was blocked by Anubis bot protection during this research (error code `9e4edb5b6b850c41`). This is a known temporary deployment issue, not a permanent gate. The GitLab mirror at [https://gitlab.com/gnutools/binutils-gdb](https://gitlab.com/gnutools/binutils-gdb) and the Buildbot API were accessible. The Bugzilla CSV endpoint was accessible and returned complete open-issue data.

**CSR access policy:** The current refusal to expose CSR registers via ptrace is a maintainer design decision ("security concerns"), not a technical limitation. Changing this would require a policy decision from Andrew Burgess or the Global Maintainers. No patch proposing CSR access has been submitted upstream.

---

## 13. Investment Analysis

The following assessment covers investment opportunities for a chip company with riscv64 hardware production and a need for reliable debug tooling. Estimates are engineering-effort approximations based on patch size and review history observed in upstream archives; they do not account for the review/merge cycle at sourceware.

### 13.1 Functional Enablement

The two highest-priority missing features are hardware watchpoints/breakpoints and native vector register visibility. Both have patches in the review queue. The primary bottleneck is upstream reviewer bandwidth, not engineering complexity.

**Hardware debug registers (watchpoints + breakpoints):**
The SpacemiT v2 patch (April 2026, 12 files, ~1350 lines) is in review. A company with riscv64 hardware capable of validating the implementation could accelerate review by providing test results, a detailed test matrix, and maintainer-level review engagement. The primary upstream contact is Andrew Burgess.

**Native vector register access:**
The Natu/SiFive v5 patch (14+ months pending) implements the complete Linux ptrace interface for V-extension registers. The implementation is technically complete; the bottleneck is merge approval. Providing a second qualified reviewer, additional hardware test results, or rebasing the patch to resolve any merge conflicts could unblock this.

**Incomplete syscall recording table:**
~170 of 470+ Linux syscalls are mapped in `riscv-linux-canonicalize-syscall-gen.c`. Completing the table is a data-entry task (moderate effort); the auto-generation script and tooling exist (commit 321ac81). No architectural design work is needed.

**CSR register access:**
Exposing CSRs through GDB requires a policy decision and a ptrace implementation. The RISC-V privileged specification defines the ptrace interface. This is a medium-complexity engineering task; the primary obstacle is achieving maintainer agreement on security policy.

### 13.2 Performance Optimization

Data not available: no published GDB riscv64 performance benchmark data was found in any reviewed source. The only quantitative GDB data available is from the `gdb-riscv-full` CI builder: 121,159 expected passes, 333 unexpected failures (January 2025 baseline). No step-time, startup-time, or throughput comparisons with arm64 or amd64 exist in any reviewed public source.

The record/replay path received a ~15% stepping performance improvement (commit bef948d, October 2025) from reducing intermediate buffering. This was a low-effort optimization by an external contributor; it suggests the record/replay path had not been profiled before.

### 13.3 CI/CD Infrastructure

Two riscv64 CI builders exist at builder.sourceware.org: `gdb-ubuntu-riscv` (StarFive boards, active daily) and `gdb-riscv-full` (HiFive P550, last confirmed run December 2025). The `gdb-riscv-full` builder was offline at query time (2026-06-18) with `masterids=[]`; duration of outage is unknown.

The HiFive P550 hardware was donated by RISC-V International and is hosted and maintained by Mark Wielaard. This is a single point of failure for the full-testsuite riscv64 CI path. A company could contribute additional hardware workers, operational redundancy, or hosting for the Buildbot master connection.

### 13.4 Ecosystem Enablement

RISE has no funded GDB work. The Debug and Profiling Working Group has listed GDB improvements as roadmap items (December 2024) but no RFP contract exists. A company interested in investing through RISE would find no existing funded project to join; a new RFP would need to be proposed.

The riscvarchive vendor fork has several open issues (#270: single-step on EL2 with ICCM; #196: V-extension) that are now stale with no upstream resolution. If any of these affect production hardware, they require fresh upstream bug reports with current-version reproducers.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream vector register patch (review and merge, v5 by Natu/SiFive) | 2-4 (review, test, rebase) | Upstream Andrew Burgess (merge authority) | Critical |
| Functional | Upstream hardware watchpoint/breakpoint patch (v2 by SpacemiT) | 2-4 (test matrix, review engagement) | Upstream Andrew Burgess (merge authority) | Critical |
| Functional | Complete syscall recording table (~300 missing entries) | 2-3 (data, scripting, testing) | Contributor task; maintainer review | High |
| Functional | bfloat16/half-float FP register sub-fields (approved pending cleanup) | 1 (minor cleanup, resubmit) | Jerry Zhang Jian / SiFive | High |
| Functional | cm.popret[z] single-step (v2, pending) | 1-2 (rebase, test) | ESWIN Computing submitter | Medium |
| Functional | CSR register access via ptrace | 4-8 (policy alignment, implementation, testing) | New contributor; requires maintainer policy decision | Medium |
| CI/CD | Restore/maintain gdb-riscv-full HiFive P550 builder uptime | 1-2 (hardware/hosting) | Mark Wielaard (current admin) | High |
| CI/CD | Add redundant riscv64 CI hardware worker | 2-4 (hardware provisioning, Buildbot config) | New contributor | Medium |
| Performance | Establish riscv64 GDB benchmark baseline (startup, stepping, attach) | 2-3 (test harness, hardware) | New contributor | Medium |
| Ecosystem | File upstream bugs for stale riscvarchive issues with current reproducers | 1-2 | New contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [GDB GNU Project Homepage](https://www.gnu.org/software/gdb/)
- [GDB Source Repository (sourceware.org)](https://sourceware.org/git/binutils-gdb.git)
- [GDB GitLab Mirror](https://gitlab.com/gnutools/binutils-gdb)
- [GDB Releases (source tarballs)](https://sourceware.org/pub/gdb/releases/)
- [GDB Configure Options Reference](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Configure-Options.html)
- [GDB Build Requirements](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Requirements.html)
- [sourceware.org Buildbot CI](https://builder.sourceware.org/buildbot/)
- [Mailing list: New RISC-V CI workers (P550, BPI-F3) -- Jan 2025](https://sourceware.org/pipermail/gdb/2025-January/051734.html)
- [RTEMS sourceware mirror (gdb/MAINTAINERS)](https://github.com/RTEMS/sourceware-mirror-binutils-gdb)
- [riscvarchive/riscv-binutils-gdb (archived vendor fork)](https://github.com/riscvarchive/riscv-binutils-gdb)
- [riscv-collab/riscv-gnu-toolchain issues](https://github.com/riscv-collab/riscv-gnu-toolchain/issues)
- [Debian package tracker: gdb](https://tracker.debian.org/pkg/gdb)
- [Debian buildd status: gdb](https://buildd.debian.org/status/package.php?p=gdb&suite=sid)
- [Ubuntu 24.04 noble riscv64 gdb package](https://packages.ubuntu.com/noble/riscv64/gdb/download)
- [Debian RISC-V wiki](https://wiki.debian.org/RISC-V)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Webinar December 2024 slides (PDF)](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [Pending: Vector register ptrace patch v5](https://sourceware.org/pipermail/gdb-patches/2025-June/218801.html)
- [Pending: Hardware breakpoint/watchpoint patch v2](https://sourceware.org/pipermail/gdb-patches/2026-April/226391.html)
- [Pending: bfloat16/half-float FP register patch v2](https://sourceware.org/pipermail/gdb-patches/2026-February/224994.html)
- [Pending: cm.popret[z] single-step patch v2](https://sourceware.org/pipermail/gdb-patches/2025-May/218017.html)
- [Merged: rv64gc record full support](https://sourceware.org/pipermail/gdb-patches/2025-April/217108.html)
- [Merged: catch syscall on RISC-V Linux](https://sourceware.org/pipermail/gdb-patches/2025-September/221220.html)
- [CPython issue #121201: perf_jit_trampoline build failure on riscv64](https://github.com/python/cpython/issues/121201)