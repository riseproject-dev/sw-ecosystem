---
title: "Agentic AI Status on RISC-V Architecture"
parent: Prompts
---

# Agentic AI Status on RISC-V Architecture: LangChain, vLLM, and PyTorch

**Date:** July 2026  
**Target Platform:** RISC-V (`riscv64/linux`)  
**Scope:** Evaluation of Agentic AI stack components ([LangChain](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/langchain.md), [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md), and [PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/pytorch.md))

---

## Executive Overview

An **Agentic AI stack** on RISC-V is currently in an **early-to-transitional stage**:
- **LangChain** (Orchestration): **Fully functional** at the Python layer. It installs cleanly, but relies on binary dependencies (`tiktoken`, `faiss-cpu`, `uuid-utils`) that require manual compilation.
- **vLLM** (Local Inference Engine): **Functional for text inference from source** with RVV vector acceleration (VLEN=128 and VLEN=256), but lacks prebuilt PyPI wheels and CI test coverage.
- **PyTorch** (Core Deep Learning Engine): **Builds from source** and supports basic CPU + oneDNN/XNNPACK operations, but core ATen RVV vectorization is still pending upstream merge, and no prebuilt PyPI wheels exist.

---

## Component-by-Component Analysis

### 1. LangChain ([project-reports/langchain.md](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/langchain.md))
- **Architecture**: Pure Python (99.2%). Ships as a platform-agnostic `py3-none-any` wheel.
- **What Works Today**:
  - Core agent abstractions, prompt chaining, tools, memory, and text splitters work identically to x86_64 and arm64.
  - Remote API orchestration (OpenAI, Anthropic, Ollama, etc.) works natively out of the box (`pip install langchain`).
  - Baseline dependencies like `pydantic`, `requests`, `PyYAML`, and `aiohttp` are fully functional.
- **What Does NOT Work / Friction Points**:
  - **`uuid-utils` wheel gap**: `pip install langchain-core` fails unless `--no-binary uuid-utils` is passed or pure-Python `uuid` fallback is used.
  - **Tokenization & Vector Stores**: `tiktoken` (OpenAI tokenization) and `faiss-cpu` (vector DB) have no `riscv64` PyPI wheels and must be built from source using Rust/CMake.
  - **Local Model Execution**: Any local agent workflow depends on PyTorch and vLLM.

---

### 2. vLLM Engine ([project-reports/vllm.md](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md))
- **Architecture**: In-tree CPU backend supporting RVV 1.0 (VLEN=128 on Sophgo SG2044; VLEN=256 on SpacemiT X100/K1).
- **What Works Today**:
  - **Text Inference**: FP32, FP16, and BF16 models (e.g., LLaMA, SmolLM2) run using RVV-optimized attention kernels (`vfmacc_vf` scalar-broadcast FMA).
  - **Quantization**: WNA16 / GPTQ dequantization (`vrgather`) and oneDNN W8A8 INT8.
  - **Multi-VLEN**: Dynamic VLEN detection and compilation flag handling.
- **What Does NOT Work / Gaps**:
  - **No PyPI Wheels**: Zero prebuilt wheels exist on PyPI (`pip install vllm` fails). Must compile from source using:
    ```bash
    CMAKE_ARGS="-DVLLM_RVV_VLEN=256" VLLM_TARGET_DEVICE=cpu uv pip install . --no-build-isolation
    ```
  - **No Automated CI**: No automated upstream RISC-V CI runs on PRs; regressions are detected manually.
  - **Feature Gaps**: Chunked prefill is unconditionally disabled; FP8 KV cache is missing; multimodal models (vision/audio) are disabled because `torchaudio`/`torchvision` wheels are excluded.
  - **Sentencepiece Gap**: Upstream `sentencepiece` wheel reverts block standard `pip install` for LLaMA/Gemma tokenizers.

---

### 3. PyTorch ([project-reports/pytorch.md](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/pytorch.md))
- **Architecture**: Tier 3 (community-maintained). Cross-compiles with GCC 14+; native CI relay available via RISE Runners (Scaleway EM-RV1).
- **What Works Today**:
  - Basic CPU tensor operations and Inductor C++ code generator (`cpp.march` support).
  - `oneDNN` acceleration (~8.85x speedup for elementwise ops on SG2044).
  - `XNNPACK` microkernels (344+ RVV source files for F32/QS8/QU8).
  - Debian sid packages (`v2.12.0+dfsg2-4` built for `riscv64`).
- **What Does NOT Work / Gaps**:
  - **No `pip install torch` Binary**: No official `riscv64` PyPI wheels exist across any PyTorch release. Source builds take hours.
  - **ATen RVV Vectorization Unmerged**: Core ATen `Vectorized<>` RVV template library ([PR #175746](https://github.com/pytorch/pytorch/pull/175746)) remains unmerged due to scalable-vector memory copy design debates (`Vectorized::size()`). All non-XNNPACK/oneDNN tensor ops fall back to scalar execution.
  - **XNNPACK FP16 (Zvfh) Issue**: 100+ FP16 test failures occur due to missing `cpuinfo_has_riscv_zvfh()` API.
  - **No JIT / Triton**: `torch.compile` Triton/JIT backends for RISC-V do not exist yet.

---

## Summary Matrix

| Layer | Component | Execution Status | PyPI Binary Wheel | RISC-V Vector Acceleration |
| :--- | :--- | :--- | :--- | :--- |
| **Agent Framework** | [LangChain](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/langchain.md) | ✅ Works (Pure Python) | ✅ `py3-none-any` | N/A (Delegated) |
| **Inference Engine** | [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md) | ⚠️ Source Build Required | ❌ None | ✅ RVV 1.0 (VLEN=128 & 256) |
| **Tensor Backend** | [PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/pytorch.md) | ⚠️ Source Build Required | ❌ None | ⚠️ Partial (oneDNN/XNNPACK; ATen scalar) |

---

## Practical Verdict for RISC-V Deployments

1. **Cloud / API-based Agentic AI**: **Ready today.** If your LangChain agent routes calls to external APIs or remote endpoints, it runs out of the box on RISC-V.
2. **Local / On-Device Inference Agentic AI**: **Possible, but requires building from source.** Local LLM agents can run using vLLM or PyTorch on hardware like Sophgo SG2044 or SpacemiT X100, but require compiling PyTorch, vLLM, `tiktoken`, and `faiss-cpu` manually.
