---
title: Linux kernel
parent: Project Reports
color: yellow
dependencies:
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
---

{% include dependency-graph.html slug="dependencies" subset="linux-kernel" %}

# Linux kernel

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (roll-up of the per-subsystem reports)<br/>
**Scope:** RISC-V (riscv64/linux) support status for the Linux kernel as a whole<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source or to the per-subsystem report that holds the evidence. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

The Linux kernel is too large to assess in one report. This page is the index and roll-up. The evidence lives in one report per subsystem, each titled "Linux &lt;topic&gt;", plus eight older reports on kernel components (eBPF, linux-perf, Linux RAS, hwmon, V4L2, WireGuard, pKVM and GKI/KMI). Every one of those reports is about riscv64. Read this page to find the right subsystem report and to see the overall picture. Read the subsystem report for any decision about a specific feature.

- Repository: [torvalds/linux on git.kernel.org](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git). Development is by mailing list, not by GitHub pull requests.
- Home: [kernel.org](https://www.kernel.org/). Architecture documentation: [docs.kernel.org/arch/riscv](https://docs.kernel.org/arch/riscv/index.html).
- Licence: GPL-2.0 for the kernel as a whole (individual files carry SPDX tags).
- The kernel clone used for the subsystem reports is at HEAD `05441d697f7f`, which is `v7.4-rc1-132` (2026-11-03).

**Governance.** There is no foundation that owns the RISC-V port. It is developed in the kernel maintainer-tree model. Patches for `arch/riscv` go to the linux-riscv mailing list and the RISC-V tree at `git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`, then to Linus Torvalds. Subsystem code (networking, storage, DRM and so on) goes through the subsystem maintainers.

**RISC-V architecture maintainers** (`RISC-V ARCHITECTURE` entry in `MAINTAINERS`, status Supported): Paul Walmsley, Palmer Dabbelt and Albert Ou; Alexandre Ghiti is a reviewer. The entry covers `arch/riscv/` and lists the patchwork instance at `patchwork.kernel.org/project/linux-riscv/list/` and the process document `Documentation/arch/riscv/patch-acceptance.rst`.

**Who writes the code.** Among the 777 non-merge commits that touched `arch/riscv` in the year to 2026-11-03, the most common author email domains were gmail.com (113), kernel.org (95), iscas.ac.cn (64), linutronix.de (33), aurel32.net (31), rivosinc.com (28), linux.dev (23), microchip.com, huawei.com and bytedance.com (22 each), and oss.qualcomm.com and kylinos.cn (20 each). Personal and kernel.org addresses hide the real employer, so this is a rough guide only. ISCAS (a RISE general member) is the largest identifiable single organisation in the sample. Source: `git log` on the local kernel clone.

**RISE Project.** RISE runs a pre-commit CI for the linux-riscv list (see section 7). The per-subsystem reports record which subsystems have RISE-visible work.

**Community stance on new RISC-V code.** `Documentation/arch/riscv/patch-acceptance.rst` states the rule. New ISA extensions are accepted only when the specification is frozen or ratified, or when the extension is implemented in hardware that is widely available. The linux-riscv patchwork instance builds and tests each series, and series that fail are unlikely to be applied. Source: [kernel RISC-V documentation](https://docs.kernel.org/arch/riscv/index.html).

## 2. Port History and Upstreaming Timeline

The RISC-V port has been in mainline since Linux 4.15, released 2018-01-28 (tag date in the clone). The core port is therefore eight years old, and almost everything that was once out of tree has been merged. The per-subsystem reports hold the dated tables. The summary of where each piece first landed, taken from those reports:

| Area | First mainline release | Report |
|---|---|---|
| Core port (boot, MMU, traps, signals, ptrace) | 4.15 | [Linux boot and MMU](linux-boot-and-mmu.md) |
| First SoC (SiFive FU540) | 5.2 | [Linux SoC support](linux-soc-support.md) |
| Seccomp filter | 5.5 | [Linux security modules](linux-security-modules.md) |
| KVM | 5.16 | [Linux KVM](linux-kvm.md) |
| Time-namespace vDSO | 5.16 | [Linux cgroups and namespaces](linux-cgroups-and-namespaces.md) |
| SBI HSM cpuidle | 5.18 | [Linux power management](linux-power-management.md) |
| Vector (RVV) user space | 6.5 | [Linux Vector](linux-vector.md) |
| RISC-V checksum with Zbb | 6.8 | [Linux networking](linux-networking.md) |
| Vector crypto | 6.9 | [Linux crypto](linux-crypto.md) |
| RISC-V IOMMU | 6.13 | [Linux IOMMU](linux-iommu.md) |
| Hardware-error trap to `SIGBUS` | 7.1 | [Linux RAS](linux-ras.md) |

The major arch features that are still being worked on at the time of writing are listed in the "Pending work" sections of the subsystem reports and consolidated in section 11. No single tracking issue exists. Work is tracked on the linux-riscv list and in patchwork.

## 3. Upstream Support Tier

riscv64 is a first-class architecture in mainline:

- `RISC-V ARCHITECTURE` is "Supported" in `MAINTAINERS`.
- `arch/riscv/` has about 4,500 non-merge commits in the clone's history, of which 777 are from the last twelve months.
- `tools/testing/selftests/riscv/` has six test directories (`abi`, `cfi`, `hwprobe`, `mm`, `sigreturn`, `vector`).
- `Documentation/arch/riscv/` documents boot, vector, hwprobe, patch acceptance and more.
- The KUnit QEMU runner has a RISC-V configuration (`tools/testing/kunit/qemu_configs/riscv.py`).

Limits of the tier:

- The kernel tree has no CI configuration of its own for riscv64 (no `.github` workflow or GitLab pipeline in the tree, as several subsystem reports confirmed from the clone). Continuous testing is external: the linux-riscv GitHub CI, patchwork checks, KernelCI, syzbot and distro build farms.
- Upstream ships source only. The consumable riscv64 kernels are distro kernels, so the grade for most subsystems depends on distro configuration and patch state, which the subsystem reports mostly could not verify.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The kernel divides into architecture code under `arch/riscv` and architecture-independent subsystems that need RISC-V glue. The subsystem reports follow that split.

**Architecture code (RISC-V specific).**

| Subsystem | Readiness | Report |
|---|---|---|
| Boot and MMU (Sv39/48/57, KASLR, SMP, NOMMU) | green | [Linux boot and MMU](linux-boot-and-mmu.md) |
| Boot flow (EFI stub, kexec/kdump, ACPI) | orange | [Linux boot flow](linux-boot-flow.md) |
| SBI client | orange | [Linux SBI](linux-sbi.md) |
| ISA discovery and hwprobe | yellow | [Linux ISA discovery](linux-isa-discovery.md) |
| Vector (RVV) | blue | [Linux Vector](linux-vector.md) |
| Interrupts and timers (PLIC, AIA, Sstc) | yellow | [Linux interrupts and timers](linux-interrupts-and-timers.md) |
| SoC and device-tree support | blue | [Linux SoC support](linux-soc-support.md) |
| Power management | yellow | [Linux power management](linux-power-management.md) |
| IOMMU | yellow | [Linux IOMMU](linux-iommu.md) |
| RAS | orange | [Linux RAS](linux-ras.md) |

**Core kernel subsystems (mostly architecture independent).**

| Subsystem | Readiness | Report |
|---|---|---|
| Memory management | yellow | [Linux memory management](linux-memory-management.md) |
| Scheduler and locking | yellow | [Linux scheduler and locking](linux-scheduler-and-locking.md) |
| KVM | yellow | [Linux KVM](linux-kvm.md) |
| Tracing | yellow | [Linux tracing](linux-tracing.md) |
| Hardening | yellow | [Linux hardening](linux-hardening.md) |
| Security modules | yellow | [Linux security modules](linux-security-modules.md) |
| Crypto | yellow | [Linux crypto](linux-crypto.md) |
| Cgroups and namespaces | orange | [Linux cgroups and namespaces](linux-cgroups-and-namespaces.md) |

**Drivers and I/O subsystems.**

| Subsystem | Readiness | Report |
|---|---|---|
| Filesystems | yellow | [Linux filesystems](linux-filesystems.md) |
| Storage (block, NVMe, MMC, SPI NOR, MD) | yellow | [Linux storage](linux-storage.md) |
| Networking | yellow | [Linux networking](linux-networking.md) |
| DRM | orange | [Linux DRM](linux-drm.md) |
| USB, input and sound | yellow | [Linux USB input and sound](linux-usb-input-and-sound.md) |

**Older reports on kernel components.**

| Component | Readiness | Report |
|---|---|---|
| eBPF | yellow | [eBPF](ebpf.md) |
| linux-perf | yellow | [linux-perf](linux-perf.md) |
| hwmon | yellow | [hwmon](hwmon.md) |
| V4L2 (Video4Linux2) | orange | [V4L2 (Video4Linux2)](v4l2-(video4linux2).md) |
| WireGuard | blue | [WireGuard](wireguard.md) |
| GKI/KMI | yellow | [GKI/KMI](gki-kmi.md) |
| pKVM | grey | [pKVM](pkvm.md) |

The kernel tooling and ecosystem areas (userspace libraries, language bindings, distro packaging) do not have a "Linux &lt;topic&gt;" report. Where they matter they are separate projects with their own reports.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel builds with Kbuild and Kconfig using GNU make. There is no CMake or configure step. Cross-compilation for riscv64 uses `ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu-`, and a Clang build uses `LLVM=1`. The documented minimum toolchain versions are in `Documentation/process/changes.rst` and `Documentation/kbuild/llvm.rst` of the clone, and the per-subsystem reports record the values they read (for example [Linux networking](linux-networking.md) records the raise of the minimum LLVM to 17.0.1 in commit `ce3267a39a92`).

- Default configuration: `make ARCH=riscv defconfig`, from `arch/riscv/configs/defconfig`. There is also a `hardening.config` fragment under `arch/riscv/configs/`.
- The device-tree compiler (dtc) is needed to build the device trees under `arch/riscv/boot/dts`, which has one directory per SoC vendor.
- Rust support depends on the toolchain and is not assessed here [NEEDS VERIFICATION].
- Both GCC and Clang can build riscv64 kernels. Several subsystem reports record compiler-specific gates, for example DRM_AMD_DC_FP being disabled for RISC-V with Clang ([Linux DRM](linux-drm.md)).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Detailed feature tables are in the subsystem reports. The cross-cutting picture:

**Strong, close to arm64 and x86 for the common cases.**

- Boot, MMU, SMP, signals, ptrace, modules, KASLR ([Linux boot and MMU](linux-boot-and-mmu.md)).
- Vector extension for user space with ptrace and uaccess support ([Linux Vector](linux-vector.md)).
- SoC enablement: about a dozen vendor directories in `arch/riscv/boot/dts` and a long list of SoC families in `Kconfig.socs` ([Linux SoC support](linux-soc-support.md)).
- Architecture-independent subsystems (filesystems, networking, USB, input, sound) work because the code is portable C. The riscv-specific parts are SoC glue and a few library accelerators.

**Present but thinner than on arm64 and x86.**

- Hardening: KASAN, KFENCE, SCS, kCFI, stack protector and user CFI exist, but kernel-mode hardware CFI is still pending ([Linux hardening](linux-hardening.md)).
- Tracing, KVM and power management are functional, with a few features still on the list (see each report).
- IOMMU: the RISC-V IOMMU driver landed in 6.13, much later than the equivalent arm64 and x86 drivers.

**Missing or minimal.**

- RAS: ACPI APEI/GHES cannot be built on riscv64 because `arch/riscv/Kconfig` does not select `HAVE_ACPI_APEI` ([Linux RAS](linux-ras.md)).
- pKVM: arm64 only ([pKVM](pkvm.md)).
- DRM: the upstream DRM CI does not build or test riscv64 ([Linux DRM](linux-drm.md)).
- GKI/KMI: no Android release ships a supported riscv64 GKI ([GKI/KMI](gki-kmi.md)).

**Performance.** No cross-cutting benchmark exists. Kernel-level optimisations that matter are the vector and crypto code paths (RAID-5/6 XOR in RVV, vector AES, ChaCha20 with Zvkb, Zbc CRC). See [Linux crypto](linux-crypto.md) and [Linux storage](linux-storage.md).

## 7. CI/CD Infrastructure

There is no single kernel CI. The facts the subsystem reports established:

| Infrastructure | riscv64 coverage found | Where documented |
|---|---|---|
| In-tree CI | none; the tree defines no riscv64 pipeline | all reports |
| linux-riscv GitHub CI (patchwork-triggered) | cross-builds, QEMU boots (rv64 and rv32), kselftest including `riscv/mm` | [Linux boot and MMU](linux-boot-and-mmu.md) |
| RISE Linux kernel pre-commit CI | builds, QEMU boots and generic kselftests | [Linux storage](linux-storage.md) |
| KernelCI | riscv64 kernel builds (gcc-14) and baseline boots on several boards; kselftest-net runs on x86_64 only; LTP filesystem and net jobs on arm and arm64 | [Linux filesystems](linux-filesystems.md), [Linux networking](linux-networking.md) |
| syzbot | a riscv64 QEMU instance (`ci-qemu2-riscv64`) exists | [Linux USB input and sound](linux-usb-input-and-sound.md), [Linux interrupts and timers](linux-interrupts-and-timers.md) |
| 0-day / kernel test robot | cross-builds including `tools/perf` for riscv64 | [linux-perf](linux-perf.md) |
| Subsystem CI (DRM, BPF) | DRM CI riscv64 jobs are disabled; BPF CI has no riscv64 matrix entry yet | [Linux DRM](linux-drm.md), [eBPF](ebpf.md) |
| LKFT | not verified for riscv64 in any report | all reports |

The main finding is that the architecture builds and boots in CI, but subsystem-specific test suites (blktests, xfstests, kselftest-net, KVM selftests, iommufd selftests, hardening tests) generally do not run on riscv64. That gap is why most subsystems grade yellow rather than blue.

## 8. Distribution and Release Status

Upstream publishes source tarballs and git tags. Mainline releases from kernel.org are the only upstream releases. All consumable riscv64 kernels come from distributions.

- Ubuntu 26.04 (resolute) ships `linux-image-generic` for riscv64 (7.0.0-14 and 7.0.0-42 are cited by different subsystem reports).
- Debian, Arch Linux RISC-V and openSUSE are cited as shipping riscv64 kernels in several subsystem reports. Whether each distro enables every subsystem is mostly unverified.
- Android: the AOSP branch `android-mainline-riscv64` exists, but the release GKI branches carry no riscv64 GKI ([GKI/KMI](gki-kmi.md)).
- No PyPI, npm or OCI artifact applies to the kernel itself.

Because the grade rules look at the release provider, almost every kernel subsystem is graded with "release provider: distro".

## 9. Dependencies

The kernel needs a compiler, an assembler and linker, the device-tree compiler, and, at run time on real hardware or virtual machines, M-mode firmware that implements SBI.

| Dependency | Relation | Why |
|---|---|---|
| OpenSBI | runtime | SBI firmware for TIME, IPI, RFENCE, HSM, SRST and the extensions listed in [Linux SBI](linux-sbi.md) |
| GCC | build | default compiler |
| GNU binutils | build | assembler and linker |
| LLVM | build (optional) | `LLVM=1` builds |
| dtc | build (optional) | device trees |
| QEMU | test (optional) | the usual way to boot and test riscv64 kernels in CI |
| LTP | test (optional) | the Linux Test Project runs in KernelCI |

**Dependents.** 51 project reports in this repository list the Linux kernel as a dependency, including 20 of the reports whose file name starts with `linux-`. Container runtimes, virtualisation stacks, eBPF tooling and Android components are the main consumers.

## 10. Ecosystem Status

Ecosystem projects that sit on top of the kernel (container runtimes, libvirt, QEMU, rust-vmm, observability tools) have their own reports. This report does not repeat them.

## 11. Known Bugs and Active Issues

There is no single bug tracker. Bugs are on the mailing lists, syzbot, distro trackers and vendor trees. The subsystem reports list the ones they found. The most consequential cross-cutting items:

- **No riscv64 RAS firmware-first path.** `HAVE_ACPI_APEI` is not selected. See [Linux RAS](linux-ras.md).
- **Kernel-mode hardware CFI** is still pending. See [Linux hardening](linux-hardening.md).
- **DRM CI** for riscv64 is disabled with `when: never` in the tree. See [Linux DRM](linux-drm.md).
- **Test coverage gaps** in storage, networking, KVM and IOMMU on riscv64 (section 7).
- **PowerVR NULL dereference** reachable from an ioctl on a RISC-V kernel was fixed in v7.2-rc5 (commit `17e2030f3760`). See [Linux DRM](linux-drm.md).
- **Ftrace selftest panic** seen on 6.12-rc1 in an experimental CI run, with no later status found. See [Linux tracing](linux-tracing.md).
- **K1 Ethernet receive throughput** well below line rate on one board in one test report. See [Linux networking](linux-networking.md).

## 12. Objections and Upstream Blockers

- No subsystem report found an upstream maintainer objecting to RISC-V support as such. The mailing-list archives (lore.kernel.org) and syzbot dashboards were not reviewable for several reports, so absence of objections is [NEEDS VERIFICATION] in those reports.
- The extension acceptance rule (frozen or ratified, or widely available hardware) is the policy gate for new ISA features.
- The bottleneck is mostly test infrastructure and maintainer bandwidth, not policy.

## 13. Readiness Assessment

- **Color:** yellow
- **Release provider:** distro (upstream publishes source only)

**Justification.** The kernel itself is native riscv64 code, mainline since 4.15 and graded by subsystem. The 30 reports that make up the kernel family (24 whose file name starts with `linux-`, plus eBPF, hwmon, V4L2, WireGuard, GKI/KMI and pKVM) are graded 1 green, 3 blue, 19 yellow, 6 orange and 1 grey. The 22 reports titled "Linux &lt;topic&gt;" that cover subsystems split 1 green, 2 blue, 15 yellow and 4 orange (linux-perf and Linux RAS are older reports counted in the 30). The kernel as a whole is graded yellow because the common-case architecture code builds and boots in external CI, but most subsystem test suites do not run on riscv64 and consumable binaries come from distros. This roll-up grade is derived from the subsystem reports, not from an independent CI audit.

**What could raise the grade.**

- KernelCI or LKFT running kselftest, LTP, blktests, xfstests and KVM selftests on riscv64 hardware or QEMU with the right CPU model.
- Upstream CI definitions in the tree for riscv64.
- Verified distro configuration for each subsystem.

**What could lower it.** A regression in the common architecture code that breaks boot on widely available hardware.

## 14. Investment Analysis

Priorities that follow from the subsystem reports. These are the author's engineering estimates, not commitments, and they include upstream review time.

| Priority | Item | Why | Rough effort |
|---|---|---|---|
| High | Run subsystem selftests on riscv64 in KernelCI/LKFT (kselftest-net, KVM, iommufd, blktests) | Moves yellow subsystems to blue | Months of CI work, mostly configuration |
| High | `HAVE_ACPI_APEI` and GHES for riscv64 | Unblocks RAS and server use | Large; needs firmware and spec alignment |
| Medium | Re-enable riscv64 jobs in DRM CI | DRM is orange because upstream CI skips riscv64 | Small to medium |
| Medium | Kernel-mode hardware CFI | Closes a hardening gap vs arm64 | Medium |
| Medium | riscv64 matrix entry for BPF CI | eBPF has no upstream riscv64 gate | Small to medium |
| Low | riscv64 GKI for Android | Depends on Google decisions | Not estimated |

RISE-funded work and member contributions are listed in the individual reports where a RISE item was found.

## 15. References

- [Linux kernel tree on git.kernel.org](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [Linux RISC-V architecture documentation](https://docs.kernel.org/arch/riscv/index.html)
- [RISC-V patch acceptance policy](https://docs.kernel.org/arch/riscv/patch-acceptance.html)
- [linux-riscv patchwork](https://patchwork.kernel.org/project/linux-riscv/list/)
- [linux-riscv GitHub CI](https://github.com/linux-riscv/github-ci)
- [KernelCI](https://kernelci.org)
- [syzbot](https://syzkaller.appspot.com)
- [RISE Project](https://riseproject.dev)
- Per-subsystem reports: see the tables in section 4.
