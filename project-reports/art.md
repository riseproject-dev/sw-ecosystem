---
title: ART
parent: Project Reports
color: blue
dependencies:
  - name: Bionic
    relation: runtime-dependency
    criticality: critical
  - name: libunwindstack
    relation: runtime-dependency
    criticality: optional
  - name: Conscrypt
    relation: runtime-dependency
    criticality: critical
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: cpu_features
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: vogar
    relation: test-dependency
    criticality: optional
  - name: Soong
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="art" %}

# ART

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for ART<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Android Runtime (ART)](https://source.android.com/docs/core/runtime) is Google's managed runtime for Android. It replaces the original Dalvik VM and provides ahead-of-time (AOT), just-in-time (JIT), and interpreted execution of Dalvik bytecode (.dex files). ART is the critical execution layer for all Android Java/Kotlin applications. It encompasses:

- A multi-tier execution engine: Nterp (template interpreter), the Optimizing JIT compiler, and dex2oat AOT compilation
- A full assembler and disassembler per supported architecture
- JNI bridging infrastructure (CriticalNative, FastNative, and normal JNI)
- A garbage collector (Concurrent Copying, Generational CC) with read/write barrier injection into compiled code
- Intrinsics: hand-optimized code paths for performance-critical Java standard library methods (Math, String, Unsafe, VarHandle, etc.)
- A signal-based fault handler (null pointer, stack overflow)
- Boot image and odrefresh compilation pipeline

**Repository:** [android.googlesource.com/platform/art](https://android.googlesource.com/platform/art)<br/>
**Homepage:** [source.android.com/docs/core/runtime](https://source.android.com/docs/core/runtime)<br/>
**License:** Apache 2.0 (AOSP licensing; Java/OpenJDK-related trademarks belong to Oracle, per source.android.com).<br/>
**Governance:** Google-controlled AOSP, with no independent foundation or tiered membership governance. There is no public `MAINTAINERS.md`; code ownership is managed through Gerrit `OWNERS` files. All 21 entries in `platform/art`'s `OWNERS` file (HEAD) use `@google.com` addresses: dobrota, dsrbecky, hboehm, ishcheikin, islamelbanna, jiakaiz, lokeshgidra, mast, mythria, ngeoffray, prashantdubey, rpl, scianciulli, skvadrik, solanes, vmarko, miguelaranda, mingaleev, prb, sorinbasca, vichang. Contributions flow through [android-review.googlesource.com](https://android-review.googlesource.com), which requires sign-in to browse and could not be crawled directly in this research; Gerrit CL identity/dates below come from a targeted public-API search against `android-review.googlesource.com` rather than a full change listing.<br/>
**Community stance on new ports:** Welcoming and upstream-first. Google began accepting external riscv64 patches into AOSP around October 1, 2022, and RISC-V International formalized an Android Special Interest Group (sig-android, mailing list at [lists.riscv.org/g/sig-android](https://lists.riscv.org/g/sig-android)) to coordinate upstreaming from vendor forks (T-Head's `aosp-riscv`, PLCT Lab) into mainline AOSP/ART rather than maintaining permanent downstream forks. In October 2023, Google (Lars Bergstrom, at the RISC-V Summit) publicly stated a multi-year goal of making RISC-V a "Tier-1" Android architecture, with wearables (with Qualcomm) as the first target device category, and a baseline technical requirement of the RVA22 profile plus Vector and Vector-Crypto extensions.<br/>
**RISE Project involvement:** Google LLC is a Premier Member of the RISE Project (Linux Foundation), alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent; General members include Canonical, ZTE, Andes, SpacemiT, and others. ART itself is not a RISE-funded workstream and does not appear in any of RISE's 35 blog posts (2024-05-15 through 2026-09-28) or its 84-package Python wheel builder list. However, RISE's `language-runtimes-wg` GitHub repository ([github.com/riseproject-dev/language-runtimes-wg](https://github.com/riseproject-dev/language-runtimes-wg)) contains open issue #3, "Improve support of ART on RISC-V" (opened 2026-06-18 by user `luhenry`, label `lang:android`, milestone "future", status Open), which states that ART RISC-V work is coordinated through the RISC-V International Android SIG and that "patches for RISCV are landing upstream" in `platform/art`. The issue carries no comments, no linked PRs, and no benchmark/performance data. This is the only confirmed RISE-adjacent tracking of ART as of this report.<br/>

---

## 2. Port History and Upstreaming Timeline

The riscv64 port of ART was initiated by Google in late 2022 and reached functional completeness (interpreter + JIT + AOT + JNI) by early 2024. The work has been entirely upstream in AOSP from the start; there is no separate downstream branch maintained for ART itself (a distinct Alibaba T-Head fork, `T-head-Semi/art-riscv`, now mirrored at `XUANTIE-RV/riscv-art`, exists but currently shows 0 open issues/PRs and is not an active tracker). Approximately 280 Gerrit changes are associated with the port; roughly 250 are MERGED, 12 remain open, and 30 were abandoned (mostly early superseded drafts). No single master tracking issue exists; the closest analog is [android-riscv64 issue #141](https://github.com/google/android-riscv64/issues/141), which tracks unimplemented intrinsics specifically, not the port as a whole.

### Phase 1: Build scaffolding (Oct 2022 - Jan 2023)

**First commit:** [Change 2239704](https://android-review.googlesource.com/c/platform/art/+/2239704), merged 2022-10-05. Subject: "Fix panics in art build code when target arch is riscv64." Author: Colin Cross (Google). A build-system fix to stop Go build code from panicking on an unknown architecture, not a runtime implementation.

The rest of Phase 1 consisted of ELF/DWARF plumbing. [Change 2266237](https://android-review.googlesource.com/c/platform/art/+/2266237) (Colin Cross, merged 2022-10-31, +70/-4) fixed the DWARF floating-point register offset for riscv64: F0-F31 were being assigned to DWARF registers 64-95, but the RISC-V ELF psABI requires them at 32-63, correcting crash-dump and unwinding behavior. Several early changes by Lifang Xia (Alibaba) were submitted in this window and subsequently abandoned in favor of later, cleaner revisions.

### Phase 2: Runtime foundation (Jan - Apr 2023)

**First substantive ART riscv64 implementation:** [Change 2402707](https://android-review.googlesource.com/c/platform/art/+/2402707), created 2023-01-27, merged 2023-02-21. Author: Ulya Trofimovich (Google). Subject: "riscv64: add initial support for ART." Stats: +598/-77 lines, 42 review comments, 18 patch sets. Established the riscv64 ISA enum, stub register file, skeletal instruction set features, and the code generator class hierarchy. The commit message states: "The only supported mode is the switch interpreter. JNI transitions are not implemented yet... The only passing ART test is 000-nop." Tested on a Linux RISC-V VM using `aosp_riscv64-userdebug`.

Immediately following (2023-02-03), Lifang Xia (Alibaba) submitted low-level register and ABI definitions: [Changes 2421273-2421276](https://android-review.googlesource.com/c/platform/art/+/2421273) covering general-purpose registers, floating-point registers, callee-saved frame layout, instruction set features, and CPU context.

| Change | Subject | Author | Date |
|--------|---------|--------|------|
| [2442244](https://android-review.googlesource.com/c/platform/art/+/2442244) | Implement entrypoints sufficient to run a hello world test (+972 lines) | Ulya Trofimovich | 2023-02-17 |
| [2516195](https://android-review.googlesource.com/c/platform/art/+/2516195) | Implement GetFaultPc/GetFaultSp for RISCV | Prashanth Swaminathan | 2023-03-30 |
| [2510739](https://android-review.googlesource.com/c/platform/art/+/2510739) | Let dex2oat run in verification mode (disable compilation) | Ulya Trofimovich | 2023-03-28 |
| [2535780](https://android-review.googlesource.com/c/platform/art/+/2535780) | Move shadow stack register from X18 to X3(GP) | Ulya Trofimovich | 2023-04-13 |
| [2547152](https://android-review.googlesource.com/c/platform/art/+/2547152) | Make odrefresh recognize RISC-V target instead of aborting | Ulya Trofimovich | 2023-04-19 |
| [2547153](https://android-review.googlesource.com/c/platform/art/+/2547153) | Disable Nterp so that zygote doesn't SIGILL at boot | Ulya Trofimovich | 2023-04-19 |
| [2557830](https://android-review.googlesource.com/c/platform/art/+/2557830) | Hand-code trampoline instructions | Ulya Trofimovich | 2023-04-24 |

The X18 to X3/GP shadow stack register move ([Change 2535780](https://android-review.googlesource.com/c/platform/art/+/2535780), +184/-181 lines, 23 comments) was a significant ABI-level decision required because X18 is reserved for ShadowCallStack in Android's hardened build configuration; it required touching every assembly entrypoint in riscv64. Nterp was disabled at boot ([Change 2547153](https://android-review.googlesource.com/c/platform/art/+/2547153)) because all opcode handlers were `unimp` stubs; the system fell back to the switch interpreter for all execution.

### Phase 3: Assembler and Nterp implementation (Apr - Jun 2023)

Vladimir Marko (Google) authored the riscv64 assembler in 6 sequential changes:

| Change | Lines added | Date merged |
|--------|-------------|-------------|
| [Part 1 (2574872)](https://android-review.googlesource.com/c/platform/art/+/2574872) | +1934 | 2023-05-02 |
| [Part 2 (2584502)](https://android-review.googlesource.com/c/platform/art/+/2584502) | significant | 2023-05-10 |
| [Part 3 (2596790)](https://android-review.googlesource.com/c/platform/art/+/2596790) | +1925 | 2023-06-02 |
| [Part 4 (2598686)](https://android-review.googlesource.com/c/platform/art/+/2598686) | +395 | 2023-06-02 |
| [Part 5 (2608851)](https://android-review.googlesource.com/c/platform/art/+/2608851) | +676 | 2023-06-06 |
| [Part 6 (2617289)](https://android-review.googlesource.com/c/platform/art/+/2617289) | +527 | 2023-06-09 |

In parallel, Jaeheon Yi (Google) implemented Nterp: [Change 2537050](https://android-review.googlesource.com/c/platform/art/+/2537050) created the full `runtime/interpreter/mterp/riscv64/` directory with all opcode handlers as `unimp` stubs (+987 lines, 2023-04-13); [Change 2541796](https://android-review.googlesource.com/c/platform/art/+/2541796) defined riscv64 register conventions for Nterp (2023-04-18); [Change 2573612](https://android-review.googlesource.com/c/platform/art/+/2573612) implemented `ExecuteNterpImpl` (2023-04-29); [Change 2608855](https://android-review.googlesource.com/c/platform/art/+/2608855) re-enabled Nterp with a method filter (2023-05-30).

The JNI compiler was delivered in this phase:

| Change | Subject | Author | Date |
|--------|---------|--------|------|
| [2622874](https://android-review.googlesource.com/c/platform/art/+/2622874) | Implement JNI compiler for @CriticalNative | Vladimir Marko | 2023-06-13 |
| [2629849](https://android-review.googlesource.com/c/platform/art/+/2629849) | Implement JNI compiler for @FastNative | Vladimir Marko | 2023-06-19 |
| [2633469](https://android-review.googlesource.com/c/platform/art/+/2633469) | Implement JNI compiler for normal native | Vladimir Marko | 2023-06-21 |
| [2636496](https://android-review.googlesource.com/c/platform/art/+/2636496) | Enable JNI compiler | Vladimir Marko | 2023-06-26 |

Lifang Xia (Alibaba) contributed the initial codegen visitor stubs for the Optimizing compiler backend during this phase ([Changes 2619265-2637832](https://android-review.googlesource.com/c/platform/art/+/2619265)), covering register definitions, shift/binary ops, conditional moves, invokes, and other codegen visitors, reviewed by Santiago Aboy Solanes and Ulya Trofimovich (Google).

### Phase 4: Optimizing compiler and intrinsics (Aug - Dec 2023)

Vladimir Marko drove the Optimizing compiler backend to functional completeness: Baker read barriers ([Change 2767026](https://android-review.googlesource.com/c/platform/art/+/2767026), 2023-09-28); stack overflow handler ([Change 2735629](https://android-review.googlesource.com/c/platform/art/+/2735629), 2023-08-31); null pointer handler ([Change 2760974](https://android-review.googlesource.com/c/platform/art/+/2760974), 2023-09-25); allocation entrypoints ([Change 2786201](https://android-review.googlesource.com/c/platform/art/+/2786201), 2023-10-12); Optimizing compiler enabled for invokes ([Change 2727976](https://android-review.googlesource.com/c/platform/art/+/2727976), 2023-08-28).

RISC-V Vector (RVV) assembler support was added by Roman Artemev (Syntacore) in December 2023:

| Change | Subject | Date |
|--------|---------|------|
| [2862809](https://android-review.googlesource.com/c/platform/art/+/2862809) | Add RISC-V Vector register definitions | 2023-12-07 |
| [2862810](https://android-review.googlesource.com/c/platform/art/+/2862810) | Implement RISC-V Vector instructions | 2023-12-07 |
| [2862811](https://android-review.googlesource.com/c/platform/art/+/2862811) | Support RISC-V RVV in disassembler | 2023-12-07 |
| [2862812](https://android-review.googlesource.com/c/platform/art/+/2862812) | RISC-V RVV assembler tests | 2023-12-07 |

Intrinsics were delivered across October 2023 - May 2024. Per a Gerrit REST API cross-check of the specific GitHub-tracked intrinsic requests: [android-riscv64#128](https://github.com/google/android-riscv64/issues/128) ("ART: implement String intrinsics") is backed by 4 MERGED CLs -- 2799506 (String.indexOf(int), merged 2023-10-25), 2958172 (StringEquals, merged 2024-03-19), 3001232 (StringCompareTo, merged 2024-03-28), 3005208 (StringGetCharsNoCheck, merged 2024-05-06). Memory peek/poke, Float/Double, Integer/Long, VarHandle compareAndSet/GetAndUpdate, Unsafe CAS/getAndAdd, SystemArrayCopy, and Math intrinsics were also delivered in this window. Nterp opcode coverage was completed by Jaeheon Yi: SPUT/SGET variants, IGET/IPUT, AGET/APUT, CONST opcodes, new-instance, check-cast, instance-of, new-array, invoke-virtual, invoke-interface, polymorphic/custom invoke, range variants.

### Phase 5: Completion and ongoing optimization (Jan 2024 - present)

Compressed (C) extension support: Roman Artemev (Syntacore) authored assembler/disassembler CLs 2939939-2939940, and auto-compression CLs 3000789/3000793, plus supporting CLs 2971995 and 3000793; per Gerrit REST verification these 5 CLs backing [android-riscv64#130](https://github.com/google/android-riscv64/issues/130) all MERGED between 2024-02-20 and 2024-06-11 (not "late 2023" as informally logged elsewhere -- landing dates run Feb-Jun 2024).

Instruction simplifier for riscv64 (ShiftAdd, BitwiseNegatedRight, Rol, Shl+Add): Anton Romanov (Syntacore) ([Changes 3009176](https://android-review.googlesource.com/c/platform/art/+/3009176), [3122231](https://android-review.googlesource.com/c/platform/art/+/3122231), [3229242](https://android-review.googlesource.com/c/platform/art/+/3229242), 2024).

Zbs extension support: Sergey Kozub (Syntacore), CLs 3235976/3235977, MERGED 2024-08-23 -- confirmed via Gerrit REST API. These CLs add Zbs assembler/disassembler support only; they do not implement the instruction-simplifier/intrinsic-level Zbs optimizations requested by [android-riscv64#148](https://github.com/google/android-riscv64/issues/148), which remains open.

JIT Logger: Roman Artemev ([Change 3551900](https://android-review.googlesource.com/c/platform/art/+/3551900), 2025-03-19). invokeExact MethodHandle intrinsic (invoke-static, invoke-virtual, invoke-direct, invoke-interface): Anton Romanov (Syntacore) ([Changes 3432661](https://android-review.googlesource.com/c/platform/art/+/3432661), [3512456](https://android-review.googlesource.com/c/platform/art/+/3512456), [3555544](https://android-review.googlesource.com/c/platform/art/+/3555544), 2024-2025). Nterp opcode filter removed ([Change 2961966](https://android-review.googlesource.com/c/platform/art/+/2961966), 2024-02-13): all methods became eligible for Nterp dispatch.

Open as of report date: IR optimizations for bit manipulation and division by constant (Sergey Kozub, Syntacore, Changes 3556505-3556506, March 2025); invokeExact for accessor MethodHandles (Change 3580772, Anton Romanov); IR bit manipulation rework (Change 3693991, Roman Artemev) [NEEDS VERIFICATION -- date attribution for this last item could not be independently re-confirmed this cycle].

Gerrit verification also surfaced one discrepancy worth flagging directly: [android-riscv64#136](https://github.com/google/android-riscv64/issues/136) ("Fix ART 850-checker-branches test with JIT") is closed on GitHub, and its only identifiable candidate fix, [Change 2953227](https://android-review.googlesource.com/c/platform/art/+/2953227) ("riscv64: Fix branch profiling in baseline jit compilation"), was **ABANDONED** on 2024-02-06 despite carrying Code-Review+2 and a passing Treehugger run. No merged CL resolving #136 could be identified, meaning the GitHub issue's closure is not corroborated by a landed patch in the CLs checked. This is reported as a discrepancy between GitHub issue state and Gerrit CL state, not a resolved contradiction.

### Key contributors

| Contributor | Affiliation | Primary work area |
|-------------|-------------|-------------------|
| Vladimir Marko | Google | Optimizing compiler backend (primary author), assembler, JNI compiler, intrinsics, read barriers |
| Ulya Trofimovich | Google | Runtime entrypoints, fault handler, build infrastructure, dex2oat/odrefresh |
| Jaeheon Yi | Google | Nterp interpreter opcodes |
| Lifang Xia | Alibaba (linux.alibaba.com) | Early codegen scaffold, register definitions, Math/Thread intrinsics |
| Roman Artemev | Syntacore | RVV assembler, C extension, auto-compression, JIT Logger |
| Anton Romanov | Syntacore | Instruction simplifier (ShiftAdd, Rol), invokeExact intrinsic |
| Sergey Kozub | Syntacore | Zbs assembler/disassembler support, IR optimizations |
| Samuel Holland | SiFive | ISA feature detection, Zba/Zbb/Zbs gating |
| Denis Tomashev | Syntacore | StringEquals, StringCompareTo intrinsics |

Active Syntacore contributions (Artemev, Romanov, Kozub) on assembler/simplifier/intrinsics work continue as of 2025.

---

## 3. Upstream Support Tier

ART has no published tiered support policy for architectures. The de facto tier is determined by (1) presence in the LUCI CI system, (2) NDK ABI status, and (3) presence of hardware builders versus QEMU-only.

**riscv64 position:** riscv64 is in AOSP main and has active LUCI CI, QEMU-only (builder `qemu.riscv.64`). It is not a supported NDK ABI: NDK r27 and r28 mark riscv64 explicitly unsupported/provisional (`meta/abis.json` `"default": false`), meaning ABI breaks remain possible and third-party app developers cannot target it. There are no hardware CI builders. All OWNERS are Google employees; there is no formal community veto or co-governance. The architecture is maintained as an emerging/in-progress target, not yet Tier-1 per Google's own October 2023 stated goal.

| Dimension | amd64 (x86_64) | arm64 | riscv64 |
|---|---|---|---|
| LUCI CI | Yes, multiple builders | Yes, multiple builders | Yes, single QEMU-only builder (`qemu.riscv.64`) |
| Hardware CI | Yes | Yes | No -- QEMU only |
| NDK ABI status | Supported, stable | Supported, stable | Unsupported/provisional (r27, r28) |
| Release-mode CI | Yes | Yes | No -- debug-mode only |
| Shipping consumer devices | Yes | Yes | None identified |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 runtime/arch/riscv64/ (17 files)

Assembly stubs (.S): `asm_support_riscv64.S`, `jni_entrypoints_riscv64.S`, `native_entrypoints_riscv64.S`, `quick_entrypoints_riscv64.S`. The `quick_entrypoints_riscv64.S` file contains the full set of "quick" ABI trampolines: invocation stubs, exception delivery, resolution trampolines, TLAB/RosAlloc allocation, type resolution, GC read-barrier marks for registers 5-31, lock/unlock, array operations, string operations, suspend checks, deoptimization, and on-stack replacement (OSR).

Headers/C++: `context_riscv64.{h,cc}` (register/stack context save-restore, Nterp Dex PC pinned to S3, PC stored at index `kNumberOfXRegisters`); `thread_riscv64.cc` (thread state); `instruction_set_features_riscv64.{h,cc}` (feature flags `kExtGeneric`, `kExtCompressed`, `kExtVector`, `kExtZba`, `kExtZbb`, `kExtZbs`, detected via `/proc/cpuinfo`, `AT_HWCAP`, the cpu_features library, or an assembly probe); `registers_riscv64.{h,cc}` (32 XRegisters with TR=S1 as ART thread register, TMP=T6, TMP2=T5; 32 FRegisters with FTMP=FT11; 32 VRegisters); `jni_frame_riscv64.h`; `fault_handler_riscv64.cc` (signal-based null pointer and stack overflow fault handling); `entrypoints_init_riscv64.cc`; `callee_save_frame_riscv64.h`.

### 4.2 compiler/utils/riscv64/ (assembler layer, 9 files)

`assembler_riscv64.{h,cc,_test.cc}`: a full, hand-tuned assembler covering RV64I/M/A/F/D base ISA, the complete RVV vector extension (VSetvli/VSetivli/VSetvl, unit/strided/indexed/segment/whole-register loads and stores, integer arithmetic, mask operations, FP operations, widening, narrowing, reductions, conversions, FMA), and Zba/Zbb/Zbs bit-manipulation extensions, plus the C (compressed) extension with auto-compression. `jni_macro_assembler_riscv64.{h,cc,_test.cc}` and `managed_register_riscv64.{h,cc,_test.cc}` complete the layer.

### 4.3 compiler/optimizing/ (riscv64-specific files)

`code_generator_riscv64.{h,cc}`: the primary JIT/AOT code generator, implementing InvokeRuntimeCallingConvention, InvokeDexCallingConventionVisitorRISCV64, CriticalNativeCallingConventionVisitorRiscv64, LocationsBuilderRISCV64, InstructionCodeGeneratorRISCV64, CodeGeneratorRISCV64, PC-relative AUIPC patching (20+12 bit split), Baker/slow-path read barriers, write barriers, JIT root patching, and suspend checks. `intrinsics_riscv64.{h,cc}` (IntrinsicLocationsBuilderRISCV64 / IntrinsicCodeGeneratorRISCV64), `instruction_simplifier_riscv64.{h,cc,_test.cc}` (ShiftAdd, BitwiseNegatedRight, Rol), `critical_native_abi_fixup_riscv64.{h,cc}`, `nodes_riscv64.h`.

### 4.4 runtime/interpreter/mterp/riscv64/

8 assembly (.S) files covering arithmetic, arrays, control flow, floating point, invoke, main dispatch loop, object, and other operations -- the Nterp template interpreter for riscv64.

### 4.5 SIMD/vectorizer

No dedicated riscv64 SIMD/vectorizer codegen file (e.g. a `code_generator_vector_riscv64.cc` analog to arm64's `code_generator_vector_arm64.cc`) exists. The code generator's `VecAddress()` function carries an explicit `Unimplemented` stub and the source has explicit TODOs ("TODO(riscv64): Check the vector extension", "TODO(riscv64): Implement SIMD with the Vector extension"). The RVV assembler support is complete but unused by the Optimizing compiler's vectorizer.

### 4.6 ISA extensions in active CI use

The QEMU CI builder is configured with `-cpu rv64,v=true,elen=64,vlen=128,zba=true,zbb=true,zbs=true`. All of V (vector), Zba, Zbb, and Zbs are available in CI. The assembler supports all of these. The Optimizing compiler uses Zba/Zbb/Zbs conditionally via ISA feature flags for scalar codegen. RVV is present in the assembler and disassembler but is not used by the Optimizing compiler code generator for SIMD JIT/AOT code generation.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Assembler (base ISA) | Full (hand-tuned) | Full (hand-tuned) | Full (hand-tuned: base + M/A/F/D + V + C + Zba/Zbb/Zbs) |
| Baseline/fast JIT tier | Present | Present | Absent -- `fast_compiler.h` returns `nullptr` for all architectures except arm64 |
| Optimizing JIT/AOT scalar codegen | Full | Full | Full |
| SIMD/vector codegen | Full (SSE/AVX) | Full (NEON) | Absent -- `VecAddress()` unimplemented, no vector register allocator |
| Intrinsics | Full, SIMD-accelerated where applicable | Full, SIMD-accelerated where applicable | Partial, scalar-only (no V/B-extension use) |
| Read barriers (Baker, fast path) | Full | Full | Full |
| Read barrier slow path | Full | Full | `AddReadBarrierSlowPath`/`GenerateReadBarrierSlow` unimplemented -- falls back to runtime calls |
| Implicit suspend checks | Yes (guard-page fault) | Yes (guard-page fault) | No -- `CanUseImplicitSuspendCheck` returns false; explicit checks at every loop back-edge/method entry |
| BitstringTypeCheck optimization | Implemented | Implemented | Unimplemented (`GenerateBitstringTypeCheckCompare` stub), tracked at [#147](https://github.com/google/android-riscv64/issues/147) |

---

## 5. Build System, Cross-Compilation, and Toolchain

ART does not use CMake or autotools. It is built with Soong (`Android.bp`, Go-based build logic in `build/*.go`) plus legacy `Android.mk` files, driven by the standard AOSP `repo`/`lunch`/`m` (or `banchan`) workflow. No `Dockerfile` exists anywhere in `platform/art` (root, `build/`, `tools/`, `tools/build/` all checked).

**Build/lunch commands:**
- Module build (`master-art` manifest): `repo init -b master-art -u <repository url>`, `source build/envsetup.sh`, `banchan com.android.art <arch>`, `m apps_only dist`, `adb install out/dist/com.android.art.apex`, `adb reboot`. `build/README.md` does not explicitly name riscv64 in this path, though riscv64 is first-class elsewhere in the build config.
- Chroot/target test build: `lunch aosp_riscv64-trunk_staging-eng` (from `test/README.chroot.md`, listed alongside `aosp_arm64-trunk_staging-eng`, `aosp_x86_64-trunk_staging-eng`, etc.). `test/README.chroot.md` describes this chroot-based mode as "currently the recommended way to run tests on target."

**Architecture configuration:** `build/art.go` declares `supportedArches = []string{"arm", "arm64", "riscv64", "x86", "x86_64"}` -- riscv64 is a fully first-class architecture, not experimental or gated. It carries a riscv64-specific stack-overflow-gap define: `-DART_STACK_OVERFLOW_GAP_riscv64=16384` (with sanitizers) / `8192` (without). `build/codegen.go` wires riscv64 into the codegen property struct (`case "riscv64": arch = &c.Codegen.Riscv64`), selected via `ART_HOST_CODEGEN_ARCHS`/`ART_TARGET_CODEGEN_ARCHS` env vars or `defaultDeviceCodegenArches()`.

**Buildbot tooling:** `tools/buildbot-build.sh` special-cases riscv64 because mainline (APEX) module prebuilts are not yet upstream for it: when `TARGET_ARCH=riscv64` and `frameworks/base` is absent, the script copies Conscrypt and StatsD prebuilts from `prebuilts/runtime/mainline/local_riscv64/prebuilts/module_sdk` and patches `Android.bp` files, guarded by bug marker `b/286551985`, with a TODO to remove this workaround once mainline riscv64 support lands. `tools/buildbot-utils.sh` validates `TARGET_ARCH` against the regex `^(arm64|riscv64)$`, rejecting any other architecture as a fatal error -- indicating riscv64 has first-class buildbot-script support alongside arm64 specifically.

**QEMU usage (`tools/buildbot-vm.sh`):** for VM creation, the script downloads the Ubuntu 24.04 LTS cloud image and, for riscv64, additionally fetches U-Boot (`u-boot-qemu_2024.01+dfs-5ubuntu2_all.deb` via `get_stable_binary`, extracted with `ar`/`zstd`/`tar`) to obtain `uboot.elf`. The boot command is:

```
$ANDROID_BUILD_TOP/device/google/cuttlefish_vmm/qemu/x86_64-linux-gnu/bin/qemu-system-riscv64 \
    -M virt -nographic -m 16G -smp 8 \
    -cpu rv64,v=true,elen=64,vlen=128,zba=true,zbb=true,zbs=true \
    -kernel uboot.elf \
    -drive file="$ART_TEST_VM_IMG",if=virtio \
    -drive file=user-data.img,format=raw,if=virtio \
    -device virtio-net-device,netdev=usernet \
    -netdev user,id=usernet,hostfwd=tcp::$ART_TEST_SSH_PORT-:22
```

This uses the AOSP-bundled `qemu-system-riscv64` binary from `device/google/cuttlefish_vmm`, not a system-installed QEMU, and boots via U-Boot rather than EFI (unlike the arm64 path, which uses a plain `qemu-system-aarch64` from PATH). The riscv64 CPU model is pinned with `v=true` (vector), `elen=64,vlen=128`, and Zba/Zbb/Zbs explicitly enabled, meaning ART's own test infrastructure assumes RVV and bitmanip support in the emulated CPU.

**Toolchain version minimums:** Not documented anywhere inside `platform/art`. ART does not pin a GCC/Clang minimum itself; compilation uses whatever prebuilt Clang the enclosing `build/soong` tree supplies (versioned in the separate `prebuilts/clang/host/linux-x86` repo, outside `platform/art`'s scope). GCC is not used for target code; Android's platform build has been Clang-only for years. Data not available: an explicit riscv64-tied compiler-version floor (e.g., a minimum Clang version required for RVV codegen) -- none was found in `build/`, `tools/`, `test/README*.md`, or `build/art.go`/`codegen.go`.

**TEST_MAPPING:** the file declares exactly one riscv64-specific entry, confirmed by direct, repeated fetches of the raw file: a test named `art-run-test-458-checker-riscv64-shift-add`, listed in the `art-mainline-presubmit` group. The corresponding test directory `test/458-checker-riscv64-shift-add/` exists with `src/`, `Android.bp`, `expected-stdout.txt`, `expected-stderr.txt`, and `info.txt` (which states: "Tests for InstructionSimplifierRiscv64"). One earlier read reported this test also appearing under a second, `[com.google.android.art.apex]`-suffixed mainline-presubmit group; a repeated, more targeted fetch of the identical file did not reproduce that second occurrence. This is treated as unconfirmed (likely a summarization artifact of the fetch tool) rather than a verified second location, so only the single `art-mainline-presubmit` occurrence is reported as confirmed. This is a narrow "checker" test that validates compiler IR/codegen for one instruction-simplifier pass (shift+add fusion) via source-embedded CHECK-style assertions against a compiler debug dump -- it is not evidence, by itself, of a broader riscv64 execution CI lane; Section 7 covers the separate LUCI `qemu.riscv.64` builder, which is the actual execution-testing infrastructure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Implemented and functional

| Feature | Status |
|---|---|
| Switch interpreter | Complete |
| Nterp template interpreter | Complete (all opcodes, filter removed Feb 2024) |
| Optimizing JIT compiler (integer/FP/control flow) | Complete |
| AOT compilation (dex2oat) | Complete |
| JNI compiler (CriticalNative, FastNative, normal) | Complete |
| Assembler (base ISA + M/A/F/D) | Complete |
| Assembler (C extension + auto-compression) | Complete |
| Assembler (RVV vector extension) | Complete (assembler/disassembler only, not used by codegen) |
| Assembler (Zba/Zbb/Zbs) | Complete |
| Disassembler | Complete |
| Baker read barriers (fast path) | Complete |
| Write barriers | Complete |
| Stack overflow handler | Complete |
| Null pointer fault handler | Complete |
| TLAB/RosAlloc allocation entrypoints | Complete |
| JIT root patching | Complete |
| CFI/DWARF unwind info | Complete |
| ISA feature detection (V, C, Zba, Zbb, Zbs) | Complete |
| Intrinsics: Math, String (StringEquals/CompareTo/GetCharsNoCheck/NewStringFrom*), Integer/Long, VarHandle, Unsafe CAS, SystemArrayCopy, Memory peek/poke, Reference, boxing valueOf, Thread | Complete (scalar) |
| invokeExact intrinsic (invoke-static/virtual/direct/interface) | Complete |
| Instruction simplifier: ShiftAdd, BitwiseNegatedRight, Rol | Complete |
| Branch profiling, JIT Logger | Complete |

### 6.2 Gaps vs arm64 and x86_64

**Baseline/fast JIT compiler:** the compiler-selection function that picks the baseline JIT returns `nullptr` for all architectures except arm64; no `fast_compiler_riscv64.cc` exists. arm64 has a two-tier JIT (baseline + Optimizing); riscv64 has only the Optimizing tier, a structural performance regression for startup-dominated and short-lived-method workloads.

**SIMD/RVV in the Optimizing compiler:** the code generator's `VecAddress()` is an explicit `Unimplemented` stub, with source TODOs for vector-extension checking and SIMD codegen. No vector register allocator exists. Tracked at [android-riscv64#167](https://github.com/google/android-riscv64/issues/167) (opened 2025-09-11, open, no merged CL identified). This is the single largest performance gap versus arm64 (NEON) and x86_64 (SSE/AVX).

**Missing intrinsics (`UNIMPLEMENTED_INTRINSIC_LIST_RISCV64`):** all FP16 operations (Ceil, Floor, Compare, Rint, ToFloat, etc.), all StringBuilder/StringBuffer append variants, CRC32 update methods, MethodHandleInvoke (partially superseded by the invokeExact work landed for invoke-static/virtual/direct/interface), UnsafeArrayBaseOffset/JdkUnsafeArrayBaseOffset. These fall back to interpreted paths. Tracked at [android-riscv64#141](https://github.com/google/android-riscv64/issues/141) (open, functions as the running tracker, no merged CL identified for the remaining gap as a whole).

**`__memcmp16` generic C:** unlike arm, arm64, x86, and x86_64, riscv64's `memcmp16()` (backing `String.compareTo()`) has no hand-optimized assembly and falls back to portable C. Tracked at [android-riscv64#161](https://github.com/google/android-riscv64/issues/161) (opened 2025-03-12, open, no merged CL identified). The issue's own text notes it is possible autovectorization already makes this adequate, but that has not been confirmed either way.

**`GenerateBitstringTypeCheckCompare` unimplemented:** explicit `Unimplemented` stub affecting type-check optimization in polymorphic dispatch. Tracked at [android-riscv64#147](https://github.com/google/android-riscv64/issues/147) (opened 2024-07-31, open, no merged CL identified).

**`CanUseImplicitSuspendCheck` returns false:** riscv64 does not use hardware guard-page-fault-based implicit suspend checks; it falls back to explicit check instructions at every loop back-edge and method entry, unlike arm64 and x86_64.

**`AddReadBarrierSlowPath`/`GenerateReadBarrierSlow` unimplemented:** Baker read barriers (fast path) are implemented, but slow paths fall back to runtime calls.

**`GenerateDivRemWithAnyConstant` unoptimized:** materializes the divisor via `LoadConst64` rather than multiply-by-reciprocal, unlike arm64/x86_64.

**Zba `SH2ADD` not used in jump tables:** `GenTableBasedPackedSwitch` carries a TODO to use `SH2ADD` for scaled-index computation but does not yet.

**`ZextW` not used:** `intrinsics_riscv64.cc` emits a two-instruction `SLLI+SRLI` sequence for 32-bit zero-extension where a single `ADD.UW`/`C.ZEXT.W` (Zb/Zc) instruction could be used.

**Intrinsics not revisited for V/B extensions:** VarHandle, String, and array intrinsics remain scalar-only. Tracked at [android-riscv64#165](https://github.com/google/android-riscv64/issues/165) (opened 2025-05-29, open, no merged CL identified).

**Register allocator lacks vector-register support:** tracked jointly with #167.

**Zbs bit-manipulation extension underexploited:** present in the assembler (merged CLs 3235976/3235977, 2024-08-23), but not used by the instruction simplifier beyond `RemoveUnnecessaryUse`. Tracked at [android-riscv64#148](https://github.com/google/android-riscv64/issues/148) (opened 2024-08-22, open, no merged CL identified for the simplifier-level work itself).

### 6.3 Performance data

The only quantitative ART-specific riscv64 performance figures identified come from RISC-V International's blog post "Porting and Optimizing Android ART on XuanTie C910" (published 2024-02-26, [riscv.org/blog/porting-and-optimizing-android-art-on-xuantie-c910](https://riscv.org/blog/porting-and-optimizing-android-art-on-xuantie-c910/)), which documents T-Head/XuanTie's own downstream port, not the AOSP upstream port evaluated in this report:
- Launcher startup time on Android 10 initial port: approximately 20 minutes, reduced to 10 minutes after RV64GC instruction-set work, and to 1 minute after Mterp interpreter and compiler optimizations.
- Android 12 on XuanTie TH1520 SoC: launcher startup reduced to 47 seconds, despite more services running than earlier baselines.
- CaffeineMark benchmark (after XuanTie custom-extension support): integer performance improved over 15%; floating-point/method-calling improved approximately 4%.
- SCIMark2 benchmark: over 15% improvement in most use cases, with limited or no gain on SOR and Monte Carlo sub-tests.
- Other (non-ART) language runtimes on the same XuanTie extensions: up to 5x improvement in the best case.
- Over 80 commits contributed upstream to AOSP ART for RISC-V since September 2022, per that same post.

[NEEDS VERIFICATION -- these figures describe a vendor-specific downstream port (XuanTie C910/TH1520) with custom ISA extensions, and this report found no independently published benchmark comparing the current upstream AOSP riscv64 ART port against arm64/x86_64 on standard hardware or QEMU.] A general (non-ART) ISA-efficiency comparison, "An Empirical Comparison of the RISC-V and AArch64 Instruction Sets" ([dl.acm.org/doi/fullHtml/10.1145/3624062.3624233](https://dl.acm.org/doi/fullHtml/10.1145/3624062.3624233)), found RV64G executes approximately 16% more instructions than x86-64 and approximately 9% more than ARMv8 on SPEC CINT2006, with the two ISAs otherwise "relatively closely matched" -- useful context but not ART-specific.

Data not available: current upstream ART riscv64 JIT throughput, interpreter throughput, GC pause times, or startup latency, benchmarked against arm64 or x86_64 on equivalent hardware or QEMU configurations.

---

## 7. CI/CD Infrastructure

### 7.1 LUCI builder

There is exactly one riscv64 builder in the ART LUCI CI system:
- **Builder name:** `qemu.riscv.64`
- **Category/console:** `qemu|riscv` on the ART LUCI Console (`ci.chromium.org/p/art/g/luci/console` -- gated behind Google auth, could not be read directly; builder configuration was corroborated via `build/art.go`'s `supportedArches` listing and buildbot script branching rather than by reading the LUCI console itself)
- **Bitness:** 64-bit only
- **Mode:** QEMU virtual machine (`on_virtual_machine: true`)
- **Test args:** `--target --verbose --debug` (debug mode only; no release-mode builder identified)
- **GC config:** `concurrent_collector: true`, `generational_cc: true`, `gcstress: false`, `heap_poisoning: false`
- **Swarming pool:** `luci.art.ci` on Ubuntu hosts, 16 cores
- **Timeouts:** 30-hour execution, 17-hour expiration
- **Triggers:** commits to `platform/art` (refs/heads/master), `platform/libcore` (refs/heads/master), `platform/manifest` (refs/heads/master-art), `platform/external/vogar` (refs/heads/master)

Separately, `platform/art`'s `TEST_MAPPING` wires one riscv64-specific compiler checker test (`art-run-test-458-checker-riscv64-shift-add`, testing `InstructionSimplifierRiscv64`) into the `art-mainline-presubmit` group (see Section 5); this confirms presubmit selection, not confirmed execution history or pass/fail status, since Gerrit/LUCI dashboards require authentication and could not be read directly. `ci.android.com` build dashboards reportedly show riscv64 builds for targets like `aosp_cf_riscv64_phone-*` [NEEDS VERIFICATION -- third-party source, direct dashboard fetch returned 404], with riscv64 tests (as distinct from builds) not yet confirmed fully running there as of the most recent status checked (2024Q1/2025Q2 timeframe, third-party sourced).

### 7.2 RISE runner involvement

None. The RISE RISC-V Runners (native riscv64 GitHub Actions CI, used by PyTorch, llama.cpp, GCC, LLVM/riscv-gnu-toolchain, and the RISE python-wheels pipeline) show no ART/Android Runtime usage among the 52 repositories in the `riseproject-dev` GitHub org.

### 7.3 Gaps

- **No hardware builder.** All riscv64 testing is QEMU-only; hardware-specific bugs (cache coherency, real memory ordering, interrupt timing) are not caught in CI.
- **Debug mode only.** No release-mode or alternate configuration for riscv64, unlike arm64's multiple builder configurations (debug, release, gcstress, heap poisoning).
- **Single builder.** One QEMU builder covers the entire test suite; any flakiness or QEMU version issue affects all riscv64 testing.
- **Historical flakiness:** [Change 3327994](https://android-review.googlesource.com/c/platform/art/+/3327994) (merged 2024-10-31) temporarily disabled a batch of failing gtests on riscv64, indicating test-reliability issues existed as of that date.
- **CI narrowness caveat:** the only file-confirmed riscv64 presubmit test artifact is the single `458-checker-riscv64-shift-add` checker test; the broader claim of riscv64 execution-level CI rests on the `qemu.riscv.64` LUCI builder's build-config presence (`build/art.go`, buildbot scripts) rather than on a directly-read, currently-green LUCI dashboard, since the dashboard itself is authentication-gated.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| LUCI builders | Multiple, incl. hardware | Multiple, incl. hardware | Single, QEMU-only (`qemu.riscv.64`) |
| Release-mode CI | Yes | Yes | No |
| Presubmit test entries (TEST_MAPPING) | Many | Many | 1 confirmed (`art-run-test-458-checker-riscv64-shift-add`) |
| RISE runner usage | N/A | N/A | None found |

---

## 8. Distribution and Release Status

ART riscv64 ships as part of AOSP Android 14 (API 34) and later; the most recent Android release visible in the source at the time of this research is Android 17.0.0_r1. ART is not distributed as a standalone binary release for any architecture -- it ships only bundled inside full AOSP platform/system images, via `dex2oat`/boot-image compilation as part of the platform build. There is no PyPI, npm, Maven, or OCI artifact for ART, and no Ubuntu/Debian/Fedora/Arch package, on any architecture, since ART is not a general-purpose distro-packaged library.

The riscv64 NDK ABI is explicitly marked unsupported/provisional in NDK r27 and r28 (`meta/abis.json` `"default": false`). This means application developers cannot target riscv64 as an NDK ABI, ABI breaks remain possible in future Android releases, and no OEM riscv64 Android consumer devices ship as of this report date [NEEDS VERIFICATION -- absence of shipping hardware was not independently confirmed by a second source]. The only riscv64 Android execution environment identified is Cuttlefish (Android Virtual Device) running on QEMU.

A user wanting a working riscv64 ART binary must build the full AOSP platform from source (`repo init -b master-art`, `lunch aosp_riscv64-trunk_staging-eng` or equivalent, `m`) and run it on Cuttlefish/QEMU or a riscv64 device capable of booting Android; there is no prebuilt platform image, APEX module, or SDK download for riscv64 identified in this research.

---

## 9. Dependencies

Roles and criticality below for the direct dependency list reflect the project's declared classification; riscv64 status columns come from live research (`Android.bp` inspection across `runtime/`, `libartbase/`, `dex2oat/`, `compiler/`, `libdexfile/`, `libelffile/`, `sigchainlib/`, `simulator/`, `test/`, `openjdkjvmti/`, `profman/`, and `build/Android.bp`, cross-referenced against Ubuntu 26.04 "resolute" package availability).

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|---|
| Bionic | runtime-dependency | critical | Dedicated `arch-riscv64/` since Android 14 (Oct 2023): 5 libc asm files, 15 RVV-optimized string functions, linker entry, TLSDESC resolver. Not a Debian/Ubuntu package (Android's own libc; Ubuntu uses glibc). | QEMU CI only (Cuttlefish `aosp_cf_riscv64_phone`); no hardware CI | Bundled in AOSP platform image only; no standalone package anywhere (checked Ubuntu 26.04, Arch RISC-V, PyPI, Guix) | LTO ABI correctness bug ([android-riscv64#61](https://github.com/google/android-riscv64/issues/61), can silently mis-codegen under LTO); NDK ABI unsupported/provisional in r27/r28 |
| libunwindstack | runtime-dependency | optional | riscv64 register file implemented (`RegsRiscv64.cpp`); Android-specific fork, not packaged for Ubuntu (generic `libunwind-dev`/`libunwind8` is a different, unrelated upstream project that is present in Ubuntu 26.04 riscv64) | QEMU CI only | Bundled in AOSP platform image only | No `ElfInterfaceRiscv64`; falls back to DWARF-only unwinding, no fast-path assembly unlike arm64/x86_64 |
| Conscrypt | runtime-dependency | critical | Pure Java library built via Soong; not a native Debian/Ubuntu package; also referenced as `conscrypt-for-host` in `build/Android.bp` for host-side test tooling | Not independently tested for riscv64 | Published AAR artifacts do not list riscv64 as a packaged native ABI | Inherits BoringSSL's generic-C crypto limitation entirely |
| ICU | runtime-dependency | optional | Present in Ubuntu 26.04 riscv64/resolute (`libicu-dev`, `icu-devtools`); pure C/C++, no riscv64-specific patches needed | No riscv64-specific test coverage claimed by upstream ICU [NEEDS VERIFICATION] | Debian sid `libicu78`/riscv64 built and installed; Ubuntu Noble `libicu74`/riscv64 listed | Low risk |
| zlib | runtime-dependency | optional | Present in Ubuntu 26.04 riscv64/resolute (`zlib1g`, `zlib1g-dev`); builds and passes generic test suite on riscv64 | Generic test suite passes (Debian/Arch confirmed) | Present in Ubuntu 24.04/26.04, Debian sid, Arch RISC-V, Alpine | No riscv64 SIMD path (ARM NEON/x86 SSE exist, no RVV equivalent); correctness unaffected, performance unoptimized |
| xz | runtime-dependency | optional | Present in Ubuntu 26.04 riscv64/resolute (`liblzma-dev`, `liblzma5`, `xz-utils`); linked into `libelffile` for symbol/debug-info handling | Debian sid riscv64 build "Installed"; builds cleanly | Debian sid and Ubuntu (ports) ship riscv64 | RISC-V BCJ filter already upstream, no blockers; post-CVE-2024-3094 only >=5.6.2 is trusted |
| LZ4 | runtime-dependency | optional | Present in Ubuntu 26.04 riscv64/resolute (`liblz4-1`, `liblz4-dev`); linked in `runtime`/`libartbase` | Builds cleanly, no known riscv64 failures | Debian sid and Ubuntu Noble ship riscv64 binaries | Generic C only, no RVV optimization; no functional blocker |
| cpu_features | runtime-dependency | critical | Present in Ubuntu 26.04 riscv64/resolute (`libcpu-features-dev`); ART's `instruction_set_features_riscv64.cc` explicitly uses it (alongside `/proc/cpuinfo`/`AT_HWCAP`) to detect Zba/Zbb/Zbs/V | Debian sid riscv64 build confirmed (`rv-manda-02`) | Not in Ubuntu 24.04 but present in Ubuntu 26.04/resolute; Debian sid has it; not in Arch RISC-V | RISC-V support (ISA-extension macros + hwcap detection) merged upstream 2022-07; no open blockers |
| LLVM | build-dependency | critical | Present in Ubuntu 26.04 riscv64/resolute (`llvm`, `llvm-19`, `clang`, `clang-19`, and versioned `llvm-17..22`); used via Android Soong/Clang to compile all of ART, plus `clang-tidy` checks | -- | Ubuntu 26.04 "resolute" ships riscv64 builds among its 7 architectures | No riscv64 binary published upstream by LLVM itself (x86_64/ARM64/macOS/Windows only); distro packages are the only source of riscv64 LLVM binaries |
| QEMU | test-dependency | critical | ART's test infrastructure uses the AOSP-bundled `qemu-system-riscv64` from `device/google/cuttlefish_vmm`, not system QEMU | Backs the sole `qemu.riscv.64` LUCI builder and `tools/buildbot-vm.sh`'s riscv64 VM boot path (rv64, v=true, elen=64, vlen=128, zba/zbb/zbs=true) | N/A (test tooling, not shipped) | Single QEMU-only lane is itself the CI gap described in Section 7 |
| googletest | test-dependency | critical | Present in Ubuntu 26.04 riscv64/resolute (`libgtest-dev`, `libgmock-dev`); `arch: all` source/header package; riscv64 build confirmed on Debian (`rv-manda-01`); used throughout `runtime`, `compiler`, `libartbase`, `test/` for ART's own gtest suites | Consumer (ART) compiles it on every arch it targets, riscv64 included | No special handling needed | No known blockers |
| vogar | test-dependency | optional | Referenced as a LUCI trigger source (`platform/external/vogar`, refs/heads/master) for the `qemu.riscv.64` builder; no dedicated riscv64-specific code found in this research | Runs as part of the QEMU CI lane | N/A | Data not available beyond its role as a CI trigger input |
| Soong | build-dependency | critical | ART's entire build (`Android.bp`, `build/art.go`, `build/codegen.go`) is Soong-driven; `supportedArches` includes riscv64 as first-class | N/A (build tool) | N/A | No blockers identified; riscv64 mainline-module (APEX) prebuilts are the one gap, worked around in `tools/buildbot-build.sh` (bug `b/286551985`) |

**Additional indirect/recursed dependencies found via research (not in the direct list, included for completeness):**

| Dependency | Role in ART | riscv64 status |
|---|---|---|
| BoringSSL (linked as `libcrypto_static`, underlies Conscrypt) | Crypto/hashing for dex2oat and, via Conscrypt, Java-layer TLS/crypto | Builds via generic C fallback only; zero riscv64 assembly contributed by any org. No RISC-V assembly for AES/SHA/ChaCha20/EC; every riscv64 TLS handshake and Java Security op runs unaccelerated. Tracked at [android-riscv64#36](https://github.com/google/android-riscv64/issues/36). Not packaged for Ubuntu under this name (Ubuntu ships unrelated OpenSSL/libssl-dev); Debian/Ubuntu do ship `android-libboringssl` (the Android fork) for riscv64, one release behind the main archive. |
| libcap | POSIX capabilities (`capget`/`capset`/`prctl`), used in `libartbase` | Present in Ubuntu 26.04 riscv64/resolute (`libcap-dev`, `libcap2`); builds cleanly (Debian buildd "Installed"). Ubuntu 24.04 riscv64 libcap2 lagged amd64 by 4 security patch revisions as of an earlier check [NEEDS VERIFICATION for 26.04]. |
| TinyXML2 | XML parsing in `libartbase` (config/profile parsing) | Present in Ubuntu 26.04 riscv64/resolute (`libtinyxml2-dev`); not independently characterized for riscv64 beyond that, low risk (header-only-ish, pure C++). |
| VIXL | ARM/AArch64 assembler and simulator used by ART's ARM/ARM64 compiler backends and the ARM64 `simulator/` target | Not a riscv64 target dependency. Confirmed explicitly: ART's riscv64 code generator uses its own `assembler_riscv64.cc`/`jni_macro_assembler_riscv64.cc` directly, bypassing VIXL entirely. VIXL itself is installable as a host package on riscv64 (`libvixl-dev` in Ubuntu 26.04/resolute) but only ever generates ARM code. |
| Android NDK | Ships the riscv64 sysroot; referenced by `build/README.md` as an unbundled-module build dependency | Not a Debian/Ubuntu package (Google-distributed only). riscv64 sysroot exists from NDK r27 but is explicitly marked unsupported/provisional -- this is the actual gating issue for third-party riscv64 Android app development, distinct from ART's own platform-level riscv64 readiness. |
| libziparchive, libbase, liblog, libutils, libnativebridge, libnativeloader, libnativehelper | Pure-C++ AOSP platform glue libraries (zip handling, logging, JNI helpers, native-bridge/loader) linked throughout `runtime`/`libartbase`/`libdexfile` | Not Debian/Ubuntu packages (AOSP-internal, bundled from `system/core` and similar trees). Pure C++, no arch-specific code required; all build and ship in Android 14+; no known riscv64-specific issues. |
| libsigchain | Signal chain interception, depends on libunwindstack | Builds and ships in Android 14+; inherits libunwindstack's DWARF-only unwinding limitation on riscv64. |

**Key cross-validation note:** the dependency set independently derived from `Android.bp` files (Bionic, libunwindstack, Conscrypt, ICU, zlib, xz, LZ4) matches the project's declared direct dependency list for these names, giving good cross-validation. The two real crypto/unwind gaps (BoringSSL, libunwindstack) are performance/completeness gaps, not package-availability problems: both build fine on riscv64 via generic C/DWARF paths but lack riscv64-specific assembly/fast paths; they show as "not found" in Ubuntu package searches only because Android's specific forks of these projects are not separately packaged for Ubuntu, not because riscv64 support is absent from AOSP.

---

## 10. Ecosystem Status

Not applicable. ART is a managed-language runtime consumed as part of the Android platform image; it is not a package-manager-distributed library or tool with a dependent ecosystem of third-party packages, plugins, or extensions that themselves need separate riscv64 enablement (unlike, for example, a Python or npm runtime with a registry of architecture-specific wheels/binaries). This section is omitted per the report's scope rules.

---

## 11. Known Bugs and Active Issues

All issues from [github.com/google/android-riscv64](https://github.com/google/android-riscv64/issues), the de facto coordination hub for riscv64 AOSP work (ART's own Gerrit is sign-in-gated and not independently browsable as an issue tracker).

**Open issues directly affecting ART performance or correctness:**

| Issue | Title | Opened | Assignee | Merged CL found? |
|---|---|---|---|---|
| [#167](https://github.com/google/android-riscv64/issues/167) | Support vector regalloc for RISC-V backend in ART | 2025-09-11 | GreenSeal | None found |
| [#165](https://github.com/google/android-riscv64/issues/165) | ART: revisit intrinsics to use V and B | 2025-05-29 | enh-google | None found |
| [#161](https://github.com/google/android-riscv64/issues/161) | ART: implement custom `__memcmp16`? | 2025-03-12 | enh-google | None found |
| [#153](https://github.com/google/android-riscv64/issues/153) | Implement MethodHandleInvokeExact intrinsic for riscv64 | 2024-12-09 | antonromanov1 | Related invokeExact work (CLs 3432661/3512456/3555544) landed for invoke-static/virtual/direct/interface; not independently confirmed against this specific issue number |
| [#148](https://github.com/google/android-riscv64/issues/148) | ART: Implement optimizations with Zbs extension | 2024-08-22 | samogongik | CLs 3235976/3235977 MERGED (2024-08-23) add only assembler/disassembler Zbs support, not the simplifier-level optimization the issue requests; issue remains open |
| [#147](https://github.com/google/android-riscv64/issues/147) | ART: Implement BitstringTypeCheck for RISC-V | 2024-07-31 | samogongik | None found |
| [#141](https://github.com/google/android-riscv64/issues/141) | ART: unimplemented intrinsics (running tracker) | 2024-04-02 | enh-google | N/A -- running list, not a single patch |

**Q&A issues, closed without a documented resolution:**

| Issue | Title | Status |
|---|---|---|
| [#155](https://github.com/google/android-riscv64/issues/155) | What is the level of ART support in AOSP RISCV | Closed; no documented official answer visible in the thread |
| [#156](https://github.com/google/android-riscv64/issues/156) | ART AOT Compilation support in AOSP RISCV | Closed as duplicate of #155; question left effectively unanswered in-thread |

**Closed issues with confirmed merged CLs:**

| Issue | Title | Closed | Backing CL(s) | Merge dates |
|---|---|---|---|---|
| [#130](https://github.com/google/android-riscv64/issues/130) | ART: Support RISC-V Compressed (C) extensions in ART | Closed | 2939939, 2939940, 2971995, 3000789, 3000793 | 2024-02-20 through 2024-06-11 |
| [#128](https://github.com/google/android-riscv64/issues/128) | ART: implement String intrinsics | Closed | 2799506, 2958172, 3001232, 3005208 | 2023-10-25 through 2024-05-06 |

**Closed issue with an unconfirmed fix (discrepancy flagged):**

| Issue | Title | Closed | Notes |
|---|---|---|---|
| [#136](https://github.com/google/android-riscv64/issues/136) | Fix ART 850-checker-branches test with JIT | Closed on GitHub | Its only identifiable candidate CL, [2953227](https://android-review.googlesource.com/c/platform/art/+/2953227), was ABANDONED on 2024-02-06 despite Code-Review+2 and a passing Treehugger run. No merged CL resolving this issue was found; the GitHub closure is not corroborated by a landed patch in the CLs checked. |

**Issues affecting ART's dependency stack:**

| Issue | Title | Severity |
|---|---|---|
| [#61](https://github.com/google/android-riscv64/issues/61) | LTO ABI correctness bug in Bionic | Critical -- can produce silent incorrect binaries under LTO |
| [#36](https://github.com/google/android-riscv64/issues/36) | BoringSSL lacks riscv64 assembly | High -- all crypto operations run on generic C |
| [#151](https://github.com/google/android-riscv64/issues/151) | Update qemu prebuilt to qemu 9.2 | Medium -- affects the QEMU riscv64 emulator used to test ART/Cuttlefish, not ART code itself |

**External tracking:** RISE `language-runtimes-wg` issue #3, "Improve support of ART on RISC-V" (opened 2026-06-18, open, milestone "future"), tracks ART RISC-V support at a high level via the RISC-V International Android SIG; no comments, linked PRs, or benchmark data.

---

## 12. Objections and Upstream Blockers

**NDK ABI instability:** the riscv64 NDK ABI is explicitly marked unsupported/provisional in r27 and r28. Any application binary compiled against it may break in a future Android release. This blocks real-world third-party application deployment even though the underlying platform runs, and is the single biggest practical blocker for riscv64 Android app development independent of ART's own code quality.

**No hardware CI:** QEMU-only testing means hardware-specific bugs (memory-model edge cases, real-hardware interrupt timing, cache-flush behavior) are not caught before merge; any change that breaks on real riscv64 hardware but passes QEMU will reach AOSP main undetected.

**Debug-mode-only builder:** the sole CI lane runs `--debug` only. Release-mode code generation bugs, LTO interactions (compounded by the separate Bionic LTO ABI bug, [#61](https://github.com/google/android-riscv64/issues/61)), and release-build-specific optimizations are not tested in CI.

**Google OWNERS monopoly:** all 21 `platform/art` OWNERS are Google employees. External contributors (Syntacore, Alibaba, SiFive) can submit patches but cannot approve them, creating a review-bandwidth bottleneck for any change touching the RISC-V backend.

**No hardware ecosystem:** no consumer riscv64 Android devices are confirmed to ship as of this report date [NEEDS VERIFICATION]. Without hardware, there is limited application-developer demand and limited OEM pull to prioritize riscv64 ART quality.

**Missing baseline JIT:** structurally, riscv64 lacks the two-tier JIT arm64 has; closing this gap requires implementing a new compiler tier, not just extending an existing one.

**BoringSSL performance gap:** every TLS handshake and Java crypto operation via Conscrypt->BoringSSL runs on generic C on riscv64, versus hand-optimized assembly (AES-GCM, SHA-256, ChaCha20-Poly1305) on arm64. Closing this requires either authoring RVV-accelerated BoringSSL code specifically for the Android fork or waiting on upstream BoringSSL.

**Six open tracking issues with no merged CLs identified:** #167 (vector regalloc, opened 2025-09-11), #165 (intrinsics for V/B), #161 (custom `__memcmp16`), #148 (Zbs-based optimizations beyond assembler support), #147 (BitstringTypeCheck), #141 (unimplemented intrinsics tracker) -- none currently have an identified merged Gerrit CL resolving them, despite ongoing Syntacore engagement on adjacent work.

---

## 13. Readiness Assessment

- **Color:** blue (N/A -- blue has no defined sub-type in the project-color-coding skill)
- **Release provider:** none

**Justification:** ART's riscv64 port is functionally complete -- interpreter, Nterp, Optimizing JIT/AOT, JNI compiler, and a full assembler including C/RVV/Zba/Zbb/Zbs, GC barriers, and roughly 250+ merged Gerrit CLs since October 2022 -- and upstream CI (the `qemu.riscv.64` LUCI builder) both builds and executes the ART test suite on riscv64 via QEMU, confirmed against `build/art.go`'s `supportedArches` listing and the builder's own configuration (Section 7.1) at [android.googlesource.com/platform/art](https://android.googlesource.com/platform/art). This satisfies "build yes / test yes." However, ART publishes no standalone riscv64 release artifact, and in fact publishes no standalone binary release for any architecture, since it ships only bundled inside full AOSP platform/system images (Section 8) -- so release_provider is "none" and the project lands on blue (build yes, test yes, release no) rather than green. ART is a general-purpose managed language runtime, not a performance-optimization library -- the grading methodology excludes general-purpose language runtimes from its optimization-purpose test -- so no downward optimization cap applies and no optimization-level rating is given.

**Pending work that could change the grade:** six open google/android-riscv64 tracking issues remain unresolved with no merged Gerrit CLs identified for any of them: [#167](https://github.com/google/android-riscv64/issues/167) (vector register allocation for RVV codegen, opened 2025-09-11), [#165](https://github.com/google/android-riscv64/issues/165) (revisit intrinsics for V/B extensions), [#161](https://github.com/google/android-riscv64/issues/161) (custom `__memcmp16`), [#148](https://github.com/google/android-riscv64/issues/148) (Zbs-based optimizations), [#147](https://github.com/google/android-riscv64/issues/147) (BitstringTypeCheck for RISC-V), [#141](https://github.com/google/android-riscv64/issues/141) (unimplemented intrinsics tracker). CI remains QEMU-only with a single debug-mode-only builder and no hardware CI, with some historical test flakiness (a batch of failing gtests disabled in October 2024, [Change 3327994](https://android-review.googlesource.com/c/platform/art/+/3327994)). riscv64 remains an unsupported/provisional NDK ABI in r27/r28, blocking third-party app deployment even though the platform itself runs. Active external contributions continue from Syntacore engineers (Artemev, Romanov, Kozub) on assembler/simplifier/intrinsics work as of 2025, which could close some of the above gaps. Separately, RISE's `language-runtimes-wg` issue #3 (opened 2026-06-18) now provides a lightweight external tracking point for ART RISC-V progress, though it carries no funded work or benchmark commitments as of this report.

---

## 14. Investment Analysis

No RISE-funded work targeting ART specifically was identified (Section 1); RISE's involvement is limited to a tracking issue with no funded project or benchmark commitment. All sizing below is therefore unreduced by any RISE contribution already in progress.

### 14.1 Functional Enablement

ART riscv64 is functionally complete for the Optimizing JIT, AOT, Nterp, and JNI compiler; it can execute arbitrary Android Java code. Remaining functional gaps: unimplemented intrinsics (FP16, CRC32, StringBuilder append, remaining MethodHandleInvoke variants) fall back to the interpreter, which is correctness-correct but slow; BitstringTypeCheck is unimplemented, affecting type-check performance in polymorphic dispatch; implicit suspend checks are not implemented, adding instruction overhead at every loop and method entry. Closing these requires extending existing patterns in `intrinsics_riscv64.cc` and `code_generator_riscv64.cc`; no architectural research is required.

### 14.2 Performance Optimization

**Tier 1 -- high-impact, well-defined (3-6 months, 2-3 engineers):** RVV register allocation and SIMD codegen in the Optimizing compiler ([#167](https://github.com/google/android-riscv64/issues/167)) -- requires a vector register allocator and a `code_generator_vector_riscv64.cc` analog to arm64's `code_generator_vector_arm64.cc`; this is the largest performance gap. Revisiting intrinsics for V and B extensions ([#165](https://github.com/google/android-riscv64/issues/165)) to vectorize SystemArrayCopy, String operations, and math intrinsics. `__memcmp16` hand-coded assembly ([#161](https://github.com/google/android-riscv64/issues/161)) -- a well-bounded 1-2 week task with high impact on String-heavy workloads, though the issue itself notes autovectorization may already be adequate and should be measured first.

**Tier 2 -- medium-impact, architectural (2-4 months, 1-2 engineers):** a baseline/fast JIT compiler for riscv64, using arm64's `fast_compiler_arm64.cc` as a template, to improve startup latency and short-lived-method performance. Zbs/Zba/Zbb exploitation in the instruction simplifier ([#148](https://github.com/google/android-riscv64/issues/148)), expanding beyond assembler-level support already merged (CLs 3235976/3235977). `GenerateDivRemWithAnyConstant` multiply-by-reciprocal optimization.

**Tier 3 -- long-term, research (6-12 months):** BoringSSL RVV crypto acceleration (outside ART's own scope, but required for full crypto performance via Conscrypt). Bionic LTO ABI correctness fix ([#61](https://github.com/google/android-riscv64/issues/61)) -- Bionic team work, required for safe production (release-mode, LTO-enabled) builds.

### 14.3 CI/CD Infrastructure

Adding a hardware riscv64 CI builder requires a machine pool with riscv64 hardware capable of running Android, integration with the LUCI Swarming pool, and hardware-path variants of `tools/buildbot-vm.sh`/`tools/buildbot-utils.sh` (no QEMU, no U-Boot). Estimated 4-8 weeks for infrastructure, plus ongoing hardware maintenance. Adding a release-mode builder configuration alongside the existing debug builder is comparatively low effort, primarily a configuration change against existing builder infrastructure.

### 14.4 Ecosystem Enablement

NDK ABI stabilization is a Google decision and not directly actionable by external contributors; however, expanded test coverage and hardware CI results are the kind of evidence that plausibly accelerates that timeline, since they directly address the stated basis (ABI stability risk) for the current unsupported/provisional marking.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement missing intrinsics (FP16, CRC32, StringBuilder, remaining MethodHandleInvoke) | 4-6 | ART riscv64 team | High |
| Functional | Implement BitstringTypeCheck | 1-2 | ART riscv64 team | Medium |
| Functional | Implement implicit suspend checks | 2-3 | ART riscv64 team | Medium |
| Performance | `__memcmp16` hand-coded assembly (measure autovectorization first) | 1-2 | ART riscv64 team | High |
| Performance | Revisit intrinsics for V and B extensions (SystemArrayCopy, String, Math) | 8-12 | ART riscv64 team | High |
| Performance | RVV register allocator + SIMD codegen (`code_generator_vector_riscv64.cc`) | 16-24 | ART riscv64 team | Critical |
| Performance | Zbs/Zba instruction simplifier expansion | 2-3 | ART riscv64 team | Medium |
| Performance | `GenerateDivRemWithAnyConstant` optimization | 1-2 | ART riscv64 team | Low |
| Performance | Baseline/fast JIT compiler for riscv64 | 8-12 | ART riscv64 team | High |
| CI/CD | Hardware riscv64 CI builder (machine + LUCI integration) | 4-8 | Infrastructure | Critical |
| CI/CD | Release-mode CI builder configuration | 1 | Infrastructure | High |
| Ecosystem | BoringSSL RVV crypto (AES-GCM, SHA-256, ChaCha20-Poly1305) | 12-16 | BoringSSL/Conscrypt team | High |
| Ecosystem | Bionic LTO ABI fix | Unknown | Bionic team (Google) | Critical |

---

## 15. References

- [ART source repository](https://android.googlesource.com/platform/art)
- [ART documentation](https://source.android.com/docs/core/runtime)
- [ART riscv64 Gerrit changes](https://android-review.googlesource.com/q/project:platform/art+riscv64)
- [android-riscv64 issue tracker](https://github.com/google/android-riscv64/issues)
- [ART runtime/arch/riscv64 source](https://android.googlesource.com/platform/art/+/refs/heads/main/runtime/arch/riscv64/)
- [ART compiler/optimizing source](https://android.googlesource.com/platform/art/+/refs/heads/main/compiler/optimizing/)
- [ART compiler/utils/riscv64 source](https://android.googlesource.com/platform/art/+/refs/heads/main/compiler/utils/riscv64/)
- [ART runtime/interpreter/mterp/riscv64 source](https://android.googlesource.com/platform/art/+/refs/heads/main/runtime/interpreter/mterp/riscv64/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE language-runtimes-wg issue #3 -- Improve support of ART on RISC-V](https://github.com/riseproject-dev/language-runtimes-wg/issues/3)
- [Change 2239704 -- first riscv64 ART change](https://android-review.googlesource.com/c/platform/art/+/2239704)
- [Change 2402707 -- initial ART riscv64 runtime support](https://android-review.googlesource.com/c/platform/art/+/2402707)
- [Change 2953227 -- abandoned candidate fix for issue #136](https://android-review.googlesource.com/c/platform/art/+/2953227)
- [Change 3235976 -- Zbs assembler support](https://android-review.googlesource.com/c/platform/art/+/3235976)
- [Change 3327994 -- disabled flaky riscv64 gtests](https://android-review.googlesource.com/c/platform/art/+/3327994)
- [android-riscv64 issue #128 -- String intrinsics](https://github.com/google/android-riscv64/issues/128)
- [android-riscv64 issue #130 -- Compressed (C) extension support](https://github.com/google/android-riscv64/issues/130)
- [android-riscv64 issue #136 -- 850-checker-branches JIT fix](https://github.com/google/android-riscv64/issues/136)
- [android-riscv64 issue #141 -- unimplemented intrinsics](https://github.com/google/android-riscv64/issues/141)
- [android-riscv64 issue #147 -- BitstringTypeCheck](https://github.com/google/android-riscv64/issues/147)
- [android-riscv64 issue #148 -- Zbs optimizations](https://github.com/google/android-riscv64/issues/148)
- [android-riscv64 issue #151 -- QEMU prebuilt update](https://github.com/google/android-riscv64/issues/151)
- [android-riscv64 issue #155 -- level of ART support](https://github.com/google/android-riscv64/issues/155)
- [android-riscv64 issue #156 -- AOT compilation support](https://github.com/google/android-riscv64/issues/156)
- [android-riscv64 issue #161 -- `__memcmp16`](https://github.com/google/android-riscv64/issues/161)
- [android-riscv64 issue #165 -- intrinsics for V and B](https://github.com/google/android-riscv64/issues/165)
- [android-riscv64 issue #167 -- vector regalloc](https://github.com/google/android-riscv64/issues/167)
- [android-riscv64 issue #61 -- LTO ABI bug](https://github.com/google/android-riscv64/issues/61)
- [android-riscv64 issue #36 -- BoringSSL riscv64 assembly](https://github.com/google/android-riscv64/issues/36)
- [T-head-Semi/art-riscv (mirrored as XUANTIE-RV/riscv-art)](https://github.com/T-head-Semi/art-riscv)
- [RISC-V International blog -- Porting and Optimizing Android ART on XuanTie C910](https://riscv.org/blog/porting-and-optimizing-android-art-on-xuantie-c910/)
- [An Empirical Comparison of the RISC-V and AArch64 Instruction Sets (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3624062.3624233)
- [opensource.googleblog.com -- Android and RISC-V, what you need to know](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)