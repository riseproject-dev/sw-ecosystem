---
title: LLDB
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: optional
  - name: SWIG
    relation: build-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="lldb" %}

# LLDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for LLDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LLDB is the debugger sub-project of the LLVM Project, hosted at [llvm/llvm-project](https://github.com/llvm/llvm-project) under `lldb/`. The project home is [lldb.llvm.org](https://lldb.llvm.org/). LLDB has no independent foundation or board; it is governed under the LLVM Developer Policy, with the LLVM Foundation (a 501(c)(3) nonprofit) providing legal and fiscal backing for infrastructure, events and outreach, not technical direction. License: Apache 2.0 with LLVM Exceptions.

Named maintainers with identifiable employers (from `lldb/Maintainers.md`, corroborated independently by live research):

| Name | GitHub | Affiliation | Area |
|---|---|---|---|
| Jason Molenda | jasonmolenda | Apple | ABI, Unwinding, Watchpoints, debugserver |
| Jim Ingham | jimingham | Apple | Breakpoint, Commands, Target/Process Control |
| Adrian Prantl | adrian-prantl | Apple | DWARF |
| Alex Langford | bulbazord | Apple | CMake/build |
| Charles Zablit | charles-zablit | Apple | Windows platform |
| David Spickett | DavidSpickett | Arm | ABI, ELF, Linux platform, lldb-server |
| Greg Clayton | clayborg | Meta | Interpreter, DWARF, MachO |
| Omair Javaid | omjavaid | Linaro | Windows platform |
| John Harrison | ashgti | Google | lldb-dap |
| Zequan Wu | ZequanWu | Google | (unspecified) |
| Jonas Devlieghere | JDevlieghere | (lead maintainer; company not listed) | overall LLDB lead, active reviewer on RISC-V patches |

Apple holds the largest single bloc of named maintainer slots. No RISC-V chip company (SiFive, Andes, ESWIN, Syntacore, Alibaba/DAMO) holds a named maintainer slot in LLDB. Corporate sponsors of the LLVM Foundation as of the prior report (Diamond: AMD, Apple, Google, Qualcomm; Platinum: Arm, Fastly, Huawei, Meta, Modular, NVIDIA; Gold: Access Softek, AWS, Fujitsu, MathWorks, Microsoft, Sony Interactive) were not re-verified in this pass and are carried forward as [NEEDS VERIFICATION].

Community culture on new architecture ports is staged and RFC-gated per the LLVM Developer Policy: (1) an experimental phase requiring an active maintainer, a supporting community, clean and non-contentious code, and available hardware or simulators; (2) official status after 3+ months of demonstrated stability with broad test coverage and public buildbots; (3) an RFC on LLVM Discourse addressing how the target meets these requirements, required before patches are reviewed. This is welcoming at the entry point but rigorous at the graduation point (testing, CI, maintainers).

## 2. Port History and Upstreaming Timeline

The earliest RISC-V-related LLDB commit found is **2021-01-07**, by Luis Marques: "[LLDB][RISCV] Add RISC-V ArchSpec and rv32/rv64 variant detection" (sha `15f5971`; the corresponding review is Phabricator [D86292](https://reviews.llvm.org/D86292)). The dedicated RISC-V ABI plugin landed later, on **2023-09-29**, "[RISC-V] Add RISC-V ABI plugin" by tedwoodward, closing out the long-stalled review [D62732](https://reviews.llvm.org/D62732) ("[RISCV] Add SystemV ABI", opened 2019) that the meta-tracking issue [#55383](https://github.com/llvm/llvm-project/issues/55383) (opened 2022-05-11, still open, zero comments, no linked PRs) was created to unblock.

Since 2024, the real tracking of RISC-V/LLDB work has happened implicitly through PR titles rather than through #55383. Verified merge history (cross-checked against LLVM release branch-cut dates: 18.1.0 2024-02-27, 19.1.0 2024-09-17, 20.1.0 2025-03-04, 21.1.0 2025-08-26, 22.1.0 2026-02-24, 23.1.0 2026-08-25):

| Date merged | PR | Description | First release |
|---|---|---|---|
| 2024-01-30 | [#79990](https://github.com/llvm/llvm-project/pull/79990) | Fix gdb-server connection error (riscv:rv64 to riscv64 triple mapping) | 18.1.0 |
| 2024-06-05 | [#93297](https://github.com/llvm/llvm-project/pull/93297) | Add RegisterContextPOSIXCore for RISC-V 64 | 19.1.0 |
| 2024-07-16 | [#90075](https://github.com/llvm/llvm-project/pull/90075) | Fix breakpoint over undecoded instruction | 19.1.0 |
| 2024-07-17 | [#99043](https://github.com/llvm/llvm-project/pull/99043) | Function-prologue backtrace fix | 19.1.0 |
| 2024-07-18 | [#99039](https://github.com/llvm/llvm-project/pull/99039) | RISCV target-specific info in API tests | 19.1.0 |
| 2024-09-04 | [#104547](https://github.com/llvm/llvm-project/pull/104547) | Support optionally-disabled FPR for riscv64 (soft-float) | 19.1.0 |
| 2024-10-02 | [#99336](https://github.com/llvm/llvm-project/pull/99336) | Function-call support in expression evaluator | 20.1.0 |
| 2025-01-31 | [#124758](https://github.com/llvm/llvm-project/pull/124758) | Add RISCV to Makefile.rules (fixes -mriscv build error) | 20.1.0 |
| 2025-02-20 | [#124475](https://github.com/llvm/llvm-project/pull/124475) | ABI register-alias names (fixes [#124023](https://github.com/llvm/llvm-project/issues/124023)) | 20.1.0 |
| 2025-04-14 | [#126266](https://github.com/llvm/llvm-project/pull/126266) | Required RISCV relocations in MCJIT | 21.1.0 |
| 2025-06-24 | [#127505](https://github.com/llvm/llvm-project/pull/127505) | LR/SC atomic sequence fix (merged then reverted same day as [#145597](https://github.com/llvm/llvm-project/pull/145597) for a bot failure) | superseded |
| 2025-06-30 | [#146072](https://github.com/llvm/llvm-project/pull/146072) | LR/SC atomic sequence fix, reland | 21.1.0 |
| 2025-09-03 | [#156506](https://github.com/llvm/llvm-project/pull/156506) | Make atomic region stepping test more robust | 22.1.0 |
| 2025-09-18 | [#158161](https://github.com/llvm/llvm-project/pull/158161) | RISCV unwinding enable (briefly reverted 2025-09-19 for breaking non-RISC-V buildbots, re-landed with CMake gating) | 22.1.0 |
| 2025-09-25 | [#160550](https://github.com/llvm/llvm-project/pull/160550) | uint64_t for ADDI emulation (UBSan fix) | 22.1.0 |
| 2025-10-01 | [#161497](https://github.com/llvm/llvm-project/pull/161497) | Fix TestSymbolFileJSON for RISC-V | 22.1.0 |
| 2025-11-11 | [#167490](https://github.com/llvm/llvm-project/pull/167490) | Fix FLW/FSW/FLD/FSD in instruction emulator | 22.1.0 |
| 2026-01-13 | [#166531](https://github.com/llvm/llvm-project/pull/166531) | Trap-handler unwind plan | 22.1.0 |
| 2026-01-16 | [#176472](https://github.com/llvm/llvm-project/pull/176472) | Support RV32 and RV64 in GetRegisterInfo (fixes [#175092](https://github.com/llvm/llvm-project/issues/175092), a regression introduced in LLDB 22) | 22.1.0 (fix itself lands 3 days after the 22.x branch cut; ships in 23.1.0) |
| 2026-02-18 | [#173047](https://github.com/llvm/llvm-project/pull/173047) | ELF-attribute-driven RISCV feature update in disassembler | 22.1.0 |
| 2026-02-18 | [#182126](https://github.com/llvm/llvm-project/pull/182126) | Skip TestDisassembler when RISCV target missing | 22.1.0 |
| 2026-02-19/20 | [#182260](https://github.com/llvm/llvm-project/pull/182260) | Char unsigned by default on RISC-V (psABI correctness) | 22.1.0 |
| 2026-02-25 | [#147434](https://github.com/llvm/llvm-project/pull/147434) | Function unwinding via instruction emulation - **closed unmerged**; jasonmolenda rejected the approach as producing incorrect UnwindPlans; superseded by #158161 | N/A |
| 2026-04-20 | [#191410](https://github.com/llvm/llvm-project/pull/191410) | TLS variable access on RISC-V (glibc PT_TLS offset fix) | 23.1.0 |
| 2026-06-04 | [#142932](https://github.com/llvm/llvm-project/pull/142932) | Handle CSR subsets in RV32 core dumps (new NT_CSREGMAP note) | 23.1.0 |
| 2026-06-10 | [#147990](https://github.com/llvm/llvm-project/pull/147990) | RISCV feature-attribute support, override default feature (11-month review) | 23.1.0 |
| 2026-07-06/07 | [#207675](https://github.com/llvm/llvm-project/pull/207675) | Add RISC-V Architecture plugin for trap/EBREAK validation | 23.1.0 |
| 2026-07-21 | [#209070](https://github.com/llvm/llvm-project/pull/209070) | Fix x8 register aliasing for gdb-remote targets (fixes [#127900](https://github.com/llvm/llvm-project/issues/127900), the ambiguous s0/fp/x8 alias left open by #124475) | 23.1.0 |
| 2026-08-12 | [#203234](https://github.com/llvm/llvm-project/pull/203234) | Construct CSR information dynamically (custom-extension overlap handling) | 23.1.0 |
| 2026-08-20 | [#217668](https://github.com/llvm/llvm-project/pull/217668) | Make CSR patch map a local static (Coverity fix) | 23.1.0 |
| 2026-08-30 | [#216087](https://github.com/llvm/llvm-project/pull/216087) | Add CSRI patch set for 'Xqci' extension | 23.1.0 |
| 2026-04-15 | [#192184](https://github.com/llvm/llvm-project/pull/192184) | [FreeBSDKernel] Implement trapframe unwinding | 22.1.0/23.1.0 |
| 2026-09-19 | [#224847](https://github.com/llvm/llvm-project/pull/224847) | [FreeBSDKernel] Update kernel/kmod ELF type | unreleased |
| 2026-09-19 | [#224856](https://github.com/llvm/llvm-project/pull/224856) | [FreeBSDKernel] Trust forced kernel module load addresses (riscv/ppc64 fix) | unreleased |
| 2026-09-22 | [#225555](https://github.com/llvm/llvm-project/pull/225555) | DynamicRegisterInfo::RegisterSetWithStorage (touches RISCV dynamic register code) | unreleased |

Note on the register-alias fix chain: issue [#124023](https://github.com/llvm/llvm-project/issues/124023) ("RISC-V has missing aliases for registers", filed 2025-01-22, closed 2025-02-20) was fixed by PR #124475, which mapped ABI names (tp, s1-s11, t0-t6, a0-a7) to numeric x4-x31 aliases but explicitly left x8's ambiguity (it can be `fp` or `s0`) as a follow-on, tracked as #127900. That follow-on was not resolved until PR #209070 merged 2026-07-21, five months after the prior report's cutoff. Total: roughly 38 `[lldb][RISCV]`-titled PRs plus 5 FreeBSD-riscv64-specific PRs merged from 2024-01 through 2026-09, none of it gated by riscv64 CI (Section 7).

The primary reviewer/merger of record across this history is Jonas Devlieghere (LLDB lead maintainer, affiliation not listed in Maintainers.md), David Spickett (Arm) for earlier patches, and lenary as a recurring RISC-V-domain reviewer. A claim in an earlier version of this assessment that contributor daniilavdeev's activity "strongly suggests Syntacore affiliation" is not corroborated by any source found in this pass and is marked [NEEDS VERIFICATION]. No single company has taken ownership of the port.

## 3. Upstream Support Tier

`llvm/docs/SupportPolicy.md` defines a formal two-tier system: **Core tier** (production code including compilers, debuggers such as LLDB, linkers and libraries; actively tested and released; every LLVM developer is responsible for not breaking it; requires operational buildbots or risks downgrade/removal) and **Peripheral tier** (experimental backends, disabled-by-default options, sub-community work; must not break core tier; must have active maintainers). LLDB is Core tier, which under this policy implies an operational-buildbot requirement per target it supports. RISC-V/LLDB has no such buildbot (confirmed in Section 7), which is a direct tension with the stated Core-tier policy, though LLVM has not moved to downgrade or remove RISC-V LLDB support over it.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core-tier CI (GitHub Actions premerge) | Yes (`llvm-premerge-linux-runners`) | Yes (Windows arm64; macOS arm64 via `apple-runners`) | No |
| Jenkins/Green Dragon LLDB pipeline | Yes (`linux-x86_64` label) | Yes (`linux-aarch64` label) | No |
| Official release binaries | Yes | Yes (Linux and macOS) | No |
| Distro binary packages | Yes (all major distros) | Yes (all major distros) | Only Ubuntu 26.04 Resolute (Section 8) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

All RISC-V support is implemented as C++ plugins; there are no RISC-V assembly trampolines anywhere under `lldb/` (confirmed by a `.S`-file search returning zero results) - unlike compiler-rt/libunwind, single-step and CFI unwinding are done entirely through a C++ instruction interpreter.

**ABI plugin** - `lldb/source/Plugins/ABI/RISCV/ABISysV_riscv.cpp` (913 lines) / `.h` (128 lines): SysV ABI for riscv32 and riscv64, dispatched via `m_is_rv64`; covers ilp32/lp64 and the float-ABI variants (lp64f, lp64d, ilp32f, ilp32d). Complete for its declared scope.

**Instruction emulator** - `EmulateInstructionRISCV.cpp` (2070 lines) / `.h` (144 lines), plus `RISCVInstructions.h` (352 lines) and `RISCVCInstructions.h` (357 lines, compressed/RVC decode). Used for software single-step and stack-unwind, not hardware trap-and-emulate. Fully covers RV32I/RV64I, M (mul/div), A (atomic LR/SC and AMO, including the June 2025 fix/reland), F (single-float) and D (double-float), and C (compressed). It has zero coverage for Zba/Zbb/Zbc/Zbs (bit-manipulation) or V (vector) - confirmed by direct grep for those tokens returning no matches.

**Register plumbing** - `RegisterContextPOSIX_riscv{32,64}`, `RegisterInfoPOSIX_riscv{32,64}`, `RegisterInfos_riscv{32,64}.h`, `NativeRegisterContextLinux_riscv64.cpp` (378 lines, ptrace-based, GPR and FPR regsets only), `RegisterContextPOSIXCore_riscv{32,64}` (ELF core dumps), `RegisterContextFreeBSDKernelCore_riscv64` (FreeBSD kernel cores), `RegisterContextDarwin_riscv32` (macOS/Darwin core-file support). `lldb-riscv-register-enums.h` (4733 lines) defines every CSR address 0-4095 by name but exposes only the `vlenb` CSR for the V extension; there is no v0-v31 vector register slot and no `NT_RISCV_VECTOR` ptrace regset anywhere in this tree.

**DWARF** - `lldb/source/Utility/RISCV_DWARF_Registers.h` (4748 lines) documents the 7 vector CSRs (vstart, vxsat, vxrm, vcsr, vtype, vl, vlenb) in a comment but defines DWARF numbers only for `vlenb`; there are no per-register V0-V31 DWARF numbers.

**JIT** - LLDB has no dedicated RISC-V JIT backend; code generation is delegated to LLVM's MC/ORC JIT (`llvm/lib/Target/RISCV`, outside `lldb/`). The only RISC-V-specific logic inside LLDB's JIT path is one branch in `lldb/source/Expression/IRExecutionUnit.cpp`: for `triple.isRISCV64()` it forces `llvm::CodeModel::Large` because JIT-placed code can land more than +-2GB from the target binary.

**RVV/vector support - confirmed absent.** A search for `vfloat32m1_t` under `lldb/` returns zero results; a search for `rvv` returns two hits, neither of which is vector-register support (one is an unrelated `TypeSystemClang.cpp` AST-builtin passthrough, the other an unrelated npm lockfile hash collision).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ABI plugin | Full | Full | Full (RV32/RV64, all float-ABI variants) |
| GPR/FPR read-write | Full (AVX/SSE) | Full (NEON) | Full |
| Vector register read-write | Full | Full (NEON/SVE) | Absent (stubs only; open PR #184308) |
| Hardware watchpoints/breakpoints | Yes | Yes | No (software watchpoint PR #151195 open since 2025-07-29) |
| Function-call expression evaluation | Yes | Yes | Yes (merged 2024-10-02) |
| TLS variable access | Yes | Yes | Yes (merged 2026-04-20) |
| Unwinding through signal trampolines | Yes | Yes | Yes (merged 2026-01-13) |
| Bit-manipulation (Zba/Zbb/Zbc/Zbs) decode | N/A | N/A | Absent |

## 5. Build System, Cross-Compilation, and Toolchain

LLDB has no dedicated `BUILDING.md`, `INSTALL`, riscv64 CMake toolchain file, or riscv64 Dockerfile in-tree (all checked directly against the live `main` branch and returned 404 or "does not exist"). The relevant guidance lives in `llvm/docs/GettingStarted.md` (host toolchain requirements, applying to LLDB since it builds inside the monorepo) and `lldb/docs/resources/build.md` (cross-compilation recipe, illustrated only for arm64/Android/FreeBSD but directly portable to riscv64).

Toolchain minimums (`GettingStarted.md`), with rationale: CMake >= 3.20.0 (a hard minimum of 3.31.0 is already announced starting with LLVM 24, so this floor is rising); host compiler minimums of Clang 5.0, Apple Clang 10.0, or GCC 7.4, because LLVM is written against a modern C++ subset and "older versions of these compilers have often crashed or miscompiled LLVM"; Python >= 3.8 (3.11+ on Windows) and SWIG >= 4, both only required when `LLDB_ENABLE_PYTHON` is on. RISC-V is listed explicitly as a supported build target/host platform ("Linux | RISC-V | GCC, Clang") in the GettingStarted hardware table, and `RISCV` is included in `LLVM_ALL_TARGETS` by default, so no extra flag is needed to get riscv64 codegen/disassembly support built into LLDB.

Adapted cross-compile command (from the documented arm64 example, substituting riscv64):

```
cmake <path-to-monorepo>/llvm-project/llvm -G Ninja \
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

`LLDB_ENABLE_PYTHON=0`, `LLDB_ENABLE_LIBEDIT=0`, `LLDB_ENABLE_CURSES=0` are the documented flags to shrink dependencies to just libc/libc++ when only `lldb-server` needs to be cross-built for riscv64. For a full build with optional dependencies, the doc recommends `qemu-debootstrap` to build a target sysroot.

QEMU usage: LLDB's own docs mention QEMU only via `qemu-debootstrap` for sysroot construction, not for test execution. `lldb/scripts/lldb-test-qemu/` only wires up arm/arm64; riscv64 is not implemented there, despite the documentation's claim that "support for other architectures can be added easily." The only actual QEMU-based riscv64 execution pattern anywhere in the repository is `.github/workflows/containers/libc/Dockerfile`, which installs `qemu-user-binfmt` plus `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu` for the **libc** project's CI, not LLDB's. `clang/cmake/caches/Fuchsia-stage2.cmake` includes `riscv64-unknown-linux-gnu` in its per-target runtimes loop and sets the same `LLDB_ENABLE_CURSES=OFF`/`LLDB_ENABLE_LIBEDIT=OFF` flags for its stage-2 toolchain build, confirming the pattern is used elsewhere in the project, just not for LLDB CI.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GDB-remote connection | Yes | Yes | Yes (since 2024-01-30) |
| ELF core dump reading | Yes | Yes | Yes (riscv64 and riscv32) |
| GPR read/write | Yes | Yes | Yes |
| FPR read/write | Yes | Yes | Yes (soft-float configs since 2024-09-04) |
| Vector register read/write | Yes (AVX/SSE) | Yes (NEON/SVE) | No; PR [#184308](https://github.com/llvm/llvm-project/pull/184308) open since 2026-03-03, stalled |
| Register alias names correctness | Yes | Yes | Yes (x4-x31 fixed 2025-02-20 by #124475; x8/s0/fp ambiguity fixed 2026-07-21 by #209070) |
| Hardware watchpoints/breakpoints | Yes | Yes | No; software-watchpoint PR [#151195](https://github.com/llvm/llvm-project/pull/151195) open since 2025-07-29 |
| Function calls in expression evaluator | Yes | Yes | Yes (since 2024-10-02) |
| TLS variable access | Yes | Yes | Yes (merged 2026-04-20) |
| Backtrace through signal handlers | Yes | Yes | Yes (trap-handler unwind merged 2026-01-13) |
| Backtrace in function prologue | Yes | Yes | Yes (since 2024-07-17) |
| char unsigned-by-default (psABI) | N/A | Yes | Yes (merged 2026-02-19/20) |
| Subtarget feature propagation to disassembler | N/A | N/A | Yes (merged 2026-02-18) |
| Subtarget feature propagation to expression compiler | N/A | N/A | No; PR [#173048](https://github.com/llvm/llvm-project/pull/173048) open since 2025-12-19 |
| Return-value reading (all types) | Yes | Yes | Partial; float-aggregate correctness open in PR [#163931](https://github.com/llvm/llvm-project/pull/163931) since 2025-10-17 |
| FreeBSD kernel core dump | Yes | Yes | Yes (multiple merges through 2026-09-19) |
| Live FreeBSD process plugin | Yes | Yes | Draft only, PR [#180549](https://github.com/llvm/llvm-project/pull/180549) since 2026-02-09 |
| Software single-step over atomics (LR/SC) | Yes | Yes | Yes (fixed 2025-06-30) |
| Bit-manipulation (Zba/Zbb/Zbc/Zbs) decode | N/A | N/A | Absent |
| CSR register access | N/A | N/A | Enum coverage plus dynamic construction (merged 2026-08-12, PR #203234); Xqci custom-extension CSRs added 2026-08-30 (#216087) |

Floating-point/NaN semantics: this is a compiler-backend gap, not an LLDB gap, but affects what a debugger observes. Issue [#200030](https://github.com/llvm/llvm-project/issues/200030) ("`-NAN + 0 = -NAN` with double literals on riscv64") is open, with inconsistent constant-folding vs. runtime FP arithmetic producing a positive canonical NaN instead of the RISC-V-spec-mandated negative NaN pattern for literal operands - a user single-stepping through such code in LLDB will observe divergent NaN sign bits from amd64/aarch64 runs of the same source. Issue [#224119](https://github.com/llvm/llvm-project/issues/224119) (inefficient half/bfloat handling on NaN-boxing targets including RISC-V) is also open.

Security hardening: no hardware watchpoint or breakpoint support on riscv64 (Section 4) is itself a debugging-capability gap rather than a target-hardening gap; no separate riscv64-specific hardening regression was found in this pass.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for LLDB anywhere in llvm/llvm-project.** This was verified two independent ways: (1) a direct grep for the intersection of "riscv" and "lldb" tokens across all 73 files in `.github/workflows/` returned zero matching files; (2) each LLDB-relevant CI entry point was read individually.

Files that build/test LLDB: `.github/workflows/premerge.yaml` (the workflow that compiles and runs `check-lldb` on PRs, via `.ci/compute_projects.py` detecting changed files under `lldb/`) runs only on `llvm-premerge-linux-runners` (x86_64, self-hosted), `llvm-premerge-windows-2022-runners` (x86_64), and `[self-hosted, macOS, ARM64, apple-runners]`. `lldb-pylint-action.yml` is a Python lint job triggered on `lldb/test/API/**.py`, with no runner/architecture specificity. `docs.yml`, `ci-post-commit-analyzer.yml`, and `release-binaries.yml` touch LLDB only for documentation builds, a ccache comment, and installing LLDB's Python test dependencies for release packaging, respectively. The Jenkins/Green Dragon pipelines `.ci/green-dragon/lldb-ubuntu.groovy` and `lldb-windows.groovy` (Swift.org's dedicated LLDB CI) run only on `linux-x86_64`/`linux-aarch64` labels or `windows-server-2019`; neither references riscv in any form. No `.gitlab-ci.yml`, `.cirrus.yml`, or root `Jenkinsfile` exists in the repository at all.

Files that do reference riscv/riscv64 (7 total) belong exclusively to the **libc** and generic **test-suite** (compiler codegen benchmark) projects: `test-suite.yml`, `.ci-related/test-suite/{llvm,riscv64}.cmake`, `libc-overlay-tests.yml`, `libc-fullbuild-tests.yml` (the riscv32 baremetal entry has `testing: SKIP` - it does not even execute tests), `libc-shared-tests.yml`, and `containers/libc/Dockerfile`. None of these workflows, jobs, or runner configs mention `lldb`, `debugger`, or anything under the `lldb/` tree.

RISC-V source code for LLDB (~30 files, Section 4) exists and is exercised only as part of the generic x86_64/aarch64/macOS premerge and Jenkins builds (native compilation for whatever architecture the runner happens to be), never via a dedicated riscv64 runner, riscv64 Docker image, or QEMU-emulated riscv64 job.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions premerge build+test | Yes | Yes (self-hosted apple-runners for macOS; Windows arm64 runners) | No |
| Jenkins/Green Dragon dedicated LLDB pipeline | Yes | Yes | No |
| QEMU-emulated execution of any LLDB test | N/A (native) | N/A (native) | No (QEMU riscv64 is used only by the sibling llvm-libc CI, not LLDB) |
| RISE-funded/operated CI runners for LLDB | N/A | N/A | None found (see Section 12) |

## 8. Distribution and Release Status

**Official GitHub releases** (llvmorg-23.1.0 through 23.1.2, and the prior 22.1.4-22.1.8 series): every release's asset list is Linux-ARM64, Linux-X64, macOS-ARM64, and Windows (x64/ARM64/woa64) builds plus source tarballs and docs. No asset in any checked release contains "riscv" or "riscv64" in its filename. LLVM does not publish pre-built riscv64 binary tarballs.

**PyPI**: no package named `lldb` exists on PyPI at all (`https://pypi.org/pypi/lldb/json` and `https://pypi.org/simple/lldb/` both return HTTP 404); the riscv64-wheel question is moot since there is no package to check.

**RISE GitLab wheel-builder proxy**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/lldb/` redirects (HTTP 303) through to the same PyPI 404. No `lldb` package exists there either.

**Debian**: `lldb` is a meta-package from `llvm-defaults`, supported on amd64, arm64, armel, armhf, i386, mips64el, ppc64el, s390x. The Debian buildd tracker shows "No entry in riscv64 database" for `lldb` in sid, meaning no build has ever been attempted for riscv64.

**Ubuntu 24.04 (Noble)**: `lldb`, `lldb-14` through `lldb-18` build for amd64, arm64, armhf, i386, ppc64el, s390x; `lldb-19`/`lldb-20` for amd64 and i386 only. riscv64 is absent entirely.

**Ubuntu 26.04 (Resolute)** - the one confirmed positive source: `https://packages.ubuntu.com/search?keywords=lldb&suite=resolute&searchon=names&section=all` lists riscv64 among the built architectures (amd64 arm64 armhf i386 ppc64el riscv64 s390x) for `lldb` (1:21.1.6-71), `liblldb-dev`, `lldb-18` (1:18.1.8-20ubuntu8), `lldb-19` (1:19.1.7-20ubuntu4), `lldb-20` (1:20.1.8-2ubuntu8), `lldb-21` (1:21.1.8-6ubuntu1), and `liblldb-18` through `liblldb-22` including their `-dev` packages. This means Ubuntu, starting with the 26.04LTS/"Resolute" cycle, is the only distribution channel that ships prebuilt riscv64 LLDB binaries for versions 18 through 21.

**Arch Linux RISC-V**: `lldb-22.1.6-1-riscv64.pkg.tar.zst` is reported present in the `[extra]` repository at `archriscv.felixc.at` [NEEDS VERIFICATION - the status page returned HTTP 404 during a later verification pass in this research, so positive availability rests on an earlier, unconfirmed check].

**Bottom line for a user today**: a working riscv64 LLDB binary is obtainable only by running Ubuntu 26.04 (Resolute) or newer, or by building from source using the recipe in Section 5. Debian, Ubuntu 24.04, upstream GitHub release tarballs, and PyPI/RISE wheel channels all provide none.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| LLVM | runtime-dependency, critical | riscv64 is in `LLVM_ALL_TARGETS`, cross-compiles fine, built by default | riscv64 not in `LLVM_TARGETS_WITH_JIT` (only X86, PowerPC, AArch64, ARM, Mips, SystemZ); JITLink is rated "Good" for RISC-V ELF relocations but lacks native TLS support, with no dedicated tracking issue | No official riscv64 release tarballs (checked 22.1.4-22.1.8 and 23.1.0-23.1.2); ships in Debian sid as a separate riscv64 package | LLDB's expression evaluator depends on JITLink; see project-reports/llvm.md |
| Python | runtime-dependency, optional | builds on riscv64 | `perf_jit_trampoline.c` fails to build on riscv64 for CPython 3.13-3.15, tracked at [python/cpython#121201](https://github.com/python/cpython/issues/121201) (open since 2024-07, fix PR stale as of 2026-04) | affects any LLDB build linking Python 3.13+ | Required only when `LLDB_ENABLE_PYTHON=1` |
| SWIG | build-dependency, optional | Debian sid ships SWIG 4.4.1-2 for riscv64 | no riscv64-specific issues found | n/a (build-time tool only) | SWIG 4.4.0 + Python 3.13 breaks the Limited API; LLDB's CMake detects and disables it; resolved in 4.4.1 |
| CMake | build-dependency, critical | arch-neutral build tool, available on riscv64 | n/a | ships on riscv64 distros | Minimum 3.20.0 today; LLVM 24 raises the hard floor to 3.31.0 |
| GCC | build-dependency, critical | `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu` cross packages are the documented and CI-proven (via the sibling libc Dockerfile) way to cross-compile riscv64 LLDB/lldb-server | n/a (build-time) | riscv64 cross-toolchain packages ship in Ubuntu and Debian | GCC 7.4 is the documented host-compiler minimum for building LLVM/LLDB itself |
| QEMU | test-dependency, critical | n/a | `qemu-user-binfmt` is the proven in-repo pattern for running cross-built riscv64 binaries under emulation (used today only by the llvm-libc CI, not by any LLDB CI); LLDB's own docs use `qemu-debootstrap` only for sysroot construction, not test execution | n/a | LLDB's own `lldb-test-qemu` scripts do not support riscv64 (only arm/arm64) |
| libxml2 | runtime-dependency, optional | arch-neutral, available on riscv64 in Debian sid | no riscv64-specific failures found | ships on riscv64 distros | XML parsing for symbol files/crash logs |
| libedit | runtime-dependency, optional | arch-neutral, available on riscv64 | no riscv64-specific failures found | ships on riscv64 distros | interactive REPL line editing |
| ncurses | runtime-dependency, optional | arch-neutral, available on riscv64 | no riscv64-specific failures found | ships on riscv64 distros | terminal UI |
| xz / liblzma | runtime-dependency, optional | arch-neutral, available on riscv64 | no riscv64-specific failures found | ships on riscv64 distros | compression for debug info |
| zlib | runtime-dependency, optional | arch-neutral, available on riscv64 | no riscv64-specific failures found | ships on riscv64 distros | compression |
| zstd | runtime-dependency, optional | arch-neutral, available on riscv64 | no riscv64-specific failures found | ships on riscv64 distros | compression |
| Lua | runtime-dependency, optional | arch-neutral, available on riscv64 | no riscv64-specific failures found | ships on riscv64 distros | alternative scripting binding to Python |
| compiler-rt (LLVM subproject, indirect) | indirect | riscv64 supported with caveats | some sanitizer gaps on riscv64; PR [#92714](https://github.com/llvm/llvm-project/pull/92714) "RISC-V compiler-rt with no dependency on GCC" open since 2024-05 | ships as part of LLVM riscv64 in Debian sid | limits sanitizer-assisted debugging workflows, not core LLDB functionality |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#55383](https://github.com/llvm/llvm-project/issues/55383) | lldb RISC-V support (meta-issue) | Open since 2022-05-11 | Informational | Zero comments, no linked PRs; not an active checklist against the real 2024-2026 work |
| [#127900](https://github.com/llvm/llvm-project/issues/127900) | Ambiguous alias for register X8 | Fixed by PR #209070, merged 2026-07-21 | Resolved | Was open ~17 months; `fp` renamed to `s0` with `x8` as an alternate name, per lenary's ABI guidance |
| [#175092](https://github.com/llvm/llvm-project/issues/175092) | GetRegisterInfo hardcodes RISCV-64 | Fixed by PR #176472, merged 2026-01-16 | Resolved (was a regression) | resistor confirmed this was a regression introduced in LLDB 22, not a legacy gap; not backported to the 22.x branch, first fixed in 23.1.0 |
| [#124023](https://github.com/llvm/llvm-project/issues/124023) | RISC-V missing register aliases | Fixed by PR #124475, merged 2025-02-20 | Resolved | Left the x8 case for #127900 |
| [#86646](https://github.com/llvm/llvm-project/issues/86646) | Why doesn't LLDB reuse Clang's MCDisassembler for RISCV | Closed 2024-09-23 | Informational | Closed as addressed by the ELF-attribute feature work (#173047/#147990) |
| [#180061](https://github.com/llvm/llvm-project/issues/180061) | Improve FreeBSD support on LLDB | Open since 2026-02-05 | Medium | Broader tracking issue whose scope includes riscv64 FreeBSD kernel-debugging work |
| [PR #163931](https://github.com/llvm/llvm-project/pull/163931) | Fix return-value reading | Open since 2025-10-17 | High (correctness) | Float-aggregate return values per RISC-V psABI; unresolved reviewer question on ABI edge cases |
| [PR #173048](https://github.com/llvm/llvm-project/pull/173048) | RISC-V target features in expressions | Open since 2025-12-19 | Medium | Direct sequel to merged #147990; reviewer lenary has asked whether it is still needed |
| [PR #184307](https://github.com/llvm/llvm-project/pull/184307) | Vector VCSR register definitions | Open since 2026-03-03 | Medium (blocking #184308) | Possible conflict with merged #142932's CSR definitions |
| [PR #184308](https://github.com/llvm/llvm-project/pull/184308) | RVV register read/write support | Open since 2026-03-03, stalled 3+ months | High | Blocked by a `-Werror,-Wc99-extensions` flexible-array-member issue, an unresolved question on `RISCV_HWPROBE_IMA_V` for V subsets (Zve32x), and unanswered prctl per-process vector-access questions; code owner has not yet reviewed |
| [PR #184309](https://github.com/llvm/llvm-project/pull/184309) | RVV API tests | Open since 2026-03-03 | Low | Blocked by #184308 |
| [PR #214034](https://github.com/llvm/llvm-project/pull/214034) | Add float register stubs | Open since 2026-08-04 | Medium | |
| [PR #180549](https://github.com/llvm/llvm-project/pull/180549) | FreeBSD riscv64 live-process plugin | Draft since 2026-02-09 | Low | No review activity |
| [PR #151195](https://github.com/llvm/llvm-project/pull/151195) | Software watchpoints | Open since 2025-07-29 | Medium | Relevant to RISC-V targets that lack hardware watchpoints |
| [#200030](https://github.com/llvm/llvm-project/issues/200030) | -NAN + 0 = -NAN with double literals on riscv64 | Open | Correctness (compiler, observed via debugger) | Inconsistent constant-folding vs. runtime FP arithmetic |
| [#224119](https://github.com/llvm/llvm-project/issues/224119) | Inefficient half/bfloat handling on NaN-boxing targets (RISC-V, LoongArch) | Open | Low | Compiler-backend, not LLDB |
| [#227119](https://github.com/llvm/llvm-project/issues/227119) | -fveclib=SLEEF wrongly lowers to AArch64 SVE symbol names on riscv64 | Open, reported 2026-09 | Medium | Compiler-backend, breaks linking |
| [#168257](https://github.com/llvm/llvm-project/issues/168257) | GlobalISel legalizer miscompile (RV64I) | Open since 2025-11-16 | High (compiler) | Verifier crash; fix PR #194096 open |
| [#80792](https://github.com/llvm/llvm-project/issues/80792) | riscv64 miscompile at -O2 under QEMU | Open since 2024-02-06 | High (compiler) | No fix, no assignee |
| [#45053](https://github.com/llvm/llvm-project/issues/45053) | RISC-V DataLayout is wrong | Open since 2020-04-28 | High (compiler) | Unresolved for over 5 years |
| [PR #92714](https://github.com/llvm/llvm-project/pull/92714) | RISC-V compiler-rt with no dependency on GCC | Open since 2024-05 | Medium | Sanitizer-assisted debugging gap |

Compiler-backend bugs (#200030, #227119, #168257, #80792, #45053, and the further list in the source research: #223906, #221163, #171978, #227227, #209237, #164153, #149583) are included because they affect what a user debugging riscv64 code with LLDB will observe, but they are LLVM codegen defects, not LLDB defects, and should not be sized as LLDB investment (Section 14).

## 12. Objections and Upstream Blockers

**RVV register access series (#184307/#184308/#184309)**: three PRs stacked on one branch, open since 2026-03-03 and stalled 3+ months. Blockers are a C++ standards violation (`-Werror,-Wc99-extensions` on a flexible array member), an unresolved ABI question from reviewer lenary about whether `RISCV_HWPROBE_IMA_V` correctly reports false for partial-V extensions like Zve32x, an unanswered question about prctl-based per-process vector-access control, and the fact that code owner JDevlieghere has not yet reviewed any of the three. This is the single highest-value stalled functional gap.

**No riscv64 CI anywhere in llvm-project for LLDB** (Section 7): every LLDB RISC-V patch merges without a riscv64 build or execution gate. This is why regressions such as #175092 (the LLDB-22 GetRegisterInfo crash) went undetected until a user filed a bug, and it is the reason the readiness grade is capped below yellow regardless of the depth of functional work already merged.

**No RISE involvement found.** The RISE Project blog (all 35 posts through 2026-09-28, checked via full sitemap, including full-text review of the two closest candidate posts - "Working with Igalia to improve RISC-V LLVM Continuous Integration" and "Project RP009: LLVM SPEC Optimization") contains zero substantive references to LLDB. RISE's GitLab Python wheel builder (`riseproject.gitlab.io/python/wheel_builder/`) does not list `lldb`. The `riseproject-dev` GitHub org (repository search and org-wide code search) has no LLDB-related repository; the only hit anywhere in the org is a passing mention of "lldb" as an example tool in the `kernel-and-virtualization-wg` working-group charter's scope description - not a funded project, blog post, or CI-runner usage record. RISE's 8 Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 General Members do not include LLVM/LLDB as a project-level entity, though several member companies contribute to LLVM/LLDB upstream through their own engineers.

**GetRegisterInfo riscv32 regression not backported**: PR #176472 merged 3 days after the LLVM 22.x branch cut and was not backported; riscv32 debugging crashes with an assertion in LLDB 22 releases. Users on 22.x must build from main or wait for 23.x.

**No hardware debug register support**: neither hardware breakpoints nor hardware watchpoints are implemented for riscv64; the software-watchpoint PR (#151195) has been open since 2025-07-29 with no stated merge timeline.

**Acceptance probability for pending work**: the RVV series faces the highest technical and organizational barrier (style/API-surface objections plus an unreviewed backlog); the smaller, single-purpose PRs (#163931 return-value fix, #173048 expression feature propagation, #214034 float register stubs) face lower technical barriers and are primarily gated on reviewer bandwidth, consistent with the pattern seen in #147990 (an 11-month review cycle whose primary friction was reviewer style rigor, not technical disagreement).

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

Justification: No upstream riscv64 CI exists for LLDB. A direct read of `.github/workflows/premerge.yaml`, `lldb-pylint-action.yml`, `release-binaries.yml`, all 73 GitHub Actions workflow files (grepped for an lldb+riscv intersection, zero matches), and the Jenkins/Green Dragon `lldb-ubuntu.groovy`/`lldb-windows.groovy` pipelines shows LLDB is built and tested only on x86_64 Linux, x86_64/aarch64 Windows, and arm64 macOS (see the [premerge workflow](https://github.com/llvm/llvm-project/blob/main/.github/workflows/premerge.yaml)). Upstream also publishes no riscv64 release binaries (GitHub releases llvmorg-22.x/23.x ship only Linux ARM64/X64 and macOS ARM64/Windows assets). Applying the distribution floor: Ubuntu 26.04 "Resolute" does build and ship riscv64 binaries for `lldb`, `lldb-18` through `lldb-21`, and `liblldb-18` through `liblldb-22` (see the [Ubuntu package search](https://packages.ubuntu.com/search?keywords=lldb&suite=resolute&searchon=names&section=all)), while Ubuntu 24.04 Noble and Debian sid do not attempt a riscv64 build at all. Because riscv64-specific patch status inside Ubuntu's packaging was not verified one way or the other, the unknown-patch-status rule applies, capping the grade at orange rather than yellow. This is not a broken/red state: core RISC-V functionality (ABI, register contexts, unwinding, disassembly, TLS access, function-call expression evaluation) is implemented and actively maintained via roughly 38 merged `[lldb][RISCV]` PRs since 2024.

Pending work that could change the grade: open PRs #184307/#184308/#184309 (RVV vector register support, stalled 3+ months awaiting maintainer review), #163931 (return-value reading fix), #173048 (expression-compiler RISC-V feature propagation), #214034 (float register stubs), and #180549 (draft FreeBSD riscv64 live-process plugin) would raise the grade only if merged and paired with CI. No riscv64 CI job (build-only or test) exists anywhere in llvm-project for LLDB, and no RISE-funded work or RFP targeting LLDB was found - RISE's Kernel-and-Virtualization working group charter mentions lldb only as an example tool, with no funded project or CI-runner usage tied to it. Adding even a build-only riscv64 CI job would move this to yellow; adding a test-executing riscv64 job would move it toward blue/green.

## 14. Investment Analysis

RISE has funded no LLDB-specific work (Section 12): its named funded projects are Rust tier-1 (RP004), LLVM SPEC optimization (RP009, compiler backend not debugger), Go, V8, OpenJDK/SLEEF, IREE, and OpenSBI. The RISC-V Runners CI infrastructure RISE operates (announced 2026-03-24) is not wired into any LLDB workflow. None of the effort below is already covered by RISE or any other funded initiative found in this research.

### 14.1 Functional Enablement

Basic riscv64 debugging is functional today: remote attach, GPR/FPR read-write, ELF core dump analysis, backtracing including through signal handlers, software single-step (including over LR/SC atomics), expression evaluation with function calls, TLS variable access, and disassembly with extension-feature propagation. Critical gaps relative to arm64 remain: vector register access (RVV), hardware watchpoints/breakpoints, a live FreeBSD process plugin, and float-aggregate return-value correctness.

| Work Item | PR/Issue | Status | Effort Estimate |
|---|---|---|---|
| Unblock RVV register access | #184307/#184308/#184309 | Stalled 3+ months | 3-5 person-weeks (fix the C99-extensions issue, answer the Zve32x/prctl questions, drive review to completion) |
| Fix return-value reading for float aggregates | #163931 | Stalled since 2025-10-17 | 2-3 person-weeks |
| Merge expression-compiler feature propagation | #173048 | Stalled since 2025-12-19 | 1 person-week |
| Add float register stubs | #214034 | Open since 2026-08-04 | 1-2 person-weeks |
| Software watchpoints | #151195 | Open since 2025-07-29 | 2-4 person-weeks |
| Live FreeBSD process plugin | #180549 | Draft since 2026-02-09 | 3-5 person-weeks |

### 14.2 Performance Optimization

No LLDB-specific performance benchmarks for riscv64 exist in any public source found (RISE blog, LLVM Discourse, web search). All quantitative "RISC-V + LLVM" performance data found (the Igalia/RISE RP009 SPEC CPU 2017 work: up to 15% execution-time reduction, geomean ~9% improvement vs. an 18-month-prior Clang baseline on SpacemiT-X60) belongs to the LLVM compiler backend, not the LLDB debugger, and must not be conflated with debugger performance. Debugger-specific metrics (startup time, expression-evaluation latency, step throughput) have not been measured publicly for riscv64.

| Work Item | Status | Effort Estimate |
|---|---|---|
| Establish an LLDB riscv64 performance baseline | No work done | 2-3 person-weeks |
| Add native TLS support to JITLink for RISC-V | No tracking issue | 4-8 person-weeks |

### 14.3 CI/CD Infrastructure

This is the highest-leverage investment: adding even a build-only riscv64 CI job would raise the readiness grade to yellow per the grading rule in Section 13, and a riscv64 gate would have caught the LLDB-22 GetRegisterInfo regression (#175092) automatically rather than by user report.

| Work Item | Status | Effort Estimate |
|---|---|---|
| Add riscv64 LLDB premerge CI (QEMU-based, build-only to start) | Not started | 4-8 person-weeks (QEMU script work, runner provisioning) |
| Add riscv64 native LLDB CI builder (test-executing) | Not started | 2-4 person-weeks beyond the above, requires riscv64 hardware or RISE runner access |
| Wire riscv64 into LLDB's own `lldb-test-qemu` scripts | Not started | 1-2 person-weeks |

### 14.4 Ecosystem Enablement

No riscv64 LLDB binary is available in any standard distribution channel except Ubuntu 26.04 Resolute (Section 8) and, unverified, Arch Linux RISC-V. Debian and Ubuntu 24.04 do not ship riscv64 LLDB packages; upstream does not publish riscv64 release tarballs; PyPI and the RISE wheel builder have no `lldb` package at all (there is none for any architecture, since LLDB's Python bindings are not distributed via PyPI under that name).

| Work Item | Status | Effort Estimate |
|---|---|---|
| Debian riscv64 LLDB package | Not initiated | 2-4 person-weeks to file and shepherd, contingent on Debian riscv64 port maturity |
| LLVM official riscv64 release binary | Not initiated | 4-8 person-weeks, requires CI first |
| RISE project LLDB RFP/proposal | No public announcement found | 1-2 person-weeks to draft |

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add build-only riscv64 LLDB premerge CI | 4-8 | Unassigned | Critical |
| Functional | Unblock and merge RVV register access (#184307/8/9) | 3-5 | Unassigned (JDevlieghere review pending) | Critical |
| Functional | Fix return-value reading for float aggregates (#163931) | 2-3 | Unassigned (stalled) | High |
| Functional | Merge expression-compiler feature propagation (#173048) | 1 | Unassigned (stalled) | High |
| CI/CD | Add riscv64 native/test-executing CI builder | 2-4 | Unassigned | High |
| Performance | Establish riscv64 LLDB performance baseline | 2-3 | None | High |
| Functional | Add float register stubs (#214034) | 1-2 | Unassigned | Medium |
| Functional | Software watchpoints (#151195) | 2-4 | Unassigned | Medium |
| Ecosystem | Debian riscv64 LLDB package | 2-4 | None | Medium |
| Performance | JITLink native TLS for RISC-V | 4-8 | None | Medium |
| CI/CD | Wire riscv64 into LLDB QEMU test scripts | 1-2 | None | Medium |
| Functional | Live FreeBSD process plugin (#180549) | 3-5 | Unassigned (draft) | Low |
| Ecosystem | LLVM official riscv64 release binary | 4-8 | None (requires CI first) | Low |

## 15. References

- [Meta-tracking issue: lldb RISC-V support (#55383)](https://github.com/llvm/llvm-project/issues/55383)
- [Register aliasing bug (#124023)](https://github.com/llvm/llvm-project/issues/124023) and its fix, [PR #124475](https://github.com/llvm/llvm-project/pull/124475)
- [x8 alias ambiguity (#127900)](https://github.com/llvm/llvm-project/issues/127900) and its fix, [PR #209070](https://github.com/llvm/llvm-project/pull/209070)
- [GetRegisterInfo hardcoded to riscv64 (#175092)](https://github.com/llvm/llvm-project/issues/175092) and its fix, [PR #176472](https://github.com/llvm/llvm-project/pull/176472)
- [Why doesn't LLDB use Clang's MCDisassembler (#86646)](https://github.com/llvm/llvm-project/issues/86646)
- [Improve FreeBSD support on LLDB (#180061)](https://github.com/llvm/llvm-project/issues/180061)
- [PR #79990 - gdb-server connection fix](https://github.com/llvm/llvm-project/pull/79990)
- [PR #93297 - RegisterContextPOSIXCore for RISC-V 64](https://github.com/llvm/llvm-project/pull/93297)
- [PR #99039 - RISCV target-specific API tests](https://github.com/llvm/llvm-project/pull/99039)
- [PR #99043 - function-prologue backtrace fix](https://github.com/llvm/llvm-project/pull/99043)
- [PR #90075 - breakpoint over undecoded instruction fix](https://github.com/llvm/llvm-project/pull/90075)
- [PR #99336 - function calls in expressions](https://github.com/llvm/llvm-project/pull/99336)
- [PR #104547 - optionally disabled FPR support](https://github.com/llvm/llvm-project/pull/104547)
- [PR #124758 - RISCV in Makefile.rules](https://github.com/llvm/llvm-project/pull/124758)
- [PR #126266 - RISCV relocations in MCJIT](https://github.com/llvm/llvm-project/pull/126266)
- [PR #127505 - LR/SC atomic sequence fix (reverted)](https://github.com/llvm/llvm-project/pull/127505) and [revert PR #145597](https://github.com/llvm/llvm-project/pull/145597)
- [PR #146072 - LR/SC atomic sequence fix (reland)](https://github.com/llvm/llvm-project/pull/146072)
- [PR #156506 - atomic region stepping test robustness](https://github.com/llvm/llvm-project/pull/156506)
- [PR #158161 - RISCV unwinding enable](https://github.com/llvm/llvm-project/pull/158161)
- [PR #160550 - uint64_t ADDI emulation fix](https://github.com/llvm/llvm-project/pull/160550)
- [PR #161497 - TestSymbolFileJSON fix](https://github.com/llvm/llvm-project/pull/161497)
- [PR #163931 - return value reading fix (open)](https://github.com/llvm/llvm-project/pull/163931)
- [PR #166531 - trap handler unwind plan](https://github.com/llvm/llvm-project/pull/166531)
- [PR #167490 - float load/store emulator fix](https://github.com/llvm/llvm-project/pull/167490)
- [PR #147434 - function unwinding via instruction emulation (closed, unmerged)](https://github.com/llvm/llvm-project/pull/147434)
- [PR #147990 - RISCV feature attribute support](https://github.com/llvm/llvm-project/pull/147990)
- [PR #173047 - RISCV target features in disassembler](https://github.com/llvm/llvm-project/pull/173047)
- [PR #173048 - RISCV target features in expressions (open)](https://github.com/llvm/llvm-project/pull/173048)
- [PR #182126 - TestDisassembler skip marker](https://github.com/llvm/llvm-project/pull/182126)
- [PR #182260 - char unsigned by default on RISC-V](https://github.com/llvm/llvm-project/pull/182260)
- [PR #184307 - vector VCSR register definitions (open)](https://github.com/llvm/llvm-project/pull/184307)
- [PR #184308 - RVV register access (open)](https://github.com/llvm/llvm-project/pull/184308)
- [PR #184309 - RVV API tests (open)](https://github.com/llvm/llvm-project/pull/184309)
- [PR #191410 - TLS variable access on RISC-V](https://github.com/llvm/llvm-project/pull/191410)
- [PR #142932 - CSR subsets in RV32 core dumps](https://github.com/llvm/llvm-project/pull/142932)
- [PR #207675 - RISC-V Architecture plugin trap/EBREAK](https://github.com/llvm/llvm-project/pull/207675)
- [PR #203234 - dynamic CSR construction](https://github.com/llvm/llvm-project/pull/203234)
- [PR #216087 - Xqci CSRI patch set](https://github.com/llvm/llvm-project/pull/216087)
- [PR #217668 - CSR patch map local static](https://github.com/llvm/llvm-project/pull/217668)
- [PR #214034 - float register stubs (open)](https://github.com/llvm/llvm-project/pull/214034)
- [PR #180549 - FreeBSD riscv64 live-process plugin (draft)](https://github.com/llvm/llvm-project/pull/180549)
- [PR #192184 - FreeBSDKernel trapframe unwinding](https://github.com/llvm/llvm-project/pull/192184)
- [PR #224847 - FreeBSDKernel ELF type update](https://github.com/llvm/llvm-project/pull/224847)
- [PR #224856 - FreeBSDKernel forced load address fix](https://github.com/llvm/llvm-project/pull/224856)
- [PR #225555 - DynamicRegisterInfo::RegisterSetWithStorage](https://github.com/llvm/llvm-project/pull/225555)
- [PR #151195 - software watchpoints (open)](https://github.com/llvm/llvm-project/pull/151195)
- [PR #92714 - RISC-V compiler-rt without GCC dependency](https://github.com/llvm/llvm-project/pull/92714)
- [CPython perf_jit_trampoline riscv64 issue #121201](https://github.com/python/cpython/issues/121201)
- [-NAN + 0 sign bug on riscv64 (#200030)](https://github.com/llvm/llvm-project/issues/200030)
- [half/bfloat NaN-boxing handling (#224119)](https://github.com/llvm/llvm-project/issues/224119)
- [-fveclib=SLEEF wrong symbol names on riscv64 (#227119)](https://github.com/llvm/llvm-project/issues/227119)
- [GlobalISel legalizer miscompile RV64I (#168257)](https://github.com/llvm/llvm-project/issues/168257)
- [riscv64 miscompile at -O2 (#80792)](https://github.com/llvm/llvm-project/issues/80792)
- [RISC-V DataLayout incorrect (#45053)](https://github.com/llvm/llvm-project/issues/45053)
- [Premerge CI workflow](https://github.com/llvm/llvm-project/blob/main/.github/workflows/premerge.yaml)
- [Ubuntu package search: lldb on Resolute (26.04)](https://packages.ubuntu.com/search?keywords=lldb&suite=resolute&searchon=names&section=all)
- [Debian package tracker: lldb](https://tracker.debian.org/pkg/lldb)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at)
- [LLDB build documentation](https://lldb.llvm.org/resources/build.html)
- [LLVM Discourse: Is lldb for riscv ready to use?](https://discourse.llvm.org/t/is-lldb-for-riscv-ready-to-use/68326)
- [RISE: Working with Igalia to improve RISC-V LLVM Continuous Integration](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)
- [RISE: Project RP009 - LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE FAQ](https://riseproject.dev/faq/)
- [Igalia: Boosting RISC-V Application Performance - An 8-Month LLVM Journey](https://blogs.igalia.com/compilers/2025/05/05/boosting-risc-v-application-performance-an-8-month-llvm-journey/)
- [Igalia: Improvements to RISC-V vector code generation in LLVM](https://blogs.igalia.com/compilers/2025/05/28/improvements-to-risc-v-vector-code-generation-in-llvm/)
- [LLVM Dev Meeting 2025: LLVM vs GCC on RISC-V using SPEC CPU benchmarks (slides)](https://llvm.org/devmtg/2025-06/slides/technical-talk/li-risc.pdf)
- [CodeLLDB issue #752 - cannot attach to QEMU riscv64 gdbserver](https://github.com/vadimcn/codelldb/issues/752)
- [Phabricator D62732 - RISCV SystemV ABI](https://reviews.llvm.org/D62732)
- [Phabricator D86292 - RISC-V ArchSpec and rv32/rv64 detection](https://reviews.llvm.org/D86292)
- [Phabricator D128250 - initial lldb-server support for RISC-V](https://reviews.llvm.org/D128250)
- [Phabricator D132789 - more instruction decode/execute for EmulateInstructionRISCV](https://reviews.llvm.org/D132789)