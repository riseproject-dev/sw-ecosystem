---
title: OpenSBI
parent: Project Reports
color: orange
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
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: dtc
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="opensbi" %}

# OpenSBI

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for OpenSBI<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenSBI is the reference implementation of the RISC-V Supervisor Binary Interface (SBI) for M-mode firmware. Upstream is [riscv-software-src/opensbi](https://github.com/riscv-software-src/opensbi), which is also reachable as github.com/riscv/opensbi. The in-tree version at commit `131bda9` (2026-10-23) is 1.9, and `SBI_ECALL_VERSION` is 3.0.

OpenSBI is RISC-V-native. There is no `arch/` directory and no non-RISC-V code. Architecture code lives in `lib/sbi`, `include/sbi`, `firmware`, `lib/utils` and `platform`. The firmware is freestanding with no libc. It ships three firmware flavors: `fw_dynamic`, `fw_jump` and `fw_payload`. QEMU virt and Spike use it, and U-Boot SPL or the Linux kernel consume it via those images.

**Role for Linux and Android on RISC-V.** OpenSBI supplies the M-mode SBI services that Linux and KVM on RISC-V need: HSM for SMP bring-up, kexec and hotplug, plus IPI, TIME, RFENCE, DBCN and SUSP. Its HFENCE and H-extension support underpins KVM. Nothing in the repository is Android-specific. The [RISE Android 17 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) states that its boot chain is U-Boot and OpenSBI.

**Governance.**
- No formal foundation. The repository sits in the `riscv-software-src` GitHub organization, which is community software and not a RISC-V International technical project with its own charter. The README lists copyright for Western Digital (2019) and RISC-V International (2023). The SBI specification is a separate RISC-V International project, and OpenSBI is its reference M-mode implementation.
- Maintainer-merge model. There is no MAINTAINERS, OWNERS, CODEOWNERS or SUPPORT.md file, and git history shows none was ever added. `docs/contributing.md` is the only process document.
- Anup Patel is effectively the only maintainer. He is committer on 2209 of about 2257 commits since 2018, on 1085 of 1085 since 2023-01-01, and on 546 of the 550 commits in the last two years. His employer changed over time: Western Digital (2018 to about 2021), Ventana Micro Systems (about 2021 to late 2025), and Qualcomm from about December 2025. Atish Patra was an early co-maintainer, but his last commit as committer was 2019-04-03.
- Process: patches go by email to `opensbi@lists.infradead.org` with `git send-email`, a DCO `Signed-off-by` and Linux coding style. A bot ([repo-lockdown.yml](https://github.com/riscv-software-src/opensbi/tree/master/.github/workflows)) comments on, locks and closes any GitHub PR and redirects the author to the mailing list. Maintainers cannot merge their own PRs.
- License: BSD-2-Clause with SPDX tags. The vendored libfdt is GPL-2.0+ or BSD-2-Clause, used under BSD.

**Corporate involvement.** Top authors over the last 24 months, by commit email domain:

| Commits | Author | Company |
|---|---|---|
| 68 | Samuel Holland | SiFive |
| 56 | Anup Patel | Ventana |
| 34 | Anup Patel | Qualcomm |
| 30 | Vladimir Kondratiev | Mobileye |
| 29 | Clément Léger | Rivos |
| 21 | Bo Gan | gmail |
| 16 | Yu-Chien Peter Lin | SiFive |
| 16 | Nick Hu | SiFive |
| 14 | David Garcia Porras | Ahead Computing |
| 14 | Ben Xie | Andes |

Other contributors include Rahul Pathak and Radim (Ventana), Evgeny Voevodin (Tenstorrent), Benoît Monin (Bootlin), Chen Pei (Alibaba) and Pengpeng Hou (ISCAS). There is no single-vendor lock-in, but one committer is the merge bottleneck. Google is a RISE premier member, but no OpenSBI commits from Google were found in the recent history.

**Culture on new ports.** The stance is open and low-friction but not formally documented. New SoCs arrive as small vendor-contributed overrides in `platform/generic`, reviewed on the mailing list by Anup Patel. Override directories exist for allwinner, andes, eswin, mips, renesas, sifive, sophgo, spacemit, starfive, tenstorrent, thead, metanoia and openhwgroup.

## 2. Port History and Upstreaming Timeline

OpenSBI is RISC-V-native, so there was no port to riscv64. The project is fully upstream. Downstream branches exist only for two boards (see Section 13).

| Date | Event | Source |
|---|---|---|
| 2018-12-11 | First commit `9e8ff05`, "Initial commit", Anup Patel (Western Digital) | Git history of [OpenSBI](https://github.com/riscv-software-src/opensbi) |
| 2018-12-15 | First functional commit `292e634`, Anup Patel | Git history |
| 2018-12-21/22 | HiFive Unleashed and Kendryte K210 support merged via PRs from Atish Patra and Damien Le Moal | Git history |
| 2019-01 | Initial OpenSBI recipe added to meta-riscv [NEEDS VERIFICATION] | [RISE Yocto post](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/) |
| 2023-12-27 | v1.4 | Git tags |
| 2024-06-30 | v1.5 | Git tags |
| 2024-08-02 | v1.5.1 | Git tags |
| 2024-10-25/26 | Smdbltrp support, FWFT DOUBLE_TRAP feature and a double-trap SSE event (`c46a937fd9`, `3bc86854ab`, `b0a7e4b853`) | Commit search |
| 2024-12-06 | Vector load/store misaligned emulation (`c2acc5e5b0`) | Commit search |
| 2024-12-24 | v1.6 | Git tags |
| 2025-04-13 | CTR extension enabled via xstateen; vectored interrupts in `sbi_trap` | Commit search |
| 2025-06-30 | v1.7 | Git tags |
| 2025-12-29 | v1.8 | Git tags |
| 2026-01-08 | v1.8.1 | Git tags |
| 2026-06-30 | v1.9 | Git tags |
| 2026-07-16 | RISE post on RP016 APLIC and VIRQ patch series, under mailing-list review | [Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/) |
| 2026-10-20 | RISE Android 17 on RVA23 release, boot chain U-Boot then OpenSBI | [Android 17 on RVA23](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) |
| 2026-10-23 | Latest commit seen: `95c7980851`, reject undersized RPMI shmem queues | Commit search |

**Tree state.** This report reflects the tree at commit `131bda9` (2026-10-23). The newest entry in the commit search, `95c7980851`, is from the same day.

**Key contributors:** Anup Patel (Western Digital, Ventana, Qualcomm), Atish Patra (Western Digital, now Rivos), Damien Le Moal (Western Digital, 24 early commits), Samuel Holland and Peter Lin and Nick Hu (SiFive), Clément Léger (Rivos), Raymond Mao (RISCstar Solutions, RP016).

## 3. Upstream Support Tier

There is no formal tier or support-level policy and no SUPPORT.md. `docs/platform/platform.md` says only "OpenSBI currently supports the following virtual and hardware platforms" and lists 7 platforms. The `docs/platform/` directory also holds docs for Ariane/OpenPiton, Nuclei UX600, Metanoia MT2824, T-Head C9xx and Tenstorrent Atlantis. A `thead-c910.md` link exists with no matching file.

`docs/platform_requirements.md` sets the base requirement as rv32ima_zicsr or rv64ima_zicsr on every hart, plus:
- at least one hart with S-mode
- MTVEC direct mode
- M-mode software interrupts on multi-hart platforms
- optional PMP
- a TIME CSR, or a 64-bit MMIO counter to emulate it

The README says SBI v0.2 is fully supported and HSM is supported since v0.7 (Linux 5.7-rc1 and later). The code defines SBI v3.0 and implements the extensions listed in Section 4, so the README statement is out of date.

Evidence for release engineering: there is no CI that builds or tests anything (Section 7). Upstream release assets are source tarballs plus a binary archive (`opensbi-1.9-rv-bin.tar.xz` for v1.9). The `scripts/create-binary-archive.sh` script builds such archives.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream support | Not applicable, no such code | Not applicable, no such code | Native and sole target |
| Formal tier policy | None | None | None |
| CI in repository | None | None | None (only PR lockdown workflow) |
| Official binaries | Not applicable | Not applicable | `opensbi-1.9-rv-bin.tar.xz` (contents not opened) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

All code is RISC-V. Counts below come from repository searches and a read-only shallow clone. No RVV intrinsics were found (zero hits for `vfloat32m1_t` and `rvv`). Vector code is inline asm using `.option arch, +v`, used only to save and restore context and to emulate misaligned vector loads and stores. There is no JIT, SIMD dispatch, crypto or allocator code.

**Assembly files** (all complete):

| Path | Lines | Purpose |
|---|---|---|
| `firmware/fw_base.S` | 977 | Common boot: hart entry, relocation, scratch setup, trap entry/exit, warm boot |
| `firmware/fw_dynamic.S` | 137 | Boot-info handoff from the previous stage |
| `firmware/fw_jump.S` | 106 | Fixed next-stage jump |
| `firmware/fw_payload.S` | 101 | Embedded payload variant |
| `firmware/payloads/test_head.S` | 145 | Test payload |
| `lib/sbi/sbi_expected_trap.S` | 69 | Expected-trap helpers, with an H-extension variant |
| `lib/sbi/sbi_hfence.S` | 135 | HFENCE.GVMA and HFENCE.VVMA helpers |
| `lib/sbi/riscv_hardfp.S` | 171 | FP register tables, guarded by `__riscv_flen`; `#error` unless flen is 64 |
| `platform/generic/thead/thead_c9xx_tlb_trap_handler.S` | 13 | T-Head C9xx TLB erratum trap |
| `platform/generic/mips/mips_warm_boot.S` | 12 | MIPS P8700 warm boot |

**C core.** `riscv_asm.c` (274 lines, CSR/PMP/misa), `riscv_atomic.c` (191, AMO and LR/SC), `riscv_locks.c` (90), `riscv_encoding.h` (1466), `sbi_fp.c` (192), `sbi_vector.c` (94, V context save/restore), `sbi_trap_v_ldst.c`, `sbi_trap_ldst.c`, `sbi_hart.c` (810), `sbi_trap.c` (463, including reflection to VSTVEC), `sbi_emulate_csr.c`, `sbi_illegal_insn.c`, `sbi_illegal_atomic.c`, `sbi_unpriv.c`, `sbi_hart_pmp.c`, `sbi_pmp.c`.

**ISA extensions tracked in `sbi_hart.h`:**
- Interrupts and counters: Smaia, Ssaia, Sstc, Sscofpmf, Smcntrpmf, Zicntr, Zihpm
- Memory and cache: Smepmp, Svpbmt, Svade, Svadu, Zicbom, Zicboz
- State and indirect CSRs: Smstateen, Sstateen, Smcsrind, Sscsrind, Smcdeleg, Ssccfg
- Pointer masking, CFI and others: Smnpm, Zicfilp, Zicfiss, Ssdbltrp, Smrnmi, Ssqosid, Smctr/Ssctr, Sdtrig, Zkr
- Vendor: Andes PMU, SiFive CFLUSH and CEASE
- Base FP and vector: F, D, V

**SBI extensions** (17 `lib/sbi/sbi_ecall_*.c` files plus a test): Legacy 0.1, BASE, TIME, IPI, RFENCE (including HFENCE.GVMA/VVMA remote fences for KVM), HSM, SRST, PMU, DBCN, SUSP, CPPC, DBTR, SSE, FWFT, MPXY and a vendor hook.

**Platform and driver breadth.**
- `platform/generic` is device-tree driven, with overrides for Allwinner D1, Andes, ESWIN EIC770x, MIPS P8700, OpenHW Ariane and OpenPiton, Renesas RZ/Five, SiFive FU540 and FU740, Sophgo SG2042, SpacemiT K1, StarFive JH7110, Tenstorrent Ascalon and Atlantis, T-Head C9xx and Metanoia MT2824. `platform/nuclei` and `platform/template` also exist.
- Interrupt, timer and IPI drivers: PLIC, ACLINT MSWI/MTIMER, APLIC and IMSIC (AIA), Andes PLMT/PLICSW. There are 46 driver files under `lib/utils`, including about 13 serial drivers.

| Component | amd64 | arm64 | riscv64 implementation and quality |
|---|---|---|---|
| Boot and warm-boot assembly | n/a | n/a | Full. 4 firmware variants plus common `fw_base.S` |
| Trap entry and expected-trap | n/a | n/a | Full. Vectored interrupts added in `afa0e3091b` |
| HFENCE and remote TLB shootdown | n/a | n/a | Full. `sbi_hfence.S`, RFENCE ecall; TLB fixes `73bc794b40`, `111738090c` |
| Misaligned load/store emulation | n/a | n/a | Full, including vector (`c2acc5e5b0`); decoder reworked in `56c39d1f08` |
| Floating-point context | n/a | n/a | Full for flen 64 only; single-float-only builds hit `#error` |
| Vector context | n/a | n/a | Full. Inline asm, V state save/restore |
| SBI extensions for Linux/KVM | n/a | n/a | Full. All handler files exist; commits 2024 to 2026 add and fix them |
| ISA extension support | n/a | n/a | Full. Smdbltrp, Ssqosid, CTR, Zicfilp/Zicfiss, ADUE; RV32 Zalrsc build bug #413 open |
| Interrupt/timer/IPI controllers | n/a | n/a | Full. ACLINT, PLIC, APLIC, IMSIC |

The `TODO` search matched 5 files, two of them core (`lib/sbi/sbi_tlb.c`, `lib/sbi/sbi_mpxy.c`). The TODO text was not read, so severity is unknown. The other three are `platform/generic/mips/eyeq7h.c`, `scripts/Kconfiglib/menuconfig.py` and `docs/doxygen.cfg`.

## 5. Build System, Cross-Compilation, and Toolchain

The build is GNU Make plus Kconfig. There is no CMake, Dockerfile or toolchain file. Build documentation is in the README. Build commands below are from the README and Makefile. Only the Clang build was run.

**GCC cross build** (Linux-targeting triple, not bare-metal):
```
export CROSS_COMPILE=riscv64-linux-gnu-
make PLATFORM=generic
make PLATFORM=generic O=build I=install install
```

**Clang/LLVM build** (the command run during research):
```
make PLATFORM=generic LLVM=1 O=<dir> -j8
```
- With `LLVM=1` and no `CROSS_COMPILE`, the Makefile passes `--target=riscv64-unknown-elf` to clang.
- `LLVM=-17` selects versioned tools. `LLVM=/path/` selects a tool directory. `CC=clang` with default binutils also works.
- Clang 18.1.3 with `ld.lld` and `llvm-objcopy` on an x86_64 host produced riscv64 PIE ELFs and `.bin` files [NEEDS VERIFICATION, single observation].

**Other knobs:**
- `PLATFORM_RISCV_XLEN=64|32`: the default is guessed from `-dumpmachine`, falling back to 64.
- `PLATFORM_RISCV_ISA`, `PLATFORM_RISCV_ABI`: the default ISA is `rv64imafdc` plus `_zicsr_zifencei` when the compiler accepts it. The default ABI is `lp64` and the code model is `medany`.
- `FW_PAYLOAD_PATH`, `FW_JUMP=y`, `FW_DYNAMIC=y`, `FW_TEXT_START`, `FW_JUMP_ADDR`, `FW_JUMP_FDT_ADDR`, `FW_OPTIONS`.
- `make PLATFORM=generic menuconfig`, or `PLATFORM_DEFCONFIG=<file>`.
- `DEBUG=1` builds at `-O0`. `BUILD_INFO=y` breaks reproducibility unless `SOURCE_DATE_EPOCH` is set. `REPRODUCIBLE=y` adds `-ffile-prefix-map`.
- Release archive: `scripts/create-binary-archive.sh -x 64 -j N -o <out> -s <suffix>`.

**Toolchain requirements and why.**
- No numeric GCC or Clang minimum is documented in the tree.
- PIE support is mandatory because the firmware must run at an arbitrary, suitably aligned address. `riscv64-linux-gnu-gcc`, `riscv64-unknown-freebsd-gcc` and Clang/LLVM are accepted. Bare-metal `riscv64-unknown-elf-gcc` is rejected per the README. The Makefile probes `-fPIE -Wl,-pie` and always passes `-fPIE -pie` and `-Wl,--no-dynamic-linker -Wl,-pie`.
- Optional features are probed with `cc-option`-style tests, not version checks: `-march=...imafd_zicsr_zifencei`, `-mno-save-restore`, `-mstrict-align`, `-Wl,--exclude-libs,ALL`, Vector, and `-Wthread-safety-pointer` (needs Clang 22 or newer).
- Clang 19 or newer enables the visibility attribute in `sbi_visibility.h`. Older Clang still builds.
- With `ld.lld` the Makefile adds `-mno-relax`.
- Host packages: `dtc` and python3. `dtc` was absent in the research environment and the generic build still succeeded, so it is needed only for platforms that compile DTS files.
- Inferred, not tested: the Zicsr/Zifencei probe implies a practical floor of roughly GCC 11 and binutils 2.36 for the default ISA string. Older toolchains fall back to `rv64imafdc`. GCC builds were not tested.

**QEMU usage** (from `docs/platform/qemu_virt.md`, not run):
```
make PLATFORM=generic
qemu-system-riscv64 -M virt -m 256M -nographic -bios build/platform/generic/firmware/fw_payload.bin

make PLATFORM=generic FW_PAYLOAD_PATH=<linux>/arch/riscv/boot/Image
qemu-system-riscv64 -M virt -m 256M -nographic \
  -bios build/platform/generic/firmware/fw_payload.elf \
  -drive file=<rootfs>,format=raw,id=hd0 -device virtio-blk-device,drive=hd0 \
  -append "root=/dev/vda rw console=ttyS0"

qemu-system-riscv64 -M virt -m 256M -nographic \
  -bios build/platform/generic/firmware/fw_jump.bin -kernel <linux>/arch/riscv/boot/Image ...
```
- `make PLATFORM=generic run` launches QEMU via `platform-runcmd`. For debugging, build `DEBUG=1 FW_TEXT_START=0x80000000` and run QEMU with `-gdb tcp::1234 -S`.
- U-Boot payload: `FW_PAYLOAD_PATH=<uboot>/u-boot.bin` with `qemu-riscv64_smode_defconfig`. The same binaries run under `spike`.

**Known build failures and hazards:**
- [#413](https://github.com/riscv-software-src/opensbi/issues/413): unrecognized opcode `addw` when building RV32 with Zalrsc (open).
- [#365](https://github.com/riscv-software-src/opensbi/issues/365): "opensbi failed to build" (open; body unread).
- [#243](https://github.com/riscv-software-src/opensbi/issues/243): `riscv_encoding.h` redefinition. #220: undefined `__stack_chk_guard`.
- Clang combined with a GNU `riscv*-linux-gnu` BFD linker is documented as producing broken binaries with missing relocations.
- PR [#356](https://github.com/riscv-software-src/opensbi/pull/356) ("Don't unconditionally define `__always_inline`") is open.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

OpenSBI exists only for RISC-V, so there is no arm64 or amd64 baseline. The matrix covers the SBI and ISA features Linux, KVM and Android need.

| Feature | riscv64 status | Evidence |
|---|---|---|
| Legacy 0.1, BASE | Implemented | `sbi_ecall_*.c` |
| TIME, IPI, RFENCE | Implemented, including HFENCE for KVM | `sbi_hfence.S`, RFENCE ecall |
| HSM | Implemented; used for SMP, kexec, hotplug | README, ecall files |
| SRST, SUSP, PMU, DBCN | Implemented | ecall files |
| CPPC | Implemented (RPMI-backed driver in `lib/utils/cppc`) | ecall files, Kconfig |
| SSE, FWFT, DBTR, MPXY | Implemented | ecall files, Kconfig |
| SBI spec level | 3.0 in code (README says v0.2, stale) | `SBI_ECALL_VERSION` |
| H-extension support | HFENCE helpers, H-aware expected-trap, VSTVEC reflection | `sbi_hfence.S`, `sbi_trap.c` |
| Vector misaligned emulation | Implemented | `sbi_trap_v_ldst.c` |
| CFI (Zicfilp/Zicfiss) | Encodings added (`6758a756c4`); open bug #400 with landing pads | Commit search, issue list |
| Double trap (Smdbltrp) | Implemented | Commits Oct 2024 |
| M-mode wired interrupt delivery to S-mode domains (APLIC, VIRQ) | Not merged; under mailing-list review | RP016 |
| RV32 support | Present; open bug #413 | Issue list |

**Functional gaps.** The APLIC M-mode wired-interrupt abstraction and the VIRQ SBI extension (vendor ECALL ID `0x0900524d` in the design doc, POP and COMPLETE functions) are not upstream. They matter for trusted execution and domain isolation, not for baseline Linux boot. Board support for SpacemiT K3 and Alibaba A210 is downstream only (`v1.8-k3`, `v1.5-a210` branches).

**Performance gaps.** Data not available: no OpenSBI benchmark was found. Searches of "OpenSBI riscv64 benchmark" and "OpenSBI riscv64 vs arm64 performance 2024 2025 2026" returned mirrors, packaging pages and unrelated board reviews. The only performance-related issue is [#402](https://github.com/riscv-software-src/opensbi/issues/402), a livelock with many TLB shootdowns. SIMD is irrelevant to this firmware.

**Security hardening gaps.** Two validation issues were filed in 2026: [#426](https://github.com/riscv-software-src/opensbi/issues/426) (DBTR `trig_count` not validated before mapping shared memory) and [#415](https://github.com/riscv-software-src/opensbi/issues/415) (MPXY `base_attr_id + attr_count` can wrap and bypass range checks). Their status and bodies were not read. Recent hardening commits include `f95648d395` (clamp `sbi_ecall_get_extensions_str` buffer offset) and `95c7980851` (reject undersized RPMI shmem queues).

**NaN and floating-point semantics.** No NaN-handling issue was found. The only floating-point correctness issue is [#212](https://github.com/riscv-software-src/opensbi/issues/212), "Misaligned floating point store emulation is broken ?" (last updated 2021-05-10, possibly stale). Single-float-only builds fail by design via `#error` in `riscv_hardfp.S`.

## 7. CI/CD Infrastructure

The CI files were read from a local clone at `131bda9`. `.github/workflows/` contains exactly one file, `repo-lockdown.yml`. It uses `dessant/repo-lockdown@v4`, triggers on `pull_request_target` (opened only), runs on `ubuntu-latest` (x86), and comments on, locks and closes pull requests. It builds nothing and runs no QEMU. It contains no riscv, riscv64 or QEMU references.

None of these exist at the repo root: `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml`, `.circleci/`. The `.github` history in the shallow clone is one commit, so earlier CI removal could not be checked.

**Tests that exist.** The SBIUnit framework ([docs/writing_tests.md](https://github.com/riscv-software-src/opensbi), tests in `lib/sbi/tests/*.c`) covers atomics, locks, bitmap, bitops, console, ecall, math, string and ubsan. It is enabled by `CONFIG_SBIUNIT` (off by default) and runs at boot, for example under QEMU. No CI invokes it. Any riscv64 build and boot testing happens on contributor machines and the mailing list, and nothing in the repository documents it.

**RISE runners and hardware.** No OpenSBI-specific use of the [RISE RISC-V runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) was found. The `riseproject-dev/opensbi` workflows are unverified. The RP024 Android 17 post says phase 2 will automate build, hardware testing and release, starting on A210 systems in the RISE Board Farm, with K3 systems following. The RP012 work ([HIL post](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)) covers lower-level boot-chain testing on BPI-F3 and HiFive Premier P550 [NEEDS VERIFICATION that OpenSBI itself is exercised].

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | None | None | None |
| Boot/QEMU CI | None | None | None |
| Unit tests in CI | None | None | None (SBIUnit exists, not run in CI) |
| Only workflow | repo-lockdown on x86 `ubuntu-latest` | same | same |
| Native hardware CI | None | None | None upstream |

## 8. Distribution and Release Status

| Channel | Result | Evidence |
|---|---|---|
| GitHub releases | Latest v1.9, v1.8.1, v1.8. v1.9 assets: `opensbi-1.9-rv-bin.tar.xz`, `v1.9.zip`, `v1.9.tar.gz`. No asset literally named riscv64. Contents of the tarball not opened. Assets of v1.8.1 and v1.8 not listed | Web release pages (REST API returned HTTP 403) |
| PyPI | No `opensbi` project (HTTP 404) | `pypi.org/pypi/opensbi/json` |
| RISE wheel builder | Not present; the index redirects to PyPI, which returns 404. OpenSBI is not among the 75 packages listed | [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) |
| Debian sid | `opensbi 1.9-1`, architecture "all" only. File list includes `/usr/lib/riscv64-linux-gnu/opensbi/generic/fw_dynamic.{bin,elf}` and `fw_jump.{bin,elf}`, plus riscv32 equivalents | Debian package page |
| Debian other suites | forky and sid 1.9-1 and 1.8.1-1; trixie 1.6-1; bookworm 1.1-2 (source versions) | Debian package pages |
| Debian source | 1.7-1 source README | [Debian sources](https://sources.debian.org/src/opensbi/1.7-1/README.md) |
| Ubuntu 26.04 (resolute) | Launchpad shows source 1.8.1-1 in main, published 2026-01-17, with no per-architecture build records. The packages.ubuntu.com pages returned HTTP 500, so binary and riscv64 availability is unverified | Launchpad |
| T2 | Lists 1.8.1 | [T2 OpenSBI package](https://t2linux.com/packages/opensbi) |
| Arch Linux RISC-V | Not listed in the search that was run | `archriscv.felixc.at` query; status pages not checked |
| npm, Maven, OCI | Data not available: not searched; no indication of such packaging |  |

Whether `rv-bin` counts as a riscv64 binary is a judgment call. The findings are kept separate here: there is no literal riscv64-named asset, and RISC-V firmware is shipped.

**What a user must do to get a working binary.** On Debian, install the architecture-independent `opensbi` package and use the firmware under `/usr/lib/riscv64-linux-gnu/opensbi/generic/`. Otherwise, download the upstream `rv-bin` tarball, or build from source (Section 5). Ubuntu is very likely the same as Debian given the same source version, but this is unverified. The Debian/Ubuntu packaging patch status was not checked.

## 9. Dependencies

OpenSBI has no external dependency manifest (no CMakeLists.txt, setup.py, go.mod, Cargo.toml or package.json). It has no JIT, SIMD, numerics, crypto, compression or allocator dependencies, and no libc. Code copied into the tree: libfdt (`lib/utils/libfdt`) and a vendored Kconfiglib (`scripts/Kconfiglib`). Package manager and Ubuntu 26.04 riscv64 graph lookups could not be run (the project-graph tool was unavailable), so all "build" cells come from the README and Makefile only, not from an executed build, except for the one Clang build. Recursing into dependencies of dependencies adds nothing OpenSBI-specific, since all are host or build tools.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | Build dependency, critical. Compiler via `CROSS_COMPILE=riscv64-linux-gnu-` or native; needs PIE support | Makefile probes `-mno-save-restore`, `-mstrict-align`, zicsr/zifencei, vector. Bare-metal `riscv64-unknown-elf-gcc` unusable (README). GCC build not tested in research | Not applicable | Not applicable | Status report in the sw-ecosystem repo at project-reports/gcc.md |
| GNU binutils | Build dependency, critical. ld, ar, objcopy on the GCC path | Required for the GCC path | Not applicable | Not applicable | No project report in the repo |
| GNU make | Build dependency, critical. Build driver | Required | Not applicable | Not applicable | No project report in the repo |
| LLVM | Build dependency, optional. Clang, llvm-ar, ld.lld, llvm-objcopy via `LLVM=1` or `CC=clang` | Supported; Clang 18.1.3 built the generic platform (single observation). Clang with a GNU `riscv*-linux-gnu` BFD linker produces broken binaries | Not applicable | Not applicable | Status report at project-reports/llvm.md |
| dtc | Runtime dependency, critical. Compiles `.dts` files in the build; the generic build succeeded without it in the research environment | Host tool; riscv64 matters only for native builds | Not applicable | Not applicable | No project report in the repo |
| QEMU | Test dependency, optional. `qemu_virt` reference platform | Not applicable | OpenSBI boots on QEMU virt, but no CI for this exists in the tree. Open issue #353 (hang with high SMP count) | Not applicable | Status report at project-reports/qemu.md |
| libfdt (vendored) | Device tree parsing in the generic platform. GPL-2.0+/BSD-2-Clause, in `ThirdPartyNotices.md` | Built with OpenSBI, compiled for riscv32/64 | Covered only indirectly by booting | Ships inside OpenSBI releases | No blocking issues found |
| Python 3 | Helper scripts, including Kconfiglib | Host tool | Not applicable | Not applicable | Status report at project-reports/python.md |
| Spike | RISC-V ISA simulator, documented platform | Not applicable | Used as a reference platform | Not applicable | No project report in the repo |

## 11. Known Bugs and Active Issues

Descriptions come from titles, states and dates only. Issue and PR bodies could not be read (GitHub MCP reads were denied for this repository), so severity is judged from the title and marked as such. PR merge status is unverified for all rows. Section numbering skips 10 because the project has no dependent package ecosystem.

**Correctness and robustness (Linux/KVM relevant):**

| ID | Title | Status | Severity (from title) | Notes |
|---|---|---|---|---|
| [#402](https://github.com/riscv-software-src/opensbi/issues/402) | Lifelock condition under high load with many TLB shootdowns | open (created 2025-07-21) | High | RFENCE/IPI under load; only open performance or scalability item |
| [#400](https://github.com/riscv-software-src/opensbi/issues/400) | Store page fault loop when landing pads are enabled | open (2025-06-09) | High | Zicfilp CFI |
| [#353](https://github.com/riscv-software-src/opensbi/issues/353) | System freezes when smp is 54 or higher with qemu-system-riscv64 | open (2024-04-26) | High | Scale issue on QEMU |
| [#354](https://github.com/riscv-software-src/opensbi/issues/354) | Firmware SMP boot bug | open (updated 2024-12-11) | Medium | Body unread |
| [#355](https://github.com/riscv-software-src/opensbi/issues/355) | sbi_hsm_hart_start_finish: ERR: The hart is in invalid state | open (2024-05-13) | Medium | HSM error |
| [#387](https://github.com/riscv-software-src/opensbi/issues/387) | Incorrect AIA mtopi handling without an IMSIC | open (updated 2025-02-02) | Medium | AIA |
| [#381](https://github.com/riscv-software-src/opensbi/issues/381) | CSR_MHPMCOUNTER3 initialization on hart_pmu_get_allowed_bits() | open (updated 2024-11-27) | Low | PMU |
| [#372](https://github.com/riscv-software-src/opensbi/issues/372) | Some ROM regions are overlapping | open (updated 2024-09-04) | Low | |
| [#312](https://github.com/riscv-software-src/opensbi/issues/312) | STVEC and handling kernel interrupts/exceptions | open (2023-06-27) | Low | Possibly a question |
| [#290](https://github.com/riscv-software-src/opensbi/issues/290) | Is there a privilege spec version detection SBI call? | open (2023-03-13) | Low | Feature question |
| [#212](https://github.com/riscv-software-src/opensbi/issues/212) | Misaligned floating point store emulation is broken ? | open (2021-05-10) | Unknown | Old, may be stale |
| [#282](https://github.com/riscv-software-src/opensbi/issues/282) | RISCV TEE support | open (17 comments, 2022-12-22) | n/a | Nearest to a tracking issue; content unread |

**Security and validation (filed 2026):** [#426](https://github.com/riscv-software-src/opensbi/issues/426) DBTR `trig_count` validation (updated 2026-08-29); [#415](https://github.com/riscv-software-src/opensbi/issues/415) MPXY attribute range wrap (updated 2026-03-21). Both are likely High given the bug class; status unverified.

**Build and RV32:** #413 (open, 2026-02-27), #365 (open), #243, #220.

**Open PRs of interest** (status from search data, unverified against `merged_at`):

| ID | Title | Date | Notes |
|---|---|---|---|
| [#431](https://github.com/riscv-software-src/opensbi/pull/431) | Install the next-stage entry as a direct-mode xtvec | 2026-10-06 | Open |
| [#429](https://github.com/riscv-software-src/opensbi/pull/429) | Add an acquire fence after the `_boot_status` wait loop | 2026-10-06 | Open; potential memory-ordering correctness fix |
| [#423](https://github.com/riscv-software-src/opensbi/pull/423) | Clamp RPMI shmem queue name | 2026-08-06 | Open |
| [#356](https://github.com/riscv-software-src/opensbi/pull/356) | Don't unconditionally define `__always_inline` | 2024-05-15 | Open |
| [#432](https://github.com/riscv-software-src/opensbi/pull/432) | Correct RPMI CPPC request field ordering | closed 2026-10-21 | Merged or closed-unmerged unknown |

Note: GitHub PRs are auto-closed by the lockdown bot, so a closed PR does not indicate a merge. Merged patches arrive via the mailing list.

**Recently closed issues:** #411 (closed 2026-01-08), #388 (2025-08-28), #404 (`mstatush` usage during boot, 2025-08-16), #334 (`sbi_cppc_write` 64-bit value on RV32, closed 2024-09-27, fixed by `2ffa0a153d`).

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. Issue and PR bodies and mailing-list threads were not read, so absence of objections is not established. Data not available: mailing-list review threads for RP016.
- **Technical blockers:** the open correctness issues in Section 11 (#402, #400, #353, #355), and an unresolved QEMU APLIC register behavior that RP016 worked around in OpenSBI. A proper QEMU fix by Samuel Holland (SiFive) was not yet upstream at the time of the design doc [NEEDS VERIFICATION].
- **Organizational blockers:**
  - A single effective maintainer (Anup Patel) merges every patch.
  - Review is by mailing list, and GitHub PRs are auto-closed, which raises the barrier for contributors who use GitHub-based workflows.
  - There is no tier policy, MAINTAINERS file or documented SLA.
  - RISE-funded downstream branches (`v1.5-a210`, `v1.8-k3`) depend on vendors upstreaming platform support.
- **Acceptance probability:** upstream acceptance of vendor platform overrides is routine, judging by the breadth of existing overrides. The RP016 APLIC and VIRQ series were posted 2026-05-04 and 2026-05-14 and are still under review at 2026-10-25 (about five months). A numeric probability is not supported by the findings.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification.** OpenSBI is RISC-V-native, with complete, current riscv64 support (SBI 3.0: HSM, IPI, TIME, RFENCE, DBCN, SUSP, CPPC, SSE, FWFT, MPXY, DBTR). Its only GitHub workflow is [repo-lockdown.yml](https://github.com/riscv-software-src/opensbi/tree/master/.github/workflows), which builds and tests nothing because review is by mailing list, so the CI step gives orange. The distribution floor does not lift it: Debian packages it ([1.7-1 source](https://sources.debian.org/src/opensbi/1.7-1/README.md)) and [T2 lists 1.8.1](https://t2linux.com/packages/opensbi), but the packaging patch status was not checked. The consumable release is therefore from a distro, not verified as upstream. Only in-tree SBIUnit tests exist, and no CI runs them.

**Pending work that could change the grade:**
- Yellow (clean-distro-build) is reachable if the Debian/Ubuntu packaging diff shows no riscv64-specific patches. This was not checked, and the Ubuntu 26.04 page returned HTTP 500.
- Blue or green needs upstream CI that builds and boots `fw_dynamic` and `fw_jump` on QEMU virt (riscv64), plus upstream release binaries. Upstream GitHub release assets were only partially verified (v1.9 lists an `rv-bin` tarball).
- RISE is involved. RP016 (RISCstar, Raymond Mao) has APLIC M-mode wired-interrupt and VIRQ SBI-extension patch series under review on the OpenSBI mailing list, not merged. RP024 (Android 17 on RVA23) keeps downstream platform branches `v1.5-a210` and `v1.8-k3` in [riseproject-dev/opensbi](https://github.com/riseproject-dev/opensbi), which is not upstream. That repository was created 2026-10-06, has 2 commits and a minimal README. The mapping of branch names to the two RP024 boards is an inference. The RISE blog says OpenSBI is the M-mode firmware in the Android 17 boot chain (U-Boot, then OpenSBI).
- Open upstream issues #402, #400 and #353, plus PRs #429 and #431, have unverified status.
- Governance is a single maintainer, Anup Patel, now at Qualcomm.

## 14. Investment Analysis

**Already covered by RISE, so not sized again:**
- RP016: APLIC M-mode wired-interrupt support (milestone 2, completed 2026-02-05, patches sent 2026-05-04) and the VIRQ subsystem (milestone 3, completed 2026-03-31, latest series 2026-05-14). Both are under review. Validation was on QEMU virt with AIA/APLIC only, with no physical board.
- RP024: Android 17 build on RVA23 for SpacemiT K3 and Alibaba A210, engineered by BayLibre, including the downstream OpenSBI branches. Phase 2 plans CI automation on the RISE Board Farm.
- RP012: hardware-in-the-loop boot-chain testing with Collabora.

The effort figures below are planning estimates by the author, not derived from the research findings. No cost data was found.

### 14.1 Functional Enablement

- Check the Debian/Ubuntu packaging diff for riscv64-specific patches. This is the cheapest path from orange to yellow.
- Reproduce and triage #402, #400, #353 and #355 (bodies unread so far), and review PRs #429 and #431.
- Upstream the K3 and A210 platform support from the downstream branches, owned by SpacemiT and Alibaba as RISE urges.
- Review and test the RP016 series on real AIA hardware, since it was validated only on QEMU.

### 14.2 Performance Optimization

No benchmarks exist. A small harness for boot time, SBI call latency (IPI, TIME, RFENCE, HSM) and trap overhead would establish a baseline. This is low priority because SIMD does not apply and no performance gap is documented.

### 14.3 CI/CD Infrastructure

The largest gap. Upstream accepts patches only by mailing list, so a CI service has to run outside GitHub PR flow. It would build with GCC (`riscv64-linux-gnu-`) and Clang (`LLVM=1`), run SBIUnit (`CONFIG_SBIUNIT=y`) under QEMU virt, and boot `fw_dynamic` and `fw_jump` with a Linux kernel. It could use the RISE RISC-V runners and, for hardware, the RISE Board Farm. It would also publish release binaries.

### 14.4 Ecosystem Enablement

No dependent package ecosystem exists (no Section 10). The relevant action is distro packaging: confirm Ubuntu riscv64 binaries and the Arch status.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Audit Debian/Ubuntu packaging diff for riscv64 patches; confirm Ubuntu 26.04 riscv64 binary | 1 | Chip company or RISE Linux Distro WG | High |
| Functional | Triage and fix #402, #400, #353, #355; review #429, #431 | 8 to 12 | Chip company with upstream maintainer | High |
| Functional | Upstream platform overrides from `v1.8-k3` and `v1.5-a210` | 6 to 10 per SoC | SpacemiT, Alibaba | High |
| Functional | Validate RP016 APLIC and VIRQ series on AIA hardware | 4 to 6 | RISE, RISCstar | Medium |
| Functional | Reviewer capacity to relieve the single-maintainer bottleneck | Ongoing, about 0.2 FTE | Chip company | High |
| CI/CD | Build matrix (GCC and Clang), SBIUnit and QEMU boot test on RISE runners | 3 to 4 | Chip company with RISE | Critical |
| CI/CD | Hardware boot tests on RISE Board Farm (A210, K3) | 3 to 5 | RISE (RP024 phase 2) | Medium |
| CI/CD | Upstream release binaries with documented riscv64 assets | 1 to 2 | Upstream maintainer with RISE | Medium |
| Performance | Boot-time and SBI-call latency baseline harness | 3 to 4 | Chip company | Low |
| Ecosystem | Confirm Arch Linux and Fedora packaging status | 1 | RISE Linux Distro WG | Low |

## 15. References

- [OpenSBI repository (riscv-software-src/opensbi)](https://github.com/riscv-software-src/opensbi)
- [OpenSBI .github/workflows directory (repo-lockdown.yml)](https://github.com/riscv-software-src/opensbi/tree/master/.github/workflows)
- [OpenSBI issue #402, TLB shootdown livelock](https://github.com/riscv-software-src/opensbi/issues/402)
- [OpenSBI issue #400, store page fault loop with landing pads](https://github.com/riscv-software-src/opensbi/issues/400)
- [OpenSBI issue #353, freeze with high SMP on QEMU](https://github.com/riscv-software-src/opensbi/issues/353)
- [OpenSBI issue #355, invalid hart state in HSM start](https://github.com/riscv-software-src/opensbi/issues/355)
- [OpenSBI issue #354, firmware SMP boot bug](https://github.com/riscv-software-src/opensbi/issues/354)
- [OpenSBI issue #387, AIA mtopi handling](https://github.com/riscv-software-src/opensbi/issues/387)
- [OpenSBI issue #381, MHPMCOUNTER3 initialization](https://github.com/riscv-software-src/opensbi/issues/381)
- [OpenSBI issue #372, overlapping ROM regions](https://github.com/riscv-software-src/opensbi/issues/372)
- [OpenSBI issue #365, build failure](https://github.com/riscv-software-src/opensbi/issues/365)
- [OpenSBI issue #312, STVEC handling](https://github.com/riscv-software-src/opensbi/issues/312)
- [OpenSBI issue #290, privilege spec detection](https://github.com/riscv-software-src/opensbi/issues/290)
- [OpenSBI issue #282, RISCV TEE support](https://github.com/riscv-software-src/opensbi/issues/282)
- [OpenSBI issue #243, riscv_encoding.h redefinition](https://github.com/riscv-software-src/opensbi/issues/243)
- [OpenSBI issue #220, __stack_chk_guard](https://github.com/riscv-software-src/opensbi/issues/220)
- [OpenSBI issue #212, misaligned FP store emulation](https://github.com/riscv-software-src/opensbi/issues/212)
- [OpenSBI issue #413, addw with Zalrsc on RV32](https://github.com/riscv-software-src/opensbi/issues/413)
- [OpenSBI issue #415, MPXY attribute range wrap](https://github.com/riscv-software-src/opensbi/issues/415)
- [OpenSBI issue #426, DBTR trig_count validation](https://github.com/riscv-software-src/opensbi/issues/426)
- [OpenSBI PR #431, next-stage direct-mode xtvec](https://github.com/riscv-software-src/opensbi/pull/431)
- [OpenSBI PR #429, acquire fence after boot status loop](https://github.com/riscv-software-src/opensbi/pull/429)
- [OpenSBI PR #423, RPMI shmem queue name clamp](https://github.com/riscv-software-src/opensbi/pull/423)
- [OpenSBI PR #432, RPMI CPPC field ordering](https://github.com/riscv-software-src/opensbi/pull/432)
- [OpenSBI PR #356, __always_inline definition](https://github.com/riscv-software-src/opensbi/pull/356)
- [RISE: Advancing OpenSBI Interrupt Handling (2026-07-16)](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE: Android 17 Available on RVA23 with RISE (2026-10-20)](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE: Tested on Real Silicon, hardware-in-the-loop (2025-09-01)](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [RISE: How Kairos is Charting the Stepping Stones of RISC-V Productization (2026-09-28)](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [RISE: Improving RISC-V Support in the Yocto Project (2026-06-05)](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/)
- [RISE: Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE members](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/opensbi downstream repository](https://github.com/riseproject-dev/opensbi)
- [RISE android_manifest release android-17-v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [RP016 milestone 2 design doc, APLIC](https://riscv-optee-docs-c9fea0.gitlab.io/rp016/milestone2)
- [RP016 milestone 3 design doc, VIRQ](https://riscv-optee-docs-c9fea0.gitlab.io/rp016/milestone3)
- [Debian sources, opensbi 1.7-1 README](https://sources.debian.org/src/opensbi/1.7-1/README.md)
- [T2 package page for OpenSBI](https://t2linux.com/packages/opensbi)
- [KVM RISC-V howto, KVM-RISCV64 on Spike](https://github.com/kvm-riscv/howto/wiki/KVM-RISCV64-on-Spike)
- [Shakti blog, OpenSBI on Spike, QEMU and Shakti](https://blogshakti.org.in/opensbi-on-spike-qemu-shakti/)