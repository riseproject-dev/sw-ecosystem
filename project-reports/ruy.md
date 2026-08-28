---
title: ruy
parent: Project Reports
categories:
  - ai-ml
---

# ruy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for ruy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

ruy is a dense matrix multiplication library optimized for neural network inference, developed at Google and open-sourced under the `google/` GitHub organization. The library's primary design goal is high-throughput integer (Int8) and floating-point matrix-matrix multiply on ARM and x86 hardware, serving as the backend for TensorFlow Lite (now LiteRT) on mobile and edge devices.

The project carries the disclaimer "This is not an officially supported Google product." It has no foundation affiliation, no formal governance document, and is not a member of the RISE project. The license is Apache-2.0. Contributions require a Google CLA. Most commits appear externally as authored by "Ruy Contributors" via the copybara-github bot, which syncs from an internal Google repository.

**Corporate maintainers:**

- bjacob (Benoit Jacob) -- primary reviewer and author, now at AMD, formerly Google; handles the majority of substantive reviews.
- talumbau -- reviewer/approver, Google affiliation implied by the copybara pipeline.
- silvasean -- contributor, appears Google-affiliated.
- petrhosek -- contributor, cpuinfo dependency updates.
- oToToT -- added Android x86-64 support (November 2025), likely Google-affiliated based on copybara bot usage.

The project is ARM-centric and is primarily driven by Google's TFLite/LiteRT deployment needs on mobile silicon. New architecture ports require adding a platform detection macro in `platform.h` and contributing optimized kernel pack routines. There is no stated policy on accepting third-party architecture backends, and no community discussion of RISC-V porting has occurred.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| February 2021 | PR #227 (closed) contains a passing comment from contributor Tombana noting that single-rounding multiplier semantics had been validated on "Cortex-M and RiscV microcontrollers" in TFLite Micro context -- not a ruy platform port | [PR #227](https://github.com/google/ruy/pull/227) |
| June 2026 | No RISC-V port exists; no tracking issue, no PR, no commit, no architecture-specific source file | This report |

No RISC-V porting effort has ever been initiated for ruy. The single tangential mention in PR #227 refers to a TFLite Micro single-rounding validation on RISC-V microcontrollers, not to any ruy backend work. There are no first-riscv-commit date or author to report.

---

## 3. Upstream Support Tier

ruy has no formal tier or support-level policy document. ARM is the primary and highest-supported architecture, with dedicated NEON kernels for arm32 and arm64. x86/x86-64 has AVX2+FMA and AVX-512 paths. All other architectures, including RISC-V, use a generic scalar fallback path.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | None (org-level CodeQL only) | None | None |
| Optimized path | kAvx, kAvx2Fma, kAvx512 | kNeon, kNeonDotprod | None -- kStandardCpp only |
| Official binary from upstream | None (source-only) | None (source-only) | None (source-only) |
| Distro binary package | libruy-dev (Ubuntu, Debian) | libruy-dev (Ubuntu, Debian) | libruy-dev (Ubuntu noble, Debian sid) |
| Release-blocking status | Not applicable | Not applicable | Not applicable |

The upstream project publishes no binary releases for any architecture. There are no GitHub releases at all ([confirmed empty releases page](https://github.com/google/ruy/releases)). All distribution is source-only from upstream; binary packages come from Debian/Ubuntu maintainers.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

ruy's architecture-specific code is organized into three categories: platform detection macros (`platform.h`), execution path selection (`path.h`), and kernel plus pack files (`kernel_*.cc`, `pack_*.cc`).

**Platform detection (`platform.h`):**

Defines macros for: `RUY_PLATFORM_X86`, `RUY_PLATFORM_ARM_32`, `RUY_PLATFORM_ARM_64`, `RUY_PLATFORM_ARM`, `RUY_PLATFORM_NEON`, `RUY_PLATFORM_PPC`, `RUY_PLATFORM_APPLE`, `RUY_PLATFORM_FUCHSIA`, `RUY_PLATFORM_EMSCRIPTEN`. There is no `RUY_PLATFORM_RISCV` macro and no `__riscv` or `__riscv_xlen` detection anywhere in the file.

**Execution path selection (`path.h`):**

Defines a `Path` enum. Optimized values exist only for ARM (`kNeon`, `kNeonDotprod`) and x86 (`kAvx`, `kAvx2Fma`, `kAvx512`). For all unrecognized architectures, `kDefaultArchPaths = Path::kNone` and `kExtraArchPaths = Path::kNone`. On riscv64, only `kStandardCpp` executes.

**Kernel and pack files:**

| Architecture | Kernel files | Pack files | Total optimized files |
|---|---|---|---|
| ARM 32/64 | kernel_arm.h, kernel_arm32.cc, kernel_arm64.cc | pack_arm.cc, pack_arm.h | 5 |
| x86 (AVX/AVX2/AVX512) | kernel_x86.h, kernel_avx.cc, kernel_avx2_fma.cc, kernel_avx512.cc | pack_x86.h, pack_avx.cc, pack_avx2_fma.cc, pack_avx512.cc + 3 have_built_path probes | 11 |
| RISC-V | none | none | 0 |

**ARM SIMD quality:** Hand-tuned inline assembly for arm64 (`#if RUY_PLATFORM_NEON_64 && RUY_OPT(ASM)`), with multiple microarchitecture-tuned variants (A55-class in-order, A73/A75 out-of-order pipelines).

**x86 SIMD quality:** Intel intrinsics (AVX/AVX2+FMA/AVX-512) with runtime detection via `have_built_path_for_*` probe objects.

**RISC-V quality: missing.** No RVV (RISC-V Vector) kernel, no scalar intrinsics path, no C++ SIMD wrapper, no `.S` assembly file. On riscv64, `kernel_common.h` compiles only empty stub structs because all optimized parameter structs are gated behind `#if RUY_PLATFORM_NEON_64 || RUY_PLATFORM_NEON_32 || RUY_PLATFORM_X86`. The library runs entirely via the triple-loop C++ fallback.

There is no JIT compiler in ruy, no crypto subsystem, no compression, and no GC barriers. The only subsystem requiring architecture-specific code is the SIMD matrix multiply kernel.

---

## 5. Build System, Cross-Compilation, and Toolchain

ruy supports both CMake and Bazel. The CMakeLists.txt requires CMake >= 3.13 and C++14.

**Architecture conditionals in the build system:**

- `CMakeLists.txt`: architecture conditionals for `arm` and `x86_64`/`amd64` only. No `riscv64` branch.
- `BUILD` (Bazel): `select()` clauses for `armv7`, `x86_64`, `ppc`, `s390x`, `fuchsia`. No `riscv64` select clause.
- No cmake/riscv64.cmake, no cmake/toolchain-riscv64.cmake, no Dockerfiles, no QEMU scripts.

**Cross-compilation for riscv64:**

No ruy-provided toolchain files exist. A standard riscv64-linux-gnu cross-compiler is sufficient. Minimal CMake invocation:

```
cmake -DCMAKE_TOOLCHAIN_FILE=<riscv64-linux-gnu.cmake> \
      -DRUY_MINIMAL_BUILD=ON \
      -DRUY_FIND_CPUINFO=OFF \
      -DCPUINFO_BUILD_BENCHMARKS=OFF \
      -DCPUINFO_BUILD_UNIT_TESTS=OFF \
      -DCPUINFO_BUILD_MOCK_TESTS=OFF \
      -B build-riscv64 .
cmake --build build-riscv64
```

`RUY_MINIMAL_BUILD=ON` is required for cross-compilation to disable googletest download logic. `third_party/cpuinfo` submodule must be initialized before building (`git submodule update --init`).

**Toolchain version requirements:**

No explicit minimum is stated for riscv64. Any GCC or Clang supporting C++14 and the riscv64-linux-gnu target is sufficient, because there are no riscv64 SIMD paths to require specific compiler intrinsics support. The `RUY_OPT_SET` bitmask (compile-time, not a CMake option) controlling intrinsics/ASM/tuning opt bits has no effect on riscv64 since no arch-specific paths compile.

**Known build failures on riscv64:** None reported. Debian sid successfully builds `libruy-dev` on riscv64 (host `rv-osuosl-03`, status: Installed), confirming that the CMake build completes without errors on riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Optimized Int8 matmul kernel | Yes (AVX2+FMA, AVX-512) | Yes (NEON, NEON dotprod) | No -- scalar fallback only |
| Optimized Float32 matmul kernel | Yes | Yes | No -- scalar fallback only |
| Runtime SIMD path detection | Yes (cpuinfo + have_built_path probes) | Yes | No -- kNone returned by cpuinfo on riscv64 |
| Platform detection macro | RUY_PLATFORM_X86 | RUY_PLATFORM_ARM | None |
| Microarchitecture tuning | Yes (AVX-512 Skylake-X, etc.) | Yes (A55-class vs A73/A75 variants) | None |
| Correctness (scalar fallback) | Yes | Yes | Yes |

**Functional gaps:** None. The `kStandardCpp` path is complete and correct for all operations ruy supports. ruy will function correctly on riscv64.

**Performance gaps:** Severe. The `kStandardCpp` path is a scalar triple-loop C++ fallback with no SIMD acceleration. The only published benchmark data in the repository (issue #323, November 2022) shows ARM NEON throughput at approximately 10 GOPs (Raspberry Pi 4, aarch64, 1.5 GHz) and approximately 40 GOPs (Pixel 4, aarch64, 2.84 GHz) for 512x512x512 Int8 matmul. No riscv64 benchmark data exists anywhere. Data not available: quantitative throughput comparison between riscv64 kStandardCpp and arm64 kNeon on equivalent silicon.

**Security hardening gaps:** Data not available: no security hardening analysis for any architecture was found in the research.

**NaN / floating-point semantics:** No riscv64-specific floating-point correctness issues are reported. The kStandardCpp path uses portable C++ arithmetic.

---

## 7. CI/CD Infrastructure

The google/ruy repository has no `.github/workflows/` directory. Three workflows appear on the GitHub Actions page, but all are Google organization-level mandatory workflows injected at the org level, not repo-defined YAML files:

1. **CodeQL** -- GitHub-managed default, runs `Analyze (python)` on standard ubuntu-latest (x86_64) runner; no architecture matrix; duration approximately 56 seconds.
2. **GitHub Actions Scan** -- Google internal security scan on PRs; org-level injection.
3. **Google GitHub Admin: Actions Workflow Security Scan** -- Google internal security scan; org-level injection.

None of these three workflows reference riscv64, arm runners, QEMU, cross-compilation, or any architecture matrix.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | No (CodeQL only, not a build) | No | No |
| Test CI | No | No | No |
| QEMU-based cross-CI | No | No | No |
| RISE runner | No | No | No |
| Hardware CI | No | No | No |

The only riscv64 build that exists is the Debian autobuilder infrastructure build of `libruy-dev`, which is a downstream distribution build not controlled by google/ruy.

---

## 8. Distribution and Release Status

**Upstream:** No binary releases for any architecture. The [GitHub releases page](https://github.com/google/ruy/releases) is empty. No PyPI package exists (pypi.org/pypi/ruy returns HTTP 404). No RISE wheel builder entry for ruy.

**Debian sid/testing:** `libruy-dev` version `0.0.0~git20230215.21a85fe-3+b1` is available with riscv64 binary. Status: Installed on Debian buildd host `rv-osuosl-03` approximately 47 days before report date. Source: [Debian tracker](https://tracker.debian.org/pkg/ruy).

**Ubuntu 24.04 (noble):** `libruy-dev` version `0.0.0~git20230215.21a85fe-1` is available in the universe component. Architectures: amd64, arm64, ppc64el, riscv64, s390x. Package size: 125.5 kB download, 842.0 kB installed on riscv64. Source: [packages.ubuntu.com/noble/libruy-dev](https://packages.ubuntu.com/noble/libruy-dev).

**Arch Linux:** ruy is not packaged in Arch Linux main repos and has no Arch RISC-V port in [felixonmars/archriscv-packages](https://github.com/felixonmars/archriscv-packages).

**Note on installed size:** The riscv64 `libruy-dev` installed size (842 kB) is larger than the armhf build (532 kB), which is consistent with unoptimized scalar C++ code expanding to more object code than hand-tuned NEON assembly.

**What a user must do to get a working riscv64 binary:** On Ubuntu 24.04 or Debian sid, `apt install libruy-dev` installs the riscv64 package directly. On other distributions, building from source with a riscv64-linux-gnu toolchain is required (see Section 5).

---

## 9. Dependencies

### Summary Table

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| cpuinfo (pytorch/cpuinfo) | CPU feature/ISA detection; selects ruy execution path at runtime | Passing (QEMU + Android CI) | Build-only CI; no explicit test step on riscv64 | Partial | [#397](https://github.com/pytorch/cpuinfo/issues/397) (open): ISA extension detection incomplete (only zfh/zvfh detected); vendor/uarch always returns unknown; sysfs cache detection incomplete |
| googletest (google/googletest) | Test framework; test-only dependency, not shipped with ruy | Passes | 1 failure: [#3756](https://github.com/google/googletest/issues/3756) GetThreadCountTest returns 0 on riscv64 | N/A (test-only) | #3756 (open since 2022, unresolved): thread count detection broken on riscv64; assigned to derekmauro; no active fix |

### cpuinfo Deep-Dive

cpuinfo is the critical runtime dependency that determines which ruy execution path is selected. On riscv64, cpuinfo's incomplete ISA detection (issue [#397](https://github.com/pytorch/cpuinfo/issues/397)) means that even if ruy were to gain a RISC-V optimized path, the runtime dispatch mechanism would lack the data needed to select that path correctly. Issue #397 proposes adding 28 ISA extensions, T-Head/SpacemiT vendor detection, and sysfs cache topology support; it has not been reviewed as of June 2026.

The practical consequence now: cpuinfo on riscv64 correctly reports that no ARM or x86 paths are available, which causes ruy to select `kStandardCpp`. This is correct behavior, not a bug. The dependency on cpuinfo is not blocking for ruy's current (scalar-only) riscv64 state.

### googletest

[Issue #3756](https://github.com/google/googletest/issues/3756) (open since 2022) reports that `GetThreadCountTest.ReturnsCorrectValue` returns 0 instead of the expected value on riscv64. This affects googletest's own self-tests. It does not affect ruy's test correctness unless ruy tests exercise thread-count APIs directly. No active fix is in progress.

---

## 11. Known Bugs and Active Issues

**riscv64-specific issues in google/ruy:** None. Zero issues or PRs in the google/ruy repository mention riscv or riscv64.

**Open issues in google/ruy (all architectures):** Eight open issues as of June 2026 (#317, #321, #323, #328, #333, #346, #352, #366), all ARM- or build-system-related. None concern RISC-V.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| cpuinfo [#397](https://github.com/pytorch/cpuinfo/issues/397) | riscv/linux: complete ISA extension, vendor/uarch, and cache support | Open | High (for future ruy riscv path dispatch) | Adds 28 ISA extensions, T-Head/SpacemiT vendor detection; not yet reviewed |
| googletest [#3756](https://github.com/google/googletest/issues/3756) | GetThreadCountTest returns 0 on riscv64 | Open | Low (does not affect ruy correctness) | Assigned to derekmauro; open since 2022; no fix in progress |

No correctness bugs affect ruy on riscv64. The scalar kStandardCpp path produces correct results.

---

## 12. Objections and Upstream Blockers

**No stated objections:** No maintainer has stated opposition to a RISC-V port. The issue tracker is currently restricted (issue creation is restricted), which is a procedural barrier to filing a tracking issue.

**Technical blockers:**

1. The library is ARM-centric. All optimized kernel infrastructure (path selection, pack routines, kernel dispatch) is written around ARM and x86 SIMD models. Adding RVV support requires new `Path` enum values, a new platform detection macro, new `kernel_riscv*.cc` and `pack_riscv*.cc` files, and RVV intrinsic kernels. This is non-trivial: the ARM arm64 kernel alone comprises approximately 3,000 lines of hand-tuned assembly and intrinsics across multiple microarchitecture variants.

2. cpuinfo #397 must be resolved before runtime ISA detection on riscv64 is reliable enough to safely dispatch to a vector path.

**Organizational blockers:**

The project is driven by Google's internal TFLite/LiteRT needs. The primary maintainer (bjacob) is now at AMD. There is no Google team currently prioritizing RISC-V deployment for TFLite. A RISC-V RVV kernel for ruy would require either a champion inside Google or an external contributor willing to own long-term maintenance of architecture-specific kernels -- no such contributor has appeared in the issue tracker or commit history.

**Acceptance probability:** Data not available: no maintainer has commented on the likelihood of accepting an external RISC-V patch. The Apache-2.0 license and CLA-based contribution model are not barriers, but the absence of any expressed interest from the maintainer team makes acceptance timeline uncertain. [NEEDS VERIFICATION]

---

## 13. Investment Analysis

RISE has not funded any ruy or TFLite/LiteRT RISC-V work. The RISE project blog (28 posts from May 2024 through June 2026) contains zero mentions of ruy. ruy is not listed in the RISE wheel builder. No RISE repository is related to ruy.

### 13.1 Functional Enablement

ruy already functions correctly on riscv64 via the `kStandardCpp` scalar fallback path. There are no functional gaps -- all matrix multiplication operations complete and produce correct results. No functional enablement work is required.

### 13.2 Performance Optimization

The dominant gap is the absence of RVV (RISC-V Vector) kernels. The work required:

1. Add `RUY_PLATFORM_RISCV` macro to `platform.h` with `__riscv` detection.
2. Add `kRvv` (or equivalent) path values to `path.h` and integrate into `kDefaultArchPaths`.
3. Implement `kernel_riscv64.cc` with RVV intrinsics for Int8 and Float32 matmul. The ARM arm64 kernel is the closest analog -- it comprises approximately 3,000 lines for two microarchitecture variants with hand-tuned NEON assembly. An RVV implementation using scalable vector intrinsics could be more concise (RVV's scalable design reduces microarchitecture-specific tuning), but baseline RVV kernel work is still substantial.
4. Implement `pack_riscv.cc` for riscv64 pack routines.
5. Resolve cpuinfo #397 upstream to enable reliable ISA dispatch at runtime.
6. Add upstream CI (QEMU-based) once kernels exist.

### 13.3 CI/CD Infrastructure

The upstream repository has no build or test CI for any architecture (only org-level CodeQL security scanning). Adding riscv64 CI requires first adding any architecture CI. A QEMU-based build-and-test workflow using `riscv64/ubuntu:24.04` is the minimal viable approach.

### 13.4 Ecosystem Enablement

Not applicable. ruy has no dependent package ecosystem requiring separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement RVV Int8 matmul kernel (kernel_riscv64.cc) | 6-10 | Contributor with ruy/NEON kernel experience | High |
| Performance | Implement RVV Float32 matmul kernel | 3-5 | Same | High |
| Performance | Implement riscv64 pack routines (pack_riscv.cc) | 2-4 | Same | High |
| Performance | Add platform detection macro and Path enum entry | 0.5 | Same | High |
| Dependency | Resolve cpuinfo #397 (ISA extension detection) | 2-4 | cpuinfo contributor | High |
| CI/CD | Add QEMU riscv64 build-and-test workflow | 1 | Same or CI specialist | Medium |
| Performance | Microarchitecture tuning for specific RISC-V cores | 4-8 | Hardware vendor or perf engineer | Low (post-baseline) |

Total estimated effort for baseline RVV optimization: 15-25 person-weeks, assuming a contributor already familiar with ruy's kernel infrastructure and RVV intrinsics programming.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/ruy repository](https://github.com/google/ruy)
- [ruy/platform.h -- platform detection macros](https://github.com/google/ruy/blob/master/ruy/platform.h)
- [ruy/path.h -- execution path enum](https://github.com/google/ruy/blob/master/ruy/path.h)
- [ruy/CMakeLists.txt -- build system](https://github.com/google/ruy/blob/master/CMakeLists.txt)
- [ruy GitHub releases (empty)](https://github.com/google/ruy/releases)
- [ruy PR #227 -- tangential RISC-V microcontroller mention](https://github.com/google/ruy/pull/227)
- [ruy issue #323 -- ARM performance benchmarks](https://github.com/google/ruy/issues/323)
- [cpuinfo issue #397 -- riscv/linux ISA detection incomplete](https://github.com/pytorch/cpuinfo/issues/397)
- [googletest issue #3756 -- GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [libruy-dev in Debian tracker](https://tracker.debian.org/pkg/ruy)
- [libruy-dev Debian buildd status (sid)](https://buildd.debian.org/status/package.php?p=ruy&suite=sid)
- [libruy-dev in Ubuntu noble (packages.ubuntu.com)](https://packages.ubuntu.com/noble/libruy-dev)
- [RISE project member list](https://riseproject.dev)
- [felixonmars/archriscv-packages -- Arch RISC-V port tracker](https://github.com/felixonmars/archriscv-packages)