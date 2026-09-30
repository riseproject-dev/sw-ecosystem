---
title: libjxl
parent: Project Reports
color: yellow
dependencies:
  - name: Highway
    relation: runtime-dependency
    criticality: critical
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: lcms2
    relation: runtime-dependency
    criticality: optional
  - name: skcms
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: sjpeg
    relation: runtime-dependency
    criticality: optional
  - name: OpenEXR
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: benchmark
    relation: test-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libjxl" %}

# libjxl

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libjxl<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libjxl is the reference implementation of the ISO/IEC 18181 (JPEG XL) standard. The standard itself is governed by ISO/IEC JTC1/SC29/WG1 ("JPEG"), a formal joint ISO/IEC/ITU-T working group that meets roughly four times a year; participation requires membership through a national standards body or liaison status, not an open public process. The reference implementation at [github.com/libjxl/libjxl](https://github.com/libjxl/libjxl) is a multi-company collaboration co-founded by Google and Cloudinary. There is no independent foundation: the repository has no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, PLATFORMS.md, SUPPORT.md, or docs/platforms/ file. Governance is informal, standard GitHub pull-request review, with a Contributor License Agreement assigned to Google as the receiving legal entity and Google's Open Source Community Guidelines applying as code of conduct. License: BSD-3-Clause plus an Additional IP Rights Grant (PATENTS file), a perpetual, worldwide, royalty-free, irrevocable patent license from Google, terminable if the licensee sues over JPEG XL patents.

**Corporate maintainers and sponsors:**

- Google: dominant corporate steward and CLA assignee. Named engineers include Evgenii "Eugene" Kliuchnikov (eustas, 742 commits), Jan Wassenberg (janwas), Jyrki Alakuijala and Zoltan Szabadka (original JPEG XL inventors, 431 commits for Szabadka), Lode Vandevenne, Luca Versari (veluca93, 220 commits), Moritz Firsching (mo271, 336 commits), Sami Boukortt (sboukortt, 220 commits, Google Zurich), Marcin Kowalczyk, Martin Bruse, Sebastian Gomez, Thomas Fischbacher, and Iulia Comsa. Several of these (eustas, veluca93, mo271, sboukortt) are core GitHub-org reviewers/mergers.
- Cloudinary Ltd: co-founding contributor via Jon Sneyers (jonsneyers, 338 commits), inventor of FLIF (the lossless-coding predecessor folded into JPEG XL) and an active core reviewer.
- Other recurring contributors carry corporate affiliations but are individual contributors, not listed project sponsors: Igalia (Diego Pino), Spatialys/GDAL (Even Rouault), Airbus (Thomas Bonfort), Debian (Sylvestre Ledru), ladybird.org (Andrew Kaster), macports.org (Joshua Root).

**Community culture on new ports:** collaborative but reactive, not proactive. The project accepts build-correctness patches for new architectures when submitted with a working fix; both riscv64-specific fixes (2023 and 2025) were submitted by outside contributors, an individual community member and the OpenEmbedded/Yocto maintainer respectively, and merged after review by Google engineers, though PR #3826 took nearly a year from open to merge. There is no dedicated riscv64 CI tier, roadmap commitment, or governance-board gate; architecture-support patches go through the same lightweight PR-review process as any other change.

**RISE involvement: none.** RISE (riseproject.dev) is an industry consortium of companies, not a project registry. Premier members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent. General members: Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE. libjxl/JPEG XL does not appear anywhere on riseproject.dev. This was confirmed by: (1) scanning all 35 RISE blog posts published 2024-05-15 through 2026-09-28 (full list via the [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)), zero mentions of libjxl or JPEG XL; (2) searching the riseproject-dev GitHub org (26 public repos including [python-wheels](https://github.com/riseproject-dev/python-wheels), which tracks 813 open wheel-build issues), zero libjxl hits; (3) the [RISE wheel-builder package list](https://riseproject.gitlab.io/python/wheel_builder/), no libjxl or jxl-named package present. Separately, no PyPI package literally named `libjxl` exists at all ([HTTP 404 on pypi.org/pypi/libjxl/json](https://pypi.org/pypi/libjxl/json)), so a PyPI wheel-builder relationship is not applicable regardless of RISE membership.

## 2. Port History and Upstreaming Timeline

All riscv64 work is fully upstream on the main branch; no downstream-only patches exist. The work has been entirely reactive: build failures filed by distro maintainers and fixed on demand, not a planned port.

| Date | Event | Source |
|------|-------|--------|
| 2022-01-27 | PR #1128 opened (malaterre): CMake module to detect when GCC needs `-latomic` for c11 atomics; explicitly names riscv64 (plus armel/mipsel/powerpc on Debian) as affected | [PR #1128](https://github.com/libjxl/libjxl/pull/1128) |
| 2022-03-26 | Issue #1283 opened: Gentoo/riscv64 link failure, undefined reference to `__atomic_fetch_and_1`/`__atomic_fetch_or_1` in `dec_group_border.cc` with GCC 11.2.1, reported by novomesk with a full build log | [Issue #1283](https://github.com/libjxl/libjxl/issues/1283) |
| 2022-03-28 | PR #1128 merged (commit `87fe7c1`). A residual riscv64-only gap surfaces immediately: `-pthread` on riscv64 already implies libatomic via `Threads::Threads`, which the patch did not account for | [PR #1128 commit](https://github.com/libjxl/libjxl/commit/87fe7c16e1fb2e21b6a1dca26782950ae1559d99) |
| 2022-03-29 | PR #1166 merged (malaterre, commit `fde214c`, "Refactor c11/atomic patch for riscv64"): routes `Threads::Threads` into `JPEGXL_DEC_INTERNAL_LIBS` so decoder-only binaries (`djxl_conformance`) link; closes #1283. Tested and confirmed working on a physical SiFive Unmatched board (Gentoo) by dlan17 | [PR #1166](https://github.com/libjxl/libjxl/pull/1166), [commit](https://github.com/libjxl/libjxl/commit/fde214c5f4dc5ffd0360401a68df33182edf9226) |
| 2022-05-19 | PR #1429 opened by rebeccasf: "Add support for 64-bit RISC-V arch," proposing a `JXL_ARCH_RISCV`-style detection macro, motivated by Chromium riscv64 build errors | [PR #1429](https://github.com/libjxl/libjxl/pull/1429) |
| 2022-06-10 | PR #1429 closed without merge. Reviewer eustas asked "where this macro will be used?"; malaterre noted the existing `JXL_ARCH_PPC` macro is also unused and that libjxl already compiled on riscv64/Debian without the change; author rebeccasf closed it after rebasing the Chromium-side source instead, resolving the underlying problem without a libjxl change | [PR #1429](https://github.com/libjxl/libjxl/pull/1429) |
| 2022-07-05 | Commit `3199321b`, "Disable SVE and RVV HWY targets" (eustas): the Highway RVV SIMD target is explicitly moved to off-by-default. This setting is unchanged in the current HEAD (`5f92f524`), more than three years later | [commit 3199321b](https://github.com/libjxl/libjxl/commit/3199321b) |
| 2022-07-14 | PR #1611 merged: preparatory `static_assert` fix enabling SVE/RVV Highway dispatch to compile | [PR #1611](https://github.com/libjxl/libjxl/pull/1611) |
| 2022-07-25 | PR #1642 merged: build-file typo fix intended to help SVE/RVV build with GCC | [PR #1642](https://github.com/libjxl/libjxl/pull/1642) |
| 2022-09-21 | v0.7.0 released: first release containing the atomics-linkage fixes from PRs #1128 and #1166 | [v0.7.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.7.0) |
| 2022-09-27 | Issue #1788 opened: `JxlTest.RoundtripLargeFast` assertion failure on ppc64el, riscv64, ia64 with GCC 12.2.0 (encoded size 18 bytes over a hardcoded limit); closed as resolved by commit `bb8eac5d6` | [Issue #1788](https://github.com/libjxl/libjxl/issues/1788) |
| 2023-02-22 | PR #2211 merged same day (IEAST, reviewed by mo271): adds missing `#include <atomic>` to `enc_xyb.cc`, fixing a GCC/riscv64 "incomplete type" compile error present in v0.8.1 | [PR #2211](https://github.com/libjxl/libjxl/pull/2211), [merge commit](https://github.com/libjxl/libjxl/commit/22d12d74e7bc56b09cfb1973aa89ec8d714fa3fc) |
| 2023-12-22 | v0.9.0 released: first release actually containing PR #2211's fix. This corrects an earlier reported date of v0.8.2 (2023-06-14); direct ancestry checks against every v0.8.x tag (v0.8.1 through v0.8.5) show none contain the commit, it landed only on main and first shipped roughly ten months after merge, in v0.9.0 | [v0.9.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.9.0) |
| 2024-09-14 | PR #3826 opened by kraj (Khem Raj, OpenEmbedded/Yocto maintainer): disable `-mrelax-all` for clang on riscv64, since clang 19+ crashes when branch relaxation is duplicated between the compiler and the assembler stage | [PR #3826](https://github.com/libjxl/libjxl/pull/3826) |
| 2025-08-08 | PR #3826 merged (co-authored by Google's eustas), labeled `merge-0.11` signaling backport intent | [commit 192294e1](https://github.com/libjxl/libjxl/commit/192294e15e1d27660d887bc3b9b5ead8e5aa6a93) |
| 2026-02-10 | v0.11.2 released. Direct diff of `CMakeLists.txt` at this tag shows the riscv `-mrelax-all` exclusion is **absent**: the `merge-0.11` backport label was not acted on | [v0.11.2 release](https://github.com/libjxl/libjxl/releases/tag/v0.11.2) |
| 2026-07-01 | v0.12.0 released: the actual first release containing PR #3826's fix, confirmed present by diffing `CMakeLists.txt` against v0.11.2 | [v0.12.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.12.0) |

**Discrepancy notes:** Two dates in the port-history timeline required correction against a prior version of this analysis. First, PR #2211's first shipping release is v0.9.0, not v0.8.2; the earlier figure was not independently verified against tag ancestry. Second, despite carrying a `merge-0.11` label, PR #3826 was never actually backported into the 0.11.x branch; its fix first ships in v0.12.0. Both corrections were established by `git merge-base --is-ancestor` checks against a full local clone plus direct file-content diffs at the named tags, which is treated as authoritative over the label text alone. Separately, PR #1429's author rebeccasf is identified on the live PR page as a Google contributor; an earlier characterization of this PR attributed the author to StarFive Technology. That earlier attribution could not be corroborated against the PR page itself and is treated here as superseded by the direct source read.

**Key contributors:** novomesk (issue reporter, Gentoo), malaterre (Debian maintainer, root-cause and follow-up fixes), dlan17 (physical SiFive Unmatched hardware tester, Gentoo), rebeccasf (Google, PR closed without merge), IEAST/Eastdong (compiler fix), kraj/Khem Raj (OpenEmbedded/Yocto Project maintainer, most recent fix). Google engineers eustas, mo271, sboukortt, and veluca93 reviewed or co-authored every merged riscv64 fix.

No master riscv64 tracking issue exists; support accreted through five independent build/portability fixes spanning 2022-2025, each addressing a specific compiler or linker break rather than a planned feature port.

## 3. Upstream Support Tier

libjxl has no formal platform tier policy document (no PLATFORMS.md, SUPPORT.md, or CODEOWNERS with per-architecture ownership). Tier must be inferred from CI coverage and release-artifact generation.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build job | Yes (ubuntu-latest) | Yes (ubuntu-24.04-arm, native) | No |
| CI test job | Yes | Yes | No |
| Official upstream release binary | Yes (static tarball + .deb) | No (CI runs but no release artifact) | No |
| QEMU-emulated CI | No | N/A | No (only s390x is QEMU-emulated in CI) |
| Cross-compile CI | Yes (host for armhf, i386, x64 targets) | N/A | No |
| Distro package | Yes (first-class) | Yes (first-class) | Yes (Debian sid: first-class, unpatched; Ubuntu: ports archive, security-lagged) |
| Release-blocking | Yes | No | No |

**Effective tier:** riscv64 is an untested, unreleased tier below arm64. The project accepts build-fix patches but takes no responsibility for riscv64 correctness between submissions; regressions surface only through downstream distro build infrastructure (Debian buildd, Ubuntu ports).

## 4. Technical Architecture and RISC-V-Specific Subsystems

libjxl has no per-architecture source files for any architecture. The main codec (encoder/decoder core) is portable C++ built against Google Highway's `foreach_target.h` mechanism: the same 55 generic source files (`enc_xyb.cc`, `dec_xyb.cc`, `enc_adaptive_quantization.cc`, `convolve*.cc`, `enc_group.cc`, `compressed_dc.cc`, modular-transform files, etc.) are recompiled once per enabled Highway target. Architecture-specific SIMD kernels live entirely in the Highway (`third_party/highway`) submodule, a separate Google project, not in libjxl's own tree.

### 4.1 Google Highway (libhwy), primary SIMD abstraction

All SIMD-accelerated kernels (DCT, inverse DCT, colorspace transforms, convolution, ANS entropy coding, modular encoder) use Highway's `HWY_DYNAMIC_DISPATCH`/`-inl.h` pattern. Highway defines `HWY_RVV` and `HWY_ARCH_RISCV`. On riscv64, Highway can generate RVV-accelerated code with GCC >= 13 or Clang >= 16, and supports single-binary runtime dispatch with Clang >= 19.

**RVV is explicitly disabled by default**, and has been since commit `3199321b` ("Disable SVE and RVV HWY targets," 2022-07-05, eustas), unchanged through the current HEAD. `CMakeLists.txt` lists `RVV` in `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT`; a user or distro must pass `-DJPEGXL_ENABLE_HWY_RVV=ON` to opt in, and even then the pinned Highway version gates what is available (see Section 9.2). A default riscv64 build therefore compiles the codec's Highway-mediated paths to `EMU128`/`SCALAR`, the generic C++ fallback, regardless of hardware capability.

libjxl is pinned to Highway v1.2.0 (commit `457c891`, May 2024) via its bundled submodule. Highway's own RVV runtime dispatch was re-enabled upstream in [highway PR #2968](https://github.com/google/highway/pull/2968) (merged 2026-04-07), after the v1.2.0 pin date; an open bot PR in libjxl, [#2269](https://github.com/libjxl/libjxl/pull/2269), tracks the version bump but has not landed. Highway's RVV backend is still receiving active correctness fixes as of September 2026 (e.g. commits `0a020e46` "RVV: Fix ReorderWidenMulAccumulate for fractional LMUL" and `e559d5a4` "RVV: test RearrangeToOddPlusEven after reload"), consistent with the project's caution in keeping it off by default.

### 4.2 enc_fast_lossless.cc, manual SIMD, critical path, scalar on riscv64

This 4437-line file implements the fast lossless encoder with its own hand-written intrinsics dispatch, bypassing Highway entirely. Backends present: AVX-512 and AVX2 (x86-64 only, via `immintrin.h`) and NEON (aarch64 only, via `arm_neon.h`). There is no `#elif defined(__riscv)` branch anywhere in the file; riscv64 silently falls through to the generic scalar path (`kLogChunkSize = 3`, versus 5 for AVX-512 and 4 for AVX2/NEON). This is a structural absence, not an incomplete stub, no TODO/FIXME comment references riscv in the file.

### 4.3 arch_macros.h, architecture detection

libjxl defines `JXL_ARCH_X64`, `JXL_ARCH_PPC`, and `JXL_ARCH_ARM`, but no `JXL_ARCH_RISCV`/`JXL_ARCH_RISCV64`. The codebase has zero `#ifdef __riscv` guards. PR #1429 proposed such a macro and was closed without merge when reviewers found no existing consumer for it.

### 4.4 Component comparison

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Fast lossless encoder (`enc_fast_lossless.cc`) | AVX2 + AVX-512 (manual intrinsics) | NEON (manual intrinsics) | Scalar, no dispatch branch exists |
| DCT, transforms, convolution (Highway `-inl.h`) | SSE4/AVX2/AVX-512 | NEON/SVE | EMU128 scalar by default; RVV available but off by default since 2022, additionally gated by the Highway v1.2.0 pin |
| ANS entropy coding, modular encoder | AVX2/AVX-512 | NEON/SVE | Same Highway dependency, same EMU128 fallback |
| Architecture detection macro | `JXL_ARCH_X64` defined | `JXL_ARCH_ARM` defined | Not defined |
| JIT backend | None | None | None (not applicable) |
| Assembly (`.S` files) | None | None | None |

**Bottom line:** riscv64 builds and runs correctly, confirmed by Debian/Ubuntu/Alpine packaging, but ships no hand-tuned SIMD path in the fast-lossless encoder, and in the Highway-based codec its only vector path (RVV) has been deliberately off by default since mid-2022. Production riscv64 builds of libjxl run on scalar C++ fallback in practice, functionally closer to "scalar" than "partial" despite RVV nominally existing in the target list.

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build requirements

libjxl uses CMake (>= 3.10) and Ninja. There is no built-in riscv64 CMake toolchain file, no `docs/building.md`/`docs/cross-compilation.md` (neither file exists), and no riscv64-specific `BUILDING.md` section. `doc/building_and_testing.md` documents a generic cross-compile pattern via `BUILD_TARGET`, illustrated only for `aarch64-linux-gnu`; nothing riscv64-specific is documented or tested upstream.

**Direct CMake cross-compile invocation (constructed by analogy with the documented aarch64/armhf/s390x recipes, not itself an upstream-published recipe):**

```bash
cmake -B build-riscv64 \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu \
  -DCMAKE_CROSSCOMPILING=ON \
  -DHAVE_STD_REGEX=0 -DHAVE_POSIX_REGEX=0 \
  -DHAVE_GNU_POSIX_REGEX=0 -DHAVE_STEADY_CLOCK=0 \
  -DHAVE_THREAD_SAFETY_ATTRIBUTES=0 \
  -DJPEGXL_FORCE_SYSTEM_BROTLI=ON \
  -DJPEGXL_FORCE_SYSTEM_HWY=ON \
  -DJPEGXL_FORCE_SYSTEM_LCMS2=ON \
  .
```

### 5.2 Toolchain version requirements

| Component | Minimum version | Reason |
|-----------|-----------------|--------|
| GCC | 13 | Highway RVV target requires GCC 13+ for RVV intrinsic compilation |
| Clang | 16 | Highway RVV target requires Clang 16+ for RVV intrinsic compilation |
| Clang | 19 | Required for Highway RVV runtime dispatch (target-attribute support); also required to avoid the `-mrelax-all` crash fixed in PR #3826 |
| RVV intrinsics ABI | v0.11 (`__riscv_v_intrinsic >= 11000`) | Required by Highway's RVV target detection |
| CMake | 3.10 | Project minimum |

### 5.3 RVV enablement flag

```bash
-DJPEGXL_ENABLE_HWY_RVV=ON
```

Even with this flag, the pinned Highway v1.2.0 submodule does not carry RVV runtime dispatch; a binary compiled with the V-extension march flag is required.

### 5.4 Known build failures (all now fixed)

- GCC/riscv64, v0.8.1: `enc_xyb.cc` missing `#include <atomic>`. Fixed in PR #2211, first shipped in v0.9.0.
- Clang 19+/riscv64: `-mrelax-all` flag caused a crash from conflicting branch relaxation between compiler and assembler. Fixed in PR #3826, first shipped in v0.12.0 (not v0.11.2, despite its `merge-0.11` label).
- GCC 11.2.1/riscv64: undefined reference to `__atomic_fetch_and_1`/`__atomic_fetch_or_1` in `dec_group_border.cc`. Fixed in PRs #1128 and #1166, first shipped in v0.7.0.

### 5.5 QEMU testing

No QEMU riscv64 setup exists in libjxl's upstream CI. For local testing on x86 hosts:

```bash
sudo apt install qemu-user-static
# cmake flag:
-DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64-static;-L;/usr/riscv64-linux-gnu"
```

No riscv64-specific Dockerfiles exist anywhere in the repository (confirmed by code search for `riscv64 filename:Dockerfile`, zero results, and a local tree search of `.devcontainer/`, `.github/workflows/`, root, and `docs/`).

### 5.6 Debian packaging cmake flags

From Debian packaging for v0.11.2-5, riscv64 inherits the generic configuration with no architecture-specific overrides. `JPEGXL_ENABLE_TCMALLOC` and `JPEGXL_ENABLE_JNI` are both listed ON with riscv64 among supported architectures; `JPEGXL_ENABLE_SKCMS` is OFF (Debian uses system lcms2); `JPEGXL_ENABLE_SJPEG` is OFF globally.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional gaps

None known. libjxl compiles and produces correct output on riscv64. Issue #1788 (test-assertion failure on riscv64 with GCC 12.2.0, encoded size 18 bytes over a hardcoded limit) was closed as resolved by commit `bb8eac5d6`. No open correctness bugs for riscv64 exist in the libjxl issue tracker as of 2026-09-30 (targeted searches for `riscv64`, `riscv`, and `riscv nan floating` return only the closed #1283).

### 6.2 Performance gaps

The fast-lossless encoder (`enc_fast_lossless.cc`) is scalar on riscv64 (`kLogChunkSize = 3` versus 5 for AVX-512, 4 for AVX2/NEON), a structural deficit with no path to resolution short of adding an RVV backend to this file. All other Highway-mediated encode/decode paths currently run `EMU128` scalar fallback because of the Highway v1.2.0 pin and RVV's off-by-default status. A Debian installed-size anomaly is circumstantial corroboration: `libjxl-dev` on riscv64 in Debian sid is roughly 7.8x larger installed than on amd64, consistent with less aggressive SIMD code folding [NEEDS VERIFICATION: not confirmed against a second source as specifically reflecting scalar versus SIMD compilation].

No published benchmark data (MP/s encode, MP/s decode, wall-clock comparisons) exists anywhere for libjxl on riscv64 versus arm64 or amd64. This was reconfirmed on 2026-09-30 against GitHub issue search, the libjxl issue tracker, and all 35 RISE blog posts (through 2026-09-28); none contain benchmark figures or mention libjxl. Three planned WebSearch queries for this specific check could not be executed because the research session's WebSearch budget (200/200) was already exhausted; this is a tooling limitation, not confirmed evidence of absence beyond what the other channels checked. Data not available: cross-architecture performance benchmarks for libjxl.

### 6.3 Security hardening gaps

Data not available: libjxl does not document per-architecture security hardening status. riscv64 does not appear in the `-Wno-psabi` suppression block (only arm64/armel/armhf/ppc64el get that flag). No architecture-specific sanitizer or CFI configuration differences were found.

### 6.4 Floating-point semantics

Data not available beyond Issue #1788 (an 18-byte encoded-size difference on riscv64/ppc64el/ia64, closed as resolved). No documented NaN or floating-point-specific discrepancy between riscv64 and amd64/arm64 was found.

## 7. CI/CD Infrastructure

riscv64 CI is completely absent. This was confirmed by a direct, current-commit read of all 17 workflow files in `.github/workflows/` (`build_test.yml`, `build_test_bazel.yml`, `build_test_cross.yml`, `build_test_emu.yml`, `build_test_md.yml`, `build_test_msys2.yml`, `build_test_wasm.yml`, `codeql.yml`, `conformance.yml`, `dependency-review.yml`, `fuzz.yml`, `gitlab_mirror.yml`, `pages.yml`, `pull_request.yml`, `release.yaml`, `scorecard.yml`, `test_new_highway.yml`), a case-insensitive recursive grep for `riscv|risc-v|rv64|rv32` across `.github/` returning zero matches, and confirmation that no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

| CI Job | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| `build_test.yml`, main build/test | Yes (ubuntu-latest) | Yes (ubuntu-24.04-arm, native) | No |
| `build_test_cross.yml`, cross-compile | Yes (as host) | armhf cross-compile leg | No |
| `build_test_emu.yml`, QEMU emulation | N/A | N/A | No (s390x only, `multiarch/qemu-user-static`, daily at 03:14 UTC plus `workflow_dispatch`) |
| `build_test_bazel.yml`, Bazel build | Yes | No | No |
| `release.yaml`, release-artifact generation | Yes | No | No |
| `conformance.yml`, codec conformance | Yes | No | No |
| `fuzz.yml`, fuzzing | Yes | No | No |
| `test_new_highway.yml`, Highway upgrade testing | Yes | No | No |

The only riscv-aware code anywhere in the repository sits outside `.github/`: `cmake/FindAtomics.cmake` (a comment citing a Debian riscv64 mailing-list thread about atomics) and `CMakeLists.txt:362` (a `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv"` conditional skipping the Clang `-mrelax-all` flag). Neither is CI configuration; no workflow targets a riscv64 runner, QEMU riscv64 emulation, or a `linux/riscv64` platform string, and no trigger is gated on riscv64.

`build_test_emu.yml` is the closest structural analog to what riscv64 CI would look like; its matrix has exactly one entry (`linux/s390x`). Extending it to riscv64 would be a small diff. No RISE CI runners and no external CI services (Cirrus, GitLab CI, Jenkins) are used anywhere in the repository.

## 8. Distribution and Release Status

### 8.1 Upstream (GitHub) release binaries

Official release artifacts (through v0.12.0) ship amd64/x86_64 Linux static binaries, Debian/Ubuntu amd64 .deb packages, and Windows x86/x64 binaries. Direct inspection of v0.12.0's release-asset filenames (`jxl-debs-amd64-debian-*.tar`, `jxl-debs-amd64-ubuntu-*.tar`, `jxl-linux-x86_64-static.tar.lz`, `jxl-x64-windows-static.{7z,zip}`, source tarballs) found none referencing riscv or any non-x86/non-Windows architecture. The release page reports 18 assets total and the render did not exhaustively enumerate every one, so this is strong evidence, not fully exhaustive proof, of zero riscv64 release assets. Direct API access to `api.github.com/repos/libjxl/libjxl/releases` was blocked in this research session (HTTP 403/429 outside the session's repository allow-list), which is a tooling limitation, not itself evidence either way; the page-render finding is what this report relies on.

### 8.2 Debian

[libjxl0.11 0.11.2-5 in Debian sid](https://packages.debian.org/sid/libjxl0.11): riscv64 is a first-class architecture in the packaging, alongside alpha, amd64, arm64, armhf, hppa, i386, loong64, m68k, ppc64, ppc64el, s390x, sh4, and sparc64. The riscv64 build is a generic, unpatched build, the only riscv-aware code involved (`FindAtomics.cmake`'s `-latomic` detection, the clang `-mrelax-all` skip) is upstream source, not a distro-applied patch, confirmed directly at [packages.debian.org/sid/riscv64/libjxl0.11/download](https://packages.debian.org/sid/riscv64/libjxl0.11/download). TCMalloc and JNI are both enabled for riscv64 in the Debian packaging.

### 8.3 Ubuntu

Ubuntu 26.04 "resolute" carries riscv64 builds via the `ports` archive: `libjxl-dev`, `libjxl-devtools`, `libjxl-gdk-pixbuf`, `libjxl-tools`, and `libjxl0.11` all list version `0.11.1-6ubuntu4` for riscv64, confirmed directly against a `suite=resolute&arch=riscv64` search. This carries an important qualifier: Ubuntu's primary archive has since shipped a security-patched `0.11.1-6ubuntu4.2` covering only amd64, arm64, and i386, riscv64 remains on the older, unpatched `0.11.1-6ubuntu4`. Availability on riscv64 therefore lags the primary architectures on security currency, not just on build tier. Ubuntu 24.04 LTS "noble" carries an older `libjxl0.7 0.7.0-10.2ubuntu6` for riscv64 via `universe`/`ports.ubuntu.com`, one security patch behind its own amd64 build.

### 8.4 Alpine Linux

[libjxl-tools riscv64 in Alpine v3.20 community](https://pkgs.alpinelinux.org/package/v3.20/community/riscv64/libjxl-tools) confirms a riscv64 build of libjxl 0.11.x is present.

### 8.5 PyPI

No PyPI project literally named `libjxl` exists: `pypi.org/pypi/libjxl/json` and `pypi.org/simple/libjxl/` both return HTTP 404, as does the RISE GitLab wheel-builder mirror after its redirect to the PyPI simple index. Not applicable; libjxl is a C/C++ library, not distributed as a Python package under this name.

### 8.6 Arch Linux RISC-V

A direct, successful fetch of [archriscv.felixc.at](https://archriscv.felixc.at) (the unofficial Arch Linux riscv64 port) with a `libjxl` query returns no matching package. This corrects an earlier characterization of this channel as carrying a riscv64 build of libjxl 0.11.1-1; that earlier claim was itself flagged as unverified at the time (the status page had previously returned an inconclusive 404). The current, successful query is treated as authoritative: libjxl is not presently available through this channel.

### 8.7 What a riscv64 user must do

Install `libjxl-dev` from Debian sid (clean, unpatched, current) or from Ubuntu's `ports` archive (noting the security-currency lag versus Ubuntu's primary architectures), or from Alpine v3.20 community. For Clang-based builds on libjxl 0.11.2 or earlier, Clang 19+ is still required to avoid the `-mrelax-all` crash, since that fix did not actually ship until v0.12.0. RVV acceleration is not available from any current distro package without an additional cmake flag and, until libjxl's Highway pin is upgraded, without a source-level workaround. There is no upstream-provided (GitHub release) binary for riscv64 in any form.

## 9. Dependencies

### 9.1 Summary table

| Dependency | Relation | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| Highway | runtime-dependency | critical | Builds (GCC 13+/Clang 16+); libjxl's v1.2.0 pin gates RVV runtime dispatch off | Highway's own QEMU CI exists upstream (PR #3157, merged 2026-06-30) but is not consumed by libjxl's own CI | Debian sid/trixie only (`libhwy-dev` 1.3.0-2); no official upstream binaries for any architecture | Single open riscv64 issue remaining: [#2854](https://github.com/google/highway/issues/2854) (mold linker corrupts `.riscv.attributes`, workaround is to use `ld`). [PR #2968](https://github.com/google/highway/pull/2968) (RVV runtime dispatch re-enable, merged 2026-04-07) not yet pulled into libjxl's v1.2.0 pin, the largest single riscv64 performance blocker in the whole dependency chain |
| brotli | runtime-dependency | optional | Builds cleanly (`BROTLI_TARGET_RISCV64` macro added in upstream PR #669, 2018) | No riscv64-specific test failures on record | Distro-packaged (Debian/Ubuntu riscv64); no PyPI riscv64 wheel (not relevant to libjxl's C build) | None open and riscv64-specific |
| lcms2 | runtime-dependency | optional | Builds (pure C, no architecture-specific code) | No open riscv64 issues found | Debian-packaged | None identified; not independently re-verified against a fresh GitHub search this round (source-repository access to `mm2/Little-CMS` was out of this session's scope) |
| skcms | runtime-dependency | optional | Builds (vendored C, no architecture-specific code) | No open riscv64 issues found | Vendored source only, no independent release | None identified; not independently re-verified this round |
| libpng | runtime-dependency | optional | Builds; RVV read-filter intrinsics exist as a complete implementation in `riscv/filter_rvv_intrinsics.c`, but RVV is off by default at build time | Manual-only validation on contributor hardware (Spacemit K1, Banana Pi F3, StarFive JH7110); no automated riscv64 CI | Distro-packaged across all major distros; no official upstream binaries for any architecture | No open RISC-V-specific issues; absent upstream riscv64 CI is the residual gap |
| zlib | runtime-dependency | optional | Builds cleanly, pure portable C with no architecture-specific path | CI only via OpenBSD/riscv64 under QEMU (vmactions), added January 2026; no native Linux riscv64 CI job | Ships in Ubuntu 24.04, Debian sid, Arch Linux RISC-V, Alpine edge | None open |
| sjpeg | runtime-dependency | optional | Builds (vendored) | No open issues per this dependency's own report | Vendored source only | None identified; not independently re-verified this round |
| OpenEXR | runtime-dependency | optional | Builds | No open issues per this dependency's own report | Debian/Fedora packaged | None identified; not independently re-verified this round |
| googletest | test-dependency | optional | Builds | Explicitly unsupported by upstream on riscv64 (no CI, no official tier); `GetThreadCount()` returns 0 | Debian sid and Ubuntu 26.04 LTS both list riscv64 as a supported architecture | Open: [google/googletest#3756](https://github.com/google/googletest/issues/3756) (`GetThreadCountTest` fails on riscv64, openSUSE/GCC 11.2.1), cosmetic, affects a death-test warning only, does not affect libjxl's use |
| benchmark | test-dependency | optional | Builds (CPU-frequency estimation fixed for riscv64 in upstream PR #1549) | No riscv64 CI job in any of 12 upstream workflow files; maintainer acknowledged riscv/ppc/android are uncovered | Source-only releases for any architecture; distro-packaged | None riscv64-specific in benchmark itself; inherits googletest#3756 transitively |
| CMake | build-dependency | critical | Architecture-independent build tool; riscv64 CMake binaries are packaged natively in Debian, Ubuntu, and Alpine | N/A | Distro-packaged on riscv64 across all major distros | None identified |
| Ninja | build-dependency | optional | Architecture-independent build tool; riscv64 Ninja binaries are packaged natively in Debian, Ubuntu, and Alpine | N/A | Distro-packaged on riscv64 across all major distros | None identified |
| GCC | build-dependency | critical | riscv64 target upstream in GCC; GCC 13+ specifically required for Highway's RVV intrinsic compilation | GCC's own riscv64 bootstrap/test coverage is maintained upstream, independent of libjxl | riscv64 cross and native GCC toolchains distro-packaged (Debian, Ubuntu, Alpine) | GCC 15 EMU128 compiler bug tracked in [highway#2793](https://github.com/google/highway/issues/2793), closed as of this research date |
| LLVM | build-dependency | critical | riscv64 backend upstream in LLVM/Clang; Clang 16+ required for RVV intrinsics, Clang 19+ required for RVV runtime dispatch and to avoid the `-mrelax-all` crash | LLVM's own riscv64 test coverage is maintained upstream, independent of libjxl | riscv64-targeting Clang/LLVM distro-packaged (Debian, Ubuntu, Alpine) | Clang 20 `rvv-inl.h` compile error tracked in [highway#2554](https://github.com/google/highway/issues/2554), closed as of this research date |

### 9.2 Deep dive: Highway (critical dependency)

Highway is the single most consequential dependency for riscv64 performance in libjxl. Highway v1.4.0 (April 2026) is current upstream; libjxl remains pinned to v1.2.0 (May 2024). This version gap is the primary riscv64 performance blocker in the entire dependency tree.

**Highway riscv64 issue status, checked 2026-09-30 (three of four previously open issues have since closed):**

| Issue | Title | Current state |
|---|---|---|
| [#2793](https://github.com/google/highway/issues/2793) | riscv64/GCC15 EMU128 `TestAllReorderDemote2To` failure | Closed |
| [#2738](https://github.com/google/highway/issues/2738) | `-march rv64gcv1p0` too restrictive for RVA23 | Closed |
| [#2554](https://github.com/google/highway/issues/2554) | Clang 20 `rvv-inl.h` compile error | Closed |
| [#3251](https://github.com/google/highway/issues/3251) | Issues building highway on riscv64 (opened 2026-08-06) | Closed |
| [#2854](https://github.com/google/highway/issues/2854) | mold-linker corrupts `.riscv.attributes` ISA string on riscv64 | **Still open**, the one live blocker; workaround is to use the default `ld` linker instead of `mold` |

This is a positive signal for Highway's own riscv64 build/test stability, though it does not change the core finding for libjxl: the v1.2.0 pin still blocks RVV runtime dispatch regardless of how many Highway-side riscv64 bugs are closed, since [PR #2968](https://github.com/google/highway/pull/2968) (RVV runtime dispatch re-enable, merged 2026-04-07) postdates the pin and has not been pulled in. [PR #2704](https://github.com/google/highway/pull/2704) (VQSORT enabled for RISC-V, merged 2025-09-12) is likewise not yet consumed by libjxl. Highway's own CI uses QEMU for RISC-V testing; libjxl's CI does not.

### 9.3 Allocator (not a build dependency on riscv64)

`gperftools`/`tcmalloc` is an optional allocator that libjxl's own CMake explicitly disables for non-x86_64 architectures via a `JPEGXL_ENABLE_TCMALLOC` condition. riscv64 never invokes this dependency; it is not part of the Section 9.1 table because it carries no riscv64-relevant status.

## 11. Known Bugs and Active Issues

**Issues in libjxl/libjxl:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1283](https://github.com/libjxl/libjxl/issues/1283) | build problem on riscv64, undefined reference to `__atomic_fetch_or_1` | Closed | Build blocker (resolved) | Fixed by PRs #1128 and #1166, shipped in v0.7.0 |
| [#1788](https://github.com/libjxl/libjxl/issues/1788) | `JxlTest.RoundtripLargeFast` size assertion failure on non-x86 | Closed | Test failure (resolved) | Affected ppc64el, riscv64, ia64; fixed in commit `bb8eac5d6` |

No open riscv64-specific correctness bugs exist in libjxl as of 2026-09-30.

**Issues in google/highway (the dependency blocking riscv64 performance in libjxl):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#2793](https://github.com/google/highway/issues/2793) | EMU128 test failure on riscv64 + GCC 15 | Closed | Test failure (resolved) | Root-caused to GCC bug [gcc#122692](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=122692) |
| [#2738](https://github.com/google/highway/issues/2738) | `-march rv64gcv1p0` too restrictive for RVA23 platforms | Closed | Build/performance (resolved) | Was causing LTO link failures under GCC 15.2, GCC bug [gcc#110812](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812) |
| [#2554](https://github.com/google/highway/issues/2554) | Clang 20 `rvv-inl.h` compile error | Closed | Build blocker (resolved) | Previously flagged as believed-fixed with tracker still open; now closed |
| [#3251](https://github.com/google/highway/issues/3251) | Issues building highway on riscv64 | Closed | Build blocker (resolved) | Opened 2026-08-06, closed by this research date |
| [#2854](https://github.com/google/highway/issues/2854) | mold linker crash on riscv64 | **Open** | Build blocker (workaround available) | Corrupted `.riscv.attributes` ISA string on link; workaround is to use `ld` instead of `mold` |

## 12. Objections and Upstream Blockers

**No stated objections.** Every substantive riscv64 build-fix PR submitted to libjxl has been merged by the Google/Cloudinary maintainer team. PR #1429 (the `JXL_ARCH_RISCV64` macro) was declined only as unnecessary, since riscv64 already built correctly through the incremental atomics and compiler-flag fixes, not out of objection to riscv64 support in principle.

**PR merge latency:** PR #3826 was open for nearly a year (September 2024 to August 2025) before merge, and its `merge-0.11` backport label was never actually acted on (see Section 2). This reflects general low bandwidth from the core team for non-critical fixes rather than a riscv64-specific pattern; riscv64 work submitted upstream should expect multi-month review cycles and should not assume a stated backport label will be honored without follow-up verification.

**Technical blockers:**

1. Highway v1.2.0 pin: libjxl cannot use Highway RVV runtime dispatch until it upgrades past the point where [PR #2968](https://github.com/google/highway/pull/2968) landed. An open bot PR ([#2269](https://github.com/libjxl/libjxl/pull/2269)) tracks the version bump, no maintainer has committed to a timeline.
2. RVV disabled by policy, not just by pin: commit `3199321b` (2022-07-05) explicitly moved RVV to `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT`, and this has not been revisited in over three years even as Highway's own RVV correctness has improved.
3. `enc_fast_lossless.cc` scalar path: adding an RVV backend requires writing manual RVV intrinsics in a file that already has three hand-written SIMD backends; there is no existing infrastructure for this in libjxl, it is a green-field effort.
4. No CI: without riscv64 CI, contributed riscv64 code regresses silently. CI is a prerequisite for sustained maintenance of any riscv64 work.

**Acceptance probability for contributions:** high for build fixes, demonstrated by five merged riscv64 build/portability PRs since 2022. Moderate for CI additions, a QEMU-based template already exists for s390x in `build_test_emu.yml`, and adding riscv64 to that matrix is a small diff. Low for an `enc_fast_lossless.cc` RVV backend without a champion from the core team, given the file's complexity and the team's demonstrated review bandwidth.

## 13. Readiness Assessment

**Color:** Yellow (clean-distro-build)

**Release provider:** distro

libjxl has zero riscv64 CI upstream, confirmed by reading all 17 workflow files in `.github/workflows/` plus confirming no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist; no job builds, tests, or targets riscv64 anywhere (see [libjxl CI workflows](https://github.com/libjxl/libjxl/tree/main/.github/workflows)). Applying the distribution floor, Debian sid/unstable, Ubuntu (noble and resolute/26.04, via the `ports` archive), and Alpine v3.20 all ship riscv64 builds of libjxl (0.11.x), and the only riscv-aware code involved (`cmake/FindAtomics.cmake`'s `-latomic` detection, the clang `-mrelax-all` skip) is already upstream source, not a distro-applied patch, e.g. [libjxl0.11 riscv64 in Debian sid](https://packages.debian.org/sid/riscv64/libjxl0.11/download) shows a generic, unpatched build. That makes it a clean (unpatched) distro build with no upstream CI, i.e. yellow (clean-distro-build), not orange. libjxl is a codec/format implementation (JPEG XL), not a speed-differentiated optimization library, so no optimization-level modifier applies, it is graded like libpng or zlib in this model, not like Highway or an allocator.

**Pending work that could change this grade:** open bot PR [#2269](https://github.com/libjxl/libjxl/pull/2269) tracks bumping libjxl's bundled Highway dependency past the v1.2.0 pin (relevant to future RVV/SIMD performance, not to this CI/distro-based grade). GitHub release-asset riscv64 status could not be directly re-verified via API in this round (GitHub API access to libjxl/libjxl was blocked in-session, HTTP 403/429), though a direct page-render check of v0.12.0's assets found none referencing riscv64, consistent with the `release_provider: distro` classification. No open riscv64-specific correctness issues exist in libjxl/libjxl, both #1283 and #1788 are closed and resolved.

## 14. Investment Analysis

RISE has no documented prior investment in libjxl (see Section 1). No RISE-funded work needs to be excluded from the sizing below.

### 14.1 Functional Enablement

libjxl already builds and produces correct output on riscv64. No functional gaps exist. No work is required here.

### 14.2 Performance Optimization

**Item 1: Highway upgrade (high leverage, prerequisite for everything else).** Update libjxl's Highway submodule pin from v1.2.0 to v1.4.0+, via or alongside the already-open bot PR #2269. This enables Highway RVV runtime dispatch for Clang 19+ and pulls in VQSORT for RISC-V ([PR #2704](https://github.com/google/highway/pull/2704)). Requires verifying no amd64/arm64 regressions from the intervening Highway API changes, updating `CMakeLists.txt` for any API changes, and reconsidering `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT`'s RVV entry. Estimated effort: 1-2 person-weeks, mostly regression testing across all CI targets.

**Item 2: `enc_fast_lossless.cc` RVV backend (high effort, high impact).** The fast lossless encoder is the dominant performance path for lossless JPEG XL and has zero riscv64 dispatch branch today. Writing an RVV backend requires implementing the equivalent of the existing AVX2/NEON backends using RVV 1.0 intrinsics in a self-contained, Highway-independent file. Estimated effort: 6-10 person-weeks, covering profiling, intrinsics implementation, correctness testing, and performance tuning across RVA22/RVA23 hardware profiles. This is the highest-impact single performance investment identified.

**Item 3: Enable RVV by default for riscv64 builds (low effort, moderate impact).** Reverse commit `3199321b`'s off-by-default policy for riscv64 targets specifically, for example by conditioning `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT` on `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv"` and toolchain capability. A small CMake change with associated testing; depends on Item 1. Estimated effort: 0.5 person-weeks.

### 14.3 CI/CD Infrastructure

**Item 4: Add a riscv64 QEMU CI job.** `build_test_emu.yml` already runs s390x via QEMU/Docker multiarch. Adding riscv64 requires adding `linux/riscv64` to the matrix; `multiarch/qemu-user-static` has supported riscv64 since 2023. This would catch build regressions before they reach Debian or Ubuntu's ports archive. Full test execution under QEMU will be slow (roughly 10-30x native); a compile-only job, analogous to the s390x compile-only leg in `build_test_cross.yml`, is a lower-cost alternative. Estimated effort: 1-2 person-weeks, covering CI configuration, fixing any test failures QEMU surfaces, and getting an upstream PR merged given the team's demonstrated multi-month review latency.

### 14.4 Ecosystem Enablement

Not applicable. libjxl has no significant dependent package ecosystem requiring separate riscv64 enablement, no PyPI package exists under this name, and there is no npm or Maven distribution to track. Section 10 is omitted accordingly.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Upgrade Highway pin to v1.4.0+ (align with PR #2269) | 1-2 | RISE contributor | Critical |
| Performance | Enable RVV by default for riscv64 in CMake | 0.5 | RISE contributor | High |
| Performance | RVV backend for `enc_fast_lossless.cc` | 6-10 | RISE contributor | High |
| CI/CD | Add riscv64 QEMU job to `build_test_emu.yml` | 1-2 | RISE contributor | High |

## 15. References

- [libjxl/libjxl repository](https://github.com/libjxl/libjxl)
- [JPEG XL homepage](https://jpeg.org/jpegxl/)
- [libjxl CI workflows directory](https://github.com/libjxl/libjxl/tree/main/.github/workflows)
- [Issue #1283, build problem on riscv64: undefined reference to __atomic_fetch_or_1](https://github.com/libjxl/libjxl/issues/1283)
- [Issue #1788, RoundtripLargeFast size assertion failure on ppc64el/riscv64/ia64](https://github.com/libjxl/libjxl/issues/1788)
- [PR #1128, libjxl implementation rely on c11 atomics (cache_aligned.cc)](https://github.com/libjxl/libjxl/pull/1128)
- [PR #1128 merge commit](https://github.com/libjxl/libjxl/commit/87fe7c16e1fb2e21b6a1dca26782950ae1559d99)
- [PR #1166, Pthread dependencies](https://github.com/libjxl/libjxl/pull/1166)
- [PR #1166 merge commit (fde214c)](https://github.com/libjxl/libjxl/commit/fde214c5f4dc5ffd0360401a68df33182edf9226)
- [PR #1429, Add support for 64-bit RISC-V arch (closed without merge)](https://github.com/libjxl/libjxl/pull/1429)
- [PR #1611, Preparation for SVE/RVV: fix static_assert](https://github.com/libjxl/libjxl/pull/1611)
- [PR #1642, Fix typo in build file; should fix sve/rvv build with gcc](https://github.com/libjxl/libjxl/pull/1642)
- [Commit 3199321b, Disable SVE and RVV HWY targets](https://github.com/libjxl/libjxl/commit/3199321b)
- [PR #2211, Add missing <atomic> content to fix gcc compilation for RISCV architecture](https://github.com/libjxl/libjxl/pull/2211)
- [PR #2211 merge commit](https://github.com/libjxl/libjxl/commit/22d12d74e7bc56b09cfb1973aa89ec8d714fa3fc)
- [PR #2269, Highway version bump tracking (open)](https://github.com/libjxl/libjxl/pull/2269)
- [PR #3826, cmake: Do not use -mrelax-all with clang on RISCV64](https://github.com/libjxl/libjxl/pull/3826)
- [PR #3826 merge commit (192294e1)](https://github.com/libjxl/libjxl/commit/192294e15e1d27660d887bc3b9b5ead8e5aa6a93)
- [libjxl v0.7.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.7.0)
- [libjxl v0.9.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.9.0)
- [libjxl v0.11.2 release](https://github.com/libjxl/libjxl/releases/tag/v0.11.2)
- [libjxl v0.12.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.12.0)
- [libjxl-dev 0.11.2-5 in Debian sid](https://packages.debian.org/sid/libjxl-dev)
- [libjxl0.11 riscv64 in Debian sid](https://packages.debian.org/sid/riscv64/libjxl0.11/download)
- [libjxl0.7 0.7.0-10.2ubuntu6 in Ubuntu 24.04 Noble](https://packages.ubuntu.com/noble/libjxl0.7)
- [libjxl-tools riscv64 in Alpine v3.20 community](https://pkgs.alpinelinux.org/package/v3.20/community/riscv64/libjxl-tools)
- [archriscv.felixc.at, Arch Linux RISC-V unofficial port](https://archriscv.felixc.at)
- [PyPI libjxl JSON API (404, no such package)](https://pypi.org/pypi/libjxl/json)
- [google/highway repository](https://github.com/google/highway)
- [google/highway PR #2968, RVV runtime dispatch re-enabled for Clang 19+](https://github.com/google/highway/pull/2968)
- [google/highway PR #2704, VQSORT enabled for RISC-V](https://github.com/google/highway/pull/2704)
- [google/highway issue #2793, EMU128 test failure on riscv64 + GCC 15 (closed)](https://github.com/google/highway/issues/2793)
- [google/highway issue #2738, -march rv64gcv1p0 too restrictive for RVA23 (closed)](https://github.com/google/highway/issues/2738)
- [google/highway issue #2554, Clang 20 rvv-inl.h compile error (closed)](https://github.com/google/highway/issues/2554)
- [google/highway issue #3251, Issues building highway on riscv64 (closed)](https://github.com/google/highway/issues/3251)
- [google/highway issue #2854, mold linker crash on riscv64 (open)](https://github.com/google/highway/issues/2854)
- [google/googletest issue #3756, GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [GCC bug #122692, EMU128 mis-compilation on riscv64 GCC 15](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=122692)
- [GCC bug #110812, LTO mixed march flags failure](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812)
- [RISE project website](https://riseproject.dev)
- [RISE blog sitemap (all posts)](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev python-wheels repository](https://github.com/riseproject-dev/python-wheels)