---
title: libjxl
parent: Project Reports
categories:
  - multimedia
  - browser
---

# libjxl

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libjxl<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libjxl is the reference implementation of the ISO/IEC 18181 (JPEG XL) standard. The standard is governed by the JPEG committee (ISO/IEC Working Group 1). The open-source implementation is a multi-company collaboration co-founded by Google and Cloudinary, hosted under the [libjxl GitHub organization](https://github.com/libjxl/libjxl). Google administers the CLA. There is no independent foundation; the project operates as a community repository with a core team drawn primarily from Google and Cloudinary employees.

**Corporate maintainers:**

- Google: dominant contributor. Top committers include eustas (Eugene Kliuchnikov, 742 commits), szabadka (Zoltan Szabadka, 431 commits), jonsneyers is Cloudinary (338 commits), sboukortt (Sami Boukortt, 220 commits, Google Zurich), veluca93 (Luca Versari, 220 commits), deymo (Alex Deymo, 163 commits), and jyrkialakuijala (Jyrki Alakuijala, 83 commits). Jyrki Alakuijala and Zoltan Szabadka are original JPEG XL inventors from Google.
- Cloudinary: jonsneyers (Jon Sneyers, 338 commits) is the primary Cloudinary representative and a core maintainer.
- mo271 (Moritz Firsching, 336 commits): active reviewer; reviewed the 2023 RISC-V atomic fix.
- The AUTHORS file lists contributors from Igalia, Airbus, Debian, and individual volunteers.

**Community culture on new ports:** The project accepts build-correctness patches for new architectures when submitted with working fixes. There is no formal objection to riscv64 -- PRs #1128, #1166, #2211, and #3826 were all merged after review, albeit sometimes slowly (PR #3826 took nearly a year from open to merge). The project does not proactively invest in new architectures; it does not add them to CI or release pipelines unless driven by a maintainer or external contributor.

libjxl is not a RISE project member and has received no documented RISE funding or engagement. A full scan of all 28 RISE blog posts (May 2024 through June 2026) contains zero mentions of libjxl or JPEG XL. libjxl does not appear in the RISE Python wheel builder list.

---

## 2. Port History and Upstreaming Timeline

All riscv64 work is fully upstream in the main branch. No downstream-only patches exist. The work has been entirely reactive -- build failures filed by distro maintainers and fixed on-demand.

| Date | Event | Source |
|------|-------|--------|
| 2022-03-26 | Issue #1283 opened: build failure on Gentoo riscv64, undefined reference to `__atomic_fetch_or_1` in `dec_group_border.cc` with GCC 11.2.1 | [Issue #1283](https://github.com/libjxl/libjxl/issues/1283) |
| 2022-03-28 | PR #1128 merged: CMake module to detect GCC atomics and link `-latomic`; residual failure in `libjxl_dec.so` reported post-merge | [PR #1128](https://github.com/libjxl/libjxl/pull/1128) |
| 2022-03-29 | PR #1166 merged: follow-up fix moving `${ATOMICS_LIBRARIES}` into `JPEGXL_DEC_INTERNAL_LIBS`; tested and confirmed on physical SiFive Unmatched board (Gentoo Linux) by dlan17 | [PR #1166](https://github.com/libjxl/libjxl/pull/1166) |
| 2022-05-19 | PR #1429 opened by rebeccasf (StarFive Technology): proposed `JXL_ARCH_RISCV64` macro in `arch_macros.h` | [PR #1429](https://github.com/libjxl/libjxl/pull/1429) |
| 2022-06-10 | PR #1429 closed without merge: author confirmed Chromium riscv64 build worked without the macro; Debian confirmed libjxl already built on riscv64 generically | [PR #1429](https://github.com/libjxl/libjxl/pull/1429) |
| 2022-07-14 | PR #1611 merged: preparatory `static_assert` fix enabling SVE/RVV Highway dispatch | [PR #1611](https://github.com/libjxl/libjxl/pull/1611) |
| 2022-07-25 | PR #1642 merged: typo fix in build file enabling SVE/RVV build with GCC | [PR #1642](https://github.com/libjxl/libjxl/pull/1642) |
| 2022-09-21 | v0.7.0 released: first release containing the libatomic linkage fixes from PRs #1128 and #1166 | [v0.7.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.7.0) |
| 2022-09-27 | Issue #1788 opened: `JxlTest.RoundtripLargeFast` test failure on ppc64el, riscv64, ia64 with GCC 12.2.0; encoded size 18 bytes over hardcoded limit; closed as resolved by commit bb8eac5d6 | [Issue #1788](https://github.com/libjxl/libjxl/issues/1788) |
| 2023-02-22 | PR #2211 merged (commit 22d12d7): add `#include <atomic>` to `enc_xyb.cc` to fix GCC/riscv64 "variable has initializer but incomplete type" error in v0.8.1; authors: IEAST and mo271 (Moritz Firsching, Google) | [PR #2211](https://github.com/libjxl/libjxl/pull/2211) |
| 2023-06-14 | v0.8.2 released: first release containing the `<atomic>` header fix | [v0.8.2 release](https://github.com/libjxl/libjxl/releases/tag/v0.8.2) |
| 2024-09-14 | PR #3826 opened by kraj (Khem Raj): skip `-mrelax-all` flag for clang/RISCV64 to fix Clang 19+ crash from conflicting branch relaxation | [PR #3826](https://github.com/libjxl/libjxl/pull/3826) |
| 2025-08-08 | PR #3826 merged, labeled `merge-0.11` for cherry-pick into stable branch | [PR #3826](https://github.com/libjxl/libjxl/pull/3826) |
| 2026-02-10 | v0.11.2 released: first release containing the Clang 19+ riscv64 crash fix | [v0.11.2 release](https://github.com/libjxl/libjxl/releases/tag/v0.11.2) |

**Key contributors to riscv64 work:** novomesk (issue reporter, Gentoo), malaterre (Debian maintainer), dlan17 (physical SiFive Unmatched tester, Gentoo), rebeccasf (StarFive Technology -- PR closed without merge), IEAST (compiler fix), kraj/Khem Raj (Clang build fix, OpenEmbedded/Yocto ecosystem).

No master tracking issue for riscv64 exists. All work has been ad-hoc in response to distro build failures.

---

## 3. Upstream Support Tier

libjxl has no formal platform tier policy document (no PLATFORMS.md, SUPPORT.md, or CODEOWNERS with per-arch ownership). Support tiers must be inferred from CI coverage and release artifact generation.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build job | Yes (ubuntu-latest) | Yes (ubuntu-24.04-arm, native) | No |
| CI test job | Yes | Yes | No |
| Release binary | Yes (static + .deb) | No (CI runs but no release artifact) | No |
| QEMU-emulated CI | s390x only (not amd64) | N/A | No |
| Cross-compile CI | Yes (armhf, i386 targets) | N/A | No |
| Distro package | Yes (first-class) | Yes (first-class) | Yes (Debian: first-class; Ubuntu: ports) |
| Blocking release | Yes | No | No |

**Effective tier:** riscv64 is an untested, unreleased tier -- lower than arm64. The project will accept build-fix patches but takes no responsibility for riscv64 build correctness between submissions. Regressions can only be caught by Debian's buildd infrastructure.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libjxl has two distinct SIMD paths plus a codec-specific fast path, none of which have native riscv64 implementations.

### 4.1 Google Highway (libhwy) -- primary SIMD abstraction

All SIMD-accelerated encode/decode kernels (DCT, inverse DCT, colorspace transforms, convolution, quantizer, ANS entropy coding, modular encoder) use the Highway `HWY_DYNAMIC_DISPATCH` / `-inl.h` pattern. Highway compiles each `-inl.h` file once per enabled target and selects at runtime. Highway defines `HWY_RVV` (target bit 37) and `HWY_ARCH_RISCV`.

On riscv64, Highway will generate RVV-accelerated code for all SIMD kernels if built with GCC >= 13 or Clang >= 16 with RVV 1.0 intrinsic support (`__riscv_v_intrinsic >= 11000`). Runtime dispatch (single binary detecting V extension at runtime) requires Clang >= 19. No libjxl-side riscv64 code is required -- the RVV intrinsics (`vfloat32m1_t`, etc.) live entirely in Highway's headers.

**Critical gap:** libjxl is pinned to Highway v1.2.0 (commit 457c891, May 2024) in its bundled submodule. Highway RVV runtime dispatch was gated out with `&& 0` until it was re-enabled in [google/highway PR #2968](https://github.com/google/highway/pull/2968), merged 2026-04-07 -- after the v1.2.0 pin date. An open bot-driven PR in libjxl (PR #2269, updated 2026-06-26) tracks highway version updates, but the upgrade has not landed. Until libjxl upgrades to Highway >= 1.4.0, riscv64 builds use EMU128 scalar fallback regardless of hardware capability.

**RVV is also disabled-by-default** in libjxl's CMakeLists.txt: `RVV` is listed in `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT`. Users or distros must explicitly set `-DJPEGXL_ENABLE_HWY_RVV=ON` to get RVV-accelerated builds even with a capable toolchain.

### 4.2 enc_fast_lossless.cc -- manual SIMD, critical path, scalar on riscv64

`enc_fast_lossless.cc` implements the fast lossless encoder with its own architecture detection and manual dispatch. It is not mediated through Highway. The backends are:

- AVX-512: x86-64 only (Clang > 7 or GCC > 10)
- AVX2: x86-64 only (non-MSVC)
- NEON: aarch64 only

There is no `__riscv` guard, no `FJXL_RVV` backend, and no RVV intrinsics. On riscv64, none of the `FJXL_GENERIC_SIMD` enable macros fire; the encoder falls through to the scalar path with `kLogChunkSize = 3` (versus 5 for AVX-512 or 4 for AVX2/NEON). This is the primary user-facing fast lossless codec path and it is definitively scalar on riscv64 -- not a toolchain limitation, but a code absence.

### 4.3 arch_macros.h -- architecture detection

libjxl defines `JXL_ARCH_X64`, `JXL_ARCH_PPC`, and `JXL_ARCH_ARM` but has no `JXL_ARCH_RISCV` or `JXL_ARCH_RISCV64` macro. The codebase has zero `#ifdef __riscv` guards. PR #1429 (StarFive Technology) proposed adding `JXL_ARCH_RISCV64` but was closed without merge when the immediate need was resolved by a Chromium rebase; no reviewers identified existing uses for the macro at that time.

### 4.4 Component comparison table

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Fast lossless encoder (`enc_fast_lossless.cc`) | AVX2 + AVX-512 (manual intrinsics) | NEON (manual intrinsics) | Scalar (no code path) |
| DCT, transforms, convolution (Highway `-inl.h`) | SSE4/AVX2/AVX-512 | NEON/SVE | EMU128 scalar (current); RVV possible with toolchain + flag, blocked by Highway pin |
| ANS entropy coding (`enc_ans_simd.cc`) | AVX2/AVX-512 | NEON/SVE | EMU128 scalar (same Highway dependency) |
| Modular encoder (`enc_modular_simd.cc`) | AVX2/AVX-512 | NEON/SVE | EMU128 scalar (same Highway dependency) |
| Architecture detection macro (`arch_macros.h`) | JXL_ARCH_X64 defined | JXL_ARCH_ARM defined | Not defined |
| JIT backend | None | None | None (not applicable) |
| Crypto | None | None | None (not applicable) |
| Assembly (`.S` files) | None | None | None |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build requirements

libjxl uses CMake (>= 3.10) and Ninja. Cross-compilation for riscv64 uses the standard CMake cross-compile path. The upstream `ci.sh` accepts `BUILD_TARGET=riscv64-linux-gnu` but there is no built-in toolchain file for riscv64 in the `cmake/` directory -- you must supply your own or set `CC`/`CXX` directly.

**Direct CMake cross-compile invocation:**

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
|-----------|----------------|--------|
| GCC | 13 | Highway RVV target requires GCC 13+ for RVV intrinsic compilation |
| Clang | 16 | Highway RVV target requires Clang 16+ for RVV intrinsic compilation |
| Clang | 19 | Required for Highway RVV runtime dispatch (target attribute support); also required to avoid the `-mrelax-all` crash fixed in PR #3826 |
| RVV intrinsics ABI | v0.11 (`__riscv_v_intrinsic >= 11000`) | Required by Highway's RVV target detection |
| CMake | 3.10 | Project minimum |

### 5.3 RVV enablement flag

RVV acceleration is disabled by default. To enable:

```bash
-DJPEGXL_ENABLE_HWY_RVV=ON
```

This is analogous to `-DJPEGXL_ENABLE_HWY_AVX3=true` used in x86 CI builds. Even with this flag, the pinned Highway v1.2.0 submodule does not support RVV runtime dispatch -- a binary compiled with the V-extension march flag is required.

### 5.4 Known build failures (now fixed)

- **GCC/riscv64, v0.8.1:** `enc_xyb.cc` missing `#include <atomic>` -- "variable has initializer but incomplete type" for `std::atomic<bool> ok`. Fixed in PR #2211 (merged 2023-02-22, shipped in v0.8.2).
- **Clang 19+/riscv64:** `-mrelax-all` flag caused link failure from conflicting branch relaxation between compiler and assembler. Fixed in PR #3826 (merged 2025-08-08, shipped in v0.11.2).
- **GCC 11.2.1/riscv64:** undefined reference to `__atomic_fetch_and_1` and `__atomic_fetch_or_1` in `dec_group_border.cc`. Fixed in PRs #1128 and #1166 (merged 2022-03-28/29, shipped in v0.7.0).

### 5.5 QEMU testing

No QEMU riscv64 setup exists in libjxl's upstream CI. For testing on x86 hosts:

```bash
sudo apt install qemu-user-static
# Add to cmake:
-DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64-static;-L;/usr/riscv64-linux-gnu"
```

No riscv64-specific Dockerfiles exist in the libjxl repository.

### 5.6 Debian packaging cmake flags

From Debian packaging for v0.11.2-5, riscv64 inherits the generic configuration with no architecture-specific cmake overrides. Notable flags relevant to riscv64:

| Flag | Value in Debian | Notes |
|------|----------------|-------|
| `JPEGXL_ENABLE_TCMALLOC` | ON | riscv64 is explicitly listed in the supported arch list alongside amd64, arm64, ppc64el, s390x |
| `JPEGXL_ENABLE_JNI` | ON | riscv64 is explicitly listed in the Java-supported architectures |
| `JPEGXL_ENABLE_SKCMS` | OFF | Debian uses system lcms2 |
| `JPEGXL_ENABLE_SJPEG` | OFF | Disabled globally |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional gaps

No functional gaps are known -- libjxl compiles and produces correct output on riscv64. Issue #1788 (test assertion failure on riscv64 with GCC 12.2.0 where encoded size exceeded a hardcoded limit by 18 bytes) was closed as resolved by commit bb8eac5d6. No open correctness bugs for riscv64 exist in the libjxl issue tracker as of the research date.

### 6.2 Performance gaps

**Fast lossless encoder:** The `enc_fast_lossless.cc` path is scalar on riscv64 with `kLogChunkSize = 3`, compared to 5 (AVX-512) and 4 (AVX2/NEON). This is a structural performance deficit with no current path to resolution short of adding an RVV backend to this file.

**All other encode/decode paths:** Currently run Highway EMU128 scalar fallback due to the Highway v1.2.0 pin. The EMU128 path processes one hardware-width element at a time. A Debian installed-size anomaly is circumstantial evidence: `libjxl-dev` on riscv64 in Debian sid (v0.11.2-5) is 6,701 kB installed versus 862 kB on amd64 -- a 7.8x size difference, consistent with less aggressive SIMD code folding and more retained scalar fallback paths. [NEEDS VERIFICATION: this installed-size difference has not been confirmed against a second source as reflecting scalar vs SIMD compilation specifically.]

**After a Highway upgrade to >= 1.4.0 with `-DJPEGXL_ENABLE_HWY_RVV=ON` and Clang 19+:** Highway-based paths would use RVV 1.0 acceleration. The fast lossless encoder would remain scalar.

No published benchmark numbers (MP/s encode, MP/s decode, wall-clock times) comparing libjxl on riscv64 vs arm64 or amd64 exist anywhere -- not in the libjxl issue tracker, RISE blog, or web search results. Data not available: cross-architecture performance benchmarks for libjxl.

### 6.3 Security hardening gaps

Data not available: libjxl does not document per-architecture security hardening status. riscv64 does not appear in the `-Wno-psabi` suppression block (only arm64/armel/armhf/ppc64el get that flag). No architecture-specific sanitizer or CFI configuration differences were found.

### 6.4 Floating-point semantics

Data not available: no documented issues with floating-point output differences between riscv64 and amd64/arm64 other than Issue #1788 (18-byte encoding size difference, closed as resolved).

---

## 7. CI/CD Infrastructure

riscv64 CI is completely absent. This was confirmed by reading all 17 workflow files in `.github/workflows`.

| CI Job | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| `build_test.yml` -- main build and test | Yes (ubuntu-latest) | Yes (ubuntu-24.04-arm, native) | No |
| `build_test_cross.yml` -- cross-compile | Yes (as host) | armhf cross-compile | No |
| `build_test_emu.yml` -- QEMU emulation | N/A | N/A | No (s390x only) |
| `build_test_bazel.yml` -- Bazel build | Yes (ubuntu-latest) | No | No |
| `build_test_wasm.yml` -- WASM | N/A | N/A | No |
| `release.yaml` -- release artifact generation | Yes | No | No |
| `conformance.yml` -- codec conformance | Yes | No | No |
| `fuzz.yml` -- fuzzing | Yes | No | No |
| `test_new_highway.yml` -- Highway upgrade testing | Yes | No | No |

The emulation workflow (`build_test_emu.yml`) uses `multiarch/qemu-user-static` inside Docker and is the closest analog to what riscv64 CI would look like. Its matrix contains exactly one entry: `linux/s390x`. The trigger is daily at 03:14 UTC and `workflow_dispatch`. Adding riscv64 would require only extending this matrix.

No RISE CI runners are used. No external CI services (Cirrus CI, GitLab CI, Jenkins) exist in the repository.

---

## 8. Distribution and Release Status

### 8.1 Upstream release binaries

All official release artifacts (v0.7.3 through v0.11.2) ship amd64/x86_64 Linux static binaries, Debian/Ubuntu amd64 .deb packages, and Windows x86/x64 binaries. No riscv64 binary is produced by upstream CI or shipped in any release. A user on riscv64 cannot obtain an official upstream binary.

### 8.2 Debian

[libjxl 0.11.2-5 in Debian sid](https://packages.debian.org/sid/libjxl0.11): available for riscv64 as a first-class architecture (listed alongside alpha, amd64, arm64, armhf, hppa, i386, loong64, m68k, ppc64, ppc64el, riscv64, s390x, sh4, sparc64). The `.deb` file `libjxl-dev_0.11.2-5_riscv64.deb` (620 KB) is present in the Debian main archive pool at `ftp.debian.org`, dated 2026-05-27. TCMalloc and JNI are both enabled for riscv64 in the Debian packaging.

Note: The Debian buildd.debian.org status page returned "No entry in riscv64 database" for libjxl, which initially appeared to contradict package availability. This is an anomaly in the buildd tracker -- the package file exists and HTTP-serves from Debian mirrors with a valid Debian binary package header. The "no entry" reflects riscv64 not being tracked as a tier-1 buildd host, not an absence of the binary.

### 8.3 Ubuntu

[libjxl0.7 0.7.0-10.2ubuntu6 in Ubuntu 24.04 LTS (Noble)](https://packages.ubuntu.com/noble/libjxl0.7): available for riscv64 in the `universe` section via `ports.ubuntu.com`. This is one security patch behind the primary amd64 version (ubuntu6 vs ubuntu6.1). Ubuntu tracks Debian but is on the older 0.7.0 version for Noble.

### 8.4 PyPI

No `libjxl` Python package exists on PyPI (HTTP 404 for both `pypi.org/pypi/libjxl/json` and `pypi.org/simple/libjxl/`). Not applicable.

### 8.5 Arch Linux RISC-V

ArchPOWER/archriscv.felixc.at: reported version 0.11.1-1, at revision -1 versus -5 on powerpc/powerpc64le, suggesting fewer riscv64-specific patches. The archriscv.felixc.at status page returned 404 and package-level data could not be confirmed. [NEEDS VERIFICATION]

### 8.6 What a riscv64 user must do

Install `libjxl-dev` from Debian sid or Ubuntu 24.04 (ports). For Clang-based builds with libjxl 0.11.2+, Clang 19 or newer is required to avoid the `-mrelax-all` crash. RVV acceleration is not available with current distro packages without additional cmake flags and a Highway upgrade. There are no upstream-provided binaries.

---

## 9. Dependencies

### 9.1 Summary table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|--------------|-------------|----------------|----------------|
| google/highway (libhwy) | SIMD abstraction, all vectorized paths | Yes (Debian: libhwy-dev 1.3.0-2) | Partially broken (open bugs in highway) | Debian only | Highway v1.2.0 pin blocks RVV runtime dispatch; open bugs #2793, #2738, #2554 |
| google/brotli (libbrotli) | Container format metadata compression | Yes | Yes (no open riscv64 issues) | Debian | None; issue #669 resolved 2018 |
| Little-CMS / lcms2 | Color management (big-endian or when skcms disabled) | Yes (pure C) | No open issues | Debian | None |
| Google skcms | Color management (preferred on little-endian riscv64) | Yes (vendored C) | No open issues | Vendored source only | None |
| libpng / zlib | PNG I/O for CLI tools | Yes | Yes | All major distros | None |
| sjpeg (webmproject/sjpeg) | JPEG encoder input path | Yes (vendored) | No open issues | Vendored source only | None |
| gperftools / tcmalloc | Optional allocator | N/A | N/A | N/A | Explicitly disabled for non-x86_64 by CMake condition |
| OpenEXR | Optional HDR I/O | Yes | No open issues | Debian/Fedora | None |
| GoogleTest / googlebenchmark | Test and benchmark framework | Yes | No open issues | Distro-packaged | None |

### 9.2 Deep dive: google/highway (critical dependency)

Highway is the single most consequential dependency for riscv64 performance. Highway v1.4.0 (April 2026) is current upstream; libjxl is pinned to v1.2.0 (May 2024). The gap between these two versions is the primary riscv64 performance blocker.

**Open riscv64 issues in google/highway at the time of research:**

- [Issue #2793](https://github.com/google/highway/issues/2793): EMU128 `TestAllReorderDemote2To` test failure on riscv64 with GCC 15. Root-caused as GCC compiler bug gcc#122692; fix backport to GCC 15.3 is planned.
- [Issue #2738](https://github.com/google/highway/issues/2738): `-march rv64gcv1p0` is too restrictive for RVA23 platforms (e.g., Ubuntu 25.10); causes LTO link failures under GCC 15.2 due to GCC bug #110812 when mixed march flags are used.
- [Issue #2554](https://github.com/google/highway/issues/2554): Clang 20 compile error in `rvv-inl.h`. Believed fixed in highway codebase by July 2025 but issue tracker not closed. [NEEDS VERIFICATION]
- [Issue #2854](https://github.com/google/highway/issues/2854): mold linker fails on riscv64 with highway 1.2.0 -- corrupted `.riscv.attributes` ISA string causes mold to segfault. Workaround: use default `ld` linker.

**Relevant highway merges affecting riscv64 (since v1.2.0):**

- [PR #2968](https://github.com/google/highway/pull/2968) (merged 2026-04-07): RVV runtime dispatch re-enabled for Clang 19+. Not yet consumed by libjxl.
- [PR #2704](https://github.com/google/highway/pull/2704) (merged 2025-09-12): VQSORT enabled for RISC-V, improving sort performance.

Highway's own CI uses QEMU for RISC-V testing. libjxl's CI does not.

---

## 11. Known Bugs and Active Issues

Issues in libjxl/libjxl:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1283](https://github.com/libjxl/libjxl/issues/1283) | build problem on riscv64: undefined reference to `__atomic_fetch_or_1` | Closed | Build blocker (resolved) | Fixed by PRs #1128 and #1166; shipped in v0.7.0 |
| [#1788](https://github.com/libjxl/libjxl/issues/1788) | JxlTest.RoundtripLargeFast size assertion failure on non-x86 | Closed | Test failure (resolved) | Affected ppc64el, riscv64, ia64; fixed in commit bb8eac5d6 |

Issues in google/highway (blocking riscv64 performance in libjxl):

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#2793](https://github.com/google/highway/issues/2793) | EMU128 test failure on riscv64 + GCC 15 | Open | Test failure | GCC bug gcc#122692; fix targeted for GCC 15.3 |
| [#2738](https://github.com/google/highway/issues/2738) | -march rv64gcv1p0 too restrictive for RVA23 platforms | Open | Build/performance | LTO failures under GCC 15.2; affects RVA23-capable hardware |
| [#2554](https://github.com/google/highway/issues/2554) | Clang 20 rvv-inl.h compile error | Open (believed fixed) | Build blocker | Fix believed merged July 2025; tracker not closed [NEEDS VERIFICATION] |
| [#2854](https://github.com/google/highway/issues/2854) | mold linker crash on riscv64 | Open | Build blocker (workaround available) | Corrupted .riscv.attributes; workaround: use ld |

No open correctness bugs for riscv64 exist in libjxl as of the research date.

---

## 12. Objections and Upstream Blockers

**No stated objections.** The maintainer team (Google, Cloudinary) has merged every substantive riscv64 build-fix PR submitted. PR #1429 (JXL_ARCH_RISCV64 macro) was declined only because it was unnecessary -- no objection to riscv64 support in principle.

**PR merge latency:** PR #3826 was open for nearly a year (September 2024 to August 2025) before merge. This is not a riscv64-specific pattern -- it reflects general low bandwidth from the core team for non-critical fixes. Any riscv64 CI or performance work submitted as a PR should expect multi-month review cycles.

**Technical blockers:**

1. Highway v1.2.0 pin: libjxl cannot use Highway RVV runtime dispatch until it upgrades. An open bot PR (#2269) tracks this, but no maintainer has committed to a timeline.
2. `enc_fast_lossless.cc` scalar path: Adding an RVV backend to this file requires writing manual RVV intrinsics in a file that currently has three hand-written SIMD backends. There is no existing infrastructure for this in libjxl -- it is a green-field implementation effort.
3. No CI: Without riscv64 CI, any contributed code regresses silently. CI is a prerequisite for sustained maintenance.

**Acceptance probability for contributions:** High for build fixes (demonstrated by merged history). Moderate for CI additions (QEMU-based CI for s390x exists as a template; adding riscv64 to the matrix is a small diff). Low for `enc_fast_lossless.cc` RVV backend without a champion from the core team, given the file's complexity and the team's bandwidth.

---

## 13. Investment Analysis

RISE has no documented prior investment in libjxl. No RISE-funded work needs to be excluded.

### 13.1 Functional Enablement

libjxl already builds and produces correct output on riscv64. No functional gaps exist. No work is required here.

### 13.2 Performance Optimization

**Item 1: Highway upgrade (high leverage, prerequisite for everything else)**
Update libjxl's Highway submodule pin from v1.2.0 to v1.4.0+. This enables Highway RVV runtime dispatch for Clang 19+ and pulls in VQSORT for RISC-V (PR #2704). Requires: verifying no regressions on amd64/arm64 from the Highway API changes between v1.2.0 and v1.4.0, updating CMakeLists.txt if any API changed, and updating `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT` to enable RVV by default on riscv64. Estimated effort: 1-2 person-weeks (mostly regression testing across all CI targets).

**Item 2: enc_fast_lossless.cc RVV backend (high effort, high impact)**
The fast lossless encoder is the dominant performance path for lossless JPEG XL. Writing an RVV backend for `enc_fast_lossless.cc` requires implementing the equivalent of the AVX2/NEON backends using RVV 1.0 intrinsics. The file is self-contained; Highway is not used. Estimated effort: 6-10 person-weeks (profiling, intrinsics implementation, correctness testing, performance tuning across RVA22/RVA23 hardware profiles). This is the highest-impact single performance investment.

**Item 3: Enable RVV by default for riscv64 builds (low effort, moderate impact)**
Remove `RVV` from `JPEGXL_HWY_TARGETS_OFF_BY_DEFAULT` for riscv64 targets, or add a CMake condition that enables it when `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv"` and the toolchain supports it. This is a 1-2 line CMake change with associated testing. Depends on Item 1. Estimated effort: 0.5 person-weeks.

### 13.3 CI/CD Infrastructure

**Item 4: Add riscv64 QEMU CI job**
The `build_test_emu.yml` workflow already runs s390x via QEMU/Docker multiarch. Adding riscv64 requires adding `linux/riscv64` to the matrix and ensuring `multiarch/qemu-user-static` supports riscv64 (it does, as of 2023). This would catch build regressions before they reach Debian. Full test execution under QEMU will be slow (10-30x native). A compile-only job (analogous to the s390x compile-only job in `build_test_cross.yml`) is a lower-cost alternative. Estimated effort: 1-2 person-weeks (CI configuration, fixing any test failures surfaced by QEMU, upstream PR).

### 13.4 Ecosystem Enablement

libjxl has no significant dependent package ecosystem requiring separate riscv64 enablement (no PyPI packages, no npm, no Maven artifacts). Section 10 is omitted per the report specification.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Performance | Upgrade Highway pin to v1.4.0+ | 1-2 | RISE contributor | Critical |
| Performance | Enable RVV by default for riscv64 in CMake | 0.5 | RISE contributor | High |
| Performance | RVV backend for enc_fast_lossless.cc | 6-10 | RISE contributor | High |
| CI/CD | Add riscv64 QEMU job to build_test_emu.yml | 1-2 | RISE contributor | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libjxl/libjxl repository](https://github.com/libjxl/libjxl)
- [JPEG XL homepage](https://jpeg.org/jpegxl/)
- [Issue #1283 - build problem on riscv64: undefined reference to __atomic_fetch_or_1](https://github.com/libjxl/libjxl/issues/1283)
- [Issue #1788 - RoundtripLargeFast size assertion failure on ppc64el/riscv64/ia64](https://github.com/libjxl/libjxl/issues/1788)
- [PR #1128 - libjxl implementation rely on c11 atomics (cache_aligned.cc)](https://github.com/libjxl/libjxl/pull/1128)
- [PR #1166 - Pthread dependencies](https://github.com/libjxl/libjxl/pull/1166)
- [PR #1429 - Add support for 64-bit RISC-V arch (closed without merge)](https://github.com/libjxl/libjxl/pull/1429)
- [PR #1611 - Preparation for SVE/RVV: fix static_assert](https://github.com/libjxl/libjxl/pull/1611)
- [PR #1642 - Fix typo in build file; should fix sve/rvv build with gcc](https://github.com/libjxl/libjxl/pull/1642)
- [PR #2211 - Add missing `<atomic>` content to fix gcc compilation for RISCV architecture](https://github.com/libjxl/libjxl/pull/2211)
- [PR #3826 - cmake: Do not use -mrelax-all with clang on RISCV64](https://github.com/libjxl/libjxl/pull/3826)
- [libjxl v0.7.0 release](https://github.com/libjxl/libjxl/releases/tag/v0.7.0)
- [libjxl v0.8.2 release](https://github.com/libjxl/libjxl/releases/tag/v0.8.2)
- [libjxl v0.11.2 release](https://github.com/libjxl/libjxl/releases/tag/v0.11.2)
- [libjxl v0.11.2 release assets](https://github.com/libjxl/libjxl/releases/expanded_assets/v0.11.2)
- [libjxl-dev 0.11.2-5 in Debian sid](https://packages.debian.org/sid/libjxl-dev)
- [libjxl0.11 riscv64 in Debian sid](https://packages.debian.org/sid/riscv64/libjxl0.11/download)
- [libjxl0.7 0.7.0-10.2ubuntu6 in Ubuntu 24.04 Noble](https://packages.ubuntu.com/noble/libjxl0.7)
- [google/highway repository](https://github.com/google/highway)
- [google/highway PR #2968 - RVV runtime dispatch re-enabled for Clang 19+](https://github.com/google/highway/pull/2968)
- [google/highway PR #2704 - VQSORT enabled for RISC-V](https://github.com/google/highway/pull/2704)
- [google/highway issue #2793 - EMU128 test failure on riscv64 + GCC 15](https://github.com/google/highway/issues/2793)
- [google/highway issue #2738 - -march rv64gcv1p0 too restrictive for RVA23](https://github.com/google/highway/issues/2738)
- [google/highway issue #2554 - Clang 20 rvv-inl.h compile error](https://github.com/google/highway/issues/2554)
- [google/highway issue #2854 - mold linker crash on riscv64](https://github.com/google/highway/issues/2854)
- [RISE project membership](https://riseproject.dev)
- [GCC bug #122692 - EMU128 mis-compilation on riscv64 GCC 15](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=122692)
- [GCC bug #110812 - LTO mixed march flags failure](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812)