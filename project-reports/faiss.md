---
title: FAISS
parent: Project Reports
color: yellow
dependencies:
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: critical
  - name: OpenMP
    relation: runtime-dependency
    criticality: critical
  - name: Intel MKL
    relation: runtime-dependency
    criticality: optional
  - name: CUDA
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: SWIG
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="faiss" %}

# FAISS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for FAISS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[FAISS](https://faiss.ai/) (Facebook AI Similarity Search) is a library for efficient similarity search and dense vector clustering. The repository is [facebookresearch/faiss](https://github.com/facebookresearch/faiss). It is MIT-licensed, copyright "Facebook, Inc. and its affiliates."

FAISS is a corporate-led project with no independent foundation or community governance. faiss.ai states the project is "developed primarily at FAIR, the fundamental AI research team of Meta." There is no MAINTAINERS, CODEOWNERS, PLATFORMS.md, SUPPORT.md, or docs/platforms/ file anywhere in the repository (all confirmed absent). Every merged commit carries Meta-internal Phabricator metadata (`Differential Revision: D######`, `Reviewed By:`, `Pulled By:`, `fbshipit-source-id:`) and is synced to GitHub by the `meta-codesync[bot]` app, meaning canonical review happens inside Meta's internal tooling and GitHub is effectively a mirror. `CONTRIBUTING.md` tells contributors to "contact us first before putting too much effort into it" for major work, and all contributions require Meta's CLA.

FAISS itself is not a RISE Project (RISC-V Software Ecosystem, a Linux Foundation initiative) member project, and Meta does not appear at either the Premier or General tier of [riseproject.dev/members](https://riseproject.dev/members) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences (ISCAS), Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). Notably, several of FAISS's external RISC-V contributors' employers, ZTE and ISCAS, *are* RISE members, even though FAISS as a project is not. No RISE blog post (checked the full index plus targeted fetches of the most plausible candidates, 2024-05 through 2026-07-30) mentions FAISS.

**RISE now builds FAISS**, however, through the `riseproject-dev/python-wheels` repository, which compiles and publishes `faiss-cpu` riscv64 wheels natively on RISE's own bare-metal RISC-V CI runners and serves them from `pypi.riseproject.dev`. This is an automated, generic part of RISE's Python-wheels pipeline (driven by `github-actions[bot]`), not a named or funded FAISS-specific engagement, and it began 2026-09-02, well after Meta's own RVV kernel work had started landing upstream. See Section 8 for details.

Active contributors with RISC-V-relevant commits: **mnorris11** (Michael Norris, Meta/FAIR) is the recurring reviewer/gatekeeper across nearly all RVV PRs and the de facto RISC-V subsystem owner; **mdouze** (Matthijs Douze, Meta/FAIR, FAISS's original architect) authored the CI cross-compile job and reviewed the first real kernel PR; **alexanderguzhva** authored the foundational "Introduce RVV" scaffolding PR [NEEDS VERIFICATION on employer]. External contributors doing the bulk of the actual vectorized-kernel work are **ihb2032** (independent, tests on SpacemiT/SG2044 hardware) and **lyd1992** (Yuansheng, ISCAS, `liuyudong@iscas.ac.cn`), plus **anthony-zy** (ZTE Corporation, `zheng.ziyang@zte.com.cn`), who authored the one significant unmerged correctness fix (Section 11). Other recurring Meta-side reviewers: alibeklfc, trang-nm-nguyen, limqiying, juancarpio27. The community stance toward new RISC-V contributions is pragmatic but centrally gated: external PRs are accepted and merged at a steady cadence, but every one is funneled through a Meta engineer's review and Differential Revision sync before landing; there is no independent community maintainer with sign-off authority on the RISC-V port.

## 2. Port History and Upstreaming Timeline

RISC-V work in facebookresearch/faiss has no dedicated tracking issue; it has been driven entirely through a long, incremental series of pull requests (24-26 found matching "riscv"/"rvv", depending on query angle), running from April 2026 scaffolding through late-September 2026 kernel work, with several PRs still open.

| Date | Event | Source |
|---|---|---|
| 2025-08-04 | [#4503](https://github.com/facebookresearch/faiss/pull/4503) opened: RVV optimizations for ScalarQuantizer.cpp | Still open as of 2026-09-30, stale/backlog, predates the main 2026 push |
| 2026-05-05 | [#5156](https://github.com/facebookresearch/faiss/pull/5156) "Introduce RVV" merged (commit `0320279`) | Foundational dispatch scaffolding: adds `SIMDLevel::RISCV_RVV`, stub overrides that call the scalar (NONE) path. mnorris11 and mdouze debated dispatch-mask scoping in review; mdouze asked whether real RVV code would follow soon |
| 2026-05-07 | [#5184](https://github.com/facebookresearch/faiss/pull/5184) "CI: cross-compile for riscv64 with RVV dynamic dispatch" merged (commit `7a8e4dd`, author mdouze) | Adds `cmake/toolchains/riscv64-linux-gnu.cmake` and the `linux-riscv64-DD-cmake` CI job |
| 2026-05-18 | [#5216](https://github.com/facebookresearch/faiss/pull/5216) "Move RISC-V fast_scan forwarders to dedicated impl-riscv.cpp" merged (commit `a9f5baa`) | Refactor only, matches the AVX2/AVX512/NEON per-arch-TU pattern; no new vectorized code |
| 2026-05-28 | [#5057](https://github.com/facebookresearch/faiss/pull/5057) merged (commit `a4e417f`) | Tangential x86/ARM dispatch fix that also encodes `RISCV_RVV -> NONE` in the fallback chain |
| 2026-06-30 | [#5354](https://github.com/facebookresearch/faiss/pull/5354) "feat(riscv): Add RISC-V RVV vector distance kernels" merged (commit `df51012`, author ihb2032, co-author lyd1992/ISCAS) | First real (non-stub) RVV kernel PR: 14 core float distance specializations. Tested on SG2044 hardware, GCC 15.1, openEuler |
| 2026-07-13 | [#5369](https://github.com/facebookresearch/faiss/pull/5369) "feat(riscv): Add RISC-V RVV rabitq kernels" merged (commit `d22107b`) | Same SG2044/openEuler test rig |
| 2026-08-25 | [#5534](https://github.com/facebookresearch/faiss/pull/5534) "Fix HNSW concurrent race segfault on RISC-V" **closed without merging** | Authored by anthony-zy (ZTE); deliberately deferred by mnorris11 pending removal of the legacy lock-based HNSW path (Section 11) |
| 2026-09-10 | [#5600](https://github.com/facebookresearch/faiss/pull/5600) merged | Renames SIMD dispatch masks; no behavior change |
| 2026-09-15 | [#5601](https://github.com/facebookresearch/faiss/pull/5601) self-closed without merging | fvec_add/fvec_sub + PQ dsub=2 kernels; superseded by #5655 |
| 2026-09-17 | [#5539](https://github.com/facebookresearch/faiss/pull/5539) merged | RVV specialization for scalar-quantizer distance compute; reports 50-80% latency reduction vs scalar SQ baseline in its own included benchmarks |
| 2026-09-21 | [#5653](https://github.com/facebookresearch/faiss/pull/5653) "fix(ci): use GCC 14 riscv64 cross-compiler" merged (commit `bf8be4a`) | CI fix: GCC 13's `<riscv_vector.h>` lacks RVV tuple types and zvfhmin f16 intrinsics needed by the SQ kernels |
| 2026-09-23 | [#5535](https://github.com/facebookresearch/faiss/pull/5535) "RVV optimized scalar quantizer codecs and distance computation" merged | Runtime-vector-length-aware (m8) RVV kernels for SQ codecs (4/8-bit, fp16, bf16, LloydMax); benchmarked on a SpacemiT K3 board (Section 6) |
| 2026-09-24/25 | [#5602, #5603, #5604, #5628, #5638, #5639, #5640, #5641](https://github.com/facebookresearch/faiss/pulls?q=rvv) | Cluster of focused PRs adding per-variant SQ encode/decode/distance kernels, most merged within days |
| 2026-09-25 | [#5543](https://github.com/facebookresearch/faiss/pull/5543) merged (commit `1768a5a`) | RVV PQ distance-table computation; changelog notes "AI reviewers found 6 valid defects, fixed" |
| 2026-09-25 | [#5655](https://github.com/facebookresearch/faiss/pull/5655) merged | Re-submission/successor of #5601: fvec_add/fvec_sub and PQ dsub=2 distance-table kernels, fixes a dispatch-mask gap silently routing RVV hosts to scalar |
| 2026-09-30 (still open) | [#5510](https://github.com/facebookresearch/faiss/pull/5510) | Detect RVV support from target compiler flags rather than assume it; blocked since 2026-09-23 on an unresolved compilation error |
| 2026-09-30 (still open) | [#5666](https://github.com/facebookresearch/faiss/pull/5666) | HNSW `MinimaxHeap::pop_min` RVV kernel; validated only via Clang syntax-check, no runtime tests yet |
| 2026-09-30 (still open) | [#5688](https://github.com/facebookresearch/faiss/pull/5688) | Bit-exact RVV `decode_vector` for codec-template quantizers (most recent PR found) |

Git tags confirm `v1.15.0` (2026-08-03) and `v1.15.1` (2026-09-16) exist in history. Per `CHANGELOG.md`, RVV scaffolding is attributed to **v1.14.2** (2026-05-21: #5156, #5184), and the same changelog separately states the RVV distance and rabitq kernels "landed in v1.15.1 (2026-09-15: #5354, #5369)." This is internally inconsistent: #5354 and #5369 merged on 2026-06-30 and 2026-07-13 respectively, both well before the v1.15.0 tag date (2026-08-03), so those kernels should already have been present in v1.15.0, not first appearing in v1.15.1. Flagging this as an unresolved discrepancy in the changelog's version attribution rather than resolving it silently.

The port is fully upstream for the components that exist (no out-of-tree fork or vendor patch set is required to get the merged kernels), but it is incomplete: several subsystems remain explicit scalar stubs (Section 4), and three kernel/detection PRs (#5510, #5666, #5688) remain open and unmerged as of 2026-09-30.

## 3. Upstream Support Tier

FAISS publishes no formal platform-tier policy anywhere in the repository (confirmed absent: PLATFORMS.md, SUPPORT.md, docs/platforms/). Tier status must be inferred from CI and release behavior:

- **Build support:** explicit and first-class at the CMake level. `faiss/CMakeLists.txt` detects `CMAKE_SYSTEM_PROCESSOR MATCHES "(riscv64|riscv)"` and selects `FAISS_SIMD_RVV_SRC`; a dedicated toolchain file exists.
- **CI status:** cross-compile plus a narrow QEMU-emulated gtest subset (SIMD dispatch + scalar-quantizer parity only), not the full correctness/recall test suite. See Section 7.
- **Release status:** Meta publishes no riscv64 binary on GitHub Releases or PyPI for either `faiss` or `faiss-cpu`. The only functioning riscv64 binary channel with RVV kernels is RISE's independently-built and independently-hosted wheel (Section 8).
- **Stated maintainer intent:** in the PR #5156 review, mdouze explicitly asked whether real RVV-optimized code would follow the scaffolding "soon" -- signalling the scaffolding was merged expecting later contributions rather than committed internal performance work, which is consistent with the subsequent pattern of external (ZTE/ISCAS/independent) authors doing most of the actual kernel implementation.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI execution | Native runner, full test suite | Native runner, full test suite | Cross-compiled on x86_64 `ubuntu-latest`, QEMU-emulated, narrow gtest filter only |
| Official binary (PyPI faiss-cpu) | Yes | Yes | No |
| Official binary (GitHub Releases) | No (source archives only, for any arch) | No | No |
| Distro packages | Yes, broadly | Yes, broadly | Yes (Ubuntu 26.04 "resolute" `libfaiss-dev`/`python3-faiss`, but at 1.13.2, predating all RVV work) |
| SIMD kernel coverage | Full (AVX2/AVX512, all subsystems) | Full/partial (NEON full, SVE partial) | Partial (core distance, SQ, RaBitQ real; FastScan/PQ-distance/Hamming still scalar) |

Effective tier: **community-contributed with Meta scaffolding and gatekeeping, no committed internal performance-optimization resourcing, and no upstream-published release artifact.**

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 SIMD Dispatch Architecture

FAISS uses a per-SIMD-level translation-unit (TU) design (`*-neon.*`, `*-sve.*`, `*-rvv.*`/`*-riscv.*`), the same pattern used for AVX2/AVX512/NEON/SVE, rather than a separate JIT backend or hand-written assembly. `SIMDLevel::RISCV_RVV` is a registered level in `faiss/utils/simd_levels.h`; its fallback chain is `RISCV_RVV -> NONE` (terminal, no sub-levels). The minimum ISA for this level is `rv64gcv` plus **Zvfhmin/Zvfh** (required for fp16 vector conversion in the scalar-quantizer kernels), compiled with `-march=rv64gcv_zvfhmin -mabi=lp64d`. `faiss/impl/scalar_quantizer/sq-rvv.cpp` enforces this with a hard `#error` if Zvfhmin/Zvfh is not present at compile time -- there is no silent fallback for a missing FP16 extension; the build fails outright. Detection today is purely compile-time (`#if defined(__riscv) && defined(COMPILE_SIMD_RISCV_RVV)`); there is no runtime `getauxval(AT_HWCAP)`-style probe. Open PR [#5510](https://github.com/facebookresearch/faiss/pull/5510) is working to detect RVV support from target compiler flags instead of assuming it on every riscv64 target, but remains blocked on a compile error as of 2026-09-23.

No `arch/riscv/` directory and no `.S` assembly files exist anywhere in the repository (confirmed by targeted code search returning zero hits for both).

### 4.2 RVV Source File Inventory (verified by direct intrinsic-call counting against the cloned repo at commit `88a28bc`)

`FAISS_SIMD_RVV_SRC` in `faiss/CMakeLists.txt` lists the RVV translation units, each compiled with `-march=rv64gcv_zvfhmin -mabi=lp64d` and `COMPILE_SIMD_RISCV_RVV`.

| File | Lines | RVV intrinsic calls | Status |
|---|---|---|---|
| `faiss/impl/scalar_quantizer/sq-rvv.cpp` | 3396 | 693 (68 distinct) | **Full, hand-tuned.** SQ codecs (4/6/8-bit, fp16, bf16, LloydMax), quantizers, similarity/distance computers, encode/decode. Uses `vfloat32m1/m4/m8_t`, `vuint8m1x3_t` tuples, `vfredusum`, variable-length `vsetvl` |
| `faiss/utils/simd_impl/distances_rvv.cpp` | 620 | 164 (43 distinct) | **Full, hand-tuned.** Core distance kernels: L1, L2, inner product, `fvec_L2sqr`, batch-4 variants, `rvv_argmin`, PQ dsub=2 table rows |
| `faiss/utils/simd_impl/rabitq_rvv.cpp` | 192 | 63 (26 distinct) | **Partial.** RaBitQ binary-quantization kernels: SWAR popcount over `vuint8m4_t`, AND/XOR bitwise dot product, reconstruction distance; narrower than the AVX2/AVX512 equivalents |
| `faiss/impl/fast_scan/impl-riscv.cpp` | 104 | 0 | **Scalar stub.** All IVFPQ/RaBitQ FastScan scanner specializations forward to `SIMDLevel::NONE`; source comment: "forward all fast_scan specializations to NONE until dedicated RVV implementations are written" |
| `faiss/impl/pq_code_distance/rvv.cpp` | 70 | 0 | **Scalar stub.** Source comment: "no RVV-optimized PQ code distance exists yet. Use scalar." |
| `faiss/utils/hamming_distance/hamming_computer-rvv.h` | 39 | 0 | **Scalar stub.** All `HammingComputer{16,20,32,64,Default}`/`GenHammingComputer{8,16,32,M8}` specializations inherit the scalar NONE implementation; comment: "There is no RVV-optimized HammingComputer implementation yet" |
| `faiss/impl/binary_hamming/rvv.cpp` | 26 | 0 | Include-only shim wiring binary-index templates to the (stub) RVV hamming computer above |
| `faiss/utils/hamming_distance/hamming_rvv.cpp` | 15 | 0 | Include-only shim |

`faiss/utils/distances_fused/distances_fused.cpp`'s `exhaustive_L2sqr_fused_cmax<SIMDLevel::RISCV_RVV>` unconditionally `return false;` -- the fused blocked BLAS-style top-1 kernel, present on NEON, does not exist for RVV. Open PR [#5666](https://github.com/facebookresearch/faiss/pull/5666) would add an RVV `pop_min` kernel for HNSW's `MinimaxHeap`, validated so far only via Clang syntax-check, not merged.

**Specialization density** (repo-wide `SIMDLevel::X` occurrences): AVX2 304, AVX512 230, ARM_NEON 207, RISCV_RVV 191. **File counts** by architecture family: amd64 (avx2/avx512) 75 files, arm64 (neon/sve) 32 files, riscv64 (rvv) 19 files (10 real kernel/header files plus CI/toolchain/test/shared-dispatch files). No TODO/FIXME/"not implemented" markers were found in the RVV files themselves beyond the source comments quoted above; the stub files are honest scalar wrappers, not disguised placeholders.

| Component | amd64 (AVX2/AVX512) | arm64 (NEON/SVE) | riscv64 (RVV) |
|---|---|---|---|
| Core float distance (fvec_L2sqr, inner_product, etc.) | Full, hand-tuned | Full/partial (NEON full, SVE partial) | **Full, hand-tuned** |
| Scalar quantizer distance compute | Full | Full (~854-line sq-neon.cpp) | **Full, hand-tuned** (largest RVV file, 3396 lines) |
| RaBitQ | Full | Scalar (delegates to NONE) | **Partial** (real but narrower kernels) |
| FastScan / IVFPQ scanning | Full | Partial | **Scalar stub** |
| PQ code distance | Full (AVX2 gather inlining) | Partial | **Scalar stub** |
| Hamming / binary-index computers | Full | Full (~245-line NEON header) | **Scalar stub** |
| Fused exhaustive L2 (blocked top-1) | Full | Full | **Missing** (returns false) |
| HNSW pop_min kernel | Full | N/A | **Open PR, unmerged** (#5666) |
| simdlib abstraction (simdlib_avx2.h / simdlib_neon.h) | Present | Present | **No simdlib_rvv.h** -- RVV bypasses the simdlib layer entirely with direct intrinsics instead [carried forward, not independently reverified this round] |

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `docs/building.md`, or `docs/cross-compilation.md` exists; only the generic `README.md`/`INSTALL.md`, neither of which mentions riscv64 -- `INSTALL.md`'s "supported on x86-64" line does not even list RISC-V. All riscv64 build knowledge lives undocumented in CI config and CMake. No riscv64 Dockerfile or `.ci/docker/` directory exists anywhere; the CI job cross-compiles directly on a standard `ubuntu-latest` runner via multiarch apt, not a container.

### 5.1 Toolchain file: `cmake/toolchains/riscv64-linux-gnu.cmake`

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)

# GCC 14+: the RVV SQ kernels rely on tuple types (vuint8m1x3_t) and
# zvfhmin f16 intrinsics that GCC 13's <riscv_vector.h> does not export.
set(CMAKE_C_COMPILER   riscv64-linux-gnu-gcc-14)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++-14)

set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

**Required toolchain version is GCC 14+, exactly** -- not GCC 13. Both the toolchain file's own comment and [PR #5653](https://github.com/facebookresearch/faiss/pull/5653) (merged 2026-09-21) state the reason: GCC 13's `<riscv_vector.h>` lacks the RVV tuple types (e.g. `vuint8m1x3_t`) and the `zvfhmin` f16 intrinsics the scalar-quantizer kernels need. This was a real, previously-failing CI configuration, fixed by pinning the cross-compiler package explicitly to `gcc-14-riscv64-linux-gnu`/`g++-14-riscv64-linux-gnu`.

### 5.2 Exact CI cross-compile commands (job `linux-riscv64-DD-cmake`, `.github/workflows/build-pull-request.yml`)

```bash
sudo dpkg --add-architecture riscv64
# add Ubuntu Ports (ports.ubuntu.com) as the riscv64 package source, then:
sudo apt-get install -y -qq \
  cmake gcc-14-riscv64-linux-gnu g++-14-riscv64-linux-gnu \
  libopenblas-dev:riscv64 libgomp1:riscv64 qemu-user-static

# bridge multiarch lib path into the sysroot (needed for CMake find_library in ONLY mode)
sudo mkdir -p /usr/riscv64-linux-gnu/usr/lib
sudo ln -sfn /usr/lib/riscv64-linux-gnu /usr/riscv64-linux-gnu/usr/lib/riscv64-linux-gnu

cmake -B build \
  -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/riscv64-linux-gnu.cmake \
  -DBUILD_TESTING=ON -DBUILD_SHARED_LIBS=ON \
  -DFAISS_ENABLE_GPU=OFF -DFAISS_OPT_LEVEL=dd \
  -DFAISS_ENABLE_PYTHON=OFF -DFAISS_ENABLE_C_API=OFF \
  -DBLA_VENDOR=OpenBLAS -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_COMPILER_LAUNCHER=ccache -DCMAKE_CXX_COMPILER_LAUNCHER=ccache \
  -DCMAKE_BUILD_RPATH=/usr/lib/riscv64-linux-gnu .

cmake --build build --target faiss_test -j$(nproc)
```

`-DFAISS_OPT_LEVEL=dd` (Dynamic Dispatch) compiles all SIMD variants including RVV into one binary with runtime feature selection, rather than picking a single `-march` at compile time. `ccache` (key `linux-riscv64-dd`) is used to speed rebuilds.

### 5.3 QEMU usage

```bash
file build/tests/faiss_test | grep -q "RISC-V" || { echo "ERROR: not a RISC-V binary"; exit 1; }

RISCV64_LD=$(find /usr/riscv64-linux-gnu/lib -name "ld-linux-riscv64-*.so.1" | head -1)
qemu-riscv64-static -L /usr/riscv64-linux-gnu "$RISCV64_LD" --list build/tests/faiss_test

qemu-riscv64-static -L /usr/riscv64-linux-gnu build/tests/faiss_test \
  --gtest_filter="SIMDConfig.*:SIMDLevel.*:CompileOptions.*"

qemu-riscv64-static -L /usr/riscv64-linux-gnu build/tests/faiss_test \
  --gtest_filter="*SQRVV*:*D5Overflow*:*D5bLargeDim*:*D10FloatQuery*"

# RVV-specific parity tests, explicitly enabling V and Zvfhmin (QEMU's default
# rv64 CPU model does not enable them), run once at default VLEN and once at 1024:
qemu-riscv64-static -cpu rv64,v=true,x-zvfhmin=true -L /usr/riscv64-linux-gnu \
  build/tests/faiss_test --gtest_filter="ScalarQuantizer.*DistancePathParity*"
qemu-riscv64-static -cpu rv64,v=true,vlen=1024,x-zvfhmin=true -L /usr/riscv64-linux-gnu \
  build/tests/faiss_test --gtest_filter="ScalarQuantizer.*DistancePathParity*"
```

### 5.4 Disabled flags on riscv64

`-DFAISS_ENABLE_GPU=OFF` (no CUDA/ROCm on riscv64), `-DFAISS_ENABLE_PYTHON=OFF` and `-DFAISS_ENABLE_C_API=OFF` in the CI job (cross-build only; RISE's separate native wheel pipeline does enable Python bindings, see Section 8), `-DBLA_VENDOR=OpenBLAS` (MKL silently falls through, x86-only). `perf_tests` are skipped under `CMAKE_CROSSCOMPILING` because they require gflags/Google Benchmark, unavailable cross-compiled.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | Rating | Basis |
|---|---|---|
| Core vector distance (fvec_L2sqr, inner_product, norm_L2sqr, L1, Linf, madd, add/sub, batch-4, _ny variants) | Full, hand-tuned | Real RVV intrinsics, VLEN-runtime-aware, broad coverage close to AVX2/NEON; missing only micro-optimized D2/D4/D8 paths and the fused cmax kernel |
| Scalar quantizer distance compute (SQ4/SQ8/fp16/bf16/LloydMax) | Full, hand-tuned | 693 intrinsic calls across 68 distinct RVV intrinsics, VLEN-generic (m8) design |
| Scalar quantizer codec encode/decode | Full (as of the Sept 2026 kernel cluster, #5602-5641) | Per-variant encode/decode/distance kernels for 8-bit direct, 8-bit direct-signed, fp16, bf16 decode, bit-exact decode_vector |
| RaBitQ kernels | Partial | Real RVV popcount/bit-packing kernels, narrower than AVX2/AVX512 |
| PQ code distance (non-fast-scan IVFPQ scanning) | Scalar | Explicit source comment: "no RVV-optimized PQ code distance exists yet" |
| Fast-scan (IndexPQFastScan, IndexIVFPQFastScan, RaBitQ fast-scan) | Scalar stub | Forwarder-only file, zero RVV kernel calls |
| Hamming / binary distance (HammingComputer*, binary HNSW/IVF/hash) | Scalar | Explicit scalar-fallback inheritance macro |
| Fused exhaustive L2 (blocked BLAS-style top-1) | Missing | Returns false, identical to generic/NONE |
| HNSW MinimaxHeap pop_min | Missing / in-flight | PR #5666 open, unmerged as of 2026-09-30 |
| bf16 conversion | Partial | Vector path with scalar carve-out for n==1 |
| GPU indexes (CUDA-based) | Not applicable | CUDA has no riscv64 port; all GPU indexes absent |

**Functional gaps:** IVFPQ/FastScan query-time scanning, PQ code distance, and Hamming/binary-index distance all run at scalar speed on riscv64 today -- these are the exact operations used at query time for IVFPQ and binary indexes, which are common production configurations for large-scale deployments.

**Performance gaps:** the missing kernels above mean IVFPQ and binary-index query throughput on riscv64 has no SIMD acceleration at all, versus full AVX2/AVX512 on x86 and full/partial NEON on arm64. Measured in-repo benchmarks (Section 8/13) also show two quantizer variants (QT_4bit_uniform, QT_6bit) *regressing* below scalar performance in the RVV path due to slow micro-coded `vluxei32` gather loads, a correctness-adjacent performance defect documented in PR #5535's own review thread.

**Security hardening / NaN semantics:** GitHub search across "riscv nan", "riscv floating", and "riscv correctness" in the repository returned zero issues. The one substantive correctness defect found is architecture-specific but not a NaN/float-semantics bug; it is a data race (Section 11).

## 7. CI/CD Infrastructure

**riscv64 CI exists and is functional, verified directly from the CI YAML at commit `88a28bc`.** Of all 11 GitHub Actions workflow files plus `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus.yml` (none of which exist for FAISS), only `.github/workflows/build-pull-request.yml` references riscv, in job `linux-riscv64-DD-cmake` (lines 357-486).

- **Trigger:** `build-pull-request.yml` declares `on: workflow_call` and is invoked by `build.yml`, which fires on `workflow_dispatch`, every PR into `main`, every push to `main`, and every `v*` tag push. The riscv64 job itself is gated only by `needs.changes.outputs.has_cpu_changes == 'true' || github.event_name != 'pull_request'` (skipped only on GPU-only PRs).
- **Runner:** `ubuntu-latest`, a standard x86_64 GitHub-hosted runner. There is no native riscv64 runner in FAISS's own CI; it cross-compiles and runs everything under `qemu-user-static`/`qemu-riscv64-static`.
- **Test execution:** real, not just a build/link smoke test. Three gtest batches run under QEMU: `SIMDConfig.*:SIMDLevel.*:CompileOptions.*`; `*SQRVV*:*D5Overflow*:*D5bLargeDim*:*D10FloatQuery*`; and `ScalarQuantizer.*DistancePathParity*` run twice (default VLEN and forced VLEN=1024 with `x-zvfhmin=true`). This is genuine RVV-emulated correctness/parity checking, not a bare compile check.
- **What it does not cover:** the full gtest suite (index build/search/recall correctness across IVF, HNSW, PQ, binary indexes), Python bindings (`FAISS_ENABLE_PYTHON=OFF`), the C API (`FAISS_ENABLE_C_API=OFF`), and any GPU path. This scoping is the direct basis for the yellow CI grade: the job is build-verified plus a narrow parity-test slice, not full-suite verified.
- **Not present** in `nightly.yml`, `build-release.yml`, `build-pip.yml`, `build-pip-gpu.yml`, `autoclose.yml`, `retry_build.yml`, `index-io-backward-compatibility.yml`, `update-doxygen.yml`, or `publish-docs.yml`.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | Native x86_64 GitHub-hosted | Native arm64 GitHub-hosted [NEEDS VERIFICATION, not directly checked this round] | Cross-compiled on x86_64 `ubuntu-latest`, QEMU-emulated |
| Test scope | Full gtest suite | Full gtest suite [NEEDS VERIFICATION] | SIMD dispatch + SQ parity only, narrow `--gtest_filter` |
| Python bindings tested | Yes | Yes [NEEDS VERIFICATION] | No (`FAISS_ENABLE_PYTHON=OFF`) |
| Included in nightly/release workflows | Yes | Yes [NEEDS VERIFICATION] | No |

Separately from FAISS's own CI, RISE's `riseproject-dev/python-wheels` repository builds the `faiss-cpu` wheel using **native** RISE bare-metal RISC-V runners (`runs-on: ubuntu-24.04-riscv`, the free RISE RISC-V Runner service announced 2026-03-24), inside a `quay.io/pypa/manylinux_2_39_riscv64` container -- real hardware compilation, not QEMU. This is a separate pipeline from FAISS's own repository CI and does not feed back into facebookresearch/faiss's own test results.

## 8. Distribution and Release Status

| Channel | Version | riscv64 available | Notes |
|---|---|---|---|
| GitHub Releases (facebookresearch/faiss) | up to v1.15.1 | No | Confirmed via the rendered release page: only auto-generated `v1.15.1.zip`/`v1.15.1.tar.gz` source archives, no built binaries of any architecture |
| PyPI `faiss` | 1.5.3 (abandoned ~2019) | No | Only `macosx_10_13_x86_64` and `manylinux1_x86_64` wheels, Python 2.7/3.5/3.6/3.7 |
| PyPI `faiss-cpu` | 1.15.1 (current) | No | Confirmed across the full release history: macOS/Windows/Linux x86_64, arm64/aarch64, musllinux variants; zero filenames contain "riscv" anywhere in the JSON metadata |
| RISE wheel builder (`pypi.riseproject.dev`, `riseproject-dev/python-wheels`) | v1.15.0, v1.15.1 | **Yes** | `faiss_cpu-1.15.0-cp310-abi3-manylinux_2_39_riscv64.whl` and `faiss_cpu-1.15.1-cp310-abi3-manylinux_2_39_riscv64.whl`, tracked in `docs/packages/faiss-cpu.yaml`, status "Patched." Built natively (not QEMU) on RISE's own hardware. [PR #1968](https://github.com/riseproject-dev/python-wheels/pull/1968) rebases a "runtime-detection patch" (RVV detection) and a toolchain patch against upstream's 1.15.1 cpuid-helper namespace change |
| RISE GitLab wheel-status page (`riseproject.gitlab.io/python/wheel_builder/`) | -- | No (stale) | Does not list FAISS among its ~76 packages; out of sync with the newer, actually-functioning GitHub-based `python-wheels` pipeline (created 2026-06-16). The GitHub repo is the current source of truth |
| Ubuntu 26.04 "resolute" | 1.13.2-1build1 | Yes | `libfaiss-dev` and `python3-faiss`, universe section, architectures amd64/arm64/armhf/ppc64el/**riscv64**/s390x. Confirmed via a live fetch with a working `.deb` download link (`python3-faiss_1.13.2-1build1_riscv64.deb`, 2,571.5 kB). Predates all upstream RVV work (v1.14.2+), so it carries no RVV acceleration |
| Debian sid | 1.13.2-1+b1 [carried forward, not reconfirmed this round] | Yes, reported | Native riscv64 build, status "Maybe-Successful" per prior Debian buildd data; also predates RVV work |
| Arch Linux RISC-V (archriscv.felixc.at) | -- | No | Package absent entirely |

**Bottom line for a riscv64 user today:** `pip install faiss-cpu` from the default PyPI index installs nothing usable on riscv64. The only path to a prebuilt binary with RVV acceleration is RISE's own index (`pip install --index-url https://pypi.riseproject.dev/simple faiss-cpu` or equivalent), which is natively built and current (1.15.1). Distro packages (Ubuntu 26.04, Debian sid) provide a working but RVV-free 1.13.2 build. Building from source against `main` gets the current RVV kernel set but requires GCC 14+ and is undocumented in FAISS's own README/INSTALL.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 status |
|---|---|---|---|
| OpenBLAS | BLAS/LAPACK backend for training (GEMM, k-means, PQ training) | Critical, runtime-dependency | Present in Ubuntu 26.04 riscv64 (`libopenblas-dev` 0.3.32+ds-5). RVV 1.0 support since v0.3.28 (ZVL128B/ZVL256B/x280/C910V targets, 221 RVV kernel files), but tested only under QEMU (no native CI) and LAPACK tests are explicitly disabled upstream. See 9.1 |
| OpenMP | Threading/parallelism for index search and training (`find_package(OpenMP REQUIRED)`) | Critical, runtime-dependency | Green. `libgomp1` (GCC's OpenMP runtime) ships with every standard riscv64 GCC toolchain; no riscv64-specific issues identified in FAISS or OpenBLAS research |
| Intel MKL | Preferred BLAS/LAPACK when available (`FAISS_ENABLE_MKL=ON` by default) | Optional, runtime-dependency | Not available -- x86-only. CMake silently falls through to OpenBLAS on riscv64, no user-visible error |
| CUDA | GPU-accelerated index search and training | Optional, runtime-dependency | Not available -- no riscv64 CUDA port. All FAISS GPU indexes are entirely absent on riscv64 |
| GCC | Compiler for `-march=rv64gcv_zvfhmin` codegen | Critical, build-dependency | **GCC 14+ is required, not 13** -- GCC 13's `<riscv_vector.h>` lacks the RVV tuple types and Zvfhmin intrinsics the SQ kernels use; confirmed by the toolchain file and PR #5653. `gcc-14-riscv64-linux-gnu` is available via Ubuntu's multiarch/Ports archive |
| CMake | Build system (architecture detection, toolchain file consumption) | Critical, build-dependency | Green, no riscv64-specific issues found; CMake >= 3.24 required by FAISS generally [carried forward] |
| SWIG | Python-binding code generator (build-time host tool, not linked at runtime) | Optional, build-dependency | Present in Ubuntu 26.04 riscv64 (`swig` 4.4.0-1); SWIG 4.5.0 itself ships riscv64 wheels. Issue #4321 traced a riscv64 `pip install faiss-cpu` failure to misconfigured SWIG include paths in FAISS's own PyPI sdist, not a SWIG defect. Disabled in FAISS's own CI job (`FAISS_ENABLE_PYTHON=OFF`); exercised for real by RISE's native wheel build |
| QEMU | Emulates the riscv64 target binary for CI test execution | Critical, test-dependency | Required by FAISS's own CI (`qemu-user-static`, `qemu-riscv64-static -cpu rv64,v=true[,vlen=1024],x-zvfhmin=true`) since there is no native riscv64 runner in that pipeline. Not needed by RISE's separate native-hardware wheel build |
| googletest | FAISS's test suite (`faiss_test` target) | Critical, test-dependency | Used for all riscv64 gtest filtering in CI (`SIMDConfig.*`, `*SQRVV*`, `ScalarQuantizer.*DistancePathParity*`, etc.); no riscv64-specific googletest issues found |
| Python | Runtime for the `faiss-cpu` Python bindings | Optional, runtime-dependency | Disabled in FAISS's own CI cross-compile job. Used and exercised for real by RISE's native wheel build, which produces `cp310-abi3`/`cp312` manylinux_riscv64 wheels |
| LAPACK (indirect, bundled inside OpenBLAS) | Linear algebra (LU/Cholesky) underlying k-means and PQ training | Critical (via OpenBLAS) | Reference `liblapack-dev` 3.12.1-7ubuntu1 present in Ubuntu 26.04 riscv64, but FAISS in practice links OpenBLAS's *bundled* LAPACK, not this package directly. Not exercised on riscv64 in OpenBLAS's own CI (disabled, "take too long") |
| NumPy (indirect, Python runtime dep of faiss-cpu bindings; also used at build time via `Python::NumPy` for the SWIG extension) | Array/numerics backend for Python bindings | Required for the Python package | `python3-numpy` present in Ubuntu 26.04 riscv64 (1:2.3.5+ds-3ubuntu1); NEP 57 Tier 3; no official PyPI riscv64 wheel yet (tracking issue #30216 open); NPYV has zero riscv64 SIMD backend, all NumPy arithmetic/math falls to scalar C on riscv64 |

### 9.1 OpenBLAS deep-dive (critical numerics dependency)

OpenBLAS is the single highest-risk dependency in this chain. RVV 1.0 kernel support exists (since v0.3.28, targeting ZVL128B/ZVL256B/x280/C910V, 221 RVV kernel files) and it is present and buildable on Ubuntu 26.04 riscv64. However, TRSM has no RVV kernel for the ZVL256B target and a correctness bug, blocking the LU/Cholesky/triangular-solve paths FAISS's training code depends on; there is a known DGEMM correctness regression (OpenBLAS issue #5811) fixed by PR #5815 but unreleased at the time of research; and a GEMM kernel rewrite (PR #5561) has stalled since March 2026. LAPACK's own test suite is disabled in OpenBLAS's CI on riscv64 rather than fixed, so correctness there is effectively unvalidated upstream. This is the same root blocker independently identified in this repository's OpenBLAS and NumPy status reports, both of which FAISS's k-means and PQ training code paths transitively depend on.

### 9.2 NumPy deep-dive (Python binding dependency)

NumPy has no hand-written RVV SIMD kernels on riscv64 (Highway/NPYV has zero riscv64 backend; all vectorized math falls back to plain scalar C). Its own riscv64 wheel-availability gap (no official PyPI wheel, tracking issue #30216 open) mirrors FAISS's own: distro and RISE-built packages exist, but the default PyPI experience is broken on riscv64 for both projects.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4321](https://github.com/facebookresearch/faiss/issues/4321) | riscv64 device build failed | Closed (completed), opened and closed same day, 2025-04-29 | Low | `pip install faiss-cpu` on riscv64 hit dozens of SWIG "Unable to find" header errors. Traced to misconfigured SWIG include paths in FAISS's own PyPI sdist, not a SWIG or general riscv64 defect. No riscv64-specific fix applied |
| [#5534](https://github.com/facebookresearch/faiss/pull/5534) | Fix HNSW concurrent race segfault on RISC-V | **Closed without merging**, 2026-08-25 | **High -- live correctness bug** | See below |
| [#5601](https://github.com/facebookresearch/faiss/pull/5601) | fvec_add/fvec_sub + PQ dsub=2 kernels | Closed without merging, 2026-09-15 | N/A | Not a bug; self-closed by the author, superseded by the functionally equivalent #5655, which merged |
| [#5510](https://github.com/facebookresearch/faiss/pull/5510) | Detect RVV support from target flags | Open, blocked | Medium | Blocked on an unresolved compilation error flagged in review 2026-09-23 |
| PR #5535 in-review findings (QT_4bit_uniform, QT_6bit) | RVV performance regressions vs scalar baseline | Fixed before merge / documented | Low-Medium (performance, not correctness) | 0.22x (QT_4bit_uniform L2) and 0.78-0.88x (QT_6bit) throughput vs scalar, caused by slow micro-coded `vluxei32` gather loads; these quantizer variants remain on the scalar path in practice despite RVV being "available" |

**Correctness bug detail -- PR #5534 (HNSW concurrent race segfault):** author anthony-zy (ZTE) diagnosed that on RISC-V, GCC `-O2` optimizes the `while (i < end) neighbors[i++] = -1` loop in `add_link_tpl` into a byte-wise `memset(0xFF)` (`sb` instructions). A concurrent lock-free reader doing `lw` on the same neighbor slot, while the writer holds a different lock, can observe a torn read (e.g. `0x00FFFFFF`), which passes the `nodeId < 0` check and is used as a valid id, eventually causing an out-of-bounds vector access and a segfault. The proposed fix (a relaxed atomic store plus a defensive bounds check, scoped to `__riscv` only) was reviewed and its root cause validated by maintainer mnorris11, who then explicitly declined to merge it: "We're aiming to delete the lock-based path in a few weeks and make deterministic path the only path, so we can hold off on the patch." The deterministic HNSW build mode (`hnsw_deterministic_build`, from PR #5486) does not exhibit the race, but it is **not the default** (`hnsw_deterministic_build` defaults to false). As of 2026-09-30, the legacy lock-based default path has not been removed, so this is a known, understood, reproducible crash that remains live in FAISS's default (non-deterministic) HNSW build configuration on RISC-V, deliberately left unpatched pending a deletion that has not yet landed.

No open issue specifically targets RISC-V correctness (NaN mishandling, floating-point semantics divergence) as of 2026-09-30; a targeted search across "riscv nan", "riscv floating", and "riscv correctness" returned zero matches.

## 12. Objections and Upstream Blockers

**Objection 1 -- mnorris11 is actively blocking the HNSW race-condition fix (#5534).** Not because the fix is wrong (the root-cause analysis was accepted), but because the plan is to delete the entire legacy lock-based HNSW path rather than patch it. That removal had not landed as of 2026-09-30, so the race condition remains live in the default build path today. This is an organizational/roadmap blocker, not a technical one, and it is the single most consequential open item in this report.

**Objection 2 -- #5510 (RVV auto-detection) is technically blocked.** Reviewer flagged a compile error on 2026-09-23; unresolved as of 2026-09-30. Until it lands, riscv64 targets assume RVV is present rather than probing for it, which is a correctness risk on riscv64 hardware without the V extension (illegal-instruction faults, not silent fallback).

**Objection 3 -- no native CI runner in FAISS's own pipeline.** The CI is cross-compile plus QEMU-emulated narrow-filter tests only; no self-hosted RISC-V runner has been added to `facebookresearch/faiss` itself, even though RISE's free native-runner service (used by the separate `python-wheels` pipeline) exists and is announced publicly.

**Objection 4 -- no simdlib_rvv.h.** The simdlib abstraction used by some SIMD-templated code paths has no RVV variant; the pattern used instead (direct intrinsics in sq-rvv.cpp, bypassing simdlib) was called out favorably by mdouze as "a model on how to implement SVE that is also variable-width," but each kernel still has to be hand-implemented rather than templated through simdlib. [Carried forward from prior analysis, not independently reverified this round.]

**Objection 5 -- Meta retains central gatekeeping.** External RISC-V contributions from ZTE and ISCAS engineers are being accepted and merged at a steady cadence, but every PR is funneled through a Meta engineer's review and internal Differential Revision sync before landing. There is no independent community maintainer with sign-off authority specific to the RISC-V port; acceptance probability for a well-formed, correctly-scoped PR against the current per-SIMD-TU architecture is high (demonstrated by the Sept 2026 kernel cluster merging within days of submission), but nothing merges without a Meta reviewer's approval.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** RISE
- **Optimization level:** partial. Core float distance kernels (`distances_rvv.cpp`), the scalar quantizer (`sq-rvv.cpp`), and RaBitQ (`rabitq_rvv.cpp`) now have real, hand-written RVV intrinsics. FastScan/IVFPQ scanning (`impl-riscv.cpp`), PQ code-distance tables (`pq_code_distance/rvv.cpp`), and the Hamming computers remain explicit scalar (`SIMDLevel::NONE`) fallback stubs, documented as such in the source itself. Closing this gap requires implementing real RVV kernels for those three subsystems; no new ISA extension beyond the already-required `rv64gcv_zvfhmin` baseline is needed to do so.
- **Justification:** FAISS's only riscv64 CI job (`linux-riscv64-DD-cmake` in [.github/workflows/build-pull-request.yml](https://github.com/facebookresearch/faiss/blob/main/.github/workflows/build-pull-request.yml)) cross-compiles for riscv64 on an x86_64 runner and, under QEMU, runs only a narrow gtest filter (`SIMDConfig.*:SIMDLevel.*:CompileOptions.*` plus SQ-RVV tail/parity tests) rather than the full index build/search/recall test suite, and no riscv64 wheel or release asset is published by upstream on GitHub Releases or PyPI (`faiss`/`faiss-cpu`) -- so the CI/release axis lands at yellow (build-verified, not full-test/no upstream release). This is an optimization-purpose numerics library where SIMD-accelerated distance/quantization kernels are central to its value; RVV now covers the main float distance ops, scalar quantizer, and RaBitQ (partial coverage per `faiss/CMakeLists.txt`'s `FAISS_SIMD_RVV_SRC`), which would cap at blue on its own but does not change the CI-set yellow grade.
- **Pending work that could change the grade:** RISE's `riseproject-dev/python-wheels` repo natively builds and publishes riscv64 `faiss-cpu` wheels (v1.15.0/1.15.1, tracked in `docs/packages/faiss-cpu.yaml`) on RISE's own bare-metal RISC-V runners, served from `pypi.riseproject.dev` -- this is currently the only functioning riscv64 binary channel with RVV support, and is the basis for the RISE release-provider designation. Open upstream work: PR #5510 (detect RVV from target flags, blocked on a compile error), PR #5666 (HNSW `pop_min` RVV kernel), PR #5688 (bit-exact RVV `decode_vector`). PR #5534 (fix for a reproducible HNSW concurrent-race segfault on RISC-V) was closed without merging, deliberately deferred by maintainer mnorris11 pending removal of the legacy lock-based HNSW path -- so a known crash remains live on the default (non-deterministic) HNSW build path as of 2026-09-30. Ubuntu 26.04 "resolute" ships `libfaiss-dev`/`python3-faiss` for riscv64 but at 1.13.2, predating all RVV work.

## 14. Investment Analysis

RISE has already solved riscv64 wheel distribution for `faiss-cpu` (native builds on RISE runners, published to `pypi.riseproject.dev`); investment sizing below does not re-price that work. It also has not touched FAISS's own upstream CI scope, kernel completeness, or the open HNSW correctness bug, all of which remain unaddressed by any RISE-side activity found in this research.

### 14.1 Functional Enablement

The library builds, links, and passes its (narrow) riscv64 CI test slice correctly; there is no evidence of a broad functional blocker for CPU-only scalar-fallback workloads. The one functional-correctness item is the HNSW race condition (Section 11), which is a data-integrity risk (segfault / potential silent corruption under concurrency), not a build-time gap. Getting FAISS's own CI to exercise the full gtest suite (not just the SIMD/SQ-parity subset) would surface any further functional gaps in IVFPQ/HNSW/binary-index code paths that the current narrow filter does not test.

### 14.2 Performance Optimization

The highest-value unimplemented kernels for a vector-similarity workload are FastScan/IVFPQ scanning and PQ code distance, both used at query time for IVF-based indexes, and Hamming/binary-index distance for binary indexes. All three are explicit scalar stubs today. RaBitQ has partial coverage that could be extended. Two SQ quantizer variants (QT_4bit_uniform, QT_6bit) currently regress below scalar performance in the RVV path due to inefficient gather-load codegen and need a rework, not just new coverage.

### 14.3 CI/CD Infrastructure

FAISS's own CI remains cross-compile-plus-narrow-QEMU-filter. Extending the gtest filter to the full suite under QEMU, or adding a native riscv64 runner (RISE's free runner service is a plausible fit, though it is not currently wired into `facebookresearch/faiss`'s own workflows), would move the CI axis toward a stronger grade. Re-enabling `FAISS_ENABLE_PYTHON`/`FAISS_ENABLE_C_API` in the cross-compile job (currently both OFF) would also close a testing gap that RISE's separate native build does exercise but FAISS's own CI does not.

### 14.4 Ecosystem Enablement

No dedicated ecosystem-enablement work is identified as outstanding beyond what RISE's automated wheel-builder pipeline already does. Closest related items: getting the RISE-built `faiss-cpu` wheel to track upstream releases more tightly (it currently applies out-of-tree patches, per PR #1968's "runtime-detection patch" and "toolchain patch"), and syncing RISE's own GitLab Pages wheel-status page (currently stale, does not list FAISS) with the GitHub-based `python-wheels` pipeline that actually builds it.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land removal of the legacy lock-based HNSW path (or merge #5534's targeted riscv64 fix directly) to close the live race/segfault | 2-4 | Meta (mnorris11's team) | High |
| Functional | Extend riscv64 CI to the full gtest suite (not just SIMD/SQ-parity filter) | 1-3 | Meta or contributor | High |
| Performance | Implement RVV FastScan/IVFPQ scanner kernels (impl-riscv.cpp) | 4-8 | Internal or external (ZTE/ISCAS precedent) | High |
| Performance | Implement RVV PQ code-distance kernels (pq_code_distance/rvv.cpp) | 3-5 | Internal or external | High |
| Performance | Implement RVV Hamming/binary-index computers | 2-4 | Internal or external | Medium |
| Performance | Fix QT_4bit_uniform / QT_6bit RVV regressions (gather-load rework) | 1-2 | Internal | Medium |
| Performance | Land open kernel PRs already in flight (#5666 pop_min, #5688 decode_vector) | 0.5-1 each (review/merge) | Meta reviewers | Medium |
| Performance | Land #5510 (RVV auto-detection from target flags) | 1-2 (unblock compile error) | Author + Meta reviewer | Medium |
| CI/CD | Wire a native RISC-V runner (e.g. RISE's free runner service) into facebookresearch/faiss's own CI | 1-2 | Meta + RISE coordination | Medium |
| CI/CD | Enable FAISS_ENABLE_PYTHON/C_API in the riscv64 CI job | 1 | Meta | Low |
| Ecosystem | Sync RISE's GitLab Pages wheel-status page with the actual GitHub python-wheels pipeline | <1 | RISE | Low |
| Ecosystem | Track faiss-cpu wheel releases against upstream tags more tightly (reduce RISE's out-of-tree patch set) | Ongoing | RISE | Low |

## 15. References

- [facebookresearch/faiss repository](https://github.com/facebookresearch/faiss)
- [FAISS homepage](https://faiss.ai/)
- [faiss/CMakeLists.txt](https://github.com/facebookresearch/faiss/blob/main/faiss/CMakeLists.txt)
- [cmake/toolchains/riscv64-linux-gnu.cmake](https://github.com/facebookresearch/faiss/blob/main/cmake/toolchains/riscv64-linux-gnu.cmake)
- [.github/workflows/build-pull-request.yml](https://github.com/facebookresearch/faiss/blob/main/.github/workflows/build-pull-request.yml)
- [CHANGELOG.md](https://github.com/facebookresearch/faiss/blob/main/CHANGELOG.md)
- [PR #4503 - RVV optimizations for ScalarQuantizer (open)](https://github.com/facebookresearch/faiss/pull/4503)
- [PR #5057 - Fix static SIMD dispatch to scalar for avx512/arm_sve (merged)](https://github.com/facebookresearch/faiss/pull/5057)
- [PR #5156 - Introduce RVV (merged)](https://github.com/facebookresearch/faiss/pull/5156)
- [PR #5184 - CI: cross-compile for riscv64 with RVV dynamic dispatch (merged)](https://github.com/facebookresearch/faiss/pull/5184)
- [PR #5216 - Move RISC-V fast_scan forwarders to impl-riscv.cpp (merged)](https://github.com/facebookresearch/faiss/pull/5216)
- [PR #5354 - Add RISC-V RVV vector distance kernels (merged)](https://github.com/facebookresearch/faiss/pull/5354)
- [PR #5369 - Add RISC-V RVV rabitq kernels (merged)](https://github.com/facebookresearch/faiss/pull/5369)
- [PR #5510 - Detect RISC-V RVV support from target flags (open, blocked)](https://github.com/facebookresearch/faiss/pull/5510)
- [PR #5534 - Fix HNSW concurrent race segfault on RISC-V (closed, not merged)](https://github.com/facebookresearch/faiss/pull/5534)
- [PR #5535 - RVV optimized scalar quantizer codecs and distance computation (merged)](https://github.com/facebookresearch/faiss/pull/5535)
- [PR #5539 - RVV SIMD specialization for scalar quantizer distance compute (merged)](https://github.com/facebookresearch/faiss/pull/5539)
- [PR #5543 - RVV SIMD specialization for PQ distance-table computation (merged)](https://github.com/facebookresearch/faiss/pull/5543)
- [PR #5600 - Name the SIMD level masks after what they hold (merged)](https://github.com/facebookresearch/faiss/pull/5600)
- [PR #5601 - RVV fvec_add/fvec_sub and PQ dsub=2 kernels (closed, not merged)](https://github.com/facebookresearch/faiss/pull/5601)
- [PR #5653 - Use GCC 14 riscv64 cross-compiler for RVV tuple/zvfhmin intrinsics (merged)](https://github.com/facebookresearch/faiss/pull/5653)
- [PR #5655 - RVV vector arithmetic and PQ distance table kernels (merged)](https://github.com/facebookresearch/faiss/pull/5655)
- [PR #5666 - HNSW MinimaxHeap pop_min RVV kernel (open)](https://github.com/facebookresearch/faiss/pull/5666)
- [PR #5688 - Bit-exact RVV decode_vector for codec-template quantizers (open)](https://github.com/facebookresearch/faiss/pull/5688)
- [Issue #4321 - riscv64 device build failed (closed)](https://github.com/facebookresearch/faiss/issues/4321)
- [faiss-cpu on PyPI](https://pypi.org/project/faiss-cpu/)
- [faiss on PyPI](https://pypi.org/project/faiss/)
- [Ubuntu packages.ubuntu.com riscv64 python3-faiss](https://packages.ubuntu.com/resolute/riscv64/python3-faiss)
- [Ubuntu packages.ubuntu.com riscv64 python3-faiss filelist (jammy)](https://packages.ubuntu.com/jammy/riscv64/python3-faiss/filelist)
- [riseproject-dev/python-wheels repository](https://github.com/riseproject-dev/python-wheels)
- [riseproject-dev/python-wheels PR #1968 - faiss-cpu: Add version 1.15.1](https://github.com/riseproject-dev/python-wheels/pull/1968)
- [riseproject-dev/python-wheels release faiss-cpu v1.15.1](https://github.com/riseproject-dev/python-wheels/releases/tag/faiss-cpu-v1.15.1-20260919012534)
- [RISE Project members](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder status page (GitLab Pages, stale)](https://riseproject.gitlab.io/python/wheel_builder/)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [Easy installation of binary Python packages on riscv64 devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)