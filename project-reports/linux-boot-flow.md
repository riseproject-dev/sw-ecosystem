---
title: Linux boot flow
parent: Project Reports
color: orange
dependencies:
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
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: U-Boot
    relation: runtime-dependency
    criticality: optional
  - name: EDK2
    relation: runtime-dependency
    criticality: optional
  - name: kexec-tools
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-boot-flow" %}

# Linux boot flow

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux boot flow<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux boot flow on riscv64 is a subsystem of the mainline Linux kernel, not a standalone package. It covers the path from firmware handoff to the kernel's first C code and the mechanisms that restart or replace a running kernel:

- The boot entry point and Image header (`arch/riscv/kernel/head.S`, `arch/riscv/include/asm/image.h`). The header is 64 bytes, currently version 0.2, with `magic2` = "RSC\x05".
- The PE/COFF header embedded in the Image (`efi-header.S`).
- Position-independent early code that parses the FDT and command line before relocation (`arch/riscv/kernel/pi/`).
- The EFI stub and EFI runtime support (`drivers/firmware/efi/libstub/riscv*.c`, `drivers/firmware/efi/riscv-runtime.c`, `arch/riscv/kernel/efi.c`).
- ACPI (`arch/riscv/kernel/acpi.c`, `acpi_numa.c`, `drivers/acpi/riscv/`).
- SMBIOS/DMI (`arch/riscv/include/asm/dmi.h`).
- kexec and kdump (`machine_kexec*.c`, `kexec_elf.c`, `kexec_image.c`, `crash*.c`).
- Relocation and KASLR (Kconfig `RELOCATABLE`, `RANDOMIZE_BASE`).

Device-tree layout under `arch/riscv/boot/dts/` is in scope only as structure. SoC content belongs to the Linux SoC support report. OpenSBI and U-Boot content belongs to their own reports.

The boot contract is documented in [RISC-V boot requirements](https://docs.kernel.org/arch/riscv/boot.html):

- The firmware enters the kernel with `a0` = boot hartid, `a1` = devicetree address, and `satp` = 0 (MMU off).
- The kernel expects a PMD-aligned placement: 2 MB on rv64, 4 MB on rv32. The EFI stub relocates the kernel physically if it is not aligned.
- Hardware is described by a devicetree or by ACPI tables. Under UEFI, both are passed through the EFI configuration table. When ACPI is used, the EFI stub still creates a tiny devicetree.
- Under UEFI, the kernel populates system memory only from the EFI memory map. Firmware must convert `/reserved-memory` `no-map` and `reusable` attributes to EFI equivalents.
- Secondary harts start by one of two methods. `RISCV_BOOT_SPINWAIT` releases all harts and one wins a lottery. It is for older firmware without SBI HSM and for M-mode kernels. Ordered booting releases one hart, which starts the rest via SBI HSM. Ordered booting is preferred because it supports CPU hotplug and kexec.
- The boot hartid comes from `RISCV_EFI_BOOT_PROTOCOL` (preferred). The devicetree `boot-hartid` subnode is deprecated. New firmware must implement the protocol.

**Governance.**

- Boot flow has no foundation or governing body of its own. It is developed by the kernel community on mailing lists and git.kernel.org.
- The `boot.rst` source carries `SPDX-License-Identifier: GPL-2.0` and contains no governance or foundation statement.
- The MAINTAINERS entry "RISC-V ARCHITECTURE" lists Paul Walmsley, Palmer Dabbelt and Albert Ou as maintainers and Alexandre Ghiti as reviewer. Status is Supported. The list is linux-riscv@lists.infradead.org. The tree is `git://git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`. Patchwork is at [patchwork.kernel.org/project/linux-riscv](https://patchwork.kernel.org/project/linux-riscv/list/).
- ACPI for RISC-V (`drivers/acpi/riscv/`, `include/linux/acpi_rimt.h`) is maintained by Sunil V L (Ventana Micro, from his email domain).
- EFI including libstub is maintained by Ard Biesheuvel, with Ilias Apalodimas (Linaro, from email domain) as reviewer.
- Generic kexec is maintained by Andrew Morton, Baoquan He, Mike Rapoport, Pasha Tatashin and Pratyush Yadav. The list is kexec@lists.infradead.org.
- There is no RISC-V-specific EFI or kexec maintainer entry. RISC-V boot code goes through the RISC-V tree, with EFI and kexec owned by their generic maintainers.
- The employers of Walmsley, Dabbelt, Ou, Ghiti and Biesheuvel were not established [NEEDS VERIFICATION].

**Corporate sponsors (by commit authorship).** Commit-author email domains since 2024-01-01 on the boot paths show:

| Domain | Commits |
|---|---|
| linux-foundation.org | 23 |
| ventanamicro.com | 15 |
| rivosinc.com | 10 |
| kernel.org | 8 |
| gmail.com | 8 |
| sifive.com | 4 |
| intel.com | 3 |

Huawei, Arm, Red Hat and others have single-digit counts. The linux-foundation.org count is most likely maintainer or committer sign-offs [NEEDS VERIFICATION]. Named contributors in the commits reviewed include Ventana, Rivos, Intel, StarFive, Huawei, FORTH, Western Digital, Meta, NVIDIA, ISCAS, KylinOS, Picoheart, ByteDance, Red Hat and Qualcomm (the last via Sunil V L's `oss.qualcomm.com` address).

**RISE relationship.**

- RISE members (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General includes Andes, Canonical, ESWIN, ISCAS, Microchip, SpacemiT, ZTE and others) include several boot-flow contributors' employers.
- Ventana Micro Systems and Rivos are not RISE members, yet they employ heavy boot-flow contributors.
- No RISE blog post, repository, project or funded work dedicated to boot flow was found. Details are in Section 14.

**Community culture on changes.**

- The kernel has no "new port" process for RISC-V, which has been mainline since v4.15.
- [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) in the tree sets the policy. Patches for new extensions are accepted only if the spec is Frozen or Ratified by RISC-V International. For UEFI Forum specs the bar is a published ECR. Vendor custom extensions are considered only if ratified or implemented in widely available hardware.
- The document states that "Linux maintainers disapprove of churn" and prefers well-reviewed, tested code over experimental code.
- Draft extensions and draft firmware interfaces stay out of mainline.
- The direction on boot is firmware-side standardization. `RISCV_EFI_BOOT_PROTOCOL` replaces devicetree hartid passing, and ACPI is supported alongside devicetree.

## 2. Port History and Upstreaming Timeline

The RISC-V port is fully upstream. The first `arch/riscv` commit is 76d2a0493a17 "RISC-V: Init and Halt Code" (Palmer Dabbelt, author date 2017-07-10), first released in v4.15. Dates below are committer dates from the kernel clone (HEAD 05441d697f7f, v7.4-rc1-132) unless marked. Release tags come from `git describe --contains`.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 (author date) | First `arch/riscv` commit, includes `head.S`; released in v4.15 | commit 76d2a0493a17 |
| 2019-07-31 | Image header doc converted to ReST (Mauro Carvalho Chehab); v5.4-rc1 | 638b642f82bb |
| 2019-10-03, 2019-12-19 | Magic number byte-order fix (Chester Lin, v5.5-rc1) and typo fixes (Atish Patra, v5.6-rc1) | 185271a1fa07, 1d5c17e47028 |
| 2019-10-28 | `loader.bin` wrapper for the Image; v5.5 | `arch/riscv/boot/loader.S` |
| 2020-10-02 | EFI stub (Atish Patra, WDC); v5.10-rc1 | d7071743db31 |
| 2021-04-19 | kexec and kdump (Nick Kossifidis, FORTH); v5.13-rc1 | fba8a8674f68, e53d28180d4d |
| 2022-05-19 | `RISCV_EFI_BOOT_PROTOCOL` (Sunil V L, Ventana); v5.19-rc1 | 3f68e69520d3 |
| 2022-07-19 | 64-bit boot-hartid on RV64; v6.0-rc1 | 171549f829df |
| 2022-04-08 (author date) | kexec_file support (Liao Chang, Huawei); v5.19-rc1 | 6261586e0c91 |
| 2023-04-24 | Position-independent early code in `arch/riscv/kernel/pi/`; v6.4 | `pi/` directory first commit |
| 2023-06-01 | ACPI core build, `setup_arch()` init, RINTC cache, RHCT code (Sunil V L); v6.5-rc1 | a91a9ffbd3a5, 724f4c0df766, f99561199470, e6b9d8eddb17 |
| 2023-08-18 | Early boot document (Alexandre Ghiti, Rivos); v6.6-rc1 | e79be4bea58f, 180bb41d61b7 |
| 2023-09-05 | KASLR in the EFI stub using generic functions (Ghiti); v6.6-rc1 | b7ac4b8ee73d |
| 2023-10-10 | Docs moved to `Documentation/arch/riscv/`; v6.7-rc1 | ed843ae947f8 |
| 2023-10-31 | "RISC-V: ACPI improvements" series merged; v6.7-rc1 | b8c2f6617fd7 |
| 2024-06-26 | SMBIOS/DMI support (Haibo Xu, Intel); v6.11-rc1 | d6ecd188937f |
| 2024 (v6.11-rc1) | ACPI NUMA via SRAT/SLIT (Haibo Xu); SPCR console (Sia Jee Heng, StarFive) | eabd9db64ea8, 38738947db38 |
| 2024-08-12 (author date) | ACPI PCI support (Sunil V L); v6.12-rc1 | 01415e78cf72 |
| 2025-04-09 | `kexec_file` Image/ELF loaders (Song Shuai); v6.16 | 809a11eea8e8 |
| 2025-08-18 (author date) | ACPI RIMT (IOMMU mapping table, Sunil V L); v6.18-rc1 | 8f7729552582 |
| 2026-04 | FADT revision check updated to 6.6 (Yufeng Wang, KylinOS); `acpi_get_cpu_uid()` (Chengwen Feng, Huawei); v7.1-rc1 | dd5984493382, 0c8231994e43 |
| 2026-06 | kexec_file segment placement constrained to the direct map (Han Gao, ISCAS); v7.2-rc1 | b67a1ee0db00 |
| 2026-06-29 | kexec_file crashk_low_res fix, crash_prepare_headers() simplification, crashkernel CMA reservation (Jinjie Ruan, Huawei); v7.3-rc1 | 5fc6e7d45373, 7b078a0aa275, a037fe3c58ed |
| 2026-08-07 | EFI runtime poweroff (Atish Patra, Meta) and ACPI table upgrade (Vivian Wang, ISCAS); v7.3-rc1 | d8d0fb556e53, 6a48dea3449c |
| 2026-10-06 | EFI libstub `image_size` change (Jason Gunthorpe, NVIDIA); v7.4-rc1 via efi-next merge 89d2d7bf0698 | fd4465f49b53 |
| 2026-10-05 | Crash hotplug `arch/riscv/kernel/crash.c` (Rui Qi, ByteDance); past v7.4-rc1, not in any release tag | commit in clone |

Notes on dates and files:

- Several commits have different author and committer dates. For example, 171549f829df was authored 2022-05-27 and committed 2022-07-19. Release tags in this report come from the clone and committer dates.
- The documentation files first appear under `Documentation/arch/riscv/` in v6.7. The early boot document itself was committed in v6.6-rc1 at the old path.
- 81bbcff0c053 ("Prevent NULL pointer dereference in machine_kexec_prepare()", Tao Liu, Red Hat) first appears in v7.2-rc3 (`git tag --contains`).
- The kexec and crash code is in `kexec_elf.c`, `crash.c`, `crash_dump.c` and `crash_save_regs.S`. There is no `crash_core.c`, `elf_kexec.c` or `drivers/acpi/riscv/cpufeature.c` in the RISC-V tree.

Key contributors by organization: Ventana (Sunil V L: EFI boot protocol, ACPI, RHCT, RIMT, PCI), Rivos (Alexandre Ghiti: early-boot doc, KASLR), Western Digital and Meta (Atish Patra: EFI stub, EFI poweroff), FORTH (Nick Kossifidis: kexec/kdump), Huawei (Liao Chang, Li Zhengyu, Jinjie Ruan, Chengwen Feng), Intel (Haibo Xu: SMBIOS, NUMA), StarFive (Sia Jee Heng: SPCR).

Mailing-list items could not be verified on lore (lore.kernel.org was not accessible) and are listed in Section 11 and Section 13 [NEEDS VERIFICATION].

## 3. Upstream Support Tier

The kernel has no tier system for ports. Support status is the MAINTAINERS `S:` field:

- RISC-V ARCHITECTURE: Supported.
- EFI: Maintained.
- ACPI for RISC-V: the `ACPI FOR RISC-V (ACPI/riscv)` MAINTAINERS entry (Sunil V L) has status Maintained.

**Evidence on CI and release status.**

- The kernel tree contains no `.gitlab-ci*`, `.github`, `.travis`, `.circleci`, `.cirrus.yml`, `azure-pipelines.yml`, `Jenkinsfile`, Buildbot, KernelCI, LKFT or TuxSuite configuration. A path search of the whole tree returned nothing.
- MAINTAINERS references Patchwork but no CI or test-farm entry for RISC-V ARCHITECTURE. The grep for `kernelci` and `lkft` in MAINTAINERS returned nothing. The entry bodies for the boot-related entries were not read in full.
- `patch-acceptance.rst` states that patchwork CI builds and tests patches against the RISC-V `for-next` and `fixes` branches and that patches failing checks are unlikely to be applied. The patchwork instance itself could not be reached, so what it executes (build only, or boot tests) is [NEEDS VERIFICATION].
- Upstream publishes only source. There are no official riscv64 binaries from upstream.
- Release-blocking status for riscv64 boot: Data not available. No kernel CI configuration, MAINTAINERS entry or kselftest page defines it, and the KernelCI dashboard and lore were not accessible.

**Comparison table.** Only items documented in the findings are filled in. Everything else was not researched.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MAINTAINERS status | Data not available: not researched | Data not available: not researched | Supported |
| In-tree CI config | Data not available | Data not available | None |
| kexec selftests (`tools/testing/selftests/kexec/Makefile`) | Built (x86) | Not built (Makefile enables only x86 and ppc64le) | Not built |
| KHO selftest configs (`tools/testing/selftests/kho/`) | `x86.conf` | `arm64.conf` | None |
| KUnit QEMU config (`tools/testing/kunit/qemu_configs/`) | Data not available | Data not available | `riscv.py` and `riscv32.py` |
| Official upstream binaries | None (kernel ships source only) | None | None |
| Distro kernel packages | Data not available | Data not available | Exist (Ubuntu `linux-image-*`, openSUSE, Arch `linux`); riscv64 patch status unchecked |

The generic EFI stub code (`efi-stub.c`, `efi-stub-entry.c`, `efi-stub-helper.c`, `fdt.c`) is shared with arm64 and LoongArch.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Boot flow has no JIT, SIMD or GC barriers. The "full / partial / scalar / missing" vector scale was read as follows. Full means feature-complete in the code read. Partial means working with a named gap. Scalar means a thin or generic fallback. Missing means absent. The ratings below come from a file-read verification in the clone; no hardware, QEMU or CI runs were done. The final part of the verification output was truncated, so only the components below are rated.

| Component | riscv64 rating | Evidence |
|---|---|---|
| Boot protocol and Image header | full | `head.S` emits the header (magic `RISCV\0\0\0` and `RSC\x05`, version 0.2) and the PE/COFF "MZ" trick (`c.li s4,-13`) under `CONFIG_EFI`. Hand-written assembly. |
| EFI stub and runtime | full | `libstub/riscv.c` and `riscv-stub.c` use `RISCV_EFI_BOOT_PROTOCOL` with a DT `boot-hartid` fallback (32 and 64-bit). KASLR goes through generic `efi_kaslr_relocate_kernel`. `fence.i` icache sync. `efi_enter_kernel` clears `satp`. Runtime mapping with RO/XP permissions in `arch/riscv/kernel/efi.c`. |
| ACPI | full (core), with caveats | `acpi.c` honours `acpi=off/on/force`. RINTC cache, EFI-aware `acpi_os_ioremap` (adapted from arm64) and PCI raw access are in place. SPCR, BGRT and ACPI_PPTT are selected in Kconfig. Caveats: HW-reduced ACPI only; a FADT older than 6.6 only logs `FW_BUG`; `acpi_init_rintc_map()` calls `BUG()` when there are no RINTC entries. |
| SMBIOS/DMI | scalar | `asm/dmi.h` is generic `memremap` (MEMREMAP_WB) boilerplate, copyright 2024 Intel, based on arm64. Depends on `EFI`. Tables are found via the EFI config table by `drivers/firmware/dmi_scan.c`. |
| Device tree | full (infrastructure) | `parse_dtb()` calls `early_init_dt_scan`, with `BUILTIN_DTB` and command-line fallback options. The remainder of this rating was truncated in the source output [NEEDS VERIFICATION]. |
| kexec / kdump | Present (not rated by the verification pass) | `machine_kexec.c`, `kexec_relocate.S`, `crash_dump.c`, `crash_save_regs.S`, `machine_kexec_file.c`, `kexec_elf.c`, `kexec_image.c`, `crash.c`. Kconfig provides `ARCH_SUPPORTS_KEXEC`, `ARCH_SUPPORTS_KEXEC_FILE` (64BIT), `ARCH_SUPPORTS_KEXEC_PURGATORY`, `ARCH_SUPPORTS_CRASH_DUMP`, `ARCH_SUPPORTS_CRASH_HOTPLUG`. |
| Relocation and KASLR | Present (not rated) | Kconfig `RELOCATABLE`, `RANDOMIZE_BASE`. Early code in `arch/riscv/kernel/pi/` (`fdt_early.c`, `cmdline_early.c`, `archrandom_early.c`). |

Early-boot constraints from `boot.rst`:

- The virtual mapping is installed in two steps. `setup_vm()` builds the static `early_pg_dir`. `setup_vm_final()` builds `swapper_pg_dir` and the linear map.
- `virt_to_phys()` and `phys_to_virt()` need the start of DRAM, which is known only after step 1 (`setup_bootmem()` in `arch/riscv/mm/init.c`).
- Pre-MMU code must be built with `-fno-pie` and `-mcmodel=medany`, with all instrumentation (KASAN, ftrace and others) disabled.

ISA extensions bear on boot code only through toolchain requirements (see Section 5). RHCT is the RISC-V ACPI table that carries hart capabilities. RIMT is the table describing IOMMUs.

**Comparison table (amd64 vs arm64 vs riscv64).** Data for amd64 and arm64 was not collected. The following are the only cross-architecture facts in the findings:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Image header | Data not available | RISC-V header is "compliant with PE/COFF and largely inspired from ARM64 header"; the doc says a common header might happen, but no merge occurred | Own header, 64 bytes, version 0.2 |
| EFI stub | Data not available | Shares generic stub code | Shares generic stub code plus `riscv*.c` |
| KASLR in stub | Data not available | Generic functions | Reuses the generic arm64 functions (b7ac4b8ee73d) |
| DMI | Data not available | Reference implementation | Copied from arm64 |
| EFI `acpi_os_ioremap` | Data not available | Reference implementation | Adapted from arm64 |
| kexec selftests | Built | Not built | Not built |

## 5. Build System, Cross-Compilation, and Toolchain

The kernel has no cmake or autoconf configure step. Configuration is via Kconfig. The two CMakeLists.txt files in the tree are under `drivers/gpu/drm/amd/display/dc/` and are unrelated to booting. No Dockerfile or Containerfile was found by filename search of the tree. A content search was not exhaustive.

**Build commands** [NEEDS VERIFICATION]. These were assembled from Kbuild conventions and the `llvm.rst` riscv row. They are not quoted from a riscv-specific build page and were not run.

GNU toolchain:

```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image
```

LLVM toolchain:

```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image
```

The boot artifact is `arch/riscv/boot/Image`. `llvm.rst` lists riscv as "Supported" with `LLVM=1`.

**Toolchain minimums** (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`; identical across architectures except where noted):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 (parisc64 differs at 12.0.0) |
| binutils | 2.30 |
| Clang/LLVM | 17.0.1 (loongarch differs at 18.0.0) |
| GNU make | 4.0 |
| bash | 4.2 |
| pahole | 1.26 |
| rustc (optional) | 1.85.0 |
| bindgen (optional) | 0.71.1 |

The reason pahole 1.26 is required was not checked.

**RISC-V-specific toolchain constraints** (from `arch/riscv/Kconfig` and `arch/riscv/Makefile`):

- Zicsr/Zifencei: binutils 2.38 and GCC 12.1.0 moved these instructions out of base I, so `_zicsr_zifencei` must be added to `-march`. The kernel enables this when the assembler is GNU and version 2.36 or later.
- GCC older than 11.3.0 cannot take zicsr/zifencei via `-march`. The build then passes `-Wa,-misa-spec=2.2`.
- Vector (`TOOLCHAIN_HAS_V`): needs `-march=rv64imv` support plus LLD or ld 2.38 or later.
- Zbb, Zba, Zbc, Zbkb: each needs matching `-march` support plus LLD or ld 2.39 or later.
- Zabha and Zacas need `-march` support with no linker condition. Vector crypto is detected with an `as-instr` probe.
- Clang dynamic ftrace with the LLVM assembler needs LLD or ld 2.36 or later. GCC dynamic ftrace needs `-fpatchable-function-entry=8`.
- `ARCH_HAS_BROKEN_DWARF5` is set for LLVM assembler or LLD older than 18.
- Shadow call stack needs `-fsanitize=shadow-call-stack` and `ld --no-relax-gp`.
- The Makefile builds `-march` from `rv64ima`, with `fd` for FPU, `c`, and `v` added by Kconfig. The ABI is `-mabi=lp64`.

**QEMU usage.** The only QEMU recipe found in the tree is the KUnit config `tools/testing/kunit/qemu_configs/riscv.py`:

- `-machine virt -cpu rv64`.
- `-bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`. The script exits if the file is missing, so `qemu-system-riscv64` and its OpenSBI firmware package must be installed.
- Kernel `arch/riscv/boot/Image` with command line `console=ttyS0`.
- Kconfig fragment: `CONFIG_ARCH_VIRT=y`, `CONFIG_SERIAL_8250=y`, `CONFIG_SERIAL_8250_CONSOLE=y`, `CONFIG_SERIAL_OF_PLATFORM=y`, `CONFIG_RISCV_SBI_V01=y`, `CONFIG_SERIAL_EARLYCON_RISCV_SBI=y`.
- Invocation from [run_wrapper.rst](https://docs.kernel.org/dev-tools/kunit/run_wrapper.html): `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-`. The `--arch=riscv` form is inferred from the config filename; the doc shows only x86_64 and s390 examples.
- No standalone manual `qemu-system-riscv64` command was found in `boot.rst`. The doc-wide grep was cut off, so this is not confirmed across all docs.

The ACPI base series (v2) documented this test recipe: patched QEMU with ACPI, EDK2 firmware, a Linux build with SBI HVC and SBI earlycon, and a Buildroot rootfs, booted with `console=hvc0 earlycon=sbi`.

**Known build failures.** Data not available: searched the shared clone's docs and Kconfig and the mailing-list mirrors; no riscv-specific build-failure list was found. The Launchpad 1904912 report of Ubuntu linux-riscv 5.8 boot failure in QEMU is a boot failure, not a build failure (see Section 11).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix (riscv64 only; amd64 and arm64 columns were not researched).**

| Feature | riscv64 status |
|---|---|
| EFI stub boot | Mainline since v5.10 |
| EFI runtime services and poweroff via EFI | Runtime since v5.10; EFI poweroff since v7.3-rc1 |
| `RISCV_EFI_BOOT_PROTOCOL` | Since v5.19-rc1 |
| KASLR | Since v6.6-rc1 (needs a firmware random seed, otherwise the kernel is moved to an aligned location) |
| ACPI core | Since v6.5-rc1; HW-reduced only |
| ACPI PCI | Since v6.12-rc1 |
| ACPI NUMA (SRAT/SLIT) | Since v6.11-rc1 |
| ACPI RIMT (IOMMU) | Since v6.18-rc1; fixes landed through 2026-06 |
| SPCR console | Since v6.11-rc1 |
| SMBIOS/DMI | Since v6.11-rc1 |
| kexec | Since v5.13-rc1 |
| kdump | Since v5.13-rc1 |
| kexec_file | Since v5.19-rc1 (64-bit only); Image/ELF loaders since v6.16 |
| Crash hotplug | Merged past v7.4-rc1, in no release yet |
| Crashkernel CMA reservation | Since v7.3-rc1 |
| Devicetree boot | Full infrastructure |
| RAS (ACPI/EFI) | Series v3 posted 2026-01-09, merge status unknown [NEEDS VERIFICATION] |
| LPI context-loss flags | Series v2 posted 2026-07-28, merge status unknown [NEEDS VERIFICATION] |

**Functional gaps.**

- No functional boot-flow gap relative to the RISC-V Boot and Runtime Services (BRS) v1.0 spec (ratified 2025-08-29) was identified in the kernel pieces BRS-I depends on. Those pieces are EFI stub, ACPI, RHCT, MADT/RINTC, SPCR, SRAT/SLIT, SMBIOS and RIMT, and all are in mainline. No BRS-named kernel commits or series were found.
- Gaps against arm64 and amd64 were not systematically assessed.
- Known open or unverified items: the kexec-tools RISC-V port and crashdump fixes live in userspace (see Section 9 and Section 11), the RAS series, and the LPI series.
- Userspace kexec on riscv64 depends on kexec-tools. The 2021 kexec series was tested with a patched kexec-tools hosted at riscv.ics.forth.gr (work in progress at the time). Whether the kexec-tools port is fully upstream is unknown [NEEDS VERIFICATION].

**Performance gaps.**

- No SIMD paths exist in boot flow.
- No published like-for-like riscv64 vs arm64 Linux boot-time benchmark for 2024-2026 was found.
- Indirect data points:
  - openSUSE Bug 1196357: loading a 97 MB initrd from microSD took over 1 minute in both U-Boot and the EFI stub on HiFive Unmatched. The reporter suspected an MMC controller read-speed limit. This is anecdotal and the snippets contradict each other on the NVMe comparison.
  - A simulator project reports about 250M active cycles to boot to a shell on an 8-wide out-of-order model. This is a simulator, not hardware.
  - Imperas claims an RV64GC Linux platform boots in under 5 s on a regular PC. This is a vendor claim with no methodology.
  - An aarch64 poweroff test at 4.94 s under emulation (cirosantilli benchmark suite) has no riscv64 counterpart in the excerpt.
  - A Phoronix-derived summary says the Linux 7.2 RISC-V merge "reduces kernel bootstrap overhead", with no numbers. The Phoronix original was not accessible [NEEDS VERIFICATION].
- Any boot-time comparison would have to be measured directly.

**Security hardening gaps.**

- KASLR is available but depends on a firmware random seed. If none is available, the kernel is moved to an alignment-compatible location and not randomized beyond that.
- Shadow call stack builds need `-fsanitize=shadow-call-stack` and `ld --no-relax-gp`.
- A comparison of hardening features against arm64 and amd64: Data not available, not researched.

**NaN / floating-point semantics.** Not applicable. Boot flow has no numerics, and the `fd` FPU extensions only affect the kernel `-march` string.

## 7. CI/CD Infrastructure

**In-tree.** No riscv64 CI configuration exists in the kernel tree (see Section 3). Test code exists in-tree, but something external has to build and run it:

- kselftest: `tools/testing/selftests/riscv/Makefile` sets `RISCV_SUBTARGETS ?= abi hwprobe mm sigreturn vector cfi`. None tests the boot protocol, EFI stub, DT or ACPI handoff, initrd or cmdline handling, or kexec.
- KUnit: `arch/riscv/kernel/tests/Kconfig.debug` defines `RISCV_MODULE_LINKING_KUNIT` and `RISCV_KPROBES_KUNIT`. Neither covers boot flow.
- The KUnit QEMU runner (`qemu_configs/riscv.py`) boots a riscv64 kernel, but it exercises the module-linking and kprobes tests, not the boot flow.
- BPF (`DENYLIST.riscv64`, `config.riscv64`) and KVM (`lib/riscv/`) selftests exist and are not boot-flow related.
- The generic kexec selftests (`test_kexec_load.sh`, `test_kexec_file_load.sh`) are built only for `x86` and `ppc64le`; `test_kexec_jump` is x86-64 only. riscv64 kexec and kdump have no selftest coverage.

**External.**

- KernelCI, LKFT, 0-day and syzbot may boot riscv64 kernels. This could not be verified, because the KernelCI dashboard and lore were not accessible and the other dashboards were not checked [NEEDS VERIFICATION].
- Evidence of syzbot boot activity: a Nov 2023 syzbot report "riscv/fixes boot error: failed to read from qemu: EOF" ([LKML mirror](https://lkml.rescloud.iu.edu/2311.3/04844.html)). Root cause and status unknown [NEEDS VERIFICATION].
- CIP issue 217 (search summary, not opened) says CIP builds qemu riscv64 kernels for 5.10 and 6.1 without boot testing [NEEDS VERIFICATION].
- RISE project RP012, "Enabling Linux Kernel CI Testing on RISC-V Boards":
  - It boots OpenSBI, U-Boot and Linux through LAVA on the Banana Pi BPI-F3 (phase 1) and the SiFive Premier P550 (phase 2).
  - U-Boot SPL loads OpenSBI and U-Boot proper over serial. U-Boot then fetches the kernel and possibly the DTB over TFTP, with the rootfs over NFS.
  - No vendor or budget is stated; a Collabora post says Collabora worked on it. Bidding ran 2025-02-17 to 2025-03-03 and is closed.
  - It does not mention EFI, ACPI, kexec or SMBIOS. It tests boot only incidentally.
- Kairos uses RISE RISC-V runners to build and test kairos-init and hadron. No boot-flow-specific runner usage was found.
- The riseproject-dev organization has 70 repositories; only 12 were visible, including `linux` (a fork whose boot-flow patches were not checked), `firmware-wg`, `kernel-and-virtualization-wg`, `riscv-runner` and `board-farm`. The other 58 were not checked [NEEDS VERIFICATION].

**Comparison table.**

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None found (no kernel-tree CI config for any arch) | None found | None |
| Patchwork CI | Data not available | Data not available | Exists for linux-riscv per `patch-acceptance.rst`; scope unverified |
| Boot-flow selftests | kexec selftests built | kexec selftests not built; KHO config exists | None; kexec selftests not built |
| Hardware-in-loop | Data not available | Data not available | RP012 (BPI-F3, P550) via LAVA, not boot-flow dedicated |
| KernelCI/LKFT | Data not available | Data not available | Unverified |

## 8. Distribution and Release Status

- Upstream releases only source (mainline and stable trees). It produces no riscv64 binary.
- Linux boot flow is not a distributable package. No PyPI project `linux-boot-flow` exists (`https://pypi.org/pypi/linux-boot-flow/json` and `https://pypi.org/simple/linux-boot-flow/` returned HTTP 404). The RISE wheel builder redirected to PyPI and returned 404, so no wheels exist.
- Ubuntu 26.04 (resolute): no package is named for this subsystem, and the package search result for the keyword was inconclusive [NEEDS VERIFICATION].
- The Arch Linux RISC-V site search listed no package of that name.
- The relevant channel is distro kernel packages: Ubuntu `linux-image-*` (riscv64), openSUSE, and Arch `linux`. Their riscv64 patch status and version was not checked. Fedora and Debian riscv64 kernel packaging was not checked.
- Distro evidence of riscv64 boot flow in practice comes from bug reports: openSUSE bugs 1196357, 1197422 and 1209674, Launchpad 1904912 and 1980594, and Ubuntu livecd-rootfs commits.

What a user must do to get a working binary:

- Use a distro kernel image for riscv64, or build from source (Section 5).
- Pair it with OpenSBI plus U-Boot or EDK2 (Section 9).
- Use GRUB or systemd-boot as the boot manager if booting via UEFI. Ubuntu's riscv64 preinstalled images exist; their boot flow is described in the [Ubuntu RISC-V boot flow cookbook](https://ubuntu.com/hardware/docs/image-cookbook/explanation/bootflow/).

## 9. Dependencies

Package-graph queries were not run. "Graph: not queried" means unknown, not "not found". Ubuntu 26.04 riscv64 availability is unverified for every row.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | build-dependency (critical); minimum 8.1.0 | Builds the kernel for riscv64 [NEEDS VERIFICATION]; riscv constraints in Section 5 | n/a | n/a | Data not available |
| LLVM | build-dependency (optional); Clang/LLVM 17.0.1 minimum, `LLVM=1` supported for riscv | Supported per `llvm.rst` | n/a | n/a | Data not available |
| GNU binutils | build-dependency (critical); minimum 2.30; riscv features need 2.36 to 2.39 | Builds on riscv64 [NEEDS VERIFICATION] | n/a | n/a | Data not available |
| GNU make | build-dependency (critical); minimum 4.0 | Data not available | n/a | n/a | Data not available |
| dtc | build-dependency (critical); the kernel builds its own copy in `scripts/dtc` (`CONFIG_DTC`) for `arch/riscv/boot/dts`; also a critical dependency of OpenSBI and U-Boot | In-tree host tool builds with the kernel; standalone package [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION]; Ubuntu names to try: `device-tree-compiler`, `libfdt-dev`, `libfdt1` | In projects.yml, no report yet |
| OpenSBI | runtime-dependency (critical); provides SBI, passes `a0` = hartid, `a1` = DTB; HSM required for ordered boot, hotplug and kexec | Builds on riscv64 (RISC-V-native) | See OpenSBI report | See OpenSBI report | OpenSBI report: orange (downstream-only) |
| U-Boot | runtime-dependency (optional); bootloader, hands off with DTB and `bootefi` | Builds on riscv64 | See U-Boot report | See U-Boot report | U-Boot report: blue |
| EDK2 | runtime-dependency (optional); supplies the EFI config table carrying DTB or ACPI tables | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | In projects.yml (github.com/tianocore/edk2), no report yet |
| kexec-tools | runtime-dependency (optional); userspace for kexec and kdump | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION]; Ubuntu name: `kexec-tools` | Not in projects.yml; RISC-V port and crashdump fixes on the mailing list (Section 11) |
| QEMU | test-dependency (optional); used by the KUnit config (`qemu-system-riscv64`, machine `virt`, OpenSBI `fw_dynamic` firmware) | Data not available | Used as the KUnit riscv64 runner | Data not available | Data not available |
| ACPICA (indirect) | ACPI table parsing for RHCT, MADT, SPCR, GTDT; an in-kernel copy builds. Standalone `iasl`/`acpica-tools` on riscv64 [NEEDS VERIFICATION] | In-kernel copy builds | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | In projects.yml, no report yet |
| GRUB (grub-efi-riscv64) (indirect) | Boot-path bootloader; `changes.rst` lists GRUB as a minimum-version tool | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Not in projects.yml |
| systemd (systemd-boot, systemd-stub, ukify) (indirect) | Optional EFI boot manager and unified kernel images | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | In projects.yml, no report yet |
| makedumpfile (indirect) | kdump userspace | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Not in projects.yml |

Deep dive:

- Recursion past one level (for example binutils internals or OpenSBI's own dependencies) was not performed. The OpenSBI and U-Boot reports at `project-reports/opensbi.md` and `project-reports/u-boot.md` are the next level.
- No dependency here contains JIT. SIMD or crypto relevance is limited to toolchain detection of vector and vector-crypto extensions (Section 5).
- Dependency risk: boot behavior is shaped by firmware conformance. A U-Boot mailing-list thread from April 2025, "RISC-V UEFI/ACPI on QEMU regression?", reports U-Boot placing the RSDP in the wrong EFI memory-map type (it should be ACPI Reclaim), with kexec working on an earlier U-Boot release. Status unknown [NEEDS VERIFICATION].
- The boot.rst requirement that firmware implement `RISCV_EFI_BOOT_PROTOCOL` and convert `/reserved-memory` attributes puts conformance work on OpenSBI, U-Boot and EDK2, not on the kernel.

## 11. Known Bugs and Active Issues

The kernel tracks changes by commit and mailing list, not by issue tracker. The IDs below are distro or downstream trackers, except where noted. All items come from search-result snippets, not from the primary pages (openSUSE archive, lore and others was not accessible, 404 or empty), so all are [NEEDS VERIFICATION].

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [openSUSE Bug 1196357](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/TYXCFUUVPLAQN7MAG3F6CIP44MVKXYEG) | Unmatched system boot takes long at efistub | Unknown | Performance | 97 MB initrd load took over 1 minute on 3 microSD cards; NVMe/tmpfs improved by about 20 s |
| [openSUSE Bug 1197422](https://lists.opensuse.org/archives/list/kernel-bugs@lists.opensuse.org/thread/MUGJEAWH6H5Z3KEM2U4GXJ7YYS4UNPMS/) | Unmatched crash during boot, paging-request fault after EFI stub handoff | Unknown | Boot failure | A comment recommends the U-Boot shipped in the image |
| [openSUSE Bug 1209674](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/NH7GQ43MQPWTXCVDEY5ZAFI6SIE5Q4KQ) | VisionFive 2 on 6.3.0-rc3, early "Store/AMO access fault" after GRUB | Unknown | Boot failure | |
| [Launchpad 1904912](https://answers.launchpad.net/bugs/1904912) | Ubuntu linux-riscv 5.8 fails to boot in QEMU with OpenSBI | Appears fixed | Boot failure | Fix was a riscv change for a HARDENED_USERCOPY boot failure |
| [Launchpad 1980594](https://bugs.qastaging.launchpad.net/bugs/1980594) | qemu-riscv64_smode U-Boot cannot boot under KVM | Unknown | Boot failure | Virtio access crashes it; firmware-side |
| [syzbot riscv/fixes boot error](https://lkml.rescloud.iu.edu/2311.3/04844.html) | Boot error "failed to read from qemu: EOF" (Nov 2023) | Unknown | Boot failure | No root cause in snippet |
| [U-Boot RISC-V UEFI/ACPI on QEMU regression](https://www.mail-archive.com/u-boot@lists.denx.de/msg541500.html) | RSDP placed in the wrong EFI memory-map type (April 2025) | Unknown | Correctness (firmware) | Cross-reference the U-Boot report |
| [kexec-tools crashdump series v2-v4](https://ratatoskr.run/kexec/2026/05/17012406/t) | Fixes incorrect virtual address translation and kdump errors such as "Can't read mem_section array" (May 2026) | Merge status unknown | Correctness (kdump) | |
| [livecd-rootfs commit d7615a2](https://git.lubuntu.me/Lubuntu/livecd-rootfs/commit/d7615a2237cc0661128ff4c9ed919302f0ab32cd) | riscv64 ISO images would not boot due to kernel naming (`vmlinux` vs `vmlinuz`) (April 2026) | Fixed | Boot failure | Distro packaging, not kernel |

Mainline fixes found by commit data (in the clone):

- 81bbcff0c053 "riscv: Prevent NULL pointer dereference in machine_kexec_prepare()" (Tao Liu, Red Hat): v7.2 (rc3 unconfirmed).
- 9156585280f1 "ACPI: RIMT: Add dependency between iommu and devices": the IOMMU could otherwise be removed first at shutdown.
- b8f62414fa05 "ACPI: RIMT: Only defer the IOMMU configuration in init stage": devices depending on the IOMMU would defer forever if the IOMMU probe failed or it was absent from the ACPI namespace.
- RISC-V Fixes pull requests for 6.11-rc6 (avoid accessing early boot ACPI tables via unsafe memory attributes) and 6.10-rc7 (avoid a deadlock if kexec crash handling triggers) were mentioned in search results. Neither pull request was opened, so titles and hashes are unconfirmed [NEEDS VERIFICATION].

Other open or unverified mailing-list work [NEEDS VERIFICATION, lore was not accessible]:

- "kexec-tools RISC-V port", v2, 4 patches, May 2025 (Bjorn Topel), [infradead](https://lists.infradead.org/pipermail/linux-riscv/2025-May/070125.html).
- Himanshu Chauhan, "Add RAS support for RISC-V architecture", v3, 10 patches, 2026-01-09, [LWN](https://lwn.net/Articles/1053519/).
- Drew Fustini, RISC-V RQSC table parsing RFC (about 2026-04-15), listed as stale; no URL found.
- Peixin Xie, "riscv: acpi: Handle LPI architectural context loss flags", v2 posted 2026-07-28. A stable notice on 2026-09-03 said it failed to apply to 6.6-stable. Mainline status unknown ([mirror](https://ratatoskr.run/linux-acpi/2026/07/17329315/t)).

Correctness bugs worth highlighting: the kexec NULL dereference (81bbcff0c053, fixed), the kdump address-translation fixes in kexec-tools (open or unknown), and the U-Boot RSDP memory-type regression affecting ACPI-based kexec (unknown). Code-level caveats from the clone review: `acpi_init_rintc_map()` calls `BUG()` when there are no RINTC entries, and a FADT older than 6.6 is only logged as `FW_BUG`.

## 12. Objections and Upstream Blockers

- Stated objections: none found. The only documented policy is in `patch-acceptance.rst` (ratified or frozen specs only; ECR for UEFI Forum specs; no draft interfaces; churn disapproved). Review discussion on the lore threads (early-boot doc, RIMT, EFI poweroff, kexec v3 cover letter) could not be read because lore was not accessible.
- Technical blockers: none found for the merged features. Open items are the userspace kexec-tools RISC-V port and crashdump fixes, RAS v3, and the LPI flags series. Their review state is unknown.
- Organizational blockers: the boot-flow code has no dedicated RISC-V EFI or kexec maintainer. It relies on the RISC-V maintainers and the generic EFI and kexec maintainers. The effect on review latency was not measured. A key ACPI maintainer, Sunil V L, changed employer (now `oss.qualcomm.com`).
- Acceptance probability: the boot flow itself is already upstream. For open series, acceptance cannot be estimated from the data available.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification.** The riscv64 boot code is mainline and has Supported status in MAINTAINERS (EFI stub since v5.10, kexec/kdump since v5.13, ACPI since v6.5; see the [RISC-V boot requirements](https://docs.kernel.org/arch/riscv/boot.html)). But the kernel tree has no riscv64 CI config, and its kexec and boot-flow selftests do not cover riscv64 (the riscv selftests are abi, hwprobe, mm, sigreturn, vector, cfi). Upstream ships only source, so the only consumable riscv64 releases are distro kernels (Ubuntu linux-image, openSUSE; evidence is from bug reports such as [openSUSE Bug 1196357](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/TYXCFUUVPLAQN7MAG3F6CIP44MVKXYEG)). Their riscv64 patch status was not checked, so the patched/uncertain distribution floor applies. The release is provided by distros, not upstream. Confidence is medium-low, because KernelCI/LKFT and the patchwork CI could not be reached and the distro package check and package-graph queries were not run.

**Pending work that could change the grade.**

- Verify KernelCI, LKFT and patchwork (linux-riscv) boot tests on riscv64. If they run and execute boot tests on qemu or hardware, the grade could rise to blue (or green if upstream is accepted as the release provider).
- Check the Ubuntu, Debian and Fedora riscv64 kernel packaging for riscv64-specific patches. An unpatched build would move this to yellow clean-distro-build.
- RISE RP012 (Kernel CI on BPI-F3 and P550 boards via LAVA, bidding closed) is hardware-in-the-loop boot CI but is not dedicated to boot flow.
- Open or unverified mailing-list work: kexec-tools RISC-V port and crashdump fixes (v2-v4, 2025-2026), RISC-V RAS support v3 (2026-01), LPI context-loss flags, and crash hotplug (`arch/riscv/kernel/crash.c`, past v7.4-rc1). No BRS-named kernel series was found.

## 14. Investment Analysis

**RISE check before sizing.**

- No RISE project, blog post or repository targets the RISC-V Linux boot protocol, EFI stub, device tree handling, ACPI, SMBIOS, kexec/kdump or BRS-style server requirements. The RISE feed was read through the first 100,000 of 186,772 characters. One run counted 10 posts (2026-07-07 to 2026-10-30) and another counted 8, so older posts and the full counts are unchecked [NEEDS VERIFICATION].
- Peripheral RISE material:
  - The Android 17 on RVA23 post ([RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)) uses an open boot chain based on U-Boot and OpenSBI (RP024). It does not mention UEFI, device tree or ACPI.
  - The Kairos post ([RISE blog](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)) names UEFI, OpenSBI, bootloaders and devicetree configuration as variables emulators cannot reproduce.
  - The Platform/Firmware WG (EDK2, U-Boot, Coreboot, TF-M, OpenSBI) and the Kernel & Virtualization WG exist, but their issue contents were not visible.
- RP012 already covers hardware-in-the-loop kernel CI on BPI-F3 and P550 via LAVA, so generic board-farm and LAVA enablement should not be sized again here. The sizing below covers only boot-flow-specific test content that would run on that infrastructure.
- Estimates below are engineering judgment based on the gaps found in this report, not measured data.

### 14.1 Functional Enablement

- No functional boot-flow gap was found in the core features (EFI stub, ACPI, SMBIOS, kexec/kdump).
- Work is to track and shepherd the open series: kexec-tools RISC-V port and crashdump fixes, RAS v3, and LPI context-loss flags. Each needs a status check on lore first.
- Verify the BRS-I conformance of the kernel against firmware: boot a BRS-I style stack (EDK2 + ACPI + SMBIOS + SBI) on QEMU and on one silicon target, and file gaps. No BRS-named kernel series exists yet.
- Audit the ACPI robustness caveats: `acpi_init_rintc_map()` `BUG()` on no RINTC entries, and FADT handling.

### 14.2 Performance Optimization

- No benchmark baseline exists. First deliverable is a repeatable riscv64 vs arm64 boot-time and initrd-load measurement on real hardware (the Unmatched initrd slowness was only anecdotal).
- Further optimization work cannot be sized until that baseline exists.

### 14.3 CI/CD Infrastructure

- Add riscv64 boot-flow test content: EFI stub boot, ACPI boot, DT boot, and kexec/kdump on QEMU `virt` with EDK2 or U-Boot, runnable under KernelCI or LKFT.
- Enable the kexec selftests for riscv (`tools/testing/selftests/kexec/Makefile` currently allows only `x86` and `ppc64le`) and add a riscv kexec config.
- Confirm what patchwork, KernelCI and LKFT already run, which could remove part of this item.
- Use RP012 hardware rather than building new board capacity.

### 14.4 Ecosystem Enablement

- Check the Ubuntu, Debian and Fedora riscv64 kernel packages for riscv64-specific patches. This decides yellow versus orange.
- Check riscv64 packaging for kexec-tools, makedumpfile, grub-efi-riscv64, systemd-boot and `iasl` (Ubuntu names listed in Section 9).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Track and shepherd kexec-tools RISC-V port and crashdump series, RAS v3, LPI flags | 4 | Upstream engineer | Medium |
| Functional | BRS-I conformance run (EDK2 + ACPI + SMBIOS + SBI) on QEMU and one silicon target | 6 | Platform/firmware engineer | High |
| Functional | Audit ACPI error paths (`BUG()` on no RINTC, FADT handling) | 2 | Upstream engineer | Low |
| Performance | riscv64 vs arm64 boot-time and initrd-load baseline on hardware | 3 | Performance engineer | Medium |
| CI/CD | Boot-flow test cases (EFI, ACPI, DT, kexec/kdump) for KernelCI/LKFT on QEMU | 6 | CI engineer | High |
| CI/CD | Enable and extend kexec selftests for riscv | 3 | Upstream engineer | High |
| CI/CD | Verify existing patchwork/KernelCI/LKFT riscv64 boot coverage | 1 | CI engineer | Critical |
| Ecosystem | Audit distro riscv64 kernel patch sets (Ubuntu, Debian, Fedora, openSUSE) | 2 | Distro engineer | Critical |
| Ecosystem | Verify riscv64 packaging of kexec-tools, makedumpfile, GRUB, systemd-boot, ACPICA | 2 | Distro engineer | Medium |

## 15. References

- [RISC-V boot requirements, docs.kernel.org](https://docs.kernel.org/arch/riscv/boot.html)
- [Linux kernel repository (torvalds/linux.git)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [linux-riscv patchwork](https://patchwork.kernel.org/project/linux-riscv/list/)
- [Early boot doc patch, lore](https://lore.kernel.org/all/20230619094705.51337-2-alexghiti@rivosinc.com/T/)
- [Early boot doc patch v2, lore](https://lore.kernel.org/lkml/20230621072234.9900-3-alexghiti@rivosinc.com/T/)
- [RISCV_EFI_BOOT_PROTOCOL patch, lore](https://lore.kernel.org/r/20220519051512.136724-2-sunilvl@ventanamicro.com)
- [KASLR libstub patch, lore](https://lore.kernel.org/r/20230722123850.634544-6-alexghiti@rivosinc.com)
- [ACPI core build patch, lore](https://lore.kernel.org/r/20230515054928.2079268-7-sunilvl@ventanamicro.com)
- [RIMT patch, lore](https://lore.kernel.org/r/20250818045807.763922-2-sunilvl@ventanamicro.com)
- [SMBIOS/DMI patch, lore](https://lore.kernel.org/r/20240613065507.287577-1-haibo1.xu@intel.com)
- [ACPI PCI patch, msgid](https://patch.msgid.link/20240812005929.113499-10-sunilvl@ventanamicro.com)
- [EFI poweroff patch, msgid](https://patch.msgid.link/20260615-efi_reset_shutdown-v1-1-9414edcbbab0@meta.com)
- [kexec_file patch, lore](https://lore.kernel.org/r/20220408100914.150110-4-lizhengyu3@huawei.com)
- [kexec_file series, infradead](https://lists.infradead.org/pipermail/linux-riscv/2022-May/015125.html)
- [kexec/kdump series v3 thread, infradead](https://lists.infradead.org/pipermail/linux-riscv/2021-April/005739.html)
- [Basic ACPI support for RISC-V v2, LKML mirror](https://lkml.iu.edu/hypermail/linux/kernel/2302.2/00968.html)
- [RISC-V ACPI NUMA, LWN](https://lwn.net/Articles/964659/)
- [RAS support for RISC-V, LWN](https://lwn.net/Articles/1053519/)
- [kexec-tools RISC-V port, infradead](https://lists.infradead.org/pipermail/linux-riscv/2025-May/070125.html)
- [kexec-tools riscv crashdump series v4](https://ratatoskr.run/kexec/2026/05/17012406/t)
- [LPI context loss flags series, ratatoskr](https://ratatoskr.run/linux-acpi/2026/07/17329315/t)
- [Boot RISC-V kernel from any 4KB aligned address, LKML mirror](https://lkml.iu.edu/hypermail/linux/kernel/1903.3/00866.html)
- [RISC-V Boot and Runtime Services specification](https://docs.riscv.org/reference/brs/index.html)
- [KUnit run_wrapper documentation](https://docs.kernel.org/dev-tools/kunit/run_wrapper.html)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE feed](https://riseproject.dev/feed/)
- [Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [How Kairos is Charting the Stepping Stones of RISC-V Productization](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [openSUSE Bug 1196357](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/TYXCFUUVPLAQN7MAG3F6CIP44MVKXYEG)
- [openSUSE Bug 1197422](https://lists.opensuse.org/archives/list/kernel-bugs@lists.opensuse.org/thread/MUGJEAWH6H5Z3KEM2U4GXJ7YYS4UNPMS/)
- [openSUSE Bug 1209674](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/NH7GQ43MQPWTXCVDEY5ZAFI6SIE5Q4KQ)
- [Launchpad 1904912](https://answers.launchpad.net/bugs/1904912)
- [Launchpad 1980594](https://bugs.qastaging.launchpad.net/bugs/1980594)
- [syzbot riscv/fixes boot error](https://lkml.rescloud.iu.edu/2311.3/04844.html)
- [U-Boot RISC-V UEFI/ACPI on QEMU regression thread](https://www.mail-archive.com/u-boot@lists.denx.de/msg541500.html)
- [livecd-rootfs vmlinux fix](https://git.lubuntu.me/Lubuntu/livecd-rootfs/commit/d7615a2237cc0661128ff4c9ed919302f0ab32cd)
- [livecd-rootfs efi=debug earlycon](https://git.lubuntu.me/Lubuntu/livecd-rootfs/src/commit/c6ad92c0f48b40b787137d9ae0926a943a7884b8)
- [Ubuntu RISC-V boot flow cookbook](https://ubuntu.com/hardware/docs/image-cookbook/explanation/bootflow/)
- [openSUSE Hack Week RISC-V boot deep dive](https://hackweek.opensuse.org/all/projects/risc-v-deep-dive)
- [embeddedinn QEMU boot walk-through](https://embeddedinn.github.io/articles/tutorial/RISCV-Uncovering-the-Mysteries-of-Linux-Boot-on-RISC-V-QEMU-Machines/)
- [XuanTie zero_stage_boot](https://github.com/XUANTIE-RV/zero_stage_boot)
- [rvsim Linux boot example](https://willmccallion.github.io/rvsim/examples/linux-boot)
- [LPC2022 RISC-V ACPI Updates](https://lpc.events/event/16/contributions/1169/attachments/1025/2077/LPC2022_RISC-V_ACPI_Updates.pdf)
- [Phoronix: Linux 7.2 Embraces RISC-V](https://www.phoronix.com/news/Linux-7.2-RISC-V)
- [AI-Radar summary of Linux 7.2 RISC-V](https://ai-radar.it/article/linux-7-2-abbraccia-risc-v-meno-overhead-all-avvio-e-supporto-eswin-soc-di-default?lang=en)
- [Phoronix: RISC-V EFI boot for Linux 5.10](https://www.phoronix.com/news/Linux-5.10-RISC-V-EFI-Boots)
- [mkroot boot-time benchmark, LKML mirror](https://lkml.iu.edu/hypermail/linux/kernel/2410.3/04201.html)
- [Linux kernel boot benchmark suite](https://cirosantilli.com/linux-kernel-module-cheat/benchmark-linux-kernel-boot.html)
- [Fedora RISC-V build times](https://news.lavx.hu/article/fedora-s-risc-v-build-times-are-5x-slower-than-x86-64-creating-major-bottlenecks)