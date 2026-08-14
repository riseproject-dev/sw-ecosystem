---
title: Agentic AI (CPU-only) -- RISC-V Ecosystem Status
---

# Agentic AI (CPU-only) -- RISC-V Ecosystem Status

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-13<br/>
**Scope:** RISC-V readiness of the Agentic AI (CPU-only) software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified
against the per-project reports under reports/. Items not verifiable against a second source are
marked [NEEDS VERIFICATION]. PyPI wheel status verified live on 2026-08-12.

---

## Artifact 1 -- Layered Stack Outline

*This section is formatted for direct paste into a PowerPoint stack diagram generator (e.g. Copilot for PowerPoint). One section per layer, one bullet per node.*

---

## Layer 1 -- Orchestration & Agents

- **LangChain** -- green (critical)
  - Python framework for chains, agents, tool use, and RAG pipelines.
  - License: MIT. Governance: LangChain, Inc. (company-controlled).
  - Architecture-independent: `py3-none-any` wheel; installs on riscv64 via `pip install` without modification.

- **LangGraph** -- green (critical)
  - Stateful multi-agent graph orchestration layer built on LangChain.
  - License: MIT. Governance: LangChain, Inc.
  - Architecture-independent: `py3-none-any` wheel; installs on riscv64 via `pip install` without modification.

- **Ray** -- grey, unknown (optional)
  - Distributed execution framework for scaling Agentic AI workloads across nodes.
  - License: Apache 2.0. Governance: Anyscale (company-controlled).
  - No per-project report exists; no live riscv64 check performed. Ray ships compiled C++/Cython extensions. [NEEDS VERIFICATION]

---

## Layer 2 -- Inference Serving

- **vLLM (CPU backend)** -- orange, upstream-ships-untested (critical)
  - High-throughput LLM serving engine with continuous batching and OpenAI-compatible API.
  - License: Apache 2.0. Governance: vLLM Project (Linux Foundation AI).
  - Release provider: none (no riscv64 binary wheel on PyPI; must be built from source).
  - Gap: dedicated riscv64 CPU backend exists in source; builds and runs; no upstream riscv64 CI test suite. torchvision, torchaudio, and numba explicitly excluded on riscv64.

- **llama.cpp** -- blue (critical)
  - GGUF-format LLM inference engine; alternative to vLLM for CPU-only deployments.
  - License: MIT. Governance: community (ggerganov).
  - Release provider: none (no riscv64 binary release; upstream source only).
  - Gap: upstream CI builds and runs tests on riscv64 via RISE native runners; no binary release. RISE-funded RVV optimization project (RP-014) active. Most performant riscv64 inference option for GGUF models today.

- **ExecuTorch** -- blue (optional)
  - PyTorch on-device edge inference runtime; targets embedded and single-board RISC-V hardware.
  - License: BSD-3-Clause. Governance: PyTorch Foundation (Meta-anchored).
  - Release provider: none (no upstream riscv64 PyPI wheel in any v0.1.0-v1.4.0 release).
  - Gap: upstream CI runs a comprehensive riscv64 test matrix (6 models x XNNPACK on/off x RVV vlen 128/256/512) via QEMU; declared Phase 1 (proof-of-concept). RISE fork (riseproject-dev/executorch) active. Transition to native hardware runners is the next milestone.

---

## Layer 3 -- ML Framework

- **PyTorch (CPU eager inference)** -- orange, upstream-ships-untested (critical)
  - Deep learning framework; ATen CPU kernels used for eager inference.
  - License: BSD-3-Clause. Governance: PyTorch Foundation (Linux Foundation, Meta-anchored).
  - Release provider: none (no riscv64 PyPI wheel as of Aug 2026).
  - Gap: cross-compile CI only; RISE out-of-tree native CI active (870+ jobs/6 wk); no PyTorch riscv64 PyPI wheel; RFC #77 to elevate to supported tier open/draft. Must be built from source.

- **HuggingFace Transformers** -- green (critical)
  - Model loading, AutoModel, generation pipelines for LLMs (LLaMA, Gemma, Mistral, etc.).
  - License: Apache 2.0. Governance: HuggingFace, Inc.
  - Architecture-independent: pure Python; installs on riscv64 via `pip install` without modification.

---

## Layer 4 -- Model Ecosystem

- **HuggingFace Tokenizers** -- blue (critical)
  - Fast Rust-based BPE/WordPiece/Unigram tokenizer used by Transformers.
  - License: Apache 2.0. Governance: HuggingFace, Inc.
  - Release provided by upstream (PyPI `manylinux_2_31_riscv64` wheel since v0.23.1, Apr 2026).
  - Gap: upstream CI does not run the riscv64 test suite (cross-compile build only).

- **SentencePiece** -- orange, downstream-only (critical)
  - BPE/unigram tokenizer required for LLaMA, Gemma, and T5 model families.
  - License: Apache 2.0. Governance: Google.
  - Release provided by RISE (RISE wheel builder); no official PyPI riscv64 wheel.
  - Gap: riscv64 pip install from official PyPI fails; RISE wheel builder is the only consumable source.

- **Tiktoken** -- red (optional)
  - BPE tokenizer for OpenAI-family models (GPT-4, GPT-2, Llama 3).
  - License: MIT. Governance: OpenAI.
  - Release provider: none (no riscv64 PyPI wheel confirmed Aug 2026).
  - Gap: PR #506 stalled; Rust source build possible but no consumable artifact shipped by anyone.

- **NumPy** -- orange, downstream-only (critical)
  - N-dimensional array library; fundamental dependency for the entire Python ML stack.
  - License: BSD-3-Clause. Governance: NumFOCUS / NumPy Steering Council.
  - Release provided by RISE (RISE wheel builder); no official PyPI riscv64 wheel as of Aug 2026 (Q3 2026 target missed).
  - Gap: riscv64 CI active (QEMU + native RISE runner); Highway SIMD ufuncs require Clang 19+/GCC 15+ for RVV runtime dispatch.

- **SafeTensors** -- green (critical)
  - Secure model weight format; primary serialization for HuggingFace Transformers and vLLM.
  - License: Apache 2.0. Governance: HuggingFace, Inc.
  - Release provided by upstream (PyPI `manylinux_2_31_riscv64` wheel in v0.8.0, shipped 2026-06-09).
  - RISE wheel builder previously provided older versions (0.5.2-0.7.0) and has since self-deprecated.

- **ONNX Runtime (CPU EP)** -- orange, upstream-ships-untested (optional)
  - Alternative ONNX model inference backend; optional path for non-LLM models.
  - License: MIT. Governance: Microsoft / ONNX project.
  - Release provider: none (no binary; cross-compile build guide exists).
  - Gap: experimental; no upstream riscv64 CI; RVV kernels actively merging (SiFive, ZTE).

---

## Layer 5 -- Compute

- **FAISS (CPU)** -- orange, downstream-only (critical)
  - Dense vector similarity search library for RAG retrieval.
  - License: MIT. Governance: Meta AI Research.
  - Release provider: none (no riscv64 PyPI wheel; no distro binary available).
  - Gap: cross-compile CI merged (PR #5184); one RVV kernel exists (ScalarQuantizer QT_4bit_uniform L2); all other hot paths are scalar fallback. ISCAS port PR #4503 blocked since Sep 2025. Must be built from source.

- **OpenBLAS** -- orange, upstream-ships-untested (critical)
  - BLAS/LAPACK reference implementation; primary GEMM backend for NumPy and PyTorch CPU.
  - License: BSD-3-Clause. Governance: community.
  - Release provided by Debian/Ubuntu (system package).
  - Gap: CI is QEMU-only (no native hardware); LAPACK correctness unvalidated by upstream; open TRSM ZVL256B correctness bug; Ubuntu 24.04 ships v0.3.26 (missing DYNAMIC_ARCH and ZVL targets -- use Debian sid v0.3.33+). GCC 14+ required for RVV paths.

- **Eigen** -- green (optional)
  - Header-only C++ linear algebra library; used by ONNX Runtime (Eigen EP) and optional PyTorch paths.
  - License: MPL-2.0. Governance: community (Tuxfamily).
  - Architecture-independent: header-only; ships as `libeigen3-dev` (`arch: all`) in Debian/Ubuntu; no compiled artifacts.
  - Note: a full RVV 1.0 SIMD backend (Tenstorrent/Syntacore; 11 headers covering float32/64, int8-64, FP16, BF16, complex, GEMM) was merged to master Nov 2025; CI runs on native SpacemiT K3 hardware (`allow_failure: true`). Not included in any versioned release (3.4.1 and 5.0.1 both predate the merge). To activate RVV: build from git master with GCC 14+/Clang 18+ and pass `-DEIGEN_RISCV64_USE_RVV10 -mrvv-vector-bits=zvl`. Known performance gaps on riscv64 master: no vectorized transcendentals (exp/log/sin/cos); `has_packet_segment` not implemented for tail elements (issue #3086).

- **oneDNN (DNNL)** -- orange, upstream-ships-untested (critical)
  - Deep learning convolution, matmul, pooling primitives; embedded in PyTorch CPU.
  - License: Apache 2.0. Governance: UXL Foundation (Intel-anchored).
  - Release provided by Debian sid (libdnnl3.6); no upstream binary.
  - Gap: experimental tier; QEMU CI (SMOKE tests only); INT8 quantized conv/matmul missing; FP16 reduction overflow bug open (PR #5361); LLVM libomp build failure on native riscv64 blocks Clang deployments.

- **XNNPACK** -- orange, downstream-only (critical)
  - Accelerated inference kernels used by PyTorch CPU eager path and vLLM CPU backend.
  - License: BSD-3-Clause. Governance: Google.
  - Release provided by Debian sid (debports `libxnnpack0.20241108`, November 2024 snapshot -- 18 months stale).
  - Gap: upstream CI currently has 100+ RVV FP16 test failures (issue #9886, open Apr 2026); root cause is QEMU configured without Zvfh while PR #9516 unconditionally enables FP16 dispatch. On RVA23U64 hardware where Zvfh is mandatory, FP16 inference works correctly -- the failures are QEMU-environment-specific. Tests are not run on master merges. BF16 kernels entirely absent. The Debian binary is 18 months stale and predates all 2025-2026 FP16 and pool/reduce kernel additions; consumers should build from source.

- **FBGEMM** -- red (optional)
  - Meta's quantized GEMM and embedding lookup library; used by PyTorch quantized operators.
  - License: BSD-3-Clause. Governance: Meta (company-controlled; no foundation).
  - Release provider: none (no riscv64 PyPI wheel or binary; PyTorch disables FBGEMM on riscv64 at configure time).
  - Gap: no riscv64 port exists; runtime GEMM dispatch throws `std::runtime_error` on any GEMM call; asmjit JIT dependency has no RVV backend (listed "Pending" with no timeline). No RISE involvement; Meta has no expressed interest in a RISC-V port.

- **SLEEF** -- blue (critical)
  - SIMD vectorized math library (sin, cos, log, exp) used by PyTorch ATen.
  - License: BSL-1.0. Governance: shibatch (individual maintainer).
  - Release provided by upstream (v3.9.0, March 2025).
  - Gap: upstream CI uses Jenkins (private, not GitHub Actions); no public CI badge for riscv64. DFT subcomponent disabled in upstream CI. RISE-funded integration into OpenJDK complete.

---

## Layer 6 -- Communication & Serialization

- **gRPC** -- orange, downstream-only (critical)
  - RPC framework; primary transport for vLLM serving API and Ray cluster communication.
  - License: Apache 2.0. Governance: CNCF / Google-controlled (6 of 7 steering seats Google).
  - Release provided by Debian/Ubuntu (system C++ library); no official Python PyPI riscv64 wheel.
  - Gap: no upstream riscv64 CI; BoringSSL (gRPC's TLS dependency) has zero riscv64 crypto assembly, resulting in an estimated 10x TLS throughput penalty vs Zkn-accelerated OpenSSL; issue #41591 (Python wheel publishing for riscv64) assigned but no action as of June 2026.

- **protobuf** -- orange, downstream-only (critical)
  - Protocol Buffers; wire format for gRPC, ONNX Runtime, and SentencePiece.
  - License: BSD-3-Clause. Governance: Google.
  - Release provided by Debian/Ubuntu (system package); upstream explicitly declined prebuilt riscv64 binaries ("not on our roadmap").
  - Gap: no upstream riscv64 CI; no prebuilt `protoc` binary for riscv64 in any upstream release (PRs #23205/#23206 abandoned 2025); requires source build or system package; no performance optimizations (no fasttable/musttail) on riscv64.

- **FlatBuffers** -- orange, downstream-only (optional)
  - Zero-copy serialization; internal model format for ONNX Runtime and ExecuTorch.
  - License: Apache 2.0. Governance: Google.
  - Release provided by Debian sid (v23.5.26) and Arch Linux (v25.12.19).
  - Gap: no upstream riscv64 CI or prebuilt binaries; validation delegated to Debian/Arch package CI; pure scalar C++ with no architecture-specific code, so functional risk is low.

---

## Layer 7 -- Runtime & System Libraries

- **CPython** -- orange, upstream-ships-untested (critical)
  - Python 3.10-3.13 runtime; the entire Python stack depends on it.
  - License: PSF. Governance: Python Software Foundation.
  - Release provided by RISE (prebuilt riscv64 binaries via riseproject-dev/python-versions).
  - Gap: no official python.org riscv64 binary release; active 3.15 beta stack-unwinding regression; RISE provides the only consumable prebuilt runtime.

- **glibc** -- orange, upstream-ships-untested (critical)
  - GNU C Library; C runtime, pthreads, riscv_hwprobe syscall.
  - License: LGPL-2.1. Governance: GNU/Sourceware.
  - Release provided by Debian/Ubuntu (system package).
  - Gap: Ubuntu 24.04 LTS ships glibc 2.39, which predates three crash-class fixes (IFUNC gp-pointer BZ #32269, hwprobe prototype BZ #32932, preinit alignment BZ #32228). Deployments on Ubuntu 24.04 carry latent crash risk; Debian sid glibc 2.41+ required for safe production use.

- **OpenSSL** -- green (critical)
  - TLS/crypto library; used for secure model downloads, gRPC transport, and API endpoints.
  - License: Apache 2.0. Governance: OpenSSL Software Foundation.
  - Release provided by upstream (all major Linux distros; first-class Tier 1 support).
  - Note: comprehensive RVV Zvk and scalar Zkn crypto acceleration (AES-GCM, ChaCha20, SHA). On RVA23U64 hardware (Zkn mandatory), the AES constant-time fallback gap reported for older silicon is not applicable. Five performance PRs open awaiting committer merge; QEMU-only CI (no native hardware runner).

- **jemalloc** -- orange, downstream-only (optional)
  - General-purpose memory allocator; used by Redis, PyTorch, and various serving runtimes.
  - License: BSD-2-Clause. Governance: community (sole owner Yann Collet -- [NEEDS VERIFICATION]).
  - Release provided by Debian/Ubuntu (system package).
  - Gap: no upstream riscv64 CI; generic C fallbacks functional; missing CPU spin-wait (Zihintpause `pause` instruction) -- marginal spinlock performance penalty.

- **tcmalloc** -- orange, upstream-ships-untested (optional)
  - Google's high-performance allocator; used by some gRPC and high-throughput serving deployments.
  - License: Apache 2.0. Governance: Google.
  - Release provider: none (must build from source; not packaged for riscv64 in standard distros).
  - Gap: per-CPU RSEQ slab allocator (tcmalloc's primary performance advantage) is a compile-only stub on riscv64; falls back to per-thread cache, eliminating most of tcmalloc's throughput benefit. Requires `percpu_rseq_riscv.S` assembly (4-6 engineer-weeks to implement).

- **mimalloc** -- orange, upstream-ships-untested (optional)
  - High-performance allocator; default in Python 3.13+ (but not auto-enabled in PyTorch on riscv64).
  - License: MIT. Governance: Microsoft.
  - Release provider: upstream source (two open PRs pending merge: VA-bits detection #1299, TLS/atomic-yield #1319).
  - Gap: SV39 MMU build-time fix merged Dec 2024; runtime VA-bits detection and yield optimization unmerged; potential correctness issue on mismatched VA hardware for cross-compiled binaries.

- **zstd** -- orange, upstream-ships-untested (critical)
  - Fast lossless compression; used for PyTorch checkpoint storage, vLLM KV cache, and gRPC message compression.
  - License: BSD-3-Clause / GPL-2.0. Governance: Meta (Yann Collet, sole release maintainer).
  - Release provided by Debian/Ubuntu (system package).
  - Gap: PR-only CI (not triggered on push to main); 7 performance PRs stalled 2-6 months unreviewed; Zicclsm unaligned access PR #4596 (+74% compression) blocked on prior C99/UB concern; functionally complete, performance gap only.

- **lz4** -- orange, upstream-ships-untested (optional)
  - Fast lossless compression; used for PyTorch checkpoint I/O and data pipeline caching.
  - License: BSD-2-Clause. Governance: community (Yann Collet, sole owner).
  - Release provided by Debian/Ubuntu (system package).
  - Gap: QEMU CI; 5 RVV performance optimization PRs stalled; functionally complete, performance gap only.

- **Snappy** -- orange, upstream-ships-untested (optional)
  - Compression library; used in some data pipeline and distributed storage contexts.
  - License: BSD-3-Clause. Governance: Google (maintainer in maintenance mode).
  - Release provided by Debian/Ubuntu (system package).
  - Gap: QEMU CI; missing RVV vrgather shuffle and CRC32 hardware acceleration (Zbc); two open performance PRs (+15% and +3-14% on benchmarks) minimally reviewed.

---

## Pipeline Chains and Alternate Paths

- PyTorch CPU eager inference (RVA23): PyTorch ATen -> oneDNN (xbyak_riscv JIT) -> XNNPACK -> OpenBLAS -> SLEEF
- vLLM CPU inference: vLLM CPU backend -> PyTorch ATen -> oneDNN -> OpenBLAS
- vLLM serving transport: vLLM -> gRPC -> protobuf (wire format) -> OpenSSL (TLS)
- llama.cpp GGUF inference: llama.cpp -> ggml (in-tree) -> RVV kernels (llamafile SGEMM + ggml-cpu)
- ExecuTorch edge inference: ExecuTorch runtime -> XNNPACK (CPU backend) -> OpenBLAS
- Agentic RAG pipeline: LangChain/LangGraph -> HF Transformers -> vLLM (serving) -> FAISS (retrieval) -> HF Tokenizers / SentencePiece
- Model load path: HF Transformers -> SafeTensors -> ONNX Runtime (optional)
- Model checkpoint I/O: PyTorch -> zstd / lz4 (compression) -> storage

---

## Artifact 2 -- Status Tables

### 2a. Full Status Table (spreadsheet / CSV source)

| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
|------|-------|-------------|-------|-----------------|---------------|----------------|-------|-----------------|
| LangChain | Orchestration | critical | green | upstream | Pure Python py3-none-any wheel; architecture-independent; inherits riscv64 from CPython. | [LangChain report](../../../reports/langchain.md) | 2026-06 | none |
| LangGraph | Orchestration | critical | green | upstream | Pure Python py3-none-any wheel; architecture-independent; inherits riscv64 from CPython. | [PyPI](https://pypi.org/pypi/langgraph/json) | 2026-08-12 | n/a |
| Ray | Orchestration | optional | grey (unknown) | unknown | No per-project report; no live riscv64 check performed; compiled C++/Cython extensions. | n/a | n/a | n/a |
| vLLM (CPU backend) | Inference Serving | critical | orange (upstream-ships-untested) | none | RISC-V CPU backend in source and builds; upstream CI does not run riscv64 test suite; no riscv64 PyPI wheel. | [vLLM report](../../../reports/vllm.md) | 2026-06 | none |
| llama.cpp | Inference Serving | critical | blue | none | Upstream CI builds and runs tests on riscv64 via RISE native runners; no binary release. | [llama.cpp report](../../../reports/llama-cpp.md) | 2026-06 | none |
| ExecuTorch | Inference Serving | optional | blue | none | Upstream riscv64.yml CI runs comprehensive test matrix (6 models, QEMU); no release artifact. | [pytorch/executorch CI](https://github.com/pytorch/executorch) | 2026-08-12 | n/a |
| PyTorch (CPU) | ML Framework | critical | orange (upstream-ships-untested) | none | Cross-compile CI only; RISE out-of-tree native CI; no riscv64 PyPI wheel (confirmed Aug 2026). | [PyTorch report](../../../reports/pytorch.md) | 2026-08-12 | none |
| HuggingFace Transformers | ML Framework | critical | green | upstream | Pure Python; installs on riscv64 without modification. | [PyPI](https://pypi.org/pypi/transformers/json) | 2026-08-12 | n/a |
| HuggingFace Tokenizers | Model Ecosystem | critical | blue | upstream | Official riscv64 PyPI wheel since v0.23.1 (Apr 2026); no riscv64 test suite in CI. | [Tokenizers report](../../../reports/tokenizers.md) | 2026-06 | none |
| SentencePiece | Model Ecosystem | critical | orange (downstream-only) | RISE | RISE wheel builder provides riscv64 wheel; no official PyPI riscv64 wheel. | [SentencePiece report](../../../reports/sentencepiece.md) | 2026-06 | none |
| Tiktoken | Model Ecosystem | optional | red | none | No riscv64 PyPI wheel (confirmed Aug 2026); PR #506 stalled; source build only. | [PyPI check](https://pypi.org/pypi/tiktoken/json) | 2026-08-12 | none |
| NumPy | Model Ecosystem | critical | orange (downstream-only) | RISE | RISE wheel builder provides riscv64 wheel; no official PyPI riscv64 wheel as of Aug 2026. | [NumPy report](../../../reports/numpy.md) | 2026-08-12 | Q3 2026 target missed |
| SafeTensors | Model Ecosystem | critical | green | upstream | Upstream ships manylinux_2_31_riscv64 wheel in v0.8.0 (PyPI, 2026-06-09); RISE wheel builder self-deprecated. | [PyPI v0.8.0](https://pypi.org/pypi/safetensors/0.8.0/json) | 2026-08-12 | none |
| ONNX Runtime (CPU EP) | Model Ecosystem | optional | orange (upstream-ships-untested) | none | No binary; cross-compile guide exists; no upstream riscv64 CI; RVV kernels merging. | [ONNX report](../../../reports/onnx.md) | 2026-06 | none |
| FAISS (CPU) | Compute | critical | orange (downstream-only) | none | Cross-compile CI; one RVV kernel; no riscv64 PyPI wheel or distro binary (confirmed Aug 2026). | [FAISS report](../../../reports/faiss.md) | 2026-08-12 | none |
| OpenBLAS | Compute | critical | orange (upstream-ships-untested) | Debian/Ubuntu | QEMU-only CI; LAPACK unvalidated; TRSM ZVL256B bug; Ubuntu 24.04 ships stale version. | [OpenBLAS report](../../../reports/openblas.md) | 2026-06 | none |
| Eigen | Compute | optional | green | upstream | Header-only C++ library; ships as arch:all Debian/Ubuntu package; architecture-independent shortcut applies. RVV 1.0 backend in git master (not in any release) requires explicit opt-in. | [Eigen report](../../../reports/eigen.md) | 2026-06 | Previously described as scalar-only; full RVV 1.0 backend merged master Nov 2025 |
| oneDNN (DNNL) | Compute | critical | orange (upstream-ships-untested) | Debian sid | Experimental tier; SMOKE test CI only (QEMU); INT8 missing; FP16 overflow bug open. | [oneDNN report](../../../reports/onednn.md) | 2026-06 | none |
| XNNPACK | Compute | critical | orange (downstream-only) | Debian sid (stale) | 100+ CI test failures are QEMU misconfiguration (no Zvfh configured); on RVA23U64 (Zvfh mandatory) FP16 works. Debian sid debports ships stale 18-month-old binary. | [XNNPACK report](../../../reports/xnnpack.md) | 2026-06 | Upgraded from red -- Debian sid binary exists; CI failures are QEMU-environment-specific, not code bugs on RVA23U64 |
| FBGEMM | Compute | optional | red | none | No riscv64 port; runtime GEMM dispatch throws on riscv64; asmjit has no RVV backend; PyTorch disables FBGEMM on riscv64 at configure time. | [FBGEMM report](../../../reports/fbgemm.md) | 2026-06 | n/a |
| SLEEF | Compute | critical | blue | upstream | riscv64 integrated since v3.6; official release v3.9.0; private Jenkins CI (not public). | [SLEEF report](../../../reports/sleef.md) | 2026-06 | none |
| gRPC | Communication | critical | orange (downstream-only) | Debian/Ubuntu | No upstream riscv64 CI; no Python PyPI wheel; BoringSSL zero riscv64 crypto assembly (10x TLS penalty). | [gRPC report](../../../reports/grpc.md) | 2026-06 | n/a |
| protobuf | Communication | critical | orange (downstream-only) | Debian/Ubuntu | Upstream declined riscv64 prebuilts; no upstream CI; system package only; no prebuilt protoc. | [protobuf report](../../../reports/protobuf.md) | 2026-06 | n/a |
| FlatBuffers | Communication | optional | orange (downstream-only) | Debian sid / Arch Linux | No upstream riscv64 CI; pure scalar C++; validated only by distro package CI. | [flatbuffers report](../../../reports/flatbuffers.md) | 2026-06 | n/a |
| CPython | Runtime | critical | orange (upstream-ships-untested) | RISE | No python.org riscv64 binary; RISE provides prebuilt; 3.15 beta regression active. | [Python report](../../../reports/python.md) | 2026-06 | none |
| glibc | Runtime | critical | orange (upstream-ships-untested) | Debian/Ubuntu | Ubuntu 24.04 glibc 2.39 predates 3 crash-class fixes; Debian sid 2.41 required. | [glibc report](../../../reports/glibc.md) | 2026-06 | none |
| OpenSSL | Runtime | critical | green | upstream | First-class Tier 1; RVV Zvk and scalar Zkn crypto acceleration; available in all major distros. Zvfh constant-time gap not applicable on RVA23U64 (Zkn mandatory). | [OpenSSL report](../../../reports/openssl.md) | 2026-06 | n/a |
| jemalloc | Runtime | optional | orange (downstream-only) | Debian/Ubuntu | No upstream riscv64 CI; generic C fallbacks functional; missing Zihintpause spin-wait. | [jemalloc report](../../../reports/jemalloc.md) | 2026-06 | n/a |
| tcmalloc | Runtime | optional | orange (upstream-ships-untested) | none | Per-CPU RSEQ slab allocator is a compile-only stub on riscv64; falls back to per-thread cache. | [tcmalloc report](../../../reports/tcmalloc.md) | 2026-06 | n/a |
| mimalloc | Runtime | optional | orange (upstream-ships-untested) | upstream source | SV39 fix merged Dec 2024; VA-bits detection and yield PRs unmerged; correctness risk on mismatched VA hardware. | [mimalloc report](../../../reports/mimalloc.md) | 2026-06 | n/a |
| zstd | Runtime | critical | orange (upstream-ships-untested) | Debian/Ubuntu | PR-only CI (not push-triggered); 7 performance PRs stalled; functionally complete. | [zstd report](../../../reports/zstd.md) | 2026-06 | n/a |
| lz4 | Runtime | optional | orange (upstream-ships-untested) | Debian/Ubuntu | QEMU CI; 5 RVV performance PRs stalled; functionally complete. | [lz4 report](../../../reports/lz4.md) | 2026-06 | n/a |
| Snappy | Runtime | optional | orange (upstream-ships-untested) | Debian/Ubuntu | QEMU CI; missing RVV vrgather and CRC32 Zbc; functionally complete. | [snappy report](../../../reports/snappy.md) | 2026-06 | n/a |

### 2b. Slide-Ready Summary Table

| Node | Color | Criticality | Release provider |
|------|-------|-------------|-----------------|
| LangChain | GREEN | critical | upstream |
| LangGraph | GREEN | critical | upstream |
| HuggingFace Transformers | GREEN | critical | upstream |
| SafeTensors | GREEN | critical | upstream |
| OpenSSL | GREEN | critical | upstream |
| Eigen | GREEN | optional | upstream |
| SLEEF | BLUE | critical | upstream |
| HuggingFace Tokenizers | BLUE | critical | upstream |
| llama.cpp | BLUE | critical | none (upstream source) |
| ExecuTorch | BLUE | optional | none (upstream source) |
| vLLM (CPU backend) | ORANGE | critical | none -- source build |
| PyTorch (CPU) | ORANGE | critical | none -- source build |
| FAISS (CPU) | ORANGE | critical | none -- source build |
| SentencePiece | ORANGE | critical | RISE only |
| NumPy | ORANGE | critical | RISE only |
| CPython | ORANGE | critical | RISE only |
| OpenBLAS | ORANGE | critical | Debian/Ubuntu |
| oneDNN (DNNL) | ORANGE | critical | Debian sid |
| XNNPACK | ORANGE | critical | Debian sid (stale) |
| gRPC | ORANGE | critical | Debian/Ubuntu |
| protobuf | ORANGE | critical | Debian/Ubuntu |
| zstd | ORANGE | critical | Debian/Ubuntu |
| glibc | ORANGE | critical | Debian/Ubuntu |
| ONNX Runtime (CPU EP) | ORANGE | optional | none -- source build |
| FlatBuffers | ORANGE | optional | Debian sid / Arch |
| jemalloc | ORANGE | optional | Debian/Ubuntu |
| tcmalloc | ORANGE | optional | none -- source build |
| mimalloc | ORANGE | optional | none (PRs pending) |
| lz4 | ORANGE | optional | Debian/Ubuntu |
| Snappy | ORANGE | optional | Debian/Ubuntu |
| Tiktoken | RED | optional | none |
| FBGEMM | RED | optional | none |
| Ray | GREY | optional | unknown |

---

## Artifact 3 -- Narrative and Next Steps

### Scorecard

**Critical-path nodes (22):** 5 green, 3 blue, 14 orange, 0 red, 0 grey.

**Optional nodes (11):** 1 green, 1 blue, 7 orange, 2 red, 1 grey.

No critical-path node is red. This is a milestone: every component of the Agentic AI CPU stack is at minimum obtainable on riscv64 in some form. The remaining gap is entirely in the orange band -- components that are buildable and runnable but lack upstream binary releases, upstream CI, or validated test suites.

---

### The Story

**No more red critical nodes.** Two corrections to earlier assessments clear the last blocker:

First, **XNNPACK is now orange, not red.** The 100+ FP16 CI failures (issue #9886) are QEMU-environment-specific: QEMU is configured without Zvfh, while PR #9516 unconditionally enables FP16 dispatch when the V extension is present. On RVA23U64 hardware -- where Zvfh is mandatory per the profile specification -- FP16 inference works correctly. Debian sid debports also ships a riscv64 binary (18-month-old snapshot, stale but existent). The XNNPACK cpuinfo fix is still worth doing for CI health and portability to non-RVA23 hardware, but it is not a production blocker for our target.

Second, **XNNPACK is still functionally incomplete**: tests are not run on master merges, BF16 kernels are entirely absent, and the Debian binary is too stale to use as-is. Consumers should build XNNPACK from source for a production deployment.

**The primary gap is now the absence of upstream binary releases, not broken code.** Of 22 critical-path nodes, only 5 can be installed from official PyPI or upstream release channels on riscv64 (LangChain, LangGraph, HF Transformers, SafeTensors, OpenSSL). Every other compiled component requires a source build, a RISE-maintained wheel, or a Debian/Ubuntu system package. This is an operational burden, not a technical one -- the code works, but the distribution pipeline is not wired for riscv64.

**The RISE dependency is a hidden risk.** Three critical nodes -- CPython, NumPy, and SentencePiece -- are only consumable today via the RISE wheel builder (`gitlab.com/riseproject/python/wheel_builder`). If RISE stops building those wheels, those packages regress to source-build-only overnight. Leadership should not treat RISE-provided wheels as equivalent to upstream support.

**Eigen's RVV story is more promising than previously assessed.** A full RVV 1.0 SIMD backend (Tenstorrent/Syntacore contribution) was merged to the Eigen master branch in November 2025, covering float32/64, int8-64, FP16, BF16, complex, and GEMM operations. CI runs on native SpacemiT K3 hardware. This backend has not shipped in any versioned Eigen release (3.4.1 and 5.0.1 both predate it), so downstream projects consuming a packaged Eigen get scalar performance today. But the technical work is done; it is waiting on a release cut. For performance-critical applications, building Eigen from git master with `-DEIGEN_RISCV64_USE_RVV10` is the path to RVV-accelerated linear algebra.

**The infrastructure layer (gRPC, protobuf, OpenSSL) is workable but has a TLS throughput gap.** OpenSSL is first-class green with Zkn/Zvk crypto acceleration. But gRPC ships with BoringSSL (not OpenSSL), and BoringSSL has zero riscv64 crypto assembly -- an estimated 10x TLS throughput penalty for high-throughput serving endpoints. Deployments that replace BoringSSL with OpenSSL (via gRPC's SSL credential override) avoid this gap.

**The memory allocator picture is nuanced.** mimalloc (Python 3.13+ default) and tcmalloc both have riscv64 gaps: mimalloc has unmerged VA-bits detection PRs, and tcmalloc's per-CPU RSEQ slab (its main performance advantage) is a stub on riscv64. For most inference serving workloads, the default glibc allocator is sufficient. jemalloc (used by Redis and some PyTorch configurations) is functionally complete on riscv64 with only a minor spinlock performance gap.

**glibc LTS risk persists.** Ubuntu 24.04 ships glibc 2.39, predating three crash-class kernel interaction fixes. Any riscv64 deployment on Ubuntu 24.04 LTS is at elevated crash risk; Debian sid or a custom glibc is required for safe production use.

---

### Actionable Next Steps (prioritized)

**P0 -- Merge PyTorch riscv64 CI and cut a release wheel (4-8 engineer-weeks; unlocks the entire Python ML stack)**

Merge RFC #77 (RISE provides native CI runners; RISE-affiliated maintainer named). This makes riscv64 a recognized PyTorch platform, adds a non-blocking CI gate, and is a prerequisite for PyTorch publishing a riscv64 PyPI wheel. Without this, every vLLM and Transformers deployment on riscv64 is permanently a manual source build. With PyTorch as a binary, NumPy's wheel follows naturally.

- Owner: Meta PyTorch team (albanD approval needed). ISCAS (zhangfeiv0) is the driver.
- RISE coverage: RISE already provides CI runners and has a named maintainer (luhenry). The RFC is drafted. This needs Meta sign-off, not more engineering.

**P0 -- Ship NumPy riscv64 PyPI wheel (2-4 engineer-weeks; unblocks the Python ML stack)**

NumPy's PR #31488 (native riscv64 CI) merged May 2026. The remaining blocker is cutting a production release with a riscv64 wheel. This unblocks NumPy, SciPy, pandas, and the entire scientific Python stack from requiring the RISE wheel builder.

- Owner: NumPy steering council. Ludovic Henry (RISE) is named riscv64 co-maintainer.
- RISE coverage: RISE provides CI runners and the named maintainer. The gap is cutting a release.

**P1 -- Fix XNNPACK CI / cpuinfo Zvfh detection (1-2 engineer-weeks; restores CI health and unblocks non-RVA23 targets)**

Fix `cpuinfo_has_riscv_zvfh()` in `pytorch/cpuinfo`, then restore proper FP16 dispatch in XNNPACK. On RVA23U64 hardware this is not a production blocker, but it is needed for CI reliability, for non-RVA23 deployments, and for the XNNPACK BF16 work that depends on correct extension detection.

- Owner: Google (cpuinfo + XNNPACK). ISCAS has a stake and could drive the PR.
- RISE coverage: RISE provides CI hardware for validation; RISE AI/ML WG tracks this.

**P1 -- Unblock FAISS RISC-V port (4-6 engineer-weeks; unblocks RAG)**

ISCAS PR #4503 (RVV SIMD kernels for FAISS) has been blocked since September 2025. The bottleneck is Meta FAIR reviewer bandwidth, not code quality. Merging this PR moves FAISS from orange to blue and enables GPU-free vector similarity at meaningful RVV performance.

- Owner: Meta FAIR (alexanderguzhva review needed). ISCAS (vsvnakers, lyd1992) are the contributors.
- RISE coverage: None. Meta is not a RISE member. This requires direct engagement with Meta FAIR.

**P1 -- Advance ExecuTorch from QEMU to native hardware CI**

ExecuTorch Phase 1 (QEMU test matrix) is complete. Running the same matrix on native RISE riscv64 runners upgrades ExecuTorch to green and validates real-hardware latency numbers.

- Owner: PyTorch / ExecuTorch team. RISE provides the runners.
- RISE coverage: riseproject-dev/executorch fork active; RISE runners available.

**P2 -- Fix oneDNN INT8 + FP16 gaps (6-12 engineer-weeks)**

oneDNN's INT8 quantized conv/matmul are missing for riscv64. INT8 is the dominant quantization format for production LLM inference. The FP16 overflow bug (PR #5361) also blocks BF16/FP16 accuracy.

- Owner: ISCAS (zhangfeiv0, xiazhuozhao). SpacemiT hardware available.
- RISE coverage: ISCAS and SpacemiT are RISE General Members. No dedicated RFP found for oneDNN INT8.

**P2 -- Fix gRPC TLS throughput (replace BoringSSL with OpenSSL, 1-2 engineer-weeks)**

gRPC's BoringSSL has no riscv64 crypto assembly, resulting in ~10x TLS throughput penalty. Configuring vLLM's gRPC endpoint to use OpenSSL via credential override is a workaround requiring no upstream changes. Upstream fix (BoringSSL RVV crypto assembly) is a multi-month effort and not RISE-funded.

- Owner: platform/operations team for the workaround; BoringSSL team for the upstream fix.
- RISE coverage: RISE has no involvement with BoringSSL.

**P2 -- Ship Tiktoken riscv64 PyPI wheel (1-2 engineer-weeks; unblocks GPT-family tokenization)**

PR #506 has validation on native RISE hardware but is stalled. The Rust build infrastructure already exists (maturin); this is a CI matrix addition.

- Owner: OpenAI. External contributor has validated the build on RISE hardware.
- RISE coverage: RISE runners used for validation; no funded contributor.

**P2 -- Ship Eigen RVV in a versioned release (0 engineering cost; release cut only)**

The entire Eigen RVV 1.0 SIMD backend is already merged to master. Cutting a new versioned Eigen release (3.5.x or 6.0) would make RVV-accelerated linear algebra available to all downstream consumers without requiring git master builds. This is a maintainer action, not an engineering one.

- Owner: Eigen maintainers (consensus-based; no formal process). Could be proposed on the GitLab issue tracker.
- RISE coverage: Tenstorrent drove the RVV implementation; SpacemiT provides the native CI hardware. Neither is RISE-funded for this specific action.

**P3 -- Validate glibc on Ubuntu 24.04 / plan LTS upgrade path**

Any production riscv64 deployment on Ubuntu 24.04 LTS should validate the three crash-class glibc bugs (BZ #32269, #32932, #32228) or plan a migration to Debian sid / Ubuntu 25.04+.

- Owner: operations / platform team.
- RISE coverage: N/A (OS/distro concern).

**P3 -- Research Ray riscv64 status**

Ray is the primary distributed execution framework for scaling Agentic AI workloads. Its riscv64 status is currently unknown (grey). A targeted investigation (PyPI wheel check, GitHub CI review, RISE involvement check) should precede any production planning that assumes Ray is available.

- Owner: engineering team.
- RISE coverage: RISE AI/ML WG scope includes distributed inference frameworks.

---

### Excluded components (grey -- N/A)

The following are classified grey because they are proprietary/vendor-only paths architecturally excluded from a CPU-only RISC-V deployment:

- CUDA / cuDNN / cuBLAS / TensorRT / NCCL (NVIDIA proprietary GPU stack)
- ROCm / HIP / MIOpen (AMD GPU stack)
- Intel GPU / oneAPI GPU (Intel GPU stack)
- Triton GPU compiler (GPU JIT only)
- torchvision / torchaudio (GPU-dependent multimodal add-ons)
