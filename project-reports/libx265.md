---
title: libx265
parent: Project Reports
categories:
  - multimedia
---

# libx265

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libx265
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libx265 is an open-source H.265/HEVC video encoder library and CLI tool. It is the reference software implementation used by FFmpeg, HandBrake, VLC, and most Linux distribution multimedia stacks for HEVC encoding. Performance is the defining characteristic of the project: nearly the entire codebase is SIMD-accelerated for x86 (SSE2 through AVX-512 via NASM), AArch64 (NEON, SVE, SVE2), and POWER (AltiVec). The C scalar fallback paths exist only as reference implementations.

**Governance:** No foundation. MulticoreWare, Inc. (Chennai, India) owns the trademark "x265", operates the commercial licensing business at `x265.org`, and provides effectively all engineering resources. VideoLAN (a French non-profit) hosts the mailing list `x265-devel@videolan.org` and distributes releases via `ftp.videolan.org`. The canonical source repository is [bitbucket.org/multicoreware/x265_git](https://bitbucket.org/multicoreware/x265_git), mirrored to [github.com/MulticorewareinC/x265](https://github.com/MulticorewareinC/x265). The [github.com/videolan/x265](https://github.com/videolan/x265) mirror is stale and does not reflect RISC-V work.

**License:** Dual: GNU GPL v2 (open source) and a proprietary commercial license sold by MulticoreWare. The GPL license does not cover HEVC codec patents.

**Corporate control:** Analysis of the 100 most recent commits in the GitHub mirror shows 94 from `@multicorewareinc.com` addresses, 5 from `localhost`, and 1 from Gmail. Top committers by count: Aruna Matheswaran (50), Pooja Venkatesan (9), Srikanth Kurapati (8), Kirithika (6). No external corporate contributors appear in recent history. Original backers Telestream and Doremi Labs (documented in the ReadTheDocs introduction, 2013) are not represented in recent commits.

**RISE membership:** MulticoreWare, VideoLAN, and ZTE (parent of Sanechips, the RISC-V contributor) are not RISE members. RISE has published no blog posts mentioning libx265 or x265.

**Community culture on new ports:** The project has no published platform tier policy, no `PLATFORMS.md`, no `MAINTAINERS` file. All SIMD-accelerated ports (x86, ARM, POWER) were developed internally by MulticoreWare. The two merged RISC-V PRs were authored by wuchangsheng (Sanechips/ZTE, he.yujiao@sanechips.com.cn) and integrated by Ponsanthini A (MulticoreWare). This establishes a precedent for external architecture contributions being accepted, but the process was slow (patch application failed twice due to encoding issues in Chinese-language assembly comments; final merge of PR #42 required 7 pings over 15 days due to maintainer availability constraints).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-07-01 | [Issue #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) filed: CMake emits `CMAKE_SYSTEM_PROCESSOR value 'riscv64' is unknown`; user asks if RISC-V support is planned. No maintainer response. | Bitbucket |
| 2025-11-06 | [PR #40](https://bitbucket.org/multicoreware/x265_git/pull-requests/40) opened by wuchangsheng (Sanechips/ZTE): RVV assembly for filter, intrapred, loopfilter, p2s, pixel utilities, SAO, sa8d, transpose. | Bitbucket |
| 2025-11-11 | PR #40 review: patch application fails twice due to garbled non-ASCII characters in assembly comments; manually resolved by Ponsanthini A (MulticoreWare). MulticoreWare RISC-V test server goes offline for one day. | Bitbucket |
| 2025-11-14 | [PR #40 merged](https://bitbucket.org/multicoreware/x265_git/pull-requests/40), merge commit `9e551a994f97`. First RISC-V assembly in upstream. | Bitbucket |
| 2025-11-14 | [PR #41](https://bitbucket.org/multicoreware/x265_git/pull-requests/41) opened: fix garbled comment characters as a standalone cleanup. | Bitbucket |
| 2025-11-21 | PR #41 self-declined by author; content folded into PR #42. | Bitbucket |
| 2026-01-05 | [PR #42](https://bitbucket.org/multicoreware/x265_git/pull-requests/42) opened: comprehensive optimization bundle -- abs, psyCost_pp, intrapred, costCoeffNxN, SAD (8-bit + high-bitdepth), DCT/IDCT, sa8d/satd, 4x4 transpose, filters. Claimed aggregate gain: +28% encoder throughput on riscv64. | Bitbucket |
| 2026-01-05 | PR #42: same garbled-comment patch-apply failure as PR #40; manually resolved by Ponsanthini A. | Bitbucket |
| 2026-01-20 | [PR #42 merged](https://bitbucket.org/multicoreware/x265_git/pull-requests/42), merge commit `903b5e620357`. | Bitbucket |
| 2026-04-19 | x265 4.2 released, the first tagged release containing all merged RISC-V assembly optimizations. | GitHub (MulticorewareinC/x265) |
| 2026-05-21 | [PR #895](https://github.com/Multicorewareinc/x265/pull/895) opened by CheryDan (ISCAS): RVV-optimized DCT32x32. Status: open, under review. | GitHub (MulticorewareinC) |
| 2026-06-21 | Arch Linux RISC-V publishes x265 4.2-2-riscv64.pkg.tar.zst (1.58 MB). | [archriscv.felixc.at](https://archriscv.felixc.at/repo/extra/) |

**Key contributors:**
- wuchangsheng, he.yujiao@sanechips.com.cn (Sanechips Technology / ZTE subsidiary): authored PR #40, #41, #42.
- Ponsanthini A (MulticoreWare): integration testing on internal RISC-V servers, manual patch resolution, final push.
- CheryDan (ISCAS -- Institute of Software, Chinese Academy of Sciences): PR #895 (DCT32x32, open).
- daichengrong (ISCAS) and wu.changsheng (Sanechips): mailing list discussion on PR #895 compile-time vs. runtime VLEN selection.
- Martin Storsjö: submitted CMake build system patch (November 2025) to x265-devel to handle `.S` files natively; no reply seen on the mailing list. [NEEDS VERIFICATION]

**Fully upstream?** Yes, for merged work (PRs #40 and #42). The code is in [github.com/MulticorewareinC/x265](https://github.com/MulticorewareinC/x265) master and in the 4.2 release. The [videolan/x265](https://github.com/videolan/x265) mirror does not reflect this work and should not be used as a reference.

**Open build system issue:** [Issue #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) (filed 2025-07-01) reported that `CMakeLists.txt` does not recognize `riscv64`. The adversarial verification confirmed that the canonical MulticorewareinC GitHub repo now has `set(RISCV64_ALIASES riscv64)` in `source/CMakeLists.txt`. However, Bitbucket Issue #1005 remains open with no maintainer response, and it is not confirmed whether the fix was committed as part of PR #40 or separately. [NEEDS VERIFICATION on exact commit that added riscv64 to CMake alias list]

---

## 3. Upstream Support Tier

There is no published platform support tier document. No `PLATFORMS.md`, `SUPPORT.md`, `CODEOWNERS`, or similar file exists in the repository. Support is determined by what MulticoreWare ships.

**Evidence-based tier comparison:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture recognized by CMake | Yes | Yes | Yes (canonical repo); No (videolan mirror) |
| SIMD assembly present | Yes (NASM + SSE/AVX) | Yes (NEON + SVE/SVE2) | Partial (RVV, 8-bit only) |
| riscv64 cross-compile directory in `build/` | No (not applicable) | Yes (`build/aarch64-linux/`) | No |
| CI runs on this architecture | Yes (ubuntu-22.04, ubuntu-latest, windows-2022) | No | No |
| Official release binary | Yes (source tarball; no prebuilt) | No (source tarball only) | No (source tarball only) |
| Distribution package | Yes | Yes | Yes (Debian, Ubuntu, Arch) |
| High-bitdepth (10/12-bit) SIMD | Yes | Yes | No -- scalar C fallback only |
| Release blocking | Yes | Yes | No |

**Assessment:** riscv64 is an emerging, community-contributed architecture. It has assembly for the most critical 8-bit encode paths, but no CI, no official prebuilt binaries, no cross-compile scaffolding in the tree, and no high-bitdepth SIMD. It is below arm64 in completeness and well below amd64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

x265 is a purely computational library. Its architecture-specific subsystems are:

1. SIMD-accelerated encode primitives (the dominant performance surface)
2. CPU feature detection
3. Build system architecture recognition

There is no JIT compiler, no garbage collector, no cryptography, and no network stack.

**Source file inventory (merged as of x265 4.2):**

The `source/common/riscv64/` directory contains 23 files:
`asm-primitives.cpp`, `asm.S`, `blockcopy8.S`, `cpu.h`, `dct.S`, `filter-prim.cpp`, `filter-prim.h`, `fun-decls-prim.h`, `fun-decls.h`, `intrapred-prim.cpp`, `intrapred.S`, `loopfilter.S`, `mc-a.S`, `p2s.S`, `pixel-prim.cpp`, `pixel-util.S`, `riscv64_utils.S`, `riscv64_utils.cpp`, `riscv64_utils.h`, `sad-a.S`, `sao-prim.cpp`, `sao.S`, `ssd-a.S`

Approximate line counts: `asm-primitives.cpp` 495 lines; `pixel-util.S` 3375 lines; `dct.S` 1538 lines; `sad-a.S` 939 lines; `loopfilter.S` 889 lines; `sao.S` 884 lines; `filter-prim.cpp` 1280 lines.

For comparison: aarch64 has 54 files; x86 has 38+ NASM `.asm` files plus intrinsic wrappers; `asm-primitives.cpp` for aarch64 is 739 lines versus 495 for riscv64.

**Component-by-component quality assessment:**

| Component | riscv64 | arm64 | amd64 | ISA extensions used | Quality |
|---|---|---|---|---|---|
| SAD / SAD_x3 / SAD_x4 (all LUMA_PU sizes) | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| SATD / SA8D | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| DCT4/8/16/32, IDCT4/8/16/32, DST4 | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| RDO quant (nonPsyRdoQuant, PsyRdoQuant) | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| psyCost_pp | Yes (ZBB gated) | Yes | Yes | RVV + ZBB | Hand-tuned; requires ZBB extension |
| Pixel utilities (copy, addAvg, weight, planecopy, ssimDist, scale, quant/dequant) | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| SAO (E0-E3, B0, calSign, cuOrg variants) | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| Interpolation filters (motion comp, all 6 modes, all block sizes, I420/I422/I444) | Yes | Yes | Yes | RVV intrinsics | C++ RVV intrinsics |
| Intra prediction -- planar (3 block sizes) | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| Intra prediction -- DC, 33 angular modes | No -- C scalar fallback | Yes | Yes | -- | Missing |
| Loop filter -- luma strong (both directions) | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| Loop filter -- chroma deblocking | No -- explicitly commented out | Yes | Yes | -- | Disabled in source |
| Motion compensation pixelavg_pp | Yes | Yes | Yes | RVV | Hand-tuned assembly |
| Motion compensation luma_hvpp (combined H+V) | No (synthesized via horiz_ps + vert_sp) | Yes | Yes | -- | Absent as a single-pass kernel |
| DCT32x32 (enhanced) | Pending -- PR #895 open | Yes | Yes | RVV VLA | Under review |
| High-bitdepth (10-bit, 12-bit) SIMD | No -- all RVV paths are 8-bit only | Yes | Yes | -- | Missing; C fallback |
| CPU detection (runtime RVV + ZBB via AT_HWCAP / /proc/cpuinfo) | Yes | Yes | Yes | getauxval | Full |
| CMake architecture detection | Yes (canonical repo) | Yes | Yes | -- | Full (riscv64 alias added) |

**DCT32x32 open PR:** [PR #895](https://github.com/Multicorewareinc/x265/pull/895) (CheryDan, ISCAS) adds an RVV-optimized DCT32x32 kernel. Measured speedups on SG2044 (128-bit VLEN): 5.14x and 9.85x over scalar; on Banana Pi F3 (256-bit VLEN): 5.59x and 13.28x. Design is Vector-Length Agnostic (VLA) using `vlsseg4e16.v`, `vwadd.vv`, `vmul.vx`, `vnclip.wi`. As of 2026-06-17, the PR has 5 unresolved reviewer comments (stack size exceeds 4KB page, VLEN overflow in temporary buffer, `lx` macro RV128I branch requires `#error`, implicit `m1` dependency needs comment, indentation). Not yet merged.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Architecture detection:** `source/CMakeLists.txt` in the canonical [MulticorewareinC/x265](https://github.com/MulticorewareinC/x265) repo now includes `set(RISCV64_ALIASES riscv64)`, enabling `X265_ARCH_RISCV64` and runtime CPU detection. The stale [videolan/x265](https://github.com/videolan/x265) mirror does not have this and will emit `CMAKE_SYSTEM_PROCESSOR value 'riscv64' is unknown`.

**Cross-compile build directory:** `build/aarch64-linux/` exists with a `crosscompile.cmake` template. No equivalent `build/riscv64-linux/` directory exists. A toolchain file must be created manually.

**Native build on a riscv64 host (upstream 4.2):**
```
mkdir build && cd build
cmake ../source \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DENABLE_ASSEMBLY=ON \
  -DENABLE_LIBNUMA=ON \
  -DENABLE_PIC=ON \
  -DCMAKE_INSTALL_PREFIX=/usr
cmake --build .
```

**Cross-compilation from x86_64 host -- create `cmake/riscv64-linux-gnu.cmake`:**
```
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```
Then:
```
mkdir build-riscv64 && cd build-riscv64
cmake ../source \
  -G "Unix Makefiles" \
  -DCMAKE_TOOLCHAIN_FILE=../cmake/riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DENABLE_ASSEMBLY=ON \
  -DENABLE_LIBNUMA=OFF \
  -DENABLE_PIC=ON
make
```
`ENABLE_LIBNUMA=OFF` required for cross-compilation because libnuma is typically absent from a cross-sysroot.

**High-bitdepth multilib build** (Debian-style, required for full 8/10/12-bit shared library):
Build passes: 12-bit (`-DHIGH_BIT_DEPTH=ON -DMAIN12=ON -DENABLE_ASSEMBLY=ON`), 10-bit (`-DHIGH_BIT_DEPTH=ON -DENABLE_ASSEMBLY=ON`), then 8-bit main pass linking in the static libs. Note that `ENABLE_ASSEMBLY=ON` for 10/12-bit builds on riscv64 will compile the RVV sources but the `#if !HIGH_BIT_DEPTH` guards in `filter-prim.cpp` and the RVV pixel paths mean the resulting code falls back to C scalar for high-bitdepth paths.

**Required CMake flags for riscv64:**

| Flag | Value | Reason |
|---|---|---|
| `ENABLE_ASSEMBLY` | `ON` | Enables RVV assembly paths (canonical repo). Setting `OFF` forces pure-C and is 28%+ slower. |
| `ENABLE_PIC` | `ON` | Required for shared library and multilib linking. |
| `ENABLE_LIBNUMA` | `ON` (native) / `OFF` (cross) | libnuma available on riscv64 in Debian; absent in typical cross-sysroot. |
| `ENABLE_ALTIVEC` / `CPU_POWER8` | Not applicable | POWER-only; not triggered on riscv64. |

**Compiler requirements:**
- GCC 7+ for initial riscv64 target support; GCC 10+ recommended for stable rv64gc. GCC 12+ for RVV intrinsics.
- Clang 9+ supports riscv64; Clang 14+ for RVV.
- NASM not required on riscv64 (x86-only assembler).
- CMake minimum: 2.8.8 (upstream); Debian and Arch use 3.5+.

**QEMU:** Standard `qemu-riscv64 -L /usr/riscv64-linux-gnu ./x265 --version` works for user-mode testing of cross-compiled binaries. No upstream Dockerfiles for riscv64 exist.

**Known build failures:** The `videolan/x265` mirror (`CMakeLists.txt` without riscv64 alias) emits a warning and produces a build with no architecture detection, no SIMD, and no RVV assembly. Use [MulticorewareinC/x265](https://github.com/MulticorewareinC/x265) or a distribution-patched source.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| 8-bit H.265 encode -- baseline correctness | Yes | Yes | Yes | None |
| 10-bit Main10 encode -- correctness | Yes | Yes | Yes (C fallback) | Performance gap |
| 12-bit Main12 encode -- correctness | Yes | Yes | Yes (C fallback) | Performance gap |
| SIMD-accelerated 8-bit SAD/SATD/SA8D | Yes | Yes | Yes (RVV) | None |
| SIMD-accelerated 8-bit DCT/IDCT | Yes | Yes | Partial (no DCT32x32 RVV; PR #895 pending) | Pending merge |
| SIMD-accelerated 8-bit interpolation filters | Yes | Yes | Yes (RVV intrinsics) | None |
| SIMD-accelerated 10/12-bit paths | Yes | Yes | No | Performance gap |
| Intra prediction DC/angular SIMD | Yes | Yes | No (C scalar) | Performance gap |
| Loop filter chroma SIMD | Yes | Yes | No (disabled in source) | Performance gap |
| NUMA-aware memory allocation | Yes | Yes | No (compiled out by distros) | Minor perf gap |
| VMAF perceptual quality scoring | Yes (optional) | Yes (optional) | No Debian/Ubuntu package; must build from source | Packaging gap |
| Hardware SIMD detection at runtime | Yes (CPUID) | Yes (NEON/HWCAP) | Yes (AT_HWCAP for RVV, /proc/cpuinfo for ZBB) | None |
| psyCost_pp SIMD | Yes | Yes | Yes (requires ZBB) | Gap on non-ZBB hardware |
| Regression CI | Yes | No | No | Infrastructure gap |

**Functional gaps (cannot do X at all on riscv64 without code changes):**
- None for 8-bit correctness. The C scalar fallback is complete and correct.

**Performance gaps (SIMD absent or missing):**
- Intra prediction: DC and all 33 angular modes fall to C scalar. Intra coding is roughly 20-30% of total encode compute in typical content [NEEDS VERIFICATION -- no riscv64-specific profiling data found].
- Loop filter chroma: explicitly disabled (`//p.pelFilterChroma` commented out in `asm-primitives.cpp`).
- DCT32x32: PR #895 pending; SG2044 shows 5.14x-9.85x speedup once merged.
- All 10-bit and 12-bit paths: C scalar only; `#if !HIGH_BIT_DEPTH` guards all RVV paths in `filter-prim.cpp`.

**Quantitative performance data (from merged PRs, hardware unspecified except PR #895):**

From [PR #40](https://bitbucket.org/multicoreware/x265_git/pull-requests/40) (merged Nov 2025):

| Primitive | Speedup (RVV vs scalar) |
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

From [PR #42](https://bitbucket.org/multicoreware/x265_git/pull-requests/42) (merged Jan 2026):

| Primitive | Speedup |
|---|---|
| intra_planar_32x32 | 7.82x |
| sad [64x16] | 6.73x |
| satd [8x8] | 5.58x (peak) |
| transpose [32x32] | 3.76x |
| transpose [64x64] | 3.62x |
| psy_cost_pp [16x16] | 2.76x |
| dst4x4 | 2.08x |
| **Aggregate encoder throughput** | **+28%** |

Note: PR #42 also reports `costCoeffNxN` baseline 1547.6 ns vs. optimized 1799.44 ns (apparent regression in the source data). This entry appears inconsistent with the claimed 28% gain; it is reproduced as-is from the PR description without further interpretation.

**No public riscv64-vs-amd64 or riscv64-vs-arm64 FPS comparisons exist** in any searched source (openbenchmarking.org was inaccessible; no results found via web search; RISE has no published multimedia benchmarks).

**Security hardening:** Data not available. No riscv64-specific hardening gaps (stack canary, CFI, ASLR PIE) were identified in any tracker. The `ENABLE_PIC=ON` flag is required and documented. No CVEs specific to the RISC-V build path are known.

**Floating-point / NaN correctness:** No RISC-V-specific floating-point or NaN bugs were found in Bitbucket, GitHub, Debian BTS, Ubuntu Launchpad, or the x265-devel mailing list. Three open GitHub issues (#780, #348, #217) involve NaN or numerical topics but are all architecture-independent.

---

## 7. CI/CD Infrastructure

**Verdict: No riscv64 CI exists anywhere.**

Direct read of [github.com/MulticorewareinC/x265/.github/workflows/ci.yml](https://github.com/MulticorewareinC/x265/.github/workflows/ci.yml):
- All `runs-on:` values: `ubuntu-latest`, `ubuntu-22.04`, `windows-2022`.
- The string "riscv" does not appear.
- No QEMU emulation, no cross-compilation to riscv64, no native riscv64 runner.

Direct read of [github.com/videolan/x265](https://github.com/videolan/x265):
- No `.github/` directory. No CI configuration of any kind.

[bitbucket.org/multicoreware/x265_git](https://bitbucket.org/multicoreware/x265_git):
- No CI configuration discovered. Testing for RISC-V PRs (#40, #42) was done manually by Ponsanthini A on MulticoreWare's internal RISC-V servers (which went offline for at least one day during PR #40 review, 2025-11-12).

**RISE RISC-V Runners:** The RISE RISC-V Runners service ([riseproject.dev, March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) provides free `ubuntu-24.04-riscv` GitHub Actions runners. As of the six-week report (May 2026), 197 repositories and 87 organizations are using them. libx265 / x265 is not among the listed adopters.

**CI comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | No | No |
| Runner type | ubuntu-22.04 / ubuntu-latest / windows-2022 | -- | -- |
| Test execution | Yes | -- | -- |
| Hardware used | GitHub-hosted x86_64 VMs | -- | -- |
| RISE Runners | No | No | No |
| Regression protection | Yes (x86 only) | None | None |

---

## 8. Distribution and Release Status

**Upstream releases:** [github.com/MulticorewareinC/x265/releases](https://github.com/MulticorewareinC/x265/releases) lists 5 releases (4.2, 4.1, 4.0, 3.6, 3.5), all as source tarballs only. No prebuilt binaries for any architecture are distributed upstream.

**Distribution packages:**

| Distribution | Package | Version | riscv64 status | Notes |
|---|---|---|---|---|
| Debian Sid | x265 / libx265-209 | 4.1-4+b2 | Installed | Built on `rv-manda-04`; +b2 is a binary-only rebuild for riscv64. Includes PR #40 optimizations (Nov 2025); PR #42 (+28%) NOT included (4.1 predates Jan 2026 merge). |
| Ubuntu 24.04 Noble | libx265-199 | 3.5-2build1 | Available (793.7 kB) | Predates all RISC-V assembly optimizations (Noble released April 2024; PR #40 merged Nov 2025). Pure C scalar build on riscv64. |
| Arch Linux RISC-V | x265 | 4.2-2 | Available (1.58 MB, built 2026-06-21) | Most recent version. Postdates PR #42 (Jan 2026) -- includes all merged RISC-V optimizations. |
| PyPI libx265 | -- | -- | No | Package is a stub; zero release files; no riscv64 wheels. |
| RISE wheel builder | -- | -- | No | Package absent (HTTP 404). |
| GitHub Releases (upstream) | -- | -- | No | Source tarballs only. |

**What a user must do today to get a working optimized binary:**
- On Arch Linux RISC-V: `pacman -S x265` delivers 4.2-2 with full merged optimizations.
- On Debian Sid: `apt install libx265-209` delivers 4.1-4+b2 with PR #40 optimizations only.
- On Ubuntu 24.04: `apt install libx265-199` delivers 3.5, no RISC-V assembly at all.
- For full 4.2 with all optimizations on Debian/Ubuntu: build from source using MulticorewareinC/x265 master.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| NASM | Compiles x86 SIMD (.asm files) | Not used (x86-only tool; Debian restricts to `[amd64]` in build-deps) | N/A | N/A | None; pure-C fallback applies on riscv64 |
| libnuma | NUMA-aware memory allocation | Available (Debian: 2.0.19-1+b2) but compiled out by distros on riscv64 (Debian excludes from build-deps for riscv64) | Not tested (compiled out) | Not included in riscv64 packages | None; optional performance feature only |
| pthreads (glibc) | Frame-level and wavefront parallelism | Yes (glibc provides on all Linux arches) | Functional | Released | None |
| CMake | Build system | Available on riscv64 (all major distros) | Functional | Released | None |
| libvmaf (optional) | Per-frame VMAF perceptual quality scoring | No Debian/Ubuntu package; Fedora only (3.1.0 in Rawhide); riscv64 CI status in upstream vmaf repo: Data not available | Unknown | Fedora only (riscv64 CI evidence absent) | Not blocking (optional, off by default); must build from source on riscv64 if needed |

**Dependency depth:** All critical dependencies (pthreads, CMake) are standard Linux infrastructure with full riscv64 support. NASM is irrelevant on riscv64. libnuma is optional and excluded from riscv64 packages by distros. No recursive dependency concern.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [BB #1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) | RISCV support (CMake unknown processor) | Open | Medium | Filed 2025-07-01; 1 empty comment, no maintainer response. CMake fix is present in MulticorewareinC canonical repo but issue not closed. Likely stale. |
| [PR #895](https://github.com/Multicorewareinc/x265/pull/895) | RISC-V: Add RVV optimized DCT32x32 | Open PR, under review | Medium | 5 unresolved review comments including stack overflow risk (6KB allocation on 4KB page) and potential buffer overflow for large VLEN values. Not a shipped bug; blocks performance improvement. |

**Correctness bugs:** None found. No riscv64-specific correctness, NaN, or floating-point accuracy bugs in Bitbucket, GitHub, Debian BTS, Ubuntu Launchpad, or x265-devel mailing list archives.

**Recurring integration friction:** Both PR #40 and PR #42 required manual patch application by Ponsanthini A due to encoding failures when `git am` processed assembly files containing Chinese-language comments. The standalone fix (PR #41) was self-declined and folded into PR #42, where the same failure recurred. This is a workflow issue rather than a functional bug, but it slowed integration by approximately one week per PR.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**
- MulticoreWare is a single-company maintainer with no published contribution policy. The acceptance path for architecture patches is: submit to x265-devel, wait for Ponsanthini A (or equivalent reviewer) to manually test on internal RISC-V hardware, wait for an unnamed upstream maintainer to do the final push. PR #42 required 7 pings and 15 days from patch-ready to merge.
- MulticoreWare holds the commercial licensing business. There is no incentive to block RISC-V support, but there is also no stated commitment to maintain it.

**Technical blockers:**
- The garbled-comment encoding problem (UTF-8 Chinese in assembly files causing `git am` failures) is not fully resolved. Any new RISC-V assembly contribution from the same team is likely to encounter the same issue.
- No CI means any future RISC-V regression will go undetected until a downstream packager files a bug.
- PR #895 (DCT32x32) has 5 open review comments including a stack overflow risk; it is blocked on those being resolved.

**Acceptance probability for new RISC-V contributions:** Moderate. Two substantial PRs were merged. The maintainer chain is responsive (slowly). There is no stated objection to RISC-V. However, the single-company governance and manual test dependency mean turnaround time is weeks to months per PR.

---

## 13. Investment Analysis

RISE has no prior investment in libx265. No prior work to exclude.

### 13.1 Functional Enablement

**Intra prediction DC and angular modes (33 modes, 8-bit):** The `source/common/riscv64/intrapred.S` file exists and registers only planar prediction. DC and 33 angular modes fall to C scalar. This affects all I-frame and intra-coded block encoding. ARM has full intra prediction SIMD; x86 has full coverage.

**Loop filter chroma:** Two lines are explicitly commented out in `asm-primitives.cpp`. This is a targeted omission, not an oversight. Chroma deblocking runs at C scalar speed on riscv64.

**High-bitdepth (10-bit, 12-bit) RVV paths:** All existing RVV paths in `filter-prim.cpp` are guarded with `#if !HIGH_BIT_DEPTH`. Main10 content (HDR, streaming services) runs entirely at C scalar speed on riscv64. arm64 has full Main10 SIMD coverage.

### 13.2 Performance Optimization

**DCT32x32 (PR #895):** 5.14x-9.85x measured on SG2044. Blocked on 5 review comments. Closest actionable item: address the review comments and shepherd to merge. Effort is low (reviewer engagement, not new code).

**Intra prediction angular modes:** No implementation exists anywhere in the riscv64 tree. Full implementation from scratch, modeled on the aarch64 equivalents, is the largest performance gap item.

**10-bit interpolation filter RVV path:** The 8-bit `filter-prim.cpp` uses RVV intrinsics. Extending to 10-bit requires widening the pixel type (uint16_t instead of uint8_t) and adjusting saturation. The code structure already exists; it is a widening exercise.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists anywhere. RISE Runners (free `ubuntu-24.04-riscv` bare-metal on Scaleway EM-RV1) are available. Adding a workflow to [MulticorewareinC/x265](https://github.com/MulticorewareinC/x265) is an invitation-dependent action -- the repo must opt in. The value is regression prevention for all future RISC-V work.

### 13.4 Ecosystem Enablement

libx265 has no plugin or extension ecosystem. This section is omitted (no dependent package ecosystem requiring separate riscv64 enablement).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | DCT32x32: address 5 reviewer comments and shepherd PR #895 to merge | 1 | Contributor (ISCAS or external) | High |
| Performance | Intra prediction DC + 33 angular modes, 8-bit RVV assembly | 4-6 | Contributor | High |
| Performance | Loop filter chroma deblocking, 8-bit RVV (two commented-out lines need implementation) | 1-2 | Contributor | Medium |
| Performance | High-bitdepth (10-bit) interpolation filter RVV paths (widen existing 8-bit filter-prim.cpp) | 3-4 | Contributor | Medium |
| Performance | High-bitdepth (10-bit) SAD/SATD/DCT/pixel-util RVV widening | 4-6 | Contributor | Medium |
| CI/CD | Add riscv64 CI job using RISE Runners to MulticorewareinC/x265 GitHub Actions | 0.5 | Contributor + MulticoreWare buy-in | High |
| Build system | Close BB Issue #1005: confirm CMake riscv64 fix is present, add cross-compile scaffolding directory `build/riscv64-linux/` | 0.5 | Contributor | Low |
| Integration | Resolve garbled-comment encoding issue in submission workflow (contributor-side tooling/pre-commit hook) | 0.5 | wuchangsheng / contributor | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [bitbucket.org/multicoreware/x265_git -- canonical upstream](https://bitbucket.org/multicoreware/x265_git)
- [github.com/MulticorewareinC/x265 -- upstream GitHub mirror (authoritative for RISC-V work)](https://github.com/MulticorewareinC/x265)
- [github.com/videolan/x265 -- stale VideoLAN mirror](https://github.com/videolan/x265)
- [Bitbucket Issue #1005 -- "RISCV support" (CMake unknown processor)](https://bitbucket.org/multicoreware/x265_git/issues/1005)
- [Bitbucket PR #40 -- RISCV64: add filter intrapred loopfilter p2s pixel sao optimization (MERGED)](https://bitbucket.org/multicoreware/x265_git/pull-requests/40)
- [Bitbucket PR #41 -- RISCV64: fix garbled characters in the comments (DECLINED)](https://bitbucket.org/multicoreware/x265_git/pull-requests/41)
- [Bitbucket PR #42 -- RISCV64: Optimize performance to increase by 28% (MERGED)](https://bitbucket.org/multicoreware/x265_git/pull-requests/42)
- [GitHub PR #895 -- RISC-V: Add RVV optimized DCT32x32 (OPEN)](https://github.com/Multicorewareinc/x265/pull/895)
- [GitHub PR #870 -- SAD, SATD, SSD, pixel-util, avg_pp (merged)](https://github.com/Multicorewareinc/x265/pull/870)
- [GitHub PR #871 -- filter, intrapred, loopfilter, p2s, pixel, sao (merged)](https://github.com/Multicorewareinc/x265/pull/871)
- [GitHub PR #873 -- Performance consolidation +28% (merged)](https://github.com/Multicorewareinc/x265/pull/873)
- [Debian buildd tracker -- x265 sid riscv64](https://buildd.debian.org/status/package.php?p=x265&suite=sid)
- [Ubuntu 24.04 Noble -- libx265-199 package](https://packages.ubuntu.com/noble/libx265-199)
- [Arch Linux RISC-V repository -- x265 extra](https://archriscv.felixc.at/repo/extra/)
- [Martin Storsjo -- cmake: Build ARM/AArch64/RISC-V assembly without custom commands (x265-devel, Nov 2025)](https://mailman.videolan.org/pipermail/x265-devel/2025-November/014467.html)
- [RISE Project blog -- all 28 posts enumerated, none mention libx265](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (March 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners six-week report (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [x265.org -- MulticoreWare commercial licensing](https://x265.org)
- [videolan.org x265 project page](https://www.videolan.org/developers/x265.html)