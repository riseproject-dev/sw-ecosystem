---
title: ART
categories:
  - android
---

# ART

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for ART<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

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
**License:** Apache 2.0<br/>
**Governance:** Google-controlled AOSP. All 21 OWNERS are Google employees (@google.com). No independent foundation or tiered membership governance. Contributions flow through [android-review.googlesource.com](https://android-review.googlesource.com).<br/>
**RISE Project involvement:** None. ART is not a RISE workstream. Google is a Premier RISE member, but ART is not represented in RISE's tracked projects (confirmed by scanning all 27 RISE blog posts from May 2024 through June 2026, all 77 packages in the RISE wheel builder, and all repositories under github.com/riseproject-dev).<br/>

---

## 2. Port History and Upstreaming Timeline

The riscv64 port of ART was initiated by Google in late 2022 and reached functional completeness (interpreter + JIT + AOT + JNI) by early 2024. The work was entirely upstream in AOSP from the start -- there is no separate downstream branch. Approximately 280 Gerrit changes are associated with the port; roughly 250 are MERGED, 12 remain open, and 30 were abandoned (mostly early superseded drafts).

No single master tracking issue exists. The port was organized across individual Gerrit changes with no public project roadmap document.

### Phase 1: Build scaffolding (Oct 2022 - Jan 2023)

**First commit:** [Change 2239704](https://android-review.googlesource.com/c/platform/art/+/2239704), merged 2022-10-05. Subject: "Fix panics in art build code when target arch is riscv64." Author: Colin Cross (Google). This was a build-system fix to stop Go build code from panicking on an unknown architecture -- not a runtime implementation.

The rest of Phase 1 consisted of ELF/DWARF plumbing. [Change 2266237](https://android-review.googlesource.com/c/platform/art/+/2266237) (Colin Cross, merged 2022-10-31, +70/-4) fixed the DWARF floating-point register offset for riscv64: F0-F31 were being assigned to DWARF registers 64-95, but the RISC-V ELF psABI requires them at 32-63. This correction was necessary for correct crash dumps and stack unwinding. Several changes by Lifang Xia (linux.alibaba.com, Alibaba) were submitted in this window but subsequently abandoned in favor of later, cleaner revisions.

### Phase 2: Runtime foundation (Jan - Apr 2023)

**First substantive ART riscv64 implementation:** [Change 2402707](https://android-review.googlesource.com/c/platform/art/+/2402707), created 2023-01-27, merged 2023-02-21. Author: Ulya Trofimovich (Google). Subject: "riscv64: add initial support for ART." Stats: +598/-77 lines, 42 review comments, 18 patch sets. This change established the riscv64 ISA enum, stub register file, skeletal instruction set features, and the code generator class hierarchy. The commit message states: "The only supported mode is the switch interpreter. JNI transitions are not implemented yet... The only passing ART test is 000-nop." Tested on a Linux RISC-V VM using `aosp_riscv64-userdebug`.

Immediately following (2023-02-03), Lifang Xia (Alibaba) submitted the low-level register and ABI definitions: [Changes 2421273-2421276](https://android-review.googlesource.com/c/platform/art/+/2421273) covering general-purpose registers, floating-point registers, callee-saved frame layout, instruction set features, and CPU context.

Key milestones in Phase 2:

| Change | Subject | Author | Date |
|--------|---------|--------|------|
| [2442244](https://android-review.googlesource.com/c/platform/art/+/2442244) | Implement entrypoints sufficient to run a hello world test (+972 lines) | Ulya Trofimovich | 2023-02-17 |
| [2516195](https://android-review.googlesource.com/c/platform/art/+/2516195) | Implement GetFaultPc/GetFaultSp for RISCV | Prashanth Swaminathan | 2023-03-30 |
| [2510739](https://android-review.googlesource.com/c/platform/art/+/2510739) | Let dex2oat run in verification mode (disable compilation) | Ulya Trofimovich | 2023-03-28 |
| [2535780](https://android-review.googlesource.com/c/platform/art/+/2535780) | Move shadow stack register from X18 to X3(GP) | Ulya Trofimovich | 2023-04-13 |
| [2547152](https://android-review.googlesource.com/c/platform/art/+/2547152) | Make odrefresh recognize RISC-V target instead of aborting | Ulya Trofimovich | 2023-04-19 |
| [2547153](https://android-review.googlesource.com/c/platform/art/+/2547153) | Disable Nterp so that zygote doesn't SIGILL at boot | Ulya Trofimovich | 2023-04-19 |
| [2557830](https://android-review.googlesource.com/c/platform/art/+/2557830) | Hand-code trampoline instructions | Ulya Trofimovich | 2023-04-24 |

The X18 -> X3/GP shadow stack register move ([Change 2535780](https://android-review.googlesource.com/c/platform/art/+/2535780), +184/-181 lines, 23 comments) was a significant ABI-level decision: X18 is reserved for ShadowCallStack in Android's hardened build configuration, so ART's internal shadow frame pointer was moved to GP. This required touching every assembly entrypoint in riscv64.

Nterp was disabled at boot ([Change 2547153](https://android-review.googlesource.com/c/platform/art/+/2547153)) at this stage because all opcode handlers were `unimp` stubs -- executing them would trigger SIGILL. The system fell back to the switch interpreter for all execution.

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

Parallel to the assembler, Jaeheon Yi (Google) implemented Nterp:

- [Change 2537050](https://android-review.googlesource.com/c/platform/art/+/2537050): Created the full `runtime/interpreter/mterp/riscv64/` directory with all opcode handlers as `unimp` stubs (+987 lines, 2023-04-13).
- [Change 2541796](https://android-review.googlesource.com/c/platform/art/+/2541796): Defined riscv64 register conventions for the Nterp interpreter (DEX PC, thread register, dex cache pointer placement) -- 33 lines, 34 review comments (2023-04-18).
- [Change 2573612](https://android-review.googlesource.com/c/platform/art/+/2573612): Implemented `ExecuteNterpImpl` (2023-04-29).
- [Change 2608855](https://android-review.googlesource.com/c/platform/art/+/2608855): Re-enabled Nterp with a method filter (2023-05-30), reversing the earlier disable.

The JNI compiler was delivered in this phase:

| Change | Subject | Author | Date |
|--------|---------|--------|------|
| [2622874](https://android-review.googlesource.com/c/platform/art/+/2622874) | Implement JNI compiler for @CriticalNative | Vladimir Marko | 2023-06-13 |
| [2629849](https://android-review.googlesource.com/c/platform/art/+/2629849) | Implement JNI compiler for @FastNative | Vladimir Marko | 2023-06-19 |
| [2633469](https://android-review.googlesource.com/c/platform/art/+/2633469) | Implement JNI compiler for normal native | Vladimir Marko | 2023-06-21 |
| [2636496](https://android-review.googlesource.com/c/platform/art/+/2636496) | Enable JNI compiler | Vladimir Marko | 2023-06-26 |

Lifang Xia (Alibaba) contributed the initial codegen visitor stubs for the Optimizing compiler backend during this phase ([Changes 2619265-2637832](https://android-review.googlesource.com/c/platform/art/+/2619265)), covering register definitions, shift/binary ops, conditional moves, invokes, and other codegen visitors. These were uploaded by Marko on Xia's behalf and reviewed by Santiago Aboy Solanes (Google) and Trofimovich.

### Phase 4: Optimizing compiler and intrinsics (Aug - Dec 2023)

Vladimir Marko drove the full Optimizing compiler backend to functional completeness:

- Baker read barriers: [Change 2767026](https://android-review.googlesource.com/c/platform/art/+/2767026) (2023-09-28)
- Stack overflow handler: [Change 2735629](https://android-review.googlesource.com/c/platform/art/+/2735629) (2023-08-31)
- Null pointer handler: [Change 2760974](https://android-review.googlesource.com/c/platform/art/+/2760974) (2023-09-25)
- Allocation entrypoints: [Change 2786201](https://android-review.googlesource.com/c/platform/art/+/2786201) (2023-10-12)
- Optimizing compiler enabled for invokes: [Change 2727976](https://android-review.googlesource.com/c/platform/art/+/2727976) (2023-08-28)

RISC-V Vector (RVV) assembler support was added by Roman Artemev (Syntacore) in December 2023:

| Change | Subject | Date |
|--------|---------|------|
| [2862809](https://android-review.googlesource.com/c/platform/art/+/2862809) | Add RISC-V Vector register definitions | 2023-12-07 |
| [2862810](https://android-review.googlesource.com/c/platform/art/+/2862810) | Implement RISC-V Vector instructions | 2023-12-07 |
| [2862811](https://android-review.googlesource.com/c/platform/art/+/2862811) | Support RISC-V RVV in disassembler | 2023-12-07 |
| [2862812](https://android-review.googlesource.com/c/platform/art/+/2862812) | RISC-V RVV assembler tests | 2023-12-07 |

Intrinsics were delivered across November-December 2023: Memory peek/poke, Float/Double, Integer/Long, VarHandle compareAndSet/GetAndUpdate, Unsafe CAS/getAndAdd, SystemArrayCopy, String operations, boxing valueOf, Math functions.

Nterp opcode coverage was completed in this phase by Jaeheon Yi: SPUT/SGET variants, IGET/IPUT, AGET/APUT, CONST opcodes, new-instance, check-cast, instance-of, new-array, invoke-virtual, invoke-interface, polymorphic/custom invoke, range variants.

### Phase 5: Completion and ongoing optimization (Jan 2024 - present)

- Compressed (C) extension support in assembler and disassembler: Roman Artemev ([Changes 2939939-2939940](https://android-review.googlesource.com/c/platform/art/+/2939939), 2024-01-31)
- Auto-compression (automatic selection of compressed instructions): Roman Artemev ([Changes 3000789-3000793](https://android-review.googlesource.com/c/platform/art/+/3000789), 2024-03-13)
- Instruction simplifier for riscv64 (ShiftAdd, BitwiseNegatedRight, Rol, Shl+Add): Anton Romanov (Syntacore) ([Changes 3009176](https://android-review.googlesource.com/c/platform/art/+/3009176), [3122231](https://android-review.googlesource.com/c/platform/art/+/3122231), [3229242](https://android-review.googlesource.com/c/platform/art/+/3229242), 2024)
- Zbs extension support: Sergey Kozub (Syntacore) ([Changes 3235976-3235977](https://android-review.googlesource.com/c/platform/art/+/3235976), 2024-08-22)
- JIT Logger: Roman Artemev ([Change 3551900](https://android-review.googlesource.com/c/platform/art/+/3551900), 2025-03-19)
- invokeExact MethodHandle intrinsic (invoke-static, invoke-virtual, invoke-direct, invoke-interface): Anton Romanov (Syntacore) ([Changes 3432661](https://android-review.googlesource.com/c/platform/art/+/3432661), [3512456](https://android-review.googlesource.com/c/platform/art/+/3512456), [3555544](https://android-review.googlesource.com/c/platform/art/+/3555544), 2024-2025)
- Nterp opcode filter removed ([Change 2961966](https://android-review.googlesource.com/c/platform/art/+/2961966), 2024-02-13): all methods eligible for Nterp dispatch

Open as of the report date: IR optimizations for bit manipulation and division by constant (Sergey Kozub, Syntacore, [Changes 3556505-3556506](https://android-review.googlesource.com/c/platform/art/+/3556505), March 2025); invokeExact for accessor MethodHandles ([Change 3580772](https://android-review.googlesource.com/c/platform/art/+/3580772), Anton Romanov); IR bit manipulation rework ([Change 3693991](https://android-review.googlesource.com/c/platform/art/+/3693991), Roman Artemev, July 2025 [NEEDS VERIFICATION -- date is future relative to this report]).

### Key contributors

| Contributor | Affiliation | Primary work area |
|-------------|-------------|-------------------|
| Vladimir Marko | Google | Optimizing compiler backend (primary author), assembler, JNI compiler, intrinsics, read barriers |
| Ulya Trofimovich | Google | Runtime entrypoints, fault handler, build infrastructure, dex2oat/odrefresh |
| Jaeheon Yi | Google | Nterp interpreter opcodes |
| Lifang Xia | Alibaba (linux.alibaba.com) | Early codegen scaffold, register definitions, Math/Thread intrinsics |
| Roman Artemev | Syntacore | RVV assembler, C extension, auto-compression, JIT Logger |
| Anton Romanov | Syntacore | Instruction simplifier (ShiftAdd, Rol), invokeExact intrinsic |
| Sergey Kozub | Syntacore | Zbs extension, IR optimizations |
| Samuel Holland | SiFive | ISA feature detection, Zba/Zbb/Zbs gating |
| Denis Tomashev | Syntacore | StringEquals, StringCompareTo intrinsics |

---

## 3. Upstream Support Tier

ART has no published tiered support policy for architectures. The de-facto tier is determined by:

1. Whether the architecture is in the LUCI CI system
2. Whether it is a supported NDK ABI
3. Whether it has hardware builders (vs. QEMU only)

**riscv64 position:** riscv64 is in AOSP main and has active CI (QEMU only). It is not a supported NDK ABI (NDK r27/r28 explicitly mark riscv64 as unsupported/provisional -- ABI breaks remain possible). There are no hardware CI builders. All OWNERS are Google employees; there is no formal community veto or co-governance. The architecture is maintained as an emerging/in-progress target.

The riscv64 QEMU builder (`qemu.riscv.64`) appears in the "ART LUCI Console" at the same level as other QEMU-based builders. There is no documented downgrade or deprecation path.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 runtime/arch/riscv64/ (17 files)

Assembly stubs (.S): `asm_support_riscv64.S`, `jni_entrypoints_riscv64.S`, `native_entrypoints_riscv64.S`, `quick_entrypoints_riscv64.S`.

The `quick_entrypoints_riscv64.S` file contains the full set of "quick" ABI trampolines: invocation stubs, exception delivery, resolution trampolines, TLAB/RosAlloc allocation, type resolution, GC read barrier marks for registers 5-31, lock/unlock, array operations, string operations, suspend checks, deoptimization, and on-stack replacement (OSR).

Headers and C++:
- `context_riscv64.{h,cc}`: Register context save/restore for GPRs and FPRs. Nterp Dex PC is pinned to S3; PC is stored at index `kNumberOfXRegisters` in the context array.
- `instruction_set_features_riscv64.{h,cc}`: Feature flag detection. Flags: `kExtGeneric` (IMAFD base), `kExtCompressed` (C), `kExtVector` (V), `kExtZba`, `kExtZbb`, `kExtZbs`. Detection via `/proc/cpuinfo`, `AT_HWCAP`, the cpu_features library, or assembly probe.
- `registers_riscv64.{h,cc}`: 32 XRegisters (TR=S1 as ART thread register, TMP=T6, TMP2=T5), 32 FRegisters (FTMP=FT11), 32 VRegisters (vector).
- `fault_handler_riscv64.cc`: Signal-based null pointer and stack overflow fault handling.

### 4.2 compiler/utils/riscv64/ (9 files)

- `assembler_riscv64.{h,cc,_test.cc}`: Full assembler covering RV64I/M/A/F/D base ISA, the full RISC-V V (RVV) vector extension (VSetvli/VSetivli/VSetvl, unit/strided/indexed/segment/whole-register loads and stores, integer arithmetic, mask operations, FP operations, widening, narrowing, reductions, conversions, FMA), and Zba/Zbb/Zbs bit-manipulation extensions. Also supports the C (compressed) extension with auto-compression.
- `jni_macro_assembler_riscv64.{h,cc,_test.cc}`: JNI macro assembler layer over the base assembler.
- `managed_register_riscv64.{h,cc,_test.cc}`: Managed register abstraction over XRegister/FRegister/VRegister.

### 4.3 compiler/optimizing/ (riscv64-specific files)

- `code_generator_riscv64.{h,cc}`: Full AOT/JIT Optimizing compiler backend. Implements InvokeRuntimeCallingConvention, InvokeDexCallingConventionVisitorRISCV64, CriticalNativeCallingConventionVisitorRiscv64, LocationsBuilderRISCV64, InstructionCodeGeneratorRISCV64, CodeGeneratorRISCV64. Handles PC-relative AUIPC patching (20+12 bit split), Baker/slow-path read barriers, write barriers, JIT root patching, suspend checks, and FP type dispatch.
- `intrinsics_riscv64.{h,cc}`: IntrinsicLocationsBuilderRISCV64 and IntrinsicCodeGeneratorRISCV64.
- `instruction_simplifier_riscv64.{h,cc,_test.cc}`: Architecture-specific instruction simplifications (ShiftAdd, BitwiseNegatedRight, Rol).
- `critical_native_abi_fixup_riscv64.{h,cc}`: CriticalNative ABI fixup compiler pass.
- `nodes_riscv64.h`: riscv64-specific HIR nodes.

### 4.4 runtime/interpreter/mterp/riscv64/

8 assembly (.S) files covering: arithmetic, arrays, control flow, floating point, invoke, main (dispatch loop), object, and other operations. This is the Nterp template interpreter for riscv64.

### 4.5 ISA extensions in use

The QEMU CI builder uses: `-cpu rv64,v=true,elen=64,vlen=128,zba=true,zbb=true,zbs=true`. All of V, Zba, Zbb, and Zbs are available in CI. The assembler supports all of these. The Optimizing compiler uses Zba/Zbb/Zbs conditionally via ISA feature flags. RVV is present in the assembler and disassembler but is NOT used by the Optimizing compiler code generator for SIMD JIT/AOT code generation (see Section 6).

---

## 5. Build System, Cross-Compilation, and Toolchain

ART uses the Android Soong build system (Android.bp). riscv64 is enabled via `-DART_ENABLE_CODEGEN_riscv64` in `build/Android.bp`. The build script `tools/buildbot-utils.sh` validates `TARGET_ARCH` against the regex `^(arm64|riscv64)$` -- any other architecture triggers a fatal error, indicating riscv64 has first-class build script support.

When `TARGET_ARCH=riscv64` and `frameworks/base` is absent (reduced manifest), `tools/buildbot-build.sh` copies prebuilts from `prebuilts/runtime/mainline/local_riscv64` for Conscrypt and StatsD, and applies pending `Android.bp.patch` files (workaround for bug `b/286551985`).

The riscv64 QEMU builder (`qemu.riscv.64`) uses a custom QEMU binary: `device/google/cuttlefish_vmm/qemu/x86_64-linux-gnu/bin/qemu-system-riscv64`. This binary is sourced from the Cuttlefish VMM repo, not system QEMU. The VM uses Ubuntu 24.04 cloud image (`ubuntu-24.04-server-cloudimg-riscv64.img`), boots via U-Boot (not EFI, unlike the arm64 builder), runs with 16 GB RAM and 8 QEMU SMP cores.

A riscv64-specific test target exists in TEST_MAPPING: `art-run-test-458-checker-riscv64-shift-add` -- a Checker-annotation test for ShiftAdd optimizations in the Optimizing compiler. This test runs in both `art-mainline-presubmit` and `mainline-presubmit` groups.

**Toolchain:** ART uses Clang/LLVM (the Android NDK clang), not GCC. riscv64 cross-compilation is handled transparently by the Soong build system when `TARGET_ARCH=riscv64` is set.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Implemented and functional

| Feature | Status |
|---------|--------|
| Switch interpreter | Complete |
| Nterp template interpreter | Complete (all opcodes, filter removed Feb 2024) |
| Optimizing JIT compiler (integer/FP/control flow) | Complete |
| AOT compilation (dex2oat) | Complete |
| JNI compiler (CriticalNative, FastNative, normal) | Complete |
| Assembler (base ISA + M/A/F/D) | Complete |
| Assembler (C extension + auto-compression) | Complete |
| Assembler (RVV vector extension) | Complete (assembler only) |
| Assembler (Zba/Zbb/Zbs) | Complete |
| Disassembler | Complete |
| Baker read barriers | Complete |
| Write barriers | Complete |
| Stack overflow handler | Complete |
| Null pointer fault handler | Complete |
| TLAB/RosAlloc allocation entrypoints | Complete |
| JIT root patching | Complete |
| CFI/DWARF unwind info | Complete |
| ISA feature detection (V, C, Zba, Zbb, Zbs) | Complete |
| Intrinsics: Math (sqrt, ceil, floor, rint, round, fma, multiplyHigh, etc.) | Complete |
| Intrinsics: String (StringEquals, StringCompareTo, StringGetCharsNoCheck, StringNewStringFrom*) | Complete |
| Intrinsics: Integer/Long (reverse, reverseBytes, bitCount, divideUnsigned, etc.) | Complete |
| Intrinsics: VarHandle (compareAndSet, GetAndUpdate) | Complete |
| Intrinsics: Unsafe (CAS, get/put, getAndAdd/Set) | Complete |
| Intrinsics: SystemArrayCopy (object, char, int, byte) | Complete |
| Intrinsics: Memory peek/poke | Complete |
| Intrinsics: Reference | Complete |
| Intrinsics: boxing valueOf | Complete |
| Intrinsics: Thread.currentThread, Thread.Interrupted, reachability.Fence | Complete |
| invokeExact intrinsic (invoke-static, invoke-virtual, invoke-direct, invoke-interface) | Complete |
| Instruction simplifier: ShiftAdd, BitwiseNegatedRight, Rol | Complete |
| Branch profiling | Complete |
| JIT Logger | Complete |

### 6.2 Gaps vs arm64 and x86_64

The following features are present for arm64 and/or x86_64 but absent or incomplete for riscv64:

**Baseline/Fast compiler:** The `fast_compiler.h` function that selects the baseline JIT compiler returns `nullptr` for all architectures except arm64. No `fast_compiler_riscv64.cc` exists. The baseline JIT provides faster compilation at the cost of code quality -- it is the first JIT tier on arm64 before the Optimizing JIT takes over. riscv64 has no equivalent. This is a multi-tier JIT regression relative to arm64. [Source: android.googlesource.com/platform/art/+/refs/heads/main/compiler/optimizing/fast_compiler.h]

**SIMD/RVV in the Optimizing compiler:** The code generator returns `false` for SIMD support and is marked with explicit TODOs: "TODO(riscv64): Check the vector extension" and "TODO(riscv64): Implement SIMD with the Vector extension." No `code_generator_vector_riscv64.cc` file exists. The RVV assembler support is complete but unused by the compiler backend. arm64 uses NEON extensively for vectorized array operations, String manipulation, and intrinsics. This is the single largest performance gap. Tracked at [android-riscv64 issue #167](https://github.com/google/android-riscv64/issues/167).

**Missing intrinsics (`UNIMPLEMENTED_INTRINSIC_LIST_RISCV64`):**
- All FP16 operations (Ceil, Floor, Compare, Rint, ToFloat, etc.)
- All StringBuilder/StringBuffer append variants
- CRC32 update methods
- MethodHandleInvoke
- UnsafeArrayBaseOffset / JdkUnsafeArrayBaseOffset

These fall back to slow interpreted paths. Tracked at [android-riscv64 issue #141](https://github.com/google/android-riscv64/issues/141).

**`__memcmp16` generic C:** All other supported architectures (arm, arm64, x86, x86_64) have hand-optimized assembly for `__memcmp16`, used by `String.compareTo()`. riscv64 uses a generic C fallback. Tracked at [android-riscv64 issue #161](https://github.com/google/android-riscv64/issues/161).

**`GenerateBitstringTypeCheckCompare` unimplemented:** The code generator has an explicit `Unimplemented` stub for this function, which is used by type check optimizations. Tracked at [android-riscv64 issue #147](https://github.com/google/android-riscv64/issues/147).

**`CanUseImplicitSuspendCheck` returns false:** riscv64 does not use implicit suspend checks (hardware fault-based), falling back to explicit check instructions at every loop back-edge and method entry. arm64 and x86_64 use implicit suspend checks via guard page faults.

**`VecAddress` (SIMD vector address generation) unimplemented:** Explicit `Unimplemented` stub in the code generator.

**`AddReadBarrierSlowPath` / `GenerateReadBarrierSlow` unimplemented:** Slow-path versions of the read barrier. Baker read barriers (fast path) are implemented, but the slow paths fall back to runtime calls.

**`GenerateDivRemWithAnyConstant` not optimized:** Currently materializes the divisor via `LoadConst64` rather than using multiply-by-reciprocal optimization available on arm64/x86_64.

**Jump table `SH2ADD` from Zba not used:** `GenTableBasedPackedSwitch` has a TODO to use `SH2ADD` for the scaled index but currently does not.

**`ZextW` instruction not used:** In `intrinsics_riscv64.cc`, 32-bit zero-extension currently emits `SLLI+SRLI` (two instructions) where a single `ADD.UW` or `C.ZEXT.W` from Zb/Zc extensions could be used.

**Intrinsics revisit for V and B extensions:** VarHandle, String, and array intrinsics do not leverage RVV or B-extension instructions for performance. Tracked at [android-riscv64 issue #165](https://github.com/google/android-riscv64/issues/165).

**Register allocator with vector registers:** The register allocator does not handle RVV vector registers. Tracked at [android-riscv64 issue #167](https://github.com/google/android-riscv64/issues/167).

**Zbs optimizations:** The Zbs bit-manipulation extension (single-bit insert/extract/clear/invert) is in the assembler but is not exploited by the instruction simplifier beyond `RemoveUnnecessaryUse`. Tracked at [android-riscv64 issue #148](https://github.com/google/android-riscv64/issues/148).

### 6.3 Performance admission

The only quantitative performance data found: a GitHub comment in issue #122 (filed 2023-11-15 by romart), stating "we are just running the ART tests atm because everything else is so slow." No benchmark numbers (SPECjvm, DaCapo, microbenchmarks) were found in any public source. No performance comparison to arm64 or x86_64 has been published.

Data not available: ART riscv64 JIT throughput, interpreter throughput, GC pause times, startup latency, or any published comparison against arm64 or x86_64.

---

## 7. CI/CD Infrastructure

### 7.1 LUCI builder

There is exactly one riscv64 builder in the ART LUCI CI system:

- **Builder name:** `qemu.riscv.64`
- **Category/console:** `qemu|riscv` on the "ART LUCI Console"
- **Bitness:** 64-bit only (no 32-bit RISC-V variant)
- **Mode:** QEMU virtual machine (`on_virtual_machine: true`)
- **Product:** `riscv64`
- **Test args:** `--target --verbose --debug` (debug mode only; no release mode builder)
- **GC config:** `concurrent_collector: true`, `generational_cc: true`, `gcstress: false`, `heap_poisoning: false`
- **Swarming pool:** `luci.art.ci` on Ubuntu hosts with 16 cores
- **Timeouts:** 30-hour execution, 17-hour expiration
- **Triggers:** Commits to `platform/art` (refs/heads/master), `platform/libcore` (refs/heads/master), `platform/manifest` (refs/heads/master-art), `platform/external/vogar` (refs/heads/master)

### 7.2 Gaps

- **No hardware builder.** All riscv64 testing is QEMU-only. Hardware-specific bugs (cache coherency edge cases, real memory ordering, interrupt timing) are not caught in CI.
- **Debug mode only.** No release-mode or no-dex2oat configuration for riscv64. arm64 has multiple builder configurations (debug, release, gcstress, heap poisoning, etc.).
- **No 32-bit variant.** Not applicable to riscv64 (no 32-bit userspace ABI in Android's usage), but noted for completeness.
- **Single builder.** A single QEMU builder covers the entire test suite. Any flakiness or QEMU version issues affect all riscv64 testing.
- **Historical flakiness:** [Change 3327994](https://android-review.googlesource.com/c/platform/art/+/3327994) (merged 2024-10-31) temporarily disabled failing gtests on riscv64, indicating test reliability issues.

---

## 8. Distribution and Release Status

ART riscv64 ships as part of AOSP Android 14 (API 34) and later. The most recent Android release visible in the source is Android 17.0.0_r1.

The riscv64 NDK ABI is explicitly marked unsupported/provisional in NDK r27 and r28. This means:
- Application developers cannot target riscv64 as an NDK ABI
- ABI breaks remain possible in future Android releases
- OEM device support is absent (no riscv64 Android consumer devices ship as of this report date)

ART itself is distributed as part of the Android platform image, not as a standalone binary. There are no separate ART release artifacts for riscv64.

---

## 9. Dependencies

### 9.1 Android Bionic (libc/libdl/linker)

riscv64 support present in AOSP. Dedicated `arch-riscv64/` assembly, 5 libc asm files, 15 RVV-optimized string functions, linker entry, TLSDESC resolver. QEMU testing only; no hardware CI. Ships in Android 14+.

**Open blockers:** LTO ABI correctness bug ([android-riscv64 issue #61](https://github.com/google/android-riscv64/issues/61) -- labeled `bug`, can silently produce incorrect binaries with LTO enabled across a full build); NDK ABI not finalized.

### 9.2 libunwindstack

riscv64 register file implemented (`RegsRiscv64.cpp`). No `ElfInterfaceRiscv64`; relies on DWARF-only unwinding. No dedicated assembly unwinding fast path (unlike arm64/x86_64). Ships in Android 14+.

### 9.3 BoringSSL (via Conscrypt)

No riscv64-specific assembly. All AES/SHA/ChaCha20 operations run generic C. Open tracking issue [android-riscv64 issue #36](https://github.com/google/android-riscv64/issues/36). This affects every TLS handshake and Java Security operation on riscv64. No RVV-accelerated crypto paths exist.

### 9.4 Conscrypt

Builds via Android Soong. Published AAR artifacts do not list riscv64 as a packaged native ABI. Not in any published Conscrypt AAR release for riscv64. Inherits the BoringSSL generic-C limitation.

### 9.5 ICU4J/ICU4C

No riscv64-specific source required (pure C/C++). Builds. Ships in Android 14+. No formal riscv64 test coverage declaration from ICU upstream. [NEEDS VERIFICATION -- correctness not formally validated for riscv64]

### 9.6 zlib

No riscv64 SIMD code paths. ARM NEON and x86 SSE paths are present; no RISC-V equivalent. Ships in Android 14+.

### 9.7 liblzma / liblz4

Generic C only. No RVV optimization. Builds and ships in Android 14+.

### 9.8 libbase, libziparchive, libnativebridge, libnativeloader

Pure C++, no arch-specific code required. All build and ship in Android 14+. No known riscv64-specific issues.

### 9.9 libsigchain

Depends on libunwindstack. Inherits the DWARF-only unwinding limitation on riscv64. Builds and ships in Android 14+.

### 9.10 VIXL

Not a riscv64 dependency. VIXL is ARM/ARM64 only. ART riscv64 uses its own `assembler_riscv64.cc` and `jni_macro_assembler_riscv64.cc` directly.

---

## 10. Ecosystem Status

**riscv64 Android device availability:** No consumer riscv64 Android devices ship as of this report date. The only riscv64 Android execution environment is Cuttlefish (Android Virtual Device) running on QEMU. [NEEDS VERIFICATION -- no second source confirming zero shipping hardware found]

**RISE Project:** No ART involvement. RISE covers OpenJDK/Java, LLVM, Rust, Go, Python wheels, V8, Yocto, OpenBLAS, PyTorch/ExecuTorch, Kubernetes, and CI infrastructure. Android Runtime is not a RISE workstream.

**Syntacore involvement:** Syntacore (RISC-V processor IP company, founding RISC-V International member) has three active contributors to ART riscv64 (Roman Artemev, Anton Romanov, Sergey Kozub). Their work concentrates on the assembler (RVV, C extension, Zbs), instruction simplifier, and invokeExact intrinsics. This is the only non-Google corporate contributor with sustained engagement as of the report date.

**SiFive involvement:** Samuel Holland (SiFive) contributed ISA feature detection and Zba/Zbb/Zbs gating work in mid-to-late 2023. No recent (2024+) SiFive contributions are visible in the change log.

**Alibaba involvement:** Lifang Xia (linux.alibaba.com) contributed the foundational register/ABI definitions and several intrinsics in 2023. No recent Alibaba contributions visible in the change log.

---

## 11. Known Bugs and Active Issues

All issues from [github.com/google/android-riscv64](https://github.com/google/android-riscv64/issues):

**Open issues directly affecting ART performance or correctness:**

| Issue | Title | Opened | Owner |
|-------|-------|--------|-------|
| [#167](https://github.com/google/android-riscv64/issues/167) | Support vector regalloc for RISC-V backend in ART | 2025-09-11 | GreenSeal |
| [#165](https://github.com/google/android-riscv64/issues/165) | ART: revisit intrinsics to use V and B | 2025-05-29 | enh-google |
| [#161](https://github.com/google/android-riscv64/issues/161) | ART: implement custom `__memcmp16`? | 2025-03-12 | enh-google |
| [#153](https://github.com/google/android-riscv64/issues/153) | Implement MethodHandleInvokeExact intrinsic for riscv64 | 2024-12-09 | antonromanov1 |
| [#148](https://github.com/google/android-riscv64/issues/148) | ART: Implement optimizations with Zbs extension | 2024-08-22 | samogongik |
| [#147](https://github.com/google/android-riscv64/issues/147) | ART: Implement BitstringTypeCheck for RISC-V | 2024-07-31 | samogongik |
| [#141](https://github.com/google/android-riscv64/issues/141) | ART: unimplemented intrinsics | 2024-04-02 | enh-google |

**Open issues affecting ART's dependency stack:**

| Issue | Title | Severity |
|-------|-------|----------|
| [#61](https://github.com/google/android-riscv64/issues/61) | LTO ABI correctness bug in Bionic | Critical -- can produce silent incorrect binaries |
| [#36](https://github.com/google/android-riscv64/issues/36) | BoringSSL lacks riscv64 assembly | High -- all crypto on generic C |

**Closed issues of historical note:**

| Issue | Title | Closed |
|-------|-------|--------|
| [#136](https://github.com/google/android-riscv64/issues/136) | Fix ART 850-checker-branches test with JIT | 2024-02-24 |
| [#130](https://github.com/google/android-riscv64/issues/130) | ART: Support RISC-V Compressed (C) extensions | Late 2023 |
| [#128](https://github.com/google/android-riscv64/issues/128) | ART: implement String intrinsics | 2025-05-29 |
| [#122](https://github.com/google/android-riscv64/issues/122) | ART Vector Extension Implementation (MacroAssembler) | Closed |

---

## 12. Objections and Upstream Blockers

**NDK ABI instability:** The riscv64 NDK ABI is explicitly marked unsupported/provisional. Any application binary compiled against it may break in a future Android release. This blocks real-world application deployment and external investment justification.

**No hardware CI:** QEMU-only testing means hardware-specific bugs (memory model edge cases, real-hardware interrupt timing, cache flush behavior) are not caught before merge. Any change that breaks on real riscv64 hardware but passes QEMU will reach AOSP main.

**Debug-mode-only builder:** The CI runs with `--debug` flags only. Release-mode code generation bugs, LTO interactions, and release-build-specific optimizations are not tested.

**Google OWNERS monopoly:** All 21 OWNERS are Google employees. External contributors (Syntacore, Alibaba, SiFive) can submit patches but cannot approve them. This creates a bottleneck: any patch touching the RISC-V backend requires Google reviewer bandwidth.

**No hardware ecosystem:** No consumer riscv64 Android devices exist. Without hardware, there is no application developer demand, no OEM pull, and no economic justification for vendors to prioritize riscv64 ART quality.

**Missing baseline JIT:** arm64 has a two-tier JIT (baseline + Optimizing). riscv64 has only the Optimizing JIT. For short-lived methods and startup-dominated workloads, this is a structural performance regression that requires implementing a new compiler tier.

**BoringSSL performance gap:** Every TLS handshake and Java crypto operation (via Conscrypt -> BoringSSL) runs on generic C. On arm64, AES-GCM, SHA-256, and ChaCha20-Poly1305 use hand-optimized assembly. The riscv64 equivalent would require authoring RVV-accelerated BoringSSL code or waiting for upstream BoringSSL to add it.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

ART riscv64 is functionally complete for the Optimizing JIT, AOT, Nterp, and JNI compiler. The port can execute arbitrary Android Java code. The remaining functional gaps are:

- Unimplemented intrinsics (FP16, CRC32, StringBuilder append, MethodHandleInvoke): these fall back to interpreter, causing correctness-correct but slow execution for affected code paths.
- BitstringTypeCheck unimplemented: affects type check performance in polymorphic dispatch.
- Implicit suspend checks not implemented: causes extra instruction overhead at every loop and method entry.

Work to close all functional gaps is straightforward -- it requires extending existing patterns in `intrinsics_riscv64.cc` and `code_generator_riscv64.cc`. No architectural research is required.

### 13.2 Performance Optimization

Three tiers of performance work:

**Tier 1 -- High-impact, well-defined (3-6 months, 2-3 engineers):**
- RVV register allocation and SIMD codegen in the Optimizing compiler ([#167](https://github.com/google/android-riscv64/issues/167)): Requires adding a vector register allocator and implementing `code_generator_vector_riscv64.cc`. This is the largest performance gap. The arm64 equivalent (`code_generator_vector_arm64.cc`) provides the template.
- Revisit intrinsics for V and B extensions ([#165](https://github.com/google/android-riscv64/issues/165)): Vectorize SystemArrayCopy, String operations, and math intrinsics using RVV.
- `__memcmp16` hand-coded assembly ([#161](https://github.com/google/android-riscv64/issues/161)): A well-bounded 1-2 week task; high impact on String-heavy workloads.

**Tier 2 -- Medium-impact, architectural work (2-4 months, 1-2 engineers):**
- Baseline/fast JIT compiler for riscv64: Implementing a first-tier JIT compiler that produces lower-quality but faster-compiled code. arm64's `fast_compiler_arm64.cc` is the template. This improves startup latency and short-lived method performance.
- Zbs/Zba/Zbb exploitation in instruction simplifier: Expanding the patterns recognized by `instruction_simplifier_riscv64.cc`.
- `GenerateDivRemWithAnyConstant` optimization: Multiply-by-reciprocal for constant division. Standard implementation.

**Tier 3 -- Long-term, research (6-12 months):**
- BoringSSL RVV crypto acceleration: Not in ART scope directly, but required for full crypto performance.
- LTO ABI correctness fix in Bionic ([#61](https://github.com/google/android-riscv64/issues/61)): Bionic team work; required for production builds.

### 13.3 CI/CD Infrastructure

**Hardware CI builder:** Adding a hardware riscv64 CI builder would require: a machine pool with riscv64 hardware capable of running Android (Unmatched board or equivalent), integration with the LUCI Swarming pool, and buildbot scripts. The existing `tools/buildbot-vm.sh` and `tools/buildbot-utils.sh` would need hardware-path variants (no QEMU, no U-Boot). Effort: 4-8 weeks for infrastructure, ongoing hardware maintenance.

**Release-mode builder:** Adding a `--release` configuration alongside the existing debug builder would immediately surface release-mode bugs. Low effort given existing builder infrastructure -- primarily a configuration change.

### 13.4 Ecosystem Enablement

NDK ABI stabilization is a Google decision and is not directly actionable by external contributors. However, contributing evidence of riscv64 correctness (expanded test coverage, hardware CI results) accelerates the timeline.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Implement missing intrinsics (FP16, CRC32, StringBuilder, MethodHandleInvoke) | 4-6 | ART riscv64 team | High |
| Functional | Implement BitstringTypeCheck | 1-2 | ART riscv64 team | Medium |
| Functional | Implement implicit suspend checks | 2-3 | ART riscv64 team | Medium |
| Performance | `__memcmp16` hand-coded assembly (RVV) | 1-2 | ART riscv64 team | High |
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

## 14. Updates

No updates -- initial report dated 2026-06-17.

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
- [Change 2239704 -- first riscv64 ART change](https://android-review.googlesource.com/c/platform/art/+/2239704)
- [Change 2402707 -- initial ART riscv64 runtime support](https://android-review.googlesource.com/c/platform/art/+/2402707)
- [android-riscv64 issue #141 -- unimplemented intrinsics](https://github.com/google/android-riscv64/issues/141)
- [android-riscv64 issue #161 -- `__memcmp16`](https://github.com/google/android-riscv64/issues/161)
- [android-riscv64 issue #165 -- intrinsics for V and B](https://github.com/google/android-riscv64/issues/165)
- [android-riscv64 issue #167 -- vector regalloc](https://github.com/google/android-riscv64/issues/167)
- [android-riscv64 issue #61 -- LTO ABI bug](https://github.com/google/android-riscv64/issues/61)
- [android-riscv64 issue #36 -- BoringSSL riscv64 assembly](https://github.com/google/android-riscv64/issues/36)