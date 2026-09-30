---
title: Gloo
parent: Project Reports
color: yellow
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: libuv
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: hiredis
    relation: runtime-dependency
    criticality: optional
  - name: rdma-core
    relation: runtime-dependency
    criticality: optional
  - name: Open MPI
    relation: runtime-dependency
    criticality: optional
  - name: CUDA
    relation: runtime-dependency
    criticality: optional
  - name: NCCL
    relation: runtime-dependency
    criticality: optional
  - name: ROCm
    relation: runtime-dependency
    criticality: optional
  - name: RCCL
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="gloo" %}

# Gloo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Gloo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Gloo is a C++ collective communications library originally developed by Meta/Facebook. It provides primitives for distributed machine learning workloads: allreduce, allgather, broadcast, scatter, and reduce across a cluster of nodes, over TCP, InfiniBand (ibverbs), or MPI transports. The library is a core dependency of PyTorch Distributed (`torch.distributed` with the `gloo` backend), making it the default CPU collective-communications backend for PyTorch training jobs that do not use NCCL.

**Repository identity:** the project has moved GitHub organizations. `facebookincubator/gloo` now transparently redirects (for `git clone`) to [github.com/pytorch/gloo](https://github.com/pytorch/gloo); both URLs resolve to the identical HEAD commit `0abb85818e9fa0ba5e3d5a2d6ad8d3df23b1a1e1`, confirming it is a single project now hosted under the PyTorch Foundation's `pytorch` GitHub org, with old README badges and external links still pointing at the former `facebookincubator/gloo` address.

**Governance:** No formal governance document exists anywhere in the repository history: no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE`, `CHARTER`, `PLATFORMS.md`, or `SUPPORT.md` file. `CONTRIBUTING.md` only instructs contributors to sign a Facebook CLA and says nothing about maintainer identity or decision process. Copyright holder is Facebook, Inc. (per `LICENSE`). License is BSD (permissive, non-copyleft).

**Maintenance mode:** the README states Gloo is "considered to be feature complete and in maintenance-only mode. For new usecases or non-bugfix changes please reach out to the maintainers to discuss." This language was introduced by Tristan Rice (GitHub: d4l3k, a Meta employee working on PyTorch Distributed, torchft, and torchcomms) around June 2026.

**Top contributors (all-time, by `git shortlog -sne --all` over 684 commits, 2017-02-09 through 2026-09-28):** overwhelmingly Meta/Facebook staff -- Pieter Noordhuis (original author, 302 combined commits, `pietern@fb.com`), Richard Barnes (45, `rbarnes@meta.com`), Tristan Rice (42, `rice@fn.lc` / `tristanr@meta.com`), Andrew Dye (28), Chirag Pandya (20+), Lukasz Wesolowski (19), Sofia Fong (17), plus Omkar Salpekar, Nikita Shulga, Shawn Xu, Xiaodong Wang, Ziqi Huang, Ke Wen, Kirtesh Patil, and PyTorch co-founder Soumith Chintala -- all with `fb.com`/`meta.com` addresses. The only non-Meta name in the top tier is Simon Layton (historically NVIDIA-affiliated, 5 commits). Recent non-Meta contributors are architecture-scoped: Nathan Brown (arm64 CI runner, Feb 2026) and a contributor with an "-arm" GitHub handle suffix (ARM-affiliated) who worked on the same effort.

**License:** BSD.

**Corporate control:** Effectively Meta via the `pytorch` GitHub org (PyTorch Foundation, under the Linux Foundation), but with no visible transfer of actual maintainer control -- committers remain almost entirely Meta employees.

**RISE Project membership:** None. Gloo, PyTorch, and Meta/Facebook are not listed on [riseproject.dev's member page](https://riseproject.dev) among either Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or General Members (Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). None of the 35 RISE blog posts published May 2024 through September 2026 (verified against the full WordPress sitemap) mentions Gloo; the two most likely candidates, ["PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) and ["Python now officially supports RISC-V"](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/), were read in full and neither mentions Gloo, `USE_GLOO`, or a distributed backend at all.

**Community stance on new ports:** the project is in maintenance-only mode with restricted issue creation and no documented tiering or porting process. The only recent non-x86 architecture addition (ARM64 CI, PR #487) was contributed by Arm-affiliated engineers, indicating that new architecture support in practice requires an external corporate sponsor to do and maintain the work. No public discussion of RISC-V support has occurred in any issue, PR, or commit across the project's full history.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-02-09 | Initial commit ("Import gloo") | Repository history |
| (before 2023) | x86-64 Linux, macOS, Windows support established | Repository history |
| 2021 through 2026 | Debian/Ubuntu build riscv64 `.deb` binaries for Gloo repeatedly, across at least 4 snapshot rebuilds (2021, 2024 x2, 2025-09, 2026-02) | [ports.ubuntu.com gloo pool](https://ports.ubuntu.com/pool/universe/g/gloo/) |
| Aug 2023 | libuv dependency gains riscv64 syscall-number fix (PR #4127) | [libuv/libuv#4127](https://github.com/libuv/libuv/pull/4127) |
| Feb 2024 | libuv gains `cpu_relax()` for riscv64 (PR #5019) | [libuv/libuv#5019](https://github.com/libuv/libuv/pull/5019) |
| 2026-02-04 | Issue #486 filed: SHM support (`allreduce_shm.cc`) fails to compile on Arm64 because PR #458 introduced x86-only `<immintrin.h>` | [pytorch/gloo#486](https://github.com/pytorch/gloo/issues/486) |
| Feb 2026 (merged 02-05/02-06, both dates appear across sources) [NEEDS VERIFICATION exact date] | ARM64 CI runner added (PR #487, Arm-affiliated contributors) | [facebookincubator/gloo PR #487](https://github.com/facebookincubator/gloo/pull/487) |
| Feb 2026 | Offending allreduce_shm feature reverted (PR #490) | [facebookincubator/gloo PR #490](https://github.com/facebookincubator/gloo/pull/490) |
| 2026-02-12 | ROCm/HIP support added | Repository history |
| 2026-06-17 | README updated: project enters maintenance-only mode | [pytorch/gloo](https://github.com/pytorch/gloo) |
| (ongoing) | riscv64: zero upstream activity | Confirmed by repeated, independently-run searches (GitHub search UI, GitHub `search_code`, `git log --all -i --grep="riscv"` over all 684 commits, full-tree grep) all returning 0 results |

**RISC-V port history:** none. No first RISC-V commit, no tracking issue, no WIP PR exists anywhere in the project's history. The riscv64 architecture has never appeared in any issue, PR, commit, or CI configuration in `facebookincubator/gloo`/`pytorch/gloo`. The only riscv64-adjacent GitHub activity findable anywhere near this topic lives in the separate, much larger `pytorch/pytorch` repository (e.g. `pytorch/pytorch#116012` "Issue with Protoc while building PyTorch for RISC-V", `pytorch/pytorch#166057` "[RISC-V][RVV][GCC 14.2] GCC ICE when building DepthwiseConvKernel.cpp") -- these concern PyTorch's own top-level RISC-V build tooling, not Gloo, and neither references a Gloo-side tracking issue.

**Key contributors:** no RISC-V contributors exist for this project.

## 3. Upstream Support Tier

**Formal tier policy:** none exists. There is no `PLATFORMS.md`, no tier classification in any build or governance file -- nothing analogous to Rust's or LLVM's tiered platform documentation.

**Inferred tier evidence:**

| Architecture | CI runner | Release binaries | SIMD optimization | Tier (inferred) |
|---|---|---|---|---|
| amd64 (x86-64) | `ubuntu-latest`, CUDA builds, ROCm builds, Windows | None (no upstream release binaries of any kind) | AVX float16 path (dormant by default, see Section 4) | Tier 1 (primary) |
| arm64 (AArch64) | `ubuntu-24.04-arm` (native GitHub runner, since PR #487) | None | Scalar fallback only | Tier 2 (tested) |
| riscv64 | None | None | Scalar fallback only (untested) | Not a recognized tier |

riscv64 is not a recognized support tier by upstream and is not mentioned in any upstream document.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Gloo is a collective-communications library. Its hot paths are network I/O, synchronization primitives, and collective algorithm logic (ring allreduce, etc.), not CPU compute. Independent verification (fresh clone at HEAD `0abb858`, exhaustive grep across all 219 `.cc`/`.h` files for architecture guards/intrinsics headers: `__x86_64__`, `__aarch64__`, `__arm__`, `__ARM_NEON`, `__AVX`, `__SSE`, `__riscv`, `immintrin.h`, `arm_neon.h`, `cpuid`, `x86intrin`) found exactly one hit: `gloo/math.cc` includes `<immintrin.h>`.

**`gloo/math.cc` (101 lines):** 4 AVX256 float16 (half-precision) fast-path specializations for `sum`/`product`/`max`/`min`, entirely wrapped in `#if GLOO_USE_AVX ... #endif`. This is the only architecture-specific code in the entire library. `GLOO_USE_AVX` is set from `USE_AVX` at `gloo/CMakeLists.txt:137`, but **`USE_AVX` is never declared via `option()` anywhere in the repo** (unlike `USE_REDIS`, `USE_IBVERBS`, `USE_CUDA`, etc., which all have explicit `option(... OFF)` declarations) -- it is an undeclared pass-through variable meant to be set by a parent build (e.g. PyTorch's own CMake) and is off by default. There is zero mention of "avx" or `CMAKE_SYSTEM_PROCESSOR` anywhere in Gloo's own CI workflows or docs, so even on `ubuntu-latest` x86_64, Gloo's own CI never enables this path -- the default amd64 build silently falls back to the same scalar code as arm64.

**Architecture-specific component inventory:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| float16 reduction (sum/product/max/min) | AVX intrinsics (8-wide, `_mm256_cvtph_ps`, `_mm256_add_ps`), gated behind an opt-in flag never set by default | Scalar C fallback (no NEON/SVE/fp16 path) | Scalar C fallback (no RVV path) |
| int8, fp32, fp64 reductions | Scalar C on all platforms | Scalar C | Scalar C |
| TCP transport (primary) | `epoll(2)`, architecture-agnostic | Same | Same -- epoll works on riscv64 Linux |
| InfiniBand (ibverbs) transport | Architecture-agnostic API | Architecture-agnostic | Architecture-agnostic API, but libibverbs MMIO primitives incomplete on riscv64 (Section 9) |
| libuv transport | Architecture-agnostic | Architecture-agnostic | Architecture-agnostic |
| Collective algorithms (allreduce, allgather, etc.) | Architecture-agnostic C++ | Same | Same |
| 64-bit pointer requirement (`CMAKE_SIZEOF_VOID_P EQUAL 8`) | Satisfied | Satisfied | Satisfied on RV64; RV32 cannot build Gloo |
| JIT compiler | None | None | None |
| Assembly files (`.S`, any ISA) | None anywhere in the repo | None | None |
| Crypto | None natively (OpenSSL via `USE_TCP_OPENSSL_LINK/LOAD`) | Same | Same |

**Verdict (per the standard full/partial/scalar/missing scale):**

| Architecture | Rating | Basis |
|---|---|---|
| amd64 | partial (C intrinsics), dormant by default | Only arch-conditional code in the whole repo (AVX256 float16 in `math.cc`), gated behind a flag never set by Gloo's own CMake defaults or CI |
| arm64 | scalar (C fallback) | No NEON/ARM intrinsics or guards exist anywhere; CI builds and tests via the generic templated scalar path |
| riscv64 | missing | No source files, no CMake option, no CI, no cross-compile/QEMU step, no issues/PRs/commits, no tags/releases upstream. Not a "stub" -- there is zero acknowledgment of RISC-V in the project. The portable scalar code path would very likely compile unmodified on riscv64, but this has never been attempted, tested, or claimed by upstream |

**Conclusion:** Gloo has essentially no architecture-specific code beyond one dormant x86 AVX float16 SIMD path. Because CPU math is not the bottleneck for collective communications (network I/O dominates), the absence of an RVV path is a minor performance consideration, not a correctness or functionality gap -- consistent with the finding that Gloo builds and ships successfully on riscv64 via Debian/Ubuntu packaging with zero source patches.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake >= 3.21 (`cmake_minimum_required(VERSION 3.21 FATAL_ERROR)`), C++20 standard.

**C++ compiler minimum:** not stated explicitly by upstream. C++20 implies GCC >= 10 or Clang >= 12 as practical minimums; GCC 12+ is recommended for complete C++20 support. [NEEDS VERIFICATION -- no upstream-documented minimum exists]

**Architecture gate (riscv64 RV64 passes; RV32 does not):**
```
if(NOT CMAKE_SIZEOF_VOID_P EQUAL 8)
  message(FATAL_ERROR "Gloo can only be built on 64-bit systems.")
endif()
```

**CMake flags relevant to riscv64:**

| Flag | Default | Notes for riscv64 |
|---|---|---|
| `USE_REDIS` | OFF | requires hiredis; builds on riscv64 |
| `USE_IBVERBS` | OFF | libibverbs MMIO primitives incomplete on riscv64 |
| `USE_NCCL` | OFF | CUDA-only; N/A on riscv64 |
| `USE_RCCL` | OFF | ROCm-only; N/A on riscv64 |
| `USE_LIBUV` | OFF | requires libuv >= 1.26; builds on riscv64 |
| `USE_TCP_OPENSSL_LINK` | OFF | requires OpenSSL 1.1.x (CI-pinned); builds on riscv64 |
| `USE_TCP_OPENSSL_LOAD` | OFF | mutually exclusive with LINK |
| `USE_CUDA` | OFF | N/A on riscv64 |
| `USE_ROCM` | OFF | N/A on riscv64 |
| `BUILD_TEST` | OFF | requires GoogleTest |
| `BUILD_BENCHMARK` | OFF | requires hiredis |

**Recommended native riscv64 build command:**
```
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

**Cross-compilation:** no upstream toolchain file for riscv64 exists. The `cmake/` directory contains only `Modules/` (four `Find*.cmake` files), `Cuda.cmake`, `Dependencies.cmake`, `GlooConfig.cmake.in`, `GlooConfigVersion.cmake.in`, `Hip.cmake`, `Hipify.cmake` -- no toolchain files of any kind. A toolchain file must be supplied externally, e.g.:
```
cmake ../ \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/your/riscv64-toolchain.cmake \
  -DCMAKE_VERBOSE_MAKEFILE=ON \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DUSE_REDIS=OFF -DUSE_IBVERBS=OFF -DUSE_NCCL=OFF \
  -DUSE_RCCL=OFF -DUSE_CUDA=OFF -DUSE_ROCM=OFF
```

**QEMU usage:** zero. No QEMU step exists anywhere in the CI or build system, for any architecture.

**Dockerfiles / `.ci` / `docker/` directory:** none exist in the repository. Top-level directories are only `.github/`, `cmake/`, `docs/`, `gloo/`, `media/`, `tools/amd_build/`.

**Known build failures on riscv64:** none reported upstream. The allreduce_shm feature that introduced the x86-only `immintrin.h` portability hazard (PR #458, causing issue #486 on arm64) was fully reverted in PR #490, so the current tree does not carry that risk for riscv64 either. Debian sid and Ubuntu (resolute/26.04, and previously noble/24.04) both build and ship `libgloo0`/`libgloo-dev` for riscv64 from unmodified upstream source, confirming the library compiles without patches on riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TCP collective transport (allreduce, allgather, broadcast, scatter, reduce) | Full | Full | Full (epoll works on Linux riscv64) |
| InfiniBand (ibverbs) transport | Full | Full | Partial -- libibverbs MMIO helpers incomplete |
| libuv async transport | Full | Full | Full |
| TLS (TCP-OpenSSL) | Full | Full | Full (see OpenSSL test-flakiness notes in Section 9) |
| Redis rendezvous backend | Full | Full | Full |
| float16 reductions (sum/product/max/min) | AVX-accelerated (opt-in, dormant by default) | Scalar | Scalar |
| int8, fp32, fp64 reductions | Scalar | Scalar | Scalar |
| bfloat16 reductions | Not implemented (issue #454) | Not implemented | Not implemented |
| CUDA collective transport (NCCL) | Full | N/A | N/A (CUDA does not target riscv64) |
| ROCm collective transport (RCCL) | Full | N/A | N/A (ROCm does not target riscv64 in mainline) |

**Functional gaps on riscv64:**
- InfiniBand (`USE_IBVERBS=ON`): libibverbs MMIO helpers are incomplete on riscv64 (upstream PR [rdma-core#1639](https://github.com/linux-rdma/rdma-core/pull/1639) abandoned March 2026). Enabling this on riscv64 will produce an unreliable or non-functional InfiniBand transport. Mitigation: `USE_IBVERBS` defaults to OFF.
- MPI transport (`USE_MPI`): Open MPI has an open crash issue ([open-mpi/ompi#13762](https://github.com/open-mpi/ompi/issues/13762)) and in-progress LL/SC atomics work (PR #13789, and a related PR #14495 referenced in dependency-level research) on riscv64 hardware. MPI transport is unreliable on riscv64. Mitigation: not enabled by default in Gloo.

**Performance gaps on riscv64 vs amd64:** float16 reductions run scalar on riscv64 vs the (opt-in, normally disabled) 8-wide AVX path on amd64. Given that network I/O dominates collective-operation latency, the practical impact is expected to be minor; exact throughput delta is data not available -- no Gloo-specific riscv64 benchmarks exist in any source searched (see Section 11 note on benchmarks). All other reduction types (int8, fp32, fp64) are scalar on amd64 as well, so there is no gap there.

**Security hardening gaps:** data not available -- no upstream analysis of security hardening flags (stack canaries, CFI, shadow stack) specific to riscv64 was found.

**NaN / floating-point semantics:** the float16 conversion code (`cpu_float2half_rn`, `cpu_half2float` in `types.h`) uses software-only bit manipulation with explicit NaN, Inf, and denormal handling, fully portable to riscv64 with no correctness risk identified. No riscv64-specific NaN or floating-point correctness issues were found in any search.

## 7. CI/CD Infrastructure

No riscv64 CI exists, either upstream or via RISE. Independently confirmed twice by reading the raw contents of every workflow file at HEAD `0abb85818e9fa0ba5e3d5a2d6ad8d3df23b1a1e1`, and by a recursive case-insensitive grep for "riscv" across the entire repository tree (zero matches, exit code 1).

**All six workflow files (no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml` exist in the repo):**

| Workflow file | Trigger | Runner(s) | riscv64 | QEMU |
|---|---|---|---|---|
| `build-linux.yml` | push to main, pull_request | `ubuntu-latest` (x86-64, x3 variants), `ubuntu-24.04-arm` (ARM64, x1) | No | No |
| `build-cuda.yml` | push to main, pull_request | `ubuntu-22.04`, matrix over CUDA 11.8.0/12.4.0 | No | No |
| `build-rocm.yml` | push to main, pull_request | `ubuntu-22.04` inside `rocm/dev-ubuntu-22.04` container, matrix over ROCm 6.0/6.2 | No | No |
| `build-windows.yml` | push to main, pull_request | `windows-latest` | No | No |
| `claude-code.yml` | issue_comment, issues opened | no `runs-on`/build matrix (Claude Code automation bot via `pytorch/test-infra` reusable workflow), not a build/test job | No | No |
| `super-linter.yml` | push to main, pull_request | `ubuntu-latest` (VALIDATE_CPP explicitly disabled) | No | No |

**Comparison table:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux build | Yes (`ubuntu-latest`) | Yes (`ubuntu-24.04-arm`, native runner, PR #487) | No |
| CUDA build | Yes | No | No |
| ROCm build | Yes | No | No |
| Windows build | Yes | No | No |
| Test execution | Yes | Yes | No |
| RISE runner | N/A | N/A | No |
| Hardware runner | Hosted GitHub runner | Hosted GitHub runner (native ARM64) | None |
| QEMU emulation | No | No | No |

No CI/CD infrastructure for riscv64 exists anywhere -- not upstream, not via RISE, not via any third-party mirror. The only riscv64 build evidence anywhere in the supply chain is Debian and Ubuntu distro packaging infrastructure operating entirely outside upstream's process (Section 8).

## 8. Distribution and Release Status

**Upstream GitHub Releases:** none. `git ls-remote --tags` against the repository returns zero tags, confirmed independently in multiple passes. There has never been a tagged GitHub Release, so there are no release-asset filenames of any architecture to check for riscv64 presence -- this channel is empty, not "checked and riscv64 is missing."

**PyPI (`pypi.org/pypi/gloo/json`):** the PyPI package literally named "Gloo" is an unrelated, unmaintained ~2012 IPython/Pandas workflow tool (4 sdist-only releases: `Gloo-0.0.1.tar.gz`, `0.1.0`, `0.1.1`, `0.1.2.tar.gz`), with zero wheels of any architecture. It is not the same project as `pytorch/gloo` (the C++ collective-communications library) and is not a riscv64-relevant data point.

**RISE wheel builder / RISE GitLab package registry:** the RISE PyPI mirror (`gitlab.com/api/v4/.../packages/pypi/simple/gloo/`) redirects (302) to `pypi.org/simple/gloo/`, i.e. it has no "gloo" package of its own and falls through to the same unrelated PyPI package. The RISE wheel builder's tracked-package list (~70-84 packages depending on source) does not include Gloo.

**Arch Linux RISC-V (`archriscv.felixc.at`):** not packaged. Search returned no result.

**Ubuntu -- confirmed across two releases:**
- Ubuntu 24.04 (noble): `libgloo0` and `libgloo-dev`, version `0.0~git20230519.597accf-2build3`, architectures amd64, arm64, ppc64el, **riscv64**, s390x. `libgloo-cuda-0`/`libgloo-cuda-dev`: amd64 and ppc64el only (no riscv64, expected since CUDA does not target riscv64).
- Ubuntu resolute (26.04, current development series): `libgloo0` and `libgloo-dev`, version `0.0~git20250912.d97133a-2`, architectures amd64, arm64, ppc64el, **riscv64**, s390x, verified live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Gloo&suite=resolute&searchon=names&section=all) (HTTP 200) with a dedicated per-arch page at `packages.ubuntu.com/resolute/riscv64/libgloo0`. `libgloo-cuda-0`/`libgloo-cuda-dev` (multiverse, version `0.0~git20231202.5354032-4`): amd64, ppc64el only. `libgloo-rocm-0`/`libgloo-rocm-dev` (universe, version `0.0~git20250912.d97133a-2+rocm1build1`): amd64, arm64 only. Neither GPU variant targets riscv64, as expected.
- `ports.ubuntu.com/pool/universe/g/gloo/` lists actual `.deb` binaries for riscv64 spanning 4 separate build cycles from 2021 through 2026 (`libgloo0_0.0~git20200918.3dc0328-4_riscv64.deb` in 2021, through `libgloo0_0.0~git20250912.d97133a-2_riscv64.deb` in 2026-02) -- a `curl -I` on the newest confirms `HTTP/1.1 200 OK`, 299822 bytes, live and downloadable. This is sustained, repeatedly-rebuilt riscv64 packaging across multiple Ubuntu cycles, not a one-off fluke.

**Debian sid:** current version `0.0~git20250912.d97133a-2`. riscv64 build status: "Installed" (successful, built on `rv-osuosl-02`). All 64-bit architectures (amd64, arm64, alpha, loong64, ppc64, ppc64el, riscv64, s390x, sparc64) show "Installed"; 32-bit architectures are correctly excluded (`BD-Uninstallable`, due to the `architecture-is-64-bit` build dependency). A newer upstream snapshot (`0.0~git20260617.15d8235`) is flagged for packaging. Source: [Debian tracker](https://tracker.debian.org/pkg/gloo).

**Fedora:** data not available -- Fedora riscv64 package status was not searched.

**What a user must do to get a working riscv64 binary:** install from Ubuntu (24.04 noble or 26.04 resolute) or Debian sid via `apt install libgloo0 libgloo-dev` -- no build required, no source patches applied by the packagers. Alternatively, build from source using the commands in Section 5 with all GPU and InfiniBand options disabled.

## 9. Dependencies

**Summary table:**

| Dependency | Role in Gloo | riscv64 build | riscv64 test | riscv64 release | Blocking |
|---|---|---|---|---|---|
| CMake | Build system (>= 3.21) for the whole project | Yes -- CMake itself is fully portable and packaged for riscv64 in all major distros | N/A | Packaged for riscv64 in Debian, Ubuntu, Fedora | No |
| libuv | TCP transport event loop (`USE_LIBUV`) | Builds; riscv64 syscall-number fix merged Aug 2023 (PR #4127), `cpu_relax()` for riscv64 merged Feb 2024 (PR #5019) | No dedicated riscv64 CI found upstream | Packaged for riscv64 in Debian/Ubuntu | No |
| OpenSSL | TCP-TLS transport (`USE_TCP_OPENSSL_LINK/LOAD`), CI pins 1.1.x (EOL) | Builds on riscv64; active riscv64 asm/constant-time work (PRs #31080, #31082, May-Jun 2026; musl fix PR #25787; riscv64 CI runner PR #27240) | Flaky: riscv64-specific issues reported across two research passes citing different IDs -- #22871 (3.2.0 build error, fixed), #22166 (SSL test failures at high HARNESS_JOBS), #25772 (musl riscv64 crossbuild failure since 3.4.0), and separately #30880 (`test_lhash`/`test_hashtable_multithread` malloc-unaligned-fastbin failure). Both sets describe riscv64 OpenSSL test instability; the specific issue numbers differ between sources and should be reconciled before citing a single ID [NEEDS VERIFICATION] | Debian sid ships 3.6.x for riscv64 | Soft -- affects OpenSSL 3.x test suite; Gloo's own CI pins EOL 1.1.x, which is not directly hit by the 3.x flakiness, but production/distro builds link 3.x [NEEDS VERIFICATION whether Debian's libgloo links system OpenSSL 3.x or disables TLS] |
| hiredis | Redis rendezvous backend (`USE_REDIS`) | Builds on riscv64; no riscv64-specific issues found | No riscv64 CI found | Packaged for riscv64 in Debian/Ubuntu | No |
| rdma-core | InfiniBand/ibverbs RDMA transport (`USE_IBVERBS`) | Partial -- DMA-coherency fix merged 2022 (PR #1169); MMIO helpers PR #1639 for riscv64 abandoned March 2026 | No riscv64 CI; MMIO primitives incomplete | Packaged (`libibverbs-dev`) in Debian sid for riscv64 | Yes -- `USE_IBVERBS=ON` is unreliable on riscv64 until MMIO helpers land (default is OFF in Gloo, so not a default-path blocker) |
| Open MPI | MPI collective transport (`USE_MPI`) | Partial -- riscv64 timer fix merged Jul 2025 (PR #13324); LL/SC atomics (PR #13789, and PR #14495 referenced in one pass) still in progress, with undefined-behavior concerns noted | Open crash: issue #13762, "opal_lifo hangs/crashes on specific riscv64 hardware (Milk-V Pioneer P550)," open as of research date | Packaged (`libopenmpi-dev`) in Debian sid for riscv64 | Yes -- MPI transport unreliable on riscv64 hardware (not enabled by default in Gloo) |
| CUDA | GPU collectives substrate for `USE_CUDA`/`USE_NCCL` | No riscv64 support today. NVIDIA has announced (RISC-V Summit 2025 / Hot Chips 2026 coverage) it is bringing CUDA to RISC-V, gated on RVA23 + server-SoC-class RISC-V CPUs, no ship date | No riscv64 CI/tests found | Not packaged for riscv64 (the CUDA toolkit runtime/compiler itself is not riscv64-targeted; some doc-only packages like `nvidia-cuda-toolkit-doc` have historically listed riscv64 but that is not the toolkit itself) | N/A today -- hard blocker is upstream CUDA, not Gloo |
| NCCL | GPU collectives for CUDA (`USE_NCCL`) | No riscv64 support; single old unmerged PR ([NVIDIA/nccl#1183](https://github.com/NVIDIA/nccl/pull/1183), "wc_store_fence for RISC-V", Feb 2024) | No riscv64 CI found | Not packaged for riscv64 | N/A -- CUDA does not target riscv64 |
| ROCm | GPU collectives substrate for `USE_ROCM`/`USE_RCCL` | Open feature request [ROCm/ROCm#5629](https://github.com/ROCm/ROCm/issues/5629) "RISC-V and multi-arch friendly ROCm" (open); ROCm/ROCm#3960 covers arm64 separately, not riscv64. Community/vendor reports of ROCm 6.4.2 ported to RISC-V SoCs (UR-DP1000, SG2044) exist outside mainline | No riscv64 CI in ROCm/ROCm or ROCm/rccl | Not packaged for riscv64 in mainline ROCm | Blocking -- riscv64 multi-arch support is an open, unresolved feature request, not merged |
| RCCL | GPU collectives for ROCm (`USE_RCCL`) | No riscv64 support; ROCm does not target riscv64 in mainline | No riscv64 CI found | Not packaged for riscv64 | N/A -- ROCm does not target riscv64 |
| googletest | Unit test framework (`BUILD_TEST`) | Builds on riscv64 (community cross-build discussion, PR #4119) | Open issue [google/googletest#3756](https://github.com/google/googletest/issues/3756), `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64, open since Feb 2022 | Packaged for riscv64 in major distros | No -- test-only dependency |

**Deep dive: rdma-core / libibverbs.** Debian merged DMA-coherency support for riscv64 in PR #1169 (2022). SUSE contributed a riscv64 build fix that was later reverted (PR #1158). The MMIO helpers PR (#1639), needed for low-level RDMA primitives on riscv64, was abandoned in March 2026 and has no successor PR as of this research. Without merged MMIO helpers, `USE_IBVERBS=ON` on riscv64 will produce incomplete or unreliable RDMA transport. This is off by default in Gloo and can be disabled for CPU-only or TCP-only deployments.

**Deep dive: Open MPI.** The riscv64 timer fix merged July 2025 (PR #13324). Full LL/SC atomic support is still open (PR #13789, opened March 2026, containing noted undefined-behavior concerns in atomic subtraction; a related PR #14495 is also referenced). A confirmed crash of `opal_lifo` on riscv64 hardware (Milk-V Pioneer P550) is tracked in issue #13762, open as of this research. Not enabled by default in Gloo and can be disabled.

**Deep dive: OpenSSL.** Gloo's own CI installs OpenSSL 1.1.1b from source (EOL upstream). Distributors (Debian, Ubuntu) ship OpenSSL 3.x for riscv64, creating a mismatch between what Gloo's CI validates and what production distro environments actually link against. Two independent research passes surfaced different sets of riscv64-relevant OpenSSL issue numbers describing test flakiness (PR/issue numbers #22871, #22166, #25772, #25787, #27240, #31080, #31082 in one pass; #30880 in the other) -- both describe riscv64 test instability in OpenSSL's own test suite rather than a Gloo-blocking build failure, but the specific IDs disagree and should be reconciled before being cited individually [NEEDS VERIFICATION]. Whether Debian's `libgloo0`/`libgloo-dev` link against system OpenSSL 3.x or build with TLS disabled entirely is [NEEDS VERIFICATION].

**Cross-reference note:** `libuv`, `hiredis`, `Open MPI`, `rdma-core`, `RCCL`, `ROCm`, and `CUDA` are tracked in this ecosystem's `projects.yml` but currently have no populated `project-reports/*.md` file of their own. Only Gloo, OpenSSL, NCCL, and googletest currently have separate report files (`project-reports/openssl.md`, `project-reports/nccl.md`, `project-reports/googletest.md`).

## 11. Known Bugs and Active Issues

Zero riscv64-specific issues exist in `pytorch/gloo` (formerly `facebookincubator/gloo`) under any search variant (`riscv`, `riscv64`, `RISC-V`, `RVV`), confirmed by multiple independent passes including GitHub's public search UI, `search_code`/`search_issues`/`search_pull_requests` (where accessible), and a full-repo clone-and-grep. Issues with architectural relevance to riscv64, none of which are riscv64-specific:

| ID | Title | Status | Severity | riscv64 relevance |
|---|---|---|---|---|
| #486 | BUG: SHM support does not compile on Arm64 | Open (filed 2026-02-04) | Medium | Root cause was x86-only `<immintrin.h>` inclusion in `allreduce_shm.cc` (PR #458). Feature fully reverted (PR #490). The same failure would have occurred on riscv64 had the feature not been reverted; not present in the current tree |
| #471 | TCP Backend All Gather lower bandwidth for WORLD_SIZE=2 | Open | Medium | Architecture-independent algorithmic issue in the ring communication pattern at 2-node topology; would affect riscv64 equally. No throughput figures given in the issue text |
| #454 | Bfloat16 datatype not supported in gloo | Open | Low | Affects all platforms equally; no bfloat16 reduction support anywhere in the codebase |
| #464 | NCCL vs Gloo performance comparison | Open | Informational | No benchmark data in the issue itself, just a question; N/A on riscv64 |

**Correctness bugs:** none with confirmed riscv64 impact in Gloo itself. The relevant correctness risk sits in optional dependencies: Open MPI's `opal_lifo` crash on riscv64 hardware (issue #13762) and OpenSSL's riscv64 test-suite flakiness (Section 9) -- neither is a Gloo-code defect.

**Benchmark data:** no Gloo-specific riscv64 performance benchmarks exist in any source searched (GitHub, web search, or riseproject.dev). The only numeric data point tying Gloo to riscv64 anywhere is a wheel-size delta, not a runtime measurement: a community dev.to post ("The Dependency Rabbit Hole: Why 25 RISC-V Python Wheels Weren't Enough") reports a PyTorch riscv64 wheel growing from 78 MB (`USE_DISTRIBUTED=0`, no Gloo backend, `vLLM` failing with `torch.distributed.is_available()` returning `False`) to 82 MB after rebuilding with `USE_DISTRIBUTED=1 USE_GLOO=1`, which let vLLM initialize its distributed backend successfully. This is a third-party community report, not a RISE-published or upstream-published benchmark [NEEDS VERIFICATION, single source]. RISE's own "PyTorch is available on riscv64!" post contains general PyTorch-on-riscv64 figures (RVV depthwise convolution: 31% improvement; preliminary oneDNN elementwise multiply on SG2044: 8.85x, explicitly flagged as untested/roadmap; CI build times of ~20h cold-cache/~1h30 hot-cache; 121.9 hours serial test time; 212,038 test cases with a 99.998% pass rate) but does not mention Gloo at all.

## 12. Objections and Upstream Blockers

**Project posture:** maintenance-only mode, restricted issue creation, new features require maintainer discussion before a PR is opened. This is a high barrier for a riscv64 CI or optimization contribution.

**Stated objections:** none on record -- no public discussion of RISC-V support exists in any form.

**Technical blockers:**
- No riscv64 CI runner: no mechanism to validate riscv64 builds or catch regressions, the first requirement for any architecture support claim.
- No riscv64 toolchain file for cross-compilation: must be supplied externally by any contributor attempting one.
- InfiniBand transport unreliable on riscv64 (libibverbs MMIO gap) -- a dependency blocker, not Gloo-specific.
- MPI transport unreliable on riscv64 (Open MPI `opal_lifo` crash) -- a dependency blocker, not Gloo-specific.

**Organizational blockers:**
- Maintenance-only mode reduces the likelihood that Meta maintainers will review or merge riscv64 patches absent a clear business case.
- The ARM64 CI precedent (PR #487) required Arm-affiliated contributors to do the work end to end; a RISC-V CI addition would plausibly require equivalent engagement from a RISC-V hardware or silicon vendor.
- No RISE relationship exists to leverage for expedited review; Gloo is not a RISE member project and has never been the subject of RISE-funded or RISE-blogged work (Section 1).

**Acceptance probability for a riscv64 CI PR:** moderate, if the PR is purely additive (CI matrix entry only, no code changes) and requires minimal maintainer review effort. The ARM64 precedent supports this reading, but the maintenance-only posture introduces real risk of stalled review.

**Acceptance probability for an RVV float16 optimization:** low to moderate. The fact that arm64 has CI but no NEON optimization despite being a tested tier suggests maintainers are not prioritizing SIMD work beyond the single dormant x86 AVX path.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification:** Gloo has zero riscv64 CI anywhere: all 6 GitHub Actions workflows (`build-linux.yml`, `build-cuda.yml`, `build-rocm.yml`, `build-windows.yml`, `claude-code.yml`, `super-linter.yml`) run only on `ubuntu-latest`, `ubuntu-24.04-arm`, `ubuntu-22.04`, or `windows-latest`, with no riscv64 runner or QEMU step (confirmed by a full-repo grep at HEAD `0abb858` and direct reading of `.github/workflows/build-linux.yml`), and there are zero riscv/riscv64 issues, PRs, or commits in the repo. However, Ubuntu (resolute/26.04) and Debian sid both build and ship `libgloo0`/`libgloo-dev` for riscv64 from unmodified upstream source with no riscv64-specific patches ([Ubuntu package search](https://packages.ubuntu.com/search?keywords=Gloo&suite=resolute&searchon=names&section=all), [Debian tracker](https://tracker.debian.org/pkg/gloo)), which triggers the distribution floor's clean-distro-build yellow upgrade from the no-upstream-CI orange default. Gloo is a collective-communications library whose value (distributed allreduce/allgather/broadcast over TCP/RDMA) is delivered regardless of CPU SIMD optimization -- its only architecture-specific code is a minor x86 AVX float16 path in `gloo/math.cc` -- so it is not an optimization-purpose project, and no optimization-level modifier applies.

**Pending work that could change the grade:** no open riscv64-related PRs or issues exist in `facebookincubator/gloo`/`pytorch/gloo` (zero across issues, PRs, commits, and CI configs). No RISE Project involvement (not a RISE member, no RISE blog coverage, not in the RISE wheel builder). GitHub Releases remain unresolved in the strict sense -- zero tags exist in the repo, so there is likely nothing to check, but the GitHub Releases API could not be queried directly due to this session's repo-scoping restrictions, so that answer rests on an anonymous `git ls-remote --tags` inference rather than a direct Releases-API read. Optional transports carry dependency-level riscv64 risk if ever enabled: rdma-core's MMIO helper PR for riscv64 (#1639) was abandoned, and Open MPI has an open riscv64 crash issue (#13762) -- both are off by default in Gloo and do not affect the default TCP transport.

## 14. Investment Analysis

RISE has no involvement in Gloo; all potential work items below require new effort with no existing RISE-funded baseline to build on.

### 14.1 Functional Enablement

The library is already functionally complete on riscv64 for the default TCP transport via the scalar fallback path, confirmed by sustained Debian/Ubuntu packaging with zero source patches. No code changes are required for basic functionality. The remaining gaps are InfiniBand (a dependency issue in rdma-core, not in Gloo) and MPI (a dependency issue in Open MPI, not in Gloo), both off by default.

Fixing the InfiniBand gap requires completing rdma-core PR #1639 (MMIO helpers, abandoned March 2026) or a replacement PR -- work in the rdma-core repository. Fixing the MPI gap requires resolving Open MPI issue #13762 (`opal_lifo` crash) and completing the LL/SC atomics work (PR #13789 / #14495) -- work in the Open MPI repository.

### 14.2 Performance Optimization

The only missing SIMD optimization is an RVV float16 reduction kernel, paralleling the existing (dormant-by-default) AVX path in `gloo/math.cc`. Scope is small (roughly 50 lines of intrinsic code for sum, product, max, min). Since network I/O dominates collective-operation latency, the wall-clock impact for typical distributed-training workloads is likely small; precise impact is data not available, as no Gloo-specific riscv64 benchmarks exist anywhere.

### 14.3 CI/CD Infrastructure

Adding a riscv64 CI runner to `build-linux.yml` is a single matrix-entry addition (1-2 lines of YAML) plus provisioning a GitHub-hosted or self-hosted riscv64 runner. The ARM64 precedent (`ubuntu-24.04-arm` runner, PR #487) provides an exact template to follow. If a hosted riscv64 runner is available (e.g. via a RISC-V vendor or the RISE RISC-V Runners program referenced in RISE's blog), the change is trivial; if a self-hosted runner must be registered and maintained, infrastructure effort dominates the estimate.

### 14.4 Ecosystem Enablement

The PyPI package literally named "gloo" is unrelated to this project, so there is no Gloo-specific wheel pipeline to extend. Gloo reaches end users either as a source build inside PyTorch's own `USE_GLOO=1` flag or via the Debian/Ubuntu binary packages, both of which already work on riscv64 today. Given the maintenance-only posture, publishing standalone Gloo release artifacts (which do not exist for any architecture today) is low priority.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 runner to `build-linux.yml` | 0.5 | Contributor (RISC-V vendor) | High |
| Functional | Fix rdma-core MMIO helpers for riscv64 (libibverbs) | 3-5 | rdma-core contributor | Medium |
| Functional | Resolve Open MPI `opal_lifo` crash on riscv64 (issue #13762) | 4-8 | Open MPI contributor | Medium |
| Performance | RVV float16 reduction kernels in `gloo/math.cc` | 1-2 | Contributor (RISC-V vendor) | Low |
| Distribution | Formalize riscv64 upstream release/tagging process (currently zero tags for any architecture) | 1 | Contributor (RISC-V vendor or maintainer) | Low |

## 15. References

- [pytorch/gloo repository (current home; formerly facebookincubator/gloo, identical HEAD commit)](https://github.com/pytorch/gloo)
- [facebookincubator/gloo (legacy org name, redirects to pytorch/gloo)](https://github.com/facebookincubator/gloo)
- [Gloo CMakeLists.txt](https://github.com/facebookincubator/gloo/blob/main/CMakeLists.txt)
- [Gloo gloo/math.cc](https://github.com/facebookincubator/gloo/blob/main/gloo/math.cc)
- [Gloo gloo/math.h](https://github.com/facebookincubator/gloo/blob/main/gloo/math.h)
- [Gloo .github/workflows/build-linux.yml](https://github.com/facebookincubator/gloo/blob/main/.github/workflows/build-linux.yml)
- [Gloo PR #487 -- add arm64 runner](https://github.com/facebookincubator/gloo/pull/487)
- [Gloo PR #490 -- revert allreduce_shm](https://github.com/facebookincubator/gloo/pull/490)
- [Gloo issue #486 -- SHM does not compile on Arm64](https://github.com/pytorch/gloo/issues/486)
- [Gloo issue #471 -- All Gather lower bandwidth for WORLD_SIZE=2](https://github.com/facebookincubator/gloo/issues/471)
- [Gloo issue #454 -- Bfloat16 not supported](https://github.com/facebookincubator/gloo/issues/454)
- [Gloo issue #464 -- NCCL vs Gloo performance comparison](https://github.com/facebookincubator/gloo/issues/464)
- [pytorch/pytorch#116012 -- Issue with Protoc while building PyTorch for RISC-V](https://github.com/pytorch/pytorch/issues/116012)
- [pytorch/pytorch#166057 -- GCC ICE building DepthwiseConvKernel.cpp for RISC-V/RVV](https://github.com/pytorch/pytorch/issues/166057)
- [Ubuntu resolute (26.04) package search -- Gloo](https://packages.ubuntu.com/search?keywords=Gloo&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute libgloo0 riscv64](https://packages.ubuntu.com/resolute/riscv64/libgloo0)
- [Ubuntu noble (24.04) libgloo0 package](https://packages.ubuntu.com/noble/libgloo0)
- [Ubuntu noble (24.04) libgloo-dev package](https://packages.ubuntu.com/noble/libgloo-dev)
- [ports.ubuntu.com gloo binary pool](https://ports.ubuntu.com/pool/universe/g/gloo/)
- [Debian tracker -- gloo](https://tracker.debian.org/pkg/gloo)
- [Debian buildd -- gloo riscv64 status](https://buildd.debian.org/status/package.php?p=gloo&suite=sid)
- [Arch Linux RISC-V package search -- gloo](https://archriscv.felixc.at/?q=gloo)
- [PyPI -- Gloo (unrelated package)](https://pypi.org/project/Gloo/)
- [libuv PR #5019 -- cpu_relax for riscv64](https://github.com/libuv/libuv/pull/5019)
- [libuv PR #4127 -- missing syscall numbers for riscv64](https://github.com/libuv/libuv/pull/4127)
- [rdma-core PR #1639 -- MMIO helpers for riscv64 (abandoned)](https://github.com/linux-rdma/rdma-core/pull/1639)
- [rdma-core PR #1169 -- riscv64 DMA coherency](https://github.com/linux-rdma/rdma-core/pull/1169)
- [Open MPI issue #13762 -- opal_lifo crash on riscv64 hardware](https://github.com/open-mpi/ompi/issues/13762)
- [Open MPI PR #13789 -- LL/SC atomics for riscv64](https://github.com/open-mpi/ompi/pull/13789)
- [Open MPI PR #13324 -- riscv64 timer](https://github.com/open-mpi/ompi/pull/13324)
- [GoogleTest issue #3756 -- GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [NCCL PR #1183 -- wc_store_fence for RISC-V](https://github.com/NVIDIA/nccl/pull/1183)
- [ROCm/ROCm issue #5629 -- RISC-V and multi-arch friendly ROCm](https://github.com/ROCm/ROCm/issues/5629)
- [RISE Project -- member list](https://riseproject.dev)
- [RISE blog -- PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE blog -- Python now officially supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [dev.to -- The Dependency Rabbit Hole: Why 25 RISC-V Python Wheels Weren't Enough](https://dev.to/gounthar/the-dependency-rabbit-hole-why-25-risc-v-python-wheels-werent-enough-13e7)