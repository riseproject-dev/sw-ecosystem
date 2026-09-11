---
title: U-Boot
parent: Project Reports
color: blue
dependencies:
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: GNU bison
    relation: build-dependency
    criticality: critical
  - name: Flex
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: pyelftools
    relation: build-dependency
    criticality: critical
  - name: dtc
    relation: build-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: SWIG
    relation: build-dependency
    criticality: optional
  - name: GnuTLS
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="u-boot" %}

# U-Boot

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for U-Boot<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

U-Boot ("Das U-Boot") is a bootloader. It is not developed on GitHub: canonical development happens at [source.denx.de/u-boot/u-boot](https://source.denx.de/u-boot/u-boot) (a GitLab CE instance, which now redirects to `git.u-boot-project.org`), with patches submitted to the `u-boot@lists.denx.de` mailing list and tracked at [patchwork.ozlabs.org/project/uboot](https://patchwork.ozlabs.org/project/uboot). [github.com/u-boot/u-boot](https://github.com/u-boot/u-boot) is a read-only mirror with Issues and Pull Requests disabled.

**Governance.** As of December 2025, U-Boot joined the Software Freedom Conservancy (SFC) as a member project, its first formal legal/organizational representation (previously an informal DENX-hosted community). A Project Leadership Committee (PLC) includes Tom Rini (long-time lead maintainer and release manager) and Neil Armstrong (Linaro); Peter Robinson is also cited as helping with project organization. Governance follows a Linux-kernel-style custodian/maintainer-tree model: subsystem custodians listed in `MAINTAINERS` pick up mailing-list patches for their area and send Tom Rini pull requests; Rini is the top-level custodian who applies patches and ships scheduled releases. License is GPL-2.0-or-later.

**Corporate sponsors / maintainers relevant to RISC-V.** Andes Technology (Rick Chen, Leo Yu-Chi Liang) maintains the general RISC-V architecture entry and currently custodians the `u-boot-riscv/master` and `u-boot-riscv/next` trees. Texas Instruments is named as a project sponsor in the SFC announcement. Linaro is represented on the PLC via Neil Armstrong. NXP appears among other subsystem `MAINTAINERS` entries. Two RISC-V sub-port maintainers, Sean Anderson (Canaan Kendryte K210) and Yao Zi (T-Head TH1520), list personal (non-corporate) emails.

**Community stance on new ports.** No formal numeric/tiered support policy (e.g. "tier 1/2/3") was found. U-Boot's documented Design Principles / Best Practices for Board Ports are normative-quality-based: new ports must pass `checkpatch`, use `make savedefconfig`, implement "Standard Boot," and be written generically for reuse. The mailing-list review process is open by default; RISC-V itself entered through this standard path in December 2017, merged directly by its corporate maintainer (Andes) with no special-casing.

**RISE membership.** [riseproject.dev](https://riseproject.dev) does not list U-Boot as a RISE member project or supported project. Andes Technology, U-Boot's RISC-V architecture maintainer organization, is itself a RISE General member, an indirect link only. RISE's most direct U-Boot involvement is a Collabora-executed, RISE-funded hardware-in-the-loop CI project (Section 12/14 below), not a formal U-Boot membership.

**Caveat:** the `docs.u-boot-project.org` governance page and parts of the riseproject.dev members listing were inaccessible during research (bot-blocked or DNS failure); governance details rely on the SFC announcement and secondary reporting rather than a single official governance charter URL.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-12-26 | First `arch/riscv` commit, `e8e39597a33cc53aacbaf4ef5cae60ed86d6a20a`, "riscv: cpu: Add nx25 to support RISC-V" (Rick Chen, Andes), part of a same-day batch adding Andes NX25/AE250 core support | Verified via `git log --diff-filter=A --reverse -- arch/riscv` on the u-boot/u-boot mirror |
| 2025-04-20 | MAINTAINERS cleanup: attribute all `qemu-riscv*` defconfigs to the QEMU RISC-V VIRT board entry (Heinrich Schuchardt) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250420085929.36226-5-heinrich.schuchardt@canonical.com/) |
| 2025-05-13 | Initial SPL support for T-Head TH1520 SoC, v2, 10-patch series including DRAM controller and cache management (Yao Zi) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250513090503.46670-4-ziyao@disroot.org/) |
| 2025-05-29 | Revert of a set of RV64 image-type verification patches that had broken existing boot flows (Mayuresh Chitale, Ventana Micro) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250529033052.399573-1-mchitale@ventanamicro.com/) |
| 2025-05-30 | Convert Lichee Pi 4A (T-Head TH1520) from M-mode-only boot to OpenSBI + S-mode U-Boot flow (Yao Zi) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250530094851.57198-2-ziyao@disroot.org/) |
| 2025-06-06 | IPI support for T-Head C900-series CLINT, enabling SMP on TH1520 (Yao Zi) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250606042804.64311-2-ziyao@disroot.org/) |
| 2025-07-19 | Standardize `SYS_BOOTM_LEN` across RISC-V boards including Microchip Icicle (Martin Herren) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250719214650.214931-2-sputnik@on-the-web.ch/) |
| 2025-08-07 | Initial "Andes Voyager" board support (Leo Yu-Chi Liang, Andes) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20250807113807.361649-1-ycliang@andestech.com/) |
| 2025-09-02 -> 2025-09-25 | A Zalrsc-only synchronization alternative for `start.S` was merged (2025-09-02), then reverted (2025-09-25) after it caused regressions on cores supporting only Zaamo/Zalrsc (Yao Zi) - a real, documented regression-and-revert cycle | [merge patch](https://patchwork.ozlabs.org/project/uboot/patch/20250902081932.21103-4-ziyao@disroot.org/), [revert](https://patchwork.ozlabs.org/project/uboot/patch/20250925160148.21624-1-ziyao@disroot.org/) |
| 2025-11-19 | Dedicated MPFS (Microchip PolarFire SoC) CPU driver, split out of the generic RISC-V CPU implementation (Jamie Gibbons, Microchip) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20251119123843.4171699-2-jamie.gibbons@microchip.com/) |
| 2026-01-16 | BeagleV-Fire (Microchip PolarFire-based) board support (Jamie Gibbons, Microchip) | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20260116140830.1422571-1-jamie.gibbons@microchip.com/) |
| 2026-05-15 | Make `RISCV_ACLINT` Kconfig option user-selectable (Michal Simek, AMD), needed for boards like Xilinx MBV | [patch](https://patchwork.ozlabs.org/project/uboot/patch/f5c30c9faeba9e0f519fdf89c10e04c768c5f92b.1778849270.git.michal.simek@amd.com/) |
| 2026-06-24 | Yao Zi added as a listed RISC-V reviewer in `MAINTAINERS` | [patch](https://patchwork.ozlabs.org/project/uboot/patch/20260624045648.524454-2-me@ziyao.cc/) |
| 2026-08-05 -> 2026-08-07 | `u-boot-riscv/main` custodian pull (Leo Liang -> Tom Rini): MPFS hardware RNG support + Milk-V Duo 256M board support, 23 files, 407 insertions; Rini replied "Merged into u-boot/main, thanks!" | [pull thread](https://patchwork.ozlabs.org/project/uboot/patch/anN_JWh_JneoPUOa@lliang-1876.localdomain/) |

**Key contributors and organizations:** Andes Technology (Rick Chen, Leo Yu-Chi Liang - custodian), Microchip (Jamie Gibbons - MPFS/PolarFire/BeagleV-Fire), Yao Zi (independent - T-Head TH1520), AMD (Michal Simek), Ventana Micro (Mayuresh Chitale), Qualcomm (Rahul Pathak - SBI MPXY), HTEC Group (Uros Stajic - P8700 SoC port), Institute of Software Chinese Academy of Sciences (Pengpeng Hou).

**Upstream status:** RISC-V (32- and 64-bit) is fully mainline, not an out-of-tree or WIP fork. It has been continuously developed since December 2017, with recurring custodian pull requests landing roughly every 2-4 weeks and 100+ RISC-V patches recorded in patchwork history.

## 3. Upstream Support Tier

No formal tiered ("tier 1/2/3") support policy document was found for U-Boot generally. The practical evidence of RISC-V's tier is:

- **CI:** riscv64 (and riscv32) have dedicated GitLab CI jobs that build and run functional boot tests under QEMU (see Section 7), running unconditionally in every pipeline alongside a "world build" job (`buildman -PEWM -x xtensa`) that compiles nearly every defconfig in the tree, riscv64 boards included, excluding only `xtensa`.
- **Official binaries:** U-Boot upstream does not publish precompiled binaries for any architecture; its release artifact is source only (git tags / source tarballs), consistent with its nature as a per-board bootloader that must be built and configured for the target hardware.
- **Distro binaries:** Ubuntu 26.04 ("resolute") ships riscv64 U-Boot binaries (`u-boot-tools`, `u-boot-microchip`, `u-boot-sifive`, `u-boot-starfive`, `u-boot-s32-tools`) - see Section 8.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI: build | Data not available: explicit amd64 job enumeration was not part of the researched `.gitlab-ci.yml` excerpts (the "world build" job covers all defconfigs except `xtensa`, which would include amd64/arm64 boards, but individual job names were not captured) | Data not available: same as amd64 | Confirmed: `qemu-riscv64`, `qemu-riscv64_spl`, `qemu-riscv64_smode`, `qemu-riscv64_smode_acpi`, `qemu-riscv32`, `qemu-riscv32_spl`, plus `sifive_unleashed_spi-nor` |
| Upstream CI: test execution | Data not available | Data not available | Confirmed: `test.py` functional boot tests run under QEMU for all listed jobs, verified passing in live pipeline 30701 (2026-08-12) |
| Upstream binary release | None (source-only for every architecture) | None (source-only) | None (source-only) |
| Distro riscv64 package | N/A (not the question) | N/A (not the question) | Confirmed in Ubuntu 26.04 (Section 8); confirmed absent in Arch Linux RISC-V |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Source: direct enumeration of the `arch/riscv/` tree (154 files) and related code in a shallow clone of `github.com/u-boot/u-boot`.

**`arch/riscv/cpu/`** - CPU init, trap handling, per-SoC glue across 13 SoC subdirectories (`andes/`, `ast2700/`, `cv1800b/`, `fu540/`, `fu740/`, `generic/`, `jh7110/`, `k1/`, `k230/`, `mpfs/`, `th1520/`, plus others). `cpu.c` implements generic RISC-V CPU driver logic including ISA-extension detection (`__riscv_isa_extension_available()`). `start.S` is the assembly entry point implementing a hart "lottery" for SMP boot (all RISC-V harts enter at the same reset vector, unlike ARM's dedicated boot-core signaling). `mtrap.S` is the machine-mode trap/exception vector in assembly.

**`arch/riscv/lib/`** - includes assembly routines `memcpy.S`, `memmove.S`, `memset.S`, `setjmp.S`, `semihosting.S`, `crt0_riscv_efi.S`, and ISA-extension-dispatched string routines `strcmp_zbb.S`, `strlen_zbb.S`, `strncmp_zbb.S` (Zbb bit-manipulation extension), selected at build time via `CONFIG_USE_ARCH_STRLEN/STRCMP/STRNCMP` with a runtime `RISCV_ISA_EXT_ZBB` capability check. This is the closest equivalent to architecture-specific dispatch in the codebase - it is scalar bit-manipulation, not vector/SIMD. C sources include `board.c`, `boot.c`, `bootm.c`, `cache.c`, `interrupts.c`, `smp.c`, `spl.c`, `sbi.c`, `sbi_ipi.c`, `aclint_ipi.c`, `andes_plicsw.c`, `sifive_cache.c`, `thead_cmo.c`, `fdt_fixup.c`, `image.c`, `reset.c`, `clz.c`, `ctz.c`.

**`arch/riscv/include/asm/`** - 57 headers (`atomic.h`, `barrier.h`, `bitops.h`, `cache.h`, `csr.h`, `encoding.h`, `sbi.h`, `smp.h`, `cpufeature.h`, `hwcap.h`, `insn-def.h`, `setjmp.h`, `unaligned.h`, `system.h`, `processor.h`, `ptrace.h`) plus per-SoC `arch-*/` subdirectories.

**`arch/riscv/dts/`** - 25 `.dtsi` + 15 `.dts` files for RISC-V boards/SoCs (QEMU virt32/virt64, HiFive Unleashed/Unmatched, VisionFive2, TH1520, K230, K1, AST2700-Ibex, AE350, OpenPiton, Xilinx MBV, etc.).

**Outside `arch/riscv/`:** 13 board directories under `board/` (andestech, aspeed, beagle, emulation, microchip, openpiton, sifive x2, sipeed, starfive, thead, xilinx); commands `cmd/riscv/exception.c` and `cmd/riscv/sbi.c`; drivers `drivers/cpu/riscv_cpu.c`, `drivers/rng/riscv_zkr_rng.c` (Zkr entropy-source extension), `drivers/timer/riscv_timer.c`, `drivers/timer/riscv_aclint_timer.c`; EFI layer (`lib/efi_loader/efi_riscv.c`, `lib/efi_driver/efi_reset_riscv.c`); tooling `tools/prelink-riscv.c` (RISC-V relocation prelinker for mkimage); 9 `configs/*riscv*_defconfig` files; docs `doc/arch/riscv.rst`, `doc/board/emulation/qemu-riscv.rst`, `doc/board/openpiton/riscv64.rst`; devicetree bindings under `dts/upstream/Bindings/riscv/` (AIA/APLIC/IMSIC interrupt controllers, RPMI clock/mailbox, PMU, timer).

**Notable behaviors:** SBI (Supervisor Binary Interface) is the dominant runtime-services boundary - U-Boot commonly runs in S-mode with OpenSBI in M-mode (`lib/sbi.c`, `lib/sbi_ipi.c`, `cmd/riscv/sbi.c`, `include/asm/sbi.h`). ISA-extension runtime detection gates use of compressed instructions (Zca), FPU (F/D), and Zbb.

**What was not found:** no JIT compiler exists anywhere in U-Boot (project-wide, not RISC-V-specific). No RVV (RISC-V Vector extension) code and no true SIMD dispatch anywhere in `arch/riscv` - searches for `rvv`, "vector extension," and `simd` returned nothing.

| Category | amd64 / arm64 | riscv64 |
|---|---|---|
| JIT | Not present in U-Boot on any architecture (project-wide absence) | Not present |
| SIMD / vector dispatch | Data not available: no equivalent `arch/<arch>/lib` inventory was gathered for amd64/arm64 in this research | Absent - no RVV code found anywhere; only scalar Zbb bit-manipulation string routines |
| Crypto | Data not available for arch-specific crypto acceleration on amd64/arm64 | `drivers/rng/riscv_zkr_rng.c` (Zkr hardware entropy source); FIT-image signing uses OpenSSL/GnuTLS, both architecture-neutral |
| Hand-written assembly | Data not available for amd64/arm64 inventory | `start.S`, `mtrap.S`, `memcpy.S`/`memmove.S`/`memset.S`, `setjmp.S`, `semihosting.S`, `crt0_riscv_efi.S`, `strcmp_zbb.S`/`strlen_zbb.S`/`strncmp_zbb.S` |
| GC barriers | N/A - U-Boot has no garbage collector | N/A |

## 5. Build System, Cross-Compilation, and Toolchain

U-Boot uses Linux-kernel-style Kbuild/Kconfig, driven by `make` - there is no CMake and no `./configure` script. The Kconfig equivalent of a `-DUSE_X=OFF` flag is a `# CONFIG_FOO is not set` line applied via `./scripts/config` or `make menuconfig`, followed by `make olddefconfig`.

**Getting the source:**
```
git clone https://source.denx.de/u-boot/u-boot.git
# or the read-only mirror:
git clone https://github.com/u-boot/u-boot
```

**Build commands for riscv64:**
```
export CROSS_COMPILE=riscv64-linux-gnu-
make qemu-riscv64_defconfig        # M-mode
make -j$(nproc)

make qemu-riscv64_smode_defconfig  # S-mode (needs OpenSBI)
make -j$(nproc)

make qemu-riscv64_spl_defconfig    # SPL -> OpenSBI -> U-Boot
make -j$(nproc)
```
32-bit equivalents use `qemu-riscv32_defconfig`/`_smode_defconfig`/`_spl_defconfig`. Out-of-tree builds use `make O=<dir>` or `KBUILD_OUTPUT`.

**Kconfig-fragment flags relevant to riscv64** (from `qemu-riscv64` defconfigs and `doc/board/emulation/qemu-riscv.rst`): `CONFIG_RISCV_SMODE=y`, `CONFIG_ARCH_RV32I=y` / `CONFIG_ARCH_RV64I=y`, `CONFIG_XIP=y` with `CONFIG_TEXT_BASE=0x20000000`, and toolchain-emitted ISA-extension toggles `CONFIG_RISCV_ISA_C`, `_F`, `_D`, `_A`, `_ZBB`, `_ZICBOM`, `_ZAAMO`, `_ZALRSC`.

**Version gates.** The only hard-enforced minimum-version gate found anywhere in the build system is the device-tree compiler: `DTC_MIN_VERSION := 010406` (dtc 1.4.6) in the top Makefile - below that, U-Boot auto-builds its bundled `scripts/dtc`. There is **no hard-enforced minimum GCC or Clang version**; `doc/arch/riscv.rst` simply points to building or downloading the [riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain) with no version pin. In practice, ISA extensions such as Zbb bitmanip require a reasonably modern toolchain (Zbb support was not stable until roughly binutils 2.38 / gcc 12) [NEEDS VERIFICATION - stated as general context in the researched build docs, not independently version-tested].

**What upstream CI actually builds with** (`tools/docker/Dockerfile`, base image `ubuntu:noble-20251013`):
- GCC **14.2.0** (prebuilt kernel.org crosstool toolchains for `riscv64`/`riscv32`, `ENV TCVER=14.2.0`)
- Clang **20** (`apt.llvm.org`, package `clang-20`)
- QEMU built from source, tag **v10.1.2**, with `riscv32-softmmu,riscv64-softmmu` in its target list
- GRUB `grub-2.14`, cross-built to `riscv64-efi` for EFI-boot test coverage
- OpenSBI **v1.3.1** downloaded as prebuilt firmware for `_spl` test jobs (`opensbi-1.3.1-rv-bin.tar.xz` from `riscv-software-src/opensbi` GitHub releases)

**Debian/apt dependency list** (`doc/build/gcc.rst`):
```
sudo apt-get install gcc gcc-riscv64-linux-gnu
sudo apt-get install bc bison build-essential coccinelle \
  device-tree-compiler dfu-util efitools flex gdisk graphviz imagemagick \
  libgnutls28-dev libguestfs-tools libncurses-dev \
  libpython3-dev libsdl2-dev libssl-dev lz4 lzma lzma-alone openssl \
  pkg-config python3 python3-asteval python3-coverage python3-filelock \
  python3-pkg-resources python3-pycryptodome python3-pyelftools \
  python3-pytest python3-pytest-xdist python3-sphinxcontrib.apidoc \
  python3-sphinx-rtd-theme python3-subunit python3-testtools \
  python3-venv swig uuid-dev
```
The Alpine build notes explicitly call out `opensbi` as an extra dependency for riscv64 S-mode targets.

**QEMU usage** (`doc/board/emulation/qemu-riscv.rst`):
```
# M-mode, virt machine
qemu-system-riscv64 -nographic -machine virt -bios u-boot.bin

# S-mode / SPL, requires OpenSBI >= 0.4 built first
git clone https://github.com/riscv/opensbi.git
cd opensbi && make PLATFORM=generic
# copy build/platform/generic/firmware/fw_dynamic.bin, then:
make qemu-riscv64_spl_defconfig && make
qemu-system-riscv64 -nographic -machine virt -bios spl/u-boot-spl.bin \
  -device loader,file=u-boot.itb,addr=0x80200000
```
KVM acceleration is also documented (`-accel kvm`, S-mode ELF, no `-bios`), tested against QEMU 5.0.0 historically per the doc, with CI now using v10.1.2.

**riscv64 board targets in `arch/riscv/Kconfig`** (17): `TARGET_ANDES_AE350`, `TARGET_ANDES_VOYAGER`, `TARGET_BANANAPI_F3`, `TARGET_BEAGLEBOARD_BEAGLEVFIRE`, `TARGET_K230_CANMV`, `TARGET_LICHEERV_NANO`, `TARGET_MICROCHIP_GENERIC`, `TARGET_MILKV_DUO`, `TARGET_OPENPITON_RISCV64`, `TARGET_QEMU_VIRT`, `TARGET_SIFIVE_UNLEASHED`, `TARGET_SIFIVE_UNMATCHED`, `TARGET_SIPEED_MAIX`, `TARGET_STARFIVE_VISIONFIVE2`, `TARGET_TH1520_LPI4A`, `TARGET_XILINX_MBV`, `TARGET_ASPEED_AST2700_IBEX`.

**Access-method discrepancy [flagged per verification policy]:** initial research reported `source.denx.de` fully blocked by an Anubis anti-bot challenge, forcing reliance on the GitHub mirror for all fetches. A later verification pass successfully fetched `.gitlab-ci.yml` directly from `source.denx.de/u-boot/u-boot` via `curl` (HTTP 200) and queried the GitLab API directly for pipeline/job data. Both data points are reported here; the practical effect on this report is none, since content was cross-checked byte-identical against the GitHub mirror either way.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status |
|---|---|
| QEMU boot (M-mode, S-mode, S-mode+ACPI, SPL) | Present and CI-tested (Section 7) |
| Real-hardware CI target | SiFive Unleashed, SPI-NOR image build (`sifive_unleashed_spi-nor test.py`); SD-card variant currently disabled (see below) |
| SMP / multi-hart boot | Present (`start.S` hart-lottery mechanism; ACLINT/CLINT IPI drivers for SiFive, Andes PLICSW, T-Head C900 CLINT) |
| SBI runtime services | Present and central to the boot flow (`lib/sbi.c`, `lib/sbi_ipi.c`) |
| RVV / vector code | Absent - confirmed by full-tree search, no results for `rvv`, "vector extension," or `simd` in `arch/riscv` |
| JIT | Absent, project-wide (not RISC-V-specific) |
| SBI MPXY (Message Proxy) | In flight, under review as of 2026-09-08, enabled only for QEMU defconfig so far ([patch](https://patchwork.ozlabs.org/project/uboot/patch/20260709175605.1070755-4-rahul.pathak@oss.qualcomm.com/)) |
| New SoC port: MIPS/RISC-V P8700 (Boston board) | 7-patch v7 series, under review, largest new-SoC RISC-V port currently in flight ([patch 1/7](https://patchwork.ozlabs.org/project/uboot/patch/20260417122213.147529-2-uros.stajic@htecgroup.com/)) |
| Sophgo CV18xx / Milk-V Duo devicetree upstreaming | In flight, dropping locally-maintained DTs in favor of upstreamed Linux/DT source of truth ([patch](https://patchwork.ozlabs.org/project/uboot/patch/20260806-milkv-duo-upstream-dts-v3-6-917cf70a2337@zohomail.com/)) |

**Functional gaps and open correctness issues:**

- `sifive_unleashed_sdcard test.py` is currently **commented out** in `.gitlab-ci.yml` due to an upstream QEMU bug ([qemu-project/qemu#2945](https://gitlab.com/qemu-project/qemu/-/issues/2945)) - a real, currently-unresolved gap in real-hardware-adjacent CI coverage, blocked on the QEMU project rather than U-Boot itself.
- **M-mode timer patch** (`riscv: timer: Fix M-Mode timer`, [patch](https://patchwork.ozlabs.org/project/uboot/patch/20260904-riscv_fix_early_timer_mmode-v1-1-210e769b0ac2@maquefel.me/)) has unresolved reviewer pushback from Yao Zi: a stale doc comment, a possible duplicate-symbol link error when both `CONFIG_RISCV_TIMER` and `CONFIG_RISCV_ACLINT` are enabled simultaneously, and an open design question about whether S-mode/M-mode timer driver separation is even needed on cores with the TIME CSR available in M-mode. Not mergeable as-is.
- **IPI-not-initialized bug** (`riscv: Fix IPI not initialized in riscv_cpu_setup()`, [patch](https://patchwork.ozlabs.org/project/uboot/patch/20260904-fix_skipped_ipi_init-v1-1-3f4e7a10efe8@maquefel.me/)): a latent bug from commit `d8810e1d4f82` where IPI init is skipped when the CPU driver is disabled, yet `riscv_send_ipi()` is still invoked from `spl_invoke_opensbi()`. Acked-by AMD's Michal Simek but not yet merged as of 2026-09-08.
- **Historical regression:** a Zalrsc-only synchronization alternative for `start.S` was merged 2025-09-02 and reverted 2025-09-25 after breaking SMP boot on cores supporting only Zaamo/Zalrsc atomics - documented evidence that RISC-V-specific correctness regressions do occur and get caught/reverted through the normal process.
- **UEFI/ACPI RSDP memory-type regression** (U-Boot >= v2024.10): RSDP placed in the wrong EFI memory type ("Boot Code" instead of "ACPI Reclaim"), causing kexec access faults on subsequent kernel boots. A fix was proposed and sitting in maintainer Heinrich Schuchardt's patchwork queue as of an April 2025 mailing-list thread. **[NEEDS VERIFICATION]** - current landed/unlanded status was explicitly flagged in the research as needing a re-check against current patchwork state; this report cannot confirm resolution. Source: [mail-archive thread](https://www.mail-archive.com/u-boot@lists.denx.de/msg541140.html).

**Security (not RISC-V-specific but affecting riscv64 builds):** CVE-2024-57256 (`ext4fs_read_symlink()` integer overflow, crafted inode size causing heap overwrite) and companion CVEs 2024-57254 through 57259 (squashfs/other filesystem heap issues) affected all U-Boot builds <= 2024.10, riscv64 included; both fixed in v2025.01-rc1. CVE-2025-24857 is **not** a RISC-V issue (affects ARM-based Qualcomm IPQ chipsets) and is flagged here only to rule it out as a false lead.

**Performance gaps:** no quantitative U-Boot-on-RISC-V performance data (boot times, cycle counts, throughput) was found in any public source searched, including the RISE Project blog, Codethink's "Deep Dive into Upstream RISC-V Boot Chain" poster (RISC-V Summit Europe 2026), U-Boot release notes, or vendor documentation. Given the absence of RVV code, and given a bootloader's workload is dominated by I/O and hardware initialization rather than compute, the missing-SIMD performance delta that matters for math/ML libraries is not expected to be architecturally significant here, but this is inference, not measured data. **Data not available: quantitative U-Boot riscv64 vs arm64/amd64 boot-time or throughput benchmarks.**

**NaN / floating-point semantics:** Data not available - not covered by the research performed.

## 7. CI/CD Infrastructure

U-Boot's sole CI system is **GitLab CI**, defined in `.gitlab-ci.yml` at the repository root of [source.denx.de/u-boot/u-boot](https://source.denx.de/u-boot/u-boot) (canonical, redirects to `git.u-boot-project.org`). The GitHub mirror carries no `.github/workflows` (confirmed 404), and no separate Buildbot/Jenkins system was found for the mainline project.

**Confirmed riscv64/riscv32 jobs** (`.buildman_and_testpy_template`, lines ~465-499 as read):
- `qemu-riscv64 test.py` (`TEST_PY_BD: "qemu-riscv64"`)
- `qemu-riscv64_spl test.py`
- `qemu-riscv64_smode test.py`
- `qemu-riscv64_smode_acpi test.py`
- `qemu-riscv32 test.py`, `qemu-riscv32_spl test.py`

These jobs build with `tools/buildman/buildman --board ${TEST_PY_BD}`, then boot the resulting image under QEMU and run `test/py/test.py` - a functional boot test, not a compile-only check. For `_spl` variants, OpenSBI v1.3.1 firmware is downloaded and exported; `grub_riscv64.efi` is copied in for EFI-boot test coverage. None of these jobs carry `rules:`, `allow_failure`, or `when: manual` overrides - they run unconditionally under the top-level `workflow: rules: - when: always`.

**Real-hardware-adjacent target:** `sifive_unleashed_spi-nor test.py` builds SPL/`u-boot.itb` and uses `genimage` with `board/sifive/unleashed/genimage_spi-nor.cfg` to produce a flashable SPI-NOR image for the SiFive Unleashed board. A companion `sifive_unleashed_sdcard test.py` job is currently commented out due to an upstream QEMU bug ([qemu-project/qemu#2945](https://gitlab.com/qemu-project/qemu/-/issues/2945)).

**World-build sanity job:** `buildman -PEWM -x xtensa` builds essentially every defconfig in the tree except `xtensa`, riscv64/riscv32 boards included.

**Live verification:** the file was fetched directly from `source.denx.de` (HTTP 200) and cross-checked byte-identical against the GitHub mirror's raw content. GitLab API queries against `source.denx.de` confirmed: the file was last touched 2026-07-13 by Tom Rini (actively maintained), and pipeline `30701` (ref `main`, 2026-08-12, status `success`) shows all six riscv64/riscv32 `test.py` jobs completing with status `success` between 20:53 and 20:58 UTC that day.

**Open item:** no pipeline records were found between 2026-08-14 and 2026-09-08 (a roughly 3.5-week gap) in the API listing checked. The cause (reduced push/pipeline cadence vs. a listing/permissions limit on the query used) was not determined and should be investigated as a follow-up; it does not by itself indicate riscv64 CI is currently broken, since the most recent recorded run passed cleanly.

**RISE runners:** not used for U-Boot's own upstream GitLab CI per the research gathered. RISE's [riscv-runner](https://github.com/riseproject-dev/riscv-runner) project is a GitHub Actions runner service for application-level CI and is unrelated to U-Boot's GitLab pipeline. RISE's actual U-Boot-adjacent work is a separate hardware-in-the-loop LAVA/Boardswarm project (Section 12).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI jobs | Data not available: not individually enumerated in this research (covered implicitly by the "world build" job) | Data not available: same | Confirmed: 6 QEMU jobs (4 riscv64 boot modes + 2 riscv32) + 1 real-hardware-adjacent (SiFive Unleashed) |
| Functional test execution | Data not available | Data not available | Confirmed via `test.py` under QEMU, verified passing in live pipeline |
| CI gating | Data not available (whether merge is blocked on CI pass was not directly confirmed for any architecture) | Data not available | No `allow_failure`/manual override found; runs unconditionally |

## 8. Distribution and Release Status

U-Boot upstream does **not** publish precompiled binaries for any architecture. Its release artifact is source code only (git tags, e.g. `v2026.xx`), consistent with its nature as a bootloader that must be built and configured per target board.

**PyPI:** no package. `https://pypi.org/pypi/u-boot/json` returns HTTP 404, confirmed independently via both `WebFetch` and direct `curl`, and via the fallback `https://pypi.org/simple/u-boot/` (also 404). U-Boot is a C bootloader with no legitimate PyPI presence.

**Ubuntu 26.04 ("resolute")** - confirmed via raw HTML from `packages.ubuntu.com` (parsed directly, not via a summarized fetch):

| Package | Description | Version | Architectures |
|---|---|---|---|
| `u-boot-microchip` | Boot loader for Microchip systems | 2025.10-0ubuntu2 [ports] | riscv64 |
| `u-boot-sifive` | Boot loader for SiFive systems | 2025.10-0ubuntu2 [ports] | riscv64 |
| `u-boot-starfive` | Boot loader for Starfive systems | 2025.10-0ubuntu2 [ports] | riscv64 |
| `u-boot-tools` | Companion tools for Das U-Boot bootloader | 2025.10-0ubuntu2 | amd64, arm64, armhf, ppc64el, riscv64, s390x |
| `u-boot-s32-tools` | Companion tools for Das U-Boot S32 bootloader | 2022.04-bsp37.0-0ubuntu4 | amd64, arm64, armhf, ppc64el, riscv64, s390x |

Three of the five (`u-boot-microchip`, `u-boot-sifive`, `u-boot-starfive`) are marked `[ports]`, meaning they build via `ports.ubuntu.com` (Ubuntu's secondary-architecture archive for riscv64), not the primary archive; `u-boot-tools` and `u-boot-s32-tools` carry no `[ports]` marker. **Whether Ubuntu's packaging applies any riscv64-specific patches on top of upstream source was not directly checked in this research** (the `debian/patches` directory was not inspected) - this is [NEEDS VERIFICATION] rather than a confirmed "unpatched" claim.

**Arch Linux RISC-V port** (`archriscv.felixc.at`): confirmed **absent**. A raw directory scan of all five repo listings (`core`, `extra`, `community`, `unsupported`, `multilib` - confirmed populated with hundreds of real `.pkg.tar.zst` entries) returned zero `u-boot*` matches in any of them.

**What a user must do to get a working riscv64 binary:** either (a) install `u-boot-tools` or the relevant board-specific package (`u-boot-microchip`, `u-boot-sifive`, `u-boot-starfive`) on Ubuntu 26.04, or (b) build from source: clone the repository, install the toolchain and build dependencies (Section 5), and run `make <board>_defconfig && make`. There is no upstream-published riscv64 binary release channel of any kind.

## 9. Dependencies

**Blocking issue:** the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research effort - this is a tooling/connectivity failure, not confirmation of absence. No SPARQL-backed riscv64 build/test/release status could be obtained for any dependency below; every "graph:" data point should be treated as "not graph-verified, pending server availability."

Source used instead: `tools/docker/Dockerfile` (U-Boot's own CI image manifest), `.gitlab-ci.yml`, and `doc/build/tools.rst`/`README`.

| Dependency | Role | riscv64 build/test/release | Notes |
|---|---|---|---|
| GCC (+ riscv64 cross toolchain) | Compiler for host tools and target cross-compilation | Not graph-verified; CI specifically uses GCC 14.2.0 kernel.org crosstool builds for riscv64/riscv32 | `gcc-riscv64-linux-gnu` is a standard Debian/Ubuntu package |
| GNU binutils | Assembler/linker | Not graph-verified | riscv64 is a long-standing binutils upstream target |
| GNU make | Build system driver | Not graph-verified | Architecture-independent host tool |
| GNU bison (+ flex) | Kconfig parser generation | Not graph-verified | Architecture-independent host tool |
| Python 3 (+ pyelftools, dev headers) | Runs `binman`, `buildman`, `patman`, `dtoc`, `test/py` suite | Not graph-verified | CPython has upstream riscv64 support |
| device-tree-compiler (dtc) | Compiles `.dts` to `.dtb`; min version 1.4.6 enforced (`DTC_MIN_VERSION`), else U-Boot auto-builds its bundled `scripts/dtc` | Not graph-verified | Not currently tracked in `projects.yml` |
| OpenSSL (`libssl-dev`) | FIT image signing / verified boot, `mkimage -F` | Not graph-verified | |
| SWIG | Generates `pylibfdt` Python bindings for `binman`/`dtoc` | Not graph-verified | |
| GnuTLS (`libgnutls28-dev`) | Alternate crypto backend for `mkeficapsule` / EFI capsule signing | Not graph-verified | Not currently tracked in `projects.yml` |

**Secondary/CI-only dependencies** found in `tools/docker/Dockerfile` but not individually assessed: `libconfuse-dev`, `libseccomp-dev`, `libslirp-dev`, `libjson-glib-dev`, `libpixman-1-dev`, `libudev-dev`, `libusb-1.0-0-dev`, `sbsigntool`, `vboot-utils`/`vboot-kernel-utils`, `xilinx-bootgen`, `efitools`, `iasl`, `imagemagick`, `sparse`, `ninja-build`, `meson` - these support optional tooling (sandbox/QEMU host builds, EFI capsule signing, ACPI table compilation, static analysis) rather than the core bootloader build.

None of these dependencies were flagged in the research as having a known riscv64 build/test blocker. This should be re-verified once the `project-graph` server is reachable.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Ubuntu Bug #1980594](https://bugs.launchpad.net/bugs/1980594) | `qemu-riscv64_smode/uboot.elf` cannot boot with KVM; virtio access crashes/hangs QEMU (SRCU deadlock in RISC-V KVM) | Fixed | Correctness | Resolved by kernel patch `be82abe6a76b`, landed Linux v5.19-rc7 |
| [Ubuntu Bug #1923162](https://bugs.launchpad.net/ubuntu/+source/u-boot/+bug/1923162) | riscv64 images fail to boot in QEMU; crash on `extlinux.conf` when `fdtdir` set but `dtbfile` unset | Fixed | Correctness | Upstream patch "cmd: pxe_utils: sysboot: fix crash if either board or soc are not set" + `USE_PREBOOT` change |
| N/A (mailing-list thread) | RISC-V UEFI/ACPI regression (U-Boot >= v2024.10): RSDP placed in wrong EFI memory type, causing kexec access faults | Fix proposed, landing status unconfirmed | Correctness | **[NEEDS VERIFICATION]** - sitting in Heinrich Schuchardt's patchwork queue as of an April 2025 thread; not re-checked against current state. [Thread](https://www.mail-archive.com/u-boot@lists.denx.de/msg541140.html) |
| N/A (distro notes) | Virtio PCIe BAR enumeration bug, introduced U-Boot 2022.07, crashes on `virtio scan` in PCIe environments on riscv64 | Reported fixed in later releases | Correctness | No single canonical upstream bug number found |
| [CVE-2024-57256](https://github.com/advisories/GHSA-vmjq-93g5-fvqc) | `ext4fs_read_symlink()` integer overflow, heap overwrite | Fixed in v2025.01-rc1 | Security (not RISC-V-specific, affects riscv64 builds) | |
| CVE-2024-57254 through CVE-2024-57259 | Companion filesystem heap-corruption issues (squashfs and related) | Fixed in v2025.01-rc1 | Security (not RISC-V-specific) | [Advisory](https://seclists.org/oss-sec/2025/q1/143) |
| [riscv timer patch](https://patchwork.ozlabs.org/project/uboot/patch/20260904-riscv_fix_early_timer_mmode-v1-1-210e769b0ac2@maquefel.me/) | M-mode timer rate/count fix has unresolved reviewer concerns (possible duplicate-symbol link error) | Open, needs v2 | Build/correctness | Reviewer: Yao Zi |
| [IPI init patch](https://patchwork.ozlabs.org/project/uboot/patch/20260904-fix_skipped_ipi_init-v1-1-3f4e7a10efe8@maquefel.me/) | IPI not initialized when CPU driver disabled but still called from `spl_invoke_opensbi()` | Open, Acked-by AMD (Michal Simek), not yet merged | Correctness | Introduced by commit `d8810e1d4f82` |
| N/A (historical) | Zalrsc-only sync alternative for `start.S` broke SMP boot on Zaamo/Zalrsc-only cores | Resolved via revert (2025-09-25) | Correctness (historical) | Documented regression-and-revert cycle |

**Excluded as a false lead:** CVE-2025-24857 (improper access control on volatile boot-code memory, RCE with physical access) affects Qualcomm IPQ-series **ARM** chipsets, U-Boot < 2017.11 - it is not a RISC-V issue and is noted here only to prevent misattribution. [CISA ICSA-25-343-01](https://www.cisa.gov/news-events/ics-advisories/icsa-25-343-01).

U-Boot has no active GitHub issue tracker (the mirror's Issues are disabled). Real bug/patch traffic lives on the `u-boot@lists.denx.de` mailing list and patchwork; Ubuntu/Debian Launchpad bug numbers are the closest thing to stable "issue numbers" for riscv64 problems specifically.

## 12. Objections and Upstream Blockers

No explicit organizational or maintainer objection to RISC-V as an architecture was found. RISC-V entered mainline in December 2017 through the standard patch-review process with no special-casing, and the custodian model (Andes Technology's Leo Yu-Chi Liang batching patches for Tom Rini) continues to function normally - the most recent captured custodian pull (2026-08-05) merged cleanly with "CI result shows no issue."

Current blockers are patch-level, not architectural:
- The **M-mode timer fix** has concrete, unresolved reviewer objections from Yao Zi (stale documentation, a possible duplicate-symbol link error when both `CONFIG_RISCV_TIMER` and `CONFIG_RISCV_ACLINT` are enabled, and an open design question on S-mode/M-mode timer driver separation) - needs a v2.
- The **P8700 SoC port** (7-patch v7 series from HTEC Group) has already cycled through six prior revisions without merging as of 2026-09-08; no specific blocking objection was captured in the researched patch pages, but the multi-revision history indicates ongoing review, not rejection.
- The **Sophgo/Milk-V Duo devicetree upstreaming** series and the **SBI MPXY** series are both "Under Review" with no captured objections.

Patches closest to merging: the **MPFS FPGA design-info** patch (v3) carries `Acked-by: Jamie Gibbons` and `Reviewed-by: Conor Dooley` (both Microchip); the **IPI-init fix** carries `Acked-by: Michal Simek` (AMD). Both appear well-reviewed and likely close to landing via the next custodian pull.

No organizational blockers (funding disputes, governance vetoes, or corporate objections) to RISC-V support were found in the research performed.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro (Ubuntu 26.04 ships riscv64 binaries; U-Boot upstream publishes no precompiled binaries for any architecture)
- **Justification:** Upstream GitLab CI at [source.denx.de/u-boot/u-boot](https://source.denx.de/u-boot/u-boot) builds riscv64/riscv32 targets and runs functional `test.py` boot tests under QEMU across four boot-mode variants (M-mode, S-mode, S-mode+ACPI, SPL) plus a real-hardware-adjacent SiFive Unleashed image-build job, all running unconditionally with no manual/allow-failure gating; this was independently verified by fetching `.gitlab-ci.yml` directly and confirming a live pipeline (30701, 2026-08-12) with all riscv64/riscv32 jobs passing. This satisfies the "CI builds + tests pass" bar for blue. It does not reach green because U-Boot publishes no upstream riscv64 (or any-architecture) binary artifact at all - its only release form is source; the consumable riscv64 binaries available to users come from Ubuntu 26.04's packaging (`u-boot-tools`, `u-boot-microchip`, `u-boot-sifive`, `u-boot-starfive`), not from upstream directly.
- U-Boot is not an optimization-purpose project (its value is functional bootloader correctness, not delivering algorithmic speedup over a simpler reference implementation), so the Step 2 optimization-coverage cap does not apply; **Optimization level is omitted from the header accordingly.**
- **Pending work that could change the grade:** none of the currently open riscv64 patches (P8700 port, MPFS FPGA info, Sophgo/Milk-V Duo DTS cleanup, SBI MPXY, the three Nikita Shubin fixes) would change the color if merged - they extend board/SoC coverage and fix bugs within an already-blue CI posture. The color would only move to green if upstream began publishing riscv64 binary releases directly, which nothing in the current patch queue proposes.

## 14. Investment Analysis

RISE-funded or RISE-hosted work already covers two areas and should not be re-sized:
- **Hardware-in-the-loop CI** for U-Boot on real RISC-V hardware (Banana Pi BPI-F3, SiFive HiFive Premier P550) via LAVA + Boardswarm, executed by Collabora under RISE-funded Project RP012 (bid window Feb-Mar 2025), including a U-Boot extension to write SPI flash over fastboot (referenced commit `afca60620ad7958fbee2d5518de0383483c82ced`). Documented in [RISE's "Tested on Real Silicon" post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/) (2025-09-01).
- **OP-TEE/RISC-V U-Boot fork**, actively maintained at [gitlab.com/riseproject/riscv-optee/u-boot](https://gitlab.com/riseproject/riscv-optee/u-boot) (branch `dev-optee-mpxy-v5`), part of RISE's OP-TEE support project.

### 14.1 Functional Enablement
RISC-V has been fully mainline since December 2017 with broad board/SoC coverage (17 Kconfig targets). Remaining functional work is incremental, already community-driven, and small in scope: completing the P8700 SoC port (HTEC Group), finishing Sophgo Milk-V Duo devicetree upstreaming, and extending SBI MPXY beyond the QEMU defconfig (Qualcomm). Investment here would take the form of sponsoring patch-review bandwidth or engineering time to push these specific in-flight series (and the two small open fixes - M-mode timer, IPI init) through to merge, not a fresh port effort.

### 14.2 Performance Optimization
U-Boot has no RVV/vector code and only a narrow scalar Zbb dispatch (string routines). No public benchmark data exists to establish whether this matters in practice; boot-time for a bootloader is typically dominated by I/O and hardware bring-up rather than compute, which limits the expected value of SIMD-style optimization work here. Before sizing any optimization investment, original benchmarking (e.g., boot-time measurement on `qemu-riscv64_smode` or real hardware such as HiFive Unmatched/VisionFive2/BPI-F3) would be a prerequisite, since none currently exists.

### 14.3 CI/CD Infrastructure
riscv64 CI already exists, is unconditional, and passes. The one concrete gap is the disabled `sifive_unleashed_sdcard test.py` job, blocked on an external QEMU bug ([qemu-project/qemu#2945](https://gitlab.com/qemu-project/qemu/-/issues/2945)) rather than anything in U-Boot's control - closing this would require upstream QEMU engagement, not U-Boot investment. The ~3.5-week gap in pipeline records found during verification (2026-08-14 to 2026-09-08) warrants a follow-up check to rule out reduced CI cadence.

### 14.4 Ecosystem Enablement
Not applicable in the Section 10 sense (U-Boot has no dependent package ecosystem - see below). At the distribution level, riscv64 U-Boot packages are absent from Arch Linux RISC-V; adding them (or engaging the RISC-V distro packaging community) would be a low-effort way to broaden availability outside Ubuntu, if that gap matters for target use cases.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Push P8700 SoC port (7-patch v7 series) through remaining review to merge | Data not available: effort depends on outstanding reviewer feedback not captured in this research; likely low (patch is already at v7) | HTEC Group (existing author); sponsor review bandwidth | Medium |
| Functional | Resolve M-mode timer patch reviewer concerns (v2) and merge IPI-init fix | Low (single-digit engineer-days per patch) | Community (Nikita Shubin, AMD ack already in hand for IPI fix) | Medium |
| CI/CD | Investigate and close the ~3.5-week pipeline-record gap (2026-08-14 to 2026-09-08) | Low (investigation only) | U-Boot infra / DENX | Low |
| CI/CD | Re-enable `sifive_unleashed_sdcard test.py` once QEMU issue #2945 is fixed upstream | Data not available: depends on QEMU project timeline, outside U-Boot's control | QEMU project (external dependency) | Low |
| Distribution | Package riscv64 U-Boot for Arch Linux RISC-V (currently absent) | Low | Arch RISC-V packaging community | Low |
| Performance | Establish a baseline riscv64 boot-time benchmark (none currently exists) before any optimization roadmap is sized | Low-Medium (benchmarking harness + real-hardware or QEMU runs) | Whoever owns performance investment decisions | Low (contingent on whether boot-time matters for the target use case) |

## 15. Updates
(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [source.denx.de/u-boot/u-boot](https://source.denx.de/u-boot/u-boot) - canonical repository (GitLab CE, redirects to git.u-boot-project.org)
- [github.com/u-boot/u-boot](https://github.com/u-boot/u-boot) - read-only mirror
- [patchwork.ozlabs.org/project/uboot](https://patchwork.ozlabs.org/project/uboot) - patch tracker mirroring the mailing list
- [doc/arch/riscv.rst](https://github.com/u-boot/u-boot/blob/master/doc/arch/riscv.rst)
- [doc/board/emulation/qemu-riscv.rst](https://github.com/u-boot/u-boot/blob/master/doc/board/emulation/qemu-riscv.rst)
- [doc/board/openpiton/riscv64.rst](https://github.com/u-boot/u-boot/blob/master/doc/board/openpiton/riscv64.rst)
- [arch/riscv/cpu tree](https://source.denx.de/u-boot/u-boot/-/tree/master/arch/riscv/cpu)
- [arch/riscv/cpu/start.S](https://source.denx.de/u-boot/u-boot/-/blob/master/arch/riscv/cpu/start.S)
- [arch/riscv/cpu/mtrap.S](https://source.denx.de/u-boot/u-boot/-/blob/master/arch/riscv/cpu/mtrap.S)
- [u-boot-riscv/main custodian pull, 2026-08-05](https://patchwork.ozlabs.org/project/uboot/patch/anN_JWh_JneoPUOa@lliang-1876.localdomain/)
- [MAINTAINERS: riscv reviewer addition](https://patchwork.ozlabs.org/project/uboot/patch/20260624045648.524454-2-me@ziyao.cc/)
- [RISCV_ACLINT visibility fix](https://patchwork.ozlabs.org/project/uboot/patch/f5c30c9faeba9e0f519fdf89c10e04c768c5f92b.1778849270.git.michal.simek@amd.com/)
- [BeagleV-Fire board support](https://patchwork.ozlabs.org/project/uboot/patch/20260116140830.1422571-1-jamie.gibbons@microchip.com/)
- [MPFS custom CPU implementation](https://patchwork.ozlabs.org/project/uboot/patch/20251119123843.4171699-2-jamie.gibbons@microchip.com/)
- [Zalrsc sync revert](https://patchwork.ozlabs.org/project/uboot/patch/20250925160148.21624-1-ziyao@disroot.org/)
- [Zalrsc sync original merge](https://patchwork.ozlabs.org/project/uboot/patch/20250902081932.21103-4-ziyao@disroot.org/)
- [Andes Voyager board support](https://patchwork.ozlabs.org/project/uboot/patch/20250807113807.361649-1-ycliang@andestech.com/)
- [SYS_BOOTM_LEN standardization](https://patchwork.ozlabs.org/project/uboot/patch/20250719214650.214931-2-sputnik@on-the-web.ch/)
- [T-Head C900 CLINT IPI support](https://patchwork.ozlabs.org/project/uboot/patch/20250606042804.64311-2-ziyao@disroot.org/)
- [Lichee Pi 4A S-mode conversion](https://patchwork.ozlabs.org/project/uboot/patch/20250530094851.57198-2-ziyao@disroot.org/)
- [booti/bootm riscv verification revert](https://patchwork.ozlabs.org/project/uboot/patch/20250529033052.399573-1-mchitale@ventanamicro.com/)
- [TH1520 SPL support](https://patchwork.ozlabs.org/project/uboot/patch/20250513090503.46670-4-ziyao@disroot.org/)
- [qemu-riscv* MAINTAINERS cleanup](https://patchwork.ozlabs.org/project/uboot/patch/20250420085929.36226-5-heinrich.schuchardt@canonical.com/)
- [P8700 SoC initial support, v7 1/7](https://patchwork.ozlabs.org/project/uboot/patch/20260417122213.147529-2-uros.stajic@htecgroup.com/)
- [P8700 Coherence Manager/IOCU, v7 7/7](https://patchwork.ozlabs.org/project/uboot/patch/20260417122213.147529-8-uros.stajic@htecgroup.com/)
- [MPFS FPGA design info, v3](https://patchwork.ozlabs.org/project/uboot/patch/20260827204538.16222-1-nwhitehorn@pa.msu.edu/)
- [SBI MPXY enablement](https://patchwork.ozlabs.org/project/uboot/patch/20260709175605.1070755-4-rahul.pathak@oss.qualcomm.com/)
- [Sophgo/Milk-V Duo DTS cleanup, v3 6/7](https://patchwork.ozlabs.org/project/uboot/patch/20260806-milkv-duo-upstream-dts-v3-6-917cf70a2337@zohomail.com/)
- [M-mode timer fix](https://patchwork.ozlabs.org/project/uboot/patch/20260904-riscv_fix_early_timer_mmode-v1-1-210e769b0ac2@maquefel.me/)
- [IPI init fix](https://patchwork.ozlabs.org/project/uboot/patch/20260904-fix_skipped_ipi_init-v1-1-3f4e7a10efe8@maquefel.me/)
- [MPFS CoreQSPI Kconfig fix](https://patchwork.ozlabs.org/project/uboot/patch/20260904131738.43312-1-pengpeng@iscas.ac.cn/)
- [NET boot device enum fix](https://patchwork.ozlabs.org/project/uboot/patch/20260904-riscv_add_net_boot_option-v1-1-125c3edbdb1a@maquefel.me/)
- [Ubuntu Bug #1980594 - KVM SRCU deadlock](https://bugs.launchpad.net/bugs/1980594)
- [Ubuntu Bug #1923162 - extlinux.conf crash](https://bugs.launchpad.net/ubuntu/+source/u-boot/+bug/1923162)
- [UEFI/ACPI RSDP regression thread](https://www.mail-archive.com/u-boot@lists.denx.de/msg541140.html)
- [CVE-2024-57256 advisory](https://github.com/advisories/GHSA-vmjq-93g5-fvqc)
- [CVE-2024-57254 through 57259 disclosure](https://seclists.org/oss-sec/2025/q1/143)
- [CVE-2025-24857 (not RISC-V, excluded as false lead)](https://www.cisa.gov/news-events/ics-advisories/icsa-25-343-01)
- [Ubuntu 26.04 "resolute" package search](https://packages.ubuntu.com/search?keywords=U-Boot&suite=resolute&searchon=names&section=all)
- [PyPI u-boot package check (404)](https://pypi.org/pypi/u-boot/json)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)
- [RISE Project - "Tested on Real Silicon: Automating RISC-V Hardware-in-the-Loop"](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE Project - "Advancing OpenSBI Interrupt Handling"](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE Project RP012 - Enabling Linux Kernel CI Testing on RISC-V Boards](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/349143042/Project+RP012+Enabling+Linux+Kernel+CI+Testing+on+RISC-V+Boards)
- [gitlab.com/riseproject/riscv-optee/u-boot](https://gitlab.com/riseproject/riscv-optee/u-boot)
- [github.com/riseproject-dev/riscv-runner](https://github.com/riseproject-dev/riscv-runner)
- [Codethink - Deep Dive into Upstream RISC-V Boot Chain](https://www.codethink.co.uk/articles/2026/deep-dive-into-upstream-risc-v-boot-chain.html)
- [tools/docker/Dockerfile (U-Boot CI image)](https://source.denx.de/u-boot/u-boot/-/raw/master/tools/docker/Dockerfile)
- [.gitlab-ci.yml (raw)](https://source.denx.de/u-boot/u-boot/-/raw/master/.gitlab-ci.yml)
- [riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain)