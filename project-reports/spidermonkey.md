---
title: SpiderMonkey
parent: Project Reports
categories:
  - runtimes
  - browser
---

# SpiderMonkey

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for SpiderMonkey<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

SpiderMonkey is Mozilla's JavaScript and WebAssembly engine. It serves as the runtime for Firefox, and is also distributed as the standalone `libmozjs` library consumed by GNOME (via GJS), GTK applications, and embedded use cases. The engine implements a multi-tier JIT: an interpreter, a Baseline JIT, and an optimizing JIT (Ion/Warp). WebAssembly is compiled through a separate Wasm baseline compiler and IonMonkey.

The riscv64 port is a full JIT backend -- not a stub. It covers the Baseline JIT, the optimizing JIT, the Wasm baseline compiler, trampolines, a software simulator, and a disassembler. The JIT was enabled by default on riscv64 as of Firefox 143 ([Bug 1982266](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266)).

The port is not maintained by Mozilla employees. It is developed by PLCT Lab at ISCAS (Institute of Software, Chinese Academy of Sciences) and by individual contributors, reviewed by Mozilla's JIT team. RISC-V is not listed at any Mozilla support tier.

**Homepage:** [spidermonkey.dev](https://spidermonkey.dev/)
**Repository:** [github.com/mozilla/gecko-dev](https://github.com/mozilla/gecko-dev) (read-only mirror of Mozilla's Mercurial tree)
**Issue tracker:** [bugzilla.mozilla.org](https://bugzilla.mozilla.org/) (component: Core :: JavaScript Engine: JIT)
**JIT backend source:** `js/src/jit/riscv64/`

---

## 2. Port History and Upstreaming Timeline

All patches land through Mozilla's Phabricator code review system and push to the `mozilla-central` Mercurial tree, then mirror to gecko-dev. There are no GitHub PRs; merge status is confirmed by Bugzilla RESOLVED FIXED status and presence of commit SHA in the mirror.

| Date | Bug | Event |
|---|---|---|
| 2016-11-20 | [Bug 1318905](https://bugzilla.mozilla.org/show_bug.cgi?id=1318905) | Opened: build-system changes to support Linux/RISC-V. Assigned to John Paul Adrian Glaubitz (Debian RISC-V porter). No JIT, interpreter only. |
| 2020-06-18 | [Bug 1318905](https://bugzilla.mozilla.org/show_bug.cgi?id=1318905) | Resolved FIXED. Three commits by Glaubitz: add riscv64 target to mozbuild, enable `AtomicOperations-feeling-lucky.h`, define `RETURN_INSTR`. First riscv64 commit in gecko-dev. |
| 2021-06-29 to 2021-07-07 | [Bug 1718510](https://bugzilla.mozilla.org/show_bug.cgi?id=1718510), [Bug 1719115](https://bugzilla.mozilla.org/show_bug.cgi?id=1719115) | Makoto Kato and Michael Froman add riscv64 defines to build_config.h. |
| 2022-11-14 | [Bug 1800431](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431) | Opened by Lu Yahan (PLCT/ISCAS): riscv64 JIT backend initial patch set. |
| 2023-01-23 | [Bug 1800431](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431) | Resolved FIXED. Lu Yahan lands full riscv64 JIT backend in three commits (SHA `a2bed06`, `affd777`, `7bbe784`). 58 files: Architecture, Assembler, CodeGenerator, Lowering, MacroAssembler, Trampoline, Simulator. Reviewers: jandem, nbp, jseward, mgaudet. SunSpider showed 6x perf improvement vs interpreter [NEEDS VERIFICATION -- single source, no methodology or hardware described]. Firefox 111 branch. |
| 2023-04-13 | [Bug 1826741](https://bugzilla.mozilla.org/show_bug.cgi?id=1826741) | Enable JIT by default on riscv64 (first activation). Commit `6bd9aca` (luyahan). Firefox 114. |
| 2023-06-16 | [Bug 1837111](https://bugzilla.mozilla.org/show_bug.cgi?id=1837111) | Enable Wasm baseline compiler on riscv64. |
| 2023-07-06 | [Bug 1817476](https://bugzilla.mozilla.org/show_bug.cgi?id=1817476) | Enable Wasm huge memories on riscv64. |
| 2023-10-13 to 2023-11-21 | [Bug 1845676](https://bugzilla.mozilla.org/show_bug.cgi?id=1845676), [Bug 1850864](https://bugzilla.mozilla.org/show_bug.cgi?id=1850864) | Large batch: multi-memory Wasm support for riscv64 (Lu Yahan and Julian Seward). |
| 2024-03-07 | [Bug 1880366](https://bugzilla.mozilla.org/show_bug.cgi?id=1880366) | Hovav Shacham (Mozilla) adds RISC-V support to `jit::Disassemble`. Enables `print(disnative(f))` for JIT'd functions. Firefox 125. |
| 2025-01-31 | [Bug 1944011](https://bugzilla.mozilla.org/show_bug.cgi?id=1944011) | Andre Bargull (Mozilla) fixes register allocation for `LAtomicTypedArrayElementBinop64` on RISCV. |
| 2025-07-07 to 2025-07-08 | [Bug 1975643](https://bugzilla.mozilla.org/show_bug.cgi?id=1975643) | CSharperMantle (Rong Bao) implements WebAssembly JSPI stack switching for both native riscv64 and simulator. Four commits (`a20fefa`, `2cc62eb`, `1dbbaa4`, `f949956`). Reviewed by yurydelendik and jandem. |
| 2025-08-11 | [Bug 1982266](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266) | Enable JIT by default on riscv64 (second, final activation). Commit `78a5204d76f3`. Reviewed by jseward. Firefox 143. |
| 2025-09-09 | [Bug 1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) | Meta tracking bug `sm-riscv64` opened by Nicolas B. Pierron (Mozilla). Priority P3. 57 sub-bugs total; 2 remain open as of 2026-06-12. |
| 2025-10-28 | [Bug 1996840](https://bugzilla.mozilla.org/show_bug.cgi?id=1996840) | Veneer pool overflow assertion failure (`is_intn(imm, kJumpOffsetBits)`) in `base-riscv-i.h`. sec-high. Fixed in Firefox 146/ESR140/ESR115 via 6-part patch series by Rong Bao, reviewed by nbp. |
| 2025-11-27 | [Bug 1996840](https://bugzilla.mozilla.org/show_bug.cgi?id=1996840) | Veneer pool fix commits land: `3406c2ca`, `99fa19f9`, `15be8ef1`, plus 3 additional parts. |
| 2025-12-09 | [Bug 2003218](https://bugzilla.mozilla.org/show_bug.cgi?id=2003218) | Support RISC-V Zbb bit-manipulation extension. Priority P2. Tested on SiFive/HiFive P550. Firefox 148. |
| 2026-01 (bulk) | [Bug 2039030](https://bugzilla.mozilla.org/show_bug.cgi?id=2039030) | Andre Bargull removes unused V8-copied and MIPS64-copied dead code from simulator. 50 commits in January 2025 alone. |
| 2026-05-25 | [Bug 2041360](https://bugzilla.mozilla.org/show_bug.cgi?id=2041360) | Andre Bargull fixes missing `AutoForbidPoolsAndNops` guards in assembler. 10-part series: wrong `FaultingCodeOffset` values for wasm load/store traps, atomic ops, FP load/store, and `ma_liPatchable`. 10 commits (`e6dbaf82`, `71535c53`, `d15335e5`, plus 7 more). |
| 2026-06-11 | [Bug 2045021](https://bugzilla.mozilla.org/show_bug.cgi?id=2045021) | Andre Bargull adds Zbs, Zfa, Zfhmin, Zicond extension support. 9-part series. Introduces `--riscv-ext` shell option (replacing `RISCV_EXT_ZBA`/`RISCV_EXT_ZBB` env vars). Note: V8 has a bug in `fcvt.s.h`; fix uses SpiderMonkey's own `vm/Float16.h` instead of copying V8's implementation. |

---

## 3. Upstream Support Tier

Mozilla's supported-configurations documentation defines four platform tiers:

- **Tier 1:** Linux x86-64/AArch64, macOS x86-64/AArch64, Windows x86/x86-64/AArch64, Android ARMv7/ARMv8-A/x86-64
- **Tier 2:** Windows/mingw-clang (maintainers named explicitly)
- **Tier 3:** Linux ARM variants, PowerPC, FreeBSD, OpenBSD, NetBSD, Solaris
- **RISC-V:** Not listed at any tier.

The port exists in-tree with JIT and Wasm support but has no Mozilla CI coverage. The model is: external team owns the port, Mozilla reviewers gate quality, Mozilla CI does not cover the architecture. This is confirmed by the Bug 1800431 discussion, which noted a plan for daily regression CI at `ci.rvperf.org` (PLCT-operated), mirroring the V8 RISC-V CI model.

Mozilla is not a member of the RISE Project. RISE premier and general members include Andes Tech, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Alibaba DAMO, Tenstorrent, Akeana, BOSC, ByteDance, Canonical, ESWIN, ISCAS, Microchip, SpacemiT, and ZTE. Mozilla is absent from all membership lists.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Backend Structure

The backend lives entirely in `js/src/jit/riscv64/` and three subdirectories. It is entirely C++; there are no `.S` assembly files. It is a port of V8's RISC-V backend (BSD-licensed, copyright 2021-2022 V8 project authors). All files carry dual Mozilla MPL 2.0 + V8 BSD copyright headers.

**Top-level files:**

| File | Approx. lines | Purpose |
|---|---|---|
| `MacroAssembler-riscv64.cpp` | 6,596 | Macro assembler method bodies: Zicond (`czero_eqz/nez`), Zbb (`max/min`), Zba (`sh1add/sh2add/sh3add`), Zfhmin load/store, Zfa (`fround_d/s`) |
| `Simulator-riscv64.cpp` | 4,154 | Full software simulator: 32 GPR + 32 FPR + CSR; all ISA decode stubs; Zfa FLI lookup tables; RVV under `CAN_USE_RVV_INSTRUCTIONS` |
| `CodeGenerator-riscv64.cpp` | 2,469 | IonMonkey MIR-to-machine-code: arithmetic, FP, table-switch, bailouts, wasm atomics/loads/stores, truncation |
| `MacroAssembler-riscv64-inl.h` | 1,900 | Inline MacroAssembler methods; `HasZfaExtension()` for `fcvtmod_w_d`; `HasZfhminExtension()` for `fmv_x_h / fmv_h_x` |
| `Assembler-riscv64.cpp` | 1,553 | Assembler method bodies; `ABIArgGenerator` (SIMD128 hits `MOZ_CRASH`); `GeneralLiCount()` uses `HasZbaExtension()` for `zext.w` vs slli/srli |
| `Lowering-riscv64.cpp` | 1,068 | MIR-to-LIR lowering: div/mod optimizations, wasm load/store, atomics; all SIMD visitors = `MOZ_CRASH("... NYI")` |
| `Architecture-riscv64.h` | 535 | Register definitions; `RVFlags` class with `HasZbaExtension()`, `HasZbbExtension()`, `HasZbsExtension()`, `HasZfhminExtension()`, `HasZfaExtension()`, `HasZicondExtension()`; `ReturnSimd128Reg = invalid_reg` |
| `Trampoline-riscv64.cpp` | 777 | JIT trampolines: `generateEnterJIT` (OSR support), `generateInvalidator`, `generateBailoutHandler`, `generatePreBarrier`, `generateVMWrapper` |
| `MacroAssembler-riscv64.h` | 1,100 | MacroAssembler class declarations; Float16 via Zfhmin; `typedef MacroAssemblerRiscv64Compat MacroAssemblerSpecific` |

**Subdirectory `base/`:** Abstract `AssemblerRiscvBase`, typed instruction field access covering R/I/S/B/U/J/C types and V (RVV) types including `kVType`, `kVLType`, `kVSType`, `kVAMOType`. Full RVC decode. vsetvli/vsetivli decode.

**Subdirectory `constant/`:** 15 header files with opcode/funct6 constant enums per extension: I, M, A, C, F, D, B, V (20,732 bytes with full RVV opcode table), Zfa, Zfh, Zicond, Zicsr, Zifencei. Note: a possible funct6 typo in `Constant-riscv-v.h`: `VFREDMAX_FUNCT6 = 0b0001111` appears to encode a 7-bit value where funct6 is 6 bits [NEEDS VERIFICATION].

**Subdirectory `extension/`:** 24 files (.cc + .h pairs), one per ISA extension. The RVV extension file (`extension-riscv-v`) is 35,348 bytes and implements full RVV 1.0 under `#ifdef CAN_USE_RVV`: unit/strided/indexed load/store, segmented (VLSEG2-8/VSSEG2-8), vadd/vsub/vmul/vdiv, vfadd/vfmul/vfmacc, vfcvt, compare/mask, gather/slide, narrow/clip.

**Subdirectory `disasm/`:** Full disassembler in `Disasm-riscv64.cpp` (74,670 bytes). Enabled via [Bug 1880366](https://bugzilla.mozilla.org/show_bug.cgi?id=1880366) (Firefox 125).

### 4.2 ISA Extension Runtime Detection

The `RVFlags` / `SetRISCV64ExtensionsString()` mechanism probes for optional extensions at runtime. Extensions actively used in the MacroAssembler for micro-optimizations:

| Extension | Runtime probe | Uses |
|---|---|---|
| Zba | `HasZbaExtension()` | `sh1add`, `sh2add`, `sh3add`, `zext.w`, `add.uw` |
| Zbb | `HasZbbExtension()` | `max`, `min`, `andn`, `clz`, `ctz`, `rol`, `ror` |
| Zbs | `HasZbsExtension()` | `bclr`, `bext`, `binv`, `bset` |
| Zfhmin / Zfh | `HasZfhminExtension()` | Float16 convert, load/store |
| Zfa | `HasZfaExtension()` | `fround_d/s`, `fcvtmod.w.d`, `fli.s/d`, `fminm/fmaxm` |
| Zicond | `HasZicondExtension()` | `czero_eqz`, `czero_nez` |

The base I/M/A/F/D extensions are assumed present (RV64GC baseline) with no runtime probe.

### 4.3 RVV (Vector Extension) Status

RVV infrastructure is present but is NOT wired into the WASM SIMD or JS SIMD pipeline:

- Full opcode constants (~20KB in `Constant-riscv-v.h`)
- Full assembler bindings (~35KB in `extension-riscv-v.cc/.h`) under `#ifdef CAN_USE_RVV`
- Simulator decode stubs under `#ifdef CAN_USE_RVV_INSTRUCTIONS`
- RVV type fields in `Instruction.h` (`kVType`, `kVLType`, `kVSType`, `kVAMOType`)
- The MacroAssembler does NOT use any RVV instructions
- `Architecture-riscv64.h` contains `#ifdef ENABLE_WASM_SIMD / #error "Needs more careful logic if SIMD is enabled"`, which is a compile-time assertion blocking SIMD enablement
- `ReturnSimd128Reg = invalid_reg` and `ScratchSimd128Reg = invalid_reg` in `Register-riscv64.h`
- `ABIArgGenerator` in `Assembler-riscv64.cpp` crashes on `MIRType::Simd128`
- All `visitWasm*Simd128` functions in `CodeGenerator-riscv64.cpp` are `MOZ_CRASH("No SIMD")`

The gap between RVV infrastructure presence and actual JIT SIMD use is significant. Bridging it requires wiring the RVV assembler into the Ion SIMD lowering pipeline, implementing all Simd128 LIR visitors, allocating valid SIMD registers, and passing all jit-test SIMD suites -- this is multiple person-months of work.

### 4.4 Known MOZ_CRASH Stubs Specific to riscv64

| Location | Stub | Impact |
|---|---|---|
| `CodeGenerator-riscv64.cpp:2386` | `visitNearbyInt()` -- `MOZ_CRASH("NYI")` | Float rounding to nearest integer (e.g., `Math.round` IR lowering) will crash if this path is reached; arm64 and x64 implement it |
| `CodeGenerator-riscv64.cpp:2388` | `visitNearbyIntF()` -- `MOZ_CRASH("NYI")` | Same for float32 |
| `MacroAssembler-riscv64.cpp:2829` | `atomicPause()` -- `MOZ_CRASH("NYI")` | Spin-loop hints not emitted; arm64 implements with `Isb()`; performance gap for atomic spin-waits |
| `Trampoline-riscv64.cpp:729` | `callVM with 128-bit values` -- `MOZ_CRASH("NYI: riscv callVM should not be used with 128bits values.")` | Exists identically in arm64 trampoline; not riscv64-specific |
| `Assembler-riscv64.h` | `verifyHeapAccessDisassembly` -- `MOZ_CRASH()` | Debug-only disasm verification |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Key Config Variables

Defined in `js/moz.configure`:

| Variable | Set when |
|---|---|
| `JS_CODEGEN_RISCV64` | `target.cpu == "riscv64"` (native or cross-compile target) |
| `JS_SIMULATOR_RISCV64` | `--enable-simulator=riscv64` is passed on x86_64 or aarch64 host |
| `JS_DISASM_RISCV64` | Debug/jitspew active and riscv64 codegen or simulator is enabled |

The CPU triplet `riscv64gc` is canonicalized to `riscv64` in `build/moz.configure/init.configure`.

### 5.2 Build Commands

**Native build on riscv64 hardware:**

```
cd js/src
mkdir build_OPT.OBJ && cd build_OPT.OBJ
../configure \
  --target=riscv64-unknown-linux-gnu \
  --enable-project=js \
  --enable-optimize \
  --disable-debug
make -j$(nproc)
```

**Cross-compile from x86_64 host:**

```
export CC=riscv64-linux-gnu-gcc
export CXX=riscv64-linux-gnu-g++
cd js/src
mkdir build_riscv64.OBJ && cd build_riscv64.OBJ
../configure \
  --target=riscv64-unknown-linux-gnu \
  --with-toolchain-prefix=riscv64-linux-gnu- \
  --with-sysroot=/path/to/riscv64-sysroot \
  --enable-project=js \
  --enable-optimize \
  --disable-debug
make -j$(nproc)
```

**Simulator build on x86_64 or aarch64 host (no riscv64 hardware needed):**

```
cd js/src
mkdir build_riscv64_sim.OBJ && cd build_riscv64_sim.OBJ
../configure \
  --enable-simulator=riscv64 \
  --enable-project=js \
  --enable-optimize \
  --enable-debug
make -j$(nproc)
```

The `--enable-simulator=riscv64` option is only valid on x86_64 or aarch64 host machines (enforced at configure time). It sets both `JS_SIMULATOR_RISCV64` and `JS_CODEGEN_RISCV64`, compiling `Simulator-riscv64.cpp`.

**QEMU-based test execution:** The build system exposes `--with-qemu-exe` (env: `QEMU_EXE`) and `--with-cross-lib` (env: `CROSS_LIB`) for running binaries on a non-native host via QEMU user-mode emulation. The test harness (jstests, jit-tests) consumes these.

### 5.3 Feature Flags for riscv64

| Feature | Status |
|---|---|
| `--enable-jit` | ON by default (riscv64 in `jit_default` CPU list) |
| `--enable-simulator=riscv64` | Available on x86_64/aarch64 host only |
| `--enable-wasm-jspi` | ON by default as of Firefox 142 |
| `--enable-wasm-simd` | NOT supported; compile-time `#error` guard in `Architecture-riscv64.h` |
| `JS_CODEGEN_RISCV64` | Set automatically when `target.cpu == riscv64` |
| SIMD (`isSimd128`) | Always false on riscv64 |

### 5.4 Toolchain Requirements

GCC minimum enforced globally: 8.1.0 (hard error in `build/moz.configure/toolchain.configure`). Clang minimum: 8.0 general, 13.0 for Android. No riscv64-specific minimum beyond the global floor. In practice, Debian Bookworm (GCC 12.x, binutils 2.40) or Ubuntu 22.04 (`gcc-riscv64-linux-gnu`) is sufficient.

Mozilla's Taskcluster CI defines no `sysroot-riscv64-linux-gnu`. Sysroots available in `taskcluster/kinds/toolchain/sysroot.yml` cover: i386, amd64, aarch64, wasm32 only.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Baseline JIT | Full | Full | Full | None |
| Optimizing JIT (Ion/Warp) | Full | Full | Full | None |
| Wasm baseline compiler | Full | Full | Full (since Firefox 113) | None |
| Wasm huge memories | Full | Full | Full (since Firefox 114) | None |
| Wasm multi-memory | Full | Full | Full (since Firefox 114) | None |
| Wasm JSPI | Full | Full | Full (since Firefox 142) | None |
| Wasm SIMD (v128) | Full | Full | Not supported | Hard blocker -- `#error` compile-time guard; all SIMD visitors `MOZ_CRASH` |
| `visitNearbyInt` / `visitNearbyIntF` | Full | Full | `MOZ_CRASH("NYI")` | JS float rounding operations; severity depends on whether this code path is reachable in practice |
| `atomicPause()` | Full | Full (`Isb()`) | `MOZ_CRASH("NYI")` | Spin-loop hint missing; performance gap for atomic spin-waits |
| Disassembler (`disnative()`) | Full | Full | Full (since Firefox 125) | None |
| Gecko Profiler | Full | Full | In-progress ([Bug 2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167), ASSIGNED) | Proof of concept on Milk-V Jupiter; stack sizes on RV64 much larger than x86-64 requiring increased snapshot allocation |
| ISA extension micro-opts | SSE4/AVX/AVX2 | NEON | Zba, Zbb, Zbs, Zfa, Zfhmin, Zicond (as of Firefox 148) | Functionally equivalent mechanism; no RVV |
| RVV/SIMD JIT use | AVX/SSE | NEON | Not wired | RVV assembler and constants exist but not connected to SIMD lowering pipeline |

---

## 7. CI/CD Infrastructure

### 7.1 Mozilla Taskcluster CI

**No riscv64 CI exists in Mozilla's official Taskcluster infrastructure.** This was confirmed by reading the following files in gecko-dev:

- `.github/workflows/close-pr.yml` -- auto-closes PRs, no CI, no riscv64 reference
- `taskcluster/kinds/build/linux.yml` -- all 2,156 lines read; zero riscv occurrences; cross-arch builds cover linux64-aarch64 only
- `taskcluster/kinds/test/test-platforms.yml` -- all CI test platforms listed; riscv64 absent
- `taskcluster/kinds/toolchain/sysroot.yml` -- sysroots: i386, amd64, aarch64, wasm32; no riscv64
- `taskcluster/kinds/spidermonkey/linux.yml` -- SpiderMonkey Linux CI tasks; platforms: linux64/opt, linux64/debug, linux32/debug, linux64-aarch64/debug; no riscv64
- `js/src/devtools/automation/variants/` -- variants: arm-sim, arm64-sim, asan, compacting, fuzzilli, fuzzilli-aarch64, nojit, wasi, wasi-intl, and others; no riscv64-sim variant

The `--enable-simulator=riscv64` build option exists in the build system but has no corresponding CI automation variant or scheduled Taskcluster job.

### 7.2 PLCT Lab Community CI

PLCT Lab operates `ci.rvperf.org` (Jenkins) with two SpiderMonkey jobs:

- `Spidermonkey-upstream-check`: approximately 1 hour 23 minutes runtime, approximately 24-hour cadence, 1,017 builds total [NEEDS VERIFICATION -- single source, no live fetch confirmation]
- `Spidermonkey-upstream-fast-check`: approximately 22 minutes, 15,931 builds total [NEEDS VERIFICATION -- single source]

Tests run on x86 Linux using `--enable-simulator=riscv64`, not native riscv64 hardware. Test suites: jstests, jit-test, jsapi-tests. RISC-V extensions tested via env vars: `RISCV_EXT_ZBA=1 RISCV_EXT_ZBB=1` (the `--riscv-ext` shell option introduced in Bug 2045021 supersedes these as of Firefox 148).

### 7.3 Impact of No Mozilla CI

The absence of Mozilla Taskcluster CI for riscv64 has a demonstrated engineering cost. [Bug 1957559](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559) was a 7-patch bundle required in April 2025 because "the riscv64 JIT had been broken for a long time" with no CI to detect regressions. [Bug 2041360](https://bugzilla.mozilla.org/show_bug.cgi?id=2041360) (May 2026) found that the assembler was missing `AutoForbidPoolsAndNops` guards before large classes of wasm offsets, with incorrect `FaultingCodeOffset` values across wasm load/store, atomic ops, and FP load/store -- a latent correctness issue that would have been caught by automated runs.

---

## 8. Distribution and Release Status

| Channel | riscv64 Binary Available | Details |
|---|---|---|
| Mozilla official Firefox binary | No | Mozilla does not publish official Firefox binaries for riscv64 at any tier |
| GitHub mozilla/gecko-dev releases | No | gecko-dev is a source mirror; zero release assets of any architecture |
| Debian trixie `libmozjs-128-0` | Yes -- confirmed | `libmozjs-128-0_128.14.0-1~deb13u1_riscv64.deb`, HTTP 200 confirmed, 9,357,328 bytes, Last-Modified Aug 23 2025 |
| Debian `libmozjs-128-dev` | Yes -- confirmed | Available alongside `libmozjs-128-0` for riscv64 in Debian trixie |
| Debian `mozjs128` build status | Yes -- Installed | Version 128.14.0-3, built on `rv-osuosl-05`; Debian sid |
| Ubuntu questing (25.10) `libmozjs-128-0` | Yes | Version 128.14.0-1, architectures include riscv64 |
| Ubuntu resolute (26.04 LTS) `libmozjs-128-0` | Yes | Same version; architectures include riscv64 |
| Fedora (fc43, fc44, fc45) mozjs128 | No | Koji directory listing: aarch64, i686, ppc64le, s390x, x86_64 only; riscv64 absent from every release |
| PyPI `spidermonkey` | No | Dead Python 2.7 binding from 2017; macOS Intel only; entirely irrelevant |
| Arch Linux RISC-V | Unknown | Not in FTBFS list on archriscv.felixc.at; no positive binary confirmation |

The libmozjs-128 package in Debian and Ubuntu provides the SpiderMonkey engine as a shared library (`libmozjs-128-0`) and development headers (`libmozjs-128-dev`) for riscv64. This is the primary distribution channel for riscv64. Fedora has no riscv64 build.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 SIMD | Blocking Issues |
|---|---|---|---|---|
| NSS (Network Security Services) | TLS/crypto: AES-GCM, ChaCha20-Poly1305, RSA, ECDH, SHA, certificate validation | Yes (scalar C only) | No -- zero riscv64 assembly in `lib/freebl/`; no AES-Zkn, Zvk, or RVV acceleration | No open NSS Bugzilla bugs for riscv64 found. Significant TLS performance gap vs arm64 (hw AES/SHA) and x86-64 (AES-NI). |
| dav1d (embedded, `third_party/dav1d/`) | AV1 video decode | Yes | Yes -- `src/riscv/64/` contains 9 RVV `.S` files covering CDEF, intra prediction (8+16-bit), ITX, MC (8+16-bit), PAL, CPU detection | No open riscv64 GitHub issues found. Best riscv64 SIMD story among Firefox third-party libraries. |
| libjpeg-turbo (embedded, `media/libjpeg/`) | JPEG encode/decode | Broken -- [Bug 1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883) "riscv64: build failure in media/libjpeg/riscv" (NEW, unassigned) | Upstream 3.1.90 beta has RVV SIMD; stable 3.1.x does not; embedded copy not updated | Bug 1984883 (NEW, unassigned). Upstream issue [#895](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895) open (Jun 2026). |
| libpng (embedded, `media/libpng/`) | PNG decode | Yes (RVV code merged May 2025, upstream 1.6.49+) | Partial -- post-merge correctness bugs: issue #711 (wrong RVV version), issue #769 (paeth3/paeth4 wrong pixels on SpacemiT K1, causing 52 OpenCV failures, approximately v1.6.52 fix) | Bug 1984883 also references this component. |
| Highway (`third_party/highway/`) | SIMD portability layer for JPEG-XL | Yes | RVV backend in `hwy/ops/rvv-inl.h`; runtime dispatch for Clang 19+ merged in [PR #2968](https://github.com/google/highway/pull/2968) (Apr 2026); stable 1.4.0 (Apr 23 2026) includes RVV | [Issue #2854](https://github.com/google/highway/issues/2854) mold linker on riscv64 (open, Jan 2026); [Issue #2738](https://github.com/google/highway/issues/2738) wrong `-march` flag for RVA23 (open, Sep 2025) |
| JPEG-XL (`third_party/jpeg-xl/`) | JPEG-XL image decode (uses Highway) | Yes (scalar) | Disabled: `JPEGXL_ENABLE_SIZELESS_VECTORS=false`; comment: "TODO: JXL currently compiles but does not pass tests" | [PR #1429](https://github.com/libjxl/libjxl/pull/1429) "Add support for 64-bit RISC-V arch" closed as abandoned (Jun 2022); no active riscv64 JXL development found in 2025-2026 |
| jemalloc (`memory/jemalloc/`) | Memory allocator | Yes (generic fallback) | N/A | [Issue #2399](https://github.com/jemalloc/jemalloc/issues/2399) "Does jemalloc support cross build for RISCV64?" open since Mar 2023, unanswered. No `pause` hint (Zihintpause) for spin loops. No arch-specific arena sizing. |
| libwebrtc (`third_party/libwebrtc/`) | WebRTC audio/video conferencing, DSP | Yes (scalar only) | No -- `BUILD.gn` has no riscv64 condition | [Bug 1830461](https://bugzilla.mozilla.org/show_bug.cgi?id=1830461) (WebRTC allowed to build on Linux/riscv64) resolved approximately Firefox 116. All audio processing and codec DSP entirely scalar. |
| aom (`third_party/aom/`) | AV1 encoder | Yes (scalar only) | No -- `CMakeLists.txt` arch-specific files cover ARM/NEON, x86/SSE/AVX, MIPS only | No public riscv64 issues found (AOMedia tracker requires sign-in). All AV1 encoding is scalar on riscv64. |
| zstd (`third_party/zstd/`) | Network/artifact compression | Yes | In-progress -- riscv64 arch detection merged ([PR #4525](https://github.com/facebook/zstd/pull/4525), Dec 2025); 5 open PRs for riscv64 optimization in 2026 | [PR #4622](https://github.com/facebook/zstd/pull/4622) Huffman 4-way loop (Mar 2026, open); [PR #4629](https://github.com/facebook/zstd/pull/4629) RVV ZSTD_count (Mar 2026, open); [PR #4643](https://github.com/facebook/zstd/pull/4643) PREFETCH_L1 (Apr 2026, open) |
| libsrtp (`third_party/libsrtp/`) | SRTP for WebRTC | Yes (scalar) | N/A | [Issue #754](https://github.com/cisco/libsrtp/issues/754) test_roc_driver.c timeout under riscv64 (open, Apr 2025). Likely test harness timing, not functional correctness. |
| libwebp (`media/libwebp/`) | WebP image decode | Yes (scalar only) | No -- `src/dsp/` has no RVV acceleration | No open riscv64 GitHub issues in webmproject/libwebp. |
| NSPR (`nsprpub/`) | Platform abstraction: threads, IO, timers | Assumed yes via generic POSIX path | N/A | [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232) NSPR support for FreeBSD/riscv64 -- UNCONFIRMED. Linux riscv64 path not explicitly verified. |

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

The RISE Project has no documented involvement with SpiderMonkey. All 27 RISE blog posts from May 2024 through June 2026 were scanned; zero posts mention SpiderMonkey. RISE's wiki Key Software page lists only GCC and LLVM as tracked compiler projects. SpiderMonkey does not appear in any RISE RFP, working group, runner configuration, or GitHub repository under github.com/orgs/riseproject-dev.

The only JavaScript engine content in RISE blogs is "A Glimpse Into V8 Development for RISC-V" (December 9, 2025), which covers Google's V8 exclusively. Quantitative data from that V8 post: instruction count for address calculations reduced from 4 to 2 using Zba SHxADD; pointer decompression reduced from 5 to 2 instructions using `zext.w`; approximately 25% of RISC-V V8 commits in 6 months were maintenance; JetStream suite (approximately 33 MB Wasm bytecode, approximately 2M lines of JS) now completes fully on RISC-V [NEEDS VERIFICATION -- single source for V8 figures].

SpiderMonkey on RISC-V is developed outside RISE, organically, primarily by Andre Bargull and Rong "Mantle" Bao, with PLCT Lab providing simulator-based CI.

### 10.2 Primary Contributors

| Contributor | Affiliation | Role | Commits (since Jan 2024) |
|---|---|---|---|
| Andre Bargull (andrebargull) | Mozilla (Mozilla employee) | Correctness fixes, dead code removal, ISA extension support | 54 |
| Rong "Mantle" Bao (csmantle) | ISCAS/PLCT Lab | Active riscv64 maintainer, Mozilla Level 3 commit access | 13 |
| Iain Ireland | Mozilla | General JIT work touching riscv64 | 9 |
| Makoto Kato | Mozilla | Build system | 7 |
| Lu Yahan (luyahan) | ISCAS/PLCT Lab | Original port author 2022-2023; primary contributor through Firefox 114 | N/A (pre-2024) |
| Ji Qiu (qiuji) | ISCAS | Co-author of original port | N/A (pre-2024) |

Mozilla JIT reviewers who gate all riscv64 patches: Jan de Mooij (jandem), Nicolas B. Pierron (nbp), Julian Seward (jseward), Ben Visness (bvisness, Wasm team), Ryan Hunt.

### 10.3 Published Benchmark Data

No public Speedometer, JetStream, Octane, or Wasm benchmark scores for SpiderMonkey on RISC-V hardware were found in any of the following sources: RISE Project blog, spidermonkey.dev blog, GitHub mozilla/gecko-dev issues, Mozilla Bugzilla, PLCT Lab GitHub, RISC-V Summit schedules, csmantle.top blog.

The only quantitative performance data is instruction-count reduction from optimization bugs:
- [Bug 1994189](https://bugzilla.mozilla.org/show_bug.cgi?id=1994189): FP comparison (`x !== x`) reduced from approximately 14 instructions to 2 (`feq.d` + `xori`), approximately 86% instruction count reduction. Firefox 146.
- [Bug 1994190](https://bugzilla.mozilla.org/show_bug.cgi?id=1994190): `Math.floor/ceil/round/trunc` rounding simplified; `fcsr` register reads eliminated. No cycle-count figures provided.
- [Bug 1800431](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431): SunSpider 6x improvement vs interpreter [NEEDS VERIFICATION -- single source, no hardware or methodology described].

The PLCT CI dashboard at `ci.rvperf.org` provides only pass/fail status, not performance numbers.

### 10.4 Known Third-Party Compatibility Issues

- **servo/mozjs** [Issue #513](https://github.com/servo/mozjs/issues/513): RVV header namespace bugs in mozjs115 packaging: `TailAgnosticType`, `MaskAgnosticType` used without `RVV::` namespace qualifier; `VRegister` type entirely undefined. Status unknown.
- **NixOS/nixpkgs** [Issue #480547](https://github.com/NixOS/nixpkgs/issues/480547): Cross-compiled GJS (GNOME JavaScript) with SpiderMonkey 140 segfaults under QEMU riscv64 emulation. Open.
- **openEuler RISC-V team**: Backported 3 Wasm JIT commits to Firefox 115 ESR (July 2024): Wasm huge memories, Wasm baseline compiler, illegal instruction traps for Wasm traps [NEEDS VERIFICATION -- single source].

---

## 11. Known Bugs and Active Issues

### 11.1 Open Bugs (as of 2026-06-12)

The meta tracking bug [Bug 1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) (`sm-riscv64`, NEW, P3, filed 2025-09-09 by Nicolas B. Pierron) has 57 dependent bugs total; 2 remain open:

| Bug | Title | Status | Component | Notes |
|---|---|---|---|---|
| [Bug 2043179](https://bugzilla.mozilla.org/show_bug.cgi?id=2043179) | Improve riscv64 instruction detection in WasmGC/WasmSummarizeInsn | ASSIGNED (andrebargull) | Core::JavaScript:WebAssembly | Patch posted (attachment 9591009), awaiting review as of 2026-05-28. Cleans up `WasmGC`/`WasmSummarizeInsn` to use `Instruction` class getters instead of raw encoding comparisons. |
| [Bug 1837852](https://bugzilla.mozilla.org/show_bug.cgi?id=1837852) | [RISCV64] baseline wasm compiler results in black screen | UNCONFIRMED | Core::JavaScript:WebAssembly | Reported 2023 on Firefox 113. Comment 6 (7 months ago): Rong Bao confirmed "LGTM on Fx 143.0, tested on MilkV Jupiter (SpacemiT K1)." Functionally believed resolved but not formally closed. |

Additional open bugs not in the meta-bug dependency list:

| Bug | Title | Status | Priority | Notes |
|---|---|---|---|---|
| [Bug 2040603](https://bugzilla.mozilla.org/show_bug.cgi?id=2040603) | Show assembler offsets in IONFLAGS=codegen output for riscv64 | NEW | P3 | Debug tooling gap |
| [Bug 2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167) | Add Gecko Profiler support for RISCV64 and LoongArch64 | ASSIGNED | P3 | Working proof of concept on Milk-V Jupiter (SpacemiT M1); stack sizes on RV64 much larger than x86-64 requiring increased snapshot allocation |
| [Bug 1980593](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593) | Youtube Video Playback lags and freezes on Firefox for riscv64 | UNCONFIRMED | -- | Firefox 135, Ubuntu 22.04, Wayland/EGL; startup stutter, freezes at higher resolutions; no quantitative data |
| [Bug 1994624](https://bugzilla.mozilla.org/show_bug.cgi?id=1994624) | OpenBSD/riscv64 build failure after JIT enablement | Unknown | -- | `#error "Unsupported platform"` in `Architecture-riscv64.cpp`; fix adds `|| defined(__OpenBSD__)` to `FlushICache`. Resolution status not confirmed from available data. |

### 11.2 Recently Resolved Correctness Bugs (2025-2026)

| Bug | Title | Release | Root Cause |
|---|---|---|---|
| [Bug 1975752](https://bugzilla.mozilla.org/show_bug.cgi?id=1975752) | Single vs Double type confusion in `StoreToTypedArray` | Firefox 142 | `ToFloatRegister` always produced Double-typed registers, triggering RISC-V NaN-boxing; `fcvt.s.d` then always yielded NaN for Float32 inputs. Symptom: random NaN values at array indices in simulator runs. |
| [Bug 1976699](https://bugzilla.mozilla.org/show_bug.cgi?id=1976699) | `ABIStackAlignment` does not equal psABI mandated value | Firefox 142 | `ABIStackAlignment` and `JitStackAlignment` set to 8 instead of psABI-mandated 16 bytes, causing misaligned stack issues across wasm and JIT. |
| [Bug 1975492](https://bugzilla.mozilla.org/show_bug.cgi?id=1975492) | `MacroAssembler::ctz32` mismatched argument order | Firefox 142 | Broken semantics for `i32.ctz` WebAssembly instruction; silent due to identical argument types. |
| [Bug 1976225](https://bugzilla.mozilla.org/show_bug.cgi?id=1976225) | WASM Huge Memory quickly exhausts address space on Sv39 | Firefox 142 | Each wasm huge memory allocation requests approximately 4.3 GB; Sv39 provides only approximately 512 GB user virtual address space; fix raised minimum address bit requirement from 38 to 47. |
| [Bug 1997503](https://bugzilla.mozilla.org/show_bug.cgi?id=1997503) | Intermittent SIGSEGV in JITed code by PreBarrierFastPath on simulator | Firefox 143+, ESR140 | `unboxGCThingForGCBarrier` called `ExtractBits` with `JSVAL_TAG_SHIFT - 1` as size parameter instead of `JSVAL_TAG_SHIFT`; one bit dropped from pointer during GC barrier unboxing; intermittent SEGV (4 crashes in 15 runs in ASAN build). Traced back to original 2023 port. |
| [Bug 1996840](https://bugzilla.mozilla.org/show_bug.cgi?id=1996840) | Assertion failure `is_intn(imm, kJumpOffsetBits)` veneer pool overflow | Firefox 146, ESR140, ESR115 | `hasSpaceForInsts` computes `secondaryVeneers` in instruction count units but compares against byte-offset `deadline` (missing `* InstSize`); overflow when veneer insertion cascades past a second `jal`'s 21-bit (1 MiB) limit. Fixed by padding all short branches to match veneer size plus fixing the off-by-InstSize bug. sec-high; bounty declined (tier-3 platform policy). |
| [Bug 2041360](https://bugzilla.mozilla.org/show_bug.cgi?id=2041360) | Missing `AutoForbidPoolsAndNops` guards across assembler | Firefox (landed 2026-05-25) | Wrong `FaultingCodeOffset` values for wasm load/store traps, atomic ops, FP load/store, and `ma_liPatchable`. 10-part fix series. Latent correctness issue across all wasm memory operations. |

---

## 12. Objections and Upstream Blockers

**Objection 1: The port is externally maintained and can be abandoned.**

The primary port author (Lu Yahan, PLCT Lab) was active 2022-2023 and has since been largely inactive. Active maintenance has transferred to Rong Bao (ISCAS) and Andre Bargull (Mozilla employee). Two active contributors with demonstrated momentum is a thin bus factor. PLCT Lab is a state-funded Chinese research institute; its priorities are set externally to Mozilla's engineering roadmap. However, Andre Bargull is a Mozilla employee whose contributions are tracked by Mozilla management, and the port has not been marked for removal.

**Objection 2: No Mozilla CI means silent regressions.**

Confirmed. Bug 1957559 is the documented instance: the JIT was "long time broken" on riscv64 with no Mozilla CI to detect it. Bug 2041360 identified a class of wrong wasm trap offsets that persisted until May 2026. PLCT's simulator-based CI at ci.rvperf.org partially compensates, but simulator CI does not catch all native-hardware bugs (Sv39 virtual address space exhaustion in Bug 1976225 would not be visible in a simulator running on x86 Linux with a 47+ bit address space).

**Objection 3: Wasm SIMD is a hard block for compute-intensive workloads.**

Confirmed and unambiguous. The `#error` in `Architecture-riscv64.h` is an explicit compile-time assertion. The RVV assembler infrastructure exists (approximately 55KB of opcodes and assembler bindings) but is not wired into the SIMD lowering pipeline. This is not a small gap: it requires implementing all `visitWasm*Simd128` CodeGenerator visitors, all Simd128 LIR lowering, valid SIMD register allocation, and all Simd128 MacroAssembler operations using RVV instructions. Passing the full Wasm SIMD test suite on riscv64 is a substantial multi-person-month effort.

**Objection 4: No official Firefox binary for riscv64.**

Confirmed. Mozilla does not ship official Firefox binaries for riscv64 at any tier. The `libmozjs-128` shared library is available via Debian and Ubuntu packaging, which covers the `libmozjs` consumer use case (GJS/GNOME), but not Firefox the browser. Fedora has no riscv64 build. This limits the addressable riscv64 user population to Linux distributions that build from source or package libmozjs themselves.

**Objection 5: Performance data is unavailable.**

Confirmed. No published benchmark scores exist for SpiderMonkey on riscv64. The only quantitative data are instruction-count reductions for specific operations (FP comparison: approximately 86% reduction; rounding: fewer instructions, no timing). Without end-to-end benchmark data on production hardware, it is not possible to characterize the performance gap vs arm64 or x86-64 for JS or Wasm workloads.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 JIT backend is functionally complete for non-SIMD workloads. The remaining functional gaps are:

1. `visitNearbyInt` / `visitNearbyIntF`: `MOZ_CRASH("NYI")`. Impact depends on whether this path is guarded upstream in Ion lowering for riscv64 [NEEDS VERIFICATION]. If reachable, it is a crash bug.
2. `atomicPause()`: `MOZ_CRASH("NYI")`. Missing spin-loop hint; not a correctness issue for current Zihintpause-absent hardware, but blocks full compliance with the RISC-V ABI for future hardware.
3. Gecko Profiler ([Bug 2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167)): ASSIGNED, proof of concept exists. Low-effort completion.
4. OpenBSD/riscv64 build failure ([Bug 1994624](https://bugzilla.mozilla.org/show_bug.cgi?id=1994624)): Status unclear. Low-effort fix if not yet resolved.
5. Bug 1837852 (Wasm black screen): Believed functionally resolved in Firefox 143 per Rong Bao's comment; needs formal RESOLVED FIXED status.

### 13.2 Performance Optimization

Active upstream effort on ISA extension micro-optimizations (Zbb, Zba, Zbs, Zfa, Zfhmin, Zicond) is ongoing (Bugs 2003218, 2005120, 2009158, 2030051, 2045021, 2046847, all resolved or in progress as of mid-2026). These provide instruction-count reductions for specific hot paths.

The RVV SIMD gap represents the largest single performance investment. The infrastructure exists; the wiring does not. For Wasm compute-intensive workloads (image processing, video, ML inference), the SIMD gap means riscv64 competes only on scalar throughput, where it trails arm64 by IPC and clock speed on current hardware.

NSS has no riscv64 cryptographic acceleration. For TLS-heavy workloads, the absence of AES-Zkn or Zvk acceleration is a throughput limiter.

No wall-clock benchmark data is available to quantify any of these gaps numerically.

### 13.3 CI/CD Infrastructure

Adding riscv64 to Mozilla Taskcluster requires:

1. A `sysroot-riscv64-linux-gnu` toolchain artifact in `taskcluster/kinds/toolchain/sysroot.yml`
2. A riscv64-sim CI variant in `js/src/devtools/automation/variants/`
3. A build task in `taskcluster/kinds/build/linux.yml` and a SpiderMonkey CI task in `taskcluster/kinds/spidermonkey/linux.yml`
4. Optionally: a cross-compiled Clang/GCC toolchain for riscv64

This is the single highest-leverage investment for long-term port stability. The demonstrated cost of not having it (Bug 1957559, Bug 2041360) is silent correctness regressions that accumulate over months.

Adding a native riscv64 hardware runner to Mozilla Taskcluster is a longer-term investment requiring Mozilla infrastructure cooperation and hardware provisioning.

### 13.4 Ecosystem Enablement

| Gap | Effort estimate | Notes |
|---|---|---|
| Wasm SIMD (RVV wiring) | High (multiple person-months) | Full RVV assembler exists; lowering pipeline, register allocation, test coverage needed |
| NSS riscv64 crypto (AES-Zkn, Zvk) | Medium | New work; no existing riscv64 assembly in NSS `lib/freebl/` |
| libjpeg-turbo embedded copy (Bug 1984883) | Low | Upstream 3.1.90 beta has RVV; update embedded copy and resolve build failure |
| Firefox riscv64 official tier | Very high (organizational) | Requires Mozilla infrastructure, QA, and release engineering commitment; not a code problem |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement `visitNearbyInt` / `visitNearbyIntF` | 1-2 | riscv64 port team | High |
| Functional | Implement `atomicPause()` (Zihintpause) | 1 | riscv64 port team | Medium |
| Functional | Complete Gecko Profiler support (Bug 2023167) | 2-4 | ASSIGNED (csmantle) | Medium |
| Functional | Close Bug 1837852 formally | 0.5 | riscv64 port team | Low |
| CI/CD | Add riscv64-sim variant to SpiderMonkey Taskcluster CI | 4-8 | Mozilla infrastructure + riscv64 port team | Critical |
| CI/CD | Add native riscv64 hardware to Taskcluster | 20+ | Mozilla infrastructure | High |
| Performance | Wire RVV into Wasm SIMD lowering pipeline | 20-40 | riscv64 JIT specialist | High |
| Performance | NSS riscv64 crypto acceleration (AES-Zkn/Zvk) | 10-20 | NSS + crypto specialist | Medium |
| Performance | Publish riscv64 benchmark results (JetStream, Speedometer) | 2-4 | riscv64 port team + hardware | Medium |
| Ecosystem | Update libjpeg-turbo embedded copy; fix Bug 1984883 | 2-4 | Firefox media team | High |
| Ecosystem | Engage Mozilla re: official riscv64 Firefox tier | Non-technical | Program management | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [SpiderMonkey homepage](https://spidermonkey.dev/)
- [gecko-dev repository](https://github.com/mozilla/gecko-dev)
- [js/src/jit/riscv64/ source directory (Searchfox)](https://searchfox.org/mozilla-central/source/js/src/jit/riscv64)
- [Bug 1987699 -- [meta] RISCV64 support in SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699)
- [Bug 1800431 -- Add riscv64 JIT backend (initial port)](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431)
- [Bug 1982266 -- Enable JIT by default on riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266)
- [Bug 1975643 -- Implement WASM JSPI stack switching for riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1975643)
- [Bug 1996840 -- Veneer pool overflow assertion failure (sec-high)](https://bugzilla.mozilla.org/show_bug.cgi?id=1996840)
- [Bug 1997503 -- Intermittent SIGSEGV in PreBarrierFastPath on simulator](https://bugzilla.mozilla.org/show_bug.cgi?id=1997503)
- [Bug 2041360 -- Missing AutoForbidPoolsAndNops guards in assembler](https://bugzilla.mozilla.org/show_bug.cgi?id=2041360)
- [Bug 2045021 -- Add Zbs, Zfa, Zfhmin, Zicond extension support](https://bugzilla.mozilla.org/show_bug.cgi?id=2045021)
- [Bug 1957559 -- Various riscv64 JIT fixes (long-time broken JIT)](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559)
- [Bug 1994189 -- Emit fewer instructions for FP comparisons on riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1994189)
- [Bug 2003218 -- Support RISC-V Zbb bitmanipulation extension](https://bugzilla.mozilla.org/show_bug.cgi?id=2003218)
- [Bug 1976699 -- ABIStackAlignment psABI mismatch](https://bugzilla.mozilla.org/show_bug.cgi?id=1976699)
- [Bug 1976225 -- WASM Huge Memory exhausts Sv39 address space](https://bugzilla.mozilla.org/show_bug.cgi?id=1976225)
- [Bug 2023167 -- Gecko Profiler support for RISCV64](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167)
- [Bug 1980593 -- YouTube playback lag on Firefox riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593)
- [Bug 1984883 -- riscv64 build failure in media/libjpeg](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883)
- [Debian mozjs128 riscv64 build status](https://buildd.debian.org/status/package.php?p=mozjs128&suite=sid)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE V8 RISC-V blog post (December 2025)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [js/moz.configure (Searchfox)](https://searchfox.org/mozilla-central/source/js/moz.configure)
- [SpiderMonkey Taskcluster linux CI (Searchfox)](https://searchfox.org/mozilla-central/source/taskcluster/kinds/spidermonkey/linux.yml)