---
title: Linux Vector
parent: Project Reports
color: blue
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
  - name: dtc
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-vector" %}

# Linux Vector

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux Vector<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux Vector is RISC-V Vector (RVV) support in the mainline Linux kernel. It is not a standalone package. It lives under `arch/riscv` and in a few shared directories. The vector-related code in the tree is:

- Context state and the userspace ABI: `arch/riscv/kernel/vector.c`, `arch/riscv/include/asm/vector.h`, and vector hooks in `entry.S`, `process.c`, `ptrace.c`, `signal.c` and `compat_signal.c`.
- Kernel-mode vector: `arch/riscv/kernel/kernel_mode_vector.c`.
- Vectorized user copy: `arch/riscv/lib/uaccess_vector.S`, `arch/riscv/lib/riscv_v_helpers.c`.
- XOR and RAID6: `lib/raid/xor/riscv/` and `lib/raid/raid6/riscv/`.
- KVM guest vector: `arch/riscv/kvm/vcpu_vector.c`.
- T-Head XTheadVector 0.7.1 and its errata handling.
- Selftests: `tools/testing/selftests/riscv/vector/`.
- Docs: `Documentation/arch/riscv/vector.rst`.

Design points taken from the v20/v21 series and the docs ([vector.rst](https://docs.kernel.org/arch/riscv/vector.html), [v21 cover letter](https://lists.infradead.org/pipermail/kvm-riscv/2023-June/003755.html)):

- Vector state is allocated per thread on the first illegal-instruction trap (first-use trap).
- `PR_RISCV_V_SET_CONTROL` and `PR_RISCV_V_GET_CONTROL` control enablement per thread. Once a thread enables vector it cannot turn it off (EPERM).
- `/proc/sys/abi/riscv_v_default_allow` (0 or 1) sets the default for newly exec'd programs.
- Vector registers are clobbered across system calls, per V spec 1.0.
- Since v6.11 the kernel accepts any Zve32x-capable hart as vector-capable.

Governance: Linux Vector has no foundation or governance model of its own. It is maintained as part of the `RISC-V ARCHITECTURE` entry in MAINTAINERS (`F: arch/riscv/`, status Supported):

- Maintainers: Paul Walmsley, Palmer Dabbelt and Albert Ou.
- Reviewer: Alexandre Ghiti.
- List: linux-riscv@lists.infradead.org.
- Patchwork: [linux-riscv project](https://patchwork.kernel.org/project/linux-riscv/list/).
- Tree: `git://git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`.
- There is no separate vector entry in MAINTAINERS.
- The kernel docs page names no licence. The kernel is GPL-2.0 per general knowledge and the SPDX header on `patch-acceptance.rst` [NEEDS VERIFICATION against COPYING].

Corporate sponsors, inferred from commit author domains in the vector files since 2023:

- SiFive: Andy Chiu (16 commits), Greentime Hu (5), Yong-Xuan Wang (4).
- Tenstorrent: Andy Chiu (6 commits, under a `tenstorrent.com` address).
- Rivos: Charlie Jenkins (4), Palmer Dabbelt (4), Alexandre Ghiti (2), Bjorn Topel (1), Jesse Taube (1).
- VRULL: Christoph Mullner (2), Heiko Stuebner (1).
- Ventana Micro / Qualcomm: Andrew Jones.
- Linutronix: Nam Cao.
- KylinOS: Zongmin Zhou, Wang Yan.
- Individuals: Sergey Matyukevich (6), Aurelien Jarno, Troy Mitchell, Han Gao.

SiFive, Tenstorrent and Qualcomm are RISE Premier members per the [RISE members page](https://riseproject.dev/members/). RISE has no confirmed funded kernel-vector work (Section 13).

Community culture on new extensions comes from `Documentation/arch/riscv/patch-acceptance.rst` (see [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html)):

- New extensions are accepted only if the specification is Frozen or Ratified.
- Vendor extensions are accepted only if ratified or implemented in widely available hardware.
- Maintainers "disapprove of churn" and prefer reviewed, tested code.
- Patchwork CI builds and tests each patch.

## 2. Port History and Upstreaming Timeline

The RISC-V port began on 2017-07-10, when Palmer Dabbelt authored the first `arch/riscv` commits. It shipped in Linux 4.15 [NEEDS VERIFICATION: single source, the shared brief]. Vector support is fully upstream. The only unmerged work is the tail of the v5 context-restore optimization series (Section 13).

First-release tags for most commits below come from `git describe --contains` / `git tag --contains` in the kernel clone (HEAD `05441d697f7f`, 2026-11-03, 132 commits after v7.4-rc1). Where the list was the only source, the entry is marked.

| Date | Event | Source |
|---|---|---|
| 2021-09 | RFC v8 vector series (Greentime Hu, SiFive), based on RVV 1.0-rc1 | [LKML](https://lkml.org/lkml/2021/9/8/690) |
| 2023-05 | v20 (Andy Chiu). Design assumes all harts share one ISA and vector is disabled by default | [linux-riscv archive](https://lists.infradead.org/pipermail/linux-riscv/2023-May/032296.html) |
| 2023-06-05 | v21 00/27 "riscv: Add vector ISA support" posted. 45 files, 1805 insertions, 51 deletions | [kvm-riscv archive](https://lists.infradead.org/pipermail/kvm-riscv/2023-June/003755.html) |
| 2023 merge window | Series merged in Linux 6.5 (first commit `7017858eb2d7`, tag `v6.5-rc1~120^2~17^2~19`; Linus merge `533925cb7604`) | clone; [merge commit](https://lab.nexedi.com/kirr/linux/-/commit/533925cb760431cb496a8c965cfd765a1a21d37e) |
| 2023-08-16 | First ptrace vector support removed (`e3f9324b231a`) | clone |
| 2023-08-25 | Ptrace vector re-added (`9300f0043974`), v6.6 | clone |
| 2024-01-15 | Kernel-mode vector (`ecd2ada8a5e0`), preemptible kernel-mode vector (`2080ff949307`), vector XOR (`c5674d00cacd`), vectorized user copy (`c2a658d41924`), all v6.8 | clone |
| 2024-04-03 | `rt_sigreturn()` fix `c27fa53b858b` for CVE-2024-35873 | [MITRE](https://cveawg.mitre.org/api/cve/CVE-2024-35873) |
| 2024-05-10 | Minimum requirement lowered to Zve32x (`ac295b67422d`), v6.11 | clone |
| 2024-10-17 | Unaligned vector access detection (`d1703dc7bc8e`, `e7c9d66e313b`), v6.13 | clone |
| 2024-11-13 | XTheadVector save/restore (`d863910eabaf`), v6.14. Ghostwrite mitigation `4bf97069239b`, v6.14 | clone |
| 2025-03-12 | Vector extension validation checks (`9324571e9eea`), v6.15 | clone |
| 2025-04-08 | `schedule()` from preemptible kernel-mode vector (`d1049fc0de81`), v6.16 | clone |
| 2025-05-23 | XTheadVector context fix (`4262bd0d9cc7`), v6.16-rc4 | clone |
| 2025-11-17 | Ptrace regset allocation optimization (`6efb1a9462ef`) and ptrace selftest (`f0ae09a89267`), v6.19 | clone |
| 2026-01-25 | Ptrace validation and ENODATA series; initial vlenb fix `ef3ff40346db`, v7.0 | clone |
| 2026-03 | XOR code moved to `lib/raid/` (`5265d55b2146`) [NEEDS VERIFICATION: hash not re-checked] | clone |
| 2026-03-16 | KVM vector context allocation leak fix (`b7c958d7c1eb`), v7.1 | clone |
| 2026-08-03 | KVM / kernel-mode vector fix series (`848a973c5f36`, `8f798d6d7f11`, `b5060a4aa33d`), 7.3 merge window | clone |
| 2026-10-05 | Inline-asm constraint fixes `572b25f3a645`, `55b1276ef9c1` (v7.3-rc7, v7.3); context-switch rework and selftest `abf33d62127f`, `333485f3e021`, `5c6e22ad386b` (7.4 merge window, v7.4-rc1) | clone |
| 2026-10-29 | `riscv-for-linus-7.4-mw1` merge (`1b8b67503725`) carrying `5c6e22ad386b` | clone |

Author dates for the 2023 commits are 2023-06-05, and the committer dates are later. For example, `7017858eb2d7` was committed 2023-06-08 and `75b59f2a90aa` on 2023-07-01. The v6.5 release date of 2023-08-27 comes from a single search table [NEEDS VERIFICATION].

## 3. Upstream Support Tier

There is no formal tier system beyond the patch-acceptance rules. riscv is a mainline architecture with MAINTAINERS status Supported. The evidence for riscv64 vector:

- **Release:** upstream releases are source tarballs. Vector is in every mainline kernel since 6.5. The latest mainline release is v7.3, and v7.4 is at the release-candidate stage.
- **Patch CI:** `patch-acceptance.rst` says Patchwork CI builds and tests each patch against the riscv `for-next` and `fixes` branches, and that failing patches are unlikely to be applied.
- **Selftests:** `tools/testing/selftests/Makefile` line 118 has `TARGETS += riscv`. The riscv Makefile lists `RISCV_SUBTARGETS` as `abi hwprobe mm sigreturn vector cfi`.
- **Not confirmed:** whether KernelCI, LKFT or syzbot run these selftests on riscv64 [NEEDS VERIFICATION].

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Vector/SIMD in mainline | Data not available: not researched | Data not available: not researched (one precedent: arm64 permits kernel-mode NEON with IRQs off, commit `7137a203b251`, which the riscv change cites) | RVV since 6.5 |
| MAINTAINERS status | Data not available | Data not available | Supported (RISC-V ARCHITECTURE) |
| In-tree CI config | Data not available | Data not available | None. Only the kselftest suite |
| Official binaries | Data not available | Data not available | None upstream (source only); distro kernels [NEEDS VERIFICATION] |
| Vector KUnit tests | Data not available | Data not available | None (`arch/riscv/kernel/tests/` has kprobes and module-linking tests only) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

In the tables below, NR means "Data not available: amd64 and arm64 equivalents were not researched in this assessment".

| Component | riscv64 implementation | ISA extensions | Quality | amd64 | arm64 |
|---|---|---|---|---|---|
| Context state, context switch, first-use trap | `vector.c`, `asm/vector.h`, `entry.S`, `process.c`. Lazy allocation; `riscv_v_vsize` records size | V (RVV 1.0); Zve32x minimum since v6.11 | C with inline asm; actively refactored in 2026 | NR | NR |
| Userspace ABI: prctl, sysctl, ELF_HWCAP | `PR_RISCV_V_*`, `riscv_v_default_allow` | V | Documented in `vector.rst` | NR | NR |
| Signal frame, ptrace regset | `signal.c`, `compat_signal.c`, `ptrace.c`; `RISCV_ISA_V` selects `DYNAMIC_SIGFRAME` | V | Several fixes 2024-2026 (Section 11) | NR | NR |
| Kernel-mode vector | `kernel_vector_begin()/end()`; preemptible path (`RISCV_ISA_V_PREEMPTIVE`); IRQs-off use; `schedule()` support | V | Under active rework (2026-10) | NR | NR (NEON IRQs-off precedent) |
| Vectorized `copy_to_user`/`copy_from_user` | `arch/riscv/lib/uaccess_vector.S` (needs `CONFIG_MMU` and `RISCV_ISA_V`); threshold `RISCV_ISA_V_UCOPY_THRESHOLD` = 768 bytes | V | Hand-written assembly; commit calls the threshold "a heuristic for now"; no benchmark numbers in the commit | NR | NR |
| XOR | `lib/raid/xor/riscv/xor.S`, `xor-glue.c` | V | Hand-written assembly; "tested in qemu" per commit | NR | NR |
| RAID6 syndrome and recovery | `lib/raid/raid6/riscv/rvv.c`, `recov_rvv.c` | V | Implementation style not read. Whether the file is the patch from the Feb 2025 thread is not verified [NEEDS VERIFICATION] | NR | NR |
| String functions (`memcpy.S`, `strlen.S`, `strcmp.S`, ...) | Files exist in `arch/riscv/lib` | Data not available | Whether they contain vector variants was not checked [NEEDS VERIFICATION] | NR | NR |
| Vector unaligned-access probe | `arch/riscv/kernel/vec-copy-unaligned.S`; Kconfig choice `RISCV_PROBE/SLOW/EFFICIENT_VECTOR_UNALIGNED_ACCESS` | V | Probe made synchronous in 2026-08 (`34c9cfcde29b`). hwprobe key: see "Linux hwprobe" | NR | NR |
| KVM guest vector | `arch/riscv/kvm/vcpu_vector.c`; lazy save/restore; callback to flush context for kernel-mode vector | V | Fixes in 2026 (Section 11). Which Zve*/Zvb*/Zvk* extensions KVM exposes not checked [NEEDS VERIFICATION] | NR | NR |
| T-Head XTheadVector 0.7.1 | `vendor_extensions/thead.c`, `errata/thead/errata.c`; vlenb from DT; `ERRATA_THEAD_GHOSTWRITE` | XTheadVector (draft 0.7.1) | Two save/restore bugs fixed (Section 11) | NR | NR |
| Vector crypto | Out of scope, see "Linux crypto" | Zvk* | n/a | n/a | n/a |

Kconfig (`arch/riscv/Kconfig`):

- `RISCV_ISA_V` depends on `TOOLCHAIN_HAS_V` and `FPU`, and defaults to y.
- `RISCV_ISA_V_DEFAULT_ENABLE` defaults to y.
- `RISCV_ISA_V_UCOPY_THRESHOLD` defaults to 768.
- `RISCV_ISA_V_PREEMPTIVE` depends on `PREEMPTION` and defaults to y. It costs extra per-thread memory for kernel-mode vector context.
- `ERRATA_THEAD_GHOSTWRITE` defaults to y.

Default behaviour: the 2023 series text and the commit summary for `1fd96a3e9d5d` describe vector as off by default, but the in-tree Kconfig option `RISCV_ISA_V_DEFAULT_ENABLE` has `default y` (confirmed in `arch/riscv/Kconfig` at HEAD). A stock build therefore enables userspace vector by default, and the prctl and sysctl govern opt-in only when this option is off.

Context-switch optimization: Andy Chiu's v5 series tracks an INITIAL vector state to skip unneeded vector context management. It quotes getpid latency falling from 234.8 ns to 174.4 ns and context switch from 14.19 us to 11.62 us on Blackhole x280 [NEEDS VERIFICATION: single source, cover-letter summary on a mailing-list mirror].

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses `make` and Kconfig. There is no cmake, configure or Dockerfile in the tree. These are standard kernel invocations, not copied from a specific kernel document. `arch/riscv/Makefile` sets `-mabi=lp64` and `BITS=64` for `ARCH_RV64I`.

```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
make ARCH=riscv LLVM=1 defconfig && make ARCH=riscv LLVM=1 -j$(nproc)
make -C tools/testing/selftests TARGETS=riscv ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu-
```

The vector selftests are built from `tools/testing/selftests/riscv/vector/Makefile`:

- `v_initval`, `vstate_prctl`, `vstate_ptrace`, `validate_v_ptrace`, `v_uaccess_stress`.
- Extras: `vstate_exec_nolibc` and `v_exec_initval_nolibc` (`-nostdlib`, `-lgcc`).
- All are linked `-static`.
- A subset can be run with `make TARGETS=riscv RISCV_SUBTARGETS="mm vector"`, per `tools/testing/selftests/riscv/README`.

Toolchain minimums, from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`:

| Tool | Generic kernel minimum | Vector-specific requirement |
|---|---|---|
| GCC | 8.1.0 | `TOOLCHAIN_HAS_V` needs the compiler to accept `-march=rv64imv`. The exact minimum GCC is not confirmed [NEEDS VERIFICATION] |
| Clang/LLVM | 17.0.1 | Same `-march=rv64imv` probe; the exact minimum is not confirmed [NEEDS VERIFICATION] |
| binutils | 2.30.0 | GNU ld 2.38 or newer (`LD_VERSION >= 23800`) unless the linker is LLD; the assembler must support `.option arch` (`AS_HAS_OPTION_ARCH`). The reason for 2.38 was not confirmed [NEEDS VERIFICATION] |
| GNU make | 4.0 | none |

If `TOOLCHAIN_HAS_V` is not met, `RISCV_ISA_V` silently drops out of the config. A toolchain that is too old therefore produces a kernel without vector and no build error.

Other riscv toolchain conditions:

- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` appends `_zicsr_zifencei` to `-march`, because binutils 2.38 and GCC 12.1.0 dropped the implicit ISA spec.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies to GCC older than 11.3.0.
- `ARCH_HAS_BROKEN_DWARF5` applies to the LLVM assembler or LLD older than 18.

QEMU usage:

- The only in-tree QEMU invocation is the KUnit config `tools/testing/kunit/qemu_configs/riscv.py`: `qemu-system-riscv64 -machine virt -cpu rv64 -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin -kernel arch/riscv/boot/Image -append "console=ttyS0"`.
- `-cpu rv64` has no vector extension, so this config does not exercise Vector.
- A RAID6 review thread used `-cpu rv64,v=true,vlen=256` on QEMU 9.2.0 ([LKML](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/09585.html)).
- On QEMU, vector speedups in that thread showed only with `-icount shift=0`, and the author noted QEMU is not representative of hardware.

Known build failures: none found for kernel vector on riscv64 GCC or LLVM=1. Whether the riscv64 `LLVM=1` build is clean is [NEEDS VERIFICATION]. The only CI log found is a failed checkpatch/build run on a fork for the 2023 kernel-mode-vector series ([run 7289078150](https://github.com/linux-riscv/linux-riscv/actions/runs/7289078150)), which was not fetched. The series itself merged in v6.8.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

No amd64 or arm64 feature data was gathered. The matrix covers riscv64 only.

| Feature | riscv64 status | Source |
|---|---|---|
| Userspace RVV 1.0 | Mainline since 6.5 | clone |
| Zve32x-only harts | Accepted since 6.11 | `ac295b67422d` |
| Ptrace vector regset | Since 6.6 (re-added); ENODATA/validation since 7.0 | clone |
| Kernel-mode vector, preemptible | Since 6.8 | clone |
| Vectorized user copy, XOR, RAID6 | Present | clone |
| KVM guest vector | Since 6.5; fixes through 2026 | clone |
| XTheadVector 0.7.1 | Since 6.14; unavailable on Ghostwrite-affected cores | clone |
| Per-process vector off switch after enabling | Not possible (EPERM) | [vector.rst](https://docs.kernel.org/arch/riscv/vector.html) |

Functional gaps:

- A thread that has enabled vector cannot turn it off.
- On T-Head C9xx cores vulnerable to Ghostwrite, the kernel disables xtheadvector. This is a mitigation.
- Draft vendor vector (XTheadVector 0.7.1) is supported only because it is implemented in shipping hardware.

Performance gaps (no riscv64-vs-arm64/amd64 benchmark was found):

- The 768-byte vectorized-copy threshold is a heuristic with no published numbers.
- RAID6 numbers exist only from QEMU: rvvx8 1694 MB/s with `-icount shift=0`, but 44-45 MB/s for rvv variants in a normal kernel boot, where int64x2 reached 3405 MB/s ([LKML](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/09585.html)). No real-hardware RAID6 numbers were found.
- Andy Chiu's LPC 2026 talk on auto-vectorizing the kernel reports gains up to 15% LZ4, 8.4% Btrfs, 5% XFS and 2% Nginx, with costs in context-switch time, memory and portability. [NEEDS VERIFICATION: figures come from search summaries of [Phoronix](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel); the page was not accessible, and hardware and baseline are unknown]
- In a [Phoronix SpacemiT K3 review](https://www.phoronix.com/review/risc-v-rvv-vector-benchmarks) (Linux 6.18, GCC 15.2), toggling RVV at runtime via `riscv_v_default_allow` did not work well, and the author rebuilt packages instead. Details are unconfirmed [NEEDS VERIFICATION].

Security hardening gaps:

- CVE-2024-35873 (Section 11).
- Spectre-v1 hardening of KVM guest vector register access was added in 2026 (`8d9c9b135b5c`).
- The optional `CONFIG_RISCV_VSTATE_OPT` in the pending v5 series gives up detection of illegal in-kernel vector use and stale-vstate bugs in exchange for speed.

NaN / floating-point semantics: Data not available: nothing was found on FP semantics for vector. `RISCV_ISA_V` depends on `FPU`. RISE issue #143, "FPR to be optionally enabled/disabled", is open under Debug Tools in the [RISE Kernel and Virtualization WG repo](https://github.com/riseproject-dev/kernel-and-virtualization-wg).

## 7. CI/CD Infrastructure

The kernel tree has no CI configuration for Vector. The search covered `.gitlab-ci*`, `.github/`, `Jenkinsfile`, `.travis`, `.cirrus` and any KernelCI/LKFT config, and found none. `MAINTAINERS` has no KernelCI or riscv-selftest entry. `tools/testing/kunit/configs/` has only UML and generic configs.

What exists:

- Patchwork CI for each patch, per [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html). The Patchwork page was not accessible, so the actual CI content is not verified.
- The riscv64 kselftest suite, including vector tests, which is actively maintained: `5c6e22ad386b` (2026-10-05), `58a37e7317b0` (2026-07-10), `70b439e46eff` (2026-07-07), `849f05ae1ea6` (2026-01-25).
- External: the XUANTIE-RV/linux fork (T-Head/Alibaba) runs a GitHub Actions `ci-build` workflow on its linux-6.6 branch ([Actions](https://github.com/XUANTIE-RV/linux/actions)). The workflow was not readable, so its targets and whether it runs vector selftests are [NEEDS VERIFICATION]. It is a vendor fork.
- Cloud-V advertises RVV 1.0 hardware runners with LAVA/KernelCI testing ([Cloud-V](https://prod.cloud-v.co/risc-v-cicd)). This is marketing material [NEEDS VERIFICATION].
- RISE runs native riscv64 GitHub runners (`riscv-runner`, label `ubuntu-24.04-riscv`, Scaleway hardware) at [riscv-runners.riseproject.dev](https://riscv-runners.riseproject.dev/). No evidence was found of their use for kernel vector CI.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | Data not available | Data not available | None |
| Patchwork CI per patch | Data not available | Data not available | Yes, per documentation (content not verified) |
| Vector kselftests wired into standard kselftest | Data not available | Data not available | Yes (`TARGETS += riscv`, `ARCH=riscv` only) |
| KernelCI / LKFT / syzbot coverage | Data not available | Data not available | [NEEDS VERIFICATION] |
| Hardware used | Data not available | Data not available | Data not available for mainline; Tenstorrent Blackhole x280 and Ascalon cited in a patch cover letter |

Not accessible: kernelci.org, lkft.linaro.org, syzkaller.appspot.com, lore.kernel.org and git.kernel.org.

## 8. Distribution and Release Status

- **Upstream:** Linux releases are source only. Vector ships inside the kernel image, with no separate artifact.
- **Package registries:** there is no PyPI package named `linux-vector` (HTTP 404), and the RISE wheel index has none either (redirect to PyPI, then 404). No npm, Maven or OCI artifact applies.
- **Ubuntu/Debian/Fedora/Arch:** Data not available. Whether any distro kernel enables `CONFIG_RISCV_ISA_V` is [NEEDS VERIFICATION]. The Debian source of `vector.rst` for 6.19.6-2 is [online](https://sources.debian.org/src/linux/6.19.6-2/Documentation/arch/riscv/vector.rst), which shows the doc is present in Debian's kernel source, not the config.
- **Vendor kernels:** the Phoronix K3 review ran Bianbu 4.0 with Linux 6.18 and used RVV in userspace [NEEDS VERIFICATION: page not accessible].
- **RISE:** the `riseproject-dev/linux` fork has branches `master`, `alibaba-a210` and `spacemit-k3`. None is vector-specific.

To get a working binary, a user must either:

1. Use a distro riscv64 kernel and check its config for `CONFIG_RISCV_ISA_V=y`, or
2. Build upstream with `defconfig` using a toolchain meeting `TOOLCHAIN_HAS_V` (Section 5).

The firmware must also provide a vector-capable boot environment, and the hart's ISA string must advertise V or Zve* (via `riscv,isa` / `riscv,isa-extensions` in the device tree).

## 9. Dependencies

Status in the table comes from the existing project reports for GCC, binutils, LLVM, OpenSBI and QEMU, and from the kernel clone. These were not rechecked against upstream or CI. The graph query for Ubuntu 26.04 riscv64 packages was not run for any dependency.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime-dependency, critical) | Hosts the vector code (`RISCV_ISA_V` and related) | Builds; `RISCV_ISA_V` defaults to y and needs `FPU` | Vector kselftests in-tree; external CI [NEEDS VERIFICATION] | Mainline and stable (source); distro kernels [NEEDS VERIFICATION] | RISC-V ARCHITECTURE maintainers; contributors per Section 1 |
| OpenSBI (runtime-dependency, critical) | Firmware. Has `sbi_vector.c` for boot-time vector state and emulates misaligned vector loads/stores (`c2acc5e5b0`, 2024-12-06) | Builds on riscv64 | Not assessed | Mainline releases | Existing OpenSBI report is color orange. Its vector code is inline asm for save/restore and misaligned emulation only |
| GCC (build-dependency, critical) | `TOOLCHAIN_HAS_V` probes `-march=rv64imv`; `.option arch` | RVV intrinsics and autovectorization upstream since GCC 13/14 per existing report (blue) | Not assessed | GCC 15.2 released; GCC 16 series noted | Exact minimum for `RISCV_ISA_V` [NEEDS VERIFICATION]. Generic floor is GNU C 8.1 |
| GNU binutils (build-dependency, critical) | Assembler needs `.option arch, +v`; GNU ld must be 2.38 or newer unless LLD | Full RVV assembler/disassembler support per existing report (blue) | Not assessed | Binutils 2.47 released 2026-07-26 | Known gap: no RVV PLT generation (a warning is emitted); does not affect the kernel |
| LLVM (build-dependency, optional) | Alternative toolchain (clang, LLD, integrated assembler); kernel minimum 17.0.1 | RVV 1.0 complete per existing report (yellow) | Not assessed | Mainline | Whether the riscv64 `LLVM=1` kernel build is clean [NEEDS VERIFICATION] |
| dtc (build-dependency, optional) | Data not available: not covered by the research. The kernel's riscv device trees carry xtheadvector properties (Allwinner D1, SG2042, TH1520) and `377be47f90e4` takes vlenb from DT for T-Head, so dtc compiles the data used for detection | Data not available | Data not available | Data not available | Data not available |
| QEMU (test-dependency, optional) | RVV 1.0 in `target/riscv`; KVM syncs vector registers with dynamic VLENB | Builds as system emulator | Vector emulation complete per existing report; TCG has no host RVV acceleration on riscv64 | QEMU 11.0 assessed | Existing report is color yellow, with four partial TCG vector bitwise ops. A QEMU linux-user series adding vector to the signal context (PATCH v3, about 2026-03) is reported stalled |

Deep-dive:

- **Kernel to toolchain:** vector is silently dropped if the toolchain probe fails. This makes the toolchain a critical, quiet dependency.
- **OpenSBI to kernel:** the kernel's `RISCV_VECTOR_MISALIGNED` probing depends on the platform's handling of misaligned vector accesses. Only the misaligned emulation is evidenced as the counterpart of that kernel option.
- **QEMU to kernel testing:** the in-tree KUnit QEMU config uses a CPU without vector, so vector coverage requires explicit `-cpu rv64,v=true,vlen=...` options. QEMU is not representative of hardware speed.
- **Recursed dependencies:** Data not available beyond two levels. Dependencies of GCC, binutils, LLVM and QEMU themselves were not researched. See the existing GCC, GNU binutils, LLVM, OpenSBI and QEMU reports.

## 11. Known Bugs and Active Issues

The kernel has no issue tracker for this. No open bug numbers were found. lore.kernel.org and Patchwork were not reachable, so open bug reports on the list were not checked.

Correctness bugs (all fixed):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| CVE-2024-35873 (fix `c27fa53b858b`, stable `5b16d904e910`) | `rt_sigreturn()` restored vector state while live registers were dirty, then vectorized `copy_from_user` saved the dirty state into the task vstate | Fixed 2024-04-03; fixed in 6.8.5 | CVSS 5.5 (INCIBE) | Introduced by `c2a658d41924`. Only triggers when VLEN is above 128, because of the 768-byte threshold. Published 2024-05-19 ([MITRE](https://cveawg.mitre.org/api/cve/CVE-2024-35873)). Affected range: 6.8 up to before 6.8.5; the CPE data says before 6.9, a discrepancy between sources |
| `55b1276ef9c1` | Wrong output operands in `__vstate_csr_save()` asm (Aurelien Jarno) | Fixed 2026-10-05, v7.3 | Not rated | Fixes `d863910eabaf` |
| `572b25f3a645` | `datap` declared input-only in vector save/restore asm though the asm advances it (Troy Mitchell) | Fixed 2026-10-05 | Not rated | Fixes `03c3fcd9941a`, the original 6.5 save/restore asm; a latent compiler-dependent bug that surfaced three years later |
| `b5060a4aa33d` | Kernel-mode vector misattributed the KVM guest vcpu context as the user's | Fixed 2026-08-03, 7.3 merge window | Not rated | Caused vtype corruption and unexpected termination running perf and mcf on KVM. Fixes `ecd2ada8a5e0`. Stable status [NEEDS VERIFICATION] |
| `4262bd0d9cc7` | XTheadVector save/restore corrupted v8-v31 | Fixed 2025-05-23, v6.16-rc4 | Not rated | Cc: stable. Registers were damaged from v6.14 until the fix. Stable backport status [NEEDS VERIFICATION] |
| `aa49bc2ca852` | Wrong signal frame size for vector sigcontext | Fixed 2024-12-20 | Not rated | Fixes `8ee0b41898fa`; Cc: stable |
| `ef3ff40346db` | Zeroed vlenb exposed to userspace via ptrace before first vector instruction | Fixed, v7.0 | Not rated | Stable backport posted as AUTOSEL on 2026-02-15 with no replies ([thread](https://ratatoskr.run/linux-riscv/2026/02/7131089)) |
| `b7c958d7c1eb` | KVM vector context allocation leak | Fixed 2026-03-16, v7.1 | Not rated | Cc: stable |
| `9b33ab1e8c18` | NULL-check hardening (`WARN_ON`) for KVM vector `datap` | Fixed 2026-03-17 | Not rated | Hardening |
| `34c9cfcde29b` | Vector unaligned-access probe ran in a kthread that could finish after its `__init` function was freed | Fixed 2026-08-07 | Not rated | Fixes `e7c9d66e313b`; Cc: stable. Probe run synchronously; boot time 0.464474 s with kthread vs 0.457991 s without |
| `59052a88ba5f` | ptrace regset buffers not zero-initialized before copyin | Fixed 2026-08-26 | Not rated | Not read in detail |
| `8d9c9b135b5c` | Spectre-v1 in KVM vector register access | Fixed 2026-07 | Not rated | Hardening |

Active or open items:

| ID | Title | Status | Notes |
|---|---|---|---|
| v5 "optimize Vector context restore on syscall" | Andy Chiu (Tenstorrent), 7 patches | Open; first three patches in 7.4-rc1 | See Section 13 |
| Documentation patch (2026-01) | "[PATCH v1] Documentation: riscv: update Vector..." | Status [NEEDS VERIFICATION] | [thread](https://ratatoskr.run/linux-riscv/2026/01/3355532/t) |
| `riscv_v_default_allow` runtime toggle | Poor behavior in the K3 test | Unconfirmed [NEEDS VERIFICATION] | Section 6 |
| Preemptible kernel-mode vector | Refactored again 2026-10 (`abf33d62127f`, `333485f3e021`) | Ongoing work, not known bugs | |
| RISE #133 | Poly1305 optimization, vector and non-vector | Open, no assignee | Crypto-adjacent |
| RISE #143 | FPR to be optionally enabled/disabled | Open | Debug Tools |
| RISE #138, #157, #139 | Valgrind scalable vector IR, Valgrind vector support, DynamoRIO | Open | Userspace tools |

Also reported but unconfirmed: a NULL dereference (address 0x20) in the RAID6 rvvx4 test on QEMU 9.2.0, reproduced by Charlie Jenkins with a trimmed defconfig but not by Chunyan Zhang. It is a patch-review bug in an unmerged series at the time, not an upstream bug.

Series data: the v5 series is described as posted 2026-08-10, with patch 4 as a state-semantics change. The merged commits instead carry link bases dated 2026-09-18, with patch 4/N being the selftest `5c6e22ad386b`. The merged series may be a later revision with different numbering, so which revision and which patches landed is [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

- **Stated objections:** none found for vector. Mailing-list review discussion could not be retrieved (lore.kernel.org was not accessible), and no review tags were visible on the mirror for the open v5 patches.
- **Technical blockers:**
  - The optional `CONFIG_RISCV_VSTATE_OPT` (patch 7 of v5) trades detection of illegal in-kernel vector use and stale-vstate bugs for about 80 cycles on getpid on Ascalon and a 3.5% nginx throughput gain [NEEDS VERIFICATION: single source]. This is a design trade-off likely to draw review.
  - Ghostwrite makes XTheadVector unusable on affected T-Head cores.
- **Organizational blockers:**
  - There is no separate vector maintainer entry. Review depends on the general riscv maintainers and a small group of authors. Andy Chiu authored 22 of the counted commits across two employers.
  - The acceptance policy bars draft extensions.
  - Maintainers favor stability over churn.
- **Acceptance probability:** Data not available: no basis for a probability. Evidence: the first three patches of the v5 series are merged, and kernel-mode vector changes have gone in at each recent merge window.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro

Justification: RVV has been in mainline since Linux 6.5 and is native riscv64 code ([vector.rst](https://docs.kernel.org/arch/riscv/vector.html)). [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) says Patchwork CI builds and tests every patch on riscv, and the riscv64 kselftests in `tools/testing/selftests/riscv/vector` (`v_initval`, `vstate_prctl`, `vstate_ptrace`, `validate_v_ptrace`, `v_uaccess_stress`) are wired into the standard kselftest set. The tree has no CI config of its own, and I could not confirm that KernelCI, LKFT or syzbot actually run the vector selftests [NEEDS VERIFICATION]. Upstream releases are source only, so the consumable riscv64 kernels come from distros, whose `CONFIG_RISCV_ISA_V` status I did not check [NEEDS VERIFICATION]. The work is maintained under `arch/riscv` with active fixes through 2026-10 (for example `55b1276ef9c1`, `5c6e22ad386b`), and a known CVE-2024-35873 was fixed in 6.8.5.

Pending work that could change the grade:

- Andy Chiu (Tenstorrent) v5 series "riscv: optimize Vector context restore on syscall" is partly merged. The first three patches are in 7.4-rc1. The remaining patches, including the optional `CONFIG_RISCV_VSTATE_OPT`, are still open on linux-riscv ([thread](https://ratatoskr.run/linux-riscv/2026/08/17392898/t)).
- Confirming that KernelCI, LKFT or syzbot run the riscv/vector kselftests on riscv64, and confirming that distro kernels enable `CONFIG_RISCV_ISA_V`, could move this to green (if upstream or RISE-provided kernel releases count as the release) or leave it at blue.
- RISE has no funded or confirmed kernel-vector work. Its Kernel and Virtualization WG only tracks the closed issues #16 (Vector extension support) and #19 (KVM vector virtualization).
- The sibling reports "Linux crypto" and "Linux hwprobe" are out of scope.

RISE issue dates differ across sources. #16 and #19 are labeled `upstream:complete`, milestone Linux-6.5, 2023H2, with 2023 update notes, but show a close date of 2026-07-17. That is consistent with migration to GitHub. Whether RISE influenced the work is [NEEDS VERIFICATION] against the issue bodies, the project board and the mailing list. The [RISE blog](https://riseproject.dev/blog) has no kernel-vector post (38 posts in the sitemap, 2024-05-15 to 2026-10-30, none on kernel vector).

## 14. Investment Analysis

Prior RISE work: no RISE-funded kernel-vector work was found, only closed tracking issues #16, #19 and #113 (RAID6) in the [WG repo](https://github.com/riseproject-dev/kernel-and-virtualization-wg), so no item below duplicates funded work. Effort figures are the author's engineering estimates, not taken from the research.

### 14.1 Functional Enablement

- Audit distro riscv64 kernels (Ubuntu 26.04 and others) for `CONFIG_RISCV_ISA_V`, `RISCV_ISA_V_PREEMPTIVE` and toolchain probe success.
- Review and test the open tail of the v5 context-restore series, including `CONFIG_RISCV_VSTATE_OPT`, on the company's own silicon.
- Audit which Zve*/Zvb*/Zvk* extensions KVM exposes. Not checked.
- Confirm the vector string-function status in `arch/riscv/lib`. Not checked.

### 14.2 Performance Optimization

- Measure the 768-byte `RISCV_ISA_V_UCOPY_THRESHOLD` across VLEN values on real hardware. The commit calls it a heuristic.
- Real-hardware XOR and RAID6 numbers. Only QEMU figures exist.
- Evaluate kernel auto-vectorization on the company's cores. The reported gains are unverified and depend on per-CPU compiler tuning.

### 14.3 CI/CD Infrastructure

- Establish whether KernelCI, LKFT or syzbot run the riscv/vector selftests, and if not, add a job on RISE `ubuntu-24.04-riscv` runners or company hardware.
- Add a riscv KUnit/QEMU config with `-cpu rv64,v=true,vlen=...`, since the in-tree config uses `-cpu rv64`. Test several VLEN values, because CVE-2024-35873 only showed at VLEN above 128.

### 14.4 Ecosystem Enablement

Section 10 is omitted: Linux Vector has no dependent package ecosystem. Userspace consumers are tracked in their own reports. The [Go issue 62238](https://github.com/golang/go/issues/62238) is an example. The only item here is to confirm that the `riscv_v_default_allow` toggle behaves as documented, given the K3 report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Audit distro kernel configs for `CONFIG_RISCV_ISA_V` | 1 | Company kernel team | High |
| Functional | Review and test remaining v5 context-restore patches | 4 | Company kernel team | Medium |
| Functional | Audit KVM Zve*/Zvb*/Zvk* exposure | 2 | Company kernel / KVM team | Medium |
| Functional | Verify `riscv_v_default_allow` runtime toggle behavior | 1 | Company kernel team | Low |
| Performance | Tune `RISCV_ISA_V_UCOPY_THRESHOLD` on target silicon | 4 | Company kernel team | Medium |
| Performance | Real-hardware XOR/RAID6 measurements | 3 | Company kernel team | Low |
| Performance | Evaluate kernel auto-vectorization | 6 | Company kernel team and toolchain team | Low |
| CI/CD | Confirm or add KernelCI/LKFT/syzbot vector selftest coverage | 1 to 6 | Company kernel team and RISE | Critical |
| CI/CD | KUnit/QEMU config with a vector CPU and multi-VLEN matrix | 2 | Company kernel team | High |

## 15. References

- [Linux kernel docs, RISC-V vector](https://docs.kernel.org/arch/riscv/vector.html)
- [Linux kernel docs, RISC-V patch acceptance](https://docs.kernel.org/arch/riscv/patch-acceptance.html)
- [Linux kernel docs, arch/riscv index](https://docs.kernel.org/arch/riscv/)
- [Debian source, vector.rst (6.19.6-2)](https://sources.debian.org/src/linux/6.19.6-2/Documentation/arch/riscv/vector.rst)
- [Kernel git repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (data from a local clone at HEAD `05441d697f7f`)
- [Patchwork, linux-riscv](https://patchwork.kernel.org/project/linux-riscv/list/)
- [v21 00/27 riscv: Add vector ISA support](https://lists.infradead.org/pipermail/kvm-riscv/2023-June/003755.html)
- [v20 series, linux-riscv archive](https://lists.infradead.org/pipermail/linux-riscv/2023-May/032296.html)
- [RFC v8, LKML](https://lkml.org/lkml/2021/9/8/690)
- [6.5 merge commit 533925cb7604](https://lab.nexedi.com/kirr/linux/-/commit/533925cb760431cb496a8c965cfd765a1a21d37e)
- [v5 optimize Vector context restore on syscall](https://ratatoskr.run/linux-riscv/2026/08/17392898/t)
- [v5 3/7 cross-post, kvm-riscv](https://ratatoskr.run/kvm-riscv/2026/08/17392890)
- [v3 1/4 cross-post, kvm-riscv](https://ratatoskr.run/kvm-riscv/2026/05/17016009)
- [v5 2/3 on linux-rt-devel](https://ratatoskr.run/linux-rt-devel/2026/08/17360219)
- [Documentation patch thread (2026-01)](https://ratatoskr.run/linux-riscv/2026/01/3355532/t)
- [QEMU linux-user vector series](https://ratatoskr.run/qemu-devel/2026/03/14436285/t)
- [AUTOSEL backport of ef3ff40346db](https://ratatoskr.run/linux-riscv/2026/02/7131089)
- [Inline-asm fix patch, Aurelien Jarno](https://ratatoskr.run/linux-riscv/2026/09/17555148)
- [RAID6 RISC-V SIMD patch thread](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/09585.html)
- [CVE-2024-35873 record](https://cveawg.mitre.org/api/cve/CVE-2024-35873)
- [Phoronix, auto-vectorizing the RISC-V kernel](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel)
- [Phoronix, RVV benchmarks on SpacemiT K3](https://www.phoronix.com/review/risc-v-rvv-vector-benchmarks)
- [LWN, vector unaligned access hwprobe series](https://lwn.net/Articles/983273/)
- [rvv-bench](https://github.com/camel-cdr/rvv-bench)
- [AraOS paper](https://arxiv.org/pdf/2504.10345)
- [Apache TVM issue 18562 discussion](https://mail-archive.com/discuss-archive@tvm.apache.org/msg06261.html)
- [Go issue 62238, RISC-V vector detection](https://github.com/golang/go/issues/62238)
- [Fork CI run 7289078150](https://github.com/linux-riscv/linux-riscv/actions/runs/7289078150)
- [XUANTIE-RV/linux Actions](https://github.com/XUANTIE-RV/linux/actions)
- [Cloud-V RISC-V CI/CD](https://prod.cloud-v.co/risc-v-cicd)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog](https://riseproject.dev/blog)
- [RISE Kernel and Virtualization WG repository](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [RISE riscv-runners](https://riscv-runners.riseproject.dev/)
- [RISE blog, SALTyRN](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)