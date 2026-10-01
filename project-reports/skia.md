---
title: Skia
parent: Project Reports
color: yellow
dependencies:
  - name: FreeType
    relation: runtime-dependency
    criticality: critical
  - name: HarfBuzz
    relation: runtime-dependency
    criticality: critical
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: optional
  - name: libwebp
    relation: runtime-dependency
    criticality: optional
  - name: libavif
    relation: runtime-dependency
    criticality: optional
  - name: libjxl
    relation: runtime-dependency
    criticality: optional
  - name: libyuv
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: expat
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: PartitionAlloc
    relation: runtime-dependency
    criticality: critical
  - name: Vulkan
    relation: runtime-dependency
    criticality: critical
  - name: VulkanMemoryAllocator
    relation: runtime-dependency
    criticality: optional
  - name: dawn
    relation: runtime-dependency
    criticality: optional
  - name: SPIRV-Tools
    relation: runtime-dependency
    criticality: optional
  - name: SPIRV-Cross
    relation: runtime-dependency
    criticality: optional
  - name: wuffs
    relation: runtime-dependency
    criticality: optional
  - name: angle
    relation: runtime-dependency
    criticality: optional
  - name: SwiftShader
    relation: runtime-dependency
    criticality: optional
  - name: Highway
    relation: runtime-dependency
    criticality: critical
  - name: GN
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: glslang
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="skia" %}

# Skia

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Skia<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Skia is a 2D graphics library that serves as the rendering engine for Google Chrome, ChromeOS, Android, Flutter, and several other products. It handles rasterization, image decoding, text rendering, path operations, and GPU-accelerated compositing. The library is written in C++ (C++20 minimum, Clang 21 preferred) and exposes a stable C++ API with additional bindings in Python (skia-python), Rust (rust-skia, tiny-skia), and C# (SkiaSharp).

**Governance:** Skia is sponsored and managed by Google, per [skia.org](https://skia.org/). There is no independent foundation or multi-stakeholder governance body. Reviews happen on Gerrit at [skia-review.googlesource.com](https://skia-review.googlesource.com), gated by a root `OWNERS` file (wildcard `*`, broadly open) combined with per-directory `OWNERS` files, a `CQ_COMMITTERS` list, `AUTHORS`, and a `CONTRIBUTING` guide. Core engineering is performed by the Google Skia team; outside patches must clear OWNERS review and a CLA. There is no publicly documented platform-tier system (unlike LLVM, Rust, or Zig's Tier 1/2/3 model) and no `MAINTAINERS` file naming an architecture owner.

**License:** BSD 3-Clause (copyright 2011 Google Inc.).

**Corporate sponsors / contributors with riscv64-adjacent activity:** Google (primary; owns all riscv64-relevant reviews), StarFive Technology (Chang Rebecca Swee Fun, build-system CL), ISCAS - Institute of Software, Chinese Academy of Sciences (ANGLE riscv support via dependency roll). Historical wildcard author entries in the broader codebase also include ARM, Intel, Microsoft, Samsung, NVIDIA, Adobe, Meta, Amazon, Collabora, Igalia, LG Electronics, Linaro, JetBrains, Sony Mobile, and Loongson (LoongArch SIMD contributor).

**Culture on new ports:** The project's explicit, on-record policy is reactive and CI-gated. On [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916), maintainer Heather Miller (Google, OWNERS of `gn/BUILDCONFIG.gn`) gave a Code-Review -1 to a riscv64 GN-detection patch, stating: "Let's not add this to our build until it is being supported and used. Happy to discuss priority use cases if/when they are there." Reviewer Ben Wagner (Google) reinforced this on the same CL: "Skia cannot really claim support for an architecture for which it doesn't have test bots... You may wish to communicate with hcm about possibly supporting riscv." This establishes CI-bot presence as a precondition for architecture recognition, not a follow-on deliverable. A 2020 skia-discuss thread ("Compiling Skia for RISC-V and POWER," [groups.google.com](https://groups.google.com/g/skia-discuss/c/F6qLDK8C9BQ)) shows maintainer Mike Klein never committing to support ("Probably!", "Gumption, I imagine" when asked how); the requester hit unresolved header-compatibility issues and the thread ended inconclusively.

**RISE membership:** Google LLC is a RISE Premier Member (one of 8, alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent); the RISE member roster lists 20 organizations total, not individual projects, and Skia is not itself a listed RISE project. No RISE blog post (the full 2024-2026 index was checked directly) mentions Skia. The only concrete RISE-adjacent artifact is community (unfunded) work in `riseproject-dev/python-wheels` building riscv64 wheels for skia-python and skia-pathops, run on RISE's native riscv64 CI runner fleet (RISE RISC-V Runners, 13,000+ jobs / 197 repos / 87 orgs / 99.78% completion as of May 2026) but authored outside any RISE RFP.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-07-07 | skia-discuss thread: user asks if RV64GC/POWER compilation is feasible; maintainer Mike Klein replies "Probably!" / "Gumption, I imagine"; requester hits header-compatibility issues, thread ends unresolved | [skia-discuss thread](https://groups.google.com/g/skia-discuss/c/F6qLDK8C9BQ) |
| 2022-04-05 | SwiftShader dependency roll includes riscv64 marl/LLVM/subzero additions (StarFive-authored upstream, 2022-04-04) | Skia commit 6d59d396 (dependency roll) |
| 2022-12-15 | ANGLE dependency roll includes "Add riscv64 support" | Skia commit f50fe872 (dependency roll) |
| 2023-01-23 | "Disable thinLTO in skia for riscv" - first riscv64-specific commit in Skia's own `gn/gn_to_bp.py`, by Aditya Kumar (Google), tied to Android-internal bug b/254713216 | [Gerrit CL 631163](https://skia-review.googlesource.com/c/skia/+/631163), merged 2023-01-31, first shipped in Chrome M112 |
| 2023-02-27 | Premature revert of the thinLTO disable | [Gerrit CL 649756](https://skia-review.googlesource.com/c/skia/+/649756), merged, shipped Chrome M113 |
| 2023-02-27/28 | Reland of the thinLTO disable | [Gerrit CL 650276](https://skia-review.googlesource.com/c/skia/+/650276), merged, shipped Chrome M113 (same milestone as its own revert) |
| 2023-04-11 | "gn: BUILDCONFIG.gn: add riscv64 architecture detection in gn phase" submitted by Chang Rebecca Swee Fun (StarFive Technology), evidencing a working StarFive VisionFive 2 browser bring-up; blocked by Heather Miller's Code-Review -1 | [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916), still open, stalled since 2023-04-27 |
| 2023-05-17 | ANGLE roll includes "[riscv64][android] support 64-bit builds on riscv64" (tao.wang.2261@gmail.com) | Skia commit c4cff376 (dependency roll) |
| 2023-05-22 | Final revert of the thinLTO workaround by Noelle Scobie (Google): "b/254713216 is marked fixed" - thinLTO stays enabled for riscv64 from this point on | [Gerrit CL 701418](https://skia-review.googlesource.com/c/skia/+/701418), merged, first shipped Chrome M115 (2023-07-18) |
| 2023-05-29 | ANGLE roll: "[riscv64][android] skip 2nd abi support for pure 64-bit android" | Skia commit 19af8f05 (dependency roll) |
| 2023-11-27 | ANGLE roll: "[riscv] Add riscv support" from yahan@iscas.ac.cn (ISCAS) | Skia commit 9fa62cce (dependency roll) |
| 2025-03-31 | "Add gn and ninja tool download support for riscv64 architecture" submitted by yx g; got Code-Review +1 and briefly Commit-Queue +2 from Eric Boren, then the SkCQ bot revoked the vote: "Author not found in AUTHORS file" | [Gerrit CL 972256](https://skia-review.googlesource.com/c/skia/+/972256), still open, stalled since 2025-03-31 |
| 2025-09-16 | "Disable must_tail on GCC when compiling for RISC-V" merged same-day in the skcms sub-repo (Daniel Dilan: Code-Review +1, Commit-Queue +2); internal bug b/444048022, inspired by a patch from Heinrich Schuchardt | [skcms Gerrit CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198), merged 2025-09-16; not yet in any Skia release (skcms has no version tags, ships only via a future DEPS roll into a `chrome/mNNN` branch) |
| 2025-12-08 | SwiftShader roll fixes "riscv64 build problem with LLVM 16" (Levi Zim, rsworktech@outlook.com) | Skia commit 895fa741 (dependency roll) |

**Key contributors:** Aditya Kumar (Google) authored the initial Android thinLTO workaround; Noelle (Nolan) Scobie (Google) relanded and finally removed it. Chang Rebecca Swee Fun (StarFive Technology) submitted the GN build-system recognition CL that remains blocked 2.5+ years later. yahan@iscas.ac.cn (ISCAS) contributed ANGLE riscv64 support that reached Skia via dependency rolls. Kaylee Lubick (Google) authored the 2025 skcms tail-call fix. yx g submitted the stalled gn/ninja fetch-tooling CL.

**Upstreaming status:** No single tracking issue for a Skia riscv64 port exists on issues.skia.org, bugs.chromium.org/p/skia, or skia-discuss. RISC-V support in Skia's own repository is thin and reactive: the net riscv64-specific code change to the Skia source tree (excluding the fully-reverted thinLTO saga and the single-line skcms guard) is effectively zero. Both CLs that would make the GN/Bazel build system and host-tooling fetch scripts formally aware of riscv64 remain open and blocked - 972256 on a procedural AUTHORS-file bot rejection (stalled since 2025-03-31), 668916 on an explicit policy objection (stalled since 2023-04-27). Confirmed directly: `gn/BUILDCONFIG.gn`, `infra/bots/jobs.json`, `infra/bots/tasks.json`, and `infra/bots/gen_tasks_logic/gen_tasks_logic.go` were read in full and contain zero riscv/riscv64 references. The more active, successfully merged riscv64 enablement work is happening one layer downstream - in SkiaSharp, conda-forge's skia-feedstock/skia-pathops-feedstock, and the RISE python-wheels project - not in Skia's own repository (see Sections 9 and 10).

---

## 3. Upstream Support Tier

**Formal tier policy:** None. Skia publishes no tier document. The [skia.org About page](https://skia.org/about/) lists supported platforms as Windows, macOS, iOS, Android, and Linux (x86/ARM); RISC-V is not listed. The de facto policy, stated explicitly on [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916), is that CI test-bot presence is a precondition for architecture recognition, not a goal to work toward after acceptance.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as supported | Yes | Yes | No |
| CI bots | Yes (Linux, Mac, Win) | Yes (Android, iOS) | None (confirmed: zero matches in `infra/bots/jobs.json`, 2,487 lines, and `infra/bots/tasks.json`, 73,185 lines) |
| Release-blocking | Yes | Yes | Not applicable |
| Official upstream binaries | None (library only) | None (library only) | None (library only) |
| Build system (GN) target_cpu recognition | Full | Full | Absent - falls through `BUILDCONFIG.gn` without triggering arch-specific logic; CL 668916 to add it is blocked |
| Bazel platform target | `linux_x64` defined | `linux_arm64` defined | Not defined in `bazel/platform/BUILD.bazel` or `bazel/common_config_settings/BUILD.bazel` |
| Distro packaging | Debian sid/forky, Ubuntu 26.04 | Debian sid/forky, Ubuntu 26.04 | Debian sid/forky, Ubuntu 26.04 "resolute" (confirmed, see Section 8) |
| SIMD optimizations | Full (SSE through AVX-512) | NEON | None (scalar fallback only) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Skia's architecture-specific performance work lives in `src/opts/`. `src/core/SkOpts.cpp` dispatches at runtime between SIMD backends based on `SK_CPU_X86` and `SK_CPU_LOONGARCH` branches only; there is no `#elif` branch for RISC-V, so `Init()` falls through and simply returns, leaving whatever generic/portable C++ function pointers were set at compile time in place. This is not a RISC-V-specific scalar implementation - it is the same unspecialized default any unrecognized CPU receives by omission.

`include/private/SkFeatures.h` / `src/core/SkCpu.h` define `SK_CPU_*` macros and runtime feature-detection for x86 (via `cpuid`), LoongArch (via `getauxval`), and ARM64/ARM32/PPC. No `SK_CPU_RISCV` macro and no `__riscv` or RVV-related guard exists anywhere in the CPU-detection headers. The hand-tuned `src/opts/` directory contains dedicated files for LoongArch (e.g. `SkOpts_lasx.cpp`, 4 files) but zero riscv/RVV files. Skia's SkVM JIT (used for SkSL runtime-effect code generation) emits native code only for x86-64 and ARM64 register files; riscv64 therefore has no JIT code-generation target and can only ever run the portable bytecode interpreter, not a RISC-V-specific limitation but the absence of any backend at all.

| Component | amd64 (files) | arm64 (approach) | LoongArch (files) | riscv64 |
|---|---|---|---|---|
| Raster pipeline ops | `SkOpts_ml3.cpp`, `SkOpts_ml4.cpp` (9 files total) | Inline NEON guards in shared headers | `SkOpts_lasx.cpp` (4 files) | Missing - scalar fallback by omission |
| Blitter/swizzler | `SkBlitRow_opts_ml3.cpp`, `SkSwizzler_opts_ml3.cpp`, 5 others | Inline NEON in headers | `SkBlitRow_opts_lasx.cpp`, `SkSwizzler_opts_lasx.cpp` | Missing |
| Memory ops | `SkMemset_opts_avx.cpp`, `SkMemset_opts_erms.cpp` | Scalar fallback | Scalar fallback | Missing |
| CPU feature detection | `SK_CPU_X86`, SSE/AVX macros | `SK_CPU_ARM64`, `SK_ARM_HAS_NEON` | `SK_CPU_LOONGARCH`, LSX/LASX macros | No `SK_CPU_RISCV`, no `__riscv` detection anywhere |
| Runtime dispatch | `SkCpu.cpp` reads cpuid | No runtime dispatch (static NEON) | `getauxval` check | Not present; `SkOpts::Init()` falls through |
| Tail-call pipeline (skcms) | Enabled | Enabled | Data not available: not verified | Disabled via `!defined(__riscv)` guard in `modules/skcms/src/skcms_internals.h` (GCC `musttail` not supported on RV) |
| GPU backends (Graphite/Ganesh, Vulkan/Dawn) | Full | Full | Data not available | Builds via the portable Vulkan path; GPU driver availability on actual riscv64 SoCs (SpacemiT, ESWIN), not the Skia code, is the constraint |
| SkVM JIT | None (x86-64/ARM64 backends exist for SkSL) | Native codegen | None | No RISC-V backend; interpreter-only |
| Hand-written assembly | None in current tree | None in current tree | None | None |

**SIMD quality summary:** amd64 and arm64 receive hand-tuned intrinsics across raster pipeline, blitting, and memory operations; riscv64 is scalar (width-1) across every one of these components, confirmed by directory listing of `src/opts/` and by reading `src/core/SkCpu.h` and `SkOpts.cpp` directly - no `SK_CPU_RISCV`/RVV path is being suppressed or stubbed, it simply does not exist.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GN (Generate Ninja) is Skia's primary and only fully supported build system; there is no `configure` script and no project `CMakeLists.txt` for the library itself (a 5-line unrelated test project exists at `experimental/lowp-basic/CMakeLists.txt`, and `infra/docker/cmake-release/` wraps GN to emit a CMake IDE project with no architecture parameter). A migration to Bazel is in progress but incomplete.

**riscv64 GN status (confirmed by direct file read):** `gn/BUILDCONFIG.gn` enumerates known `target_cpu` values as `arm64`, `arm`, `x64`, `x86`, `wasm` (plus `loong64` branches in `gn/BUILD.gn`/`gn/skia/BUILD.gn` for LoongArch-specific cflags). Unrecognized values, including `riscv64`, pass through without triggering any architecture-specific logic. [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916) would add an explicit riscv64 detection block but has sat with a Code-Review -1 since 2023-04-27.

**Bazel status:** `bazel/platform/BUILD.bazel` defines platforms for `linux_x64`, `mac_x64`, `mac_arm64`, `windows_x64`, `linux_arm64`, `android_arm32`, `android_arm64`, `ios` - no `riscv64` constraint. `bazel/common_config_settings/BUILD.bazel` enumerates CPU config settings as x86_64, arm64, wasm only.

**Working build path (the Debian/Ubuntu packaging approach, the only one verified to work on riscv64):**
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
No `target_cpu` is set; GN infers the CPU from the native build host. This works on a native riscv64 machine because GN's CPU inference does not require the `target_cpu` string to be a recognized constant for a native (non-cross) build. Cross-compilation to riscv64 is not supported upstream: no riscv64 toolchain stanza exists in `gn/toolchain/BUILD.gn` (which defines toolchains only for MSVC, `gcc_like` covering GCC/Clang on Linux/macOS/iOS/tvOS, Android NDK, and Emscripten/WebAssembly), and `infra/cross-compile/docker/` contains only a `cross-linux-arm64/Dockerfile` (built from `launcher.gcr.io/google/clang-debian9`, using `binutils-aarch64-linux-gnu`/`libc6-dev-arm64-cross`); no riscv64 counterpart exists among the repository's 25 Dockerfiles.

**Compiler requirement:** C++20 is the general minimum documented at [skia.org/docs/user/build](https://skia.org/docs/user/build/) ("Clang 21 implements most of the features of the C++20 standard; older compilers that lack C++20 support may produce non-obvious compilation errors"), with Clang preferred for codec/rasterization performance. Debian's packaging pins GCC 14 minimum. Neither requirement is riscv64-specific; no riscv64 ISA-extension minimum (e.g. RVV, rv64gc profile) is documented anywhere, because riscv64 is not a build system citizen.

**Known build issues:**
- GCC does not support Clang's `[[clang::musttail]]`/`must_tail` codegen on RISC-V. Fixed in the skcms sub-repo via `!defined(__riscv)` guard, [CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198) (merged 2025-09-16). The same failure mode was independently hit and patched downstream: WebKitGTK (which bundles Skia's skcms module) failed with `cannot tail-call: tail call production failed` at `modules/skcms/src/Transform_inl.h:810`; a meta-oe/OpenEmbedded patch (webkitgtk3 2.50.6, 2026-04-28, author Yi Zhao) sets `CXXFLAGS:append:riscv64 = " -DSKCMS_HAS_MUSTTAIL=0"` for the same reason.
- The thinLTO/riscv64 interaction tracked as Android-internal bug b/254713216 was fully resolved by May 2023; no remaining issue affects GN/Ninja builds.
- The two tool-fetch scripts, `bin/fetch-gn` and `bin/fetch-ninja`, do not recognize riscv64 as a download target - [CL 972256](https://skia-review.googlesource.com/c/skia/+/972256), stalled since March 2025, would add it; until it lands, a riscv64 host must build its own GN and Ninja from source. This exact gap was independently hit and worked around by the RISE python-wheels build (PR #2378): "gn compiler built from source (CIPD has no riscv64 gn)."
- SwiftShader (Skia's software rasterizer dependency): a riscv64 build problem with LLVM 16 was fixed by Levi Zim and rolled into Skia on 2025-12-08 (missing forward-declaration includes in `RISCVELFStreamer.h` handling).

**QEMU:** No QEMU usage is documented anywhere in Skia's build system; a repository-wide search for the string `qemu` returned zero matches. The Debian package is built natively on buildd host `rv-manda-04`. Conda-forge's skia-feedstock instead cross-compiles riscv64 from a linux-64 host without QEMU, mapping conda platform IDs to GN CPU targets directly.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Raster pipeline (SkRasterPipeline) | Full SIMD (AVX2/AVX-512) | NEON | Scalar fallback only |
| Image blitting (SkBlitRow, SkSwizzler) | Full SIMD | NEON | Scalar fallback only |
| Color management (skcms) | Intrinsics + tail-call | Intrinsics + tail-call | Scalar; tail-call disabled on GCC via `!defined(__riscv)` guard |
| Text shaping (HarfBuzz) | Full | Full | Full (no arch-specific code in HarfBuzz) |
| Font rasterization (FreeType) | Full | Full | Full (pure C, no arch-specific code) |
| Image decode - JPEG (libjpeg-turbo) | SIMD (SSE2/AVX2) | SIMD (NEON) | Scalar in the distro-shipped binary; the Ubuntu 26.04 `libjpeg-turbo8` package predates the upstream RVV SIMD merge by roughly 3.5 years |
| Image decode - WebP (libwebp) | SIMD (SSE2/NEON) | SIMD (NEON) | An RVV SIMD path exists upstream, gated by compiler version; no riscv64 CI means a Dec-2025 silent-correctness RVV-intrinsic regression (issue #769/PR #771) shipped undetected and was caught only by downstream OpenCV hardware testing |
| Image decode - JPEG XL (libjxl) | SIMD via Highway | SIMD via Highway | RVV dispatch exists in Highway but is gated off at libjxl's pinned Highway version (open [google/highway#2854](https://github.com/google/highway/issues/2854)) |
| GPU - Vulkan (Graphite/Ganesh) | Full | Full | Builds via the portable path; GPU driver availability on real riscv64 SoCs is the gating constraint, not Skia's Vulkan integration code |
| GPU - Dawn/WebGPU | Full | Full | Builds (CPU/SwiftShader Vulkan fallback path); same GPU-driver-availability constraint |
| Build system recognition | Full | Full | Absent ([CL 668916](https://skia-review.googlesource.com/c/skia/+/668916) blocked) |
| CI coverage | Full | Full | None |

**Functional gaps:** No documented functional gaps. Skia compiles and produces correct output on riscv64 via the scalar fallback; no known NaN or floating-point correctness bug is filed against Skia itself for riscv64. A distinct silent-correctness regression was caught in dependency libwebp (see above) precisely because riscv64 lacks CI - this is a process risk rather than a current known defect.

**Performance gaps:** All `SkRasterPipeline` operations, image blitting, swizzling, and memory operations run at scalar (width-1) throughput on riscv64; typical SIMD-vs-scalar deltas for raster pipeline operations of this kind run in the 4x-16x range depending on operation width. Data not available: no published riscv64-vs-arm64 or riscv64-vs-amd64 quantitative Skia benchmark (fps, ms/frame, nanobench/GM deltas) was found in any source searched, including the Skia issue tracker, skia-discuss, the RISE blog (27 posts reviewed across 2024-2026, none Skia-specific), or AOSP. The closest available data point is qualitative: Canonical's Flutter/Skia RISC-V port (Valentin Haudiquet), tested on StarFive JH7110 hardware under the RVA23 profile, reports "viable frame rates" with GPU acceleration explicitly noted as lagging behind x86/Arm, with no numeric figures published ([OMG! Ubuntu, 2025-11-22](https://www.omgubuntu.co.uk/2025/11/ubuntu-risc-v-flutter-support)).

**Security hardening gaps:** Skia's PartitionAlloc allocator disables ARM MTE and x86 PKU on architectures that do not support them; both are simply absent on riscv64 with no functional regression. No other riscv64-specific security hardening gap is documented.

---

## 7. CI/CD Infrastructure

**Skia's own CI:** Skia uses Google's internal Gerrit Commit Queue plus a bespoke task scheduler defined in `infra/bots/`. The authoritative job list `infra/bots/jobs.json` (2,487 lines) and the full generated task graph `infra/bots/tasks.json` (73,185 lines) were both fetched and decoded directly (not summarized from search) and grepped for "riscv": zero matches in either file. `infra/bots/gen_tasks_logic/gen_tasks_logic.go` enumerates architectures as `amd64`, `x86`, `x86_64`, `arm`, `arm64`, and `wasm` only. Sample job names confirm these are the real production files (`BazelBuild-core-release-linux_x64`, `Build-Mac-Clang-arm64-Debug`, `Test-Android-Clang-Pixel5-GPU-Adreno620-arm64-Release-All-Android`). The `checkout_riscv64` variable added to depot_tools (rolled into Skia around 2025-05-29) indicates infrastructure awareness but is not wired to any active CI bot in the public repository. [NEEDS VERIFICATION: whether `checkout_riscv64` backs any Google-internal Skia CI not visible publicly.]

**GitHub:** google/skia's GitHub presence is a source mirror only; it carries no project-authored `.github/workflows/` directory. The CodeQL, Dependabot, and Dependency Graph workflows visible there are GitHub-managed dynamic workflows, not Skia-authored CI.

**On the "CI-adjacent" riscv64 evidence:** None of the riscv64-touching CLs add a CI job. CL 972256 patches only `bin/fetch-gn`/`bin/fetch-ninja` (local tooling, not CI config) and is unmerged. CL 668916 patches only `BUILDCONFIG.gn` and is unmerged. [CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198) is a source-code portability fix, not a CI change. The thinLTO CL chain touches `gn_to_bp.py` (an Android.bp generator), not Skia's CI job list, and nets to no change (thinLTO re-enabled, same as other architectures). Downstream CI (SkiaSharp, Avalonia, conda-forge feedstocks, skia-python/skia-pathops via RISE) all runs in those projects' own pipelines, not Skia's.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | No |
| Test CI | Yes | Yes | No |
| GPU CI | Yes | Yes (Android) | No |
| QEMU emulation CI | N/A | N/A | No (zero `qemu` matches repo-wide) |
| RISE runners used by Skia itself | No | No | No (RISE runners are used only by the downstream python-wheels project, not by Skia's own CI) |
| Native hardware available | Yes | Yes | No upstream bots; Debian packaging builds natively on buildd host `rv-manda-04` |

---

## 8. Distribution and Release Status

**Upstream binary releases:** google/skia publishes no binary releases of any kind, for any architecture; the GitHub mirror is source-only.

**Debian:** `libskia146` / `libskia-dev` (source package `libskia`, version `146.20260311+dfsg-4ubuntu1` in the Ubuntu line, and a comparable `146.20260414~git.ef5f213+dfsg-5`-series build in Debian sid/forky) builds and ships for riscv64 natively on Debian buildd host `rv-manda-04`. Confirmed on `packages.debian.org` ([libskia146](https://packages.debian.org/sid/libskia146)) and, independently, via the Launchpad archive API: `libskia146` in `resolute riscv64` has publishing status "Published," component `universe`, with an underlying build record showing `buildstate: "Successfully built"`, `arch_tag: "riscv64"`, `datebuilt: 2026-04-14`, and a real build log. Not available in Debian bookworm (stable).

**Ubuntu:** Confirmed via `packages.ubuntu.com` (search for suite `resolute`, cross-checked via curl after repeated WebFetch 503s) and the Launchpad publishing ledger (an independent source from the HTML scraper): Ubuntu 26.04 "resolute" ships `libskia-dev` and `libskia146` (146.20260311+dfsg-4ubuntu1) for riscv64 alongside amd64, arm64, armhf, ppc64el - all in the `universe` component. No `libskia` package exists in Ubuntu Noble, Jammy, or Focal; the only riscv64-available "skia" hits on those older releases are `librust-tiny-skia-dev`/`librust-tiny-skia-path-dev`, a separate Rust crate unrelated to Google's Skia.

**PyPI (skia-python):** Current version 144.0.post2, 45 release files. Confirmed via direct PyPI JSON API query: platforms covered are `macosx_arm64/x86_64`, `manylinux_2_28_{aarch64,x86_64}`, `win_amd64/arm64` - zero riscv64 wheels, in this release or any prior one. A plain package literally named `skia` does not exist on PyPI (404). `skia-pathops` (current version 0.9.2, 12 files) likewise ships no riscv64 wheel on PyPI; its riscv64 build lives only in the RISE project's separate wheel index (see Section 10), not on PyPI itself.

**Arch Linux RISC-V port:** Confirmed via direct query of `archriscv.felixc.at`: the string "skia" does not appear anywhere on the page. No Skia package exists in the Arch Linux RISC-V unofficial repository.

**To get a working riscv64 binary today:** Install `libskia146`/`libskia-dev` from Ubuntu 26.04 "resolute" or Debian sid/forky on a riscv64 system (the simplest path, and the only one backed by a clean, unpatched upstream-source build - see Section 13), or build from source on a native riscv64 machine using GCC 14+/Clang with the GN args in Section 5 (self-built GN/Ninja required, since CIPD/`fetch-gn` has no riscv64 binaries). For skia-python or skia-pathops specifically, a user must either build from source or consume the RISE project's own wheel index, since no riscv64 wheel exists on PyPI.

---

## 9. Dependencies

| Dependency | Role / Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Open Issues |
|---|---|---|---|---|---|
| FreeType | Font rasterization (runtime, critical) | Builds cleanly, pure C, no riscv64-specific code | No upstream riscv64 CI | Ubuntu 26.04 resolute (`libfreetype6`/`-dev`), Debian sid | None open |
| HarfBuzz | Text shaping (runtime, critical) | Builds cleanly, zero arch-specific code | No dedicated riscv64 CI; no known failures | Ubuntu 26.04 resolute (12/15 packages, 12.3.2-2), Debian | None found |
| ICU | Unicode/i18n, bidi (runtime, optional) | Builds; no riscv64-specific code | Not CI-gated for riscv64 (23 upstream workflows checked, none riscv64) | Ubuntu 26.04 resolute (`libicu78` 78.2-2ubuntu1), Debian sid, Arch RISC-V | None open; CI gap only |
| libpng | PNG codec (runtime, optional) | Builds; an RVV filter path exists upstream, off by default and gated to a libpng16 branch not shipped as the default libpng18 | No dedicated riscv64 CI | Ubuntu 26.04 resolute (`libpng16-16t64`/`-dev` 1.6.57-1) | Issue #705 (configure.ac arch override), closed 2025-07-05 |
| libjpeg-turbo | JPEG codec (runtime, optional) | Builds; Ubuntu 26.04 package predates the upstream RVV SIMD merge by ~3.5 years, so riscv64 users get scalar-only performance | Partial; no dedicated riscv64 CI | Ubuntu 26.04 resolute (2.1.5-4ubuntu4, scalar-only) | RVV SIMD merge delayed 3.5 years on funding/hardware/review; package lag is the open risk, not a build blocker |
| libwebp | WebP codec (runtime, optional) | Builds; an RVV SIMD path exists, gated by compiler version | No riscv64 CI; a Dec-2025 silent-correctness regression (bad RVV intrinsic, issue #769/PR #771) shipped undetected, caught only via downstream OpenCV hardware testing | Ubuntu 26.04 resolute (`libwebp7` etc., 1.5.0-0.1build1) | No open blockers; CI gap is the top flagged risk |
| libavif | AVIF codec (runtime, optional) | Builds; depends on dav1d (RVV, partial checklist coverage) and SVT-AV1 (no RVV) | QEMU-only CI for dav1d, no native riscv64 hardware | Ubuntu 26.04 resolute (`libavif16` 1.3.0-1ubuntu4, 8 archs) | Open dav1d GitLab #463 (static cross-link), MR !1825 stalled |
| libjxl | JPEG XL codec (runtime, optional) | Builds cleanly; depends on Highway for SIMD | No riscv64 CI upstream | Ubuntu 26.04 resolute (`libjxl0.11`/`-dev` 0.11.1-6ubuntu4, lags primary archs on security patch level) | Depends on Highway; RVV dispatch gated off at libjxl's pinned Highway version (open [google/highway#2854](https://github.com/google/highway/issues/2854)) |
| libyuv | YUV/RGB color conversion, image scaling (runtime, optional) | Not independently researched this cycle | Not researched | Not researched | Data not available: no dedicated status check performed |
| brotli | Compression, WOFF2 font paths (runtime, optional) | riscv64 support (`BROTLI_TARGET_RISCV64`) has been upstream since 2018 | No upstream riscv64 CI/binaries | Contradictory Ubuntu 26.04 resolute data: one check found riscv64 present (1.2.0-3build1), an adversarial re-check via Debian's madison tool found it absent for Ubuntu specifically; satisfied regardless via Debian sid/Alpine edge | RVV perf PR #1410 stalled on CLA; not a correctness blocker |
| expat | XML parsing (runtime, optional) | Builds; riscv64 has build+test CI parity with amd64 via an emulated `qemu.yml` workflow | Yes (QEMU) | Ubuntu 26.04 resolute (`libexpat1`/`-dev` 2.7.4-1, ports component) | None open; the strongest-rated dependency in this set |
| zlib | Compression (runtime, optional) | Builds, pure C, no arch-specific fast path | CI only via an OpenBSD/riscv64 vm-action, not native Linux | Ubuntu (`zlib1g`/`-dev` 1:1.3.dfsg-3.1ubuntu2, confirmed on 24.04 noble; near-certain on 26.04 given package universality) | None |
| Abseil | C++ base/utility library, used by Skia and Dawn (runtime, critical) | Builds; riscv64 stack unwinder upstream | No dedicated riscv64 test gate | Ubuntu 26.04 resolute (`libabsl-dev`/`libabsl20260107` 20260107.0-4) | #1986 CRC32C HW-accel PR blocked on Google obtaining RISC-V hardware ("internal champion required" governance bottleneck, not a technical objection); #2002 `hashtablez`/`cordz` test SEGFAULT on Debian riscv64, open, no upstream response |
| PartitionAlloc | Memory allocator used in Clang builds (runtime, critical) | Builds; ARM MTE and x86 PKU hardening gracefully disabled (both absent on riscv64 by design, not a regression) | No dedicated riscv64 CI known | Bundled in Chromium/Skia | None |
| Vulkan | GPU backend for Graphite/Ganesh (runtime, critical) | Builds (headers/loader are portable C) | Requires Vulkan-capable riscv64 hardware for meaningful testing | Bundled | Real risk is GPU-driver availability on actual riscv64 SoCs (SpacemiT, ESWIN), not the Vulkan SDK components themselves |
| VulkanMemoryAllocator | Vulkan allocator helper (runtime, optional) | Portable C++; a vendored-version `snprintf` header gap surfaced during SkiaSharp's riscv64 bring-up (clang-19/Alpine cross-compile), fixed via SkiaSharp follow-up PR #3194 | No dedicated riscv64 CI | Bundled | None open against VMA upstream itself |
| dawn | WebGPU implementation (runtime, optional) | `docs/building.md` lists only x86-64/arm64 as supported Linux archs; isolated riscv64 macros added in 2022; a CIPD riscv64-detection PR (#78) closed unmerged | No riscv64 CI | Not released independently of Chromium | SwiftShader (critical path for headless/no-GPU riscv64) is the concrete named blocker |
| SPIRV-Tools | SPIR-V validation/optimization (runtime, optional) | Portable C++, no arch-specific code expected | Not independently researched | Not researched | None flagged; characterized as a non-concern by the Khronos/Vulkan-stack review done for `dawn` |
| SPIRV-Cross | SPIR-V to GLSL/HLSL/MSL cross-compiler (runtime, optional) | Portable C++ | Not researched | Not researched | None flagged |
| wuffs | Fast image decoding (PNG, GIF) (runtime, optional) | Builds; no riscv64 SIMD intrinsics | No riscv64 CI | Bundled | None |
| angle | GLES-over-native-GPU-API translation layer (runtime, optional) | 4 merged riscv64-enabling CLs (narrow scope: TLS handling, Android GN build fix) via ISCAS/StarFive/Google contributors | No riscv64 CI; zero riscv64 LUCI builders or GitHub releases found | No formal releases for any arch (rolled via Chromium) | Transitively depends on SwiftShader, which carries the real open riscv64 history |
| SwiftShader | CPU-based Vulkan/GL software renderer, used by Dawn/ANGLE/Skia's GPU fallback (runtime, optional) | LLVM-based JIT (Reactor) has explicit riscv64 code-model guards; functional since 2023; a 2025-12-08 LLVM-16 build fix (Levi Zim) rolled into Skia | Not release-blocking, commit-queue gated only | No standalone releases (vendored) | Most actively maintained riscv64 path in this dependency group (StarFive + Google + independent commits through 2026); remains the named blocker for Dawn's/ANGLE's software-rendering fallback until fully mature |
| Highway | SIMD abstraction library used by libjxl and optionally Skia's own raster pipeline (runtime, critical) | Builds; RVV backend upstream since 2021 | No dedicated riscv64 test gate; QEMU CI discussed but not confirmed merged [NEEDS VERIFICATION] | No upstream binary; Debian sid packages `libhwy` | [#2554](https://github.com/google/highway/issues/2554) Clang 20 reports undeclared RVV intrinsics, open since April 2025, no fix (GCC and Clang <20 unaffected); [#2854](https://github.com/google/highway/issues/2854) mold linker `.riscv.attributes` issue (workaround: use ld.bfd/ld.lld); [#2738](https://github.com/google/highway/issues/2738) `-march` mismatch on RVA23 |
| GN | Build-dependency, critical | No precompiled riscv64 binary exists in CIPD; `bin/fetch-gn` lacks a riscv64 dictionary entry (stalled [CL 972256](https://skia-review.googlesource.com/c/skia/+/972256)) | N/A (tooling, not a library) | Must be built from source on riscv64 hosts; this exact gap was hit and worked around independently by both the RISE python-wheels build and conda-forge's skia-feedstock | Core blocker for frictionless riscv64 developer onboarding |
| Ninja | Build-dependency, critical | Same `bin/fetch-ninja` gap as GN, same stalled CL 972256 | N/A | Must be built from source or obtained from distro packages | Same CL 972256 blocker |
| GCC | Build-dependency, critical | Debian packaging pins GCC 14 minimum; does not support Clang's `musttail` attribute on RISC-V, requiring the skcms guard (CL 1056198) | N/A | Ships natively via Debian/Ubuntu riscv64 archives | musttail-support gap is the one named GCC-specific riscv64 build issue |
| LLVM | Build-dependency, optional (Clang path) | Clang 21 preferred per skia.org build docs for C++20 feature completeness and codec/rasterization performance; no riscv64-specific minimum documented | No riscv64-specific CI noted | Ships via distro packages | None specific to Skia's use; general RISC-V backend maturity tracked separately in LLVM itself |
| glslang | GLSL to SPIR-V shader compiler (build-dependency, optional) | Portable C++, no arch-specific code expected | Not independently researched | Not researched | None flagged |

**Additional indirect dependencies identified via research (transitive, Vulkan/SPIR-V stack):** SPIRV-Headers (header-only, architecture-neutral), Vulkan-Headers, Vulkan-Loader, and Vulkan-ValidationLayers - all characterized, in the research done for `dawn` and `VulkanMemoryAllocator`, as pure portable C/C++ with no architecture-specific code; the real riscv64 risk in this stack is GPU-driver availability on actual riscv64 hardware (SpacemiT, ESWIN SoCs), not these libraries.

**Highway deep-dive (critical path):** Highway's RVV backend has been upstream since 2021, with runtime dispatch re-enabled in April 2026 (PR #2968, per the prior report's tracking). The blocking issue for production use with modern toolchains is [#2554](https://github.com/google/highway/issues/2554): Clang 20 reports undeclared RVV intrinsics, open since April 2025 with no fix; GCC and Clang versions below 20 are unaffected. This directly affects libjxl's RVV path within Skia's dependency chain.

**Abseil-cpp deep-dive:** [#2002](https://github.com/abseil/abseil-cpp/issues/2002) documents test SEGFAULTs for `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` specifically on Debian riscv64, open with no upstream response. These are test-only failures to date; library correctness under normal use is not confirmed to be affected but cannot be ruled out given the lack of riscv64 CI or upstream response.

---

## 10. Ecosystem Status

Skia itself is a C++ library with no package-manager-native plugin ecosystem, but it has a substantial dependent-binding ecosystem that must independently add riscv64 support on top of Skia's own (begrudging, ad-hoc) buildability - and in practice this downstream layer is where almost all of the real, successfully-merged riscv64 enablement work has happened.

**SkiaSharp (.NET bindings):** [mono/SkiaSharp#3191](https://github.com/mono/SkiaSharp/issues/3191) requested riscv64 flavors of libSkiaSharp/libHarfBuzzSharp (opened 2025-03-08); [PR #3192](https://github.com/mono/SkiaSharp/pull/3192) added `linux-riscv64`/`linux-musl-riscv64` build targets, merged 2025-03-12 (3 days), baselined on Debian 12 + Clang 19. A follow-up fix (PR #3194) addressed a missing `snprintf` header surfaced by a stale vendored VulkanMemoryAllocator during the riscv64 bring-up. This was then consumed by [AvaloniaUI/Avalonia#18571](https://github.com/AvaloniaUI/Avalonia/pull/18571) (merged 2025-05-19), which bumped Avalonia's SkiaSharp/HarfBuzzSharp dependency to pull in the new riscv64 (and LoongArch64) native libraries.

**conda-forge:** [skia-feedstock PR #2](https://github.com/conda-forge/skia-feedstock/pull/2) (merged) added riscv64 to the `libskia` conda build matrix, cross-compiled from linux-64 since no CIPD riscv64 `gn` exists. [skia-pathops-feedstock PR #38](https://github.com/conda-forge/skia-pathops-feedstock/pull/38) (merged 2026-09-25) mirrored this for `skia-pathops`, built in-container; a notable constraint is that `python_min` resolves to 3.14 on riscv64 (3.11 is unavailable there), giving the abi3 extension a `cpython>=3.14` floor rather than the usual 3.11 baseline.

**RISE python-wheels (skia-python, skia-pathops):** [riseproject-dev/python-wheels#1895](https://github.com/riseproject-dev/python-wheels/issues/1895) (opened 2026-09-13, status open/unassigned) tracks the request for a published riscv64 `skia-python` wheel. [PR #1697](https://github.com/riseproject-dev/python-wheels/pull/1697) (merged 2026-09-12) built `skia-python` 144.0.post2 for riscv64 cp312/cp313/cp314/cp314t, bootstrapping GN from source, dropping musllinux, and patching GPU-context tests to skip on riscv64 since the Rocky 10 build image has no virtual X server. [PR #2378](https://github.com/riseproject-dev/python-wheels/pull/2378) (merged 2026-09-28) built `skia-pathops` 0.9.2 for riscv64 as a Cython extension statically linked against a slimmed-down Skia (no GPU/codecs/fonts), with libskia itself built in-container via skia-builder's `build_skia.py` since no riscv64 upstream binary exists. Both are unfunded/community-contributed (author luhenry) under the RISE Project's Python Wheels initiative, run on the RISE RISC-V Runners native CI fleet (`riseproject-dev/riscv-runner`). **This work is not reflected on PyPI** - the riscv64 wheels are published only to RISE's own package index, confirmed by the fact that `pypi.org/pypi/skia-python/json` and `pypi.org/pypi/skia-pathops/json` list no riscv64 files as of this check.

**Flutter (consumes Skia as its rendering engine):** No official Google-built Flutter engine exists for riscv64. Canonical's own port (Valentin Haudiquet; [flutter/flutter#178711](https://github.com/flutter/flutter) and [#178712](https://github.com/flutter/flutter)) cross-compiles the Flutter engine for RISC-V and targets Ubuntu 25.10 for a "fully functional desktop session," tested on StarFive JH7110 hardware with GPU acceleration explicitly lagging x86/Arm. Downstream tooling has not caught up: [leoafarias/fvm#969](https://github.com/leoafarias/fvm/issues/969) (closed 2025-11-12) documents the Flutter Version Manager fetching the wrong (arm64) Dart SDK/engine binary on riscv64 hosts, causing `Exec format error`, because no prebuilt riscv64 engine binary exists upstream.

**Ecosystem coverage summary:** Of the major consumer bindings, SkiaSharp (and its consumer Avalonia) has shipped riscv64 support in production since March-May 2025; conda-forge's two feedstocks shipped in September 2026; RISE's python-wheels builds exist but are not on PyPI and remain an open tracking issue; and Flutter's riscv64 engine remains an unofficial, community-driven port with no numeric performance data published. None of this ecosystem work depends on, or is blocked by, the two stalled Gerrit CLs in Skia's own repository - each downstream project works around the gap independently with hand-rolled GN/toolchain overrides.

---

## 11. Known Bugs and Active Issues

| ID | Title | Project | Status | Severity | Notes |
|---|---|---|---|---|---|
| [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916) | gn: BUILDCONFIG.gn: add riscv64 architecture detection | Skia | Open, blocked since 2023-04-27 | Blocker for build-system formalization | Heather Miller (Google) Code-Review -1: "not until there are test bots" |
| [Gerrit CL 972256](https://skia-review.googlesource.com/c/skia/+/972256) | Add gn and ninja tool download support for riscv64 | Skia | Open, stalled since 2025-03-31 | Blocker for frictionless developer tooling | Had Code-Review +1 and briefly Commit-Queue +2; SkCQ bot revoked it, "Author not found in AUTHORS file" |
| [skcms CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198) | Disable must_tail on GCC when compiling for RISC-V | skcms | Merged 2025-09-16 | Fixed correctness/build issue | GCC `musttail`/tail-call unsupported on RV; independently also hit and patched by WebKitGTK's meta-oe recipe |
| [mono/SkiaSharp#3191](https://github.com/mono/SkiaSharp/issues/3191) / [#3192](https://github.com/mono/SkiaSharp/pull/3192) | riscv64 build support | SkiaSharp | Closed / merged 2025-03-12 | Resolved | Fast turnaround (3 days); follow-up VMA `snprintf` fix in PR #3194 |
| [riseproject-dev/python-wheels#1895](https://github.com/riseproject-dev/python-wheels/issues/1895) | skia-python riscv64 support | RISE python-wheels | Open, unassigned | Medium - blocks PyPI availability | Build exists (PR #1697); not yet published to a riscv64-visible index on PyPI |
| [Highway #2554](https://github.com/google/highway/issues/2554) | Clang 20 RVV intrinsics undeclared | Google Highway | Open since 2025-04, no fix | Medium (Clang 20 only) | Breaks the Highway-accelerated path used by libjxl within Skia's dependency chain; GCC and Clang <20 unaffected |
| [Highway #2854](https://github.com/google/highway/issues/2854) | mold linker `.riscv.attributes` issue | Google Highway | Open | Low (workaround known) | Use ld.bfd or ld.lld instead of mold |
| [Abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) | `hashtablez`/`cordz` test SEGFAULT on Debian riscv64 | Abseil-cpp | Open, no upstream response | Low (test-only confirmed) | Possible library-correctness implication not ruled out given no upstream response and no riscv64 CI |
| [Abseil-cpp #1986](https://github.com/abseil/abseil-cpp/issues/1986) | CRC32C hardware-acceleration PR | Abseil-cpp | Open since Dec 2025 | Low | Blocked on Google obtaining riscv64 hardware; a governance/resourcing bottleneck, not a technical objection |
| libwebp issue #769 / PR #771 | Bad RVV intrinsic, silent correctness regression | libwebp | Fixed, but shipped undetected for a period | Medium (illustrates the CI-gap risk) | Caught only via downstream OpenCV hardware testing, not libwebp's own CI |
| b/254713216 | thinLTO failure on riscv64 in Android build | Android internal | Closed/Fixed 2023-05 | Historical | Resolved via a Soong-side global emulated-TLS fix; the Skia-side workaround was fully reverted once this closed |

**No known correctness bugs in Skia's own core rendering code on riscv64 are publicly documented.** The scalar fallback produces correct output; the one correctness-adjacent regression found in this research cycle (libwebp's RVV intrinsic bug) occurred in a dependency, not in Skia itself, and underscores the risk created by the absence of riscv64 CI across the whole dependency chain rather than a defect in Skia's own code.

---

## 12. Objections and Upstream Blockers

**Stated policy blocker (primary):** Heather Miller (Google, OWNERS of `gn/BUILDCONFIG.gn`), Code-Review -1 on [CL 668916](https://skia-review.googlesource.com/c/skia/+/668916): "Let's not add this to our build until it is being supported and used. Happy to discuss priority use cases if/when they are there." Ben Wagner (Google) on the same CL: "Skia cannot really claim support for an architecture for which it doesn't have test bots." This is an explicit, unambiguous precondition: riscv64 CI must exist before Skia will formally recognize the architecture in its build system, not the other way around.

**Procedural blocker:** [CL 972256](https://skia-review.googlesource.com/c/skia/+/972256) shows that even a narrowly-scoped, policy-uncontroversial patch (adding riscv64 to tool-fetch scripts) can stall indefinitely on process friction alone - it had a reviewer's Code-Review +1 and a brief Commit-Queue +2, but the commit-queue bot revoked the vote because the author's email was not in the AUTHORS file, and no one has since re-submitted or fixed the AUTHORS entry.

**Resource blocker:** No Google-funded riscv64 CI infrastructure exists for Skia. Google is a RISE Premier Member but has not directed RISE funding specifically toward Skia riscv64 enablement; the only RISE-adjacent riscv64 work on Skia-derived packages (skia-python, skia-pathops) is unfunded, community-contributed work by a single author (luhenry) under the Python Wheels initiative.

**No public roadmap item:** No master tracking issue exists on issues.skia.org, bugs.chromium.org/p/skia, or skia-discuss for a riscv64 port. No AOSP external/skia branch addresses riscv64 specifically.

**Technical blockers for performance work (should the policy blocker be cleared):**
1. No `SK_CPU_RISCV` macro and no `__riscv` detection in `SkFeatures.h`/`SkCpu.h` - required before any RVV SIMD work can begin.
2. `SkRasterPipeline_opts.h` has no RVV dispatch path - requires a parallel implementation alongside the existing NEON/AVX2/LASX paths.
3. `src/core/SkCpu.cpp` has no `getauxval(AT_HWCAP)` RISC-V runtime detection for RVV - required for dynamic dispatch.
4. `gn/opts.gni` and `src/opts/BUILD.bazel` would need riscv64-specific entries to compile any new `SkOpts_rvv.cpp`.
5. [Highway #2554](https://github.com/google/highway/issues/2554) (Clang 20 RVV intrinsics undeclared) must be resolved before Highway-accelerated dependency paths (libjxl) work reliably with modern Clang on riscv64.

**Acceptance probability:** Low in the near term without an external organization providing durable CI infrastructure and sustained engineering. The LoongArch precedent (4 dedicated files in `src/opts/`, full LASX raster-pipeline support) demonstrates that Google does accept third-party architecture contributions when CI coverage is provided and the port is actively maintained - but StarFive's 2023 attempt ([CL 668916](https://skia-review.googlesource.com/c/skia/+/668916)) stalled specifically because it arrived without CI infrastructure attached. A contribution package including CI bots (or an accepted QEMU-based alternative), CPU detection, and at least a stub `SkOpts_rvv.cpp` would be necessary, though per Heather Miller's -1, not automatically sufficient, to clear the stated bar.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification:** Skia has zero riscv64 CI of any kind in its own infrastructure, confirmed by directly reading `infra/bots/jobs.json`, `infra/bots/tasks.json`, and `infra/bots/gen_tasks_logic/gen_tasks_logic.go`, which enumerate amd64/x86/arm/arm64/wasm only, plus a repository-wide search finding no "riscv" string in any CI task-generation file. On [Gerrit CL 668916](https://skia-review.googlesource.com/c/skia/+/668916), maintainer Heather Miller explicitly declines to add riscv64 build-system recognition: "Let's not add this to our build until it is being supported and used." With no upstream CI, the project falls to the distribution floor: Debian sid/forky and Ubuntu 26.04 "resolute" both build and ship `libskia146`/`libskia-dev` for riscv64 natively (Debian buildd host `rv-manda-04`; [packages.debian.org/sid/libskia146](https://packages.debian.org/sid/libskia146)), and no riscv64-specific packaging patches were found in this research - the one riscv64 build fix identified (the skcms `must_tail` guard in [CL 1056198](https://skia-review.googlesource.com/c/skcms/+/1056198)) was merged into upstream source itself, not applied as a downstream distro patch. This is therefore a clean, unpatched distro build, which sets the color to yellow rather than orange. Skia is a general-purpose 2D rendering/graphics library, not a SIMD/compression/crypto speed-optimization library, so the optimization-purpose modifier does not apply even though its raster pipeline currently falls back to scalar code on riscv64 - the "Optimization level" field is therefore omitted from this report's header.

**Pending work that could change the grade:** Two stalled Gerrit CLs could change the CI picture if they land: [972256](https://skia-review.googlesource.com/c/skia/+/972256) (gn/ninja riscv64 tool-fetch support, blocked on an AUTHORS-file bot rejection since 2025-03-31) and [668916](https://skia-review.googlesource.com/c/skia/+/668916) (GN BUILDCONFIG.gn riscv64 target_cpu detection, blocked by a Code-Review -1 since 2023-04-27, pending upstream CI bots). No RISE funding or RISE blog coverage targets Skia itself, though RISE-adjacent community work (`riseproject-dev/python-wheels` PR #1697/#2378) builds riscv64 wheels for skia-python and skia-pathops downstream of upstream Skia source. Open issues in transitively-critical dependencies - [Google Highway #2554](https://github.com/google/highway/issues/2554) (Clang 20 RVV intrinsics undeclared) and [Abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) (riscv64 test SEGFAULTs) - could also affect the grade if they regress the clean build.

---

## 14. Investment Analysis

RISE has directed no funded work at Skia itself; the only RISE-adjacent activity is unfunded community work on downstream wheel packaging (skia-python, skia-pathops). The full scope below is therefore open, and none of it should be treated as already covered by RISE.

### 14.1 Functional Enablement

1. Add `SK_CPU_RISCV` detection and `__riscv` guards to `include/private/SkFeatures.h`.
2. Add riscv64 `target_cpu` handling to `gn/BUILDCONFIG.gn` and a corresponding platform to `bazel/platform/BUILD.bazel` - effectively a rework of the stalled CL 668916 with CI evidence attached, since that is the maintainers' stated precondition.
3. Add `getauxval(AT_HWCAP)` RISC-V vector detection to `src/core/SkCpu.cpp`.
4. Create a stub `src/opts/SkOpts_rvv.cpp` (even if initially empty) and wire it into `gn/opts.gni` and `src/opts/BUILD.bazel`.
5. Re-submit or fix CL 972256 (AUTHORS-file issue) so `bin/fetch-gn`/`bin/fetch-ninja` support riscv64 hosts.

### 14.2 Performance Optimization

In order of estimated impact:

1. **SkRasterPipeline RVV backend** (`src/opts/SkRasterPipeline_opts.h`): implements the core fill, compositing, and color-conversion operations using RISC-V Vector intrinsics - the single largest performance lever, covering the entire raster path.
2. **SkBlitRow / SkSwizzler RVV**: bitmap blit and pixel-format conversion; high throughput impact for image compositing.
3. **SkBitmapProcState RVV**: bilinear and nearest-neighbor sampling in image shaders.
4. **skcms RVV color conversion + tail-call re-enable**: re-enable the tail-call transform pipeline on riscv64 (contingent on a GCC fix or a Clang-based build) and add RVV color-conversion intrinsics.
5. **Dependency-level RVV work**: libjpeg-turbo's RVV SIMD exists upstream but the distro package is ~3.5 years stale; validating and refreshing packaging would unlock it for Skia's JPEG decode path without any Skia-side code change. libwebp has no RVV SIMD at all for YUV conversion/IDCT; implementing it would benefit all WebP-heavy workloads.

### 14.3 CI/CD Infrastructure

This is the gating investment - per the maintainers' own stated policy, no upstream patch touching architecture recognition will be accepted without it.

1. Provision riscv64 CI bots on Google's Swarming infrastructure, or negotiate acceptance of QEMU-based runners (or RISE's native riscv64 runner fleet, already proven at scale on the downstream python-wheels project) as a precondition for accepting patches.
2. Wire the existing `checkout_riscv64` depot_tools variable (present since May 2025) to at least a build-only CI task in `infra/bots/gen_tasks_logic/`.
3. Add a riscv64 cross-compile Dockerfile to `infra/cross-compile/docker/`, parallel to the existing `cross-linux-arm64/`.

### 14.4 Ecosystem Enablement

1. **skia-python riscv64 wheel to PyPI:** The RISE python-wheels project has already built riscv64 wheels for skia-python (PR #1697) and skia-pathops (PR #2378); the remaining gap, tracked in open issue #1895, is getting those wheels onto PyPI itself rather than only RISE's own index. Low-to-moderate effort, since the build recipe already exists.
2. **rust-skia / tiny-skia riscv64:** `fetch-gn`'s lack of a riscv64 binary (same root cause as CL 972256) blocks Rust-ecosystem builds that rely on precompiled GN; resolving CL 972256 upstream would unblock this with no additional Rust-specific work required.
3. **Flutter engine riscv64:** Canonical's community port (flutter/flutter #178711/#178712) is the only path today; it is unofficial and has no published performance data. Engaging with or upstreaming this effort would close a real gap for Flutter/riscv64 desktop use cases, though this is Flutter-project work, not Skia-project work, and should be scoped and owned separately.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | CPU detection macros + GN/Bazel build recognition (rework of CL 668916 with CI evidence) | 1 | Qualcomm / external contributor | Critical |
| Functional | Fix/resubmit CL 972256 (gn/ninja riscv64 tool fetch, AUTHORS-file issue) | 1 | External contributor | High |
| CI/CD | riscv64 build CI on Skia's own infrastructure (Swarming or accepted QEMU/RISE-runner alternative) | 3 | Qualcomm + Google negotiation | Critical (gates all upstream acceptance per stated policy) |
| CI/CD | Cross-compile Docker image for riscv64 | 1 | External contributor | High |
| Performance | SkRasterPipeline RVV backend (`SkRasterPipeline_opts.h`) | 8 | Qualcomm | High |
| Performance | SkBlitRow + SkSwizzler RVV | 4 | Qualcomm | High |
| Performance | SkBitmapProcState RVV (image sampling) | 3 | Qualcomm | Medium |
| Performance | skcms RVV color conversion + tail-call re-enable | 3 | Qualcomm | Medium |
| Performance | libwebp RVV SIMD (YUV + IDCT) | 6 | External / RISE RFP | Medium |
| Ecosystem | Publish skia-python / skia-pathops riscv64 wheels to PyPI (close issue #1895) | 1 | RISE python-wheels contributor | Medium |
| Ecosystem | libjpeg-turbo riscv64 packaging refresh (validate existing RVV SIMD in distro) | 1 | External / RISE | Low |

---

## 15. References

- [Skia source repository (Gerrit-hosted)](https://skia.googlesource.com/skia)
- [Skia homepage](https://skia.org/)
- [Skia About page (supported platforms)](https://skia.org/about/)
- [Skia build documentation](https://skia.org/docs/user/build/)
- [Gerrit CL 668916 - riscv64 BUILDCONFIG.gn detection (stalled)](https://skia-review.googlesource.com/c/skia/+/668916)
- [Gerrit CL 972256 - gn/ninja riscv64 tool fetch support (stalled)](https://skia-review.googlesource.com/c/skia/+/972256)
- [Gerrit CL 631163 - Disable thinLTO for riscv](https://skia-review.googlesource.com/c/skia/+/631163)
- [Gerrit CL 649756 - Revert thinLTO disable](https://skia-review.googlesource.com/c/skia/+/649756)
- [Gerrit CL 650276 - Reland thinLTO disable](https://skia-review.googlesource.com/c/skia/+/650276)
- [Gerrit CL 701418 - Final revert of thinLTO disable](https://skia-review.googlesource.com/c/skia/+/701418)
- [skcms Gerrit CL 1056198 - Disable must_tail on GCC for RISC-V](https://skia-review.googlesource.com/c/skcms/+/1056198)
- [skia-discuss thread - Compiling Skia for RISC-V and POWER (2020)](https://groups.google.com/g/skia-discuss/c/F6qLDK8C9BQ)
- [Debian libskia146 package (sid, riscv64)](https://packages.debian.org/sid/libskia146)
- [mono/SkiaSharp issue #3191 - riscv64 flavor request](https://github.com/mono/SkiaSharp/issues/3191)
- [mono/SkiaSharp PR #3192 - Add riscv64 build support](https://github.com/mono/SkiaSharp/pull/3192)
- [AvaloniaUI/Avalonia PR #18571 - SkiaSharp/HarfBuzzSharp version bump for riscv64](https://github.com/AvaloniaUI/Avalonia/pull/18571)
- [conda-forge/skia-feedstock PR #2 - Add linux-riscv64 build](https://github.com/conda-forge/skia-feedstock/pull/2)
- [conda-forge/skia-pathops-feedstock PR #38 - Add linux-riscv64 build](https://github.com/conda-forge/skia-pathops-feedstock/pull/38)
- [riseproject-dev/python-wheels issue #1895 - skia-python riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/1895)
- [riseproject-dev/python-wheels PR #1697 - skia-python riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1697)
- [riseproject-dev/python-wheels PR #2378 - skia-pathops 0.9.2 riscv64 wheel](https://github.com/riseproject-dev/python-wheels/pull/2378)
- [RISE project homepage](https://riseproject.dev/)
- [RISE RISC-V Runners, six weeks in (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE easy installation of binary Python packages on riscv64 (May 2025)](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [Igalia blog - Boosting RISC-V application performance, LLVM journey](https://blogs.igalia.com/compilers/2025/05/05/boosting-risc-v-application-performance-an-8-month-llvm-journey/)
- [flutter/flutter PR #178711 - get toolkit working on RISC-V](https://github.com/flutter/flutter/pull/178711)
- [flutter/flutter PR #178712 - cross-compile Flutter engine for RISC-V](https://github.com/flutter/flutter/pull/178712)
- [OMG! Ubuntu - Canonical's Flutter/Skia RISC-V port](https://www.omgubuntu.co.uk/2025/11/ubuntu-risc-v-flutter-support)
- [leoafarias/fvm issue #969 - wrong arch64 engine fetched on riscv64](https://github.com/leoafarias/fvm/issues/969)
- [skia-python on PyPI](https://pypi.org/project/skia-python/)
- [skia-pathops on PyPI](https://pypi.org/project/skia-pathops/)
- [Google Highway issue #2554 - Clang 20 RVV intrinsics undeclared](https://github.com/google/highway/issues/2554)
- [Google Highway issue #2854 - mold linker .riscv.attributes](https://github.com/google/highway/issues/2854)
- [Google Highway issue #2738 - -march mismatch on RVA23](https://github.com/google/highway/issues/2738)
- [Abseil-cpp issue #1986 - CRC32C hardware acceleration PR](https://github.com/abseil/abseil-cpp/issues/1986)
- [Abseil-cpp issue #2002 - test SEGFAULT on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [Abseil-cpp issue #1702 - missing -latomic on riscv64 cross-compile](https://github.com/abseil/abseil-cpp/issues/1702)
- [Arch Linux RISC-V unofficial port](https://archriscv.felixc.at/)