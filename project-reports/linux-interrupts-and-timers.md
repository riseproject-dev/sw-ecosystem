---
title: Linux interrupts and timers
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
  - name: dtc
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="linux-interrupts-and-timers" %}

# Linux interrupts and timers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux interrupts and timers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

Evidence basis: a shared read-only kernel clone at HEAD 05441d697f7f (`v7.4-rc1-132-g05441d697f7f`, committed 2026-11-03) and mirror sites for mailing-list threads. Commits were verified in the clone. Commit links follow the git.kernel.org pattern. All mailing-list statuses are [NEEDS VERIFICATION] against lore.kernel.org, which was not accessible.

## 1. Project Overview

This report covers the Linux kernel interrupt and timer subsystem on riscv64. That is the RISC-V interrupt controllers, the timer drivers and the arch glue between them. It is a kernel subsystem, not a standalone package.

**Interrupt controller drivers (`drivers/irqchip`):**
- `irq-riscv-intc.c`: per-hart local interrupt controller. It switches to a 64-IRQ AIA handler when `SxAIA` is present and has an Andes custom local interrupt range.
- `irq-sifive-plic.c`: the PLIC, with quirk handling for edge-triggered Andes and T-Head parts and an UltraRISC CP100 claim-register erratum.
- `irq-riscv-aplic-main.c`, `-direct.c`, `-msi.c`: the AIA APLIC (wired interrupts).
- `irq-riscv-imsic-early.c`, `-platform.c`, `-state.c`: the AIA IMSIC (per-hart MSI controller).
- `irq-aclint-sswi.c`: ACLINT SSWI software-interrupt (IPI) controller.
- `irq-riscv-rpmi-sysmsi.c` and `irq-sg2042-msi.c`: RPMI system MSI and SG2042 MSI.

**Timer drivers (`drivers/clocksource`):** `timer-riscv.c` is the per-hart clockevent and clocksource. It uses the `time` CSR and the Sstc `stimecmp` CSR. `timer-clint.c` is the MMIO CLINT timer, mainly for NoMMU and M-mode.

**Arch glue (`arch/riscv`):**
- `kernel/irq.c`, `smp.c`, `smpboot.c`, `time.c`, `sbi-ipi.c`.
- Headers `irq.h`, `irq_stack.h`, `irq_work.h`, `irqflags.h`, `smp.h`, `timex.h`, `clocksource.h`, `clint.h`.
- The vDSO time path: `vdso/gettimeofday.h` and `vgettimeofday.c`.

**Governance.** There is no subsystem-specific foundation. The kernel is developed by the community, and the Linux Foundation hosts the infrastructure. Patches go through mailing lists and git.kernel.org. Core IRQ, irqchip and clocksource code goes through Thomas Gleixner's tip tree (branches `irq/core` and `timers/core`). The kernel is GPL-2.0; the SPDX header was confirmed on `timer-riscv.c` only, and the irqchip files were not individually checked.

**Maintainers (MAINTAINERS at HEAD):**

| Entry | Maintainers | Company |
|---|---|---|
| RISC-V AIA DRIVERS (APLIC, IMSIC, riscv-intc), status Maintained | Anup Patel | Ventana Micro (commit address; MAINTAINERS uses a personal address) |
| IRQCHIP DRIVERS and IRQ SUBSYSTEM | Thomas Gleixner (reviewer Radu Rendec) | Linutronix |
| CLOCKSOURCE, CLOCKEVENT DRIVERS (includes `timer-riscv.c`, `timer-clint.c`) | Daniel Lezcano, Thomas Gleixner | Linaro (2018 commit address), Linutronix |
| HIGH-RESOLUTION TIMERS, TIMER WHEEL, CLOCKEVENTS | Anna-Maria Behnsen, Frederic Weisbecker, Thomas Gleixner | Linutronix and kernel.org addresses |
| TIMEKEEPING, CLOCKSOURCE CORE | John Stultz, Thomas Gleixner | Google, Linutronix |
| RISC-V ARCHITECTURE | Paul Walmsley, Palmer Dabbelt, Albert Ou (reviewer Alexandre Ghiti) | Palmer and Alexandre use rivosinc.com in recent commits |
| RISC-V RPMI AND MPXY DRIVERS (includes `irq-riscv-rpmi-sysmsi.c`) | Rahul Pathak, Anup Patel | Entry body not read [NEEDS VERIFICATION] |

The PLIC driver has no dedicated MAINTAINERS entry and falls under IRQCHIP DRIVERS. The SIFIVE DRIVERS entry lists only sf-pdma.

**Corporate sponsors.** Commit counts since 2024-01-01 across the IMSIC, APLIC, intc, PLIC and timer-riscv files:

| Contributor | Commits | Affiliation |
|---|---|---|
| Anup Patel | 21 | Ventana |
| Linus Torvalds | 18 | likely tree-wide cleanups [NEEDS VERIFICATION] |
| Sunil V L | 7 | Ventana |
| Samuel Holland | 5 | SiFive |
| Nam Cao | 4 | Linutronix |
| Nick Hu | 4 | SiFive |
| Charles Mirabile | 3 | Red Hat |
| Jessica Liu | 3 | ZTE |
| Others | 1-2 each | Andrew Jones (Ventana), Marc Zyngier, Palmer Dabbelt (Rivos), Thomas Gleixner, Yu Chien Peter Lin (Andes), Alexandre Ghiti (Rivos) |

Since 2023, across all the files in scope, the top committers are Anup Patel (30), Sunil V L (12), Vladimir Kondratiev of Mobileye (8), Samuel Holland (7), Nick Hu (5), GUO Ren of XuanTie (4) and Nam Cao (4).

RISE is a Linux Foundation project with a "Kernel & Virtualization" working group, but its site does not mention interrupts, timers or AIA. No RISE funding for this subsystem was found (see Section 14).

**Community culture on new drivers.** There is no "new port" question, because the port has been mainline since 4.15. New RISC-V irqchip drivers go through the tip tree and linux-riscv, and Anup Patel and the arch maintainers review them. Section 12 gives an example of a rejected approach.

## 2. Port History and Upstreaming Timeline

The RISC-V interrupt and timer support is fully upstream. All drivers listed are in mainline and ship in every upstream release. First-tag data is from `git tag --contains` in the clone.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | RISC-V port begins: "RISC-V: Init and Halt Code" (Palmer Dabbelt); also starts `arch/riscv/kernel/irq.c`. First tag v4.15. | `76d2a0493a17` in clone |
| 2018-07-26 (committed 2018-08-13) | SiFive PLIC driver (Christoph Hellwig). First tag v4.19. | [8237f8bc4f6e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8237f8bc4f6e) |
| 2018-10-02 | Earliest commit in `timer-riscv.c` history is `b2f8cfa7ac34` (Palmer Dabbelt), a rename of `riscv_of_processor_hart`; the driver's first real commit is probably earlier [NEEDS VERIFICATION] | clone |
| 2018-12-09 (committed 2018-12-18) | Rename `riscv_timer` to `timer-riscv` (Daniel Lezcano). First tag v5.0. | [3d42b32b1d6b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3d42b32b1d6b) |
| 2019-02-13 | Init checks in `timer-riscv.c` (Atish Patra, WDC) | `26478b2f6a06` in clone |
| 2020-06-01 (committed 2020-06-09) | riscv-intc per-HART local interrupt controller (Anup Patel, WDC). v5.8. Same-day commit `033a65de7ece` makes the timer interrupt per-CPU. | [6b7ce8927b5a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6b7ce8927b5a) |
| 2020-08-17 (committed 2020-08-20) | CLINT timer driver (Anup Patel). v5.9. | [2ac6795fcc08](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2ac6795fcc08) |
| 2022-07-22 / 2022-08-11 | Sstc: "Prefer sstc extension if available" and "Add Sstc extension support" (Atish Patra, applied by Palmer Dabbelt from v7 of the series). v6.0. | [7ab52f75a9cf](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7ab52f75a9cf), `9f7a8ff6391f`, [series thread](https://lists.infradead.org/pipermail/linux-riscv/2022-August/018016.html) |
| 2022-12-27 | Clocksource rating raised for the `time` CSR (Samuel Holland). v6.3. | `674402b0098b` in clone |
| 2023-01-10 | KVM AIA `aia.c` lands (v6.4-rc1); IPI mux via `GENERIC_IRQ_IPI_MUX` (`832f15f42646`, v6.4-rc1); AIA CSR detection from ISA string (`8fe6f7e14c7e`, v6.4). KVM design belongs to Linux KVM. | clone |
| 2023-05 | ACPI support for timer-riscv (Sunil V L); release tag [NEEDS VERIFICATION] | arch-code research |
| v6.7-rc1 | Sstc clockevent rating raised (Anup Patel) | arch-code research |
| 2024-03-07 (committed 2024-03-25) | AIA: APLIC direct mode, IMSIC early driver, IMSIC device MSI domain, APLIC MSI mode (Anup Patel, Ventana), the final v16 of "Linux RISC-V AIA Support". v6.10. | [2333df5ae51e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2333df5ae51e), [21a8f8a0eb35](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=21a8f8a0eb35), [027e125acdba](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=027e125acdba), [ca8df97fe679](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ca8df97fe679), [cover letter](https://lore.kernel.org/lkml/20240307140307.646078-9-apatel@ventanamicro.com/T/) |
| v6.12-rc1 | `drivers/acpi/riscv/irq.c` reorders irqchip probe (Sunil V L) | arch-code research |
| 2024-10-31 (committed 2024-11-07) | T-HEAD C900 ACLINT SSWI driver (Inochi Amaoto). v6.13. | [25caea955cc9](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=25caea955cc9) |
| 2025-02-26 | `irq-sg2042-msi.c` (Chen Wang), v6.15-rc1 | arch-code research |
| 2025-02-19 (committed 2025-03-18) | stimecmp save/restore across suspend (Nick Hu, SiFive), merged via a5edc510da31. v6.15. | [ffef54ad4110](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ffef54ad4110) |
| 2025-06-12 | ACLINT-SSWI generalized, adds MIPS P8700 (`df0f030ee7e4`, Vladimir Kondratiev, Mobileye). v6.17. | clone |
| 2025-08-18 | `irq-riscv-rpmi-sysmsi.c` (Anup Patel), v6.18-rc1 | arch-code research |
| 2026-01-04 (committed 2026-01-14) | RV32 stimecmp and vstimecmp write-hazard fixes (Naohiko Shimizu). v6.19. | [eaa9bb1d39d5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=eaa9bb1d39d5), [75870639bf5d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=75870639bf5d) |
| 2026-02-12 | PLIC affinity-change interrupt freeze fix (Nam Cao). v7.0. | `1072020685f4` in clone |
| 2026-10-22 | Andrew Jones IMSIC MSI address list series v7 posted, open | [cover](https://ratatoskr.run/linux-riscv/2026/10/17788564) |

**Key contributors:** Anup Patel (Ventana, formerly WDC), Sunil V L (Ventana), Atish Patra (WDC, then Rivos), Palmer Dabbelt, Christoph Hellwig, Daniel Lezcano, Nick Hu and Samuel Holland (SiFive), Vladimir Kondratiev (Mobileye), Nam Cao (Linutronix), Inochi Amaoto, GUO Ren (XuanTie), Andrew Jones (Ventana).

## 3. Upstream Support Tier

**Formal policy.** The kernel has no Tier 1/2/3 policy. RISC-V acceptance rules are in `Documentation/arch/riscv/patch-acceptance.rst`, which the RISC-V MAINTAINERS entry lists as its process document. That entry has status "Supported", while the IRQ, irqchip and AIA entries are "Maintained". The current text of the patch-acceptance document was not read. A search result for the v5.7-era text says the flexibility of draft RISC-V specifications makes Linux maintenance hard, and an unverified recollection is that it requires specs to reach a stable or ratified state before extension support is accepted [NEEDS VERIFICATION].

**Evidence:**
- **Release-blocking status:** the tree has no CI configuration (no `.github`, `.gitlab-ci*`, Jenkinsfile, `.travis`, `.cirrus`, `.kernelci`) and MAINTAINERS has no KernelCI, LKFT, syzbot or 0-day entries.
- **Official binaries:** none specific to this subsystem. It ships in the kernel.
- **Subsystem CI:** none (see Section 7).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal tier | No tier policy in kernel | No tier policy in kernel | No tier policy in kernel; arch entry "Supported" |
| Subsystem-specific CI | Data not available: not researched | Data not available: not researched | None found |
| Mainline driver coverage | Data not available: not researched | Data not available: not researched | PLIC, intc, APLIC, IMSIC, ACLINT SSWI, timer-riscv, timer-clint all in mainline |

amd64 and arm64 comparison data was not collected in this research round.

## 4. Technical Architecture and RISC-V-Specific Subsystems

There is no JIT, SIMD dispatch, crypto or GC barrier code in this subsystem. The architecture-specific components are interrupt entry, controllers and timers.

| Component | riscv64 state | ISA extensions | Quality |
|---|---|---|---|
| Exception entry | `arch/riscv/kernel/entry.S` `handle_exception` calls `do_irq` (line 226); `ret_from_exception`; `call_on_irq_stack` runs handlers on a per-CPU stack under `CONFIG_IRQ_STACKS` | base | Hand-written assembly, the only interrupt/timer-specific `.S` file in `arch/riscv` |
| Local controller (riscv-intc) | 395 lines. Legacy 16-IRQ path, AIA 64-IRQ handler when `SxAIA` is present, Andes custom range | Smaia (M-mode builds), Ssaia | C driver |
| PLIC | 822 lines. Compatibles `sifive,plic-1.0.0`, `riscv,plic0`, `andestech,nceplic100`, `thead,c900-plic`, `ultrarisc,cp100-plic`, `allwinner,sun20i-d1-plic` | none | C driver with vendor quirks |
| APLIC | 415 + 343 + 285 lines (main, direct, msi). Direct mode and MSI mode | Smaia/Ssaia | C driver |
| IMSIC | 308 + 390 + 977 lines (early, platform, state) | Smaia/Ssaia | C driver |
| ACLINT SSWI | 212 lines. Compatibles `thead,c900-aclint-sswi`, `mips,p8700-aclint-sswi`, `nuclei,ux900-aclint-sswi`, `spacemit,k3-aclint-sswi` | none | C driver |
| IPI plumbing | `GENERIC_IRQ_IPI` and `GENERIC_IRQ_IPI_MUX`; IPIs run as normal Linux IRQs | none | Generic infrastructure |
| Timer (timer-riscv) | 250 lines. `time` CSR clocksource; clockevent via SBI TIME or Sstc `stimecmp` (no SBI call) | Sstc (hwcap 27) | C driver |
| Timer (timer-clint) | 277 lines. `riscv,clint0` and `sifive,clint0`; `RISCV_TIMER` and `CLINT_TIMER` are bool, and `CLINT_TIMER` is only visible under COMPILE_TEST | none | C driver, NoMMU/M-mode |
| vDSO time | `rdtime` with `ecall` fallback, in C | base | C |
| KVM interrupt/timer | `aia.c` (763), `aia_aplic.c` (637), `aia_device.c` (656), `aia_imsic.c` (1097), `vcpu_timer.c` (382). Design belongs to Linux KVM. | H, Ssaia | Cross-reference only |

**Related details:**
- `hwcap.h` defines SSTC (27), SMAIA (35) and SSAIA (36). `SxAIA` aliases SMAIA in M-mode builds and SSAIA otherwise.
- `NR_CPUS` goes up to 512 on RV64 and 128 on RV32 without `RISCV_SBI_V01`. With `RISCV_SBI_V01` the limit is 64 on RV64 and 32 on RV32.
- `arch/riscv/net/bpf_timed_may_goto.S` is a BPF JIT trampoline only marginally related to timers.
- Devicetree bindings exist for the PLIC, Andes `plicsw`, APLIC, IMSIC, `cpu-intc`, the T-Head C900 ACLINT variants and `riscv,timer`. The T-Head C900 ACLINT mtimer has a binding, but whether `timer-clint.c` has a matching driver was not checked [NEEDS VERIFICATION].

**Comparison with amd64 and arm64.** Data not available: this research did not examine the amd64 or arm64 interrupt and timer implementations. One cross-arch data point: no NMI or pseudo-NMI commit was found in `arch/riscv` (a case-insensitive `--grep=nmi` returned only unrelated merges). The brief's comparison with arm64 pseudo-NMI is therefore [NEEDS VERIFICATION].

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild and Kconfig. There is no cmake or `./configure`, so `-DUSE_X=OFF` flags do not apply. No Dockerfile was found, but that search was interrupted, so "none in tree" is [NEEDS VERIFICATION].

**GNU cross toolchain:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image dtbs modules
```

**LLVM toolchain.** `llvm.rst` lists riscv as "Supported", and `CROSS_COMPILE` is unnecessary with LLVM only:
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image dtbs modules
```
Use `LLVM=-18` for a version suffix. `LLVM_IAS=0` turns the integrated assembler off and requires `CROSS_COMPILE`.

**Configs and images:**
- `arch/riscv/configs/` has `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig` and `nommu_virt_defconfig`.
- The default boot image is `arch/riscv/boot/Image`. Other targets are `Image.gz` and the other compressed variants, `loader` and `vmlinuz.efi`.
- Flags are `-mabi=lp64` and a base `-march=rv64ima`, with `fd`, `c` and `v` added by Kconfig. `_zicsr_zifencei` is appended when `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` is set.

**Toolchain minimums** (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| Clang/LLVM | 17.0.1 |
| binutils | 2.30 |
| GNU make | 4.0 |
| bash | 4.2 |
| Python | 3.9.x |
| pahole | 1.26 |
| rustc / bindgen (optional) | 1.85.0 / 0.71.1 |

**RISC-V-specific toolchain conditions** in `arch/riscv/Kconfig` (the reasons for the version gates):
- **Zicsr/Zifencei:** binutils 2.38 and GCC 12.1 changed the default ISA spec to 20191213, which moved CSR and `fence.i` out of base I. With binutils 2.36 or newer, `_zicsr_zifencei` is added to `-march`. GCC older than 11.3.0 cannot take zicsr/zifencei via `-march`, so `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` passes an older ISA spec to the assembler.
- **Vector (`RISCV_ISA_V`, default y):** needs `-march=rv64imv`, the assembler `.option arch`, and LLD or binutils 2.38 or newer. Otherwise it silently turns off.
- **Zbb, Zba, Zbc, Zbkb:** need compiler support; without LLD they need binutils 2.39 or newer.
- **Dynamic ftrace:** with Clang and the LLVM assembler it needs LLD or binutils 2.36 or newer. With GCC it needs `-fpatchable-function-entry=8`.
- **Broken DWARF5:** `ARCH_HAS_BROKEN_DWARF5` is set when the LLVM assembler and LLD are both older than version 18.
- **Shadow call stack:** needs linker support for `--no-relax-gp`.

**Interrupt and timer Kconfig symbols:**
- `RISCV_INTC`, `RISCV_APLIC`, `RISCV_APLIC_MSI`, `RISCV_IMSIC` and `SIFIVE_PLIC` are hidden bool symbols selected by platform or driver code. `RISCV_APLIC_MSI` defaults to `RISCV_APLIC`.
- `RISCV_RPMI_SYSMSI` is hidden, depends on `RISCV && MAILBOX` and defaults to `RISCV`.
- `ACLINT_SSWI` is user-visible and depends on `RISCV && SMP`. `THEAD_C900_ACLINT_SSWI` is a compatibility alias, set to y in `defconfig`.
- `RISCV_TIMER` depends on `GENERIC_SCHED_CLOCK && RISCV && RISCV_SBI`. The arch Kconfig selects `RISCV_TIMER` and `RISCV_IMSIC`.
- `defconfig` sets `NO_HZ_IDLE=y`, `HIGH_RES_TIMERS=y` and `SMP=y`.

**QEMU usage [NEEDS VERIFICATION]**, from general knowledge and not from the kernel tree:
```
qemu-system-riscv64 -M virt -smp 4 -m 2G -nographic \
  -kernel arch/riscv/boot/Image \
  -append "console=ttyS0 root=/dev/vda rw earlycon" \
  -drive file=rootfs.img,format=raw,if=virtio
```
- AIA is `-M virt,aia=aplic-imsic`, and `aia-guests=N` adds guest files.
- The default `virt` interrupt controller is the PLIC with ACLINT timers.
- Sstc is a CPU property (`-cpu rv64,sstc=true`), on by default in recent QEMU.
- The tree's own KUnit runner config, `tools/testing/kunit/qemu_configs/riscv.py`, uses a `virt` machine with `-cpu rv64` and OpenSBI `fw_dynamic`. It enables no interrupt or timer options.

**Known build failures.** None specific to this subsystem were found. syzbot lists an open "riscv/for-next build error (2)", whose relation to this subsystem is unknown. Tooling note: a `git grep` on the blobless shared clone triggered an automatic repack with "Out of diskspace" errors although `df` showed 12G free. The clone's owner should check for a leftover `.git/gc.log`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix (riscv64):**

| Feature | riscv64 status |
|---|---|
| External interrupts (PLIC) | In mainline since v4.19 |
| Wired interrupts via AIA APLIC (direct and MSI mode) | In mainline since v6.10 |
| MSI via AIA IMSIC | In mainline since v6.10 |
| Software IPIs via SBI | In mainline; see Linux SBI report |
| Software IPIs via ACLINT SSWI | In mainline (T-Head C900 v6.13; MIPS P8700 v6.17); SpacemiT K3 open |
| Timer via SBI TIME | In mainline |
| Timer via Sstc `stimecmp` | In mainline since v6.0 |
| Timer MMIO CLINT | In mainline since v5.9 (NoMMU/M-mode) |
| Timer state across suspend and hotplug | stimecmp save/restore in v6.15 |
| IRQ stacks | `IRQ_STACKS` selected |
| RT support | `ARCH_SUPPORTS_RT` selected |
| IOMMU MSI remapping (needed for IOMMU_DMA on RISC-V) | Not in mainline; Andrew Jones series v7 open |
| Pseudo-NMI | None found [NEEDS VERIFICATION] |

**Functional gaps:**
- **IOMMU_DMA on 64-bit RISC-V and IMSIC MSI remapping.** Both are unavailable until the Jones series merges. IMSIC target addresses change with interrupt affinity, so all targets must be mapped in advance. VFIO and iommufd support is deferred to a follow-on series.
- **IRQ bypass for assigned devices in guests.** This is the RFC v3 series (14 patches), which is KVM-adjacent. It is open and depends on the v6 MSI-remapping, IOMMU_DMA and VFIO series and on Fangyu Yu's hardware dirty tracking RFC v4.

**Performance gaps.** Data not available: no published cyclictest, hwlatdetect, IPI latency, PLIC versus AIA/IMSIC or Sstc versus SBI timer figures were found. The only exact number is a micro-measurement on one SoC. On the Allwinner D1, reading the `sun4i` MMIO timer in a loop costs 131 cycles per iteration and reading the RISC-V `time` CSR costs 5 (commit `674402b0098b`, Samuel Holland, 2022-12-27, v6.3). That is about 26 times cheaper to read. There is no SIMD component in this subsystem, so no SIMD gap applies.

**Cross-arch performance data.** Data not available. Third-party results were found, but none is usable Linux data:
- The VOSySmonitoRV paper ([arXiv 2111.02821](https://arxiv.org/pdf/2111.02821)) measures ECALL and interrupt context-switch latency. Its numbers could not be extracted [NEEDS VERIFICATION].
- [arXiv 2604.04015](https://arxiv.org/html/2604.04015v1) covers user-level interrupts and does not use Linux. It reports a 5-cycle base interrupt latency and a 634-cycle kernel-mediated path (Table 7) against "more than 800 cycles" in its text. That is internally inconsistent, and the results come from a 50 MHz FPGA and a simulated 45 nm design.

**Security hardening gaps.** `arch/riscv/configs/hardening.config` exists. No interrupt-specific hardening gap was identified beyond the absence of pseudo-NMI (unverified). A cluster of input-validation and error-path hardening patches is in flight (Section 11).

**NaN and floating-point semantics:** not applicable to this subsystem.

## 7. CI/CD Infrastructure

**riscv64 CI specific to this subsystem: none found.** Verified in the clone:
- `drivers/irqchip/.kunitconfig` enables only `ASPEED_AST2700_INTC` and its test, with `COMPILE_TEST`. There are no RISC-V irqchip KUnit tests.
- `tools/testing/selftests/riscv/Makefile` sets `RISCV_SUBTARGETS` to `abi hwprobe mm sigreturn vector cfi`. There is no irq, timer or AIA subtarget. The README says tests run only on demand.
- `tools/testing/selftests/timers/` is arch-generic: `posix_timers`, `nanosleep`, `nsleep-lat`, `set-timer-lat`, `mqueue-lat`, `inconsistency-check`, `raw_skew`, `threadtest`, `rtcpie`, and `clocksource-switch` in the destructive list. These exercise Sstc and `timer-riscv` only indirectly, and only if someone runs kselftest on riscv64.
- `tools/testing/kunit/qemu_configs/riscv.py` and `riscv32.py` are manually invoked KUnit runner configs (`kunit.py --arch=riscv`), not CI. They enable no interrupt or timer options.
- No driver among `irq-sifive-plic.c`, `irq-riscv-intc.c`, `irq-riscv-aplic-*`, `irq-riscv-imsic-*`, `irq-aclint-sswi.c`, `irq-riscv-rpmi-sysmsi.c`, `timer-riscv.c` or `timer-clint.c` has a companion test file. The `arch/riscv/kernel/tests/` files found cover kprobes and `module_test`.
- KVM selftests `tools/testing/selftests/kvm/riscv/arch_timer.c` and `include/riscv/arch_timer.h` exist and belong to Linux KVM.

**External services:**
- **syzbot** ([upstream page](https://syzkaller.appspot.com/upstream)): about 200 KB of roughly 394 KB was read. The only riscv64 instance seen was `ci-qemu2-riscv64`, active on the riscv linux.git tree at kernel commit 6628e7d4c6b2. `ci-upstream-riscv64-kasan` did not appear in the part read. No open bug titles named plic, aplic, imsic, clint, clocksource or irqchip; one timer bug, "WARNING in __run_timer_base (3)", is tagged arm. About 194 KB is unread [NEEDS VERIFICATION].
- **KernelCI:** the dashboard was blocked by an Anubis access-denied page [NEEDS VERIFICATION].
- **LKFT:** redirected to a Linaro services page that was not fetched [NEEDS VERIFICATION].
- **RISE runners:** the RP016 work reports no runner or CI use and was tested on QEMU. The listed RISE-runner repositories include none for kernel interrupts or timers. RISE EM-RV1 runner nodes run a vendor 5.10.x kernel without virtualization ([RISE runners post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Subsystem-specific CI | Data not available: not researched | Data not available: not researched | None |
| Generic kernel CI | Data not available: not researched | Data not available: not researched | syzbot `ci-qemu2-riscv64`; KernelCI and LKFT unverified |
| Hardware | Data not available | Data not available | Not applicable: no hardware CI found |

## 8. Distribution and Release Status

- **Mainline:** the subsystem ships in every upstream kernel release. The clone at HEAD is `v7.4-rc1-132-g05441d697f7f`; the most recent tags are `v7.4-rc1`, `v7.3` and `v7.3-rc7`.
- **PyPI:** no project named `linux-interrupts-and-timers` exists ([pypi.org/pypi/linux-interrupts-and-timers/json](https://pypi.org/pypi/linux-interrupts-and-timers/json) returns 404).
- **RISE wheel builder:** no wheels exist. The wheel builder lists only user-space libraries such as uvloop and psutil.
- **Ubuntu 26.04 (resolute):** a [package search](https://packages.ubuntu.com/search?keywords=Linux%20interrupts%20and%20timers&suite=resolute&searchon=names&section=all) found no package by this name, and the subsystem ships in `linux-image-*` packages. Whether the resolute riscv64 kernel enables `RISCV_INTC`, `SIFIVE_PLIC`, `RISCV_APLIC`, `RISCV_IMSIC`, `RISCV_TIMER` and `RISCV_SBI` is [NEEDS VERIFICATION].
- **Debian, Fedora, Arch, npm, Maven, OCI:** Data not available: not searched.
- **Project graph:** `project_graph_query` was not available in this session, so Ubuntu riscv64 graph queries were not run [NEEDS VERIFICATION].

**What a user must do.** Use a riscv64 kernel from mainline or a distribution kernel, or build one (Section 5). Hidden irqchip symbols are selected by SoC or platform options, and `ACLINT_SSWI` is the user-visible one. Hardware needs firmware: the timer path depends on `RISCV_SBI`, so OpenSBI or equivalent is required.

## 9. Dependencies

The project graph query tool was unavailable, so Ubuntu 26.04 riscv64 availability for every row is not verified. Report colors come from the other project reports in this repository.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. Host tree for the irqchip and clocksource drivers. | Mainline, riscv-native | Not assessed here | Mainline and stable kernels | See Section 1 |
| OpenSBI | runtime-dependency, critical. M-mode firmware providing SBI TIME and IPI fallback; has PLIC, ACLINT, APLIC and IMSIC drivers. `RISCV_TIMER` depends on `RISCV_SBI`. | Native and sole target; report color orange | Not assessed here | `opensbi-1.9-rv-bin.tar.xz` per its report | RISE RP016 (RISCstar Solutions); see `project-reports/opensbi.md` |
| GCC | build-dependency, critical. Builds the drivers. | Report color blue | Not assessed here | Not assessed here | See `project-reports/gcc.md` |
| GNU binutils | build-dependency, critical. Assembler and linker for the GCC path. | Report color blue | Not assessed here | Not assessed here | See `project-reports/gnu-binutils.md` |
| LLVM | build-dependency, optional. Used with `LLVM=1`. | Report color yellow | Not assessed here | Not assessed here | See `project-reports/llvm.md` |
| dtc | build-dependency, critical. Compiles the device trees that describe the interrupt and timer hardware. | Not assessed here | Not assessed here | Not assessed here | No `project-reports/dtc.md` exists in the repo, although dtc is in `projects.yml` |
| QEMU (indirect) | Reference platform for AIA, PLIC, ACLINT and Sstc via the `virt` board | Report color yellow | Not assessed here | Not assessed here | See `project-reports/qemu.md` |
| U-Boot (indirect) | Optional boot firmware passing the device tree | Report color blue | Not assessed here | Not assessed here | See `project-reports/u-boot.md` |

Dependencies read from `drivers/irqchip/Kconfig` and `drivers/clocksource/Kconfig` in the clone. `RISCV_RPMI_SYSMSI` depends on `MAILBOX`. `RISCV_TIMER` depends on `GENERIC_SCHED_CLOCK`, `RISCV` and `RISCV_SBI`.

**Deep dive on critical dependencies:**
- **OpenSBI.** Two series are under review on the OpenSBI list and are not merged. The APLIC M-mode wired-interrupt abstraction is RP016-M2 (v2 posted 2026-05-04 per the author's blog). The VIRQ SBI extension is RP016-M3. Pawandeep Oza's "RISC-V AIA: APLIC and IMSIC..." series is v3 as of July 2026 ([thread](https://ratatoskr.run/opensbi/2026/07/17246701/t)). Neither affects baseline Linux boot. SpacemiT K3 and Alibaba A210 board support is downstream only.
- **QEMU.** The QEMU report lists [#1647](https://gitlab.com/qemu-project/qemu/-/issues/1647) as a hypervisor-extension timer interrupt bug (`mip` and `[V]STIP` not cleared, H-ext plus AIA), closed as Needs Info. Its current state was not re-checked [NEEDS VERIFICATION]. A QEMU AIA in-kernel irqchip save/restore series (v3 RESEND, 2026-06-02, Xuemei Liu) is also open ([thread](https://ratatoskr.run/qemu-devel/2026/06/17076179/t)).
- **Toolchain.** The version gates on binutils, GCC and LLD are in Section 5. None was found to block this subsystem.

## 11. Known Bugs and Active Issues

Kernel work is tracked on mailing lists and in git, not in issue trackers, so IDs are commit SHAs. Open bugs could not be enumerated because lore.kernel.org was not accessible and KernelCI and LKFT were not queried [NEEDS VERIFICATION]. Severity is a qualitative assessment from the described effect, not a rating from the sources.

**Correctness bugs, fixed in the clone:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| `1072020685f4` | PLIC: completion ignored when affinity changes mid-handling | Fixed, 2026-02-12, v7.0 | High | The interrupt freezes. Reproduced by dumping a large file to the UART while changing its affinity. Nam Cao. |
| `eaa9bb1d39d5`, `75870639bf5d`, `344c5281f438` | RV32: two 32-bit `stimecmp` stores can raise spurious timer interrupts | Fixed, 2026-01-04, v6.19 | Medium (RV32 only) | Uses the spec's 3-step sequence. `75870639bf5d` is the KVM `vstimecmp` side and `344c5281f438` the suspend path. Naohiko Shimizu. |
| `8248ca30ef89` | `stimecmp` has no reset value, so timer interrupt could fire during init | Fixed, authored 2024-03-07, v6.9 | Medium | Writes max value. `Cc: stable`; failed to apply to 6.1-stable per a stable-queue notice. Ley Foon Tan (StarFive). |
| `cefafbd56140` | IMSIC: stale `move_prev` after CPU hot-unplug blocks affinity changes | Fixed, 2026-05-08, v7.1 | Medium | Yong-Xuan Wang (SiFive). |
| `14473a1f8859` | riscv-intc: missing `free()` callback warns on `irq_dispose_mapping()` | Fixed, 2025-11-14, v6.18 | Low | Fixes `832f15f42646`. Nick Hu. |
| `a2f482407d33` | IMSIC: `imsic_irq_retrigger()` returned 0, causing a needless software resend | In clone, 2026-10-26, no tag yet | Low | `Cc: stable`; fixes `027e125acdba`. Avi Weiss. |
| `cb9f6a40382c`, `8caa8fcec8db`, `1358126fbed1` | IMSIC: dereference before NULL check (2025-08-02); overlapping group index fields not rejected (2026-09-20); fwnode leak on state-setup failure (2026-06-23) | Fixed; tags not checked | Low to medium | Tags not checked. |
| `b330fbfd34d7` | APLIC: register syscore operations only once | Merged 2026-03-10, v7.0 | Low | Jessica Liu (ZTE). Introduced the `ro_after_init` flag that the open Kondratiev series fixes. |
| `0f214e5bbee5`, `42e025b719c1`, `376e2f8cca28`, `620b6ded72a7`, `af416cd9b3fb` | PLIC signed shift in enable mask; PLIC hwirq count; IMSIC guest irq file count; APLIC fixes | Fixed | Not rated | Visible in the clone log since January 2026. |

**Open on linux-riscv (all [NEEDS VERIFICATION] against lore):**

| ID (thread) | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [17850272](https://ratatoskr.run/linux-riscv/2026/11/17850272) | IMSIC: synchronize remote state with IRQ work (Troy Mitchell, 2026-11-03) | Open; Anup Patel asked why the local CPU does not also use IRQ work | High where hit | Fixes `21a8f8a0eb35`. With a stopped local clockevent waiting for a broadcast interrupt, enabling that interrupt can depend on its own delivery, stalling timers and CPU hotplug. Found on SpacemiT K3 as a tick broadcast device. Sebastian Siewior: "This makes sense." A v2 is likely. |
| [17776851](https://ratatoskr.run/linux-riscv/2026/10/17776851) (v5) | APLIC: fix probing of multiple instances (Kondratiev, 2026-10-20) | Open, v5 | Medium | `aplic_syscore_registered` is `__ro_after_init` but written on deferred probe in MSI mode, which faults. Async probing races on shared state. The fix removes the annotation and forces synchronous probing. Supersedes v1-v4. |
| [17814808](https://ratatoskr.run/linux-riscv/2026/10/17814808) | riscv-intc: validate MADT RINTC entries (Jiale Yao, 2026-10-28) | Open | Low | Truncated ACPI entry not rejected. Fixes `7023b9d83f03` (not checked in the clone). |
| [17277692](https://ratatoskr.run/linux-riscv/2026/07/17277692) | APLIC: validate translated source IDs (Pengpeng Hou, 2026-07-18) | Quiet 30+ days | Low | Input validation. No replies. |
| [17517801](https://ratatoskr.run/linux-riscv/2026/09/17517801) | irqchip: harden initialization error paths (Nam Cao thread, 2026-09-05) | No replies | Low | |
| [17520256](https://ratatoskr.run/linux-riscv/2026/09/17520256) | IMSIC: validate group index geometry (Pengpeng Hou, 2026-09-06) | Pending | Low | |

**Patch status from the clone.** Several patches that appeared open on mailing-list mirrors have landed:
- Avi Weiss's IMSIC retrigger fix is commit `a2f482407d33` ("irqchip/riscv-imsic: Report successful hardware retrigger", dated 2026-10-26) and is in v7.4-rc1.
- Pengpeng Hou's IMSIC group index and PLIC shift patches, Nam Cao's PLIC panic patch and Prajwal N's fwnode patch are labeled LANDED on the mirror. The clone confirms `8caa8fcec8db` and `0f214e5bbee5`.
- Junhui Liu's SpacemiT K3 support landed: `b424b3b0ab92` ("irqchip/aclint-sswi: Add support for SpacemiT K3", 2026-09-18) and its binding commit `08257b5b3d38`. It was merged through the SoC tree (`62c27ed02e29`, spacemit-dt-for-7.4-1, 2026-10-16).

**Not RISC-V-specific:** CVE-2026-31574 is a generic clockevents bug (`next_event_forced` not reset, causing timer interrupt starvation), reported to affect kernels before 7.0.1 ([vulert entry](https://vulert.com/vuln-db/clockevents--add-missing-resets-of-the-next-event-forced-flag)). It was not checked against the clone [NEEDS VERIFICATION].

**Earlier history:**
- An Anup Patel patch (2023-07) stopped toggling the timer interrupt enable bit at runtime because it desynchronized state from the IRQ core ([thread](https://lists.infradead.org/pipermail/linux-riscv/2023-July/035698.html)).
- An Allwinner D1 suspend attempt using C3STOP broke RCU stall detection and timers and was reverted.

**Performance and hardware coverage.** Data not available: no open performance bug was found, and open performance issues were not searched.

## 12. Objections and Upstream Blockers

**Stated objections:**
- **Rejected IMSIC-IOMMU approach.** Yaxing Guo (BOSC) posted v1 on 2026-02-12 to enable `IRQ_MSI_IOMMU` and call `iommu_dma_prepare_msi()` from the IMSIC driver ([thread](http://lists.infradead.org/pipermail/linux-riscv/2026-February/085474.html)). Anup Patel rejected it: "There should not be any new users of iommu_dma_prepare_msi() API." He said the IOMMU driver's interrupt remap domain is "the right approach".
- **The accepted direction is the Jones series.** It adds `iommu_dma_prepare_msi_list()`, a new list-based variant of the same API, in patch 2/5, and patches 3/5 and 4/5 carry Acked-by from Gleixner and Patel. This is a nuance, not a contradiction. Patel's objection was to per-device prepare calls from irqchip code, and Jones's design keeps the remap in the IOMMU path.
- **Design question on IRQ bypass.** On RFC v3, Jason Gunthorpe had suggested a per-VM irqdomain, and the author asks for feedback on how the IRQ hierarchy relates to the domain-owned MSI table.
- **IPI_MAX series.** The v2 series has 15 messages from 6 authors, including Radu Rendec, Daniel Lezcano and Thomas Gleixner, but the reply contents are not visible, so no review conclusion can be stated.

**Technical blockers:**
- **IOMMU_DMA and VFIO on RISC-V.** The Jones MSI-remap series depends on IOMMU-side patches 1/5, 2/5 and 5/5, which carry no maintainer ack in the trailers shown. The mirror shows "3 of 5 reviewed". The v6 VFIO and iommufd parts are deferred to a follow-on.
- **IRQ bypass chain.** The IRQ bypass RFC needs the MSI-remapping, IOMMU_DMA and VFIO v6 series and a separate dirty-tracking RFC. The mirror shows "1 of 14 reviewed".

**Organizational blockers:**
- No RISE funding for kernel interrupt or timer work (Section 14).
- No subsystem-specific riscv64 CI (Section 7).
- The RISC-V patch-acceptance policy may gate support for extensions that are not ratified [NEEDS VERIFICATION].

**Acceptance probability** (a judgment from the review state shown, not a stated figure):
- IMSIC patches 3/5 and 4/5 are likely to be accepted, with acks from the irqchip and driver maintainers.
- The IOMMU-side patches are uncertain, with no visible acks.
- The IRQ bypass RFC is early.
- The small hardening fixes are low risk.
- SoC binding series are routine but depend on review bandwidth: MIPS P8700 v2 (8 patches, "1 of 8 reviewed"), Zhihe A210, BL808, OpenHW CVA6 and Tenstorrent Atlantis.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream

**Justification.** The riscv64 interrupt and timer drivers (riscv-intc, PLIC, APLIC/IMSIC, ACLINT SSWI, timer-riscv with Sstc, timer-clint) are all in mainline and ship in every upstream release. The core RISC-V port has been mainline since 4.15 ([PLIC driver 8237f8bc4f6e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8237f8bc4f6e), [AIA APLIC 2333df5ae51e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2333df5ae51e)). There is no subsystem-specific riscv64 CI. `drivers/irqchip/.kunitconfig` has no RISC-V irqchip tests, `tools/testing/selftests/riscv/` has no irq, timer or AIA subtarget, and the arch-generic timers kselftests exercise Sstc and timer-riscv only indirectly. Only generic infrastructure applies, such as the syzbot `ci-qemu2-riscv64` instance. KernelCI and LKFT riscv64 coverage could not be verified, so the grade is yellow, with incidental build and boot coverage treated as build-only rather than blue.

**Pending work that could change the grade:**
- Andrew Jones's IMSIC MSI address list series for IOMMU MSI remapping (v7, 2026-10-22; patches 3/5 and 4/5 carry Acked-by from Thomas Gleixner and Anup Patel) and its irqbypass RFC v3 are open on linux-riscv.
- Several IMSIC, APLIC and PLIC hardening fixes are open or recently landed.
- SpacemiT K3 ACLINT SSWI support (v3) and new SoC bindings (MIPS P8700, Tenstorrent Atlantis and others) are open.
- All mailing-list statuses are [NEEDS VERIFICATION], because lore.kernel.org was not accessible.
- None of this adds subsystem-specific riscv64 CI.
- RISE funds no kernel interrupt or timer work. Its RP016 work is OpenSBI APLIC and VIRQ firmware (RISCstar Solutions) and is under review on the OpenSBI list.
- Adding KUnit or kselftest coverage for the riscv-intc, PLIC, APLIC/IMSIC and timer paths, or confirming that KernelCI or LKFT run riscv64 boots with timers kselftests, could justify blue.

## 14. Investment Analysis

**Prior RISE work checked first.** RISE has no verified funding of Linux irqchip or clocksource work. I checked all 38 post titles in the [RISE post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml) (2024-05-15 to 2026-10-30) and opened three posts. The home page and members page mention no interrupt, timer or AIA focus. The only related funded work is RP016: M-mode APLIC wired-interrupt abstraction (M2) and the VIRQ subsystem with an SBI ECALL extension (M3). It was done by RISCstar Solutions ([post](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/), [author blog](https://raymo200915.github.io/2026/03/09/APLIC-M-mode-Wired-Interrupt-Support-in-OpenSBI.html)). It is OpenSBI firmware, not Linux, and is under review. The author's blog says the work is "already merged" into RISE GitLab projects while also calling it ready for testing, so its merge status is unclear. Do not size that work here. The RISE page says the TSC targets working-group focus areas "over time", with Kernel & Virtualization among them, but the page gives no detail.

All effort figures below are my engineering estimates, not figures from the research.

### 14.1 Functional Enablement

- **Review and test the Jones MSI-remap and IRQ-bypass series on own silicon.** Provide Tested-by and review input, especially on IOMMU-side patches that lack acks. IOMMU_DMA on riscv64 depends on it.
- **Tick-broadcast and CPU-hotplug validation on own platforms.** The Troy Mitchell finding shows broadcast timers combined with IMSIC remote sync can stall. Reproduce with timerfd load plus CPU offline, and drive a v2 review.
- **SoC enablement.** Upstream bindings and any PLIC, APLIC or ACLINT quirks for the company's SoC. Existing quirk handling for Andes, T-Head and UltraRISC shows the pattern.
- **Hardening series.** Review the open IMSIC, APLIC, PLIC and intc validation patches.

### 14.2 Performance Optimization

- No published baseline exists. Build a measurement harness for Sstc versus SBI timer cost, IPI latency (SBI IPI versus ACLINT SSWI versus IMSIC IPI), PLIC versus AIA/IMSIC latency, and cyclictest/hwlatdetect on riscv64. This must come first, because the only exact number is the single-SoC clock-read micro-measurement.
- Evaluate pseudo-NMI feasibility, since none was found [NEEDS VERIFICATION].

### 14.3 CI/CD Infrastructure

- Add KUnit tests for riscv-intc, PLIC, APLIC and IMSIC, plus timer-riscv. None exist.
- Add `irq` and `timer` subtargets to `tools/testing/selftests/riscv/`, or a documented riscv64 run of the generic timers selftests.
- Confirm or establish KernelCI and LKFT riscv64 boots with AIA (`-M virt,aia=aplic-imsic`) and timers kselftests. Could not be verified here.
- Review the remainder of the syzbot upstream page and the `ci-qemu2-riscv64` instance for coverage of these drivers.

### 14.4 Ecosystem Enablement

There is no package ecosystem. The relevant work is firmware: review and test of the RP016 OpenSBI APLIC and VIRQ series, and of the OpenSBI AIA series by Pawandeep Oza (cross-reference the OpenSBI report). Cross-references: Linux KVM for guest AIA and vstimecmp, Linux SBI for SBI IPI and MPXY.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Test and review Jones IMSIC/IOMMU MSI-remap series on own silicon | 4-6 | Kernel team with Ventana/Jones upstream | High |
| Functional | Tick-broadcast and CPU-hotplug validation, drive IMSIC IRQ-work fix to merge | 2-3 | Kernel team | High |
| Functional | Upstream SoC bindings and quirks for own SoC | 2-4 per SoC | SoC enablement team | High |
| Functional | Review open hardening series | 1-2 | Kernel team | Low |
| Performance | Baseline harness for Sstc, IPI, PLIC vs AIA and cyclictest | 4-6 | Performance team | High |
| Performance | Pseudo-NMI feasibility study | 3-4 | Kernel team | Medium |
| CI/CD | KUnit tests for riscv-intc, PLIC, APLIC, IMSIC, timer-riscv | 6-8 | Kernel team | High |
| CI/CD | Selftests subtarget for irq/timer on riscv64 | 3-4 | Kernel team | Medium |
| CI/CD | Confirm or add KernelCI/LKFT riscv64 AIA boot with timers kselftests | 3-5 | CI team | High |
| Ecosystem | Review and test OpenSBI APLIC/VIRQ and AIA series | 2-3 | Firmware team | Medium |

## 15. References

- [Linux kernel repository (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [Linux interrupts documentation (docs.kernel.org)](https://docs.kernel.org/core-api/irq/index.html)
- [PLIC driver, 8237f8bc4f6e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8237f8bc4f6e)
- [timer-riscv rename, 3d42b32b1d6b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3d42b32b1d6b)
- [riscv-intc driver, 6b7ce8927b5a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6b7ce8927b5a)
- [CLINT timer driver, 2ac6795fcc08](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2ac6795fcc08)
- [Sstc support, 7ab52f75a9cf](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7ab52f75a9cf)
- [AIA APLIC direct mode, 2333df5ae51e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2333df5ae51e)
- [AIA IMSIC early driver, 21a8f8a0eb35](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=21a8f8a0eb35)
- [IMSIC device MSI domain, 027e125acdba](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=027e125acdba)
- [APLIC MSI mode, ca8df97fe679](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ca8df97fe679)
- [T-HEAD C900 ACLINT SSWI, 25caea955cc9](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=25caea955cc9)
- [stimecmp save/restore, ffef54ad4110](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ffef54ad4110)
- [RV32 stimecmp hazard fix, eaa9bb1d39d5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=eaa9bb1d39d5)
- [RV32 vstimecmp hazard fix (KVM), 75870639bf5d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=75870639bf5d)
- [Linux RISC-V AIA Support v16 cover letter](https://lore.kernel.org/lkml/20240307140307.646078-9-apatel@ventanamicro.com/T/)
- [Add Sstc extension support v7 thread](https://lists.infradead.org/pipermail/linux-riscv/2022-August/018016.html)
- [Andrew Jones IMSIC/IOMMU MSI remapping v7, cover](https://ratatoskr.run/linux-riscv/2026/10/17788564)
- [Andrew Jones v7 patch 3/5](https://ratatoskr.run/linux-riscv/2026/10/17788567)
- [Andrew Jones v7 patch 4/5](https://ratatoskr.run/linux-riscv/2026/10/17788568)
- [Andrew Jones irqbypass RFC v3](https://ratatoskr.run/linux-iommu/2026/09/17653913)
- [Yaxing Guo IMSIC IRQ_MSI_IOMMU v1 and Anup Patel review](http://lists.infradead.org/pipermail/linux-riscv/2026-February/085474.html)
- [Troy Mitchell IMSIC IRQ work patch](https://ratatoskr.run/linux-riscv/2026/11/17850272)
- [Kondratiev APLIC probing v5 cover](https://ratatoskr.run/linux-riscv/2026/10/17776851)
- [Avi Weiss IMSIC retrigger patch](https://ratatoskr.run/linux-riscv/2026/10/17804315)
- [Jiale Yao riscv-intc MADT validation](https://ratatoskr.run/linux-riscv/2026/10/17814808)
- [Guo Ren IPI_MAX series v2](https://ratatoskr.run/linux-riscv/2026/09/17550030)
- [Pengpeng Hou APLIC source ID validation](https://ratatoskr.run/linux-riscv/2026/07/17277692)
- [Nam Cao init-path hardening thread](https://ratatoskr.run/linux-riscv/2026/09/17517801)
- [Pengpeng Hou IMSIC group index geometry](https://ratatoskr.run/linux-riscv/2026/09/17520256)
- [linux-riscv irqchip drivers subsystem view](https://ratatoskr.run/linux-riscv/subsystem/irqchip%20drivers/)
- [MIPS P8700 v2 series](https://ratatoskr.run/linux-riscv/2026/11/17853810/t)
- [Tenstorrent Atlantis APLIC binding](https://ratatoskr.run/linux-riscv/2026/06/17089340)
- [OpenSBI APLIC and IMSIC series (Pawandeep Oza)](https://ratatoskr.run/opensbi/2026/07/17246701/t)
- [QEMU AIA in-kernel irqchip save/restore](https://ratatoskr.run/qemu-devel/2026/06/17076179/t)
- [QEMU issue 1647](https://gitlab.com/qemu-project/qemu/-/issues/1647)
- [Anup Patel timer interrupt toggle patch thread (2023-07)](https://lists.infradead.org/pipermail/linux-riscv/2023-July/035698.html)
- [Ley Foon Tan / Naohiko Shimizu RV32 timer fix discussion](https://lkml.iu.edu/2601.0/01361.html)
- [CVE-2026-31574 entry (vulert)](https://vulert.com/vuln-db/clockevents--add-missing-resets-of-the-next-event-forced-flag)
- [RISE: Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE: RISC-V runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE project site](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [Ray Mao blog: APLIC M-mode wired interrupt support in OpenSBI](https://raymo200915.github.io/2026/03/09/APLIC-M-mode-Wired-Interrupt-Support-in-OpenSBI.html)
- [syzbot upstream dashboard](https://syzkaller.appspot.com/upstream)
- [PyPI lookup (404)](https://pypi.org/pypi/linux-interrupts-and-timers/json)
- [Ubuntu package search (resolute)](https://packages.ubuntu.com/search?keywords=Linux%20interrupts%20and%20timers&suite=resolute&searchon=names&section=all)
- [VOSySmonitoRV (arXiv 2111.02821)](https://arxiv.org/pdf/2111.02821)
- [User-level interrupts on RISC-V (arXiv 2604.04015)](https://arxiv.org/html/2604.04015v1)
- [Android common kernel timer-riscv.c mirror](https://android.googlesource.com/kernel/common.git/+/bd37cdf8ba1b56a968173560314398d5d3b2d37a/drivers/clocksource/timer-riscv.c)
- [AIA APLIC commit mirror (tangled.org)](https://tangled.org/tjh.dev/kernel/commit/2333df5ae51ead2188d07c99e841e159a664741e)