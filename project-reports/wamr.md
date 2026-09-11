---
title: WAMR
parent: Project Reports
color: yellow
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: asmjit
    relation: build-dependency
    criticality: optional
  - name: simde
    relation: runtime-dependency
    criticality: optional
  - name: BoringSSL
    relation: runtime-dependency
    criticality: optional
  - name: libuv
    relation: runtime-dependency
    criticality: critical
  - name: uvwasi
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="wamr" %}

# WAMR

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for WAMR<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

WAMR (WebAssembly Micro Runtime) is a C-language WebAssembly VM providing an interpreter (classic and "fast"), an AOT (ahead-of-time) compiler/loader, and an LLVM-based ORC-JIT tier, targeted primarily at embedded and IoT use cases. The upstream repository was transferred out of the Bytecode Alliance org: `bytecodealliance/wasm-micro-runtime` now redirects to the independent org [wasm-micro-runtime/wasm-micro-runtime](https://github.com/wasm-micro-runtime/wasm-micro-runtime), with the README carrying a "We've Arrived" migration notice. `bytecodealliance.org/projects` no longer lists WAMR among its Core or Hosted projects, so WAMR is not currently part of the Bytecode Alliance's active project roster despite historical BA hosting. License: Apache-2.0 with LLVM exception (`LICENSE`).

**Governance.** A WAMR Technical/Project Steering Committee (WAMR-TSC) operates under a documented `TSC_Charter.md`: minimum 4 members, no term limits, Lazy Consensus for routine changes, Consensus Seeking (falling back to simple-majority vote) for TSC agenda items, annual Chair election (Condorcet/STV), and automatic removal for members attending under 25% of meetings in a 3-month window. Current TSC Chair is Xin Wang (Intel); the committee spans roughly 12 members from Intel, Amazon, Sony, Xiaomi, Ant Group, Siemens, and Midokura [NEEDS VERIFICATION - roster sourced from the GitHub org page plus corroborating web search, not a static in-repo file].

**CODEOWNERS.** `@lum1n0us` and `@TianlongLiang` (both Intel) and `@yamt` (YAMAMOTO Takashi, Midokura) own the codebase broadly; subarea owners include `@loganek` (Amazon, Windows port and lib-socket), `@no1wudi` (Xiaomi, NuttX port), `@srberard` (Zephyr port), and `@yamt` again for the Darwin port.

**Corporate contribution volume (full commit history):** Wenyong Huang (Intel, 516 commits), YAMAMOTO Takashi (Midokura, 392), Liang He (Intel, 280), Huang Qi (Xiaomi, 163), TianlongLiang (Intel, 113), Xu Jun (Intel, 103+22), Wang Xin/TSC chair (Intel, 71), Enrico Loparco (Amazon, 52), Marcin Kolny (Amazon, 49+35), Benbuck Nason (Netflix, 39), Georgii Rylov (Amazon, 30). Intel and Amazon are the dominant corporate backers by both commit volume and CODEOWNERS presence.

**ADOPTERS.md** lists production/pre-production users: Alibaba, Amazon (Prime Video), Ant Group (AntChain), Bosch (Silverline), Disney (Disney+ Streaming), Intel, Microsoft (Hyperlight/Azure), Midokura, Moonbit, Siemens, Sony Semiconductor Solutions, Xiaomi (Vela, TEE engine).

**Community culture on new ports.** `doc/port_wamr.md` documents a formal on-ramp: implement the platform abstraction layer under `core/shared/platform/<new-os>`, add a mini-product build under `product-mini/platforms/<new-os>`, and the port can be upstreamed. New ports are explicitly expected to land at Tier C and graduate as they gain CI coverage and production users (see Section 3). `CONTRIBUTING.md` asks for small PRs (approximately 300-400 lines) and platform-specific source directories over macros. The RISC-V port itself originated from an outside contributor (`wustwn`), not a CODEOWNER, and was merged by maintainer `wenyongh` (Intel) - evidence of a genuinely receptive contribution culture rather than a closed one.

Sources: [wasm-micro-runtime/wasm-micro-runtime](https://github.com/wasm-micro-runtime/wasm-micro-runtime), [TSC_Charter.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/TSC_Charter.md), [doc/port_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/port_wamr.md).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-04-28 | Issue #241, earliest recorded ask: "Do you have a plan to support riscv architecture?" | [Issue #241](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/241) |
| 2020-06-22 | Issue #290, feature request citing LLVM 9's new official RISC-V target as making a port feasible | [Issue #290](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/290) |
| 2021-01-25 | PR #505 merged: original RISC-V interpreter support (RISCV64/RISCV32), authored on branch `dev/riscv` by `wustwn`, merged by `wenyongh` | [PR #505](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/505) |
| 2021-06-07 | PR #648 merged: NuttX platform support for RISC-V-based chips | [PR #648](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/648) |
| 2021-07-22 | PR #649 merged: AOT codegen for RISC-V (LP64/LP64D riscv64, ILP32/ILP32D riscv32), primary author `no1wudi` (Huang Qi, Xiaomi), merged by `wenyongh` | [PR #649](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/649) |
| 2021-09-09 | PR #739: AOT intrinsics applied to riscv | [PR #739](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/739) |
| 2021-11-15 to 2021-11-20 | PR #834 / PR #841: reloc symbols and atomic/memset intrinsics for riscv | [PR #841](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/841) |
| 2023-04-20/26 | PR #2140: fix EMS allocator unaligned memory access on riscv64 (correctness bug), shipped in WAMR-1.2.2 | [PR #2140](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/2140) |
| 2023-06-24 to 2023-06-29 | Issues #2312/#2316 (spec test on NuttX broken) -> PR #2318, PR #2322 (relocation fixes), shipped in WAMR-1.2.3 | [Issue #2312](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/2312) |
| 2023-12-01/04 | PR #2843 merged: "Enable spectest on riscv64", shipped in WAMR-1.3.0 | [PR #2843](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/2843) |
| 2024-08-14 | PR #3708 merged: ILP32F (single-precision hardware float) ABI variant for riscv32 | [PR #3708](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/3708) |
| 2024-08-19 to 2024-09-24 | Issue #3731 (missing atomic symbols, riscv32 AOT multi-thread) -> PR #3812, merged | [PR #3812](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/3812) |
| 2024-09-09 | Issue #3776 opened by maintainer `yamt`: NuttX riscv spec-test CI job "failing frequently" - **still open, unresolved** | [Issue #3776](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3776) |
| 2025-05-02/06 | PR #4240 / PR #4248 merged: LLVM 19 riscv small-data section handling, avoid `llvm.cttz` for XIP | [PR #4248](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4248) |
| 2025-12-19 | Issue #4765 opened: "relocation fails on RISC-V AOT with opt level > 0" - **open, no maintainer response** | [Issue #4765](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4765) |
| 2026-01-02 | PR #4777 opened, marked **Draft**: fix for #4765 (PCREL HI20/LO12 relocation caching) - **open, awaiting review from 4 code owners, no review activity yet** | [PR #4777](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4777) |

**Key contributors and orgs:** `wustwn` (interpreter port, PR #505, no listed corporate affiliation found), `no1wudi` / Huang Qi (Xiaomi, AOT port PR #649, NuttX port owner), `wenyongh` (Intel, merged both foundational PRs), `yamt` / YAMAMOTO Takashi (Midokura, CODEOWNER, files and fixes most of the post-2023 relocation bugs, opened #3776, currently a requested reviewer on PR #4777).

**Is it fully upstream?** Yes for what exists: both foundational PRs (#505, #649) are merged into `main`, not held in a fork or downstream patch set. Of the 20 PRs matching the strict "riscv64" search, 19 are merged and only 1 (#3713, a CI-retry-count attempt) was closed without merging. However, the port is functionally incomplete relative to other tiers (see Sections 3, 4, 6): SIMD is disabled, there is no Fast-JIT backend, XIP AOT is unsupported, and an unresolved correctness bug currently affects the standard optimized AOT path (Section 11).

Sources: [PR #505](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/505), [PR #649](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/649), [PR merge-status research table](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pulls?q=riscv64).

## 3. Upstream Support Tier

WAMR publishes a formal, three-tier support policy in `doc/tiered_support.md`:

- **Tier A** ("fully supported, actively maintained, regularly CI-tested, production-ready"): only `aarch64-unknown-nuttx-eabi`, `i386-pc-linux-gnu`, `x86_64-pc-linux-gnu`, `x86_64-apple-darwin`, `x86_64-none-linux-gnu`.
- **Tier B** ("moderately supported, generally maintained but less attention"): `arc-unknown-none-elf`, `x86_64-pc-windows-msvc`, MIPS/MIPS64, Darwin/ESP-IDF/NuttX/SGX/Zephyr platform compatibility, LLVM JIT, tail-calls, stringref.
- **Tier C** ("experimental, foundational only, may lack active maintenance, minimal docs... production deployment requires specialized expertise... users accept full responsibility"): all three RISC-V targets (`riscv32-esp-elf`, `riscv32-unknown-elf`, `riscv64-unknown-elf`), plus iOS, bare ARM/i386, VxWorks, Android, FreeBSD, Cosmopolitan, Xtensa/ESP32, GC, exception handling, multi-memory, branch hints, Fast JIT.

This is upstream's own self-classification, not an inference from README marketing text, and it places riscv64 at the lowest of three explicitly defined support tiers.

| Target | Tier | CI-blocking | Release binaries |
|---|---|---|---|
| amd64 (`x86_64-pc-linux-gnu`, `x86_64-apple-darwin`, `x86_64-none-linux-gnu`) | A | Yes | Yes (GitHub Releases, per Section 8) |
| arm64 (`aarch64-unknown-nuttx-eabi` only) | A | Yes (NuttX variant) | Data not available: generic Linux aarch64 (non-NuttX) tier placement was not found in the tier document excerpt reviewed |
| riscv64 (`riscv64-unknown-elf`) | C | No (QEMU+NuttX job only, see Section 7) | No (Section 8) |

Source: [doc/tiered_support.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/tiered_support.md).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Two dedicated architecture files carry the riscv64 implementation:

**`core/iwasm/aot/arch/aot_reloc_riscv.c`** (549 lines). Implements `apply_relocation()`, `init_plt_table()`, `get_plt_item_size()`, `get_current_target()`, `get_target_symbol_map()` for the AOT ELF relocation resolver used by `wamrc`. Handles `R_RISCV_32`, `R_RISCV_64` (rv64 only), `R_RISCV_CALL`, `R_RISCV_CALL_PLT`, `R_RISCV_PCREL_HI20`, `R_RISCV_PCREL_LO12_I/S`, `R_RISCV_HI20`, `R_RISCV_LO12_I/S`, and builds an `auipc+ld+jr+nop` PLT stub for rv64. Uses feature-test macros `__riscv_flen`, `__riscv_xlen`, `__riscv_mul`/`__riscv_div`, `__riscv_atomic`, `__riscv_zifencei` (the last to select `fence.i` vs `fence` when patching relocated code for icache coherence). This is complete, production code, but currently carries the open correctness bug tracked as Issue #4765 (Section 11).

**`core/iwasm/common/arch/invokeNative_riscv.S`** (148 lines). Hand-written assembly trampoline marshaling `(func_ptr, argv, n_stacks)` into RV32/RV64 integer (`a0-a7`) and float (`fa0-fa7`) argument registers with 16-byte stack alignment. Selects register width via `__riscv_xlen` and float-ABI variant via `__riscv_float_abi_soft/single/double`. Notably has **no SIMD-aware counterpart**, unlike `invokeNative_aarch64_simd.s` and `invokeNative_em64_simd.*` on arm64/amd64.

**SIMD.** Wasm SIMD (`v128`) is **unconditionally disabled on RISCV64** by the build system: `build-scripts/config_common.cmake` forces `SIMD_ENABLED=0` for any `RISCV64.*` target regardless of the `-DWAMR_BUILD_SIMD=1` flag, documented explicitly in [doc/build_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/build_wamr.md) line 346: "On RISCV64 targets SIMD is silently disabled."

**RVV (RISC-V Vector extension).** A full-tree grep for `vfloat32m1_t`, `vint32m1_t`, `rvv`, `__riscv_v_intrinsic`, `zve32`, `zve64`, and the `+v` feature flag returned zero matches. There is no RVV intrinsics code anywhere in WAMR. `Zbb` appears exactly once, in a comment about LLVM's own codegen behavior (`aot_intrinsic.c:903`), not as WAMR-authored code; no `Zba`/`Zbc`/`Zbs` references exist at all.

**Fast-JIT.** `core/iwasm/fast-jit/cg/` contains only an `x86-64/` codegen backend. RISC-V has **no Fast-JIT backend at all**; RISC-V JIT compilation is delegated entirely to LLVM's ORC-JIT.

**XIP (execute-in-place) AOT.** Not fully supported on riscv64: CI explicitly excludes it ("XIP is not fully supported yet on RISCV64, some relocations can not be resolved" - `.github/workflows/spec_test_on_nuttx.yml`).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AOT relocation resolver | Full (x86-64 arch/) | Full (aarch64 arch/) | Full but with open correctness bug at opt-level>0 (`aot_reloc_riscv.c`, Issue #4765) |
| Native-call trampoline | Yes, with `_simd` variant | Yes, with `_simd` variant | Yes, **no `_simd` variant** |
| Fast-JIT backend | Yes (`fast-jit/cg/x86-64/`) | Data not available: no arm64 Fast-JIT backend directory was found in this research either; treat as likely absent | Absent |
| Wasm SIMD (`v128`) | Enabled | Enabled [NEEDS VERIFICATION - not directly confirmed in this research pass, inferred from SIMD being singled out as riscv64-only-disabled in build docs] | **Unconditionally disabled** |
| RVV vector intrinsics | N/A | N/A | None found anywhere in the codebase |
| XIP AOT mode | Supported | Supported [NEEDS VERIFICATION] | Not fully supported (relocation gap) |

Sources: [core/iwasm/aot/arch/aot_reloc_riscv.c](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/core/iwasm/aot/arch/aot_reloc_riscv.c), [core/iwasm/common/arch/invokeNative_riscv.S](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/core/iwasm/common/arch/invokeNative_riscv.S), [doc/build_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/build_wamr.md).

## 5. Build System, Cross-Compilation, and Toolchain

**No riscv64 CMake toolchain file and no riscv64 Dockerfile exist anywhere in the repository.** Confirmed by directory search: `cmake/riscv64.cmake` / `cmake/toolchain-riscv64.cmake` do not exist; none of the repo's 10 Dockerfiles reference riscv/riscv64.

**Target selection** (`doc/build_wamr.md`): supported `-DWAMR_BUILD_TARGET` values include `RISCV64`, `RISCV64_LP64D` (LP64 + hardware FP, FLEN=64, the default), `RISCV64_LP64` (integer-only ABI), and the riscv32 equivalents `RISCV32_ILP32D/ILP32F/ILP32`. On a native riscv64 host the build system auto-detects `CMAKE_SYSTEM_PROCESSOR STREQUAL "riscv64"` and sets `WAMR_BUILD_TARGET=RISCV64` automatically (root `CMakeLists.txt`, `build-scripts/runtime_lib.cmake`, `product-mini/platforms/linux/CMakeLists.txt`).

**Native build:**
```
cd product-mini/platforms/linux/
mkdir build && cd build
cmake ..
make
```

**Cross-compile (user must supply their own toolchain file - none is bundled):**
```
cmake .. -DCMAKE_TOOLCHAIN_FILE=$TOOL_CHAIN_FILE -DWAMR_BUILD_PLATFORM=linux -DWAMR_BUILD_TARGET=RISCV64
```

**`wamrc` AOT cross-compile flags** used by CI's own test script (`tests/wamr-test-suites/spec-test-script/runtest.py`):
```
wamrc --target=riscv64 --target-abi=lp64d --cpu=generic-rv64 \
      --cpu-features=+m,+a,+c,+f,+d --size-level=1 -o out.aot in.wasm
```
`--size-level=1` is required "because RISCV64 requires `-mcmodel=medany`," per an in-source comment.

**QEMU invocation** used for testing (`runtest.py`):
```
qemu-system-riscv64 -semihosting -M virt,aclint=on -cpu rv64 -smp 1 -nographic -bios none -kernel <firmware>
```

**Toolchain version requirements:**
- CMake >= 3.14, C99/C++17, generic across all targets.
- LLVM pinned to `llvmorg-18.1.8` for the AOT compiler backend (`build-scripts/build_llvm.py`), covering both riscv32 and riscv64 via the single LLVM `RISCV` target.
- LLVM >= 17.0.0 required specifically when `WAMR_BUILD_JIT=1` on GNU toolchains, "or LLVM JIT may run failed with `llvm_orc_registerEHFrameSectionWrapper` symbol not found error" - applies to riscv64 JIT builds same as any architecture.
- GCC >= 5.1 / Clang >= 7.0.0 gate an extra warning flag (`-Wincompatible-pointer-types`), a best-effort compatibility floor, not a hard build requirement.

**Known build/runtime failures specific to riscv64:**
- SIMD is silently forced off regardless of the build flag (Section 4).
- Fast-JIT is unsupported (build-system gated to X86_64/AMD_64 only).
- XIP AOT mode excluded from CI due to unresolved relocations.
- The optimized-AOT relocation bug, Issue #4765 (Section 11).
- Historical: users hit assembler errors ("mv", "ld", "addi", "jr" unrecognized) inside `invokeNative_riscv.S` when cross-compiling with mismatched toolchain flags (Issues #1830, #3466, both closed as user-error/toolchain-mismatch, not a WAMR bug).

Sources: [doc/build_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/build_wamr.md), [product-mini/README.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/product-mini/README.md), [build-scripts/build_llvm.py](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/build-scripts/build_llvm.py), [tests/wamr-test-suites/spec-test-script/runtest.py](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/tests/wamr-test-suites/spec-test-script/runtest.py).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Classic/fast interpreter | Yes | Yes | Yes |
| AOT (LLVM) | Yes | Yes | Yes, with an open correctness bug at opt-level>0 (Issue #4765) |
| LLVM ORC-JIT | Yes | Yes | Yes (requires LLVM >=17 for symbol export on GNU) |
| Fast-JIT | Yes | Data not available (no backend directory found for arm64 either) | **No** |
| Wasm SIMD (`v128`) | Yes | Yes [NEEDS VERIFICATION] | **No - unconditionally disabled** |
| XIP AOT | Yes | Yes [NEEDS VERIFICATION] | **Not fully supported** (excluded from CI) |
| Native Linux CI | Yes | Data not available for generic (non-NuttX) Linux aarch64 | **No** (NuttX+QEMU only) |
| Upstream release binaries | Yes | **No** (per Section 8, arm64 is also absent from GitHub Releases assets) | **No** |

**Functional gaps.** WASM programs compiled with SIMD instructions cannot run correctly on riscv64 builds of WAMR at all (the feature is compiled out), a hard functional gap versus amd64/arm64, not merely a performance one. Fast-JIT mode is entirely unavailable, forcing riscv64 users onto interpreter or LLVM-AOT/JIT only. XIP AOT (used for flash-constrained embedded deployment, a core WAMR use case) does not fully work on riscv64.

**Performance gap from missing SIMD/RVV.** With SIMD disabled and no RVV intrinsics anywhere in the codebase, any wasm module using the SIMD proposal cannot execute at all on riscv64 (functional gap above); more generally, there is no vector-accelerated codegen path for riscv64 - all vectorizable workloads fall back to scalar LLVM-generated code, with actual instruction selection left entirely to LLVM's own RISC-V backend rather than any WAMR-authored optimization.

**Security hardening gaps.** Data not available: no riscv64-specific hardening documentation (CFI, stack protector, pointer authentication equivalents) was found or searched for directly in this research pass.

**NaN / floating-point semantics issues.** Issue #3776 (open, unresolved since 2024-09-09) documents a concrete floating-point correctness discrepancy specific to riscv32 under the ILP32F ABI in NuttX CI: an `f64` constant of `-1.797693e+308` (near `-DBL_MAX`) is returned as `-inf` in `const`/`call_indirect` spec tests. The issue is filed and tracked as CI flakiness, not root-caused as a specific instruction-selection bug, and remains open with no fix landed.

Sources: [doc/build_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/build_wamr.md), [Issue #3776](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3776), [Issue #4765](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4765).

## 7. CI/CD Infrastructure

A full grep of all 27 files in `.github/workflows/` (case-insensitive, for "riscv") plus confirmation that no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repo, found riscv references in exactly 5 workflow files, falling into two categories, neither of which is native-Linux riscv64 execution:

**1. LLVM cross-compilation target list (not a runner architecture).** `compilation_on_windows.yml`, `release_process.yml`, `ci_cache_warmup.yml` pass `RISCV` as one of several `-DLLVM_TARGETS_TO_BUILD` code-generation backends when building the LLVM library WAMR depends on. These jobs run on `windows-2022`, `ubuntu-22.04`, or `macos-15-intel` - they build a cross-compiler, they do not run or test anything on riscv64. In `ci_cache_warmup.yml` the RISCV/AArch64/Xtensa NuttX cache-warming matrix entries are explicitly **commented out**; only the plain X86 entry is active.

**2. Embedded NuttX targets emulated under QEMU (bare-metal riscv32/riscv64 NuttX boards, run on an x86 host).**
- `spec_test_on_nuttx.yml`: matrix includes `riscv32` (board `nsh`) and `riscv64` (board `nsh64`), job `spec_test_on_qemu` runs **on `ubuntu-22.04`**, invoking `qemu-system-riscv64`/`qemu-system-riscv32` to emulate the board and execute the wasm spec test suite in **AOT mode only** (interpreter modes are commented out of the matrix; XIP is excluded for riscv64 due to unresolved relocations). Triggers: fork push, `pull_request_review: submitted`, `pull_request: synchronize`, daily schedule, manual dispatch.
- `compilation_on_nuttx.yml`: builds (does not execute) NuttX+WAMR for the same riscv32/riscv64 boards on `ubuntu-latest`, via `docker run` against a NuttX CI container image, plus a `bloaty` size report.

**What is absent.** `compilation_on_ubuntu.yml` - the main Linux compile/cross-compile matrix that does exercise other cross-compiled architectures - has **zero riscv references**; riscv64 is not one of its cross-compiled targets. No workflow uses `runs-on: [self-hosted, riscv64]`, no `docker buildx --platform linux/riscv64` exists, and no RISE RISC-V Runner is referenced anywhere in the workflow files.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native-hardware or native-cloud CI | Yes (`ubuntu-22.04`, `windows-2022`, `macos-15-intel` runners) | Data not available: no arm64-specific native CI job was identified in this research pass | **No** |
| Tests executed at all | Yes | Data not available | Yes, but only under NuttX+QEMU, AOT-only, and documented as failing frequently (Issue #3776) |
| RISE RISC-V Runners used | N/A | N/A | **No** - zero references found in workflow files, RISE blog, or RISE GitHub org |
| Release-blocking | Yes (implied by shipped x86_64 binaries) | No (no arm64 release binaries either, Section 8) | No |

Sources: [.github/workflows/spec_test_on_nuttx.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/spec_test_on_nuttx.yml), [.github/workflows/compilation_on_nuttx.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/compilation_on_nuttx.yml), [.github/workflows/compilation_on_ubuntu.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/compilation_on_ubuntu.yml), [.github/workflows/release_process.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/release_process.yml).

## 8. Distribution and Release Status

**GitHub Releases.** The 21-asset list for the latest release (WAMR-2.4.5) contains `iwasm-2.4.5-x86_64-{macos-15-intel,ubuntu-22.04,windows-2022}.{tar.gz,zip}`, `iwasm-gc-eh-2.4.5-x86_64-*`, `wamrc-*` compiler archives, `wamr-wasi-extensions`, and source archives. **No asset filename contains "riscv" or "riscv64" - and none contains "arm64"/"aarch64" either.** All prebuilt binaries across the last 5 releases checked (WAMR-2.4.1 through 2.4.5) are x86_64-only.

**PyPI.** No package named `wamr` exists (`https://pypi.org/pypi/wamr/json` returns 404, confirmed again via `https://pypi.org/simple/wamr/`).

**RISE GitLab wheel builder.** The project's `wamr` PyPI-mirror endpoint 302-redirects to the (nonexistent) real PyPI page - no package registered.

**Ubuntu.** No package named `wamr`, `python3-wamr`, or `libwamr` exists in Ubuntu 26.04 (resolute) for **any** architecture, not just riscv64 - the package search returns no results at all.

**Debian/Fedora/Arch.** Data not available: not directly queried in this research pass; given the Ubuntu-wide absence, a distro package is unlikely to exist elsewhere but this was not independently confirmed.

**What a user must do to get a working riscv64 binary today:** build from source. There is no bundled riscv64 CMake toolchain file and no riscv64 Dockerfile (Section 5), so the user must supply their own cross-toolchain and invoke CMake manually, or run under NuttX+QEMU using the same container images CI uses.

Sources: [WAMR-2.4.5 release page](https://github.com/wasm-micro-runtime/wasm-micro-runtime/releases/tag/WAMR-2.4.5), [PyPI wamr/json](https://pypi.org/pypi/wamr/json), [Ubuntu package search](https://packages.ubuntu.com/search?keywords=WAMR&suite=resolute&searchon=names&section=all).

## 9. Dependencies

WAMR has no single lockfile; dependencies are pulled via CMake `FetchContent`/`ExternalProject_Add` across `build-scripts/*.cmake` and per-library `.cmake` files.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| LLVM (`llvm/llvm-project`) | AOT/JIT compiler backend | Ubuntu 26.04 resolute ships LLVM 17-22 for riscv64, **built from source** [reference: separate project-reports/llvm.md entry, not a graph query this session] | Only `libc/**` changes get riscv64 QEMU CI in LLVM itself; the RISC-V codegen backend is not exercised by LLVM's own pre-merge gate | No upstream riscv64 LLVM binaries in last 5 releases checked | Pinned to `llvmorg-18.1.8` by WAMR's own build script |
| asmjit | JIT code emitter for Fast-JIT | N/A | **Never invoked for riscv64** - `iwasm_fast_jit.cmake` gates the entire asmjit fetch behind `WAMR_BUILD_TARGET STREQUAL "X86_64" OR "AMD_64"` | N/A | This is a WAMR-side integration gap, not an asmjit defect: asmjit itself closed RISC-V porting as complete ([asmjit#393](https://github.com/asmjit/asmjit/issues/393), [asmjit#479](https://github.com/asmjit/asmjit/issues/479)), but WAMR has no open work wiring riscv64 into Fast-JIT |
| simde (`simd-everywhere/simde`) | Header-only SIMD emulation, implements Wasm SIMD ops on non-x86/ARM | Portable C fallback compiles | Functional but unaccelerated; RVV-native paths not yet implemented ([simde#1087](https://github.com/simd-everywhere/simde/issues/1087), open) | Header-only, no releases; WAMR pins v0.8.2 | Currently moot for WAMR since SIMD is disabled at the WAMR level on riscv64 regardless of simde's own state (Section 4) |
| BoringSSL | Optional AOT wasm-cache signing (`WAMR_BUILD_WASM_CACHE`, off by default) | Ubuntu/Debian ship only `android-libboringssl` (the Android fork) for riscv64, not vanilla BoringSSL [reference: project-reports/boringssl.md] | No riscv64-specific issues found | No upstream binaries for any arch (source-only project) | Not correctness-blocking; feature is off by default |
| libuv | Async I/O for `libc-wasi` (WASI syscalls), on by default | Data not available via graph query this session | No riscv64-specific open issues found (4 loosely related hits: ppc64le io_uring crash, RPi blacklist, flaky test, QNX port) | Source-only releases | Pinned `v1.51.0` via FetchContent |
| uvwasi | WASI syscall surface over libuv | Data not available | Zero issues matched "riscv64" - architecture-agnostic pure C, but also essentially untested for riscv64 specifically | Source-only | Lowest-confidence dependency row given zero direct signal either way |
| zydis + zycore-c | x86-64 instruction decoder (Fast-JIT dump, Windows-x86_64 AOT disassembly) | N/A - architecturally inapplicable | N/A | N/A | Never reached on a RISCV64 build regardless of zydis's own portability |
| librats | Remote-attestation/TEE (`WASM_ENABLE_LIB_RATS`, optional) | N/A | N/A | N/A | Hard-requires Intel SGX SSL (`SGX_SSL_DIR`), an x86-64-only enclave technology under WAMR's current CMake wiring |

**Deep dive: LLVM RISC-V backend.** WAMR's AOT/JIT tiers depend entirely on LLVM's own RISC-V code generation, which is not itself exercised by LLVM's required pre-merge CI gate (only `libc/**` changes trigger a riscv64 QEMU job in LLVM). Two open, general (not WAMR-specific) LLVM RISC-V codegen issues exist: [llvm-project#208549](https://github.com/llvm/llvm-project/issues/208549) (RV64 byte-load codegen) and [llvm-project#221163](https://github.com/llvm/llvm-project/issues/221163) (RVV loop-carried WAR hazard) - neither confirmed to affect WAMR specifically, but they indicate the underlying compiler's RISC-V backend itself carries open correctness/quality gaps that WAMR inherits transitively.

**Deep dive: simde / RVV.** simde is the only dependency with a direct line to RISC-V vector performance, and it does not yet have RVV-native code paths ([simde#1087](https://github.com/simd-everywhere/simde/issues/1087) open, plus [simde#1352](https://github.com/simd-everywhere/simde/issues/1352) and [simde#1145](https://github.com/simd-everywhere/simde/issues/1145)). This is currently moot because WAMR disables SIMD entirely on riscv64 at its own build-system level (Section 4) - even if simde gained RVV support today, WAMR would not invoke it without a separate upstream change to re-enable `WAMR_BUILD_SIMD` for riscv64.

Sources: [build-scripts/runtime_lib.cmake](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/build-scripts/runtime_lib.cmake), [core/iwasm/fast-jit/iwasm_fast_jit.cmake](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/core/iwasm/fast-jit/iwasm_fast_jit.cmake), [simde issue #1087](https://github.com/simd-everywhere/simde/issues/1087), [llvm-project issue #208549](https://github.com/llvm/llvm-project/issues/208549).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4765](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4765) | Relocation fails on RISC-V AOT with opt level > 0 | **Open** | **Correctness / runtime crash** | `wamrc`-compiled riscv64 AOT modules fail to load at runtime with "relocation truncated to fit R_RISCV_PCREL_LO12_I failed" whenever optimization is enabled; `--opt-level=0` avoids it. Fix drafted in PR #4777 but not merged, sitting in Draft with no review activity from the 4 requested code owners (loganek, lum1n0us, TianlongLiang, yamt) |
| [#3776](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3776) | CI: "spec test on nuttx" riscv job is failing frequently | **Open** since 2024-09-09 | CI reliability / possible FP correctness | Intermittent failures on `const`/`call_indirect` tests under ILP32F, including one captured f64-to-`-inf` discrepancy; unowned, no fix landed in over a year |
| [#4051](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4051) | AOT Zephyr support | Open | Support question, not a confirmed bug | Asks why AOT works on `qemu_riscv32` under Zephyr but not ESP32-C3 |
| [#3731](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3731) | AOT module load failed: resolve symbol `__atomic_compare_exchange_4` failed | Closed | Fixed | Resolved by PR #3812 |
| [#3466](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3466) / [#1830](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/1830) | Cross-compile toolchain/assembler mismatch questions | Closed | User/toolchain error | Not a WAMR defect |
| [#2312](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/2312) / [#2316](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/2316) | NuttX spec test broken / stack_sizes lookup | Closed | Fixed | Resolved by PR #2318, PR #2322 |

**Correctness bugs highlighted separately:** #4765 (open, unresolved, affects the default/optimized AOT compilation path most production deployments would use) and the embedded f64/-inf discrepancy inside #3776 (open, unresolved, filed as CI flakiness rather than root-caused).

Sources: [Issue #4765](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4765), [PR #4777](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4777), [Issue #3776](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3776).

## 12. Objections and Upstream Blockers

**Stated objections.** None found. No maintainer or CODEOWNER statement was located declaring riscv64 support unwanted, deprioritized, or intentionally limited; the opposite is documented, a formal onramp for new ports exists (`doc/port_wamr.md`) and the RISC-V port itself was accepted from an outside contributor.

**Technical blockers.**
- PR #4777 (fix for the open relocation-correctness bug #4765) is stalled in Draft status awaiting review from 4 named code owners, with no review comments recorded as of this research.
- Issue #3776 (flaky NuttX riscv CI) has been open over a year with no assignee and no proposed fix in-thread.
- SIMD/RVV re-enablement has no open PR or issue found addressing it; simde's own RVV backend is itself still unimplemented upstream ([simde#1087](https://github.com/simd-everywhere/simde/issues/1087)), so even a WAMR-side change today would fall back to simde's scalar path.
- Fast-JIT riscv64 backend has no open PR or issue found; asmjit (the JIT emitter WAMR's Fast-JIT tier depends on) has already closed its own RISC-V port as complete, so the remaining work is WAMR-side integration, not a third-party blocker.

**Organizational blockers.** None identified specifically. The TSC's Lazy Consensus / small-PR culture (Section 1) suggests incremental riscv64 fixes (of the kind seen in the 19 merged riscv64-tagged PRs) continue to be accepted readily; there is no evidence of organizational resistance, only a lack of dedicated resourcing/review bandwidth for the currently open riscv64 work.

**RISE involvement.** None. Confirmed absent from all 34 RISE blog posts (sitemap and native site-search both return zero results for "WAMR"), the `riseproject-dev` GitHub org's 25 repositories, and the RISE Python wheel builder's 79-package list. `wasm-micro-runtime`/Bytecode Alliance also does not appear among RISE's Premier or General members.

**Acceptance probability.** High for continued small, incremental community-submitted fixes, consistent with the project's history and stated contribution norms. Low, absent new resourcing, for near-term graduation to Tier A/B: that would require closing the SIMD gap, adding a Fast-JIT backend, resolving the open correctness bug, stabilizing NuttX CI, and adding native-Linux riscv64 CI and release binaries, none of which currently has a funded or assigned owner.

Sources: [doc/port_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/port_wamr.md), [PR #4777](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4777), [riseproject.dev blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml), [riseproject-dev GitHub org](https://github.com/riseproject-dev).

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci-equivalent: CI builds riscv32/riscv64 and does execute the spec test suite, but only via NuttX RTOS under QEMU, in AOT mode only, with XIP excluded, and the job itself is documented by a maintainer as "failing frequently" in an open, unresolved issue)
- **Release provider:** none (no upstream, RISE, or distro-provided riscv64 binary release exists for WAMR)
- **Optimization gap:** N/A - WAMR is a general-purpose WebAssembly language runtime, not a project whose sole value proposition is beating a reference implementation on speed; per the color-coding model's own criteria, general-purpose language runtimes do not trigger the Step 2 optimization modifier.
- **Justification:** Upstream's own [tiered support policy](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/tiered_support.md) classifies all riscv64 targets as "Tier C (experimental)... production deployment requires specialized expertise... users accept full responsibility," the lowest of three defined tiers, while x86_64 targets sit in Tier A ("fully supported... regularly CI-tested, production-ready"). The only CI that builds and executes riscv64 code is [`spec_test_on_nuttx.yml`](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/spec_test_on_nuttx.yml), which runs on an x86 host via `qemu-system-riscv64` against a bare-metal NuttX board, in AOT mode only, with XIP excluded, and is the subject of an open, maintainer-filed, unresolved reliability report ([Issue #3776](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3776)). No native-Linux riscv64 CI lane exists at all, and no riscv64 release binary is published by any channel ([WAMR-2.4.5 assets](https://github.com/wasm-micro-runtime/wasm-micro-runtime/releases/tag/WAMR-2.4.5)). A further unresolved correctness bug ([Issue #4765](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4765)) causes AOT relocation failures at runtime whenever the optimization level is raised above 0, directly affecting the standard production compilation path.
- **Pending work that could change the grade:** [PR #4777](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4777) (drafted fix for #4765, awaiting code-owner review) would resolve the most severe open correctness issue if merged and validated. A fix for the flaky NuttX CI job (#3776) has no owner or open PR. No RISE involvement or funded work targeting WAMR was found in any channel checked.

## 14. Investment Analysis

RISE has done no work on WAMR (Section 12) - none of the estimates below can be offset against existing RISE funding or infrastructure.

### 14.1 Functional Enablement
- Review, harden, and merge PR #4777 (relocation correctness fix for opt-level>0 AOT), including validation against the reported repro in Issue #4765.
- Root-cause and fix the flaky NuttX riscv CI job (#3776), including the observed f64/-inf discrepancy.
- Investigate and close the XIP-on-riscv64 relocation gap that currently excludes XIP from CI.

### 14.2 Performance Optimization
- Re-enable Wasm SIMD on riscv64: currently unconditionally disabled at the WAMR build-system level; requires both a WAMR-side change to stop forcing `SIMD_ENABLED=0` and confirmation that simde's scalar fallback is acceptable, since simde has no RVV-native backend yet ([simde#1087](https://github.com/simd-everywhere/simde/issues/1087) still open upstream).
- Add a Fast-JIT riscv64 codegen backend in `core/iwasm/fast-jit/cg/riscv64/`. The underlying JIT emitter, asmjit, already has a completed riscv64 port upstream ([asmjit#393](https://github.com/asmjit/asmjit/issues/393)), so this is WAMR-side integration work, not a third-party blocker.
- Evaluate RVV-accelerated code paths for AOT/interpreter hot paths; none exist today anywhere in the codebase.

### 14.3 CI/CD Infrastructure
- Add a native-Linux riscv64 CI lane to `compilation_on_ubuntu.yml` (currently has zero riscv references), ideally using free native riscv64 CI capacity such as RISE's RISC-V Runners service, which WAMR does not currently use.
- Add riscv64 to the interpreter-mode test matrix in `spec_test_on_nuttx.yml` (currently AOT-only; classic/fast-interpreter modes are commented out).

### 14.4 Ecosystem Enablement
- Publish riscv64 binaries in GitHub Releases (currently x86_64-only across all recent releases).
- Package WAMR for at least one major distro (currently absent from Ubuntu for any architecture, not just riscv64, so this is a broader packaging gap, not riscv64-specific).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review/merge/harden PR #4777 (relocation correctness fix) | 1-2 | Upstream code owners (loganek, lum1n0us, TianlongLiang, yamt) plus contributor validation | Critical |
| Functional | Root-cause and fix flaky NuttX riscv CI (#3776) | 1-3 | Unassigned upstream / contributor | High |
| Functional | Close XIP-on-riscv64 relocation gap | 2-4 | Contributor, needs AOT relocation expertise | Medium |
| Performance | Re-enable and validate Wasm SIMD on riscv64 (scalar simde fallback) | 3-5 | Contributor | Medium |
| Performance | RVV-native simde backend (upstream simde work, prerequisite for accelerated SIMD) | 8-12 | simde upstream (external dependency) | Medium |
| Performance | Fast-JIT riscv64 backend (asmjit already supports riscv64) | 4-8 | Contributor | Medium |
| CI/CD | Native-Linux riscv64 CI lane in `compilation_on_ubuntu.yml` | 1-2 | Contributor, possibly using RISE runners | High |
| CI/CD | Enable interpreter-mode riscv tests in `spec_test_on_nuttx.yml` | 1 | Contributor | Medium |
| Ecosystem | Publish riscv64 GitHub Release binaries | 1-2 | Upstream release maintainers | High |
| Ecosystem | Distro packaging (Ubuntu/Debian, all architectures currently absent) | 3-6 | Contributor / distro maintainers | Low |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [wasm-micro-runtime/wasm-micro-runtime (repo)](https://github.com/wasm-micro-runtime/wasm-micro-runtime)
- [TSC_Charter.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/TSC_Charter.md)
- [doc/port_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/port_wamr.md)
- [doc/tiered_support.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/tiered_support.md)
- [doc/build_wamr.md](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/doc/build_wamr.md)
- [core/iwasm/aot/arch/aot_reloc_riscv.c](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/core/iwasm/aot/arch/aot_reloc_riscv.c)
- [core/iwasm/common/arch/invokeNative_riscv.S](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/core/iwasm/common/arch/invokeNative_riscv.S)
- [core/iwasm/fast-jit/iwasm_fast_jit.cmake](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/core/iwasm/fast-jit/iwasm_fast_jit.cmake)
- [build-scripts/build_llvm.py](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/build-scripts/build_llvm.py)
- [tests/wamr-test-suites/spec-test-script/runtest.py](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/tests/wamr-test-suites/spec-test-script/runtest.py)
- [.github/workflows/spec_test_on_nuttx.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/spec_test_on_nuttx.yml)
- [.github/workflows/compilation_on_nuttx.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/compilation_on_nuttx.yml)
- [.github/workflows/compilation_on_ubuntu.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/compilation_on_ubuntu.yml)
- [.github/workflows/release_process.yml](https://github.com/wasm-micro-runtime/wasm-micro-runtime/blob/main/.github/workflows/release_process.yml)
- [Issue #241](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/241)
- [Issue #290](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/290)
- [Issue #1830](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/1830)
- [Issue #2312](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/2312)
- [Issue #2316](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/2316)
- [Issue #3466](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3466)
- [Issue #3731](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3731)
- [Issue #3776](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/3776)
- [Issue #4051](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4051)
- [Issue #4765](https://github.com/wasm-micro-runtime/wasm-micro-runtime/issues/4765)
- [PR #505](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/505)
- [PR #648](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/648)
- [PR #649](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/649)
- [PR #739](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/739)
- [PR #841](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/841)
- [PR #2140](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/2140)
- [PR #2318](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/2318)
- [PR #2322](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/2322)
- [PR #2843](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/2843)
- [PR #3708](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/3708)
- [PR #3812](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/3812)
- [PR #4248](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4248)
- [PR #4777](https://github.com/wasm-micro-runtime/wasm-micro-runtime/pull/4777)
- [WAMR-2.4.5 release assets](https://github.com/wasm-micro-runtime/wasm-micro-runtime/releases/tag/WAMR-2.4.5)
- [PyPI wamr/json (404)](https://pypi.org/pypi/wamr/json)
- [Ubuntu 26.04 package search for WAMR (no results)](https://packages.ubuntu.com/search?keywords=WAMR&suite=resolute&searchon=names&section=all)
- [bytecodealliance.org/projects](https://bytecodealliance.org/projects)
- [riseproject.dev blog post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [riseproject-dev GitHub org](https://github.com/riseproject-dev)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [asmjit issue #393 (RISC-V port)](https://github.com/asmjit/asmjit/issues/393)
- [asmjit issue #479](https://github.com/asmjit/asmjit/issues/479)
- [simde issue #1087 (RVV intrinsics)](https://github.com/simd-everywhere/simde/issues/1087)
- [llvm-project issue #208549](https://github.com/llvm/llvm-project/issues/208549)
- [llvm-project issue #221163](https://github.com/llvm/llvm-project/issues/221163)
- Sangeeta Kakati and Mats Brorsson, "A Cross-Architecture Evaluation of WebAssembly in the Cloud-Edge Continuum," IEEE CCGrid 2024, [IEEE Xplore](https://ieeexplore.ieee.org/document/10701368/)
