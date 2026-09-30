---
title: GDB
parent: Project Reports
color: blue
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: readline
    relation: runtime-dependency
    criticality: critical
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
  - name: expat
    relation: runtime-dependency
    criticality: critical
  - name: elfutils
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: GNU MPFR
    relation: runtime-dependency
    criticality: optional
  - name: GNU binutils
    relation: runtime-dependency
    criticality: critical
  - name: GNU Guile
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU bison
    relation: build-dependency
    criticality: critical
  - name: Flex
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: DejaGNU
    relation: test-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: GNU Libtool
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="gdb" %}

# GDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for GDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION]. Where the two research passes that produced this report disagree, both figures are given and the discrepancy is called out explicitly.<br/>

## 1. Project Overview

GDB is the GNU Project's source-level debugger. It supports debugging native processes, remote targets over the GDB Remote Serial Protocol (RSP), bare-metal embedded targets, and post-mortem core files. It is the dominant open-source debugger on Linux across all major architectures.

- Homepage: [https://www.gnu.org/software/gdb/](https://www.gnu.org/software/gdb/)
- Canonical source: [https://sourceware.org/git/binutils-gdb.git](https://sourceware.org/git/binutils-gdb.git). This host is protected by Anubis anti-bot proof-of-work, which blocked both WebFetch and plain curl throughout this research; the git content itself was read via a full local clone and via the [GitLab mirror](https://gitlab.com/gnutools/binutils-gdb).
- License: GPLv3, confirmed directly from `gdb/COPYING` ("GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007, Copyright (C) 2007 Free Software Foundation, Inc.").
- Governance: GNU Project / Free Software Foundation (FSF). GDB is official GNU software. There is no dual FSF/Linux Foundation governance and no RISE membership (see below).
- Patches are submitted by email to gdb-patches@sourceware.org and land directly on `master`; upstream does not use GitHub pull requests. A GitHub mirror exists (`bminor/binutils-gdb`) but is read-only.
- Upstream ships source tarballs only, for every architecture including riscv64: [https://sourceware.org/pub/gdb/releases/](https://sourceware.org/pub/gdb/releases/). Binary distribution is entirely the responsibility of downstream distributions.

**Governance structure** (from `gdb/MAINTAINERS`, read directly off a full clone of the current HEAD of `binutils-gdb.git`):

1. **FSF-appointed GDB Maintainers** ("Steering Committee") - final authority, act on behalf of the GNU project. Current members: Pedro Alves, Joel Brobecker (AdaCore), Doug Evans (Google), Eli Zaretskii.
2. **Global Maintainers** - daily development authority over any patch.
3. **Responsible Maintainers** - per-subsystem/per-target experts.
4. **Authorized Committers** and **Write-After-Approval Maintainers** - narrower or per-patch authority.
5. A separate **Release Manager** and **Patch Champions** role exists outside this hierarchy.

Substantial contributions require FSF copyright assignment (GDB has not dropped this requirement the way GCC did in 2021).

**Global Maintainers and affiliation** (current MAINTAINERS file):

| Name | Affiliation |
|---|---|
| Pedro Alves | independent |
| John Baldwin | FreeBSD project |
| Kevin Buettner | Red Hat |
| Andrew Burgess | Red Hat (also RISC-V Responsible Maintainer, also Release Manager) |
| Luis Machado | independent (`.foss` email address) |
| Simon Marchi | Polytechnique Montreal / EfficiOS (also Release Manager) |
| Tom Tromey | independent |
| Tom de Vries | SUSE |
| Ulrich Weigand | IBM |
| Eli Zaretskii | GNU (also FSF-appointed Steering Committee) |

The earlier catalog entry for this project listed Luis Machado as affiliated with Arm/Linaro [NEEDS VERIFICATION - single-sourced, superseded]; a direct read of the current `MAINTAINERS` file shows an independent `.foss` address instead. The current-source reading is treated as authoritative here.

**Corporate sponsorship / community culture on new ports:** GDB is not a RISE (RISC-V Software Ecosystem) member project and RISE has no active funded investment in it (Section 12 and Section 14.4 detail this). RISE's own published member list states its toolchain focus is LLVM and GCC specifically, not GDB/binutils. There is indirect corporate overlap: Red Hat and Google are both RISE Premier members, and Red Hat employs both of GDB's RISC-V co-maintainers' peers (Kevin Buettner, Andrew Burgess). Community process for new architecture ports is welcoming but review-driven: historical mailing-list guidance is to build and thoroughly test a working port, then bring it to gdb-patches for review; well-tested, complete patches merge quickly, others queue. Ports without a named Responsible Maintainer risk being deleted over time; RISC-V currently has two (Andrew Burgess, Palmer Dabbelt).

## 2. Port History and Upstreaming Timeline

The RISC-V port is fully upstream. There is no vendor fork carrying out-of-tree patches; the archived GitHub mirror `riscvarchive/riscv-binutils-gdb` is a historical, read-only fork (archived 2022-08-17) that predates full upstream RISC-V support and is not an active development location.

| Date | Event | Author | Affiliation |
|---|---|---|---|
| 2017-03 | "RISC-V GDB Port v3" review series posted (earliest organized port attempt) | Palmer Dabbelt | SiFive |
| 2017 (through 2018) | v3 series stalls for lack of maintainer review; Dabbelt later confirms it will not land ("We're not upstream, there is some major feedback on the patch set. We won't make the next release.") | Palmer Dabbelt | SiFive |
| 2017-11-09 | `riscv-tdep.c` authored from scratch (author date on the eventual merge commit) | Andrew Burgess | Embecosm |
| 2018-02-27 | PATCHv2 "gdb: Initial baremetal riscv support" posted to gdb-patches, regression-tested against 8 targets (rv32im/imc/imf/imfc, rv64im/imc/imfd/imfdc) | Andrew Burgess | Embecosm |
| 2018-03-06 | Merged into mainline, commit `dbbb1059e62e9fed10b429c030f76f782cbc1fc4` | Andrew Burgess | Embecosm |
| 2018-09-05 | First shipped: **GDB 8.2** | - | - |
| 2018-08-29 | "RISCV Non-DWARF stack unwinding" 4-patch series posted (adds unwinding for frames without DWARF CFI) | Andrew Burgess | Embecosm |
| 2018-09-03 | Non-DWARF unwinder series merged, commit `78a3b0fab8200fdca2b1b934645c29e7bd502d36`; landed within ~2 days of the 8.2 cut, so first shipping release is uncertain between 8.2 and 8.3 (2019-02-08) [NEEDS VERIFICATION - could not confirm the exact branch cut it made] | Andrew Burgess | Embecosm |
| 2019-10-14 | "Add initial compile command support to RISC-V port" posted; fixes ~228 testsuite failures on riscv64-linux | Jim Wilson | SiFive |
| 2019-10-16 | Merged, commit `ff371ec99988662e16b061fe0f66e989340f129a`; first shipped **GDB 10.1** (2020-10-24) | Jim Wilson | SiFive |
| 2020-02 | gdbserver Linux/RISC-V support added | Maciej W. Rozycki | - |
| 2020-12-02 | Bare-metal core dump support posted (new file `riscv-none-tdep.c`, patch 5/8 of a series); a Verisure contributor requests the design be kept generic enough to share with a future bare-metal Arm port | Andrew Burgess | Embecosm |
| 2021-01 | Unified regset supply function shared between Linux and FreeBSD | Andrew Burgess (as `T-J-Teru`) | - |
| 2021-07 | Fix for stepping out of a signal handler on riscv*-linux | lsix | - |
| 2022-08-17 | `riscvarchive/riscv-binutils-gdb` GitHub mirror archived (read-only from this date) | - | - |
| 2023-03 | SystemTap probe support added | T-J-Teru | - |
| 2023-04 | Compressed-instruction prologue scanner improvements | T-J-Teru | - |
| 2023-10-26 | `scripts/gdb: add lx_current support for riscv` resent to LKML (this revision is the one that actually merged) | Deepak Gupta | Rivos |
| 2023-11-01 | Merged into Linux mainline via Andrew Morton's `mm-nonmm-stable` tree, commit `cd24f44050f31d69ed5851b55ef77ea6346aa814`. (An earlier Nov 2022 posting of the same feature had been cited previously as the merge point; the commit that actually landed cites the Oct 2023 resend, not the 2022 thread.) | Deepak Gupta | Rivos |
| 2025-01 | Numeric/ABI register name switch command | CiaranWoodward | - |
| 2025-01 | Fix for `gdb.cp/non-trivial-retval.exp` on riscv64-linux | Tom de Vries | SUSE |
| 2025-04 | Internal TLS support for riscv (alongside aarch64, x86_64, ppc64, s390x); merged as commit `c34309b` | Kevin Buettner | Red Hat |
| 2025-04 | Record-full support for the rv64gc instruction set; merged as commit `b9c7eed` | Timur Golubovich | affiliation not established [NEEDS VERIFICATION] |
| ~2025-05 | cm.popret[z] single-step patch v2 posted; still not confirmed merged as of this report | ESWIN Computing | ESWIN |
| ~2025-05/06 | Native vector (RVV) register ptrace support v5 posted, [mailing list thread](https://sourceware.org/pipermail/gdb-patches/2025-June/218801.html); still unmerged as of 2026-09-30 | Sameer Natu (Natu/SiFive per the readiness grade) | SiFive [single-sourced on author attribution, NEEDS VERIFICATION] |
| 2025-06 | `catch syscall` support on RISC-V Linux; merged as commit `52bb1ca` | Timur Golubovich | - |
| 2025-07 | ISA string detection fix for disassembly | Marek Pikula / T-J-Teru | - |
| 2025-08 | Privileged instruction record support (wfi, sfence.vma, sret, mret); merged as commit `a784750` | Timur Golubovich | - |
| 2025-10 | Record performance improvement, approximately 15% stepping speedup; merged as commit `bef948d` | Timur Golubovich | - |
| 2025-11 | Bitmanip, zicond, fence.tso, sinval, zihintntl record support; merged as commit `03e839e` | Timur Golubovich | - |
| 2026-02 | bfloat16/half-float FP register sub-field patch v2 posted, [cover letter](https://sourceware.org/pipermail/gdb-patches/2026-February/224994.html); conditionally approved by Andrew Burgess pending cleanup, not yet merged as of 2026-09-30 | Jerry Zhang Jian | SiFive |
| 2026-03 | Fix for syscall exit recording on riscv; merged as commit `a570ac1`, shipped in GDB 17.2 | Tom de Vries | SUSE |
| 2026-04 | Hardware watchpoint/breakpoint support v2 posted, [cover letter](https://sourceware.org/pipermail/gdb-patches/2026-April/226391.html); under review as of 2026-09-30 | SpacemiT | SpacemiT |

Timur Golubovich authored the majority of 2025's record/replay work and was reportedly added to `gdb/MAINTAINERS` on 2025-06-17 (commit `b968541`) in the prior version of this report; his affiliation could not be independently established in this round and remains [NEEDS VERIFICATION].

## 3. Upstream Support Tier

GDB has no formal tiered support-classification system analogous to, for example, Rust's Tier 1/2/3 target policy. Architecture support is effectively binary: a target is either in-tree with an entry (ideally a Responsible Maintainer) in `MAINTAINERS`, or it is not. Some historically unmaintained targets are marked "Deleted" inline in `MAINTAINERS` (reported previously as including mcore, nios2, ns32k) rather than demoted to a lower tier [NEEDS VERIFICATION - this specific list of deleted targets was not re-confirmed in this research pass].

The RISC-V target is listed under Responsible Maintainers in `gdb/MAINTAINERS`:

```
riscv    --target=riscv32-elf
         --target=riscv64-elf
         Andrew Burgess    aburgess@redhat.com   (Red Hat)
         Palmer Dabbelt    palmer@dabbelt.com    (currently Meta)
```

Palmer Dabbelt's employer has changed since the prior version of this report, which recorded him at Google. His career path is SiFive to Google to Rivos to Meta, with the move to Meta following Meta's acquisition of Rivos in October 2025. Andrew Burgess is also the current GDB Release Manager and a Global Maintainer, employed by Red Hat, a RISE Premier member.

There is no separate governance document for the riscv target; it follows the same `MAINTAINERS`-driven process as every other target.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree, named Responsible Maintainer(s) | Yes (multiple) | Yes (multiple) | Yes (2: Burgess, Dabbelt) |
| Formal tier designation | None (GDB has no tier system) | None | None |
| CI testing riscv64 hardware (build=yes, test=yes) | N/A | N/A | Yes, two Buildbot builders (Section 7) |
| Release-blocking for GDB | No architecture is release-blocking under GDB's policy | No | No |
| Official upstream binary | No (source tarball only, all archs) | No | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source File Inventory

Confirmed present, with line counts verified by direct reading of current upstream source (via the `gitlab.com/gnutools/binutils-gdb` mirror, cross-checked against Google's, Android's, Fuchsia's, and the PULP-platform's independent mirrors, which all show the identical file layout):

**Core GDB layer (`gdb/`):**
- `gdb/riscv-tdep.c` (5,470 lines) - register set, calling conventions, prologue scanner, instruction decode for unwinding, ABI call/return logic for LP64/LP64F/LP64D/ILP32, atomic lr/sc single-step handling, process-record engine. Grep found zero TODO/FIXME/"unimplemented" markers other than one intentional runtime warning for syscalls missing from the record table.
- `gdb/riscv-tdep.h`
- `gdb/riscv-linux-tdep.c` (576 lines) - Linux OS-ABI layer: full glibc and musl TLS/DTV lookup, signal-frame unwinding, syscall catch/record dispatch.
- `gdb/riscv-linux-nat.c` (337 lines) - native ptrace layer. Confirms MISA is hard-coded to zero and all other CSR access is explicitly refused, with an in-source comment citing "security concerns" - this is a deliberate design stub, not an accidental gap.
- `gdb/riscv-none-tdep.c` (169 lines) - bare-metal/no-OS ABI, including core-dump generation.
- `gdb/riscv-fbsd-tdep.c` (213 lines) and `gdb/riscv-fbsd-nat.c` - FreeBSD OS-ABI and native layers.
- `gdb/riscv-ravenscar-thread.c` (75 lines) - Ada Ravenscar thread support.
- `gdb/riscv-linux-canonicalize-syscall-gen.c` (360 lines) - auto-generated syscall table, 326 mapped `case` entries confirmed by direct count. This corrects an earlier estimate of "~170 of 470+" mapped syscalls; the true count is meaningfully higher but still short of full modern Linux syscall coverage (io_uring, clone3, mseal, and other syscalls in the 424-469 range remain unmapped).

**Shared architecture description (`gdb/arch/`):**
- `gdb/arch/riscv.c` (134 lines) - line 89 unconditionally raises `error(_("unable to create vector feature"))` for native targets, confirming V-extension register support is genuinely missing on native targets. Remote targets that supply their own target description can still expose vector registers.
- `gdb/arch/riscv.h`

**Native target-description support (`gdb/nat/`):**
- `gdb/nat/riscv-linux-tdesc.c` / `.h`

**gdbserver:**
- `gdbserver/linux-riscv-low.cc` (348 lines) - confirmed no in-process agent (IPA), no branch-trace, no hardware-watchpoint code paths.

**Target description XML features (`gdb/features/riscv/`):** 32-bit and 64-bit CPU/CSR/FPU descriptor files plus `rebuild-csr-xml.sh`.

**Simulator (`sim/riscv/`):** 31 files, standalone in-tree instruction-set simulator (`model32.c` ~27k lines, `model64.c` ~37k lines) used via `target sim` for bare-metal targets without an external emulator.

No `.S` hand-written assembly files, JIT compilation backend, or SIMD dispatch code exist in the RISC-V GDB port. GDB is a debugger, not a JIT-compiling runtime; its RISC-V support is C source implementing register layouts, unwinding, ABI handling, and ptrace/core-file register decoding, not generated machine code of its own.

### 4.2 Component Coverage

Re-mapped onto a full / partial / stub / missing rubric (the SIMD-oriented hand-tuned/intrinsics/scalar/missing rubric used for math-kernel libraries does not apply to a debugger backend):

| Component | Status | Notes |
|---|---|---|
| GPR/FPR registers | Full | All 32 GPRs + 32 FPRs, 32-bit and 64-bit variants, RV32E variant, pseudo-registers for fflags/frm via fcsr masking |
| Software breakpoints | Full | EBREAK (4-byte) and C.EBREAK (2-byte compressed), both in GDB client and gdbserver |
| Hardware breakpoints | Missing | No ptrace-based hardware debug register support. Patch pending: [SpacemiT v2, under review since April 2026](https://sourceware.org/pipermail/gdb-patches/2026-April/226391.html) |
| Hardware watchpoints | Missing | Same gap; no `insert_hw_watchpoint` override exists in `riscv-linux-nat.c` |
| Prologue unwinder | Partial | `riscv_scan_prologue` implemented but self-acknowledged incomplete in source comments; DWARF fallback used in practice |
| DWARF unwinding | Full | DWARF2 frame unwinder registered; signal-frame handling via `tramp_frame` |
| Signal frame unwinding | Full | Maps all GPRs and FPRs from `mcontext_t` |
| Calling convention | Full | `riscv_push_dummy_call` implemented for LP64D/LP64F/LP64/ILP32 |
| CSR register access (ptrace) | Stub (deliberate) | MISA hard-coded to zero; all other CSRs explicitly refused, citing security concerns in source comments. No patch proposing CSR access has been submitted upstream |
| Vector (V-extension) registers, native | Missing | `arch/riscv.c` throws on native vector target-description creation. Patch pending: [Natu/SiFive v5, posted ~May/June 2025](https://sourceware.org/pipermail/gdb-patches/2025-June/218801.html), unmerged as of 2026-09-30 |
| Vector registers, remote targets | Partial | Works when the remote stub supplies its own target description |
| Record/replay, base rv64gc | Full | Merged April 2025, commit `b9c7eed` |
| Record/replay, newer extensions | Partial | Bitmanip, zicond, fence.tso, sinval, zihintntl, csrrci, and privileged instructions (wfi/sfence.vma/sret/mret) added through 2025; V-extension not covered. ~15% stepping-speed improvement landed October 2025 (commit `bef948d`) |
| Syscall catchpoints | Full | `low_supports_catch_syscall` returns true; reads `$a7`; XML syscall table registered (commit `52bb1ca`, 2025-08) |
| Syscall recording table | Partial | 326 of ~470+ Linux syscalls mapped in the auto-generated table; newest syscalls (io_uring, clone3, mseal, etc.) are unmapped |
| TLS | Full | Handles both musl (offset 0x800) and glibc (offset 0) DTV layouts, merged April 2025 (commit `c34309b`) |
| ABI register naming toggle | Full | Numeric vs. ABI (`zero`, `sp`, `a0`, etc.) name switch command, merged 2025 |
| ISA string / disassembly detection | Full | Fixed 2025 (commit `1324b95`) |
| bfloat16 / half-float FPU sub-fields | Pending | v2 conditionally approved, awaiting minor cleanup as of Feb 2026 |
| cm.popret[z] single-step | Pending | v2 posted ~May 2025, no confirmed merge found |
| SystemTap probes | Full | Added 2023 |
| Ada Ravenscar threads | Full | Callee-saved integer and FP registers mapped for RV32/RV64 |
| FreeBSD support | Full | Both tdep and nat layers complete |
| Bare-metal / "none" ABI | Full | Includes GPR/FPR/CSR core-dump regsets |
| Branch tracing (`record btrace`) | Not available | No hardware branch-tracing facility on current RISC-V silicon |
| In-process agent (IPA) | Missing | Not set in gdbserver's `configure.srv` |

### 4.3 Known gdbserver Bug

`breakpoint_kind_from_pc` in `gdbserver/linux-riscv-low.cc` reportedly contains a parenthesis placement error passing `buf.insn == sizeof(riscv_ibreakpoint)` as an argument to `riscv_insn_length` rather than `buf.insn` itself. This claim traces to a single source (a `T-J-Teru` mirror) and could not be independently confirmed against a second source due to Anubis blocking sourceware.org across both research passes. [NEEDS VERIFICATION]

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build System

GDB builds exclusively with GNU Autotools (autoconf/automake) and recursive Makefiles generated from `configure`/`configure.ac`. There is no `CMakeLists.txt` anywhere in the repository (top level and `gdb/` both checked) and no `Dockerfile` anywhere in the tree (top level, `contrib/`, and `gdb/` all checked). No CI configuration is committed in the `binutils-gdb` repository itself; CI is driven from a separate `builder.git` config repository on sourceware.org (Section 7). `-DUSE_X=OFF` style flags do not apply; the equivalent knobs use `--enable-X`/`--disable-X`/`--with-X`/`--without-X` syntax.

### 5.2 Required Toolchain

- **C++17 is mandatory.** `gdb/configure.ac`: `AX_CXX_COMPILE_STDCXX(17, , mandatory)`. `gdb/NEWS` for GDB 15 states: "Building GDB and GDBserver now requires a C++17 compiler. For example, GCC 9 or later." Configure hard-fails without it.
- **GNU Make >= 3.82** required; other make implementations are unsupported.
- **Python >= 3.4** for `--with-python` scripting.
- **Readline >= 7** if `--with-system-readline` is used.
- `--with-gmp=DIR` and `--with-mpfr=DIR` are required for target floating-point emulation.

### 5.3 RISC-V Target Triplets

From `config.sub` and `bfd/config.bfd`: recognized CPU components include `riscv`, `riscv32`, `riscv32be`, `riscv64`, `riscv64be`. Valid triplets: `riscv64*-*-*` (bare-metal ELF, `riscv_elf64_vec`), `riscv64*-*-linux*`, `riscv64*-*-freebsd*`, plus big-endian `riscv64be*-*-*`.

Per-target object selection, from `gdb/configure.tgt`:
- `riscv*-*-linux*` -> `riscv-linux-canonicalize-syscall-gen.o riscv-linux-tdep.o glibc-tdep.o linux-tdep.o solib-svr4.o solib-svr4-linux.o symfile-mem.o linux-record.o svr4-tls-tdep.o`
- `riscv*-*-freebsd*` -> `riscv-fbsd-tdep.o`
- generic `riscv*-*-*` -> `riscv-tdep.o riscv-none-tdep.o arch/riscv.o ravenscar-thread.o riscv-ravenscar-thread.o`
- `gdb_sim=riscv` links GDB's in-tree simulator, `sim/riscv/libsim.a`, usable via `target sim` without any external emulator

The Debian RISC-V port baseline is RV64GC with the lp64d ABI ([Debian RISC-V wiki](https://wiki.debian.org/RISC-V)).

### 5.4 Example Build Commands

Native build on a riscv64 host:

```sh
mkdir build && cd build
../configure --prefix=/usr/local \
  --with-expat --with-python=python3 --with-system-zlib \
  --with-system-readline --enable-tui --with-lzma --enable-64-bit-bfd
make -j$(nproc)
make install
```

Cross-compilation (riscv64-targeting GDB on an x86_64 host):

```sh
mkdir build-cross && cd build-cross
../configure --prefix=/usr/local \
  --target=riscv64-unknown-linux-gnu --host=x86_64-linux-gnu --build=x86_64-linux-gnu \
  --with-expat --with-python=python3 --with-system-zlib --with-system-readline \
  --enable-64-bit-bfd --with-sysroot=/usr/riscv64-linux-gnu
make -j$(nproc)
```

Configure must run from the repository root, not `gdb/` directly, or the build fails with "No rule to make target ../bfd/bfd.h".

Minimum GDB version supporting `riscv*-*-linux*`: **GDB 8.3** ([Debian RISC-V wiki](https://wiki.debian.org/RISC-V)).

### 5.5 gdbserver riscv64 Capabilities

`gdbserver/configure.srv`: `riscv*-*-linux*` sets `srv_linux_regsets=yes`, `srv_linux_usrregs=yes`, `srv_linux_thread_db=yes`. Explicitly absent: in-process agent (`ipa_obj` unset), branch trace (`srv_linux_btrace` unset), `srv_xmlfiles`.

### 5.6 QEMU in the Build/Test Path

QEMU is not referenced anywhere in the upstream documentation or build system: a full-text grep of `gdb/doc/gdb.texinfo` (52,763 lines) and `gdb/NEWS` returned zero matches for "qemu". `gdb/testsuite/boards/` has no QEMU-specific board file. QEMU enters the picture only externally, either as `qemu-riscv64` user-mode emulation to run cross-compiled test binaries under a custom DejaGNU board, or as `qemu-system-riscv64 -gdb tcp::1234` acting as a remote stub target. Neither pattern is scripted in-tree. Separately, QEMU's own gdbstub has a known riscv64/KVM bug unrelated to GDB itself: [qemu-project/qemu#2991](https://gitlab.com/qemu-project/qemu/-/issues/2991), where the vcpu is treated as starting in M-mode when KVM actually starts it in S-mode.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

No systematic, published comparison of GDB feature coverage between riscv64, arm64, and amd64 was found in any source reviewed. The table below is derived from direct architecture-specific source inspection rather than a published document.

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Software breakpoints | Full | Full | Full | None |
| Hardware breakpoints | Full | Full | Missing | No ptrace hardware debug register support; patch pending |
| Hardware watchpoints | Full | Full | Missing | Same |
| Process record/replay | Full | Full | Partial | Missing V-extension and several newer ISA extensions |
| Branch tracing (`record btrace`) | Full (Intel PT, BTS) | Full (CoreSight) | Not available | No hardware branch tracing facility on current silicon |
| Native vector register access | Full (AVX/SSE) | Full (SVE/NEON) | Missing | `arch/riscv.c` throws on native vector target-description creation |
| CSR/system register access | N/A | N/A (system regs via ptrace) | Stub (deliberate) | MISA hard-coded zero; other CSRs refused for stated security reasons |
| TLS support | Full | Full | Full | None, added 2025 |
| SystemTap probes | Full | Full | Full | None, added 2023 |
| In-process agent (IPA) | Full | Full | Missing | Not set in gdbserver configure |
| catch syscall | Full | Full | Full | None, added 2025 |
| Signal frame unwinding | Full | Full | Full | None |
| Prologue unwinder | Full | Full | Partial | Self-acknowledged incomplete; DWARF fallback in practice |
| FreeBSD native support | Full | Full | Full | None |

The two most impactful gaps relative to arm64 and amd64 remain:

1. **Hardware debug registers.** Every riscv64 debug session relies on software breakpoints only, which require write access to target memory. A v2 patch from SpacemiT has been under review since April 2026.
2. **Native vector register visibility.** Any process using the V extension cannot have its vector registers inspected in a native GDB session (remote debugging with a custom target description still works). The Natu/SiFive v5 patch has been pending merge since roughly May/June 2025, i.e. approximately 15-16 months as of this writing.

Data not available: no quantitative riscv64-vs-arm64 (or vs. amd64) GDB performance comparison, with methodology, was found in the RISE blog, arXiv HPC papers, or general web search across two independent research passes.

## 7. CI/CD Infrastructure

### 7.1 CI System

GDB uses exclusively **Buildbot**, hosted at [https://builder.sourceware.org/buildbot/](https://builder.sourceware.org/buildbot/). There is no `.gitlab-ci.yml` and no `.github/` workflow directory in `binutils-gdb`. The actual CI configuration lives in a separate repository, `sourceware.org/git/?p=builder.git` (master.cfg), which was itself blocked by Anubis for direct fetch in both research passes; live facts below come from the Buildbot REST API rather than the config file, which is the more reliable source.

### 7.2 RISC-V Builders

**`gdb-ubuntu-riscv` (builder ID 294)**
- Tags: `gdb`, `ubuntu`, `riscv`
- 5 physical workers: `starfive-riscv`, `starfive-1` through `starfive-4`, running Ubuntu 24.04.4 LTS on riscv64, kernel `Linux 6.17.0-29-generic riscv64`
- Most recent build at time of writing: **#5335, "build successful", completed 2026-09-30** (day of this research)
- A sampled build's step list (#706171) confirms genuine full-testsuite CI, not a compile-only check: `git checkout` -> `configure` -> `make` -> **`make check-gdb`** -> test-result upload
- Admin: Mark Wielaard
- The board model (reported as a StarFive VisionFive V2 in prior config-file reads) could not be independently confirmed in this pass since the config file itself was Anubis-blocked; the `starfive-*` worker hostnames are consistent with StarFive hardware but the exact model number is [NEEDS VERIFICATION]

**`gdb-riscv-full` (builder ID 335)**
- Tags: `gdb-full`, `hifive`, `riscv`
- Single worker `p550`: a SiFive HiFive Premier P550 board, donated by RISC-V International, announced January 2025 ([mailing-list announcement](https://sourceware.org/pipermail/gdb/2025-January/051734.html))
- Most recent build: **#483, "build successful", completed 2025-12-19** - stale by over 9 months as of 2026-09-30
- Root cause confirmed via the live Buildbot masters API: the `p550` worker is connected to masterid 1, which the masters API reports as `active: false` (last active November 2025), rather than masterid 2, the currently active master. The builder is genuinely stuck pointed at a dead master, not a transient network blip - a confirmed single point of failure for the full-testsuite riscv64 CI path
- Last known test baseline: approximately 121,159 expected passes, 333 unexpected failures (January 2025)
- Admin: Mark Wielaard

### 7.3 Related riscv64 Builders (non-GDB)

The same Buildbot instance runs riscv64 CI for `binutils`, `glibc`, `gcc`, `valgrind`, `elfutils`, `libabigail`, `annobin`, `systemtap-fedrawhide-riscv64`, `gnupoke`, `dwz`, and `bzip2`, sharing the same physical worker fleet. GDB's riscv64 CI sits inside a broader riscv64 CI effort for the whole GNU toolchain on this infrastructure.

### 7.4 RISE Runner Usage

GDB's riscv64 CI runs entirely on sourceware.org's own Buildbot infrastructure. There is no evidence it uses RISE's GitHub Actions runner fleet (`riscv-runner`/`riscv-runners.riseproject.dev`).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | Buildbot | Buildbot | Buildbot (same infra) |
| Hardware | Various | Various | Real hardware: StarFive-class boards (active) and SiFive HiFive P550 (stale, 9+ months) |
| Full testsuite (`make check-gdb`) run | Yes | Yes | Yes, on `gdb-ubuntu-riscv`; also configured but currently non-functional on `gdb-riscv-full` |
| Release-blocking | No | No | No |

## 8. Distribution and Release Status

### 8.1 Upstream Source Releases

GDB upstream ships source tarballs only, for every architecture: [https://sourceware.org/pub/gdb/releases/](https://sourceware.org/pub/gdb/releases/). A direct read of the git repository's tags shows the current latest is **GDB 18.1** (tag `gdb-18.1-release`), with 17.2, 17.1, 16.3 and 16.2 as recent prior releases; an exact release date for 18.1 was not captured in this research. Data not available: exact 18.1 release date. The distributions checked below currently package GDB 17.1, one release series behind the 18.1 tag - this lag is uniform across architectures and is not riscv64-specific.

### 8.2 Binary Package Status

| Distribution / channel | riscv64 available | Version | Evidence |
|---|---|---|---|
| PyPI (`pip install gdb`) | N/A | N/A | HTTP 404 - no package named `gdb` exists on PyPI for any architecture; GDB's Python API ships embedded in the GDB binary, not as a wheel. This is a category mismatch, not a riscv64 gap |
| RISE Python wheel builder | N/A | N/A | Redirects (HTTP 302) to PyPI, same 404 result |
| Ubuntu 26.04 "resolute" | Yes | 17.1-2ubuntu1 | Confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=gdb&suite=resolute): "resolute (26.04LTS) (devel): GNU Debugger, 17.1-2ubuntu1: amd64 arm64 armhf i386 ppc64el riscv64 s390x". Related packages `gdb-avr`, `gdb-bpf`, `gdb-doc`, `gdb-minimal`, `gdb-multiarch`, `gdb-mingw-w64`, `gdb-mingw-w64-target`, `gdb-source`, `gdbserver` also present, several also listing riscv64 |
| Ubuntu 24.04 "noble" (historical baseline) | Yes | 15.0.50.20240403-0ubuntu1 | [packages.ubuntu.com/noble/riscv64/gdb/download](https://packages.ubuntu.com/noble/riscv64/gdb/download) |
| Debian sid (unstable) | Yes | Confirmed present per the live research pass; the specific build (17.2-1, host `rv-osuosl-01`) reported in an earlier pass was not independently re-confirmed this round [NEEDS VERIFICATION on exact version/builder] | General presence: [Debian package tracker](https://tracker.debian.org/pkg/gdb), [buildd status](https://buildd.debian.org/status/package.php?p=gdb&suite=sid) |
| Debian bookworm (stable) | Partial (reported) | `gdb-minimal` only for riscv64, not the full `gdb` package with Python/TUI/debuginfod/expat support | Single-sourced from the prior version of this report, not re-verified this round [NEEDS VERIFICATION] |
| Arch Linux RISC-V | Yes | 17.1-2 | `gdb-17.1-2-riscv64.pkg.tar.zst` (9,012,214 bytes, dated 29-Jan-2026) plus `gdb-common-17.1-2-riscv64.pkg.tar.zst`, both at [mirrors.felixc.at/archriscv/repo/extra/](https://mirrors.felixc.at/archriscv/repo/extra/). No riscv64-specific patches required; `blacklist.txt` (the archriscv "not built" list) has no `gdb` entry |

**Methodology note:** the commonly cited Arch RISC-V search URL `archriscv.felixc.at/?q=gdb` is a dead, non-functional static landing page with no working search form or API behind the `?q=` parameter. Verification required going directly to the mirror's directory listing instead; anyone repeating this check should not trust that URL as a search tool.

No official upstream riscv64 binary exists for GDB; a working riscv64 binary is obtained exclusively through a distribution (Ubuntu, Debian, Arch Linux RISC-V, and similar), none of which require riscv64-specific patches. This is the basis for the `release_provider: distro` classification in Section 13.

## 9. Dependencies

Table covers every dependency specified for this assessment plus indirect dependencies surfaced by research. Sources: `gdb/README` and `gdb/configure.ac` (via the GitLab mirror), Debian source-package control data (`sources.debian.org/src/gdb`), a project-graph SPARQL query run directly against the exported dataset when the live MCP connector was unavailable, and Ubuntu 26.04 "resolute" package listings.

| Dependency | Relation | Criticality | riscv64 status | Notes |
|---|---|---|---|---|
| glibc | runtime-dependency | critical | Functional | C runtime and ptrace/thread-debug interfaces; broadly functional for GDB's purposes despite glibc's own open test failures elsewhere |
| Python | runtime-dependency | critical | Confirmed on riscv64/resolute; rated blue (strong) in its own project report | An earlier version of this report flagged an open CPython build issue (`perf_jit_trampoline.c` failing to build on riscv64 for Python 3.13-3.15, CPython issue #121201) as causing a partial GDB Python-scripting build path. That claim is single-sourced and not corroborated by this round's dependency research, which found no blocking Python issue for riscv64. Flagged as a discrepancy: treat the CPython #121201 claim as [NEEDS VERIFICATION] rather than confirmed |
| readline | runtime-dependency | critical | Confirmed on riscv64/resolute; rated yellow in its own report | Pure POSIX/termios implementation, no assembly/SIMD/arch-detection code, no known riscv64-specific issue |
| ncurses | runtime-dependency | optional | Confirmed on riscv64/resolute | Required only for GDB's TUI mode; mature, portable, no known riscv64 issue |
| expat | runtime-dependency | critical | Confirmed on riscv64/resolute; rated yellow in its own report | Required for remote-protocol target descriptions, memory maps, and tracepoint definitions. A 2024-02 riscv64 packaging build failure (`g_bytesScanned` undeclared, seen on openSUSE) traced to an incomplete 2.6.0 backport has since been fixed upstream |
| elfutils | runtime-dependency | optional | Confirmed on riscv64/resolute; rated blue (strong) in its own report | Backs `set debuginfod enabled` / automatic debug-info fetch via `libdebuginfod` |
| zlib | runtime-dependency | critical | Confirmed on riscv64/resolute; rated blue (strong) in its own report | Decompresses compressed ELF/DWARF sections and core dumps |
| zstd | runtime-dependency | optional | Confirmed on riscv64/resolute; rated blue (strong) in its own report | Decompresses zstd-compressed DWARF5 sections from modern linkers |
| xz (liblzma) | runtime-dependency | optional | Confirmed on riscv64/resolute; rated yellow in its own report | Decompresses xz/lzma-compressed sections. Note for context, not a riscv64-specific issue: the 2024 XZ supply-chain backdoor, CVE-2024-3094, fixed in >= 5.6.2 |
| GNU MPFR | runtime-dependency | optional | Confirmed on riscv64/resolute | Arbitrary-precision float formatting for target FP values, `--with-mpfr`, required since GDB 7.7. No dedicated project report exists in the sw-ecosystem catalog for this dependency |
| GNU binutils | runtime-dependency | critical | Confirmed on riscv64/resolute | `binutils-gdb.git` is a monorepo: libbfd, libopcodes, libctf, libsframe, and libiberty are built in-tree from the same repository rather than pulled in as separate packages, so their riscv64 status is identical to GDB's own (confirmed built and released for riscv64/resolute) |
| GNU Guile | runtime-dependency | optional | Not part of the riscv64-relevant distro build | GDB upstream supports `--with-guile` as an alternative scripting language to Python, but it is absent from the actual Debian/Ubuntu `gdb` package's `Build-Depends`, so it does not factor into the riscv64 packaging status |
| GCC | build-dependency | critical | riscv64 well supported (Tier-1-equivalent in practice) | C++17 is mandatory (`AX_CXX_COMPILE_STDCXX(17, , mandatory)`); GDB 15's `NEWS` documents GCC 9 as the minimum practical compiler |
| GNU bison | build-dependency | critical | Confirmed on riscv64/resolute | - |
| Flex | build-dependency | critical | Confirmed on riscv64/resolute | - |
| autoconf | build-dependency | optional | Present on riscv64 as `Architecture: all` (Debian/Ubuntu); not distinctly tagged riscv64 in the project-graph dataset | Treated as a data-collection gap in the graph tooling rather than a real unavailability, since `Architecture: all` packages install on any architecture |
| DejaGNU | test-dependency | critical | Present on riscv64 as `Architecture: all` (Debian/Ubuntu); not distinctly tagged riscv64 in the project-graph dataset | Same caveat as autoconf. DejaGNU is confirmed actually exercising the riscv64 testsuite in live CI (`make check-gdb` on builder 294), which is stronger evidence of functional availability than the package-graph tag alone |
| QEMU | test-dependency | optional | Not documented or scripted anywhere in-tree (Section 5.6) | Used informally, outside the build system, to run cross-compiled riscv64 test binaries or as a `target remote` gdbstub. QEMU's own riscv64/KVM gdbstub has an [open, unrelated bug](https://gitlab.com/qemu-project/qemu/-/issues/2991) |
| GNU Libtool | build-dependency | optional | Present on riscv64 as `Architecture: all` (Debian/Ubuntu); not distinctly tagged riscv64 in the project-graph dataset | Same caveat as autoconf/DejaGNU; not a real blocker |

**Indirect dependency found via recursion:** **GMP** is a transitive dependency of GNU MPFR, backing its arbitrary-precision arithmetic. It is confirmed present and released for riscv64 in Ubuntu 26.04 "resolute." It was listed as a direct critical dependency in an earlier version of this catalog entry; per the dependency list specified for this report it is now tracked only as an indirect dependency of MPFR, with no change in its riscv64 availability.

**Explicitly out of scope for riscv64 (not real gaps):** `libipt` (Intel Processor Trace, `record btrace pt`) is restricted by Debian/Ubuntu to `[amd64 i386 x32]` by design since Intel PT has no RISC-V equivalent; GDB's configure script disables the optional feature gracefully when the library is absent. `libunwind-dev` is restricted to `[ia64]` and is likewise irrelevant to riscv64.

**Bottom line:** every dependency GDB actually links into Ubuntu's `gdb`/`gdb-multiarch` packages builds and is released natively for riscv64 in the 26.04 "resolute" archive. No dependency currently blocks a riscv64 GDB build or release.

## 11. Known Bugs and Active Issues

### 11.1 Current Upstream Bugzilla (product=gdb, matching "riscv", NEW/UNCONFIRMED/ASSIGNED/REOPENED)

This is the authoritative, current tracker; it supersedes the archived GitHub fork's issue list below.

| Bug | Component | Status | Title |
|---|---|---|---|
| [25647](https://sourceware.org/bugzilla/show_bug.cgi?id=25647) | gdb | UNCONFIRMED | riscv32-unknown-elf: next instructions fail to execute normally |
| [27887](https://sourceware.org/bugzilla/show_bug.cgi?id=27887) | remote | UNCONFIRMED | RISC-V remote registers interpreted as 64-bit when client architecture is set to rv32 |
| [28486](https://sourceware.org/bugzilla/show_bug.cgi?id=28486) | tdep | UNCONFIRMED | [riscv64] GDB does not allow stepping over an ebreak trap instruction |
| [28684](https://sourceware.org/bugzilla/show_bug.cgi?id=28684) | sim | NEW | [RISCV] 32-bit `--enable-targets=all` build breakage |
| [30571](https://sourceware.org/bugzilla/show_bug.cgi?id=30571) | gdb | UNCONFIRMED | [gdb, riscv] ensure instructions are always fetched as little-endian |
| [31915](https://sourceware.org/bugzilla/show_bug.cgi?id=31915) | sim | UNCONFIRMED | gdb sim for riscv mishandles breakpoints, skips the original instruction under ebreak |
| [32075](https://sourceware.org/bugzilla/show_bug.cgi?id=32075) | gdb | UNCONFIRMED | Native GDB cannot debug a Linux user app using the RISC-V vector extension |
| [32562](https://sourceware.org/bugzilla/show_bug.cgi?id=32562) | gdb | NEW | FAIL: `gdb.ada/finish-var-size.exp: print pck.get(True)` on riscv64-linux |

Source: [sourceware.org GDB Bugzilla, riscv search](https://sourceware.org/bugzilla/buglist.cgi?product=gdb&short_desc=riscv).

**Recently resolved (reported in the prior version of this catalog entry, not re-confirmed this round):**

| Bug | Resolution | Title | Fixed |
|---|---|---|---|
| 32152 | FIXED | FAIL: `gdb.cp/non-trivial-retval.exp` on riscv64-linux | 2025-01-10 [NEEDS VERIFICATION] |
| 31643 | FIXED | FAIL: `gdb.arch/riscv-tdesc-regs.exp: info registers fflags` | 2024-09-07 [NEEDS VERIFICATION] |

### 11.2 Priority Assessment

- **Bug 32075 (vector register access)** - high impact, affects any workload using RVV; blocked on the pending upstream patch (v5, pending since ~May 2025, 15+ months at time of writing).
- **Bug 28486 (ebreak step-over)** - medium impact; affects code using `__builtin_trap()` or asserting via `ebreak`.
- **Bug 31915 (simulator breakpoint handling)** - low impact for Linux targets; affects bare-metal simulator users only.
- **Bugs 25647, 27887** - low impact; RV32 and QEMU edge cases, not native riscv64 Linux.

None of the open bugs are release-blocking.

### 11.3 Other Reported Issues (non-Bugzilla, third-party, or historical)

- QEMU: gdbstub broken on `qemu-system-riscv64` with KVM enabled, [qemu-project/qemu#2991](https://gitlab.com/qemu-project/qemu/-/issues/2991).
- OpenOCD: unable to single-step via GDB due to a wrong PC, [riscv-collab/riscv-openocd#360](https://github.com/riscv-collab/riscv-openocd/issues/360).
- OpenOCD: changes to `gdb_server.c` reportedly break debugging of some or all non-RISC-V targets, [riscv-collab/riscv-openocd#115](https://github.com/riscv-collab/riscv-openocd/issues/115).
- Mailing list (2017): GDB hangs/multi-second delays when stepping off a breakpoint on RISC-V, no reproducible numbers, [gdb mailing list, July 2017](https://sourceware.org/pipermail/gdb/2017-July/046743.html).
- An SV39 virtual-addressing PC-truncation report (GDB reportedly sees a truncated 40-bit PC instead of the full 64-bit width for RV64 apps under SV39) surfaced in search but no Bugzilla number could be found; likely folded into the vector/tdep bugs above or unfiled upstream. [NEEDS VERIFICATION]

### 11.4 Archived Vendor-Fork Issues (historical, no upstream resolution path)

`riscvarchive/riscv-binutils-gdb`, archived (read-only) since 2022-08-17, predates most real RISC-V port development. Closed issues from that fork (bugs largely resolved by the time upstream RISC-V support matured): #7 (`info locals` using sp instead of fp, 2016), #86 (glibc linker error, 2017), #90 ("No registers" / non-functional port, 2017), #157 (crash on startup, 2018). Open but unresolvable (the repo cannot accept fixes): #196 (V-extension support request, 2020, no response ever posted), #230 (infrun.c internal error, 2020), #242 (unspecified internal error, 2020), #256 (unspecified issue, 2021), #270 (single-step failure on EL2 with ICCM memory, FPGA-specific, 2022), #272 (`continue` reported non-functional, 2022, filed 4 days before the archive date and never followed up). These require re-filing against current upstream GDB Bugzilla if they still reproduce; the fork is not a valid proxy for current status.

## 12. Objections and Upstream Blockers

**Hardware debug (watchpoints/breakpoints) patch latency.** The SpacemiT v2 series has been in review since April 2026, with one prior round of feedback from Andrew Burgess. It is technically substantial (roughly 1,350 lines across 12 files with full gdbserver support) but unmerged. This is within GDB's normal review pace for a large architecture patch; no documented policy rejection exists.

**Vector register patch stalling.** The Natu/SiFive v5 patch has been awaiting merge since roughly May/June 2025 - over a year at time of writing, abnormally slow even by GDB's standards. The patch is substantial (roughly +726/-7 lines) and technically complex (probing VLEN via inline assembly with a SIGILL guard, dynamic target-description construction). No technical objection was found in the reviewed mailing-list archives; the delay appears to be reviewer bandwidth on Andrew Burgess's side, who is both the RISC-V Responsible Maintainer and the Release Manager.

**CSR access policy.** The current refusal to expose CSR registers via ptrace is a maintainer design decision citing security concerns, not a technical limitation. Changing it requires a policy decision from Andrew Burgess or the Global Maintainers; no patch proposing CSR access has been submitted upstream.

**sourceware.org accessibility for research.** The sourceware.org domain (Bugzilla web UI, gitweb/cgit, patchwork, and mailing-list archives at `inbox.sourceware.org`) is gated by Anubis proof-of-work bot protection, which blocked both WebFetch and direct curl across two independent research passes. This is a known deployment characteristic of the site, not a permanent access gate; the Bugzilla CSV/API endpoint, the GitLab mirror, the Buildbot REST API, and `sourceware.org/legacy-ml`/`pipermail` (the older Mailman archive UI) remained reachable and were used as substitutes throughout this research.

**No funded RISE investment.** RISE (RISC-V Software Ecosystem) has no active, funded investment in GDB. The only touchpoint found across the full RISE blog archive (all ~34 posts, May 2024 through September 2026, none mentioning GDB), the RISE Python wheel builder (GDB is not a Python package and is not listed there), the RISE member list, and an exhaustive listing of the `riseproject-dev` GitHub org's roughly 52 repositories (no repo named or dedicated to GDB, and notably no "debug-and-profiling-wg" repo at all) is a single mention of GDB in the Debug and Profiling Working Group's "What's Next" roadmap slide from the December 2024 RISE Webinar deck (vector register dumping, FP16/BF16, CFI, pointer masking, hardware breakpoint/watchpoint support). This is an unfunded aspiration: no RFP contract, no delivery date, no assigned engineers, no corresponding blog post, repository, or CI runner usage. The working group lead is Xiao Wang (Intel). Completed RISE RFPs (RP001 Go, RP004 Rust, RP005 QEMU, RP006/RP009 LLVM, RP011 Python packaging, OpenOCD upstreaming) include no GDB work.

**CI single point of failure.** The `gdb-riscv-full` HiFive P550 builder has been disconnected from the active Buildbot master for over 9 months (Section 7.2), leaving only `gdb-ubuntu-riscv` as the active full-testsuite riscv64 CI path. This is a real, confirmed infrastructure gap, not a transient blip, and is a direct input to the readiness grade's pending-work note.

## 13. Readiness Assessment

- **Color:** blue (N/A - blue has no sub-case; CI builds and tests pass on riscv64 but upstream publishes no riscv64 binary artifact)
- **Release provider:** distro

GDB has genuine, continuously running upstream CI on two riscv64 hardware boards via the Sourceware Buildbot: `gdb-ubuntu-riscv` on StarFive-class hardware (build #5335 succeeded 2026-09-30, [builder 294](https://builder.sourceware.org/buildbot/#/builders/294)) and `gdb-riscv-full` on a SiFive HiFive Premier P550 (build #483 succeeded 2025-12-19, approximately 121,159 expected passes, [builder 335](https://builder.sourceware.org/buildbot/#/builders/335)), both configured to run the full GDB test suite (build=yes, test=yes). This is the primary color-deciding fact. GDB upstream, however, ships only source tarballs for every architecture ([sourceware.org/pub/gdb/releases/](https://sourceware.org/pub/gdb/releases/)), so the consumable riscv64 binary is produced by distributions building unmodified upstream source: Ubuntu 26.04 "resolute" ships `gdb` 17.1-2ubuntu1 for riscv64 ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=gdb&suite=resolute)), alongside Debian sid and Arch Linux RISC-V, none of which require riscv64-specific patches. Per the color model, CI build=yes + test=yes with no upstream-published artifact yields blue, with release_provider recorded as distro rather than upstream. GDB's purpose is source-level debugging correctness, not performance optimization, so this is not an optimization-purpose project and no optimization-level rating applies.

**Pending work that could change the grade:**

- Native vector/RVV register ptrace support (Natu/SiFive v5, pending since ~May/June 2025, [mailing list](https://sourceware.org/pipermail/gdb-patches/2025-June/218801.html)) and hardware watchpoint/breakpoint support (SpacemiT v2, pending review since April 2026, [mailing list](https://sourceware.org/pipermail/gdb-patches/2026-April/226391.html)) both remain unmerged. A bfloat16/half-float FP register patch is conditionally approved pending cleanup.
- RISE has no active funded GDB work; GDB appears only as a roadmap aspiration in the Debug and Profiling Working Group's December 2024 webinar slides, with no RFP, delivery date, or assigned engineers.
- The `gdb-riscv-full` HiFive P550 builder has been disconnected from the active Buildbot master for over 9 months, a confirmed single point of failure for the full-testsuite riscv64 CI path.
- Several open (UNCONFIRMED/NEW) Bugzilla issues tagged riscv remain, most notably vector-register access (bug 32075) and ebreak step-over handling (bug 28486); neither is release-blocking.

## 14. Investment Analysis

Estimates are engineering-effort approximations based on patch size and review history observed in upstream archives; they do not account for the sourceware review/merge cycle itself, which is the dominant source of delay for the two largest pending patches.

### 14.1 Functional Enablement

RISE has no funded work in this area to build on (Section 12); any investment here starts from zero RISE coverage.

**Hardware debug registers (watchpoints + breakpoints).** The SpacemiT v2 patch (~1,350 lines, 12 files) is in review. A company with riscv64 hardware capable of validating the implementation could accelerate review by providing test results, a detailed test matrix, and direct maintainer-level review engagement with Andrew Burgess.

**Native vector register access.** The Natu/SiFive v5 patch is technically complete; the bottleneck is merge approval, now over a year pending. Providing a second qualified reviewer, additional hardware test results, or rebasing to resolve merge conflicts could unblock this.

**Incomplete syscall recording table.** 326 of roughly 470+ Linux syscalls are mapped; this is primarily a data-entry and testing task, not an architectural one, since the auto-generation tooling already exists.

**CSR register access.** Requires a policy decision and a ptrace implementation against the RISC-V privileged specification. Medium-complexity engineering; the primary obstacle is achieving maintainer agreement on the stated security concerns.

### 14.2 Performance Optimization

Data not available: no published GDB riscv64 performance benchmark data (step latency, launch time, remote-protocol throughput) was found in the RISE blog, arXiv HPC papers, or general web search, across either research pass. The only quantitative GDB-specific data available is CI test-pass counts (121,159 expected passes / 333 unexpected failures, January 2025 baseline), which is a correctness metric, not a timing/throughput benchmark. The record/replay path received a roughly 15% stepping-speed improvement in October 2025 from an external contributor reducing intermediate buffering, suggesting the path had not previously been profiled. Establishing a riscv64 GDB performance baseline (startup, stepping, attach) remains unfunded work.

### 14.3 CI/CD Infrastructure

Restoring the `gdb-riscv-full` HiFive P550 builder's master connection is the highest-leverage, lowest-effort CI investment available: the hardware exists and is donated (by RISC-V International), the problem is purely a Buildbot master-connection issue, not a hardware gap. A company could also contribute additional riscv64 worker hardware for redundancy, since `gdb-ubuntu-riscv` is currently the sole functioning full-testsuite riscv64 CI path.

### 14.4 Ecosystem Enablement

RISE has no funded GDB work to build on; a company investing through RISE would find no existing funded project to join and would need to propose a new RFP. The Debug and Profiling Working Group (lead: Xiao Wang, Intel) has listed GDB improvements as a roadmap item since December 2024 with no RFP contract since. The archived riscvarchive vendor fork has several stale open issues (#270 single-step on EL2 with ICCM, #196 V-extension) that, if still reproducible on production hardware, require fresh upstream bug reports with current-version reproducers rather than engagement with the dead fork.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review, test, and help land the vector register patch (v5, Natu/SiFive) | 2-4 | Upstream merge authority: Andrew Burgess | Critical |
| Functional | Review, test, and help land the hardware watchpoint/breakpoint patch (v2, SpacemiT) | 2-4 | Upstream merge authority: Andrew Burgess | Critical |
| Functional | Complete syscall recording table (roughly 140+ missing entries) | 2-3 | Contributor task, maintainer review | High |
| Functional | bfloat16/half-float FP register sub-fields (already conditionally approved, needs cleanup) | 1 | Jerry Zhang Jian / SiFive | High |
| Functional | cm.popret[z] single-step (v2, pending) | 1-2 | ESWIN Computing submitter | Medium |
| Functional | CSR register access via ptrace | 4-8 | New contributor, requires maintainer policy decision | Medium |
| CI/CD | Restore `gdb-riscv-full` HiFive P550 Buildbot master connection | 1-2 | Current admin: Mark Wielaard | High |
| CI/CD | Add a redundant riscv64 CI hardware worker | 2-4 | New contributor | Medium |
| Performance | Establish a riscv64 GDB benchmark baseline (startup, stepping, attach) | 2-3 | New contributor | Medium |
| Ecosystem | Propose a funded RISE RFP for the Debug and Profiling Working Group's roadmap items | 1 (proposal) plus downstream execution effort | New contributor, RISE WG lead Xiao Wang | Low/Medium |
| Ecosystem | Re-file stale riscvarchive fork issues against current upstream Bugzilla with reproducers | 1-2 | New contributor | Low |

## 15. References

- [GDB GNU Project homepage](https://www.gnu.org/software/gdb/)
- [GDB source repository, sourceware.org](https://sourceware.org/git/binutils-gdb.git)
- [GDB GitLab mirror](https://gitlab.com/gnutools/binutils-gdb)
- [GDB source releases](https://sourceware.org/pub/gdb/releases/)
- [GDB Configure Options reference](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Configure-Options.html)
- [GDB build requirements](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Requirements.html)
- [sourceware.org Buildbot CI](https://builder.sourceware.org/buildbot/)
- [gdb-ubuntu-riscv builder (294)](https://builder.sourceware.org/buildbot/#/builders/294)
- [gdb-riscv-full builder (335)](https://builder.sourceware.org/buildbot/#/builders/335)
- [Mailing list: new riscv64 CI workers (P550, BPI-F3), January 2025](https://sourceware.org/pipermail/gdb/2025-January/051734.html)
- [riscvarchive/riscv-binutils-gdb (archived vendor fork)](https://github.com/riscvarchive/riscv-binutils-gdb)
- [PATCHv2: initial baremetal riscv support](https://sourceware.org/legacy-ml/gdb-patches/2018-02/msg00409.html)
- [RISC-V GDB Port v3 review thread](https://sourceware.org/legacy-ml/gdb-patches/2017-03/msg00150.html)
- [Add initial compile command support to RISC-V port](https://patchwork.sourceware.org/project/gdb/patch/20191016180006.1CF0020AF7@gnutoolchain-gerrit.osci.io/)
- [RISCV Non-DWARF stack unwinding, cover letter](https://inbox.sourceware.org/gdb-patches/cover.1535560591.git.andrew.burgess@embecosm.com/)
- [Bare metal core dump support (patch 5/8)](https://sourceware.org/pipermail/gdb-patches/2020-December/174038.html)
- [scripts/gdb: add lx_current support for riscv (merged commit)](https://github.com/torvalds/linux/commit/cd24f44050f31d69ed5851b55ef77ea6346aa814)
- [Pending: native vector register ptrace patch v5](https://sourceware.org/pipermail/gdb-patches/2025-June/218801.html)
- [Pending: hardware watchpoint/breakpoint patch v2](https://sourceware.org/pipermail/gdb-patches/2026-April/226391.html)
- [Pending: bfloat16/half-float FP register patch v2](https://sourceware.org/pipermail/gdb-patches/2026-February/224994.html)
- [gdb mailing list, July 2017 (stepping hang report)](https://sourceware.org/pipermail/gdb/2017-July/046743.html)
- [GDB Bugzilla, riscv search](https://sourceware.org/bugzilla/buglist.cgi?product=gdb&short_desc=riscv&short_desc_type=allwordssubstr)
- [qemu-project/qemu#2991 (gdbstub/KVM bug)](https://gitlab.com/qemu-project/qemu/-/issues/2991)
- [riscv-collab/riscv-openocd#360](https://github.com/riscv-collab/riscv-openocd/issues/360)
- [riscv-collab/riscv-openocd#115](https://github.com/riscv-collab/riscv-openocd/issues/115)
- [Ubuntu 26.04 "resolute" gdb package search](https://packages.ubuntu.com/search?keywords=gdb&suite=resolute)
- [Ubuntu 24.04 "noble" riscv64 gdb package](https://packages.ubuntu.com/noble/riscv64/gdb/download)
- [Debian package tracker: gdb](https://tracker.debian.org/pkg/gdb)
- [Debian buildd status: gdb](https://buildd.debian.org/status/package.php?p=gdb&suite=sid)
- [Debian RISC-V wiki](https://wiki.debian.org/RISC-V)
- [Arch Linux RISC-V mirror, extra repo listing](https://mirrors.felixc.at/archriscv/repo/extra/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE member list](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Webinar, December 2024 slides (PDF)](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [RISE sw-ecosystem GDB status report](https://riseproject-dev.github.io/sw-ecosystem/project-reports/gdb.html)