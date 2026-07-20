---
title: libavif
categories:
  - multimedia
  - browser
---

# libavif

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libavif<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libavif is a C99 library for encoding and decoding AVIF (AV1 Image File Format) images. It is owned by the [AOMediaCodec](https://github.com/AOMediaCodec) GitHub organization, an arm of the Alliance for Open Media (AOM), a nonprofit consortium structured as a subsidiary of the Joint Development Foundation. AOM was founded in September 2015 by Amazon, Cisco, Google, Intel, Microsoft, Mozilla, and Netflix. Current governing board members include Amazon, Apple, Cisco, Google, Intel, Meta, Microsoft, Mozilla, Netflix, Nvidia, Samsung, and Tencent. The project is licensed BSD 2-Clause.

libavif is a thin framing library. It implements AVIF container logic (ISOBMFF/HEIF box parsing and writing), color management, and orchestration. All compute-intensive work -- AV1 encode and decode, YUV/RGB conversion, scaling -- is delegated to pluggable external codec libraries (libaom, dav1d, rav1e, SVT-AV1, libgav1) and color-space helpers (libyuv, libsharpyuv). This architecture is intentional and means libavif itself has no SIMD, no assembly, and no architecture-specific code for any architecture, including x86, ARM, or RISC-V.

The original author is Joe Drago. The most active committer as of June 2026 is Wan-Teh Chang (handle: wantehchang), a member of the AOMediaCodec organization with known affiliations to Google oss-fuzz. Other active contributors include Yannis Guyon (y-guyon) and Maryla Ustarroz-Calonge (maryla-uc). The project has no formal MAINTAINERS, CODEOWNERS, OWNERS, or CONTRIBUTORS file.

The project operates under AOM's royalty-free patent licensing framework (W3C rules), requiring contributors to disclose and license relevant patents. This makes libavif open to all implementors without royalty obligations.

Neither libavif, AOMediaCodec, nor Alliance for Open Media are members of the RISE Project. RISE Premier Members include Andes Technology, Google, MediaTek, Nvidia, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), and Tenstorrent. libavif has no documented RISE engagement.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (none) | No RISC-V-related issues, PRs, commits, or CHANGELOG entries have ever existed in the upstream repository | GitHub issues search `riscv repo:AOMediaCodec/libavif` (all states): 0 results; GitHub PR search `riscv` and `riscv64` (all states): 0 results; commit search: 0 results; CHANGELOG.md: no RISC-V mentions |
| (none) | No tracking issue for a RISC-V port has been filed | GitHub issue search confirmed |
| Ongoing | Debian builds libavif for riscv64 as part of its generic port infrastructure, without any upstream changes | [Debian buildd riscv64, libavif 1.4.1-1+b1, status: Installed, builder rv-osuosl-03](https://buildd.debian.org/status/package.php?p=libavif&suite=sid) |

There is no "port history" in the traditional sense. libavif requires no porting because it is pure portable C99. The library compiles and runs on riscv64 without any upstream code changes. All riscv64 activity is downstream packaging work performed by Debian and Ubuntu maintainers.

Key contributors to riscv64 availability: Debian riscv64 port team (builders rv-osuosl-03 and others). No individual upstream contributor has filed RISC-V-related changes.

---

## 3. Upstream Support Tier

libavif has no formal platform tier policy. The README describes the library as a "friendly, portable C implementation." The CMake build system is architecture-agnostic with no platform tier enumeration. The only documented non-desktop platform port is Android JNI bindings (added in v0.10.0).

The upstream CI matrix covers only `ubuntu-latest` (x86_64 GitHub-hosted runners) and `macos-latest`. All 23 workflow files in `.github/workflows/` were read and grepped for "riscv" -- zero matches. No cross-compilation, no QEMU, and no foreign-arch targets exist. riscv64 is not a release-blocking platform. The upstream does not ship per-architecture binaries at all: GitHub release assets are OS-level bundles (`linux-artifacts.zip`, `macOS-artifacts.zip`, `windows-artifacts.zip`) plus source archives.

The only architecture-specific CMake handling in the upstream is an `if(DEFINED ANDROID_ABI OR DEFINED APPLE)` block. The only architecture-specific release note across the full CHANGELOG is "Only search for ASM_NASM language on x86_64 platforms" from v1.1.1 -- this refers to the codec build system (libaom/SVT-AV1 NASM assembly), not to libavif's own code.

**Platform support comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Yes (all 23 workflows) | No | No |
| Release binary | No (not the upstream's model) | No | No |
| Formal tier policy | None | None | None |
| Builds from upstream source | Yes | Yes | Yes |
| Official distribution packages | Yes | Yes | Yes (Debian, Ubuntu) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libavif has no architecture-specific implementation layer for any architecture. There are zero files in the repository containing SIMD intrinsics, inline assembly, JIT backends, architecture dispatch tables, or architecture-specific CMake guards for x86, ARM, or RISC-V. The library's own source tree (`src/`) is entirely portable C99.

All performance-critical compute is delegated:

- **AV1 encode/decode:** libaom, dav1d, rav1e, SVT-AV1, libgav1 -- each has its own SIMD infrastructure
- **YUV/RGB conversion and scaling:** libyuv (has RVV upstream) and libsharpyuv (no RVV)

The vendored `third_party/libyuv/source/` copy in libavif contains only 5 architecture-neutral files (`planar_functions.c`, `row_common.c`, `scale.c`, `scale_any.c`, `scale_common.c`). Upstream libyuv has `row_rvv.cc` and `scale_rvv.cc` with RVV intrinsics, but these are not included in the vendored copy. When libavif is built against the system libyuv (as Debian does, stripping the vendored copy via `rm -rfv third_party/libyuv/`), the system libyuv's RVV support is available if present.

**Architecture-specific code comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| AVIF container/framing (src/*.c) | scalar C | scalar C | scalar C |
| SIMD in libavif itself | none | none | none |
| AV1 decode (via dav1d) | SSE2/AVX2 | NEON | RVV (merged, see Section 9) |
| AV1 decode (via libaom) | SSE/AVX | NEON | RVV partial (see Section 9) |
| AV1 encode (via libaom) | SSE/AVX | NEON | RVV partial |
| AV1 encode (via rav1e) | NASM/SSE2 | NEON | scalar only |
| AV1 encode (via SVT-AV1) | AVX2/AVX-512 | partial | scalar only |
| YUV conversion (system libyuv) | SSE/AVX | NEON | RVV (upstream libyuv has row_rvv.cc) |
| YUV conversion (libsharpyuv) | SSE2 | NEON | scalar only |
| JIT | none | none | none |
| Crypto | none | none | none |
| GC barriers | none | none | none |

The riscv64 scalar fallback is not a stub -- it is the complete, correct implementation for libavif itself. The performance delta relative to amd64 and arm64 derives entirely from the codec and libyuv dependencies, not from libavif's own code.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Minimum CMake version:** 3.22 (from `cmake_minimum_required(VERSION 3.22)` in `CMakeLists.txt`). Debian's debhelper abstraction uses `cmake >= 3.13` as its build dependency, but the upstream CMakeLists enforces 3.22.

There are no upstream riscv64 toolchain files, no `cmake/riscv64.cmake`, no QEMU usage instructions, and no cross-compilation documentation in the upstream repository. All cross-build knowledge is in the Debian packaging layer.

**Debian riscv64 build (libavif 1.4.1-1, from `debian/rules`):**

Pre-configure step: the Debian package strips the vendored libyuv source tree (`rm -rfv third_party/libyuv/`) and uses the system libyuv instead.

CMake invocation:
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

All five codec backends (dav1d, AOM, SVT-AV1, libgav1, rav1e) are enabled on riscv64. This is determined by architecture conditionals in `debian/control` and `debian/rules`: riscv64 is explicitly enumerated in the allowed-arch lists for both `libgav1-dev` and `librav1e-dev`.

Build hardening: `DEB_BUILD_MAINT_OPTIONS = hardening=+all` (full hardening).

**Cross-build history (amd64 host, riscv64 target):**

| Version | Date | Result |
|---------|------|--------|
| 1.4.1-1 | 2026-04-02 | PASS |
| 1.3.0-1 | 2025-10-12 | PASS |
| 1.3.0-1 | 2025-08-23 | PASS |
| 1.2.1-1.2 | 2025-08-10 | PASS |
| 1.2.1-1.2 | 2025-05-26 | PASS |
| 1.2.1-1.1 | 2025-05-19 | PASS |
| 1.2.1-1 | 2025-04-07 | PASS |

No cross-build failures have been recorded for libavif on riscv64. Build time for recent versions is approximately 54 minutes and 680 MB on Debian riscv64 builders -- the bulk of this is SVT-AV1 compilation, not libavif itself.

No known build failures exist for riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
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
| AV1 encode SIMD (libaom RVV) | n/a | n/a | Partial (convolution, CDEF; many stages scalar) |
| AV1 encode SIMD (rav1e) | Yes (NASM) | Yes (NEON) | No |
| AV1 encode SIMD (SVT-AV1) | Yes (AVX2/AVX-512) | Partial | No |
| Sharp YUV SIMD (libsharpyuv) | Yes (SSE2) | Yes (NEON) | No |

**Functional gaps:** None. All features available on amd64 and arm64 are available on riscv64 at the libavif API level.

**Performance gaps:** Significant for encode-heavy workloads. rav1e and SVT-AV1 have no RVV SIMD; these encoders will run substantially slower on riscv64 relative to amd64. libaom has partial RVV coverage (convolution, CDEF, wiener filter); many AV1 encode pipeline stages remain scalar. dav1d has the most complete RVV coverage among the codec backends and is the recommended decode path. No public benchmark figures exist for libavif or its backends on riscv64 hardware.

**Security hardening gaps:** None identified. Debian builds with `hardening=+all` on riscv64, the same policy as all other architectures.

**Floating-point / NaN correctness:** No issues reported. Zero riscv64-specific correctness bugs in the upstream tracker or Debian BTS.

---

## 7. CI/CD Infrastructure

The upstream CI has no riscv64 coverage. All 23 workflow files in `.github/workflows/` were read via the GitHub REST API and grepped for "riscv" -- zero matches. Runners are exclusively `ubuntu-latest` (x86_64), `macos-latest`, `windows-latest`, and Android emulators. There is no QEMU-based cross-compilation, no foreign-arch matrix, and no RISE RISC-V runner integration.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

**CI comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI runs | Yes (all 23 workflows) | No | No |
| RISE runner | No | No | No |
| QEMU cross-build in CI | No | No | No |
| GTest suite in CI | Yes | No | No |
| Distro build verification | Yes (via Debian/Ubuntu) | Yes | Yes (Debian, Ubuntu) |
| Alpine build | Yes | Yes | Yes (GTest disabled) |

The riscv64 functional assurance currently relies entirely on Debian and Ubuntu distribution build infrastructure, not on upstream CI. This is a gap: regressions introduced in upstream main will not be caught until a new Debian/Ubuntu package is built and tested.

---

## 8. Distribution and Release Status

**Upstream GitHub releases:** No per-architecture binaries. The three release assets for each version (`linux-artifacts.zip`, `macOS-artifacts.zip`, `windows-artifacts.zip`) are OS-level bundles. riscv64 is not present because no per-arch binaries are produced at all. This is not a gap; it is the upstream's release model.

**PyPI:** The package `libavif` does not exist on PyPI (HTTP 404). No Python wheels exist for any architecture.

**RISE wheel builder:** Redirects to PyPI. libavif is absent because no PyPI package exists.

**Ubuntu 24.04 Noble:** All four packages -- `libavif-bin`, `libavif-dev`, `libavif-gdk-pixbuf`, `libavif16` -- explicitly list riscv64 as a supported architecture. Version 1.0.4-1ubuntu3. Available in the `universe` component. Ubuntu also carries libavif in Jammy (0.9.3-3), Questing (1.3.0-1ubuntu1), and Resolute (1.3.0-1ubuntu4) for riscv64.

**Debian sid/testing:** libavif 1.4.1-1+b1, status: Installed, built on native riscv64 hardware (builder rv-osuosl-03). All 18 Debian architectures show "Installed" status. The Debian riscv64 port is maintained by the standard Debian port infrastructure using multiple RISC-V builders (rv-osuosl-*, rv-manda-*, rv-mullvad-*, rv-plct-*, rv-mit-*, rv-rr44-*, rv-aurel32-*).

**Arch Linux RISC-V:** [NEEDS VERIFICATION] A prior search parsed the Arch Linux RISC-V community repository database and found `libavif-1.4.2-1-riscv64.pkg.tar.zst` packaged by Felix Yan. This could not be independently confirmed via WebFetch in the verification round.

**To obtain a working riscv64 binary today:** Install `libavif16` or `libavif-dev` via `apt` on Debian or Ubuntu riscv64. No manual build steps are required. All five codec backends are included.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test/CI | riscv64 Release (Debian sid) | Notes |
|---|---|---|---|---|---|
| libaom | AV1 encode + decode | Yes (generic C + partial RVV) | Unknown (no upstream riscv64 CI) | Yes, `libaom3` (v3.13.1, official port) | RVV: convolution, CDEF, wiener filter; many stages scalar |
| dav1d | AV1 decode (preferred fast path) | Yes (full RVV support merged) | Unknown (no upstream riscv64 CI) | Yes, `libdav1d7` (v1.5.3, official port) | Best RISC-V codec; see below |
| rav1e | AV1 encode (Rust encoder) | Yes (pure Rust scalar fallback) | Unknown | Yes, unofficial Debian port (v0.6.6) | Open upstream issue [#3402](https://github.com/xiph/rav1e/issues/3402) for RVV ASM; unofficial port has no continuity guarantee |
| SVT-AV1 | AV1 encode (scalable) | Yes (generic C) | Unknown | Yes, `libsvtav1enc2` (official port) | Intel-originated; x86 AVX2/AVX-512 centric; no RVV work; encode performance gap on riscv64 |
| libgav1 | AV1 decode (Google C++ alternative) | Yes (C++ scalar) | Unknown | Yes, unofficial port `libgav1-1` (v0.18.0) | No riscv64 SIMD; unofficial Debian port |
| libyuv | YUV conversion, color space | Yes; upstream has `row_rvv.cc` and `scale_rvv.cc` | Unknown | Yes, `libyuv0` (official port, v0.0.1922) | Debian strips vendored copy; system libyuv RVV support available if present |
| libsharpyuv (libwebp) | Sharp RGB-to-YUV conversion | Yes (scalar fallback) | Unknown | Yes, `libsharpyuv0` (official port, v1.5.0) | Only x86 SSE2 and ARM NEON SIMD; no RVV; quality unaffected, performance degraded |
| libpng | PNG support (apps/tests) | Yes | Standard | Yes | No issues |
| libjpeg-turbo | JPEG support (apps/tests) | Yes (scalar fallback) | Unknown | Yes | SSE/NEON SIMD paths skipped on riscv64 |
| zlib | PNG compression | Yes | Standard | Yes | No issues |

**Deep-dive: dav1d (AV1 decoder)**

dav1d is the primary fast-decode backend and has the most complete RVV implementation among all libavif dependencies. RVV support was introduced in dav1d 1.4.0 and expanded through 1.5.4:

- v1.4.0: itx (inverse transform) RVV
- v1.4.1: additional itx shapes (4x8, 8x4, 4x16, 16x4, 8x16, 16x8)
- v1.5.0: pal, cdef_filter, ipred, mc_blend, mc_bdir, itx
- v1.5.1: blend for high bitdepth
- v1.5.3: ipred, emu_edge, w_mask; VLEN-512 blend optimization
- v1.5.4: ipred_v, ipred_h, ipred_pal, ipred_dc

RVV support is detected at runtime via `HWCAP_RVV` and a compliance check via `dav1d_has_compliant_rvv()`. The dav1d roadmap lists RISC-V under "On-going" work alongside PPC and SSE2. No published fps or speedup numbers for RISC-V are available (unlike ARM entries in dav1d NEWS which cite specific speedup percentages).

**Deep-dive: libaom (AV1 encoder/decoder)**

libaom has RVV code in two locations:
- `aom_dsp/riscv/mem_rvv.h`: vectorized memory loads/stores for image block processing (vle8, vle16, vle32, vlse8, vse8, vse16, vse32 intrinsics)
- `av1/common/riscv/`: 10 RVV-accelerated files covering cdef_block, convolve, compound_convolve, highbd_convolve, highbd_compound_convolve, wiener_convolve, highbd_wiener_convolve

A `riscv-linux-gcc.cmake` cross-compilation toolchain file exists in the libaom source, confirming awareness of the architecture. No RVV speedup figures are published in commit messages or release notes. Many AV1 encode pipeline stages remain scalar on RISC-V.

**Deep-dive: rav1e**

Open feature request [xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402) (filed October 2024): "RISC-V asm optimization." Status: open, no maintainer response. Only x86_64 (NASM/SSE2) and aarch64 (NEON) receive assembly-level optimization. rav1e's Debian riscv64 package is an unofficial port with no continuity guarantee. This affects only the encode path; decode is handled by dav1d.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| (none) | No riscv64-specific issues in upstream libavif tracker | -- | -- | GitHub issue search `riscv repo:AOMediaCodec/libavif` (all states): 0 results |
| (none) | No riscv64 Debian BTS reports for libavif | -- | -- | bugs.debian.org: "No reports found" for libavif on riscv64 |
| [xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402) | RISC-V asm optimization for rav1e | Open (Oct 2024, no response) | Medium (encode performance) | Affects rav1e encode backend only; no correctness impact |

No correctness bugs have been reported for libavif on riscv64. The Debian riscv64 build history shows zero failures since at least April 2025. Alpine riscv64 disables GTest (`AVIF_GTEST=OFF`), so the conformance test suite is not exercised there -- this is a test coverage gap, not a known bug.

---

## 12. Objections and Upstream Blockers

There are no stated objections to RISC-V support in the upstream tracker, because no RISC-V-related discussions have ever occurred there. The project design eliminates the objections that commonly arise for architecture ports:

- No mandatory SIMD exists to implement
- No assembly to translate
- No JIT to port
- No platform-specific detection logic to extend

The only technical blockers are in the codec dependencies (dav1d, libaom, rav1e, SVT-AV1), not in libavif itself. dav1d already has merged RVV work. libaom has partial RVV coverage. rav1e has an open unanswered issue. SVT-AV1 has no RVV work and no open issue.

Acceptance probability for any upstream contribution to libavif itself (e.g., adding riscv64 CI): high. The project's portability-first design philosophy and AOM's broad membership make RISC-V additions uncontroversial. The only required upstream change is CI -- no code changes are needed.

---

## 13. Investment Analysis

RISE has no existing or funded work on libavif as of June 2026. No RISE blog posts mention libavif.

### 13.1 Functional Enablement

No functional enablement work is required. libavif builds and runs correctly on riscv64 today with all features enabled. All five codec backends are enabled in Debian packaging. No upstream code changes are needed.

### 13.2 Performance Optimization

Performance on riscv64 is determined entirely by the codec and libyuv dependencies. Any performance investment should target those libraries, not libavif itself.

- dav1d: RVV decode optimization is ongoing upstream; additional contributions are the highest-leverage work
- libaom: RVV encode coverage is partial; expanding the set of accelerated stages (transform, rate control, in-loop filtering beyond CDEF/wiener) would reduce encode latency
- rav1e: [xiph/rav1e#3402](https://github.com/xiph/rav1e/issues/3402) is unanswered; RVV intrinsics work for at least DCT/IDCT would close the most significant gap
- SVT-AV1: No open issue exists; filing one and initiating RVV work would be needed from scratch
- libsharpyuv: No RVV; YUV conversion performance gap; adding `row_rvv.cc` analogous to libyuv's would address this

### 13.3 CI/CD Infrastructure

The only upstream CI gap attributable directly to libavif is the absence of a riscv64 CI job. Adding a RISE RISC-V runner to one workflow (e.g., `ci-unix-static.yml`) with `AVIF_GTEST=SYSTEM` enabled would provide continuous regression detection. This is a low-code change with high assurance value.

### 13.4 Ecosystem Enablement

libavif has no Python package on PyPI and no npm, Maven, or OCI artifact. There is no package ecosystem to enable. Section 10 is omitted accordingly.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| CI/CD | Add riscv64 CI job to upstream libavif (RISE runner, GTest enabled) | 1 | Qualcomm / RISE | High |
| Performance | dav1d: expand RVV coverage (additional ipred shapes, obmc, film grain) | 4-8 | RISE / VideoLAN | High |
| Performance | libaom: expand RVV coverage (transform stages, in-loop filters beyond CDEF/wiener) | 6-10 | RISE / AOM | High |
| Performance | rav1e: initial RVV SIMD (DCT/IDCT, respond to issue #3402) | 4-6 | RISE / Xiph | Medium |
| Performance | SVT-AV1: file riscv64 tracking issue, initial RVV survey | 2 | RISE / Alliance for Open Source | Medium |
| Performance | libsharpyuv: add RVV path (row_rvv.cc analogous to libyuv) | 2-3 | RISE / Google | Medium |
| Testing | Enable GTest suite on Alpine riscv64 (investigate disablement reason) | 1 | Qualcomm | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [AOMediaCodec/libavif GitHub repository](https://github.com/AOMediaCodec/libavif)
- [libavif CHANGELOG.md](https://github.com/AOMediaCodec/libavif/blob/main/CHANGELOG.md)
- [libavif .github/workflows/ directory](https://github.com/AOMediaCodec/libavif/tree/main/.github/workflows)
- [Debian buildd riscv64 status for libavif](https://buildd.debian.org/status/package.php?p=libavif&suite=sid)
- [Ubuntu 24.04 Noble libavif packages](https://packages.ubuntu.com/search?keywords=libavif&suite=noble)
- [videolan/dav1d NEWS file (RVV changelog)](https://raw.githubusercontent.com/videolan/dav1d/master/NEWS)
- [libaom riscv/ convolution source directory](https://aomedia.googlesource.com/aom/+/refs/heads/main/av1/common/riscv)
- [libaom riscv/ DSP memory helpers](https://aomedia.googlesource.com/aom/+/refs/heads/main/aom_dsp/riscv)
- [xiph/rav1e issue #3402: RISC-V asm optimization](https://github.com/xiph/rav1e/issues/3402)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (March 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners six-weeks update (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)