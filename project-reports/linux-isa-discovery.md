---
title: Linux ISA discovery
parent: Project Reports
color: yellow
dependencies:
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
  - name: dtc
    relation: build-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-isa-discovery" %}

# Linux ISA discovery

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux ISA discovery<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux ISA discovery is the set of kernel mechanisms that detect which RISC-V ISA extensions and microarchitectural properties each hart has, and that expose the result to the kernel and to userspace. It is native riscv64 code in mainline Linux. It has no JIT backend and no SIMD dispatch. All paths below are relative to the kernel tree, read at HEAD 05441d697f7f (v7.4-rc1-132, 2026-11-03).

The components are:

- **ISA-string and extension parsing.** `arch/riscv/kernel/cpufeature.c` (1408 lines) holds a `riscv_isa_ext[]` table of 112 entries. It has dependency validators, bundles (Zk, Zkn, Zks, Zvkn, Zvknc, Zvks, Zvksc) and supersets. The kernel reads the device tree properties `riscv,isa` (legacy) and `riscv,isa-base` / `riscv,isa-extensions`. On ACPI systems it reads the RHCT table through `drivers/acpi/riscv/rhct.c`.
- **The riscv_hwprobe(2) syscall.** `arch/riscv/kernel/sys_hwprobe.c` (573 lines) implements it. The vDSO fast path is `arch/riscv/kernel/vdso/hwprobe.c` and `sys_hwprobe.S`. The uapi header defines keys 0 to 16 and the `RISCV_HWPROBE_WHICH_CPUS` flag. Documentation is [hwprobe.rst](https://docs.kernel.org/arch/riscv/hwprobe.html).
- **Alternatives and vendor errata.** `arch/riscv/kernel/alternative.c`, `patch.c`, and `arch/riscv/errata/{andes,mips,sifive,thead}`.
- **Vendor extensions.** `arch/riscv/kernel/vendor_extensions/` covers Andes, MIPS, SiFive and T-Head, with hwprobe glue for MIPS, SiFive and T-Head.
- **Misaligned access.** `traps_misaligned.c` (648 lines) handles detection and emulation. `unaligned_access_speed.c` (405 lines) measures speed, using the assembly probes `copy-unaligned.S` and `vec-copy-unaligned.S`.

**Governance.** No foundation owns this subsystem. It is GPL-2.0 mainline Linux, under the kernel's own process and Linus Torvalds as top-level maintainer. The MAINTAINERS entry "RISC-V ARCHITECTURE" (status Supported, covers `arch/riscv/`) lists:

- Maintainers: Paul Walmsley, Palmer Dabbelt and Albert Ou.
- Reviewer: Alexandre Ghiti.
- List: linux-riscv. Patchwork: [linux-riscv project](https://patchwork.kernel.org/project/linux-riscv/list/).
- Tree: git.kernel.org riscv/linux.git.

There is no separate MAINTAINERS entry for ISA discovery. Process guidance is in [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html).

**Corporate sponsors.** Commit counts by author email domain across `cpufeature.c`, `sys_hwprobe.c`, `unaligned_access_speed.c` and `traps_misaligned.c`:

| Domain | Commits |
|---|---|
| rivosinc.com | 123 |
| ventanamicro.com | 29 |
| sifive.com | 26 |
| kernel.org | 23 |
| linux-foundation.org | 19 |
| microchip.com | 17 |
| linutronix.de | 16 |
| sntech.de | 8 |

Rivos dominates ISA discovery and hwprobe. SiFive, Ventana, Andes, HTEC, VRULL, Linutronix, Qualcomm, ByteDance and Tenstorrent also appear as authors in the findings. RISE has no identified involvement (see Section 14).

**Community culture on new extensions.** There are no formal tiers. [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) sets the policy:

- Maintainers disapprove of churn and prefer well-reviewed, tested code over experimental code.
- New standard extensions are accepted only if the specification is Frozen or Ratified. For UEFI Forum specifications, a published ECR is required.
- Vendor custom extensions are accepted only if officially frozen or ratified, or if implemented in widely available hardware.
- Implementers may keep their own trees for draft or custom extensions.

The stance is conservative, with CI gating through patchwork.

## 2. Port History and Upstreaming Timeline

The riscv64 port is fully upstream, in mainline since Linux 4.15. All ISA discovery code in this report is in mainline. No out-of-tree patch set was identified. Distro-carried patches were not checked.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | Palmer Dabbelt's "RISC-V: User-facing API" is the earliest commit touching `cpufeature.c` (first tag v4.15-rc1; merged 2017-09-26) | [e2c0cdfba7f6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e2c0cdfba7f6) |
| 2018-10-23 | Andreas Schwab, "RISC-V: properly determine hardware caps" (v4.20) | [732e8e4130ff](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=732e8e4130ff) |
| 2020-03-16 | Damien Le Moal (WDC), misaligned load/store handling for M-mode (v5.7) | [956d705dd279](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=956d705dd279) |
| 2021-03-22 | Vincent Chen, alternative mechanism for errata and SiFive alternative ports (v5.13) | [6f4eea90465a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6f4eea90465a) |
| 2022-03-14 | ISA-string parser rework and multi-letter extension framework, Tsukasa OI and Atish Patra (v5.18) | [2a31c54be097](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2a31c54be097), [02d52fbd940a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=02d52fbd940a) |
| 2022-05-11 | Heiko Stuebner, `alternative.c` rework and T-Head memory-type errata (v5.19) | [a35707c3d850](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a35707c3d850) |
| 2022-05-22 (author date) | Unified static key mechanism for ISA extensions. It reached the tree 2022-06-16, so first release is v6.0, not v5.19 | [c360cbec3511](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c360cbec3511) |
| 2023-04-07 | Evan Green (Rivos), riscv_hwprobe syscall (merged 2023-04-18, v6.4) | [ea3de9ce8aa2](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ea3de9ce8aa2) |
| 2023-04-07 | Evan Green, hwprobe vDSO function and data (v6.4) | [aa5af0aa90ba](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=aa5af0aa90ba) |
| 2023-05-15 | Sunil V L (Ventana), ACPI RHCT support in `riscv_fill_hwcap()` (v6.5) | [396c018332a1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=396c018332a1) |
| 2023-07-13 | Conor Dooley, `riscv,isa-extensions` dedicated properties and the `riscv,isa` fallback control (v6.6) | [90700a4fbfaf](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=90700a4fbfaf), [496ea826d1e1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=496ea826d1e1) |
| 2023-10-04 | Clement Leger, misaligned trap handling in S-mode (first tag v6.7-rc1) | [7c83232161f6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7c83232161f6) |
| 2023-11-22 | Andrew Jones (Ventana), `sys_hwprobe.c` split out and which-cpus flag (v6.8) | [e178bf146e4b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e178bf146e4b) |
| 2024-03-08 | Charlie Jenkins (Rivos), compile-time unaligned-speed setting (v6.9) | [f413aae96cda](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f413aae96cda) |
| 2024-07-19 | Vendor-extension detection (v6.11) | Kernel clone, `git log` |
| 2024-08-09 | Evan Green, MISALIGNED_PERF key fix (first tag v6.11-rc4) | [c42e2f076769](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c42e2f076769) |
| 2024-10-17 | Jesse Taube (Rivos), vector misaligned probe (v6.13) | [d1703dc7bc8e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d1703dc7bc8e) |
| 2025-07-24 | Djordje Todorovic (HTEC), MIPS P8700 errata (v6.18) | Kernel clone, `git log` |
| 2026-01-25 | Deepak Gupta (Rivos), dual vDSO selected by Zimop presence (v7.0-rc1) | [ccad8c1336b6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ccad8c1336b6) |
| 2026-08-07 | RVA23 extensions in hwprobe: Zicclsm, then Ziccamoa/Ziccif/Ziccrse/Za64rs (v7.3-rc1) | [3cd63bc30cda](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3cd63bc30cda), [f61959a3a8b5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f61959a3a8b5) |
| 2026-09-20 | B in hwcap and hwprobe; Zic64b (v7.4-rc1) | [fbab8abaac8f](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=fbab8abaac8f), [7493567982b0](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7493567982b0) |
| 2026-10-08 | Jisheng Zhang, early ISA extensions and removal of the `RISCV_ALTERNATIVE` Kconfig option (v7.4-rc1) | [267bb2b528b5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=267bb2b528b5), [b924210f542e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b924210f542e) |
| 2026-10-29 | Linus Torvalds merges the RISC-V pull for the 7.4 merge window | [1b8b67503725](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1b8b67503725) |

**Notes on authorship and tags:**

- 6f4eea90465a ("riscv: Introduce alternative mechanism to apply errata solution", 2021-03-22) is authored by Vincent Chen, vincent.chen@sifive.com, so the affiliation is SiFive.
- The S-mode misaligned-access handling first appears in v6.7-rc1 (`git tag --contains`).
- The which-cpus work is two separate commits: 53b2b22850e1 (the file split, "Move the hwprobe syscall to its own file") and e178bf146e4b (the flag, "hwprobe: Introduce which-cpus flag"), both committed 2023-11-22.

**Key contributors:**

- Rivos: Evan Green, Atish Patra, Charlie Jenkins, Jesse Taube, Clement Leger, Palmer Dabbelt, Alexandre Ghiti, Deepak Gupta.
- Ventana: Andrew Jones, Sunil V L.
- Others: Conor Dooley (Microchip), Heiko Stuebner, Jisheng Zhang, Thomas Weisschuh (Linutronix), Nam Cao (Linutronix), Guodong Xu (Qualcomm and earlier addresses), Andy Chiu (SiFive earlier, Tenstorrent in 2026), Samuel Holland (SiFive).

## 3. Upstream Support Tier

**Formal tier policy:** none. The port is "Supported" in MAINTAINERS, covering `arch/riscv/`.

**Evidence:**

- **In-tree CI:** none. `git ls-tree -r HEAD` filtered for `.gitlab-ci`, `.github/`, `.travis`, `jenkins`, `buildbot` and `.ci/` returned nothing.
- **Patch automation:** [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html) states that automation runs against patchwork. It applies each series to the riscv `for-next`, `fixes` or `master` branch and records the base commit. Series that fail checks are unlikely to be applied. The document does not name the checks, runner or hardware.
- **Release-blocking status:** Data not available. KernelCI, LKFT and syzbot were not accessible.
- **Official binaries:** none from kernel.org, which publishes source only (see Section 8).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream status | Data not available: not researched | Data not available: not researched | Mainline since 4.15, MAINTAINERS status Supported |
| Formal tier policy | Data not available | Data not available | None; patch-acceptance.rst only |
| In-tree CI config | Data not available | Data not available | None (confirmed via `git ls-tree`) |
| ISA discovery mechanism | CPUID [NEEDS VERIFICATION] | ID registers, `arch/arm64/kernel/cpufeature.c` [NEEDS VERIFICATION] | DT/ACPI strings, `cpufeature.c`, hwprobe syscall |
| In-tree kselftests for discovery | Data not available | Data not available | `tools/testing/selftests/riscv/hwprobe/` (hwprobe, cbo, which-cpus) |
| Official binaries | Data not available | Data not available | Distro only |

No comparison against arm64 or x86 was run.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Linux ISA discovery has no JIT backend, no SIMD dispatch and no crypto code. The only vector assembly is the misaligned-access probe `vec-copy-unaligned.S`. The eBPF JIT (`arch/riscv/net`) and vector state management belong to other reports.

| Component | riscv64 implementation | ISA extensions involved | Quality |
|---|---|---|---|
| `riscv_isa_ext[]` parser (`cpufeature.c`) | Exists. 112 table entries with validators for Zicbom, Zicboz, Zicbop, Zic64b, F, D, Zcd, Zcf, Zilsd, Zclsd, Zvfbfwma, Svadu, Smcdeleg, Ssccfg and vector variants | All parsed extensions; bundles Zk, Zkn, Zks, Zvkn, Zvknc, Zvks, Zvksc | Native C, active development |
| DT discovery | `riscv,isa-base` and `riscv,isa-extensions`; legacy `riscv,isa` fallback under `RISCV_ISA_FALLBACK` (default y) | n/a | Native C |
| ACPI discovery | RHCT via `drivers/acpi/riscv/rhct.c` (175 lines), `acpi_get_riscv_isa()`. Vendor extensions are ignored in `riscv,isa` | n/a | Native C |
| hwprobe syscall | `sys_hwprobe.c`; keys 0 to 16; WHICH_CPUS flag | IMA_EXT_0 and IMA_EXT_1 bitmasks (see Section 6) | Native C |
| hwprobe vDSO | `vdso/hwprobe.c` (114 lines), `vdso/sys_hwprobe.S` (19 lines). The vDSO holds a copy of the all-CPUs answers. It answers arbitrary masks only when all harts are homogeneous | Zimop selects a second CFI vDSO | Native C and assembly |
| Alternatives | `alternative.c` (250 lines), `patch.c`. "Early" extension support added in v7.4-rc1 | Svpbmt/Sv48/Sv57 treated as early extensions | Native C |
| Vendor errata | Andes (CMO), MIPS (P8700_PAUSE_OPCODE, P8700_WFI), SiFive (CIP_453, CIP_1200, STARFIVE_JH7100, MAL_9092), T-Head (MAE, CMO, PMU, GHOSTWRITE) | n/a | Native C with `errata_cip_453.S` |
| Vendor extensions | `vendor_extensions/{andes,mips,sifive,thead}.c` | XMIPSEXECTL, XTHEADVECTOR, four SiFive Xsfv* extensions | Native C |
| Misaligned handling | `traps_misaligned.c`, `unaligned_access_speed.c`; Kconfig choices for probe, emulated, slow, efficient | Zicclsm, V | Native C and assembly probes |

**Comparison with amd64 and arm64:** Data not available. This research did not examine the x86 or arm64 equivalents.

**Misaligned-access Kconfig options:**

- Always present: `RISCV_MISALIGNED`, `RISCV_SCALAR_MISALIGNED`, `RISCV_VECTOR_MISALIGNED`.
- `RISCV_SBI_FWFT_DELEGATE_MISALIGNED` depends on `RISCV_SBI` and `NONPORTABLE`.
- The "Unaligned Accesses Support" choice defaults to `RISCV_PROBE_UNALIGNED_ACCESS`. The SLOW and EFFICIENT variants need `NONPORTABLE`.

**Design notes from commit messages:**

- hwprobe exists because ELF_HWCAP had no room for all extensions ([ea3de9ce8aa2](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ea3de9ce8aa2)).
- Value-like keys are valid only if all CPUs in the set agree, otherwise they return -1. Boolean-like keys return the logical AND across the set. WHICH_CPUS reverses the lookup.
- The kernel hard-codes BASE_BEHAVIOR as `IMA` in `hwprobe_one_pair()`. At HEAD it has no RVA23 value.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild and Kconfig with GNU make. There is no cmake or autoconf build for the kernel itself, and the tree has no Dockerfile.

**Build commands:**

```
# GNU toolchain cross build (not spelled out in the docs read) [NEEDS VERIFICATION]
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image

# LLVM, per Documentation/kbuild/llvm.rst
make LLVM=1 ARCH=riscv defconfig
make LLVM=1 ARCH=riscv -j$(nproc)
```

- `llvm.rst` lists riscv as "Supported" with `LLVM=1`.
- A version-suffixed LLVM is selected with `LLVM=-14`, for example.
- `arch/riscv/configs/` has `defconfig`, `32-bit.config`, `64-bit.config`, `hardening.config`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig` and `nommu_virt_defconfig`.
- With `CONFIG_ARCH_RV64I=y` the Makefile passes `-mabi=lp64` and `-melf64lriscv`. `-march` starts at `rv64ima` and appends `fd`, `c` and `v` per `CONFIG_FPU`, `CONFIG_RISCV_ISA_C` and `CONFIG_RISCV_ISA_V`.
- The default image is `Image`.

**Toolchain minimums** (`scripts/min-tool-version.sh` and `Documentation/process/changes.rst`):

| Tool | Minimum | Notes |
|---|---|---|
| GNU C | 8.1.0 | |
| binutils | 2.30 | |
| Clang/LLVM | 17.0.1 | Optional |
| GNU make | 4.0 | |
| bash | 4.2 | |
| Python | 3.9.x | |
| pahole | 1.26 | The prose in `changes.rst` says "v1.22 or later" for `CONFIG_DEBUG_INFO_BTF`. This is an internal contradiction, not resolved |
| Rust (optional) | 1.85.0 | riscv target `riscv64imac-unknown-none-elf` |
| bindgen (optional) | 0.71.1 | |

**Why the riscv-specific versions matter** (`arch/riscv/Kconfig`):

- **Zicsr/Zifencei:** with GNU as 2.36 or newer, `_zicsr_zifencei` is appended to `-march`. These moved out of base I in binutils 2.38 and GCC 12.1.0. With GCC older than 11.3.0 the build instead passes `-Wa,-misa-spec=2.2`.
- **Vector:** needs a compiler accepting `-march=rv64imv`, an assembler with `.option arch`, and lld or GNU ld 2.38 or newer.
- **Zbb, Zba, Zbc, Zbkb:** need compiler support for that `-march` and lld or GNU ld 2.39 or newer.
- **Vector crypto:** needs an assembler accepting `.option arch, +v, +zvkb`.
- **Zabha and Zacas:** need compiler `-march` support only.
- **Dynamic ftrace with LLVM assembler:** needs lld or GNU ld 2.36 or newer (ClangBuiltLinux issue 1817). With GCC it needs `-fpatchable-function-entry=8`.
- **`ARCH_HAS_BROKEN_DWARF5`:** set when the assembler is LLVM older than 18 and the linker is lld older than 18.
- **Landing-pad CFI:** needs a compiler accepting `-march=rv64ima_zicfiss_zicfilp -fcf-protection=full`.

**QEMU usage:** The Zfhmin fix ([248dbaf7770c](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=248dbaf7770c)) was tested on a QEMU VM declaring only zfh and zvfh. Tsukasa OI's parser patch includes a QEMU workaround. No QEMU command line for running the kselftests was found. Data not available.

**Known build failures:** Data not available beyond the Kconfig gating above. No build bug tracker was reached.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**What exists (riscv64):**

- **IMA_EXT_0 bits:** FD, C, V; Zba, Zbb, Zbs, Zbc; Zicboz, Zicbom, Zicbop; scalar crypto (Zbkb, Zbkc, Zbkx, Zknd, Zkne, Zknh, Zksed, Zksh, Zkt); vector crypto (Zvbb, Zvbc, Zvkb, Zvkg, Zvkned, Zvknha, Zvknhb, Zvksed, Zvksh, Zvkt); FP (Zfh, Zfhmin, Zvfh, Zvfhmin, Zfa, Zfbfmin, Zvfbfmin, Zvfbfwma); Zihintntl, Ztso, Zacas, Zicntr, Zicond, Zihintpause, Zihpm; Zve32x/32f/64x/64f/64d; Zimop, Zcmop; Zca, Zcb, Zcd, Zcf; Zawrs, Zaamo, Zalasr, Zalrsc, Zabha; Supm; RV32-only Zilsd and Zclsd; Zicfilp.
- **IMA_EXT_1 bits:** Zicfiss, Zicclsm, Ziccamoa, Ziccif, Ziccrse, Za64rs, B, Zic64b.
- **Performance and size keys:** MISALIGNED_SCALAR_PERF (UNKNOWN, EMULATED, SLOW, FAST, UNSUPPORTED), MISALIGNED_VECTOR_PERF (UNKNOWN, SLOW, FAST, UNSUPPORTED), Zicboz/Zicbom/Zicbop block sizes, HIGHEST_VIRT_ADDRESS, TIME_CSR_FREQ. CPUPERF_0 is deprecated.
- **Vendor keys:** VENDOR_EXT_MIPS_0, THEAD_0 and SIFIVE_0.

**Functional gaps:**

- **No RVA23U64 base behavior.** `KEY_BASE_BEHAVIOR` has only `BASE_BEHAVIOR_IMA`. Patches 9 to 11 of [PATCH v8 00/11](https://patchew.org/linux/20260920-rva23u64-hwprobe-v2-v8-0-5f14bc5c23d3@oss.qualcomm.com/) are open: the ISA bases bitmap, the "isa bases" cpuinfo lines, and the hwprobe RVA23U64 key. Userspace must test each mandatory extension itself. The Zfhmin fix commit message names snapd installing core26 on riscv64 as an affected conformance check.
- **Vector availability.** Andy Chiu's v2 series to export vector availability, with a KEY_EXT_ENABLED selftest, is not in the tree [NEEDS VERIFICATION]. Links: [patch](https://ratatoskr.run/linux-doc/2026/07/17316566), [selftest](https://ratatoskr.run/linux-kselftest/2026/07/17316572).
- **Misaligned emulation.** Linux cannot emulate misaligned vector accesses or KVM guest accesses. Firmware delegation of misaligned exceptions via SBI FWFT is gated behind `RISCV_SBI_FWFT_DELEGATE_MISALIGNED`, which depends on `NONPORTABLE`.
- **Virtualization.** WARL-based discovery hinders virtualization. This was a topic at the RISC-V microconference at Linux Plumbers 2025 ([session](https://lpc.events/event/19/sessions/226/)). Radim Krcmar (Ventana) proposed "Declaring WARL on the ISA string". How the kernel should handle RVA profiles was also listed as open.
- **Zilsd and Zclsd.** Their hwprobe exposure is RV32-only. A December 2025 parsing change was seen only in a mirror snippet [NEEDS VERIFICATION].
- **Dropped CI-mirror PR.** linux-riscv/linux-riscv PR #383 (Zicond, Zam, Zacas, Ztso hwprobe parsing) was CLOSED, not merged in that form, because at least one patch expired. The direct fetch failed, so this rests on a search snippet [NEEDS VERIFICATION].

**Performance gaps:** Not applicable in the SIMD sense, since this subsystem has no SIMD dispatch. Related measured costs are in Section 11 (misaligned probe cost). A comparison with arm64 and amd64 was not run. Data not available.

**Security hardening:** The CFI work added a second vDSO with shadow-stack instructions, selected at boot depending on whether the CPU implements Zimop ([ccad8c1336b6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ccad8c1336b6)). Hardening gaps versus arm64 and amd64: Data not available.

**NaN and floating-point semantics:** No NaN issue was found. The closest item is that Zfh implies Zfhmin and Zvfh implies Zvfhmin. The kernel previously did not report the implied bits ([248dbaf7770c](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=248dbaf7770c), v7.3-rc3).

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Userspace discovery syscall | Data not available | Data not available | riscv_hwprobe with vDSO fast path (v6.4) |
| Profile-level query | Data not available | Data not available | Missing (RVA23U64 patches 9 to 11 open) |
| Misaligned vector or KVM-guest emulation | Data not available | Data not available | Missing |
| ACPI-based discovery | Data not available | Data not available | RHCT (v6.5) |

## 7. CI/CD Infrastructure

**In-tree CI YAML:** none exists. `git ls-tree -r HEAD` found no `.gitlab-ci`, `.github/`, `.travis`, jenkins, buildbot or `.ci/` entries. MAINTAINERS, `patch-acceptance.rst`, the riscv selftest Makefile and README, and `arch/riscv/kernel/tests/Kconfig.debug` contain no CI definition.

**Tests in tree:**

- **Kselftest:** `tools/testing/selftests/riscv/hwprobe/` builds `hwprobe`, `cbo` and `which-cpus`. The subtargets are `abi hwprobe mm sigreturn vector cfi`, built only when `ARCH=riscv`. Run with `make TARGETS=riscv kselftest`.
- **KUnit:** `arch/riscv/kernel/tests/Kconfig.debug` defines only `RISCV_MODULE_LINKING_KUNIT` and `RISCV_KPROBES_KUNIT`. No KUnit tests for cpufeature, alternatives or errata were found.
- **Patchwork automation:** documented in [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html). I could not confirm it runs the hwprobe selftests [NEEDS VERIFICATION].

**External services:** patchwork.kernel.org, dashboard.kernelci.org, lore.kernel.org and git.kernel.org were not accessible. KernelCI, LKFT and syzbot were not reached, so whether they run `riscv/hwprobe` on riscv64 hardware or QEMU is unknown [NEEDS VERIFICATION]. A web search found no ISA-discovery-specific CI.

**RISE runners:** none used for this subsystem. The RISE posts show RISE RISC-V runners used for conda-forge, Kairos and Python/PyTorch builds. The `riscv-runner` repository in `riseproject-dev` was visible but its use for kernel work was not examined.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | Data not available | Data not available | None |
| Patch-level automation | Data not available | Data not available | Patchwork checks (apply/build level; checks unnamed) |
| Discovery kselftests | Data not available | Data not available | hwprobe, cbo, which-cpus; CI execution unconfirmed |
| KUnit for discovery | Data not available | Data not available | None found |
| Hardware used | Data not available | Data not available | Data not available |

## 8. Distribution and Release Status

- **Mainline:** source only. The latest tags are v7.4-rc1 (2026-11-01) and v7.3 (2026-10-18, latest stable mainline release).
- **PyPI:** `linux-isa-discovery` returned HTTP 404 at [pypi.org](https://pypi.org/pypi/linux-isa-discovery/json). No wheels.
- **RISE wheel builder:** the GitLab package index redirected to PyPI, which returned 404. The package is absent, and the builder lists 75 wheels, none of them this project.
- **Ubuntu 26.04 (resolute):** the Launchpad API shows riscv64 `linux-image-generic` 7.0.0-42.42.1 (Published in Updates and Security) and 7.0.0-43.43.1 (Published in Proposed). The ISA discovery code is built into this kernel. The packages.ubuntu.com search was not accessible, so that check is unverified.
- **Debian, Fedora, Arch, openSUSE:** Data not available. Not searched.
- **Package-graph queries:** not run.

**Version lag.** Ubuntu 26.04 is on a 7.0 kernel, behind mainline v7.3. The RVA23-related hwprobe exposures have these first tags per the clone:

- v7.3-rc1: Zicclsm, Ziccamoa/Ziccif/Ziccrse/Za64rs.
- v7.4-rc1: B, Zic64b.
- v7.3-rc3: Zfhmin/Zvfhmin implied reporting, and the `hwprobe_one_pair()` initialization fix (tagged Cc stable).

Unless Ubuntu backports them, a 7.0-based distro kernel would not report these bits. Distro patch status was not checked, so this is an inference.

**What a user must do:** install a distro riscv64 kernel (for example Ubuntu 26.04 `linux-image-generic`) or build a mainline kernel with the commands in Section 5. Userspace consumers include Go `x/sys/cpu`, which tries riscv_hwprobe first and falls back to hwcap and requires kernel 6.4 or later ([source](https://sources.debian.org/src/golang-golang-x-sys/0.38.0-1/cpu/cpu_linux_riscv64.go)), and [simdutf](https://github.com/simdutf/simdutf/commit/645017246112c199a3530a22ffe0402837f3b8a2).

## 9. Dependencies

Dependencies are other kernel subsystems, firmware and toolchain. Sibling subsystem reports are excluded.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | build-dependency, critical. Minimum 8.1.0. Gates Zbb, Zba, Zbc, Zbkb, Zabha, Zacas and CFI via `-march` support | See project report (color: blue) | See project report | See project report | See project report |
| LLVM | build-dependency, optional. Clang/LLVM 17.0.1 minimum. LLD handled in Kconfig, with an `LLD < 180000` dependency at `arch/riscv/Kconfig:259` | See project report (color: yellow) | See project report | See project report | See project report |
| GNU binutils | build-dependency, critical. Minimum 2.30. Vector needs ld 2.38 or newer; Zbb/Zba need 2.39 or newer | See project report (color: blue) | See project report | See project report | See project report |
| GNU make | build-dependency, critical. Minimum 4.0. Drives Kbuild | Data not available: no project report supplied | Data not available | Data not available | Data not available |
| dtc | build-dependency, critical. Device trees carry the `riscv,isa-extensions` properties parsed by `cpufeature.c` | Data not available: no project report exists, though `projects.yml` lists it | Data not available | Data not available | Data not available |
| OpenSBI | runtime-dependency, critical. Misaligned-exception delegation via SBI FWFT: `sbi_fwft_set(SBI_FWFT_MISALIGNED_EXC_DELEG, 1, 0)` in `traps_misaligned.c` | See project report (color: orange) | See project report | See project report | See project report |
| QEMU | test-dependency, optional. Common platform for exercising `riscv,isa` and hwprobe | See project report (color: yellow) | See project report | See project report | See project report |

The project reports are `project-reports/gcc.md`, `llvm.md`, `gnu-binutils.md`, `opensbi.md` and `qemu.md`. glibc is a consumer, not a dependency.

**Indirect and in-kernel dependencies:**

| Dependency | Role | State |
|---|---|---|
| Linux core device tree (`of_property_read_string`) | `cpufeature.c` parses `riscv,isa` and `riscv,isa-extensions` | Mainline since 4.15; no blockers found |
| Linux ACPI RHCT | `acpi_get_table(ACPI_SIG_RHCT)` and `acpi_get_riscv_isa()` | Present at HEAD; test status [NEEDS VERIFICATION] |
| `arch/riscv/errata` | Feeds alternatives patching. `traps_misaligned.c` special-cases T-Head (`boot_vendorid == THEAD_VENDOR_ID`, archid 0 on DT systems) | Present; test status [NEEDS VERIFICATION] |

**Deep-dive, toolchain.** GNU binutils and GCC gate ISA-extension code in the kernel build through `TOOLCHAIN_HAS_*` and `AS_HAS_OPTION_ARCH`. Hardware reporting of an extension is independent of whether the toolchain supports it, so a kernel built with an older toolchain still reports the extension. Whether this affects any shipped kernel was not examined.

**Deep-dive, OpenSBI.** This is the only runtime firmware dependency in the findings. The grade for OpenSBI is orange. Misaligned delegation is `NONPORTABLE`-gated because Linux cannot emulate vector or guest accesses ([b69bcb13ed70](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b69bcb13ed70)).

**Items not done:** KernelCI, LKFT, LTP and syzbot coverage were not checked. The Ubuntu package names and graph hasDependency chains were not queried.

## 11. Known Bugs and Active Issues

The kernel has no GitHub-style issue numbers. Each bug is identified by its fix commit. Reports are linked where the commits carry them. Severity is my assessment. The list comes from `Fixes:` and `Closes:` history in the clone, so it covers only bugs that already have a fix. lore.kernel.org was unreachable, so open threads could not be enumerated.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| 5d15d2ad36b0 / 7e14e42edfaa / 994dad686e75 | Stale vDSO data for `MISALIGNED_VECTOR_PERF` | Fixed v6.18 (Cc stable); reverted v7.3; ordering fix v7.2 | High (correctness) | [Report by Tsukasa OI](https://lore.kernel.org/linux-riscv/760d637b-b13b-4518-b6bf-883d55d44e7f@irq.a4lg.com/). The async vector probe could finish after the vDSO data was populated. Fix 994dad686e75 (Rui Qi, ByteDance, Cc stable) moves the probe to `fs_initcall_sync` |
| aad60bdd0b5a / d585018a9258 | `fast_unaligned_access_speed_key` never initialized | Fixed v7.1 and v7.2 | Medium | [Report by Michael Neuling](https://lore.kernel.org/linux-riscv/CAEjGV6y0=bSLp_wrS0uHFj1S2TCRtz4GKzaU5O-L1VV-EL7Nnw@mail.gmail.com/). Regression from 6455c6c11827. The second variant covers `unaligned_scalar_speed=fast` |
| f51fed61eea0 | Oops from freed `__init` code in the vector probe kthread | Fixed v7.2; superseded by 34c9cfcde29b (v7.3) | High | [Report](https://lore.kernel.org/linux-riscv/20260612-vec_unaligned_drop_init-v1-1-df969210ae34@oss.tenstorrent.com/). Instruction page fault on a Tenstorrent Blackhole |
| d0fc6fab2046 | Wrong cached hwprobe values on the vDSO fast path | Fixed v7.3-rc3 (Cc stable) | High (correctness) | `complete_hwprobe_vdso_data()` reused one `pair` across keys without zeroing; vendor keys such as T-Head inherited stale bits. Fixes a5ea53da65c5 |
| 5caae1deee89 | Non-deterministic `riscv_hwprobe` from uninitialized read in `hwprobe_get_cpus()` | Fixed v7.2-rc4 | High (correctness) | Systems with more than 8 CPUs and an empty mask. Introduced by e178bf146e4b |
| b69bcb13ed70 | Misaligned delegation via SBI FWFT regressed vector and KVM guests | Fixed v7.1 by gating behind a `NONPORTABLE` Kconfig option | High | Standing gap: Linux cannot emulate misaligned vector or guest accesses |
| 4d2b03699460 | MIPS P8700 errata applied unconditionally (`&&` vs `&`) | Fixed v7.1 | Medium | All errata patches applied if any one was detected |
| 8632180daf73 | Zk bundle omitted Zknh | Fixed v6.19 | Low | |
| d3e0634787a2 | Alternatives patching skipped the CFI-enabled vDSO | Fixed v7.2 | Medium | |
| ad6dcfa02376 | LTO removed all vDSO functions including `__vdso_riscv_hwprobe` | Fixed (2026-07-01) | Medium | Release tag not captured [NEEDS VERIFICATION] |
| b7776a802f2f | Uninitialized variable in `hwprobe_arch_id()` | Fixed (2025-10-18) | Medium | Release tag not captured [NEEDS VERIFICATION] |
| 248dbaf7770c | Zfh did not report Zfhmin; Zvfh did not report Zvfhmin | Fixed v7.3-rc3 | Medium | Broke userspace RVA23 conformance checks |

**Correctness bugs** are the five bugs marked "(correctness)" above plus the stale-vDSO race: three return wrong or non-deterministic results from the hwprobe API, and the Zfhmin item is a reporting error. All are fixed in mainline.

**Open performance and design issues:**

- **Misaligned-access probe boot cost.** The probe takes about 0.06 s per CPU. Run serially it added 3.8 s to boot on a 64-core system (commit 55e0bf49a0d0, first tag v6.10). It now runs in parallel.
- **CPU hot-add re-probe.** On a VisionFive 2, CPU bring-up dropped from 26 ms to 0.8 ms after commit 319fafd9a374 (v7.2).
- **Scalar probe window.** The 8,000,000 ns window equals 2 jiffies on the riscv defconfig. The commit says it is "excessive for the CPUs I have" and should probably be reduced. That reduction has not been done.
- **WARL discovery and RVA profiles:** see Section 6.
- **RISE wiki statement.** The wiki page on profile- and extension-optimized distros says "What is completely missing is discovery". It is a 2023-era statement and may be stale [NEEDS VERIFICATION]. [Source](https://wiki.riseproject.dev/display/HOME/Profile-+and+Extension-+Optimized+Distros).

**Benchmark data:**

| Operation (Nezha D1) | Time per call |
|---|---|
| `open()`+`read()`+`close()` of `/sys/kernel/cpu_byteorder` | 3.8 us |
| `access()` of the same path | 1.3 us |
| `riscv_hwprobe()`, vDSO plus syscall fallback | 0.0094 us |
| `riscv_hwprobe()`, vDSO only | 0.0091 us |

Source: Evan Green's merge commit eb04e72b345b (2023-04-18). Each operation ran 100000 times. Sysfs cost scales with the number of keys; hwprobe cost does not.

Synchronous vector probe (commit 34c9cfcde29b, v7.3): boot time was 0.464474 s with the kthread and 0.457991 s without. The commit says the earlier regression came from serial probing.

User-copy bandwidth change when software alignment code is skipped (Andy Chiu, Tenstorrent, commit b94cec5761d2, v7.3):

| Case | Platform | Write | Read |
|---|---|---|---|
| Misaligned, 512 B | K3 | +6.19% | +3.43% |
| Misaligned, 512 B | Ascalon | +10.0% | +11.4% |
| Aligned, 512 B | K3 | +1.69% | +0.90% |
| Aligned, 512 B | Ascalon | +1.25% | +3.32% |

Follow-up 30514aa420fd makes this a runtime static-key switch and reports "up to 11.4%". It is on HEAD but not in a release tag.

**Open series:**

- RVA23U64 patches 9 to 11 (see Section 12).
- Andy Chiu v2 vector-availability series (see Section 6).
- Zilsd/Zclsd parsing, seen only in a mirror snippet [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

**Stated objections:** none found targeting riscv64 ISA discovery as such. lore.kernel.org review threads were not accessible, so review comments on the open series were not read.

**Technical blockers:**

- RVA23U64 base behavior (patches 9 to 11 of [PATCH v8 00/11](https://patchew.org/linux/20260920-rva23u64-hwprobe-v2-v8-0-5f14bc5c23d3@oss.qualcomm.com/)) is unmerged.
  - The series has gone through nine postings: RFC v1 (Feb 2026, 11 patches), then v2 to v8, with 10 to 17 patches along the way.
  - v7 moved init to arch_initcall so the vDSO snapshot sees the bases.
  - Conor Dooley acked the dt-bindings and co-developed patches 9 to 11.
  - The clone shows B (patch 1) and Zic64b (patch 4) as v8 commits. The status of the other patches in the series is not established.
  - The ratatoskr.run mirror links are third-party [NEEDS VERIFICATION] against lore.kernel.org.
- Linux cannot emulate misaligned vector or KVM-guest accesses (Section 6).
- WARL-based discovery conflicts with virtualization performance (Section 6).
- Handling of RVA profiles in the kernel is open (Section 6).

**Organizational blockers:**

- The acceptance policy requires Frozen or Ratified specs, or widely available hardware for vendor extensions ([patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html)).
- The same document states that a failing patchwork check makes acceptance unlikely, but the checks are unnamed.
- The subsystem is mostly driven by a small number of employers (Rivos is the largest contributor by commit count).
- The maintainer Paul Walmsley applied nearly every 2026 commit in the findings.

**Acceptance probability:** not applicable for the port (already upstream). For the open RVA23U64 patches, no maintainer objection was found, but review threads were not read. I give no numeric probability.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification:** ISA discovery (cpufeature.c, hwprobe including the vDSO, ACPI RHCT, alternatives, errata, misaligned handling) is native mainline riscv64 code since 4.15 and is the active RVA23 work area. No CI config lives in the tree (confirmed via `git ls-tree`). The only documented upstream automation is the patchwork series check in [patch-acceptance.rst](https://docs.kernel.org/arch/riscv/patch-acceptance.html), which is build/apply-level evidence. I could not confirm it runs the riscv/hwprobe kselftests, and KernelCI, LKFT and syzbot were unreachable. Kernel.org publishes source only, so the consumable riscv64 release comes from distros (for example Ubuntu 26.04 linux-image-generic 7.0.0-42.42.1). Distro patch status was not checked, so the floor-to-orange alternative cannot be excluded. The subsystem is not optimization-purpose, so there is no optimization cap.

**Pending work that could change the grade:**

- The grade would move to blue if the riscv/hwprobe kselftests are confirmed to run on riscv64 in patchwork, KernelCI or LKFT.
- It would move to orange if distro kernels carry riscv64-specific patches and the CI claim cannot be substantiated.
- [PATCH v8 00/11 riscv: hwprobe: Expose RVA23U64 base behavior](https://patchew.org/linux/20260920-rva23u64-hwprobe-v2-v8-0-5f14bc5c23d3@oss.qualcomm.com/) (Guodong Xu, Qualcomm) is partly merged. Patches 9 to 11 are still open.
- Andy Chiu's v2 vector-availability series is unmerged [NEEDS VERIFICATION].
- Open design gaps: no misaligned vector or KVM-guest emulation, and WARL-based discovery hinders virtualization (LPC 2025).
- No RISE-funded work was found.

## 14. Investment Analysis

**What RISE has already done or funded:** nothing identified for this subsystem.

- **Sources checked:**
  - The [RISE blog feed](https://riseproject.dev/feed/), which holds only the 11 most recent posts (2026-07-07 to 2026-10-30).
  - The Python wheel builder list (75 packages).
  - 12 of the 70 `riseproject-dev` repositories. The other 58 are unlisted [NEEDS VERIFICATION].
- **The 2024 RISE deck** lists only generic upstream-kernel items: AIA, ACPI LPI/CPPC, IOMMU, SBI v2.0, KVM, and SBI v3.0 and CBQRI as next steps.
- **Loose match:** the 2026-07-16 post [Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/) mentions SBI firmware feature discovery.
- **Unchecked:** whether `riseproject-dev/linux` carries ISA-discovery patches, and the `kernel-and-virtualization-wg` repository [NEEDS VERIFICATION].
- **Rivos authors:** Rivos is a RISE member, but nothing ties its ISA-discovery commits to RISE funding, so I make no such claim.

All effort figures below are planning estimates, not sourced findings.

### 14.1 Functional Enablement

- **RVA23U64 base behavior.** Review, test and help land patches 9 to 11 (ISA bases bitmap, cpuinfo lines, hwprobe key). Upstream authors already exist (Qualcomm, with Conor Dooley's co-development), so the work is review and test on hardware.
- **Vector availability export.** Drive Andy Chiu's v2 series and the KEY_EXT_ENABLED selftest to merge.
- **Misaligned handling.** Vector and KVM-guest misaligned emulation is an open design gap and the largest functional item. It needs a design decision with the maintainers.
- **WARL declaration.** Work on the proposal to declare WARL in the ISA string (Radim Krcmar, Ventana) for virtualization.
- **Distro backport audit.** Check which discovery fixes (for example d0fc6fab2046, 5caae1deee89, 994dad686e75) and RVA23 hwprobe bits are in distro kernels.

### 14.2 Performance Optimization

- **Reduce the scalar probe window.** The 8 ms window is acknowledged as excessive.
- **Measure boot-time and hot-add cost** on current hardware, since findings cover only a few platforms (Nezha D1, VisionFive 2, K3, Ascalon).
- **Platform coverage.** There is no SIMD work in this subsystem.

### 14.3 CI/CD Infrastructure

- **Run the hwprobe kselftests (hwprobe, cbo, which-cpus) on riscv64 in KernelCI, LKFT or RISE runners** and publish the results. This is the step that would move the grade to blue.
- **Add KUnit coverage for cpufeature, alternatives and errata,** since none exists.
- **Document what the patchwork checks execute.**

### 14.4 Ecosystem Enablement

There is no dependent package ecosystem. Userspace consumers (Go x/sys/cpu, simdutf, snapd) depend on hwprobe semantics. The work is to keep the ABI stable and to give userspace a single RVA23 query once the open patches land.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and test RVA23U64 patches 9 to 11 on RVA23 hardware | 3-5 | Upstream kernel team | High |
| Functional | Drive vector-availability series and KEY_EXT_ENABLED selftest to merge | 2-4 | Upstream kernel team | Medium |
| Functional | Design and implement misaligned vector and KVM-guest emulation or an alternative approach | 12-24 | Upstream kernel team with virtualization specialists | Medium |
| Functional | WARL declaration for virtualization | 6-10 | Upstream kernel team with spec group | Medium |
| Functional | Audit distro kernels for hwprobe/RVA23 backports and fixes | 2-3 | Distro liaison | High |
| Performance | Shorten scalar misaligned probe window; validate on current hardware | 2-3 | Upstream kernel team | Low |
| CI/CD | Run riscv/hwprobe kselftests on riscv64 in KernelCI, LKFT or RISE runners | 4-8 | CI infrastructure | Critical |
| CI/CD | KUnit tests for cpufeature, alternatives, errata | 4-6 | Upstream kernel team | Medium |
| Ecosystem | Track userspace consumers for hwprobe ABI regressions | 1-2 | Ecosystem team | Low |

## 15. References

- [hwprobe documentation](https://docs.kernel.org/arch/riscv/hwprobe.html)
- [arch/riscv patch acceptance guidelines](https://docs.kernel.org/arch/riscv/patch-acceptance.html)
- [Patchwork linux-riscv](https://patchwork.kernel.org/project/linux-riscv/list/)
- [Linux kernel mainline repository](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- Commits: [e2c0cdfba7f6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e2c0cdfba7f6), [732e8e4130ff](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=732e8e4130ff), [956d705dd279](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=956d705dd279), [6f4eea90465a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6f4eea90465a), [2a31c54be097](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2a31c54be097), [02d52fbd940a](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=02d52fbd940a), [a35707c3d850](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a35707c3d850), [c360cbec3511](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c360cbec3511), [ea3de9ce8aa2](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ea3de9ce8aa2), [aa5af0aa90ba](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=aa5af0aa90ba), [396c018332a1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=396c018332a1), [90700a4fbfaf](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=90700a4fbfaf), [496ea826d1e1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=496ea826d1e1), [7c83232161f6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7c83232161f6), [e178bf146e4b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e178bf146e4b), [f413aae96cda](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f413aae96cda), [c42e2f076769](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c42e2f076769), [d1703dc7bc8e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d1703dc7bc8e), [ccad8c1336b6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ccad8c1336b6), [3cd63bc30cda](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3cd63bc30cda), [f61959a3a8b5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f61959a3a8b5), [248dbaf7770c](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=248dbaf7770c), [fbab8abaac8f](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=fbab8abaac8f), [7493567982b0](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=7493567982b0), [267bb2b528b5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=267bb2b528b5), [b924210f542e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b924210f542e), [b69bcb13ed70](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b69bcb13ed70), [1b8b67503725](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1b8b67503725)
- [PATCH v8 00/11 riscv: hwprobe: Expose RVA23U64 base behavior (v8)](https://patchew.org/linux/20260920-rva23u64-hwprobe-v2-v8-0-5f14bc5c23d3@oss.qualcomm.com/)
- [Same series, v4](https://lkml.rescloud.iu.edu/hypermail/linux/kernel/2606.1/09845.html), [v3](https://patchew.org/linux/20260603-rva23u64-hwprobe-v2-v3-0-5529a7b28384@gmail.com/), [v2](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091069.html), [v5](https://ratatoskr.run/linux-riscv/2026/07/17198983/t), [v6](https://ratatoskr.run/linux-devicetree/2026/08/17405038/t), [RFC v1](https://ratatoskr.run/linux-riscv/2026/02/3403981/t)
- [Andy Chiu vector availability patch](https://ratatoskr.run/linux-doc/2026/07/17316566) and [selftest](https://ratatoskr.run/linux-kselftest/2026/07/17316572)
- [Mark Harris hwprobe_get_cpus patch](https://ratatoskr.run/linux-riscv/2026/07/17254286/t)
- [linux-riscv/linux-riscv PR #383](https://github.com/linux-riscv/linux-riscv/pull/383)
- [Zilsd/Zclsd mirror log](https://git.radix-linux.su/kernel/linux.git/log/arch/riscv/include/asm/hwcap.h?h=v6.19.11)
- [Atish Patra, Provide a framework for RISC-V ISA extensions (LWN)](https://lwn.net/Articles/884439)
- [Clement Leger, report more ISA extensions through hwprobe, v1](https://lkml.iu.edu/hypermail/linux/kernel/2310.1/04352.html), [v3](https://lkml.iu.edu/hypermail/linux/kernel/2311.0/05523.html), [LWN](https://lwn.net/Articles/947422)
- [Tsukasa OI stale vDSO report](https://lore.kernel.org/linux-riscv/760d637b-b13b-4518-b6bf-883d55d44e7f@irq.a4lg.com/)
- [Michael Neuling fast_unaligned_access_speed_key report](https://lore.kernel.org/linux-riscv/CAEjGV6y0=bSLp_wrS0uHFj1S2TCRtz4GKzaU5O-L1VV-EL7Nnw@mail.gmail.com/)
- [Tenstorrent vector probe `__init` oops report](https://lore.kernel.org/linux-riscv/20260612-vec_unaligned_drop_init-v1-1-df969210ae34@oss.tenstorrent.com/)
- [Linux Plumbers 2025 RISC-V microconference session](https://lpc.events/event/19/sessions/226/)
- [RISE wiki, Profile- and Extension-Optimized Distros](https://wiki.riseproject.dev/display/HOME/Profile-+and+Extension-+Optimized+Distros)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE: Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [PyPI JSON lookup for linux-isa-discovery (404)](https://pypi.org/pypi/linux-isa-discovery/json)
- [Go x/sys/cpu riscv64 source](https://sources.debian.org/src/golang-golang-x-sys/0.38.0-1/cpu/cpu_linux_riscv64.go)
- [simdutf hwprobe commit](https://github.com/simdutf/simdutf/commit/645017246112c199a3530a22ffe0402837f3b8a2)
- [kernelnewbies, Linux 6.4](https://kernelnewbies.org/Linux_6.4)
- [RISE homepage](https://riseproject.dev)
- [Cloud-V RISC-V CI/CD](https://prod.cloud-v.co/risc-v-cicd)
- [GitLab runner riscv64 issue](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27562)