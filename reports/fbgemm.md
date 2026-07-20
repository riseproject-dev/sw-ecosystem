---
title: FBGEMM
categories:
  - ai-ml
---

# FBGEMM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for FBGEMM
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

FBGEMM (Facebook GEMM) is Meta's high-performance low-level GEMM and quantized GEMM library. It serves as the primary backend for PyTorch quantized operators on x86 machines and, more recently, AArch64. The library provides manually tuned SIMD kernels for INT8, INT16, FP16, BF16, and FP32 matrix multiplication, embedding table lookup (Sparse Dense Matrix Multiply, SpMDM), and depthwise convolution. It is architecturally distinct from a reference BLAS: kernels are generated at runtime via the asmjit JIT framework, and the dispatch table is populated by build-time ISA probing and runtime CPUID.

**Governance:** Meta-controlled. No foundation membership (not Linux Foundation, not Apache, not RISE). No MAINTAINERS, OWNERS, or CODEOWNERS file. Contribution requires signing the Meta CLA. Development happens internally at Meta and is synced to GitHub via the `meta-codesync[bot]` pipeline. There is no TSC, no governance committee, and no public RFC process.

**License:** BSD (permissive).

**Corporate sponsors:** Meta is the dominant maintainer. Google (`pganssle-google`) has made isolated contributions. No other corporate affiliates are identifiable from public commit history.

**Community culture toward new ports:** Effectively absent. The repository has one unanswered RISC-V question from 2023 (issue [#2101](https://github.com/pytorch/FBGEMM/issues/2101)). The recent removal of AArch64 compatibility shims (PRs [#5779](https://github.com/pytorch/FBGEMM/pull/5779) and [#5921](https://github.com/pytorch/FBGEMM/pull/5921), May-June 2026) indicates Meta is actively reducing generic code paths, not broadening architecture coverage. A RISC-V port would require either Meta internal interest or a community contributor willing to deliver CMake detection, RVV kernels, and CI coverage, with no existing precedent or expressed maintainer support.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Oct 28, 2023 | User `condy0919` opens issue [#2101](https://github.com/pytorch/FBGEMM/issues/2101): "porting fp16 multiplication of fbgemm to riscv" -- asks about `partition_avx512` auto-tuning. No maintainer response. No PR follows. | [GitHub issue #2101](https://github.com/pytorch/FBGEMM/issues/2101) |
| (never) | First RISC-V commit | No commits containing "riscv" exist in pytorch/FBGEMM |
| (never) | Tracking issue opened | No tracking issue exists |
| (never) | RISE project involvement | Not listed in any RISE blog post, project page, or wheel builder |

There is no RISC-V port history. The single community reference is an unanswered 2023 question from an individual learning the codebase.

---

## 3. Upstream Support Tier

FBGEMM has no documented tier policy for architecture support. There is no PLATFORMS.md, SUPPORT.md, or equivalent. Architecture scope is inferred from the CMakeLists.txt processor detection and the CI matrix.

| Dimension | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CMake detection | Yes -- `x86_64\|amd64\|AMD64\|i386\|i686` branch | Yes -- `aarch64\|ARM64\|arm64` branch | No -- falls through silently |
| ISA-specific kernels | Full (AVX2, AVX512, VNNI, BF16) | Partial (NEON, SVE, SVE2, KleidiAI) | None |
| CI build | Yes | Yes | No |
| CI test | Yes | Yes | No |
| Release wheels (PyPI) | Yes -- all 5 wheels in v1.7.0 are `manylinux_2_28_x86_64` | None [NEEDS VERIFICATION -- no aarch64 wheel found on PyPI] | None |
| Blocking status | Primary target | Secondary target | Not a target |

The aarch64 tier is receiving active investment as of June 2026 (native NEON kernels replacing compatibility shims, ArmPL replacing MKL for benchmarks). riscv64 is not a recognized tier.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

FBGEMM's architecture-specific engineering consists of four layers: (1) JIT code emission via asmjit, (2) hand-written C++ SIMD intrinsic kernels, (3) runtime ISA dispatch via cpuinfo, and (4) a build-time autovectorized fallback. Each layer is examined below.

### 4.1 JIT Code Generation (asmjit)

asmjit is a hard build dependency linked to all FBGEMM targets, including the autovec target. It supports only x86/x64 and AArch64 backends. RISC-V is listed as "Pending / Not supported" on the asmjit roadmap with no timeline and no maintainer assigned. asmjit compiles on riscv64 (the library has a no-op path) but provides no RVV or RISC-V assembler backend. JIT kernel emission is entirely non-functional on riscv64.

### 4.2 SIMD Dispatch Table

The `inst_set_t` enum in `include/fbgemm/SimdUtils.h` defines: `anyarch`, `avx2`, `avx512`, `avx512_ymm`, `avx512_vnni`, `avx512_vnni_ymm`, `sve`. No `rvv` value exists. The `fbgemmPacked()` dispatch has a `default` branch that throws `std::runtime_error("unknown architecture")`. On riscv64, any GEMM call reaches this branch and crashes.

### 4.3 Architecture-Specific Source Files

| Architecture | Source Files | Header Files | Kernel Type |
|---|---|---|---|
| x86 AVX2 | 15+ | 8+ | Hand-tuned intrinsics + asmjit JIT |
| x86 AVX512/VNNI | 10+ | 5+ | Hand-tuned intrinsics + asmjit JIT |
| AArch64 NEON | 3 | 3 | C++ intrinsics |
| AArch64 SVE/SVE2 | 4 | 3 | C++ intrinsics (GCC>=14 / Clang>=17) |
| AArch64 KleidiAI | 2 | 2 | Vendor micro-kernel library (ARM Ltd.) |
| riscv64 | 0 | 0 | Missing |

No file in the repository `src/` or `include/` directory contains the strings `riscv`, `rvv`, `rv64`, or `vfloat32m1_t`.

### 4.4 Per-Component Coverage

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| FP16 GEMM (`FbgemmFP16`) | Full -- AVX2/AVX512 JIT kernels | Partial -- SVE128 + KleidiAI | Missing |
| FP32 GEMM | Full -- AVX2/AVX512 | Partial -- KleidiAI NEON | Missing |
| Embedding SpMDM (TBE) | Full -- AVX2/AVX512 | Partial -- autovec + SVE | Missing |
| INT8 quantized GEMM | Full -- AVX2/AVX512/VNNI | Partial -- NEON quant utils | Missing |
| Sparse dense ops | Full -- AVX2/AVX512 | Missing | Missing |
| Groupwise conv | Full -- AVX2/AVX512 | Missing | Missing |
| FP16/BF16 convert | Full -- AVX2/AVX512 | Partial -- SVE | Missing |
| Quantization utils | Full -- AVX2/AVX512 | Partial -- NEON | Missing |
| Transpose utils | Full -- AVX2 | Partial -- NEON/SVE | Missing |
| Runtime ISA dispatch | Functional | Functional | Crashes (throws at runtime) |

### 4.5 Autovectorization Fallback

`EmbeddingSpMDMAutovec.cc` uses compiler auto-vectorization without architecture-specific intrinsics. This file would compile on riscv64 with `-march=rv64gcv`, and the compiler could emit RVV instructions. However: (a) asmjit is still linked, (b) the dispatch table in `Utils.h` does not include an RVV branch, so the autovec path is only reached as an unrecognized-architecture fallback, not a first-class RVV path. The `RefImplementations.cc` scalar layer exists but routes only from test scaffolding, not from the production dispatch.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Supported Architectures in CMakeLists.txt

The root `CMakeLists.txt` gates ISA-specific code behind `CMAKE_SYSTEM_PROCESSOR` regex:

- x86/x64: `"x86_64|amd64|AMD64|i386|i686"` -- activates AVX2 and AVX512 targets
- AArch64: `"aarch64|ARM64|arm64"` -- activates NEON, SVE, SVE2, KleidiAI targets

riscv64 falls through both branches with no explicit rejection. The build succeeds but produces only generic/scalar code.

### 5.2 Standard Build Commands (from official [BuildInstructions.rst](https://github.com/pytorch/FBGEMM/tree/main/fbgemm_gpu/docs/src/fbgemm/development/BuildInstructions.rst))

```
cmake -DFBGEMM_BUILD_TESTS=0 \
      -DFBGEMM_BUILD_BENCHMARKS=OFF \
      -DCMAKE_BUILD_TYPE=Release \
      ..
cmake --build . --parallel
```

No riscv64-specific flags exist. No cross-compilation toolchain files (`cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`) exist in the repository.

### 5.3 Compiler Version Requirements

| Requirement | Minimum | Enforcement |
|---|---|---|
| CMake | 3.21 | `cmake_minimum_required` -- fatal |
| C++ standard | C++20 | Fatal error if `CMAKE_CXX_STANDARD < 20` |
| GCC (fbgemm_gpu) | 11.4 | Fatal error in `fbgemm_gpu/CMakeLists.txt` |
| Clang (fbgemm_gpu) | 16.0.6 | Fatal error in `fbgemm_gpu/CMakeLists.txt` |
| GCC for SVE/SVE2 | 14+ | Guards `arm_neon_sve_bridge.h` availability |
| Clang for SVE/SVE2 | 17+ | Same guard |

The C++20 requirement is enforceable on riscv64 with GCC>=11 or Clang>=13, both available in Debian sid and Ubuntu 24.04.

### 5.4 riscv64 Build Path (Hypothetical)

If built on riscv64:
1. CMake detects `CMAKE_SYSTEM_PROCESSOR=riscv64`
2. Neither x86 nor AArch64 branch matches
3. Only generic C++ reference files compile -- no SIMD optimization
4. Build technically succeeds (no explicit `FATAL_ERROR` for unrecognized arch)
5. Runtime: any GEMM call hits `default` branch and throws `std::runtime_error`
6. Only `EmbeddingSpMDMAutovec.cc` provides a viable (but untuned) code path

### 5.5 QEMU Usage

No QEMU usage exists in any CI workflow or build documentation. AArch64 CI uses native AWS Graviton runners, not emulation.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

The production dispatch path crashes on riscv64 for all GEMM operations. This is not a missing-optimization issue -- it is a correctness failure. Any PyTorch model running quantized operators on riscv64 will encounter a hard runtime exception when FBGEMM is invoked.

The autovec fallback path (`EmbeddingSpMDMAutovec.cc`) is the only code that would execute correctly on riscv64, covering only embedding lookup operations and only when the dispatch is explicitly routed to autovec (which does not happen today on unrecognized architectures by default -- the dispatch throws before reaching autovec for GEMM calls).

### 6.2 Performance Gaps

Data not available: no riscv64 FBGEMM benchmark data exists in any public source. Published benchmarks from Meta (2018) cover only Intel Xeon E5-2680 v4 (x86 Broadwell). No arm64 vs riscv64 vs x86_64 comparative figures exist.

Structurally: all published performance gains from FBGEMM (up to 2.4x speedup on production workloads) come from AVX-512 VNNI and AVX2 microkernels. Without RVV kernels, a riscv64 build would operate at scalar throughput only, approximately 4-8x slower than a comparable AVX2 implementation on equivalent clock rates [NEEDS VERIFICATION -- estimate based on SIMD width ratio, not measured data].

### 6.3 NaN / Floating-Point Semantics

PR [#5843](https://github.com/pytorch/FBGEMM/pull/5843) (closed June 2026, not merged) identified a correctness bug on AArch64+SVE: the `HAVE_SVE` branch of `Fused8BitRowwiseQuantizedSBFloatToFloatOrHalf` silently ignored the `is_uint16_t_of_type_bf16` template parameter, routing bf16 callers to fp16 bit patterns. The fix routes bf16 output to the scalar Ref kernel on SVE. This class of dispatch-table correctness bug would affect any new architecture, including riscv64, at every point where an ISA-specific specialization is absent but not explicitly guarded.

Additionally, the AVX2 and NEON fp32->bf16 helpers use round-half-away-from-zero rather than round-to-nearest-even, differing by up to 1 ULP from scalar and AVX-512 paths. A riscv64 scalar fallback would use round-to-nearest-even, producing numerically different results from the x86 production path.

---

## 7. CI/CD Infrastructure

### 7.1 FBGEMM CI Matrix

All 22 workflow files in `.github/workflows/` were examined. Zero files contain "riscv", "riscv64", "rv64", or any RISC-V reference.

The primary CI (`fbgemm_ci.yml`) matrix:
```
{ arch: x86, instance: "linux.12xlarge" }
{ arch: arm, instance: "linux.arm64.m7g.4xlarge" }
```

The CPU wheel build matrix covers `build_wheels_linux_x86.yml` and `build_wheels_linux_aarch64.yml`. No QEMU emulation jobs exist for any architecture.

| CI Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | No |
| Test CI | Yes | Yes | No |
| Wheel build CI | Yes | Yes (aarch64 workflow exists) | No |
| GPU CI (CUDA/ROCm) | Yes | No | No |
| Native hardware runner | Yes (x86 AWS) | Yes (Graviton AWS) | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |

### 7.2 RISE Project Involvement

FBGEMM does not appear in any RISE project blog post, project page, wiki, or wheel builder listing. The RISE wheel builder (riseproject.gitlab.io) does not list fbgemm or fbgemm-gpu. GitHub API search `FBGEMM org:riseproject-dev` returns 0 results.

---

## 8. Distribution and Release Status

| Channel | riscv64 Available | Notes |
|---|---|---|
| PyPI (`fbgemm-gpu`) | No | All 5 wheels in v1.7.0 are `manylinux_2_28_x86_64` only. This holds across all 10 published releases (v0.8.0 through v1.7.0). |
| PyPI (`fbgemm`) | No | HTTP 404 -- package does not exist. |
| GitHub Releases | No | Releases v1.3.0 through v1.7.0 contain only source tarballs (2 default GitHub assets each). No binary assets of any kind. |
| RISE wheel builder | No | Not listed. |
| Ubuntu 24.04 (noble) | No | Zero results for "FBGEMM" in Ubuntu package search. |
| Debian (any suite) | No | HTTP 404 on Debian tracker; "No packages found" in package search across all suites. |
| Arch Linux RISC-V | No | Not found in archriscv.felixc.at index. |
| Fedora | Data not available: Fedora package search was not checked. |

To use FBGEMM on riscv64 today, a user must build from source, accept the scalar/autovec-only fallback (no GEMM JIT), and patch the dispatch table to avoid the `throw std::runtime_error` on GEMM calls. No pre-built path exists.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking for FBGEMM riscv64 |
|---|---|---|---|---|---|
| asmjit | JIT code generation for all kernel targets | Compiles (no-op) | No | No | Yes -- primary blocker; no RVV backend |
| cpuinfo | CPU feature detection, ISA dispatch | Partial (builds, skeleton) | Build-only | No | Partial -- ISA detection incomplete |
| OpenMP | Parallel threading | Full | Full | Distro packages available | No |
| Python (build-time) | CMake configure helper | Full | N/A | N/A | No |
| GTest | Unit test framework | Full | Mostly (one flaky test) | N/A | No |
| MKL (bench only) | BLAS backend for benchmarks | Not available (Intel product) | N/A | N/A | No (bench only) |
| KleidiAI | ARM micro-kernels | N/A (AArch64 guard) | N/A | N/A | No |

### 9.2 asmjit (Primary Blocker)

[asmjit](https://github.com/asmjit/asmjit) is linked to every FBGEMM build target. Its architecture support is x86/x64 and AArch64. The [asmjit roadmap](https://asmjit.com/roadmap.html) lists RISC-V as "Pending" with no timeline and no assigned maintainer. asmjit issue [#332](https://github.com/asmjit/asmjit/issues/332) (closed as a question) confirms no concrete plan exists. On riscv64, asmjit compiles but cannot emit any instructions -- all JIT paths are non-functional. FBGEMM's GEMM kernels depend on JIT emission; without a working asmjit RVV backend, they cannot execute. This is not a performance gap -- it is a hard functional blocker.

### 9.3 cpuinfo

[pytorch/cpuinfo](https://github.com/pytorch/cpuinfo) has partial riscv64 support. PR #190 (merged Nov 2023) added skeleton support; PR #375 (merged Apr 2026) adds `cpuinfo_has_riscv_zfh()` and `cpuinfo_has_riscv_zvfh()`. CI runs build-only on riscv64 under QEMU -- no functional tests. Uarch always returns "unknown." Cache info is empty. Two open PRs (issue #148, PR #397) propose improved detection using Linux `hwprobe` and sysfs cache topology, but both lack reviewers. For FBGEMM, cpuinfo returning partial ISA data on riscv64 would cause fallback to scalar/autovec kernels -- correct behavior, but the JIT crash occurs before ISA dispatch is reached.

---

## 11. Known Bugs and Active Issues

### 11.1 RISC-V Specific

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2101](https://github.com/pytorch/FBGEMM/issues/2101) | "How `partition_avx512` is auto-tuned?" | Open, unanswered | N/A (community question) | Only RISC-V mention in the repository. User `condy0919` was porting fp16 GEMM to RISC-V and hit the AVX512-specific static partition lookup table. No maintainer response. The partition table is hardcoded for AVX-512 register counts and would need a separate table auto-tuned for RVV LMUL widths. |

### 11.2 Architecture-Porting Related (Non-RISC-V)

| ID | Title | Status | Severity | Relevance to RISC-V |
|---|---|---|---|---|
| [PR #5779](https://github.com/pytorch/FBGEMM/pull/5779) | Implement PackDepthwiseConvMatrix in NEON + deprecate aarch64 compat layers | Merged May 2026 | -- | Removes the compatibility shims that non-x86 platforms previously relied on for compilation. After this PR, riscv64 encounters compile failures without its own kernel path. |
| [PR #5921](https://github.com/pytorch/FBGEMM/pull/5921) | Remove aarch64 compatibility layers | Merged June 2026 | -- | Completes compat-layer removal. Codebase is now strictly x86+MKL or aarch64+armpl. No generic path remains for other architectures in the core. |
| [PR #5813](https://github.com/pytorch/FBGEMM/pull/5813) | Fix aarch64+gcc OSS build break | Merged June 2026 | -- | Required days after #5779 due to ISA-specific intrinsics leaking into generic code. Illustrates the fragility of new-architecture ports -- a RISC-V contributor would face the same and would need to self-maintain fixes. |
| [PR #5843](https://github.com/pytorch/FBGEMM/pull/5843) | Fix bf16 dequant: SVE 8-bit fallback, rounding docs, robust test | Closed (not merged) June 2026 | Medium (correctness) | Demonstrates the dispatch-table correctness risk for any architecture without full kernel coverage: missing ISA specialization silently produces wrong bit patterns. |

### 11.3 General Open Correctness Bugs

| ID | Title | Status | Severity |
|---|---|---|---|
| [#5326](https://github.com/pytorch/FBGEMM/issues/5326) | Incorrect (zeroed) embedding_lookup results when embedding_dim > 1024 | Open | High -- correctness |
| [#5088](https://github.com/pytorch/FBGEMM/issues/5088) | Fix NAN for the prediction | Open | High -- correctness |
| [#5736](https://github.com/pytorch/FBGEMM/issues/5736) | Make float16/bfloat16 distinct types | Open | Medium -- type safety |

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. asmjit has no RVV backend. This is not an FBGEMM issue -- it is a dependency project decision. Filing an issue or contributing an RVV backend to asmjit is prerequisite work, independent of FBGEMM itself, requiring separate effort and a separate upstream acceptance process.

2. The `inst_set_t` enum and all dispatch tables must be extended. Every call site that dispatches on architecture (GEMM, SpMDM, quantization, transpose) has a `default` branch that throws. Adding RVV requires a new enum value and a new branch in each dispatch function.

3. Static partition tables in the FP16 GEMM path (`cblas_gemm_compute`) are hardcoded for AVX-512 register geometry. A RISC-V port requires either auto-tuning a new table for RVV LMUL configurations or replacing the static table with runtime-determined tiling.

4. Recent removal of compatibility shims (PRs #5779, #5921, June 2026) means the codebase is now more hostile to new architectures than it was in 2023 when the only community porting attempt occurred.

**Organizational blockers:**

1. Meta has no expressed interest in RISC-V. The internal-sync governance model means a RISC-V port funded externally would arrive as external PRs, which have no prioritized review path.

2. FBGEMM is GPU-focused in its active development trajectory (CUDA, ROCm, MTIA). The CPU library is maintained but not receiving new architecture investment beyond ARM.

3. No RISE project involvement. There is no working group, funding, or committed contributor organization driving this work.

**Acceptance probability:** Low for a complete port in the near term. A minimal build enablement patch (prevent the cmake fall-through from producing a silently broken binary) has a higher acceptance probability. Full RVV kernel contribution faces the same barriers as any large new-architecture patch to a Meta-controlled project.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The minimum required to run any FBGEMM operation on riscv64 without crashing:

- Patch the dispatch table `default` branch to fall through to scalar/autovec rather than throw. This unblocks embedding lookup (SpMDM autovec path) on riscv64.
- Fix CMakeLists.txt to explicitly recognize riscv64 and define a compiler flag set, even if only `-march=rv64gc` for the scalar build.
- Disable the JIT path (asmjit) for riscv64 at compile time to avoid linking a non-functional code generator.

This does not enable optimized GEMM -- it enables non-crashing execution on SpMDM workloads only.

For full GEMM functionality, an RVV backend for asmjit is required first. That is prerequisite work outside FBGEMM.

### 13.2 Performance Optimization

No RVV microkernels exist as a starting point. The AArch64 NEON work provides a structural template: separate `.cc` files per kernel, intrinsic-based, with ISA guards in the dispatch. The AArch64 port took sustained Meta engineer effort over multiple quarters. An equivalent RVV port (covering FP16 GEMM, INT8 GEMM, SpMDM, quantization utilities) is a multi-quarter effort.

The partition auto-tuning problem (issue #2101) adds scope: RVV kernels need a separate table auto-tuned for RVV register file characteristics (LMUL, VLEN), which requires a tuning harness and hardware or high-fidelity emulation.

### 13.3 CI/CD Infrastructure

RISE GitHub Actions runners for riscv64 are available (per RISE blog, free for open-source projects). Adding a riscv64 CI job to `fbgemm_ci.yml` is low effort once a working build exists. The prerequisite is the functional enablement work above.

### 13.4 Ecosystem Enablement

FBGEMM does not have its own downstream package ecosystem. It is a dependency of PyTorch. Enabling FBGEMM on riscv64 is prerequisite to fully enabling PyTorch CPU quantization on riscv64. The inverse is not true -- PyTorch can build on riscv64 with FBGEMM disabled.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch dispatch table: `default` branch falls through to scalar/autovec instead of throwing; disable JIT path for riscv64 | 2 | FBGEMM contributor | Critical |
| Functional | CMakeLists.txt: add riscv64 processor detection, basic compiler flags | 1 | FBGEMM contributor | Critical |
| Functional | asmjit RVV backend (prerequisite -- separate project) | 40-80 | asmjit community / sponsored contributor | Critical (blocks JIT GEMM) |
| Performance | RVV FP16 GEMM microkernels + partition table auto-tuning | 20 | riscv64 SIMD specialist | High |
| Performance | RVV INT8/INT16 quantized GEMM microkernels | 20 | riscv64 SIMD specialist | High |
| Performance | RVV SpMDM (embedding lookup) kernels | 12 | riscv64 SIMD specialist | High |
| Performance | RVV quantization utilities (quant/dequant, transpose) | 8 | riscv64 SIMD specialist | Medium |
| CI/CD | Add riscv64 CI job using RISE runners (build + test) | 1 | CI engineer | High (after functional work) |
| CI/CD | riscv64 wheel build in `build_wheels_linux_riscv64.yml` | 2 | CI engineer | Medium |

Total for minimal non-crashing build: approximately 3 person-weeks (excluding asmjit).
Total for functional + partial RVV performance: approximately 63 person-weeks (excluding asmjit RVV backend, which is the dominant unknown).

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [pytorch/FBGEMM repository](https://github.com/pytorch/FBGEMM)
- [FBGEMM issue #2101 -- "How partition_avx512 is auto-tuned?" (RISC-V porting question, open, unanswered)](https://github.com/pytorch/FBGEMM/issues/2101)
- [FBGEMM PR #5779 -- Implement PackDepthwiseConvMatrix in NEON + deprecate aarch64 compat layers (merged May 2026)](https://github.com/pytorch/FBGEMM/pull/5779)
- [FBGEMM PR #5921 -- Remove aarch64 compatibility layers (merged June 2026)](https://github.com/pytorch/FBGEMM/pull/5921)
- [FBGEMM PR #5813 -- Fix aarch64+gcc OSS build break (merged June 2026)](https://github.com/pytorch/FBGEMM/pull/5813)
- [FBGEMM PR #5843 -- Fix bf16 dequant: SVE 8-bit fallback (closed June 2026)](https://github.com/pytorch/FBGEMM/pull/5843)
- [FBGEMM issue #5326 -- Incorrect embedding_lookup results when embedding_dim > 1024 (open)](https://github.com/pytorch/FBGEMM/issues/5326)
- [FBGEMM issue #5088 -- Fix NAN for the prediction (open)](https://github.com/pytorch/FBGEMM/issues/5088)
- [FBGEMM issue #5736 -- Make float16/bfloat16 distinct types (open)](https://github.com/pytorch/FBGEMM/issues/5736)
- [fbgemm-gpu on PyPI -- v1.7.0, manylinux_2_28_x86_64 only](https://pypi.org/project/fbgemm-gpu/)
- [asmjit roadmap -- RISC-V listed as Pending](https://asmjit.com/roadmap.html)
- [asmjit issue #332 -- RISC-V support question (closed)](https://github.com/asmjit/asmjit/issues/332)
- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [RISE project website](https://riseproject.dev)
- [FBGEMM build instructions (official)](https://github.com/pytorch/FBGEMM/tree/main/fbgemm_gpu/docs/src/fbgemm/development/BuildInstructions.rst)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [Debian package tracker -- fbgemm (404)](https://tracker.debian.org/pkg/fbgemm)