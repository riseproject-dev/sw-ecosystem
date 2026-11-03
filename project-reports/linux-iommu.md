---
title: Linux IOMMU
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
  - name: dtc
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-iommu" %}

# Linux IOMMU

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux IOMMU<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

Source limits for this report:
- lore.kernel.org and git.kernel.org were not accessible to web fetches. Every mailing-list item therefore comes from mirrors (LWN, ratatoskr.run, lkml.iu.edu, patchew, lists.infradead.org) and is [NEEDS VERIFICATION] against lore.
- Commit, tag, Kconfig, MAINTAINERS and test-tree facts were read from a local mainline clone (HEAD 05441d697f7f, v7.4-rc1-132, 2026-11-03). v7.3 is the latest release and v7.4-rc1 the latest tag.
- Package-graph availability was not queried.

## 1. Project Overview

Linux IOMMU on RISC-V is the in-kernel driver for the RISC-V IOMMU specification (version 1.0, published in [riscv-non-isa/riscv-iommu](https://github.com/riscv-non-isa/riscv-iommu)). It lives in `drivers/iommu/riscv/` (iommu.c 1663 lines, iommu-platform.c, iommu-pci.c, iommu-bits.h, iommu.h) and is a subsystem of the Linux kernel, not a standalone package.

What is in mainline today:
- Device directory management, command and fault queues, platform (DT `riscv,iommu`) and PCI probing, and DMA-API paging domains.
- Platform MSI for the IOMMU's own interrupts, ACPI discovery through the RIMT table, and the generic page-table (iommupt) format with SVNAPOT contiguous PTEs, Svpbmt and NAPOT range invalidation.
- PCI IDs matched: Red Hat/QEMU `1b36:0014` and Rivos `1efd:0008`.

What is not in mainline:
- VFIO/iommufd passthrough, IOMMU_DMA, MSI remapping, irqbypass, nested translation, ATS/PRI/SVA/PASID and the HPM perf PMU.
- Code comments in `iommu.c` state that SVA and PASID have not yet been merged, and the driver reports only `IOMMU_CAP_CACHE_COHERENCY` and has no `.set_dev_pasid`.

Governance:
- No foundation owns this subsystem. The kernel is community-governed through maintainer trees and mailing lists, hosted on kernel.org, with lists on lists.linux.dev and lists.infradead.org.
- MAINTAINERS entry "RISC-V IOMMU": Tomasz Jeznach (tomasz.jeznach@linux.dev), status Maintained. Lists: iommu@lists.linux.dev and linux-riscv. Tree: `git.kernel.org/pub/scm/linux/kernel/git/iommu/linux.git`. Files: `drivers/iommu/riscv/` and `Documentation/devicetree/bindings/iommu/riscv,iommu.yaml`. No CI link is listed.
- The IOMMU subsystem merge path is Joerg Roedel (AMD), Will Deacon, and reviewer Robin Murphy (Arm). The iommufd core is maintained by Jason Gunthorpe (NVIDIA) and Kevin Tian (Intel), tree `jgg/iommufd.git`.
- The license was not confirmed from the iommufd documentation page [NEEDS VERIFICATION]. The kernel is GPL-2.0, and per-file SPDX tags were not checked.

Corporate contributors, by commit count on `drivers/iommu/riscv` (47 commits in total):

| Author | Commits | Organization |
|---|---|---|
| Jason Gunthorpe | 17 | NVIDIA |
| Tomasz Jeznach | 6 | Rivos |
| Fangyu Yu | 6 | Alibaba |
| Xu Lu | 2 | ByteDance |
| Yaxing Guo | 1 | BOSC |
| XianLiang Huang | 1 | Lanxin Computing |
| Sunil V L | 1 | Ventana Micro |
| Nicolin Chen | 1 | NVIDIA |
| Will Deacon, Joerg Roedel | 1 each | kernel.org address, AMD |

Other vendors seen in commits and bindings: Tenstorrent, SiFive (review), Qualcomm (Andrew Jones, formerly Ventana), Picoheart, emlix and BayLibre.

Community stance on new ports:
- Upstream accepted the driver through the generic IOMMU subsystem. Reviewers required discussion on the generic IOMMU list, and Joerg Roedel applied the series with Palmer Dabbelt's ack.
- No formal policy on new ports was found.
- The maintainer is receptive to redesign. In May 2026 he rejected an identity-map workaround for IMSIC addresses in favour of the `iommu_dma_prepare_msi()` path ([thread](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091163.html)).

## 2. Port History and Upstreaming Timeline

The RISC-V IOMMU driver is fully upstream for the features it implements. Several features remain unmerged (Section 6).

Dates for merged items are committer dates unless stated. Tags come from `git describe --contains` in the clone.

| Date | Event | Source |
|---|---|---|
| 2023-05-25 | RISE records "Project reported as priority for 2H23" (item LK_01_007) | [RISE issue #3](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/3) |
| 2023-07-19 | v1 of "Linux RISC-V IOMMU Support", 13 patches, Tomasz Jeznach (Rivos) | [patchew v1](https://patchew.org/linux/cover.1689792825.git.tjeznach@rivosinc.com/) |
| 2023-07 | MAINTAINERS entry patch | [linux-riscv](https://lists.infradead.org/pipermail/linux-riscv/2023-July/036651.html) |
| 2024-04 to 2024-10 | v2 through v10, 7 patches each | [v10](https://patchew.org/linux/cover.1729059707.git.tjeznach@rivosinc.com), [v3](https://lwn.net/Articles/972035/) |
| 2024-10-29 | Platform driver [5c0ebbd3c6c6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5c0ebbd3c6c6) and the rest of the series (PCIe driver, device directory, queues, registration, paging domain) committed, authored 2024-10-15; first in v6.13-rc1, release v6.13 tagged 2025-01-19 | Clone |
| 2024-12-18 | Platform MSI, d5f88acdd6ff (Andrew Jones); v6.14-rc1 | Clone |
| 2025-01-06 | Shutdown function 77a44196abfb and "Empty iommu queue before enabling it" 8d8d3752c0a4 (Xu Lu); v6.14-rc1 | Clone |
| 2025-08-22 | NULL deref fix in iova_to_phys, 99d4d1a07087; v6.17-rc3 | Clone |
| 2025-09-05 | ACPI RIMT parsing 8f7729552582 and IOMMU ACPI support 4f901b3dce57 (Sunil V L); v6.18-rc1 | Clone |
| 2025-09-20 | RFC v2 "iommu/riscv: Add irqbypass support", 18 patches (Andrew Jones) | [kvm-riscv](https://lists.infradead.org/pipermail/kvm-riscv/2025-September/010148.html) |
| 2026-03-17 | Generic page table conversion e5ef32191a87, SVNAPOT, IOTINVAL fix, MSI IRQ-count fix; v7.1-rc1 | Clone |
| 2026-05 | NAPOT range invalidation 082ad5ed0785, Svpbmt f196a8668797, Tenstorrent binding 33583baeb1ba; v7.2-rc1 | Clone |
| 2026-05-12 | "Map IMSIC addresses for paging domains" posted; maintainer asks for the `iommu_dma_prepare_msi()` path | [thread](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091163.html) |
| 2026-07-24 | "Enable MSI remapping and IOMMU_DMA" v2, 14 patches | [LWN](https://lwn.net/Articles/1084967/) |
| 2026-08-07 | v3, 19 patches; Thomas Gleixner reviews patches 06 and 07 | [mirror](https://lore.jethome.com/lkml/878q6hekyy.ffs@fw13/T/) |
| 2026-08-21 | "Report cache coherency capability" authored, 3069e8f3e1e9; v7.4-rc1 | Clone |
| 2026-08-31 / 2026-09-25 | v5 (17 patches, redesign) / v6 (16 patches) of the MSI-remapping series | [LWN v6](https://lwn.net/Articles/1096863/) [NEEDS VERIFICATION] |
| 2026-09-01 | Command-queue lock, serialized publishing and failed-enqueue fixes by Fangyu Yu (d5bcf9ccaa35, ca58afa40946, 4c50bec3d542) | Clone |
| 2026-11-03 | Downstream RVCK 6.6 issue on MSI remapping, IOMMU_DMA and IRQ bypass opened | [RVCK #480](https://github.com/RVCK-Project/rvck/issues/480) |

Notes on versions and tags:
- The submission history says v10 was applied, and the patchew link names v10 (cover.1729059707). The governance notes describe the series as running through v9 in October 2024.
- 8d8d3752c0a4 and 10c62c38b073 are in v6.14-rc1, and f5c262b54497, 69541898b71a and 7cd0c655f02f are in v7.1-rc1.
- d5bcf9ccaa35, ca58afa40946 and 4c50bec3d542 (command-queue locking, publishing and enqueue-failure fixes, 2026-09-01) all first appear in v7.3-rc3 (`git describe --contains`).
- The RISE wiki page LK_01_007 gives no upstream version. The "6.13" claim comes from the migrated GitHub issue and matches the clone.

## 3. Upstream Support Tier

The kernel has no tier policy for architectures or drivers. The only status indicator is the `S:` field in MAINTAINERS. RISC-V IOMMU is "Maintained", meaning someone looks after it but is not necessarily paid to. It is not "Supported". RISE defines no tiers or ranked project list for it.

Evidence:
- CI: no riscv64 CI specific to the IOMMU exists (Section 7).
- Release-blocking: the kernel has no release-blocking platform criteria.
- Official binaries: upstream ships source only. riscv64 binaries come from distro kernels.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal tier | Data not available: not searched | Data not available: not searched | None; MAINTAINERS status "Maintained" |
| IOMMU driver in mainline | Data not available: not searched | Data not available: not searched | Yes, since v6.13 |
| IOMMU-specific CI | Data not available: not searched | Data not available: not searched | None found |
| iommufd mock selftest page-table format | AMDv1 (`IOMMUFD_TEST` depends on `IOMMU_PT_AMDV1`) | Data not available | Not used; RISC-V covered by generic_pt KUnit only |
| VFIO/iommufd passthrough | Data not available: not searched | Data not available: not searched | Not merged |
| Nested translation | Data not available; search for RISC-V nested series returned Intel and ARM results only | See amd64 | RFC only (2026-04-28) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

There is no assembly, JIT or SIMD dispatch for the IOMMU. All RISC-V-specific code is C. No `.S` file under `arch/riscv` relates to the IOMMU. The mechanism for non-coherent DMA cache maintenance uses inline instructions and errata alternatives; the exact inline-asm location was not read [NEEDS VERIFICATION].

| Component | Location | Detail | Quality |
|---|---|---|---|
| RISC-V IOMMU driver | `drivers/iommu/riscv/` | DDT, command/fault queues, platform and PCI binding, paging domains | C, in mainline |
| Generic page-table RISC-V format | `drivers/iommu/generic_pt/fmt/` (`riscv.h` 322 lines, `defs_riscv.h`, `iommu_riscv64.c`) | Added by Jason Gunthorpe in e71e00127110 (2026-02-27); driver converted in e5ef32191a87 (v7.1); Sv39/Sv48/Sv57; Svpbmt (f196a8668797) and SVNAPOT | C, in mainline |
| ACPI RIMT parser | `drivers/acpi/riscv/rimt.c` (528 lines) | Sunil V L (Ventana), 8f7729552582; `arch/riscv/Kconfig` selects `ACPI_RIMT if ACPI` | C, in mainline |
| Non-coherent DMA | `arch/riscv/mm/dma-noncoherent.c` (157 lines), `cache-ops.c` (17 lines) | Zicbom (1631ba1259d6, 2022-07-07, Heiko Stuebner), T-Head variant, vendor cache ops (Renesas AX45MP, 2023-08-18); errata under `arch/riscv/errata/{thead,andes,sifive,mips}/` | C plus inline asm |
| SWIOTLB | `arch/riscv/Kconfig` | `select SWIOTLB if MMU` (10314e09d044, 2018-04-27); fix for DRAM above 4GB cfca5a48b03f (v7.2-rc6) | C |
| Secondary MMU TLB notifier | `arch/riscv` | d9be2b9b6049 (Alexandre Ghiti, 2025-01-13) | C |

The IOMMU's own interrupts use MSI through `linux/irqchip/riscv-imsic.h`. The unmerged series adds an IMSIC remapping path (`drivers/iommu/riscv/iommu-ir.c`, 698 lines in RFC v2).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| IOMMU driver | Data not available: not searched | Data not available: not searched | Present, C, no ISA extension dependency beyond the spec's capabilities |
| Page-table format in generic_pt | AMDv1 present (per the iommufd Kconfig) | Data not available | RISC64 present; Svpbmt and SVNAPOT used |
| Assembly/JIT/SIMD for IOMMU | Data not available | Data not available | None |

Not checked: `.dts` users of `riscv,iommu`, the full tree for other RISC-V IOMMU references (a `git grep` timed out on the blobless clone), and perf/HPM and dirty-tracking code in tree.

## 5. Build System, Cross-Compilation, and Toolchain

The IOMMU code builds with the normal kernel toolchain. Kbuild/Kconfig are the only build mechanism: there is no cmake or configure step and no Dockerfile in the tree. These commands are assembled from `arch/riscv/Makefile`, `Documentation/kbuild/llvm.rst` and `tools/testing/selftests/riscv/README`. They were not run. The `riscv64-linux-gnu-` prefix is the usual Debian/Ubuntu name and is not stated in the tree.

GNU cross toolchain:

```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image
```

LLVM (no `CROSS_COMPILE` needed with `LLVM=1`; `LLVM_IAS=0` requires it):

```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image
```

The default boot image is `arch/riscv/boot/Image`.

Relevant Kconfig, from the clone:
- `RISCV_IOMMU` is `bool`, `default RISCV`, depends on `GENERIC_MSI_IRQ` and `(RISCV || COMPILE_TEST) && 64BIT`. It selects `IOMMU_API`, `GENERIC_PT`, `IOMMU_PT` and `IOMMU_PT_RISCV64`.
- `RISCV_IOMMU_PCI` is `def_bool y if RISCV_IOMMU && PCI_MSI`.
- `IOMMU_PT_RISCV64` is tristate and depends on `!GENERIC_ATOMIC64`.
- `IOMMUFD` defaults to n and must be enabled explicitly.
- `arch/riscv/configs/defconfig` has no `RISCV_IOMMU`, `IOMMUFD`, `VFIO` or KUnit lines. Its only IOMMU line is the unrelated `CONFIG_SUN50I_IOMMU=y`.

Toolchain minimums (`scripts/min-tool-version.sh`, `Documentation/process/changes.rst`):

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1.0 | Raised for all architectures by 118c40b7b503 (2025-03-28, Arnd Bergmann), following x86 commit a3e8fe814ad1 |
| binutils | 2.30 | Lowest version used with gcc-8 on common distros (same commit) |
| Clang/LLVM (optional) | 17.0.1 | ce3267a39a92 (2026-05-17, Nathan Chancellor), first in v7.2-rc1; LLVM 17 fixes an asm goto scope-checker bug that breaks with `__free()` cleanup variables. Only the first part of the commit message was read. |
| GNU make | 4.0 | changes.rst |
| Rust (optional) | 1.85.0 | Not needed for the IOMMU driver |

RISC-V toolchain conditions in `arch/riscv/Kconfig`: explicit Zicsr/Zifencei for binutils 2.36 or newer; old ISA spec handling for GCC older than 11.3.0; vector support needs LLD or ld 2.38 or newer; Zbb/Zba/Zbc/Zbkb need LLD or ld 2.39 or newer; DWARF5 is broken for LLVM as and LLD older than 18. `RISCV_ISA_ZICBOM` is `default y`, depends on MMU and selects `RISCV_DMA_NONCOHERENT`.

Selftests:
- RISC-V: `make TARGETS=riscv kselftest`.
- iommufd: `tools/testing/selftests/iommu/` with `CONFIG_IOMMUFD=y`, `CONFIG_IOMMUFD_TEST=y`, `CONFIG_FAULT_INJECTION=y`, `CONFIG_FAULT_INJECTION_DEBUG_FS=y`, `CONFIG_FAILSLAB=y`.
- KUnit: `drivers/iommu/generic_pt/.kunitconfig` enables `IOMMU_PT_RISCV64`, `IOMMU_PT_KUNIT_TEST` and `COMPILE_TEST`.

QEMU usage (from the [QEMU virt documentation](https://www.qemu.org/docs/master/system/riscv/virt.html) and [riscv-iommu spec page](https://www.qemu.org/docs/master/specs/riscv-iommu.html); not run):

```
qemu-system-riscv64 -M virt,iommu-sys=on -device riscv-iommu-pci \
    -smp 4 -m 2G -display none -serial stdio \
    -kernel arch/riscv/boot/Image \
    -initrd /path/to/rootfs.cpio \
    -append "root=/dev/ram"
```

`iommu-sys=on` enables the platform IOMMU and is off by default. With `-kernel`, `virt` uses the default OpenSBI as `-bios`.

QEMU versions:
- The PCI device appeared in QEMU 9.2 (2024-12-11) and `riscv-iommu-sys` in 10.0 (2025-04-23).
- The RISE tracker reports QEMU RISC-V IOMMU support in QEMU 8.2 ([simulator-emulator-wg #11](https://github.com/riseproject-dev/simulator-emulator-wg)), enhancements in 10.0 and ACPI in 10.1.
- The build research could not determine the earliest release [NEEDS VERIFICATION].

Known build failures: none found from build files. The Kconfig symbols were read but `make` was not run, and the `RISCV_IOMMU_PCI` interaction with `PCI_MSI` in a built config was not checked.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Feature matrix (riscv64 column from the findings; amd64 and arm64 columns not researched):

| Feature | riscv64 status | amd64 / arm64 |
|---|---|---|
| DT and PCI probe, DDT, queues | Merged, v6.13 | Data not available: not searched |
| Paging domain (DMA API domain ops) | Merged, v6.13 (4K only at first; SVNAPOT in v7.1) | Data not available |
| ACPI (RIMT) | Merged, v6.18 | Data not available |
| Generic page table, Svpbmt, NAPOT invalidation | Merged, v7.1 to v7.2 | Data not available |
| IOMMU_DMA (DMA-API translated mode) | Not merged; IMSIC platforms fault on MSIs with DMA translation on | Data not available |
| MSI remapping | Not merged (series v6) | Data not available |
| VFIO / iommufd passthrough | Not merged; QEMU docs say VFIO passthrough unsupported as of v6.17 | Data not available |
| Irqbypass (guest interrupt files) | RFC v2 (2025-09) only | Data not available |
| Nested translation | RFC (2026-04-28, 11 patches), not merged | Data not available |
| Second-stage dirty tracking | RFC v3 (2026-08-21); a v7 is reported posted 2026-11-03 [NEEDS VERIFICATION] | Data not available |
| HPM perf PMU | Not merged; v9 on 2026-09-08, v10 on 2026-09-10, reported v16 on 2026-10-06 [NEEDS VERIFICATION] | Data not available |
| ATS / PRI / SVA / PASID | Not merged; no current series found | Data not available |
| 32-bit register access (`RISCV_IOMMU_32BIT_ACCESS`) | v1 posted 2026-06-15, not merged | Data not available |

HPM series: the cover letters give different origins (first version January 2025 in one source, RFC in May 2024 in another), and the latest version number (v9, v10, v16) differs across mirrors [NEEDS VERIFICATION].

Functional gaps (cannot do X at all on mainline):
- Device assignment to a guest via VFIO or iommufd.
- IOMMU_DMA translated DMA on platforms with an IMSIC.
- Interrupt isolation: even the pending series has no MSI data validation, so VFIO needs `allow_unsafe_interrupts=1`, and direct delivery to guest interrupt files is not supported.
- ATS, PRI, SVA and PASID.
- IOMMU performance counters.

Merged precondition: 3069e8f3e1e9 reports `IOMMU_CAP_CACHE_COHERENCY` only for DMA-coherent devices, which limits userspace assignment to paths that can honour cacheable mappings. The v3 patch of the series reported the capability unconditionally. The end-to-end VFIO behaviour on riscv64 was not tested.

Performance gaps: no benchmark of the mainline driver on production riscv64 hardware was found (Section 11 summarizes the one academic study). The only mainline performance work is the invalidation series (NAPOT range invalidation, best-stride computation, detailed gather; 082ad5ed0785, bb62adcf4513, db1aad42ca8b, e4084c6bbb42) and command-queue serialization, with no published measurements. SIMD is not applicable.

Security hardening gaps: two CVEs were fixed upstream (Section 11). Stale-translation exposure existed from v6.13 for CVE-2026-53312 (the introducing commit is 488ffbf18171). The command queue shipped in v6.13 without locking around publishing; fixes arrived 2026-09-01, about 20 months later.

NaN and floating-point semantics: not applicable to an IOMMU driver.

## 7. CI/CD Infrastructure

Verdict: no riscv64 CI specific to the Linux IOMMU was found. Only generic RISC-V kernel CI exists.

In-tree findings (local clone):
- The repository root has no `.gitlab-ci.yml`, `.github/`, `.travis.yml` or `.circleci`. The kernel carries no in-tree CI definitions.
- `tools/testing/selftests/iommu/` builds `iommufd` and `iommufd_fail_nth`. They are generic, listed in `tools/testing/selftests/Makefile` as `TARGETS += iommu` with no architecture condition, and exercise the generic iommufd layer through a mock driver (`drivers/iommu/iommufd/selftest.c`). `IOMMUFD_TEST` depends on `IOMMU_PT_AMDV1`, so it is tied to the AMDv1 format and not to the RISC-V driver.
- `tools/testing/selftests/riscv/` has abi, cfi, hwprobe, mm, sigreturn and vector. It has no iommu directory.
- The generic_pt KUnit test (`IOMMU_PT_KUNIT_TEST`, `.kunitconfig` with `IOMMU_PT_RISCV64=y` and `COMPILE_TEST`) covers the RISC-V page-table format. It does not test the RISC-V IOMMU driver, and with `COMPILE_TEST` it can run on any host architecture.
- `tools/testing/kunit/qemu_configs/riscv.py` is a generic kunit.py riscv64 QEMU config (`-machine virt -cpu rv64`, OpenSBI) and does not mention the IOMMU.

Generic RISC-V CI (RISE-sponsored, `linux-riscv` GitHub organization, [github-ci workflows](https://github.com/linux-riscv/github-ci/tree/main/.github/workflows)):
- `series.yml` runs on PR branches ending in `_test` or `_manual`, calls `series/build_all.sh` and `series/test_all.sh`, and posts to SQUAD.
- `kselftest.yml` runs on branches starting with `linus` or ending in `_manual` and runs kselftest collections via `series/kernel_tester.sh rv64 <subtest> plain gcc ubuntu`.
- `testsuites.yml` (branches ending in `_manual`) builds the Ubuntu defconfig and runs LTP, libhugetlbfs and xfstests.
- `generate_kconfigs.sh` builds every `arch/riscv/configs/*defconfig` (except rv32_defconfig) plus `allmodconfig`. `generate_qemu_test_configs.sh` lists CPUs `rv64`, an `rv64` variant with h=true and Zbkb/Zbkc/Zbkx/Zkr/Zkt/svinval/svnapot/svpbmt, `sifive-u54` and `rv32`. The visible part shows no `-device riscv-iommu-*`.
- The runners are RISE Build Farm runners. Documentation is in the [RISE developer-infrastructure-wg](https://github.com/riseproject-dev/developer-infrastructure-wg) repository (`docs/build-farm/linux-kernel-ci.md`). The only listed sponsor is Bjorn Topel (Rivos). Neither page mentions IOMMU.

Compile coverage: the readiness grade states the generic CI compiles the driver because the symbol is default y on RISCV. The CI is only "plausibly compiled", because the contents of `series/test_all.sh`, `kernel_tester.sh`, `kernel_builder.sh`, `series/kconfigs/*` and `kselftest-collections.txt` were not read [NEEDS VERIFICATION].

Not checked: KernelCI, LKFT, 0-day and syzbot riscv64 results. Manual testing was done on QEMU's RISC-V IOMMU model (v9 cover letter, 2024; a 2026 dirty-tracking RFC with virtio-net and a passed-through e1000e, [lkml](https://lkml.iu.edu/hypermail/linux/kernel/2604.3/07587.html)). Neither is automated CI.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| IOMMU runtime test in CI | Data not available: not searched | Data not available: not searched | None found |
| Generic kernel build CI | Data not available | Data not available | Yes (defconfig, allmodconfig, QEMU boots, kselftest on selected branches) |
| iommufd selftest | Tied to AMDv1 mock | Data not available | Not enabled for RISC-V |
| Hardware used | Data not available | Data not available | QEMU `virt`; RISE Build Farm runners |

## 8. Distribution and Release Status

Upstream ships kernel source only. There is no standalone package.
- PyPI: `linux-iommu` returns HTTP 404. The RISE GitLab wheel index redirects to the same 404. It is not listed in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/).
- Ubuntu 26.04 (resolute): the web search on `packages.ubuntu.com` returned no package for "linux-iommu". Package-graph availability was not queried [NEEDS VERIFICATION].
- Arch Linux RISC-V: no result for "linux iommu".
- Names tried that do not exist: `linux iommu`, `linux-iommu`, `python3-linux-iommu`, `liblinux-iommu`.

Availability on riscv64 is as part of the mainline kernel from v6.13. The driver reaches users only through distro kernel images whose configuration enables `CONFIG_RISCV_IOMMU`. Distro configs for Debian, Ubuntu, Fedora, openSUSE and Arch were not checked [NEEDS VERIFICATION]. The Kconfig symbol is `default RISCV`, so a config derived from defaults would include it.

To get a working binary, a user must:
1. Run kernel v6.13 or later on a platform with an IOMMU (QEMU `virt` with `riscv-iommu-pci` or `-M virt,iommu-sys=on`).
2. Build their own kernel, or confirm that the distro kernel config enables `CONFIG_RISCV_IOMMU`.
3. For VFIO, wait for the unmerged series. Even then, `allow_unsafe_interrupts=1` is required.

Real silicon: whether any shipping SoC contains a RISC-V IOMMU was not verified [NEEDS VERIFICATION]. A downstream 6.6 line exists at OpenAnolis (bugs [21688](https://bugzilla.openanolis.cn/show_bug.cgi?id=21688) and 26081, DT only) and RVCK.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency (critical). Prerequisites: AIA/IMSIC MSI domain (`GENERIC_MSI_IRQ`), `PCI_MSI`, `GENERIC_PT`/`IOMMU_PT_RISCV64`, DT and ACPI RIMT discovery | In mainline; enabled by default on RISCV | Coverage not verified; no IOMMU runtime test found [NEEDS VERIFICATION] | Mainline and stable only; distro configs not checked | Maintained entry; multi-vendor contributors |
| OpenSBI | runtime-dependency (critical). Firmware; the IOMMU DT node reaches the kernel through the DT it passes on | Builds with GCC or Clang; one report cites Clang 18.1.3 | No CI in tree; boots on QEMU virt; issue #353 (hang with high SMP count) open | Source tarballs plus a binary archive (`opensbi-1.9-rv-bin.tar.xz`) | Report colour orange; no IOMMU-specific code found |
| GCC | build-dependency (critical); minimum 8.1 | Supported | Not applicable | No upstream binaries | Report colour blue; riscv64 is a tertiary platform for GCC 16 with no release-blocking criteria |
| LLVM | build-dependency (optional); minimum 17.0.1 | Built by default | Pre-merge gate does not include riscv64 | No upstream release binaries | Report colour yellow |
| GNU binutils | build-dependency (critical); minimum 2.30 | Supported | Two Buildbot builders on a StarFive VisionFive 2 (single source) [NEEDS VERIFICATION] | Source tarballs and snapshots only | Report colour blue |
| dtc | build-dependency (optional); compiles the `riscv,iommu` node | Not verified [NEEDS VERIFICATION] | Not verified | Not verified | No report exists |
| QEMU | test-dependency (optional); `virt` machine models the IOMMU | Builds on riscv64 hosts; riscv64 TCG backend | `check-tcg` via `build-some-softmmu`; no native riscv64 CI runner; IOMMU emulation listed as Partial with 23 open conformance bugs cited | Source tarball only; packages in Ubuntu 26.04 resolute ports, Debian sid and Arch | Report colour yellow |

Indirect and related dependencies (not in the direct list):
- EDK2 (UEFI firmware, relevant to ACPI RIMT) and ACPICA (defines and parses the RIMT table): no project report exists and riscv64 status was not verified [NEEDS VERIFICATION]. RIMT support in these projects was not checked beyond the kernel's `ACPI_RIMT` option.
- U-Boot appears in projects.yml but was not tied to the IOMMU.

Deep-dive notes:
- QEMU is the only practical way to test the driver today. The merged SVNAPOT commit (69541898b71a) exposed a bug in QEMU's emulated RISC-V IOMMU; a QEMU fix has been posted according to the IOMMU_DMA cover letter, but the patch was not identified. Open QEMU conformance bugs therefore limit how much IOMMU testing in QEMU can show.
- GCC, LLVM and binutils carry no IOMMU-specific JIT, SIMD or crypto concerns. The toolchain constraints are the RISC-V extension requirements in Section 5.
- OpenSBI: no IOMMU-specific code was found. The missing CI is the main weakness.

## 11. Known Bugs and Active Issues

IDs below are CVE or bug-tracker identifiers, since kernel bugs have no tracker issue numbers.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| CVE-2026-53057 | Missing invalidation after DDT/PDT updates (stale translations usable for DMA) | Fixed by [f5c262b54497](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f5c262b54497) (2026-01-22), v7.1-rc1; Red Hat bug [2492375](https://bugzilla.redhat.com/show_bug.cgi?id=2492375) still NEW | Low per Red Hat; high per [SentinelOne](https://www.sentinelone.com/vulnerability-database/cve-2026-53057/) | Severity discrepancy; Red Hat does not state affected versions; stable fix hashes (3f917d9bff68, d99d1c13faa7) not checked [NEEDS VERIFICATION] |
| CVE-2026-53312 | Integer overflow in invalidation path, infinite loop when gather end is `ULONG_MAX` | Fixed by 40a13b499579 (2026-03-27, v7.1-rc1); fixed in 6.18.33, 7.0.10 and 7.1 | CVSS 3.1 5.5, local DoS (CWE-190, CWE-835) | Introduced by 488ffbf18171; affects 6.13 up to the fixed releases; published 2026-06-26 ([OpenCVE](https://app.opencve.io/cve/CVE-2026-53312)); the other two fix hashes (9f0632b0d424, e4b768778415) are not in the clone, probably stable backports [NEEDS VERIFICATION] |
| n/a | IOMMU_DMA faults MSIs on IMSIC platforms | Open; fixed only by the unmerged series | High for DMA-API use | Without IOMMU_DMA, DMA-API performance cannot be measured meaningfully |
| n/a | SpacemiT NVMe fault at `riscv_iommu_fault:522` with `CONFIG_IOMMU_DMA` | Vendor-side limitation, not a mainline bug report | Unknown | From the [SpacemiT v5 series](https://lists.infradead.org/pipermail/linux-riscv/2026-February/086115.html) |
| n/a | 32-bit register access not supported | Open ([v1](https://lkml.iu.edu/2606.1/14067.html), 2026-06-15) | Unknown | Some IOMMUs cannot do 64-bit MMIO; adds `RISCV_IOMMU_32BIT_ACCESS`; not in tree |
| n/a | QEMU IOMMU model bug exposed by SVNAPOT | QEMU fix posted | Unknown | Patch not identified [NEEDS VERIFICATION] |
| OpenAnolis 21688, 26081 | RISC-V IOMMU support in 6.6 line | Downstream | n/a | DT only, QEMU-tested |

Correctness bugs fixed in tree: 553a127cb665 (signedness bug), b2e5684558ed (stop polling when CQCSR reports an error), 99d4d1a07087 (NULL deref in iova_to_phys), 7217cee35aad (skip IRQ count check with MSI), e93e4a6363b8 (disable SADE), and the command-queue fixes d5bcf9ccaa35, ca58afa40946 and 4c50bec3d542 (all `Fixes: 856c0cfe5c5f`).

Benchmark data: no benchmark of the mainline driver on production riscv64 hardware exists in the findings. The only quantitative data is one FPGA study, [Evaluating IOMMU-Based Shared Virtual Addressing for RISC-V Embedded Heterogeneous SoCs](https://arxiv.org/pdf/2502.17398):
- Platform: single-core CVA6 host with 32 KiB write-through cache running patched Linux 6.9.0 with RISC-V IOMMU 1.0 support; a 32-bit Snitch accelerator cluster at 20 MHz; the rest of the SoC at 50 MHz; 4 IOTLB entries; DRAM latency swept at 200, 600 and 1000 cycles.
- Address translation costs 4.2% to 17.6% of accelerator runtime on gemm, falling to 0.4% and 0.7% with a shared last-level cache holding host and page-table-walk traffic. Overhead is below 2% of total runtime with the LLC.
- One IOTLB miss needs three extra memory accesses, so a single DMA transfer can take up to 300% longer. Page-table-walk time is about 20% slower when CVA6 frequently accesses memory.
- heat3d at 1000 cycles of DRAM latency is quoted as 81.3% overhead in the text and 84.8% in Table II of the paper [NEEDS VERIFICATION].
- Zero-copy offload being 47% faster than copy-based for axpy at 32,768 elements is only partly verified because the PDF text is garbled.
- Caveat: this is a research SoC with a 32-bit accelerator as DMA master. It is not a Linux driver benchmark and does not transfer to server or PCIe devices.

## 12. Objections and Upstream Blockers

Stated objections:
- May 2026: the maintainer rejected identity-mapping IMSIC pages as an interim hack, said the patch comment on 1:1 mappings was inaccurate, and preferred the `iommu_dma_prepare_msi()` path (as Jason Gunthorpe suggested) or full IRQ remapping. An earlier workaround used `IOMMU_RESV_MSI` and worked with VFIO if unsafe interrupts are accepted ([thread](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091163.html)).
- 2026-08-07: Thomas Gleixner requested style and structure changes on patches 06 and 07 of v3. The author agreed to all except the 100-column limit, which he said the IOMMU maintainers decide.
- Jason Gunthorpe asked for changes to patches 01 and 02 of the dirty-tracking RFC.

Technical blockers:
- The RISC-V IOMMU specification has no MSI data validation, so VFIO needs `allow_unsafe_interrupts=1`.
- The IMSIC MSI address changes on `irq_set_affinity()`, which runs in atomic context. The series works around this by pre-mapping every IMSIC page at first IRQ allocation.
- VFIO and iommufd require `IOMMU_CAP_CACHE_COHERENCY` and have no userspace cache-maintenance path. Non-coherent device paths cannot be assigned.
- ATS must not be advertised to guests because the driver does not support it (nested RFC patch 11/11).
- The QEMU IOMMU model has open conformance bugs that limit upstream testing.

Organizational blockers:
- No single tracking issue exists for kernel work. It is tracked on mailing lists.
- No RISE funding was found. RISE tracks the work but does not write it, and the issue pages name no funding or sponsor. RISE's [kernel-and-virtualization-wg](https://github.com/riseproject-dev/kernel-and-virtualization-wg) lists #3 (driver, closed), #77 and #89 (ACPI/RIMT, closed, Linux 6.18) and #9 (KVM AIA irq-bypass, open, "Upstream in progress"). Xen RISC-V IOMMU drivers (#135 single-stage, #136 two-stage) are open and #135 was moved to "future" on 2026-09-02.
- The MSI-remapping series has been through 6 versions in about 3 months and was redesigned at v5. Its author disclosed use of LLM coding assistants for exploration, review and test runs.
- The RISE blog has no post on IOMMU work, and RISE funding is [NEEDS VERIFICATION].

Acceptance outlook (assessment from the evidence): the maintainer's stated preferred design is the one the series implements, a patch from the series (3069e8f3e1e9) is already merged, and the author is responding to reviewer comments. Acceptance of the MSI-remapping and IOMMU_DMA series therefore appears likely. No acceptance date can be derived from the findings. For nested translation, ATS/PRI/SVA/PASID and irqbypass, only RFCs or nothing exist, so acceptance timing is unknown.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

Justification: The RISC-V IOMMU driver is in mainline since v6.13 ([5c0ebbd3c6c6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5c0ebbd3c6c6)). Its Kconfig symbol is default y on RISCV, so the generic linux-riscv/RISE CI (defconfig and allmodconfig builds, QEMU boots, kselftest) compiles it, but no riscv64 CI runs any IOMMU or iommufd test. The iommufd selftests are tied to the AMDv1 page-table format, and the only IOMMU-adjacent test is the generic_pt KUnit test. Upstream ships kernel source only, and riscv64 kernel binaries come from distros whose configs were not checked, so release_provider is a provisional distro value [NEEDS VERIFICATION]. This is a CI-posture grade and says nothing about feature completeness. Source: [linux-riscv/github-ci workflows](https://github.com/linux-riscv/github-ci/tree/main/.github/workflows).

Pending work that could change the grade:
- Missing features that do not change the CI-based color: VFIO/iommufd passthrough, IOMMU_DMA (IMSIC platforms fault on MSIs), irqbypass, nested translation, ATS/PRI/SVA/PASID and the HPM perf PMU are all unmerged.
- Key mailing-list series: Andrew Jones' "Enable MSI remapping, IOMMU_DMA and VFIO" (v6 seen 2026-09-25), Fangyu Yu's second-stage dirty-tracking RFC, Zong Li's HPM series (v16 reported 2026-10-06), the irqbypass RFC, and a nested-translation RFC from 2026-04-28. All are known from mirrors only, because lore was not accessible [NEEDS VERIFICATION].
- RISE tracks the driver (kernel-and-virtualization-wg #3, closed as upstream in 6.13; KVM AIA irq-bypass #9 still open), but no RISE funding was found.
- Adding an IOMMU runtime test to riscv64 CI (for example QEMU `riscv-iommu-pci` with iommufd selftests) would move this to blue.
- Unchecked: KernelCI, LKFT and syzbot riscv64 results; contents of the github-ci test scripts and `kselftest-collections.txt`; distro kernel configs.

## 14. Investment Analysis

RISE check before sizing:
- RISE has tracked and closed the driver, the ACPI/RIMT work and the QEMU emulation (8.2, 10.0, 10.1) as upstream-complete. No RISE funding was found for any of it, and RISE does not write the patches.
- KVM AIA irq-bypass (#9) is open under RISE tracking, and the upstream authoring is by Andrew Jones. Authoring irqbypass is therefore not sized below, only review and validation.
- Xen RISC-V IOMMU (#135, #136) is outside the Linux kernel scope.

Effort figures below are this report's own estimates for engineering planning. They are not taken from any source and are scaled from the size of the cited series. Owner is the suggested party.

### 14.1 Functional Enablement
- MSI remapping, IOMMU_DMA and VFIO: the series is in review (v6, 16 patches). Value comes from test and review on target silicon rather than a rewrite. Needed for any server or virtualization use.
- Hardware bring-up of the IOMMU on our SoC: DT binding, coherency reporting (non-coherent devices cannot be assigned under the merged capability rule), 32-bit MMIO register access if the hardware requires it (unmerged v1 patch).
- Nested translation, ATS/PRI/SVA/PASID: no current series for ATS/PRI/SVA/PASID, and the nested RFC is unmerged. These are the largest gaps.
- HPM PMU and second-stage dirty tracking: series exist; review and test only.

### 14.2 Performance Optimization
- No mainline benchmark exists. The first need is a measurement harness (netperf-style or NVMe fio with and without translation) on real hardware once IOMMU_DMA lands. The one academic study shows IOTLB-miss and page-table-walk cost is dominant, so IOTLB size and walker cache design on our silicon matter more than software tuning.
- Invalidation efficiency work is already merged (NAPOT range invalidation, best stride). Measurement of it is the gap.

### 14.3 CI/CD Infrastructure
- Add a QEMU `riscv-iommu-pci` job to the linux-riscv/RISE pipeline that boots with the IOMMU and runs the iommufd and VFIO selftests once VFIO lands. This is the single change that moves the grade from yellow to blue.
- Check KernelCI, LKFT and syzbot for riscv64 IOMMU coverage (unchecked).
- Add real-hardware IOMMU runs on RISE or own board farm.

### 14.4 Ecosystem Enablement
- Verify and, where needed, fix distro kernel configs (Debian, Ubuntu, Fedora, openSUSE, Arch) so `CONFIG_RISCV_IOMMU=y` and, after merge, `IOMMUFD` and `VFIO` are enabled on riscv64.
- QEMU: drive down the open IOMMU conformance bugs (23 cited) since QEMU is the only test platform.
- No package ecosystem exists (Section 10 omitted).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Test and review MSI remapping, IOMMU_DMA and VFIO series on target hardware | 6-10 | Own team with Qualcomm upstream authors | Critical |
| Functional | IOMMU hardware bring-up (DT, coherency, register access width) | 8-12 | Own team | Critical |
| Functional | Nested translation, ATS/PRI/SVA/PASID (no ATS/PASID series found) | 20-30 | Own team with upstream | Medium |
| Functional | Review and validate irqbypass (authoring covered by upstream; RISE tracking #9) | 4-8 | Own team | High |
| Functional | Review and test HPM PMU and second-stage dirty tracking | 4-8 | Own team | Medium |
| Performance | Benchmark harness and baseline on real hardware (after IOMMU_DMA) | 4-6 | Own team | High |
| CI/CD | QEMU `riscv-iommu-pci` plus iommufd/VFIO selftest job in linux-riscv CI | 3-5 | RISE / linux-riscv | High |
| CI/CD | Audit KernelCI, LKFT and syzbot riscv64 coverage | 1-2 | Own team | Medium |
| CI/CD | Real-hardware IOMMU CI | 6-10 | Own team / RISE | Medium |
| Ecosystem | Audit and fix distro kernel configs for riscv64 | 2-3 | Own team with distros | High |
| Ecosystem | Reduce open QEMU IOMMU conformance bugs | 4-8 | Own team / RISE simulator-emulator-wg | Medium |

## 15. References

- [Linux mainline repository (data from a local clone)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [Commit 5c0ebbd3c6c6, RISC-V IOMMU platform device driver](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5c0ebbd3c6c6)
- [Commit f5c262b54497, IOTINVAL after updating DDT/PDT entries](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f5c262b54497)
- [iommufd userspace API documentation](https://docs.kernel.org/userspace-api/iommufd.html)
- [Kernel minimum tool versions (docs.kernel.org changes)](https://docs.kernel.org/process/changes.html)
- [RISC-V IOMMU specification (riscv-non-isa/riscv-iommu)](https://github.com/riscv-non-isa/riscv-iommu)
- [linux-riscv/github-ci workflows](https://github.com/linux-riscv/github-ci/tree/main/.github/workflows)
- [RISE Linux kernel pre-commit CI documentation (developer-infrastructure-wg)](https://github.com/riseproject-dev/developer-infrastructure-wg)
- [RISE kernel-and-virtualization-wg](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [RISE kernel-and-virtualization-wg issue #3, IOMMU driver with DT support](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/3)
- [RISE LK_01_007 wiki page](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8586510/LK_01_007+-+IOMMU+driver+with+DT+support)
- [RISE simulator-emulator-wg](https://github.com/riseproject-dev/simulator-emulator-wg)
- [RISE December 2024 webinar deck](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE website](https://riseproject.dev)
- [RVCK-Project/rvck issue #480](https://github.com/RVCK-Project/rvck/issues/480)
- [OpenAnolis bug 21688](https://bugzilla.openanolis.cn/show_bug.cgi?id=21688)
- [QEMU RISC-V IOMMU specification page](https://www.qemu.org/docs/master/specs/riscv-iommu.html)
- [QEMU RISC-V IOMMU documentation (readthedocs)](https://qemu.readthedocs.io/en/master/specs/riscv-iommu.html)
- [QEMU virt machine documentation](https://www.qemu.org/docs/master/system/riscv/virt.html)
- [QEMU patch updating IOMMU docs and kernel-support status](https://patchew.org/QEMU/20250814001452.504510-1-joel@jms.id.au)
- [Original v1 series (patchew)](https://patchew.org/linux/cover.1689792825.git.tjeznach@rivosinc.com/)
- [Original v1 series (lkml mirror)](https://lkml.iu.edu/hypermail/linux/kernel/2307.2/05046.html)
- [v8 posting](https://lkml.iu.edu/hypermail/linux/kernel/2406.1/08820.html)
- [v10 posting (patchew)](https://patchew.org/linux/cover.1729059707.git.tjeznach@rivosinc.com)
- [v9 posting (lkml mirror)](https://lkml.iu.edu/hypermail/linux/kernel/2410.1/05516.html)
- [v4 posting (lore)](https://lore.kernel.org/linux-riscv/cover.1714752293.git.tjeznach@rivosinc.com/T/)
- [v3 posting (LWN)](https://lwn.net/Articles/972035/)
- [MAINTAINERS patch, July 2023](https://lists.infradead.org/pipermail/linux-riscv/2023-July/036651.html)
- [MSI remapping and IOMMU_DMA series v6 (LWN)](https://lwn.net/Articles/1096863/)
- [MSI remapping series v2 cover letter (LWN)](https://lwn.net/Articles/1084967/)
- [MSI remapping series v2 patch 14/14](https://lkml.iu.edu/2607.3/01264.html)
- [MSI remapping series v2 author reply](https://lkml.iu.edu/2607.3/13300.html)
- [MSI remapping series v3 (mirror)](https://lore.jethome.com/lkml/878q6hekyy.ffs@fw13/T/)
- [MSI remapping series v5 (mirror)](https://ratatoskr.run/lkml/2026/08/17483716/t)
- [MSI remapping series v4 (mirror)](https://ratatoskr.run/lkml/2026/08/17442230/t)
- [MSI remapping series v2 (mirror)](https://ratatoskr.run/lkml/2026/07/17315748/t)
- [Map IMSIC addresses for paging domains, May 2026](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091163.html)
- [Enable IOMMU_DMA, Jones and Jeznach](https://lkml.iu.edu/2605.1/01682.html)
- [SpacemiT IOMMU DMA mapping v5](https://lists.infradead.org/pipermail/linux-riscv/2026-February/086115.html)
- [Second-stage dirty tracking RFC v3](https://ratatoskr.run/lkml/2026/08/17445126/t)
- [Dirty tracking test report (lkml)](https://lkml.iu.edu/hypermail/linux/kernel/2604.3/07587.html)
- [HPM support v9](https://ratatoskr.run/lkml/2026/09/17527951/t)
- [HPM support v7](https://ratatoskr.run/lkml/2026/08/17473518/t)
- [HPM support v4](https://ratatoskr.run/lkml/2026/07/17255863/t)
- [HPM support v3](https://ratatoskr.run/lkml/2026/06/17192064/t)
- [HPM support v2](https://ratatoskr.run/lkml/2026/02/3406540/t)
- [HPM support v10 (LWN)](https://lwn.net/Articles/1093790/)
- [HPM RFC, May 2024](https://lists.infradead.org/pipermail/linux-riscv/2024-May/053921.html)
- [Competing HPM series v5](https://ratatoskr.run/lkml/2026/02/3432554/t)
- [irqbypass RFC v2 (ratatoskr)](https://ratatoskr.run/linux-riscv/2025/09/3225069/t)
- [irqbypass RFC v2 (LWN)](https://lwn.net/Articles/1038930/)
- [irqbypass RFC v2 (kvm-riscv list)](https://lists.infradead.org/pipermail/kvm-riscv/2025-September/010148.html)
- [riscv/imsic series, February 2026](https://ratatoskr.run/lkml/2026/02/3412042/t)
- [32-bit register access patch](https://lkml.iu.edu/2606.1/14067.html)
- [Nested translation RFC patch 11/11](https://lkml.rescloud.iu.edu/hypermail/linux/kernel/2604.3/07567.html)
- [Github RISC-V CI (BoF follow-up)](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html)
- [Evaluating IOMMU-Based Shared Virtual Addressing for RISC-V Embedded Heterogeneous SoCs](https://arxiv.org/pdf/2502.17398)
- [CVE-2026-53312 (OpenCVE)](https://app.opencve.io/cve/CVE-2026-53312)
- [CVE-2026-53057 (Red Hat bug 2492375)](https://bugzilla.redhat.com/show_bug.cgi?id=2492375)
- [CVE-2026-53057 (SentinelOne)](https://www.sentinelone.com/vulnerability-database/cve-2026-53057/)