---
title: LuaJIT
parent: Project Reports
color: orange
dependencies:
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: libffi
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="luajit" %}

# LuaJIT

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for LuaJIT<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LuaJIT is a tracing JIT compiler for the Lua 5.1 language. It provides an interpreter (a bytecode VM written in DynASM, a macro-assembler preprocessor) and a trace-based JIT backend, both written per-architecture in hand-tuned assembly. LuaJIT is used as the scripting engine in Nginx/OpenResty, Neovim, KOReader, game engines, and numerous embedded networking applications. Repository: [LuaJIT/LuaJIT](https://github.com/LuaJIT/LuaJIT). Homepage: [luajit.org](https://luajit.org/). License: MIT (also includes Lua 5.1/5.2 code under MIT, and dlmalloc under public domain). No CLA/DCO process exists.

**Governance:** Single-maintainer (BDFL, Benevolent Dictator For Life). Mike Pall is the sole maintainer and copyright holder (2005-2026). A `git shortlog -sne` over the 500 most recent commits on the default branch `v2.1` shows 100 percent authored by Mike Pall; no other committer has write or merge authority, and there is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository. Contributors are credited only in commit-message trailers ("Thanks to X"). Per [luajit.org/status.html](https://luajit.org/status.html), releases are "rolling," the git repository is the authoritative origin, and version numbers are POSIX-timestamp-derived rather than committee-voted. LuaJIT has no foundation affiliation: it is not under the Linux Foundation, not a RISE Project member, and not formally under Lua.org.

**Port policy:** Mike Pall's documented position, stated directly in [Issue #628](https://github.com/LuaJIT/LuaJIT/issues/628) (2020-10-25), is that a pure interpreter port "will not be accepted - you need to eventually submit the JIT-compiler support," and that he gated any new port on seven questions: what will be contributed, which ISA variants/extensions/ABI, which OS, who the contributors and affiliations are, whether sponsorship exists for the port itself, whether sponsorship exists for review/integration, and whether ongoing maintenance is sponsored. Every architecture accepted into LuaJIT to date arrived only as a sponsored, funded engagement implemented personally by Mike Pall - there is no open community-contribution pathway for a new port, consistent with the single-committer model.

**Corporate sponsors** of past ports (from historical funding records associated with the project): Athena Capital Research (x64, 2009), Google Inc. (x64 matching funds, 2010), QUALCOMM Inc. (ARM, 2011), MIPS Technologies, Inc. (MIPS, 2011), Gehtsoft USA, LLC (bytecode load/save, 2011), Neomantra Corp (FFI callbacks, 2011), Snabb (LuaJIT 2.0 completion, 2012), GIANTS Software GmbH (profiling, 2013), CloudFlare Inc. (performance, 2013-), Cisco Systems, Inc. (MIPS32 soft-float 2015, MIPS64 2016, ARM64 JIT 2016, PPC soft-float 2017), Linaro (co-sponsored ARM64 JIT, 2016), Wave Computing (MIPS64r6, 2019), fmad engineering llc (string buffers, 2021), and OpenResty Inc. (table-traversal JIT, 2021). No RISC-V hardware vendor (SiFive, SpacemiT, Andes, Alibaba) has appeared as a direct LuaJIT sponsor. luajit.org currently states Mike Pall "is working on unrelated projects and cannot accept bigger sponsorships at this time."

**Community culture on new ports:** the maintainer's stance, documented across Issue #628 and carried into PR #1267, is extremely demanding on code quality and extremely slow to engage. Despite PR #1267 accumulating approximately 145 reactions (46 thumbs-up, 56 rocket, 33 heart per the most recent tally; an earlier tally recorded 144 with 55 rocket reactions - the discrepancy is a one-reaction rounding/timing difference between fetches, not a material fact) and 26 comments including real bug fixes from community reviewers, Mike Pall has left no comment on the PR at any point since it opened on 2024-09-08.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-10-19 | Issue #628 "Add support for RISC-V" opened by petar-jovanovic (Syrmia); WIP code by Djordje Kovacevic and Milos Poletanovic shared as non-review-ready. | [Issue #628](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2020-10-25 | Mike Pall responds with detailed requirements: JIT backend mandatory, ABI/extension scope, contributor affiliations, and sponsorship for development, review, and long-term maintenance. He also criticizes the shared WIP DynASM code for undefined variables, non-standard disassembler style, and unverified `lj_ccall.c` ABI handling. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2021-01-06 | Community demand recorded: "libluajit is needed for sysbench! Please, port it to RISC-V." | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2021-01-08 | petar-jovanovic states further work requires sponsorship and progress will be sporadic until resolved. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2021-09-16 | Wei Wu (lazyparser, PLCT Lab) announces RISC-V as a tier-1 platform goal and commits PLCT Lab (approximately 20 engineers working on V8, OpenJDK, SpiderMonkey, etc.) to the porting effort. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2021-09-21 | Mike Pall reiterates that funding alone is not sufficient; the port needs deep expertise across ISA, Lua, C, compiler internals, and the LuaJIT codebase. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2022-06-28 to 2023-06-23 | PLCT Lab / ISCAS fork (`plctlab/LuaJIT`) progresses from DynASM bring-up through a "mostly functioning" interpreter (301/304 tests passing) to a working JIT, per the project's own incremental status updates on Issue #628. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2024-06-21 | Port declared "comparable to the existing Aarch64 backend in functionality and reliability"; two blockers named: extension-probing mechanism and long-term maintenance sponsorship. HWPROBE approach suggested by rwmjones (Red Hat). | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2024-06-27 | Downstream PR to the OpenResty fork, [openresty/luajit2 #236](https://github.com/openresty/luajit2/pull/236), adds HWPROBE-based extension detection; XThead extensions demoted to a compile-time option. | [PR #236](https://github.com/openresty/luajit2/pull/236) |
| 2024-09-08 | PR [#1267](https://github.com/LuaJIT/LuaJIT/pull/1267) "Add support for RISC-V 64 Linux" opened against upstream `LuaJIT/LuaJIT` by IgnotaYun (Wang Bingzhen, PLCT Lab / ISRC at ISCAS), from branch `plctlab/LuaJIT:v2.1-riscv64-pr`. fwsGonzo confirms it works same day. Commit/line counts differ slightly between sources: 23 commits / 11,166 additions per the PLCT status thread vs. 21 commits / +11,292/-8 across 30 files per a later direct fetch of the PR head - both describe the same branch at different points in its force-push history, not a factual conflict. One source also names the author "infiWang" in a single instance; every other source (including the PR's own attribution and 20+ comment citations) says IgnotaYun, so "infiWang" is treated as a transcription artifact [NEEDS VERIFICATION]. | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2024-10-29 | ccuser44 approves the PR. | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2024-11-23 | Buristan reports a `pcall(pcall)` segfault caused by a register-allocation conflict in `vm_riscv64.dasc` (`NARGS8:RC` used before being saved); IgnotaYun fixes it same day by switching to a temporary register (`NARGS8:TMP0`). | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2024-12-23/26 | Buristan reports a `math.min`/`math.max` NaN-semantics mismatch: the initial backend used `fmin.d`/`fmax.d`, which per the RISC-V spec return NaN only when both operands are NaN, contradicting LuaJIT's required `op1 < op2 ? op1 : op2` semantics (NaN must propagate if either operand is NaN). corsix confirms this is an inherent RISC-V base-ISA gap (no flags register, no FPR conditional moves) shared with ARM64's own avoidance of `fmin`/`fmax`; fix replaces the native min/max instructions with a compare-plus-conditional-move sequence. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-01-02/03 | TamNguyen1507 reports a build failure on Yocto SDK 3.1.31 (`illegal operands 'auipc x5,%got_pcrel_hi(pow)'`); IgnotaYun identifies the root cause as Binutils < 2.35 lacking the `%got_pcrel_hi` relocation, recommending Binutils >= 2.37. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-05-02 | Ruinland (Andes Technology, RISE System Library Working Group) posts a formal RISE Developer Appreciation Program RFP offering up to 3000 EUR to complete the riscv64 upstreaming work on PR #1267. IgnotaYun acknowledges this could address Mike Pall's long-term-maintenance-sponsorship requirement. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-10-28 | A newer GNU `as` deprecates the `.option arch -c` directive; fix pushed to the PR branch the same day. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-11 | Ruinland's RISE RFP invitation is reiterated. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-02-04 | Port tested on SpacemiT K1 and K3 (BananaPi F3 boards) and VisionFive 2; a minor FFI uninitialized-variable warning noted. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-03-29 | braydonf confirms the port works on SiFive U74 cores while building KOReader for RISC-V. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-06-16 | PR branch rebased/force-pushed; still open, not merged. | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-07-08, 2026-08-11 | Further force-pushes by IgnotaYun; the 2026-08-11 push includes a VM-builder-support commit co-authored with Heinrich Schuchardt. As of this push the branch carries 21 commits. No maintainer comment appears anywhere in the visible thread through this date. | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |

**Key contributors:** IgnotaYun (Wang Bingzhen, PLCT Lab / ISRC at ISCAS, undergraduate intern, author of all commits on the PR branch); Heinrich Schuchardt (co-author, VM builder support); Ruinland (Andes Technology, RISE liaison); corsix (identified the min/max NaN architectural issue); Buristan (identified and helped fix the pcall segfault and NaN-semantics bugs); rwmjones (Red Hat, recommended the HWPROBE extension-detection approach); ccuser44 (sole PR approval).

**Is it fully upstream? No.** The repository's default branch is `v2.1` at HEAD `c6ffc141a8762b41703f9287d63d93622a13dd8f` (dated 2026-09-08). A direct `git clone` of this commit and a `grep -ril riscv` over `src/`, `dynasm/`, and `doc/` (excluding `.git/`) returns zero matches: no `lj_target_riscv.h`, `lj_asm_riscv64.h`, `vm_riscv64.dasc`, `dasm_riscv.h`, or any equivalent exists anywhere in the tracked upstream tree. `git log --grep=riscv -i` on `master`, `v2.0`, and `v2.1` returns zero commits, and GitHub's commit-search API independently returns zero results for `riscv repo:LuaJIT/LuaJIT` (a control query, `fix repo:LuaJIT/LuaJIT`, returned 902 hits, confirming the search tooling itself works). All 21-23 RISC-V commits exist exclusively on the unmerged PR #1267 branch.

## 3. Upstream Support Tier

LuaJIT publishes no formal, written tier-policy document. Support tier is inferred from [luajit.org/status.html](https://luajit.org/status.html), which lists 7 actively supported architectures/OS combinations (Linux/BSD/macOS/Windows/Android/iOS, current-gen consoles) and marks RISC-V 64-bit as **"(TBA)"** - to be announced, pending RVA22+ profile compliance - acknowledged as a desired future target with no committed timeline. There is no PLATFORMS.md, SUPPORT.md, or docs/platforms/ file in the repository. Stated EOL policy: "no plans to add historic architectures or to continue support for end-of-life (EOL) architectures," which does not apply to RISC-V (an active target, just unmerged).

**Supported architectures in upstream v2.1** (`src/lj_arch.h`): x86, x64, ARM (32-bit), ARM64, PPC, MIPS32, MIPS64. RISC-V is absent from this list entirely.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture code merged | Yes | Yes | No |
| JIT backend | Yes (hand-tuned) | Yes (hand-tuned) | No upstream (hand-tuned, full, in unmerged PR #1267) |
| Official status page listing | Current | Current | (TBA) |
| CI in upstream repo | None | None | None |
| Release-blocking | Yes | Yes | Not applicable |
| Binary packages from upstream project itself | Source only (no GitHub Releases published) | Source only | Source only |
| Distro packages, built from vanilla upstream source | Yes | Yes | No - Ubuntu Noble excludes riscv64 from all JIT binary packages built from unpatched upstream |
| Distro packages, built from downstream (OpenResty) fork | N/A | N/A | Yes - Debian trixie/sid and Ubuntu 26.04 "resolute" ship riscv64 `luajit` from the OpenResty fork |

**Note on CI:** confirmed by direct `git clone` and filesystem inspection at HEAD `c6ffc141a8762b41703f9287d63d93622a13dd8f` that no `.github/workflows` directory, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the tree, on any branch checked (`v2.1`, `master`, `v2.0`, `temp-v3bp-syntax1`). This absence of CI applies equally to amd64 and arm64; it is a project-wide absence, not a riscv64-specific gap. PR #1267 adds zero CI configuration files of its own.

## 4. Technical Architecture and RISC-V-Specific Subsystems

LuaJIT's architecture-specific code consists of interpreter, IR assembler, instruction emitter, target definitions, DynASM backend, and disassembler, each requiring a per-architecture implementation. All exist, hand-tuned, in PR #1267; none exist in upstream v2.1.

**Component comparison (line counts from a direct fetch of the PR #1267 branch head):**

| Component | amd64 | arm64 | riscv64 (PR #1267 only) | Quality |
|---|---|---|---|---|
| VM interpreter (`.dasc`) | `vm_x64.dasc`, 5,196 lines | `vm_arm64.dasc`, 4,398 lines | `vm_riscv64.dasc`, 4,931 lines | hand-tuned DynASM |
| IR assembler (`lj_asm_*.h`) | `lj_asm_x86.h`, 3,170 lines | `lj_asm_arm64.h`, 2,101 lines | `lj_asm_riscv64.h`, 2,049 lines | hand-tuned |
| Instruction emitter (`lj_emit_*.h`) | `lj_emit_x86.h`, 590 lines | `lj_emit_arm64.h`, 480 lines | `lj_emit_riscv.h`, 576 lines | hand-tuned |
| Target defs (`lj_target_*.h`) | `lj_target_x86.h`, 361 lines | `lj_target_arm64.h`, 351 lines | `lj_target_riscv.h`, 542 lines | complete |
| DynASM engine | `dasm_x86.h` | `dasm_arm64.h` | `dasm_riscv.h` (433 lines) + `dasm_riscv.lua` (979 lines) | complete |
| Disassembler (`jit/dis_*.lua`) | `dis_x86.lua` | `dis_arm64.lua`, 1,223 lines | `dis_riscv.lua`, 979 lines | complete |
| FFI call convention (`lj_ccall.c/h`) | Yes | Yes | Yes - full LP64D ABI struct (GPR/FPR argument counts) | complete |
| FFI callbacks (`lj_ccallback.c`) | Yes | Yes | Yes - 23 guarded sections, real machine-code-emitting `callback_mcode_init` (not a "missing support" fallback stub) | complete, independently verified this cycle; the prior [NEEDS VERIFICATION] flag on callbacks is resolved |
| DWARF/GDB JIT support (`lj_gdbjit.c`) | Yes | Yes | Yes | complete |
| Extension probing | CPUID | HWCAP/HWCAP2 | HWPROBE syscall (runtime) plus compile-time flags | complete |
| SIMD/vector extensions | SSE2/AVX/AVX2/AVX-512 | NEON (Adv. SIMD) | Not implemented; RVV/RVP/RVJ explicitly marked `/* TBD: RVV?, RVP?, RVJ? */` in `lj_target_riscv.h` line 457 | missing |

riscv64 guards (`#if`/`#elif LJ_TARGET_RISCV64`) appear across 28 files total, including shared infrastructure (`lj_ccall.c/h`, `lj_ccallback.c`, `lj_gdbjit.c`, `lj_jit.h` (16 guards), `lj_mcode.c`, `lj_trace.c`, `host/buildvm.c`, `host/buildvm_asm.c`, `lib_jit.c` (33 guards for RVC/Zba/Zbb/Zicond/XThead flag plumbing)), not just arch-isolated files. The riscv64 arch-specific file count (10 files) matches amd64's and exceeds arm64's (8 files).

**ISA extensions supported** (compile-time and HWPROBE runtime detection): RVC, Zba, Zbb, Zicond, Zfa, XTheadBa, XTheadBb, XTheadCondMov, XTheadMac.

**ISA extensions not yet implemented:** Zbc, Zbs, XTheadMemIdx, XTheadFMemIdx, XTheadMemPair (all explicitly marked NYI in `lj_target_riscv.h`, non-blocking optional extensions); RVV, RVP, RVJ (marked TBD, out of scope since LuaJIT does not JIT-vectorize on any architecture - SIMD is exposed to Lua only via FFI calls into C libraries on every port).

**ABI constraint:** LP64D only. The hard double-float ABI (`__riscv_float_abi_double`) is mandatory; soft-float and single-float ABIs are rejected at compile time with `#error "Only RISC-V 64 double float supported for now"`.

**GC64 mode:** mandatory on riscv64 (`LJ_TARGET_GC64=1` hardcoded in `lj_arch.h`), cannot be disabled - unlike amd64/arm64, where GC64 is optional/default respectively.

**TODO/FIXME/NYI density** is comparable to shipping ports, not elevated: `vm_riscv64.dasc` (5) + `lj_asm_riscv64.h` (2) = 7 total markers, versus arm64's 7 (`vm_arm64.dasc` 6 + `lj_asm_arm64.h` 1) and amd64's 11 (`vm_x64.dasc` 4 + `lj_asm_x86.h` 7). The `BC_FUNCV NYI: compiled vararg functions` marker is present verbatim in the arm64 and amd64 `.dasc` files too - it is a universal LuaJIT convention (vararg functions are never JIT-traced on any architecture), not a riscv64-specific gap. `asm_fref` in `lj_asm_riscv64.h` is a 4-line no-op, byte-for-byte identical to arm64's `asm_fref` (the expected pattern where FREF is always fused elsewhere). One genuine open item remains: a "todo-new" comment on `asm_tvptr` at `lj_asm_riscv64.h` line 623, an optimization gap rather than a correctness gap.

**FFI struct passing:** the PR-branch `lj_ccall.c` (line 1551) has an acknowledged, unfixed compiler warning (`'nsp' may be used uninitialized`) tied to two-element struct handling; downstream release notes from the PLCT fork describe struct passing as "partially broken" without specifying which configurations. This remains [NEEDS VERIFICATION] - no independent upstream bug report cross-references it, and it may be related to `libffi`'s own open riscv64 issue #694 (`struct_by_value_big` fails on aarch64 and riscv64), though no source cross-references the two directly.

## 5. Build System, Cross-Compilation, and Toolchain

LuaJIT uses GNU Make exclusively. No CMake, no autoconf, no cargo, no meson, and no `-DUSE_X=OFF`-style flags exist anywhere in the build system. This was confirmed by a direct clone of `LuaJIT/LuaJIT`: the repository root contains only a hand-written `Makefile`, `src/Makefile`, `README`, `COPYRIGHT`, `.relver`, and the `src/`, `dynasm/`, `doc/`, `etc/` directories - no `CMakeLists.txt` of any kind.

**Architecture detection** in the Makefile (PR #1267 branch):
```makefile
ifneq (,$(findstring LJ_TARGET_RISCV64 ,$(TARGET_TESTARCH)))
  TARGET_LJARCH= riscv64
  DASM_AFLAGS+= -D RISCV64
```
Compiler-side detection in `lj_arch.h`:
```c
#elif (defined(__riscv) || defined(__riscv__)) && __riscv_xlen == 64
#define LUAJIT_TARGET LUAJIT_ARCH_RISCV64
```

**Native riscv64 build** (on riscv64 hardware, using the unmerged PR branch, since upstream v2.1 has no riscv64 support to build at all):
```sh
git clone https://github.com/plctlab/LuaJIT.git
cd LuaJIT
git checkout origin/v2.1-riscv64-pr
make
src/luajit
```

**Cross-compilation:**
```sh
# Debian/Ubuntu GCC cross-toolchain (confirmed working)
make CROSS=riscv64-linux-gnu-

# Yocto SDK (source environment first)
source /opt/poky/environment-setup-riscv64-poky-linux
make CROSS=riscv64-poky-linux-
```
Host and target must share pointer width; a 64-bit riscv64 target requires a 64-bit host.

**Toolchain requirements:**

| Requirement | Minimum | Reason |
|---|---|---|
| GNU binutils | 2.35 | `%got_pcrel_hi` relocation was introduced in Binutils 2.35; Yocto SDK 3.1.x ships 2.34 and fails to assemble. Recommended: 2.37+. |
| GCC | Any riscv64-capable version | No stated minimum beyond the Binutils constraint; Debian's cross-GCC confirmed working. |
| Clang | Likely works | [NEEDS VERIFICATION] - no explicit confirmation found in the PR thread. |
| GNU Make | Any recent version | Required. |
| ABI | LP64D hard-float | `__riscv_float_abi_double` must be defined; soft-float builds are rejected at compile time. |

**Known build failures:**
1. Binutils 2.34 (Yocto SDK 3.1.x): fails with `illegal operands 'auipc x5,%got_pcrel_hi(pow)'` and an unrecognized `.option directive: arch,-c`. Fix: upgrade to Binutils >= 2.35 (2.37+ recommended).
2. Newer GNU `as` (post-October 2025): deprecated `.option arch -c` syntax triggers a warning; fixed in the PR branch as of 2025-10-28.
3. FFI two-element struct handling produces `warning: 'nsp' may be used uninitialized` at `lj_ccall.c:1551`; cosmetic as reported, fix not yet committed.

**QEMU:** no QEMU-based CI or test configuration exists in upstream or the plctlab fork. All reported testing used real hardware: SpacemiT K1 and K3 (BananaPi F3 boards), VisionFive 2, and SiFive U74 (via KOReader). No documented QEMU user-space procedure or version requirement exists in the repository; the standard invocation would work in principle but is unverified here.

**Amalgamation / distribution build:**
```sh
make amalg PREFIX=/usr && make install PREFIX=/usr DESTDIR=/tmp/buildroot
```

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compiler | Yes | Yes | No (upstream); Yes, hand-tuned (PR #1267 branch) |
| Interpreter | Yes | Yes | No (upstream); Yes (PR #1267 branch) |
| FFI | Yes | Yes | Partial - struct passing has an acknowledged, unresolved issue [NEEDS VERIFICATION on scope] |
| Callbacks via FFI | Yes | Yes | Yes, verified complete in PR #1267 (real machine-code-emitting `callback_mcode_init`) |
| SIMD/vector JIT | SSE2/AVX/AVX2/AVX-512 | NEON | Not implemented (RVV/RVP/RVJ marked TBD) |
| Bit-manipulation extensions | N/A | N/A | Zba, Zbb supported; Zbc, Zbs NYI |
| Conditional operations | Yes | Yes | Zicond supported |
| Hard-float ABI | Yes | Yes | Yes (LP64D only, mandatory) |
| GC64 mode | Optional | Default | Mandatory |
| DWARF/GDB JIT | Yes | Yes | Yes (PR branch) |
| Disassembler | Yes | Yes | Yes (PR branch, 979 lines) |
| Extension probing | CPUID | HWCAP | HWPROBE syscall |
| Vendor extensions | N/A | N/A | XThead family (compile-time option) |

**Functional gaps vs arm64:** FFI struct passing is reported as partially broken by downstream (PLCT) release notes, severity is high for applications relying on complex C-struct interop via FFI, but the exact failing configurations are unverified in any primary upstream source. No RVV (vector) backend exists, but since LuaJIT never JIT-vectorizes Lua code on any architecture (vector work always comes from C libraries via FFI), this is not a user-visible gap for typical workloads.

**Performance gaps:** `math.min`/`math.max` require a branchy compare-plus-conditional-move sequence on RISC-V because `fmin.d`/`fmax.d` do not match LuaJIT's required NaN-propagation semantics; ARM64 has the identical issue and uses an equivalent multi-instruction sequence, while x86's `minsd`/`maxsd` match LuaJIT's semantics directly and need no such workaround. The RISC-V base ISA additionally lacks a flags register and FPR conditional moves, forcing branchy sequences in other contexts where ARM64 or x86 use branchless idioms; Zicond partially closes this gap for integer operands. No measured performance delta from either gap has been published.

**Benchmark data:** no citable, apples-to-apples LuaJIT-on-RISC-V benchmark suite exists publicly. The single concrete number found across all research is a Hacker News commenter's report, during PR #1267's discussion, of a recursive Fibonacci(50) run completing in 0.281 ms on the riscv64 port - with no architecture-to-architecture comparison alongside it ([HN discussion](https://news.ycombinator.com/item?id=41479637)). A 2026 paper, "The Green Side of the Lua" (arXiv:2601.16670), found LuaJIT roughly 7x faster and 7x lower energy than the best plain Lua interpreter, and roughly 8x slower / 6x more energy than C - but this study includes no RISC-V hardware. The RISE Project's own published assessment of LuaJIT states plainly: "No quantitative comparison (riscv64 vs arm64 vs x86_64) for LuaJIT JIT performance is published anywhere." No Phoronix/OpenBenchmarking coverage pairs LuaJIT with RISC-V boards (Milk-V Jupiter/Megrez, VisionFive 2, SpacemiT K1/X60); their RISC-V coverage is CPU-general, not LuaJIT-specific.

## 7. CI/CD Infrastructure

The upstream LuaJIT/LuaJIT repository has no CI of any kind, on any branch. This was independently confirmed twice: once via MCP-based repository-tree inspection, and once via a direct `git clone` of HEAD `c6ffc141a8762b41703f9287d63d93622a13dd8f` followed by `ls .github` (no such directory) and a `find` for `*.yml`/`*.yaml`/`Jenkinsfile`/`.cirrus.yml`/`.gitlab-ci.yml` across the tracked tree (zero results). PR #1267 adds zero CI configuration files.

| CI system | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions | No | No | No |
| Travis CI | No | No | No |
| Cirrus CI | No | No | No |
| GitLab CI | No | No | No |
| RISE Runners | No | No | No |

**RISE Runners:** RISE launched free native riscv64 GitHub Actions CI (Scaleway EM-RV1 hardware) in March 2026; as of the May 2026 status post ("RISE RISC-V Runners: six weeks in"), it had logged 13,000+ jobs across 197 repos and 87 orgs. That post covers PyTorch, llama.cpp, post-quantum crypto, Kubernetes (k0s/k3s), NumPy, DuckDB, and Docker - LuaJIT does not appear, and is not listed as an adopter anywhere in RISE's public materials.

**Implication:** there is no regression-testing infrastructure for any architecture in LuaJIT today. Standing up riscv64 CI would mean adding CI to the project from scratch - either project-wide, or scoped to the plctlab/OpenResty riscv64 fork branch specifically.

## 8. Distribution and Release Status

**LuaJIT upstream releases (LuaJIT/LuaJIT GitHub Releases):** could not be independently re-verified this cycle - this session's GitHub API/MCP access is scoped only to `riseproject-dev/sw-ecosystem`, and both the GitHub API and web UI returned `403`/access-denied for `LuaJIT/LuaJIT` when queried directly. This should be reported as unconfirmed, not as a confirmed absence. Separately, for context: LuaJIT has historically not used GitHub's binary-asset Releases mechanism at all, distributing source tarballs via luajit.org and git tags instead - so even with access, finding riscv64 release *assets* there would be inherently unlikely regardless of port status.

**Distribution package status:**

| Distribution | riscv64 available | Version | Notes |
|---|---|---|---|
| Ubuntu 24.04 Noble | No (JIT binary) | 2.1.0+git20231223.c525bcb+dfsg-1 | Only `libluajit-5.1-common` (arch:all) lands on riscv64; the `luajit` binary, `libluajit-5.1-2`, and `libluajit-5.1-dev` are absent for riscv64. Packages the upstream snapshot, which predates any riscv64 JIT support. |
| Ubuntu 26.04 "resolute" | Yes | 2.1.0+openresty20251030-1 | Confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=LuaJIT&suite=resolute&searchon=names&section=all): `luajit`, `libluajit-5.1-2`, `libluajit-5.1-dev` all build for amd64, arm64, armhf, ppc64el, riscv64, s390x (universe component). Built from the OpenResty downstream fork, not vanilla upstream. `libluajit-5.1-common` is arch:all. `uwsgi-plugin-luajit` also covers riscv64. TeX Live variants (`libtexluajit-dev`, `libtexluajit2`) do not cover riscv64. |
| Debian trixie (stable) | Yes | 2.1.0+openresty20250117-2 | Installed on riscv64; OpenResty fork. |
| Debian sid (unstable) | Yes | 2.1.0+openresty20251030-1+b2 | Installed on riscv64, built on rv-osuosl-05; OpenResty fork. Known FTBFS bug #1105487 (build-order only, does not affect normal builds). |
| Alpine Linux edge | No | 2.1_p20251030-r0 | x86_64 only in the main repo. |
| Arch Linux RISC-V port | Yes, but almost certainly interpreter-only | 2.1.1702376626-1 | The status page at archriscv.felixc.at is a static build-percentage counter with no per-package search; the actual mirror (`mirrors.felixc.at/archriscv/repo/extra/`) was checked directly and confirms a real, downloadable `luajit-2.1.1702376626-1-riscv64.pkg.tar.zst` (362,665 bytes, HTTP 200). This build is dated 2024-02-23, roughly seven months before PR #1267 (the JIT-backend port) was even opened, so it almost certainly predates JIT-capable riscv64 support and is an interpreter-only build (e.g. with `LUAJIT_DISABLE_JIT`), not evidence of working riscv64 JIT compilation. |
| GitHub Releases (LuaJIT/LuaJIT) | Unconfirmed this cycle (access blocked) | N/A | See note above; historically no binary Releases are published by this project for any architecture. |
| PyPI | No | N/A | `https://pypi.org/pypi/luajit/json` returns HTTP 404; no `luajit` package exists. This check is a category error regardless of outcome - LuaJIT is a C project distributed via source tarball and OS packages, not a Python package. |
| RISE wheel builder | No | N/A | Redirects to the same nonexistent PyPI index page; not applicable for the same reason. |

**Critical distinction:** the riscv64 packages shipped by Debian and Ubuntu 26.04 are built from the **OpenResty downstream fork** (`openresty/luajit2`), which independently incorporated PLCT Lab's riscv64 patches ahead of upstream acceptance - not from vanilla `LuaJIT/LuaJIT` source. Upstream LuaJIT/LuaJIT has zero merged riscv64 support; Ubuntu Noble (which packages the unpatched upstream snapshot) explicitly excludes riscv64 from all JIT binary packages, confirming the gap directly.

**What a user must do today to get a working riscv64 LuaJIT binary:**
1. Use Debian trixie/sid or Ubuntu 26.04 "resolute" (ships the OpenResty fork with riscv64 support pre-built).
2. Build the `plctlab/LuaJIT` fork's `v2.1-riscv64-pr` branch (or PR #1267 directly) from source, with Binutils >= 2.35.
3. Build upstream `LuaJIT/LuaJIT` with `LUAJIT_DISABLE_JIT` for an interpreter-only fallback - this defeats LuaJIT's core purpose and is the likely nature of the Arch Linux RISC-V package above.

Downstream adoption ahead of the upstream merge is active: OpenResty's `luajit2` fork, KOReader (tested on SiFive U74), NixOS packaging ([nixpkgs PR #567986](https://github.com/NixOS/nixpkgs/pull/567986), "luajit_openresty: add riscv64 support"), openEuler and Deepin integration efforts, and a longstanding Debian bug tracking the upstream gap ([#1034484](https://lists.debian.org/debian-riscv/2023/04/msg00001.html)). Conversely, `fluent-bit` is currently *disabling* riscv64 LuaJIT support pending the upstream port landing (per Mic92's 2026 commits referenced from Issue #628), and [openwrt/packages#28040](https://github.com/openwrt/packages/issues/28040) documents LuaJIT2 2.1.2025.10.30 failing to compile for riscv64/musl on OpenWrt 24.10 ("Architecture not supported" in `lj_arch.h`), cascading to `luci-lib-jsonc`.

## 9. Dependencies

LuaJIT has no dependency manifest. A direct clone of the repository root confirms there is no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json` - only the hand-written GNU `Makefile`, `README`, `COPYRIGHT`, and the `src/`, `dynasm/`, `doc/`, `etc/` directories. LuaJIT is a self-contained C project.

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| GNU binutils | Build-dependency (critical) - assembler for the RISC-V object code DynASM generates | Yes, requires >= 2.35 for the `%got_pcrel_hi` relocation (2.37+ recommended) | Yes | Yes | Binutils 2.34 (e.g. Yocto SDK 3.1.x) fails to assemble; workaround is upgrading the toolchain. |
| GCC | Build-dependency (critical) - compiles host `minilua` and the target LuaJIT build; Debian's riscv64 cross-GCC confirmed working | Yes | Yes | Yes | None known. Clang support is plausible but [NEEDS VERIFICATION] - no explicit confirmation found. |
| libffi | Runtime-dependency (optional) - backs the `ffi.*` FFI call-convention module | Yes, riscv64 fully upstream since libffi 3.3 (March 2019); static trampolines added in PR #933 (August 2025) | Yes - riscv64 is a first-class target in libffi's `build-qemu` CI matrix (QEMU user-mode, no native HW runner) | Yes | Not a blocker for the port overall. Three open, non-blocking correctness issues exist upstream in libffi itself: [#466](https://github.com/libffi/libffi/issues/466) ("RISC-V 64bit: 'Small' integers are not turned into ffi_arg"), [#777](https://github.com/libffi/libffi/issues/777) ("Linking libffi.a on riscv64 machine failed"), and [#694](https://github.com/libffi/libffi/issues/694) ("struct_by_value_big fails on aarch64 and riscv64") - the last of which may be related to LuaJIT's own reported FFI struct-passing gap, though no source cross-references the two directly. |
| DynASM (bundled, `dynasm/` directory - part of the LuaJIT tree, not an external project) | JIT/interpreter macro-assembler preprocessor; converts `.dasc` to C | Not present for riscv64 in upstream v2.1; riscv64 support (`dasm_riscv.h`/`.lua`) exists only in the unmerged PR #1267 | Not in upstream | Not released upstream | Identical blocker to LuaJIT itself: PR #1267 remains unmerged. Because DynASM ships inside the LuaJIT source tree rather than as an external dependency, this is not a separate project to unblock - the same PR merge resolves both. |
| libm (part of glibc) | Runtime-dependency - math library (`sin`, `cos`, `sqrt`, etc.), linked via `-lm` | Yes | Yes | Yes | None known. |
| libdl (part of glibc) | Runtime-dependency - dynamic linker (`dlopen`/`dlsym`) | Yes | Yes | Yes | None known. |
| Lua 5.1 / minilua | Build-time self-hosted minimal interpreter compiled from `host/minilua.c` | N/A - source compiled in-tree, architecture-independent | N/A | N/A | None. |

**Bottom line:** LuaJIT's only real dependency with JIT/assembler characteristics is DynASM, and DynASM is not an external project - its riscv64 support is part of the exact same unmerged PR #1267 that blocks LuaJIT's own riscv64 port, so there is no separate DynASM-specific unblocking effort. The one genuine external runtime dependency, libffi, is riscv64-clean upstream: fully merged, CI-tested, with only minor open correctness bugs that are not release-blocking. Toolchain dependencies (GNU binutils, GCC, glibc's libm/libdl) are all riscv64-ready, with the single caveat that binutils must be >= 2.35.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #628](https://github.com/LuaJIT/LuaJIT/issues/628) | Add support for RISC-V | Open since 2020-10-19 | Critical | Master tracking issue; labeled `new port`, `3.0`; 30 comments, 39 thumbs-up; no maintainer assignment, no merge timeline. |
| [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) | Add support for RISC-V 64 Linux | Open since 2024-09-08, last force-pushed 2026-08-11 | Critical | 21-23 commits (source-dependent count, see Section 2) adding ~11,000+ lines; one approval (ccuser44), no review or comment from Mike Pall to date. |
| [openresty/luajit2 #236](https://github.com/openresty/luajit2/pull/236) | RISC-V 64 port (OpenResty fork) | Open since 2024-06-27 | High | Downstream PR; Debian's and Ubuntu 26.04's riscv64 packages derive from this fork. A cdata-equality bug was confirmed and fixed here in June 2026 (andreas-schwab). |
| `pcall(pcall)` segfault (PR #1267) | Register clobber in `vm_riscv64.dasc` | Fixed in PR branch, not upstream | High | `NARGS8:RC` used before being saved; fixed by using `NARGS8:TMP0`. Reported by Buristan, fixed by IgnotaYun, 2024-11-23. |
| `math.min`/`math.max` NaN-semantics mismatch (PR #1267) | `fmin.d`/`fmax.d` violate LuaJIT's required NaN propagation | Fixed in PR branch, not upstream | High | RISC-V base ISA has no cheap branchless alternative (no flags register, no FPR conditional moves, no FPR bitwise ops); fixed via compare-plus-conditional-move sequence. |
| Binutils < 2.35 incompatibility (PR #1267) | `%got_pcrel_hi` relocation missing | Documented, toolchain issue not a code bug | Medium | Affects Yocto SDK 3.1.x (ships Binutils 2.34); workaround is upgrading to 2.35+/2.37+. |
| FFI struct passing | Reportedly partially broken | Known gap, unresolved | Medium | Acknowledged in PLCT downstream release notes; no upstream bug report specifies which struct configurations fail; possibly related to libffi's own [#694](https://github.com/libffi/libffi/issues/694). [NEEDS VERIFICATION] |
| `'nsp' may be used uninitialized` warning (`lj_ccall.c:1551`) | Two-element struct handling | Acknowledged, fix planned, not committed | Low | Cosmetic per the reporting thread; no confirmed correctness impact. |
| [openwrt/packages #28040](https://github.com/openwrt/packages/issues/28040) | LuaJIT2 fails to compile for riscv64/musl on OpenWrt 24.10 | Closed (downstream, illustrates the upstream gap) | Medium | "Architecture not supported" / "No target architecture defined" in `lj_arch.h`; cascaded to `luci-lib-jsonc`. |
| [Debian #1034484](https://lists.debian.org/debian-riscv/2023/04/msg00001.html) | luajit: Add support for riscv64 | Tracking (packaging) | Medium | Same upstream gap tracked from the packaging side. |

## 12. Objections and Upstream Blockers

**Blocker 1 - Mike Pall merge approval (hard blocker).** Mike Pall is the sole maintainer with merge rights and has left no comment on PR #1267 since it opened on 2024-09-08, despite roughly 145 reactions and 26 comments of substantive community review. His documented position from Issue #628 requires a JIT backend (present), sponsorship for long-term maintenance (partially addressed via RISE, see below), and code quality meeting his personal standard (community-reviewed, not maintainer-reviewed). There is no mechanism to force or bypass this review, and no merge timeline exists.

**Blocker 2 - long-term maintenance sponsorship.** IgnotaYun explicitly named this as a prerequisite for upstreaming (2025-05). Ruinland (Andes Technology, RISE System Library Working Group) responded with a formal RFP process offering up to 3000 EUR, reiterated again in November 2025. As of the most recent check, no one has claimed or completed this RFP work, and the PR remains unmerged and uncommented by Mike Pall.

**Blocker 3 - RISC-V ISA architectural constraints.** The `math.min`/`math.max` NaN issue exposes a genuine ISA gap: the RISC-V base ISA lacks a flags register, FPR conditional moves, and bitwise operations on floating-point registers, forcing branchy sequences for operations that are branchless on x86. corsix confirmed there is "no cheap branchless way of getting the desired semantics" on the base ISA; this is functionally correct as implemented but carries a performance cost, and is an inherent ISA property rather than a fixable code defect (Zfa's FMINM/FMAXM, with IEEE 754-2019 minimum/maximum semantics, is a possible future alternative if Mike Pall accepts a different semantics mapping).

**Blocker 4 - contributor profile.** IgnotaYun is an undergraduate intern at PLCT Lab / ISCAS. Mike Pall's documented standard requires deep expertise across ISA, Lua, C, compiler internals, and LuaJIT internals simultaneously; the submitted code (4,900+ line hand-tuned interpreter, full extension probing, DWARF support, standalone disassembler) is substantive, but the author's institutional status may weigh on the maintainer's confidence in sustained long-term maintenance absent a backing organizational commitment.

**Non-blocker: code quality.** One formal review approval (ccuser44) was recorded with no substantive commentary. Real-hardware testing has been confirmed on SiFive U74 (KOReader), SpacemiT K1/K3, and VisionFive 2. The pcall and NaN bugs were identified and patched by community reviewers rather than the original author - standard open-source review workflow, not a sign of poor initial quality.

**Acceptance probability:** low-to-medium in the near term. The RISE engagement is the most credible path to resolution but remains unclaimed, and Mike Pall's engagement with this specific PR is zero after two years. Because the OpenResty fork has already shipped riscv64 to Debian and Ubuntu 26.04, pressure on the upstream merge from a distribution standpoint is reduced even as the functional gap for vanilla-upstream users persists.

## 13. Readiness Assessment

- **Color:** Orange (downstream-only)
- **Release provider:** Distro

**Justification:** LuaJIT/LuaJIT has no CI of any kind (no `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`) at HEAD `c6ffc141a8762b41703f9287d63d93622a13dd8f`, and zero riscv64 code exists on its default `v2.1` branch; the full interpreter-plus-JIT riscv64 port lives only in the unmerged upstream [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267). Debian and Ubuntu 26.04 "resolute" do ship working riscv64 `luajit` packages (confirmed live at [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=LuaJIT&suite=resolute&searchon=names&section=all), version `2.1.0+openresty20251030-1`), but these are built from the OpenResty downstream fork carrying PLCT Lab's riscv64 patches, not from vanilla upstream source - Ubuntu Noble, which packages the unpatched upstream snapshot, excludes riscv64 from all JIT binary packages. LuaJIT is a general-purpose language runtime, not an optimization-purpose library, so no optimization-level modifier applies to this grade.

**Pending work that could change the grade:** Tracking issue #628 (open since 2020) and PR #1267 (open since September 2024, last force-pushed August 2026, approximately 145 reactions, tested on SiFive U74 / SpacemiT K1-K3 / VisionFive2) remain unmerged with no comment from sole maintainer Mike Pall. The RISE System Library Working Group, via Andes Technology's Ruinland, has offered a funded RFP (up to 3000 EUR) for completing the upstreaming, unclaimed as of the latest report. A merge of PR #1267, or completion of the RISE-funded RFP followed by maintainer acceptance, would move LuaJIT from Orange to Green/Blue; absent that, downstream forks (OpenResty) will continue to carry the riscv64 delta indefinitely.

## 14. Investment Analysis

### 14.1 Functional Enablement

The riscv64 JIT backend is substantively complete in the PR branch: interpreter, IR assembler, emitter, target definitions, DynASM backend, disassembler, FFI call convention, and FFI callbacks are all hand-tuned and complete, on par with the shipping arm64/amd64 ports in scope and code density (Section 4). The two correctness bugs found in review (pcall segfault, math.min/max NaN handling) already have patches merged into the PR branch. Remaining functional work:
- FFI struct passing: diagnose which struct configurations fail and fix them. Estimated 2-4 person-weeks given LuaJIT FFI complexity and the possible libffi #694 linkage.
- Toolchain-compatibility hardening for Binutils < 2.37 environments (Yocto-class SDKs): estimated 0.5-1 person-week, workaround (upgrade toolchain) already documented.

**RISE has already done:** the RISE System Library Working Group (Ruinland, Andes Technology) posted a funded Developer Appreciation Program RFP of up to 3000 EUR specifically for completing PR #1267's upstreaming, first in May 2025 and reiterated in November 2025. No evidence exists that anyone has claimed or completed this work as of the latest check (PR still open, unmerged, uncommented by Mike Pall). Any new investment should coordinate with this existing RFP rather than duplicate it.

### 14.2 Performance Optimization

No baseline benchmark data exists anywhere (Section 6) - the only public number is a single unverified Fibonacci(50) anecdote with no comparison point. Before any optimization investment, a baseline must be established.
- Establish a riscv64 LuaJIT performance baseline vs. arm64 and x86_64 on real hardware (SiFive U74, SpacemiT K1/K3, VisionFive2 are already validated as functional test targets): 1-2 person-weeks.
- Zba/Zbb/Zicond integration review for missed optimization opportunities: 1-2 person-weeks.
- Zfa (FMINM/FMAXM) evaluation as a branchless replacement for the current compare-plus-conditional-move min/max sequence: 1 person-week.
- RVV integration: out of scope - LuaJIT does not JIT-vectorize Lua code on any architecture today, so this would be a novel feature investment, not a riscv64 parity gap.

### 14.3 CI/CD Infrastructure

The upstream project has no CI for any architecture; riscv64 CI cannot be "caught up" because nothing exists to extend.
- Stand up GitHub Actions on the plctlab/OpenResty riscv64 fork branch using RISE Runners (free native riscv64 hardware, `ubuntu-24.04-riscv`-class): 1 person-week.
- QEMU user-space CI as a fallback for cross-compiled build validation: 1 person-week.

### 14.4 Ecosystem Enablement

LuaJIT has no significant dependent package ecosystem requiring separate riscv64 enablement in the sense of Python/npm/Maven/Kubernetes-operator style dependents. Applications that embed LuaJIT (Neovim, KOReader, OpenResty/Nginx, game engines) will pick up riscv64 support automatically once either the upstream merge lands or they adopt the OpenResty fork already carrying it - no package-by-package enablement effort is required.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Engage Mike Pall directly with a concrete sponsorship commitment; coordinate with the existing unclaimed RISE RFP (up to 3000 EUR) rather than duplicating it | 2-4 | Chip company + RISE liaison | Critical |
| Functional | Diagnose and fix FFI struct-passing gaps (cross-check against libffi #694) | 2-4 | LuaJIT RISC-V contributor | High |
| Performance | Establish riscv64 benchmark baseline vs. arm64 and x86_64 | 1-2 | Contributor | High |
| Performance | Evaluate Zfa FMINM/FMAXM as a branchless min/max fix | 1 | LuaJIT RISC-V contributor | Medium |
| Performance | Zba/Zbb/Zicond optimization audit | 1-2 | LuaJIT RISC-V contributor | Medium |
| CI/CD | Stand up GitHub Actions CI on the fork via RISE Runners | 1 | Contributor | High |
| CI/CD | QEMU user-space CI for cross-build validation | 1 | Contributor | Medium |
| Toolchain | Document/automate Binutils >= 2.37 requirement in build tooling | 0.5-1 | Contributor | Low |

## 15. References

- [LuaJIT/LuaJIT - upstream repository](https://github.com/LuaJIT/LuaJIT)
- [LuaJIT homepage](https://luajit.org/)
- [PR #1267 - Add support for RISC-V 64 Linux](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [Issue #628 - Add support for RISC-V](https://github.com/LuaJIT/LuaJIT/issues/628)
- [Issue #1278 - Asking Plans for adding loongarch64 architecture support (tangential, closed as duplicate)](https://github.com/LuaJIT/LuaJIT/issues/1278)
- [LuaJIT official status page](https://luajit.org/status.html)
- [openresty/luajit2 PR #236 - RISC-V 64 port for the OpenResty fork](https://github.com/openresty/luajit2/pull/236)
- [plctlab/LuaJIT - active RISC-V development fork](https://github.com/plctlab/LuaJIT)
- [IgnotaYun/LJRV - PLCT Lab / ISCAS riscv64 porting project](https://github.com/IgnotaYun/LJRV)
- [IgnotaYun/luajit2 - OpenResty LuaJIT2 branch with RISC-V64 support](https://github.com/IgnotaYun/luajit2)
- [NixOS nixpkgs PR #567986 - luajit_openresty: add riscv64 support](https://github.com/NixOS/nixpkgs/pull/567986)
- [Debian bug #1034484 - luajit: Add support for riscv64](https://lists.debian.org/debian-riscv/2023/04/msg00001.html)
- [openwrt/packages #28040 - LuaJIT2 riscv64/musl build failure](https://github.com/openwrt/packages/issues/28040)
- [libffi issue #466 - RISC-V 64bit small integers not turned into ffi_arg](https://github.com/libffi/libffi/issues/466)
- [libffi issue #777 - Linking libffi.a on riscv64 machine failed](https://github.com/libffi/libffi/issues/777)
- [libffi issue #694 - struct_by_value_big fails on aarch64 and riscv64](https://github.com/libffi/libffi/issues/694)
- [Ubuntu 26.04 "resolute" package search for LuaJIT](https://packages.ubuntu.com/search?keywords=LuaJIT&suite=resolute&searchon=names&section=all)
- [Debian buildd - luajit package status (sid)](https://buildd.debian.org/status/package.php?p=luajit&suite=sid)
- [Debian buildd - luajit package status (trixie)](https://buildd.debian.org/status/package.php?p=luajit&suite=trixie)
- [Launchpad - luajit in Ubuntu Noble](https://launchpad.net/ubuntu/noble/+source/luajit)
- [Alpine Linux packages - luajit edge](https://pkgs.alpinelinux.org/packages?name=luajit&branch=edge)
- [Arch Linux RISC-V port mirror listing](https://mirrors.felixc.at/archriscv/repo/extra/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Hacker News discussion of PR #1267, including the Fibonacci(50) timing anecdote](https://news.ycombinator.com/item?id=41479637)
- [SerenityOS issue #26704 - LuaJIT RISC-V still unsupported upstream](https://github.com/SerenityOS/serenity/issues/26704)
- [Gentoo RISC-V issue #20 - LuaJIT packaging using PR #1267 patches](https://github.com/gentoo/riscv/issues/20)