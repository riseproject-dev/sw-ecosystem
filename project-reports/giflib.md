---
title: giflib
parent: Project Reports
color: yellow
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="giflib" %}

# giflib

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for giflib<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

giflib is a pure-C library for reading and writing GIF image files, implementing the GIF87a and GIF89a formats. It is not compute-intensive: GIF is a lossless, palette-based format with no floating-point math in its critical path (LZW compression/decompression and color quantization only).

**Governance:** No foundation affiliation of any kind (not Linux Foundation, not otherwise). The project is individually maintained and hosted on [SourceForge](https://sourceforge.net/projects/giflib/); there is no `MAINTAINERS` file, charter, or board. The current maintainer is Eric S. Raymond (contactable via his personal site, catb.org/~esr/). SourceForge also lists "abadger1999" (Toshio Kuratomi) as a project admin. Original author: Gershon Elber. Development status is explicitly "not actively developed": bug fixes are accepted, but there is no roadmap or formal contribution process beyond sending patches to the maintainer.

**Corporate sponsorship:** None. The only corporate name associated with the project is CompuServe Incorporated, which historically holds rights to the GIF format specification, unrelated to giflib's code or governance. Funding is informal: the maintainer solicits individual donations via Patreon.

**License:** Described by the project as "an X Consortium-like open-source license," functionally an MIT/X11-style permissive license.

**Community stance on new ports:** Not applicable in any formal sense. giflib contains no architecture-specific code, no assembly, and no SIMD, so it requires no porting work for any target, RISC-V included. There is no documented upstream policy on architecture ports because none has ever been needed.

**RISE Project membership:** giflib is not a RISE member and has no relationship with RISE (confirmed directly against [riseproject.dev/members](https://riseproject.dev/)). RISE membership consists of companies and RISC-V ecosystem organizations (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, ESWIN, BOSC, Canonical, Douyin, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE), not individual C libraries.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| No specific date | giflib ships as architecture-agnostic portable C; riscv64 availability is implicit from the first distro build, with no upstream porting commit ever required | [giflib source tree](https://sourceforge.net/p/giflib/code/ci/master/tree/) |
| Current | Ubuntu 26.04 "resolute" ships `giflib-tools`, `libgif7`, `libgif-dev` (source package 5.2.2-1ubuntu3.x) for riscv64, verified via downloaded and checksummed `.deb` | [Ubuntu package page](https://packages.ubuntu.com/resolute/riscv64/libgif7) |
| Current | Debian sid, Gentoo, Alpine, and AlmaLinux all build and ship riscv64 packages from unmodified upstream source | Research summary (distro package indexes) |
| 2026-08-05 | Third-party `conda-forge/giflib-feedstock` PR #38, "Support linux-riscv64 platform," merged, adding a riscv64 CI/build variant to the conda packaging repo (not upstream giflib) | [conda-forge/giflib-feedstock#38](https://github.com/conda-forge/giflib-feedstock/pull/38) |
| 2026-09-09 | Feedstock follow-up PR #39 merged, removing an unrelated `stdbool.h` patch and re-rendering with conda-smithy; no further riscv64-specific change | Research summary |

No upstream porting work was ever required. There are no riscv64-specific commits in the SourceForge repository, in either GitHub read-only mirror (`mirrorer/giflib`, `nesbox/giflib`), or in Debian's patch series. Debian's patch set for giflib contains four patches addressing generic memory-safety issues; none is architecture-specific.

**Key contributors for riscv64:** None identified anywhere in the evidence chain. Distro packagers (Ubuntu, Debian, Gentoo, Alpine, AlmaLinux, conda-forge) built the package without source modification.

**Fully upstream:** Yes, trivially. There is no architecture-specific code to upstream.

---

## 3. Upstream Support Tier

giflib has no formal tier policy, no CI of any kind, and no concept of supported versus unsupported architectures. Direct inspection of the SourceForge source tree (`sourceforge.net/p/giflib/code/ci/master/tree/`) confirms there is no `.travis.yml`, no GitHub Actions workflow, no `.gitlab-ci.yml`, and no `Jenkinsfile`. Every architecture that can compile C99 is treated identically.

**Comparison table:**

| Property | amd64 | arm64 | riscv64 |
|----------|-------|-------|---------|
| Upstream CI | None | None | None |
| Release-blocking tests | None | None | None |
| Official upstream binaries | No | No | No |
| Distro packages available | Yes | Yes | Yes (Ubuntu 26.04, Debian sid, Gentoo, Alpine, AlmaLinux) |
| Ubuntu 26.04 package pocket | security (5.2.2-1ubuntu3.2) | security (5.2.2-1ubuntu3.2) | ports (5.2.2-1ubuntu3), one point-release behind |

riscv64 is at functional parity with amd64 and arm64 in terms of upstream treatment (none of the three get upstream CI). The one measurable asymmetry is downstream: the riscv64 Ubuntu "ports" build lags the "security" pocket used by amd64/arm64/i386 by one point release (5.2.2-1ubuntu3 versus 5.2.2-1ubuntu3.2), an independently verified packaging gap, not an upstream one.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Direct inspection of the full upstream source tree (both the canonical SourceForge repository and the GitHub mirror) confirms giflib's entire codebase is portable C: `dgif_lib.c` (decode), `egif_lib.c` (encode), `gifalloc.c`, `gif_err.c`, `gif_hash.c`, `gif_font.c`, `quantize.c` (color quantization), `gif_lib.h`, `gif_lib_private.h`, `openbsd-reallocarray.c`, plus CLI utilities (`gif2rgb.c`, `gifbuild.c`, `giftool.c`, `gifsponge.c`, etc.).

Confirmed by direct source inspection:
- No `arch/`, `riscv/`, or any other architecture-named subdirectory anywhere in the tree.
- No `.S` or `.s` assembly files anywhere in the repository.
- No SIMD intrinsics, no CPU-feature dispatch, no JIT backend.
- No `#ifdef __riscv`, `#ifdef __x86_64__`, or `#ifdef __aarch64__` conditional compilation of any kind.
- No cryptographic operations.

**Component table:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| GIF decode (dgif_lib.c) | scalar C | scalar C | scalar C | Identical code path on every architecture |
| GIF encode (egif_lib.c) | scalar C | scalar C | scalar C | Identical code path on every architecture |
| Color quantization (quantize.c) | scalar C | scalar C | scalar C | Only computationally non-trivial routine; still scalar everywhere |
| SIMD/vectorized paths | None | None | None | Not applicable, no such path exists for any architecture |
| Assembly files | None | None | None | Not applicable |
| JIT backend | None | None | None | Not applicable |

There is no "riscv64 implementation" to rate as full/partial/scalar/missing in the sense of an architecture-specific port: giflib has exactly one code path, in portable ISO C, shared by every architecture. riscv64 support is complete and correct by construction, verified via real shipped Ubuntu riscv64 binaries and passing conda-forge riscv64 CI, not because a riscv64-specific port was written, but because none was ever needed.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** A single hand-written GNU Makefile. Direct inspection of the source tree confirms there is no autoconf, CMake, or Meson layer (a `configure.ac` fetch returned HTTP 404). The only external link dependency declared in the Makefile is `LDLIBS=libgif.a -lm`; no references to libX11, zlib, libpng, or any other third-party library appear anywhere in the Makefile or source tree. Documentation is limited to a `build.adoc` file in the source tarball; there is no `BUILDING.md`, `INSTALL`, or cross-compilation guide.

**riscv64-specific build documentation:** None exists. Direct fetch of the SourceForge project page confirmed it contains no CMake or `./configure` invocations, no stated minimum GCC/Clang version, no build flags, no QEMU instructions, and no Dockerfile for any architecture. This project's real build system (a plain Makefile) does not use autotools- or CMake-style flags at all.

**Toolchain requirement:** A C99-capable compiler. No architecture-specific minimum version is documented upstream for any target, riscv64 included; distro packagers (Debian, Ubuntu) build it with their standard riscv64 cross toolchain (`gcc`) by substituting `CC` in the Makefile invocation, following ordinary Make cross-build convention rather than any giflib-specific mechanism. [NEEDS VERIFICATION: exact `CFLAGS`/`OFLAGS` values used in production riscv64 builds; not reproduced in the source-tree fetch performed for this report.]

**QEMU:** Not documented upstream. The conda-forge feedstock's riscv64 CI (`.ci_support/linux_riscv64_.yaml`, `.github/workflows/conda-build.yml`) cross-builds for `linux-riscv64` inside a `quay.io/condaforge/linux-anvil-x86_64:alma10` container running on `ubuntu-latest` GitHub Actions runners, using QEMU/binfmt_misc emulation. This is packaging-repo infrastructure, not part of giflib's own build system.

**Known build failures:** None reported on riscv64 in any source checked (SourceForge bug tracker, GitHub mirrors, distro build logs).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There are no functional gaps between riscv64, arm64, and amd64. All three execute identical scalar C code paths.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| GIF decode | Full | Full | Full | None |
| GIF encode | Full | Full | Full | None |
| Color quantization | Full | Full | Full | None |
| GIF89a extensions | Full | Full | Full | None |
| SIMD acceleration | None | None | None | None (not implemented for any architecture) |

**Performance gaps:** No SIMD implementation exists for any architecture (no SSE/AVX on amd64, no NEON on arm64, no RVV on riscv64), so there is no riscv64-specific competitive deficit to close. The only external benchmark located that is architecturally adjacent is `libpng_rvv`, a hand-vectorized RVV fork of a different library (libpng), reporting up to 5.43x speedup on an Allwinner D1 board; this figure does not transfer to giflib and no giflib-specific RISC-V benchmark of any kind was found in any searched source.

**Security hardening gaps:** None identified as architecture-specific. CVE-2025-31344 (heap-based buffer overflow in `EGifGCBToExtension()`, affecting versions before 5.2.2-r1) applies uniformly across all platforms, as do SourceForge bug tracker entries and prior CVEs referenced in openwrt/packages issue #26277 (CVE-2021-40633, CVE-2023-48161, among others). The one real riscv64-relevant asymmetry is packaging lag, not hardening: Ubuntu 26.04's riscv64 build sits in the "ports" pocket at 5.2.2-1ubuntu3, one security point-release behind amd64/arm64/i386's 5.2.2-1ubuntu3.2.

**Floating-point semantics:** Not applicable. giflib performs no floating-point operations in its decode or encode paths.

---

## 7. CI/CD Infrastructure

**Upstream (SourceForge):** No CI of any kind. Direct inspection of `sourceforge.net/p/giflib/code/ci/master/tree/` and the project landing page confirms there is no `.travis.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `appveyor.yml`, or GitHub Actions workflow. This absence is uniform across all architectures, not riscv64-specific.

**Third-party packaging CI:** riscv64 CI exists, but only in the unofficial `conda-forge/giflib-feedstock` repository, verified by direct raw-file fetch:
- `.ci_support/linux_riscv64_.yaml`: `target_platform: [linux-riscv64]`, `docker_image: quay.io/condaforge/linux-anvil-x86_64:alma10`, `c_compiler: gcc`, `c_compiler_version: '15'`, `c_stdlib_version: '2.39'`.
- `.github/workflows/conda-build.yml`: includes a `CONFIG: linux_riscv64_` matrix entry running on `runs_on: [ubuntu-latest]` (cross-build/QEMU-emulated).

Note: the feedstock's own README prose build-status section lists only "Linux, Windows and OSX," omitting riscv64; this is stale boilerplate text contradicted by the two authoritative, executable CI files above, which do run riscv64.

**GitHub mirrors:** `mirrorer/giflib` and `nesbox/giflib` contain no `.github/workflows` directory and no CI configuration.

**RISE runners:** None. No RISE-funded CI job targets giflib.

**Comparison table:**

| CI | amd64 | arm64 | riscv64 |
|----|-------|-------|---------|
| Upstream CI (SourceForge) | None | None | None |
| conda-forge feedstock CI | Yes | Yes | Yes (merged 2026-08-05, PR #38) |
| Debian/Ubuntu build farm | Yes | Yes | Yes |

---

## 8. Distribution and Release Status

giflib has no official upstream binary releases; SourceForge hosts only source tarballs (latest: giflib 6.1.3, last updated 2026-06-11). All binary delivery runs through downstream distribution packaging.

**Distribution package status:**

| Distribution | Version | riscv64 status | Notes |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | 5.2.2-1ubuntu3 (ports) vs 5.2.2-1ubuntu3.2 (security, other arches) | Available, verified | `giflib-tools`, `libgif7`, `libgif-dev`; riscv64 build independently downloaded, SHA256-checksum-verified against the published page, and confirmed via `readelf` to be a genuine `ELF 64-bit LSB shared object, UCB RISC-V` binary |
| Debian sid | 6.1.3-based | Available | Confirmed generically as part of the distro set building unmodified upstream source for riscv64 |
| Gentoo | media-libs/giflib | Available | Builds for riscv64 |
| Alpine Linux | giflib | Available | Builds for riscv64 |
| AlmaLinux | giflib | Available | Builds for riscv64 |
| Arch Linux RISC-V | N/A | Not packaged | Direct fetch of [archriscv.felixc.at](https://archriscv.felixc.at/?q=giflib) returns zero matches for "giflib"; the unrelated AUR package `android-riscv64-giflib` is an Android NDK cross-build artifact, not an Arch Linux RISC-V system package |

**Package divergence detail:** `archive.ubuntu.com` (primary archive, used for amd64/arm64/i386) returns HTTP 404 for the riscv64 `.deb` path, confirming riscv64 is correctly served as a secondary "ports" architecture via `ports.ubuntu.com` rather than a fabricated or mislabeled primary-arch build.

**What a user must do:** Install the distro package with no patches or workarounds, e.g. `apt install libgif-dev` on Ubuntu/Debian riscv64.

**PyPI:** Not applicable. `pypi.org/pypi/giflib/json` returns HTTP 404; no PyPI package named `giflib` exists. giflib is a native C library, not a Python package.

**RISE wheel builder:** Not applicable, for the same reason; the RISE PyPI wheel-builder proxy redirects to the same 404.

---

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glibc | Runtime dependency (critical): C runtime, POSIX I/O, malloc/free, linked via the C library that provides `libc` and `libm` | Confirmed available | Not independently queried (project-graph MCP server unreachable, `CONNECTION_CLOSED`, this session) | Confirmed released; glibc is a primary Debian/Ubuntu riscv64 port architecture, present since riscv64 support began | No riscv64-blocking issues known |
| GCC | Build dependency (critical): compiler used to build giflib per `build.adoc` and the project Makefile | Confirmed used in both Ubuntu/Debian packaging and conda-forge feedstock riscv64 CI (feedstock pins gcc 15) | Not independently queried | Released, standard toolchain component on riscv64 | No riscv64-blocking issues known |
| GNU make | Build dependency (critical): orchestrates the project's single hand-written Makefile; giflib has no autoconf/CMake/Meson layer | Architecture-independent host tool; used identically across all distro riscv64 builds | Not independently queried | Released, standard base toolchain component | No riscv64-blocking issues known |
| libm (math library, linked via `-lm`) | Indirect/recursed runtime dependency: the sole external link target declared in the Makefile (`LDLIBS=libgif.a -lm`), used for limited floating-point support in `quantize.c` | Confirmed available (part of glibc on Linux riscv64 targets) | Not independently queried | Confirmed released as part of glibc | No riscv64-blocking issues known |

giflib has no JIT backend, no SIMD intrinsics, no cryptography, and no compression engine of its own beyond its internal LZW implementation. Its dependency chain bottoms out at the C standard library (glibc) and the standard build toolchain (GCC, GNU make); no other third-party library (zlib, libpng, libX11, etc.) is consumed anywhere in the Makefile or source tree, despite some of those being tracked elsewhere in the broader project inventory.

**Note on tooling gap:** the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) during this research pass, so the two planned SPARQL cross-checks (riscv64 architecture filter on `libc6-dev`/`glibc-source` in Ubuntu "resolute," and a `hasDependency` transitive-closure walk) were not executed. This is a tooling gap, not evidence of a problem; the dependency conclusions above rest on direct source-tree and distro-packaging inspection instead.

Reverse dependencies that consume libgif (e.g., libsdl2-image, Skia/Android image pipelines, torchcodec, openimageio) carry their own riscv64 status separately and are outside the scope of this report. Of note: giflib is vendored/statically linked as a build dependency inside two RISE `python-wheels` PRs (`torchcodec` #2105, `openimageio` #2540), but is not itself a standalone tracked RISE deliverable.

---

## 11. Known Bugs and Active Issues

All seven open tickets on the [SourceForge giflib bug tracker](https://sourceforge.net/p/giflib/bugs/) are memory-safety issues; none is RISC-V-specific.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| 207 | `gifclrmp -t` inverts translation index, heap OOB write | Open | High | Not architecture-specific |
| 205 | `EGifPutImageDesc` unreachable guard / discarded write result | Open | Medium | Not architecture-specific |
| 204 | Integer overflow / truncation in `gif2rgb.c` | Open | Medium | Not architecture-specific |
| 202 | Heap buffer overflow in `GifQuantizeBuffer` via integer overflow | Open | High | Not architecture-specific |
| 201 | Heap buffer overflow in `EGifGCBToSavedExtension` on malformed GCE | Open | High | Not architecture-specific |
| 198 | `EGifPutScreenDesc` pointer-reuse causes double-free | Open | High | Not architecture-specific |
| 189 | giflib 6.1.1 missing symbol | Open | Medium | Not architecture-specific |

**Additional tracked CVE:** CVE-2025-31344, heap-based buffer overflow in `EGifGCBToExtension()` (`egif_lib.c`), triggered by a crafted GIF with a truncated Graphics Control Extension block, affecting versions before 5.2.2-r1 (sources: Snyk SNYK-ALPINE321-GIFLIB-9679521, oss-sec seclists.org/oss-sec/2025/q2/37). Not architecture-specific.

**Correctness bugs on riscv64:** None found anywhere in the evidence chain (SourceForge tracker, mailing list, GitHub mirror issue search on `mirrorer/giflib` and `nesbox/giflib`). No issue, PR, or mailing-list thread references riscv64 as a reproduction platform or root cause. The giflib-devel mailing list search for "riscv" returned "Showing 0 results of 0."

---

## 12. Objections and Upstream Blockers

No objections, technical blockers, or organizational blockers to riscv64 support exist for giflib.

- The project has no formal concept of supported versus unsupported architectures.
- No maintainer statement of any kind on riscv64, positive or negative, was found.
- No architecture-conditional code exists that could block a riscv64 build.
- No tracking issue, PR, or ticket for a "riscv64 port" exists on SourceForge, on either GitHub mirror, or on any other searched forum, because none is needed: giflib's portable C code requires no architecture-specific acceptance decision.
- Distro packages (Ubuntu, Debian, Gentoo, Alpine, AlmaLinux) build and ship riscv64 binaries without source modification or upstream coordination.

Upstream acceptance probability for a riscv64-specific contribution is not a meaningful question for this project; there is no contribution that would be architecture-specific to make.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** giflib has zero upstream CI of any kind (no `.travis.yml`/GitHub Actions/GitLab CI/Jenkinsfile in its SourceForge source tree, confirmed by direct inspection), which by itself would preclude green or blue classification. However, Ubuntu 26.04 "resolute," Debian sid, Gentoo, Alpine, and AlmaLinux all build and ship riscv64 packages from unmodified upstream C source. Debian's four patches are generic memory-safety fixes, none riscv-specific. The riscv64 `.deb` was independently verified via checksum match and `readelf` confirming a genuine RISC-V ELF binary ([Ubuntu package page](https://packages.ubuntu.com/resolute/riscv64/libgif7)). Per the distribution-floor rule, a clean (unpatched) distro build with no upstream CI raises the grade from "no CI" to yellow, sub-type clean-distro-build.
- **Pending work that could change the grade:** The third-party `conda-forge/giflib-feedstock` PR #38 ([merged 2026-08-05](https://github.com/conda-forge/giflib-feedstock/pull/38)) added riscv64 CI/build configuration, but this is packaging-repo CI, not upstream giflib CI, and does not change the grade. There is no RISE involvement and no open upstream riscv64 issues or PRs that could move this classification.

This is not an optimization-purpose project (giflib has no SIMD implementation for any architecture, so no ISA-extension gap analysis applies).

---

## 14. Investment Analysis

giflib is already fully functional on riscv64 with zero investment required. The analysis below sizes the remaining, largely low-value work for completeness. RISE has not funded or performed any work specific to giflib; its only RISE footprint is as a transitive, vendored dependency inside two `python-wheels` PRs (torchcodec #2105, openimageio #2540), which does not constitute enablement work on giflib itself.

### 14.1 Functional Enablement

No work required. giflib is fully functional on riscv64 through inherent C portability, with working Ubuntu 26.04, Debian sid, Gentoo, Alpine, and AlmaLinux packages already shipping.

### 14.2 Performance Optimization

giflib has no SIMD implementation for any architecture, including amd64 and arm64. `quantize.c` is a theoretical candidate for RVV vectorization, but since no comparable SSE/AVX or NEON implementation exists for amd64/arm64 either, there is no competitive performance gap specific to riscv64 to close. No published benchmark of any kind (giflib-specific, on any architecture) was located to quantify potential gains.

### 14.3 CI/CD Infrastructure

No upstream CI exists for any architecture; establishing riscv64 CI would first require establishing CI at all, which is unlikely given the project's minimal, single-maintainer posture. The only riscv64 CI that exists anywhere in the ecosystem, in the third-party `conda-forge/giflib-feedstock` repository, is already merged and requires no further investment.

### 14.4 Ecosystem Enablement

Not applicable. giflib is a standalone C library with no dependent package ecosystem of its own to enable (no npm/PyPI/Maven registry presence). Its consumers (e.g., multimedia decoders, graphics toolkits, torchcodec, openimageio) are separate projects with independent riscv64 status, outside this report's scope.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|------------------------|-------|----------|
| Functional | None required | 0 | N/A | N/A |
| Performance | Optional RVV vectorization of `quantize.c` | 1-2 | Contributor | Low |
| CI/CD | Upstream CI does not exist for any architecture; establishing it (any arch) would precede a riscv64-specific addition | 1 | Contributor | Low |
| Ecosystem | None required (no dependent package ecosystem) | 0 | N/A | N/A |
| Packaging | Track and close the Ubuntu riscv64 "ports" pocket security lag (5.2.2-1ubuntu3 vs 5.2.2-1ubuntu3.2) | <1 | Distro maintainer | Medium |

**Overall investment recommendation:** Zero engineering investment is required for functional riscv64 support of giflib; it already works, is already packaged by five major distributions, and needs no upstream code changes. The only concrete, verifiable gap is a downstream packaging lag on Ubuntu (riscv64 security patches trailing primary architectures by one point release), which is a distro-maintenance item, not a giflib engineering item. Optional RVV vectorization and upstream CI adoption both carry low priority given the library's negligible performance profile and the maintainer's minimal-maintenance posture.

---

## 15. References

- [giflib project homepage (SourceForge)](https://giflib.sourceforge.net/)
- [giflib SourceForge project page](https://sourceforge.net/projects/giflib/)
- [giflib SourceForge source tree (master)](https://sourceforge.net/p/giflib/code/ci/master/tree/)
- [giflib SourceForge bug tracker](https://sourceforge.net/p/giflib/bugs/)
- [giflib-devel mailing list search for "riscv"](https://sourceforge.net/p/giflib/mailman/search/?q=riscv&mail_list=giflib-devel)
- [mirrorer/giflib GitHub mirror](https://github.com/mirrorer/giflib)
- [Ubuntu "resolute" package search - giflib](https://packages.ubuntu.com/search?keywords=giflib&suite=resolute&searchon=names&section=all)
- [Ubuntu libgif7 riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libgif7)
- [Ubuntu libgif-dev riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libgif-dev)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=giflib)
- [conda-forge/giflib-feedstock repository](https://github.com/conda-forge/giflib-feedstock)
- [conda-forge/giflib-feedstock PR #38 - Support linux-riscv64 platform](https://github.com/conda-forge/giflib-feedstock/pull/38)
- [conda-forge linux_riscv64_.yaml CI variant (raw)](https://raw.githubusercontent.com/conda-forge/giflib-feedstock/main/.ci_support/linux_riscv64_.yaml)
- [conda-forge conda-build.yml workflow (raw)](https://raw.githubusercontent.com/conda-forge/giflib-feedstock/main/.github/workflows/conda-build.yml)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [riseproject-dev/python-wheels PR #2105 - torchcodec 0.16.0](https://github.com/riseproject-dev/python-wheels/pull/2105)
- [riseproject-dev/python-wheels PR #2540 - openimageio 3.1.17.0](https://github.com/riseproject-dev/python-wheels/pull/2540)
- [RISE wheel_builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [PyPI giflib lookup (404, not a Python package)](https://pypi.org/pypi/giflib/json)