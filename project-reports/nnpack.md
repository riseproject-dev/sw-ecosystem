---
title: NNPACK
parent: Project Reports
color: red
dependencies:
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: pthreadpool
    relation: runtime-dependency
    criticality: critical
  - name: psimd
    relation: runtime-dependency
    criticality: critical
  - name: FP16
    relation: runtime-dependency
    criticality: critical
  - name: FXdiv
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="nnpack" %}

# NNPACK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** red<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for NNPACK<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

NNPACK ([github.com/Maratyszcza/NNPACK](https://github.com/Maratyszcza/NNPACK)) is an accelerated neural network inference library built around hand-tuned SIMD micro-kernels for convolution (FFT-based and Winograd), GEMM/GEMV, pooling, and activation functions. Its primary contribution was demonstrating that FFT-based convolution with batching could outperform direct convolution on x86 and ARM hardware in 2015-2016. It is written in C99/C++11 with architecture-specific backends generated via PeachPy (x86-64) or implemented as NEON C intrinsics and hand-written AArch32 assembly (ARM/ARM64).

**Governance.** There is no formal governance structure. No MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md, SUPPORT.md, or GOVERNANCE.md file exists anywhere in the repository. NNPACK is a single-maintainer academic research project created by Marat Dukhan (GitHub: Maratyszcza) during his work at Richard Vuduc's HPC Garage lab, Georgia Institute of Technology, with advisory input from Nicolas Vasilache and Soumith Chintala of Facebook AI Research. It was funded in part by a U.S. National Science Foundation grant (Award #1339745). License is BSD-2-Clause. There is no foundation affiliation, no steering committee, and no TSC; decisions are made unilaterally by the owner.

**RISE Project membership.** NNPACK is not a member of, and has no documented relationship with, the RISE Project (riseproject.dev, the Linux Foundation RISC-V Software Ecosystem initiative). RISE membership is companies (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE), and neither NNPACK nor Marat Dukhan appears anywhere on the RISE site, its blog, or its members page.

**Corporate sponsors and contributors.** Across the full 374-commit history, Marat Dukhan is the overwhelmingly dominant author: 244 commits under a personal `maratek@gmail.com` address plus 108 commits under `marat@fb.com` (Facebook/Meta, where he later worked) = 352 of 374 commits. Andrew Tulloch (`tulloch@fb.com`, Facebook AI Research) contributed 3 commits (Caffe integration). By email domain, 112 of 374 commits originate from `fb.com`; the remainder are personal addresses. Facebook is also credited in the README as a production user. No other corporate sponsor is identifiable.

**Status.** The project is dormant. The last commit is 2023-02-01 ("fix cpuinfo branch (#214)"); commit volume collapsed from 129 (2016) and 156 (2017) to 74 (2018), then 7/6/1/1 in 2019/2020/2022/2023, with no commits at all in 2021 or since 2023. No GitHub releases have ever been published for this repository. The repository carries no archival banner but is effectively unmaintained (3.5+ years without a commit as of this report). Marat Dukhan moved active development to XNNPACK at Google, which is NNPACK's designated functional successor and is actively maintained, including active RISC-V/RVV work.

**Community stance on new architecture ports.** The README states that MIPS and MIPS64 are "not supported, and we have no plans to add it (pull request would be welcome, though)" - RISC-V is not mentioned at all, neither supported nor rejected. The project's informal practice is to accept community pull requests for architectures it will not pursue itself but to commit no project resources to doing so. With the sole maintainer inactive since February 2023, the de facto position is that no new ports, RISC-V or otherwise, are being pursued or would likely be reviewed.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2015 | Initial release, x86-64 (AVX2) and ARM (NEON) only | [GitHub repo](https://github.com/Maratyszcza/NNPACK) |
| 2016-2017 | ARM64 (AArch64 NEON) support added | [GitHub repo](https://github.com/Maratyszcza/NNPACK) |
| 2017-04-21 to 2017-04-23 | Issue #71, aarch64 support request, closed/resolved | [Issue #71](https://github.com/Maratyszcza/NNPACK/issues/71) |
| 2017-11-02 to 2017-11-03 | Issue #114, ppc64le build failure, fixed with a one-line CMakeLists.txt patch | [Issue #114](https://github.com/Maratyszcza/NNPACK/issues/114) |
| 2018 | Commit activity collapses (74 commits, down from 156 in 2017) | Repository commit history |
| 2023-02-01 | Last commit to the repository ("fix cpuinfo branch (#214)") | [GitHub repo](https://github.com/Maratyszcza/NNPACK) |
| 2026 (ongoing) | Zero RISC-V issues, PRs, or commits found anywhere in repository history | [Issues search](https://github.com/Maratyszcza/NNPACK/issues?q=riscv), [PR search](https://github.com/Maratyszcza/NNPACK/pulls?q=riscv) |

No RISC-V port has ever been attempted in upstream NNPACK. There is no first RISC-V commit, no tracking issue, and no contributor working on one. The only known attempt at any RISC-V support is an unofficial, non-upstreamed academic fork, `antfor/Masters-NNPACK` (a thesis project, "Vectorizing the FFT for RISC-V V and ARM SVE"), which patches the CMake processor allow-list and adds a `riscvv` backend built against a non-public EPI (European Processor Initiative) pre-standard LLVM/Clang toolchain targeting the pre-ratified 0.7-draft RVV extension at a hardcoded local path. It covers only 2D Fourier transform and GEMM kernels, has no documentation, Dockerfile, or QEMU instructions, and was never submitted upstream (see [antfor/Masters-NNPACK](https://github.com/antfor/Masters-NNPACK)). It is not usable as a general build path and has no bearing on upstream NNPACK's status.

## 3. Upstream Support Tier

NNPACK has no formal tier policy document. The recognized-processor list hardcoded in `CMakeLists.txt` is the only de facto tiering mechanism:

- **Tier 1 (fully supported):** x86-64 (AVX2/FMA3 via PeachPy), ARM/ARMv7 (NEON C intrinsics plus hand-written AArch32 `.S` assembly), ARM64/aarch64 (NEON C intrinsics)
- **Tier 2 (portable fallback):** processors matched by the allow-list fall through to `psimd` or `scalar` backends
- **riscv64:** not matched by the allow-list at all; CMake configure aborts with `FATAL_ERROR` before any backend selection occurs

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Hand-tuned backend | Yes (PeachPy/AVX2/FMA3) | Yes (NEON C intrinsics) | None |
| Runtime CPU detection | Yes (cpuinfo) | Yes (cpuinfo) | None |
| CI coverage | Yes (.travis.yml, scalar+psimd) | No | No |
| Official binary releases | None (zero GitHub releases, any arch) | None | None |
| CMake recognizes processor | Yes | Yes | No, FATAL_ERROR |
| Maintainer acknowledgment of architecture | Yes | Yes | No, never requested or discussed |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Architecture-specific code lives under `src/` in per-backend directories, verified directly against a full clone at HEAD `70a77f4`:

| Directory | Architecture | Implementation type | File count |
|-----------|-------------|--------------------|-----------:|
| `src/x86_64-fma/` | x86-64 | Hand-tuned PeachPy-generated assembly (AVX2/FMA3) plus intrinsics | 37 |
| `src/neon/` | ARM 32/64-bit | NEON C intrinsics; 3 hand-written AArch32 `.S` files (`h4gemm-aarch32.S`, `s4gemm-aarch32.S`, `sgemm-aarch32.S`); no dedicated aarch64 assembly | 20 |
| `src/psimd/` | Generic portable fallback | Portable SIMD via the `psimd` header library | 30 |
| `src/scalar/` | Emscripten / fallback | Pure C scalar | 25 |
| `src/ref/` | Reference | Pure C reference implementations (~3,603 LOC) | - |
| riscv64 | riscv64 | None | 0 |

Approximate source line counts: x86_64-fma ~5,633 LOC, psimd ~5,959 LOC, scalar ~5,713 LOC, neon ~4,387 LOC, riscv64 = 0 LOC.

A repository-wide, case-insensitive search for "riscv" (both a local `grep -ril` across the full tree and GitHub's own code-search index) returns zero matches. There is no `src/riscv64/` or `arch/riscv/` directory, no `#ifdef __riscv` guard anywhere (not even disabled), no `NNP_BACKEND_RISCV` macro, and no RVV intrinsic (`vfloat32m1_t`, `vle32_v`, etc.) in the codebase. A targeted search for RISC-V assembly files (`extension:S`) returns only the three ARM `.S` files listed above.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| FFT convolution (8x8, 16x16) | Full (PeachPy asm) | Full (NEON C) | Missing |
| Winograd convolution (8x8-3x3) | Full (PeachPy asm) | Full (NEON C) | Missing |
| GEMM / GEMV (BLAS) | Full (PeachPy asm) | Full (NEON C + AArch32 asm) | Missing |
| ReLU / softmax / pooling | Full (AVX2 C) | Full (NEON C) | Missing |
| Runtime CPU feature detection | Full (cpuinfo, AVX2/FMA3) | Full (cpuinfo, NEON/FP16) | Missing |
| RVV (RISC-V Vector) kernels | N/A | N/A | Missing |

If the `CMakeLists.txt` processor guard were patched to admit riscv64, the project would fall through only to the `psimd` generic-SIMD fallback, which has no hardware vector acceleration of any kind on any architecture. There is no path by which riscv64 would ever reach a hand-tuned backend inside NNPACK itself.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** CMake (minimum 2.8.12) with Ninja, plus a legacy `confu`/`configure.py` Python build path. C99 and C++11 are required. Architecture dispatch in both build paths covers only x86-64/ARM/NEON/psimd/scalar; neither path has any riscv-related code.

**Hard blocker.** `CMakeLists.txt` enforces an explicit processor allow-list:

```cmake
ELSEIF(NOT NNPACK_TARGET_PROCESSOR MATCHES
  "^(i686|x86_64|armv5te|armv7-a|armv7l|armv7|armv7s|aarch64|arm64|arm64e)$")
  MESSAGE(FATAL_ERROR
    "Unrecognized NNPACK_TARGET_PROCESSOR = ${NNPACK_TARGET_PROCESSOR}")
ENDIF()
```

riscv64 is absent from this regex. Configuring on or for riscv64 aborts immediately at CMake configure time with `Unrecognized NNPACK_TARGET_PROCESSOR = riscv64`, before any dependency is configured and before any build step runs. This is the identical failure mode previously hit by ppc64le and fixed in [issue #114](https://github.com/Maratyszcza/NNPACK/issues/114) with a one-line patch; no equivalent fix or issue has ever been filed for riscv64, and the only precedent for extending the list at all, [issue #71](https://github.com/Maratyszcza/NNPACK/issues/71) (aarch64 support), is closed with no riscv64 analogue.

**Required patch to proceed at all.** Changing `FATAL_ERROR` to a non-fatal path (or forcing `NNPACK_TARGET_PROCESSOR`/`CMAKE_SYSTEM_PROCESSOR` to an already-allow-listed value) is the only way to get past configure; there is no supported `-D` flag or override that bypasses this check. This is unsupported and undocumented by the project.

**Cross-compilation command after patching (illustrative, not upstream-supported):**

```bash
cmake -G Ninja \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DNNPACK_BACKEND=scalar \
  -DNNPACK_BUILD_TESTS=OFF \
  ..
ninja
```

| Flag | Value | Reason |
|------|-------|--------|
| `NNPACK_BACKEND` | `scalar` or `psimd` | `auto` never resolves because the processor allow-list check fails first |
| `NNPACK_BUILD_TESTS` | `OFF` | Test build pulls in googletest and other deps with their own riscv64 status |
| `CMAKE_SYSTEM_NAME` | `Linux` | Must match the `^(Darwin|Linux|Android)$` check |
| CMakeLists.txt patch | Required | `FATAL_ERROR` is unconditional for unrecognized processors; no override exists |

**Toolchain requirements.** No explicit minimum GCC/Clang version is documented anywhere in the repository. C99/C++11 are the stated language standards. Data not available: no toolchain version floor is stated for any architecture.

**QEMU.** Not documented anywhere in the repository for any architecture, since there is no supported cross-compilation story for riscv64 to document a QEMU workflow for.

**Dockerfiles.** None exist in the repository; no `Dockerfile`, `docker/`, or `.ci/docker/` directory is present.

**`cmake/` directory contents.** Only dependency-download scripts: `DownloadCpuinfo.cmake`, `DownloadFP16.cmake`, `DownloadFXdiv.cmake`, `DownloadPSimd.cmake`, `DownloadPThreadPool.cmake`, `DownloadPeachPy.cmake`, `DownloadGoogleTest.cmake`, plus a few others for build-time Python dependencies (opcodes, enum, six). No riscv64 toolchain file exists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| FFT convolution | Full | Full | Not available, build fails without patching |
| Winograd convolution | Full | Full | Not available |
| GEMM/GEMV | Full | Full | Not available |
| Pooling / activation | Full | Full | Not available |
| Runtime CPU detection | Full | Full | Not available |
| RVV acceleration | N/A | N/A | Not available |
| Build without patching | Yes | Yes | No, CMake FATAL_ERROR at configure |

**Functional gap.** NNPACK cannot be built for riscv64 at all without manually patching the CMake processor allow-list. There is no documentation, flag, or override that avoids this; it is a hard, deterministic stop, not a degraded or partial build.

**Performance gap.** Entirely moot given the functional gap: even in a hypothetical patched build, the only available fallback is the generic, non-accelerated `psimd` or `scalar` backend, with no RVV vectorization anywhere in NNPACK's own code. No benchmark data comparing NNPACK on riscv64 to arm64 or amd64 exists in any indexed source; general RISC-V HPC/ML benchmark literature exists (for example, evaluations of the Sophon SG2042/SG2044) but none of it involves NNPACK specifically.

**Security hardening gaps.** Data not available: no stack-protector, CFI, or shadow-call-stack configuration is documented or referenced for any architecture in this repository.

**Floating-point / NaN semantics.** Data not available: no documentation, test, or issue addresses NaN propagation or floating-point consistency across architectures.

## 7. CI/CD Infrastructure

The only CI configuration anywhere in the repository is a single root `.travis.yml` (Travis CI). Confirmed absent: `.github/workflows/` (no directory), `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`. Full relevant content of `.travis.yml`:

```yaml
language: c
compiler: clang
install:
  - git clone https://github.com/ninja-build/ninja.git /tmp/ninja
  - pushd /tmp/ninja
  - git checkout release
  - python configure.py --bootstrap
  ...
before_script:
  - confu setup
  - python ./configure.py --toolchain=clang --backend=$BACKEND
  - ninja
script:
  - ninja smoketest
env:
  - BACKEND=psimd
  - BACKEND=scalar
```

This builds only the `psimd` and `scalar` backends, on Travis's default (x86-64) host and compiler. No riscv64 reference exists anywhere in this file, and a case-insensitive search for "riscv" across the repository's entire GitHub code-search index (independent of the local clone) also returns zero matches, confirming there is no RISC-V job, QEMU step, or runner configuration of any kind, past or present.

| CI dimension | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| CI system exists | Yes (Travis CI) | No | No |
| Backend tested | psimd, scalar | None | None |
| Hardware tested | x86-64 (Travis host) | None | None |
| QEMU testing | No | No | No |
| RISE runners | No | No | No |
| Release-blocking CI | No (no releases exist) | No | No |

## 8. Distribution and Release Status

| Channel | riscv64 available? | Notes |
|---------|-------------------|-------|
| GitHub Releases | No, zero releases exist | Fetching the releases page returns "There aren't any releases here"; NNPACK is distributed as source only |
| PyPI | No | A package named `nnpack` (v0.1.0, `py2-none-any` wheel plus sdist) exists on PyPI but is an unrelated, pure-Python, Python-2-era legacy package, not Maratyszcza's NNPACK; it has no architecture-specific build at all |
| RISE GitLab wheel builder | No | `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/nnpack/` returns HTTP 302, redirecting to pypi.org; no `nnpack` package is registered there |
| Ubuntu 26.04 (resolute) | No | No `nnpack`, `python3-nnpack`, or `libnnpack` package exists for any architecture; a package search surfaces only `libxnnpack-dev` and `libxnnpack0.20241108`, which are the unrelated XNNPACK project matched by substring ("xnnpack" contains "nnpack") |
| Debian | No | [NEEDS VERIFICATION, from prior reporting] previously noted as accepted into experimental (source + amd64 only), flagged "not part of any Debian distribution"; no riscv64 build record found |
| Arch Linux RISC-V | No | A direct fetch of [archriscv.felixc.at/?q=nnpack](https://archriscv.felixc.at/?q=nnpack) contains zero occurrences of "nnpack" anywhere on the page |

**What a user must do to get a working binary on riscv64.** There is no path. A user would first need to patch `CMakeLists.txt` to remove the `FATAL_ERROR` on unrecognized processors, then validate that the resulting `psimd`/`scalar` fallback actually initializes and runs correctly on riscv64 (unverified; no such attempt is documented anywhere). No distribution packages this project for riscv64, or for any architecture. The project's own successor, XNNPACK (same original author, now Google-maintained), already has active RVV kernel work and is packaged for Ubuntu riscv64 (`libxnnpack-dev`), making it the practical answer for riscv64 neural-network inference acceleration rather than a port of NNPACK itself.

## 9. Dependencies

### Summary Table

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| cpuinfo | runtime-dependency, critical (CPU feature/ISA dispatch) | Packaged in Ubuntu 26.04 riscv64 (`cpuinfo`, `libcpuinfo0`, `libcpuinfo-dev`); CI builds riscv64 via QEMU/Android NDK but vendor/uarch and cache-topology detection are stubbed on `main` | Build-only in upstream CI; no `ctest` execution for any architecture | No upstream GitHub releases at all (zero tags, any arch); the Ubuntu package is built from an unmodified git snapshot predating pending fixes | Open tracking issue [pytorch/cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124) (since 2022-12-23); open, approved but stalled PR [#397](https://github.com/pytorch/cpuinfo/pull/397) adding full ISA/vendor/cache detection; open, stalled PR #421 (log-noise fix). This is independent of, and does not resolve, NNPACK's own hard configure-time block |
| pthreadpool | runtime-dependency, critical (thread pool backbone) | Packaged in Ubuntu 26.04 riscv64 (`libpthreadpool0`, `libpthreadpool-dev`); pure portable C with no architecture allow-list in its CMakeLists (only an x86-specific SSE2 flag branch), so it builds cleanly on riscv64 | No riscv64 leg in upstream CI; untested by upstream, only verified via downstream distro packaging | No GitHub releases observed; Ubuntu package built from a git snapshot | A search for "riscv" in `google/pthreadpool` issues returns zero results. Actively maintained (recent commits) |
| psimd | runtime-dependency, critical (NNPACK's default/fallback SIMD backend) | Packaged in Ubuntu 26.04 riscv64 (`libpsimd-dev`); header-only, with generic scalar fallback paths for unrecognized architectures, so it compiles on riscv64 but provides no native RVV vectorization, scalar-emulated SIMD only | No test suite exists (header-only library) | No GitHub releases; Ubuntu package from a 2020 git snapshot | A search for "riscv" in `Maratyszcza/psimd` issues returns zero results. The project is dormant (last commit 2020-05-17), effectively superseded by XNNPACK's internal SIMD abstraction |
| FP16 | runtime-dependency, critical (half-precision float conversion) | Packaged in Ubuntu 26.04 riscv64 (`libfp16-dev`); no architecture gate in its CMakeLists, portable C/C++ header library | No riscv64 CI leg found in its workflow configuration | No GitHub releases; Ubuntu package from a git snapshot | A search for "riscv" in `Maratyszcza/FP16` issues returns zero results. Reasonably maintained. There is an open, unmerged PR adding riscv64 QEMU CI to this dependency (separate from NNPACK's own status) |
| FXdiv | runtime-dependency, critical (fixed-point division for indexing/tiling) | Packaged in Ubuntu 26.04 riscv64 (`libfxdiv-dev`); no architecture gate, portable C | No test/CI evidence found for any architecture | No GitHub releases; Ubuntu package from a 2020 git snapshot | A search for "riscv" in `Maratyszcza/FXdiv` issues returns zero results. Dormant (last commit 2020-12-08) |
| googletest | test-dependency, optional (NNPACK's test suite only) | Builds on riscv64 per cross-referenced research | One known flaky riscv64 test reported upstream ([google/googletest#3756](https://github.com/google/googletest/issues/3756)); maintainers note riscv64 is not a fully supported configuration | Released for riscv64 via standard distro packaging | Low severity, test-only; not a build blocker for the library itself |

PeachPy, NNPACK's x86-64 JIT-style assembler used only when `NNPACK_BACKEND=x86-64`, is not listed above because it is not one of the project's declared direct dependencies for a general build; it is an x86-64-only code generator (Ubuntu packages `python3-peachpy` for amd64 only) and would never be selected by NNPACK's backend-selection logic on riscv64 even if the configure-time block were removed, so it is not a riscv64 blocker.

### Dependency Deep-Dive

**cpuinfo.** The most consequential dependency for any hypothetical RISC-V enablement. It already has Ubuntu 26.04 riscv64 packaging and riscv64 QEMU CI coverage, with an approved-but-stalled PR (#397) that would complete ISA/vendor/cache-topology detection. None of this matters to NNPACK today, because NNPACK's own `CMakeLists.txt` processor allow-list rejects riscv64 before cpuinfo is ever invoked.

**psimd.** The portable SIMD library that would serve as NNPACK's only riscv64 fallback path if the allow-list were patched. It is dormant (last commit 2020-05-17) and provides only generic scalar-emulated SIMD, no RVV. There is no technical path by which psimd would ever deliver RISC-V vector acceleration to NNPACK.

**pthreadpool, FP16, FXdiv.** All three are portable C libraries with no architecture gating and are already packaged for Ubuntu 26.04 riscv64. None presents a technical obstacle to a riscv64 build of NNPACK; each has unrelated, independent riscv64 CI or packaging work in progress (noted above) that is not blocked on NNPACK and does not depend on it.

**Bottom line.** Every one of NNPACK's actual compute/numerics dependencies (cpuinfo, pthreadpool, psimd, FP16, FXdiv) already builds for, or is already packaged for, riscv64. The sole blocker to a riscv64 build of NNPACK is NNPACK's own hard-coded CMake processor allow-list, combined with the project's total inactivity since February 2023.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#222](https://github.com/Maratyszcza/NNPACK/issues/222) | Build fails: missing fp16/psimd.h when compiling psimd/blas/shdotxf.c | Open | High, blocks the psimd backend | Would need to be fixed in addition to the CMake processor-guard patch for any riscv64 build attempting the psimd backend |
| [#221](https://github.com/Maratyszcza/NNPACK/issues/221) | "Unsupported hardware" error on supported CPU | Open | High | Architecture/runtime-detection bug, not riscv64-specific |
| [#219](https://github.com/Maratyszcza/NNPACK/issues/219) | FP16 python module error at make | Open | Medium | Build bug |
| [#218](https://github.com/Maratyszcza/NNPACK/issues/218) | SIGFPE crash with `nosmt` kernel parameter (division by zero in `convolution-inference.c:526`) | Open | High (x86_64-specific) | Correctness bug on AMD EPYC, unrelated to RISC-V |
| [#216](https://github.com/Maratyszcza/NNPACK/issues/216) | "Unsupported hardware" error | Open | High | Architecture detection |
| [#195](https://github.com/Maratyszcza/NNPACK/issues/195) | AltiVec/PowerPC acceleration support request | Open | Low | Unrelated architecture request, shows the same "add a new ISA" pattern RISC-V would need |
| [#156](https://github.com/Maratyszcza/NNPACK/issues/156) | Cache/blocking sizes hardcoded for non-x86 targets | Open since 2018, no response | Medium, affects any future non-x86 port including a hypothetical riscv64 one | Relevant context: non-x86 architectures rely on hardcoded cache/blocking sizes rather than dynamic cpuinfo-based detection |
| #71 | aarch64 support | Closed | N/A (resolved) | The only precedent for extending the CMake processor allow-list to a new 64-bit architecture |
| #114 | Build fails on ppc64le | Closed | N/A (resolved) | Same `FATAL_ERROR` failure mode riscv64 hits today; fixed there with a one-line patch, no equivalent ever filed for riscv64 |

No issue, pull request, or commit referencing RISC-V or riscv64 exists anywhere in this repository's history. There is consequently no riscv64-specific correctness bug to report, because no riscv64 build or test has ever been attempted upstream.

## 12. Objections and Upstream Blockers

**Stated objections.** None exist specific to RISC-V. The project has no active maintainer to raise or respond to any objection, RISC-V or otherwise.

**Technical blockers:**

1. `CMakeLists.txt`'s processor allow-list issues `FATAL_ERROR` for riscv64, aborting configure before any build step.
2. Open issue #222 breaks the `psimd` backend build (missing header include path), the only backend riscv64 could ever reach.
3. `psimd`, the fallback SIMD layer, is dormant (last commit 2020-05-17) and provides no path to RVV acceleration.
4. cpuinfo's riscv64 ISA/vendor/cache detection is incomplete (PR #397 open, stalled), though this is moot given item 1.
5. Issue #156 (hardcoded cache/blocking sizes for non-x86 targets) would affect any hypothetical riscv64 port exactly as it affects existing non-x86 ports.
6. The project has had zero commits since 2023-02-01; a community typo-fix PR (#223, opened July 2025, per prior reporting) received no maintainer response, indicating near-zero probability that any new patch, RISC-V-related or not, would be reviewed or merged.

**Organizational blockers.** No corporate sponsor maintains NNPACK. RISE has no involvement with the project. Marat Dukhan, the sole historical maintainer, has moved on to XNNPACK at Google. There is no realistic path to getting a riscv64 patch reviewed or merged upstream.

**Acceptance probability.** Effectively zero. The repository is dormant, not merely slow-moving, and its functional successor (XNNPACK) already has the RISC-V capability that an NNPACK port would attempt to recreate.

## 13. Readiness Assessment

- **Color:** red (confirmed-broken-build-block)
- **Release provider:** none
- **Optimization level:** absent. There are zero RISC-V-specific operations of any kind implemented (no FFT, Winograd, GEMM, pooling, or activation kernels for riscv64), and no ISA extension (RVV or otherwise) is referenced anywhere in the codebase. Closing the gap would require, at minimum, implementing a complete new `src/riscv/` backend covering the same functional surface as the existing 37-file x86_64-fma or 20-file neon backends, targeting the ratified RVV 1.0 extension.
- **Justification:** NNPACK's own `CMakeLists.txt` enforces a hard processor allow-list (`^(i686|x86_64|armv5te|armv7-a|armv7l|armv7|armv7s|aarch64|arm64|arm64e)$`) and issues `MESSAGE(FATAL_ERROR "Unrecognized NNPACK_TARGET_PROCESSOR = ...")` for anything else, so a riscv64 configure deterministically aborts before any build step runs. This is positive, reproducible evidence of a broken/non-functional riscv64 build, not merely the absence of CI (see [CMakeLists.txt](https://github.com/Maratyszcza/NNPACK/blob/master/CMakeLists.txt), zero `.github/workflows`, and the only CI file, `.travis.yml`, building just `BACKEND=psimd`/`scalar` on x86-64). There is also zero RISC-V-specific code anywhere in the repository (no `arch/riscv/`, no RVV intrinsics, no `#ifdef __riscv`), zero riscv64 issues/PRs/commits in the project's history, no GitHub releases of any kind, and no distro package for NNPACK itself on Ubuntu 26.04 resolute, Debian, or Arch RISC-V (only the unrelated XNNPACK project matches by substring search). The project has been dormant since February 2023 with no RISE involvement.
- **Pending work that could change the grade:** No open riscv64 issue or PR exists upstream; the only analogous precedent, aarch64 support via issue #71, is closed with no riscv64 equivalent ever filed. The only known attempt at RISC-V support is the unofficial, non-upstreamed academic fork `antfor/Masters-NNPACK`, which patches the CMake allow-list and adds a riscv-v backend using a non-public, pre-standard EPI LLVM/Clang toolchain, not usable as a general build path and never submitted upstream. Among dependencies, there is unrelated, unmerged riscv64 work in flight (`pytorch/cpuinfo` PR #397 adding ISA/cache detection; `Maratyszcza/FP16` PR #45 adding riscv64 QEMU CI), but neither touches NNPACK's own hard configure-time block. NNPACK's successor project, XNNPACK (same original author, now Google-maintained), already has active RVV work and Ubuntu riscv64 packaging, making a dedicated NNPACK riscv64 port unlikely ever to be pursued.

## 14. Investment Analysis

RISE has not funded, and has no documented plans to fund, any work on NNPACK. All RISE-adjacent RISC-V ML-kernel work found during research (SALTyRN's NEON-to-RVV translation work, the PyTorch-on-riscv64 RVV kernel effort) targets XNNPACK and PyTorch/cpuinfo, not NNPACK, so none of the sizing below double-counts funded work.

NNPACK is a dormant legacy project with no viable upstream path to riscv64 support, and its functional successor, XNNPACK, already supports riscv64 in distro packaging and has active RVV kernel development funded in part through RISE-documented work. Any investment in NNPACK specifically would be spent on a project with no path to acceptance rather than its actively maintained replacement. The sizing below covers only what would be required if a specific, non-migratable NNPACK deployment existed.

### 14.1 Functional Enablement

- Patch `CMakeLists.txt` to remove the `FATAL_ERROR` on unrecognized processors (one line).
- Fix issue #222 (broken psimd header include path) so the psimd fallback backend actually compiles.
- Validate that pthreadpool, FP16, FXdiv, and psimd all build correctly for riscv64 in combination (each is individually portable, but the combination has never been tested).
- Verify library initialization and all compute functions produce correct results under QEMU riscv64 emulation; no init-time riscv64 code path currently exists.

### 14.2 Performance Optimization

- Write a new `src/riscv/` backend with RVV micro-kernels for FFT convolution, Winograd convolution, GEMM/GEMV, and pooling, comparable in scope to the existing 37-file x86_64-fma or 20-file neon backends.
- Add riscv64 ISA-extension detection (dependent on cpuinfo PR #397 landing) to drive runtime backend selection.
- This work duplicates effort already under way in XNNPACK (SALTyRN RVV kernel translation, XNNPACK PR #9996) and is not recommended as a standalone investment.

### 14.3 CI/CD Infrastructure

- Add a GitHub Actions workflow running the smoketest suite under QEMU riscv64 (no `.github/workflows` directory exists at all today; Travis CI is the only, now largely obsolete, CI system in use).
- This is contingent on the functional-enablement work landing first.

### 14.4 Ecosystem Enablement

Not applicable; see Section 10 note below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | CMakeLists.txt processor allow-list patch | 0.1 | Any | Critical (prerequisite) |
| Functional | Fix issue #222 psimd include path | 0.2 | Any | Critical (prerequisite) |
| Functional | Validate combined dependency build and runtime init on riscv64 under QEMU | 1.0 | Any | Critical |
| CI/CD | Add GitHub Actions riscv64 QEMU workflow | 0.5 | Any | High |
| Performance | Write src/riscv/ RVV backend (FFT, Winograd, GEMM, pooling) | 12-16 | RISC-V SIMD specialist | Low, invest in XNNPACK instead |
| Performance | Land/validate cpuinfo PR #397 (riscv64 ISA/cache detection) | 1 | cpuinfo maintainer, external to NNPACK | Medium |

**Recommendation.** Do not invest in NNPACK for riscv64. The functional-enablement work (roughly 1.3 person-weeks) would produce only a non-accelerated build on a dormant project with no realistic upstream acceptance path (last commit 2023-02-01, no maintainer response pattern). The performance-optimization work (12-16 person-weeks) would duplicate RVV kernel work already in progress and partially upstreamed in XNNPACK. Direct any RISC-V neural-network inference investment to XNNPACK, which has active RVV infrastructure, active maintainership, Ubuntu riscv64 packaging (`libxnnpack-dev`), and documented RISE-adjacent RVV kernel development (SALTyRN, XNNPACK PR #9996).

## 15. References

- [Maratyszcza/NNPACK repository](https://github.com/Maratyszcza/NNPACK)
- [NNPACK CMakeLists.txt (processor allow-list)](https://github.com/Maratyszcza/NNPACK/blob/master/CMakeLists.txt)
- [NNPACK .travis.yml](https://github.com/Maratyszcza/NNPACK/blob/master/.travis.yml)
- [NNPACK issues search for "riscv"](https://github.com/Maratyszcza/NNPACK/issues?q=riscv)
- [NNPACK pull requests search for "riscv"](https://github.com/Maratyszcza/NNPACK/pulls?q=riscv)
- [Issue #71, aarch64 support (closed)](https://github.com/Maratyszcza/NNPACK/issues/71)
- [Issue #35, build for Linux/ARMv7 (closed)](https://github.com/Maratyszcza/NNPACK/issues/35)
- [Issue #114, build fails on ppc64le (closed)](https://github.com/Maratyszcza/NNPACK/issues/114)
- [Issue #156, hardcoded cache sizes for non-x86 targets](https://github.com/Maratyszcza/NNPACK/issues/156)
- [Issue #195, AltiVec/PowerPC acceleration request](https://github.com/Maratyszcza/NNPACK/issues/195)
- [Issue #218, SIGFPE with nosmt kernel parameter](https://github.com/Maratyszcza/NNPACK/issues/218)
- [Issue #219, FP16 python module error at make](https://github.com/Maratyszcza/NNPACK/issues/219)
- [Issue #221, unsupported hardware on supported CPU](https://github.com/Maratyszcza/NNPACK/issues/221)
- [Issue #222, broken psimd include path](https://github.com/Maratyszcza/NNPACK/issues/222)
- [antfor/Masters-NNPACK, unofficial RISC-V V fork](https://github.com/antfor/Masters-NNPACK)
- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [pytorch/cpuinfo issue #124, riscv64 tracking issue](https://github.com/pytorch/cpuinfo/issues/124)
- [pytorch/cpuinfo PR #397, riscv64 full ISA/cache detection](https://github.com/pytorch/cpuinfo/pull/397)
- [Maratyszcza/pthreadpool (now google/pthreadpool)](https://github.com/google/pthreadpool)
- [Maratyszcza/psimd](https://github.com/Maratyszcza/psimd)
- [Maratyszcza/FP16](https://github.com/Maratyszcza/FP16)
- [Maratyszcza/FP16 PR #45, riscv64 QEMU CI](https://github.com/Maratyszcza/FP16/pull/45)
- [Maratyszcza/FXdiv](https://github.com/Maratyszcza/FXdiv)
- [google/googletest issue #3756, riscv64 flaky test](https://github.com/google/googletest/issues/3756)
- [google/XNNPACK, NNPACK's functional successor with active riscv64/RVV support](https://github.com/google/XNNPACK)
- [NNPACK on PyPI (unrelated legacy package)](https://pypi.org/project/nnpack/)
- [Ubuntu package search, resolute, "NNPACK" (XNNPACK-only matches)](https://packages.ubuntu.com/search?keywords=NNPACK&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search, "nnpack" (no match)](https://archriscv.felixc.at/?q=nnpack)
- [RISE Project](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE blog, SALTyRN: Neon-to-RVV kernel translation with LLMs](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [RISE blog, PyTorch is available on riscv64](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)