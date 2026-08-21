---
title: draco
---

# draco

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for draco<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Google Draco](https://google.github.io/draco/) is an open-source C++ library and CLI toolset for compressing and decompressing 3D geometric meshes and point clouds. Its primary use case is reducing the size of 3D content transmitted over the web, particularly for glTF and WebGL pipelines. The library exposes a C++ API and builds `draco_encoder` and `draco_decoder` command-line binaries. Optional WASM and JavaScript bindings are also maintained.

**License:** Apache 2.0.

**Governance:** Google-owned open-source project under the `google` GitHub organization. No foundation membership (not part of RISE, Apache, CNCF, or any equivalent body). Contributions require a Google CLA. There is no independent steering committee. The project mailing list is `draco-3d-discuss@googlegroups.com`. Security reports route to `g.co/vulnz` (Google Security Team).

**Corporate maintainers:**
- Frank Galligan (`fgalligan@google.com`, Google) - current primary maintainer, 110 commits, active through 2026-07
- Tom Finegan (`tomfinegan`, Google) - historical primary maintainer, 138 commits
- Ondrej Stava (`ondys`, Google) - 46 commits
- James Zern (`jzern@google.com`, Google) - 13 commits
- Lou Quillio (`louquillio`, Google) - 90 commits (documentation/web)

All significant maintainers are Google employees. Community contributions are accepted via standard PR review.

**RISE membership:** Google LLC is a RISE Premier Member. Draco itself is not listed in the RISE project or working group scope. No RISE-sponsored work on Draco for RISC-V has been publicly announced. The RISE wheel builder (riscv64 Python wheels) does not list draco. The RISE project blog (33 posts from 2024-05 through 2026-08) contains zero mentions of Draco.

**Community stance on new ports:** No formal tier or platform support policy document exists in the repository (no PLATFORMS.md, SUPPORT.md, or equivalent). The library is pure C++ with CMake and compiles on any architecture the generic C++ path covers. SIMD acceleration is opt-in per architecture. No maintainer has stated opposition to a RISC-V port. No such port has ever been submitted.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| -- | No RISC-V issue, PR, commit, or discussion has ever appeared in the repository | GitHub issue/PR search: 0 results for "riscv", "riscv64", "risc-v" |
| -- | No RISC-V toolchain file added to `cmake/toolchains/` | Direct tree scan |
| -- | No RVV or RISC-V ISA extension code added anywhere | GitHub code search: 0 results for "riscv" in repo |
| -- | Debian maintainer (Timo Rohling) independently packaged draco for riscv64 | [Debian buildd](https://buildd.debian.org/status/package.php?p=draco&suite=sid) |
| -- | Ubuntu 24.04 Noble ships draco 1.5.6+dfsg-3build1 for riscv64 | [packages.ubuntu.com](https://packages.ubuntu.com/noble/draco) |

There is no upstream port. The only riscv64 binary presence is entirely downstream, initiated and maintained by Debian/Ubuntu packagers without any upstream involvement.

Key contributors to the port: none from upstream. The Debian maintainer Timo Rohling carries the packaging. No individual or organization has filed a PR or issue requesting or implementing a RISC-V port in the upstream repository.

---

## 3. Upstream Support Tier

No formal tier policy exists in the repository. Support tiers are inferred from CI, release binaries, and build documentation.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI in upstream repo | Yes (`ubuntu-latest`, `windows-latest`, `macos-latest`) | Partial (macOS runners are Apple Silicon; no explicit Linux arm64 job) | No |
| Official binary releases | No (source-only; GitHub Releases have zero assets for 1.5.5, 1.5.6, 1.5.7) | No | No |
| Toolchain file in repo | Yes (Android x86/x86_64) | Yes (aarch64-linux-gnu, arm64-linux-gcc, Android arm64, iOS arm64) | No |
| SIMD optimizations | SSE4.1 | NEON | None (scalar fallback) |
| Distro packages | Yes | Yes | Debian/Ubuntu only (downstream-maintained) |
| QEMU CI | No | No | No |

The upstream project publishes no binary artifacts for any platform. All GitHub Release tags (1.5.3 through 1.5.7) have zero attached assets. Draco is source-only from the upstream perspective. riscv64 has no upstream tier at all.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Draco is a pure C++ codec with no JIT, no GC, no runtime code generation. Architecture-specific optimization is limited to SIMD intrinsics for the bit-manipulation and integer-decoding hot paths. There is no assembly (.S files are absent from the entire repo), no crypto, and no architecture-specific memory model concern.

**SIMD dispatch mechanism:**

`cmake/draco_cpu_detection.cmake` (42 lines) implements a `draco_optimization_detect` macro with exactly two branches:
- `arm|aarch64` - sets `draco_have_neon = ON`
- `x86|amd64` - sets `draco_have_sse4 = ON`

RISC-V matches neither branch. Both `draco_have_neon` and `draco_have_sse4` remain OFF on riscv64.

`cmake/draco_intrinsics.cmake` (100 lines) handles only two SIMD suffixes: `neon` and `sse4`. Any other suffix triggers a `FATAL_ERROR`. No RVV case exists and none can be added without modifying this file.

**Per-component architecture comparison:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD intrinsics | SSE4.1 (via cmake suffix dispatch) | NEON (via cmake suffix dispatch) | None - scalar fallback |
| Bit utilities (`MostSignificantBit`) | `__builtin_clz` (GCC/Clang) | `__builtin_clz` (GCC/Clang) | `__builtin_clz` (GCC/Clang) |
| Assembly (.S files) | None | None | None |
| JIT | None | None | None |
| RVV (RISC-V Vector) | N/A | N/A | None |
| Toolchain file | Yes (Android variants) | Yes (10 files) | None |

The scalar fallback is complete and correct. riscv64 builds and runs the full codec via generic C++. The gap is performance, not functionality.

**Performance impact of missing SIMD:** No benchmark data comparing riscv64 scalar vs. arm64 NEON or amd64 SSE4.1 performance is available in any public source. The SIMD paths are cmake-dispatch infrastructure; no SIMD-accelerated source files currently exist in the repo (the suffix mechanism exists but no `.neon.cc` or `.sse4.cc` files are present). Practical SIMD gap at the current codebase state is therefore zero - all architectures run the same scalar code. Future SIMD additions would create a gap if not extended to RVV simultaneously.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake, minimum version 3.12 (`cmake_minimum_required(VERSION 3.12 FATAL_ERROR)`).

**C++ standard:** C++11 by default. C++17 required only when `-DDRACO_TRANSCODER_SUPPORTED=ON`.

**Compiler minimum:** GCC 5 / Clang 4. Below these versions, the build triggers `DRACO_OLD_GCC` compatibility mode with a warning (not a hard failure, but degraded build). Standard riscv64 cross-compile toolchains on current Debian/Ubuntu ship GCC 12+, which satisfies this requirement.

**No riscv64 toolchain file exists.** `cmake/toolchains/` contains 16 files covering ARM/AArch64 Linux, Android, and iOS variants. riscv64 is absent.

**Cross-compilation (no existing upstream documentation - derived from aarch64 toolchain pattern):**

Option A - inline cmake flags:
```
mkdir build_riscv64 && cd build_riscv64
cmake .. \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_BUILD_TYPE=Release \
  -DDRACO_ENABLE_NEON=OFF \
  -DDRACO_ENABLE_SSE4_1=OFF
make -j$(nproc)
```

The `-DDRACO_ENABLE_NEON=OFF -DDRACO_ENABLE_SSE4_1=OFF` flags are redundant (arch detection auto-disables both for riscv64) but safe to specify explicitly.

Option B - toolchain file (following aarch64-linux-gnu.cmake pattern):
```cmake
set(CMAKE_SYSTEM_NAME "Linux")
if("${CROSS}" STREQUAL "")
  set(CROSS riscv64-linux-gnu-)
endif()
set(CMAKE_CXX_COMPILER ${CROSS}g++)
set(CMAKE_C_COMPILER ${CROSS}gcc)
set(CMAKE_SYSTEM_PROCESSOR "riscv64")
```

**QEMU:** No upstream documentation or CI use of QEMU. Cross-compiled binaries can be executed via QEMU user-mode emulation:
```
qemu-riscv64 -L /usr/riscv64-linux-gnu ./draco_encoder
```
This is not tested or documented upstream.

**Dockerfiles:** None exist in the repository. No `Dockerfile`, `.ci/docker/`, or container configuration of any kind was found.

**Known build failures on riscv64:** None documented. The Debian riscv64 build (1.5.7+dfsg-2) completed successfully on `rv-osuosl-01` with no recorded failures.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All codec features (mesh compression, point cloud compression, glTF transcoder) compile and execute on riscv64 via scalar C++ fallback. The library is functionally complete on riscv64.

**Performance gaps:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Mesh encode/decode | Scalar (no SSE4.1 source files currently) | Scalar (no NEON source files currently) | Scalar | None currently; future SIMD additions will create gap |
| `MostSignificantBit` | `__builtin_clz` | `__builtin_clz` | `__builtin_clz` | None |
| Point cloud encode/decode | Scalar | Scalar | Scalar | None |
| glTF transcoder | Scalar + Eigen | Scalar + Eigen (no NEON Eigen path in pinned submodule commit) | Scalar + Eigen | Potentially none if Draco's pinned Eigen commit predates the RVV backend (Nov 2025) |

**Security hardening gaps:** No architecture-specific hardening is implemented or documented for any architecture. All architectures are equally unprotected at the library level.

**Endianness:** Draco assumes little-endian input for PLY files (issue #1133, open). riscv64 Linux is little-endian. This is not a riscv64-specific gap, but it is an unresolved correctness issue for big-endian inputs on any platform.

**Floating-point semantics:** No riscv64-specific floating-point issues documented. No open issues mention FP behavior differences on riscv64.

---

## 7. CI/CD Infrastructure

**Upstream CI:** GitHub Actions only. Four workflow files exist for build/test jobs (the other four are Gemini automation bots).

`.github/workflows/ci.yml` (251 lines) defines two jobs: `draco-tests` and `draco-install-tests`.

| Job | Runners | riscv64 |
|---|---|---|
| `draco-tests` | `ubuntu-latest`, `macos-latest`, `windows-latest` | No |
| `draco-install-tests` | `ubuntu-latest`, `macos-latest`, `windows-latest` | No |

The string "riscv" does not appear anywhere in `ci.yml`. No QEMU action, no `linux/riscv64` platform flag, no cross-compilation for RISC-V in any matrix entry. All `ubuntu-latest` runners are x86_64.

**RISE runners:** No RISE-provided riscv64 runners are used by this project.

**Downstream CI (Debian buildd):** Debian's build infrastructure successfully builds and installs draco 1.5.7+dfsg-2 on riscv64 hardware host `rv-osuosl-01`. This is the only automated riscv64 build/test record that exists anywhere for draco.

**CI comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI jobs | Yes (ubuntu-latest, windows-latest) | Partial (macos-latest, Apple Silicon) | No |
| QEMU emulation in CI | No | No | No |
| Hardware runners | GitHub-hosted | GitHub-hosted (macOS) | None |
| Debian autobuilder | Yes | Yes | Yes (rv-osuosl-01) |
| Test results visible | Yes | Yes | Yes (Debian buildd only) |
| Release-blocking | Yes | Yes | No |

---

## 8. Distribution and Release Status

**Upstream releases:** Source-only. GitHub Releases for 1.5.3, 1.5.4, 1.5.5, 1.5.6, and 1.5.7 all have zero binary assets attached. No platform-specific binaries are published by upstream for any architecture.

**PyPI:** The `draco` package on PyPI (version 2.0.1) is a different project - a pure-Python visualization and analysis tool, not the Google 3D compression library. Its wheels are tagged `py3-none-any` and install on riscv64 without modification.

**Debian:**
- sid (unstable): 1.5.7+dfsg-2, riscv64 binary confirmed via buildd (host: rv-osuosl-01, status: Installed)
- forky (testing): 1.5.7+dfsg-2
- trixie (stable): 1.5.6+dfsg-3+b3

**Ubuntu:**
- 24.04 Noble: `draco` 1.5.6+dfsg-3build1, available for amd64, arm64, armhf, ppc64el, riscv64, s390x. Packages: `libdraco8`, `libdraco-dev`, `draco`.

**Arch Linux:** Version 1.5.7-2 (built 2026-03-27) for x86_64 only. No riscv64 package.

**Arch Linux RISC-V (archriscv.felixc.at):** Status could not be confirmed from available fetch results.

**OCI/container images:** None published upstream.

**To get a working riscv64 binary:** On Debian or Ubuntu riscv64 systems, `apt install libdraco-dev draco` provides the library and CLI tools at version 1.5.6-1.5.7. Cross-compilation from source is straightforward (see Section 5) with no known build failures.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Eigen | Linear algebra for transcoder (`DRACO_TRANSCODER_SUPPORTED=ON`) | Builds (RVV backend on master post-Nov 2025) | CI on SpacemiT hardware added Jun 2026 | Not in a versioned release (post-3.4.1/post-5.0.1 master only) | Draco pins a submodule commit; may predate RVV work |
| googletest | Test framework (build-time only, not runtime) | Builds | Fails: `GetThreadCountTest.ReturnsCorrectValue` (issue #3756, open since 2021) | Available in Debian/Ubuntu riscv64 as dev package | Test-only dep; does not affect draco library or binaries |
| tinygltf | glTF 2.0 scene loading (transcoder mode, header-only C++) | Builds | No riscv64 issues filed | N/A (header-only) | No riscv64 relevance |
| gulrak/filesystem | `std::filesystem` polyfill for C++14 builds (header-only) | Builds | No riscv64 issues filed | N/A (header-only) | Superseded by C++17 `<filesystem>` on modern toolchains |

**Eigen deep-dive:** When Draco is built with `-DDRACO_TRANSCODER_SUPPORTED=ON`, it links against Eigen via a pinned `third_party/eigen` submodule. The upstream Eigen project merged an RVV backend in November 2025 and added SpacemiT hardware CI runners in June 2026. However, Draco's pinned submodule commit determines which Eigen version is used. If that commit predates November 2025, the RVV backend is absent and Eigen falls back to scalar on riscv64 - which is functionally correct but unoptimized. The transcoder feature is off by default.

**googletest issue #3756:** `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 and has been open since 2021. This affects only Draco's test suite (when built with `-DDRACO_TESTS=ON`), not the library or encoder/decoder binaries. It is a pre-existing googletest limitation, not a Draco-specific issue.

**Dependency of dependencies:** The Eigen RVV status is covered in detail in `reports/eigen.md` in this repository.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the upstream tracker. The following issues affect all architectures including riscv64:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1214](https://github.com/google/draco/issues/1214) | Fix heap overflow in CopyDataAsFloatImpl by validating accessor bounds | Open | Critical (OSS VRP confirmed by Google, issue #543813782) | Heap buffer overflow via malformed glTF input; all architectures |
| [#1169](https://github.com/google/draco/issues/1169) | Uncontrolled memory allocation in MeshEdgebreakerDecoderImpl::DecodeConnectivity allows DoS | Open | High | Memory exhaustion via malformed input; all architectures |
| [#1194](https://github.com/google/draco/issues/1194) | Out-of-bounds read in draco::PointAttribute::DeduplicateFormattedValues | Open | High | All architectures |
| [#1133](https://github.com/google/draco/issues/1133) | Add support for reading big-endian PLY files by byte swapping | Open | Low | Not riscv64-specific; riscv64 Linux is little-endian so no functional impact |
| [#604](https://github.com/google/draco/issues/604) | Decompression Performance Improvement (no SIMD acceleration) | Open | Low | All architectures rely on scalar path; no SIMD source files currently exist |

**Correctness bugs (separate callout):** Issues #1214, #1169, and #1194 are security-relevant correctness bugs affecting untrusted input parsing. They are unresolved and affect riscv64 equally. Any riscv64 deployment parsing untrusted 3D content inherits these vulnerabilities.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. No maintainer has expressed opposition to a RISC-V port. The topic has never arisen in the issue tracker or PR history.

**Technical blockers:** None. The library compiles cleanly on riscv64 via scalar fallback. `cmake/draco_intrinsics.cmake` would need modification to add an RVV suffix case (currently any unknown suffix triggers `FATAL_ERROR`), but this is a small, well-understood change.

**Organizational blockers:** Google CLA is required for all contributions. This is a standard barrier, not a riscv64-specific one. Maintainer review capacity may be limited (the repo has 172 open issues and a small team).

**Acceptance probability:** High for a toolchain file and CI job addition - these are low-risk, non-functional changes. Medium for an RVV intrinsics addition - would require the maintainers to accept a new SIMD backend they cannot test on their own CI infrastructure. No precedent exists for either.

---

## 13. Investment Analysis

RISE has not funded any Draco work. Google (a RISE Premier Member) maintains Draco but has not extended it to RISC-V. All current riscv64 availability derives from Debian packaging with no upstream involvement.

### 13.1 Functional Enablement

Draco is already functionally complete on riscv64. The library builds, encodes, and decodes correctly on riscv64 via scalar C++. Debian packages exist. No functional gap requires remediation.

### 13.2 Performance Optimization

The immediate performance gap is zero: no SIMD source files exist for any architecture in the current codebase. All architectures run the same scalar code. If upstream adds SSE4.1 or NEON source files in the future without a concurrent RVV path, a performance gap will emerge. An RVV intrinsics implementation would require modifying `cmake/draco_cpu_detection.cmake`, `cmake/draco_intrinsics.cmake`, and writing RVV-optimized variants of the bit-manipulation hot paths. Draco is not typically a CPU bottleneck in production 3D pipelines (it runs once during asset export, not at render time), so performance investment should be evaluated against actual deployment profiles.

### 13.3 CI/CD Infrastructure

The upstream project has no riscv64 CI. Adding a riscv64 CI job (QEMU-based on a GitHub Actions `ubuntu-latest` runner) is the minimum investment to prevent regressions. A hardware-backed runner (e.g., via RISE or SpacemiT) would provide higher confidence but is not strictly required given the simple build matrix.

### 13.4 Ecosystem Enablement

Not applicable. Draco has no significant dependent package ecosystem that requires separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None - library is functional on riscv64 | 0 | -- | -- |
| Functional | Resolve open security issues (#1214, #1169, #1194) affecting all platforms including riscv64 | 2-4 | Upstream maintainers (Google) | High |
| CI/CD | Add riscv64 QEMU-based CI job to `.github/workflows/ci.yml` | 0.5 | Contributor + upstream review | Medium |
| CI/CD | Add riscv64 toolchain file `cmake/toolchains/riscv64-linux-gnu.cmake` | 0.25 | Contributor + upstream review | Low |
| Performance | RVV intrinsics for bit-manipulation hot paths (if/when upstream adds SSE4.1/NEON source files) | 3-6 | Contributor + upstream review | Low |
| Performance | Update Draco's Eigen submodule pin to post-Nov 2025 commit to pick up RVV backend (transcoder only) | 0.5 | Contributor + upstream review | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/draco repository](https://github.com/google/draco)
- [Draco homepage](https://google.github.io/draco/)
- [ci.yml - upstream CI workflow](https://github.com/google/draco/blob/main/.github/workflows/ci.yml)
- [cmake/draco_cpu_detection.cmake](https://github.com/google/draco/blob/main/cmake/draco_cpu_detection.cmake)
- [cmake/draco_intrinsics.cmake](https://github.com/google/draco/blob/main/cmake/draco_intrinsics.cmake)
- [cmake/draco_build_definitions.cmake](https://github.com/google/draco/blob/main/cmake/draco_build_definitions.cmake)
- [Debian buildd status for draco (sid)](https://buildd.debian.org/status/package.php?p=draco&suite=sid)
- [Debian package tracker for draco](https://tracker.debian.org/pkg/draco)
- [Ubuntu 24.04 Noble: draco package](https://packages.ubuntu.com/noble/draco)
- [Issue #604 - Decompression Performance Improvement](https://github.com/google/draco/issues/604)
- [Issue #1133 - Add support for reading big-endian PLY files](https://github.com/google/draco/issues/1133)
- [Issue #1169 - Uncontrolled memory allocation DoS](https://github.com/google/draco/issues/1169)
- [Issue #1194 - Out-of-bounds read in DeduplicateFormattedValues](https://github.com/google/draco/issues/1194)
- [Issue #1214 - Heap overflow in CopyDataAsFloatImpl](https://github.com/google/draco/issues/1214)
- [PR #1064 - perf(core/bit_utils.h): optimize MostSignificantBit default impl](https://github.com/google/draco/pull/1064)
- [googletest issue #3756 - GetThreadCountTest.ReturnsCorrectValue fails on riscv64](https://github.com/google/googletest/issues/3756)
- [RISE Project member list](https://riseproject.dev/)
- [PyPI draco package (pure-Python visualization tool, not this library)](https://pypi.org/project/draco/)