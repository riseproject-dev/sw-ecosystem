---
title: llama.cpp
parent: Project Reports
categories:
  - llm-inference
  - ai-ml
---

# llama.cpp

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for llama.cpp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[llama.cpp](https://github.com/ggerganov/llama.cpp) is a C/C++ LLM inference engine built around the GGML tensor library. It is the dominant open-source CPU inference stack for large language models, supporting quantized weight formats (q4_0 through q8_0, K-quants, and newer formats including nvfp4), multiple hardware backends (CPU, CUDA, Vulkan, Metal, ROCm, OpenCL, Ascend NPU, IBM zDNN), and a wide model format ecosystem via GGUF.

The project is hosted under the [ggml-org](https://github.com/ggml-org) GitHub organization, founded by Georgi Gerganov (Hugging Face). It is MIT-licensed. Governance is informal: no foundation membership, no technical steering committee. Maintainers are ggml-org org members who can merge after codeowner approval. The `CODEOWNERS` file is the only governance instrument.

Key corporate presences: Hugging Face (Gerganov, Nguyen, Bevenius), SpacemiT (alex-spacemit, owns `ggml/src/ggml-cpu/spacemit/`), NVIDIA (jeffbolznv, Vulkan backend), IBM (AndreasKrebbel, zDNN backend). No corporate entity has governance rights; all influence is through individual contribution and CODEOWNERS entries.

The project is not a RISE Project member organization. The RISE project page lists no affiliation with llama.cpp or ggml-org. RISE's connection is indirect: RISE TSC Co-Chair Ludovic Henry (Meta) bootstrapped RISC-V outreach to the project under RISE funded project RP-014, and RISE provides CI runner infrastructure.

---

## 2. Port History and Upstreaming Timeline

The following table covers all confirmed merged RISC-V PRs in chronological order, based on direct examination of the GitHub PR history.

| Date | PR | Merge Commit | Contributor | Affiliation | First Release | Change |
|---|---|---|---|---|---|---|
| 2023-05-27 | [#1616](https://github.com/ggerganov/llama.cpp/pull/1616) | a6704643 | apcameron | individual | n/a | Wrap `#include <immintrin.h>` in platform guard; enables compilation on RISC-V. No optimization. |
| 2023-09-01 | [#2929](https://github.com/ggerganov/llama.cpp/pull/2929) | 5aec2cfa | Tameem-10xE | 10xEngineers | n/a | RVV dot-product intrinsics for q4_0, q4_1, q5_0, q5_1, q8_0; Makefile cross-compile flags. Tested via qemu-riscv64. |
| 2023-10-03 | [#3453](https://github.com/ggerganov/llama.cpp/pull/3453) | 79f34ab | (see PR) | (see PR) | b1311 | RVV intrinsics for all K-quant dot products and quantize_row. 6-7x over scalar on 8-core VLEN=256 board. Known correctness bug: garbled output with VLEN > 256. |
| 2024-07-29 | [#8748](https://github.com/ggerganov/llama.cpp/pull/8748) | 75af08c | CarterLi999 | individual | b3486 | Fix inactive-element masking: switched from agnostic to undisturbed policy in RVV intrinsics. |
| 2024-09-12 | [#9442](https://github.com/ggerganov/llama.cpp/pull/9442) | 2b00fa7 | Tameem-10xE | 10xEngineers | b3735 | Makefile RISCV_VECT flag and vector logging. |
| 2025-03-27 | [#12530](https://github.com/ggerganov/llama.cpp/pull/12530) | 24feaec | xctan | individual | b4967 | 128-bit VLEN RVV support; runtime VLEN dispatch; Zfhmin FP16 conversion. pp512 3.18 -> 27.19 t/s (8.5x) on 64-core rv64gcv. Required inline assembly for K-quant kernels due to GCC 14.2 register spill with intrinsics. |
| 2025-05-27 | [#13720](https://github.com/ggerganov/llama.cpp/pull/13720) | 05f6ac6 | xctan | individual | b5502 | xtheadvector (T-Head RVV v0.7.1) support; K-quant acceleration for SG2042. pp512 3.35 -> 15.73 t/s (4.7x) on SG2042 32-thread. |
| 2025-08-13 | [#14439](https://github.com/ggerganov/llama.cpp/pull/14439) | 648ebcd | alitariq4589 | 10xEngineers / Cloud-V | b6150 | Native RISC-V CI via Banana Pi BPI-F3 self-hosted runner at cloud-v.co (later migrated to RISE runners). |
| 2025-08-27 | [#15057](https://github.com/ggerganov/llama.cpp/pull/15057) | 1cf123a | (see PR) | (see PR) | b6295 | Basic RVV support for float32 vector operations. |
| 2025-09-03 | [#15720](https://github.com/ggerganov/llama.cpp/pull/15720) | 05c0380 | xctan | individual | b6362 | RVV kernel performance improvements. |
| 2025-09-29 | [#15288](https://github.com/ggerganov/llama.cpp/pull/15288) | b77e6c1 | alex-spacemit | SpacemiT | b6621 | SpacemiT-specific backend using proprietary IME instructions (vmadot, vfwmadot, vmadot1). Q4_0 on SpacemiT X60 4-thread: 64.12 t/s pp512 / 10.03 t/s tg128 for Qwen2.5 0.5B. Requires non-upstream Bianbu binutils. |
| 2025-10-17 | [#16629](https://github.com/ggerganov/llama.cpp/pull/16629) | 342c728 | (see PR) | (see PR) | b6790 | Bug fix: out-of-bounds array access in SpacemiT IME task scheduler. |
| 2025-11-06 | [#16887](https://github.com/ggerganov/llama.cpp/pull/16887) | 7f09a68 | (see PR) | (see PR) | b6963 | Performance: Q2_K and Q3_K RVV dot-product kernel optimizations. |
| 2025-11-11 | [#17161](https://github.com/ggerganov/llama.cpp/pull/17161) | (see PR) | (see PR) | (see PR) | n/a | Zvfh-accelerated FP16-to-FP32 conversion kernels. |
| 2025-11-14 | [#17259](https://github.com/ggerganov/llama.cpp/pull/17259) | (see PR) | (see PR) | (see PR) | n/a | README: document supported RISC-V ISA extensions (RVV, ZVFH, ZFH, ZICBOP). |
| 2025-11-20 | [#17314](https://github.com/ggerganov/llama.cpp/pull/17314) | (see PR) | (see PR) | (see PR) | n/a | Zvfh-accelerated FP16 vector scaling. |
| 2025-11-24 | [#17461](https://github.com/ggerganov/llama.cpp/pull/17461) | (see PR) | ixgbe | individual | n/a | Runtime CPU feature detection; GGML_CPU_ALL_VARIANTS builds libggml-cpu-riscv64_0.so and libggml-cpu-riscv64_v.so. Initial implementation used AT_HWCAP -- broken (see PR #17567). |
| 2025-11-29 | [#17567](https://github.com/ggerganov/llama.cpp/pull/17567) | 8f77a08 | ixgbe | individual | n/a | Replace AT_HWCAP with riscv_hwprobe syscall for RVV detection; fixes false-positive on boards reporting RVV v0.7 as v1.0. Requires Linux >= 6.5. |
| 2025-12-02 | [#16682](https://github.com/ggerganov/llama.cpp/pull/16682) | 6a38407 | (see PR) | (see PR) | b7222 | Test coverage validated on RVV 1.0 hardware. |
| 2025-12-18 | [#17318](https://github.com/ggerganov/llama.cpp/pull/17318) | (see PR) | (see PR) | (see PR) | n/a | Extended RVV coverage to additional floating-point operations. |
| 2025-12-22 | [#18199](https://github.com/ggerganov/llama.cpp/pull/18199) | (see PR) | (see PR) | (see PR) | n/a | RVV-accelerated SGEMM kernels in the llamafile layer. |
| 2026-01-19 | [#18784](https://github.com/ggerganov/llama.cpp/pull/18784) | (see PR) | (see PR) | (see PR) | n/a | RVV vec dot kernels for additional quantization types. |
| 2026-03-10 | [#19121](https://github.com/ggerganov/llama.cpp/pull/19121) | (see PR) | (see PR) | (see PR) | n/a | Repack-based RVV GEMM and GEMV kernels for quantized formats. |
| 2026-03-13 | [#18859](https://github.com/ggerganov/llama.cpp/pull/18859) | (see PR) | (see PR) | (see PR) | n/a | Further RVV vec dot kernels for quantization types. |
| 2026-03-17 | [#20682](https://github.com/ggerganov/llama.cpp/pull/20682) | (see PR) | (see PR) | (see PR) | n/a | Fix incorrect RVV feature-check logic in quantization and repacking dispatch. |
| 2026-03-26 | [#20888](https://github.com/ggerganov/llama.cpp/pull/20888) | (see PR) | (see PR) | (see PR) | n/a | CMake fix: canonical ISA string ordering for RVV extensions. |
| 2026-04-01 | [#21157](https://github.com/ggerganov/llama.cpp/pull/21157) | (see PR) | (see PR) | (see PR) | n/a | Fix fallback path when Zvfh extension is absent. |
| 2026-04-05 | [#21263](https://github.com/ggerganov/llama.cpp/pull/21263) | (see PR) | (see PR) | (see PR) | n/a | Migrate CI from cloud-v.co self-hosted runners to RISE Project public riscv64 GitHub Actions runners. |
| 2026-04-16 | [#20627](https://github.com/ggerganov/llama.cpp/pull/20627) | 5637536 | rehan-10xengineer | 10xEngineers | n/a | SIMD-GEMM implementation using RVV intrinsics. Flash attention benchmark: 2.69 -> 22.75 GFLOPS (8.5x) at 128 tokens on BPI-F3. |
| 2026-04-16 | [#20633](https://github.com/ggerganov/llama.cpp/pull/20633) | (see PR) | (see PR) | (see PR) | n/a | 128-bit RVV quantization vector dot product implementations for low-VLEN cores. |
| 2026-04-16 | [#21632](https://github.com/ggerganov/llama.cpp/pull/21632) | (see PR) | (see PR) | (see PR) | n/a | Enable ccache on riscv64 CI builds. |
| 2026-04-29 | [#22317](https://github.com/ggerganov/llama.cpp/pull/22317) | (see PR) | (see PR) | (see PR) | n/a | CMake: append xsmtvdotii march flag for SpacemiT IME. |
| 2026-05-07 | [#22768](https://github.com/ggerganov/llama.cpp/pull/22768) | (see PR) | (see PR) | (see PR) | n/a | Optimized RVV Q1_0 vec dot. Bonsai-1.7B on OrangePi RV2 8-thread: scalar 1.19 t/s pp64 -> RVV VL256 13.36 t/s (11.2x). |
| 2026-05-14 | [#22863](https://github.com/ggerganov/llama.cpp/pull/22863) | (see PR) | alex-spacemit | SpacemiT | n/a | SpacemiT IME2 instruction support. SpacemiT A100 (VLEN=1024): Qwen3 0.6B Q4_0 565.83 t/s pp128. |
| 2026-05-25 | [#23642](https://github.com/ggerganov/llama.cpp/pull/23642) | (see PR) | (see PR) | (see PR) | n/a | Update SpacemiT toolchain CI download URL (upstream URL changed). |
| 2026-05-26 | [#23705](https://github.com/ggerganov/llama.cpp/pull/23705) | (see PR) | (see PR) | (see PR) | n/a | Disable SYCL and CANN CI builds; tangential riscv64 CI matrix effect. |
| 2026-06-04 | [#22754](https://github.com/ggerganov/llama.cpp/pull/22754) | (see PR) | (see PR) | (see PR) | n/a | Extend RVV quantization vec dot to VLEN > 128-bit. |

**Observation:** The rate of merged RISC-V PRs has accelerated sharply. Roughly 4 PRs were merged in all of 2023-2024 combined; 12 or more were merged in Q4 2025 alone; the pace continued at 10+ per quarter through Q1-Q2 2026. This reflects infrastructure maturity (native CI) and growing contributor diversity.

---

## 3. Upstream Support Tier

llama.cpp does not publish a formal tier policy. The de facto requirements for acceptance of a new architecture or backend, as stated by ggerganov in PR reviews, are:

1. Follow project coding and naming conventions.
2. Provide CI coverage, preferably with self-hosted runners for exotic hardware.
3. Designate a CODEOWNERS entry for long-term maintenance.
4. No third-party dependencies; portability must be considered.

RISC-V satisfies all four as of mid-2026:

- The `ggml/src/ggml-cpu/arch/riscv/` directory is listed in CODEOWNERS (xctan is the primary codeowner).
- Native CI exists via the RISE project runner infrastructure (`ubuntu-24.04-riscv`).
- The SpacemiT backend (alex-spacemit) has its own CODEOWNERS entry for `ggml/src/ggml-cpu/spacemit/`.
- All RISC-V code is C/C++ with intrinsics -- no assembly-only files, no JIT.

**Effective tier: maintained, non-blocking.** RISC-V failures in CI do not block merges to `master` for non-RISC-V code. The PR trigger in `build-riscv.yml` only fires for changes inside `ggml/src/ggml-cpu/arch/riscv/**`, meaning most PRs never trigger RISC-V CI at all. This is the same situation as other non-x86 targets (s390x, etc.) and is not RISC-V-specific.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source File Inventory

All RISC-V-specific code lives under `ggml/src/ggml-cpu/`:

| File | Lines (approx.) | Role |
|---|---|---|
| `arch/riscv/quants.c` | ~6,596 | Quantization row functions and vec dot kernels for all major quant formats (q1_0 through q8_K); RVV 1.0, xtheadvector, and VLEN-dispatch variants |
| `arch/riscv/repack.cpp` | (see PR history) | Repack GEMM and GEMV kernels; Zvfh-gated 16x1 tiling tier; Q4_0, Q4_K, IQ4_NL, Q8_0, Q2_K formats |
| `arch/riscv/cpu-feats.cpp` | < 60 | Runtime CPU feature detection; `ggml_backend_cpu_riscv64_score()` via riscv_hwprobe; entry point for dynamic dispatch when `GGML_CPU_ALL_VARIANTS=ON` |
| `spacemit/rvv_kernels.cpp` | large | SpacemiT-specific: softmax, tanh, RMS norm, flash attention (VLEN=1024 optimized), quantize rows |
| `spacemit/ime.cpp` | (see PR) | SpacemiT IME1/IME2 GEMM kernels; TCM buffer management; thread affinity for SpacemiT AI cores |
| `spacemit/ime1_kernels.cpp` | (see PR) | IME generation 1 GEMM |
| `spacemit/ime2_kernels.cpp` | (see PR) | IME generation 2 GEMM |
| `spacemit/repack.cpp` | (see PR) | Weight repacking for SpacemiT IME format |
| `spacemit/spine_mem_pool.cpp` | (see PR) | Custom memory pool for SpacemiT TCM allocations |
| `spacemit/spine_tcm.h` | (see PR) | TCM interface |
| `spacemit/spine_barrier.h` | (see PR) | Barrier synchronization |

No `.S` assembly files exist. No JIT backend exists. All RISC-V acceleration is C/C++ with intrinsics and `asm volatile`.

### 4.2 ISA Extensions Supported

| Extension | Guard Macro | Files | Notes |
|---|---|---|---|
| RVV 1.0 (V) | `__riscv_v` / `__riscv_v_intrinsic` | quants.c, repack.cpp, spacemit/rvv_kernels.cpp | Primary vector path |
| Zvfh (FP16 vector) | `__riscv_zvfh` | repack.cpp, spacemit/ | Gates entire 16x1 GEMV/GEMM tier in repack.cpp |
| Zfh (scalar FP16) | `__riscv_zfh` | spacemit/ime.cpp | SpacemiT only |
| Zba (bit-manip addr) | cmake flag | CMakeLists, spacemit toolchain | Address generation |
| Zicbop (prefetch) | cmake flag | CMakeLists | Cache prefetch hints |
| Zihintpause | cmake flag | CMakeLists | Pause hint |
| Zvfbfwma (BF16 widen) | cmake flag | CMakeLists | Optional, off by default |
| Zfhmin | runtime probe | quants.c | Accelerated FP16 conversions |
| XTheadVector | `__riscv_xtheadvector` | quants.c | T-Head C906/C910/SG2042 vendor extension |
| SpacemiT IME1 | `RISCV64_SPACEMIT_IME1` | spacemit/ime*.cpp | Proprietary; requires non-upstream Bianbu binutils |
| SpacemiT IME2 | `RISCV64_SPACEMIT_IME2` | spacemit/ime*.cpp | Proprietary; GCC 15+ for xsmtvdotii in cmake |

### 4.3 Quant Format Coverage

Based on merged PRs and source file content:

| Format | RVV vec dot | RVV GEMV (repack) | RVV GEMM (repack) | XTheadVector | SpacemiT IME |
|---|---|---|---|---|---|
| Q1_0 | Yes (PR #22768) | No | No | Open PR #23009 | No |
| Q2_K | Yes | Yes (Zvfh) | Yes (Zvfh) | Yes | Yes |
| Q3_K | Yes | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | Yes | Yes |
| Q4_0 | Yes | Yes (Zvfh) | Yes (Zvfh) | Yes | Yes |
| Q4_1 | Yes | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | Yes | Yes |
| Q4_K | Yes | Yes (Zvfh) | Yes (Zvfh) | Yes | Yes |
| Q5_0 | Yes | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | Yes | No |
| Q5_1 | Yes | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | Yes | No |
| Q5_K | Yes | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | No |
| Q6_K | Yes | No (Draft PR #23745) | No (Draft PR #23745) | No [NEEDS VERIFICATION] | No |
| Q8_0 | Yes | Yes (Zvfh) | Yes (Zvfh) | No [NEEDS VERIFICATION] | No |
| Q8_K | Yes | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | No [NEEDS VERIFICATION] | No |
| IQ4_NL | Yes [NEEDS VERIFICATION] | Yes (Zvfh) | Yes (Zvfh) | No [NEEDS VERIFICATION] | No |
| F32 | Yes (PR #15057) | Yes (PR #17791 open) | Yes (PR #17791 open) | No [NEEDS VERIFICATION] | Via rvv_kernels.cpp |
| F16 | Yes (PR #17318) | Partial (Zvfh) | Partial (Zvfh) | No [NEEDS VERIFICATION] | Yes |
| NVFP4 | Open PR #23402 | No | No | No | No |

Note: Q3_K repack is the subject of Draft PR #23745. PR #17791 (F32 repack GEMM/GEMV) is open but stale.

### 4.4 Dynamic Dispatch (GGML_CPU_ALL_VARIANTS)

When built with `-DGGML_BACKEND_DL=ON -DBUILD_SHARED_LIBS=ON -DGGML_CPU_ALL_VARIANTS=ON`, the build produces two shared libraries: `libggml-cpu-riscv64_0.so` (rv64gc baseline, no vector) and `libggml-cpu-riscv64_v.so` (rv64gcv, RVV 1.0). At runtime, `cpu-feats.cpp` calls the `riscv_hwprobe` syscall (Linux >= 6.5 required) to detect RVV and load the appropriate variant. This mirrors the arm64 FEAT_DotProd dispatch pattern. PR #17461 introduced this; PR #17567 corrected the detection bug. Issue [ggml-org/ggml#1475](https://github.com/ggml-org/ggml/issues/1475) documents that sub-extension gating (Zvfh, Zvbb, etc.) is not yet done via hwprobe -- only base V is probed.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake Architecture Detection

`ggml/cmake/common.cmake` detects riscv64 via `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv64"`. Linux is the only supported target OS; any other OS triggers a fatal CMake error.

### 5.2 CMake Option Flags (defaults)

| Flag | Default | Extension |
|---|---|---|
| `GGML_RVV` | ON | V (RVV 1.0) |
| `GGML_RV_ZFH` | ON | Zfh |
| `GGML_RV_ZVFH` | ON | Zvfh |
| `GGML_RV_ZICBOP` | ON | Zicbop |
| `GGML_RV_ZIHINTPAUSE` | ON | Zihintpause |
| `GGML_RV_ZVFBFWMA` | OFF | Zvfbfwma (BF16) |
| `GGML_XTHEADVECTOR` | OFF | XTheadVector |
| `GGML_RV_ZBA` | not declared as option() | Zba |
| `GGML_CPU_RISCV64_SPACEMIT` | not declared as option() | SpacemiT IME |

`GGML_RV_ZBA` and `GGML_CPU_RISCV64_SPACEMIT` are used in `ggml/src/ggml-cpu/CMakeLists.txt` but are not declared as `option()` in `ggml/CMakeLists.txt`. They must be passed explicitly as `-D` flags; they will not appear in `cmake -L` output.

### 5.3 march String Construction

The build system assembles the `-march` string incrementally:

```
rv64gc
  + v              (GGML_RVV)
  + _zfh           (GGML_RV_ZFH)
  + _xtheadvector  (GGML_XTHEADVECTOR; mutually exclusive with zvfh/zvfbfwma)
  + _zvfh          (GGML_RVV and GGML_RV_ZVFH)
  + _zvfbfwma      (GGML_RVV and GGML_RV_ZVFBFWMA)
  + _zicbop        (GGML_RV_ZICBOP)
  + _zihintpause   (GGML_RV_ZIHINTPAUSE)
  + _zba           (GGML_RV_ZBA)
  + _xsmtvdotii    (GGML_CPU_RISCV64_SPACEMIT and GCC >= 15)
ABI: -mabi=lp64d always
```

PR [#20888](https://github.com/ggerganov/llama.cpp/pull/20888) fixed canonical ISA string ordering (assembler requires canonical order; build was failing before this fix).

### 5.4 Build Commands

**Standard RVV + Zvfh (BPI-F3, Lichee Pi 4A, SiFive P670):**
```bash
cmake -B build -DGGML_RVV=ON -DGGML_RV_ZFH=ON -DGGML_RV_ZVFH=ON \
  -DGGML_RV_ZICBOP=ON -DGGML_RV_ZIHINTPAUSE=ON
cmake --build build --config Release -j$(nproc)
```
Produces: `-march=rv64gcv_zfh_zvfh_zicbop_zihintpause -mabi=lp64d`

**T-Head C906/C910/SG2042 (xtheadvector):**
```bash
cmake -B build -DGGML_RVV=OFF -DGGML_XTHEADVECTOR=ON -DGGML_RV_ZFH=ON
cmake --build build --config Release -j$(nproc)
```
Produces: `-march=rv64gc_zfh_xtheadvector -mabi=lp64d`

**SpacemiT K1/X60 (Bananapi BPI-F3, Milk-V Jupiter):**
```bash
cmake -B build -DGGML_RVV=ON -DGGML_RV_ZFH=ON -DGGML_RV_ZVFH=ON \
  -DGGML_RV_ZICBOP=ON -DGGML_RV_ZBA=ON -DGGML_CPU_RISCV64_SPACEMIT=ON
cmake --build build --config Release -j$(nproc)
```
Requires SpacemiT IME toolchain (currently from Bianbu repo; not in upstream GCC). Uses `cmake/riscv64-spacemit-linux-gnu-gcc.cmake`.

**Dynamic dispatch (ALL_VARIANTS):**
```bash
cmake -B build -DGGML_BACKEND_DL=ON -DBUILD_SHARED_LIBS=ON \
  -DGGML_CPU_ALL_VARIANTS=ON
cmake --build build --config Release -j$(nproc)
```
Produces `libggml-cpu-riscv64_0.so` (no vector) and `libggml-cpu-riscv64_v.so` (RVV 1.0). Requires Linux >= 6.5 for riscv_hwprobe.

**Cross-compile from x86-64:**
```bash
cmake -B build -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DGGML_RVV=ON -DGGML_RV_ZFH=ON -DGGML_RV_ZVFH=ON
cmake --build build --config Release -j$(nproc)
```
No official cmake toolchain file exists for generic riscv64 cross-compilation. The SpacemiT toolchain file (`cmake/riscv64-spacemit-linux-gnu-gcc.cmake`) is SpacemiT-specific.

### 5.5 Toolchain Version Requirements

No minimum GCC/Clang version is enforced by CMake for general riscv64 builds. In practice:

- GCC >= 14 required for `_zvfh` and `_zvfbfwma` in `-march` strings.
- GCC >= 15 required for `_xsmtvdotii` (SpacemiT vendor extension); cmake code gates this explicitly.
- Binutils >= 2.40 required for Zvfh, Zicbop, Zihintpause ISA strings.
- C++17 is the only explicit standard.

The CI compilers are `riscv64-linux-gnu-gcc-14` and `riscv64-linux-gnu-g++-14` (Ubuntu 24.04 package).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 What is fully implemented

- All major K-quant vec dot kernels (Q2_K through Q6_K): RVV, xtheadvector, and scalar fallback.
- Q4_0, Q4_K, Q8_0, Q2_K GEMV and GEMM via Zvfh-gated repack kernels.
- SIMD-GEMM for flash attention (PR #20627).
- Dynamic backend dispatch (GGML_CPU_ALL_VARIANTS).
- SpacemiT IME1/IME2 vendor-specific GEMM backend.
- FP16/FP32 conversion via Zvfh.
- Runtime CPU feature detection via riscv_hwprobe.

### 6.2 Gaps vs arm64

arm64 in llama.cpp has:

- Full GEMM/GEMV repack coverage across all quant formats (Q3_K, Q5_K, Q6_K, F32 are covered on arm64 but not yet on riscv64).
- KleidiAI integration (ARM-specific INT8/FP16 matmul; not applicable to riscv64).
- Mature, always-on CI (GitHub-hosted runners with ARM hardware; not a third-party dependency).
- Pre-built release binaries (llama-b####-bin-ubuntu-arm64.tar.gz).
- Python wheel on PyPI (via cibuildwheel cross-compilation).

### 6.3 Gaps vs amd64

amd64 additionally has:

- CUDA, Vulkan, OpenCL, SYCL, HIP backends (GPU compute; not relevant for CPU-only comparison).
- AVX-512, AMX, VNNI intrinsic paths.
- Release binaries including GPU variants.
- llama-cpp-python wheels on PyPI.

### 6.4 Status of specific gaps

| Gap | Status |
|---|---|
| Q3_K / Q6_K repack GEMM/GEMV | Draft PR [#23745](https://github.com/ggerganov/llama.cpp/pull/23745) |
| F32 repack GEMM/GEMV | Open PR [#17791](https://github.com/ggerganov/llama.cpp/pull/17791), stale |
| Repack GEMM/GEMV at VLEN != 128 | Open PR [#20723](https://github.com/ggerganov/llama.cpp/pull/20723) |
| NVFP4 RVV optimization | Open PR [#23402](https://github.com/ggerganov/llama.cpp/pull/23402) |
| Mamba-2 SSM RVV acceleration | Open PR [#18926](https://github.com/ggerganov/llama.cpp/pull/18926) |
| Zvfhmin scale optimization (Q4_0) | Open PR [#19196](https://github.com/ggerganov/llama.cpp/pull/19196) |
| q4_0 GEMM prefill locality | Open PR [#24456](https://github.com/ggerganov/llama.cpp/pull/24456) |
| Release binaries | Open PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991), blocked on OpenSSL |
| xtheadvector build fix + Q1_0 kernel | Open PR [#23009](https://github.com/ggerganov/llama.cpp/pull/23009), awaiting review |
| VLEN-dispatch vec dot kernel selection | Draft PR [#18348](https://github.com/ggerganov/llama.cpp/pull/18348) |
| RVV xxh3 tensor hashing | Open PR [#18576](https://github.com/ggerganov/llama.cpp/pull/18576) |

---

## 7. CI/CD Infrastructure

### 7.1 Active Workflows

**`build-riscv.yml`** (primary RISC-V CI):

| Job | Runner | Trigger | Tests |
|---|---|---|---|
| `ubuntu-cpu-riscv64-native` | `ubuntu-24.04-riscv` (native) | push to master (any .h/.cpp change) + PR (only ggml/src/ggml-cpu/arch/riscv/** changes) | `ctest -L main --verbose --timeout 900` + llama2c conversion |
| `ubuntu-riscv64-native-sanitizer` (3x: ADDRESS, THREAD, UNDEFINED) | `ubuntu-24.04-riscv` (native) | push to master | `ctest -L main --verbose --timeout 900`, `continue-on-error: true` |

**`build-cross.yml`** (SpacemiT CI):

| Job | Runner | Trigger | Tests |
|---|---|---|---|
| `ubuntu-24-riscv64-cpu-spacemit-ime-cross` | `ubuntu-24.04` (x86, cross) | push to master (spacemit source changes) + weekly cron | Build only, no execution |

Two additional riscv64 jobs in `build-cross.yml` (`ubuntu-24-riscv64-cpu-cross`, `ubuntu-24-riscv64-vulkan-cross`) are **commented out** with the note "TODO: for regular runs, provision dedicated self-hosted runners."

No riscv64 CI exists in `release.yml`, `docker.yml`, `build-cpu.yml`, `server.yml`, or `build-cache.yml`.

### 7.2 Runner Infrastructure

The `ubuntu-24.04-riscv` label is not a GitHub-hosted runner. History:

- PR [#14439](https://github.com/ggerganov/llama.cpp/pull/14439) (Aug 2025): introduced as a Cloud-V (cloud-v.co) self-hosted runner on a physical Banana Pi BPI-F3 (SpacemiT K1, rv64imafdcv). Required repo-scoped token (not org-scoped) for registration.
- PR [#21263](https://github.com/ggerganov/llama.cpp/pull/21263) (Apr 2026): migrated to RISE Project public riscv64 runners (Scaleway EM-RV1 bare-metal nodes). Runner label: `ubuntu-24.04-riscv`. Documentation at riseproject-dev.github.io/riscv-runner/.

The RISE runner infrastructure is third-party. It is not covered by GitHub's SLA. If RISE runners are unavailable, CI jobs queue indefinitely. PR [#17916](https://github.com/ggerganov/llama.cpp/pull/17916) ("ci: fix riscv64-native build") documents a prior CI breakage requiring a dedicated fix.

According to the RISE blog post (2026-05-12), ggml-org/llama.cpp is the single heaviest user of RISE riscv64 runners, with 2,589 CI jobs in the first six weeks after the migration. ggml-org has a dedicated runner pool, not shared with the general RISE pool.

### 7.3 CI Coverage Limitations

- PR trigger for `build-riscv.yml` is narrow: only fires on changes to `ggml/src/ggml-cpu/arch/riscv/**`. Changes to model loading, server, Python bindings, non-RISC-V backends, etc. do not trigger RISC-V CI.
- Sanitizer jobs use `continue-on-error: true`; failures there are non-blocking and may go unnoticed.
- The SpacemiT cross-compile job is build-only (no execution); correctness of SpacemiT IME code is only validated by manual testing.
- No QEMU-based CI exists for testing RVV behavior on VLEN variants other than the runner's native VLEN.
- ccache was enabled for riscv64 CI in PR [#21632](https://github.com/ggerganov/llama.cpp/pull/21632), but ccache steps in `build-riscv.yml` are commented out with the note "sparing resources on dedicated runners."

---

## 8. Distribution and Release Status

### 8.1 GitHub Release Binaries

As of releases b9735 through b9740 (June 2026), the release asset matrix covers: macOS (arm64, x64), Ubuntu (x64, arm64, s390x, plus GPU variants), Windows (x64, arm64, CUDA, Vulkan, HIP, OpenVINO, SYCL), Android (arm64).

**No riscv64 asset exists in any release.** Issue [#20988](https://github.com/ggerganov/llama.cpp/issues/20988) ("Feature Request: Add riscv64 to release binaries", opened Mar 25 2026) was closed as not-planned with no maintainer comment. PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991) (open) proposes adding riscv64 via cross-compilation on ubuntu-24.04 x86 runners (estimated 5 min vs 49 min native); it is blocked on adding OpenSSL support.

### 8.2 Python Package (PyPI)

`llama-cpp-python` is the authoritative Python binding. Version 0.3.31 is the latest as of June 2026. PyPI only contains source tarballs (`llama_cpp_python-X.Y.Z.tar.gz`). No binary wheels exist for any architecture. A riscv64 wheel build workflow was added via PR [#2139](https://github.com/abetlen/llama-cpp-python/pull/2139) (merged 2026-03-23) with fixup PR [#2273](https://github.com/abetlen/llama-cpp-python/pull/2273) (merged 2026-06-05), validated on a BananaPi F3 with Python 3.13; however, no `linux_riscv64` wheel appears in any published release on PyPI as of the research date. Source build requires approximately 15 minutes on a 1.6 GHz SoC [NEEDS VERIFICATION].

A PyPI package named `llama-cpp` (without `-python`) does not exist (HTTP 404).

### 8.3 Linux Distributions

| Distribution | Package | riscv64 Status |
|---|---|---|
| Debian sid | llama.cpp v9601+dfsg-1 | Fully built (libllama0, libllama-dev, llama.cpp-tools, llama.cpp-examples, llama.cpp-tests, llama.cpp-tools-extra); build host rv-manda-01, status: Installed |
| Ubuntu 24.04 Noble | not packaged | N/A |
| Arch Linux RISC-V port | unknown | Site unreachable at research time |

Debian sid is the only confirmed source of pre-built riscv64 llama.cpp binaries. Debian sid is the unstable branch; production deployments should build from source or wait for the package to migrate to testing/stable.

---

## 9. Dependencies

### 9.1 ggml (in-tree)

GGML is vendored in-tree under `ggml/`. It has a dedicated riscv64 CI path and all RISC-V kernel code described in Section 4 lives inside it.

**Active riscv64 issues in ggml-org/ggml:**

- [ggml-org/ggml#1475](https://github.com/ggml-org/ggml/issues/1475) (open): SIGILL when RVV base extension is present but sub-extensions (Zvbb, Zvbc, Zvkb, Zvfh) are absent. The RVV backend is compiled for Zv* extensions but hwprobe only checks base V; any RVA23-baseline CPU without all sub-extensions can crash. **Severity: medium.**
- [ggml-org/ggml#1535](https://github.com/ggml-org/ggml/issues/1535) (open): OpenBSD/riscv64 build fails due to missing `zve32f` extension guard in `vec.h`. Linux builds are unaffected. **Severity: low.**
- [ggml-org/ggml#1388](https://github.com/ggml-org/ggml/issues/1388) (open): cross-compilation picks up host architecture flags instead of target riscv64 flags. **Severity: low.**

### 9.2 OpenSSL

OpenSSL is an optional dependency (`LLAMA_OPENSSL=ON` default) used for HTTPS model downloads via cpp-httplib.

riscv64 status: linux64-riscv64 target exists since May 2022. Active RVV assembly for AES/GCM/ChaCha20/SHA via Zkn/Zvk/Zvkb extensions. All supported branches (3.0, 3.4, 3.5, 3.6, 4.0) include the riscv64 target.

Active issues relevant to llama.cpp deployment:
- [openssl/openssl#20980](https://github.com/openssl/openssl/issues/20980) (open): AES without Zkn is not constant-time. **Security relevance for model download.**
- [openssl/openssl#22166](https://github.com/openssl/openssl/issues/22166) (open): SSL tests fail with high HARNESS_JOBS on riscv64 (flaky parallelism). Test-only; not a production blocker.

OpenSSL support is the stated blocker for PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991) (release binaries for riscv64).

### 9.3 OpenBLAS

Optional dependency (`GGML_BLAS=ON`). CMake generic riscv64 support added in v0.3.28. CI is entirely QEMU-based; no native riscv64 hardware in OpenBLAS CI. v0.3.33 (2026-04-23) ships riscv64 support.

Active correctness bug: an in-flight DGEMM correctness issue on ZVL256B as of 2026-06-07 (PR [#5815](https://github.com/xianyi/OpenBLAS/pull/5815) in-flight). This affects the optional BLAS backend at wide VLEN. The default build does not enable BLAS; impact on llama.cpp is low unless BLAS backend is explicitly activated.

### 9.4 KleidiAI

ARM-only by design. Not applicable to riscv64. The `GGML_CPU_KLEIDIAI` code path is guarded inside the ARM branch of ggml-cpu CMakeLists and is OFF by default.

### 9.5 llamafile / cosmopolitan

`GGML_LLAMAFILE` is ON by default. The llamafile SGEMM kernel uses x86/ARM SIMD dispatch and falls back to scalar C on riscv64. PR [#18199](https://github.com/ggerganov/llama.cpp/pull/18199) added RVV-accelerated SGEMM in the llamafile layer within llama.cpp. No upstream llamafile riscv64 CI exists.

### 9.6 OpenMP / libomp

GCC libgomp and LLVM libomp both support riscv64. `build-riscv.yml` CI explicitly tests `GGML_OPENMP=OFF` (main job) and `GGML_OPENMP=ON` (sanitizer jobs). No blocking issues identified.

### 9.7 cpp-httplib

Vendored header. Pure C++17, no arch-specific code. Portability depends entirely on OpenSSL for HTTPS.

---

## 10. Ecosystem Status

### 10.1 RISE Project

The RISE Project (RISC-V Software Ecosystem) is a Linux Foundation Europe project with 18 members including RISE Premier Members Google, NVIDIA, Qualcomm, SiFive, and Red Hat, and General Members including SpacemiT, ByteDance, and Canonical.

RISE funded project RP-014 is "Optimizing Llama.cpp and GGML for RVV." The project scope covers vecdot, quantize_row, FP16/BF16 utilities, GEMM/GEMV repacking, SGEMM (MUL_MAT), and FLASH_ATTN_EXT kernels. Validation infrastructure exists at [riseproject-dev/llama.cpp-validation](https://github.com/riseproject-dev/llama.cpp-validation), which is a benchmarking suite supporting cross-compilation via QEMU at VLEN 128/256/512/1024 and native hardware.

Ludovic Henry (Meta, RISE TSC Co-Chair) is named in the RISE Q1 2026 Outsized Impact Award as having "bootstrapped outreach to llama.cpp and PyTorch as RISC-V RVV optimization targets." He appears as a reviewer in llama.cpp RISC-V PRs (e.g., PR [#17318](https://github.com/ggerganov/llama.cpp/pull/17318), PR [#17567](https://github.com/ggerganov/llama.cpp/pull/17567)) under the handle `luhenry`.

RISE provides the riscv64 CI runner infrastructure (migrated from Cloud-V in April 2026) and the [RISC-V Optimization Guide](https://riscv-optimization-guide.riseproject.dev), which is referenced directly in llama.cpp RISC-V PR discussions (PR [#17567](https://github.com/ggerganov/llama.cpp/pull/17567)).

llama.cpp is the single heaviest user of RISE riscv64 runners: 2,589 CI jobs in the first six weeks post-migration, with a dedicated runner pool.

No dedicated RISE blog post on llama.cpp performance exists. No llama.cpp package on the RISE wheel builder (riseproject.gitlab.io/python/wheel_builder/).

### 10.2 Contributing Organizations

| Organization | Contributions | RISE Member |
|---|---|---|
| 10xEngineers (Pakistan) | First RVV intrinsics (2023), Makefile flags, native CI (Cloud-V, alitariq4589), SIMD-GEMM (2026, rehan-10xengineer) | No |
| SpacemiT (China) | IME1/IME2 backend, CODEOWNERS maintainer (alex-spacemit) | Yes (General) |
| ISCAS (ixgbe / Wang Yang) | riscv_hwprobe detection, nvfp4 RVV | Yes (General) |
| Individual (xctan) | 128-bit VLEN, xtheadvector, kernel optimizations; ggml-org collaborator | No |
| Meta / RISE (luhenry) | PR reviewer, RISE RP-014 oversight | n/a |

### 10.3 Hardware Targets with Active Validation

| Board | SoC | VLEN | ISA extensions | Used in CI |
|---|---|---|---|---|
| Banana Pi BPI-F3 | SpacemiT K1 (X60) | 256 | rv64imafdcv + Zvfh + IME1 | Yes (RISE runner) |
| OrangePi RV2 | SpacemiT K1 | 256 | rv64imafdcv + Zvfh + IME1 | No (PR testing only) |
| SpacemiT A100 | SpacemiT (unnamed) | 1024 | rv64 + RVA23 + IME2 | No (PR testing only) |
| SG2042 | Sophgo SG2042 | 128 | rv64 + xtheadvector | No (PR testing only) |
| SiFive Premier P550 | SiFive | Data not available | No Zfh | No (crash reported, issue #24250) |
| 64-core rv64gcv machine | Data not available | 128 | rv64gcv | No (PR testing only) |

---

## 11. Known Bugs and Active Issues

### 11.1 Open Correctness Bugs

**Issue [#24250](https://github.com/ggerganov/llama.cpp/issues/24250) -- SIGILL on SiFive P550 (open, unresolved)**

Opened: Jun 7 2026. `riscv_compute_fp32_to_fp16` crashes at `simd-mappings.h:104` with SIGILL. GCC 14.2.0 emits `_Float16` instructions for a CPU lacking Zfh (SiFive Premier P550: `rv64imafdch_zicsr...` with no Zfh). CMake flags `-DGGML_ZFH=0 -DGGML_ZFHMIN=0` failed to prevent the illegal instruction. No fix or workaround confirmed.

Impact: Any RVV-capable CPU lacking Zfh but with the `_Float16` GCC extension active can crash. SiFive P550 is a production-grade core used in server platforms. **Severity: high for SiFive P550 deployments.**

**Issue [#22655](https://github.com/ggerganov/llama.cpp/issues/22655) -- RVV 16x1 repack hard crash (open, unresolved)**

Opened: May 4 2026. Hard crash (system reboot required) during prompt processing with Q8_0 models when CPU_REPACK is active on SpacemiT K1 / OrangePi RV2 (Zvfh supported). Trigger: prompt length >= 4 tokens. Token generation alone works (approximately 5.5-5.7 t/s). First bad commit: `af237f3`. No assignee, no fix.

Impact: Zvfh-capable SpacemiT hardware with Q8_0 models cannot use the repack code path without risk of system crash. **Severity: high for SpacemiT K1 deployments.**

**Issue [#22159](https://github.com/ggerganov/llama.cpp/issues/22159) -- Wrong RVV feature detection macro (closed as not-planned, no fix)**

Closed: Jun 5 2026. `__riscv_v_intrinsic` is used as a feature-detection guard in `ggml/src/ggml-cpu/arch/riscv/quants.c` instead of `__riscv_v`. `__riscv_v_intrinsic` is defined as a version number for the intrinsic API, not a hardware capability flag -- it is defined even on CPUs with no vector hardware. Could cause vector instructions to execute on non-vector hardware.

Closed as not-planned / stale. No fix merged. This issue remains in the codebase.

**Issue [#12124](https://github.com/ggerganov/llama.cpp/issues/12124) -- Garbled output with RVV on ISA simulator (closed stale)**

With RVV enabled on the OpenXiangShan NEMU simulator (Linux Tizen), output was corrupted across all tested models. Disabling RVV via `-U__riscv_v_intrinsic` restored correct output. Closed as stale. Root cause not identified.

**Issue [#14926](https://github.com/ggerganov/llama.cpp/issues/14926) -- SIGILL on StarFive VisionFive2 (closed stale)**

`llama-cli` and `llama-server` crash immediately with SIGILL on VisionFive2 (commit `ca0ef2d`). Closed as stale, no fix.

### 11.2 Historical Correctness Issues (resolved)

- PR [#8748](https://github.com/ggerganov/llama.cpp/pull/8748) (Jul 2024): inactive-element masking bug in RVV intrinsics. Agnostic policy allowed all-1s to appear in inactive lanes; switched to undisturbed policy.
- PR [#17567](https://github.com/ggerganov/llama.cpp/pull/17567) (Nov 2025): false-positive RVV detection via AT_HWCAP; boards reporting RVV v0.7 as v1.0 could trigger vector instructions incorrectly. Fixed by replacing AT_HWCAP with riscv_hwprobe.
- PR [#20682](https://github.com/ggerganov/llama.cpp/pull/20682) (Mar 2026): incorrect RVV feature-check logic in quantization and repacking dispatch caused wrong kernel selection.
- PR [#21157](https://github.com/ggerganov/llama.cpp/pull/21157) (Apr 2026): incorrect fallback path when Zvfh is absent.

### 11.3 Open Infrastructure Issues

- Issue [#21064](https://github.com/ggerganov/llama.cpp/issues/21064) (closed as not-planned): build failure with `GGML_CPU_ALL_VARIANTS=ON` on RISC-V; CMake fixes in merged PRs likely addressed this but the issue was not closed-as-fixed.
- PR [#23009](https://github.com/ggerganov/llama.cpp/pull/23009) (open): xtheadvector build is broken on current master; awaiting one more review approval. This means T-Head SG2042 and C906/C910 builds may currently fail.

---

## 12. Objections and Upstream Blockers

**Objection: SpacemiT IME backend requires non-upstream toolchain.**

The SpacemiT backend depends on proprietary IME instructions (`vmadot`, `vfwmadot`, `xsmtvdotii`) not yet in upstream GCC binutils. This was flagged by ggerganov at merge time (PR [#15288](https://github.com/ggerganov/llama.cpp/pull/15288)) as a long-term maintenance risk. Workaround: cross-compile using the Bianbu-provided toolchain. xsmtvdotii support in GCC 15 partially addresses this for the `_xsmtvdotii` extension specifically.

**Objection: CI relies on third-party runner infrastructure.**

The RISE runner pool is not covered by GitHub SLA. Historical failures exist (PR [#17916](https://github.com/ggerganov/llama.cpp/pull/17916)). The commented-out cross-compile CI jobs in `build-cross.yml` demonstrate that the project acknowledges this fragility but has not resolved it.

**Objection: No release binaries, no PyPI wheel.**

PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991) for release binaries is open but blocked on OpenSSL. The original tracking issue was closed as not-planned. PyPI wheels require cibuildwheel support or a dedicated release workflow with RISC-V runners; neither exists in upstream as of June 2026.

**Objection: Crash on SiFive P550.**

Issue [#24250](https://github.com/ggerganov/llama.cpp/issues/24250) shows that a mainstream SiFive server core causes a SIGILL in the current codebase. This is unresolved. The root cause (GCC emitting `_Float16` instructions regardless of CMake flags) suggests a systematic issue with the extension-gating logic that may affect other non-Zfh cores.

**Objection: No master tracking issue; port is fragmented.**

Unlike some projects (GDB, LLDB) that maintain a single umbrella issue tracking the riscv64 port status, llama.cpp has no such issue. Issue [#20988](https://github.com/ggerganov/llama.cpp/issues/20988) was the closest candidate and was closed as not-planned. All active work is tracked through individual PRs with no consolidated view of remaining gaps.

**Objection: xtheadvector is currently broken.**

PR [#23009](https://github.com/ggerganov/llama.cpp/pull/23009) (open) states it fixes build breakage in the xtheadvector codepath. Until it merges, T-Head-based platforms (SG2042, C906/C910) may build incorrectly.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The current codebase is functional on RVV 1.0 hardware with the correct extensions. The primary functional gaps are:

- Q3_K and Q6_K GEMM/GEMV repack (draft PR, contributor-led, does not need external investment).
- F32 repack GEMM/GEMV (open PR, stale).
- Fix SIGILL on non-Zfh RISC-V CPUs including SiFive P550.
- Fix xtheadvector build breakage.
- Resolve the Zvfh 16x1 repack crash on SpacemiT K1.

For a chip company targeting RVA23 profiles or specific ISA variants, validating that the extension-gating CMake flags actually produce crash-free builds on the target silicon requires direct testing; the SiFive P550 issue shows this does not happen automatically.

### 13.2 Performance Optimization

Measured performance on available hardware (from PR benchmarks, not independent verification):

| Hardware | Config | Model | Prefill (t/s) | Generate (t/s) |
|---|---|---|---|---|
| SpacemiT X60 (K1), 4 threads, VLEN=256, IME1 | Q4_0 | Qwen2.5 0.5B | 64.12 | 10.03 |
| SpacemiT X60 (K1), 4 threads, VLEN=256, IME1 | Q4_0 | Qwen2.5 1.5B | 24.16 | 3.83 |
| SpacemiT X60 (K1), 4 threads, VLEN=256, IME1 | Q4_0 | Qwen2.5 3B | 12.08 | 2.23 |
| SpacemiT A100, 8 threads, VLEN=1024, IME2 | Q4_0 | Qwen3 0.6B | 565.83 | 55.77 |
| SpacemiT A100, 8 threads, VLEN=1024, IME2 | Q4_1 | Qwen3.5 2B | 115.23 | 16.49 |
| SpacemiT A100, 8 threads, VLEN=1024, IME2 | Q4_0 | Qwen3 4B | 79.74 | 11.29 |
| SpacemiT A100, 8 threads, VLEN=1024, IME2 | Q4_0 | Qwen3MoE 30B.A3B | 57.88 | 12.79 |
| OrangePi RV2 (K1), 8 threads, VLEN=256, RVV | Q1_0 | Bonsai-1.7B | 13.36 (pp64) | 9.71 (tg16) |
| 64-core rv64gcv, VLEN=128, 64 threads | Q2_K_L | DeepSeek-R1-8B | 27.19 (pp512) | 11.10 (tg128) |
| SG2042, 32 threads, xtheadvector | Q4_K_M | Gemma-3-4B-IT | 15.73 (pp512) | 5.15 (tg128) |
| BPI-F3, 8 threads, VLEN=256, RVV | F16 | TinyLlama 1.1B | 22.78 (pp128, repack) | 3.4 (tg, memory-bound) |

No head-to-head comparison against arm64 or amd64 on equivalent silicon is available in the research data. All benchmarks compare RVV-optimized vs scalar-RISC-V baselines on the same hardware.

The SpacemiT A100 VLEN=1024 figures are notable (565 t/s prefill on Qwen3 0.6B), but the PR notes that "thread switching incurs extremely high overhead for register context preservation" at 1024-bit VLEN. The practical significance of this figure depends on the A100's position in the market, which is not addressed in the research data.

Remaining performance optimization opportunities (open PRs): q4_0 GEMM prefill locality (#24456), repack GEMM/GEMV at higher VLENs (#20723), Zvfhmin scale dequantization (#19196), VLEN-dispatch kernel selection (#18348).

### 13.3 CI/CD Infrastructure

The current RISE runner dependency is the infrastructure's main fragility. Investment options:

- Contribute dedicated riscv64 runners to the RISE pool to reduce SLA dependency.
- Re-enable the commented-out cross-compile CI jobs in `build-cross.yml` with dedicated runner provisioning, providing a fallback for build-level validation when native runners are unavailable.
- Add QEMU-based CI for VLEN variant testing (128/256/512/1024) to complement native hardware CI.
- Unblock PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991) by resolving the OpenSSL cross-compile issue.

### 13.4 Ecosystem Enablement

- Pre-built release binaries: unblock PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991).
- PyPI wheel: contribute cibuildwheel riscv64 support or a release workflow using RISE runners.
- Python binding build time is approximately 15 minutes on a 1.6 GHz RISC-V SoC [NEEDS VERIFICATION]; reducing this is a usability concern for edge deployment scenarios.
- No llama-cpp-python wheel on any distribution channel is a friction point for Python-based inference pipelines on RISC-V.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Correctness | Fix SIGILL on non-Zfh RISC-V CPUs (issue #24250) | 1-2 | RISC-V chip vendor | Critical |
| Correctness | Fix Zvfh 16x1 repack crash on SpacemiT K1 (issue #22655) | 1-2 | SpacemiT / any contributor | Critical |
| Correctness | Fix wrong __riscv_v_intrinsic guard macro (issue #22159, closed-not-planned) | 0.5 | Any contributor | High |
| Correctness | Fix xtheadvector build breakage (PR #23009) | 0.5 (already in open PR, needs review) | xctan / maintainer review | High |
| Correctness | Resolve ggml-org/ggml#1475 (sub-extension gating in hwprobe) | 2-4 | RISC-V ecosystem contributor | High |
| Performance | Q3_K / Q6_K repack GEMM/GEMV (draft PR #23745) | 2-3 | Contributor / 10xEngineers | Medium |
| Performance | F32 repack GEMM/GEMV (stale PR #17791) | 2-3 | Contributor | Medium |
| Performance | Repack GEMM/GEMV at VLEN > 128 (PR #20723) | 2-4 | Contributor | Medium |
| Performance | NVFP4 RVV optimization (PR #23402) | 1-2 | ixgbe / any contributor | Medium |
| Performance | q4_0 GEMM prefill locality (PR #24456) | 1 | Contributor | Low |
| Performance | Zvfhmin Q4_0 scale optimization (PR #19196) | 1 | Contributor | Low |
| CI | Add QEMU VLEN-variant CI (128/256/512/1024) | 2-4 | Any contributor | Medium |
| CI | Provision dedicated riscv64 runners for build-cross.yml | 1 (setup) + ongoing | RISC-V chip vendor | Medium |
| CI | Re-enable commented-out cross-compile CI jobs | 0.5 | Any contributor | Low |
| Distribution | Unblock release binaries (PR #20991 -- OpenSSL cross-compile) | 1-2 | Any contributor | High |
| Distribution | Add riscv64 PyPI wheel to llama-cpp-python | 2-4 | abetlen / RISC-V contributor | High |
| Documentation | Consolidated port tracking issue | 0.5 | Any contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [llama.cpp repository](https://github.com/ggerganov/llama.cpp)
- [ggml-org organization](https://github.com/ggml-org)
- [RISE Project](https://riseproject.dev)
- [RISE RP-014 validation repo](https://github.com/riseproject-dev/llama.cpp-validation)
- [RISE riscv64 runners documentation](https://riseproject-dev.github.io/riscv-runner/)
- [RISE Q1 2026 Outsized Impact Award](https://riseproject.dev/2026/04/21/rise-outsized-impact-award-q1-2026/)
- [RISE runners six-weeks-in blog post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISC-V Optimization Guide](https://riscv-optimization-guide.riseproject.dev)
- [PR #3453 -- K-Quants RVV](https://github.com/ggerganov/llama.cpp/pull/3453)
- [PR #12530 -- 128-bit VLEN RVV](https://github.com/ggerganov/llama.cpp/pull/12530)
- [PR #13720 -- xtheadvector](https://github.com/ggerganov/llama.cpp/pull/13720)
- [PR #14439 -- native RISC-V CI](https://github.com/ggerganov/llama.cpp/pull/14439)
- [PR #15288 -- SpacemiT IME backend](https://github.com/ggerganov/llama.cpp/pull/15288)
- [PR #17461 -- RISC-V cpu-feats](https://github.com/ggerganov/llama.cpp/pull/17461)
- [PR #17567 -- riscv_hwprobe detection](https://github.com/ggerganov/llama.cpp/pull/17567)
- [PR #20627 -- SIMD-GEMM RVV](https://github.com/ggerganov/llama.cpp/pull/20627)
- [PR #20888 -- CMake ISA string ordering](https://github.com/ggerganov/llama.cpp/pull/20888)
- [PR #20991 -- riscv64 release binaries](https://github.com/ggerganov/llama.cpp/pull/20991)
- [PR #21263 -- RISE runners migration](https://github.com/ggerganov/llama.cpp/pull/21263)
- [PR #22768 -- Q1_0 optimized RVV dot](https://github.com/ggerganov/llama.cpp/pull/22768)
- [PR #22863 -- SpacemiT IME2](https://github.com/ggerganov/llama.cpp/pull/22863)
- [Issue #20988 -- riscv64 release binaries (closed)](https://github.com/ggerganov/llama.cpp/issues/20988)
- [Issue #22655 -- Zvfh repack crash](https://github.com/ggerganov/llama.cpp/issues/22655)
- [Issue #24250 -- SIGILL on SiFive P550](https://github.com/ggerganov/llama.cpp/issues/24250)
- [ggml-org/ggml#1475 -- sub-extension gating](https://github.com/ggml-org/ggml/issues/1475)
- [llama-cpp-python PR #2139 -- riscv64 wheel build](https://github.com/abetlen/llama-cpp-python/pull/2139)
- [Debian buildd llama-cpp](https://buildd.debian.org/status/package.php?p=llama.cpp&suite=sid)