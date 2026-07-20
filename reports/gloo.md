---
title: Gloo
categories:
  - ai-ml
---

# Gloo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Gloo (facebookincubator/gloo)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Gloo is a C++ collective communications library developed by Meta/Facebook. It provides primitives for distributed machine learning workloads: allreduce, allgather, broadcast, scatter, and reduce across a cluster of nodes. The library is a core dependency of PyTorch Distributed (`torch.distributed` with the `gloo` backend), making it the default CPU collective communications backend for PyTorch training jobs that do not use NCCL (i.e., all CPU-only and some heterogeneous configurations).

**Governance:** No formal governance document exists. There is no MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md, or SUPPORT.md file in the repository. The project is hosted under the `facebookincubator` GitHub organization. Issue creation is restricted.

**Maintenance mode:** As of June 17 2026, the repository README was updated by Tristan Rice (d4l3k) with a maintenance-only note. New use cases require maintainer discussion before proceeding.

**Primary maintainer:** Tristan Rice (GitHub: d4l3k), Meta employee working on PyTorch Distributed, torchft, and torchcomms. He accounts for the majority of recent commits.

**Other recent contributors:**
- jackbondpreston-arm: ARM64 CI work (Arm Ltd, indicated by the "-arm" GitHub suffix)
- nlbrown2: ARM64 CI runner addition
- GZGavinZhao: ROCm/HIP support (possibly AMD)
- r-barnes: C++20 migration (academic or independent)

**License:** BSD.

**Corporate control:** Effectively Meta/Facebook via the `pytorch` and `facebookincubator` GitHub organizations.

**RISE Project membership:** None. Gloo is not listed among RISE Premier or General members (Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Damo Academy, Tenstorrent, Akeana, BOSC, ByteDance, Canonical, ESWIN, ISCAS, Microchip Technology Germany, SpacemiT, ZTE). No RISE blog post (28 posts, May 2024 through June 2026) mentions Gloo.

**Community stance on new ports:** The project is in maintenance-only mode with restricted issue creation. The only recent non-x86 architecture addition (ARM64 CI) was contributed by an Arm-affiliated contributor. This pattern indicates that new architecture support requires a corporate sponsor to contribute and maintain it. No public discussion of RISC-V support has occurred in issues, PRs, or commits.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (before 2023) | x86-64 Linux, macOS, Windows support established | Repository history |
| Aug 2023 | libuv dependency gains riscv64 syscall number fix (upstream libuv PR #4127) | libuv upstream |
| Feb 2024 | libuv gains cpu_relax() for riscv64 (upstream libuv PR #5019) | libuv upstream |
| Feb 6 2026 | ARM64 CI runner added (PR #487, contributors: nlbrown2, d4l3k, jackbondpreston-arm) | [facebookincubator/gloo PR #487](https://github.com/facebookincubator/gloo/pull/487) |
| Feb 12 2026 | ROCm/HIP support added | Repository history |
| ~Feb 2026 | x86-only allreduce_shm feature reverted (PR #490) after ARM64 compilation failure (issue #486, `immintrin.h` x86-only header) | [facebookincubator/gloo PR #490](https://github.com/facebookincubator/gloo/pull/490) |
| Jun 17 2026 | README updated: project enters maintenance-only mode | [facebookincubator/gloo](https://github.com/facebookincubator/gloo) |
| (no date) | riscv64 RISC-V: zero upstream activity | Search confirmed 0 results across issues, PRs, commits |

**RISC-V port history:** None. No first RISC-V commit exists. There has been no port attempt in the upstream repository. The riscv64 architecture has never appeared in any issue, PR, commit, or CI configuration.

**Key contributors:** No RISC-V contributors exist for this project.

---

## 3. Upstream Support Tier

**Formal tier policy:** No formal tier document exists (no PLATFORMS.md, no tier classification in any build or governance file).

**Inferred tier evidence:**

| Architecture | CI runner | Release binaries | SIMD optimization | Tier (inferred) |
|---|---|---|---|---|
| amd64 (x86-64) | ubuntu-latest, CUDA builds, ROCm builds, Windows | N/A (no upstream release binaries) | AVX float16 path | Tier 1 (primary) |
| arm64 (AArch64) | ubuntu-24.04-arm (native GitHub runner) | N/A | Scalar fallback only | Tier 2 (tested) |
| riscv64 | None | N/A | Scalar fallback only | Not a recognized tier |

riscv64 is not a recognized support tier by upstream. It is not mentioned in any upstream document.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Gloo is a collective communications library. Its hot paths are network I/O, synchronization primitives, and collective algorithm logic (ring allreduce, etc.), not CPU compute. The only CPU-level SIMD optimization is float16 arithmetic for the reduction step of float16 tensors.

**Architecture-specific component inventory:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| float16 reduction (sum/product/max/min) | AVX intrinsics (8-wide vectorized, `_mm256_cvtph_ps`, `_mm256_add_ps`, etc.) in `gloo/math.cc` under `#if GLOO_USE_AVX` | Scalar C fallback (no NEON/SVE/fp16 path) | Scalar C fallback (no RVV path) |
| int8, fp32, fp64 reductions | Scalar C on all platforms | Scalar C | Scalar C |
| TCP transport (primary) | epoll(2), Linux-only, architecture-agnostic | Same | Same -- epoll works on riscv64 Linux |
| InfiniBand (ibverbs) transport | Architecture-agnostic API | Architecture-agnostic | Architecture-agnostic (but libibverbs MMIO primitives incomplete on riscv64 -- see Section 9) |
| libuv transport | Architecture-agnostic | Architecture-agnostic | Architecture-agnostic |
| Collective algorithms (allreduce, allgather, etc.) | Architecture-agnostic C++ | Same | Same |
| 64-bit pointer requirement | Satisfied | Satisfied | Satisfied (RV64) |
| JIT compiler | None | None | None |
| Crypto | None natively (OpenSSL via USE_TCP_OPENSSL_LINK/LOAD) | Same | Same |
| GC barriers | N/A (not a managed runtime) | N/A | N/A |

**CMake feature flag:** `GLOO_USE_AVX` is the only architecture-specific compile-time flag. No `GLOO_USE_RVV`, no `GLOO_USE_NEON`, no `GLOO_USE_SVE` exists. The AVX path is x86-only and gated by `USE_AVX` from the build system.

**Conclusion:** Gloo has essentially no architecture-specific code beyond one AVX float16 SIMD path. The library will build and run on riscv64 using scalar fallback paths throughout. This matches the ARM64 situation. Since CPU math is not the bottleneck for collective communications (network I/O dominates), the absence of RVV optimization is a minor performance gap, not a correctness or functionality gap.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake >= 3.21, C++20 standard (`set(CMAKE_CXX_STANDARD 20)`).

**C++ compiler minimum:** Not stated explicitly. C++20 implies GCC >= 10 or Clang >= 12 as practical minimums; GCC 12+ is recommended for complete C++20 support.

**Architecture gate (riscv64 passes):**
```cmake
if(NOT CMAKE_SIZEOF_VOID_P EQUAL 8)
  message(FATAL_ERROR "Gloo can only be built on 64-bit systems.")
endif()
```
RV64GC satisfies this check. RV32 does not and cannot build Gloo.

**Available CMake flags relevant to riscv64:**

| Flag | Default | Notes for riscv64 |
|---|---|---|
| `USE_REDIS` | OFF | requires hiredis; works on riscv64 |
| `USE_IBVERBS` | OFF | libibverbs MMIO primitives incomplete on riscv64 |
| `USE_NCCL` | OFF | CUDA-only; N/A on riscv64 |
| `USE_RCCL` | OFF | ROCm-only; N/A on riscv64 |
| `USE_LIBUV` | OFF | requires libuv >= 1.26; builds on riscv64 |
| `USE_TCP_OPENSSL_LINK` | OFF | requires OpenSSL 1.1.x; Linux-only; builds on riscv64 |
| `USE_TCP_OPENSSL_LOAD` | OFF | mutually exclusive with LINK |
| `USE_CUDA` | OFF | N/A on riscv64 |
| `USE_ROCM` | OFF | N/A on riscv64 |
| `BUILD_TEST` | OFF | requires GoogleTest |
| `BUILD_BENCHMARK` | OFF | requires hiredis |

**Recommended build command for riscv64 native build:**
```bash
mkdir -p build && cd build
cmake ../ \
  -DCMAKE_VERBOSE_MAKEFILE=ON \
  -DBUILD_TEST=ON \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DUSE_REDIS=OFF \
  -DUSE_IBVERBS=OFF \
  -DUSE_NCCL=OFF \
  -DUSE_RCCL=OFF \
  -DUSE_CUDA=OFF \
  -DUSE_ROCM=OFF
make
```

**Cross-compilation:** No upstream toolchain file for riscv64 exists. The `cmake/` directory contains: `Modules/` (four Find*.cmake files), `Cuda.cmake`, `Dependencies.cmake`, `GlooConfig.cmake.in`, `GlooConfigVersion.cmake.in`, `Hip.cmake`, `Hipify.cmake`. A toolchain file must be supplied externally:
```bash
cmake ../ \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/your/riscv64-toolchain.cmake \
  -DCMAKE_VERBOSE_MAKEFILE=ON \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DUSE_REDIS=OFF -DUSE_IBVERBS=OFF -DUSE_NCCL=OFF \
  -DUSE_RCCL=OFF -DUSE_CUDA=OFF -DUSE_ROCM=OFF
```

**QEMU usage:** Zero. No QEMU usage anywhere in the CI or build system.

**Dockerfiles:** None exist in the repository for any architecture.

**Known build failures on riscv64:** None reported upstream. The allreduce_shm feature (which introduced x86-only `immintrin.h` via PR #458) was fully reverted in PR #490, so the current tree does not contain that portability hazard. Debian sid and Ubuntu 24.04 both package `libgloo0` for riscv64 successfully, confirming the library builds without patches on riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TCP collective transport (allreduce, allgather, broadcast, scatter, reduce) | Full | Full | Full (epoll works on Linux riscv64) |
| InfiniBand (ibverbs) transport | Full | Full | Partial -- libibverbs MMIO incomplete |
| libuv async transport | Full | Full | Full |
| TLS (TCP-OpenSSL) | Full | Full | Full (but see OpenSSL test flakiness in Section 9) |
| Redis rendezvous backend | Full | Full | Full |
| float16 reductions (sum/product/max/min) | AVX-accelerated | Scalar | Scalar |
| int8, fp32, fp64 reductions | Scalar | Scalar | Scalar |
| bfloat16 reductions | Not implemented (issue #454) | Not implemented | Not implemented |
| CUDA collective transport | Full (NCCL) | N/A | N/A |
| ROCm collective transport | Full (RCCL) | N/A | N/A |

**Functional gaps on riscv64:**
- InfiniBand (USE_IBVERBS=ON): libibverbs MMIO helpers are incomplete on riscv64 (upstream PR #1639 abandoned March 2026). Enabling this will produce an unreliable or non-functional InfiniBand transport. Mitigation: disable USE_IBVERBS (default is OFF).
- MPI transport (USE_MPI=ON): Open MPI has an open crash issue (#13762) and incomplete LL/SC atomics (PR #13789) on riscv64 hardware. MPI transport is unreliable on riscv64. Mitigation: disable MPI (not enabled by default in Gloo).

**Performance gaps on riscv64 vs amd64:**
- float16 reductions: scalar on riscv64 vs 8-wide AVX on amd64. Magnitude of impact: minor in practice because network I/O dominates collective operation latency. Exact throughput delta: data not available (no benchmarks run on riscv64).
- All other reduction types (int8, fp32, fp64): scalar on amd64 as well. No gap.

**Security hardening gaps:** Data not available -- no upstream analysis of security hardening flags (stack canaries, CFI, shadow stack) specific to riscv64 was found in the research.

**NaN/floating-point semantics:** The float16 conversion code (`cpu_float2half_rn`, `cpu_half2float`) in `types.h` uses software-only bit manipulation with explicit NaN, Inf, and denormal handling. This code is portable to riscv64 with no correctness risk. No riscv64-specific NaN issues were found.

---

## 7. CI/CD Infrastructure

**Summary:** No riscv64 CI exists, either upstream or via RISE.

**Upstream CI -- all five workflow files confirmed:**

| Workflow file | Runner(s) | riscv64 present | QEMU present |
|---|---|---|---|
| build-linux.yml | ubuntu-latest (x86-64) x3, ubuntu-24.04-arm (ARM64) x1 | No | No |
| build-cuda.yml | ubuntu-22.04 (x86-64), CUDA 11.8 and 12.4 | No | No |
| build-rocm.yml | ubuntu-22.04 (x86-64), ROCm 6.0 and 6.2 | No | No |
| build-windows.yml | windows-latest (x86-64) | No | No |
| super-linter.yml | ubuntu-latest (x86-64) | No | No |

The string "riscv" does not appear in any workflow file.

**Comparison table:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux build | Yes (ubuntu-latest) | Yes (ubuntu-24.04-arm, native runner, added PR #487 Feb 6 2026) | No |
| CUDA build | Yes | No | No |
| ROCm build | Yes | No | No |
| Windows build | Yes | No | No |
| Test execution | Yes (BUILD_TEST=ON implied) | Yes | No |
| RISE runner | N/A | N/A | No |
| Hardware runner | Hosted GitHub runner | Hosted GitHub runner (native ARM64) | None |
| QEMU emulation | No | No | No |

**No CI/CD infrastructure for riscv64 exists anywhere** -- not in the upstream repository, not via RISE, not via any third-party mirror. The only riscv64 build evidence is from Debian and Ubuntu packaging infrastructure.

---

## 8. Distribution and Release Status

**Upstream release binaries:** None. The GitHub releases endpoint returns an empty array. The project has never published GitHub release assets of any kind.

**PyPI:** Four source distributions only: Gloo-0.0.1.tar.gz, Gloo-0.1.0.tar.gz, Gloo-0.1.1.tar.gz, Gloo-0.1.2.tar.gz (latest). Zero wheel files for any platform. Users must build from source on all platforms.

**RISE wheel builder:** The RISE PyPI index (gitlab.com RISE package registry) redirects to pypi.org for Gloo and does not include any RISE-built riscv64 wheels. The RISE wheel builder (84 packages listed) does not include Gloo.

**Ubuntu 24.04 (noble):**
- `libgloo0` version 0.0~git20230519.597accf-2build3: available for amd64, arm64, ppc64el, riscv64, s390x
- `libgloo-dev` same version, same architectures including riscv64
- `libgloo-cuda-0` and `libgloo-cuda-dev`: amd64 and ppc64el only

riscv64 binary packages are available. These are built by Ubuntu's distro packaging infrastructure, not by upstream.

**Debian sid:**
- Current version: 0.0~git20250912.d97133a-2
- riscv64 build status: Installed (successful), built on rv-osuosl-02
- All 64-bit architectures (amd64, arm64, alpha, loong64, ppc64, ppc64el, riscv64, s390x, sparc64) show "Installed"
- 32-bit arches are BD-Uninstallable (due to the `architecture-is-64-bit` build dependency, correctly excluding them)
- A newer upstream snapshot (0.0~git20260617.15d8235) is flagged for packaging

**Fedora:** Data not available -- Fedora riscv64 package status was not searched.

**Arch Linux RISC-V (archriscv.felixc.at):** Not packaged. Search returned no result.

**What a user must do to get a working riscv64 binary:**
1. Install from Ubuntu 24.04 or Debian sid via `apt install libgloo0 libgloo-dev` (preferred, no build required)
2. Or build from source using the cmake commands in Section 5 with all GPU and InfiniBand options disabled

---

## 9. Dependencies

**Summary table:**

| Dependency | Role in Gloo | riscv64 build | riscv64 test | riscv64 release | Blocking |
|---|---|---|---|---|---|
| libuv (>= 1.26) | TCP transport event loop (USE_LIBUV) | Builds; cpu_relax() fix merged Feb 2026 (PR #5019); missing syscall fix merged Aug 2023 (PR #4127) | No riscv64 CI runner upstream | Debian sid: 1.44.2 (unofficial port); ArchPOWER riscv64: 1.50.0 (behind 1.52.1 current) | No |
| OpenSSL (1.1.x pinned in CI) | TCP-TLS transport (USE_TCP_OPENSSL_LINK/LOAD) | Builds; active riscv64 asm optimizations PRs open May-Jun 2026 | Flaky: test_lhash/test_hashtable_multithread fails with malloc unaligned fastbin on riscv64 (issue #30880, open Apr 2026, labeled "help wanted", affects 3.x) | Debian sid: 3.6.3-1 for riscv64 | Soft -- test flakiness only; Gloo pins EOL OpenSSL 1.1, not affected by 3.x test bug |
| hiredis | Redis rendezvous backend (USE_REDIS) | Builds | No riscv64 CI | Debian sid: 1.2.0-6+b4; ArchPOWER: 1.2.0 (behind 1.4.0) | No |
| libibverbs / rdma-core | InfiniBand RDMA transport (USE_IBVERBS) | Partial -- Debian riscv64 DMA coherency fix merged 2022 (PR #1169); MMIO helpers PR #1639 abandoned Mar 2026 | No riscv64 CI; MMIO primitives absent | Debian sid: libibverbs-dev 63.0-1 for riscv64 | YES -- USE_IBVERBS=ON is unreliable on riscv64 |
| Open MPI | MPI collective transport (USE_MPI) | Partial -- riscv64 timer merged Jul 2025 (PR #13324); full LL/SC atomics PR #13789 open Mar 2026 with UB | opal_lifo hangs/crashes on riscv64 hardware (P550), issue #13762 open Mar 2026 | Debian sid: libopenmpi-dev 5.0.7-1 for riscv64 | YES -- MPI transport is unreliable on riscv64 hardware |
| NCCL | GPU collectives for CUDA (USE_NCCL) | No riscv64 support; single open PR #1183 wc_store_fence for RISC-V (Feb 2024, unmerged) | No | Not packaged for riscv64 | N/A -- CUDA does not target riscv64 |
| RCCL | GPU collectives for ROCm (USE_RCCL) | No riscv64 support; ROCm does not target riscv64 | No | Not packaged for riscv64 | N/A -- ROCm does not target riscv64 |
| GoogleTest | Unit tests (BUILD_TEST) | Builds | Open issue #3756: GetThreadCountTest.ReturnsCorrectValue fails on riscv64 (Feb 2022, still open) | Packaged in major distributions for riscv64 | No -- test-only |

**Deep dives on critical dependencies:**

**libibverbs / rdma-core (if InfiniBand is required):** Debian merged DMA coherency support for riscv64 in PR #1169 (2022). SUSE contributed a riscv64 build fix that was later reverted (PR #1158). The MMIO helpers PR (#1639), needed for low-level RDMA primitives on riscv64, was abandoned in March 2026. Without merged MMIO helpers, USE_IBVERBS=ON on riscv64 will produce incomplete or unreliable RDMA transport. This dependency is off by default in Gloo and can be disabled for CPU-only or TCP-only deployments.

**Open MPI (if MPI transport is required):** The riscv64 timer fix merged July 2025 (PR #13324). The full LL/SC atomic support (PR #13789, opened March 2026) is still open and contains undefined behavior in atomic subtraction. A confirmed crash of `opal_lifo` on riscv64 hardware (Milk-V Pioneer P550) is tracked in issue #13762 (opened March 2026, open as of research date). This dependency is not enabled by default in Gloo and can be disabled.

**OpenSSL (pinned to 1.1 in CI):** Gloo's CI installs OpenSSL 1.1.1b from source. OpenSSL 1.1 is upstream EOL. The riscv64 test flakiness (issue #30880) affects OpenSSL 3.x only and does not affect the pinned 1.1 build. However, distributors (Debian, Ubuntu) ship OpenSSL 3.x, creating a mismatch between what the CI validates and what production environments use. [NEEDS VERIFICATION -- whether the Debian libgloo packages link against system OpenSSL 3.x or disable TLS entirely.]

---

## 11. Known Bugs and Active Issues

**Issues with riscv64 relevance (none are riscv64-specific -- zero riscv64 issues exist in facebookincubator/gloo):**

| ID | Title | Status | Severity | riscv64 relevance |
|---|---|---|---|---|
| #486 | BUG: SHM support does not compile on Arm64 | Open | Medium | The root cause was x86-only `<immintrin.h>` inclusion in allreduce_shm.cc (PR #458). The feature was fully reverted (PR #490). The same failure would have occurred on riscv64 if the feature had not been reverted. Not present in current tree. |
| #471 | TCP Backend All Gather lower bandwidth for WORLD_SIZE=2 | Open | Medium | Architecture-independent algorithmic issue in ring communication pattern at 2-node topology. Affects riscv64 equally. Tested on Jetson Nano cluster and 8-node HPC cluster; divergence begins around 8-16 MB total transfer size. No MB/s figures in issue text. |
| #454 | Bfloat16 datatype not supported in gloo | Open | Low | Affects all platforms. No bfloat16 reduction support anywhere in the codebase. |
| #464 | NCCL vs Gloo performance comparison | Open | Informational | No actual benchmark data in issue, just a question. N/A on riscv64. |

**Correctness bugs:** None with confirmed riscv64 impact in facebookincubator/gloo itself. The relevant correctness risk is in Open MPI's `opal_lifo` (crash on riscv64 hardware, MPI issue #13762) and OpenSSL's `test_lhash` alignment bug (flaky test, OpenSSL issue #30880) -- both in dependencies, not in Gloo itself.

---

## 12. Objections and Upstream Blockers

**Project posture:** Maintenance-only mode. Issue creation restricted. New features require maintainer discussion. This is a high barrier for a riscv64 CI or optimization contribution.

**Stated objections:** None on record (no public discussion of RISC-V support exists).

**Technical blockers:**
- No riscv64 CI runner: no mechanism to validate riscv64 builds or catch regressions. This is the first requirement for any architecture support.
- No riscv64 toolchain file for cross-compilation: must be supplied externally.
- InfiniBand transport unreliable on riscv64 (libibverbs MMIO gap).
- MPI transport unreliable on riscv64 (Open MPI opal_lifo crash).
- These last two are dependency blockers, not Gloo-specific.

**Organizational blockers:**
- The project is in maintenance-only mode, reducing the likelihood that Meta maintainers will review or merge riscv64 patches unless a business case exists.
- The ARM64 CI addition precedent (PR #487) required an Arm-affiliated contributor to do the work. A RISC-V CI addition would require similar engagement from a RISC-V hardware or silicon vendor.
- There is no RISE relationship to leverage for fast-track review.

**Acceptance probability for a riscv64 CI PR:** Moderate, if the PR is purely additive (CI only, no code changes) and does not require maintainer effort beyond review. The ARM64 precedent supports this. The maintenance-only mode is a risk.

**Acceptance probability for RVV float16 optimization:** Low to moderate. The maintenance-only posture and the fact that ARM64 has no NEON optimization despite having CI suggests the maintainers are not prioritizing SIMD work beyond x86.

---

## 13. Investment Analysis

RISE has no involvement in Gloo. All potential work items require new effort.

### 13.1 Functional Enablement

The library is already functionally complete on riscv64 for TCP transport via the scalar fallback path (confirmed by Debian/Ubuntu packaging). No code changes are required for basic functionality. The gaps are InfiniBand (dependency issue in rdma-core, not in Gloo) and MPI (dependency issue in Open MPI, not in Gloo).

Fixing the InfiniBand gap requires completing rdma-core PR #1639 (MMIO helpers, abandoned March 2026) or a replacement PR. This is work in the rdma-core repository, not in Gloo.

Fixing the MPI gap requires resolving Open MPI issue #13762 (opal_lifo crash) and completing PR #13789 (LL/SC atomics). This is work in the Open MPI repository, not in Gloo.

### 13.2 Performance Optimization

The only missing SIMD optimization is RVV float16 reduction kernels, paralleling the existing AVX path in `gloo/math.cc`. The scope is small (~50 lines of intrinsic code for sum, product, max, min). Network I/O dominates collective operation latency, so the performance impact of adding RVV float16 is likely small in wall-clock terms for typical distributed training workloads. Precise impact: data not available.

### 13.3 CI/CD Infrastructure

Adding a riscv64 CI runner to `build-linux.yml` is a single matrix entry addition (1-2 lines of YAML) plus a GitHub-hosted or self-hosted riscv64 runner. The ARM64 precedent (ubuntu-24.04-arm runner, PR #487) provides the exact template. If GitHub Actions provides a hosted riscv64 runner, the change is trivial. If a self-hosted runner must be registered, the infrastructure effort dominates.

### 13.4 Ecosystem Enablement

The PyPI package contains only source distributions. Building and publishing riscv64 wheel files would require adding cibuildwheel or equivalent to the release pipeline with a riscv64 runner. Given the current maintenance-only posture, this is low priority. The Debian and Ubuntu packages already serve binary distribution for riscv64.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 runner to build-linux.yml | 0.5 | Contributor (RISC-V vendor) | High |
| Functional | Fix rdma-core MMIO helpers for riscv64 (libibverbs) | 3-5 | rdma-core contributor | Medium |
| Functional | Resolve Open MPI opal_lifo crash on riscv64 (issue #13762) | 4-8 | Open MPI contributor | Medium |
| Performance | RVV float16 reduction kernels in gloo/math.cc | 1-2 | Contributor (RISC-V vendor) | Low |
| Distribution | Add riscv64 wheels to PyPI release pipeline | 1 | Contributor (RISC-V vendor) | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [facebookincubator/gloo repository](https://github.com/facebookincubator/gloo)
- [facebookincubator/gloo CMakeLists.txt](https://github.com/facebookincubator/gloo/blob/main/CMakeLists.txt)
- [facebookincubator/gloo gloo/math.cc](https://github.com/facebookincubator/gloo/blob/main/gloo/math.cc)
- [facebookincubator/gloo gloo/math.h](https://github.com/facebookincubator/gloo/blob/main/gloo/math.h)
- [facebookincubator/gloo .github/workflows/build-linux.yml](https://github.com/facebookincubator/gloo/blob/main/.github/workflows/build-linux.yml)
- [facebookincubator/gloo PR #487 -- add arm64 runner](https://github.com/facebookincubator/gloo/pull/487)
- [facebookincubator/gloo PR #490 -- revert allreduce_shm](https://github.com/facebookincubator/gloo/pull/490)
- [facebookincubator/gloo issue #486 -- SHM does not compile on Arm64](https://github.com/facebookincubator/gloo/issues/486)
- [facebookincubator/gloo issue #471 -- All Gather lower bandwidth for WORLD_SIZE=2](https://github.com/facebookincubator/gloo/issues/471)
- [facebookincubator/gloo issue #454 -- Bfloat16 not supported](https://github.com/facebookincubator/gloo/issues/454)
- [Ubuntu 24.04 libgloo0 package](https://packages.ubuntu.com/noble/libgloo0)
- [Ubuntu 24.04 libgloo-dev package](https://packages.ubuntu.com/noble/libgloo-dev)
- [Debian tracker -- gloo](https://tracker.debian.org/pkg/gloo)
- [Debian buildd -- gloo riscv64 status](https://buildd.debian.org/status/package.php?p=gloo&suite=sid)
- [Arch Linux RISC-V package search -- gloo](https://archriscv.felixc.at/?q=gloo)
- [PyPI -- Gloo](https://pypi.org/project/Gloo/)
- [libuv PR #5019 -- cpu_relax for riscv64](https://github.com/libuv/libuv/pull/5019)
- [libuv PR #4127 -- missing syscall numbers for riscv64](https://github.com/libuv/libuv/pull/4127)
- [rdma-core PR #1639 -- MMIO helpers for riscv64 (abandoned)](https://github.com/linux-rdma/rdma-core/pull/1639)
- [rdma-core PR #1169 -- riscv64 DMA coherency](https://github.com/linux-rdma/rdma-core/pull/1169)
- [Open MPI issue #13762 -- opal_lifo crash on riscv64 hardware](https://github.com/open-mpi/ompi/issues/13762)
- [Open MPI PR #13789 -- LL/SC atomics for riscv64](https://github.com/open-mpi/ompi/pull/13789)
- [Open MPI PR #13324 -- riscv64 timer](https://github.com/open-mpi/ompi/pull/13324)
- [OpenSSL issue #30880 -- test_lhash alignment bug on riscv64](https://github.com/openssl/openssl/issues/30880)
- [GoogleTest issue #3756 -- GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [NCCL PR #1183 -- wc_store_fence for RISC-V](https://github.com/NVIDIA/nccl/pull/1183)
- [RISE Project -- member list](https://riseproject.dev)