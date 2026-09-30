---
title: Eigen
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: LAPACK
    relation: runtime-dependency
    criticality: optional
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: GMP
    relation: test-dependency
    criticality: optional
  - name: MPFR
    relation: test-dependency
    criticality: optional
  - name: Boost
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="eigen" %}

# Eigen

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for Eigen<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Eigen is a header-only C++ template library for linear algebra: dense and sparse matrices, vectors, numerical solvers, and related algorithms. Because it is header-only, it produces no compiled binary artifact of its own; all architecture-specific code is activated at the consuming application's compile time via template specialization and preprocessor guards.

**License:** Mozilla Public License 2.0 (MPL-2.0), since v3.1.1 (a "simple weak copyleft" license). Earlier versions used LGPL3+.

**Governance:** No formal foundation, no CLA, no copyright assignment, and no documented platform-tier policy (no "Tier 1/2/3" scheme comparable to Rust or LLVM). Decision-making is informal and consensus-driven via GitLab issues and merge requests, with a Discord server used for async coordination; contentious items get a "decision needed" label. The contributing guide asks authors of major features to discuss first and requires tests and documentation before acceptance, and states explicitly: "We need support especially for rarely used compilers and platforms." No MAINTAINERS file exists in the repository (`gitlab.com/libeigen/eigen/-/raw/master/MAINTAINERS` returns 404).

**Hosting and infrastructure:** Current hosting is [GitLab](https://gitlab.com/libeigen/eigen). Tuxfamily hosted the original project site (`eigen.tuxfamily.org`, which now 301-redirects to `libeigen.gitlab.io`). The GCC Compile Farm Project is also credited for infrastructure. No corporate sponsorship program or member tier structure is advertised on the project site, and there is no "Eigen Foundation" of any kind (a web search surfaces an unrelated crypto/restaking project of the same name, "EigenLayer" - not this library).

**Maintainers and corporate affiliations (from commit and merge-request history):**

| Contributor | Role in RISC-V work | Affiliation |
|---|---|---|
| Rasmus Munk Larsen | Fixed the day-one regression from the RVV merge (MR !2079); Google through 2024, GitLab profile indicates NVIDIA by 2025 |
| Antonio Sanchez | Google (general maintainer) |
| Charles Schlosser | Merged MR !2030; personal email only, affiliation unconfirmed |
| Morris Hafner | NVIDIA (general maintainer) |
| Chip Kerchner | Authored the merged RVV backend, MR !2030; confirmed Sr. Staff Performance Engineer at Tenstorrent, has spoken on RISC-V vector-processor programming at RISC-V Summit |
| Kseniya Zaytseva | Authored the first RVV attempt (MR !1687) and co-authored the merged MR !2030 | [NEEDS VERIFICATION] - a prior version of this report attributed her to Syntacore, but this round's research explicitly checked and found no public company affiliation confirmed in available sources. Treat the Syntacore attribution as unconfirmed. |

Google has historically been the dominant corporate backer, with Eigen as a core dependency of TensorFlow. Tenstorrent drove the RISC-V/RVV work; Chip Kerchner authored the implementation that landed on master. SpacemiT provided the CI hardware once a native riscv64 runner was added.

**RISE Project involvement:** Eigen is **not** a RISE member project and is not listed on [riseproject.dev's member page](https://riseproject.dev). The only Eigen mention found across RISE's blog (current feed plus a targeted site search) is one sentence in ["RISE Project Working Group Elections: Results"](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/): Peter Bergner (Tenstorrent) leads the 2026-2027 "Compilers and Toolchains" working group, which "focuses on developing and optimizing GCC, LLVM, GLIBC, binutils, OpenBLAS and Eigen for RISC-V." No PR links, benchmarks, or further detail accompany that sentence. Eigen does not appear on RISE's [Python wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/) as a standalone target, but it does appear as a **vendored, header-only dependency** inside several packages that RISE's `python-wheels` project builds for riscv64 on RISE's native RISC-V CI runners: `aplr` (PR #2335), `hierarchicalforecast` (PR #2542), `dynet38` (PR #2316), `cantera` (PR #2352), `pot` (PR #1823), `libigl` (PR #1772), and `jaxlib` (PR #526, currently blocked upstream because XLA's `embed_bitcode` has no RISC-V LLVM backend support). All of that work is attributed to contributor `luhenry`. In sum, RISE involvement with Eigen itself is real but indirect and secondary: one passing mention as a toolchain-optimization target, plus incidental vendoring inside downstream wheel builds. **No RISE funding or direct code contribution to Eigen's own RVV backend was found**; the RVV work was funded by Tenstorrent (implementation) and SpacemiT (CI hardware).

**Community stance on new architecture ports:** Submissions backed by a corporate contributor who can maintain CI and fix ongoing breakage get accepted; a first RVV attempt without that backing (MR !1687, opened by Kseniya Zaytseva, accumulated 65 review notes over 13 months) was ultimately closed unmerged, and a Tenstorrent-backed rework (MR !2030) superseded it and merged within five weeks of opening. The project expects new architecture ports to reuse the existing backend abstraction pattern (`Eigen/src/Core/arch/<ISA>/PacketMath.h`, modeled here on the ARM SVE backend) and to come with CI coverage.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-08-01 | Issue #2842 filed by `acxz`, requesting RVV support under `Eigen/src/Core/arch/`, citing the SIMDe NEON-to-RVV porting project | [Issue #2842](https://gitlab.com/libeigen/eigen/-/issues/2842) |
| 2024-09-03 | MR !1687 opened by Kseniya Zaytseva: first RVV1.0 implementation, modeled on the ARM SVE backend, 22 files changed | [MR !1687](https://gitlab.com/libeigen/eigen/-/merge_requests/1687) |
| 2025-02-11 | Last substantive commit to MR !1687 (7 commits total); 65 review notes accumulated with no merge path | [MR !1687](https://gitlab.com/libeigen/eigen/-/merge_requests/1687) |
| 2025-05-12 | Issue #2930 filed: heap corruption allocating vectors consecutively under RVV at `-O1 -march=rv64gcv -DEIGEN_RISCV64_USE_RVV10` (SparseMatrix followed by two VectorXd; first vector reports an incorrect size) | [Issue #2930](https://gitlab.com/libeigen/eigen/-/issues/2930) |
| 2025-05-16 | Issue #2930 resolved (4 days) | [Issue #2930](https://gitlab.com/libeigen/eigen/-/issues/2930) |
| 2025-10-17 | MR !2030 opened by Chip Kerchner (Tenstorrent), co-authored with Kseniya Zaytseva: reworked successor to !1687 adding GCC compatibility, `EIGEN_RISCV64_DEFAULT_LMUL`, and FP16 (`PacketXh`) support; 34 commits, 11 files changed | [MR !2030](https://gitlab.com/libeigen/eigen/-/merge_requests/2030) |
| 2025-10-27 | MR !1687 closed, unmerged; work continued in !2030 | [MR !1687](https://gitlab.com/libeigen/eigen/-/merge_requests/1687) |
| 2025-11-20 | **MR !2030 merged to master** by Charles Schlosser, creating `Eigen/src/Core/arch/RVV10/` and closing tracking issue #2842's original implementation gap | [MR !2030](https://gitlab.com/libeigen/eigen/-/merge_requests/2030) |
| 2025-11-21 | MR !2079 merged by Rasmus Munk Larsen, 9 minutes after opening: one-line preprocessor fix (`#elif defined(EIGEN_ARCH_RISCV)` to `#elif EIGEN_ARCH_RISCV`) correcting a bug where `EIGEN_ARCH_RISCV` (a numeric 0/1 macro, not an undefined-or-defined one) made that `#elif` branch always evaluate true, breaking the SVE/other-architecture branches of the same chain | [MR !2079](https://gitlab.com/libeigen/eigen/-/merge_requests/2079) |
| 2026-08-21 | Commit "Avoid NaN seeds in RVV min/max reductions" on `arch/RVV10/` | [RVV10 source tree](https://gitlab.com/libeigen/eigen/-/tree/master/Eigen/src/Core/arch/RVV10) |
| 2026-08-29 | MR !2944 merged: preserves explicit stack-allocation limits on RVV, fixing `ConfigureVectorization.h` unconditionally overwriting `EIGEN_STACK_ALLOCATION_LIMIT` | [MR !2944](https://gitlab.com/libeigen/eigen/-/merge_requests/2944) |
| 2026-09-14 | Commit "Core: Fix scalar complex GEMM accumulation on RVV" on `arch/RVV10/` | [RVV10 source tree](https://gitlab.com/libeigen/eigen/-/tree/master/Eigen/src/Core/arch/RVV10) |
| 2026-09-27 | **Issue #2842 closed** by Florian Maurin | [Issue #2842](https://gitlab.com/libeigen/eigen/-/issues/2842) |

**Upstreaming status:** Fully upstream on `master`; no fork, no downstream patch set. As of today, `Eigen/src/Core/arch/RVV10/` on master contains 11 header files (`PacketMathDecl.h`, `PacketMath.h`, `PacketMath2.h`, `PacketMath4.h`, `PacketMathFP16.h`, `PacketMathBF16.h`, `Complex.h`, `Complex2.h`, `TypeCasting.h`, `MathFunctions.h`, `GeneralBlockPanelKernel.h`) - independently confirmed by fetching the GitLab repository tree directly. This is materially more than the 6 files that landed in the original MR !2030 diff (`MathFunctions.h`, `PacketMath.h`, `PacketMath2.h`, `PacketMath4.h`, `PacketMathFP16.h`, `TypeCasting.h`), meaning follow-on work after November 2025 added complex-number support, BF16 support, the LMUL-2 complex variant, and the GEMM kernel file to the backend. The RVV backend has **not** appeared in any versioned release: the most recent tags are `5.0.1` (2025-11-08) and `3.4.1` (2025-09-29), both predating the first RVV merge (2025-11-20), and neither CHANGELOG mentions RISC-V.

**Primary contributors:** Chip Kerchner (Tenstorrent) authored the merged core backend (MR !2030) and is the dominant contributor to ongoing RVV maintenance commits through September 2026. Kseniya Zaytseva co-authored MR !2030 and authored the earlier, unmerged MR !1687. Rasmus Munk Larsen (Google through 2024, then NVIDIA) fixed the immediate post-merge regression. Charles Schlosser merged the core MR. SpacemiT supplied native CI hardware (SpacemiT K3).

## 3. Upstream Support Tier

Eigen has no documented tier policy; riscv64's practical tier is inferred from CI behavior:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build jobs | Yes, blocking | Yes, blocking | Yes, `allow_failure: true` |
| CI test jobs | Yes, blocking | Yes, blocking | Yes, native hardware, `allow_failure: true` |
| Hardware runners | GitLab SaaS x86-64 | GitLab SaaS arm64 (or QEMU for some jobs) | SpacemiT K3 (RVA23 profile, RVV 1.0, VLEN=256), a single self-hosted machine |
| Vectorization tested | SSE/AVX/AVX-512 | NEON/SVE/SME | RVV 1.0 |
| Benchmark CI | Yes | Yes | No |
| RVV in a released version | n/a | n/a | No - master/nightly only |
| Release gating | Yes | Yes | No |

**Practical tier:** riscv64 is a supported-but-provisional platform. Build and native test CI exist on real hardware, which clears the bar for "tested" rather than merely "build-only," but every riscv64 job carries `allow_failure: true`, so riscv64 failures cannot block a merge or a release. The RVV backend requires explicit opt-in (`-DEIGEN_RISCV64_USE_RVV10`) and has shipped in no versioned release.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Eigen's performance-critical path is its packet math layer, a SIMD abstraction organized under `Eigen/src/Core/arch/<ISA>/` (listed today alongside AVX, AVX512, AltiVec, Default, GPU, HVX, LSX, MSA, NEON, RVV10, SME, SSE, SVE, SYCL, ZVector). The RISC-V implementation lives at `Eigen/src/Core/arch/RVV10/` and uses RVV 1.0 C intrinsics (`<riscv_vector.h>`, symbols such as `__riscv_vfadd_vv_f32m1`, `__riscv_vfmadd_vv_f32m1`, `__riscv_vle32_v_f32m1`, `__riscv_vrgather_vv_f32m1`, `__riscv_vmfeq_vv_f32m1_b32`, `__riscv_vsse32`). There is no inline assembly and no JIT backend, consistent with Eigen's other SIMD backends.

### 4.1 Component Coverage by Architecture

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Integer SIMD (int8/16/32/64) | Hand-tuned (SSE/AVX) | Hand-tuned (NEON) | Hand-tuned (RVV 1.0 intrinsics) | No stub markers found in source |
| Float32/Float64 SIMD | Hand-tuned (SSE/AVX/AVX-512) | Hand-tuned (NEON) | Hand-tuned (RVV 1.0 intrinsics) | Direct source inspection of `PacketMath.h` confirms real hardware intrinsics throughout |
| FP16 (half precision) | Intrinsics (F16C/AVX-512FP16) | Intrinsics (NEON) | Hand-tuned, dedicated `PacketMathFP16.h` (`f16m1` intrinsics, two packet widths) | Requires `zfh`/`zvfh` extensions |
| BF16 | Intrinsics (AVX-512BF16) | Intrinsics (NEON/BF16) | `PacketMathBF16.h` present | Requires `zvfbfmin`/`zvfbfwma`; GCC-only in current CI (see 5.6) |
| Complex SIMD | Vectorized | Vectorized | `Complex.h` + `Complex2.h` present (LMUL 1 and 2) | Not present in the original MR !2030 file list; added in later follow-on work |
| GEMM (`GeneralBlockPanelKernel`) | Vectorized | Vectorized | Vectorized, RVV-specialized kernel present | Eigen's single most important operation; this is the primary differentiating hot path and is fully covered for RVV |
| Transcendentals (exp/log/sin/cos) | Vectorized (packed polynomial implementations) | Vectorized | **Scalar per-element fallback** | `MathFunctions.h` for RVV is ~1 KB versus tens of KB for the packet-math files; no native vectorized polynomial implementation exists for RVV |
| Masked partial-packet tails | Yes (AVX-512) | Partial | **Not enabled** | Open issue [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086): `has_packet_segment` is not enabled for RVV even though RVV is a mask-native ISA well suited to it |
| Runtime SIMD dispatch | Auto-detected (`__AVX__` etc.) | Auto-detected (`__ARM_NEON`) | **No** - explicit compile-time opt-in only | Requires `-DEIGEN_RISCV64_USE_RVV10` and a fixed `-mrvv-vector-bits=zvl`; `__riscv_v_fixed_vlen` must be set or compilation fails |

### 4.2 LMUL and Vector-Length Strategy

RVV is a variable-length vector architecture, but Eigen's packet model assumes a fixed compile-time packet size. The implementation bridges this by fixing LMUL at compile time via `EIGEN_RISCV64_DEFAULT_LMUL` (default 1), yielding packet type families named e.g. `Packet1Xf` (LMUL=1), `Packet2Xf` (LMUL=2), `Packet4Xf` (LMUL=4) for float32, with equivalents for other scalar types. VLEN is also fixed at compile time via `-mrvv-vector-bits=zvl`. This is a deliberate design constraint of RVV's fixed-length compilation model, not evidence of an incomplete implementation, but it is materially less ergonomic than x86/ARM, where vectorization is auto-detected from macros such as `__AVX__` or `__ARM_NEON`.

### 4.3 Known Functional Gaps in the Architecture Layer

- **Vectorized transcendentals**: no RVV implementation exists for `exp`, `log`, `sin`, `cos`, etc.; these fall back to scalar-per-element code even when other packet operations are fully vectorized.
- **Masked partial-packet tails** (issue [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086), opened 2026-05-22, open, no assigned owner): RVV's native mask/predication support is not wired into Eigen's `has_packet_segment` mechanism, so fixed-size matrix assignments fall back to scalar processing for elements that don't fill a complete packet. On the analogous AVX2 case, the same missing optimization causes roughly a 2x slowdown for fixed-size matrix assignment; the RVV-specific impact is unquantified.
- **GEMM complex x real path**: an explicit `FIXME: we can do better` remains in `GeneralBlockPanelKernel.h` for the `loadRhsQuad` function handling `complex<T> x RealScalar`, functionally correct but not optimal. No dedicated issue or MR addresses it as of this writing.

## 5. Build System, Cross-Compilation, and Toolchain

Eigen uses CMake (minimum 3.18 per `cmake_minimum_required(VERSION 3.18)` in the top-level `CMakeLists.txt`). Because the library is header-only, the primary CI build products are the test executables.

### 5.1 Exact Cross-Compilation Commands (current CI, Ubuntu 26.04 images)

GCC-15 job:

```
mkdir -p .build && cd .build

cmake -G Ninja \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++-15 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc-15 \
  -DCMAKE_CXX_COMPILER_TARGET=riscv64-linux-gnu \
  -DEIGEN_TEST_CUSTOM_CXX_FLAGS="-march=rv64gc_v_zvl256b_zfh_zvfh_zvfbfmin_zvfbfwma;-mrvv-vector-bits=zvl;-DEIGEN_RISCV64_USE_RVV10" \
  ..

cmake --build . --target buildtests -- -k0
```

Clang-21 job (bfloat16 flags dropped - see 5.6):

```
cmake -G Ninja \
  -DCMAKE_CXX_COMPILER=clang++-21 \
  -DCMAKE_C_COMPILER=clang-21 \
  -DCMAKE_CXX_COMPILER_TARGET=riscv64-linux-gnu \
  -DEIGEN_TEST_CUSTOM_CXX_FLAGS="-march=rv64gc_v_zvl256b_zfh_zvfh;-mrvv-vector-bits=zvl;-DEIGEN_RISCV64_USE_RVV10" \
  ..
```

No `CMAKE_TOOLCHAIN_FILE` is used. Cross-compilation is driven purely by `CMAKE_CXX_COMPILER`/`CMAKE_C_COMPILER` pointing at riscv64-prefixed binaries, plus `CMAKE_CXX_COMPILER_TARGET=riscv64-linux-gnu` for clang's `--target=` flag. Source: [ci/build.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/build.linux.gitlab-ci.yml).

The `-march` string: `rv64gc` (base integer/multiply-divide/atomic/FP) + `v` (RVV 1.0) + `zvl256b` (fixed 256-bit minimum vector length, matching the SpacemiT K3 runner's VLEN=256) + `zfh`/`zvfh` (scalar/vector FP16) + `zvfbfmin`/`zvfbfwma` (GCC-only, BF16 widening operations).

### 5.2 Required Toolchain Versions and Why

| Compiler | CI-pinned version | Reason |
|---|---|---|
| GCC (cross) | gcc-15 (`g++-15-riscv64-linux-gnu`) | Needed for the `-mrvv-vector-bits=zvl` syntax that pins the vector length; also used for the BF16 (`zvfbfmin`/`zvfbfwma`) packet build |
| Clang | clang-21 | Cross-compiles via `--target=riscv64-linux-gnu`. **Known bug**: clang 21 crashes mangling any function signature containing a fixed-length (`riscv_rvv_vector_bits`) RVV bfloat16 vector type; fixed in clang 22. This is why BF16 flags are GCC-only in the current CI matrix. |
| CMake | 3.18 minimum | Top-level `CMakeLists.txt` floor |
| Generator | Ninja | Used in every Eigen CI job |

Cross-compile package (Ubuntu/Debian): `g++-15-riscv64-linux-gnu`.

### 5.3 QEMU Usage: None for riscv64

This is explicit and deliberate, unlike several other architectures in the same CI matrix. The 32-bit arm, ppc64le, loongarch64, and aarch64-SVE/SME jobs all set `-DCMAKE_CROSSCOMPILING_EMULATOR=qemu-<arch>;-L;/usr/<triple>` to run build-time execution under QEMU user-mode emulation. riscv64 jobs do not: builds cross-compile on amd64, and tests run natively on the riscv runner (SpacemiT K3, RVA23, RVV 1.0, VLEN=256). The `ubuntu-26.04-riscv64-smoketest-run` Docker image is itself assembled without emulation - riscv64 `.deb`s are fetched and unpacked on an amd64 host and copied into the final riscv64-platform image in a single `COPY`, explicitly to avoid "the qemu-emulated apt-get that otherwise hangs when building a riscv64 image on an amd64 runner" (source comment in the Dockerfile).

### 5.4 Docker Images

Build image (amd64 host, cross-compiles to riscv64): `registry.gitlab.com/libeigen/eigen/ubuntu-26.04-riscv64-smoketest-build:latest`, built from `ci/docker/ubuntu-26.04-riscv64-smoketest-build/Dockerfile`. Installs `cmake ninja-build git ccache curl ca-certificates python3 g++-15-riscv64-linux-gnu clang-21`.

Run image (native riscv64, test-only, no compilers): `registry.gitlab.com/libeigen/eigen/ubuntu-26.04-riscv64-smoketest-run:latest`, built from `ci/docker/ubuntu-26.04-riscv64-smoketest-run/Dockerfile`. Binaries are cross-built on amd64 and transferred as artifacts; this image only runs them. It carries `cmake` (for `ctest`), `xsltproc` (CTest-XML-to-JUnit conversion), `libgomp1` (OpenMP runtime for test binaries), and `python3` (drives `ci/scripts/test_cache.py`), all fetched natively from `ports.ubuntu.com` for the `riscv64` architecture.

### 5.5 Key CMake Flags

| Flag | Default | Effect |
|---|---|---|
| `EIGEN_BUILD_TESTING` | OFF (non-top-level) | Enables test targets (aliases `BUILD_TESTING`) |
| `EIGEN_BUILD_BLAS` | ON at top level | Build the bundled reference BLAS implementation; CI does not disable it for riscv64 |
| `EIGEN_BUILD_LAPACK` | ON at top level | Build the bundled reference LAPACK implementation |
| `EIGEN_BUILD_DOC` | ON at top level | Auto-disabled when `CMAKE_CROSSCOMPILING` is true, since docs require running executables on the host |
| `EIGEN_BUILD_DEMOS`, `EIGEN_BUILD_PKGCONFIG`, `EIGEN_BUILD_CMAKE_PACKAGE`, `EIGEN_INSTALL` | ON at top level | Turn OFF explicitly when cross-compiling to avoid building host-only artifacts |

`EIGEN_RISCV64_USE_RVV10` is not a CMake `option()`; it is a C++ preprocessor define passed through `EIGEN_TEST_CUSTOM_CXX_FLAGS`. There is no dedicated `EIGEN_TEST_RVV` toggle.

### 5.6 Known Build Issues

- **GCC/Clang version mismatch on BF16**: Clang 21 crashes when mangling fixed-length RVV bfloat16 vector types (fixed upstream in clang 22); CI therefore omits `zvfbfmin_zvfbfwma` from the clang-21 job's `-march` and only exercises BF16 packets on the gcc-15 job.
- **`zvbb` bit-manipulation extension is optional**: if present in `-march`, `pandnot` uses the native `vandn` instruction; without it, Eigen falls back to `vnot` + `vand`. This is the only conditional instruction selection beyond the baseline `v` extension.
- **Compile-fail tests are skipped on native riscv64 test runs**: patterns matching `(_ok|_ko)$|^buildfailtests$|^buildsystem_` are excluded, because compile-fail tests need the amd64 cross toolchain, not the native riscv64 test image.
- [NEEDS VERIFICATION] A prior version of this report described a distinct GCC-14-era bug (`-mrvv-vector-bits=256` rejected, silently masked by `allow_failure: true` for roughly seven months, fixed in an MR described as `!2658` in June 2026). The current CI toolchain has since moved to gcc-15/clang-21 and Ubuntu 26.04; this round's research verified the gcc-15/clang-21 configuration directly from the raw CI YAML but did not independently re-confirm MR !2658's existence, number, or date via the GitLab API. Treat the specific MR number and historical date as unverified; the underlying `-mrvv-vector-bits=zvl` (not a numeric value) requirement is independently confirmed as current, correct CI practice.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Feature Matrix

| Feature | amd64 | arm64 | riscv64 | Gap description |
|---|---|---|---|---|
| Integer SIMD | Full | Full | Full | No gap |
| Float32/Float64 SIMD | Full | Full | Full | No gap |
| FP16 packet math | Full | Full | Full (requires `zfh`/`zvfh`) | Not all riscv64 hardware implements these extensions |
| BF16 packet math | Full (AVX-512BF16) | Full (armv8.6+) | Full (requires `zvfbfmin`/`zvfbfwma`) | GCC-only in current CI due to a clang 21 codegen bug |
| Complex SIMD | Full | Full | Full | Added after the initial merge; GEMM complex x real path has an acknowledged `FIXME` |
| GEMM vectorization | Full | Full | Full | The primary differentiating hot path; fully covered |
| Transcendental SIMD (exp/log/sin/cos) | Vectorized | Vectorized | **Scalar per-element fallback** | No native vectorized implementation exists for RVV |
| Masked partial-packet tails | Yes (AVX-512) | Partial | **Missing** | Issue [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086), open, unowned |
| Auto-detection of SIMD | Yes | Yes | **No** | Requires explicit `-DEIGEN_RISCV64_USE_RVV10` plus a fixed `-mrvv-vector-bits=zvl` |
| Benchmark CI | Yes | Yes | **No** | No riscv64 targets in Eigen's own benchmark pipeline |
| Release inclusion | Yes | Yes | **No** - master only | All RVV work postdates the latest tagged release (5.0.1, 2025-11-08) |

### 6.2 Correctness and Consistency Gaps

- **Signed-zero inconsistency in min/max** (issue [#3116](https://gitlab.com/libeigen/eigen/-/issues/3116), opened 2026-08-19, open): `PropagateNaN` min/max produces different signed-zero results depending on whether the scalar or packet path is taken, reproducible on RVV, NEON, and CUDA (x86 SSE is consistent).
- **GEMM half/bfloat16 accumulation precision** (issue [#3158](https://gitlab.com/libeigen/eigen/-/issues/3158), opened 2026-09-08, open): bfloat16 GEMM at k=1024 shows approximately 22% relative error versus approximately 0.17% when accumulation happens in float; the issue proposes RVV `vfwmacc`/`vfwmaccbf16` widening kernels for `gebp_traits<..., Architecture::RVV10>` as one fix.
- **GEMM threshold tuning** (issue [#3119](https://gitlab.com/libeigen/eigen/-/issues/3119), opened 2026-08-20, open): `EIGEN_FIXED_SIZE_GEMM_TO_COEFFBASED_THRESHOLD` needs platform-specific measurement, and riscv64/RVV is explicitly listed among the untuned platforms.
- **Strided-load opportunity** (issue [#3169](https://gitlab.com/libeigen/eigen/-/issues/3169), opened 2026-09-16, open): proposes optimizing stride-2 `pgather`, noting RVV "already has native strided loads" as a candidate target - an unrealized optimization rather than a defect.
- **`pldexp` factorization** (issue [#3183](https://gitlab.com/libeigen/eigen/-/issues/3183), opened 2026-09-26, open): proposes splitting `2^e` into three factors instead of four for a 15-22% latency / 1-25% throughput gain on x86; RVV float/double handling is discussed in the same issue alongside a pre-existing double-rounding bug.
- **Resolved**: architecture-dependent rounding caused a `StructuredMatrices` exact-equality unit test to fail on RISC-V with GCC 15 (issue [#3154](https://gitlab.com/libeigen/eigen/-/issues/3154), opened and closed within a day, 2026-09-08 to 2026-09-09; approximately 5.13e-18 relative error).
- **Resolved**: heap corruption allocating consecutive vectors under RVV at `-O1` (issue [#2930](https://gitlab.com/libeigen/eigen/-/issues/2930), opened 2025-05-12, closed 2025-05-16 - 4 days).

### 6.3 Performance Gaps

Eigen's own official benchmark suite ([libeigen.gitlab.io/benchmarks](https://libeigen.gitlab.io/benchmarks/), most recent set dated September 2026) covers only Intel Xeon Gold 6444Y (AVX-512), AMD Zen 5, and Apple M4 (SME/NEON) - **no riscv64 or generic arm64 entries exist**. No riscv64 bench targets exist in Eigen's CI at all.

The only quantitative riscv64 performance data found is from an independent academic paper, not from Eigen's own infrastructure: Puzikova, Sokolov, and Zaytseva, "RISC-V Acceleration for Linear Algebra Problems: Eigen Library Enhancements with RVV Support," PaCT 2025 (Springer LNCS, DOI [10.1007/978-3-032-06751-7_13](https://link.springer.com/chapter/10.1007/978-3-032-06751-7_13)). The paper is paywalled at both Springer and ACM DL; only abstract-level figures were retrievable: a claimed **2.5-3x speedup over scalar implementations** and **11% higher throughput than OpenBLAS (RVV-optimized)**, benchmarked on three RISC-V boards (Kendryte K230, Banana Pi, Lichee Pi) with an ARM Cortex-A73/NEON reference point. This is a single source with no independently reproducible methodology, matrix sizes, or per-operation breakdown available; **[NEEDS VERIFICATION]**.

Unquantified performance gaps with clear mechanisms:
- Missing vectorized transcendentals: every `exp`/`log`/`sin`/`cos` element is processed scalar; impact is operation-dependent but potentially a large throughput reduction versus a vectorized implementation, unmeasured for RVV specifically.
- Missing `has_packet_segment` for tail elements: on the analogous AVX2 case this causes roughly a 2x slowdown for fixed-size matrix assignment (issue [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086)); riscv64 impact unmeasured.
- A separate, non-RVV-specific GEMM kernel improvement (MR [!3187](https://gitlab.com/libeigen/eigen/-/merge_requests/3187), merged 2025-09-27) reports a median +17.5% on Apple M4 across 276 shapes and up to +11% on AVX2 for specific sizes; no RVV numbers are given, but it indicates the kind of shared-kernel gains that could in principle extend to RVV once its transcendental/tail gaps close.
- No CUDA/HIP/SYCL on riscv64: GPU offload is unavailable, since none of those runtimes target the architecture. This is not a gap relative to most arm64 server deployments either.

### 6.4 Floating-Point Semantics

NaN-aware min/max functions are implemented in the RVV backend, but issue [#3116](https://gitlab.com/libeigen/eigen/-/issues/3116) documents a signed-zero inconsistency between RVV's scalar and packet paths (shared with NEON and CUDA). No broader comparative floating-point precision study between architectures was found in any upstream source; data not available beyond the specific issues cited in 6.2.

### 6.5 Security Hardening

Data not available: no architecture-specific security hardening search (stack canaries, CFI, pointer authentication) was performed. As a header-only template library, hardening is primarily the responsibility of the consuming application's build flags rather than Eigen itself.

## 7. CI/CD Infrastructure

Eigen is hosted on GitLab, not GitHub, and uses GitLab CI natively. All riscv64 CI configuration was fetched directly from `https://gitlab.com/libeigen/eigen/-/raw/master/...` and confirmed byte-for-byte (not via summarized page scraping).

### 7.1 CI Comparison

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build jobs | Yes, blocking | Yes, blocking | Yes, `allow_failure: true` |
| Test jobs | Yes, blocking | Yes, blocking (QEMU or hardware) | Yes, native hardware, `allow_failure: true` |
| Hardware | GitLab SaaS x86-64 | GitLab SaaS arm64 or QEMU | SpacemiT K3 (RVA23, RVV 1.0, VLEN=256), single self-hosted machine |
| Vectorization tested | SSE/AVX/AVX-512 | NEON/SVE/SME | RVV 1.0 |
| Benchmark jobs | Yes | Yes | **No** |
| Compilers tested | GCC + Clang, multiple versions | GCC + Clang | gcc-15 and clang-21 only |
| QEMU used | No (native) | For arm/ppc64le/loongarch64/aarch64-SVE-SME jobs, not necessarily arm64-NEON | **No** - native test execution only |

### 7.2 riscv64 CI Job Inventory

**Build jobs** (cross-compiled on amd64 runners, image `EIGEN_CI_IMAGE_LINUX_RISCV64_SMOKETEST_BUILD`):
- `build:linux:riscv64:gcc-15:default`
- `build:linux:riscv64:clang-21:default`
- smoketest and `:affected` (MR-diff-scoped) variants of each

**Test jobs** (run on the native `riscv`-tagged runner, image `EIGEN_CI_IMAGE_LINUX_RISCV64_SMOKETEST_RUN`):
- `test:linux:riscv64:gcc-15:default:official` / `:contrib`
- `test:linux:riscv64:clang-21:default:official` / `:contrib`
- `test:linux:riscv64:gcc-15:default:smoketest`
- `test:linux:cross:riscv64:gcc-15:failtest:affected`

All of the above carry `allow_failure: true`. Source: [ci/build.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/build.linux.gitlab-ci.yml), [ci/test.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml).

**Docker image build jobs**: `build:docker:ubuntu-26.04-riscv64-smoketest-build` and `...-run`, using `docker buildx build --platform linux/riscv64` (the run image) from `ci/docker/ubuntu-26.04-riscv64-smoketest-{build,run}/Dockerfile`. Source: [ci/images.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/images.gitlab-ci.yml).

**Runner constraints**: `ci/common.gitlab-ci.yml` explicitly documents the `riscv` tag as a single self-hosted machine, with measured queue-timeout data (5563s, 6475s, 6786s observed) justifying the `allow_failure: true` guards. The smoketest tier is namespace-guarded to the upstream `libeigen` namespace only (forks cannot reach it), but the non-smoketest `:official`/`:contrib` test jobs inherit a broader rule set with no such guard, meaning fork/external-MR pipelines can still attempt to schedule onto the runner and hang until timeout, per the maintainers' own CI comment.

**RISE runners:** Not used. The native riscv64 CI hardware is SpacemiT-provided (SpacemiT K3), unrelated to RISE's own RISC-V CI runner project.

## 8. Distribution and Release Status

### 8.1 Upstream Releases

| Tag | Date | RISC-V content |
|---|---|---|
| 5.0.1 | 2025-11-08 | None - predates the first RVV merge (2025-11-20) by 12 days |
| 3.4.1 | 2025-09-29 | None |
| 5.0.0 | 2025-09-28 | None |
| 3.4.0 | 2021-08-18 | None |

No tagged release contains any RVV code. All RVV work exists only on the `master`/nightly line.

### 8.2 Distribution Packages

Eigen is header-only; every distribution package is architecture-independent (`Architecture: all` / `any`). No compiled binary is produced or distributed by Eigen itself.

| Distribution | Package | Version | Architecture | riscv64 status |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libeigen3-dev` | 3.4.0-5 | `all` (universe) | Installable on riscv64 (confirmed via the package detail page: a single row, architecture `all`), but the packaged source is Eigen **3.4.0** (2021) - it predates the RVV work by roughly four years and contains none of it |
| Ubuntu 26.04 "resolute" | `libeigen3-doc` | 3.4.0-5 | `all` | Same as above |
| Ubuntu 26.04 "resolute" | `python3-minieigen`, `r-cran-rcppeigen` | various | includes riscv64 (e.g. `r-cran-rcppeigen` lists riscv64 explicitly) | Real compiled riscv64 binaries, but these are third-party wrapper/binding packages that link against Eigen's headers at build time; Eigen itself contributes no compiled object code beyond inlined templates |
| PyPI | `eigen` | 0.1.1 | `py3-none-any` | **Unrelated project.** A small pure-Python package ("Methods for solving eigenproblems"), not the C++ Eigen library. No riscv64-specific build exists or is needed for it. |
| RISE wheel builder (`pypi.riseproject.dev`) | `eigen` | - | - | Redirects to the same unrelated PyPI package; not a RISE-built artifact of the real library |
| Arch Linux riscv64 port | `eigen` | - | - | Not independently confirmed this round; the port's status dashboard (`archriscv.felixc.at`) is a client-rendered page with no queryable backend reachable by direct fetch |

**Discrepancy note:** a prior draft of this report listed Debian sid (`libeigen3-dev` 3.4.0-5) and Debian experimental (5.0.1-1~exp1) entries. This round's live research verified only the Ubuntu 26.04 resolute channel directly; the Debian entries were not re-confirmed and should be treated as [NEEDS VERIFICATION] pending a direct check of `packages.debian.org`.

### 8.3 What a User Must Do to Get RVV-Accelerated Eigen on riscv64

1. Build from the `master` branch - no released version contains RVV support, and the Ubuntu/Debian distro packages ship a pre-RVV 3.4.0 snapshot regardless of version-string suffix.
2. Pass the compiler flags: `-march=rv64gc_v_zvl256b_zfh_zvfh[_zvfbfmin_zvfbfwma];-mrvv-vector-bits=zvl;-DEIGEN_RISCV64_USE_RVV10`.
3. Use gcc-15 or clang-21 or newer (older toolchains lack the required fixed-length RVV intrinsics and `-mrvv-vector-bits=zvl` syntax); note the clang-21 BF16 mangling bug (fixed in clang 22) if BF16 packets are needed.
4. Target hardware supporting RVV 1.0; VLEN from 128 to 1024 bits is supported by the packet-type design, though current upstream CI only validates VLEN=256 (SpacemiT K3).

Without step 2, code compiles in scalar mode even on RVV-capable hardware, since there is no runtime auto-detection.

## 9. Dependencies

### 9.1 Dependency Table

| Dependency | Role | Relation / criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| GCC | Primary CI compiler; cross-toolchain `g++-15-riscv64-linux-gnu` | Build-dependency, critical | Confirmed packaged: installed directly from the Ubuntu 26.04 archive in Eigen's own build-image Dockerfile | Drives `test:linux:riscv64:gcc-15:*` jobs | Not shipped (compiler, not a runtime artifact) | All riscv64 jobs carry `allow_failure: true`; needed for the GCC-only BF16 (`zvfbfmin`/`zvfbfwma`) path |
| LLVM | Alternate compiler; `clang-21` cross-compiles via `--target=riscv64-linux-gnu` | Build-dependency, critical | Confirmed packaged: installed natively from the Ubuntu 26.04 archive in the same Dockerfile | Drives `test:linux:riscv64:clang-21:*` jobs | Not shipped | Known bug: clang 21 crashes mangling fixed-length RVV bfloat16 vector types, fixed in clang 22; BF16 flags are omitted from the clang job as a result |
| CMake | Required build-system generator for all configs and tests; minimum 3.18 | Build-dependency, critical | Confirmed packaged for riscv64: baked into the run image via `cmake:riscv64` fetched from `ports.ubuntu.com` | Drives `ctest` execution in the run image | Available as an Ubuntu riscv64 port package | No blocking issues observed |
| Ninja | Build tool used by every Eigen CI job (`-G Ninja`) | Build-dependency, optional | `ninja-build` baked into the amd64 build image (cross-compilation happens on amd64) | Used to drive the build stage only | Available as a standard package | No blocking issues observed |
| glibc | C library / libm for scalar math functions underlying all Eigen code | Runtime-dependency, critical | Present in the Ubuntu 26.04 riscv64 base image (`libstdc++6`/`libgcc-s1`) | Present in run image | Mature riscv64 port, long-established on Debian/Ubuntu | See `project-reports/glibc.md` for riscv64 vectorized math library (`libmvec`) status |
| OpenBLAS | Optional external BLAS backend for solver/GEMM equivalence tests (`EIGEN_TEST_EXTERNAL_BLAS`) | Runtime-dependency, optional | Package presumed available on riscv64 (long-established Debian/Ubuntu port); OpenBLAS itself has RVV kernel development in progress [NEEDS VERIFICATION - not independently checked this round] | Not confirmed exercised in the riscv64 CI jobs reviewed - the riscv64 pipeline runs the default/core test tier, not the full optional-backend matrix | Available via distro packaging | See `project-reports/openblas.md` |
| LAPACK | Optional external Fortran LAPACK backend for solver equivalence tests; Eigen also ships its own bundled reference LAPACK (`EIGEN_BUILD_LAPACK`) | Runtime-dependency, optional | Requires a Fortran toolchain (`gfortran`); riscv64 availability not directly verified this session | Not confirmed exercised in the riscv64 CI jobs reviewed | Available via distro packaging (`liblapack-dev`) | Fortran-toolchain riscv64 coverage unverified |
| OpenMP | Parallel-execution runtime used by some Eigen benchmarks and multi-threaded tests, provided by GCC's `libgomp1` | Runtime-dependency, optional | Confirmed packaged for riscv64: `libgomp1:riscv64` explicitly fetched from `ports.ubuntu.com` in the smoketest-run Dockerfile | Part of the run image used to execute riscv64 test binaries | Available as a distro package | Directly confirmed present, unlike most other optional dependencies in this table |
| GMP | Backs MPFR for arbitrary-precision arithmetic, used in ULP-accuracy testing | Test-dependency, optional | Package presumed available (`libgmp-dev`, long-established riscv64 port) [NEEDS VERIFICATION] | Not confirmed exercised in the riscv64 CI jobs reviewed | Available via distro packaging | Optional module, not in the default/core riscv64 CI tier |
| MPFR | Arbitrary-precision float library; used by `unsupported/Eigen/MPRealSupport` and ULP-accuracy tests | Test-dependency, optional | Package presumed available (`libmpfr-dev`) [NEEDS VERIFICATION] | Not confirmed exercised in the riscv64 CI jobs reviewed | Available via distro packaging | Same caveat as GMP |
| Boost (>=1.53) | Backs the `Eigen/Boost::Multiprecision` test module | Test-dependency, optional | Package presumed available (`libboost-dev`) [NEEDS VERIFICATION] | Not confirmed exercised on riscv64 CI | Available via distro packaging | Not observed as built or tested in the riscv64 job matrix reviewed |

### 9.2 Additional Indirect/Recursed Dependencies Found in Research

These are not in the mandatory dependency list above but surfaced during dependency research as optional Eigen backends whose riscv64 status is relevant context:

| Dependency | Role | riscv64 status |
|---|---|---|
| Python 3 | CI scripting (cache pruning, `ci/scripts/test_cache.py`) - not needed to use Eigen itself | Confirmed packaged natively for riscv64, installed from `ports.ubuntu.com` in the run image |
| FFTW3 | Backend for the `unsupported/Eigen/FFT` module | Package presumed available (`libfftw3-dev`); not observed in the riscv64 CI job matrix reviewed |
| SuiteSparse (CHOLMOD, UMFPACK, KLU, SPQR) | Optional sparse-solver backends used in `test/` sparse-solver comparisons | Packages available on Debian/Ubuntu; not included in the riscv64 smoketest CI image |
| SuperLU, PaStiX + METIS | Optional sparse-solver backends | Available, no architecture-specific code; not tested in riscv64 CI |
| CUDA / HIP (ROCm) / SYCL (oneAPI DPC++, triSYCL, ComputeCpp) | GPU offload test backends | Not applicable to riscv64 - none of these runtimes target the architecture |
| AOCL | AMD-proprietary optional BLAS/LAPACK | Not applicable - x86-only |
| Doxygen + LaTeX | Documentation generation | Available on riscv64 but auto-disabled by CMake when cross-compiling |

**Note on the project-graph database:** a project-graph MCP query was attempted to cross-check Ubuntu/Debian package availability for each dependency above but the server failed to connect (`CONNECTION_CLOSED`) throughout this research session. The riscv64-availability claims in this section rely instead on direct inspection of Eigen's own CI Dockerfiles (which fetch several of these packages by name from `ports.ubuntu.com`) and on general knowledge of long-established Debian/Ubuntu riscv64 porting status for the remainder; the latter is marked [NEEDS VERIFICATION] above where CI did not directly confirm it.

## 11. Known Bugs and Active Issues

### 11.1 Correctness Bugs (Resolved)

| ID | Title | Status | Notes |
|---|---|---|---|
| [#2930](https://gitlab.com/libeigen/eigen/-/issues/2930) | Heap corruption allocating vectors consecutively under RVV | Closed (2025-05-12 to 2025-05-16, 4 days) | Repro: allocate a `SparseMatrix` then two `VectorXd` at `-O1 -march=rv64gcv -DEIGEN_RISCV64_USE_RVV10`; first vector reports an incorrect size, indicating silent heap corruption |
| [#3154](https://gitlab.com/libeigen/eigen/-/issues/3154) | StructuredMatrices capacitance fast-path exact-equality test fails on RISC-V GCC 15 | Closed (2026-09-08 to 2026-09-09, 1 day) | Approximately 5.13e-18 relative error, architecture-dependent rounding, caused an exact-equality unit test (not a real numerical defect) to fail |

### 11.2 Open Issues

| ID | Title | Opened | Severity | Notes |
|---|---|---|---|---|
| [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086) | `has_packet_segment` / masked partial-packet tails not enabled for RVV | 2026-05-22 | Medium-High (performance) | RVV is a mask-native ISA not opted into this optimization; ~2x slowdown for fixed-size matrix assignment on the analogous AVX2 case; no assigned owner |
| [#3158](https://gitlab.com/libeigen/eigen/-/issues/3158) | GEMM half/bfloat16 products accumulate in operand type | 2026-09-08 | High (correctness/precision) | bf16 GEMM at k=1024: ~22% error vs ~0.17% with float accumulation; proposes RVV `vfwmacc`/`vfwmaccbf16` widening kernels |
| [#3116](https://gitlab.com/libeigen/eigen/-/issues/3116) | min/max PropagateNaN signed-zero results differ between scalar and packet paths on RVV, NEON, CUDA | 2026-08-19 | Medium (correctness/consistency) | x86 SSE is consistent; RVV, NEON, CUDA are not |
| [#3119](https://gitlab.com/libeigen/eigen/-/issues/3119) | Tune `EIGEN_FIXED_SIZE_GEMM_TO_COEFFBASED_THRESHOLD` across platforms | 2026-08-20 | Low-Medium (performance) | riscv64 RVV explicitly listed among platforms needing measurement |
| [#3169](https://gitlab.com/libeigen/eigen/-/issues/3169) | Optimize stride-2 `pgather` on additional SIMD backends | 2026-09-16 | Low (performance opportunity) | Notes RVV "already has native strided loads" as a candidate target |
| [#3183](https://gitlab.com/libeigen/eigen/-/issues/3183) | `pldexp` could split 2^e into three factors instead of four | 2026-09-26 | Low-Medium (performance) | 15-22% latency / 1-25% throughput gain proposed on x86; RVV float/double handling discussed; also touches a pre-existing double-rounding bug |
| [#2842](https://gitlab.com/libeigen/eigen/-/issues/2842) | Support RISC-V and RISC-V Vector Extension (RVV) - master tracking issue | 2024-08-01 | Tracking | **Closed 2026-09-27** by Florian Maurin, three days before this report's date. See Section 13 for how this interacts with the readiness grade's pending-work notes. |

### 11.3 Recently Merged Fixes

MR [!2944](https://gitlab.com/libeigen/eigen/-/merge_requests/2944) (merged 2026-08-29): preserves explicit stack-allocation limits on RVV, fixing `ConfigureVectorization.h` unconditionally overwriting `EIGEN_STACK_ALLOCATION_LIMIT` and breaking tests that intentionally disabled the stack-allocation check.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found; maintainers reviewed and merged every Tenstorrent-backed RVV MR, and Rasmus Munk Larsen fixed a post-merge regression within one day (MR !2079, one commit, merged 9 minutes after opening).

**Technical and process blockers:**

1. **No released version contains RVV support.** Users must build from `master`; the Ubuntu 26.04 distro package is stuck on the pre-RVV 3.4.0 snapshot. Release cadence is irregular (3.4.0 in 2021, then 3.4.1 and 5.0.0/5.0.1 in quick succession in September-November 2025). No issue or MR requesting a release that includes RVV was found. [NEEDS VERIFICATION - no release roadmap document exists]
2. **`allow_failure: true` on every riscv64 CI job.** The SpacemiT runner is explicitly documented as a single self-hosted machine with measured multi-hour queue timeouts; until reliability is demonstrated and the flag removed, riscv64 failures cannot block a merge or release.
3. **Non-smoketest test jobs are reachable from forks despite the single-runner constraint.** The `:official`/`:contrib` test tiers inherit a rule set without the namespace guard that protects the smoketest tier, so external-MR pipelines can schedule onto the sole riscv64 runner and hang until timeout, per the maintainers' own CI comment - an operational fragility rather than a rejection of riscv64 itself.
4. **Opt-in activation model.** `EIGEN_RISCV64_USE_RVV10` requires every downstream project (TensorFlow, JAX, PyTorch's internal use, etc.) to explicitly update its build system to enable RVV; this is deployment friction, not an upstream blocker.
5. **No vectorized transcendentals and no masked-tail handling (issue #3086).** Both are acknowledged gaps with no assigned owner or open MR as of this report.

**Organizational:** RISE has not funded or directly contributed to Eigen's RVV backend; the work was funded by Tenstorrent (implementation) and SpacemiT (CI hardware), with Eigen falling only nominally under RISE's "Compilers and Toolchains" working-group scope.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro
- **Optimization-purpose project:** yes
- **Optimization level:** partial

**Specific operations lacking RISC-V implementations:** vectorized transcendentals (`exp`, `log`, `sin`, `cos`) have no RVV implementation and fall back to scalar-per-element code; masked partial-packet tail handling (`has_packet_segment`) is not enabled for RVV (open issue [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086)), which on the analogous AVX2 case causes roughly a 2x slowdown for fixed-size matrix assignment. No additional ISA extension closes either gap by itself; both require RVV-specific implementation work inside `Eigen/src/Core/arch/RVV10/`.

**Justification:** Eigen has upstream GitLab CI that both cross-compiles for riscv64 and runs the full test suite natively on real riscv64 hardware (SpacemiT K3, `tags: [riscv]`) via jobs like `test:linux:riscv64:gcc-15:default:official` in [ci/test.linux.gitlab-ci.yml](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml) - this is genuine test execution, not build-only, so it clears the yellow "build-only" bar. However, every riscv64 job carries `allow_failure: true` (non-gating), and Eigen publishes no riscv64-specific artifact itself (it is header-only; the merged RVV backend, [MR !2030](https://gitlab.com/libeigen/eigen/-/merge_requests/2030), merged 2025-11-20, postdates the latest tagged release 5.0.1 from 2025-11-08, so no release contains it yet) - build=yes, test=yes, upstream release=no maps to **blue**. The only riscv64-consumable package is Debian/Ubuntu's arch-`all` `libeigen3-dev`, a distro-provided (not upstream-published) artifact. The merged RVV10 backend gives full coverage of the primary differentiating hot paths - integer/float/double packet SIMD, FP16/BF16 packets, complex SIMD, and the `GeneralBlockPanelKernel` GEMM kernel (Eigen's single most important operation) - which is why the optimization level is rated "partial" rather than "minimal": the main differentiating operation (GEMM) is fully vectorized, but two real gaps remain on secondary paths (transcendentals, masked tails). "Partial" caps at blue with no change, since the CI-based primary grade was already blue.

**Pending work that could change the grade:** Issue [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086) (masked tail handling) is open with no assigned owner. All riscv64 CI jobs still carry `allow_failure: true` pending demonstrated runner-SLA stability. No versioned Eigen release yet contains the RVV backend, so users must build from master with `-DEIGEN_RISCV64_USE_RVV10`. No vectorized transcendentals exist for RVV. No RISE funding or involvement was found; the work is funded by Tenstorrent and SpacemiT hardware. (Note: tracking issue #2842 itself shows `state: closed`, closed 2026-09-27 per direct GitLab API verification - three days before this report's date. Its closure appears to track the core backend having landed rather than the "default-on"/build-time-opt-in concern being resolved, since `EIGEN_RISCV64_USE_RVV10` still gates the backend and no release ships it. The substance of that pending-work item - RVV is still opt-in, not default, and not yet released - remains accurate regardless of the tracking issue's own open/closed state.)

## 14. Investment Analysis

RISE has not funded or contributed to Eigen's RISC-V work; it was funded by Tenstorrent (implementation) and SpacemiT (CI hardware). The sizing below covers work not yet completed.

### 14.1 Functional Enablement

**Vectorized transcendentals (exp/log/sin/cos for RVV):** Requires either (a) wrapping SLEEF's RISC-V RVV implementations via a helper layer in `MathFunctions.h`, or (b) implementing polynomial approximations natively in the RVV packet-math layer following the x86/ARM pattern. Option (a) is lower risk; SLEEF has RVV support. The binding layer for comparable architectures (e.g. aarch64) is roughly 200 lines. Estimated effort: 3-4 person-weeks including CI validation.

**`has_packet_segment` for RVV (issue #3086):** Requires specializing `has_packet_segment<PacketXf>` etc. to return true and implementing the corresponding `ploadu_partial`/`pstoreu_partial` intrinsics; the AVX-512 implementation is the reference pattern. Estimated effort: 2-3 person-weeks including testing.

**GEMM complex x real `loadRhsQuad` FIXME:** Limited to workloads mixing complex matrices with real scalars. Estimated effort: 1-2 person-weeks.

**Precision fix for bf16 GEMM accumulation (issue #3158):** Implement RVV `vfwmacc`/`vfwmaccbf16` widening accumulation kernels to close the ~22%-vs-~0.17% error gap. Estimated effort: 1-2 person-weeks, contingent on maintainer agreement on the accumulation-type API change.

### 14.2 Performance Optimization

**Benchmarking infrastructure:** No riscv64 benchmark targets exist in Eigen CI at all. Adding riscv64 to the existing benchmark pipeline (which would reuse the SpacemiT hardware already available for functional tests) is prerequisite to any further optimization work. Estimated effort: 1 person-week for initial CI bench jobs; ongoing cost is runner time.

**GEMM threshold tuning and stride-2 pgather (issues #3119, #3169):** Narrow, well-scoped measurement and implementation tasks already filed upstream. Estimated effort: 1 person-week each.

**GEMM throughput optimization on specific microarchitectures:** The current fixed-LMUL strategy is functional but leaves an unquantified amount of performance on the table versus a more dynamic approach. No baseline data exists. Open-ended; a reasonable initial scope is 4-6 person-weeks per target microarchitecture (e.g. SpacemiT X60, SiFive P670).

### 14.3 CI/CD Infrastructure

**Remove `allow_failure: true` from riscv64 CI jobs:** Requires demonstrating stable native-runner availability and consistently passing test suites, plus closing the namespace-guard gap that currently lets fork pipelines schedule onto and hang the single runner. Estimated effort: 1-2 person-weeks, contingent on SpacemiT's willingness to expand runner capacity or provide an SLA.

**Add riscv64 to benchmark CI:** See 14.2.

### 14.4 Ecosystem Enablement

Eigen has no package ecosystem of its own (no plugins, no extension registry). The ecosystem impact runs entirely through downstream consumers that embed or link Eigen: TensorFlow, PyTorch's internal use, JAX/XLA, OpenCV, and numerous robotics/scientific-computing frameworks. RISE's own `python-wheels` project already builds several Eigen-vendoring Python packages for riscv64 on native RISC-V CI runners (`aplr`, `cantera`, `dynet38`, `hierarchicalforecast`, `pot`, `libigl`; `jaxlib` is blocked on an unrelated XLA/LLVM riscv64 backend gap), demonstrating that downstream enablement is tractable today even without Eigen's own opt-in flag being the default. Once RVV support ships in a versioned Eigen release, the remaining activation burden on downstream projects will depend on whether maintainers move from explicit opt-in to auto-detection; until then, each downstream project must pass `-DEIGEN_RISCV64_USE_RVV10` and the required `-march` flags itself.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Vectorized transcendentals (exp/log/sin/cos via SLEEF binding) | 3-4 | Contributor + Tenstorrent review | High |
| Functional | `has_packet_segment` for RVV (issue #3086) | 2-3 | Contributor | High |
| Functional | bf16 GEMM accumulation precision fix (issue #3158) | 1-2 | Contributor | High |
| Functional | GeneralBlockPanelKernel complex x real `loadRhsQuad` FIXME | 1-2 | Contributor | Medium |
| Performance | riscv64 benchmark CI jobs | 1 | CI contributor | High |
| Performance | GEMM threshold tuning and stride-2 pgather (issues #3119, #3169) | 1 each | Contributor | Medium |
| Performance | GEMM throughput profiling and optimization (per microarch) | 4-6 | Performance engineer | Medium |
| CI/CD | Remove `allow_failure: true` from riscv64 jobs; close fork-scheduling gap | 1-2 | CI contributor + SpacemiT | High |
| Functional | Ship RVV in a versioned release | 0 (depends on maintainer release cadence) | Maintainers | Critical - blocking all downstream consumption |

## 15. References

- [Eigen GitLab repository](https://gitlab.com/libeigen/eigen)
- [Eigen homepage](https://eigen.tuxfamily.org/)
- [Issue #2842: Support RISC-V and RISC-V Vector Extension (RVV) - closed 2026-09-27](https://gitlab.com/libeigen/eigen/-/issues/2842)
- [Issue #2930: Heap corruption when allocating vectors consecutively under RVV](https://gitlab.com/libeigen/eigen/-/issues/2930)
- [Issue #3086: has_packet_segment / masked partial-packet tails absent on RVV](https://gitlab.com/libeigen/eigen/-/issues/3086)
- [Issue #3116: min/max PropagateNaN signed-zero inconsistency on RVV/NEON/CUDA](https://gitlab.com/libeigen/eigen/-/issues/3116)
- [Issue #3119: Tune EIGEN_FIXED_SIZE_GEMM_TO_COEFFBASED_THRESHOLD across platforms](https://gitlab.com/libeigen/eigen/-/issues/3119)
- [Issue #3154: StructuredMatrices exact-equality test fails on RISC-V GCC 15 (closed)](https://gitlab.com/libeigen/eigen/-/issues/3154)
- [Issue #3158: GEMM half/bfloat16 products accumulate in operand type](https://gitlab.com/libeigen/eigen/-/issues/3158)
- [Issue #3169: Optimize stride-2 pgather on additional SIMD backends](https://gitlab.com/libeigen/eigen/-/issues/3169)
- [Issue #3183: pldexp could split 2^e into three factors instead of four](https://gitlab.com/libeigen/eigen/-/issues/3183)
- [MR !1687: RISC-V RVV1.0 support (closed, unmerged)](https://gitlab.com/libeigen/eigen/-/merge_requests/1687)
- [MR !2030: RVV1.0 support (merged 2025-11-20)](https://gitlab.com/libeigen/eigen/-/merge_requests/2030)
- [MR !2079: Fix bug introduced in !2030 (merged 2025-11-21)](https://gitlab.com/libeigen/eigen/-/merge_requests/2079)
- [MR !2944: Preserve explicit stack allocation limits on RVV (merged 2026-08-29)](https://gitlab.com/libeigen/eigen/-/merge_requests/2944)
- [MR !3187: Solve whole TRSM diagonal blocks with shared packet kernel (merged 2025-09-27, non-RVV-specific)](https://gitlab.com/libeigen/eigen/-/merge_requests/3187)
- [Eigen/src/Core/arch source tree](https://gitlab.com/libeigen/eigen/-/tree/master/Eigen/src/Core/arch)
- [Eigen/src/Core/arch/RVV10 source tree](https://gitlab.com/libeigen/eigen/-/tree/master/Eigen/src/Core/arch/RVV10)
- [ConfigureVectorization.h (raw)](https://gitlab.com/libeigen/eigen/-/raw/master/Eigen/src/Core/util/ConfigureVectorization.h)
- [.gitlab-ci.yml (raw)](https://gitlab.com/libeigen/eigen/-/raw/master/.gitlab-ci.yml)
- [ci/build.linux.gitlab-ci.yml (raw)](https://gitlab.com/libeigen/eigen/-/raw/master/ci/build.linux.gitlab-ci.yml)
- [ci/test.linux.gitlab-ci.yml (raw)](https://gitlab.com/libeigen/eigen/-/raw/master/ci/test.linux.gitlab-ci.yml)
- [ci/images.gitlab-ci.yml (raw)](https://gitlab.com/libeigen/eigen/-/raw/master/ci/images.gitlab-ci.yml)
- [ci/common.gitlab-ci.yml (raw)](https://gitlab.com/libeigen/eigen/-/raw/master/ci/common.gitlab-ci.yml)
- [Eigen official benchmark reports](https://libeigen.gitlab.io/benchmarks/)
- [GitLab tags list](https://gitlab.com/libeigen/eigen/-/tags)
- [Ubuntu 26.04 (resolute) libeigen3-dev package](https://packages.ubuntu.com/resolute/libeigen3-dev)
- [PyPI eigen package (unrelated project)](https://pypi.org/project/eigen/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project Working Group Elections: Results (Eigen mention)](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Puzikova, Sokolov, Zaytseva, "RISC-V Acceleration for Linear Algebra Problems: Eigen Library Enhancements with RVV Support," PaCT 2025 (paywalled, abstract-level data only)](https://link.springer.com/chapter/10.1007/978-3-032-06751-7_13)