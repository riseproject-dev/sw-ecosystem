---
title: PyTorch
parent: Project Reports
color: yellow
dependencies:
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: critical
  - name: oneDNN
    relation: runtime-dependency
    criticality: critical
  - name: XNNPACK
    relation: runtime-dependency
    criticality: critical
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: SLEEF
    relation: runtime-dependency
    criticality: critical
  - name: FBGEMM
    relation: runtime-dependency
    criticality: optional
  - name: NNPACK
    relation: runtime-dependency
    criticality: optional
  - name: psimd
    relation: runtime-dependency
    criticality: optional
  - name: Gloo
    relation: runtime-dependency
    criticality: optional
  - name: pthreadpool
    relation: runtime-dependency
    criticality: critical
  - name: mimalloc
    relation: runtime-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: ONNX (format/schema)
    relation: runtime-dependency
    criticality: optional
  - name: OpenMP
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="pytorch" %}

# PyTorch

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for PyTorch<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

PyTorch is the dominant open-source deep learning framework for research and production training workloads. The primary codebase lives at [pytorch/pytorch](https://github.com/pytorch/pytorch), license BSD-3-Clause, homepage [pytorch.org](https://pytorch.org/).

**Governance.** PyTorch is governed by the PyTorch Foundation, a subsidiary of the Linux Foundation (Meta transferred project governance to it in September 2022). The Foundation now also hosts vLLM, DeepSpeed, Ray, Helion and Safetensors as a "vendor-neutral home." Technical governance (per [docs.pytorch.org governance docs](https://docs.pytorch.org/docs/main/community/governance.html)) is a four-tier structure: Contributors, Module Maintainers, Core Maintainers, Lead Core Maintainer (BDFL, final tie-breaker). Membership and maintainership are explicitly individual-based, not company-based, "to prevent companies buying influence." Uncontroversial PRs merge via CODEOWNERS/core-reviewer approval; controversial changes (semantic/API changes, backwards-incompatible changes, new core functionality, removal of platform support) require an open GitHub issue plus core/module maintainer sign-off. No formal PLATFORMS.md, SUPPORT.md or published platform-tier document exists in the repository; new-architecture acceptance is governed informally through this "controversial change" rule rather than a documented tiering scheme.

**Corporate maintainer affiliation (CODEOWNERS, per backend):**

| Backend/area | Maintainer(s) | Employer (inferred) |
|---|---|---|
| CUDA | @eqy, @syed-ahmed, @Aidyn-A | Nvidia |
| ROCm/HIP | @jeffdaily, @jithunnair-amd | AMD |
| XPU (Intel GPU) | @EikanWang, @gujinghui | Intel |
| MPS (Apple Metal) | @malfet, @Isalia20 | Meta |
| MTIA | @egienvalue | Meta |

CODEOWNERS itself states it is for notification subscription only ("Approvals from people in this file are not required for merges"), consistent with the individual-based governance model.

**Community stance on RISC-V.** RISC-V enablement has been accepted opportunistically, PR by PR, since July 2024, from individual engineers rather than as a foundation-sponsored initiative, though that has visibly changed in 2026 (see Section 2). All five of the earliest RISC-V PRs (#127867, #143979, #160172, #167071, #166602) were approved by the same maintainer, @malfet. Issue [#141550](https://github.com/pytorch/pytorch/issues/141550) ("RISCV CI support," opened 2024-11-26 requesting a revival of RISC-V CI after an earlier PR, [#140816](https://github.com/pytorch/pytorch/pull/140816), was closed) is labeled "triaged" but shows no sustained maintainer discussion in the thread -- acknowledged, not actively driven, at the infra level. The work is a joint effort between Alibaba's XuanTie team and the Institute of Software, Chinese Academy of Sciences (ISCAS) / Ruyi Community, coordinated via the master tracking issue [#180975](https://github.com/pytorch/pytorch/issues/180975) (labeled "proposal accepted"). ISCAS and ZTE Corporation, two of the contributing organizations, are RISE Project General Members; Alibaba (via DAMO Academy / T-Head) is a RISE Premier Member. PyTorch/Meta itself is not a RISE member.

---

## 2. Port History and Upstreaming Timeline

RISC-V work in pytorch/pytorch spans July 2024 to the present (Sept 2026), currently organized under the four-phase roadmap in tracking issue #180975: (1) CI infrastructure/cross-compilation, (2) a high-performance RISC-V micro-kernel library for ATen ops (analogous to ARM's KleidiAI), (3) torch.compile backend extension via buddy-mlir, (4) Triton/TileLang RISC-V backends. An earlier, separately filed five-phase roadmap, [#171659](https://github.com/pytorch/pytorch/issues/171659) ("[RFC] RISC-V Architecture Support Roadmap for PyTorch," opened 2026-01-04 by Alibaba's XuanTie team, cc'ing @malfet, @seemethere, @ezyang, @ptrblck), effectively feeds into #180975's consolidated plan.

| Date | Event | Source | Contributor |
|---|---|---|---|
| 2024-07-01 | First RVV kernel merged: Winograd depthwise conv (~31% speedup on MobileNet V2) | [PR #127867](https://github.com/pytorch/pytorch/pull/127867) | zhangfeiv0 (ISCAS) |
| 2024-11-16 | First RISC-V CI attempt, closed/superseded | [PR #140816](https://github.com/pytorch/pytorch/pull/140816) | community |
| 2024-11-26 | RISC-V CI support issue filed | [#141550](https://github.com/pytorch/pytorch/issues/141550) | jysh1214 |
| 2025-02-20 | RFC requesting review of bundled RISC-V/RVV PRs (#127867, #135570, #143979) | [#147513](https://github.com/pytorch/pytorch/issues/147513) | zhangfeiv0 (ISCAS) |
| 2025-02-25 | Doc PR guiding users to build riscv PyTorch from scratch | [PR #141552](https://github.com/pytorch/pytorch/pull/141552) | zhangfeiv0 |
| 2025-03-23 | RVV ATen `Vec` sub-library support (128-bit min, m2 grouping) | [PR #135570](https://github.com/pytorch/pytorch/pull/135570) | zhangfeiv0 (ISCAS) |
| 2025-08-13 | First opt-in riscv64 CI job merged (cross-compiled) | [PR #143979](https://github.com/pytorch/pytorch/pull/143979) | zhangfeiv0 (ISCAS) |
| 2025-08-18 | Build support for RISCV merged | [PR #160172](https://github.com/pytorch/pytorch/pull/160172) | zhaoguoan (UltraRISC) |
| 2025-10-22 | GCC 14.2 ICE in DepthwiseConvKernel.cpp fixed | [#166057](https://github.com/pytorch/pytorch/issues/166057) / [PR #165717](https://github.com/pytorch/pytorch/pull/165717) | zhangjian29 |
| 2025-11-07 | Inductor cpp_builder `-march=native` crash on riscv fixed | [PR #167071](https://github.com/pytorch/pytorch/pull/167071) | chenlang (ZTE) |
| 2025-11-20 | oneDNN backend enabled for RISC-V (reports 8.85x speedup on elementwise mul on SG2044, not yet independently validated in PyTorch CI) | [PR #166602](https://github.com/pytorch/pytorch/pull/166602) | zhangfei (ISCAS) |
| 2025-12-23 | c7i.2xlarge instance used for riscv64 build | [PR #168094](https://github.com/pytorch/pytorch/pull/168094) | -- |
| 2026-01-04 | Five-phase RISC-V roadmap RFC filed | [#171659](https://github.com/pytorch/pytorch/issues/171659) | Alibaba XuanTie team |
| 2026-02-05 | lintrunner enabled on riscv64 build | [PR #173993](https://github.com/pytorch/pytorch/pull/173993) | -- |
| 2026-02-17 | ZLib reference in riscv CI Dockerfile outdated (build breaks, 404) | [#175193](https://github.com/pytorch/pytorch/issues/175193) | -- |
| 2026-04-21 | CUDA bindings disabled on riscv64 CI | [PR #173663](https://github.com/pytorch/pytorch/pull/173663) | -- |
| 2026-04-21 | Master tracking issue for full RISC-V enablement opened | [#180975](https://github.com/pytorch/pytorch/issues/180975) | fernchen (XuanTie/Alibaba) |
| 2026-04-27 | MKL install restricted to x86 only, unblocking riscv64 | [PR #178778](https://github.com/pytorch/pytorch/pull/178778) | -- |
| 2026-05-08 | riscv64 manywheel Docker image added | [PR #177722](https://github.com/pytorch/pytorch/pull/177722) | -- |
| 2026-05-18 | riscv64.yml migrated to OSDC (ARC) runners via dial-up pattern | [PR #183649](https://github.com/pytorch/pytorch/pull/183649) | -- |
| 2026-05-19 | Inductor `cpp.march` knob added, explicit RISC-V handling | [PR #184297](https://github.com/pytorch/pytorch/pull/184297) | -- |
| 2026-06-24 | RISC-V cross-compilation image renamed to include "cross" suffix | [PR #187821](https://github.com/pytorch/pytorch/pull/187821) | -- |
| 2026-07-07 | `getApproximateTime` RISC-V fast path added (rdtime CSR) | [PR #189000](https://github.com/pytorch/pytorch/pull/189000) | -- |
| 2026-07-20 | Toolchain cross-compile variables forwarded before `project()` | [PR #190003](https://github.com/pytorch/pytorch/pull/190003) | -- |
| 2026-07-22 | RISC-V CPU pause hint added to atomic-add spin loop | [PR #188999](https://github.com/pytorch/pytorch/pull/188999) | -- |
| 2026-07-23 to 2026-07-27 | Native (non-cross) build image added for linux-riscv64, 1st and 2nd iterations | [PR #182278](https://github.com/pytorch/pytorch/pull/182278), [PR #190887](https://github.com/pytorch/pytorch/pull/190887) | luhenry (RISE) |
| 2026-07-27 to 2026-07-28 | manywheel Dockerfile for riscv64 merged, then reverted | [PR #191225](https://github.com/pytorch/pytorch/pull/191225) | -- |
| 2026-08-09 | RISC-V native fp16 conversion paths | [PR #183254](https://github.com/pytorch/pytorch/pull/183254) | Ag-Cu |
| 2026-08-12 | cpu-riscv64 support added to manywheel scripts, replacing #191225 | [PR #191657](https://github.com/pytorch/pytorch/pull/191657) | -- |
| 2026-08-18 | RISE publishes natively-built riscv64 torch 2.13.0 wheels (212,038 tests, 99.998% pass rate) | [riseproject.dev blog](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) | RISE Project |
| 2026-08-26 | Linear cross-entropy ULP tolerance scoped to RISC-V | [PR #194691](https://github.com/pytorch/pytorch/pull/194691) | -- |
| 2026-08-28 | `Python_SOABI` set when cross-compiling (valid extension suffix) | [PR #189388](https://github.com/pytorch/pytorch/pull/189388) | -- |
| 2026-08-30 | riscv64 blocklist added to test/run_test.py (open, draft) | [PR #195345](https://github.com/pytorch/pytorch/pull/195345) | -- |
| 2026-09-23 | RVV vectorized kernel for FusedAdam (float/double) opened | [PR #198351](https://github.com/pytorch/pytorch/pull/198351) | -- |
| 2026-09-29 | Cross-compilation regression fixed: riscv64 job routed back onto the cross-compile code path | [PR #194880](https://github.com/pytorch/pytorch/pull/194880) | zklaus |

Not fully upstream. The current in-tree state is build-only CI, a single real RVV kernel, and an open roadmap; the performance/vectorization and compiler-backend phases (2-4) of #180975 have not landed any code as of this report. Note on data quality: PR [#195354](https://github.com/pytorch/pytorch/pull/195354) ("[ref-stack][aot_compile] Fix global guards on reloaded nn.Module artifacts," merged 2026-09-02) surfaced in RISC-V search results but its title/content show no apparent RISC-V connection; it is flagged here as likely mislabeled in the source data rather than treated as a verified riscv64 change.

---

## 3. Upstream Support Tier

No formally published platform-tier policy exists (no PLATFORMS.md, no SUPPORT.md, no tier language in governance.html). In practice, RISC-V sits in an informal third tier below x86_64/macOS/Windows (Meta-maintained, full CI, release-blocking) and aarch64/ROCm/XPU (partner-maintained, CI present, dedicated reviewers). RISC-V characteristics:

- A single, opt-in (not PR-blocking) cross-compilation CI workflow; no riscv64 runner integrated into the always-on PR gate.
- No CODEOWNERS entry for `module: risc-v`; reviews are ad hoc, historically concentrated on @malfet.
- RISC-V code paths are small, additive, and isolated behind `#if defined(__riscv...)` guards rather than integrated as a first-class `CPUCapability`.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR-gating CI | Yes | Yes | No (opt-in tag/manual dispatch only) |
| Official PyPI wheel | Yes | Yes | No |
| Dedicated CODEOWNERS | Yes (per-backend) | Partial | No |
| Native-hardware CI (in-tree) | Yes | Yes | No (RISE's native-hardware CI is out-of-tree) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

No `arch/riscv/` directory and no standalone `.S` assembly files exist. All RISC-V code is inline (`#if defined(__riscv...)` / inline `__asm__ __volatile__`) inside existing cross-platform C++ files, plus CI/build-infrastructure plumbing. There is no RISC-V-specific JIT backend; Inductor's C++ codegen treats riscv64 as a scalar target.

### 4.1 Core kernel code

| Path | Purpose | ISA extension | Status |
|---|---|---|---|
| `aten/src/ATen/native/cpu/DepthwiseConvKernel.cpp` (~220-line RVV branch of 546 total) | Winograd F(2,3) 3x3 depthwise convolution; third branch alongside `__ARM_NEON__` and scalar stub, guarded by `__riscv_v_intrinsic>=12000`, using `<riscv_vector.h>` RVV 1.0 intrinsics | RVV (V/Zve32f-class) | Complete, functional kernel mirroring the NEON path; contains an explicit documented workaround for a GCC 14.2 compiler ICE (see Section 6/11) |
| `aten/src/ATen/native/Convolution.cpp` (dispatch at line 357) | `use_cpu_depthwise3x3_winograd()` gate, routes eligible 3x3 depthwise convs to the kernel above on RVV-capable builds | RVV (routing only) | Complete |
| `aten/src/ATen/native/cpu/AtomicAddFloat.h` | Cross-platform atomic float add; RISC-V branch emits the Zihintpause `pause` hint via raw `.insn` encoding (no-op HINT if extension absent) | Zihintpause | Complete, by design small |
| `c10/util/ApproximateClock.h` | Fast approximate wall-clock timestamp; `C10_RISCVTSC` / `getRiscvApproximateTime()` reads the `time` CSR via inline `rdtime` asm, parallel to x86 `rdtsc` and ARM `cntvct_el0` | Zicsr (`time` CSR) | Complete |
| `aten/src/ATen/cpu/Utils.cpp` | CPU capability map; `get_cpu_architecture()` returns `"riscv64"` for `__riscv && __riscv_xlen==64` | None detected | Stub-like relative to x86/ARM: architecture is identified via cpuinfo, but no Zba/Zbb/RVV extension-flag probing exists, unlike the detailed SSE/AVX/AVX-512/AMX (x86) and NEON/SVE/SME (ARM) blocks |

PyTorch's own ATen `Vectorized<>` SIMD dispatch layer has no RVV `CPUCapability` enum entry, and TorchScript's NNC JIT (`torch/csrc/jit/tensorexpr/llvm_jit.cpp`, generic `InitializeAllTargets()`) has no RISC-V-specific LLVM target initialization. These are in-tree gaps, distinct from the dependency-level RVV work in XNNPACK/oneDNN (Section 9), and they gate how much of that dependency-level work is actually reachable from Python today.

### 4.2 Build system / dispatch

- `CMakeLists.txt`: defines `CPU_RISCV`, set ON when `CMAKE_SYSTEM_PROCESSOR MATCHES "^(riscv64)"`; makes `USE_MKLDNN` available on riscv64 via the dependent-option condition (`CPU_INTEL OR CPU_AARCH64 OR CPU_POWER OR CPU_RISCV`).
- `cmake/Modules/FindMKLDNN.cmake`: disables oneDNN's experimental "ukernel" feature when `CPU_POWER OR CPU_RISCV` (upstream oneDNN lacks ukernel support there).
- `torch/_inductor/cpp_builder.py` (lines ~1113-1119): Inductor's march-flag selection maps `riscv64 -> -march=rv64gc`, `riscv32 -> -march=rv32gc`. `rv64gc` carries no `v` (vector) suffix, so Inductor-generated C++ on riscv64 compiles scalar-only by default -- there is no RVV-targeted vectorization path in Inductor.

### 4.3 RVV ATen vectorization status

PyTorch itself tracks the vec-library work as PR [#135570](https://github.com/pytorch/pytorch/pull/135570) (opened 2025, RVV support for `Vec`, 128-bit minimum / m2 grouping), referenced by the earlier RFC #147513. The live research did not surface an open, currently-active successor PR continuing this specific `Vectorized<>` scalable-vector work in the September 2026 PR/commit listings; #135570 itself is listed as closed/merged in the commit history is not confirmed -- its final disposition is [NEEDS VERIFICATION]. What is confirmed is that no RVV entry exists in `CPUCapability` as of the current code search, so ATen vectorized dispatch on riscv64 remains scalar-only in the mainline tree, independent of PR status.

---

## 5. Build System, Cross-Compilation, and Toolchain

No standalone build docs exist for riscv64. `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` do not exist in the repository; `README.md` has zero RISC-V mentions. RISC-V build knowledge is encoded entirely in CI scripts.

**Toolchain.** GCC 14 is required and pinned (`ENV GCC_VERSION=14` in the Dockerfile; same value in `.ci/docker/build.sh`'s image-name case block). Packages: `gcc-14-riscv64-linux-gnu`, `g++-14-riscv64-linux-gnu`. No comment states why GCC 14 specifically; it matches PyTorch's general GCC-14 baseline for the Ubuntu Noble (24.04) image family. `.ci/docker/build.sh` verifies the version post-build and fails the image build if the installed cross-gcc doesn't match `$GCC_VERSION`. No Clang path exists for riscv64 anywhere in the repo -- all riscv64 CI compiles with GCC only. CMake is pinned to 4.0.0 via pip inside the crossenv; Python 3.12.3 is built from source into the sysroot.

`.ci/pytorch/build.sh` explicitly re-exports the cross compilers because the generic `*gcc*` branch of `common.sh` would otherwise clobber them with the host toolchain:
```
export CC="riscv64-linux-gnu-gcc-14"
export CXX="riscv64-linux-gnu-g++-14"
```

**Cross-build invocation** (triggered when `BUILD_ENVIRONMENT` matches `*riscv64*cross*`):
```
source /opt/riscv-cross-env/bin/activate   # crossenv built in the Dockerfile
export CMAKE_CROSSCOMPILING=TRUE
export CMAKE_SYSTEM_NAME=Linux
export CMAKE_SYSTEM_PROCESSOR=riscv64
export USE_CUDA=0
export USE_MKLDNN=0
export CC="riscv64-linux-gnu-gcc-14"
export CXX="riscv64-linux-gnu-g++-14"
export CAFFE2_CUSTOM_PROTOC_EXECUTABLE=/usr/bin/protoc   # host protoc; target protoc can't run on the build host
# SLEEF code-gen tools built natively (host arch) first, then:
python -m build --wheel --no-isolation
python .ci/pytorch/check_wheel_soabi.py dist/*.whl
```
`WERROR` is left unset for riscv64 builds, consistent with riscv64 (alongside rocm/xla/s390x) being excluded from the `WERROR=1` branch because riscv64 builds "currently fail when WERROR=1" per the build-script comment.

**Recommended `-DUSE_X=OFF` flags for riscv64:** `USE_CUDA=OFF`, `USE_MKLDNN=OFF` (though CMake's own default would turn MKLDNN ON for `CPU_RISCV`; CI overrides this explicitly), `USE_NNPACK=OFF`, `USE_PYTORCH_QNNPACK=OFF`, `USE_XNNPACK=OFF` (riscv64 is excluded from the XNNPACK architecture allowlist by default and must be explicitly enabled), `USE_FBGEMM=OFF` (FBGEMM is x86/AArch64-only with no architecture guard and fails to build on riscv64 unless disabled).

**Cross-compilation Docker image** (`.ci/docker/ubuntu-cross-riscv/Dockerfile`, base `--platform=linux/amd64 ubuntu:24.04`). Sysroot (`/opt/sysroot`) cross-built for `riscv64-linux-gnu`: zlib 1.3.2 (pinned via `ARG ZLIB_VERSION`; this pin went stale and 404'd, tracked in issue [#175193](https://github.com/pytorch/pytorch/issues/175193), with a follow-up fetching zlib from GitHub releases instead in [PR #189382](https://github.com/pytorch/pytorch/pull/189382)), libffi 3.4.6, bzip2 1.0.8, xz 5.4.6, OpenSSL 3.2.1 (`./Configure linux64-riscv64`), SQLite3 3.45.2, Python 3.12.3. All built `--host=riscv64-linux-gnu --build=x86_64-linux-gnu --prefix=/opt/sysroot`. Key environment: `CC=riscv64-linux-gnu-gcc-14`, `CXX=riscv64-linux-gnu-g++-14`, `QEMU_LD_PREFIX=/usr/riscv64-linux-gnu/`, `SYSROOT=/opt/sysroot`. A `crossenv` activates a host-built Python that cross-installs packages (`setuptools pyyaml typing_extensions wheel build "scikit-build-core>=1.0" packaging six numpy==1.26.4`) into the riscv64 sysroot; `PIP_EXTRA_INDEX_URL=https://pypi.riseproject.dev/simple` and `PIP_PREFER_BINARY=1` are set for pre-built target-side wheels (NumPy), documented in-image as pointing to `https://riseproject-dev.github.io/python-wheels/`.

**QEMU usage.** The Docker image build step (`.ci/docker/build.sh`) adds `platform_flag="--platform linux/riscv64"` and builds the image under QEMU user-mode emulation via buildx when the build host isn't riscv64. The Dockerfile's `QEMU_LD_PREFIX` is the dynamic-linker prefix QEMU uses to resolve riscv64 shared libraries when running riscv64 binaries on the x86_64 host. However, the actual build job in CI specifically avoids QEMU for the two tools that would otherwise need it: protobuf uses the host's `/usr/bin/protoc` directly (`CAFFE2_CUSTOM_PROTOC_EXECUTABLE`) rather than running a cross-built, QEMU-emulated `protoc`, and SLEEF's host code-generation tools are built natively for x86_64 (`sleef-native`) rather than cross-built and QEMU-run. A build-script comment explains the project moved away from registering `qemu-riscv64` with `binfmt_misc` when an older EC2-based build path was removed. **Net effect: the current in-tree `riscv64.yml` workflow has no test-execution step at all, so no riscv64 binary is ever run (under QEMU or otherwise) by in-tree CI today** -- QEMU's only live role in-tree is in the Docker-image-build path, and that is for building the (currently unused-by-workflow) native, non-cross image, not for executing test binaries.

Known build failure: issue [#116012](https://github.com/pytorch/pytorch/issues/116012) ("Issue with Protoc while building PyTorch for RISC-V," opened 2023-12-18, stale, 0 comments); issue [#99278](https://github.com/pytorch/pytorch/issues/99278) ("Build error on libstdc++ header stl_algobase.h on riscv," opened 2023-04-16, labeled good-first-issue, still open and unclaimed).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Subsystem | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| ATen SIMD vectorization (`CPUCapability`) | AVX2 + AVX512 dispatch | NEON + SVE256/SVE128 dispatch | No RVV entry; scalar only | Full; all generic tensor ops run at scalar speed |
| ATen native RVV kernels | N/A | N/A | DepthwiseConv only (1 kernel) | Near-total; no GEMM, attention, normalization, elementwise RVV kernels in-tree |
| oneDNN backend | Full (primary backend) | Enabled | Enabled in cmake (PR #166602); forced OFF (`USE_MKLDNN=0`) in CI | Partial; correctness never validated in CI; INT8 conv/matmul missing upstream |
| XNNPACK (mobile/edge) | Supported | Full, NEON microkernels | Excluded from the default architecture allowlist; must be explicitly enabled; FP16 CI broken (XNNPACK#9886) | Significant; 344 production RVV source files exist but are not reachable from a default build |
| FBGEMM (quantized server) | Full | Full | Not supported | Full; no INT8/INT4 server quantization path; no quantization backend at all on riscv64 (neither FBGEMM nor QNNPACK) |
| Inductor C++ backend | Full (`-march=native`) | Supported | `-march=native` crash fixed (PR #167071); `cpp.march` knob added (PR #184297), maps to `-march=rv64gc` (no `v`) | Functional but scalar; no RVV autovectorization |
| torch.compile / Triton | Full | Partial | Not started (Phase 3/4 of #180975) | Full |
| CUDA/GPU | Full | Full | N/A (`USE_CUDA=0`) | N/A by architecture |
| Distributed (Gloo) | Full | Full | Architecture-agnostic C++; no riscv64-specific issues/PRs found; untested | Unvalidated, not a confirmed gap |
| fp16 conversion (c10::Half) | Native | Native | Native RISC-V fp16 paths opened (PR #183254, open) | In progress |
| Vectorized FusedAdam optimizer kernel | Full | Full | RVV kernel for float/double opened (PR #198351, open) | In progress |

**Known correctness/float issues shared with RVV-adjacent CPU codegen** (not RISC-V-specific, but affect the same vectorized CPU kernel paths RVV shares): [#198606](https://github.com/pytorch/pytorch/issues/198606) (open) Inductor CPU int64 vector multiply signed overflow on AVX2; [#196681](https://github.com/pytorch/pytorch/issues/196681) (open) Inductor CPU 2D-tiled reduction tail-block overflow (crash or silent wrong results); [#146508](https://github.com/pytorch/pytorch/issues/146508) (open) float16 CPU implementation correctness concerns. None of these were found to have RISC-V-specific reproductions beyond the RVV GCC ICE (#166057, Section 11).

---

## 7. CI/CD Infrastructure

### 7.1 In-tree CI (pytorch/pytorch)

Exactly one riscv64-specific GitHub Actions workflow exists: [`.github/workflows/riscv64.yml`](https://github.com/pytorch/pytorch/blob/main/.github/workflows/riscv64.yml) (44 lines, `Owner(s): ["module: risc-v"]`). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

```yaml
name: riscv64
on:
  push:
    tags:
      - ciflow/riscv64/*
  workflow_dispatch:
```

- **Trigger:** `push` to tags matching `ciflow/riscv64/*` (registered in `.github/pytorch-probot.yml`'s `ciflow_push_tags` list, invokable via a PR comment such as `/ciflow riscv64`), or manual `workflow_dispatch`. **No `pull_request:` trigger and no `schedule:` trigger.** The job does not gate PRs.
- **Jobs:** One: `pytorch-linux-noble-riscv64-py3_12-gcc14-cross-build`, calling the reusable `_linux-build.yml` with a runner determined by `_runner-determinator.yml` (standard x86 CI runner pool, migrated to OSDC/ARC via PR #183649) -- not a native riscv64 runner. Docker image: `ci-image:pytorch-linux-noble-riscv64-py3.12-gcc14-cross-build`. **No test job exists in this workflow.**
- Per the CI evidence rule (build riscv64 = yes, test riscv64 = no), this is a build-only, opt-in CI job.
- `.github/workflows/docker-builds.yml` builds the matching Docker image (`pytorch-linux-noble-riscv64-py3.12-gcc14-cross-build`) on the default x86 ARC runner pool (`mt-l-x86iavx512-8-64`), on push to main/release/`ciflow/docker/*`, plus a weekly schedule (`1 3 * * 3`).
- A regression (PR #187821 renamed the Docker image to add a `-cross-build` suffix without updating the matching `BUILD_ENVIRONMENT` string the cross-compile guard checked) caused the riscv64 job to silently stop cross-compiling and instead build against the host toolchain for a period; this was fixed by [PR #194880](https://github.com/pytorch/pytorch/pull/194880) (merged 2026-09-29).

### 7.2 Out-of-tree CI (RISE Project)

[riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci) (created 2026-04-29) runs PyTorch's out-of-tree CI on native riscv64 hardware (`ubuntu-24.04-riscv` label, RISE RISC-V Runners, Scaleway EM-RV1 bare-metal) following the PyTorch Out-of-Tree Cross-Repo CI Relay RFC. As of the 2026-05-12 RISE blog post, "six weeks in": 870+ jobs accumulated for pytorch-ci specifically; the broader RISE Runners service logged 13,000+ jobs across 197 repos and 87 orgs (Mar 19-May 6, 2026), 99.78% completion, ~445 jobs/day, with dedicated pools for projects like llama.cpp (RVV 1.0 machines). Goal: reach PyTorch CI Level 3 (non-blocking PR checks) in-tree. RISE funds a dedicated milestone contract (RP013, "Optimizing PyTorch ATen Operators for High-Performance RISC-V Hardware," Linux Foundation Europe, bid window Apr 9-May 23 2025) targeting VLA support in ATen's `vec` library and OpenBLAS `mm`/`addmm` optimization on a BPI-F3 board, benchmarked via torchperf/torchbench; `torch.compile` is explicitly out of scope for that contract.

Build performance on RISE hardware: cold-cache build ~20 hours, hot-cache build ~1.5 hours with 99+% cache-hit rate, ~2,300 ninja targets, >40,000 relay events and ~3,900 builds since end of April 2026.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree PR-gating CI | Yes | Yes | No |
| In-tree native-hardware CI | Yes | Yes | No |
| Out-of-tree native-hardware CI | N/A | N/A | Yes (RISE, 870+ jobs, not yet merged in-tree as a blocking or non-blocking check) |

---

## 8. Distribution and Release Status

### 8.1 PyPI (pip install torch)

No official riscv64 wheel exists. Confirmed via [pypi.org/pypi/torch/json](https://pypi.org/pypi/torch/json): latest version 2.14.1, 24 files, platforms macOS/manylinux-aarch64/manylinux-x86_64/Windows, cp310-cp313 -- zero riscv64 files across all versions. (The PyPI project literally named "pytorch" is an unrelated placeholder/typo-trap package and is not the real distribution.) GitHub releases (pytorch/pytorch) carry only auto-generated source archives, not architecture-specific binaries, for any architecture -- not a riscv64-specific signal.

### 8.2 RISE Project wheel distribution

RISE's GitLab-hosted PyPI index (project 56254198, `https://pypi.riseproject.dev/simple/`) hosts riscv64 wheels for the real package name `torch`: `torch-2.13.0+cpu-cp312-cp312-manylinux_2_39_riscv64.whl`, plus cp313, cp314 and cp314t variants. Per the RISE blog post ["PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) (2026-08-18, author Ludovic Henry, Qualcomm), these are built **natively on real RISC-V hardware** (Scaleway EM-RV1, `ubuntu-24.04-riscv` RISE Runners), not cross-compiled, and are CPU-only. Install: `pip install torch --extra-index-url https://pypi.riseproject.dev/simple/ --prefer-binary`. Test validation: 212,038 test cases, 165,591 passed, 191 failed, 46,256 skipped (99.998% pass rate on enabled tests), across 550 test files totaling 121.9 hours of serial test time (the single file `inductor/test_torchinductor_opinfo` alone takes 17.6 hours, over 10% of total). Failures were attributed mostly to architectural assumptions (cache-topology detection, quantization-backend absence, x86-specific tests) rather than computational errors. Stated limitations: no RVV acceleration in ATen ops yet (scalar fallback, consistent with Section 4), oneDNN disabled in favor of OpenBLAS, no quantization backend.

**Discrepancy to note:** the public RISE wheel-builder listing page ([riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/)), which lists 75 other riscv64 packages (numpy, scipy, pandas, pillow, matplotlib, tokenizers, safetensors, ml-dtypes, onnx, etc.), does **not** list torch/pytorch. The torch wheels exist in the separate GitLab PyPI package registry (project 56254198) referenced by the August 2026 blog post, not on the wheel_builder's own index page. Both are RISE-run surfaces; this is not reconciled by the available research and should be read as "torch wheels exist in RISE's package registry but are not surfaced on RISE's public wheel_builder catalog page" rather than a contradiction about whether the wheels exist. Separately, a related riseproject-dev/python-wheels repo carries riscv64 builds for `pytorch-tokenizers` (v1.4.1, v1.5.0), `executorch` v1.4.1, and `tensordict`.

### 8.3 Distro packaging

- **Debian:** PyTorch is packaged in Debian sid (unstable); not in Ubuntu 24.04 Noble or Ubuntu 26.04 "resolute" (confirmed via a name search across [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=pytorch&suite=resolute&searchon=names) for `resolute`, returning no results for `pytorch`/`python3-pytorch`/`libpytorch` in any architecture -- i.e. PyTorch is not packaged in Ubuntu at all yet, not specifically excluded only on riscv64).
- **Third-party/unofficial riscv64 wheel repos** (not part of pytorch/pytorch or RISE): [KumaTea/pytorch-riscv64](https://github.com/KumaTea/pytorch-riscv64), [gounthar/riscv64-python-wheels](https://github.com/gounthar/riscv64-python-wheels), [xforcevesa/pytorch-riscv64-oe24](https://github.com/xforcevesa/pytorch-riscv64-oe24) (OpenEuler build).

### 8.4 Summary

| Channel | riscv64 available | Notes |
|---|---|---|
| PyPI (`pip install torch`, official) | No | 2.14.1 latest, zero riscv64 files in any version |
| GitHub releases | No | Source tarballs only, no binary wheels for any architecture |
| RISE package registry (GitLab project 56254198) | Yes | torch 2.13.0+cpu, cp312/cp313/cp314/cp314t, native build, 99.998% test pass rate |
| RISE wheel_builder public listing page | No | Not listed, despite 75 other packages present; discrepancy noted above |
| Ubuntu 24.04 / 26.04 | No | Not packaged in Ubuntu at all (any architecture) |
| Debian sid (unstable) | Yes | Packaged for riscv64, not in stable |
| Third-party community repos | Yes (unofficial) | KumaTea, gounthar, xforcevesa builds |

A user who needs upstream-sanctioned riscv64 PyTorch today must either build from source (hours, using the cross-compile toolchain in Section 5) or use RISE's natively-built, heavily-tested but non-upstream wheel.

---

## 9. Dependencies

| Dependency | Role | Relation / Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking issues |
|---|---|---|---|---|---|---|
| OpenBLAS | Default BLAS/LAPACK for CPU matmul | runtime, critical | Green (GCC 14+ required) | Partial -- BLAS L1/L2/L3 under QEMU; LAPACK disabled upstream (QEMU timeout) | v0.3.33-0.3.34 range in Debian sid / RISE build; Ubuntu 24.04 ships an older v0.3.26 | ZVL256B TRSM correctness bug (draft PR #5830, unassigned); LAPACK correctness unvalidated |
| oneDNN | Conv/matmul/pooling primitives; JIT via xbyak_riscv generates RVV code | runtime, critical | Green (GCC 14; JIT compiles and emits RVV) | Green for smoke tests under QEMU only; no native-hardware CI | Debian sid `libdnnl3.6`; status "Experimental"; PyTorch CI forces `USE_MKLDNN=0` despite cmake-level support | INT8 quantized conv/matmul missing; f16 reduction overflow (oneDNN PR #5361, open); LLVM libomp native build fails ([llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026)), blocking Clang-toolchain deployments |
| XNNPACK | Mobile/edge inference kernels; largest RVV body in the PyTorch dependency tree (344 production RVV source files + 212 RVV-FP16 files) | runtime, critical | Green (cross-compile via Clang+QEMU) but **not enabled by default** (riscv64 missing from the cmake architecture allowlist) | **Broken** -- 100+ RVV FP16 tests failing ([google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886)); operator tests permanently excluded from CI | No binary releases; Debian sid build from a Nov-2024 snapshot | Root cause is a missing `cpuinfo_has_riscv_zvfh()` API in cpuinfo (cross-project blocker); the `xnn_arch_riscv_vector_fp16_arith` flag is unconditionally enabled, bypassing the cpuinfo Zvfh check; BF16 absent |
| cpuinfo | Runtime ISA/topology detection; source of truth for RVV/Zvfh dispatch across XNNPACK and ATen | runtime, critical | Green -- Linux riscv64 builds; Android riscv64 CI added 2024 | Green for basic functionality under QEMU | No standalone binary release | Missing `cpuinfo_has_riscv_zvfh()` API directly causes XNNPACK#9886; [pytorch/cpuinfo#148](https://github.com/pytorch/cpuinfo/pull/148) ("Improve support for RISC-V architecture on Linux") open since 2023 |
| SLEEF | SIMD transcendental math (sin/cos/log/exp) | runtime, critical | Green -- riscv64 integrated since v3.6 (Nov 2023) | Green -- CI with QEMU, known flakes fixed Feb 2025 | v3.9.0 (Mar 2025); libsleefdft/libsleefquad enabled since v3.6.1 | None known. PyTorch's own build enables SLEEF only on the ARM vec path; the RVV ATen path is separate and does not currently route through SLEEF |
| FBGEMM | Quantized INT8 server matmul | runtime, optional | **Not supported** (x86/AArch64-only, no architecture guard -- fails to build unless explicitly disabled) | N/A | N/A | riscv64 is not a target; PyTorch disables FBGEMM at configure time on riscv64; combined with no QNNPACK support, there is no quantization backend on riscv64 at all |
| NNPACK | Legacy inference kernels, superseded by XNNPACK | runtime, optional | Unknown -- no riscv64 issues/PRs found; no commits since ~2020 | Unknown | No release | Unmaintained; no RISC-V porting effort |
| psimd | Portable SIMD abstraction used by NNPACK | runtime, optional | Archived (read-only since May 2024) | N/A | N/A | Archived, no future development possible |
| Gloo | CPU collective communications (AllReduce, distributed training) | runtime, optional | Unknown -- no riscv64 issues/PRs found; architecture-agnostic C++ may build | Unknown | No riscv64 binary | No riscv64 porting work tracked; transport layer untested |
| pthreadpool | Thread pool for XNNPACK/NNPACK dispatch | runtime, critical | Green -- pure C, architecture-agnostic | Green | No standalone binary | None known |
| mimalloc | High-performance allocator, auto-enabled on AArch64 | runtime, optional | Likely builds (architecture-agnostic C) | Unknown | No riscv64 binary | Not auto-enabled for riscv64 in PyTorch CMake (ARM-specific gate) |
| Protocol Buffers | Serialization for ONNX/Caffe2 | runtime, critical | Builds (upstream issues #14549/#12266 resolved 2023-2024) | Unknown | No official riscv64 `protoc` binary (prebuilt PRs #23206/#23205 abandoned Aug 2025) | No prebuilt `protoc` for riscv64; PyTorch CI works around this by using the host's `protoc` rather than a cross-built one (Section 5); issue [#116012](https://github.com/pytorch/pytorch/issues/116012) tracks an earlier protoc cross-build failure |
| ONNX (format/schema) | Model exchange format | runtime, optional | Builds (depends on protobuf) | Unknown | No riscv64 binary upstream | Depends on protobuf riscv64 support; no dedicated ONNX riscv64 CI known |
| OpenMP | Pragma parallelism for ATen/oneDNN | runtime, critical | Green with GCC `libgomp`; LLVM `libomp` fails to build natively on riscv64 ([llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026)) | Green with GCC path; LLVM path untestable natively | `libgomp` ships in all distros | LLVM libomp native build failure blocks Clang-toolchain deployments |
| OpenSSL | Optional TLS for Gloo distributed backend | runtime, optional | Green -- full riscv64 support including RVV-accelerated crypto since OpenSSL 3.x | Green (Debian/Ubuntu CI) | Available in all major distros | None known |
| NumPy | Primary numerical interop array library | runtime, critical | Green -- riscv64 CI via QEMU | Green | Official riscv64 wheel on PyPI | None known; cited in issue #141550 as the CI model PyTorch should follow |
| CMake | Build system generator | build, critical | Green; CI pins 4.0.0 via pip in the crossenv, minimum enforced 3.27 | N/A | Available for all architectures via pip/distro | None known |
| GCC | Cross-compiler (riscv64-linux-gnu-gcc) | build, critical | Green; GCC 14 is the pinned, verified version for all riscv64 CI builds (Section 5) | N/A | Ubuntu Noble `gcc-14-riscv64-linux-gnu` cross package | GCC 14.2 has a documented internal-compiler-error on RVV intrinsics in DepthwiseConvKernel.cpp (issue #166057, fixed with a source-level workaround in PR #165717, not a GCC fix); minimum GCC overall is 11.3 but riscv64 CI only exercises GCC 14 |
| LLVM | Alternate compiler / Inductor's `llvm_jit.cpp` target init | build, optional | No Clang path exists for riscv64 anywhere in the PyTorch build scripts; LLVM's own `libomp` fails to build natively on riscv64 | N/A | N/A | llvm-project#87026 (libomp); no RISC-V-specific LLVM target initialization in PyTorch's NNC JIT |
| Python | Interpreter / extension-module target | build, critical | Green; cross-built 3.12.3 into the sysroot via crossenv; `Python_SOABI` fix for cross builds merged ([PR #189388](https://github.com/pytorch/pytorch/pull/189388)) | N/A | Official riscv64 CPython builds exist upstream (outside PyTorch's scope) | Dockerfile and `requirements-ci.txt` pin Python 3.12 independently and "must be bumped together" per an in-repo comment |
| QEMU | User-mode emulation for cross-build tooling and (historically) binfmt_misc execution | test, critical | Green for the one remaining use (Docker image build via buildx `--platform linux/riscv64`) | **Currently unused for test execution** -- the in-tree `riscv64.yml` workflow has no test job at all (Section 7); QEMU's binfmt_misc role for running riscv64 binaries was removed with an older EC2-based build path per a code comment | N/A | Formally the "test-dependency" for riscv64 CI, but the build job specifically routes protoc and SLEEF-tool generation around QEMU to avoid its overhead/flakiness (Section 5) |

---

## 10. Ecosystem Status

PyTorch sits at the base of a very large dependent Python-package ecosystem (torchvision, torchaudio, HuggingFace `transformers`/`tokenizers`/`safetensors`, `timm`, ExecuTorch, and thousands of downstream ML packages), each of which needs its own riscv64 wheel or source build once PyTorch itself is available.

**RISE wheel_builder coverage.** RISE's public wheel_builder catalog ([riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/)) lists 75 riscv64 packages relevant to the ML/scientific stack: numpy, scipy, pandas, pillow, matplotlib, tokenizers, safetensors, ml-dtypes, onnx, among others -- covering much of PyTorch's own runtime dependency surface (Section 9) independently of PyTorch itself. As noted in Section 8, torch/pytorch is not listed on this particular catalog page even though RISE separately hosts torch wheels in its GitLab PyPI package registry (project 56254198); the catalog's omission of torch specifically has not been reconciled by available research.

**Known coverage gap:** no quantization backend exists for riscv64 (neither FBGEMM nor QNNPACK supports it -- Section 9), so any downstream package that assumes INT8/INT4 quantized inference will not work out of the box on riscv64 regardless of PyTorch's own build status.

**Related riscv64 builds found in the RISE ecosystem** (via [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels)): `pytorch-tokenizers` (releases v1.4.1, v1.5.0), `executorch` v1.4.1, and `tensordict`. These indicate active, if partial, riscv64 coverage of PyTorch's immediate downstream package family, ahead of torch itself appearing on the public wheel_builder catalog.

**ExecuTorch.** [riseproject-dev/executorch](https://github.com/riseproject-dev/executorch), a fork of [pytorch/executorch](https://github.com/pytorch/executorch) (PyTorch's on-device/edge inference framework, BSD licensed), exists with riscv64-oriented work; a `pytorch-riscv64-oe24` community build and RISC-V International's own coverage of "Ashling and Embecosm Extend PyTorch AI to RISC-V Embedded Devices" (ExecuTorch on RISC-V microcontrollers) point to separate, more mature edge-inference activity than the main PyTorch training/inference framework. [NEEDS VERIFICATION -- fork activity and release details are from a single research pass and were not independently cross-checked against a second source.]

No published, systematic "fraction of the PyTorch-dependent ecosystem that builds/runs on riscv64" figure exists in any source consulted; the picture above is a coverage sample, not a complete census.

---

## 11. Known Bugs and Active Issues

### 11.1 Open, RISC-V-specific (pytorch/pytorch)

| # | Title | Opened | Notes |
|---|---|---|---|
| [#180975](https://github.com/pytorch/pytorch/issues/180975) | [Tracking] RISC-V PyTorch enablement | 2026-04-21 | Umbrella roadmap, labeled "proposal accepted"; comment thread not retrievable (client-rendered / 403 on API for this session) |
| [#171659](https://github.com/pytorch/pytorch/issues/171659) | [RFC] RISC-V Architecture Support Roadmap for PyTorch | 2026-01-04 | Five-phase roadmap predating/feeding #180975; no benchmark numbers in the RFC itself |
| [#175193](https://github.com/pytorch/pytorch/issues/175193) | ZLib reference outdated in riscv CI dockerfile | 2026-02-17 | Docker builds fail (404 on pinned zlib URL); partially addressed by [PR #189382](https://github.com/pytorch/pytorch/pull/189382) |
| [#147513](https://github.com/pytorch/pytorch/issues/147513) | [RFC] Request for Feedback and Review on PRs Adding RISC-V and RVV Support | 2025-02-20 | Predates the formal tracking issue; requested review of #127867, #135570, #143979 |
| [#141550](https://github.com/pytorch/pytorch/issues/141550) | RISC-V CI support | 2024-11-26 | 12 comments; labeled "triaged" with limited sustained maintainer engagement |
| [#116012](https://github.com/pytorch/pytorch/issues/116012) | Issue with Protoc while building PyTorch for RISC-V | 2023-12-18 | Stale, 0 comments |
| [#99278](https://github.com/pytorch/pytorch/issues/99278) | Build error on libstdc++ header stl_algobase.h on riscv | 2023-04-16 | Labeled good-first-issue, unclaimed, still open |

### 11.2 Closed, RISC-V-specific (historical / regression context)

| # | Title | Closed | Severity |
|---|---|---|---|
| [#166057](https://github.com/pytorch/pytorch/issues/166057) | [RISC-V][RVV][GCC 14.2] GCC ICE when building DepthwiseConvKernel.cpp | 2025-10-22 | Correctness/build (compiler internal-compiler-error on RVV builtin read-modify-write pattern). Exact error: `internal compiler error: in gsi_replace, at gimple-iterator.cc:438`. Reproduces with `-march=rv64gcv` under GCC 14.2; does not reproduce with `-march=rv64gc` (RVV off) or under Clang. Fixed in PyTorch by breaking the read-modify-write chain with a temporary ([PR #165717](https://github.com/pytorch/pytorch/pull/165717)) -- a workaround for a GCC limitation, not a PyTorch semantic bug |
| [#160171](https://github.com/pytorch/pytorch/issues/160171) | Add `__riscv` macro detection to support the scalar backend for RISCV | 2025-08-11 | Build |
| [#160170](https://github.com/pytorch/pytorch/issues/160170) | lintrunner not supported on riscv64 | 2025-08-08 | Tooling |
| [#43359](https://github.com/pytorch/pytorch/issues/43359) | Query regarding support for RISC-V Vector ISA | 2021-01-10 | Early tracking issue |

### 11.3 Related CPU/SIMD correctness bugs (not RISC-V-specific, affect shared vectorized-CPU codegen)

[#198606](https://github.com/pytorch/pytorch/issues/198606) (open) -- Inductor CPU int64 vector multiply signed overflow on AVX2 (silent wrong results when the square wraps). [#196681](https://github.com/pytorch/pytorch/issues/196681) (open) -- Inductor CPU 2D-tiled reduction tail-block heap overflow (SIGABRT) or silent wrong results. [#146508](https://github.com/pytorch/pytorch/issues/146508) (open) -- "Something very wrong with float16 CPU implementation." None of these have a confirmed RISC-V-specific reproduction; they are listed because they touch the same vectorized CPU kernel paths that RVV work shares.

### 11.4 Key open PR blockers

| PR | Title | Blocker |
|---|---|---|
| [#195345](https://github.com/pytorch/pytorch/pull/195345) | Add riscv64 blocklist to test/run_test.py | Draft, open since 2026-08-30 |
| [#189382](https://github.com/pytorch/pytorch/pull/189382) | ubuntu-cross-riscv: fetch zlib from GitHub releases | Open, follow-up to #175237/#175193 |
| [#198351](https://github.com/pytorch/pytorch/pull/198351) | [CPU] Add RVV vectorized kernel for FusedAdam | Open since 2026-09-23 |

The single sharpest confirmed correctness bug in the RISC-V code path is the GCC 14.2 ICE (#166057), already fixed via a source-level workaround.

---

## 12. Objections and Upstream Blockers

**Meta's structural position.** No PyTorch maintainer has formally objected to RISC-V support, but Meta has not committed dedicated resources to it either. Reviews on RISC-V PRs have historically concentrated on a single maintainer, @malfet, with no CODEOWNERS entry or SLA for `module: risc-v`. This lack of a named reviewer has repeatedly been the practical bottleneck: issue #147513 was filed specifically because earlier PRs sat "for months without maintainer attention," and PR #182278 (native, non-QEMU build image) stalled on re-review after revisions were made.

**No CI gating.** riscv64 CI does not gate any PyTorch PR (Section 7). There is no mechanism by which a riscv64 regression would block a merge; RISC-V code paths can accumulate breakage silently until explicitly exercised. PR #187821's accidental cross-compile-guard regression, undetected until PR #194880 fixed it, is a concrete instance of this.

**XNNPACK excluded from default build.** The architecture allowlist in XNNPACK's cmake integration does not include riscv64, so users who do not know to explicitly set `-DUSE_XNNPACK=ON` silently lose the largest body of RISC-V-optimized code in the dependency tree (344 production RVV microkernel files) with only a build-time warning, not an error.

**Cross-project blocker.** The single most concrete technical blocker tying multiple dependencies together is the missing `cpuinfo_has_riscv_zvfh()` API in pytorch/cpuinfo (open PR #148 since 2023), which is the direct root cause of XNNPACK's 100+ failing RVV FP16 tests (XNNPACK#9886). Resolving it requires coordinated changes across cpuinfo and XNNPACK, then updating PyTorch's submodule pins.

**Acceptance probability.** Despite the lack of a formal tier policy or dedicated maintainer, the trajectory through 2025-2026 is positive: a growing, labeled (`module: risc-v`), "proposal accepted" tracking issue; steady merges from ISCAS, Alibaba XuanTie, ZTE and RISE-affiliated contributors; CI infrastructure maturing through multiple iterations (manywheel Dockerfiles, native build images, a fixed cross-compile regression); and a concrete, named out-of-tree-to-in-tree CI path (RISE's pytorch-ci relay working toward PyTorch CI Level 3). The blocking factor is not community willingness to contribute but Meta/core-maintainer review bandwidth and the absence of a committed reviewer or CODEOWNERS line for RISC-V.

---

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** RISE
- **Justification:** PyTorch's only in-tree riscv64 CI, [.github/workflows/riscv64.yml](https://github.com/pytorch/pytorch/blob/main/.github/workflows/riscv64.yml), is opt-in (triggered only by a `ciflow/riscv64/*` tag or manual `workflow_dispatch`, never by `pull_request` or `schedule`) and runs a single job that cross-compiles via QEMU on x86 runners with no test-execution step, so per the CI evidence rule (build riscv64 = yes, test riscv64 = no) this is build-only CI and caps the color at yellow. No official riscv64 wheel exists on PyPI ([pypi.org/pypi/torch/json](https://pypi.org/pypi/torch/json) lists zero riscv64 files across all versions); the only riscv64 releases come from third parties -- RISE's natively-built, heavily tested wheels for torch 2.13.0 (212,038 tests, 99.998% pass rate, [riseproject.dev, 2026-08-18](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)) and Debian sid -- not upstream, so this is not architecture-independent. PyTorch is a general-purpose ML framework, not a speed-differentiator project per the optimization-purpose test, so no optimization-level modifier applies to this grade.
- **Pending work that could change the grade:** The open tracking issue [#180975](https://github.com/pytorch/pytorch/issues/180975) lays out a 4-phase enablement roadmap labeled "proposal accepted." RVV ATen `Vectorized<>` work (the PR #135570/#147513-era line of effort) has not produced a confirmed, currently-merged scalar-to-vector dispatch path, and no RVV `CPUCapability` entry exists in the tree as of this report. PR [#182278](https://github.com/pytorch/pytorch/pull/182278) (native, non-QEMU build image) is stalled on maintainer re-review. The most concrete path from build-only to a tested-and-passing upstream CI grade is RISE's out-of-tree CI relay ([riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci), 870+ jobs, native riscv64 hardware), which is explicitly working toward in-tree PyTorch CI Level 3 (non-blocking PR checks); if that relay is merged in-tree, it would supply the test-execution evidence currently missing from the grade.

---

## 14. Investment Analysis

RISE has already funded or produced substantial work that should not be re-sized: native-hardware CI infrastructure (RISE Runners, 13,000+ jobs across 197 repos; the dedicated pytorch-ci relay, 870+ jobs), a natively-built, extensively tested riscv64 wheel for torch 2.13.0 (212,038 tests run), a milestone contract (RP013) specifically targeting ATen operator and OpenBLAS optimization on RISC-V hardware, and riscv64 wheels for immediate downstream packages (pytorch-tokenizers, executorch, tensordict). The items below are scoped against work not already covered by RISE or by a merged, upstream PR.

### 14.1 Functional Enablement

- **Resolve the cpuinfo Zvfh gap.** Add `cpuinfo_has_riscv_zvfh()` to pytorch/cpuinfo (open PR #148 since 2023), then update XNNPACK's FP16 arithmetic flag ([XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886)) to use it instead of unconditionally enabling it, then bump the submodule pins in pytorch/pytorch. Two-repo, cross-project coordination. Priority: Critical (FP16 inference is currently broken on all Zvfh-capable riscv64 hardware going through XNNPACK).
- **Enable XNNPACK for riscv64 by default.** Add riscv64 to the cmake architecture allowlist, contingent on the FP16 fix above landing first. Priority: High (without this, 344 production RVV microkernels are invisible to a default build).
- **Land a CODEOWNERS / named-reviewer entry for `module: risc-v`.** The single largest recurring bottleneck across the PR history (Section 2, 12) is review latency from a single, unassigned maintainer. Priority: High, low cost (process, not code).
- **Merge PR #189382 and close out #175193** (zlib pin). Small, already in flight. Priority: Medium.

### 14.2 Performance Optimization

- **Land RVV support in ATen's `Vectorized<>` dispatch layer.** This is the prerequisite for any RVV-accelerated elementwise/vectorizable op and for the Phase 2 micro-kernel library in #180975; status of the existing line of work (PR #135570 and its successors) is unresolved in current search results and should be re-verified directly against the repository before sizing.
- **Validate and enable the oneDNN backend in CI.** `USE_MKLDNN=0` is hardcoded in CI despite cmake-level RVV JIT support (PR #166602) and a reported 8.85x speedup on elementwise multiply on SG2044 that has not been independently validated in PyTorch's own CI.
- **Phase 2 micro-kernel library (tracking issue #180975, Phase 2).** GEMM/Conv/attention/normalization/activation kernels for RVV, analogous to ARM's KleidiAI. Stated intent from XuanTie/ISCAS; no PRs confirmed as filed in the live search. This is the largest single investment item and the actual performance unlock; everything else in this section is a prerequisite for it.

### 14.3 CI/CD Infrastructure

- **Merge PR #182278** (native, non-QEMU build image), pending maintainer re-review.
- **Add a test-execution job to `riscv64.yml`** using native hardware (RISE can supply runners). This is the single structural change that would move the project's color grade past yellow, since the CI evidence rule requires a passing test step, not just a build step.
- **Pursue RISE's pytorch-ci relay reaching PyTorch CI Level 3 in-tree** (non-blocking PR checks), which RISE has already stated as its own near-term goal.

### 14.4 Ecosystem Enablement

- **torch.compile / Inductor RVV backend (Phase 3, #180975).** No confirmed work has started in the live search; a large, multi-quarter effort (Triton-RISCV, buddy-mlir backend).
- **Triton / TileLang RISC-V backends (Phase 4, #180975).** Dependent on Phase 3; out of scope to size here.
- **Close the quantization gap.** Neither FBGEMM nor QNNPACK supports riscv64; any downstream package assuming INT8/INT4 quantized inference needs a separate quantization backend story for riscv64 regardless of the core framework's status.
- **Reconcile and publicize torch's presence on RISE's wheel_builder catalog**, since the package currently exists in RISE's GitLab PyPI registry but not on the public wheel_builder listing page, creating discoverability friction for users following RISE's documented package list.

### 14.5 Summary Table

| Area | Work Item | Effort | Owner | Priority |
|---|---|---|---|---|
| Functional | cpuinfo `cpuinfo_has_riscv_zvfh()` + XNNPACK FP16 fix | Data not available: no person-week estimate found in research; cross-repo coordination (cpuinfo + XNNPACK + submodule bump in pytorch/pytorch) | cpuinfo/XNNPACK maintainers, RISE | Critical |
| Functional | Enable XNNPACK for riscv64 by default | Data not available: no estimate in research | Any contributor | High |
| Functional | Named reviewer / CODEOWNERS for `module: risc-v` | Data not available: process change, no estimate in research | RISE / Meta | High |
| Functional | Close zlib pin issue (#175193 / PR #189382) | Data not available: no estimate in research | Existing PR author | Medium |
| Performance | RVV ATen `Vectorized<>` dispatch | Data not available: status of existing PR line unresolved in research, re-verify before sizing | ISCAS / malfet decision needed | Critical |
| Performance | Validate + enable oneDNN in CI | Data not available: no estimate in research | ISCAS / XuanTie | High |
| Performance | Phase 2 micro-kernel library (GEMM, attention, normalization) | Data not available: no estimate in research; stated intent only, no PRs confirmed | XuanTie / ISCAS (stated intent) | High |
| CI/CD | Merge native build image PR #182278 | Data not available: no estimate in research; revisions already made, needs re-review | luhenry / malfet re-review | High |
| CI/CD | Add native-hardware test job to riscv64.yml | Data not available: no estimate in research | RISE + Meta | High (grade-determining) |
| CI/CD | RISE pytorch-ci relay to in-tree CI Level 3 | Data not available: RISE's own stated goal, no committed date found | RISE | Medium |
| Ecosystem | torch.compile / Inductor RVV backend (Phase 3) | Data not available: no estimate in research | XuanTie / ISCAS | Low |
| Ecosystem | Triton / TileLang RISC-V (Phase 4) | Data not available: not scoped in any source | -- | Low |
| Ecosystem | Quantization backend for riscv64 (FBGEMM/QNNPACK gap) | Data not available: no estimate in research | Unassigned | Medium |

Note: the research available for this report did not contain person-week or other effort-unit estimates for any of these items (no project planning document or staffing estimate was found in the live findings); each "Data not available" entry above reflects that gap rather than an assumption. Any effort sizing should be produced as a separate engineering estimation exercise before committing resources.

---

## 15. References

1. [pytorch/pytorch tracking issue #180975](https://github.com/pytorch/pytorch/issues/180975) -- RISC-V enablement roadmap, opened 2026-04-21
2. [pytorch/pytorch issue #171659](https://github.com/pytorch/pytorch/issues/171659) -- RISC-V Architecture Support Roadmap RFC, opened 2026-01-04
3. [pytorch/pytorch issue #147513](https://github.com/pytorch/pytorch/issues/147513) -- RFC requesting review of RISC-V/RVV PRs, opened 2025-02-20
4. [pytorch/pytorch issue #141550](https://github.com/pytorch/pytorch/issues/141550) -- RISC-V CI support, opened 2024-11-26
5. [pytorch/pytorch issue #175193](https://github.com/pytorch/pytorch/issues/175193) -- ZLib reference outdated in riscv CI dockerfile
6. [pytorch/pytorch issue #116012](https://github.com/pytorch/pytorch/issues/116012) -- Protoc build issue for RISC-V
7. [pytorch/pytorch issue #99278](https://github.com/pytorch/pytorch/issues/99278) -- libstdc++ build error on riscv
8. [pytorch/pytorch issue #166057](https://github.com/pytorch/pytorch/issues/166057) -- GCC 14.2 ICE in DepthwiseConvKernel.cpp
9. [pytorch/pytorch PR #127867](https://github.com/pytorch/pytorch/pull/127867) -- First RVV kernel (DepthwiseConvKernel), merged July 2024
10. [pytorch/pytorch PR #135570](https://github.com/pytorch/pytorch/pull/135570) -- RVV support for ATen `Vec`
11. [pytorch/pytorch PR #143979](https://github.com/pytorch/pytorch/pull/143979) -- First opt-in riscv CI build, merged Aug 2025
12. [pytorch/pytorch PR #165717](https://github.com/pytorch/pytorch/pull/165717) -- GCC ICE workaround
13. [pytorch/pytorch PR #166602](https://github.com/pytorch/pytorch/pull/166602) -- oneDNN backend for RISC-V, merged Nov 2025
14. [pytorch/pytorch PR #167071](https://github.com/pytorch/pytorch/pull/167071) -- cpp_builder riscv `-march=native` fix
15. [pytorch/pytorch PR #182278](https://github.com/pytorch/pytorch/pull/182278) -- Native build image for linux-riscv64, 1st iteration
16. [pytorch/pytorch PR #190887](https://github.com/pytorch/pytorch/pull/190887) -- Native build image for linux-riscv64, 2nd iteration
17. [pytorch/pytorch PR #183254](https://github.com/pytorch/pytorch/pull/183254) -- RISC-V native fp16 conversion paths
18. [pytorch/pytorch PR #184297](https://github.com/pytorch/pytorch/pull/184297) -- Inductor `cpp.march` knob
19. [pytorch/pytorch PR #187821](https://github.com/pytorch/pytorch/pull/187821) -- Rename RISC-V cross-compilation image
20. [pytorch/pytorch PR #194880](https://github.com/pytorch/pytorch/pull/194880) -- Route riscv64 job back onto cross-compilation path
21. [pytorch/pytorch PR #191225](https://github.com/pytorch/pytorch/pull/191225) -- manywheel Dockerfile for riscv64 (merged then reverted)
22. [pytorch/pytorch PR #191657](https://github.com/pytorch/pytorch/pull/191657) -- cpu-riscv64 support in manywheel scripts (replacement)
23. [pytorch/pytorch PR #189382](https://github.com/pytorch/pytorch/pull/189382) -- zlib fetch fix for ubuntu-cross-riscv
24. [pytorch/pytorch PR #195345](https://github.com/pytorch/pytorch/pull/195345) -- riscv64 blocklist for test/run_test.py
25. [pytorch/pytorch PR #198351](https://github.com/pytorch/pytorch/pull/198351) -- RVV vectorized kernel for FusedAdam
26. [pytorch/pytorch PR #194691](https://github.com/pytorch/pytorch/pull/194691) -- Linear cross entropy ULP tolerance scoped to RISC-V
27. [pytorch/pytorch PR #189388](https://github.com/pytorch/pytorch/pull/189388) -- `Python_SOABI` fix for cross-compiling
28. [pytorch/pytorch PR #190003](https://github.com/pytorch/pytorch/pull/190003) -- Forward cross-compilation toolchain variables
29. [pytorch/pytorch PR #189000](https://github.com/pytorch/pytorch/pull/189000) -- RISC-V `rdtime` fast path for `getApproximateTime`
30. [pytorch/pytorch PR #188999](https://github.com/pytorch/pytorch/pull/188999) -- RISC-V Zihintpause CPU pause hint
31. [pytorch/pytorch PR #183649](https://github.com/pytorch/pytorch/pull/183649) -- Migrate riscv64.yml to OSDC (ARC)
32. [pytorch/pytorch PR #168094](https://github.com/pytorch/pytorch/pull/168094) -- Use c7i.2xlarge for riscv64 build
33. [pytorch/pytorch PR #177722](https://github.com/pytorch/pytorch/pull/177722) -- riscv64 manywheel Docker image
34. [pytorch/pytorch PR #178778](https://github.com/pytorch/pytorch/pull/178778) -- Restrict mkl installation to x86 only
35. [pytorch/pytorch PR #173663](https://github.com/pytorch/pytorch/pull/173663) -- Disable cuda-bindings on riscv64 CI
36. [pytorch/pytorch PR #173993](https://github.com/pytorch/pytorch/pull/173993) -- Enable lintrunner on riscv64 build
37. [pytorch/pytorch PR #160172](https://github.com/pytorch/pytorch/pull/160172) -- Add build support for RISCV
38. [pytorch/pytorch PR #141552](https://github.com/pytorch/pytorch/pull/141552) -- Doc guide for building riscv PyTorch from scratch
39. [pytorch/pytorch PR #140816](https://github.com/pytorch/pytorch/pull/140816) -- Original RISC-V CI attempt, closed/superseded
40. [pytorch/pytorch PR #195354](https://github.com/pytorch/pytorch/pull/195354) -- flagged as likely mislabeled / unrelated to RISC-V
41. [.github/workflows/riscv64.yml](https://github.com/pytorch/pytorch/blob/main/.github/workflows/riscv64.yml) -- dedicated riscv64 CI workflow
42. [RISE blog: PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) -- 2026-08-18
43. [RISE blog: RISE RISC-V Runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) -- 2026-05-12
44. [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/) -- 2025-05-14
45. [RISE wheel_builder catalog](https://riseproject.gitlab.io/python/wheel_builder/)
46. [RISE Project RP013 milestone contract (Confluence)](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/453148705/)
47. [riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci) -- RISE out-of-tree CI
48. [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels) -- pytorch-tokenizers, executorch, tensordict riscv64 builds
49. [riseproject-dev/executorch](https://github.com/riseproject-dev/executorch) -- ExecuTorch RISC-V fork
50. [PyPI torch package JSON](https://pypi.org/pypi/torch/json) -- no riscv64 binary in any version
51. [Ubuntu package search, resolute suite](https://packages.ubuntu.com/search?keywords=pytorch&suite=resolute&searchon=names) -- no pytorch package found
52. [google/XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886) -- 100+ RVV FP16 test failures
53. [pytorch/cpuinfo PR #148](https://github.com/pytorch/cpuinfo/pull/148) -- Improve RISC-V support on Linux
54. [llvm-project issue #87026](https://github.com/llvm/llvm-project/issues/87026) -- LLVM libomp native riscv64 build failure
55. [PyTorch Forums: PyTorch RISC-V support](https://discuss.pytorch.org/t/pytorch-risc-v-support/212065)
56. [Inference performance of large language models on a 64-core RISC-V CPU with silicon-enabled vectors](https://www.sciencedirect.com/science/article/abs/pii/S0167739X25005369) -- ScienceDirect
57. [Exploring energy consumption of AI frameworks on a 64-core RV64 Server CPU](https://arxiv.org/html/2504.03774v1) -- arXiv
58. [RISC-V International: Enabling High Performance RISC-V Software for AI in the Real World](https://riscv.org/blog/enabling-high-performance-risc-v-software-for-ai-in-the-real-world/)
59. [RISC-V International: Ashling and Embecosm Extend PyTorch AI to RISC-V Embedded Devices](https://riscv.org/blog/ashling-and-embecosm-extend-pytorch-ai-to-risc-v-embedded-devices/)
60. [PyTorch governance (TAC)](https://github.com/pytorch-fdn/tac)
61. [docs.pytorch.org governance documentation](https://docs.pytorch.org/docs/main/community/governance.html)
62. [KumaTea/pytorch-riscv64](https://github.com/KumaTea/pytorch-riscv64) -- third-party wheel repo
63. [gounthar/riscv64-python-wheels](https://github.com/gounthar/riscv64-python-wheels) -- third-party wheel repo
64. [xforcevesa/pytorch-riscv64-oe24](https://github.com/xforcevesa/pytorch-riscv64-oe24) -- OpenEuler riscv64 build