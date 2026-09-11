---
title: SGLang
parent: Project Reports
color: orange
dependencies:
  - name: PyTorch
    relation: runtime-dependency
    criticality: critical
  - name: CUDA
    relation: build-dependency
    criticality: critical
  - name: FlashInfer
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="sglang" %}

# SGLang

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for SGLang<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SGLang is a GPU-first LLM inference/serving engine. It is hosted under the non-profit umbrella organization LMSYS (also home to Chatbot Arena/FastChat) rather than a neutral foundation such as the Linux Foundation, and is licensed Apache 2.0, per the project's own [README](https://github.com/sgl-project/sglang) and [.github/MAINTAINER.md](https://github.com/sgl-project/sglang/blob/main/.github/MAINTAINER.md). SGLang is **not** a member of RISE (RISC-V Software Ecosystem) - checked against the [RISE Members page](https://riseproject.dev/members/), which lists Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE); SGLang appears in none of these lists. A separate web search surfaced an older/different "RISE Board of Directors" list (Samsung, Intel, Rivos, Ventana, T-Head, etc.) that could not be reconciled against the live Members page - this discrepancy is noted but does not change the conclusion that SGLang itself is not a RISE member [NEEDS VERIFICATION on the board-list discrepancy].

**Governance.** SGLang has a formal "Code Maintenance Model" (`.github/MAINTAINER.md`) with four roles: Merge Oncall, Codeowner, Write, and CI Oncall. CI Oncalls are assigned per hardware platform - NVIDIA GPUs, AMD GPUs, Intel CPU/XPU, Ascend NPUs, each with named owners who "donate machines." **No RISC-V CI Oncall role exists.** Documented first-class hardware platform guides cover NVIDIA GPUs, AMD GPUs, Ascend NPUs, generic CPU, NVIDIA Jetson Orin, TPU, Intel XPU, and Moore Threads GPUs (`docs/docs/hardware-platforms/`) - RISC-V has no page.

**Community stance on new ports.** SGLang recently formalized an out-of-tree hardware plugin system (`docs/docs/hardware-platforms/plugin.mdx`, entry-point group `sglang.srt.platforms`), explicitly described as letting "hardware vendors and developers extend SGLang without modifying the main repository code," with in-tree migration of existing backends happening "as the plugin interfaces mature." This signals the project's current expectation for a brand-new port like RISC-V is an out-of-tree plugin, not immediate in-tree support with dedicated CI.

**Corporate presence** is visible only indirectly, through hardware-vendor-aligned maintainer role assignments in `MAINTAINER.md`/`CODEOWNERS` (AMD, Ascend/Huawei, Intel, Moore Threads) - no public sponsor list exists; the sponsorship contact is `sglang@lmsys.org`.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-01-14 | Issue #2883 "Support RISC-V" opened and closed same day, one-line inquiry, no follow-up | [sgl-project/sglang#2883](https://github.com/sgl-project/sglang/issues/2883) |
| 2025-06-27 to 2025-09-09 | Issue #7582, an automated third-party "RAX" tool report rating SGLang "low" RISC-V porting complexity; closed inactive, no maintainer engagement | [sgl-project/sglang#7582](https://github.com/sgl-project/sglang/issues/7582) |
| 2026-02-01 | Master tracking issue #18072 opened by ChenTim1011 (NTHU Programming Language Lab, with Andes Technology), proposing an RVV 1.0 attention backend, 3-phase 2026 Q1 plan | [sgl-project/sglang#18072](https://github.com/sgl-project/sglang/issues/18072) |
| 2026-04-06 | PR #22193 opened (Phase 1: RVV kernels in sgl-kernel) | [sgl-project/sglang#22193](https://github.com/sgl-project/sglang/pull/22193) |
| 2026-04-07 | PR #22219 opened (Phase 2: Python/backend integration) and PR #22220 opened (Phase 3: Dockerfile/docs) | [sgl-project/sglang#22219](https://github.com/sgl-project/sglang/pull/22219), [sgl-project/sglang#22220](https://github.com/sgl-project/sglang/pull/22220) |
| 2026-05-31, 2026-06-24 | ChenTim1011 posts self-authored Q2 and Q3-Q4 roadmap updates on #18072 (quantized KV cache, torch.compile CPU-graph support, INT4 exploration, multi-VLEN validation) - no external maintainer discussion | [sgl-project/sglang#18072](https://github.com/sgl-project/sglang/issues/18072) |
| 2026-08-09 | Last update on all three PRs; CI still failing on #22193 and #22219; none merged | [#22193](https://github.com/sgl-project/sglang/pull/22193), [#22219](https://github.com/sgl-project/sglang/pull/22219), [#22220](https://github.com/sgl-project/sglang/pull/22220) |
| 2026-09-11 | Verification confirms all three PRs still OPEN, `merged_at: null` on each | Live PR-status check performed during this research |

**Key contributor:** ChenTim1011 (NTHU Programming Language Lab, in collaboration with Andes Technology) is the sole author of all RISC-V work in the repository. No other individual or organization has contributed RISC-V code to SGLang.

**Is it fully upstream?** No. All RISC-V work lives in three open, unmerged pull requests and one tracking issue. Nothing has landed on the default branch or in any tagged release. A GitHub code-search control query (`riscv` against `sgl-project/sglang`) returns `total_count: 0`, independently confirming zero riscv references anywhere in the merged codebase.

## 3. Upstream Support Tier

SGLang has no formal, published architecture-tier policy document. Its de facto tiering is expressed through `.github/MAINTAINER.md`'s CI-Oncall-per-platform model and its documented hardware-platform guides.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI workflow | Yes (default/primary target; most workflows assume x86_64) | Yes, `pr-test-arm64.yml` | None |
| Tests run in CI | Yes | Yes | No CI exists; 63 unit + 14 integration tests run manually on physical SpacemiT K1 hardware, not in CI |
| Official release artifact | Yes, PyPI wheels (`manylinux_2_34`, x86_64) | Yes, PyPI wheels (`manylinux_2_34`, aarch64), since v0.5.11 | None - no PyPI wheel, no GitHub release asset, no Docker image published by upstream |
| CI Oncall named in MAINTAINER.md | Yes (NVIDIA/AMD/Intel CI oncalls cover x86_64) | Not explicitly named, but arm64 CI exists | None |
| Docs hardware-platform page | Yes | Implicit (covered generically) | None (`docs/docs/hardware-platforms/rvv.md` exists only inside unmerged PR #22220, not on the docs site) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The unmerged PR set (#22193) adds hand-written RVV 1.0 C++ intrinsic kernels under `sgl-kernel/csrc/cpu/riscv64/` (reconciled against the deep source-level verification pass): `vector_helpers.h`, `vector_math.h` (polynomial exp/tanh/erf with LMUL=1/2/4/8 specializations), `decode.cpp` (1432 lines, 78 intrinsic call sites), `extend.cpp` (568 lines, 68 sites), `gemm.cpp`/`gemm_int8.cpp` (639/673 lines, 94/59 sites), `norm.cpp` (602 lines, 71 sites), `activation.cpp` (179 lines, 39 sites), `rope.cpp` (388 lines, 39 sites), and `torch_extension_riscv64.cpp` (op registration). No TODO/FIXME/placeholder markers exist in these files; the sampled code (tiled/prefetched GEMM microkernels, FMA-chain polynomial approximations) is genuine hand-tuned RVV engineering, not a scalar-C stand-in.

**Op-count comparison (proof of partial, not full, coverage):** `torch_extension_riscv64.cpp` registers 20 ops; the shared x86_64 `torch_extension_cpu.cpp` registers 72. Missing on riscv64: `topk_softmax_cpu`/`topk_sigmoid_cpu` (MoE routing), `int4_scaled_mm_cpu`, `mxfp4_scaled_mm_cpu`, `shm_allreduce`/`shm_allgather*` (tensor-parallel comms), `fused_gdn_gating_cpu` (gated linear attention, e.g. Qwen3-Next), `causal_conv1d_weight_pack` (Mamba/SSM), `conv3d_embed_cpu` (multimodal), `bmm_cpu`. This matches what the PR's own `rvv_backend.py` docstring discloses: no MoE, no Flash Attention, no INT4, no shared memory, no `torch.compile`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Attention (decode/extend) | Multiple hand-tuned CUDA/CPU backends (FlashInfer, native) | Shared templated `vec.h` CPU path plus arm64-specific overrides | Hand-tuned RVV intrinsics, full coverage of decode/extend, unmerged |
| GEMM / quantized GEMM | CUDA kernels (sgl-kernel, cutlass, FlashInfer) | Shared `vec.h` path + arm64-specific `gemm_int8.cpp` override | Hand-tuned RVV GEMM/INT8 GEMM, unmerged |
| Norm / Activation / RoPE | CUDA + CPU shared path | Shared generic path | Hand-tuned RVV, unmerged |
| MoE routing / INT4 / mxfp4 quant | Implemented (CUDA) | Implemented via shared path | Not implemented at all, in-PR or otherwise |
| SHM tensor-parallel collectives | Implemented | arm64-specific `shm.h` override (127 lines) | Not implemented |
| SSM/Mamba conv, multimodal conv3d | Implemented | Implemented via shared path | Not implemented |
| Build-system integration | Native (top-level `csrc/cpu/CMakeLists.txt` dispatches `x86_64\|aarch64\|ppc64`) | Native, shares 4 overrides (`gemm_int8.cpp`, `moe.cpp`, `op.h`, `shm.h`) with the generic dispatch | **Not integrated** - top-level CMake was not touched by the RVV PR; riscv64 ships as a fully separate standalone CMake project (`riscv64/CMakeLists.txt`, own `project(sgl_kernel)`) selected via a swapped `pyproject_riscv64.toml`, usable only through the PR's dedicated `docker/rvv.Dockerfile` |

**Structural pattern:** arm64 shares the generic templated `vec.h` dispatch and overrides only 4 files; riscv64 fully reimplements every kernel standalone (12 files, 6120 lines total) because RVV's intrinsic API is incompatible with the SSE/NEON-oriented `vec.h` template - a heavier but self-contained approach.

## 5. Build System, Cross-Compilation, and Toolchain

**No riscv64 build documentation or toolchain integration exists on the default branch.** An exhaustive search of the repository (default branch HEAD `165d8dd17736fa4938f2e73018f26835cd6e0778`) found zero riscv references in `README.md`, no `BUILDING.md`/`INSTALL`/`docs/building.md`/`docs/cross-compilation.md` (none of these files exist), zero matches for "riscv" in any `CMakeLists.txt`, no `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake`, and no riscv64 Dockerfile among the existing `docker/` variants (`xpu.Dockerfile`, `arm64.Dockerfile`, `rocm.Dockerfile`, `sagemaker.Dockerfile`, `npu.Dockerfile`, `xeon.Dockerfile`, `musa.Dockerfile`, etc.). The CPU kernel's `python/sglang/kernels/aot/csrc/cpu/CMakeLists.txt` hard-codes `set(ARCH_DIRS "x86_64|aarch64|ppc64")` - riscv64 is not a recognized `CMAKE_SYSTEM_PROCESSOR` value anywhere in the merged build system and would fall through unhandled.

What exists only in the unmerged PR set: `docker/rvv.Dockerfile` (PR #22220) is a multi-stage build for `linux/riscv64` on `python:3.13-slim`, using SpacemiT-provided wheels for PyTorch 2.8.0, Torchvision, Triton, PyArrow, xgrammar, and vLLM; it installs **Clang 19 + LLD** (kernels are gated behind `CPU_CAPABILITY_RVV` and require Clang 19+), builds `sgl-kernel` from `csrc/cpu/riscv64` using a separate `sgl-kernel/pyproject_riscv64.toml` (package name `sglang-kernel-riscv64`, `cmake.source-dir = "csrc/cpu/riscv64"`), and does an editable SGLang install. `docs/platforms/rvv.md` (also unmerged) documents the build/iteration flow, launch commands for BF16/W8A8 backends, benchmarking commands, and a troubleshooting section covering compiler-version requirements, memory/segfault issues, `PYTHONPATH` resolution, and a `torch.ops hasattr` pitfall.

**Bottom line:** a user cannot `pip install sgl-kernel` or SGLang on a riscv64 host today via any documented, merged path. The only route is checking out the unmerged PR branches and manually building the Docker image they define. **No CI validates this path** - all evidence of it working comes from the PR author's manual testing on physical SpacemiT K1 hardware.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 (if PRs were merged) |
|---|---|---|---|
| Dense attention (decode/extend) | Yes | Yes | Yes (RVV, unmerged) |
| MoE routing | Yes | Yes | **No** |
| Flash Attention | Yes | Partial/native fallback | **No** (explicitly disclosed as unsupported) |
| INT4 / mxfp4 quantization | Yes | Yes | **No** |
| Shared-memory tensor-parallel collectives | Yes | Yes | **No** |
| `torch.compile` / graph mode | Yes | Yes | **No** |
| SSM/Mamba, multimodal conv3d | Yes | Yes | **No** |
| GPU (CUDA) serving path at all | Yes | N/A (arm64 CPU/GPU as applicable) | **Structurally impossible today** - FlashInfer and all sgl-kernel/sgl-deep-ep/sgl-deep-gemm CUDA packages have zero riscv64 support, blocked by immature host-only CUDA-for-RISC-V with "no timeline" and a requirement for not-yet-existing RVA23 server-class RISC-V CPUs |

**Performance gap:** Not directly quantifiable against amd64/arm64 production numbers because no comparable serving benchmark exists; the only figures available are internal RVV-vs-PyTorch-CPU-fallback comparisons from the PR itself (see Section 11).

**Security hardening gaps:** Data not available: no source discusses RISC-V-specific security hardening (ASLR, stack protection, CFI) for SGLang's riscv64 path; this was not part of the research scope.

**NaN / floating-point semantics issues:** No dedicated NaN/floating-point correctness bug for SGLang on RISC-V exists. Targeted searches for `riscv nan floating`, `riscv precision accuracy floating point`, and `"SGLang" "RISC-V" NaN bug` returned only false-positive semantic matches (unrelated GCC/Valgrind RISC-V NaN bugs, unrelated SGLang NVFP4/Blackwell NaN bugs on NVIDIA GPUs).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed independently by two separate methods that agree: (1) a full clone-based case-insensitive grep across the entire repository tree and separately restricted to `.github/workflows/` (104 workflow files) for `riscv`, `riscv64`, `RISCV`, `RISC-V` returned zero matches anywhere, and no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at the repo root; (2) GitHub's live code-search index queried directly for `riscv`, `riscv64`, `"risc-v"` against `sgl-project/sglang`'s default branch returned `total_count: 0` for all three, while a control query for `arm64` against the same repo correctly returned 12 real hits (`pr-test-arm64.yml`, `_docker-build-and-publish.yml`, `release-docker-*.yml`), proving the null result is not a tooling failure. A further control search scoped to `org:sgl-project` (all repos) did surface `riscv64` - but only in `sgl-project/sglang-omni` (unrelated test parametrization) and `sgl-project/SpecForge` (an incidental `package-lock.json` string), confirming the term genuinely does not appear in `sgl-project/sglang` itself.

Architecture-related CI that does exist, for context (none of it is riscv64): `pr-test-arm64.yml` (ARM64), `pr-test-xpu.yml`/`release-whl-kernel-xpu.yml`/`release-docker-intel-xpu*.yml` (Intel XPU), `pr-test-musa.yml`/`nightly-test-musa.yml` (Moore Threads MUSA), `pr-test-amd*.yml`/`nightly-test-amd*.yml`/`release-docker-amd*.yml` (AMD ROCm), `pr-test-npu.yml`/`nightly-test-npu*.yml`/`full-test-npu.yml`/`release-docker-npu*.yml` (Ascend NPU), `pr-test-xeon.yml`/`release-docker-xeon.yml` (Intel Xeon), `pr-test-mlx.yml` (Apple MLX).

The three unmerged RISC-V PRs all show **failing CI** (base and extra checks, generic exit-code-1) explicitly because no riscv64 CI runner exists on the project's infrastructure; PR #22193's body states plainly: "There is currently no RISC-V CI runner available for this PR." All correctness evidence (63 unit tests + 14 integration tests, GSM8K accuracy runs) was gathered manually by the PR author on physical SpacemiT K1 hardware, not through any automated CI system.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI workflow exists | Yes | Yes (`pr-test-arm64.yml`) | No |
| Runner type | Self-hosted GPU / ubuntu-latest | Self-hosted arm64 | None - no RISE runner reference found, no QEMU riscv64 emulation step anywhere |
| Tests execute in CI | Yes | Yes | No - manual only, on physical SpacemiT K1 hardware, outside CI |
| RISE runner usage | N/A | Data not available: not evidenced | Not evidenced for SGLang specifically; RISE's own `python-wheels`/`wheel_builder` CI is used for SGLang's *dependency* wheel builds (see Section 9), not for SGLang's own RVV kernel CI |

## 8. Distribution and Release Status

**No official riscv64 binary exists for SGLang through any channel checked.**

- **PyPI** (`https://pypi.org/pypi/sglang/json`): latest version 0.5.19; 300+ files across versions 0.1.3 to 0.5.19. Pure-Python wheels (`py3-none-any`) through 0.5.10.post2; from 0.5.11 onward, platform-specific wheels tagged `manylinux_2_34` for **x86_64 and aarch64 only**. No filename contains "riscv" or "riscv64" anywhere in the version history.
- **RISE wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/sglang/`): returns HTTP 302, redirecting straight to standard PyPI - no independent riscv64 build hosted there.
- **Ubuntu 26.04 (resolute)**: `https://packages.ubuntu.com/search?keywords=SGLang&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results." No `sglang`, `python3-sglang`, or `libsglang` package exists in Ubuntu at all, for **any** architecture, let alone riscv64.
- **Arch Linux RISC-V port** (`archriscv.felixc.at/?q=sglang`): no listing found.
- **GitHub Releases**: recent tags (v0.5.19, v0.5.18, v0.5.17, v0.5.16, v0.5.15.post1, v0.5.15, v0.5.14, v0.5.13, v0.5.12.post1, v0.5.12) carry only auto-generated "Source code (zip/tar.gz)" assets - no uploaded binary/wheel/Docker assets at all. Asset-list enumeration on the three most recent releases was not fully completable in this session (JS-load failure on the releases page plus a 403 from the unauthenticated GitHub API), but this does not shift the verdict since SGLang's release assets are known (from the pattern above) to be Python wheels already ruled out via PyPI - there is no plausible pathway for a riscv64 binary to appear only in Releases and nowhere else.
- **Docker**: `docker/rvv.Dockerfile` exists only inside unmerged PR #22220; no `linux/riscv64` image is published by upstream today.

**What a user must do to get a working binary today:** there is none from upstream. The only path is to check out PR branches #22193 + #22219 + #22220 together (they are interdependent), build the standalone riscv64 CMake target with Clang 19+, and build the Docker image PR #22220 defines - all manually, with no upstream guarantee of correctness since no CI validates any of it.

## 9. Dependencies

| Dependency | Role in SGLang | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| **PyTorch** (runtime-dependency, critical; hard-pinned `torch==2.13.0`) | Core tensor runtime, autograd, torch.compile JIT | Builds natively via RISE CI (Scaleway EM-RV1); Tier 3 upstream; no oneDNN/quantization (FBGEMM/QNNPACK) as of Aug 2026, OpenBLAS used instead | 99.998% of enabled tests pass on native riscv64 hardware (RISE, Aug 2026) | No official PyPI riscv64 wheel - only via RISE's own package index | [pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975) (master tracking; torch.compile/Triton backend unstarted phases 3-4), [#141550](https://github.com/pytorch/pytorch/issues/141550), [#99278](https://github.com/pytorch/pytorch/issues/99278) |
| **CUDA** (build-dependency, critical) | NVIDIA GPU compute toolchain underlying FlashInfer, sgl-kernel CUDA ops, and SGLang's primary GPU serving mode | No riscv64 target exists | N/A | N/A | Structurally blocked: NVIDIA's CUDA-for-RISC-V is host-side only (RISC-V CPU driving a PCIe GPU), announced with "no timeline," and requires not-yet-existing RVA23 server-class RISC-V CPUs |
| **FlashInfer** (runtime-dependency, critical; hard-pinned `flashinfer_python[cu13]==0.6.18`) | CUDA-JIT attention/GEMM kernels, core GPU inference path | CUDA-only; no CPU/riscv64 path exists at all | N/A | N/A | Zero riscv64 GitHub activity found; blocked by the same CUDA-for-RISC-V immaturity as above |
| **LLVM** (build-dependency, critical) | Compiler backend required for numba's JIT (via llvmlite) and, separately, the RVV kernels' Clang 19+ toolchain requirement | LLVM itself builds on riscv64, but numba's use of it via llvmlite is confirmed broken (see below) | N/A (mixed - depends on consumer) | Distro-dependent, not centrally tracked here | See numba entry below for the concrete failure |
| **Docker** (build-dependency, optional) | Packaging/deployment of the unmerged RVV backend (PR #22220's `docker/rvv.Dockerfile`) | Docker itself is architecture-neutral tooling; the `linux/riscv64` target image it would build is only defined in an unmerged PR, not published upstream | N/A | No upstream-published riscv64 image | N/A |
| **Triton** (transitive, via torch.compile/Inductor and FlashInfer JIT) | GPU-kernel JIT DSL | No riscv64 backend exists, in-tree or out-of-tree; `triton-cpu` fork has only scattered, unaffiliated personal riscv64 experiments, no upstream PR | None credible | None | No tracked upstream issue; PyTorch's own #180975 lists Triton integration as not-yet-started |
| **numba** (hard-pinned `numba==0.65.1`, direct import in `python/sglang/srt/multimodal/inkling/image_processing.py`) | LLVM JIT compiler for multimodal image-preprocessing hot path | **Broken**: llvmlite's native JIT crashes with `LLVM ERROR: Unsupported code model for lowering` | Fails before test execution (crash on JIT invocation) | No PyPI riscv64 wheel | [numba/numba#6559](https://github.com/numba/numba/issues/6559) (open since 2020, unfixed) -> [llvmlite#923](https://github.com/numba/llvmlite/issues/923) (root cause, unfixed) -> [numba#10389](https://github.com/numba/numba/issues/10389) (2025 duplicate, closed with no fix). **Concrete, currently-active blocker.** |
| **NumPy** (transitive, unpinned) | Numerics substrate | Native riscv64 CI added May 2026 (Tier 3 per NEP 57) | Passing overall; known FP-exception test failures | No official PyPI riscv64 wheel yet | [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216) (wheel tracking, open), [#32461](https://github.com/numpy/numpy/issues/32461), [#32376](https://github.com/numpy/numpy/issues/32376), [#26200](https://github.com/numpy/numpy/issues/26200) (RVV support, open) |
| **SciPy** (transitive, unpinned) | Scientific numerics | Cross-compile possible; native CI still requested | Hanging tests under QEMU; `sph_harm` failure | No riscv64 wheels found | [scipy/scipy#19378](https://github.com/scipy/scipy/issues/19378) (cross-compile, open), [#22839](https://github.com/scipy/scipy/issues/22839) (open), [#22753](https://github.com/scipy/scipy/issues/22753) (open) |
| **sgl-kernel / sgl-deep-ep / sgl-deep-gemm / flash-attn-4 / tilelang / humming-kernels / quack-kernels / nvidia-cutlass-dsl / nvshmem4py-cu13** (all hard-pinned) | SGLang's/NVIDIA's own CUDA GEMM, MoE-dispatch, memory-allocator kernels | CUDA-only, no riscv64 target for any of them | N/A | N/A | Same structural CUDA-for-RISC-V blocker as FlashInfer; none tracked upstream for riscv64 |
| **zstandard** (compression, weight/KV payloads) | Compression | Core library builds on riscv64 (portable C); no RVV-optimized path yet | Not itemized | The `zstd` PyPI binding has no riscv64 wheel (distinct from `pyzstd`, which RISE does build) | [facebook/zstd#4471](https://github.com/facebook/zstd/issues/4471) (RVV for XXH3, open), [#4546](https://github.com/facebook/zstd/issues/4546) (unaligned access, open) |
| **xxhash** (hashing; also `xxhash-rust` in the Rust gateway) | Radix-tree cache keys, request dedup | Full support | Passing | PyPI ships native riscv64 wheels since v4.0.1; Ubuntu ships `libxxhash0` for riscv64 | None material - best-supported dependency found |
| **tokenizers** (hard-pinned `tokenizers==0.22.2`) | Fast Rust tokenization | Fully upstreamed | Passing (no dedicated riscv64 CI gate, no known failures) | GA riscv64 wheel shipped on PyPI as of v0.23.1 (Apr 2026) - but SGLang's pin (0.22.2) predates that release, forcing a from-source build on riscv64 | None upstream |
| **sentencepiece** (transitive, unpinned) | C++ tokenizer | Source build works | Not itemized | riscv64 wheel was merged then reverted ([google/sentencepiece#1196](https://github.com/google/sentencepiece/pull/1196) -> reverted [#1226](https://github.com/google/sentencepiece/pull/1226)); ships no riscv64 wheel today | [google/sentencepiece#1250](https://github.com/google/sentencepiece/issues/1250) (open, maintainer unresponsive) |
| **OpenSSL** (crypto; `sgl-model-gateway`'s optional `vendored-openssl` feature) | TLS/crypto | Builds and runs; active RISC-V SHA256 perf work upstream | riscv64 CI occasionally flaky | Debian ships riscv64 `.deb`s (3.6.3-1 sid, 3.5.6 trixie-security) | [openssl/openssl#30880](https://github.com/openssl/openssl/issues/30880) (open); no FIPS-validated riscv64 build; [#28118](https://github.com/openssl/openssl/issues/28118) (musl extension detection, open) |
| **Wasmtime/Cranelift** (`sgl-model-gateway`'s `smg-wasm` plugin runtime) | WASM middleware execution | Upstream builds/releases riscv64gc artifacts in normal CI | Passing in CI | Released as part of the normal pipeline, but formally Tier 3 (no dedicated maintainer, no continuous fuzzing) | Several open Cranelift riscv64-backend bugs: [bytecodealliance/wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) |
| **rustls (`ring` backend)** (`sgl-model-gateway` TLS) | TLS | Not verified this session (GitHub API rate limit hit before this query could run) [NEEDS VERIFICATION] | Not verified | Not verified | Flagged risk: the `ring` crate has historically had incomplete riscv64 assembly-optimized crypto paths [NEEDS VERIFICATION] |
| **libzmq / pyzmq** (`pyzmq>=25.1.2`) | SGLang's internal IPC transport (tokenizer to scheduler to detokenizer) | Portable C++, no riscv64-blocking issues found | Not itemized | Ubuntu ships `libzmq5` for riscv64 [NEEDS VERIFICATION - stated as "per general package knowledge, not graph-verified" in source research] | Only one, unrelated, old closed issue found ([zeromq/libzmq#2021](https://github.com/zeromq/libzmq/issues/2021), sparc32) |

**Recursion limitation:** the `project-graph` MCP server failed to connect for the entirety of this research (`CONNECTION_CLOSED`), so the mandated SPARQL cross-check against the Ubuntu 26.04 riscv64 package index could not be run for any dependency. Every "riscv64 release" cell above that lacks a direct `packages.ubuntu.com` citation should be treated as unverified against that specific index; this is a tooling gap, not evidence of absence, and several findings are independently corroborated via direct `packages.ubuntu.com` fetches noted inline.

**Overall picture:** (1) the GPU inference path is a structural, not merely a porting, blocker - FlashInfer, sgl-kernel, and the CUDA toolchain packages are CUDA-only and CUDA-for-RISC-V is immature with no timeline; (2) numba is a concrete, present-day, CPU-only blocker with an unfixed upstream bug since 2020; (3) Triton has no riscv64 support anywhere; (4) PyTorch runs on riscv64 but only in eager CPU mode via RISE's own index, not official PyPI; (5) supporting infrastructure (compression/hash/tokenizer/crypto/WASM) is a mixed bag - xxHash and tokenizers are effectively solved, zstd's Python binding and sentencepiece's wheel are missing/regressed, OpenSSL and Wasmtime build and run but are formally Tier-3 unmaintained there.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#18072](https://github.com/sgl-project/sglang/issues/18072) | [Feature] Adding RISC-V Vector Extension (RVV) Attention Backend for SGLang | Open | Tracking (not a bug) | Master roadmap issue; only comments are author's own progress updates, no external maintainer discussion |
| [#22193](https://github.com/sgl-project/sglang/pull/22193) | [Feature] Add RVV kernels in sgl-kernel (Phase 1) | Open, unmerged | High (feature-blocking) | CI fails ("no RISC-V CI runner available"); Gemini code-assist review flagged null pointer dereferences in scratch-buffer handling, missing macro guards for FP16 vector intrinsics, and an incorrect Torch library schema for in-place tensor modification - appears addressed across commits 9-13 but no human maintainer sign-off recorded |
| [#22219](https://github.com/sgl-project/sglang/pull/22219) | RVV Attention Backend for SGLang (Phase 2) | Open, unmerged | High (feature-blocking) | CI fails on both Base and Extra checks; automated Gemini review hit its daily quota limit and produced no substantive feedback; zero approvals from the large code-owner set requested |
| [#22220](https://github.com/sgl-project/sglang/pull/22220) | [RVV][Dockerfile] Add RVV Dockerfile, build config, and platform documentation (Phase 3) | Open, unmerged | Medium (packaging/docs) | CI fails on both Base and Extra checks; same Gemini quota-limit non-review; zero approvals |
| [#7582](https://github.com/sgl-project/sglang/issues/7582) | Assessment of the difficulty in porting CPU architecture for sglang | Closed, inactive | Low | Automated "RAX" tool report (cyclomatic complexity 24117, rated "low" complexity), no maintainer engagement, unrelated to the 2026 RVV effort |
| [#2883](https://github.com/sgl-project/sglang/issues/2883) | Support RISC-V | Closed, completed/superseded | Low | One-line inquiry, closed same day, predates the 2026 effort |

**Correctness bugs specifically:** the three code-review findings on PR #22193 (null pointer dereferences, missing FP16 macro guards, incorrect Torch schema) are the only concrete correctness issues documented, and they come from an automated bot (Gemini code-assist), not a human reviewer. No dedicated NaN/floating-point-precision bug ticket exists for SGLang on RISC-V (see Section 6). Functional limitations are self-disclosed by the author in PR #22219 rather than filed as bugs: no MoE, no Flash Attention, no INT4, no shared memory, no torch.compile; prefill cross-attention falls back to PyTorch native (not RVV-accelerated) when RVV kernels are unavailable.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer has posted a substantive review comment (approving, requesting changes, or objecting) on any of the three PRs. The only "review" activity is an automated code-assist bot, which either flagged fixable issues (on #22193) or hit its usage quota and produced no output (on #22219, #22220).

**Technical blockers:**
- No riscv64 CI runner exists in SGLang's infrastructure, so the PRs cannot pass the project's normal merge gate (`pr-gate`/`pr-test-finish`) regardless of code correctness.
- The RVV kernel path is architecturally bolted on (a fully separate standalone CMake project) rather than integrated into the shared `x86_64|aarch64|ppc64` dispatch, which is itself a merge-readiness concern independent of code quality.
- Feature coverage gaps (no MoE, no INT4, no SHM collectives, no torch.compile) mean even a merged version would not offer parity with amd64/arm64 CPU paths.
- The GPU serving path - SGLang's primary value proposition - is structurally blocked by immature CUDA-for-RISC-V, independent of anything this PR set can fix.

**Organizational blockers:**
- No RISC-V CI Oncall role exists in `.github/MAINTAINER.md`; nobody is designated to own riscv64 hardware/CI even if the PRs were merged.
- SGLang's own stated preference for new hardware platforms is now the out-of-tree plugin system, not immediate in-tree merges - this may itself be a soft objection to merging a new architecture directly into the core CMake/dispatch system.
- RISE (the most plausible institutional sponsor for this kind of enablement work) treats SGLang's dependency-chain porting as "parked - buildable but not installable" internally (see Section 14), and has not engaged with the RVV kernel PRs themselves.

**Acceptance probability:** Low to moderate in the near term. The code quality is genuine (hand-tuned RVV kernels, not a stub) and the author has been persistently maintaining and expanding the roadmap since February 2026, but three structural gates remain unaddressed as of the last update (2026-08-09): no CI runner, no human maintainer review, and no build-system integration. Data not available: no public maintainer statement on merge intent or timeline was found in any source.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, and no upstream or distribution riscv64 release exists through any channel checked)
- **Release provider:** none - no party (upstream, RISE, a distro, or a third party) currently publishes a consumable riscv64 release of SGLang. RISE publishes riscv64 wheels for SGLang's *dependency* PyTorch, but not for SGLang itself, and its own internal porting notes mark SGLang as "parked."
- **Optimization level:** partial. The unmerged RVV kernel set is genuine hand-tuned RVV 1.0 code (not scalar fallback) covering the core inference hot paths - attention (decode/extend), GEMM/INT8 GEMM, norm, activation, RoPE - matching the "partial" bar of covering the operations that define the project's differentiating value. However, it is missing MoE routing, INT4/mxfp4 quantization, SHM tensor-parallel collectives, and SSM/Mamba/multimodal conv ops (20 of 72 CPU ops registered), and - critically - none of this code has merged; it exists only in three open PRs, not in the default branch or any release. ISA extension in use: RVV 1.0 (VLEN=256, targeting the SpacemiT K1). Zvfh (FP16 vector extension) support is incomplete per the code-review findings on #22193.
- **Justification:** SGLang has no upstream riscv64 CI of any kind - confirmed by both a full repository grep (0 matches across 104 workflow files and the entire tree) and an independent GitHub code-search index query (`total_count: 0`, validated against a working control query) - and no distribution ships an SGLang package for any architecture at all, so the distribution floor does not apply ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=SGLang&suite=resolute&searchon=names&section=all) returns no results). Per the color model's Step 1 CI table, "no upstream CI" maps directly to orange, and with no distribution package to apply a floor, red is excluded because there is no evidence of confirmed breakage - the RVV port that does exist works when built manually. The Step 2 optimization modifier (partial coverage, capped at blue) cannot raise the Step 1 primary grade, since the cap only ever lowers a color, never raises one - the primary orange grade from Section 7's CI evidence stands. Primary sources: [sgl-project/sglang PR #22193](https://github.com/sgl-project/sglang/pull/22193), [PR #22219](https://github.com/sgl-project/sglang/pull/22219), [PR #22220](https://github.com/sgl-project/sglang/pull/22220), [tracking issue #18072](https://github.com/sgl-project/sglang/issues/18072).
- **Pending work that could change the grade:** merging PRs #22193, #22219, #22220 (interdependent - none is useful alone) would not by itself change the color, since no riscv64 CI would exist even post-merge; RISE or SGLang would additionally need to stand up a riscv64 CI runner and get it wired into `.github/workflows/` for the grade to move to yellow (build-only) or higher. RISE's two open tracking issues, [riseproject-dev/python-wheels#70](https://github.com/riseproject-dev/python-wheels/issues/70) ("SGLang riscv64 support") and [riseproject-dev/language-runtimes-wg#41](https://github.com/riseproject-dev/language-runtimes-wg/issues/41) ("Build SGLang dependencies"), address the ~300-package dependency chain rather than the RVV kernel PRs themselves, and internal RISE notes mark SGLang's disposition as "parked" pending resolution of the numba and CUDA/FlashInfer blockers.

## 14. Investment Analysis

RISE's already-funded work covers SGLang's Python **dependency chain** (PyTorch riscv64 wheels via RISE's own index, xxHash, tokenizers, partial NumPy/SciPy CI) through [riseproject-dev/python-wheels#70](https://github.com/riseproject-dev/python-wheels/issues/70) and [riseproject-dev/language-runtimes-wg#41](https://github.com/riseproject-dev/language-runtimes-wg/issues/41). It does **not** cover the RVV kernel port itself (#22193/#22219/#22220), which is entirely the work of an unaffiliated external contributor (ChenTim1011, NTHU PL Lab + Andes Technology) with no evidenced RISE funding or involvement. The investment items below therefore exclude dependency-wheel work already tracked by RISE and focus on what remains.

### 14.1 Functional Enablement
- Get a human maintainer to review and merge PRs #22193, #22219, #22220 as a set (they are interdependent).
- Resolve the numba blocker ([numba/numba#6559](https://github.com/numba/numba/issues/6559)/[llvmlite#923](https://github.com/numba/llvmlite/issues/923)) or remove/replace the direct `numba.njit` dependency in SGLang's multimodal image-preprocessing path so the CPU-only riscv64 path does not crash.
- Integrate the standalone riscv64 CMake project into the shared `csrc/cpu/CMakeLists.txt` arch dispatch (`x86_64|aarch64|ppc64` -> add riscv64) so `pip install sgl-kernel` works natively without a Dockerfile pyproject-swap.

### 14.2 Performance Optimization
- Close the op-coverage gap (20 of 72 CPU ops): MoE routing, INT4/mxfp4 quantization, SHM collectives, SSM/Mamba conv, multimodal conv3d.
- Complete Zvfh (FP16 vector extension) macro-guard coverage flagged in the #22193 code review.
- Extend the RVV backend to `torch.compile`/graph-mode support (explicitly out of scope in the current PRs).

### 14.3 CI/CD Infrastructure
- Stand up a dedicated riscv64 CI runner (RISE hardware, or a donated SpacemiT K1/other RVV 1.0 board, following the same "donate machines" CI-Oncall pattern used for AMD/Intel/Ascend) and wire it into `.github/workflows/`.
- Designate a RISC-V CI Oncall in `.github/MAINTAINER.md`, matching the existing per-hardware-platform ownership model.

### 14.4 Ecosystem Enablement
Not applicable as a distinct section per the report's scope rules (SGLang is a standalone serving engine, not a package ecosystem with many dependent packages that themselves need riscv64 enablement) - see Section 9 for the dependency-level picture instead. Note however that the GPU serving path remains structurally blocked regardless of any SGLang-side work, pending CUDA-for-RISC-V maturity - this is outside SGLang's or RISE's control.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and merge PRs #22193/#22219/#22220 as a maintainer-approved set | Data not available: no estimate found in sources; depends entirely on SGLang maintainer bandwidth, not engineering effort | SGLang maintainers (external to this analysis) | Critical |
| Functional | Fix or route around the numba riscv64 JIT crash blocking multimodal preprocessing | Data not available: depends on upstream numba/llvmlite fix timeline, which has been open since 2020 | numba/llvmlite upstream, or SGLang (route around numba) | Critical |
| Functional | Integrate riscv64 into the shared `csrc/cpu/CMakeLists.txt` arch dispatch | Data not available: no estimate found in sources | SGLang / port author | High |
| Performance | Close MoE/INT4/SHM/SSM op-coverage gap | Data not available: no estimate found in sources | Port author (ChenTim1011/Andes) or SGLang kernel maintainers | Medium |
| CI/CD | Stand up dedicated riscv64 CI runner and wire into `.github/workflows/` | Data not available: no estimate found in sources | RISE (hardware donation) + SGLang CI Oncall | High |
| Structural | Track CUDA-for-RISC-V maturity for the GPU serving path (external dependency, not directly actionable) | N/A - no SGLang-side work item exists | N/A | Monitor only |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [SGLang GitHub repository](https://github.com/sgl-project/sglang)
- [SGLang homepage redirect](https://sgl-project.github.io/)
- [SGLang docs site](https://docs.sglang.io/)
- [Issue #2883 - "Support RISC-V"](https://github.com/sgl-project/sglang/issues/2883)
- [Issue #7582 - "Assessment of the difficulty in porting CPU architecture for sglang"](https://github.com/sgl-project/sglang/issues/7582)
- [Issue #18072 - master RISC-V tracking issue](https://github.com/sgl-project/sglang/issues/18072)
- [PR #22193 - RVV kernels in sgl-kernel (Phase 1)](https://github.com/sgl-project/sglang/pull/22193)
- [PR #22219 - RVV Attention Backend Python integration (Phase 2)](https://github.com/sgl-project/sglang/pull/22219)
- [PR #22220 - RVV Dockerfile, build config, and platform documentation (Phase 3)](https://github.com/sgl-project/sglang/pull/22220)
- [Issue #3769 - "sgl-kernel for aarch64" (false-positive, not RISC-V)](https://github.com/sgl-project/sglang/issues/3769)
- [.github/MAINTAINER.md](https://github.com/sgl-project/sglang/blob/main/.github/MAINTAINER.md)
- [SGLang README/LICENSE (Apache 2.0)](https://github.com/sgl-project/sglang)
- [docs/docs/hardware-platforms/plugin.mdx - out-of-tree hardware plugin system](https://github.com/sgl-project/sglang)
- [SGLang PyPI package JSON](https://pypi.org/pypi/sglang/json)
- [SGLang PyPI simple index](https://pypi.org/simple/sglang/)
- [RISE wheel builder proxy for sglang](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/sglang/)
- [Ubuntu 26.04 (resolute) package search for SGLang](https://packages.ubuntu.com/search?keywords=SGLang&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/?q=sglang)
- [RISE Members page](https://riseproject.dev/members/)
- [RISE wheel builder status page](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels#70 - "SGLang riscv64 support"](https://github.com/riseproject-dev/python-wheels/issues/70)
- [riseproject-dev/language-runtimes-wg#41 - "Build SGLang dependencies"](https://github.com/riseproject-dev/language-runtimes-wg/issues/41)
- [RISE blog post: "PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) [NEEDS VERIFICATION on exact URL slug - reconstructed from research summary]
- [RISE blog post: "SALTyRN: turning Neon kernels into fast, verified RVV code with LLMs"](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [Arm Developer blog: "Bringing SGLang high-performance LLM inference to Arm Neoverse"](https://developer.arm.com/)  [NEEDS VERIFICATION on exact URL - qualitative claims only, no benchmark data]
- [pytorch/pytorch#180975 - riscv64 master tracking issue](https://github.com/pytorch/pytorch/issues/180975)
- [pytorch/pytorch#141550](https://github.com/pytorch/pytorch/issues/141550)
- [pytorch/pytorch#99278](https://github.com/pytorch/pytorch/issues/99278)
- [numba/numba#6559](https://github.com/numba/numba/issues/6559)
- [numba/llvmlite#923](https://github.com/numba/llvmlite/issues/923)
- [numba/numba#10389](https://github.com/numba/numba/issues/10389)
- [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216)
- [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461)
- [numpy/numpy#32376](https://github.com/numpy/numpy/issues/32376)
- [numpy/numpy#26200](https://github.com/numpy/numpy/issues/26200)
- [scipy/scipy#19378](https://github.com/scipy/scipy/issues/19378)
- [scipy/scipy#22839](https://github.com/scipy/scipy/issues/22839)
- [scipy/scipy#22753](https://github.com/scipy/scipy/issues/22753)
- [facebook/zstd#4471](https://github.com/facebook/zstd/issues/4471)
- [facebook/zstd#4546](https://github.com/facebook/zstd/issues/4546)
- [google/sentencepiece#1196 (merged riscv64 wheel PR)](https://github.com/google/sentencepiece/pull/1196)
- [google/sentencepiece#1226 (revert PR)](https://github.com/google/sentencepiece/pull/1226)
- [google/sentencepiece#1250](https://github.com/google/sentencepiece/issues/1250)
- [openssl/openssl#30880](https://github.com/openssl/openssl/issues/30880)
- [openssl/openssl#28118](https://github.com/openssl/openssl/issues/28118)
- [bytecodealliance/wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195)
- [bytecodealliance/wasmtime#13959](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [bytecodealliance/wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050)
- [bytecodealliance/wasmtime#13078](https://github.com/bytecodealliance/wasmtime/issues/13078)
- [zeromq/libzmq#2021](https://github.com/zeromq/libzmq/issues/2021)
- [project-color-coding skill definition](https://github.com/sgl-project/sglang) (internal skill, applied to determine Section 13 color)
