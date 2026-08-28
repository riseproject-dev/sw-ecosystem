---
title: Skia
parent: Project Reports
categories:
  - libraries
  - browser
---

# Skia

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Skia
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Skia is a 2D graphics library that serves as the rendering engine for Google Chrome, ChromeOS, Android, Flutter, and several other products. It handles rasterization, image decoding, text rendering, path operations, and GPU-accelerated compositing. The library is written in C++ (C++20 minimum) and exposes a stable C++ API with additional bindings in Python (skia-python) and Rust (rust-skia).

**Governance:** Skia is a Google-owned project with no independent foundation. All changes are reviewed on Gerrit at [skia-review.googlesource.com](https://skia-review.googlesource.com) and require approval from a Committer, a role held overwhelmingly by Google engineers. The OWNERS file uses a wildcard, meaning Google controls approvals globally. Community roles are General Public, Developer, Contributor, and Committer. There is no governance body separate from Google. New platform support requires going through Google's internal team; new architecture proposals must be raised via the skia-discuss Google Groups or a feature bug on [issues.skia.org](https://issues.skia.org).

**License:** BSD 3-Clause (copyright 2011 Google Inc.).

**Corporate sponsors with wildcard author entries:** Google (primary), ARM, Intel, Microsoft, Samsung, NVIDIA, Adobe, Meta, Amazon, Collabora, Igalia, LG Electronics, Linaro, JetBrains, Sony Mobile. Mozilla contributors (Jeff Muizelaar, Lee Salzman) are individually listed. LoongArch contributor ChengYang at Loongson is present.

**Culture on new ports:** The project's explicit policy, stated by Heather Miller (Google, OWNERS of `gn/BUILDCONFIG.gn`) in response to a riscv64 enablement patch, is: "Let's not add this to our build until it is being supported and used." Ben Wagner (Google) reinforced this: "Skia cannot really claim support for an architecture for which it doesn't have test bots." New architecture acceptance requires CI bot presence as a precondition, not a follow-on.

**RISE membership:** Google is a Premier Member of the RISE project. Skia itself is not a listed RISE member project. No RISE blog post (27 reviewed, May 2024 through June 2026) mentions Skia. No funded RISE RFP (RP001-RP016) covers Skia or graphics libraries.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-04-05 | SwiftShader dependency roll includes riscv64 marl/llvm-10/subzero additions | [Skia commit 6d59d39](https://github.com/google/skia/commit/6d59d39) |
| 2022-12-15 | ANGLE dependency roll includes "Add riscv64 support" | [Skia commit f50fe87](https://github.com/google/skia/commit/f50fe87) |
| 2023-01-23 | "Disable thinLTO in skia for riscv" -- first riscv64-specific commit in Skia source, targeting Android bug b/254713216 | [Gerrit CL 631163](https://skia-review.googlesource.com/c/skia/+/631163) |
| 2023-02-27 | Premature revert of thinLTO disable | [Gerrit CL 649756](https://skia-review.googlesource.com/c/skia/+/649756) |
| 2023-02-28 | Reland of thinLTO disable (revert was premature) | [Gerrit CL 650276](https://skia-review.googlesource.com/c/skia/+/650276) |
| 2023-04-11 | "gn: BUILDCONFIG.gn: add riscv64 architecture detection in gn phase" submitted by Chang Rebecca Swee Fun (StarFive Technology); blocked by Google -1 vote | [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916), stalled |
| 2023-05-17 | ANGLE roll includes "[riscv64][android] support 64-bit builds on riscv64" | [Skia commit c4cff37](https://github.com/google/skia/commit/c4cff37) |
| 2023-05-22 | Final removal of thinLTO workaround -- bug b/254713216 marked fixed upstream | [Gerrit CL 701418](https://skia-review.googlesource.com/c/skia/+/701418) |
| 2023-05-29 | ANGLE roll includes "[riscv64][android] skip 2nd abi support for pure 64-bit android" | [Skia commit 19af8f0](https://github.com/google/skia/commit/19af8f0) |
| 2023-11-27 | ANGLE roll includes "[riscv] Add riscv support" from yahan@iscas.ac.cn (ISCAS) | [Skia commit 9fa62cc](https://github.com/google/skia/commit/9fa62cc) |
| 2025-05-29 | depot_tools roll adds `checkout_riscv64` variable -- infrastructure awareness, no CI bot | [Skia commit f34be67](https://github.com/google/skia/commit/f34be67) |
| 2025-09-16 | "Disable must_tail on GCC when compiling for RISC-V" merged in skcms (Skia's color management library), targeting GCC bug 121784 | [skcms Gerrit CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198) |
| 2025-12-08 | SwiftShader roll fixes "riscv64 build problem with LLVM 16" | [Skia commit 895fa74](https://github.com/google/skia/commit/895fa74) |

**Key contributors:** Aditya Kumar (appujee@google.com, Google) authored the initial Android thinLTO workaround. Nolan Scobie (nscobie@google.com, Google) relanded and removed it. Chang Rebecca Swee Fun (StarFive Technology) submitted the build system enablement CL that remains blocked. yahan@iscas.ac.cn (ISCAS) contributed ANGLE riscv64 support that flowed into Skia via dependency rolls. Kaylee Lubick (kjlubick@google.com, Google) and Levi Zim (rsworktech@outlook.com) authored the 2025 correctness fixes.

**Upstreaming status:** The riscv64 work in Skia's own source is limited to a transient Android build workaround that was added and removed within four months in 2023. As of 2026-06, the net riscv64 code change to the Skia source tree is zero lines. Gerrit CL 668916 (build system recognition of riscv64 as a known target_cpu) remains open and blocked since April 2023. There is no upstream riscv64 port in progress.

---

## 3. Upstream Support Tier

**Formal tier policy:** Skia has no published tier policy for platform or architecture support. The [skia.org About page](https://skia.org/about/) lists supported platforms as Windows, macOS, iOS, Android, and Linux (x86/ARM). RISC-V is not listed. The de facto policy, stated explicitly in Gerrit CL 668916, is that architecture support requires CI test bots as a precondition.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as supported | Yes | Yes | No |
| CI bots | Yes (Linux, Mac, Win) | Yes (Android, iOS) | None |
| Release-blocking | Yes | Yes | Not applicable |
| Official binaries from upstream | None (library only) | None (library only) | None (library only) |
| Distro packaging | Debian sid (libskia146) | Debian sid (libskia146) | Debian sid (libskia146) |
| SIMD optimizations | Full (SSE through AVX-512) | NEON in shared headers | None (scalar fallback) |
| Build system recognition | Full (ml3/ml4/x64 targets) | Full (arm64 target) | Absent from GN and Bazel |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Skia's architecture-specific performance work lives in `src/opts/`. The `SkRasterPipeline_opts.h` file selects a SIMD backend at compile time: SCALAR, NEON (arm32/arm64), ML4 (AVX-512), AVX2, AVX, SSE4.x, SSE2, LASX, LSX, and falling through to the portable scalar backend. RISC-V routes to the portable (width-1) scalar fallback unconditionally.

**Architecture-specific files:**

| Component | amd64 (files) | arm64 (approach) | LoongArch (files) | riscv64 |
|---|---|---|---|---|
| Raster pipeline ops | `SkOpts_ml3.cpp`, `SkOpts_ml4.cpp` (9 files total) | Inline NEON guards in shared headers | `SkOpts_lasx.cpp` (4 files) | Missing |
| Blitter/swizzler | `SkBlitRow_opts_ml3.cpp`, `SkSwizzler_opts_ml3.cpp`, 5 others | Inline NEON in headers | `SkBlitRow_opts_lasx.cpp`, `SkSwizzler_opts_lasx.cpp` | Missing |
| Memory ops | `SkMemset_opts_avx.cpp`, `SkMemset_opts_erms.cpp` | Scalar fallback | Scalar fallback | Missing |
| CPU feature detection | `SK_CPU_X86`, SSE/AVX macros in `SkFeatures.h` | `SK_CPU_ARM64`, `SK_ARM_HAS_NEON` | `SK_CPU_LOONGARCH`, LSX/LASX macros | No `SK_CPU_RISCV`, no `__riscv` detection anywhere |
| Runtime dispatch | `SkCpu.cpp` reads cpuid | No runtime dispatch (static NEON) | `getauxval` check | Not present |
| Tail-call pipeline (skcms) | Enabled | Enabled | Data not available: not verified | Disabled via `!defined(__riscv)` guard (GCC bug 121784) |
| GPU backends (Graphite/Ganesh) | Full (Vulkan, Dawn) | Full (Metal, Vulkan) | Data not available | Theoretically works via Vulkan path; GPU driver availability is the constraint |
| JIT | None (Skia has no JIT) | None | None | None |
| Assembly files | None in current tree | None in current tree | None | None |

**CPU detection:** `include/private/SkFeatures.h` defines `SK_CPU_*` macros for x86, LoongArch, PPC, ARM32, ARM64. There is no `SK_CPU_RISCV` macro and no `#ifdef __riscv` guard anywhere in the Skia source tree. `src/core/SkCpu.h` and `SkCpu.cpp` implement runtime CPU feature detection for x86 (via `cpuid`) and LoongArch (via `getauxval`). No RISC-V branch exists.

**SIMD quality summary per component:**

| Component | amd64 quality | arm64 quality | riscv64 quality |
|---|---|---|---|
| Raster pipeline | Hand-tuned intrinsics (AVX2/AVX-512) | NEON intrinsics (good) | Scalar (missing) |
| Image blitting | Hand-tuned intrinsics (SSSE3/AVX2) | NEON intrinsics | Scalar (missing) |
| Memory ops | AVX + ERMS strings | Scalar fallback | Scalar (missing) |
| Color management (skcms) | Intrinsics | Intrinsics | Scalar, tail-call disabled on GCC |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Skia uses GN (Generate Ninja) as its primary build system, with an ongoing migration to Bazel. There is no CMakeLists.txt. The `gn_to_cmake.py` script exists but is documented as an IDE integration aid only.

**riscv64 GN status:** `gn/BUILDCONFIG.gn` enumerates known `target_cpu` values as `arm64`, `arm`, `x64`, `x86`, `wasm`. Unknown values, including `riscv64`, pass through without triggering any architecture-specific build logic. Gerrit CL 668916 (adding an explicit riscv64 recognition block) is blocked since April 2023 per the policy that CI bots are required first.

**Bazel status:** `bazel/platform/BUILD.bazel` defines platforms for `linux_x64`, `mac_x64`, `mac_arm64`, `windows_x64`, `linux_arm64`, `android_arm32`, `android_arm64`, `ios`. No `riscv64` constraint or platform target. `bazel/common_config_settings/BUILD.bazel` enumerates CPU config settings as x86_64, arm64, wasm -- no riscv64.

**Working build path (Debian's approach):**
```
bin/gn gen debbuild --args='
  is_official_build=true
  skia_use_system_expat=true
  skia_use_system_harfbuzz=true
  skia_use_system_icu=true
  skia_use_system_libjpeg_turbo=true
  skia_use_system_libpng=true
  skia_use_system_libwebp=true
  skia_use_system_zlib=true
  skia_use_dng_sdk=false
  skia_use_wuffs=false
  skia_enable_spirv_validation=false
  is_component_build=true
  skia_so_version=146
'
ninja -C debbuild
```
No `target_cpu` is set. GN infers the CPU from the build host. This works on a native riscv64 machine; cross-compilation is not supported upstream.

**Required compiler:**
- GCC 14 minimum (from Debian `debian/control`)
- C++20 required
- Clang works but has no upstream riscv64 CI or documented configuration

**Known build issues:**

- GCC does not support `must_tail` on RISC-V (GCC bug [121784](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121784)). Fixed in skcms via CL 1056198 (2025-09-16) with `!defined(__riscv)` guard.
- thinLTO + riscv64 interaction (Android bug b/254713216) was resolved in the Android Soong build system in May 2023; no issue remains for GN/Ninja builds.
- SwiftShader (Skia's software rasterizer dependency): "riscv64 build problem with LLVM 16" was fixed by Levi Zim and rolled into Skia on 2025-12-08. The root cause was missing `#include` directives for forward-declared LLVM types in `RISCVELFStreamer.h`.
- rust-skia [issue #1179](https://github.com/rust-skia/rust-skia/issues/1179) (opened July 2025): the `fetch-gn` script crashes with `KeyError` on riscv64 because no precompiled GN binary exists for that architecture. No fix as of June 2026.

**QEMU:** No QEMU usage is documented in the Skia build system. No QEMU-based CI exists. The Debian package is built natively on `rv-manda-04`.

**Cross-compilation:** No cross-compilation toolchain files exist for riscv64 in the upstream repo. `infra/cross-compile/docker/` contains only a `cross-linux-arm64/Dockerfile`. No riscv64 cross-compile Docker image exists.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Raster pipeline (SkRasterPipeline) | Full SIMD (AVX2/AVX-512) | NEON | Scalar fallback only |
| Image blitting (SkBlitRow, SkSwizzler) | Full SIMD | NEON | Scalar fallback only |
| Color management (skcms) | Intrinsics + tail-call | Intrinsics + tail-call | Scalar, tail-call disabled on GCC |
| Text shaping (HarfBuzz) | Full | Full | Full (no arch-specific code) |
| Font rasterization (FreeType) | Full | Full | Full (no arch-specific code) |
| Image decode -- JPEG (libjpeg-turbo) | SIMD (SSE2/AVX2) | SIMD (NEON) | Scalar (RVV merged in libjpeg-turbo 3.2 but no CI) |
| Image decode -- WebP (libwebp) | SIMD (SSE2/NEON) | SIMD (NEON) | Scalar only (no RVV in libwebp) |
| Image decode -- JPEG XL (libjxl) | SIMD via Highway | SIMD via Highway | Highway RVV backend (dispatch re-enabled Apr 2026; see Section 9) |
| GPU -- Vulkan (Graphite/Ganesh) | Full | Full | Theoretically functional; GPU driver availability is the constraint |
| GPU -- Dawn/WebGPU | Full | Full | Theoretically functional; GPU driver availability is the constraint |
| Build system recognition | Full | Full | Absent (CL 668916 blocked) |
| CI coverage | Full | Full | None |

**Functional gaps:** No functional gaps are documented. Skia on riscv64 compiles and produces correct output via the scalar fallback. There are no known floating-point or NaN correctness bugs filed for riscv64.

**Performance gaps:** All `SkRasterPipeline` operations, image blitting, swizzling, and memory operations run at scalar (width-1) throughput on riscv64. The performance differential vs. arm64 NEON for raster-intensive workloads (path fill, text rendering, compositing) is significant; the typical range for SIMD vs. scalar in raster pipelines is 4x-16x depending on operation width. Data not available: no published riscv64 vs. arm64 benchmark for Skia exists in any publicly accessible source (RISE blog, Skia issue tracker, Google Groups, or AOSP).

**Security hardening gaps:** Skia's PartitionAlloc allocator disables ARM MTE and x86 PKU on architectures that do not support them. Both are absent on riscv64 and disabled gracefully with no functional impact. No other security hardening gap is documented for riscv64.

---

## 7. CI/CD Infrastructure

**Skia's CI:** Skia uses Google's internal Gerrit Commit Queue and a bespoke task scheduler defined in `infra/bots/`. The task taxonomy in `infra/bots/gen_tasks_logic/gen_tasks_logic.go` enumerates architectures as `amd64`, `x86`, `x86_64`, `arm`, `arm64`, and `wasm`. The string "riscv" appears nowhere in any CI task generation file.

**GitHub Actions:** Skia has no project-authored `.github/workflows/` directory. The three workflows visible on GitHub Actions (CodeQL, Dependabot, Dependency Graph) are GitHub-managed dynamic workflows, not project-defined configurations.

**riscv64 CI:** None. Confirmed by reading `infra/bots/tasks.json` (1,016 tasks, zero riscv matches), `gen_tasks_logic.go`, `dm_flags.go`, `task_builder.go`, `schema.go`, and `compile_cas.go`. No QEMU runner, no cross-compile CI job, no build-only CI step for riscv64 exists.

The `checkout_riscv64` variable added to depot_tools (rolled into Skia in May 2025) indicates infrastructure awareness of riscv64 but is not wired to any active CI bot. [NEEDS VERIFICATION: whether the depot_tools `checkout_riscv64` variable is used for any Google-internal Skia CI not visible in the public repository.]

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | No |
| Test CI | Yes | Yes | No |
| GPU CI | Yes | Yes (Android) | No |
| QEMU emulation CI | N/A | N/A | No |
| RISE runners | No | No | No |
| Hardware available | Yes | Yes | No upstream bots |

---

## 8. Distribution and Release Status

**Upstream binary releases:** google/skia publishes no binary releases on GitHub. The repository is a source-only mirror of the Gerrit-hosted upstream. No release artifacts of any kind exist.

**Debian:** `libskia146` (source package `libskia`, version `146.20260414~git.ef5f213+dfsg-5`) is available in Debian sid and forky (unstable/testing) for riscv64. Built natively on Debian buildbot host `rv-manda-04`. Package sizes: `libskia146` 2,508.7 kB / 5,665.0 kB installed; `libskia-dev` ships 187 MB of headers and the shared library. All 7 Debian architectures supported: amd64, arm64, armhf, i386, loong64, ppc64el, riscv64. NOT available in Debian bookworm (stable, Debian 12).

**Ubuntu:** No `libskia` package in any Ubuntu release (Noble, Jammy, Focal). `ubuntu-packages.ubuntu.com` returns no results for `libskia` in Noble. The packages found under "skia" in Ubuntu Noble are `librust-tiny-skia-dev` and `librust-tiny-skia-path-dev` (Rust tiny-skia, version 0.11.3-1), which are available for riscv64 but are not the Google Skia library.

**PyPI (skia-python):** Latest version 144.0.post2, 45 wheel files. Linux wheels: `manylinux_2_28_x86_64` and `manylinux_2_28_aarch64` only. No riscv64 wheel. No prior release includes a riscv64 wheel.

**Arch Linux RISC-V:** Search of archriscv.felixc.at returned no results for "skia" or "libskia". The Arch Linux RISC-V port does not appear to have packaged Skia.

**To get a working riscv64 binary today:** Install `libskia146` from Debian sid on a riscv64 system, or build from source on a native riscv64 machine using GCC 14+ and the GN args documented in Section 5.

---

## 9. Dependencies

| Dependency | Role in Skia | riscv64 Build | riscv64 Test | riscv64 Release | Open Issues |
|---|---|---|---|---|---|
| Google Highway (libhwy) | SIMD abstraction for raster pipeline ops | Builds; RVV backend upstream since 2021 | QEMU CI PR open, not merged; hardware tests on Banana Pi BPI-F3 confirmed [NEEDS VERIFICATION] | Debian sid 1.3.0-2+b1; no upstream binary | [#2554](https://github.com/google/highway/issues/2554) clang 20 RVV intrinsics undeclared (open Apr 2025); [#2854](https://github.com/google/highway/issues/2854) mold linker .riscv.attributes; [#2738](https://github.com/google/highway/issues/2738) -march mismatch on RVA23 |
| HarfBuzz | Text shaping, PDF subsetting | Builds cleanly; no arch-specific code | No upstream riscv64 CI; Debian build succeeds | Debian sid packaged | None |
| FreeType | Font rasterization | Builds cleanly; pure C | No upstream riscv64 CI; Debian build succeeds | Debian sid + Ubuntu Noble packaged | None |
| libjpeg-turbo | JPEG decode/encode | Builds; `simd/riscv64/` directory present; RVV merged in 3.2 series | No riscv64 upstream CI; issue #710 (unit test failures) resolved | No upstream riscv64 binary release | No open riscv64 blockers; RVV merged |
| libwebp | WebP decode/encode | Builds; no riscv64 SIMD code in `src/dsp/` | No riscv64 CI | Debian/Ubuntu packaged | None filed; scalar fallback only; performance gap |
| libavif | AVIF decode/encode | Builds (pure C); riscv64 availability depends on libaom/dav1d backends | No riscv64 CI | Debian/Ubuntu packaged | None in libavif itself; codec backend status out of scope |
| libjxl (JPEG XL) | JPEG XL decode; uses Highway for SIMD | Builds (Debian sid confirmed) | No riscv64 CI | Debian packaged | [#3826](https://github.com/libjxl/libjxl/issues/3826) merged (clang on riscv64 -mrelax-all); no open blockers |
| ICU | Unicode processing, BiDi, text layout | Builds; no riscv64-specific code | No riscv64 upstream CI; Debian builds succeed | Debian + Ubuntu packaged | Historical [#1715](https://unicode-org.atlassian.net/browse/ICU-1715) (2021, closed); no open issues |
| zlib (Chromium fork) | Compression for PNG, PDF, fonts | Builds; x86/ARM SIMD; no RVV | Tested via Chromium suite; no riscv64-specific CI | Via OS packages | None; scalar fallback |
| Abseil-cpp | Utility library (strings, hash, logging, CRC32C, stack traces) | Builds; riscv64 stack unwinder upstream | No riscv64 CI | Debian packaged | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) missing -latomic (cross-compile); [#2002](https://github.com/abseil/abseil-cpp/issues/2002) test SEGFAULT on Debian riscv64; [#1986](https://github.com/abseil/abseil-cpp/issues/1986) CRC32C HW accel PR open since Dec 2025 |
| Brotli | Brotli decompression | Builds; riscv64 platform config added 2018 | No riscv64 CI | Debian/Ubuntu packaged | None open |
| expat | XML parsing (Android font manager) | Builds; pure C | No riscv64 CI | Debian/Ubuntu packaged | None |
| PartitionAlloc | Memory allocator (Clang builds) | Builds; MTE/PKU (ARM/x86 only) gracefully disabled | No riscv64 CI known | Bundled in Chromium/Skia | None; MTE/BTI/PKU absent but not required |
| Vulkan / VulkanMemoryAllocator | GPU backend (Graphite + Ganesh) | Builds; no VMA riscv64 issues | Requires Vulkan-capable riscv64 hardware | Bundled | None in VMA; GPU driver availability is the constraint |
| Dawn (WebGPU) | WebGPU backend (Graphite) | Builds (CPU/Vulkan paths) | No riscv64 CI | Bundled | None; GPU availability is the constraint |
| SPIRV-Tools / SPIRV-Cross | Shader compilation | Builds; no arch-specific code | No riscv64 CI | Bundled | None |
| wuffs | Fast image decoding (PNG, GIF) | Builds; no riscv64 SIMD intrinsics | No riscv64 CI | Bundled | None |
| ANGLE | OpenGL ES abstraction | Builds; riscv64 Android support from ISCAS rolled into Skia deps 2022-2023 | No upstream riscv64 CI | Bundled | None filed for riscv64 |
| SwiftShader | Software rasterizer (CPU Vulkan) | Builds; LLVM 16 riscv64 fix applied Dec 2025 | No riscv64 CI | Bundled | None open after LLVM 16 fix |

**Highway deep-dive (critical path):** Highway is used by libjxl (which Skia uses for JPEG XL) and optionally by Skia's own raster pipeline when built with Highway support enabled. Highway's RVV backend has been upstream since 2021 and runtime dispatch was re-enabled in April 2026 (PR #2968). The blocking issue for production use is [#2554](https://github.com/google/highway/issues/2554): clang 20 reports undeclared RVV intrinsics, open since April 2025 with no fix. This breaks Highway-accelerated paths when building with clang 20 on riscv64. Builds with GCC or clang < 20 are unaffected. The mold linker issue [#2854](https://github.com/google/highway/issues/2854) has a known workaround (use ld.bfd or ld.lld instead of mold).

**Abseil-cpp deep-dive (relevant to Skia's utility layer):** Issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002) documents test SEGFAULTs for `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on Debian riscv64. The issue has received no upstream response. These are test-only failures; library function correctness is not confirmed to be affected but cannot be ruled out given no upstream response and no riscv64 CI.

---

## 11. Known Bugs and Active Issues

| ID | Title | Project | Status | Severity | Notes |
|---|---|---|---|---|---|
| [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916) | gn: BUILDCONFIG.gn: add riscv64 architecture detection | Skia | Open, stalled since 2023-04-27 | Blocker for build system formalization | Heather Miller (Google) Code-Review -1: "not until there are test bots" |
| [skcms CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198) | Disable must_tail on GCC when compiling for RISC-V | skcms | Merged 2025-09-16 | Fixed correctness issue | GCC bug 121784; tail-call disabled on riscv64 GCC builds via `!defined(__riscv)` guard |
| [rust-skia #1179](https://github.com/rust-skia/rust-skia/issues/1179) | Building skia-bindings fails on riscv64 (missing GN binary) | rust-skia | Open since 2025-07; no response | High for Rust users | `fetch-gn` script crashes with KeyError; no precompiled GN binary for riscv64 |
| [lapce/floem #123](https://github.com/lapce/floem/issues/123) | tiny-skia fails to compile on riscv64 | lapce/floem | Open since 2023-10-26 | Medium | Affects Rust UI frameworks using tiny-skia; only wgpu backend works on riscv64 |
| [Highway #2554](https://github.com/google/highway/issues/2554) | clang 20 RVV intrinsics undeclared | Google Highway | Open since 2025-04; no fix | Medium (clang 20 only) | Breaks Highway RVV path; GCC unaffected |
| [Abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) | hashtablez / cordz SEGFAULT on Debian riscv64 | Abseil-cpp | Open; no upstream response | Low (test-only confirmed) | Test reliability gap; possible library correctness issue not ruled out |
| [Abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) | Missing -latomic for cross-compile on riscv64 | Abseil-cpp | Open | Medium for cross-compile | Build failure only; native builds unaffected |
| b/254713216 | thinLTO failure on riscv64 in Android build | Android internal | Closed/Fixed 2023-05 | Historical | Resolved via Soong global emulated-TLS fix; workaround removed from Skia May 2023 |

**No known correctness bugs in Skia core on riscv64 are publicly documented.** The scalar fallback produces correct output; no NaN or floating-point edge-case bugs have been filed.

---

## 12. Objections and Upstream Blockers

**Stated policy blocker (primary):** Heather Miller (Google, OWNERS of `gn/BUILDCONFIG.gn`), Code-Review -1 on CL 668916: "Let's not add this to our build until it is being supported and used. Happy to discuss priority use cases if/when they are there." Ben Wagner (Google) on the same CL: "Skia cannot really claim support for an architecture for which it doesn't have test bots." This establishes a formal prerequisite: riscv64 CI bots must exist before any riscv64 build system changes are accepted.

**Resource blocker:** No Google-funded riscv64 CI infrastructure for Skia exists. Google is a RISE Premier Member but has not directed any RISE funding toward Skia riscv64 support.

**No public roadmap item:** Zero open issues on issues.skia.org for RISC-V. Zero skia-discuss Google Groups threads for riscv64. Zero AOSP external/skia branches for riscv64.

**Technical blockers for performance work:**
1. No `SK_CPU_RISCV` macro and no `__riscv` detection in `SkFeatures.h` -- required before any RVV SIMD can be added.
2. `SkRasterPipeline_opts.h` does not have an RVV dispatch path -- requires parallel implementation alongside the existing NEON/AVX2/LASX paths.
3. `src/core/SkCpu.cpp` has no RISC-V `getauxval(AT_HWCAP)` runtime detection for RVV -- required for dynamic dispatch.
4. The `src/opts/BUILD.bazel` and `gn/opts.gni` files would require riscv64-specific entries to compile any new `SkOpts_rvv.cpp`.
5. Highway [#2554](https://github.com/google/highway/issues/2554) (clang 20 RVV intrinsics undeclared) must be resolved before Highway-accelerated paths work with clang 20.

**Acceptance probability:** Low in the near term without an external organization providing CI bots and sustained engineering. The LoongArch precedent (4 dedicated files in `src/opts/`, full LASX support) shows Google accepts third-party contributions when CI coverage is provided and the port is actively maintained. StarFive's 2023 attempt (CL 668916) stalled because it did not include CI infrastructure. A contribution package that includes CI bots, CPU detection, and at least a stub `SkOpts_riscv.cpp` would be necessary but not sufficient to overcome the -1 vote.

---

## 13. Investment Analysis

RISE has no prior work on Skia to subtract. The full scope is open.

### 13.1 Functional Enablement

The scalar fallback is functionally complete today. The gaps requiring work for a production-quality port:

1. Add `SK_CPU_RISCV` detection and `__riscv` guards to `include/private/SkFeatures.h`.
2. Add riscv64 `target_cpu` handling to `gn/BUILDCONFIG.gn` and a corresponding platform to `bazel/platform/BUILD.bazel`.
3. Add `getauxval(AT_HWCAP)` RISC-V vector detection to `src/core/SkCpu.cpp`.
4. Create a stub `src/opts/SkOpts_rvv.cpp` (even if initially empty) and wire it into `gn/opts.gni` and `src/opts/BUILD.bazel`.
5. Fix rust-skia [#1179](https://github.com/rust-skia/rust-skia/issues/1179) (provide a precompiled GN binary for riscv64 or fix the fetch script to handle unknown architectures).

### 13.2 Performance Optimization

The high-value targets in order of estimated impact:

1. **SkRasterPipeline RVV backend** in `src/opts/SkRasterPipeline_opts.h`: implements the core fill, compositing, and color conversion operations using RISC-V Vector intrinsics. This is the single largest performance lever; it covers the entire raster path.
2. **SkBlitRow / SkSwizzler RVV**: `src/opts/SkBlitRow_opts.h`, `SkSwizzler_opts.inc` -- bitmap blit and pixel format conversion. High throughput impact for image compositing.
3. **SkBitmapProcState RVV**: bilinear and nearest-neighbor sampling in image shaders.
4. **libjpeg-turbo RVV CI**: the RVV SIMD is upstream but has no CI; investing in test coverage would validate correctness on riscv64 hardware and enable the SIMD path for Skia's JPEG decode.
5. **libwebp RVV**: no SIMD exists for riscv64 in libwebp; implementing RVV intrinsics for the YUV conversion and IDCT paths would benefit all WebP-heavy workloads.
6. **skcms RVV**: re-enable tail-call transform pipeline on riscv64 (after GCC bug 121784 is resolved or by using clang) and add RVV color conversion intrinsics.

### 13.3 CI/CD Infrastructure

This is the gating investment. Without CI bots, no upstream patches will be accepted.

1. Provision riscv64 CI bots on Google's Swarming infrastructure (or negotiate with Google to accept QEMU-based runners on GCE as a precondition for accepting patches).
2. Alternatively, add riscv64 GitHub Actions support using QEMU (RISC-V qemu-user-static is available in Ubuntu 22.04+) to unblock the immediate contribution cycle.
3. Wire the `checkout_riscv64` depot_tools variable (already present as of May 2025) to at least a build-only CI task in `infra/bots/gen_tasks_logic/`.
4. Add a riscv64 cross-compile Dockerfile to `infra/cross-compile/docker/` parallel to the existing `cross-linux-arm64/`.

### 13.4 Ecosystem Enablement

1. **skia-python riscv64 wheel:** The skia-python project builds wheels via cibuildwheel. Adding `linux/riscv64` to the cibuildwheel matrix (requires QEMU) would produce manylinux riscv64 wheels. Effort is moderate; the main constraint is build time under QEMU emulation.
2. **rust-skia riscv64:** Fix [#1179](https://github.com/rust-skia/rust-skia/issues/1179) by adding a precompiled GN binary for riscv64 to the fetch-gn download matrix. Low effort, high unblocking value for the Rust ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | CPU detection macros + GN/Bazel build recognition (CL 668916 rework) | 1 | Qualcomm / external contributor | Critical |
| Functional | Fix rust-skia fetch-gn for riscv64 (#1179) | 1 | External contributor | High |
| CI/CD | QEMU-based riscv64 build CI (GitHub Actions or Swarming) | 3 | Qualcomm + Google negotiation | Critical (gates all upstream acceptance) |
| CI/CD | Cross-compile Docker image for riscv64 | 1 | External contributor | High |
| Performance | SkRasterPipeline RVV backend (SkRasterPipeline_opts.h) | 8 | Qualcomm | High |
| Performance | SkBlitRow + SkSwizzler RVV | 4 | Qualcomm | High |
| Performance | SkBitmapProcState RVV (image sampling) | 3 | Qualcomm | Medium |
| Performance | skcms RVV color conversion + tail-call re-enable | 3 | Qualcomm | Medium |
| Performance | libwebp RVV SIMD (YUV + IDCT) | 6 | External / RISE RFP | Medium |
| Ecosystem | skia-python riscv64 wheel via cibuildwheel | 2 | External contributor | Medium |
| Ecosystem | libjpeg-turbo riscv64 CI (validate existing RVV SIMD) | 1 | External / RISE | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/skia repository](https://github.com/google/skia)
- [Skia homepage](https://skia.org/)
- [Gerrit CL 668916 -- riscv64 BUILDCONFIG.gn (stalled)](https://skia-review.googlesource.com/c/skia/+/668916)
- [Gerrit CL 631163 -- Disable thinLTO for riscv](https://skia-review.googlesource.com/c/skia/+/631163)
- [Gerrit CL 701418 -- Final revert of thinLTO disable](https://skia-review.googlesource.com/c/skia/+/701418)
- [skcms Gerrit CL 1056198 -- Disable must_tail on GCC for RISC-V](https://skia-review.googlesource.com/c/skcms/+/1056198)
- [Skia commit 9fa62cc -- ANGLE roll including riscv support](https://github.com/google/skia/commit/9fa62ccefe5927fbdbd8749bf282d95da0095447)
- [Skia commit 895fa74 -- SwiftShader roll fixing riscv64 LLVM 16 build](https://github.com/google/skia/commit/895fa74179478c0dc0d548e0c40e2c32c6445be5)
- [Skia commit f34be67 -- depot_tools roll adding checkout_riscv64](https://github.com/google/skia/commit/f34be67e8a6b20a6f0f93fe2280954e7a367389a)
- [SkFeatures.h -- CPU detection macros](https://raw.githubusercontent.com/google/skia/refs/heads/main/include/private/SkFeatures.h)
- [SkRasterPipeline_opts.h -- SIMD backend selection](https://raw.githubusercontent.com/google/skia/refs/heads/main/src/opts/SkRasterPipeline_opts.h)
- [SkOpts_SetTarget.h -- runtime dispatch chain](https://raw.githubusercontent.com/google/skia/refs/heads/main/src/opts/SkOpts_SetTarget.h)
- [gn/opts.gni -- architecture-specific opt sources](https://raw.githubusercontent.com/google/skia/refs/heads/main/gn/opts.gni)
- [src/opts/ directory listing](https://github.com/google/skia/tree/main/src/opts)
- [Debian libskia146 package (sid, riscv64)](https://packages.debian.org/sid/libskia146)
- [Debian buildd status for libskia riscv64](https://buildd.debian.org/status/package.php?p=libskia&suite=sid)
- [GCC bug 121784 -- must_tail not supported on RISC-V](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121784)
- [rust-skia issue #1179 -- no GN binary for riscv64](https://github.com/rust-skia/rust-skia/issues/1179)
- [lapce/floem issue #123 -- tiny-skia compile failure on riscv64](https://github.com/lapce/floem/issues/123)
- [Google Highway issue #2554 -- clang 20 RVV intrinsics undeclared](https://github.com/google/highway/issues/2554)
- [Google Highway issue #2854 -- mold linker .riscv.attributes](https://github.com/google/highway/issues/2854)
- [Google Highway issue #2738 -- -march mismatch on RVA23](https://github.com/google/highway/issues/2738)
- [Abseil-cpp issue #1702 -- missing -latomic on riscv64 cross-compile](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #2002 -- test SEGFAULT on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [RISE project homepage](https://riseproject.dev/)
- [skia-python on PyPI](https://pypi.org/project/skia-python/)