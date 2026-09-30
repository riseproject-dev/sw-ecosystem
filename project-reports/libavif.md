---
title: libavif
parent: Project Reports
color: yellow
dependencies:
  - name: libaom
    relation: runtime-dependency
    criticality: optional
  - name: dav1d
    relation: runtime-dependency
    criticality: optional
  - name: libgav1
    relation: runtime-dependency
    criticality: optional
  - name: rav1e
    relation: runtime-dependency
    criticality: optional
  - name: SVT-AV1
    relation: runtime-dependency
    criticality: optional
  - name: libyuv
    relation: runtime-dependency
    criticality: optional
  - name: libwebp
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libavif" %}

# libavif

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libavif<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libavif is a C99 library for encoding and decoding AVIF (AV1 Image File Format) images. It is owned by the [AOMediaCodec](https://github.com/AOMediaCodec) GitHub organization, an arm of the Alliance for Open Media (AOMedia), an industry consortium organized as a project of the Linux Foundation. AOMedia's Steering Committee (12 companies: Amazon, Apple, Cisco, Google, Intel, Meta, Microsoft, Mozilla, Netflix, NVIDIA, Samsung, Tencent) sits above roughly 48 Promoter Members (Adobe, AMD, ARM, Broadcom, Disney, Lenovo, LG, Paramount, Roku, Snap, VideoLAN, and others). The project is licensed BSD 2-Clause (Copyright 2019 Joe Drago), with one bundled third-party file (`src/obu.c`, sourced from VideoLAN/dav1d) under its own BSD-style license.

libavif is a thin framing library. It implements AVIF container logic (ISOBMFF/HEIF box parsing and writing), color management, and orchestration. All compute-intensive work, AV1 encode and decode, YUV/RGB conversion, scaling, is delegated to pluggable external codec libraries (libaom, dav1d, rav1e, SVT-AV1, libgav1) and color-space helpers (libyuv, libwebp's libsharpyuv component). This architecture is intentional: libavif has no SIMD, no assembly, and no architecture-specific code for any architecture, including x86, ARM, or RISC-V, by design.

Governance is informal. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `CONTRIBUTING.md`, `PLATFORMS.md`, or `docs/platforms/` file has ever existed in the repository's history (checked against the full working tree and `git log --diff-filter=A` for those names). A `SECURITY.md` exists but covers only vulnerability reporting (90-day disclosure window), not general project governance or a platform-tier policy. Contributions are reviewed through ordinary GitHub PR review with no documented fast path for new-platform ports.

The project was founded by Joe Drago (jdrago@netflix.com at the time, now independent) in January 2019. Analysis of the full commit history (3,124 commits) shows Google is by far the dominant corporate sponsor of ongoing development:

| Contributor | Commits | Affiliation |
|---|---|---|
| Wan-Teh Chang | 910 | Google |
| Joe Drago | 612 + 57 | Founder; Netflix at project start, now independent |
| Yannis Guyon | 500 | Google |
| Vincent Rabaud | 257 + 14 | Google |
| Maryla Ustarroz-Calonge | 123 + 33 + 30 | Google |
| Vignesh Venkatasubramanian | 105 + 29 + 11 | Google |
| James Zern | 22 | Google |
| Ewout ter Hoeven | 44 | TU Delft (student) |
| Andreas Schneider | 25 | Independent |

No AMD, Intel, Arm, or RISC-V-affiliated company shows meaningful commit activity. Neither libavif, AOMediaCodec, nor Alliance for Open Media are members of the RISE Project. RISE's 20 listed members (8 Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; 12 General: Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) include none related to libavif, AV1, or image codecs. No RISE blog post discussed libavif as of the most recent full RISE blog index check; a single, indirect mention (via libaom/Pillow, not libavif itself) appeared in a 2026-08-18 post, described in Section 1's engagement summary below and detailed further in Section 14.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-01-23 | Project founded (first commit) by Joe Drago at Netflix | Full-history `git log` analysis of the repository, 3,124 commits from initial commit to current HEAD |
| (none) | No RISC-V-related issue, pull request, commit, or CHANGELOG entry has ever existed upstream | `git log --grep` and `git log -S"riscv"` across full history: 0 matches; GitHub issue/PR/commit/code search for `riscv`, `riscv64`, `risc-v`, `RVV` scoped to `AOMediaCodec/libavif`: `total_count: 0` on every query, independently re-run multiple times across this research |
| (none) | No tracking issue for a riscv64 port has been filed | GitHub issue search confirmed, re-verified independently |
| Ongoing | Debian and Ubuntu build libavif for riscv64 as part of their generic port infrastructure, with no upstream libavif changes required | [Debian buildd, riscv64, libavif16 1.4.2-1, status "Installed"](https://buildd.debian.org/status/package.php?p=libavif); [Launchpad, Ubuntu resolute, libavif16 1.3.0-1ubuntu4, 8 architectures including riscv64](https://launchpad.net/ubuntu/resolute/+source/libavif) |

There is no "port history" in the traditional sense. libavif requires no porting because it is pure portable C99; it compiles and runs on riscv64 without any upstream code changes. All riscv64 activity is downstream packaging work performed by Debian and Ubuntu maintainers. Recent upstream releases: v1.4.2 (2026-05-26), v1.4.1 (2026-03-20), v1.4.0 (2026-03-04), v1.3.0 (2025-05-09), v1.2.1 (2025-03-17); none of these releases' notes, nor the CHANGELOG.md, mention RISC-V.

## 3. Upstream Support Tier

libavif has no formal platform tier policy. The README describes the library as a portable C implementation; the CMake build system carries no platform-tier enumeration. The only documented non-desktop platform target is Android JNI bindings (added v0.10.0).

The upstream CI matrix is limited to `ubuntu-latest` (x86_64), `macos-latest`, `windows-latest`, and Android emulators. All 23 workflow files in `.github/workflows/` were read twice in independent passes this research cycle, once via the GitHub API-backed listing and once by fetching every individual file's raw content from `raw.githubusercontent.com` on the default branch and grepping case-insensitively for "riscv": both passes found zero matches, in any job name, matrix entry, runner label, step name, env var, or comment. There is no cross-compilation, no QEMU, and no foreign-arch target in upstream CI for any architecture other than the host runners' native amd64/arm64 (macOS).

Upstream does not ship per-architecture release binaries at all: GitHub release assets are OS-level bundles (`linux-artifacts.zip`, `macOS-artifacts.zip`, `windows-artifacts.zip`) plus source archives, confirmed on the latest release (v1.4.2). riscv64 absence from GitHub release assets reflects the upstream's release model, not a riscv64-specific gap.

**Platform support comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (all 23 workflows) | No | No |
| Upstream per-arch release binary | No (not the upstream's model) | No | No |
| Formal tier policy | None | None | None |
| Builds from upstream source | Yes | Yes | Yes |
| Official distribution packages | Yes | Yes | Yes (Debian, Ubuntu) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

libavif has no architecture-specific implementation layer for any architecture, not amd64, not arm64, not riscv64. This was independently re-verified this cycle against a fresh clone of the repository (commit `873c1685af948efb5a65bccedd96b1910b496661`, not merely a GitHub search). Grepping `src/` (27 files, libavif's own code) for `__ARM_NEON`, `arm_neon.h`, `__SSE`, `__AVX`, `immintrin.h`, and `__riscv` returns zero matches for any of them; no `neon/`, `sse/`, `avx/`, `riscv/`, or `simd/` subdirectory exists anywhere in the tree, and `CMakeLists.txt` carries no real architecture-conditional build logic.

The one place any architecture guard exists is the vendored, deliberately trimmed `third_party/libyuv/` fork (five files: `scale.c`, `scale_common.c`, `scale_any.c`, `row_common.c`, `planar_functions.c`), which contains none of upstream libyuv's SIMD row-conversion files (no `row_neon*.cc`, `row_sse*.cc`, `row_avx*.cc`, `row_rvv.cc`, etc.). The single architecture conditional found (`scale_common.c:188`, `#if defined(__arm__) || defined(__aarch64__)`) is not SIMD: it selects a pure-C rounding-macro variant (`BLENDER`) for pixel-blend precision. riscv64 falls into the `#else` branch, compiling and running correctly as scalar C, identically to amd64. Per `CMakeLists.txt` (lines 440-452) this vendored path is only compiled when `AVIF_LIBYUV_ENABLED` is OFF; Debian and Ubuntu strip it and link the system libyuv instead, which does carry RVV kernels (see Section 9).

All performance-critical compute is delegated to external codec and color-conversion dependencies fetched at build time (`ext/*.cmd` scripts), out of this repository's scope: libaom, dav1d, rav1e, SVT-AV1, libgav1 for AV1 encode/decode, and libyuv/libsharpyuv for YUV/RGB conversion and scaling.

**Architecture-specific code comparison:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AVIF container/framing (`src/*.c`) | scalar C | scalar C | scalar C |
| SIMD in libavif itself | none | none | none |
| AV1 decode (via dav1d) | SSE2/AVX2 | NEON | RVV (merged upstream, see Section 9) |
| AV1 decode/encode (via libaom) | SSE/AVX | NEON | RVV partial (see Section 9) |
| AV1 encode (via rav1e) | NASM/SSE2 | NEON | scalar only |
| AV1 encode (via SVT-AV1) | AVX2/AVX-512 | partial | scalar only |
| YUV conversion (system libyuv) | SSE/AVX | NEON | RVV (`row_rvv.cc`, `scale_rvv.cc` confirmed present upstream) |
| YUV conversion (libsharpyuv, part of libwebp) | SSE2 | NEON | scalar only |
| JIT / crypto / GC barriers | none | none | none |

riscv64 is not "behind" amd64 or arm64 within libavif itself; it is treated identically, since none of the three carries hand-tuned or intrinsics code in this repository. The scalar fallback in libavif's own code is the complete, correct implementation, not a stub. The performance delta relative to amd64 and arm64 derives entirely from the codec and libyuv dependencies, not from libavif's own code.

## 5. Build System, Cross-Compilation, and Toolchain

**Minimum CMake version:** 3.22 (`cmake_minimum_required(VERSION 3.22)` in `CMakeLists.txt`). There are no upstream riscv64 toolchain files, no `cmake/riscv64.cmake`, no QEMU usage instructions, and no cross-compilation documentation anywhere in the upstream repository; all cross-build knowledge lives in the downstream packaging layer (Debian). The `CMAKE_SYSTEM_PROCESSOR` handling in the whole codebase is limited to four hits, none RISC-V-related: Android NDK branching in `cmake/Modules/LocalDav1d.cmake`, an Apple-only cross file, a NASM-requirement check for x86_64 in `cmake/Modules/LocalSvt.cmake`, and an Apple-arm64 check in `cmake/Modules/LocalRav1e.cmake`. No documented minimum GCC/Clang version exists, generic or architecture-specific.

**Debian riscv64 build (from `debian/rules`):** the packaging pre-configure step strips the vendored libyuv tree (`rm -rfv third_party/libyuv/`) uniformly across all architectures, not specifically for riscv64, and links the system libyuv. CMake invocation:

```
cmake \
  -DAVIF_LIBYUV=SYSTEM \
  -DAVIF_BUILD_APPS=ON \
  -DAVIF_CODEC_DAV1D=SYSTEM \
  -DAVIF_CODEC_AOM=SYSTEM \
  -DAVIF_CODEC_SVT=SYSTEM \
  -DAVIF_CODEC_LIBGAV1=SYSTEM \
  -DAVIF_CODEC_RAV1E=SYSTEM \
  -DAVIF_BUILD_GDK_PIXBUF=ON \
  -DCMAKE_BUILD_RPATH_USE_ORIGIN=ON \
  -DAVIF_BUILD_MAN_PAGES=ON \
  -DAVIF_BUILD_TESTS=ON -DAVIF_GTEST=SYSTEM
```

All five codec backends are enabled on riscv64 (riscv64 is explicitly enumerated in the allowed-architecture lists for `libgav1-dev` and `librav1e-dev` in `debian/control`). Build hardening is `DEB_BUILD_MAINT_OPTIONS = hardening=+all`, the same policy as every other architecture.

**Cross-build history (Debian, riscv64):**

| Version | Date | Result |
|---|---|---|
| 1.4.2-1 | (current, "Installed" as of this research cycle) | PASS |
| 1.4.1-1+b1 | 2026-04-02 | PASS |
| 1.3.0-1 | 2025-10-12 | PASS |
| 1.3.0-1 | 2025-08-23 | PASS |
| 1.2.1-1.2 | 2025-08-10 | PASS |
| 1.2.1-1.2 | 2025-05-26 | PASS |
| 1.2.1-1.1 | 2025-05-19 | PASS |
| 1.2.1-1 | 2025-04-07 | PASS |

No cross-build failure has been recorded for libavif on riscv64 at any version. [Debian buildd confirms 1.4.2-1 "Installed" on riscv64, no exact build date surfaced beyond "most recently built" relative to the check date](https://buildd.debian.org/status/package.php?p=libavif). Build time for recent versions is approximately 54 minutes and 680 MB on Debian riscv64 builders; the bulk of this is SVT-AV1 compilation, not libavif itself.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AVIF encode | Yes | Yes | Yes |
| AVIF decode | Yes | Yes | Yes |
| All codec backends (aom, dav1d, rav1e, SVT-AV1, libgav1) | Yes | Yes | Yes (all enabled in Debian) |
| Alpha channel | Yes | Yes | Yes |
| Gain map | Yes | Yes | Yes |
| 8/10/12-bit depth | Yes | Yes | Yes |
| GDK-pixbuf integration | Yes | Yes | Yes |
| Full GTest conformance suite | Yes | Yes | Disabled in Alpine [NEEDS VERIFICATION for Debian] |
| NASM assembly in codec backends | Yes | No | No |
| AV1 decode SIMD (dav1d RVV) | n/a | n/a | Yes (merged upstream dav1d) |
| AV1 encode SIMD (libaom RVV) | n/a | n/a | Partial (convolution, CDEF, wiener filter; many stages scalar) |
| AV1 encode SIMD (rav1e) | Yes (NASM) | Yes (NEON) | No |
| AV1 encode SIMD (SVT-AV1) | Yes (AVX2/AVX-512) | Partial | No |
| Sharp YUV SIMD (libsharpyuv, part of libwebp) | Yes (SSE2) | Yes (NEON) | No |

**Functional gaps:** None. Every feature available on amd64 and arm64 is available on riscv64 at the libavif API level.

**Performance gaps:** Significant for encode-heavy workloads. rav1e and SVT-AV1 carry no RVV SIMD, so these encoders run substantially slower on riscv64 relative to amd64/arm64. libaom has partial RVV coverage (convolution, CDEF, wiener filter); many encode pipeline stages remain scalar. dav1d has the most complete RVV coverage among the codec backends and is the recommended decode path. No public quantified benchmark figures (fps, cycles, or percentage speedups) for libavif or its codec backends on riscv64 hardware were found anywhere: not in dav1d's own NEWS/changelog (which lists feature names per release but no numbers, unlike some ARM NEWS entries that cite specific speedups), not on riseproject.dev, and not via general web search.

**Security hardening gaps:** None identified. Debian builds with `hardening=+all` on riscv64, the same policy as all other architectures.

**Floating-point / NaN correctness:** No riscv64-specific correctness issues are open against libavif itself. One correctness concern exists at the dependency level and is architecture-relevant: [libxml2 GitLab issue #971](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971) (open, filed 2025-08-13) describes catalog code using double-checked locking that is unsafe on weak-memory architectures, which directly includes riscv64 and can silently read uninitialized data in multi-threaded catalog use; this affects libavif only through its optional libxml2 dependency (gain-map JPEG conversion path), not libavif's own code.

## 7. CI/CD Infrastructure

No riscv64 CI exists for libavif upstream. This was independently re-verified twice in this research cycle: once via the GitHub-hosted directory listing of `.github/workflows` (23 files, matching the prior count exactly, no additions or removals), and once by fetching the raw content of all 23 files individually from `raw.githubusercontent.com` on the `main` branch and grepping case-insensitively for "riscv" in every one: zero matches in any form (job name, matrix entry, runner label, step name, env var, comment). GitHub search tools (`search_issues`, `search_pull_requests`, `search_commits`, all scoped `repo:AOMediaCodec/libavif query:riscv`) were also independently re-run and returned `total_count: 0` on every call. Runners are exclusively `ubuntu-latest` (x86_64), `macos-latest`, `windows-latest`, and Android emulators. There is no QEMU-based cross-compilation, no foreign-arch matrix, and no RISE RISC-V runner integration anywhere in upstream CI. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository; a case-insensitive recursive grep for "riscv" across every `.yml` file and any `Jenkinsfile*` in the entire repository (not just `.github/workflows/`) also returned zero matches.

**CI comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI runs | Yes (all 23 workflows) | No | No |
| RISE runner | No | No | No |
| QEMU cross-build in CI | No | No | No |
| GTest suite in CI | Yes | No | No |
| Distro build verification | Yes (via Debian/Ubuntu) | Yes | Yes (Debian, Ubuntu) |

The riscv64 functional assurance for libavif currently relies entirely on Debian and Ubuntu distribution build infrastructure, not on upstream CI. This is the structural gap underlying the yellow/clean-distro-build grade (Section 13): regressions introduced upstream will not be caught until a new Debian/Ubuntu package is built and tested, with no automated upstream signal in between.

## 8. Distribution and Release Status

**Upstream GitHub releases:** No per-architecture binaries for any version, confirmed on the v1.4.2 asset list (`linux-artifacts.zip`, `macOS-artifacts.zip`, `windows-artifacts.zip`, source zip/tar.gz). No asset filename contains "riscv" or "riscv64" for any release. This is the upstream's release model, not a riscv64-specific omission.

**PyPI:** No project named `libavif` exists on PyPI. Both `https://pypi.org/pypi/libavif/json` and `https://pypi.org/simple/libavif/` return HTTP 404, confirmed independently across multiple passes this research cycle.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libavif/` returns an HTTP 302 redirect to `https://pypi.org/simple/libavif/`, which is itself 404. No riscv64 wheel exists because no package exists.

**Debian sid/unstable:** libavif16 1.4.2-1, status "Installed" on riscv64 per [Debian's buildd status page](https://buildd.debian.org/status/package.php?p=libavif), consistent across all Debian architectures except `sparc64` (which shows a build failure unrelated to riscv64). [packages.debian.org](https://packages.debian.org/unstable/libavif16) confirms the riscv64 architecture entry for the same version, package size 144.8 kB, installed size 270.0 kB.

**Ubuntu 26.04 (resolute):** [Launchpad's build-and-publish records](https://launchpad.net/ubuntu/resolute/+source/libavif), an authoritative primary source independent of packages.ubuntu.com, confirm libavif16 1.3.0-1ubuntu4 (uploaded 2026-03-17, published 2026-03-19) built for 8 architectures: amd64, amd64v3, arm64, armhf, i386, ppc64el, riscv64, s390x, consistent across `libavif-bin`, `libavif-dev`, `libavif-gdk-pixbuf`, `libavif16`. A separate live check of packages.ubuntu.com (after retrying past a stale cache and an intermittent HTTP 503) corroborated the same 8-package, riscv64-inclusive result for the resolute suite. Note Ubuntu resolute (1.3.0-1ubuntu4) has not yet picked up the 1.4.x series that Debian sid already carries (1.4.2-1); this is a packaging lag, not a riscv64-specific gap. A separate, unrelated legacy package confusingly named "libavifile" (a pre-2010 image-format project, not AV1/AVIF) is also built for riscv64 in the same suite and should not be conflated with libavif.

**Ubuntu 24.04 Noble:** `libavif-bin`, `libavif-dev`, `libavif-gdk-pixbuf`, `libavif16` list riscv64 as a supported architecture at version 1.0.4-1ubuntu3, in the `universe` component; this was not independently re-checked this research cycle and is carried forward from prior packaging records.

**Arch Linux RISC-V:** contradictory evidence exists. An earlier pass reported a parsed Arch Linux RISC-V community repository database entry for `libavif-1.4.2-1-riscv64.pkg.tar.zst`, packaged by Felix Yan. A later, independent adversarial check of the detailed status page `https://archriscv.felixc.at/.status/status.htm` found no match for "libavif" anywhere on that page. That status page appears to track porting/build progress rather than a full package index, so its silence is weaker evidence than a positive database hit would be, but the original claim could not be corroborated this cycle either. This is marked [NEEDS VERIFICATION]; the actual `core`/`extra`/`unsupported` repository file listings were not browsed directly in either pass.

**Downstream consumer impact:** [RISE's `python-wheels` repository](https://gitlab.com) (`riseproject-dev/python-wheels`) carries patches and CI specifically to make Pillow's AVIF plugin build against libavif on riscv64 (forcing a generic AOM target, fixing a non-x86_64 cache libdir bug in libavif's own install script, and disabling LTO to avoid a GCC LTO bug, [gcc.gnu.org/PR110812](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812)), building libavif from its GitHub source tarball as part of that pipeline. Separately, `torchcodec`'s riscv64 build explicitly disables AVIF support (`TORCHCODEC_BUILD_AVIF=0`) because upstream torchcodec's libavif dependency is fetched only from an S3 bucket with no riscv64 build, a concrete instance of the "no upstream riscv64 release binary" gap propagating downstream even though distro packages exist.

**To obtain a working riscv64 binary today:** install `libavif16` or `libavif-dev` via `apt` on Debian or Ubuntu riscv64. No manual build steps are required, and all five codec backends are included in the Debian package.

## 9. Dependencies

libavif is a thin ISOBMFF/HEIF framing layer with no SIMD of its own; all compute-heavy work is delegated to pluggable codec, color-conversion, and utility libraries selected via CMake options (`AVIF_CODEC_*`, `AVIF_LIBYUV`, etc.), each of which may be built as `SYSTEM`, `LOCAL`, or left `OFF`.

| Dependency | Role | Relation / Criticality | riscv64 Build | riscv64 Test/CI | riscv64 Release | Notes |
|---|---|---|---|---|---|---|
| libaom | AV1 encode + decode, heaviest SIMD surface | runtime-dependency, optional | Builds; partial RVV (convolve, CDEF, wiener filter) via merged Andes Technology Gerrit changes; many stages still scalar | No upstream riscv64 CI (Gerrit/Jenkins bot runs x86/arm only) | Debian sid `libaom3` 3.13.1-2+b1 (installed); Ubuntu 24.04 ports 3.8.2-2build1 | Open Gerrit change 208401 (stalled since 2026-03-18): `w==2`/`h==2` highbd-convolve RVV correctness bug affecting native RTCD=1 builds. Separately, a 2026-08-18 RISE blog post notes libaom's RVV intrinsics require finalized-spec rounding-mode arguments that GCC 13 lacks, breaking Pillow's AVIF support (a GCC-version/toolchain issue, worked around downstream with `-DAOM_TARGET_CPU=generic`) |
| dav1d | AV1 decode, preferred fast path | runtime-dependency, optional | Most complete RVV port of any libavif dependency (itx, cdef, ipred, mc_blend, w_mask, VLEN-512 paths); upstream RVV tracker lists roughly 26/120 checklist items done | CI runs under QEMU only, no native hardware runner; correctness covered, performance regressions undetectable in CI | Debian sid `libdav1d7` 1.5.3-1+b2 ("Maybe-Successful" build); Ubuntu 24.04 native riscv64 package | Open GitLab #463: static cross-link fails, needs `CFLAGS='-static'` workaround. Open MR !1825 (`dav1d_set_vlen_max()`), stalled 6+ months, blocking safe VLEN capping on non-conformant hardware |
| libgav1 | AV1 decode, alternative C++ decoder | runtime-dependency, optional | No riscv64 SIMD at all; `src/dsp/` has only `arm/` and `x86/` subdirectories, pure scalar C++ on riscv64 | Unknown, no riscv64 CI | Unofficial Debian port only, `libgav1-1` v0.18.0 (not an official architecture) | No riscv64 issue or PR exists anywhere; upstream has simply never addressed it. The canonical repository is `chromium.googlesource.com/codecs/libgav1`; the `google/libgav1` GitHub URL some tooling references is a stale 404 |
| rav1e | AV1 encode, Rust | runtime-dependency, optional | Pure Rust scalar fallback only; no RISC-V asm/intrinsics | Unknown | Unofficial Debian port only, v0.6.6, no continuity guarantee | Open, unanswered feature request [xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402) "RISC-V asm optimization" (filed October 2024, zero maintainer response as of this check). Affects only the encode path; decode is handled by dav1d |
| SVT-AV1 | AV1 encode, scalable | runtime-dependency, optional | Generic C only; no RVV work at all; no `HAVE_RISCV_PLATFORM` CMake detection | No riscv64 CI | Debian sid 4.1.0+dfsg-1 (installed, continuous builds since 2022) | Open #2214: bundled third-party code blocks clean packaging (linked Fedora Bugzilla RH#2316282). Closed #2239: maintainer states "svt-av1 offers no ASM optimizations for those other platforms anyway", an explicit statement of lack of interest, not a technical blocker |
| libyuv | YUV/RGB color conversion, scaling | runtime-dependency, optional | Upstream has `source/row_rvv.cc` and `source/scale_rvv.cc` confirmed present in the tree | Unknown | Debian `libyuv0` v0.0.1922 (official port) | No riscv64 issues found. libavif's own vendored fallback copy lacks these RVV files; only the system package carries them, and Debian/Ubuntu packaging links the system copy |
| libwebp | Provides libsharpyuv, sharp RGB-to-YUV conversion | runtime-dependency, optional | Scalar fallback only; only x86 SSE2 and ARM NEON SIMD exist for libsharpyuv, no RVV path | N/A (scalar, correctness-only) | Debian `libsharpyuv0` v1.5.0 (official port), functionally correct, performance degraded on riscv64 | No open issues; the question has never been raised upstream for riscv64 |
| libxml2 | XML parsing, optional gain-map JPEG conversion path | runtime-dependency, optional | Portable scalar C, compiles cleanly | No upstream riscv64 CI | Debian sid 2.15.3+dfsg-1; Ubuntu 24.04 ports 2.9.14 (security-patch lagging amd64 by 7 revisions) | Open GitLab #971 (filed 2025-08-13): catalog code uses double-checked locking unsafe on weak-memory architectures, directly affecting riscv64; can silently read uninitialized data in multi-threaded catalog use |
| libjpeg-turbo | JPEG decode/encode for apps/tests, SIMD | runtime-dependency, optional | RVV merged in 3.1.90/3.2-beta1 (commit 9817c40); an IDCT/FDCT perf-tuning branch (`rvv-dct-opt`) is under review | Closed #710: 2 of 590 tests failed on QEMU riscv64 due to an FMA-rounding difference; workaround shipped | Distro packages (Ubuntu 2.1.5, Debian 1:3.1.3-4) predate the RVV merge by roughly 3.5 years; no riscv64 binary with SIMD exists yet, pending a 3.2.0 package | Closed #885 (won't-implement): maintainer declines to add riscv64 to official release binaries regardless of free CI offers. Open #895: DCT/FDCT perf patch stalled on maintainer funding, "probably months" |
| libpng | PNG decode/encode for apps/tests | runtime-dependency, optional | RVV filter-row intrinsics (GCC >= 13 / Clang >= 14), released in 1.6.53 (December 2025) after a correctness fix | No automated riscv64 CI upstream; validated ad hoc on a Spacemit K1 by OpenCV (PR #771) | Debian sid 1.6.58-1; Ubuntu 26.04 Resolute 1.6.57-1 (post-fix); Ubuntu 24.04 Noble ships 1.6.43, which predates the RVV port entirely | All RISC-V issues closed (#705, #711, #769, plus PR #771); RVV is off by default, and the fix history (a silently wrong Paeth filter shipped and only caught by OpenCV's test suite) shows structural CI-gap risk remains |
| zlib | DEFLATE compression, used by libpng | runtime-dependency, optional | No SIMD paths at all; portable C compiles cleanly | No riscv64 test failures reported; no CI | Shipping everywhere: Ubuntu 24.04 zlib1g, Debian sid, Arch RISC-V, Alpine edge | Open PR #1099 (since 2025-10-28, zero maintainer response): working RVV Adler32 implementation, unreviewed; maintainer Mark Adler has a documented multi-year pattern of not reviewing architecture-SIMD PRs (a Power8 precedent dating to 2019) |
| googletest | Test framework for libavif's own GTest suite (`AVIF_GTEST=SYSTEM`/`LOCAL`) | test-dependency, optional | Data not available: no riscv64-specific search was conducted for google/googletest in this research cycle | Data not available: no riscv64-specific search was conducted | Data not available: no riscv64-specific search was conducted | Pure C++ test scaffolding with no known architecture-specific code; used only to build and run libavif's own conformance tests, not shipped in production builds |

### Cross-cutting observations

dav1d and libaom are the two genuinely RISC-V-invested dependencies (RVV kernels actively merged, RISE/Andes Technology engagement visible in the upstream commit trail). SVT-AV1, rav1e, and libgav1 have essentially zero RISC-V SIMD investment. libyuv already has RVV support in its upstream tree that is not obviously credited or tracked anywhere. The single most concrete cross-project correctness risk among these dependencies is libxml2 issue #971 (weak-memory catalog race): it is a genuine riscv64-specific bug, not merely a missing-optimization gap.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | No riscv64-specific issue exists in the upstream libavif tracker | - | - | GitHub issue search `riscv repo:AOMediaCodec/libavif` (all states), and semantic searches for `riscv64 performance` and `riscv64 bug`, independently re-run multiple times this cycle: 0 genuine matches each time (semantic-search false positives matched only unrelated s390x/arm64 issues, e.g. #731, #1085, #2406, #2718) |
| (none) | No riscv64 Debian BTS report for libavif | - | - | bugs.debian.org: no reports found for libavif on riscv64 |
| [xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402) | RISC-V asm optimization for rav1e | Open (filed October 2024, no maintainer response) | Medium (encode performance only) | Affects rav1e encode backend only; no correctness impact; decode path (dav1d) is unaffected |

No correctness bug has been reported for libavif itself on riscv64. The Debian riscv64 build history shows zero cross-build failures across every recorded version. Alpine riscv64 disables GTest (`AVIF_GTEST=OFF`), leaving the conformance test suite unexercised there; Debian's exact GTest posture on riscv64 was not independently confirmed this cycle and remains [NEEDS VERIFICATION]. This is a test-coverage gap, not a known defect.

## 12. Objections and Upstream Blockers

No objections to RISC-V support have ever been raised in the upstream libavif tracker, because no RISC-V-related discussion has occurred there at all. The project's architecture eliminates the objections that commonly arise for architecture ports:

- No mandatory SIMD exists to implement.
- No assembly exists to translate.
- No JIT exists to port.
- No platform-specific detection logic exists to extend.

The only technical blockers to riscv64 readiness live in the codec dependencies (dav1d, libaom, rav1e, SVT-AV1), not in libavif itself: dav1d has merged RVV work, libaom has partial RVV coverage with an open correctness bug (Gerrit 208401), rav1e has an open, unanswered feature request, and SVT-AV1 has no RVV work and, per its maintainer's own words on #2239, no stated interest in adding any for non-x86 platforms.

Acceptance probability for an upstream contribution to libavif itself, such as adding a riscv64 CI job, is high. The project's portability-first design and AOMedia's broad membership make such an addition uncontroversial, and the only required upstream change is CI configuration; no code change is needed.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Optimization-purpose project:** No. libavif is a portable C99 ISOBMFF/HEIF framing layer with zero SIMD or assembly of its own by design; it delivers identical correctness and encode/decode outcomes with generic C, since all performance-critical work is delegated to pluggable codec dependencies (libaom, dav1d, rav1e, SVT-AV1, libgav1). The optimization-level axis therefore does not apply to libavif itself.

**Justification:** libavif ships compiled C, so the architecture-independent shortcut does not apply, and upstream carries zero riscv64 CI: all 23 GitHub Actions workflow files in `AOMediaCodec/libavif` were read and grepped with no "riscv" match, and GitHub issue, PR, commit, and code searches for riscv/riscv64/RVV all return 0 results ([.github/workflows directory](https://github.com/AOMediaCodec/libavif/tree/main/.github/workflows)). With no upstream CI, the distribution floor applies: Debian (buildd, `libavif16` 1.4.2-1, status "Installed" on riscv64, [buildd.debian.org](https://buildd.debian.org/status/package.php?p=libavif)) and Ubuntu (Launchpad, `libavif16` 1.3.0-1ubuntu4 published for riscv64 alongside 7 other architectures, [launchpad.net](https://launchpad.net/ubuntu/resolute/+source/libavif)) both build libavif for riscv64 from source with no riscv64-specific patches in the packaging (the only packaging-level source change, stripping the vendored `third_party/libyuv` in favor of system libyuv, is applied uniformly across all architectures, not riscv64-specifically), and build history shows zero riscv64 cross-build failures recorded. That is a clean, unpatched distro build, which upgrades the project from "no CI" to yellow (clean-distro-build), with release_provider = distro rather than upstream.

**Pending work that could change the grade:** No open PR or issue inside `AOMediaCodec/libavif` itself touches riscv64; none exist. The project's own knowledge-base report (`project-reports/libavif.md`, dated 2026-07-20) lists an unfunded, not-yet-started proposal to add a riscv64 CI job upstream (1 person-week, priority High) using a RISE runner, which would raise this grade to blue or green if implemented; no RISE engagement or funded work on libavif exists today. Separately, dependency-level RISC-V performance work is ongoing in dav1d (merged RVV) and partial in libaom, with an open, unanswered issue in rav1e ([xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402)) for RVV support; none of this affects libavif's own CI-based color, but could matter if libavif's optimization-purpose status is ever reconsidered.

## 14. Investment Analysis

RISE has no existing or funded work on libavif itself as of this research cycle. The only real-world RISE touchpoint found is a single sentence in the 2026-08-18 blog post "PyTorch is available on riscv64!": "libaom's RVV intrinsics want finalised-spec rounding mode arguments that GCC 13 does not have, which breaks Pillow's AVIF support." That sentence is about libaom and Pillow, not libavif, and libavif is never named in it. The corresponding engineering artifacts live in `riseproject-dev/python-wheels`: patches that force a generic AOM target, fix a non-x86_64 cache libdir bug in libavif's install script, and disable LTO when building libavif as a Pillow dependency, plus CI workflows that build libavif from source as part of Pillow's and pillow-avif-plugin's riscv64 build pipeline. This is real, but it is downstream-consumer work, not investment in libavif's own repository, CI, or codebase.

### 14.1 Functional Enablement

No functional enablement work is required. libavif builds and runs correctly on riscv64 today with all features enabled. All five codec backends are enabled in Debian packaging. No upstream code change is needed.

### 14.2 Performance Optimization

Performance on riscv64 is determined entirely by the codec and color-conversion dependencies, not by libavif itself; any performance investment should target those libraries.

- dav1d: RVV decode optimization is ongoing upstream (roughly 26/120 tracker items done); additional contributions here are the highest-leverage performance work, and resolving GitLab #463 (static cross-link) and MR !1825 (`dav1d_set_vlen_max()`) would remove concrete blockers.
- libaom: RVV encode coverage is partial; expanding accelerated stages (transform, rate control, in-loop filtering beyond CDEF/wiener) would reduce encode latency. Gerrit change 208401 (highbd-convolve correctness bug) should be resolved before further RVV expansion is built on top of it.
- rav1e: [xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402) is unanswered; RVV intrinsics work for at least DCT/IDCT would close the most significant encode-path gap.
- SVT-AV1: no open RVV issue exists and the maintainer has stated no interest in non-x86 ASM optimization (#2239); initiating this work would require first securing maintainer buy-in, not just filing a tracking issue.
- libsharpyuv (libwebp): no RVV; adding a `row_rvv.cc`-style path analogous to libyuv's would close this gap.
- libpng: RVV support exists (1.6.53+) but ships disabled by default and both Ubuntu Noble and current distro packages lag behind it; no new engineering work is required here beyond packaging uptake.

### 14.3 CI/CD Infrastructure

The only upstream CI gap attributable directly to libavif is the absence of a riscv64 job. Adding a RISE RISC-V runner to one workflow (e.g., `ci-unix-static.yml`) with `AVIF_GTEST=SYSTEM` enabled would provide continuous regression detection and, per Section 13, would be sufficient by itself to raise the project's color. This is a low-code-change, high-assurance-value item, sized at 1 person-week in the project's own knowledge-base report.

### 14.4 Ecosystem Enablement

libavif has no Python, npm, Maven, or OCI package of its own; there is no dependent package ecosystem of libavif to enable, so Section 10 is omitted from this report. The relevant ecosystem exposure runs the other direction: libavif is consumed by Pillow's AVIF plugin, where RISE has already funded the patches and CI needed to build libavif from source on riscv64 (Section 8, Section 14 introduction). No additional ecosystem-enablement work specific to libavif is indicated; any further investment here belongs to Pillow's own readiness assessment, not this one.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 CI job to upstream libavif (RISE runner, GTest enabled) | 1 | Qualcomm / RISE | High |
| Performance | dav1d: expand RVV coverage (additional ipred shapes, obmc, film grain); resolve GitLab #463 and MR !1825 | 4-8 | RISE / VideoLAN | High |
| Performance | libaom: resolve Gerrit 208401 correctness bug, then expand RVV coverage (transform stages, in-loop filters beyond CDEF/wiener) | 6-10 | RISE / AOMedia | High |
| Performance | rav1e: initial RVV SIMD (DCT/IDCT), respond to issue #3402 | 4-6 | RISE / Xiph | Medium |
| Performance | SVT-AV1: secure maintainer buy-in (per #2239), file riscv64 tracking issue, initial RVV survey | 2 | RISE / Alliance for Open Media | Medium |
| Performance | libsharpyuv (libwebp): add RVV path (`row_rvv.cc` analogous to libyuv's) | 2-3 | RISE / Google | Medium |
| Testing | Confirm and, if needed, enable GTest suite on Debian and Alpine riscv64 (investigate Alpine disablement reason) | 1 | Qualcomm | Low |

## 15. References

- [AOMediaCodec/libavif GitHub repository](https://github.com/AOMediaCodec/libavif)
- [libavif .github/workflows/ directory](https://github.com/AOMediaCodec/libavif/tree/main/.github/workflows)
- [libavif releases](https://github.com/AOMediaCodec/libavif/releases)
- [Debian buildd riscv64 status for libavif](https://buildd.debian.org/status/package.php?p=libavif)
- [Debian packages.debian.org, libavif16 (unstable)](https://packages.debian.org/unstable/libavif16)
- [Ubuntu Launchpad, libavif source package, resolute](https://launchpad.net/ubuntu/resolute/+source/libavif)
- [Ubuntu packages.ubuntu.com search, libavif](https://packages.ubuntu.com/search?keywords=libavif&suite=resolute&searchon=names&section=all)
- [PyPI, libavif (404, no package exists)](https://pypi.org/pypi/libavif/json)
- [xiph/rav1e issue #3402: RISC-V asm optimization](https://github.com/xiph/rav1e/issues/3402)
- [libaom riscv/ convolution source directory](https://aomedia.googlesource.com/aom/+/refs/heads/main/av1/common/riscv)
- [libaom riscv/ DSP memory helpers](https://aomedia.googlesource.com/aom/+/refs/heads/main/aom_dsp/riscv)
- [GCC LTO bug PR110812 (referenced in RISE Pillow/libavif patches)](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812)
- [RISE Project](https://riseproject.dev)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE blog: PyTorch is available on riscv64! (2026-08-18, one-sentence libaom/Pillow mention)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/.status/status.htm)