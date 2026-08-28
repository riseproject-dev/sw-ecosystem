---
title: libultrahdr
---

# libultrahdr

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for libultrahdr<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[libultrahdr](https://github.com/google/libultrahdr) is a C++ library implementing the Ultra HDR image format (ISO 21496-1), which encodes a gain map alongside a base JPEG to allow display-adaptive HDR rendering. It is the reference implementation used in Android for HDR still-image capture and display.

The project is hosted under the `google` GitHub organization with no independent foundation. There is no MAINTAINERS, OWNERS, or CODEOWNERS file, and no formal platform tier policy document. The README lists supported platforms as Android, Linux, macOS, and Windows; RISC-V is not listed. The license is dual MIT and Apache 2.0.

Effective control of the codebase rests with two organizations:

- **Google:** Dichen Zhang (`DichenZhang1`, dichenzhang@google.com) -- 184 commits, merges PRs, acts as the gating reviewer.
- **Ittiam Systems** (acquired by Google in 2019): `ram-mohan` (ram.mohan@ittiam.com, 183 commits), `harishdm` (Harish Mahendrakar, 32 commits), and several others -- lead SIMD optimization work including all existing NEON paths.
- **Arm:** `cmacdonald-arm` (7 commits), `georges-arm` / George Steed (george.steed@arm.com, 3 commits) -- contributed AArch64 NEON optimizations.

In practice this is a Google/Ittiam joint project. Google is a Premier Member of the RISE project, but libultrahdr itself is not listed as a RISE member project and receives no RISE-sponsored work.

The maintainers' stated preferences for new architecture SIMD contributions are: (a) implementations must cover both rv32 and rv64, (b) fixed-point (integer) implementations are preferred over floating-point intrinsics on performance grounds, and (c) code must pass clang-format. These norms were articulated by `ram-mohan` in response to [PR #330](https://github.com/google/libultrahdr/pull/330).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2024-09-16 | [PR #273](https://github.com/google/libultrahdr/pull/273) opened by community contributor `Xeonacid`: riscv64 cmake toolchain file, CMakeLists.txt detection, and build docs | GitHub PR |
| 2024-09-18 | PR #273 merged by `DichenZhang1` (Google) -- first RISC-V support; baseline `rv64gc` scalar only | GitHub PR, merged_at |
| 2024-09-20 | riscv64 compile support ships in [v1.2.0](https://github.com/google/libultrahdr/releases/tag/v1.2.0) | GitHub Releases |
| 2024-11-08 | [PR #324](https://github.com/google/libultrahdr/pull/324) opened by `lhpqaq`: riscv32 cmake toolchain, following up `ram-mohan`'s request in PR #273 | GitHub PR |
| 2024-11-14 | PR #324 merged -- riscv32 baseline support | GitHub PR, merged_at |
| 2024-11-20 | [PR #330](https://github.com/google/libultrahdr/pull/330) opened by `lhpqaq`: initial RVV intrinsics for gainmap math | GitHub PR |
| 2024-12-02 | [PR #334](https://github.com/google/libultrahdr/pull/334) opened by `lhpqaq`: RVV `transformYuv420` and YUV color gamut conversion, tested under QEMU | GitHub PR |
| 2024-12-04 | PR #330 closed without merge -- `ram-mohan` stated "We are not working on this path currently" and requested closure | GitHub PR comments |
| 2024-12-09 | `ram-mohan` commented on PR #334: "yes changes look good to me" -- but no formal review submitted; PR remains stalled | GitHub PR comments |
| 2024-12-18 | [PR #341](https://github.com/google/libultrahdr/pull/341) opened by `lhpqaq` (draft): RVV `transformYuv444` and `ConvertRgba8888ToYuv444`, explicitly blocked on PR #334 | GitHub PR |
| 2026-07-18 | `libultrahdr-2.0.2-1-riscv64.pkg.tar.zst` built and published in Arch Linux RISC-V community port | archriscv.felixc.at extra.db |
| 2026-08 (current) | PR #334 and PR #341 remain open with no merge activity; no RVV code in main branch | GitHub PR |

The riscv64 port was initiated by community contributors, not by Google or Ittiam. All merged RISC-V work is build-system only. No RISC-V SIMD code has ever shipped in a release.

---

## 3. Upstream Support Tier

There is no formal platform tier policy document (no PLATFORMS.md, SUPPORT.md, or equivalent). Support tier is inferred from observable evidence.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Listed in README supported platforms | Yes | Yes (Android + Linux) | No |
| CI on every commit | Yes | Yes (Android) | No |
| CI daily regression | Yes | Yes (macOS arm64) | No |
| Official release binaries | No (source-only releases) | No | No |
| SIMD intrinsics in tree | None (x86 SSE/AVX absent too) | Yes (NEON, ~1,600 LOC) | No |
| Cross-compilation toolchain file | N/A (native) | N/A (native or NDK) | Yes (`cmake/toolchains/riscv64-linux-gnu.cmake`) |
| Packaged in major distros | Ubuntu, Debian (data not available: package search returned 0 results for both) | Same | Arch Linux RISC-V only |

riscv64 is a community-supported tier: it compiles and scalar correctness is expected, but there is no CI, no test gating, and no release artifact. amd64 is the primary development and test platform. arm64 (AArch64) is the only architecture with shipping SIMD acceleration.

Note: neither amd64 nor riscv64 has architecture-specific SIMD code in tree (x86 SSE/AVX intrinsics are also absent). All SIMD is NEON on AArch64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libultrahdr's performance-critical paths are in the DSP layer under `lib/src/dsp/`. The directory currently contains only one architecture subdirectory: `arm/`. There is no `riscv/` subdirectory in the main branch.

**Architecture-specific components:**

| Component | File(s) | amd64 | arm64 | riscv64 |
|-----------|---------|-------|-------|---------|
| Gain map math (float multiply-accumulate, color conversion) | `dsp/arm/gainmapmath_neon.cpp` (473 LOC) | Scalar C++ | NEON intrinsics (AArch64) | Scalar C++ fallback |
| Image editor helpers (mirror, rotate, resize) | `dsp/arm/editorhelper_neon.cpp` (1,064 LOC) | Scalar C++ | NEON intrinsics (AArch64) | Scalar C++ fallback |
| YUV420 transform | Part of gainmapmath | Scalar C++ | NEON (in tree) | PR #334 (open, unmerged) -- RVV intrinsics, vlen=128, RVV v1.0 |
| YUV444 transform | Part of gainmapmath | Scalar C++ | NEON (in tree) | PR #341 (draft, unmerged) |
| RGBA8888 to YUV444 | Part of gainmapmath | Scalar C++ | NEON (in tree) | PR #341 (draft, unmerged) |
| JPEG encode/decode | Delegated to libjpeg-turbo | libjpeg-turbo SIMD | libjpeg-turbo NEON | libjpeg-turbo scalar (RVV not in stable releases) |

**ISA baseline for riscv64:** `-march=rv64gc -mabi=lp64d` -- the G+C general-purpose baseline. The V extension (RVV) is not in the baseline compile flags. The pending PRs would require `-march=rv64gcv` or a similar flag to activate RVV compilation.

**SIMD dispatch mechanism:** `CMakeLists.txt` lines 616-618 add the NEON source files only when `ARCH STREQUAL "arm" OR ARCH STREQUAL "aarch64"`. There is no `elseif` branch for `riscv64`. Setting `UHDR_ENABLE_INTRINSICS=ON` (the default) has zero effect on riscv64.

**Total riscv64 SIMD code in tree:** 0 lines. The pending PRs would add approximately 800 lines of RVV C intrinsics covering a subset of the gainmap math functions.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Requirements:**
- CMake >= 3.15
- C++17-capable cross compiler: `gcc-riscv64-linux-gnu` / `g++-riscv64-linux-gnu` from apt (GCC 11+ on Ubuntu 22.04+)
- Ninja (recommended)
- No NASM/Yasm required (those are x86-only for libjpeg-turbo SIMD; riscv64 has no SIMD to assemble)

**Cross-compilation command (from `docs/building.md`):**

```sh
sudo apt install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
git clone https://github.com/google/libultrahdr.git
cd libultrahdr && mkdir build_directory && cd build_directory
cmake -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchains/riscv64-linux-gnu.cmake \
  -DUHDR_BUILD_DEPS=1 \
  ../
ninja
```

`-DUHDR_BUILD_DEPS=1` is required for cross-compilation. It auto-fetches libjpeg-turbo 3.1.0 and libheif and builds them for the target. Without it, the build would require pre-installed riscv64 dev packages for those libraries, and the install target is disabled during cross-compilation regardless.

**Toolchain file** (`cmake/toolchains/riscv64-linux-gnu.cmake`): sets `CMAKE_SYSTEM_NAME=Linux`, `CMAKE_SYSTEM_PROCESSOR=riscv64`, uses `riscv64-linux-gnu-{gcc,g++,as}`, and sets all `CMAKE_FIND_ROOT_PATH_MODE_*` to ONLY to prevent host library contamination.

**Running tests on a build host** requires `qemu-riscv64-static` (not documented in `docs/building.md`, not present in any CI workflow):

```sh
sudo apt install qemu-user-static
qemu-riscv64-static ./ultrahdr_unit_test
```

No Dockerfiles exist in the repository. There are no container-based cross-compilation recipes.

**Known build issue:** None documented for riscv64. The `WITH_SIMD=0` flag is only passed to libjpeg-turbo for EMSCRIPTEN builds; for riscv64 cross-compilation, libjpeg-turbo's CMake will probe for SIMD and fall back to scalar C cleanly since no riscv64 SIMD is in the libjpeg-turbo 3.1.0 stable release.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Build and link | Yes | Yes | Yes (rv64gc baseline, cross-compile only) |
| Encode UltraHDR (API-0, API-1) | Yes, scalar | Yes, partial SIMD (NEON) | Yes, scalar only |
| Decode UltraHDR | Yes, scalar | Yes, partial SIMD (NEON) | Yes, scalar only |
| Gain map math (core HDR workload) | Scalar C++ | NEON intrinsics | Scalar C++ fallback |
| Image editing (mirror, rotate, resize) | Scalar C++ | NEON intrinsics | Scalar C++ fallback |
| YUV420 transform | Scalar C++ | NEON intrinsics | Scalar (RVV in PR #334, unmerged) |
| YUV444 transform | Scalar C++ | NEON intrinsics | Scalar (RVV in PR #341, unmerged, draft) |
| HEIF container encode/decode | Yes (via libheif with local patch) | Yes | Yes (same code path) |
| JPEG encode/decode throughput | libjpeg-turbo x86 SIMD | libjpeg-turbo NEON | libjpeg-turbo scalar (RVV not in stable) |
| CI-verified correctness | Yes | Yes | No |
| GPU acceleration (GLES) | No (UHDR_ENABLE_GLES=OFF default) | No | No |

**Functional gaps:** None. All APIs compile and execute on riscv64 using scalar C++ fallbacks. There are no missing code paths that prevent functionality.

**Performance gaps:** All SIMD-accelerated code runs as scalar on riscv64. The NEON-accelerated layer covers gain map math and image editing (~1,600 LOC of intrinsics). No benchmark data exists comparing riscv64 scalar throughput to arm64 NEON throughput on real hardware.

**Numerical accuracy:** PR #334 documents that the RVV `transformYuv420` path produces Y-channel output that differs by up to 2 counts from the scalar reference, requiring `EXPECT_NEAR(..., 2)` tolerance in the unit test (vs. exact equality for the scalar reference). This is the only known numerical deviation for any riscv64 path, and it is in unmerged code.

**Security hardening gaps:** Data not available -- no audit of compiler hardening flags (stack protector, CFI, shadow call stack) specific to riscv64 was found in the research.

---

## 7. CI/CD Infrastructure

All 7 workflow files in `.github/workflows/` were read in full. The verdict is unambiguous.

| Workflow file | Triggers | Architectures tested |
|---------------|----------|----------------------|
| `cmake_linux.yml` | push, pull_request | ubuntu-latest (x86_64) only, 9 matrix entries |
| `cmake_android.yml` | push, pull_request | armeabi-v7a, arm64-v8a, x86, x86_64 |
| `cmake_mac.yml` | push, pull_request | arm64, x86_64 |
| `cmake_win.yml` | push, pull_request | Windows x86_64 |
| `daily-regression.yml` | schedule (daily), workflow_dispatch | ubuntu-latest x4, macos-14, windows-latest |
| `cifuzz.yml` | pull_request | ubuntu-latest (x86_64) |
| `verify_release_tag.yml` | push, PR | ubuntu-latest |

A full `grep` for "riscv" across all 7 files returned zero matches. The cross-compilation toolchain file `cmake/toolchains/riscv64-linux-gnu.cmake` exists in the repository but is never invoked by any CI workflow. There is no QEMU-based riscv64 testing, no native riscv64 runner, and no cross-compilation job in any workflow.

| CI criterion | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| Build CI on every PR | Yes | Yes (Android NDK) | No |
| Daily regression CI | Yes | Yes (macOS arm64) | No |
| Test execution in CI | Yes | No (cross-compile only in Android workflow) | No |
| RISE CI runners | No | No | No |

No RISE CI infrastructure is used. There are no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` files in the repository.

---

## 8. Distribution and Release Status

All 10 releases (v1.1.0 through v2.0.2) were checked via the GitHub API. Every release has `assets: []` -- no binary artifacts of any kind are attached to any release. This applies to all architectures, not just riscv64. The project distributes source only.

| Distribution channel | riscv64 status | Notes |
|----------------------|---------------|-------|
| GitHub Releases | Not available | Source-only releases; no binaries for any arch |
| Ubuntu 24.04 (noble) | Not packaged | packages.ubuntu.com search returned zero results |
| Debian | Not packaged | tracker.debian.org returns 404; packages.debian.org search returned zero results |
| PyPI | Not applicable | pypi.org/pypi/libultrahdr returns 404; this is a C++ library |
| Arch Linux RISC-V (archriscv.felixc.at) | Available | `libultrahdr-2.0.2-1-riscv64.pkg.tar.zst`, built 2026-07-18, packager: Felix Yan, matches current upstream v2.0.2 |
| RISE wheel builder | Not applicable | C++ library; not on RISE package list |

To obtain a working riscv64 binary today, a user must either cross-compile from source using the documented cmake toolchain, or use the Arch Linux RISC-V community port. There is no path to a binary from Ubuntu, Debian, or any major enterprise Linux distribution.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| libjpeg-turbo (required, fetched at 3.1.0 with UHDR_BUILD_DEPS=1) | JPEG encode/decode; all primary image and gainmap I/O | Builds; scalar C path | No upstream riscv64 CI | No official riscv64 binaries (Issue #885 refused) | RVV SIMD exists in tree since Feb 2026 but only in unreleased 3.2; DCT float test gap (Issue #710 workaround incomplete for riscv64); distro packages carry 2.1.5 or 3.1.3 -- scalar only |
| libheif (optional, default ON via UHDR_ENABLE_HEIF, fetched at commit 4a3f74bc) | HEIF/AVIF container encode/decode | Builds; no arch-specific SIMD in libheif itself | No riscv64 CI in libheif workflows | No riscv64 releases | libultrahdr requires a local patch (`libheif_pr1503.patch`) for ISO 21496-1 gain map API not yet in a libheif stable release; adds ongoing maintenance burden |
| libsmpte2094-50 (optional, default OFF, v0.1.4) | HDR10+ metadata parsing; pure C, no SIMD | Builds | No riscv64-specific issues found | N/A | No blocking issues |
| image_io (vendored in third_party/) | Google image I/O abstraction for tests/samples; pure C++ | Builds | No riscv64-specific issues | N/A (vendored) | No blocking issues |
| googletest (v1.14.0, test-only, default OFF) | Unit test framework | Builds | No riscv64-specific issues | N/A | No blocking issues |
| google/benchmark (v1.8.3, benchmark-only, default OFF) | Micro-benchmark framework | Builds | No riscv64-specific issues | N/A | No blocking issues |

**Deep-dive: libjpeg-turbo on riscv64**

This is the most significant transitive dependency for riscv64 performance. libjpeg-turbo handles all JPEG I/O, which is the primary encode/decode path for UltraHDR content.

The upstream libjpeg-turbo repository has a `simd/riscv64/` directory (18 files) implementing colorspace conversion, DCT/IDCT, sampling, and quantization via RVV C intrinsics, merged February 2026 (commit 9817c40). However:

- This code is not in any stable libjpeg-turbo release as of the research date -- it targets the unreleased 3.2 series.
- When libultrahdr builds libjpeg-turbo 3.1.0 via `UHDR_BUILD_DEPS=1`, it fetches 3.1.0 which has no RVV code.
- The configure-time probe for `-march=rv64gcv` falls back to scalar C if the toolchain lacks RVV support.
- Issue #710 in libjpeg-turbo (filed 2023): 2/590 float DCT tests fail on QEMU due to FMA rounding differences; workaround disables FLOATTEST8 on non-x86 but no correct expected MD5s for riscv64 were committed. This indicates the riscv64 scalar path has a known test gap even in stable releases [NEEDS VERIFICATION: whether this gap affects production correctness or only test infrastructure].
- Issue #885 (May 2026, open): request for official riscv64 release binaries was closed as "won't implement."

In practice: JPEG throughput on riscv64 with the bundled libjpeg-turbo 3.1.0 is fully scalar.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [PR #334](https://github.com/google/libultrahdr/pull/334) | Yuv color gamut conversion and transformYuv420 using Risc-V Vector | Open, stalled since Dec 2024 | Medium | Y-channel rounding tolerance of 2 vs scalar reference; QEMU-only testing |
| [PR #341](https://github.com/google/libultrahdr/pull/341) | add transformyuv444 and rgba8888 to yuv444 conversion using rvv | Open (draft), blocked on #334 | Low | No review activity; depends on #334 merging first |
| [Issue #382](https://github.com/google/libultrahdr/issues/382) | CTest failed on s390x architecture in Fedora 44 | Open | Low (riscv64-indirect) | Big-endian ICC endianness bug; not riscv64-specific since riscv64 is little-endian; signals that non-x86 correctness testing has gaps |
| [Issue #383](https://github.com/google/libultrahdr/issues/383) | Remove platform and architecture detection logic | Open | Low | If merged, could remove `-march=rv64gc` flags; would affect riscv64-specific compilation |

**Correctness bugs specific to riscv64:** The Y-channel tolerance widening in PR #334 is the only documented numerical deviation. It is in unmerged code, tested only under QEMU emulation, and the delta of 2/255 is below typical perceptual visibility thresholds. It is not a blocking correctness defect but should be resolved before any RVV path ships.

No NaN, floating-point exception, or signal-handling bugs specific to riscv64 are filed anywhere in the upstream tracker. Zero riscv64-specific issues were found via `gh search issues "riscv64 repo:google/libultrahdr"` and `gh search issues "riscv repo:google/libultrahdr"`.

---

## 12. Objections and Upstream Blockers

**Stated objections (on record):**

1. **"We are not working on this path currently"** -- `ram-mohan` (Ittiam/Google) in [PR #330](https://github.com/google/libultrahdr/pull/330) comments, 2024-11-22. This explicitly states that Google and Ittiam have no internal plan to develop RVV intrinsics for libultrahdr.

2. **Preference for fixed-point over floating-point intrinsics** -- same comment. `ram-mohan` stated that integer implementations are preferred over float intrinsics on performance grounds. PR #334 uses RVV float intrinsics, which may require rework if this preference is enforced.

3. **Both rv32 and rv64 must be covered** -- same comment. Community PRs covering only one width have been asked to expand scope.

4. **Pending internal refactoring** -- in [PR #334](https://github.com/google/libultrahdr/pull/334) comments (2024-12-03), `ram-mohan` wrote "please wait on further development as we working on some refactoring which may affect some of the changes you are making." This has left PR #334 in limbo since December 2024 -- the refactoring status is unknown.

**Technical blockers:**

1. No riscv64 CI -- any merged RVV patch has no automated regression guard. A regression could ship undetected.
2. PR #334 requires a tolerance widening for Y-channel output. The maintainer would need to accept this semantic difference or the contributor would need to resolve it.
3. PR #334 is tested only under QEMU (vlen=128). No data from real RVV hardware (SpacemiT K1, Alibaba T-Head, SiFive P870) exists.

**Organizational blockers:**

1. The sole gating reviewer is `DichenZhang1` (Google). `ram-mohan` approves but does not merge. If DichenZhang1 is occupied with internal priorities, community PRs can stall indefinitely -- PR #334 has been waiting nine months with no formal review despite positive informal feedback.
2. Google has no stated deadline or roadmap for RISC-V support in libultrahdr.

**Acceptance probability:** The baseline scalar port (PR #273) was accepted in two days, indicating the project will accept well-structured build-system contributions. RVV SIMD contributions face a higher bar: Google/Ittiam are not prioritizing it themselves, have preferences on implementation style (fixed-point), and require dual rv32/rv64 coverage. A well-structured external contribution meeting all stated requirements has a reasonable chance of acceptance, but the timeline is unpredictable given the nine-month stall on PR #334.

---

## 13. Investment Analysis

The RISE project has no prior or ongoing involvement with libultrahdr (confirmed by blog scan, wheel builder list, and GitHub org search). No RISE-funded work needs to be accounted for.

### 13.1 Functional Enablement

All APIs function on riscv64 today via scalar fallbacks. There are no missing code paths. Functional enablement is complete.

### 13.2 Performance Optimization

The entire SIMD layer (gain map math, image editing, YUV transforms) runs as scalar C++ on riscv64. The arm64 NEON layer covers approximately 1,600 LOC of intrinsics. Two community PRs (#334, ~800 LOC; #341, ~700 LOC additional) cover a subset of gainmap math with RVV. The editor helper functions (`editorhelper_neon.cpp`, 1,064 LOC) have no RVV equivalent even in open PRs.

The most impactful dependency optimization is in libjpeg-turbo, which handles all JPEG I/O. The RVV implementation there targets the unreleased 3.2 series; pinning libultrahdr's bundled dependency to a 3.2 pre-release would provide JPEG SIMD on riscv64 today.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding a QEMU-based cross-compilation and test job to `cmake_linux.yml` or `daily-regression.yml` would close the regression gap. Without CI, any merged RVV code has no automated validation.

### 13.4 Ecosystem Enablement

libultrahdr is a C++ library with no Python/npm/Maven ecosystem. Distro packaging is the primary distribution path. It is absent from Ubuntu and Debian; adding Debian packaging would unlock Ubuntu. The Arch Linux RISC-V community port is current and maintained.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Performance | Drive PR #334 to merge: resolve Y-channel rounding, potentially convert to fixed-point per maintainer preference, add rv32 coverage | 3-4 | Contributor + upstream engagement | High |
| Performance | Implement RVV for editor helpers (`editorhelper_neon.cpp`, no open PR exists) | 4-6 | New contribution | High |
| Performance | Pin or patch `UHDR_BUILD_DEPS` libjpeg-turbo to 3.2 pre-release to get JPEG RVV SIMD | 1-2 | Contributor | Medium |
| Performance | Drive PR #341 to merge (after #334): YUV444 and RGBA8888->YUV444 RVV | 1-2 | Follow-on to #334 | Medium |
| CI/CD | Add QEMU-based riscv64 cross-compile and test job to `cmake_linux.yml` | 1 | Contributor | High |
| Performance | Benchmark RVV paths on real RVV hardware (SpacemiT K1 or equivalent) and publish numbers | 1-2 | Lab work | Medium |
| Distribution | File and maintain Debian `libultrahdr` package (ITP bug, packaging work) | 3-4 | Debian maintainer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [PR #273: add riscv64 compile support](https://github.com/google/libultrahdr/pull/273)
- [PR #324: Add riscv32 compile support](https://github.com/google/libultrahdr/pull/324)
- [PR #330: Add support for RISC-V Vector extension (closed)](https://github.com/google/libultrahdr/pull/330)
- [PR #334: Yuv color gamut conversion and transformYuv420 using Risc-V Vector](https://github.com/google/libultrahdr/pull/334)
- [PR #341: add transformyuv444 and rgba8888 to yuv444 conversion using rvv (draft)](https://github.com/google/libultrahdr/pull/341)
- [Issue #382: CTest failed on s390x architecture in Fedora 44](https://github.com/google/libultrahdr/issues/382)
- [Issue #383: Remove platform and architecture detection logic](https://github.com/google/libultrahdr/issues/383)
- [libultrahdr releases (v1.1.0 through v2.0.2)](https://github.com/google/libultrahdr/releases)
- [Arch Linux RISC-V extra repository database (archriscv.felixc.at)](https://archriscv.felixc.at/repo/extra/extra.db.tar.gz)
- [cmake/toolchains/riscv64-linux-gnu.cmake](https://github.com/google/libultrahdr/blob/main/cmake/toolchains/riscv64-linux-gnu.cmake)
- [cmake/toolchains/riscv32-linux-gnu.cmake](https://github.com/google/libultrahdr/blob/main/cmake/toolchains/riscv32-linux-gnu.cmake)
- [docs/building.md](https://github.com/google/libultrahdr/blob/main/docs/building.md)
- [CMakeLists.txt (riscv64 arch detection, lines 51-54, 313-318, 616-618)](https://github.com/google/libultrahdr/blob/main/CMakeLists.txt)
- [.github/workflows/cmake_linux.yml](https://github.com/google/libultrahdr/blob/main/.github/workflows/cmake_linux.yml)
- [.github/workflows/daily-regression.yml](https://github.com/google/libultrahdr/blob/main/.github/workflows/daily-regression.yml)
- [.github/workflows/cmake_android.yml](https://github.com/google/libultrahdr/blob/main/.github/workflows/cmake_android.yml)
- [RISE Project member list](https://riseproject.dev)
- [libjpeg-turbo Issue #710: float DCT test failures on QEMU](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710)
- [libjpeg-turbo Issue #885: request for riscv64 release binaries](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)