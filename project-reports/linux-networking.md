---
title: Linux networking
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
  - name: dwarves
    relation: build-dependency
    criticality: optional
  - name: LTP
    relation: test-dependency
    criticality: optional
  - name: syzkaller
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-networking" %}

# Linux networking

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux networking<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux networking is the generic networking stack in the mainline kernel, under `net/`, `include/net` and `drivers/net`. It covers the core stack (TCP, IPv4/IPv6), netfilter/nf_tables, tc, XDP and AF_XDP, bonding, bridge, vlan and vxlan, RDMA, and NIC and PHY drivers. WireGuard and the eBPF JIT are covered by separate reports. Documentation is at [docs.kernel.org networking](https://docs.kernel.org/networking/index.html).

Networking is not a standalone package. It has no PyPI or Debian binary of its own, and its riscv64 availability comes from the mainline kernel and distro kernel packages. Searches found no `linux-networking` project on PyPI (HTTP 404) or in the RISE wheel index (302 to PyPI, then 404). Packages.ubuntu.com for 26.04 (resolute) returned no package for the keyword.

Governance:
- There is no foundation or project entity specific to networking. It is part of the Linux kernel.
- The kernel license is GPL-2.0. The networking docs index does not state it [NEEDS VERIFICATION against license-rules].
- Maintainers in the `NETWORKING [GENERAL]` MAINTAINERS entry are David S. Miller, Eric Dumazet, Jakub Kicinski and Paolo Abeni. Simon Horman is a reviewer. The list is netdev@vger.kernel.org. Patches are tracked at [patchwork netdevbpf](https://patchwork.kernel.org/project/netdevbpf/list/).
- Andrew Lunn is also a maintainer for networking drivers.
- Other entries:
  - TCP: Eric Dumazet and Neal Cardwell.
  - IPv4/IPv6: David Ahern and Ido Schimmel.
  - Netfilter: Pablo Neira Ayuso and Florian Westphal, with Phil Sutter as reviewer.
  - BPF [NETWORKING]: Daniel Borkmann.
  - STMMAC ETHERNET DRIVER: Maxime Chevallier (bootlin.com), status Maintained.
  - INFINIBAND/RDMA: Jason Gunthorpe and Leon Romanovsky, status Supported.
- Maintainer employers beyond email domains are [NEEDS VERIFICATION].
- Cadence MACB has no dedicated MAINTAINERS entry in the grep results.
- There is no riscv-specific networking maintainer. NIC glue is routed through netdev, and `arch/riscv/lib` code through the RISC-V tree (Paul Walmsley, Palmer Dabbelt, Albert Ou; Alexandre Ghiti reviewer; status Supported).
- RISE is a Linux Foundation project with Kernel & Virtualization and Linux Distro Integration working groups. It lists no networking work (see Section 13).

Community stance on new ports, from the [netdev process guide](https://docs.kernel.org/process/maintainer-netdev.html):
- Two trees: `net` for fixes and `net-next` for new code.
- Series are limited to 15 patches.
- Fixes need a `Fixes:` tag.
- New APIs need a real driver implementation, and netdevsim does not count.
- The guide has no riscv-specific or new-architecture policy. Acceptance is per patch under the same rules as any platform.
- New SoC support arrives as small stmmac `dwmac-*` glue drivers reviewed on netdev. This is how StarFive, T-HEAD and Sophgo landed.
- No riscv-specific objection or special treatment was found. The netdev list archives were not reviewed for RISC-V-specific objections [NEEDS VERIFICATION].

## 2. Port History and Upstreaming Timeline

Everything listed is merged into mainline. The data comes from the local kernel clone (HEAD 05441d697f7f, 2026-11-03, Makefile 7.4-rc1) via `git log` and `git tag --contains`. Commit URLs follow `https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=<SHA>`.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | First RISC-V arch commit `76d2a0493a17` (Palmer Dabbelt). Mainline support since Linux 4.15 per the shared brief. | Kernel clone |
| 2019-02-05 | RV64G BPF JIT `2353ecc6f91f` (Bjorn Topel). Out of scope; first tag not checked [NEEDS VERIFICATION]. | Kernel clone |
| 2019-06-18 | macb support for SiFive FU540-C000 `c218ad559020` (Yash Shah, SiFive), v5.3. | Kernel clone |
| 2019-06-25 | `c536a9aa7c14` "net: macb: Kconfig: Make MACB depend on COMMON_CLK" (Palmer Dabbelt, SiFive), v5.3. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c536a9aa7c14) |
| 2020-03-04 | RV32G BPF JIT `5f316b65e99f` (Luke Nelson). Common-code refactor `ca6cb5447cec` is in v5.7. | Kernel clone |
| 2021-09-07 | `0f31ab217dc5` (Samuel Holland) adds the Allwinner D1 compatible to the sun8i EMAC binding. First tag not checked [NEEDS VERIFICATION]. | Kernel clone |
| 2023-04-17 | StarFive JH7110 stmmac glue `4bd3bb7b4526` (Samin Guo, starfivetech.com), v6.4. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4bd3bb7b4526) |
| 2024-01-08 | RISC-V checksum header `e11e367e9fe5` and library `a04c192eabfb` (Charlie Jenkins, Rivos), v6.8. Series reached v15. | [library commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a04c192eabfb) |
| 2024-01-18 | `4525462dd0db` asm goto output guard for the checksum code, v6.8. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4525462dd0db) |
| 2024-03-08 | `5a83e7313ee1` `has_fast_unaligned_access()` (Charlie Jenkins), v6.9. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5a83e7313ee1) |
| 2024-10-24 | `9343aaba1f25` Zbb split by toolchain dependency (Conor Dooley, Microchip). Authored 2024-10-24, applied 2025-03-18, first tag v6.15. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9343aaba1f25) |
| 2024-10-26 | `6a4794d5a3e2` bpf_csum_diff homogenized for all archs (Puranjay Mohan), v6.13. Generic code. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6a4794d5a3e2) |
| 2024-11-03 | T-HEAD TH1520 stmmac glue `33a1a01e3afa` (Jisheng Zhang), v6.13. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=33a1a01e3afa) |
| 2025-03-07 | Sophgo SG2044 stmmac glue `a22221ef5dee` (Inochi Amaoto), v6.15. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a22221ef5dee) |
| 2025-06-07 | CRC code moved to `lib/crc/riscv/` by `b5943815e63b` (Eric Biggers), v6.17. When Zbc CRC first landed is [NEEDS VERIFICATION]. | Kernel clone |
| 2025-07-08 | Sophgo SG2042 support `543009e2d4cd`, v6.17. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=543009e2d4cd) |
| 2025-09-14 | SpacemiT K1 EMAC binding `62a12a221769` and driver `bfec6d7f2001` (Vivian Wang, ISCAS), v6.18. Custom MAC, not stmmac. | [binding commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=62a12a221769) |
| 2025-10-15 | Eswin EIC7700 stmmac glue `ea77dbbdbc4e` (Shangjuan Wei, Zhi Li), v6.19. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ea77dbbdbc4e) |
| 2025-11-17 | `1c7d491d8678` checksum uses `riscv_has_extension_likely` (Vivian Wang), v6.19. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1c7d491d8678) |
| 2026-03-16 | SpacemiT K3 stmmac glue `30f0ba420ed3`, v7.1. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=30f0ba420ed3) |
| 2026-09-07 | UltraRISC DP1000 GMAC `c6ff098cb63a` (Jia Wang), v7.4-rc1, with shared RGMII delay helper `cc54f9667188`. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c6ff098cb63a) |

Key contributors and organizations:
- Rivos: Charlie Jenkins (checksum). Alexandre Ghiti is also named with Rivos in the commit data.
- Microchip: Conor Dooley.
- ISCAS: Vivian Wang.
- Intel: Xiao Wang, reviewer.
- StarFive: Samin Guo, Minda Chen.
- Eswin: Shangjuan Wei, Zhi Li.
- UltraRISC: Jia Wang.
- Individual contributors: Inochi Amaoto (Sophgo, SpacemiT), Jisheng Zhang and Yao Zi (T-HEAD).
- Tenstorrent: Drew Fustini signed off the TH1520 commit; Andy Chiu authored the uaccess optimizations.

The first riscv-specific net driver commit found (FU540 macb, 2019) came about two years after the arch port started. Is it fully upstream? Yes for all items listed. Open or unmerged series were not reviewed on lore.kernel.org or patchwork.kernel.org [NEEDS VERIFICATION].

## 3. Upstream Support Tier

Formal tier policy: the netdev process guide defines driver tiers Maintained and Supported, not architecture tiers.
- Supported drivers must run all upstream tests under `drivers/net` and `drivers/net/hw` through NIPA (netdev CI) at least every 12 hours. They must test at least one device per hardware generation, or the status can be withdrawn.
- Drivers that cannot do this stay at Maintained.
- The stmmac entry is Maintained, so no riscv SoC glue meets the Supported bar.
- No riscv-specific policy exists. riscv64 is a normal mainline architecture (status Supported in MAINTAINERS for the RISC-V architecture).

Evidence:
- Networking code is generic and builds for riscv64 as part of the kernel.
- KernelCI builds riscv kernels and boot-tests them on real boards (Section 7).
- netdev NIPA runs patch checks, an allmodconfig W=1 C=1 build, a 32-bit build and a clang build. Its pages do not mention riscv or riscv64, and the status page showed no data rows. The target architecture of the 32-bit build is not stated.
- Release-blocking: no riscv64 networking test is release-blocking. Data not available: no release-blocking policy was found for riscv64 in the sources searched.
- Official binaries: upstream ships source only. Binaries come from distro kernel packages.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mainline support | Yes | Yes | Yes, since 4.15 |
| Active KernelCI kselftest-net job | Yes (`kselftest-net-ramdisk`, qemu-x86_64) | Data not available: not listed among active jobs | None |
| KernelCI LTP net jobs | Data not available | Yes (`bcm2711-rpi-4-b`) | None |
| KernelCI generic build and boot on real boards | Data not available | Data not available | Yes (VisionFive 2, Nezha, VisionFive v1, BPI-F3, HiFive Premier P550) |
| NIPA coverage | Data not available (NIPA pages do not name architectures) | Data not available | None found |
| Networking-specific arch code | Data not available | Optimized `csum_partial` assembly (per research) | `csum.c`, Zbb fold, no .S for networking |

LTP net jobs on arm run on `beaglebone-black`. Evidence is from the [kernelci-pipeline](https://github.com/kernelci/kernelci-pipeline) config. The LKFT and syzbot coverage of riscv64 was not checked [NEEDS VERIFICATION].

## 4. Technical Architecture and RISC-V-Specific Subsystems

Networking has little architecture-specific code. Facts below are from the kernel clone at v7.4-rc1-132-g05441d697f7f.

**Checksum.** `arch/riscv/include/asm/checksum.h` and `arch/riscv/lib/csum.c`.
- `ip_fast_csum()` is an inline that sums 32-bit words into an `unsigned long`. It assumes a word-aligned header because `NET_IP_ALIGN` is 2 on riscv. On RV32 it propagates carry per word.
- `csum_ipv6_magic()` is 64-bit only (`_HAVE_ARCH_IPV6_CSUM`). RV32 uses the generic version.
- `do_csum()` reads native-width words with separate carry tracking and over-reads the tail with a shift mask. It handles misaligned buffers and is `__no_sanitize_address` because of the deliberate over-read. It was influenced by `arch/arm64/lib/csum.c`.
- Zbb fast path: the 32-to-16 fold uses `rori`, `roriw`, `not`, `subw` in `.option arch,+zbb` blocks. It is gated by `CONFIG_RISCV_ISA_ZBB`, `CONFIG_TOOLCHAIN_HAS_ZBB` and `riscv_has_extension_likely(RISCV_ISA_EXT_ZBB)`. It is a runtime-patched alternative, not a separate .S file. The in-code comment says Zbb saves only 3 instructions on RV32 and 5 on RV64.
- The Zbb gating comes from `9343aaba1f25`, which moved the toolchain dependency from the Kconfig option to the call sites.
- Not found: any Zbc, Zvbc or RVV checksum path, and any riscv-specific `csum_partial_copy` or `copy_and_csum`. These fall back to generic code.
- `CC_HAS_ASM_GOTO_TIED_OUTPUT` workaround (`4525462dd0db`) may be obsolete after `1c7d491d8678` removed the `asm goto(ALTERNATIVE)` construct. The `#ifdef` was not confirmed gone from `csum.c` [NEEDS VERIFICATION].
- The tail of `csum.c` (dispatch logic using `has_fast_unaligned_access()`) was not read [NEEDS VERIFICATION].
- Quality: scalar C with Zbb inline asm. Reported speedups come from search-summary only, not primary cover letters:
  - A series v8 cover letter reports a 12% `do_csum` speedup without Zbb and 21% with Zbb, on CPUs with fast misaligned access.
  - A later cover letter reports checksum KUnit tests completing 50.9% faster on average. [NEEDS VERIFICATION]
  - Sources: [linux-riscv v8](https://lists.infradead.org/pipermail/linux-riscv/2023-November/043105.html) and [LWN](https://lwn.net/Articles/955928/).

**CRC.** `lib/crc/riscv/` has C files using the Zbc carry-less multiply extension: `crc-clmul.h`, `crc-clmul-template.h`, `crc-clmul-consts.h`, `crc16_msb.c`, `crc32.h`, `crc32_lsb.c`, `crc32_msb.c`, `crc64.h`, `crc64_lsb.c`, `crc64_msb.c`, `crc-t10dif.h`. No .S files. It is relocated by `b5943815e63b` (v6.17). `RISCV_ISA_ZBC` is default y and needs `TOOLCHAIN_HAS_ZBC` and MMU.

**Copy routines.** `arch/riscv/lib/uaccess.S` and `memcpy.S` affect `copy_to_user`/`copy_from_user` cost in socket paths. Only commit subjects were read:
- `9850e73e8297` (Xiao Wang, 2024-03-13)
- `ac295b67422d` (Andy Chiu, SiFive)
- `a4348546332c` (Alexandre Ghiti, 2025-06-02)
- `b94cec5761d2` (2026-09-01, Andy Chiu, Tenstorrent)
- `30514aa420fd` (2026-10-05, Andy Chiu, Tenstorrent)

**BPF JIT (out of scope, for completeness).** `arch/riscv/net/` holds `bpf_jit.h`, `bpf_jit_core.c`, `bpf_jit_comp64.c`, `bpf_jit_comp32.c` and `bpf_timed_may_goto.S`. It is the only .S file in the networking area and belongs to the eBPF JIT report. It uses Zbb for bswap and sign-extension moves and Zba for zext and shift-add. `HAVE_EBPF_JIT` is selected `if MMU`. Pu Lehui (Huawei) is the main author, with 31 commits since 2024-01.

**Crypto (out of scope).** `arch/riscv/crypto` and `lib/crypto/riscv` were not searched. WireGuard uses ChaCha and Poly1305 and is covered separately.

**NIC drivers.** All merged:

| SoC | Driver | Type | Release |
|---|---|---|---|
| StarFive JH7110 (VisionFive 2, Milk-V Mars) | `dwmac-starfive` | stmmac glue | v6.4 |
| T-HEAD TH1520 | `dwmac-thead` | stmmac glue | v6.13 |
| Sophgo SG2044, SG2042 | `dwmac-sophgo` | stmmac glue | v6.15, v6.17 |
| SpacemiT K1 | `k1_emac.c` | Custom MAC, not stmmac | v6.18 |
| Eswin EIC7700 | `dwmac-eic7700` | stmmac glue | v6.19 |
| SpacemiT K3 | `dwmac-spacemit` | stmmac glue | v7.1 |
| UltraRISC DP1000 | `dwmac-ultrarisc` | stmmac glue | v7.4-rc1 |
| SiFive FU540 | Cadence `macb` | Generic driver | v5.3 |

K1 uses a custom "EMAC" (`spacemit,k1-emac`), so it is treated as a non-stmmac driver here. The stmmac glue drivers adapt the Synopsys DesignWare MAC to SoC clocks, resets and RGMII delays. `MACB` depends only on `HAS_DMA && COMMON_CLK && PTP_1588_CLOCK_OPTIONAL`, with no arch restriction.

**DMA glue.** `arch/riscv/Kconfig` selects `ARCH_DMA_DEFAULT_COHERENT`. `RISCV_DMA_NONCOHERENT` selects `ARCH_HAS_DMA_PREP_COHERENT`, `ARCH_HAS_SETUP_DMA_OPS` and `ARCH_HAS_SYNC_DMA_FOR_CPU`/`FOR_DEVICE`.

Not found in `arch/riscv/`: netfilter, XDP/AF_XDP, tc, nftables, socket-specific or vxlan/bridge/vlan code. A full grep of `net/`, `include/net` and `drivers/net/ethernet/{stmicro,cadence}` for RISC-V ifdefs was not completed, so driver and core-net conditionals remain [NEEDS VERIFICATION].

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| IP checksum (`do_csum`, `ip_fast_csum`) | SIMD variants (per research) | Optimized `csum_partial` assembly (per research) | C with Zbb inline asm; no vector or Zbc path |
| `csum_partial_copy` | Data not available | Data not available | Generic fallback |
| CRC for networking | Data not available | Data not available | Zbc C implementation (`lib/crc/riscv/`) |
| BPF JIT | Out of scope | Out of scope | Exists (RV64 and RV32); Zbb and Zba used |
| NIC glue | Data not available | Data not available | stmmac glue for 6 SoC families, K1 EMAC, macb |

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild and Kconfig with GNU make. There is no CMake, configure script or Dockerfile for the kernel. There are no `-DUSE_X=OFF` flags; the equivalents are Kconfig symbols and make variables such as `LLVM=1`. Values below were read from the local clone because git.kernel.org was not accessible.

Build commands for riscv64:

    make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
    make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs

With LLVM (`riscv` is listed as Supported in `Documentation/kbuild/llvm.rst`; `CROSS_COMPILE` is not needed with `LLVM=1`):

    make ARCH=riscv LLVM=1 defconfig
    make ARCH=riscv LLVM=1 -j$(nproc) Image modules dtbs

With the GNU assembler under clang, `CROSS_COMPILE` is required:

    make ARCH=riscv LLVM=1 LLVM_IAS=0 CROSS_COMPILE=riscv64-linux-gnu-

The kernel image is `arch/riscv/boot/Image`. Config fragments in tree are `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig` and `nommu_virt_defconfig`.

Networking selftests:

    make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- headers
    make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -C tools/testing/selftests TARGETS=net

`tools/testing/selftests/net/settings` sets timeout=3600. Whether any kselftest net targets fail to build or are skipped on riscv64 was not checked [NEEDS VERIFICATION].

Generic toolchain minimums (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`):

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1.0 | Raised by `a3e8fe814ad1` (v6.15) for x86-64 stack-protector reasons; the floor is global. |
| Clang/LLVM | 17.0.1 | Raised by `ce3267a39a92` (2026-05-17, v7.2). One cited reason is that the scope checker treats all labels in a function as asm goto targets, which breaks with the cleanup attribute. The second is an incompatibility with GCC 8.1+ around `const` variables being valid constant expressions for `_Static_assert`, which affects only clang-15 and clang-16. |
| binutils | 2.30.0 | Kernel minimum |
| pahole (dwarves) | 1.26 | Needed for BTF; net selftest config sets `CONFIG_DEBUG_INFO_BTF=y` |
| iptables userspace | 1.4.2 | Minimum in `changes.rst` |
| Rust (optional) | 1.85.0 | riscv64 and LLVM/Clang only |

RISC-V feature gates are read from `arch/riscv/Kconfig`. They disable features rather than fail the build:
- `RISCV_ISA_V` needs a toolchain that accepts `-march=rv64imv`, GNU ld 2.38 or newer (or lld), and assembler `.option arch` support.
- `TOOLCHAIN_HAS_ZBB`, `ZBA`, `ZBC` and `ZBKB` each need GNU ld 2.39 or newer (or lld) plus assembler `.option arch` support. Without them the Zbb checksum fold and Zbc CRC are not built in.
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies when the GNU assembler is 2.36 or newer.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies for GCC older than 11.3.0 and passes `-Wa,-misa-spec=2.2`.
- `ARCH_HAS_BROKEN_DWARF5` is set when the LLVM assembler and lld are both older than 18.

QEMU: the only in-tree invocation found is `tools/testing/kunit/qemu_configs/riscv.py`. It runs `qemu-system-riscv64 -machine virt -cpu rv64` with `-bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`, kernel `arch/riscv/boot/Image` and `console=ttyS0`. It needs `CONFIG_ARCH_VIRT`, 8250 serial options, `CONFIG_RISCV_SBI_V01` and `CONFIG_SERIAL_EARLYCON_RISCV_SBI`. The KUnit invocation `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-` is inferred from the file name [NEEDS VERIFICATION]. A tree-wide search for other qemu-riscv references timed out.

Defconfig networking content (filtered grep, not exhaustive): `NETFILTER=y`, `NF_CONNTRACK=m`, `BRIDGE_NETFILTER=m`, `IP_NF_IPTABLES=m`, `IP6_NF_IPTABLES=m`, `BRIDGE=m`, `BRIDGE_VLAN_FILTERING=y`, `VLAN_8021Q=m`, `NET_SCHED=y`, `MACVLAN=m`, `IPVLAN=m`, `VXLAN=m`, `VIRTIO_NET=y`, `MACB=y`, `E1000E=y`, `STMMAC_ETH=m`, `DWMAC_THEAD=m`, `NET_9P=y`, `BPF_SYSCALL=y`, `PCI_HOST_GENERIC=y`. `NF_TABLES`, `BONDING`, `OPENVSWITCH`, `XDP_SOCKETS`, `MLX5`, `IXGBE`, `IGB` and `INFINIBAND` did not appear in the filtered output and are treated as not enabled [NEEDS VERIFICATION with a full read of the file].

Known build failures: the only networking-related build issues in the data are the FU540 macb Kconfig fix in 2019 (broke powerpc allyesconfig, not riscv) and the asm goto output guard in 2024 (`4525462dd0db`). Data not available: no currently open riscv64 networking build failure was found.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core stack, netfilter, tc, bridge/vlan/vxlan | Generic code | Generic code | Generic code; defconfig enables iptables, bridge, vlan, vxlan, NET_SCHED. No riscv-specific commits found. |
| nf_tables | Data not available | Data not available | Not seen in filtered defconfig; buildable as generic code [NEEDS VERIFICATION] |
| XDP and AF_XDP | Data not available | Data not available | No riscv-specific code; no test data |
| BPF JIT | Out of scope | Out of scope | Exists, `if MMU` |
| IP checksum | SIMD (per research) | Optimized assembly (per research) | Scalar plus Zbb |
| RDMA | Data not available | Data not available | No riscv-specific commits found; no data |
| Selftest CI | kselftest-net (KernelCI) | LTP net (KernelCI) | None |

Functional gaps: no functional gap was found where networking cannot work on riscv64. Checking was by commit and Kconfig search, not by running a test suite. Whether kselftest net, netfilter, XDP, tc or RDMA pass on riscv64 is unknown. Intel and Mellanox PCIe NIC behavior on RISC-V was not checked.

Performance gaps:
- The checksum code has no vector or Zbc path. This is a feature gap versus x86 SIMD and arm64 assembly. No unmerged series were checked [NEEDS VERIFICATION].
- There is no systematic riscv64 networking benchmark. Available figures are from board reviews and patch cover letters:

| Board / SoC | Driver | Result | Source |
|---|---|---|---|
| VisionFive 2 (JH7110), vendor 5.15 kernel | stmmac (NIC model not named on page) | iperf3: 937 Mbps send, 774 Mbps reverse, bidir 941 up / 262 down | [sbc-reviews issue 10](https://github.com/geerlingguy/sbc-reviews/issues/10) |
| Banana Pi BPI-F3 (K1) | `k1_emac` | TCP TX 941, UDP TX 948, TCP RX 617, UDP RX 647 Mbit/s | [cover letter](https://lkml.indiana.edu/2506.1/08064.html) |
| Milk-V Jupiter (K1) | `k1_emac` | TCP Rx 941, Tx 943, UDP Rx 956, Tx 956 Mbit/s | [netdev thread](https://lists.openwall.net/netdev/2025/07/03/148) |

K1 RX is 617 Mbit/s on the BPI-F3 but 941 Mbit/s on the Jupiter for the same series; the testers, kernel versions and setups differ, and the Jupiter kernel version is not stated. The author reports `ksoftirqd` near a full core on RX and said the vendor 6.6-based Bianbu kernel exceeds 900 Mbps, so he believes it is a software issue.

A forum thread reports a VisionFive 2 port negotiating only 100M ([forum](https://forum.rvspace.org/t/visionfive2-no-1gbps-eth-only-100m/3946)); it was not read [NEEDS VERIFICATION].

Security hardening gaps: Data not available: networking-specific hardening on riscv64 was not searched. The in-tree `hardening.config` fragment exists. Floating-point semantics are not relevant to networking, and none were investigated.

## 7. CI/CD Infrastructure

In-tree: the kernel tree has no `.gitlab-ci.yml`, `.github/`, `Jenkinsfile` or `.travis.yml`. `.kunitconfig` files under `net/` exist only for `net/handshake`, `net/mac80211/tests` and `net/rxrpc`, and are arch-independent. `tools/testing/selftests/Makefile` line 118 has `TARGETS += riscv`, which is the riscv arch selftests (hwprobe, vector), not networking. Greps of the net selftest `config`, `netfilter/config` and `Makefile` for riscv found nothing; the first grep of the net `config` timed out on the blobless clone and the retry returned nothing, so it is treated as probably clean. A wider `git grep` was abandoned after a disk-space error. `MAINTAINERS` has no netdev CI or NIPA entry.

[KernelCI pipeline](https://github.com/kernelci/kernelci-pipeline) (`config/scheduler.yaml`, `config/jobs.yaml`):
- riscv build jobs exist: `kbuild-gcc-14-riscv`, `-mainline`, `-smp`, `-nommu_k210_defconfig`, and `kbuild-clang-21-riscv-*`. `kbuild-gcc-14-riscv-mainline` includes a kselftest fragment.
- riscv boot-only baselines run on real boards:
  - `baseline-riscv-broonie` on `jh7110-starfive-visionfive-2-v1-3b`
  - `baseline-riscv-clabbe` on `sun20i-d1-nezha` and `jh7100-starfive-visionfive-v1`
  - `baseline-riscv-collabora` on `spacemit-k1-bananapi-f3` and `eic7700-hifive-premier-p550`
- The only active `kselftest-net` job is `kselftest-net-ramdisk` on `qemu-x86_64`. Other kselftest-net entries are commented out.
- There is no `kselftest-netfilter` scheduler entry.
- LTP networking jobs (`ltp-net-*`, `ltp-network-*`) run only on arm `beaglebone-black` and arm64 `bcm2711-rpi-4-b`.

netdev NIPA ([repo](https://github.com/linux-netdev/nipa), [status](https://netdev.bots.linux.dev/status.html)): patch checks, allmodconfig W=1 C=1 build, 32-bit build, clang build and some hardware tests. Pages do not mention riscv, and the status page showed no data rows.

RISE: the riscv-runner*, board-farm and test-infra repositories exist in the riseproject-dev org, but their purpose was not inspected. There is no evidence of RISE runner usage for kernel networking [NEEDS VERIFICATION]. A RISE post says its lab has close to 400 devices of almost 70 types, available for upstream testing such as KernelCI ([RISE post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)); the URL is inferred from the title and date given and was not itself fetched [NEEDS VERIFICATION].

Not checked: LKFT and the syzbot dashboard for riscv64 [NEEDS VERIFICATION]. The KernelCI dashboard was blocked by Anubis, so live riscv results were not viewed.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel build in KernelCI | Data not available | Data not available | Yes (gcc-14, clang-21) |
| Boot on real hardware | Data not available | Data not available | Yes (5 board types) |
| kselftest-net | Yes (qemu-x86_64) | Not active | No |
| kselftest-netfilter | No scheduler entry | No scheduler entry | No scheduler entry |
| LTP net | Data not available | Yes | No |

## 8. Distribution and Release Status

Upstream ships only source. Official riscv64 binaries of the networking stack exist only as part of distro kernel packages and their config choices. Distro-specific riscv64 kernel configuration for networking has not been verified [NEEDS VERIFICATION].
- Ubuntu 26.04 (resolute): the package search for "Linux networking" returned nothing. The networking code ships inside `linux-image-*` packages and in userspace tools (nftables, iproute2, openvswitch). riscv64 availability of these was not verified. [NEEDS VERIFICATION]
- Debian: a kernel-team [merge request](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821) updates the riscv64 config for 6.19. Its networking relevance was not checked [NEEDS VERIFICATION].
- Fedora, Arch and others: Data not available: not searched.
- PyPI, npm, Maven, OCI: not applicable. There is no `linux-networking` package on PyPI or the RISE index.
- Latest tags in the clone are v7.3 and v7.4-rc1. v7.3 was not checked against the kernel.org release page.

What a user must do: install a distro riscv64 kernel (config for networking options not verified per distro), or build from source as in Section 5. NIC support depends on the SoC: the drivers in Section 4 are in mainline, but for the VisionFive 2 the review above used a vendor 5.15 kernel.

## 9. Dependencies

The project graph tool was not exposed in this session and Docker was not running, so Ubuntu 26.04 riscv64 availability could not be confirmed for any row. Cells marked "Not verified" mean no source was read.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime-dependency, critical) | Provides the networking stack and `arch/riscv` glue (checksum, Zbb, CRC) | Mainline since 4.15; `HAVE_EBPF_JIT if MMU`, `GENERIC_CSUM`, `HAVE_EFFICIENT_UNALIGNED_ACCESS` in `arch/riscv/Kconfig` | Generic build and boot in KernelCI; no riscv64 networking tests | Distro kernel packages, not verified | RISC-V maintainers: Paul Walmsley, Palmer Dabbelt, Albert Ou. No riscv-specific networking maintainer. |
| OpenSBI (runtime-dependency, critical) | Supervisor binary interface firmware; QEMU KUnit uses `opensbi-riscv64-generic-fw_dynamic.bin` | Not verified | Used by the QEMU KUnit config | Not verified | RISE has an opensbi fork and a 2026-07-16 post on interrupt handling; no networking link |
| GCC (build-dependency, critical) | Kernel compiler; minimum 8.1.0; KernelCI uses gcc-14 for riscv | Used by KernelCI riscv builds | Not verified | Not verified | See the GCC report in project-reports |
| LLVM (build-dependency, optional) | Alternative kernel toolchain (`LLVM=1`, minimum 17.0.1); also compiles BPF/XDP programs | KernelCI has clang-21 riscv builds | Not verified | Not verified | See the LLVM report |
| GNU binutils (build-dependency, critical) | Assembler and linker; minimum 2.30.0; Zbb/Zbc need ld 2.39 or newer, V needs 2.38 or newer | Not verified | Not verified | Not verified | Not assessed |
| dwarves (build-dependency, optional) | Provides pahole 1.26 or newer, needed for BTF (`CONFIG_DEBUG_INFO_BTF=y` in the net selftest config) | Not verified | Not verified | Not verified | Not assessed |
| LTP (test-dependency, optional) | Linux Test Project; KernelCI `ltp-net-*` and `ltp-network-*` jobs | Not verified | Net jobs run on arm and arm64 only; none on riscv64 | Not verified | Not assessed |
| syzkaller (test-dependency, optional) | Kernel fuzzer; syzbot has produced riscv QEMU network reports (Section 11) | Not verified | Dashboard not checked [NEEDS VERIFICATION] | Not verified | Not assessed |
| libbpf | BPF loader for XDP/tc; `tools/lib/bpf` is in the kernel tree | Not verified | Not verified | Not verified | Report in project-reports |
| Open vSwitch | Userspace switch needing the kernel datapath | Not verified | Not verified | Not verified | Report in project-reports |
| nftables | Userspace for nf_tables; `projects.yml` lists a Go library entry (google/nftables) with its own report and a separate libnftables entry | Not verified | Not verified | Not verified | The existing report covers the Go library, not netfilter nftables |
| libnftnl | Netlink library used by nftables and iptables | Not verified | Not verified | Not verified | No report |
| libmnl | Minimal netlink library | Not verified | Not verified | Not verified | No report |
| iproute2 | `ip`/`tc` tools; kernel selftests depend on them | Not verified | Not verified | Not verified | No report |
| iptables | Compat layer over nf_tables; minimum 1.4.2 | Not verified | Not verified | Not verified | No report |
| libxdp | xdp-tools for XDP/AF_XDP userspace | Not verified | Not verified | Not verified | No report |
| bpftool | BPF inspection and skeleton generation | Not verified | Not verified | Not verified | No report |
| DPDK | Userspace packet processing | Not verified | Not verified | Not verified | No report |
| rdma-core | Userspace for RDMA/RoCE | Not verified | Not verified | Not verified | No report |

Deep-dive on dependencies with SIMD or numerics: the only networking-relevant ISA-dependent code lives in the kernel itself (Zbb checksum fold, Zbc CRC), and the toolchain gates in Section 5 decide whether it is compiled. If binutils is older than 2.39 and not using lld, the Zbb and Zbc paths are not built and the generic C paths are used. This is derived from the Kconfig gates, not from a build test [NEEDS VERIFICATION]. No deeper recursion into userspace dependencies was possible from the research.

## 11. Known Bugs and Active Issues

No open Bugzilla or GitHub issue numbers for Linux networking on riscv64 were found. The items below are the identifiers that were found.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Launchpad 1993645](https://bugs.launchpad.net/ubuntu/+source/linux-allwinner/+bug/1993645) | Kernel crash when inserting USB Ethernet NIC | Expired 2026-04-08 after Confirmed in 2022; unassigned | High (kernel oops) | linux-allwinner 5.17.0-1003, Ubuntu 22.10 riscv64, Lichee RV Dock (T-Head C906) with Realtek RTL8153. Paging fault in `__kmalloc` from `r8153_hw_phy_cfg`. Root cause never found. |
| syzbot+f694b8c2ba2919587a3d | riscv QEMU kernel stack overflow | Open; no known resolution [NEEDS VERIFICATION] | High | Reported 24 Dec 2024 on 6.13.0-rc2-syzkaller (riscv `fixes` tree), no reproducer. Preceded by a "Dead loop on virtual device ipvlan1" warning. Alexandre Ghiti confirmed the overflow and asked netdev whether the 32KB stack should grow; no reply is visible. [Thread](https://lists.openwall.net/netdev/2025/01/07/224) |
| syzbot reports 2021-2022 | `sock_ioctl` fault (Mar 2021), net-sysfs queue kobject NULL dereference (Sep 2021), netdevsim trap work fault (Sep 2021), rtnetlink "corrupted stack end" (Mar 2022), NFC use-after-free (Nov 2022) | Fix status not verified | Unknown | Search-summary only. [Mar 2021](https://lists.openwall.net/netdev/2021/03/10/268), [Sep 2021](https://lists.openwall.net/netdev/2021/09/14/94), [netdevsim](https://lists.openwall.net/netdev/2021/09/11/52), [Mar 2022](https://lists.openwall.net/netdev/2022/03/14/36), [NFC](https://lists.openwall.net/netdev/2022/11/25/59) |
| Module load failures (2020) | openvswitch and other modules failed to load due to static per-CPU variables and distance of module text from the kernel | Final status [NEEDS VERIFICATION] | Medium | linux-riscv thread; fix direction was dynamic per-CPU. [Thread](https://lore.kernel.org/linux-riscv/CABvJ_xg_+XHhND-_8mq8gUN_yN-abMjDOWGg+MFVP0gwSAhxtw@mail.gmail.com/) |
| br_netfilter relocation (2020) | 32-bit offset relocation error loading br_netfilter | Fix status unknown [NEEDS VERIFICATION] | Medium | The thread was not reviewed; a summary says Paul Walmsley called it a known issue. |
| K1 EMAC RX throughput | RX 617 Mbit/s on BPI-F3 versus over 900 on the vendor kernel | Known issue stated by the author in 2025 | Low to medium (performance) | `ksoftirqd` near one full core. Not re-checked on a later kernel. |
| VisionFive 2 100M negotiation | Forum thread reports a port at 100M only | Not read [NEEDS VERIFICATION] | Low | [Forum](https://forum.rvspace.org/t/visionfive2-no-1gbps-eth-only-100m/3946) |
| EIC7700 board DTS | DTC build failure reported on v5 of the HiFive Premier P550 Ethernet DTS series (non-existent `clk` node) | Merge status unknown [NEEDS VERIFICATION] | Low | The driver `dwmac-eic7700` itself is merged in v6.19. |
| Launchpad 1994490 | Segfaults after Wi-Fi module install | Closed Invalid for the meta package | Not confirmed as networking | Segfaults stopped after reboot per the reporter. [Link](https://bugs.launchpad.net/bugs/1994490) |
| Launchpad 2024935 | Ubuntu 23.04 about 2.7x slower than 22.10 on MangoPi MQ-Pro | Unresolved in the data | CPU regression, not networking | `mitigations=off` made no difference. [Link](https://bugs.launchpad.net/bugs/2024935) |

Recurring driver-level fixes (all merged):
- Per-vendor RGMII delay and clock bugs recur in Eswin (`c2e152f7ce32`, `6ffcef9bc1fc`, `6872fb088edc`, `23386defe949`, v7.1; eth1 clock inversion `0cb57bdebd10` and `186f38935e28`, v7.3).
- SpacemiT K3 needed irq and phy-interface fixes within one release (`bf5cd5d4ca42`, `d1e3a4c3b24d`, v7.2).
- TH1520 got APB and TX clock fixes (`6d6714bf0c4e`, `4cc339ce482b`, `c8a9a619c072`, v6.17).
- The K1 EMAC driver still received robustness fixes in 2026 (`70eba59f9207`, `3aa1417803c1`, `86292155bea5`, `435d4b4aa9c8`, `2d14720beb58`).
- The shared helper `cc54f9667188` in v7.4-rc1 centralizes RGMII delay handling.

Correctness bugs: no riscv64 checksum or networking correctness bug was found in the data. The 2019 FU540 macb patch was build-tested only and the author noted he had not booted the kernels. The checksum library has had only guard, refactor and typo changes since v6.8, the latest being `7d7c2d1c4879` (2026-04-04).

## 12. Objections and Upstream Blockers

Stated objections:
- Allwinner D1 GMAC (2021): a stopgap Ethernet driver by Guo Ren was objected to on licensing and DT-binding grounds and was not merged in that form ([thread](https://lore.kernel.org/all/CAJF2gTT-nBuOybOq3qsBhP7nJOexG36D=GMJaut1qqcm3p1Uuw@mail.gmail.com/)). Only the search-summary was read. A later D1 compatible was added to the sun8i EMAC binding (`0f31ab217dc5`), but whether it resulted from this dispute was not confirmed [NEEDS VERIFICATION].
- No other riscv-specific objection was found. The netdev list archives were not searched.

Technical blockers: none found for merging. Open items that could matter:
- The unresolved syzbot riscv stack overflow (netdev did not visibly respond).
- No riscv64 networking test coverage, which affects confidence rather than merge acceptance.
- Missing vector or Zbc checksum acceleration.

Organizational blockers:
- No stmmac SoC glue meets the netdev Supported tier because it requires NIPA hardware tests every 12 hours per hardware generation.
- No riscv-specific networking maintainer exists, and RISE has no networking work.

Acceptance probability: driver glue has been accepted routinely. Eight SoC-related drivers and bindings were merged between 2023 and 2026, and DP1000 was accepted in v7.4-rc1. Acceptance of new riscv-specific networking code appears high, based on this merge record. Pending series were not reviewed [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro
- Justification: Networking is generic code in `net/` in mainline Linux, which has supported riscv64 since 4.15. KernelCI builds riscv kernels and boot-tests them on real boards such as the VisionFive 2, but the only active kselftest-net job is x86_64 and the LTP net jobs are arm/arm64, so no networking test suite runs on riscv64 ([kernelci-pipeline](https://github.com/kernelci/kernelci-pipeline)). Upstream ships only source; riscv64 binaries come from distro kernel packages, which were not verified per distro [NEEDS VERIFICATION]. The riscv-specific parts (checksum library since v6.8, stmmac/dwmac glue drivers for JH7110, TH1520, Sophgo, K3, EIC7700 and DP1000) are merged: [checksum library commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a04c192eabfb). No stmmac glue meets the netdev "Supported" driver tier, and there is no RISE or netdev NIPA riscv64 coverage.
- Pending work that could change the grade:
  - No open work was found that would change the grade.
  - Mailing lists (lore, patchwork), LKFT and the KernelCI dashboard could not be reached, so any pending kselftest-net or riscv64 networking CI series is [NEEDS VERIFICATION].
  - Adding a riscv64 kselftest-net or netfilter job to KernelCI, or a riscv64 build in NIPA, would move this to blue.
  - RISE has no work on kernel networking. Its only related repo is a [cilium fork](https://github.com/riseproject-dev/cilium) with no visible riscv64 changes. Its [linux fork](https://github.com/riseproject-dev/linux) has a single `master` branch with no networking branches visible.
  - The syzbot riscv stack-overflow report from 2024-12 (syzbot+f694b8c2ba2919587a3d) has no known resolution.
  - The Debian riscv64 6.19 config merge request was not checked for networking relevance.

## 14. Investment Analysis

RISE check, done first: no RISE blog post or funded work covers kernel networking. The [RISE feed](https://riseproject.dev/feed/) lists 10 posts (2026-07-07 to 2026-10-30), none about networking. The WordPress sitemap lists 38 posts (2024-05-15 to 2026-10-30), with no networking title. The riseproject-dev org has 70 repositories; the only networking-related one is the cilium fork, and `kubernetes-riscv` is a cluster-networking consumer that was not inspected. The wheel builder lists no kernel networking packages. Nothing below duplicates RISE work. The effort figures below are the author's planning estimates, not sourced from the research, and the section ordering follows the template.

### 14.1 Functional Enablement

The goal is to turn "builds and boots" into "tested". Nothing is known to be broken, so the first step is measurement.
- Run kselftest net and netfilter on riscv64 (QEMU virt, then hardware) and triage failures.
- Check the `tools/testing/selftests/net/config` requirements against `arch/riscv/configs/defconfig`, which does not appear to enable NF_TABLES, BONDING, OPENVSWITCH or XDP_SOCKETS [NEEDS VERIFICATION].
- Follow up the syzbot stack-overflow report (syzbot+f694b8c2ba2919587a3d) with a reproducer attempt and stack-depth analysis.
- Verify Intel and Mellanox PCIe NIC operation on RISC-V hardware. This has not been checked.

### 14.2 Performance Optimization

- Establish a riscv64 networking baseline (iperf3, packet rate, checksum microbenchmarks). No systematic data exists.
- Investigate the K1 EMAC RX shortfall (617 Mbit/s on BPI-F3 versus over 900 on the vendor kernel).
- Evaluate a Zbc or RVV checksum path against the existing Zbb scalar code. The feature gap versus x86 and arm64 is known, but no benefit is measured. No unmerged series were checked.

### 14.3 CI/CD Infrastructure

- Add a riscv64 kselftest-net job to KernelCI. The riscv build and board baselines already exist, and this is the step the justification identifies as moving the grade to blue.
- Add a kselftest-netfilter scheduler entry (none exists for any architecture) and LTP net jobs on riscv64 boards.
- Request a riscv64 build in NIPA.
- Evaluate RISE runners or the board farm for this. Their purpose was not inspected, so feasibility is [NEEDS VERIFICATION].

### 14.4 Ecosystem Enablement

Section 10 is omitted because networking has no dependent package ecosystem of its own. The relevant work is verifying the userspace tools in Section 9 (iproute2, nftables/libnftables, libnftnl, libmnl, iptables, libbpf, bpftool, libxdp, Open vSwitch, DPDK, rdma-core) on riscv64, since none was verified.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Run and triage kselftest net and netfilter on riscv64 (QEMU, then hardware) | 4 | Chip company kernel team | High |
| Functional | Reproduce and root-cause syzbot riscv stack overflow, engage netdev and riscv maintainers | 4 | Chip company kernel team with riscv and netdev maintainers | Medium |
| Functional | Validate Intel and Mellanox PCIe NICs and defconfig networking options on riscv64 hardware | 3 | Chip company kernel team | Medium |
| Performance | Baseline networking benchmarks on riscv64 hardware | 3 | Chip company performance team | Medium |
| Performance | Investigate K1 EMAC RX throughput gap | 3 | Chip company kernel team with SpacemiT contributors | Low |
| Performance | Prototype and measure Zbc or RVV checksum path | 5 | Chip company kernel team | Low |
| CI/CD | Add riscv64 kselftest-net job (and netfilter entry) to KernelCI | 3 | Chip company with KernelCI maintainers | Critical |
| CI/CD | Add riscv64 build to NIPA | 2 | Chip company with netdev CI maintainers | High |
| CI/CD | Add LTP net jobs on riscv64 boards | 2 | Chip company with KernelCI maintainers | Medium |
| Ecosystem | Verify userspace networking tools on riscv64 distros | 3 | Chip company distro team | Medium |

## 15. References

- [Linux networking documentation](https://docs.kernel.org/networking/index.html)
- [Linux kernel repository (torvalds/linux.git)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [netdev maintainer process guide](https://docs.kernel.org/process/maintainer-netdev.html)
- [netdev patchwork](https://patchwork.kernel.org/project/netdevbpf/list/)
- [Checksum header commit e11e367e9fe5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e11e367e9fe5)
- [Checksum library commit a04c192eabfb](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a04c192eabfb)
- [asm goto guard commit 4525462dd0db](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4525462dd0db)
- [has_fast_unaligned_access commit 5a83e7313ee1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5a83e7313ee1)
- [Zbb split commit 9343aaba1f25](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9343aaba1f25)
- [riscv_has_extension_likely commit 1c7d491d8678](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1c7d491d8678)
- [bpf_csum_diff commit 6a4794d5a3e2](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6a4794d5a3e2)
- [StarFive JH7110 glue commit 4bd3bb7b4526](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4bd3bb7b4526)
- [T-HEAD TH1520 glue commit 33a1a01e3afa](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=33a1a01e3afa)
- [Sophgo SG2044 glue commit a22221ef5dee](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a22221ef5dee)
- [Sophgo SG2042 commit 543009e2d4cd](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=543009e2d4cd)
- [SpacemiT K1 binding commit 62a12a221769](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=62a12a221769)
- [Eswin EIC7700 glue commit ea77dbbdbc4e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ea77dbbdbc4e)
- [SpacemiT K3 glue commit 30f0ba420ed3](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=30f0ba420ed3)
- [UltraRISC DP1000 commit c6ff098cb63a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c6ff098cb63a)
- [macb Kconfig commit c536a9aa7c14](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c536a9aa7c14)
- [KernelCI pipeline](https://github.com/kernelci/kernelci-pipeline)
- [netdev NIPA](https://github.com/linux-netdev/nipa)
- [netdev CI status](https://netdev.bots.linux.dev/status.html)
- [RISE feed](https://riseproject.dev/feed/)
- [RISE blog](https://riseproject.dev/blog)
- [RISE hardware-in-the-loop post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE cilium fork](https://github.com/riseproject-dev/cilium)
- [RISE linux fork](https://github.com/riseproject-dev/linux)
- [Allwinner D1 GMAC thread](https://lore.kernel.org/all/CAJF2gTT-nBuOybOq3qsBhP7nJOexG36D=GMJaut1qqcm3p1Uuw@mail.gmail.com/)
- [Module loading failures thread](https://lore.kernel.org/linux-riscv/CABvJ_xg_+XHhND-_8mq8gUN_yN-abMjDOWGg+MFVP0gwSAhxtw@mail.gmail.com/)
- [Debian riscv64 6.19 config merge request](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821)
- [VisionFive 2 review (sbc-reviews issue 10)](https://github.com/geerlingguy/sbc-reviews/issues/10)
- [SpacemiT K1 Ethernet MAC cover letter](https://lkml.indiana.edu/2506.1/08064.html)
- [Milk-V Jupiter K1 test report](https://lists.openwall.net/netdev/2025/07/03/148)
- [VisionFive 2 100M forum thread](https://forum.rvspace.org/t/visionfive2-no-1gbps-eth-only-100m/3946)
- [Checksum series v8 (linux-riscv)](https://lists.infradead.org/pipermail/linux-riscv/2023-November/043105.html)
- [Checksum series (LWN)](https://lwn.net/Articles/955928/)
- [syzbot riscv stack overflow thread](https://lists.openwall.net/netdev/2025/01/07/224)
- [syzbot sock_ioctl, Mar 2021](https://lists.openwall.net/netdev/2021/03/10/268)
- [syzbot net-sysfs, Sep 2021](https://lists.openwall.net/netdev/2021/09/14/94)
- [syzbot netdevsim, Sep 2021](https://lists.openwall.net/netdev/2021/09/11/52)
- [syzbot rtnetlink, Mar 2022](https://lists.openwall.net/netdev/2022/03/14/36)
- [syzbot NFC, Nov 2022](https://lists.openwall.net/netdev/2022/11/25/59)
- [Launchpad 1993645](https://bugs.launchpad.net/ubuntu/+source/linux-allwinner/+bug/1993645)
- [Launchpad 1994490](https://bugs.launchpad.net/bugs/1994490)
- [Launchpad 2024935](https://bugs.launchpad.net/bugs/2024935)