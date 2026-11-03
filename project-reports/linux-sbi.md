---
title: Linux SBI
parent: Project Reports
color: orange
dependencies:
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
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
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-sbi" %}

# Linux SBI

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux SBI<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux SBI is the kernel's client for the RISC-V Supervisor Binary Interface. It is not a standalone project. It is the part of the Linux RISC-V port (`arch/riscv`) that makes `ecall` requests to M-mode firmware such as OpenSBI, plus the drivers and the KVM code that depend on those requests. Linux also acts as the SBI provider for guests (KVM SBI emulation). The main files are:

- Core client: `arch/riscv/kernel/sbi.c`, `sbi_ecall.c`, `sbi-ipi.c`, `cpu_ops_sbi.c`, `suspend.c`, `paravirt.c`, and the definitions in `arch/riscv/include/asm/sbi.h`.
- Drivers: `drivers/perf/riscv_pmu_sbi.c`, `drivers/cpuidle/cpuidle-riscv-sbi.c`, `drivers/tty/serial/earlycon-riscv-sbi.c`, `drivers/tty/hvc/hvc_riscv_sbi.c`, `drivers/mailbox/riscv-sbi-mpxy-mbox.c`, `drivers/acpi/riscv/cppc.c`, and `drivers/mailbox/mailbox-mchp-ipc-sbi.c` (Microchip vendor IPC).
- KVM: `arch/riscv/kvm/vcpu_sbi*.c` and `nacl.c`.

Landing points for the tracking links are the [Linux RISC-V arch documentation](https://docs.kernel.org/arch/riscv/index.html) and the [mainline kernel repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git).

**Master tracking issue:** none found. Work is tracked per SBI extension (SSE, MPXY, FWFT, debug triggers) on the linux-riscv mailing list and patchwork, not in an issue tracker.

**Governance and licence.**
- Patches go by mailing list (linux-riscv@lists.infradead.org) to the RISC-V maintainer tree at `git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`, then to Linus Torvalds.
- The kernel is GPL-2.0. The docs.kernel.org RISC-V index states no governance, foundation or licence text of its own.
- The SBI specification lives in the riscv-non-isa GitHub organization (RISC-V International). Its governance was not opened. [NEEDS VERIFICATION]
- Foundation: none specific to Linux SBI.

**Maintainers** (from `MAINTAINERS` in the clone at HEAD):
- RISC-V ARCHITECTURE (covers `arch/riscv/`, so `sbi.c`), status Supported: Paul Walmsley, Palmer Dabbelt, Albert Ou; Alexandre Ghiti is a reviewer.
- CPUIDLE DRIVER - RISC-V SBI: Anup Patel.
- KVM/riscv (SBI emulation for guests): Anup Patel, with Atish Patra as reviewer. Tree: `github.com/kvm-riscv/linux.git`, branch `riscv_kvm_next`.
- RISC-V PMU DRIVERS (`riscv_pmu_sbi.c`), Supported: Atish Patra, with Anup Patel as reviewer.
- RISC-V RPMI AND MPXY DRIVERS: Rahul Pathak and Anup Patel.
- There is no dedicated MAINTAINERS entry for `sbi.c`, `sbi-ipi.c`, or SSE/FWFT/NACL.

**Corporate sponsors** (commit author email domains for `sbi.c`, `sbi-ipi.c`, `asm/sbi.h`, `riscv_pmu_sbi.c`):

| Window | Rivos | Ventana Micro | SiFive | Others |
|---|---|---|---|---|
| Since 2023-01-01 | about 44 (Atish Patra 19, Alexandre Ghiti 10, Clement Leger 5, Palmer Dabbelt 4, Charlie Jenkins 3) | about 15 (Anup Patel 8, Mayuresh Chitale 3, Andrew Jones 3, Radim Krcmar 2) | 4 (all Samuel Holland) | KylinOS 3, Andes 2, Samsung 2; Torvalds 18 (treewide changes and merges) |
| All history | 53 | 21 | 8 | linux-foundation.org 26, wdc.com 18, huawei.com 6, syntacore.com 5 |

Anup Patel and Atish Patra, who maintain most SBI drivers, were at Western Digital for the early commits. The employer behind Atish Patra's `linux.dev` address is not stated in the files.

**Community culture on new extensions.** `Documentation/arch/riscv/patch-acceptance.rst` is the closest thing to a policy:
- New extensions are accepted only if the specification is Frozen or Ratified (RISC-V specs) or has a published ECR (UEFI specs).
- Vendor custom extensions need ratification or wide hardware availability.
- Patches are checked by automation against [patchwork](https://patchwork.kernel.org/project/linux-riscv) and failing patches usually need resubmitting.
- Maintainers disapprove of churn and prefer well-reviewed, tested code.

In practice, draft SBI extensions are not merged and developers keep out-of-tree branches until the specification is stable. For example, the FWFT commit message says FWFT "will be ratified in SBI V3.0 hence, it is provided as a separate commit that can be left out if needed."

## 2. Port History and Upstreaming Timeline

The RISC-V port is fully upstream. Merged, in tree at HEAD `05441d697f7f` (`v7.4-rc1-132-g05441d697f7f`, 2026-11-03), are the SBI client for every extension that has shipped plus the KVM SBI emulation. SSE is not in tree and DBTR has only its IDs.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | First `arch/riscv` commit `76d2a0493a17d` (Palmer Dabbelt); first SBI code `6d60b6ee0c977` | Clone `git log` |
| 2017-11-15 | Linus merges the RISC-V port (`b293fca43be5`, tag `riscv-for-linus-4.15-arch-v9-premerge`); v4.15-rc1 2017-11-26, v4.15 2018-01-28 | Clone |
| 2018-03-08 | hvc SBI console, v4.17 | Clone |
| 2018-12-04 | SBI earlycon, v5.0 | Clone |
| 2019-10-28 | `sbi.c` first appears, v5.5 | Clone |
| 2020-03-17 (authored) | SBI v0.1 renamed (`8446923ae4d7`), SBI v0.2 base and extensions (`b9dcd9e41587`, `1ef46c231df4`), HSM definitions (`db5a79460315`); applied 2020-03-31, v5.7. Author Atish Patra | Clone, tag check |
| 2021-09-27 | KVM SBI emulation (`vcpu_sbi.c`), v5.16 | Clone |
| 2022-01-11 | SRST used when available (`b579dfe71a6a`), v5.17 | Clone |
| 2022-02 | SBI cpuidle driver (2022-02-10, Anup Patel) and SBI PMU driver (2022-02-18, Atish Patra), v5.18 | Clone |
| 2023-03-28 | `sbi-ipi.c`, v6.4 (Anup Patel) | Clone |
| 2024-01-10/11 | DBCN helpers, HVC DBCN, SBI earlycon (`f43fabf444ca`, `88ead68e764c`, `50942ad6ddb5`) and SUSP (`4dc4af9ce326`), v6.8 | Clone |
| 2024-02-08 | ACPI CPPC, v6.9 | Clone |
| 2024-04-22 | PMU snapshot definitions (`8f486ced2860`) and minor-version mask fix (`b737fc24a12c`), v6.10 | Clone |
| 2024-07-10 | SBI call/return tracepoints (`56c1c1a09ab9`, Samuel Holland), v6.11 | Clone |
| 2024-10-28 | NACL definitions (`5daf89e73d77`, Anup Patel), v6.13 | Clone |
| 2025-06-04 | FWFT definitions, interface and calls (`cf8651f7319d`, `6d6d0641dcfa`, `c4a50db1e173`, Clement Leger), v6.16 | Clone |
| 2025-09-08 | KVM FWFT (`6b72fd170592`), v6.18 | Clone |
| 2025-09-24 | MPXY definitions and mailbox driver (`508da38677a6`, `bf3022a4eb11`, Anup Patel), v6.18 | Clone |
| 2025-11-16 | Prefer SRST shutdown over legacy (`7b090e7b910c`), landed in v6.18-rc7 | Clone |
| 2025-11-24 | KVM MPXY for guests (`7050f1d79f1c`), v6.19 | Clone |
| 2025-12-19 | DBTR extension and function IDs only (`5efaf92da436`, Himanshu Chauhan), v6.19 | Clone |
| 2026-01-29 | Kernel access to shadow stack memory via FWFT (`41213bf2ae6c`, Deepak Gupta), v7.0 | Clone |
| 2026-10-05 | Variadic `sbi_ecall` (`eb44ccd82991`, `aa89052e0962`, Radim Krcmar), v7.4-rc1 | Clone |
| 2026-10-29 | SSE v12 posted on linux-riscv, unmerged | Mirror [NEEDS VERIFICATION] |

Notes on releases and tags:
- **SUSP release.** The commit `4dc4af9ce326` ("riscv: sbi: Introduce system suspend support") is tagged v6.8 and was authored 2023-12-06. The 2022-02-10 date sometimes quoted for "SBI suspend" matches the cpuidle driver (HSM suspend), not SUSP.
- **KVM FWFT.** The commit was applied 2025-09-08 and is tagged v6.18.
- **SRST preference.** `7b090e7b910c` was authored 2025-11-14 and committed 2025-11-16, and it landed in v6.18-rc7 (tag v6.18).

Key contributors by organization: Rivos (Atish Patra, Clement Leger, Alexandre Ghiti, Deepak Gupta), Ventana Micro (Anup Patel, Himanshu Chauhan, Andrew Jones, Mayuresh Chitale, Radim Krcmar, Rahul Pathak), SiFive (Samuel Holland, Nick Hu), Western Digital (early Atish Patra and Anup Patel work), Syntacore (Sergey Matyukevich), ByteDance (Zhanpeng Zhang, SSE v9 takeover).

## 3. Upstream Support Tier

**Formal tier policy:** the kernel has no tiering. The relevant rule is `patch-acceptance.rst` (Section 1). The RISC-V ARCHITECTURE MAINTAINERS entry is status Supported, and the RISC-V PMU DRIVERS entry is Supported. The RISC-V port has been in mainline since 4.15.

**Evidence:**
- CI: none defined in the kernel tree (Section 7). No claim is made for KernelCI, LKFT, syzbot or 0-day, because they could not be read.
- Release-blocking: no source found. Data not available: no document in the clone or on docs.kernel.org states that riscv64 test results gate a release.
- Official binaries: none for Linux SBI as a separate thing. SBI ships only inside kernel images (Section 8).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SBI client code in tree | Not applicable (SBI is the RISC-V supervisor-firmware interface) | Not applicable | Yes, `arch/riscv/kernel/sbi.c` and related files |
| Maintainer status | Data not available in findings | Data not available in findings | RISC-V ARCHITECTURE: Supported |
| In-tree CI definition | Data not available in findings | Data not available in findings | None (no `.gitlab-ci.yml`, `.github/`, `.travis.yml`, Jenkinsfile) |
| SBI-specific test | Not applicable | Not applicable | KVM selftest `sbi_pmu_test.c` only |
| External CI coverage | Data not available in findings | Data not available in findings | Not verified (KernelCI, LKFT and syzbot were not accessible) |

Comparison data for amd64 and arm64 was not collected, since the SBI interface has no counterpart there that the findings cover.

## 4. Technical Architecture and RISC-V-Specific Subsystems

SBI code is plain C around one inline-asm `ecall` wrapper (register-pinned `a0`-`a7`). Nothing is hand-tuned and no SIMD, JIT or crypto code belongs to this subsystem. `arch/riscv/net/` is the BPF JIT and is outside Linux SBI. `head.S` is the only assembly file that references SBI (`secondary_start_sbi`, the HSM hart entry, and a raw `ecall` for the FWFT shadow-stack feature under `CONFIG_RISCV_USER_CFI`). `suspend_entry.S` is the suspend entry. No ISA extension is needed by the SBI client itself. FWFT can be used to turn on several hardware features: misaligned-exception delegation, landing pad, shadow stack, double trap, PTE A/D hardware updating and pointer-masking PMLEN.

The scale hand-tuned/intrinsics/scalar/missing does not fit. The labels used are: full (implemented with a live in-tree consumer), partial (definitions or restricted scope), scalar (legacy or fallback path), missing (absent). Evidence is from targeted `git show` of files on the clone.

| Component | riscv64 rating | Spec gate | Evidence |
|---|---|---|---|
| `sbi_ecall` core | full | n/a | Variadic macro in `asm/sbi.h`; `sbi_call` and `sbi_return` tracepoints; `__sbi_base_ecall` in `sbi_ecall.c` |
| Base probing and version | full | n/a | `sbi_init()` reads spec, implementation ID and version, then probes extensions |
| Legacy v0.1 | scalar | n/a | Under `CONFIG_RISCV_SBI_V01`; hart IDs limited to `BITS_PER_LONG`; a comment says it will be removed |
| TIME, IPI, RFENCE | full | v0.2 | Function-pointer paths incl. `HFENCE_*`; falls back to v0.1 if absent; `sbi-ipi.c` for IPI |
| HSM CPU bring-up | full | v0.2 | `cpu_ops_sbi.c`; preferred boot path; needed for hotplug and kexec |
| SRST | full | 0.3 | Restart handler at priority 192, platform power-off; falls back to legacy shutdown |
| DBCN | full | 2.0 | `hvc_riscv_sbi.c`, `earlycon-riscv-sbi.c`; sets `sbi_debug_console_available` |
| PMU | full | 2.0, 3.0 checks | `riscv_pmu_sbi.c` (heaviest SBI user), perf JSON, KVM selftest |
| SUSP | full | 2.0 | `suspend.c` registers `platform_suspend_ops`; only suspend-to-RAM sleep type used |
| STA steal time | full | n/a | `paravirt.c` probes `SBI_EXT_STA` |
| FWFT | full | 3.0 | Sets `sbi_fwft_supported`; used for misaligned delegation and shadow stack |
| CPPC | partial | n/a | `SBI_EXT_CPPC` and function IDs defined locally in `drivers/acpi/riscv/cppc.c`, not in `asm/sbi.h`; ACPI-only |
| NACL | full (host-KVM side) | n/a | `arch/riscv/kvm/nacl.c` host-side client; not exposed to guests |
| MPXY | full | 3.0 (per commit message) | Mailbox driver plus RPMI clock, system-MSI and power-domain consumers |
| Debug triggers (DBTR) | partial | n/a | IDs only (`5efaf92da436`); no `hw_break*` file in `arch/riscv/kernel` |
| SSE | missing | 3.0 | No `SBI_EXT_SSE`, no `drivers/firmware/riscv` directory |
| KVM SBI emulation | full, with gaps | n/a | Table covers V01, BASE, TIME, IPI, RFENCE, SRST, HSM, PMU, DBCN, SUSP, STA, FWFT, MPXY, EXPERIMENTAL, VENDOR; no NACL, DBTR, SSE or CPPC entry |

Comparison per component, amd64 vs arm64 vs riscv64: not applicable. The table above is riscv64 only. Data not available: no amd64 or arm64 equivalent mapping was researched.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild. There is no cmake or configure step, and no `-DUSE_X=OFF` flags. SBI behaviour is selected through Kconfig.

**Build commands.** The riscv64 invocations below are adapted from Kbuild conventions and `Documentation/kbuild/llvm.rst` (which lists riscv as Supported with `LLVM=1`). They are not text copied from the tree. [NEEDS VERIFICATION]

GNU cross build:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image
```

LLVM build:
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image
```

`LLVM=1` makes `CROSS_COMPILE` unnecessary (llvm.rst). The default boot image is `arch/riscv/boot/Image`. `arch/riscv/configs/` holds `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig` and `nommu_virt_defconfig`. No Dockerfile or Containerfile exists in the tree.

**Toolchain minimums** (`Documentation/process/changes.rst`, `scripts/min-tool-version.sh`, no riscv special case):

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | Common to all architectures (parisc64 is the only special case, 12.0.0) |
| GNU binutils | 2.30 | Common to all architectures |
| Clang/LLVM | 17.0.1 | Optional |
| GNU make | 4.0 | |
| Rust | 1.85.0 | Optional; `HAVE_RUST` needs `RUSTC_SUPPORTS_RISCV` (64-bit only) and Clang; target `riscv64imac-unknown-none-elf` |
| bindgen | 0.71.1 | Optional |
| bash | 4.2 | |
| Python | 3.9.x | |

**RISC-V-specific toolchain constraints** (`arch/riscv/Kconfig`, `arch/riscv/Makefile`):
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies for binutils 2.36 or newer; binutils 2.38 and GCC 12.1.0 moved Zicsr and Zifencei out of the base ISA, so `_zicsr_zifencei` is appended to `-march`.
- GCC older than 11.3.0 uses `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` and passes `-Wa,-misa-spec=2.2`.
- `TOOLCHAIN_HAS_V` needs `LD_IS_LLD` or ld 2.38, plus `AS_HAS_OPTION_ARCH`.
- `TOOLCHAIN_HAS_ZBB`, `ZBA`, `ZBC` and `ZBKB` each need `LD_IS_LLD` or ld 2.39. `ZABHA`, `ZACAS` and `VECTOR_CRYPTO` need `AS_HAS_OPTION_ARCH`.
- Dynamic ftrace with Clang needs the GNU assembler, or the LLVM assembler with lld or ld 2.36 or newer. With GCC it needs `-fpatchable-function-entry=8`.
- `ARCH_HAS_BROKEN_DWARF5` is set when the LLVM assembler and lld are both older than 18.
- Flags: `-mabi=lp64`, `-mno-save-restore`, `-mstrict-align` (when efficient unaligned access is not set), `-mcmodel=medany` or `medlow`.

**SBI-related Kconfig options:**
- `CONFIG_RISCV_SBI` is `default y` and depends on `!RISCV_M_MODE`.
- `CONFIG_RISCV_SBI_V01` keeps the legacy path. It caps `NR_CPUS` (64-bit default 64, range 2 to 64; without it default 256, range 2 to 512) and selects spinwait boot. Its help text says it will be deprecated when legacy M-mode software is gone.
- `CONFIG_RISCV_BOOT_SPINWAIT` depends on SMP and defaults to y when `RISCV_SBI_V01` or `RISCV_M_MODE` is set. It cannot support CPU hotplug or sparse hart IDs.
- `CONFIG_SERIAL_EARLYCON_RISCV_SBI` is on in `defconfig`.
- `CONFIG_RISCV_SBI_FWFT_DELEGATE_MISALIGNED` uses FWFT to delegate misaligned load/store traps.

**Minimum SBI version.** `SBI_SPEC_VERSION_DEFAULT` is 0x1, so v0.1 is assumed until the Base extension reports a version. The effective minimum is v0.1 with `CONFIG_RISCV_SBI_V01`, otherwise v0.2. SRST needs 0.3, DBCN and SUSP need 2.0, and FWFT needs 3.0, each also confirmed by a probe. HSM is required for SMP hotplug.

**QEMU usage** (`tools/testing/kunit/qemu_configs/riscv.py`, read in the tree):
- Config fragment: `CONFIG_ARCH_VIRT=y`, `CONFIG_SERIAL_8250=y`, `CONFIG_SERIAL_8250_CONSOLE=y`, `CONFIG_SERIAL_OF_PLATFORM=y`, `CONFIG_RISCV_SBI_V01=y`, `CONFIG_SERIAL_EARLYCON_RISCV_SBI=y`.
- Run: `qemu-system-riscv64 -machine virt -cpu rv64 -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`, kernel image `arch/riscv/boot/Image`, command line `console=ttyS0`.
- The script exits if the OpenSBI file is missing, and expects the `qemu-system-riscv` package. A `riscv32.py` sits alongside.
- The wrapper `./tools/testing/kunit/kunit.py run --arch=riscv` is the expected entry point. [NEEDS VERIFICATION]

**Known build failures:** none found. Data not available: no riscv64 build-failure list was located (KernelCI could not be read).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

SBI is a RISC-V interface. A per-feature comparison against arm64 and amd64 was not researched and is not claimed. The riscv64 matrix is:

| SBI feature | Kernel client | KVM guest exposure | First mainline |
|---|---|---|---|
| Base, legacy v0.1 | yes | yes (V01) | v5.7 (v0.2 base) |
| TIME / IPI / RFENCE | yes | yes | v5.7 |
| HSM | yes | yes | v5.7 |
| SRST | yes | yes | v5.17 |
| PMU | yes | yes | v5.18 |
| DBCN | yes | yes | v6.8 |
| SUSP | yes | yes | v6.8 |
| PMU snapshot | yes | yes | v6.10 |
| STA | yes | yes | Not looked up |
| NACL | host-KVM side only | no | v6.13 |
| FWFT | yes | yes | v6.16 (kernel), v6.18 (KVM) |
| MPXY | mailbox driver | yes | v6.18 (driver), v6.19 (KVM) |
| CPPC | ACPI-only, local definitions | no | v6.9 |
| DBTR | IDs only | no | v6.19 (IDs) |
| SSE | no | no | not merged |

**Functional gaps (cannot do X at all):**
- No SSE client. `asm/sbi.h` has no `SBI_EXT_SSE`, and there is no `drivers/firmware/riscv` directory. The series is at v12 (2026-10-29) on linux-riscv [NEEDS VERIFICATION, mirror only]. SSE needs the SBI v3.0 spec.
- No DBTR consumer. Hardware breakpoints and watchpoints through SBI are not available. The consumer series is at v7 (2026-09-30) [NEEDS VERIFICATION].
- No firmware-identity sysfs (an RFC from 2026-08-28 proposes `/sys/firmware/sbi/{spec_version,impl_id,impl_version}`; no replies seen) [NEEDS VERIFICATION].
- KVM does not expose NACL, DBTR, SSE or CPPC to guests. SSE and DBTR guest support was not confirmed anywhere in the tree.
- No CPPC-over-SBI follow-up series and no SUSP follow-up series were found.
- Together these mean SBI v3.0 enablement is incomplete: FWFT and MPXY are in, SSE and DBTR are not.

**Performance gaps.** No numeric benchmark data (microseconds, cycles, percentages, ops/s) for Linux's SBI usage was found. Commit messages give rationale in words only:
- `dc892fb44322` (Samuel Holland, v6.10): direct IPIs are assumed faster than SBI RFENCE "due to the SBI context switch overhead". When SBI itself is the IPI backend, the RFENCE call stays. No numbers.
- `a8625217a054` (Atish Patra, v6.10): PMU snapshot reads counters from shared memory and starts multiple counters in one call, reducing hpmcounter CSR read traps for a guest. No numbers.
- RISE issue #141 "Benchmarking and Analysis" is open and empty: no methodology, results or comments.
- Data not available: no riscv64 vs arm64 comparison for SBI calls. The web searches for these were refused after the search budget ran out.

**Security hardening.**
- The shadow-stack path is enabled through FWFT: `41213bf2ae6c` (v7.0) lets the kernel create and validate the shadow-stack token during signal delivery and sigreturn. `head.S` sets FWFT `SBI_FWFT_SHADOW_STACK` with the lock flag for secondary harts under `CONFIG_RISCV_USER_CFI`.
- The variadic `sbi_ecall` zeroes `a1` when unused, to avoid leaking kernel register state through the tracepoints (`eb44ccd82991`).
- `hardening.config` exists in `arch/riscv/configs/`; its contents were not read.

**NaN / floating-point semantics:** not applicable to the SBI client.

## 7. CI/CD Infrastructure

**In-tree CI.** None. A `git ls-tree` of the top level at HEAD and a recursive path search found no `.gitlab-ci.yml`, `.github/`, `.kernelci`, `.travis.yml`, `.circleci`, `azure-pipelines`, Jenkinsfile or similar. Top-level dotfiles are only `.clang-format`, `.clippy.toml`, `.cocciconfig`, `.editorconfig`, `.get_maintainer.ignore`, `.gitattributes`, `.gitignore`, `.mailmap`, `.pylintrc` and `.rustfmt.toml`. There is no CI YAML to read.

**Test sources present in the tree (not CI):**
- `tools/testing/selftests/riscv/Makefile` sets `RISCV_SUBTARGETS ?= abi hwprobe mm sigreturn vector cfi`. Directories are abi, cfi, hwprobe, mm, sigreturn, vector. There is no `sbi` subtarget.
- `tools/testing/selftests/kvm/riscv/` has `arch_timer.c`, `ebreak_test.c`, `get-reg-list.c` and `sbi_pmu_test.c`; `tools/testing/selftests/kvm/include/riscv/sbi.h` also exists. `sbi_pmu_test.c` is the only SBI-specific test, covering SBI PMU emulation for guests. Whether it is wired into the KVM selftest Makefile was not verified, and no run of it was verified. [NEEDS VERIFICATION]
- `arch/riscv/kernel/tests/` has `Kconfig.debug`, `kprobes/` and `module_test/`. None exercises SBI.
- `tools/testing/kunit/qemu_configs/riscv.py` can boot a riscv KUnit run under QEMU with OpenSBI.
- No host-side kselftest covers SBI base, HSM, IPI, RFENCE, SRST, DBCN, SUSP, FWFT, SSE or MPXY. In-tree KUnit tests for SBI could not be ruled out because the grep timed out on the blobless clone. [NEEDS VERIFICATION]

**External CI.** Not confirmed: git.kernel.org, lore.kernel.org and [KernelCI](https://dashboard.kernelci.org) were not accessible, and the [syzbot riscv64 dashboard](https://syzkaller.appspot.com/upstream?manager=ci-upstream-riscv64) returned no bug table. LKFT was not checked. The [docs.kernel.org kselftest page](https://docs.kernel.org/dev-tools/kselftest.html) says only generically that test rings run mainline kselftest on stable releases. One known syzbot-found SBI bug exists (`1ff95eb2bebd`, early `sbi_ecall` before mapping, 2024-08-29), which indicates syzbot runs riscv64 at least some of the time [NEEDS VERIFICATION].

**RISE runners.** Runner repos exist (`riscv-runner`, `riscv-runner-sample`, `riscv-runner-sample-staging`, `board-farm`), but no evidence was found that they test Linux kernel SBI code. A commercial offering, [Cloud-V](https://cloud-v.co/services), advertises kernel testing on RISC-V boards via LAVA and KernelCI. This is vendor marketing and unverified.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI definition | Data not available | Data not available | None |
| SBI-specific tests | Not applicable | Not applicable | `sbi_pmu_test.c` (KVM selftest) |
| External build/boot CI | Data not available | Data not available | Not verified |
| Hardware used | Data not available | Data not available | Not identified |

## 8. Distribution and Release Status

No standalone "Linux SBI" binary or package exists in any channel checked on 2026-11-03.
- PyPI `linux-sbi` JSON: HTTP 404.
- RISE wheel builder: 302 to PyPI, then 404.
- [Ubuntu 26.04 (resolute)](https://packages.ubuntu.com/search?keywords=linux-sbi&suite=resolute&searchon=names&section=all): a `linux-sbi` names search returned no results. A search for "Linux SBI" returned 32 amd64 `linux-main-modules-usbio*` packages, none for riscv64 or related to SBI, and the page said some results were not displayed.
- Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=linux%20sbi)): no `linux-sbi`. The page shows the main `linux` kernel package with RISC-V support enabled, and experimental kernel packages for LicheePi 4A and Milk-V Pioneer in the `[unsupported]` repository. No versions were given.
- Debian, Fedora, and the Ubuntu riscv64 kernel image packages (for example `linux-riscv`): not checked. [NEEDS VERIFICATION]
- The project graph database could not be queried (tool not available), so no graph-based Ubuntu 26.04 riscv64 availability was checked.

**What a user must do for a working binary.** SBI support is delivered inside the kernel image. Either use a distro riscv64 kernel (not verified) or build from mainline with the commands in Section 5. A kernel needs SBI firmware to run on. OpenSBI `fw_dynamic` is the default under QEMU (`/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`). Latest non-rc kernel tags in the clone are v7.3, v7.2 and v7.1; the tree is at v7.4-rc1-132. Release provider: distro.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| OpenSBI (runtime-dependency, critical) | Reference SBI firmware the kernel calls for Base, TIME, IPI, RFENCE, HSM, SRST, DBCN, PMU, SUSP, STA, FWFT, NACL, MPXY and DBTR | Builds natively and cross; report color orange | The OpenSBI report says no CI runs SBIUnit tests; boot testing is on contributor machines under QEMU | See OpenSBI report, section 8 | OpenSBI report (project-reports/opensbi.md); open OpenSBI issues #426 (DBTR `trig_count` not validated) and #415 (MPXY attribute range can wrap), both 2026, status not read |
| Linux kernel (runtime-dependency, critical) | The SBI client and KVM SBI emulation (`arch/riscv`, drivers listed in Section 1) | Mainline since 4.15; SBI code builds with `CONFIG_RISCV_SBI` | `sbi_pmu_test.c` KVM selftest; KernelCI/LKFT not checked [NEEDS VERIFICATION] | Mainline, stable and distro kernels | Section 1 maintainers; no SSE client, DBTR IDs only |
| GCC (build-dependency, critical) | Compiles the kernel; minimum 8.1.0 | Report color blue | Not checked | Not checked | GCC report (project-reports/gcc.md); `arch/riscv/Kconfig` gates ISA extensions on `TOOLCHAIN_HAS_*` tests |
| LLVM (build-dependency, optional) | Alternative compiler via `LLVM=1`; minimum 17.0.1 | Report color yellow | LLVM report says riscv64 is not in the required pre-merge CI | LLVM report confirms Ubuntu 26.04 (resolute) packages it | LLVM report (project-reports/llvm.md); lld-version-specific guard `LD_IS_LLD && LLD_VERSION < 180000` in Kconfig |
| GNU binutils (build-dependency, critical) | Assembler and linker; minimum 2.30; ld 2.38/2.39 needed for V and Zb* extension options | Report color blue | The binutils report says build status was not checked | Not checked | binutils report (project-reports/gnu-binutils.md); none identified for SBI |
| GNU make (build-dependency, critical) | Kbuild driver; minimum 4.0 | Data not available: no GNU make riscv64 research was run | Data not available | Data not available | Data not available |
| QEMU (test-dependency, optional) | `qemu-system-riscv64` virt machine with OpenSBI as default firmware; its KVM backend relies on the kernel SBI emulation | Report color yellow | Not independently checked | See QEMU report, section 8 | QEMU report (project-reports/qemu.md); none identified specific to SBI |
| RISC-V SBI specification (indirect, not a package) | Defines the ABI; spec 3.0 behavior is gated in `sbi_init()` | Not applicable | Not applicable | Not applicable | riscv-non-isa [riscv-sbi-doc issues](https://github.com/riscv-non-isa/riscv-sbi-doc/issues); governance not opened [NEEDS VERIFICATION] |

Additional optional build dependencies from `changes.rst`: Rust 1.85.0, bindgen 0.71.1, bash 4.2, Python 3.9.x. Their riscv64 status was not researched.

**Deep-dive.** No JIT, SIMD or crypto in this subsystem. The recursion beyond one level stops at the OpenSBI and QEMU reports. Data not available: the dependencies of GNU make, bash and Python on riscv64 were not researched. The most consequential dependency is OpenSBI: spec-version gating means the kernel feature set tracks what the firmware implements, and two 2026 OpenSBI validation issues (#426, #415) touch DBTR and MPXY, both SBI v3.0 extensions.

## 11. Known Bugs and Active Issues

No open issue-tracker entries with numbers were found for Linux SBI; the kernel has no tracker for this. Open syzbot bugs are unknown (dashboard returned no table) [NEEDS VERIFICATION]. The table lists fixes found in the clone (ID is the commit).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| `61e3d993c8bd` | `smp_call_function_many_cond` warning from `pmu_sbi_ctr_start` | Fixed v6.7 (2023-10-26, Alexandre Ghiti) | Medium | Seen on QEMU virt |
| `a638b0461b58` | Secondary idle-thread stacks overlapped `pt_regs` | Fixed v6.10 (2024-05-23, Sergey Matyukevich, Syntacore) | High | Found in CPU hotplug tests with vector enabled; described as a secondary-boot bug in the SBI HSM era |
| `3908ba2e0b24` | Hotplugged CPU stalled in WFI with a pending reschedule IPI | Fixed v6.11 (2024-07-17, Nick Hu, SiFive) | High | IPI enable came after `workqueue_online_cpu()`; stall lasted until the watchdog fired |
| `7b090e7b910c` | Shutdown failed when `RISCV_SBI_V01` was enabled but firmware lacked SBI v0.1 | Fixed v6.18 (Mayuresh Chitale) | Medium | Regression from `70ddf86d76c1` (sys-off handler switch) |
| `1ff95eb2bebd` | `RISCV_ALTERNATIVE_EARLY`: early `sbi_ecall` before mapping | Fixed 2024-08-29 (Alexandre Ghiti) | High | Found by syzbot |
| `fdb69d401967` | NULL pointer dereference in the KVM SBI v0.1 SEND_IPI handler | Fixed 2026-05-17 | High | Correctness |
| `f643f520c4c6` | PMU overflow IRQ dereferenced `cpu_hw_evt` before checking it | Fixed 2026-08-11 | High | Correctness |
| `c367d3bf721f` | KVM IPI delivery with out-of-order vcpu_id | Fixed 2026-09-17 | Medium | Correctness |
| `41e81f7e3ef9` | KVM HSM hart status error propagation | Fixed 2026-09-14 | Medium | |
| `b3d346838ec6` | KVM NACL hfence entry update order | Fixed 2026-08-26 | Medium | |
| `11d5af151bcb` | MPXY mailbox: validate RPMI notification lengths | Fixed 2026-08-14 | Medium | |
| `f06b670cfd1c` | KVM one-word masks for SBI v0.1 all-harts | Fixed 2026-07-18 | Medium | |
| `6693171c8c54`, `6809da6e9c08` | PMU `BIT_ULL` for u64 overflow masks; available-counter mask stored as bitmap | Fixed 2026-08-18 | Medium | |
| `e24a1418e90b` | PMU driver probe-failure cleanup | Fixed 2026-08-07 | Low | |
| Five KVM fixes, 2025-02-17 | IPI error generation, TIME error generation, hart suspend status check, hart suspend_type use, sleep_type use (Andrew Jones) | Fixed | Medium | |
| `2e7be1629966`, `6aba0cb5bba6` | HFENCE calls treated as NOPs; SFENCE size check (Anup Patel) | Fixed 2025-06-05 | Medium | |
| 2024 PMU fixes | `941a8e9b7a86` legacy counter selection, `16d3b1af0944` standard event availability, `a3f24e83d11d` stale event data, `2840dadf0dde` and `57f7c7dc78cd` preemptible `smp_processor_id()` and `put_cpu()` | Fixed | Medium | First-release versions not checked |
| OpenSBI #426, #415 | DBTR `trig_count` not validated; MPXY attribute range can wrap | Status not read | Unknown | Firmware side; see OpenSBI report |
| riscv-sbi-doc #133, #132, #141, #13, #101, #95, #102, #152 | Spec issues (SXLEN change, CPPC reserved registers, hartid transmission, entry state, misa syscall, type ambiguities, disabling SBI, watchdog) | Open | Unknown | Titles only; none clearly a performance issue. DBTR spec issues #257, #213, #163 also open |

Several FWFT KVM fixes (June to July 2026) and the KVM "Cleanup SBI extension status when disabled" series (merged; `b88cb6998fb7`, `8f9e8f8e3828`) are also in the clone.

**Correctness bugs highlighted:** `a638b0461b58`, `3908ba2e0b24`, `1ff95eb2bebd`, `fdb69d401967`, `f643f520c4c6` and the KVM IPI/HSM/NACL fixes. The 2026 cluster of KVM and PMU fixes indicates active hardening of SBI v3.0 paths, but also that error-handling defects were still being found in 2026.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No lore thread could be read (lore was not accessible), so review objections on specific series are not covered. [NEEDS VERIFICATION]

**Technical blockers.**
- SSE (v12, 2026-10-29): not merged. It has changed hands from Clement Leger (v8) to Zhanpeng Zhang (v9, 2026-05-09), with the series at v10 (9 patches, 2026-09-11) superseded by v12. Review replies from Himanshu Chauhan and Paul Walmsley; no Reviewed-by tags seen. It needs the SBI v3.0 spec and touches arch entry code, a firmware driver, perf and selftests. [NEEDS VERIFICATION, mirrors only]
- DBTR consumer (v7, 2026-09-30, Himanshu Chauhan): 5 patches, 15 files, +2375/-24 at v6; single-stepping and trigger virtualization deferred. Jesse Taube asked that `perf test 15 16 17 18` pass first. [NEEDS VERIFICATION]
- The spec-ratification rule in `patch-acceptance.rst` gates every new extension: merges follow SBI spec progress. The FWFT commit message shows the authors splitting patches that depend on unratified work.

**Organizational blockers.**
- Merge latency can be long: the variadic `sbi_ecall` patch was posted 2025-06-19 and merged 2026-10-05, about 15 months.
- SBI ownership is concentrated in a few vendors (Rivos, Ventana, SiFive), and there is no dedicated MAINTAINERS entry for `sbi.c`.
- RISE tracks SSE (#74, upstream in progress), debug (#85, HW breakpoint, upstream in progress) and KVM SSE (#96) in the Kernel & Virtualization WG, but no RISE-funded Linux SBI client work was identified. RISE's only SBI-related funded work found is firmware-side RP016 (OpenSBI interrupt handling). Per the RISE wiki, the WG becomes a working area under the Platform WG (effective 2026-06-25, led by Sunil V L); the project board (#14) could not be read.
- RISE working-group issues: the "SBI" issue filter returned 27 results (all visible ones authored by luhenry), while a separate read of the first 27 open issues (#135 to #161) found no SBI-titled ones. These are consistent only if the SBI issues are numbered below #135. Issue #128 "KVM Message Proxy virtualization" is listed open although KVM MPXY for guests (`7050f1d79f1c`) is merged in v6.19, so its remaining scope is unclear. [NEEDS VERIFICATION]

**Acceptance probability.** Data not available as a number. Evidence: every SBI extension that reached ratification and had a consumer series has been merged (v0.2 through FWFT and MPXY), and the in-flight series (SSE, DBTR) are being actively revised by named authors. The assessment is that further SBI v3.0 acceptance is likely, with timing set by review bandwidth.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- Optimization-purpose project: no.

**Justification.** The SBI client is mainline and functional on riscv64: [arch/riscv/kernel/sbi.c](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/kernel/sbi.c) probes and gates TIME/IPI/RFENCE, HSM, SRST, DBCN, PMU, SUSP, FWFT, NACL and MPXY, and the KVM SBI emulation is in tree. The tree contains no CI definition for it (no `.github`, `.gitlab-ci.yml` or similar). The only SBI-specific test is the KVM selftest `sbi_pmu_test.c`, and no run of it was verified. KernelCI, LKFT and syzbot riscv64 coverage could not be read (403 and bot blocks), so no build or test CI is confirmed. Distro riscv64 kernel packages were also not checked, so neither the clean-distro yellow floor nor blue can be justified from verified facts. The grade is therefore orange and should be treated as provisional. It is not a statement that SBI support is poor.

**Pending work that could change the grade.** Verification would likely raise the grade.
1. Check [KernelCI](https://dashboard.kernelci.org), LKFT and the [syzbot riscv64 manager](https://syzkaller.appspot.com/upstream?manager=ci-upstream-riscv64) for riscv64 builds and test execution. If they build and run boot or kselftest on riscv64, the grade becomes blue or higher.
2. Check Debian, Ubuntu, Fedora and Arch riscv64 kernel packages for riscv64-specific patches. Unpatched builds would give at least yellow (clean-distro-build).
3. Open SBI work on linux-riscv, all status [NEEDS VERIFICATION]: SSE v12 (2026-10-29), not merged and with no `SBI_EXT_SSE` in the tree; the DBTR consumer series v7 (2026-09-30), with only the IDs merged (5efaf92da436, v6.19); and an RFC for sysfs firmware identity (2026-08-28). These gaps mean SBI v3.0 enablement is incomplete.
4. RISE tracks SSE (#74), debug (#85) and KVM SSE (#96) in the Kernel and Virtualization WG, but this is coordination, not a release channel.
5. The cross-referenced OpenSBI report is orange and the QEMU report is yellow.

## 14. Investment Analysis

Effort figures are the author's estimates, not figures from the research. Existing RISE and community coverage, checked first:
- RISE closed items (treated as done): #119, #97, #95, #92, #91, #90, #80, #71, #70, #69, #67, #55, #47, #43, #38, #33, #30, #18 (system MSI via RPMI/SBI MPXY, KVM PMU/FWFT/debug console/suspend/steal time/nested acceleration, MPXY, FWFT, perf event discovery, PMU snapshot, DBCN, system suspend, basic ACPI). Upstream merge status of each was not verified against lore. [NEEDS VERIFICATION]
- RISE open and in progress: #74 SSE (upstream in progress), #85 native/hosted debug (upstream in progress), #127 KVM nested virtualization (upstream in progress), #96 KVM SSE, #83 KVM debug virtualization, #128 KVM MPXY virtualization, #125 CoVE guest, #123 KVM CoVE host, #122 ACPI FFH Opregion.
- Because RISE and named vendors already own SSE, DBTR and KVM-virtualization authoring, new effort is sized as review, testing and verification, not authoring.

### 14.1 Functional Enablement
- Test and review the SSE series (v12) and the DBTR consumer series (v7) on target silicon and QEMU, and post Tested-by/Reviewed-by. Coordinates with RISE #74 and #85; no authoring effort is sized.
- Move `SBI_EXT_CPPC` and its function IDs from `drivers/acpi/riscv/cppc.c` into `asm/sbi.h` and add a non-ACPI user if needed; small cleanup.
- KVM guest exposure of NACL, DBTR, SSE: tracked by RISE #127, #83, #96; no new sizing.
- Review the firmware-identity sysfs RFC if the product needs it for fleet diagnostics.

### 14.2 Performance Optimization
- No baseline exists. Build an SBI micro-benchmark set (ecall round trip, TIME/IPI/RFENCE vs direct IPI, PMU snapshot, HSM bring-up, KVM-guest SBI exit cost) and publish riscv64 numbers. Coordinate with RISE #141, which is open and empty. The rationale in `dc892fb44322` and `a8625217a054` is stated without numbers, so the benchmark supplies the missing evidence.

### 14.3 CI/CD Infrastructure
- Verify KernelCI, LKFT and syzbot riscv64 coverage from a machine that can reach them; the answer sets the grade (Section 13).
- Add a host-side SBI kselftest (Base probing, HSM, IPI, RFENCE, SRST, DBCN) under `tools/testing/selftests/riscv/`; none exists.
- Run `sbi_pmu_test.c` and the riscv KUnit QEMU config on real riscv64 hardware in CI. No evidence was found of the RISE runners doing this.
- Check distro riscv64 kernel packages (Debian, Ubuntu, Fedora, Arch).

### 14.4 Ecosystem Enablement
Section 10 is omitted: Linux SBI has no dependent package ecosystem. Dependent work sits in the OpenSBI and QEMU reports, which should carry the firmware-side and emulator-side sizing.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Verify KernelCI, LKFT, syzbot riscv64 coverage; check distro riscv64 kernel packages | 2 | Internal kernel/QA team | Critical |
| CI/CD | Host-side SBI kselftest (Base, HSM, IPI, RFENCE, SRST, DBCN) | 6 | Internal kernel team, upstream review | High |
| CI/CD | Run `sbi_pmu_test.c` and riscv KUnit on riscv64 hardware in CI | 3 | Internal QA with RISE runner coordination | High |
| Functional | Test and review SSE v12 and DBTR v7 on target silicon and QEMU | 6 | Internal kernel team with RISE WG (#74, #85) | High |
| Functional | Cleanup of `SBI_EXT_CPPC` definitions into `asm/sbi.h` | 1 | Internal kernel team | Low |
| Performance | SBI micro-benchmark suite and published riscv64 numbers | 4 | Internal performance team with RISE (#141) | Medium |
| Functional | Track KVM NACL/DBTR/SSE guest exposure and RISE #128 scope clarification | 1 | Internal kernel team with RISE WG | Medium |

## 15. References

- [Linux kernel RISC-V arch documentation](https://docs.kernel.org/arch/riscv/index.html)
- [Mainline Linux kernel repository (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [arch/riscv/kernel/sbi.c](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/kernel/sbi.c)
- [linux-riscv patchwork](https://patchwork.kernel.org/project/linux-riscv)
- [linux-riscv mailing list on lore](https://lore.kernel.org/linux-riscv/)
- [docs.kernel.org kselftest documentation](https://docs.kernel.org/dev-tools/kselftest.html)
- [KernelCI dashboard](https://dashboard.kernelci.org)
- [syzbot riscv64 CI manager](https://syzkaller.appspot.com/upstream?manager=ci-upstream-riscv64)
- [riscv-sbi-doc issues](https://github.com/riscv-non-isa/riscv-sbi-doc/issues)
- [SSE v9 cover letter (LWN mirror)](https://lwn.net/ml/all/cover.1778331862.git.zhangzhanpeng.jasper@bytedance.com/)
- [SSE v9 LWN article](https://lwn.net/Articles/1072118/)
- [SSE v9 on ratatoskr](https://ratatoskr.run/linux-riscv/2026/05/8992166/t)
- [SSE v10 on ratatoskr](https://ratatoskr.run/linux-riscv/2026/09/17552447/t)
- [SSE v7 patchew](https://patchew.org/linux/20250908181717.1997461-1-cleger@rivosinc.com)
- [SSE v5 patchew](https://patchew.org/linux/20250715160234.454848-1-cleger@rivosinc.com)
- [SSE v8 on LKML](https://lkml.iu.edu/2511.0/08977.html)
- [DBTR v6 on ratatoskr](https://ratatoskr.run/linux-riscv/2026/08/17358134/t)
- [DBTR v5 on ratatoskr](https://ratatoskr.run/linux-riscv/2026/07/17308503/t)
- [DBTR v4 on ratatoskr](https://ratatoskr.run/linux-riscv/2026/05/16992181/t)
- [DBTR IDs patch link](https://patch.msgid.link/20250710125231.653967-2-hchauhan@ventanamicro.com)
- [RFC: sysfs firmware identity (ratatoskr)](https://ratatoskr.run/lkml/2026/08/17473732)
- [KVM SBI extension status cleanup v3 (ratatoskr)](https://ratatoskr.run/linux-riscv/2026/07/17338242/t)
- [KVM FWFT cleanup v2 (ratatoskr)](https://ratatoskr.run/linux-riscv/2026/07/17216430/t)
- [MPXY definitions patch](https://lore.kernel.org/r/20250818040920.272664-4-apatel@ventanamicro.com)
- [MPXY mailbox driver patch](https://lore.kernel.org/r/20250818040920.272664-8-apatel@ventanamicro.com)
- [FWFT calls patch](https://lore.kernel.org/r/20250523101932.1594077-6-cleger@rivosinc.com)
- [Shadow stack via FWFT patch](https://patch.msgid.link/20251112-v5_user_cfi_series-v23-22-b55691eacf4f@rivosinc.com)
- [Variadic sbi_ecall patch](https://patch.msgid.link/20250619190315.2603194-2-rkrcmar@ventanamicro.com)
- [SBI MPXY/RPMI series on LKML](https://lkml.iu.edu/hypermail/linux/kernel/2502.0/00962.html)
- [SBI v0.2 support, LWN](https://lwn.net/Articles/807731/)
- [SBI v0.2 patchwork](https://lore.kernel.org/patchwork/patch/1119998/)
- [KVM SBI v0.2 v5 thread](https://lore.kernel.org/all/YWBdbCNQdikbhhBq@google.com/T/)
- [KVM SBI v0.2 v3 thread](https://lore.kernel.org/kvm/6615284.qex3tTltCR@diego/t/)
- [Fix KVM SBI implementation version (patchew)](https://patchew.org/linux/20220131164232.295585-1-apatel@ventanamicro.com/)
- [FWFT v5 series (patchwork)](https://patchwork.kernel.org/project/linux-riscv/list/?param=3)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog](https://riseproject.dev/blog/)
- [RISE feed](https://riseproject.dev/feed/)
- [RISE post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [Advancing OpenSBI Interrupt Handling (RISE, RP016)](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE Working Groups move tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [Android 17 on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [How Kairos is charting RISC-V productization](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [RISE December 2024 webinar slides](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Work Groups wiki](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8589492/RISE+Work+Groups)
- [RP016 milestone 1](https://riscv-optee-docs.riseproject.dev/rp016/milestone1)
- [riseproject-dev GitHub repositories](https://github.com/orgs/riseproject-dev/repositories)
- [RISE kernel-and-virtualization-wg](https://github.com/riseproject-dev/kernel-and-virtualization-wg)
- [RISE WG issue 141, Benchmarking and Analysis](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/141)
- [RISE WG monthly meetings](https://github.com/riseproject-dev/kernel-and-virtualization-wg/blob/main/docs/monthly-meetings.md)
- [RISE project board 14](https://github.com/orgs/riseproject-dev/projects/14)
- [Cloud-V services](https://cloud-v.co/services)
- [Ubuntu 26.04 (resolute) package search for Linux SBI](https://packages.ubuntu.com/search?keywords=Linux%20SBI&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=linux%20sbi)
- [Nuclei OpenSBI repo page (v5.7 claim source)](https://gitee.com/Nuclei-Software/opensbi)
- Clone files, read via `git show`: `MAINTAINERS`, `Documentation/arch/riscv/patch-acceptance.rst`, `Documentation/arch/riscv/boot.rst`, `Documentation/process/changes.rst`, `Documentation/kbuild/llvm.rst`, `scripts/min-tool-version.sh`, `arch/riscv/Kconfig`, `arch/riscv/Makefile`, `arch/riscv/kernel/sbi.c`, `arch/riscv/include/asm/sbi.h`, `tools/testing/kunit/qemu_configs/riscv.py`, `tools/testing/selftests/riscv/Makefile`, in the local kernel clone (HEAD 05441d697f7f).
- Cross-referenced reports: project-reports/opensbi.md, project-reports/qemu.md, project-reports/gcc.md, project-reports/gnu-binutils.md, project-reports/llvm.md.