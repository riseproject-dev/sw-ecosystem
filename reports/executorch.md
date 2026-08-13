---
title: executorch
---

# executorch

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for executorch<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

ExecuTorch is Meta's on-device ML inference runtime. It consumes `.pte` files (FlatBuffer-serialized execution graphs) produced by an ahead-of-time (AOT) export step on a host machine, then runs inference on the target device. The runtime is written in C++ with minimal OS dependencies; the AOT export path requires a full Python + PyTorch stack on the host.

The project lives under the `pytorch` GitHub organization and falls under the PyTorch Foundation (Linux Foundation). There is no separate GOVERNANCE.md. In practice governance is informal: Meta staff hold the majority of CODEOWNERS entries, with per-directory ownership granted to hardware partners. CODEOWNERS is explicitly marked notification-only; approvals from listed owners are not required for merges. There is no formally documented tier policy or acceptance checklist for new architecture ports.

The LICENSE file is BSD 3-Clause and names the following copyright holders: Meta Platforms, Arm Limited, Qualcomm Innovation Center, Apple Inc., MediaTek Inc., NXP, Samsung Electronics, and Intel Corporation. No Apple employee appears in CODEOWNERS despite the copyright line; @shoumikhin (Meta) owns the Apple backends.

Key per-directory corporate maintainers:

- Meta: majority, including build, codegen, exir, runtime, kernels, LLM, devtools
- Qualcomm: `/backends/qualcomm` - @chunit-quic, @haowhsu-quic, @shewu-quic, @winskuo-quic, @abhinaykukkadapu, @psiddh
- Arm: `/backends/arm` and `/backends/xnnpack` - @digantdesai; `/backends/cortex_m` - @rascani
- MediaTek: `/backends/mediatek` - @neuropilot-captain
- NXP: `/backends/nxp` - @robert-kalmar

The RISC-V port has no CODEOWNERS entry. The community stance toward new ports is receptive but passive. Maintainer @mergennachin stated: "We are open to adding support and we can help with mainly reviewing the PRs. One question: are there any customers who is willing to adopt ExecuTorch due to enablement?" Meta's stated role is PR review; external contributors drive implementation. @GregoryComer (Meta) committed to reviewing XNNPACK-related PRs.

ExecuTorch is tracked in the [RISE AI/ML Working Group project list](https://github.com/riseproject-dev/ai-ml-wg/blob/main/docs/projects.md) alongside XNNPACK, PyTorch CPU, IREE, and others. The RFC author, Ludovic Henry (RISE TSC co-chair, Qualcomm), is the sole named driver. Andes Technology (Alan Quey-Liang Kao) is listed as an interested party in that tracking document [NEEDS VERIFICATION - secondary confirmation not available].

---

## 2. Port History and Upstreaming Timeline

All merged RISC-V work is fully upstream in `pytorch/executorch`. There is no downstream-only fork carrying patches. The [riseproject-dev/executorch](https://github.com/riseproject-dev/executorch) fork (last updated 2026-05-15) served as a staging area for PRs before upstream submission; it is not an ongoing parallel development track.

| Date | Event | Source |
|---|---|---|
| 2026-04-13 | Issue #18833 opened: user reports YOLO on bare-metal RISC-V FPGA | [#18833](https://github.com/pytorch/executorch/issues/18833) |
| 2026-04-19 | RFC #18991 opened by @luhenry (RISE TSC co-chair), following PyTorch Conference Paris | [#18991](https://github.com/pytorch/executorch/issues/18991) |
| 2026-04-20 | @mergennachin and @rascani (Meta) express openness; @GregoryComer (Meta) commits to XNNPACK review | [#18991 comments](https://github.com/pytorch/executorch/issues/18991) |
| 2026-05-08 | PR #19399 opened - Phase 1: cross-compile `executor_runner`, run under `qemu-user-static` | [#19399](https://github.com/pytorch/executorch/pull/19399) |
| 2026-05-13 | Issue #19531 opened by @rascani (Meta): track RV32 support | [#19531](https://github.com/pytorch/executorch/issues/19531) |
| 2026-05-15 | PR #19399 merged - first riscv64 commit in repo (SHA 933b476) | [#19399](https://github.com/pytorch/executorch/pull/19399) |
| 2026-05-15 | PR #19521 merged - `executorch-ubuntu-24.04-gcc14` Docker image for RISC-V CI | [#19521](https://github.com/pytorch/executorch/pull/19521) |
| 2026-05-19 | Issue #19666 opened: HPMicro proposes bare-metal RISC-V MCU backend with P-extension int8 kernels | [#19666](https://github.com/pytorch/executorch/issues/19666) |
| 2026-05-22 | PR #19707 merged - Phase 3: RVV enablement, QEMU vlen=128/256/512, per-microkernel profiling | [#19707](https://github.com/pytorch/executorch/pull/19707) |
| 2026-05-22 | @luhenry posts per-model XNNPACK microkernel profiling data on QEMU (see Section 6) | [#18991 comment](https://github.com/pytorch/executorch/issues/18991) |
| 2026-05-26 | PR #19741 merged - YOLOv26 added to RISC-V QEMU test matrix | [#19741](https://github.com/pytorch/executorch/pull/19741) |
| 2026-05-29 | v1.3.1 released - first release containing RISC-V CI (PRs #19399, #19521, #19707, #19741) | [v1.3.1](https://github.com/pytorch/executorch/releases) |
| 2026-06-01 | PR #19799 merged - `executorch-ubuntu-26.04-gcc15` Docker image (required for picolibc baremetal) | [#19799](https://github.com/pytorch/executorch/pull/19799) |
| 2026-06-01 | PR #19917 opened - Phase 4: bare-metal rv32/rv64 QEMU smoke tests | [#19917](https://github.com/pytorch/executorch/pull/19917) |
| 2026-06-01 | PR #19917 approved by @rascani | [#19917](https://github.com/pytorch/executorch/pull/19917) |
| 2026-06-24 | PR #19917 blocked: QEMU hangs on `rv*,v=false` configuration, no new commits since | [#19917](https://github.com/pytorch/executorch/pull/19917) |
| 2026-08-07 | v1.4.0 released - first release containing `executorch-ubuntu-26.04-gcc15` Docker image | [v1.4.0](https://github.com/pytorch/executorch/releases) |
| 2026-08-07 | PR #19917 last updated - still open, QEMU hang unresolved | [#19917](https://github.com/pytorch/executorch/pull/19917) |
| 2026-08-08 | PR #21685 merged - fixes all 17 RISC-V CI jobs broken by scikit-build-core contamination | commit 730b77a5 |

Key contributors: @luhenry (Qualcomm / RISE TSC co-chair) authored all RISC-V PRs and the RFC. @rascani (Meta / Arm backend owner) reviewed and approved Phase 4. @digantdesai (Meta / Arm+XNNPACK backend owner) reviewed Phase 3. @GregoryComer (Meta) committed to XNNPACK review support.

---

## 3. Upstream Support Tier

There is no formally documented tier or support-level policy for ExecuTorch. No PLATFORMS.md, no SUPPORT.md, and no tier-gated review requirement exists. The CODEOWNERS file is explicitly notification-only.

In practice, support tiers can be inferred from CI posture and release artifacts:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI jobs | No general arch CI; backend-specific jobs exist | Arm backend CI (Ethos-U, XNNPACK) | 17 QEMU-emulated jobs (Phases 1-3 merged) |
| CI triggers on every PR | No (backend-scoped) | No (backend-scoped) | No (path-scoped only) |
| CI triggers on push to main | Yes (various) | Yes (Arm backend) | Yes (daily cron + trunk push) |
| Release-blocking | Implicit (primary platform) | Implicit (Arm backend) | No |
| Official PyPI wheels | Yes | Yes (manylinux aarch64) | No |
| Official release binaries | Yes | Yes | No |
| CODEOWNERS entry | Yes | Yes (digantdesai, rascani) | No |
| First-party kernels in runtime | Yes (scalar + some BLAS) | Partial (NEON BlasKernel) | No |

riscv64 is not release-blocking. It has no CODEOWNERS owner, no official binaries, and no first-party runtime kernels. It is best characterized as a community-contributed CI-only tier, equivalent to what some projects call Tier 3 or experimental.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

ExecuTorch's compute architecture has two distinct layers:

**Layer 1 - ExecuTorch runtime (portable kernels, scalar):** The runtime's own kernel layer (`kernels/portable/`, `kernels/optimized/`) contains scalar C++ implementations of all operators. `kernels/optimized/blas/BlasKernel.cpp` contains an `#ifdef __aarch64__` block with 168 lines of hand-tuned NEON intrinsics for GEMM. There is no equivalent `#ifdef __riscv` block anywhere in the ExecuTorch-owned C/C++ runtime. There are no riscv64-specific assembly files, no RVV intrinsics, and no SIMD dispatch layer owned by ExecuTorch. ExecuTorch does not have a JIT backend, GC barriers, or cryptographic primitives - these are not part of its design.

**Layer 2 - XNNPACK delegate (primary compute path):** XNNPACK is a vendored submodule (pinned to SHA `92a7ad501b9516f9fecae119e0146dd1f58e54c1`). At this SHA, the submodule contains 573 production RVV microkernel source files: 355 entries in `cmake/gen/rvv_microkernels.cmake` covering f32-gemm, f32-igemm, f32-dwconv, qs8-gemm, qd8-f32-qc4w-gemm, f32-vbinary, f32-spmm, f32-vrnd, and 20+ other operator types, plus 218 entries in `cmake/gen/rvvfp16arith_microkernels.cmake` covering f16-gemm, f16-vbinary, f16-dwconv, f16-vtanh, f16-vsin, f16-vcos, and others. These use `<riscv_vector.h>` intrinsics (confirmed: `__riscv_vsetvlmax_e32m4`, `__riscv_vfmacc_vf_f32m4`, vsetvl-based length-agnostic loops) and are auto-generated from `.c.in` templates compiled with `-march=rv64gcv` or `-march=rv64gcv_zvfh`. Microkernels were authored by SiFive contributors and are fully upstream in XNNPACK.

XNNPACK's cmake auto-enables RVV when `CMAKE_SYSTEM_PROCESSOR` matches `^riscv`. ExecuTorch's toolchain file sets `CMAKE_SYSTEM_PROCESSOR riscv64`, so the full RVV microkernel suite activates automatically when `EXECUTORCH_BUILD_XNNPACK=ON`.

**cpuinfo** (submodule, pinned SHA `f9a03241`): Full RISC-V Linux ISA detection in `src/riscv/linux/init.c` (22,676 bytes) reads `/proc/cpuinfo` and `hwprobe` to detect the V-extension at runtime, enabling dynamic dispatch between vector and scalar XNNPACK paths.

Component comparison:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ExecuTorch runtime GEMM (BlasKernel.cpp) | Scalar | NEON intrinsics (168 lines, hand-tuned) | Missing - scalar fallback only |
| ExecuTorch runtime activation/elementwise | Scalar | Scalar | Scalar |
| ExecuTorch JIT | None | None | None |
| ExecuTorch assembly files | None | None | None |
| XNNPACK GEMM microkernels | Full (AVX2/AVX512/AMX) | Full (NEON/SME2/KleidiAI) | Full (355 RVV kernels) |
| XNNPACK FP16 microkernels | Full (AVX/F16C) | Full (NEON FP16) | Full (218 RVVFP16ARITH kernels) |
| XNNPACK INT8 quantized GEMM | Full | Full | Partial (open gaps: #10933, #10923, #10922 in XNNPACK) |
| cpuinfo ISA detection | Full | Full | Full (hwprobe-based) |
| Baremetal (no OS) | N/A | Partial (Ethos-U backend) | In progress (PR #19917 open) |
| AOT export (host-side) | Full | Full | Not supported natively (no riscv64 PyTorch wheel) |

The dominant performance path for Linux riscv64 is: ExecuTorch runtime dispatches to XNNPACK delegate, which loads RVV microkernels selected at runtime by cpuinfo. All major ops (GEMM, IGEMM, DWConv) use RVV paths. The one confirmed scalar fallback in the current CI data is Sigmoid (`xnn_f32_vsigmoid_ukernel__scalar_rr2_lut64_p2_div_u2`) per @luhenry's 2026-05-22 comment on issue #18991; this is noted as acceptable since activation rarely bottlenecks LLM inference.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Required toolchain:** `gcc-riscv64-linux-gnu` (GCC 14 minimum for XNNPACK; portable-only builds can use earlier GCC). GCC 14 is the minimum because XNNPACK requires correct RVV codegen that is only complete in GCC 14+. The build system enforces this with a `cmake FATAL_ERROR` if `EXECUTORCH_BUILD_XNNPACK=ON` is set explicitly with GCC < 14, and silently disables XNNPACK with a `NOTICE` if GCC < 14 and XNNPACK was not explicitly requested. Clang cross-compilation is not supported; the toolchain file hardcodes `riscv64-linux-gnu-gcc/g++`.

**Baremetal toolchain (Phase 4):** `riscv64-unknown-elf` + picolibc (standard library). `libstdc++-riscv64-unknown-elf-picolibc` is only available from Ubuntu 26.04 onward, which is why PR #19799 added an `executorch-ubuntu-26.04-gcc15` Docker image. A GCC 14 variant (`executorch-ubuntu-26.04-gcc14`) also exists, added after a GCC 15 sentencepiece build failure blocked that path.

**End-to-end Linux cross-compilation:**

Step 0 - install tooling (Ubuntu 22.04/24.04):
```
GCC_VERSION=14 bash examples/riscv/setup.sh
```
Installs: `gcc-14-riscv64-linux-gnu`, `g++-14-riscv64-linux-gnu`, `binutils-riscv64-linux-gnu`, `libc6-riscv64-cross`, `libc6-dev-riscv64-cross`, `qemu-user-static`.

Step 1 - AOT export (on x86_64 host):
```
python examples/riscv/aot_riscv.py --model mv2 --output riscv_test/mv2_riscv.bpte [--xnnpack] [--quantize]
```
Supported models: `add`, `mv2`, `mobilebert`, `llama2`, `resnet18`, `yolo26`.

Step 2 - cross-compile:
```
cmake -S . -B cmake-out-riscv --preset riscv64-linux -DEXECUTORCH_BUILD_XNNPACK=ON -DCMAKE_BUILD_TYPE=Release
cmake --build cmake-out-riscv -j$(nproc) --target executor_runner
```

Step 3 - run under QEMU user-mode:
```
export QEMU_LD_PREFIX=/usr/riscv64-linux-gnu
qemu-riscv64-static cmake-out-riscv/executor_runner --model_path riscv_test/mv2_riscv.bpte
```
Success criterion: stdout contains `Test_result: PASS`.

All-in-one driver: `bash examples/riscv/run.sh --model=mv2 --xnnpack [--quantize] [--build_only]`

**QEMU CPU strings used in CI:**

XNNPACK (three RVV vlen configurations):
```
rv64,zba=true,zbb=true,zbs=true,v=true,vlen=128,elen=64,vext_spec=v1.0
rv64,zba=true,zbb=true,zbs=true,v=true,vlen=256,elen=64,vext_spec=v1.0
rv64,zba=true,zbb=true,zbs=true,v=true,vlen=512,elen=64,vext_spec=v1.0
```
Portable kernels (no RVV): `rv64,zba=true,zbb=true,zbs=true,v=false`

**Known build failures and workarounds:**

- GCC 15 + sentencepiece: a missing `stdint` include broke the `executorch-ubuntu-26.04-gcc15` path. Fixed on main around 2026-06-09; a GCC 14 variant image was added as a fallback.
- scikit-build-core contamination (2026-08-08): all 17 RISC-V CI jobs were broken; fixed by PR #21685 (SHA 730b77a5).
- PR #19917 stale preset path: the baremetal CI glob in `.github/workflows/riscv64.yml` uses `tools/cmake/preset/riscv64_*.cmake` but the actual file is named `riscv_baremetal.cmake` (without the `64` suffix), so changes to the baremetal preset do not trigger PR CI [NEEDS VERIFICATION - identified by Claude AI review in PR, not independently confirmed].
- QEMU hang on `rv*,v=false` in baremetal PR #19917: unresolved as of 2026-08-07; reproducing locally is difficult due to CI-only trigger restrictions. This is the current merge blocker for Phase 4.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux inference (all 6 model types) | Full | Full | Full (Phases 1-3 merged) |
| RVV vectorized inference (XNNPACK) | N/A | N/A | Full via XNNPACK delegate on Linux |
| INT8 quantized inference (XNNPACK) | Full | Full | Partial - RVV int8 GEMM gaps (see XNNPACK issues #10933, #10923, #10922) |
| Bare-metal inference (no OS) | N/A | Partial (Ethos-U) | In progress - PR #19917 not merged |
| RV32 bare-metal | N/A | N/A | In progress - PR #19917 covers rv32 |
| Native AOT export on target device | Full | Full | Blocked - no riscv64 PyTorch pip wheel |
| FP16 inference (XNNPACK) | Full (AVX/F16C) | Full (NEON FP16) | Full in XNNPACK submodule (RVVFP16ARITH), CI coverage unknown |
| LLM inference (Llama2) | Full | Full | Tested on QEMU (fp32 + quantized) |
| YOLO inference | Full | Full | Tested on QEMU (PR #19741) |

**Performance gaps from missing SIMD in ExecuTorch runtime layer:**

ExecuTorch's own runtime layer (used when XNNPACK delegate is not active, i.e., portable-only builds) has no riscv64 SIMD. For portable-kernel workloads, performance will be scalar-only. This is the same situation as amd64 in ExecuTorch's own runtime (XNNPACK handles SIMD for both). The gap exists identically vs arm64 where BlasKernel.cpp has NEON hand-tuning for pure-ExecuTorch-runtime GEMM paths.

**QEMU-only timing data (wall times meaningless per @luhenry - provided only to show microkernel coverage):**

All data from QEMU (rv64, vlen=128, elen=64, RVV 1.0) per @luhenry's 2026-05-22 comment on issue #18991:

| Model | Config | QEMU wall time (ms) | Dominant op | Microkernel |
|---|---|---|---|---|
| MobileNetV2 | fp32, XNNPACK | 320 | FC GEMM 66.1% | `xnn_f32_gemm_minmax_ukernel_7x4v__rvv` |
| MobileNetV2 | quantized, XNNPACK | 299 | QS8 GEMM | `xnn_qs8_qc8w_gemm_minmax_fp32_ukernel_4x4v__rvv` |
| MobileBERT | fp32, XNNPACK | 27.7 | GEMM 29.1% | `xnn_f32_gemm_minmax_ukernel_7x4v__rvv` |
| MobileBERT | quantized, XNNPACK | 38.1 | QD8 GEMM 37.2% | `xnn_qd8_f32_qc8w_gemm_minmax_ukernel_4x4v__rvv` |
| Llama2 | fp32, XNNPACK | 50.1 | FC GEMM 18.6% + batch matmul 14.6% | RVV |
| Llama2 | quantized, XNNPACK | 42.5 | - | RVV |
| ResNet18 | fp32, XNNPACK | 1456 | IGEMM 96.8% | `xnn_f32_igemm_minmax_ukernel_7x4v__rvv` |
| ResNet18 | quantized, XNNPACK | 1240 | - | RVV |

Confirmed scalar fallback: Sigmoid on all models (`xnn_f32_vsigmoid_ukernel__scalar_rr2_lut64_p2_div_u2`).

No native hardware benchmarks exist. No riscv64-vs-arm64 comparative data for ExecuTorch exists in any accessible public source as of 2026-08-13. The nearest published data is for IREE (not ExecuTorch) on Banana Pi BPI-F3 (SpacemiT K1, 8-core, VLEN=256): YOLOv8n INT8 latency 421 ms at 8 threads with optimized kernels, per the [RISE blog post 2026-07-07](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/).

**Security hardening:** Data not available: no search was conducted for CFI, stack canaries, or PAC/BTI equivalents on riscv64 within ExecuTorch.

**Floating-point / NaN semantics:** No open floating-point correctness bugs found for RISC-V in ExecuTorch. The one closed correctness-adjacent issue (#18573) was a linker configuration problem, not a numerical issue.

---

## 7. CI/CD Infrastructure

riscv64 CI exists but runs exclusively on x86_64 hardware using QEMU user-mode emulation. No native riscv64 runner is active in the repo as of 2026-08-13. The RFC (#18991) explicitly proposes adding RISE bare-metal GitHub Actions runners (`ubuntu-24.04-riscv`, Scaleway EM-RV1 hardware) as a future step, but this has not been implemented.

**CI files:** `.github/workflows/riscv64.yml` and `.github/workflows/_test_riscv.yml`. No `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`.

**Runner:** `linux.2xlarge` (x86_64 host). Docker image: `ci-image:executorch-ubuntu-24.04-gcc14`. Mechanism: QEMU user-mode emulation (`qemu-user-static`).

**Triggers:**

| Trigger type | riscv64 CI fires? | Note |
|---|---|---|
| PR (any file) | No | Path-scoped: only `riscv64.yml`, `test_riscv_qemu.sh`, `riscv64_linux.cmake`, `examples/riscv/**` |
| PR (kernel change outside examples/riscv) | No | Not triggered |
| PR (XNNPACK submodule bump) | No | Not triggered |
| Push to main or release/* | Yes | Full matrix runs |
| Daily cron (10:00 UTC) | Yes | Full matrix runs |
| workflow_dispatch | Yes | Manual trigger |

**Test matrix (Phases 1-3, active):** 6 models (add, mv2, mobilebert, llama2, resnet18, yolo26) x xnnpack [true/false] x quantize [true/false] (excluding: quantize=true requires xnnpack=true; yolo26 skips quantize=true) x vlen [128, 256, 512 when xnnpack=true; single config when xnnpack=false]. Approximately 17 total CI jobs.

After each job, when xnnpack=true, the CI parses `riscv_test/<model>_riscv.etdump.json` and posts a markdown table of op-level timing (sum_ms, avg_ms, max_ms) and registered XNNPACK microkernels to `$GITHUB_STEP_SUMMARY`.

**Timeout:** 30 minutes per job (configurable).

**Phase 4 CI (baremetal, PR #19917, not merged):** Would add `qemu-system-riscv32` and `qemu-system-riscv64` jobs with semihosting for bare-metal ELFs. Not yet active.

Comparison:

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware runner | Yes | Yes (Arm backend) | No - QEMU only |
| RISE bare-metal runner | No | No | Proposed in RFC, not implemented |
| CI fires on every PR | Yes (various) | Yes (Arm backend) | No (path-scoped) |
| CI fires on trunk push | Yes | Yes | Yes |
| Daily scheduled run | Varies | Varies | Yes |
| Job count (RISC-V path) | N/A | N/A | 17 |
| Kernel coverage gate | Implicit | Implicit | No (path-scoped PR trigger) |

---

## 8. Distribution and Release Status

No riscv64 binary or package is available through any distribution channel.

| Channel | riscv64 availability | Notes |
|---|---|---|
| PyPI (`pip install executorch`) | None | Versions 0.1.0-1.4.0 present; platforms: manylinux x86_64, manylinux aarch64, macOS arm64, win_amd64 only |
| GitHub Releases | None | v1.4.0 has one binary asset (`PyTorch.ExecuTorch.1.4.0.pack`, 1.5 MB, platform coverage not documented by name); no riscv64-named asset across any release |
| Ubuntu Noble (packages.ubuntu.com) | None | Package not present |
| Debian tracker | None | HTTP 404 - not packaged |
| Arch Linux RISC-V port (archriscv.felixc.at) | None | No results |
| RISE wheel builder (riseproject.gitlab.io) | None | 77 packages listed; executorch absent |

To use ExecuTorch on riscv64 Linux today, a user must: clone the repo, install GCC 14 cross-toolchain, cross-compile from an x86_64 host, produce the `.pte` artifact on an x86_64 host (because no riscv64 PyTorch wheel exists), transfer the binary and `.pte` to the target, and run. There is no packaged path.

---

## 9. Dependencies

Summary of architecture-sensitive dependencies:

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| XNNPACK (google/XNNPACK) | Primary SIMD compute backend - GEMM, conv, pooling, activation | CI job exists; GCC 14+ required | QEMU-emulated; 9 open RVV issues | No official artifact; vendored submodule | INT8/INT16 kernel gaps (#10933, #10923, #10922 in XNNPACK); see [xnnpack report](../reports/xnnpack.md) |
| cpuinfo (pytorch/cpuinfo) | CPU feature detection; controls RVV microkernel dispatch | CI builds in riscv64/ubuntu:24.04 Docker | Build-only; no unit tests for riscv64 detection | No artifact; vendored submodule | Open #124 "Add RISC-V support"; fragility across kernel versions noted in RFC #18991; see [cpuinfo report](../reports/cpuinfo.md) |
| PyTorch (pytorch/pytorch) | AOT export host: `torch.export` + ExecuTorch lowering | PR #191225 (manywheel Dockerfile) open | Incomplete test validation | No official riscv64 pip wheel | PR #191225 not merged; no native AOT on riscv64; see [pytorch report](../reports/pytorch.md) |
| FlatBuffers (google/flatbuffers) | `.pte` serialization schema + header-only runtime | No riscv64-specific CI; header-only | Not explicitly tested | None needed (header-only) | No open riscv64 issues; see [flatbuffers report](../reports/flatbuffers.md) |
| sentencepiece (google/sentencepiece) | BPE/unigram tokenizer for LLM (Llama2) | Cross-build CI includes riscv64 | Build-only cross-compile | No riscv64 wheel | #1303 intermittent abort in trainer test under free-threaded Python on riscv64 (non-blocking for inference); see [sentencepiece report](../reports/sentencepiece.md) |
| Abseil-cpp (abseil/abseil-cpp) | Transitive via sentencepiece/re2; hashtable, CRC32C, string utils | Builds on riscv64 | Not explicitly tested | No riscv64-specific release | #2002 hashtablez_sampler_test and cordz_sample_token_test fail on riscv64-linux-gnu; #1986 hardware CRC32C not accelerated (software fallback); see [abseil-cpp report](../reports/abseil-cpp.md) |
| pthreadpool (google/pthreadpool) | Thread pool for XNNPACK parallel dispatch | No riscv64 CI; POSIX pthreads path assumed portable | Not tested | N/A (portable source) | RFC #18991 notes "may need small patches" on riscv64; no upstream issues filed |
| TorchAO (pytorch/ao) | CPU quantization kernels (int4/int8) for LLM via `extension/llm` | No riscv64 CI | Not tested | No riscv64 release | No RVV microkernels; scalar fallback only; quantized LLM inference will not benefit from RVV through this path |
| tokenizers (meta-pytorch/tokenizers) | BPE tokenizer for executorch Python wheel | No riscv64 CI visible | Unknown | No riscv64 wheel | Small repo, no public issues; see [tokenizers report](../reports/tokenizers.md) |
| re2 (google/re2) | Regex engine used by sentencepiece/tokenizer | No riscv64-specific issues; pure C++ | Assumed portable | N/A | No issues found |

**Critical blocker - cpuinfo:** If cpuinfo fails to detect the V-extension at runtime, XNNPACK silently disables all RVV microkernels and falls back to scalar. Open issue #124 describes fragility in RISC-V detection across kernel versions. This is a silent failure mode - inference continues but at scalar speed with no diagnostic.

**Critical blocker - native AOT:** PyTorch has no official riscv64 pip wheel. PR #191225 (manywheel Dockerfile for riscv64) is open but not merged. Until this resolves, ExecuTorch AOT export (`torch.export` + lowering to `.pte`) cannot run natively on a riscv64 host. Cross-compile on x86_64 then deploy `.pte` is the supported workaround.

**INT8 quantized performance:** Multiple RVV int8 microkernel gaps in XNNPACK (issues #10933, #10923, #10922) mean 8-bit quantized models may use scalar fallback for some operator types even when RVV is available. ExecuTorch CI tests XNNPACK+quantize under QEMU and it passes, meaning the execution is correct but affected operators may not be using RVV.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#19917](https://github.com/pytorch/executorch/pull/19917) | Add baremetal RISC-V smoke tests (rv32, rv64) | OPEN PR | High - blocks Phase 4 | QEMU hang on `rv*,v=false`; approved but unmerged since 2026-06-01; last updated 2026-08-07; contributor has difficulty reproducing locally |
| [#18991](https://github.com/pytorch/executorch/issues/18991) | [RFC] First-class RISC-V support in ExecuTorch | OPEN RFC | High - tracking | Phases 1-3 done; Phase 4 in progress; Phases 5-6 not started |
| [#19666](https://github.com/pytorch/executorch/issues/19666) | Upstreaming HPMicro bare-metal RISC-V MCU backend | OPEN | Medium | RISC-V P-extension not ratified (ratification expected 2026-10-29); no implementation PRs filed; community agrees to wait for ratification |
| [#19531](https://github.com/pytorch/executorch/issues/19531) | Add RV32 support | OPEN | Medium | Addressed by PR #19917 (not merged); will close when #19917 merges |
| [#18833](https://github.com/pytorch/executorch/issues/18833) | Export YOLO to executorch for RISC-V Baremetal without XNNPACK/pthreads | OPEN | Low | FP32 YOLO reportedly ran on FPGA via "baremetal selective build"; no upstreamed resolution; YOLOv26 added to QEMU Linux matrix in #19741 (separate scope) |
| [#18573](https://github.com/pytorch/executorch/issues/18573) | Failed to load method: error 20 - Operator missing (on RISC-V) | CLOSED | Resolved | Build/link configuration issue (missing `--whole-archive`); not a runtime correctness bug |

**Correctness bugs:** None open. The one correctness-adjacent issue (#18573) was a build configuration problem, resolved.

**Infrastructure regression (2026-08-08):** All 17 RISC-V CI jobs were broken by scikit-build-core contamination; fixed by PR #21685 on 2026-08-08. This demonstrates that the narrow PR trigger scope (path-scoped, not on all-file PRs) means riscv64 CI is not guarded against regressions from unrelated changes.

---

## 12. Objections and Upstream Blockers

**Current merge blocker - Phase 4 (PR #19917):** QEMU hangs on `rv*,v=false` configurations in the baremetal smoke test. The contributor cannot easily reproduce locally because they lack the ability to self-trigger CI. @nil-is-all (Meta) asked to be pinged when it is ready for re-review (2026-07-10). Contributor @luhenry acknowledged needing to return to it. No new commits since 2026-08-07.

**Organizational:** Meta does not drive RISC-V work and does not plan to. The maintainer response was explicitly "are there any customers who is willing to adopt ExecuTorch due to enablement?" - indicating Meta will merge contributions from external parties but will not staff the work internally. The RISC-V port has no CODEOWNERS entry and no dedicated reviewer on call.

**Technical - Phase 5 (native RISC-V backend):** No one has filed PRs or claimed ownership of the scaffolding work. The HPMicro discussion (#19666) converged on "scalar + Zve subset first, P extension after ratification" as the design direction, but no implementation has started. The P extension ratification date is 2026-10-29 per HPMicro's posted timeline.

**Technical - Phase 6 (native AOT on riscv64):** Blocked on conda-forge riscv64 bootstrap and PyTorch riscv64 pip wheels (PR #191225, open). This is a multi-project dependency chain outside ExecuTorch's direct control.

**cpuinfo fragility:** ExecuTorch RFC #18991 explicitly flags cpuinfo RISC-V support as "historically fragile across kernel versions." If cpuinfo issue #124 is not resolved before hardware deployment, RVV will silently go unused on some kernels, making performance unpredictable.

**Path-scoped PR CI:** The narrow PR trigger means any non-riscv change (kernel update, cmake restructuring, XNNPACK submodule bump) can break riscv64 without triggering CI on the PR. The only safety net is the daily cron job and trunk-push CI.

**Acceptance probability for continued contributions:** High. All Phases 1-3 PRs were merged without objection. The community is receptive, review turnaround has been fast (Phases 1-3 elapsed less than 6 weeks from RFC to merged). The primary risk is contributor bandwidth, not upstream resistance.

---

## 13. Investment Analysis

RISE (via @luhenry) has already funded and delivered Phases 1-3 upstream. The work to not re-fund is: riscv64 toolchain CI, Docker images, QEMU user-mode smoke tests (6 models, 3 VLEN configs), and the XNNPACK RVV microkernel profiling infrastructure.

### 13.1 Functional Enablement

Phase 4 (bare-metal) is the immediate gap. PR #19917 is approved and code-complete but stalled on a QEMU hang. The work is diagnostic - find the `rv*,v=false` hang root cause, fix it, and get the PR merged.

Phase 5 (native RISC-V backend, scalar + Zve subset) has agreed design direction but no implementation. This is a new ExecuTorch backend analogous to `cortex_m` or `cadence`, covering bare-metal use cases where XNNPACK's malloc/pthreadpool dependencies are unsuitable.

### 13.2 Performance Optimization

INT8/INT16 XNNPACK microkernel gaps on riscv64 (XNNPACK issues #10933, #10923, #10922) are the primary performance gap for quantized inference. These require work in the XNNPACK repo (not ExecuTorch), but ExecuTorch CI will validate the fix once XNNPACK submodule is bumped.

Sigma fallback for Sigmoid is a minor gap; profiling data shows it is not a bottleneck in any of the 6 tested models.

TorchAO has no RVV microkernels; INT4/INT8 weight-only quantized LLM inference on riscv64 will be scalar-only through that path. Enabling RVV in TorchAO is out of scope unless ExecuTorch LLM workloads are the target.

### 13.3 CI/CD Infrastructure

RISE hardware runners (Scaleway EM-RV1) were proposed in RFC #18991 as the long-term validation target. The RFC notes these runners are in GA. Connecting them to ExecuTorch CI requires plumbing the self-hosted runner into the GitHub Actions workflow, analogous to what was done for PyTorch CI (`ubuntu-24.04-riscv` runners already operational in pytorch/pytorch). This would upgrade riscv64 from QEMU-emulated to hardware-in-the-loop and close the path-scoped PR trigger gap.

The path-scoped PR trigger is a structural risk: non-riscv changes can silently break riscv64 between daily runs. Expanding the trigger to fire on all PRs (with a hardware runner to absorb cost) would be a meaningful reliability improvement.

### 13.4 Ecosystem Enablement

ExecuTorch has no significant dependent package ecosystem (no plugin registry, no op library distribution channel). Section 10 is omitted.

PyTorch riscv64 pip wheels are a hard blocker for native AOT. That is a PyTorch investment item, not an ExecuTorch investment item, but it gates Phase 6.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Diagnose and fix QEMU `rv*,v=false` hang in PR #19917; get Phase 4 merged | 1-2 | Qualcomm/RISE (@luhenry) | Critical |
| Functional | Phase 5 scaffold: native RISC-V backend (scalar + Zve subset), bare-metal, no XNNPACK dependency | 8-12 | Qualcomm/RISE + HPMicro (@willChuai) | High |
| CI/CD | Connect RISE bare-metal GitHub Actions runners (Scaleway EM-RV1) to ExecuTorch CI | 2-3 | RISE infra team | High |
| CI/CD | Expand PR CI trigger from path-scoped to all-files (requires hardware runner to be cost-viable) | 1 | Qualcomm/RISE | High |
| Performance | Implement missing RVV INT8/INT16 XNNPACK microkernels (XNNPACK repo, not ExecuTorch) | 4-8 | XNNPACK upstream contributors | High |
| Performance | Fix cpuinfo RISC-V ISA detection stability (cpuinfo issue #124) | 2-4 | Qualcomm or RISE | High |
| Functional | Phase 6: native AOT on riscv64 (contingent on PyTorch riscv64 pip wheel) | Depends on PyTorch | Upstream PyTorch community | Medium |
| Functional | RISC-V P-extension int8 kernel scaffolding in Phase 5 backend (post-ratification, 2026-Q4) | 6-10 | HPMicro (@willChuai) | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [RFC: First-class RISC-V support in ExecuTorch (issue #18991)](https://github.com/pytorch/executorch/issues/18991)
- [PR #19399: Add RISC-V smoke test on QEMU](https://github.com/pytorch/executorch/pull/19399)
- [PR #19521: Add executorch-ubuntu-24.04-gcc14 docker image](https://github.com/pytorch/executorch/pull/19521)
- [PR #19707: Run RISC-V tests with multiple RVV QEMU configurations](https://github.com/pytorch/executorch/pull/19707)
- [PR #19741: Add Yolo26 to matrix of tested models on RISC-V](https://github.com/pytorch/executorch/pull/19741)
- [PR #19799: Add executorch-ubuntu-26.04-gcc15 docker image](https://github.com/pytorch/executorch/pull/19799)
- [PR #19917: Add baremetal RISC-V smoke tests (rv32, rv64)](https://github.com/pytorch/executorch/pull/19917)
- [Issue #19531: Add RV32 support](https://github.com/pytorch/executorch/issues/19531)
- [Issue #19666: Upstreaming HPMicro bare-metal RISC-V MCU backend](https://github.com/pytorch/executorch/issues/19666)
- [Issue #18833: Export YOLO to executorch for RISC-V Baremetal](https://github.com/pytorch/executorch/issues/18833)
- [Issue #18573: Failed to load method: error 20 (on RISC-V)](https://github.com/pytorch/executorch/issues/18573)
- [RISE AI/ML WG project tracking](https://github.com/riseproject-dev/ai-ml-wg/blob/main/docs/projects.md)
- [RISE member list](https://riseproject.dev/members/)
- [RISE blog: Optimizing IREE for RISC-V (YOLOv8n on BPI-F3)](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [RISE blog: SALTyRN - Neon-to-RVV XNNPACK kernel translation](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [riseproject-dev/executorch fork (staging)](https://github.com/riseproject-dev/executorch)
- [pytorch/executorch releases](https://github.com/pytorch/executorch/releases)
- [executorch on PyPI](https://pypi.org/pypi/executorch/json)
- [XNNPACK RVV microkernel PR #10307 (per-microkernel timing)](https://github.com/google/XNNPACK/pull/10307)