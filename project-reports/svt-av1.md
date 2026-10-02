---
title: SVT-AV1
parent: Project Reports
color: orange
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: Valgrind
    relation: test-dependency
    criticality: optional
  - name: libaom
    relation: runtime-dependency
    criticality: critical
  - name: Intel safestringlib
    relation: runtime-dependency
    criticality: optional
  - name: fastfeat
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="svt-av1" %}

# SVT-AV1

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (optimization-absent)<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for SVT-AV1<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SVT-AV1 is a production AV1 video encoder (and decoder) originally developed by Intel in partnership with Netflix (2018-2019), formally adopted by the Alliance for Open Media (AOMedia) Software Implementation Working Group (SIWG) in August 2020. License is BSD-3-Clause Clear plus the AOMedia Patent License 1.0, copyright held by "Alliance for Open Media." The canonical repository is [gitlab.com/AOMediaCodec/SVT-AV1](https://gitlab.com/AOMediaCodec/SVT-AV1); a GitHub mirror exists at `AOMediaCodec/SVT-AV1` but carries no issues, PRs, or releases of its own.

**Governance:** No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists anywhere in the tree (the GitLab raw URL for `MAINTAINERS` returns 404). Governance is informal and working-group-based rather than a documented maintainer list. `CONTRIBUTING.md` states PRs go "to the maintainer" (singular, unnamed) and requires signing the AOMedia contributor license agreement. SIWG leadership per AOMedia press materials: co-chairs Ioannis Katsavounidis (Meta) and Xiang Li (Tencent); Software Coordinator Hassene Tmar (Intel at the time of the role's creation, commits now carry an `@fb.com` address, i.e. Meta).

**Corporate contributors (top commit-author counts from the full GitLab history; affiliations are best-effort inference from public reputation and email domains, not a declared roster, since SVT-AV1 publishes no corporate-sponsor list):**

| Contributor | Commits | Likely affiliation |
|---|---|---|
| Christopher Degawa | 895 | Independent/community (well-known AV1/FFmpeg contributor) |
| hguermaz | 350 | Unconfirmed |
| Salome Thirot | 310 | Unconfirmed (commonly associated with Arm's SVT-AV1 NEON/SVE work) |
| Worth | 290 | Unconfirmed |
| Sergey Sablin | 279 | Unconfirmed (commonly associated with Intel's SVT-AV1 team) |
| Hassene Tmar | 206 | Intel to Meta (SIWG Software Coordinator) |
| Joel Sole | 203 | Commonly associated with Meta/Facebook |
| Cidana-Developers / Cidana Developers | approximately 207 combined | Cidana (Chinese video-codec IP/semiconductor firm) |
| Xu Guangxin, L. Zhang / Li Zhang | 69-72 | Unconfirmed |
| Marvin Scholz | 49 | Independent (known multimedia/FFmpeg contributor) |

**Community culture on new ports:** No RISC-V-specific statement exists from maintainers or SIWG, positive or negative. `CONTRIBUTING.md` describes a standard open PR process (coding-guideline compliance, AOMedia contributor agreement, maintainer review, rebase-and-merge) with no architecture restrictions. The AArch64/NEON/SVE port was built up through sustained third-party contribution (notably Arm-affiliated engineers such as Salome Thirot) over multiple years rather than a single corporate initiative, suggesting the project is structurally receptive to a community-submitted architecture port, but there is no evidence of any active or requested RISC-V effort to date.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-05-17 (v0.5.0) | Initial public release, x86-64 only | [CHANGELOG.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/CHANGELOG.md) |
| 2022-01-16 | Debian first builds riscv64 package (v0.8.7+dfsg-1), generic C fallback only | [Debian buildd](https://buildd.debian.org/status/package.php?p=svt-av1) |
| 2025-02-08 | Issue #2239 opened by Fedora packager eclipseo: unconditional `libcpuinfo` build dependency blocks packaging for ppc64le, s390x, and "soon riscv64" | [GitLab issue #2239](https://gitlab.com/AOMediaCodec/SVT-AV1/-/issues/2239) |
| 2025-02-13 | Issue #2239 closed via merged MR !2384 ("cpuinfo: use FetchContent and make it more configurable"), introducing a `USE_CPUINFO` option (OFF/SYSTEM/LOCAL/AUTO) | [MR !2384](https://gitlab.com/AOMediaCodec/SVT-AV1/-/merge_requests/2384) |
| 2025-07-24 (v3.1.0) | `libcpuinfo` removed entirely (MR !2426, MR !2453); first release shipping the fix was v3.0.1 (2025-03-10) for the cpuinfo FetchContent change, full removal landed in v3.1.0 | [MR !2453](https://gitlab.com/AOMediaCodec/SVT-AV1/-/merge_requests/2453) |
| 2026-08-08 | Issue #2389 opened by wszqkzqk: proposal to add a Google Highway portable-SIMD tier covering non-x86/aarch64 platforms including RISC-V; author has a working prototype in a personal fork but no RVV hardware to test on | [GitLab issue #2389](https://gitlab.com/AOMediaCodec/SVT-AV1/-/issues/2389) |
| 2026-10-01 (present) | Issue #2389 remains open, zero linked merge requests, zero comments; no riscv-related commit, branch, or MR exists anywhere in upstream history | [GitLab MR search](https://gitlab.com/AOMediaCodec/SVT-AV1/-/merge_requests) |

**Key contributor for riscv64 work:** None on record for a merged contribution. The only two upstream GitLab items that mention riscv64 at all are issues, not merge requests: #2239 (closed, a generic packaging fix unrelated to RISC-V code) and #2389 (open, an unimplemented cross-architecture SIMD proposal whose author explicitly has no RVV hardware).

**Upstreaming status:** Not applicable. No RISC-V-specific code has ever been merged, proposed as a merge request, or opened as a branch. `git log --all --grep` across the complete history (all branches) for "riscv", "riscv64", "risc-v", "rv64", and "rvv" returns zero commits. The riscv64 builds that exist in Debian, Ubuntu, Alpine, Gentoo, Chimera Linux, and EESSI use the generic C fallback that has always been present for unrecognized architectures; this is not a port, it is the absence of any RISC-V-specific code being exercised correctly by a portable compiler.

## 3. Upstream Support Tier

SVT-AV1 has no formal tier-support policy document (no "tier" language anywhere in `CONTRIBUTING.md`, `STYLE.md`, or `Docs/`). `Docs/System-Requirements.md` states the encoder "primarily supports the x86 architecture with handwritten simd assembly code," while it "can be compiled and run on any architecture that a valid C99 compiler can target, with varying limited support for non-x86 CPUs." AArch64 is not formally named as a supported tier in that document despite the substantial, multi-year NEON/SVE/SVE2 investment visible in the source tree. RISC-V falls into the informal "limited support" (generic C) category alongside every other non-x86/non-ARM architecture.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named in System-Requirements.md | Yes (primary) | No (de facto) | No |
| Hand-tuned SIMD | Yes (SSE2 through AVX-512, NASM) | Yes (NEON, NEON_DOTPROD, NEON_I8MM, SVE, SVE2) | No |
| Cross-compile CI in upstream GitLab | N/A (native) | Yes (`.gitlab/workflows/linux/.gitlab-ci.yml`) | No |
| Toolchain file in `cmake/toolchains/` | N/A (native) | Yes (`aarch64_toolchain.cmake`, `android_aarch64_toolchain.cmake`) | No |
| Official upstream binary | No (source releases only) | No (source releases only) | No |
| Distro packages | Debian, Ubuntu, Arch, Gentoo | Debian, Ubuntu, Gentoo | Debian (sid, since 2022), Ubuntu (24.04 Noble, 26.04 resolute), Alpine, Chimera Linux, EESSI, Gentoo (~riscv testing) |
| Build mechanism | NASM + CMake SIMD dispatch | CMake SIMD dispatch, native or cross-toolchain | Generic `C_DEFAULT` fallback (neither `HAVE_X86_PLATFORM` nor `HAVE_ARM_PLATFORM` evaluates true) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

SVT-AV1 implements AV1 encoding in C with architecture-specific SIMD acceleration in separate subdirectories under `Source/Lib/`. There is no JIT and no garbage collector; all performance-critical dispatch is static, selected at CMake configure time via `HAVE_X86_PLATFORM` (`_M_X64`/`__x86_64__`) and `HAVE_ARM_PLATFORM` (`__aarch64__`/`_M_ARM64`) preprocessor checks in the top-level `CMakeLists.txt`. No `HAVE_RISCV_PLATFORM` or equivalent exists; when neither flag is set, the build falls straight through to the portable `C_DEFAULT` library with no `ARCH_*` macro defined and NASM/assembly never enabled.

`Source/Lib` directory listing (confirmed via the GitLab API, not the JS-rendered file-search UI) contains exactly: `ASM_ARM_CRC32`, `ASM_AVX2`, `ASM_AVX512`, `ASM_NEON`, `ASM_NEON_DOTPROD`, `ASM_NEON_I8MM`, `ASM_SSE2`, `ASM_SSE4_1`, `ASM_SSE4_2`, `ASM_SSSE3`, `ASM_SVE`, `ASM_SVE2`, `C_DEFAULT`, `Codec`, `Globals`. There is no `ASM_RISCV`/`ASM_RVV` directory and no RISC-V SIMD dispatch entry point. No `__riscv`, `riscv64`, or `RISCV` preprocessor guard appears anywhere in the codebase; no RVV intrinsics are present.

**Component analysis:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| DCT / transforms | Hand-tuned AVX2/AVX-512 (NASM) | NEON intrinsics + SVE/SVE2 | Scalar C (missing) |
| Convolution / interpolation | AVX2 intrinsics | NEON + SVE | Scalar C (missing) |
| SAD / variance | AVX2 | NEON + SVE | Scalar C (missing) |
| CDEF | AVX2 | NEON + SVE | Scalar C (missing) |
| Loop filter / deblocking | AVX2 | NEON | Scalar C (missing) |
| Quantization / encodetxb | AVX2 | NEON + SVE | Scalar C (missing) |
| Temporal filtering | AVX2 | NEON + SVE | Scalar C (missing) |
| Warp / affine motion | AVX2 | NEON + SVE | Scalar C (missing) |
| Intra / inter prediction, OBMC | AVX2 | NEON | Scalar C (missing) |
| Wiener / loop restoration | AVX2 | NEON + SVE | Scalar C (missing) |
| CPU feature detection | Bundled AOM x86 CPUID (`aom_ports/x86.h`, `#ifdef ARCH_X86_64`) | Bundled AOM ARM CPUID | Returns `flags=0`, falls to C |

**Pending/unmerged work that would fill this gap:** GitLab issue #2389 proposes a Google Highway (`google/highway`)-based portable-SIMD tier covering roughly 24 kernel families (~27.5k lines) across SAD, variance, sub-pixel variance, 8-bit/high-bit-depth convolve, compound prediction, OBMC, warped motion, intra prediction, CDEF, deblocking, loop restoration, temporal filtering, picture operators, forward/inverse transforms, and quantization. It is strictly additive (defaults OFF on x86/aarch64, compiled only with `-DENABLE_HIGHWAY=ON`), auto-enabled on other platforms if the Highway library is found, and falls back to C if not. The author measured 2.7-2.9x end-to-end speedup on a Loongson 3C5000L (LoongArch64, LSX/LASX) and 2.7x on Apple M4 Pro using `--asm hwy` versus `--asm c`, with per-kernel gains reaching parity with hand-written NEON on SAD/variance and within 1.3-1.6x on convolve/sub-pixel-variance kernels. These numbers are a LoongArch/aarch64 proxy only: the author states plainly "I don't have a device that supports RVV, so I haven't been able to test the performance of RVV." No merge request has been opened against upstream as of 2026-10-01 (API search of all MR titles/descriptions for "highway", "riscv", and "rvv" returns zero hits); the implementation exists only at [gitlab.com/wszqkzqk/SVT-AV1](https://gitlab.com/wszqkzqk/SVT-AV1) and [github.com/wszqkzqk/SVT-AV1-HWY](https://github.com/wszqkzqk/SVT-AV1-HWY).

## 5. Build System, Cross-Compilation, and Toolchain

**Existing toolchain files (`cmake/toolchains/`, confirmed via GitLab API directory listing):**

- `aarch64_toolchain.cmake` - sets `CMAKE_SYSTEM_PROCESSOR=aarch64`, uses `aarch64-linux-gnu-{gcc,g++,gcc-ar}`
- `android_aarch64_toolchain.cmake` - Android AArch64 variant
- `powerpc64le-linux-gnu.cmake` - sets `CMAKE_SYSTEM_PROCESSOR=ppc`, `CONFIG_RUNTIME_CPU_DETECT=0`

No `riscv64_toolchain.cmake` exists; `powerpc64le-linux-gnu.cmake` is the closest pattern for one.

**Generic (only documented) build commands**, from `Docs/Build-Guide.md`, which apply unmodified to riscv64 since neither architecture guard fires there:

```bash
git clone --depth=1 https://gitlab.com/AOMediaCodec/SVT-AV1.git
cd SVT-AV1/Build
cmake .. -G"Unix Makefiles" -DCMAKE_BUILD_TYPE=Release
make -j $(nproc)
sudo make install
```

or via the shell wrapper `Build/linux/build.sh release`. `-DCOMPILE_C_ONLY=ON` is not required on riscv64 (the arch-detect already yields a C-only build because neither `HAVE_X86_PLATFORM` nor `HAVE_ARM_PLATFORM` evaluates true) but is harmless to pass explicitly and protects against a future platform-detection change silently breaking the build. None of this is riscv64-documented by upstream; it is inferable from the CMake logic, not stated in any guide.

**Toolchain version requirements** (general project minimums from `Docs/Build-Guide.md`, none riscv64-specific): GCC 5.4.0 or later; CMake 3.16 or later (`cmake_minimum_required(VERSION 3.16...4.1)`); NASM 2.14 or later (x86 only, never invoked on riscv64 since it sits inside the `HAVE_X86_PLATFORM` branch); Clang-11 mentioned only as an Ubuntu install example. For riscv64 specifically, any GCC or Clang with `riscv64-linux-gnu` target support and valid C99 conformance is sufficient per `Docs/System-Requirements.md` [NEEDS VERIFICATION - no riscv64-specific compiler floor is documented anywhere upstream].

**QEMU:** Zero mentions anywhere in the repository (source, CMake, CI, Docs, Dockerfile). No documented cross-compilation or emulated-test workflow exists for riscv64 or any foreign architecture.

**Repo-root Dockerfile** (not riscv-specific, informational only): clones a third-party contributor fork (`gitlab.com/1480c1/SVT-AV1`, branch `thread_prio/warning`) rather than the canonical repo, builds a static x86 Alpine binary using `yasm`, with no `ARG`/multi-arch handling.

**Confirmed riscv64 build-log evidence** (Debian sid, v4.1.0+dfsg-1, built 2026-03-26 on `rv-osuosl-04`): `"Performing Test HAVE_X86_PLATFORM - Failed"`, `"Performing Test HAVE_ARM_PLATFORM - Failed"`, unrecognized x86 compiler flags such as `-mno-avx` rejected cleanly, all objects built with `-DEN_AVX512_SUPPORT=0`. Build time approximately 20 minutes; installed size 135.0 kB (small because no SIMD object layers are compiled in).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None identified. The `C_DEFAULT` path implements every encoding function; riscv64 produces correct AV1 bitstreams. No riscv64-specific correctness issue is on record in the upstream tracker.

**Performance gaps:** All encode-critical paths (DCT/transforms, SAD/variance, CDEF, convolution, prediction, quantization, temporal filtering, loop restoration) run as compiler-auto-vectorized scalar C on riscv64, versus hand-tuned AVX2/AVX-512 on x86 and NEON/SVE/SVE2 on arm64. No direct riscv64-vs-arm64 or riscv64-vs-amd64 SVT-AV1 benchmark exists in any accessible source (OpenBenchmarking.org's RISC-V page and SVT-AV1 test page returned HTTP 403 to automated fetch; no Phoronix article pairs "SVT-AV1" with "RISC-V"). The nearest quantified proxy is issue #2389's LoongArch/aarch64 Highway-tier data (Section 4): a 2.7-2.9x end-to-end speedup over the equivalent scalar-C baseline on non-x86/aarch64 hardware, with the caveat that this was never run on actual RVV silicon.

**Security hardening gaps:** Data not available - no riscv64-specific security-hardening analysis was found in any upstream source.

**Floating-point / NaN semantics:** No riscv64-specific floating-point issue is documented. An open floating-point FFT mismatch bug is MSVC/x86-only (Section 11) and unrelated to riscv64.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AV1 encode correctness | Yes | Yes | Yes (C fallback) |
| All presets (M0-M13) | Yes | Yes | Yes, but unaccelerated |
| Multi-threading | Yes | Yes | Yes |
| SIMD acceleration | Full (SSE2 through AVX-512) | Full (NEON through SVE2) | None |
| CPU feature detection | CPUID-based | CPUID-based | Returns 0 (no SIMD path selectable) |
| RTC / low-latency mode | Yes | Yes | Functional, not benchmarked |

## 7. CI/CD Infrastructure

No riscv64 CI exists anywhere in SVT-AV1's upstream pipeline. The following files were read directly (API and raw-file fetch, not the JS-rendered search UI) and confirmed to contain zero occurrences of "riscv"/"riscv64"/"risc-v"/"rv64"/"rvv":

- `.gitlab-ci.yml` (top level, includes and stage definitions)
- `.gitlab/workflows/common/.gitlab-ci.yml`
- `.gitlab/workflows/standard/.gitlab-ci.yml`
- `.gitlab/workflows/linux/.gitlab-ci.yml` - the "Linux (GCC)" job's full cross-compile matrix contains exactly three non-native targets: `aarch64-linux-gnu-gcc`, `powerpc64le-linux-gnu-gcc`, and Android aarch64. No riscv64 target.
- `.gitlab/workflows/macos/.gitlab-ci.yml`
- `.gitlab/workflows/windows/.gitlab-ci.yml`
- `.gitlab/workflows/bsd/.gitlab-ci.yml`
- `.gitlab/workflows/nightly/.gitlab-ci.yml`
- remote includes from `AOMediaCodec/aom-testing` (nightly and weekend-testing workflows)
- `cmake/toolchains/` (only `aarch64_toolchain.cmake`, `android_aarch64_toolchain.cmake`, `powerpc64le-linux-gnu.cmake` present)

The GitHub mirror has no `.github/` directory and no CI of any kind. No RISE CI runners are used anywhere in the pipeline, and no QEMU emulation step exists for any non-native architecture.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes | Yes (cross-compile) | No |
| Encode/decode test | Yes | Yes | No |
| QEMU emulation | No | No | No |
| Hardware runner | Yes (GitLab shared x86 runners) | Yes (cross-compile on x86 host) | No |
| RISE runner | No | No | No |
| Release-blocking | Yes | No (cross-compile only, not release-gating) | No |

## 8. Distribution and Release Status

**Upstream releases:** All GitLab releases (v4.1.0 and prior) ship source archives only (`.zip`, `.tar.gz`, `.tar.bz2`, `.tar`); the static release page content contains no "riscv64" string and no architecture-specific binary assets for any platform. SVT-AV1 is distributed as source and built downstream by distributions.

**PyPI:** No `svt-av1` package exists. `https://pypi.org/pypi/svt-av1/json` and `https://pypi.org/simple/svt-av1/` both return HTTP 404 (confirmed via both WebFetch and raw curl). This is expected: SVT-AV1 is a C/C++ codec library and CLI, not a Python package, so no PyPI presence should exist for any architecture.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/svt-av1/` redirects (HTTP 302) to the same 404 PyPI page. No riscv64 wheels exist because there is no upstream PyPI package to mirror.

**Distro packages:**

| Distribution | Version | riscv64 status | Notes |
|---|---|---|---|
| Debian sid | 4.1.0+dfsg-1 (continuously since v0.8.7, Jan 2022) | Installed | Built on `rv-osuosl-04`; approximately 20 min build time, 135.0 kB installed |
| Ubuntu 24.04 Noble | 1.7.0+dfsg-2build1 | Available | `libsvtav1enc1d1`, riscv64 explicitly listed |
| Ubuntu 26.04 resolute | 2.3.0+dfsg-1build1 | Available (confirmed) | Package page and download verified live: `svt-av1_2.3.0+dfsg-1build1_riscv64.deb`, 40666 bytes (39.7 kB), MD5 `2f1b13169ac51525e19a47dcd30f7ddf`, built for amd64/arm64/armhf/i386/ppc64el/riscv64/s390x in the `universe` component, `ports` archive |
| Alpine Linux (v3.22, community) | current | Available | Pure-C/no-ASM build |
| Chimera Linux | current | Available | `svt-av1-libs`, pure-C build |
| Gentoo | 4.1.0 | `~riscv` (testing, not stable) | All versions marked testing on riscv |
| EESSI software layer | 3.1.2 | Available | Module `SVT-AV1/3.1.2-GCCcore-14.3.0` (EESSI 2025.06); build-availability confirmation only, no performance data. A companion `EESSI/software-layer` GitHub PR #1733 packages it for riscv in that project's layer, independent of SVT-AV1's own release process |
| Arch Linux (x86_64 repo) | 4.1.0-1 | Not applicable | x86_64 only; `nasm` listed as build dependency |
| Arch Linux RISC-V (archriscv.felixc.at) | Unknown | Data not available | No working search/package-index endpoint reachable; absence from the FTBFS-only failures list is uninformative either way |

**What a user must do to get a working riscv64 binary:** Install from Debian or Ubuntu package repositories (both now confirmed, including the newer Ubuntu 26.04 resolute build), or from Alpine/Chimera/EESSI. All of these ship the unmodified upstream source built through the generic `C_DEFAULT` path, with no RISC-V-specific patches. No official upstream riscv64 binary exists; the alternative is cross-compiling from source with a `riscv64-linux-gnu` toolchain (no documented riscv64 build guide exists, see Section 5).

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| CMake | Build system | Critical | Yes - mature riscv64 support, no project-specific blocker | N/A | Ubuntu/Debian ship `cmake` on riscv64 | Minimum 3.16 per `CMakeLists.txt`; no riscv64-specific issue |
| glibc | Runtime (libc, pthreads, libm) | Critical | Yes - mature riscv64 port | Yes | Yes | Base toolchain component; no SVT-AV1-specific gap |
| googletest | Unit test framework | Optional | Builds (vendored copy under `third_party/googletest`; system `libgtest-dev` v1.17.0 also available on Debian riscv64) | Functional | N/A (test-only, not shipped) | No blocking issue |
| Valgrind | Suppresses AVX2 code paths under instrumentation (headers only) | Optional | Available - Valgrind has riscv64 support | Functional | Included | Irrelevant on riscv64 since no AVX2 path exists to suppress in the first place |
| libaom | CPU-feature detection and entropy-coding helper functions, vendored subset (`third_party/aom`, `third_party/aom_dsp`) | Critical | Builds - `aom_ports/x86.h` only compiled under `#ifdef ARCH_X86_64`; remainder is pure C | Functional | Included | This is a vendored subset, not the full upstream libaom package; the separate upstream libaom project (Debian sid `libaom` 3.13.1-2+b1) also builds on riscv64 |
| Intel safestringlib | Safe string functions, conditional fallback (`third_party/safestringlib`) | Optional | Builds - pure C | Functional | Included | No SIMD content, no riscv64 issue |
| fastfeat | FAST corner-detection helper (`third_party/fastfeat`) | Optional | Builds - pure C, no SIMD | Functional | Included | No riscv64 issue |

**Additional dependencies identified through research (not in the primary list above, included for completeness):**

| Dependency | Role | riscv64 status | Notes |
|---|---|---|---|
| NASM / YASM | x86-64 SIMD assembler (SSE2 through AVX-512) | Not required on riscv64 | Skipped entirely via the `HAVE_X86_PLATFORM` CMake guard; never invoked on riscv64 builds |
| libcpuinfo | CPU feature detection (formerly a build dependency) | Removed from the project entirely in v3.1.0 (2025-07-24) | Historically blocked riscv64/ppc64le/s390x packaging (issue #2239); resolved by MR !2384 (optional) then fully removed by MR !2453; no longer a dependency as of the current release |

**Summary:** No currently-blocking external dependency exists for SVT-AV1 on riscv64. The one historical blocker, `libcpuinfo`, was removed upstream in July 2025. The real external dependency surface for building SVT-AV1 is small (a C toolchain, CMake, and x86-only NASM) because googletest, libaom's vendored subset, safestringlib, and fastfeat are all bundled under `third_party/` rather than linked as system packages. The actual RISC-V gap for this project is encode performance (Section 4, Section 6), not dependency availability.

## 11. Known Bugs and Active Issues

**RISC-V-related issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2239](https://gitlab.com/AOMediaCodec/SVT-AV1/-/issues/2239) | Please only depend on libcpuinfo for aarch64 and x86_64 | Closed (2025-02-13) | Packaging blocker (historical) | Fedora packager report; resolved via MR !2384 then full removal in MR !2453 (v3.1.0); zero comments on the issue itself |
| [#2389](https://gitlab.com/AOMediaCodec/SVT-AV1/-/issues/2389) | Proposal: Add Google Highway portable-SIMD tier for non-x86/aarch64 platforms | Open (since 2026-08-08) | Performance enhancement, not a bug | De-facto RISC-V performance tracking issue; zero comments, zero linked merge requests, zero labels, zero upvotes as of 2026-10-01; author has no RVV hardware to validate against |

**Non-upstream packaging-level observation:** FreeBSD ports (`multimedia/svt-av1`) disabled LTO on riscv64 since an October 2021 commit by maintainer Jan Beich ("disable LTO on riscv64: Untested, but probably fixes build: ld: error: lto.tmp: cannot link object files with different floating-point ABI"), per [FreshPorts](https://www.freshports.org/multimedia/svt-av1/). This reflects a generic RISC-V toolchain LTO/floating-point-ABI linking bug class seen elsewhere (e.g. unrelated Fuchsia issue 339099402), not something tracked in SVT-AV1's own GitLab issue tracker.

**Open general correctness bugs (not riscv64-specific):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #2372 | RTC residual MT non-determinism at M12/M13 on high-motion content | Open | High | Not architecture-specific |
| #2373 | Uninitialised value during libheif fuzzing | Open | Medium | Not architecture-specific |
| #2355 | Data race in mode decision | Open | Medium | Not architecture-specific |
| #2354 | Load of misaligned address and left shift of negative value (ASAN) | Open | Medium | Not architecture-specific |
| #2348 | MSVC /fp:strict floating-point FFT mismatch | Open | Low (MSVC only) | x86/MSVC-only; not riscv64 |
| #2356 | Crash in `svt_aom_blend_a64_mask_avx2` | Open | Medium | x86-only (AVX2 path, inapplicable to riscv64) |

A GitLab API search of merge requests for "riscv", "rvv", and "highway" (title and description, all states) returns zero results. No open RVV-specific correctness bug exists because no RVV code has ever been submitted.

## 12. Objections and Upstream Blockers

**Stated objections:** None against a RISC-V port specifically. Issue #2239's Fedora packager noted "there is limited use for svt-av1 on other arch for which you do not provide ASM," reflecting the project's practical position that riscv64 is unoptimized but packageable, not that a RISC-V port would be rejected.

**Technical blockers:**

- No `HAVE_RISCV_PLATFORM` CMake detection exists. A contribution would need to add platform detection, a `cmake/toolchains/riscv64_toolchain.cmake`, and either a native hand-written `ASM_RVV` kernel set or the (currently unmerged) Highway-based portable tier proposed in #2389.
- All 10-plus SIMD functional units (DCT, CDEF, SAD/variance, loop filter, quantization, warp, prediction, restoration, temporal filtering) need RVV coverage to reach arm64 parity. The arm64 precedent (84 NEON files, 24 SVE files, built over multiple years with sustained Arm-affiliated contribution) sets the order-of-magnitude scope for a comparably competitive native port; the Highway route in #2389 claims to cover a similar surface (~24 kernel families) in a single additive tier instead.
- No riscv64 CI exists to catch regressions in any submitted code. Any RVV or Highway-tier contribution would need CI infrastructure (QEMU or RVV-capable hardware runners) to be accepted and maintained.

**Organizational blockers:**

- No RISE funding or involvement with SVT-AV1 is documented anywhere: the RISE blog (35 posts, 2024-05-15 through 2026-09-28, enumerated and checked in full), the RISE wheel builder index (87 packages), and all 26 `riseproject-dev` GitHub repositories (code and issue search) contain zero references to SVT-AV1, AV1, or video/image codecs. Neither SVT-AV1 nor AOMedia/Alliance for Open Media appears as a RISE member or named partner; RISE membership (8 Premier, 12 General member companies) is per-company, and none of those listed companies is publicly tied to SVT-AV1 contribution.
- AOMedia's contributor license agreement requirement in `CONTRIBUTING.md` means any RISC-V contribution requires corporate legal sign-off, raising the bar above a typical drive-by open-source PR.
- Issue #2389's author is an independent contributor without RVV hardware access, which caps what can be validated without a RISC-V vendor or RISE stepping in to provide hardware or review bandwidth.

**Acceptance probability:** Reasonably high for a correct, well-tested contribution backed by a credible vendor or sustained contributor, given the ARM precedent of third-party-driven NEON/SVE work being accepted over time, and given that #2389 is a strictly additive, opt-in tier with no risk to existing x86/aarch64 behavior. Low without that backing: the proposal has sat open for nearly two months with zero upstream engagement (zero comments, zero linked MR) as of 2026-10-01, and nobody with RVV hardware has yet validated it.

## 13. Readiness Assessment

- **Color:** orange (optimization-absent)
- **Release provider:** distro
- **Optimization level:** absent

SVT-AV1 has no upstream riscv64 CI (confirmed empty of "riscv" in `.gitlab-ci.yml` and every included workflow file: common, standard, linux, macos, windows, bsd, nightly) and zero RISC-V-specific code anywhere in its full commit history or `Source/Lib` tree (no `ASM_RISCV` directory, no RVV intrinsics). All hot paths (DCT, SAD/variance, CDEF, convolution, prediction, quantization) fall back to scalar C on riscv64 versus hand-tuned AVX2/AVX-512 and NEON/SVE/SVE2 elsewhere, per the architecture gating in [CMakeLists.txt](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/CMakeLists.txt). Debian (sid, continuously since 2022) and Ubuntu 26.04 resolute (`svt-av1` 2.3.0+dfsg-1build1, built for riscv64, per [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=SVT-AV1&suite=resolute)) build the unmodified upstream source with no riscv-specific patches, which alone would be a yellow clean-distro-build grade. However, because SVT-AV1's core value proposition is encode speed (a compression-library-speed case under the optimization-purpose test) and RISC-V optimization coverage is absent, the modifier caps the grade down to orange.

**Pending work that could change the grade:** GitLab issue #2389 (open since 2026-08-08) proposes a Google Highway-based portable-SIMD tier that would give RISC-V real vectorized kernels covering roughly 24 kernel families. The author measured 2.7-2.9x speedups using LoongArch/aarch64 as a proxy (no RVV hardware was available to test), and no merge request has been opened against upstream as of 2026-10-01; the implementation exists only in the author's personal fork. No RISE project involvement was found anywhere (blog, repositories, wheel builder, member list). If #2389 is merged with real RVV coverage of the primary kernels, the optimization gap would move from absent toward partial or full and the grade could rise.

## 14. Investment Analysis

RISE has no documented involvement with SVT-AV1; all work described below is currently uncovered by any funded effort.

### 14.1 Functional Enablement

The generic C fallback already builds and runs correctly on riscv64 and ships in multiple distributions (Debian, Ubuntu 24.04/26.04, Alpine, Chimera, EESSI). Functional enablement is complete; no work is required here. The historical `libcpuinfo` packaging blocker (issue #2239) was already resolved upstream in July 2025 at no RISE cost.

### 14.2 Performance Optimization

This is the dominant investment area. Every SIMD-accelerated encode path needs an RVV (or Highway-portable) equivalent. Two paths exist:

1. **Validate and upstream the existing #2389 Highway proposal.** The author has a largely complete implementation (~27.5k lines, ~24 kernel families) with correctness already checked against the C reference via gtest (5,740 passing tests cited) and byte-identical encoder output on LoongArch64 and aarch64. The principal gap is that it has never been run on real RVV hardware and has no merge request. Providing RVV-capable hardware and engineering time to validate, benchmark, and shepherd this through upstream review would be substantially cheaper than a from-scratch native port.
2. **A native hand-written `ASM_RVV` port**, following the arm64 precedent, prioritized by encode-time contribution: DCT/transforms first, then SAD/variance (motion estimation), then CDEF and loop filtering, then temporal filtering/prediction/quantization/restoration. The arm64 port (84 NEON + 24 SVE files, multi-year sustained contribution) sets the order-of-magnitude scope for a comparably competitive native effort.

Validating the Highway route first is the lower-risk, lower-cost option given that most of the engineering is already written and self-tested; it does not preclude a native RVV tier later for kernels where Highway's portable abstraction underperforms hand-tuned NEON (convolve and sub-pixel variance showed a 1.3-1.6x gap to NEON in the author's M4 Pro data).

### 14.3 CI/CD Infrastructure

riscv64 CI does not exist. Minimum viable CI is a riscv64 cross-compile job added to `.gitlab/workflows/linux/.gitlab-ci.yml` following the existing aarch64/powerpc64le pattern, plus a `cmake/toolchains/riscv64_toolchain.cmake` file. A QEMU-based smoke-test job would catch correctness regressions; a hardware RVV runner (SiFive, SpacemiT, or similar) would be needed for reliable performance-regression testing of whatever SIMD tier is eventually merged, and is also the prerequisite for validating issue #2389 at all.

### 14.4 Ecosystem Enablement

SVT-AV1 has no significant dependent package ecosystem of its own (no plugin registry, no extension marketplace; it is a standalone C library and CLI tool). Its downstream consumers (FFmpeg, libavif, GStreamer) have their own RISC-V status tracked in separate reports and are out of scope here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required (C fallback already correct and packaged) | 0 | N/A | N/A |
| Performance | Provide RVV hardware and validate/benchmark the existing #2389 Highway fork | 4-6 | RISC-V vendor / RISE | Critical |
| Performance | Shepherd #2389 through upstream review and merge (CI, docs, maintainer sign-off) | 3-5 | RISC-V vendor / RISE, with upstream maintainers | Critical |
| Performance | Native `ASM_RVV` kernels for paths that underperform the Highway tier (convolve, sub-pixel variance) | 8-12 | RISC-V vendor | Medium |
| Performance | Native `ASM_RVV` for remaining kernels, if the Highway tier is rejected or insufficient | 30-45 | RISC-V vendor | Low (contingent) |
| CI/CD | Add riscv64 cross-compile job to GitLab CI (`cmake/toolchains/riscv64_toolchain.cmake`, QEMU smoke test) | 2 | RISC-V vendor / RISE | High |
| CI/CD | Hardware riscv64 CI runner for performance-regression testing | 3-4 | RISE or silicon vendor | High |

Total estimated effort to validate and land the #2389 Highway tier plus baseline CI: approximately 12-17 person-weeks, substantially less than a from-scratch native RVV port (30-45 additional person-weeks) because most of the Highway implementation already exists and is self-tested; it simply needs RVV hardware access and upstream engagement, neither of which currently exists.

## 15. References

- [SVT-AV1 canonical repository (GitLab)](https://gitlab.com/AOMediaCodec/SVT-AV1)
- [SVT-AV1 GitHub mirror](https://github.com/AOMediaCodec/SVT-AV1)
- [GitLab issue #2239 - libcpuinfo riscv64 packaging blocker](https://gitlab.com/AOMediaCodec/SVT-AV1/-/issues/2239)
- [MR !2384 - cpuinfo FetchContent/USE_CPUINFO option](https://gitlab.com/AOMediaCodec/SVT-AV1/-/merge_requests/2384)
- [MR !2453 - libcpuinfo removal](https://gitlab.com/AOMediaCodec/SVT-AV1/-/merge_requests/2453)
- [GitLab issue #2389 - Google Highway portable-SIMD tier proposal](https://gitlab.com/AOMediaCodec/SVT-AV1/-/issues/2389)
- [wszqkzqk/SVT-AV1 Highway fork (GitLab)](https://gitlab.com/wszqkzqk/SVT-AV1)
- [wszqkzqk/SVT-AV1-HWY (GitHub)](https://github.com/wszqkzqk/SVT-AV1-HWY)
- [GitLab releases page](https://gitlab.com/AOMediaCodec/SVT-AV1/-/releases)
- [CMakeLists.txt (architecture gating)](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/CMakeLists.txt)
- [Debian buildd riscv64 build status for svt-av1](https://buildd.debian.org/status/package.php?p=svt-av1&suite=sid)
- [Ubuntu 24.04 Noble package: svt-av1](https://packages.ubuntu.com/noble/svt-av1)
- [Ubuntu 26.04 resolute package search: SVT-AV1](https://packages.ubuntu.com/search?keywords=SVT-AV1&suite=resolute)
- [Ubuntu 26.04 resolute riscv64 download: svt-av1_2.3.0+dfsg-1build1_riscv64.deb](https://packages.ubuntu.com/resolute/riscv64/svt-av1/download)
- [Debian tracker: svt-av1](https://tracker.debian.org/pkg/svt-av1)
- [Alpine Linux svt-av1 riscv64 package](https://pkgs.alpinelinux.org/package/v3.22/community/riscv64/svt-av1)
- [EESSI RISC-V software page for SVT-AV1](https://www.eessi.io/docs/available_software_riscv/detail/SVT-AV1/)
- [FreshPorts multimedia/svt-av1 (riscv64 LTO disabled)](https://www.freshports.org/multimedia/svt-av1/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [SVT-AV1 ARM Build Guide](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/ARM-Build-Guide.md)
- [SVT-AV1 Build Guide](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/Build-Guide.md)
- [SVT-AV1 System Requirements](https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/System-Requirements.md)