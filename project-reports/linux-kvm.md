---
title: Linux KVM
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
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: kvmtool
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-kvm" %}

# Linux KVM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux KVM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

KVM/riscv is the RISC-V architecture port of the Linux kernel's hypervisor, in `arch/riscv/kvm/`. It is not a separate product. It builds on the generic KVM core in `virt/kvm/`. The generic code has no RISC-V-specific files, and RISC-V plugs in through `arch/riscv/kvm/Kconfig` and `Makefile`. Documentation is in [docs.kernel.org/virt/kvm](https://docs.kernel.org/virt/kvm/index.html). RISC-V sections sit inside `Documentation/virt/kvm/api.rst`. No standalone RISC-V KVM document was found by filename.

KVM/riscv uses the RISC-V hypervisor (H) extension. It runs the host in HS-mode and guests in VS-mode. It depends on SBI (`CONFIG_KVM` is a tristate that `depends on RISCV_SBI && MMU`). It selects `KVM_COMMON`, `HAVE_KVM_IRQCHIP`, `KVM_GENERIC_DIRTYLOG_READ_PROTECT`, `KVM_GENERIC_PRE_FAULT_MEMORY` and `HAVE_KVM_DIRTY_RING_ACQ_REL`. The source for these facts is `arch/riscv/kvm/Kconfig` in the shared clone at HEAD `05441d697f7f` (v7.4-rc1-132, 2026-11-03).

**Governance.**
- There is no foundation or governance body. Development is by mailing list and git trees.
- The license is GPL-2.0, from the kernel's general licensing rules. This was not read on the docs page [NEEDS VERIFICATION against `Documentation/process/license-rules.rst`].
- The generic KVM entry in MAINTAINERS lists Paolo Bonzini (Red Hat) as maintainer and Sean Christopherson (Google) as reviewer.
- RISC-V uses a per-architecture sub-maintainer model. The MAINTAINERS entry "KERNEL VIRTUAL MACHINE FOR RISC-V (KVM/riscv)" has status Maintained.
  - M: Anup Patel (`anup@brainfault.org`). His 2026 commits use `oss.qualcomm.com`, so he is at Qualcomm. His 2021 commits used `wdc.com`, and his 2023 and 2024 commits `ventanamicro.com`.
  - R: Atish Patra (`atish.patra@linux.dev`). His commits through 2025-09-09 used `rivosinc.com`. His current employer is not shown [NEEDS VERIFICATION].
  - Lists: kvm@vger.kernel.org, kvm-riscv@lists.infradead.org, linux-riscv@lists.infradead.org.
  - Tree: `https://github.com/kvm-riscv/linux.git`, branch `riscv_kvm_next`. Anup sends pull requests to Bonzini, who merges them into the KVM tree.
  - Covered paths: `arch/riscv/kvm/`, the KVM asm and uapi headers, `tools/testing/selftests/kvm/*/riscv/` and `tools/testing/selftests/kvm/riscv/`.
- No GitHub issue tracker is used for KVM/riscv development. The [kvm-riscv howto wiki](https://github.com/kvm-riscv/howto/wiki) is an index page with tutorials for QEMU, Spike and FireSim. The [kvm-riscv/linux issues page](https://github.com/kvm-riscv/linux/issues) lists 7 open feature gaps (see Section 11).

**Corporate contributors.** Commit counts since 2024-01-01 for `arch/riscv/kvm` and the RISC-V KVM selftests, by author email domain:

| Domain | Commits |
|---|---|
| ventanamicro.com | 83 |
| rivosinc.com | 48 |
| gmail.com | 40 |
| iscas.ac.cn | 36 |
| redhat.com | 29 |
| sifive.com | 21 |
| google.com | 19 |
| linux-foundation.org | 17 |
| oss.qualcomm.com | 13 |
| zte.com.cn | 12 |
| linux.alibaba.com | 9 |
| kernel.org | 8 |

The redhat.com, google.com and linux-foundation.org counts probably come mostly from tree-wide or generic-KVM changes that touch these paths. They do not necessarily indicate RISC-V KVM sponsorship. Other domains seen in the 2026 log are canonical.com, kylinos.cn, eswincomputing.com, ultrarisc.com, picoheart.com, intel.com and lanxincomputing.com. The contributor base is wide, with many single-patch fixes from independent and regional contributors.

**RISE.** The [RISE members page](https://riseproject.dev/members/) lists Qualcomm, Google, Red Hat, SiFive, Alibaba Damo, Canonical, ISCAS, ZTE and ESWIN among members. Ventana Micro and Rivos do not appear on the fetched list. Membership does not establish funding of KVM work (see Section 14).

**Culture on new work.** No explicit policy statement for or against new KVM features or ports was found. The mechanism is the sub-maintainer flow: kvm-riscv tree, then Bonzini, then Linus. Review on the kvm-riscv list is strict and substantive (see Section 12). Some recent submissions disclose AI assistance, and one thread carries an automated AI review bot. The 2026 patches cite Assisted-by tags, an OpenAI Codex disclosure and "sashiko-bot".

## 2. Port History and Upstreaming Timeline

KVM/riscv is fully upstream. It first appeared in v5.16. Anup Patel's original series was posted as an RFC in 2019, reached v4 in August 2019 and v20 in 2021 (v13 targeted H-extension v0.6.1). It took about two years to merge. Sources: [LWN 825864](https://lwn.net/Articles/825864/), [lkml v4 thread](https://lkml.iu.edu/1908.1/01481.html), [v20 patch](https://lore.kernel.org/lkml/20210927114016.1089328-3-anup.patel@wdc.com/).

Dates below are author dates, with commit (applied) dates where the clone gives a different one. First-release tags come from `git tag --contains` or `git describe --contains` in the clone. Each commit URL has the form `https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=<SHA>`. The data comes from the clone.

| Date | Event | Source |
|---|---|---|
| 2021-09-27 (applied 2021-10-04) | Initial skeletal KVM support, 12 files, 805 insertions (Anup Patel, then WDC). First release v5.16. | [99cdc6c18c2d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=99cdc6c18c2d) |
| 2022-07-29 | Svpbmt in guests, v6.0 | commit 6bb2e00ea304 (clone) |
| 2023-02-07 | SBI PMU for guests (Atish Patra, Rivos), v6.3 | [cbddc4c4cb9e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=cbddc4c4cb9e) |
| 2023-01-10 (applied 2023-04-21) | AIA skeleton (Anup Patel, Ventana). It detects hardware only, with no functionality. v6.4. | [54e43320c2ba](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=54e43320c2ba) |
| 2023-06-15 | In-kernel AIA APLIC and IMSIC, v6.5 | commits 74967aa208e2, db8b7e97d613 (clone) |
| 2023-07-25 | get-reg-list selftest (Haibo Xu, Intel), v6.6 | [477069398ed6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=477069398ed6) |
| 2023-12-20 | SBI STA (steal time) skeleton (Andrew Jones, Ventana), v6.8 | [5fed84a800e6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5fed84a800e6) |
| 2024-01-22 | sstc timer selftest (Haibo Xu), v6.9 | [d0b94bcbb042](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d0b94bcbb042) |
| 2024-04-02 / 2024-04-20 | ebreak selftest (Chao Du, ESWIN); SBI PMU selftest (Atish Patra). Both v6.10. | [f1c48c1ec735](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f1c48c1ec735), [158cb9e61cb7](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=158cb9e61cb7) |
| 2024-10-21 | Common SBI NACL support (KVM running as a guest, accelerated), v6.13 | [d466c19cead5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d466c19cead5) |
| 2025-05-15 | `KVM_CAP_RISCV_MP_STATE_RESET`, v6.16 | commit 5b9db9c16f42 (clone) |
| 2025-06-05 | SBI HFENCE no longer treated as NOP, v6.16 | [2e7be1629966](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2e7be1629966) |
| 2025-06-18 (applied 2025-07-28) | G-stage page-table factor-out and VMID parameter for hfence APIs. Both v6.17, nested-virtualization groundwork. | [dd82e35638d6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dd82e35638d6), [1f6d0eee54f7](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1f6d0eee54f7) |
| 2025-10-17 | SBI MPXY forwarding to userspace, v6.19 | commit 7050f1d79f1c (clone) |
| 2025-11-03 | Dirty log enabled gradually in small chunks (Dong Yang, ISCAS), v6.19 | [df60cb2e6702](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=df60cb2e6702) |
| 2025-11-27 | Transparent huge pages in G-stage (Jessica Liu, ZTE), v7.0 | commit ed7ae7a34bea (clone) |
| 2026-01-20 | "Nested virtualization for KVM RISC-V", 27 patches (Anup Patel, Qualcomm). Unmerged. | [pipermail](https://lists.infradead.org/pipermail/linux-riscv/2026-January/084022.html) |
| 2026-04-03 | Per-VM HGATP mode at runtime (Fangyu Yu, Alibaba), v7.1 | commit efcac8424ba6 (clone) |
| 2026-07-31 | Eager Page Splitting (Wang Yechao, ZTE), in the kvm-riscv-7.3-1 pull, v7.3 | commits 6c7f75ef096a and four others (clone) |
| 2026-08-14 | `KVM_PRE_FAULT_MEMORY` (Jinyu Tang), v7.4 | commit e8b32e377951 (clone) |
| 2026-10-22 | kvm-riscv-7.4-1 pull merged by Bonzini (commit 7e60162b16f9) | [GIT PULL](https://lists.infradead.org/pipermail/kvm-riscv/2026-October/013143.html) |

**Pull history (merge into the KVM tree, then release).** kvm-riscv-6.3-1 (2023-02-15), 6.4-1, 6.8-1 (2024-01-02), 6.11-1 (2024-07-12), 6.13-1 (2024-11-08), 6.13-2, 6.14-1 (2025-01-20), 6.15-1, 6.16-1, 6.17-2 (2025-07-29, ring-based dirty tracking), 6.18-1 (SBI FWFT), 6.19-1 (2025-12-02), 6.20-1 (2026-02-09, landed in v7.0), 7.1-1 (2026-04-13), 7.2-1 (2026-06-15), 7.3-1 (2026-08-18), fixes-7.3-1 (2026-09-21, v7.3-rc5), 7.4-1 (2026-10-22). One pull per release since v6.13 shows a steady cadence.

**Notes on dates and tags.**
- The AIA skeleton was applied three months after it was written, so author and applied dates differ.
- 1f6d0eee54f7 first appears in v6.17 (the clone confirms it). Only 2e7be1629966 is in v6.16.
- The exact merge date of the original v5.16 pull into Linus's tree was not found [NEEDS VERIFICATION].

**Key contributors by org.** Anup Patel (WDC, then Ventana, now Qualcomm), Atish Patra (Rivos), Andrew Jones (Ventana, then Qualcomm), Haibo Xu (Intel), Heinrich Schuchardt (Canonical), ISCAS, ZTE, Alibaba, ESWIN, UltraRISC, Kylin, Picoheart and SiFive engineers.

## 3. Upstream Support Tier

**Formal tier policy:** none. The kernel has no tier system. RISC-V is a mainline architecture and KVM/riscv has been in every mainline kernel since v5.16. The MAINTAINERS status for KVM/riscv is `Maintained`. Generic KVM and KVM/s390 are `Supported`. The interpretation that no one is paid specifically to maintain it is not sourced [NEEDS VERIFICATION]. RISC-V patch acceptance follows `Documentation/arch/riscv/patch-acceptance.rst`, which was not read [NEEDS VERIFICATION].

**Evidence.**
- CI: build and boot of defconfig kernels (CONFIG_KVM=m) in QEMU on the linux-riscv GitHub CI. No run of the KVM selftests was found (Section 7).
- Release-blocking: no evidence of any release-blocking KVM/riscv test.
- Official binaries: none. Upstream ships source only. Kernels come from distros.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In mainline | Data not available: not searched | Data not available: not searched | Yes, since v5.16 |
| MAINTAINERS status | Generic KVM entry: Supported | Data not available: not searched | Maintained |
| In-tree selftests | Yes (`KVM_INTEL`, `KVM_AMD` in selftest config) | Data not available: not searched | Yes (`TEST_GEN_PROGS_riscv`), no entries in selftest `config` |
| Dedicated CI running KVM tests | Data not available: not searched | Data not available: not searched | None found |
| Official binaries | n/a (source project) | n/a | n/a, distro only |

## 4. Technical Architecture and RISC-V-Specific Subsystems

KVM/riscv has no generic-code fallback for its architecture-specific parts. All of `arch/riscv/kvm/` (35 files) is RISC-V-specific. The content below comes from file listings and commit logs. File contents were not read, so line counts and detailed feature claims are [NEEDS VERIFICATION] unless tied to a commit.

| Component | riscv64 status | Files | Notes |
|---|---|---|---|
| World switch | Exists | `vcpu_switch.S` (only `.S` file in KVM tree) | Hand-written assembly. Uses HS-mode CSRs through raw CSR numbers, so no H-aware assembler is needed. |
| vCPU core, exits, ONE_REG | Exists | `vcpu.c`, `vcpu_exit.c`, `vcpu_insn.c`, `vcpu_onereg.c`, `vcpu_config.c`, `isa.c` | ISA extensions are exposed to the guest through ONE_REG and a config layer. |
| FP and vector guest state | Exists | `vcpu_fp.c`, `vcpu_vector.c` | Save and restore only. No SIMD dispatch or JIT. |
| G-stage MMU | Exists | `mmu.c`, `gstage.c`, `tlb.c`, `vmid.c` | THP (v7.0), eager page splitting (v7.3), per-VM HGATP mode (v7.1). |
| Interrupt virtualization | Exists | `aia.c`, `aia_aplic.c`, `aia_imsic.c`, `aia_device.c` | In-kernel AIA APLIC and IMSIC since v6.5. |
| Timer | Exists | `vcpu_timer.c` | Sstc timer selftest since v6.9. |
| PMU | Exists | `vcpu_pmu.c`, `vcpu_sbi_pmu.c` | Built only with `CONFIG_RISCV_PMU_SBI`. |
| Guest SBI emulation | Exists | `vcpu_sbi*.c` (base, forward, fwft, hsm, pmu, replace, sta, system, v01) | `vcpu_sbi_v01.o` built only with `CONFIG_RISCV_SBI_V01`. |
| Nested acceleration (NACL) | Exists | `nacl.c` | KVM as a guest under another hypervisor. v6.13. |
| Nested virtualization (L1 hypervisor in a guest) | Missing | none | No `vcpu_nested*.c` at HEAD. The 27-patch series is unmerged. |
| JIT backend | Not applicable, none under `arch/riscv/kvm` | none | |
| Crypto | Not applicable | none | |

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| World switch asm | Data not available: not searched | Data not available: not searched | `vcpu_switch.S` |
| Nested virtualization | Data not available: not searched | Data not available: not searched | Not merged |
| `KVM_PRE_FAULT_MEMORY` | Existing (cited in the riscv commit message) | Data not available: not searched | v7.4 |
| THP block mapping in stage-2 | Existing (cited in commit message) | Existing (cited in commit message) | v7.0 |

## 5. Build System, Cross-Compilation, and Toolchain

Kbuild and Kconfig are the build system. There is no cmake, configure step or `-D` flags. No Dockerfile is in the tree. `Documentation/arch/riscv/` contains no build guide. The commands below were composed from Kbuild and kselftest documentation, not run [NEEDS VERIFICATION]. The `riscv64-linux-gnu-` prefix is the usual Debian and Ubuntu name [NEEDS VERIFICATION for your host].

```
# GNU toolchain
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules

# LLVM toolchain
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules

# KVM selftests
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- headers
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -C tools/testing/selftests TARGETS=kvm
```

- `arch/riscv/configs/defconfig` has `CONFIG_VIRTUALIZATION=y` and `CONFIG_KVM=m` at lines 48-49, so no extra fragment is needed. To set by hand: `./scripts/config -e VIRTUALIZATION -m KVM`.
- The selftests need installed headers (`INSTALL_HDR_PATH = $(top_srcdir)/usr`). The riscv test list is `riscv/sbi_pmu_test`, `riscv/ebreak_test`, `access_tracking_perf_test`, `arch_timer`, `coalesced_io_test`, `dirty_log_perf_test`, `get-reg-list`, `mmu_stress_test`, `pre_fault_memory_test`, `rseq_test`, `steal_time`, plus the common set. Source: `tools/testing/selftests/kvm/Makefile.kvm`.
- Disable switches are Kconfig only: `CONFIG_KVM=n`, `CONFIG_RISCV_PMU_SBI=n` (drops PMU emulation objects), `CONFIG_RISCV_SBI_V01=n` (drops legacy SBI v0.1 emulation). With `CONFIG_RISCV_ISA_V=n`, `vcpu_vector.o` is still built.

**Toolchain minimums** (kernel-wide, from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| binutils | 2.30.0 |
| Clang/LLVM (optional) | 17.0.1 |
| GNU make | 4.0 |
| Python | 3.9 |
| pahole (BTF) | 1.26 |

No documented reason for the GCC 8.1 floor was found. `Documentation/kbuild/llvm.rst` lists riscv as Supported with `LLVM=1`.

**RISC-V-specific toolchain constraints (`arch/riscv/Kconfig`).**
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies with GNU as 2.36 or newer. binutils 2.38 and GCC 12.1 adopted the 20191213 ISA spec, so Zicsr and Zifencei must be named in `-march`.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies to GCC older than 11.3.0.
- `TOOLCHAIN_HAS_V` needs binutils 2.38 or newer, or lld. With older binutils, `RISCV_ISA_V` silently turns off.
- `TOOLCHAIN_HAS_ZBA`, `ZBB`, `ZBC` and `ZBKB` need binutils 2.39 or newer, or lld.
- `ARCH_HAS_BROKEN_DWARF5` is set when LLVM as or lld is older than 18.0.0.

**QEMU usage.** The clone has no QEMU launch command for riscv KVM. `Documentation/virt/kvm/review-checklist.rst` only says features should be testable under QEMU or kvmtool. The commands below are from general knowledge, not a primary source [NEEDS VERIFICATION]:

```
# KVM guest on a riscv64 host with the H extension
qemu-system-riscv64 -M virt -accel kvm -cpu host -smp 2 -m 2G -nographic \
  -kernel Image -append "root=/dev/vda rw console=ttyS0" \
  -drive file=rootfs.img,format=raw,if=virtio

# Test KVM host code under TCG with H enabled (cpu model needs verification)
qemu-system-riscv64 -M virt -cpu rv64,h=true -smp 4 -m 4G -nographic \
  -kernel Image -append "root=/dev/vda rw console=ttyS0" \
  -drive file=rootfs.img,format=raw,if=virtio
```

AIA in-kernel interrupts use `-M virt,aia=aplic-imsic` [NEEDS VERIFICATION]. A search result says the selftests need a guest address space of at least 48 bits (hardware or QEMU with Sv48). This is not checked against the code [NEEDS VERIFICATION].

**Known build failures.** No open build failure was found in the upstream tree. Two patches show where builds break:
- A build fix with vector support disabled (Zhanpeng Zhang) is in the 7.4 pull.
- The unmerged WFI trap policy patch v3 first failed with `CONFIG_KVM=m` because of an `early_param`. v3 wrapped it in `#ifndef MODULE`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

arm64 and amd64 KVM feature data was not collected. The matrix below covers riscv64 only, and the comparison columns say so.

| Feature | riscv64 status | First release | amd64 / arm64 |
|---|---|---|---|
| Basic VM, vCPU run, MMIO | Merged | v5.16 | Data not available: not searched |
| SBI PMU for guests | Merged | v6.3 | Data not available |
| AIA in-kernel irqchip (APLIC, IMSIC) | Merged | v6.5 | Data not available |
| Steal-time (SBI STA) | Merged | v6.8 | Data not available |
| Guest statistics, `perf kvm stat` | Merged | v6.11, v6.17 | Data not available |
| SBI NACL (KVM as a nested guest) | Merged | v6.13 | Data not available |
| Svade, Svadu, Svvptc, Zabha, Ziccrse | Merged | v6.13-v6.14 | Data not available |
| Ring-based dirty tracking | Merged | v6.17 | Data not available |
| SBI FWFT (misaligned delegation, pointer masking) | Merged | v6.18 | Data not available |
| SBI MPXY forwarding | Merged | v6.19 | Data not available |
| Dirty log in chunks | Merged | v6.19 | Data not available |
| THP in G-stage | Merged | v7.0 | arm64 and x86 do this, per the commit message |
| Per-VM HGATP mode | Merged | v7.1 | Data not available |
| Eager Page Splitting | Merged | v7.3 | Data not available |
| `KVM_PRE_FAULT_MEMORY` | Merged | v7.4 | x86 had it first, per the commit message |
| Nested virtualization (L1 hypervisor) | Not merged | n/a | Data not available |
| PMU event filter ioctl | Unmerged (reviewed, rework requested) | n/a | Data not available |
| SBI DBTR (debug trigger) virtualization | Not merged. Qualcomm is working on a series (per Anup Patel). | n/a | Data not available |
| KVM_VFIO on RISC-V | Posted as patch 6 of 10 in an IOMMU series (v7) | n/a | Cross-reference to the Linux IOMMU report |
| AIA irq-bypass | Tracked as RISE issue #9 | n/a | Data not available |
| Guest migration in QEMU RISC-V | Open gap, kvm-riscv/linux issue #26 | n/a | Data not available |
| CoVE, pKVM | Out of scope, see pKVM report | n/a | |

**Functional gaps (cannot do X at all).** Run a guest hypervisor under KVM (nested). Filter PMU events per VM. Virtualize debug triggers. Hardware breakpoints and watchpoints through KVM in QEMU (stubs return -EINVAL, per the QEMU report). Expose the Vector extension to guests in crosvm (per the crosvm report).

**Performance gaps.** No published KVM-on-riscv64 benchmark was found: no guest-versus-native overhead, VM-exit cost or interrupt latency. Do not infer a delta. Isolated figures, none of them a cross-architecture comparison:
- Dong Yang's chunked-dirty-log commit reports that `memory_global_dirty_log_start` on a 2 GB guest with 4K pages fell from 4490.23 ms to 31.94 ms. The commit says the test ran nested, on a QEMU VM on an Intel i5-12500H. This is not a RISC-V hardware result [NEEDS VERIFICATION of the host architecture].
- The unmerged WFI trap-policy patch reports about 5% host CPU use and about 4 exits in `auto` mode, on QEMU TCG with `-smp 1` over 3 s. This is a TCG result, not hardware.
- The unmerged Vector-resident RFC reports trace counts (785 owner hits) and no timing.

**Security hardening.** Fuzzing finds bugs regularly. The 7.1 pull carried fixes from KVM API fuzzing (steal-time alignment, vector allocation leak, PMU out-of-bounds and double-free). The 6.20 pull carried AIA/IMSIC fixes found by API fuzzing. A Spectre-v1 fix in APLIC (January 2026) and `array_index_nospec()` hardening in `kvm-riscv-fixes-7.0-1` were reported [NEEDS VERIFICATION for the second]. The syzbot RISC-V instance was reported unable to fuzz for 97 days because the kernel would not boot, in a kasan-dev thread of unknown date [NEEDS VERIFICATION of current state].

**NaN and floating-point semantics.** No NaN-semantics issue was found. One FP state bug is relevant: [Launchpad 2077731](https://bugs.launchpad.net/ubuntu/+source/edk2/+bug/2077731). KVM did not set vsstatus.FS while OpenSBI had enabled FS in mstatus. The result was an illegal-instruction exception on `fcvt.d.w` under KVM in EDK II. The fix went into EDK II, not the kernel (Section 11).

## 7. CI/CD Infrastructure

**In-tree.** The kernel tree has no CI config of its own. The repo root has no `.gitlab-ci.yml`, `.github/`, `.travis`, `.circleci`, `Jenkinsfile`, `.kernelci` or `ci/`. MAINTAINERS names no CI service for KVM/riscv (no `W:` field). The only in-tree wiring is selftest build support in `tools/testing/selftests/kvm/Makefile.kvm` and the riscv defconfig with `CONFIG_KVM=m`.

- The selftest config fragment `tools/testing/selftests/kvm/config` lists `CONFIG_KVM=y`, `KVM_INTEL`, `KVM_AMD`, `EVENTFD`, `USERFAULTFD` and `IDLE_PAGE_TRACKING`. It has no RISC-V entries, so a KernelCI-style kselftest config would not enable KVM on riscv64 without extra options. `settings` sets `timeout=120`.
- KUnit: `tools/testing/kunit/configs/` has only `all_tests`, `arch_uml`, `coverage_uml` and `default`. `arch/riscv/kvm` has no KUnit files by listing. A content search failed on disk-space errors, so KUnit coverage is [NEEDS VERIFICATION].

**External CI.**
- linux-riscv GitHub CI, per [Bjorn Topel's 2024-09-30 post](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html):
  - Repos: github.com/linux-riscv/linux-riscv (RISE-sponsored runners), github.com/linux-riscv/github-ci, github.com/linux-riscv/docker.
  - `ci-series` builds and boots in QEMU. `ci-kselftest` was experimental, ran on bpf, bpf-next and Linus's master, and used defconfig plus `kselftest-merge`.
  - The post does not say KVM selftests run, and `.github/workflows` could not be read [NEEDS VERIFICATION].
- KernelCI and LKFT cover some RISC-V testing, per the same post. No `kselftest-kvm` plan for riscv was found. Dashboards and `test-configs.yaml` were not readable [NEEDS VERIFICATION].
- Jenkins, GitLab, buildbot: none found.
- syzbot: no report for `arch/riscv/kvm` turned up. The dashboard was not fetched.
- Per the 2026-05-12 RISE post ["RISE RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/), the EM-RV1 runner nodes "do not support virtualization", and they run an older 5.10.x vendor kernel. Named heavy users are llama.cpp, PyTorch, k0s, Kairos, pq-code-package and NumPy. No KVM or kernel workload is named. KVM selftests cannot run on these runners.
- Running KVM tests in CI needs a RISC-V host with the H extension, real hardware or QEMU with H.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel build in CI with KVM enabled | Data not available: not searched | Data not available: not searched | Yes (defconfig, CONFIG_KVM=m, linux-riscv GitHub CI) |
| Boot test | Data not available | Data not available | QEMU boot in `ci-series` |
| KVM selftests in CI | Data not available | Data not available | None found |
| Selftest config entries | Yes (`KVM_INTEL`, `KVM_AMD`) | Data not available | None |
| Hardware with virtualization in CI | Data not available | Data not available | None found (RISE runners lack it) |
| QEMU project KVM job | Data not available | Data not available | Cross-build only (`cross-riscv64-kvm-only`), no execution, per QEMU report |

## 8. Distribution and Release Status

**Upstream binaries.** Upstream ships source only. KVM is not packaged separately. It ships inside the kernel.
- PyPI: `linux-kvm` returns 404 on the [JSON API](https://pypi.org/pypi/linux-kvm/json). The [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) lists no KVM entry.
- Ubuntu 26.04 (resolute) riscv64: no `linux-kvm` package. The kernel is `linux-image-generic` and `linux-image-7.0.0-14-generic` in main, per the [archive index](https://ports.ubuntu.com/ubuntu-ports/dists/resolute/). The Release file is dated 2026-04-23. Whether `CONFIG_KVM` is enabled in that image was not checked [NEEDS VERIFICATION].
- Related package names with "kvm" in riscv64 Ubuntu: `nova-compute-kvm` (main), `librte-power-kvm-vm26`, `librust-kvm-bindings-dev`, `librust-kvm-ioctls-dev` (universe). These are not the kernel hypervisor.
- Debian, Fedora, Arch, openSUSE: Data not available: not searched.
- Anolis OS has a downstream 6.6 kernel with riscv KVM, per [bug 28801](https://bugzilla.openanolis.cn/show_bug.cgi?id=28801).
- Mainline v7.3 is the latest final release. v7.4-rc1 is tagged.

**What a user must do for a working KVM host.**
1. Obtain riscv64 hardware with the H extension. The edk2 bug was reproduced and verified on a HiFive Premier P550. A patch from Davidlohr Bueso concerns envcfg on the SiFive P550. Other H-capable silicon: Data not available: not searched.
2. Run a kernel with `CONFIG_KVM=m` (built from the riscv defconfig, or a distro kernel with unverified status).
3. Boot with OpenSBI (M-mode firmware). Guest-visible SBI extensions such as STA, NACL and FWFT also need host firmware support.
4. Use a VMM: QEMU with KVM acceleration, kvmtool, or crosvm. Firecracker has no merged riscv64 support (Section 9).

## 9. Dependencies

Dependency data for QEMU, OpenSBI, crosvm, Firecracker and libvirt comes from the existing project reports. No dependency row was checked against the package graph [NEEDS VERIFICATION for all rows below].

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. Host kernel and generic KVM core that `arch/riscv/kvm` builds on. | `CONFIG_KVM` builds in-tree since v5.16. defconfig sets it to m. | Selftests exist under `tools/testing/selftests/kvm/riscv/`. No CI run found. | Mainline since v5.16. Distro KVM config unverified. | Active. Recent fixes (NACL hfence loop and order, IMSIC serialization, APLIC Spectre-v1) show a still-maturing code base. |
| OpenSBI | runtime-dependency, critical. M-mode SBI provider (HSM, IPI, RFENCE with HFENCE.GVMA/VVMA, PMU, DBCN, SUSP, FWFT). KVM requires `RISCV_SBI`. | Per the OpenSBI report, all SBI handler files exist and H-extension support underpins KVM. | See `project-reports/opensbi.md`. | See `project-reports/opensbi.md`. | RISE-funded RP016 (APLIC and VIRQ in OpenSBI) is firmware work, not KVM. [Blog post](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/) |
| GCC | build-dependency, critical. Minimum 8.1.0. GCC below 11.3.0 needs the old ISA spec workaround. | Supported by kernel Kbuild | Data not available: no GCC report consulted | Data not available: no GCC report consulted | Data not available |
| GNU binutils | build-dependency, critical. Minimum 2.30. 2.38 for vector, 2.39 for Zba/Zbb/Zbc/Zbkb. | Supported by kernel Kbuild | Data not available | Data not available | Data not available |
| LLVM | build-dependency, optional. Clang/LLVM 17.0.1 minimum. `LLVM=1` listed as Supported for riscv. | Supported per `Documentation/kbuild/llvm.rst`. LLVM as or lld older than 18 triggers the broken-DWARF5 flag. | Data not available | Data not available | Data not available |
| QEMU | test-dependency, optional. Primary VMM and KVM test host. | `target/riscv/kvm/`, 3 files, about 2,231 lines. Syncs 65+ ISA extensions via ONE_REG, supports AIA, vector state and SBI exits. | No KVM execution job on riscv64 in QEMU CI, only the cross-build `cross-riscv64-kvm-only`. | QEMU 11.0 per the QEMU report. | Active. A v11 migration fix merged in August 2026. Hardware breakpoints and watchpoints through KVM are not supported (stubs return -EINVAL). |
| kvmtool | test-dependency, optional. The kernel project's reference userspace VMM. | riscv kvmtool support was posted as v10 of an 8-patch series for the kernel side merged in 5.16-rc1 ([lore thread](https://lore.kernel.org/kvm/87mtm17ovr.wl-maz@kernel.org/T/)). Current build state: Data not available: not tested. | Data not available | Data not available | Active patches on kvm-riscv list in October 2026 (FDT placement by Andrew Jones, FDT alignment by Mika Tammi). |

**Additional and indirect dependencies.**

| Name | Role | Status |
|---|---|---|
| RISC-V H extension (hardware) | Required feature. Also Sstc, AIA and SBI NACL for the full feature set. | Exercised on QEMU with H. Real-hardware coverage: P550 evidence only (Section 8). |
| crosvm | Rust VMM on the KVM ioctl ABI. | riscv64 in main since 2021-11-02, with AIA IMSIC/APLIC. Tests run in `qemu-riscv64` user mode only. No official riscv64 binaries confirmed. No Vector exposure to guests. No pKVM on riscv64. |
| Firecracker | microVM VMM on KVM. | No riscv64 code on `main`. Only unmerged PRs #4754 and #5227, plus rejected #4319. No CI or releases. |
| Cloud Hypervisor | Rust VMM on KVM. | Data not available: docs URL returned 404. Tracked as RISE issue #111. |
| libvirt | Management layer over QEMU/KVM. | riscv64 guest support landed in libvirt 4.7.0 (2018-09). |
| kvm-ioctls, kvm-bindings (rust-vmm) | Rust ioctl bindings. | The kvm-ioctls CHANGELOG says v0.19.0 added "Introduce `riscv64` ioctls". Completeness and crates.io state [NEEDS VERIFICATION]. |
| kvm-unit-tests | Guest-side functional tests. | The kvm-riscv list in October 2026 carried kvm-unit-tests patches (ACPI boot, BRS-I SBI tests by Xiang W; a timer-delay race fix by Qingwei Hu). Build and CI state: Data not available. |

Recursion into libraries with SIMD, JIT or crypto was not applicable: none of these dependencies were reported to carry such code relevant to KVM.

## 10. Ecosystem Status

Not applicable. KVM has no dependent package ecosystem that must be enabled on riscv64. It is part of the kernel, and no PyPI, npm or similar packages exist. The VMMs that consume the KVM ABI are covered in Section 9.

## 11. Known Bugs and Active Issues

KVM/riscv uses mailing lists, so most items have no tracker ID. The identifier is the commit SHA, or subject, author and date.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Patch by Pengpeng Hou, 2026-09-01 | Preserve LCOFIP when checking pending interrupts | Unmerged, stale for 61 days | Correctness | The VSIP-to-HVIP shift moves LCOFIP (bit 13) to bit 14 in `kvm_riscv_vcpu_has_interrupts()`. `kvm_arch_vcpu_runnable()` can then return false for a WFI vCPU with a pending PMU overflow interrupt. Fixes 16b0bde9a37c. [Thread](https://ratatoskr.run/kvm/2026/09/17490043/t) |
| Same thread | Same LCOFIP shift error in the `sip` CSR accessors in `vcpu_onereg.c` | Unfixed | Correctness | Flagged by sashiko-bot, an automated AI review. It can corrupt PMU overflow state on save, restore or migration. [NEEDS VERIFICATION, single automated source] |
| Jiakai Xu, 2026-09-08 | Fuzzing WARNING in `mark_page_dirty_in_slot()` with dirty ring enabled | Open, no replies, no reproducer | Correctness (warning) | Seen on riscv_kvm_queue at 9167580a3495. The author links it to the per-CPU running-vCPU assumption. [Thread](https://ratatoskr.run/linux-riscv/2026/09/17529950) |
| 52c6b7d20d3e (2026-08-04, Yicong Yang) | vsip/hvip conversion fix | Merged in kvm-riscv-fixes-7.3-1 | Correctness | The pull history lists the fix, so it is merged. The LCOFIP patch above is a separate, related bug. |
| e971f19e4c82 (2026-07-16) | NACL hfence infinite loop (`try_count` never decremented) | Merged; fix pull for 7.2 or 7.3 [NEEDS VERIFICATION] | High (soft lockup) | Fixes d466c19cead5 |
| b3d346838ec6 (2026-08-26) | NACL hfence entry write order | Merged, v7.3-rc5 | Correctness | SBI v3.0 section 15.1.2 requires pnum and pcount first and Config last. A flush could use stale ranges. |
| d8538f942fd1 (2026-10-01) | MMIO load with rd=x0 wrote into `guest_context.zero` | Merged, v7.4 | Correctness | Fixes 9f7013265112 |
| 8ae12ccaec6e, ed54fdb460a6, f41fb17143df (2026-08-10) | IMSIC attribute serialization, page release after MMU invalidation, G-stage fault propagation | Merged | Correctness | Xie Bo (UltraRISC) |
| 735bc20c2418, b7749531a9b1, c7e2cc38c561, 057dd2639cea, 8b3fd1a8b305 | PMU event info array overflow, snapshot `sdata` leak, counter and snapshot fixes | Merged | Correctness and memory safety | July-August 2026 |
| Patch 012877 (Jinyu Tang) | Huge leaf can overwrite a valid non-leaf G-stage entry | Unmerged, rework requested | Correctness | Fixes 9d05c1fee837. Anup asked to try 2M before 4K for a 1G mapping. |
| Patches 013222, 013136, 013166, 013153, 013164 | G-stage memory leak on VM destroy; double free of split page cache; aia_irq2bitpos[] out-of-bounds; IMSIC write ordering; PMU counter validation | Unmerged, posted October-November 2026 | Correctness and memory safety | Status of each: Data not available beyond the subject list |
| Patch 013155 (Davidlohr Bueso) | Do not touch envcfg CSRs on the SiFive P550 | Unmerged | Hardware quirk | Also patch 012957 (senvcfg only where it exists) |
| Out-of-bounds in firmware counter read (v4, March 2026); Zalasr guest exposure (v4, Jan 2026) | | Unknown | Correctness; gap | [NEEDS VERIFICATION] Zalasr appears in the 6.20 pull, so it is probably merged |
| [Launchpad 2077731](https://bugs.launchpad.net/ubuntu/+source/edk2/+bug/2077731) | EDK II crashes under KVM on riscv64 | Fixed in EDK II (PR #6210, 2024-10-04); kernel and QEMU tasks Invalid | Downstream | Root cause: vsstatus.FS not set under KVM while OpenSBI enabled FS. Reproduced on 6.8.0-31, next-20240913 and 6.11.0-rc7. |
| [OpenAnolis 28801](https://bugzilla.openanolis.cn/show_bug.cgi?id=28801) | Nested KVM in a TCG VM with CPU model rva23s64 fails with an illegal-instruction Oops | NEW, P3-Medium | Downstream (kernel 6.6.102-5) | The title implies a missing Sscofpmf extension. Cause not stated. |
| kvm-riscv/linux #26, #18, #15, #9, #8, #7, #3 | Open feature gaps: QEMU migration; tracepoints; ONE_REG for virtual HS-mode state; SBI PTS (3 issues); nested virtualization | Open, dates and status not checked | Gaps | [Issues](https://github.com/kvm-riscv/linux/issues) |

Historic fixed items from snippets [NEEDS VERIFICATION]: Launchpad 1985067 (SRCU deadlock in `kvm_riscv_check_vcpu_requests()`), and the 6.19 Andes VS-stage TLB flush after vCPU migration.

**Correctness bugs highlighted.** The NACL hfence issues, MMIO x0 write, PMU snapshot bugs and the open LCOFIP and dirty-ring items are correctness defects in shipping code. Most were found by fuzzing, static review or individual contributors, which means test coverage in CI did not catch them.

## 12. Objections and Upstream Blockers

**Stated objections (from the kvm-riscv list, October 2026, via Anup Patel).**
- Lazy VMID rollover (Wenlong Li, v3, patch 012955): NACKed. "The synchronous IPI on VMID roll-over is required for correctness." Running guests must update their VMID immediately.
- SBI DBTR forwarding (Xie Bo, patch 012800): rejected for now. It would fail like SBI PMU forwarding because host and guest share hardware debug triggers. Qualcomm is working on an SBI DBTR virtualization series, so contributors should wait for it.
- G-stage ptdump debugfs (Dylan.Wu, patch 012799): not ready. It assumes every level has the same table size, but the G-stage root is 16 KB. The number of levels also differs per guest.
- WFI trap policy (Yuhang Chen, v3, patch 012829): convert from `early_param` to `module_param`. Not merged.
- PMU event filter (patch 012830): the structure does not cover SBI PMU RAW and RAWv2 events. Not merged.
- Huge-leaf overwrite fix (patch 012877): "needs more work".

**Technical blockers.** Nested virtualization for guest hypervisors is not merged. The 27-patch series was posted on 2026-01-20 (message ID `20260120080013.2153519-1-anup.patel@oss.qualcomm.com`). No revision (v2 or later) was found. No nested-KVM thread appears in the October 2026 index (about 100 threads) or the November index (43 messages), though lore could not be read [NEEDS VERIFICATION]. The groundwork (NACL, G-stage factor-out, hfence VMID parameters) is merged, and the upstream pull for 7.1 listed "nested-virtualization groundwork". The 7.4 pull does not mention nested virtualization.

**Organizational blockers.**
- One maintainer and one reviewer for the full subsystem. A GIT PULL for 7.4 was late because Anup was on vacation. Review latency on external patches is visible in the October backlog (patches 012799 through 013272).
- Lore and patchwork were not accessible, so mailing-list coverage is incomplete.
- RISE: no funded KVM project was found. The Kernel KVM working group coordinates and tracks (Section 14).
- The syzbot RISC-V instance outage (97 days, date unknown) limits automated fuzz coverage [NEEDS VERIFICATION].

**Acceptance probability.** Not applicable for the base port: it is merged. For the in-flight items: patches that meet Anup's comments (module_param, event structure fix) have a clear path. Items he NACKed (lazy VMID rollover) have a stated correctness objection. Nested virtualization is the maintainer's own series, so the objection risk is low, but timing is unknown.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

KVM/riscv is mainline since v5.16 and is built as `CONFIG_KVM=m` in the riscv [defconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/configs/defconfig), checked in the clone. The linux-riscv GitHub CI builds and boots defconfig kernels in QEMU, so KVM is compiled in CI. No CI job runs the KVM selftests (`tools/testing/selftests/kvm/riscv`) on riscv64: the selftest config has no RISC-V entries, the RISE runners lack virtualization, and no KernelCI or LKFT kselftest-kvm plan was found. Build-only CI is therefore yellow. The consumable riscv64 kernel comes from a distro (Ubuntu 26.04 linux-image-generic, whether it enables KVM is unverified), not from upstream, which ships source only. The [MAINTAINERS entry](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/MAINTAINERS) names Anup Patel (Qualcomm) as maintainer and Atish Patra as reviewer.

**Pending work that could change the grade.**
- Not a funded RISE project. RISE has a Kernel KVM working group (lead Sunil V L, Qualcomm) and tracks KVM items as open issues in [riseproject-dev/kernel-and-virtualization-wg](https://github.com/riseproject-dev/kernel-and-virtualization-wg) (nested virtualization #127, AIA irq-bypass #9, KVM selftests and unit tests).
- The 27-patch "Nested virtualization for KVM RISC-V" series (Anup Patel, 2026-01-20) is unmerged.
- Two things would move the grade toward blue: a CI job that runs the riscv KVM selftests (needs a runner with the H extension, either real hardware or QEMU with H), or kselftest-kvm on riscv64 in KernelCI or LKFT.
- Open or recent fixes: the LCOFIP pending-interrupt shift bug (September 2026), a dirty-ring WARNING found by fuzzing, and NACL hfence fixes from July and August 2026.
- Unverified: whether linux-riscv `ci-kselftest` runs KVM tests, whether Ubuntu's riscv64 image has CONFIG_KVM and carries riscv64 patches, and whether KernelCI covers it.

## 14. Investment Analysis

**RISE check first.** The RISE Kernel KVM working group exists (lead Atish Patra, Rivos, elected 2025-03-31 per the [results post](https://riseproject.dev/2025/03/31/working-group-lead-election-results/); lead Sunil V L, Qualcomm, per the [2026-05-04 results post](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)). Its repo has 62 open issues and a [project board](https://github.com/orgs/riseproject-dev/projects/14). Open issues are planned or tracked work, not delivered or funded. No RISE-funded RPxxx project for KVM was found. The only funded kernel-adjacent project found is RP016 (OpenSBI APLIC and VIRQ), which is firmware. A December 2024 RISE webinar deck reportedly lists KVM selftests, KVM unit tests, in-kernel AIA irqchip and host nested acceleration as upstreamed, and KVM irqbypass and SBI v3.0 as next. These come from a search summary of an image-based PDF [NEEDS VERIFICATION]. The nested virtualization series, DBTR (Qualcomm in progress), and CoVE and IOMMU items are already owned or covered elsewhere, so they are not sized here.

Effort figures below are engineering estimates by the author for planning, not sourced findings. Each assumes one experienced kernel engineer.

### 14.1 Functional Enablement

- Review, test and help land the nested virtualization series. It needs H-extension nested testing infrastructure. Owner: Anup Patel's team with RISE WG support.
- Triage and fix the open correctness items: LCOFIP shift (patch exists, needs review push), dirty-ring WARNING reproducer and fix, and the October 2026 unmerged fix patches (G-stage leak on VM destroy, split page cache double free, aia_irq2bitpos out-of-bounds).
- Review capacity: a second reviewer is a bottleneck relief for a one-maintainer subsystem.
- Verify the Ubuntu 26.04 riscv64 kernel config for `CONFIG_KVM`, and file a distro request if it is off.

### 14.2 Performance Optimization

- No benchmark data exists. First step is a published, repeatable guest-versus-native and VM-exit-cost baseline on real H-extension hardware, using the existing `dirty_log_perf_test`, `access_tracking_perf_test`, `mmu_stress_test` and `arch_timer` selftests as a start.
- Evaluate in-flight performance patches with measurements: the Vector-resident RFC (no timings reported), the hart-to-vCPU xarray for MSI injection, the WFI trap policy.

### 14.3 CI/CD Infrastructure

- Add a CI job that builds and runs `tools/testing/selftests/kvm` on riscv64 with an H-capable target. A QEMU TCG job with H enabled is the cheapest start, but the guest address-space requirement of at least 48 bits needs checking [NEEDS VERIFICATION]. A real-hardware runner is the stronger option.
- Add RISC-V entries to `tools/testing/selftests/kvm/config`.
- Request a kselftest-kvm plan for riscv64 in KernelCI and LKFT.
- Check syzbot RISC-V instance health.
- Add a KVM execution job to QEMU CI for riscv64.

### 14.4 Ecosystem Enablement

No package ecosystem. VMM-side work: Firecracker upstream does not accept riscv64 (see the Firecracker report); crosvm lacks Vector exposure and pKVM on riscv64 (see the crosvm report); Cloud Hypervisor status is unknown. Those belong in their own reports. KVM-specific item here: verify the kvm-ioctls and kvm-bindings riscv64 coverage.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Test and review support for nested virtualization series | 12-16 | RISE WG with Qualcomm | High |
| Functional | Fix and land LCOFIP, dirty-ring WARNING and pending memory-safety patches | 4-6 | Kernel team | High |
| Functional | Second KVM/riscv reviewer capacity | Ongoing, about 0.2 FTE | RISE members | Medium |
| Functional | Verify and fix distro `CONFIG_KVM` in Ubuntu riscv64 | 1-2 | Distro liaison | Medium |
| Performance | Publish guest-versus-native and VM-exit baseline on H hardware | 6-8 | Hardware owner | High |
| Performance | Measure the in-flight perf RFCs | 3-4 | Kernel team | Low |
| CI/CD | KVM selftests job on riscv64 (QEMU H first) | 3-5 | RISE infrastructure | Critical |
| CI/CD | Real H-extension hardware runner for KVM selftests | 6-10 | RISE infrastructure | High |
| CI/CD | KernelCI or LKFT kselftest-kvm plan, selftest config RISC-V entries | 3-5 | Kernel team | High |
| CI/CD | syzbot RISC-V instance health check | 2-4 | Kernel team | Medium |
| Ecosystem | kvm-ioctls and kvm-bindings riscv64 verification | 1-2 | VMM owners | Low |

## 15. References

- [KVM documentation, docs.kernel.org](https://docs.kernel.org/virt/kvm/index.html)
- [Linux kernel source tree (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [riscv defconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/configs/defconfig)
- [MAINTAINERS](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/MAINTAINERS)
- [Commit 99cdc6c18c2d, initial skeletal KVM support](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=99cdc6c18c2d)
- [Commit cbddc4c4cb9e, SBI PMU](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=cbddc4c4cb9e)
- [Commit 54e43320c2ba, AIA skeleton](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=54e43320c2ba)
- [Commit 5fed84a800e6, SBI STA](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5fed84a800e6)
- [Commit 477069398ed6, get-reg-list selftest](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=477069398ed6)
- [Commit d0b94bcbb042, sstc timer selftest](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d0b94bcbb042)
- [Commit f1c48c1ec735, ebreak selftest](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f1c48c1ec735)
- [Commit 158cb9e61cb7, SBI PMU selftest](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=158cb9e61cb7)
- [Commit d466c19cead5, common NACL support](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d466c19cead5)
- [Commit 2e7be1629966, SBI HFENCE not NOP](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2e7be1629966)
- [Commit dd82e35638d6, g-stage factor-out](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dd82e35638d6)
- [Commit 1f6d0eee54f7, VMID parameter for hfence APIs](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1f6d0eee54f7)
- [Commit df60cb2e6702, dirty log in small chunks](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=df60cb2e6702)
- [GIT PULL, KVM/riscv changes for 7.4](https://lists.infradead.org/pipermail/kvm-riscv/2026-October/013143.html)
- [Nested virtualization series, linux-riscv list archive](https://lists.infradead.org/pipermail/linux-riscv/2026-January/084022.html)
- [KVM/riscv changes for 7.1 pull summary](https://ratatoskr.run/kvm/2026/04/9575586/t)
- [MMU related improvements for KVM RISC-V, LWN](https://lwn.net/Articles/1025380/)
- [KVM RISC-V Support series, LWN](https://lwn.net/Articles/825864/)
- [KVM RISC-V Support v4 thread](https://lkml.iu.edu/1908.1/01481.html)
- [KVM RISC-V Support v20 patch](https://lore.kernel.org/lkml/20210927114016.1089328-3-anup.patel@wdc.com/)
- [kvmtool riscv series thread](https://lore.kernel.org/kvm/87mtm17ovr.wl-maz@kernel.org/T/)
- [kvm-riscv howto wiki](https://github.com/kvm-riscv/howto/wiki)
- [kvm-riscv/linux issues](https://github.com/kvm-riscv/linux/issues)
- [LCOFIP patch thread](https://ratatoskr.run/kvm/2026/09/17490043/t)
- [Dirty-ring WARNING thread](https://ratatoskr.run/linux-riscv/2026/09/17529950)
- [Launchpad bug 2077731, edk2 under KVM](https://bugs.launchpad.net/ubuntu/+source/edk2/+bug/2077731)
- [OpenAnolis bug 28801](https://bugzilla.openanolis.cn/show_bug.cgi?id=28801)
- [linux-riscv GitHub CI post, Bjorn Topel](https://lkml.iu.edu/hypermail/linux/kernel/2409.3/07768.html)
- [KernelCI kselftest docs](https://docs.kernelci.org/legacy/tests/kselftest)
- [Testing Quality Call notes 2024-06-13](https://lkml.iu.edu/hypermail/linux/kernel/2406.2/03473.html)
- [RISC-V SBI base extension selftest thread](https://lkml.iu.edu/hypermail/linux/kernel/2404.0/07767.html)
- [RISE members](https://riseproject.dev/members/)
- [RISE Working Group Lead Election Results, 2025-03-31](https://riseproject.dev/2025/03/31/working-group-lead-election-results/)
- [RISE Working Group Elections Results, 2026-05-04](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)
- [RISE RISC-V Runners: six weeks in, 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Advancing OpenSBI Interrupt Handling, 2026-07-16](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE kernel-and-virtualization-wg repository](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [RISE Kernel and Virtualization project board](https://github.com/orgs/riseproject-dev/projects/14)
- [RISE December 2024 webinar slides](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [RISE wheel builder index](https://riseproject.gitlab.io/python/wheel_builder/)
- [PyPI linux-kvm lookup](https://pypi.org/pypi/linux-kvm/json)
- [Ubuntu ports archive, resolute](https://ports.ubuntu.com/ubuntu-ports/dists/resolute/)