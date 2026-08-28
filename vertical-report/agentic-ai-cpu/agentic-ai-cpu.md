---
title: Agentic AI inference serving (CPU-only) -- RISC-V Ecosystem Status
---

# Agentic AI inference serving (CPU-only) -- RISC-V Ecosystem Status

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-12<br/>
**Scope:** RISC-V readiness of the Agentic AI inference serving (CPU-only) software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

**Out of scope (deliberately excluded, not assessed):** torch.compile pipeline (TorchDynamo, AOTAutograd, TorchInductor, Triton, torch-mlir, IREE, MLIR, LLVM); PyTorch distributed training (NCCL, Gloo collective, torch.distributed); Numba / llvmlite.

---

## Artifact 1: Layered stack outline

### Color key

| Color | Meaning |
|-------|---------|
| green | Upstream ships riscv64 artifact; architecture-independent or test-passing CI |
| blue | Tests run and pass in CI (upstream or verified downstream); no upstream binary release |
| yellow | Build-only CI, clean distro build, or minimal optimization cap on blue CI |
| orange | No CI, no clean distro build, or optimization entirely absent |
| red | Confirmed broken on riscv64 |
| grey | Not applicable (proprietary / GPU-only / out-of-scope) |

---

## Layer 1 -- Runtimes & System Libraries

- **CPython** -- blue (critical)
  - Reference Python 3.x interpreter; required by all Python-based inference serving components.
  - License: PSF License 2.0. Governance: Python Software Foundation.
  - Release provided by RISE (riseproject-dev/python-versions), not upstream.
  - Gap: Upstream CPython buildbot riscv64 runner (builder 1377, "riscv64 Ubuntu23 PR") fires only on-demand per PR, not continuously; the last observed run was 2026-06-30 (build #34, passing), with no subsequent runs in the following ~59 days. No riscv64 binary is published by python.org.

- **glibc** -- yellow (critical)
  - GNU C Library; the ABI foundation for all native code on Linux riscv64.
  - License: LGPL v2.1+. Governance: FSF / GNU Project.
  - Release provided by Ubuntu (Noble 24.04 ships 2.39) and Debian sid.
  - Gap: In-tree cross-compile CI has no test execution on riscv64. Sourceware Buildbot riscv64 builders (IDs 293, 336) attempt tests but return result=2 (failure) on every observable run and are currently offline. Ubuntu Noble 24.04 ships glibc 2.39, which predates the `__SYSCALL_CLOBBERS` vector-clobber fix (Sep 2025) and BZ#32932 (hwprobe prototype, glibc 2.42) -- a concrete deployment risk for RVA23 vector workloads on that LTS platform.

- **OpenSSL** -- blue (critical)
  - TLS/crypto library; required by CPython, gRPC, and HTTP clients.
  - License: Apache 2.0. Governance: OpenSSL Foundation.
  - Release provided by Debian sid, Ubuntu 24.04, and Arch Linux RISC-V; upstream ships source only.
  - Note: AES T-table constant-time fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) remain open as of 2026-08-28. This is a security gap but does not affect the CI tier.

- **jemalloc** -- orange (critical)
  - High-performance allocator used by vLLM and PyTorch CPU backends for arena-based memory management.
  - License: BSD 2-Clause. Governance: Meta / community.
  - Release provided by Debian sid (libjemalloc2 5.3.1-2).
  - Gap (optimization-absent): No Zihintpause spinwait, no RVV, no RISC-V assembly anywhere in the codebase. Falls back entirely to generic scalar. As an optimization-purpose allocator, absent optimization caps at orange regardless of distro availability.

- **LZ4** -- yellow (critical)
  - Fast lossless compression; used for KV-cache snapshots and checkpoint serialization in vLLM and LangGraph.
  - License: BSD 2-Clause. Governance: Yann Collet / Meta.
  - Release provided by Debian sid.
  - Gap: `LZ4_FAST_DEC_LOOP` and `wildCopy64` fast decompression paths remain disabled for riscv64 while enabled on x86 and arm64. Four PRs addressing this ([#1678](https://github.com/lz4/lz4/pull/1678), [#1686](https://github.com/lz4/lz4/pull/1686), [#1739](https://github.com/lz4/lz4/pull/1739), [#1778](https://github.com/lz4/lz4/pull/1778)) are open and unmerged as of 2026-08-28. Only the Zicclsm unaligned-access scalar fix is merged, yielding minimal optimization.

- **zstd** -- yellow (critical)
  - Zstandard compression; used for model weight storage and streaming in SafeTensors and ONNX Runtime paths.
  - License: BSD + GPLv2 (dual). Governance: Meta.
  - Release provided by Debian sid.
  - Gap: Huffman 4-way decode loop gated to aarch64 only (PR [#4622](https://github.com/facebook/zstd/pull/4622) open); sequence decode fast path absent for riscv64 (PR [#4557](https://github.com/facebook/zstd/pull/4557) open); unaligned-access optimization for Zicclsm unmerged (PR [#4596](https://github.com/facebook/zstd/pull/4596) open). Dominant decompression hot paths remain scalar.

- **gRPC** -- orange (optional)
  - RPC framework; used by some vLLM distributed serving configurations and OpenTelemetry exporters.
  - License: Apache 2.0. Governance: CNCF.
  - Release provided by Arch Linux RISC-V (1.81.0-1) and Debian sid (1.51.1-9+b1); requires riscv64-specific env var overrides to build (GRPC_BUILD_WITH_BORING_SSL_ASM=0, GRPC_PYTHON_BUILD_SYSTEM_OPENSSL=1, -latomic workaround).
  - Gap: No upstream CI for riscv64. Issue [#41591](https://github.com/grpc/grpc/issues/41591) requesting official riscv64 wheels was closed 2026-07-15 by maintainer sergiitk citing Google's OSS Support Policy, which explicitly does not cover riscv64 -- upstream has affirmatively declined formal riscv64 support.

- **tcmalloc** -- orange (optional)
  - Google's thread-caching allocator; an optional high-performance allocator used by some serving frameworks.
  - License: Apache 2.0. Governance: Google.
  - No release from any source; the Debian/Ubuntu `libtcmalloc-*` packages ship the unrelated gperftools codebase, not google/tcmalloc.
  - Gap (optimization-absent): The lock-free per-CPU RSEQ slab -- tcmalloc's primary value proposition -- is guarded to x86_64 and aarch64 only in `percpu.h`. riscv64 falls back to the slower per-thread path. No RISC-V-specific code exists anywhere in the project.

- **Protobuf** -- yellow (optional)
  - Protocol Buffers serialization; used by gRPC and ONNX model format parsing.
  - License: BSD 3-Clause. Governance: Google.
  - Release provided by Debian sid (3.21.12-16, built on rv-manda-03, status Installed).

- **FlatBuffers** -- yellow (optional)
  - Zero-copy serialization; used by ExecuTorch and TFLite model loading paths.
  - License: Apache 2.0. Governance: Google.
  - Release provided by Debian sid (libflatbuffers-dev 23.5.26+dfsg-4+b2, built on rv-osuosl-02).

- **snappy** -- yellow (optional)
  - Fast compression; used internally by LevelDB (LangGraph checkpoint backends) and some model-store caches.
  - License: BSD 3-Clause. Governance: Google.
  - Release provided by Debian sid.
  - Gap: Hardware CRC32 hash (SSE4.2 / ARMv8 CRC on x86/arm64) and V128 byte shuffle in the decompressor (SSSE3/NEON on x86/arm64) remain absent on riscv64. Secondary paths have RISC-V-specific code (Zicond, Zbb, partial RVV MemCopy64), yielding minimal optimization.

---

## Layer 2 -- Python Infrastructure

- **Pydantic** -- yellow (critical)
  - Data validation and schema library; required by FastAPI request/response schemas, LangChain tool definitions, and vLLM configuration objects.
  - License: MIT. Governance: Pydantic Ltd.
  - Release provided by upstream (pydantic-core 2.48.0 ships 8 riscv64 manylinux wheels on PyPI).
  - Gap: The `core-test-builds-arch` CI job that runs pytest via QEMU covers armv7, s390x, ppc64le, and aarch64 only; riscv64 is absent from the test matrix. Build-only CI.

- **httpx** -- green (critical)
  - Async HTTP client; used by LangGraph, LangSmith, and HuggingFace Hub for remote API calls.
  - License: BSD 3-Clause. Governance: Encode.

- **requests** -- green (critical)
  - Synchronous HTTP client; used by HuggingFace Hub, langchain-core, and model download utilities.
  - License: Apache 2.0. Governance: PSF / Kenneth Reitz.

- **typing-extensions** -- green (critical)
  - Backport of Python typing features; required by Pydantic, LangChain, and PyTorch.
  - License: PSF License 2.0. Governance: Python Software Foundation.

- **aiohttp** -- yellow (optional)
  - Async HTTP library; used by some LangChain community integrations and agentic tool connectors.
  - License: Apache 2.0. Governance: aio-libs.
  - Release provided by upstream (12 riscv64 wheels, manylinux and musllinux, on PyPI for v3.14.3).
  - Gap: `test-command = ""` in pyproject.toml disables all test execution globally for the cibuildwheel build; build-only CI.

- **packaging** -- green (optional)
  - PEP-compliant version parsing; a dependency of pip, setuptools, and most Python packaging tools.
  - License: Apache 2.0 / BSD 2-Clause (dual). Governance: Python Packaging Authority (PyPA).

- **fsspec** -- green (optional)
  - Filesystem abstraction; used by HuggingFace Hub for remote model loading.
  - License: BSD 3-Clause. Governance: community (NumFOCUS-affiliated).

- **tqdm** -- green (optional)
  - Progress-bar utility; used by HuggingFace Hub and Transformers for download progress reporting.
  - License: MIT + MPL 2.0. Governance: community.

- **networkx** -- green (optional)
  - Graph algorithms library; an optional dependency for LangGraph visualization and some chain analysis tools.
  - License: BSD 3-Clause. Governance: NumFOCUS.

- **sympy** -- green (optional)
  - Symbolic mathematics; an optional dependency for some Transformers math utilities and model analysis tools.
  - License: BSD 3-Clause. Governance: NumFOCUS.

- **OpenTelemetry API** -- green (optional)
  - Vendor-neutral observability API; used by LangSmith and vLLM for distributed tracing.
  - License: Apache 2.0. Governance: CNCF.

- **OpenTelemetry SDK** -- green (optional)
  - Reference implementation of the OpenTelemetry API.
  - License: Apache 2.0. Governance: CNCF.

---

## Layer 3 -- Compute

- **OpenBLAS** -- blue (critical)
  - Optimized BLAS; primary matrix-multiply backend for PyTorch CPU and ExecuTorch on riscv64 when oneDNN/XNNPACK do not cover an operation.
  - License: BSD 3-Clause. Governance: OpenMathLib.
  - No upstream binary release; must be built from source.
  - Gap (partial optimization): GEMM fully covered with RVV intrinsics. TRSM partially covered in v0.3.34 (PR #5830 merged 2026-08-16): STRSM all variants and DTRSM/CTRSM/ZTRSM RN+RT covered via RVV; DTRSM/CTRSM/ZTRSM LN+LT cases still fall back to generic C.

- **oneDNN (DNNL)** -- blue (critical)
  - Intel's deep learning primitives library; the primary JIT-dispatch backend for PyTorch ATen CPU convolution, matmul, and pooling via xbyak_riscv.
  - License: Apache 2.0. Governance: UXL Foundation.
  - No upstream binary release.
  - Gap (partial optimization): `src/cpu/rv64/` contains JIT RVV for f32/f16/bf16 conv, matmul, GEMM, pooling, softmax, layernorm, and eltwise. INT8 conv/matmul (s8/u8) absent.

- **XNNPACK** -- blue (critical)
  - Accelerated neural network primitives; the primary compute backend for ExecuTorch and an alternate backend for PyTorch ATen on riscv64.
  - License: BSD 3-Clause. Governance: Google.
  - No upstream binary release.
  - Gap (partial optimization): 206 production RVV/Zvfh kernel files covering GEMM, DWCONV, elementwise, reductions. BF16 absent. No hand-written assembly. Narrower MR/NR tile sizes than arm64. FP16 detection bug (issue #9886) fixed in commit aee6b1b3 (2026-04-07); CI passing since at least 2026-07-08.

- **SLEEF** -- blue (critical)
  - Vectorized math library; provides transcendental functions (exp, log, sin, cos) for PyTorch ATen and oneDNN on riscv64.
  - License: BSL-1.0 (Boost Software License). Governance: Naoki Shibata / community.
  - Release provided by Debian sid (3.9.0-1), not upstream.
  - Optimization: Full RVV v1.0 backend covering all in-scope SP and DP transcendentals with RVVM1 and RVVM2 LMUL configurations, matching arm64 SVE coverage. Tests run natively on riscv64 hardware via Jenkins CI.

- **Eigen** -- blue (optional)
  - C++ linear algebra library; used by ONNX Runtime and some Transformers model components.
  - License: MPL 2.0. Governance: community.
  - No release artifact for riscv64 from any source; RVV backend is master-only (latest release 5.0.1, 2025-11-08, contains no RVV content).
  - Gap: All riscv64 CI jobs carry `allow_failure: true`. RVV backend covers GEMM, packet math for int/float/FP16/BF16/complex; transcendental functions (exp/log/sin/cos) and masked partial-packet tails still use scalar fallback.

---

## Layer 4 -- Model Ecosystem

- **HuggingFace Hub** -- green (critical)
  - Model registry client; used by Transformers, SafeTensors, and ONNX Runtime to download model weights and tokenizer configs.
  - License: Apache 2.0. Governance: Hugging Face.

- **SafeTensors** -- yellow (critical)
  - Safe, fast tensor serialization format; the default model-weight storage format for HuggingFace Transformers.
  - License: Apache 2.0. Governance: Hugging Face.
  - Release provided by upstream (safetensors-0.8.0 manylinux_2_31_riscv64 wheel on PyPI).
  - Gap: riscv64 CI matrix entry contains only checkout, maturin-action cross-build, and upload steps with no pytest, QEMU, or test execution. Build-only CI; publishing a wheel without test execution does not satisfy the green criterion.

- **HuggingFace Tokenizers** -- yellow (critical)
  - Fast tokenizer library (Rust + PyO3); required by Transformers for tokenizing inputs to all major LLMs.
  - License: Apache 2.0. Governance: Hugging Face.
  - Release provided by upstream (manylinux_2_31_riscv64 wheel since v0.23.1, April 2026).
  - Gap: riscv64 matrix entry in CI.yml has only "Build wheels" and "Upload wheels" steps; no test execution step exists for riscv64 on any trigger. Build-only CI.

- **NumPy** -- yellow (critical)
  - N-dimensional array library; a transitive dependency of most ML framework components on the Python path.
  - License: BSD 3-Clause. Governance: NumFOCUS.
  - Release provided by RISE (wheels up to 2.5.2); no upstream riscv64 wheel on PyPI.
  - Gap: Native riscv64 CI workflow (`linux_riscv64.yml`) is build-only; no test command in cibuildwheel config. QEMU CI (`linux_qemu.yml`) runs tests but carries `continue-on-error: true` (non-blocking). The NPYV layer has no RVV backend; all ~22 arithmetic, transcendental, reduction, and comparison ufunc kernels fall back to scalar C.

- **SentencePiece** -- blue (critical)
  - Subword tokenizer; used by Transformers for T5, LLaMA, and Gemma tokenization.
  - License: Apache 2.0. Governance: Google.
  - Release provided by RISE unofficial wheel builder; no riscv64 wheel in upstream v0.2.2 release (published 2026-07-12). `wheel.yml` uses `CIBW_ARCHS_LINUX: auto` with no riscv64 entry.

- **Tiktoken** -- yellow (optional)
  - OpenAI's BPE tokenizer; used by some LangChain integrations and OpenAI-compatible vLLM endpoints.
  - License: MIT. Governance: OpenAI.
  - Release provided by RISE (BayLibre GitLab PyPI index) and Debian sid (0.12.0-2, built on native riscv64).
  - Gap: No upstream riscv64 CI or PyPI wheel (latest 0.14.0, released 2026-08-17, has no riscv64 artifact). Upstream PR [#506](https://github.com/openai/tiktoken/pull/506) adding riscv64 CI remains open and unmerged.

- **ONNX Runtime (CPU EP)** -- yellow (optional)
  - Cross-platform ML inference runtime; optional model-load path in HuggingFace Transformers (`optimum` backend).
  - License: MIT. Governance: Microsoft / ONNX Runtime project.
  - Release provided by Debian sid (1.23.2+dfsg-6+b5, built on rv-osuosl-01).
  - Gap: No riscv64 CI across all 50+ workflow files. Debian packaging patches are not riscv64-specific. Eleven RVV MLAS kernel files exist in-tree (partial optimization), but the distro-floor grade is yellow and optimization level does not lower it further.

---

## Layer 5 -- ML Framework

- **PyTorch (CPU eager inference)** -- yellow (critical)
  - The primary ML framework for most agentic inference serving paths; ATen is the tensor compute backend for the vLLM CPU path and HuggingFace Transformers.
  - License: BSD 3-Clause (modified). Governance: Meta / PyTorch Foundation (Linux Foundation).
  - Release provided by Debian sid (v2.12.0+dfsg2-4); no riscv64 wheel on PyPI or RISE.
  - Gap: Upstream CI (`.github/workflows/riscv64.yml`) contains exactly one job: `pytorch-linux-noble-riscv64-py3_12-gcc14-cross-build` with no test matrix -- build-only CI. ATen CPU vectorization has zero RVV dispatch: the `CPUCapability` enum lists DEFAULT/VSX/ZVECTOR/SVE256/SVE128/AVX2/AVX512 with no RVV entry. PR #175746 (RVV ATen vectorization) was closed without merging after the 2026-06-17 report date, making the ATen SIMD gap permanent in the near term. One RVV kernel exists (DepthwiseConvKernel.cpp, 76 lines from PR #127867). RISE out-of-tree CI (riseproject-dev/pytorch-ci) has a conditional test job on native riscv64 hardware but does not gate upstream PRs.

- **HuggingFace Transformers** -- green (critical)
  - Model architecture library providing Llama, Mistral, Qwen, and other LLM implementations used by vLLM and agentic pipelines.
  - License: Apache 2.0. Governance: Hugging Face.
  - Pure Python; all compute delegated to PyTorch, ONNX Runtime, or other backends. No architecture-specific code.

- **Accelerate** -- green (optional)
  - HuggingFace distributed training and mixed-precision abstraction; used by some LangChain tool integrations.
  - License: Apache 2.0. Governance: Hugging Face.

---

## Layer 6 -- Inference Serving

- **vLLM (CPU backend)** -- orange (critical)
  - High-throughput LLM serving engine with a CPU backend; the primary LLM serving target for the agentic RAG and HTTP serving pipeline chains.
  - License: Apache 2.0. Governance: vLLM project (originally UC Berkeley).
  - No release from any source (PyPI v0.28.0 ships only x86_64 and aarch64 wheels; no RISE, Debian, Ubuntu, or Arch packaging).
  - Gap: No riscv64 CI across all 10 GitHub Actions workflow files. No distribution floor of any kind. Requires a full from-source build with riscv64-compatible dependencies (PyTorch Debian build, oneDNN, OpenBLAS) and unblocking of transitive native extension dependencies (pydantic-core, aiohttp).

- **llama.cpp** -- blue (critical)
  - GGUF-format LLM inference engine; the primary CPU inference path for quantized models (Q4_0, Q4_K, etc.) in the llama.cpp pipeline chain.
  - License: MIT. Governance: Georgi Gerganov / community.
  - Release provided by Debian sid; no upstream riscv64 release binary (issue [#20988](https://github.com/ggerganov/llama.cpp/issues/20988) closed not-planned; PR [#20991](https://github.com/ggerganov/llama.cpp/pull/20991) unmerged).
  - Gap (partial optimization): RVV vec dot covers all major quant formats; repack GEMM/GEMV covers Q4_0, Q4_K, Q8_0, Q2_K, IQ4_NL. Q3_K, Q5_K, Q6_K, Q5_0, Q5_1 repack paths remain scalar (draft PR [#23745](https://github.com/ggerganov/llama.cpp/pull/23745) open as of 2026-08-28).

- **ExecuTorch** -- blue (optional)
  - Meta's on-device inference runtime; used in the ExecuTorch edge inference path.
  - License: BSD 3-Clause. Governance: Meta / PyTorch Foundation.
  - No release artifact for riscv64 from any source (latest release v1.4.1 has no riscv64 binary).
  - CI runs `executor_runner` under `qemu-riscv64-static` with test pass verification.

- **FastAPI** -- green (critical)
  - ASGI web framework; forms the HTTP serving layer for the vLLM HTTP serving path.
  - License: MIT. Governance: Tiangolo / independent.

- **Starlette** -- green (critical)
  - ASGI toolkit underlying FastAPI; handles request routing and lifecycle for the vLLM HTTP serving path.
  - License: BSD 3-Clause. Governance: Encode.

---

## Layer 7 -- Orchestration & Agents

- **LangChain** -- green (critical)
  - Chain and tool orchestration library; the primary user-facing interface for building agentic RAG pipelines.
  - License: MIT. Governance: LangChain Inc.

- **LangGraph** -- green (critical)
  - Stateful multi-agent workflow engine; used for the LangGraph stateful agent path.
  - License: MIT. Governance: LangChain Inc.

- **langchain-core** -- green (critical)
  - Core abstractions (runnables, messages, schemas) shared by all LangChain components.
  - License: MIT. Governance: LangChain Inc.

- **langgraph-checkpoint** -- green (critical)
  - State persistence layer for LangGraph; serializes and restores agent state across invocations.
  - License: MIT. Governance: LangChain Inc.
  - Note: Required dependency `ormsgpack>=1.12.0` has no prebuilt riscv64 wheel and requires a Rust source build. This is a dependency-level friction issue and does not change the color of langgraph-checkpoint itself.

- **langsmith** -- green (optional)
  - Tracing and observability for LangChain / LangGraph pipelines; used in the LangGraph stateful agent path.
  - License: MIT. Governance: LangChain Inc.
  - Note: The optional `langsmith[langsmith_pyo3]` Rust extension extra publishes only x86_64, aarch64, and macOS arm64 wheels (no riscv64), but this extra is not required for core tracing functionality.

- **langgraph-prebuilt** -- green (optional)
  - Pre-built agent nodes (ReAct, tool-calling agents) for LangGraph.
  - License: MIT. Governance: LangChain Inc.

- **langgraph-sdk** -- green (optional)
  - Python SDK for the LangGraph remote server API.
  - License: MIT. Governance: LangChain Inc.

---

## Layer 8 -- Excluded (Proprietary / GPU-only)

The following nodes are out of scope for a CPU-only riscv64 investment decision. They are listed for completeness only.

- **CUDA / cuDNN / cuBLAS / TensorRT / NCCL** -- grey (N/A): Proprietary NVIDIA GPU path; no RISC-V port.
- **ROCm / HIP / MIOpen** -- grey (N/A): AMD GPU path; no RISC-V port.
- **Intel GPU / oneAPI GPU** -- grey (N/A): Intel GPU path; not applicable to CPU-only target.
- **Apple MPS / CoreML** -- grey (N/A): Apple silicon only; not applicable.
- **Triton GPU compiler** -- grey (N/A): GPU-only JIT compiler; not applicable to CPU-only target.
- **torchvision / torchaudio** -- grey (N/A): Multimodal add-ons requiring GPU backends.

---

### Pipeline chains and alternate paths

**PyTorch CPU eager inference path (RVA23):**
PyTorch ATen -> oneDNN (xbyak_riscv JIT) -> XNNPACK -> OpenBLAS -> SLEEF

**vLLM CPU inference path:**
vLLM CPU backend -> PyTorch ATen -> oneDNN -> OpenBLAS

**llama.cpp GGUF inference path:**
llama.cpp -> ggml (in-tree) -> RVV kernels (llamafile SGEMM + ggml-cpu)

**ExecuTorch edge inference path:**
ExecuTorch runtime -> XNNPACK (CPU backend) -> OpenBLAS

**Agentic RAG pipeline:**
LangChain/LangGraph -> langchain-core -> HF Transformers -> vLLM (serving) -> FAISS (retrieval) -> HF Tokenizers / SentencePiece

**Model load path:**
HF Transformers -> HuggingFace Hub -> SafeTensors -> ONNX Runtime (optional)

**vLLM HTTP serving path:**
vLLM CPU backend -> FastAPI -> Starlette -> uvicorn -> Pydantic (request/response schemas)

**LangGraph stateful agent path:**
LangGraph -> langchain-core -> langgraph-checkpoint (state) -> langsmith (tracing) -> pydantic (types)

Note: FAISS and uvicorn appear in pipeline chains above but are not covered by node classification records in this report. Their riscv64 status is not assessed here.

---

## Artifact 2: Status table

### (a) Full table

| Node | Layer | Criticality | Color | Release provider | Justification summary | Primary source | As-of | Delta vs report |
|------|-------|-------------|-------|------------------|-----------------------|----------------|-------|-----------------|
| LangChain | Orchestration & Agents | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/project/langchain/1.3.18/) | 2026-06-17 | none |
| LangGraph | Orchestration & Agents | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/langgraph/json) | 2026-06-17 | none |
| langchain-core | Orchestration & Agents | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/langchain-core/1.6.1/json) | 2026-08-27 | n/a |
| langsmith | Orchestration & Agents | optional | green | upstream | py3-none-any wheel; pyo3 Rust extra is optional and absent on riscv64 | [PyPI](https://pypi.org/pypi/langsmith/json) | 2026-08-28 | n/a |
| langgraph-checkpoint | Orchestration & Agents | critical | green | upstream | py3-none-any wheel; ormsgpack dep requires Rust source build | [PyPI](https://pypi.org/pypi/langgraph-checkpoint/json) | 2026-06-17 | none |
| langgraph-prebuilt | Orchestration & Agents | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/langgraph-prebuilt/json) | 2026-08-28 | n/a |
| langgraph-sdk | Orchestration & Agents | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/langgraph-sdk/json) | 2026-08-28 | n/a |
| vLLM (CPU backend) | Inference Serving | critical | orange | none | No riscv64 CI; no release from any source | [GitHub workflows](https://github.com/vllm-project/vllm/tree/main/.github/workflows) | 2026-06-17 | color_case corrected from downstream-only to empty; no distro ships vllm for riscv64 |
| llama.cpp | Inference Serving | critical | blue | Debian | Native QEMU tests pass; partial RVV optimization (Q3/Q5/Q6 repack scalar) | [build-riscv.yml](https://github.com/ggerganov/llama.cpp/blob/master/.github/workflows/build-riscv.yml) | 2026-06-17 | none |
| ExecuTorch | Inference Serving | optional | blue | none | QEMU test execution confirmed; no riscv64 release | [riscv64.yml](https://github.com/pytorch/executorch/blob/main/.github/workflows/riscv64.yml) | 2026-08-28 | none |
| FastAPI | Inference Serving | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/fastapi/json) | 2026-08-28 | n/a |
| Starlette | Inference Serving | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/starlette/1.6.0/json) | 2026-08-28 | version 1.6.0 current (was 0.46.2 in proposal); color unchanged |
| PyTorch (CPU eager inference) | ML Framework | critical | yellow | Debian | Build-only CI; zero RVV ATen dispatch; PR #175746 closed | [riscv64.yml](https://github.com/pytorch/pytorch/blob/main/.github/workflows/riscv64.yml) | 2026-06-17 | PR #175746 closed without merging post-report; RISE out-of-tree CI gained conditional test job |
| HuggingFace Transformers | ML Framework | critical | green | upstream | py3-none-any wheel; no arch-specific code | [PyPI](https://pypi.org/pypi/transformers/json) | 2026-08-28 | version 5.16.1 (was 5.15.0); still py3-none-any |
| Accelerate | ML Framework | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/accelerate/json) | 2026-08-28 | n/a |
| HuggingFace Hub | Model Ecosystem | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/huggingface_hub/json) | 2026-08-27 | n/a |
| HuggingFace Tokenizers | Model Ecosystem | critical | yellow | upstream | Build-only CI; upstream ships manylinux riscv64 wheel since v0.23.1 | [CI.yml](https://github.com/huggingface/tokenizers/blob/main/.github/workflows/CI.yml) | 2026-03-26 | none |
| SentencePiece | Model Ecosystem | critical | blue | RISE | QEMU test execution confirmed; no upstream wheel | [cross_build.yml](https://github.com/google/sentencepiece/blob/master/.github/workflows/cross_build.yml) | 2026-06-17 | CI upgraded gcc-10 to gcc-14; v0.2.2 released with no riscv64 wheels; color unchanged |
| Tiktoken | Model Ecosystem | optional | yellow | RISE | No upstream CI; Debian sid + RISE wheels present; PR #506 unmerged | [build_wheels.yml](https://github.com/openai/tiktoken/blob/main/.github/workflows/build_wheels.yml) | 2026-08-28 | PyPI at 0.14.0 (still no riscv64 wheel); PR #506 mergeable but unmerged |
| NumPy | Model Ecosystem | critical | yellow | RISE | Build-only native CI; QEMU CI non-blocking; no RVV NPYV backend | [linux_riscv64.yml](https://github.com/numpy/numpy/blob/main/.github/workflows/linux_riscv64.yml) | 2026-06-17 | RISE wheels at 2.5.2 (was 2.4.3); color unchanged |
| SafeTensors | Model Ecosystem | critical | yellow | upstream | Build-only CI; upstream ships manylinux riscv64 wheel | [python-release.yml](https://github.com/safetensors/safetensors/blob/main/.github/workflows/python-release.yml) | 2026-06-09 | none |
| ONNX Runtime (CPU EP) | Model Ecosystem | optional | yellow | Debian | No upstream CI; Debian sid ships for riscv64 with no riscv64-specific patches | [Debian buildd](https://buildd.debian.org/status/package.php?p=onnxruntime&suite=sid) | 2026-06-17 | Debian version now 1.23.2+dfsg-6+b5 (binNMU rebuild); color unchanged |
| OpenBLAS | Compute | critical | blue | none | QEMU tests pass (L1/L2/L3 CBLAS); partial TRSM coverage in v0.3.34 | [riscv64_vector.yml](https://github.com/OpenMathLib/OpenBLAS/blob/develop/.github/workflows/riscv64_vector.yml) | 2026-06-17 | PR #5830 merged 2026-08-16, partially closing TRSM gap; color unchanged |
| Eigen | Compute | optional | blue | none | Native riscv64 CI (allow_failure: true); RVV backend master-only | [gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml) | 2026-06-17 | Compiler versions updated gcc-14/clang-18 to gcc-15/clang-21; color unchanged |
| oneDNN (DNNL) | Compute | critical | blue | none | QEMU SMOKE tests pass (vlen=128, 256); partial optimization (INT8 absent) | [ci-riscv.yml](https://github.com/uxlfoundation/oneDNN/blob/main/.github/workflows/ci-riscv.yml) | 2026-06-17 | none |
| XNNPACK | Compute | critical | blue | none | CI passing since 2026-07-08; FP16 bug fixed; partial optimization (no BF16) | [CI run #33000168130](https://github.com/google/XNNPACK/actions/runs/33000168130) | 2026-08-26 | Upgraded from yellow to blue; FP16 detection bug fixed before report date but verified post-report |
| SLEEF | Compute | critical | blue | Debian | Native riscv64 CI; full RVV v1.0 coverage for SP/DP transcendentals | [Jenkinsfile](https://github.com/shibatch/sleef/blob/master/Jenkinsfile) | 2026-06-17 | none |
| Pydantic | Python Infrastructure | critical | yellow | upstream | Build-only CI; upstream ships riscv64 wheels; test matrix excludes riscv64 | [ci.yml](https://github.com/pydantic/pydantic/blob/main/.github/workflows/ci.yml) | 2026-08-28 | n/a |
| httpx | Python Infrastructure | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/httpx/json) | 2026-08-28 | n/a |
| requests | Python Infrastructure | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/requests/json) | 2026-08-28 | n/a |
| aiohttp | Python Infrastructure | optional | yellow | upstream | Build-only CI (test-command = ""); upstream ships riscv64 wheels | [ci-cd.yml](https://github.com/aio-libs/aiohttp/blob/master/.github/workflows/ci-cd.yml) | 2026-08-28 | n/a |
| typing-extensions | Python Infrastructure | critical | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/typing-extensions/json) | 2026-08-28 | n/a |
| packaging | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/packaging/json) | 2026-08-28 | n/a |
| fsspec | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/fsspec/json) | 2026-08-28 | n/a |
| tqdm | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/tqdm/json) | 2026-08-28 | n/a |
| networkx | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/networkx/json) | 2026-08-28 | n/a |
| sympy | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/sympy/json) | 2025-04-27 | n/a |
| OpenTelemetry API | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/project/opentelemetry-api/) | 2026-08-28 | none |
| OpenTelemetry SDK | Python Infrastructure | optional | green | upstream | py3-none-any wheel; architecture-independent | [PyPI](https://pypi.org/pypi/opentelemetry-sdk/json) | 2026-08-28 | n/a |
| Protobuf | Runtimes & System Libraries | optional | yellow | Debian | No upstream CI; Debian sid clean build; no riscv64-specific patches | [Debian buildd](https://buildd.debian.org/status/package.php?p=protobuf&suite=unstable) | 2026-06-17 | none |
| FlatBuffers | Runtimes & System Libraries | optional | yellow | Debian | No upstream CI; Debian sid clean build; no riscv64-specific patches | [build.yml](https://github.com/google/flatbuffers/blob/master/.github/workflows/build.yml) | 2026-06-17 | none |
| gRPC | Runtimes & System Libraries | optional | orange | Arch Linux | No upstream CI; build requires riscv64-specific env overrides; upstream declined formal riscv64 support | [Issue #41591](https://github.com/grpc/grpc/issues/41591) | 2026-06-17 | Issue #41591 closed 2026-07-15; maintainer explicitly declined per Google OSS Support Policy |
| CPython | Runtimes & System Libraries | critical | blue | RISE | Upstream buildbot on-demand only; last pass 2026-06-30 (build #34) | [Buildbot API](https://buildbot.python.org/api/v2/builds?builderid=1377&limit=5&order=-number) | 2026-06-30 | Buildbot repaired (was broken since 2026-03-25); builds #33 (fail) and #34 (pass) ran 2026-06-29/30; no runs since |
| glibc | Runtimes & System Libraries | critical | yellow | Ubuntu | Build-only effective CI; all Buildbot riscv64 test runs fail; Ubuntu 24.04 ships 2.39 (missing vector-clobber fix) | [Buildbot builder 293](https://builder.sourceware.org/buildbot/api/v2/builders/293) | 2026-08-28 | Buildbot builders do attempt tests (not build-only) but all fail and both are offline; yellow upheld |
| OpenSSL | Runtimes & System Libraries | critical | blue | Debian | QEMU test execution on every push; Debian/Ubuntu/Arch all carry packages | [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml) | 2026-06-17 | AES constant-time PRs #31080/#31082 still open; does not affect CI tier |
| jemalloc | Runtimes & System Libraries | critical | orange | Debian | No riscv64 CI; optimization entirely absent (no Zihintpause, no RVV, no asm) | [linux-ci.yml](https://github.com/jemalloc/jemalloc/blob/dev/.github/workflows/linux-ci.yml) | 2026-06-17 | none |
| tcmalloc | Runtimes & System Libraries | optional | orange | none | No riscv64 CI; RSEQ per-CPU slab guarded to x86_64/aarch64 only; no release | [percpu.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h) | 2026-06-17 | none |
| LZ4 | Runtimes & System Libraries | critical | yellow | Debian | CI runs full QEMU tests; fast decompression paths disabled; four RVV PRs open | [cross-platform.yml](https://github.com/lz4/lz4/blob/dev/.github/workflows/cross-platform.yml) | 2026-06-17 | PR #1778 (new consolidated RVV PR) now open; color_case corrected from optimization-absent to yellow |
| zstd | Runtimes & System Libraries | critical | yellow | Debian | CI runs QEMU tests (baseline + RVV vlen=128/256/512); dominant decompression paths scalar | [dev-short-tests.yml](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml) | 2026-06-17 | none |
| snappy | Runtimes & System Libraries | optional | yellow | Debian | CI runs `make test` under QEMU; primary hash and shuffle paths absent on riscv64 | [riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml) | 2026-06-17 | none |

### (b) Slide-ready summary table

| Node | Color | Criticality | Release provider |
|------|-------|-------------|------------------|
| LangChain | green | critical | upstream |
| LangGraph | green | critical | upstream |
| langchain-core | green | critical | upstream |
| langsmith | green | optional | upstream |
| langgraph-checkpoint | green | critical | upstream |
| langgraph-prebuilt | green | optional | upstream |
| langgraph-sdk | green | optional | upstream |
| vLLM (CPU backend) | orange | critical | none |
| llama.cpp | blue | critical | Debian |
| ExecuTorch | blue | optional | none |
| FastAPI | green | critical | upstream |
| Starlette | green | critical | upstream |
| PyTorch (CPU eager inference) | yellow | critical | Debian |
| HuggingFace Transformers | green | critical | upstream |
| Accelerate | green | optional | upstream |
| HuggingFace Hub | green | critical | upstream |
| HuggingFace Tokenizers | yellow | critical | upstream |
| SentencePiece | blue | critical | RISE |
| Tiktoken | yellow | optional | RISE |
| NumPy | yellow | critical | RISE |
| SafeTensors | yellow | critical | upstream |
| ONNX Runtime (CPU EP) | yellow | optional | Debian |
| OpenBLAS | blue | critical | none |
| Eigen | blue | optional | none |
| oneDNN (DNNL) | blue | critical | none |
| XNNPACK | blue | critical | none |
| SLEEF | blue | critical | Debian |
| Pydantic | yellow | critical | upstream |
| httpx | green | critical | upstream |
| requests | green | critical | upstream |
| aiohttp | yellow | optional | upstream |
| typing-extensions | green | critical | upstream |
| packaging | green | optional | upstream |
| fsspec | green | optional | upstream |
| tqdm | green | optional | upstream |
| networkx | green | optional | upstream |
| sympy | green | optional | upstream |
| OpenTelemetry API | green | optional | upstream |
| OpenTelemetry SDK | green | optional | upstream |
| Protobuf | yellow | optional | Debian |
| FlatBuffers | yellow | optional | Debian |
| gRPC | orange | optional | Arch Linux |
| CPython | blue | critical | RISE |
| glibc | yellow | critical | Ubuntu |
| OpenSSL | blue | critical | Debian |
| jemalloc | orange | critical | Debian |
| tcmalloc | orange | optional | none |
| LZ4 | yellow | critical | Debian |
| zstd | yellow | critical | Debian |
| snappy | yellow | optional | Debian |

---

## Artifact 3: Narrative and next steps

### Scorecard

Of 29 critical-path nodes: 11 green, 8 blue, 8 yellow, 2 orange.

Of 21 optional nodes: 11 green, 2 blue, 6 yellow, 2 orange.

### The story

**Two critical blockers: vLLM and jemalloc**

vLLM (CPU backend) is the highest-priority gap in this stack. It is the only production-grade high-throughput LLM serving engine with a CPU backend, and it has no riscv64 support of any kind: no CI, no package, no binary, and no third party shipping it. The vLLM HTTP serving path and the agentic RAG pipeline both terminate at vLLM. Any deployment depending on these chains on riscv64 must build vLLM from source, resolving a chain of transitive native-extension dependencies (PyTorch Debian build, pydantic-core, aiohttp, oneDNN, OpenBLAS). There is no known organization actively pursuing a vLLM riscv64 port.

jemalloc is the critical allocator dependency for the vLLM CPU backend and PyTorch. It has no RISC-V optimization of any kind -- no Zihintpause pause hint for spinloops, no RVV, no RISC-V assembly -- and falls back entirely to generic scalar code. This is an optimization-absent orange on a critical-path node that touches every memory allocation in vLLM and PyTorch.

**PyTorch: the weight-bearing yellow node**

PyTorch CPU eager inference (yellow) sits under every Python-based inference path in this stack. Its ATen vectorization layer has zero RVV dispatch after PR #175746 was closed without merging. The Debian binary (v2.12.0, riscv64) is the only viable installation path; no riscv64 wheel exists on PyPI or RISE. All ATen ufunc kernels -- elementwise, reduction, and transcendental -- run scalar on riscv64. Users on Ubuntu 24.04 face an additional glibc 2.39 risk: that version predates the `__SYSCALL_CLOBBERS` vector-clobber fix and BZ#32932 (hwprobe), creating a potential correctness hazard for vector workloads. RISE has an out-of-tree CI repo with a conditional test job on native riscv64 hardware, which is the only active riscv64 test infrastructure for PyTorch, but it does not gate upstream PRs and is therefore not a guarantee of correctness.

**Yellow critical nodes with no test gate**

Eight critical nodes are yellow, meaning none of them have a passing test gate on riscv64 that blocks upstream regressions. The most consequential are:

- SafeTensors: Every HuggingFace model load relies on SafeTensors for weight deserialization. Upstream ships a riscv64 wheel but no test execution; a silent correctness regression would go undetected until deployment.
- HuggingFace Tokenizers: All major tokenized LLMs (Llama, Mistral, Qwen, Gemma) go through this library. Upstream ships a riscv64 wheel but CI is build-only.
- NumPy: No upstream riscv64 wheel; RISE wheels at 2.5.2. The NPYV vector abstraction layer has no RVV backend; all ufunc math operations are scalar. QEMU CI runs tests but with `continue-on-error: true`.
- Pydantic: The vLLM request/response schema validation library. Upstream ships riscv64 wheels but the test matrix excludes riscv64.
- glibc: Buildbot riscv64 test runners exist but every observable run fails; both builders are offline. Ubuntu Noble 24.04 ships the vulnerable 2.39 release.
- LZ4 and zstd: Both are used for checkpoint and weight cache serialization. LZ4's fast decompression paths are disabled on riscv64. zstd's dominant decompression hot paths remain scalar. Neither blocks a deployment but both impose a measurable throughput cost.

**Release provider concentration risk**

Several critical nodes depend on RISE or Debian rather than upstream for their riscv64 binary releases, creating hidden supply-chain dependencies:

- CPython: RISE (riseproject-dev/python-versions) is the only source of a prebuilt riscv64 Python interpreter. Upstream publishes no riscv64 binary. If RISE publishing is interrupted, the entire Python-based stack loses its binary distribution.
- NumPy: RISE wheels only; no upstream riscv64 PyPI wheel.
- SentencePiece: RISE wheel builder only; upstream's cibuildwheel config omits riscv64.
- OpenBLAS, oneDNN, XNNPACK: No binary release from any source; must be built from source.
- llama.cpp, OpenSSL, SLEEF: Debian sid only; not available on LTS distributions as current-release binaries.
- PyTorch: Debian sid only; the Debian package lags upstream by several months and may not include the latest quantization or model support patches.

### Actionable next steps

The following actions are listed in priority order. RISE work already underway is noted to avoid double-counting.

**1. vLLM riscv64 port (blocking for production agentic serving)**

Upstream best position: vLLM project (GitHub vllm-project/vllm), specifically the CPU backend team. The CPU backend is already separated from GPU code, making riscv64 a less invasive addition than adding a new GPU backend.

Concrete actions:
- Open a tracking issue in vllm-project/vllm requesting a riscv64 CI job and a riscv64 wheel in the release pipeline.
- Provide a RISE bare-metal riscv64 runner for CI (RISE already operates runners for llama.cpp and PyTorch; the same runner pool can be offered to vLLM).
- A RISE or industry contributor should build and test vLLM from source on riscv64 and publish the dependency resolution path (pinned PyTorch Debian build + oneDNN + OpenBLAS) as a documented build recipe to reduce friction for the upstream team.
- The RISE BayLibre wheel builder should add vLLM once a working build recipe is established.

**2. PyTorch ATen RVV vectorization (critical for inference throughput)**

Upstream best position: PyTorch ATen maintainers (Meta / PyTorch Foundation). PR #175746 was closed; a replacement PR with a smaller scope (targeting the five highest-priority ufunc kernels for LLM inference: add, mul, sigmoid, softmax, layer_norm) would be more mergeable than a comprehensive vectorization PR.

Concrete actions:
- Draft a scoped replacement for PR #175746 targeting the `CPUCapability` enum and dispatch stubs for RVV, focusing on the five kernels above.
- RISE riscv64 CI should be promoted from conditional to always-on in riseproject-dev/pytorch-ci, and the results surfaced in upstream PR checks, to give reviewers confidence in riscv64 correctness without requiring upstream to maintain their own runner.
- Escalate the glibc 2.39 / Ubuntu 24.04 deployment risk to the PyTorch riscv64 tracking issue: users deploying on Noble LTS today face a correctness hazard from the missing vector-clobber fix.

**3. jemalloc RISC-V optimization (critical for allocator performance)**

Upstream best position: Meta jemalloc team (GitHub jemalloc/jemalloc).

Concrete actions:
- Open an upstream issue documenting the missing Zihintpause spinwait for RISC-V (the equivalent of the x86 PAUSE and ARM WFE hints that jemalloc already uses).
- A one-function patch adding `#include <sched.h>` and `sched_yield()` or `__riscv_pause()` (via `zihintpause`) to the spin path is a tractable first contribution.
- RVV is a lower priority for jemalloc than Zihintpause; start with the spinwait hint, then evaluate arena-metadata prefetch patterns.

**4. HuggingFace Tokenizers and SafeTensors: add QEMU test execution to riscv64 CI**

Upstream best position: Hugging Face (tokenizers and safetensors maintainers).

Concrete actions:
- For Tokenizers: add a QEMU-based test step to the riscv64 matrix entry in CI.yml. The cibuildwheel `CIBW_TEST_COMMAND` field is the minimal change; RISE QEMU infrastructure is already used by multiple projects in this stack and can be offered.
- For SafeTensors: add a pytest step under QEMU to python-release.yml. The Rust core is portable and is expected to pass; the change would formalize that expectation and catch regressions.
- Both changes are low-effort (one-line test-command additions) and would promote both nodes from yellow to green, reducing the count of test-ungated critical nodes by two.

**5. NumPy NPYV RVV backend**

Upstream best position: NumPy NPYV maintainers (NumFOCUS / community).

Concrete actions:
- A NPYV RVV backend (analogous to the existing SVE and VSX backends) would unlock vectorized ufunc dispatch for all ~22 ufunc families currently running scalar on riscv64.
- RISE should check whether any existing contributor (e.g., the same individuals who contributed RVV support to OpenBLAS and oneDNN) is positioned to start this work.
- The upstream NumPy QEMU CI job (`linux_qemu.yml`) already has riscv64 support with `continue-on-error: true`; removing the non-blocking flag should be a goal once the NPYV backend is merged.
- This is a larger engineering effort than items 1-4 but has a proportionally larger impact, since NumPy scalar fallback affects every numerical operation in the agentic inference pipeline outside of oneDNN/XNNPACK-dispatched operators.

**6. LZ4 fast decompression path for riscv64**

Upstream best position: lz4 maintainers (Yann Collet / Meta).

Concrete actions:
- PR [#1778](https://github.com/lz4/lz4/pull/1778) (consolidated RISC-V optimization) is the current best candidate for review. RISE or an industry contributor should provide a review, test results on riscv64 hardware, and CI runner access to accelerate merge.
- Enabling `LZ4_FAST_DEC_LOOP` for riscv64 (with appropriate Zicclsm and alignment guards) is the minimal change; full RVV acceleration is an optional follow-on.

**7. CPython riscv64 buildbot: stabilize and make continuous**

Upstream best position: CPython core developers / PSF infrastructure team.

Concrete actions:
- The riscv64 buildbot (builder 1377) fires only on-demand per PR, not continuously. RISE should work with the CPython infrastructure team to convert this to a continuous builder, ensuring regressions are caught at commit rather than at pull-request review time.
- Build #33 failed and #34 passed on consecutive days (2026-06-29/30), suggesting flakiness. A root-cause analysis of the #33 failure should be filed to prevent recurrence.
- RISE already provides the runner hardware; the remaining work is on the CPython buildbot configuration side.

**8. glibc Ubuntu 24.04 deployment advisory**

Concrete actions:
- Publish a deployment advisory for users running LLM inference on Ubuntu 24.04 (Noble) on riscv64: glibc 2.39 predates the `__SYSCALL_CLOBBERS` vector-clobber fix and BZ#32932. Recommend Ubuntu 25.04 (ships glibc 2.41) or Debian sid (glibc 2.41+) for production agentic inference deployments on riscv64 until Ubuntu 24.04 is patched.