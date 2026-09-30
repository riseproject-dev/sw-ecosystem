---
title: libaom
parent: Project Reports
color: yellow
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Perl
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: libyuv
    relation: runtime-dependency
    criticality: critical
  - name: libwebm
    relation: runtime-dependency
    criticality: optional
  - name: Highway
    relation: runtime-dependency
    criticality: optional
  - name: libjxl
    relation: runtime-dependency
    criticality: optional
  - name: libvmaf
    relation: runtime-dependency
    criticality: optional
  - name: TensorFlow Lite
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libaom" %}

# libaom

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libaom<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libaom is the reference implementation of the AV1 video codec, maintained by the Alliance for Open Media (AOMedia), a non-profit industry consortium headquartered in Wakefield, MA, founded September 1, 2015 by Amazon, Cisco, Google, Intel, Microsoft, Mozilla, and Netflix. AOMedia has grown to roughly 53+ member organizations across three tiers: Founding/Governing members with board seats (Amazon, Apple, Cisco, Google, Huawei, Intel, Meta, Microsoft, Mozilla, Netflix, NVIDIA, Samsung, Tencent, plus Bloomberg added 2024 and Two Orioles added 2025), a Promoter tier, and a General member tier (dozens of companies including Snap, Zoom, VideoLAN, Xilinx, VeriSilicon). The codec is dual-licensed under BSD-2-Clause and the Alliance for Open Media Patent License 1.0, and covers both encoder and decoder; it is the baseline against which AV1 encoder quality comparisons are made.

libaom is **not hosted on GitHub**. The canonical repository is [aomedia.googlesource.com/aom](https://aomedia.googlesource.com/aom), a Gerrit/Git-on-Borg repository, with code review conducted at [aomedia-review.googlesource.com](https://aomedia-review.googlesource.com). There is no separate GitHub repository with issues or pull requests for this project; any GitHub search results referencing "libaom riscv64" belong to downstream/dependent projects (Pillow, rustdesk, JuliaBinaryWrappers, PyAV, riseproject-dev/python-wheels) hitting build problems with libaom's RVV code, not to libaom development itself.

Governance runs entirely through Gerrit code review with per-directory committer access; there is no public `MAINTAINERS`/`OWNERS` file at the repository root (both 404). The Codec Working Group is chaired by Yaowu Xu (Distinguished Software Engineer, Google, leads Google's Open Codecs Group). The primary reviewer and technical gatekeeper for essentially all RISC-V changes is James Zern (jzern@google.com, Google), with Jerome Jiang as the frequent second Code-Review +2. Other prominent, Google-affiliated committers include Wan-Teh Chang and Tom Finegan. AOMedia member organizations get a streamlined CLA process; non-member contributors require individual CLA.

Code quality bar is high: the first substantial RVV patch (CDEF, 1,354-1,437 lines depending on measurement point) went through 8 patch sets and dozens of review comments over roughly two weeks before merging. The project is pragmatically open to new architecture ports: it ships per-architecture cmake toolchain files for arm64, armv7, ppc, x86, and riscv64 without controversy, and documents an `-DAOM_TARGET_CPU=generic` fallback for unsupported targets in the README. No formal tier policy, PLATFORMS.md, or written RFC process for new ports was found; evidence (the riscv64 port itself, landed via a single external contributor's patch and reviewed by a Google maintainer) suggests ports are accepted pragmatically through ordinary Gerrit review once a contributor supplies working toolchain support, consistent with the general open-source pattern that a maintainer is more willing to add "one more job to an existing CI matrix" than to accept an architecture nobody on the core team can test.

The active RISC-V contributors are Jerry And and arron wu of [Andes Technology](https://www.andestech.com/) (a RISC-V chip company and RISE General Member, not Premier, see Section 1 correction in Section 14/Readiness context), with all review performed by Google engineers (James Zern, Jerome Jiang). RISE (RISC-V Software Ecosystem) itself has no direct funding or CI relationship with libaom's upstream development; its only contact with libaom is downstream compatibility patching in its own python-wheels CI pipeline (see Section 12 and Section 13).

## 2. Port History and Upstreaming Timeline

All RISC-V work lives in the canonical Gerrit repository. No out-of-tree forks or vendor branches were found. A complete, live-verified enumeration of every riscv/RVV-matching Gerrit change (18 total: 14 merged, 3 abandoned, 1 open) is below.

| Date | Event | Source |
|------|-------|--------|
| 2022-12-13 | Change 168201, "Add riscv cross build", first submission attempt by Kwanghoon Son. Abandoned in favor of the resubmitted 168261. | [168201](https://aomedia-review.googlesource.com/c/aom/+/168201) |
| 2022-12-15 | Change 168261, "Add riscv cross build", **MERGED**. This is the original/foundational commit (`48c0a5292b21`) introducing RISC-V cross-compilation support (gcc toolchain + README update). Author: Kwanghoon Son (no public employer/affiliation found). Committer: James Zern (Google). | [168261](https://aomedia-review.googlesource.com/c/aom/+/168261) |
| 2023-01-20 | Change 169505, "Add riscv cross build", **MERGED**. A cherry-pick of commit `48c0a5292b21` onto another branch, credited to Wan-Teh Chang (Google) with Kwanghoon Son's Signed-off-by preserved; commit `02ebc5ef8204`. | [169505](https://aomedia-review.googlesource.com/c/aom/+/169505) |
| 2023-02-03 | v3.6.0 CHANGELOG: "RISC-V architecture support with gcc toolchain." | [CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG) |
| 2023-05-03 | Change 174581, revert of an assembly-language cmake change that had broken rtcd header generation for cross-configs including riscv (Bug: aomedia:3436, b/280585476). Abandoned, not merged. | [174581](https://aomedia-review.googlesource.com/c/aom/+/174581) |
| 2023-05-10 | Change 175122 merged: `riscv-linux-gcc.cmake`, default `CROSS` prefix changed to `riscv64-linux-gnu-` to match Debian's package triple. Author: James Zern. | [175122](https://aomedia-review.googlesource.com/c/aom/+/175122) |
| 2023-05-11 | Change 175124 merged: comment-only cleanup of the same toolchain file. Author: James Zern. | [175124](https://aomedia-review.googlesource.com/c/aom/+/175124) |
| 2024-10-30 | Change 194481, "riscv64/cdef: add filter and dir intrinsic functions", opened by Jerry And (Andes). Hit two Jenkins build failures (jobs 77872, 78185). | [194481](https://aomedia-review.googlesource.com/c/aom/+/194481) |
| 2025-01-13 | Change 194481 abandoned by its owner, superseded by Change 196522. | [194481](https://aomedia-review.googlesource.com/c/aom/+/194481) |
| 2025-01-14 | Change 196521 merged: `aom_ports/riscv.h` + `riscv_cpudetect.c` + cmake RVV infrastructure. Foundational RVV support all later kernels build on. Author: Jerry And (Andes). Reviewers: James Zern, Jerome Jiang (both Code-Review +2). | [196521](https://aomedia-review.googlesource.com/c/aom/+/196521) |
| 2025-01-27 | Change 196522 merged: `av1/common/riscv/cdef_block_rvv.c` (CDEF filter optimization), the successful follow-up to the abandoned 194481. | [196522](https://aomedia-review.googlesource.com/c/aom/+/196522) |
| 2025-02-10 | v3.12.0 CHANGELOG: "Add the CDEF optimization for RISC-V." | [CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG) |
| 2025-05-20 | Change 199661 merged: convolution 2D/X/Y/intraBC (8-bit). Took two failed Jenkins builds (jobs 79061, and a second failure after rebase) before succeeding (job 79097). | [199661](https://aomedia-review.googlesource.com/c/aom/+/199661) |
| 2025-06-25 | Changes 200781/200782 merged: `mem_rvv.h` helper header + high-bitdepth convolution, the first highbd RVV implementation. | [200781](https://aomedia-review.googlesource.com/c/aom/+/200781), [200782](https://aomedia-review.googlesource.com/c/aom/+/200782) |
| 2026-03-03 | Change 206581 merged: compound convolution (8-bit). Author: arron wu (Andes). | [206581](https://aomedia-review.googlesource.com/c/aom/+/206581) |
| 2026-03-05 | Change 206601 merged: high-bitdepth compound convolution. | [206601](https://aomedia-review.googlesource.com/c/aom/+/206601) |
| 2026-03-13 | Change 208401 opened by Bruno Verachten (gounthar@gmail.com), an outside/community contributor, not an Andes engineer: w==2/h==2 edge-case fix in highbd convolve RVV. **Still open as of 2026-09-30 (research date), stalled roughly 6.5 months.** | [208401](https://aomedia-review.googlesource.com/c/aom/+/208401) |
| 2026-04-10 | Change 210321 merged: build-directory refactor moving `cmake/toolchains/` (touches `riscv-linux-gcc.cmake`'s path only, not codec logic). Author: Wan-Teh Chang. | [210321](https://aomedia-review.googlesource.com/c/aom/+/210321) |
| 2026-04-22 | Change 210421 merged: Wiener convolution (8-bit). | [210421](https://aomedia-review.googlesource.com/c/aom/+/210421) |
| 2026-04-30 | Change 211341 merged: high-bitdepth Wiener convolution, verified by the author on Banana Pi M3, Kendryte K230, and Andes FPGA. Most recent merged RISC-V change. | [211341](https://aomedia-review.googlesource.com/c/aom/+/211341) |
| 2026-05-12 (approx.) | v3.14.0 released, containing the Wiener RVV changes. | [CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG) |
| 2026-09-21 | v3.15.1 tagged; latest release as of the research date (2026-09-30). No v3.16 exists yet. | Gerrit tag verification |

Key contributors:

| Person | Org | Role |
|--------|-----|------|
| Kwanghoon Son | Unknown, not Google or Andes | Authored the original riscv cross-build toolchain cmake (Change 168261, merged 2022-12-15) |
| Wan-Teh Chang (wtc@google.com) | Google | Cherry-picked the cross-build change onto another branch (169505); authored the 2026-04 build refactor (210321) |
| Jerry And (andes-jerry, andesjj97@gmail.com) | Andes Technology | Authored RVV infrastructure + CDEF + 8-bit/highbd convolve kernel changes (5 merged CLs) |
| arron wu (andes-ttwu, alias.ttwu@gmail.com) | Andes Technology | Authored compound-convolve and Wiener-convolve RVV changes (4 merged CLs, 206581/206601/210421/211341) |
| Bruno Verachten (gounthar@gmail.com) | Unknown (community contributor) | Author of open Change 208401 (w==2/h==2 edge-case fix), not affiliated with Andes |
| James Zern (jzern@google.com) | Google | Primary gatekeeper; Code-Review +2 on nearly every RISC-V merge; submitter |
| Jerome Jiang (jianj@google.com) | Google | Secondary reviewer; Code-Review +2 on all major RVV changes |

Of the 14 merged changes, 9 are RVV-kernel/codec work (5 by Jerry And, 4 by arron wu, both Andes engineers); the remaining 5 merged changes are build-system/toolchain plumbing authored by Google engineers or Kwanghoon Son. All work is fully upstream; no downstream patches, vendor branches, or out-of-tree forks are known for libaom itself (RISE maintains separate downstream patches in its own python-wheels CI pipeline, see Section 12).

## 3. Upstream Support Tier

libaom has no documented formal tier policy: no PLATFORMS.md, no SUPPORT.md, no CODEOWNERS, no MAINTAINERS file. The project implicitly accepts new architectures via the generic-C fallback (`-DAOM_TARGET_CPU=generic`) and the pattern of shipping per-architecture cmake toolchain files.

RISC-V is not release-blocking. The internal Jenkins CI at [build.aomedia.org](https://build.aomedia.org) runs 33 jobs total; the `libaom__compile` job's confirmed architecture matrix is `generic-gnu, x86-linux-clang, x86-linux-gcc, x86_64-linux-clang, x86_64-linux-gcc, armv7-linux-gcc, armv8-linux-gcc, armv8.4-linux-gcc, armv8.6-linux-gcc, x86-win32-gcc, x86_64-win64-gcc` -- riscv64 is absent. Every merged RVV patch was reviewed and merged with only human code review confirming correctness; none was gated by an automated riscv64 build or test.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build job | Yes (Jenkins) | Yes (Jenkins, multiple variants incl. armv8/armv8.4/armv8.6) | No |
| CI test job | Yes | Yes | No |
| Official binary releases | Source tarball only | Source tarball only | Source tarball only |
| Distro binary packages | Yes (Debian, Ubuntu, Fedora, Arch) | Yes | Yes (Debian sid, Ubuntu 24.04/26.04 ports, Arch RISC-V as `aom`) |
| RTCD dispatch (runtime CPU detect) | Yes | Yes | Yes when `CONFIG_RUNTIME_CPU_DETECT=1` (native builds); forced to 0 by the cross-compilation toolchain file |
| cmake toolchain file | Yes (native) | Yes (both gcc and clang variants) | Yes, gcc only (`cmake/toolchains/riscv-linux-gcc.cmake`); no riscv64 clang toolchain file exists |

libaom ships no binary releases for any architecture; every release is a source tarball. Binary availability for end users depends entirely on downstream distro packaging (see Section 8).

## 4. Technical Architecture and RISC-V-Specific Subsystems

libaom uses three mechanisms for performance-critical code: C with compiler intrinsics (SSE/AVX/NEON/RVV), hand-written assembly (x86 NASM/YASM, ARM `.S` files), and the RTCD (Run-Time CPU Detection) dispatch table generated by `av1_rtcd_defs.pl`. RISC-V uses only C intrinsics; there are no RISC-V `.S` assembly files and no JIT backend.

### ISA extensions used

The only extension used is RVV (RISC-V Vector extension, ratified v1.0). All source files under `av1/common/riscv/` use `<riscv_vector.h>` intrinsics and are compiled with `-march=rv64gcv`, hard-coded in `av1/av1.cmake` via `add_intrinsics_object_library("-march=rv64gcv" "rvv" "aom_av1_common" ...)`, applied only to the RVV translation units, not the whole build. No Zba, Zbb, Zbc, or other scalar bit-manipulation extensions are referenced.

LMUL values used: `mf4` (1/4), `mf2` (1/2), `m1` (1), `m2` (2). Runtime CPU detection uses `getauxval(AT_HWCAP)` checking `HWCAP_RVV = (1 << ('v' - 'a'))` in `aom_ports/riscv_cpudetect.c`; this is force-disabled (`CONFIG_RUNTIME_CPU_DETECT=0 CACHE STRING`) by the cross-compilation toolchain file, meaning cross-built binaries use static dispatch, while native (non-cross) builds such as the Debian/Ubuntu packages default it on.

### RVV source inventory (directly verified, live, 2026-09-30)

`av1/common/riscv/` contains 7 kernel `.c` files plus 3 headers, all real and compiled, zero TODO/FIXME/stub markers, hand-tuned LMUL-selected intrinsics:

| File | Lines | `__riscv_v*` intrinsic calls |
|---|---|---|
| cdef_block_rvv.c | 1,354 | 383 |
| convolve_rvv.c | 1,727 | 626 |
| highbd_convolve_rvv.c | 1,885 | 394 |
| compound_convolve_rvv.c | 2,964 | 874 |
| highbd_compound_convolve_rvv.c | 1,386 | 165 |
| wiener_convolve_rvv.c | 518 | 131 |
| highbd_wiener_convolve_rvv.c | 444 | 92 |

`aom_dsp/riscv/` exists but contains only `mem_rvv.h`, a shared memory-access helper header; zero kernel `.c` files, zero references in `aom_dsp/aom_dsp.cmake`, 0 RVV specializations out of 972 NEON-dispatched functions in `aom_dsp_rtcd_defs.pl`. `av1/encoder/riscv/` and `av1/decoder/riscv/` do not exist (HTTP 404).

### Component coverage

| Component | amd64 (SSE/AVX) | arm64 (NEON/SVE) | riscv64 (RVV) |
|-----------|-----------------|------------------|----------------|
| CDEF filter (find_dir, filter_8/16, copy_rect) | Intrinsics, full | NEON, full | RVV, full (1,354 lines, merged 2025-01) |
| Convolution 2D/X/Y/intraBC (8-bit) | Intrinsics, full | NEON, full | RVV, full (1,727 lines, merged 2025-05) |
| Convolution highbd (10/12-bit) | Intrinsics, full | NEON, full | RVV, full (1,885 lines, merged 2025-06); one known correctness gap, Change 208401, open |
| Compound convolution (8-bit) | Intrinsics, full | NEON, full | RVV, full (2,964 lines, merged 2026-03) |
| Compound convolution highbd | Intrinsics, full | NEON, full | RVV, full (1,386 lines, merged 2026-03) |
| Wiener restoration (8-bit) | Intrinsics, full | NEON, full | RVV, full (518 lines, merged 2026-04) |
| Wiener restoration highbd | Intrinsics, full | NEON, full | RVV, full (444 lines, merged 2026-04) |
| Inverse transform (all sizes, both bitdepths) | Intrinsics, full | NEON + SVE, full | Missing, falls back to scalar C |
| Forward transform | Intrinsics, full | NEON, full | Missing |
| Self-guided restoration | Intrinsics, full | NEON, full | Missing |
| Warp affine | Intrinsics, full | NEON + SVE, full | Missing |
| Intra prediction (DC, V, H, Paeth, Smooth, DR z1/z2/z3) | Intrinsics, full | NEON, full | Missing |
| SAD / sub-pixel variance (aom_dsp) | Intrinsics, full | NEON, full | Missing (0/972 RVV in aom_dsp) |
| Loopfilter (aom_dsp) | Intrinsics, full | NEON, full | Missing |
| Quantize / hadamard (aom_dsp) | Intrinsics, full | NEON, full | Missing |
| Encoder partitioning (av1/encoder) | Intrinsics, full | NEON, full | Missing (no `av1/encoder/riscv/` directory) |

RTCD dispatch table (`av1/common/av1_rtcd_defs.pl`) exposes exactly 33 `rvv` specializations, covering only CDEF and the convolve/wiener family; no inverse/forward transform, warp, self-guided restoration, or intra-prediction entries exist for RVV anywhere in the file. Two RTCD-coverage denominators were computed by different research passes and should be treated as complementary, not contradictory: the existing report's Section 4 compared against arm64's 141 NEON-dispatched `av1/common` functions (33/141 = 23%), while a later, independently-run adversarial verification pass compared against the full `av1/common` function population of roughly 175 (33/175 ~= 19%). Both readings agree on the same absolute numerator (33) and both agree that `aom_dsp` RVV coverage is 0/972 (0%); use 19-23% as the approximate `av1/common` coverage range depending on denominator choice.

The existing RVV code is production quality, with no stubs and hand-tuned intrinsics with explicit LMUL selection. `cdef_block_rvv.c` includes a documented approximation, "dividing by 1024 is close enough" for the variance computation, matching the ARM approach.

## 5. Build System, Cross-Compilation, and Toolchain

### Build commands

Standard cross-compilation (RVV enabled, the default):

```sh
cmake /path/to/aom \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/aom/cmake/toolchains/riscv-linux-gcc.cmake \
  -B build-riscv64
make -C build-riscv64
```

Disable RVV, pure-C riscv64 build:

```sh
cmake /path/to/aom \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/aom/cmake/toolchains/riscv-linux-gcc.cmake \
  -DENABLE_RVV=0 \
  -B build-riscv64-c
make -C build-riscv64-c
```

Generic fallback (no toolchain file, any architecture, unoptimized; the documented README workaround for unlisted targets):

```sh
cmake /path/to/aom -DAOM_TARGET_CPU=generic -B build-generic
make -C build-generic
```

Overriding the cross-compiler prefix (default `riscv64-linux-gnu-`):

```sh
CROSS=riscv64-unknown-linux-gnu- cmake ... -DCMAKE_TOOLCHAIN_FILE=.../riscv-linux-gcc.cmake
```

### Toolchain file content (verbatim, live-fetched from `cmake/toolchains/riscv-linux-gcc.cmake`, main branch)

```cmake
if(AOM_BUILD_CMAKE_TOOLCHAINS_RISCV_LINUX_GCC_CMAKE_)
  return()
endif()
set(AOM_BUILD_CMAKE_TOOLCHAINS_RISCV_LINUX_GCC_CMAKE_ 1)

set(CMAKE_SYSTEM_NAME "Linux")

if("${CROSS}" STREQUAL "")
  # Default the cross compiler prefix to one used by Debian and other package
  # management systems.
  set(CROSS riscv64-linux-gnu-)
endif()

if(NOT CMAKE_C_COMPILER)
  set(CMAKE_C_COMPILER ${CROSS}gcc)
endif()
if(NOT CMAKE_CXX_COMPILER)
  set(CMAKE_CXX_COMPILER ${CROSS}g++)
endif()
if(NOT CMAKE_ASM_COMPILER)
  set(CMAKE_ASM_COMPILER ${CROSS}as)
endif()

set(CMAKE_SYSTEM_PROCESSOR "riscv")

set(CONFIG_RUNTIME_CPU_DETECT 0 CACHE STRING "")
```

Added by Change 168261 (2022-12-15), last touched by Change 175122 (2023-05-10, default `CROSS` value) and Change 175124 (2023-05-11, comment cleanup). `CONFIG_RUNTIME_CPU_DETECT` is forced to 0 as a CACHE STRING, meaning it cannot be overridden by a later `-DCONFIG_RUNTIME_CPU_DETECT=1` on the same cmake invocation without `FORCE`.

### Toolchain version requirements

cmake minimum: 3.16 (top-level `CMakeLists.txt`).

No riscv64- or RVV-specific compiler-version check exists anywhere in the build system; `cmake/cpu.cmake` (riscv branch only sets `AOM_ARCH_RISCV64`/`HAVE_RVV`/`--disable-rvv`), `cmake/compiler_flags.cmake` (no riscv/RVV references at all), and `CMakeLists.txt` (its only `COMPILER_VERSION` checks are unrelated x86/general gates) were each checked directly and confirmed to contain no such gate. The general README guidance, "gcc 6+, clang 7+, Microsoft Visual Studio 2019+ or the latest version of MinGW-w64", is architecture-agnostic and predates RVV support; it is not sufficient for `-march=rv64gcv`. Practical minimum, inferred from the GCC RVV-intrinsics support timeline rather than stated by upstream: GCC 13+ for `-march=rv64gcv`/RVV 1.0 intrinsics, GCC 14 recommended (Debian trixie/sid ships `gcc-riscv64-linux-gnu` at GCC 14, confirmed working) [NEEDS VERIFICATION, no upstream statement]. No Clang toolchain file exists for riscv64 at all (unlike arm64, which has both gcc and clang toolchain files); a Clang cross-build requires manually setting `CMAKE_C_COMPILER`/`CMAKE_CXX_COMPILER` and is untested by upstream CI.

Relevant `ENABLE_*`/`CONFIG_*` flags (from `cmake/aom_config_defaults.cmake` and `cmake/cpu.cmake`): `-DENABLE_RVV=0|ON` (default ON) is the only riscv-specific toggle, causing `cmake/cpu.cmake` to append `--disable-rvv` to `AOM_RTCD_FLAGS` so the RTCD generator emits pure-C dispatch only; `-DCONFIG_RUNTIME_CPU_DETECT=0` is force-set by the toolchain file itself; `-DAOM_TARGET_CPU=generic` bypasses architecture detection entirely.

### QEMU and containers

No QEMU usage is documented anywhere in the libaom build system, README, or CI configuration. No Dockerfile exists anywhere in the repository (confirmed by a full top-level directory listing: no `docker/`, `Dockerfile`, or `.dockerignore`). Manual post-build test execution under QEMU user-mode is possible but not a documented libaom workflow: `qemu-riscv64 -L /usr/riscv64-linux-gnu ./test_binary`. On the open bug (Change 208401), James Zern personally used QEMU emulation to verify a fix when the patch author, who is not a committer, could not trigger CI.

### Known build issues

Change 208401 documents a build failure under `CONFIG_RUNTIME_CPU_DETECT=1` on real riscv64 hardware (BananaPi F3, SpacemiT K1): `implicit declaration of function 'av1_highbd_convolve_*_sr_c'`, because the RVV highbd convolve kernels fell back to C implementations for small (w==2 or h==2) blocks whose prototypes are not exposed through the generated `av1_rtcd.h` in that build mode. The cross-compilation toolchain forces `CONFIG_RUNTIME_CPU_DETECT=0`, so cross-built binaries are unaffected; native builds such as the Debian/Ubuntu packages use `CONFIG_RUNTIME_CPU_DETECT=1` by default and are potentially exposed to this bug for the affected block sizes. Change 210321 (merged 2026-04-10) separately moved the toolchain directory in a repository restructure; it is a path change, not codec logic.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

`aom_dsp` has zero RVV coverage; all of the following fall back to scalar C on riscv64: SAD and sub-pixel variance (all block sizes, used in encoder motion estimation), loopfilter, intra prediction, quantize/hadamard transform, temporal filter, high-bitdepth variance.

In `av1/common`, the following remain C-only on riscv64: inverse transform (all sizes, 8-bit and 10/12-bit, decoder critical path), self-guided restoration (decoder loop filter), warp affine (compound prediction), intra prediction (all modes). The inverse transform is the most significant decode-path gap: fully SIMD-optimized on x86 and arm64 across all transform sizes (4x4 through 64x64), pure C on riscv64.

Since libaom's decoder and encoder remain bitstream-conformant on generic scalar C for every unaccelerated function, these are performance gaps, not correctness gaps; a riscv64 build with 0% aom_dsp coverage still produces conformant output, just slower.

### Performance gaps

No public numeric performance benchmark data (FPS, cycles, speedup percentages) was found for libaom on riscv64 hardware, either in Gerrit commit/review threads for the key RVV changes or via third-party sources; Phoronix and general web search were unreachable during this research pass (see Section 15 caveats). The Debian build log for `aom` on the `rv-osuosl-02` riscv64 buildbot shows build times of 50 minutes to 1 hour 3 minutes for recent versions (2024-2026), versus an estimated 9-15 minutes in 2022 [NEEDS VERIFICATION, the 2022 figures are estimated from a broader pattern in the same log source, not independently confirmed]; this most plausibly reflects expanded test coverage and/or slower shared buildd hardware rather than a codec-specific regression.

The Debian `libaom-dev` riscv64 package for 3.13.1 shows an installed size of 34,485 kB versus approximately 7,400 kB for arm64, a roughly 4.6x discrepancy with no stated explanation; possible causes include retained generic code paths, unstripped debug symbols, or duplicated object files [NEEDS VERIFICATION, single-source finding].

### Security hardening gaps

Data not available: no audit of compiler hardening flags (`-fstack-protector`, `-D_FORTIFY_SOURCE`, shadow stack, or a BTI/PAC equivalent) across architectures was found in the research data.

### Floating-point semantics

libaom uses integer arithmetic throughout its SIMD paths. No floating-point SIMD or numerics divergence issues were found in the research data.

## 7. CI/CD Infrastructure

libaom has **no riscv64 CI**, confirmed by direct, repeated verification against the live repository and the live Jenkins job pages, not by inference. There is no `.github/workflows/`, `.cirrus.yml` (confirmed 404), `.gitlab-ci.yml`, or Jenkinsfile checked into the repository; CI runs entirely on an external Jenkins instance at [build.aomedia.org](https://build.aomedia.org), triggered from Gerrit uploads. Every RISC-V patchset (e.g. Change 208401, 211341, 210421) triggers `libaom__commit_trigger`, whose own job page lists exactly 16 downstream jobs: `libaom__abi_check, libaom__compile, libaom__compile_android, libaom__compile_experiments, libaom__encode_multijob, libaom__example_test, libaom__ffmpeg, libaom__patch_check, libaom__per_commit-compile_sanitizers, libaom__per_commit-compile_sanitizers-arm_native, libaom__per_commit-unit_test-sanitizers, libaom__per_commit-unit_test-sanitizers-arm_native, libaom__sizes, libaom__static_analysis, style-check, sync_node_repositories`. None targets riscv64. The `libaom__compile` job's own architecture matrix (`generic-gnu, x86-linux-clang, x86-linux-gcc, x86_64-linux-clang, x86_64-linux-gcc, armv7-linux-gcc, armv8-linux-gcc, armv8.4-linux-gcc, armv8.6-linux-gcc, x86-win32-gcc, x86_64-win64-gcc`) excludes riscv64 entirely. The `Verified +1` votes the AO Media bot posts on RISC-V Gerrit changes therefore reflect a build success check on x86/ARM/Windows, plus style/ABI/patch/sanitizer checks on x86 and arm_native, and say nothing about riscv64 correctness. Individual historical Jenkins build pages return 404 past a retention window, so raw console logs for a specific run could not be inspected; the job-definition pages remain the authoritative source for what the pipeline actually builds.

RISC-V/RVV validation instead relies on manual, out-of-band testing by contributors: Change 211341's commit message states "Verified on Banana Pi M3, Kendryte K230, and Andes FPGA", and on Change 208401 James Zern personally ran QEMU emulation to check a fix the community author could not push through CI as a non-committer.

RISE has no CI runner voting on libaom's Gerrit changes and is not listed as an AOMedia member or project on [riseproject.dev](https://riseproject.dev). RISE's only operational contact with libaom is the reverse relationship: libaom's own RVV kernels (shared code path also used by zlib-ng and pixman) SIGILL on RISE's own riscv64 CI runners when building dependent Python wheels (pyvips-binary), due to a GCC 13 finalized-spec rounding-mode intrinsic mismatch; RISE's workaround is to patch libaom's RVV kernels off in its own python-wheels pipeline rather than fix libaom itself (see Section 12).

| Metric | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| Automated build CI | Yes (Jenkins) | Yes (Jenkins, armv7/armv8/armv8.4/armv8.6) | No |
| Automated test CI | Yes | Yes | No |
| QEMU in CI | No | No | No (manual QEMU used once, ad hoc, by a reviewer) |
| Hardware runners | Yes | Yes | No |
| RISE runners | Not applicable | Not applicable | None configured for libaom; RISE's own riscv64 runners instead hit and patch around libaom's RVV SIGILLs in unrelated downstream builds |

## 8. Distribution and Release Status

Upstream releases are source tarballs only; no binary artifacts are attached to any release tag. The latest release is v3.15.1 (tagged 2026-09-21).

| Channel | riscv64 available | Version | Notes |
|---------|------------------|---------|-------|
| [aomedia.googlesource.com releases](https://aomedia.googlesource.com/aom/+refs) | No binaries (source only) | v3.15.1 | No binary assets for any architecture |
| [PyPI libaom](https://pypi.org/pypi/libaom/json) | Not applicable | None | No such PyPI project exists; HTTP 404 confirmed live on both `/pypi/libaom/json` and `/simple/libaom/` |
| RISE wheel builder ([wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/)) | Not applicable | None | libaom does not appear among the 80 tracked packages; not a PyPI project |
| [Debian sid libaom3](https://packages.debian.org/sid/libaom3) | Yes | 3.13.1-2+b1 | `.deb` confirmed: `libaom3_3.13.1-2+b1_riscv64.deb`, 1.3 MB |
| [Debian sid libaom-dev](https://packages.debian.org/sid/libaom-dev) | Yes | 3.13.1-2+b1 | Installed size 34,485 kB, anomalously large versus arm64's ~7,400 kB, see Section 6 |
| [Ubuntu 24.04 noble libaom3 (ports)](https://packages.ubuntu.com/noble/libaom3) | Yes (ports tier) | 3.8.2-2build1 | Ports tier; may lag security updates |
| [Ubuntu 26.04 resolute, package search](https://packages.ubuntu.com/search?keywords=libaom&searchon=names&section=all) | Yes | `libaom-dev`/`libaom3` 3.13.1-2 (ports pocket) and 3.13.1-2ubuntu0.1 (resolute-updates, all archs incl. riscv64) | Live-verified: "Found 3 matching packages" (`libaom-dev`, `libaom-doc`, `libaom3`) with riscv64 in both the ports and updates pockets |
| Arch Linux RISC-V ([repo index](https://archriscv.felixc.at/repo/extra/)) | Yes, under the package name `aom`, not `libaom` | 3.15.1-1 (23-Sep-2026) | `aom-3.15.1-1-riscv64.pkg.tar.zst` + `aom-docs` confirmed current in `[extra]`; the landing-page search box at `archriscv.felixc.at/?q=` is non-functional and a literal "libaom" search there returns nothing, a naming-convention artifact, not evidence of absence |

To get a working riscv64 binary: install `libaom3`/`libaom-dev` from Debian sid/trixie or Ubuntu 24.04/26.04 (ports), install `aom` from Arch Linux RISC-V's `[extra]` repo, or build from source using the supplied cmake toolchain file with `riscv64-linux-gnu-gcc`. All confirmed distro packages appear to build from unpatched upstream source (libaom already ships the `riscv-linux-gcc.cmake` toolchain file natively) and default to `CONFIG_RUNTIME_CPU_DETECT=1` (native build), so RVV dispatch is active at runtime if the CPU reports the V extension. Debian maintainer for the `aom` source package: Debian Multimedia Maintainers, co-maintainer James Cowgill (jcowgill@debian.org).

## 9. Dependencies

libaom's standard build (no Butteraugli tuning, no VMAF tuning, no TFLite) depends only on its build tooling, its always-on bundled third-party sources, pthreads, and libm; several further dependencies are pulled in only by optional `CONFIG_*` flags.

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------|------|--------------|--------------|-----------------|-------|
| CMake | Build-dependency, critical | N/A (build tool, not target-architecture code); cmake minimum 3.16 | N/A | Packaged for riscv64 by every major distro | Required for every libaom build on every architecture, including the riscv64 cross-build and native toolchain files described in Section 5 |
| GCC | Build-dependency, critical | `riscv64-linux-gnu-gcc` is the only compiler the cross toolchain file targets (no Clang toolchain file exists for riscv64, see Section 5) | N/A | Debian ships `gcc-riscv64-linux-gnu` (GCC 14), confirmed working | GCC 13+ needed for `-march=rv64gcv`/RVV 1.0 intrinsics [NEEDS VERIFICATION, inferred from the GCC support timeline, not stated by upstream] |
| Perl | Build-dependency, critical | Used to run `av1_rtcd_defs.pl`/`aom_dsp_rtcd_defs.pl`, generating the RTCD dispatch headers including the 33 `rvv` entries described in Section 4 | N/A | Packaged for riscv64 by every major distro | No riscv64-specific issues found |
| googletest | Test-dependency, critical | Bundled under `third_party/googletest`; pure C++, no SIMD | Used for libaom's own unit tests; not independently riscv64-tracked | Bundled source, not separately released | No riscv64 issues found |
| libyuv | Runtime-dependency, critical | Bundled `third_party/libyuv`, `CONFIG_LIBYUV`; web-verified present in Ubuntu 26.04 riscv64 (resolute) as `libyuv0`/`libyuv-dev` with real riscv64 `.deb` links; upstream RVV work actively in progress across multiple merged CLs (2025-2026) | Not tracked separately from aom's own test suite | Bundled source in aom; also independently distro-packaged | Active RVV optimization work upstream; no blocking issues found. Also tracked in `projects.yml`, no dedicated status report yet |
| libwebm | Runtime-dependency, optional | Bundled `third_party/libwebm`, `CONFIG_WEBM_IO`; pure C++, no SIMD; web-verified present in Ubuntu 26.04 riscv64 (resolute) as `libwebm1`/`libwebm-dev` | Not tracked separately | Bundled source; also independently distro-packaged | No riscv64 issues found. Tracked in `projects.yml`, no dedicated status report yet |
| Highway | Runtime-dependency, optional | Required only by `CONFIG_TUNE_BUTTERAUGLI`; web-verified present in Ubuntu 26.04 riscv64 (resolute) as `libhwy1t64`/`libhwy-dev` | Not independently verified here | Debian trixie/sid 1.2.0-1.3.0 | 2 open upstream issues: mold linker compatibility (#2854), `-march rv64gcv1p0` flag policy (#2738). New finding: Ubuntu's own `libjxl` riscv64 build control data explicitly excludes `libhwy1t64` (`[not armhf, riscv64, s390x]`), meaning downstream consumers are disabling Highway-accelerated code on riscv64 at package-build time even though Highway itself packages for riscv64, likely tied to the same flag-policy issue. See [`project-reports/highway.md`](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/highway.md) |
| libjxl | Runtime-dependency, optional | Required only by `CONFIG_TUNE_BUTTERAUGLI`; web-verified present in Ubuntu 26.04 riscv64 (resolute) as `libjxl0.11`/`libjxl-dev`; PR #2211 (missing `<atomic>` on RISC-V GCC) merged, no open blockers known | Not independently verified here | Debian trixie/sid 0.11.2 | Built on riscv64 without Highway acceleration, see Highway row above. Off by default in aom. See [`project-reports/libjxl.md`](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/libjxl.md) |
| libvmaf | Runtime-dependency, optional | Required only by `CONFIG_TUNE_VMAF`; web-verified **not packaged** for any Ubuntu suite including resolute (zero matches for keyword "vmaf") | N/A, not packaged | Not packaged for any Ubuntu release | Consumers vendor/build it themselves; no riscv64-specific issues filed since it is simply unpackaged, not broken. Off by default in aom. Tracked in `projects.yml`, no dedicated status report yet |
| TensorFlow Lite | Runtime-dependency, optional | Required only by `CONFIG_TFLITE`; aom vendors TF v2.6.1 via CMake `FetchContent` from GitHub, a separate code path from any distro package; the vendored build has a documented `cpuinfo`/`sys/hwprobe.h` build failure on riscv64 (upstream TF issue #64987, closed stale); web-verified the unrelated **distro** package is present in Ubuntu 26.04 riscv64 (resolute) as `libtensorflow-lite2.14.1`/`libtensorflow-lite-dev` | Not verified for aom's own vendored fetch path | Distro package 2.14.1 available; aom's vendored fetch has no riscv64 binary | Experimental, off by default in aom; not a blocker for standard builds. Distro `libtensorflow-lite` availability is a more positive data point than aom's own vendored-fetch path, which remains broken. Tracked in `projects.yml`, no dedicated status report yet |

`third_party/` also contains `fastfeat`, `vector`, and `x86inc`, which are test/internal-only and not treated as critical dependencies. A transitive SPARQL/graph-database cross-check of this dependency list could not be run this pass; the `project-graph` MCP server returned `CONNECTION_CLOSED` on every attempt, so the riscv64-availability data above comes from direct `packages.ubuntu.com` lookups against suite `resolute` rather than the graph tool, and should be treated as a verification gap to close on the next pass, not as a negative result.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [Change 208401](https://aomedia-review.googlesource.com/c/aom/+/208401) | riscv64: handle w==2 and h==2 blocks in highbd convolve RVV | Open (NEW), created 2026-03-13, last updated 2026-03-18, stalled roughly 6.5 months as of the research date (2026-09-30) | Medium-High | Correctness bug: w==2 and h==2 blocks are not handled by the highbd RVV convolve path under `CONFIG_RUNTIME_CPU_DETECT=1`, causing an implicit-declaration build failure on real hardware (BananaPi F3, SpacemiT K1). Fix changes size guards from `w == 4` to `w <= 4` and adds remainder-handling loops, mirroring the existing NEON approach. 11 review comments across 5 patch sets; patch sets 1-3 were `Verified -1` (failing), patch set 5 reached `Verified +1` after James Zern personally reproduced success via QEMU emulation. **No Code-Review score has been assigned**; the change remains unmerged. This affects the `CONFIG_RUNTIME_CPU_DETECT=1` path used by native (non-cross) builds, which is exactly how the Debian/Ubuntu riscv64 packages are built, see Section 13 |
| [Change 194481](https://aomedia-review.googlesource.com/c/aom/+/194481) | riscv64/cdef: add filter and dir intrinsic functions | Abandoned (opened 2024-10-30, abandoned 2025-01-13) | Low, historical | Earlier CDEF RVV attempt, killed by two Jenkins build failures (jobs 77872, 78185); superseded cleanly two weeks later by Change 196522, which merged |

No other open riscv64-specific correctness issues were found. libaom does not use GitHub issues; Gerrit is the sole tracker, and the AOMedia issue tracker (`aomedia.issues.chromium.org`, formerly `bugs.chromium.org/p/aomedia`) is a JS-rendered application that returns only a sign-in wall to non-browser fetches, so individual bugs referenced by Gerrit CLs (e.g. `aomedia:492439207`, referenced by Change 208401; `aomedia:3436`/`b/280585476`, referenced by Change 174581) could not be read directly, only inferred from the referencing CL's own commit message. There is no single umbrella/tracking bug for the riscv64 port; it was built incrementally through the individual Gerrit changes enumerated in Section 2, each referencing its own point bug rather than one tracking issue.

## 12. Objections and Upstream Blockers

No stated objections to RISC-V contributions were found anywhere in the research data. The pattern of 14 merged riscv-related Gerrit changes (9 of them RVV codec kernels) with only 3 abandoned (two killed by build failures, one superseded) and zero explicit rejections demonstrates the project accepts riscv64 work on its merits.

Technical requirements James Zern enforces on new optimizations, drawn from review threads: sorted includes, no extra blank lines, no trailing semicolons in macro bodies at call sites, macros wrapped in `do {} while (0)`, `static const` for lookup tables, comparison operand ordering `value == constant` rather than `constant == value`, a corresponding test modification in the relevant `test/*.cc` file for each new function, and RTCD dispatch-table changes consistent with existing conventions.

New kernel contributions must pass the Jenkins CI pipeline (`Verified +1` from the AO Media bot), but as established in Section 7 that pipeline runs zero riscv64 jobs; it verifies only that the change compiles cleanly under the x86/ARM/Windows matrix and does not break x86/arm_native sanitizer builds. This means an incorrect RVV implementation can reach `Verified +1` and merge as long as it compiles for other architectures. The absence of riscv64 CI is the primary structural risk identified in this report, and Change 208401's still-open correctness issue (stalled roughly 6.5 months) is a direct, observed consequence: no automated test exists that would have caught the w==2/h==2 edge case before the original patch merged.

RISE Project membership (verified live against [riseproject.dev/members](https://riseproject.dev/members/)) lists 20 organizations in two tiers. Premier Members (8): Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent. General Members (12): Akeana, **Andes Technology**, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE. Andes Technology, the sole active source of libaom's upstream RVV contributions, is a RISE **General** Member, not a Premier Member, and its libaom contributions are made independently rather than through a RISE-coordinated program; no direct AOM-RISE institutional link exists beyond shared corporate participants (principally Google, an AOM founding member and RISE Premier Member).

RISE's only operational involvement with libaom, found via the `riseproject-dev/python-wheels` GitHub repository, is downstream compatibility patching rather than upstream contribution: PR #1865 (luhenry, 2026-09-13) fixes a vendored-libaom header `select()` gap for riscv64 in tensorstore's build; PR #2379 (luhenry, 2026-09-26) drops zlib-ng/libaom/pixman RVV kernels in pyvips-binary because they SIGILL on RISE's own riscv64 CI runners, attributed to a GCC 13 finalized-spec rounding-mode intrinsic mismatch in libaom's RVV code; `.github/workflows/build-pyheif.yml` and two files under `skills/python-project-porting/references/gotchas/` in the same repository document further libaom-adjacent build friction (a CMake `FetchContent`/`CONFIG_AV1_HIGHBITDEPTH` flag-leak bug affecting `pillow-avif-plugin`). The single RISE blog post that mentions libaom, [riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) (Ludovic Henry, Qualcomm), states plainly: "libaom's RVV intrinsics want finalised-spec rounding mode arguments that GCC 13 does not have, which breaks Pillow's AVIF support." None of this constitutes funding or engineering contribution to libaom itself; it is downstream firefighting around libaom's RVV output in RISE's own pipelines.

Acceptance probability for new riscv64 contributions submitted to libaom directly remains high, provided the code meets the quality bar demonstrated by the CDEF and convolve reviews; James Zern is thorough but not hostile to the work, and he and Jerome Jiang have approved every substantial RISC-V patch that met that bar.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** libaom has zero upstream riscv64 CI. It is hosted on Gerrit with no GitHub Actions, and the internal Jenkins instance at [build.aomedia.org](https://build.aomedia.org) runs 33 jobs, none targeting riscv64; all 17+ RVV Gerrit changes merged on human code review alone, for example [Change 196521](https://aomedia-review.googlesource.com/c/aom/+/196521) and [Change 211341](https://aomedia-review.googlesource.com/c/aom/+/211341). On its own, that would grade orange. It is lifted to the yellow distribution floor because Debian sid/trixie and Ubuntu 24.04/26.04 build and ship `libaom3`/`libaom-dev` for riscv64 from what appears to be unpatched upstream source (libaom already ships a native `cmake/toolchains/riscv-linux-gcc.cmake` toolchain file upstream), confirmed via the live [Ubuntu package search](https://packages.ubuntu.com/search?keywords=libaom&searchon=names&section=all) and [Debian sid libaom3](https://packages.debian.org/sid/libaom3). libaom is not an optimization-purpose project: it is a full AV1 encode/decode codec whose value proposition is bitstream-conformant reference encoding/decoding, not raw speed, so it remains fully usable correctness-wise on generic C riscv64 builds even where RVV kernels are absent (0% RVV coverage in `aom_dsp`, Section 4).
- **Pending work that could change the grade:** [Change 208401](https://aomedia-review.googlesource.com/c/aom/+/208401) remains open/unmerged as of the research date, roughly 6.5 months stalled, and fixes a real correctness bug in highbd convolve RVV (w==2/h==2 blocks) that affects native `CONFIG_RUNTIME_CPU_DETECT=1` builds, exactly the build mode the Debian/Ubuntu packages use. This is worth re-checking on the next pass; if it turns out to affect shipped distro builds in practice, it could tip this toward orange or red. No RISE funding or CI coverage of libaom's RISC-V work exists; RISE's only contact is downstream patching, disabling libaom's RVV kernels in its own python-wheels pipeline, due to the GCC 13 rounding-mode intrinsic mismatch that SIGILLs on RISE's own riscv64 runners (Section 12). Andes Technology continues active upstream RVV development (convolve/CDEF/wiener families merged through v3.14.0), so coverage may expand; re-verify `aom_dsp` (SAD/variance/loopfilter/intra) and `av1/common` inverse-transform RVV coverage on the next pass, since those remain the largest scalar-fallback gaps.

## 14. Investment Analysis

RISE has no current funding or engineering relationship with libaom's upstream development to credit against sizing below; its only contact is the downstream compatibility patching described in Section 12 (disabling libaom's RVV kernels in the python-wheels pipeline), which addresses RISE's own build friction, not libaom's riscv64 coverage gaps, and is not a substitute for any item below.

### 14.1 Functional Enablement

The inverse transform (all block sizes, 8-bit and high-bitdepth) is the largest remaining decoder performance gap; on arm64, inverse-transform dispatch covers all transform sizes, on riscv64 it is pure C. Implementing RVV-accelerated inverse transform across the standard sizes (4x4, 8x8, 16x16, 32x32, 64x64, and asymmetric variants) would require roughly 2,000-4,000 lines of intrinsics code based on the size of the existing arm64 implementation and the pattern already established by the convolve/CDEF/wiener changes (1,354-2,964 lines per feature area). Self-guided restoration, warp affine, and intra prediction are secondary targets of similar shape. The `aom_dsp` layer (SAD, variance, loopfilter, quantize) is encoder-critical and currently has 0/972 RVV coverage; without it, encoder performance on riscv64 will remain substantially below x86/arm64 regardless of `av1/common` coverage.

### 14.2 Performance Optimization

No benchmark data is available from any source reached during this research pass (Section 6). Before committing to further optimization work, a baseline measurement on representative riscv64 hardware (Banana Pi M3/F3, Kendryte K230, SpacemiT K1, or an Andes FPGA, all already used informally by contributors per Section 2/5) is required. Given roughly 19-23% RTCD coverage in `av1/common` and 0% in `aom_dsp`, a reliable estimate of riscv64 decode/encode throughput relative to arm64 at equivalent clock speed cannot be derived from available data.

### 14.3 CI/CD Infrastructure

The complete absence of riscv64 CI (Section 7) is the systemic risk underlying this report's yellow grade. Change 208401 is a live demonstration that correctness issues in merged RVV code go undetected for months. Closing the gap requires either (a) contributing a riscv64 build/test job configuration upstream to the Jenkins pipeline at build.aomedia.org, or (b) standing up a RISE-hosted riscv64 CI runner that posts `Verified` votes on Gerrit. The project's CI model already accepts external Jenkins-style voting on Gerrit changes, so option (b) is procedurally feasible, and RISE already operates riscv64 CI runner infrastructure for other projects, it simply has none pointed at libaom today.

### 14.4 Ecosystem Enablement

Not applicable as a standalone work item; libaom has no dependent package ecosystem of its own requiring separate riscv64 enablement (no PyPI, npm, or Maven package under the `libaom` name, Section 8). Its downstream consumers on riscv64 are C/C++ projects such as FFmpeg (via `--enable-libaom`), GStreamer, and VLC, whose own riscv64 status is out of scope for this report, plus the Python-ecosystem consumers surfaced via RISE's python-wheels patching (tensorstore, pyvips-binary, pillow-avif-plugin) documented in Section 12, which are themselves symptoms of the `aom_dsp`/RVV-correctness gaps above rather than a separate investment area.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Close Change 208401 (w==2/h==2 highbd convolve edge case, stalled ~6.5 months, affects native RTCD=1 distro builds) | 0.5-1 (response to outstanding review comments + rebase) | Bruno Verachten (patch author) or Andes Technology | Critical |
| CI/CD | Add a riscv64 build+test job to the Jenkins pipeline, or stand up a RISE Gerrit CI voter for libaom | 2-3 | RISE infrastructure team | Critical |
| Functional | Implement RVV inverse transform (all sizes, 8-bit + highbd) in `av1/common/riscv/` | 6-10 | Andes Technology (existing contributor) or new | High |
| Functional | Implement RVV SAD/variance in `aom_dsp/riscv/` (encoder motion estimation, currently 0/972) | 8-12 | Andes Technology or new | High |
| Performance | Establish a riscv64 decode/encode benchmark baseline on hardware (Banana Pi F3, Kendryte K230, or SpacemiT K1) | 1-2 | Any | High, prerequisite for sizing further perf work |
| Functional | Implement RVV self-guided restoration in `av1/common/riscv/` | 3-5 | Andes Technology or new | Medium |
| Functional | Implement RVV intra prediction kernels in `av1/common/riscv/` | 5-8 | Andes Technology or new | Medium |
| Performance | Profile and tune existing RVV kernels (LMUL selection, vector-length effects) | 4-6 (after baseline) | Andes Technology or new | Medium |

## 15. References

- [libaom canonical source (aomedia.googlesource.com)](https://aomedia.googlesource.com/aom)
- [libaom CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG)
- [libaom README](https://aomedia.googlesource.com/aom/+/refs/heads/main/README.md)
- [Gerrit: Change 168201 - Add riscv cross build (ABANDONED)](https://aomedia-review.googlesource.com/c/aom/+/168201)
- [Gerrit: Change 168261 - Add riscv cross build (MERGED 2022-12-15, foundational)](https://aomedia-review.googlesource.com/c/aom/+/168261)
- [Gerrit: Change 169505 - Add riscv cross build, cherry-pick (MERGED 2023-01-20)](https://aomedia-review.googlesource.com/c/aom/+/169505)
- [Gerrit: Change 174581 - Revert cmake assembly-language support (ABANDONED)](https://aomedia-review.googlesource.com/c/aom/+/174581)
- [Gerrit: Change 175122 - riscv-linux-gcc.cmake CROSS value update (MERGED 2023-05-10)](https://aomedia-review.googlesource.com/c/aom/+/175122)
- [Gerrit: Change 175124 - cmake/toolchains CROSS comment update (MERGED 2023-05-11)](https://aomedia-review.googlesource.com/c/aom/+/175124)
- [Gerrit: Change 194481 - riscv64/cdef filter and dir intrinsics (ABANDONED)](https://aomedia-review.googlesource.com/c/aom/+/194481)
- [Gerrit: Change 196521 - riscv64: Introduce RVV and cpu-detection (MERGED 2025-01-14)](https://aomedia-review.googlesource.com/c/aom/+/196521)
- [Gerrit: Change 196522 - riscv64/cdef: Add the CDEF optimization (MERGED 2025-01-27)](https://aomedia-review.googlesource.com/c/aom/+/196522)
- [Gerrit: Change 199661 - riscv64: Add convolve 2d/x/y/intrabc optimization (MERGED 2025-05-20)](https://aomedia-review.googlesource.com/c/aom/+/199661)
- [Gerrit: Change 200781 - riscv64: Add header mem_rvv.h (MERGED 2025-06-25)](https://aomedia-review.googlesource.com/c/aom/+/200781)
- [Gerrit: Change 200782 - riscv64: Add highbd convolve optimization (MERGED 2025-06-25)](https://aomedia-review.googlesource.com/c/aom/+/200782)
- [Gerrit: Change 206581 - add compound convolve optimization (MERGED 2026-03-03)](https://aomedia-review.googlesource.com/c/aom/+/206581)
- [Gerrit: Change 206601 - add high bit depth compound convolve optimization (MERGED 2026-03-05)](https://aomedia-review.googlesource.com/c/aom/+/206601)
- [Gerrit: Change 208401 - riscv64: handle w==2 and h==2 blocks in highbd convolve RVV (OPEN)](https://aomedia-review.googlesource.com/c/aom/+/208401)
- [Gerrit: Change 210321 - Remove the build directory, move build/cmake up (MERGED 2026-04-10)](https://aomedia-review.googlesource.com/c/aom/+/210321)
- [Gerrit: Change 210421 - add wiener convolve optimization (MERGED 2026-04-22)](https://aomedia-review.googlesource.com/c/aom/+/210421)
- [Gerrit: Change 211341 - Add RVV optimization for high bit-depth wiener convolve (MERGED 2026-04-30)](https://aomedia-review.googlesource.com/c/aom/+/211341)
- [libaom Jenkins CI (build.aomedia.org)](https://build.aomedia.org)
- [Debian sid libaom3 package](https://packages.debian.org/sid/libaom3)
- [Debian sid libaom-dev package](https://packages.debian.org/sid/libaom-dev)
- [Debian buildd status for aom/riscv64](https://buildd.debian.org/status/package.php?p=aom&suite=sid)
- [Ubuntu 24.04 noble libaom3 (ports)](https://packages.ubuntu.com/noble/libaom3)
- [Ubuntu package search, libaom, all sections](https://packages.ubuntu.com/search?keywords=libaom&searchon=names&section=all)
- [Arch Linux RISC-V repo index, extra](https://archriscv.felixc.at/repo/extra/)
- [av1/common/riscv/ directory (main branch)](https://aomedia.googlesource.com/aom/+/refs/heads/main/av1/common/riscv)
- [av1/av1.cmake (build integration for RVV)](https://aomedia.googlesource.com/aom/+/refs/heads/main/av1/av1.cmake)
- [aom_ports/riscv.h](https://aomedia.googlesource.com/aom/+/refs/heads/main/aom_ports/riscv.h)
- [aom_ports/riscv_cpudetect.c](https://aomedia.googlesource.com/aom/+/refs/heads/main/aom_ports/riscv_cpudetect.c)
- [cmake/toolchains/riscv-linux-gcc.cmake](https://aomedia.googlesource.com/aom/+/refs/heads/main/cmake/toolchains/riscv-linux-gcc.cmake)
- [cmake/toolchains/ directory listing](https://aomedia.googlesource.com/aom/+/refs/heads/main/cmake/toolchains/)
- [cmake/cpu.cmake](https://aomedia.googlesource.com/aom/+/refs/heads/main/cmake/cpu.cmake)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE blog: PyTorch is available on riscv64 (2026-08-18, mentions libaom)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE python-wheels repository (GitHub)](https://github.com/riseproject-dev/python-wheels)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Andes Technology](https://www.andestech.com/)
- [Project status report: Highway](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/highway.md)
- [Project status report: libjxl](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/libjxl.md)