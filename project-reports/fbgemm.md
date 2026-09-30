---
title: FBGEMM
parent: Project Reports
color: red
dependencies:
  - name: asmjit
    relation: runtime-dependency
    criticality: critical
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="fbgemm" %}

# FBGEMM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** red<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for FBGEMM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

FBGEMM (Facebook GEMM) is Meta's high-performance low-level GEMM and quantized GEMM library. It is the primary backend for PyTorch's quantized CPU operators on x86 machines and, more recently, AArch64. The library provides manually tuned SIMD kernels for INT8, INT16, FP16, BF16, and FP32 matrix multiplication, embedding table lookup (Sparse Dense Matrix Multiply, SpMDM), and depthwise convolution. Architecturally it differs from a reference BLAS: GEMM kernels are generated at runtime via the asmjit JIT framework, and the ISA dispatch table is populated by build-time processor detection plus runtime CPUID/cpuinfo probing.

**Governance:** Meta-controlled, hosted under the `pytorch` GitHub org. No `GOVERNANCE.md`, `MAINTAINERS.md`, `PLATFORMS.md`, or `SUPPORT.md` exist in the repository (all return 404). There is no TSC and no public RFC process. Community interaction happens via GitHub Issues/Discussions and a `#fbgemm` channel on PyTorch Slack. No PyTorch Foundation/Linux Foundation charter text is published on the repo itself.

**License:** BSD (permissive).

**Corporate sponsors:** Meta is the dominant and effectively sole corporate maintainer; the project originated at Facebook. No named MAINTAINERS/CODEOWNERS roster with company affiliations could be identified from primary sources (both files return 404/not found). Isolated outside contributions exist (e.g. Google) but no second corporate maintainer organization is identifiable.

**Community culture toward new ports:** Effectively absent for RISC-V. The only RISC-V-related community signal in the repository's entire history is one unanswered 2023 issue ([#2101](https://github.com/pytorch/FBGEMM/issues/2101)). No RISC-V PR, commit, or tracking issue has ever been opened. The one existing non-Meta hardware port that does exist, **fbgemm-ascend** (a community-maintained Huawei Ascend NPU implementation of selected FBGEMM_GPU operators, distributed via PyPI/GitCode, not RISC-V), is explicitly labeled "community-maintained" rather than integrated upstream, suggesting third-party architecture ports are tolerated as unofficial add-ons rather than folded into a formal support process -- this is inferred from that one precedent, not documented policy.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Oct 28, 2023 | User `condy0919` opens issue [#2101](https://github.com/pytorch/FBGEMM/issues/2101), "porting fp16 multiplication of fbgemm to riscv," asking how `partition_avx512` is auto-tuned. No maintainer response to date. | [GitHub issue #2101](https://github.com/pytorch/FBGEMM/issues/2101) |
| (never) | First RISC-V commit | Zero results from `search_commits` for "riscv" and "riscv64" scoped to `repo:pytorch/FBGEMM`; confirmed independently by full `git grep -i riscv` across all tracked files at HEAD (commit `87f08e6cca999aeac7b26e981c09b24dcde2c746`) |
| (never) | RISC-V pull request | Zero results from `search_pull_requests` for "riscv", "riscv64", "risc-v" scoped to the repo |
| (never) | RISC-V tracking issue | No master/tracking issue for a riscv64 port exists |
| (never) | RISE project involvement | FBGEMM does not appear on [riseproject.dev](https://riseproject.dev), in the [RISE wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/), or among the 26 repos in the `riseproject-dev` GitHub org |

There is no RISC-V port history for FBGEMM. The single community reference is an unanswered 2023 question from an individual contributor exploring the codebase, not a maintainer-sanctioned porting effort. FBGEMM is not upstream on RISC-V in any sense -- there is nothing to be "fully upstream" of.

---

## 3. Upstream Support Tier

FBGEMM has no documented platform-tier policy. No `PLATFORMS.md`, `SUPPORT.md`, or equivalent exists. Architecture scope must be inferred from `CMakeLists.txt` processor detection and the CI matrix, both of which recognize only two architecture families.

| Dimension | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CMake detection | Yes -- `x86_64\|amd64\|AMD64\|i386\|i686` branch | Yes -- `aarch64\|ARM64\|arm64` branch | No branch exists; falls through silently |
| ISA-specific kernels | Full (AVX2, AVX512, VNNI) | Partial (NEON, SVE, SVE2, KleidiAI) | None |
| CI build | Yes | Yes | No |
| CI test | Yes | Yes | No |
| Release wheels (PyPI, `fbgemm-gpu` 1.9.0) | Yes -- all wheels (`cp310`-`cp314`) are `manylinux_2_28_x86_64` | None found on PyPI [NEEDS VERIFICATION -- no aarch64 wheel identified] | None -- zero riscv64 wheels across the full release history 0.0.1 through 1.9.0 |
| Blocking status | Primary target | Secondary, actively invested target | Not a recognized target |

aarch64 is a live investment area; riscv64 has no formal or informal tier standing whatsoever.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

FBGEMM's architecture-specific engineering consists of four layers: (1) JIT code emission via asmjit, (2) hand-written C++ SIMD intrinsic/assembly kernels, (3) runtime ISA dispatch via cpuinfo, and (4) a build-time autovectorized fallback.

### 4.1 JIT Code Generation (asmjit)

asmjit is a hard build dependency linked into every FBGEMM kernel target, including the autovec target. It supports x86/x64 and AArch64 code-generation backends. The [asmjit roadmap](https://asmjit.com/roadmap.html) lists RISC-V as "Pending / Not supported," confirmed current as of 2026-09-30, with no timeline and no assigned maintainer. Two GitHub issues asking about RISC-V support -- [asmjit#393](https://github.com/asmjit/asmjit/issues/393) ("RISC-V port," opened Dec 2022, closed) and [asmjit#479](https://github.com/asmjit/asmjit/issues/479) ("Question about port status for RISC-V," opened Jun 2025 by a ByteDance contributor) -- both received zero maintainer response. asmjit's `arch_traits.cpp` marks RISCV32/RISCV64 as `no_arch_traits`: the library builds and links on riscv64 (it is present as `libasmjit-dev`/`libasmjit0` in Ubuntu resolute/riscv64) but emits no RISC-V machine code whatsoever. JIT kernel emission is entirely non-functional on riscv64.

### 4.2 SIMD Dispatch Table

FBGEMM's `inst_set_t` enum (`include/fbgemm/SimdUtils.h`) contains only `anyarch`, `avx2`, `avx512`, `avx512_ymm`, `avx512_vnni`, `avx512_vnni_ymm`, `sve`. No `rvv` value exists. Dispatch functions that switch on this enum fall through to a `default` branch that throws `std::runtime_error("unknown architecture")` at runtime -- on riscv64, any GEMM call reaching this dispatch crashes.

### 4.3 Confirmed Link-Time Defect (Code-Level Finding)

Direct inspection of `src/FbgemmFP16.cc` and `src/fp32/FbgemmFP32.cc` at commit `87f08e6` shows these generic-object-library files (compiled on every platform, including riscv64) unconditionally reference AVX2 kernel symbols such as `gemmkernel_1x2_Avx2_fp16_fA0fB0fC0`, guarded only by `#if !defined(__aarch64__)`:

```c
constexpr kernel_array_t<float16> kernel_fp16_avx2 = {
    {nullptr,
#if !defined(__aarch64__)
     gemmkernel_1x2_Avx2_fp16_fA0fB0fC0,
     gemmkernel_2x2_Avx2_fp16_fA0fB0fC0, ...
#endif
```

These symbols are declared in `src/FbgemmFP16UKernelsAvx2.h` under the same `!defined(__aarch64__)` guard but are only *defined* in `.cc` files that CMake compiles solely under the x86_64 branch. On riscv64, the declarations are referenced but the definitions are never compiled, producing an **undefined-reference link failure**, not merely a missing-optimization gap. The same pattern repeats in `include/fbgemm/FbgemmFPCommon.h` (lines 126/149) and `src/fp32/FbgemmFP32.cc` (lines 14/35/48/70). A fix would require extending these guards to also exclude non-x86/non-aarch64 targets (e.g. `&& !defined(__riscv)`) or defining `FBGEMM_FP16_FALLBACK_TO_REF_KERNEL`/`FBGEMM_FP32_FALLBACK_TO_REF_KERNEL` for riscv64 the way it is already done for aarch64 -- but CMake never sets these for riscv64 today, because no riscv64 branch exists at all. This is the specific, confirmed mechanism by which FBGEMM as shipped would fail to link on riscv64, independent of the JIT/dispatch-table gaps above.

### 4.4 Architecture-Specific Source Files

| Architecture | Source Files (sampled) | Kernel Type |
|---|---|---|
| x86 AVX2 | 14 files (`UtilsAvx2.cc`, `QuantUtilsAvx2.cc`, `EmbeddingSpMDMAvx2.cc`, `GroupwiseConvAcc32Avx2.cc`, `FbgemmFP16UKernelsAvx2.cc`, etc.) | Hand-tuned intrinsics + asmjit JIT |
| x86 AVX512/VNNI | 18 files, including hand-written JIT-codegen kernels (`GenerateKernelU8S8S32ACC16Avx512VNNI.cc`, `GenerateKernelU8S8S32ACC32Avx512VNNI.cc`) | Hand-tuned intrinsics + asmjit JIT |
| AArch64 NEON/SVE/SVE2 | ~20 files (`UtilsSve.cc`, `FbgemmFP16UKernelsSve128.cc` with raw `asm volatile` SVE assembly, `QuantUtilsNeon.cc`, `EmbeddingSpMDMAutovec.cc` using `arm_sve.h`) | C++ intrinsics and hand-written inline assembly |
| AArch64 dispatch guards | 49 hits for `__aarch64__` across ~20 files (`Fbgemm.cc`, `PackMatrix.cc`, `ExecuteKernelU8S8.cc`, `Utils.cc`) | -- |
| riscv64 | 0 files, 0 guards | Missing entirely |

No file anywhere in `src/` or `include/` contains the strings `riscv`, `rvv`, `rv64`, `vfloat32m1_t`, or `__riscv`. The single "RISC-V" text match in the entire repository is a textbook citation ("Computer Organization and Design, RISC-V edition, Chapter 3.5") in a code comment in `fbgemm_gpu/experimental/gemm/test/fp4_quantize_test.py`, unrelated to any functional support.

### 4.5 Per-Component Coverage

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| FP16 GEMM | Full -- AVX2/AVX512 JIT kernels | Partial -- SVE128 + KleidiAI | Missing (link failure per 4.3) |
| FP32 GEMM | Full -- AVX2/AVX512 | Partial -- KleidiAI NEON | Missing (link failure per 4.3) |
| Embedding SpMDM (TBE) | Full -- AVX2/AVX512 | Partial -- autovec + SVE | Missing |
| INT8 quantized GEMM | Full -- AVX2/AVX512/VNNI | Partial -- NEON quant utils | Missing |
| Sparse dense ops | Full -- AVX2/AVX512 | Missing | Missing |
| Groupwise conv | Full -- AVX2/AVX512 | Missing | Missing |
| Runtime ISA dispatch | Functional | Functional | Throws `std::runtime_error` (would be reached only if linking succeeded) |

### 4.6 Autovectorization Fallback

`EmbeddingSpMDMAutovec.cc` relies on compiler auto-vectorization rather than architecture-specific intrinsics and would in principle compile on riscv64 with `-march=rv64gcv`. However, this path is unreachable in practice: the binary would not link in the first place (section 4.3), asmjit is still linked as a static dependency regardless, and the dispatch table has no RVV-aware branch routing GEMM calls to autovec.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Processor Detection

The root `CMakeLists.txt` gates ISA-specific targets behind a `CMAKE_SYSTEM_PROCESSOR` regex: `"x86_64|amd64|AMD64|i386|i686"` activates AVX2/AVX512 targets; `"aarch64|ARM64|arm64"` activates NEON/SVE/SVE2/KleidiAI targets. There is no `elseif` branch, no `-DUSE_*=OFF` flag, and no toolchain file for riscv64 -- it falls through both regexes silently, with no `FATAL_ERROR` raised for an unrecognized architecture.

### 5.2 Standard Build Commands

From the official [BuildInstructions.rst](https://github.com/pytorch/FBGEMM/tree/main/fbgemm_gpu/docs/src/fbgemm/development/BuildInstructions.rst):

```
git clone --recurse-submodules https://github.com/pytorch/FBGEMM.git
cd FBGEMM && mkdir build && cd build
cmake -DFBGEMM_USE_SANITIZER=address -DFBGEMM_LIBRARY_TYPE=shared -DPYTHON_EXECUTABLE=$(which python3) ..
make -j VERBOSE=1 && make test && make install
```

No riscv64-specific flags or documentation exist. There is no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` in the repository. No `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists; `cmake/modules/` contains only `Utilities.cmake`, `CppLibrary.cmake`, `CudaSetup.cmake`, `FindAVX.cmake`, `RocmSetup.cmake`, `PyTorchSetup.cmake`, `GpuCppLibrary.cmake`, `FindSphinx.cmake`, `FindMKL.cmake`, `CxxCompilerSetup.cmake`, `FindGnuH2fIeee.cmake` -- no cross-compilation toolchain file for any architecture, and `CMAKE_TOOLCHAIN_FILE` is not referenced anywhere in the repository.

### 5.3 Compiler and Toolchain Requirements

| Requirement | Minimum | Enforcement |
|---|---|---|
| CMake | 3.21 | `cmake_minimum_required` -- fatal |
| C++ standard | C++20 | `FATAL_ERROR` in `cmake/modules/CxxCompilerSetup.cmake` if not met |
| GCC | 10.4.0 (tested baseline, per docs, for GLIBCXX ABI compatibility) | Documentation; `fbgemm_gpu/CMakeLists.txt` enforces a related fatal minimum for the GPU build |
| LLVM/Clang | 16.0.6 ("Minimum LLVM+Clang version required for FBGEMM_GPU") | Documentation; requires `-fopenmp=libomp -stdlib=libc++`; GCC is still required as a co-dependency even for Clang+CUDA builds |
| GCC/Clang for SVE/SVE2 | GCC>=14 / Clang>=17 | Guards `arm_neon_sve_bridge.h` availability (aarch64-only) |

Nothing in the C++20/CMake 3.21 baseline is riscv64-prohibitive by itself -- both are available in current Debian/Ubuntu riscv64 archives -- the blocker is architecture detection and dispatch, not toolchain version floors.

### 5.4 riscv64 Build Path (As Shipped Today)

1. CMake detects `CMAKE_SYSTEM_PROCESSOR=riscv64`; neither the x86 nor AArch64 regex matches.
2. Only `fbgemm_generic` (OBJECT lib) and `fbgemm_autovec` (unless `-DDISABLE_FBGEMM_AUTOVEC=ON`) targets get built.
3. **Link failure**: the generic object files in `FbgemmFP16.cc`/`FbgemmFP32.cc` reference AVX2 symbols that are declared but never defined on this path (section 4.3). The build does not complete.
4. Even hypothetically patched past the link failure, any GEMM call would hit the dispatch table's `default` branch and throw `std::runtime_error("unknown architecture")` at runtime.
5. Only `EmbeddingSpMDMAutovec.cc` provides a code path that would run correctly if reached, but it is not reached by default dispatch logic.

### 5.5 QEMU Usage

No QEMU usage exists anywhere in FBGEMM's CI workflows or build documentation. AArch64 CI uses native ARM64 GitHub-hosted/self-hosted runners, not emulation. For contrast: sibling PyTorch repositories do have riscv64 build infrastructure that FBGEMM lacks -- `pytorch/pytorch` has `.ci/docker/ubuntu-cross-riscv/Dockerfile` (cross-compilation via `crossenv`), and `pytorch/executorch` has `examples/riscv/setup.sh`/`run.sh` (installs `gcc-riscv64-linux-gnu`, `qemu-user-static`, runs via `qemu-riscv64-static`) plus `tools/cmake/preset/riscv64_linux.cmake`. None of this exists in or is referenced by FBGEMM.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

As shipped, FBGEMM does not build on riscv64 at all: the generic object library fails to link due to the AVX2 symbol-guard defect in section 4.3. This is a confirmed, code-level, build-blocking defect, not an untested-CI gap. Even setting that defect aside hypothetically, the production dispatch path would still crash on any GEMM call via the `default: throw std::runtime_error` branch, since no `rvv` entry exists in `inst_set_t`. Corroborating this from the consumer side, the [RISE Project blog post "PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) (2026-08-18) states directly that PyTorch's riscv64 build ships with **no quantization backend at all**, because neither FBGEMM nor QNNPACK supports RISC-V -- accounting for 9 of 191 documented test failures in PyTorch's riscv64 test suite.

### 6.2 Performance Gaps

Data not available: no riscv64 FBGEMM benchmark data exists in any public source (GitHub, arXiv, or the RISE blog). Since FBGEMM has no functional riscv64 backend at all, a riscv64-vs-arm64 or riscv64-vs-amd64 FBGEMM performance comparison does not exist to report -- this reflects the absence of an implementation, not a search gap. Structurally, all of FBGEMM's published performance gains (up to 2.4x speedup in Meta's production workloads) derive from AVX-512 VNNI and AVX2 microkernels; without any RVV kernels, a hypothetically patched riscv64 build would run at scalar throughput only [NEEDS VERIFICATION -- no measured riscv64 figures exist to confirm a specific multiplier].

### 6.3 NaN / Floating-Point Semantics

PR [#5843](https://github.com/pytorch/FBGEMM/pull/5843) (closed, not merged, June 2026) documented a correctness bug on AArch64+SVE where the `HAVE_SVE` branch of a dequantization routine silently ignored a bf16/fp16 type-selection template parameter, producing wrong bit patterns. This class of dispatch-table correctness bug -- a missing ISA specialization silently producing wrong results rather than a compile error -- is a structural risk for any new architecture, including a future riscv64 port, at every point where an ISA-specific specialization is absent but not explicitly guarded. Separately, the AVX2 and NEON fp32-to-bf16 helpers use round-half-away-from-zero rather than round-to-nearest-even, differing by up to 1 ULP from the scalar/AVX-512 paths; a riscv64 scalar fallback would use round-to-nearest-even and would therefore differ numerically from the production x86 path.

---

## 7. CI/CD Infrastructure

All 22 workflow files in `.github/workflows/` were inspected directly (not via search index) at commit `87f08e6cca999aeac7b26e981c09b24dcde2c746`: `_fbgemm_gpu_cuda_build.yml`, `_fbgemm_gpu_cuda_test.yml`, `_fbgemm_gpu_generate_ci_matrix.yml`, `build_wheels_genai_linux_aarch64.yml`, `build_wheels_genai_linux_x86.yml`, `build_wheels_linux_aarch64.yml`, `build_wheels_linux_x86.yml`, `fbgemm_ci.yml`, `fbgemm_gpu_benchmark_cpu.yml`, `fbgemm_gpu_benchmark_cuda.yml`, `fbgemm_gpu_benchmark_rocm.yml`, `fbgemm_gpu_ci_cpu.yml`, `fbgemm_gpu_ci_cuda.yml`, `fbgemm_gpu_ci_genai_generic_infra.yml`, `fbgemm_gpu_ci_rocm.yml`, `fbgemm_gpu_docs.yml`, `fbgemm_gpu_lint.yml`, `fbgemm_gpu_pip.yml`, `fbgemm_gpu_release_cpu.yml`, `fbgemm_gpu_release_cuda.yml`, `fbgemm_gpu_release_genai.yml`, `fbgemm_gpu_torchrec_ci_cpu.yml`. `grep -ril riscv` across this directory, plus a full-repository `git grep -i riscv` and a full `git ls-tree -r` filename scan (for a `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or any riscv-named file), each returned **zero matches**.

The only architecture-specific CI variants are x86 (`build_wheels_linux_x86.yml`, `build_wheels_genai_linux_x86.yml`) and aarch64 (`build_wheels_linux_aarch64.yml`, `build_wheels_genai_linux_aarch64.yml`), driven by a reusable `pytorch/test-infra` matrix generator (`os: linux-aarch64`, `runner-fleet: osdc`). The primary CI (`fbgemm_ci.yml`) matrix runs `{ arch: x86, instance: "linux.12xlarge" }` and `{ arch: arm, instance: "linux.arm64.m7g.4xlarge" }`.

| CI Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | No |
| Test CI | Yes | Yes | No |
| Wheel build CI | Yes | Yes | No |
| GPU CI (CUDA/ROCm) | Yes | No | No |
| Native hardware runner | Yes | Yes (ARM64) | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |

**RISE Project involvement:** none. FBGEMM does not appear on [riseproject.dev](https://riseproject.dev), in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (80+ packages checked, FBGEMM absent), or in the `riseproject-dev` GitHub org (26 repos reviewed, none FBGEMM-related; `search_repositories query="FBGEMM org:riseproject-dev"` returns 0 results). RISE's [RISC-V Runners](https://riseproject.dev) (Scaleway EM-RV1, `ubuntu-24.04-riscv`) are used for general PyTorch CI but have no FBGEMM-specific usage. RISE's stated investment areas are PyTorch, Llama.cpp, IREE, oneDNN, and OpenBLAS -- FBGEMM is not among them.

---

## 8. Distribution and Release Status

| Channel | riscv64 Available | Notes |
|---|---|---|
| PyPI (`fbgemm-gpu`, the actual upstream package name) | No | Every release checked programmatically from 0.0.1 through the latest 1.9.0: wheels exist only as `manylinux_2_28_x86_64` for CPython 3.10-3.14. No riscv64 wheel has ever been published. |
| PyPI (`fbgemm`) | No | `https://pypi.org/pypi/fbgemm/json` returns HTTP 404 -- this package name does not exist. |
| GitHub tags/releases | No | Tags through v1.9.0 exist (`v1.9.0`, `v1.8.0`, `v1.7.0`, `v1.6.0`, `v1.5.0-rc3`, etc.); no riscv64 build artifact identified in any release. |
| RISE wheel builder | No | `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/fbgemm-gpu/` 302-redirects straight through to upstream PyPI -- RISE has no custom riscv64 build for this package. |
| Ubuntu 26.04 (resolute) | No | `packages.ubuntu.com` search for "fbgemm" returns "Sorry, your search gave no results" for suite `resolute`, all sections, all architectures. Alternate spellings (`python3-fbgemm`, `fbgemm-gpu`, `python3-fbgemm-gpu`) also return no results. |
| Debian (any suite) | No | HTTP 404 on the Debian package tracker; "No packages found" across all suites. |
| Arch Linux (mainline or RISC-V port) | No | Official Arch package DB (`archlinux.org/packages/search/json/?name=fbgemm`) returns `{"results": [], "count": 0}` on any architecture -- FBGEMM is not packaged standalone, it is vendored inside PyTorch's build. The Arch RISC-V site (`archriscv.felixc.at`) has a non-functional/decorative search field and cannot be cited as independent evidence either way. |
| Fedora | Data not available: Fedora package search was not checked in this research pass. |

There is no path to a working riscv64 FBGEMM binary today through any distribution channel. A user attempting to build FBGEMM from source on riscv64 will encounter the link failure documented in section 4.3 before reaching any runtime dispatch question.

---

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking for FBGEMM riscv64 |
|---|---|---|---|---|---|---|
| asmjit | Runtime dependency -- JIT code generation for all kernel targets, including autovec | Critical | Compiles (no-op/inert build; present in Ubuntu resolute/riscv64 as `libasmjit-dev`) | No functional backend to test | No dedicated release; ships as a source-built distro package, functionally inert on this arch | Yes -- primary blocker. Roadmap lists RISC-V "Pending / Not supported"; issues [#393](https://github.com/asmjit/asmjit/issues/393) and [#479](https://github.com/asmjit/asmjit/issues/479) both unanswered by maintainers. No RVV code-generation backend exists. |
| cpuinfo | Runtime dependency -- CPU/ISA feature detection populating the dispatch table | Critical | Builds; has real `src/riscv/` runtime-detection code (unlike asmjit) | Build-only in CI (QEMU); uarch always returns "unknown," cache topology empty, only 9 of ~28 available hwprobe ISA extensions surfaced | No GitHub Releases (source-only); present in Debian sid and Ubuntu Noble/Questing/Resolute as `libcpuinfo0` | Secondary blocker -- functionally incomplete but not the primary obstacle. Tracking issue [pytorch/cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124) open since 2022; PR [#397](https://github.com/pytorch/cpuinfo/pull/397) (filed 2026-06-22) would close most gaps but is unreviewed and stalled. |
| GCC | Build dependency -- primary supported compiler | Critical | Full riscv64 support upstream (GCC>=14 required elsewhere in the PyTorch riscv64 ecosystem for RVV target support, per the RISE blog); FBGEMM's own documented baseline is GCC 10.4.0 for ABI compatibility | Full | Distro packages available | No -- compiler itself is not a riscv64 blocker |
| LLVM | Build dependency -- alternate supported compiler (Clang 16.0.6 minimum per FBGEMM docs) | Critical | Full riscv64 support upstream | Full | Distro packages available | No |
| CMake | Build dependency -- build configuration (>=3.21 required) | Critical | Full riscv64 support | Full | Distro packages available | No -- the blocker is FBGEMM's own `CMakeLists.txt` processor-detection logic, not CMake itself |
| Python | Build dependency -- build-time configure helper and `fbgemm_gpu` bindings | Critical | Full riscv64 support | Full | Distro packages available | No |
| OpenMP | Runtime dependency -- parallel threading, resolved via system `find_package`, not a vendored submodule | Optional | Full (mature via GCC/Clang libomp on riscv64) | Full | Distro packages available | No |
| googletest | Test dependency -- unit test framework (vendored submodule) | Optional | Full | Mostly (one flaky test reported in prior testing) | N/A | No |

**asmjit deep-dive:** [asmjit](https://github.com/asmjit/asmjit) is linked into every FBGEMM build target. Its supported code-generation backends are x86/x64 and AArch64 only. The [asmjit roadmap](https://asmjit.com/roadmap.html) lists RISC-V as "Pending," with no timeline and no assigned maintainer, confirmed current as of 2026-09-30. FBGEMM's GEMM kernels depend on JIT emission at runtime; without a working asmjit RVV backend, JIT-based GEMM cannot execute on riscv64 under any circumstance, independent of FBGEMM's own code changes. This is FBGEMM's single largest riscv64 blocker and is prerequisite, out-of-tree work relative to FBGEMM itself.

**cpuinfo deep-dive:** [pytorch/cpuinfo](https://github.com/pytorch/cpuinfo) has genuine, if incomplete, riscv64 support (`src/riscv/` contains real detection code, unlike asmjit's inert riscv64 build). CI builds on riscv64 under QEMU but does not execute functional tests. For FBGEMM specifically, cpuinfo returning partial ISA data on riscv64 would at most cause a fallback to scalar/autovec kernels -- correct behavior in principle -- but this path is moot today because the build does not link in the first place (section 4.3), and the JIT/dispatch-table gap would still be hit before cpuinfo's incompleteness became the operative constraint.

The `cutlass` fork (`jwfromm/cutlass`, CUDA-only), `composable_kernel` and `hipify_torch` (ROCm-only), and `nlohmann/json` (generic JSON, not architecture-sensitive) are also vendored via `.gitmodules` but never enter a riscv64 CPU build path and are excluded from the table above as out of scope.

---

## 11. Known Bugs and Active Issues

### 11.1 RISC-V Specific

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2101](https://github.com/pytorch/FBGEMM/issues/2101) | "porting fp16 multiplication of fbgemm to riscv" / "How `partition_avx512` is auto-tuned?" | Open, unanswered since Oct 2023 | N/A (community question, not a tracked bug) | The only RISC-V-related item in the repository's history. The user hit the AVX512-specific static partition-size lookup table while attempting to port fp16 GEMM to RISC-V. The partition table is hardcoded for AVX-512 register geometry and would need a separate table auto-tuned for RVV LMUL widths. No maintainer response. |

No open GitHub issue in pytorch/FBGEMM references RISC-V/riscv64 for correctness, NaN/floating-point, or performance problems -- confirmed by direct `search_issues` queries ("riscv64 performance," "riscv64 bug," "riscv nan floating," "riscv," "label:riscv"), all scoped to `repo:pytorch/FBGEMM`, all returning zero genuine matches.

### 11.2 Architecture-Porting Related (Non-RISC-V, Informative Context)

| ID | Title | Status | Relevance to RISC-V |
|---|---|---|---|
| [PR #5779](https://github.com/pytorch/FBGEMM/pull/5779) | Implement PackDepthwiseConvMatrix in NEON + deprecate aarch64 compat layers | Merged May 2026 | Removes compatibility shims non-x86 platforms previously relied on for compilation. After this PR, a hypothetical riscv64 port faces the same problem the AVX2-symbol-guard defect in section 4.3 already demonstrates: no generic fallback path is maintained for architectures without dedicated kernels. |
| [PR #5921](https://github.com/pytorch/FBGEMM/pull/5921) | Remove aarch64 compatibility layers | Merged June 2026 | Codebase is now strictly x86+MKL or aarch64+ArmPL in its maintained paths; no generic path remains for other architectures in the core. |
| [PR #5813](https://github.com/pytorch/FBGEMM/pull/5813) | Fix aarch64+gcc OSS build break | Merged June 2026 | Required days after #5779 due to ISA-specific intrinsics leaking into generic code -- illustrates that new-architecture ports require active, ongoing maintenance, which a RISC-V port would need to self-supply. |
| [PR #5843](https://github.com/pytorch/FBGEMM/pull/5843) | Fix bf16 dequant: SVE 8-bit fallback, rounding docs, robust test | Closed, not merged, June 2026 | Demonstrates the dispatch-table correctness risk described in section 6.3: a missing ISA specialization silently produces wrong bit patterns rather than failing loudly. |

### 11.3 General Open Correctness Bugs (Not RISC-V Specific)

| ID | Title | Status | Severity |
|---|---|---|---|
| [#4679](https://github.com/pytorch/FBGEMM/issues/4679) | "Various problems on arm64" | Open (filed 2025-08-12) | High -- SVE kernel correctness, ISA-detection macro mismatches |
| [#5326](https://github.com/pytorch/FBGEMM/issues/5326) | Incorrect (zeroed) embedding_lookup results when embedding_dim > 1024 | Open | High -- correctness |
| [#5088](https://github.com/pytorch/FBGEMM/issues/5088) | Fix NAN for the prediction | Open | High -- correctness |
| [#5736](https://github.com/pytorch/FBGEMM/issues/5736) | Make float16/bfloat16 distinct types | Open | Medium -- type safety |

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. asmjit has no RVV code-generation backend, and this is a dependency-project decision, not an FBGEMM one. An RVV backend for asmjit is prerequisite work, entirely independent of FBGEMM, requiring its own upstream acceptance process at [asmjit/asmjit](https://github.com/asmjit/asmjit).
2. FBGEMM's generic (all-platform) object files reference AVX2 symbols under an `__aarch64__`-only exclusion guard, producing a confirmed undefined-reference link failure on riscv64 as shipped (section 4.3). This must be fixed in FBGEMM itself before any other riscv64 work is meaningful.
3. The `inst_set_t` enum and every dispatch site that switches on it must be extended with an RVV value; each currently has a `default` branch that throws.
4. Static partition tables in the FP16 GEMM path (`partition_avx512`) are hardcoded for AVX-512 register geometry (per issue #2101) and would need a separate RVV LMUL-aware table or a runtime-determined tiling scheme.
5. The recent removal of AArch64 compatibility shims (PRs #5779, #5921, merged May-June 2026) means the codebase is now structurally less hospitable to a new generic/fallback architecture path than it was in 2023, when the only community porting attempt (#2101) occurred.

**Organizational blockers:**

1. Meta has expressed no interest in RISC-V for FBGEMM. The internally-synced (`meta-codesync[bot]`) governance model means an externally funded RISC-V port would arrive as unsolicited external PRs with no established review priority.
2. FBGEMM's active development trajectory is GPU-focused (CUDA, ROCm, MTIA); the CPU library receives maintenance but no new-architecture investment beyond ARM.
3. No RISE project involvement of any kind exists for FBGEMM -- confirmed absent from RISE's blog, wheel builder, and GitHub org (section 7). There is no working group, funding, or committed contributor driving riscv64 work on this project specifically.

**Acceptance probability:** Low for a complete functional port in the near term. A minimal patch that prevents the current link failure and replaces the dispatch-table `throw` with a safe scalar/autovec fallback has materially higher acceptance probability than full RVV kernel contribution, which faces the same review-priority barriers as any large new-architecture patch to a Meta-controlled project, compounded by the prerequisite, out-of-tree asmjit dependency.

---

## 13. Readiness Assessment

- **Color:** red (confirmed-broken-link-failure)
- **Release provider:** none
- **Optimization level:** absent

FBGEMM has zero riscv64 support and, per direct source inspection, would fail to even link on riscv64 as shipped. None of the 22 [GitHub Actions workflows](https://github.com/pytorch/FBGEMM/tree/main/.github/workflows) reference riscv in any form (only x86 and aarch64 CI variants exist), no riscv64 wheel has ever been published on [PyPI](https://pypi.org/pypi/fbgemm-gpu/json) (x86_64-only across all releases 0.0.1-1.9.0), no distro (Ubuntu resolute, Debian, Arch RISC-V) ships a package, and `CMakeLists.txt`'s `CMAKE_SYSTEM_PROCESSOR` detection has no riscv64 branch at all. Beyond the absence of any support, direct code review of `src/FbgemmFP16.cc`/`src/fp32/FbgemmFP32.cc` found AVX2 kernel-symbol references guarded only by `#if !defined(__aarch64__)` (not by an x86-only check), meaning on riscv64 the generic object file references AVX2 symbols that are never compiled/defined, producing an undefined-reference link failure -- a confirmed, documented build-blocking defect rather than merely untested/absent CI, which is why this clears the bar for red rather than orange. This is corroborated by the third-party [RISE Project blog](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/), which states PyTorch's riscv64 build ships with no quantization backend at all because neither FBGEMM nor QNNPACK supports RISC-V.

**Pending work that could change the grade:** None found. No open PR or tracking issue for a riscv64 port exists in pytorch/FBGEMM, and there is no RISE Project involvement (absent from RISE's blog posts about FBGEMM specifically as a target, its wheel builder listing, and its GitHub org). The only community signal is the unanswered 2023 issue [#2101](https://github.com/pytorch/FBGEMM/issues/2101), "porting fp16 multiplication of fbgemm to riscv," with no maintainer response. Given FBGEMM's JIT kernel-generation approach depends on asmjit, which lists RISC-V as "Pending / Not supported" on its own roadmap, a functional (non-link-breaking) riscv64 build would require both an FBGEMM-side dispatch/build fix and prerequisite asmjit RISC-V backend work.

---

## 14. Investment Analysis

RISE has not funded or performed any FBGEMM-specific work: it is absent from RISE's blog posts (aside from a one-line limitation note), its wheel builder, and its GitHub org (section 7). Nothing below duplicates existing RISE investment, because none exists for this project.

### 14.1 Functional Enablement

The minimum required to get FBGEMM to link and run without crashing on riscv64:

- Fix the AVX2-symbol-guard defect in `src/FbgemmFP16.cc`/`src/fp32/FbgemmFP32.cc`/`include/fbgemm/FbgemmFPCommon.h` so the generic build path excludes non-x86/non-aarch64 architectures, or define `FBGEMM_FP16_FALLBACK_TO_REF_KERNEL`/`FBGEMM_FP32_FALLBACK_TO_REF_KERNEL` for riscv64 (section 4.3). This is the confirmed link-failure blocker and must be fixed first.
- Add an explicit riscv64 branch to `CMakeLists.txt`'s `CMAKE_SYSTEM_PROCESSOR` detection, defining a baseline compiler flag set (e.g. `-march=rv64gc`).
- Patch the dispatch table `default` branch to fall through to scalar/autovec rather than `throw std::runtime_error`, unblocking the `EmbeddingSpMDMAutovec.cc` path for SpMDM workloads.
- Disable the asmjit-based JIT path for riscv64 at compile time to avoid linking a code generator with no functional backend for this target.

This does not enable optimized GEMM -- it enables non-crashing execution limited to SpMDM (embedding lookup) workloads. Full GEMM functionality additionally requires an asmjit RVV backend, which is prerequisite work outside FBGEMM's own repository.

### 14.2 Performance Optimization

No RVV microkernels exist as a starting point anywhere in FBGEMM. The AArch64 NEON/SVE work provides a structural template (separate `.cc` files per kernel, intrinsic-based, ISA guards in the dispatch table) but took sustained Meta engineer effort over multiple quarters to reach its current partial state. An equivalent RVV port covering FP16 GEMM, INT8 GEMM, SpMDM, and quantization utilities is a multi-quarter effort. The partition auto-tuning problem raised in issue #2101 adds scope: RVV kernels need a table auto-tuned for RVV register-file characteristics (LMUL, VLEN), requiring a tuning harness and either RISC-V hardware or high-fidelity emulation.

### 14.3 CI/CD Infrastructure

RISE GitHub Actions runners for riscv64 (Scaleway EM-RV1, `ubuntu-24.04-riscv`) exist and are available to open-source projects generally, per the RISE blog, but are not currently used by FBGEMM in any capacity. Adding a riscv64 CI job to `fbgemm_ci.yml` is low effort once a working build exists; it is gated entirely on the functional-enablement work in 14.1.

### 14.4 Ecosystem Enablement

FBGEMM has no downstream package ecosystem of its own -- it is consumed as a dependency of PyTorch, not depended upon by a wide plugin/package ecosystem (see also the omission of Section 10). Enabling FBGEMM on riscv64 is prerequisite to full PyTorch CPU quantization support on riscv64, as documented directly by the [RISE blog post](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/): PyTorch's riscv64 build today has no quantization backend specifically because of this gap. The inverse is not true -- PyTorch builds on riscv64 today with FBGEMM disabled/unavailable.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix AVX2-symbol-guard link failure in FbgemmFP16.cc/FbgemmFP32.cc/FbgemmFPCommon.h | 1 | FBGEMM contributor | Critical |
| Functional | CMakeLists.txt: add riscv64 processor detection, basic compiler flags | 1 | FBGEMM contributor | Critical |
| Functional | Patch dispatch table: `default` branch falls through to scalar/autovec instead of throwing; disable JIT path for riscv64 | 2 | FBGEMM contributor | Critical |
| Functional | asmjit RVV backend (prerequisite, separate upstream project) | 40-80 | asmjit community / sponsored contributor | Critical (blocks all JIT GEMM) |
| Performance | RVV FP16 GEMM microkernels + partition table auto-tuning | 20 | riscv64 SIMD specialist | High |
| Performance | RVV INT8/INT16 quantized GEMM microkernels | 20 | riscv64 SIMD specialist | High |
| Performance | RVV SpMDM (embedding lookup) kernels | 12 | riscv64 SIMD specialist | High |
| Performance | RVV quantization utilities (quant/dequant, transpose) | 8 | riscv64 SIMD specialist | Medium |
| CI/CD | Add riscv64 CI job using RISE runners (build + test) | 1 | CI engineer | High (after functional work) |
| CI/CD | riscv64 wheel build workflow | 2 | CI engineer | Medium |

Total for a minimal non-crashing build (excluding asmjit RVV backend): approximately 4 person-weeks.
Total for functional enablement plus partial RVV performance work (excluding asmjit RVV backend, the dominant unknown at 40-80 person-weeks): approximately 64 person-weeks.

---

## 15. References

- [pytorch/FBGEMM repository](https://github.com/pytorch/FBGEMM)
- [FBGEMM .github/workflows directory (22 files, no riscv variant)](https://github.com/pytorch/FBGEMM/tree/main/.github/workflows)
- [FBGEMM issue #2101 -- "porting fp16 multiplication of fbgemm to riscv" (open, unanswered)](https://github.com/pytorch/FBGEMM/issues/2101)
- [FBGEMM issue #4679 -- "Various problems on arm64" (open)](https://github.com/pytorch/FBGEMM/issues/4679)
- [FBGEMM issue #3734 -- "Arm64 CI on Github runners" (closed)](https://github.com/pytorch/FBGEMM/issues/3734)
- [FBGEMM PR #5779 -- Implement PackDepthwiseConvMatrix in NEON + deprecate aarch64 compat layers (merged May 2026)](https://github.com/pytorch/FBGEMM/pull/5779)
- [FBGEMM PR #5921 -- Remove aarch64 compatibility layers (merged June 2026)](https://github.com/pytorch/FBGEMM/pull/5921)
- [FBGEMM PR #5813 -- Fix aarch64+gcc OSS build break (merged June 2026)](https://github.com/pytorch/FBGEMM/pull/5813)
- [FBGEMM PR #5843 -- Fix bf16 dequant: SVE 8-bit fallback (closed, not merged, June 2026)](https://github.com/pytorch/FBGEMM/pull/5843)
- [FBGEMM PR #6377 -- Add INT4 autovec test and benchmark harness (AArch64, not RISC-V)](https://github.com/pytorch/FBGEMM/pull/6377)
- [FBGEMM issue #5326 -- Incorrect embedding_lookup results when embedding_dim > 1024 (open)](https://github.com/pytorch/FBGEMM/issues/5326)
- [FBGEMM issue #5088 -- Fix NAN for the prediction (open)](https://github.com/pytorch/FBGEMM/issues/5088)
- [FBGEMM issue #5736 -- Make float16/bfloat16 distinct types (open)](https://github.com/pytorch/FBGEMM/issues/5736)
- [fbgemm-gpu on PyPI -- v1.9.0, manylinux_2_28_x86_64 only, across all releases 0.0.1-1.9.0](https://pypi.org/pypi/fbgemm-gpu/json)
- [asmjit roadmap -- RISC-V listed as Pending / Not supported](https://asmjit.com/roadmap.html)
- [asmjit issue #393 -- "RISC-V port" (closed, unanswered)](https://github.com/asmjit/asmjit/issues/393)
- [asmjit issue #479 -- "Question about port status for RISC-V" (closed, unanswered)](https://github.com/asmjit/asmjit/issues/479)
- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [pytorch/cpuinfo issue #124 -- riscv64 tracking issue (open since 2022)](https://github.com/pytorch/cpuinfo/issues/124)
- [pytorch/cpuinfo PR #397 -- riscv64 hwprobe/vendor/cache improvements (filed 2026-06-22, unreviewed)](https://github.com/pytorch/cpuinfo/pull/397)
- [RISE Project blog -- "PyTorch is available on riscv64!" (2026-08-18, Ludovic Henry, Qualcomm)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE Project wheel builder listing (FBGEMM absent)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog -- "Easy Installation of Binary Python Packages on riscv64 Devices" (no FBGEMM mention)](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [Project RP013 -- Optimizing PyTorch ATen Operators for High-Performance RISC-V Hardware (RISE Confluence)](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/453148705/Project+RP013+Optimizing+PyTorch+ATen+Operators+for+High-Performance+RISC-V+Hardware)
- [FBGEMM build instructions (official)](https://github.com/pytorch/FBGEMM/tree/main/fbgemm_gpu/docs/src/fbgemm/development/BuildInstructions.rst)
- [pytorch/pytorch riscv cross-compile Dockerfile (sibling repo, not FBGEMM)](https://github.com/pytorch/pytorch/tree/main/.ci/docker/ubuntu-cross-riscv)
- [Ubuntu package search -- "fbgemm" in suite resolute (no results)](https://packages.ubuntu.com/search?keywords=fbgemm&suite=resolute&searchon=names&section=all)
- [Debian package tracker -- fbgemm (404)](https://tracker.debian.org/pkg/fbgemm)
- [Arch Linux package search API -- "fbgemm" (zero results, any architecture)](https://archlinux.org/packages/search/json/?name=fbgemm)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)