---
title: oneDNN
parent: Project Reports
color: blue
dependencies:
  - name: xbyak_riscv
    relation: runtime-dependency
    criticality: critical
  - name: OpenMP
    relation: runtime-dependency
    criticality: critical
  - name: oneTBB
    relation: runtime-dependency
    criticality: optional
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="onednn" %}

# oneDNN

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** Blue<br/>
**Optimization level:** Partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for oneDNN<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION]. Where sources disagree, both are cited and the discrepancy is noted explicitly.<br/>

## 1. Project Overview

oneDNN (formerly DNNL, oneAPI Deep Neural Network Library) is a performance-primitives library for deep learning inference and training. It provides architecture-optimized implementations of convolution, matrix multiplication (GEMM/BRGEMM), normalization, pooling, activation, reduction and reorder operations. oneDNN is the CPU backend used by PyTorch, TensorFlow and OpenVINO on several architectures, and is the reference implementation of the oneAPI oneDNN specification. Its entire value proposition is faster-than-reference DNN kernels, which makes it an optimization-purpose project rather than a plain system library or runtime.

**Repository:** [oneapi-src/oneDNN](https://github.com/oneapi-src/oneDNN) - the canonical repository has moved to [uxlfoundation/oneDNN](https://github.com/uxlfoundation/oneDNN); old `oneapi-src/oneDNN` URLs now redirect there.
**License:** Apache License 2.0 (third-party vendored components under 3-clause BSD, 2-clause BSD and other permissive licenses).
**Governance:** [UXL Foundation](https://uxlfoundation.org), a Joint Development Foundation Project, developed through its AI Special Interest Group (SIG) and Open Source/Specification Working Groups. Community contact is the UXL Foundation Slack `#onednn`. Steering Members include Arm, Fujitsu, Google Cloud, Imagination Technologies, Intel, Qualcomm and Samsung.
**Version:** latest tagged releases checked were in the v3.13.x/v3.12.x line (e.g. v3.13.3, v3.13.2, v3.12.5); `main` development HEAD carries `PROJECT_VERSION "3.15.0"` in `CMakeLists.txt`.
**Contributor model:** a formal three-tier ladder (MAINTAINERS.md) of Contributor to Code Owner to Maintainer. Code Owner requires 6+ months as Contributor and roughly 25% working time on the project; Maintainer requires 12+ months as Code Owner. Promotion is merit-based via PRs to MAINTAINERS.md approved by existing Maintainers/Code Owners.
**Community culture toward new ports:** structured but not gatekept. A new ISA port can start informally via a community PR (as RISC-V did in 2021), and components explicitly sit "Vacant, maintained by Core team" until a company commits sustained engineering (true today for PPC64, s390x, LoongArch64, NVIDIA GPU, AMD GPU, Generic SYCL). RISC-V's escalation from a single community-defines PR (2021) to a dedicated, CI-backed, ISCAS/ZTE-staffed Code Owner team (2025-2026) is the clearest example of this meritocratic promotion path working in practice.
**Primary maintainer by component (MAINTAINERS.md):** Core architecture and CPU x64 are entirely Intel Corporation. CPU AArch64 is Arm Ltd plus one Amazon.com Code Owner. CPU RISC-V (RV64) is held by Fei Zhang and Xia Zhuozhao (ISCAS) and Jian Zhang (ZTE Corporation), all at Code Owner level, no Maintainer yet. Overall git history (roughly 20,000 commits) remains dominated by Intel employees, who retain fallback authority over the project.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port spans five years across three phases: dormant scaffolding (2021-2022), intrinsics-based development (2022-2025), and a JIT-backend transition (late 2025 to present, with the heaviest activity June-September 2026).

| Date | Milestone | PR / Issue | Contributor | Affiliation |
|---|---|---|---|---|
| 2021-08-30 | Original feature request for RV64 support | [#1146](https://github.com/uxlfoundation/oneDNN/issues/1146) | aaronfranke | External |
| 2021-09-14 (merged) | First RISC-V defines / platform detect | [#1148](https://github.com/uxlfoundation/oneDNN/pull/1148) | aaronfranke | External |
| 2022-12-15 | First functional RVV kernel: NCHW pooling via intrinsics | commit `cpu: risc-v: pooling: add nchw pooling with rvv intrinsics` | pazamelin | YADRO |
| 2024-08-23 (merged) | Missing-include fix for riscv64 builds | [#2053](https://github.com/uxlfoundation/oneDNN/pull/2053) | alvoron | Intel |
| 2024-11-18 (merged) | RVV intrinsics CMake compilation check | [#2195](https://github.com/uxlfoundation/oneDNN/pull/2195) | - | - |
| 2025-03-27 (merged) | Intrinsics update | [#2929](https://github.com/uxlfoundation/oneDNN/pull/2929) | zhangfeiv0 | ISCAS |
| 2025-04-10 (merged) | Runtime improvements | [#3036](https://github.com/uxlfoundation/oneDNN/pull/3036) | - | - |
| 2025-06 to 2025-08 | Maxpool optimization, average pooling, matmul RVV row/col kernels (bias, ReLU post-op) | [#3449](https://github.com/uxlfoundation/oneDNN/pull/3449), [#3460](https://github.com/uxlfoundation/oneDNN/pull/3460), [#3784](https://github.com/uxlfoundation/oneDNN/pull/3784) | krishnasai-mcw et al. | Microchip Technology, ISCAS |
| 2025-09 | Eltwise and binary RVV kernels | [#3898](https://github.com/uxlfoundation/oneDNN/pull/3898), [#3899](https://github.com/uxlfoundation/oneDNN/pull/3899) | - | - |
| 2025-10-03 (merged) | Dedicated RISC-V CI workflow added | [#3963](https://github.com/uxlfoundation/oneDNN/pull/3963) | zhangfeiv0 | ISCAS |
| 2025-11-13 (merged) | Runtime Zvfh detection | [#4322](https://github.com/uxlfoundation/oneDNN/pull/4322) | - | ISCAS |
| 2025-12-02 (merged) | **Strategic pivot: integrate `xbyak_riscv` JIT assembler** | [#4395](https://github.com/uxlfoundation/oneDNN/pull/4395) | zhangfeiv0 | ISCAS |
| 2025-12-27 | ISCAS added as RISC-V team copyright owner / CODEOWNERS | commits `b049c52`, `0b0bc5f` | - | ISCAS |
| 2026-02-12 (merged) | rv64gc build flag fix (resolves SIGILL on non-V hardware, issue [#4638](https://github.com/uxlfoundation/oneDNN/issues/4638)) | [#4685](https://github.com/uxlfoundation/oneDNN/pull/4685) | - | - |
| 2026-06-02 | Major JIT kernel wave begins: matmul, dot, conv, softmax, pooling | [#5239](https://github.com/uxlfoundation/oneDNN/pull/5239) | - | - |
| 2026-06-10 | f16 and BF16 BRGEMM JIT kernels | [#5294](https://github.com/uxlfoundation/oneDNN/pull/5294), [#5295](https://github.com/uxlfoundation/oneDNN/pull/5295) | - | SpacemiT |
| 2026-06-17/18 | f16 NHWC depthwise conv; JIT reorder | [#5345](https://github.com/uxlfoundation/oneDNN/pull/5345), [#5363](https://github.com/uxlfoundation/oneDNN/pull/5363) | - | SpacemiT, ISCAS |
| 2026-06-22 (merged) | Switch RV64 backend to runtime ISA dispatch | [#5379](https://github.com/uxlfoundation/oneDNN/pull/5379) | - | - |
| 2026-06-30 (merged) | Vendored `xbyak_riscv` upgraded to v1.31 | [#5452](https://github.com/uxlfoundation/oneDNN/pull/5452) | - | - |
| 2026-07-03 / 07-07 | Open: multi-level IR component-system refactor and RFC | [#5500](https://github.com/uxlfoundation/oneDNN/pull/5500), [#5532](https://github.com/uxlfoundation/oneDNN/pull/5532) | - | - |
| 2026-08 | Shuffle JIT, f16 softmax vectorization, binary/postop JIT sync | [#5850](https://github.com/uxlfoundation/oneDNN/pull/5850), [#5865](https://github.com/uxlfoundation/oneDNN/pull/5865), [#5880](https://github.com/uxlfoundation/oneDNN/pull/5880) | - | - |

**Note on #5345 and #5363 status:** a bulk PR listing obtained via commit-message search tags both PRs "merged" on 2026-06-17 and 2026-06-18 respectively. However, the READINESS GRADE's pending-work list, a dedicated PR-detail fetch, and the existing project record all describe both as **open** with partial review approval (#5345: 1/2 approvals; #5363: 1/2 approvals, fixing two correctness bugs found in review). Only six PR numbers (#1148, #2053, #2195, #2929, #3036, #3449) were independently confirmed merged via commit-SHA/tag cross-check in this research round. This report treats #5345 and #5363 as **open, unmerged** per the more detailed and more recent sourcing, and flags the bulk-listing's "merged" tag as [NEEDS VERIFICATION].

Approximately 50 PRs have merged on the RISC-V path since 2021, with the heaviest concentration from June through September 2026, following the xbyak_riscv JIT integration. There is no single tracking issue; work since 2021 has been organized informally via the `platform:cpu-rv64 (RISC-V)` label and, since July 2026, around RFC [#5532](https://github.com/uxlfoundation/oneDNN/pull/5532) for a dedicated RV64 JIT component library. Key contributing organizations are ISCAS (Institute of Software, Chinese Academy of Sciences), ZTE Corporation, SpacemiT, YADRO (first functional kernel), and Microchip Technology (early matmul/GEMM work in 2025, no contributions found since). Intel's role is limited to infrastructure review and merge authority.

---

## 3. Upstream Support Tier

oneDNN uses a binary classification, not a numbered tier system. Per `README.md`: "Power ISA (PPC64), IBMz (s390x), and RISC-V (RV64) support is **experimental** with limited testing validation," versus the optimized tier (Intel x64/AMD64, AArch64, Intel GPU).

No formal promotion criteria are documented anywhere in the repository (no PLATFORMS.md/SUPPORT.md). The RISC-V team holds **Code-Owner level** status (`@uxlfoundation/onednn-cpu-rv64` per CODEOWNERS, covering `/src/cpu/rv64/` and `/third_party/xbyak_riscv/`) but not Maintainer level; all merges still require approval from an Intel Core Maintainer (observed reviewers: `vpirogov`, `dzarukin`).

There is a real tension between the README's "experimental" label and the maturity of the actual CI: oneDNN runs two dedicated RISC-V workflows that cross-compile and **execute** the test suite under QEMU on every push/PR touching RV64 paths, plus a full-suite weekly run - this is genuine build+test CI, not merely a compile check, and is a materially stronger bar than many "experimental" architectures clear elsewhere in the ecosystem.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| README tier | Optimized | Optimized | Experimental |
| Dedicated CI (build+test) | Yes (implicit, default) | Yes (`ci-aarch64.yml`, `nightly-aarch64.yml`) | Yes (`ci-riscv.yml`, `weekly-riscv.yml`) |
| Dedicated performance CI | Yes | Yes (`performance-aarch64.yml`) | No |
| CI hardware | Native x86 runners | Native (and emulated) | QEMU emulation only, no native hardware |
| Official binary releases | None (source-only, all arches) | None | None |
| Maintainer-level ownership | Intel | Arm Ltd | No (Code Owner only: ISCAS, ZTE) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source layout and scale

All RISC-V code lives under `src/cpu/rv64/`, organized like the x64/aarch64/ppc64/s390x backends with subdirectories `brgemm/`, `gemm/`, `injectors/`, `reorder/`, `shuffle/`. A direct source-tree audit confirms:

| Arch dir | Files (.cpp/.hpp) | Lines of code | `// TODO` density |
|---|---|---|---|
| x64 | 423 | 262,708 | 410 (1 per 640 lines) |
| aarch64 | 178 | 86,075 | 114 (1 per 755 lines) |
| **rv64** | **108** | **39,072** | **13 (1 per 3,005 lines)** |
| ppc64 | (not deep-audited) | 11,117 | - |
| s390x (stub comparison) | (not deep-audited) | 657 | - |

rv64 is roughly one-sixth the size of x64 and under half the size of aarch64 by line count - expected for a younger port - but is an order of magnitude larger than a genuinely thin port (s390x, 657 lines), and its TODO density is **lower**, not higher, than both of the mature ports. This is consistent with active, disciplined development rather than a placeholder.

### 4.2 Implementation technique: hand-tuned JIT, not compiler intrinsics

The backend is built on a vendored `third_party/xbyak_riscv` assembler (the RISC-V analog of the `xbyak` library used by x64), integrated via PR [#4395](https://github.com/uxlfoundation/oneDNN/pull/4395) and upgraded to v1.31 in PR [#5452](https://github.com/uxlfoundation/oneDNN/pull/5452). 28 of the 108 rv64 files directly emit RVV instructions at runtime (`vsetvli`, `vle32_v`/`vse32_v`, `vfmul_vf`, `vfmacc_vf`, `vfadd_vf`, `vfmv_v_f`, with explicit SEW/LMUL/VTA/VMA control). **Zero files** use the `riscv_vector.h` C-intrinsics API, and there are no static `.S` assembly files anywhere in the RISC-V tree - this mirrors how x64 and aarch64 are architected, not the "write-it-in-C-and-hope-the-compiler-vectorizes" approach of a thin port. ISA detection (`cpu_isa_traits.cpp`) implements genuine runtime hardware probing, including a SIGILL-trap probe (`sigaction`/`sigsetjmp`) to detect the Zvfbfwma extension when Linux HWPROBE does not yet expose it (the Zvfbfwma HWPROBE bit requires Linux kernel 6.15+).

### 4.3 ISA extensions used

| Extension | Usage |
|---|---|
| RVV 1.0 ("V") | All JIT kernels; runtime-detected via `mayiuse(v)` |
| Zvfh | f16 softmax, layernorm, brgemm, eltwise injector; runtime-detected |
| Zvfbfwma | BF16 widening FMA in brgemm kernels; detected via SIGILL trap-probe firmware workaround |
| F / D (scalar) | Scalar float/double precision helpers, e.g. `fsqrt_d` in the f16 layernorm kernel |

Zb* (bit-manipulation) extensions are not detected or used.

### 4.4 Build-target strategy

The build compiles a single baseline `-march=rv64gc` binary (no vector extension compiled statically); all RVV/Zvfh/Zvfbfwma code paths are supplied entirely at runtime by the JIT, gated on `mayiuse()`, so one binary runs correctly on both V-capable and non-V RV64GC hardware. This replaced an earlier compile-time `-march=` selection scheme (intrinsics-era `CAN_COMPILE_RVV_INTRINSICS`/`CAN_COMPILE_ZVFH_INTRINSICS` CMake checks) following PR [#5379](https://github.com/uxlfoundation/oneDNN/pull/5379) ("switch RV64 backend to runtime ISA dispatch," merged 2026-06-22). `DNNL_ARCH_OPT_FLAGS="-march=rv64gcv"` can still be passed to let the compiler auto-vectorize the non-JIT reference/driver code.

### 4.5 Primitive coverage

| Primitive | Status | Extensions | Notes |
|---|---|---|---|
| GEMM (f32, f16, s8s8s32) | Complete, hand-tuned JIT | V | `gemm/jit_rvv_gemm_*_kernel.cpp` |
| BRGEMM (f32, f16, bf16) | Complete, hand-tuned JIT | V, Zvfh, Zvfbfwma | `brgemm/jit_brgemm_kernel.cpp`, ~1,547 lines |
| Matmul (f32, f16, bf16) | Complete via BRGEMM path | V, Zvfh, Zvfbfwma | - |
| Convolution direct (1x1, gemm-based, brgemm) | Complete (f32); bf16/f16 added for 1x1 and brgemm conv | V, Zvfh, Zvfbfwma | - |
| Convolution Winograd | Complete (f32) | V | F(2x2,3x3), ~18.9x speedup reported (see section 14) |
| Depthwise conv, f16 k3s1/k3s2 | Open, under review | V, Zvfh | PR [#5345](https://github.com/uxlfoundation/oneDNN/pull/5345), 1/2 approvals (see discrepancy note in section 2) |
| Pooling (NCHW/NHWC, f32, f16) | Complete | V, Zvfh | JIT via `jit_uni_pooling` |
| Softmax (f32, f16) | Complete | V, Zvfh | - |
| Layer / group normalization | Complete (f32, f16 layernorm) | V, Zvfh | - |
| Batch normalization | Partial | V | Forward-inference only; no backward, no training stats |
| Inner product | Complete (f32); INT8 (s8/u8) | V | Only primitive with INT8 support |
| Eltwise | Complete, full fwd+bwd | V, Zvfh | relu/tanh/exp/gelu/logistic/swish etc. |
| Binary, shuffle, PReLU | Complete | V | Shuffle (PR #5850), PReLU (PR #5453) merged Aug/Jun 2026 |
| Reorder | Open, under review | V | PR [#5363](https://github.com/uxlfoundation/oneDNN/pull/5363); fixes two correctness bugs found during review (see section 11); 1/2 approvals |
| Reduction | Open, under review | V, Zvfh | PR [#5361](https://github.com/uxlfoundation/oneDNN/pull/5361); 0 approvals; active f16 accumulation-overflow correctness bug |
| RNN (LSTM/GRU) | Not present | - | No rv64 RNN kernels at all |
| Deconvolution, LRN | Not present | - | LRN absence is universal (aarch64 also has zero LRN entries; LRN is a deprecated primitive falling back to the generic reference path everywhere) |

### 4.6 Component comparison

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GEMM / BRGEMM | Full, hand-tuned JIT (Xbyak) | Full, hand-tuned JIT | Full, hand-tuned JIT (xbyak_riscv) |
| Convolution (f32) | Full | Full (ACL-accelerated option) | Full |
| Convolution (INT8) | Full | Full (ACL) | Missing |
| Convolution (bf16) | Full | Full | Missing |
| Normalization | Full incl. backward | Full incl. backward | Partial (no batchnorm backward) |
| RNN | Full | Full | Missing |
| Reorder | Full | Full | Open PR, unmerged |
| Reduction | Full | Full | Open PR, unmerged, active bug |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Toolchain

- **Compiler:** GCC 14 exactly (`riscv64-linux-gnu-gcc-14`/`g++-14`), pinned in `.github/automation/riscv/ci.json` (`"gcc": "14"`). No in-repo comment documents the rationale for this exact version; the pin appears to match the `gcc-14-riscv64-linux-gnu` cross package available via Ubuntu 24.04 apt at the time RISC-V CI was added (2025-09-18). GCC 14 is also independently required by the optional OpenBLAS dependency's `DYNAMIC_ARCH`/ZVL kernel paths (section 9.4), and RISE's own infrastructure blog flags GCC-version compatibility as "a recurring challenge across three separate [RISC-V ecosystem] projects," which corroborates that this is a genuine, ecosystem-wide toolchain constraint rather than an oneDNN-specific choice. No Clang/LLVM cross-toolchain is used or tested for RV64 anywhere in CI.
- **Toolchain file:** `cmake/toolchains/riscv64.cmake`.

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc-14)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++-14)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
set(CMAKE_CROSSCOMPILING TRUE)
```

### 5.2 Architecture auto-detection

`CMakeLists.txt` sets `DNNL_TARGET_ARCH` to `RV64` automatically when `CMAKE_SYSTEM_PROCESSOR` matches `^(rv.*|RV.*|riscv.*|RISCV.*)`, which fires automatically from the toolchain file above.

### 5.3 Reference configure/build commands

From `.github/automation/riscv/build.sh` and `common.sh`:

```bash
sudo apt-get install -y gcc-14-riscv64-linux-gnu g++-14-riscv64-linux-gnu

cmake -Bbuild -S. \
  -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/riscv64.cmake \
  -DONEDNN_BUILD_GRAPH=ON \
  -DDNNL_CPU_RUNTIME=OMP \
  -DONEDNN_WERROR=ON \
  -DDNNL_BUILD_FOR_CI=ON \
  -DONEDNN_TEST_SET=SMOKE \
  -DCMAKE_BUILD_TYPE=RelWithAssert \
  -GNinja

cmake --build build --parallel $(nproc)
```

CI uses CMake >= 3.31.0 (`lukka/get-cmake@v3.31.6`) and Ninja 1.12.0 as generator; the repository's hard floor is `cmake_minimum_required(VERSION 3.13)`. No `-DUSE_X=OFF`-style flags are needed: `DNNL_GPU_RUNTIME` already defaults to `NONE`, so GPU/SYCL/OpenCL paths are excluded by default on a CPU-only RV64 build.

### 5.4 QEMU usage (test stage only; the build itself is native cross-compilation, not emulated)

```bash
export QEMU_LD_PREFIX=/usr/riscv64-linux-gnu
```
with `docker/setup-qemu-action` (`platforms: riscv64`) and two tested configurations:
```
QEMU_CPU="rv64,v=true,zvfh=true,zvfbfwma=true,vlen=128,vext_spec=v1.0"
QEMU_CPU="rv64,v=true,zvfh=true,zvfbfwma=true,vlen=256,vext_spec=v1.0"
```
`ctest -E "$(skipped-tests.sh)"` runs the SMOKE set on every push/PR. The weekly full `CI` test-set is sharded 10-way via a cost-balanced partitioner (`ONEDNN_TEST_PART`/`ONEDNN_TEST_STRIDE`/`ONEDNN_TEST_PARTITION=balanced`) because full-suite QEMU runs are extremely slow - individual tests have been observed to cost upward of 11,500-12,300 seconds under QEMU (close to GitHub Actions' 6-hour/21,600s job cap), which is why the slowest tests are permanently excluded even from the weekly "full" run via `skipped-tests.sh` (permanently skipped: `cpu-matmul-coo-cpp`, `cpu-matmul-csr-cpp`, `test_sum`, `cpu-graph-sdpa-cpp`, plus a longer SMOKE-only and CI-only skip list for slow convolution/GEMM/pooling/sparse-matmul/graph/IP tests).

### 5.5 Known build/config failures

- Issue [#1848](https://github.com/uxlfoundation/oneDNN/issues/1848) (closed): an RVV-intrinsics compilation check at `src/cpu/rv64/CMakeLists.txt:36` failed under GCC 11.4 on QEMU-emulated Ubuntu 22.04, producing "Only Sequential Runtime is now supported for a RISC-V CPU" and forcing a non-threaded build. Resolved as the RVV path matured; no logged fix comment is attached to the issue itself.
- Issue [#4638](https://github.com/uxlfoundation/oneDNN/issues/4638) (closed, fixed by PR [#4685](https://github.com/uxlfoundation/oneDNN/pull/4685)): on rv64gc hardware without the V extension, a toolchain that also supports `-march=rv64gcv_zvfh` caused CMake to enable that flag globally; compiler-autovectorized static initializers then embedded vector instructions before any runtime ISA guard could fire, SIGILL-crashing 226 of 227 tests. Fixed via `__attribute__((target("arch=+v")))` scoping.
- No Dockerfile exists anywhere in the repository for riscv64 (or any architecture) - CI runs entirely on bare `ubuntu-24.04` GitHub-hosted runners with apt-installed cross toolchain and QEMU.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Data-type coverage matrix

| dtype | Matmul | Conv | Pooling | Softmax | LayerNorm | Eltwise | Normalization (other) |
|---|---|---|---|---|---|---|---|
| f32 | Yes | Yes | Yes | Yes | Yes | Yes | Yes (fwd only for batchnorm) |
| f16 | Yes (BRGEMM) | Partial (1x1/brgemm yes; depthwise still open PR #5345) | Yes | Yes | Yes | Yes | No |
| bf16 | Yes (BRGEMM) | Yes (1x1, brgemm) | No | No | No | No | No |
| s8/u8 | No | No | No | No | No | No | No (inner product only) |

### 6.2 Functional gaps vs aarch64

| Feature | aarch64 | riscv64 | Gap |
|---|---|---|---|
| Batch normalization (backward / training stats) | Full | Missing | No bwd BN, no stats computation |
| INT8 convolution / matmul | Full (ACL) | Missing | Only inner product has s8/u8 |
| BF16 convolution / normalization | Full | Missing | BF16 limited to BRGEMM |
| RNN (LSTM/GRU/Vanilla) | Full | Not present | No rv64 RNN kernels |
| Reorder (all dtypes, JIT) | Full | Open PR, unmerged | PR [#5363](https://github.com/uxlfoundation/oneDNN/pull/5363) |
| Reduction | Full | Open PR, unmerged, active bug | PR [#5361](https://github.com/uxlfoundation/oneDNN/pull/5361) |
| ACL / ukernel API | Present (AArch64-specific) | Not applicable | Architecture-specific accelerator, not a gap per se |

### 6.3 Security hardening / floating-point correctness

A dedicated targeted search for RISC-V-specific NaN or floating-point-correctness defects found none. The closest correctness-adjacent items are the now-fixed matmul dropout format-tag bug (issue [#3934](https://github.com/uxlfoundation/oneDNN/issues/3934)) and the currently open f16 reduction accumulation-overflow bug in PR [#5361](https://github.com/uxlfoundation/oneDNN/pull/5361) (section 11). No RISC-V-specific hardening gap (e.g. speculative-execution mitigations, stack protector coverage) was identified in the research performed; this was not exhaustively audited and should be treated as [NEEDS VERIFICATION] if it becomes a deployment requirement.

---

## 7. CI/CD Infrastructure

RISC-V CI genuinely exists and is not build-only. Two dedicated workflows were confirmed by direct file read of `.github/workflows/`:

| Workflow | Trigger | Runner | Execution | Test scope | VLEN |
|---|---|---|---|---|---|
| [`ci-riscv.yml`](https://github.com/uxlfoundation/oneDNN/blob/main/.github/workflows/ci-riscv.yml) | push to `main`/`rls-*` and PR (path-filtered to rv64/cmake/common/tests paths) + manual | `ubuntu-24.04` (x86) | Cross-compile (GCC 14) + execute under QEMU (`docker/setup-qemu-action`) | SMOKE | 128, 256 |
| `weekly-riscv.yml` | cron `0 5 * * 6` (Saturdays 05:00 UTC) + manual | `ubuntu-24.04` (x86) | Same cross-compile + QEMU execution, sharded 10-way | Full `CI` set | 128 only |

Both workflows gate on a synthetic `status` job ("CI RISC-V" / "Weekly RISC-V") usable in branch-protection rules. No GitLab CI, Jenkinsfile or Cirrus CI configuration exists anywhere in the repository, for any architecture. All ten other workflow files in `.github/workflows/` (including `ci-aarch64.yml`, `nightly-aarch64.yml`, `performance-aarch64.yml`) contain zero riscv references - aarch64 additionally has a dedicated **performance** benchmarking workflow that riscv64 lacks entirely.

**No native riscv64 hardware runner is used anywhere.** Both workflows cross-compile on x86 hosts and execute tests exclusively under QEMU user-mode emulation. Open issue [#5170](https://github.com/uxlfoundation/oneDNN/issues/5170) explicitly proposes adding real RVA23-compliant hardware to CI, stating "QEMU cannot fully represent the behavior of real RISC-V hardware in terms of runtime characteristics, platform-specific compatibility" - no implementation exists yet and no maintainer response is recorded. There is no RISE-operated runner confirmed as used by oneDNN's own CI (this session could not access RISE's `riscv-runner` repository to confirm or deny use; oneDNN's CI as read directly uses only `docker/setup-qemu-action` on GitHub-hosted x86 runners, not RISE board-farm hardware).

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build+test on every PR | Yes (implicit) | Yes | Yes |
| Native hardware in CI | Yes | Mixed (native + emulated) | No, QEMU only |
| Weekly/full-suite CI | N/A (always full) | Yes (`nightly-aarch64.yml`) | Yes (`weekly-riscv.yml`) |
| Performance CI | N/A | Yes | No |

---

## 8. Distribution and Release Status

**Upstream GitHub Releases:** publish **no binary assets of any kind, for any architecture.** Every checked release (v3.13.3, v3.13.2, v3.12.5, v3.13.1, v3.12.4) carries only the two GitHub-auto-generated source archives (zip + tar.gz). There is no riscv64, x86, or arm64 pre-built binary from upstream at all.

**PyPI (`onednn` package):** latest version 2026.0.2; all wheel files across the full published history (26 wheels, 2024.0.0 through 2026.0.2) are `manylinux(_2_28)_x86_64` or `win_amd64` only. No riscv64 wheel exists at any version.

**RISE wheel builder / PyPI proxy:** the RISE GitLab PyPI proxy for `onednn` (`gitlab.com/.../packages/pypi/simple/onednn/`) returns an HTTP 302 redirect straight to public PyPI - RISE has no `onednn` package of its own, and `oneDNN` is **not listed** among the roughly 65 packages RISE's own wheel-builder page (`riseproject.gitlab.io/python/wheel_builder/`) tracks for riscv64.

**Linux distributions:**

| Distribution | Package name(s) | riscv64 status | Version | Notes |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libdnnl-dev`, `libdnnl3.6` | Available (amd64, arm64, ppc64el, riscv64, s390x) | 3.9.1+ds-2 | universe pocket; CPU-only build. SYCL variant (`libdnnl-sycl-dev`/`libdnnl-sycl3`) and `onednn-sycl-examples` are amd64-only. |
| Debian unstable (sid) | `libdnnl3.6`, `libdnnl-dev` | Available | 3.12.1+ds-3 (newer sync than Ubuntu's universe snapshot) | `+ds` denotes Debian-repackaged (DFSG-stripped) source |
| Arch Linux RISC-V | - | **Not present at all** | - | Zero occurrences of "onednn" in the 1,473-entry build-status tracker (archriscv.felixc.at); not even attempted |

The only consumable riscv64 binary for oneDNN comes from Debian/Ubuntu's `libdnnl` packages, under a different name than the upstream `onednn`/`python3-onednn` naming - not from upstream itself, and not current (Ubuntu's universe build lags the upstream release line by several minor versions). A user wanting a current riscv64 oneDNN build must cross-compile from source using the GCC 14 toolchain and workflow documented in section 5, or build natively.

**Downstream framework consumption:** RISE's own production riscv64 PyTorch wheels (`manylinux_2_39_riscv64`, built on real RISC-V hardware, served via `pypi.riseproject.dev`) explicitly **disable oneDNN** (`USE_MKLDNN=0`) and use OpenBLAS instead for matmul. A merged change enabling oneDNN on RISC-V reports an 8.85x elementwise-multiply speedup on SG2044, but PyTorch's own CI does not yet exercise it - RISE flags this explicitly as unvalidated/roadmap, not a verified production result. In RISE's August 14, 2026 full PyTorch test run (212,038 cases, 165,591 passed, 191 failed), 6 of the 191 failures are attributed directly to oneDNN's unavailability. OpenVINO is a separate downstream consumer actively integrating oneDNN's RV64 BRGEMM work (OpenVINO PR [#37746](https://github.com/openvinotoolkit/openvino/pull/37746), "[Snippets][CPU][RV64] Add BRGEMM support").

---

## 9. Dependencies

| Name | Role | Relation / Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| xbyak_riscv | RVV/Zvfh/Zvfbfwma JIT code generator; the single load-bearing third-party dependency actually linked into the RV64 build path | runtime, critical | Builds natively (header-only, no compile step) | Not independently executed/fuzzed as a standalone library in any CI; exercised indirectly through oneDNN's own QEMU test suite | No GitHub Releases at all (v1.31 via git tag only, per PR [#5452](https://github.com/uxlfoundation/oneDNN/pull/5452)); not packaged in Debian, Ubuntu, or listed on Repology | Single-maintainer (herumi) project; a PR sat unreviewed roughly 7 months; binutils 2.42 (Ubuntu 24.04 default) cannot assemble Zvfbfwma test cases (needs binutils >= 2.43); Zvbb/Zvbc/Zvkg extensions are detected but have no codegen emitters yet |
| OpenMP | Default CPU threading runtime (`DNNL_CPU_RUNTIME=OMP`) | runtime, critical | GCC `libgomp` builds and works on riscv64; used throughout CI | Exercised via CI (ci-riscv.yml explicitly sets `DNNL_CPU_RUNTIME=OMP`) | N/A (bundled with GCC) | LLVM `libomp` fails to build natively on riscv64 ([llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026), open, unassigned); Clang-toolchain deployments must use GCC libgomp or the sequential (`NONE`) runtime |
| oneTBB | Alternative CPU threading backend (`DNNL_CPU_RUNTIME=TBB`) | runtime, optional | riscv64 arch detection (PR #917) and cross-toolchain file (PR #1086, merged April 2023) are merged upstream; pure portable C++, no RVV code | Verified only once, under QEMU, via a one-off SiFive prep script in a merged PR; **zero current CI coverage** in oneTBB upstream | No riscv64 binary in GitHub Releases; Ubuntu packages `libtbb12`/`libtbb-dev` for riscv64 | GCC build needs manual `-latomic` (PR #987, open/unmerged since Dec 2022); spin-wait backoff degrades to unconditional `sched_yield()` (Zihintpause unused); closed issue [#1051](https://github.com/uxlfoundation/oneTBB) "Support RISC-V" |
| OpenBLAS | Optional external BLAS backend (`DNNL_BLAS_VENDOR=OPENBLAS`, default is `NONE`) | runtime, optional | Full riscv64 support including RVV 1.0 (ZVL128B, ZVL256B) targets and `DYNAMIC_ARCH` runtime dispatch | Untested for LAPACK paths on riscv64 in CI (QEMU timeout) | Latest v0.3.33; Ubuntu 24.04 ships 0.3.26, which lacks `DYNAMIC_ARCH`/ZVL targets | Open ZVL256B TRSM correctness bug (draft PR #5830, unresolved); requires GCC 14+ for ZVL kernel paths, with GCC 13 silently falling back to scalar (no toolchain guard enforced); this is the library RISE's own production PyTorch-on-riscv64 wheels use **instead of** oneDNN for matmul |
| googletest | Vendored test framework | test, optional | Builds on riscv64 | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64, returning 0 instead of the thread count (open since 2022, [google/googletest#3756](https://github.com/google/googletest/issues/3756), assigned, no fix merged) | N/A | Does not affect oneDNN test correctness, since oneDNN's own test suite does not rely on that assertion |
| CMake | Build system generator | build, critical | Portable; no riscv64-specific issues found | N/A | N/A | CI uses CMake >= 3.31.0; repo floor is 3.13 |
| GCC | Cross-compiler toolchain | build, critical | Pinned to GCC 14 exactly for riscv64 builds | N/A | N/A | Also required at GCC 14+ by OpenBLAS's ZVL kernel paths; GCC-version fragmentation across the RISC-V toolchain ecosystem is independently flagged by RISE as "a recurring challenge across three separate projects" |
| QEMU | User-mode emulation for test execution | test, critical | N/A (test-only tool) | Core of all riscv64 test execution (`docker/setup-qemu-action`, vlen=128/256) | N/A | No native hardware runner exists anywhere in CI; open issue [#5170](https://github.com/uxlfoundation/oneDNN/issues/5170) requests real hardware to complement/replace QEMU-only testing |
| Ninja | Build generator (`-GNinja`) | build, optional | Portable; no riscv64-specific issues found | N/A | N/A | Ninja 1.12.0 via `lukka/get-cmake@v3.31.6` in CI |
| spdlog | Logging backend (`src/common/logging.cpp`, `verbose.hpp`), vendored at `third_party/spdlog` | runtime, optional (indirect, found via manifest) | Header-only/portable; no riscv64-specific code expected | Not independently verified in this research pass | N/A | Architecture-independent; included in the manifest for completeness, no issues identified |

**Architecturally excluded from riscv64 (confirmed via CMakeLists gating, not researched further):** `xbyak` (x64-only JIT), `xbyak_aarch64` (AArch64-only JIT), Arm Compute Library / ACL (`DNNL_AARCH64_USE_ACL`-gated, AArch64-only), `ngen` (Intel GPU JIT, GPU-runtime-gated). None of these are linked into any RV64 CPU build.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#5361](https://github.com/uxlfoundation/oneDNN/pull/5361) | f32/f16 RVV reduction kernel | Open PR, 0 approvals | **Correctness (active)** | f16 mean reduction performs `f32(f16(sum_f32))` via `vfncvt_f_f_w` then widens back, truncating the accumulated range; wrong results once the f32 sum exceeds f16's representable range (~65504). Repro: `./benchdnn --reduction --mode=C --impl=jit:uni --sdt=f16 --ddt=f16 --stag=x --dtag=x --alg=mean 65536:1`. Not yet in `main`. |
| [#5363](https://github.com/uxlfoundation/oneDNN/pull/5363) | JIT reorder | Open PR, 1/2 approvals | Correctness (fixed within the PR) | Two bugs caught in review before merge: non-scalar zero-points wrongly entered the JIT path producing incorrect results; s32-to-s32 reorder with `scale_adjust != 1.f` entered the f32 JIT path (f32 cannot represent all int32 values beyond 2^24). Both fixes are included in the PR; neither is in `main` yet. See section 2 for a discrepancy note on this PR's reported merge status. |
| [#4638](https://github.com/uxlfoundation/oneDNN/issues/4638) | SIGILL crash on RVV-disabled (rv64gc) hardware | Closed, fixed | Correctness (resolved) | Fixed by PR [#4685](https://github.com/uxlfoundation/oneDNN/pull/4685) via target-attribute scoping; affected any rv64gc chip built with a Zvfh-capable toolchain |
| [#3934](https://github.com/uxlfoundation/oneDNN/issues/3934) | Matmul dropout attribute rejected on RV64 | Closed, fixed | Correctness (resolved) | `unsupported format tag`/`invalid_arguments` on a 1x1:1x1 matmul shape with dropout; fixed by PR #4197 |
| [#1848](https://github.com/uxlfoundation/oneDNN/issues/1848) | Sequential-runtime-only build error on RISC-V QEMU | Closed | Build | RVV-intrinsics CMake check failure forced sequential (non-threaded) builds; resolved as the RVV path matured |
| [#2042](https://github.com/uxlfoundation/oneDNN/issues/2042) | x64 AVX512/AMX code incorrectly compiled into TensorFlow+oneDNN RISC-V builds | Closed, fixed | Build | x64-specific code path should have been excluded on RV64 |
| [#4860](https://github.com/uxlfoundation/oneDNN/issues/4860) | No mechanism to extend memory layouts for vector-length-agnostic (VLA) hardware | Open, assigned to vpirogov | Architectural | Real-hardware VLEN ranges 128-1024+ bits; current memory-tag system would need an impractically large number of tags. Proposes making `memory_desc_wrapper::fill_blocked` static. No PR yet. |
| [#5170](https://github.com/uxlfoundation/oneDNN/issues/5170) | Proposal for real RISC-V hardware CI | Open | Infrastructure | No implementation yet; no maintainer response recorded |
| (Zvfbfwma SIGILL probe) | Runtime-detection reliability under QEMU/seccomp | Unresolved | [NEEDS VERIFICATION] | The SIGILL-trap-probe mechanism for Zvfbfwma detection has not been confirmed to behave correctly under all QEMU versions or signal-restricted (seccomp) deployment environments |

No RISC-V-specific NaN or floating-point-correctness bug (independent of the above) was found in a dedicated targeted search.

---

## 12. Objections and Upstream Blockers

- **LLVM/Clang threading gap:** `libomp` does not build on native riscv64 hardware ([llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026), open, unassigned). Any deployment on a Clang-toolchain riscv64 system must fall back to GCC `libgomp` or the sequential (`NONE`) threading runtime.
- **No documented promotion path:** the README's "experimental" classification for RV64 has no stated promotion criteria; the decision rests with Intel's Core team, which retains fallback/override authority over every architecture decision. The RISC-V team (ISCAS, ZTE) is Code-Owner level, not Maintainer level, per the MAINTAINERS.md meritocratic ladder (12+ months as Code Owner required for Maintainer eligibility).
- **Incomplete quantized-inference path:** no INT8 convolution, INT8 matmul, or INT8 normalization exists on RV64 - only inner product has s8/u8 support. Production deployment of INT8 post-training-quantized models is not supported.
- **No GPU runtime planned:** `ONEDNN_GPU_RUNTIME=NONE` is the only valid RV64 configuration; GPU-accelerated deployment scenarios are out of scope.
- **CI coverage gap:** all automated testing runs under QEMU (vlen=128/256); real-hardware regressions (cache behavior, memory subsystem, silicon errata) are not caught by CI. All hardware benchmark figures cited in PRs were collected manually on SpacemiT boards by contributors, not via CI.
- **`xbyak_riscv` supply-chain risk:** the one load-bearing third-party dependency is a single-maintainer project with zero formal releases, no distro packaging, and at least one PR left unreviewed for roughly 7 months. A toolchain-version mismatch exists between the dependency's needs (binutils >= 2.43 for Zvfbfwma assembly) and what oneDNN's own CI runner (Ubuntu 24.04, binutils 2.42) provides.
- **Unmerged architectural refactor:** PR [#5500](https://github.com/uxlfoundation/oneDNN/pull/5500) and RFC [#5532](https://github.com/uxlfoundation/oneDNN/pull/5532) propose a multi-level IR/JIT component-library restructuring that remains open; this could either accelerate or stall further RV64 primitive work depending on when/whether it lands.
- **RISE involvement is real but indirect:** ISCAS and SpacemiT are RISE General Members, and RISE's own blog explicitly lists oneDNN among its "targeted investments" (alongside PyTorch, Llama.cpp, IREE, OpenBLAS). However, no RISE-owned or RISE-funded oneDNN repository exists, oneDNN is absent from RISE's own wheel-builder package coverage, and RISE's own production riscv64 PyTorch wheels currently **disable** oneDNN pending CI validation - described explicitly on RISE's roadmap as "Phase 2," after RVV vectorization lands in PyTorch's ATen layer (Phase 1).

---

## 13. Readiness Assessment

- **Color:** Blue
- **Release provider:** Distro (Debian/Ubuntu's `libdnnl-dev`/`libdnnl3.6` packages; upstream itself publishes no riscv64, or any architecture-specific, binary artifacts)
- **Optimization level:** Partial

oneDNN's upstream CI runs two dedicated RISC-V workflows ([`ci-riscv.yml`](https://github.com/uxlfoundation/oneDNN/blob/main/.github/workflows/ci-riscv.yml) on every push/PR touching rv64 paths, and `weekly-riscv.yml` for a full-suite weekly run) that cross-compile with GCC 14 on x86 runners and **execute** the test suite under QEMU (`docker/setup-qemu-action`, vlen=128/256). This is genuine build-and-test CI, not build-only, which clears the bar for Blue rather than Yellow. Upstream itself publishes no riscv64 (or any architecture-specific) binary artifacts at all - GitHub Releases are source-tarball-only and the official PyPI `onednn` wheels cover only `manylinux_x86_64`/`win_amd64` - so the project cannot reach Green; the only consumable riscv64 binary comes from Debian/Ubuntu's `libdnnl-dev`/`libdnnl3.6` packages, meaning the release provider is the distro, not upstream.

As a performance-primitives library, oneDNN's entire value proposition is faster-than-reference DNN kernels, so the optimization modifier applies: RISC-V has a genuine, actively developed RVV JIT backend (`src/cpu/rv64/`, xbyak_riscv-based) covering the primary differentiating operations (convolution, matmul/GEMM, pooling, normalization, softmax, eltwise) with real measured speedups (section 14), which is Partial coverage and caps the grade at Blue rather than lowering it further - secondary paths (INT8 convolution/matmul, BF16 convolution/normalization, RNN, batchnorm backward) still fall back to scalar/reference C, and the JIT reorder and reduction kernels remain open, unmerged PRs (reduction has an active correctness bug, section 11).

**Pending work that could change the grade:** open PRs #5363 (JIT reorder, 1/2 approvals, fixes two correctness bugs), #5361 (f32/f16 reduction kernel, 0 approvals, active f16 accumulation-overflow bug), #5345 (f16 NHWC depthwise conv, 1/2 approvals), and #5500/RFC #5532 (multi-level IR/JIT component-library refactor). Open issues #5170 (proposal for real RISC-V hardware CI to replace QEMU-only testing) and #4860 (vector-length-agnostic memory-layout limitation, assigned to a maintainer) remain unresolved. RISC-V is Code-Owner level (ISCAS, ZTE, SpacemiT contributors) but not yet Maintainer level, so merges still require Intel maintainer approval. ISCAS and SpacemiT are RISE General Members, and RISE's August 2026 blog post flags oneDNN-on-RISC-V (8.85x elementwise-multiply speedup on SG2044) as not yet exercised by downstream PyTorch CI; no dedicated RISE-funded oneDNN project exists, but community/vendor investment (ISCAS/ZTE/SpacemiT) is active and could push this toward Green if upstream ever publishes riscv64 release artifacts.

---

## 14. Investment Analysis

### 14.1 Functional Enablement

f32 inference is supported for the main DNN operator set (conv, matmul/GEMM, pooling, softmax, layernorm, eltwise, inner product). f16 coverage is substantial (softmax, layernorm, eltwise, BRGEMM, pooling, 1x1/BRGEMM conv) but depthwise conv remains an open PR. BF16 is limited to the BRGEMM path only. INT8 inference is limited to inner product.

| Gap | Effort estimate | Blocking scenario |
|---|---|---|
| INT8 conv + matmul (s8/u8, zero-points, per-channel scales) | 6-10 person-weeks | Quantized model inference (ResNet, MobileNet, BERT INT8) |
| BF16 conv and normalization | 3-5 person-weeks | BF16 training and mixed-precision inference |
| RNN (LSTM/GRU) | 4-6 person-weeks | Sequence models, speech recognition |
| Reduction kernel correctness fix (PR #5361) | <1 person-week | Mean/max reduction over large tensors in transformers |
| Reorder full dtype merge (PR #5363) | <1 person-week | Quantization workflow correctness |
| f16 depthwise conv merge (PR #5345) | <1 person-week | MobileNet f16 inference |
| Batch normalization backward + training stats | 2-4 person-weeks | Training workloads on RISC-V |

### 14.2 Performance Optimization

Benchmark data reported in merged PRs (SpacemiT hardware unless noted; no cross-architecture rv64-vs-arm64/x86 comparison exists in any source found):

| Kernel | Comparison | Speedup | Hardware | Source |
|---|---|---|---|---|
| BF16 BRGEMM matmul (4096x4096) | scalar emulation (0.084 Gflops) vs JIT (20.4 Gflops) | 242x | SpacemiT X100 | [PR #5295](https://github.com/uxlfoundation/oneDNN/pull/5295) |
| f16 BRGEMM matmul | scalar reference vs JIT | ~2,796x | SpacemiT X100 | [PR #5294](https://github.com/uxlfoundation/oneDNN/pull/5294) |
| Winograd conv, ResNet-50 (avg) | gemm:rvv vs JIT Winograd | ~18.9x | SG2044, 8-core | [PR #4735](https://github.com/uxlfoundation/oneDNN/pull/4735) |
| MobileNet depthwise conv, f16 (best case) | ref:any vs dw_k3s1:rvv | 15x | SpacemiT X100 | [PR #5345](https://github.com/uxlfoundation/oneDNN/pull/5345) (open PR) |
| Reorder, f32->s8 per_dim_0 / s8->s8 | intrinsics/generic vs JIT | 173x / 204x | RV64 hardware (unspecified) | [PR #5363](https://github.com/uxlfoundation/oneDNN/pull/5363) (open PR) |
| NHWC pooling (googlenet_v3, ave) | intrinsics vs JIT | 3.1x | SG2044, single core | [PR #5198](https://github.com/uxlfoundation/oneDNN/pull/5198) |
| f32 JIT GEMM matmul (aggregate) | reference vs JIT | 1.27x | SG2044, single core | [PR #4410](https://github.com/uxlfoundation/oneDNN/pull/4410) |
| Elementwise multiply | unspecified baseline | 8.85x | SG2044 | RISE blog, explicitly flagged unvalidated/roadmap - not independently reproduced, no methodology published |

The large (100x+) speedups for BF16/f16 BRGEMM and reorder reflect the absence of any prior vectorized path rather than tuning of an existing one; the f32 JIT GEMM gain (1.27x) represents genuine incremental optimization of a previously-RVV-accelerated path.

| Work item | Expected gain | Effort | Evidence |
|---|---|---|---|
| INT8 BRGEMM matmul + conv | High (likely 100x+ vs scalar, per BF16 BRGEMM precedent) | 6-10 person-weeks | PR #5295 precedent |
| Reduction correctness fix, then optimize | Moderate | 1-2 person-weeks | PR #5361 |
| BF16 conv and normalization | Moderate | 3-5 person-weeks | BRGEMM infrastructure already in place |
| f16 depthwise conv merge | 3-15x vs ref:any | <1 person-week | PR #5345 benchmark data |

### 14.3 CI/CD Infrastructure

Current CI provides automated build verification and SMOKE-level functional testing on every rv64-touching PR, plus a weekly full-suite confirmation that catches catastrophic regressions.

| Gap | Impact | Effort |
|---|---|---|
| No native hardware CI runner | Performance regressions uncaught; VLEN variants beyond 128/256 untested; Zvfbfwma path untested in CI | Requires hardware lab + self-hosted runner infrastructure |
| QEMU Zvfbfwma fidelity unconfirmed | BF16 path correctness untested under real silicon conditions | Investigation + QEMU version pin or targeted skip |
| PR path filter excludes generic shared-code changes | Regressions in shared code can silently break rv64 | Broaden path filter or add periodic full build |
| Weekly suite permanently excludes slowest tests (6h QEMU job cap) | Coverage gaps persist even in "full" weekly mode | Native hardware runner would remove the QEMU timeout constraint |
| xbyak_riscv/binutils version gap (needs 2.43+ for Zvfbfwma assembly, CI runner has 2.42) | Latent toolchain fragility | Upgrade CI runner's binutils or pin explicitly |

### 14.4 Ecosystem Enablement

| Area | Current state | Gap |
|---|---|---|
| Binary distribution | Debian/Ubuntu `libdnnl` packages exist but are maintainer-repackaged, version-lagged, and not under the upstream `onednn` name | No official upstream binary of any kind; no PyPI riscv64 wheel |
| Framework integration (PyTorch) | oneDNN explicitly disabled (`USE_MKLDNN=0`) in RISE's own production riscv64 PyTorch wheels | Needs PyTorch CI validation before RISE will enable it (RISE Phase 2) |
| Framework integration (OpenVINO) | Active downstream BRGEMM integration (PR #37746) | Immature; not independently benchmarked here |
| RISE coordination | ISCAS and SpacemiT are RISE General Members; RISE names oneDNN as a target investment area | No dedicated RISE-funded oneDNN project or repo; absent from RISE's wheel-builder coverage |
| Documentation | No rv64-specific build guide in `doc/`; build instructions derivable only from CI automation scripts | No official published cross-compilation documentation |

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix f16 reduction overflow bug (PR #5361) | <1 | Qualcomm or SpacemiT/ISCAS (review/fix) | Critical |
| Functional | Help merge reorder JIT (PR #5363, needs 2nd review) | <1 | Qualcomm review candidate | Critical |
| Functional | Help merge f16 depthwise conv (PR #5345, needs 2nd review) | <1 | Qualcomm review candidate | High |
| Functional | INT8 conv + matmul (s8/u8, per-channel scales, zero-points) | 6-10 | Qualcomm or contracted ISCAS/SpacemiT | Critical |
| Functional | BF16 conv and normalization kernels | 3-5 | Qualcomm or SpacemiT | High |
| Functional | RNN (LSTM/GRU) JIT kernels | 4-6 | Qualcomm | Medium |
| Performance | INT8 BRGEMM micro-kernel (quantized matmul) | 6-10 | Qualcomm | High |
| Performance | Reduction optimization (fix bug, then tune) | 1-2 | Qualcomm or ISCAS | High |
| Performance | Winograd f16 extension | 2-3 | SpacemiT (primary) | Medium |
| CI/CD | Resolve LLVM `libomp` riscv64 build failure (#87026) | 2-4 (upstream LLVM) | LLVM community; relevant to any Clang-toolchain user | High |
| CI/CD | Native hardware CI runner (self-hosted) | 4-8 (infra) + ongoing | Lab infrastructure owner | High |
| CI/CD | Verify Zvfbfwma SIGILL probe under QEMU and seccomp | 1 | Qualcomm | Medium |
| CI/CD | Reconcile xbyak_riscv/binutils version gap in CI | <1 | Submit PR upstream | Medium |
| Ecosystem | Pursue upstream riscv64 PyPI wheel or release artifact | 3-5 | Coordinate with Intel/UXL | Medium |
| Ecosystem | Push PyTorch CI validation of oneDNN-on-RISC-V (unblocks RISE Phase 2) | 2-4 | Coordinate with RISE/ISCAS | Medium |
| Governance | Pursue Maintainer status (currently Code Owner only) | Long-term | Requires sustained engineering investment and Intel confidence | Low |

---

## 15. References

- [uxlfoundation/oneDNN repository](https://github.com/uxlfoundation/oneDNN)
- [oneapi-src/oneDNN (redirects to uxlfoundation/oneDNN)](https://github.com/oneapi-src/oneDNN)
- [Issue #1146 - Add support for the RISC-V architecture](https://github.com/uxlfoundation/oneDNN/issues/1146)
- [Issue #1848 - Sequential-runtime-only build error on RISC-V QEMU](https://github.com/uxlfoundation/oneDNN/issues/1848)
- [Issue #3934 - matmul dropout attribute failure (closed)](https://github.com/uxlfoundation/oneDNN/issues/3934)
- [Issue #4638 - SIGILL on rv64gc hardware (closed)](https://github.com/uxlfoundation/oneDNN/issues/4638)
- [Issue #4860 - vector-length-agnostic memory layout limitation (open)](https://github.com/uxlfoundation/oneDNN/issues/4860)
- [Issue #5170 - proposal for real RISC-V hardware CI (open)](https://github.com/uxlfoundation/oneDNN/issues/5170)
- [PR #1148 - add RISC-V defines](https://github.com/uxlfoundation/oneDNN/pull/1148)
- [PR #2053 - missing include fix for riscv64](https://github.com/uxlfoundation/oneDNN/pull/2053)
- [PR #3963 - RISC-V CI workflow](https://github.com/uxlfoundation/oneDNN/pull/3963)
- [PR #4395 - integrate xbyak_riscv JIT library](https://github.com/uxlfoundation/oneDNN/pull/4395)
- [PR #4685 - rv64gc build flag fix](https://github.com/uxlfoundation/oneDNN/pull/4685)
- [PR #5198 - NHWC pooling JIT](https://github.com/uxlfoundation/oneDNN/pull/5198)
- [PR #5239 - JIT kernels for matmul/conv/softmax/pooling](https://github.com/uxlfoundation/oneDNN/pull/5239)
- [PR #5294 - f16 BRGEMM JIT kernel](https://github.com/uxlfoundation/oneDNN/pull/5294)
- [PR #5295 - BF16 BRGEMM JIT kernel](https://github.com/uxlfoundation/oneDNN/pull/5295)
- [PR #5345 - f16 NHWC depthwise conv (open)](https://github.com/uxlfoundation/oneDNN/pull/5345)
- [PR #5361 - f32/f16 reduction kernel (open, correctness bug)](https://github.com/uxlfoundation/oneDNN/pull/5361)
- [PR #5363 - JIT reorder (open)](https://github.com/uxlfoundation/oneDNN/pull/5363)
- [PR #5379 - switch RV64 backend to runtime ISA dispatch](https://github.com/uxlfoundation/oneDNN/pull/5379)
- [PR #5452 - xbyak_riscv upgrade to v1.31](https://github.com/uxlfoundation/oneDNN/pull/5452)
- [PR #5500 - multi-level IR component refactor (open)](https://github.com/uxlfoundation/oneDNN/pull/5500)
- [RFC #5532 - RV64 JIT component library (open)](https://github.com/uxlfoundation/oneDNN/pull/5532)
- [ci-riscv.yml workflow](https://github.com/uxlfoundation/oneDNN/blob/main/.github/workflows/ci-riscv.yml)
- [llvm/llvm-project#87026 - libomp fails to build on native riscv64](https://github.com/llvm/llvm-project/issues/87026)
- [google/googletest#3756 - GetThreadCount returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [oneTBB PR #1086 - riscv64 toolchain file](https://github.com/uxlfoundation/oneTBB/pull/1086)
- [OpenBLAS PR #5830 - ZVL256B TRSM correctness (draft)](https://github.com/xianyi/OpenBLAS/pull/5830)
- [herumi/xbyak_riscv upstream](https://github.com/herumi/xbyak_riscv)
- [Debian onednn package tracker](https://tracker.debian.org/pkg/onednn)
- [PyPI onednn package](https://pypi.org/project/onednn/)
- [OpenVINO PR #37746 - Add BRGEMM support for RV64](https://github.com/openvinotoolkit/openvino/pull/37746)
- [RISE Project - PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE Project member list](https://riseproject.dev)
- [UXL Foundation](https://uxlfoundation.org)
- [Phoronix - Intel's oneDNN Ported To RISC-V](https://www.phoronix.com/news/Intel-oneDNN-2.5)