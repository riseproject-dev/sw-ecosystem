---
title: ncnn
parent: Project Reports
color: blue
---

# ncnn

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for ncnn<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

ncnn is a high-performance neural network inference framework optimized for mobile and embedded deployment. It is written in C++ with no external runtime dependencies for inference, supports a wide range of neural network operators, and provides model conversion tools from ONNX, Caffe, and other formats. The project is licensed under BSD 3-Clause, copyright Tencent 2017.

**Governance:** Corporate BDFL. A single maintainer, GitHub handle nihui, a Tencent employee confirmed via GitHub org membership, drives approximately 2,690 of roughly 3,100 total commits (approximately 87%). There is no CODEOWNERS file, no MAINTAINERS file, no TSC, and no documented contribution process beyond acknowledgements in CONTRIBUTING.md. Secondary contributors include BUG1989 (Axera, int8 quantization), zchrissirhcz (71 commits, general), and tpoisonooo (37 commits, general). No CLA is documented.

**RISE Project involvement:** None. ncnn is not a named RISE project, has no RISE blog coverage, is not tracked in the RISE AI/ML Working Group projects list, and does not use RISE riscv64 CI runners. The RISE wheel builder redirects ncnn PyPI queries directly to upstream PyPI rather than maintaining a separate build. SpacemiT (a RISE member) hardware appears in ncnn benchmarks, and SiFive (a RISE member) U74 cores power the VisionFive2 board used in ncnn CI, but neither constitutes RISE project involvement.

**Community stance on new ports:** Pragmatically open but nihui-gated. No formal RFC or proposal process. New architecture support has historically been accepted when nihui or a trusted contributor does the work and adds CI. Community channels are QQ groups, Telegram (t.me/ncnnyes), and Discord (discord.gg/YRsxgmF).

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the main Tencent/ncnn repository. There is no downstream fork or staging branch.

| Date | Event | Source |
|------|-------|--------|
| 2020-07-22 | First riscv64 Linux CI added | [PR #1951](https://github.com/Tencent/ncnn/pull/1951) |
| 2021-04-24 | First RISC-V commit: runtime V detection, initial C906 toolchain | commit 45bf3cd779a7 |
| 2021-04-26 | RVV spec 0.7.1 support for C906 | [PR #2868](https://github.com/Tencent/ncnn/pull/2868) |
| 2021-05-04 | RVV CI coverage added | [PR #2886](https://github.com/Tencent/ncnn/pull/2886) |
| 2021-06-12 | RVV optimization for AbsVal and ReLU | [PR #3001](https://github.com/Tencent/ncnn/pull/3001) |
| 2021-08-12 | Riscv64 C906/D1 RVV 0.7.1 operator batch | [PR #3159](https://github.com/Tencent/ncnn/pull/3159) |
| 2021-12-25 | C906 v223 toolchain added | [PR #3449](https://github.com/Tencent/ncnn/pull/3449) |
| 2022-06-18 | Winograd convolution for RISC-V | [PR #3921](https://github.com/Tencent/ncnn/pull/3921) |
| 2022-10-01 | Clang CI for RVV; new segment load/store interface | [PR #4118](https://github.com/Tencent/ncnn/pull/4118) |
| 2022-10-02 | C906 build CI | [PR #4232](https://github.com/Tencent/ncnn/pull/4232) |
| 2022-10-12 | TH1520 toolchain support | [PR #4267](https://github.com/Tencent/ncnn/pull/4267) |
| 2023-09-22 | Fix build with vanilla C906 toolchain | [PR #5048](https://github.com/Tencent/ncnn/pull/5048) |
| 2023-10-20 | RISC-V float32 GEMM | [PR #4903](https://github.com/Tencent/ncnn/pull/4903) |
| 2024-12-04 | Port all RVV intrinsics from 0.7.1 to ratified RVV 1.0 standard | [PR #5642](https://github.com/Tencent/ncnn/pull/5642) |
| 2024-12-22 | ruapu updated to detect zfh, zvfh, xtheadvector | [PR #5841](https://github.com/Tencent/ncnn/pull/5841) |
| 2024-12-25 | XuanTie C908 CI added | [PR #5850](https://github.com/Tencent/ncnn/pull/5850) |
| 2024-12-25 | SpacemiT X60 CI added | [PR #5852](https://github.com/Tencent/ncnn/pull/5852) |
| 2026-01-09 | Python riscv64 wheels released to PyPI | [PR #6494](https://github.com/Tencent/ncnn/pull/6494) |
| 2026-02-20 | DeformableConv2D RVV implementation | [PR #6540](https://github.com/Tencent/ncnn/pull/6540) |
| 2026-02-27 | RISC-V GEMM fp16 | [PR #5311](https://github.com/Tencent/ncnn/pull/5311) |
| 2026-04-17 | RVV 1.0 Quantize layer | [PR #6636](https://github.com/Tencent/ncnn/pull/6636) |
| 2026-05-18 | RVV 1.0 Dequantize and Requantize layers | [PR #6658](https://github.com/Tencent/ncnn/pull/6658), [PR #6695](https://github.com/Tencent/ncnn/pull/6695) |
| 2026-05-20 | Packed convolution optimization | [PR #6731](https://github.com/Tencent/ncnn/pull/6731) |
| 2026-05-21 | SDPA (attention) RVV support | [PR #6557](https://github.com/Tencent/ncnn/pull/6557) |
| 2026-05-25 | im2col GEMM and Winograd convolution optimization; CI toolchain update | [PR #6740](https://github.com/Tencent/ncnn/pull/6740), [PR #6742](https://github.com/Tencent/ncnn/pull/6742) |
| 2026-08-04 | GEMM block quantization optimization (multi-arch including RISC-V) | [PR #6831](https://github.com/Tencent/ncnn/pull/6831) |

**Key contributors to RISC-V work:** nihui (Tencent, primary), MollySophia (PR #5354, int8 convolution WIP), Deepdive543443/Justin Fung (PR #6763, packed INT8 convolution), and a set of community contributors adding individual operator RVV implementations.

The port is fully upstream. No downstream staging exists.

---

## 3. Upstream Support Tier

No formal tier policy is documented. There is no PLATFORMS.md, SUPPORT.md, or equivalent. The implicit tier structure, inferred from CI coverage and release artifact presence, is:

| Tier | Platforms | Evidence |
|------|-----------|----------|
| Tier 1 (prebuilt binaries + CI) | Android, iOS, Windows (VS2015-VS2022), Ubuntu 22.04/24.04 (x86_64/aarch64), macOS, WebAssembly, HarmonyOS | GitHub release assets present |
| Tier 2 (CI only, no prebuilt binaries) | Linux riscv64, ppc64, mips, mips64, loongarch64, arm, aarch64 | CI workflows present; no release zips |
| Tier 3 (community/bare-metal) | elf-riscv32/64, ESP32 | Spike simulator CI; no Linux userspace |

**riscv64 is Tier 2.** CI builds and tests pass. No prebuilt binary release artifacts exist for riscv64 in any GitHub release (verified against releases 20260526, 20260113, 20250916). The Ubuntu release zips target x86_64 and aarch64 only.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI builds | Yes | Yes | Yes |
| CI tests run | Yes | Yes | Yes (QEMU) |
| Prebuilt release binary | Yes | Yes | No |
| Ubuntu .deb package | No | No | No |
| PyPI wheel | Yes | Yes | Yes (cp38-cp314) |
| Android NDK build | Yes | Yes | Yes (build-only) |

ncnn is not packaged in Ubuntu at all (libncnn-dev absent from resolute/questing/noble/jammy). The PyPI wheel is the only upstream-published riscv64 binary artifact.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

ncnn's architecture is a hand-optimized layer library. Each neural network operator has a platform-specific implementation directory. For RISC-V, this is `src/layer/riscv/`, containing 180 files.

**ISA extension coverage:**

| Extension | Usage in riscv64 layer code |
|-----------|----------------------------|
| RVV 1.0 (`__riscv_vector`) | Primary SIMD path for all layer kernels; vfloat32mN_t, vint32mN_t, vfmacc intrinsics |
| Zvfh (`__riscv_zvfh`) | FP16 vector ops; vfloat16mN_t; all `*_zfh.cpp` files |
| Zfh (`__riscv_zfh`) | Scalar FP16 fallback when Zvfh unavailable |
| XTheadVector | T-Head pre-standard vector (C906/C910); separate dispatch path |
| Zba/Zbb/Zbc/Zbs | Toolchain `-march=` flags only; no intrinsics in layer code |
| Zvbb/Zvbc/Zvkb | Not used in any layer code |
| BF16/Zvfbfmin | Probed in ruapu but no layer implementation uses it |

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| GEMM (FP32) | AVX/AVX2/AVX512 intrinsics | NEON/ASIMD intrinsics | RVV 1.0 intrinsics, VLEN-adaptive |
| GEMM (FP16) | F16C intrinsics | NEON fp16 | RVV 1.0 Zvfh intrinsics |
| GEMM (INT8) | VNNI intrinsics | dotprod intrinsics | RVV 1.0 intrinsics (merged); packed INT8 conv pending PR #6763 |
| GEMM (INT4 weight block) | Merged (#6831) | Merged (#6831) | Merged (#6831); INT4 extension pending PR #6890 |
| Winograd convolution | Yes | Yes | Yes (RVV 1.0) |
| Depthwise convolution | Yes | Yes | Yes (RVV 1.0, 3x3 and 5x5 packn) |
| Attention (SDPA) | Yes | Yes | Yes (RVV 1.0, merged 2026-05-21) |
| Transcendentals (exp, log, sin, cos, tanh, sigmoid) | Yes | Yes | Yes (rvv_mathfun.h, 85 KB, LMUL 1/2/4/8) |
| FP16 transcendentals | Yes | Yes | Yes (rvv_mathfun_fp16s.h, 55 KB) |
| LSTM | Yes | Yes | No RVV path (PR #6736 open) |
| ELU/ERF/GELU/SELU | Yes | Yes | No RVV path (PR #6608 open) |
| Scale operator | Yes | Yes | No RVV path (PR #6931 open) |
| Runtime CPU dispatch | Yes | Yes | Yes (ruapu, csrr_vlenb) |
| JIT | No | No | No |
| Assembly (.S files) | No | No | No |

**VLEN adaptivity:** `csrr_vlenb()` is used at runtime in kernel headers (e.g., `gemm_wq_int8.h`) to select 128-bit vs 256-bit tile sizes. This is correct behavior for RVV's variable-length model.

**Dispatch model:** CMake probes at configure time for RVV 1.0 tuple intrinsics (`__riscv_vcreate_v_f32m1x2`), Zfh, Zvfh, and XTheadVector. Each layer registers separate compiled variants (`*_rvv`, `*_zfh`, `*_xtheadvector`) via `ncnn_add_arch_opt_layer`. Runtime selection uses `cpu_support_riscv_v()`, `cpu_support_riscv_zvfh()`, and `cpu_support_riscv_xtheadvector()` from `src/cpu.cpp`.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Toolchain minimum versions:**

| Toolchain | Minimum for RVV 1.0 | CI version | Why |
|-----------|---------------------|------------|-----|
| GCC (upstream riscv-gnu-toolchain) | GCC 12 (basic); GCC 14 recommended | 2026.05.19 nightly | CMake probes `__riscv_vcreate_v_f32m1x2` (RVV 1.0 tuple intrinsic); absent in GCC < 12 |
| Clang/LLVM | LLVM 17 | Same nightly bundle | LLVM 17 added full RVV 1.0 intrinsics including tuple types |
| Ubuntu 22.04 distro GCC 11 | Fails RVV 1.0 probe | N/A | `NCNN_RVV` forced OFF with warning |
| Ubuntu 24.04 distro GCC 13 | Likely passes | N/A | Basic RVV 1.0 present [NEEDS VERIFICATION] |
| Xuantie-900-gcc | V3.1.0 minimum; V3.4.0 in CI | V3.4.0 | `xtheadvector` is a vendor extension absent from upstream GCC |
| SpacemiT toolchain | v1.2.4 (CI version) | v1.2.4 | Required for SpacemiT K1 `-march=rv64gc_zba_zbb_zbc_zbs_zicbop` |

**Generic riscv64 Linux build (distro cross-compiler, no RVV):**
```bash
sudo apt-get install g++-riscv64-linux-gnu
mkdir build && cd build
cmake -DCMAKE_TOOLCHAIN_FILE=../toolchains/riscv64-linux-gnu.toolchain.cmake \
      -DNCNN_BUILD_TESTS=ON ..
cmake --build . -j$(nproc)
TESTS_EXECUTABLE_LOADER=qemu-riscv64 \
TESTS_EXECUTABLE_LOADER_ARGUMENTS="-L;/usr/riscv64-linux-gnu" \
ctest --output-on-failure -j$(nproc)
```

**RVV 1.0 build (upstream toolchain):**
```bash
export RISCV_ROOT_PATH=/path/to/riscv64-glibc-toolchain
mkdir build && cd build
cmake -DCMAKE_TOOLCHAIN_FILE=../toolchains/riscv64-unknown-linux-gnu.toolchain.cmake \
      -DNCNN_BUILD_TESTS=ON ..
cmake --build . -j$(nproc)
TESTS_EXECUTABLE_LOADER=qemu-riscv64 \
TESTS_EXECUTABLE_LOADER_ARGUMENTS="-cpu;rv64,v=true,zfh=true,zvfh=true,vlen=256,elen=64,vext_spec=v1.0;-L;/path/to/sysroot" \
ctest --output-on-failure -j8
```

**T-Head C906 build:**
```bash
export RISCV_ROOT_PATH=/path/to/Xuantie-900-gcc-linux-6.6.36-glibc-x86_64-V3.4.0
mkdir build && cd build
cmake -DCMAKE_TOOLCHAIN_FILE=../toolchains/c906-v310.toolchain.cmake \
      -DNCNN_OPENMP=OFF -DNCNN_THREADS=OFF -DNCNN_RUNTIME_CPU=OFF \
      -DNCNN_RVV=OFF -DNCNN_XTHEADVECTOR=ON -DNCNN_ZFH=ON -DNCNN_ZVFH=OFF \
      -DNCNN_SIMPLEOCV=ON -DNCNN_BUILD_EXAMPLES=ON ..
cmake --build . -j4
```

**SpacemiT K1 build:**
```bash
export RISCV_ROOT_PATH=/path/to/spacemit-toolchain-linux-glibc-x86_64-v1.2.4
mkdir build && cd build
cmake -DCMAKE_TOOLCHAIN_FILE=../toolchains/k1.toolchain.cmake \
      -DNCNN_OPENMP=ON -DNCNN_THREADS=ON -DNCNN_RUNTIME_CPU=OFF \
      -DNCNN_RVV=ON -DNCNN_XTHEADVECTOR=OFF -DNCNN_ZFH=ON -DNCNN_ZVFH=ON \
      -DNCNN_SIMPLEOCV=ON -DNCNN_BUILD_TESTS=ON ..
cmake --build . -j8
```

**QEMU note:** The `gcc-riscv64` CI job builds QEMU from source at commit `f5643914` with a custom patch (`0007-linux-user-Expose-risc-v-V-isa-bit-in-get_elf_hwcap.patch`) to expose the V extension capability bit in `AT_HWCAP`. Without this patch, `NCNN_RUNTIME_CPU=ON` builds fail to detect RVV support under QEMU user-mode. Self-hosted jobs use xuantie-qemu V5.4.1 (T-Head targets) and jdsk-qemu v10.0.2 (SpacemiT target).

**Key CMake flags for riscv64:**

| Flag | Default | When to override |
|------|---------|-----------------|
| `NCNN_RVV` | ON if compiler supports | OFF for C906/C910 (use XTheadVector); OFF for distro GCC 11 |
| `NCNN_XTHEADVECTOR` | ON if compiler supports | OFF for C908 and upstream GCC/Clang |
| `NCNN_ZVFH` | ON if conditions met | OFF for C906/C910 |
| `NCNN_RUNTIME_CPU` | ON | Always OFF for cross-compilation to a fixed target |
| `NCNN_OPENMP` | ON | OFF for C906 (single-core) and bare-metal |
| `NCNN_BUILD_TOOLS` | ON | OFF for cross-compilation (tools run on host) |
| `NCNN_SIMPLEOCV` | OFF | ON for embedded targets without libopencv |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (operations with no RVV path as of 2026-08-28):**

| Operator | arm64 | amd64 | riscv64 | Open PR |
|----------|-------|-------|---------|---------|
| LSTM | RVV-equivalent | Yes | Scalar only | [PR #6736](https://github.com/Tencent/ncnn/pull/6736) |
| ELU/ERF/GELU/SELU | Yes | Yes | Scalar only | [PR #6608](https://github.com/Tencent/ncnn/pull/6608) |
| Scale | Yes | Yes | Scalar only | [PR #6931](https://github.com/Tencent/ncnn/pull/6931) |
| Packed INT8 convolution | Yes (dotprod) | Yes (VNNI) | Pending | [PR #6763](https://github.com/Tencent/ncnn/pull/6763) |
| INT4 weight block quant GEMM | Merged | Merged | Pending | [PR #6890](https://github.com/Tencent/ncnn/pull/6890) |
| GEMM microkernel (refactored) | Stable | Stable | Refactor pending | [PR #6752](https://github.com/Tencent/ncnn/pull/6752) |

**Performance gaps (benchmark data from `benchmark/README.md`):**

The most significant performance gap is INT8 inference. On all tested RISC-V hardware, INT8 is slower than FP32 because the packed INT8 convolution kernel (PR #6763) is not yet merged. Once merged, the PR author reports 9-28x speedup on SpacemiT X60 for standard models.

FP32 inference on RISC-V is 20-45x slower than comparable ARM64 (Cortex-A76) hardware:

| Model | SpacemiT X60 8T FP32 (ms) | RK3588 A76 4T FP32 (ms) | Ratio |
|-------|--------------------------|------------------------|-------|
| squeezenet | 195.61 | 7.07 | 28x slower |
| mobilenet | 266.42 | 5.72 | 47x slower |
| googlenet | 788.60 | 16.65 | 47x slower |
| resnet18 | 869.32 | 15.08 | 58x slower |
| resnet50 | 1825.00 | 28.28 | 65x slower |

This gap reflects hardware clock speed and core count differences, not solely software optimization gaps. The SpacemiT X60 runs at 1.6 GHz with 8 cores; the RK3588 A76 runs at 2.4 GHz with 4 cores. The software optimization gap (missing packed INT8, missing LSTM/ELU/GELU RVV) is a secondary contributor.

**GPU (Vulkan) on RISC-V boards:** PowerVR BXE/BXM series GPUs present on VisionFive2 and SpacemiT MUSE Pi Pro are consistently slower than the CPU RVV path for most models. On VisionFive2, GPU is 2.4-3.0x slower than CPU for squeezenet and mobilenet. On SpacemiT MUSE Pi Pro, GPU is 1.95-2.99x slower for small models; GPU is faster only for vgg16 (5796ms GPU vs 8405ms CPU). This is a hardware characteristic, not an ncnn software issue.

**Correctness issues:** See Section 11.

**Floating-point semantics:** No documented riscv64-specific NaN or floating-point semantics divergence found in research. [NEEDS VERIFICATION - no dedicated floating-point conformance testing data found in research findings.]

---

## 7. CI/CD Infrastructure

**riscv64 CI exists and tests pass.** The `linux-riscv64.yml` workflow triggers on push and pull_request to master, path-filtered to riscv layer files, tests, examples, and benchmark.

| Job | Runner | Toolchain | Test execution |
|-----|--------|-----------|----------------|
| `gcc-riscv64` | `ubuntu-latest` (GitHub-hosted x86) | `g++-riscv64-linux-gnu` (apt) | Custom QEMU from source (f5643914 + RVV hwcap patch); `qemu-riscv64 -L /usr/riscv64-linux-gnu` |
| `xuantie` (c906, c910, c908, c907) | `self-hosted, linux, ubuntu` | Xuantie-900-gcc V3.4.0 | xuantie-qemu V5.4.1; CPUs: c906fdv, c910v, c908v, c907fdv-rv64 |
| `spacemit` (x60) | `self-hosted, linux, ubuntu` | SpacemiT GCC v1.2.4 + LLVM | jdsk-qemu v10.0.2; CPU: `max,vlen=256,elen=64,vext_spec=v1.0` |
| `gcc-rvv` | `self-hosted, linux, ubuntu` | riscv-gnu-toolchain 2026.05.19 | QEMU at `/data/action/osd/qemu-install`; vlen=256 and vlen=128 |
| `clang-rvv` | `self-hosted, linux, ubuntu` | Same toolchain, LLVM frontend | Same QEMU; vlen=256 and vlen=128 |
| `rv64gc` (elf) | `self-hosted, linux, centos` | riscv64-unknown-elf bare-metal | Spike ISA simulator; `--isa=rv64gc` |

Additional riscv64 coverage in `test-coverage.yml`: `linux-gcc-cross` (riscv64, self-hosted ubuntu25, debug+coverage+OpenMP) and `linux-gcc-riscv64-rvv` (RVV=ON, ZFH=ON, ZVFH=ON, vlen=256 and vlen=128, lcov).

No native riscv64 runners are used. All execution is QEMU user-mode or Spike ISA simulation on x86 self-hosted machines. No RISE riscv64 runners are used.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI builds | Yes | Yes | Yes |
| CI tests run | Yes | Yes | Yes (QEMU) |
| Native hardware CI | Yes | Yes | No |
| Multiple ISA variants tested | N/A | N/A | Yes (c906, c908, c910, c907, x60, generic rvv) |
| Coverage reporting | Yes | Yes | Yes (lcov) |
| RISE runners | No | No | No |

---

## 8. Distribution and Release Status

**GitHub releases:** No riscv64 binary assets in any release. Releases 20260526, 20260113, and 20250916 were verified. Ubuntu release zips target x86_64 and aarch64 only.

**PyPI:** Full riscv64 coverage. Latest version `1.0.20260526` ships 14 riscv64 wheels across 7 CPython versions (cp38-cp314), both manylinux_2_39_riscv64 and musllinux_1_2_riscv64. The manylinux_2_39 tag requires glibc >= 2.39; Ubuntu 26.04 ships glibc 2.41, so the wheel is compatible. These wheels are built by the upstream ncnn project via `release-python.yml` using `docker/setup-qemu-action` + `cibuildwheel` with `EXTRA_CMAKE_ARGS=-DNCNN_XTHEADVECTOR=OFF`. The RISE wheel builder redirects ncnn queries to upstream PyPI rather than maintaining a separate build.

**Ubuntu/Debian packages:** ncnn is not packaged in Ubuntu (absent from resolute, questing, noble, jammy). libncnn-dev does not exist in any Ubuntu suite. [NEEDS VERIFICATION for Debian - research findings confirm Ubuntu absence but did not check Debian directly.]

**Arch Linux RISC-V:** Data not available: Arch Linux RISC-V package status was not searched in research findings.

**What a user must do to get a working riscv64 binary:**
- Python users: `pip install ncnn` - installs the manylinux_2_39_riscv64 wheel directly.
- C++ users: build from source using the upstream riscv-gnu-toolchain 2026.05.19 or newer. No prebuilt C++ library exists for riscv64.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking for ncnn |
|------------|------|---------------|--------------|-----------------|-------------------|
| Vulkan (optional) | GPU compute backend | Yes | Unknown | Yes (libvulkan-dev in Ubuntu 26.04) | No (NCNN_VULKAN=OFF default) |
| glslang + SPIRV-Tools (optional) | GLSL-to-SPIR-V for Vulkan | Yes | Unknown | Yes (Ubuntu 26.04) | No (optional) |
| OpenMP (libgomp/libomp) | Thread parallelism | Yes | Partial (riscv64 Linux functional; riscv32 issues only) | Yes (Ubuntu 26.04) | No (NCNN_SIMPLEOMP fallback) |
| Protobuf | Model conversion tools only, not inference | Yes | Yes (riscv64 merged 2024-03) | Yes (Ubuntu 26.04) | No (conversion tools only) |
| OpenCV (optional) | Image I/O for examples | Yes | Partial (issue #28852: RVV DNN engine regression open 2026-04-22) | Yes (Ubuntu 26.04) | No (NCNN_SIMPLEOCV=ON fallback) |
| Eigen | Linear algebra (pnnx tool) | Yes (allow_failure:true) | Partial (allow_failure:true; RVV not in any release) | Yes (header-only, Ubuntu 26.04) | No (pnnx tool only) |
| FlatBuffers | Serialization (pnnx model format) | Yes | None (no upstream riscv64 CI) | Yes (Debian sid) | No (pnnx tool only) |
| OpenBLAS (optional) | BLAS backend | Yes | Partial (cross-compile only; no native test) | Yes (Ubuntu 26.04) | No (ncnn has own kernels) |
| XNNPACK (optional) | NN kernels (pnnx/executorch path) | Yes | Partial (issue #9886: Zvfh dispatch regression Jan 2026) | No (no Ubuntu package) | No (not used in core inference) |
| ruy (optional) | Dense matmul (LiteRT path) | Yes (scalar only) | None | Yes (Ubuntu noble) | No (optional path) |
| zlib | Compression (model I/O) | Yes | Partial (OpenBSD QEMU only; no Linux riscv64 CI) | Yes (Ubuntu 26.04) | No