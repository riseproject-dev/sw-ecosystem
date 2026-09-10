---
title: Buildroot
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: Perl
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="buildroot" %}

# Buildroot

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Buildroot<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Buildroot is a make/Kconfig-driven embedded Linux build system: it does not ship prebuilt binaries for any target architecture (amd64, arm64, riscv64, or otherwise). Users clone the source tree, select a `_defconfig`, and run `make` to produce a cross-toolchain, kernel image, bootloader, and root filesystem for their target. It is comparable in category to Yocto/OpenEmbedded, though structured very differently (a single monolithic Kconfig tree rather than layered recipes).

**Governance.** The project is stewarded by "Association Buildroot," a French non-profit (*association loi 1901*), registered 14 March 2016 (registration no. W313024278). Membership dues are nominal (individuals >= 10 euros/year, companies >= 150 euros/year) and fund developer-meeting logistics, contributor travel, and infrastructure hosting, not engineering headcount. Technical governance is separate from the association: five co-maintainers review and merge all patches:

- **Thomas Petazzoni** (Bootlin, CTO) - most prolific committer historically (~5,000 patches, ~64% of historical merges)
- **Peter Korsgaard** (Bootlin) - founding maintainer since Jan 2009
- **Arnout Vandecappelle** - Essensium/Mind through 2024, then Byteflies
- **Yann E. Morin** (Orange)
- **Romain Naour** (Smile ECS) - maintainer since Sept 2023

**Corporate sponsorship** is diffuse across small/mid embedded-Linux consultancies rather than a single dominant backer (unlike Yocto's Linux Foundation model): Gold tier is EVS Broadcast Equipment and Open Home Foundation; Silver is IPComm and Othermo; Bronze is Calian and SMC Gateway; past sponsors include Google, Bootlin, Rockwell Collins, Scaleway, Imagination Technologies, and Synopsys. Source: [buildroot.org/sponsors.html](https://buildroot.org/sponsors.html), [buildroot.org/association.html](https://buildroot.org/association.html).

**Development process.** There are no GitHub pull requests: the GitHub mirror ([github.com/buildroot/buildroot](https://github.com/buildroot/buildroot)) is explicitly read-only ("Do not file pull requests here"), confirmed by GitLab/GitHub PR endpoints returning 403/disabled. All patches go through the `buildroot@buildroot.org` mailing list, tracked in Patchwork ([patchwork.buildroot.org](https://patchwork.buildroot.org)), and applied directly to `git.buildroot.net`/`gitlab.com/buildroot.org/buildroot` by the five maintainers. Bug reports live on GitLab Issues, not a separate bug tracker feature comparable to Redmine's original bugs.buildroot.org (which was unreachable during this research).

**Culture toward new ports.** There is no written formal policy for accepting new architectures. The operational norm is: patches are reviewed publicly on the mailing list, and a new architecture is accepted once real upstream toolchain support exists (gcc/binutils and a libc: glibc, uClibc-ng, or musl) and it passes the standard defconfig/build/boot-test bar. There is no dedicated per-architecture maintainer role (unlike the Linux kernel's per-arch MAINTAINERS structure) - the same five general maintainers review architecture patches like any other patch.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-07 (approx.) | Original SiFive-internal groundwork for RISC-V Buildroot support (predecessor to the upstream port) | [Embecosm blog](https://embecosm.com/2018/09/19/adding-risc-v-64-bit-support-to-buildroot/) |
| 2018-09-19 | Embecosm blog post documents the riscv64 upstreaming work, staged via a `riscv-start` branch off 2018.08-rc1 | [Embecosm](https://embecosm.com/2018/09/19/adding-risc-v-64-bit-support-to-buildroot/) |
| 2018-09-23 21:42:41 UTC | `arch: add support for RISC-V 64-bit (riscv64) architecture` merged (commit `9b3d52b400`), author Mark Corbin (Embecosm), applied by Thomas Petazzoni | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2018-September/219312.html) |
| 2018-09-25 19:39:52 UTC | `boot/riscv-pk: add bootloader for RISC-V architecture` merged (commit `b3c46df481`) | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2018-September/219310.html) |
| 2018-09-25 19:40:10 UTC | `configs/qemu_riscv64_virt: new defconfig` merged (commit `52ef63d0bd`) | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2018-September/219311.html) |
| 2018-11 | Buildroot **2018.11** release ships riscv64 support for the first time | [Bootlin blog](https://bootlin.com/blog/buildroot-2018-11-released-bootlin-contributions-inside/) |
| 2019 (early) | RISC-V 32-bit support follows | Embecosm April 2019 follow-up post + FOSDEM 2019 talk "Buildroot for RISC-V" |
| 2019-10 (approx.) | `riscv-pk`/BBL bootloader package deprecated and removed in favor of OpenSBI project-wide | Verified against current tree (package no longer present) |
| 2022-07-23 17:31:27 UTC | Zicsr/Zifencei GCC-12 ISA-string fix merged (commit `d479264b34`), author Romain Naour, released in **2022.08** | [mailing list thread](https://lists.buildroot.org/pipermail/buildroot/2022-July/708978.html) |
| 2022-08-02 00:07:39 UTC | `package/llvm`: RISC-V target support merged (commit `88cac04de3`), author Abel Bernabeu, released in **2022.08** | [lore.kernel.org](https://lore.kernel.org/all/20220723215448.2532160-1-abel@x-silicon.com/t/) |
| 2022-08-07 15:45:29 UTC | `package/go`: fix for riscv64 sv57 mode merged (commit `fb97f4f354`), author Christian Stewart, released in **2022.08**; independently backported to 2022.02.x/2022.05.x maintenance branches | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2022-July/332607.html) |
| 2022-11 to 2022-12 | riscv32 NO-MMU series posted by Yimin Gu / Jesse Taube - **never merged** (git-verified: no trace of this author's patch in history) | [mailing list](https://lists.busybox.net/pipermail/buildroot/2022-November/341510.html) |
| 2023-06-26 | 10-patch "riscv: Various fixes and small enhancements" series merged, author Bin Meng (OpenSBI 1.2->1.3, HiFive Unleashed -> U-Boot 2023.04) | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2023-June/354844.html) |
| 2023-12-23 11:39:37 UTC | `package/libopenssl`: riscv32 build fix merged (commit `fc8eff0c76`), author Grant Nichol, released in **2024.02** | [lore.kernel.org](https://lore.kernel.org/buildroot/20231223070730.2417463-1-me@grantnichol.com/) |
| 2023-12-24 17:55:23 UTC | `boot/grub2`: RISC-V 64-bit EFI support merged (commit `f439b47ed6`), author Julien Olivain, released in **2024.02** | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2023-December/743782.html) |
| 2024.05 | riscv32/riscv64 NO-MMU support lands via an independent series (Waldemar Brodkorb, building on 2021-22 work by C. Hellwig / D. Le Moal / N. Cassel), functionally replacing the never-merged 2022 Yimin Gu/Taube attempt (commit `e32d404f6c`) | Git-verified tree history |
| 2024-09-14 17:56:44 UTC | `boot: optee-os: enable RISC-V (64-bit)` merged (commit `7c5b6c1e9f`), author Yu Chien Peter Lin, released in **2024.11** | [mailing list](https://lists.buildroot.org/pipermail/buildroot/2024-September/762985.html) |
| 2026-03-07 | `package/pixman`: RVV guard patch resubmitted by Bernd Kuhls (orig. Charlie Jenkins/Rivos), state **new**, not yet merged as of research date | [Patchwork](https://patchwork.buildroot.org/project/buildroot/patch/20260307114256.325624-1-bernd@kuhls.net/) |
| 2026-04-09 | `package/riscv-isa-sim`: host-boost dependency fix (part of a 29-patch series by Yann E. Morin), state **new**, not yet merged | [Patchwork](https://patchwork.buildroot.org/project/buildroot/patch/552592df3604c5fc2d601f4d1a837db562193bb6.1744229017.git.yann.morin.1998@free.fr/) |
| 2026-06-07 | `package/glibc`: RVV requires GCC >= 15 guard, author Romain Naour, state **new**, not yet merged | [Patchwork](https://patchwork.buildroot.org/project/buildroot/patch/20260607213030.1509913-2-romain.naour@smile.fr/) |

**Key contributors and organizations:** Mark Corbin (Embecosm, original 2018 port), Thomas Petazzoni (Bootlin, applying maintainer for nearly all foundational work), Romain Naour (Smile ECS, ongoing ISA-string/RVV maintenance), Bin Meng (10-patch riscv batch, 2023), Yu Chien Peter Lin (OP-TEE riscv64), Julien Olivain (GRUB2 EFI riscv64), Christian Stewart (Go sv57 fix), Grant Nichol (OpenSSL riscv32), Yann E. Morin (riscv-isa-sim, ongoing).

**Is it fully upstream?** Yes. There is no out-of-tree fork required for basic riscv64/riscv32 Linux userland functionality; base architecture support has been in-tree and released since Buildroot 2018.11 (8 years of continuous maintenance through the current 2026 tree, HEAD `d0c6a0c`, Sept 2026). Vendor forks exist ([riscvarchive/riscv-buildroot](https://github.com/riscvarchive/riscv-buildroot/wiki) - pre-2018 historical predecessor; [T-head-Semi/buildroot](https://github.com/T-head-Semi) - Alibaba T-Head Xuantie customization) but are not required for generic riscv64 use.

## 3. Upstream Support Tier

Buildroot has **no formal tiered-architecture policy** document (no "Tier 1/Tier 2" language comparable to Rust's or LLVM's). The only formalized tiers found are the Association's membership dues tiers (unrelated to architecture support) and RISE's own Premier/General membership tiers, of which Buildroot participates in neither (see Section 12).

In practice, evidence of support level:
- riscv64 is not release-blocking on a per-commit basis: ordinary pushes to master only trigger `check-package`/`check-symbol`/`DEVELOPERS`-lint jobs, verified via the GitLab API job listing for recent push-sourced pipelines (5 jobs, zero riscv).
- A fuller defconfig-build-and-boot-test matrix, including all riscv32/riscv64 defconfigs, runs only on a GitLab CI **schedule** (`BR_SCHEDULE_JOBS`) or tagged releases - not gating individual patches.
- No official binary release exists for riscv64 (or for any architecture - Buildroot has no binary distribution model at all).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Base architecture merged | Yes (original) | Yes (long-standing) | Yes, 2018-09 (Buildroot 2018.11) |
| Per-commit CI build/test | No (only lint jobs run per-commit for any arch, per `generate-gitlab-ci-yml` logic) | No (same) | No (same) |
| Scheduled/tag CI build+boot-test | Yes | Yes | Yes - last confirmed successful run 2026-06-30; dormant ~10 weeks as of 2026-09-08 |
| Official upstream binary release | None (source-only build system, all archs) | None | None |
| Toolchain variant breadth (Bootlin external) | Wide | Wide | 12 variants (riscv32/riscv64 x glibc/musl/uClibc x stable/bleeding-edge) |

Buildroot treats riscv64 identically to every other architecture in its generic, defconfig-driven CI generation logic (`support/scripts/generate-gitlab-ci-yml`) - there is no riscv64-specific carve-out, positive or negative, in the CI machinery itself.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Buildroot is not a compiler, runtime, or kernel; it has no JIT, GC, or SIMD kernels of its own. Its "architecture-specific subsystems" are the Kconfig/Makefile glue that select, configure, and patch third-party sources (GCC, glibc, Linux kernel, QEMU, LLVM, etc.) for a given target. Verified directly against tree HEAD `d0c6a0c` (Sept 2026):

| Component | riscv64 status | Detail |
|---|---|---|
| Arch/ISA definition (`arch/Config.in.riscv`, `arch/arch.mk.riscv`) | Full, hand-tuned | ISA choice (G/custom), extensions I/M/A/F/D/C/V, Zicsr/Zifencei auto-append for GCC>=12, RVV gated to `BR2_ARCH_NEEDS_GCC_AT_LEAST_12`, free-form `BR2_RISCV_ISA_EXTRA` (e.g. `zba_zbb_zvl256b`), full ABI matrix (ilp32/ilp32f/ilp32d, lp64/lp64f/lp64d), MMU/no-MMU toggle |
| External toolchains | Full | 12 Bootlin prebuilt variants: riscv32/riscv64 x glibc/musl/uClibc x stable/bleeding-edge (`toolchain/toolchain-external/toolchain-external-bootlin/Config.in.options`) |
| C libraries | Full | glibc, musl, uClibc-ng all build for riscv64/riscv32; actively patched (e.g. pending Jun 2026 glibc+RVV/GCC-15 guard, `0001-Fix-SSP-support-for-riscv32.patch`) |
| Boot chain/firmware | Full | OpenSBI (current), GRUB2 EFI for riscv64, OP-TEE OS riscv64. The original riscv-pk/BBL package was removed after OpenSBI superseded it project-wide (expected evolution, not a regression) |
| Kernel/QEMU test targets | Full | `qemu_riscv64_virt`, `qemu_riscv64_nommu_virt`, `qemu_riscv64_virt_efi`, `spike_riscv64` defconfigs, each with working `board/qemu/riscv64-virt*` boot scripts/readmes |
| SIMD/codegen-adjacent config | Partial, package-by-package | `package/llvm-project` builds the LLVM RISCV backend; `package/dav1d` disables hand-written asm when RVV/asm unsupported; `package/ffmpeg` disables `--disable-rvv --disable-asm` on riscv32; `package/highway` disables `HWY_CMAKE_RVV` on riscv32; `package/pixman` enables `-Drvv=enabled` when `BR2_RISCV_ISA_RVV` (currently has an open, unmerged correctness patch, see Section 11); `package/gmp` disables hand-written riscv asm unless M extension present |
| RISC-V-vendor tooling packages | Present | `package/andes-spi-burn` (Andes), `package/jh71xx-tools` (StarFive JH71xx), `package/sipeed-lpi4abin` and `package/python-kflash` (Sipeed/Kendryte K210) |
| D-language (GDC) support | Gap (narrow) | `BR2_GCC_SUPPORTS_DLANG` enabled for `BR2_riscv && !BR2_RISCV_64` - riscv32 gets D-language support, riscv64 does not |

Package-exclusion audit: of roughly 2,000 packages in the tree, only 2 explicitly exclude riscv64 - `nodejs` (`BR2_PACKAGE_NODEJS_ARCH_SUPPORTS` lists only arm/aarch64/i386/x86_64) and `mono` (`BR2_PACKAGE_MONO_ARCH_SUPPORTS` lists only aarch64/arm/i386/powerpc/x86_64). Go requires riscv64 specifically (`depends on !BR2_RISCV_32`, plus full-G-ISA gating), rather than excluding it.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Node.js support | Yes | Yes | No (`BR2_PACKAGE_NODEJS_ARCH_SUPPORTS` excludes riscv) |
| Mono support | Yes | Yes | No (`BR2_PACKAGE_MONO_ARCH_SUPPORTS` excludes riscv) |
| D-language (GDC) | Yes | Yes | No for riscv64 (yes for riscv32) |
| LLVM backend | Yes | Yes | Yes |
| Go toolchain | Yes | Yes | Yes (riscv64 only, not riscv32; sv57-mode fix applied 2022-08) |

## 5. Build System, Cross-Compilation, and Toolchain

Buildroot's own build driver is `make` + Kconfig (same UI family as the Linux kernel), not CMake or autoconf-style `./configure`. There are no `-DUSE_X=OFF`-style flags at the top level; feature/package toggles are `BR2_*` Kconfig booleans.

**Build commands (verified from `docs/manual/quickstart.adoc`):**
```bash
git clone https://gitlab.com/buildroot.org/buildroot.git
cd buildroot
make list-defconfigs | grep riscv64
#   qemu_riscv64_nommu_virt_defconfig
#   qemu_riscv64_virt_defconfig
make qemu_riscv64_virt_defconfig
make menuconfig      # optional interactive Kconfig toggle
make
```
Output lands in `output/images/` (`Image`, `fw_jump.bin`, `rootfs.ext2`).

**Reference defconfig** (`configs/qemu_riscv64_virt_defconfig`, verbatim excerpt): `BR2_riscv=y`, `BR2_LINUX_KERNEL_CUSTOM_VERSION_VALUE="6.18.7"`, `BR2_TARGET_OPENSBI_CUSTOM_VERSION_VALUE="1.6"`, `BR2_TARGET_OPENSBI_PLAT="generic"`, `BR2_TARGET_ROOTFS_EXT2=y`, `BR2_PACKAGE_HOST_QEMU_SYSTEM_MODE=y`.

**QEMU invocation** (`board/qemu/riscv64-virt/readme.txt`, MMU variant):
```bash
qemu-system-riscv64 -M virt -bios output/images/fw_jump.bin -kernel output/images/Image \
  -append "rootwait root=/dev/vda ro" \
  -drive file=output/images/rootfs.ext2,format=raw \
  -netdev user,id=net0 -device virtio-net-device,netdev=net0 -nographic
```
Buildroot auto-generates `output/images/start-qemu.sh` (via `board/qemu/post-image.sh`).

**Toolchain version requirements and why:**
- Host build tools: gcc/g++ >= 4.8, perl >= 5.8.7, make >= 3.81 (`docs/manual/prerequisite.adoc`) - not riscv-specific.
- Target GCC choice: 14.4.0 / 15.3.0 (default) / 16.2.0 (`package/gcc/Config.in.host`).
- **GCC >= 12 is required for riscv64-specific reasons**: (a) it is the floor for enabling `BR2_RISCV_ISA_RVV` (vector extension codegen only matured at GCC 12), and (b) `arch.mk.riscv` unconditionally appends `_zicsr_zifencei` to `-march` whenever `BR2_TOOLCHAIN_GCC_AT_LEAST_12=y`, because GCC 12 split the `csr`/`fence.i` instructions out of the base "I" ISA string into standalone Zicsr/Zifencei extensions ([mailing-list thread](https://lists.buildroot.org/pipermail/buildroot/2022-July/708978.html)).
- **GCC >= 15 is now required for glibc+RVV** per a pending (unmerged as of research date) patch guarding `package/glibc/Config.in`: `depends on (BR2_RISCV_ISA_RVV && BR2_TOOLCHAIN_GCC_AT_LEAST_15) || !BR2_riscv` ([Patchwork](https://patchwork.buildroot.org/project/buildroot/patch/20260607213030.1509913-2-romain.naour@smile.fr/)).
- Buildroot's internal toolchain backend only builds GCC; there is no internal Clang/LLVM target-toolchain path, and no minimum Clang version is documented for riscv64 because that path is unsupported/untested upstream.
- Binutils >= 2.30 required for a bootable RISC-V kernel [NEEDS VERIFICATION - single-source, general Buildroot RISC-V documentation, not the canonical Kconfig/prerequisite file].

**Known build failures** (see Section 11 for the full table): Zicsr/Zifencei ISA-string mismatch (fixed 2022), riscv-isa-sim Boost dependency omission (fix pending, 2025-2026), a WSL/Docker-on-Windows-specific glibc `ar` failure (user-environment issue, not a code defect), uclibc 1.0.54 assembler-flag mismatch on riscv64 (open), LLVM 15 PIC/TLS relocation failure on riscv64 (open).

**Docker CI image** (`support/docker/Dockerfile`, used by GitLab CI): based on `debian:bookworm-20250203`; installs `qemu-system-misc` (the Debian package that provides `qemu-system-riscv64` - riscv64 QEMU is not built specially, it comes from this generic package) alongside `qemu-system-arm`/`qemu-system-x86`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| glibc/musl/uClibc | Yes | Yes | Yes | None |
| OpenSBI/firmware boot chain | N/A (uses BIOS/UEFI paths) | U-Boot/UEFI | OpenSBI + GRUB2 EFI + OP-TEE OS | None functionally relevant |
| Node.js | Yes | Yes | No | Functional gap: cannot build Node.js target images on riscv64 at all (`BR2_PACKAGE_NODEJS_ARCH_SUPPORTS` excludes riscv) |
| Mono/.NET (via mono) | Yes | Yes | No | Functional gap: same exclusion pattern |
| D-language/GDC | Yes | Yes | riscv32 only | Functional gap, narrow: riscv64 users cannot use the D toolchain path |
| RVV (vector) codegen for pixman | N/A (uses SSE/AVX paths) | NEON | Conditionally forced on, open correctness bug when kernel headers lack vector support | Performance/correctness gap: pending unmerged patch as of research date |
| Per-commit CI test execution | No (lint-only per commit for all archs) | No | No | Not riscv64-specific; applies uniformly |
| Boot-tested CI (any form) | Scheduled | Scheduled | Scheduled, but dormant ~10 weeks as of 2026-09-08 | riscv64 CI freshness gap - see Section 7 |

**Performance gaps from missing SIMD/vector coverage:** the pixman RVV path is forced on unconditionally when `BR2_RISCV_ISA_RVV` is set, without checking whether the target kernel/toolchain actually has working vector kernel headers - this produces a hard build failure ("RISC-V Vector Support unavailable, but required") rather than a graceful scalar fallback, until the pending patch lands. This is a correctness/robustness gap, not a raw performance delta.

**Security hardening gaps:** `uclibc`'s SSP (stack-smashing protection) support for riscv32 required an explicit carried patch (`0001-Fix-SSP-support-for-riscv32.patch`), implying SSP was not correct-by-default on riscv32 uclibc builds prior to that fix. No equivalent riscv64-specific SSP gap was found in the research.

**NaN/floating-point semantics:** `package/python-numpy/python-numpy.mk` sets `IEEE_QUAD_LE` long-double format specifically for riscv, indicating riscv's long-double representation required explicit handling distinct from the default path - this is a correctness accommodation already made, not an open gap.

## 7. CI/CD Infrastructure

**Files read directly:** `.gitlab-ci.yml`, `support/misc/gitlab-ci.yml.in`, `support/scripts/generate-gitlab-ci-yml`, `configs/qemu_riscv64_virt_defconfig`, `support/docker/Dockerfile`, plus GitHub mirror `.github/workflows/` (contains only `repo-lockdown.yml`, a stale-issue bot - no build/test workflow).

Buildroot's CI is GitLab CI, in use since the 2017.05 release. It is **generic across all ~269 defconfigs** - there is no dedicated riscv64 CI job file; behavior is entirely driven by which `configs/*_defconfig` files exist, processed identically for every architecture.

**Verified, adversarial pass against the real GitLab API job data (not just template inference):**
- On an ordinary push to master, `support/scripts/generate-gitlab-ci-yml` falls through to `do_basics=true` only: the resulting child pipeline runs exactly 5 jobs, all "check-*" lint jobs (`check-package`, `check-symbol`, `DEVELOPERS`, etc.). **No riscv64 build or test happens on ordinary commits/patches**, confirmed by inspecting several recent push-sourced pipelines from 2026-09-06/07.
- The full defconfig matrix (`do_defconfigs=base`) and runtime tests (`do_runtime=true`) only trigger when `BR_SCHEDULE_JOBS` is set, `CI_COMMIT_TAG` is set, or a pushed branch name matches special patterns (`*-defconfigs-*`, `*-*_defconfig`, `*-defconfigs`).
- The two most recent schedule-sourced child pipelines inspected (2026-06-05/06 and **2026-06-30**) show riscv jobs present and passing: `qemu_riscv64_virt_defconfig`, `qemu_riscv64_virt_efi_defconfig`, `qemu_riscv64_nommu_virt_defconfig`, `spike_riscv64_defconfig` - all `success` (build plus `boot-qemu-image.py` QEMU boot test, via the `.defconfig_base` template). 4 Bootlin external-toolchain riscv64 runtime tests (lp64d, uClibc/musl, stable/bleeding-edge) - all `success`.
- **As of the verification date (2026-09-08), no schedule-sourced pipeline (`pipelines?source=schedule`) has run since 2026-06-30** - roughly 10 weeks of dormancy. It could not be confirmed whether the schedule is disabled, deleted, or simply broken, because the `/pipeline_schedules` API endpoint requires authentication this research could not provide (401 Unauthorized unauthenticated).

**RISE runners:** no evidence found that Buildroot's CI uses RISE RISC-V Runners; the riscv64 CI that exists runs under QEMU emulation in the GitLab-hosted Docker image (`support/docker/Dockerfile`, `qemu-system-misc` package), not on native RISC-V hardware.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Per-commit CI build+test | No (lint-only, all archs) | No | No |
| Scheduled CI build | Yes | Yes | Yes, last run 2026-06-30 |
| Scheduled CI test (boot + toolchain runtime) | Yes | Yes | Yes, last run 2026-06-30; passing when it last ran |
| Native hardware | No (QEMU-based Docker CI) | No | No (QEMU-based) |
| RISE runners in use | No | No | No |
| Release-blocking | No (for any arch, per-commit) | No | No |

**Accurate summary:** riscv64 CI is defined, is not build-only (it performs real QEMU boot tests and toolchain runtime tests), and historically passed as recently as 2026-06-30 - but ordinary per-commit/per-patch CI does not exercise riscv64 at all, and the schedule that does exercise it has produced zero runs for roughly 10 weeks as of this report's verification pass. This is a freshness/reliability caveat on an otherwise-passing configuration, not evidence of breakage.

## 8. Distribution and Release Status

Buildroot publishes **no binary artifacts for any architecture** - it is a source-only build system. This was confirmed across every plausible distribution channel, specifically for riscv64:

- **PyPI**: `https://pypi.org/pypi/buildroot/json` returns **HTTP 404** - no package named `buildroot` exists at all.
- **RISE wheel builder**: redirects to PyPI simple index, which also returns 404.
- **Ubuntu 26.04 ("resolute")**: search for "Buildroot" returns "Sorry, your search gave no results" for any architecture, riscv64 included.
- **Arch Linux RISC-V** (archriscv.felixc.at): no `buildroot` package listed.

**What a user must do to get a working riscv64 image/toolchain:** clone `gitlab.com/buildroot.org/buildroot`, run `make qemu_riscv64_virt_defconfig && make`, wait for the full build (approximate community-reported build time ~22m29s for the QEMU virt defconfig, kernel image ~6.5MB, rootfs ~3.9MB, ~7.8GB disk used during build - [NEEDS VERIFICATION], not attributable to a single authoritative benchmark source), then boot the resulting `output/images/*` artifacts under QEMU or flash to real hardware.

This "no binary release" model is structurally identical across amd64/arm64/riscv64 - it is not a riscv64-specific gap, but it does mean riscv64 support has no equivalent of "download a working image" the way, e.g., a Debian riscv64 port or a RISE-built Python wheel would provide.

## 9. Dependencies

**IMPORTANT LIMITATION:** the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research; every planned SPARQL cross-check against Ubuntu 26.04 riscv64 package status and transitive-dependency enumeration could not be executed. This is a tooling outage, not a confirmed absence of riscv64 support for these dependencies - the table below uses general-knowledge fallback checks where the graph query could not run, clearly marked.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| GCC (host + target cross-compiler) | Mandatory, target toolchain Buildroot builds/uses | graph query not run; riscv64 is a first-class Debian/Ubuntu GCC port [general knowledge, unverified this session] | Not run | Not run | No dedicated Buildroot-side report exists for GCC as a standalone dependency |
| GNU binutils | Mandatory (as/ld/objcopy, host+target) | graph query not run | Not run | Not run | Required >= 2.30 for bootable riscv kernels [NEEDS VERIFICATION] |
| GNU Make >= 3.81 | Mandatory build driver | graph query not run | Not run | Not run | Architecture-agnostic |
| Perl >= 5.8.7 | Mandatory, used by kconfig and package scripts | graph query not run | Not run | Not run | Architecture-agnostic |
| Python3 | Optional-but-effectively-required | graph query not run | Not run | Not run | Buildroot itself (the tool) is Python-independent for its core `make` path; Python3 target package builds are covered separately in Buildroot's own Python3 support (not benchmarked here) |
| glibc / musl / uClibc-ng | Target C libraries selected per defconfig | Full riscv64 support confirmed (Section 4) | N/A | N/A | Actively patched for riscv (pending Jun 2026 RVV/GCC-15 glibc guard) |
| Linux kernel headers | Mandatory for any `BR2_LINUX_KERNEL` target build | riscv64 kernel builds confirmed via `qemu_riscv64_virt_defconfig` (Linux 6.18.7) | Boot-tested via scheduled CI (Section 7) | N/A (source-fetched per build) | |
| OpenSBI | RISC-V-specific boot firmware, mandatory for riscv64 target boot | Full, current (1.6 in the reference defconfig) | Boot-tested via scheduled CI | N/A | RISC-V-only dependency; no amd64/arm64 equivalent |
| QEMU (host, `BR2_PACKAGE_HOST_QEMU`) | Test/boot-verification tool for riscv64 defconfigs | Confirmed working via CI (`qemu-system-riscv64`, from Debian's generic `qemu-system-misc` package) | Yes, used as the boot-test mechanism itself | N/A | |
| bzip2, GNU patch, gawk, bison/flex, CMake, ncurses, Git, tar/cpio/unzip/rsync/etc. | Mandatory or common host build utilities | graph queries not run; these are core/main-archive POSIX tools present on essentially every Debian/Ubuntu port including riscv64 as a general rule [general knowledge, unverified this session] | Not run | Not run | Low risk given their ubiquity, but formally unverified this session |

**Deep-dive: OpenSBI** (the one dependency with genuine RISC-V-specific engineering content) is tracked at current upstream version (1.6 in the live `qemu_riscv64_virt_defconfig`) and has been kept current across the 2023 "various fixes" series (1.2->1.3) and later bumps; no open OpenSBI-related Buildroot bug was found in this research pass.

**Outstanding gap:** re-run the `project-graph` SPARQL queries once connectivity is restored to get authoritative Ubuntu 26.04 riscv64 package-level confirmation for GCC, binutils, Perl, gawk, bison, CMake, and Linux kernel headers - none of these currently has a dedicated `project-reports` entry despite being hard Buildroot build blockers.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #111](https://gitlab.com/buildroot.org/buildroot/-/issues/111) | Error to build qemu_riscv64_virt_defconfig (glibc `ar` failure) | Closed | Low | Root-caused to WSL/Docker-on-Windows filesystem quirks, not a riscv64 code defect; workaround was switching to musl |
| [Issue #166](https://gitlab.com/buildroot.org/buildroot/-/issues/166) | micropython-lib does not install expected libraries | Closed | Low | Reproduced via riscv64 defconfigs but is a generic micropython-lib packaging defect, not riscv-specific; fixed by bumping micropython-lib version |
| [Issue #149](https://gitlab.com/buildroot.org/buildroot/-/issues/149) | uclibc fails to build on riscv64 (`__syscall_error.os`, `as: invalid option -- 'p'`) | **Open** | Medium (correctness/build-blocking for uclibc+riscv64 combination) | No maintainer response recorded as of research date |
| [Issue #101](https://gitlab.com/buildroot.org/buildroot/-/issues/101) | Default LLVM (v15) build fails on riscv64: `R_RISCV_TPREL_HI20` relocation error at final link despite `LLVM_ENABLE_PIC=ON` | **Open** | Medium (build-blocking for LLVM+riscv64) | Still open/unresolved as fetched |
| [Issue #81](https://gitlab.com/buildroot.org/buildroot/-/issues/81) | uemacs fails to compile with GCC 14 on riscv | **Open** | Low (GCC-14-strictness issue, not riscv-specific per se, but hit on a riscv config) | `implicit declaration of function 'cuserid'` |
| [Issue #63](https://gitlab.com/buildroot.org/buildroot/-/issues/63) | lmbench `socklen_t` redeclaration conflict on riscv64 cross-compile | Closed (underlying riscv64 issue fixed via [commit `80f25d47`](https://gitlab.com/buildroot.org/buildroot/-/commit/80f25d47060dea19b8f3b5fd84b6238375c54729)) | Low, residual complaint is unsupported-GCC-15 configuration | Maintainer declined to chase the GCC-15 residual further |
| Pending Patchwork: `package/glibc` RVV+GCC>=15 guard | Guards RVV glibc build against toolchains < GCC 15 | **New/unmerged** as of research date | Medium (correctness for RVV+glibc users on older toolchains) | [Patch](https://patchwork.buildroot.org/project/buildroot/patch/20260607213030.1509913-2-romain.naour@smile.fr/) |
| Pending Patchwork: `package/pixman` RVV requirement fix | Prevents pixman from unconditionally requiring RVV vector support | **New/unmerged**, resent after apparent loss via gmane.io address rewriting | Medium (build-blocking on toolchains lacking vector kernel headers) | [Patch](https://patchwork.buildroot.org/project/buildroot/patch/20260307114256.325624-1-bernd@kuhls.net/) |
| Pending Patchwork: `package/riscv-isa-sim` host-boost dependency | Affirms Boost dependency for the Spike simulator package | **New/unmerged**, part of a 29-patch series | Low | [Patch](https://patchwork.buildroot.org/project/buildroot/patch/552592df3604c5fc2d601f4d1a837db562193bb6.1744229017.git.yann.morin.1998@free.fr/) |

**Correctness-bug theme:** GCC ISA-string churn (Zicsr/Zifencei split at GCC 12; RVV now requiring GCC >= 15 for glibc 2.43) is the single most recurring riscv64 pain point spanning 2022-2026, appearing in both merged fixes and currently-pending patches. RVV enablement specifically remains an active, currently-unfinished front (pixman and glibc guards both pending as of research date).

Note: `bugs.buildroot.org` (the project's original Redmine-based tracker, if still authoritative) was unreachable throughout this research (connection reset/timeout on every attempt, not an HTTP error) - the issues above come from GitLab Issues and mailing-list/Patchwork threads instead, which may not be the complete set of currently-open riscv64-tagged bugs.

## 12. Objections and Upstream Blockers

**No stated objection to riscv64 as an architecture was found anywhere in the research.** Buildroot accepted riscv64 in 2018 on the same terms as any other architecture (real upstream toolchain + libc support, standard defconfig/build/boot bar) and has continued to accept riscv-related patches (32-bit, no-MMU, RVV, EFI boot, OP-TEE) through 2026 without any recorded maintainer pushback on the architecture itself. The one recorded maintainer pushback (Petazzoni on the 2022 Zicsr/Zifencei patch) was about *implementation approach* (Kconfig options vs. an automatic `-march` suffix), not about riscv64 support in principle, and was resolved same-day with a revised patch.

**Technical blockers (open, narrow in scope):** uclibc riscv64 assembler-flag mismatch (Issue #149), LLVM 15 PIC/TLS relocation failure on riscv64 (Issue #101), and the RVV-enablement gaps in pixman and glibc (both pending patches as of research date). None of these are architectural blockers - they are package-level build defects surfacing on riscv64 configurations, comparable in kind to bugs any architecture accumulates.

**Organizational factors:**
- Buildroot is **not a RISE member and is not listed among RISE's funded projects**. RISE membership is limited to companies (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE), not upstream projects.
- RISE's own materials indicate its embedded-build-system engagement has gone to **Yocto**, not Buildroot ([RISE blog: "Improving RISC-V Support in the Yocto Project," 2026-06-05](https://riseproject.dev/2026/06/05/)) - confirmed by exhaustively searching all 34 RISE blog posts, the RISE wheel-builder package list, and all 30 riseproject-dev GitHub org repositories: none reference Buildroot.
- RISE's own site search (`riseproject.dev/?s=buildroot`) returns "Sorry, no results were found."
- No RISE funding, board-farm access, or CI-runner allocation has been directed at Buildroot as of this research date.

**Acceptance probability for further riscv64 investment:** high. The maintainers have a consistent 8-year track record of merging riscv-related patches through routine review with no architectural objection; the blockers that exist are ordinary package-level bugs, not upstream resistance. The main risk to grade stability is the currently-dormant CI schedule (Section 7), which is an infrastructure/operations issue rather than a technical or governance blocker.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** none (Buildroot publishes no binary release for any architecture, riscv64 included; this is structural, not riscv64-specific)
- **Justification:** Upstream GitLab CI defines and has run a genuine riscv64 build-and-test matrix - four defconfigs (`qemu_riscv64_virt`, `qemu_riscv64_virt_efi`, `qemu_riscv64_nommu_virt`, `spike_riscv64`) each build and QEMU-boot-test, plus four Bootlin riscv64 toolchain runtime tests - all confirmed `success` in the most recent schedule-triggered pipeline run (2026-06-30), verified via the GitLab pipelines API rather than inferred from the CI template. This is real test execution (boot verification, not merely a build step), which is why it does not cap at yellow. There is no upstream riscv64 binary artifact, which is why it does not reach green - but this is true of every architecture Buildroot supports, since the project has no binary-distribution model at all; riscv64's own "artifact" is complete, upstream, in-tree source-level support (Kconfig/arch glue, defconfigs, 12 toolchain variants), continuously maintained since 2018.
- **Pending work that could change the grade:** the riscv64-exercising schedule has produced zero runs in the ~10 weeks preceding this report's verification pass (2026-09-08); whether it is disabled, broken, or simply not yet re-triggered could not be confirmed (the GitLab pipeline-schedule config endpoint requires authentication this research could not obtain). If the schedule is confirmed permanently disabled with no successor mechanism, this would be a material downgrade risk requiring re-verification, since the color rests on the (currently unrefreshed) 2026-06-30 pass. Three RISC-V patches are currently pending in Patchwork and unmerged as of the research date - `package/glibc` RVV+GCC>=15 guard, `package/pixman` RVV-requirement fix, and `package/riscv-isa-sim` host-boost fix - closing these would reduce the open-bug count in Section 11 but would not by itself change the color, since the CI-based primary grade is not driven by open non-blocking bugs. No RISE involvement exists to accelerate this project; any investment here proceeds entirely through the existing mailing-list/Patchwork process.

## 14. Investment Analysis

RISE has made **no investment of any kind** in Buildroot (Section 12) - no funded project, no blog coverage, no CI runners, no wheel-builder or binary-release involvement. All sizing below assumes a zero baseline of RISE-provided work; nothing needs to be excluded as "already covered."

### 14.1 Functional Enablement

The functional core (base riscv64 architecture, toolchains, C libraries, boot chain, kernel/QEMU test targets) is complete and has been for years - this is not where investment is needed. The concrete open functional gaps are narrow and package-level: the uclibc riscv64 assembler-flag failure (Issue #149), the LLVM 15 riscv64 PIC/TLS relocation failure (Issue #101), and finishing the RVV-enablement patches already posted upstream (pixman, glibc/GCC-15 guard, riscv-isa-sim host-boost). Node.js and Mono remain architecturally excluded from riscv64 target builds, which would require upstream Node.js/Mono riscv64 support first (outside Buildroot's control) before Buildroot's `ARCH_SUPPORTS` gating could be lifted.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Buildroot itself performs no computation subject to optimization; it configures third-party packages. The one riscv64-relevant performance-adjacent item is RVV enablement across dependent packages (pixman, dav1d, ffmpeg, highway), which is package-by-package and already has upstream momentum (pending patches exist without RISE involvement).

### 14.3 CI/CD Infrastructure

This is the area with the clearest, lowest-cost, highest-leverage investment opportunity: the riscv64-exercising GitLab CI schedule has not fired in ~10 weeks as of 2026-09-08. Diagnosing and restoring this schedule (or reporting it to the Buildroot maintainers via the mailing list) is a small effort with outsized signal value, since it is the only mechanism currently validating riscv64 build+boot health. A further, larger-effort option is upgrading riscv64 from schedule-only to per-commit/PR-gating CI - but note this would be a change to Buildroot's *entire* CI philosophy (no architecture is currently per-commit-gated), not a riscv64-specific ask, and would require buy-in from all five maintainers.

### 14.4 Ecosystem Enablement

Not applicable - Buildroot has no dependent package ecosystem in the sense Section 10 would cover (it is not itself an ecosystem of installable packages; see the Section 10 omission note in Section 10 header).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Investigate and restore the dormant GitLab CI riscv64 schedule (`BR_SCHEDULE_JOBS`); report to buildroot@buildroot.org if it is broken upstream-side | 0.5-1 | Any contributor with GitLab maintainer contact | Critical |
| Functional | Fix uclibc riscv64 assembler-flag build failure ([Issue #149](https://gitlab.com/buildroot.org/buildroot/-/issues/149)) | 1-2 | Toolchain engineer, mailing-list patch | High |
| Functional | Fix LLVM 15 riscv64 PIC/TLS relocation failure at final link ([Issue #101](https://gitlab.com/buildroot.org/buildroot/-/issues/101)) | 2-4 | Compiler/toolchain engineer | High |
| Functional | Review and help land the three pending RVV-related patches (glibc/GCC-15 guard, pixman RVV fix, riscv-isa-sim host-boost) already posted upstream | 0.5-1 (review/testing support only, patches already written) | Any contributor, mailing-list review | Medium |
| CI/CD | Propose native RISC-V hardware or RISE-runner-backed CI (currently 100% QEMU-emulated) to the mailing list, if faster/more representative signal is desired | 2-3 (proposal + integration, pending maintainer buy-in) | Infra engineer + mailing-list negotiation | Medium |
| Dependencies | Re-run `project-graph` SPARQL queries for GCC/binutils/Perl/gawk/bison/CMake/Linux-kernel-headers riscv64 Ubuntu 26.04 status once connectivity is restored | 0.25 | Any engineer with working project-graph access | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Buildroot GitLab repository (canonical)](https://gitlab.com/buildroot.org/buildroot)
- [Buildroot homepage](https://buildroot.org/)
- [Buildroot Association](https://buildroot.org/association.html)
- [Buildroot Sponsors](https://buildroot.org/sponsors.html)
- [GitHub mirror (read-only)](https://github.com/buildroot/buildroot)
- [arch: add support for RISC-V 64-bit (riscv64) architecture](https://lists.buildroot.org/pipermail/buildroot/2018-September/219312.html)
- [boot/riscv-pk: add bootloader for RISC-V architecture](https://lists.buildroot.org/pipermail/buildroot/2018-September/219310.html)
- [configs/qemu_riscv64_virt: new defconfig](https://lists.buildroot.org/pipermail/buildroot/2018-September/219311.html)
- [Embecosm: Adding RISC-V 64-bit Support to Buildroot (2018-09-19)](https://embecosm.com/2018/09/19/adding-risc-v-64-bit-support-to-buildroot/)
- [Embecosm: Buildroot Support for 32-bit RISC-V (2019-04-01)](https://embecosm.com/2019/04/01/buildroot-support-for-32-bit-risc-v/)
- [Bootlin: Buildroot 2018.11 released](https://bootlin.com/blog/buildroot-2018-11-released-bootlin-contributions-inside/)
- [arch/Config.in.riscv: add Zicsr and Zifencei standalone extensions](https://lists.buildroot.org/pipermail/buildroot/2022-July/708978.html)
- [package/go: fix go on riscv64 in sv57 mode](https://lists.buildroot.org/pipermail/buildroot/2022-July/332607.html)
- [package/llvm: Support for RISC-V on the LLVM package](https://lore.kernel.org/all/20220723215448.2532160-1-abel@x-silicon.com/t/)
- [riscv: Various fixes and small enhancements (10-patch series, 2023-06)](https://lists.buildroot.org/pipermail/buildroot/2023-June/354844.html)
- [package/libopenssl: patch for riscv32 builds](https://lore.kernel.org/buildroot/20231223070730.2417463-1-me@grantnichol.com/)
- [boot/grub2: add RISC-V 64bit EFI support](https://lists.buildroot.org/pipermail/buildroot/2023-December/743782.html)
- [boot: optee-os: enable RISC-V (64-bit) architecture](https://lists.buildroot.org/pipermail/buildroot/2024-September/762985.html)
- [configs/riscv/qemu: Drop BR2_TARGET_OPENSBI_CUSTOM_VERSION](https://lists.buildroot.org/pipermail/buildroot/2024-August/761499.html)
- [arch/riscv: RISC-V 32-bit NO MMU support (v1, never merged)](https://lists.busybox.net/pipermail/buildroot/2022-November/341510.html)
- [Patchwork: package/glibc RVV requires gcc>=15 (pending)](https://patchwork.buildroot.org/project/buildroot/patch/20260607213030.1509913-2-romain.naour@smile.fr/)
- [Patchwork: package/pixman RVV fix (pending)](https://patchwork.buildroot.org/project/buildroot/patch/20260307114256.325624-1-bernd@kuhls.net/)
- [Patchwork: package/riscv-isa-sim host-boost dependency (pending)](https://patchwork.buildroot.org/project/buildroot/patch/552592df3604c5fc2d601f4d1a837db562193bb6.1744229017.git.yann.morin.1998@free.fr/)
- [GitLab Issue #111: qemu_riscv64_virt_defconfig build error](https://gitlab.com/buildroot.org/buildroot/-/issues/111)
- [GitLab Issue #166: micropython-lib install issue](https://gitlab.com/buildroot.org/buildroot/-/issues/166)
- [GitLab Issue #149: uclibc fails to build on riscv64](https://gitlab.com/buildroot.org/buildroot/-/issues/149)
- [GitLab Issue #101: default llvm (v15) build fails on riscv64](https://gitlab.com/buildroot.org/buildroot/-/issues/101)
- [GitLab Issue #81: uemacs fails to compile with GCC 14](https://gitlab.com/buildroot.org/buildroot/-/issues/81)
- [GitLab Issue #63: socklen_t redeclaration conflict (lmbench, riscv64)](https://gitlab.com/buildroot.org/buildroot/-/issues/63)
- [GitLab commit 80f25d47: lmbench riscv64 fix](https://gitlab.com/buildroot.org/buildroot/-/commit/80f25d47060dea19b8f3b5fd84b6238375c54729)
- [.gitlab-ci.yml (root)](https://gitlab.com/buildroot.org/buildroot/-/raw/master/.gitlab-ci.yml)
- [support/misc/gitlab-ci.yml.in](https://gitlab.com/buildroot.org/buildroot/-/raw/master/support/misc/gitlab-ci.yml.in)
- [support/scripts/generate-gitlab-ci-yml](https://gitlab.com/buildroot.org/buildroot/-/raw/master/support/scripts/generate-gitlab-ci-yml)
- [configs/qemu_riscv64_virt_defconfig](https://gitlab.com/buildroot.org/buildroot/-/raw/master/configs/qemu_riscv64_virt_defconfig)
- [linuxembedded.fr: Buildroot GitLab-CI testing (Jan 2022)](https://linuxembedded.fr/)
- [SiFive Forums: riscv64-buildroot-linux-gnu not supported](https://forums.sifive.com/t/riscv64-buildroot-linux-gnu-not-supported/739)
- [Swift Forums: Linux RISCV64 Support](https://forums.swift.org/t/linux-riscv64-support/56030)
- [Google Groups: Buildroot RV32 Linux thread](https://groups.google.com/a/groups.riscv.org/g/sw-dev/c/2ZGtghkgajk)
- [RISE Project homepage](https://riseproject.dev)
- [RISE blog: RISE 2024 End of Year Ecosystem Update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [RISE blog: Improving RISC-V Support in the Yocto Project (2026-06-05)](https://riseproject.dev/2026/06/05/)
- [RISE Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [Igalia blog: Boosting RISC-V Application Performance - An 8-Month LLVM Journey](https://blogs.igalia.com/compilers/2025/05/05/boosting-risc-v-application-performance-an-8-month-llvm-journey/)
- [riscvarchive/riscv-buildroot (historical pre-upstream fork)](https://github.com/riscvarchive/riscv-buildroot/wiki)
- [T-head-Semi/buildroot (vendor fork)](https://github.com/T-head-Semi/buildroot)
