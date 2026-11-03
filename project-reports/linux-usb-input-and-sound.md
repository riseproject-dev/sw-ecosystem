---
title: Linux USB input and sound
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: U-Boot
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: test-dependency
    criticality: optional
  - name: bpftool
    relation: test-dependency
    criticality: optional
  - name: libbpf
    relation: test-dependency
    criticality: optional
  - name: elfutils
    relation: test-dependency
    criticality: optional
  - name: zlib
    relation: test-dependency
    criticality: optional
  - name: alsa-lib
    relation: test-dependency
    criticality: optional
  - name: alsa-utils
    relation: runtime-dependency
    criticality: optional
  - name: alsa-ucm-conf
    relation: runtime-dependency
    criticality: optional
  - name: alsa-topology-conf
    relation: runtime-dependency
    criticality: optional
  - name: libgpiod
    relation: runtime-dependency
    criticality: optional
  - name: libusb
    relation: runtime-dependency
    criticality: optional
  - name: usbutils
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-usb-input-and-sound" %}

# Linux USB input and sound

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux USB input and sound<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux USB input and sound is not a standalone package. It covers these parts of the mainline Linux kernel:

- the USB core and host/gadget controllers
- HID and the input/evdev core
- ALSA and ASoC sound
- USB audio (`snd-usb-audio`)
- Bluetooth transports

All of it is portable C. `arch/riscv/` has no USB, HID, input or sound files, and the subsystem has no `.S` files, JIT backend or SIMD dispatch. The RISC-V-relevant pieces are SoC glue drivers under `drivers/` and `sound/` for natively RISC-V hardware.

Governance:

- There is no project-level foundation. Patches go by mailing list to subsystem maintainers and then up to Linus Torvalds. The Linux Foundation hosts kernel.org infrastructure but does not govern these subsystems ([docs.kernel.org USB index](https://docs.kernel.org/usb/index.html)).
- The GPL-2.0 license is not stated on that page.
- RISC-V patch-acceptance rules (`Documentation/arch/riscv/patch-acceptance.rst`) apply to arch/riscv and extension patches. They do not apply to USB, input, HID or sound driver patches, which follow each subsystem's own list and tree ([patch-acceptance.rst](https://kernelsources.org/source/more/linux/Documentation/arch/riscv/patch-acceptance.rst?full=RISC)).

Maintainers, from `MAINTAINERS` in the kernel clone (HEAD `v7.4-rc1-132-g05441d697f7f`). Company attribution comes from email domains only.

| Area | Maintainer | Affiliation |
|---|---|---|
| USB core | Greg Kroah-Hartman | Linux Foundation (email domain) |
| xHCI | Mathias Nyman | Intel |
| USB gadget | Neill Kapron | Google |
| DWC3 | Thinh Nguyen | Synopsys |
| DWC2 | Minas Harutyunyan | Synopsys |
| MUSB | Bin Liu | TI |
| Cadence USB3 / USBHS / USBSSP | Peter Chen, Pawel Laszczak | Cadence |
| USB Type-C | Heikki Krogerus | Intel |
| HID | Jiri Kosina, Benjamin Tissoires | kernel.org addresses |
| Input | Dmitry Torokhov | gmail address |
| ALSA | Jaroslav Kysela, Takashi Iwai | perex.cz, suse.com |
| ASoC | Liam Girdwood, Mark Brown | gmail, kernel.org addresses |
| Bluetooth | Marcel Holtmann, Luiz Augusto von Dentz | independent addresses |

RISC-V vendor maintainers in `MAINTAINERS`:

- StarFive USB drivers: Minda Chen (starfivetech.com), status Maintained.
- StarFive JH7110 TDM: Walker Chen.
- StarFive JH7110 PWMDAC: Hal Feng and Xingyu Wu.
- SpacemiT K1/K3 I2S: Troy Mitchell (linux.spacemit.com), status Maintained.
- MUSB, which includes the PolarFire SoC driver, has no RISC-V-specific maintainer. The maintainer is Bin Liu (TI).

Community stance:

- No subsystem-level hostility or special gating was found. Vendors add drivers through the normal device-tree-binding plus driver route, on generic IP (Cadence, DWC3, MUSB, ASoC helpers).
- This conclusion rests on `MAINTAINERS` and commit history only. No mailing-list threads were read because lore.kernel.org was not accessible [NEEDS VERIFICATION].

## 2. Port History and Upstreaming Timeline

Dates are author dates from the kernel clone. All commits below are ancestors of HEAD, so all are merged. Committer dates are a few days to weeks later (for example `7a96b6ea90a4` was committed 2022-06-21). First release is from `git tag --contains`.

| Date | Event | Source |
|---|---|---|
| 2017-11-29 | `da8df83957b1` Input: joystick/analog - riscv has get_cycles(), Olof Johansson. A one-line build fix and the only core-input commit mentioning riscv. First tag v4.15. | kernel clone |
| 2022-06-13 | `7a96b6ea90a4` MUSB driver for Microchip PolarFire SoC, Conor Dooley (Microchip). v6.0. | kernel clone, [lore link in commit](https://lore.kernel.org/r/20220613114642.1615292-2-conor.dooley@microchip.com) |
| 2023-03-09 | `a20bf02aaa6c` mpfs MUSB Kconfig renamed to ARCH_MICROCHIP_POLARFIRE. v6.4. | kernel clone |
| 2023-05-18 | `bfb46b424652` Cadence USB3 glue for StarFive JH7110, Minda Chen. v6.5. | kernel clone, [lore link in commit](https://lore.kernel.org/r/20230518112750.57924-7-minda.chen@starfivetech.com) |
| 2023-05-26 | `fd4762b6b5cf` JH7110 TDM audio, Walker Chen. v6.5. | kernel clone |
| 2023-06-29 | `16d3a71c20cf` JH7110 USB 2.0 PHY, Minda Chen. `phy-jh7110-usb.c` first appears in v6.6. | kernel clone |
| 2023-08-14 | `d1802d59ab53` JH7110 PWM-DAC, Hal Feng. v6.7. | kernel clone |
| 2025-06-18 | `860295a6bbbb` DWC2 follows compatible-string change for Sophgo CV18XX/SG200X. v6.17. | kernel clone |
| 2025-09-13 | `e0b6dc00c701` generic DWC3 platform driver (flattened DT model), Ze Huang. v6.18. Later used by SpacemiT K1/K3. | kernel clone |
| 2025-10-17 | `fce217449075` SpacemiT K1 I2S, Troy Mitchell. v6.19. | kernel clone |
| 2025-11-12 | `e05d28b759c2` ESWIN EIC7700 DWC3 USB driver, Hang Cao. v6.19. | kernel clone |
| 2026-01-20 | `ea0fb91c02c1`, `4cf8752a03e6`, `b3eb755e2db0` Sophgo CV1800B I2S/TDM, ADC codec, DAC codec, Anton D. Stavinskii. v7.0. | kernel clone |
| 2026-03-20 | `c05cf9d274da` SpacemiT K3 in dwc3-generic-plat, Yixun Lan. v7.1. | kernel clone |
| 2026-03-26 | `764c2e6e60bf` optional VBUS regulator for SpacemiT K1 DWC3, Chukun Pan. v7.1. | kernel clone |
| 2026-04-10 | `87117347a0e7` StarFive JHB100 USB 2.0 DRD controller, Minda Chen. v7.1. | kernel clone |
| 2026-05-22 | `1c6ca2ca5c1b` SpacemiT I2S extended to K3, Troy Mitchell. v7.2. | kernel clone |
| 2026-10-01 | `d532e2f5c288` OF match data fix for DesignWare I2S on StarFive JH7110. v7.4-rc1. | kernel clone, [patch link](https://patch.msgid.link/20261001192552.2904-1-yuriz@vodafonemail.de) |

Notes:

- Commit `e4d7362dc9cd` (Cadence USBSSP platform driver, v7.2) is Cadence-generic. Its commit message does not mention RISC-V, so it is not counted as a RISC-V commit.
- Other SoC glue in the clone:
  - Sophgo CV18xx/SG200x USB2 PHY `phy-cv1800-usb2.c`, v6.18.
  - SpacemiT K1 USB2 PHY `phy-k1-usb2.c`, v7.0.
  - Sophgo CV1800B I2S/TDM, first kernel v7.0.
  - The first kernel for the CV1800B codec files was not checked.
- Commit `d532e2f5c288` is a bug fix. It addresses a regression from `9c97790a07dc`: JH7110 OF match data was never read, so VisionFive 2 HDMI audio failed with error -22. It was tested on a VisionFive 2 v1.3B (v7.0.3 with local HDMI audio patches). The non-DT path is build-tested only. The commit carries an "Assisted-by: LLM" tag.
- Key contributors by org: Microchip (Conor Dooley), StarFive (Minda Chen, Walker Chen, Hal Feng), SpacemiT (Troy Mitchell), ESWIN (Hang Cao). Sophgo work is by individual contributors (Inochi Amaoto, Anton D. Stavinskii).
- Upstream status: the SoC drivers are fully upstream. The generic USB, HID and ALSA code needed no port.
- Open and unmerged series on linux-riscv, linux-usb, linux-sound and linux-input could not be checked [NEEDS VERIFICATION].
- The earliest commit that made USB/ALSA drivers buildable on RISC-V was not found. Kconfig gating history is [NEEDS VERIFICATION].

## 3. Upstream Support Tier

- **Formal tier policy:** none exists for this subsystem. Data not available: no tier document was found in the clone or on docs.kernel.org.
- **In-tree CI:** the tree has no `.gitlab-ci*`, `.github/` or KernelCI files. The only CI-style file found tree-wide is `drivers/gpu/drm/ci/gitlab-ci.yml`, which belongs to DRM.
- **Release-blocking:** nothing in the tree ties USB, input or sound tests to riscv64.
- **Official binaries:** upstream publishes source tarballs only. riscv64 binaries come from distro kernel packages (Section 8).
- **External coverage:**
  - syzbot's `ci-qemu2-riscv64` exercised the USB/HID path and hit [WARNING in input_register_device](https://syzkaller.appspot.com/bug?extid=8e41bb0c055b209ebbf4).
  - Linaro and KernelCI archives show riscv64 baseline boots and LTP runs on qemu_riscv64. These do not run USB, ALSA or HID suites as far as could be found.
  - KernelCI and LKFT dashboards were blocked by Anubis, so their coverage is [NEEDS VERIFICATION].

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Subsystem code | arch-neutral C | arch-neutral C | arch-neutral C |
| Arch-specific USB/HID/ALSA code | none (see Section 4) | none | none |
| HID selftest config fragment | `config.x86_64` exists | Data not available | none |
| Generic KUnit QEMU runner | Data not available | Data not available | `tools/testing/kunit/qemu_configs/riscv.py` |
| syzbot | Data not available | arm32 hit the same syzbot bug | `ci-qemu2-riscv64` |
| Official upstream binaries | source only | source only | source only |

## 4. Technical Architecture and RISC-V-Specific Subsystems

There is no arch-specific optimised code (SIMD, assembly, JIT, crypto) for USB, input, HID or sound. The rating scale of hand-tuned, intrinsics, scalar or missing does not apply. x86 and arm64 have no such code for this subsystem either.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| USB core, HCDs (xHCI, EHCI, OHCI), UAS, storage, gadget/configfs | arch-neutral | arch-neutral | arch-neutral, enabled in `arch/riscv/configs/defconfig` |
| `snd-usb-audio`, ALSA core | arch-neutral | arch-neutral | arch-neutral. `defconfig` sets `SND=y` and `SND_SOC=y`; `SND_USB_AUDIO` not seen in the first 60 lines viewed |
| HID, evdev, input core | arch-neutral | arch-neutral | arch-neutral. `defconfig` sets `INPUT_EVDEV`, `INPUT_MOUSEDEV`, `VIRTIO_INPUT` |
| Bluetooth | arch-neutral | arch-neutral | arch-neutral. Not in `defconfig`; distro kernels carry it |
| SoC USB glue | n/a | n/a | real upstream drivers (below) |
| SoC audio | n/a | n/a | real upstream drivers (below) |
| SIMD/assembly paths | none | none | none |

RISC-V SoC drivers in `defconfig`:

- USB: `USB_CDNS3` with the StarFive glue, `USB_MUSB_HDRC` with Sunxi, and `PHY_STARFIVE_JH7110_USB`.
- Sound: `SND_DESIGNWARE_I2S`, `SND_SOC_JH7110_PWMDAC`, `SND_SOC_JH7110_TDM`, `SND_SOC_WM8978` and `SND_SIMPLE_CARD`.
- `USB_DWC2` and `USB_DWC3` are not in the `defconfig`. Only `defconfig` entries for JH7110 and Sunxi were checked; whether SpacemiT or Sophgo audio is in `defconfig` was not checked.

Supporting arch code that these drivers use unchanged: `RISCV_DMA_NONCOHERENT` with `ARCH_HAS_SYNC_DMA_FOR_CPU` and `ARCH_HAS_SYNC_DMA_FOR_DEVICE`, `dma-noncoherent.c`, `cache-ops.c` and the I/O headers. Non-coherent DMA matters for xHCI and USB audio buffers on SoCs without coherent DMA. The behaviour of riscv cache management itself was not verified.

## 5. Build System, Cross-Compilation, and Toolchain

Linux builds with Kbuild (`make` plus Kconfig). There is no cmake or configure step, and no `-DUSE_X=OFF` flags. The tree has no Dockerfile or Containerfile.

GNU cross toolchain:

```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```

LLVM:

```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules dtbs
```

- The boot image is `arch/riscv/boot/Image`.
- `Documentation/kbuild/llvm.rst` marks riscv as "Supported" with `LLVM=1`.
- Fragment configs are `32-bit.config`, `64-bit.config` and `hardening.config`.
- Other defconfigs are `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig` and `nommu_virt_defconfig`.

Toolchain minimums, from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`. riscv64 has no per-arch override.

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1 | Raised for all architectures in `118c40b7b503` (2025-03-28, v6.16). |
| binutils | 2.30 | Lowest version used with gcc-8 on common distros. |
| Clang/LLVM | 17.0.1 | Raised by `ce3267a39a92` (2026-05-17, v7.2-rc1) from 15.0.0, because of an `asm goto` scope-checker bug fixed in LLVM 17. |
| Rust (optional) | rustc 1.85.0, bindgen 0.71.1 | riscv64 and Clang only. |
| GNU make | 4.0 | `changes.rst`. |
| bash / Python / flex / bison / pahole / openssl | 4.2 / 3.9.x / 2.5.35 / 2.0 / 1.26 / 1.0.0 | `changes.rst`. |

RISC-V-specific toolchain conditions in `arch/riscv/Kconfig`:

- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI`: applies for GNU as 2.36 or newer. binutils 2.38 and GCC 12.1 moved some instructions into Zicsr and Zifencei.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC`: applies for GCC older than 11.3.0.
- Vector needs `ld` 2.38 or newer, or lld. Zba, Zbb, Zbc and Zbkb need `ld` 2.39 or newer, or lld.
- DWARF5 is marked broken for LLVM `as` and lld older than 18.
- Kconfig auto-disables unsupported features. To disable manually, use `scripts/config -d RISCV_ISA_V`, `-d RUST`, `-d RISCV_ISA_C` or `-d FPU`.

QEMU:

```
./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-
```

- This needs `/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin` and runs `qemu-system-riscv64 -machine virt -cpu rv64` under OpenSBI. The runner adds only serial and SBI console Kconfig options.
- The USB, input and sound `.kunitconfig` suites could run through it. No in-tree file ties them to riscv.
- A manual USB and sound test on `virt` would add `-device qemu-xhci -device usb-kbd -device usb-tablet` and `-device virtio-sound-pci`. These options are not documented in the kernel tree [NEEDS VERIFICATION].
- Boot contract (`Documentation/arch/riscv/boot.rst`): `a0` holds the hartid, `a1` the DTB address, `satp = 0`, and the kernel sits on a 2 MB boundary for rv64.

Known build failures specific to this subsystem: none found. Data not available: build logs from distro or CI were not inspected.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| USB host (xHCI/EHCI/OHCI) and gadget | arch-neutral | arch-neutral | available; enabled in `defconfig` |
| USB audio class | arch-neutral | arch-neutral | available as code; not in `defconfig` (see below) |
| HID, evdev | arch-neutral | arch-neutral | available as code; HID options in `defconfig` unclear [NEEDS VERIFICATION] |
| SoC audio (I2S/TDM/PWM-DAC) | n/a | n/a | JH7110, SpacemiT K1/K3, Sophgo CV1800B |
| Bluetooth | arch-neutral | arch-neutral | available; distro kernels only |

- **Functional gaps:** no generic functional gap in the kernel code was found. The practical gaps are in configuration.
  - riscv `defconfig` has no `SND_USB_AUDIO`, I2C-HID or Bluetooth line. Whether USB HID is enabled by default is [NEEDS VERIFICATION] against Kconfig defaults.
  - A VisionFive 2 forum thread (May 2023, StarFive vendor kernel) shows `snd-usb-audio.ko` missing because only `CONFIG_SOUND=y` was enabled. `CONFIG_BT_HIDP=y` reportedly worked. This is a vendor-kernel config gap, not a mainline bug ([forum thread](https://forum.rvspace.org/t/open-source-speech-recognition-on-visionfive-2-with-next-gen-kaldi/2866)). It is a single source [NEEDS VERIFICATION].
- **Performance gaps:** Data not available. No benchmark for USB input, USB audio, USB throughput or ALSA/ASoC on riscv64 was found. This covers latency, xrun rate, throughput and CPU load. There is no SIMD delta, because the subsystem has no SIMD code.
  - One anecdote from a 2023 Star64 hands-on report measured USB2 transfers at about 70% of rates on other Linux systems ([blog.fluxcoil.net](https://blog.fluxcoil.net/posts/2023/05/star64-first-look)). It has no controlled methodology and is a single source [NEEDS VERIFICATION].
- **Security hardening gaps:** Data not available. `arch/riscv/configs/hardening.config` exists, but no USB, input or sound-specific hardening gap was searched for.
- **NaN / floating-point semantics:** not applicable. No floating-point code paths in scope were identified.

## 7. CI/CD Infrastructure

What exists, from the kernel clone and web checks:

- **In-tree CI configs:** none for this subsystem.
- **HID selftests** (`tools/testing/selftests/hid/`): arch-specific config is `config.x86_64` only. There is no riscv config. The Makefile's only riscv reference is a BPF-compile workaround defining `__riscv_xlen`.
- **ALSA selftests** (`tools/testing/selftests/alsa/`): aloop-test, mixer-test, pcm-test, test-pcmtest-driver and utimer-test. No arch condition. They run on riscv64 only if someone builds and runs kselftest there, and no such automation was found.
- **USB selftest:** `drivers/usb/usbip/usbip_test.sh`, a script with no arch config.
- **KUnit suites:** `drivers/hid/.kunitconfig`, `drivers/input/tests/.kunitconfig` and `sound/core/.kunitconfig` are arch-neutral. A generic riscv64 QEMU KUnit runner exists but it is a tool, not a CI job.
- **riscv selftests:** `tools/testing/selftests/riscv/` has abi, cfi, hwprobe, mm, sigreturn and vector. None covers USB, input or sound.
- **External:**
  - syzbot ran QEMU riscv-virtio on kernel 6.8.0-rc1-syzkaller.
  - KernelCI and Linaro archives show riscv64 baseline boots and LTP on qemu_riscv64, from CIP and stable/mainline trees.
  - KernelCI, LKFT, 0-day and further syzbot coverage are [NEEDS VERIFICATION]. The dashboards were blocked by Anubis, and 0-day was not checked.
- **RISE runners:** announced 2026-03-24 ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) and reviewed 2026-05-12 ([six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). Neither post was read, so use by kernel USB or sound CI is unknown.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree subsystem CI | none found | none found | none found |
| HID selftest config | `config.x86_64` | Data not available | none |
| Generic QEMU KUnit runner | Data not available | Data not available | present |
| syzbot | Data not available | arm32 crash seen | `ci-qemu2-riscv64` |
| KernelCI / LKFT | Data not available | Data not available | [NEEDS VERIFICATION] |

## 8. Distribution and Release Status

- **Upstream binaries:** none. Source tarballs only. kernel.org lists mainline 7.4-rc1 (2026-11-01), stable 7.3.1 (2026-10-30) and 7.2.15 (2026-11-01). Longterm series are 6.18.60, 6.12.115, 6.6.161, 6.1.191, 5.15.224 and 5.10.273 ([releases.json](https://www.kernel.org/releases.json)).
- **PyPI, RISE wheel builder, npm, Maven, OCI:** not applicable. `linux-usb-input-and-sound` returns HTTP 404 on PyPI, and the RISE wheel-builder index redirects to the same 404. No RISE wheels exist.
- **Ubuntu 26.04 (resolute) riscv64:** `linux-image-generic` 7.0.0-14.14.2 and `linux-libc-dev` 7.0.0-14.14 ([linux-image-generic](https://packages.ubuntu.com/resolute/linux-image-generic)). No package named "Linux USB input and sound" exists.
- **Debian:** riscv64 `usb-modules` and `input-modules` installer packages exist, for example [usb-modules-6.12.43+deb13-riscv64-di](https://packages.debian.org/trixie/usb-modules-6.12.43+deb13-riscv64-di). This pass did not re-fetch the page [NEEDS VERIFICATION].
- **Debian merge request** [!1821](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821) "riscv64 config update for linux 6.19":
  - It was requested 2026-02-14 by Han Gao.
  - Its relevant diff line is `+CONFIG_SND_SOC_K1_I2S=m`.
  - It changes no USB, HID, input, Bluetooth, DWC, MUSB, Cadence, StarFive or ESWIN options.
  - Its merge state is [NEEDS VERIFICATION].
- **Ubuntu config:** Ubuntu annotated `CONFIG_USB_MUSB_POLARFIRE_SOC=m` for riscv64 in 2022-08 ([kernel-team post](https://lists.ubuntu.com/archives/kernel-team/2022-August/132903.html)). This was not re-fetched [NEEDS VERIFICATION].
- **Arch Linux RISC-V:** the search listed no package for this name and showed only the main `linux` kernel package.
- **Yocto:** Yocto enabled xHCI in the qemu riscv kernel config (linux-yocto/6.6, Bruce Ashfield, 2024-03-19, state Accepted). The xHCI fragment is not visible in the patch ([patch](https://patchwork.yoctoproject.org/project/oe-core/patch/256057efd94b6d4ddd95ef77aadf4c37a453dcde.1710888915.git.bruce.ashfield@gmail.com/)).
- **Fedora:** Data not available. Fedora was not searched.

What a user must do: install a distro riscv64 kernel (Ubuntu 26.04 or Debian), or build the mainline kernel with the commands in Section 5. On boards with vendor kernels, such as the StarFive VisionFive 2 vendor kernel, extra options like `snd-usb-audio` may need to be enabled and the kernel rebuilt.

## 9. Dependencies

Ubuntu 26.04 (resolute) riscv64 package-index checks stand in for the package-graph query, which was not run. "Packaged" means a riscv64 package is published; it is not a test result. Build and test status were not inspected for these packages.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime-dependency, critical) | hosts USB, HID, evdev, ALSA | builds; mainline RISC-V since 4.15 | riscv64 CI for this subsystem [NEEDS VERIFICATION]; syzbot riscv64 seen | Ubuntu 26.04 `linux-image-generic` 7.0.0-14.14.2 | kernel.org maintainer-tree model; no project-reports entry |
| OpenSBI (runtime-dependency, critical) | M-mode firmware (SBI) | builds | see project report | `opensbi` 1.8.1-1 (arch all) in Ubuntu | [report](project-reports/opensbi.md) |
| U-Boot (runtime-dependency, optional) | bootloader; USB boot and keyboard in firmware | builds | see project report | `u-boot-sifive` 2025.10-0ubuntu2 | [report](project-reports/u-boot.md) |
| GCC (build-dependency, critical) | kernel compiler | kernel minimum 8.1 | Data not available | Data not available: GCC package status was not searched | Data not available |
| GNU make (build-dependency, critical) | Kbuild driver | kernel minimum 4.0 | Data not available | Data not available: package status was not searched | Data not available |
| LLVM (test-dependency, optional) | clang is needed by `selftests/hid`; also an alternative kernel compiler (`LLVM=1`) | kernel minimum 17.0.1; riscv marked Supported in `llvm.rst` | Data not available | Data not available: package status was not searched | Data not available |
| bpftool (test-dependency, optional) | needed by `selftests/hid` | Data not available: bpftool was not found in the Ubuntu index checks | Data not available | Data not available | Data not available |
| libbpf (test-dependency, optional) | needed by `selftests/hid` | builds | see project report | `libbpf1`, `libbpf-dev` 1:1.6.3-1ubuntu1 (main) | [report](project-reports/libbpf.md) |
| elfutils (test-dependency, optional) | libelf, needed by `selftests/hid` | builds | see project report | `libelf1t64`, `libelf-dev` 0.194-4 (main) | [report](project-reports/elfutils.md) |
| zlib (test-dependency, optional) | needed by `selftests/hid` | pure C, builds | see project report | `zlib1g-dev` 1:1.3.dfsg+really1.3.1-1ubuntu3 (main) | [report](project-reports/zlib.md) |
| alsa-lib (test-dependency, optional) | `libasound2`; needed by `selftests/alsa` | packaged [NEEDS VERIFICATION] | not verified | `libasound2-dev`, `libasound2t64` 1.2.15.3-1ubuntu1 (main) | not in `projects.yml` |
| alsa-utils (runtime-dependency, optional) | mixer and playback tools | packaged | not verified | `alsa-utils` 1.2.15.2-1ubuntu1 (riscv64) | not in `projects.yml` |
| alsa-ucm-conf (runtime-dependency, optional) | UCM profiles for SoC codecs | packaged | not verified | 1.2.15.3-1ubuntu1 (all); UCM profile coverage for RISC-V boards [NEEDS VERIFICATION] | not in `projects.yml` |
| alsa-topology-conf (runtime-dependency, optional) | topology configs | packaged | not verified | 1.2.5.1-3build1 (all) | not in `projects.yml` |
| libgpiod (runtime-dependency, optional) | GPIO userspace, board enablement | packaged | not verified | `libgpiod3`, `libgpiod-dev`, `gpiod` 2.2.1-3build1 (universe only); `libgpiod2` not found | in `projects.yml` (line 2765); no report file |
| libusb (runtime-dependency, optional) | USB userspace library | packaged | not verified | `libusb-1.0-0`, `libusb-1.0-0-dev` 2:1.0.29-2build1 (main) | in `projects.yml` (line 3020); no report file |
| usbutils (runtime-dependency, optional) | `lsusb` | packaged | not verified | `usbutils` 1:019-1 (main) | not in `projects.yml` |

Deep-dive:

- **Kernel-side dependencies** (Kconfig): `USB` depends on `USB_ARCH_HAS_HCD`. `SND_USB_AUDIO` selects `SND_HWDEP`, `SND_RAWMIDI`, `SND_PCM`, `BITREVERSE`, and `SND_UMP` if MIDI v2 is enabled. `HID` depends on `INPUT`.
- **Test dependencies:**
  - `selftests/alsa` needs `pkg-config alsa`, with a `-lasound` fallback, and pthread.
  - `selftests/hid` needs libbpf, bpftool, libelf, zlib, librt and clang.
- **Wider userspace** (packaged on Ubuntu 26.04 riscv64, none tested):
  - glibc 2.43-2ubuntu2, with a [project report](project-reports/glibc.md).
  - systemd udev 259.5-0ubuntu3.
  - BlueZ 5.85-4.
  - PipeWire and WirePlumber 1.6.2-1ubuntu1 and 0.5.13-1ubuntu1.
  - libevdev 1.13.6+dfsg-1, libinput 1.31.1-1 and hidapi 0.15.0-2 (universe).
  - SDL2 2.32.10+dfsg-6, libsndfile 1.2.2-4, PulseAudio (`libpulse0` in main, daemon in universe).
  - i2c-tools and libiio (universe).
- **Gaps in this data:**
  - Test columns are "not verified" for most rows.
  - Report files exist for opensbi, u-boot, libbpf, elfutils, zlib and glibc.
  - No report files exist for libgpiod, libusb, hidapi, systemd, SDL2 and libsndfile.
  - The Linux kernel is in `projects.yml` (line 3152) but has no project-reports file.
- No JIT, SIMD or crypto dependencies apply to this subsystem.

## 11. Known Bugs and Active Issues

No upstream bugzilla or master tracking issue exists for riscv64 USB input and sound. Only the following riscv64 bugs were found.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Launchpad 2038920](https://bugs.launchpad.net/bugs/2038920) | Nezha D1: usb 1-1: device descriptor read/64, error -71 | Confirmed, unassigned, 2 affected users | Low | Allwinner D1, Ubuntu 23.10 `linux-image-6.5.0-9-generic`. Errors -71 and -62 on enumeration; a USB keyboard works after replug. Reported 2023-10-10, no root cause or fix. The page footer shows linux-riscv 7.3.0-10.10.1 uploaded 2026-10-22, but current behaviour is [NEEDS VERIFICATION]. |
| [Launchpad 2018657](https://bugs.launchpad.net/ubuntu/+source/linux-allwinner/+bug/2018657) | Sound output fails | Confirmed, unassigned, 2 affected users | Undecided | LicheeRV Dock (Allwinner D1), `linux-image-5.19.0-1009-allwinner`. `aplay -l` lists sun20i-codec, but playback fails with EIO on `SNDRV_PCM_IOCTL_WRITEI_FRAMES`. Reported 2023-05-06. No fix recorded. |
| [syzbot 8e41bb0c055b209ebbf4](https://syzkaller.appspot.com/bug?extid=8e41bb0c055b209ebbf4) | WARNING in input_register_device (2) | Auto-obsoleted 2024-12-02; not marked fixed | Warning | QEMU riscv-virtio, 6.8.0-rc1-syzkaller. WARNING at `lib/kobject_uevent.c:671` via `usbhid_probe` and `hidinput_connect`, with `ms_probe` (hid-microsoft) in the path. 5 crashes between 2024-02-06 and 2024-03-03, 4 on riscv64 and 1 on arm32. Report: [lkml](https://lkml.iu.edu/hypermail/linux/kernel/2402.0/08893.html). |

Notes:

- Both Launchpad bugs are on out-of-tree Allwinner D1 vendor-derived Ubuntu kernels (5.19 allwinner and 6.5 generic). Neither was rechecked on mainline.
- The syzbot crash is in generic HID/USB code and also hit arm32, so it is probably not RISC-V-specific. A patch-test request from 2024-02-08 using upstream commit 047371968ffc ... returned OK, and later retests mostly showed no crash. No commit is linked to closing it.
- **Correctness bugs:** the fixed JH7110 I2S match-data regression (`d532e2f5c288`, v7.4-rc1) is the only correctness bug found on a mainline RISC-V SoC driver.
- **Not covered** [NEEDS VERIFICATION]: bugs for JH7110 DWC2/DWC3/xHCI, SpacemiT K1 USB, TH1520, SG2042, Bluetooth and I2S audio on other SoCs.

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. No subsystem-level hostility toward RISC-V drivers was seen in `MAINTAINERS` or commit history. Mailing-list threads were not read.
- **Technical blockers:** none found in the kernel code. The subsystem is arch-neutral.
- **Organizational blockers:** none identified. The vendors maintain their own drivers, and there is no central RISC-V group for peripherals. Coverage therefore tracks individual vendor effort.
- **Open series:** lore.kernel.org was not accessible, so open series on linux-riscv, linux-usb and linux-sound are [NEEDS VERIFICATION].
- **Acceptance probability:** Data not available. This is not assessed beyond the 16 mainline driver commits in Section 2, which were all accepted through the normal route.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

Justification: the subsystem is portable C with no riscv-specific USB core, HID, input or ALSA code. Upstream kernel CI builds and boots it on riscv64, and syzbot's ci-qemu2-riscv64 exercised the USB/HID path ([syzbot WARNING in input_register_device](https://syzkaller.appspot.com/bug?extid=8e41bb0c055b209ebbf4)). No riscv64 run of the HID/ALSA/USB selftests or KUnit suites was found, and the in-tree HID selftest config has an x86_64 fragment only. Upstream publishes only source tarballs, so riscv64 binaries come from Debian and Ubuntu kernel packages ([Ubuntu 26.04 linux-image-generic 7.0.0-14](https://packages.ubuntu.com/resolute/linux-image-generic)). SoC glue drivers for StarFive, Microchip, SpacemiT, Sophgo and ESWIN are mainline and vendor-maintained.

Pending work that could change the grade:

- KernelCI, LKFT and 0-day riscv64 coverage could not be read (the dashboard was not accessible), and lore.kernel.org was not accessible, so open linux-riscv, linux-usb and linux-sound series are [NEEDS VERIFICATION].
- If KernelCI or LKFT run the ALSA/HID selftests or KUnit suites on riscv64, the grade could move to blue.
- No RISE funding was found for this subsystem.
- Debian riscv64 config [MR 1821](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821) enables SND_SOC_K1_I2S. Its merge state is [NEEDS VERIFICATION].
- Known open riscv64 bugs are Launchpad 2038920 and 2018657, both on Allwinner D1 vendor-derived Ubuntu kernels and not rechecked on mainline.

## 14. Investment Analysis

RISE check first: no RISE blog post, riseproject-dev repo, runner usage or funded work (RP-numbered or otherwise) tied to USB, input/HID, Bluetooth or ALSA/ASoC was found. Evidence:

- The sitemap lists 38 posts from 2024-05-15 to 2026-10-30, and none concerns this subsystem.
- The only audio post is userspace: [SpeexDSP RVV optimizations](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/) (RP020, 40,000 EUR award). It reported speedups on the SpacemiT K1 of 3.71x (Clang 18) and 3.59x (GCC 13) for the float resampler. The fixed-point resampler gained 2.69x and 4.88x. These come from a fetch-tool summary of the post.
- RISE members include SpacemiT, Microchip, ESWIN, Canonical and Google, which overlap with the SoC driver vendors above.

All effort figures below are rough engineering estimates for planning, not figures from the research. They carry no source.

### 14.1 Functional Enablement

- The kernel code needs no functional port.
- Verify that distro riscv64 kernel configs enable USB HID, `SND_USB_AUDIO`, I2C-HID and Bluetooth. Compare Debian and Ubuntu configs against the SoC set of interest.
- Check the mainline state of the two D1 bugs and the Debian MR 1821 merge state.
- Read lore.kernel.org from an unblocked network to settle the open-series gap.
- Check UCM profile coverage for RISC-V boards in alsa-ucm-conf.

### 14.2 Performance Optimization

- No SIMD or assembly work applies to this subsystem.
- Gap: no riscv64 baseline exists for USB throughput or audio latency. A measurement campaign on target silicon, with USB-audio xrun and round-trip latency and USB mass-storage throughput, would fill it.
- Non-coherent DMA and cache-management behaviour on USB and audio buffers was not verified, and is the most plausible source of platform-specific issues.

### 14.3 CI/CD Infrastructure

- Run the HID, input and ALSA-core KUnit suites on riscv64 through the existing `qemu_configs/riscv.py` runner.
- Build the ALSA and HID selftests for riscv64 and run them under QEMU `virt` with xHCI and virtio-sound devices.
- Add a riscv `config` fragment for the HID selftests, which currently have `config.x86_64` only.
- Confirm or request riscv64 coverage in KernelCI and LKFT. Consider the RISE runners or the hardware-in-the-loop work ([post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/), not read) for real-silicon USB and audio tests.

### 14.4 Ecosystem Enablement

- Section 10 is omitted because the subsystem has no dependent package ecosystem.
- Userspace packages (libgpiod, hidapi, SDL2, libsndfile) already have riscv64 builds in Ubuntu 26.04. The gap is test evidence and project reports, not builds.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Audit Debian/Ubuntu riscv64 configs for USB HID, snd-usb-audio, I2C-HID, Bluetooth, SoC audio | 2 | Distro kernel maintainers / our team | High |
| Functional | Recheck D1 bugs 2038920 and 2018657 on mainline; resolve Debian MR 1821 state | 2 | our team | Medium |
| Functional | Read open linux-riscv/linux-usb/linux-sound series from an unblocked network | 1 | our team | Medium |
| Performance | USB and ALSA baseline measurement on target riscv64 silicon | 4 | our team | Medium |
| CI/CD | Run HID, input, ALSA-core KUnit on riscv64 QEMU in CI | 2 | our team | High |
| CI/CD | Build and run ALSA and HID selftests on riscv64; add riscv HID config fragment | 4 | our team with kselftest maintainers | High |
| CI/CD | Obtain KernelCI/LKFT riscv64 coverage data; add hardware-in-the-loop USB/audio job | 4 | our team with KernelCI/RISE | Medium |
| Ecosystem | Add project reports for libgpiod, libusb, hidapi, SDL2, libsndfile | 2 | our team | Low |

## 15. References

- [docs.kernel.org USB index](https://docs.kernel.org/usb/index.html)
- [Linux kernel repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (read through a local clone at HEAD 05441d697f7f)
- [kernel.org releases.json](https://www.kernel.org/releases.json)
- [RISC-V patch acceptance](https://kernelsources.org/source/more/linux/Documentation/arch/riscv/patch-acceptance.rst?full=RISC)
- [Ubuntu 26.04 linux-image-generic](https://packages.ubuntu.com/resolute/linux-image-generic)
- [Debian usb-modules riscv64](https://packages.debian.org/trixie/usb-modules-6.12.43+deb13-riscv64-di)
- [Debian riscv64 config MR 1821](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821)
- [Ubuntu MUSB PolarFire annotation](https://lists.ubuntu.com/archives/kernel-team/2022-August/132903.html)
- [Yocto "riscv: Enable XHCI usb" patch](https://patchwork.yoctoproject.org/project/oe-core/patch/256057efd94b6d4ddd95ef77aadf4c37a453dcde.1710888915.git.bruce.ashfield@gmail.com/)
- [VisionFive 2 forum thread](https://forum.rvspace.org/t/open-source-speech-recognition-on-visionfive-2-with-next-gen-kaldi/2866)
- [Launchpad bug 2038920](https://bugs.launchpad.net/bugs/2038920)
- [Launchpad bug 2018657](https://bugs.launchpad.net/ubuntu/+source/linux-allwinner/+bug/2018657)
- [syzbot WARNING in input_register_device](https://syzkaller.appspot.com/bug?extid=8e41bb0c055b209ebbf4)
- [syzbot report on lkml](https://lkml.iu.edu/hypermail/linux/kernel/2402.0/08893.html)
- [Star64 first look](https://blog.fluxcoil.net/posts/2023/05/star64-first-look)
- [RISE SpeexDSP RVV post](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/)
- [RISE RISC-V runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE hardware-in-the-loop](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE Project](https://riseproject.dev)
- [lore link, MUSB PolarFire](https://lore.kernel.org/r/20220613114642.1615292-2-conor.dooley@microchip.com)
- [lore link, StarFive cdns3](https://lore.kernel.org/r/20230518112750.57924-7-minda.chen@starfivetech.com)
- [Patch link, JH7110 I2S match data fix](https://patch.msgid.link/20261001192552.2904-1-yuriz@vodafonemail.de)