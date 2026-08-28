---
title: libaom
categories:
  - multimedia
  - browser
---

# libaom

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libaom
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libaom is the reference implementation of the AV1 video codec, maintained by the Alliance for Open Media (AOMedia). AOMedia is a Joint Development Foundation project founded in 2015; its members include Google, Apple, Meta, Netflix, Mozilla, Nvidia, Intel, Arm, and others. The codec is dual-licensed under BSD-2-Clause and the AOMedia Patent License 1.0. libaom covers both encoder and decoder; it is the baseline against which all AV1 encoder quality comparisons are made.

Code review is conducted on Gerrit at [aomedia-review.googlesource.com](https://aomedia-review.googlesource.com). The [GitHub repository AOMediaCodec/aom](https://github.com/AOMediaCodec/aom) is a read-only mirror; it has no issue tracker and no pull requests. All patches must be submitted through Gerrit and pass CI before merge.

Governance is through AOMedia working groups. The Software Implementation Working Group (SIWG) is co-chaired by Ioannis Katsavounidis (Meta), Leo Zhao (Tencent), and Yunqing Wang (Google). The primary code reviewer and technical gatekeeper for all RISC-V changes is James Zern (Google). Secondary reviewer is Jerome Jiang (Google). Both must grant Code-Review +2 before a patch can be submitted.

The project has a high code quality bar. The first substantial RVV patch (CDEF, 1,437 lines) required 8 patch sets and 53 review comments over two weeks before James Zern approved it. Contributions from AOMedia member organizations are exempt from individual CLA signing; non-member contributors require CLA.

The contributor community is open to new architecture ports. The repository ships per-architecture cmake toolchain files for arm64, armv7, ppc, x86, and riscv64 without controversy. The README explicitly documents the `-DAOM_TARGET_CPU=generic` fallback for unsupported targets. There is no formal tier policy or PLATFORMS.md.

The active RISC-V contributors are from [Andes Technology](https://www.andestech.com/), a RISC-V chip company and RISE Premier Member. Google (James Zern, Jerome Jiang) handles all review.

---

## 2. Port History and Upstreaming Timeline

All work is fully upstream in the canonical Gerrit repository. There are no out-of-tree forks or vendor branches.

| Date | Event | Source |
|------|-------|--------|
| 2022-12-14 | Change 169505 merged: `cmake/toolchains/riscv-linux-gcc.cmake` added. First RISC-V support. Authored by Wan-Teh Chang (Google). One-day review. | [aomedia-review 169505](https://aomedia-review.googlesource.com/c/aom/+/169505) |
| 2023-02-03 | v3.6.0 CHANGELOG: "RISC-V architecture support with gcc toolchain." | [CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG) |
| 2023-05-10 | Changes 175122/175124 merged: toolchain comment cleanup. | [175122](https://aomedia-review.googlesource.com/c/aom/+/175122), [175124](https://aomedia-review.googlesource.com/c/aom/+/175124) |
| 2025-01-14 | Change 196521 merged: `aom_ports/riscv.h` + `riscv_cpudetect.c` + cmake RVV infrastructure. Authored by Jerry And (Andes Technology). Foundational RVV support. | [196521](https://aomedia-review.googlesource.com/c/aom/+/196521) |
| 2025-01-27 | Change 196522 merged: `av1/common/riscv/cdef_block_rvv.c`, 1,437 lines. First optimized kernel. 8 patch sets, 53 review comments. | [196522](https://aomedia-review.googlesource.com/c/aom/+/196522) |
| 2025-02-10 | v3.12.0 CHANGELOG: "Add the CDEF optimization for RISC-V." | [CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG) |
| 2025-05-20 | Change 199661 merged: convolution 2D/X/Y/intraBC (8-bit). | [199661](https://aomedia-review.googlesource.com/c/aom/+/199661) |
| 2025-06-25 | Changes 200781/200782 merged: `mem_rvv.h` helper header + highbd convolution. | [200781](https://aomedia-review.googlesource.com/c/aom/+/200781), [200782](https://aomedia-review.googlesource.com/c/aom/+/200782) |
| 2026-03-03 | Change 206581 merged: compound convolution (8-bit). | [206581](https://aomedia-review.googlesource.com/c/aom/+/206581) |
| 2026-03-05 | Change 206601 merged: high-bitdepth compound convolution. | [206601](https://aomedia-review.googlesource.com/c/aom/+/206601) |
| 2026-03-13 | Change 208401 opened: w==2/h==2 edge case fix in highbd convolve RVV. Still open as of 2026-03-18. | [208401](https://aomedia-review.googlesource.com/c/aom/+/208401) |
| 2026-04-22 | Change 210421 merged: Wiener convolution (8-bit). | [210421](https://aomedia-review.googlesource.com/c/aom/+/210421) |
| 2026-04-30 | Change 211341 merged: high-bitdepth Wiener convolution. Most recent merged RISC-V change. | [211341](https://aomedia-review.googlesource.com/c/aom/+/211341) |
| 2026-05-12 | v3.14.0 released, containing the Wiener RVV changes. | [CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG) |

Key contributors:

| Person | Org | Role |
|--------|-----|------|
| Wan-Teh Chang (wtc@google.com) | Google | Authored original cross-build toolchain cmake (Change 169505) |
| Jerry And (andes-jerry, andesjj97@gmail.com) | Andes Technology | Authored RVV infrastructure + CDEF + convolve kernel changes |
| arron wu (andes-ttwu, alias.ttwu@gmail.com) | Andes Technology | Authored Wiener convolve RVV changes (210421, 211341) |
| Bruno Verachten (gounthar@gmail.com) | Unknown | Author of open Change 208401 (edge case fix) |
| James Zern (jzern@google.com) | Google | Primary gatekeeper; Code-Review +2 on all RISC-V merges; submitter |
| Jerome Jiang (jianj@google.com) | Google | Secondary reviewer; Code-Review +2 on all major changes |

All changes are fully upstream. No downstream patches, no vendor branches, no out-of-tree forks known.

---

## 3. Upstream Support Tier

libaom has no documented formal tier policy. There is no PLATFORMS.md, no SUPPORT.md, no CODEOWNERS, and no MAINTAINERS file. The project implicitly accepts new architectures via the generic C fallback and the pattern of shipping per-architecture cmake toolchain files.

RISC-V is not release-blocking. The Jenkins CI at [build.aomedia.org](https://build.aomedia.org) runs 33 jobs; none target riscv64. RVV patches were reviewed and merged without any automated riscv64 CI run confirming correctness.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build job | Yes (Jenkins) | Yes (Jenkins, multiple variants) | No |
| CI test job | Yes | Yes | No |
| Official binary releases | Source tarball only | Source tarball only | Source tarball only |
| Distro binary packages | Yes (Debian, Ubuntu, Fedora, Arch) | Yes | Yes (Debian sid, Ubuntu noble ports) |
| RTCD dispatch (runtime CPU detect) | Yes | Yes | Yes (when CONFIG_RUNTIME_CPU_DETECT=1; disabled in cross toolchain) |
| cmake toolchain file | Yes (native) | Yes | Yes (`cmake/toolchains/riscv-linux-gcc.cmake`) |

libaom ships no binary releases for any architecture; all releases are source tarballs. Binary availability depends entirely on downstream packaging.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libaom uses three mechanisms for performance-critical code: C with compiler intrinsics (SSE/AVX/NEON/RVV), hand-written assembly (x86 NASM/YASM, ARM .S files), and the RTCD (Run-Time CPU Detection) dispatch table generated by `av1_rtcd_defs.pl`. RISC-V uses only C intrinsics; there are no RISC-V assembly files.

### ISA extensions used

The only ISA extension used is RVV (RISC-V Vector extension, ratified v1.0). All 10 source files in `av1/common/riscv/` use `<riscv_vector.h>` intrinsics. No Zba, Zbb, Zbc, or other scalar extensions are referenced. Compiled with `-march=rv64gcv`.

LMUL values used: `mf4` (1/4), `mf2` (1/2), `m1` (1), `m2` (2). Types: `vuint8mf4_t`, `vuint8mf2_t`, `vint16mf2_t`, `vint16m1_t`, `vuint16mf2_t`, `vuint16m1_t`, `vint32m1_t`, `vint32m2_t`, `vuint32m1_t`.

Runtime CPU detection via `getauxval(AT_HWCAP)` checking `HWCAP_RVV = (1 << ('v' - 'a'))` in `aom_ports/riscv_cpudetect.c`. This is disabled (`CONFIG_RUNTIME_CPU_DETECT=0`) by the cross-compilation toolchain file, meaning cross-built binaries use static dispatch.

### Component coverage

| Component | amd64 (SSE/AVX) | arm64 (NEON/SVE) | riscv64 (RVV) |
|-----------|-----------------|------------------|----------------|
| CDEF filter (find_dir, filter_8/16, copy_rect) | Intrinsics, full | NEON, full | RVV, full (1,354 lines, merged 2025-01) |
| Convolution 2D/X/Y/intraBC (8-bit) | Intrinsics, full | NEON, full | RVV, full (1,727 lines, merged 2025-05) |
| Convolution highbd (10/12-bit) | Intrinsics, full | NEON, full | RVV, full (1,885 lines, merged 2025-06) |
| Compound convolution (8-bit) | Intrinsics, full | NEON, full | RVV, full (2,964 lines, merged 2026-03) |
| Compound convolution highbd | Intrinsics, full | NEON, full | RVV, full (1,386 lines, merged 2026-03) |
| Wiener restoration (8-bit) | Intrinsics, full | NEON, full | RVV, full (518 lines, merged 2026-04) |
| Wiener restoration highbd | Intrinsics, full | NEON, full | RVV, full (444 lines, merged 2026-04) |
| Inverse transform (all sizes, both bitdepths) | Intrinsics, full | NEON + SVE, full | Missing |
| Forward transform | Intrinsics, full | NEON, full | Missing |
| Self-guided restoration | Intrinsics, full | NEON, full | Missing |
| Warp affine | Intrinsics, full | NEON + SVE, full | Missing |
| Intra prediction (DC, V, H, Paeth, Smooth, DR z1/z2/z3) | Intrinsics, full | NEON, full | Missing |
| SAD / sub-pixel variance (aom_dsp) | Intrinsics, full | NEON, full | Missing (0 RVV in aom_dsp) |
| Loopfilter (aom_dsp) | Intrinsics, full | NEON, full | Missing |
| Quantize / hadamard (aom_dsp) | Intrinsics, full | NEON, full | Missing |
| Encoder partitioning (av1/encoder) | Intrinsics, full | NEON, full | Missing (no av1/encoder/riscv/ directory) |

RTCD dispatch coverage: `av1/common` NEON has 141 dispatched functions; RVV has 33 (23%). `aom_dsp` NEON has 925 dispatched functions; RVV has 0 (0%).

The existing RVV code is production quality -- no stubs, no TODO markers, hand-tuned intrinsics with explicit LMUL selection. The CDEF file includes a documented approximation: "dividing by 1024 is close enough" for the variance computation, matching the ARM approach.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Build commands

Standard cross-compilation:

```sh
cmake /path/to/aom \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/aom/cmake/toolchains/riscv-linux-gcc.cmake \
  -B build-riscv64
make -C build-riscv64
```

To disable RVV and use pure C:

```sh
cmake /path/to/aom \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/aom/cmake/toolchains/riscv-linux-gcc.cmake \
  -DENABLE_RVV=0 \
  -B build-riscv64-c
make -C build-riscv64-c
```

To build without any architecture-specific code (no toolchain file needed):

```sh
cmake /path/to/aom -DAOM_TARGET_CPU=generic -B build-generic
make -C build-generic
```

### Toolchain file content summary

`cmake/toolchains/riscv-linux-gcc.cmake` (added Change 169505, 2023-01-20):

- `CMAKE_SYSTEM_NAME = "Linux"`
- Default `CROSS = riscv64-linux-gnu-` (Debian cross-compiler package naming). Override via env var or `-DCROSS=riscv64-unknown-linux-gnu-`.
- Sets `CMAKE_C_COMPILER = ${CROSS}gcc`, `CMAKE_CXX_COMPILER = ${CROSS}g++`, `CMAKE_ASM_COMPILER = ${CROSS}as`
- `CMAKE_SYSTEM_PROCESSOR = "riscv"`
- `CONFIG_RUNTIME_CPU_DETECT = 0` forced (no `getauxval` in cross builds; static dispatch only)

### Toolchain version requirements

cmake minimum: 3.16 (from `CMakeLists.txt`).

For RVV (`-march=rv64gcv`):
- GCC 12 or later required for stable V extension intrinsics and `<riscv_vector.h>` support [NEEDS VERIFICATION - derived from known GCC support timeline; no explicit statement in libaom cmake files]
- Clang 14 or later for stable RISC-V V intrinsics [NEEDS VERIFICATION - same caveat]
- The toolchain file only generates GCC invocations; no Clang toolchain file exists for riscv64

Debian provides `gcc-riscv64-linux-gnu` (currently GCC 14) which satisfies the version requirement.

### QEMU

No QEMU usage is documented in any build system file. No Dockerfile exists in the repository. For manual cross-build test execution the standard invocation applies:

```sh
qemu-riscv64 -L /usr/riscv64-linux-gnu ./test_binary
```

This is not described in libaom documentation. The upstream Jenkins CI has no riscv64 worker and does not use QEMU for riscv64.

### Known build issues

Change 208401 (open) documents that building with `CONFIG_RUNTIME_CPU_DETECT=1` using certain compiler configurations produces implicit declaration errors in the highbd convolve RVV path. The exact reproduction condition was under discussion between the patch author and James Zern as of 2026-03-18. The cross-compilation toolchain forces `CONFIG_RUNTIME_CPU_DETECT=0` so this does not affect cross-built binaries.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps (cannot execute the function with SIMD acceleration)

The `aom_dsp` layer has zero RVV coverage. On riscv64 all of the following fall back to C scalar:

- SAD and sub-pixel variance (all block sizes) -- used in encoder motion estimation; decoder not affected
- Loopfilter
- Intra prediction
- Quantize and hadamard transform
- Temporal filter
- High-bitdepth variance

In `av1/common`, the following are C-only on riscv64:

- Inverse transform (all sizes, 8-bit and 10/12-bit) -- decoder critical path
- Self-guided restoration (decoder loop filter)
- Warp affine (compound prediction)
- Intra prediction (all modes)

The inverse transform is the most significant gap for decode performance. On x86 and arm64 it is fully SIMD-optimized across all transform sizes (4x4 through 64x64). On riscv64 it is pure C for all sizes.

### Performance gaps

No public numeric benchmark data could be found for libaom on riscv64 hardware. The Debian build log for `aom` on the `rv-osuosl-02` riscv64 buildbot shows build times of 50 minutes to 1 hour 3 minutes for recent versions (2024-2026), compared to approximately 9-15 minutes in 2022 [NEEDS VERIFICATION - the 2022 figures are estimated from a broader pattern; exact earlier times are from the same Debian build log source]. This reflects expanded test coverage and/or slower hardware, not a specific performance regression.

The Debian `libaom-dev` riscv64 package for 3.13.1 shows an installed size of 34,485 kB versus approximately 7,400 kB for arm64 -- a 4.6x size discrepancy. No explanation is provided. This may indicate the riscv64 package retains more generic code paths, unstripped debug symbols, or duplicated object files [NEEDS VERIFICATION].

### Security hardening gaps

Data not available: no audit of compiler hardening flags (`-fstack-protector`, `-D_FORTIFY_SOURCE`, shadow stack, BTI/PAC equivalent) across architectures was found in the research data.

### Floating-point semantics

libaom uses integer arithmetic throughout its SIMD paths. No floating-point SIMD or numerics divergence issues were found in the research data.

---

## 7. CI/CD Infrastructure

The upstream CI is Jenkins at [build.aomedia.org](https://build.aomedia.org). All 33 jobs were enumerated. The `libaom__commit_trigger` job fires on every Gerrit upload and drives 16 downstream jobs. Architecture axes confirmed:

- `libaom__compile`: generic-gnu, x86, x86_64, armv7-linux-gcc, armv8-linux-gcc, armv8.4-linux-gcc, armv8.6-linux-gcc, x86-win32-gcc, x86_64-win64-gcc
- `libaom__nightly_compile`: x86, x86_64
- `libaom__compile_android`: armeabi-v7a, arm64-v8a, x86, x86_64
- `libaom__compile_experiments`: generic-gnu, x86/x86_64 linux-clang/gcc variants

No riscv64 target exists in any Jenkins job. The `Verified +1` label granted by the AO Media bot on all RISC-V Gerrit changes reflects a build success check on the above targets -- not riscv64.

RISE runners: no RISE involvement in libaom CI was found. RISE blog posts (28 reviewed, May 2024 through June 2026) contain no mention of libaom.

| Metric | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| Automated build CI | Yes (Jenkins) | Yes (Jenkins, 4 variants) | No |
| Automated test CI | Yes | Yes | No |
| QEMU in CI | No | No | No |
| Hardware runners | Yes | Yes | No |
| RISE runners | Not applicable | Not applicable | None configured |

All merged RVV patches passed a human code review by two Google engineers but were not validated by automated riscv64 tests before merge.

---

## 8. Distribution and Release Status

Upstream releases are source tarballs only. No binary artifacts are attached to any release tag. The latest release is v3.14.1.

| Channel | riscv64 available | Version | Notes |
|---------|------------------|---------|-------|
| [aomedia.googlesource.com releases](https://aomedia.googlesource.com/aom/+refs) | No binaries (source only) | v3.14.1 | No binary assets for any architecture |
| [PyPI libaom](https://pypi.org/project/libaom/) | Not applicable | None | Package does not exist on PyPI; HTTP 404 |
| RISE wheel builder | Not applicable | None | No libaom package on RISE GitLab |
| [Debian sid libaom3](https://packages.debian.org/sid/libaom3) | Yes | 3.13.1-2+b1 | `.deb` confirmed: `libaom3_3.13.1-2+b1_riscv64.deb`, 1.3 MB, SHA256 `2e26205a901ad793dff066acd4b49a57c7f5a9504a614ce7c9952e969da0128c` |
| [Debian sid libaom-dev](https://packages.debian.org/sid/libaom-dev) | Yes | 3.13.1-2+b1 | Installed size 34,485 kB (anomalously large vs arm64 at ~7,400 kB) |
| [Ubuntu 24.04 noble ports](https://packages.ubuntu.com/noble/libaom3) | Yes (ports tier) | 3.8.2-2build1 | Ports tier; may lag security updates |
| [Arch Linux RISC-V](https://archriscv.felixc.at/) | Unknown | Unknown | Not listed in the archriscv status page; no definitive result obtained |

To get a working riscv64 binary: install `libaom3` from Debian sid or Debian trixie, or build from source using the supplied cmake toolchain file with `riscv64-linux-gnu-gcc`. The Debian packages ship with `CONFIG_RUNTIME_CPU_DETECT` enabled (native build), so RVV dispatch is active if the CPU supports it.

Debian maintainer for the `aom` source package: Debian Multimedia Maintainers; co-maintainer James Cowgill (jcowgill@debian.org).

---

## 9. Dependencies

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------|------|--------------|--------------|-----------------|-------|
| libyuv (bundled `third_party/libyuv`) | YUV color conversion and scaling with SIMD | Builds; RVV actively developed in upstream (multiple CLs merged 2025-2026) | Not tracked separately | Not independently packaged; bundled source | Active RVV optimization work; no blocking issues |
| libwebm (bundled `third_party/libwebm`) | WebM container mux/demux | Builds; pure C++, no SIMD | Not tracked | Not independently packaged | No riscv64 issues; not a blocker |
| libhwy (`third_party/highway`, optional with `CONFIG_TUNE_BUTTERAUGLI`) | SIMD abstraction for Butteraugli tuning | Builds; RVV 1.0 target supported (Clang 19+ dispatch merged Apr 2026) | Tested via QEMU in upstream CI | Packaged Debian trixie/sid 1.2.0-1.3.0 | 2 open upstream issues: mold linker compat (#2854), `-march rv64gcv1p0` flag policy (#2738); not blocking standard builds |
| libjxl (optional with `CONFIG_TUNE_BUTTERAUGLI`) | JPEG XL encoder/decoder for Butteraugli tuning | Builds on riscv64; PR #2211 (missing `<atomic>` for RISC-V GCC) merged | No dedicated riscv64 CI | Packaged Debian trixie/sid 0.11.2 | No open riscv64 blocking issues; off by default |
| libvmaf (optional with `CONFIG_TUNE_VMAF`) | Perceptual video quality metric | Builds (no reported failures); has x86/ARM SIMD with generic fallbacks | Not reported | Not packaged for riscv64 in Debian | Off by default; no riscv64 issues filed |
| TensorFlow Lite (optional with `CONFIG_TFLITE=1`) | ML-based encoder partitioning | Partial: cpuinfo build failure on RISC-V (`sys/hwprobe.h` missing, TF issue #64987, closed stale); no RVV kernel support | Not tested on riscv64 | Not packaged for riscv64 | Experimental, off by default; not a blocker for standard builds |
| libm / pthreads (glibc) | Math, threading | Fully supported | Tested as part of glibc | Part of standard glibc | No issues |

The standard libaom build (no Butteraugli, no VMAF, no TFLite) depends only on bundled libyuv, bundled libwebm, pthreads, and libm. All are functional on riscv64 with no blocking issues. The Butteraugli optional path (libjxl + libhwy) is near-complete on riscv64; the TFLite path has a build failure but is experimental.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [Change 208401](https://aomedia-review.googlesource.com/c/aom/+/208401) | riscv64: handle w==2 and h==2 blocks in highbd convolve RVV | Open (NEW), stalled since 2026-03-18 | Medium | Correctness: w==2 and h==2 block sizes not handled in highbd RVV convolution path. Fix changes `if (w == 4)` to `if (w <= 4)` and adds remainder-handling loops. Build passes Verified+1 (PS5, rebased by James Zern). Blocked on 2 unresolved reviewer comments about whether the original build failure reproduces from a clean out-of-tree build with `CONFIG_RUNTIME_CPU_DETECT=0`. No Code-Review score assigned yet. |

No other open riscv64-specific correctness issues found. The upstream project does not use GitHub issues; Gerrit is the sole tracker, and the Gerrit search interface does not expose a public issue URL for performance or functional reports outside the review context.

**Correctness note:** Change 208401 affects only the `CONFIG_RUNTIME_CPU_DETECT=1` build path for small (2x2 and 2x4) high-bitdepth blocks. The cross-compilation toolchain forces `CONFIG_RUNTIME_CPU_DETECT=0` so cross-built binaries are not affected. Native Debian builds (which use RTCD=1) are potentially affected for those block sizes.

---

## 12. Objections and Upstream Blockers

No stated objections to RISC-V contributions were found. The existing pattern (12 merged RISC-V changes from Andes Technology with no rejection) demonstrates the project accepts riscv64 work.

Technical requirements imposed by James Zern for new optimizations:

- Includes must be sorted. No extra blank lines. No trailing semicolons in macro bodies at call sites.
- Wrap macros in `do {} while (0)`.
- `static const` for lookup tables.
- Comparison operand ordering must be `value == constant`, not `constant == value`.
- Each function must have a corresponding test modification in the relevant `test/*.cc` file.
- Changes to `av1_rtcd_defs.pl` must be consistent with the dispatch table conventions.

New kernel contributions require passing the Jenkins CI pipeline (`Verified +1` from the AO Media bot). The bot does not run riscv64 tests; it runs x86/arm builds. This means an incorrect RVV implementation can be merged as long as it compiles.

The absence of riscv64 CI is the primary structural risk: there is no automated regression gate for the riscv64 path. Change 208401's correctness issue (stalled 3 months as of this report) is a direct consequence -- there is no automated test that would have caught the w==2/h==2 edge case before the patch was written.

Acceptance probability for new riscv64 contributions: high, provided the code meets the quality bar demonstrated by the CDEF review. James Zern is thorough but not hostile to the work; he and Jerome Jiang have approved every substantial RISC-V patch that met the quality bar.

---

## 13. Investment Analysis

RISE has no current involvement in libaom. Andes Technology (a RISE Premier Member) is the primary contributor, but their contributions are made independently, not through a RISE-coordinated program.

### 13.1 Functional Enablement

The inverse transform (all block sizes, 8-bit and high-bitdepth) is the largest decoder performance gap. It is the most computationally intensive path after convolution (which is now covered). On arm64, inverse transform dispatch covers all transform sizes; on riscv64 it falls back to C. Implementing RVV-accelerated inverse transform across the standard sizes (4x4, 8x8, 16x16, 32x32, 64x64, and the asymmetric variants) would require approximately 2,000-4,000 lines of intrinsics code based on the size of the existing arm64 implementation and the pattern established by the convolve/CDEF changes.

Self-guided restoration, warp affine, and intra prediction are secondary targets.

The `aom_dsp` layer (SAD, variance, loopfilter) is encoder-critical. Without it, encoder performance on riscv64 will be substantially below x86/arm64 regardless of the `av1/common` coverage.

### 13.2 Performance Optimization

No benchmark data is available. Before committing to optimization work, a baseline measurement on representative riscv64 hardware (VisionFive 2, Milk-V Pioneer, or QEMU with hardware baseline) is required. Given 23% RTCD coverage in `av1/common` and 0% in `aom_dsp`, a rough estimate for decode throughput on riscv64 relative to arm64 at equivalent clock speed is not possible from available data.

### 13.3 CI/CD Infrastructure

The complete absence of riscv64 CI is a systemic risk. Change 208401 demonstrates that correctness issues in merged RVV code go undetected. Adding a riscv64 QEMU build+test job to the Jenkins pipeline requires either (a) contributing a new Jenkins job configuration upstream, or (b) establishing a RISE-hosted CI runner that reports Gerrit Verified votes.

Option (b) is feasible: the project accepts external CI votes on Gerrit if configured. The RISE CI infrastructure already operates RISC-V runners for other projects.

### 13.4 Ecosystem Enablement

libaom has no dependent package ecosystem requiring separate enablement (no PyPI package, no npm, no Maven JARs). The primary downstream consumers on riscv64 are FFmpeg (via `--enable-libaom`), GStreamer, and VLC. Those projects have separate RISC-V status that is not analyzed here.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Implement RVV inverse transform (all sizes, 8-bit + highbd) in `av1/common/riscv/` | 6-10 | Andes Technology (existing contributor) or new | Critical |
| Functional | Implement RVV SAD/variance in `aom_dsp/riscv/` (encoder motion estimation) | 8-12 | Andes Technology or new | High |
| Functional | Close Change 208401 (w==2/h==2 highbd convolve edge case) | 0.5 (response to James Zern's comment + rebase) | Bruno Verachten (patch author) or Andes | High |
| Functional | Implement RVV self-guided restoration in `av1/common/riscv/` | 3-5 | Andes Technology or new | Medium |
| Functional | Implement RVV intra prediction kernels in `av1/common/riscv/` | 5-8 | Andes Technology or new | Medium |
| CI/CD | Add riscv64 QEMU build+test job to Jenkins or establish RISE Gerrit CI voter | 2-3 | RISE infrastructure team | Critical |
| Performance | Establish riscv64 decode/encode benchmark baseline on hardware | 1-2 | Any | High (prerequisite for sizing perf work) |
| Performance | Profile and tune existing RVV kernels (LMUL selection, vector length effects) | 4-6 (after baseline) | Andes Technology or new | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libaom canonical source (aomedia.googlesource.com)](https://aomedia.googlesource.com/aom)
- [libaom CHANGELOG](https://aomedia.googlesource.com/aom/+/refs/heads/main/CHANGELOG)
- [Gerrit: Change 169505 - Add riscv cross build (MERGED 2023-01-20)](https://aomedia-review.googlesource.com/c/aom/+/169505)
- [Gerrit: Change 196521 - riscv64: Introduce RVV and cpu-detection (MERGED 2025-01-14)](https://aomedia-review.googlesource.com/c/aom/+/196521)
- [Gerrit: Change 196522 - riscv64/cdef: Add the CDEF optimization (MERGED 2025-01-27)](https://aomedia-review.googlesource.com/c/aom/+/196522)
- [Gerrit: Change 199661 - riscv64: Add convolve 2d/x/y/intrabc optimization (MERGED 2025-05-20)](https://aomedia-review.googlesource.com/c/aom/+/199661)
- [Gerrit: Change 200781 - riscv64: Add header mem_rvv.h (MERGED 2025-06-25)](https://aomedia-review.googlesource.com/c/aom/+/200781)
- [Gerrit: Change 200782 - riscv64: Add highbd convolve optimization (MERGED 2025-06-25)](https://aomedia-review.googlesource.com/c/aom/+/200782)
- [Gerrit: Change 206581 - add compound convolve optimization (MERGED 2026-03-03)](https://aomedia-review.googlesource.com/c/aom/+/206581)
- [Gerrit: Change 206601 - add high bit depth compound convolve optimization (MERGED 2026-03-05)](https://aomedia-review.googlesource.com/c/aom/+/206601)
- [Gerrit: Change 208401 - riscv64: handle w==2 and h==2 blocks in highbd convolve RVV (OPEN)](https://aomedia-review.googlesource.com/c/aom/+/208401)
- [Gerrit: Change 210421 - add wiener convolve optimization (MERGED 2026-04-22)](https://aomedia-review.googlesource.com/c/aom/+/210421)
- [Gerrit: Change 211341 - Add RVV optimization for high bit-depth wiener convolve (MERGED 2026-04-30)](https://aomedia-review.googlesource.com/c/aom/+/211341)
- [Gerrit: Change 175122 - riscv-linux-gcc.cmake: update default CROSS value (MERGED 2023-05-10)](https://aomedia-review.googlesource.com/c/aom/+/175122)
- [libaom Jenkins CI](https://build.aomedia.org)
- [Debian sid libaom3 package](https://packages.debian.org/sid/libaom3)
- [Debian sid libaom-dev package](https://packages.debian.org/sid/libaom-dev)
- [Debian buildd status for aom/riscv64](https://buildd.debian.org/status/package.php?p=aom&suite=sid)
- [Ubuntu 24.04 noble libaom3 (ports)](https://packages.ubuntu.com/noble/libaom3)
- [av1/common/riscv/ directory (main branch)](https://aomedia.googlesource.com/aom/+/refs/heads/main/av1/common/riscv)
- [av1/av1.cmake (build integration for RVV)](https://aomedia.googlesource.com/aom/+/refs/heads/main/av1/av1.cmake)
- [aom_ports/riscv.h](https://aomedia.googlesource.com/aom/+/refs/heads/main/aom_ports/riscv.h)
- [aom_ports/riscv_cpudetect.c](https://aomedia.googlesource.com/aom/+/refs/heads/main/aom_ports/riscv_cpudetect.c)
- [cmake/toolchains/riscv-linux-gcc.cmake](https://aomedia.googlesource.com/aom/+/refs/heads/main/cmake/toolchains/riscv-linux-gcc.cmake)
- [cmake/cpu.cmake](https://aomedia.googlesource.com/aom/+/refs/heads/main/cmake/cpu.cmake)
- [RISE Project member list](https://riseproject.dev)
- [Andes Technology](https://www.andestech.com/)