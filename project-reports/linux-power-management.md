---
title: Linux power management
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
  - name: ACPICA
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-power-management" %}

# Linux power management

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux power management<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux power management (PM) is not a standalone project. It is a set of subsystems inside the Linux kernel: system suspend and hibernation (`kernel/power`), runtime PM (`drivers/base/power`), cpuidle, cpufreq, generic PM domains (`drivers/pmdomain`), thermal, and the architecture hooks under `arch/riscv`. Homepage: [kernel PM driver API documentation](https://docs.kernel.org/driver-api/pm/index.html). Repository: [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git). The reference clone is at HEAD `05441d697f7f` (2026-11-03, `v7.4-rc1-132`). The newest tag is `v7.4-rc1` and the latest stable release is `v7.3`.

**RISC-V PM building blocks (all in mainline):**
- Non-retentive hart suspend entry and exit, plus a cpuidle driver on the SBI HSM extension (v5.18).
- Hibernation (v6.4).
- Suspend-to-RAM through the SBI SUSP extension (v6.8).
- ACPI CPPC for cpufreq (v6.9).
- SoC power-domain drivers for StarFive JH71xx (v6.3) and T-Head TH1520 (v6.15).
- RPMI device-power PM domains (v7.4-rc1).
- EFI-based reboot and poweroff (v7.3).

**Governance.**
- The kernel is a Linux Foundation hosted project. It uses the maintainer-tree and mailing-list model (linux-pm, linux-riscv). The [kernel PM documentation](https://docs.kernel.org/driver-api/pm/index.html) states no foundation membership or governance model beyond links to the development-process pages.
- License is GPL-2.0.
- No GitHub issue tracker or PR flow exists. Review happens on mailing lists and patchwork.

**Maintainers (from `MAINTAINERS`; company inferred from email domain unless stated).**

| Area | Maintainers |
|---|---|
| RISC-V architecture (`arch/riscv/`, covers suspend, hibernate, cpu-hotplug) | Paul Walmsley, Palmer Dabbelt, Albert Ou; reviewer Alexandre Ghiti. Employers not stated in the file. [NEEDS VERIFICATION] |
| `CPUIDLE DRIVER - RISC-V SBI` (only `cpuidle-riscv-sbi.c`) | Anup Patel. Commits use ventanamicro.com (wdc.com in 2022), so Ventana Micro Systems is the likely affiliation. [NEEDS VERIFICATION] |
| `RISC-V RPMI DEVICE POWER DRIVER` (`drivers/pmdomain/riscv/`) | Joshua Yeong, StarFive |
| `RISC-V RPMI AND MPXY DRIVERS` | Rahul Pathak, Anup Patel |
| Core PM, suspend, hibernation, cpuidle, thermal | Rafael J. Wysocki |
| cpuidle, thermal | Daniel Lezcano |
| cpufreq, `cppc_cpufreq` | Viresh Kumar (Linaro) |
| Generic PM domains (`drivers/pmdomain`) | Ulf Hansson |
| CPU hotplug core | Thomas Gleixner, Peter Zijlstra |

**Corporate contributors to RISC-V PM.**
- Commit author domains are sifive.com, ventanamicro.com, starfivetech.com, wdc.com, spacemit.com, samsung.com, meta.com and tinylab.org.
- Linaro and Linux Foundation addresses appear on cross-architecture cleanups.
- Sunil V L's address changed from ventanamicro.com to oss.qualcomm.com between 2024 and 2026.

**RISE.** No RISE involvement in PM was found. The [RISE project](https://riseproject.dev) lists a Kernel & Virtualization working group, with a [kernel-and-virtualization-wg repository](https://github.com/riseproject-dev/kernel-and-virtualization-wg) (62 open issues). Its README has no PM terms, but individual issues were not inspected. [NEEDS VERIFICATION]

**Community stance on new RISC-V features.** `Documentation/arch/riscv/patch-acceptance.rst` says maintainers disapprove of churn and prefer well-reviewed, tested code. New extensions are accepted only if the spec is Frozen or Ratified, or the custom extension is in widely available hardware. Patchwork builds and tests each submitted patch against the riscv `for-next` and `fixes` branches, and patches that fail checks are unlikely to be applied.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | First commit adding `arch/riscv/Kconfig` (`fbe934d69eb7`, Palmer Dabbelt). RISC-V mainline begins with Linux 4.15. | Kernel clone `git log` |
| 2017-07-10 | `arch/riscv/kernel/reset.c` (reboot and poweroff hooks), part of the initial port | Kernel clone `git log` |
| 2020-03-17 | `cpu-hotplug.c` and `cpu_ops_sbi.c` (HSM-ordered boot), Atish Patra (wdc.com), v5.7 [NEEDS VERIFICATION: tag from one report] | Kernel clone `git log` |
| 2022-03-10 (authored 2022-02-10) | Non-retentive suspend entry and exit, [63b13e64a829](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=63b13e64a829), v5.18 | Kernel clone |
| 2022-03-10 (authored 2022-02-10) | Factor-out of PSCI power-domain code into `dt_idle_genpd.c`, [9d976d6721df](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9d976d6721df), v5.18 | Kernel clone |
| 2022-03-10 (authored 2022-02-10) | cpuidle RISC-V SBI driver, [6abf32f1d9c5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6abf32f1d9c5), v5.18 | Kernel clone |
| 2023-01-20 | StarFive JH71XX PMU driver, [08b9a94e8654](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=08b9a94e8654), v6.3 | Kernel clone; [Phoronix Linux 6.3 SoC drivers](https://www.phoronix.com/news/SoC-Drivers-Linux-6.3) |
| 2023-04-29 (authored 2023-03-30) | Hibernation, [c0317210012e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c0317210012e), v6.4 | Kernel clone; [Phoronix RISC-V hibernation](https://www.phoronix.com/news/RISC-V-Hibernation-Linux) |
| 2024-01-11 (authored 2023-12-06) | SBI SUSP system suspend (suspend-to-RAM), [4dc4af9ce326](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4dc4af9ce326), v6.8 | Kernel clone |
| 2024-01-18 | ACPI LPI helper move, `6649182a383c`, Sunil V L, v6.9 | Kernel clone |
| 2024-03-19 (authored 2024-02-08) | ACPI CPPC driver, [30f3ffbee86b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=30f3ffbee86b), v6.9 | Kernel clone |
| 2024-10-17 (authored 2024-08-14) | cpuidle-riscv-sbi `cpuidle_disabled()` check and `arch_initcall` move, [27b4d6aa29ab](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=27b4d6aa29ab), v6.13 | Kernel clone |
| 2024-12-30 (authored 2024-10-17) | KVM SBI SUSP support, [023c15151fbb](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=023c15151fbb), v6.14 | Kernel clone |
| 2025-03-13 (authored 2025-03-11) | TH1520 power-domain driver, [dc9a897dbb03](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dc9a897dbb03), v6.15 | Kernel clone |
| 2025-03-18 (authored 2025-02-19) | `stimecmp` save and restore, [ffef54ad4110](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ffef54ad4110), v6.15 | Kernel clone |
| 2025-04-07 | `PM_GENERIC_DOMAINS` enabled for T-Head SoCs, `54fe9380a50b`, v6.16 | Kernel clone |
| 2026-01-14 (authored 2026-01-04) | RV32 `stimecmp` hazard fix, [344c5281f438](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=344c5281f438), v6.19 | Kernel clone |
| 2026-02-19 | IMSIC CPU PM notifier fix applied to riscv `fixes`; queued for stable 6.18 and 6.19 | [linux-riscv announcement](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085438.html); [LKML](https://lkml.iu.edu/2602.2/05253.html) |
| 2026-08-07 | ACPI LPI context-loss flags ([7e4cb63d61a7](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7e4cb63d61a7)) and EFI reset and poweroff ([c888e324b249](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c888e324b249), `d8d0fb556e53`), v7.3 | Kernel clone |
| 2026-08-08 and 2026-08-10 | KVM CPU PM notifier and VCPU cache fix ([df81f80c35bc](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=df81f80c35bc), `dfdf1374fdec`), v7.3 | Kernel clone |
| 2026-09-03 (committed 2026-09-21) | RPMI device-power pmdomain, [f94fe707c5b7](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f94fe707c5b7), v7.4-rc1, pulled via `pmdomain-v7.4` (0e557fc68a16, 2026-10-22) | Kernel clone |
| 2026-01-08 | SiFive power provider series v4 posted, not merged at clone HEAD | [LWN](https://lwn.net/Articles/1053313/) |

**Key contributors.**
- Anup Patel (WDC, then Ventana): cpuidle and non-retentive suspend.
- Sia Jee Heng, Walker Chen, Joshua Yeong (StarFive): hibernation, JH71XX PMU, RPMI device power.
- Andrew Jones and Sunil V L (Ventana): SBI SUSP and ACPI CPPC.
- Nick Hu and Yong-Xuan Wang (SiFive): `stimecmp`, cpuidle PD fixes, KVM CPU PM.
- Michal Wilczynski (Samsung): TH1520 power domains.
- Atish Patra (Meta): EFI reset.
- Peixin Xie (SpacemiT): ACPI LPI fix.
- Samuel Holland (SiFive): `envcfg` save and restore.

**Fully upstream?** Yes for the items above; all are ancestors of HEAD. Not upstream: the SiFive "Add SiFive power provider driver" v4 series (cpuidle-riscv-sbi-domain split and a SiFive DMC genpd driver). `cpuidle-sifive-dmc-domain.c` is absent from the tree. The earlier search noted no host-side SBI SUSP commit. The later clone read found `4dc4af9ce326` (v6.8), and the clone read is authoritative.

**Historical threads:**
- [RFC CPU Idle Support, 2021-02](https://lore.kernel.org/all/20210221093758.210981-3-anup.patel@wdc.com/t/)
- [v6 CPU Idle Support, 2021-06](https://lkml.iu.edu/hypermail/linux/kernel/2106.1/02743.html)
- [Enable CPU_IDLE drivers v10, 2022-01](https://lore.kernel.org/20220126114452.692512-2-apatel@ventanamicro.com/)

## 3. Upstream Support Tier

**Formal tier policy.** None. The kernel has no tiered-support policy. The closest document is `Documentation/arch/riscv/patch-acceptance.rst` (see Section 1). Other relevant facts:
- The `CPUIDLE DRIVER - RISC-V SBI` MAINTAINERS entry has status Maintained.
- The RISC-V architecture entry has status Supported.
- Core PM, suspend and hibernation are mostly Supported. They are x86/ACPI-centred in MAINTAINERS (they map `arch/x86/power`).

**Evidence on CI and release.**
- The kernel tree has no CI configuration files (no `.gitlab-ci*`, no `.github`).
- Upstream riscv64 testing consists of patchwork build and boot checks and a generic KUnit riscv64 QEMU target, [qemu_configs/riscv.py](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/kunit/qemu_configs/riscv.py).
- That target enables only the serial console, SBI v0.1 and `ARCH_VIRT`. It does not enable `CPU_IDLE`.
- `tools/testing/selftests/riscv/` holds only `abi`, `cfi`, `hwprobe`, `mm`, `sigreturn` and `vector`. There are no PM, suspend, idle or hibernate tests.
- Official binaries: the kernel project ships source only. Consumable riscv64 kernels come from distributions (Section 8).

**Comparison.**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Suspend-to-RAM mechanism | Data not available: not researched | Data not available: not researched | SBI SUSP only, `mem` state only (`suspend_valid_only_mem`) |
| cpuidle | Data not available: not researched | PSCI power-domain driver exists (its generic code was factored into `dt_idle_genpd.c`) | SBI HSM driver (`cpuidle-riscv-sbi.c`) and ACPI LPI driver (`drivers/acpi/riscv/cpuidle.c`) |
| cpufreq | Data not available: not researched | Data not available: not researched | Generic `cppc_cpufreq` via ACPI CPPC only; no RISC-V SoC cpufreq driver found; DT path not found [NEEDS VERIFICATION] |
| Hibernation | Core PM is x86/ACPI-centred per MAINTAINERS | Data not available: not researched | Present since v6.4; marked "nonportable" [NEEDS VERIFICATION] |
| PM-specific CI in tree | Data not available: not researched | Data not available: not researched | None (generic KUnit QEMU target only) |
| Maintainer coverage | Core PM maintainers map `arch/x86/power` | Arm staff review `cppc_cpufreq` | Named vendor maintainers for SBI cpuidle and RPMI; no dedicated RISC-V PM maintainer |

## 4. Technical Architecture and RISC-V-Specific Subsystems

JIT, SIMD and GC barriers do not apply to PM. The RISC-V-specific parts are firmware interfaces (SBI), CSR context handling and SoC power controllers.

| Component | riscv64 implementation | ISA extension or interface | Quality and notes |
|---|---|---|---|
| Non-retentive suspend (`arch/riscv/kernel/suspend.c`, `suspend_entry.S`) | Yes (v5.18) | Saves `envcfg` (if XLINUXENVCFG), `tvec`, `ie`, `stimecmp` (if Sstc), `satp`. Does not save `ip` (set by external devices or M-mode) | Hand-written assembly plus C. `cpu_suspend()` returns `-EOPNOTSUPP` if the finisher returns with no error. Scratch CSR no longer saved (fa7d7339016a). |
| Suspend-to-RAM | Yes (v6.8) | SBI SUSP; registered only if SBI spec >= 2.0 and the extension probes present | `mem` only. No `standby` path. |
| Hibernation (`hibernate.c`, `hibernate-asm.S`) | Yes (v6.4) | Header stores satp, hartid and resume address | Temporary page table covers only the linear map. Requires `ARCH_HIBERNATION_HEADER`. |
| CPU hotplug and ops (`cpu-hotplug.c`, `cpu_ops_sbi.c`, `cpu_ops_spinwait.c`) | Yes | SBI HSM | Moved to hotplug core state synchronization (2023). A fix clears hot-unplugged cores from task `mm_cpumasks` (2025-09-19). |
| SBI cpuidle (`drivers/cpuidle/cpuidle-riscv-sbi.c`) | Yes (v5.18) | SBI HSM `HART_SUSPEND`; DT `idle-states`; genpd hierarchy | Kconfig `RISCV_SBI_CPUIDLE` is a bool that depends on `RISCV_SBI`. It selects `DT_IDLE_STATES`, `CPU_IDLE_MULTIPLE_DRIVERS`, and `DT_IDLE_GENPD` if `PM_GENERIC_DOMAINS_OF`. |
| ACPI LPI cpuidle (`drivers/acpi/riscv/cpuidle.c`) | Yes (v6.9) | ACPI LPI | v7.3 fix maps hart timer context loss to `CPUIDLE_FLAG_TIMER_STOP`. |
| ACPI CPPC (`drivers/acpi/riscv/cppc.c`) | Yes (v6.9) | SBI CPPC interfaces or FFH CSRs | ACPI-only. Consumer is the generic `drivers/cpufreq/cppc_cpufreq.c`. |
| PM domains | JH71XX PMU (v6.3), TH1520 (v6.15), RPMI device power (v7.4-rc1) | PMU registers; AON firmware over mailbox; SBI MPXY/RPMI | TH1520 driver never powers off the AUDIO island because that crashes the E902 AON firmware. RPMI driver is `default RISCV`, `depends on MAILBOX`, `PM`. |
| Messaging for firmware PM | SBI MPXY mailbox (`riscv-sbi-mpxy-mbox.c`, Anup Patel, 2025-08-18) [NEEDS VERIFICATION: kernel version]; TH1520, CV1800 and Microchip SBI IPC mailboxes | RPMI v1.0, SBI v3.0 or higher | Bindings: `riscv,rpmi-device-power.yaml`, `riscv,rpmi-mpxy-device-power.yaml`. |
| Reboot and poweroff | SBI SRST (`sbi.c`, `reset.c`) [NEEDS VERIFICATION: file contents not read]; EFI runtime path since v7.3 | SBI SRST; EFI ResetSystem | Until v7.3 SBI SRST was always used. SoC drivers: TH1520 AON reboot, SpacemiT P1 PMIC. |
| Interrupt controllers across suspend | IMSIC and APLIC state save/restore | AIA | Fixed 2026-02 (Section 11). |
| KVM PM | CPU_PM notifier, `kvm_suspend`/`kvm_resume` syscore ops, KVM SUSP handler | H extension CSRs | See Linux KVM report. Non-retention idle was a KVM host gap before v7.3. |
| Thermal | SpacemiT K1 thermal sensor driver (Linux 7.2 PM pull) | n/a | Source is a press article only [NEEDS VERIFICATION]. |

**amd64 vs arm64 vs riscv64.** Data not available: only riscv64 was examined; the amd64 and arm64 PM implementations were not read. Known cross-architecture facts: the RISC-V SBI idle driver reuses `dt_idle_genpd.c`, which was factored out of the arm PSCI domain driver, and ACPI CPPC infrastructure is shared with arm.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild/Kconfig with GNU make. There is no cmake or configure step, and no Dockerfile or Containerfile exists in the tree. Commands below come from `Documentation/kbuild/` and `arch/riscv/configs/`. They were not executed.

GNU toolchain, cross-compiled:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```

LLVM (no `CROSS_COMPILE` needed):
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules dtbs
```

- `LLVM=-18` selects a version suffix and `LLVM=/path/to/llvm/` a path.
- `LLVM_IAS=0` selects the non-integrated assembler and requires `CROSS_COMPILE`.
- The boot image is `arch/riscv/boot/Image`; `Image.gz`, `.bz2`, `.lz4`, `.lzma` and `.lzo` are available through `CONFIG_KERNEL_*`.
- Config files in `arch/riscv/configs/`: `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig`, `nommu_virt_defconfig`.

**Toolchain minimums** (`scripts/min-tool-version.sh`, `Documentation/process/changes.rst`):

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1.0 | Raised by `a3e8fe814ad1` (v6.15) for x86 stack-protector per-CPU canary support. No RISC-V-specific reason. |
| binutils | 2.30.0 | Needed to assemble `suspend_entry.S` and `hibernate-asm.S`. |
| Clang/LLVM | 17.0.1 | Raised by `ce3267a39a92` (v7.2) over an `asm goto` scope-checker problem with the `cleanup` attribute. Generic kbuild reason. |
| GNU make | 4.0 | Kbuild |
| Rust (optional) | rustc 1.85.0, bindgen 0.71.1 | Rust on riscv64 is "Maintained", riscv64 only, and requires Clang (`HAVE_HAVE_RUST if RUSTC_SUPPORTS_RISCV && CC_IS_CLANG`). |

Version gates in `arch/riscv/Kconfig` are feature switches, not hard requirements:
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies for GNU as 2.36 or newer. The Kconfig help text says binutils 2.38 and GCC 12.1.0 changed the default ISA spec.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies for GCC older than 11.3.0.
- `TOOLCHAIN_HAS_V` needs lld or binutils 2.38.
- `TOOLCHAIN_HAS_ZBB`, `ZBA`, `ZBC` and `ZBKB` need lld or binutils 2.39.
- `ARCH_HAS_BROKEN_DWARF5` applies to LLVM older than 18.

**PM Kconfig knobs.**
- `ARCH_SUSPEND_POSSIBLE=y` and `ARCH_HIBERNATION_POSSIBLE=y` are unconditional in `arch/riscv/Kconfig`.
- `select CPU_PM if CPU_IDLE || HIBERNATION || SUSPEND`.
- `arch/riscv/configs/defconfig` sets `CPUFREQ_DT=y`, `ACPI_CPPC_CPUFREQ=m`, `CPU_FREQ_GOV_POWERSAVE=m`, `CPU_THERMAL=y`, `DEVFREQ_THERMAL=y`, `PM_DEVFREQ=y`, `POWER_RESET_GPIO_RESTART=y`.
- Whether `CPU_IDLE`, `SUSPEND`, `HIBERNATION` and `RISCV_SBI_CPUIDLE` are set in defconfig is unconfirmed. One report says its grep matched nothing, and another says its grep was stopped before returning. [NEEDS VERIFICATION]

**QEMU usage.** No in-tree document gives a plain `qemu-system-riscv64` command. The only in-tree invocation is the KUnit config, which uses `-machine virt -cpu rv64` with `/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`, kernel `arch/riscv/boot/Image` and `console=ttyS0`. Run it with:
```
./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-
```
A manual boot (`-machine virt -kernel arch/riscv/boot/Image -append "console=ttyS0"` plus an initrd or rootfs) is an extrapolation. [NEEDS VERIFICATION] Whether QEMU `virt` exercises SBI SUSP, cpuidle or cpufreq was not assessed.

**Known build failures.** None found for PM code. The clone's shared `.git` had a stalled `gc` ("Out of diskspace"); this is a research-environment problem, not a kernel problem.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | First release | Notes |
|---|---|---|---|
| CPU hotplug | Present | v5.7 [NEEDS VERIFICATION] | SBI HSM |
| cpuidle (DT, SBI HSM) | Present | v5.18 | Hierarchical genpd supported |
| cpuidle (ACPI LPI) | Present | v6.9 | Timer-stop flag fix in v7.3 |
| Suspend-to-RAM | Present, SBI SUSP only | v6.8 | `mem` only |
| Hibernation | Present, "nonportable" | v6.4 | Single-source note on PMP and no-map [NEEDS VERIFICATION] |
| cpufreq | ACPI CPPC only | v6.9 | No RISC-V SoC cpufreq driver found |
| PM domains | JH71XX, TH1520, RPMI | v6.3, v6.15, v7.4-rc1 | SoC specific |
| Reboot and poweroff | SBI SRST, EFI since v7.3 | v4.15 / v7.3 | |
| `stimecmp` (Sstc) across suspend | Present | v6.15 | |
| KVM guest SUSP | Present | v6.14 | Host disabled by default; needs VMM |
| KVM non-retention idle | Present | v7.3 | Gap in earlier releases |
| Thermal | Generic framework; K1 sensor per press | n/a | [NEEDS VERIFICATION] |

amd64 and arm64 parity: Data not available: those architectures' PM feature sets were not researched.

**Functional gaps (visible in code):**
- No `standby` state from SBI SUSP.
- No DT-based CPPC cpufreq path found [NEEDS VERIFICATION].
- No RISC-V SoC cpufreq driver in `drivers/cpufreq`. CloudBEAR states cpufreq and voltage management are "not currently used due to the lack of a target SoC with a PLL" [NEEDS VERIFICATION].
- The SiFive DMC cpuidle and PD split is unmerged.
- No SBI SUSP host selftest or KUnit was found.

**Performance gaps.** Data not available: no RISC-V PM benchmark with methodology was found. SPEC CPU 2017 tooling for RISC-V exists with no "reportable" runs, and no RISC-V power results were found. See Section 11 for the single community power measurement.

**Security hardening gaps.** Data not available: not searched. Related note: hibernation touches PMP-protected SBI regions when the no-map property is dropped, which can panic the kernel (Section 11). [NEEDS VERIFICATION]

**NaN and floating-point semantics.** Not applicable to PM.

## 7. CI/CD Infrastructure

**In tree.** No CI YAML or `.kci` files exist. The three PM selftests (`cpufreq`, `cpu-hotplug`, `power_supply`) have no riscv-specific logic. Generic PM KUnit tests (`PM_QOS_KUNIT_TEST`, `PM_RUNTIME_KUNIT_TEST`, `kernel/power/suspend_test.c`, `drivers/thermal/testing/`) exist; whether they build on riscv64 was not verified. `arch/riscv/kernel/tests/Kconfig.debug` defines only `RISCV_MODULE_LINKING_KUNIT` and `RISCV_KPROBES_KUNIT`. The only riscv64 runner config is the generic KUnit QEMU target in [qemu_configs/riscv.py](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/kunit/qemu_configs/riscv.py), which has no PM kconfig.

**External.** KernelCI and LKFT could not be read (the dashboards were not accessible), and lore was not accessible. Whether riscv64 PM runs there is unconfirmed. [NEEDS VERIFICATION] A 2020 [LTP thread](https://lists.linux.it/pipermail/ltp/2020-October/019323.html) says LTP has no suspend-state tests and its power_management tests are mostly cpufreq.

**RISE and hardware.**
- A [RISE hardware-in-the-loop post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/) says the lab (Banana Pi BPI-F3, SiFive HiFive Premier P550) is ready for upstream testing "by projects such as KernelCI". It gives no PM tests.
- RISE [runners](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) are for project CI. The EM-RV1 nodes run a vendor 5.10.x kernel.
- No RISE runner usage tied to Linux PM was found.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None | None | None |
| PM-specific selftests | Data not available: not researched | Data not available: not researched | None (three generic PM selftests only) |
| Patch CI | Data not available: not researched | Data not available: not researched | Patchwork build and boot checks on riscv `for-next`/`fixes` |
| KUnit under QEMU | Data not available: not researched | Data not available: not researched | `riscv64` target, no PM config |
| KernelCI/LKFT/syzbot | Data not available: not accessible | Data not available: not accessible | Unconfirmed [NEEDS VERIFICATION] |

## 8. Distribution and Release Status

- The kernel project ships source tarballs and git tags. There is no PyPI, npm, Maven or OCI artifact for Linux PM. PyPI `linux-power-management` returns 404, and the RISE wheel index has no entry.
- PM reaches users through the distro riscv64 kernel image packages (for example Ubuntu `linux-image-*`). The check of packages.ubuntu.com for 26.04 was not possible, so this is unverified. [NEEDS VERIFICATION]
- Userspace PM tools are packaged for riscv64: [cpupower on Alpine](https://pkgs.alpinelinux.org/package/edge/main/riscv64/cpupower) and [upower on Ubuntu Noble](https://code.launchpad.net/ubuntu/noble/riscv64/upower).
- Distro kernel configs and distro patch status were not checked.

**What a user must do for a working binary.** Install a distro riscv64 kernel, or build from source with the commands in Section 5. Then confirm that the PM Kconfig options are enabled (`CPU_IDLE`, `RISCV_SBI_CPUIDLE`, `SUSPEND`, `HIBERNATION`) and that the platform's DT or ACPI tables describe idle states or power domains. Suspend-to-RAM also needs SBI firmware that implements SUSP. Boards on vendor kernels (for example the VisionFive 2 on 5.15.0-starfive in the community measurement) do not carry mainline PM changes.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. Host kernel; PM code lives here. | Mainline since 4.15. `ARCH_SUSPEND_POSSIBLE` and `ARCH_HIBERNATION_POSSIBLE` set in `arch/riscv/Kconfig`; `ACPI_CPPC_CPUFREQ` lists RISCV. | Generic KUnit QEMU target only; no PM-specific riscv64 tests. KernelCI/LKFT/syzbot coverage unconfirmed [NEEDS VERIFICATION]. | Mainline and stable trees; riscv64 binaries from distros, distro configs and patches not checked. [NEEDS VERIFICATION] | Active; vendor maintainers named in Section 1. No `project-reports/linux-kernel.md` exists. |
| OpenSBI | runtime-dependency, critical. M-mode firmware providing HSM, SUSP, SRST and CPPC. | Builds on riscv64; implements HSM, SRST, SUSP, CPPC (RPMI-backed), PMU, `SBI_ECALL_VERSION` 3.0 (per `opensbi.md`). | Only workflow is `repo-lockdown.yml`; in-tree SBIUnit tests exist but no CI runs them. | Consumed from distros (Debian 1.7-1, T2 1.8.1); status report grade is orange. | HSM issue #355 ("hart is in invalid state", open since 2024-05-13). RPMI CPPC PR #432 is closed; whether it merged is unknown. See `project-reports/opensbi.md`. |
| GCC | build-dependency, critical. Primary toolchain, minimum 8.1.0. | Blue per `project-reports/gcc.md` | See report | See report | None identified for this subsystem |
| GNU binutils | build-dependency, critical. Assembler and linker, minimum 2.30. Needed for `suspend_entry.S`, `hibernate-asm.S`. | Blue per `project-reports/gnu-binutils.md` | See report | See report | None identified for this subsystem |
| LLVM | build-dependency, optional. Alternative toolchain, minimum Clang/LLVM 17.0.1. Needed for Rust on riscv64. | Yellow per `project-reports/llvm.md` | See report | See report | None identified for this subsystem |
| dtc | build-dependency, critical. Compiles DT idle-states, `cpus` and power-domain nodes. | No report. [NEEDS VERIFICATION] | No report. [NEEDS VERIFICATION] | No report. [NEEDS VERIFICATION] | In `projects.yml` with no `report:` field; none identified |
| ACPICA | runtime-dependency, optional. Supports `ACPI_CPPC_CPUFREQ` and `ACPI_CPPC_LIB` for ACPI systems. | ACPI side is in-kernel (`ARCH_SUPPORTS_ACPI if 64BIT`); ACPICA userspace tooling not assessed. [NEEDS VERIFICATION] | Not assessed. [NEEDS VERIFICATION] | Not assessed. [NEEDS VERIFICATION] | In `projects.yml` with no report |
| QEMU | test-dependency, optional. Main riscv64 test platform. | Yellow per `project-reports/qemu.md` | Not assessed for PM (SBI SUSP, cpuidle, cpufreq on `virt`). [NEEDS VERIFICATION] | See report | See `project-reports/qemu.md` |
| dt-schema (indirect) | Validates DT bindings, including `riscv/cpus.yaml` idle-state and power-domain properties. | No report. [NEEDS VERIFICATION] | No report. [NEEDS VERIFICATION] | No report. [NEEDS VERIFICATION] | In `projects.yml` with no report |
| GNU make (indirect) | Kbuild driver, minimum 4.0. | No report. [NEEDS VERIFICATION] | No report. [NEEDS VERIFICATION] | No report. [NEEDS VERIFICATION] | In `projects.yml` with no report |
| U-Boot (indirect, optional) | Boot firmware. | Blue per `project-reports/u-boot.md` | See report | See report | None identified for this subsystem |

**Deep dive (critical dependencies).**
- **OpenSBI.** Every riscv64 PM path other than SoC-specific drivers goes through SBI. cpuidle needs HSM `HART_SUSPEND`, suspend-to-RAM needs SUSP, reboot and poweroff need SRST (or EFI since v7.3), and ACPI CPPC can use the SBI CPPC extension. A firmware gap or bug therefore blocks the corresponding kernel feature. CloudBEAR reports a hot-unplug "rfence echo" issue with OpenSBI 1.7 and Linux, which it fixed with a Linux patch that clears the task mask on hot-unplug. The patch is not identified. [NEEDS VERIFICATION] The dependency research lists CPPC as implemented in OpenSBI but also lists RPMI CPPC PR #432 as closed with merge status unknown; this discrepancy is unresolved.
- **Toolchain.** Hibernation and suspend need only baseline GNU or LLVM assembler support. The ISA-spec gates (`_zicsr_zifencei`, Section 5) matter for the whole kernel, not PM specifically.
- **dtc and dt-schema.** DT idle-states and `power-domains` bindings are validated by dt-schema. Data not available: no riscv64 build or test status was found for either.

## 11. Known Bugs and Active Issues

No kernel.org Bugzilla or syzbot numbers were found; search for them was limited. All IDs below are distro trackers, commits or mailing-list items.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Launchpad 2046044](https://bugs.launchpad.net/bugs/2046044) | poweroff/shutdown panics on risc-v | New, undecided, unassigned | High for affected boards | Ubuntu 23.10 Nezha image on MangoPi Pro (Allwinner D1), reported 2023-12-09. Reboot works. Reporter suspects a "badaddr" in `machine_halt`. Kernel version not stated. |
| [SUSE Bugzilla 1231813](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/J7OUCRUOSFUQL5P36Q25YG2SUWH64Y5E) | [riscv64][Unmatched][regression] Hard lockup on reboot/poweroff with 6.11 | Unknown | High | Only the title was seen (HTTP 403 / bot check). Cause and fix unknown. [NEEDS VERIFICATION] |
| [Launchpad 2024935](https://bugs.launchpad.net/bugs/2024935) | Possible CPU slowdown on Allwinner D1 | New; listed as duplicate of #2021364 | Medium | Reporter (2023-06-23) measured a 1024^3 add loop at about 1 s on Ubuntu 22.10 and about 2.7 s on 23.04. `rdcycle` gave 410,398,820 cycles/s versus the expected 1,073,741,824 (kernel 5.19.0-1009-allwinner). `mitigations=off` made no difference. No root cause given and no link to cpufreq or PM. On 2023-09-01 a comment said it should be fixed in the Lunar 6.2 kernel with a Jammy backport planned. [NEEDS VERIFICATION] |
| `f48b4bd0915bf61ac12b8c65c7939ebd03bc8abf` | irqchip/riscv-imsic: CPU PM notifier to restore IMSIC on exit; plus APLIC save/restore | Fixed: applied to riscv `fixes` and announced 2026-02-19; queued for stable 6.18 and 6.19 via AUTOSEL | High (correctness) | IMSIC may be reset in a low-power state and nothing restored it, so interrupts were not delivered. Series posted 2025-12-02 (v3). See [linux-riscv](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085438.html), [LKML](https://lkml.iu.edu/2602.2/05253.html). |
| `dfdf1374fdec` | KVM: RISC-V: Clear former VCPU cache on virtualization disable | Fixed in v7.3 | High (correctness, guest state) | Without the clear, the next VCPU entry skipped CSR restoration after CPU offline or system suspend, corrupting hypervisor state. Fixes `1323a5cfe52c`. |
| `4785aa802853` (generic) fallout, fixed by `7e4cb63d61a7` | ACPI LPI `CPUIDLE_FLAG_TIMER_STOP` not set on RISC-V | Fixed in v7.3 (Cc: stable) | Medium (correctness) | A generic change replaced a nonzero check with `arch_get_idle_state_flags()`, which RISC-V did not implement. |
| `344c5281f438` | riscv: suspend: Fix stimecmp update hazard on RV32 | Fixed in v6.19 | Medium (spurious timer interrupts) | RV32 only; does not affect riscv64. |
| `ce31a1ee2a1e` | RISC-V: KVM: Document a TOCTOU race in SBI system suspend handler | Documented, intentionally unfixed (v7.2) | Low | A concurrent HSM `HART_START` can start a vCPU after the SUSP check. Only guest state is at risk. |
| Hibernation "nonportable" | Hibernation restricted because OpenSBI dropped the no-map property and hibernation touches PMP-protected SBI regions, which panics the kernel | Present in 2023. At HEAD `ARCH_HIBERNATION_POSSIBLE` is an unconditional `def_bool y` in `arch/riscv/Kconfig`, so the restriction is no longer in the Kconfig | Medium | Source is a search snippet of a [nexedi mirror commit](https://lab.nexedi.cn/kirr/linux/-/commit/ed309ce522185583b163bd0c74f0d9f299fe1826). [NEEDS VERIFICATION] |
| Hot-unplug "rfence echo" | OpenSBI 1.7 with Linux CPU hotplug | Patch not identified | Medium | CloudBEAR talk only. [NEEDS VERIFICATION] |
| TH1520 AUDIO island | Powering off the AUDIO island crashes the E902 AON firmware | Workaround in driver (island never turned off) | Low | `dc9a897dbb03` commit message |
| D1 suspend vs timers | cpuidle: riscv-sbi: Stop using non-retentive suspend | Unknown | Unknown | [lore thread](https://lore.kernel.org/all/Y3ytSj6NEeU54z7m@wendy/T/); status unverified. [NEEDS VERIFICATION] |

**Correctness bugs (highlighted):** IMSIC/APLIC state loss across idle and suspend, the KVM former-VCPU cache corruption, and the missing ACPI LPI timer-stop flag. All three are fixed in the mainline tree as of the clone, with the IMSIC fix pending stable propagation.

**Absence note.** No RISC-V regression reports for suspend-to-RAM, cpuidle-riscv-sbi or cppc-cpufreq surfaced. This reflects search results, not proof of absence.

**Community measurement (not a formal benchmark).** The [sbc-reviews issue](https://github.com/geerlingguy/sbc-reviews/issues/10) measured a StarFive VisionFive 2 (JH7110) on the vendor 5.15.0-starfive kernel at the wall: 3.1 W idle, 5.3 W under `stress-ng --matrix 0`, 5.2 W under Geekbench multicore. The clock stayed at 1500 MHz. The tool and method are not stated. The CloudBEAR [talk summary](https://cloudbear.ru/cn/news-ru-meetup-2025.html) reports idle time of "270-300% of the total system runtime" in 4-core tests, with two cpuidle states (sleep, deep sleep) on its own cores. It gives no methodology and no energy figures. [NEEDS VERIFICATION]

## 12. Objections and Upstream Blockers

**Stated objections.** None found. Review threads and cover letters could not be retrieved (lore.kernel.org and git.kernel.org were not accessible), so no maintainer objections to RISC-V PM series were read.

**Technical blockers.**
- Platform-level: SBI SUSP supports `mem` only. The only cpufreq path is ACPI CPPC. CloudBEAR reports no target SoC with a PLL for cpufreq. Hibernation is restricted by firmware memory protection (Section 11, single source).
- Open series: the SiFive "Add SiFive power provider driver" v4 (cpuidle-riscv-sbi-domain split, `sifive,tmc.yaml` binding and SiFive DMC genpd provider) is not merged, per [LWN](https://lwn.net/Articles/1053313/).
- Patch policy: `patch-acceptance.rst` requires Frozen or Ratified specs or widely available hardware, so vendor-only PM schemes stay in vendor trees.

**Organizational blockers.**
- No dedicated RISC-V PM maintainer. `CPUIDLE DRIVER - RISC-V SBI` covers only one file.
- No RISE involvement in PM found; no RISE-funded PM work found.
- Core PM maintainership is x86/ACPI-centred; RISC-V PM work depends on vendor contributors (SiFive, Ventana, StarFive, SpacemiT).

**Acceptance probability.** Data not available: no review-thread data was readable, so no basis exists to estimate acceptance probability for further RISC-V PM series. Observed record: every merged series checked landed, and the newest (RPMI device power) was pulled for the v7.4 merge window.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification.** RISC-V PM code is mainline and functional: SBI HSM cpuidle since v5.18, hibernation v6.4, SBI SUSP suspend-to-RAM v6.8, ACPI CPPC v6.9, and RPMI device-power pmdomain in the v7.4 merge window (see the [cpuidle-riscv-sbi commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6abf32f1d9c5)). Upstream CI is limited to riscv patchwork build and boot checks and a generic KUnit riscv64 QEMU target ([qemu_configs/riscv.py](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/kunit/qemu_configs/riscv.py)). The tree has no riscv64 PM-specific tests (no PM, suspend, idle or hibernate selftests under `tools/testing/selftests/riscv`), so the riscv64 PM paths are built but not tested by upstream. Consumable riscv64 kernels come from distros; distro patch status was not checked.

**Pending work that could change the grade.**
- The open SiFive series "Add SiFive power provider driver" v4 is not merged as of the clone.
- The IMSIC/APLIC suspend state fix (2026-02) is queued for stable.
- No RISE involvement was found in PM. RISE has a Kernel and Virtualization WG with no PM items seen.
- Unverified items that could change the grade:
  - KernelCI, LKFT and syzbot riscv64 coverage (lore, KernelCI and LKFT could not be read).
  - Distro kernel config and patch status.
  - Whether the PM Kconfig options (`CPU_IDLE`, `SUSPEND`, `HIBERNATION`, `RISCV_SBI_CPUIDLE`) are set in the riscv defconfig.
- If KernelCI or LKFT run riscv64 boot and PM tests, this could move to blue.
- Known open bugs: poweroff panic on D1 (Launchpad 2046044), SUSE bug 1231813 hard lockup on reboot/poweroff on Unmatched, and hibernation marked nonportable.

## 14. Investment Analysis

**RISE check first.** No RISE-funded or RISE-led PM work was found. The RISE feed (11 posts read), the members page, the wheel builder and the riseproject-dev repositories showed none. Related items:
- A RISE runners post says RISE is contributing full TH1520 mainline support [NEEDS VERIFICATION: single source]. The TH1520 power-domain driver (v6.15) is already merged, so no PM-domain work for TH1520 should be sized.
- The RISE hardware-in-the-loop lab and Board Farm exist and can be used by KernelCI.
- 60 of 70 riseproject-dev repositories and the WG issue titles were not inspected, so overlap cannot be ruled out. [NEEDS VERIFICATION]

Effort figures below are the author's planning estimates, not sourced findings. They assume engineers already familiar with the kernel and RISC-V SBI.

### 14.1 Functional Enablement

- **Config audit.** Confirm PM Kconfig options in `arch/riscv/configs/defconfig` and in target distro kernels. Resolves the open unknown in the grade.
- **SBI SUSP host validation** on target silicon and firmware. SUSP is `mem` only; confirm resume paths, interrupt controller restore (IMSIC/APLIC fix) and timer (`stimecmp`) behavior.
- **Own-silicon PM enablement.** If the company's SoC needs power-domain or cpufreq drivers, the RPMI device-power driver (v7.4-rc1) is the generic route for firmware-managed domains. An SoC-specific driver is the alternative. Data not available: the target SoC is not defined in the findings.
- **Hibernation portability** against the target firmware's memory protection.
- **Follow or co-test** the SiFive power-provider v4 series if its cpuidle PD split is needed.
- **OpenSBI.** Triage HSM issue #355 and confirm RPMI CPPC status.

### 14.2 Performance Optimization

No RISC-V PM benchmark with methodology exists in the findings. Work item: define an idle-power, suspend-resume latency and cpuidle residency benchmark on target hardware. Without a baseline, no performance gap can be sized.

### 14.3 CI/CD Infrastructure

- **QEMU/KUnit PM config.** Add a riscv64 QEMU config that enables `CPU_IDLE`, `SUSPEND` and `HIBERNATION` and exercises the generic PM KUnit tests. Confirm whether QEMU `virt` provides SBI SUSP.
- **Hardware boot and PM tests** on the RISE Board Farm, reported to KernelCI. Confirm first whether KernelCI/LKFT already run riscv64 (this is what could move the grade to blue).
- **Selftests.** There are no RISC-V suspend, idle or hibernate selftests; a small suspend/resume and cpuidle selftest would fill the gap.

### 14.4 Ecosystem Enablement

There is no dependent package ecosystem. Work is limited to confirming that distro kernels carry the PM Kconfig options and patches, and that `cpupower` and `upower` stay packaged on the distros of interest.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Audit PM Kconfig in defconfig and target distro kernels | 1-2 | Company kernel team | High |
| Functional | SBI SUSP and cpuidle validation on target silicon and firmware | 4-6 | Company kernel and firmware teams | Critical |
| Functional | Target SoC PM domain or cpufreq driver, or adopt RPMI device power | 6-12 (depends on SoC; Data not available) | Company kernel team | High |
| Functional | Hibernation validation against target firmware memory protection | 2-3 | Company kernel team | Medium |
| Functional | Track and test SiFive power-provider v4 series | 1-2 | Company kernel team with SiFive | Medium |
| Functional | OpenSBI HSM #355 and CPPC status triage | 2 | Company firmware team | Medium |
| Performance | Idle power, resume latency and cpuidle residency benchmark | 3-4 | Company platform team | Medium |
| CI/CD | PM-enabled QEMU/KUnit config | 2 | Company kernel team | Medium |
| CI/CD | Hardware boot and PM test on RISE Board Farm, KernelCI reporting | 6-8 | Company kernel team with RISE | High |
| CI/CD | RISC-V suspend/resume and cpuidle selftest | 4-6 | Company kernel team | Medium |
| Ecosystem | Verify distro kernel config and patch status; confirm `cpupower` and `upower` packaging | 1-2 | Company distro liaison | Low |

## 15. References

- [Linux power management driver API documentation](https://docs.kernel.org/driver-api/pm/index.html)
- [Linux kernel repository (torvalds/linux.git)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [cpuidle: Add RISC-V SBI CPU idle driver (6abf32f1d9c5)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6abf32f1d9c5)
- [RISC-V: Add arch functions for non-retentive suspend entry/exit (63b13e64a829)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=63b13e64a829)
- [cpuidle: Factor-out power domain related code from PSCI domain driver (9d976d6721df)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9d976d6721df)
- [riscv: sbi: Introduce system suspend support (4dc4af9ce326)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4dc4af9ce326)
- [RISC-V: Add arch functions to support hibernation (c0317210012e)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c0317210012e)
- [ACPI: RISC-V: Add CPPC driver (30f3ffbee86b)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=30f3ffbee86b)
- [RISC-V: KVM: Add SBI system suspend support (023c15151fbb)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=023c15151fbb)
- [cpuidle: riscv-sbi: Add cpuidle_disabled() check (27b4d6aa29ab)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=27b4d6aa29ab)
- [riscv: Add stimecmp save and restore (ffef54ad4110)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ffef54ad4110)
- [pmdomain: thead: Add power-domain driver for TH1520 (dc9a897dbb03)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dc9a897dbb03)
- [soc: starfive: Add StarFive JH71XX pmu driver (08b9a94e8654)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=08b9a94e8654)
- [riscv: suspend: Fix stimecmp update hazard on RV32 (344c5281f438)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=344c5281f438)
- [riscv: acpi: Handle LPI architectural context loss flags (7e4cb63d61a7)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7e4cb63d61a7)
- [riscv: Restart via EFI runtime services when available (c888e324b249)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c888e324b249)
- [KVM: RISC-V: Add CPU PM notifier for non-retention idle states (df81f80c35bc)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=df81f80c35bc)
- [pmdomain: riscv: Add RPMI device power service (f94fe707c5b7)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f94fe707c5b7)
- [KUnit riscv QEMU config (qemu_configs/riscv.py)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/kunit/qemu_configs/riscv.py)
- [SiFive power provider driver series v4 (LWN)](https://lwn.net/Articles/1053313/)
- [KVM CPU PM notifier series v4 (patchew)](https://patchew.org/linux/20260721-kvm-cpu-pm-v4-0-146bf942547d@sifive.com/)
- [Stable backport thread for pm_power_off fix](https://lore.kernel.org/all/YvZzjmVDDyWzIUDb@kroah.com/T/)
- [RFC RISC-V CPU Idle Support (2021-02)](https://lore.kernel.org/all/20210221093758.210981-3-anup.patel@wdc.com/t/)
- [RISC-V CPU Idle Support v6 (2021-06)](https://lkml.iu.edu/hypermail/linux/kernel/2106.1/02743.html)
- [RISC-V: Enable CPU_IDLE drivers v10](https://lore.kernel.org/20220126114452.692512-2-apatel@ventanamicro.com/)
- [cpuidle: riscv-sbi: Stop using non-retentive suspend thread](https://lore.kernel.org/all/Y3ytSj6NEeU54z7m@wendy/T/)
- [ACPI CPPC / CPU power management Kconfig entry thread](https://lore.kernel.org/platform-driver-x86/20230404182037.863533-7-sunilvl@ventanamicro.com/)
- [Phoronix: RISC-V hibernation](https://www.phoronix.com/news/RISC-V-Hibernation-Linux)
- [Phoronix: Linux 6.3 SoC drivers](https://www.phoronix.com/news/SoC-Drivers-Linux-6.3)
- [Phoronix: Linux 6.18 PowerVR RISC-V](https://www.phoronix.com/news/Linux-6.18-PowerVR-RISC-V)
- [cpupower on Alpine riscv64](https://pkgs.alpinelinux.org/package/edge/main/riscv64/cpupower)
- [upower on Ubuntu Noble riscv64](https://code.launchpad.net/ubuntu/noble/riscv64/upower)
- [RISE project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE kernel-and-virtualization-wg repository](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE: Android 17 available on RVA23](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE: Advancing OpenSBI interrupt handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE: RISC-V runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE: Tested on real silicon, hardware-in-the-loop](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [Launchpad bug 2046044](https://bugs.launchpad.net/bugs/2046044)
- [Launchpad bug 2024935](https://bugs.launchpad.net/bugs/2024935)
- [SUSE bug 1231813 thread (title only)](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/J7OUCRUOSFUQL5P36Q25YG2SUWH64Y5E)
- [linux-riscv: IMSIC/APLIC suspend fix announcement (2026-02)](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085438.html)
- [LKML: IMSIC/APLIC suspend fix](https://lkml.iu.edu/2602.2/05253.html)
- [linux-riscv: Preserve IMSIC and APLIC states (2025-08)](https://lists.infradead.org/pipermail/linux-riscv/2025-August/074996.html)
- [CloudBEAR meetup 2025 summary](https://cloudbear.ru/cn/news-ru-meetup-2025.html)
- [Linux 7.2 PM pull coverage (pbxscience)](https://pbxscience.com/linux-7-2-power-management-spacemit-k1-risc-v-gets-thermal-sensors-nvidia-adds-acpi-cppc-v4-for-vera/)
- [LTP power management thread (2020-10)](https://lists.linux.it/pipermail/ltp/2020-October/019323.html)
- [Hibernation made nonportable (nexedi mirror commit, snippet only)](https://lab.nexedi.cn/kirr/linux/-/commit/ed309ce522185583b163bd0c74f0d9f299fe1826)
- [VisionFive 2 power and performance measurements (sbc-reviews issue 10)](https://github.com/geerlingguy/sbc-reviews/issues/10)
- [Pine64 forum: RISC-V vs arm64 battery use](https://forum.pine64.org/showthread.php?tid=18631)
- [Cloud-V RISC-V CI/CD](https://prod.cloud-v.co/risc-v-cicd)
- [RISE GitHub runners (Hackster)](https://www.hackster.io/news/rise-launches-risc-v-github-runners-providing-ci-and-build-services-free-to-open-source-projects-559fa92fa713)
- [Linaro testing automation](https://www.linaro.org/services/testing-automation)