---
title: vLLM
categories:
  - llm-inference
  - ai-ml
---

# vLLM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for vLLM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[vLLM](https://www.vllm.ai/) is a high-throughput LLM inference and serving engine. It is hosted under the PyTorch Foundation (Linux Foundation umbrella) and licensed Apache 2.0. The current stable release is v0.23.0 (June 15, 2026).

Governance is meritocratic with three tiers: 5 Lead Maintainers with final authority (Woosuk Kwon, Zhuohan Li, Simon Mo, Kaichao You, Robert Shaw), 12 Core Maintainers, and approximately 50 area-specific Committers. Lead Maintainer affiliations are Inferact (Kwon, Mo, You), Meta (Li), and Red Hat (Shaw). The project has no formal hardware tiering policy (no Tier 1/2/3 classification). The stated governance preference is for new hardware to enter via the plugin system rather than the core codebase; the RISC-V CPU backend is notable in that it merged directly into the CPU backend, following the existing x86 and ARM pattern.

The primary reviewer for all RISC-V CPU backend changes is **bigPYJ1151 (Li Jiang, Intel)**, who has been the sole approving maintainer for every RISC-V PR merged since March 2026.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port progressed through four major phases.

**Phase 1: Initial scalar backend (Sep-Oct 2025)**

[PR #22112](https://github.com/vllm-project/vllm/pull/22112) (merged Sep 25, 2025) added the first RISC-V support: scalar BF16/FP16/FP32 conversions in `cpu_types_scalar.hpp` and build system recognition of `riscv64`. Author: chenlang (ZTE). This was the first RISC-V commit in the repository.

Two bug-fix PRs followed rapidly: [PR #25816](https://github.com/vllm-project/vllm/pull/25816) (merged Sep 30, 2025) guarded the unconditional IPEX import that caused a hard crash on RISC-V, and [PR #26693](https://github.com/vllm-project/vllm/pull/26693) (merged Oct 13, 2025) disabled `torch.compile` for RISC-V to prevent a GCC error on `-march=native`. All three shipped in v0.11.0 (Oct 10, 2025) or v0.11.1 (Nov 18, 2025).

**Phase 2: RVV vector backend (Mar 2026)**

After three earlier attempts closed without merging ([PR #20292](https://github.com/vllm-project/vllm/pull/20292), [PR #32405](https://github.com/vllm-project/vllm/pull/32405), [PR #36538](https://github.com/vllm-project/vllm/pull/36538)), [PR #36578](https://github.com/vllm-project/vllm/pull/36578) (merged Mar 11, 2026, author: typer-J) introduced `csrc/cpu/cpu_types_riscv.hpp` with RVV register definitions and vectorized `exp`/`tanh`/`erf`. This shipped in v0.18.0 (Mar 20, 2026), which explicitly listed RISC-V CPU backend support in its release notes.

**Phase 3: Multi-VLEN and optimized attention kernels (Apr-Jun 2026)**

[PR #39478](https://github.com/vllm-project/vllm/pull/39478) (merged Apr 20, 2026, author: lyd1992/ISCAS) replaced the hardcoded `zvl128b` march flag with CMake-level VLEN auto-detection, fixing segfaults on non-128b hardware. This shipped in v0.20.0 (Apr 27, 2026).

[PR #40119](https://github.com/vllm-project/vllm/pull/40119) (merged May 15, 2026, author: lyd1992/ISCAS) added RVV-optimized attention kernels with Mx8 tiled GEMM using `vfmacc_vf` scalar-broadcast FMA. [PR #42943](https://github.com/vllm-project/vllm/pull/42943) (merged May 21, 2026, author: velonica0/Nankai University) extended these to VLEN=256. [PR #42730](https://github.com/vllm-project/vllm/pull/42730) (merged Jun 1, 2026, author: velonica0) added RVV `vrgather` intrinsics for WNA16/GPTQ dequantization, enabling GPTQ inference on RISC-V.

[PR #44478](https://github.com/vllm-project/vllm/pull/44478) (merged Jun 11, 2026, author: velonica0) enabled oneDNN W8A8 INT8 quantization on Spacemit X100 hardware.

**Phase 4: Hardening and detection fixes (Apr-Jun 2026)**

[PR #40428](https://github.com/vllm-project/vllm/pull/40428) (merged Apr 22, 2026) fixed NaN corruption in softmax caused by unclamped `exp()` input. [PR #40569](https://github.com/vllm-project/vllm/pull/40569) (merged May 6, 2026) fixed OMP thread binding for RISC-V. [PR #43179](https://github.com/vllm-project/vllm/pull/43179) (merged Jun 18, 2026) fixed RVV capability detection on SG2044 hardware, which advertises the V extension in `/proc/cpuinfo` but omits the `zvl128b` hint flags expected by the prior detection logic.

The two tracking issues, [#8996](https://github.com/vllm-project/vllm/issues/8996) (Oct 2024) and [#19611](https://github.com/vllm-project/vllm/issues/19611) (Jun 2025), were both closed as "not planned." The code landed through individual hardware PRs rather than through the RFC process that these issues had proposed.

---

## 3. Upstream Support Tier

vLLM has no published hardware tiering policy. The following is an assessment based on observed treatment.

RISC-V support lives in the core CPU backend (not a plugin), has a dedicated maintainer who reviews and merges all RISC-V PRs (bigPYJ1151), and has been mentioned by name in release notes (v0.18.0, v0.20.0, v0.23.0). This places it at the same structural level as the ARM aarch64 and s390x CPU backends.

However, RISC-V has no CI (see section 7), no prebuilt binary distribution (see section 8), and several features available on x86 and ARM are absent (see section 6). The practical support tier is below ARM aarch64 and above a pure prototype.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

vLLM's RISC-V support is entirely within the CPU backend. There is no GPU/accelerator RISC-V path; CUDA, ROCm, XPU, and HPU backends are irrelevant to riscv64.

**ISA extensions used:** RVV 1.0 (core), Zvfh (FP16 vectors), Zvfbfmin (BF16 vectors), Zihintpause (`__riscv_pause` spin-wait), Zvl128b/Zvl256b (vector length constraints). Base ISA: rv64gc.

**RISC-V-specific source files in `csrc/cpu/`:**

- `cpu_types_riscv.hpp` (25 lines): Entry-point dispatcher; includes `cpu_types_riscv_defs.hpp` and `cpu_types_riscv_impl.hpp`; enforces `__riscv_v_min_vlen` at compile time.
- `cpu_types_riscv_defs.hpp` (106 lines): VLEN-to-LMUL macro mapping for VLEN=128 and VLEN=256; fixed-width vector typedefs using `__attribute__((riscv_rvv_vector_bits(...)))`.
- `cpu_types_riscv_impl.hpp` (989 lines): Full vector type classes (FP16Vec8, FP16Vec16, BF16Vec8/16/32, FP32Vec4/8/16, INT8Vec16, INT32Vec16) using RVV intrinsics; polynomial `exp()`/`tanh()`/`erf()` with RVV FMA; WNA16/GPTQ `vrgather` constructors for 4-bit dequantization. FP8 stubs present as dead code to satisfy GCC 15 `-Wtemplate-body`.
- `cpu_attn_rvv.hpp` (412 lines): Mx8 tiled GEMM attention kernel using `vfmacc_vf` scalar-broadcast FMA with K-unroll-by-4; full dispatch paths for VLEN=128 and VLEN=256; `AttentionImpl<ISA::RVV, ...>` specialization with `reshape_and_cache` via RVV strided store intrinsics. FP8 KV cache explicitly absent.
- `cpu_arch_macros.h`: `FAST_SPINNING` defined as `__riscv_pause()` (Zihintpause); `DEFINE_FAST_EXP` delegates to `FP32Vec16::exp()`.

By source-line count, the RISC-V implementation (approximately 1,532 lines) exceeds ARM aarch64 (approximately 1,337 lines) and approaches s390x (approximately 1,585 lines).

**Python-level platform support (`vllm/platforms/`):**

- `interface.py`: `CpuArchEnum.RISCV = enum.auto()`, detected via `platform.machine().lower().startswith("riscv")`.
- `cpu.py`: Supported dtypes for RISC-V are `[torch.bfloat16, torch.float16, torch.float32]`. tcmalloc bundling and libgomp `LD_PRELOAD` logic are disabled for RISC-V (both are active for x86 and ARM). Chunked prefill disabled unconditionally for RISC-V.

**Attention dispatch (`csrc/cpu/generate_cpu_attn_dispatch.py`):**

`ISA["RVV"] = 5`. Two dispatch blocks: RVV path (for VLEN=128 or VLEN=256, includes `cpu_attn_rvv.hpp`) and generic RISC-V scalar fallback. Head dims supported: 32, 64, 96, 128, 160, 192, 224, 256, 512. FP8 KV cache not supported for RVV.

---

## 5. Build System, Cross-Compilation, and Toolchain

All RISC-V build logic is in `cmake/cpu_extension.cmake`. There is no separate riscv64 toolchain file.

**VLEN detection:** At cmake configure time, `/proc/cpuinfo` is scanned for `zvl128b`, `zvl256b`, `zvl512b`, `zvl1024b`. The user may override with `-DVLLM_RVV_VLEN=<N>`. If RVV is detected but VLEN cannot be determined, cmake exits with a fatal error and instructions to set `-DVLLM_RVV_VLEN` explicitly. This is the expected behavior for cross-compilation or QEMU user-mode builds where `/proc/cpuinfo` may not carry `zvl` hint flags.

**`-march` flag selection:**

| Condition | Flags |
|---|---|
| BF16 (zvfbfmin detected) | `-march=rv64gcv_zvfh_zfbfmin_zvfbfmin_zvl${VLEN}b -mrvv-vector-bits=zvl -mabi=lp64d` |
| FP16 only (zvfhmin detected) | `-march=rv64gcv_zvfh_zvl${VLEN}b -mrvv-vector-bits=zvl -mabi=lp64d` |
| Scalar fallback (no RVV) | `-march=rv64gc` |

**Source files added per configuration:**

- All riscv64 builds: `csrc/cpu/sgl-kernels/gemm_int4.cpp`
- RVV with VLEN > 0 and FP16 or BF16: `csrc/cpu/cpu_wna16.cpp`
- RVV with FP16 or BF16: oneDNN v3.10 enabled (generic `v3.10` tag, not the AArch64-pinned commit)

**Compiler requirements:** The cmake does not enforce a version floor for riscv64 (the GCC >= 12.3 check applies to x86 only). In practice, GCC >= 14 or Clang >= 17 is needed for the BF16 path (`Zvfbfmin` support); GCC 13 or Clang 16 suffices for the FP16-only path. C++20 is required (`CMAKE_CXX_STANDARD 20`).

**libgomp:** The cmake notes that on RISC-V, PyTorch is typically built from source or via distro, so no vendored `libgomp` exists. System `libgomp` (e.g., `apt install libgomp1`) is required.

**Dockerfile:** No riscv64 Dockerfile exists. `docker/Dockerfile.cpu` supports `linux/amd64` and `linux/arm64` only. The repository has `Dockerfile.ppc64le` and `Dockerfile.s390x` but no `Dockerfile.riscv64`.

**Build commands (native riscv64 hardware):**

```
VLLM_TARGET_DEVICE=cpu uv pip install . --no-build-isolation
```

With explicit VLEN (required for cross-compile or when `/proc/cpuinfo` lacks `zvl` hints):

```
CMAKE_ARGS="-DVLLM_RVV_VLEN=256" VLLM_TARGET_DEVICE=cpu uv pip install . --no-build-isolation
```

No QEMU build procedure is documented in the repository. QEMU usage for builds requires explicit `-DVLLM_RVV_VLEN=<N>`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 (x86) | arm64 | riscv64 |
|---|---|---|---|
| FP32 inference | Yes | Yes | Yes |
| FP16 inference | Yes | Yes | Yes |
| BF16 inference | Yes | Yes | Yes (via FP32 simulation or native Zvfbfmin) |
| FP8 KV cache | Yes (AVX-512/AMX) | No | No |
| Chunked prefill | Yes | No | No |
| RVV/NEON/AVX attention kernels | Yes (AMX+VEC) | Yes (NEON) | Yes (RVV, VLEN=128 and VLEN=256) |
| WNA16/GPTQ quantization | Yes | Partial | Yes (RVV vrgather, merged Jun 1, 2026) |
| oneDNN W8A8 INT8 | Yes | No | Yes (merged Jun 11, 2026) |
| OMP thread binding (auto) | Yes | Yes | Yes (fixed PR #40569) |
| tcmalloc bundling | Yes | Yes | No |
| libgomp LD_PRELOAD | Yes | Yes | No |
| torchaudio | Yes | Yes | No (excluded in requirements/cpu.txt) |
| torchvision | Yes | Yes | No (excluded in requirements/cpu.txt) |
| numba | Yes | Yes | No (llvmlite does not support riscv64) |
| Multimodal models (audio/video) | Yes | Yes | No (torchaudio/torchvision absent) |
| Prebuilt PyPI wheel | Yes | Yes | No |
| Official Dockerfile | Yes | Yes | No |

The core text inference path (FP32/FP16/BF16, attention, WNA16/GPTQ, oneDNN INT8) is fully covered. The missing items (FP8 KV cache, chunked prefill, multimodal) represent either hard architectural limitations or known open gaps with no current contributor.

---

## 7. CI/CD Infrastructure

**vLLM has no riscv64 CI.** This was confirmed by a complete audit of `.github/workflows/` (6 files), `.buildkite/` (8 files), and checks for `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` (all absent). No workflow file references riscv64, QEMU emulation, or any RISC-V runner.

The 6 active GitHub Actions workflows are: `pre-commit.yml` (runs on `[self-hosted, linux, x64, vllm-runners]`), `stale.yml`, `add_label_automerge.yml`, `issue_autolabel.yml`, `new_pr_bot.yml`, `macos-smoke-test.yml`. None have riscv64 stages.

Buildkite CI targets: x86_64 (CUDA), aarch64 (CUDA, CPU), AMD GPU (ROCm), Intel (CPU, XPU). No riscv64 target.

Every RISC-V PR was reviewed and merged based on author-provided manual test results on private hardware. No PR added a CI workflow file. The tracking issue [#19611](https://github.com/vllm-project/vllm/issues/19611) proposed adding CI tests; that proposal was never implemented and the issue was closed as "not planned."

The RISE Project launched free native RISC-V GitHub Actions runners (Scaleway EM-RV1 bare metal) in March 2026 ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). PyTorch uses these runners. vLLM does not, and no PR has proposed adopting them.

---

## 8. Distribution and Release Status

**PyPI:** Zero riscv64 wheels exist across all 89 published vLLM versions. All wheels target `x86_64` and `aarch64` only. Confirmed by live query of `https://pypi.org/pypi/vllm/json`.

**GitHub Releases:** The v0.23.0 release (latest as of this report) publishes 9 assets: 4 x86_64 wheels (plain, `+cpu`, `+cu129`, `+cpu+cu129`), 4 aarch64 wheels (same variants), and 1 source tarball. No riscv64 asset in any release. Release notes for v0.23.0, v0.22.0, and v0.21.0 mention RISC-V source-code changes (RVV kernels, WNA16 helpers) but no binary artifacts.

**Distro packaging:** vLLM is not packaged in Debian (tracker returns HTTP 404), not in Ubuntu 24.04 Noble (search returns no results), and not in Arch Linux (not in official repos; the Arch RISC-V port tracks official repos only). There is no riscv64 binary available from any distribution.

**RISE wheel builder:** The RISE wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) lists 78 packages. vLLM is not among them. The URL `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/vllm/` redirects to canonical PyPI.

**Installation on riscv64 requires building from source.** The source tarball is available at each GitHub Release. The build procedure is documented only implicitly through CMakeLists.txt and requirements files, with no dedicated riscv64 installation guide in the repository.

---

## 9. Dependencies

The following covers only dependencies relevant to the CPU/riscv64 path. CUDA, ROCm, XPU, and HIP dependencies are not applicable.

| Dependency | Role | riscv64 Status | Blocking Issues |
|---|---|---|---|
| PyTorch (torch==2.11.0) | Core tensor engine | No official PyPI wheel; RISE native CI runner added Apr 2026 but most test suites still run under cross-compile emulation; RVV vec sublibrary unmerged | P0: must be built from source; no pip-installable riscv64 wheel |
| NumPy | Array numerics, tokenization | Builds; CI since Nov 2023; no official PyPI riscv64 wheel ([numpy#30216](https://github.com/numpy/numpy/issues/30216)) | P2: must come from distro or RISE wheel |
| oneDNN (via PyTorch) | BLAS/norm primitives for CPU inference | Builds for RISC-V since v3.4 (Oct 2024); embedded in PyTorch | Not independently distributed; status follows PyTorch |
| OpenBLAS (via NumPy) | BLAS fallback on riscv64 | Builds; RVV kernels actively developed; v0.3.34 released Jun 2026 | Available as system package on Debian/Ubuntu riscv64 |
| tokenizers (HuggingFace) | Fast tokenization (Rust) | PyPI `linux_riscv64` wheel available since v0.21+ (Mar 2026) | No blocking issues |
| safetensors (HuggingFace) | Model weight loading (Rust) | PyPI `linux_riscv64` wheel available since Mar 2026 | No blocking issues |
| transformers (HuggingFace) | Model architecture definitions | Pure Python; no architecture-specific issues | No blocking issues |
| sentencepiece | Tokenization for LLaMA, Gemma, T5 | riscv64 wheel was added then reverted by maintainer ([#1226](https://github.com/google/sentencepiece/pull/1226)); no official PyPI wheel; open issue [#1250](https://github.com/google/sentencepiece/issues/1250) | P1: LLaMA/Gemma/T5 models cannot be pip-installed on riscv64 |
| tiktoken | OpenAI tokenizer (Rust) | No PyPI riscv64 wheel; CI PR [#506](https://github.com/openai/tiktoken/pull/506) stalled since Mar 2026 | P1: GPT-2/GPT-4 tokenization unavailable via pip |
| msgspec | API server serialization (Rust) | No PyPI riscv64 wheel; CI PR [#987](https://github.com/jcrist/msgspec/pull/987) stalled since Mar 2026 | P2: API server has a distribution gap; workaround possible |
| blake3 | Model cache integrity | PyPI `linux_riscv64` wheel available since Apr 2026 | No blocking issues |
| outlines-core | Structured output backend | PyPI `linux_riscv64` wheel available since Mar 2026 | No blocking issues |
| numba | JIT kernel path | **Explicitly excluded on riscv64** in requirements/cpu.txt; `llvmlite` does not support riscv64 ([llvmlite#923](https://github.com/numba/llvmlite/issues/923)) | Fallback C++ path used; not a runtime blocker |
| torchaudio | Audio preprocessing | **Explicitly excluded on riscv64** in requirements/cpu.txt | Disables audio multimodal models |
| torchvision | Vision preprocessing | **Explicitly excluded on riscv64** in requirements/cpu.txt | Disables vision multimodal models |
| protobuf | Serialization/model metadata | Builds; no prebuilt `protoc` binary for riscv64 ([#23206](https://github.com/protocolbuffers/protobuf/issues/23206) abandoned Aug 2025); Python fallback available | P3: build-time proto compilation needs cross-compile or system package |
| Triton | GPU kernel compiler | Not applicable (GPU only; RISC-V CPU path uses direct C++ kernels) | Not applicable |

The single hardest dependency bottleneck is PyTorch (P0): without a pip-installable riscv64 wheel, vLLM cannot be installed through the standard `pip install vllm` path on riscv64, regardless of the quality of vLLM's own RISC-V code.

---

## 10. Ecosystem Status

**RISE Project involvement:** None documented. A full audit of all 27 RISE blog posts (May 2024 - Jun 2026) found zero mentions of vLLM. The RISE wheel builder does not include vLLM. The RISE RISC-V Runners program has no documented vLLM CI jobs (PyTorch logged 2,589 jobs in the first six weeks; vLLM is not listed). The Q1 2026 RISE Outsized Impact Award citation names PyTorch RVV PRs and llama.cpp, not vLLM.

RISE general members contributing to vLLM RISC-V code: ISCAS (lyd1992 -- RVV attention kernels, OMP fixes, detection fixes) and ZTE (langc23 -- initial scalar backend). SpacemiT hardware (X100, K1) is used for testing but no SpacemiT engineer appears as a PR author.

**Contributing organizations:**

- ISCAS (Institute of Software, Chinese Academy of Sciences): primary driver of the RVV attention kernel, multi-VLEN dispatch, exp() clamp, and VLEN detection fix. Confirmed affiliation via commit email `liuyudong@iscas.ac.cn`.
- ZTE: authored the initial scalar backend (PR #22112). Commit email `chen.lang5@zte.com.cn`.
- Nankai University (velonica0): WNA16/GPTQ support, VLEN=256 attention kernels, oneDNN INT8.
- Intel (bigPYJ1151): sole reviewer and merger for all RISC-V CPU backend work since Mar 2026.

The work is organizationally backed rather than individual-contributor-driven: ISCAS is a RISE general member with an active riscv64 porting mandate, and their contributions to vLLM are consistent with a structured program.

**Hardware platforms tested:**

- Sophgo SG2044: 64 harts, RVV 1.0, VLEN=128, openEuler/EulixOS. Primary development and test platform.
- Spacemit X100 / SpacemiT K1: RVA23 + RVV 1.0, VLEN=256, 16 cores. Used for VLEN=256 testing and oneDNN INT8 validation.
- BananaPi F3 (SpacemiT K1): rv64gcv, VLEN=256, 16GB RAM. Used for pure-Python path testing.
- QEMU riscv64 emulation: used in PR #22112 with AMD GPU passthrough.

---

## 11. Known Bugs and Active Issues

**Recently fixed (Jun 2026):**

[PR #43179](https://github.com/vllm-project/vllm/pull/43179) (merged Jun 18, 2026): `_riscv_supports_rvv_vlen128()` returned `False` on SG2044 hardware. SG2044 advertises the V extension in `/proc/cpuinfo` but omits `zvl128b` VLEN hint flags. This caused the runtime to select the scalar `vec` backend even on hardware where RVV kernels were compiled and valid. Fix adds a C++ `cpu_attn_has_isa()` helper registered as `torch.ops._C.cpu_attn_has_isa`, querying `__riscv_v_min_vlen == 128` at compile time as a fallback when no `zvl` flags are found. This bug would have silently degraded all SG2044 inference to scalar performance after PR #40119 landed.

**Previously fixed (Apr-May 2026):**

[PR #40428](https://github.com/vllm-project/vllm/pull/40428): `FP32Vec16::exp()` produced NaN on large negative inputs via `-inf * 0.0 = NaN` in polynomial evaluation, silently corrupting attention scores and softmax output on RVV hardware. Fixed by clamping to `[-87.33, 88.72]`. This was a correctness regression introduced with the RVV vector backend.

[PR #39478](https://github.com/vllm-project/vllm/pull/39478): Hardcoded `zvl128b` in the `-march` string caused wrong results or segfaults on VLEN=256 hardware (Spacemit X100). Fixed by VLEN-parameterized CMake dispatch.

**Open issues with correctness concerns:**

[PR #42900](https://github.com/vllm-project/vllm/pull/42900) (open, May 17, 2026): Claims 1.3-1.8x speedup for transcendental functions via ILP. Gemini Code Assist review found that the precomputed parallel power terms `r2`-`r5` are never used in the polynomial evaluation -- both `exp_ilp` and `erf_ilp` still use sequential Horner's method. The benchmark compares `torch.exp` against itself, not the new kernels. The speedup claim is unverified. [NEEDS VERIFICATION -- single source (automated code review bot, no human replication reported)]

[PR #36981](https://github.com/vllm-project/vllm/pull/36981) (open, Mar 13, 2026): Pure-Python riscv64 CPU support. Tested at approximately 0.93 tok/s for SmolLM2-135M on BananaPi F3 (SpacemiT K1). Structured output and some v1 features are not functional. Awaiting review.

---

## 12. Objections and Upstream Blockers

**1. No CI guarantees correctness between releases.**
Every RISC-V PR was merged based on manual tests performed by the PR author on private hardware. There is no automated regression detection. The exp() NaN bug (PR #40428) and the VLEN=128 detection failure on SG2044 (PR #43179) are examples of correctness regressions that went undetected until the next contributor happened to run on affected hardware. Without CI, any new PR can regress riscv64 silently.

**2. No prebuilt binaries; source build required.**
Users must build PyTorch and vLLM from source on riscv64. This is a 6-12 hour build cycle per machine. For commercial deployment this is a recurring operational cost. The sentencepiece wheel revert means LLaMA/Gemma models cannot be pip-installed without additional source builds of a C++ dependency.

**3. Single reviewer dependency.**
All RISC-V CPU backend PRs since Mar 2026 have been approved solely by bigPYJ1151 (Intel). If this reviewer becomes unavailable, new RISC-V PRs will stall. There is no second designated RISC-V reviewer in the committer list.

**4. PyTorch wheel gap is not in vLLM's control.**
The P0 blocker (no official PyPI riscv64 wheel for PyTorch) is an upstream dependency issue. vLLM cannot resolve this unilaterally. Progress on the PyTorch riscv64 wheel is tracked at [pytorch#180975](https://github.com/pytorch/pytorch/issues/180975) and [pytorch#182278](https://github.com/pytorch/pytorch/issues/182278).

**5. Feature parity gaps have no current contributors.**
FP8 KV cache is architecturally blocked (requires x86 AVX-512 or AMX). Chunked prefill is a known gap with no open PR. Multimodal models (audio/video) are disabled due to missing torchaudio/torchvision wheels. These are not temporary bugs; they require deliberate investment.

---

## 13. Investment Analysis

The following estimates are based on the effort visible in the upstream PR history and the open gap list. Effort is denominated in person-weeks (one person working full-time).

### 13.1 Functional Enablement

These items bring riscv64 to functional parity with the current arm64 CPU backend for text-only inference.

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| sentencepiece riscv64 wheel | Upstream a working riscv64 build and CI to google/sentencepiece; unblock LLaMA/Gemma pip install | 2-3 pw | Critical |
| tiktoken riscv64 wheel | Push [PR #506](https://github.com/openai/tiktoken/pull/506) to merge; unblock GPT-2/GPT-4 tokenization | 1-2 pw | Critical |
| PyTorch riscv64 PyPI wheel | Coordinate with Meta/PyTorch to complete native CI and publish wheel ([pytorch#180975](https://github.com/pytorch/pytorch/issues/180975)) | 4-8 pw | Critical (external dependency; effort is coordination + contribution, not sole ownership) |
| msgspec riscv64 wheel | Push [PR #987](https://github.com/jcrist/msgspec/pull/987) to merge; unblock API server path | 1 pw | High |
| Chunked prefill on riscv64 | Implement or port chunked prefill scheduler support; currently disabled unconditionally | 3-5 pw | High |
| riscv64 Dockerfile | Add `docker/Dockerfile.riscv64` mirroring `Dockerfile.cpu` build stages | 2-3 pw | Medium |

### 13.2 Performance Optimization

These items address known performance gaps relative to what the ISA supports.

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| ILP transcendental functions | Fix PR #42900 (broken polynomial variables, incorrect benchmark); validate 1.3-1.8x claim or establish actual speedup | 2-3 pw | High |
| BF16 VLEN=256 on Spacemit X100 | PR #45243 (open): enable native BF16 path on VLEN=256 hardware; currently uses FP32 simulation | 1-2 pw | High |
| W4A8 INT4 GEMM | PR #45269 (draft): RVV path for W4A8 INT4 GEMM | 3-5 pw | Medium |
| WNA16 micro GEMM | PR #44324 (open): RVV micro GEMM for WNA16 quantization path | 2-3 pw | Medium |
| Decode kernel optimization | Decode throughput improvement on VLEN=256 is only 1.15x vs. 3.01x for prefill; root cause is memory bandwidth saturation; investigate tiling and prefetch | 4-6 pw | Medium |

### 13.3 CI/CD Infrastructure

These items give automated correctness guarantees and are prerequisite for production confidence.

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| RISC-V CI via RISE Runners | Integrate RISE RISC-V runners (Scaleway EM-RV1) into `.github/workflows/` for build + basic inference test on each PR | 2-4 pw | Critical |
| QEMU-based cross-arch CI | Add QEMU riscv64 emulation stage to existing Buildkite or GitHub Actions for faster feedback; scalar path only | 2-3 pw | High |
| RISC-V hardware test matrix | Add SG2044 (VLEN=128) and Spacemit X100 (VLEN=256) to hardware test coverage to catch VLEN-specific regressions | 3-5 pw (infrastructure) | High |

### 13.4 Ecosystem Enablement

These items reduce the total build-from-source burden for end users.

| Work Item | Description | Effort | Priority |
|---|---|---|---|
| RISE wheel builder inclusion | Add vLLM to the RISE wheel builder package list; provides pip-installable wheels for riscv64 without PyPI | 2-3 pw | High |
| riscv64 install documentation | Write and merge an official installation guide for riscv64 in vLLM docs covering build prerequisites, compiler versions, VLEN configuration, and common failure modes | 1-2 pw | Medium |
| Second RISC-V area owner | Nominate a second reviewer to the vLLM committer list for RISC-V CPU backend changes; reduce single-reviewer dependency on bigPYJ1151 | 1 pw (nomination/onboarding) | High |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Priority |
|---|---|---|---|
| Functional | sentencepiece riscv64 wheel | 2-3 | Critical |
| Functional | tiktoken riscv64 wheel | 1-2 | Critical |
| Functional | PyTorch riscv64 PyPI wheel (coordination) | 4-8 | Critical |
| Functional | msgspec riscv64 wheel | 1 | High |
| Functional | Chunked prefill on riscv64 | 3-5 | High |
| Functional | riscv64 Dockerfile | 2-3 | Medium |
| Performance | ILP transcendental functions (fix PR #42900) | 2-3 | High |
| Performance | BF16 native on VLEN=256 (PR #45243) | 1-2 | High |
| Performance | W4A8 INT4 GEMM (PR #45269) | 3-5 | Medium |
| Performance | WNA16 micro GEMM (PR #44324) | 2-3 | Medium |
| Performance | Decode kernel bandwidth investigation | 4-6 | Medium |
| CI/CD | RISE Runners integration | 2-4 | Critical |
| CI/CD | QEMU cross-arch CI | 2-3 | High |
| CI/CD | Hardware test matrix (SG2044, X100) | 3-5 | High |
| Ecosystem | RISE wheel builder inclusion | 2-3 | High |
| Ecosystem | riscv64 install documentation | 1-2 | Medium |
| Ecosystem | Second RISC-V area owner | 1 | High |
| **Total** | | **39-63** | |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [vLLM repository](https://github.com/vllm-project/vllm)
- [Issue #8996 -- RISC-V support question (Oct 2024)](https://github.com/vllm-project/vllm/issues/8996)
- [Issue #19611 -- Feature: Add RISC-V support (Jun 2025, closed not planned)](https://github.com/vllm-project/vllm/issues/19611)
- [Issue #25737 -- RISC-V crash due to unconditional IPEX import](https://github.com/vllm-project/vllm/issues/25737)
- [PR #22112 -- Initial scalar riscv64 backend (merged Sep 25, 2025)](https://github.com/vllm-project/vllm/pull/22112)
- [PR #25816 -- CPU backend compatibility for RISC-V (merged Sep 30, 2025)](https://github.com/vllm-project/vllm/pull/25816)
- [PR #26693 -- Disable torch.compile for RISC-V (merged Oct 13, 2025)](https://github.com/vllm-project/vllm/pull/26693)
- [PR #36578 -- RISC-V CPU backend v2 (merged Mar 11, 2026)](https://github.com/vllm-project/vllm/pull/36578)
- [PR #36981 -- Pure-Python riscv64 support (open)](https://github.com/vllm-project/vllm/pull/36981)
- [PR #39478 -- Multi-VLEN RVV dispatch (merged Apr 20, 2026)](https://github.com/vllm-project/vllm/pull/39478)
- [PR #40119 -- RVV attention kernels VLEN=128 (merged May 15, 2026)](https://github.com/vllm-project/vllm/pull/40119)
- [PR #40428 -- exp() NaN clamp bugfix (merged Apr 22, 2026)](https://github.com/vllm-project/vllm/pull/40428)
- [PR #40569 -- OMP thread binding for RISC-V (merged May 6, 2026)](https://github.com/vllm-project/vllm/pull/40569)
- [PR #42730 -- WNA16 RVV vrgather helpers (merged Jun 1, 2026)](https://github.com/vllm-project/vllm/pull/42730)
- [PR #42900 -- ILP transcendental functions (open, unverified claims)](https://github.com/vllm-project/vllm/pull/42900)
- [PR #42943 -- RVV attention kernels VLEN=256 (merged May 21, 2026)](https://github.com/vllm-project/vllm/pull/42943)
- [PR #43179 -- RVV detection fix for SG2044 (merged Jun 18, 2026)](https://github.com/vllm-project/vllm/pull/43179)
- [PR #44478 -- oneDNN W8A8 INT8 on RISC-V (merged Jun 11, 2026)](https://github.com/vllm-project/vllm/pull/44478)
- [PyTorch riscv64 wheel tracking issue #180975](https://github.com/pytorch/pytorch/issues/180975)
- [sentencepiece riscv64 wheel tracking issue #1250](https://github.com/google/sentencepiece/issues/1250)
- [tiktoken riscv64 CI PR #506](https://github.com/openai/tiktoken/pull/506)
- [msgspec riscv64 CI PR #987](https://github.com/jcrist/msgspec/pull/987)
- [llvmlite riscv64 tracking issue #923](https://github.com/numba/llvmlite/issues/923)
- [RISE RISC-V Runners announcement (Mar 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project member list](https://riseproject.dev)