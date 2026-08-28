---
title: LuaJIT
categories:
  - runtimes
---

# LuaJIT

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for LuaJIT
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

LuaJIT is a tracing JIT compiler for the Lua 5.1 language. It provides an interpreter (bytecode VM written in DynASM, a macro-assembler preprocessor) and a trace-based JIT backend, both written per-architecture in assembly. LuaJIT is used as the scripting engine in Nginx/OpenResty, Neovim, KOReader, game engines, and numerous embedded networking applications.

**Governance:** BDFL (Benevolent Dictator For Life). Mike Pall is the sole maintainer and copyright holder (2005-2026). All commits to the canonical `v2.1` branch are made exclusively by Mike Pall. No deputy maintainers have merge rights. The project is hosted at [LuaJIT/LuaJIT](https://github.com/LuaJIT/LuaJIT). License: MIT.

**Port policy:** The [LuaJIT FAQ](https://luajit.org/faq.html) states explicitly that new architecture ports require (1) sufficient user demand and market relevance, and (2) sponsorship to develop, integrate, and maintain the port. A pure interpreter is not accepted -- a JIT backend is mandatory. No port has been accepted without commercial or institutional backing. Historical precedent: ARM64 was sponsored by ARM and Linaro; MIPS ports were sponsored by MIPS Technologies, RT-RK, and Wave Computing.

**Corporate sponsors** (from [luajit.org/sponsors.html](https://luajit.org/sponsors.html)): Google, Qualcomm, Cisco, Cloudflare, OpenResty Inc., Linaro, ARM, RT-RK, Wave Computing, MIPS Technologies, Athena Capital Research, Neomantra, Snabb, GIANTS Software, fmad engineering, Gehtsoft USA. No RISC-V hardware vendor (SiFive, SpacemiT, Andes, Alibaba) appears on the sponsors page.

**Community culture on new ports:** The maintainer's documented stance is extremely demanding. From Issue [#628](https://github.com/LuaJIT/LuaJIT/issues/628) (2021): "I'm very, very, very stringent about the quality of the code that I accept. Porting requires deep knowledge of: the ISA, Lua, C, compiler internals, and LuaJIT codebase internals." A contributor offering money without deep technical understanding was explicitly told they would not succeed. Despite this, Mike Pall has not commented on PR [#1267](https://github.com/LuaJIT/LuaJIT/pull/1267) at all.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-10-19 | Issue #628 "Add support for RISC-V" opened by petar-jovanovic (Syrmia). WIP code by Djordje Kovacevic and Milos Poletanovic shared as non-review-ready. Mike Pall commented with detailed requirements and code criticisms. | [Issue #628](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2021-01-06 | Community demand noted: "libluajit is needed for sysbench! Please, port it to RISC-V." | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2021-09-16 | Wei Wu (PLCT Lab director) announces RISC-V as tier-1 platform goal; commits PLCT to porting effort. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2022-06-28 | PLCT Lab confirms fork at plctlab/LuaJIT; begins active porting. Estimated 8-12 weeks for interpreter, additional 12-18 weeks for JIT. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2022-10-06 | IgnotaYun (PLCT/ISCAS): DynASM RV32G/RV64G functioning. Demonstrated DynASM BF JIT on HiFive Unmatched. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2022-12-16 | Interpreter "mostly functioning," 301/304 tests passing. Shifting to FFI and SSA IR assembler. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2023-03-30 | Interpreter and interpreter FFI porting declared complete. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2023-06-23 | JIT declared working. Remaining: debug info, UB sanitization. | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2024-06-21 | Port declared "comparable to the existing Aarch64 backend in functionality and reliability." Two blockers identified: (a) extension probing mechanism, (b) long-term maintenance sponsorship. HWPROBE suggested by rwmjones (Red Hat). | [Issue #628, comment](https://github.com/LuaJIT/LuaJIT/issues/628) |
| 2024-06-27 | PR submitted to openresty/luajit2 as [#236](https://github.com/openresty/luajit2/pull/236) with HWPROBE-based extension detection. XThead extensions demoted to compile-time option. | [PR #236](https://github.com/openresty/luajit2/pull/236) |
| 2024-09-08 | PR [#1267](https://github.com/LuaJIT/LuaJIT/pull/1267) "Add support for RISC-V 64 Linux" submitted to upstream LuaJIT/LuaJIT by IgnotaYun (PLCT Lab / ISRC at ISCAS). 23 commits, 11,166 additions. | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2024-11-23 | Buristan reports pcall segfault in vm_riscv64.dasc; fix proposed and acknowledged. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2024-12-23 | Buristan reports math.min/math.max NaN semantics mismatch; corsix confirms architectural difficulty on RISC-V. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-01-02 | Binutils 2.34 incompatibility reported (Yocto SDK 3.1.x). Root cause: %got_pcrel_hi requires Binutils >= 2.35. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-05-02 | Ruinland (Andes Technology, RISE System Library WG) posts formal RISE RFP invitation with up to 3000 EUR payment for upstreaming work. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2025-10-28 | Newer GAS deprecates `.option arch -c` directive; fix pushed to PR branch same day. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-02-04 | Tested on SpacemiT K1 and K3 (BananaPi F3 boards) and VisionFive 2. Minor FFI uninitialized warning noted. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-03-29 | Confirmed working on SiFive U74 cores in KOReader context. | [PR #1267, comment](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2026-06-16 | PR branch squash-rebased; PR still open, not merged. | [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |

**Key contributors:**
- IgnotaYun (Wang Bingzhen, wangbingzhen.riscv@isrc.iscas.ac.cn) -- PLCT Lab / ISRC at ISCAS. Primary author of all 23 commits. Undergraduate intern.
- Heinrich Schuchardt -- co-author on commit 13 (VM builder support).
- Ruinland (Andes Technology) -- RISE liaison.
- corsix -- LuaJIT community contributor, identified math.min/max NaN architectural issue.
- Buristan -- LuaJIT community contributor, identified and fixed pcall segfault and NaN semantics bugs.
- rwmjones (Red Hat) -- recommended HWPROBE syscall approach.

**Is it fully upstream?** No. As of June 2026, zero RISC-V commits have been merged into LuaJIT/LuaJIT. The GitHub commit search API returned zero results for "riscv repo:LuaJIT/LuaJIT". PR #1267 (open since September 2024) contains all 23 RISC-V commits exclusively on the plctlab:v2.1-riscv64-pr branch.

---

## 3. Upstream Support Tier

LuaJIT does not publish a formal tier policy document. Support tier is inferred from the evidence below.

**Official architecture status page** ([luajit.org/status.html](https://luajit.org/status.html)): Lists 7 supported architectures. RISC-V 64-bit is listed with version "(TBA)" -- acknowledged as a future target but unversioned and unreleased.

**Supported architectures in upstream v2.1** (from src/lj_arch.h): x86, x64, ARM (32-bit), ARM64, PPC, MIPS32, MIPS64. RISC-V is absent.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture code merged | Yes | Yes | No |
| JIT backend | Yes (hand-tuned) | Yes (hand-tuned) | No (unmerged PR only) |
| Official version on status page | Current | Current | (TBA) |
| CI in upstream repo | None | None | None |
| Release-blocking | Yes | Yes | Not applicable |
| Binary packages from upstream | Source only | Source only | Source only |
| Debian package (any fork) | Yes (upstream) | Yes (upstream) | Yes (OpenResty fork only) |

**Note on CI:** The upstream LuaJIT repository has no CI of any kind on any branch (v2.1, master, v2.0, temp-v3bp-syntax1). No .github/workflows/, no .travis.yml, no .gitlab-ci.yml, no .cirrus.yml, no Jenkinsfile. This is equally true for amd64 and arm64. The absence of CI is not a riscv64-specific gap; it is a project-wide absence. PR #1267 adds zero CI configuration files.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LuaJIT's architecture-specific code consists of six components, each requiring a per-architecture implementation. All six exist in PR #1267. None exist in upstream v2.1.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 (PR #1267 only) | Quality |
|---|---|---|---|---|
| VM interpreter (.dasc) | vm_x86.dasc + vm_x64.dasc | vm_arm64.dasc (~122 KB) | vm_riscv64.dasc (~137 KB) | hand-tuned DynASM |
| IR assembler (lj_asm_*.h) | lj_asm_x86.h | lj_asm_arm64.h (~70 KB) | lj_asm_riscv64.h (~71 KB) | hand-tuned |
| Instruction emitter (lj_emit_*.h) | lj_emit_x86.h | lj_emit_arm64.h (~15 KB) | lj_emit_riscv.h (~18 KB) | hand-tuned |
| Target defs (lj_target_*.h) | lj_target_x86.h | lj_target_arm64.h (~10 KB) | lj_target_riscv.h (~14 KB) | complete |
| DynASM engine (dynasm/dasm_*.h) | dasm_x86.h | dasm_arm.h (shared) | dasm_riscv.h (~432 lines) | complete |
| Disassembler (jit/dis_*.lua) | dis_x86.lua | dis_arm64.lua | dis_riscv.lua (~580 lines) | complete |
| FFI call convention (lj_ccall.h) | Yes | Yes | Yes (RISCV64 section) | complete |
| DWARF/GDB JIT support | Yes | Yes | Yes | complete |
| ISA extension detection | CPUID | HWCAP/HWCAP2 | HWPROBE syscall | complete |
| SIMD/vector extensions | SSE2/AVX/AVX2/AVX-512 | NEON (Adv.SIMD) | Not implemented (TBD) | missing |

**ISA extensions supported** (compile-time and runtime via HWPROBE): RVC, Zba, Zbb, Zicond, Zfa, XTheadBa, XTheadBb, XTheadCondMov, XTheadMac.

**ISA extensions not yet implemented:** Zbc, Zbs, XTheadMemIdx, XTheadFMemIdx, XTheadMemPair. Marked "TBD" in lj_target_riscv.h: RVV (vector), RVP (packed-SIMD), RVJ.

**ABI constraint:** LP64D only. The hard double-float ABI (`__riscv_float_abi_double`) is mandatory. Soft-float and single-float ABIs are rejected at compile time with `#error "Only RISC-V 64 double float supported for now"`.

**GC64 mode:** Mandatory on riscv64 (`LJ_TARGET_GC64=1` is hardcoded in lj_arch.h). Cannot be disabled.

**NYI/stub items in the PR branch** (minor, not correctness-blocking for common workloads):
- lj_target_riscv.h: Zbc, Zbs, XTheadMemIdx marked NYI (optional extensions)
- lj_asm_riscv64.h: "todo-new" on asm_tvptr; "NYI: Fuse ADD with constant" (optimization gap, not correctness); asm_fref stub (asserts never used)
- lj_emit_riscv.h: one NYI in default case of instruction switch; two commented-out functions
- vm_riscv64.dasc: NYI macro defined as ebreak trap (standard practice in all LuaJIT ports); one TODO in tail-call path

**FFI struct passing:** Partially broken per plctlab release notes [NEEDS VERIFICATION -- no independent confirmation found in the PR comments; described as "partially broken" in downstream documentation].

---

## 5. Build System, Cross-Compilation, and Toolchain

LuaJIT uses GNU Make exclusively. No CMake, no autoconf, no cargo, no meson. There are no -DUSE_X=OFF flags.

**Architecture detection** in the Makefile (from PR #1267):
```makefile
ifneq (,$(findstring LJ_TARGET_RISCV64 ,$(TARGET_TESTARCH)))
  TARGET_LJARCH= riscv64
  DASM_AFLAGS+= -D RISCV64
```
Compiler-side detection in lj_arch.h:
```c
#elif (defined(__riscv) || defined(__riscv__)) && __riscv_xlen == 64
#define LUAJIT_TARGET LUAJIT_ARCH_RISCV64
```

**Native riscv64 build** (on a riscv64 host, using the unmerged PR branch):
```sh
git clone https://github.com/plctlab/LuaJIT.git
cd LuaJIT
git checkout origin/v2.1-riscv64-pr
make
src/luajit
```

**Cross-compilation** from x86_64/aarch64:
```sh
# Debian/Ubuntu GCC cross-toolchain (confirmed working)
make CROSS=riscv64-linux-gnu-

# Yocto SDK (source environment first)
source /opt/poky/environment-setup-riscv64-poky-linux
make CROSS=riscv64-poky-linux-
```

Both host and target must have the same pointer width; 64-bit riscv64 requires a 64-bit host.

**Toolchain requirements:**

| Requirement | Minimum | Reason |
|---|---|---|
| GNU Binutils | 2.35 | `%got_pcrel_hi` relocation introduced in 2.35; Yocto SDK 3.1.x ships 2.34 and fails. Recommended: 2.37+. |
| GCC | Any riscv64-capable version | No specific minimum stated beyond Binutils constraint. Debian cross-gcc confirmed working. |
| Clang | Likely works | [NEEDS VERIFICATION -- no explicit confirmation in PR comments] |
| GNU Make | Any recent | Required |
| ABI | LP64D hard-float | `__riscv_float_abi_double` must be defined; soft-float builds rejected at compile time |

**Known build failures:**
1. Binutils 2.34 (Yocto SDK 3.1.x): fails with "illegal operands 'auipc x5,%got_pcrel_hi(pow)'". Fix: upgrade to Binutils >= 2.35.
2. Newer GAS (post-October 2025): deprecated `.option arch -c` syntax triggers a warning. Fixed in PR branch as of October 2025.
3. FFI two-element struct: `warning: 'nsp' may be used uninitialized` in lj_ccall.c:1551. Cosmetic warning; fix planned but not committed as of February 2026.

**QEMU:** No QEMU-based CI or test configuration exists in either the upstream or the plctlab fork. All reported testing was on real hardware: SpacemiT K1, K3 (BananaPi F3 boards), VisionFive 2, and SiFive U74. The standard QEMU user-space invocation would work in principle but no documented procedure or version requirement exists in the repository.

**Amalgamation / distribution build:**
```sh
make amalg PREFIX=/usr && make install PREFIX=/usr DESTDIR=/tmp/buildroot
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compiler | Yes | Yes | No (upstream); Yes (PR branch) |
| Interpreter | Yes | Yes | No (upstream); Yes (PR branch) |
| FFI | Yes | Yes | Partial (struct passing broken) |
| Callbacks via FFI | Yes | Yes | [NEEDS VERIFICATION] |
| SIMD/vector JIT | SSE2/AVX/AVX2/AVX-512 | NEON | Not implemented |
| Compressed instructions (code density) | N/A | Thumb2 (separate) | RVC supported |
| Bit manipulation extensions | N/A | N/A | Zba, Zbb supported |
| Conditional operations | Yes | Yes | Zicond supported |
| Hard-float ABI | Yes | Yes | Yes (LP64D only) |
| GC64 mode | Optional | Default | Mandatory |
| DWARF/GDB JIT | Yes | Yes | Yes (PR branch) |
| Disassembler | Yes | Yes | Yes (PR branch) |
| Extension probing | CPUID | HWCAP | HWPROBE syscall |
| Vendor extensions | N/A | N/A | XThead (compile-time option) |

**Functional gaps vs arm64:**
- FFI struct passing is partially broken. Severity: high for applications relying on complex C struct interop via LuaJIT FFI.
- No RVV (vector) backend. LuaJIT does not JIT SIMD intrinsics directly (those come from C libraries), so this is not an immediate user-visible gap for typical Lua workloads. It would matter if LuaJIT ever added explicit SIMD loop unrolling.

**Performance gaps:**
- On RISC-V, `math.min` and `math.max` JIT paths require branching sequences because `fmin.d`/`fmax.d` instructions return NaN when either operand is NaN, violating LuaJIT semantics. ARM64 has the same issue and uses a multi-instruction sequence. x86 `minsd`/`maxsd` match LuaJIT semantics directly. This adds a small per-min/max overhead on RISC-V and ARM64 vs x86. No measured delta is available.
- RISC-V lacks a flags register and lacks conditional moves on floating-point registers (base ISA), requiring branchy sequences in contexts where ARM64 or x86 use branchless idioms. Zicond partially addresses this for integer operands.

**Benchmark data:** None publicly available. No quantitative comparison (riscv64 vs arm64 vs x86_64) for LuaJIT JIT performance is published anywhere in the accessible sources. Interpreter-only mode on RISC-V (upstream, pre-merge) runs at standard Lua 5.1 interpreter speed with no JIT benefit; competing architectures with JIT enabled run 2-10x faster on JIT-friendly workloads, but no RISC-V-specific measurement has been published.

---

## 7. CI/CD Infrastructure

The upstream LuaJIT/LuaJIT repository has no CI of any kind. This was confirmed by checking all branches (v2.1, master, v2.0, temp-v3bp-syntax1) for .github/workflows/, .travis.yml, .gitlab-ci.yml, .cirrus.yml, and Jenkinsfile. All return 404. PR #1267 adds zero CI configuration files.

| CI system | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions | No | No | No |
| Travis CI | No | No | No |
| Cirrus CI | No | No | No |
| GitLab CI | No | No | No |
| RISE Runners | No | No | No |

**RISE Runners:** The RISE project launched free native riscv64 CI via GitHub Actions in March 2026 (runs-on: ubuntu-24.04-riscv, backed by Scaleway EM-RV1). As of May 2026: 13,000+ jobs run across 197 repos and 87 orgs, 99.78% completion rate. LuaJIT is not listed as an adopter.

**Implication:** There is no regression testing infrastructure for any architecture in LuaJIT. Adding riscv64 CI would require adding CI infrastructure from scratch for the project overall, or adding it only for the riscv64 branch (plctlab fork).

---

## 8. Distribution and Release Status

**LuaJIT upstream releases:** The GitHub releases page for LuaJIT/LuaJIT shows "There aren't any releases here." LuaJIT distributes source only. No binary assets are published by the upstream project for any architecture.

**Distribution package status:**

| Distribution | riscv64 available | Version | Notes |
|---|---|---|---|
| Ubuntu 24.04 Noble | No (JIT binary) | 2.1.0+git20231223.c525bcb+dfsg-1 | Only libluajit-5.1-common (arch:all) lands on riscv64. luajit binary, libluajit-5.1-2, and libluajit-5.1-dev are absent for riscv64. Packages the upstream LuaJIT snapshot which predates riscv64 JIT support. |
| Debian trixie (stable, 2025) | Yes | 2.1.0+openresty20250117-2 | Installed on riscv64. Based on OpenResty fork, not upstream LuaJIT. |
| Debian sid (unstable) | Yes | 2.1.0+openresty20251030-1+b2 | Installed on riscv64, built on rv-osuosl-05. OpenResty fork. Known FTBFS bug #1105487 (build order only, not normal builds). |
| Alpine Linux edge | No | 2.1_p20251030-r0 | x86_64 only in main repo. |
| Arch Linux RISC-V | Data not available | - | archriscv.felixc.at status page returned 404 during research. |
| GitHub Releases | No | N/A | No releases published by upstream. |
| PyPI | No | N/A | No "luajit" package on PyPI. HTTP 404. |
| RISE wheel builder | No | N/A | Redirects to PyPI which returns 404. |

**Critical distinction:** The Debian riscv64 packages (`2.1.0+openresty*`) are the OpenResty downstream fork, not upstream LuaJIT. OpenResty's fork ([openresty/luajit2](https://github.com/openresty/luajit2)) independently incorporated PLCT Lab patches for riscv64. Upstream LuaJIT (LuaJIT/LuaJIT) has zero merged riscv64 support; Ubuntu Noble (which packages the upstream version) explicitly excludes riscv64 from all JIT binary packages.

**What a user must do to get a working riscv64 LuaJIT binary:**
1. Option A: Use Debian trixie or sid (ships OpenResty fork with riscv64 support).
2. Option B: Clone plctlab/LuaJIT, check out the v2.1-riscv64-pr branch, and build from source with Binutils >= 2.35.
3. Option C (no JIT): Build upstream LuaJIT/LuaJIT with LUAJIT_DISABLE_JIT, running in interpreter-only mode -- but this defeats the purpose of LuaJIT.

---

## 9. Dependencies

LuaJIT uses a Makefile build system with no external dependency manifest.

**Summary table:**

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| DynASM (internal) | JIT macro-assembler preprocessor; transforms .dasc files into C | Not in upstream v2.1; present in PR #1267 branch | Not in upstream | Not released upstream | PR #1267 unmerged |
| GNU Binutils / gas | Assembler for RISC-V; required to assemble DynASM-generated output | Yes (>= 2.35 required) | Yes | Yes | Binutils 2.34 in Yocto SDK 3.1.x fails; workaround: upgrade |
| libm | Math library (sin, cos, sqrt etc.); linked via -lm | Yes (part of glibc) | Yes | Yes | None |
| libdl | Dynamic linker (dlopen/dlsym); linked on Linux | Yes (part of glibc) | Yes | Yes | None |
| libffi | FFI calling-convention support for ffi.* module | Yes (added in libffi 3.3, 2019) | Yes | Yes | None. See `project-reports/libffi.md` |
| GCC / Clang | C compiler for host minilua and target build | Yes (both support riscv64) | Yes | Yes | None |
| Lua 5.1 / minilua | Self-hosted minimal Lua interpreter; compiled from host/minilua.c at build time | N/A (source-only, compiled during build) | N/A | N/A | None |

**Deep dive -- DynASM (the critical dependency):**
DynASM is LuaJIT's internal macro-assembler. The riscv64 DynASM support (dasm_riscv.h, dasm_riscv.lua, dasm_riscv64.lua, dasm_riscv32.lua) does not exist in the upstream repository. These files exist only in the PR #1267 branch. Without them, the riscv64 VM cannot be assembled. This is not an external dependency problem; it is part of the same unmerged PR. Unblocking it requires the same PR merge.

**Deep dive -- libffi on riscv64:**
libffi added riscv64 support in version 3.3 (released March 2019). Static trampolines were added in 3.6.0 (2026). LuaJIT's FFI module uses libffi for call convention handling. The libffi dependency is not a blocker for riscv64. See `project-reports/libffi.md` for details.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #628](https://github.com/LuaJIT/LuaJIT/issues/628) | Add support for RISC-V | Open (since Oct 2020) | Critical | Master tracking issue; tagged LuaJIT 3.0 milestone; no maintainer assignment; no merge timeline stated |
| [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) | Add support for RISC-V 64 Linux | Open (since Sep 2024) | Critical | 23 commits, 11,166 additions; not reviewed by Mike Pall; mergeable state: clean |
| [openresty/luajit2 #236](https://github.com/openresty/luajit2/pull/236) | RISC-V 64 port (OpenResty fork) | Open (since Jun 2024) | High | Downstream PR; Debian ships riscv64 based on this; cdata equality bug confirmed and fixed Jun 2026 (andreas-schwab) |
| Bug in PR #1267 | pcall(pcall) segfault | Fixed in PR branch (not upstream) | High | register clobber in vm_riscv64.dasc FFI fallback path; fix uses TMP0 for arithmetic before committing to RC |
| Bug in PR #1267 | math.min/math.max NaN semantics mismatch | Fixed in PR branch (not upstream) | High | fmin.d/fmax.d return NaN when either operand is NaN, violating LuaJIT cross-architecture semantics; RISC-V base ISA has no cheap branchless alternative (no flags register, no FPR conditional moves, no FPR bitwise ops); fix uses flt.d + branch sequence |
| Build issue in PR #1267 | Binutils < 2.35 incompatibility | Documented; not a code bug | Medium | %got_pcrel_hi relocation requires Binutils 2.35+; Yocto SDK 3.1.x ships 2.34; workaround: upgrade toolchain |
| Warning in PR #1267 | 'nsp' may be used uninitialized in lj_ccall.c | Acknowledged, fix planned | Low | FFI two-element struct handling hack; cosmetic warning; no correctness impact confirmed |
| FFI struct passing | Partially broken | Known gap | Medium | Acknowledged in plctlab release notes; no detail on which struct types are affected; no upstream bug report found |

---

## 12. Objections and Upstream Blockers

**Blocker 1 -- Mike Pall merge approval (HARD BLOCKER)**
Mike Pall is the sole maintainer with merge rights. He has not commented on PR #1267 at all since it was opened in September 2024 despite 144 community reactions (46 thumbs-up, 55 rocket, 33 heart) and 26 comments from other contributors. His documented position (from Issue #628, October 2020) is that new ports require: JIT backend (present), sponsorship for long-term maintenance (partially addressed via RISE), and code quality meeting his standards (PR has had community review but no maintainer review). There is no mechanism to force or bypass this review. No merge timeline exists.

**Blocker 2 -- Long-term maintenance sponsorship**
IgnotaYun explicitly listed this as a prerequisite for upstreaming. Ruinland (Andes Technology, RISE System Library WG) offered a formal RFP process through RISE with up to 3000 EUR payment. IgnotaYun acknowledged (May 2025) that RISE involvement could address this blocker if Mike Pall accepts it as sufficient.

**Blocker 3 -- RISC-V ISA architectural constraints**
The math.min/math.max NaN issue exposes a real ISA gap: RISC-V base ISA lacks a flags register, FPR conditional moves, and bitwise operations on floating-point registers. This forces branchy sequences for operations that are branchless on x86. The branchy sequence is functionally correct but imposes a performance cost on FP-heavy workloads. This is an inherent RISC-V ISA property, not a fixable code issue, though Zfa (FMINM/FMAXM with IEEE 754-2019 minimum/maximum semantics) may provide an alternative if Mike Pall accepts different semantics mapping. Corsix confirmed: "no cheap branchless way of getting the desired semantics."

**Blocker 4 -- Author is an undergraduate intern**
IgnotaYun is described in the PR as an undergraduate from a PLCT Lab / ISCAS internship. Mike Pall's documented standards require deep expertise across five domains simultaneously. The quality of the submitted code (137 KB hand-tuned DynASM, full extension probing, DWARF support, disassembler) is substantive, but the author's institutional status may reduce confidence in long-term maintenance commitment without a backing organization.

**Non-blocker: Code quality**
One formal review approval (ccuser44, October 2024) with no commentary was recorded. Community testing confirmed the port works on SiFive U74, SpacemiT K1/K3, and VisionFive 2 as of early 2026. The pcall and NaN bugs were identified and patched by community contributors, not the original author, which is standard open-source workflow.

**Acceptance probability:** Low-to-medium in the near term. The RISE engagement is the most credible path to resolution, but Mike Pall's historical pace of upstream activity is extremely slow and his engagement with this PR is zero. The OpenResty fork has already shipped riscv64 in Debian, reducing pressure on the upstream merge.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 JIT backend is substantively complete in the PR branch. The two correctness bugs (pcall segfault, math.min/max NaN) have patches in the PR branch. The remaining functional work is limited to:

- FFI struct passing: needs diagnosis of which struct configurations are broken and fixes. Estimated 2-4 person-weeks given LuaJIT FFI complexity.
- Callbacks via FFI: status unclear; needs verification and testing. Estimated 1-2 person-weeks.

**RISE has already done:** RISE offered a 3000 EUR Developer Appreciation Program reward for upstreaming work (Ruinland, May 2025 and November 2025). No evidence that anyone has claimed or completed this work as of June 2026.

### 13.2 Performance Optimization

No baseline benchmark data exists. Before investing in optimization, a benchmark suite needs to be established.

- Establish riscv64 LuaJIT performance baseline vs arm64 and x86_64: 1-2 person-weeks.
- Zba/Zbb/Zicond integration review for missed optimization opportunities: 1-2 person-weeks.
- Zfa (FMINM/FMAXM) evaluation as replacement for branchy min/max sequences: 1 person-week.
- RVV integration: LuaJIT does not currently JIT vector operations on any architecture; this is out of scope for a standard LuaJIT investment.

### 13.3 CI/CD Infrastructure

The upstream LuaJIT project has no CI for any architecture. Adding riscv64 CI requires adding CI from scratch, or adding it only to the plctlab fork.

- Set up GitHub Actions using RISE Runners (ubuntu-24.04-riscv, free) running the LuaJIT test suite on the plctlab fork: 1 person-week.
- QEMU user-space CI fallback (for cross-compiled builds): 1 person-week.

### 13.4 Ecosystem Enablement

LuaJIT has no significant dependent package ecosystem that requires separate enablement. Applications that embed LuaJIT (Neovim, KOReader, OpenResty/Nginx, game engines) will pick up riscv64 support once the upstream merge occurs. No separate package-by-package work is needed.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream PR #1267 merge: engage Mike Pall directly with sponsorship commitment; coordinate with RISE RFP process | 2-4 | Chip company + RISE liaison | Critical |
| Functional | Diagnose and fix FFI struct passing gaps | 2-4 | LuaJIT RISC-V contributor | High |
| Functional | Verify and test FFI callbacks on riscv64 | 1-2 | LuaJIT RISC-V contributor | High |
| Performance | Establish riscv64 benchmark baseline (vs arm64, x86_64) | 1-2 | Contributor | High |
| Performance | Evaluate Zfa FMINM/FMAXM for min/max NaN fix | 1 | LuaJIT RISC-V contributor | Medium |
| Performance | Zba/Zbb/Zicond optimization audit | 1-2 | LuaJIT RISC-V contributor | Medium |
| CI/CD | GitHub Actions CI on plctlab fork via RISE Runners | 1 | Contributor | High |
| CI/CD | QEMU user-space CI for cross-build validation | 1 | Contributor | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [LuaJIT/LuaJIT -- upstream repository](https://github.com/LuaJIT/LuaJIT)
- [PR #1267 -- Add support for RISC-V 64 Linux](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [Issue #628 -- Add support for RISC-V](https://github.com/LuaJIT/LuaJIT/issues/628)
- [LuaJIT official status page](https://luajit.org/status.html)
- [LuaJIT FAQ -- port policy](https://luajit.org/faq.html)
- [LuaJIT sponsors page](https://luajit.org/sponsors.html)
- [openresty/luajit2 PR #236 -- RISC-V 64 port for OpenResty fork](https://github.com/openresty/luajit2/pull/236)
- [plctlab/LuaJIT -- active RISC-V development fork](https://github.com/plctlab/LuaJIT)
- [ruyisdk/LuaJIT -- downstream support fork](https://github.com/ruyisdk/LuaJIT)
- [Debian buildd -- luajit package status (sid)](https://buildd.debian.org/status/package.php?p=luajit&suite=sid)
- [Debian buildd -- luajit package status (trixie)](https://buildd.debian.org/status/package.php?p=luajit&suite=trixie)
- [Launchpad -- luajit in Ubuntu Noble](https://launchpad.net/ubuntu/noble/+source/luajit)
- [Alpine Linux packages -- luajit edge](https://pkgs.alpinelinux.org/packages?name=luajit&branch=edge)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Runners announcement (March 2026)](https://riseproject.dev/blog)
- [SerenityOS issue #26704 -- LuaJIT RISC-V still unsupported upstream](https://github.com/SerenityOS/serenity/issues/26704)
- [Gentoo RISC-V issue #20 -- LuaJIT packaging using PR #1267 patches](https://github.com/gentoo/riscv/issues/20)