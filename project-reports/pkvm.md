---
title: pKVM
parent: Project Reports
color: grey
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: Salus
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="pkvm" %}

# pKVM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** grey (arch-exclusive)<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for pKVM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

pKVM (protected KVM) is an arm64-only mode of Linux KVM. The hypervisor runs at EL2 in nVHE mode, and the host kernel is deprivileged to EL1. The code lives in `arch/arm64/kvm/hyp/nvhe` (`pkvm.c`, `mem_protect.c`, `ffa.c`, `psci-relay.c`, `hyp-main.c`, `setup.c`). It is enabled with `kvm-arm.mode=protected`. The hyp objects are built as `*.nvhe.o`, partially linked into `kvm_nvhe.o`, and symbols are prefixed `__kvm_nvhe_` with `objcopy --prefix-symbols`. Upstream, [Documentation/virt/kvm/arm/pkvm.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/virt/kvm/arm/pkvm.rst) calls it an "experimental, development feature". It requires GICv3 and proxies FF-A and PSCI calls to EL3 firmware. DMA isolation through an IOMMU and pvmfw are both listed as "Unimplemented" upstream.

Android carries more pKVM code than mainline. The Android common kernel (ACK, `kernel/common` on AOSP) branches `android16-6.12`, `android17-6.18` and `android18-7.3` add hyp modules, IOMMU support, `PKVM_MODULE_PATH` and `pkvm_headers_aarch64` in `BUILD.bazel`. The arm64 `gki_defconfig` sets `CONFIG_KVM=y`, `CONFIG_ARM_PKVM_GUEST=y`, `CONFIG_PKVM_PVIOMMU=y` and `CONFIG_VFIO_PKVM_IOMMU=y`, and its command line carries `kvm-arm.mode=protected`. The Android Virtualization Framework (AVF) uses pKVM as "the standard hypervisor for running pVMs". The AVF documentation states "AVF is supported only on ARM64 devices" ([AVF overview](https://source.android.com/docs/core/virtualization)). It describes x86_64 as "for testing only", for non-protected VMs only, and does not mention RISC-V ([AVF architecture](https://source.android.com/docs/core/virtualization/architecture)).

**Governance.** pKVM has no foundation and no standalone project.
- The upstream home is the MAINTAINERS entry "KERNEL VIRTUAL MACHINE FOR ARM64 (KVM/arm64)". Maintainers are Marc Zyngier and Oliver Upton. Reviewers are Fuad Tabba, Joey Gouly, Steffen Eiden, Suzuki K Poulose and Zenghui Yu. The list is `kvmarm@lists.linux.dev`.
- `drivers/virt/coco/pkvm-guest/` is listed under the "ARM64 PORT" entry (Catalin Marinas and Will Deacon as maintainers).
- The Android-specific extensions are maintained by Google in the ACK.
- The AVF architecture page states no governance model. MAINTAINERS does not state employers, so the employers of these maintainers are Data not available from the findings.
- The kernel code is GPL-2.0 and the crosvm VMM header says "Use of this source code is governed by a BSD-style license". The GPL-2.0 statement is from background knowledge, not fetched [NEEDS VERIFICATION].

**Corporate sponsors.** Google is a RISE Premier member per [riseproject.dev/members](https://riseproject.dev/members/) (last updated 2026-01-09). Other Premier members are Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive and Tenstorrent. pKVM and AVF are not mentioned anywhere on riseproject.dev, and no pKVM or AVF work item exists in RISE.

**RISC-V counterpart.** Mainline KVM RISC-V ([arch/riscv/kvm](https://github.com/torvalds/linux/tree/master/arch/riscv/kvm)) is a standard type-2 hypervisor with no protected-guest mode. It is "Maintained" in MAINTAINERS (Anup Patel, maintainer; Atish Patra, reviewer) with lists `kvm-riscv@lists.infradead.org` and `linux-riscv`. It has AIA (APLIC/IMSIC), SBI NACL, PMU, STA, FWFT and HSM support, but no pKVM, hyp/nvhe, CoVE or TEE files. The host kernel runs in HS-mode with full access to guest memory.

**Community stance on new ports.** No pKVM-specific stance on RISC-V and no public Google RISC-V pKVM or AVF plan was found. AOSP does not define formal tiers for pKVM. The only public RISC-V pKVM statement is a design talk (Section 2) that lists "Android specific requirements?" as an open question.

## 2. Port History and Upstreaming Timeline

There is no pKVM port for RISC-V. No commit, patch series or repository implements it. The timeline below lists the adjacent RISC-V events and the Android events that bound the question.

| Date | Event | Source |
|---|---|---|
| 2021-10-05 | KVM/riscv skeletal support (Anup Patel, v20 17-patch series) sent as a pull request. Merged in Linux 5.16 via the KVM tree. SHA and exact commit date not retrieved (git.kernel.org returned 403). | [LWN](https://lwn.net/SubscriberLink/856685/b68c339e3b445760/), [LKML](https://lkml.iu.edu/hypermail/linux/kernel/2111.1/00471.html) |
| 2023-04-19 | `[RFC 00/48] RISC-V CoVE support` (Atish Patra, Rajnesh Kanwal, Rivos). Unmerged. Its MMIO hooks are "inspired from pKVM work". TODO 13 is "Port pKVM to RISC-V using CoVE". | [patchew](https://patchew.org/linux/20230419221716.3603068-1-atishp@rivosinc.com/), [linux-riscv](https://lists.infradead.org/pipermail/linux-riscv/2023-April/030678.html) |
| 2023-04-19 | `[RFC kvmtool 00/10] RISC-V CoVE support` (Atish Patra). Adds `--cove-vm`. Unmerged. | [spinics](https://www.spinics.net/lists/kernel/msg4765584.html), [patchew](https://patchew.org/linux/20230419222350.3604274-1-atishp@rivosinc.com/) |
| 2023-04-20 | Sean Christopherson reviews the 48-patch series. He says it repeats flaws that SNP, TDX and pKVM already met (struct-page-backed memory, pinning) and that it should build on restrictedmem (later guest_memfd). Atish Patra agrees to adopt it. No revised series was found. | [LKML mirror](https://lkml.rescloud.iu.edu/2304.2/05906.html) |
| 2023-05-20 / 2023-05-23 | `rivosinc/cove` issue #1 (licence compliance) opened; PR #2 closed. Neither relates to pKVM. | [rivosinc/cove](https://github.com/rivosinc/cove) |
| 2023-10 | Google blog describes the `aosp_cf_riscv64_phone-userdebug` Cuttlefish target. | [Google blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2024-04 (late) | Google merges patches removing riscv64 from the ACK/GKI. Google said Android "will continue to support RISC-V" but was "not ready to provide a single supported image for all vendors". Whether riscv64 was later restored to the ACK was not verified. | [The Register](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/), [CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/) |
| 2025-09-05 | "RISC-V pKVM" talk by Radim Krcmar, KVM Forum 2025, Milan. Design and prototype talk, no code found. | [slides](https://gitlab.com/qemu-project/kvm-forum/-/raw/main/_attachments/2025/riscv-pkvm-_GCWryju.pdf), [video](https://www.youtube.com/watch?v=PQLC6mjsqRo) |
| 2026-01-14 | Bot-opened PRs #3 and #4 (Contributing, Code of Conduct) on `rivosinc/cove`. Not pKVM related. | [rivosinc/cove](https://github.com/rivosinc/cove) |
| 2026-07-17 | RISE opens issues #123 "KVM CoVE host support" and #124 "KVMTOOL CoVE support". | [#123](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/123), [#124](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/124) |
| 2026-07-29 | `[RFC PATCH] RISC-V: KVM: Add minimal guest_memfd support` and `[RFC PATCH] RISC-V: KVM: Enable KVM_MEM_USERFAULT support` (Bingyu Xian, co-developed by Quan Zhou). No replies. [NEEDS VERIFICATION] (single mirror). | [guest_memfd RFC](https://ratatoskr.run/lkml/2026/07/17333584), [userfault RFC](https://ratatoskr.run/kvm-riscv/2026/07/17333594) |
| 2026-07-31 | `[RFC PATCH v1 00/17] target/riscv: Add KVM CoVE confidential VM support` (Baolong Duan, QEMU). Relies on KVM uAPI "not yet part of an upstream Linux release". | [qemu-devel](https://ratatoskr.run/qemu-devel/2026/07/17347272/t) |
| 2026-09-02 | vlsunil on RISE #123: "This needs a complete relook as COVE spec is undergoing major changes." Item moved to Todo. | [#123](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/123) |
| 2026-10-20 | RISE publishes Android 17 on RVA23 (RP024). No pKVM, KVM or AVF content. | [RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) |
| 2026-10-24 | Mainline (7.3-rc, commit 330517c63aa9) and `android-mainline` (721ad43cbf3c, 2026-10-23) inspected. No pKVM or CoVE code in `arch/riscv`. | Local inspection |

The date pKVM first landed on arm64 is Data not available: it was not searched.

**Key contributors**
- Radim Krcmar, speaker of the RISC-V pKVM talk. Employer not confirmed.
- Atish Patra and Rajnesh Kanwal (Rivos, April 2023), authors of the CoVE RFCs. Atish Patra now has a `linux.dev` address in MAINTAINERS and is the KVM/riscv reviewer.
- Sean Christopherson, KVM reviewer of the CoVE RFC. Employer not stated in the findings.
- Anup Patel, KVM/riscv maintainer. Employer not stated.
- Baolong Duan, QEMU CoVE RFC, described as the Alibaba RFC in two findings (same source).
- Bingyu Xian and Quan Zhou, guest_memfd and userfault RFCs. Employer not stated.
- vlsunil, RISE Kernel & Virtualization working group lead. luhenry opened #123 and #124.

**Is it fully upstream?** No pKVM exists for RISC-V. On arm64 it is upstream in Linux, with additional Android-only code in the ACK. All RISC-V protected-VM work (CoVE) is unmerged RFC or vendor code.

## 3. Upstream Support Tier

**Formal tier policy.** No formal tier policy for pKVM exists. The AVF page says pKVM is "limited to ARM64" as the reference implementation and x86_64 is for testing only. RISC-V is not mentioned. Linux KVM has no tier model in the findings.

**Evidence.**
- CI: none targets riscv64 pKVM (Section 7).
- Release-blocking: Data not available. No release process for pKVM was found.
- Official binaries: none (Section 8).
- The ACK has no riscv64 GKI target. `common/BUILD.bazel` on `android17-6.18` (Linux 6.18.32) has `kernel_aarch64` and `kernel_x86_64` only. Kleaf targets are `kernel_aarch64`, `kernel_aarch64_16k` and `kernel_x86_64`.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream pKVM code | None found | Yes, `arch/arm64/kvm/hyp/nvhe`, experimental | None (`arch/riscv/kvm` has no pkvm/nvhe/cove/tee files) |
| `KVM_VM_TYPE` for protected VMs | Not checked | `KVM_VM_TYPE_ARM_PROTECTED` | None |
| `KVM_GUEST_MEMFD` selected in Kconfig | Not checked | Yes (`arch/arm64/kvm/Kconfig:35`) | No |
| Android GKI target | `kernel_x86_64` (AVF non-protected only) | `kernel_aarch64`, `kernel_aarch64_16k` with pKVM | None; riscv64 GKI removed April 2024 |
| AVF | Testing only, non-protected | Supported, protected | Not supported |
| pvmfw | Not applicable | AArch64 only | None |
| crosvm | Not checked | Yes | riscv64 port exists; protected VMs error out |
| Plain KVM | Not checked | Yes | Yes, mainline, with AIA |

## 4. Technical Architecture and RISC-V-Specific Subsystems

pKVM has no JIT, SIMD dispatch or GC barriers. Its architecture-specific parts are the privilege-level split, stage-2 memory isolation, interrupt handling and firmware proxying. None of these has a riscv64 implementation. The only RISC-V design is the 2025 KVM Forum talk.

**RISC-V pKVM design (slides, all 21 pages read).**
- pKVM runs alone in HS-mode and Linux moves to VS-mode, mirroring the Arm EL2/EL1 split.
- Memory isolation uses `hgatp` and `vsatp`. Linux in VS has rwx access to its own memory with pKVM memory unmapped.
- Interrupt isolation uses the AIA IMSIC (one 4k page each at M, HS and VS levels per CPU). MSI writes are filtered by the IOMMU and `(io)hgatp`. The HS IMSIC belongs to pKVM and the VS IMSICs to Linux.
- pKVM supervises `ecall` communication with M-mode and may refuse requests, so behaviour can differ after pKVM is inserted.
- pKVM is proposed as the CoVE TSM in the nested deployment model, with "Possible ABI divergence".
- The slides list what the host can see in CoVE: MMIO-accessing instructions, second-stage page faults and the guest timer.
- Code reuse with RISC-V KVM was "a lesson in humility/futility". The slides propose a split into `virt/kvm/pkvm` and `$arch/kvm/pkvm` and suggest Rust.
- A "pKVM on Supervisor Domains" variant uses M-mode hardware extensions and third-stage page tables with no address remapping.
- Conclusions: "pKVM is feasible on RISC-V", "CoVE unifies RISC-V confidential hypervisor ABI", "Code reuse possible, but not free."
- Open questions: switching to pKVM early, whether device assignment and migration are hard requirements, whether Supervisor Domains is preferable, and "Android specific requirements?".

Discrepancy: one research pass saw only the title of this talk and marked it [NEEDS VERIFICATION]. Another pass downloaded and read the slides. The slide content above comes from the second pass. The speaker's employer and any code release remain unconfirmed. Code or patches: none found.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hypervisor privilege level | Not checked | EL2 nVHE, host at EL1 | None. Proposed: pKVM in HS, Linux in VS |
| Hyp entry/exit assembly | Not checked | `hyp-init.S`, `host.S`, `cache.S`, `hyp.lds.S` | Only `vcpu_switch.S` (ordinary KVM) |
| Guest memory protection | Not checked | Host stage-2 identity map, EL2 unmaps itself | None. `hgatp`/`vsatp` design only |
| Interrupt isolation | Not checked | GICv3 required | AIA exists upstream in KVM; no isolation layer |
| Firmware proxy | Not checked | FF-A and PSCI relay to EL3 | SBI is treated as an internal kernel API in the slides; nothing implemented |
| DMA isolation | Not checked | IOMMU, "Unimplemented" upstream, extra in ACK | Not verified; the CoVE RFC lists IOMMU integration as TODO 3 |
| Guest firmware | Not checked | pvmfw (AArch64 only) | None. `guest/pvmfw/asm/aarch64/idmap.S` is the only assembly |
| Confidential-VM ABI | Not checked | pKVM hypercalls | CoVE (COVH/COVG/COVI) SBI extensions, unmerged |

The CoVE host-side work is the closest implementation. A TSM running in HS-mode is reached through the SBI extensions COVH (host), COVG (guest) and COVI (interrupts). The RFC supports a deployment where the host runs in VS-mode as a guest of the TSM and isolation comes from G-stage mapping. Device I/O uses SWIOTLB bounce buffers shared through COVG calls. Guests may only use virtio devices with `VIRTIO_F_ACCESS_PLATFORM` and `VIRTIO_F_VERSION_1`. Only kvmtool was tested. The RFC patches reuse NACL shared memory and depend on then-unmerged IPI, AIA and NACL work.

## 5. Build System, Cross-Compilation, and Toolchain

pKVM has no build system of its own. It is Kbuild, with `CONFIG_KVM=y` on arm64 and the hypervisor compiled into `vmlinux`. There are no CMake flags. The options are Kconfig symbols and make variables. No Dockerfile exists at the top of the kernel tree. The debug symbols are `NVHE_EL2_DEBUG`, `PKVM_DISABLE_STAGE2_ON_PANIC` and `PKVM_STACKTRACE`. Nothing builds pKVM for riscv64, so the commands below are the closest equivalents.

**riscv64 KVM host kernel (GNU toolchain).**
```
export ARCH=riscv
export CROSS_COMPILE=riscv64-linux-gnu-
make defconfig
make -j$(nproc)          # produces arch/riscv/boot/Image
```
The QEMU documentation uses the prefix `riscv64-linux-`. `arch/riscv/configs/defconfig` sets `CONFIG_KVM=m`.

**riscv64 with LLVM.** [Documentation/kbuild/llvm.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/kbuild/llvm.rst) lists riscv as "Supported", with no `CROSS_COMPILE` needed.
```
make LLVM=1 ARCH=riscv defconfig
make LLVM=1 ARCH=riscv -j$(nproc)
```
A version suffix (`LLVM=-18`) or path (`LLVM=/path/to/llvm/`) can be passed.

**arm64 pKVM kernel (contrast).** `make LLVM=1 ARCH=arm64` with `kvm-arm.mode=protected` on the command line. The Ubuntu 26.04 riscv64 archive has no `gcc-aarch64-linux-gnu` or `binutils-aarch64-linux-gnu`, so Clang/LLVM is the only cross route for building the arm64 pKVM kernel on a riscv64 host. This was not tested.

**Android (Kleaf).**
- `tools/bazel build //common:kernel_aarch64`
- `tools/bazel run //common:kernel_aarch64_dist`
- `tools/bazel build --config=local //common:kernel_aarch64` keeps intermediate objects.
- There is no `kernel_riscv64` target and no RISC-V `gki_defconfig` (404 on `android-mainline`, `android17-6.18` and `android16-6.12`). The ACK `arch/riscv/` holds only mainline defconfigs. `kernel_toolchains.bzl` does recognise a riscv64 target arch.

**Toolchain minimums** ([changes.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/process/changes.rst), [min-tool-version.sh](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/scripts/min-tool-version.sh)):

| Tool | Minimum | Note |
|---|---|---|
| GCC | 8.1.0 | 12.0.0 for parisc64 only |
| binutils | 2.30 | pKVM also needs `objcopy --prefix-symbols` |
| Clang/LLVM | 17.0.1 | 18.0.0 for loongarch only. Required for Android GKI. Only the latest formal LLVM release is supported. |
| GNU make | 4.0 | |
| Python | 3.9 | |
| Rust (optional) | 1.85.0 | Not needed by the pKVM nVHE code |
| bindgen (optional) | 0.71.1 | |

**riscv64 toolchain gates** (from `arch/riscv/Kconfig`). Below these versions the feature is silently disabled.
- `RISCV_ISA_V` needs binutils 2.38 or newer (or lld).
- `Zba`, `Zbb`, `Zbc` and `Zbkb` need binutils 2.39 or newer (or lld).
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies with GNU `as` 2.36 or newer, because binutils 2.38 and GCC 12.1 moved the default ISA spec.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies to GCC older than 11.3.
- Clang dynamic ftrace with the LLVM assembler needs lld or GNU `ld` 2.36 or newer.
- `ARCH_HAS_BROKEN_DWARF5` is set when LLVM's assembler and lld are older than 18.
- Rust on riscv needs Clang. LTO adds `-mllvm -mattr=+c -mllvm -mattr=+relax` because of an LLVM bug. Shadow Call Stack needs `ld --no-relax-gp`.
- `arch/riscv/kvm/Kconfig` has KVM `depends on RISCV_SBI && MMU` and does not select `KVM_GUEST_MEMFD`.

**QEMU.** From [QEMU virt.rst](https://gitlab.com/qemu-project/qemu/-/raw/master/docs/system/riscv/virt.rst), which was tested with Linux v5.12:
```
qemu-system-riscv64 -M virt -smp 4 -m 2G -display none -serial stdio \
  -kernel arch/riscv/boot/Image -initrd /path/to/rootfs.cpio -append "root=/dev/ram"
```
- The `virt` default CPU enables the H extension, so a KVM host kernel can be tested under TCG.
- `-M virt,aia=aplic-imsic` selects AIA, and `aia-guests=N` sets the number of VS-level IMSIC pages. With KVM it can be combined with `-accel kvm,kernel-irqchip=split`.
- OpenSBI is the default `-bios`. U-Boot SPL then OpenSBI `fw_dynamic` then U-Boot is also supported.
- For arm64 pKVM under QEMU, `-M virt,virtualization=on,gic-version=3 -cpu max` plus `kvm-arm.mode=protected` is the author's recollection and was not verified.
- The Alibaba CoVE QEMU RFC was tested on QEMU TCG emulating a T-Head Xuantie C930, with CoVE v0.7 and an OpenSBI extended with RDSM and a TSM. The TSM and RDSM code are not public.

**CoVE prototype setup.** The Rivos setup guide is [CoVE KVM RISCV64 on QEMU](https://github.com/rivosinc/cove/wiki/CoVE-KVM-RISCV64-on-QEMU). The kernel branch is [rivosinc/linux cove-integration](https://github.com/rivosinc/linux/commits/cove-integration) and the kvmtool branch is `cove-integration-03072023`.

**Known build failures.** None specific to pKVM on riscv64 were found, because there is nothing to build. The known gap is the missing aarch64 cross-GCC and cross-binutils in Ubuntu riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | arm64 | amd64 | riscv64 |
|---|---|---|---|
| Protected-VM hypervisor in Linux | Yes (`kvm-arm.mode=protected`) | None found | None |
| Host-deprivileged hypervisor | EL2 nVHE | Not checked | None; designed only in the talk |
| Guest memory unmapped from host | Yes (host stage-2) | Not checked | None |
| `guest_memfd` in KVM | Selected | Not checked | RFC only (2026-07-29), unmerged [NEEDS VERIFICATION] |
| Confidential-VM SBI/firmware ABI | pKVM hypercalls, FF-A | Not checked | CoVE v0.7 draft, unmerged host and guest support |
| IOMMU DMA isolation | "Unimplemented" upstream, in ACK | Not checked | Not verified; listed as TODO in the CoVE RFC |
| pvmfw | AArch64 | None | None |
| AVF/Microdroid protected VMs | Yes | Non-protected only | None |
| Plain (unprotected) KVM guests | Yes | Yes | Yes (crosvm riscv64 and upstream KVM) |
| Post-copy migration (`KVM_MEM_USERFAULT`) | Not checked | Not checked | RFC only [NEEDS VERIFICATION] |

**Functional gaps.**
- A protected VM cannot be created on riscv64 Linux or Android.
- crosvm riscv64 errors with "Protected mode is not supported on riscv64". `hypervisor/src/kvm/riscv64.rs` states "The riscv machine type is always 0. Protected VMs are not supported, yet."
- There is no riscv64 pvmfw or vmbase. AVF carries a comment in `build/microdroid/Android.bp`: "microdroid_crashdump_kernel doesn't exist for riscv64 yet". The only other RISC-V item in AVF is a riscv64 Debian image entry in `build/debian/image.yaml`.
- Mainline RISC-V KVM does not select `KVM_GUEST_MEMFD`, which any protected or confidential VM design needs.

**Performance gaps.** Data not available. No benchmark data for pKVM or any RISC-V protected-VM implementation was found. The only performance statement is that Rivos expects nested non-confidential VMs under the CoVE VS-mode host model "may be slower", and that Salus does not yet support full nested virtualization. There are no SIMD-related deltas, because pKVM has no vector code paths.

**Security hardening gaps.** The RISC-V CoVE design notes that the host can see MMIO-accessing instructions, second-stage page faults and the guest timer. The Rivos RFC allows all interrupts at boot in the proof of concept and lists interrupt-allowlist hardening and guest hardening as TODO items.

**NaN / floating-point semantics.** Not applicable to pKVM. No issues were found.

## 7. CI/CD Infrastructure

No riscv64 CI job, config or result targets pKVM, and there is no RISC-V pKVM port to test. The related CI is generic RISC-V Linux CI, which can exercise KVM RISC-V incidentally.

**[linux-riscv/github-ci](https://github.com/linux-riscv/github-ci)** (cloned at its latest commit, dated 2025-06-27) drives the Linux RISC-V patchwork bot. Upstream and community-run.
- The workflows are `kselftest.yml`, `patchwork.yml`, `series.yml`, `sync.yml` and `testsuites.yml`.
- `testsuites.yml` runs LTP, libhugetlbfs and xfstests against an Ubuntu-defconfig kernel, with no KVM or hypervisor reference.
- `kselftest.yml` runs on a self-hosted runner for branches named `linus*` or `*_manual`.
- `build_selftest.sh` builds every selftest target except an exclusion list (`bpf`, `livepatch`, and anything matching `amd|intel|lkdtm|breakpoints|tdx|x86`). The `kvm` selftests are not excluded, but it was not confirmed that they run.
- The QEMU "server64" CPU model enables `h=true`, and `ubuntu_defconfig` sets `CONFIG_KVM=y`. KVM RISC-V is buildable and testable in the bot, as ordinary KVM and not pKVM.
- The riscv KVM selftests are in `tools/testing/selftests/kvm/riscv/` (`arch_timer.c`, `ebreak_test.c`, `get-reg-list.c`, `sbi_pmu_test.c`). Nothing in them is pKVM-specific.

**Other CI findings.**
- The Linux mainline root has no `.github`, `.gitlab-ci.yml` or `.travis.yml`. The kernel has no in-tree CI config.
- RISE RISC-V runners (`ubuntu-24.04-riscv`) ran more than 13,000 jobs for 197 repositories between 2026-03-19 and 2026-05-06 ([RISE blog](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). No Android, Linux kernel, KVM or pKVM repository is named as a user. The EM-RV1 nodes run a 5.10.x vendor kernel without virtualization support.
- RISE RP024 (Android 17) is in phase 2, which covers CI automation with the RISE Board Farm. It carries no pKVM.
- KernelCI dashboards, ci.android.com and AOSP Gerrit/Kleaf riscv64 targets were not checked.
- crosvm presubmit riscv64 CI was re-enabled in 2025 per an existing repository report [NEEDS VERIFICATION]. It covers ordinary KVM only.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| pKVM-specific CI | Data not available | Data not available (not examined) | None |
| Generic KVM CI | Data not available | Data not available | linux-riscv bot (build; kvm selftests unconfirmed) |
| Hardware used | n/a | n/a | QEMU server64 with `h=true` (no riscv64 hardware pKVM testing) |
| RISE runners | n/a | n/a | Available; none used for KVM or pKVM |

## 8. Distribution and Release Status

pKVM is a kernel mode, not a package, so there is no riscv64 binary and none could exist.

| Channel | Check | Result |
|---|---|---|
| PyPI | [pkvm JSON](https://pypi.org/pypi/pkvm/json), simple index | HTTP 404 |
| RISE wheel builder | GitLab package index for `pkvm` | Redirects to the PyPI index, 404; no wheels |
| Debian | [sources.debian.org search](https://sources.debian.org/api/search/pkvm/) | No match |
| Ubuntu (resolute, riscv64) | packages.ubuntu.com search | HTTP 500, inconclusive. Launchpad `getPublishedBinaries` and `getPublishedSources` for `pkvm` returned `total_size: 0` |
| kernel.org | [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) | A git tree, not a release page |
| Android | ACK/AOSP | No riscv64 GKI; pKVM only in aarch64 builds |

The project-graph database queries could not be run (tool unavailable). Ubuntu 26.04 riscv64 packages `linux-libc-dev` and `linux-tools-common` 7.0.0-14.14 exist, but the pKVM code builds only for `ARCH=arm64`.

**What a user must do to get a working binary.**
- A protected VM cannot be had on riscv64 by any route.
- For ordinary KVM on riscv64, build a mainline kernel with `CONFIG_KVM=m` (the default in `defconfig`).
- For Android on riscv64, `aosp_cf_riscv64_phone-userdebug` (Cuttlefish) exists per the Google blog, and the RISE [Android 17 RVA23 release](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) (`android-17-v1.0`) targets SpacemiT K3 Pico-ITX and Alibaba A210 EVB. It is described as an open-source developer release, not production-ready or certified. It uses `android-mainline-spacemit` and `android-mainline-alibaba` kernel branches, with no pKVM-style hypervisor shown.
- For CoVE experiments, a user would have to build the out-of-tree `rivosinc/linux` `cove-integration` branch, `rivosinc/kvmtool` and Salus from [rivosinc/cove](https://github.com/rivosinc/cove).

## 9. Dependencies

Roles and colors come from the existing repository status reports where noted. "Not assessed" means no report or data was reached. The project-graph queries were not run, so Ubuntu 26.04 (resolute) riscv64 index lookups were used instead. A hit means the package is declared in the index, not that it built successfully.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | Runtime dependency, critical. pKVM is part of the arm64 kernel. | riscv64 kernels build, with no pKVM code | KVM RISC-V selftests exist | Mainline; Ubuntu riscv64 kernel headers/tools packages exist | Upstream Linux; KVM/riscv maintained by Anup Patel, Atish Patra reviewer |
| LLVM | Build dependency, critical. Clang is required for Android GKI, minimum 17.0.1. | Yellow per repo report `project-reports/llvm.md`. `clang-21`, `lld-21`, `llvm-21` 1:21.1.8-6ubuntu1 in Ubuntu riscv64 | See report | No upstream riscv64 release binaries | LLVM community; RISE funds LLVM work (RP009) |
| OpenSBI | Runtime dependency, critical. KVM RISC-V needs `RISCV_SBI`. CoVE extensions are vendor work. | `opensbi` 1.8.1-1 in Ubuntu riscv64; no report in repo | Not assessed | Not assessed | RISE RP016 APLIC and virtual IRQ routing, patches under review on the OpenSBI list |
| QEMU | Test dependency, optional | Yellow per repo report `project-reports/qemu.md`. `qemu-system-misc` 1:10.2.1+ds-1ubuntu3 in Ubuntu riscv64 | See report | See report | QEMU upstream; CoVE RFC unmerged |
| Salus | Runtime dependency, optional. The reference TSM in [rivosinc/cove](https://github.com/rivosinc/cove). | Data not available: no build or packaging data was reached | The README says testing is limited to kvmtool | None; proof of concept ("very early work", 5 commits) | Rivos; 19 stars, 1 fork per the fetch |

**Additional dependencies (indirect and build tooling).**

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | Build, one of two compilers (8.1 or newer) | Blue per `project-reports/gcc.md`; `gcc` 4:15.2.0-5ubuntu1 | See report | See report | GCC upstream |
| GNU binutils | Build (`objcopy --prefix-symbols`, `ld`), 2.30 or newer | `binutils` 2.46-3ubuntu2 present; `binutils-aarch64-linux-gnu` absent | Not assessed | Not assessed | No report in repo |
| dwarves/pahole | Build, BTF generation, 1.26 or newer | 1.31-2ubuntu1 present | Not assessed | Not assessed | No report in repo |
| elfutils | Build (objtool, BTF) | Blue per `project-reports/elfutils.md`; 0.194-4 present | See report | See report | |
| OpenSSL | Build (signing, certs) | Blue per `project-reports/openssl.md`; 3.5.5-1ubuntu3 present | See report | See report | |
| Python and Perl | Build scripts (Python 3.9 or newer) | Python blue per `project-reports/python.md`; python3 3.14.3, perl 5.40.1 present; no Perl report | See report | See report | |
| dtc | Build, arm64 DTBs | `device-tree-compiler` 1.7.2-2ubuntu1 present | Not assessed | Not assessed | No report in repo |
| Rust and bindgen | Build, optional, not needed by pKVM nVHE code | Yellow per `project-reports/rust.md`; `rustc` 1.93.1, `bindgen` 0.72.1-1 present | See report | See report | |
| make, bash, flex, bison, bc, kmod, cpio, tar | Build tooling | All present (make 4.4.1, flex 2.6.4, bison 3.8.2, bc 1.07.1, kmod 34.2, cpio 2.15, bash 5.3, tar 1.35) | Not assessed | Not assessed | No reports in repo |
| crosvm | VMM for AVF protected VMs | Upstream riscv64 port (`riscv64/src`, `hypervisor/src/kvm/riscv64.rs`); `project-reports/crosvm.md` | Presubmit riscv64 CI re-enabled in 2025 [NEEDS VERIFICATION] | Not packaged in Ubuntu riscv64 | Google/Chromium; no pVM path on riscv64 |
| TF-A | EL3 firmware (PSCI, FF-A) on arm64 hardware | Grey (Arm-specific) per `project-reports/trusted-firmware-a-(tf-a).md`; absent from Ubuntu riscv64 | n/a | n/a | Not a riscv64 target |
| U-Boot | Boot at EL2 on arm64; RISE branches for RISC-V | Blue per `project-reports/u-boot.md`; 2025.10-0ubuntu2 present | See report | See report | RISE forks: `v2026.07-k3`, `v2024.10-a210` |
| pvmfw / Microdroid / AVF userspace | Runtime, Android protected-VM firmware | AArch64 only (`guest/pvmfw/README.md`) | n/a | AOSP only | Google |
| libvirt | Optional management layer | Yellow per `project-reports/libvirt.md`; 12.0.0-1ubuntu5 present | See report | See report | Not pKVM-specific |

**Deep-dive.**
- **Linux kernel / pKVM.** The blocker is not a dependency. pKVM has no RISC-V port, and the Ubuntu index has no cross-GCC or cross-binutils for arm64 on a riscv64 host. Only Clang/LLVM is a cross route (`LLVM=1 ARCH=arm64`), untested.
- **OpenSBI.** The Alibaba CoVE RFC says its OpenSBI changes are "being prepared" and that the TSM and RDSM are not public. RISE's RP016 APLIC and virtual IRQ routing work is described as groundwork for isolation, trusted execution and virtualization, and is not pKVM or KVM guest code. The CoVE SBI extensions are not in upstream OpenSBI as far as the findings verified.
- **Salus.** It is a passive TSM with no scheduling or interrupts. It supports the VS-mode host model, and full nested virtualization is not yet supported.
- Not assessed (no source reached): zstd, xz, ncurses, pkg-config. They matter only for kernel compression or menuconfig. Reports exist for zstd and xz in `project-reports/`.

## 11. Known Bugs and Active Issues

Section 10 is omitted because pKVM has no dependent package ecosystem. This section is numbered 11 below.

No pKVM-specific bugs for RISC-V were found, and no benchmark data was found. The search that could have confirmed this for AOSP issue trackers did not run. lore.kernel.org returned 403, and the web-search budget was exhausted, so the `kvm-riscv` list was not searched.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [RISE #123](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/123) | KVM CoVE host support | Open, Todo, milestones 2026 and future, no assignee | Feature gap | Depends on SBI v3.0 and CoVE spec v0.7. "Needs a complete relook" (2026-09-02). Carries a "1H24 priority" entry dated 2023-10-17, which predates the issue and was probably carried over from an earlier tracker. |
| [RISE #124](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/124) | KVMTOOL CoVE support | Open, Todo, milestone future | Feature gap | Depends on #123. No comments. |
| RISE #125 | CoVE guest support | Listed in the working group issue list (`kernel:linux`) | Feature gap | Status not read |
| RISE #127 | KVM nested virtualization | "Upstream in progress" (`kernel:kvm`) | Feature gap | Not pKVM |
| [kvm-riscv/linux #3](https://github.com/kvm-riscv/linux/issues) | KVM RISC-V nested virtualization support | Open | Feature gap | One of 7 open issues |
| kvm-riscv/linux #7, #8, #9 | SBI PTS extension (define, use in timer driver, implement in KVM) | Open | Not stated | Concern time handling |
| kvm-riscv/linux #15 | KVM ONE_REG interface for virtual HS-mode state | Open | Not stated | |
| kvm-riscv/linux #18 | Trace points for KVM RISC-V | Open | Not stated | |
| kvm-riscv/linux #26 | Guest/VM migration support in QEMU RISC-V | Open | Not stated | |
| [rivosinc/cove #1](https://github.com/rivosinc/cove) | add reuse copyright/license compliance | Open | Low | Unrelated to pKVM |
| rivosinc/cove #3, #4 | Contributing file; Code of Conduct file | Open (bot-opened 2026-01-14) | Low | Unrelated to pKVM |

A search of the kvm-riscv tracker for "pkvm OR protected" returned 0 results. A search of `rivosinc/cove` for pKVM returned zero. The RISE Kernel & Virtualization board has 62 open issues. None mentions pKVM, protected VM, AP-TEE or Android.

**Correctness bugs.** None found for pKVM on RISC-V. The only correctness findings are historical review comments on the unmerged 2023 CoVE RFC. Patch 19 failed to release a lock on failure, handled MOVE incorrectly, did not handle DELETE and did not reject READONLY. Atish Patra acknowledged these as an oversight and no revised series was found.

## 12. Objections and Upstream Blockers

**Stated objections.**
- Sean Christopherson (2023-04-20) objected that the CoVE RFC repeats flaws that SNP, TDX and pKVM had already met (struct-page assumptions, pinning), and that it should use restrictedmem/guest_memfd. The diffstat showed no changes to common KVM code. He raised these on the CoVE host series, not on a pKVM port.
- Michael Roth argued in the same thread that waiting for complete designs before merging isn't always necessary.
- No objection to a RISC-V pKVM itself has been stated, because no RFC exists.

**Technical blockers.**
- Mainline RISC-V KVM does not select `KVM_GUEST_MEMFD`. A minimal guest_memfd RFC was posted on 2026-07-29 and has no replies [NEEDS VERIFICATION].
- The CoVE spec (v0.7, draft) is "undergoing major changes", per RISE #123. No ratification announcement was found. The status of the AP-TEE spec was not confirmed.
- The KVM uAPI that the QEMU RFC relies on (`KVM_VM_TYPE_RISCV_COVE`, `KVM_RISCV_COVE_MEASURE_REGION`) is in no upstream Linux release. The kernel side is a vendor tree being rebased onto mainline.
- Code reuse between RISC-V KVM and a pKVM is hard ("humility/futility"), so a separate implementation is likely needed.
- DMA isolation (IOMMU) is unresolved. It is "Unimplemented" even on upstream arm64 pKVM, and a TODO in the CoVE RFC.
- The RISC-V Android kernel base is missing. riscv64 was removed from the ACK/GKI in April 2024, and Kleaf has no riscv64 GKI target. The RISE Android work uses downstream `android-mainline-*` vendor branches.
- AVF/pvmfw/vmbase assembly and crosvm protected-VM code are all aarch64-only.

**Organizational blockers.**
- No pKVM work item exists in RISE, and no funded project covers it. RISE KVM CoVE items are deferred to "future".
- No public Google RISC-V pKVM or AVF plan was found. Whether Google has unpublished work is unknown.
- All RISC-V protected-VM work is vendor or RFC (Rivos, Alibaba), with the Rivos series unrevised since April 2023.

**Acceptance probability.** Data not available. No maintainer statement on accepting a RISC-V pKVM exists, and no patch has been posted. The author's assessment is that the upstream route is more likely to run through CoVE than through a pKVM port. That judgement rests on the unmerged state of both and on the talk's own proposal to use pKVM as the CoVE TSM. The upstream sequence would first need guest_memfd for RISC-V KVM.

## 13. Readiness Assessment

- **Color:** grey (arch-exclusive)
- **Release provider:** none

pKVM is an arm64-only mode of Linux KVM (`arch/arm64/kvm/hyp/nvhe`, EL2 nVHE, enabled with `kvm-arm.mode=protected`), and the [AVF documentation](https://source.android.com/docs/core/virtualization) states AVF/pKVM is supported only on ARM64. There is no RISC-V pKVM in mainline [arch/riscv/kvm](https://github.com/torvalds/linux/tree/master/arch/riscv/kvm), in Android's android-mainline kernel, or in AOSP (pvmfw is AArch64 only; crosvm riscv64 errors with "Protected mode is not supported on riscv64"). It is not broken on RISC-V, it does not exist there, so it is N/A by design. No pKVM-specific riscv64 CI, package or release exists, and it is not an optimization-purpose project.

**Pending work that could change the grade.** No pKVM port is in flight. The only RISC-V item is a design talk, "RISC-V pKVM" by Radim Krcmar (KVM Forum 2025, 2025-09-05, [slides](https://gitlab.com/qemu-project/kvm-forum/-/raw/main/_attachments/2025/riscv-pkvm-_GCWryju.pdf)), with no public code or RFC.
- The nearest real work is CoVE/AP-TEE confidential VMs, which is a different trust model (an SBI-reached TSM). It is all unmerged and vendor or RFC only: Rivos [RFC 00/48 (April 2023)](https://lists.infradead.org/pipermail/linux-riscv/2023-April/030678.html), rivosinc/cove with the Salus TSM, and an Alibaba [QEMU RFC (2026-07-31)](https://ratatoskr.run/qemu-devel/2026/07/17347272/t) that relies on KVM uAPI not in any upstream Linux release.
- RISE tracks KVM CoVE host support in [kernel-and-virtualization-wg #123](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/123) and kvmtool in #124. Both are open and deferred to "future", and #123 notes the CoVE spec needs a complete relook.
- Prerequisite RISC-V KVM guest_memfd and userfault RFCs were posted in July 2026 and are not merged.
- Android removed riscv64 from the GKI/ACK in April 2024, and RISE's Android 17 RVA23 work (RP024) carries no pKVM. RISE has no pKVM work item.
- The grade would change only if an upstream or AOSP RISC-V protected-VM mode appeared.

**Gaps.** lore.kernel.org and the Android Gerrit were not directly searchable, so negative results are from mirrors (patchew, infradead linux-riscv, lkml.iu.edu, ratatoskr.run). One research pass suggested a red grade and another suggested red or grey. The computed grade is grey, since the feature does not exist on RISC-V by design, and that grade is used here.

## 14. Investment Analysis

**RISE check first.** RISE has funded or done no pKVM work. RISE funds adjacent items that are not pKVM: RP016 (OpenSBI APLIC and virtual IRQ routing), RP024 (Android 17 on RVA23), and the Kernel & Virtualization working group tracking CoVE (#123, #124, #125), nested virtualization (#127) and AIA irq-bypass (#9). Those are not sized here. Effort figures below are the author's planning estimates, not derived from the findings, and are all [NEEDS VERIFICATION].

**Recommendation.** Do not fund a RISC-V pKVM implementation now. No upstream or AOSP consumer exists on RISC-V, since AVF is arm64-only and riscv64 left the GKI in April 2024. The prerequisites (guest_memfd, a stable CoVE spec, IOMMU isolation) are not in place. Tracking and prerequisite work is the lower-risk use of effort.

### 14.1 Functional Enablement

- **Track CoVE and the RISC-V pKVM proposal.** Watch RISE #123 and #124 and the guest_memfd and userfault RFCs. Contact the KVM Forum 2025 speaker to learn whether code exists and what the "Android specific requirements?" question means in practice.
- **Prerequisite upstream work.** Review and test the RISC-V KVM guest_memfd RFC. This is the only item the findings show as a shared prerequisite for any protected VM on RISC-V KVM.
- **pKVM or CoVE TSM prototype.** Start only if the CoVE spec stabilises and a customer or Android requirement appears. The slides' design points are hgatp/vsatp isolation, AIA IMSIC ownership and Linux deprivileged to VS-mode. This would be new design work, and not a port of the arm64 code.
- **Android side.** A riscv64 pvmfw/vmbase/crosvm pVM path would also be required, plus a riscv64 GKI or equivalent vendor kernel. None exists.

### 14.2 Performance Optimization

Not applicable now. No benchmark data or implementation exists to optimise. A baseline would be needed once any prototype exists.

### 14.3 CI/CD Infrastructure

- Confirm that the KVM selftests actually run in the linux-riscv bot (built but unconfirmed).
- Use RISE Board Farm or runners for KVM RISC-V testing only if hypervisor-capable hardware is available. The EM-RV1 nodes run a 5.10.x vendor kernel without virtualization support, so they are unsuitable.
- A pKVM-specific job is premature until code exists.

### 14.4 Ecosystem Enablement

No package ecosystem applies (Section 10 omitted).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Track RISE #123/#124, CoVE spec and the Krcmar proposal; engage upstream | 2 to 4 per year [NEEDS VERIFICATION] | Chip company kernel team | Medium |
| Functional | Test and review RISC-V KVM guest_memfd RFC upstream | 4 to 8 [NEEDS VERIFICATION] | Chip company kernel team / KVM-riscv community | Medium |
| Functional | RISC-V pKVM or TSM prototype (HS-mode hypervisor, Linux in VS-mode) | Not sized: depends on a stable CoVE spec | Vendor with Rivos/Alibaba CoVE experience | Low |
| Functional | riscv64 pvmfw, vmbase and crosvm protected-VM path | Not sized: depends on an Android requirement | Google / vendor | Low |
| CI/CD | Confirm KVM selftests in linux-riscv bot | 1 to 2 [NEEDS VERIFICATION] | Upstream CI maintainers / RISE | Low |
| Performance | Benchmark baseline for any RISC-V protected VM | Deferred | Not assigned | Low |

## 15. References

- [Linux kernel git tree (torvalds/linux.git)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [torvalds/linux arch/riscv/kvm](https://github.com/torvalds/linux/tree/master/arch/riscv/kvm)
- [torvalds/linux KVM RISC-V selftests](https://github.com/torvalds/linux/tree/master/tools/testing/selftests/kvm/riscv)
- [Documentation/virt/kvm/arm/pkvm.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/virt/kvm/arm/pkvm.rst)
- [Documentation/process/changes.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/process/changes.rst)
- [scripts/min-tool-version.sh](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/scripts/min-tool-version.sh)
- [Documentation/kbuild/llvm.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/kbuild/llvm.rst)
- [arch/riscv/Kconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/arch/riscv/Kconfig)
- [arch/riscv/kvm/Kconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/arch/riscv/kvm/Kconfig)
- [arch/riscv/Makefile](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/arch/riscv/Makefile)
- [arch/arm64/kvm/Kconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/arch/arm64/kvm/Kconfig)
- [arch/arm64/kvm/hyp/nvhe/Makefile](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/arch/arm64/kvm/hyp/nvhe/Makefile)
- [arch/arm64/kvm/hyp/nvhe tree](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/arm64/kvm/hyp/nvhe)
- [Android kernel/common android-mainline arch/riscv/kvm](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline/arch/riscv/kvm/)
- [Archived build.config.gki.riscv64 in kernel/common](https://android.googlesource.com/kernel/common/+/6cf2e7d96862514989335c26cea126b6e65d43e2/build.config.gki.riscv64)
- [Kleaf documentation](https://android.googlesource.com/kernel/build/+/refs/heads/main/kleaf/docs/)
- [AOSP pvmfw README (tagged copy)](https://android.googlesource.com/platform/packages/modules/Virtualization/+/f0271f36388ec9630d89ff8b3ee4cb22e2ca3eaf/guest/pvmfw/README.md)
- [Android Virtualization Framework overview](https://source.android.com/docs/core/virtualization)
- [AVF architecture](https://source.android.com/docs/core/virtualization/architecture)
- [LPC 2022 AVF slides](https://lpc.events/event/16/contributions/1330/attachments/961/1882/LPC2022%20-%20Android%20Virtualization%20Framework%20.pdf)
- [crosvm riscv64 source](https://chromium.googlesource.com/crosvm/crosvm/+/refs/heads/main/riscv64/)
- [RISC-V pKVM slides, KVM Forum 2025](https://gitlab.com/qemu-project/kvm-forum/-/raw/main/_attachments/2025/riscv-pkvm-_GCWryju.pdf)
- [RISC-V pKVM video, KVM Forum 2025](https://www.youtube.com/watch?v=PQLC6mjsqRo)
- [KVM Forum 2025 program](https://kvm-forum.qemu.org/2025/)
- [RFC 00/48 RISC-V CoVE support (patchew)](https://patchew.org/linux/20230419221716.3603068-1-atishp@rivosinc.com/)
- [RFC 00/48 RISC-V CoVE support (linux-riscv archive)](https://lists.infradead.org/pipermail/linux-riscv/2023-April/030678.html)
- [RFC 00/48 RISC-V CoVE support (linux-riscv, message 030730)](https://lists.infradead.org/pipermail/linux-riscv/2023-April/030730.html)
- [linux-riscv, message 030870](https://lists.infradead.org/pipermail/linux-riscv/2023-April/030870.html)
- [Review reply to RFC 00/48 (LKML mirror)](https://lkml.rescloud.iu.edu/2304.2/05906.html)
- [RFC kvmtool 00/10 RISC-V CoVE support (patchew)](https://patchew.org/linux/20230419222350.3604274-1-atishp@rivosinc.com/)
- [RFC kvmtool 00/10 RISC-V CoVE support (spinics)](https://www.spinics.net/lists/kernel/msg4765584.html)
- [CoVE: Towards Confidential Computing on RISC-V Platforms (arXiv 2304.06167)](https://arxiv.org/pdf/2304.06167)
- [ACE-RISCV paper (arXiv 2505.12995)](https://arxiv.org/html/2505.12995v1)
- [Hacker News thread on ACE and Salus](https://news.ycombinator.com/item?id=44055895)
- [rivosinc/cove](https://github.com/rivosinc/cove)
- [CoVE KVM RISCV64 on QEMU (Rivos wiki)](https://github.com/rivosinc/cove/wiki/CoVE-KVM-RISCV64-on-QEMU)
- [rivosinc/linux](https://github.com/rivosinc/linux)
- [riscv-non-isa/riscv-ap-tee](https://github.com/riscv-non-isa/riscv-ap-tee)
- [RISE issue #123, KVM CoVE host support](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/123)
- [RISE issue #124, KVMTOOL CoVE support](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/124)
- [RISE kernel-and-virtualization-wg](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [QEMU RFC, KVM CoVE confidential VM support (2026-07-31)](https://ratatoskr.run/qemu-devel/2026/07/17347272/t)
- [RISC-V KVM minimal guest_memfd RFC](https://ratatoskr.run/lkml/2026/07/17333584)
- [RISC-V KVM KVM_MEM_USERFAULT RFC](https://ratatoskr.run/kvm-riscv/2026/07/17333594)
- [RISC-V KVM G-stage PMD block mappings RFC v3](https://ratatoskr.run/kvm/2026/07/17249842)
- [kvm-riscv/linux issues](https://github.com/kvm-riscv/linux/issues)
- [zcxGGmu/linux-riscv-docs KVM/IOMMU gap analysis](https://github.com/zcxGGmu/linux-riscv-docs/blob/main/patch-work/riscv-arm-x86-gap/07-kvm-iommu-virtualization.md)
- [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci)
- [QEMU RISC-V virt machine documentation](https://gitlab.com/qemu-project/qemu/-/raw/master/docs/system/riscv/virt.rst)
- [LWN, KVM/riscv staging discussion](https://lwn.net/SubscriberLink/856685/b68c339e3b445760/)
- [LKML, KVM/riscv pull request (2021-11)](https://lkml.iu.edu/hypermail/linux/kernel/2111.1/00471.html)
- [The Register, Android pulls RISC-V support](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/)
- [CNX Software, Android no longer supports RISC-V](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)
- [Android Authority, Android drops RISC-V kernel](https://androidauthority.com/android-drop-risc-v-kernel-3438330)
- [Hackster, Google removes RISC-V from the Android Common Kernel](https://hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929)
- [Google Open Source Blog, Android and RISC-V](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [FOSDEM, Open source RISC-V AOSP porting](https://fosdem.org/schedule/event/SXX8HE-open_source_risc-v_aosp_porting_progress_challenges_and_upstream_work)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog: Android 17 on RVA23](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE blog: Advancing OpenSBI interrupt handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE blog: RISC-V runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE blog: Working group elections 2025](https://riseproject.dev/2025/03/31/working-group-lead-election-results/)
- [RISE blog: Working group elections 2026](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)
- [RISE android_manifest](https://github.com/riseproject-dev/android_manifest)
- [LPC 2026 RISC-V microconference contribution](https://lpc.events/event/20/contributions/2333/)
- [PyPI pkvm lookup](https://pypi.org/pypi/pkvm/json)
- [Debian sources search for pkvm](https://sources.debian.org/api/search/pkvm/)