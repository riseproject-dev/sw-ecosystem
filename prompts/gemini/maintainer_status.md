# RISC-V Open-Source Maintainer Stance & Receptivity Analysis

**Date:** August 2026  
**Scope:** Evaluation of maintainer support, PR receptivity, and ecosystem friction across 147 open-source projects ([reports directory](file:///Users/gregsterling/repos/git/sw-ecosystem/reports)).

---

## Executive Summary

Across the 147 open-source projects tracked in this repository, maintainer attitudes toward RISC-V (`riscv64`) fall into **three distinct categories**:
1. **Champions (Gold Standard)**: Projects where upstream maintainers actively embrace RISC-V, maintain dedicated machine maintainers, gate PRs with native/official CI, and publish binary releases.
2. **Progressing (Traction with Operational Friction)**: Projects with merged RISC-V code and active community momentum, but where maintainers leave testing to community runners or lag in publishing prebuilt PyPI wheels.
3. **Resistant / Hostile / Neglected**: Projects where maintainers have closed or ignored RISC-V PRs, explicitly reverted prebuilt binary wheels, placed issues in "Cold Storage", or refused to assign maintainer review capacity.

---

## 1. Champion Projects (Working the Best with RISC-V)

These projects feature **Tier-1/2 upstream maintainer backing**, dedicated machine maintainers, active native or QEMU CI gating, prompt PR reviews, and zero maintainer friction:

- **Linux Kernel & GNU Toolchain ([glibc](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/glibc.md), [GCC](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/gdb.md), [GDB](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/gdb.md), [linux-perf](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/linux-perf.md), [eBPF](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/ebpf.md))**:
  - `glibc` has three active named machine maintainers (Palmer Dabbelt / Rivos, Andrew Waterman / SiFive, Peter Bergner / IBM). Full mainline feature parity.
- **LLVM Compiler Infrastructure & Clang ([LLDB](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/lldb.md))**:
  - `riscv64` is a first-class compilation target with complete RVV 1.0 vector intrinsic and auto-vectorization support.
- **Go / Golang ([go](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/go.md))**:
  - Official secondary port with active community builders, clean toolchain support (`GOARCH=riscv64`), and 1:1 runtime parity for web/cloud microservices.
- **OpenJDK / Java ([openjdk](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/openjdk.md))**:
  - JEP 422 ("Linux/RISC-V Port") delivered mainline into OpenJDK 19+. HotSpot JIT compiler is fully supported and maintained.
- **llama.cpp ([llama-cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md))**:
  - Community-driven C++ LLM inference engine. Rapidly merged RVV 1.0 matrix multiplication and dequantization kernels (VLEN=128/256) with zero maintainer friction.
- **OpenSSL ([openssl](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/openssl.md))**:
  - Full upstream integration including RVV-accelerated cryptographic primitives (`Zkn`/`Zks`).
- **Container Infrastructure ([containerd](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/containerd.md), [runc](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/runc.md), [Docker](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/docker.md), [Kubernetes](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/kubernetes.md))**:
  - High maintainer receptivity with full multi-arch container image support (`linux/riscv64`).
- **FFmpeg ([ffmpeg](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/ffmpeg.md)) & dav1d ([dav1d](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/dav1d.md))**:
  - Active RVV assembly vectorization PRs merged regularly by core video codec maintainers.

---

## 2. Progressing Projects (Traction with Operational Friction)

These projects have **working code and merged upstream PRs**, but suffer from operational friction such as missing PyPI binary wheels, opt-in/cross-compiled CI, or unmerged vectorization routines:

- **vLLM ([vllm](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md))**:
  - In-tree CPU backend merged with RVV attention kernels (VLEN=128 and VLEN=256), reviewed/approved by Intel maintainer `bigPYJ1151`. However, it lacks automated upstream CI and prebuilt PyPI wheels.
- **NumPy ([numpy](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/numpy.md))**:
  - Merged native RISC-V CI (PR #31488, May 2026); an official `riscv64` PyPI wheel is targeted for release 2.6.0 (Q3 2026).
- **LangChain ([langchain](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/langchain.md))**:
  - Pure-Python core (`py3-none-any` wheel) installs cleanly, but is blocked by missing binary wheels in downstream C++/Rust dependencies.
- **Chromium / V8 & Firefox / SpiderMonkey**:
  - Functional RVV JIT backends and desktop browser rendering, but upstream Google and Mozilla teams treat RISC-V as community-maintained without mandatory CI gating.
- **oneDNN ([onednn](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/onednn.md)) & OpenBLAS ([openblas](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/openblas.md))**:
  - `oneDNN` v3.10+ merged RISC-V CPU backend support (~8.85x speedup for elementwise ops). `OpenBLAS` has active RVV kernel work, but suffers from compiler edge bugs and unmerged LAPACK routines.
- **SQLAlchemy & tokenizers**:
  - SQLAlchemy merged QEMU CI; `tokenizers` publishes `manylinux_2_31_riscv64` wheels (though excluding `mimalloc`).

---

## 3. Hostile, Resistant, or Neglected Projects

These projects exhibit **active maintainer resistance, abandoned PRs, closed issues without merge, reverted binary wheels, or structural neglect**:

1. **PyTorch (`pytorch/pytorch`) ([pytorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md))**:
   - **Maintainer Stance**: Meta maintainers (primarily `malfet`) treat RISC-V as an opt-in, non-blocking community effort.
   - **Friction**:
     - Placed the primary RISC-V CI request in **"Cold Storage"** (Issue [#141550](https://github.com/pytorch/pytorch/issues/141550)).
     - Force-merges RISC-V PRs without maintainer review ("lint is green, rest is not compiled").
     - Refuses to assign a CODEOWNERS entry for RISC-V.
     - Leaves the core ATen RVV vectorization ([PR #175746](https://github.com/pytorch/pytorch/pull/175746)) stalled for months over scalable-vector copy debates (`Vectorized::size()`).
     - Zero `riscv64` PyPI wheels.
2. **google/sentencepiece ([vllm report](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md#9-dependencies))**:
   - **Maintainer Stance**: Maintainer explicitly **reverted** a working `riscv64` PyPI wheel build ([PR #1226](https://github.com/google/sentencepiece/pull/1226)), leaving Issue [#1250](https://github.com/google/sentencepiece/issues/1250) open. This directly blocks standard `pip install` for LLaMA and Gemma tokenizers on RISC-V.
3. **openai/tiktoken ([vllm report](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md#9-dependencies))**:
   - **Maintainer Stance**: OpenAI maintainers have ignored and stalled the `riscv64` CI PR ([#506](https://github.com/openai/tiktoken/pull/506)) since March 2026 with no response, blocking GPT-2/GPT-4 tokenization wheels.
4. **numba / llvmlite ([numba](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/numba.md))**:
   - **Maintainer Stance**: Maintainers have ignored and closed `riscv64` support requests ([llvmlite #923](https://github.com/numba/llvmlite/issues/923)). JIT Python numeric acceleration remains completely unsupported on RISC-V.
5. **pydantic / pydantic-core ([langchain report](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/langchain.md#9-dependencies))**:
   - **Maintainer Stance**: Closed the `riscv64` CI PR ([#1901](https://github.com/pydantic/pydantic-core/pull/1901)) without merging.
6. **protocolbuffers / protobuf ([pytorch report](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#9-dependencies))**:
   - **Maintainer Stance**: Abandoned prebuilt `protoc` compiler binary PRs for `riscv64` ([#23206](https://github.com/protocolbuffers/protobuf/issues/23206) / [#23205](https://github.com/protocolbuffers/protobuf/issues/23205)), forcing users to build `protoc` from source.
7. **XNNPACK (`google/XNNPACK`) ([xnnpack](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/xnnpack.md))**:
   - **Maintainer Stance**: Unconditionally enabled the `Zvfh` (FP16) compiler flag (PR #9516) without runtime hardware detection via `cpuinfo`, causing 100+ FP16 test failures (Issue [#9886](https://github.com/google/XNNPACK/issues/9886)). Excluded `riscv64` from default CMake dependencies without explicit user flags.
8. **FBGEMM / NNPACK / psimd**:
   - **Maintainer Stance**: Meta/upstream maintainers explicitly restrict FBGEMM to x86/AArch64, while NNPACK and psimd are archived or unmaintained.

---

## Maintainer Stance Summary Matrix

| Project | Maintainer Stance | Upstream Status | Key Friction Point / Hostility Signal |
| :--- | :--- | :--- | :--- |
| **Linux / glibc / GCC** | 🟢 **Champions** | Tier 1 / Mainline | Full maintainer bench; zero friction. |
| **Go / Rust / OpenJDK** | 🟢 **Champions** | Tier 1/2 Mainline | Active builders; JEP 422 delivered. |
| **llama.cpp** | 🟢 **Champions** | Mainline Merged | Fast reviews; RVV 1.0 kernels merged cleanly. |
| **NumPy** | 🟡 **Traction** | Native CI Merged | Wheel targeted Q3 2026 (release 2.6.0). |
| **vLLM** | 🟡 **Traction** | In-Tree CPU Backend | Merged RVV attention; lacks automated CI & wheels. |
| **PyTorch** | 🔴 **Hostile / Resistant** | Tier 3 (Opt-in) | **Issues placed in "Cold Storage"**; force-merged PRs; unmerged ATen RVV. |
| **sentencepiece** | 🔴 **Hostile / Resistant** | Wheel Reverted | **Explicitly reverted `riscv64` PyPI wheel PR #1226**. |
| **tiktoken** | 🔴 **Hostile / Neglected** | Stalled PR | OpenAI ignored CI PR #506 since March 2026. |
| **numba / llvmlite** | 🔴 **Hostile / Neglected** | Issues Closed | **Closed `riscv64` support request #923 without action**. |
| **protobuf** | 🔴 **Hostile / Neglected** | Abandoned | Abandoned prebuilt `protoc` binary PR #23206. |
