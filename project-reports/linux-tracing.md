---
title: Linux tracing
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: GDB
    relation: test-dependency
    criticality: optional
  - name: libtraceevent
    relation: runtime-dependency
    criticality: optional
  - name: trace-cmd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-tracing" %}

# Linux tracing

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux tracing<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux tracing is a set of kernel subsystems inside the mainline Linux kernel, documented at [docs.kernel.org/trace](https://docs.kernel.org/trace/index.html). The RISC-V arch code supports these mechanisms:

- Dynamic ftrace with args, CALL_OPS and direct calls.
- The function graph tracer.
- Kprobes and kretprobes (via rethook).
- Uprobes.
- KGDB.
- Jump labels.
- Syscall tracepoints.
- User stack traces.

All of the code is in `arch/riscv`. It is not a separately distributed package, so no standalone riscv64 deliverable exists.

**Governance.**
- Tracing has no foundation of its own. It follows the kernel's maintainer hierarchy and mailing lists.
- Patches go to linux-trace-kernel@vger.kernel.org (tracked on patchwork.kernel.org). The tree is `git.kernel.org/pub/scm/linux/kernel/git/trace/linux-trace.git`. Changes flow to Linus Torvalds.
- docs.kernel.org/trace states no governance model, foundation or license. The kernel is GPL-2.0 [NEEDS VERIFICATION; the licensing-rules page was not fetched].

**Maintainers** (from MAINTAINERS in the kernel clone at v7.4-rc1-132, commit 05441d697f7f):

| Entry | People |
|---|---|
| TRACING | Steven Rostedt, Masami Hiramatsu (maintainers); Mathieu Desnoyers (reviewer) |
| FUNCTION HOOKS (FTRACE) | Steven Rostedt, Masami Hiramatsu (maintainers); Mark Rutland (reviewer) |
| KPROBES | Naveen N Rao, David S. Miller, Masami Hiramatsu |
| KGDB / KDB | Jason Wessel, Daniel Thompson (maintainers); Douglas Anderson (reviewer) |
| LIVE PATCHING | Josh Poimboeuf, Miroslav Benes, Petr Mladek, Joe Lawrence, Song Liu |
| RISC-V ARCHITECTURE | Paul Walmsley, Palmer Dabbelt, Albert Ou (maintainers); Alexandre Ghiti (reviewer) |

- The RISC-V ARCHITECTURE entry covers all of `arch/riscv/` with status "Supported". Its patch policy is `Documentation/arch/riscv/patch-acceptance.rst`, which was not read [NEEDS VERIFICATION].
- There is no RISC-V-specific tracing maintainer entry. The `arch/*/*ftrace*` globs in FUNCTION HOOKS cover the RISC-V ftrace files.
- A web search found that Masami Hiramatsu became tracing co-maintainer in 2022, replacing Ingo Molnar [NEEDS VERIFICATION; single search summary].

**Corporate contributors** (by commit and patch author email domain; MAINTAINERS lists no affiliations):

| Company | Contributors |
|---|---|
| Rivos | Alexandre Ghiti, Palmer Dabbelt, Bjorn Topel, Charlie Jenkins |
| Linutronix | Nam Cao |
| SiFive | Andy Chiu, Samuel Holland, Vincent Chen |
| Alibaba / T-Head | Guo Ren, Wang Han |
| Huawei | Pu Lehui, Jinjie Ruan |
| ByteDance | Rui Qi |
| SUSE | Fabian Vogt |
| Andes | Alan Kao (original port) |
| ISCAS | Chunyan Zhang, Vivian Wang |
| Google | Masami Hiramatsu |

**RISE Project.**
- No RISE-owned tracing work was found. riseproject.dev lists "Kernel & Virtualization" as a working group, but the page was not readable.
- The RISE blog feed (first 100,000 of 186,772 characters read) has no tracing post.
- The riseproject-dev GitHub org has 70 repositories. 10 were shown, and a search for "trace" returned 0.
- RISE members: 8 premier (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 general (including Andes, Canonical, ISCAS and SpacemiT).

**Community stance.** Arch-specific tracing code is reviewed by the generic tracing maintainers and merged through the RISC-V tree or the tracing tree. No stated objection to RISC-V was found as an architecture. Review latency on the open RISC-V ftrace patches is covered in Section 12.

## 2. Port History and Upstreaming Timeline

RISC-V has been in mainline since Linux 4.15, and tracing has been in mainline since the first port. Dates below are commit-author (posting) dates, with the committer date (merged_at) and first release where the fetch gave them.

| Date | Event | Source |
|---|---|---|
| 2017-12-18 (merged 2018-01-30) | `10626c32e382` riscv/ftrace: basic support (Alan Kao). First release v4.16. | Kernel clone |
| 2018-02-13 (merged 2018-04-02) | `c15ac4fd60d5` dynamic ftrace and `bc1a4c3a8425` dynamic function graph tracer (Alan Kao, Andes). v4.17. | Kernel clone |
| 2020-04-16 | `fe89bd2be866` KGDB (Vincent Chen, SiFive). v5.8-rc1. | Kernel clone |
| 2020-07-14 | `ebc00dde8a97` jump labels (Emil Renner Berthing). v5.9-rc1. | Kernel clone |
| 2020-12-17 (merged 2021-01-14) | `c22b0bcb1dd0` kprobes, `829adda597fe` KPROBES_ON_FTRACE and uprobes (Guo Ren, Alibaba). v5.12. | Kernel clone; [Guo Ren v5 series](https://lore.kernel.org/all/1608220905-1962-1-git-send-email-guoren@kernel.org/T/) |
| 2022-10-25 (merged 2022-12-02) | `b57c2f124098` riscv rethook (Binglei Wang). v6.2. | Kernel clone |
| 2023-11-30 (merged 2024-01-17) | `196c79f19a92` DYNAMIC_FTRACE_WITH_DIRECT_CALLS (Song Shuai). v6.8. | Kernel clone |
| 2024-04-05 (merged 2024-05-22) | `7caa9765465f` ftrace move from REGS to ARGS (Puranjay Mohan). v6.10. | Kernel clone |
| 2024-06-13 (merged 2024-07-24) | `3308172276db` remove deprecated KPROBES_ON_FTRACE (Jinjie Ruan, Huawei). v6.11. | Kernel clone; [removal patch](https://lists.infradead.org/pipermail/linux-riscv/2024-July/057907.html) |
| 2024-07-08 (merged 2024-09-14) | `1a7483318274` USER_STACKTRACE support. v6.12. | Kernel clone |
| 2025-04-08 (merged 2025-06-05) | `5aa4ef955884` ftrace patching without stop_machine (Andy Chiu, SiFive), `c217157bcd1d` HAVE_DYNAMIC_FTRACE_WITH_CALL_OPS (Puranjay Mohan), `b21cdb9523e5` direct calls using call_ops. v6.16. | Kernel clone |
| 2025-07-11 (merged 2025-07-16) | `e3f16d63d54e` acquire text_mutex to fix a race (Alexandre Ghiti, Rivos). v6.16 final. | Kernel clone |
| 2025-07-16 | "riscv: Stop supporting static ftrace" (Alexandre Ghiti) [NEEDS VERIFICATION; single inventory source, commit not independently confirmed]. | Kernel clone inventory |
| 2025-09-10 | `9e68bd803fac` kprobe address validation fix (Fabian Vogt, SUSE). v6.18. | Kernel clone |
| 2026-03-23 | `834911eb8eef` KGDB register fixes (Paul Walmsley). v7.0. | Kernel clone |
| 2026-06 to 2026-10 | Fixes `2820d227ad4e`, `bc7b086a4552`, `ecbf894165a2`, `8ac35bac70e7`, `3a2694bf6ac8` (v7.2); `e7d8ea6c6d1b`, `540ad5ad05a5`, `8718e5a3090b`, `a510e1ae8c90` (v7.3). See Section 11. | Kernel clone |
| 2026-05-27 to 2026-09-14 | Livepatch reliable-unwinding series, v1 to v6, not merged. | [LWN v6](https://lwn.net/Articles/1094265/) |

- The `829adda597fe` KPROBES_ON_FTRACE commit is not live in current mainline. `3308172276db` removed it, and `HAVE_KPROBES_ON_FTRACE` is absent from the Kconfig.
- The first-release dates for uprobes and the function graph tracer were not individually checked. The uprobes code is dated to the same Guo Ren 2020-12-17 series, v5.12-rc1 [NEEDS VERIFICATION; inventory only].
- Other supporting file history: `patch.c` (Zong Li, SiFive, v5.7-rc1) and `stacktrace.c` (v4.15-rc1, Palmer Dabbelt).
- Is it fully upstream? Yes for everything in the Section 1 list. Livepatch support, OPTPROBES and static call are not upstream (Section 6).

## 3. Upstream Support Tier

**Formal policy.** The kernel has no formal tier system for architectures or tracing features. The RISC-V port is "Supported" in MAINTAINERS. RISE membership tiers apply to RISE governance only and do not affect kernel acceptance.

**Evidence.**
- In-tree CI: none. The kernel root has no `.gitlab-ci.yml`, `.github/`, Jenkinsfile or `ci/` directory, and MAINTAINERS has no CI or bot link for RISC-V.
- Release-blocking: not applicable. The kernel has no gating CI.
- Official binaries: upstream ships source only. Consumable binaries are distro kernels (Section 8).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In mainline | Yes | Yes | Yes (since 4.15) |
| Dynamic ftrace, kprobes, uprobes, KGDB, jump labels | Data not available: x86 Kconfig not read | Data not available: arm64 Kconfig not read | Present in `arch/riscv/Kconfig` |
| Livepatch | Reported as present (gap list against arm64 and x86) [NEEDS VERIFICATION] | Reported as present (gap list) [NEEDS VERIFICATION] | Absent from Kconfig; series open |
| Optimized kprobes | Reported as present [NEEDS VERIFICATION] | Reported as present [NEEDS VERIFICATION] | Absent from Kconfig |
| Static call | Reported as present [NEEDS VERIFICATION] | Reported as present [NEEDS VERIFICATION] | Absent from Kconfig |
| In-tree CI config | None | None | None |
| External tracing CI | Data not available | Data not available | linux-riscv GitHub CI builds and boots series; kselftest run is an experiment |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Tracing is kernel C plus small assembly stubs. It has no JIT, SIMD, crypto or GC barriers. The RISC-V-specific parts are code patching, instruction decoding and simulation, and stack unwinding. These are scalar code. No vector or other optional ISA extension is used. The compressed (C) extension matters for alignment and instruction length.

| Component | Files | riscv64 implementation | Quality and notes |
|---|---|---|---|
| ftrace entry | `mcount-dyn.S` (`ftrace_caller`, `ftrace_regs_caller`), `mcount.S`, `ftrace.c`, `asm/ftrace.h` | Present | Hand-written assembly. The `mcount.S` contents at HEAD were not read. Static ftrace was dropped (Section 2). |
| Dynamic ftrace patching | `ftrace.c`, `patch.c` | Present. Patching without stop_machine since v6.16. | Needs `-fpatchable-function-entry=8` (GCC). CALL_OPS requires no CFI and 8-byte function alignment. |
| Function graph | `ftrace.c`, `asm/ftrace.h` | `HAVE_FUNCTION_GRAPH_TRACER` and `HAVE_FUNCTION_GRAPH_FREGS` | Depends on `DYNAMIC_FTRACE_WITH_ARGS`. See the note below. |
| Kprobes and kretprobes | `probes/kprobes.c`, `decode-insn.c`, `simulate-insn.c`, `rethook.c`, `rethook_trampoline.S` | Present | Instruction simulation, including RVC (`c.jal` simulation fixed in `540ad5ad05a5`). |
| Uprobes | `probes/uprobes.c` | Present | `kmap_local_page` conversion merged as `a18dfb5dd332` (2026-01-03). |
| Jump labels | `jump_label.c` | `HAVE_ARCH_JUMP_LABEL` and `_RELATIVE` | Not individually reviewed. |
| KGDB | `kgdb.c` | `HAVE_ARCH_KGDB` and `HAVE_ARCH_KGDB_QXFER_PKT` | Register-mapping bugs fixed 2026-03-23. |
| Stack unwinding | `stacktrace.c` | Frame-pointer and non-FP walkers, `USER_STACKTRACE_SUPPORT` | No reliable unwinder. |
| Livepatch | none | Absent | Series open. |
| OPTPROBES | none | Absent | v6 (2023-01-27) not merged. |
| Static call | none | Absent | RFC only (2023-04). |

**Function graph.** `arch/riscv/Kconfig` at HEAD has `select HAVE_FUNCTION_GRAPH_FREGS` (line 168), `select HAVE_FUNCTION_GRAPH_TRACER if HAVE_DYNAMIC_FTRACE_WITH_ARGS` (line 167) and `select HAVE_FTRACE_GRAPH_FUNC` (line 166).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dynamic ftrace with args | Data not available | Data not available | Present |
| Reliable stack unwind (livepatch) | ORC (design reference) | Frame-pointer plus metadata (design reference) | Absent; series open |
| Optimized kprobes | Reported present [NEEDS VERIFICATION] | Reported present [NEEDS VERIFICATION] | Absent |
| Static call | Reported present [NEEDS VERIFICATION] | Reported present [NEEDS VERIFICATION] | Absent |

**RISC-V design notes from the research.**
- The livepatch series follows the arm64 frame-pointer plus metadata model, adapted to the RISC-V {fp, ra} frame record. ORC would need RISC-V objtool and ORC generation. SFrame's ABI does not yet cover RISC-V. The interim cost is about 24 bytes added to `pt_regs` and a few instructions on exception entry, fork and early init, only with `FRAME_POINTER=y`.
- OPTPROBES replaces `ebreak` with an `AUIPC`/`JALR` pair (reach about 4 GB). Single `JAL` (+/-2 MB) and branches (+/-4 KB) are too short. It needs two free caller-saved registers. Static analysis in the cover letter found about 51% of default-config kernel instructions optimizable. Gem5 showed more than 5x speedup over the breakpoint implementation. Both figures come from the cover letter, not independent measurement.

## 5. Build System, Cross-Compilation, and Toolchain

Tracing builds as part of the kernel via Kbuild. It has no cmake or configure step and no tracing-specific build flags.

**Commands.** The standard Kbuild invocations below are [NEEDS VERIFICATION]. The `LLVM=1` syntax is confirmed in `Documentation/kbuild/llvm.rst`, but no riscv-specific example was read.
- GCC cross-build: `make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig`, then `make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image`.
- LLVM: `make LLVM=1 ARCH=riscv defconfig`, then `make LLVM=1 ARCH=riscv -j$(nproc) Image`.
- LLVM compiler with GNU binutils: `LLVM_IAS=0 CROSS_COMPILE=riscv64-linux-gnu-` (per `llvm.rst`).

**Toolchain minimums** (`scripts/min-tool-version.sh`, `Documentation/process/changes.rst`; no riscv override for GCC or Clang):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| Clang/LLVM | 17.0.1 |
| binutils | 2.30.0 |
| GNU make | 4.0 |
| Python | 3.9.x |
| pahole | 1.26 |

**Tracing-specific gates in `arch/riscv/Kconfig`.**
- `HAVE_DYNAMIC_FTRACE` needs an MMU. With GCC it needs `-fpatchable-function-entry=8` and either `CC_HAS_MIN_FUNCTION_ALIGNMENT` or `!RISCV_ISA_C`. Dynamic ftrace patches function-entry NOPs.
- With Clang, it needs GNU as, or LLVM as with lld or GNU ld >= 2.36 (ClangBuiltLinux issue 1817). Older Clang toolchains can therefore lack dynamic ftrace.
- `HAVE_DYNAMIC_FTRACE_WITH_CALL_OPS` needs `DYNAMIC_FTRACE_WITH_ARGS && !CFI`. Direct calls depend on CALL_OPS.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies to GCC older than 11.3.0.
- `ARCH_HAS_BROKEN_DWARF5` applies when both the LLVM assembler and lld are older than 18.0.0.
- BTF-based selftest options (`DEBUG_INFO_BTF`) need pahole >= 1.26 and `BPF_SYSCALL`.

**Testing and QEMU.**
- Selftests: `sudo ./ftracetest` from `tools/testing/selftests/ftrace`. Results are PASS, FAIL, UNRESOLVED, UNTESTED, UNSUPPORTED or XFAIL.
- The in-tree `boottime/run_boottime_test.sh` defaults to `qemu-system-x86_64`, so the in-tree QEMU test path is x86-oriented. No riscv-specific QEMU invocation was found in the tracing docs. The grep for `qemu-system-riscv` timed out [NEEDS VERIFICATION].
- Series authors test on QEMU virt (QEMU 8.2.2 in the livepatch v6 run). A typical command line is `qemu-system-riscv64 -M virt -smp 4 -m 2G -nographic -kernel arch/riscv/boot/Image ...`. It was not taken from the tree [NEEDS VERIFICATION].

**Known build and config issues.**
- `test_kprobes` KUnit crashed under Clang. It was fixed by `641ecc890038` (v6.19). A separate Clang `test_kprobes` v2 patch thread from January 2026 has unknown status.
- `scripts/sorttable` dropped valid RISC-V ftrace sites after build-time mcount sorting was enabled. This broke function_graph init with -19 under QEMU. The fix is in the livepatch v1 and v3 series and was dropped from v4. Whether it was merged separately is unverified. A mirror says Paul has it in riscv/for-next [NEEDS VERIFICATION].
- `3a2694bf6ac8` (v7.2) fixed a regression where `FUNCTION_ALIGNMENT_4B` was selected on `HAVE_DYNAMIC_FTRACE`. It grew the image on every `RISCV_ISA_C=y` build, even with tracing off. It fixes `c41bf4326c7b`.
- `ftrace_call_adjust()` returns the wrong address when CALL_OPS is off (for example under CFI_CLANG). The fix is an open patch (Section 12).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 | Notes |
|---|---|---|
| Dynamic ftrace, with args | Present | |
| CALL_OPS | Present | Not with CFI |
| Direct calls | Present | v6.8, call_ops version in v6.16 |
| Function graph tracer | Present | |
| Kprobes, kretprobes, rethook | Present | |
| KPROBES_ON_FTRACE | Absent | Deliberately removed in v6.11; fprobe replaces it |
| Uprobes | Present | |
| KGDB | Present | |
| Jump labels | Present | |
| Syscall tracepoints | Present | |
| User stack traces | Present | v6.12 |
| Function error injection | Present | |
| Livepatch and reliable stacktrace | Absent | Series v6 open |
| OPTPROBES | Absent | Stalled since 2023 |
| Static call | Absent | RFC from 2023 |
| Hardware trace (E-Trace and N-Trace) | Absent | rvtrace v4 under review; perf-adjacent |

- **Functional gaps.** There is no livepatch, so no live kernel patching on riscv64. There are no optimized kprobes and no static calls.
- **Not checked.** fprobe, `HAVE_FENTRY`-style features and ORC/SFrame unwinding were not checked.
- **Performance gaps.** Data not available. No riscv64 ftrace, kprobe, uprobe or function-graph overhead figures were found.
  - The only quantitative tracing data found is a Linux Plumbers 2020 slide deck by Guo Ren (T-HEAD), measured on an x86-64 Intel Xeon E5410 at 2.33 GHz. It gives kprobe 0.99 us, boosted kprobe 0.43 us and optimized kprobe 0.06 us. This is from a summary of the slides and has no RISC-V measurements [NEEDS VERIFICATION].
  - The cover letters for CALL_OPS benchmarks (Spacemit K1 board) were referenced but their numbers were not retrieved.
- **Security hardening gaps.** Not researched beyond one interaction: CALL_OPS is disabled when CFI is enabled.
- **NaN and floating-point semantics.** Not applicable; no tracing finding concerns FP.

## 7. CI/CD Infrastructure

- **In-tree.** None for any architecture. The root holds only `.clang-format`, `.clippy.toml`, `.cocciconfig`, `.editorconfig`, `.get_maintainer.ignore`, `.gitattributes`, `.gitignore`, `.mailmap`, `.pylintrc` and `.rustfmt.toml`.
- **In-tree test material.**
  - The opt-in `RISCV_KPROBES_KUNIT` test (`arch/riscv/kernel/tests/kprobes/`, Nam Cao, v6.18-rc1) depends on KUnit and KPROBES.
  - The generic ftrace selftests have three `riscv*)` argument-name branches in kprobe tests: `kprobe_args_char.tc`, `kprobe_args_string.tc` and `kprobe_args_syntax.tc`.
  - `tools/testing/kunit/configs/` has no riscv config.
  - `tools/testing/selftests/riscv/` has no tracing subdirectory.
- **External: linux-riscv GitHub CI.** An [LKML message from Bjorn Topel (Sept 2024)](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html) describes `github.com/linux-riscv/linux-riscv`, `github-ci` and `docker`.
  - Runners are GitHub runners sponsored by RISE.
  - `ci-series` cross-builds and boots patch series under QEMU, with little real-hardware testing.
  - `ci-kselftest` is an experiment on bpf, bpf-next and Linus's master. The ftrace suite panicked the kernel on 6.12-rc1. No later status was found [NEEDS VERIFICATION; single source].
  - The workflow files could not be listed (the GitHub API was not accessible).
- **External: Ubuntu.** `ubuntu_kernel_selftests.ftrace` timed out on riscv64 under QEMU on the 5.11 `linux-riscv` kernel ([Launchpad 1941898](https://bugs.launchpad.net/ubuntu/+source/linux-riscv/+bug/1941898), reported 2021-08-27). The cause was the Ubuntu autotest timeout not working on riscv, and Ubuntu disabled the timeout for riscv64 ([kernel-team patch, May 2022](https://lists.snapcraft.io/archives/kernel-team/2022-May/130482.html)). One search result reported `func_stack_tracer.tc` failing on riscv64 and the full suite taking just over 2 hours on Unmatched hardware [NEEDS VERIFICATION].
- **KernelCI, LKFT, 0-day, syzbot.** Not verified. The KernelCI home page shows a RISC-V logo and nothing on riscv64 ftrace.
- **RISE runners.** RISE sponsors the linux-riscv CI GitHub runners. The `riscv-runner` repository in riseproject-dev provides GitHub runners on real RISC-V hardware, but nothing links it to tracing CI.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI | None | None | None |
| Patch-series build and boot CI | Data not available | Data not available | linux-riscv GitHub CI (cross-build, QEMU boot) |
| Tracing selftests in CI | Data not available | Data not available | Experiment; panicked on 6.12-rc1 |
| Real hardware | Data not available | Data not available | Little; Unmatched hardware appears in one Ubuntu-related report |

## 8. Distribution and Release Status

- **Upstream binaries.** None. Linux tracing is not a PyPI package. `pypi.org/pypi/linux-tracing/json` and the RISE wheel index both returned 404.
- **Ubuntu 26.04 (resolute).** No package named `linux-tracing`. `linux-image-generic` for riscv64 is 7.0.0-14.14.2, in the ports archive. amd64 and arm64 have 7.0.0-42.42, and armhf, ppc64el and s390x have 7.0.0-14.14. The page notes the list may be incomplete. The Ubuntu riscv64 kernel therefore trails by security updates and is a full 28 builds behind amd64 and arm64.
- **Userspace.** `trace-cmd_3.3.3-1ubuntu2_riscv64.deb` exists in Ubuntu resolute.
- **Other distros.** Debian, Fedora, openSUSE and Arch riscv64 kernel configs were not researched.
- **Distro kernel tracing configs.** Whether the Ubuntu riscv64 image sets `CONFIG_FTRACE`, `CONFIG_KPROBES` and similar was not checked [NEEDS VERIFICATION].
- **Mainline releases.** Latest final is v7.3. The current tag is v7.4-rc1 (clone HEAD v7.4-rc1-132).
- **What a user must do.** Install a distro riscv64 kernel (for example Ubuntu 26.04 `linux-image-generic`) or build mainline from source (Section 5). Enable the tracing Kconfig options and mount tracefs. Install `trace-cmd` for userspace tooling.
- **Other.** `bpftrace` is packaged for riscv64 on Alpine, and `ltrace` has a RISC-V port on GitLab. Both are outside the kernel tracing scope.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | Runtime, critical. Hosts all tracing code: `kernel/trace/Kconfig` and `arch/riscv`. | Builds. Dynamic ftrace needs MMU and a supporting toolchain. | Ftrace selftests in tree; no confirmed CI result [NEEDS VERIFICATION] | Mainline since 4.15; Ubuntu 7.0.0-14.14.2 riscv64 | Kernel maintainers and RISC-V tree (Section 1) |
| OpenSBI | Runtime, critical. SBI firmware, IPIs and remote fences used when patching code. | Builds | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | No tracing blocker identified; see project-reports/opensbi.md |
| GCC | Build, critical. Needs `-fpatchable-function-entry=8` for dynamic ftrace; minimum 8.1.0. | riscv64 supported | Not tested for this scope | Not checked | `CC_HAS_MIN_FUNCTION_ALIGNMENT` gate with `RISCV_ISA_C`; see project-reports/gcc.md |
| LLVM | Build, optional. Clang minimum 17.0.1. | riscv64 supported | Not tested for this scope | Not checked | Linker/assembler gate for dynamic ftrace (ClangBuiltLinux 1817); see project-reports/llvm.md |
| GNU binutils | Build, critical. Minimum 2.30.0. | riscv64 supported | Not tested for this scope | Not checked | None identified; see project-reports/gnu-binutils.md |
| QEMU | Test, optional. QEMU virt is the main test target for series authors. | Data not available | Used by linux-riscv CI and series authors (8.2.2 in livepatch v6) | Data not available | The rvtrace series uses a QEMU fork (`rv-etrace` branch) |
| GDB | Test, optional. Consumes KGDB via the remote protocol (`HAVE_ARCH_KGDB_QXFER_PKT`). | riscv64 target supported | KGDB test status [NEEDS VERIFICATION] | Not checked | See project-reports/gdb.md |
| libtraceevent | Runtime, optional. Trace event format parser used by trace-cmd and perf. | Architecture-independent; build not checked | Not checked | Package names to try: `libtraceevent1`, `libtraceevent-dev` [NEEDS VERIFICATION] | See project-reports/libtraceevent.md |
| trace-cmd | Runtime, optional. Userspace ftrace frontend. | Not checked | Not checked | Ubuntu resolute: 3.3.3-1ubuntu2 riscv64 | No entry in `projects.yml` |

**Indirect dependencies.**
- ftrace selftests (in tree).
- pahole, packaged as `dwarves` (>= 1.26, required for `DEBUG_INFO_BTF`). Not in `projects.yml`.
- libtracefs, KernelShark. Not in `projects.yml`.
- The project graph database tool was unavailable, so no graph lookups were made and every row above is unconfirmed against it.

**Recursion note.** The compiler and assembler gates in Section 5 are the only deep-dive items. There is no JIT, SIMD or crypto dependency specific to tracing. The BPF JIT is covered by the eBPF report.

## 11. Known Bugs and Active Issues

There is no master tracking issue and no GitHub issue tracker. Kernel work happens on mailing lists and in git. No open mainline tracing bug with an issue number was found. The merged-fix table below is from the kernel clone.

**Correctness bugs (all fixed in mainline).**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| `bc7b086a4552` | Save original sp in rethook trampoline (Martin Kaiser) | Fixed v7.2, Cc stable | High | A kretprobe reading `$stack0` oopsed with a paging fault. Fixes `c22b0bcb1dd0`. |
| `ecbf894165a2` | `ftrace_graph_ret_addr()` used `current` instead of `task` (Rui Qi) | Fixed v7.2 | Medium | Wrong return addresses when unwinding another task. |
| `8ac35bac70e7` | Bogus -0x4 offset in non-FP `walk_stackframe` (Rui Qi) | Fixed v7.2 | Medium | Wrong for compressed 2-byte calls. |
| `e7d8ea6c6d1b` | Prevent probes in breakpoint handlers (Rui Qi) | Fixed v7.3 | High | Probing `handle_break()` hung the system through recursive `do_trap_break()`. Found by `multiple_kprobes.tc`. The clone dates the merge to 2026-08-07. |
| `2820d227ad4e` | `ftrace_modify_call` failure on kprobed functions (Pu Lehui) | Fixed v7.2 | Medium | "ftrace bug" splat with `expected (7c3ff297) but got (00100073)`; seen in RISC-V BPF selftests. |
| `834911eb8eef` | KGDB register assignment bugs (Paul Walmsley) | Fixed v7.0 | Medium | The S1 entry used the A1 offset; `sleeping_thread_to_gdb_regs()` shifted S10 and S11. |
| `b0d7f5f0c9f0` | Deadlock tracing `__sbi_ecall` with the `snapshot` trigger (Martin Kaiser) | Fixed v6.19 | Medium | The snapshot IPI re-enters `__sbi_ecall`; easy to hit without SSTC. |
| `9e68bd803fac` | Kprobe address validation was very slow (Fabian Vogt, SUSE) | Fixed v6.18 | Medium | Scanned from `_text` to the probe address. Fixes `87f48c7ccc73`. |
| `641ecc890038` | KUnit `test_kprobes` crash under Clang (Jiakai Xu) | Fixed v6.19 | Low | The arrays were not placed in a data section. |
| `3a2694bf6ac8` | 4-byte function alignment selected on all `RISCV_ISA_C` builds (Rui Qi) | Fixed v7.2 | Medium (size and icache) | Fixes `c41bf4326c7b`. |

**Other merged fixes.**
- `540ad5ad05a5`: simulate `c.jal` in probes (v7.3).
- `8718e5a3090b`: skip fixmap mapping when kernel text is already writable (Xiaofeng Yuan, v7.3).
- `bdc46e507b59`: `EXECMEM_KPROBES` read-only without `CONFIG_STRICT_MODULE_RWX`, so kprobe slot writes page-faulted (Xiaofeng Yuan, v7.3). This is an adjacent fix to `8718e5a3090b`. It is not established whether they are the same change.
- `a510e1ae8c90`: `patch_map()` mishandled bpf-jit execmem addresses (Wei-Jie Hung, v7.3; BPF boundary).

**Open or unresolved.**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Bugzilla 209317](https://bugzilla.kernel.org/show_bug.cgi?id=209317) | ftrace selftest failure on RISC-V, 5.8 regression vs 5.4 | Unknown | Unknown | Switching tracer from function_graph to function failed on the second write. The page was blocked, so status is [NEEDS VERIFICATION]. |
| [Launchpad 1941898](https://bugs.launchpad.net/ubuntu/+source/linux-riscv/+bug/1941898) | ftrace selftest timeout on H/riscv | Closed (Invalid, 2022-09-06) | Low | Cause was Ubuntu autotest bug 1940971 (timeout broken on riscv). Failures tracked in bugs 1923682 and 1923683. |
| Clang `test_kprobes` v2 patch ([thread](https://lists.infradead.org/pipermail/linux-riscv/2026-January/082890.html)) | KUnit test_kprobes crash with Clang | Unknown | Low | Posted January 2026. |
| ftrace ptr/alignment thread (Ghiti, lore) | Patching unsafe with unaligned instructions | Addressed by later work [NEEDS VERIFICATION] | Medium | lore was not accessible. The summary says `c41bf4326c7b` later addressed alignment. |
| ptrace a0 modification report (QEMU 7.2.0, kernel 6.4.0) | Tracer cannot modify tracee a0 after PTRACE_SYSCALL | Unconfirmed | Unknown | Single reporter; [NEEDS VERIFICATION]. |

Open patches without a bug number are in Section 12.

## 12. Objections and Upstream Blockers

**Stated objections.**
- Steven Rostedt said Rui Qi's out-of-range-target patch is RISC-V-specific and needs the RISC-V maintainers. Rui Qi pinged Palmer and Paul on 2026-09-01 and had no review as of the report date.
- Bjorn Topel reviewed OPTPROBES in February 2023 and asked for real-hardware testing. The OPTPROBES cover letter's own test evidence is RV64 QEMU only.

**Technical blockers.**
- Livepatch needs a reliable unwinder. The series has no objection recorded, but it is gated to `FRAME_POINTER && 64BIT`. The gate is conservative scoping, and RV32 lacks equivalent test coverage. The module-relocation and syscall livepatch paths were exercised only on RV64 QEMU virt.
- Two livepatch ideas that would avoid the frame-pointer cost are deferred: ORC (needs RISC-V objtool) and SFrame (ABI does not yet cover RISC-V).
- Static call: the RFC had visible defects (call-site patching unimplemented, undefined `make_call_t0()`, `jalr` trampoline that does not tail-jump, no cross-hart `fence.i`, no tests).
- CALL_OPS excludes CFI builds. `ftrace_call_adjust()` is wrong in that configuration; the fix patch had no replies and originally missed the ftrace maintainers.

**Organizational blockers.**
- RISC-V maintainer review bandwidth. Multiple Rui Qi patches (2026-07-06, 2026-07-07) were unreviewed after pings on 2026-08-29 and 2026-09-01.
- Livepatch ownership moved from Wang Han (Alibaba), who left the team, to Shuai Xue. The v5 thread was quiet from early August.
- No RISE-funded tracing work was found, so there is no sponsor driving OPTPROBES or static call. Both are stalled since 2023.
- The rvtrace series (v4, 12 patches, posted 2026-04-29) had no reviews at last check and the cover letter does not mention RISE. A late-2025 RFC for a RISC-V trace PMU driver is perf-adjacent.

**Acceptance probability.** The probabilities below are this report's judgment from review state, not a stated maintainer position.
- Livepatch: higher. It has Reviewed-by tags, an Acked-by from the livepatch maintainer on patch 7, QEMU results (7 pass, 1 skip) and a new owner who asked for the next merge window. Not yet merged as of 7.4-rc1.
- Rui Qi's ftrace fixes: likely, once reviewed.
- OPTPROBES and static call: low without a new sponsor and hardware numbers.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro
- **Optimization level:** not applicable. This is not an optimization-purpose project.

**Justification.** RISC-V tracing (dynamic ftrace with CALL_OPS and direct calls, function graph, kprobes, uprobes, KGDB, jump labels) is in mainline `arch/riscv`, but the kernel tree has no in-tree riscv64 CI. The community [linux-riscv GitHub CI](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html) cross-builds and QEMU-boots patch series. Its kselftest run is only an experiment, on which the ftrace suite panicked on 6.12-rc1 (September 2024, no later status found), so the grade is build-only (yellow). Upstream ships source only, so consumable binaries are distro kernels such as Ubuntu 26.04 `linux-image-generic` 7.0.0-14.14.2 on riscv64.

**Pending work that could change the grade.**
- Open and unmerged: reliable stack unwinding for livepatch (`HAVE_RELIABLE_STACKTRACE` and `HAVE_LIVEPATCH`, v6 by Shuai Xue, 2026-09-14, [LWN](https://lwn.net/Articles/1094265/)).
- Also open: Rui Qi's ftrace out-of-range target and call-ops NOP fixes (no review yet), the OPTPROBES and static call series (stalled since 2023), and the RISC-V hardware trace framework (rvtrace v4, Anup Patel, perf-adjacent).
- No RISE-funded tracing work was found, and RISE runners are not used for tracing CI.
- A recent ftrace selftest result on riscv64 (KernelCI, LKFT or the linux-riscv kselftest job) would let this move to blue.
- Facts marked [NEEDS VERIFICATION]: current ftrace selftest results on riscv64, Ubuntu kernel riscv64 patch status, distro kernel tracing configs.

## 14. Investment Analysis

**Already done or funded.** No RISE-funded tracing work was found. The riseproject-dev GitHub project board 14 and 60 of the org's repositories were not enumerated, and the RISE Kernel & Virtualization page did not render. RISE sponsors the linux-riscv CI GitHub runners, which is the existing infrastructure to build on. Effort figures below are this report's own sizing estimates, not sourced facts.

### 14.1 Functional Enablement

- **Livepatch:** the series is open with an active owner. The work is hardware validation beyond QEMU (real RISC-V boards) and review, reducing time to merge. Estimate 4-6 person-weeks.
- **Review and testing of Rui Qi's ftrace fixes:** the out-of-range-target patch and the call-ops NOP patch are unreviewed. Estimate 2 person-weeks, mostly maintainer-facing work.
- **OPTPROBES revival:** v6 was 13 patches, 16 files, +1235/-11, with a Gem5-only performance claim. Reviewers asked for hardware tests. Estimate 12-16 person-weeks to rebase, test on hardware and drive through review.
- **Static call:** the RFC needs a rewrite. Estimate 8-10 person-weeks. Value is unquantified, since no benchmark exists.
- **RV32 livepatch coverage:** removing the 64BIT gate needs test coverage. Estimate 2-3 person-weeks (low priority).

### 14.2 Performance Optimization

- No riscv64 tracing benchmark exists. A baseline benchmark of ftrace, kprobe, uprobe and function-graph overhead on real hardware (the Spacemit K1 was used for CALL_OPS numbers) is the first step before any optimization work. Estimate 4-6 person-weeks.
- OPTPROBES (Section 14.1) is the only identified performance feature.

### 14.3 CI/CD Infrastructure

- Run `ftracetest` and the livepatch selftests on real riscv64 hardware or RISE runners and publish results. Fix whatever panics (the 6.12-rc1 result). Estimate 6-8 person-weeks.
- Add riscv64 to KernelCI or LKFT for tracing, if not already present. Estimate 3-4 person-weeks.
- Enable the opt-in `RISCV_KPROBES_KUNIT` test in the CI config. Estimate 1 person-week.

### 14.4 Ecosystem Enablement

- Audit riscv64 distro kernel configs (Ubuntu, Debian, Fedora, openSUSE, Arch) for tracing options. Estimate 1-2 person-weeks.
- Validate `trace-cmd` and `libtraceevent` on riscv64 against the current kernel. Estimate 1-2 person-weeks.
- Review support for the rvtrace series (hardware trace). This is perf-adjacent, so it is sized in the Linux perf report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Run ftracetest and livepatch selftests on riscv64 hardware or RISE runners; publish results; fix panics | 6-8 | Chip company kernel team with RISE Kernel WG | Critical |
| Functional | Hardware validation and review support for the livepatch series | 4-6 | Chip company kernel team with Shuai Xue | High |
| Functional | Review and test Rui Qi's ftrace fixes | 2 | Chip company kernel team | High |
| Performance | Baseline ftrace/kprobe/uprobe overhead benchmarks on hardware | 4-6 | Chip company performance team | High |
| CI/CD | KernelCI or LKFT tracing coverage | 3-4 | RISE infrastructure | Medium |
| Ecosystem | Distro tracing-config audit | 1-2 | Distro liaison | Medium |
| Ecosystem | Validate trace-cmd and libtraceevent on riscv64 | 1-2 | Chip company kernel team | Medium |
| CI/CD | Enable RISCV_KPROBES_KUNIT in CI | 1 | Chip company kernel team | Low |
| Functional | OPTPROBES revival | 12-16 | Chip company kernel team | Low (until benchmarks justify) |
| Functional | Static call | 8-10 | Chip company kernel team | Low |
| Functional | Remove 64BIT gate for RV32 livepatch | 2-3 | Chip company kernel team | Low |

## 15. References

- [Linux tracing documentation](https://docs.kernel.org/trace/index.html)
- [Linux kernel repository (torvalds)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [Livepatch reliable unwinding v6 (LWN)](https://lwn.net/Articles/1094265/)
- [Livepatch v2 cover (linux-riscv)](https://lists.infradead.org/pipermail/linux-riscv/2026-May/092144.html)
- [Livepatch v4 resend (LKML mirror)](https://lkml.iu.edu/2606.3/07728.html)
- [Livepatch v3 cover (LKML mirror)](https://lkml.iu.edu/2606.1/02997.html)
- [Livepatch v4 Kconfig patch (LKML mirror)](https://lkml.iu.edu/2606.3/07560.html)
- [Livepatch v2 patch 7/8 review (LKML mirror)](https://lkml.iu.edu/2606.0/04949.html)
- [Livepatch v1 (patchew)](https://patchew.org/linux/20260527123530.2593918-1-wanghan@linux.alibaba.com/)
- [Livepatch v3 cover (patchew)](https://patchew.org/linux/cover.194d76e3a15b.v3.riscv-livepatch.wanghan@linux.alibaba.com/)
- [Rui Qi: out-of-range ftrace targets (linux-riscv thread)](https://ratatoskr.run/linux-riscv/2026/07/17224838/t)
- [Rui Qi: pre-function NOPs with call ops (linux-trace-kernel thread)](https://ratatoskr.run/linux-trace-kernel/2026/08/17477393)
- [Kprobes on minimal configs v2 (Xiaofeng Yuan)](https://ratatoskr.run/linux-riscv/2026/07/17279465/t)
- [RISC-V trace framework v4 (Anup Patel)](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091655.html)
- [RISC-V trace framework v3 (LKML mirror)](https://lkml.iu.edu/2602.3/02195.html)
- [RISC-V trace framework v1 (LKML mirror)](https://lkml.iu.edu/2510.0/01463.html)
- [RISC-V trace PMU RFC thread (LKML mirror)](https://lkml.iu.edu/hypermail/linux/kernel/2510.1/05849.html)
- [OPTPROBES v6 cover (Chen Guokai)](https://lists.infradead.org/pipermail/linux-riscv/2023-January/025969.html)
- [OPTPROBES v6 review follow-up (LKML mirror)](https://lkml.iu.edu/hypermail/linux/kernel/2302.0/00502.html)
- [OPTPROBES v6 (patchew)](https://patchew.org/linux/20230127130541.1250865-1-chenguokai17@mails.ucas.ac.cn)
- [OPTPROBES v5 (lore)](https://lore.kernel.org/all/4062e65d-f411-bc01-d789-afee3c4b5b99@huawei.com/T/)
- [Static call RFC (ForrestNiu)](https://lists.infradead.org/pipermail/linux-riscv/2023-April/029857.html)
- [Static call RFC (patchwork)](https://patchwork.kernel.org/project/linux-riscv/patch/tencent_A8A256967B654625AEE1DB222514B0613B07@qq.com/)
- [PREEMPT_DYNAMIC with static keys (Jisheng Zhang)](https://patchew.org/linux/20230716164925.1858-1-jszhang@kernel.org/mbox)
- [KUnit test_kprobes Clang crash v2 thread](https://lists.infradead.org/pipermail/linux-riscv/2026-January/082890.html)
- [Guo Ren v5 k/uprobe series](https://lore.kernel.org/all/1608220905-1962-1-git-send-email-guoren@kernel.org/T/)
- [KPROBES_ON_FTRACE removal patch](https://lists.infradead.org/pipermail/linux-riscv/2024-July/057907.html)
- [linux-riscv PR 932: kprobe/ftrace bail out](https://github.com/linux-riscv/linux-riscv/pull/932)
- [linux-riscv PR 1137: ftrace without stop_machine](https://github.com/linux-riscv/linux-riscv/pull/1137)
- [Ghiti ftrace alignment thread (lore)](https://lore.kernel.org/linux-riscv/bd7c2263-4e81-4be6-af4d-22a0842ba2e4@ghiti.fr/)
- [GitHub RISC-V CI (BoF follow-up, LKML)](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html)
- [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci)
- [Ubuntu bug 1941898](https://bugs.launchpad.net/ubuntu/+source/linux-riscv/+bug/1941898)
- [Ubuntu kernel-team patch (May 2022)](https://lists.snapcraft.io/archives/kernel-team/2022-May/130482.html)
- [Kernel Bugzilla 209317](https://bugzilla.kernel.org/show_bug.cgi?id=209317)
- [KernelCI](https://kernelci.org)
- [uftrace PR 1815](https://github.com/namhyung/uftrace/pull/1815)
- [CPython issue 120400](https://github.com/python/cpython/issues/120400)
- [rv_linux_bug (ptrace a0 report)](https://github.com/Jer6y/rv_linux_bug)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog](https://riseproject.dev/blog/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE welcome post](https://riseproject.dev/2024/05/15/welcome-to-the-rise-project-blog/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE 2025 Kernel and Virtualization Priorities (Confluence)](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8591251/2025+-+Kernel+and+Virtualization+Priorities)
- [RISE December 2024 webinar deck](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [Linux Plumbers 2020: RISC-V Linux Tracing (K/Uprobe), Guo Ren](https://docs.google.com/presentation/d/1Upkur0tDW2D9du11ZYzBE4RurmHTEXN_eAGfo8K3Qt8/htmlpresent)
- [Ubuntu package search: linux-image-generic (resolute)](https://packages.ubuntu.com/search?keywords=linux-image-generic&suite=resolute&searchon=names&section=all)
- [Ubuntu package search: linux-tracing (resolute)](https://packages.ubuntu.com/search?keywords=linux-tracing&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute riscv64 trace-cmd](https://packages.ubuntu.com/resolute/riscv64/trace-cmd/download)
- [PyPI: linux-tracing (404)](https://pypi.org/pypi/linux-tracing/json)
- [Debug/profiling Linux tracing mailing-list reference (LKML mirror)](https://lkml.iu.edu/hypermail/linux/kernel/2210.0/03915.html)
- [linux-riscv trace framework v3 MAINTAINERS thread](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085821.html)
- [RISC-V trace via CoreSight RFC (LKML mirror)](https://lkml.iu.edu/2604.1/09755.html)