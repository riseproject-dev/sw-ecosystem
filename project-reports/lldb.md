---
title: LLDB
parent: Project Reports
categories:
  - debug
---

# LLDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for LLDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

LLDB is the debugger sub-project of the LLVM Project, hosted at [llvm/llvm-project](https://github.com/llvm/llvm-project) under `lldb/`. The project home is [lldb.llvm.org](https://lldb.llvm.org/). LLDB is governed under the LLVM Developer Policy with no independent board. The LLVM Foundation is the legal and fiscal body.

Corporate sponsors of the LLVM Foundation as of mid-2026:

- Diamond: AMD, Apple, Google, Qualcomm
- Platinum: Arm, Fastly, Huawei, Meta, Modular, NVIDIA
- Gold: Access Softek, AWS, Fujitsu, MathWorks, Microsoft, Sony Interactive
- Corporate Supporters: Tesla, Trace Machina, Uber

Named maintainers with identifiable employers (from `lldb/Maintainers.md`):

| Name | GitHub | Affiliation |
|---|---|---|
| Jason Molenda | jasonmolenda | Apple |
| David Spickett | DavidSpickett | Arm |
| Jim Ingham | jimingham | Apple |
| Alex Langford | bulbazord | Apple |
| Greg Clayton | clayborg | Meta |
| Zequan Wu | ZequanWu | Google |
| John Harrison | ashgti | Google |
| Adrian Prantl | adrian-prantl | Apple |
| Ed Maste | emaste | FreeBSD Foundation |
| Omair Javaid | omjavaid | Linaro |
| Charles Zablit | charles-zablit | Apple |

Apple holds 5 of 20 named maintainer slots. No RISC-V chip company (SiFive, Andes, ESWIN, Syntacore, Alibaba/DAMO) holds a named maintainer slot in LLDB.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port originated from Phabricator review D62732, which stalled for over three years. The meta-tracking issue [#55383](https://github.com/llvm/llvm-project/issues/55383) was filed 2022-05-11 calling for community action. No assignee, no milestone; still open as of 2026-06-17.

Key milestones based on merged PRs:

| Date | PR | Description |
|---|---|---|
| 2024-01-30 | [#79990](https://github.com/llvm/llvm-project/pull/79990) | Fix GDB-stub connection handshake: maps "riscv:rv64" to "riscv64" (2-line fix) |
| 2024-06-05 | [#93297](https://github.com/llvm/llvm-project/pull/93297) | RegisterContextCorePOSIX_riscv64: ELF core dump register reading |
| 2024-07-16 | [#90075](https://github.com/llvm/llvm-project/pull/90075) | Fix crash on breakpoint over undecoded instruction |
| 2024-07-17 | [#99043](https://github.com/llvm/llvm-project/pull/99043) | Fix backtrace inside function prologue |
| 2024-09-04 | [#104547](https://github.com/llvm/llvm-project/pull/104547) | Support optionally disabled FPR on riscv64 (soft-float targets) |
| 2024-10-02 | [#99336](https://github.com/llvm/llvm-project/pull/99336) | Function call support in expression evaluator (`expr -- somefunc()`) |
| 2024-11-12 | [#115408](https://github.com/llvm/llvm-project/pull/115408) | riscv32 ELF corefile support (merged 2025-05-19) |
| 2025-02-17 | [#127505](https://github.com/llvm/llvm-project/pull/127505) | Fix LR/SC atomic sequence handling in lldb-server (merged 2025-06-24) |
| 2025-02-08 | [#126266](https://github.com/llvm/llvm-project/pull/126266) | Add required RISC-V relocations in MCJIT (merged 2025-04-14) |
| 2025-01-28 | [#124475](https://github.com/llvm/llvm-project/pull/124475) | ABI register alias names (a0, ra, sp, fp) in register lookup (merged 2025-02-20) |
| 2025-09-18 | [#158161](https://github.com/llvm/llvm-project/pull/158161) | Enable call-frame unwinding (reverted then re-landed as #159842) |
| 2025-09-25 | [#160550](https://github.com/llvm/llvm-project/pull/160550) | Fix sign-extension bug in ADDI emulation (UINT64 correction) |
| 2025-11-11 | [#167490](https://github.com/llvm/llvm-project/pull/167490) | Fix FP load/store encoding in instruction emulator |
| 2025-11-06 | [#166531](https://github.com/llvm/llvm-project/pull/166531) | Trap handler unwind plan (signal trampolines, merged 2026-01-13) |
| 2026-01-16 | [#176472](https://github.com/llvm/llvm-project/pull/176472) | Fix GetRegisterInfo hardcoded to riscv64; adds riscv32 support |
| 2026-02-18 | [#173047](https://github.com/llvm/llvm-project/pull/173047) | Propagate RISC-V extension features to disassembler |
| 2026-02-18 | [#173046](https://github.com/llvm/llvm-project/pull/173046) | Add SubtargetFeatures to ArchSpec (infrastructure for above) |
| 2026-02-20 | [#182260](https://github.com/llvm/llvm-project/pull/182260) | Treat char as unsigned on RISC-V (ABI correctness in expression evaluator) |
| 2026-02-28 | [#180670](https://github.com/llvm/llvm-project/pull/180670) | FreeBSD kernel core dump support for riscv64 |
| 2026-04-20 | [#191410](https://github.com/llvm/llvm-project/pull/191410) | TLS variable access on RISC-V Linux |
| 2026-06-04 | [#142932](https://github.com/llvm/llvm-project/pull/142932) | Handle CSR subsets in rv32 core dump images |
| 2026-06-10 | [#147990](https://github.com/llvm/llvm-project/pull/147990) | RISC-V feature attribute support; allows overriding default feature set |

The primary contributor driving functional completeness is `daniilavdeev` (GitHub), with repository activity strongly suggesting Syntacore affiliation. The primary reviewer and merger for early patches was David Spickett (Arm). No single company has taken ownership of the port.

---

## 3. Upstream Support Tier

LLVM does not publish a formal numbered tier system for LLDB. The lldb.llvm.org documentation describes a practical hierarchy in which macOS and iOS are mature, Linux/FreeBSD/NetBSD user-space are supported, and RISC-V is in active development. The site states "ports to new platforms are welcome" with no formal submission gate beyond the standard LLVM contribution process.

No formal objections to the RISC-V port have been documented in public issue trackers. RISC-V is not on any deprecation or removal list.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

All RISC-V support is implemented in C++ plugins. There are no assembly files and no `arch/riscv/` kernel-style subdirectory.

### 4.1 ABI Plugin

`lldb/source/Plugins/ABI/RISCV/ABISysV_riscv.cpp` (913 lines): SysV ABI for both riscv32 and riscv64 (selected by `m_is_rv64` flag). Covers calling convention, argument passing, return values, unwind plans, and register volatility. Handles RVE (embedded, 16-register ABI) via `eRISCV_rve` arch flag.

### 4.2 Instruction Emulator

`lldb/source/Plugins/Instruction/RISCV/EmulateInstructionRISCV.cpp` (2071 lines): Software single-step emulator. Extensions covered: RV32I/RV64I, RV32M/RV64M, RV32A/RV64A (including LR/SC atomic sequences with `RISCVSingleStepBreakpointLocationsPredictor`), RVC/Zca (compressed), RV32F/RV64F, RV32D/RV64D. Extensions NOT covered: RVV (no vector emulation), Zba/Zbb/Zbs (no bitmanip emulation).

### 4.3 Register Contexts

Linux native register access is in `NativeRegisterContextLinux_riscv64.cpp` (377 lines). It reads/writes GPR via `NT_PRSTATUS` and FPR via `NT_FPREGSET` through `ptrace PTRACE_GETREGSET/PTRACE_SETREGSET`. There is no vector (RVV) ptrace support in this file.

The register enum in `lldb-riscv-register-enums.h` (4667 lines) defines all 4096 CSR addresses with named aliases (mstatus, sstatus, cycle, instret, hpmcounters, hypervisor CSRs, etc.).

`RegisterInfos_riscv64.h` defines 32 GPRs plus PC, 32 FPRs plus fcsr, and 32 vector registers v0-v31 with a 128-bit/scalable placeholder. The VPR struct in `RegisterInfoPOSIX_riscv64.h` uses `void *vpr` -- a runtime-size placeholder only, not a functional implementation.

ELF core reading is covered by `RegisterContextPOSIXCore_riscv64.cpp` and `RegisterContextPOSIXCore_riscv32.cpp`. FreeBSD kernel core reading is in `RegisterContextFreeBSDKernelCore_riscv64.cpp`. Darwin/macOS riscv32 support is in `RegisterContextDarwin_riscv32.cpp` (1314 lines).

### 4.4 DWARF Support

`lldb/source/Utility/RISCV_DWARF_Registers.h` (4682 lines): Maps RISC-V DWARF register numbers -- x0-x31 (0-31), f0-f31 (32-63), v0-v31 (96-127), CSRs (DWARF 4096-8191).

### 4.5 ISA Extension Coverage Summary

| Extension | Status | Location |
|---|---|---|
| RV32I / RV64I | Full | Emulator, register contexts |
| RV32M / RV64M | Full emulation | EmulateInstructionRISCV.cpp |
| RV32A / RV64A (LR/SC, AMO) | Full emulation | EmulateInstructionRISCV.cpp |
| RVC / Zca | Full emulation | EmulateInstructionRISCV.cpp, RISCVCInstructions.h |
| RV32F / RV64F, RV32D / RV64D | Full emulation | EmulateInstructionRISCV.cpp |
| RVV (v0-v31) | Register stubs only | lldb-riscv-register-enums.h, RegisterInfos_riscv64.h (128-bit placeholder) |
| CSRs (all 4096) | Enum and definition only | lldb-riscv-register-enums.h, RISCV_DWARF_Registers.h |
| Zba / Zbb / Zbs | None | Not present |
| RVE | ABI only | ABISysV_riscv.h (CFA alignment check) |
| Xqci (Qualcomm custom) | Test fixture only | `riscv32-imcxqcixqccmp.gpr_csr.core` core file |
| Hypervisor CSRs | Enum only | lldb-riscv-register-enums.h |

### 4.6 Hardware Debug Register (Watchpoint/Breakpoint) Support

The amd64 port has `NativeRegisterContextDBReg_x86.cpp`. The arm64 port has `NativeRegisterContextDBReg_arm64.cpp`. There is no equivalent file for riscv64. RISC-V has no hardware watchpoints on many implementations, and [PR #151195](https://github.com/llvm/llvm-project/pull/151195) (software watchpoints, opened 2025-07-29) is still open.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Minimum Toolchain Requirements

From `llvm/docs/GettingStarted.rst` (enforced by build system):

| Tool | Minimum |
|---|---|
| GCC | 7.4 |
| Clang | 5.0 |
| CMake | 3.20.0 |
| Python | 3.8 |
| SWIG | 4.0 |

No RISC-V-specific version floor is documented above the general minimums.

### 5.2 Cross-Compilation

There is no `cmake/platforms/riscv64.cmake` toolchain file in the repository (only Android, iOS, WinMsvc). Users must supply `-DCMAKE_TOOLCHAIN_FILE` manually.

Minimal cross-build for `lldb-server` targeting riscv64-linux-gnu:

```
cmake path/to/llvm-project/llvm -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DLLVM_ENABLE_PROJECTS="clang;lld;lldb" \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DLLVM_HOST_TRIPLE=riscv64-unknown-linux-gnu \
  -DLLDB_ENABLE_PYTHON=0 \
  -DLLDB_ENABLE_LIBEDIT=0 \
  -DLLDB_ENABLE_CURSES=0
```

The sysroot for riscv64 cross-compilation is only available in Debian unstable (not stable). The official LLVM cross-compilation documentation illustrates the Debian unstable debootstrap pattern for riscv64 specifically.

### 5.3 QEMU Integration

LLDB includes test-integration scripts in `lldb/scripts/lldb-test-qemu/` (`setup.sh`, `rootfs.sh`, `run-qemu.sh`). These scripts only support arm and arm64. riscv64 is not wired in. The documentation states "support for other architectures can be added easily" but no riscv64 support has been contributed.

### 5.4 Infrastructure Gaps

- No `cmake/platforms/riscv64.cmake` toolchain file
- No CI Dockerfile for riscv64 in `.ci/` or `.github/workflows/`
- QEMU test scripts do not support riscv64
- LLVM is not in `LLVM_TARGETS_WITH_JIT` for RISC-V (the JIT target set is limited to X86, PowerPC, AArch64, ARM, Mips, SystemZ)

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GDB-remote connection | Yes | Yes | Yes (since Jan 2024) |
| ELF core dump reading | Yes | Yes | Yes (riscv64 since 2024, riscv32 merged May 2025) |
| Register read/write (GPR) | Yes | Yes | Yes |
| Register read/write (FPR) | Yes | Yes | Yes (soft-float configs supported since Sept 2024) |
| Register read/write (vector) | Yes (AVX/SSE) | Yes (NEON/SVE) | No (stubs only; PR #184308 open, not merged) |
| Register alias names (ABI names) | Yes | Yes | Partial -- x8/s0/fp ambiguity in issue #127900 (open since Feb 2025) |
| Hardware watchpoints | Yes | Yes | No (PR #151195 open for software watchpoints) |
| Hardware breakpoints | Yes | Yes | No |
| Function call in expression evaluator | Yes | Yes | Yes (since Oct 2024) |
| TLS variable access | Yes | Yes | Yes (merged Apr 2026) |
| Backtrace through signal handlers | Yes | Yes | Yes (trap handler unwind merged Jan 2026) |
| Backtrace in function prologue | Yes | Yes | Yes (since Jul 2024) |
| char unsigned-by-default | N/A | Yes | Yes (merged Feb 2026) |
| Subtarget feature propagation to disassembler | N/A | N/A | Yes (merged Feb 2026) |
| Subtarget feature propagation to expression compiler | N/A | N/A | No (PR #173048 open since Dec 2025) |
| Return value reading (all types) | Yes | Yes | Partial -- float aggregate correctness open (PR #163931 since Oct 2025) |
| FreeBSD kernel core dump | Yes | Yes | Yes (merged Feb 2026) |
| Live FreeBSD process plugin | Yes | Yes | Draft only (PR #180549, draft since Feb 2026) |
| Software single-step (base ISA) | Yes | Yes | Yes |
| Software single-step (atomics, LR/SC) | Yes | Yes | Yes (fixed Jun 2025) |
| Disassembly of extension instructions | N/A | Yes | Yes (feature propagation merged Feb 2026) |
| CSR register access | N/A | N/A | Enum coverage only; dynamic construction open (PR #203234, Jun 2026) |

---

## 7. CI/CD Infrastructure

**Finding: There is no riscv64 CI for LLDB in llvm/llvm-project.** This was verified by reading the following workflow and CI files directly from the repository:

- `.github/workflows/premerge.yaml` -- LLDB tests run on x86_64 (`llvm-premerge-linux-runners`) and aarch64 (`depot-ubuntu-24.04-arm-16`). No riscv64 runner.
- `.github/workflows/lldb-pylint-action.yml` -- Python linting only, `ubuntu-24.04` (x86_64).
- `.ci/green-dragon/lldb-ubuntu.groovy` -- Jenkins; labels `linux-x86_64` or `linux-aarch64` only.
- `.ci/green-dragon/lldb-windows.groovy` -- Windows native only.
- `.github/workflows/release-binaries.yml` -- Targets ubuntu-22.04 (x86_64), ubuntu-22.04-arm (aarch64), macos-14, Windows. No riscv64.

riscv64 CI that does exist in the repository is scoped exclusively to:

1. `.github/workflows/libc-shared-tests.yml` -- libc cross-compiled tests via QEMU on x86_64 runner. Scope: libc only.
2. `.github/workflows/libc-fullbuild-tests.yml` -- riscv32 bare-metal libc build; testing marked SKIP.
3. `.github/workflows/test-suite.yml` + `riscv64.cmake` -- manually triggered (PR comment `/test-suite`), codegen quality diff only. Scope: compiler backend, not LLDB.

No workflow file contains a meaningful combination of "lldb" and "riscv". LLDB RISC-V patches merge without any riscv64 build or test gate. CI failures referenced in PR reviews (e.g., the `-Werror,-Wc99-extensions` error in PR #184308) are caught on x86_64 or aarch64 premerge builds, not on a riscv64 runner.

The RISE Project added four LLVM CI builder configurations in October 2024 (RVA20, RVA23, RVA23+rvv-vector-bits, RVA23+EVL vectorizer). These cover Clang, LLVM middle-end, MLIR, and LLD. LLDB is not included.

---

## 8. Distribution and Release Status

### 8.1 Official LLVM GitHub Releases

Releases checked: llvmorg-22.1.4 through 22.1.8. Asset filenames across all five releases include `LLVM-{ver}-Linux-X64.tar.xz`, `LLVM-{ver}-Linux-ARM64.tar.xz`, `LLVM-{ver}-macOS-ARM64.tar.xz`, Windows installers, and source tarballs. No asset filename across any of the five releases contains "riscv" or "riscv64". The LLVM project does not publish pre-built riscv64 binary tarballs.

### 8.2 PyPI

The `lldb` package does not exist on PyPI (HTTP 404). The `lldb-python` package (version 19.0.0.dev1) provides wheels for macOS ARM64 and manylinux x86_64 only. No riscv64 wheel exists.

### 8.3 Debian

The `lldb` package in Debian is a meta-package from `llvm-defaults`. Supported architectures include amd64, arm64, armel, armhf, i386, mips64el, ppc64el, s390x. The Debian buildd tracker for sid shows "No entry in riscv64 database, check Packages-arch-specific" for lldb -- meaning no build has been attempted for riscv64. Additionally, the `llvm-toolchain-21` source package on Debian sid riscv64 is BD-Uninstallable due to a missing `libctypes-ocaml-dev:riscv64` dependency (OCaml 5.4.1 rebuild wave; assessed as transient).

### 8.4 Ubuntu 24.04 (Noble)

`lldb`, `lldb-14` through `lldb-18` are available for amd64, arm64, armhf, i386, ppc64el, s390x. `lldb-19` and `lldb-20` are available for amd64 and i386 only. Ubuntu does not ship riscv64 as a supported architecture for Noble. riscv64 is absent.

### 8.5 Arch Linux RISC-V

`lldb-22.1.6-1-riscv64.pkg.tar.zst` is present in the Arch Linux RISC-V `[extra]` repository, packaged by Felix Yan (felixonmars@archlinux.org), install size approximately 31 MB. `lldb-mi-0.0.1-7-riscv64.pkg.tar.zst` is also present. [NEEDS VERIFICATION: the archriscv.felixc.at status page returned HTTP 404 during the adversarial verification pass; positive availability was confirmed in an earlier research pass from the package database.]

### 8.6 Release Branch Status

LLVM release branch dates relevant to RISC-V LLDB:

- LLVM 20.x branch: approximately January 2025
- LLVM 21.x branch: July 22, 2025
- LLVM 22.x branch: January 13, 2026; LLVM 22.1.0 released February 24, 2026
- LLVM 23.x branch: expected approximately July 2026; LLVM 23.1.0 expected approximately September 2026

PR #176472 (GetRegisterInfo riscv32/riscv64 fix) merged January 16, 2026 -- three days after the 22.x branch cut -- and was not backported. A post-merge comment from `resistor` stated that riscv32 debugging "crashes with this assertion in LLDB 22," calling it a regression from LLDB 21. No confirmed backport. The fix will first ship in LLVM 23.

PR #191410 (TLS variable access) merged April 20, 2026 -- LLVM 23 only.

---

## 9. Dependencies

### 9.1 LLVM / JITLink

LLVM's RISCV backend is in `LLVM_ALL_TARGETS` and fully supports riscv64 cross-compilation. LLVM riscv64 ships in Debian sid. However, RISC-V is not in `LLVM_TARGETS_WITH_JIT` (the set is X86, PowerPC, AArch64, ARM, Mips, SystemZ). LLDB's expression evaluator uses JITLink. The LLVM JITLink documentation rates RISC-V ELF support as "Good" (supports almost all relocations). However, JITLink lacks native TLS support for RISC-V, which limits expression evaluation involving TLS variables. This gap has no dedicated tracking issue.

### 9.2 Python

Python 3 itself builds on riscv64. CPython issue [#121201](https://github.com/python/cpython/issues/121201) (filed July 2024, open): `perf_jit_trampoline.c` fails to build on riscv64 for Python 3.13-3.15. Fix PR #121387 is stale as of April 2026. This affects LLDB builds that link the Python 3.13+ interpreter on riscv64.

### 9.3 SWIG

Debian sid ships SWIG 4.4.1-2 for riscv64. No riscv64-specific issues found. SWIG 4.4.0 with Python 3.13 has a known bug breaking the Python Limited API; LLDB's CMake detects this and disables the Limited API. SWIG 4.4.1 resolves this.

### 9.4 External Library Dependencies (libxml2, libedit, ncurses, lzma, zlib, zstd, tree-sitter, Lua)

All are architecture-neutral C libraries available on riscv64 in Debian sid and major riscv64 distributions. No riscv64-specific build or test failures found for any of these dependencies.

### 9.5 compiler-rt

PR [#92714](https://github.com/llvm/llvm-project/pull/92714) (open since May 2024): "RISC-V compiler-rt with no dependency on GCC" -- not resolved. Some sanitizer gaps on riscv64 exist. This does not block core LLDB functionality but limits sanitizer-assisted debugging workflows.

---

## 10. Ecosystem Status

### 10.1 RISE Project

The RISE Project has no published RFP, blog post, benchmark report, or announced project covering LLDB. The 27 RISE blog posts from May 2024 through June 2026 contain zero references to LLDB. The RISE wheel builder does not publish an lldb riscv64 Python package. The closest RISE project to debug tooling is RP007 (OpenOCD Upstreaming), which covers on-chip debug interface firmware, not a source-level debugger. The RISE Developer Tooling Working Group (effective June 25, 2026) is the organizational body that could sponsor LLDB work, but no such project is currently public.

### 10.2 Benchmark Data

No LLDB-specific performance benchmarks for riscv64 exist in any public source found. The only riscv64 LLVM performance data is from RISE RP009 (May 2025, Igalia, SpacemiT-X60), which covers compiler backend optimization via SPEC CPU 2017:

| Optimization | Max Improvement |
|---|---|
| SpacemiT-X60 scheduling model | 15.7% execution time reduction |
| SLP vectorizer spill cost fix | 9.1% execution time reduction |
| IPRA | 3.3% execution time reduction |

This data is for the LLVM compiler backend, not LLDB. No LLDB debugger performance benchmarks (startup time, expression evaluation latency, step throughput) exist for riscv64.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Functional Gaps (LLDB riscv64)

**[#55383](https://github.com/llvm/llvm-project/issues/55383) -- lldb RISC-V support (meta-issue)**
Open since May 11, 2022. No assignee, no milestone. Root tracking issue.

**[#127900](https://github.com/llvm/llvm-project/issues/127900) -- Ambiguous alias for register X8**
Open since February 19, 2025. No assignee, no linked fix PR. Reading register x8 is broken because it has two aliases (s0 and fp), creating ambiguity in the alias lookup logic introduced by PR #124475. Affects any user who reads x8/s0/fp by ABI name.

**[PR #184308](https://github.com/llvm/llvm-project/pull/184308) -- RVV register read/write support**
Open since March 3, 2026. Implements read/write for v0-v31 and vector CSRs via `ptrace NT_RISCV_VECTOR (0x901)`. Currently blocked by: (1) flexible array member in C++ (`uint8_t v_regs[]` triggers `-Werror,-Wc99-extensions`), (2) unresolved question from reviewer lenary on whether `RISCV_HWPROBE_IMA_V` returns false for V subsets like Zve32x, and (3) unresolved question about prctl-based per-process vector access controls. JDevlieghere (code owner) has not yet reviewed.

**[PR #184307](https://github.com/llvm/llvm-project/pull/184307) -- Vector VCSR register definitions**
Open since March 3, 2026. Prerequisite for #184308. Possible conflict with merged PR #142932 (which added overlapping CSR definitions). JDevlieghere review pending.

**[PR #184309](https://github.com/llvm/llvm-project/pull/184309) -- RVV API tests**
Open since March 3, 2026. Blocked by #184308.

**[PR #173048](https://github.com/llvm/llvm-project/pull/173048) -- RISC-V target features in expression compiler**
Open since December 19, 2025. Reviewer lenary asked in April 2026 whether it is still needed after #147990 merged.

**[PR #163931](https://github.com/llvm/llvm-project/pull/163931) -- Fix return value reading**
Open since October 17, 2025. Incorrect handling of float aggregate return values per the RISC-V psABI. Unresolved reviewer question from topperc on float-aggregate ABI edge cases.

**[PR #151195](https://github.com/llvm/llvm-project/pull/151195) -- Software watchpoints**
Open since July 29, 2025. Adds software watchpoint emulation relevant to RISC-V targets without hardware watchpoints.

**[PR #203234](https://github.com/llvm/llvm-project/pull/203234) -- Construct CSR information dynamically**
Open since June 11, 2026. No reviews yet. Proposes building CSR register information at runtime rather than from static tables.

**[PR #180549](https://github.com/llvm/llvm-project/pull/180549) -- Live FreeBSD process plugin for riscv64**
Draft since February 9, 2026. No review activity.

**[PR #180901](https://github.com/llvm/llvm-project/pull/180901) -- Validate invalid target features**
Open since February 11, 2026. Adds validation for invalid RISC-V extension feature strings passed to the LLVM disassembler.

### 11.2 Open Compiler Bugs Affecting Debug Output Correctness

**[#200030](https://github.com/llvm/llvm-project/issues/200030) -- -NAN + 0 produces wrong sign at runtime (riscv64)**
Open since May 27, 2026. RISC-V ISA mandates canonical NaN output from FADD.D, causing observable divergence from amd64/aarch64 behavior for code depending on NaN sign bits.

**[#168257](https://github.com/llvm/llvm-project/issues/168257) -- GlobalISel legalizer miscompile (RV64I)**
Open since November 16, 2025. Incorrectly splits 64-bit shift+OR operations into two basic blocks with wrong live-in placement, causing a verifier crash. Affects base RV64I with no extensions required. Fix PR #194096 is open.

**[#80792](https://github.com/llvm/llvm-project/issues/80792) -- riscv64 miscompile at -O2**
Open since February 6, 2024. With `-O2 -march=rv64gcv` under QEMU (vlen=128), programs using signed char loop variables produce wrong results. InferAlignmentPass identified as responsible. No fix, no assignee.

**[#201252](https://github.com/llvm/llvm-project/issues/201252) -- Clang crash at -O1+ with asm goto (riscv64)**
Open since June 3, 2026. Null pointer dereference in CodeGen Prepare's dominator tree construction. Fix PR #201443 exists but issue remains open.

**[#156393](https://github.com/llvm/llvm-project/issues/156393) -- Backend crash: Incomplete scavenging after 2nd pass**
Open since September 2, 2025. Affects Clang 20.1.8 and 21.1.1 at -O1 and above.

### 11.3 Performance Regression

**[#204486](https://github.com/llvm/llvm-project/issues/204486) -- Performance regression from getRegisterCostTableIndex change**
Open since June 17, 2026. PR #201501 caused s0/s2 register swap on BPI-F3 (rva22u64_v profile), measurable slowdown in recursive Fibonacci with `-O3 -march=rva22u64_v`.

**[#45053](https://github.com/llvm/llvm-project/issues/45053) -- RISC-V DataLayout is wrong**
Open since April 28, 2020. Incorrect DataLayout causes optimization passes to silently skip or misfire. Unresolved for over 5 years.

---

## 12. Objections and Upstream Blockers

**RVV register access series (#184307/#184308/#184309):** Three open PRs stacked on a single branch, open since March 2026. The blocking issues are a C++ standards violation (`-Wc99-extensions`), unresolved ABI questions about partial V-extension subsets (Zve32x), and unanswered prctl questions. The code owner (JDevlieghere) has not reviewed any of the three PRs. This is the single highest-value functional gap and it has been stalled for over three months.

**GetRegisterInfo riscv32 regression in LLVM 22:** PR #176472 was not backported to the 22.x branch. riscv32 debugging crashes in LLDB 22 with an assertion failure. Users on 22.x must build from the main branch or wait for LLVM 23 (expected September 2026).

**x8/s0/fp register alias ambiguity (#127900):** Open since February 2025 with no owner and no fix PR. Any user who inspects x8, s0, or fp by ABI name gets incorrect behavior.

**Expression compiler feature propagation (PR #173048):** Open since December 2025 with a pending reviewer question about whether it is still needed. If it is not merged, expression evaluation using RISC-V extensions (V, Zba, etc.) may produce incorrect JIT output.

**Return value reading (PR #163931):** Float aggregate return value handling is incorrect per the psABI. Open since October 2025 with unresolved reviewer question. Affects `thread step-out` and expression return values for struct types.

**No hardware debug register support:** Neither hardware breakpoints nor hardware watchpoints are implemented. The software watchpoint PR (#151195) is open since July 2025 with no merge timeline.

**No riscv64 CI:** Every LLDB RISC-V patch merges without any riscv64 build or execution test. Regressions are not automatically detected.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The LLDB riscv64 port is functional for basic debugging workflows: remote attach, register read/write (GPR, FPR), ELF core dump analysis, backtracing (including through signal handlers), software single-step (including over LR/SC atomics), expression evaluation with function calls, TLS variable access, and disassembly with extension feature propagation.

Critical missing functionality relative to arm64: vector register access (RVV), hardware watchpoints/breakpoints, live FreeBSD process plugin, float aggregate return value correctness, register alias correctness for x8.

| Work Item | PR/Issue | Status | Effort Estimate |
|---|---|---|---|
| Unblock RVV register access | #184307/#184308/#184309 | Stalled 3+ months | 3-5 person-weeks (fix C++ issue, answer ABI questions, drive review) |
| Fix x8/s0/fp register alias | #127900 | No owner | 1 person-week |
| Fix return value reading | #163931 | Stalled since Oct 2025 | 2-3 person-weeks |
| Merge expression feature propagation | #173048 | Stalled since Dec 2025 | 1 person-week |
| Software watchpoints | #151195 | Open since Jul 2025 | 2-4 person-weeks |
| Dynamic CSR construction | #203234 | Open since Jun 2026 | 2-3 person-weeks |
| Live FreeBSD process plugin | #180549 | Draft since Feb 2026 | 3-5 person-weeks |

### 13.2 Performance Optimization

No LLDB-specific performance benchmarks exist for riscv64. LLDB debugger performance (startup time, expression evaluation latency, step throughput) on riscv64 has not been measured publicly. The LLVM backend optimization work (RP009: scheduling model, SLP vectorizer, IPRA) benefits the compiler but does not directly improve debugger responsiveness.

Relevant gaps: JITLink lacks native TLS support for RISC-V, which affects the speed and correctness of expression evaluation involving TLS variables. This has no active fix.

| Work Item | Status | Effort Estimate |
|---|---|---|
| Establish LLDB riscv64 perf baseline | No work done | 2-3 person-weeks |
| Add native TLS support to JITLink for RISC-V | No tracking issue | 4-8 person-weeks |

### 13.3 CI/CD Infrastructure

There is no riscv64 CI for LLDB anywhere in the LLVM project infrastructure. All LLDB RISC-V patches merge without a riscv64 gate. This is the highest-leverage infrastructure investment because it would catch the register alias bug (#127900), the return value bug (#163931), and future regressions automatically.

| Work Item | Status | Effort Estimate |
|---|---|---|
| Add riscv64 LLDB premerge CI (QEMU-based) | Not started | 4-8 person-weeks (includes QEMU script update, runner provisioning) |
| Add riscv64 native LLDB CI builder | Not started | 2-4 person-weeks (requires hardware access) |
| Wire riscv64 into LLDB test QEMU scripts | Not started | 1-2 person-weeks |

### 13.4 Ecosystem Enablement

No riscv64 LLDB binary is available in any standard distribution channel except Arch Linux RISC-V [NEEDS VERIFICATION]. Debian and Ubuntu do not ship riscv64 LLDB packages. The LLVM project does not publish riscv64 pre-built tarballs. Users must build from source.

| Work Item | Status | Effort Estimate |
|---|---|---|
| Debian riscv64 LLDB package | Not initiated | Depends on Debian riscv64 port maturity; 2-4 person-weeks to file and shepherd |
| LLVM official riscv64 release binary | Not initiated | Requires CI first; 4-8 person-weeks |
| RISE project LLDB RFP | No public announcement | 1-2 person-weeks (proposal) |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Unblock and merge RVV register access (#184307/8/9) | 3-5 | Unassigned | Critical |
| Functional | Fix x8/s0/fp register alias ambiguity (#127900) | 1 | Unassigned | High |
| Functional | Fix return value reading for float aggregates (#163931) | 2-3 | sga-sc (stalled) | High |
| Functional | Merge expression compiler feature propagation (#173048) | 1 | daniilavdeev (stalled) | High |
| Functional | Software watchpoints (#151195) | 2-4 | daniilavdeev (stalled) | Medium |
| Functional | Dynamic CSR construction (#203234) | 2-3 | ayushsahay1837 (unreviewed) | Medium |
| Functional | Live FreeBSD process plugin (#180549) | 3-5 | mchoo7 (draft) | Low |
| Performance | Establish riscv64 LLDB perf baseline | 2-3 | None | High |
| Performance | JITLink native TLS for RISC-V | 4-8 | None | Medium |
| CI/CD | riscv64 LLDB premerge CI (QEMU-based) | 4-8 | None | Critical |
| CI/CD | Wire riscv64 into LLDB QEMU test scripts | 1-2 | None | High |
| Ecosystem | Debian riscv64 LLDB package | 2-4 | None | Medium |
| Ecosystem | LLVM official riscv64 release binary | 4-8 | None (requires CI first) | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [lldb RISC-V support (meta-issue #55383)](https://github.com/llvm/llvm-project/issues/55383)
- [LLDB RISC-V ambiguous x8 alias (#127900)](https://github.com/llvm/llvm-project/issues/127900)
- [RVV register definitions PR #184307](https://github.com/llvm/llvm-project/pull/184307)
- [RVV register access PR #184308](https://github.com/llvm/llvm-project/pull/184308)
- [RVV API tests PR #184309](https://github.com/llvm/llvm-project/pull/184309)
- [TLS variable access PR #191410](https://github.com/llvm/llvm-project/pull/191410)
- [GetRegisterInfo riscv32/riscv64 fix PR #176472](https://github.com/llvm/llvm-project/pull/176472)
- [Return value reading PR #163931](https://github.com/llvm/llvm-project/pull/163931)
- [Software watchpoints PR #151195](https://github.com/llvm/llvm-project/pull/151195)
- [SubtargetFeatures in ArchSpec PR #173046](https://github.com/llvm/llvm-project/pull/173046)
- [RISC-V features in disassembler PR #173047](https://github.com/llvm/llvm-project/pull/173047)
- [RISC-V features in expression compiler PR #173048](https://github.com/llvm/llvm-project/pull/173048)
- [FreeBSD kernel core riscv64 PR #180670](https://github.com/llvm/llvm-project/pull/180670)
- [Live FreeBSD process plugin riscv64 PR #180549](https://github.com/llvm/llvm-project/pull/180549)
- [Dynamic CSR construction PR #203234](https://github.com/llvm/llvm-project/pull/203234)
- [LR/SC atomic sequence fix PR #127505](https://github.com/llvm/llvm-project/pull/127505)
- [MCJIT RISC-V relocations PR #126266](https://github.com/llvm/llvm-project/pull/126266)
- [Function call support in expression evaluator PR #99336](https://github.com/llvm/llvm-project/pull/99336)
- [char unsigned-by-default PR #182260](https://github.com/llvm/llvm-project/pull/182260)
- [Trap handler unwind plan PR #166531](https://github.com/llvm/llvm-project/pull/166531)
- [CPython perf_jit_trampoline riscv64 issue #121201](https://github.com/python/cpython/issues/121201)
- [RISE RP009 LLVM SPEC Optimization blog post](https://riseproject.dev/blog/2025/05/project-rp009-llvm-spec-optimization/)
- [RISE RP006 RISC-V LLVM Testing CI blog post](https://riseproject.dev/blog/2024/10/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)
- [LLVM How To Cross-Compile LLVM](https://llvm.org/docs/HowToCrossCompileLLVM.html)
- [LLDB build documentation](https://lldb.llvm.org/resources/build.html)
- [GlobalISel legalizer miscompile on riscv64 #168257](https://github.com/llvm/llvm-project/issues/168257)
- [riscv64 miscompile at -O2 #80792](https://github.com/llvm/llvm-project/issues/80792)
- [NaN sign bit divergence riscv64 #200030](https://github.com/llvm/llvm-project/issues/200030)
- [asm goto crash riscv64 #201252](https://github.com/llvm/llvm-project/issues/201252)
- [Register scavenging crash #156393](https://github.com/llvm/llvm-project/issues/156393)
- [Performance regression getRegisterCostTableIndex #204486](https://github.com/llvm/llvm-project/issues/204486)
- [RISC-V DataLayout incorrect #45053](https://github.com/llvm/llvm-project/issues/45053)
- [compiler-rt RISC-V GCC independence #92714](https://github.com/llvm/llvm-project/pull/92714)
- [Arch Linux RISC-V port](https://archriscv.felixc.at)
- [Debian LLDB package tracker](https://tracker.debian.org/pkg/lldb)