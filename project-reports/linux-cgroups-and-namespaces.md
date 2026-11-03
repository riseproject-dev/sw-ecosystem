---
title: Linux cgroups and namespaces
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
---

{% include dependency-graph.html slug="dependencies" subset="linux-cgroups-and-namespaces" %}

# Linux cgroups and namespaces

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux cgroups and namespaces<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux cgroups (v1 and v2 controllers, plus PSI) and namespaces (user, pid, net, mount, uts, ipc, cgroup, time) are core Linux kernel code. They are not a separate package, binary or release artifact. They ship in every mainline kernel and are almost entirely architecture-independent. The [cgroup v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html) is the user-facing reference. It names Tejun Heo (October 2015) as author.

Findings were checked against a kernel clone at HEAD 05441d697f7f (v7.4-rc1-132, 2026-11-03). The latest final release tag in that clone is v7.3. The license is GPL-2.0 (SPDX `GPL-2.0` in `kernel/cgroup/cgroup.c` and `kernel/time/namespace.c`).

**Governance.**
- There is no project-specific foundation. The code is developed through the kernel's maintainer-tree model on mailing lists and git.kernel.org.
- The Linux Foundation hosts kernel.org infrastructure but is not shown to govern this subsystem [NEEDS VERIFICATION: no primary document says either way].
- RISE is not a member or sponsor of this subsystem. The [RISE site](https://riseproject.dev) never mentions cgroups, namespaces or containers.

**Maintainers.** Affiliations come only from email domains in `MAINTAINERS` and are not otherwise confirmed.

| Area | Maintainers | Company (from domain) |
|---|---|---|
| CGROUP core | Tejun Heo, Johannes Weiner, Michal Koutny | SUSE for Koutny; others not shown |
| cpuset | Waiman Long; reviewer Ridong Chen | Red Hat for Long |
| memcg | Johannes Weiner, Michal Hocko, Roman Gushchin, Shakeel Butt; reviewer Muchun Song | not shown |
| cgroup block IO | Tejun Heo, Josef Bacik, Jens Axboe | not shown |
| cgroup dmem | Maarten Lankhorst, Maxime Ripard, Natalie Vock | not shown |
| NAMESPACES | Christian Brauner; reviewer Pavel Tikhomirov | Virtuozzo for Tikhomirov |
| PSI | Johannes Weiner, Suren Baghdasaryan; reviewer Peter Zijlstra | Google for Baghdasaryan |
| Time namespace (under POSIX CLOCKS and TIMERS) | Thomas Gleixner | not shown |
| Generic vDSO library | Andy Lutomirski, Thomas Gleixner, Vincenzo Frascino | Arm for Frascino |

- No RISC-V-specific maintainer exists for these areas.
- Arch pieces fall under RISC-V ARCHITECTURE: Paul Walmsley, Palmer Dabbelt and Albert Ou are maintainers, and Alexandre Ghiti is a reviewer.
- Commit-author domains for `kernel/cgroup` are led by `kernel.org` (216), `redhat.com` (199) and `linux-foundation.org` (164). Then come `huawei.com` (125), `suse.com` (38), `google.com` (35) and `fb.com` (32). The `kernel.org` and `linux-foundation.org` counts mix individuals, so they do not map cleanly to employers.

**Community stance on new ports.**
- The cgroup and namespace code is architecture-independent, so there is no separate "port" to accept.
- Arch-support patches go through the linux-riscv list and tree.
- Per `Documentation/arch/riscv/patch-acceptance.rst`, extensions are accepted only if the spec is Frozen or Ratified, or the extension is implemented in widely available hardware.
- Automation builds and tests patches from patchwork.kernel.org/project/linux-riscv.

## 2. Port History and Upstreaming Timeline

The subsystem is fully upstream. No riscv-specific cgroup or namespace code exists apart from the pieces below. All commits listed are merged. Dates are author dates unless stated. The tag is the first release containing the commit. Commit pages follow the pattern `https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=<SHA>`.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | First RISC-V commit, "RISC-V: Init and Halt Code" (Palmer Dabbelt). First shipped in v4.15. | [76d2a0493a17](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=76d2a0493a17) |
| 2019-02-05 | Original RV64G eBPF JIT (Bjorn Toepel), v5.1. Relevant to `CONFIG_CGROUP_BPF`. [NEEDS VERIFICATION: single verification source] | [2353ecc6f91f](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2353ecc6f91f) |
| 2019-10-04 | Seccomp filter support (David Abdurachmanov, SiFive), v5.5. [NEEDS VERIFICATION: single source] | [5340627e3fe0](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5340627e3fe0) |
| 2020-03-04 | "riscv, bpf: Factor common RISC-V JIT code" (Luke Nelson), v5.7. This is a refactor, not the JIT's introduction. | [ca6cb5447cec](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ca6cb5447cec) |
| 2020-12-17 | uprobes on riscv (Guo Ren, Alibaba), committed 2021-01-14, v5.12 | [74784081aac8](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=74784081aac8a0f3636965fc230e2d3b7cc123c6) |
| 2021-09-01 | Time-namespace support in the riscv vDSO (Tong Tiangen, Huawei), committed 2021-10-04, v5.16 | [dffe11e280a4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dffe11e280a42c2501e5b0cdebd85a77f539bb05) |
| 2022-09-24 | Fix for NULL dereference in `vdso_join_timens()` on vfork (Jisheng Zhang), committed 2022-10-13, v6.1, stable-tagged | [a8616d2dc193](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a8616d2dc193b6becc36b5f3cfeaa9ac7a5762f9) |
| 2023-08-03 | Syscall restart handled before `get_signal` (Haorong Lu), committed 2023-11-05, v6.7. This is the kernel fix CRIU riscv64 depends on. | [ce4f78f1b53d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ce4f78f1b53d3327fbd32764aa333bf05fb68818) |
| 2023-08-25 | Vector ptrace regset (Andy Chiu, SiFive), committed 2023-09-01, v6.6 | [9300f0043974](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9300f00439743c4a34d735e1a27118eb68a1504e) |
| 2024-02-20 to 2025-02-04 | riscv vDSO data moved to the generic vDSO data store: eba755314fa7 (2024-02-20), d34b60752fcb (2024-10-10), 46fe55b204bf (2025-02-04, v6.15). Authors include Anna-Maria Behnsen and Thomas Weisschuh. Timens handling now lives in generic `lib/vdso`. | commit IDs from the clone |
| 2024-10-27 | CRIU riscv64 port merged (PR #2234) | [CRIU PR 2234](https://github.com/checkpoint-restore/criu/pull/2234) |
| 2025-11-13 | Soft-dirty and userfaultfd write-protect for riscv (Chunyan Zhang, ISCAS), committed 2025-11-24, v6.19 | [277a1ae3879a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=277a1ae3879a82a15a2e2d6741e38e31ea6487ee), [2a3ebad4db63](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2a3ebad4db63e86a9443d6bff4a5977320dc09f6), [c64da3950cf4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c64da3950cf45d5fd87d7754ab4698b8cec01cae) |
| 2026-07-16 | KVM VM-scoped allocations charged to the VM memory cgroup (Yuhang.chen), committed 2026-08-01, v7.3 | [b7a4bd0c8065](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b7a4bd0c80656dae7f0a7a9c9be4fdf6f58d29ab) |

**Key contributors.**
- Tong Tiangen (Huawei) and Guo Ren (Alibaba) landed the early arch pieces.
- Jisheng Zhang fixed the vfork bug.
- Haorong Lu (ancientmodern) drove the CRIU port and the syscall-restart fix.
- Andy Chiu (SiFive) added the vector regset.
- Chunyan Zhang (ISCAS) added soft-dirty and uffd-wp, reviewed by Deepak Gupta (rivosinc.com).
- Yuhang.chen and Quan Zhou (ISCAS) added KVM memcg accounting.

**Caveats.**
- The CRIU PR thread places the kernel signal patch at 2023-08-01, while the commit is authored 2023-08-03. The difference is likely a draft posted before the formal submission [NEEDS VERIFICATION].
- The time-namespace vDSO code described in the dffe11e280a4 commit now lives in generic code, so that commit is the historical landing.
- The origin of the first riscv timens work is verified only from the clone. Mailing-list history was not reviewed.

## 3. Upstream Support Tier

There is no formal tier policy for cgroups or namespaces. The code is part of the mainline kernel and is not built or released separately. The RISC-V port has been in mainline since v4.15.

Evidence for riscv64:
- `arch/riscv/configs/defconfig` enables `CGROUPS`, `MEMCG`, `BLK_CGROUP`, `CGROUP_SCHED`, `CFS_BANDWIDTH`, `CGROUP_PIDS`, `CGROUP_FREEZER`, `CGROUP_HUGETLB`, `CPUSETS`, `CGROUP_DEVICE`, `CGROUP_CPUACCT`, `CGROUP_PERF`, `CGROUP_BPF`, `USER_NS`, `CHECKPOINT_RESTORE` and `BPF_SYSCALL`.
- Whether `TIME_NS` and PSI are enabled in the defconfig was not verified. `TIME_NS` was not seen in the first 30 lines read [NEEDS VERIFICATION].
- `CHECKPOINT_RESTORE` in `init/Kconfig` depends only on `PROC_FS`, so it is not riscv-specific.
- The repository has no CI configuration for any architecture (see Section 7).
- No release-blocking status exists, because the subsystem has no separate releases.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In mainline | Data not available: not searched | Data not available: not searched | Yes, since v4.15 |
| cgroups and USER_NS in arch defconfig | Data not available: not searched | Data not available: not searched | Yes |
| Time namespace vDSO | Data not available: not searched | Exists (the riscv commit message says its implementation is "quite similar to what arm64 does") | Yes, v5.16 |
| Soft-dirty without a special extension | Yes | Yes | No. Needs the optional Svrsw60t59b extension, v6.19 |
| Syscall restart after ptrace-injected stop | Uses `orig_ax`, exposed to user space | Restart handled before `get_signal` | Same as arm64 since v6.7 |
| Upstream CI for cgroup/namespace selftests | Data not available: not searched | Data not available: not searched | Not confirmed (Section 7) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Cgroup controllers, PSI and the namespace core have no riscv-specific implementation. A search of `arch/riscv` for cgroup, CLONE_NEW, pid_ns and psi found only `arch/riscv/configs/defconfig`. `copy_thread()` in `arch/riscv/kernel/process.c` takes the generic `kernel_clone_args`, so clone and clone3 flags including CLONE_NEW* are handled by generic code. The cross-check grep of `arch/riscv` for cgroup references failed on a blob-fetch error, so the absence of other arch hooks is not independently confirmed [NEEDS VERIFICATION].

No `.S` files, SIMD dispatch or JIT specific to cgroups or namespaces exist.

| Component | amd64 | arm64 | riscv64 | Quality / ISA notes |
|---|---|---|---|---|
| cgroup v1/v2 controllers, PSI | Data not available | Data not available | Generic code, runs unchanged | Arch-independent |
| user/pid/net/mount/uts/ipc/cgroup namespaces | Data not available | Data not available | Generic code | Arch-independent |
| Time namespace vDSO | Data not available | Exists | Present. `TIME_NS_VDSO = TIME_NS && GENERIC_GETTIMEOFDAY`, and riscv selects `GENERIC_GETTIMEOFDAY if MMU && 64BIT`, so the vDSO fast path exists only on 64-bit MMU builds | Generic C, no hand assembly |
| ptrace regsets (CRIU, debuggers) | Data not available | Data not available | PRSTATUS, PRFPREG, RISCV_VECTOR, RISCV_TAGGED_ADDR_CTRL, RISCV_USER_CFI. `HAVE_ARCH_TRACEHOOK` selected | Vector regset needs the V extension |
| uprobes | Data not available | Data not available | `ARCH_SUPPORTS_UPROBES`, v5.12 | Single-step and instruction simulation |
| eBPF JIT (`CGROUP_BPF`) | Data not available | Data not available | `HAVE_EBPF_JIT if MMU`. Files `bpf_jit_comp64.c`, `bpf_jit_comp32.c` | Generic BPF JIT, not tied to cgroup programs |
| seccomp filter | Data not available | Data not available | `HAVE_ARCH_SECCOMP_FILTER` selected unconditionally | |
| Soft-dirty | Available | Available | `HAVE_ARCH_SOFT_DIRTY if 64BIT && MMU && RISCV_ISA_SVRSW60T59B`, v6.19 | Uses PTE bit 59. Swap-PTE soft-dirty borrows bit 3 |
| userfaultfd write-protect | Data not available | Data not available | `HAVE_ARCH_USERFAULTFD_WP`, same conditions as soft-dirty, v6.19 | Uses PTE bit 60. Swap-PTE uffd-wp borrows bit 4 |
| userfaultfd minor faults | Data not available | Data not available | `HAVE_ARCH_USERFAULTFD_MINOR if 64BIT && USERFAULTFD` | |
| CFI ptrace regset | Data not available | Data not available | Present, with fixes in v7.1 and v7.3 | Needs Zicfilp/Zicfiss for use |

The Svrsw60t59b extension frees PTE reserved bits 60 and 59 for software use. It is detected at runtime with `riscv_has_extension_unlikely(RISCV_ISA_EXT_SVRSW60T59B)`. The generic `pgtable_supports_soft_dirty()` helper (277a1ae3879a) makes the soft-dirty check a runtime decision. On hardware without Svrsw60t59b, CRIU incremental dumps and uffd-wp users cannot use these features.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel builds with Kconfig and `make`. There is no cmake or configure step, so there are no `-DUSE_X=OFF` flags. The commands below come from the documentation and Makefiles. None were run.

GNU cross build:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```

LLVM build (`Documentation/kbuild/llvm.rst` lists riscv as Supported):
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image
```

kselftest for this scope:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- headers
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -C tools/testing/selftests TARGETS="cgroup namespaces riscv"
```
- The cgroup Makefile builds `test_core`, `test_cpu`, `test_cpuset`, `test_freezer`, `test_hugetlb_memcg`, `test_kill`, `test_kmem`, `test_memcontrol`, `test_pids` and `test_zswap`.
- Add `run_tests` to run them on a riscv64 target.
- The selftest `config` fragments (`cgroup/config`, `namespaces/config`, `timens/config`) can be merged with `scripts/kconfig/merge_config.sh`. They set `CGROUPS`, `CGROUP_CPUACCT`, `CGROUP_FREEZER`, `CGROUP_SCHED`, `MEMCG`, `PAGE_COUNTER`, `UTS_NS`, `TIME_NS`, `IPC_NS`, `USER_NS`, `PID_NS` and `NET_NS`.

**Required toolchain versions** (`scripts/min-tool-version.sh`, mirrored in `Documentation/process/changes.rst`):

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1.0 | Raised by commit a3e8fe814ad1 (2025-01-23, x86 build). Applies to all arches except parisc64 (12.0.0) |
| Clang/LLVM | 17.0.1 | Raised from 15.0.0 by ce3267a39a92 (2026-05-17). The commit cites an LLVM 17 fix for an `asm goto` label scope-checker bug that matters with the `cleanup` attribute (`__free`). I read only the first of the two LLVM 17 fixes it names |
| binutils | 2.30 | |
| GNU make | 4.0 | |
| bash | 4.2 | |
| Python | 3.9.x | |
| pahole | 1.26 | |
| Rust (optional) | 1.85.0 | |
| bindgen (optional) | 0.71.1 | |

RISC-V feature gates in `arch/riscv/Kconfig` (not hard minimums):
- **Vector:** `RISCV_ISA_V` needs `-march=rv64imv`, binutils 2.38 or LLD, and `AS_HAS_OPTION_ARCH`.
- **Zbb, Zba, Zbc, Zbkb:** each needs binutils 2.39 or LLD.
- **Zicsr/Zifencei:** explicit handling is needed for the GNU assembler from binutils 2.36. GCC 12.1 and binutils 2.38 moved these out of base I.
- **Old ISA spec:** GCC below 11.3.0 gets the old ISA spec passed to the assembler.
- **Dynamic ftrace:** clang with the LLVM assembler needs LLD or binutils 2.36 (ClangBuiltLinux issue 1817).
- **DWARF5:** `ARCH_HAS_BROKEN_DWARF5` is set when the LLVM assembler or LLD is older than 18.0.0.
- **Rust:** `HAVE_RUST` on riscv requires clang and a 64-bit build.
- **CFI:** probed with `-march=rv64ima_zicfiss_zicfilp -fcf-protection=full`.

**QEMU.** No QEMU command line exists in `Documentation/arch/riscv/`. A broader documentation search was aborted after blob fetches failed [NEEDS VERIFICATION]. The in-tree KUnit runner `tools/testing/kunit/qemu_configs/riscv.py` uses `-machine virt -cpu rv64` with OpenSBI `fw_dynamic`. `nommu_virt_defconfig` targets the QEMU virt machine.

**Known build failures:** none found for this scope. The tree contains no Dockerfile or Containerfile.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | Gap vs arm64/amd64 |
|---|---|---|
| cgroup v1/v2 controllers, PSI | Complete (generic code) | None found. Selftest results on riscv64 not verified |
| All eight namespace types | Complete (generic code). Time namespace has the vDSO fast path on 64-bit MMU builds | None found |
| CRIU base (ptrace, signals, vector regset) | Present. CRIU port merged 2024-10-27 | CRIU `TASK_SIZE` hardcoded for SV48. Boards using SV39 failed `cwd00` with a `munmap` error |
| CRIU incremental dump (soft-dirty) | Partial. v6.19 and later, and only with Svrsw60t59b | Hardware gap. arm64 and x86 have no equivalent extension gate |
| uffd-wp, lazy restore | Partial. Same dependency | Same |
| KVM memcg accounting | Present, v7.3 | Scope is KVM only |
| seccomp, eBPF JIT, uprobes | Present | None found |

**Functional gaps.**
- Soft-dirty and uffd-wp cannot be used on hardware without Svrsw60t59b.
- CRIU on SV39 and SV57 systems has a known `TASK_SIZE` limitation (PR #2234 review, 2024-10-23). Further SV39/SV57 support was left for later.
- The CRIU PR did not mention vector state, soft-dirty or userfaultfd, so whether CRIU pre-dump and lazy-pages modes work on riscv64 is [NEEDS VERIFICATION].

**Performance gaps.** BENCHMARK DATA: none found. The web search budget was exhausted and other sources were unreachable. This is not evidence that no benchmarks exist. There are no figures for cgroup, namespace, PSI or container-startup performance on riscv64. No SIMD paths exist for this subsystem, so there is no known performance delta from missing SIMD.

**Security hardening.** seccomp filter is enabled. Shadow call stack and Zicfilp/Zicfiss CFI are gated on toolchain support. The CFI ptrace regset fails cleanly when the hardware lacks the extensions (adadf6df0bd5, v7.3).

**NaN / floating-point semantics.** Not applicable to this subsystem. The FP register ptrace regset (PRFPREG) exists for CRIU and debuggers. No FP semantics issues were reported.

## 7. CI/CD Infrastructure

**In-tree.** No riscv64 CI configuration for this subsystem exists in the kernel repository. The HEAD tree has no `.github/`, `.gitlab-ci.yml`, `.circleci`, `.travis*`, `.kernelci`, `Jenkinsfile` or `.zuul*`, and `MAINTAINERS` has no KernelCI, LKFT or syzbot entries.
- The KUnit `riscv.py` is a manual QEMU runner and does not schedule anything.
- `tools/testing/selftests/Makefile` has `TARGETS += riscv` (line 118). That directory has abi, cfi, hwprobe, mm, sigreturn and vector only, with no cgroup or namespace tests.
- A grep for "riscv" across the cgroup, namespaces, timens, clone3 and pidfd selftest directories returned nothing. The tests are arch-neutral, with no riscv config, skip or xfail. They can be built and run on riscv64 but nothing in-tree runs them there automatically.

**External.** NO RISCV64 CI CONFIRMED FOR THIS SUBSYSTEM. This is weaker than a confirmed "no CI" result because the KernelCI and LKFT result dashboards were not reviewed.
- The KernelCI result dashboard and the linux-riscv mailing-list archive were not reviewed.
- `docs.kernelci.org` and the Linaro LKFT page say nothing about riscv or about cgroup, timens or namespaces test plans.
- KernelCI does run `qemu_riscv64` jobs. The ones found are LTP `ltp-timers` runs on CIP branches (5.10.y-cip and 6.1.y-cip) under `storage.kernelci.org/cip*/.../riscv/defconfig/`. These are not cgroup or timens kselftests. The one log opened returned 404.
- syzbot and 0-day riscv64 coverage were not checked [NEEDS VERIFICATION].
- The 2021 timens commit message shows `selftests/timens` run on riscv: 8 passed, 2 skipped (CLOCK_BOOTTIME_ALARM not supported). This was a one-time developer result, not CI.

**RISE and hardware.**
- The [RISE riscv-runner](https://github.com/riseproject-dev/riscv-runner) provides managed GitHub Actions runners on native RISC-V hardware, using `runs-on: ubuntu-24.04-riscv`. Jobs run in Kubernetes pods on Scaleway EM-RV1 nodes with a Docker-in-Docker daemon. This implicitly exercises cgroups and namespaces, but the README never mentions them.
- The [RISE HIL post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/) says Collabora's LAVA lab (about 400 devices) added Banana Pi BPI-F3 and SiFive HiFive Premier P550 boards, "ready to be used for upstream testing by projects such as KernelCI". No cgroup or namespace test plan is attached.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None | None | None |
| KernelCI/LKFT cgroup/ns/timens kselftests | Data not available: not checked | Data not available: not checked | Not confirmed. Only LTP timers on CIP branches found |
| Native hardware available | Data not available | Data not available | RISE board farm and Collabora LAVA lab (BPI-F3, P550) |

## 8. Distribution and Release Status

No standalone binary, PyPI package or RISE wheel exists, because the subsystem is part of the kernel.
- No `linux-cgroups-and-namespaces` package exists on PyPI, and the RISE wheel-builder index has no entry for it.
- Ubuntu 26.04 (resolute) riscv64 kernel package availability was not checked for this subsystem [NEEDS VERIFICATION].
- The Arch Linux RISC-V page lists no packages for this subsystem.
- Facts about commits, tags and files were read from the kernel clone.

The kernel is consumed through distro `linux-image` packages. Distro kernel configs and patch status were not checked [NEEDS VERIFICATION].

Userland consumers with riscv64 builds, all from web search only [NEEDS VERIFICATION]:
- [libcgroup3 in Ubuntu questing](https://packages.ubuntu.com/questing/riscv64/libcgroup3/filelist)
- [cgroup-tools in Alpine 3.20](https://pkgs.alpinelinux.org/package/v3.20/community/riscv64/cgroup-tools)
- [CRIU 4.2 control file in Debian](https://tracker.debian.org/media/packages/c/criu/control-4.2-6) (criu, libcriu, libcompel for riscv64)
- [CRIU 4.1 in SUSE PackageHub](https://packagehub.suse.com/packages/criu/4_1-bp160_1_5) (lists "RISC-V Support")
- [AlmaLinux CRIU commit](https://git.almalinux.org/rpms/criu/commit/137ea71e4ae3f73be234905e44ecb342e463228b) (enabled the riscv64 build)
- Follow-up CRIU PR #2518 is referenced in Arch's packaging [NEEDS VERIFICATION].

**To get a working setup:** use a distro riscv64 kernel, or build a mainline kernel with `defconfig` (it already enables the cgroup, USER_NS and CHECKPOINT_RESTORE options). Use v6.19 or later for soft-dirty and uffd-wp. Those features additionally need hardware with Svrsw60t59b.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. Provides all cgroup, PSI and namespace code | Mainline since v4.15. defconfig sets the options in Section 3 | Selftest trees exist. riscv64 results in KernelCI/LKFT not verified | Distro kernels. Config and patch status not checked | Kernel maintainer-tree model (Section 1) |
| GCC | build-dependency, critical. Minimum 8.1, binutils 2.30 | See GCC report | See GCC report | See GCC report | No blocking issue for this subsystem |
| LLVM | build-dependency, optional. Minimum 17.0.1 via `LLVM=1` | riscv listed as Supported in `llvm.rst` | See LLVM report | See LLVM report | LLVM below 18 sets `ARCH_HAS_BROKEN_DWARF5` |
| OpenSBI | Supervisor-level firmware interface (timer, IPI, reset) | See OpenSBI report | See report | See report | Not specific to this subsystem |
| Svrsw60t59b (ISA extension) | Hardware prerequisite for soft-dirty and uffd-wp (v6.19) | n/a | n/a | Optional extension. Hardware without it has no soft-dirty | RISC-V International. Spec described as ratified in the v15 series cover text |
| Device tree / ACPI | Hardware description | Not specific to this subsystem | n/a | n/a | None identified |

Whether other projects in the dependency graph provide riscv64 builds of this subsystem was not checked; riscv64 availability is therefore unknown, not negative.

Time-namespace vDSO, soft-dirty, userfaultfd, ptrace regsets and uprobes are in-kernel dependencies. They are described in Section 4 and are not separate projects.

**Deep-dive on dependencies with arch-sensitive code.**
- *Linux kernel, generic vDSO:* riscv timens relies on `lib/vdso` since the 2024-2025 reworks. It depends on `GENERIC_GETTIMEOFDAY if MMU && 64BIT`.
- *Linux kernel, soft-dirty and uffd-wp:* depend on `RISCV_ISA_SVRSW60T59B` plus `64BIT && MMU`.
- *Toolchain:* the vector, bit-manipulation and CFI extensions have the binutils or LLD minimums listed in Section 5.

**Consumers with their own reports** (cross-reference by name): runc, containerd, CRIU, crun, libseccomp, libbpf, QEMU, U-Boot. See status reports at project-reports/runc.md, project-reports/containerd.md, project-reports/criu.md, project-reports/crun.md, project-reports/libseccomp.md, project-reports/libbpf.md, project-reports/qemu.md and project-reports/u-boot.md. Dependency reports: project-reports/opensbi.md, project-reports/gcc.md, project-reports/llvm.md. systemd has no `report:` entry in `projects.yml`.

## 11. Known Bugs and Active Issues

No open bug, issue number or syzbot ID for cgroups or namespaces on riscv64 was verified. the mailing-list archives and syzbot were not reviewed, so absence of bugs is not confirmed [NEEDS VERIFICATION].

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [CRIU issue 1702](https://github.com/checkpoint-restore/criu/issues/1702) | Support for RISC-V | Open | Medium | Opened 2021-12-18. PR #2234 says it resolves it, but the issue stays open. Comments after 29 were not read [NEEDS VERIFICATION] |
| CRIU PR #2234 follow-up | `TASK_SIZE` hardcoded for SV48, so SV39 boards fail | Open limitation | Medium | Found 2024-10-23 on a StarFive VisionFive 2. SV39 and SV57 support deferred |
| CRIU zdtm | 6 of 454 tests failing, 46 skipped at first run | Status unknown | Low | Test names not captured. Figures are from the PR's initial run, not current [NEEDS VERIFICATION] |
| Svrsw60t59b gap | No soft-dirty or uffd-wp without the extension | Hardware limitation | Medium | Not a bug in the kernel code |

**Correctness bugs, fixed:**
- [a8616d2dc193](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a8616d2dc193b6becc36b5f3cfeaa9ac7a5762f9): NULL dereference oops in `vdso_join_timens()` when `vfork` is used, found by `selftests/timens/vfork_exec.c`. `mm->context.vdso_info` was NULL. Fixed in v6.1, `Fixes: 3092eb456375`, `Cc: stable`.
- [ce4f78f1b53d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ce4f78f1b53d3327fbd32764aa333bf05fb68818): blocking syscalls such as `read()` returned ERESTARTSYS after a ptrace-injected `ebreak`. `regs->cause` changes and cannot be restored via ptrace. Fixed in v6.7. This broke checkpoint/restore tooling.
- 59052a88ba5f (v7.3): uninitialized regset buffers before copyin in riscv ptrace. Commit text not read.
- 6ebcbb53fc9b (v7.1): register corruption from uninitialized cregs on an error path. Whether it is ptrace-related was not checked [NEEDS VERIFICATION].
- An `orig_a0` ptrace uapi proposal (CRIU issue #1702, comments 28 and 29) was not found in riscv commit messages in the clone. The merged fix was the signal-path change above [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. No riscv-specific cgroup or namespace patch, issue or PR. No unmerged series is on record, but the mailing-list archives were not reviewed, so this is [NEEDS VERIFICATION].
- **Technical blockers:** none for the generic code. Soft-dirty and uffd-wp are gated on Svrsw60t59b, which is a hardware property. The RISC-V acceptance policy requires Frozen or Ratified extensions, and the v15 series cover text describes Svrsw60t59b as ratified.
- **Organizational blockers:** none found. No RISC-V-specific maintainer exists for these areas, and arch changes go through the RISC-V maintainers.
- **Acceptance probability:** Data not available. No pending riscv-specific series was found, and the arch-independent code is already upstream.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification.**
- The code is in mainline and functional on riscv64. cgroups, USER_NS and CHECKPOINT_RESTORE are in `arch/riscv/configs/defconfig`, and the riscv time-namespace vDSO landed in v5.16 ([dffe11e280a4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dffe11e280a42c2501e5b0cdebd85a77f539bb05)).
- No upstream riscv64 CI was confirmed that runs the cgroup, namespaces or timens kselftests, because KernelCI, LKFT and lore were inaccessible. The only KernelCI riscv64 runs found were LTP timers on CIP branches.
- Consumable kernels come from distros, whose patch status was not checked, so the patched/uncertain distribution floor (orange) applies. Nothing was found that is confirmed broken, so the grade is not red.

**Pending work that could change the grade.**
- Soft-dirty and uffd-wp (v6.19) depend on the optional Svrsw60t59b extension, so hardware without it cannot do CRIU incremental dumps.
- CRIU riscv64 ([PR 2234](https://github.com/checkpoint-restore/criu/pull/2234)) is merged but limited to SV48 `TASK_SIZE`, and [issue 1702](https://github.com/checkpoint-restore/criu/issues/1702) is still open.
- No unmerged riscv-specific cgroup or namespace series is known, but the mailing-list archives were not reviewed, so this is [NEEDS VERIFICATION].
- No RISE-funded work on this subsystem was found.
- The grade could rise to yellow or blue if KernelCI or LKFT is confirmed to run the cgroup, timens and namespaces kselftests on riscv64, or if distro kernel configs and patch status are verified clean.

## 14. Investment Analysis

**RISE check first.** No RISE blog post, riseproject-dev repo, funded work or project listing for this subsystem was found.
- The RISE blog feed lists posts through 2026-10-30. None mention cgroups, namespaces or containers. A few older posts may sit beyond the portion read.
- The RISE sitemap lists 38 posts (2024-05-15 to 2026-10-30), and none have a title about these topics.
- RISE has a "Kernel & Virtualization" working group (lead @vlsunil) and `linux` and `kubernetes-riscv` repos in the `riseproject-dev` GitHub organization. The working group board and those repos were not inspected, so funded work there is [NEEDS VERIFICATION].
- RISE runners and Collabora's LAVA lab already exist, so no new runner infrastructure is sized below.

Effort figures below are the author's estimates, not sourced.

### 14.1 Functional Enablement
- Build and run `cgroup`, `namespaces`, `timens`, `clone3` and `pidfd` selftests on riscv64 (QEMU and real hardware, including a board with SV39). Triage failures. No riscv64 results exist today.
- Audit distro riscv64 kernel configs for cgroup, namespace, `TIME_NS` and PSI options. Check patch status against mainline.
- For the chip company's own silicon: implement Svrsw60t59b so that soft-dirty and uffd-wp work. This is a hardware decision, not software effort.
- CRIU SV39/SV57 `TASK_SIZE` and CRIU pre-dump, lazy-pages and vector state on riscv64 are tracked in the CRIU report.

### 14.2 Performance Optimization
- No benchmark data exists. Establish a baseline for cgroup, namespace and container-startup cost on riscv64 hardware first. No SIMD or assembly work is indicated for this subsystem.

### 14.3 CI/CD Infrastructure
- Run the cgroup, timens and namespaces kselftests on riscv64 in KernelCI or LKFT. Use the RISE board farm and the Collabora LAVA lab, which already include BPI-F3 and P550 boards.
- Before building anything, confirm via KernelCI and LKFT access that the tests are not already run, since those sources were blocked.

### 14.4 Ecosystem Enablement
- No dependent package ecosystem exists for this subsystem (Section 10 omitted). Container runtimes and tools are tracked in their own reports.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Run and triage cgroup/namespaces/timens/clone3/pidfd selftests on riscv64 | 3-4 | Chip company kernel team | High |
| Functional | Audit distro riscv64 kernel configs and patch status | 2 | Chip company with distro maintainers | High |
| Functional | Implement Svrsw60t59b in silicon roadmap (soft-dirty, uffd-wp) | Hardware decision | Chip company architecture | High |
| CI/CD | Add riscv64 cgroup/timens/namespaces kselftests to KernelCI/LKFT | 6-8 | Chip company with RISE board farm / Collabora | High |
| Performance | Baseline benchmarks for cgroup, namespace and container startup | 3 | Chip company performance team | Medium |
| Functional | Check lore.kernel.org for unmerged riscv cgroup/namespace series | 1 | Chip company kernel team | Low |

## 15. References

- [Kernel repository (torvalds/linux.git)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [cgroup v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [dffe11e280a4, riscv/vdso: Add support for time namespaces](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=dffe11e280a42c2501e5b0cdebd85a77f539bb05)
- [a8616d2dc193, riscv: vdso: fix NULL deference in vdso_join_timens() when vfork](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a8616d2dc193b6becc36b5f3cfeaa9ac7a5762f9)
- [ce4f78f1b53d, riscv: signal: handle syscall restart before get_signal](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ce4f78f1b53d3327fbd32764aa333bf05fb68818)
- [74784081aac8, riscv: Add uprobes supported](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=74784081aac8a0f3636965fc230e2d3b7cc123c6)
- [9300f0043974, RISC-V: Add ptrace support for vectors](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9300f00439743c4a34d735e1a27118eb68a1504e)
- [277a1ae3879a, mm: softdirty: add pgtable_supports_soft_dirty()](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=277a1ae3879a82a15a2e2d6741e38e31ea6487ee)
- [2a3ebad4db63, riscv: mm: add soft-dirty page tracking support](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2a3ebad4db63e86a9443d6bff4a5977320dc09f6)
- [c64da3950cf4, riscv: mm: add userfaultfd write-protect support](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c64da3950cf45d5fd87d7754ab4698b8cec01cae)
- [b7a4bd0c8065, RISC-V: KVM: Account VM-scoped allocations to the VM cgroup](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b7a4bd0c80656dae7f0a7a9c9be4fdf6f58d29ab)
- [CRIU PR 2234, port to riscv64](https://github.com/checkpoint-restore/criu/pull/2234)
- [CRIU issue 1702, Support for RISC-V](https://github.com/checkpoint-restore/criu/issues/1702)
- [CRIU 4.1 in SUSE PackageHub](https://packagehub.suse.com/packages/criu/4_1-bp160_1_5)
- [CRIU 4.2 control file, Debian tracker](https://tracker.debian.org/media/packages/c/criu/control-4.2-6)
- [AlmaLinux CRIU riscv64 commit](https://git.almalinux.org/rpms/criu/commit/137ea71e4ae3f73be234905e44ecb342e463228b)
- [libcgroup3 riscv64 file list, Ubuntu questing](https://packages.ubuntu.com/questing/riscv64/libcgroup3/filelist)
- [cgroup-tools riscv64, Alpine 3.20](https://pkgs.alpinelinux.org/package/v3.20/community/riscv64/cgroup-tools)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE riscv-runner](https://github.com/riseproject-dev/riscv-runner)
- [RISE: Tested on real silicon, hardware-in-the-loop](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE: Bringing the Conda ecosystem to RISC-V](https://riseproject.dev/2026/10/30/bringing-the-conda-ecosystem-to-risc-v/)
- [RISE: How Kairos is charting the stepping stones of RISC-V productization](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [RISE: Working Groups move project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [LWN article on cgroup namespaces](https://lwn.net/Articles/624767)
- Kernel clone files used: `MAINTAINERS`, `Documentation/arch/riscv/patch-acceptance.rst`, `Documentation/process/changes.rst`, `Documentation/kbuild/llvm.rst`, `arch/riscv/Kconfig`, `arch/riscv/configs/defconfig`, `tools/testing/kunit/qemu_configs/riscv.py`, `tools/testing/selftests/{cgroup,namespaces,timens}/` (local kernel clone, HEAD 05441d697f7f)