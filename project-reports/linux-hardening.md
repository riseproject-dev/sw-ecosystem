---
title: Linux hardening
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
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-hardening" %}

# Linux hardening

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux hardening<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

"Linux hardening" is not a distributable package. It is a set of mainline kernel features that reduce exploitability of kernel and user-space memory-safety bugs, plus the RISC-V architecture code that enables them. Scope here is the riscv64 enablement under `arch/riscv/` and the generic hardening code it plugs into. The reference tree is the [Linux kernel mainline repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git), checked as a local clone at HEAD `05441d697f7f` (2026-11-03, tree at 7.4-rc1). Documentation index: [kernel security docs](https://docs.kernel.org/security/index.html).

Features present on riscv64 at HEAD (from `arch/riscv/Kconfig`):

- Memory-error detection: KASAN and KASAN_VMALLOC (MMU and 64BIT), KFENCE (MMU and 64BIT), UBSAN (`ARCH_HAS_UBSAN`).
- Layout and memory permissions: KASLR (`RANDOMIZE_BASE`, needs RELOCATABLE, MMU and 64BIT), strict kernel and module RWX (W^X), `HAVE_ARCH_VMAP_STACK`, `ARCH_HAS_FORTIFY_SOURCE`, `ARCH_HAS_DEBUG_VIRTUAL`.
- Stack and control-flow protection: stack protector with per-task canaries, `HAVE_ARCH_RANDOMIZE_KSTACK_OFFSET`, software kCFI (`ARCH_SUPPORTS_CFI`, `ARCH_USES_CFI_TRAPS`), software Shadow Call Stack (`ARCH_SUPPORTS_SHADOW_CALL_STACK`), and hardware user-space CFI (`RISCV_USER_CFI`, Zicfiss shadow stack and Zicfilp landing pads).
- Usercopy: `thread_struct` whitelist for hardened usercopy (generic option, riscv whitelist only).

**Governance.** There is no hardening-specific foundation or tier policy. The code is GPL-2.0 and follows the kernel maintainer-tree model with Linus Torvalds at the top. MAINTAINERS entries read from the clone:

| Entry | Maintainers | Status |
|---|---|---|
| RISC-V ARCHITECTURE | Paul Walmsley, Palmer Dabbelt, Albert Ou; reviewer Alexandre Ghiti; list linux-riscv@lists.infradead.org | Supported |
| KERNEL HARDENING | Kees Cook; reviewer Gustavo A. R. Silva; list linux-hardening@vger.kernel.org; tree `kees/linux.git for-next/hardening` | Supported |
| CLANG CONTROL FLOW INTEGRITY SUPPORT (kCFI) | Sami Tolvanen, Kees Cook; reviewer Nathan Chancellor; list llvm@lists.linux.dev | Supported |
| KASAN | Andrey Ryabinin; reviewers from Google and Arm; list kasan-dev@googlegroups.com | Maintained |
| KFENCE | Alexander Potapenko, Marco Elver (both Google); reviewer Dmitry Vyukov | Maintained |

No MAINTAINERS entry names Zicfiss, Zicfilp or shadow stack. The user shadow-stack code is covered by the generic RISC-V entry.

**Corporate contributors.** From commit author email domains, Rivos is the main driver of recent work (user CFI, KASLR, Zkr seed). SiFive, Andes, Alibaba, Huawei, ISCAS and Google also contribute. RISC-V International owns the Zicfiss, Zicfilp and Zkr specifications, not the kernel code.

**Community stance on new features.** RISC-V kernel policy (`Documentation/arch/riscv/patch-acceptance.rst`) accepts new extension patches only when the specification is Frozen or Ratified and an automated patchwork build and test passes. Maintainers state they disapprove of churn, so draft extensions stay out of tree. Hardening patches go through `linux-hardening` when generic and `linux-riscv` when RISC-V-specific. Web search showed RISC-V maintainer governance in flux (a November 2025 patch proposing to drop a listed maintainer who barely posts, a December 2024 thread on removing an inactive maintainer) [NEEDS VERIFICATION: single-source search results].

## 2. Port History and Upstreaming Timeline

Dates are commit author dates unless noted. First-release tags come from `git tag --contains` on the local clone, which is the primary source for all rows. Source for every row: [Linux mainline repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (clone).

| Date | Event | First release |
|---|---|---|
| 2017-07-10 | First `arch/riscv` commit "RISC-V: Init and Halt Code" (`76d2a0493a17`, Palmer Dabbelt) | Port in mainline since 4.15 (commit not tag-checked) |
| 2020-01-06 | KASAN (`8ad8b72721d0`, Nick Hu, Andes) | v5.6 |
| 2020-03-10 | STRICT_KERNEL_RWX (`d27c3c90817e`, Zong Li, SiFive) | v5.7 |
| 2020-07-10 | STACKPROTECTOR (`f2c9699f6555`, Guo Ren, Alibaba) | v5.9 |
| 2020-12-17 | Per-task stack canaries (`fea2fed201ee`) | v5.12 |
| 2021-01-16 | KASAN_VMALLOC (`e178d670f251`, Nylon Chen, Andes) | v5.12 |
| 2021-04-11 | Kernel mapping moved out of linear map, KASLR prerequisite (`2bfc6cd81bd1`, Alexandre Ghiti) | v5.13 |
| 2021-06-15 | KFENCE (`47513f243b45`, Liu Shixin, Huawei) | v5.14 |
| 2021-06-21 | VMAP_STACK overflow detection (`31da94c25aea`, Tong Tiangen, Huawei) | v5.14 |
| 2021-07-02 | Hardened usercopy `thread_struct` whitelist (`13e47bebbe83`) | v5.15 |
| 2021-08-05 | UBSAN (`8341dcfbd8dd`, Jisheng Zhang) | v5.15 |
| 2023-04-19 | Merge of "RISC-V kasan rework" (`2667e3673f70`) | v6.4 |
| 2023-07-10 | kCFI error handling (`af0ead42f693`) and CFI_CLANG selectable (`74f8fc31feb4`), Sami Tolvanen, Google | v6.6 |
| 2023-07-22 | Virtual kernel mapping KASLR (`84fe419dc757`, Alexandre Ghiti, Rivos) | v6.6 |
| 2023-09-27 | Shadow Call Stack (`d1584d791a29`, Sami Tolvanen) | v6.7 |
| 2023-11-09 | RANDOMIZE_KSTACK_OFFSET (`05d450aabd73`, Song Shuai, Tinylab) | v6.9 |
| 2024-06-24 | HAVE_ARCH_STACKLEAK (`b5db73fb1825`, Jisheng Zhang) | v6.11 |
| 2024-07-09 | Zkr seed for KASLR base (`945302df3de1`, Jesse Taube, Rivos) | v6.12 |
| 2025-06-12 | kCFI requires clang-17 (`6f49743af42c`, Nathan Chancellor) | v6.16 |
| 2025-07-24 | Kernel-mode hardware CFI RFC posted (11 patches, Deepak Gupta, Rivos); never merged | n/a |
| 2026-01-25 | User CFI (Zicfiss and Zicfilp) commits: `22c1e263af2a`, `fd44a4a85516`, `c70772afd5cc`, `ccad8c1336b6` (Deepak Gupta, Rivos) | v7.0 |
| 2026-02-12 | Pull `riscv-for-linus-7.0-mw1` merged (`cee73b1e840c`); [Phoronix](https://www.phoronix.com/news/RISC-V-User-Space-CFI) reports 13 February | v7.0 [NEEDS VERIFICATION: exact v7.0 release date not looked up] |
| 2026-10-01 | SCS reload fix on `sstatus.SPP` (`4d0697f19297`) | v7.3 |
| 2026-10-07 | User-CFI restore-token bounds check and envcfg fix (`df333b72c0e1`, `ca47e2891135`, Samuel Holland, SiFive) | v7.4-rc1 |

Notes:

- Release tags: `4d0697f19297` and `adadf6df0bd5` first appear in the v7.3 cycle (v7.3-rc7 and the v7.3 release).
- Date caveat: `8d6c8c40e733` has author date 2026-03-03 but was committed 2026-06-06 (v7.2-rc1).
- Series revision: the merged Kconfig patch carries a link to v23 (`20251112-v5_user_cfi_series-v23-25-...`), while [Patchew](https://patchew.org/linux/20250711-v5._5Fuser._5Fcfi._5Fseries-v18-0-a8ee62f9f38e@rivosinc.com) notes a v26 (December 2025). The final revision count is unresolved [NEEDS VERIFICATION].
- Merge date: the 2026-01-25 dates are commit dates. The pull request merge was 2026-02-12 per the clone and 13 February per Phoronix.

**Key contributors by org** (from commit email domains): Rivos (Deepak Gupta, Alexandre Ghiti, Jesse Taube, Palmer Dabbelt's earlier commits), SiFive (Zong Li, Samuel Holland, Jim Shu), Google (Sami Tolvanen), Andes (Nick Hu, Nylon Chen), Alibaba (Guo Ren, Chen Pei), Huawei (Liu Shixin, Tong Tiangen, Pu Lehui), ISCAS (Vivian Wang, Chunyan Zhang), Tinylab (Song Shuai). Paul Walmsley committed the user-CFI series.

**Is it fully upstream?** Yes for everything in Section 1 except kernel-mode hardware CFI. That series (`CONFIG_RISCV_KERNEL_CFI`, `CONFIG_ARCH_HAS_KERNEL_SHADOW_STACK`) is absent from the HEAD Kconfig. User CFI arrived in v7.0, years after the arm64 and x86 equivalents (Intel CET, Arm BTI and GCS are the equivalents named in the cover letter).

## 3. Upstream Support Tier

**Formal tier policy:** none. Hardening features are ordinary Kconfig options. The nearest policy is `patch-acceptance.rst` (ratified or frozen extensions, automated build and test pass). The kernel ships as source only. `llvm.rst` lists riscv as "Supported" under `LLVM=1`, the same level as arm64 and x86.

**Evidence:**

- CI: no CI config exists in the tree. A `git ls-tree -r HEAD` search for `.github`, `.gitlab-ci.yml`, `.travis.yml`, `.circleci`, `Jenkinsfile`, `.cirrus`, `azure-pipelines`, `.drone`, `kernelci` and `lkft` returned nothing.
- Release-blocking: not applicable. The kernel has no formal per-architecture release-blocking tier.
- Official binaries: none. Kernel.org distributes source.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mainline status | Data not available: not searched | Data not available: not searched | Mainline since 4.15 |
| LLVM=1 kernel build support level | Supported (`llvm.rst`) | Supported (`llvm.rst`) | Supported (`llvm.rst`) |
| Hardware shadow stack, user space | Intel CET (named in cover letter) | arm64 GCS (named in cover letter) | Zicfiss, v7.0 |
| Hardware landing pads, user space | Intel ENDBRANCH (named in cover letter) | Arm BTI (named in cover letter) | Zicfilp, v7.0 |
| Hardware CFI, kernel mode | Data not available | arm64 has in-kernel shadow call stack and BTI (research summary) | Unmerged RFC only |
| In-tree CI config | None | None | None |
| External CI running hardening tests | Data not available | Data not available | Not verified [NEEDS VERIFICATION] |
| linux-hardened fork scope | In scope | In scope | Out of scope (README: architectures other than arm64 and x86_64) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Quality classification below is by kernel mechanism, not by hand-tuning. JIT, SIMD and crypto are outside this scope (BPF JIT belongs to another report). Memory-permission and KASAN code under `arch/riscv/mm/` (for example `kasan_init.c`) was not read file by file.

| Component | riscv64 implementation | ISA extensions / toolchain | Files |
|---|---|---|---|
| User shadow stack | Present, v7.0 | Zicfiss (`sspush`, `sspopchk`, `ssamoswap.d`), CSR_SSP; needs FWFT SBI call; zimop and zcmop for full functionality (tied to RVA23) | `arch/riscv/kernel/usercfi.c`, `include/asm/usercfi.h`, `entry.S` (`save_userssp`, `restore_userssp`, patched in when `RISCV_ISA_EXT_ZICFISS` present) |
| User landing pads | Present, v7.0 | Zicfilp (`lpad`), envcfg CSR | same as above |
| User-CFI vDSO | Two vDSOs, picked at boot by hardware CFI extension presence | `-march=rv64ima_zicfiss_zicfilp -fcf-protection=full` | `arch/riscv/kernel/vdso_cfi/` (`Makefile`, `vdso-cfi.S`) |
| kCFI | Present, software, Clang only | `-fsanitize=kcfi`; clang-17 minimum | `arch/riscv/kernel/cfi.c`, `include/asm/cfi.h` |
| Shadow Call Stack | Present, software; shadow stack pointer in `gp`, saved in `TASK_TI_SCS_SP(tp)` | `-fsanitize=shadow-call-stack` and `ld --no-relax-gp` | `include/asm/scs.h` (macros `scs_load_init_stack`, `scs_load_irq_stack`, `scs_load_current`, `scs_load_current_if_from_user`, `scs_save_current`) |
| Kernel hardware CFI | Missing (RFC only) | Would need `-fcf-protection=full` and func-sig labels from the SiFive `cfi-dev` toolchain branch | n/a |
| KASAN, KASAN_VMALLOC | Present, 64BIT and MMU only | None | `include/asm/kasan.h`, `mm/kasan_init.c` |
| KFENCE | Present, 64BIT and MMU only | None | `include/asm/kfence.h` |
| KASLR | Present; entropy from `/chosen/kaslr-seed`, UEFI stub `EFI_RNG_PROTOCOL`, or Zkr seed | Zkr | Kconfig `RANDOMIZE_BASE` |
| Stack protector | Present, per-task canary via TLS in `tp` | `-mstack-protector-guard=tls -mstack-protector-guard-reg=tp -mstack-protector-guard-offset=0` | `include/asm/stackprotector.h` |
| W^X | Present | none | Kconfig `ARCH_HAS_STRICT_KERNEL_RWX`, `ARCH_HAS_STRICT_MODULE_RWX` |

Comparison with other architectures:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware user shadow stack | Intel CET | GCS | Zicfiss |
| Hardware user landing pads | ENDBRANCH | BTI | Zicfilp |
| Software kCFI | Data not available | Data not available | Present |
| Software SCS | Data not available | Present (research summary) | Present, software only |
| Kernel-mode hardware CFI | Data not available | In-kernel BTI and SCS (research summary) | Missing (unmerged RFC) |
| KASAN, KFENCE | Data not available | Data not available | Present |
| KMSAN | Data not available | Data not available | Not found at HEAD |
| KCSAN | Data not available | Data not available | Not found at HEAD |

The amd64 and arm64 columns were not systematically researched.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel builds with Kbuild (`make` plus Kconfig). There are no cmake or configure flags. Options are `CONFIG_*`. No RISC-V-specific container image exists in the tree. `scripts/container` is a podman/docker wrapper that takes a user-supplied image, for example `docker.io/tuxmake/korg-clang`.

**Commands** (constructed from `arch/riscv/Makefile`, `arch/riscv/configs/` and `llvm.rst`; not run [NEEDS VERIFICATION]):

```
# GNU toolchain
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig hardening.config
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image

# LLVM toolchain
make LLVM=1 ARCH=riscv defconfig hardening.config
make LLVM=1 ARCH=riscv -j$(nproc) Image

# Extra hardening options (before the build)
./scripts/config -e CFI -e SHADOW_CALL_STACK -e KASAN -e KFENCE -e RANDOMIZE_BASE
make LLVM=1 ARCH=riscv olddefconfig
```

The default image is `arch/riscv/boot/Image`. Other targets include `Image.gz`, `Image.zst`, `Image.xz` and `vmlinuz.efi`. Config files are `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config` (contains only `CONFIG_RISCV_USER_CFI=y`; see [hardening.config](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/configs/hardening.config)), `nommu_virt_defconfig` and two `nommu_k210` defconfigs.

**Toolchain minimums** (`scripts/min-tool-version.sh`, `changes.rst`; no RISC-V special case):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| binutils | 2.30 |
| Clang/LLVM (optional) | 17.0.1 |
| GNU make | 4.0 |
| Python | 3.9.x |
| pahole | 1.26 (prose says v1.22; table and prose disagree) |
| Rust (optional) | 1.85.0 |
| bindgen (optional) | 0.71.1 |

**Why:** GCC 8.1 came from x86 commit `a3e8fe814ad1` (2025-01-23); Clang 17.0.1 from `ce3267a39a92` (2026-05-17). I did not read the rationale in either commit [NEEDS VERIFICATION]. `changes.rst` says only that older Clang releases "aren't guaranteed to work".

**RISC-V-specific toolchain gates** (from `arch/riscv/Kconfig`):

- Shadow call stack: needs `-fsanitize=shadow-call-stack` and `ld --no-relax-gp`.
- kCFI: needs `-fsanitize=kcfi`, in practice Clang. clang-16 crashed in the kCFI pass with `-fpatchable-function-entry`, so `CONFIG_CFI_CLANG` now requires clang-17 (`6f49743af42c`).
- `RISCV_USER_CFI`: needs the compiler to accept `-mabi=lp64 -march=rv64ima_zicfiss_zicfilp -fcf-protection=full`. Defaults to `y`.
- DWARF5: `ARCH_HAS_BROKEN_DWARF5` when LLVM assembler and LLD are both older than 18.0.0.
- Dynamic ftrace with Clang: needs LLD or ld 2.36 or later. With GCC: `-fpatchable-function-entry=8`.
- Vector: ld 2.38 or later (LLD exempt). Zba, Zbb, Zbc, Zbkb: ld 2.39 or later (LLD exempt).
- Clang LTO: requires `CMODEL_MEDANY`.

**QEMU.** The only in-tree invocation found is `tools/testing/kunit/qemu_configs/riscv.py`: machine `virt`, `-cpu rv64`, `-bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`, boots `arch/riscv/boot/Image` with `console=ttyS0`. KUnit run, constructed: `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-` [NEEDS VERIFICATION]. The QEMU CPU flags for Zicfiss and Zicfilp are not in the tree. The v21 cover letter lists `zicfilp`, `zicfiss`, `zimop`, `zcmop`, a patched OpenSBI with FWFT support, and the SiFive `cfi-dev` riscv-gnu-toolchain branch as the test recipe ([LWN](https://lwn.net/Articles/1042289)).

**Known build failures / toolchain gaps:** the CFI kselftest is silently skipped ("Toolchain doesn't support CFI, skipping CFI kselftest.") when the compiler lacks `-march=rv64gc_zicfilp_zicfiss -fcf-protection=full`. `selftests/riscv/Makefile` only builds RISC-V subtargets when `ARCH` matches `riscv`, so a plain `make -C tools/testing/selftests` with `ARCH=riscv64` would not match the filter; the README documents `make TARGETS=riscv kselftest`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | Since |
|---|---|---|
| KASAN / KASAN_VMALLOC | Present | v5.6 / v5.12 |
| KFENCE | Present | v5.14 |
| UBSAN | Present | v5.15 |
| VMAP_STACK | Present | v5.14 |
| STRICT_KERNEL_RWX, STRICT_MODULE_RWX | Present | v5.7 |
| Stack protector, per-task canary | Present | v5.9, v5.12 |
| Hardened usercopy whitelist | Present | v5.15 |
| KASLR | Present | v6.6 |
| kCFI | Present | v6.6 |
| Shadow Call Stack (software) | Present | v6.7 |
| RANDOMIZE_KSTACK_OFFSET | Present | v6.9 |
| STACKLEAK / KSTACK_ERASE | Enabled as `HAVE_ARCH_KSTACK_ERASE` (see note below) | v6.11 |
| User shadow stack and landing pads | Present | v7.0 |
| Kernel hardware shadow stack and landing pads | Missing (RFC) | n/a |
| KMSAN | Not found in HEAD Kconfig | n/a |
| KCSAN | Not found in HEAD Kconfig | n/a |
| Spectre-style mitigation code | Not found by grep; not examined further | n/a |

amd64 and arm64 matrix columns: Data not available: those architectures were not searched in this research. The cover letter names Intel CET, Arm BTI and arm64 GCS as the equivalents of the user CFI feature.

**Stackleak rename.** Commit `b5db73fb1825` ("riscv: enable HAVE_ARCH_STACKLEAK", v6.11) enabled the feature. At HEAD, `arch/riscv/Kconfig` has `select HAVE_ARCH_KSTACK_ERASE` (line 141) and no `HAVE_ARCH_STACKLEAK`, and the LKDTM selftest config and `drivers/misc/lkdtm/kstack_erase.c` use `KSTACK_ERASE`. The option was therefore renamed from STACKLEAK to KSTACK_ERASE. The rename commit was not located.

**Functional gaps:**

- No hardware-enforced CFI for the kernel itself. Kernel forward-edge uses software kCFI (Clang only) and backward-edge uses software SCS, with the shadow stack pointer in `gp`. The RFC adds `CONFIG_RISCV_KERNEL_CFI` and needs a toolchain label scheme (20-bit hash of a normalized function-prototype string) that was still in development.
- No KMSAN or KCSAN.
- User CFI is off by default for user binaries, enabled per task via prctl, and the dynamic loader decides. Full functionality requires zimop and zcmop (RVA23). The userspace landing-pad labelling scheme was unsettled in the cover letter. Hardware availability of Zicfiss and Zicfilp was not researched. Contributor testing was on QEMU and a custom CVA6 core (`Tested-by` tags on `22c1e263af2a`).
- Shadow-stack size limit is now min(RLIMIT_STACK/8, 512MB). It was cut twice because 4GB then 2GB virtual allocations failed on 4GB-RAM systems under OVERCOMMIT_GUESS or OVERCOMMIT_NEVER, and David Laight's analysis showed that an 8MB RLIMIT_STACK gives a 1MB shadow stack, which allows 128K nested calls. Laight said it could be halved again.

**Performance gaps:** Data not available. No benchmark numbers appear in any arch/riscv hardening commit message, and the web searches for overhead figures did not run. The only performance statement is in `1b2c6b56a9fa` ("Hopefully, these spurious faults should be rare enough that this is an acceptable slowdown"), with no numbers. Do not cite any riscv64 vs arm64 hardening overhead figure from this research.

**Security hardening gaps:** see the functional gaps above and Section 11 for the SCS and CFI correctness bugs fixed in 2026.

**NaN / floating-point semantics:** not applicable to this subsystem. Data not available.

## 7. CI/CD Infrastructure

**In-tree:** there is no riscv64 CI configuration. The tree has no `.gitlab-ci.yml`, `.github/workflows`, `Jenkinsfile`, `.travis`, `.cirrus`, `azure-pipelines` or `.circleci`. CI for the kernel is external. MAINTAINERS matches for kernelci, lkft, syzbot and kselftest are only the kselftest and KUnit maintainer entries, which carry no CI information.

**In-tree test material that an external CI could consume:**

- `tools/testing/selftests/riscv/cfi/` (`cfitests.c`, `shadowstack.c`, `shadowstack.h`, `cfi_rv_test.h`, `Makefile`). It is a RISC-V-specific test (ptrace test, SIGSEGV handler checking `SEGV_CPERR`), first tag v7.0, toolchain-gated, and manual-run. Latest commits on that path: Thomas Huth (Red Hat) 2026-08-13, Zong Li (SiFive) 2026-06-06, Richard Patel 2026-05-18.
- `tools/testing/selftests/lkdtm/`: generic LKDTM hardening selftest. Its config enables LKDTM, `FORTIFY_SOURCE`, `HARDENED_USERCOPY`, `INIT_ON_ALLOC/FREE`, `UBSAN_BOUNDS`, `STACKPROTECTOR_STRONG`, `KSTACK_ERASE` and others. `tests.txt` has CFI_FORWARD_PROTO and CFI_BACKWARD entries. There are no riscv-specific entries.
- `tools/testing/kunit/qemu_configs/riscv.py` (riscv64) and `riscv32.py`: a QEMU virt config using OpenSBI `fw_dynamic`. It can run the generic hardening KUnit suites (`lib/tests/usercopy_kunit.c`, `stackinit_kunit.c`, `randstruct_kunit.c`, `overflow_kunit.c`). Whether these suites build for riscv was not checked.
- Generic tests that could run on riscv64 but were not confirmed to: `mm/kasan/kasan_test_c.c`, `mm/kfence/kfence_test.c`, `lib/test_ubsan.c`, and the LKDTM files `cfi.c`, `usercopy.c`, `perms.c`, `rodata.c`, `kstack_erase.c`, `heap.c`, `refcount.c`.
- `arch/riscv/kernel/tests/Kconfig.debug` has only `RISCV_MODULE_LINKING_KUNIT` and `RISCV_KPROBES_KUNIT`, neither of which is hardening.

**External CI:** KernelCI, LKFT, 0-day and syzbot running these tests on riscv64 could not be verified. `dashboard.kernelci.org`, lore.kernel.org and git.kernel.org were not accessible, and `lkft.linaro.org` redirected to a Linaro services page that was not fetched [NEEDS VERIFICATION].

**RISE runners:** [RISE riscv-runners](https://riscv-runners.riseproject.dev/) is a managed GitHub Actions service (`runs-on: ubuntu-24.04-riscv`, Ubuntu 24.04 on Scaleway EM-RV1, free for open source). No evidence was found of its use for kernel hardening testing.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None | None | None |
| Arch-specific hardening selftest | Data not available | Data not available | `selftests/riscv/cfi` (manual, toolchain-gated) |
| KUnit QEMU config | Data not available | Data not available | Present (`riscv.py`) |
| External CI running hardening tests | Data not available | Data not available | Not verified [NEEDS VERIFICATION] |
| RISE runner use | n/a | n/a | None found |

## 8. Distribution and Release Status

**Official binaries:** none. Kernel.org releases are source. riscv64 has been in mainline since 4.15.

**Registry checks:**

- PyPI `linux-hardening`: HTTP 404.
- RISE wheel builder (GitLab package index) for `linux-hardening`: redirected to PyPI, HTTP 404. Linux hardening is not on the [wheel builder page](https://riseproject.gitlab.io/python/wheel_builder/).
- Ubuntu 26.04 (resolute): the packages.ubuntu.com search found no package named "Linux hardening". A later verification read the resolute riscv64 `Packages.gz` indexes from ports.ubuntu.com (main: 5936 stanzas, universe: 63783) and found no riscv64 binary under `linux hardening`, `python3-linux-hardening`, `liblinux-hardening` or `linux-hardening`. The project graph database query tool was not available, so that step was substituted by direct index reads.
- Conclusion: these names are correctly absent. Hardening ships inside kernel packages, for example the distro `linux-image-*` packages.

**Distro configs:** the Ubuntu, Debian, Fedora, openSUSE and Arch riscv64 kernel configs were not checked. One lead exists: Debian's merge request [riscv64 config update for linux 6.19](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821) (contents not read).

**What a user must do to get a working binary:**

1. Use a distro riscv64 kernel package, or build mainline per Section 5 with the needed `CONFIG_*` options.
2. For user CFI, use a v7.0 or later kernel built with a toolchain that accepts `-march=rv64ima_zicfiss_zicfilp -fcf-protection=full`, run on hardware (or QEMU) with Zicfiss and Zicfilp, and boot with OpenSBI providing the FWFT SBI call.
3. For KASLR, the bootloader must pass `/chosen/kaslr-seed` or boot via the UEFI stub with `EFI_RNG_PROTOCOL`.
4. User binaries must be built with CFI support (the toolchain sets `GNU_PROPERTY_RISCV_FEATURE_1_BCFI`). Which distro userlands are built this way was not researched. Data not available.

## 9. Dependencies

Status entries for GCC, LLVM, GNU binutils, OpenSBI and QEMU come from existing reports (`project-reports/gcc.md`, `llvm.md`, `gnu-binutils.md`, `opensbi.md`, `qemu.md`) and were not re-verified. The project graph query tool was unavailable, so no graph data is reported.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | Runtime dependency, critical. Provides the hardening features (KASAN, KFENCE, KASLR, CFI, SCS, user shadow stack) | Kconfig selects all features above; mainline since 4.15 | KernelCI, LKFT, syzbot and kselftest coverage not checked [NEEDS VERIFICATION] | Mainline and stable source releases; distro configs not checked | Maintainers listed in Section 1 |
| OpenSBI | Runtime dependency, critical. `RISCV_USER_CFI` selects `RISCV_SBI`; FWFT call for shadow-stack access; Zicfilp/Zicfiss supported | Native and sole target | No CI that builds or tests anything | Source tarballs and binary archive (v1.9) | Open bug #400 on CFI/landing pads; RV32 Zalrsc build bug #413 |
| GCC | Build dependency, critical. Zicfilp/Zicfiss codegen (`-fcf-protection=full`), stack protector, `-fsanitize=shadow-call-stack` | Full CFI support via `riscv-zicfilp.cc` | De facto CI exists | Source tarballs only | riscv64 is a tertiary platform for GCC 16, so a riscv64 regression cannot block a release; report also notes miscompilation risk |
| LLVM | Build dependency, optional. Clang/LLD needed for kCFI (`CFI_CLANG`); SCS flag implemented in Clang | De facto core target, built by default | Not in required pre-merge CI; only a QEMU job scoped to `libc/**` | No upstream release binaries; Ubuntu resolute ships unpatched packages | LLD 18 or newer avoids broken-DWARF5 workaround |
| GNU binutils | Build dependency, critical. Assembler and linker; Zicfilp landing-pad PLT and CFI property notes | Zicfilp/Zicfiss property tests exist | Two Buildbot builders; status not checked (endpoints not accessible) | Source tarballs only | `--no-relax-gp` linker check gates SCS |
| QEMU | Test dependency, optional. Platform for CFI, KASAN and similar when no hardware is available | riscv64 TCG target Supported | check-tcg runs in CI via `build-some-softmmu`; no native riscv64 runner | Source only; Ubuntu 26.04 resolute carries it | Release-blocking status for riscv64 not verified [NEEDS VERIFICATION] |

**Deep dive: compiler and linker dependencies.**

- User CFI needs a compiler accepting Zicfiss/Zicfilp flags; `RISCV_USER_CFI` silently disables otherwise.
- The GCC dependency's tertiary status means CFI codegen bugs on riscv64 do not block GCC releases (per the existing GCC report, not re-verified).
- kCFI and SCS are Clang-oriented. The kernel has one tool floor of 17.0.1, so LLVM riscv64 gaps affect the hardening feature set more than the GCC floor does.
- Kernel-mode CFI (unmerged) would additionally depend on the SiFive `cfi-dev` toolchain branch and a func-sig label scheme.

**Recursion, level 2.**

- Zicfiss/Zicfilp hardware: RVA23 and zimop/zcmop. Hardware availability was not researched.
- Device tree, ACPI and the UEFI stub: entropy sources for KASLR (`kaslr-seed`, `EFI_RNG_PROTOCOL`, Zkr). Not in the dependency registry; status not researched.
- Samuel Holland's envcfg patches: the user-CFI series depends on them.

## 11. Known Bugs and Active Issues

The kernel tracks bugs by mailing-list thread and commit, not by issue number. Open-bug checks on lore, syzbot and GitHub trackers were not done. All entries below are fixed at HEAD. IDs are commit SHAs.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| `4d0697f19297` | SCS reload gated on `tp`, not `sstatus.SPP` | Fixed, v7.3 | Critical (security) | See correctness bugs |
| `df333b72c0e1` | User-CFI restore token unchecked before `ssamoswap.d` | Fixed, v7.4-rc1 | High (security) | Cc stable; Fixes `66c9c713de59` |
| `59052a88ba5f` | Short `PTRACE_SETREGSET` iov leaves stack garbage that can become the target's shadow stack pointer | Fixed, v7.3 | High (security) | Fixes `9300f0043974`, `2af7c9cf021c`; Zongmin Zhou, 2026-08-26 |
| `ca47e2891135` | envcfg CSR written for `current` when acting on another task | Fixed, v7.4-rc1 | Medium | Cc stable; Fixes `61a0200211d31e`, `8a9e22d2ca5855` |
| `adadf6df0bd5` | `REGSET_CFI` get/set succeeded without Zicfilp/Zicfiss | Fixed, v7.3 | Medium | Cc stable; now returns -EINVAL |
| `52fb1756ea1d` | BPF tailcall jump offset under `CONFIG_CFI_CLANG` corrupts kernel stack | Fixed, v7.3-rc1 | High | Pu Lehui (Huawei) |
| `93df8ae3267f` | `bpf_jit_free()` wrong `ro_header` with CFI, possible invalid free | Fixed, v7.4-rc1 | High | Fixes `e63985ecd226` |
| `e4bf6eb4c7b6` | Landing pad at `__vdso_rt_sigreturn` breaks libgcc unwinding | Fixed, v7.2-rc4 | Medium | Cc stable; Fixes `37f57bd3faea` |
| `8d6c8c40e733` | `kfence_unprotect()` cannot flush remote TLBs; false-positive UAF reports | Fixed, v7.2-rc1 | Medium | Cc stable; Fixes `b3431a8bb336`; reported by Yanko Kaneti |
| `1b2c6b56a9fa` | Svvptc does not guarantee safe return from spurious fault; unconditional `sfence.vma` | Fixed, v7.2-rc1 | Medium | Performance cost unquantified; Cc stable |
| `b3431a8bb336` | IPIs used in `kfence_protect_page()` with IRQs disabled warn | Fixed, v6.13-rc3 | Medium | Cc stable; seen on QEMU |
| `060ea84a484e` | KASAN out-of-bounds in `walk_stackframe` for non-current tasks | Fixed, v6.18-rc5 | Medium | Same fix as x86 `84936118bdf3`; [oss-sec thread](https://seclists.org/oss-sec/2025/q4/23) |
| `6f49743af42c` | clang-16 crash in kCFI pass with `-fpatchable-function-entry` | Mitigated, v6.16-rc5 | Low | `CFI_CLANG` now needs clang-17 |
| `cfb10de18538` | Kernel stack size when KASAN enabled | Fixed, v6.12-rc2 | Medium | Alexandre Ghiti |
| `f40cab8e18ed` | SMP broken with shadow call stacks | Fixed, v6.7-rc5 | High | Samuel Holland |
| `a9ad73295cc1` | Syscall wrapper for >word-size arguments | Fixed, v6.9-rc1 | Medium | Sami Tolvanen |

**Correctness and security bugs, detail.**

- **SCS pointer takeover (`4d0697f19297`).** `handle_exception()` decided whether to reload the kernel SCS pointer (`gp`) using `tp`, which is user-writable. A task setting `tp` to the linear-map address of its own `task_struct` made the kernel run with the user's `gp`. The compiler-emitted `sd ra, -8(gp)` and `ld ra, -8(gp)` then wrote to and returned through an attacker-controlled address, an unprivileged arbitrary kernel write and control-flow hijack. The commit message says it is reachable by brute force with KASLR "under our test". The poisoned `gp` was saved to `task_struct.scs_sp`, so the reload stayed skipped on later entries. The flaw existed from `d1584d791a29` (v6.7, 2023-09-27) until the fix. Reviewed-by Sami Tolvanen, Cc stable. Which stable branches got the backport was not checked [NEEDS VERIFICATION].
- **Restore token (`df333b72c0e1`).** An invalid token still ended in SIGSEGV, but only after writing 4 zero bytes at an arbitrary address, including kernel memory.
- **ptrace regset (`59052a88ba5f`).** Uninitialised stack data could reach the target's vector state and, via `riscv_cfi_set()`, its shadow stack pointer.

**Open items (not bugs in the tree):**

- Kernel-mode CFI RFC is unmerged, no newer revision found [NEEDS VERIFICATION, lore blocked].
- Open bugs on lore, syzbot and GitHub trackers: not checked. Data not available.
- Fixes `6c7674b5b7ae` (2026-04-27) and `f2abc305aa93` (2026-04-29, kCFI typing of `__riscv_copy_*_unaligned`) were seen in the log but their messages were not read.

## 12. Objections and Upstream Blockers

**Stated objections:** none retrieved. The replies on the kernel-CFI RFC (every patch has replies; patch 10/11 has about 12) were not read, so the review verdict is [NEEDS VERIFICATION].

**Technical blockers for kernel-mode hardware CFI** (from the RFC cover letter):

- Toolchain still in development: it needs `-fcf-protection=full` and the func-sig label scheme from the SiFive `cfi-dev` branch.
- The label scheme follows a proposed psABI scheme; assembly indirect call sites need toolchain support for their labels.
- Open question on whether the vDSO should use labelled or unlabelled landing pads.
- The series depends on the user-CFI series, which has now merged.
- The author posted as RFC because he had been away from the list for a long time and the design is now fine-grained.
- An earlier RFC (April 2024, [LWN](https://lwn.net/Articles/969152/)) used software SCS for the return path and was not merged.

**Organizational blockers:**

- `patch-acceptance.rst` requires ratified or frozen specifications. No policy-related blocker for the kernel-CFI series was identified.
- RISC-V maintainer-governance churn (see Section 1) is a general risk for review throughput [NEEDS VERIFICATION].
- User CFI took at least 21 and up to 26 revisions to merge (see Section 2 for the revision count).

**Acceptance probability:** Data not available. Reviewer replies were not read, so no estimate for the kernel-CFI series can be supported. For context, the user-CFI series did merge after many revisions.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification.** Hardening is mainline code with broad riscv64 support (KASAN, KFENCE, KASLR, SCS, kCFI, stack protector, W^X, and user shadow stack/landing pads in v7.0), so it is not broken. There is no in-tree CI and no verified external CI (KernelCI, LKFT, syzbot) running the hardening tests on riscv64 (see [hardening.config](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/configs/hardening.config) and `selftests/riscv/cfi`). Mainline kernels ship as source only, and consumable riscv64 kernels come from distro packages built from mainline code, so the distribution floor gives yellow. Blue was not awarded because CI test execution on riscv64 could not be verified; this is a medium-confidence grade.

**Pending work that could change the grade:**

- Kernel-mode hardware CFI (`CONFIG_RISCV_KERNEL_CFI`, hardware kernel shadow stack) is an unmerged RFC from Rivos ([July 2025, 11 patches](https://lists.infradead.org/pipermail/linux-riscv/2025-July/074544.html)). No newer revision was found.
- KMSAN, KCSAN and HAVE_ARCH_STACKLEAK were not found in the HEAD Kconfig. The stackleak result conflicts with `b5db73fb1825` and may be a KSTACK_ERASE rename (see Section 6); it needs checking.
- Security fixes continue to land: user-CFI restore-token bounds check and envcfg fix in v7.4-rc1, SCS reload gating on SPP in v7.3.
- No RISE-funded hardening work was found; the user-CFI work is mainly Rivos and SiFive. The Security Software working group charter covers the Linux kernel, but names no hardening item.
- The grade would move to blue if KernelCI or LKFT run `selftests/riscv/cfi`, lkdtm or KUnit hardening suites on riscv64. It would move to green only if upstream itself published riscv64 artifacts.

## 14. Investment Analysis

**RISE check before sizing.** No RISE-funded or RISE-attributed Linux hardening work was found. Sources checked: the RISE feed (posts from 7 July 2026 onward only; earlier posts and part of the feed middle not enumerated), the wheel builder page, the [security-software-wg repository](https://github.com/riseproject-dev/security-software-wg) (3 commits, only project folder `rp016-opensbi-tee`), the riseproject-dev org repositories (70), and web searches. The RISE Kernel & Virtualization WG wiki page returned 404 and the Security Software and Kernel & Virtualization project boards were not read. The LF RISE wiki snippets track Zicfilp as an ISA extension with LLVM proof-of-concept work, which is spec and toolchain tracking, not kernel hardening [NEEDS VERIFICATION]. Rivos is not in the RISE member list that was retrieved, so the Rivos user-CFI work should not be assumed to be RISE funded. All effort figures below are planning estimates by the author, not derived from research data.

### 14.1 Functional Enablement

- Review and test the Rivos kernel-CFI RFC series and push for a post-RFC revision; this closes the main gap versus arm64. Depends on toolchain label scheme and psABI progress.
- Resolve the open Kconfig questions: confirm stackleak/KSTACK_ERASE status; evaluate whether KMSAN and KCSAN riscv64 enablement is feasible (not found at HEAD).
- Audit SCS and CFI entry/exit paths for the bug class seen in 2026 (trusting user-writable `tp`/`gp`, unchecked user tokens, CSR writes for non-current tasks).
- Validate Zicfiss/Zicfilp on target silicon once available. Hardware availability was not researched.

### 14.2 Performance Optimization

No benchmark data was found. First step is to measure overhead of KASAN, KFENCE, SCS, kCFI and user CFI on riscv64 hardware, and quantify the cost of the unconditional `sfence.vma` from `1b2c6b56a9fa`. No optimization work can be justified before that baseline exists.

### 14.3 CI/CD Infrastructure

Establish a recurring riscv64 run of `selftests/riscv/cfi` (on QEMU with Zicfiss/Zicfilp flags, and on hardware when available), the lkdtm selftest, and the KUnit hardening suites, and engage KernelCI or LKFT to publish results. This is the step that would move the grade from yellow to blue.

### 14.4 Ecosystem Enablement

Section 10 is omitted because there is no dependent package ecosystem. Relevant enablement is user-space toolchain and distro adoption of CFI: distro userlands built with `GNU_PROPERTY_RISCV_FEATURE_1_BCFI`, and distro kernel configs enabling the hardening options (Debian's riscv64 config merge request is the lead).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Run `selftests/riscv/cfi`, lkdtm and KUnit hardening suites on riscv64 in KernelCI or LKFT | 6-10 | Chip company kernel team with KernelCI/LKFT maintainers | Critical |
| Functional | Review, test and help revive the kernel hardware CFI RFC | 8-16 | Chip company kernel team with Rivos/SiFive | High |
| Functional | Security audit of SCS/CFI/ptrace entry and token paths | 4-6 | Chip company security team | High |
| Functional | Resolve stackleak/KSTACK_ERASE status and KMSAN/KCSAN feasibility | 2-4 | Chip company kernel team | Medium |
| Performance | Measure hardening overhead on riscv64 silicon | 3-5 | Chip company performance team | Medium |
| Functional | Zicfiss/Zicfilp validation on own silicon | 4-8 | Chip company hardware validation | High |
| Ecosystem | Distro kernel config and CFI-enabled userland engagement | 3-6 | Chip company distro liaison | Medium |

## 15. References

- [Linux kernel mainline repository (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (read via local clone at HEAD 05441d697f7f; direct fetches was not accessible)
- [Linux kernel security documentation index](https://docs.kernel.org/security/index.html)
- [arch/riscv/configs/hardening.config](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/configs/hardening.config)
- [RISC-V kernel documentation (patch acceptance)](https://docs.kernel.org/arch/riscv/)
- [RISC-V Zicfiss documentation, 7.0](https://docs.kernel.org/7.0/arch/riscv/zicfiss.html)
- [Patchew: riscv control-flow integrity for usermode, v18](https://patchew.org/linux/20250711-v5._5Fuser._5Fcfi._5Fseries-v18-0-a8ee62f9f38e@rivosinc.com)
- [LWN: riscv control-flow integrity for usermode, v21](https://lwn.net/Articles/1042289)
- [linux-riscv list: riscv fine grained hardware assisted kernel CFI RFC (July 2025)](https://lists.infradead.org/pipermail/linux-riscv/2025-July/074544.html)
- [LWN: earlier kernel CFI RFC (April 2024)](https://lwn.net/Articles/969152/)
- [Phoronix: RISC-V user-space CFI](https://www.phoronix.com/news/RISC-V-User-Space-CFI)
- [Debian kernel team: riscv64 config update for linux 6.19](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821)
- [oss-sec thread cited in commit 060ea84a484e](https://seclists.org/oss-sec/2025/q4/23)
- [patch.msgid.link: SCS reload fix (4d0697f19297)](https://patch.msgid.link/20261001135711.934152-1-guoziyi114@gmail.com)
- [patch.msgid.link: KFENCE spurious fault fix (8d6c8c40e733)](https://patch.msgid.link/20260303-handle-kfence-protect-spurious-fault-v2-2-f80d8354d79d@iscas.ac.cn)
- [lore.kernel.org: KFENCE IPI fix (b3431a8bb336)](https://lore.kernel.org/r/20241209074125.52322-1-alexghiti@rivosinc.com)
- [lore.kernel.org: shadow stack size analysis by David Laight](https://lore.kernel.org/all/20260518105725.7afe7a4c@pumpkin/)
- [RISE Project](https://riseproject.dev)
- [RISE feed](https://riseproject.dev/feed/)
- [RISE security-software-wg repository](https://github.com/riseproject-dev/security-software-wg)
- [RISE riscv-runners](https://riscv-runners.riseproject.dev/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE members](https://riseproject.dev/members/)
- [Openwall linux-kernel thread (2025-02-05)](https://lists.openwall.net/linux-kernel/2025/02/05/64)
- [kernelsources.org xref: hardening.config](https://kernelsources.org/source/xref/linux/arch/riscv/configs/hardening.config)