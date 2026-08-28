---
title: crc32c
---

# crc32c

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for crc32c<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/crc32c](https://github.com/google/crc32c) is a C++ library implementing the CRC32C checksum algorithm. It provides hardware-accelerated paths for x86-64 (SSE4.2) and ARM64 (ARMv8 CRC+CRYPTO), with a portable scalar fallback for all other architectures. The library is widely used as a dependency in storage systems -- notably Ceph, RocksDB, MySQL, and memcached.

**Governance.** The project is informal corporate open-source stewardship under the Google GitHub organization. All contributions require signing Google's CLA at cla.developers.google.com. There is no MAINTAINERS, OWNERS, or CODEOWNERS file. There is no foundation affiliation (Linux Foundation, CNCF, Apache, etc.) and the project is not a RISE Project member.

**Corporate maintainers.**

| Name | Affiliation | Role |
|---|---|---|
| Victor Costan (pwnall) | Google (Fuchsia Display) | Primary maintainer; 64 of ~82 total commits |
| Fangming Fang (Fangming.Fang@arm.com) | ARM | ARM64 acceleration contributor; listed in AUTHORS |
| Harry Mallon (hjmallon@gmail.com) | Independent | ARM64 Darwin support (PR #43, 2020-09) |
| Rodrigo Tobar (rtobar@icrar.org) | ICRAR | Minor contributor |

**Project activity.** 82 total commits since 2017. Last commit: April 2025 (CMake 4.0 compatibility fix). 515 stars, 159 forks. The project is in maintenance mode with no active development cadence. Issues are disabled on the repository. As of 2026-08, 11 pull requests are open and accumulating with no merges since September 2024.

**Community stance on new ports.** Conservative. The PR #75 description characterizes itself as "a conservative portability patch." The repository's history shows hardware acceleration is added only for architectures where Google itself ships product code (x86-64 for Chrome/Linux, ARM64 for Android/Fuchsia). No maintainer has engaged with any open RISC-V issue or PR. Given the light maintenance posture and single active Google maintainer, the bar for merging even a build-system patch is high.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017 | Repository created; x86-64 SSE4.2 and portable paths present from inception | [github.com/google/crc32c](https://github.com/google/crc32c) commit history |
| 2020-09 | ARM64 Darwin support added (PR #43) | [PR #43](https://github.com/google/crc32c/pull/43) |
| 2024-09-06 | ARM64 UBSan alignment bug fixed (PR #65, merged) | [PR #65](https://github.com/google/crc32c/pull/65) |
| 2026-06-11 | PR #75 "Add RISC-V target detection" opened | [PR #75](https://github.com/google/crc32c/pull/75) |

Zero commits matching "riscv" or "riscv64" exist in the commit history. The only RISC-V upstream activity is PR #75, which is open, unmerged, and blocked on a missing Google CLA signature. No hardware acceleration for RISC-V has ever been proposed.

**Key contributors to RISC-V work.**

| Contributor | Org | Contribution |
|---|---|---|
| carlosqwqqwq (Carlos) | University of Chinese Academy of Sciences [NEEDS VERIFICATION] | PR #75: CMake target detection only |

**Is the port fully upstream?** No. Zero RISC-V code has been merged. PR #75 is the entire upstream RISC-V contribution history.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project implicitly supports two tiers: hardware-accelerated (x86-64 and ARM64) and portable fallback (all other architectures). RISC-V falls into the portable fallback tier with no documentation, no CI, and no official binaries.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware acceleration | SSE4.2 (+ PCLMULQDQ in draft PR #74) | ARMv8 CRC+CRYPTO | None -- portable scalar only |
| CI coverage | Yes (ubuntu-latest, windows-latest) | Yes (macos-latest) | None |
| Official binaries | Source tags only (no GitHub Release assets) | Source tags only | Source tags only |
| PyPI wheels | Yes (x86_64, i686 Linux; macOS universal2/x86_64/arm64; Windows) | Yes (aarch64) | None |
| Distro packages | Ubuntu, Debian, Fedora, openSUSE | Ubuntu, Debian | Ubuntu noble (source-built, portable), Debian trixie/sid (build record absent -- see Section 8) |
| Explicitly documented | Yes (README) | Yes (README) | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

crc32c has three architecture-specific code paths and one portable fallback.

### Hardware CRC acceleration

| Component | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| SSE4.2 CRC intrinsics | `src/crc32c_sse42.cc` (256 lines) | Hand-tuned; `_mm_crc32_u8/32/64` | Not used | Not used |
| ARMv8 CRC+CRYPTO intrinsics | `src/crc32c_arm64.cc` (121 lines) | Not used | C intrinsics; `__crc32cb/h/w/d` + `vmull_p64` | Not used |
| Portable scalar C++ | `src/crc32c_portable.cc` | Fallback only | Fallback only | **Only path** |
| Zbc/Zbkc (carry-less multiply) | Not implemented | N/A | N/A | Missing -- not started |
| RVV (RISC-V Vector) | Not implemented | N/A | N/A | Missing -- not started |

### Dispatch layer

The `Extend()` function in `src/crc32c.cc` has two accelerated branches -- `HAVE_SSE42 && x86_64` and `HAVE_ARM64_CRC32C` -- and falls through to `ExtendPortable()` for all other architectures. There is no `#ifdef __riscv` guard, no `HAVE_RISCV` CMake variable (absent pre-PR #75), and no SIMD dispatch for riscv64. On RISC-V hardware, the runtime exclusively calls `ExtendPortable()`.

### Portable implementation characteristics

The portable path is a 4-stride interleaved table lookup with prefetch, processing 64 bytes per iteration using four 256-entry `uint32_t` lookup tables. No published throughput numbers for this path exist in the project documentation.

### Published x86 performance reference (PR #74, Intel Xeon E5-2678 v3)

| Buffer size | SSE4.2 skip-table (existing) | PCLMULQDQ (draft PR #74) |
|---|---|---|
| 256 B | 7.4 GiB/s | 14.9 GiB/s |
| 64 KiB | 22.7 GiB/s | 22.8 GiB/s |
| 16 MiB | 21.6 GiB/s | 21.8 GiB/s |

No riscv64 benchmark data exists in the project, in RISE publications, or in any web-reachable source. The portable path on riscv64 will be substantially below the x86 hardware numbers; no quantitative estimate can be cited from available data.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** CMake only (minimum version 3.16). C++11 required (`CMAKE_CXX_STANDARD 11`). No Meson, Bazel, or Autoconf alternative. No upstream toolchain file for riscv64 cross-compilation.

**Native riscv64 build (on riscv64 hardware).**

```bash
git clone --recurse-submodules https://github.com/google/crc32c.git
cd crc32c
mkdir build && cd build
cmake .. \
  -DCRC32C_BUILD_TESTS=1 \
  -DCRC32C_BUILD_BENCHMARKS=0 \
  -DCRC32C_USE_GLOG=0 \
  -DCMAKE_BUILD_TYPE=Release
cmake --build . -j$(nproc)
ctest --output-on-failure
```

No architecture override flags are needed. The CMake probes for SSE4.2 and ARM64 intrinsics fail automatically on riscv64 and set `HAVE_SSE42=0`, `HAVE_ARM64_CRC32C=0`. The build falls through to the portable path without intervention.

**Cross-compilation from x86-64 host.**

Without PR #75 merged, the CMake architecture probes may attempt to compile x86 and ARM feature-test code against the riscv64 cross-compiler, potentially injecting wrong flags or producing a misconfigured `crc32c_config.h`. With the current unpatched codebase, the probes should fail gracefully because the cross-compiler rejects SSE4.2 and ARM CRC intrinsics -- but this is not guaranteed on all toolchain configurations [NEEDS VERIFICATION].

```bash
cmake .. \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCRC32C_BUILD_TESTS=0 \
  -DCRC32C_BUILD_BENCHMARKS=0 \
  -DCRC32C_USE_GLOG=0 \
  -DCMAKE_BUILD_TYPE=Release
cmake --build .
```

**Toolchain version requirements.**

| Requirement | Value | Source |
|---|---|---|
| CMake | >= 3.16 | `cmake_minimum_required` in CMakeLists.txt |
| C++ standard | C++11 | `CMAKE_CXX_STANDARD 11`, `REQUIRED ON` |
| GCC (riscv64 cross) | GCC 10+ (as shipped in Ubuntu 20.04+) | Implied by C++11; `gcc-riscv64-linux-gnu` package |

No explicit GCC or Clang minimum version is stated in the repository.

**QEMU.** No QEMU references exist in the repository. Cross-compiled test binaries can be run under `qemu-riscv64-static` for local validation; this is not documented upstream.

**PR #75 verification note.** The author tested via simulated riscv64 cross-compile on Windows using `CMAKE_TRY_COMPILE_TARGET_TYPE=STATIC_LIBRARY`, not a real riscv64 cross-toolchain or hardware. The generated `crc32c_config.h` from that simulation: `CRC32C_TARGET_RISCV=1`, `HAVE_MM_PREFETCH=0`, `HAVE_SSE42=0`, `HAVE_ARM64_CRC32C=0`, `HAVE_STRONG_GETAUXVAL=0`, `HAVE_WEAK_GETAUXVAL=0`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware CRC32C instruction | Yes (SSE4.2) | Yes (ARMv8 CRC ext) | No (Zbc/Zbkc not used) |
| Runtime SIMD dispatch | Yes (CPUID) | Yes (getauxval / IsProcessorFeaturePresent) | No -- fixed at compile time to portable |
| PCLMULQDQ / carry-less multiply acceleration | Draft (PR #74, open) | Yes (PMULL via vmull_p64) | No |
| Portable scalar fallback | Available (not used when hw present) | Available (not used when hw present) | Only path |
| C API (`crc32c.h`) | Yes | Yes | Yes |
| C++ API | Yes | Yes | Yes |
| Windows MSVC support | Yes | Draft (PR #73, open 2026-03-25) | No |

**Functional gaps.** None -- the portable path computes correct CRC32C on riscv64. There are no correctness defects specific to riscv64.

**Performance gaps.** The hardware CRC paths on x86 (SSE4.2) reach 7-23 GiB/s depending on buffer size (see Section 4). The portable path on riscv64 will be materially lower. No riscv64 throughput figure is available from research; the gap magnitude is unquantified from available data.

**Security hardening gaps.** No RISC-V-specific security hardening is needed for a CRC library. The UBSan alignment bug fixed in PR #65 (ARM64) has no equivalent RISC-V implementation to worry about.

---

## 7. CI/CD Infrastructure

riscv64 CI does not exist. This is confirmed by direct inspection of `.github/workflows/build.yml`, the sole CI configuration file in the repository (no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist).

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | ubuntu-latest, windows-latest (GitHub Actions) | macos-latest (GitHub Actions) | None |
| QEMU emulation | No | No | No |
| Cross-compile CI | No | No | No |
| RISE-sponsored runner | No | No | No |
| Build tested | Yes | Yes | No |
| Tests executed | Yes | Yes | No |

The CI matrix is `on: [push, pull_request]` against three OS targets. The word "riscv" does not appear in the CI file. No second CI system (Buildbot, Jenkins, Cirrus) exists for this project.

RISE has no involvement with crc32c. The RISE Python wheel builder (76-package list) does not include crc32c. A full scan of RISE blog posts (33 posts from 2024-05 through 2026-08) found zero mentions of crc32c. The only crc32c reference in the riseproject-dev GitHub organization is in the sw-ecosystem reports directory (cross-references from reports on dependent projects) and an indirect npm dev dependency (`@aws-crypto/crc32c` v5.2.0 in the riscv-runner control plane).

---

## 8. Distribution and Release Status

**GitHub Releases.** The repository publishes source-only tags (versions 1.0.1 through 1.1.2). Zero binary release assets exist in any release. No riscv64 binary is distributed via GitHub Releases.

**PyPI (crc32c Python wrapper, latest: 2.7.post0).** Linux wheels are built for x86_64, i686, and aarch64. No riscv64 wheel exists. A user running `pip install crc32c` on riscv64 will fall back to a source build (requiring a C++ compiler) or fail if no compiler is available.

**Ubuntu 24.04 (noble).** Package `python3-crc32c` version 2.3-1.1build3 is listed with riscv64 as a supported architecture. This is a distro-level source rebuild using the portable scalar fallback; no hardware acceleration is present. The package is in the `universe` component.

**Debian (trixie/sid/forky).** Packages `python3-crc32c` and `librust-crc32c-dev` list riscv64 as a supported architecture in the Packages metadata. However, the Debian buildd status for `python3-crc32c` on riscv64 in sid returns "No entry in riscv64 database -- check Packages-arch-specific," indicating no build has been recorded in the Debian build infrastructure. The architecture listing and the build record are contradictory; the package may be excluded from riscv64 via `Packages-arch-specific`. The `python3-crc32c` package is not present in bookworm (stable) for riscv64.

**Debian bookworm (stable).** No riscv64 package for crc32c.

**Fedora / openSUSE.** Listed in research as shipping crc32c packages with riscv64 support [NEEDS VERIFICATION -- no direct package URL confirmed in research data].

**Arch Linux RISC-V (archriscv.felixc.at).** Status could not be determined; the site returned no result for crc32c queries.

**What a user must do to get a working binary on riscv64.** Build from source. The portable path works out of the box with the cmake commands in Section 5. No hardware acceleration is available regardless of the build method.

---

## 9. Dependencies

### Dependency summary table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| google/googletest | Unit tests (`crc32c_tests`, `crc32c_capi_tests`) | Builds | `GetThreadCountTest.ReturnsCorrectValue` fails (issue [#3756](https://github.com/google/googletest/issues/3756), open since 2022-02-05) | Ships in distros | Test-only failure; not a library correctness issue |
| google/benchmark | Microbenchmarks (`crc32c_bench`) | Builds | No open riscv64 issues found | Tagged releases | None found |
| google/glog (optional) | Logging in tests when `CRC32C_USE_GLOG=ON` | Builds | No open riscv64 issues found | Tagged releases | None found |

### Deep-dive: google/googletest

The `GetThreadCountTest.ReturnsCorrectValue` failure on riscv64 is the sole known test-infrastructure issue. This test reads `/proc/self/task` to count threads; the failure is attributed to a kernel-level quirk on riscv64, not a crc32c correctness issue. It does not affect the library's functional correctness on riscv64. See [googletest issue #3756](https://github.com/google/googletest/issues/3756).

### Deep-dive: google/benchmark

google/benchmark is included in `scope.yml`; see `project-reports/benchmark.md` for the full riscv64 status report.

crc32c has no JIT, no crypto implementation, no floating-point arithmetic, and no GC. Its dependency surface is intentionally minimal. The three test/benchmark dependencies listed above are the complete upstream dependency set; none block riscv64 functionality.

---

## 11. Known Bugs and Active Issues

Issues are disabled on the google/crc32c repository. The following are tracked via pull requests only.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #75](https://github.com/google/crc32c/pull/75) | Add RISC-V target detection | Open (2026-06-11) | Low (build correctness for cross-compile) | CLA-blocked; no maintainer review; CMake fix only, no hardware acceleration |
| [PR #61](https://github.com/google/crc32c/pull/61) | cmake: Restrict CRC32C intrinsic check to aarch64 | Open (2023-06) | Low | ARM32 cross-compile bug; same class as PR #75; no maintainer response since 2024-09 |
| [PR #74](https://github.com/google/crc32c/pull/74) | PCLMULQDQ acceleration (x86 only) | Open (2026-05-02) | N/A for riscv64 | Provides x86 performance data; no RISC-V relevance |
| [PR #73](https://github.com/google/crc32c/pull/73) | ARM64 Windows MSVC support | Open (2026-03-25) | N/A for riscv64 | ARM64 Windows; no RISC-V relevance |
| [PR #65](https://github.com/google/crc32c/pull/65) | Fix ARM64 UBSan alignment violations | Merged (2024-09-06) | Medium (correctness under UBSan) | Resolved; no riscv64 equivalent to worry about (no riscv64 implementation exists) |

**Correctness bugs on riscv64.** None identified. The portable path has no known correctness defects on riscv64.

---

## 12. Objections and Upstream Blockers

**CLA requirement.** All external contributions require signing Google's CLA. PR #75 has been stalled since 2026-06-11 solely because the author has not signed. This is a hard automated gate; no maintainer review occurs until the CLA check passes.

**Maintainer bandwidth.** Victor Costan (pwnall) is the sole active maintainer with 64 of 82 commits. The project has not merged any PR since September 2024 (11 open PRs). Even after a CLA is signed, there is no guarantee of timely review.

**Scope of PR #75.** The only open RISC-V PR adds CMake build-system detection only -- it does not add hardware acceleration. Merging it is necessary but not sufficient for performance parity with x86 or ARM64.

**No RISC-V acceleration planned.** No issue, PR, or maintainer comment proposes Zbc/Zbkc CRC extension support or RVV acceleration. This gap is entirely unaddressed upstream.

**Project maintenance mode.** With 82 commits across 9 years and no merges since September 2024, the project is functionally dormant at the upstream level. Even correct patches face an indefinite wait.

**Acceptance probability for CMake detection patch (PR #75).** Low in the near term, absent CLA signature and maintainer engagement. Moderate if the author signs the CLA and pings pwnall directly, given the patch is low-risk and non-controversial.

**Acceptance probability for hardware acceleration (Zbc path).** No assessment possible; no such contribution has been proposed.

---

## 13. Investment Analysis

RISE has done no work on crc32c. There are no RISE blog posts, no RISE wheel-builder entries, and no RISE-sponsored PRs for this project.

### 13.1 Functional Enablement

The portable fallback already produces correct CRC32C on riscv64. There is no functional gap. The one actionable build-system fix (PR #75) is pending CLA resolution by a non-Qualcomm contributor; it can be nudged by encouraging the author or submitting an independent equivalent patch.

### 13.2 Performance Optimization

The RISC-V ISA provides Zbc/Zbkc extensions (`clmul`, `clmulr`, `clmulh`) for carry-less multiply, which can accelerate CRC32C. No implementation exists or is in progress. An equivalent of the ARM64 `vmull_p64` path using Zbc intrinsics would be the natural first contribution. RVV (RISC-V Vector) could provide additional throughput for large-buffer CRC computation.

However, crc32c is a checksum library used as a dependency. Its performance matters primarily to storage systems (Ceph, RocksDB, MySQL) that use it in hot I/O paths. The investment case depends on whether those dependent projects are deployment targets.

### 13.3 CI/CD Infrastructure

Adding a QEMU-based riscv64 CI job to `.github/workflows/build.yml` is straightforward (GitHub's `ubuntu-latest` runners support `qemu-user-static` for riscv64 cross-compiled tests). However, without upstream maintainer cooperation, such a CI change cannot be merged.

### 13.4 Ecosystem Enablement

The Python `crc32c` package on PyPI has no riscv64 wheel. Building and publishing a riscv64 wheel requires either upstream wheel builder integration or a fork-based distribution channel. The PyPI crc32c package uses the portable fallback on riscv64 when built from source; a wheel would just pre-package that.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Sign CLA and unblock or resubmit PR #75 (CMake detection) | 0.5 | External contributor nudge or internal patch | High |
| Performance | Implement Zbc/Zbkc CRC acceleration path (`crc32c_riscv.cc` + CMake dispatch) | 3-5 | Internal | Medium |
| Performance | Add RVV large-buffer acceleration (if Zbc path proves insufficient) | 2-3 | Internal | Low |
| CI/CD | Add QEMU riscv64 CI job to upstream build.yml | 0.5 | Internal (requires maintainer merge) | Medium |
| Ecosystem | Build and publish riscv64 PyPI wheel (if Python usage is a target) | 1 | Internal or RISE wheel builder | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/crc32c repository](https://github.com/google/crc32c)
- [PR #75 -- Add RISC-V target detection](https://github.com/google/crc32c/pull/75)
- [PR #74 -- PCLMULQDQ acceleration (x86)](https://github.com/google/crc32c/pull/74)
- [PR #73 -- ARM64 Windows MSVC support](https://github.com/google/crc32c/pull/73)
- [PR #65 -- Fix ARM64 UBSan alignment violations (merged 2024-09-06)](https://github.com/google/crc32c/pull/65)
- [PR #61 -- cmake: Restrict CRC32C intrinsic check to aarch64](https://github.com/google/crc32c/pull/61)
- [PR #43 -- ARM64 Darwin support](https://github.com/google/crc32c/pull/43)
- [google/crc32c CI workflow (.github/workflows/build.yml)](https://github.com/google/crc32c/blob/master/.github/workflows/build.yml)
- [PyPI crc32c 2.7.post0 JSON](https://pypi.org/pypi/crc32c/2.7.post0/json)
- [Ubuntu 24.04 (noble) python3-crc32c package](https://packages.ubuntu.com/noble/python3-crc32c)
- [Debian tracker -- crc32c packages](https://packages.debian.org/search?keywords=crc32c&searchon=names&suite=all&section=all)
- [Debian buildd status -- python3-crc32c riscv64 (sid)](https://buildd.debian.org/status/package.php?p=crc32c&suite=sid)
- [googletest issue #3756 -- GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [RISE Project member list](https://riseproject.dev)