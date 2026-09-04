---
title: Agentic AI inference serving (CPU-only)
parent: Whole-Stack Reports
---

# Agentic AI inference serving (CPU-only)

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-12<br/>
**Scope:** RISC-V readiness of the Agentic AI inference serving (CPU-only) software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under project-reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="agentic-ai-cpu" %}

**Out of scope (deliberately dropped, not classified):** torch.compile pipeline (TorchDynamo, AOTAutograd, TorchInductor, Triton, torch-mlir, IREE, MLIR, LLVM); PyTorch distributed training (NCCL, Gloo collective, torch.distributed); Numba / llvmlite.

## Artifact 1: Layered stack outline

License and governance fields are not captured in the source node records for any node below and are reported as "Data not available" rather than guessed.

### Layer 1 -- Orchestration & Agents

- **LangChain** -- green (critical)
  - Python framework for building LLM applications, chains, and agent orchestration; depends directly on LangGraph and langchain-core.
  - License: Data not available. Governance: Data not available.
- **LangGraph** -- green (critical)
  - Stateful agent-execution engine underlying LangChain's agent runtime; depends on langchain-core plus its own checkpoint/prebuilt/sdk sub-packages.
  - License: Data not available. Governance: Data not available.
- **langchain-core** -- orange (critical)
  - Base abstractions (Runnables, messages, output parsers) that LangChain and LangGraph build on.
  - License: Data not available. Governance: Data not available.
  - Gap: the mandatory `uuid-utils` (Rust) dependency has no riscv64 wheel on upstream PyPI; `pip install langchain-core` does not succeed unmodified on riscv64 and currently depends on a third-party (RISE) wheel mirror.
- **langsmith** -- yellow (optional)
  - Tracing and evaluation SDK for LangChain/LangGraph runs.
  - License: Data not available. Governance: Data not available.
  - Release provided by RISE, not upstream.
- **langgraph-checkpoint** -- green (critical)
  - Base checkpointer interface and state-persistence layer LangGraph uses to save graph state at every step.
  - License: Data not available. Governance: Data not available.
- **langgraph-prebuilt** -- green (optional)
  - Ready-made agent/tool-calling graph constructors (e.g. `create_react_agent`) for LangGraph.
  - License: Data not available. Governance: Data not available.
- **langgraph-sdk** -- green (optional)
  - Thin HTTP/SSE/WebSocket client for a running LangGraph API server.
  - License: Data not available. Governance: Data not available.

### Layer 2 -- Inference Serving

- **vLLM (CPU backend)** -- orange (critical)
  - Continuous-batching, PagedAttention-based OpenAI-compatible inference server; CPU backend built on PyTorch.
  - License: Data not available. Governance: Data not available.
  - Gap: zero riscv64 CI across all GitHub Actions and Buildkite workflows; no PyPI riscv64 wheel and no distro package; the merged RISC-V CPU-backend PRs touch only kernel/cmake code and never add CI.
- **llama.cpp** -- blue (critical)
  - GGUF-format quantized LLM inference engine with in-tree ggml compute library.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, not upstream.
- **ExecuTorch** -- blue (optional)
  - PyTorch's on-device/edge inference runtime, exporting models via `torch.export` for CPU (XNNPACK) execution.
  - License: Data not available. Governance: Data not available.
- **FastAPI** -- green (critical)
  - Web framework used to build the OpenAI-compatible HTTP serving layer (e.g. vLLM's API server).
  - License: Data not available. Governance: Data not available.
- **Starlette** -- green (critical)
  - ASGI toolkit underlying FastAPI.
  - License: Data not available. Governance: Data not available.
- **uvicorn** -- green (critical)
  - ASGI server that runs FastAPI/Starlette applications.
  - License: Data not available. Governance: Data not available.

### Layer 3 -- ML Framework

- **PyTorch (CPU eager inference)** -- yellow (critical)
  - Tensor engine and eager-mode execution backend used by vLLM, ExecuTorch, and HF Transformers for CPU inference.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, not upstream.
  - Gap: upstream's riscv64 CI workflow is a single cross-compile job with no test execution and does not gate pull requests; no official PyPI riscv64 wheel exists.
- **HuggingFace Transformers** -- green (critical)
  - Model-architecture definitions and loading library for pretrained LLMs; pure-Python, backend-agnostic.
  - License: Data not available. Governance: Data not available.
- **Accelerate** -- green (optional)
  - Device-placement and mixed-precision execution helper used internally by Transformers-based inference.
  - License: Data not available. Governance: Data not available.

### Layer 4 -- Model Ecosystem

- **HuggingFace Hub** -- green (critical)
  - Client library for downloading model weights and configs from the Hugging Face Hub.
  - License: Data not available. Governance: Data not available.
- **HuggingFace Tokenizers** -- yellow (critical)
  - Rust-backed fast tokenization library used by Transformers and vLLM.
  - License: Data not available. Governance: Data not available.
  - Gap: upstream CI builds and uploads a riscv64 wheel directly to PyPI but runs no test step against it.
- **SentencePiece** -- blue (critical)
  - Subword tokenizer used for LLaMA/Gemma/T5-family models.
  - License: Data not available. Governance: Data not available.
  - Release provided by RISE, not upstream.
- **Tiktoken** -- yellow (optional)
  - BPE tokenizer used for GPT-2/GPT-4-style models.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu, not upstream.
- **NumPy** -- yellow (critical)
  - Core array/numerics library used across the Python ML stack.
  - License: Data not available. Governance: Data not available.
  - Release provided by RISE, not upstream.
  - Gap: the native-runner build job has no test step, and the QEMU job that does run tests is marked non-gating (`continue-on-error`); no upstream PyPI riscv64 wheel.
- **SafeTensors** -- yellow (critical)
  - Default safe weight-serialization format for model checkpoints.
  - License: Data not available. Governance: Data not available.
  - Gap: upstream CI cross-compiles and publishes the riscv64 wheel straight to PyPI but never executes tests against it.
- **ONNX Runtime (CPU EP)** -- yellow (optional)
  - Optional ONNX model execution engine for the model-load path.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, not upstream.

### Layer 5 -- Compute

- **FAISS (CPU)** -- yellow (critical)
  - Approximate nearest-neighbor vector search library used for RAG retrieval.
  - License: Data not available. Governance: Data not available.
  - Release provided by RISE, not upstream.
  - Gap: upstream's riscv64 QEMU test step is restricted to SIMD-dispatch/compile-option checks, not index correctness.
- **OpenBLAS** -- blue (critical)
  - BLAS/LAPACK backend used by NumPy, PyTorch, vLLM, and llama.cpp for CPU matrix math.
  - License: Data not available. Governance: Data not available.
  - Release provided by distro (Debian/Ubuntu), not upstream.
- **Eigen** -- blue (optional)
  - Header-only C++ linear-algebra library used by ExecuTorch's optimized kernel library.
  - License: Data not available. Governance: Data not available.
- **oneDNN (DNNL)** -- blue (critical)
  - Deep-learning primitives library (conv, matmul, pooling) used by PyTorch's CPU backend and vLLM.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, not upstream.
- **XNNPACK** -- blue (critical)
  - CPU neural-network inference kernel library used by PyTorch, ExecuTorch, and the llama.cpp-adjacent stack.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu/Debian, not upstream.
- **FBGEMM** -- red (optional)
  - Quantized 8-bit matrix-multiply backend for x86/AArch64 server CPU inference in PyTorch.
  - License: Data not available. Governance: Data not available.
- **SLEEF** -- blue (critical)
  - SIMD-vectorized transcendental math library (sin/cos/log/exp) linked by PyTorch.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, not upstream.

### Layer 6 -- Python Infrastructure

- **Pydantic** -- yellow (critical)
  - Schema-validation library used for request/response models across vLLM, FastAPI, LangChain, and LangGraph.
  - License: Data not available. Governance: Data not available.
  - Gap: upstream publishes a riscv64 wheel directly to PyPI, but the emulated-architecture test matrix (armv7, s390x, ppc64le, aarch64) does not include riscv64, so the Rust `pydantic-core` engine is untested before release.
- **httpx** -- green (critical)
  - Async-capable HTTP client used by langchain-core, HuggingFace Hub, and FastAPI's test client.
  - License: Data not available. Governance: Data not available.
- **requests** -- green (critical)
  - Synchronous HTTP client used by LangChain, vLLM, and langsmith.
  - License: Data not available. Governance: Data not available.
- **typing-extensions** -- green (critical)
  - Backported typing constructs used across nearly the entire stack.
  - License: Data not available. Governance: Data not available.
- **packaging** -- green (optional)
  - Version-parsing utility used across the stack.
  - License: Data not available. Governance: Data not available.
- **filelock** -- green (optional)
  - Cross-process file locking used to coordinate model-cache access.
  - License: Data not available. Governance: Data not available.
- **fsspec** -- green (optional)
  - Filesystem abstraction layer used by HuggingFace Transformers/Accelerate.
  - License: Data not available. Governance: Data not available.
- **tenacity** -- green (optional)
  - Retry-logic library used by langchain-core for model/API calls.
  - License: Data not available. Governance: Data not available.
- **tqdm** -- green (optional)
  - Progress-bar library used during model download/loading.
  - License: Data not available. Governance: Data not available.
- **networkx** -- green (optional)
  - Graph-algorithm library, an optional dependency in the tooling chain.
  - License: Data not available. Governance: Data not available.
- **sympy** -- green (optional)
  - Symbolic-math library used by PyTorch for dynamic-shape reasoning.
  - License: Data not available. Governance: Data not available.
- **OpenTelemetry API** -- green (optional)
  - Tracing/observability API used by vLLM and langsmith.
  - License: Data not available. Governance: Data not available.
- **OpenTelemetry SDK** -- green (optional)
  - Tracing/observability SDK implementation backing the OpenTelemetry API.
  - License: Data not available. Governance: Data not available.
- **aiohttp** -- yellow (optional)
  - Async HTTP client used by LangChain and vLLM.
  - License: Data not available. Governance: Data not available.

### Layer 7 -- Runtimes & System Libraries

- **Protobuf (protocolbuffers/protobuf)** -- yellow (optional)
  - Serialization library used by vLLM, PyTorch, ONNX Runtime, and llama.cpp's conversion tooling.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu, not upstream.
- **FlatBuffers** -- yellow (optional)
  - Serialization library used for ExecuTorch's `.pte` program format.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu (also Debian, Arch Linux RISC-V), not upstream.
- **gRPC** -- yellow (optional)
  - RPC framework present in the Protobuf/FlatBuffers ecosystem chain.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu, not upstream.
- **CPython** -- blue (critical)
  - Python interpreter required to run the entire Python-based stack.
  - License: Data not available. Governance: Data not available.
  - Release provided by RISE, not upstream.
- **glibc** -- yellow (critical)
  - C runtime, pthreads, and libm underlying CPython, PyTorch, and every native dependency.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, Ubuntu, Arch Linux RISC-V, Fedora, not upstream (upstream ships source tarballs only).
  - Gap: both native riscv64 Buildbot testers are currently disconnected; when last connected they failed the majority of runs.
- **OpenSSL** -- blue (critical)
  - TLS/crypto library used for HTTPS model downloads and secure serving.
  - License: Data not available. Governance: Data not available.
  - Release provided by distro (Ubuntu 24.04, Debian sid/trixie, Arch Linux RISC-V), not upstream.
- **jemalloc** -- yellow (critical)
  - High-performance memory allocator usable as a PyTorch/vLLM allocator.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu, not upstream.
  - Gap: zero riscv64 CI of any kind upstream (no build, no test); missing the Zihintpause spin-wait hint on a secondary contention path.
- **tcmalloc** -- orange (optional)
  - Google's high-performance allocator, an alternative to jemalloc.
  - License: Data not available. Governance: Data not available.
- **LZ4** -- yellow (critical)
  - Fast compression library used in model/checkpoint I/O paths.
  - License: Data not available. Governance: Data not available.
  - Release provided by Ubuntu, not upstream.
  - Gap: the primary decompression hot path (`LZ4_FAST_DEC_LOOP`/`wildCopy`) remains scalar-only on riscv64; the RVV acceleration PRs are open and unmerged.
- **zstd** -- blue (critical)
  - Compression library used for trace-payload compression (langsmith) and general I/O.
  - License: Data not available. Governance: Data not available.
  - Release provided by Debian, Ubuntu, not upstream.
- **snappy** -- blue (optional)
  - Fast compression library, an alternative codec in the I/O stack.
  - License: Data not available. Governance: Data not available.
  - Release provided by distro (Debian, Ubuntu, Arch Linux RISC-V), not upstream.

### Layer 8 -- Excluded (proprietary / vendor-only)

- **CUDA / cuDNN / cuBLAS / TensorRT / NCCL** -- grey (N/A)
  - Proprietary NVIDIA GPU stack; no RISC-V port exists or is planned; out of scope for the CPU-only investment decision.
  - License: Data not available. Governance: Data not available.
- **ROCm / HIP / MIOpen** -- grey (N/A)
  - AMD GPU stack; no RISC-V port.
  - License: Data not available. Governance: Data not available.
- **Intel GPU / oneAPI GPU** -- grey (N/A)
  - Intel GPU stack; not applicable to a CPU-only target.
  - License: Data not available. Governance: Data not available.
- **Apple MPS / CoreML** -- grey (N/A)
  - Apple-silicon-only stack; not applicable.
  - License: Data not available. Governance: Data not available.
- **Triton GPU compiler** -- grey (N/A)
  - GPU-only JIT compiler; not applicable to a CPU-only target.
  - License: Data not available. Governance: Data not available.
- **torchvision / torchaudio** -- grey (N/A)
  - Multimodal add-ons requiring GPU backends; explicitly excluded from vLLM's riscv64 requirements.
  - License: Data not available. Governance: Data not available.

### Pipeline chains and alternate paths

- **PyTorch CPU eager inference path (RVA23):** PyTorch ATen -> oneDNN (xbyak_riscv JIT) -> XNNPACK -> OpenBLAS -> SLEEF
- **vLLM CPU inference path:** vLLM CPU backend -> PyTorch ATen -> oneDNN -> OpenBLAS
- **llama.cpp GGUF inference path:** llama.cpp -> ggml (in-tree) -> RVV kernels (llamafile SGEMM + ggml-cpu)
- **ExecuTorch edge inference path:** ExecuTorch runtime -> XNNPACK (CPU backend) -> OpenBLAS
- **Agentic RAG pipeline:** LangChain/LangGraph -> langchain-core -> HF Transformers -> vLLM (serving) -> FAISS (retrieval) -> HF Tokenizers / SentencePiece
- **Model load path:** HF Transformers -> HuggingFace Hub -> SafeTensors -> ONNX Runtime (optional)
- **vLLM HTTP serving path:** vLLM CPU backend -> FastAPI -> Starlette -> uvicorn -> Pydantic (request/response schemas)
- **LangGraph stateful agent path:** LangGraph -> langchain-core -> langgraph-checkpoint (state) -> langsmith (tracing) -> pydantic (types)

## Artifact 2: Status table

### (a) Full table

| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
|---|---|---|---|---|---|---|---|---|
| LangChain | Orchestration & Agents | critical | green | upstream | Ships only a `py3-none-any` wheel; no compiled/architecture-specific code; installs unmodified on riscv64. | [PyPI JSON](https://pypi.org/pypi/langchain/json) | 2026-06-17 | none - PyPI version advanced, same wheel pattern |
| LangGraph | Orchestration & Agents | critical | green | upstream | Pure-Python package, `py3-none-any` wheel only, no native extension. | [PyPI JSON](https://pypi.org/pypi/langgraph/json) | 2026-06-17 | none |
| langchain-core | Orchestration & Agents | critical | orange | upstream | Wheel itself is `py3-none-any`, but its mandatory `uuid-utils` (Rust) dependency has no upstream riscv64 wheel. | [uuid-utils PyPI JSON](https://pypi.org/pypi/uuid-utils/json) | 2026-06-17 | Report already flagged uuid-utils gap; RISE mirror confirmed live, not in report |
| langsmith | Orchestration & Agents | optional | yellow | RISE | Mandatory `orjson` (Rust) dependency has no upstream riscv64 wheel or CI; builds via Debian/RISE from unmodified source. | [orjson PyPI JSON](https://pypi.org/pypi/orjson/json) | 2026-09-04 | n/a (no prior report) |
| langgraph-checkpoint | Orchestration & Agents | critical | green | upstream | Pure-Python, `py3-none-any` wheel across all 60 published versions; no compiled extensions. | [PyPI JSON](https://pypi.org/pypi/langgraph-checkpoint/json) | 2026-06-17 | none |
| langgraph-prebuilt | Orchestration & Agents | optional | green | upstream | `py3-none-any` wheel; depends only on langchain-core and langgraph-checkpoint, both pure Python. | [PyPI JSON](https://pypi.org/pypi/langgraph-prebuilt/json) | 2026-06-17 | none |
| langgraph-sdk | Orchestration & Agents | optional | green | upstream | `py3-none-any` wheel; pure-Python hatchling build with no compiled components. | [PyPI JSON](https://pypi.org/pypi/langgraph-sdk/json) | 2026-06-17 | none |
| vLLM (CPU backend) | Inference Serving | critical | orange | none | Zero riscv64 CI across GitHub Actions and Buildkite; no PyPI riscv64 wheel; no distro package. | [cpu.yaml](https://github.com/vllm-project/vllm/blob/main/.buildkite/hardware_tests/cpu.yaml) | 2026-06-17 | none - workflow count corrected 12->11 |
| llama.cpp | Inference Serving | critical | blue | debian | Upstream CI builds and runs the test suite on native riscv64 hardware; releases ship no riscv64 asset; Debian packages it. | [build-riscv.yml](https://github.com/ggerganov/llama.cpp/blob/master/.github/workflows/build-riscv.yml) | 2026-09-04 | none - two previously "open" issues now closed |
| ExecuTorch | Inference Serving | optional | blue | none | Upstream riscv64 CI cross-compiles and executes real QEMU tests, passing 10 of 12 recent runs; no riscv64 release anywhere. | [riscv64.yml](https://github.com/pytorch/executorch/blob/main/.github/workflows/riscv64.yml) | 2026-06-17 | none |
| FastAPI | Inference Serving | critical | green | upstream | `py3-none-any` wheel only; installs unmodified on riscv64. | [PyPI JSON](https://pypi.org/pypi/fastapi/json) | 2026-09-04 | n/a |
| Starlette | Inference Serving | critical | green | upstream | `py3-none-any` wheel only, pure-Python hatchling build. | [PyPI JSON](https://pypi.org/pypi/starlette/json) | 2026-09-04 | n/a |
| uvicorn | Inference Serving | critical | green | upstream | `py3-none-any` wheel; mandatory dependency chain (click, h11, typing-extensions) entirely pure Python. | [PyPI JSON](https://pypi.org/pypi/uvicorn/json) | 2026-09-04 | n/a |
| PyTorch (CPU eager inference) | ML Framework | critical | yellow | Debian | Upstream riscv64 CI is a single cross-compile job with no test execution and does not gate PRs; no PyPI riscv64 wheel. | [riscv64.yml](https://github.com/pytorch/pytorch/blob/main/.github/workflows/riscv64.yml) | 2026-06-17 | Ubuntu now also ships a synced riscv64 build; color unchanged |
| HuggingFace Transformers | ML Framework | critical | green | upstream | No compiled extensions anywhere in the codebase; `py3-none-any` wheel only. | [PyPI JSON](https://pypi.org/pypi/transformers/json) | 2026-06-17 | none |
| Accelerate | ML Framework | optional | green | upstream | `py3-none-any` wheel; plain setuptools build with no `ext_modules`. | [PyPI JSON](https://pypi.org/pypi/accelerate/json) | 2026-09-04 | n/a |
| HuggingFace Hub | Model Ecosystem | critical | green | upstream | `py3-none-any` wheel; optional Rust acceleration (hf-xet) is deliberately excluded on riscv64 with a clean fallback. | [PyPI JSON](https://pypi.org/pypi/huggingface_hub/json) | 2026-09-04 | n/a |
| HuggingFace Tokenizers | Model Ecosystem | critical | yellow | upstream | Upstream CI cross-compiles and uploads riscv64 wheels directly to PyPI, but runs no tests against them. | [CI.yml](https://github.com/huggingface/tokenizers/blob/main/.github/workflows/CI.yml) | 2026-06-17 | none |
| SentencePiece | Model Ecosystem | critical | blue | RISE | Upstream cross-build CI compiles and runs the QEMU test suite on riscv64 (currently green); no riscv64 wheel on PyPI. | [cross_build.yml](https://github.com/google/sentencepiece/blob/master/.github/workflows/cross_build.yml) | 2026-05-02 | CI now green again (was failing at report time); still no PyPI wheel |
| Tiktoken | Model Ecosystem | optional | yellow | ubuntu | No upstream riscv64 CI or PyPI wheel; Ubuntu ships an unpatched riscv64 build of the underlying source. | [Ubuntu package search](https://packages.ubuntu.com/search?keywords=tiktoken&searchon=names&suite=resolute&section=all) | 2026-09-04 | none |
| NumPy | Model Ecosystem | critical | yellow | RISE | Native-runner build job has no test step; the QEMU job that does run tests is non-gating; riscv64 wheels come from RISE. | [linux_qemu.yml](https://github.com/numpy/numpy/blob/main/.github/workflows/linux_qemu.yml) | 2026-06-17 | none |
| SafeTensors | Model Ecosystem | critical | yellow | upstream | Upstream CI cross-compiles and publishes the riscv64 wheel straight to PyPI but never executes tests against it. | [python-release.yml](https://github.com/safetensors/safetensors/blob/main/.github/workflows/python-release.yml) | 2026-06-09 | none |
| ONNX Runtime (CPU EP) | Model Ecosystem | optional | yellow | Debian | No riscv64 CI, release, or PyPI wheel; Debian ships an unpatched riscv64 build from source. | [Debian buildd](https://buildd.debian.org/status/package.php?p=onnxruntime&suite=sid) | 2026-06-17 | none - kernel dir and workflow count grew, no color change |
| FAISS (CPU) | Compute | critical | yellow | RISE | Upstream riscv64 CI restricts QEMU test execution to SIMD-dispatch/compile-option checks, not index correctness. | [build-pull-request.yml](https://github.com/facebookresearch/faiss/blob/main/.github/workflows/build-pull-request.yml) | 2026-09-04 | release_provider corrected to RISE; RVV coverage broader than report stated |
| OpenBLAS | Compute | critical | blue | distro (Debian/Ubuntu) | Upstream CI builds and genuinely executes the BLAS/CBLAS test suite under QEMU for multiple riscv64 targets; no upstream binary release. | [riscv64_vector.yml](https://github.com/OpenMathLib/OpenBLAS/blob/develop/.github/workflows/riscv64_vector.yml) | 2026-06-17 | none - TRSM kernel PR merged, no color effect |
| Eigen | Compute | optional | blue | upstream | Native riscv64 CI runs the full CTest suite on real hardware (non-gating, some runner instability); no tagged release has RVV support yet. | [test.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml) | 2026-06-17 | confidence downgraded high->medium; CI less reliable than report implied |
| oneDNN (DNNL) | Compute | critical | blue | Debian | Two-stage CI (cross-compile build, then QEMU-emulated ctest execution) genuinely tests riscv64; no riscv64 binary in any GitHub release. | [ci-riscv.yml](https://github.com/uxlfoundation/oneDNN/blob/main/.github/workflows/ci-riscv.yml) | 2026-06-17 | none |
| XNNPACK | Compute | critical | blue | Ubuntu/Debian | Dedicated riscv64 CI job builds and runs ctest, currently passing; project has no releases/tags at all. | [build.yml](https://github.com/google/XNNPACK/blob/master/.github/workflows/build.yml) | 2026-04-07 | report's "red" framing of FP16 CI overstated; corrected to blue |
| FBGEMM | Compute | optional | red | none | No riscv64 CI; the GEMM dispatch path unconditionally throws a runtime error for any non-x86/non-aarch64 architecture. | [Fbgemm.cc](https://github.com/pytorch/FBGEMM/blob/main/src/Fbgemm.cc) | 2026-09-04 | none - source-file citation only |
| SLEEF | Compute | critical | blue | Debian | Upstream CI builds riscv64 and runs ctest unconditionally, though the README still marks RVV support "unmaintained"; Debian/Ubuntu ship the binary. | [Jenkinsfile](https://github.com/shibatch/sleef/blob/master/Jenkinsfile) | 2026-06-17 | none - Ubuntu 26.04 riscv64 availability newly confirmed |
| Pydantic | Python Infrastructure | critical | yellow | upstream | Upstream builds a riscv64 wheel and publishes it to PyPI, but the emulated-architecture test matrix never includes riscv64. | [ci.yml](https://github.com/pydantic/pydantic/blob/main/.github/workflows/ci.yml) | 2026-09-04 | n/a (no prior report) |
| httpx | Python Infrastructure | critical | green | upstream | `py3-none-any` wheel only; entire base dependency chain is pure Python. | [PyPI JSON](https://pypi.org/pypi/httpx/json) | 2026-09-04 | n/a |
| requests | Python Infrastructure | critical | green | upstream | `py3-none-any` wheel; plain setuptools build with no compiled extension. | [PyPI JSON](https://pypi.org/pypi/requests/json) | 2026-09-04 | n/a |
| typing-extensions | Python Infrastructure | critical | green | upstream | `py3-none-any` wheel; zero compiled source files in the repository. | [PyPI JSON](https://pypi.org/pypi/typing-extensions/json) | 2026-09-04 | n/a |
| packaging | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; pure-Python flit_core build. | [PyPI JSON](https://pypi.org/pypi/packaging/json) | 2026-09-04 | n/a |
| filelock | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; pure-Python hatchling build, zero runtime dependencies. | [PyPI JSON](https://pypi.org/pypi/filelock/json) | 2026-09-04 | n/a |
| fsspec | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; zero compiled source files across the full repository tree. | [PyPI JSON](https://pypi.org/pypi/fsspec/json) | 2026-09-04 | n/a |
| tenacity | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; zero C/C++/Rust files in the repository. | [PyPI JSON](https://pypi.org/pypi/tenacity/json) | 2026-09-04 | n/a |
| tqdm | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; plain setuptools build with no compiled extension. | [PyPI JSON](https://pypi.org/pypi/tqdm/json) | 2026-09-04 | n/a |
| networkx | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; setuptools build with zero mandatory dependencies. | [PyPI JSON](https://pypi.org/pypi/networkx/json) | 2026-09-04 | n/a |
| sympy | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; no `ext_modules` or compiled build step. | [PyPI JSON](https://pypi.org/pypi/sympy/json) | 2026-09-04 | n/a |
| OpenTelemetry API | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; plain hatchling build with no native extension. | [PyPI JSON](https://pypi.org/pypi/opentelemetry-api/json) | 2026-09-04 | n/a |
| OpenTelemetry SDK | Python Infrastructure | optional | green | upstream | `py3-none-any` wheel; pure-Python hatchling build confirmed. | [PyPI JSON](https://pypi.org/pypi/opentelemetry-sdk/json) | 2026-06-17 | none |
| aiohttp | Python Infrastructure | optional | yellow | upstream | Upstream builds and publishes riscv64 wheels to PyPI via QEMU cibuildwheel, but the test command is unconditionally disabled for all platforms. | [ci-cd.yml](https://github.com/aio-libs/aiohttp/blob/master/.github/workflows/ci-cd.yml) | 2026-07-23 | n/a (no prior report) |
| Protobuf (protocolbuffers/protobuf) | Runtimes & System Libraries | optional | yellow | ubuntu | No upstream riscv64 CI or release asset; maintainers stated RISC-V is not on the roadmap; Ubuntu ships an unpatched riscv64 build. | [Ubuntu package search](https://packages.ubuntu.com/resolute/riscv64/protobuf-compiler) | 2026-06-17 | none |
| FlatBuffers | Runtimes & System Libraries | optional | yellow | Ubuntu (also Debian, Arch Linux RISC-V) | No upstream riscv64 CI or release asset; Ubuntu/Debian/Arch all ship unpatched riscv64 builds of pure scalar C++ code. | [build.yml](https://github.com/google/flatbuffers/blob/master/.github/workflows/build.yml) | 2026-02-09 | none - resolves prior "needs verification" on Ubuntu |
| gRPC | Runtimes & System Libraries | optional | yellow | ubuntu | No upstream riscv64 CI; a riscv64 support request was explicitly declined; Ubuntu ships an unpatched riscv64 build. | [Ubuntu package search](https://packages.ubuntu.com/search?keywords=libgrpc-dev&searchon=names&suite=resolute&section=all) | 2026-06-17 | issue closed/declined since report; strengthens yellow |
| CPython | Runtimes & System Libraries | critical | blue | RISE | A fleet of stable, RISE-provided riscv64 buildbots runs and passes the full CPython test suite; riscv64 is now PEP 11 Tier 3; upstream ships no riscv64 release binary. | [buildbot build 250](https://buildbot.python.org/all/#/builders/2189/builds/250) | 2026-08-22 | moved yellow->blue: new stable RISE buildbots passing, PEP 11 Tier 3 promotion |
| glibc | Runtimes & System Libraries | critical | yellow | Debian, Ubuntu, Arch Linux RISC-V, Fedora | Both native riscv64 Buildbot testers are currently disconnected; when last active they failed most runs; distros ship unpatched riscv64 builds. | [Buildbot API](https://builder.sourceware.org/buildbot/api/v2/builders/293/builds?limit=20&order=-number) | 2025-01-30 | refinement - tests do run and fail, not merely untested; color unchanged |
| OpenSSL | Runtimes & System Libraries | critical | blue | distro (Ubuntu, Debian sid/trixie, Arch Linux RISC-V) | Upstream CI genuinely builds and tests riscv64 under QEMU on every push/PR; upstream ships source-only tarballs for every architecture. | [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml) | 2026-06-17 | none |
| jemalloc | Runtimes & System Libraries | critical | yellow | ubuntu | Zero riscv64 CI of any kind upstream; Ubuntu/Debian ship an unpatched riscv64 build; missing a minor Zihintpause optimization. | [linux-ci.yml](https://github.com/jemalloc/jemalloc/blob/dev/.github/workflows/linux-ci.yml) | 2026-06-17 | none |
| tcmalloc | Runtimes & System Libraries | optional | orange | none | No riscv64 CI or best-effort platform support; the per-CPU RSEQ allocator path is gated to x86_64/aarch64 only and silently falls back on riscv64. | [ci.yml](https://github.com/google/tcmalloc/blob/master/.github/workflows/ci.yml) | 2026-09-04 | CI mechanism migrated to GitHub Actions post-report; still no riscv64 job |
| LZ4 | Runtimes & System Libraries | critical | yellow | ubuntu | Upstream CI genuinely tests riscv64, but the primary decompression hot path remains scalar-only (RVV PRs open, unmerged). | [cross-platform.yml](https://github.com/lz4/lz4/blob/dev/.github/workflows/cross-platform.yml) | 2024-07-22 | none |
| zstd | Runtimes & System Libraries | critical | blue | Debian, Ubuntu | Upstream CI genuinely runs the test suite for riscv64 (including RVV variants) under QEMU on PRs; upstream ships no Linux binaries for any architecture. | [dev-short-tests.yml](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml) | 2026-06-17 | none - release_provider field corrected |
| snappy | Runtimes & System Libraries | optional | blue | distro (Debian, Ubuntu, Arch RISC-V) | Upstream CI builds and runs real tests/benchmarks on riscv64; zero release binary assets for any architecture upstream. | [riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml) | 2025-03-26 | minor citation correction only |
| CUDA / cuDNN / cuBLAS / TensorRT / NCCL | Excluded | n/a | grey | none | Proprietary NVIDIA GPU path; no RISC-V port exists or is planned. | Data not available | 2026-08-12 | n/a |
| ROCm / HIP / MIOpen | Excluded | n/a | grey | none | AMD GPU path; no RISC-V port. | Data not available | 2026-08-12 | n/a |
| Intel GPU / oneAPI GPU | Excluded | n/a | grey | none | Intel GPU path; not applicable to CPU-only target. | Data not available | 2026-08-12 | n/a |
| Apple MPS / CoreML | Excluded | n/a | grey | none | Apple silicon only; not applicable. | Data not available | 2026-08-12 | n/a |
| Triton GPU compiler | Excluded | n/a | grey | none | GPU-only JIT compiler; not applicable to CPU-only target. | Data not available | 2026-08-12 | n/a |
| torchvision / torchaudio | Excluded | n/a | grey | none | Multimodal add-ons requiring GPU backends; explicitly excluded in vLLM riscv64 requirements. | Data not available | 2026-08-12 | n/a |

### (b) Slide-ready summary table

| Node | Color | Criticality | Release provider |
|---|---|---|---|
| LangChain | green | critical | upstream |
| LangGraph | green | critical | upstream |
| langchain-core | orange | critical | upstream |
| langsmith | yellow | optional | RISE |
| langgraph-checkpoint | green | critical | upstream |
| langgraph-prebuilt | green | optional | upstream |
| langgraph-sdk | green | optional | upstream |
| vLLM (CPU backend) | orange | critical | none |
| llama.cpp | blue | critical | debian |
| ExecuTorch | blue | optional | none |
| FastAPI | green | critical | upstream |
| Starlette | green | critical | upstream |
| uvicorn | green | critical | upstream |
| PyTorch (CPU eager inference) | yellow | critical | Debian |
| HuggingFace Transformers | green | critical | upstream |
| Accelerate | green | optional | upstream |
| HuggingFace Hub | green | critical | upstream |
| HuggingFace Tokenizers | yellow | critical | upstream |
| SentencePiece | blue | critical | RISE |
| Tiktoken | yellow | optional | ubuntu |
| NumPy | yellow | critical | RISE |
| SafeTensors | yellow | critical | upstream |
| ONNX Runtime (CPU EP) | yellow | optional | Debian |
| FAISS (CPU) | yellow | critical | RISE |
| OpenBLAS | blue | critical | distro (Debian/Ubuntu) |
| Eigen | blue | optional | upstream |
| oneDNN (DNNL) | blue | critical | Debian |
| XNNPACK | blue | critical | Ubuntu/Debian |
| FBGEMM | red | optional | none |
| SLEEF | blue | critical | Debian |
| Pydantic | yellow | critical | upstream |
| httpx | green | critical | upstream |
| requests | green | critical | upstream |
| typing-extensions | green | critical | upstream |
| packaging | green | optional | upstream |
| filelock | green | optional | upstream |
| fsspec | green | optional | upstream |
| tenacity | green | optional | upstream |
| tqdm | green | optional | upstream |
| networkx | green | optional | upstream |
| sympy | green | optional | upstream |
| OpenTelemetry API | green | optional | upstream |
| OpenTelemetry SDK | green | optional | upstream |
| aiohttp | yellow | optional | upstream |
| Protobuf (protocolbuffers/protobuf) | yellow | optional | ubuntu |
| FlatBuffers | yellow | optional | Ubuntu/Debian/Arch |
| gRPC | yellow | optional | ubuntu |
| CPython | blue | critical | RISE |
| glibc | yellow | critical | Debian/Ubuntu/Arch/Fedora |
| OpenSSL | blue | critical | distro |
| jemalloc | yellow | critical | ubuntu |
| tcmalloc | orange | optional | none |
| LZ4 | yellow | critical | ubuntu |
| zstd | blue | critical | Debian/Ubuntu |
| snappy | blue | optional | distro |
| CUDA / cuDNN / cuBLAS / TensorRT / NCCL | grey | n/a | none |
| ROCm / HIP / MIOpen | grey | n/a | none |
| Intel GPU / oneAPI GPU | grey | n/a | none |
| Apple MPS / CoreML | grey | n/a | none |
| Triton GPU compiler | grey | n/a | none |
| torchvision / torchaudio | grey | n/a | none |

## Artifact 3: Narrative and next steps

**Scorecard**

Of 31 critical-path nodes: 11 green, 9 blue, 9 yellow, 2 orange.
Of 24 optional nodes: 12 green, 3 blue, 7 yellow, 1 orange, 1 red.

Six additional nodes (CUDA/cuDNN/cuBLAS/TensorRT/NCCL, ROCm/HIP/MIOpen, Intel GPU/oneAPI GPU, Apple MPS/CoreML, Triton GPU compiler, torchvision/torchaudio) are classified grey/N/A -- proprietary or vendor-only paths that are not part of the RISC-V CPU-only investment decision and are excluded from both counts above.

**The story**

Two critical-path nodes are orange and directly gate the vertical. **vLLM (CPU backend)**, the OpenAI-compatible serving engine underlying both the vLLM CPU inference path and the vLLM HTTP serving path, has zero riscv64 CI anywhere upstream (GitHub Actions or Buildkite), no PyPI riscv64 wheel, and no distro package; active RISC-V kernel/cmake PRs are being merged but none add CI, so there is no tested, installable vLLM on riscv64 today. **langchain-core**, the base-abstraction layer every LangChain and LangGraph path depends on, is blocked by its mandatory `uuid-utils` (Rust) dependency, which has no riscv64 wheel on upstream PyPI -- `pip install langchain-core` does not succeed unmodified on riscv64. One optional node is outright broken: **FBGEMM** (red) throws a runtime error for any non-x86/non-aarch64 architecture, including riscv64; it is not on the critical path for this vertical (the bf16/fp32 route through XNNPACK/oneDNN is what agentic CPU inference actually exercises) but should be flagged if quantized-8-bit work is ever planned. **tcmalloc** (orange, optional) has no riscv64 CI and its core per-CPU RSEQ allocator path silently falls back to a slower generic path on the architecture.

Nine critical-path nodes are yellow, meaning riscv64 artifacts exist or nearly exist but are not verified by upstream tests before release -- the "no test gate" cluster leadership should treat as latent risk, not confirmed breakage. **PyTorch**, the single dependency shared by vLLM, ExecuTorch, and llama.cpp's own conversion tooling, has upstream CI that only cross-compiles (no test execution, does not gate PRs) and ships no PyPI riscv64 wheel at all -- Debian's package is the only usable build today. **HuggingFace Tokenizers**, **SafeTensors**, **NumPy**, **FAISS**, and **Pydantic** all have upstream CI that builds (and in most cases publishes) a riscv64 artifact but never runs a real test against it (NumPy's one QEMU test job that does run is explicitly marked non-gating, and FAISS's QEMU tests check only SIMD dispatch, not index correctness). **glibc** and **jemalloc** sit at the base of the stack with essentially no live riscv64 CI signal: glibc's native Buildbot testers are currently disconnected (and failed most runs when last active), and jemalloc has no riscv64 CI of any kind, build or test. **LZ4**'s primary decompression hot path is still scalar-only on riscv64, with the RVV acceleration PRs open and unmerged.

**Third-party (non-upstream) release risk.** A majority of the Compute and Runtimes & System Libraries layers -- the foundation every other layer sits on -- reach riscv64 users only through a party other than the project itself: **llama.cpp, PyTorch, oneDNN, SLEEF, ONNX Runtime** ship via **Debian**; **OpenBLAS, XNNPACK, OpenSSL, snappy** ship via a **distro floor (Debian/Ubuntu/Arch)**; **Protobuf, FlatBuffers, gRPC, jemalloc, LZ4** ship via **Ubuntu**; **zstd** ships via **Debian/Ubuntu**; and **SentencePiece, NumPy, FAISS, langsmith, CPython** are bridged by **RISE** (wheel mirror or hosted buildbot hardware). **vLLM, ExecuTorch, FBGEMM, and tcmalloc** have no release provider of any kind -- not even a distro package -- which is a strictly worse position than the third-party-bridged nodes above. This pattern means RISC-V readiness for this vertical is currently substantially carried by distro packagers and by RISE, not by the upstream projects themselves; if any of those third parties deprioritize riscv64, several yellow/blue nodes would regress toward orange.

**Actionable next steps**

1. **Highest priority -- vLLM riscv64 CI (orange, critical).** vLLM maintainers are best positioned: RISC-V CPU-backend PRs are already being merged into `csrc/cpu` and cmake, so the missing piece is a Buildkite riscv64 CPU test lane (following the pattern OpenBLAS and oneDNN already run) rather than new kernel work.
2. **Resolve the langchain-core / uuid-utils blocker (orange, critical).** Either get `uuid-utils` a riscv64 wheel on upstream PyPI, or have langchain-core relax the dependency. RISE already publishes a working riscv64 `uuid-utils` wheel via its mirror as a stopgap -- treat this as bridged, not solved, since it is not on the standard `pip install` path.
3. **PyTorch: add a test-execution stage to the existing riscv64 cross-compile CI and publish an official riscv64 wheel (yellow, critical).** PyTorch is the shared dependency of vLLM, HF Transformers/Accelerate, and llama.cpp's conversion tooling; today Debian's package is the only usable build anywhere.
4. **Close the build-only-CI gap on four already-building nodes (yellow, critical): HuggingFace Tokenizers, SafeTensors, NumPy, Pydantic.** Each already has a working riscv64 cross-compile/wheel pipeline; the only missing step is turning on the test job that would gate releases. This is comparatively low-effort, high-value upstream work.
5. **FAISS: extend the riscv64 QEMU test step beyond SIMD-dispatch checks to real index correctness tests (yellow, critical).** The RVV distance-kernel work (fvec_L2sqr/fvec_inner_product) has already landed; testing it is the remaining gap.
6. **glibc and jemalloc: restore/add riscv64 CI (yellow, critical).** glibc's native Buildbot riscv64 testers need to be reconnected and their failures triaged; jemalloc needs a riscv64 CI job added from scratch. Native riscv64 hardware is the binding constraint for both -- RISE or another hardware-hosting party is best positioned to provide and keep runners connected, as it already does for CPython's Tier 3 riscv64 buildbots.
7. **Do not double-count work RISE already covers.** RISE's wheel builder already bridges otherwise-missing riscv64 wheels for langsmith's `orjson` dependency, `uuid-utils`, SentencePiece, NumPy, and FAISS, and RISE-provided hardware already backs CPython's passing Tier 3 riscv64 buildbots. New investment should target the nodes with **no** third-party coverage at all -- vLLM, ExecuTorch, FBGEMM, tcmalloc (`release_provider: none`) -- rather than re-funding work already underway.
8. **Track distro-floor dependence as an ongoing risk, not a one-time finding.** Because so much of the Compute and Runtimes layers currently depend on Debian/Ubuntu/Arch packaging of unmodified upstream source, this report's per-node "release provider" column should be re-checked on the same cadence as the underlying project reports, since a distro deprioritizing riscv64 would silently regress several blue/yellow nodes with no warning from upstream itself.