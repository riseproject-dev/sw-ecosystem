---
title: Linux boot and MMU
parent: Project Reports
color: green
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
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: dtc
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: U-Boot
    relation: test-dependency
    criticality: optional
  - name: Buildroot
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-boot-and-mmu" %}

# Linux boot and MMU

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux boot and MMU<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux boot and MMU is the core of the RISC-V architecture port in mainline Linux (`arch/riscv/`). It is not a standalone package.

- **Boot and setup:** `head.S`, `setup.c`, the position-independent early code in `kernel/pi/`, and the early page tables in `mm/init.c`.
- **Paging:** Sv39, Sv48 and Sv57 on 64-bit, and Sv32 on 32-bit. `mm/init.c` defaults `satp_mode` to Sv57 and falls back to Sv48, then Sv39.
- **Address space and TLB:** KASLR, KASAN, ASID allocation (`mm/context.c`) and TLB flushing (`mm/tlbflush.c`).
- **Other MMU configurations:** NOMMU builds and SMP bring-up.
- **Kernel services:** traps, signals, ptrace, syscalls, modules and stack unwinding.

The boot contract with firmware is documented in [Early boot](https://docs.kernel.org/arch/riscv/boot.html).

- `a0` holds the hartid and `a1` holds the devicetree address.
- `satp` must be 0.
- The kernel must sit on a 2 MB boundary on rv64 (4 MB on rv32). The EFI stub relocates it if misaligned.
- Secondary harts are started through the SBI HSM extension. The older `RISCV_BOOT_SPINWAIT` method exists for firmware without HSM.
- UEFI/ACPI is an alternative handoff path.

**Governance.** No foundation or legal entity governs the code. It is GPL-2.0 mainline Linux, developed on the linux-riscv mailing list and git.

| Item | Value |
|---|---|
| MAINTAINERS entry | "RISC-V ARCHITECTURE", status Supported. It covers all of `arch/riscv/`, so boot and MMU have no separate maintainer. |
| Maintainers | Paul Walmsley (pjw@kernel.org), Palmer Dabbelt (palmer@dabbelt.com), Albert Ou (aou@eecs.berkeley.edu) |
| Reviewer | Alexandre Ghiti (alex@ghiti.fr) |
| List | linux-riscv@lists.infradead.org |
| Tree | `git://git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git` |
| Patch tracker | [Patchwork linux-riscv](https://patchwork.kernel.org/project/linux-riscv/list/) |

There is no GitHub issue or PR tracker and no master tracking issue for this subsystem. The maintainers' employers are [NEEDS VERIFICATION].

**Corporate contributors.** Domain counts are only a proxy for employer. Two samples disagree on the ranking.

- **Last 300 non-merge commits touching `arch/riscv/mm`, `head.S`, `setup.c` and `entry.S`:**

| Domain | Commits |
|---|---|
| rivosinc.com | 85 |
| kernel.org | 36 |
| sifive.com | 28 |
| gmail.com | 24 |
| google.com | 11 |
| arm.com | 11 |
| iscas.ac.cn | 10 |
| linutronix.de | 9 |
| bytedance.com | 9 |
| ventanamicro.com | 8 |
| huawei.com | 6 |
| redhat.com | 5 |

- **160 commits to `arch/riscv/kernel` and `arch/riscv/mm` since 2026-05-01:** kernel.org (32), linux-foundation.org (29), linutronix.de (21), iscas.ac.cn (12), bytedance.com (11), sifive.com (8), tenstorrent.com (6), rivosinc.com (5).
- The `linux-foundation.org`, `linutronix.de` and `linux.dev` domains are mostly tree-wide maintainers applying changes. They do not indicate RISC-V employers.
- The recent sample shows Rivos far lower than in the 300-commit sample. The cause was not investigated.

**Community stance on new ports.** RISC-V has been mainline since 4.15, so there is no new port to consider. The stated limits are in [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/index.html).

- Patches for new extensions are accepted only if the spec is Frozen or Ratified.
- Vendor custom extensions are considered only if ratified, frozen, or implemented in widely available hardware.
- Maintainers state they dislike churn and prefer well-reviewed, tested code.
- Developers may keep out-of-tree trees for draft or custom extensions.

**RISE.** riseproject.dev lists "Kernel & Virtualization" as a working group. It does not name the Linux kernel as a RISE project. RISE involvement in boot and MMU is covered in Section 14.

## 2. Port History and Upstreaming Timeline

The port is fully upstream. Release tags below were checked by ancestry tests against release tags in the local clone (HEAD `05441d697f7f`, 2026-11-03) unless noted.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | First RISC-V commit, 76d2a0493a17 "RISC-V: Init and Halt Code" (Palmer Dabbelt). `head.S`, `smpboot.c`, `entry.S`, `module.c`, `signal.c`, `ptrace.c` and `stacktrace.c` all first appear in v4.15. | Kernel clone |
| 2019 | Christoph Hellwig posts "RISC-V nommu support v6". | [LKML thread](https://lore.kernel.org/all/20191113131802.GA9996@lst.de/T/) |
| v5.2 | ASID allocator (`mm/context.c`, 2019-03-27, Gary Guo). | Kernel clone |
| v5.4 | `tlbflush.c` (2019-08-21, Christoph Hellwig). | Kernel clone |
| v5.6 | `kasan_init.c`. | Kernel clone |
| v5.7 | `ptdump.c`, `traps_misaligned.c`, `cpu_ops_sbi.c`; eBPF JIT first added. | Kernel clone |
| v5.8 | Original NOMMU support per a Buildroot thread [NEEDS VERIFICATION]. The v5.8-rc1 `mmap_lock.h:81` boot BUG was fixed by toggling `mmu_enabled` in `head.S`. | [LKML 2020](https://lkml.iu.edu/hypermail/linux/kernel/2006.1/07558.html), [fix thread](https://lkml.iu.edu/hypermail/linux/kernel/2012.0/01575.html) |
| v5.13 | Kernel mapping moved outside the linear mapping; `kexec_relocate.S`. | Kernel clone |
| v5.17 | Sv48 support. The Fixes tag e8a62cc26ddf "riscv: Implement sv48 support" (2021-12-06, Alexandre Ghiti) is first in v5.17. | Kernel clone, [RFC](https://patchew.org/linux/20250411-riscv-dont-hang-on-noncanonical-paddr-v1-1-dc665a46246d@iencinas.com) |
| v5.18 | 9195c294bc58 "RISC-V: Add Sv57 page table support" (committed 2022-02-22). Falls back from 5-level to 4-level to 3-level. | Kernel clone |
| v5.19 | Sv48 layout documentation 9d19f2b5256e (authored 2021-12-06, committed 2022-06-01); `compat_signal.c`. | Kernel clone |
| v6.2 | `mm/pgtable.c`. | Kernel clone |
| v6.3 | 82dd33fde026 ASID stale-TLB crash fix (committed 2023-03-09). | Kernel clone |
| v6.4 | RV32 NOMMU merge e97be4fbc1b1 (2023-03-27); `no4lvl`/`no5lvl` (26e7aacb83df, 2023-04-26); `kernel/pi/`. | Kernel clone |
| v6.6 | KASLR 84fe419dc757 (merged 2023-09-05, series f57805555834); early boot document e79be4bea58f. | Kernel clone, [KASLR v3 cover](https://lkml.rescloud.iu.edu/2306.0/06019.html) |
| v6.7 | `cache-ops.c`. `boot.rst` and `vm-layout.rst` appear at their current path (earlier location not checked). | Kernel clone |
| v6.9 | 6065e736f82c TASK_SIZE fix for 64-bit NOMMU (committed 2024-04-09); fast GUP 3f910b7a522e. | Kernel clone |
| v6.10 | SiFive CIP-1200 sfence.vma workaround (20e03d702e00) and ASID helper macros (74cd17792d28). | Kernel clone |
| v6.12 | "Remove size limit on XIP kernel" (97d8894b6f4c). | Kernel clone |
| v6.16 | Enable interrupts during exception handling (969f028bf2c4). | Kernel clone |
| v6.18 | Generic TIF bits (41e871f2b63e), a step toward generic entry. | Kernel clone |
| v7.0 | User CFI (`usercfi.c`, `vdso_cfi/`). | Kernel clone |
| v7.1 | XIP support removed (9b3a2be84803); KASLR offset and satp exported in VMCOREINFO (d8e99133eb4a); `no5lvl` fix (db909bd7986c, committed 2026-05-01). | Kernel clone |
| v7.3 | ASID and Svinval in `update_mmu_cache()` (af842aea58d8, 905be00304bd); "riscv: further remove XIP" (abcdefbe4965). | Kernel clone |
| v7.4-rc1 (2026-11-01) | Jisheng Zhang's series: early ISA extensions, `RISCV_ISA_SV48`/`RISCV_ISA_SV57` (merge 1b8b67503725). | Kernel clone, [kernel.org releases](https://www.kernel.org/releases.json) |

**Notes on tags.**
- The early boot document commit e79be4bea58f is first in v6.6, while `boot.rst` at its current path appears in v6.7. The difference is a path move, not a conflict.
- 82dd33fde026 first appears in v6.3 (it was merged during the 6.3 release cycle).

**Key contributors.**
- Palmer Dabbelt: original port and maintainer. His committer role at Rivos for the Sv57 merge is from a single source [NEEDS VERIFICATION].
- Alexandre Ghiti (Rivos domain): Sv48/Sv57, `no4lvl`/`no5lvl`, KASLR, `kernel/pi/` and the early boot document.
- Christoph Hellwig: `tlbflush.c` and the original NOMMU patches.
- Gary Guo: ASID allocator.
- Jisheng Zhang: fast GUP and the Sv48/Sv57 early ISA series.
- Samuel Holland (SiFive): 64-bit NOMMU fixes.
- Nam Cao (Linutronix): XIP removal.
- Xu Lu (ByteDance): ASID/Svinval TLB flush work.
- Guo Ren (Alibaba DAMO Academy): `no5lvl` fix.
- Austin Kim (LG): VMCOREINFO export.
- Jiakai Xu (ISCAS): vmemmap alignment fix.
- Karl Mehltretter: memory hot-remove fix.
- Björn Töpel: linux-riscv GitHub CI and testing.

## 3. Upstream Support Tier

Linux has no tier system. The acceptance rules are in Section 1. RISC-V is listed as Supported in MAINTAINERS. Patchwork automation builds and tests each series against the riscv `for-next` and `fixes` branches, falling back to `master`. Patches that fail checks are unlikely to be applied.

Release-blocking criteria do not exist as a formal concept. Kernel.org releases are source tarballs, not per-architecture binaries. The most recent releases are mainline 7.4-rc1 (2026-11-01), stable 7.3.1 (2026-10-30) and 7.2.15 (2026-11-01, end of life), per [releases.json](https://www.kernel.org/releases.json).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tier policy | None (Linux has no tiers) | None | None |
| MAINTAINERS status | Data not available: not researched | Data not available: not researched | Supported |
| First mainline release | Data not available: not researched | Data not available: not researched | 4.15 |
| CI config in kernel tree | None (no architecture has one) | None | None |
| External CI | Data not available: not researched | Data not available: not researched | linux-riscv GitHub CI, syzbot (Section 7) |
| Binary releases from kernel.org | Source only | Source only | Source only |

## 4. Technical Architecture and RISC-V-Specific Subsystems

All components below are implemented for riscv64 in mainline. Quality assessment is limited to what the findings state: whether the implementation is assembly or C, and which ISA extensions it requires. Comparisons against amd64 and arm64 were not researched beyond the notes after the table. Data not available: amd64/arm64 equivalent coverage.

| Component | Files | First release | ISA extensions or requirements | Implementation |
|---|---|---|---|---|
| Early boot, entry, secondary start | `head.S`, `entry.S`, `kernel/pi/`, `efi-header.S` | v4.15 (`pi/` v6.4) | Pre-MMU code built `-fno-pie -mcmodel=medany`, no instrumentation | Assembly plus position-independent C |
| Page tables, paging modes | `mm/init.c`, `pgtable.h` | v4.15, Sv48 v5.17, Sv57 v5.18 | Sv39/Sv48/Sv57, Sv32 on rv32; Svnapot, Svpbmt | C |
| KASLR | `mm/init.c`, EFI stub | v6.6 | Virtual seed from devicetree; Zkr not used (patch noted "for another patch") | C |
| KASAN, KFENCE, VMAP_STACK | `kasan_init.c` | v5.6 (KASAN) | KASAN 64-bit only | C |
| ASID and TLB | `mm/context.c`, `tlbflush.c` | v5.2 / v5.4 | Svinval used in `update_mmu_cache()` since v7.3; SiFive CIP-1200 erratum workaround | C |
| NOMMU | `nommu_*` defconfigs | v5.8 [NEEDS VERIFICATION], RV32 v6.4 | None | C |
| SMP, CPU hotplug | `smpboot.c`, `cpu_ops_sbi.c`, `cpu_ops_spinwait.c` | v4.15 | SBI HSM | C |
| Traps, signals, ptrace, syscalls | `traps.c`, `signal.c`, `ptrace.c`, `sys_riscv.c` | v4.15 | User CFI regsets (v7.0) | C |
| Modules and relocations | `module.c`, `module-sections.c`, `tests/module_test/` | v4.15 / v4.17 | Set/sub and ULEB128 relocations tested | C plus asm tests |
| Stack unwinding | `stacktrace.c` | v4.15 | None | C |
| kexec and crash | `kexec_relocate.S`, `crash_save_regs.S` | v5.13 | None | Assembly |
| vDSO, compat vDSO | `vdso/`, `compat_vdso/`, `vdso_cfi/` | v4.15, compat v5.19, CFI v7.0 | None | Assembly |
| User CFI | `usercfi.c` | v7.0 | CFI extensions (names not in findings) | C |
| String and copy library | `arch/riscv/lib/*.S`, `uaccess_vector.S` | Not tied to a release | Vector uaccess/memcpy (covered in Vector and hwprobe reports) | Assembly |
| eBPF JIT | `net/bpf_jit_comp64.c` | v5.7 | `HAVE_EBPF_JIT` selected if `MMU` | Separate report |

**Paging modes and virtual layout.** From [vm-layout](https://docs.kernel.org/arch/riscv/vm-layout.html). The Sv32 section is still "TODO".

| Region | Sv39 | Sv48 | Sv57 |
|---|---|---|---|
| User space | 256 GB | 128 TB | 64 PB |
| fixmap | `ffffffc4fea00000` (6 MB) | `ffff8d7ffea00000` (6 MB) | `ff1bfffffea00000` (6 MB) |
| vmemmap | `ffffffc500000000` (4 GB) | `ffff8d8000000000` (2 TB) | `ff1c000000000000` (1 PB) |
| vmalloc/ioremap | `ffffffc600000000` (64 GB) | `ffff8f8000000000` (32 TB) | `ff20000000000000` (16 PB) |
| Direct map | `ffffffd600000000` (128 GB) | `ffffaf8000000000` (64 TB) | `ff60000000000000` (32 PB) |
| kasan | `fffffff700000000` (32 GB) | `ffffef8000000000` (16.5 TB) | `ffdf000000000000` (8 PB) |

Modules and BPF sit at `ffffffff00000000` and the kernel at `ffffffff80000000` in all three modes.

**Recent design points.**
- The `no5lvl` and `no4lvl` parameters downgrade the paging mode from the command line. They are read from the devicetree early, which works with ACPI because the EFI stub creates a devicetree carrying the command line. KASAN kernels compile uninstrumented copies of the libfdt and string functions for this ([26e7aacb83df](https://lore.kernel.org/r/20230424092313.178699-2-alexghiti@rivosinc.com)).
- Jisheng Zhang's 7.4-rc1 series replaces the runtime `pgtable_l4/l5_enabled` variables with early ISA-extension alternatives. For `access_ok(addr, 1)` the loads and branches become two `j`/`nop` instructions. `RISCV_ISA_SV48` and `RISCV_ISA_SV57` let embedded platforms choose a fixed mode while a single Image can still support Sv39, Sv48 and Sv57.
- Because RISC-V folds page-table levels at runtime, folded-level offset helpers return the parent entry. This caused the memory hot-remove bug in a0188cc13369 (Section 11).

**Cross-architecture notes available.**
- RISC-V KASLR moves its EFI-stub helper functions out of the arm64 stub for reuse.
- `no4lvl`/`no5lvl` are named as on x86.
- The `-z norelro` link handling for ld.lld is modelled on arm64 commit `aacd149b6238`.
- Nothing else was compared against amd64 or arm64.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild and Kconfig. There is no cmake or configure, and no Dockerfile in the tree.

**Native build on riscv64:**

    make defconfig && make -j$(nproc) Image modules dtbs

**Cross build with GNU tools:**

    make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
    make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs

**Cross build with LLVM** (`llvm.rst` marks riscv "Supported"):

    make ARCH=riscv LLVM=1 defconfig && make ARCH=riscv LLVM=1 -j$(nproc)

`CROSS_COMPILE` is not needed with `LLVM=1`. `LLVM_IAS=0` switches to the GNU assembler and then needs `CROSS_COMPILE`.

**Config targets.** `defconfig`, `rv64_randconfig`, `rv32_defconfig`, `rv32_randconfig`, `nommu_virt_defconfig`, `rv32_nommu_virt_defconfig`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig`. Fragments: `32-bit.config`, `64-bit.config` and `hardening.config`.

**Build targets.** `Image` (default), `Image.gz`, `.bz2`, `.lz4`, `.lzma`, `.lzo`, `.zst`, `.xz`, `loader`, `loader.bin`, and `vmlinuz.efi` (the default when `CONFIG_EFI_ZBOOT=y`).

**Toolchain minimums** (`scripts/min-tool-version.sh`, `changes.rst`; not riscv-specific):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| Clang/LLVM | 17.0.1 |
| binutils | 2.30 |
| GNU make | 4.0 |
| bash | 4.2 |
| flex / bison | 2.5.35 / 2.0 |
| pahole | 1.26 |
| Python | 3.9.x |
| openssl | 1.0.0 |
| Rust (optional) | 1.85.0 |
| bindgen (optional) | 0.71.1 |

**RISC-V-specific gates and why** (`arch/riscv/Kconfig`, `Makefile`):

- **Zicsr and Zifencei:** with GNU as 2.36 or newer, `-march` gets `_zicsr_zifencei` appended. Binutils 2.38 and GCC 12.1 moved CSR and `fence.i` out of base I. GCC older than 11.3.0 instead gets `-Wa,-misa-spec=2.2`.
- **Dynamic ftrace with Clang:** needs GNU as, or LLVM as with lld, or ld 2.36 or newer (ClangBuiltLinux issue 1817). With GCC it needs `-fpatchable-function-entry=8`.
- **DWARF5:** LLVM `as` or lld older than 18 sets `ARCH_HAS_BROKEN_DWARF5`.
- **Shadow call stack:** needs `ld --no-relax-gp`.
- **Clang LTO:** needs `-mllvm -mattr=+c -mllvm -mattr=+relax` (LLVM issues 59350 and 65090).
- **Vector (`RISCV_ISA_V`):** needs `-march=rv64imv`, `.option arch`, and lld or ld 2.38 or newer.
- **Zbb, Zba, Zbc, Zbkb:** need lld or ld 2.39 or newer.
- **Zabha, Zacas:** need `.option arch` support.
- **GNU as 2.36 gate at `Kconfig:890`:** the option it gates was not identified.

**Flags in `arch/riscv/Makefile`:**
- `-mabi=lp64` and `-melf64lriscv` for ld.
- `-mcmodel=medany` or `medlow`.
- `-mno-save-restore`, `-mno-riscv-attribute`, `-mno-arch-attr` and no unwind tables.
- `-mno-relax` for modules.
- `-mstrict-align` unless `CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS=y`.
- The base ISA string starts at `rv64ima`, with `fd`, `c` and `v` appended by Kconfig.
- Relocatable kernels use `-fPIE` and `-shared -Bsymbolic -z notext`.

**QEMU usage.** The only recipe in the tree is the KUnit config `tools/testing/kunit/qemu_configs/riscv.py`.

- It uses `-machine virt -cpu rv64 -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`, kernel `arch/riscv/boot/Image`, and command line `console=ttyS0`.
- Extra Kconfig: `ARCH_VIRT`, 8250 serial options, `SERIAL_OF_PLATFORM`, `RISCV_SBI_V01`, `SERIAL_EARLYCON_RISCV_SBI`.
- Run it with `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-`.
- The script exits if the OpenSBI blob is missing.
- A generic invocation is `qemu-system-riscv64 -M virt -smp 4 -m 2G -nographic -kernel arch/riscv/boot/Image -append "root=/dev/vda rw console=ttyS0" -drive file=rootfs.img,format=raw,if=virtio`. This was not verified against a primary source [NEEDS VERIFICATION].
- `riscv32.py` sets `NONPORTABLE`, `ARCH_RV32I` and machine `virt`.

**Known build failures.**
- A syzbot-listed bug "riscv/for-next build error (2)" had a patch pending [NEEDS VERIFICATION, single source].
- XIP builds were broken for 18 months in 2023 and 4 months in 2024, and again after commit a44fb5722199 "riscv: Add runtime constant support". XIP has since been removed (Section 12).
- All build facts here are from the local clone.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

No arm64/amd64 Kconfig comparison was performed. The matrix shows riscv64 status only. Data not available: arm64/amd64 columns.

| Feature | riscv64 status |
|---|---|
| Sv39 / Sv48 / Sv57 | Supported, runtime selection with fallback |
| Sv32 (rv32) | Supported (`ARCH_RV32I`); vm-layout doc section is TODO |
| KASLR (`RANDOMIZE_BASE`) | 64-bit only; virtual randomization via devicetree seed |
| KASAN, `KASAN_VMALLOC` | 64-bit only |
| KFENCE, VMAP_STACK, STRICT_KERNEL_RWX, PAGE_TABLE_CHECK | Present |
| RELOCATABLE | Present |
| SMP, HOTPLUG_CPU, NUMA | Present |
| COMPAT (32-bit userspace) | Present (since v5.19) |
| EFI_STUB | Present |
| kexec, kexec_file, crash dump | Present; KASLR offset and satp exported to VMCOREINFO since 7.1 |
| NOMMU | Supported for RV32 and RV64; `nommu_*` defconfigs |
| XIP | Removed in 7.1 |
| userfaultfd-WP (`HAVE_ARCH_USERFAULTFD_WP`) | Needs `RISCV_ISA_SVRSW60T59B` |
| Svnapot, Svpbmt | Present as Kconfig options |
| User CFI | Present since v7.0 |

**Functional gaps.**
- **XIP.** Removed in 7.1 after repeated breakage. A user needing XIP has no mainline path.
- **K210 MMU.** Not possible: the MMU CSRs are reachable only from M-mode, and OpenSBI PR #206 (K210 MMU support) was never accepted ([discussion](https://lists.infradead.org/pipermail/linux-riscv/2020-June/000783.html), [PR #206](https://github.com/riscv-software-src/opensbi/pull/206)). K210 stays NOMMU.
- **KASLR physical randomization.** Limited to the EFI stub with a firmware seed. The virtual mode depends on the bootloader supplying a correct seed.
- **KASLR positions.** The v3 cover letter says the early page table has a single PUD and PMD alignment applies, so there are fewer than 512 possible positions. This is from the 2023 cover letter and may have been superseded [NEEDS VERIFICATION].
- **Non-canonical load address.** Booting with DRAM at a non-canonical physical address and `no5lvl` hangs (Section 11).

**Performance gaps.** No Sv39/48/57 page-walk, TLB or boot-time benchmark was found. Data not available: boot MMU benchmarks searched on patchew, LKML mirrors, the RISE blog and the web. Available numbers:

- Removing the runtime `pgtable_l4/l5_enabled` loads and branches improved lmbench `lat_syscall write` by about 2.38% on TH1520. With the RISCV64 defconfig, `.text` shrank from 13439437 to 13314445 bytes (122 KB) ([267bb2b528b5, 36de74049ec8](https://lore.kernel.org/20261008150045.28905-1-jszhang@kernel.org)). The cover letter was blocked, so these figures come from commit messages in the clone.
- The fast-GUP patch (GUP_FAST_BENCHMARK, TH1520, cpufreq not enabled) reduced get time from 53203 us to 17711 us, about 3x. Put time was unchanged at about 5060-5085 us ([patch](https://patchew.org/linux/20231219175046.2496-1-jszhang@kernel.org/20231219175046.2496-5-jszhang@kernel.org), [thread](https://lists.infradead.org/pipermail/linux-riscv/2024-January/046685.html)). Fast GUP belongs to memory management more than to boot and MMU.
- A [Launchpad #2024935](https://bugs.launchpad.net/bugs/2024935) report shows a CPU slowdown on Allwinner D1 from about 1 s to about 2.7 s on Ubuntu 23.04. It looks like a platform or clock issue, so any MMU link is [NEEDS VERIFICATION].
- An Imperas vendor claim of booting RV64GC Linux in under 5 s is simulation-only and has no methodology.
- Data not available: riscv64 vs arm64 performance for this subsystem. The final web searches were refused by a search budget limit.

**Security hardening.** `hardening.config`, KASLR, STRICT_KERNEL_RWX, VMAP_STACK, shadow call stack (needs `ld --no-relax-gp`) and user CFI are present. A commit gating the shadow call stack reload on `sstatus.SPP` rather than `tp` (4d0697f19297) was merged by 7.4-rc1. A patch in an earlier XIP series moved shadow call stack setup into the common secondary entry path after the MMU is enabled.

**NaN / floating-point semantics.** Not applicable to boot and MMU. No findings.

## 7. CI/CD Infrastructure

The kernel tree contains no CI configuration for any architecture: no `.github`, `.gitlab-ci*`, `.travis*`, `.circleci`, `azure-pipelines`, `Jenkinsfile` or `.cirrus`. riscv64 CI is external to the tree.

**In-tree test hooks** (source only, not a CI service):
- kselftest `tools/testing/selftests/riscv/` with `RISCV_SUBTARGETS ?= abi hwprobe mm sigreturn vector cfi`, built only when `ARCH=riscv`. Run with `make TARGETS=riscv kselftest`. Relevant to this scope:
  - `mm` runs `mmap_default` and `mmap_bottomup` via `run_mmap.sh` (the second after `ulimit -s unlimited`), checking user address-space layout and mmap hint behaviour with Sv48/Sv57.
  - `sigreturn` is a static signal-frame test.
- KUnit `RISCV_MODULE_LINKING_KUNIT` (module relocations, in scope) and `RISCV_KPROBES_KUNIT` (out of scope), both defaulting to `KUNIT_ALL_TESTS`.
- `arch/riscv/configs/defconfig` has `# CONFIG_RUNTIME_TESTING_MENU is not set` and neither `KUNIT` nor `KPROBES`. No file in the tree shows these tests being run on riscv64.
- The generic `tools/testing/selftests/mm/` suite exists; riscv-specific logic in it was not confirmed.

**linux-riscv GitHub CI.** Announced by Bjorn Topel on 30 Sep 2024 ([announcement](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html)), with a follow-up on 10 Oct 2024 ([follow-up](https://lists.infradead.org/pipermail/linux-riscv/2024-October/061253.html)) that added U-Boot ACPI boot tests (AIA and non-AIA), a PREEMPT_RT fragment and a `-cpu=max` variant.

- Repositories: [linux-riscv/linux-riscv](https://github.com/linux-riscv/linux-riscv) (branch PRs that trigger runs), [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci) (shared scripts, also used by Patchwork) and `linux-riscv/docker` (build environment).
- Runners are RISE-sponsored GitHub runners. Everything runs in Docker and tests use QEMU, not real hardware.

| Workflow | Trigger | What it does |
|---|---|---|
| `series.yml` | PR head branch ends `_test` or `_manual` | `build_all.sh` then `test_all.sh`; results to SQUAD |
| `kselftest.yml` | PR head branch starts with `linus` or ends `_manual` | `kselftest.sh`; results to SQUAD |
| `testsuites.yml` | PR head branch ends `_manual` | Ubuntu defconfig build, then LTP, libhugetlbfs and xfstests |
| `patchwork.yml`, `sync.yml` | Not described in the findings | Not described in the findings |

- **Build matrix:** every `*defconfig` under `arch/riscv/configs/` for rv32 and rv64, plus fragments, `allmodconfig` (rv32 and rv64) and a fixed `rv64 allmodconfig plain gcc-old`. Each entry builds with gcc and llvm. `rv32_defconfig` is skipped by default.
- **Boot matrix:**
  - rv64 rootfs are alpine and ubuntu. rv32 rootfs are buildroot glibc and musl.
  - nommu, allmodconfig and randconfig are not booted.
  - rv64 CPU variants are `default64`, `server64`, `max64`, and `sifive` when `RISCV_ALTERNATIVE_EARLY` is set.
  - Firmware is `no_uefi`, plus `uboot_uefi` when `CONFIG_EFI=y`. Hardware description is `dt`, plus `acpi` when `CONFIG_ACPI=y` and UEFI is used.
  - QEMU uses `-smp 4`, with AIA `aplic-imsic` for `server64` and `max64`.
  - The command line is `root=/dev/vda2 rw earlycon console=tty0 console=ttyS0 panic=-1 oops=panic sysctl.vm.panic_on_oom=1`, plus `acpi=force` for ACPI.
  - kselftest runs only on `server64` + `uboot_uefi` + ubuntu + DT, with a 40 h timeout.
- Topel's announcement says kselftest runs use defconfig plus kselftest-merge on Linus's master and the bpf trees. It also says the ftrace suite panicked on 6.12-rc1, and that a summary dashboard (KCIDB under consideration) and more real-hardware testing were missing.
- **Paging-mode coverage:** no explicit Sv39/Sv48/Sv57 variant or `no4lvl`/`no5lvl` command line was found in the scripts read. `test_kernel.sh` showed none, and `utils.sh` and the other `kernel_tester.sh` helpers were not read. [NEEDS VERIFICATION] Boot-time `satp` mode selection may be exercised only through QEMU's default CPU.
- The CI is not an in-tree merge gate.

**syzbot.** [syzkaller upstream](https://syzkaller.appspot.com/upstream) lists one riscv64 manager, `ci-qemu2-riscv64`, with 112 crashes and 39,056 execs, running a commit from the riscv/linux.git tree. Only the first 100,000 of about 394,000 characters of the page were read, so other riscv instances may exist [NEEDS VERIFICATION].

**KernelCI, LKFT, 0-day.** The KernelCI dashboard was blocked by bot protection. A hosting provider page ([cloud-v.co](https://cloud-v.co/risc-v-access)) says it runs OpenSBI, U-Boot and Linux tests on RISC-V hardware through LAVA and KernelCI [NEEDS VERIFICATION]. The RISE hardware-in-the-loop post ([Tested on Real Silicon](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)) mentions KernelCI and kernel testing on boards. LKFT and 0-day were not checked.

**RISE runners.** The linux-riscv CI uses RISE-sponsored runners as stated above. The separate native [RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) service has no found use for kernel boot or MMU CI.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None | None | None |
| External CI | Data not available: not researched | Data not available: not researched | linux-riscv GitHub CI (QEMU), syzbot |
| Real hardware in CI | Data not available | Data not available | None confirmed (QEMU only) |

## 8. Distribution and Release Status

- **Upstream:** Linux is released as source tarballs. Mainline is 7.4-rc1 (2026-11-01), stable 7.3.1 and 7.2.15 (end of life), per [releases.json](https://www.kernel.org/releases.json).
- **Longterm kernels:** 6.18.60, 6.12.115, 6.6.161, 6.1.191, 5.15.224 and 5.10.273.
- **Subsystem availability:** boot and MMU code is part of every mainline and stable release since 4.15.
- **PyPI, RISE wheel builder, OCI:** not applicable. `linux-boot-and-mmu` returns HTTP 404 on PyPI and on the RISE wheel index.
- **Ubuntu 26.04 (resolute):** no package is named for the subsystem. `linux-image-generic` riscv64 presence in resolute was not confirmed [NEEDS VERIFICATION].
- **Past distro evidence:** Ubuntu has shipped riscv64 kernels, for example `linux-riscv 5.8.0-9-generic` ([Launchpad #1904912](https://answers.launchpad.net/bugs/1904912)) and `linux-image-5.19.0-1009-allwinner`. openSUSE bug reports for Unmatched imply riscv64 kernels there ([1197422](https://lists.opensuse.org/archives/list/kernel-bugs@lists.opensuse.org/thread/MUGJEAWH6H5Z3KEM2U4GXJ7YYS4UNPMS/)). Debian, Fedora and Arch were not checked. Data not available.
- **Vendor kernels:** a 5.10.x vendor kernel runs on RISE EM-RV1 nodes ([RISE runners post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). It is a single mention.
- **Getting a working binary:** build from source (Section 5), or install the distro kernel package on a supported distro. Deployment also needs a bootloader and firmware (OpenSBI, U-Boot or UEFI) meeting the boot contract in Section 1.

## 9. Dependencies

The subsystem has no library dependencies at runtime. Its boot code needs only the toolchain, the firmware boot contract, and dtc plus the generic `of` code for devicetree builds. Readiness colors below are from the cited project reports. Package-graph availability was not queried, so graph-derived availability claims are [NEEDS VERIFICATION].

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | The subsystem itself (runtime-dependency, critical) | Builds natively and cross-compiled with gcc or clang | See Section 7 | Mainline and stable source releases; distro packages not confirmed | Mainline since 4.15, MAINTAINERS Supported |
| OpenSBI | Runtime firmware (critical); SBI HSM secondary-hart start, legacy fallbacks | Debian ships `opensbi`; Ubuntu 26.04 not confirmed | SBIUnit framework off by default and not run by CI. Open issue #353 (hang with high SMP count on QEMU virt) | v1.9 `rv-bin` tarball upstream | Readiness orange; hardening issues #426 and #415 open |
| GCC | Build (critical); minimum 8.1.0 | Fully upstream; Ubuntu `gcc-riscv64-linux-gnu` cited by the Rust report, not confirmed from the graph | Tertiary platform with no release-blocking criteria; upstream buildbots and a large riscv testsuite | Source only upstream; binaries from distros | Readiness blue; the GCC report notes miscompilation risk in its Section 4.3 |
| LLVM | Build (optional), `LLVM=1`; minimum 17.0.1 | `llvm` 1:21.1.6-71 cited for riscv64 in resolute | Not part of the required upstream pre-merge gate; riscv64 only in a QEMU user-mode job and a CI toolchain file | No riscv64 assets in upstream GitHub releases; distro packages | Readiness yellow; versions below 18 flagged `ARCH_HAS_BROKEN_DWARF5` |
| GNU binutils | Build (critical); minimum 2.30, extension gating needs ld 2.36 to 2.39 | binutils 2.46-3ubuntu2 Published for resolute riscv64 on Launchpad (2026-03-19) | Sourceware buildbot riscv64 builders on a VisionFive 2; pass state unverified (Jan 2024: gas/binutils zero failures, some ld failures) | Source only upstream; Ubuntu ships it | Readiness blue; builder freshness unverified |
| GNU make | Build (critical); minimum 4.0 | Architecture-neutral host tool, not researched | Not assessed | Not assessed | No project report found |
| dtc | Build (critical); compiles `arch/riscv/boot/dts/*`. Not on the kernel's tool-requirements page | Probable package `device-tree-compiler`, not looked up | Not assessed | Not assessed | No project report exists, though dtc is listed in projects.yml |
| QEMU | Test (critical); `qemu-system-riscv64 -M virt` | `1:10.2.1+ds-1ubuntu3` cited for resolute riscv64 | Upstream CI cross-compiles riscv64 but the test step is a no-op; no native riscv64 runner | Source only upstream; distro binaries | Readiness yellow; no boot/MMU-specific blocker found |
| U-Boot | Test (optional); DT or UEFI/ACPI handoff | Not independently confirmed in Ubuntu 26.04 | GitLab CI boots `qemu-riscv64` variants including SPL, S-mode and ACPI | Source only upstream | Readiness blue; a UEFI RSDP memory-type regression in versions >= 2024.10 can break kexec, fix status unconfirmed [NEEDS VERIFICATION] |
| Buildroot | Test (optional); builds rv32 rootfs (glibc and musl) used by the linux-riscv CI boot matrix; also referenced in a NOMMU thread | Not researched | Used as CI rootfs builder only | Not researched | No project report found [NEEDS VERIFICATION] |

**Indirect dependencies.**
- Rust and bindgen (with libclang) for `CONFIG_RUST`: minimum rustc 1.85.0 and bindgen 0.71.1. riscv64gc is Tier 2 with host tools. CI jobs for riscv64 are build-and-package only. Readiness yellow.
- pahole 1.26, flex, bison, bc, openssl, perl and pkg-config are architecture-neutral host tools. Their riscv64 package names and availability were not researched.

**Toolchain deep dive.** The riscv-specific toolchain gates are in Section 5. Binutils and GCC are the highest-risk critical dependencies. Both are blue-rated but carry formal tier gaps (GCC riscv64 tertiary, no release-blocking criteria) and unverified builder freshness (binutils). OpenSBI is rated orange, the lowest of the dependencies in this table.

## 11. Known Bugs and Active Issues

There is no GitHub issue tracker. Identifiers are commit SHAs, CVE numbers, Launchpad and openSUSE bug IDs, and mailing-list threads. lore.kernel.org and patchwork were not accessible, so open linux-riscv series could not be enumerated [NEEDS VERIFICATION].

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Encinas RFC (2025-04-11) | Boot hang when `set_satp_mode()` probes with a non-canonical physical load address | Open or unmerged, merge status unverified | Unrated | Reproduced in QEMU virt with DRAM base 0x800000000000 and `no5lvl`. Fixes e8a62cc26ddf. [RFC](https://patchew.org/linux/20250411-riscv-dont-hang-on-noncanonical-paddr-v1-1-dc665a46246d@iencinas.com) |
| db909bd7986c | `no5lvl` failure when vaddr is invalid | Fixed, v7.1 | Unrated | Guo Ren (Alibaba DAMO); same pa=0x800000000000 scenario; fixes 26e7aacb83df. Adds `is_vaddr_valid()` |
| CVE-2026-80682 | riscv/mm: use physical alignment for vmemmap_start_pfn | Fixed (45ebe4540817 first in v7.2; 11ad86830a78 not in clone) | CVSS 3.1 7.8 (CNA), Red Hat Moderate | Published 2026-08-28. Introduced by 476849b0fba4, exposed as a `sparse_init` warning by 9f94db4c7eaa. Affects 7.1, fixed in 7.1.8. [OpenCVE](https://app.opencve.io/cve/CVE-2026-80682) |
| CVE-2024-35987 | Fix loading 64-bit NOMMU kernels past the start of RAM | Fixed in stable 6.6.30, 6.8.9, 6.9 | Unrated | Regression from 3335068f8721 (v6.4). Fix via the NOMMU series merge d4b500cceb0e. [CVE record](https://cveawg.mitre.org/api/cve/CVE-2024-35987) |
| a0188cc13369 | Out-of-bounds page-table walk during memory hot-remove | Fixed, by 7.2-rc6 | Triggers `kernel BUG at include/linux/mm.h:1810` | Fixes c75a74f4ba19. Sv48 folds P4D; Sv39 folds P4D and PUD |
| 82dd33fde026 | ASID stale-TLB entry causes application crash | Fixed, v6.3 | Application crash | Correctness bug |
| 4d0697f19297, 59052a88ba5f, adadf6df0bd5, 8ac35bac70e7 | Entry shadow-call-stack reload, ptrace regset zero-init and CFI regset gating, stackframe walk offset | Fixed (7.4-rc1, after 7.3, after 7.3, 7.2-mw1) | Unrated | Individual SHAs |
| 5.8-rc1 | `mmap_lock.h:81` BUG during boot | Fixed | Boot failure | Fixed via `mmu_enabled` toggle in `head.S` |
| Launchpad #1904912 | linux-riscv 5.8.0-9-generic fails to boot in QEMU | Fixed in a later package build | Boot failure | [Bug](https://answers.launchpad.net/bugs/1904912) |
| 2024 thread | vmemmap out-of-bounds on Sv39 platform with two memory banks | Details not verified | Unrated | [NEEDS VERIFICATION] |
| openSUSE 1197422 | [riscv64][Unmatched] Crash during boot ("Unable to handle kernel paging request") | Status unknown | Boot failure | [NEEDS VERIFICATION] |
| openSUSE 1196357 | [riscv64][Unmatched] boot takes long time at efistub | Diagnosis unknown | Performance | EFI handling is covered in the EFI/ACPI/DT report [NEEDS VERIFICATION] |
| Launchpad #2024935 | Ubuntu 23.04 slowdown on Allwinner D1 | New, duplicate of #2021364 | Performance | Likely platform or clock; fix said to land in 6.2 per Emil Renner Berthing |
| syzbot | riscv/for-next build error (2) | Open, patch pending | Build | [NEEDS VERIFICATION] |
| Dependency: OpenSBI #353 | Hang with high SMP count on QEMU virt | Open | Boot hang | Listed in the OpenSBI report |
| Dependency: U-Boot | UEFI RSDP memory-type regression in versions >= 2024.10 breaks kexec | Fix status unconfirmed | Boot | [NEEDS VERIFICATION] |

**Correctness bugs.** The highest-impact items are the stale-TLB crash (82dd33fde026), the vmemmap alignment CVE (CVE-2026-80682, CVSS 7.8), the memory hot-remove walk bug (a0188cc13369), and the non-canonical-address boot hang (RFC, open). The hang and the `no5lvl` fix share the same root cause, so the hang's source in `set_satp_mode()` is not fully closed by the db909bd7986c fix: that fix skips satp detection when the vaddr is invalid, while the RFC covers the probe path with a non-canonical load address. Whether the two overlap is not confirmed [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

**Stated objections.**
- **XIP removal (7.1).** Nam Cao's commit message cites XIP breaking for 18 months in 2023, 4 months in 2024, and again since a44fb5722199. It says "Revert is possible if someone shows up complaining." Paul Walmsley queued it on 2026-02-12 ([thread](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085490.html)).
  - Kunwu Chan (2026-02-13) asked that `CONFIG_XIP_KERNEL` not be removed and, with Zhouyi Zhou, offered to maintain it ([reply](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085511.html)).
  - Jisheng Zhang (2026-02-20) asked for a real, valid XIP use. He argued the arch-code cost outweighs the benefit and that people who have never contributed to the code cannot maintain it ([reply](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085658.html)).
  - Charles Mirabile (Red Hat, 2026-03-26) wanted XIP kept. He listed three bugs with fixes planned, said XIP is not compatible with M-mode Linux, and aimed to combine M-mode, no-MMU Linux and XIP on the Unleashed ([reply](https://lists.infradead.org/pipermail/linux-riscv/2026-March/088339.html)). No such fixes were found in the clone.
  - The removal landed anyway. Conor Dooley's reply was acked but its content was not read.
- **Non-canonical address RFC.** Alexandre Ghiti said Sv39 is the only valid fallback and suggested using the devicetree `mmu-type` with probing as a fallback. The author calls the `canonical_vaddr()` check "not bulletproof".

**Technical blockers.** None found for boot and MMU on riscv64 in the files read.

**Organizational blockers.**
- The spec-stability rule (Frozen or Ratified) limits adoption of new extensions.
- Maintainers state they dislike churn.
- The CI is not an in-tree merge gate, and the Patchwork CI behaviour is as described in Section 3.
- RISE sponsors the CI runners but no RISE-funded boot or MMU work was found.

**Acceptance probability.** There is no new port to accept. Data not available: a quantitative acceptance rate. New work is currently being merged in each release (Section 2), with the main constraint being the spec-stability rule.

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream
- **Justification:** arch/riscv boot and MMU (Sv39/Sv48/Sv57, KASLR, ASID/TLB, NOMMU, SMP, traps, signals, ptrace, modules) has been in mainline since Linux 4.15 and ships in every kernel.org mainline and stable release. Upstream test infrastructure builds and boots riscv64 and runs tests: the [linux-riscv GitHub CI](https://github.com/linux-riscv/github-ci) boots rv64 and rv32 kernels in QEMU and runs kselftest (including riscv/mm), patchwork builds and tests each series, syzbot runs a riscv64 QEMU manager, and in-tree kselftest/KUnit riscv hooks exist ([tools/testing/selftests/riscv](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/selftests/riscv)). Maintainers are listed as "Supported" in [MAINTAINERS](https://docs.kernel.org/arch/riscv/index.html).

**Pending work that could change the grade.**
- The Encinas RFC (2025-04-11) to stop the boot hang with non-canonical physical load addresses has unverified merge status.
- Jisheng Zhang's Sv48/Sv57 early-ISA-extension series landed in 7.4-rc1.
- XIP support was removed in 7.1. This is a lost feature, not a gap in the mainstream path. The generic-entry conversion is in progress.
- RISE sponsors the linux-riscv CI runners and has a Kernel and Virtualization WG ([Svinval issue #56](https://github.com/riseproject-dev/kernel-and-virtualization-wg), closed 2026-07-17), but no RISE-funded boot or MMU work was found.

**Caveats that do not change the grade.**
- Explicit Sv39/Sv48/Sv57 or `no4lvl`/`no5lvl` coverage in CI was not confirmed.
- KernelCI and LKFT riscv coverage, and open linux-riscv series, could not be checked because lore and patchwork were blocked.
- The CI is not an in-tree merge gate, so confidence is medium-high.
- Distro kernel packages (for example Ubuntu 26.04 riscv64) were not confirmed.

## 14. Investment Analysis

**RISE check (done first).** No RISE-funded Linux boot or MMU work was found.

- No post on the RISE blog (20 posts reviewed from page 1 and 2 of the feed, 2025-09-01 to 2026-10-30) covers boot or MMU. Posts before 2025-09-01 were not covered.
- The only kernel-related RISE items are the Kernel and Virtualization WG repo (62 issues, project board 14) and its issue #56 "Svinval support" (label `kernel:linux`, milestone 2024H1, closed 2026-07-17). The issue body was not read. Svinval is a TLB-invalidation extension, so this is a possible indirect link to the TLB flush work in `update_mmu_cache()`, which was authored by ByteDance.
- `riseproject-dev/linux` is a plain fork of torvalds/linux with only `master` visible and no relevant commits.
- RISE sponsors the linux-riscv CI runners. The separate RISE RISC-V Runners service has no found kernel boot use.
- Not checked: the `kernel:linux` issues on project board 14, the `docs` meeting slides, and the RFP list (the WG wiki page returned 404).

The effort figures below are the author's planning estimates, not sourced facts. Because the subsystem is upstream and mature, the largest investment lever is test coverage and hardware validation, not enablement.

### 14.1 Functional Enablement

- Track the non-canonical-address boot hang RFC and the `no5lvl` fix. Determine whether the RFC is merged, and if not, test and review it on target silicon with a high DRAM base.
- Validate that Sv39, Sv48 and Sv57 each boot on target silicon, with and without `no4lvl`/`no5lvl`.
- Do not invest in XIP. It is removed from mainline and a revert is only possible if a user "shows up complaining".
- Confirm distro kernel packages (Ubuntu 26.04 `linux-image-generic` riscv64, Debian, Fedora) on target hardware.

### 14.2 Performance Optimization

- No boot or MMU benchmark data exists. Establish a baseline on target silicon: boot time, page-walk and TLB-flush cost per paging mode, and the effect of the 7.3 ASID/Svinval `update_mmu_cache()` changes and the 7.4-rc1 early-ISA series.
- Compare against arm64 and amd64 on equivalent hardware. Data not available.

### 14.3 CI/CD Infrastructure

- Add explicit Sv39/Sv48/Sv57 and `no4lvl`/`no5lvl` runs to the linux-riscv github-ci matrix, which currently has none confirmed.
- Add real-hardware boot jobs. Töpel's announcement named this as missing. The RISE hardware-in-the-loop work and board farm are possible hosts.
- Confirm and, if absent, add KernelCI/LKFT riscv coverage and a summary dashboard (KCIDB was under consideration).
- Add nommu boot tests. The current CI does not boot nommu.

### 14.4 Ecosystem Enablement

There is no package ecosystem for this subsystem (Section 10 omitted). Related items belong to dependency reports: OpenSBI issue #353 and hardening issues, and the U-Boot UEFI RSDP regression that can break kexec.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Determine merge status of the non-canonical-address boot hang RFC and test or review it | 2-3 | Internal kernel team with linux-riscv reviewers | High |
| Functional | Sv39/Sv48/Sv57 and `no4lvl`/`no5lvl` boot validation on target silicon | 3-4 | Internal kernel team | High |
| Functional | Verify distro kernel packages for riscv64 | 1 | Internal distro team | Medium |
| Performance | Baseline boot and TLB benchmarks on target silicon | 4-6 | Internal kernel team | Medium |
| Performance | Evaluate Svinval/ASID `update_mmu_cache()` and early-ISA changes on target silicon | 3-4 | Internal kernel team | Medium |
| CI/CD | Add paging-mode coverage to linux-riscv github-ci | 2-3 | Internal kernel team with CI maintainers (Töpel) | High |
| CI/CD | Real-hardware boot jobs (RISE board farm or equivalent) | 4-8 | RISE Kernel and Virtualization WG (proposal) | High |
| CI/CD | Verify and add KernelCI/LKFT riscv coverage | 1-2 | Internal kernel team | Medium |
| CI/CD | Nommu boot tests in CI | 1-2 | Internal kernel team | Low |
| Ecosystem | Track OpenSBI #353 and U-Boot UEFI RSDP regression | 1 | Firmware team | Medium |

## 15. References

- [Linux kernel git tree (torvalds)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [RISC-V kernel documentation index](https://docs.kernel.org/arch/riscv/index.html)
- [RISC-V early boot documentation](https://docs.kernel.org/arch/riscv/boot.html)
- [RISC-V virtual memory layout](https://docs.kernel.org/arch/riscv/vm-layout.html)
- [kernel.org releases.json](https://www.kernel.org/releases.json)
- [Patchwork linux-riscv](https://patchwork.kernel.org/project/linux-riscv/list/)
- [riscv selftests tree](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/selftests/riscv)
- [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci)
- [linux-riscv/linux-riscv](https://github.com/linux-riscv/linux-riscv)
- [Github RISC-V CI announcement (Töpel, 2024-09-30)](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html)
- [Github RISC-V CI follow-up (2024-10-10)](https://lists.infradead.org/pipermail/linux-riscv/2024-October/061253.html)
- [syzkaller upstream dashboard](https://syzkaller.appspot.com/upstream)
- [cloud-v.co RISC-V access](https://cloud-v.co/risc-v-access)
- [XIP removal thread, Walmsley reply](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085490.html)
- [XIP removal, Kunwu Chan](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085511.html)
- [XIP removal, Jisheng Zhang](https://lists.infradead.org/pipermail/linux-riscv/2026-February/085658.html)
- [XIP removal, Charles Mirabile](https://lists.infradead.org/pipermail/linux-riscv/2026-March/088339.html)
- [XIP removal patch (msgid)](https://patch.msgid.link/20260202115403.2119218-1-namcao@linutronix.de)
- [XIP fix series cover letter (2023)](https://lists.infradead.org/pipermail/linux-riscv/2023-December/045560.html)
- [XIP fix series applied notice](https://lkml.iu.edu/hypermail/linux/kernel/2401.1/04652.html)
- [64-bit NOMMU series applied notice](https://lists.infradead.org/pipermail/linux-riscv/2024-April/052075.html)
- [64-bit NOMMU series cover letter](https://lore.kernel.org/r/20240227003630.3634533-1-samuel.holland@sifive.com)
- [RISC-V 32 NOMMU RFC (2023)](https://lore.kernel.org/lkml/Y8sAQqOo4DX7GwHN@spud/T/)
- [RISC-V nommu support v6 (2019)](https://lore.kernel.org/all/20191113131802.GA9996@lst.de/T/)
- [Kendryte K210 MMU discussion](https://lists.infradead.org/pipermail/linux-riscv/2020-June/000783.html)
- [OpenSBI PR #206](https://github.com/riscv-software-src/opensbi/pull/206)
- [Don't output a bogus mmu-type on NOMMU (android-kvm)](https://android-kvm.googlesource.com/linux/+/8810d7feee5a0cf88d7854f4ad4930a4fab8dd70)
- [KASLR v3 cover letter](https://lkml.rescloud.iu.edu/2306.0/06019.html)
- [KASLR series (February 2023), Töpel review](https://lkml.rescloud.iu.edu/2302.2/05249.html)
- [KASLR patch 84fe419dc757 (lore)](https://lore.kernel.org/r/20230722123850.634544-2-alexghiti@rivosinc.com)
- [no4lvl/no5lvl patch (lore)](https://lore.kernel.org/r/20230424092313.178699-2-alexghiti@rivosinc.com)
- [no5lvl fix patch (msgid)](https://patch.msgid.link/20260125055212.433163-1-guoren@kernel.org)
- [VMCOREINFO export patch (msgid)](https://patch.msgid.link/aYwKUE3ZzN7/ZY/A@adminpc-PowerEdge-R7525)
- [Jisheng Zhang Sv48/Sv57 series cover letter](https://lore.kernel.org/20261008150045.28905-1-jszhang@kernel.org)
- [Memory hot-remove fix patch (msgid)](https://patch.msgid.link/20260729012132.24882-1-kmehltretter@gmail.com)
- [update_mmu_cache ASID patch (msgid)](https://patch.msgid.link/20260715132009.10634-2-luxu.kernel@bytedance.com)
- [Non-canonical boot hang RFC](https://patchew.org/linux/20250411-riscv-dont-hang-on-noncanonical-paddr-v1-1-dc665a46246d@iencinas.com)
- [CVE-2026-80682 (OpenCVE)](https://app.opencve.io/cve/CVE-2026-80682)
- [CVE-2024-35987 (CVE record)](https://cveawg.mitre.org/api/cve/CVE-2024-35987)
- [Fast GUP patch (patchew)](https://patchew.org/linux/20231219175046.2496-1-jszhang@kernel.org/20231219175046.2496-5-jszhang@kernel.org)
- [Fast GUP thread](https://lists.infradead.org/pipermail/linux-riscv/2024-January/046685.html)
- [LKML 2020 mmap_lock thread](https://lkml.iu.edu/hypermail/linux/kernel/2006.1/07558.html)
- [LKML mmu_enabled fix thread](https://lkml.iu.edu/hypermail/linux/kernel/2012.0/01575.html)
- [Launchpad #2024935](https://bugs.launchpad.net/bugs/2024935)
- [Launchpad #1904912](https://answers.launchpad.net/bugs/1904912)
- [openSUSE bug 1197422 thread](https://lists.opensuse.org/archives/list/kernel-bugs@lists.opensuse.org/thread/MUGJEAWH6H5Z3KEM2U4GXJ7YYS4UNPMS/)
- [openSUSE bug 1196357 thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/MUGJEAWH6H5Z3KEM2U4GXJ7YYS4UNPMS/)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE leadership](https://riseproject.dev/leadership/)
- [RISE kernel-and-virtualization-wg repo](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE: Tested on Real Silicon](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)