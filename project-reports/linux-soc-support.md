---
title: Linux SoC support
parent: Project Reports
color: blue
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: dtc
    relation: build-dependency
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
  - name: U-Boot
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: dt-schema
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-soc-support" %}

# Linux SoC support

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux SoC support<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

"Linux SoC support" for RISC-V is the set of SoC and board enablement code inside the mainline Linux kernel. It is not a standalone package. The code lives in these places:
- `arch/riscv/Kconfig.socs` (SoC family selection)
- `arch/riscv/boot/dts/` (per-vendor devicetrees)
- `arch/riscv/errata/` and `arch/riscv/Kconfig.vendor` (vendor errata and ISA extensions)
- `drivers/soc/` and drivers in the clk, pinctrl, reset, PCIe and net subsystems

Primary evidence is a local kernel clone at HEAD `05441d697f7f` (v7.4-rc1-132, committer date 2026-11-03). All commit facts below were read from the clone. The commit links in Section 15 are provided for reference only.

**Current scope at HEAD**
- `arch/riscv/Kconfig.socs` defines these families: ANDES, ANLOGIC, ESWIN, MICROCHIP (with `ARCH_MICROCHIP_POLARFIRE` as an alias), RENESAS, SIFIVE, SOPHGO, SPACEMIT, STARFIVE (`ARCH_STARFIVE` is an alias of `SOC_STARFIVE`), SUNXI (Allwinner D1), TENSTORRENT, THEAD, ULTRARISC, VIRT (QEMU) and CANAAN (with `SOC_CANAAN_K210`, which is `!MMU`).
- `arch/riscv/boot/dts/` has 13 vendor directories: allwinner, andes, anlogic, canaan, eswin, microchip, renesas, sifive, sophgo, spacemit, starfive, tenstorrent, thead.
- SoC family count: 15 distinct families are listed above; counting alias and sub-option symbols gives 17.
- There is no `arch/riscv/boot/dts/ultrarisc` directory at HEAD. UltraRISC has a Kconfig entry and drivers but no devicetree.

**Governance**
- There is no foundation, and no membership or tier structure. The kernel is community-governed with Linus Torvalds as top-level maintainer. The license is GPL-2.0-only (`LICENSES/preferred/GPL-2.0` in the clone).
- The [devicetree usage-model page](https://docs.kernel.org/devicetree/usage-model.html) has no governance, foundation or license content. It documents machine matching and compatible-string ordering only.
- `Documentation/process/maintainer-soc.rst` says the SoC subsystem aggregates SoC-specific code. This covers DTS for ARM and RISC-V, SoC drivers, and an intermediate path for `drivers/bus`, `firmware`, `reset` and `memory`. Per-vendor "platform" submaintainers each run their own tree and send pull requests to the main SoC tree. Architecture-specific code and CPU errata stay with the architecture maintainers.
- The SoC tree maintainers (MAINTAINERS entry "ARM AND ARM64 SoC SUB-ARCHITECTURES (COMMON PARTS)") are Arnd Bergmann, Krzysztof Kozlowski, Alexandre Belloni and Linus Walleij. Drew Fustini is a reviewer. Contact is `soc@kernel.org`.
- The RISC-V architecture maintainers are Paul Walmsley, Palmer Dabbelt and Albert Ou. Alexandre Ghiti is a reviewer. The patch policy is in [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html).

**Per-platform maintainers (from MAINTAINERS at HEAD)**

| Platform | Maintainers | Affiliation | Status |
|---|---|---|---|
| Microchip PolarFire | Conor Dooley; reviewers Valentina Fernandez, Daire McNamara | Microchip | Supported |
| StarFive DTS | Emil Renner Berthing, Conor Dooley | Individuals | Maintained |
| SiFive and Canaan DTS ("RISC-V MISC SOC SUPPORT") | Conor Dooley | Individual | Odd Fixes |
| T-Head | Drew Fustini, Guo Ren, Fu Wei | Fu Wei at Red Hat | Maintained |
| Sophgo | Chen Wang, Inochi Amaoto | Individuals | Maintained |
| SpacemiT | Yixun Lan; reviewer Troy Mitchell | Reviewer at SpacemiT | Maintained |
| Tenstorrent | Drew Fustini, Joel Stanley, Anirudh Srinivasan | Tenstorrent | Maintained |
| ESWIN DTS | Min Lin, Pinkesh Vaghela, Pritesh Patel | ESWIN, eInfochips | Maintained |
| Andes | Ben Zong-You Xie | Andes | Maintained |
| Anlogic | Conor Dooley | Individual | Odd Fixes |
| UltraRISC DP1000 (PCIe driver entry; clock, DWMAC and pinctrl driver entries also listed) | Jia Wang (the PCIe entry also lists Xincheng Zhang) | UltraRISC | Maintained |
| Renesas (RZ/Five) | Geert Uytterhoeven, Magnus Damm | Renesas ecosystem | Supported |
| Canaan K210 drivers | Damien Le Moal | Individual | Maintained |

- The `RISC-V MISC SOC SUPPORT` entry (Conor Dooley, Odd Fixes, tree `conor/linux.git`) covers `arch/riscv/boot/dts/canaan/` and `arch/riscv/boot/dts/sifive/`. SiFive and Canaan K210 also have separate driver entries (`SIFIVE DRIVERS`, `CANAAN/KENDRYTE K210 ...`).
- Allwinner D1: no dedicated RISC-V MAINTAINERS entry was found. The dts files were added by Samuel Holland.
- Vendor-run trees: Andes, Sophgo and ESWIN list GitHub trees in MAINTAINERS. SpacemiT, Tenstorrent and T-Head use kernel.org trees.

**Community culture on new ports**
- New SoCs are accepted when they come with an accountable maintainer. The 2023 SoC maintainer handbook (commit `425d827ef91e`, Conor Dooley, 2023-06-06) was motivated by recruiting maintainers for new RISC-V platforms. [NEEDS VERIFICATION: reconstructed from a mailing-list search snippet.]
- New platforms go through `soc@kernel.org` as one patchset with the Kconfig entry, DTS, a MAINTAINERS entry, and optionally initial drivers and bindings.
- Since 2024 the pattern is vendor-driven. SpacemiT, ESWIN, Andes, Tenstorrent, UltraRISC and Anlogic added platforms between 2024 and 2026, and each has a vendor-affiliated maintainer except Anlogic.
- The T-Head maintainership moved from Jisheng Zhang (initial author) to Drew Fustini in 2024. [NEEDS VERIFICATION: search snippet only.] The MAINTAINERS entry at HEAD lists Fustini, Guo Ren and Fu Wei.

**RISE position**
- The riseproject.dev homepage does not name Linux SoC support as a RISE project. It lists "Kernel & Virtualization" only as an area the TSC may focus on over time. RISE membership was not verified. [NEEDS VERIFICATION]

## 2. Port History and Upstreaming Timeline

The RISC-V port itself landed with commit `76d2a0493a17` ("RISC-V: Init and Halt Code", Palmer Dabbelt, authored 2017-07-10). The first tag containing it is v4.15-rc1.

Release tags below come from `git describe --contains` and `git tag --contains` on the clone. "Merged" is the committer date, "authored" the author date.

| Date (merged / authored) | Event | Release | Source |
|---|---|---|---|
| 2019-06-17 / 2019-05-27 | SiFive FU540-C000 dtsi (`72296bde4f42`, Paul Walmsley, SiFive). HiFive Unleashed board dts `c35f1b87fc59` | v5.2 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=72296bde4f42) |
| 2020-12-08 | SiFive FU740 dts (`57985788158a`, Yash Shah) | v5.12-rc1~19 | clone |
| 2021-01-14 / 2020-12-13 | Canaan K210 renamed from "kendryte" to vendor name (`08734e0581a5`, Damien Le Moal) | v5.12 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=08734e0581a5) |
| 2021-04-26 / 2021-03-03 | Microchip PolarFire Icicle dts (`0fa6107eca41`, Atish Patra) | v5.13 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=0fa6107eca41) |
| 2021-12-16 / 2021-10-10 | StarFive JH7100 dtsi (`ec85362fb121`, Emil Renner Berthing) | v5.17 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ec85362fb121) |
| 2022-11-10 / 2022-10-28 | Renesas RZ/Five dtsi (`b3e77da00f1b`, Lad Prabhakar) | v6.2 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b3e77da00f1b), [series](https://lkml.iu.edu/hypermail/linux/kernel/2209.1/09252.html) |
| 2023-01-27 / 2023-01-25 | Allwinner D1/D1s dtsi (`077e5f4f5528`, Samuel Holland) | v6.3 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=077e5f4f5528) |
| authored 2023-04-01 | StarFive JH7110 (`60bf0a39842e`, Emil Renner Berthing) | v6.4 (`v6.4-rc1~168`) | clone |
| 2023-06-17 / 2023-06-18 | T-Head TH1520 dtsi (`8e396880a864`, Jisheng Zhang) | v6.5 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8e396880a864), [MAINTAINERS patch](https://lists.infradead.org/pipermail/linux-riscv/2023-June/034105.html) |
| 2023-10-07 | Sophgo SG2042 dtsi (`967a94a92aaa`, Chen Wang); Milk-V Pioneer `9439a0e8b6bb`; CV1800B `c3dffa879cca` | v6.7 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=967a94a92aaa) |
| 2025-01-17 / 2024-07-30 | SpacemiT K1 dtsi (`d8fe64691955`, Yangyu Chen; committed by Yixun Lan); BPI-F3 `d60d57ab6b2a` | v6.14 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d8fe64691955) |
| 2025-04-14 | Sophgo SG2044 SRD3-10 (`ae5bac370ed4`, Inochi Amaoto) | v6.16 (`v6.16-rc1~96`) | clone |
| 2025-07-21 / 2025-07-11 | Andes QiLai dtsi (`609496af55ca`, Ben Zong-You Xie) | v6.17 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=609496af55ca) |
| 2025-09-25 / 2025-08-25 | ESWIN EIC7700 dtsi (`3329e2f3b524`, Min Lin); P550 board `fee2f45def03` | v6.18 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3329e2f3b524) |
| 2025-11-12 / 2025-10-21 | Anlogic Kconfig (`9c96219602b1`) and DR1V90 dtsi (`77874ebd4032`, Junhui Liu) | v6.19 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9c96219602b1) |
| 2025-10-18 / 2025-10-13 | Tenstorrent Blackhole PCIe cards (`8e88602e99a7`, Drew Fustini) | v6.19 | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8e88602e99a7) |
| 2026-01-15 (authored) | SpacemiT K3 first dts (`56f37e391a62`, Guodong Xu, RISCstar) | v7.0 (`v7.0-rc1~163`) | clone |
| 2026-06-06 | `ARCH_ESWIN` enabled in defconfig (`dea5db8c5775`, Anirudh Srinivasan, Tenstorrent) | v7.2 (`v7.2-rc1~98`) | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dea5db8c5775) |
| 2026-07-08 / 2026-04-27 | UltraRISC UR-DP1000 Kconfig (`a3320469e3c8`, Jia Wang; committed by Paul Walmsley) | v7.2 (`v7.2-rc3~7`) | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a3320469e3c8) |
| 2026-10-16 | Sophgo and SpacemiT DT merges into the SoC tree (`5d299ec9395e`, `62c27ed02e29`) | v7.4-rc1 | [Sophgo merge](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5d299ec9395e), [SpacemiT merge](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=62c27ed02e29) |
| 2026-10-29 | RISC-V arch pull for the 7.4 merge window (`1b8b67503725`) | v7.4-rc1 (`v7.4-rc1~39`) | [merge](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1b8b67503725) |

Release attribution notes
- K210: the K210 code is first in v5.12 (`v5.12-rc1~19^2~62`). `08734e0581a5` is a rename, not first K210 support. The original K210 commit was not located.
- UltraRISC Kconfig: first in v7.2 (the clone shows it tagged there).
- K230: `980512a5ca6f` (Yangyu Chen, authored 2024-04-08), tagged `v7.3-rc1~173`, so the K230 devicetree landed in v7.3 despite the early authored date.
- JH7110: the Debian wiki says mainline basic VisionFive 2 support began in June 2023. The clone shows `60bf0a39842e` in v6.4-rc1 (authored 2023-04-01), which does not support the "around 6.5" figure sometimes quoted.
- Search data used author dates. For SpacemiT K1 the authored date (2024-07-30) and merge date (2025-01-17) are six months apart.
- The Anlogic dtsi `77874ebd4032` is dated 2025-10-21. The Kconfig commit `9c96219602b1` also carries an author date of 2025-10-21. Both are in v6.19. The Anlogic pull was `soc-newsoc-6.19` (merge `9b418a3bfdd4`, 2025-11-21).

**Key contributors**
- SiFive: Paul Walmsley, Samuel Holland. Microchip: Conor Dooley.
- StarFive: Emil Renner Berthing. Renesas: Lad Prabhakar, Geert Uytterhoeven.
- T-Head: Jisheng Zhang, then Drew Fustini (Tenstorrent).
- Sophgo: Chen Wang, Inochi Amaoto. SpacemiT: Yangyu Chen, Yixun Lan, Guodong Xu.
- ESWIN: Min Lin, with eInfochips (Pinkesh Vaghela, Pritesh Patel).
- Andes: Ben Zong-You Xie. Tenstorrent: Drew Fustini, Joel Stanley.
- UltraRISC: Jia Wang. Anlogic: Junhui Liu.

**Is it fully upstream?**
- Yes for the SoC families listed. Gaps: UltraRISC has no dts. The K230 and K3 peripheral sets are incomplete (Section 6).

## 3. Upstream Support Tier

There is no formal tier policy for SoC support. The nearest equivalents are the MAINTAINERS `S:` status (Supported, Maintained, Odd Fixes) and an optional stricter DTS rule. `maintainer-soc-clean-dts.rst` requires that changes add no new `make dtbs_check W=1` warnings. For series split across trees, warnings on linux-next are decisive, and any that slip in must be fixed within about one release or reverted. It applies only to platforms that MAINTAINERS references the document for. Which RISC-V SoC sections do so was not checked.

Evidence on CI, release-blocking status and binaries:
- There is no CI configuration file in the clone. No `.gitlab-ci.yml`, `.github/`, `.travis`, `Jenkinsfile`, buildbot or `.kernelci` files exist.
- The RISC-V patchwork automation described in [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) builds and tests patches as they arrive. Patches with a failed check are unlikely to be applied. It is generic to all RISC-V patches, not SoC-specific.
- kernel.org ships source only. riscv64 kernel binaries come from distros (Section 8).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal SoC tier policy | Data not available: not searched | None found. Shares the SoC tree and `maintainer-soc.rst` process with RISC-V | None |
| Maintainer status labels | Data not available | Data not available | Supported (Microchip, Renesas), Maintained (most), Odd Fixes (Anlogic, SiFive and Canaan per one source) |
| `dtbs_check W=1` rule | Data not available | Same document covers ARM and RISC-V | Applies where MAINTAINERS references it (not enumerated) |
| Patch CI | Data not available | Data not available | Patchwork automation builds and tests every patch (build and test, generic to RISC-V) |
| Per-board CI (KernelCI, LKFT) | Data not available | Data not available | Not verified. dashboard.kernelci.org was blocked and docs.kernelci.org names no RISC-V boards [NEEDS VERIFICATION] |
| Upstream binaries | Source only | Source only | Source only; distro kernels |

## 4. Technical Architecture and RISC-V-Specific Subsystems

This scope is mostly data (devicetrees) and Kconfig, not hand-tuned code. The components below are those present under `arch/riscv` and `drivers/soc` at HEAD. amd64 and arm64 equivalents were not inspected. Data not available: amd64 and arm64 implementation inventories for any row.

| Component | riscv64 status | ISA extensions or notes | amd64 | arm64 |
|---|---|---|---|---|
| SoC selection | 15 families in `Kconfig.socs` | Per-SoC selects: `ERRATA_SIFIVE` (SiFive), `ERRATA_THEAD` (Allwinner D1 and T-Head), `PM_GENERIC_DOMAINS` (T-Head), `PINCTRL` (SpacemiT, StarFive) | Data not available | Data not available |
| Early SoC init | `arch/riscv/kernel/soc.c` helper | none | Data not available | Data not available |
| Vendor errata | Present for Andes, MIPS, SiFive (`errata_cip_453.S`), T-Head | Kconfig in `arch/riscv/Kconfig.errata` | Data not available | Data not available |
| Vendor ISA extensions | Andes, MIPS, SiFive, T-Head, `XTHEADVECTOR` | `arch/riscv/Kconfig.vendor` | Data not available | Data not available |
| BPF JIT | Present: `bpf_jit_comp64.c`, `bpf_jit_comp32.c`, `bpf_jit_core.c` | Scalar JIT, not SoC-specific | Data not available | Data not available |
| Crypto | Only SM4 in `arch/riscv/crypto/`: `sm4-riscv64-zvksed-zvkb.S` | Zvksed, Zvkb. Other vector crypto drivers may live under `lib/crypto` [NEEDS VERIFICATION] | Data not available | Data not available |
| Vector helpers | `riscv_v_helpers.c`, `uaccess_vector.S`, `vec-copy-unaligned.S` | RVV | Data not available | Data not available |
| Checksum | `lib/csum.c` | scalar C | Data not available | Data not available |
| Assembly | Generic port: boot, entry, FPU, suspend/hibernate, kexec, ftrace/mcount, vDSO, KVM switch, string/memory routines | Not SoC-specific | Data not available | Data not available |
| SoC drivers (`drivers/soc/`) | `canaan/k210-sysctl.c`; `microchip/` (4 files); `sophgo/` (`cv1800-rtcsys.c`, `sg2044-topsys.c`); `starfive/socinfo/jhb100-socinfo.c` (JHB100 has no dts in tree); `renesas/` (shared with ARM) | none | Data not available | Data not available |

- sifive, spacemit, thead, tenstorrent, eswin, andes and ultrarisc have no `drivers/soc/` directory. Their support lives in the devicetrees plus clk, pinctrl, reset, PCIe and net drivers.
- Drivers seen at HEAD (existence only, completeness not tested):
  - Clocks: SpacemiT K1 and K3 CCU, SG2042, SG2044, CV1800, JH7100, JH7110, TH1520, K230, ESWIN, UltraRISC.
  - Ethernet: `dwmac-eic7700`, `dwmac-spacemit`, `dwmac-ultrarisc`, SpacemiT `k1_emac`.
  - PCIe: SG2042 (Cadence), ESWIN, SpacemiT K1, UltraRISC, JH71x0.
  - TH1520: AON firmware, mailbox, `th1520-dw-hdmi.c` DRM bridge.
- Tenstorrent Blackhole uses a virtual UART in OpenSBI firmware so a PCIe host console can talk to Linux on the card. It requires `CONFIG_HVC_RISCV_SBI` and `console=hvc0` ([commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8e88602e99a7)).
- Renesas RZ/Five reuses the arm64 RZ/G2UL base (`r9a07g043.dtsi`) with `r9a07g043f.dtsi` for RISC-V-specific blocks ([series](https://lkml.iu.edu/hypermail/linux/kernel/2209.1/09252.html)).
- Allwinner D1 and T113 share dtsi layers with the Arm-based R528 and T113. A `SOC_PERIPHERAL_IRQ` macro handles the different `#interrupt-cells` between GIC and PLIC ([commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=077e5f4f5528)).

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild and Kconfig. There is no cmake, configure script or Dockerfile for the kernel build. Only two AMD display `CMakeLists.txt` files exist, and neither is part of the kernel build. Data not available: Dockerfiles or container recipes outside the tree (for example KernelCI or RISE).

**GNU cross build** (prefix is the usual Debian/Ubuntu `riscv64-linux-gnu-`):
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```
`Image.gz` can be added as a target. `vmlinuz.efi` is produced when `CONFIG_EFI_ZBOOT=y`.

**LLVM build.** The kernel LLVM documentation lists riscv as "Supported" with `LLVM=1`. Its cross-compile example shows arm64 only.
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules dtbs
```

**Config files** in `arch/riscv/configs/`: `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig`, `nommu_virt_defconfig`. `rv32_defconfig` is `defconfig` merged with `32-bit.config`.

**defconfig coverage.** The riscv `defconfig` enables ANDES, ANLOGIC, ESWIN, MICROCHIP, SIFIVE, SOPHGO, SPACEMIT, SUNXI, TENSTORRENT, THEAD and CANAAN. `ARCH_ULTRARISC` is enabled by commit `3fb29495b486` (2026-05-15), which was not re-checked in the clone. No `CONFIG_ARCH_STARFIVE=y` line was seen in the grep, though `defconfig` lines 25-38 were not read in full. [NEEDS VERIFICATION]

**Toolchain minimums** (all architectures; `scripts/min-tool-version.sh`, [changes](https://docs.kernel.org/process/changes.html)):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| binutils | 2.30 |
| Clang/LLVM | 17.0.1 |
| GNU make | 4.0 |
| Python | 3.9 |
| pahole | 1.26 (the text in `changes.rst` says 1.22) |
| Rust (optional) | 1.85.0 |
| bindgen (optional) | 0.71.1 |

- Why LLVM 17.0.1: commit `ce3267a39a92` (Nathan Chancellor, 2026-05-17) raised the minimum from 15.0.0. It gives two reasons. LLVM before 17 had an asm goto scope-checker bug that breaks `__free` cleanup variables, and there was an incompatibility with GCC 8.1+ on const variables used in `_Static_assert`.
- Why GCC 8.1 and binutils 2.30: the commit message names `118c40b7b503`. Its rationale was not read. [NEEDS VERIFICATION]
- Rust on RISC-V requires `RUSTC_SUPPORTS_RISCV && CC_IS_CLANG`.

**RISC-V-specific toolchain gates** (from `arch/riscv/Kconfig`)
- Vector support (`TOOLCHAIN_HAS_V`) needs `-march=rv64imv` support, binutils >= 2.38 or LLD, and assembler `.option arch`.
- Zbb, Zba, Zbc and Zbkb each need binutils >= 2.39 or LLD.
- Dynamic ftrace on Clang needs the GNU assembler, or LLVM assembler with LLD or binutils >= 2.36.
- Zicsr/Zifencei: `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies with binutils >= 2.36. Binutils 2.38 and GCC 12.1 moved these instructions out of base I. `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies for GCC < 11.3.0.
- `ARCH_HAS_BROKEN_DWARF5` is set when the LLVM assembler and LLD are both older than 18.
- `vmlinux` links with `--no-relax`. ABI is `-mabi=lp64`, code model `-mcmodel=medany` (`medlow` if `CONFIG_CMODEL_MEDLOW`). Shadow call stack needs `ld --no-relax-gp`. The `-march` string is built from `rv64ima` plus `fd`, `c` and `v` per Kconfig.

**QEMU.** The tree has no QEMU instructions. The command below comes from general knowledge, not a primary source. [NEEDS VERIFICATION]
```
qemu-system-riscv64 -M virt -smp 4 -m 2G -nographic \
  -kernel arch/riscv/boot/Image \
  -append "root=/dev/vda rw console=ttyS0" \
  -drive file=rootfs.img,format=raw,if=virtio
```
With `-M virt`, QEMU loads its bundled OpenSBI by default.

**Boot contract** ([riscv boot docs](https://docs.kernel.org/arch/riscv/boot.html)): `a0` holds the hartid, `a1` the DTB address and `satp = 0`. The kernel is 2 MB aligned on rv64.

**Known build failures.** The only ones found are in Section 11. The shared clone hit "Out of diskspace" during auto-gc, which is an environment issue, not a kernel one.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Data not available: a feature matrix against arm64 and amd64. Those architectures were not inventoried. Gaps below are riscv64 internal gaps.

| Feature | Status on riscv64 |
|---|---|
| Boot with SoC dts and defconfig | Yes for the 13 vendor directories. ESWIN P550 boots from `defconfig` since v7.2 |
| UltraRISC UR-DP1000 | Kconfig, clock, DWMAC and PCIe drivers in tree. No dts, so no mainline board support |
| Canaan K230 | dts in v7.3 (CanMV, EVB, pinctrl). Clock, power-domain, reset and defconfig series were in flight in Dec 2025 (list thread index only) |
| SpacemiT K3 | In mainline dts since v7.0. Peripheral set still growing in the v7.4 cycle (USB3, I2S, SPI, ACLINT fix replacing an incorrect CLINT node, IMSIC guest-id fixes, a revert of the i2s0-i2s5 nodes) |
| SpacemiT K1 | In mainline since v6.14. PCIe PHY, MMC, thermal and I2C series were in flight in Dec 2025 |
| T-Head TH1520 | In mainline since v6.5. cpufreq series (082292) in flight in Dec 2025 |
| ESWIN EIC7700 | dtsi has had only two commits (dtsi and board). Drivers (clk, DWMAC, PCIe, SATA PHY, PVT hwmon, pinctrl, sdhci fixes) have appeared elsewhere in 2026 |
| GPU, NPU, some display blocks on TH1520, K1, SG2042 | Reported as vendor-fork only. [NEEDS VERIFICATION] |
| Tenstorrent Atlantis | PRCM clock and reset driver files listed in MAINTAINERS, no dts directory entry |

- Phoronix called the v6.19 Blackhole support rudimentary ([Phoronix](https://www.phoronix.com/news/Linux-6.19-SoCs), search snippet only, page returned 403). The dts adds a 4-tile, 4x SiFive X280 description per SoC.
- Early-stage dts commits describe minimal support: SG2042 and K1 at "booting into console with only uart", RZ/Five at initramfs boot, Icicle with essential devices only.

**Performance gaps.** The benchmark data is board-level and from third parties, not kernel SoC code measurements. All Phoronix figures come from search snippets or secondary write-ups because phoronix.com returned 403. [NEEDS VERIFICATION]
- SpacemiT K3 Pico-ITX vs HiFive Unmatched (FU740): more than 8x geometric mean, LZ4 nearly 9x ([Phoronix review](https://www.phoronix.com/review/risc-v-5-year-performance), 2026-06-09). The K3 is still behind recent Intel and AMD desktop CPUs, the Raspberry Pi 5 and the Loongson 3B6000. The secondary source says the K3 ran Linux 6.18 with Bianbu 4.0.
- SiFive HiFive Premier P550 (EIC7700) is "easily 2~3x faster or more" than the Unmatched ([Phoronix review](https://www.phoronix.com/review/sifive-hifive-premier-p550), 2025-03-06, 1.4 GHz on Ubuntu 24.04).
- [HotHardware](https://hothardware.com/reviews/sifive-hifive-premier-p550-risc-v-dev-kit-review?page=2) reports the Pi 5 about 2.5x faster than the P550 on the Phoronix Test Suite Productivity suite, with a 71.4% clock advantage (2.4 GHz vs 1.4 GHz). The same findings say the P550 was never "even half as fast" as the Pi 5 in any test, which is not consistent with the 2.5x average. This cannot be reconciled without the source.
- [OpenBenchmarking result](https://mail.openbenchmarking.org/result/2605057-STEP-COREMAR72&export=txt): P550 at 1.80 GHz, vendor ESWIN kernel 6.6.103 on Fedora 42, Clang 20.1.5, CoreMark 37915.81 iterations/s. This conflicts with the 1.4 GHz in the Phoronix review, which suggests different clock settings or firmware.
- The VisionFive 2 was called "rather disappointing" by Phoronix (snippet, no numbers).
- Launchpad bug 2024935 (Section 11) reported a 2.7x CPU slowdown on a vendor Allwinner D1 kernel.
- Data not available: SIMD-related deltas. Kernel SoC enablement does not itself carry SIMD code in this scope.

**Security hardening.** `arch/riscv/configs/hardening.config` exists. Data not available: a comparison of hardening features against arm64 and amd64.

**NaN and floating-point semantics.** Data not available: this was not searched and is not applicable to SoC enablement in the findings.

## 7. CI/CD Infrastructure

**In tree:** none. The clone has no CI configuration. MAINTAINERS has no CI (`Q:`/`B:`) entries for the SoC sections, except the T-Head patchwork project `https://patchwork.kernel.org/project/riscv-thead/list/`. Whether it has automation attached is unverified. [NEEDS VERIFICATION]

**Documented CI**
1. RISC-V patchwork automation ([patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html)). It runs against patchwork.kernel.org/project/linux-riscv, builds and tests patches as they arrive, applies them to the RISC-V `for-next` or `fixes` branch (or `master` as fallback), and failed patches are unlikely to be applied. The identity of the system behind it was not determined. [NEEDS VERIFICATION]
2. `dtbs_check W=1` policy in [maintainer-soc-clean-dts.rst](https://docs.kernel.org/process/maintainer-soc-clean-dts.html). The document says "The platform maintainers have automation in place" but names no system.

**Not verified**
- Per-board coverage in KernelCI or LKFT (VisionFive 2, Milk-V, LicheePi 4A). dashboard.kernelci.org and lore and patchwork were blocked by access-denied pages.
- Whether linux-next and 0-day build the SoC defconfigs and dtbs on riscv64.

**RISE infrastructure**
- [board-farm](https://github.com/riseproject-dev/board-farm) is a Labgrid pilot at the Oregon State University Open Source Lab. It starts with 20 Alibaba Zhihe A210 boards donated by Alibaba and aims to let upstream developers test mainline kernels on real boards. Phase 1 is U-Boot TFTP/DHCP network boot plus GitHub Actions self-hosted runners. Phase 2 is a multi-tenant bare-metal cloud using OpenStack Ironic, Redfish and OpenBMC.
- `riseproject-dev/riscv-runner` provides free GitHub runners on real RISC-V hardware. The Dec 2024 [RISE webinar](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf) lists the Linux kernel among "seven active CI projects". Which kernel jobs run on RISE infrastructure is not established. [NEEDS VERIFICATION]
- The `riseproject-dev/linux` repository is a plain fork of torvalds/linux with `master` as the active branch. No RISE-specific SoC patches were found there.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None | None | None |
| Patch-level CI | Data not available | Data not available | Patchwork automation, build and test (generic to RISC-V) |
| Per-board hardware CI | Data not available | Data not available | Not verified. RISE A210 board farm in pilot |
| `dtbs_check` | Data not available | Data not available | Required to be clean where the policy applies |

## 8. Distribution and Release Status

- kernel.org source is the upstream release. [releases.json](https://www.kernel.org/releases.json) lists mainline 7.4-rc1 (2026-11-01) and stable 7.3.1 (2026-10-30). The source tarball is architecture-independent. The riscv64 port has been mainline since v4.15.
- No riscv64 kernel binary is shipped upstream. There is no PyPI package: `pypi.org/pypi/linux-soc-support/json` returned 404, and the RISE GitLab simple index redirected to a 404. Ubuntu 26.04 has no package named "Linux SoC support".
- Distro kernels are the real vehicle. Data not available: Ubuntu `linux-riscv`, Debian `linux-image-riscv64`, Fedora, openSUSE and Arch riscv64 kernel packages were not checked. [NEEDS VERIFICATION]
- Observed distro and vendor kernels:
  - Ubuntu 24.04 LTS on the HiFive Premier P550 ([Phoronix](https://www.phoronix.com/review/sifive-hifive-premier-p550)).
  - Fedora 42 with a vendor ESWIN kernel `6.6.103-200.eswin.fc42.riscv64`, not mainline ([OpenBenchmarking](https://mail.openbenchmarking.org/result/2605057-STEP-COREMAR72&export=txt)).
  - SpacemiT Bianbu 4.0 on Linux 6.18 for the K3 (secondary source).
  - Ubuntu `linux-allwinner` 5.19.17 in Launchpad bug 2024935.
- Bootloader packages: Ubuntu 26.04 has `u-boot-tools`, `u-boot-sifive`, `u-boot-starfive` and `u-boot-microchip` at 2025.10-0ubuntu2, riscv64 (from existing project reports). OpenSBI is source 1.8.1-1 in Ubuntu 26.04 main with riscv64 binary unverified; Debian sid has 1.9-1.
- RISE-provided images: developer images for the Canaan K230 and Banana Pi BPI-F3 (Dec 2024 webinar) and Android 17 on the SpacemiT K3 and Alibaba A210 ([release](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)).
- The Debian wiki is cited for VisionFive 2 support timing ([wiki](https://wiki.debian.org/RISC-V)).

**What a user must do:** pick a distro kernel package that targets the board, or build mainline with the Section 5 commands and supply a board-compatible OpenSBI and U-Boot. Several boards (K1, TH1520, SG2042) rely on vendor U-Boot forks. [NEEDS VERIFICATION] The BeagleV-Ahead needed a T-Head U-Boot fork (search snippet).

## 9. Dependencies

The project-graph query tool was not available, so no graph evidence exists for any row. Ubuntu 26.04 data is taken from existing project reports and was not re-checked.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. The subsystem itself | Mainline, native riscv64 since v4.15 | Per-SoC boot coverage in KernelCI and LKFT not verified [NEEDS VERIFICATION] | Mainline and stable source. Distro kernels not checked here | Linux kernel community; vendors per Section 1 |
| OpenSBI | runtime-dependency, critical. M-mode SBI firmware needed on nearly all SoCs (`CONFIG_RISCV_SBI`). Only K210 and other `RISCV_M_MODE` builds run without it | Native riscv64. Existing report readiness is orange (downstream-only) | No CI that builds or tests anything | v1.9 on GitHub with `opensbi-1.9-rv-bin.tar.xz`. Ubuntu 26.04 source 1.8.1-1, riscv64 binary unverified | Upstream project; some vendor SoCs ship forked OpenSBI. See project-reports/opensbi.md |
| dtc | build-dependency, critical. Compiles per-vendor `.dts` files | Host tool, builds natively. The kernel builds its own copy from `scripts/dtc/` (`CONFIG_DTC`), so no host package is needed for the kernel build | Not checked | Ubuntu package not checked | No `project-reports/dtc.md` exists. Standalone dtc is used by OpenSBI and U-Boot |
| GCC | build-dependency, critical. Primary kernel compiler, minimum 8.1 | Native riscv64. Existing report readiness blue | Not checked here | See project-reports/gcc.md | GNU project |
| GNU binutils | build-dependency, critical. Minimum 2.30. Vendor extension assembly needs recent versions | Native riscv64. Existing report readiness blue, release provider distro | Not checked here | See project-reports/gnu-binutils.md | GNU project |
| LLVM | build-dependency, optional. Alternative compiler, minimum 17.0.1. Also the Rust and bindgen path | Native riscv64. Existing report readiness yellow | Not checked here | See project-reports/llvm.md | LLVM project |
| U-Boot | runtime-dependency, optional. Bootloader and SPL on VisionFive 2, Unmatched, Icicle and similar | riscv64 defconfigs build in GitLab CI. Existing report readiness blue | `test.py` boot tests under QEMU pass | Source-only upstream. Ubuntu 26.04 `u-boot-*` packages riscv64 [ports] | Upstream project. K1, TH1520 and SG2042 boards may rely on vendor forks [NEEDS VERIFICATION]. See project-reports/u-boot.md |
| QEMU | test-dependency, optional. `ARCH_VIRT` target and `nommu_virt_defconfig` | Data not available: QEMU riscv64 host build not searched | Used for `-M virt` boot (command in Section 5, [NEEDS VERIFICATION]) | Data not available | Data not available |
| dt-schema | test-dependency, optional. Needed for `make dtbs_check` | Data not available: not searched | Data not available | Data not available | Data not available |

**Deeper notes**
- The kernel has other build tools (pahole, bindgen, Rust) that are not SoC-specific and were not assessed.
- The OpenSBI dependency matters for several SoC features. A crypto selftest crash (Section 11) depends on OpenSBI 1.7 or later and its misaligned-access emulation settings via SBI FWFT. The Tenstorrent Blackhole virtual UART is implemented in a Tenstorrent OpenSBI fork. RISE's July 2026 post on OpenSBI interrupt delegation runs on QEMU virt, not on a physical SoC ([post](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)).
- Data not available: recursion into the dependencies of GCC, binutils, LLVM, U-Boot and OpenSBI beyond their existing reports, which were not re-read here.

## 11. Known Bugs and Active Issues

There is no GitHub tracker for this subsystem. Kernel work is tracked on mailing lists, so IDs below are archive filenames or Launchpad numbers. Kernel Bugzilla and syzbot were not searched. Only the Dec 2025 and Mar 2026 linux-riscv indexes were reviewed, and the March page was truncated at 100k of about 305k characters.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [linux-riscv 2026-March/086171](https://lists.infradead.org/pipermail/linux-riscv/2026-March/086171.html) | spi: Regression with v7.0-rc1 on VisionFive 2 (JH7110) | Open, no fix visible [NEEDS VERIFICATION] | Medium | Cadence QSPI "still busy after 500ms timeout", FIFO depth 1 vs 256, `spi-nor` probe fails with -110. Clock-order change in `jh7110.dtsi` tested with no effect |
| [linux-riscv 2025-December/082281](https://lists.infradead.org/pipermail/linux-riscv/2025-December/082281.html) | [REGRESSION] Cannot boot 6.19-rc1 on riscv64 with BPF enabled | Reported 2025-12-19, tagged for regzbot. A related patch exists but is unconfirmed | High (boot panic, several boards) | Kernel stack overflow, bisected to `47c9214dcb`. Reverting fixes boot. General riscv64, not SoC-specific |
| [linux-riscv 2025-December/081891](https://lists.infradead.org/pipermail/linux-riscv/2025-December/081891.html) | lib/crypto: riscv: crypto_zvkb crashes on selftest without misaligned vector support | No merged patch visible | Medium (boot crash on affected hardware) | Needs OpenSBI >= 1.7, `CRYPTO_CHACHA20POLY1305=y`, `CRYPTO_SELFTESTS=y`. Proposed gating on `CONFIG_RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`. Relevance to T-Head and SpacemiT parts is [NEEDS VERIFICATION] |
| [linux-riscv 2026-March/086681](https://lists.infradead.org/pipermail/linux-riscv/2026-March/086681.html) | [BUG] SPARSEMEM broken on RISC-V | No merged fix visible | Medium | rv32_defconfig only, crash in `patch_map()` via `phys_to_page()`. General riscv, not riscv64 SoC-specific |
| [Launchpad 2024935](https://bugs.launchpad.net/bugs/2024935) | cpu 2.7x slower on ubuntu 23.04 riscv64 Nezha/Sipeed images vs 22.10 on MangoPi MQ-Pro | "New", unassigned, marked duplicate of #2021364 | Medium | Allwinner D1, `linux-image-5.19.0-1009-allwinner`. Emil Renner Berthing said it should be fixed in the 6.2 kernel in Lunar (2023-09-01). Root cause not stated. Distro vendor-derived tree, not mainline |
| [linux-riscv 2025-December/082003](https://lists.infradead.org/pipermail/linux-riscv/2025-December/082003.html) | SpacemiT K1: Linux crashes setting up SMP with mainline U-Boot | Closed: false alarm | None | Reporter used a stale image and confirmed mainline U-Boot and OpenSBI work |
| [LF RISE tracker](https://lf-rise.atlassian.net/wiki/x/yRyD) | "Linux Kernel / Ethernet Rx Throughput" | "Fix In Progress" per search snippet | Low (per snippet) | Page body empty on fetch, so no SoC or issue number. [NEEDS VERIFICATION] |

**Correctness bugs.** The BPF boot regression, the vector crypto selftest crash and the VisionFive 2 QSPI regression are correctness issues. The T-Head errata (the D1 FENCE.TSO mishandling that crashed apt, per [Debian deity list](https://lists.debian.org/deity/2024/05/msg00031.html), and the "Ghostwrite" vector flaw described as unpatchable in software, per [Trisquel list](https://listas.trisquel.info/pipermail/trisquel-devel/2024-August/001284.html)) are hardware errata, not kernel SoC-support bugs. [NEEDS VERIFICATION]

**Open series, not bugs** (from the Dec 2025 list): K230 clock, power-domain, reset and defconfig; TH1520 cpufreq; SpacemiT K1 PCIe PHY, MMC, thermal and I2C. Their current merge state was not checked. Data not available: any current open-series list, because lore.kernel.org and patchwork returned 403 or an access-denied page.

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. No objection to RISC-V SoC support in the mainline kernel appeared in the findings. Data not available: lore.kernel.org was blocked, so reviewer pushback in current threads was not searched.
- **Technical blockers**
  - UltraRISC DP1000 has no dts directory, so there is no mainline board support. Drivers for clock, DWMAC and PCIe are in tree.
  - GPU, NPU and some display blocks on TH1520, K1 and SG2042 remain vendor-fork only. [NEEDS VERIFICATION]
  - Android 17 on the SpacemiT K3 and Alibaba A210 currently uses platform patches kept in RISE repositories. The post urges vendors to upstream them to Linux, U-Boot and OpenSBI ([post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)). No Alibaba or A210 dts directory exists at HEAD.
  - Some boards depend on vendor U-Boot or OpenSBI forks (Section 9).
- **Organizational blockers**
  - Maintainership is needed for each new platform. Anlogic, and SiFive and Canaan per one source, sit at Odd Fixes under one individual maintainer.
  - The T-Head/Tenstorrent maintainer overlap (Drew Fustini) concentrates review capacity. This is an observation from the MAINTAINERS table, not a stated concern.
  - Mainline timing depends on vendor engineering: the K1 dts took about six months from authored to merged date, and the K230 dts took from April 2024 authored to v7.3.
- **Acceptance probability:** not quantified in the findings. The record shows 13 vendor directories merged, with six new vendors added from 2024 to 2026 (SpacemiT, Andes, ESWIN, Anlogic, Tenstorrent, UltraRISC Kconfig). Data not available: rejection rates or reject threads.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro (release provided by distro, not upstream)

**Justification.** RISC-V SoC support is mainline. `arch/riscv/Kconfig.socs` has about 15 SoC families and `arch/riscv/boot/dts` has 13 vendor directories, with first support in v5.2 (SiFive FU540) through v7.2 (UltraRISC Kconfig, ESWIN in defconfig) ([patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html)). The RISC-V patchwork automation builds and tests every patch on riscv64, and `maintainer-soc-clean-dts.rst` requires `dtbs_check W=1` to stay clean ([policy](https://docs.kernel.org/process/maintainer-soc-clean-dts.html)). That is build plus test on riscv64, so blue. It is not green because kernel.org ships only source, and the consumable riscv64 kernels come from distros. Evidence is the in-tree docs and the clone only: there is no in-tree CI config, per-board KernelCI and LKFT coverage was not verified, and there is no stored per-project report, so confidence is medium.

**Pending work that could change the grade**
- UltraRISC DP1000 has a Kconfig entry but no dts directory in tree.
- Canaan K230 dts exists, but clock, power-domain, reset and defconfig series were still in flight in Dec 2025.
- The SpacemiT K3 peripheral set is still growing.
- TH1520 cpufreq and SpacemiT K1 PCIe PHY, MMC, thermal and I2C series were in flight in Dec 2025.
- The spi regression on JH7110 VisionFive 2 in v7.0-rc1 ([thread](https://lists.infradead.org/pipermail/linux-riscv/2026-March/086171.html)) is open. [NEEDS VERIFICATION]
- GPU, NPU and some display blocks on TH1520, K1 and SG2042 remain vendor-fork only. [NEEDS VERIFICATION]
- The grade would drop to yellow if the patchwork automation turns out to be build-only. It would rise toward green only if upstream shipped riscv64 kernel binaries, which kernel.org does not do.

**RISE involvement is indirect**
- The A210 board farm ([board-farm](https://github.com/riseproject-dev/board-farm)) is aimed at testing mainline kernels on real boards.
- Android 17 on the SpacemiT K3 and Alibaba A210 uses out-of-tree platform patches kept in RISE repositories.
- Developer images exist for the K230 and BPI-F3.
- No RISE-funded mainline SoC enablement was found.

## 14. Investment Analysis

Method note: effort figures are the author's planning estimates, not sourced findings, and no sizing data exists. Treat them as order-of-magnitude placeholders to be reviewed with the relevant maintainers.

**Already covered by RISE (not sized below)**
- A210 board farm pilot (20 boards, Labgrid, GitHub Actions runners).
- Android 17 bring-up on the SpacemiT K3 and Alibaba A210 (RP024, BayLibre engineering; phase 2 will automate builds, hardware testing and releases).
- Developer images for the K230 and BPI-F3.
- Native riscv64 GitHub runners.
- Core kernel features: AIA drivers, ACPI LPI and CPPC, IOMMU with DT, SBI v2.0 items, KVM AIA and virtualized SBI. These belong to other kernel-subsystem reports, not SoC enablement.

### 14.1 Functional Enablement
- Platform patches kept in RISE repositories for K3 and A210 are out of tree. Upstreaming them is the most direct SoC-support gap tied to RISE-funded work. No A210 dts exists in mainline.
- UltraRISC DP1000 dts is missing while its drivers are in tree.
- K230 clock, power-domain, reset and defconfig series, and the K1 and TH1520 series listed in Section 13, need review and test capacity. Current merge state is unknown.
- Triage of the JH7110 QSPI regression and the vector crypto selftest crash (Section 11) would benefit SoCs with weak misaligned vector support.

### 14.2 Performance Optimization
- Data not available: no SoC-support-specific performance gap was identified beyond the benchmark comparisons in Section 6. The LF RISE "Ethernet Rx Throughput" item is unverified and has no SoC attached. A first step is to verify that item before sizing anything.

### 14.3 CI/CD Infrastructure
- Verify which boards KernelCI and LKFT actually cover, and whether the patchwork automation runs boot tests or is build-only. The grade depends on this.
- Extend the A210 board farm to run mainline boot tests across the SoC list. K3 is planned for RISE CI "in the coming weeks" per the Android post.
- Confirm that `dtbs_check W=1` runs for riscv64 trees on linux-next.

### 14.4 Ecosystem Enablement
- Section 10 is omitted because there is no dependent package ecosystem. Distro kernel packaging for riscv64 was not checked, and verifying it is a prerequisite to any distro-facing investment.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream K3 and A210 platform patches kept in RISE repos (scope to be defined after review of the repos) | 12-24 (estimate) | RISE with SpacemiT, Alibaba, BayLibre | High |
| Functional | UltraRISC DP1000 board dts | 4-8 (estimate) | UltraRISC with maintainers | Medium |
| Functional | Review and test K230, K1 and TH1520 in-flight series | 4-8 (estimate) | RISE kernel WG with vendors | Medium |
| Functional | Triage JH7110 QSPI regression and vector crypto selftest crash | 3-6 (estimate) | StarFive, linux-riscv list | Medium |
| CI/CD | Verify KernelCI, LKFT and patchwork coverage per board | 2-4 (estimate) | RISE | Critical |
| CI/CD | Mainline boot tests on the A210 board farm; add K3 | 6-10 (estimate) | RISE board farm team | High |
| Performance | Verify the Ethernet Rx throughput item and size follow-up | 1-2 (estimate) | RISE | Low |
| Ecosystem | Check distro riscv64 kernel configs against mainline SoC options | 2-4 (estimate) | RISE with distros | Medium |

## 15. References

Kernel and process documentation
- [RISC-V patch acceptance guidelines](https://docs.kernel.org/arch/riscv/patch-acceptance.html)
- [Devicetree usage model](https://docs.kernel.org/devicetree/usage-model.html)
- [Kernel RISC-V boot requirements](https://docs.kernel.org/arch/riscv/boot.html)
- [Minimal requirements to compile the kernel (changes.rst)](https://docs.kernel.org/process/changes.html)
- [SoC clean DTS policy](https://docs.kernel.org/process/maintainer-soc-clean-dts.html)
- [kernel.org releases.json](https://www.kernel.org/releases.json)
- [Linux 6.19 release notes (kernelnewbies)](https://kernelnewbies.org/Linux_6.19)
- [Linux 7.2 release notes (kernelnewbies)](https://kernelnewbies.org/Linux_7.2)
- [Kernel repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)

Commits
- [72296bde4f42 SiFive FU540-C000](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=72296bde4f42)
- [08734e0581a5 K210 vendor rename](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=08734e0581a5)
- [0fa6107eca41 Microchip Icicle](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=0fa6107eca41)
- [ec85362fb121 StarFive JH7100](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ec85362fb121)
- [b3e77da00f1b Renesas RZ/Five](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b3e77da00f1b)
- [077e5f4f5528 Allwinner D1/D1s](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=077e5f4f5528)
- [8e396880a864 T-Head TH1520](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8e396880a864)
- [967a94a92aaa Sophgo SG2042](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=967a94a92aaa)
- [d8fe64691955 SpacemiT K1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d8fe64691955)
- [609496af55ca Andes QiLai](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=609496af55ca)
- [3329e2f3b524 ESWIN EIC7700](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3329e2f3b524)
- [9c96219602b1 Anlogic Kconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9c96219602b1)
- [8e88602e99a7 Tenstorrent Blackhole](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8e88602e99a7)
- [a3320469e3c8 UltraRISC Kconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a3320469e3c8)
- [dea5db8c5775 ESWIN defconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dea5db8c5775)
- [5d299ec9395e Sophgo DT merge](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5d299ec9395e)
- [62c27ed02e29 SpacemiT DT merge](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=62c27ed02e29)
- [1b8b67503725 riscv-for-linus-7.4-mw1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1b8b67503725)

Mailing lists and bug trackers
- [RZ/Five series v3 cover letter](https://lkml.iu.edu/hypermail/linux/kernel/2209.1/09252.html)
- [T-HEAD MAINTAINERS patch](https://lists.infradead.org/pipermail/linux-riscv/2023-June/034105.html)
- [linux-riscv: spi regression on VisionFive 2](https://lists.infradead.org/pipermail/linux-riscv/2026-March/086171.html)
- [linux-riscv: BPF boot regression 6.19-rc1](https://lists.infradead.org/pipermail/linux-riscv/2025-December/082281.html)
- [linux-riscv: crypto_zvkb selftest crash](https://lists.infradead.org/pipermail/linux-riscv/2025-December/081891.html)
- [linux-riscv: SPARSEMEM broken on RISC-V](https://lists.infradead.org/pipermail/linux-riscv/2026-March/086681.html)
- [linux-riscv: SpacemiT K1 SMP report](https://lists.infradead.org/pipermail/linux-riscv/2025-December/082003.html)
- [Launchpad bug 2024935](https://bugs.launchpad.net/bugs/2024935)
- [Debian deity list: D1 FENCE.TSO](https://lists.debian.org/deity/2024/05/msg00031.html)
- [Trisquel list: T-Head vector flaw](https://listas.trisquel.info/pipermail/trisquel-devel/2024-August/001284.html)
- [LF RISE tracker page](https://lf-rise.atlassian.net/wiki/x/yRyD)

Benchmarks and news (snippet-level only for Phoronix)
- [Phoronix: RISC-V 5-year performance, Unmatched to SpacemiT K3](https://www.phoronix.com/review/risc-v-5-year-performance)
- [Phoronix: SiFive HiFive Premier P550 performance](https://www.phoronix.com/review/sifive-hifive-premier-p550)
- [HotHardware: HiFive Premier P550 review](https://hothardware.com/reviews/sifive-hifive-premier-p550-risc-v-dev-kit-review?page=2)
- [OpenBenchmarking result 2605057-STEP-COREMAR72](https://mail.openbenchmarking.org/result/2605057-STEP-COREMAR72&export=txt)
- [Phoronix: Linux 6.19 SoCs](https://www.phoronix.com/news/Linux-6.19-SoCs)
- [Phoronix: Linux 7.2 ESWIN default](https://www.phoronix.com/news/Linux-7.2-ESWIN-Default)
- [Debian RISC-V wiki](https://wiki.debian.org/RISC-V)

RISE
- [Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [Advancing OpenSBI interrupt handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE board-farm repository](https://github.com/riseproject-dev/board-farm)
- [RISE android_manifest release android-17-v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [RISE webinar December 2024 (PDF)](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)