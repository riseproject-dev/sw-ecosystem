---
title: NNPACK
categories:
  - ai-ml
---

# NNPACK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for NNPACK
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

NNPACK ([github.com/Maratyszcza/NNPACK](https://github.com/Maratyszcza/NNPACK)) is an accelerated neural network inference library built around hand-tuned SIMD micro-kernels for convolution (FFT-based and Winograd), GEMM/GEMV, pooling, and activation functions. Its primary contribution was demonstrating that FFT-based convolution with batching could outperform direct convolution on x86 and ARM hardware in 2015-2016. It is written in C99/C++11 with architecture-specific backends generated via PeachPy (x86-64) or implemented as NEON C intrinsics (ARM/ARM64).

**Governance.** There is no formal governance structure. No MAINTAINERS, OWNERS, or CODEOWNERS file exists. The repository is a solo research project by Marat Dukhan (GitHub: Maratyszcza), created during his PhD at Georgia Institute of Technology (HPC Garage lab). There is no foundation affiliation, no steering committee, and no TSC. Decisions are made unilaterally by the owner. The project is not a member of the RISE Project, the Linux Foundation, or any other foundation.

**Corporate sponsors.** Marat Dukhan (Georgia Tech / Facebook AI Research) is the sole dominant contributor with 245 of approximately 260 total commits. Facebook AI Research provided production use and guidance (Nicolas Vasilache, Soumith Chintala, Andrew Tulloch); Andrew Tulloch contributed 1 commit. The US National Science Foundation funded the original work via Award Number 1339745. There is no formal corporate maintainer role.

**Status.** The project is effectively unmaintained. The last meaningful commit by Marat Dukhan was April 2020. A community typo-fix PR (#223) was opened July 2025 and has received no maintainer response. Issue creation is restricted. There are 44 open issues, 4 open PRs, and no GitHub releases have ever been published. Marat Dukhan moved active development to XNNPACK at Google, which is the designated successor and is actively maintained.

**Community stance on new architecture ports.** The README states that MIPS and MIPS64 are "not supported, and we have no plans to add it" while noting a "pull request would be welcome, though." No RISC-V pull request has been filed. With the project in maintenance-only mode and no active maintainer responding to any issues or PRs, the de facto stance is that new ports are not being pursued.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2015 | Initial release, x86-64 (AVX2) and ARM (NEON) only | [GitHub repo](https://github.com/Maratyszcza/NNPACK) |
| 2016-2017 | ARM64 (AArch64 NEON) support added | [GitHub repo](https://github.com/Maratyszcza/NNPACK) |
| 2020 (approx.) | Last meaningful commit by Marat Dukhan | [GitHub repo](https://github.com/Maratyszcza/NNPACK) |
| 2024-05-27 | psimd dependency archived read-only | [github.com/Maratyszcza/psimd](https://github.com/Maratyszcza/psimd) |
| 2025-07 | Community PR #223 (typo fix) opened; no maintainer response | [github.com/Maratyszcza/NNPACK/pull/223](https://github.com/Maratyszcza/NNPACK/pull/223) |
| 2026-06 | Zero RISC-V issues, PRs, or commits in repository | [GitHub issues/PR search](https://github.com/Maratyszcza/NNPACK/issues?q=riscv) |

No RISC-V port has been attempted at any point. There is no first RISC-V commit, no tracking issue, no contributor working on it.

---

## 3. Upstream Support Tier

NNPACK has no formal tier policy. The recognized processor list in `CMakeLists.txt` implicitly defines the support tiers:

- **Tier 1 (fully supported):** x86-64 (AVX2/FMA3), ARM (NEON), ARM64 (AArch64 NEON)
- **Tier 2 (portable fallback):** Any processor that CMake does not recognize triggers either psimd or scalar backend via `configure.py`, but the CMakeLists.txt processor guard issues a fatal error for unrecognized processors (see Section 5).
- **riscv64:** Not a recognized processor. Build aborts at configure time without patching.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Hand-tuned backend | Yes (PeachPy/AVX2) | Yes (NEON C + .S asm) | None |
| Runtime CPU detection | Yes (cpuinfo, AVX2/FMA3) | Yes (cpuinfo, NEON/FP16) | None |
| CI coverage | Yes (.travis.yml, scalar+psimd) | No | No |
| Official binary packages | None (no releases) | None (no releases) | None |
| CMake recognizes processor | Yes | Yes | No -- fatal error |
| Maintainer acknowledgment | Yes | Yes | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

NNPACK's architecture-specific code is organized into backend directories under `src/`:

| Directory | Architecture | Implementation type | File count |
|-----------|-------------|--------------------|-----------:|
| `src/x86_64-fma/` | x86-64 | Hand-tuned PeachPy assembly + AVX2/FMA3 intrinsics | 37 |
| `src/neon/` | ARM 32/64-bit | C intrinsics + 3 hand-written AArch32 `.S` files; runtime FP16/FMA detection | 20 |
| `src/psimd/` | Generic portable fallback | Portable SIMD via psimd header library | 30 |
| `src/scalar/` | Emscripten only | Pure C scalar | 25 |
| `src/ref/` | Reference | Pure C reference implementations | varies |
| **riscv64** | **Not present** | **None** | **0** |

**Per-component RISC-V status:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| FFT convolution (8x8, 16x16) | Full (PeachPy asm) | Full (NEON C) | Missing |
| Winograd convolution (8x8-3x3) | Full (PeachPy asm) | Full (NEON C) | Missing |
| GEMM / GEMV (BLAS) | Full (PeachPy asm) | Full (NEON C + .S asm) | Missing |
| ReLU / softmax / pooling | Full (AVX2 C) | Full (NEON C) | Missing |
| Runtime CPU feature detection | Full (cpuinfo, AVX2/FMA3) | Full (cpuinfo, NEON/FP16) | Missing |
| RVV (RISC-V Vector) kernels | N/A | N/A | Missing |

The `#ifdef __riscv` preprocessor guard appears zero times in the repository. No `NNP_BACKEND_RISCV` macro is defined. No `.S` assembly file, no RVV intrinsic (`vfloat32m1_t`, `vle32_v`, `vle32_v`, etc.), no Zba/Zbb/Zbc extension reference, and no `arch/riscv/` directory exist anywhere in the tree.

If the CMakeLists.txt processor guard is patched (see Section 5), NNPACK on riscv64 would fall through to the `psimd` backend: a generic 128-bit portable SIMD abstraction with no hardware vector acceleration. Performance on riscv64 would be equivalent to running on any unoptimized scalar-class platform. The psimd dependency was archived read-only on 2024-05-27, so no RVV acceleration will ever land in that path.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** CMake (minimum 2.8.12) plus Ninja, with architecture backends selected via `configure.py` and `CMakeLists.txt`. C99 and C++11 are required.

**Critical blocker.** `CMakeLists.txt` at line 60 contains a hard `FATAL_ERROR` for any processor not in its recognized list:

```cmake
ELSEIF(NOT NNPACK_TARGET_PROCESSOR MATCHES
  "^(i686|x86_64|armv5te|armv7-a|armv7l|armv7|armv7s|aarch64|arm64|arm64e)$")
  MESSAGE(FATAL_ERROR
    "Unrecognized NNPACK_TARGET_PROCESSOR = ${NNPACK_TARGET_PROCESSOR}")
```

A native or cross-compiled build targeting riscv64 aborts at CMake configure time:

```
CMake Error: Unrecognized NNPACK_TARGET_PROCESSOR = riscv64
```

**Required patch.** Change `FATAL_ERROR` to `WARNING` to allow the build to proceed to the psimd/scalar backend. No workaround exists without patching the CMakeLists.txt.

**Cross-compilation command after patching:**

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

**Required -D flags:**

| Flag | Value | Reason |
|------|-------|--------|
| `NNPACK_BACKEND` | `scalar` or `psimd` | `auto` hits FATAL_ERROR; x86-64 and neon backends are not viable |
| `NNPACK_BUILD_TESTS` | `OFF` | Tests depend on cpuinfo and pthreadpool with their own riscv64 status |
| `CMAKE_SYSTEM_NAME` | `Linux` | The check for `^(Darwin|Linux|Android)$` must pass |
| CMakeLists.txt patch | Required | FATAL_ERROR is hardcoded; no cmake override bypasses it |

**Optional flags:** `-DNNPACK_INFERENCE_ONLY=ON` reduces the source set by approximately half (removes training/backward pass code). `-DNNPACK_CONVOLUTION_ONLY=ON` further narrows scope. `-DNNPACK_CUSTOM_THREADPOOL=ON` allows supplying an external thread pool.

**Toolchain requirements.** No explicit GCC/Clang minimum is documented. C99 and C++11 are the language standards. Any current distribution-packaged `riscv64-linux-gnu-gcc` (GCC 10+) is sufficient.

**QEMU.** Not documented in the repository. Standard usage: `QEMU_LD_PREFIX=/usr/riscv64-linux-gnu qemu-riscv64-static ./test/nnpack-tests`. No QEMU-specific CI configuration exists.

**Dockerfiles.** None in the repository.

**cmake/ directory contents.** Only dependency download scripts: DownloadCpuinfo, DownloadFP16, DownloadFXdiv, DownloadPSimd, DownloadPThreadPool, DownloadPeachPy, DownloadGoogleTest, DownloadOpcodes, DownloadEnum, DownloadSix. No riscv64 toolchain file.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| FFT convolution | Full | Full | Not available (build fails without patch) |
| Winograd convolution | Full | Full | Not available |
| GEMM/GEMV | Full | Full | Not available |
| Pooling / activation | Full | Full | Not available |
| Runtime CPU detection | Full | Full | Not available |
| RVV acceleration | N/A | N/A | Not available |
| `nnp_initialize()` return | `nnp_status_success` | `nnp_status_success` | Would return `nnp_status_unsupported_hardware` on riscv64 even after patching, because `src/init.c` contains no RISC-V cpuinfo check |
| Build without patching | Yes | Yes | No -- CMake FATAL_ERROR |

**Functional gap.** NNPACK cannot be used on riscv64 at all without patching the build system. Even after patching, `nnp_initialize()` returns `nnp_status_unsupported_hardware` because `src/init.c` has no code path for a RISC-V processor. All library functions return error codes without executing.

**Performance gap.** Even if the initialization gap were closed, the psimd fallback provides generic 128-bit portable SIMD with no RVV acceleration. No benchmark data for NNPACK on riscv64 exists anywhere. The TVM build report [NEEDS VERIFICATION - single source] for the SpacemiT K1 (RV64GCVB) from apache/tvm#17508 (November 2024) noted "libraries like MKL and NNPACK disabled" -- NNPACK was excluded entirely rather than benchmarked.

**Security hardening gaps.** Data not available: no security hardening flags (stack protector, CFI, shadow call stack) are documented or referenced anywhere in the repository for any architecture.

**Floating-point semantics.** Data not available: no documentation or tests address NaN propagation or floating-point consistency across architectures.

---

## 7. CI/CD Infrastructure

The only CI configuration in the repository is `.travis.yml` at the repository root. Its full content:

```yaml
language: c
compiler: clang
install:
  - git clone https://github.com/ninja-build/ninja.git /tmp/ninja
  - cd /tmp/ninja && git checkout release && python configure.py --bootstrap
  - mkdir -p $HOME/.local/bin && install -m 755 /tmp/ninja/ninja $HOME/.local/bin/ninja
  - export PATH=$HOME/.local/bin:$PATH
  - pip install --user git+https://github.com/Maratyszcza/PeachPy
  - pip install --user git+https://github.com/Maratyszcza/confu
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

No `.github/workflows/` directory exists (GitHub API returns HTTP 404 for the path). No GitLab CI, Jenkinsfile, or Cirrus CI configuration exists. Travis CI targets x86-64 (the Travis CI host) only. The Travis CI badge in the README points to a service that is functionally defunct for open-source projects.

| CI dimension | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| CI system exists | Yes (Travis CI) | No | No |
| Backend tested | psimd, scalar | None | None |
| Hardware tested | x86-64 (Travis host) | None | None |
| QEMU testing | No | No | No |
| RISE runners | No | No | No |
| Release-blocking CI | No | No | No |

---

## 8. Distribution and Release Status

| Channel | riscv64 available? | Notes |
|---------|-------------------|-------|
| GitHub Releases | No -- no releases at all | GitHub API returns empty array |
| PyPI | No | Only `nnpack-0.1.0-py2-none-any.whl` and `.tar.gz` from 2017-03-07; no native binary, pure-Python stub |
| RISE wheel builder | No | Proxies to PyPI; no separate packages |
| Ubuntu 24.04 (Noble) | No | NNPACK not packaged; XNNPACK is packaged as `libxnnpack0`/`libxnnpack-dev` for riscv64 |
| Debian | No | Accepted into experimental (source + amd64 only); flagged "not part of any Debian distribution"; no riscv64 build record |
| Arch Linux RISC-V | No | Package not present in [archriscv.felixc.at](https://archriscv.felixc.at/?q=nnpack) |

**What a user must do to get a working binary on riscv64.** There is no path. NNPACK cannot be built for riscv64 without (a) patching `CMakeLists.txt` to remove the FATAL_ERROR on unrecognized processors, and (b) patching `src/init.c` to add a RISC-V cpuinfo code path so that `nnp_initialize()` does not return `nnp_status_unsupported_hardware`. Even after both patches, the library would use the psimd fallback with no hardware acceleration. The practical answer for riscv64 neural network acceleration is [XNNPACK](https://github.com/google/XNNPACK), which is packaged as `libxnnpack0` in Ubuntu 24.04 for riscv64.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|-----------|------|--------------|-------------|-----------------|-------|
| [cpuinfo](https://github.com/pytorch/cpuinfo) | CPU feature detection | Partial | No (except QEMU CI merged via PR #219) | No | PR #397 (open, June 2026) adds full ISA + cache detection; unreviewed |
| [pthreadpool](https://github.com/Maratyszcza/pthreadpool) | Thread pool | Likely (pure POSIX) | No riscv64 CI | N/A (header+source) | Zero riscv64 issues; untested |
| [FP16](https://github.com/Maratyszcza/FP16) | Half-precision conversion | Yes (scalar fallback) | PR #45 open (June 19, 2026): riscv64 QEMU CI, 7/7 passing, not yet merged | N/A (header-only) | No RVV acceleration |
| [FXdiv](https://github.com/Maratyszcza/FXdiv) | Fixed-point integer division | Likely (arithmetic only) | No riscv64 CI | N/A (header-only) | Recognized arch list excludes riscv64 but no SIMD involved |
| [psimd](https://github.com/Maratyszcza/psimd) | Portable SIMD fallback | Unknown | No riscv64 CI | Archived 2024-05-27 | NNPACK's riscv64 fallback path; archived means no RVV support ever |
| [PeachPy](https://github.com/Maratyszcza/PeachPy) | x86-64 assembly code generator | N/A | N/A | N/A | Invoked only for x86-64 target; not involved on riscv64 |
| [googletest](https://github.com/google/googletest) | Unit testing (build-time only) | Full | Tested upstream | Released for riscv64 | No blocker |

### Dependency Deep-Dives

**cpuinfo.** cpuinfo is the most significant dependency for RISC-V enablement. The version bundled with NNPACK is a fork tracking `pytorch/cpuinfo`. A basic struct compiles for riscv64 (PR #190 merged), and QEMU CI was added (PR #219 merged). PR #397 (open, June 2026) adds full ISA extension detection (Zba, Zbb, Zbc, Zbs, V, Zvfh, etc.), vendor/uarch identification, and cache topology detection, but it is unreviewed and awaiting hardware validation on real silicon. Critically, NNPACK's own `CMakeLists.txt` does not include riscv64 in its recognized processor list, so cpuinfo results would not be used even if the detection worked correctly.

**psimd.** psimd is the portable SIMD library that serves as NNPACK's fallback backend for all non-x86/non-ARM targets. It was archived read-only on 2024-05-27. This means the only fallback path for riscv64 is permanently frozen at the portable 128-bit SIMD level with no possibility of RVV acceleration being added. The `psimd` path does compile on any POSIX system [NEEDS VERIFICATION - the archive and lack of CI means this has not been tested on riscv64 in any documented context].

**FP16.** The FP16 library's scalar fallback path functions correctly on riscv64 under QEMU according to PR #45 (7/7 tests passing), but this PR was opened June 19, 2026 and is not yet merged. No native RVV fp16 acceleration exists.

**pthreadpool.** pthreadpool is a pure POSIX threading library with no architecture-specific code. It should compile and function correctly on riscv64 but has no documented test coverage for that architecture.

---

## 11. Known Bugs and Active Issues

The repository has 44 open issues. None reference RISC-V. The full open issue list relevant to correctness and builds:

| Issue | Title | Category | Severity |
|-------|-------|----------|----------|
| [#222](https://github.com/Maratyszcza/NNPACK/issues/222) | Build fails: missing fp16/psimd.h when compiling psimd/blas/shdotxf.c | Build bug | High -- blocks psimd backend |
| [#221](https://github.com/Maratyszcza/NNPACK/issues/221) | "Unsupported hardware on supported CPU" | Architecture detection | High |
| [#219](https://github.com/Maratyszcza/NNPACK/issues/219) | FP16 python module error at make | Build bug | Medium |
| [#218](https://github.com/Maratyszcza/NNPACK/issues/218) | SIGFPE with nosmt kernel parameter | Correctness bug (x86) | High (x86-specific) |
| [#216](https://github.com/Maratyszcza/NNPACK/issues/216) | "Unsupported hardware" error | Architecture detection | High |
| [#212](https://github.com/Maratyszcza/NNPACK/issues/212) | Unsupported hardware on MacBook Pro 15 (late 2012) | Architecture detection | Medium |
| [#211](https://github.com/Maratyszcza/NNPACK/issues/211) | Use CPack for packaging | Enhancement | Low |
| [#209](https://github.com/Maratyszcza/NNPACK/issues/209) | Section address out of range for architecture x86_64 | Build/arch bug | Medium |
| [#207](https://github.com/Maratyszcza/NNPACK/issues/207) | Unsupported Hardware on VM with compatible CPU | Architecture detection | High |
| [#203](https://github.com/Maratyszcza/NNPACK/issues/203) | ModuleNotFoundError: No module named 'peachpy.x86_64.avx' | Build bug | Medium |
| [#202](https://github.com/Maratyszcza/NNPACK/issues/202) | Build failed: cos_npi_over_8 not available in common | Build bug | Medium |
| [#156](https://github.com/Maratyszcza/NNPACK/issues/156) | Cache/blocking sizes hardcoded for non-x86 targets | Performance bug | Medium -- affects ARM and any future port |

**Issue #222** directly blocks the psimd backend that riscv64 would rely on: the psimd header include path is broken in the build. This would need to be fixed in addition to the CMakeLists.txt processor guard patch for a riscv64 build using the psimd backend to succeed.

**Issue #156** (opened October 2018, no response) is relevant context: non-x86 architectures use hardcoded cache and blocking sizes rather than dynamic cpuinfo-based detection. Any riscv64 port would face the same problem, since cpuinfo does not yet have stable riscv64 cache topology detection.

**Correctness bugs specific to riscv64:** None filed, because no riscv64 work has been attempted.

---

## 12. Objections and Upstream Blockers

**Stated objections.** None explicitly for RISC-V. The project has no active maintainer to raise or resolve objections.

**Technical blockers:**

1. `CMakeLists.txt` FATAL_ERROR on unrecognized processors. Requires a one-line patch to proceed.
2. `src/init.c` has no RISC-V code path. `nnp_initialize()` returns `nnp_status_unsupported_hardware` without patching.
3. psimd (the fallback backend) is archived. No future RVV support can be added to it. A riscv64 port with hardware acceleration would require writing a new `src/rvv/` backend from scratch.
4. cpuinfo riscv64 detection is incomplete (PR #397 open, unreviewed, no hardware validation).
5. Issue #222 breaks the psimd backend build.
6. The project has no active maintainer. Any patches submitted have a realistic acceptance probability near zero given the 4 open PRs (from 2021 to 2025) with no maintainer response.

**Organizational blockers.** No corporate sponsor is maintaining NNPACK. RISE Project has no involvement. Marat Dukhan (the sole maintainer) is at Google working on XNNPACK. There is no path to getting patches reviewed or merged absent forking the project.

**Acceptance probability.** Effectively zero for upstream acceptance. The project is in read-only maintenance mode.

---

## 13. Investment Analysis

NNPACK is a legacy project with no viable path to riscv64 support upstream. Its successor, XNNPACK, already supports riscv64 in Ubuntu 24.04 and has active RVV kernel development. Any investment in NNPACK for RISC-V would be spent on a dead-end rather than the active replacement. The analysis below covers what would be required if there were a business reason to use NNPACK specifically (e.g., an existing deployment that cannot be migrated to XNNPACK).

RISE has not funded any work on NNPACK and has no known plans to do so.

### 13.1 Functional Enablement

To reach a functional (non-accelerated) riscv64 build:

- Patch `CMakeLists.txt` to remove the FATAL_ERROR on unrecognized processors (1 line).
- Patch `src/init.c` to add a RISC-V cpuinfo code path and set psimd function pointers.
- Fix issue #222 (broken psimd include path) so the psimd backend compiles.
- Validate that pthreadpool, FP16, FXdiv, and psimd all compile for riscv64 (mostly trivial given their portable nature).
- Verify `nnp_initialize()` succeeds and all compute functions return correct results under QEMU.

### 13.2 Performance Optimization

To add RVV (RISC-V Vector) acceleration:

- Write a new `src/rvv/` backend directory with RVV micro-kernels for the critical paths: FFT convolution, Winograd convolution, GEMM/GEMV, pooling.
- This mirrors the existing 37-file `src/x86_64-fma/` or 20-file `src/neon/` backends in scope.
- Add riscv64 cpuinfo detection to `src/init.c` to select RVV paths at runtime based on the V extension.
- This work is only meaningful if done on XNNPACK instead -- which already has RVV infrastructure in place.

### 13.3 CI/CD Infrastructure

- Add a `.github/workflows/riscv64.yml` using QEMU (riscv64) to run the smoketest suite.
- This requires the functional enablement work first.
- Travis CI is defunct for open-source; GitHub Actions would be the replacement.

### 13.4 Ecosystem Enablement

NNPACK has no significant dependent package ecosystem requiring separate enablement (it is a C library consumed directly by a small number of frameworks, primarily PyTorch as a legacy fallback path). Section 10 is omitted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | CMakeLists.txt processor guard patch | 0.1 | Any | Critical (prerequisite) |
| Functional | src/init.c RISC-V cpuinfo code path | 0.5 | Any | Critical (prerequisite) |
| Functional | Fix issue #222 psimd include path | 0.2 | Any | Critical (prerequisite) |
| Functional | Validate psimd/scalar backend on riscv64 under QEMU | 0.5 | Any | Critical |
| CI/CD | Add .github/workflows/riscv64.yml (QEMU) | 0.5 | Any | High |
| Performance | Write src/rvv/ backend (FFT, Winograd, GEMM, pooling) | 12-16 | RISC-V SIMD specialist | Low -- invest in XNNPACK instead |
| Performance | cpuinfo riscv64 cache detection (review PR #397) | 1 | cpuinfo maintainer | Medium |

**Recommendation.** Do not invest in NNPACK riscv64. The functional enablement work (approximately 1.3 person-weeks) produces a non-accelerated library on a dead project with no upstream acceptance path. The performance optimization work (12-16 person-weeks) duplicates effort that has already been done in XNNPACK. Direct any RISC-V neural network inference acceleration investment to XNNPACK, which has existing RVV infrastructure, active maintainership (Google), Ubuntu 24.04 packaging as `libxnnpack0`, and an active riscv64 CI.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Maratyszcza/NNPACK repository](https://github.com/Maratyszcza/NNPACK)
- [NNPACK issues search for "riscv"](https://github.com/Maratyszcza/NNPACK/issues?q=riscv)
- [NNPACK PRs search for "riscv"](https://github.com/Maratyszcza/NNPACK/pulls?q=riscv)
- [NNPACK .travis.yml](https://github.com/Maratyszcza/NNPACK/blob/master/.travis.yml)
- [NNPACK on PyPI](https://pypi.org/project/nnpack/)
- [NNPACK on Debian tracker](https://tracker.debian.org/pkg/nnpack)
- [NNPACK on Arch Linux RISC-V](https://archriscv.felixc.at/?q=nnpack)
- [Ubuntu 24.04 libxnnpack0 (XNNPACK successor)](https://packages.ubuntu.com/noble/libxnnpack0)
- [Maratyszcza/psimd (archived 2024-05-27)](https://github.com/Maratyszcza/psimd)
- [pytorch/cpuinfo PR #397 -- riscv64 full ISA + cache detection](https://github.com/pytorch/cpuinfo/pull/397)
- [Maratyszcza/FP16 PR #45 -- riscv64 QEMU CI](https://github.com/Maratyszcza/FP16/pull/45)
- [google/XNNPACK -- NNPACK successor with riscv64 support](https://github.com/google/XNNPACK)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [apache/tvm#17508 -- SpacemiT K1 build with NNPACK disabled](https://github.com/apache/tvm/issues/17508)
- [NNPACK issue #222 -- broken psimd include path](https://github.com/Maratyszcza/NNPACK/issues/222)
- [NNPACK issue #218 -- SIGFPE with nosmt kernel parameter](https://github.com/Maratyszcza/NNPACK/issues/218)
- [NNPACK issue #156 -- hardcoded cache sizes for non-x86](https://github.com/Maratyszcza/NNPACK/issues/156)