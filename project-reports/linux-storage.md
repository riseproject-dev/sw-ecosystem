---
title: Linux storage
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
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: LTP
    relation: test-dependency
    criticality: optional
  - name: blktests
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-storage" %}

# Linux storage

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux storage<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux storage is a set of kernel subsystems, not a standalone package. It covers the block layer (blk-mq), NVMe, SCSI, SATA/AHCI (libata), MMC/SD/eMMC hosts, UFS, MTD/SPI-NOR, device-mapper, MD RAID, io_uring and zoned storage. Reference: [kernel block documentation](https://docs.kernel.org/block/index.html). Filesystems ("Linux filesystems") and PCIe controller bring-up ("Linux SoC support") are covered by other reports. The userspace io_uring library is covered by the liburing report.

**Governance.** No foundation owns this subsystem. It is governed by the kernel development community through maintainer trees and mailing lists, with Linus Torvalds as top-level maintainer. The Linux Foundation hosts kernel.org but does not govern storage. The license is GPL-2.0 (`block/blk-core.c` carries `SPDX-License-Identifier: GPL-2.0`).

**Maintainers (MAINTAINERS at HEAD 05441d697f7f, 2026-11-03):**

| Area | Maintainers | Affiliation (from the listed email, where shown) |
|---|---|---|
| Block layer, io_uring | Jens Axboe; io_uring additionally Pavel Begunkov | not shown |
| NVMe host (Supported) | Keith Busch, Jens Axboe, Christoph Hellwig, Sagi Grimberg | not shown |
| NVMe target | Hellwig, Grimberg, Chaitanya Kulkarni | NVIDIA (Kulkarni) |
| MMC core | Ulf Hansson | not shown |
| SDHCI | Adrian Hunter | Intel |
| dw_mmc | Jaehoon Chung; Shawn Lin | Samsung; Rockchip |
| SCSI | James Bottomley, Martin Petersen | not shown |
| libata | Damien Le Moal, Niklas Cassel | not shown |
| MTD | Miquel Raynal; Vignesh Raghavendra | Bootlin; TI |
| SPI NOR | Pratyush Yadav, Michael Walle; reviewer Takahiro Kuwano | Infineon (Kuwano) |
| Device-mapper | Alasdair Kergon, Mikulas Patocka, Benjamin Marzinski; Mike Snitzer | Red Hat (first three) |
| MD RAID (Supported) | Song Liu, Yu Kuai | Yu Kuai's company not confirmed |
| RISC-V architecture (Supported) | Paul Walmsley, Palmer Dabbelt, Albert Ou; reviewer Alexandre Ghiti | not shown |
| RISC-V SpacemiT SoC support | list spacemit@lists.linux.dev | K1 SDHCI and SPI drivers fall under the `K: spacemit` pattern |

NVMe host and target are listed as "Supported". Block, io_uring, MMC, SCSI, libata, MTD and device-mapper are "Maintained". The MMC-over-SPI driver (`mmc_spi.c`) is Orphan. No storage subsystem has a RISC-V-specific maintainer. RISC-V storage code is limited to SoC host drivers, Kconfig dependencies, device-tree bindings and a few library accelerators, and it is reviewed by the generic subsystem maintainers. Source: [local clone MAINTAINERS](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/MAINTAINERS).

**Corporate sponsors.** Commit authors show Alibaba, SiFive, StarFive, ISCAS (a RISE general member), Google, Rivos, Gentoo/kernel.org, RISCstar Solutions, Sophgo-related developers and independent contributors. The RISE Project has no storage item. See section 14.

**Community stance on new ports.** Hardware enablement is accepted by the generic subsystem maintainers as upstream device-tree bindings plus a host driver or Kconfig dependency. The RISC-V patch acceptance policy (`Documentation/arch/riscv/patch-acceptance.rst`) accepts new ISA extensions only when frozen or ratified. Custom vendor extensions need to be frozen or ratified, or implemented in hardware that is widely available. The RISC-V patchwork instance runs automated build and test checks, and patches that fail are unlikely to be applied. Source: [kernel RISC-V docs](https://docs.kernel.org/next/arch/riscv/index.html).

## 2. Port History and Upstreaming Timeline

The RISC-V port has been in mainline since Linux 4.15 (v4.15 is dated 2018-01-28 in the clone). Block, NVMe, io_uring, SCSI, ATA and UFS core code is architecture-independent. RISC-V uses the generic syscall table, and `io_uring_setup`, `io_uring_enter` and `io_uring_register` are syscalls 425, 426 and 427. Dates below are author dates, and the first tag comes from `git tag --contains` in the clone. Commit links point to git.kernel.org.

| Date | Event | Source |
|---|---|---|
| 2018-01-28 | v4.15 released, first mainline release with the RISC-V port | clone tag date, shared brief |
| 2019-10-22 | Default Quad Enable method for ISSI SPI-NOR flash on SiFive boards (Sagar Kadam, SiFive), v5.5 | [83cba933a6db](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=83cba933a6db) |
| 2020-08-08 | MMC_DW allowed on RISCV and CSKY (Guo Ren, Alibaba), v5.10, merged 2020-09-07 | [ce54fb38fa42](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ce54fb38fa42) |
| 2022-07-07 | Non-coherent DMA via Zicbom (Heiko Stuebner), v6.0 | [1631ba1259d6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1631ba1259d6) |
| 2023-02-15 | StarFive JH7110 dw_mmc host (William Qiu), v6.3 | [9e622229bbf4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9e622229bbf4) |
| 2024-01-08 | RISC-V `csum_partial` with Zbb (Charlie Jenkins, Rivos), v6.8 | [a04c192eabfb](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a04c192eabfb) |
| 2024-01-15 | RAID-5 XOR in RVV assembly (Greentime Hu, SiFive), v6.8 | [c5674d00cacd](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c5674d00cacd) |
| 2024-01-21 | Vector AES-ECB/CBC/CTR/XTS (Jerry Shih, SiFive), v6.9 | [eb24af5d7a05](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=eb24af5d7a05) |
| 2024-06-21 | Zbc-accelerated CRC32 (Xiao Wang, Intel), v6.11 | [a43fe27d6503](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a43fe27d6503) |
| 2024-12-01 | Generic CRC32 library reworked to explicit `*_arch()` overrides, which the RISC-V code uses (Eric Biggers, Google), v6.14 | [d36cebe03c3a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d36cebe03c3a) |
| 2025-02-16 | Zbc CRC32 reimplemented on the new template (Eric Biggers), v6.15 | [72acff5f8185](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=72acff5f8185) |
| 2025-03-04 | Sophgo SG2044 SPI NOR controller driver (Longbin Li), v6.15 | [de16c322eefb](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=de16c322eefb) |
| 2025-03-05 | RAID-6 syndrome and recovery in RVV (Chunyan Zhang, ISCAS), v6.16 | [6093faaf9593](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6093faaf9593) |
| 2025-05-09 | SpacemiT K1 SD/eMMC host driver (Yixun Lan), v6.16, merged 2025-05-19 | [e5502d15b0f3](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e5502d15b0f3) |
| 2025-06-07 | CRC code moved to `lib/crc/` with CRC64 and T10DIF widths (Eric Biggers), v6.17 | [b5943815e63b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b5943815e63b) |
| 2025-06-19 | Vector SHA-256/512 files moved into `lib/crypto/`, v6.17 | [daed4fcf04db](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=daed4fcf04db) |
| 2025-07-20 | SG2042 compatible and configurable chip_info for spi-sg2044-nor (Zixian Zeng), v6.17 | [f6b159431697](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f6b159431697), [5653b4f88408](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5653b4f88408) |
| 2025-10-27 | SpacemiT K1 support in spi-fsl-qspi (Alex Elder), v6.19 | [abc9a349b87a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=abc9a349b87a) |
| 2025-11-17 | DWC MSHC reset handling promoted to IP level (Jisheng Zhang), v6.18, Cc stable | [747528729c9b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=747528729c9b) |
| 2026-01-12 | Vector AES migrated into `lib/crypto/` (Eric Biggers), v7.0 | [a4e573db06a4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a4e573db06a4) |
| 2026-01-22 | SpacemiT K3 added to the K1 SDHCI driver (Yixun Lan), v7.1 | [1e9f43a1dbef](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1e9f43a1dbef) |
| 2026-03-19 | Canaan K230 added to DWC MSHC (Jiayu Du, ISCAS), v7.1 | [4095694c09b9](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4095694c09b9) |
| 2026-05-02 | SpacemiT K1 SPI controller (Alex Elder, RISCstar Solutions), v7.2 | [efcd8b9d1111](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=efcd8b9d1111) |
| 2026-05-11 | K1 SDHCI voltage switching, clocks and SDR tuning (Iker Pedrosa), v7.2 | [00a97fc57c09](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=00a97fc57c09), [f87b273e4b6d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f87b273e4b6d), [e9cb83c10071](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e9cb83c10071) |
| 2026-08-03 | spi-dw enhanced SPI and StarFive JHB100 SFC (Sudip Mukherjee, SiFive; Changhuang Liang, StarFive), v7.3 | [c87b4ba09702](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c87b4ba09702), [defdd0f3d09a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=defdd0f3d09a), [012c1b04f528](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=012c1b04f528) |
| 2026-10-01 | sg2044-nor transfer-error and clock-limit fixes (Han Gao, ISCAS): clock limits v7.3; transfer errors reached mainline as e130c54fbb60 (v7.3) and again as 53cdc4266b93 (v7.4-rc1) | [61d44a2c07b2](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=61d44a2c07b2), [e130c54fbb60](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e130c54fbb60), [53cdc4266b93](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=53cdc4266b93) |

**Library relocations.** The RAID-5 XOR code moved from `arch/riscv/lib/xor.S` to `lib/raid/xor/riscv/` in 5265d55b2146 (v7.1). The RAID-6 code moved to `lib/raid/raid6/riscv/` in 3626738bc714 (v7.2). The commit SHAs for the move of the remaining crypto files into `lib/crypto/riscv/` were not looked up.

- f6b159431697 only adds an SG2042 compatible (+6 lines). The driver itself is de16c322eefb (v6.15).

**Fully upstream?** Yes for everything identified. All commits above are ancestors of HEAD (v7.4-rc1-132). No unmerged RISC-V storage series was identified; the mailing-list archives were not reviewed, so this is [NEEDS VERIFICATION].

## 3. Upstream Support Tier

**Formal tier policy.** Storage has no architecture tier policy. RISC-V acceptance rules are in `Documentation/arch/riscv/patch-acceptance.rst`, summarized in section 1. Storage patches follow each subsystem's own tree and list (linux-block, linux-nvme, linux-mmc, linux-scsi, linux-ide, linux-mtd, dm-devel, linux-raid, io-uring).

**Evidence of support level:**
- The block, NVMe (`depends on PCI && BLOCK`), UFS PCI (`depends on PCI`) and AHCI over PCI Kconfig entries carry no architecture gating, so they build on riscv64.
- The riscv `defconfig` enables `BLK_DEV_NVME=m`, `SATA_AHCI`, `VIRTIO_BLK`, `MMC_SDHCI_OF_DWCMSHC`, `MMC_SDHCI_OF_K1`, `MMC_DW_STARFIVE`, `MTD_SPI_NOR` and `BLK_DEV_DM=m`.
- CI: build and QEMU boot coverage only (section 7).
- Official binaries: none from kernel.org. Distros ship them (section 8).
- Runtime validation of NVMe, AHCI and UFS on riscv64 hardware is [NEEDS VERIFICATION].

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Block, NVMe, SCSI, ATA, UFS core | generic code | generic code | generic code, no RISC-V-specific change found |
| RAID-5/6, CRC and crypto acceleration | counterparts exist (not compared in detail) | counterparts exist; arm64 also has an EOR3 XOR path (`lib/raid/xor/arm64/xor-eor3.c`) | RVV and Zbc/Zvk* paths exist; no EOR3-equivalent found |
| Storage-specific CI | Data not available: not researched | Red Hat CKI runs blktests including nvme-tcp (one arm64 example) | none found; generic build, boot and kselftest only |
| Official kernel binaries | Data not available: not researched | Data not available: not researched | kernel.org ships source only; distro packages |

## 4. Technical Architecture and RISC-V-Specific Subsystems

No RISC-V code exists in `block/`, `io_uring/`, `drivers/nvme`, `drivers/md`, `drivers/scsi`, `drivers/ata`, `drivers/ufs` or `drivers/mtd` core. A broad `git grep` over those directories was not completed, so that statement rests on file-name listings and commit-history queries. The RISC-V-specific code that storage relies on is in `lib/`, `arch/riscv/` and SoC host drivers.

Ratings: full = hand-tuned assembly or inline-asm vector code; partial = C with intrinsics or inline asm; scalar = C fallback; generic = no arch code needed.

| Component | amd64 | arm64 | riscv64 | Rating | ISA extensions | Evidence |
|---|---|---|---|---|---|---|
| RAID-5 XOR | counterpart exists | counterpart exists, plus EOR3 | `lib/raid/xor/riscv/{xor.S, xor-glue.c, xor_arch.h}`; `xor_block_rvv` registered when `has_vector()` | full | V | v6.8 c5674d00cacd; falls back to 8regs/32regs |
| RAID-6 P/Q and recovery | counterpart exists | counterpart exists | `lib/raid/raid6/riscv/{rvv.c, recov_rvv.c}`: `raid6_rvvx1/x2/x4/x8`, `raid6_recov_rvv` | full (inline-asm RVV 1.0) | V | v6.16 6093faaf9593 |
| CRC32, CRC32C, T10DIF, CRC64-BE, CRC64-NVMe | counterpart exists | counterpart exists | `lib/crc/riscv/` using `clmul`, `clmulh`, `clmulr`; gated by `riscv_has_extension_likely(RISCV_ISA_EXT_ZBC)`; Kconfig `default y if RISCV && RISCV_ISA_ZBC`; 64-bit variants need `64BIT` | partial | Zbc | v6.14/v6.15, moved v6.17; fallback `crc32_le_base`, `crc32c_base`, `crc_t10dif_generic` |
| AES incl. XTS (dm-crypt) | counterpart exists | counterpart exists | `lib/crypto/riscv/aes-riscv64-zvkned*.S` | full | Zvkned, Zvkb, Zvbb, Zvkg | v6.9 original, v7.0 migration; falls back to generic AES |
| SHA-256/512 (dm-verity) | counterpart exists | counterpart exists | `sha256-riscv64-zvknha_or_zvknhb-zvkb.S`, `sha512-riscv64-zvknhb-zvkb.S` | full | Zvknha/Zvknhb, Zvkb | v6.17 move; original merge date [NEEDS VERIFICATION] |
| Other vector crypto (GHASH, SM3, ChaCha, Poly1305, SM4) | not compared | not compared | `lib/crypto/riscv/`, `arch/riscv/crypto/sm4-riscv64-zvksed-zvkb.S` | full | Zvkg, Zvksh, Zvkb, Zvksed | what else has landed is not checked |
| `csum_partial` (NVMe/TCP, iSCSI) | not compared | not compared | `arch/riscv/lib/csum.c` | partial (C with Zbb) | Zbb | v6.8 |
| DMA cache maintenance for non-coherent hosts | not compared | not compared | `arch/riscv/mm/dma-noncoherent.c`, `cache-ops.c`; `RISCV_DMA_NONCOHERENT`; vendor hooks in `arch/riscv/errata/{thead,andes}` | full | Zicbom, vendor cache ops | v6.0 1631ba1259d6; warns and taints the kernel if no cache-maintenance support |
| io_uring | generic | generic | generic syscall table | generic | none | present since v4.15 |
| blk-mq, NVMe, AHCI, SCSI, UFS, zoned, dm | generic | generic | generic | generic | none | no RISC-V-specific code found |

**SoC host drivers (MMC, SPI):**

| Driver | RISC-V SoC | First kernel |
|---|---|---|
| `dw_mmc` (MMC_DW depends on `... RISCV \|\| CSKY \|\| COMPILE_TEST`) | generic DesignWare | v5.10 |
| `dw_mmc-starfive.c` | StarFive JH7110 | v6.3 |
| `sdhci-of-k1.c` (`ARCH_SPACEMIT \|\| COMPILE_TEST`) | SpacemiT K1, K3 | v6.16, v7.1 |
| `sdhci-of-dwcmshc.c` (no arch dependency) | T-Head TH1520, Sophgo CV1800B/SG2002/SG2042, ESWIN EIC7700, Canaan K230 | driver v4.19-era origin e438cf49b305 (2018); K230 v7.1 |
| `spi-sg2044-nor.c` | Sophgo SG2042/SG2044 | v6.15 |
| `spi-spacemit-k1.c`, `spi-fsl-qspi` K1 support | SpacemiT K1 | v7.2, v6.19 |
| `spi-dw` enhanced SPI | StarFive JHB100, SiFive | v7.3 |
| `spi-cadence-qspi` JH7110 clock fixes (e53c0e99fd93, 324ecc7788c2) | StarFive JH7110 | not tag-checked |

The tag for e438cf49b305 (2018-07-06) was not checked, so the "v4.19-era" label is an inference from the date [NEEDS VERIFICATION]. I did not search `drivers/spi` for other RISC-V SPI controllers or `drivers/ufs` for RISC-V SoC UFS hosts. None turned up in file-name filters.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel builds with Kbuild and make. There is no configure step and no kernel-provided Dockerfile.

GNU cross build on an x86 host:

```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```

Clang/LLVM build:

```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc)
```

The output is `arch/riscv/boot/Image`. `LLVM=-N` selects versioned binaries, `LLVM_IAS=0` selects the non-integrated assembler and then requires `CROSS_COMPILE`. `arch/riscv/configs/` holds `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config` and nommu configs. The LLVM documentation lists riscv as "Supported".

**Toolchain minimums** (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`):

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | no riscv-specific floor |
| Clang/LLVM | 17.0.1 | |
| binutils | 2.30.0 | |
| GNU make | 4.0 | |
| Python | 3.9 | |
| pahole | 1.26 | BTF |
| Rust (optional) | 1.85.0 | riscv64 and LLVM/Clang only |
| bindgen (optional) | 0.71.1 | |

**RISC-V-specific toolchain rules and their reasons:**
- GCC below 11.3.0 sets `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` (`-Wa,-misa-spec=2.2`) because it does not accept zicsr and zifencei in `-march`.
- Binutils 2.36 or newer appends `_zicsr_zifencei` to `-march`, because binutils 2.38 and GCC 12.1 moved csr and fence.i out of the base I extension.
- Vector (`RISCV_ISA_V`) needs a compiler accepting `-march=rv64imv` and `ld.lld` or binutils 2.38 or newer. This gates the RAID-5/6 RVV code.
- Zba, Zbb, Zbc and Zbkb need compiler support plus `ld.lld` or binutils 2.39 or newer. This gates the CRC Zbc path.
- Dynamic ftrace needs `-fpatchable-function-entry=8` on GCC.
- `ARCH_HAS_BROKEN_DWARF5` is set when both the LLVM assembler and `ld.lld` are older than version 18.

**Disable flags.** Kbuild has no `-DUSE_X=OFF` flags. Features are `CONFIG_*` options: `CONFIG_RISCV_ISA_V=n`, `CONFIG_RISCV_ISA_C=n`, `CONFIG_FPU=n`, and `CONFIG_RUST` is off by default.

**Storage options in the riscv defconfig:** `BLK_DEV_INITRD`, `BLK_CGROUP`, `BLK_DEV_THROTTLING`, `BLK_DEV_LOOP`, `VIRTIO_BLK`, `SCSI_VIRTIO`, `BLK_DEV_NVME=m`, `BLK_DEV_SD`, `BLK_DEV_SR`, `ATA`, `SATA_AHCI`, `SATA_AHCI_PLATFORM`, `MTD`, `MTD_SPI_NOR`, `MMC_SDHCI_OF_DWCMSHC`, `MMC_SDHCI_OF_K1`, `MMC_DW`, `MMC_DW_STARFIVE`, `MMC_SPI`, `BLK_DEV_DM=m`, `DM_THIN_PROVISIONING=m`. The defconfig has no UFS, MD/RAID or zoned-block options. `IO_URING` is `default y` in `init/Kconfig`.

**QEMU.** `tools/testing/kunit/qemu_configs/riscv.py` runs `qemu-system-riscv64 -machine virt -cpu rv64` with OpenSBI at `/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin` and `console=ttyS0`. It needs `CONFIG_ARCH_VIRT`, the 8250 serial options and `CONFIG_RISCV_SBI_V01`. KUnit runs it as `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-`. For a storage test boot, appending `-drive file=disk.img,if=none,id=d0 -device virtio-blk-device,drive=d0` or `-device nvme,drive=d0,serial=x` follows from the defconfig drivers but is not documented in the tree [NEEDS VERIFICATION]. On Ubuntu 26.04 the package is `qemu-system-riscv`, since `qemu-system-riscv64` is not a package name.

**Known build failures.** Data not available: no storage-specific riscv64 build failure was found in the sources searched. The generic tool-version rules above are the known constraints.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | Notes |
|---|---|---|
| blk-mq, NVMe over PCIe, AHCI, SCSI, UFS PCI | builds (no arch gating) | runtime validation on riscv64 hardware [NEEDS VERIFICATION] |
| MMC/SD/eMMC on RISC-V SoCs | present for JH7110, K1/K3, TH1520, CV1800B/SG2002/SG2042, EIC7700, K230 | driver quality is SoC-specific (see section 11) |
| SPI-NOR / MTD | present for SG2042/SG2044, K1, DesignWare SPI, JH7110 Cadence QSPI | |
| MD RAID-5/6 acceleration | RVV | needs V; scalar fallback otherwise |
| CRC (block integrity, NVMe CRC64) | Zbc | needs Zbc; generic fallback otherwise |
| dm-crypt AES-XTS, dm-verity SHA | Zvkned, Zvknh* | needs vector crypto; generic fallback otherwise |
| io_uring | generic | no arch work needed |
| Zoned storage, device-mapper core | generic | defconfig does not enable zoned options |
| Storage selftests | `ublk` and `dm-verity` selftests are generic | no riscv-specific storage subtargets (section 7) |

**Functional gaps.** None found. Nothing in the findings shows a storage feature that cannot work on riscv64. The riscv defconfig omits UFS, MD/RAID and zoned-block options, which affects out-of-the-box configs, not capability.

**Performance gaps.** Every accelerated path depends on optional extensions (V, Zbc, Zvkned, Zvknh*) and falls back to scalar C. A board without V runs RAID, CRC and AES in plain C. No EOR3-equivalent to the arm64 XOR variant was found, which the source calls a micro-optimisation. Measured data is thin:
- StarFive VisionFive V2, Debian riscv64, kernel 5.15.0-starfive: KIOXIA XG6 NVMe at 149 MB/s fio 1M sequential read, 237.35 MB/s iozone 1M random read, 242.66 MB/s 1M random write, 27.87 MB/s 4K random read and 72.73 MB/s 4K random write. SanDisk Extreme microSD gave 23.6 MB/s sequential read and 2.83 MB/s 4K random write. The reviewer expected 350-400 MB/s on NVMe. The link had trained at 5GT/s x1 against an 8GT/s x4 capability, which explains the shortfall. Source: [geerlingguy sbc-reviews issue 10](https://github.com/geerlingguy/sbc-reviews/issues/10). This belongs mainly to "Linux SoC support" (PCIe).
- Cheshire SoC (CVA6 core) SDHCI host: up to 11.1 MB/s against a 12.5 MB/s SD limit. Memory fences on register accesses were the main bottleneck under Linux, and the authors customised register access paths to avoid them. A figure of about 224 kB/s before the fix is quoted elsewhere but is not in the abstract [NEEDS VERIFICATION]. Source: [arXiv 2603.11849](https://arxiv.org/abs/2603.11849).
- RAID-6 RVV patch (V2), QEMU 9.2.0 only, no hardware, `-cpu rv64,v=true,vlen=256`, kernel 6.13. With `-icount shift=0`: rvvx8 1694 MB/s (selected), int64x8 113 MB/s. Without `-icount`: RVV about 45 MB/s and int64x2 3405 MB/s (selected). These depend on QEMU timing mode and do not represent hardware. Source: [LKML thread](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/09585.html).
- Phoronix reports that auto-vectorising the kernel gives up to 15% for LZ4, 8.4% for Btrfs and 5% for XFS (LPC 2026 talk by Andy Chiu). The article was not read in full [NEEDS VERIFICATION], and the filesystem results belong to "Linux filesystems". Source: [Phoronix](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel).
- Data not available: riscv64 fio or IOPS data for UFS, MTD/SPI-NOR, dm/MD or io_uring, 2024-2025 riscv64 storage benchmarks, and riscv64-versus-arm64 storage comparisons. No such data exists on the RISE blog.

**Security hardening gaps.** Data not available: no storage-specific riscv64 hardening search was run. `arch/riscv/configs/hardening.config` exists.

**NaN / floating-point semantics.** Not applicable to storage.

## 7. CI/CD Infrastructure

No riscv64 storage-specific CI was found. The clone has no `.gitlab-ci*`, `.github/`, Jenkinsfile, `.travis*` or `.kci*` files, and MAINTAINERS has no blktests, KernelCI or LKFT entries.

**In-tree test infrastructure usable on riscv64:**
- `tools/testing/selftests/riscv/Makefile` builds `abi hwprobe mm sigreturn vector cfi`. None is a storage test.
- `tools/testing/selftests/Makefile` has `TARGETS += ublk` (line 145), not arch-conditional. The `ublk` selftest needs `CONFIG_BLK_DEV_UBLK=m` and `-luring`, and has a 150 second timeout. It runs wherever kselftest runs, including riscv64. Whether any riscv64 CI run builds and executes it is [NEEDS VERIFICATION].
- `tools/testing/selftests/dm-verity/` needs `CONFIG_DM_VERITY=m` and is generic.
- `drivers/nvme/common/.kunitconfig` (NVMe auth KUnit test) and `drivers/spi/.kunitconfig` (`SPI_DMA_KUNIT_TEST`) are arch-neutral. `kunit.py --arch=riscv` can run them under QEMU, but only as a manual invocation.
- No `tools/testing/selftests/io_uring` directory exists in the tree.
- KUnit suites for CRC and XOR (`lib/crc/.kunitconfig`, `lib/raid/xor/tests/xor_kunit.c`) exist. Whether CI runs them on riscv64 is [NEEDS VERIFICATION].

**External CI:**
- RISE and linux-riscv pre-commit CI (repositories `linux-riscv/linux-riscv`, `linux-riscv/github-ci`, `linux-riscv/docker`): cross-builds with QEMU boot tests (`ci-series`) and a kselftest job (`ci-kselftest`) on `defconfig` plus `kselftest-merge`. A 2024 mailing-list post described the kselftest job as an experiment, and I found no current description. No storage, blktests, NVMe or MMC tests are mentioned. Sources: [RISE pre-commit CI](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588931/RISE+Linux+Kernel+Pre-Commit+CI), [LKML post](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html).
- KernelCI: riscv64 QEMU jobs run via LAVA. The logs found are 2024 LTP boot logs with no blktests or NVMe jobs. The dashboard blocked fetches, so current coverage is [NEEDS VERIFICATION]. Source: [KernelCI qemu_riscv64 log](https://storage.kernelci.org/cip-gitlab/ci-iwamatsu-linux-5.10.y-cip-rc/v5.10.205-897-gcc9858ae2881/riscv/defconfig/gcc-10/lab-collabora/ltp-fcntl-locktests-qemu_riscv64.html).
- Hardware: RISE and Collabora added the Banana Pi BPI-F3 (SpacemiT K1) and SiFive HiFive Premier P550 (EIC7700) to Collabora's public LAVA lab under RP012. KernelCI uses the lab. Storage appears only as boot media (SPI flash, eMMC, SD, UFS). Source: [RISE hardware-in-the-loop post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/).
- RISE RISC-V Runners (ubuntu-24.04-riscv, Scaleway EM-RV1 hardware) are native GitHub Actions runners. Kairos uses them. No storage project use was found. Source: [RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/).
- Red Hat CKI runs blktests, including nvme-tcp, but the only example found is arm64 [NEEDS VERIFICATION]. Source: [CKI report](https://yhbt.net/lore/linux-arm-kernel/38652.124050915300700877@us-mta-299.us.mimecast.lan/). No riscv64 CKI blktests evidence was found.
- The blktests repository has a GitHub Actions workflow named "CI". Its contents could not be opened and the README does not mention riscv64. Source: [linux-blktests/blktests](https://github.com/linux-blktests/blktests).
- LKFT and syzbot riscv64 storage coverage: not checked [NEEDS VERIFICATION].

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel pre-commit build and boot | Data not available: not researched | Data not available: not researched | RISE linux-riscv CI: cross-build, QEMU boot, kselftest |
| blktests in CI | Data not available: not researched | Red Hat CKI example (single source) | none found |
| NVMe / MMC / UFS hardware tests | Data not available: not researched | Data not available: not researched | none found; LAVA boards exist as infrastructure only |
| KernelCI | Data not available: not researched | Data not available: not researched | QEMU LTP boot logs (2024); current coverage unverified |

## 8. Distribution and Release Status

**Upstream releases.** kernel.org ships source only. As of 2026-11-03 mainline is 7.4-rc1 (2026-11-01) and the latest stable is 7.3.1 (2026-10-30). Longterm releases, all 2026-10-30, are 6.18.60, 6.12.115, 6.6.161, 6.1.191, 5.15.224 and 5.10.273. Source: [kernel.org releases](https://www.kernel.org/releases.json). Storage ships inside the kernel. There is no separate storage artifact, no PyPI project (`linux-storage` returns HTTP 404 on [PyPI](https://pypi.org/pypi/linux-storage/json) and the RISE wheel index), no RISE-built artifact and no OCI image.

**Distros:**
- Ubuntu 26.04 (resolute): the riscv64 package index lists `linux-image-7.0.0-14-generic`, `linux-libc-dev` and `linux-tools-common`. The [packages.ubuntu.com page](https://packages.ubuntu.com/resolute/linux-image-generic) lists "7.0.0-42.42 and others" with riscv64. The two sources disagree on the version, probably because they were read at different times. Distro patch status for the kernel was not checked.
- Debian: a [kernel-team merge request](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821), "riscv64 config update for linux 6.19", was opened 2026-02-14. Whether it touches storage options is [NEEDS VERIFICATION].
- openSUSE: riscv64 kernels exist (bug reports reference 6.3.0-rc3-25-default). Their storage config was not checked.
- Fedora: a Phoronix Test Suite result ran on riscv64 Fedora 33 with kernel 5.15.10. Current Fedora config was not checked.
- Arch Linux RISC-V: the main `linux` kernel is mentioned, with no version. Config was not checked.
- Data not available: distro-by-distro comparison of storage Kconfig options (NVMe, UFS, MD, zoned) on riscv64.

**Getting a working binary.** A user installs the distro kernel image (for example `linux-image-*-generic` on Ubuntu 26.04 riscv64), or builds from source with the commands in section 5. Userspace storage tools (mdadm, lvm2, cryptsetup, nvme-cli, fio, liburing, mtd-utils, mmc-utils, among others) are in the Ubuntu 26.04 riscv64 index. LTP, blktests, nvmetcli, libzbc-tools, ublksrv and syzkaller are not packaged and must be built from source.

## 9. Dependencies

Package status is from the Ubuntu 26.04 (resolute) riscv64 `Packages` indexes (main and universe), not from the project graph, which was unavailable. "Build" means a package exists in the archive. Test status is [NEEDS VERIFICATION] for every row unless stated otherwise.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | the subsystem itself (runtime, critical); `linux-image-7.0.0-14-generic` | builds | build and boot CI only; storage tests absent | packaged in 26.04 | mainline; see sections 7 and 8 |
| OpenSBI | firmware needed to boot the kernel (runtime, critical); `opensbi` 1.8.1 | builds | [NEEDS VERIFICATION] | packaged in 26.04 | status report colour orange (project-reports/opensbi.md) |
| GCC | kernel build compiler (critical); `gcc-15` 15.2.0; kernel minimum 8.1.0 | builds | [NEEDS VERIFICATION] | packaged in 26.04 | project-reports/gcc.md |
| GNU binutils | assembler and linker (critical); 2.46; kernel minimum 2.30 | builds | [NEEDS VERIFICATION] | packaged in 26.04 | project-reports/gnu-binutils.md |
| LLVM | optional kernel toolchain (Clang, lld) 21.1.6; kernel minimum 17.0.1 | builds | [NEEDS VERIFICATION] | packaged in 26.04 (universe) | status report colour yellow (project-reports/llvm.md) |
| dtc | compiles the device trees describing storage controllers (optional); `device-tree-compiler` 1.7.2 | builds | [NEEDS VERIFICATION] | packaged in 26.04 | no report |
| QEMU | test platform for virtio-blk, NVMe and SD models (optional); `qemu-system-riscv` 10.2.1 | builds | [NEEDS VERIFICATION] | packaged in 26.04 | status report colour yellow (project-reports/qemu.md) |
| LTP | kernel regression suite covering block and I/O syscalls (optional) | not packaged | KernelCI ran LTP boot logs on QEMU riscv64 in 2024; storage coverage not found | not in Ubuntu 26.04 riscv64 | no package; build from source |
| blktests | block-layer test suite (optional); also needs fio, nvme-cli, nvmetcli, blktrace | not packaged | no riscv64 run found | not in Ubuntu 26.04 riscv64 | no package; build from source |

**Additional build and runtime dependencies found (all packaged in Ubuntu 26.04 riscv64):**

| Name | Role | Version | Notes |
|---|---|---|---|
| GNU make, bison, flex, bc | kernel build | 4.4.1, 3.8.2, 2.6.4, 1.07.1 | |
| elfutils (`libelf-dev`) | objtool, BTF | 0.194 | project-reports/elfutils.md |
| OpenSSL (`libssl-dev`) | module signing | 3.5.5 | project-reports/openssl.md |
| Python 3 | scripts and selftest tooling | 3.14.3 | kernel minimum 3.9 |
| Rust (`rustc`, `bindgen`) | optional Rust-for-Linux | 1.93.1, 0.72.1 | Rust block drivers on riscv64 not assessed [NEEDS VERIFICATION] |
| dwarves (`pahole`) | BTF | 1.31 | kernel minimum 1.26 |
| u-boot-tools | `mkimage` | 2025.10 | |
| liburing | io_uring userspace and selftests | 2.14 | status report colour yellow |
| util-linux, udev, kmod | block-device userspace | 2.41.3, 259.5, 34.2 | |
| lvm2, dmsetup, mdadm, cryptsetup, multipath-tools | dm, MD and dm-crypt userspace | 2.03.31, 1.02.205, 4.5, 2.8.4, 0.14.3 | |
| nvme-cli, libnvme | NVMe management | 2.16, 1.16.1 | |
| fio, libaio | storage benchmarking and test | 3.41, 0.113 | use `libaio1t64`, not `libaio1` |
| e2fsprogs, xfsprogs, btrfs-progs | filesystem tools for storage tests | 1.47.2, 6.18.0, 6.17.1 | filesystems covered by "Linux filesystems" |
| smartmontools, sg3-utils, hdparm, lsscsi, parted, gdisk | SATA, SCSI, partitioning | 7.5, 1.48, 9.65, 0.32, 3.6, 1.0.10 | |
| open-iscsi, targetcli-fb, ndctl | iSCSI, LIO target, NVDIMM | 2.1.11, 3.0.1, 81 | |
| mtd-utils, mmc-utils | MTD and MMC userspace | 2.3.0, 1.0 | |
| blktrace, stress-ng, zonefs-tools, f2fs-tools, libblkio-dev, tgt | tracing, stress, zoned, virtio-blk | 1.2.0, 0.20.01, 1.7.0, 1.16.0, 1.5.0, 1.0.85 | |
| dracut, initramfs-tools | initramfs for boot from NVMe, SD or eMMC | 110, 0.151 | |

**Not packaged for Ubuntu riscv64:** nvmetcli, libzbc-tools, ublksrv, syzkaller, dmraid (obsolete). These are test-tooling gaps, not product blockers.

**Deep-dive on SIMD and crypto dependencies.** The kernel's own RISC-V code needs binutils 2.38 or newer (vector) or 2.39 or newer (Zba/Zbb/Zbc/Zbkb) when using GNU tools, or `ld.lld`. This is covered in section 5. Firmware: OpenSBI is needed to boot; its report colour is orange, which makes it the weakest listed dependency. Details are in the OpenSBI report and are not repeated here.

## 11. Known Bugs and Active Issues

No open riscv64-specific storage bug with a tracker ID was found. The tables below list what the sources show.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| none | RAID-6 RVV `rvvx4` NULL pointer dereference at virtual address 0x20 | patch-review report; unresolved in the thread excerpt | Medium | Charlie Jenkins reproduced it in QEMU with a trimmed defconfig plus MD_RAID456; Chunyan Zhang could not. The series later landed (6093faaf9593, v6.16). Whether the crash was fixed is [NEEDS VERIFICATION]. [LKML thread](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/09585.html) |
| none | VisionFive V2 NVMe PCIe link downgraded to 5GT/s x1 | open on a 5.15 kernel | Medium (performance) | Capability 8GT/s x4; belongs to "Linux SoC support". [Issue 10](https://github.com/geerlingguy/sbc-reviews/issues/10) |
| openSUSE bugzilla 1196357 | HiFive Unmatched slow boot reading initrd at efistub with three microSD cards | status unknown | Low | Only a search listing was seen [NEEDS VERIFICATION]. [Thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/IP3PN7CNOOJNESBUWSQNIEAMAAMNFAY6) |
| openSUSE bugzilla 1209674 | 6.3.0-rc3-25-default boot crash, "Store/AMO access fault" | status unknown | Unknown | Storage relevance not established [NEEDS VERIFICATION]. [Thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/NH7GQ43MQPWTXCVDEY5ZAFI6SIE5Q4KQ) |
| Launchpad 2016881 | zfs-linux FTBFS on riscv64 (Focal) | fixed on Jammy and newer; Bionic and Focal Won't Fix | Low | userspace package, not the kernel. [Bug](https://launchpad.net/bugs/2016881) |
| Launchpad 2042388 | linux-starfive mantic 6.5.0-9 | test kernel reported to fix | Unknown | symptom not stated; storage link not confirmed. [Comment](https://bugs.launchpad.net/ubuntu/+source/linux-starfive/+bug/2042388/comments/4) |
| Launchpad 2024935 | D1 (MangoPi MQ-Pro) 2.7x slower on 23.04 than 22.10 | not stated | Not storage | CPU issue. [Bug](https://bugs.launchpad.net/bugs/2024935) |

**Correctness issues fixed in mainline (driver level):**
- 747528729c9b (v6.18, Cc stable): stale command interrupt handling after reset affected the TH1520 path and, per the author's testing, all DWC MSHC users including cv1800b and sg2002. Reset handling was promoted to IP level.
- 7613b9b1084c (v6.17): K1 SDHCI hardware busy detection disabled.
- The K3 commit message (1e9f43a1dbef) states the K3 fixes a "broken 64BIT DMA issue" in the shared K1 IP generation, so K1 has a 64-bit DMA limitation. The exact K1 workaround was not read.
- sg2044-nor transfer errors and clock limits (61d44a2c07b2, 53cdc4266b93 or e130c54fbb60) were fixed in 2026-10.
- Four K1 SPI fixes landed in 2026-07 (8955fbad8aad, d3c87e71539c, a88df1d92fcf, 79052a6a6f5b). Their contents and tags were not checked.

linux-nvme 2025 threads (a `mm/hugetlb.c` BUG triggered by blktests nvme/029, and "nvme4: inconsistent AWUPF") are not tagged riscv64 and are not counted as riscv bugs. The Debian 6.19 config merge request is [NEEDS VERIFICATION]. Data not available: syzbot, KernelCI and Bugzilla queries, since those sites blocked fetches.

## 12. Objections and Upstream Blockers

- **Stated objections.** None found. No unmerged RISC-V storage series was found, and the linux-block, linux-mmc and linux-nvme archives were not reviewed, so this is [NEEDS VERIFICATION].
- **Technical blockers.** None identified for core storage, which is arch-independent. Constraints are hardware-dependent: non-coherent DMA needs Zicbom or vendor cache hooks (warn and taint otherwise), and accelerated paths need V, Zbc or vector crypto. The Cheshire study shows fence cost on cores without cache-management operations.
- **Organizational blockers.** No RISC-V storage maintainer exists, and the MMC-over-SPI driver is orphaned. No RISE working group or funded item covers storage. Test coverage depends on the generic RISE and KernelCI infrastructure.
- **Acceptance probability.** High for further SoC host drivers and Kconfig enablement, based on 20+ merged commits since 2019 with no rejection found. This is an inference from merge history, not from a stated maintainer position.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification.** Storage support is in mainline and builds and boots on riscv64: the generic block/NVMe/AHCI/UFS Kconfig is not arch-gated, and there are RVV RAID-5/6 XOR and Zbc CRC code paths plus RISC-V SoC MMC/SPI drivers (for example [sdhci-of-k1 e5502d15b0f3](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e5502d15b0f3)). The riscv64 CI found ([RISE linux-riscv pre-commit CI](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588931/RISE+Linux+Kernel+Pre-Commit+CI)) does cross-builds, QEMU boots and generic kselftests. No storage-specific riscv64 tests (blktests, NVMe, MMC) were found, so this is build and boot coverage only. Riscv64 binaries come from distros (Ubuntu 26.04 packages linux-image 7.0.0-14), while kernel.org ships source only.

**Pending work that could change the grade.** Not verified: KernelCI, LKFT and syzbot riscv64 storage coverage (dashboards and mailing-list archives were not reviewed). If KernelCI or CKI run blktests or NVMe/MMC tests on riscv64, the grade could move to blue, but there is no upstream-published riscv64 binary so green is not reachable. Related recent work: the spi-dw enhanced SPI series (merged in v7.3) and sg2044-nor fixes (v7.3). No RISE-funded storage work was found. RP012 LAVA lab boards (BPI-F3, HiFive Premier P550) are test infrastructure only. Ubuntu riscv64 availability came from the package index, and the distro patch status for the kernel was not checked.

## 14. Investment Analysis

**RISE check first.** RISE has no storage blog post, repository, runner use or funded work. The 38 blog posts (2024-05-15 to 2026-10-30) were scanned by slug, and the 8 most recent in full for storage content. The RISE working groups (Kernel & Virtualization, Developer Infrastructure and others) list no storage item, though the Kernel & Virtualization wiki page was not readable and RISE's GitHub project boards were not checked [NEEDS VERIFICATION]. RP012 provides the LAVA boards that new test jobs would use, so that infrastructure should not be sized here. Effort figures below are planning estimates, not measured data.

### 14.1 Functional Enablement

- Validate NVMe over PCIe, AHCI and UFS PCI at runtime on riscv64 hardware and QEMU, since only build-time Kconfig was checked. About 3 person-weeks.
- Run blktests (including NVMe target tests) on riscv64 QEMU and one hardware board, and triage failures. About 5 person-weeks.
- Confirm status of the RAID-6 `rvvx4` crash report and the four K1 SPI fixes. About 1 person-week.
- Audit distro riscv64 kernel configs (Debian, Ubuntu, Fedora, openSUSE, Arch) for NVMe, UFS, MD and zoned options. About 2 person-weeks.

### 14.2 Performance Optimization

- Establish fio and io_uring baselines on current riscv64 hardware (no 2024-2025 data exists), compared with an arm64 board. About 4 person-weeks.
- Measure RVV RAID-5/6, Zbc CRC and vector crypto on real hardware, because the only RVV RAID data is QEMU. About 3 person-weeks.
- Assess cost of register-access fences on cores without cache-management operations (Cheshire finding). About 2 person-weeks.

### 14.3 CI/CD Infrastructure

- Add `ublk` and `dm-verity` selftests plus CRC, XOR and NVMe-auth KUnit suites to the RISE `ci-kselftest` job. About 3 person-weeks.
- Run blktests nightly under QEMU on RISE runners. About 4 person-weeks.
- Add MMC/SD/eMMC boot-and-I/O tests on the RP012 LAVA boards. About 4 person-weeks.
- Verify what KernelCI, LKFT and syzbot already run on riscv64 for storage. About 1 person-week.

### 14.4 Ecosystem Enablement

There is no dependent package ecosystem, so section 10 is omitted. The packaging gap is test tooling: LTP, blktests, nvmetcli, libzbc-tools and ublksrv are not in Ubuntu 26.04 riscv64. Packaging them is about 3 person-weeks.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Runtime validation of NVMe, AHCI and UFS on riscv64 | 3 | Internal kernel team | High |
| Functional | blktests on QEMU and one board, with triage | 5 | Internal kernel team | High |
| Functional | Distro config audit | 2 | Internal kernel team with distro maintainers | Medium |
| Functional | Confirm RAID-6 RVV crash and K1 SPI fix status | 1 | Internal kernel team | Medium |
| Performance | fio and io_uring baselines vs arm64 | 4 | Internal performance team | High |
| Performance | RVV RAID, Zbc CRC and vector crypto on hardware | 3 | Internal performance team | Medium |
| Performance | Fence overhead on cores without CMO | 2 | Internal kernel team | Low |
| CI/CD | Storage selftests and KUnit in RISE `ci-kselftest` | 3 | RISE Developer Infrastructure WG with internal team | High |
| CI/CD | Nightly blktests on QEMU | 4 | Internal infrastructure team | High |
| CI/CD | MMC/SD/eMMC tests on RP012 LAVA boards | 4 | RISE and Collabora with internal team | Medium |
| CI/CD | Audit KernelCI, LKFT and syzbot riscv64 storage coverage | 1 | Internal infrastructure team | High |
| Ecosystem | Package LTP, blktests, nvmetcli, libzbc-tools, ublksrv | 3 | Distro (Canonical) with internal team | Low |

## 15. References

- [Linux kernel source (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [Linux block layer documentation](https://docs.kernel.org/block/index.html)
- [Kernel RISC-V documentation index](https://docs.kernel.org/next/arch/riscv/index.html)
- [kernel.org releases.json](https://www.kernel.org/releases.json)
- [sdhci-of-k1 commit e5502d15b0f3](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e5502d15b0f3)
- [MMC_DW Kconfig commit ce54fb38fa42](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ce54fb38fa42)
- [RAID-6 RVV commit 6093faaf9593](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6093faaf9593)
- [RAID-5 XOR RVV commit c5674d00cacd](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c5674d00cacd)
- [Zicbom DMA commit 1631ba1259d6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1631ba1259d6)
- [RISE Linux Kernel Pre-Commit CI](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588931/RISE+Linux+Kernel+Pre-Commit+CI)
- [Github RISC-V CI (BoF follow-up)](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE hardware-in-the-loop post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE Kairos post](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [KernelCI qemu_riscv64 boot log](https://storage.kernelci.org/cip-gitlab/ci-iwamatsu-linux-5.10.y-cip-rc/v5.10.205-897-gcc9858ae2881/riscv/defconfig/gcc-10/lab-collabora/ltp-fcntl-locktests-qemu_riscv64.html)
- [CKI report (arm64, blktests)](https://yhbt.net/lore/linux-arm-kernel/38652.124050915300700877@us-mta-299.us.mimecast.lan/)
- [linux-blktests/blktests](https://github.com/linux-blktests/blktests)
- [PyPI linux-storage JSON (404)](https://pypi.org/pypi/linux-storage/json)
- [Ubuntu resolute linux-image-generic](https://packages.ubuntu.com/resolute/linux-image-generic)
- [Debian kernel-team merge request 1821](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821)
- [VisionFive V2 benchmarks (sbc-reviews issue 10)](https://github.com/geerlingguy/sbc-reviews/issues/10)
- [Cheshire SD host controller paper (arXiv 2603.11849)](https://arxiv.org/abs/2603.11849)
- [RAID6 RISC-V SIMD patch thread (LKML)](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/09585.html)
- [openSUSE bug 1196357 thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/IP3PN7CNOOJNESBUWSQNIEAMAAMNFAY6)
- [openSUSE bug 1209674 thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/NH7GQ43MQPWTXCVDEY5ZAFI6SIE5Q4KQ)
- [Launchpad 2016881](https://launchpad.net/bugs/2016881)
- [Launchpad 2042388 comment 4](https://bugs.launchpad.net/ubuntu/+source/linux-starfive/+bug/2042388/comments/4)
- [Launchpad 2024935](https://bugs.launchpad.net/bugs/2024935)
- [Ubuntu DPDK and SPDK RISC-V post](https://discourse.ubuntu.com/t/accelerate-network-and-storage-applications-on-risc-v-with-dpdk-and-spdk/30274)
- [Phoronix auto-vectorize RISC-V kernel](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel)
- [Phoronix Linux 7.4 RISC-V](https://phoronix.com/news/Linux-7.4-RISC-V)