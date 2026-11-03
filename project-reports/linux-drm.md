---
title: Linux DRM
parent: Project Reports
color: orange
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: libdrm
    relation: runtime-dependency
    criticality: critical
  - name: Mesa
    relation: runtime-dependency
    criticality: critical
  - name: linux-firmware
    relation: runtime-dependency
    criticality: optional
  - name: IGT GPU Tools
    relation: test-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-drm" %}

# Linux DRM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux DRM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

Evidence base. Commit facts come from a read-only clone of the [Linux kernel tree](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) at HEAD 05441d697f7f (v7.4-rc1-132, 2026-11-03), using `git log`, `git show` and `git tag --contains`. Mailing-list archives (lore.kernel.org, patchwork.kernel.org) were not reviewed, so anything that depends on them is unverified.

## 1. Project Overview

Linux DRM (Direct Rendering Manager, with KMS) is the kernel subsystem under `drivers/gpu/drm`, with headers in `include/drm` and documentation in [docs.kernel.org/gpu](https://docs.kernel.org/gpu/index.html). It is not a standalone package. Nothing named "linux-drm" exists on PyPI or in the Ubuntu 26.04 package name search. The shippable riscv64 artifacts are the distro kernel (DRM is built into it) and the userspace libdrm and Mesa packages.

**Governance.**
- DRM has no foundation of its own and its docs state no foundation membership. Hosting of the kernel by the Linux Foundation is general knowledge not stated on the docs page [NEEDS VERIFICATION].
- Governance is maintainer-based, through git trees on gitlab.freedesktop.org. MAINTAINERS lists the tree `https://gitlab.freedesktop.org/drm/kernel.git`, the list dri-devel@lists.freedesktop.org and the IRC channel #dri-devel on OFTC.
- The [DRM Maintainer Tools](https://maintainer-tools-rgallaispoustm-68a7c03928f3408583bf11b078a25b0.pages.freedesktop.org/) docs describe the drm, drm-misc, drm-intel and drm-xe repositories feeding the integration tree drm-tip.
- Maintainers change through MAINTAINERS patches on the mailing lists.
- The docs index does not state a license. DRM is generally GPL-2.0 with MIT-style licensing on parts of the core and uAPI; check per-file SPDX headers [NEEDS VERIFICATION].

**Maintainers and sponsoring companies (from MAINTAINERS).**

| Area | Maintainers | Company |
|---|---|---|
| DRM core | David Airlie, Simona Vetter | Personal addresses; company not shown |
| drm-misc | Maarten Lankhorst, Maxime Ripard, Thomas Zimmermann | Intel, SUSE; Ripard's affiliation not shown |
| Rust DRM (nova, tyr) | Danilo Krummrich, Alice Ryhl | Google (Ryhl) |
| amdgpu / radeon | Alex Deucher, Christian Koenig | AMD |
| AMD Display Core | Harry Wentland, Leo Li; Rodrigo Siqueira (reviewer) | AMD, Igalia |
| nouveau | Lyude Paul, Danilo Krummrich | Red Hat |
| i915 and Xe | Jani Nikula, Joonas Lahtinen, Rodrigo Vivi, Tvrtko Ursulin; Matthew Brost, Thomas Hellstrom | Intel |
| panfrost / panthor | Boris Brezillon, Adrian Larumbe, Steven Price, Liviu Dudau, Rob Herring | Collabora, Arm |
| PowerVR (imagination) | Alessio Belle, Luigi Santivetti | Imagination Technologies |
| etnaviv | Lucas Stach (reviewers Russell King, Christian Gmeiner) | Pengutronix |
| VeriSilicon display controller | Icenowy Zheng | ISCAS |

- Support status in MAINTAINERS is "Supported" for panfrost, panthor, PowerVR, i915, Xe, amdgpu and nouveau, and "Maintained" for the core, drm-misc and the VeriSilicon display driver.
- No MAINTAINERS entry is RISC-V-specific. The only RISC-V-adjacent maintainer is Icenowy Zheng (ISCAS).

**Community stance on new ports.**
- DRM has no architecture tier policy and no list of supported architectures. Support is per driver, through Kconfig `depends on` lines.
- RISC-V enablement has arrived as small patches from SoC-vendor and SiFive-affiliated contributors. These remove x86/ARM-only gates, fix compiler issues and add drivers for RISC-V SoC display and GPU IP.
- DRM maintainers have not published a stance on new architectures. New hardware is welcomed when its driver follows the normal rules: dri-devel review, an open userspace such as Mesa, and drm-misc merge. The formal open-userspace requirement was not read from the docs [NEEDS VERIFICATION].
- The review record in commit trailers shows AMD maintainers (Deucher, Koenig, Wentland, Kuehling) acking or reviewing RISC-V changes, and SUSE and Imagination maintainers committing RISC-V driver work.

## 2. Port History and Upstreaming Timeline

The riscv64 port has been mainline since Linux 4.15 (stated in the shared research brief). DRM has no port of its own. The timeline is the sequence of RISC-V enablement commits below. Dates are commit author dates; "First release" is the first kernel tag containing the commit.

| Date | Event | Source |
|---|---|---|
| 2021-10-12 | Heinrich Schuchardt (Canonical) proposes enabling DRM_NOUVEAU in the riscv defconfig. Outcome unknown [NEEDS VERIFICATION]. | [LKML](https://lkml.iu.edu/hypermail/linux/kernel/2110.3/04544.html), [Patchwork](https://patchwork.kernel.org/project/linux-riscv/patch/20211012164658.81894-1-heinrich.schuchardt@canonical.com/) |
| 2022-04-24 | 7d57f7f79756 "drm/sun4i: Allow building the driver on RISC-V" (Samuel Holland), v5.19. First RISC-V-specific DRM commit found in the log. | Kernel clone |
| 2023-07-17 | 6f7cd0371ea7 "drm/amd/display: Allow building DC with clang on RISC-V" (Samuel Holland, SiFive), v6.6 [NEEDS VERIFICATION: single source] | Kernel clone |
| 2023-11-22 | PowerVR driver added by Sarah Walker (Imagination); skeleton commit 4babef070865 first in v6.8 | Kernel clone |
| 2024-03-29 | 77acc6b55ae4 "riscv: add support for kernel-mode FPU" and a28e4b672f04 "drm/amd/display: use ARCH_HAS_KERNEL_FPU_SUPPORT" (Samuel Holland, SiFive), v6.10. Enables DRM_AMD_DC_FP on riscv64. | Kernel clone |
| 2024-06-14 | 301daa346f0e disables DRM_AMD_DC_FP for RISC-V with clang (Nathan Chancellor), v6.10 (first in v6.10-rc5) | Kernel clone |
| 2025-04-10 | 171f378d2a23 PowerVR RISC-V firmware processor support (Sarah Walker, Imagination), v6.16. This is the GPU's embedded RISC-V core, not host riscv64 support. | Kernel clone |
| 2025-05-29 | 4e696906e9a8 "drm/amdkfd: enable kfd on RISCV systems" (Xuemei Liu, ZTE), v6.16 | Kernel clone |
| 2025-08-22 | e38e8391f30b (TH1520 pwrseq), 337ebfda8a4f (TH1520 binding), 6b53cf48d933 (PowerVR on RISC-V) (Michal Wilczynski, Samsung), v6.18 | Kernel clone |
| 2025-08 | RFC on linux-riscv for VeriSilicon driver maintainer assignment | [linux-riscv archive](https://lists.infradead.org/pipermail/linux-riscv/2025-August/075654.html) |
| 2025-10-20 | 4f9ffd2c80a2 "drm/ttm: add pgprot handling for RISC-V" (Icenowy Zheng), v6.19 | Kernel clone |
| 2026-01-29 | 5f6965fa1e2e (binding), dbf21777caa8 (VeriSilicon DC driver), 96f30ee0fb9d (TH1520 HDMI bridge) (Icenowy Zheng), v7.1 | Kernel clone |
| 2026-03-21 | add916cfcec5 and 01c83795d50c, TH1520 HDMI bridge fixes (Felix Gu), v7.3 | Kernel clone |
| 2026-05-07 | 8c4ae2189125 VeriSilicon cursor planes (Icenowy Zheng, ISCAS), v7.2 | Kernel clone |
| 2026-07-14 | 17e2030f3760 PowerVR vm_ctx->lock fix for a NULL dereference seen on a RISC-V kernel (Icenowy Zheng, ISCAS), v7.2 (first in v7.2-rc5) | Kernel clone |
| 2026-10-15 | 16f30811a935 dt-bindings for spacemit,k1-gpu and spacemit,k3-gpu (Baihui Liang, SpacemiT), v7.4-rc1 | Kernel clone |

Merge dates differ from author dates. For example 77acc6b55ae4 was committed 2024-05-19 and 16f30811a935 on 2026-10-15.

**Key contributors.**
- SiFive: Samuel Holland.
- Samsung: Michal Wilczynski.
- ISCAS: Icenowy Zheng, with Han Gao as tester.
- Imagination: Sarah Walker.
- ZTE: Xuemei Liu.
- SpacemiT: Baihui Liang.
- Individuals: Nathan Chancellor, Felix Gu.

**Fully upstream?** Yes for everything listed. All 16 commits are in mainline. The status of unmerged series is unknown, because the mailing-list archives were not reviewed. No master tracking issue exists; DRM RISC-V work is spread across per-driver series on dri-devel and linux-riscv [NEEDS VERIFICATION against the lore archives].

## 3. Upstream Support Tier

**Formal tier policy:** none. DRM defines no architecture tiers. Support is whatever each driver's Kconfig allows.

**Evidence.**
- The DRM CI, in `drivers/gpu/drm/ci`, builds and tests only arm32 (`multi_v7_defconfig`), arm64 (`defconfig`) and x86_64 (`x86_64_defconfig`).
- Two riscv64 jobs exist but are disabled: `debian-riscv64` in `build.yml` (line 184) and `debian/riscv64_build` in `container.yml` (line 51), both `rules: - when: never`. They appear inherited from Mesa's shared CI templates, which the kernel config turns off alongside ppc64el, s390x and x86_32.
- No release-blocking status applies. DRM ships inside the kernel.
- Official binaries: none from upstream. The kernel ships as tags.

| Aspect | amd64 (x86_64) | arm64 | riscv64 |
|---|---|---|---|
| DRM CI build job | Yes (`build:x86_64`) | Yes (`build-nodebugfs:arm64`) | Disabled (`when: never`) |
| DRM CI KUnit job | Yes (`kunit:x86_64`) | Yes (`kunit:arm64`) | None |
| DRM CI hardware IGT | i915 (amly, apl, cml, glk, jsl, kbl, tgl, whl), amdgpu-stoney | mediatek, meson, msm, panfrost, panthor, rockchip | None |
| Virtual-GPU / VKMS CI | virtio_gpu, vkms | virtio_gpu, vkms (hardware list is not split by arch in the findings) [NEEDS VERIFICATION] | None |
| Driver availability | All major drivers; i915 is x86-only | panfrost, panthor, lima, v3d gated to Arm (build elsewhere only with COMPILE_TEST) | PCIe drivers (amdgpu, radeon, nouveau, Xe), PowerVR, etnaviv, virtio-gpu, VeriSilicon DC |
| Defconfig enables DRM | Data not available: x86 defconfig not examined | Data not available: arm64 defconfig not examined | `DRM=m`, `DRM_RADEON=m`, `DRM_NOUVEAU=m`, `DRM_SUN4I=m`, `DRM_VIRTIO_GPU=m`, `FB=y` |

Not checked: KernelCI, LKFT, 0-day and syzbot results for DRM on riscv64 [NEEDS VERIFICATION]. The dri-devel list was not checked for riscv drm-ci patches.

## 4. Technical Architecture and RISC-V-Specific Subsystems

DRM has no `arch/riscv` code, no assembly (`.S`) files under `drivers/gpu/drm`, no JIT backend and no riscv64 SIMD dispatch. `arch/riscv` contains no DRM or GPU file. The riscv64 support is thin glue: Kconfig gating, one kernel-mode FPU facility, TTM memory-attribute handling, and RISC-V SoC drivers. Disk was full during research, so a full `git grep` of `drivers/gpu` was not run. Anything outside the scoped paths (Kconfig files, `drivers/gpu/drm/*.c`, ttm, imagination, verisilicon) is [NEEDS VERIFICATION].

| Component | amd64 | arm64 | riscv64 | Quality / ISA notes |
|---|---|---|---|---|
| Kernel-mode FPU (`kernel_fpu_begin/end`) | Supported (all previously supported architectures select `ARCH_HAS_KERNEL_FPU_SUPPORT`) | Supported | Present since v6.10; selected `if 64BIT && FPU` | Minimal, non-preemptible, scalar FP only (`fstate_save`/`fstate_restore`, `SR_FS`). No vector variant. riscv32 excluded because it needs libgcc assistance for double/64-bit integer conversion. |
| amdgpu DC_FP (display math) | Enabled when the arch has kernel FPU | Excluded under clang | GCC only; excluded under clang (`!(CC_IS_CLANG && (ARM64 \|\| LOONGARCH \|\| RISCV))`) | Under clang, DC builds but the DML floating-point paths are disabled. |
| amdkfd (`HSA_AMD`) | Supported | Supported | `RISCV && 64BIT` allowed since v6.16 | Kconfig enable only (commit 4e696906e9a8), no RISC-V-specific code. Author states KFD "can run on RISCV systems"; no test evidence found. |
| TTM write-combine / uncached mappings | `pgprot_writecombine`/`noncached` available | Available | Added in v6.19 (4f9ffd2c80a2) | Uses Svpbmt or vendor Xtheadmae. Tested by Han Gao, acked by Christian Koenig. Whether `_PAGE_NOCACHE`/`_PAGE_IO` resolve to Svpbmt or T-Head encodings at runtime is [NEEDS VERIFICATION]. |
| `drm_cache.c` flush helpers (`drm_clflush_pages`, `drm_clflush_sg`, `drm_clflush_virt_range`) | Implemented (clflushopt/wbinvd) | Data not available: the findings list only x86 and powerpc as implemented [NEEDS VERIFICATION] | Missing: falls to `WARN_ONCE(1, "Architecture has no drm_cache.c support\n")` | Most significant riscv64-specific hole found. Arch DMA-API hooks exist behind `RISCV_DMA_NONCOHERENT` (selected by `RISCV_ISA_ZICBOM`), but they cover the DMA API, not these DRM helpers. |
| PowerVR | Not applicable (`ARM64 \|\| RISCV && 64BIT`) | Supported | Supported (TH1520 BXM-4-64 on Lichee Pi 4A) | Generic driver with real TH1520 pwrseq and binding work. RISC-V GPU firmware core support (171f378d2a23) is separate. |
| VeriSilicon DC8200 + TH1520 HDMI bridge | Build only with COMPILE_TEST | Build only with COMPILE_TEST | `DRM_VERISILICON_DC` depends on `RISCV \|\| COMPILE_TEST`; bridge depends on `ARCH_THEAD \|\| COMPILE_TEST` | New (v7.1), small. Only DC8200 and the primary plane at first; cursor planes added in v7.2. |
| Assembly / JIT / SIMD / crypto | None | None | None | Not applicable to DRM. |

RISC-V cores inside GPUs (not host riscv64 code): `drivers/gpu/drm/imagination/pvr_fw_riscv.c`, `drivers/gpu/drm/tegra/riscv.c`, a GH100 register header in nouveau, and `drivers/gpu/nova-core/firmware/riscv.rs`.

## 5. Build System, Cross-Compilation, and Toolchain

DRM builds with Kbuild (`make`). There are no cmake or configure flags; the equivalents are Kconfig switches. No Dockerfile exists in the tree. The commands below follow Kbuild and `llvm.rst` conventions and were not run.

```
# GNU cross build
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs

# LLVM build
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules dtbs

# Enable DRM drivers on top of defconfig
./scripts/config --file .config -m DRM -m DRM_AMDGPU -m DRM_NOUVEAU -m DRM_POWERVR -m DRM_VIRTIO_GPU
make ARCH=riscv olddefconfig
```

- The kernel image is `arch/riscv/boot/Image`.
- The riscv `defconfig` does not enable `DRM_POWERVR`, `DRM_VERISILICON_DC` or `DRM_AMDGPU`. It enables PCI, `PCI_HOST_GENERIC`, `PCIE_FU740`, `PCIE_STARFIVE_HOST=m`, `BLK_DEV_NVME=m` and `VIRTIO_PCI`, and the SoC options `ARCH_SIFIVE`, `ARCH_SOPHGO`, `ARCH_SPACEMIT` and `ARCH_THEAD`.
- To disable a driver, use `./scripts/config -d DRM_AMD_DC` (amdgpu display) or `-d DRM_AMDGPU`, and likewise per driver.

**Toolchain minimums** (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`):

| Tool | Minimum | Note |
|---|---|---|
| GCC | 8.1.0 | Same as most architectures; only parisc64 differs (12.0.0) |
| Clang/LLVM | 17.0.1 | `llvm.rst` lists riscv as "Supported" with `LLVM=1` |
| binutils | 2.30 | |
| GNU make | 4.0 | |
| Rust (optional) | 1.85.0 | |
| bindgen (optional) | 0.71.1 | |
| pahole | 1.26 | |
| Python | 3.9.x | |

**Why newer toolchains are needed for some riscv features (`arch/riscv/Kconfig`).**
- Vector (`TOOLCHAIN_HAS_V`): needs `-march=rv64imv`, LLD or GNU ld >= 2.38, and `.option arch`.
- Zbb, Zba, Zbc, Zbkb: need LLD or GNU ld >= 2.39.
- Zicsr/Zifencei must be named explicitly with GNU as >= 2.36. Binutils 2.38 and GCC 12.1 changed the default ISA spec. GCC below 11.3.0 cannot pass them via `-march`, so the kernel falls back to an older ISA spec.
- Clang dynamic ftrace needs GNU as, or LLVM as with LLD or ld >= 2.36.
- DWARF5 is broken when the LLVM assembler and LLD are both older than 18.

**Known build failures.**
- `ARCH=riscv allmodconfig` with clang hit `-Wframe-larger-than` errors (stack frame 2448 bytes, limit 2048) in dcn32 `display_mode_vba_32.c`, fatal under `CONFIG_WERROR`. GCC uses less than half the stack for the same function. Mitigation: 301daa346f0e disables DC_FP for RISC-V under clang. Retesting against current LLVM was not done.
- Whether riscv sets `ARCH_HAS_KERNEL_FPU_SUPPORT` was read as `if 64BIT && FPU` in one check, and listed as unverified in another [NEEDS VERIFICATION].

**QEMU.** The only in-tree QEMU invocation is `tools/testing/kunit/qemu_configs/riscv.py`, a KUnit runner and not a DRM test:

```
qemu-system-riscv64 -machine virt -cpu rv64 \
  -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin \
  -kernel arch/riscv/boot/Image -append "console=ttyS0"
```

- It needs `ARCH_VIRT`, `SERIAL_8250`, `SERIAL_8250_CONSOLE`, `SERIAL_OF_PLATFORM`, `RISCV_SBI_V01` and `SERIAL_EARLYCON_RISCV_SBI`.
- It exits if the OpenSBI blob is missing (install qemu-system-riscv).
- For graphics on QEMU, `DRM_VIRTIO_GPU` plus `VIRTIO_PCI` and `-device virtio-gpu-pci` is the natural path. The device flag is a suggestion, not found in the tree [NEEDS VERIFICATION].

Not found: riscv-specific or DRM-specific riscv build documentation. `Documentation/arch/riscv/` has only `boot.rst` and `boot-image-header.rst`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Driver / feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| DRM core (needs `HAS_DMA`, MMU for TTM) | Yes | Yes | Yes |
| amdgpu (PCIe) | Yes | Data not available | Builds (`DRM && PCI`); DC_FP GCC-only; not in defconfig |
| amdkfd / HSA | Yes | Yes | Yes since v6.16 (`RISCV && 64BIT`) |
| radeon | Yes | Data not available | Builds; `DRM_RADEON=m` in defconfig |
| nouveau | Yes | Data not available | Builds; `DRM_NOUVEAU=m` in defconfig. 2021 anecdotes: GT710 on SiFive Unmatched and GeForce 8400 GS worked; others recalled NVIDIA cards not working, possibly PCIe addressing [NEEDS VERIFICATION] |
| Xe | Yes | Data not available | Builds if 4K pages (`PAGE_SIZE_4KB \|\| COMPILE_TEST \|\| BROKEN`) |
| i915 | Yes | No | No (`depends on X86 && PCI`) |
| PowerVR | No | Yes | Yes (TH1520); SpacemiT K1/K3 binding only |
| panfrost, panthor, lima, v3d | No | Yes | COMPILE_TEST only |
| etnaviv | Data not available | Data not available | Builds, no arch gate (`DRM && MMU`) |
| virtio-gpu | Yes | Yes | Yes (`DRM_VIRTIO_GPU=m`) |
| VeriSilicon DC8200 | COMPILE_TEST | COMPILE_TEST | Yes (TH1520; JH7110 incomplete [NEEDS VERIFICATION]) |
| Nova (Rust) | Data not available | Data not available | `64BIT, PCI, RUST, !CPU_BIG_ENDIAN`; needs Rust enabled on RISCV [NEEDS VERIFICATION] |
| DRM panic QR code | Data not available | Data not available | Requires `RUST` |

**Functional gaps.**
- No RISC-V flush or write-combine helpers in `drm_cache.c`. Drivers that call the three clflush helpers get a warning and no flush.
- No DC_FP under clang. Newer amdgpu hardware that needs DC_FP lacks display math paths in clang builds. GCC builds have it.
- i915 is x86-only. panfrost, panthor, lima and v3d are Arm-gated, so Arm Mali and Broadcom GPUs are not usable on riscv64 without changing Kconfig.
- No SpacemiT K1/K3 PowerVR driver, DTS or firmware series was found. Only the binding is merged.
- A `git log --no-merges --grep=risc-v` over the driver directories finds no RISC-V commits for nouveau, radeon, panfrost, panthor, etnaviv or v3d. The few matches for Xe, i915 and lima are treewide or unrelated changes that were not reviewed one by one. A generic driver can work without RISC-V-specific code.

**Performance gaps.** Data not available: no benchmark data exists for DRM on riscv64 versus arm64 or amd64. The RISE blog has no DRM performance posts. DRM has no SIMD kernels, so the usual missing-SIMD delta does not apply. The kernel-mode FPU commit says the floating-point display code "is not performance-critical" and provides a minimal non-preemptible implementation.

**Security hardening gaps.** Data not available: not searched.

**NaN / floating-point semantics.** Data not available: no NaN or rounding issue was identified. The only floating-point constraints found are the riscv64-only restriction for kernel FPU and the clang frame-size problem in the DML code.

## 7. CI/CD Infrastructure

The DRM CI runs on gitlab.freedesktop.org (upstream `https://gitlab.freedesktop.org/drm/kernel.git`), using freedesktop ci-templates and Mesa CI scripts pinned at mesa/mesa commit 25881c701a56233dd8fc7f92db6884a73949d63d. The files read were `gitlab-ci.yml`, `build.yml`, `build.sh`, `test.yml`, `kunit.yml`, `kunit.sh`, `container.yml`, `image-tags.yml` and `igt_runner.sh`, plus `Documentation/gpu/automated_testing.rst` (no riscv mention) and `drivers/gpu/drm/tests/.kunitconfig`. Two independent reads of the clone reached the same result.

- Does riscv64 CI exist? No. The only riscv64 references are `debian-riscv64` (`build.yml:184`) and `debian/riscv64_build` (`container.yml:51`), both `rules: - when: never`.
- `drivers/gpu/drm/ci` has no riscv or rv64 files, no `riscv64.config` and no riscv xfails. Config fragments exist only for arm, arm64 and x86_64.
- `build.sh` and `igt_runner.sh` handle only arm, arm64 and x86_64.
- KUnit jobs run `tools/testing/kunit/kunit.py run --arch ${KERNEL_ARCH} --kunitconfig=drivers/gpu/drm/tests` under qemu-system-arm, qemu-system-aarch64 and qemu-system-x86. One read also found `--make_options LLVM=1`, which the second read did not list [NEEDS VERIFICATION].
- `drivers/gpu/drm/tests/.kunitconfig` is architecture-neutral (`CONFIG_KUNIT=y`, `CONFIG_DRM=y`, `CONFIG_DRM_VKMS=y`). `tools/testing/kunit/qemu_configs/riscv.py` exists in the tree, so a riscv64 KUnit job is technically possible but not configured.
- RISE runners: no use for Linux DRM was found. RISE Board Farm Android 17 testing will start on A210 systems, with K3 added later. The post does not describe individual runners.
- Not checked: KernelCI, LKFT, 0-day and syzbot results for DRM on riscv64.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | `build:x86_64` | `build-nodebugfs:arm64` (and `build:arm32`) | `debian-riscv64`, disabled |
| Container job | Yes | Yes | `debian/riscv64_build`, disabled |
| KUnit under QEMU | `kunit:x86_64` | `kunit:arm64` | None |
| Hardware IGT | amdgpu-stoney, i915 (8 platforms) | mediatek, meson, msm, panfrost, panthor, rockchip | None |
| Xfail lists | Yes | Yes | None |
| RISE runners | N/A | N/A | None found |

## 8. Distribution and Release Status

- Upstream: no official riscv64 binaries. The kernel is released as source tags. Mainline is currently at v7.4-rc1.
- PyPI, npm, Maven, OCI: not applicable. `linux-drm` does not exist on PyPI, and the RISE GitLab wheel index has no entry for it. The RISE wheel builder lists no Linux DRM, libdrm or drm entry.
- Ubuntu 26.04 (resolute) riscv64, from a local Packages index (main plus universe):
  - `linux-image-generic` 7.0.0-14.14.2 is the only riscv64 release for this subsystem. DRM is built into it. Which DRM drivers its config enables was not checked [NEEDS VERIFICATION], and its patch status was not checked.
  - `libdrm2`, `libdrm-dev`, `libdrm-amdgpu1`, `libdrm-radeon1`, `libdrm-nouveau2`, `libdrm-intel1` and `libdrm-tests` at 2.4.131-1.
  - The Ubuntu 26.04 riscv64 Packages index lists `libdrm-dev` at 2.4.131-1.
  - Mesa packages at 26.0.3-1ubuntu1: `libgl1-mesa-dri`, `mesa-vulkan-drivers`, `libgbm1`, `libegl-mesa0`, `libglx-mesa0`, `mesa-libgallium`, `mesa-drm-shim`. Not found: `mesa-va-drivers`, `mesa-vdpau-drivers`.
  - Not found: `libdrm-etnaviv1`, `libdrm-freedreno1`, `libdrm-tegra0`, `igt-gpu-tools`.
  - Found: `linux-firmware` 20260319.git217ca6e4.1ubuntu (arch-all).
- Debian: [libdrm merge request 7](https://salsa.debian.org/xorg-team/lib/libdrm/-/merge_requests/7) (opened 2025-03-27) asks to build `libdrm-intel1` for riscv64. The page showed no merge status or description [NEEDS VERIFICATION]. Fedora: Data not available, not searched.
- Arch Linux RISC-V: no evidence either way. The search for "linux drm" listed no such package, and no libdrm package page was fetched.

**What a user must do for a working binary.** Install Ubuntu 26.04 riscv64 and use the `linux-image-generic` kernel with libdrm and Mesa packages. Confirm that the needed driver module is in that kernel; this was not checked. Otherwise build a mainline kernel with `ARCH=riscv` (Section 5) and enable the needed drivers by hand, since the riscv defconfig omits amdgpu, PowerVR and VeriSilicon DC. A user with an Arm Mali, Broadcom or Intel i915 GPU cannot use it on riscv64 without Kconfig changes.

## 9. Dependencies

The "riscv64 build" cells below come from the Ubuntu 26.04 riscv64 Packages index and the kernel clone. "riscv64 test" cells without evidence are marked [NEEDS VERIFICATION]; no tests were run.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime, critical) | Hosts DRM/KMS and GPU drivers | Builds; DRM is modular in defconfig | [NEEDS VERIFICATION]: no DRM CI; KUnit is possible via `qemu_configs/riscv.py` | Mainline tags; Ubuntu `linux-image-generic` 7.0.0-14.14.2 | DRM maintainers (Section 1) |
| GCC (build, critical) | Kernel compiler; only compiler that gets DC_FP on riscv64 | Minimum 8.1.0. Newer versions needed for Zbb/Zba/Zbc (binutils 2.39) and Vector (2.38). Data not available: GCC's own riscv64 status not researched here | Data not available | Data not available | Data not available |
| LLVM (build, optional) | Alternative compiler (`LLVM=1`) | Minimum 17.0.1; riscv "Supported" in `llvm.rst`. DC_FP disabled under clang. See status report at project-reports/llvm.md | See report | See report | See report |
| Rust (build, optional) | Nova, DRM panic QR screen | Minimum 1.85.0; `rustc` 1.93.1ubuntu1 in Ubuntu riscv64. `bindgen-cli` and `rust-bindgen-cli` not found under the names tried. See status report at project-reports/rust.md | [NEEDS VERIFICATION] | Shipped in Ubuntu | See report |
| libdrm (runtime, critical) | Userspace DRM ioctl library | Ubuntu riscv64: libdrm2, -dev, -amdgpu1, -radeon1, -nouveau2, -intel1, -tests (2.4.131-1) | [NEEDS VERIFICATION] | Shipped in Ubuntu 26.04 riscv64 | Debian MR 7 (riscv64 libdrm-intel1) |
| Mesa (runtime, critical) | GL/GLES/EGL/GBM/Vulkan userspace drivers | Ubuntu riscv64: 26.0.3-1ubuntu1 (packages in Section 8). Mesa internals are out of scope here | [NEEDS VERIFICATION] | Shipped in Ubuntu | RISE `mesa` fork, branch `android-17-imagination` |
| linux-firmware (runtime, optional) | GPU microcode (amdgpu, nouveau, PowerVR) | Ubuntu: arch-all, 20260319.git217ca6e4.1ubuntu | Not applicable | Shipped | Data not available |
| IGT GPU Tools (test, optional) | KMS/DRM test suite | `igt-gpu-tools` not found for Ubuntu riscv64 | Not applicable | Not packaged for riscv64 in 26.04 | Data not available |
| QEMU (test, optional) | Runs KUnit via `qemu-system-riscv64 -machine virt`; virtio-gpu | Data not available: QEMU packaging not researched | `qemu_configs/riscv.py` exists in the tree; DRM-specific use not shown | Data not available | Data not available |
| OpenSBI (indirect) | Boot firmware for the kernel | Not checked as a package. See status report at project-reports/opensbi.md | See report | See report | See report |
| Vulkan loader and headers (indirect) | Vulkan | libvulkan1, libvulkan-dev 1.4.341.0-1, vulkan-tools | [NEEDS VERIFICATION] | Shipped | Data not available |
| Wayland, Weston, X.Org (indirect) | KMS consumers | libwayland-client0 1.24.0-2, weston 14.0.2-5, xserver-xorg-core 2:21.1.22-1ubuntu1, xserver-xorg-video-amdgpu 25.0.0-1. `xserver-xorg-video-modesetting` not found (likely built into xserver-xorg-core [NEEDS VERIFICATION]) | [NEEDS VERIFICATION] | Shipped | Data not available |
| libinput, libdisplay-info, libseat, libpciaccess, libkmod, libpixman, libcairo (indirect) | Compositor and DRM helpers | All present in Ubuntu riscv64 (versions in research notes) | [NEEDS VERIFICATION] | Shipped | Data not available |
| kmscube, mesa-utils (indirect) | KMS and GL smoke tests | Present in Ubuntu riscv64 | [NEEDS VERIFICATION] | Shipped | Data not available |

**Deep-dive.**
- DRM has no JIT, SIMD or crypto dependency. The numerics dependency is the kernel-mode FPU in the Linux kernel (Section 4).
- Compiler choice changes functionality: GCC gets amdgpu DC_FP on riscv64, clang does not.
- Rust is a dependency only for Nova and the DRM panic QR screen. The bindgen package was not found in Ubuntu riscv64 under the names tried.
- Mesa is the critical userspace dependency for PowerVR on riscv64 and is covered in its own report.
- Missing SoC sub-libraries `libdrm-etnaviv1`, `libdrm-freedreno1` and `libdrm-tegra0` were not found under those names. Whether this matters on riscv64 was not determined.

## 11. Known Bugs and Active Issues

No issue-tracker or Bugzilla numbers were retrieved, because the tracker searches never ran. DRM bugs are tracked on freedesktop.org GitLab and the mailing lists, with no single RISC-V issue list. Open-bug claims below are [NEEDS VERIFICATION]. Severity is the author's assessment from commit messages.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| 17e2030f3760 | PowerVR NULL dereference in `drm_gpuva_find` via `pvr_vm_unmap` on a RISC-V kernel | Fixed, v7.2-rc5 | High | Oops reachable from an ioctl. Fix takes `vm_ctx->lock` in `pvr_vm_map()`. Fixes ff5f643de0bf and 4bc736f890ce. |
| 301daa346f0e | clang `-Wframe-larger-than` in dcn32 DML on RISC-V | Mitigated, v6.10 | Medium | DC_FP disabled for RISC-V with clang. Reported by Palmer Dabbelt. |
| add916cfcec5 | TH1520 HDMI bridge: error check on `dw_hdmi_probe()` return | Fixed, v7.3 | Low | |
| 01c83795d50c | TH1520 HDMI bridge: `remove()` callback | Fixed, v7.3 | Low | |
| None | `drm_cache.c` has no RISC-V support (`WARN_ONCE`, no flush) | Open, no tracking issue found | Medium | Affects any driver calling the clflush helpers on riscv64. |
| None | DC_FP unavailable under clang on riscv64 | Open by design | Medium | Retest against current LLVM not done. |
| None | No SpacemiT K1/K3 PowerVR driver, DTS or firmware series | Open | Medium | Binding 16f30811a935 merged in v7.4-rc1 only. |
| None | NVIDIA cards on RISC-V PCIe: 2021 anecdotal non-working reports | Unknown | Unknown | Not in the DRM log. |

**Correctness bugs.** 17e2030f3760 is a locking race producing a NULL dereference, and it is fixed. No numeric or floating-point correctness bug was found. Data not available for IGT, KernelCI or syzbot results.

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. the mailing-list archives were not reviewed, so absence on the lists is unverified [NEEDS VERIFICATION]. The merged commits carry acks and reviews from AMD, Imagination, SUSE and Arm-affiliated maintainers, with no recorded objection in the trailers read.
- **Technical blockers:**
  - Clang frame-size growth in AMD DML. The DML files are described as "gcc-parsable HW gospel, coming straight from HW engineers", and edits to them never make it back to the original source. This is why the fix excludes the code rather than restructuring it.
  - Missing `drm_cache.c` RISC-V helpers.
  - Arm-gated drivers (panfrost, panthor, lima, v3d) and the x86-only i915.
- **Organizational blockers:**
  - No master tracking issue.
  - No DRM CI riscv64 job. No patches adding one were found, but the dri-devel list was not checked.
  - No RISE-funded upstream DRM work was found. The RISE members page lists graphics-relevant members (MediaTek and NVIDIA as Premier, SpacemiT as General), but this is no evidence of DRM funding.
- **Acceptance probability:** the author's judgement is high for further small RISC-V Kconfig, binding and driver patches, given the sixteen merged commits across v5.19 to v7.4-rc1 with no recorded objection. It is not assessed for a riscv64 CI job, because no such proposal was found.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification.** The upstream DRM CI ([build.yml](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/drivers/gpu/drm/ci/build.yml) and kunit.yml) only builds and tests arm32, arm64 and x86_64. Its `debian-riscv64` build job and `debian/riscv64_build` container job are both `rules: - when: never`, and no IGT hardware job uses a RISC-V board. riscv64 DRM works in mainline: it has riscv64-specific merged commits and Kconfig gating, and the riscv defconfig enables DRM. The only riscv64 release is the Ubuntu 26.04 `linux-image-generic` kernel, which is a distro build whose patch status was not checked, so the distribution floor gives orange (downstream-only), not yellow.

**Pending work that could change the grade.**
- No unmerged series were identified, because the mailing-list archives were not reviewed. No DRM CI patches adding riscv64 were found, and the dri-devel list was not checked.
- Merged RISC-V enablement is ongoing:
  - PowerVR on TH1520 (v6.18).
  - TTM pgprot handling for RISC-V (v6.19).
  - The VeriSilicon DC8200 display driver and TH1520 HDMI bridge (v7.1).
  - The PowerVR VM lock fix (v7.2).
  - SpacemiT K1/K3 GPU DT bindings (v7.4-rc1).
- Gaps: the amdgpu DC_FP code is disabled for RISC-V under clang, and the SpacemiT K1/K3 PowerVR driver and DTS series were not found.
- RISE involvement is indirect. The [RISE Android 17 on RVA23 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) (RP024, done by BayLibre) uses the upstream Imagination PowerVR driver and Mesa. No RISE-funded upstream DRM work was found.
- If DRM CI ever enabled a riscv64 KUnit job on the existing `kunit.yml` and `drivers/gpu/drm/tests` config, the grade could rise to blue.

## 14. Investment Analysis

RISE check, done before sizing. RISE funded Android 17 on RVA23 (RP024, BayLibre). It uses the upstream PowerVR driver, and phase two will automate Android build and hardware testing. Mesa and PowerVR userspace bring-up for Android is therefore already covered and is not sized here. No RISE-funded work on DRM CI, `drm_cache.c`, amdgpu on riscv64 or the SpacemiT driver was found. The 2026-07-07 and earlier feed posts and GitHub repos 31-70 were not checked.

Effort figures below are engineering estimates. They include upstream review latency.

### 14.1 Functional Enablement
- **RISC-V `drm_cache.c` support.** Add flush helpers for riscv64, for example based on Zicbom where available, so that the three clflush helpers stop issuing `WARN_ONCE`. Needs a design discussion with DRM and RISC-V maintainers, and hardware with non-coherent DMA to test.
- **amdgpu DC_FP under clang.** Retest the dcn32 frame-size problem with current LLVM and, if it still fails, propose a narrower exclusion than disabling all of DC_FP.
- **SpacemiT K1/K3 PowerVR.** Track or contribute the driver, DTS and firmware series that must follow the merged binding. Owner would be SpacemiT and Imagination; our role would be review and testing.
- **Verification of unchecked items.** Run the lore, dri-devel, KernelCI and per-driver (Xe, panfrost, etnaviv and others) checks.

### 14.2 Performance Optimization
- No benchmark baseline exists. First establish one: PowerVR on TH1520 and a PCIe amdgpu card on a riscv64 board versus arm64. No SIMD work applies to DRM. Revisit the non-preemptible kernel FPU only if the baseline shows DML latency matters.

### 14.3 CI/CD Infrastructure
- **riscv64 KUnit job in DRM CI.** Add `kunit:riscv64` to `kunit.yml`, reusing `tools/testing/kunit/qemu_configs/riscv.py` and the architecture-neutral `drivers/gpu/drm/tests/.kunitconfig`. This is the cheapest path to blue.
- **riscv64 build job** with a `riscv64.config` fragment, replacing the disabled `debian-riscv64` job.
- **IGT on virtio-gpu under QEMU riscv64**, then a LAVA hardware job for PowerVR on TH1520. Needs a board-farm slot; RISE's Board Farm is a candidate.
- **Package `igt-gpu-tools` for Debian/Ubuntu riscv64.**

### 14.4 Ecosystem Enablement
- Check whether `libdrm-etnaviv1`, `libdrm-freedreno1`, `libdrm-tegra0`, `mesa-va-drivers` and `mesa-vdpau-drivers` should exist for riscv64, or are simply not packaged under those names.
- Confirm which DRM drivers Ubuntu 26.04 `linux-image-generic` enables for riscv64.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | RISC-V `drm_cache.c` flush helpers (Zicbom-based) | 6 | Us with DRM and RISC-V maintainers | High |
| Functional | Retest amdgpu DC_FP under current clang; narrow exclusion if possible | 4 | Us with AMD display maintainers | Medium |
| Functional | SpacemiT K1/K3 PowerVR driver/DTS series (review, test, contribute) | 6 | SpacemiT, Imagination; us as reviewer | Medium |
| Functional | Close unverified items (lore, dri-devel, KernelCI, per-driver checks) | 2 | Us | High |
| Performance | Baseline benchmarks for PowerVR and PCIe amdgpu on riscv64 vs arm64 | 4 | Us | Medium |
| CI/CD | `kunit:riscv64` job in DRM CI | 4 | Us with drm-ci maintainers | Critical |
| CI/CD | riscv64 build job and `riscv64.config` | 3 | Us | High |
| CI/CD | IGT on virtio-gpu under QEMU riscv64 | 5 | Us | Medium |
| CI/CD | LAVA hardware job, PowerVR on TH1520 | 10 | Us with RISE Board Farm | Medium |
| Ecosystem | Package `igt-gpu-tools` for riscv64 | 2 | Us with Debian/Ubuntu | Low |
| Ecosystem | Audit libdrm and Mesa riscv64 sub-packages; confirm Ubuntu kernel DRM config | 2 | Us | Low |

## 15. References

- [Linux kernel tree](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (commit, tag, Kconfig, MAINTAINERS and CI-file facts read from a local clone at 05441d697f7f)
- [DRM CI build.yml](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/drivers/gpu/drm/ci/build.yml)
- [Linux GPU documentation](https://docs.kernel.org/gpu/index.html)
- [DRM Maintainer Tools](https://maintainer-tools-rgallaispoustm-68a7c03928f3408583bf11b078a25b0.pages.freedesktop.org/)
- [Collabora: drm-ci, a GitLab CI pipeline for Linux kernel testing](https://Collabora.com/news-and-blog/blog/2024/02/08/drm-ci-a-gitlab-ci-pipeline-for-linux-kernel-testing/)
- [Kernel mirror: automated_testing.rst (v6.19)](https://tangled.org/tjh.dev/kernel/blob/v6.19/Documentation/gpu/automated_testing.rst)
- [RISE: Android 17 available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE feed](https://riseproject.dev/feed/)
- [RISE members](https://riseproject.dev/members/)
- [RISE home](https://riseproject.dev)
- [RISE blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/orgs/riseproject-dev/repositories)
- [riseproject-dev/linux](https://github.com/riseproject-dev/linux)
- [riseproject-dev/mesa](https://github.com/riseproject-dev/mesa)
- [LKML: Re: riscv: defconfig: enable DRM_NOUVEAU](https://lkml.iu.edu/hypermail/linux/kernel/2110.3/04544.html)
- [Patchwork: riscv: defconfig: enable DRM_NOUVEAU](https://patchwork.kernel.org/project/linux-riscv/patch/20211012164658.81894-1-heinrich.schuchardt@canonical.com/)
- [Phoronix: SiFive newer AMD GPUs on RISC-V](https://www.phoronix.com/news/SiFive-Newer-AMD-GPUs-RISC-V) (not fetched)
- [lore: kernel-test-robot report on the kernel-mode FPU series](https://lore.kernel.org/dri-devel/202311230215.DBFyWPqb-lkp@intel.com/t/) (not fetched)
- [lore: Closes link of 301daa346f0e](https://lore.kernel.org/20240530145741.7506-2-palmer@rivosinc.com/) (not fetched)
- [lore: TTM RISC-V pgprot patch](https://lore.kernel.org/r/20251020053523.731353-1-uwu@icenowy.me) (not fetched)
- [lore: PowerVR RISC-V firmware processor series](https://lore.kernel.org/r/20250410-sets-bxs-4-64-patch-v1-v6-14-eda620c5865f@imgtec.com)
- [lore: PowerVR TH1520 pwrseq series](https://lore.kernel.org/r/20250822-apr_14_for_sending-v13-1-af656f7cc6c3@samsung.com)
- [lore: Enable PowerVR driver for RISC-V](https://lore.kernel.org/r/20250822-apr_14_for_sending-v13-4-af656f7cc6c3@samsung.com)
- [VeriSilicon DC driver patch](https://patch.msgid.link/20260129023922.1527729-4-zhengxingda@iscas.ac.cn)
- [TH1520 HDMI bridge patch](https://patch.msgid.link/20260129023922.1527729-6-zhengxingda@iscas.ac.cn)
- [PowerVR vm_ctx->lock fix patch](https://patch.msgid.link/20260714073641.1935075-1-zhengxingda@iscas.ac.cn)
- [SpacemiT GPU binding patch](https://patch.msgid.link/20261015-spacemit-gpu-binding-v1-1-a7a23c7e7788@linux.spacemit.com)
- [VeriSilicon RFC on linux-riscv (August 2025)](https://lists.infradead.org/pipermail/linux-riscv/2025-August/075654.html)
- [LavX News: Verisilicon DC8200 and Coreboot framebuffer drivers sent to DRM-Next for Linux 7.1](https://news.lavx.hu/article/verisilicon-dc8200-coreboot-framebuffer-drivers-sent-to-drm-next-for-linux-7-1) (secondary, rewrite of a Phoronix article)
- [Debian libdrm merge request 7](https://salsa.debian.org/xorg-team/lib/libdrm/-/merge_requests/7)
- [Ubuntu resolute riscv64 libdrm-dev file list](https://packages.ubuntu.com/resolute/riscv64/libdrm-dev/filelist)
- [PyPI linux-drm lookup](https://pypi.org/pypi/linux-drm/json)