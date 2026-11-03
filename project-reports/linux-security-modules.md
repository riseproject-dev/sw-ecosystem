---
title: Linux security modules
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
  - name: libseccomp
    relation: runtime-dependency
    criticality: optional
  - name: libcap
    relation: runtime-dependency
    criticality: optional
  - name: AppArmor
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-security-modules" %}

# Linux security modules

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux security modules<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux security modules (LSMs) are a subsystem of the mainline Linux kernel, not a standalone package. Scope for this report: LSM stacking, the in-tree LSMs (SELinux, AppArmor, Smack, TOMOYO, Landlock, Yama, LoadPin, SafeSetID, IPE, Lockdown), seccomp, audit, IMA/EVM, capabilities and keyrings. Reference documentation: [Credentials in Linux](https://docs.kernel.org/security/credentials.html).

Technical position on riscv64:
- The LSMs are architecture-neutral C code. A grep of `security/` and `Documentation/security` for riscv found no riscv-specific hits, and no file under `arch/riscv` mentions an LSM.
- The RISC-V-specific pieces are plumbing in `arch/riscv/`: audit syscall support, seccomp-filter support, generic entry, ptrace/syscall accessors, compat (rv32 on rv64), and IMA kexec support.
- The SiFive forum states the same point: LSMs are software hooks, not a CPU feature ([SiFive forum thread](https://forums.sifive.com/t/linux-security-modules/3618)).

Snapshot analysed: kernel clone at HEAD 05441d697f7f9a927264f4058cbbc6a03dfcac9d, dated 2026-11-03, described as v7.4-rc1-132-g05441d697f7f. The latest tags are v7.4-rc1, v7.3 and v7.3-rc7.

**Governance**
- No foundation owns this subsystem. It is developed by the kernel development community (the copyright footer on docs.kernel.org).
- The licence is GPL-2.0, the standard kernel SPDX identifier. The credentials page contains no licence statement [NEEDS VERIFICATION against `Documentation/process/license-rules.rst`].
- Each LSM is a generic Kconfig option with a MAINTAINERS status. "Supported" applies to the security subsystem, SELinux, AppArmor, Landlock, Yama, LoadPin, SafeSetID, IPE, IMA, audit, capabilities and seccomp. "Maintained" applies to Smack, TOMOYO, keys and Lockdown.
- LSM and framework patches go through linux-security-module@vger.kernel.org (patchwork at kernel.org). SELinux, audit and integrity have their own lists. RISC-V arch patches go through linux-riscv@lists.infradead.org and the riscv tree.
- A July 2022 thread formalised Paul Moore as a Security Subsystem maintainer ([LSM maintainer update, 2022](https://kernsec.org/pipermail/linux-security-module-archive/2022-July/032844.html)). A 2025 patch moved Lockdown from "Odd Fixes" to "Maintained" ([Lockdown maintainers patch, 2025](https://kernsec.org/pipermail/linux-security-module-archive/2025-June/051622.html)).

**Maintainers (MAINTAINERS at HEAD 05441d697f7f)**. The company is inferred from the email domain. "Unstated" means the domain is personal, generic or kernel.org.

| Area | Maintainers | Company (from email domain) |
|---|---|---|
| Security subsystem (LSM framework), tree pcmoore/lsm.git | Paul Moore, James Morris, Serge E. Hallyn | Unstated |
| SELinux | Paul Moore, Stephen Smalley | Unstated |
| AppArmor | John Johansen, Georgia Garcia | Canonical |
| Landlock | Mickael Salaun (reviewer Gunther Noack) | Salaun unstated; Noack at Google |
| Smack | Casey Schaufler | Unstated |
| TOMOYO | Kentaro Takeda, Tetsuo Handa | Takeda at NTT Data; Handa unstated |
| Yama, LoadPin, seccomp | Kees Cook (seccomp reviewers Andy Lutomirski, Will Drewry) | Unstated |
| SafeSetID | Micah Morton | Google/Chromium |
| IPE | Fan Wu | Unstated |
| IMA | Mimi Zohar, Roberto Sassu, Dmitry Kasatkin (reviewer Eric Snowberg) | Zohar at IBM; Sassu at Huawei; Snowberg at Oracle |
| Audit | Paul Moore, Eric Paris | Paris at Red Hat |
| Keys/keyrings | David Howells, Jarkko Sakkinen | Howells at Red Hat; Sakkinen unstated |
| Capabilities | Serge Hallyn | Unstated |
| Lockdown | Nicolas Bouchinet, Xiu Jianfeng | Bouchinet at ANSSI; Xiu at Huawei |

- RISC-V arch maintainers: Paul Walmsley, Palmer Dabbelt, Albert Ou (UC Berkeley by email domain), reviewer Alexandre Ghiti. Ownership is arch-level only.
- MAINTAINERS has no riscv-specific entry for any LSM, seccomp, audit or IMA.
- Employers beyond what email domains show were not looked up [NEEDS VERIFICATION].

**Corporate sponsors and RISE**
- SiFive sponsored at least the seccomp port. The commit author used a sifive.com address, and the committer was Paul Walmsley (sifive.com).
- The audit commit was authored from a gmail.com address and committed by Palmer Dabbelt, with a SiFive Signed-off-by.
- Alibaba (Guo Ren) did the generic-entry and compat conversions; Google (Sami Tolvanen) added syscall wrappers.
- Per [RISE members](https://riseproject.dev/members/), Alibaba Damo, Google, Red Hat and SiFive are Premier members, and Canonical is a General member. Several LSM maintainers work at these companies (Canonical for AppArmor, Red Hat for audit and keys, Google for Landlock review and SafeSetID).
- RISE funding or publicity for LSM work: none found (Section 13). Whether any maintainer's employer funds RISC-V LSM work is not verified.

**Community stance on new ports.** The RISC-V port is already mainline, so there is no "new port" question. No search result showed any LSM-specific riscv64 policy or objection. RISC-V extension patches follow [RISC-V patch acceptance](https://docs.kernel.org/6.0/_sources/riscv/patch-acceptance.rst.txt). New-extension patches are accepted once the spec is frozen or ratified, and a later revision also allows extensions implemented in widely available hardware. This is arch policy, not LSM policy.

## 2. Port History and Upstreaming Timeline

Verified in the shared kernel clone unless marked. Commit dates are author dates.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | RISC-V port build infrastructure, commit fbe934d69eb7 (Palmer Dabbelt). Mainline since v4.15. | Kernel clone |
| 2018-02-20 | libseccomp issue #110 opened to track RISC-V support | [libseccomp #110](https://github.com/seccomp/libseccomp/issues/110) |
| 2018-10-29 | "riscv: add audit support", efe75c494f57 (David Abdurachmanov). First tag v5.0-rc2, then v5.0. Uses generic `lib/audit.c`; adds arch definitions. | [Commit efe75c494f57](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=efe75c494f57890900caf6c8a0667db35bfaf56a) |
| 2018-10-29 | "riscv: audit: add audit hook in do_syscall_trace_enter/exit()", 0aea89430a4c (Abdurachmanov) | Kernel clone [NEEDS VERIFICATION] |
| 2018-11-06 | Audit series posted as "[PATCH 0/2] riscv: add audit support". The lore copy was not accessible and was not read. | [lore.kernel.org](https://lore.kernel.org/linux-riscv/20181106212520.Aai_6lOhZ2JkfAOMc77HWzMty7N-zdylr8viIzOX1pM@z/), [LKML archive](https://lkml.indiana.edu/1811.0/04803.html) |
| 2018-12-06 | libseccomp PR #134 (riscv64) opened by davidlt | [libseccomp PR #134](https://github.com/seccomp/libseccomp/pull/134) |
| 2019-01-07 | Audit-related fix 801009424e05 (Palmer Dabbelt) | Kernel clone [NEEDS VERIFICATION] |
| 2019-03-18 | 16add411645c (Dmitry V. Levin) adds a task_struct argument to `syscall_get_arch` | Kernel clone [NEEDS VERIFICATION] |
| 2019-08-22 | Seccomp patch submitted to linux-riscv, per a PR #134 comment | [libseccomp PR #134](https://github.com/seccomp/libseccomp/pull/134) [NEEDS VERIFICATION] |
| 2019-10-04 | "riscv: add support for SECCOMP and SECCOMP_FILTER", 5340627e3fe0 (Abdurachmanov). First tag v5.5-rc1, then v5.5. Also added riscv to the seccomp_bpf selftest. | [Commit 5340627e3fe0](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5340627e3fe08030988bdda46dd86cd5d5fb7517) |
| 2019-11-11 | libseccomp PR #134 closed unmerged: kernel support not yet in mainline and Travis builds failing | [libseccomp PR #134](https://github.com/seccomp/libseccomp/pull/134) |
| 2019-11-27 | Seccomp support reported in Linus's tree (via the riscv v5.5-rc1 pull) | [libseccomp #110](https://github.com/seccomp/libseccomp/issues/110) |
| 2019-12-18 | Fix 556f47ac6083 (Abdurachmanov): reject invalid syscalls below -1 | Kernel clone [NEEDS VERIFICATION] |
| 2020-02-23 | libseccomp PR #197 merged (commit 5432e15) | [libseccomp PR #197](https://github.com/seccomp/libseccomp/pull/197) |
| 2020-02-24 | libseccomp issue #110 closed as completed | [libseccomp #110](https://github.com/seccomp/libseccomp/issues/110) |
| 2020-07-20 | libseccomp v2.5.0 released; release notes: "Add support for the 64-bit RISC-V architecture." | [libseccomp PR #197](https://github.com/seccomp/libseccomp/pull/197) [NEEDS VERIFICATION: release date from a single source] |
| 2020-11-11 | 673a11a7e415 (YiFei Zhu): "Enable seccomp architecture tracking" | Kernel clone [NEEDS VERIFICATION] |
| 2022-04-05 | Compat syscall table (59c10c52f573) and compat rt_frame signal (7383ee05314b), Guo Ren (Alibaba). Landing release not looked up. | Kernel clone [NEEDS VERIFICATION] |
| 2022-04-08 | RISC-V kexec_file support, 6261586e0c91 (Liao Chang, Huawei). First kernel version not verified. | Kernel clone [NEEDS VERIFICATION] |
| 2023-02-21 | "riscv: entry: Convert to generic entry", f0bddf50586d (Guo Ren, Alibaba). Seccomp, audit and ptrace hooks now come from generic entry. | Kernel clone [NEEDS VERIFICATION] |
| 2023-07-10 | Syscall wrappers, 08d0ce30e0e4 (Sami Tolvanen, Google) | Kernel clone [NEEDS VERIFICATION] |
| 2026-01-28 | Fix for COMPAT_UTS_MACHINE, 0ea05c4f7527 (Han Gao, ISCAS) | Kernel clone [NEEDS VERIFICATION] |
| 2026-04-15 | kbox PR #19 merged: riscv64 seccomp and trap modes in an application sandbox | [kbox PR #19](https://github.com/sysprog21/kbox/pull/19) |
| 2026-07-13 | 8383e05af734 (Jinjie Ruan) touches riscv `syscall.h`, introduces `ARCH_SUPPORTS_SYSCALL_USER_DISPATCH`. Whether riscv opts in is unverified. | Kernel clone [NEEDS VERIFICATION] |

**Key contributors**
- David Abdurachmanov (audit and seccomp ports; SiFive address on seccomp).
- Paul Walmsley (SiFive) and Palmer Dabbelt, who committed and fixed.
- Guo Ren (Alibaba) for generic entry and compat.
- Sami Tolvanen (Google), Liao Chang (Huawei), Han Gao (ISCAS).
- Kees Cook, who reviewed the seccomp patch.
- Carlos de Paula (carlosedp), who tested seccomp on QEMU and the SiFive Unleashed.

**Is it fully upstream?** Yes for the arch glue. Audit has been in mainline since v5.0 and seccomp-filter since v5.5. No riscv-specific commits were found for SELinux, Landlock, IMA, AppArmor or the other LSMs, because none is needed. Gaps: no `KEXEC_SIG` or `arch_get_secureboot()` for riscv, and unconfirmed compat arch handling (Section 6).

**Seccomp landing.** In February 2018 a #110 commenter claimed riscv kernel support landed in 4.15 with the complete uapi. In April 2018 Paul Moore found `HAVE_ARCH_SECCOMP_FILTER` missing from riscv in Linus's tree. The verified landing for seccomp-filter is v5.5-rc1. The 4.15 claim is about the port in general, not seccomp.

**Limits of this timeline.** lore.kernel.org and patchwork were not accessible, so the v1/v2 seccomp series and the audit series were not read. A `git log -i -E --grep='riscv|risc-v' -- security/` over the clone returns only merge commits and a treewide kmalloc conversion, so no RISC-V-specific commit exists under `security/`.

## 3. Upstream Support Tier

**Formal tier policy:** none. No tiered support policy exists for LSMs on RISC-V. Status is per-LSM in MAINTAINERS (Section 1). RISC-V is a mainline architecture, so the arch glue is supported on the same basis as other architectures.

**Evidence of tiering signals**
- In-tree CI: none (Section 7).
- Release-blocking riscv64 test status: none found.
- Official binaries: none upstream. The kernel ships as source and riscv64 binaries come from distros (Section 8).
- `tools/testing/selftests/Makefile` has `TARGETS += riscv`, but the riscv selftests directory has no seccomp, audit, LSM, landlock or IMA subtarget.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch seccomp-filter and audit glue upstream | Not checked in this research | Not checked in this research | Yes (v5.0 audit, v5.5 seccomp) |
| In-tree LSM code | Generic | Generic | Generic |
| In-tree CI config | None | None | None |
| Seen in KernelCI/LKFT seccomp reports | Yes (x86_64) | Yes | None found |
| Upstream-built binaries | None (source only) | None (source only) | None (source only) |
| Formal tier policy for LSMs | None | None | None |

The KernelCI/LKFT row comes from mailing-list reports in a web search. KernelCI and LKFT themselves were not fetched [NEEDS VERIFICATION].

## 4. Technical Architecture and RISC-V-Specific Subsystems

There is no JIT, SIMD, crypto, GC barrier or hand-written assembly specific to LSMs. The only related assembly is generic-entry glue in `arch/riscv/kernel/entry.S`; its only syscall reference is the `li a7, __NR_rt_sigreturn` stub. No ISA extension is required by any component below. The "quality" column therefore rates whether arch glue is present and wired correctly. All components are C.

| Component | riscv64 implementation | Quality | Evidence |
|---|---|---|---|
| seccomp-filter arch glue | Present. `HAVE_ARCH_SECCOMP_FILTER` at `arch/riscv/Kconfig:147`. `seccomp.h` sets `SECCOMP_ARCH_NATIVE` to `AUDIT_ARCH_RISCV64` (or `AUDIT_ARCH_RISCV32`), `SECCOMP_ARCH_NATIVE_NR` to `NR_syscalls`, name "riscv64". | Full | Commit 5340627e3fe0; 673a11a7e415 for arch tracking |
| Syscall entry, seccomp and audit hooks | Present. `GENERIC_ENTRY` selected (Kconfig:114). `do_trap_ecall_u()` in `traps.c` reads the syscall number from `a7`, uses `array_index_nospec`, and calls `syscall_enter_from_user_mode_randomize_stack()` and `syscall_exit_to_user_mode()`. | Full | f0bddf50586d |
| `syscall.h` accessors | `syscall_get_nr`, `syscall_set_nr`, `syscall_get_arguments`, `syscall_set_arguments`, `syscall_get_return_value`, `syscall_set_return_value`, `syscall_get_error`, `syscall_rollback`, `syscall_get_arch` present | Full | `arch/riscv/include/asm/syscall.h` |
| Audit | `HAVE_ARCH_AUDITSYSCALL` (Kconfig:132). `AUDIT_ARCH_RISCV32` and `AUDIT_ARCH_RISCV64` at `include/uapi/linux/audit.h:435-436`. Generic `lib/audit.c`. | Full | efe75c494f57 |
| Compat (rv32 on rv64) | `COMPAT` (Kconfig:1140), `compat_syscall_table.c`, `compat_signal.c`, `compat_vdso`. `SECCOMP_ARCH_COMPAT` is not defined. `syscall_get_arch()` returns `AUDIT_ARCH_RISCV64` on 64-bit with no compat-task check. | Partial; possible gap, not confirmed as a bug | Section 6 |
| IMA and kexec | `HAVE_IMA_KEXEC if IMA` (Kconfig:1122), `KEXEC_ELF`, `machine_kexec_file.c`. No riscv-specific IMA code. Whether the generic FDT helper carries the IMA buffer was not read. | Partial [NEEDS VERIFICATION] | 6261586e0c91 |
| Secure-boot policy for IMA | None. No `HAVE_ARCH_GET_SECUREBOOT` select, no `arch_get_secureboot()`, so `IMA_ARCH_POLICY` secure-boot rules in `security/integrity/ima/ima_efi.c` never activate. | Missing | Grep of arch/riscv; the `git grep` over the blobless clone timed out once, so [NEEDS VERIFICATION] |
| Selftests | `seccomp_bpf.c`: `__NR_seccomp` 277 under `__riscv` (line 145); regs macros only for `__riscv && __riscv_xlen == 64` (line 1816), `SYSCALL_NUM` is `a7` and `SYSCALL_RET` is `a0`. No riscv-specific code in landlock or capabilities selftests. | Partial | Section 7 |
| SELinux, AppArmor, Smack, TOMOYO, Landlock, Yama, LoadPin, SafeSetID, IPE, capabilities, keyrings | None, none needed | n/a (generic) | Grep of `security/` |

Comparison per component (amd64 and arm64 were not read for these files):

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| seccomp-filter glue | Data not available (not searched) | Data not available (not searched) | Present |
| Audit glue | Data not available (not searched) | Data not available (not searched) | Present |
| Generic entry | Data not available (not searched) | Data not available (not searched) | Present |
| Compat arch handling in seccomp | Data not available (not searched) | Data not available (not searched) | `SECCOMP_ARCH_COMPAT` undefined |
| `KEXEC_SIG` | `ARCH_SUPPORTS_KEXEC_SIG` | `KEXEC_SIG` plus image verify-sig options | Absent |
| Arch secure-boot IMA policy | Present for x86 EFI [NEEDS VERIFICATION] | Data not available | Absent |

Hardening-adjacent selects in `arch/riscv/Kconfig` (detailed in the "Linux hardening" report): `ARCH_HAS_STRICT_KERNEL_RWX`, `ARCH_HAS_STRICT_MODULE_RWX`, `HAVE_ARCH_VMAP_STACK`, `HAVE_STACKPROTECTOR`, `HAVE_ARCH_RANDOMIZE_KSTACK_OFFSET`, `HAVE_ARCH_KFENCE`, `ARCH_SUPPORTS_SHADOW_CALL_STACK`, `ARCH_SUPPORTS_PAGE_TABLE_CHECK`, `RISCV_USER_CFI`.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel has no top-level CMakeLists.txt or configure and no Dockerfile or Containerfile (checked with `git ls-tree -r HEAD`). Feature switches are Kconfig symbols.

**GNU toolchain, cross-compiling**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image
```
The default image is `arch/riscv/boot/Image`. Compressed variants are selected with `KERNEL_GZIP`, `KERNEL_XZ`, `KERNEL_ZSTD` and similar options. `BOOT_TARGETS` also lists `loader`, `loader.bin` and `vmlinuz.efi`. `rv64_randconfig` exists.

**LLVM** (from `Documentation/kbuild/llvm.rst`)
```
make LLVM=1 ARCH=riscv defconfig
make LLVM=1 ARCH=riscv -j$(nproc) Image
```
- `CROSS_COMPILE` is not needed with `LLVM=1`.
- The doc lists riscv as "Supported" with `LLVM=1`.
- The same `LLVM=` value must be passed on every make invocation.

**Defconfig security settings** (`arch/riscv/configs/defconfig`): `CONFIG_SECURITY=y`, `CONFIG_SECURITY_SELINUX=y`, `CONFIG_SECURITY_APPARMOR=y`, `CONFIG_DEFAULT_SECURITY_DAC=y`, `CONFIG_EXT4_FS_SECURITY=y`. It enables no SECCOMP, AUDIT, IMA, KEYS or LANDLOCK options. A deployment needing seccomp or audit must enable them explicitly, or inherit from a distro config.

**Toolchain minimums** (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`)

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | Generic floor; parisc64 needs 12.0.0. No riscv-specific GCC minimum in the script. |
| binutils | 2.30 | |
| Clang/LLVM | 17.0.1 | Generic; Loongarch needs 18.0.0. Riscv uses the generic value. |
| Rust (optional) | 1.85.0 | |
| bindgen (optional) | 0.71.1 | |
| GNU make | 4.0 | |
| Python | 3.9.x | |
| pahole | 1.26 | Table says 1.26 but prose in the same file says v1.22 [NEEDS VERIFICATION] |
| openssl/libcrypto | 1.0.0 | |

`changes.rst` gives no per-architecture reason for the 8.1.0 and 17.0.1 floors.

**Riscv-specific toolchain gating in `arch/riscv/Kconfig`**
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI`: on for GNU as at 2.36 or later. Binutils 2.38 and GCC 12.1.0 moved to the 20191213 ISA spec, which moves some instructions into the Zicsr and Zifencei extensions.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC`: on for GCC older than 11.3.0, which cannot pass zicsr or zifencei through `-march`.
- Dynamic ftrace with GCC needs `-fpatchable-function-entry=8`. With Clang it needs GNU as, or LLVM as with lld or a linker at least 2.36.
- `ARCH_HAS_BROKEN_DWARF5` is set when the LLVM assembler and lld are both older than 18.
- ShadowCallStack needs `-fsanitize=shadow-call-stack` and `ld --no-relax-gp`.
- Rust on riscv requires `RUSTC_SUPPORTS_RISCV` and a Clang build.
- Optional ISA extensions (Zba, Zbb, Zbc, Zbkb, Zabha, Zacas, Vector) are probed and only disable the feature on old toolchains; they do not break the build.

**Disabling features** (Kconfig equivalent of `-DUSE_X=OFF`)
```
./scripts/config --disable SECURITY_SELINUX --disable SECURITY_APPARMOR
./scripts/config --disable DEBUG_INFO_BTF
./scripts/config --disable RUST
make ARCH=riscv olddefconfig
```
`DEBUG_INFO_BTF` is the option `changes.rst` ties to pahole. The other symbols were not checked in the tree [NEEDS VERIFICATION].

**QEMU.** The only in-tree riscv64 QEMU recipe is `tools/testing/kunit/qemu_configs/riscv.py`:
- `qemu_arch='riscv64'`, `kernel_path='arch/riscv/boot/Image'`, `kernel_command_line='console=ttyS0'`.
- `-machine virt -cpu rv64 -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`.
- Required Kconfig: `ARCH_VIRT`, `SERIAL_8250`, `SERIAL_8250_CONSOLE`, `SERIAL_OF_PLATFORM`, `RISCV_SBI_V01`, `SERIAL_EARLYCON_RISCV_SBI`.
- The script exits if the OpenSBI blob is missing. A `riscv32.py` also exists.
- Likely invocations, not read from the tree [NEEDS VERIFICATION]: `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-`, or `qemu-system-riscv64 -M virt -cpu rv64 -smp 2 -m 2G -nographic -kernel arch/riscv/boot/Image ...`.

**Security selftests present in the tree:** `tools/testing/selftests/seccomp`, `landlock`, `lsm`, `capabilities`, `kexec`. The landlock and seccomp selftests link `-lcap`, the capabilities selftest links `-lcap-ng`, and the lsm selftests have no external library.

**Known build failures:** none specific to LSMs on riscv64 found. `Documentation/arch/riscv/boot.rst` was not read; it is not a build document.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| seccomp-filter | Data not available (not searched) | Data not available (not searched) | Yes (v5.5) |
| Audit syscall | Data not available (not searched) | Data not available (not searched) | Yes (v5.0) |
| In-tree LSMs (generic code) | Yes | Yes | Yes. Defconfig enables SELinux and AppArmor. |
| Landlock | Yes | Yes | No riscv-specific code needed. Selftest coverage on riscv64 not confirmed. |
| IMA kexec measurement | Data not available | Data not available | `HAVE_IMA_KEXEC if IMA` |
| `KEXEC_SIG` | Yes (`ARCH_SUPPORTS_KEXEC_SIG`) | Yes | No |
| Arch secure-boot IMA policy (`arch_get_secureboot`) | Yes for x86 EFI [NEEDS VERIFICATION] | Data not available | No |
| Compat seccomp/audit arch | Data not available | Data not available | Possible gap |
| Syscall user dispatch | Data not available | Data not available | Unverified |

**Functional gaps**
- No `KEXEC_SIG` and no `arch_get_secureboot()` on riscv. The latter means IMA secure-boot arch policy rules never activate. `arch/riscv/kernel/efi.c` exists, but no arch implementation of the hook. [NEEDS VERIFICATION: the `git grep` over the blobless clone timed out once.]
- Compat (rv32 on rv64): `SECCOMP_ARCH_COMPAT` is undefined, and `syscall_get_arch()` returns `AUDIT_ARCH_RISCV64` unconditionally on 64-bit. The function body was not read for a compat-task branch. This is a possible gap for rv32-on-rv64 seccomp and audit, not confirmed as a bug.
- Syscall user dispatch: commit 8383e05af734 (2026-07-13) introduces `ARCH_SUPPORTS_SYSCALL_USER_DISPATCH`. Whether riscv opts in is unverified.
- No riscv-specific EVM or keyring code exists; the generic code is used.

**Performance gaps.** None identified. There is no riscv64 LSM, seccomp, audit or IMA benchmark was found, and there is no SIMD or assembly dependence. The one hard datum is x86, not riscv64: opening a file is about 87% slower on Linux v5.3 with SELinux hooks compiled in (policy enforcement disabled) than without ([arXiv 2101.11611](https://arxiv.org/pdf/2101.11611)). That paper extends LMBench 2.5, which could be ported to riscv64 [NEEDS VERIFICATION]. A kbox PR cites syscall overhead of up to 33x versus native in a riscv64 sandbox tool. This is not a kernel LSM measurement and the context was not checked [NEEDS VERIFICATION]. Secondary articles on Linux 6.19-rc5 riscv syscall-table sanitisation report minimal overhead with no numbers ([Phoronix](https://phoronix.com/news/linux-6.19-risc-v-side-channel), [lavx](https://news.lavx.hu/article/linux-6-19-rc5-adds-risc-v-syscall-table-sanitization-against-speculative-execution-attacks)) [NEEDS VERIFICATION against the kernel commit]. It belongs to the Linux hardening report.

**Security hardening gaps.** See the hardening selects in Section 4. The CFI work (Zicfiss/Zicfilp, `RISCV_USER_CFI`) is covered in the Linux hardening report.

**NaN / floating-point semantics.** Not applicable. No floating-point code is involved.

## 7. CI/CD Infrastructure

**In-tree CI: none.** `git ls-tree` on HEAD found no `.github/`, `.gitlab-ci.yml`, `.gitlab/`, `.travis.yml`, `.circleci/`, Jenkinsfile, `.cirrus.yml` or azure-pipelines. The top-level dotfiles are only formatter, editor and lint configs. MAINTAINERS contains no KernelCI, syzbot or LKFT references.

**Test infrastructure in the tree** (test code that runs only if something external runs it on riscv64 hardware or QEMU)
- Generic kselftests: `capabilities`, `kexec`, `landlock`, `lsm`, `seccomp`, with no riscv conditional in the files read. The seccomp, landlock and lsm directories carry `config` fragments (for example `CONFIG_SECCOMP_FILTER=y` and `CONFIG_SECURITY_LANDLOCK=y`). `seccomp/settings` sets `timeout=180`.
- `seccomp_bpf.c` has the only riscv-specific test code found for any in-scope feature (lines 145 and 1816).
- `tools/testing/selftests/riscv/Makefile` sets `RISCV_SUBTARGETS` to `abi hwprobe mm sigreturn vector cfi`. There is no security subtarget.
- KUnit: `security/apparmor/.kunitconfig` and `security/landlock/.kunitconfig` are architecture-neutral. They set KUNIT, NET, SECURITY plus the LSM's KUnit option, and the Landlock one adds AUDIT, FTRACE and SCHED_TRACER. `tools/testing/kunit/qemu_configs/riscv.py` can run riscv64 on QEMU `virt`. KUnit coverage of other LSMs is unchecked, because the search of `security/` timed out.

**External CI evidence**
- General riscv build CI exists: the `linux-riscv-bot` gist is a TuxMake rv32_defconfig build log with no kselftest, KUnit or security content ([gist](https://gist.github.com/linux-riscv-bot/ec41c8671548c80bf3e0a3d9fb792eb3)).
- RISE pre-commit CI: the Confluence page (`lf-rise.atlassian.net/wiki/x/gw6D`) and the [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci) workflows were not readable. Whether either runs kselftest landlock, lsm or seccomp, or KUnit, is [NEEDS VERIFICATION].
- RISE hardware-in-the-loop (RP012 with Collabora): adds the Banana Pi BPI-F3 and SiFive HiFive Premier P550 to Collabora's LAVA lab, for kernel and userspace testing through KernelCI ([RISE post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)). It does not mention LSM, SELinux, seccomp, audit, IMA, Landlock or AppArmor. Only a summary was returned by the fetch tool.
- KernelCI, LKFT, syzbot: not fetched. A web search found KernelCI and LKFT seccomp mailing-list reports for arm, arm64 and x86_64 only, and a 2019 riscv64 seccomp patch-thread log. Whether any runs LSM or seccomp tests on riscv64 is [NEEDS VERIFICATION].

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None | None | None |
| LSM/seccomp results seen in KernelCI/LKFT reports | seccomp reports for x86_64 found | seccomp reports found | None found [NEEDS VERIFICATION] |
| Build-only CI | Data not available | Data not available | Yes (linux-riscv-bot TuxMake) |
| RISE runners used for LSM | n/a | n/a | None found |
| Hardware | Data not available | Data not available | BPI-F3 and HiFive Premier P550 in the Collabora LAVA lab (general, not LSM-specific) |

## 8. Distribution and Release Status

**Upstream binaries:** none. The kernel is distributed as source. LSMs ship inside distro `linux-image-*` kernel packages, enabled by Kconfig. A package search for "Linux security modules" will return nothing on any architecture.

| Channel | Result |
|---|---|
| PyPI `linux-security-modules` | HTTP 404. No such project. |
| RISE wheel builder index | The simple index redirects to PyPI and returns 404. The only security packages on the wheel list are `cryptography` and `PyNaCl`. |
| Ubuntu 26.04 (resolute) packages.ubuntu.com | The package search gave no results for `linux-security-modules`. This is irrelevant to the conclusion, because the subsystem is not a package. |
| Arch Linux RISC-V | No `linux-security-modules` package; only the general `linux` kernel package was mentioned. |
| Project graph query | Not run (tool unavailable). |
| Android | The `android-mainline-riscv64` branch contains AppArmor, SELinux, Smack, TOMOYO, Yama, Landlock, IPE, LoadPin and SafeSetID in `security/` ([Android common kernel](https://android.googlesource.com/kernel/common.git/+/refs/heads/android-mainline-riscv64/security/)). |

Distro kernel configs for riscv64 (Ubuntu, Debian, Fedora, Arch, openSUSE) were not inspected. Data not available: which LSMs, seccomp, audit and IMA are enabled in distro riscv64 kernels.

Package names to check on Ubuntu 26.04 (suite resolute): `libcap-dev`, `libcap2`, `libcap-ng-dev`, `libseccomp-dev`, `libseccomp2`, `apparmor`, `libapparmor1`, `libaudit-dev`, `libselinux1-dev`, `opensbi`, `libbpf-dev`. They were not queried.

**What a user must do to get a working binary:** install a distro riscv64 kernel package, or build from source with the commands in Section 5, and confirm the needed Kconfig options (SECCOMP, AUDIT, the chosen LSMs) are enabled. The upstream riscv defconfig enables SELinux and AppArmor but not SECCOMP, AUDIT, IMA, KEYS or LANDLOCK. Userspace libraries come from the distro.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime-dependency, critical) | The subsystem itself. In-tree LSMs, seccomp, audit. | Yes. Arch selects `HAVE_ARCH_SECCOMP_FILTER` and `HAVE_ARCH_AUDITSYSCALL`. | Seccomp selftest has riscv code. KernelCI/LKFT/syzbot coverage [NEEDS VERIFICATION]. | Mainline since v4.15 (port). Latest release v7.3, v7.4-rc1 in progress. Distro kernels carry it. | Kernel community; riscv tree (Walmsley, Dabbelt, Ou) |
| OpenSBI (runtime-dependency, critical) | SBI firmware loaded before the kernel. The KUnit QEMU recipe uses `opensbi-riscv64-generic-fw_dynamic.bin`. | Data not available (project report not read) [NEEDS VERIFICATION] | Used by the in-tree KUnit riscv QEMU config | Data not available [NEEDS VERIFICATION] | RISE blog post 2026-07-16 "Advancing OpenSBI Interrupt Handling"; RP016 OpenSBI TEE in the Security Software WG repo |
| GCC (build-dependency, critical) | Compiles the kernel for riscv64. Minimum 8.1.0; below 11.3.0 riscv needs the old ISA spec workaround. | Yes (generic minimum; riscv gating in Section 5) | Data not available | Data not available | Not researched |
| LLVM (build-dependency, optional) | Alternative toolchain, `LLVM=1`. Minimum 17.0.1. | Documented as "Supported" for riscv in `llvm.rst` | Data not available | Data not available | Not researched |
| libseccomp (runtime-dependency, optional) | Userspace seccomp filter generation. Needs riscv64 syscall numbering and `AUDIT_ARCH_RISCV64`. | Yes: PR #197 merged 2020-02-23, in v2.5.0 | PR #197 reports 5229 passed, 0 failed, 114 skipped on a RISC-V board (carlosedp, 2020-02-24). Maintainers have no RISC-V hardware. | v2.5.0 (2020-07-20) [NEEDS VERIFICATION]. Current-version status not verified. | pcmoore, drakenclimber (maintainers), andreas-schwab (SUSE), carlosedp, davidlt |
| libcap (runtime-dependency, optional) | Capability userspace; link dependency of the seccomp and landlock selftests | Data not available [NEEDS VERIFICATION] | Data not available [NEEDS VERIFICATION] | Data not available [NEEDS VERIFICATION] | Not researched |
| AppArmor (runtime-dependency, optional) | Userspace tools for the AppArmor LSM. The kernel LSM is enabled in the riscv defconfig. | Data not available for the tools [NEEDS VERIFICATION] | Data not available [NEEDS VERIFICATION] | Data not available [NEEDS VERIFICATION] | Canonical (kernel maintainers) |
| libcap-ng | Capabilities selftest library | Data not available [NEEDS VERIFICATION] | Data not available | Data not available | Not researched |
| libaudit | Userspace for the audit subsystem. No project report exists. | Data not available [NEEDS VERIFICATION] | Data not available | Data not available | Not researched |
| libselinux | Userspace for SELinux. No project report exists. | Data not available [NEEDS VERIFICATION] | Data not available | Data not available | Not researched |
| libbpf | seccomp-bpf and BPF LSM userspace | Data not available [NEEDS VERIFICATION] | Data not available | Data not available | Not researched |

Notes:
- The package-graph query was not run, so none of the dependencies has a graph result. This does not mean a package is absent from Ubuntu 26.04 riscv64.
- Project reports for opensbi, libcap, libseccomp, apparmor and libbpf exist in the repository but were not read in this research.

**Deep dive: libseccomp** (the one dependency with riscv64 history in the findings)
- Issue #110 shows about 21 months between the first request (Feb 2018) and the kernel patch landing (Nov 2019), with libseccomp gating on kernel support. Paul Moore closed PR #134 for this reason.
- PR #197 (retitled "RFE: add RISC-V 64-bit support") delivered the support. Files: `include/seccomp.h.in`, `src/arch-riscv64-syscalls.c`, `src/arch-riscv64.c`, `src/arch-riscv64.h`, `tools/util.h`. The milestone was v2.5.0. Reviewers were pcmoore and drakenclimber; drakenclimber approved on 2020-02-19.
- Authorship: the fetched PR thread shows andreas-schwab (SUSE) as author, while the #110 thread attributes it to pcmoore. The PR page does not show pcmoore, so the page-derived attribution (andreas-schwab) is used here.
- A test-52-basic-load failure in a SUSE OBS build was traced to qemu-linux-user not emulating seccomp. The same failure occurs on native armv7l, because of OABI_COMPAT. Moore said the riscv64 failure can be ignored.
- David Abdurachmanov reported a possible kernel seccomp issue in Dec 2019 that libseccomp tests did not catch. Moore noted that libseccomp's tests use a BPF simulator and do not heavily exercise the kernel.

**Recursion.** OpenSBI and GCC/LLVM are firmware and toolchain dependencies. No deeper recursion on their own dependencies was performed.

## 11. Known Bugs and Active Issues

No open riscv64-specific LSM issue or PR was found. No master tracking issue exists. The nearest is libseccomp #110, which is closed.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| syzbot, 2021-09-12 | "[syzbot] riscv/fixes boot error: BUG: unable to handle kernel paging request in corrupted" ([lore](https://lore.kernel.org/all/000000000000008cad05cbc9fdf2@google.com/T/), [Google Groups](https://groups.google.com/g/syzkaller-bugs/c/RPOtPXXFzvE/m/8DWY2DhjCQAJ)) | Auto-closed as obsolete 2022-01-15 | Low | On 5.14.0-syzkaller (riscv/fixes tree). The trace passes through `lsm_cred_alloc` and `security_prepare_creds` during `copy_creds`. No reproducer. LSM code only appears in the trace. A search summary tied it to a BPF W^X change, which was not verified [NEEDS VERIFICATION]. |
| Seccomp selftest `global.user_notification_signal` | Failed on riscv during the 2019 bring-up and hung the run ([LKML thread](https://lkml.iu.edu/hypermail/linux/kernel/1908.2/08417.html)). The commit message lists it as the one failing selftest. | Current status unknown [NEEDS VERIFICATION] | Unknown | Paul Walmsley traced it to a Tycho Andersen commit. A reply blamed the test environment (seccomp enabled in the kernel but not in systemd); unconfirmed. |
| libseccomp PR #134 | Add support for RISC-V RV64 | Closed unmerged 2019-11-11 | n/a | Superseded by PR #197 |
| kbox PR #19 limitation | Rewrite mode not supported on riscv64 | Deferred | Low | Application project, not kernel. Seccomp and trap modes work. Integration failures `signal-test` and `rewrite-smoke`, stress failure `concurrent-io`; the first and last predate the PR. |
| Compat seccomp/audit arch | rv32-on-rv64 handling unconfirmed (Section 6) | Not filed | Unknown | Possible gap, not a confirmed bug |
| No `KEXEC_SIG` / `arch_get_secureboot()` | Missing capability, not a defect | Open gap | Medium (for secure-boot deployments) | Section 6 |

**Correctness bugs.** None confirmed. The `global.user_notification_signal` item is the only historic correctness-related report.

**Not LSM bugs, listed for completeness**
- [LP #2024935](https://bugs.launchpad.net/bugs/2024935): CPU 2.7x slower on Ubuntu 23.04 riscv64 Nezha/Sipeed images than on 22.10, on a MangoPi MQ-Pro. The cause was not checked [NEEDS VERIFICATION].
- [LP #1964335](https://bugs.edge.launchpad.net/bugs/1964335): excessive size of kernel modules on RISC-V (unstripped modules).
- The Ubuntu mantic 6.5.0-9.9 tracker lists LSM/AppArmor stacking patches ([tracker](https://launchpad.net/kernel-sru-workflow/+bug/2037659/comments/3)). These are features and refactoring, not a reported bug.
- A Rivos patch series fixing perf test objdump reading on riscv appears on the linux-security-module list ([patchwork](https://patchwork.kernel.org/project/linux-security-module/cover/20241216-perf_fix_riscv_obj_reading-v1-0-b75962660a9b@rivosinc.com)). It is perf tooling.

**Gaps in the search:** lore.kernel.org was not accessible, and the syzbot dashboard and KernelCI were not queried.

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. No search result showed any LSM-specific riscv64 governance, policy or objection.
- **Historical blocker:** libseccomp refused to merge riscv64 support until the kernel supported it, and Travis builds were failing ([PR #134](https://github.com/seccomp/libseccomp/pull/134)). The kernel seccomp patch was submitted in August 2019 and reached mainline in the v5.5 merge window, after being deferred from 5.4. This blocker is resolved.
- **Technical blockers:** none known. Open questions: compat arch handling, absence of `KEXEC_SIG`, absence of an arch secure-boot hook for IMA.
- **Organizational blockers:** no RISC-V hardware among the libseccomp maintainers (Moore, Feb 2020). No riscv-specific LSM maintainer exists.
- **Acceptance probability:** the arch glue is already merged. For the remaining gaps (`KEXEC_SIG`, `arch_get_secureboot()`, compat), no mailing-list series or objection was found; the lore archives were not readable. No probability figure can be supported from the findings.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro
- **Optimization-purpose project:** no

**Justification.** The LSM code is generic and the only RISC-V pieces (audit v5.0, seccomp-filter v5.5) are merged. [Seccomp commit 5340627e3fe0](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5340627e3fe08030988bdda46dd86cd5d5fb7517) selects `HAVE_ARCH_SECCOMP_FILTER` and added riscv to the seccomp_bpf selftest. The only riscv CI evidence is general build-only kernel CI (the linux-riscv-bot TuxMake build log). No LSM, seccomp or Landlock selftest or KUnit run on riscv64 was found, and consumable riscv64 kernels come from distros rather than upstream. Confidence is medium-low because the RISE, KernelCI and LKFT test coverage could not be read.

**Pending work that could change the grade**
- No open riscv64-specific LSM PRs were found.
- Possible gaps: no `KEXEC_SIG` or `arch_get_secureboot()` for riscv (the IMA secure-boot arch policy is inactive), and compat (rv32-on-rv64) seccomp/audit arch handling is unconfirmed.
- If RISE pre-commit CI, KernelCI or LKFT is confirmed to run the seccomp, landlock and lsm kselftests on riscv64, the grade could move to blue.
- The userspace libraries (libseccomp v2.5.0 with riscv64 via PR #197, libcap, libaudit, AppArmor tools) were not verified and are graded separately.
- RISE involvement: none found. RISE has no blog post, repository, runner usage or funded work on LSM, SELinux, AppArmor, Smack, TOMOYO, Landlock, seccomp, audit, IMA/EVM or keyrings for riscv64. The nearest items are the [Security Software working group](https://github.com/riseproject-dev/security-software-wg) (3 commits, 1 open issue, one project folder `docs/projects/rp016-opensbi-tee`, no LSM content), RP016 (OpenSBI TEE) and RP012 (KernelCI hardware lab). The 38-post RISE blog was checked by slug only, except for three posts that were read. The project board ([RISE project 20](https://github.com/orgs/riseproject-dev/projects/20)) could not be read without signing in. Other RP projects were not checked for kernel-security work.

## 14. Investment Analysis

RISE has already done or funded nothing identifiable for LSMs on riscv64 (Section 13), so no work item below overlaps with RISE-funded work. Effort figures are planning estimates, not sourced findings, and no sizing data exists.

### 14.1 Functional Enablement

- Confirm distro riscv64 kernel configs enable SECCOMP, AUDIT, the target LSMs and IMA (1 person-week). Data not available today.
- Resolve the compat question: read `syscall_get_arch()`, test rv32-on-rv64 seccomp and audit, and add `SECCOMP_ARCH_COMPAT` if needed (2 to 3 person-weeks).
- Check whether `global.user_notification_signal` passes on current kernels (about 1 person-week).
- `KEXEC_SIG` and `arch_get_secureboot()` for riscv: design, implementation and upstream review. Value depends on whether the product needs secure boot with IMA (6 to 10 person-weeks, upstream-review dependent).
- Verify and fix userspace: libseccomp (current release), libcap, libcap-ng, libaudit, libselinux, AppArmor tools on riscv64 (2 to 3 person-weeks).

### 14.2 Performance Optimization

No riscv64 LSM benchmarks exist in the findings and no assembly or SIMD is involved. A baseline measurement (LMBench-style file open, syscall latency with seccomp-bpf and audit enabled, SELinux/AppArmor hooks, riscv64 versus arm64 on comparable hardware) would be the first step (3 to 4 person-weeks). Optimisation work should not be sized until results exist.

### 14.3 CI/CD Infrastructure

- First confirm what RISE pre-commit CI, KernelCI and LKFT already run on riscv64 (1 person-week).
- Then run the seccomp, landlock, lsm and capabilities kselftests, and the AppArmor and Landlock KUnit suites, on riscv64 QEMU and on real boards. Report results in KernelCI/LKFT or an internal pipeline (3 to 5 person-weeks). Existing infrastructure: the in-tree riscv KUnit QEMU config and the Collabora LAVA lab with BPI-F3 and HiFive Premier P550.

### 14.4 Ecosystem Enablement

Section 10 is omitted: there is no dependent package ecosystem. The enablement is the userspace library verification in 14.1.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify distro riscv64 kernel configs for SECCOMP, AUDIT, LSMs, IMA | 1 | Internal kernel team | High |
| Functional | Compat (rv32-on-rv64) seccomp/audit arch check and fix | 2 to 3 | Internal kernel team, upstream | Medium |
| Functional | Check `global.user_notification_signal` on current kernels | 1 | Internal kernel team | Medium |
| Functional | `KEXEC_SIG` and `arch_get_secureboot()` for riscv | 6 to 10 | Internal kernel team, upstream | Medium |
| Functional | Verify libseccomp, libcap, libcap-ng, libaudit, libselinux, AppArmor tools on riscv64 | 2 to 3 | Internal userspace team | High |
| Performance | Baseline riscv64 vs arm64 LSM, seccomp and audit overhead benchmarks | 3 to 4 | Internal performance team | Low |
| CI/CD | Confirm existing RISE, KernelCI and LKFT riscv64 coverage | 1 | Internal, with RISE | High |
| CI/CD | Run seccomp, landlock, lsm and capabilities kselftests plus KUnit on riscv64 | 3 to 5 | Internal, KernelCI/LKFT | High |

## 15. References

- [Credentials in Linux (docs.kernel.org)](https://docs.kernel.org/security/credentials.html)
- [Linux kernel repository (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [Kernel commit efe75c494f57, riscv: add audit support](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=efe75c494f57890900caf6c8a0667db35bfaf56a)
- [Kernel commit 5340627e3fe0, riscv: add support for SECCOMP and SECCOMP_FILTER](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=5340627e3fe08030988bdda46dd86cd5d5fb7517)
- [Collabora mirror of commit 5340627e3fe0](https://gitlab.collabora.com/dafna/linux/-/commit/5340627e3fe08030988bdda46dd86cd5d5fb7517)
- [Audit series on lore.kernel.org (not accessible, not read)](https://lore.kernel.org/linux-riscv/20181106212520.Aai_6lOhZ2JkfAOMc77HWzMty7N-zdylr8viIzOX1pM@z/)
- [Audit series on LKML archive](https://lkml.indiana.edu/1811.0/04803.html)
- [libseccomp issue #110](https://github.com/seccomp/libseccomp/issues/110)
- [libseccomp PR #134](https://github.com/seccomp/libseccomp/pull/134)
- [libseccomp PR #197](https://github.com/seccomp/libseccomp/pull/197)
- [kbox PR #19](https://github.com/sysprog21/kbox/pull/19)
- [LKML thread on riscv seccomp bring-up, 2019](https://lkml.iu.edu/hypermail/linux/kernel/1908.2/08417.html)
- [syzbot riscv64 boot crash on lore](https://lore.kernel.org/all/000000000000008cad05cbc9fdf2@google.com/T/)
- [syzbot riscv64 boot crash on Google Groups](https://groups.google.com/g/syzkaller-bugs/c/RPOtPXXFzvE/m/8DWY2DhjCQAJ)
- [Analyzing the Overhead of Filesystem Protection Using Linux Security Modules (arXiv 2101.11611)](https://arxiv.org/pdf/2101.11611)
- [Phoronix, Linux 6.19 RISC-V side-channel](https://phoronix.com/news/linux-6.19-risc-v-side-channel)
- [lavx, Linux 6.19-rc5 RISC-V syscall table sanitization](https://news.lavx.hu/article/linux-6-19-rc5-adds-risc-v-syscall-table-sanitization-against-speculative-execution-attacks)
- [Ubuntu mantic kernel SRU tracker comment (LSM/AppArmor stacking)](https://launchpad.net/kernel-sru-workflow/+bug/2037659/comments/3)
- [Launchpad bug 2024935](https://bugs.launchpad.net/bugs/2024935)
- [Launchpad bug 1964335](https://bugs.edge.launchpad.net/bugs/1964335)
- [Rivos perf objdump series on linux-security-module patchwork](https://patchwork.kernel.org/project/linux-security-module/cover/20241216-perf_fix_riscv_obj_reading-v1-0-b75962660a9b@rivosinc.com)
- [Patchew, security_lsm_manage_policy hook](https://patchew.org/linux/20250506143254.718647-1-maxime.belair@canonical.com/20250506143254.718647-3-maxime.belair@canonical.com)
- [SiFive forum, Linux Security Modules](https://forums.sifive.com/t/linux-security-modules/3618)
- [Android common kernel, android-mainline-riscv64 security directory](https://android.googlesource.com/kernel/common.git/+/refs/heads/android-mainline-riscv64/security/)
- [LSM maintainer update, 2022](https://kernsec.org/pipermail/linux-security-module-archive/2022-July/032844.html)
- [Lockdown maintainers patch, 2025](https://kernsec.org/pipermail/linux-security-module-archive/2025-June/051622.html)
- [RISC-V patch acceptance](https://docs.kernel.org/6.0/_sources/riscv/patch-acceptance.rst.txt)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE post, Tested on real silicon](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE post, Stack-Clash security checker for RISC-V](https://riseproject.dev/2024/07/17/stack-clash-security-checker-for-risc-v/)
- [RISE post, Working groups move project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE post, Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE Security Software working group repository](https://github.com/riseproject-dev/security-software-wg)
- [RISE project board 20](https://github.com/orgs/riseproject-dev/projects/20)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci)
- [linux-riscv-bot TuxMake build log gist](https://gist.github.com/linux-riscv-bot/ec41c8671548c80bf3e0a3d9fb792eb3)
- [LSM contribution guide (P: entry, not fetched)](https://github.com/LinuxSecurityModule/kernel/blob/main/README.md)