---
title: Eigen
categories:
  - libraries
  - ai-ml
---

# Eigen

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Eigen<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Eigen is a header-only C++ template library for linear algebra: dense and sparse matrices, vectors, numerical solvers, and related algorithms. Because it is header-only, it produces no compiled binary artifact; all architecture-specific code is activated at the caller's compile time via template specialization and preprocessor guards.

**License:** Mozilla Public License 2.0 (MPL-2.0). A `reuse lint` job in CI enforces SPDX headers on all files.

**Governance:** No formal foundation, no CLA, no copyright assignment, no tier policy document. Decision-making is consensus-driven via GitLab issues and merge requests. The CONTRIBUTING.md explicitly states there is no formal governance body. Issues labeled "decision needed" signal where maintainer input is required. A Discord server is used for async coordination.

**Maintainers and corporate affiliations (from commit history 2022-2026):**

| Maintainer | Email observed | Affiliation |
|---|---|---|
| Rasmus Munk Larsen | rmlarsen@google.com (through 2024), then noreply | Google through 2024; GitLab profile indicates NVIDIA by 2025 |
| Antonio Sanchez | cantonios@google.com | Google |
| Charles Schlosser | cs.schlosser@gmail.com | Personal email only; affiliation unclear |
| Morris Hafner | mhafner@nvidia.com | NVIDIA |
| Chip Kerchner | ckerchner@tenstorrent.com | Tenstorrent |
| Kseniya Zaytseva | (Syntacore email) | Syntacore |

Google has historically been the dominant corporate backer, with Eigen as a core dependency of TensorFlow. Tenstorrent drove the RISC-V work. NVIDIA is active in maintenance.

**RISE Project:** Eigen is not a RISE member project and is not listed on [riseproject.dev](https://riseproject.dev). No RISE blog post (27 posts scanned, 2024-05 through 2026-06) mentions Eigen. The RISC-V work was funded entirely by Tenstorrent and SpacemiT without RISE involvement.

**Community stance on new architecture ports:** The pattern from the RISC-V port is that submissions backed by a corporate contributor who can maintain CI and fix ongoing breakage are accepted. The first RISC-V MR (!1687, Syntacore, 65 review comments over 13 months) was closed rather than merged. A Tenstorrent-backed rewrite (!2030) superseded it within six weeks of opening. The project expects new architecture ports to come with CI coverage.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-08-01 | Issue #2842 filed by acxz requesting RVV support under `Eigen/src/Core/arch/` | [Issue #2842](https://gitlab.com/libeigen/eigen/-/work_items/2842) |
| 2024-09-03 | MR !1687 opened by Kseniya Zaytseva (Syntacore): first RVV1.0 implementation, Clang-only | [MR !1687](https://gitlab.com/libeigen/eigen/-/merge_requests/1687) |
| 2025-02-11 | Last edit to MR !1687; 65 overview comments accumulated with no merge path | [MR !1687](https://gitlab.com/libeigen/eigen/-/merge_requests/1687) |
| 2025-05-12 | Issue #2930 filed: heap corruption in RVV backend at -O1 on Clang 20.1 (riscv64) | [Issue #2930](https://gitlab.com/libeigen/eigen/-/work_items/2930) |
| 2025-05-16 | Issue #2930 resolved (4 days) | [Issue #2930](https://gitlab.com/libeigen/eigen/-/work_items/2930) |
| 2025-10-17 | MR !2030 opened by Chip Kerchner (Tenstorrent), co-authored with Kseniya Zaytseva; adds GCC support to the earlier design | [MR !2030](https://gitlab.com/libeigen/eigen/-/merge_requests/2030) |
| 2025-10-27 | MR !1687 closed; work carried forward in !2030 | [MR !1687](https://gitlab.com/libeigen/eigen/-/merge_requests/1687) |
| 2025-11-20 | **First RISC-V commit merged to master** (MR !2030); creates `Eigen/src/Core/arch/RVV10/` with 11 header files | [MR !2030](https://gitlab.com/libeigen/eigen/-/merge_requests/2030) |
| 2025-11-21 | MR !2079 by Rasmus Munk Larsen: fix bug introduced by !2030 | [MR !2079](https://gitlab.com/libeigen/eigen/-/merge_requests/2079) |
| 2025-12-05 | MR !2087: fix naming of `predux_half` for LMUL > 1 | [MR !2087](https://gitlab.com/libeigen/eigen/-/merge_requests/2087) |
| 2025-12-10 | MR !2090: fix FP16 compilation under GCC (regression from !2030) | [MR !2090](https://gitlab.com/libeigen/eigen/-/merge_requests/2090) |
| 2025-12-16 | MR !2093: add BF16 packet math for RVV | [MR !2093](https://gitlab.com/libeigen/eigen/-/merge_requests/2093) |
| 2026-01-07 | MR !2096: reactivate GeneralBlockPanelKernel (GEMM) for RVV, which was intentionally deferred in !2030 | [MR !2096](https://gitlab.com/libeigen/eigen/-/merge_requests/2096) |
| 2026-01-09 | MR !2105: fix additional packet math correctness issues after GEMM reactivation | [MR !2105](https://gitlab.com/libeigen/eigen/-/merge_requests/2105) |
| 2026-05-04 | MR !2502: boilerplate cleanup in RVV packet math declarations (no functional change) | [MR !2502](https://gitlab.com/libeigen/eigen/-/merge_requests/2502) |
| 2026-05-05 | MR !2487: complex vector API (std::complex<float> and std::complex<double>) for RVV | [MR !2487](https://gitlab.com/libeigen/eigen/-/merge_requests/2487) |
| 2026-05-05 | MR !2514: add missing SPDX license header to PacketMathDecl.h (compliance fix) | [MR !2514](https://gitlab.com/libeigen/eigen/-/merge_requests/2514) |
| 2026-05-20 | MR !2577: fix compilation failures at VLEN=128 | [MR !2577](https://gitlab.com/libeigen/eigen/-/merge_requests/2577) |
| 2026-05-26 | MR !2583: fix issues at VLEN=1024 (SpacemiT K3 hardware) | [MR !2583](https://gitlab.com/libeigen/eigen/-/merge_requests/2583) |
| 2026-06-15 | MR !2638: add native RISC-V CI runners (SpacemiT hardware) | [MR !2638](https://gitlab.com/libeigen/eigen/-/merge_requests/2638) |
| 2026-06-24 | MR !2658: fix broken RVV CI flag (`-mrvv-vector-bits=256` rejected by GCC-14); fold RVV into default riscv64 builds | [MR !2658](https://gitlab.com/libeigen/eigen/-/merge_requests/2658) |

**Upstreaming status:** Fully upstream on the `master` branch. No fork, no downstream patch set. All 13 merged RVV MRs landed on `master`. The RVV backend has not appeared in any versioned release (the most recent releases are 3.4.1, 2025-09-29 and 5.0.1, 2025-11-08, both of which predate or coincide with the first RVV merge on 2025-11-20, and the CHANGELOG for those releases contains no mention of RISC-V).

**Primary contributors:** Chip Kerchner (Tenstorrent) is responsible for 10 of the 13 merged RISC-V MRs. Kseniya Zaytseva (Syntacore) co-authored MR !2030 and authored the earlier MR !1687. Charles Schlosser (affiliation unclear) contributed the CI infrastructure (MR !2638, !2658) and a boilerplate cleanup (MR !2502). SpacemiT provided the native CI hardware.

---

## 3. Upstream Support Tier

Eigen has no documented tier policy. There is no Tier 1/2/3 classification. The practical tier for riscv64 is inferred from CI behavior:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build jobs | Yes, blocking | Yes, blocking | Yes, `allow_failure: true` |
| CI test jobs | Yes, blocking | Yes, blocking | Yes, `allow_failure: true` |
| Hardware runners | Yes | Yes (or QEMU) | Yes -- SpacemiT K3 native hardware (added June 2026) |
| Vectorization CI | SSE/AVX/AVX-512 tested | NEON tested | RVV tested (fixed in MR !2658, June 24 2026) |
| Benchmark CI | Yes (SSE/AVX/AVX-512, NEON) | Yes | No |
| RVV in released version | n/a | n/a | No -- master only |
| Release gating | Yes | Yes | No |

**Practical tier:** riscv64 is a supported-but-provisional platform. Build and test CI exists with native hardware, but `allow_failure: true` on every job means failures do not block merges or releases. The RVV vectorization backend requires explicit opt-in (`-DEIGEN_RISCV64_USE_RVV10`) and has not shipped in a versioned release. The platform is functionally complete on master but has not graduated to release-gating status.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Eigen's performance-critical path is its packet math layer: a SIMD abstraction over architecture-specific intrinsics, organized under `Eigen/src/Core/arch/<ISA>/`. The RISC-V implementation lives at `Eigen/src/Core/arch/RVV10/`.

### 4.1 Packet Math Layer

The RVV10 directory contains 11 header files totaling approximately 400 KB of C++ source. All RISC-V SIMD code uses RVV 1.0 C intrinsics (`__riscv_v*`). There is no inline assembly.

| File | Size | Content |
|---|---|---|
| PacketMathDecl.h | 11.3 KB | Packet type declarations: int8/16/32/64, float32/64, FP16, BF16, complex variants; LMUL 1/2/4 |
| PacketMath.h | 68.6 KB | Core vectorized ops for all integer and real packet types |
| PacketMath2.h | 63.5 KB | Float/double LMUL=2 variants |
| PacketMath4.h | 64.6 KB | LMUL=4 variants |
| PacketMathBF16.h | 31.2 KB | BF16 packet math |
| PacketMathFP16.h | 39.0 KB | FP16 packet math |
| Complex.h | 30.9 KB | Complex<float> and complex<double> SIMD ops |
| Complex2.h | 47.7 KB | Complex LMUL=2 variants |
| GeneralBlockPanelKernel.h | 31.1 KB | Core GEMM kernel |
| MathFunctions.h | 1.0 KB | Transcendental instantiations (exp, log, sin, cos, sqrt) via generic macros |
| TypeCasting.h | 11.0 KB | Type conversion ops |

### 4.2 Component Coverage by Architecture

| Component | amd64 | arm64 | riscv64 | ISA ext required |
|---|---|---|---|---|
| Int8/16/32/64 SIMD | Hand-tuned (SSE/AVX) | Hand-tuned (NEON) | Intrinsics (RVV 1.0) | `v` |
| Float32/Float64 SIMD | Hand-tuned (SSE/AVX/AVX-512) | Hand-tuned (NEON) | Intrinsics (RVV 1.0) | `v` |
| FP16 (half-precision) | Intrinsics (F16C/AVX-512FP16) | Intrinsics (NEON) | Intrinsics (RVV 1.0) | `v`, `zfh`, `zvfh` |
| BF16 | Intrinsics (AVX-512BF16) | Intrinsics (NEON/BF16) | Intrinsics (RVV 1.0) | `v`, `zvfbfwma` |
| GEMM (GeneralBlockPanelKernel) | Vectorized | Vectorized | Vectorized (re-enabled Jan 2026) | `v` |
| Complex SIMD | Vectorized | Vectorized | Vectorized (added May 2026) | `v` |
| Transcendentals (exp/log/sin) | Vectorized (via packed implementations) | Vectorized | Generic scalar fallback via macros | None (no native vectorized impl) |
| JIT | None (template-based) | None | None | n/a |
| Crypto | None | None | None | n/a |
| Sparse solvers | BLAS/LAPACK optional | BLAS/LAPACK optional | BLAS/LAPACK optional | None |

### 4.3 LMUL Strategy

RVV is a variable-length vector architecture, but Eigen's packet model assumes a fixed compile-time `PacketSize`. The implementation bridges this gap by fixing LMUL at compile time via `EIGEN_RISCV64_DEFAULT_LMUL`. The resulting packet types are named `Packet1Xf` (LMUL=1), `Packet2Xf` (LMUL=2), `Packet4Xf` (LMUL=4) for float32, with equivalent naming for other scalar types. VLEN is also fixed at compile time via `-mrvv-vector-bits=zvl`; the macro `__riscv_v_fixed_vlen` is used internally. Without a fixed VLEN, Eigen emits a compile-time error.

### 4.4 Activation Model

The RVV backend is opt-in, not auto-detected:

- The macro `EIGEN_RISCV64_USE_RVV10` must be explicitly defined via `-DEIGEN_RISCV64_USE_RVV10`.
- `-mrvv-vector-bits=zvl` must be set and `zvl256b` (or another fixed size) must appear in `-march`.
- Without these, code compiles in scalar mode even on a processor with `__riscv_v` defined.

This is by design (stated explicitly in the source), but is less ergonomic than x86/ARM where vectorization is auto-detected from `__AVX__`, `__ARM_NEON`, etc.

### 4.5 Optional zvbb Extension

If `-march` includes the `zvbb` bit-manipulation extension, `pandnot` uses the native `vandn` instruction. Without `zvbb`, Eigen falls back to `vnot` + `vand`. This is the only instance of conditional instruction selection beyond the baseline `v` extension.

---

## 5. Build System, Cross-Compilation, and Toolchain

Eigen uses CMake (minimum 3.23). The build system is straightforward for a header-only library: the primary products are test executables.

### 5.1 Cross-Compilation Command

```
cmake -G Ninja \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++-14 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc-14 \
  -DEIGEN_TEST_CUSTOM_CXX_FLAGS="-march=rv64gc_v_zvl256b_zfh_zvfh;-mrvv-vector-bits=zvl;-DEIGEN_RISCV64_USE_RVV10" \
  <source_dir>
```

Source: [ci/build.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/build.linux.gitlab-ci.yml)

The `-march` string breaks down as:

- `rv64gc` -- base 64-bit with integer, multiply/divide, atomic, and FP extensions
- `_v` -- RVV 1.0 base
- `_zvl256b` -- minimum vector length 256 bits (matches SpacemiT K3 VLEN=256)
- `_zfh` -- scalar FP16
- `_zvfh` -- vector FP16

For BF16 support, append `_zvfbfwma` to `-march`.

### 5.2 Required Toolchain Versions

| Compiler | Minimum tested | Reason |
|---|---|---|
| GCC | 14 | First version with complete fixed-length RVV 1.0 (`-mrvv-vector-bits=zvl`) and `zvfh` extension support |
| Clang | 18 | First version with equivalent RVV 1.0 fixed-length and `zvfh` coverage |

No explicit lower bound is guarded in the RVV source code itself, but the intrinsics and flag syntax used are not available in earlier toolchain versions. Earlier GCC/Clang have incomplete or absent `<riscv_vector.h>` support for fixed-length mode and the `zvfh`/`zfh` extensions.

**Cross-compile package (Ubuntu/Debian):** `g++-14-riscv64-linux-gnu`

### 5.3 QEMU Usage

Eigen CI does NOT use QEMU for riscv64. Tests run on a native SpacemiT K3 hardware runner tagged `riscv`. QEMU is used for other architectures in the CI matrix (arm, aarch64 SME, ppc64le, loongarch64), but not for riscv64.

For independent QEMU-based testing, exclude the `tensor_thread_pool` test (`-DEIGEN_CI_CTEST_EXCLUDE=tensor_thread_pool`), following the pattern used for other emulated architectures in CI.

### 5.4 Docker Images

Build image: `registry.gitlab.com/libeigen/eigen/ubuntu-24.04-riscv64-smoketest-build:latest`
Run image: `registry.gitlab.com/libeigen/eigen/ubuntu-24.04-riscv64-smoketest-run:latest`

Both are Ubuntu 24.04 base. The build image contains gcc-14, g++-14, clang-18, cmake, ninja-build. The run image contains only cmake, xsltproc, libgomp1.

### 5.5 Key CMake Flags

| Flag | Default | Effect |
|---|---|---|
| `EIGEN_BUILD_TESTING` | OFF (non-top-level) | Enables test targets |
| `EIGEN_TEST_NO_EXPLICIT_VECTORIZATION` | OFF | Sets `EIGEN_DONT_VECTORIZE=1` |
| `EIGEN_TEST_NO_EXPLICIT_ALIGNMENT` | OFF | Sets `EIGEN_DONT_ALIGN=1` |
| `EIGEN_BUILD_BLAS` | OFF | Build optional BLAS shim |
| `EIGEN_BUILD_LAPACK` | OFF | Build optional LAPACK shim |
| `EIGEN_BUILD_DOC` | OFF | Disabled automatically when cross-compiling |

`EIGEN_RISCV64_USE_RVV10` is not a CMake option; it is passed as a C++ preprocessor define via `EIGEN_TEST_CUSTOM_CXX_FLAGS`.

### 5.6 Known Build Failures

- GCC-14 rejects `-mrvv-vector-bits=256`. The correct flag is `-mrvv-vector-bits=zvl` combined with `zvl256b` in `-march`. This was the root cause of the broken CI vectorization path discovered in MR !2658 (June 24, 2026). The CI had `allow_failure: true` on the broken job, so the failure went unnoticed until the CI restructuring.
- VLEN=128 had compilation failures, fixed in MR !2577 (May 20, 2026). 17 commits were required to resolve conditional compilation edge cases.
- VLEN=1024 had compilation failures, fixed in MR !2583 (May 26, 2026).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Feature Matrix

| Feature | amd64 | arm64 | riscv64 | Gap description |
|---|---|---|---|---|
| Integer SIMD (int16/32/64) | Full | Full | Full | No gap |
| Float32 SIMD | Full | Full | Full | No gap |
| Float64 SIMD | Full | Full | Full | No gap |
| FP16 packet math | Full | Full | Full (zvfh required) | Requires explicit ISA ext; not all riscv64 hardware has zvfh |
| BF16 packet math | Full (AVX-512BF16 HW) | Full (armv8.6+) | Full (zvfbfwma required) | Requires zvfbfwma; not all riscv64 hardware has this |
| Complex SIMD | Full | Full | Full (added May 2026) | FIXME noted in GeneralBlockPanelKernel for complex×real loadRhsQuad |
| GEMM vectorization | Full | Full | Full (re-enabled Jan 2026) | complex×real path has acknowledged suboptimal loadRhsQuad |
| Transcendental SIMD (exp/log) | Vectorized | Vectorized | Generic scalar fallback | Missing vectorized implementation; falls back to element-wise scalar |
| Masked partial-packet tails | Yes (AVX-512) | Partial | Missing | Issue #3086: `has_packet_segment` not enabled for RVV; scalar fallback for tail elements |
| Auto-detection of SIMD | Yes (`__AVX__` etc.) | Yes (`__ARM_NEON`) | No -- requires explicit `-DEIGEN_RISCV64_USE_RVV10` | Ergonomic gap; must opt in at build time |
| Benchmark CI | Yes | Yes | No | No riscv64 bench targets in CI |
| Release inclusion | Yes | Yes | No -- master only | All RVV work postdates latest release |

### 6.2 Functional Gaps

**GeneralBlockPanelKernel complex×real path:** The `loadRhsQuad` function for `complex<T> x RealScalar` has an explicit `FIXME: we can do better` in the source. The code is functional (no correctness bug), but the implementation is suboptimal compared to the real-type path. No issue or MR has been filed to address this as of the research date.

**Masked partial-packet tails (issue #3086, open May 22, 2026):** RVV is a mask-native ISA that can process tail elements using predicated load/store instructions. Eigen's `has_packet_segment` optimization (which enables this) is not enabled for RVV. Without it, fixed-size matrix assignments fall back to scalar processing for the trailing elements that do not fill a complete packet. On AVX2, the same missing optimization causes approximately a 2x slowdown for fixed-size matrix assignment. The equivalent performance degradation on RVV has not been quantified (no benchmark data available).

### 6.3 Performance Gaps

No published benchmark data exists for Eigen on RISC-V. The benchmark CI covers only x86-64 (SSE/AVX2/AVX-512) and aarch64 (NEON). There are no riscv64 bench targets in CI and no published third-party benchmarks found via web search or the RISE blog.

The following gaps have performance implications but no quantification:

- Missing vectorized transcendentals (exp/log/sin/cos): each element processed scalar. Impact is operation-dependent but potentially 4-16x throughput reduction vs a vectorized implementation.
- Missing `has_packet_segment` for tail elements: ~2x slowdown for fixed-size matrix assignment workloads (estimated from AVX2 data in issue #3086; riscv64 unmeasured).
- No CUDA/HIP/SYCL: GPU offload is unavailable on riscv64 (no applicable runtime exists). This is not a gap relative to arm64 server, which also lacks GPU backends in most deployment scenarios.

### 6.4 Floating-Point Semantics

No RISC-V-specific floating-point semantics issues were reported in the research findings. NaN-aware min/max functions are implemented in the RVV backend. Data not available: no comparative floating-point precision testing between architectures was found in any upstream source.

### 6.5 Security Hardening

Data not available: no search was conducted for architecture-specific security hardening (stack canaries, CFI, pointer authentication) in Eigen. As a header-only template library, security hardening is primarily the responsibility of the consuming application's build flags rather than Eigen itself.

---

## 7. CI/CD Infrastructure

### 7.1 CI Comparison

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build jobs | Yes, blocking | Yes, blocking | Yes, `allow_failure: true` |
| Test jobs | Yes, blocking | Yes (QEMU or hardware), some blocking | Yes, native hardware, `allow_failure: true` |
| Hardware | GitLab SaaS x86-64 | GitLab SaaS arm64 or QEMU | SpacemiT K3 (RVA23, RVV 1.0, VLEN=256) |
| Vectorization tested | SSE/AVX/AVX-512 | NEON/SVE | RVV 1.0 (since MR !2658, June 24 2026) |
| Benchmark jobs | Yes | Yes | No |
| Smoketest (MR-only) | Yes | Yes | Yes (GCC-14 and Clang-18) |
| Full test suite | Yes | Yes | Yes (`:official` and `:unsupported` variants) |
| Compilers tested | GCC + Clang (multiple versions) | GCC + Clang | GCC-14 and Clang-18 only |

### 7.2 riscv64 CI Details

**Build jobs (cross-compiled on amd64 GitLab SaaS runners):**

- `build:linux:riscv64:gcc-14:default` -- full build
- `build:linux:riscv64:clang-18:default` -- full build
- `build:linux:riscv64:gcc-14:default:smoketest` -- MR-only
- `build:linux:riscv64:clang-18:default:smoketest` -- MR-only

**Test jobs (run on native `riscv`-tagged runner):**

- `test:linux:riscv64:gcc-14:default:official`
- `test:linux:riscv64:gcc-14:default:unsupported`
- `test:linux:riscv64:gcc-14:default:smoketest` -- MR-only
- `test:linux:riscv64:clang-18:default:official`
- `test:linux:riscv64:clang-18:default:unsupported`
- `test:linux:riscv64:clang-18:default:smoketest` -- MR-only

All jobs carry `allow_failure: true`. The CI config was read directly from the GitLab repository and confirmed.

**Critical CI gap resolved June 24, 2026:** Until MR !2658, no CI job was actually testing the RVV vectorization backend. The dedicated `build:linux:riscv64:gcc-14:rvv` job passed `-mrvv-vector-bits=256`, which GCC-14 rejects. Because the job had `allow_failure: true`, the failure went unnoticed. MR !2658 replaced the broken standalone job with flags embedded in the base riscv64 job template, ensuring RVV vectorization is exercised in every riscv64 build.

**RISE runners:** No RISE-provided runners are used. The native riscv64 runners are provided by SpacemiT.

Sources: [ci/build.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/build.linux.gitlab-ci.yml), [ci/test.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml)

---

## 8. Distribution and Release Status

### 8.1 Upstream Releases

| Tag | Date | RISC-V content |
|---|---|---|
| 5.0.1 | 2025-11-08 | None -- predates or coincides with first RVV merge (2025-11-20) |
| 3.4.1 | 2025-09-29 | None -- predates first RVV merge |
| 5.0.0 | 2025-09-28 | None |
| 3.4.0 | 2021-08-18 | None |

The CHANGELOG for all released versions contains no mention of RISC-V. All RVV work is available only on the `master` branch.

### 8.2 Distribution Packages

Eigen is a header-only library. All distribution packages are `Architecture: all` / `any`. No compiled binary is produced or distributed.

| Distribution | Package | Version | Architecture | Status |
|---|---|---|---|---|
| Ubuntu 24.04 (noble) | `libeigen3-dev` | 3.4.0-4 | `all` | Installable on riscv64; confirmed via filelist |
| Debian sid | `libeigen3-dev` | 3.4.0-5 | `all` | Available on riscv64 (arch-independent) |
| Debian experimental | `libeigen3-dev` | 5.0.1-1~exp1 | `all` | Available |
| Arch Linux (riscv64 port) | `eigen` | `any`-arch | `any` | Not listed in riscv64 port tracker (expected for `any`-arch packages) |
| PyPI | `eigen` 0.1.1 | `py3-none-any` | Any | Unrelated thin Python wrapper; not the C++ library |

No binary packages for the C++ library need to be "ported" to riscv64 because the library is header-only. What must be ported -- and is -- is the RVV vectorization backend in the source tree.

### 8.3 What a User Must Do

To get RVV-accelerated Eigen on riscv64:

1. Build from the `master` branch (no released version contains RVV support).
2. Pass these compiler flags: `-march=rv64gc_v_zvl256b_zfh_zvfh -mrvv-vector-bits=zvl -DEIGEN_RISCV64_USE_RVV10`.
3. Use GCC-14 or Clang-18 (older toolchains lack the required RVV intrinsics).
4. Hardware must support RVV 1.0; VLEN of 128 through 1024 is supported.

Without step 2, the code compiles in scalar mode even on RVV-capable hardware.

---

## 9. Dependencies

### 9.1 Dependency Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| C++ compiler (GCC-14/Clang-18) | Mandatory: compile headers and tests | Passes (cross-compile) | `allow_failure: true` | Not gating | Older compilers lack RVV 1.0 fixed-length support |
| libm (glibc) | Mandatory: scalar math functions | Available on all riscv64 Linux | Passes | Available | See `project-reports/glibc.md` |
| pthreads | Required for threaded tests | Available | Passes | Available | None |
| OpenBLAS | Optional BLAS backend | Builds on riscv64 | Tested in CI when BLAS backend enabled | Available | See `project-reports/openblas.md` |
| LAPACK | Optional solver acceleration | Builds on riscv64 | Partial (tied to OpenBLAS) | Available | Tied to OpenBLAS riscv64 completeness |
| SuiteSparse (CHOLMOD, UMFPACK, SPQR, KLU) | Optional sparse solvers | Packages available (Debian/Ubuntu) | Not in riscv64 smoketest CI | Available | Not included in CI smoketest image |
| SuperLU | Optional sparse solver | Available (no arch-specific code) | Not in riscv64 smoketest | Available | Not tested |
| PaStiX + METIS | Optional parallel sparse solver | Available | Not in riscv64 smoketest | Available | Not tested |
| CUDA | Optional GPU backend | Not applicable | N/A | N/A | No NVIDIA CUDA runtime for riscv64 |
| HIP/ROCm | Optional AMD GPU backend | Not applicable | N/A | N/A | ROCm does not target riscv64 |
| SYCL (oneAPI DPCPP) | Optional heterogeneous compute | Not applicable | N/A | N/A | Intel oneAPI does not target riscv64 |
| AOCL | Optional BLAS/LAPACK | Not applicable | N/A | N/A | AMD-proprietary, x86 only |
| Boost.Multiprecision | Optional extended precision tests | Available (arch-independent) | Not in riscv64 smoketest | Available | Not tested in CI |
| MPFR + GMP | Optional ulp accuracy testing | Available | Not in riscv64 smoketest | Available | Not tested in CI |
| Doxygen + LaTeX | Documentation generation | Available | N/A | N/A | Auto-disabled when cross-compiling |

### 9.2 Critical Dependency Deep-Dives

**glibc (libm):** Required for scalar math functions. Available on all riscv64 Linux distributions. No blocking issues. See `project-reports/glibc.md` for riscv64 vectorized math library (`libmvec`) status.

**OpenBLAS:** The optional BLAS backend accelerates dense solvers. OpenBLAS has a RISC-V port with RVV kernels under active development. Eigen's CI tests with the BLAS backend when enabled, but riscv64 BLAS-backend coverage in the smoketest image is not confirmed from the research data. See `project-reports/openblas.md`.

**CUDA/HIP/SYCL:** No GPU offload is available on riscv64. This is an architectural gap relative to x86-64 and aarch64 deployments that use GPU acceleration. All three GPU backends explicitly exclude riscv64.

---

## 11. Known Bugs and Active Issues

### 11.1 Correctness Bugs

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2930](https://gitlab.com/libeigen/eigen/-/work_items/2930) | Heap corruption allocating vectors consecutively under RVV | Closed 2025-05-16 | Critical (was) | Heap corruption at -O1 with Clang 20.1 on riscv64; fixed within 4 days of report |

### 11.2 Open Performance/Functional Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2842](https://gitlab.com/libeigen/eigen/-/work_items/2842) | Support RISC-V and RISC-V Vector Extension (RVV) | Open 2024-08-01 | Tracking | Core RVV implementation delivered via MR !2030 and follow-ons; issue remains open as default-on RVV support is not yet complete |
| [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086) | has_packet_segment / masked partial-packet tails absent on RVV | Open 2026-05-22 | Medium | RVV is mask-native but `has_packet_segment` is not enabled; tail elements fall back to scalar. On AVX2 the same gap causes ~2x slowdown for fixed-size matrix assignment. riscv64 impact not quantified. |

### 11.3 Historical CI Bug (Resolved)

The CI from November 2025 through June 24, 2026 was not actually testing RVV vectorization. The dedicated RVV build job used `-mrvv-vector-bits=256`, which GCC-14 rejects. The job carried `allow_failure: true`, so the failure went undetected for seven months. MR !2658 (June 24, 2026) corrected the flag to `-mrvv-vector-bits=zvl` and folded RVV into the default riscv64 build matrix.

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 support were found.** The maintainers reviewed and merged all Tenstorrent-contributed RVV MRs. Rasmus Munk Larsen fixed a regression within one day of the initial merge (MR !2079, November 21, 2025). Charles Schlosser contributed CI infrastructure independently of Tenstorrent.

**Technical blockers:**

1. **No released version contains RVV support.** Users must build from master. The release cadence is irregular (3.4.0 in 2021, 3.4.1 and 5.0.0/5.0.1 in late 2025). There is no stated release schedule. No MR or issue was found requesting a release that includes RVV. [NEEDS VERIFICATION -- no release roadmap document was found]

2. **`allow_failure: true` on all riscv64 CI jobs.** The SpacemiT runner availability is uncertain (the CI comment references "given uncertainty about the runner's availability SLA"). Until this is removed, riscv64 failures are invisible in the merge decision process.

3. **Opt-in activation model.** The `EIGEN_RISCV64_USE_RVV10` flag requirement means downstream projects using Eigen (TensorFlow, JAX, PyTorch internal use) must explicitly update their build systems to enable RVV. This is not an upstream blocker, but it is a deployment friction point.

4. **No vectorized transcendentals.** Missing vectorized `exp`, `log`, `sin`, `cos` for RVV. These would require either a SLEEF-style implementation or contribution to the MathFunctions.h layer for riscv64. No issue or MR exists for this work.

5. **`has_packet_segment` not implemented (issue #3086).** Filed May 2026 with no assigned author and no linked MR. This is the highest-impact known performance gap.

---

## 13. Investment Analysis

RISE has not funded or contributed to Eigen's RISC-V work. The existing work was funded by Tenstorrent (implementation) and SpacemiT (CI hardware). The following sizing covers work not yet completed.

### 13.1 Functional Enablement

**Vectorized transcendentals (exp/log/sin/cos for RVV):**
Implementing vectorized transcendentals requires either: (a) wrapping SLEEF's RISC-V RVV implementations via a helper layer in MathFunctions.h, or (b) implementing polynomial approximations natively in the RVV packet math layer following the pattern used for x86/ARM. Option (a) is lower risk. SLEEF has RVV support (independently verified). The binding layer in Eigen is small (the aarch64 binding is ~200 lines). Estimated effort: 3-4 person-weeks for a SLEEF-backed implementation, including CI validation.

**`has_packet_segment` for RVV (issue #3086):**
Enabling masked tail processing for RVV requires specializing `has_packet_segment<PacketXf>` etc. to return true and implementing the corresponding `ploadu_partial` / `pstoreu_partial` intrinsics. The issue author estimates this is a straightforward addition; the AVX-512 implementation is the reference. Estimated effort: 2-3 person-weeks including testing.

**GeneralBlockPanelKernel complex×real `loadRhsQuad` FIXME:**
The acknowledged suboptimal path in the GEMM kernel for complex×real operations. Impact is limited to workloads mixing complex matrices with real scalars. Estimated effort: 1-2 person-weeks.

### 13.2 Performance Optimization

**Benchmarking infrastructure:**
No riscv64 benchmark targets exist in Eigen CI. Adding riscv64 to the existing `benchmark.gitlab-ci.yml` pipeline (which already runs on SpacemiT hardware for functional tests) is prerequisite to any optimization work. Estimated effort: 1 person-week to add CI bench jobs; ongoing cost is runner time.

**GEMM throughput optimization:**
The current LMUL strategy (compile-time fixed) is functional but may leave performance on the table compared to a dynamic dispatch approach. No quantified gap is available. Optimizing GEMM on specific RISC-V microarchitectures (e.g., SpacemiT X60, SiFive P670) would require profiling on target hardware. This is open-ended work; a reasonable initial scope is 4-6 person-weeks per target microarchitecture.

### 13.3 CI/CD Infrastructure

**Remove `allow_failure: true` from riscv64 CI jobs:**
This requires demonstrating stable native runner availability and consistently passing test suites. SpacemiT is already providing the runners. The primary work is: (a) validating that the test suite passes reliably, (b) negotiating an SLA with SpacemiT or adding a fallback QEMU path, and (c) submitting the CI change for maintainer review. Estimated effort: 1-2 person-weeks.

**Add riscv64 to benchmark CI:**
See section 13.2.

### 13.4 Ecosystem Enablement

Eigen is a C++ library with no package ecosystem of its own (no plugins, no extension packages). The ecosystem impact is entirely through downstream consumers: projects that embed or depend on Eigen (TensorFlow, PyTorch, JAX, OpenCV, numerous robotics and scientific computing frameworks). Enabling those downstream consumers to activate Eigen's RVV backend requires updating their build systems to pass `-DEIGEN_RISCV64_USE_RVV10` and the required `-march` flags. This is work in those downstream projects, not in Eigen itself.

Once RVV support ships in a versioned Eigen release, the activation burden on downstream projects will depend on whether the opt-in flag is still required. If maintainers move to auto-detection, downstream impact drops to zero.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Vectorized transcendentals (exp/log/sin/cos via SLEEF) | 3-4 | Contributor + Tenstorrent review | High |
| Functional | `has_packet_segment` for RVV (issue #3086) | 2-3 | Contributor | High |
| Functional | GeneralBlockPanelKernel complex×real loadRhsQuad FIXME | 1-2 | Contributor | Medium |
| Performance | riscv64 benchmark CI jobs | 1 | CI contributor | High |
| Performance | GEMM throughput profiling and optimization (per microarch) | 4-6 | Performance engineer | Medium |
| CI/CD | Remove `allow_failure: true` from riscv64 jobs | 1-2 | CI contributor + SpacemiT | High |
| Functional | Ship RVV in a versioned release | 0 (depends on release cadence) | Maintainers | Critical (blocking downstream) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Eigen GitLab repository](https://gitlab.com/libeigen/eigen)
- [Eigen homepage](https://eigen.tuxfamily.org/)
- [Issue #2842: Support RISC-V and RISC-V Vector Extension (RVV)](https://gitlab.com/libeigen/eigen/-/work_items/2842)
- [Issue #2930: Heap corruption when allocating vectors consecutively under RVV](https://gitlab.com/libeigen/eigen/-/work_items/2930)
- [Issue #3086: has_packet_segment / masked partial-packet tails absent on RVV](https://gitlab.com/libeigen/eigen/-/issues/3086)
- [MR !1687: RISC-V RVV1.0 support (closed)](https://gitlab.com/libeigen/eigen/-/merge_requests/1687)
- [MR !2030: RVV1.0 support (merged 2025-11-20)](https://gitlab.com/libeigen/eigen/-/merge_requests/2030)
- [MR !2079: Fix bug introduced in !2030](https://gitlab.com/libeigen/eigen/-/merge_requests/2079)
- [MR !2087: Fix naming of predux_half for RVV when LMUL > 1](https://gitlab.com/libeigen/eigen/-/merge_requests/2087)
- [MR !2090: Fix FP16 for RVV so that it will compile for gcc](https://gitlab.com/libeigen/eigen/-/merge_requests/2090)
- [MR !2093: Add basic support for packetmath for BF16 RVV](https://gitlab.com/libeigen/eigen/-/merge_requests/2093)
- [MR !2096: Reactivate GeneralBlockPanelKernel for RVV](https://gitlab.com/libeigen/eigen/-/merge_requests/2096)
- [MR !2105: Fix more packetmath issues for RVV](https://gitlab.com/libeigen/eigen/-/merge_requests/2105)
- [MR !2487: Complex vector API for RISC-V](https://gitlab.com/libeigen/eigen/-/merge_requests/2487)
- [MR !2502: RVV packet math declaration boilerplate cleanup](https://gitlab.com/libeigen/eigen/-/merge_requests/2502)
- [MR !2514: Add missing SPDX license header to PacketMathDecl.h](https://gitlab.com/libeigen/eigen/-/merge_requests/2514)
- [MR !2577: Fix VLEN=128 compilation issues](https://gitlab.com/libeigen/eigen/-/merge_requests/2577)
- [MR !2583: Fix VLEN=1024 issues for RISC-V](https://gitlab.com/libeigen/eigen/-/merge_requests/2583)
- [MR !2638: CI: Add RISC-V runners](https://gitlab.com/libeigen/eigen/-/merge_requests/2638)
- [MR !2658: CI: fix and fold RVV vectorization into default riscv64 builds](https://gitlab.com/libeigen/eigen/-/merge_requests/2658)
- [Eigen RVV10 architecture source tree](https://gitlab.com/libeigen/eigen/-/tree/master/Eigen/src/Core/arch/RVV10)
- [CI build config (build.linux.gitlab-ci.yml)](https://gitlab.com/libeigen/eigen/-/raw/master/ci/build.linux.gitlab-ci.yml)
- [CI test config (test.linux.gitlab-ci.yml)](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml)
- [GitLab tags list](https://gitlab.com/libeigen/eigen/-/tags)
- [Ubuntu 24.04 libeigen3-dev package](https://packages.ubuntu.com/noble/libeigen3-dev)
- [Debian sid libeigen3-dev package](https://packages.debian.org/sid/libeigen3-dev)
- [Debian tracker eigen3](https://tracker.debian.org/pkg/eigen3)
- [PyPI eigen package](https://pypi.org/project/eigen/)
- [RISE Project member list](https://riseproject.dev)