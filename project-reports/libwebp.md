---
title: libwebp
parent: Project Reports
color: yellow
dependencies:
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: optional
  - name: libtiff
    relation: runtime-dependency
    criticality: optional
  - name: giflib
    relation: runtime-dependency
    criticality: optional
  - name: SDL2
    relation: runtime-dependency
    criticality: optional
  - name: OpenGL
    relation: runtime-dependency
    criticality: optional
  - name: freeglut
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libwebp" %}

# libwebp

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libwebp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libwebp is the reference encoder and decoder for the WebP image format, launched by Google in 2010 as part of the WebM initiative. It is written in C and provides a C API plus optional command-line tools (cwebp, dwebp, gif2webp, vwebp, img2webp, anim_diff). The canonical repository is hosted on Google's Chromium Gerrit infrastructure at [chromium.googlesource.com/webm/libwebp](https://chromium.googlesource.com/webm/libwebp) and is mirrored, read-only, to [github.com/webmproject/libwebp](https://github.com/webmproject/libwebp) ("Mirror only. Please do not send pull requests."). Copyright is held by "The WebM Project," Google's umbrella branding for the codec ecosystem. libwebp is released under the same BSD-style license as the wider WebM project, with an additional patent grant in the PATENTS file (see [webmproject.org/license/software](https://www.webmproject.org/license/software/)); there is no separate foundation license and no independent foundation membership. Governance is entirely Google-managed via Gerrit code review; no public MAINTAINERS file exists at the standard path (404 on request).

Active committers visible in recent commit history include James Zern and Vincent Rabaud; both are long publicly associated with Google, though the fetched upstream pages themselves do not state employer affiliation, so this is [NEEDS VERIFICATION] as a primary-source fact even though it is widely known. Historical external contributors with vendor affiliations visible in the AUTHORS file include Istvan Stefan and Yang Zhang (ARM Ltd., NEON optimizations), Djordje Pesut and Jovan Zelincevic (Imagination Technologies, MIPS optimizations), and Tamar Levy (Intel, x86 SIMD). This pattern, silicon vendors contributing architecture-specific DSP optimizations with Google reviewing and merging, defines the practical contribution model for any future architecture work, including a prospective RISC-V port.

The [webmproject.org supporters list](https://www.webmproject.org/about/supporters/) includes hardware companies AMD, ARM, Broadcom, Chips&Media, Hisilicon, Imagination Technologies, Marvell, MIPS, Qualcomm, Rockchip, Texas Instruments, Verisilicon, and ZTE. No RISC-V semiconductor vendor (SiFive, StarFive, Alibaba T-Head) appears on this list, which predates the modern RISC-V era and has not been updated.

libwebp has no formal platform tier policy document (no PLATFORMS.md, SUPPORT.md, or CODEOWNERS file). CONTRIBUTING.md covers only CLA requirements, Gerrit workflow, and code style, with no architecture contribution guidelines. Google is a RISE Premier Member (confirmed via the current [riseproject.dev](https://riseproject.dev/) membership listing, alongside Alibaba, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent as Premier Members), but libwebp itself is not a RISE target project and has no dedicated RISE tracking issue, blog coverage, or funded work. The only concrete RISE-project touchpoints found are three `riseproject-dev/python-wheels` pull requests (openimageio, kivy, torchcodec) that statically bundle libwebp as a transitive dependency of unrelated packages; see Section 14.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2010 | Project launched by Google as part of the WebM initiative | [webmproject.org](https://www.webmproject.org/about/) |
| ~2012-2014 | ARM NEON DSP optimizations contributed by ARM Ltd. (Istvan Stefan, Yang Zhang) | AUTHORS file, src/dsp/ commit history |
| ~2013-2015 | MIPS DSP optimizations contributed by Imagination Technologies | AUTHORS file, src/dsp/ commit history |
| ~2015-2017 | Intel x86 SSE2/SSE4.1/AVX2 optimizations contributed by Tamar Levy (Intel) | AUTHORS file, src/dsp/ commit history |
| 2025-06-30 | v1.6.0 released (latest stable at report date); release notes cite "additional Arm optimizations for lossy and lossless," no RISC-V mention | [libwebp NEWS](https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/NEWS) |
| ongoing | **No RISC-V work of any kind has ever been initiated upstream** | Gerrit API query (zero results, all statuses), GitHub mirror issue/PR search (zero results), repo-wide `riscv` grep on a direct clone (zero matches) |

There is no RISC-V port history. Direct Chromium Gerrit API queries for `project:webm/libwebp` combined with `riscv`, `riscv64`, `rvv`, or `risc-v`, run across `status:open`, `status:merged`, and `status:abandoned`, all returned empty result sets. GitHub issue and pull-request search on the mirror for `riscv` (all states) returns zero matches. No commit in the 2000 most recent Gerrit log entries mentions riscv/rvv/risc-v. No master riscv64 tracking issue exists in any tracker (Gerrit, GitHub, crbug.com/issues.chromium.org, or the webp-discuss Google Group). The architecture has never been addressed upstream in any form.

## 3. Upstream Support Tier

libwebp has no published tier policy. The effective tier is determined entirely by what is present in the source tree and build scripts, since there is no CI of any kind (see Section 7).

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD optimizations in source | SSE2, SSE4.1, AVX2 | NEON | None |
| Cross-compile target in infra/compile.sh | Yes (x86_64 explicit) | Yes (aarch64 explicit) | No |
| Any upstream CI (GitHub Actions, Travis, Cirrus, GitLab CI, Jenkins) | None (no such config exists for any architecture) | None | None |
| Release-blocking test coverage | No formal blocking policy documented | No formal blocking policy documented | No |
| Official prebuilt binaries | No (upstream ships only Git tags, no GitHub Release assets) | No | No |
| Entry in CPUFeature enum (src/dsp/cpu.h) | Yes (SSE2/SSE4.1/AVX2 entries) | Yes (NEON entry) | Absent |

`infra/compile.sh`, the only build automation present in the repository, explicitly enumerates its cross-compilation targets: aarch64, arm (armv7, NEON), mips (8 variants), i686, x86_64, MinGW, and WebAssembly. riscv64 is absent. There is no `.github/workflows/` directory anywhere in the tree (confirmed both via a 404 on the GitHub mirror API and by direct inspection of a shallow clone at commit [b3a9f08a253290b54181605e4cc31216eee1197a](https://github.com/webmproject/libwebp)), no `.travis.yml`, no `.cirrus.yml`, no `.gitlab-ci.yml`, and no `Jenkinsfile`.

The effective upstream tier for riscv64 is: **unsupported / not recognized**.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libwebp's performance-critical code is concentrated in the DSP layer (`src/dsp/`) and the SharpYUV subcomponent (`sharpyuv/`), covering lossy encoder prediction/quantization, lossy decoder reconstruction, lossless encode/decode, upsampling/rescaling, alpha channel processing, YUV-to-RGB conversion, cost-model evaluation, and SSIM computation. Each function family has an architecture-specific SIMD implementation and a scalar C fallback. Runtime dispatch is controlled by the `CPUFeature` enum in `src/dsp/cpu.h` and the `VP8GetCPUInfo` function pointer set in `src/dsp/cpu.c`.

`src/dsp/cpu.c` (SIMD dispatch module) defines feature macros only for: `WEBP_HAVE_SSE2`, `WEBP_HAVE_SSE41`, `WEBP_HAVE_AVX2` (x86/x86-64), `WEBP_HAVE_NEON` (ARM), `WEBP_USE_MIPS32`, `WEBP_USE_MIPS_DSP_R2`, `WEBP_USE_MSA` (MIPS), and `WEBP_USE_VSX` (PowerPC). `cmake/cpu.cmake`'s supported SIMD flag list is exactly `AVX2;SSE41;SSE2;MIPS32;MIPS_DSP_R2;NEON;MSA;VSX`. RISC-V/RVV is absent from both. No `#ifdef __riscv` or `__riscv_vector` guard appears anywhere in the codebase.

**SIMD dispatch matrix, files present in src/dsp/ and sharpyuv/:**

| Component | x86 SSE2/SSE4.1/AVX2 | ARM NEON | MIPS MSA | PowerPC VSX | riscv64 RVV |
|---|---|---|---|---|---|
| Encoder (enc) | Yes | Yes | Yes | Yes | **Missing** |
| Decoder (dec) | Yes | Yes | Yes | Yes | **Missing** |
| Lossless encode | Yes | Yes | Yes | Yes | **Missing** |
| Lossless decode | Yes | Yes | Yes | Yes | **Missing** |
| Upsampling | Yes | Yes | Yes | Yes | **Missing** |
| Rescaler | Yes (SSE2 only) | Yes | Yes | Yes | **Missing** |
| Alpha processing | Yes | Yes | Yes | Yes | **Missing** |
| Filters | Yes (SSE2 only) | Yes | Yes | Yes | **Missing** |
| YUV conversion | Yes | Yes | Yes | Yes | **Missing** |
| Cost model | Yes (SSE2 only) | Yes | Yes | Yes | **Missing** |
| SSIM | Yes (SSE2 only) | Scalar | Scalar | Yes | **Missing** |
| SharpYUV | Yes (SSE2 only) | Yes | Scalar | - | **Missing** |
| CPU feature detection | Full | Full | Full | Full | **Absent from enum** |

Total RISC-V source files in `src/dsp/`: 0 (confirmed via full directory listing, both on the GitHub mirror and via a direct clone at commit b3a9f08a253290b54181605e4cc31216eee1197a). Total RISC-V source files in `sharpyuv/`: 0. A repository-wide `grep -ril "riscv" .` across the entire cloned working tree, source, build files, scripts, and docs, returned zero matches.

On riscv64, `VP8GetCPUInfo` resolves to NULL (the fallback branch for any unrecognized target), and every DSP function uses the generic scalar C implementation, the same code path an unoptimized x86 build without `-msse2` would also use. There is no partial or disabled/guarded riscv64 placeholder; the architecture is simply absent from the dispatch mechanism. There are no other architecture-specific subsystems in libwebp (no JIT, no crypto, no GC); the entire performance exposure is SIMD.

## 5. Build System, Cross-Compilation, and Toolchain

libwebp supports CMake (recommended), Autotools (legacy), and nmake (Windows only). `doc/building.md` covers CMake, Autotools/configure, Makefile variants, Android, and iOS; cross-compilation guidance is given only for MIPS Linux. There is no riscv64 section, no RISC-V toolchain guidance, and no QEMU usage documented anywhere in the repository (no `qemu-riscv64` reference exists in `infra/`, `cmake/`, or any documentation file).

**Illustrative CMake cross-compile for riscv64** (derived from general CMake conventions and the documented MIPS pattern; no riscv64-specific upstream documentation exists):

```
cmake \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DWEBP_ENABLE_SIMD=OFF \
  -DWEBP_BUILD_CWEBP=ON \
  -DWEBP_BUILD_DWEBP=ON \
  -DWEBP_USE_THREAD=ON \
  -DWEBP_BUILD_VWEBP=OFF \
  ..
```

`-DWEBP_ENABLE_SIMD=OFF` is not strictly required because no SIMD target is defined for riscv64 in `cmake/cpu.cmake`; the build will produce a scalar-only binary either way, but the flag is recommended for clarity.

**Illustrative Autotools cross-compile** (derived from the documented MIPS pattern in `doc/building.md`):

```
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --build=$(./config.guess) \
  --enable-everything
make -j$(nproc)
```

**Toolchain version requirements for riscv64:** none documented, because the architecture is not a supported target upstream. The GCC-version workarounds present in `configure.ac` (GCC 4.3 for `-flax-vector-conversions` on x86; GCC 4.9 for `-frename-registers` on AArch64) do not apply to riscv64. A modern GCC or Clang targeting `riscv64-linux-gnu` compiles the scalar C code without issue.

**Known build failures on riscv64:** none identified. Distribution builds succeed cleanly: Ubuntu 26.04 "resolute" ships riscv64 `.deb` binaries for libwebp7, libwebp-dev, libwebpdecoder3, libwebpdemux2, and libwebpmux3 at 1.5.0-0.1build1, and Debian sid and other distros (Ubuntu Jammy, Gentoo, AlmaLinux Kitten) build and ship libwebp for riscv64 as ordinary generic-C packages with no reported build failures.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Lossy encode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Lossy decode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Lossless encode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Lossless decode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Alpha channel processing | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| SharpYUV | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Animated WebP | Full | Full | Full |
| Multi-threaded encode | Full | Full | Full |
| All command-line tools | Full | Full | Full |

**Functional gaps:** none. All encode/decode operations are functionally complete on riscv64. The library does not refuse to operate, does not skip code paths, and does not produce incorrect output on riscv64. No correctness bugs specific to riscv64 are recorded against the upstream repository itself (see Section 11 for a caveat on one tangential, unreliable third-party report).

**Performance gap:** every performance-critical operation runs at scalar-C speed on riscv64. Historical SIMD-speedup figures from other platforms give an order-of-magnitude sense of what is left on the table: ARM NEON work (v0.4.1) documented roughly 25% faster lossy decode/encode at `-m 4`, roughly 10% faster lossless decode, and 5-10% faster lossless encode; x86 SSE2 work (v0.1.3) documented a 40% improvement in overall decoding performance and a 2x speedup in SSIM computation. The expected performance deficit for riscv64 vs. arm64 is therefore in the range of 25-40% for typical encode/decode workloads [NEEDS VERIFICATION, no riscv64 benchmark data exists; this estimate is derived only from the magnitude of NEON/SSE2 speedups documented in the libwebp changelog, not from any riscv64 measurement].

OpenBenchmarking.org's "WebP Image Encode" test (pts/webp) has recorded results for several RISC-V boards, including SiFive HiFive Unmatched, Scaleway EM-RV1 (with libwebp 1.2.4, across Default/Quality 100/Quality 100 Lossless/Quality 100 Highest-Compression presets), BeagleV-Fedora, BeagleV-Debian, and StarFive VisionFive2 (see [openbenchmarking.org/test/pts/webp](https://openbenchmarking.org/test/pts/webp)). The site was behind a Cloudflare bot challenge during this research pass and the actual throughput figures could not be retrieved; their existence is confirmed, but the numbers themselves are: Data not available - the specific MP/s throughput figures on openbenchmarking.org could not be fetched due to a Cloudflare block.

No published benchmark comparing libwebp throughput on riscv64 vs. arm64 or amd64, with exact figures, was found in any accessible source.

**Security hardening gaps:** Data not available - no riscv64-specific security hardening analysis was found in any upstream source or distribution security tracker.

**Floating-point / NaN semantics:** no riscv64 floating-point correctness issues are reported. A GitHub issue search for "riscv64" and "NaN" against the mirror returned zero results. libwebp uses floating-point only in quantization and distortion computation, operations not numerically sensitive enough to be commonly exposed to RISC-V FP edge cases in practice.

## 7. CI/CD Infrastructure

**No CI configuration of any kind exists in the libwebp repository, for any architecture, not just riscv64.** This was independently verified this pass via direct inspection of a shallow clone at commit [b3a9f08a253290b54181605e4cc31216eee1197a](https://github.com/webmproject/libwebp), cross-checked against the mirrored source at [chromium.googlesource.com/webm/libwebp](https://chromium.googlesource.com/webm/libwebp):

- No `.github/workflows/` directory exists (`ls .github/` returns "No such file or directory"; zero GitHub Actions workflow files of any kind).
- No `.travis.yml`, `.cirrus.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, or any `.yml`/`.yaml` file anywhere in the tree.
- The only build/test automation present is the shell scripts in `infra/` (`common.sh`, `compile.sh`, `compile_android.sh`, `compile_js.sh`, `run_static_analysis.sh`), invoked by Chromium's own external CQ/trybot infrastructure rather than by any config stored in this repository. None of their content mentions riscv.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (x86_64 in infra/compile.sh, via Chromium trybots) | Yes (aarch64 in infra/compile.sh, via Chromium trybots) | No |
| Test execution CI | No (infra scripts build only; no test runner) | No | No |
| QEMU-based test CI | No | No | No |
| GitHub Actions | None for any architecture | None for any architecture | None |
| RISE runners | Not used for libwebp itself | Not used for libwebp itself | No |
| Hardware-in-the-loop | No | No | No |

The CI situation is weak for every architecture upstream. For riscv64 specifically, there is no build verification, no test execution, and no automated regression detection of any kind.

## 8. Distribution and Release Status

The upstream project does not publish prebuilt binaries. The [GitHub releases API](https://api.github.com/repos/webmproject/libwebp/releases) returns an empty array; the project uses Git tags only (latest: v1.6.0). No binary assets of any kind are distributed by upstream, for any architecture.

**Distribution package availability for riscv64:**

| Distribution | Package(s) | Version | riscv64 status |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | libwebp7, libwebp-dev, libwebpdecoder3, libwebpdemux2, libwebpmux3 | 1.5.0-0.1build1 | Directly confirmed: [per-architecture download page](https://packages.ubuntu.com/resolute/riscv64/libwebp7/download) resolves to a real checksummed artifact, `libwebp7_1.5.0-0.1build1_riscv64.deb`, 206932 bytes, MD5 `e99522f084ee5792aa9b55a011d5519b` |
| Debian sid | libwebp7, libwebp-dev, libwebpdecoder3, libwebpdemux2, libwebpmux3 | builds/ships for riscv64 as a generic-C package | Confirmed present this pass; exact current build revision not independently re-pulled in this session |
| Ubuntu Jammy, Gentoo, AlmaLinux Kitten | libwebp packages | n/a | Confirmed to build/ship libwebp for riscv64 as ordinary generic-C (non-vectorized) distro builds |
| Arch Linux RISC-V | libwebp, libwebp-utils | n/a | Data not available this pass - the [archriscv.felixc.at](https://archriscv.felixc.at/) mirror has no working search endpoint reachable in this session; status untested, not confirmed absent |
| PyPI (`libwebp` package) | n/a | n/a | Confirmed absent - `pypi.org/pypi/libwebp/json` and `pypi.org/simple/libwebp/` both return HTTP 404 |
| RISE GitLab PyPI wheel proxy | `libwebp` | n/a | Confirmed absent as a standalone package - [gitlab.com RISE wheel project](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libwebp/) 302-redirects to the PyPI 404; libwebp is not among the roughly 90 packages listed on the [RISE wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/) |

To obtain a working riscv64 binary today, a user installs `libwebp-dev` (or equivalent) from their distribution. No additional steps are required. The library also builds cleanly from source with the CMake invocation in Section 5 if a distribution package is unavailable.

## 9. Dependencies

libwebp's core library (`sharpyuv/`, `src/`) has zero mandatory external dependencies beyond libc; it is pure portable C, optionally using pthreads for multi-threaded encode/decode. All dependencies below are used only by the optional example/demo tools (cwebp, dwebp, gif2webp, vwebp, img2webp, anim_diff) and the build tooling, auto-detected by `configure.ac` (`AC_CHECK_HEADER`/`AC_CHECK_LIB`) or CMake's equivalent `find_package` calls.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking |
|---|---|---|---|---|---|
| libpng | PNG read/write for cwebp/dwebp | Passing - portable C; an RVV SIMD filter path exists but needs GCC>=13 or Clang>=14 and is off by default | Partial - no automated riscv64 CI upstream; a December 2025 silent-correctness regression (issue #769 / PR #771, a bad `__riscv_vaaddu_wx_u8m1` intrinsic) shipped undetected and was only caught by OpenCV's downstream hardware testing | Shipping - Debian sid (1.6.58-1, builder rv-manda-02) and Ubuntu 26.04 "resolute" (1.6.57-1, ports.ubuntu.com tier) | No open blockers; the CI gap (no QEMU riscv64 lane in verify-linux.yml) is the top recommended fix |
| libjpeg-turbo | JPEG read/write for cwebp/dwebp | Passing - 19-file RVV 1.0 C-intrinsics SIMD backend in `simd/riscv64/`, no hand-written assembly | 2 of 590 unit tests fail under QEMU riscv64 (floating-point DCT; closed by disabling FLOATTEST8 on non-x86); no upstream riscv64 CI of any kind | Distro-shipped only - Debian sid ships 1:3.1.3-4 on riscv64, which predates the RVV merge (no SIMD in the shipped binary). The maintainer explicitly declined (issue #885, "won't implement") to publish official riscv64 release binaries despite an offered free RISE CI runner | Maintainer refusal to add riscv64 to the release pipeline; distro riscv64 packages currently lack SIMD acceleration |
| libtiff | TIFF read/write for cwebp/dwebp | Data not available: no dedicated riscv64 research pass exists for libtiff in this research round | Data not available | Data not available | Unknown, flagged for follow-up. Per general project structure it is pure C with no SIMD of any architecture, so it is not expected to be a porting blocker, but this was not independently re-verified this pass |
| giflib | GIF read/write for gif2webp, anim_diff, anim_util, img2webp | Passing - architecture-agnostic pure C, no riscv64-specific code ever needed | Passing - Debian buildd shows "Installed"; no riscv64-specific bugs in tracker | Shipping - Debian sid 6.1.3-1 (riscv64), Ubuntu 24.04 Noble giflib-tools 5.2.2-1ubuntu1 (riscv64), Alpine edge 5.2.2-r1 | None identified |
| SDL2 | vwebp-sdl variant; webp_js/webp_wasm (Emscripten) builds | Data not available: not independently researched this pass | Data not available | Data not available | Unverified |
| OpenGL | vwebp viewer window/rendering (via Mesa) | Data not available: not independently researched this pass | Data not available | Mesa is broadly available on riscv64 in Debian/Ubuntu per general distro packaging, but this was not directly graph-verified this pass [NEEDS VERIFICATION] | Unverified |
| freeglut | vwebp window/input (GLUT) | Data not available: not independently researched this pass | Data not available | Data not available | Unverified |
| CMake | Primary recommended build system for libwebp itself | Data not available: CMake's own riscv64 packaging status was not directly confirmed by primary-source search in this pass [NEEDS VERIFICATION], though CMake is broadly distributed as a native riscv64 package across major Linux distributions | Data not available | Data not available | Critical to the build, but CMake's own riscv64 status is a build-time host-tool question, not part of libwebp's runtime risk |
| autoconf | Legacy Autotools build path (`configure.ac`) | Data not available: not independently researched this pass | Data not available | Data not available | Optional path; autoconf is a portable shell-script generator with no architecture-specific dependency in typical use |
| zlib (indirect, via libpng) | DEFLATE backend required by libpng | Passing - pure portable C, no functional gaps | Passing on the one CI lane that exists (OpenBSD/riscv64 via vmactions, merged PR #1139, January 2026); no Linux riscv64 lane exists in upstream CI despite ARM/AARCH64/PPC/PPC64LE/S390X being present in the same matrix | Shipping - Ubuntu 24.04 noble zlib1g lists riscv64; Debian sid "Installed" (rv-manda-03); Arch Linux RISC-V and Alpine edge both ship it | None functional; the only gap is a missing riscv64 CRC-32 hardware-accelerated path (falls back to scalar; a performance gap, not correctness) |
| pthreads / glibc (indirect, core threading requirement) | Core multi-threaded encode/decode | Passing - the riscv64 glibc port is fully upstream and receives first-class release treatment | Weaker than amd64/arm64 - both upstream Buildbot riscv64 CI builders were reported offline as of 2026 with recent runs failing; this is a CI-infrastructure gap, not a correctness gap | Shipping - riscv64 is a release architecture across Debian/Ubuntu | CI builder outage (infrastructure, not code) |

**Deep-dive notes on SIMD-critical dependencies:** libjpeg-turbo carries the most active risk in the chain: it has a merged riscv64 RVV SIMD backend but its maintainer has explicitly declined to ship official riscv64 release binaries, and the version currently in Debian sid predates that RVV work entirely, so distro-packaged libjpeg-turbo on riscv64 today runs unaccelerated. libpng has RVV SIMD but no upstream riscv64 CI, and has already shipped one silent-correctness regression that was only caught downstream. libtiff, SDL2, OpenGL/Mesa, freeglut, CMake, and autoconf were not deep-researched in this pass; none of them is expected a priori to carry SIMD/correctness risk comparable to libpng or libjpeg-turbo, but this has not been independently confirmed and is flagged for follow-up.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | - | - | - | No riscv64-related issue exists in the upstream libwebp tracker |

A GitHub issue search on [webmproject/libwebp](https://github.com/webmproject/libwebp/issues) for "riscv" and "risc-v" (all states) returns zero results, independently re-confirmed via the GitHub search API in this pass. No riscv64-specific bugs appear in the Debian buildd logs (status: Installed, no failures), on the Arch Linux RISC-V failure tracker, or in Gentoo Bugzilla. There are no open correctness bugs, no open performance bug reports, and no open CI-addition requests for riscv64 in any accessible tracker.

**One tangential item, flagged as unreliable, not a libwebp-repo issue:** [KofLang/Kof4j#700](https://github.com/KofLang/Kof4j/issues/700), "[Native/riscv64] VP8L lossless decode de WebP > 16384 px aborta array index out of bounds." Kof4j is a third-party Java/JNI wrapper around libwebp, not the webmproject/libwebp repository itself. Two separate fetches of this issue in the course of research returned mutually contradictory details (one described a >16384px image with a 262,144-element array guard; another described a 160x120px image and a 19,200-pixel fixture), which points to the fetch/summarization pipeline producing unreliable content rather than a stable, verifiable issue. It carries no upstream libwebp issue number, commit, or Gerrit CL, and should not be treated as an upstream-confirmed libwebp defect; at most it is a downstream report that would need independent reproduction outside the wrapper before it could be escalated to libwebp maintainers.

## 12. Objections and Upstream Blockers

No stated objections exist, because the question has never been raised upstream. There are no issues, no mailing-list threads (webp-discuss Google Group checked, no threads found), and no Gerrit discussion about riscv64 or RVV support.

**Organizational model:** CONTRIBUTING.md requires a signed CLA and submission via Gerrit; Google employees review and merge. The historical precedent for architecture-specific DSP optimizations is that silicon vendors contributed the patches (ARM Ltd. for NEON, Imagination Technologies for MIPS DSP, Intel for x86 SIMD) and Google merged them. There is no stated objection to a new architecture port; there is simply no one who has submitted one.

**Technical path to add riscv64 SIMD (RVV) support:**

1. Add a `kRVV` entry to the `CPUFeature` enum in `src/dsp/cpu.h`.
2. Add `__riscv` detection to `src/dsp/cpu.c`.
3. Add `RVV` to the SIMD target list in `cmake/cpu.cmake` with the appropriate `-march` flag.
4. Write `*_rvv.c` source files for each DSP function family (encoder, decoder, lossless, upsampling, SharpYUV, etc.), roughly a dozen function families based on the existing per-architecture file counts.
5. Add a riscv64 cross-compile target to `infra/compile.sh`.

No technical blocker prevents this work; the scalar C fallback is complete and correct, and RVV files would be purely additive.

**Acceptance probability:** high, given the vendor-contribution precedent for NEON, MIPS DSP, and x86 SIMD. The only condition is that submitted code passes Gerrit review and correctness testing; no organizational resistance to a riscv64 port has ever been expressed because none has ever been proposed.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification:** libwebp has zero upstream CI of any kind, no `.github/workflows` directory, no `.gitlab-ci.yml`/`.cirrus.yml`/`Jenkinsfile`, and `infra/compile.sh` has no riscv64 target, so it cannot reach blue or green, and there is no evidence of confirmed breakage, so it is not red. Applying the distribution floor: [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/resolute/riscv64/libwebp7/download) and Debian sid build and ship riscv64 binaries (libwebp7 1.5.0-0.1build1, directly verified via the per-architecture download page with file size and MD5) built from unmodified upstream source as a generic portable-C build, since `src/dsp` has no riscv/RVV code path at all and thus needs no riscv-specific patches. A clean, unpatched distro build with no upstream CI is the yellow (clean-distro-build) case.

libwebp's value proposition is the WebP format itself (compression ratio, alpha, animation support), not raw speed relative to a simpler alternative, so it is not classified as an optimization-purpose project and no optimization-level modifier applies.

**Pending work that could change the grade:** none identified. No open PR, CL, or RISE-funded effort targets libwebp's riscv64 build, CI, or SIMD coverage. The RISE project's only contact with libwebp is via three `python-wheels` PRs (openimageio, kivy, torchcodec) that bundle it as a static transitive dependency of other packages, not work on libwebp itself (see Section 14).

## 14. Investment Analysis

RISE has no existing or funded work on libwebp itself. The only RISE-project contact with libwebp found in this research is incidental: it appears as a statically-linked transitive dependency inside three `riseproject-dev/python-wheels` pull requests for unrelated packages (`#2540` openimageio, `#2548` kivy, `#2105` torchcodec), built and tested using RISE's general-purpose riscv64 CI infrastructure ([RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), announced 2026-03-24). None of this constitutes funded work on libwebp's own riscv64 support, CI, or SIMD coverage, so nothing below is already covered.

### 14.1 Functional Enablement

libwebp is fully functional on riscv64 today via scalar C fallback. No functional enablement work is required; the library builds, installs, and operates correctly on riscv64 without any code changes.

### 14.2 Performance Optimization

The entire DSP layer (roughly a dozen function families, with 78+ architecture-specific source files existing for other platforms) has no RISC-V equivalent. Writing RVV intrinsic implementations for the full DSP surface is the primary engineering task. Priority order, based on encode/decode hot paths:

1. YUV conversion and upsampling (decoder hot path)
2. Lossy encoder prediction and transform (encoder hot path)
3. Lossless encode/decode (Huffman and color transform)
4. SharpYUV
5. Alpha processing, filters, rescaler, cost model, SSIM

Each function family requires writing the RVV intrinsic file, adding it to CMakeLists.txt, adding the dispatch hook, and running correctness and performance tests.

### 14.3 CI/CD Infrastructure

Adding riscv64 to `infra/compile.sh` is a small change (one additional case block). Upstream has no GitHub Actions CI at all for any architecture; contributing a `.github/workflows/` directory to add a QEMU-based riscv64 test job would be a larger organizational change for this project, since no such directory currently exists for any architecture. The minimum viable CI addition is the cross-compile target in `infra/compile.sh`.

### 14.4 Ecosystem Enablement

libwebp has no dependent package ecosystem of its own on riscv64: there is no `libwebp` PyPI package (confirmed 404), no npm package, and no Maven artifact that requires separate riscv64 enablement. Its only appearances in a package-management context are as a statically bundled transitive dependency inside three unrelated RISE python-wheels builds (openimageio, kivy, torchcodec), which are already built and tested on riscv64 via RISE's existing wheel-building infrastructure. No dedicated ecosystem-enablement investment is warranted for libwebp itself.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required - scalar C is complete and correct | 0 | - | N/A |
| Performance | RVV intrinsics for YUV conversion and upsampling (decoder hot path) | 3-4 | RISC-V vendor engineer | High |
| Performance | RVV intrinsics for lossy encoder prediction and quantization | 4-5 | RISC-V vendor engineer | High |
| Performance | RVV intrinsics for lossless encode/decode | 3-4 | RISC-V vendor engineer | Medium |
| Performance | RVV intrinsics for SharpYUV | 1-2 | RISC-V vendor engineer | Medium |
| Performance | RVV intrinsics for alpha, filters, rescaler, cost model, SSIM | 3-4 | RISC-V vendor engineer | Low |
| CI/CD | Add riscv64 cross-compile target to infra/compile.sh | 0.5 | Any contributor | High |
| CI/CD | Add a repo-hosted CI system with a QEMU-based riscv64 test job (none exists today for any architecture) | 1-2 | Any contributor | Medium |
| Dependencies | Close the libjpeg-turbo riscv64 release-binary gap (maintainer has declined; would require either upstream policy change or a distro/RISE-provided build) | n/a (organizational, not engineering effort on libwebp's side) | Downstream/distro or libjpeg-turbo maintainers | Medium |

Total estimated effort for libwebp itself: roughly 15-21 person-weeks for full RVV optimization coverage plus CI. The decoder hot path (YUV conversion plus upsampling) alone is 3-4 person-weeks and would recover the bulk of the practical performance gap for the most common use case (image decode).

## 15. References

- [webmproject/libwebp GitHub mirror](https://github.com/webmproject/libwebp)
- [libwebp upstream Chromium Gerrit](https://chromium.googlesource.com/webm/libwebp)
- [libwebp NEWS changelog](https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/NEWS)
- [WebM Project license](https://www.webmproject.org/license/software/)
- [WebM Project supporters](https://www.webmproject.org/about/supporters/)
- [libwebp src/dsp/ directory (GitHub)](https://github.com/webmproject/libwebp/tree/main/src/dsp)
- [libwebp src/dsp/cpu.h (GitHub)](https://github.com/webmproject/libwebp/blob/main/src/dsp/cpu.h)
- [libwebp cmake/cpu.cmake (GitHub)](https://github.com/webmproject/libwebp/blob/main/cmake/cpu.cmake)
- [libwebp infra/compile.sh (GitHub)](https://github.com/webmproject/libwebp/blob/main/infra/compile.sh)
- [libwebp doc/building.md (GitHub)](https://github.com/webmproject/libwebp/blob/main/doc/building.md)
- [libwebp GitHub releases API](https://api.github.com/repos/webmproject/libwebp/releases)
- [Ubuntu 26.04 "resolute" libwebp7 riscv64 download page](https://packages.ubuntu.com/resolute/riscv64/libwebp7/download)
- [Ubuntu 26.04 "resolute" libwebp package search](https://packages.ubuntu.com/search?keywords=libwebp&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 (Noble) libwebp7 riscv64 package](https://packages.ubuntu.com/noble/riscv64/libwebp7)
- [Debian buildd libwebp status](https://buildd.debian.org/status/package.php?p=libwebp&suite=sid)
- [Arch Linux RISC-V mirror (felixc.at)](https://archriscv.felixc.at/)
- [PyPI package search for libwebp (404)](https://pypi.org/pypi/libwebp/json)
- [PyPI webp package (third-party binding)](https://pypi.org/project/webp/)
- [RISE Project](https://riseproject.dev/)
- [RISE python wheel_builder supported-packages page](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev/python-wheels PR #2540 (openimageio, bundles libwebp)](https://github.com/riseproject-dev/python-wheels/pull/2540)
- [riseproject-dev/python-wheels PR #2548 (kivy, bundles libwebp)](https://github.com/riseproject-dev/python-wheels/pull/2548)
- [riseproject-dev/python-wheels PR #2105 (torchcodec, bundles libwebp)](https://github.com/riseproject-dev/python-wheels/pull/2105)
- [OpenBenchmarking.org WebP Image Encode test (pts/webp)](https://openbenchmarking.org/test/pts/webp)
- [KofLang/Kof4j issue #700 (tangential, unreliable, not a libwebp-repo issue)](https://github.com/KofLang/Kof4j/issues/700)
- [libpng RISC-V status report](./multimedia/libpng.md)
- [libjpeg-turbo RISC-V status report](./multimedia/libjpeg-turbo.md)
- [giflib RISC-V status report](./multimedia/giflib.md)
- [zlib RISC-V status report](./multimedia/zlib.md)