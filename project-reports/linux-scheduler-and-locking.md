---
title: Linux scheduler and locking
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
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: LTP
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-scheduler-and-locking" %}

# Linux scheduler and locking

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux scheduler and locking<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

"Linux scheduler and locking" is a slice of the mainline Linux kernel, not a standalone package. It covers the riscv64 architecture code under `arch/riscv` for the following areas. The generic code in `kernel/sched/` and `kernel/locking/` contains no riscv-specific files.

- Atomics, cmpxchg and barriers.
- Spinlocks: ticket, queued and combo.
- Futex.
- Context switch, preemption and PREEMPT_RT.
- SMP bring-up, IPIs and topology.
- Static keys.
- The vDSO, including `getrandom()`.
- membarrier.
- The rseq selftest backend.

The reference clone is at HEAD `05441d697f7f`, dated 2026-11-03 (`v7.4-rc1-132`). Its repository is [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git). The [docs.kernel.org scheduler index](https://docs.kernel.org/scheduler/index.html) lists these topics: completions, membarrier, CFS and EEVDF, CFS bandwidth, deadline and RT group scheduling, scheduler domains, capacity-aware and energy-aware scheduling, schedutil, utilization clamping, sched_ext and scheduler preemption.

**Governance.**
- No dedicated foundation or project entity governs this subsystem. It is part of the Linux kernel, which is GPL-2.0 and developed through mailing lists and git.kernel.org.
- A Linux Foundation hosting claim is not stated in either fetched page. [NEEDS VERIFICATION]
- Core subsystems use the tip tree model (`Documentation/process/maintainer-tip.rst`). The branches are sched/core, locking/core and timers/vdso.
- The RISC-V port is a separate MAINTAINERS entry, "RISC-V ARCHITECTURE". Its status is Supported. The list is linux-riscv@lists.infradead.org. The tree is `git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`. The patch queue is [patchwork linux-riscv](https://patchwork.kernel.org/project/linux-riscv/list/).

**Maintainers (MAINTAINERS at HEAD).** The employers below are inferred from email domains, not stated in MAINTAINERS.

| Entry | Maintainers and reviewers |
|---|---|
| RISC-V ARCHITECTURE | Paul Walmsley, Palmer Dabbelt, Albert Ou (M); Alexandre Ghiti (R). Employers not given in MAINTAINERS. [NEEDS VERIFICATION] |
| SCHEDULER | Ingo Molnar, Peter Zijlstra, Juri Lelli, Vincent Guittot (M); Dietmar Eggemann, Steven Rostedt, Ben Segall, Mel Gorman, Valentin Schneider, K Prateek Nayak (R) |
| SCHED_EXT | Reviewers Tejun Heo, David Vernet, Andrea Righi, Changwoo Min. Status Maintained. |
| LOCKING PRIMITIVES | Peter Zijlstra, Ingo Molnar, Will Deacon, Boqun Feng (M); Waiman Long (R). It also owns `arch/*/include/asm/spinlock*.h`, so riscv's spinlock headers fall under it. |
| ATOMIC INFRASTRUCTURE | Will Deacon, Peter Zijlstra, Boqun Feng (M); Mark Rutland, Gary Guo (R). It also owns `arch/*/include/asm/atomic*.h`. |
| RCU | Paul E. McKenney leads, with Frederic Weisbecker, Neeraj Upadhyay, Joel Fernandes, Josh Triplett, Boqun Feng and Uladzislau Rezki. Status Supported. |
| FUTEX | Thomas Gleixner, Ingo Molnar (M); Peter Zijlstra, Darren Hart, Davidlohr Bueso, Andre Almeida (R) |
| RSEQ | Mathieu Desnoyers, Peter Zijlstra, Paul McKenney, Boqun Feng. Status Supported. |
| GENERIC VDSO LIBRARY | Andy Lutomirski, Thomas Gleixner, Vincenzo Frascino. Status Maintained. |

**Corporate contributors.** The sample is about 40 commits since 2025-11-01, counted by author domain on the riscv atomic, cmpxchg, barrier, spinlock, percpu, jump_label, vdso, smpboot, cacheinfo and hwprobe paths. The sample is small.
- linutronix.de: 9. This is likely generic vDSO and cross-architecture cleanups. [NEEDS VERIFICATION]
- iscas.ac.cn: 7.
- linux-foundation.org: 5.
- rivosinc.com: 4.
- kernel.org: 3.
- tenstorrent.com, sifive.com, oss.qualcomm.com, bytedance.com, gmail.com: 2 each.
- ventanamicro.com, linux.dev, kylinos.cn, debian.org: 1 each.

**RISE.** No RISE-funded project for scheduler, locking, atomics, futex or vDSO work was found. See Section 7 and Section 14. Whether RISE funds the Zawrs, Zacas, Zabha or qspinlock work is [NEEDS VERIFICATION], because lore.kernel.org was not accessible.

**Community stance on new ports and features.** There is no new-port question: the port is mainline and Supported. For new ISA extensions, [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) accepts them only if the spec is Frozen or Ratified. It also states that "Linux maintainers disapprove of churn" and prefer "well-reviewed and tested code over experimental code". The core scheduler and locking maintainers are arch-neutral. Arch hooks are accepted when they follow the generic APIs.

## 2. Port History and Upstreaming Timeline

The code is fully upstream. The first riscv commit in the clone is `76d2a0493a17` "RISC-V: Init and Halt Code" (Palmer Dabbelt, authored 2017-07-10, first tag v4.15-rc1). The author date is when the patches were written. The mainline merge was November 2017, in Linux 4.15, via Linus Torvalds's merge `b293fca43be5` (2017-11-15).

| Date | Event | Source |
|---|---|---|
| 2017-07-10 (authored), v4.15 | `fab957c11efe` "RISC-V: Atomic and Locking Code" (Palmer Dabbelt) introduces `atomic.h` and `spinlock.h`. `e2c0cdfba7f6` "User-facing API" is the first vDSO commit. | Linux clone |
| 2018-03-09, v4.17 | `fence.h` (Andrea Parri) | Linux clone |
| 2018-10-16, v4.20 | `futex.h` (Jim Wilson, SiFive) | Linux clone |
| 2019-02-22, v5.2 | `mmiowb.h` (Will Deacon) | Linux clone |
| 2020-03-17, v5.7 | `cpu_ops_spinwait.c` (Atish Patra, WDC) | Linux clone |
| 2020-06-09, v5.8 | vDSO `gettimeofday.h` and `vgettimeofday.c` (Vincent Chen, SiFive) | Linux clone |
| 2020-07-14, v5.9 | `jump_label.h` and `jump_label.c` (Emil Renner Berthing) | Linux clone |
| 2021-03 | Guo Ren's ticket spinlock series v6 posted. Merge status [NEEDS VERIFICATION]. | [linux-riscv archive](https://lists.infradead.org/pipermail/linux-riscv/2021-March/005576.html) |
| 2022-04-05, v5.19 | `compat_vdso/Makefile` (Guo Ren, Alibaba) | Linux clone |
| 2022-06 | Zawrs RFC (Christoph Müllner, VRULL) | [patchew](https://patchew.org/linux/20220602141032.169907-1-christoph.muellner@vrull.io/) |
| 2022-08 | PREEMPT_RT v2 series (Jisheng Zhang) | [patchew](https://patchew.org/linux/20220831175920.2806-1-jszhang@kernel.org/), [LWN 931531](https://lwn.net/Articles/931531/) |
| 2023-03-23, v6.4-rc1 | `f0bddf50586d` convert to generic entry (Guo Ren). Base for RT, rseq and TIF work. | Linux clone |
| 2023-04-18, v6.4-rc1 | `c4b52d8b6c1d` CPU and frequency invariance exported to the scheduler (Song Shuai). `8bf7b3b66762` SCHED_MC enabled. | Linux clone |
| 2023-12-14, v6.8-rc1 | `6b9f29b81b15` percpu page first-chunk allocator (Ghiti, Rivos) | Linux clone |
| 2024-01-09, v6.8-rc1 | Ztso ISA parsing `1ec9f381e848` and hwprobe export `5b4d64a819c0` | Linux clone |
| 2024-07-12, v6.11-rc1 | `b8ddb0df30f9` Zawrs for spinlocks (Müllner, VRULL; co-developed by Andrew Jones). Authored 2024-04-26, so 2024-07-12 is the commit date. | Linux clone |
| 2024-09-17, v6.12-rc1 | `2638e4e6b182` allow PREEMPT_RT (Sebastian Siewior, Linutronix) | Linux clone |
| 2024-11-11, v6.13-rc1 | `ab83647fadae` qspinlock plus the Zacas and Zabha atomics, merged via `64f7b77f0bd9`. Authored 2024-11-03 by Ghiti (Rivos). | Linux clone |
| 2024-11-05, v6.13-rc1 | `22aaec357c1f` PREEMPT_LAZY (Jisheng Zhang). Authored 2024-10-21. | Linux clone |
| 2024-12 to 2025-01, v6.13 | Fixes `b3134b8c1a1c` (DEBUG_RT_MUTEXES boot failure) and `40e6073e7648` (`_Q_PENDING_LOOPS`) | Linux clone |
| 2025-03-18, v6.15-rc1 | `d9708b1931fc` smp_cond_load8/16 with Zawrs (Guo Ren) | Linux clone |
| 2025-04-16 to 2025-06-05, v6.16-rc1 | vDSO getrandom: first attempt `89079520cef6`, revert `2f956db8b3b0` on 2025-06-02, re-land `ee0d03053e70` on 2025-06-05 | Linux clone |
| 2025-07-16, v6.16 | `969f028bf2c4` enable interrupts during exception handling, an RT fix (Nam Cao, Linutronix) | Linux clone |
| 2025-09-17, v6.18-rc1 | `41e871f2b63e` generic TIF bits (Thomas Gleixner) | Linux clone |
| 2025-11-19, v6.19-rc1 | `ad1bb4b8525e` Zalasr instruction definitions (Xu Lu, ByteDance). `724c69447975` cmpxchg uses `riscv_has_extension_likely`. | Linux clone |
| 2026-07-13, v7.2 | `ad6dcfa02376` no LTO for the vDSO | Linux clone |
| 2026-08-07, v7.3-rc1 | `76555252981e` `.option arch` for Zacas and Zabha. `f61959a3a8b5` Ziccamoa, Ziccif, Ziccrse and Za64rs in cpufeature and hwprobe. | Linux clone |
| 2026-10-07 | `405290be962b` futex user pointer untagging. Release tag not checked. | Linux clone |
| 2026-10-08, v7.4-rc1 | `5ae75414416f` MMU_GATHER_RCU_TABLE_FREE for riscv MMU (Lorenzo Stoakes) | Linux clone |

**Key contributors and organizations.**
- Palmer Dabbelt: original port.
- Alexandre Ghiti (Rivos): qspinlock and Zacas/Zabha atomics.
- Guo Ren (Alibaba): generic entry, ticket spinlock and qspinlock predecessor work, and Zawrs byte/halfword waits.
- Christoph Müllner (VRULL) and Andrew Jones (Ventana, later Qualcomm): Zawrs.
- Sebastian Siewior, Nam Cao and Thomas Gleixner (Linutronix): RT.
- Jisheng Zhang: PREEMPT_LAZY.
- Xi Ruoyao: vDSO getrandom.
- Davidlohr Bueso: futex cmpxchg.
- Xu Lu and Qingwei Hu (ByteDance): Zalasr.
- Andrea Parri: memory-model reviews and fences.

**Notes on authorship and dates.**
- Git records the author of `724c69447975` as Vivian Wang <wangruikang@iscas.ac.cn> (ISCAS). The same name may apply to `76555252981e`.
- The qspinlock series has two dates in its threads: the list thread for the author's V11 is [November 2023](https://lists.infradead.org/pipermail/linux-riscv/2023-November/043379.html), and the predecessor series link is [dated 2023-12-25](https://lore.kernel.org/linux-riscv/20231225125847.2778638-1-guoren@kernel.org/). The LWN summary says "early 2024". These are possibly different revisions and were not reconciled.

## 3. Upstream Support Tier

**Formal tier policy.** No formal tier system exists. The policy document is [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html).
- New extensions are accepted only if the spec is Frozen or Ratified.
- Custom vendor extensions have extra rules. The text was cut off in the read, so the details are not available.
- Patches are checked by CI on patchwork, and a failing check makes a patch unlikely to be applied.

The MAINTAINERS status for RISC-V is "Supported".

**Evidence on CI, release-blocking and binaries.**
- The kernel tree has no CI configuration: no `.gitlab-ci.yml`, `.github/`, `Jenkinsfile`, `.travis.yml`, `.cirrus.yml`, `azure-pipelines.yml` or `ci/` directory.
- `tools/testing/selftests/riscv/Makefile` builds `abi hwprobe mm sigreturn vector cfi`. None of these tests scheduling or locking.
- Release-blocking status of any riscv64 scheduler or locking test: data not available. Searched the tree, MAINTAINERS, and KernelCI, LKFT and 0-day references.
- Upstream ships source only. Binaries come from distro kernel packages (Section 8).

**Comparison table.** Only items found are filled in. All others were not searched.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch status in MAINTAINERS | Data not available (not searched) | Data not available (not searched) | Supported |
| rcutorture QEMU selection (`functions.sh`) | Present (x86_64, i386) | Present (aarch64) | No match; no riscv rcutorture config under `configs/`. The qemu script itself was not checked, so this is a tooling gap, not a confirmed absence. |
| rseq selftest backend | Present (`rseq-x86`) | Present (`rseq-arm64`) | Present (`rseq-riscv.h`, `rseq-riscv-bits.h`) |
| `vdso_standalone_test_x86` | Built | Not built | Not built |
| Bounded LL/SC retry in futex cmpxchg | Data not available | Present (commit `03110a5cb216`, cited by the riscv patch) | Posted as v2, not merged |
| Queued spinlock default | Data not available | Data not available | Combo (runtime choice of queued or ticket); pure queued needs NONPORTABLE |
| In-tree CI config | None | None | None |
| riscv64 external test evidence | Data not available | Data not available | KernelCI qemu LTP on CIP trees (ltp-ipc, ltp-timers, fcntl-locktests), search snippets only [NEEDS VERIFICATION] |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The comparison columns for amd64 and arm64 are mostly "Data not available (not searched)", because only the riscv tree was examined.

| Component | riscv64 state | ISA extensions | Quality | amd64 / arm64 |
|---|---|---|---|---|
| cmpxchg and xchg (`cmpxchg.h`) | Present since v4.15. Zacas (32/64/128-bit) and Zabha (8/16-bit) paths since v6.13. Dispatch is by `riscv_has_extension_likely` since v6.19. | A, Zacas, Zabha, `.option arch` since v7.3 | Hand-written inline assembly. The base path is `lr.w/sc.w` loops. `amocas.X.aqrl` replaced `amocas.X.rl` plus `fence rw,rw`. | Not searched |
| Spinlocks (`spinlock.h`) | Ticket, queued or combo, selected by the `qspinlock_key` static key. Default is combo. | Zabha or Ziccrse needed for queued | Generic asm-generic code plus a runtime switch | Not searched |
| Spin-wait (`barrier.h`) | `smp_cond_load_relaxed` uses `WRS.NTO`. Byte and halfword variants since v6.15. | Zawrs | Inline assembly | Not searched |
| Acquire/release (`barrier.h`) | `__smp_load_acquire` and `__smp_store_release` do not use Zalasr at HEAD. | Zalasr instruction definitions merged | Fence-based. Zalasr use is pending (v5). | Not searched |
| Futex (`futex.h`) | Present since v4.20. The cmpxchg was optimized in v6.14. The unbounded LR/SC loop fix is pending. | A (LR/SC) | Inline assembly | arm64 has a bounded retry (`03110a5cb216`) |
| Static keys and patching | `jump_label.c`, `patch.c`. Kconfig `HAVE_ARCH_JUMP_LABEL(_RELATIVE)`. | none | C plus alternatives | Not searched |
| Context switch and preemption | `entry.S`, `process.c`. GENERIC_ENTRY, `ARCH_HAS_PREEMPT_LAZY`, `ARCH_SUPPORTS_RT`. Generic TIF bits since v6.18. | none | Generic framework | Not searched |
| SMP, hotplug, IPI | `smp.c`, `smpboot.c`, `cpu_ops_sbi.c`, `sbi-ipi.c`. `HOTPLUG_CPU`, `HOTPLUG_PARALLEL`. | SBI IPI and HSM | SBI-based | Not searched |
| Topology and capacity | `topology.h`, `GENERIC_ARCH_TOPOLOGY`, `ARCH_SUPPORTS_SCHED_MC`. Asymmetric capacity wiring was not checked. | none | Generic | Not searched |
| vDSO | `kernel/vdso/` (`rt_sigreturn.S`, `getcpu.S`, `flush_icache.S`, `sys_hwprobe.S`, `vgettimeofday.c`, `hwprobe.c`, `getrandom.c`, `vgetrandom-chacha.S`). Also `compat_vdso/` and `vdso_cfi/`. `VDSO_GETRANDOM` for MMU and 64-bit. | Base ISA. The CFI variant needs Zicfilp/Zicfiss (`-fcf-protection=full`). | ChaCha20 is hand-written assembly; vector use is not stated. Other entry points are C or assembly. | Not searched |
| membarrier | `membarrier.h`. `ARCH_HAS_MEMBARRIER_CALLBACKS`, `ARCH_HAS_MEMBARRIER_SYNC_CORE`. | none | C | Not searched |
| rseq | `HAVE_RSEQ` selected. Selftest backend present. | none | Assembly in selftests | Backends for arm, arm64, mips, ppc, s390, x86 and or1k exist |
| percpu, preempt count, READ_ONCE | No `asm/percpu.h`, `asm/preempt.h` or `asm/rwonce.h`. Generic implementations are used. | none | Generic | Not searched |
| mmiowb | `ARCH_HAS_MMIOWB` selected | none | Present since v5.2 | Not searched |

Other Kconfig facts:
- `ARCH_USE_QUEUED_RWLOCKS` and `ARCH_USE_CMPXCHG_LOCKREF` (64-bit only) are set.
- `ARCH_WEAK_RELEASE_ACQUIRE` is set when queued spinlocks are on.
- `RISCV_ISA_V_PREEMPTIVE` exists.
- The merged cover text states the qspinlock implementation "satisfies the forward progress guarantee" using Zabha or Ziccrse.
- Ztso is parsed and exported through hwprobe.
- `fence.tso` memory-model details were not checked beyond the Ztso commits.

The `qspinlock_key` static key carries a code TODO: use an alternative instead, once extension parsing happens earlier in boot. Whether it has been resolved was not checked.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses kbuild `make`, with no cmake or configure step. The commands below apply the generic forms from `kbuild.rst` and `llvm.rst`. I did not run them.

GNU cross build:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```
The `riscv64-linux-gnu-` prefix is the usual Debian name. The docs do not give a prefix. [NEEDS VERIFICATION]

LLVM build:
```
make LLVM=1 ARCH=riscv defconfig
make LLVM=1 ARCH=riscv -j$(nproc)
```
- A versioned suffix works: `LLVM=-18`.
- Use the same `LLVM=` value on every `make` invocation.
- `LLVM_IAS=0` disables the integrated assembler and needs `CROSS_COMPILE` when cross compiling.
- Config fragments in `arch/riscv/configs/`: `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig`, `nommu_virt_defconfig`.

Default flags set by `arch/riscv/Makefile`:
- 64-bit uses `-mabi=lp64` and `-melf64lriscv`.
- `-march` starts at `rv64ima`, then appends `fd`, `c` and `v` by Kconfig.
- `_zicsr_zifencei` is added when `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` is set.
- `-Wa,-misa-spec=2.2` is added when `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` is set.

Selftests, from `tools/testing/selftests/riscv/README`:
```
make TARGETS=riscv kselftest
make -C tools/testing/selftests TARGETS=riscv RISCV_SUBTARGETS="mm vector" INSTALL_PATH=<path> install
```
The riscv tests are skipped unless `ARCH=riscv`. Generic futex, rseq, vDSO and locking selftests are built from `tools/testing/selftests/Makefile`. It sets `SKIP_TARGETS ?= bpf sched_ext`, so sched_ext is skipped by default.

**Toolchain minimums** (`scripts/min-tool-version.sh` and `changes.rst` agree). The scripts give no reason for the GCC and LLVM minimums.

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | No riscv-specific minimum |
| binutils | 2.30 | |
| Clang/LLVM | 17.0.1 | Only the latest formal LLVM release is supported, per `changes.rst` |
| GNU make | 4.0 | |
| bash | 4.2 | |
| Python | 3.9 | |
| pahole | 1.26 | `changes.rst` table says 1.26 but its prose says 1.22. Discrepancy; only relevant with `DEBUG_INFO_BTF`. |
| Rust (optional) | 1.85.0 | |
| bindgen (optional) | 0.71.1 | |

**Riscv-specific toolchain gates.** A feature drops out silently when its gate fails; these are not hard build errors.
- **Zacas and Zabha:** `RISCV_ISA_ZACAS` and `RISCV_ISA_ZABHA` need compiler `-march` support for each extension (`TOOLCHAIN_HAS_ZACAS`, `TOOLCHAIN_HAS_ZABHA`) plus assembler `.option arch` support. The "why" is that the cmpxchg fast paths use these instructions. Without Zacas in the toolchain, Zabha CAS instructions are not used either.
- **Vector (`RISCV_ISA_V`):** needs `-march=rv64imv` support, GNU `ld` 2.38 or newer (or lld), and `.option arch`.
- **Zbb, Zba, Zbc, Zbkb:** need `ld` 2.39 or newer (or lld).
- **Zicsr and Zifencei:** binutils 2.38 and GCC 12.1.0 moved the default ISA spec, so the extensions become explicit. `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies when GCC is older than 11.3.0.
- **Ftrace:** `CLANG_SUPPORTS_DYNAMIC_FTRACE` and `GCC_SUPPORTS_DYNAMIC_FTRACE` (`-fpatchable-function-entry=8`).
- **`ARCH_HAS_BROKEN_DWARF5`:** set when the LLVM assembler and lld are both older than 18.0.0.
- **Rust:** `HAVE_RUST` requires `CC_IS_CLANG` and riscv64. `Documentation/rust/arch-support.rst` lists riscv as Maintained, "riscv64 and LLVM/Clang only".
- **LLVM support level:** `llvm.rst` lists riscv as "Supported".
- **Shadow call stack:** needs `ld --no-relax-gp`.
- **vDSO CFI variant:** needs GCC support for `-fcf-protection=full`.

**QEMU.** The tree contains no QEMU invocation instructions. `SOC_VIRT` ("QEMU Virt Machine") exists in `arch/riscv/Kconfig.socs`, and `nommu_virt_defconfig` targets it. Any `qemu-system-riscv64 -M virt` command line would be unsourced. [NEEDS VERIFICATION]

**Known build failures and toolchain pitfalls.**
- `2b9518684f85`: Clang could drop the argument assignment in the getrandom syscall wrapper.
- `ad6dcfa02376`: LTO removed vDSO symbols.
- `0f289334af68`: linker relaxation had to be disabled for `RUNTIME_MAGIC`.
- `f7bd2be7663c`: cmpxchg128 needs fixed registers because GCC otherwise picks odd registers and produces a reserved encoding.
- `76555252981e`: Zacas and Zabha are no longer added to `-march` globally.
- A compat vDSO fix for lld ([lore](https://lore.kernel.org/all/20250423-riscv-fix-compat_vdso-lld-v2-1-b7bbbc244501@kernel.org/)) was squashed into the getrandom series.

No Dockerfile or Containerfile exists in the tree.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Comparisons with arm64 and amd64 were not systematically searched. The matrix shows riscv64 state with notes where arm64 data exists.

| Feature | riscv64 | Notes |
|---|---|---|
| Ticket spinlocks | Yes | |
| Queued spinlocks | Yes, since v6.13 | Combo is the default. Pure queued needs `NONPORTABLE`, SMP and MMU. |
| Queued rwlocks | Yes | `ARCH_USE_QUEUED_RWLOCKS` |
| Zacas and Zabha cmpxchg/xchg | Yes, since v6.13 | Toolchain gated |
| Zawrs waiting | Yes, since v6.11 and v6.15 | |
| Zalasr acquire/release | Not used | Pending, v5 |
| PREEMPT_RT | Yes, since v6.12 | A latent bug in exception handling was fixed in v6.16 |
| PREEMPT_LAZY | Yes, since v6.13 | |
| Generic entry, generic TIF | Yes | |
| rseq | `HAVE_RSEQ` selected | Selftest backend exists |
| sched_ext | No riscv-specific kernel commit in `arch/riscv` history. `SCHED_CLASS_EXT` is in `init/Kconfig`. | Distro enablement on riscv64 [NEEDS VERIFICATION] |
| SCHED_MC | Yes | |
| SCHED_CLUSTER, SCHED_SMT | Not seen in the arch Kconfig grep | Other files were not checked |
| PREEMPT_DYNAMIC | Available: riscv selects `ARCH_HAS_PREEMPT_LAZY`, and generic `PREEMPT_DYNAMIC` depends on it (default y). There is no `HAVE_PREEMPT_DYNAMIC` select in `arch/riscv/Kconfig`. | See the note below. |
| vDSO gettimeofday, getcpu, hwprobe | Yes | |
| vDSO getrandom | Yes, since v6.16 | About 17-18x faster than syscall, per the author's figures (Section 11) |
| rv32 compat vDSO on rv64 | Yes | `compat_vdso/` |
| CFI vDSO | Yes, since v7.0 (`vdso_cfi`) | |
| RCU | Not checked. No riscv-specific commits were seen in git history. | MMU_GATHER_RCU_TABLE_FREE enabled in v7.4-rc1 |
| rcutorture on riscv under QEMU | Not available | Tooling gap |
| KUnit | No `.kunitconfig` found under `arch/riscv`, `kernel/locking`, `kernel/sched` or `kernel/rcu`. The search was `head`-limited. | |
| lock torture / locktorture on riscv | Used by the author of the T-Head fix on SG2042 and TH1520 | Results not in the tree |
| Hardware coverage notes | SG2042 and TH1520 used for qspinlock testing | Early C910 cores have a store-merge livelock |

**PREEMPT_DYNAMIC.** A gnulib reporter described a PREEMPT_DYNAMIC kernel on riscv64. This is consistent with the clone: `arch/riscv/Kconfig` has `select ARCH_HAS_PREEMPT_LAZY` (line 47), and `kernel/Kconfig.preempt` makes `PREEMPT_DYNAMIC` depend on `ARCH_HAS_PREEMPT_LAZY` with `default y`. A grep for `HAVE_PREEMPT_DYNAMIC` in the arch Kconfig correctly finds nothing.

**Functional gaps.**
- Queued spinlocks as the default are not possible without Zabha or Ziccrse. Combo falls back to ticket locks at runtime.
- The riscv atomics-based locks depend on LR/SC forward-progress. The bound is missing in futex until Bueso's v2 is merged.
- No rcutorture riscv QEMU path.
- Zalasr is not used for `smp_load_acquire` and `smp_store_release`.

**Performance gaps.**
- No riscv64 benchmark of Zawrs, Zacas or Zabha was found.
- No riscv64 `clock_gettime` or `gettimeofday` vDSO timings, and no schbench, hackbench, will-it-scale or lock_torture results, were found.
- The only quantified figures are Guo Ren's pre-merge qspinlock numbers on SG2042 and the vDSO getrandom timings (Section 11).
- Data not available for deltas against arm64 and amd64.

**Security hardening.**
- `hardening.config` exists in `arch/riscv/configs/`.
- CVE-2024-57939: `die()` took a sleeping lock under RT. It was fixed with `raw_spinlock_t` (`6a97f4118ac0`, v6.13).
- `4d0697f19297` (v7.3): under `SHADOW_CALL_STACK`, an unprivileged task could set `tp` and make the kernel skip reloading the shadow-call-stack pointer. This gave an arbitrary-write and control-flow primitive. It was fixed by checking `sstatus.SPP`. It is marked for stable.
- Unbounded LR/SC retry from unprivileged PI futex operations is open.

**NaN and floating-point semantics:** not applicable to this subsystem.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist in the tree?** No. A tree listing of the shared clone at HEAD found no CI config of any kind (see Section 3 for the file names). The checks were:
- the tree top level;
- MAINTAINERS, searched for KernelCI, LKFT, 0-day, syzbot, buildbot and Jenkins;
- `tools/testing/selftests/Makefile`, `riscv/Makefile`, `vDSO/Makefile`, `rseq/Makefile` and `rcutorture/bin/functions.sh`.

The MAINTAINERS GitLab hits are git tree and bug-tracker URLs for drm, amdgpu and apparmor. None relate to scheduler or locking CI.

**Patch-level checks.** [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) says patchwork CI checks apply and that failing checks make a patch unlikely to be applied. I could not read the job definitions, so whether they only build or also run tests is an inference. The grade treats them as build-only.

**External riscv64 test execution.**
- KernelCI qemu riscv64 LTP runs on the CIP trees 5.10.y-cip and 6.1.y-cip. They ran in `lab-broonie` and `lab-collabora` and were reported to kernel-build-reports@lists.linaro.org. [NEEDS VERIFICATION], because only search snippets were read:
  - [fcntl-locktests](https://lists-ec2.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/2N2GXQONP467SDG2273INU3RM6WLS5ND)
  - [ltp-timers](https://lists.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/7ASRBPRMGIYEQR4Z2EY7AZNJKYKYARVM)
  - [ltp-ipc](https://lists.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/MZCXFAFOBKS3BGLKSTRCGHXXI6D4ZQLX)
- No riscv64 kselftest coverage for futex, rseq, vDSO or sched was found in KernelCI, LKFT or 0-day. [NEEDS VERIFICATION]
- The KernelCI dashboard (Anubis page), git.kernel.org and the lore.kernel.org linux-riscv search were all blocked. LKFT and syzkaller were not attempted.
- syzbot has produced two riscv64-only reports (Section 11).
- The sched-ext CI workflow found uses GitHub Actions with virtme-ng and is not riscv64.

**RISE.**
- No RISE runner usage or funded work was found for this subsystem.
- The `riscv-runner` repo exists (free GitHub runners on real RISC-V hardware), as do `board-farm` and a `linux` fork with no visible scheduler, locking, atomics or vDSO changes. Only 10 of the org's 70 repositories were visible. A `kernel-and-virtualization-wg` repo was mentioned but was not among the visible ones. [NEEDS VERIFICATION]
- The [December 2024 deck](https://riseproject.dev/) lists the Linux kernel among seven active CI projects on the RISE build farm. The June 2026 RISC-V Summit Europe deck says the build farm integrates with kernel, GCC and LLVM CI. Whether these exercise scheduler or locking tests is not shown.
- RP012 added the Banana Pi BPI-F3 and SiFive HiFive Premier P550 to Collabora's LAVA lab, which KernelCI uses. The lab has close to 400 devices. The [post](https://riseproject.dev/2025/09/01/) is a summary. The post's own URL was not captured, so treat the link as the site root. [NEEDS VERIFICATION]
- Scaleway EM-RV1 (TH1520) runners run a vendor 5.10.x kernel and do not support virtualization. RISE says it is contributing full TH1520 mainline support.

**Comparison table.**

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI config in kernel tree | None | None | None |
| rcutorture QEMU support | Yes | Yes | No match found |
| Test execution seen externally | Data not available | Data not available | KernelCI qemu LTP on CIP trees (snippets) |
| Patchwork checks | Data not available | Data not available | Apply to linux-riscv; contents unread |
| Hardware | Data not available | Data not available | QEMU; LAVA boards; RISE runners (not tied to this subsystem) |

## 8. Distribution and Release Status

**Release provider:** distro. Upstream ships source only. The binaries are distro kernel packages.

- No PyPI package named `linux-scheduler-and-locking` exists (HTTP 404). The [RISE wheel builder index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/linux-scheduler-and-locking/) redirects to PyPI and also returns 404.
- The mainline riscv64 port has been in mainline since Linux 4.15.
- The clone is at `v7.4-rc1-132-g05441d697f7f`. The clone gives the state, because the git.kernel.org release page was not accessible.
- Ubuntu 26.04 (resolute) riscv64: not checked. packages.ubuntu.com was not accessible. [NEEDS VERIFICATION]
- Debian, Fedora, openSUSE and Arch kernel package and config sources were not checked. Whether distro configs enable sched_ext, queued spinlocks or PREEMPT_RT on riscv64 is [NEEDS VERIFICATION]. Data not available: distro packaging patches.
- Downstream hints (neither verified):
  - An [openSUSE request](https://build-test-1.opensuse.org/request/show/1227554) mentions sched_ext tooling patches for riscv64 and aarch64.
  - A [downstream packaging PR](https://github.com/cordanaLLM/nucleus/pull/162) titled "enable sched-ext on riscv64" (2026-10-16) is not upstream.
- Rust sched_ext userspace tooling added riscv64gc as a target in March 2025. [NEEDS VERIFICATION]

**What a user must do for a working binary.**
1. Install a distro riscv64 kernel package. The kernel ships in `linux-image-*` / `linux-riscv` packages on Ubuntu.
2. Or build from source per Section 5, with a toolchain new enough for Zacas and Zabha if the fast paths are wanted.
3. Select the spinlock type. The default combo falls back to ticket locks when neither Zabha nor Ziccrse is present.
4. Boot with OpenSBI or another SBI firmware for IPIs, timer and HSM.

## 9. Dependencies

Build, test and release statuses for toolchain rows come from the existing `project-reports/*.md` files (single source each). The dependency graph query was not available, so no row has graph confirmation.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime-dependency, critical) | The host kernel. Scheduler and locking code is part of it. Build tooling is generic userland (bash, make, bc, flex, bison, Python 3.9, openssl). | Builds, `ARCH=riscv` | No in-tree CI; limited external LTP (Section 7) | Distro kernel packages | Mainline; RISC-V Supported |
| OpenSBI (runtime-dependency, critical) | Firmware. SBI provides IPIs, timer and HSM for SMP and scheduler bring-up. | Builds. Report readiness orange. | SBIUnit tests exist but are off by default and no CI runs them | Not verified | See project-reports/opensbi.md |
| GCC (build-dependency, critical) | Default compiler (min 8.1). Needs `-march` support for zacas and zabha. Builds the vDSO, including `-fcf-protection=full` for the CFI variant. | Works. Report readiness blue. | riscv64 results go to gcc-testresults but are not release-blocking | Distro-provided. Latest stable 16.2 per the GCC report. | See project-reports/gcc.md |
| GNU binutils (build-dependency, critical) | Assembler and linker (min 2.30). Several extensions need `ld` 2.38 or 2.39. Links the vDSO. | Works. Report readiness blue. | Not separately verified | Distro-provided | See project-reports/gnu-binutils.md |
| LLVM (build-dependency, optional) | Alternative toolchain (Clang min 17.0.1, LLD). `HAVE_RUST` requires Clang. | Works. Report readiness yellow. | riscv64 is not in LLVM's required pre-merge CI per the LLVM report | Distro-provided | See project-reports/llvm.md |
| QEMU (test-dependency, optional) | Runs kselftests, KUnit and boot tests on riscv64. Not needed to build. | Builds. Report readiness yellow (build-only CI). | Not verified | Distro-provided | See project-reports/qemu.md |
| LTP (test-dependency, optional) | The Linux Test Project. KernelCI runs ltp-ipc, ltp-timers and fcntl-locktests on qemu riscv64 CIP trees (snippets). [NEEDS VERIFICATION] | Data not available. No LTP project report was consulted. | Seen on KernelCI qemu only; details not verified | Data not available | Data not available |
| Rust and bindgen (optional, indirect) | Rust-for-Linux only (Rust min 1.85.0, bindgen min 0.71.1). Not needed for core scheduler or locking. | `riscv64gc-unknown-linux-gnu` target available since Rust 1.41.0. Report readiness yellow. | Not verified | Distro-provided | Needs Clang as well. bindgen has no report. |
| glibc (indirect, userspace consumer) | Consumes futex, rseq and the vDSO (`__vdso_clock_gettime`, `getrandom`). Not a kernel build dependency. | Works. Report readiness yellow. | The riscv64 test-run gate is unconfirmed per the glibc report | Distro-provided | See project-reports/glibc.md |
| dwarves / pahole (indirect, optional) | BTF generation, min 1.26. Needed for `DEBUG_INFO_BTF`, which sched_ext requires. | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | In `projects.yml`, no report |

**Deep-dive on critical dependencies.**
- **Toolchain.**
  - A GCC or binutils that is too old does not fail the build. It silently disables Zacas, Zabha, and the CFI vDSO. The kernel runs with the slower LR/SC paths. This is a degraded configuration, not an error.
  - Binutils `ld` below 2.38/2.39 limits Vector and the bit-manipulation extensions.
  - Zacas and Zabha paths also depend on `.option arch` assembler support.
- **LLVM.** Rust-for-Linux on riscv requires Clang. LLD below 18 triggers a Kconfig workaround (`ARCH_HAS_BROKEN_DWARF5`).
- **OpenSBI.** SMP, IPIs and hotplug use the SBI. The firmware is a hard runtime dependency. Its readiness is orange.
- **Hardware extensions.** Zacas, Zabha, Zawrs, Zicfilp and Zicfiss are runtime-detected, not build-time dependencies. SMP and CPU topology come from the device tree or ACPI.

## 11. Known Bugs and Active Issues

There are no bug-tracker issue numbers. Kernel bugs are tracked by commit and mailing-list thread. The syzbot reports are the only trackers found.

**Open or unmerged.**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Bueso v2](https://lists.infradead.org/pipermail/linux-riscv/2026-May/090709.html) | Bound LL/SC retries in riscv `futex_atomic_cmpxchg_inatomic()` | Posted 2026-05-05, not seen merged. The latest change to `futex.h` in the clone is `405290be962b`. Later status [NEEDS VERIFICATION]. | High (correctness and denial of service) | The loop runs while holding the hash-bucket lock with page faults disabled. The author says it enables "pathological cases from unprivileged userspace pi operations". The cap is 128 iterations, chosen "arbitrarily". The arm64 equivalent is `03110a5cb216`. The patch is "compile tested only". |
| [ERRATA_THEAD_WRITE_ONCE v5](https://patchew.org/linux/20260421143154.1590156-1-guoren@kernel.org/) | T-Head C910 store-merge-buffer livelock | Posted April 2026, not merged (`git grep THEAD_WRITE_ONCE` returns nothing). Later status [NEEDS VERIFICATION]. | High on affected silicon | A lone store can sit in the merge buffer for a long time. Found on SG2042 and TH1520 during qspinlock lock_torture testing, and on SG2042 after about 30 minutes. The fix appends `fence w,o` to `WRITE_ONCE()` via alternatives on T-Head cores only. It adds an option that defaults to y. No cost figures. |
| Zalasr v5 | Use Zalasr for `smp_load_acquire` and `smp_store_release` | v5 (Qingwei Hu, ByteDance, October 2026). Only the instruction definitions, hwprobe and KVM parts are merged. | Low (performance) | See Section 12. |
| Kernel-mode vector under RT | Andy Chiu, linux-rt-devel, August 2026 | Status unknown [NEEDS VERIFICATION] | Unknown | [Thread](https://ratatoskr.run/linux-rt-devel/2026/08/17360219) |
| syzbot | "corrupted stack end detected inside scheduler" | Kernel 6.10-rc1, QEMU riscv-virtio, reported 2024-06-03, auto-closed as obsolete 2024-08-28, no reproducer | Unknown | [Report](https://groups.google.com/g/syzkaller-upstream-moderation/c/PkAFdhGiE7E/m/juPnE1SpDAAJ) |
| syzbot | "possible circular locking dependency" on 6.16.0-rc7 with riscv64 userspace | No reproducer. Seen only through a search summary, and the page title it points to is a different bug, so the match is doubtful. [NEEDS VERIFICATION] | Unknown | [Thread](https://groups.google.com/g/syzkaller-bugs/c/WbWLT0nipws/m/aOgcYgNwAwAJ) |
| gnulib `test-pthread-rwlock` | Timeouts on a riscv64 Alpine system | Root cause not established | Unknown | See the paragraph below. |

**gnulib `test-pthread-rwlock` ([bug-gnulib msg49781](https://mail-archive.com/bug-gnulib@gnu.org/msg49781.html)).** This is a symptom report, not a benchmark. The reporter's riscv64 Alpine system ran under an LXC container with a PREEMPT_DYNAMIC kernel and musl libc. CPU model and kernel version are not given.
- Under SCHED_OTHER the test timed out at 10m0.01s.
- With `chrt --fifo 10` it took 33.00 s. With `--rr 10` or `--rr 99` it took 30.00 s.
- Other machines: Ubuntu x86_64 glibc about 0.15-0.20 s; Alpine 3.20 x86_64 VM 1.24-1.59 s; cfarm91 riscv64 3.908 s; cfarm94 riscv64 0.84 s; cfarm95 riscv64 2.166 s; other riscv64 systems and a QEMU riscv64 VM under 4 s.
- It may be tied to the reporter's configuration rather than the kernel.

**Fixed (verified in the clone).**

| Commit | First release | Problem and fix |
|---|---|---|
| `6a97f4118ac0` | 6.13 | CVE-2024-57939 ([tracker](https://security-tracker.debian.org/tracker/CVE-2024-57939)). `die()` took a `spinlock_t`, which sleeps under RT. Switched to `raw_spinlock_t`. |
| `b3134b8c1a1c` | 6.13-rc3 | Boot failure with `CONFIG_DEBUG_RT_MUTEXES=y`. Jump-label patching switched queued to ticket spinlock one call site at a time, which could pair `ticket_lock` with `queued_spin_unlock`, dirty the lock value and deadlock. Fix: avoid the text mutex in `arch_jump_label_transform_queue()` while `early_boot_irqs_disabled`. Reported and tested by Conor Dooley. |
| `40e6073e7648` | 6.13-rc7 | `_Q_PENDING_LOOPS` was undefined with `RISCV_QUEUED_SPINLOCKS=y`. Fixes `ab83647fadae`. |
| `599c44cd21f4` | 6.14 | The futex cmpxchg compare value was not sign-extended to match `lr.w`. No miscompile was observed. |
| `89079520cef6`, `2f956db8b3b0`, `ee0d03053e70` | 6.16-rc1 | vDSO getrandom: first wiring reverted by Palmer Dabbelt as "broken", then re-applied. |
| `2b9518684f85` | 6.16-rc4 | Wrong inline-asm constraints in the getrandom syscall wrapper. Clang could drop the argument assignment. |
| `969f028bf2c4` | 6.16-rc7 | `force_sig_fault()` took a sleeping lock with interrupts disabled under RT. Reproducible with `asm("ebreak")` or `asm("unimp")`. RT enablement (v6.12) shipped this latent bug for about four releases. Fixes `f0bddf50586d`. |
| `ad6dcfa02376` | 7.2 | Under LTO the compiler removed `__vdso_clock_getres`, `__vdso_clock_gettime`, `__vdso_getrandom`, `__vdso_gettimeofday` and `__vdso_riscv_hwprobe`. LTO is now disabled for the vDSO. |
| `4d0697f19297` | 7.3 | Shadow-call-stack `tp` trust bug (Section 6). Marked for stable. |
| `76555252981e` | 7.3-rc1 | Zacas and Zabha no longer added to `-march` globally. |
| `405290be962b` | Not checked | Untag the user pointer before the atomic access in futex. |
| `3ec4350d4efb`, `80f6e72b21aa` | 6.12-rc5; not checked | Raw locks for IMSIC KVM state under RT. |

**Correctness bugs highlighted.** The unbounded LR/SC futex loop, the T-Head store-merge livelock and the shadow-call-stack `tp` bug are correctness or security issues. The qspinlock jump-label deadlock and the RT sleeping-lock issues were the correctness bugs found after the RT and qspinlock enablement.

**Generic CVEs not verified for riscv relevance:** the sched_ext CVEs CVE-2025-68202 and CVE-2025-21657, and CVE-2026-89521 (`pick_task()` releasing the rq lock). A Will Deacon [2021 reply](https://lore.kernel.org/all/20210415092212.GA26151@willie-the-truck/) warned that ticket spinlocks had forward-progress trouble on arm64 big.LITTLE. That is background, not a riscv bug.

**Benchmarks (all author-reported, none reproduced).**
- **qspinlock vs ticket on SOPHGO SG2042 (64 cores), [Guo Ren V11 cover letter, November 2023](https://lists.infradead.org/pipermail/linux-riscv/2023-November/043379.html).** This is the pre-merge series. The merged v6 cover letter ([lkml](https://lkml.iu.edu/hypermail/linux/kernel/2411.0/02159.html)) has no numbers, and the merged version differs, since it adds COMBO_SPINLOCKS and requires Zabha and Ziccrse. The kernel baseline and sysbench units are not given.

| Test | queued | ticket | Stated gain |
|---|---|---|---|
| sysbench threads=32 yields=100 lock=8 | 0.5109 | 0.5814 | +13.8% |
| perf futex/hash (ops/sec) | 1444393 | 1353215 | +6.7% |
| perf futex/wake-parallel (1/64 threads) | 0.0253 ms | 0.0275 ms | +8.6% |
| perf futex/requeue (64 of 64 threads) | 0.0785 ms | 0.0818 ms | +4.2% |
| UnixBench index score | 12426.1 | 11670.7 | +6.4% overall |
| Pipe Throughput | 18535.9 | 16554.7 | |
| Pipe-based Context Switching | 7089.0 | 6427.8 | |
| Process Creation | 995.0 | 857.0 | |
| File Copy 1024 | 19601.8 | 16550.0 | |
| System Call Overhead | 22205.5 | 20511.2 | |
| Execl Throughput | 3050.4 | 2936.1 | |

  Shell Scripts (1 concurrent) was marginally better with ticket locks (13497.1 vs 13456.9). A second summary via [LWN 956175](https://lwn.net/Articles/956175) confirms the same direction, and says the patches were also tested on TH1520 and on Fedora, Ubuntu and openEuler. That summary is partial.
- **vDSO getrandom ([Xi Ruoyao, April 2025](https://lists.infradead.org/pipermail/linux-riscv/2025-April/068949.html)).** The same numbers are in the `ee0d03053e70` commit message. Hardware is not stated.

| Test | vDSO | libc | syscall |
|---|---|---|---|
| 25,000,000 calls | 2.466 s | 41.448 s | 41.044 s |
| "25,000,000 x 256" (multiplier unexplained) | 162.286 s | 2953.855 s | 2796.269 s |

  My arithmetic puts the vDSO path at about 17-18x faster. The v1 posting (February 2025) gave 2.560 s for the vDSO and 40.961 s for libc. [NEEDS VERIFICATION]
- **Not found:** RISC-V figures for Zawrs, Zacas or Zabha; riscv64 clock_gettime or gettimeofday timings; schbench, hackbench, will-it-scale or lock_torture results; KernelCI or LKFT performance data. The RISE Confluence page "LK_01_019 - Zawrs support" returned empty. No RISE blog post covers this subsystem. No riscv64 versus arm64 comparison was found for 2024-2026.

## 12. Objections and Upstream Blockers

**Stated objections.** No explicit objection to riscv scheduler or locking work was found. The lore.kernel.org mailing-list threads could not be read (lore.kernel.org was not accessible), so review discussion is not verified. [NEEDS VERIFICATION]

**Technical blockers.**
- Queued spinlocks depend on a hardware forward-progress guarantee. The Kconfig help text requires CAS with Zabha, or LR/SC with Ziccrse, which is why `RISCV_QUEUED_SPINLOCKS` is gated by `NONPORTABLE` and combo is the default.
- Extension discovery runs too late in boot to use alternatives, so a static key is used (`qspinlock_key` TODO).
- Unbounded LR/SC loops (futex) are an open correctness issue.
- A T-Head C910 erratum needs a `WRITE_ONCE` workaround that would affect all kernel stores on those cores.
- Zalasr is not yet applied to acquire/release.
- SCHED_CLUSTER, SCHED_SMT and HAVE_PREEMPT_DYNAMIC were not seen in the arch Kconfig. [NEEDS VERIFICATION]
- Guo Ren's older CNA and paravirt qspinlock work in the [c-sky mirror](https://isrc.iscas.ac.cn/gitlab/mirrors/github.com/c-sky_csky-linux/) shows no mainline merge. [NEEDS VERIFICATION]

**Organizational blockers.**
- The patch policy only admits ratified or frozen extensions, and favors well-tested code. Failing patchwork checks make a patch unlikely to be applied.
- Review bandwidth appears to be the limit: the Bueso futex v2 (May 2026) and the T-Head v5 (April 2026) were not seen merged by 2026-11-03, and the Zalasr work went from v4 (2025-10-20) to v5 (October 2026), with only the instruction, hwprobe and KVM parts merged. Why they are unmerged is unknown.
- Earlier work by one contributor (Guo Ren) was largely re-based into a series by another (Ghiti) before merging. That is the pattern seen with qspinlock.

**Acceptance probability.** Data not available. Not estimable from the findings.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification.** The riscv64 scheduler, locking, atomics and vDSO code is in mainline and supported ([RISC-V ARCHITECTURE entry in MAINTAINERS](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/MAINTAINERS), status Supported). The tree has no CI config of any kind, and the riscv selftests (abi, hwprobe, mm, sigreturn, vector, cfi) do not test scheduling or locking. The only riscv64 test execution found is KernelCI qemu LTP runs (ltp-ipc, ltp-timers, fcntl-locktests) on CIP trees, seen only as search snippets ([example report](https://lists-ec2.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/2N2GXQONP467SDG2273INU3RM6WLS5ND)). I found no riscv64 coverage of futex, rseq, vDSO or sched in KernelCI, LKFT or 0-day, so I did not credit blue. The patchwork CI checks described in patch-acceptance.rst are the only evidence of a build gate. I could not read their job definitions, so the build-only reading is an inference. Binaries come from distro kernel packages. Upstream ships source only, so the provider is a distro. I did not check Ubuntu 26.04 or the distros' packaging patches, because the package site was not accessible and no new research was allowed.

**Pending work that could change the grade.** The grade could rise to blue if mainline KernelCI or patchwork CI is confirmed to run riscv64 tests that cover futex, rseq, vDSO or locking. Unmerged work:
- Zalasr for smp_load_acquire/smp_store_release: v5 (Qingwei Hu, ByteDance, October 2026). Only the instruction definitions, hwprobe and KVM parts are merged.
- Bounded LR/SC retries in riscv futex cmpxchg: v2 (Davidlohr Bueso, May 2026). It fixes an unbounded retry loop reachable from unprivileged PI futex operations. Not seen merged.
- ERRATA_THEAD_WRITE_ONCE: v5 (Guo Ren, April 2026). It works around a T-Head C910 store-merge livelock found in qspinlock torture testing. Not seen merged.
- Kernel-mode vector under PREEMPT_RT (Andy Chiu, August 2026): status unknown.

No RISE involvement was found for this subsystem. The lore.kernel.org check was blocked. The Ubuntu 26.04 riscv64 kernel check and the package-graph query were not run.

## 14. Investment Analysis

**RISE check first.** Searching riseproject.dev, the RSS feed (entries from 2026-07-07 to 2026-10-30), the riseproject-dev GitHub org (10 of 70 repos visible) and the RISE decks found no RISE-funded or RISE-run work on scheduler, locking, atomics, futex or vDSO. The only kernel-adjacent RISE items are the build farm CI listing, the LAVA boards (RP012) and general RVA23 kernel talks. Coverage is partial. The blog list did not render, the lore check was blocked, and the Kernel and Virtualization WG wiki was unreadable. So no sizing below is netted against RISE work, and the RISE overlap should be confirmed with the RISE kernel working group before committing resources. The effort figures are the author's estimates for planning, not figures from the research.

### 14.1 Functional Enablement
- Drive review and testing of the bounded LR/SC futex patch (v2) to merge. It closes a reachable unprivileged denial-of-service path.
- Help land Zalasr use in `smp_load_acquire` and `smp_store_release` (v5), with benchmarking on RVA23-class hardware.
- Resolve the T-Head ERRATA_THEAD_WRITE_ONCE question, if the company ships or supports C910-class silicon.
- Audit the open questions: SCHED_CLUSTER and SCHED_SMT, HAVE_PREEMPT_DYNAMIC, asymmetric CPU capacity wiring, and sched_ext arch hooks.
- Confirm RT status of kernel-mode vector.

### 14.2 Performance Optimization
- No riscv64 numbers were found for Zawrs, Zacas, Zabha, schbench, hackbench, will-it-scale or lock_torture. Producing a baseline on current hardware is the first deliverable.
- Compare combo, queued and ticket spinlocks on modern silicon. The only data are pre-merge SG2042 numbers from 2023.
- Measure Zalasr against fence-based acquire/release once the series is mergeable.
- Check vector use in `vgetrandom-chacha.S`.

### 14.3 CI/CD Infrastructure
- Run the generic futex, rseq, vDSO, membarrier and locking selftests on riscv64 in KernelCI, LKFT or RISE runners, and report results regularly. This is the evidence that would move the grade to blue.
- Add a riscv rcutorture QEMU configuration and an lock-torture job.
- Confirm what the patchwork CI checks do for linux-riscv.

### 14.4 Ecosystem Enablement
Not applicable. The subsystem has no dependent package ecosystem (Section 10 omitted). Downstream consumers are glibc and the distro kernels (Section 8). Distro enablement checks (sched_ext, queued spinlocks, PREEMPT_RT configs) are under Functional.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review, test and shepherd bounded LR/SC futex v2 to merge | 2 | Kernel team, with Davidlohr Bueso | High |
| Functional | Zalasr acquire/release: review, test, benchmark v5 | 4 | Kernel team, with ByteDance authors | Medium |
| Functional | T-Head WRITE_ONCE erratum: assess impact on supported silicon | 2 | Kernel team, with Guo Ren | Medium |
| Functional | Audit SCHED_CLUSTER/SMT, PREEMPT_DYNAMIC, capacity and sched_ext hooks | 3 | Kernel team | Medium |
| Functional | Verify distro kernel configs on riscv64 (Debian, Ubuntu, Fedora, openSUSE, Arch) | 2 | Distro liaison | Medium |
| Performance | Baseline benchmarks (schbench, hackbench, will-it-scale, lock_torture, vDSO) on current riscv64 hardware | 6 | Performance team | High |
| CI/CD | riscv64 kselftest (futex, rseq, vDSO, membarrier, locking) in KernelCI/LKFT/RISE runners | 8 | Kernel CI team | Critical |
| CI/CD | riscv rcutorture QEMU config and lock-torture job | 4 | Kernel CI team | High |
| CI/CD | Confirm patchwork CI job definitions for linux-riscv | 1 | Kernel team | Medium |
| Ecosystem | Not applicable | 0 | None | Low |

## 15. References

- [Linux kernel mainline repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [MAINTAINERS (RISC-V ARCHITECTURE entry)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/MAINTAINERS)
- [docs.kernel.org scheduler index](https://docs.kernel.org/scheduler/index.html)
- [RISC-V patch acceptance guidelines](https://docs.kernel.org/arch/riscv/patch-acceptance.html)
- [Patchwork linux-riscv queue](https://patchwork.kernel.org/project/linux-riscv/list/)
- [Guo Ren ticket spinlock series v6 (March 2021)](https://lists.infradead.org/pipermail/linux-riscv/2021-March/005576.html)
- [Zawrs RFC (Christoph Müllner, June 2022)](https://patchew.org/linux/20220602141032.169907-1-christoph.muellner@vrull.io/)
- [PREEMPT_RT v2 series (Jisheng Zhang, August 2022)](https://patchew.org/linux/20220831175920.2806-1-jszhang@kernel.org/)
- [LWN 931531](https://lwn.net/Articles/931531/)
- [Guo Ren qspinlock predecessor series (December 2023)](https://lore.kernel.org/linux-riscv/20231225125847.2778638-1-guoren@kernel.org/)
- [Guo Ren qspinlock V11 cover letter with benchmarks (November 2023)](https://lists.infradead.org/pipermail/linux-riscv/2023-November/043379.html)
- [LWN 956175, native and paravirt qspinlock](https://lwn.net/Articles/956175)
- [Zacas/Zabha/qspinlock series v3](https://lists.infradead.org/pipermail/linux-riscv/2024-July/057405.html)
- [Zacas/Zabha/qspinlock series v4](https://lists.infradead.org/pipermail/linux-riscv/2024-July/058227.html)
- [Zacas/Zabha/qspinlock series v6](https://lkml.iu.edu/hypermail/linux/kernel/2411.0/02159.html)
- [Compat vDSO lld fix](https://lore.kernel.org/all/20250423-riscv-fix-compat_vdso-lld-v2-1-b7bbbc244501@kernel.org/)
- [vDSO getrandom benchmark thread (April 2025)](https://lists.infradead.org/pipermail/linux-riscv/2025-April/068949.html)
- [Zalasr v5 series (Qingwei Hu, ByteDance)](https://patchew.org/linux/20261002165910.3818940-1-qingwei.hu@bytedance.com/)
- [Zalasr v4 series (Xu Lu)](https://patchew.org/linux/20251020042056.30283-1-luxu.kernel@bytedance.com/)
- [Zalasr thread view](https://ratatoskr.run/linux-riscv/2025/10/3257762/t)
- [Bounded LR/SC retry in riscv futex cmpxchg, v2](https://lists.infradead.org/pipermail/linux-riscv/2026-May/090709.html)
- [ERRATA_THEAD_WRITE_ONCE v5](https://patchew.org/linux/20260421143154.1590156-1-guoren@kernel.org/)
- [Kernel-mode vector under RT (Andy Chiu)](https://ratatoskr.run/linux-rt-devel/2026/08/17360219)
- [c-sky Linux mirror (ticket, CNA and paravirt qspinlock work)](https://isrc.iscas.ac.cn/gitlab/mirrors/github.com/c-sky_csky-linux/)
- [CVE-2024-57939 (Debian security tracker)](https://security-tracker.debian.org/tracker/CVE-2024-57939)
- [syzbot: corrupted stack end detected inside scheduler](https://groups.google.com/g/syzkaller-upstream-moderation/c/PkAFdhGiE7E/m/juPnE1SpDAAJ)
- [syzbot: possible circular locking dependency (doubtful match)](https://groups.google.com/g/syzkaller-bugs/c/WbWLT0nipws/m/aOgcYgNwAwAJ)
- [Will Deacon on ticket spinlocks, 2021](https://lore.kernel.org/all/20210415092212.GA26151@willie-the-truck/)
- [gnulib test-pthread-rwlock report](https://mail-archive.com/bug-gnulib@gnu.org/msg49781.html)
- [KernelCI qemu riscv64 fcntl-locktests report](https://lists-ec2.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/2N2GXQONP467SDG2273INU3RM6WLS5ND)
- [KernelCI qemu riscv64 ltp-timers report](https://lists.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/7ASRBPRMGIYEQR4Z2EY7AZNJKYKYARVM)
- [KernelCI qemu riscv64 ltp-ipc report](https://lists.linaro.org/archives/list/kernel-build-reports@lists.linaro.org/thread/MZCXFAFOBKS3BGLKSTRCGHXXI6D4ZQLX)
- [openSUSE build request mentioning sched_ext tooling for riscv64](https://build-test-1.opensuse.org/request/show/1227554)
- [Downstream PR: enable sched-ext on riscv64](https://github.com/cordanaLLM/nucleus/pull/162)
- [RISE Project](https://riseproject.dev/)
- [RISE wheel builder index (linux-scheduler-and-locking)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/linux-scheduler-and-locking/)
- [RISE blog: Bringing the Conda Ecosystem to RISC-V](https://riseproject.dev/2026/10/30/bringing-the-conda-ecosystem-to-risc-v/)
- [RISE blog: Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE blog: Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE blog: Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE blog: PyTorch is available on riscv64](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE blog: RISE Working Groups move their project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE members page](https://riseproject.dev/members/)
- [RISE Introduction deck (image-only, not read)](https://riseproject.dev/wp-content/uploads/sites/25/2026/01/RISE-Introduction.pdf)