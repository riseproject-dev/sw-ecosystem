---
title: llama.cpp
parent: Project Reports
color: blue
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: cpp-httplib
    relation: runtime-dependency
    criticality: optional
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: Vulkan
    relation: runtime-dependency
    criticality: optional
  - name: shaderc
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="llama-cpp" %}

# llama.cpp

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for llama.cpp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

llama.cpp is a C/C++ LLM inference engine built around the GGML tensor library. It is the dominant open-source CPU inference stack for quantized large language models (q4_0 through q8_0, K-quants, IQ-quants, MXFP4), and it targets multiple hardware backends (CPU, CUDA, Vulkan, Metal, ROCm, OpenCL, SYCL, Ascend CANN, IBM zDNN) via the GGUF model format.

**Repository note:** the canonical repository has moved from `ggerganov/llama.cpp` to [`ggml-org/llama.cpp`](https://github.com/ggml-org/llama.cpp); the old owner no longer resolves via the GitHub API. All facts in this report are against `ggml-org/llama.cpp`, HEAD around commit `f872b59` as of 2026-09-30.

The project is MIT-licensed, copyrighted "The ggml authors," and lives under the `ggml-org` GitHub organization, a project-run org with no legal-foundation structure (unlike, e.g., the Linux Foundation-style PyTorch Foundation). Founder Georgi Gerganov (`ggerganov@gmail.com`, 1,992 commits, by far the top contributor) also runs the commercial entity **ggml.ai**, but commits under a personal email with no visible corporate affiliation in the metadata.

**Governance** (per `CONTRIBUTING.md`): a three-tier structure of Contributors (no privileges), Collaborators/Triage (own specific code areas, listed in `CODEOWNERS`), and Maintainers (review/merge after codeowner approval, squash-merge, and "reserve the right to decline review or close PRs for any reason, without question"). There is no RFC or steering-committee process; governance is informal and centered on Gerganov plus roughly 20 module-level `CODEOWNERS` entries.

**Corporate presence among maintainers** (from commit email domains and `CODEOWNERS`): **Hugging Face** (Xuan-Son Nguyen, `son@huggingface.co`, #2 all-time contributor with 480 commits; Sigbjorn Skjaeret, #4 with 370 commits); **NVIDIA** (Jeff Bolz, Vulkan backend co-owner); **Qualcomm** (lhez, max-krasnyansky, ggml-hexagon backend); **IBM** (Andreas-Krebbel, AlekseiNikiforovIBM, ggml-zdnn/IBM Z backend); **Huawei** (implied, hipudding, ggml-cann/Ascend backend); **SpacemiT** (alex-spacemit, `jinghui.huang@spacemit.com`, owns `ggml/src/ggml-cpu/spacemit/`); **10xEngineers**, a Pakistan-based RISC-V/hardware consultancy (Ahmad "Tameem" Tameem and rehan-10xengineer, who authored the original 2023 RVV intrinsics and much of the subsequent RVV kernel work).

**Community stance on new ports** (`CONTRIBUTING.md`): new hardware/backend support is welcomed but gated: it must start as a GitHub issue (not a PR) to let interest accumulate; new backend/model support should ship CPU-only first, with GPU/accelerator backends as follow-ups; new quant types face a high bar (perplexity/KL-divergence/performance data required); maintainers explicitly weigh long-term maintenance burden and may decline niche or unmaintainable contributions.

**RISE Project relationship:** llama.cpp/ggml-org is **not listed** as a RISE member or RISE-affiliated project on riseproject.dev's members page (which lists Premier members Google, NVIDIA, Qualcomm, SiFive, Red Hat and General members including SpacemiT, Canonical, ByteDance). The connection is indirect but substantial: llama.cpp is reported as **the single heaviest consumer of RISE's free native RISC-V CI runner service, with 2,589 CI jobs in a six-week window** (2026-03-19 to 2026-05-06), running on Cloud-V-hosted RVV 1.0 hardware ([RISE blog, "RISE RISC-V Runners: six weeks in," 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). Ludovic Henry (Meta), founder/lead of the RISE AI & ML Workgroup, is named in RISE's Q1 2026 Outsized Impact Award for "optimizing PyTorch ATen operators and llama.cpp" ([RISE Q1 2026 award post](https://riseproject.dev/2026/04/21/rise-outsized-impact-award-q1-2026/)); he also reviews llama.cpp RISC-V PRs under the handle `luhenry`. SpacemiT, the vendor behind llama.cpp's dedicated RISC-V backend, is itself a RISE General Member, giving RISE a corporate-contributor link to the project even without formal project membership. RISE also maintains a fork, `riseproject-dev/llama.cpp`, used as a CI validation target, and a related `riseproject-dev/llama.cpp-validation` repo referenced in RISE's runner architecture docs [NEEDS VERIFICATION on exact scope of that repo's contents].

---

## 2. Port History and Upstreaming Timeline

RISC-V support has no single master tracking issue; it evolved through 45+ individual issues and PRs from May 2023 to the present. The table below lists confirmed merged milestones, cross-checked against a direct GitHub PR-history search that returned exact `merged_at` timestamps and first-release build tags.

| Date (merged) | PR | Contributor / Affiliation | First Release Tag | Change |
|---|---|---|---|---|
| 2023-05-27 | [#1616](https://github.com/ggml-org/llama.cpp/pull/1616) | apcameron, individual | pre-`bNNNN` era | Foundational port: guards x86 SIMD includes so the code compiles on RISC-V at all. |
| 2023-09-01 | [#2929](https://github.com/ggml-org/llama.cpp/pull/2929) | Tameem-10xE, 10xEngineers | b1140 | First real RVV intrinsics: dot products for q4_0/q4_1/q5_0/q5_1/q8_0. |
| 2023-09-15 | [#3160](https://github.com/ggml-org/llama.cpp/pull/3160) | 10xEngineers/Cloud-V | b1245 | Original Cloud-V Jenkins-based CI pipeline for native RISC-V builds. |
| 2023-10-03 | [#3453](https://github.com/ggml-org/llama.cpp/pull/3453) | 10xEngineers | b1317 | RVV support for K-quants; refined existing intrinsics. |
| 2024-07-22 | [#8623](https://github.com/ggml-org/llama.cpp/pull/8623) | (unattributed) | b3434 | Fix RISC-V compile error. |
| 2024-07-29 | [#8748](https://github.com/ggml-org/llama.cpp/pull/8748) | CarterLi999, individual | b3488 | Fix RVV inactive-lane masking (agnostic -> undisturbed policy). |
| 2024-09-12 | [#9442](https://github.com/ggml-org/llama.cpp/pull/9442) | Tameem-10xE, 10xEngineers | b3738 | Makefile RISCV_VECT flag and vector-capability logging. |
| 2024-10-30 | [#10029](https://github.com/ggml-org/llama.cpp/pull/10029) | (unattributed) | b3991 | RVV version of Q4_0_8_8 quant functions. |
| 2024-11-19 | [#10411](https://github.com/ggml-org/llama.cpp/pull/10411) | (unattributed) | b4138 | CMake-based RISC-V compiler detection (previously Makefile-only). |
| 2025-03-27 | [#12530](https://github.com/ggml-org/llama.cpp/pull/12530) | xctan, individual | b4969 | 128-bit RVV VLEN support (previously only 256+ bit); ~8.5x pp512 uplift reported. |
| 2025-05-27 | [#13720](https://github.com/ggml-org/llama.cpp/pull/13720) | xctan, individual | b5509 | xtheadvector (T-Head vendor RVV variant) support for SG2042/C906/C910. |
| 2025-08-13 | [#14439](https://github.com/ggml-org/llama.cpp/pull/14439) | alitariq4589, 10xEngineers/Cloud-V | b6148 | Replaced manual Jenkins Cloud-V CI with a GitHub Actions job on real RVV 1.0 hardware. |
| 2025-09-03 | [#15720](https://github.com/ggml-org/llama.cpp/pull/15720) | xctan, individual | b6364 | RVV kernel performance optimizations. |
| 2025-09-21 | [#16150](https://github.com/ggml-org/llama.cpp/pull/16150) | (unattributed) | b6532 | Added CI label for the RISC-V runner. |
| 2025-09-29 | [#15288](https://github.com/ggml-org/llama.cpp/pull/15288) | alex-spacemit / co-seven / CISC | b6635 | Dedicated SpacemiT (K1/K3) backend using proprietary IME instructions; new cross-compile CI job. |
| 2025-10-17 | [#16629](https://github.com/ggml-org/llama.cpp/pull/16629) | (unattributed) | b6788 | Fix SpacemiT IME out-of-bounds array access. |
| 2025-11-02 | [#16952](https://github.com/ggml-org/llama.cpp/pull/16952) | (unattributed) | b6929 | Disabled a broken riscv cross-compile CI job to unblock other PRs. |
| 2025-11-24 | [#17461](https://github.com/ggml-org/llama.cpp/pull/17461) | ixgbe / ISCAS | b7141 | Structured RISC-V CPU feature detection; enables `GGML_CPU_ALL_VARIANTS` dynamic dispatch. |
| 2025-11-29 | [#17567](https://github.com/ggml-org/llama.cpp/pull/17567) | ixgbe / ISCAS | b7196 | Replaced legacy `hwcap` detection with `riscv_hwprobe` syscall for reliable RVV detection. |
| 2025-12-10 | [#17916](https://github.com/ggml-org/llama.cpp/pull/17916) | (unattributed) | b7356 | Fixed a broken native riscv64 CI build. |
| 2025-12-12 | [#17951](https://github.com/ggml-org/llama.cpp/pull/17951) | (unattributed) | b7369 | Fixed Q4_0 repack kernel-selection logic and RVV feature reporting. |
| 2026-01-05 | [#18590](https://github.com/ggml-org/llama.cpp/pull/18590) | (unattributed) | b7628 | Initialized git-lfs in every RISC-V CI test job. |
| 2026-01-26 | [#19121](https://github.com/ggml-org/llama.cpp/pull/19121) | (unattributed) | b8268 | RVV-accelerated repacked GEMM/GEMV paths for quantized types. |
| 2026-03-13 | [#18859](https://github.com/ggml-org/llama.cpp/pull/18859) | rehan-10xengineer, taimur-10x, RehanQasim-dev / 10xEngineers | b8329 | RVV vec-dot kernels for IQ2/IQ3/IQ4/MXFP4 (128-bit and 256-bit VLEN). Later shown to contain the tail-handling bug tracked as issue #29131. |
| 2026-03-17 | [#20682](https://github.com/ggml-org/llama.cpp/pull/20682) | (unattributed) | b8398 | Fixed incorrect RVV capability checks in quant/repack code paths. |
| 2026-03-26 | [#20888](https://github.com/ggml-org/llama.cpp/pull/20888) | (unattributed) | b8545 | Canonical ISA-string ordering fix for RVV `-march` flags. |
| 2026-04-01 | [#21157](https://github.com/ggml-org/llama.cpp/pull/21157) | (unattributed) | b8610 | Fixed scalar fallback when `zvfh` is absent. |
| 2026-04-01 | [#21263](https://github.com/ggml-org/llama.cpp/pull/21263) | (unattributed) | n/a | Switched CI from custom self-hosted runners to standard RISE-provided RISC-V runners. |
| 2026-04-16 | [#20627](https://github.com/ggml-org/llama.cpp/pull/20627) | 10xEngineers | b8813 | `simd_gemm` kernel using the RISC-V vector extension. |
| 2026-04-16 | [#21632](https://github.com/ggml-org/llama.cpp/pull/21632) | (unattributed) | b8811 | Enabled ccache on riscv64 CI builds. |
| 2026-04-29 | [#22317](https://github.com/ggml-org/llama.cpp/pull/22317) | (unattributed) | b8972 | CMake march-flag fix enabling SpacemiT's IME matrix-extension instructions. |
| 2026-05-07 | [#22768](https://github.com/ggml-org/llama.cpp/pull/22768) | (unattributed) | b9057 | Optimized q1_0 dot-product kernel for RISC-V. |
| 2026-05-09 | [#22863](https://github.com/ggml-org/llama.cpp/pull/22863) | alex-spacemit / SpacemiT | n/a | IME2 (2nd-gen matrix-multiply) instruction support for the SpacemiT backend. |
| 2026-06-04 | [#22754](https://github.com/ggml-org/llama.cpp/pull/22754) | (unattributed) | b9498 | Extended RVV quantization vec-dot to higher VLENs. |
| 2026-09-02 | [#27961](https://github.com/ggml-org/llama.cpp/pull/27961) | (unattributed) | b10756 | Gated SpacemiT IME kernel source compilation behind a build condition. |

**Closed without merging (confirmed no merge commit exists):** #3193 (Cloud-V CI test PR), #9953 (superseded by #10029), #15287 (Jenkins-to-GH-Actions replacement, superseded by #14439), plus others; also #25553 (VLEN1024 Q4_K/Q5_K repack path, closed 2026-07-11, unmerged) and #26986 ("ci: Enable release on ubuntu riscv64," closed 2026-08-12, unmerged, competing with the still-open #20991).

**Currently open, unmerged:** [#20991](https://github.com/ggml-org/llama.cpp/pull/20991) (release binaries, see Sections 8 and 12), [#23009](https://github.com/ggml-org/llama.cpp/pull/23009) (xtheadvector build fix), [#28479](https://github.com/ggml-org/llama.cpp/pull/28479) (SpacemiT X60 IME1 Q8_0 kernel), [#28642](https://github.com/ggml-org/llama.cpp/pull/28642) (Q4_0 8x8 gemv/gemm for vlenb=16).

**Observation:** the pace of merged RISC-V PRs accelerated sharply from a handful per year in 2023-2024 to roughly 10+ per quarter through 2025-2026, tracking the standup of native CI hardware in August 2025 ([#14439](https://github.com/ggml-org/llama.cpp/pull/14439)) and the RISE runner migration in April 2026 ([#21263](https://github.com/ggml-org/llama.cpp/pull/21263)).

---

## 3. Upstream Support Tier

llama.cpp publishes no formal architecture-tier policy (no `PLATFORMS.md`/`SUPPORT.md`). The README's "Supported backends" table lists BLAS, CUDA, HIP, Hexagon, IBM zDNN, Metal, OpenCL, RPC, SYCL, Vulkan, WebGPU, ZenDNN with only one informal qualifier ("[In Progress]" for OpenVINO); RISC-V/RVV is not listed as a "backend" at all, it is a CPU-ISA optimization path inside the generic CPU backend plus the standalone SpacemiT backend.

The de facto criteria applied in PR review are: follow coding/naming conventions, provide CI coverage (ideally on real hardware), designate a `CODEOWNERS` maintainer, and avoid unvetted third-party dependencies. RISC-V satisfies the CI and CODEOWNERS criteria (xctan for `ggml-cpu/arch/riscv/`, alex-spacemit for `ggml-cpu/spacemit/`) but the SpacemiT IME path depends on a non-upstream toolchain (see Section 12).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build | Yes (official) | Yes (official) | Yes -- native CI job builds successfully ([`build-riscv.yml`](https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/build-riscv.yml)) |
| Test | Yes (official) | Yes (official) | Yes -- same CI job runs `ctest -L main --verbose --timeout 900` plus a llama2c conversion + inference smoke test on real riscv64 hardware |
| Release (upstream GitHub Releases) | Yes | Yes | **No** -- releases b11298 through b11303 (checked through 2026-09-30) ship zero riscv64 assets; [issue #20988](https://github.com/ggml-org/llama.cpp/issues/20988) requesting this was closed not-planned |
| CI blocking | Yes, blocks merges | Yes, blocks merges | No -- the PR trigger for `build-riscv.yml` only fires on `ggml/src/ggml-cpu/arch/riscv/**` changes; most PRs never run it |

**Effective tier: build+test verified upstream, release provided only by a third-party distro (Ubuntu's ports archive), not by upstream itself.** This is the basis of the blue color grade (Section 13).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RISC-V is a full, CI-tested CPU backend integrated the same way as x86/ARM/PowerPC/s390x (arch-dispatch via `ggml-cpu/arch/<arch>/`, `GGML_BACKEND_DL_SCORE_IMPL` runtime feature scoring, and `GGML_CPU_ALL_VARIANTS` multi-ISA dynamic dispatch), plus a unique vendor-specific matrix-extension backend for SpacemiT SoCs. No RISC-V assembly (`.S`) files exist anywhere in the tree; all acceleration uses C/C++ compiler intrinsics (`riscv_vector.h`). There is no RISC-V JIT and no RISC-V GPU backend (GPU backends such as CUDA/Vulkan/SYCL are host-architecture-independent).

### 4.1 Core RISC-V directory: `ggml/src/ggml-cpu/arch/riscv/`

| File | Lines | Role |
|---|---|---|
| `quants.c` | 6,596 | Quantize/dequantize + `ggml_vec_dot_*` kernels for every ggml quant type (Q4_0 through Q6_K, IQ*, TQ*) using RVV intrinsics. |
| `repack.cpp` | 1,703 | RVV-accelerated weight-repacking for blocked GEMM/GEMV (`ggml_quantize_mat_q8_0_4x8`, `ggml_gemv_*`, `ggml_gemm_*`), plus `Zvfh` fp16-vector paths. |
| `cpu-feats.cpp` | 38 | Runtime CPU-feature detection via the Linux `riscv_hwprobe` syscall (`RISCV_HWPROBE_KEY_IMA_EXT_0`), used to score the `riscv64_v` (RVV) dynamic backend at load time. |

ISA extensions referenced: V (RVV base vector), Zfh/Zfhmin (scalar half-float), Zvfh (vector half-float), xtheadvector (T-Head vendor variant), plus vsetvl/LMUL-aware intrinsics (`vfloat32m1_t` through `m8_t`, widening/narrowing macc, segmented loads, gather).

### 4.2 Vendor-specific backend: `ggml/src/ggml-cpu/spacemit/` (gated by `GGML_CPU_RISCV64_SPACEMIT`)

| File | Lines | Role |
|---|---|---|
| `ime2_kernels.cpp` | 5,768 | IME2 GEMM/GEMV kernels (largest file in the RISC-V tree). |
| `rvv_kernels.cpp` | 3,178 | Plain-RVV fallback kernels used alongside/underneath IME. |
| `repack.cpp` | 1,795 | SpacemiT-specific weight repacking. |
| `ime.cpp` | 1,742 | Core dispatcher/op registration for the IME backend (requires `__riscv_v`/`__riscv_v_intrinsic`). |
| `ime1_kernels.cpp` | 1,027 | IME1 GEMM/GEMV kernels. |
| `spine_mem_pool.cpp` | 760 | Custom "SPINE" memory-pool allocator for matrix-engine buffers. |
| `ime_env.cpp` | 320 | IME1 vs IME2 feature probing. |
| headers (`ime.h`, `ime_env.h`, `repack.h`, `rvv_kernels.h`, `spine_mem_pool.h`, `spine_barrier.h`, `spine_tcm.h`) | 21-409 each | Support headers. |

Total `spacemit/`: ~15,400 lines. This is documented with real benchmark tables (Qwen3/Qwen3.5/Gemma throughput on X60 and A100 silicon) in `docs/build-riscv64-spacemit.md`, and is not a stub. Overall RISC-V-specific code is ~24,000+ lines.

### 4.3 Build/dispatch integration

`ggml/CMakeLists.txt` exposes `GGML_RVV`, `GGML_RV_ZFH`, `GGML_RV_ZVFH`, `GGML_RV_ZICBOP`, `GGML_RV_ZIHINTPAUSE`, `GGML_RV_ZVFBFWMA` as options; `GGML_RV_ZBA` and `GGML_CPU_RISCV64_SPACEMIT` are used but **not declared as `option()`**, so they must be passed explicitly with `-D` and will not appear in `cmake -L` output. Under `GGML_CPU_ALL_VARIANTS`, two dynamically-loadable CPU backend variants are registered: `riscv64_0` (baseline, no vector) and `riscv64_v` (RVV) -- the same mechanism used for x86 (haswell/skylakex) and ARM (armv8.x/armv9.x) variants.

### 4.4 Comparison vs amd64 / arm64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD dot-product kernels (all quant types) | Yes (AVX2/AVX-512/AMX) | Yes (NEON/SVE, plus KleidiAI) | Yes (RVV 1.0 intrinsics; xtheadvector for T-Head cores) |
| GEMM/GEMV repack tier | Full coverage across quant types | Full coverage across quant types | Partial: Q2_K/Q4_0/Q4_K/Q8_0/IQ4_NL covered via Zvfh; Q3_K, Q5_K, Q6_K, F32 repack not yet covered [NEEDS VERIFICATION on current PR status of the specific gap-closing PRs] |
| Vendor matrix extension | AMX (Intel) | none in-tree | SpacemiT IME1/IME2 (`ggml-cpu/spacemit/`) |
| Dynamic multi-ISA dispatch | Yes (`GGML_CPU_ALL_VARIANTS`) | Yes | Yes (`riscv64_0` / `riscv64_v`) |
| Assembly (`.S`) files | Yes | Some | None -- intrinsics only |
| GPU backend availability | CUDA, Vulkan, SYCL, HIP | Vulkan, Metal | Vulkan scaffolded but disabled in CI (Section 7) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Architecture detection and march-string construction

CMake detects riscv64 via `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv64"`. The `-march` string is assembled incrementally: `rv64gc` + `v` (RVV) + `_zfh` + `_xtheadvector` (mutually exclusive with zvfh/zvfbfwma) + `_zvfh` + `_zvfbfwma` + `_zicbop` + `_zihintpause` + `_zba` + `_xsmtvdotii` (SpacemiT, requires GCC >= 15), always with `-mabi=lp64d`. PR [#20888](https://github.com/ggml-org/llama.cpp/pull/20888) fixed canonical ISA-string ordering, which the assembler requires.

### 5.2 Native CI build command (from `build-riscv.yml`, verbatim)

```
cmake -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_OPENMP=OFF \
  -DLLAMA_BUILD_EXAMPLES=ON \
  -DLLAMA_BUILD_TOOLS=ON \
  -DLLAMA_BUILD_TESTS=ON \
  -DCMAKE_C_COMPILER_LAUNCHER=ccache \
  -DCMAKE_CXX_COMPILER_LAUNCHER=ccache \
  -DGGML_RPC=ON \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc-14 \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++-14
```

Note: this runs on the **native** `ubuntu-24.04-riscv` runner, yet still invokes the cross-compiler-triplet binary names (`riscv64-linux-gnu-gcc-14`) -- the toolchain naming is cross-style even though execution is native. No QEMU is referenced in this file.

### 5.3 SpacemiT cross-compile build command (from `build-cross.yml`, the only active job in that file; runs on x86_64, no QEMU)

```
cmake -B build -DLLAMA_OPENSSL=OFF \
  -DCMAKE_BUILD_TYPE=Release \
  -DLLAMA_BUILD_EXAMPLES=ON \
  -DGGML_CPU_REPACK=OFF \
  -DLLAMA_BUILD_TOOLS=ON \
  -DLLAMA_BUILD_TESTS=OFF \
  -DGGML_CPU_RISCV64_SPACEMIT=ON \
  -DGGML_RVV=ON -DGGML_RV_ZVFH=ON -DGGML_RV_ZFH=ON \
  -DGGML_RV_ZICBOP=ON -DGGML_RV_ZIHINTPAUSE=ON -DGGML_RV_ZBA=ON \
  -DCMAKE_TOOLCHAIN_FILE=${PWD}/cmake/riscv64-spacemit-linux-gnu-gcc.cmake
```

Two additional riscv64 cross-compile jobs (`ubuntu-24-riscv64-cpu-cross`, plain GCC; `ubuntu-24-riscv64-vulkan-cross`, using `apt-get install ... glslc gcc-14-riscv64-linux-gnu libvulkan-dev:riscv64`) exist in `build-cross.yml` but are **fully commented out**, with the code's own TODO: "for regular runs, provision dedicated self-hosted runners."

### 5.4 Toolchain requirements

- GCC >= 14 required for `_zvfh`/`_zvfbfwma` march components; the CI toolchain is `riscv64-linux-gnu-gcc-14`/`g++-14` (Ubuntu 24.04 package).
- GCC >= 15 required for `_xsmtvdotii` (SpacemiT); explicitly gated in CMake code.
- GNU binutils >= 2.40 required for the Zvfh/Zicbop/Zihintpause ISA strings to assemble correctly (motivating the ordering fix in #20888).
- C++17 is the only enforced language standard.
- No official generic riscv64 cross-compile CMake toolchain file exists upstream; only the SpacemiT-specific one (`cmake/riscv64-spacemit-linux-gnu-gcc.cmake`) ships in-tree.

### 5.5 Known build failures (representative, all issue-tracked)

Compile failures have recurred across the port's history: missing-RVV builds (#20669, closed), `GGML_CPU_ALL_VARIANTS=ON` failing on RISC-V (#21064, closed), cross-compile-target errors (#19049, closed), warnings-as-errors breaking cross builds (#12693, closed), and, currently open, [#28986](https://github.com/ggml-org/llama.cpp/issues/28986) ("`vfloat32m8_t` requires the `zve32f` extension," opened 2026-09-16, surfaced while cross-compiling Thunderbird's bundled llama.cpp for riscv64 via snapcraft; the failing code is in `ggml/src/ggml-cpu/vec.h` lines ~403-406 and ~606-609).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Fully implemented on riscv64

All major K-quant vec-dot kernels (Q2_K through Q6_K: RVV, xtheadvector, scalar fallback); Q4_0/Q4_K/Q8_0/Q2_K/IQ4_NL GEMV/GEMM via Zvfh-gated repack kernels; a SIMD-GEMM flash-attention kernel ([#20627](https://github.com/ggml-org/llama.cpp/pull/20627)); dynamic backend dispatch (`GGML_CPU_ALL_VARIANTS`); the SpacemiT IME1/IME2 vendor GEMM backend; FP16/FP32 conversion via Zvfh; runtime CPU-feature detection via `riscv_hwprobe`.

### 6.2 Gaps vs arm64

arm64 additionally has: KleidiAI integration (ARM-only INT8/FP16 matmul, not portable to riscv64); GitHub-hosted (not third-party) CI runners; official pre-built release binaries; and, per PyPI's manifest for `llama-cpp-python`, no wheel of any kind is currently published for either architecture (Section 8.2), so this specific gap is not riscv64-unique.

### 6.3 Known open correctness bugs specific to RVV kernels

| Issue | Title | Status | Detail |
|---|---|---|---|
| [#29131](https://github.com/ggml-org/llama.cpp/issues/29131) | RVV IQ4_NL/MXFP4 dot product errors with odd block counts | Open (2026-09-19) | In `ggml-cpu/arch/riscv/quants.c`, four kernels (`ggml_vec_dot_iq4_nl_q8_0_vl128/vl256`, `ggml_vec_dot_mxfp4_q8_0_vl128/vl256`) use loop guard `ib + 1 < nb`, skipping the final block when `nb` is odd; for `nb=1` the function returns 0 instead of the correct value. Reporter found 10 of 21 MUL_MAT test cases failing. Root cause introduced by PR [#18859](https://github.com/ggml-org/llama.cpp/pull/18859); precedent fix pattern exists in PR #8549. |
| [#28986](https://github.com/ggml-org/llama.cpp/issues/28986) | `vfloat32m8_t` requires `zve32f` extension | Open (2026-09-16) | Compile-time failure, not yet triaged or assigned a fix. |

Both are unresolved as of 2026-09-30 and both fail specifically on the RVV path (not scalar fallback), i.e. a user disabling RVV would sidestep them at a large performance cost.

### 6.4 Historical correctness issues (now closed)

Garbled output on RVV builds (#12124), incorrect output at VLEN > 256 bits (#11041), RVV 16x1 repack hard crash (#22655), SIGILL on SiFive P550 (#24250), wrong RVV-detection macro `__riscv_v_intrinsic` vs `__riscv_v` (#22159, closed not-planned, i.e. flagged but not formally fixed as a distinct patch), and `GGML_RVV=OFF` being silently ignored (#16593).

### 6.5 NaN / floating-point semantics

No dedicated NaN-handling defect was found in the research for this report beyond the general RVV lane-masking bug fixed in PR #8748 (2024, inactive-lane masking switched from agnostic to undisturbed policy, which could otherwise leak garbage/NaN-adjacent values into masked-out vector lanes). `tests/test-double-float.cpp` contains a `riscv` guard for float/double precision edge cases, indicating active awareness of this class of issue.

---

## 7. CI/CD Infrastructure

Upstream runs a **dedicated, native riscv64 CI job**: [`.github/workflows/build-riscv.yml`](https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/build-riscv.yml), job `ubuntu-cpu-riscv64-native`, on the `ubuntu-24.04-riscv` runner label. It builds, then runs `ctest -L main --verbose --timeout 900`, then converts and runs inference on a llama2c-format tinystories model as a functional smoke test. Triggers: manual (`workflow_dispatch`), push to `master` (path-filtered to CMake/source/header files), and PR (opened/synchronize/reopened, path-filtered to this workflow file and `ggml/src/ggml-cpu/arch/riscv/**`).

A second file, `.github/workflows/build-cross.yml`, contains one **active** riscv64 job (`ubuntu-24-riscv64-cpu-spacemit-ime-cross`, x86_64 runner, cross-compiling with the SpacemiT toolchain, build-only, no test execution, weekly cron plus push-on-`master`) and two **disabled** (commented-out) riscv64 jobs: a generic cross-compile and a Vulkan cross-compile, both blocked on the stated need for dedicated self-hosted runners. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repository (confirmed via full tree listing), and no other of the repo's 65 workflow files reference riscv64, including `docker.yml` (no `linux/riscv64` container target) and `release.yml` (Section 8).

**Runner provenance:** the `ubuntu-24.04-riscv` label was originally a Cloud-V (cloud-v.co) self-hosted runner on a physical Banana Pi BPI-F3, introduced by PR [#14439](https://github.com/ggml-org/llama.cpp/pull/14439) (Aug 2025); PR [#21263](https://github.com/ggml-org/llama.cpp/pull/21263) (Apr 2026) migrated CI to RISE Project-provided riscv64 runners. This infrastructure is third-party and not covered by GitHub's SLA -- a prior breakage required a dedicated fix (PR [#17916](https://github.com/ggml-org/llama.cpp/pull/17916)). llama.cpp is reported as the heaviest consumer of this RISE runner pool (2,589 jobs in six weeks, Section 1).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes, GitHub-hosted | Yes, GitHub-hosted | Yes, but on third-party (RISE/Cloud-V) hosted native hardware |
| Build tested | Yes | Yes | Yes |
| Test suite executed | Yes | Yes | Yes (`ctest -L main`, native, plus an inference smoke test) |
| Blocks merge to master | Yes | Yes | No -- path-filtered, most PRs never trigger it |
| SLA | GitHub SLA | GitHub SLA | No SLA; runner availability depends on RISE/Cloud-V |

---

## 8. Distribution and Release Status

### 8.1 GitHub Releases (upstream)

Checked releases b11298 through b11303 (most recent as of 2026-09-30) and the releases page generally: asset categories cover macOS (arm64/x64), iOS XCFramework, Ubuntu (x64, arm64, s390x, various GPU backends), Android, Windows (x64/arm64), and a UI package. **No asset filename contains "riscv" or "riscv64" in any checked release.** [Issue #20988](https://github.com/ggml-org/llama.cpp/issues/20988) requesting riscv64 release assets (mirroring the existing s390x pattern) was **closed not-planned**, but it directly spawned [PR #20991](https://github.com/ggml-org/llama.cpp/pull/20991), which remains **open and unmerged** as of 2026-09-30 (see Section 12 for review history).

### 8.2 Python package (PyPI)

There is no PyPI package literally named `llama-cpp` (HTTP 404). The real binding, `llama-cpp-python`, has its latest release (0.3.35) publish **exactly one file**: a source sdist (`llama_cpp_python-0.3.35.tar.gz`), with **no prebuilt wheels for any architecture**, so there is no riscv64-specific wheel gap distinct from the project's general no-wheel policy. Separately, the RISE GitLab wheel-mirror endpoint for a package named `llama-cpp` redirects to PyPI's simple index and 404s (no such package name there either). Outside of the official PyPI project, a maintainer active on llama.cpp's own riscv64 release PRs (`gounthar`) maintains a **separate, unofficial** riscv64-wheel release for the Python bindings in their own fork (`gounthar/llama-cpp-python`) [single-source, NEEDS VERIFICATION on scope/currency of that fork's wheel]. An earlier claim that upstream `abetlen/llama-cpp-python` had merged a riscv64 CI wheel-build workflow could not be corroborated against current PyPI file listings, which show no wheels published at all; this discrepancy (a claimed merged workflow vs. an sdist-only PyPI project) is unresolved and the claim is marked [NEEDS VERIFICATION].

### 8.3 Linux distributions

**Ubuntu 26.04 ("resolute")**: confirmed riscv64 packages. `llama.cpp-examples`, `llama.cpp-tests`, `llama.cpp-tools`, `llama.cpp-tools-extra` (version `8681+dfsg-1`) are explicitly listed `[ports]: riscv64` in Ubuntu's ports archive; the `llama.cpp` metapackage (architecture: all) pulls these in. `vim-llama.cpp` is also present. This is the basis for the "distro" release-provider classification in Section 13.

An earlier data point held that Debian sid carried a fully-built riscv64 package (`v9601+dfsg-1`, built on host `rv-manda-01`); this was not re-confirmed in the current research pass, which checked Ubuntu resolute rather than Debian sid. Both distributions independently packaging riscv64 builds of llama.cpp from ports archives is plausible and not inherently contradictory, but the Debian-sid figure should be treated as [NEEDS VERIFICATION] until re-checked against `buildd.debian.org`.

### 8.4 Bottom line for a user wanting a working riscv64 binary today

There is no upstream-shipped riscv64 binary. A user must either (a) install from Ubuntu's ports archive (`apt install llama.cpp-tools`, resolute or later), or (b) build from source using the native CI's own CMake invocation (Section 5.2) or the SpacemiT toolchain path (Section 5.3) if targeting SpacemiT hardware.

---

## 9. Dependencies

| Dependency | Relation | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|---|
| CMake | build-dependency | critical | Yes -- used to configure every riscv64 CI job in this report | N/A (build tool) | N/A | No riscv64-specific CMake issues found; general-purpose, portable build tool. |
| GCC | build-dependency | critical | Yes -- native CI uses `gcc-14`/`g++-14`; SpacemiT path needs GCC >= 15 for `_xsmtvdotii` | Exercised via every CI compile | N/A | Version gating is load-bearing: GCC < 14 cannot emit `_zvfh`/`_zvfbfwma` march components; GCC < 15 cannot emit SpacemiT's `_xsmtvdotii`. |
| GNU binutils | build-dependency | critical | Yes -- binutils >= 2.40 required for the assembler to accept Zvfh/Zicbop/Zihintpause in the `-march` string | Exercised via CI link/assemble steps | N/A | PR [#20888](https://github.com/ggml-org/llama.cpp/pull/20888) fixed canonical ISA-string ordering the assembler requires; without it, builds fail. |
| musl | runtime-dependency | optional | Historically broken: [issue #8792](https://github.com/ggml-org/llama.cpp/issues/8792) ("compilation with musl toolchain on RISC-V failure," closed) | No dedicated riscv64+musl CI job found | Not part of any release path | Fixed and closed, but no current CI job continuously validates the musl+riscv64 combination, so regressions could reoccur silently. |
| OpenSSL | runtime-dependency | optional | Yes -- native CI installs `libssl-dev` successfully on `ubuntu-24.04-riscv` (Ubuntu 24.04 ships riscv64 OpenSSL packages) | Exercised indirectly via `ctest -L main`, which links OpenSSL | Cited as a specific review objection blocking PR #20991 (Section 12) | Upstream OpenSSL has its own riscv64 CI; open OpenSSL-side issues include extension-detection problems on musl and flaky test parallelism, none reported as release-blocking for llama.cpp specifically. |
| cpp-httplib | runtime-dependency | optional | Yes -- vendored header-only library (`vendor/cpp-httplib`), pure C++17, no architecture-specific code | Exercised via the same CI as OpenSSL (HTTP server/client for model download and the `llama-server` tool) | N/A (vendored, ships with source) | Portability depends entirely on the OpenSSL dependency for HTTPS. |
| OpenBLAS | runtime-dependency | optional | Not exercised in llama.cpp's own riscv64 CI (BLAS is off by default); Debian trixie ships `libopenblas0:riscv64 0.3.29` per upstream OpenBLAS issue #5811 | Real-hardware regression testing occurred upstream in OpenBLAS via a SpaceMiT K1 (RVV 1.0, VLEN=256) bisection | Distro-packaged, not part of llama.cpp's own release | OpenBLAS issue #5811: DGEMM produced non-PSD matrices on riscv64_zvl256b between v0.3.31 and v0.3.33 (closed/fixed 2026-05-19, a real correctness regression that has since been resolved). Net: active, maturing riscv64 support with a recently-fixed correctness bug. |
| OpenMP | runtime-dependency | optional | **Disabled on riscv64 by llama.cpp's own CI** (`-DGGML_OPENMP=OFF` in `build-riscv.yml`) | Not exercised on riscv64 (disabled) | N/A | The likely reason for the disable: LLVM's own tracked issue "`[riscv][openmp] libomp build fails on risc-v`" has been open since 2024-03-28 [single-source reference from prior research pass, NEEDS VERIFICATION of current status]. |
| Vulkan | runtime-dependency | optional | Not built on riscv64 in any active CI job | No riscv64 Vulkan testing found | Not part of any release | A `ubuntu-24-riscv64-vulkan-cross` job exists in `build-cross.yml` but is commented out/disabled. A historical regression, [issue #8488](https://github.com/ggml-org/llama.cpp/issues/8488) ("Can't build vulkan backend on RISC-V platform anymore," closed), shows this path has broken before. |
| shaderc | build-dependency | optional | Only referenced inside the disabled `ubuntu-24-riscv64-vulkan-cross` job (`apt-get install glslc`) | Not exercised (job disabled) | N/A | Purely a build-time dependency of the disabled Vulkan-on-riscv64 path; no independent riscv64 validation exists for it in this project's context. |
| QEMU | test-dependency | optional | Used historically for early riscv64 bring-up (e.g. [issue #2500](https://github.com/ggml-org/llama.cpp/issues/2500), "qemu-riscv64 unexpectedly reached EOF error," closed) and is documented for SpacemiT emulation in `docs/build-riscv64-spacemit.md` | Not used in the current native CI path (native hardware makes QEMU unnecessary there) | N/A | No current CI job uses QEMU for riscv64; it remains a documented developer workflow for those without physical hardware. |

**Additional indirect dependencies found via research (not in the direct list above):**

- **llguidance** (Rust, optional grammar/structured-output compiler, off by default): zero riscv64-tagged issues found upstream. Rust's `riscv64gc-unknown-linux-gnu` is a Tier-2 target, so it should build, but this is inference from target-tier policy, not a verified build result -- [NEEDS VERIFICATION].
- **Vulkan-Loader / Vulkan-Headers** (Khronos, sub-components pulled in by the Vulkan backend): essentially no riscv64 issue history found; ambiguous whether this means "just works" (mostly portable C) or simply untested on this architecture.
- **Intel SYCL / oneAPI** (`intel/llvm`, optional GPU/accelerator backend): riscv64 is not an officially supported oneAPI/SYCL host or device target; the only related discussion found was informational, not evidence of real support.
- **nlohmann/json, miniaudio, stb, subprocess.h (`vendor/sheredom`)**: vendored, header-only or single-file, no architecture-specific code and no riscv64 issues found.

---

## 11. Known Bugs and Active Issues

| # | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#29131](https://github.com/ggml-org/llama.cpp/issues/29131) | RVV IQ4_NL/MXFP4 dot product errors with odd block counts | **Open** (2026-09-19) | High (correctness) | Silent wrong-answer bug (returns 0 instead of correct dot product for `nb=1`); root cause identified by reporter, fix pattern precedented in PR #8549, but no patch submitted yet. |
| [#28986](https://github.com/ggml-org/llama.cpp/issues/28986) | `vfloat32m8_t` requires `zve32f` extension | **Open** (2026-09-16) | Medium (build) | Compile-time failure surfaced via a downstream package (Thunderbird's bundled llama.cpp); no fix proposed. |
| [#23009](https://github.com/ggml-org/llama.cpp/pull/23009) (PR) | Fix riscv xtheadvector builds + add q1_0 vec dot kernel | **Open** | Medium (build) | Until merged, T-Head-based platforms (SG2042, C906/C910) may build incorrectly. |
| [#22655](https://github.com/ggml-org/llama.cpp/issues/22655) | RVV 16x1 repack hard crash | Closed | High (correctness, historical) | Q8_0 + CPU_REPACK on SpacemiT K1 with prompts >= 4 tokens caused a hard crash requiring reboot; fixed. |
| [#24250](https://github.com/ggml-org/llama.cpp/issues/24250) | SIGILL on SiFive P550 | Closed | High (correctness, historical) | GCC emitted `_Float16` instructions on a CPU lacking Zfh despite `-DGGML_ZFH=0`; illustrates that extension-gating flags do not automatically prevent illegal instructions on non-conforming silicon. |
| [#22159](https://github.com/ggml-org/llama.cpp/issues/22159) | Wrong `__riscv_v_intrinsic` feature-detection macro | Closed, not-planned | Medium | `__riscv_v_intrinsic` is an intrinsic-API version macro, always defined regardless of actual vector hardware presence; using it as a capability guard risks executing vector instructions on non-vector cores. Closed without a confirmed code fix. |
| [#16593](https://github.com/ggml-org/llama.cpp/issues/16593) | `GGML_RVV=OFF` still compiles vector code | Closed | Medium (historical) | Build system ignored the flag; fixed. |
| [#12124](https://github.com/ggml-org/llama.cpp/issues/12124) | Garbled output on RVV builds | Closed (stale) | High (correctness, historical, root cause undocumented) | Disabling RVV intrinsics fixed the symptom; underlying cause in the RVV path was never clearly documented as resolved. |
| [#11041](https://github.com/ggml-org/llama.cpp/issues/11041) | Incorrect output at RVV VLEN > 256 bits | Closed | High (correctness, historical) | |
| [#8488](https://github.com/ggml-org/llama.cpp/issues/8488) | Can't build Vulkan backend on RISC-V | Closed | Medium (historical) | |
| [#8792](https://github.com/ggml-org/llama.cpp/issues/8792) | musl toolchain compile failure on RISC-V | Closed | Medium (historical) | |

**Correctness bugs are the standout category**: two are currently open (#29131, #28986), and the historical record (#12124, #11041, #22655, #24250, #22159) shows a repeated pattern of RVV-path silent-wrong-output or illegal-instruction bugs, several closed without a clearly documented fix. This is the main technical caution for a chip vendor evaluating riscv64 llama.cpp for production numerical accuracy.

---

## 12. Objections and Upstream Blockers

**No master tracking issue.** Unlike some projects that maintain a single umbrella "riscv64 port status" issue, llama.cpp has none. [Issue #20988](https://github.com/ggml-org/llama.cpp/issues/20988) was the closest candidate and was closed not-planned. All work is tracked through dozens of independent issues/PRs with no consolidated view of remaining gaps.

**Release-binary PR is open but has a review history worth tracking closely.** [PR #20991](https://github.com/ggml-org/llama.cpp/pull/20991) ("ci: add riscv64 to release binaries") cross-compiles from a standard Ubuntu 24.04 x64 runner using `gcc-14-riscv64-linux-gnu`, with `GGML_CPU_ALL_VARIANTS=ON` for runtime ISA dispatch. Reviewer CISC initially objected to `LLAMA_OPENSSL=OFF` in the release build ("we don't want a release without [OpenSSL]") and asked for proof of a working build from the author's fork. The author (gounthar) supplied a fork release artifact and separately verified a native build on real BananaPi F3 hardware. Reviewer taronaeo approved on 2026-05-07. Per the most current status available (2026-09-30), the author has since addressed the OpenSSL/TLS and fork-build-evidence requests, and the PR remains **open and unmerged**, still pending a second code-owner approval. A competing/related PR, [#26986](https://github.com/ggml-org/llama.cpp/pull/26986) ("ci: Enable release on ubuntu riscv64"), was closed unmerged on 2026-08-12, suggesting maintainers have not settled on a single approach.

**Two correctness bugs remain open on the RVV path** (#28986, #29131; Section 11), meaning any organization building production inference on riscv64 today should validate IQ4_NL/MXFP4 and `zve32f`-dependent code paths independently rather than assuming upstream CI green means numerically correct.

**xtheadvector is currently affected by an open, unmerged fix** ([#23009](https://github.com/ggml-org/llama.cpp/pull/23009)), meaning T-Head-based platforms (SG2042, C906/C910) may not build cleanly on current master until it lands.

**SpacemiT IME backend depends on a non-upstream toolchain.** The SpacemiT backend uses proprietary instructions (`vmadot`, `vfwmadot`, `xsmtvdotii`) not yet fully in upstream GCC/binutils; the `_xsmtvdotii` component requires GCC >= 15 and, per the CI job, a SpacemiT-provided toolchain package. This was a known maintenance-burden concern at merge time for PR #15288.

**CI infrastructure has no SLA.** The native riscv64 CI depends entirely on RISE-provided runner capacity (migrated from Cloud-V), which is not covered by GitHub's SLA; a prior CI outage required a dedicated fix (#17916), and the two riscv64 cross-compile jobs in `build-cross.yml` remain commented out pending dedicated runner provisioning.

**Distribution gap.** No official PyPI wheel exists for `llama-cpp-python` on any architecture (Section 8.2), so riscv64 is not uniquely disadvantaged there, but it does mean Python-based deployment on riscv64 has no clear low-friction path beyond community forks.

---

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro
- **Justification:** Upstream `ggml-org/llama.cpp` runs a dedicated native riscv64 CI job (`ubuntu-24.04-riscv` runner) in [`.github/workflows/build-riscv.yml`](https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/build-riscv.yml) that both builds and executes the test suite (`ctest -L main --verbose --timeout 900`) plus a llama2c conversion smoke test on real RISC-V hardware, so both the build and test axes are "yes." However, upstream GitHub Releases (checked b11298 through b11303, [releases page](https://github.com/ggml-org/llama.cpp/releases)) ship no riscv64 assets at all -- the request to add them ([issue #20988](https://github.com/ggml-org/llama.cpp/issues/20988)) was closed not-planned, and the follow-on [PR #20991](https://github.com/ggml-org/llama.cpp/pull/20991) is still open/unmerged -- so "release: no" from upstream. Build=yes, test=yes, release=no maps to blue. The only working riscv64 binaries come from Ubuntu's ports archive (`llama.cpp-examples`/`llama.cpp-tests`/`llama.cpp-tools`, version `8681+dfsg-1`, resolute), i.e. a distro, not upstream, hence release_provider is recorded as distro with the note that upstream itself ships no riscv64 release artifact.
- **Pending work that could change the grade:** Open [PR #20991](https://github.com/ggml-org/llama.cpp/pull/20991) ("ci: add riscv64 to release binaries") would close the release gap once merged; it is approved by one reviewer and the author has addressed the earlier OpenSSL/TLS and fork-build-evidence requests, but it remains unmerged as of 2026-09-30. Two open correctness bugs remain on the RVV path ([#28986](https://github.com/ggml-org/llama.cpp/issues/28986), zve32f extension mismatch; [#29131](https://github.com/ggml-org/llama.cpp/issues/29131), RVV IQ4_NL/MXFP4 dot-product error on odd block counts), plus an open PR fixing xtheadvector build breakage ([#23009](https://github.com/ggml-org/llama.cpp/pull/23009)). RISE runner infrastructure (migrated from Cloud-V) backs the native riscv64 CI, and llama.cpp is reportedly RISE's heaviest CI consumer; this is relevant supporting context but does not itself change the color, since the gap is specifically upstream's release-artifact policy, not build/test capability.

---

## 14. Investment Analysis

RISE has already funded and driven a substantial share of the groundwork here: it operates the CI runner pool llama.cpp's riscv64 CI depends on, a named RISE workgroup lead (Ludovic Henry) is credited with optimization work on llama.cpp specifically, and RISE's involvement corresponds with the acceleration in merged RISC-V PRs from 2025 onward (Section 2). A chip vendor's investment should therefore target the gaps RISE and the existing contributor base (10xEngineers, SpacemiT, ISCAS) have not yet closed, rather than duplicating CI infrastructure or basic RVV enablement that already exists.

### 14.1 Functional Enablement

The core functional gap is not "does it build/run" (it does, per Section 3) but **correctness on specific quant-format/VLEN combinations**: the two open bugs (#28986, #29131) and the still-open xtheadvector build fix (#23009) are the concrete, scoped items. None of these require new architecture; they are bounded kernel-level fixes that a chip vendor with RISC-V hardware access could resolve quickly and would materially improve confidence in production correctness.

### 14.2 Performance Optimization

llama.cpp is not evaluated here as an optimization-purpose project (per the readiness grade's optimization-purpose flag), so no formal optimization-level grade applies. That said, published community benchmarks show wide variance by hardware and toolchain: on SpacemiT K3, stock open-source RVV code ran roughly 30-34x slower on the 1024-bit-VLEN A100 cores than on the 256-bit X100 cores, while SpacemiT's closed-source IME2 toolchain reversed this to roughly 1.4x faster ([DEV Community benchmarking series, Part 4](https://dev.to/gounthar/benchmarking-llamacpp-on-spacemit-k3-risc-v-ai-cores-vs-standard-rvv-part-4-10mc)) -- a clear illustration that the open-source RVV path is currently far from saturating wide-VLEN hardware without vendor-proprietary extensions. Separately, PLCT Lab's RVV 1.0 (128-bit) merge in March 2025 was reported as up to a 9x improvement over the prior baseline, and an academic pipeline (arXiv 2503.17422) reported up to 5.5x over baseline llama.cpp on a 64-core platform. Closing the wide-VLEN gap on open kernels (i.e., without depending on SpacemiT's proprietary IME2) is an open, unclaimed investment opportunity distinct from anything RISE is reported to have funded.

### 14.3 CI/CD Infrastructure

RISE already funds and hosts the native riscv64 runner pool and is the heaviest-used consumer relationship llama.cpp has with any RISC-V CI provider (2,589 jobs in six weeks). A chip vendor should not duplicate this. The concrete gaps RISE has not filled: (a) the two disabled cross-compile jobs in `build-cross.yml` (plain riscv64 and Vulkan) remain commented out for lack of dedicated runners; (b) no CI validates the musl+riscv64 combination continuously despite a historical break (#8792); (c) no QEMU-based CI exists for VLEN variants other than the native runner's own VLEN, leaving cross-VLEN correctness (directly relevant to bugs like #11041 and #29131) untested in CI.

### 14.4 Ecosystem Enablement

The main enablement gap is release distribution: unblocking and merging [PR #20991](https://github.com/ggml-org/llama.cpp/pull/20991) would give upstream-shipped riscv64 binaries for the first time, removing the current dependency on Ubuntu's ports archive as the only distribution channel. Given the PR's review history (an approval already secured, author-supplied evidence already provided), the remaining work is primarily maintainer-attention and a second code-owner sign-off rather than new engineering, though a vendor could contribute directly to that review thread or supply additional hardware validation to help it close.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix RVV IQ4_NL/MXFP4 odd-block-count dot-product bug (#29131) | 0.5-1 | Any RISC-V contributor (root cause already identified) | Critical |
| Functional | Fix `vfloat32m8_t`/`zve32f` extension compile bug (#28986) | 0.5-1 | Any contributor | High |
| Functional | Land xtheadvector build fix (open PR #23009) | 0.5 (review push) | Reviewer/maintainer | High |
| Distribution | Help land riscv64 release binaries (open PR #20991) | 0.5-1 (review/validation support) | Any contributor, plus a code-owner approval | High |
| Performance | Close open-source RVV throughput gap on wide-VLEN (>=1024-bit) SpacemiT-class hardware without relying on proprietary IME2 | 3-6 | RISC-V chip vendor / contributor with wide-VLEN hardware | Medium |
| CI | Re-enable disabled riscv64 cross-compile CI jobs (plain + Vulkan) in `build-cross.yml` with dedicated runners | 1-2 | RISC-V chip vendor (runner provisioning) | Medium |
| CI | Add QEMU-based CI across multiple VLENs (128/256/512/1024) to catch VLEN-dependent correctness bugs before hardware CI does | 2-4 | Any contributor | Medium |
| Ecosystem | Validate/restore a musl+riscv64 CI job (regression risk after #8792) | 1 | Any contributor | Low |
| Documentation | Establish a single riscv64 port-status tracking issue | 0.5 | Any contributor | Low |

---

## 15. References

- [llama.cpp repository (ggml-org)](https://github.com/ggml-org/llama.cpp)
- [ggml-org organization](https://github.com/ggml-org)
- [build-riscv.yml CI workflow](https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/build-riscv.yml)
- [RISE Project](https://riseproject.dev)
- [RISE RISC-V Runners: six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Q1 2026 Outsized Impact Award](https://riseproject.dev/2026/04/21/rise-outsized-impact-award-q1-2026/)
- [Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISC-V Optimization Guide (RISE)](https://riscv-optimization-guide.riseproject.dev/)
- [Issue #165 -- origin RISC-V support request](https://github.com/ggml-org/llama.cpp/issues/165)
- [Issue #3191 -- automating CI for RISC-V](https://github.com/ggml-org/llama.cpp/issues/3191)
- [Issue #20988 -- feature request: riscv64 release binaries (closed not-planned)](https://github.com/ggml-org/llama.cpp/issues/20988)
- [PR #20991 -- add riscv64 to release binaries (open)](https://github.com/ggml-org/llama.cpp/pull/20991)
- [PR #26986 -- competing release-enable PR (closed unmerged)](https://github.com/ggml-org/llama.cpp/pull/26986)
- [Issue #28986 -- vfloat32m8_t / zve32f compile bug (open)](https://github.com/ggml-org/llama.cpp/issues/28986)
- [Issue #29131 -- RVV IQ4_NL/MXFP4 odd-block dot-product bug (open)](https://github.com/ggml-org/llama.cpp/issues/29131)
- [PR #18859 -- RVV vec dot kernels that introduced the #29131 bug](https://github.com/ggml-org/llama.cpp/pull/18859)
- [PR #23009 -- xtheadvector build fix (open)](https://github.com/ggml-org/llama.cpp/pull/23009)
- [PR #1616 -- foundational RISC-V support](https://github.com/ggml-org/llama.cpp/pull/1616)
- [PR #2929 -- first RVV intrinsics](https://github.com/ggml-org/llama.cpp/pull/2929)
- [PR #12530 -- 128-bit RVV support](https://github.com/ggml-org/llama.cpp/pull/12530)
- [PR #13720 -- xtheadvector support](https://github.com/ggml-org/llama.cpp/pull/13720)
- [PR #14439 -- native RISC-V CI hardware](https://github.com/ggml-org/llama.cpp/pull/14439)
- [PR #15288 -- SpacemiT backend](https://github.com/ggml-org/llama.cpp/pull/15288)
- [PR #17461 -- RISC-V cpu-feats](https://github.com/ggml-org/llama.cpp/pull/17461)
- [PR #17567 -- riscv_hwprobe detection fix](https://github.com/ggml-org/llama.cpp/pull/17567)
- [PR #20627 -- SIMD-GEMM for RVV](https://github.com/ggml-org/llama.cpp/pull/20627)
- [PR #20888 -- CMake ISA string ordering fix](https://github.com/ggml-org/llama.cpp/pull/20888)
- [PR #21263 -- migrate CI to RISE runners](https://github.com/ggml-org/llama.cpp/pull/21263)
- [PR #22863 -- SpacemiT IME2 support](https://github.com/ggml-org/llama.cpp/pull/22863)
- [Issue #22655 -- RVV 16x1 repack crash (closed)](https://github.com/ggml-org/llama.cpp/issues/22655)
- [Issue #24250 -- SIGILL on SiFive P550 (closed)](https://github.com/ggml-org/llama.cpp/issues/24250)
- [Issue #8488 -- Vulkan backend broken on RISC-V (closed)](https://github.com/ggml-org/llama.cpp/issues/8488)
- [Issue #8792 -- musl toolchain compile failure (closed)](https://github.com/ggml-org/llama.cpp/issues/8792)
- [OpenBLAS issue #5811 -- riscv64_zvl256b DGEMM correctness regression (fixed)](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [Benchmarking llama.cpp on SpacemiT K3, Part 4 (DEV Community)](https://dev.to/gounthar/benchmarking-llamacpp-on-spacemit-k3-risc-v-ai-cores-vs-standard-rvv-part-4-10mc)
- [Running a Local LLM on RISC-V: Banana Pi F3, Part 1 (DEV Community)](https://dev.to/gounthar/running-a-local-llm-on-risc-v-building-llamacpp-on-a-banana-pi-f3-part-1-4d5g)
- [PLCT Lab: RVV 1.0 support merged upstream](https://plctlab.org/en/news/085/)
- [arXiv 2503.17422 -- RISC-V LLM inference optimization pipeline](https://arxiv.org/pdf/2503.17422v1.pdf)
- [OpenBenchmarking.org -- Llama-cpp-k3 result set](https://openbenchmarking.org/result/2605258-NE-LLAMACPPK74&sor&rro)