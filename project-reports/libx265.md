---
title: libx265
parent: Project Reports
color: yellow
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: libvmaf
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libx265" %}

# libx265

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for libx265<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION]. Where live research contradicts itself or an earlier finding, both are cited.

## 1. Project Overview

libx265 is an open-source H.265/HEVC video encoder library and CLI tool. It is the reference software implementation used by FFmpeg, HandBrake, VLC, and most Linux distribution multimedia stacks for HEVC encoding. Performance is the defining characteristic of the project: the bulk of the codebase is SIMD-accelerated for x86 (SSE2 through AVX-512, via NASM), AArch64 (NEON, SVE, SVE2), POWER (AltiVec), and LoongArch64 (LSX/LASX). The C scalar paths exist as reference/fallback implementations for architectures or operations without hand-written kernels.

**Governance:** No foundation governs x265. MulticoreWare, Inc. (Chennai, India) owns the trademark "x265," operates the commercial licensing business at `x265.org`, holds the copyright, and provides effectively all engineering/review resources. VideoLAN (a French non-profit) hosts the developer page ([videolan.org/developers/x265.html](https://www.videolan.org/developers/x265.html)) as a downstream user (via VLC) but does not describe x265 as a VideoLAN Foundation project; there is no documented foundation-membership structure. The canonical source repository is [bitbucket.org/multicoreware/x265_git](https://bitbucket.org/multicoreware/x265_git). One source (a direct clone and repository-description read performed this session) reports that the Bitbucket repository's own description states it "has been migrated to GitHub" at [github.com/Multicorewareinc/x265](https://github.com/Multicorewareinc/x265), with a sync window that closed 2026-06-30 [NEEDS VERIFICATION - single source]. This contradicts an earlier finding in the same research pass that characterized Bitbucket as "the actual development repo" with GitHub search results being only "mirrors/unrelated." Given that all PR numbers, commit hashes, and the CI workflow file referenced in the authoritative readiness grade below were independently confirmed on Bitbucket ([bitbucket.org/multicoreware/x265_git/src/master/.github/workflows/ci.yml](https://bitbucket.org/multicoreware/x265_git/src/master/.github/workflows/ci.yml)), Bitbucket is treated as the primary source of record in this report, with GitHub mirrors ([Multicorewareinc/x265](https://github.com/Multicorewareinc/x265) and the stale [videolan/x265](https://github.com/videolan/x265)) noted where they carry independent activity (e.g., PR #895).

**License:** Dual: GNU GPL v2 (open source) and a proprietary commercial license sold directly by MulticoreWare. The GPL license does not cover HEVC codec patents.

**Corporate control:** MulticoreWare is effectively the sole engineering resource; commit history is dominated by `@multicorewareinc.com` addresses. Original 2013 launch sponsors named in the ReadTheDocs introduction include Telestream and Doremi Labs, alongside partially anonymous other backers; none are visible in recent commit activity.

**RISE Project membership:** Checked directly against [riseproject.dev/members](https://riseproject.dev/members/): x265, libx265, and MulticoreWare are not listed among RISE's 8 Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or 12 General Members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). ZTE is a General Member, but the actual RISC-V contributing organization is Sanechips, a ZTE subsidiary, which is not itself a listed member. RISE has published zero blog posts mentioning libx265 or x265 (confirmed against the full 35-post sitemap, [riseproject.dev/wp-sitemap-posts-post-1.xml](https://riseproject.dev/wp-sitemap-posts-post-1.xml), and site search returning "Sorry, no results were found" for the query `libx265`).

**Community culture on new ports:** No `PLATFORMS.md`, `MAINTAINERS`, or `CODEOWNERS` file is reachable (all fetch attempts returned HTTP 404), and no formal platform-tier policy is published anywhere in the docs or repository. All prior SIMD ports (x86, ARM, POWER, LoongArch64) were developed internally by MulticoreWare. The RISC-V port, by contrast, was contributed externally by engineers affiliated with Sanechips/ZTE (wuchangsheng, credited in commit metadata) and ISCAS (CheryDan, PR #895), establishing precedent for external architecture contributions being accepted, though the process was slow: patch application failed repeatedly due to non-ASCII/garbled Chinese-language comment encoding in the submitted assembly files, and final merges required multiple "ping" follow-ups spanning weeks, tied to a single reviewer's (Ponsanthini A, MulticoreWare) availability.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-07-01 | [Bitbucket Issue #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) filed: `CMAKE_SYSTEM_PROCESSOR value 'riscv64' is unknown`. Still open as of 2026-09-30 with no maintainer response, though the underlying CMake fix is already present in the current source tree. | Bitbucket / readiness-grade justification |
| 2025-10-07 | Commit `669c2cf` ("RISCV64: supports RISCV compile"), the foundational bootstrap commit enabling RISC-V compilation; committed directly, no associated numbered PR found. | Bitbucket commit log |
| 2025-11-06 to 11-13 | [Bitbucket PR #40](https://bitbucket.org/multicoreware/x265_git/pull-requests/40) opened by wuchangsheng: RVV assembly for filter, intrapred, loopfilter, p2s, pixel utilities, SAO, and transpose. Review repeatedly blocked by garbled non-ASCII comment characters breaking `git am`/patch apply (patches #3 and #10 both failed), plus a one-day outage of MulticoreWare's internal RISC-V test server. All manually resolved by reviewer Ponsanthini A. | Bitbucket PR thread |
| 2025-11-14 | [PR #40 merged](https://bitbucket.org/multicoreware/x265_git/pull-requests/40), merge commit `9e551a994f97`. First RISC-V assembly landed upstream. Note: one early research pass in this session initially reported PR #40 as still OPEN and authored by `heyujiao99`; this was independently checked twice against the live Bitbucket REST API and both checks confirm PR #40's `state` field is `MERGED` and `author.display_name` is `wuchangsheng` - the OPEN/heyujiao99 attribution was an error in that early pass and is superseded here. | Bitbucket REST API (`pullrequests/40`) |
| 2025-11-14 | [PR #41](https://bitbucket.org/multicoreware/x265_git/pull-requests/41) opened: standalone fix for garbled comment characters. | Bitbucket |
| 2025-11-21 | PR #41 self-declined by author ("not ready"); the same fix is folded into PR #42 instead. | Bitbucket |
| 2026-01-05 | [PR #42](https://bitbucket.org/multicoreware/x265_git/pull-requests/42) opened by wuchangsheng: comprehensive optimization bundle (abs, psyCost_pp, intrapred-prim, costCoeffNxN, SAD/SAD_x3/SAD_x4 including high-bitdepth, DCT/IDCT, SA8D/SATD, 4x4 transpose, filter). Claimed aggregate gain: +28% encoder throughput on riscv64. Same garbled-comment patch-apply failure recurs; manually resolved by Ponsanthini A after 7 "ping" messages over ~15 days, attributed to reviewer/maintainer availability rather than code-review substance. | Bitbucket PR thread |
| 2026-01-20 | [PR #42 merged](https://bitbucket.org/multicoreware/x265_git/pull-requests/42), merge commit `903b5e620357`. | Bitbucket REST API |
| 2026-04-19 | x265 4.2 tagged (`e444744c0397`), the first release containing both merged RISC-V PRs (#40 and #42). | Bitbucket tags |
| 2026-05-21 | [GitHub PR #895](https://github.com/Multicorewareinc/x265/pull/895) opened by CheryDan (ISCAS): RVV-optimized, Vector-Length-Agnostic DCT32x32. Still open as of 2026-09-30, with 5 unresolved reviewer comments including a stack-overflow risk. | GitHub (Multicorewareinc mirror) |
| 2025-07-01 (ongoing) | [Bitbucket Issue #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) ("RISCV support") remains open with no maintainer response as of 2026-09-30. Note: one research pass in this session reported the Bitbucket issue-tracker REST endpoint returning HTTP 404 generally ("disabled/no tracker"), while other passes retrieved live comment content for this specific issue; this is an internal contradiction in the live findings and is flagged rather than resolved. | Bitbucket / readiness-grade justification |

**Key contributors:** wuchangsheng (Sanechips/ZTE) authored PR #40 and #42 and the foundational compile-enablement commit. Ponsanthini A (MulticoreWare) performed all integration testing, manual patch conflict resolution, and final pushes for both merged PRs. CheryDan (ISCAS) authored the still-open DCT32x32 PR #895. `yuanjia` and Yujiao He are credited as co-authors on individual commits within the PR #42 bundle (sad/sad_x3/sad_x4, 4x4 transpose, filter optimizations).

**Fully upstream?** The merged work (PR #40, PR #42) is in the Bitbucket master branch and shipped in the 4.2 release (tagged 2026-04-19). PR #895 (DCT32x32) is not yet merged.

## 3. Upstream Support Tier

No published platform-support-tier document exists (no `PLATFORMS.md`, `SUPPORT.md`, or `CODEOWNERS`). Support level is inferred entirely from what is shipped and CI-tested.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture recognized by CMake | Yes | Yes | Yes (`RISCV64_ALIASES = riscv64`, `source/CMakeLists.txt`) |
| SIMD assembly/intrinsics present | Yes (NASM + SSE/AVX/AVX-512) | Yes (NEON + SVE/SVE2) | Yes, partial (RVV, primarily 8-bit) |
| Dedicated cross-compile directory in `build/` | N/A | Yes | Yes (`build/riscv64-linux/crosscompile.cmake` + `make-Makefiles.bash`), but explicitly marked "experimental" in the toolchain file's own comment: "This feature is only supported as experimental. Use with caution." |
| CI runs on this architecture | Yes (`ubuntu-latest`, `ubuntu-22.04`, `windows-2022`) | No | No |
| Official upstream release binary | No (source tarball only) | No (source tarball only) | No (source tarball only) |
| Distribution package | Yes | Yes | Yes (Debian sid, Ubuntu Jammy/Noble/Resolute; Arch status disputed, see Section 8) |
| High-bitdepth (10/12-bit) SIMD | Yes | Yes | No, scalar C fallback per the readiness-grade justification |
| Release-blocking | Yes | Yes | No |

**Assessment:** riscv64 is an externally-contributed, actively-developed but CI-unverified architecture. It has hand-written and intrinsics-based coverage for the dominant motion-estimation and transform hot paths, but no CI, no official prebuilt binaries, an explicitly "experimental" cross-compile path, and (per the readiness justification) no high-bitdepth SIMD. It sits below arm64 in maturity and well below amd64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

x265 is a purely computational library with no JIT, no garbage collector, no cryptography, and no network stack. Its architecture-specific surface is: (1) SIMD-accelerated encode primitives (the dominant performance surface), (2) runtime CPU feature detection, (3) build-system architecture recognition.

**Source inventory:** `source/common/riscv64/` contains 23 files (confirmed by two independent directory listings and a full clone-and-read of the Multicorewareinc/x265 mirror this session): 12 hand-written `.S` assembly files (`asm.S`, `blockcopy8.S`, `dct.S` [largest asm file, ~1,538 lines], `intrapred.S`, `loopfilter.S`, `mc-a.S`, `p2s.S`, `pixel-util.S` [largest file overall, ~3,375 lines], `riscv64_utils.S`, `sad-a.S`, `sao-prim.S`/`sao.S`, `ssd-a.S`) plus C++ intrinsics/dispatch files (`asm-primitives.cpp`, `filter-prim.cpp`/`.h`, `intrapred-prim.cpp` [~1,025-1,280 lines], `pixel-prim.cpp`, `sao-prim.cpp`, `riscv64_utils.cpp`/`.h`, `cpu.h`, `fun-decls.h`/`fun-decls-prim.h`). A source-level read this session counted 414 uses of `vsetvli`, 274 uses of `vmv.v`, and 171 distinct `__riscv_v*` intrinsic calls across the directory, i.e. genuine, non-boilerplate vector code, plus proper runtime CPU detection in `cpu.h` via `getauxval(AT_HWCAP)`/`elf_aux_info()` for RVV and `/proc/cpuinfo` parsing for the Zbb bit-manipulation extension.

**CPU detection:** Implements `riscv64_cpu_detect()`, detecting RVV and Zbb extensions at runtime via `getauxval()`, with a `/proc/cpuinfo`-parsing fallback and compile-time flags when runtime detection is disabled. One commit (`1944c9d`, Brad Smith) generalized the `elf_aux_info()` path for OpenBSD/FreeBSD, touching but not specific to riscv64.

**Per-component status** (readiness-grade justification, cross-checked against a separate source-level code read performed this session; a discrepancy on two components is flagged below):

| Component | riscv64 | arm64 | amd64 | Notes |
|---|---|---|---|---|
| SAD / SAD_x3 / SAD_x4 (incl. high-bitdepth) | Yes | Yes | Yes | Hand-tuned RVV assembly, `sad-a.S` |
| SATD / SA8D | Yes | Yes | Yes | RVV assembly/intrinsics |
| DCT4/8/16/32, IDCT4/8/16/32, DST4 | Yes (DCT32x32 pending, see PR #895) | Yes | Yes | Hand-tuned RVV assembly, `dct.S` |
| Quantization (RDO quant) | Yes | Yes | Yes | RVV assembly |
| Interpolation/sub-pel filters | Yes | Yes | Yes | RVV C++ intrinsics, `filter-prim.cpp` |
| SAO | Yes | Yes | Yes | Mixed: RVV assembly (`sao.S`) + RVV intrinsics (`sao-prim.cpp`) |
| Intra prediction, planar | Yes | Yes | Yes | Hand-tuned RVV assembly |
| Intra prediction, DC and 33 angular modes | **Disputed** | Yes | Yes | The readiness-grade justification states these "fall back to scalar C." A separate source-level read of `intrapred-prim.cpp` (~1,025 lines) this session found it to contain "the bulk of angular/DC modes" implemented as RVV intrinsics, rating this component "Partial" rather than "missing." Both cannot be fully correct; flagged as a direct contradiction in the live findings. The readiness-grade version is treated as authoritative for the official color/level below (per task instructions), but engineering follow-up should re-verify `intrapred-prim.cpp` against the primitive-dispatch table directly. |
| Loop filter, luma strong deblocking | Yes | Yes | Yes | Hand-tuned RVV assembly |
| Loop filter, chroma deblocking | **Disputed** | Yes | Yes | The readiness-grade justification and an earlier source read both state the chroma path is explicitly commented out in `asm-primitives.cpp` (falls back to scalar C). A separate, later source-level read this session rated the whole `loopfilter.S` file (889 lines) "Full" without decomposing luma vs. chroma. The two are not necessarily contradictory (a 889-line asm file can still omit chroma while the file overall is substantial), but the "Full" rating should not be read as covering chroma specifically. |
| Motion compensation, pixel_avg | Yes | Yes | Yes | Narrow, one function, `mc-a.S` |
| DCT32x32 (enhanced, VLA) | Pending, [PR #895](https://github.com/Multicorewareinc/x265/pull/895) open | Yes | Yes | 5 unresolved reviewer comments as of 2026-09-30 |
| High-bitdepth (10/12-bit) paths | No, scalar C | Yes | Yes | All RVV paths in `filter-prim.cpp` guarded `#if !HIGH_BIT_DEPTH`; confirmed by both the readiness-grade justification and code read |
| CPU feature detection (RVV/Zbb via `getauxval`/`/proc/cpuinfo`) | Yes | Yes | Yes | Full |
| CMake architecture detection | Yes | Yes | Yes | `RISCV64_ALIASES` present |

## 5. Build System, Cross-Compilation, and Toolchain

**Native build** (auto-detects `riscv64` via `CMAKE_SYSTEM_PROCESSOR` matching `RISCV64_ALIASES`, `source/CMakeLists.txt`):
```
mkdir -p build/linux && cd build/linux
cmake -G "Unix Makefiles" ../../source
make
```

**Cross-compile** (`build/riscv64-linux/`, the entirety of upstream's riscv64 cross-compile documentation; two files total, both explicitly marked experimental):

`build/riscv64-linux/crosscompile.cmake` (verified full content, fetched this session):
```
# CMake toolchain file for cross compiling x265 for riscv64
# This feature is only supported as experimental. Use with caution.
# Please report bugs on bitbucket
set(CROSS_COMPILE_RISCV64 1)
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
if(NOT DEFINED CMAKE_C_COMPILER)
    set(CMAKE_C_COMPILER riscv64-unknown-linux-gnu-gcc)
endif()
if(NOT DEFINED CMAKE_CXX_COMPILER)
    set(CMAKE_CXX_COMPILER riscv64-unknown-linux-gnu-g++)
endif()
SET(CMAKE_FIND_ROOT_PATH  /usr/riscv64-unknown-linux-gnu)
```
Build commands:
```
cd build/riscv64-linux
cmake -DCMAKE_TOOLCHAIN_FILE=crosscompile.cmake -G "Unix Makefiles" ../../source
make
```
Default cross-compiler triplet is `riscv64-unknown-linux-gnu-{gcc,g++}` (GCC-named by default; user-supplied `CMAKE_C_COMPILER`/`CMAKE_CXX_COMPILER` take precedence, so Clang is usable). Note that `build/README.txt` documents an equivalent pattern for AArch64 cross-compilation in prose, but this prose was never mirrored for riscv64.

**Toolchain version requirements:** Unlike AArch64 (where `build/README.txt` states "GCC10.x and onwards" for SVE/SVE2), x265 states no explicit minimum GCC/Clang version for riscv64/RVV anywhere in docs or CMake version checks. Instead, the build performs a runtime compile-capability probe at configure time (`source/CMakeLists.txt`), testing whether the compiler can compile RVV functions with correct callee-saved vector-register backup/restore, citing [LLVM issue #80009](https://github.com/llvm/llvm-project/issues/80009) (a Clang RVV register-corruption bug) directly in a code comment. If the probe fails, `ENABLE_RVV` is forced `OFF`. A second probe checks for `<riscv_vector.h>` intrinsics support (`-march=rv64gcv`); if it fails, only the hand-written `.S` assembly primitives are built, and the C++ RVV-intrinsics files are excluded. General prerequisite for all platforms: CMake 2.8.8 or later.

**CMake flags relevant to riscv64:**

| Flag | Default | Effect |
|---|---|---|
| `ENABLE_RVV` | ON | Disables RVV support and falls back to scalar C if set OFF. |
| `RISCV64_RUNTIME_CPU_DETECT` | ON | Disables runtime CPU feature detection if set OFF; forced OFF automatically off non-Linux/BSD systems. |
| `CROSS_COMPILE_RISCV64` | set by toolchain file | Forces `CPU_HAS_RVV=1` (assumes all extensions present) for cross-compiles, since host probing is impossible; note no `FindRVV.cmake` module exists in `source/cmake/` (confirmed absent), so the `find_package(RVV)` call referenced in the build script is currently a no-op for native probing, unlike AArch64's `FindSVE.cmake`, which does exist. |
| `HIGH_BIT_DEPTH` | OFF | Applies to riscv64 (64-bit arch list includes RISCV64), but RVV paths are gated `#if !HIGH_BIT_DEPTH`, so enabling it does not add SIMD on riscv64. |
| `RISCV64_WARNINGS_AS_ERRORS` | unset | Adds `-Werror` to riscv64 primitive compile flags if set. |

Internal compiler flag: `RISCV64_INTRINSIC_FLAG = -march=rv64gcv`, applied only to RVV-intrinsic `.cpp` files. The `.S` assembly files compile with `-O2` only and enable the vector extension per-function via inline `.option arch, +v` directives.

**QEMU and Docker:** No Dockerfile exists anywhere in the repository (confirmed via full directory listing and a full-text code search for "docker", 0 hits). No QEMU reference exists anywhere in the repository (full-text search for "qemu", 0 hits); there is no checked-in QEMU-based test harness. Standard `qemu-riscv64` user-mode emulation of a cross-compiled binary is possible but is not documented or scripted upstream.

**Known build failures:** Using the `videolan/x265` GitHub mirror (stale) will emit `CMAKE_SYSTEM_PROCESSOR value 'riscv64' is unknown`, since that mirror lacks the `RISCV64_ALIASES` fix. The canonical Bitbucket repository (or its Multicorewareinc GitHub mirror, if the migration claim above is correct) should be used instead.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| 8-bit H.265 encode, correctness | Yes | Yes | Yes | None |
| 10-bit Main10 / 12-bit Main12 encode, correctness | Yes | Yes | Yes (C fallback) | Performance gap only |
| SIMD SAD/SATD/SA8D | Yes | Yes | Yes (RVV) | None |
| SIMD DCT/IDCT (up to 16x16) | Yes | Yes | Yes (RVV) | None |
| DCT32x32 SIMD | Yes | Yes | Pending (PR #895 open) | Performance gap, closing |
| SIMD interpolation filters | Yes | Yes | Yes (RVV intrinsics) | None |
| SIMD 10/12-bit paths | Yes | Yes | No | Performance gap |
| Intra DC/angular prediction SIMD | Yes | Yes | Disputed, see Section 4 | Performance gap per readiness grade |
| Loop filter chroma deblocking SIMD | Yes | Yes | No per readiness grade (disputed, see Section 4) | Performance gap |
| NUMA-aware allocation | Yes | Yes | Available upstream but excluded from riscv64 distro builds | Minor perf gap |
| Runtime SIMD detection | Yes (CPUID) | Yes (HWCAP) | Yes (`getauxval` RVV/Zbb) | None |
| Regression CI | Yes | No | No | Infrastructure gap |

**Functional gaps:** None for 8-bit correctness. The C scalar fallback is complete and produces correct output across all pixel depths; the gaps are purely performance, not correctness.

**Performance gaps:** Per the readiness-grade justification, intra DC/angular prediction, chroma loop-filter deblocking, and all 10/12-bit high-bitdepth paths fall back to scalar C. DCT32x32 is pending merge (PR #895), with measured 5.14x-9.85x speedup on a 128-bit-VLEN SG2044 board and 5.59x-13.28x on a 256-bit-VLEN Banana Pi F3, per the PR's own benchmark data.

**Published RVV-vs-scalar speedup data** (from the merged PRs; no cross-architecture riscv64-vs-arm64 or riscv64-vs-amd64 comparison exists in any source checked, including openbenchmarking.org which was inaccessible behind bot protection in every fetch attempt this session):

From [PR #40](https://bitbucket.org/multicoreware/x265_git/pull-requests/40) (merged 2025-11-14):

| Primitive | Speedup |
|---|---|
| calSign | 18.18x |
| weight_pp [w0=64] | 17.77x |
| copy_sp [32x32] | 11.42x |
| planecopy_cp | 9.58x |
| luma_vpp [64x64] | 7.77x |
| intra_planar_32x32 | 7.54x |
| SAO_BO_0 | 6.23x |
| convert_p2s [64x64] | 4.89x |
| pelFilterLumaStrong_Horizontal | 2.28x |

From [PR #42](https://bitbucket.org/multicoreware/x265_git/pull-requests/42) (merged 2026-01-20):

| Primitive | Speedup |
|---|---|
| intra_planar_32x32 | 7.82x |
| sad [64x16] | 6.73x |
| satd [8x8] | 5.58x (peak) |
| transpose [32x32] | 3.76x |
| transpose [64x64] | 3.62x |
| psy_cost_pp [16x16] | 2.76x |
| dst4x4 | 2.08x |
| **Aggregate encoder throughput** | **+28%** (the figure cited in the readiness-grade justification) |

One line item within PR #42's own data, `costCoeffNxN` (baseline 1547.6 ns vs. "optimized" 1799.44 ns), shows an apparent regression inconsistent with the claimed 28% aggregate gain; it is reproduced as-is from the PR description without further explanation from the source.

From [GitHub PR #895](https://github.com/Multicorewareinc/x265/pull/895) (open, DCT32x32): SG2044 (128-bit VLEN) 5.14x and 9.85x; Banana Pi F3 (256-bit VLEN) 5.59x and 13.28x.

**Security hardening:** Data not available: no riscv64-specific hardening gaps (stack canary, CFI, ASLR/PIE) were identified in any tracker searched (Bitbucket, GitHub, Debian BTS, Ubuntu Launchpad, Gentoo Bugzilla). `ENABLE_PIC=ON` is required and documented for shared-library builds.

**Floating-point / NaN correctness:** No riscv64-specific floating-point or NaN correctness bugs were found in any tracker searched.

## 7. CI/CD Infrastructure

**Verdict: no riscv64 CI exists.** Directly confirmed by reading the full contents of `.github/workflows/ci.yml` at [bitbucket.org/multicoreware/x265_git/src/master/.github/workflows/ci.yml](https://bitbucket.org/multicoreware/x265_git/src/master/.github/workflows/ci.yml) (also independently read via the GitHub mirror): every `runs-on:` entry is `ubuntu-latest`, `ubuntu-22.04`, or `windows-2022`; every job-matrix entry targets x86-64 only; the strings "riscv" and "RVV" appear zero times in the file. No `bitbucket-pipelines.yml` exists at the repository root (confirmed absent, HTTP 404). The `build/riscv64-linux/crosscompile.cmake` and `make-Makefiles.bash` files are manual, explicitly "experimental" helper scripts, not wired into any CI system.

All RISC-V PR validation (PR #40, #42) was performed manually by Ponsanthini A (MulticoreWare) on internal RISC-V test hardware, which went offline for at least one day during PR #40's review (2025-11-12), using a fixed local test method: TestBench plus encode/decode/playback validation against `crowd_run_1080p50.y4m`. No automated gate exists.

**RISE RISC-V Runners:** [Announced March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), providing free `ubuntu-24.04-riscv` GitHub Actions runners; the [six-week update](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) reports 13,000+ jobs across 197 repositories and 87 organizations as of May 2026. libx265/x265 is not among the adopters, and no upstream riscv64 CI job has been proposed or added to this project.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | No | No |
| Runner type | `ubuntu-22.04`/`ubuntu-latest`/`windows-2022` | - | - |
| RISE Runners in use | No | No | No |
| Regression protection | Yes (x86 only) | None | None |

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs only, on both Bitbucket and the GitHub mirror(s). No prebuilt binaries for any architecture are distributed upstream.

**Distribution packages:**

| Distribution | Package | Version | riscv64 status | Notes |
|---|---|---|---|---|
| Debian sid | x265/libx265 | 4.1-4 (+b2 binary rebuild per prior tracking) | Installed | [buildd.debian.org status](https://buildd.debian.org/status/package.php?p=x265&suite=sid) confirms riscv64 built; buildd host recorded as `rv-osuosl-01` in the most recent check this session (a prior check recorded `rv-manda-04`, likely a buildd reassignment between checks, not a content discrepancy). |
| Ubuntu 26.04 (Resolute Raccoon) | `libx265-215`, `libx265-dev` | 4.1-4 | Present | Confirmed via [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=libx265&suite=resolute) (amd64, arm64, armhf, i386, ppc64el, riscv64, s390x) and independently corroborated via `ports.ubuntu.com` binary pool listing and Launchpad. Includes both merged RVV PRs (#40, #42), since 4.1-4 postdates both merge dates. |
| Ubuntu 24.04 (Noble) | `libx265-199` | 3.5-2build1 | Present, per `ports.ubuntu.com` pool listing | Predates all RISC-V assembly work (Noble released April 2024; PR #40 merged November 2025); this build is pure scalar C on riscv64. |
| Ubuntu 22.04 (Jammy) | `libx265` | 3.5-2 | Present, per `ports.ubuntu.com` pool listing | Also predates RISC-V assembly work. |
| Arch Linux RISC-V | x265 | Disputed | Disputed | One source found x265 4.2-2 (built 2026-06-21, 1.58 MB) at [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/). A later, independent adversarial re-check this session queried [archriscv.felixc.at/?q=libx265](https://archriscv.felixc.at/?q=libx265) directly and found no matching package. These two findings directly contradict each other; flagged rather than resolved. [NEEDS VERIFICATION] |
| PyPI | "libx265" | - | Not applicable | `pypi.org/pypi/libx265/json` returns HTTP 404; no such PyPI project exists. libx265 is a C library, not Python-packaged under this name. |
| RISE wheel builder | - | - | Not applicable | Consistent with the above; the GitLab PyPI-proxy check redirects to the same nonexistent PyPI page. |

**What a user must do today to get a working optimized riscv64 binary:** Ubuntu 26.04 (`apt install libx265-215`/`libx265-dev`) or Debian sid (`apt install libx265` on riscv64) both deliver 4.1-4, which includes both merged RVV PRs. Ubuntu 22.04/24.04 deliver only pre-RVV scalar builds (3.5-x). For the DCT32x32 improvement (PR #895) or any post-4.1 fix, a user must build from source against the Bitbucket master branch.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| CMake | build-dependency, critical | Available on riscv64 across major distros | Functional (used to configure/build the library itself) | Released | Minimum version 2.8.8 per x265's own `cmake_minimum_required`; no riscv64-specific minimum documented. |
| GCC | build-dependency, critical | Available on riscv64 (default cross-compiler triplet in `crosscompile.cmake` is `riscv64-unknown-linux-gnu-gcc`/`g++`) | Gated by x265's own compile-time RVV-capability probe (`RVV_COMPILATION_TEST`, citing [LLVM issue #80009](https://github.com/llvm/llvm-project/issues/80009) for the underlying callee-saved-register bug class) | N/A (toolchain, not shipped) | No hard-coded minimum GCC version; x265 self-tests compiler capability at configure time rather than gating on a version number. Clang is also supported as an alternative (user can override `CMAKE_C_COMPILER`/`CMAKE_CXX_COMPILER`), but is not the default. |
| libnuma | runtime-dependency, optional | Available on riscv64 in Debian (`libnuma` package builds there), but excluded from x265's own riscv64 distro build configurations per the prior report's dependency review | Not exercised when compiled out | Not included in riscv64 x265 packages | Optional performance feature (`ENABLE_LIBNUMA`); not blocking. |
| libvmaf | runtime-dependency, optional | No Debian/Ubuntu binary package found for riscv64 in this or prior sessions; Fedora carries libvmaf 3.1.0 in Rawhide only | Unknown | Not available via mainstream Debian/Ubuntu riscv64 repositories | Optional (`ENABLE_LIBVMAF`, off by default); must be built from source on riscv64 if perceptual-quality scoring is required. |
| NASM | indirect, x86-only build-dependency | Not applicable on riscv64 | N/A | N/A | x265's riscv64 path is compiled via the system C/C++ compiler and GNU `as` syntax (`.S` files), not NASM; NASM is only invoked on the x86/x86_64 `find_package(Nasm)` branch. |
| pthreads (glibc) | indirect runtime-dependency, critical | Yes, provided by glibc on all Linux riscv64 distributions | Functional | Released | Used for frame-level and wavefront parallelism; standard Linux infrastructure, no riscv64-specific gap. |

**Dependency depth:** The critical build chain (CMake, GCC) is standard Linux/riscv64 toolchain infrastructure with full availability. NASM is irrelevant on riscv64 by design (the RVV path uses GNU-assembler `.S` files and compiler intrinsics, not NASM-assembled kernels). libnuma and libvmaf are both optional and do not block a functioning riscv64 build; their absence only removes NUMA-aware allocation and VMAF scoring, respectively. No recursive/transitive dependency risk was identified beyond these.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Bitbucket Issue #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) | "RISCV support" - CMake `CMAKE_SYSTEM_PROCESSOR value 'riscv64' is unknown` | Open since 2025-07-01, no maintainer response | Medium | The underlying CMake fix (`RISCV64_ALIASES`) is already present in the current source tree; the issue itself appears stale/uncloed rather than unaddressed. Note: the Bitbucket issue-tracker API returned HTTP 404 in some fetch attempts this session, suggesting the legacy tracker may be deprecated or access-restricted; this is noted as a live-findings inconsistency rather than resolved. |
| [GitHub PR #895](https://github.com/Multicorewareinc/x265/pull/895) | RVV-optimized DCT32x32 | Open, unmerged, confirmed as of 2026-09-30 | Medium | 5 unresolved reviewer comments, including a stack-overflow/stack-size-exceeds-4KB-page risk and a potential VLEN-dependent buffer overflow in a temporary buffer. Blocks a performance gain (5.14x-13.28x on this kernel), not a shipped defect. |

**Correctness bugs:** None found. No riscv64-specific correctness, NaN, or floating-point accuracy bugs were located across Bitbucket, GitHub, Debian BTS, Ubuntu Launchpad, or Gentoo Bugzilla (Gentoo query "x265 riscv" returned "Zarro Boogs found," zero matches; Ubuntu Launchpad reports "There are currently no open bugs" for the filtered riscv query).

**Recurring integration friction (process, not a tracked bug):** Both merged PRs (#40, #42) required manual patch application by Ponsanthini A because of garbled/non-UTF8 Chinese-language comment characters breaking `git am`/whitespace checks. The standalone fix (PR #41) was self-declined and folded into PR #42, where the identical failure recurred from the same author, and it appears again as a blocking issue in PR #40 from that PR's own thread, indicating no tooling or CI check catches this upstream.

## 12. Objections and Upstream Blockers

**Organizational blockers:** MulticoreWare is effectively a single-company gatekeeper with no published contribution policy for new architecture ports. The path to merge runs through one identified reviewer (Ponsanthini A), who must manually test each submission on internal RISC-V hardware before an unnamed maintainer performs the final push; PR #42 took roughly 2.5 weeks from patch-ready to merge, driven by maintainer/reviewer availability rather than review substance.

**Technical blockers:** The garbled-comment encoding problem recurs across all three riscv64 PRs and is not resolved by any submission-side tooling; new contributions from the same or other external teams are likely to hit it again. No CI means any future riscv64 regression will go undetected until a downstream packager or user files a report. PR #895 is explicitly blocked on 5 open reviewer comments, including a stack-overflow risk.

**Acceptance probability for new RISC-V contributions:** Moderate to good. Two substantial PRs were merged cleanly with zero architectural or correctness pushback across 31 total review comments (all friction was mechanical: encoding and patch-apply issues). The reviewer chain is responsive, if slow. Single-company governance and manual-hardware-test dependency mean turnaround is weeks, not days.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Optimization level:** partial

**Operations lacking RISC-V implementations:** Intra DC and angular prediction, chroma loop-filter deblocking, and all 10/12-bit high-bitdepth paths fall back to scalar C (per the readiness-grade justification; see Section 4 for a noted discrepancy against a separate source-level read that rated intra prediction and loop filter more favorably). Closing these gaps requires RVV kernels for the intra angular-mode set, a chroma-specific deblocking kernel, and widened (uint16_t) variants of the existing 8-bit RVV interpolation/pixel-util/SAD kernels for Main10/Main12 support. The DCT32x32 gap is already closing via PR #895, pending 5 reviewer comments.

**Justification:** No upstream riscv64 CI exists: a direct read of the sole workflow file, [ci.yml](https://bitbucket.org/multicoreware/x265_git/src/master/.github/workflows/ci.yml), shows only ubuntu/windows runners and zero riscv/RVV references, and no `bitbucket-pipelines.yml` exists. Debian sid and Ubuntu 26.04 (Resolute) build and ship libx265 for riscv64 from unmodified upstream source ([buildd.debian.org status](https://buildd.debian.org/status/package.php?p=x265&suite=sid); [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=libx265&suite=resolute)), which applies the clean-distro-build yellow floor. RVV coverage is partial: SAD/SATD/DCT/IDCT/quant/interpolation/SAO, the main motion-estimation and transform hot paths delivering the claimed +28% throughput in [PR #42](https://bitbucket.org/multicoreware/x265_git/pull-requests/42), are RVV-accelerated, but intra DC/angular prediction, chroma loop-filter deblocking, and all 10/12-bit high-bitdepth paths fall back to scalar C. This caps the port at blue-level completeness but does not change the already-lower yellow primary color driven by the CI/release-provider status.

**Pending work that could change the grade:** [GitHub PR #895](https://github.com/Multicorewareinc/x265/pull/895) (RVV-optimized DCT32x32), still open as of 2026-09-30, with 5 unresolved reviewer comments including a stack-overflow risk. [Bitbucket Issue #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) ("RISCV support"), open since 2025-07-01 with no maintainer response, though the underlying CMake fix is already present. No upstream riscv64 CI job has been proposed or added (RISE RISC-V Runners are not in use by this project). No RISE involvement with libx265 itself has been found; the only RISE-adjacent touchpoint is libx265 being bundled as a transitive dependency inside the unrelated PyAV/`av` riscv64 wheel (see Section 14.4).

## 14. Investment Analysis

RISE has no prior direct investment in libx265. The only RISE-adjacent touchpoint found is incidental: `riseproject-dev/python-wheels` PR #461 bundles libx265 (via pyav-ffmpeg) as a transitive shared-library dependency inside its riscv64 build of the `av` (PyAV) Python package, not as a funded or dedicated libx265 porting effort. No prior work needs to be excluded from the sizing below.

### 14.1 Functional Enablement

No functional (correctness) gaps exist. The C scalar fallback is complete and correct for all pixel depths and all encode modes on riscv64; every remaining gap identified in this report is a performance gap, not a functional one.

### 14.2 Performance Optimization

- **DCT32x32 (PR #895):** 5.14x-9.85x measured on SG2044, 5.59x-13.28x on Banana Pi F3. Blocked on 5 review comments (stack-overflow risk, VLEN-dependent buffer overflow, an `lx` macro RV128I branch needing an `#error` guard, an undocumented implicit `m1` dependency, and an indentation nit). Effort is reviewer engagement plus minor rework, not new-kernel authorship.
- **Intra prediction DC + 33 angular modes:** Per the readiness-grade justification, no RVV implementation exists for this path (contested by a separate source read, see Section 4, which should be resolved before sizing this item definitively). If confirmed absent, this is the largest single performance-gap item, requiring assembly or intrinsics work modeled on the existing aarch64/x86 equivalents.
- **Chroma loop-filter deblocking:** Per the readiness-grade justification, this is explicitly omitted (commented out in `asm-primitives.cpp` per the prior source read) and requires new RVV kernel work, likely small in scope relative to the existing luma-strong filter kernel.
- **High-bitdepth (10/12-bit) RVV widening:** The 8-bit `filter-prim.cpp`, pixel-util, and SAD/SATD RVV kernels already exist; extending to 10/12-bit requires widening pixel types (`uint16_t`) and adjusting saturation logic. This is a widening exercise against existing code structure, not net-new kernel design.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists anywhere for this project. RISE Runners (free `ubuntu-24.04-riscv` bare-metal runners) are available and already used by 197+ repositories elsewhere in the RISE ecosystem, but adopting them for libx265 requires the Bitbucket/GitHub repository owner (MulticoreWare) to opt in and add a CI job; this is not something RISE or an external contributor can do unilaterally without upstream cooperation. The value is regression prevention for all current and future RISC-V work, given that validation today is entirely manual (Ponsanthini A's internal test hardware).

### 14.4 Ecosystem Enablement

libx265 has no plugin, extension, or dependent-package ecosystem of its own requiring separate riscv64 enablement (it is a standalone system library consumed by a small number of large multimedia applications, e.g. FFmpeg, VLC, HandBrake, each of which is tracked as its own project). Section 10 is therefore omitted per the report's scoping rules. The one indirect ecosystem touchpoint, libx265 as a bundled transitive dependency inside the `av`/PyAV riscv64 wheel built by `riseproject-dev/python-wheels` ([PR #461](https://github.com/riseproject-dev/python-wheels/pull/461), [Issue #2136](https://github.com/riseproject-dev/python-wheels/issues/2136), status "waiting for release" as of 2026-09-20), does not require separate libx265-specific enablement work; it rides on pyav-ffmpeg's own prebuilt riscv64 tarball.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | DCT32x32: resolve 5 reviewer comments (stack-overflow risk, VLEN buffer overflow, macro guard, documentation, indentation) and shepherd PR #895 to merge | 1 | Contributor (ISCAS or external) | High |
| Performance | Verify actual coverage of intra DC/angular prediction (resolve the Section 4 discrepancy); implement missing RVV kernels if the readiness-grade finding holds | 4-6 | Contributor | High |
| Performance | Chroma loop-filter deblocking RVV kernel (verify commented-out status first) | 1-2 | Contributor | Medium |
| Performance | High-bitdepth (10/12-bit) interpolation-filter RVV widening (extend existing 8-bit `filter-prim.cpp`) | 3-4 | Contributor | Medium |
| Performance | High-bitdepth (10/12-bit) SAD/SATD/DCT/pixel-util RVV widening | 4-6 | Contributor | Medium |
| CI/CD | Propose and land a riscv64 CI job (e.g. via RISE Runners) in MulticoreWare's CI workflow | 0.5, plus upstream buy-in dependency | Contributor + MulticoreWare | High |
| Build system | Resolve Bitbucket Issue #1005 (confirm CMake fix is present and close the issue); consider hardening the "experimental" cross-compile path | 0.5 | Contributor | Low |
| Process | Fix the recurring garbled-comment/encoding submission issue at the contributor tooling level (pre-commit hook or CI lint) to stop blocking future patch applications | 0.5 | Contributor team (Sanechips/ISCAS) | Medium |

## 15. References

- [bitbucket.org/multicoreware/x265_git, canonical upstream repository](https://bitbucket.org/multicoreware/x265_git)
- [github.com/Multicorewareinc/x265, GitHub mirror carrying independent PR activity (e.g. PR #895)](https://github.com/Multicorewareinc/x265)
- [github.com/videolan/x265, stale VideoLAN mirror](https://github.com/videolan/x265)
- [.github/workflows/ci.yml, full CI workflow file (no riscv64/RVV job)](https://bitbucket.org/multicoreware/x265_git/src/master/.github/workflows/ci.yml)
- [Bitbucket Issue #1005, "RISCV support"](https://bitbucket.org/multicoreware/x265_git/issues/1005)
- [Bitbucket PR #40, RISCV64 filter/intrapred/loopfilter/p2s/pixel/sao optimization (merged)](https://bitbucket.org/multicoreware/x265_git/pull-requests/40)
- [Bitbucket PR #41, RISCV64 garbled-character comment fix (declined)](https://bitbucket.org/multicoreware/x265_git/pull-requests/41)
- [Bitbucket PR #42, RISCV64 optimization +28% (merged)](https://bitbucket.org/multicoreware/x265_git/pull-requests/42)
- [GitHub PR #895, RVV-optimized DCT32x32 (open)](https://github.com/Multicorewareinc/x265/pull/895)
- [LLVM issue #80009, Clang RVV callee-saved register corruption (cited in x265's own compile-capability probe)](https://github.com/llvm/llvm-project/issues/80009)
- [Debian buildd status, x265 sid riscv64](https://buildd.debian.org/status/package.php?p=x265&suite=sid)
- [packages.ubuntu.com search, libx265 on Ubuntu 26.04 Resolute](https://packages.ubuntu.com/search?keywords=libx265&suite=resolute)
- [Arch Linux RISC-V repository search, libx265](https://archriscv.felixc.at/?q=libx265)
- [Arch Linux RISC-V extra repository listing](https://archriscv.felixc.at/repo/extra/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog post sitemap, no libx265 coverage found](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE RISC-V Runners announcement, March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [riseproject-dev/python-wheels PR #461, av 18.1.0 with bundled libx265/libx264 riscv64 wheel](https://github.com/riseproject-dev/python-wheels/pull/461)
- [riseproject-dev/python-wheels Issue #2136, av riscv64 support tracking](https://github.com/riseproject-dev/python-wheels/issues/2136)
- [videolan.org x265 project page](https://www.videolan.org/developers/x265.html)