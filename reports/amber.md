---
title: amber
---

# amber

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for amber<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[google/amber](https://github.com/google/amber) is a multi-API shader test framework (Vulkan, with work-in-progress Dawn/WebGPU support) written in portable C++17. It provides a domain-specific scripting language (AmberScript, and legacy VkScript) for describing GPU pipeline tests, and is embedded as the scripting engine inside Khronos's Vulkan Conformance Test Suite (VK-GL-CTS) at `external/vulkancts/modules/vulkan/amber`, per the project's own `docs/amber.md`.

The repository is hosted under the `google` GitHub org, is Apache-2.0 licensed, and its README explicitly states it is "not an officially supported Google product." Governance is informal: contributions require a Google CLA (cla.developers.google.com), all changes go through GitHub PR review, and the project follows [Google's Open Source Community Guidelines](https://opensource.google.com/conduct/). There is no MAINTAINERS/OWNERS/CODEOWNERS file, no RFC process, no steering committee, and no PLATFORMS.md/SUPPORT.md file. The AUTHORS file (copyright holders) lists only two entities: **Google LLC** and **Advanced Micro Devices, Inc.**

Corporate contributors by affiliation:
- **Google**: David Neto (`dneto0`, most active current maintainer - CI/kokoro, dependency rollers, Android/NDK builds), Dan Sinclair (`dj2`, top all-time contributor at 330 commits), Jaebaek Seo (`jaebaek`, 62 commits), Ben Clayton (`ben-clayton`), Natalie Chouinard (`sudonatalie`, Dawn/WebGPU backend), Steven Perron (`s-perron`), Alan Baker (`alan-baker`)
- **AMD**: `jiaoluAMD` (ray-query feature support, 2026); AMD is also a named copyright holder in AUTHORS
- **Igalia**: Ricardo Garcia (`rg3igalia`), Hugues Evrard (`hevrard`, ex-GraphicsFuzz)
- **LunarG**: `ziga-lunarg`, `jeremyg-lunarg`
- **NVIDIA**: Piers Daniell (`pdaniell-nv`)
- **Collabora**: Faith Ekstrand (`gfxstrand`)
- **Khronos**: Lorenzo Dal Col (`lordalcol`, self-described "Vulkan-GL CTS tech lead for Khronos")

Repo stats as of the research date: 227 stars, 75 forks, 78 open issues, created November 2018, not archived (last push 2026-06-04).

**Community stance on new ports**: no explicit statements were found either welcoming or discouraging RISC-V - the topic has never surfaced in the project's 8-year history. The codebase is portable, architecture-agnostic C++17 (CMake/Ninja build), with only isolated `CMAKE_SYSTEM_PROCESSOR` overrides for ChromeOS aarch64 cross-compilation. Small portability patches (e.g., a GCC-13 header-compliance fix from a Yocto/OpenEmbedded maintainer, see Section 2) get merged without friction, suggesting a low-barrier, patches-welcome culture by default for build-portability fixes generally.

## 2. Port History and Upstreaming Timeline

**No RISC-V port exists and none has ever been attempted.** Exhaustive searches (GitHub issue search, PR search, GraphQL search, code search, and a full paginated dump of all 1116 issues+PRs in the repo, all states, filtered for "riscv"/"riscv64"/"risc-v" in title and body) return zero genuine hits.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, issue, or PR has ever been filed against google/amber | Confirmed via `gh search issues`/`gh search prs`/GraphQL search/code search, all returning 0 results |

The only adjacent activity found is a January 2023 build-portability fix by Khem Raj (commit `b77d9227`, [PR #1016](https://github.com/google/amber/pull/1016), "include missing `<cstdint>`"), which fixed a GCC-13 strict-header-include build break. Khem Raj is a Yocto Project/OpenEmbedded maintainer whose GitHub bio lists `@riscv` and `@yoctoproject`, but the fix itself is architecture-agnostic - a standards-compliance patch affecting all platforms under newer GCC, not a RISC-V-targeted change. This is not RISC-V port work and is noted here only because it is the closest thing to a RISC-V-affiliated contributor touching the codebase.

**15 PRs match the substring "riscv"**, but every one is a routine, bot-authored "Rolling N dependencies" auto-roll PR (#916, #895, #883, #828, #810, #809, #789, #787, #772, #765, #764, #761, #760, #758, #746, spanning Dec 2019-Oct 2020). The matched text is an auto-generated changelog dump of upstream `third_party/clspv-llvm` / `third_party/dxc` (LLVM/compiler-rt) commits being vendored transitively, and some of those upstream commit messages happen to contain "[RISCV]" (e.g., "[RISCV] Fix test for inline asm z constraint modifier," "[RISCV-V] Provide muldi3 builtin assembly implementation," "[RISCV] ELF attribute section for RISC-V."). These describe RISC-V work inside LLVM's own repository, not any change to Amber. Deep-read verification confirmed all 15 PRs merged (12) or closed unmerged (3: #828, #764, #760) with zero human review comments on any of them (`gh api repos/google/amber/pulls/{n}/comments` returns empty for all).

**Is it fully upstream?** Not applicable - there is no port to be upstream or out-of-tree. RISC-V support does not exist in any form, staged or otherwise.

## 3. Upstream Support Tier

**No formal tier policy exists.** There is no documented platform-support tier system anywhere in the repository (no PLATFORMS.md, no tiered CI matrix documentation).

The de facto tier structure is defined entirely by what the Kokoro CI matrix builds and tests:

| Platform | Tier (de facto) | Evidence |
|---|---|---|
| Linux amd64 (gcc, clang) | Actively built and tested | `kokoro/linux-clang-debug`, `linux-clang-release`, `linux-gcc-debug`, `linux-gcc-debug-dawn`, `linux-gcc-release`, `linux-gcc-release-clspv` - all on `ubuntu-24.04-amd64` Docker image |
| Windows amd64 | Actively built and tested | `kokoro/windows-vs2022-amd64-debug`, `windows-vs2022-amd64-release` |
| macOS (clang) | Actively built and tested | `kokoro/macos-clang-debug`, `macos-clang-release` |
| Android arm64-v8a, armeabi-v7a, x86_64 | Actively built and tested (NDK) | `kokoro/ndk-build/{arm64-v8a,armeabi-v7a,x86_64}`, added/expanded via [PR #1108](https://github.com/google/amber/pull/1108) "Test abis," merged Jan 2026 |
| riscv64 | **Does not exist** | No CI job, no build target, no Docker image, no ABI entry anywhere |

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (Linux, Windows, Android NDK x86_64) | Yes (Android NDK arm64-v8a; ChromeOS cross-compile documented in README) | No |
| CI test | Yes | Yes (Android) | No |
| Official binaries | No (no GitHub releases/tags exist for any arch) | No | No |
| Release-blocking status | N/A (no release process at all - project ships as rolling `main`, 0 tags, 0 releases per `gh api repos/google/amber/releases` and `/tags`) | N/A | N/A |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Amber has **no CPU-architecture-specific code path for any architecture**, including amd64 and arm64, not just riscv64. It is a Vulkan/Dawn conformance-test harness: all shader/GPU computation is delegated to whatever driver is under test (system Vulkan driver, SwiftShader software renderer, or Dawn/WebGPU backend). The C++ harness code that drives test scripts and validates results compiles identically regardless of host CPU ISA.

`src/platform.h` is the only architecture/platform preprocessor-guard file in the codebase, and it branches exclusively on **operating system**, not CPU architecture: `AMBER_PLATFORM_WINDOWS`, `AMBER_PLATFORM_LINUX`, `AMBER_PLATFORM_FREEBSD`, `AMBER_PLATFORM_APPLE`, `AMBER_PLATFORM_FUCHSIA`, `AMBER_PLATFORM_QNX`. GitHub code search confirms zero hits for `__aarch64__`, `__x86_64__`, or `#ifdef __riscv` anywhere in the repo. A full recursive `grep` of a shallow clone for `riscv|rvv|vfloat32m1|vsetvl|__riscv` (case-insensitive, including `third_party/`) returned zero matches.

The repo's 593-file tree contains zero `.s`/`.asm` assembly files and zero files with `simd`/`intrinsic`/`neon`/`sse`/`avx` in the path, for any architecture.

### Component-by-component verdict

| Component | amd64/x86_64 | arm64 | riscv64 |
|---|---|---|---|
| Core Amber library (`src/`) | Scalar, portable C++ (OS-guarded only) | Scalar, portable C++ (same code) | Missing (no arch guard exists at all, positive or negative) |
| SIMD / vectorized paths | None exist | None exist | None exist |
| Assembly (`.s`/`.asm`) | None exist | None exist | None exist |
| Android NDK ABI list (`Application.mk`) | Listed (commented-out alternate, `x86_64`) | Listed (active default, `arm64-v8a`) | Missing (absent from both active and commented alternates) |
| Kokoro CI build targets | `linux-*`, `windows-*`, `macos-*`, ndk `x86_64` | ndk `arm64-v8a`, `armeabi-v7a` | Missing (no target exists) |

**The only place "architecture" appears in the project at all** is the Android NDK ABI build list (`samples/jni/Application.mk`, `android_test/jni/Application.mk`: `APP_ABI := arm64-v8a # armeabi-v7a x86 x86_64`) and the matching Kokoro `ndk-build` CI subdirectories. riscv64 is simply absent from that list - it is not disabled, stubbed, or TODO'd, it was never added.

**Conclusion:** because Amber delegates all GPU compute to the driver under test, adding riscv64 support would not require writing any architecture-specific C++ code in Amber itself. It would require only (a) an NDK/CI configuration change to add a riscv64 build target, and (b) availability of a riscv64 Vulkan driver (hardware or SwiftShader) to actually run tests against.

## 5. Build System, Cross-Compilation, and Toolchain

**No riscv64 build documentation, CMake toolchain file, Dockerfile, or CI job exists in google/amber.**

### What was checked (all confirmed absent)
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `docs/build.md` (all 404). The only `docs/` files are AmberScript language docs (`amber.md`, `amber_script.md`, `engines.md`, `memory_layout.md`, `vk_script.md`).
- Root and `third_party/CMakeLists.txt` contain no `riscv` string and no `CMAKE_SYSTEM_PROCESSOR` branch for riscv.
- No `cmake/riscv64.cmake` or any toolchain file for any architecture; the only two `.cmake` files in the repo are `src/dawn/find_dawn.cmake` and `src/vulkan/find_vulkan.cmake`.
- No Dockerfiles exist in the repo at all; CI pulls a prebuilt image, `us-east4-docker.pkg.dev/shaderc-build/radial-docker/ubuntu-24.04-amd64/cpp-builder` - explicitly amd64 in the image path itself.
- Zero QEMU references anywhere in the repo (code search and full tree scan both empty).

### Generic build (any architecture, from README.md)

```
git clone https://github.com/google/amber.git
cd amber
./tools/git-sync-deps
mkdir -p out/Debug && cd out/Debug
cmake -GNinja ../..
ninja
```

Requirements: Git, CMake (repo's `cmake_minimum_required` is 3.22), Ninja, Python 3. CI-pinned toolchain versions (Kokoro, amd64 only): `cmake-3.31.2`, `ninja-1.10.0`, `python-3.12`, `gcc-15`, `clang-18`.

### Closest available precedent: ChromeOS aarch64 cross-compile (README.md)

This is the only non-native-architecture build path documented in the project, and would be the template to follow for a riscv64 port:

```
cmake -GNinja \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=aarch64 \
  -DCMAKE_C_COMPILER=aarch64-cros-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=aarch64-cros-linux-gnu-g++ \
  -DUSE_GAS=OFF \
  ../..
```

(`USE_GAS=OFF` avoids the host trying to run a cross-compiled `asm_offset` helper binary.) No equivalent riscv64 invocation exists anywhere - upstream, in issues, or in PRs.

**Known build failures for riscv64**: none documented, because no one has attempted the build. Data not available: riscv64-specific build failure reports.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core AmberScript/VkScript test execution | Full | Full | Not buildable (no CI, no verified build) |
| Vulkan backend (system driver) | Full | Full | Untested upstream |
| SwiftShader backend (`AMBER_ENABLE_SWIFTSHADER`) | Full | Full (implied by Android NDK builds) | Partial at best - see Section 9; SwiftShader's Subzero JIT explicitly excludes riscv64, and the LLVM-backend path requires a non-default LLVM 16 build |
| Dawn/WebGPU backend | WIP (per repo scope) | Not confirmed | Not confirmed |
| DXC (HLSL) backend (`AMBER_USE_DXC`) | Opt-in, built | Not confirmed | Untested - DXC not packaged in Debian for any arch signal, no riscv64 CI |
| clspv (OpenCL-to-SPIR-V) backend (`AMBER_USE_CLSPV`) | Opt-in, built | Not confirmed | Untested - not packaged in Debian, no riscv64 issues/PRs |
| Android NDK build | x86_64 | arm64-v8a, armeabi-v7a | Absent (no ABI entry; NDK itself does not currently ship a riscv64 ABI, consistent with upstream) |

**Functional gaps**: Amber cannot currently be built at all on riscv64 through any documented or CI-verified path - there is no confirmed-working build, let alone a tested one. This is a build/CI gap, not a functional-code gap, since the core harness has no architecture-specific logic (Section 4).

**Performance gaps**: Data not available: no RISC-V performance benchmarks exist for Amber. The closest generic (non-architecture-specific) performance work is [PR #1051](https://github.com/google/amber/pull/1051) "Initial amber microbenchmarks for performance testing core gpu features and functionality" (merged Sept 2024), which added GPU-shader microbenchmarks (`tests/benchmarks/{bandwidth,conditional,parallel_advantage,shared_local}/*.amber`) run through whatever Vulkan driver is under test. These measure GPU-shader performance, not RISC-V CPU performance, and the project's own README labels them "WIP, as-is, not considered stable." No published results exist in the PR or its review.

**Security hardening gaps**: Data not available: no riscv64-specific hardening discussion found (e.g., no CFI/shadow-stack/pointer-auth analog discussion for riscv64, consistent with the project having no arch-specific code to harden).

**NaN / floating-point semantics issues**: No RISC-V-specific NaN or floating-point bug exists. The only NaN-related history is [PR #859](https://github.com/google/amber/pull/859) "Fix probing when either value is a NaN" and [PR #595](https://github.com/google/amber/pull/595) "Add support for 'NaN' as a double value" - both are general AmberScript probe-comparison logic fixes, architecture-agnostic, unrelated to RISC-V.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified directly by fetching file content (not just text search):

- `.github/workflows` does not exist: `gh api repos/google/amber/contents/.github/workflows` returns 404. The parent `.github` directory itself also returns 404 - there are zero GitHub Actions workflows in the repository.
- No other CI config file exists at the repo root: `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml` all 404.
- The actual CI system is **Kokoro** (Google-internal), under `kokoro/`. All 57 files in that tree were fetched and read in full (every `build.sh`/`build.bat`, `continuous.cfg`, `presubmit.cfg`, `build-docker.sh` across all 15 build targets). Case-insensitive grep for `riscv|risc-v|risc_v` across all 57 files: **0 matches**. Grep for `qemu`: **0 matches**.
- Every Linux/Android Docker build hard-codes `us-east4-docker.pkg.dev/shaderc-build/radial-docker/ubuntu-24.04-amd64/cpp-builder` - amd64 in the path itself.
- No RISE-provided riscv64 runners are used or referenced anywhere in the repo.

### Comparison table: amd64 vs arm64 vs riscv64

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build target exists | Yes (`linux-clang-*`, `linux-gcc-*`, `windows-vs2022-amd64-*`, ndk `x86_64`) | Yes (ndk `arm64-v8a`, `armeabi-v7a`) | No |
| Test execution | Yes | Yes (Android) | No |
| Docker image | `ubuntu-24.04-amd64/cpp-builder` | N/A (NDK cross-build from amd64 host) | No image exists |
| QEMU emulation | N/A (native) | Not used (NDK cross-build, no emulated test run found) | Not used (doesn't exist) |
| RISE-hosted runners | N/A | N/A | Not used |

## 8. Distribution and Release Status

**google/amber has zero GitHub releases and zero tags.** `gh api repos/google/amber/releases` returns `[]`; `gh api repos/google/amber/tags` returns `[]`. The project ships exclusively as a rolling `main` branch with no versioned artifacts of any kind, for any architecture. It is consumed by downstream projects (VK-GL-CTS, SwiftShader, Dawn build trees) as a vendored source dependency, not a distributed binary.

| Channel | Package found | Is it google/amber? | riscv64 available |
|---|---|---|---|
| GitHub Releases | None exist | - | No (no artifacts of any kind, any arch) |
| PyPI (`pypi.org/pypi/amber/json`) | `amber` exists, 0 files uploaded ever; description is for an unrelated Python REST-API client wrapper | No | No |
| RISE GitLab wheel builder | Redirects to the same empty PyPI index | No | No |
| Ubuntu 24.04 (noble) | `amber` = Go HTML templating engine (`eknkc/amber`); listed for amd64, arm64, armhf, ppc64el, **riscv64**, s390x | No | Yes, but wrong project |
| Debian tracker | `amber` redirects to `golang-github-eknkc-amber` (same Go templating engine); riscv64 buildd status "Installed," version `0.0~git20171010.cdade1c-2+b14`, built on `rv-osuosl-04` | No | Yes ("Installed"), but wrong project |
| Arch Linux RISC-V (`archriscv.felixc.at`) | No package named "amber" exists | - | No |

**Critical caveat**: every downstream packaging system with a package literally named "amber" is a namespace collision with `golang-github-eknkc-amber`, an unrelated Go HTML templating engine. This package does have riscv64 builds in Ubuntu and Debian, but that fact provides zero signal about google/amber (the Vulkan/Dawn shader test framework) and must not be cited as evidence of RISC-V readiness for the actual research subject.

**What a user must do to get a working binary**: build from source using the generic CMake/Ninja flow (Section 5) on any architecture, since no binaries exist for any platform, amd64 included. For riscv64 specifically, there is no verified-working build recipe - a user would need to attempt the ChromeOS aarch64 cross-compile pattern adapted for riscv64, with no upstream precedent to confirm it works.

## 9. Dependencies

Dependencies identified from `DEPS` (gclient-style pinned revisions) and `third_party/CMakeLists.txt` (which subdirectories are built, and under which CMake option).

**Build-option context**: Default-ON: tests (googletest), SPIRV-Tools, Shaderc (pulls in glslang + SPIRV-Headers), lodepng (samples). Default-OFF/opt-in: `AMBER_USE_LOCAL_VULKAN` (Vulkan-Headers/Loader/ValidationLayers/Utility-Libraries - Amber normally links the system Vulkan SDK instead), `AMBER_ENABLE_SWIFTSHADER`, `AMBER_USE_DXC` (DirectXShaderCompiler + DirectX-Headers), `AMBER_USE_CLSPV` (clspv + a pinned clspv-llvm fork).

| Dependency | Role | Default? | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|---|
| [SwiftShader](https://github.com/google/swiftshader) | CPU software Vulkan renderer (GPU-less fallback); embeds an LLVM JIT (Reactor) | Opt-in, OFF | Partial - LLVM-backend only; Subzero JIT explicitly unsupported on riscv64 per `reactor.gni`. Requires non-default `-DLLVM_VERSION=16.0`; default LLVM 10 path broken for riscv64 JIT (missing `InProcessMemoryManager::Create`) after a 2026-06-08 revert | No riscv64 CI, no riscv64 test coverage found | No official binaries for any arch (source-only) | See separate SwiftShader status report (reports/swiftshader.md) for full detail |
| [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools) | SPIR-V assembler/disassembler/validator/optimizer | Default ON | Debian riscv64: Installed (2026.3~rc1-1) | No autopkgtest data; no riscv64 GH issues/PRs | Debian sid riscv64 binary available | None found |
| [glslang](https://github.com/KhronosGroup/glslang) | GLSL/HLSL to SPIR-V compiler (via Shaderc) | Default ON | Debian riscv64: Installed (16.4.0-1) | No autopkgtest data; no riscv64 GH issues/PRs | Debian sid riscv64 binary available | None found |
| [Shaderc](https://github.com/google/shaderc) | Wraps glslang + SPIRV-Tools behind Amber's compilation API | Default ON | Debian riscv64: Installed (2026.3-1) | No autopkgtest data; no riscv64 GH issues/PRs | Debian sid riscv64 binary available | None found |
| [SPIRV-Headers](https://github.com/KhronosGroup/SPIRV-Headers) | Header-only SPIR-V enum/opcode definitions | Default ON (via SPIRV-Tools) | Arch-independent, header-only | N/A | Debian: arch:all | None |
| [googletest](https://github.com/google/googletest) | C++ test framework for Amber's own test suite | Default ON | Debian riscv64: Installed (1.17.0-1+b1) | 1 open riscv64 issue: [#3756](https://github.com/google/googletest/issues/3756) "`GetThreadCountTest.ReturnsCorrectValue` fails on risc-v64" | Debian sid riscv64 binary available | [#3756](https://github.com/google/googletest/issues/3756) open |
| [lodepng](https://github.com/lvandeve/lodepng) | PNG encode/decode for saving test-result images; implements its own compression | Default ON (samples) | Debian riscv64: Installed (0.0~git20250402-2+b2) | No riscv64 GH issues/PRs; portable single-file C++ | Debian sid riscv64 binary available | None found |
| [nlohmann/json](https://github.com/nlohmann/json) | Pinned in `DEPS`; no confirmed usage site found in `third_party/CMakeLists.txt` or source [NEEDS VERIFICATION] | Pulled, usage unclear | Header-only; Debian riscv64 (`nlohmann-json3`): Installed | N/A (header-only) | Debian sid riscv64 binary available | None found |
| [Vulkan-Headers](https://github.com/KhronosGroup/Vulkan-Headers) | Vulkan API headers (only when `AMBER_USE_LOCAL_VULKAN=ON`) | Opt-in, OFF | Header-only, arch-independent | N/A | Debian: arch:all | None found |
| [Vulkan-Loader](https://github.com/KhronosGroup/Vulkan-Loader) | ICD dispatch loader | Opt-in, OFF | Debian riscv64: Installed (1.4.357.0-1) | No autopkgtest data; no riscv64 GH issues/PRs; CI (`build.yml`) covers only Win32/x64/arm64/arm64ec | Debian sid riscv64 binary available | None found |
| [Vulkan-ValidationLayers](https://github.com/KhronosGroup/Vulkan-ValidationLayers) | Runtime Vulkan API validation (opt-in local build) | Opt-in, OFF | Debian riscv64: Installed (1.4.357.0-1). Merged [PR #12571](https://github.com/KhronosGroup/Vulkan-ValidationLayers/pull/12571) adds `(defined(__riscv) && __riscv_xlen==64)` to a thread-safety width-detection macro | No autopkgtest data | Debian sid riscv64 binary available | None open |
| [Vulkan-Utility-Libraries](https://github.com/KhronosGroup/Vulkan-Utility-Libraries) | Shared Vulkan helper code for Loader/ValidationLayers | Opt-in, OFF | Debian riscv64: Installed (1.4.357.0-1) | No riscv64 GH issues/PRs | Debian sid riscv64 binary available | None found |
| [DirectXShaderCompiler (DXC)](https://github.com/microsoft/DirectXShaderCompiler) | HLSL to DXIL/SPIR-V compiler; bundles its own Clang/LLVM fork | Opt-in (`AMBER_USE_DXC`), OFF | Not packaged in Debian at all; GH workflows are lint/format/coverage only, no build matrix | Unknown, no evidence of riscv64 testing | No official binary releases for any non-Windows arch found | No riscv64-specific issues found (untested, not confirmed-broken) |
| [DirectX-Headers](https://github.com/microsoft/DirectX-Headers) | Header dependency of DXC | Opt-in (with DXC), OFF | Debian riscv64: Installed (1.619.1-1) | No riscv64 GH issues/PRs | Debian sid riscv64 binary available | None found |
| [clspv](https://github.com/google/clspv) | OpenCL C to SPIR-V(Vulkan compute) compiler; embeds LLVM/Clang | Opt-in (`AMBER_USE_CLSPV`), OFF | Not packaged in Debian; no riscv64 issues/PRs | No evidence of riscv64 testing | No official binary releases found | None found |
| clspv-llvm (pinned llvm/llvm-project fork @ 2025-01-22 commit `4a2ebd6`) | LLVM/Clang/libclc fork used as clspv's compiler backend | Opt-in (with clspv), OFF | Upstream llvm/llvm-project has broad riscv64 backend support generally, but no evidence this specific ~1.5-year-old pinned commit builds cleanly as a riscv64 host toolchain | Not evaluated | N/A (internal build dependency) | None found specific to this pin |

**Deep-dive on JIT/compiler-backend dependencies** (the risk-concentrated category): SwiftShader is the only dependency with documented, real riscv64 gaps (Subzero JIT unsupported, default LLVM 10 broken, requires non-default LLVM 16 - see separate report at reports/swiftshader.md). DXC and clspv both embed their own LLVM forks but show zero riscv64 signal in either direction (no CI, no packaging, no issues) - they are untested/unknown rather than confirmed-broken.

**Summary assessment**: Amber's **default build** (tests + SPIRV-Tools + Shaderc/glslang + lodepng) has a clean riscv64 dependency story - every default-on dependency is "Installed" in Debian sid/riscv64, with only one open, narrow test-flakiness bug (googletest's `GetThreadCountTest`, unrelated to Amber's usage of googletest). The risk is entirely in the opt-in, off-by-default JIT/compiler-backend paths (SwiftShader, DXC, clspv), none of which are exercised unless explicitly enabled.

## 11. Known Bugs and Active Issues

**Zero RISC-V-related bugs or issues exist.** `gh search issues "riscv64 bug" repo:google/amber is:open` returns zero results, and no NaN/floating-point issue is tied to RISC-V anywhere in the tracker.

All 7 currently open `bug`-labeled issues in google/amber, none RISC-V related:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1019](https://github.com/google/amber/issues/1019) | `./tests/cases/draw_polygon_mode.amber` fails with SwiftShader | Open (2023-02-03) | Medium | Probe color mismatch on CI (Ubuntu clang debug, SwiftShader backend); not RISC-V |
| [#780](https://github.com/google/amber/issues/780) | SwiftShader + DXC build failure | Open (2020-02-04) | Medium | Linker errors building with `AMBER_ENABLE_SWIFTSHADER` + DXC; not RISC-V |
| [#727](https://github.com/google/amber/issues/727) | Incorrect rendering of `draw_array_instanced.vkscript` under SwiftShader | Open (2019-11-27) | Medium | Not RISC-V |
| [#622](https://github.com/google/amber/issues/622) | Dawn: Resolve draw_triangle_list_with_depth test | Open (2019-08-27) | Low | Not RISC-V |
| [#556](https://github.com/google/amber/issues/556) | Dawn: Remove fragment shader requirement from dawn backend | Open (2019-06-18) | Low | Not RISC-V |
| [#515](https://github.com/google/amber/issues/515) | Amber only ever uses the first tolerance value | Open (2019-05-16) | Medium | Verifier bug affecting any pixel-tolerance-based test, architecture-agnostic |
| [#47](https://github.com/google/amber/issues/47) | Using system include directory causes build errors | Open (2018-11-14) | Low | Not RISC-V |

Most recent open issue overall (non-bug-labeled): [#1121](https://github.com/google/amber/issues/1121) (opened 2026-08-14), concerning `Resource::MemoryBarrier()` host-synchronization correctness - a real Vulkan synchronization bug but not RISC-V-specific (affects any platform).

**Correctness bugs relevant to riscv64 readiness**: none of the above are RISC-V-specific. [#515](https://github.com/google/amber/issues/515) (tolerance-value bug) is the one architecture-agnostic correctness issue that would equally affect a hypothetical riscv64 test run, since it affects the pixel-comparison verifier used by all backends.

## 12. Objections and Upstream Blockers

**No objections exist because no RISC-V proposal has ever been made.** There is no tracking issue, no PR, no comment thread, and no code path anywhere in google/amber related to riscv64 (verified via `gh search`, GraphQL search, GitHub code search, and full-body inspection of every incidental substring match across 1116 issues/PRs).

**Technical blockers**: none intrinsic to Amber's own code (Section 4) - the core harness is architecture-agnostic C++ with no SIMD/assembly/arch-dispatch. The practical blocker is entirely at the CI/infrastructure layer: no riscv64 Kokoro build target exists, no riscv64 Docker image is published by the `shaderc-build` project, and no riscv64 Vulkan driver (hardware or SwiftShader-based) has been verified to exist as a test target. Any RISC-V enablement would need to happen one layer down (Vulkan driver / SwiftShader / hardware), not in Amber's C++ core.

**Organizational blockers**: Amber's own CI infrastructure (Kokoro, Google-internal) is not self-service in the way GitHub Actions is - adding a new architecture target likely requires Google-internal infrastructure changes (new Docker image publishing pipeline under `shaderc-build`), not just a PR to the public repo. This is inferred from the fact that all existing CI images are published to a Google-controlled Artifact Registry path (`us-east4-docker.pkg.dev/shaderc-build/...`) rather than built inline in the repo. [NEEDS VERIFICATION] - no explicit statement of this constraint was found; it is inferred from the CI architecture.

**RISE affiliation**: Google LLC is a Premier Member of the RISE Project, but this is a corporate-level membership, not project-specific. RISE's working groups (Compilers & Toolchains, System Libraries, Kernel & Virtualization, Language Runtimes, Developer Infrastructure, Linux Distro Integration, Simulator/Emulators, System Firmware, Security Software, AI/ML) contain no graphics/GPU-testing category, and riseproject.dev has zero mentions of "amber," "Vulkan," or "GPU testing" anywhere in 32 scanned blog posts, the GitHub org (50 repos), or the Python wheel-builder package list (73 packages). **Amber is not a RISE-affiliated project and RISE has not funded or scoped any related work.**

**Acceptance probability**: given the patches-welcome culture evidenced by the frictionless merge of unrelated portability fixes (e.g., PR #1016), a well-formed riscv64 CI-addition PR (following the existing ChromeOS aarch64 cross-compile precedent) would likely face no organizational resistance. The primary barrier is that nobody has proposed it, not that it would be rejected.

## 13. Investment Analysis

RISE has not funded, scoped, or produced any work item for google/amber - confirmed by exhaustive search of riseproject.dev (32 blog posts, member list, working-group repos) and the riseproject-dev GitHub org (50 repos). All estimates below start from zero prior investment.

### 13.1 Functional Enablement

Amber's core C++ harness requires no code changes to build on riscv64 (Section 4) - it has no architecture-specific logic to port. The work is entirely CI/build-configuration:
- Add a `kokoro/linux-*-riscv64` (or GitHub Actions equivalent, given the repo currently has none) build target, modeled on the existing amd64 Kokoro jobs or the README's ChromeOS aarch64 cross-compile recipe.
- Verify the default build (tests + SPIRV-Tools + Shaderc/glslang + lodepng) actually compiles and runs correctly on riscv64 hardware or QEMU - untested today, though every default-on dependency has a working Debian riscv64 package (Section 9), which is a strong positive signal.
- Estimated effort: 1-2 person-weeks for a basic native or cross-compiled build validation, assuming no surprises in the currently-untested default dependency chain.

### 13.2 Performance Optimization

Not applicable in the traditional sense - Amber has no SIMD/JIT/assembly code of its own to optimize (Section 4). Any "performance" work for RISC-V would occur in the Vulkan driver or SwiftShader being tested, not in Amber. See the SwiftShader report (reports/swiftshader.md) for that separate, real optimization surface (LLVM 16 requirement, Subzero JIT gap, RVV runtime-detection gap).

### 13.3 CI/CD Infrastructure

- Standing up a riscv64 Kokoro build target requires Google-internal infrastructure access (new Docker image in the `shaderc-build` Artifact Registry project) - this is likely not achievable by an external contributor alone and would need Google maintainer buy-in ([NEEDS VERIFICATION] on the exact internal process).
- Alternatively, since the repo has zero GitHub Actions workflows today, a lighter-weight path would be adding a GitHub Actions riscv64 job (e.g., using RISE's free RISC-V GitHub runners, per [riseproject.dev's runner announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) as a net-new CI system alongside Kokoro, rather than trying to extend the internal-only Kokoro matrix.
- Estimated effort: 1 person-week to add a GitHub Actions riscv64 smoke-build job using RISE runners, assuming the default build succeeds per 13.1.

### 13.4 Ecosystem Enablement

Not applicable - Section 10 is omitted because Amber is a standalone C++ test tool with no dependent package ecosystem (no PyPI/npm/Maven consumers depend on it; it is vendored as source into VK-GL-CTS/SwiftShader/Dawn build trees, not installed as a library).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Validate default build (tests + SPIRV-Tools + Shaderc/glslang + lodepng) compiles and passes on riscv64 (native or QEMU) | 1-2 | External contributor or Google maintainer | Medium |
| CI/CD | Add a GitHub Actions riscv64 smoke-build job using RISE-hosted runners (net-new, since no GitHub Actions exist today) | 1 | External contributor (RISE) | Medium |
| CI/CD | Extend internal Kokoro matrix with a riscv64 target (requires Google-internal Artifact Registry access) | 1-2 (Google-internal effort, not externally executable) | Google maintainer | Low |
| Functional (dependency) | Track/unblock SwiftShader riscv64 JIT gap if SwiftShader-backed tests are needed (LLVM 16 requirement, Subzero exclusion) | See reports/swiftshader.md | External contributor or Google/SwiftShader maintainer | Low (only relevant if `AMBER_ENABLE_SWIFTSHADER` testing is required) |

**Overall priority assessment**: Low-to-Medium. Amber itself presents essentially no technical barrier to riscv64 support - it is architecture-agnostic C++ with a clean default-dependency story on Debian riscv64. The gating factor is that nobody has asked for it, and the real RISC-V risk in the Vulkan/shader-testing stack sits one layer down, in SwiftShader's JIT backend, not in Amber.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/amber repository](https://github.com/google/amber)
- [Amber README and build instructions](https://github.com/google/amber/blob/main/README.md)
- [docs/amber.md](https://github.com/google/amber/blob/main/docs/amber.md)
- [PR #1016 - include missing cstdint](https://github.com/google/amber/pull/1016)
- [PR #1051 - Initial amber microbenchmarks](https://github.com/google/amber/pull/1051)
- [PR #1057 - Document how to cross compile chromeos](https://github.com/google/amber/pull/1057)
- [PR #1108 - Test abis](https://github.com/google/amber/pull/1108)
- [PR #859 - Fix probing when either value is a NaN](https://github.com/google/amber/pull/859)
- [PR #595 - Add support for 'NaN' as a double value](https://github.com/google/amber/pull/595)
- [Issue #1019 - draw_polygon_mode.amber fails with SwiftShader](https://github.com/google/amber/issues/1019)
- [Issue #780 - SwiftShader + DXC build failure](https://github.com/google/amber/issues/780)
- [Issue #727 - Incorrect rendering of draw_array_instanced.vkscript under SwiftShader](https://github.com/google/amber/issues/727)
- [Issue #622 - Dawn: Resolve draw_triangle_list_with_depth test](https://github.com/google/amber/issues/622)
- [Issue #556 - Dawn: Remove fragment shader requirement from dawn backend](https://github.com/google/amber/issues/556)
- [Issue #515 - Amber only ever uses the first tolerance value](https://github.com/google/amber/issues/515)
- [Issue #47 - Using system include directory causes build errors](https://github.com/google/amber/issues/47)
- [Issue #632 - Add pipeline runtime measurement](https://github.com/google/amber/issues/632)
- [Issue #1121 - Resource::MemoryBarrier() correctness](https://github.com/google/amber/issues/1121)
- Dependency-roll PRs containing incidental "riscv" substring matches (not genuine Amber RISC-V work): [#916](https://github.com/google/amber/pull/916), [#895](https://github.com/google/amber/pull/895), [#883](https://github.com/google/amber/pull/883), [#828](https://github.com/google/amber/pull/828), [#810](https://github.com/google/amber/pull/810), [#809](https://github.com/google/amber/pull/809), [#789](https://github.com/google/amber/pull/789), [#787](https://github.com/google/amber/pull/787), [#772](https://github.com/google/amber/pull/772), [#765](https://github.com/google/amber/pull/765), [#764](https://github.com/google/amber/pull/764), [#761](https://github.com/google/amber/pull/761), [#760](https://github.com/google/amber/pull/760), [#758](https://github.com/google/amber/pull/758), [#746](https://github.com/google/amber/pull/746)
- [google/swiftshader repository](https://github.com/google/swiftshader) (see separate report at reports/swiftshader.md)
- [google/googletest Issue #3756 - GetThreadCountTest fails on risc-v64](https://github.com/google/googletest/issues/3756)
- [KhronosGroup/Vulkan-ValidationLayers PR #12571 - riscv 64-bit condition macro](https://github.com/KhronosGroup/Vulkan-ValidationLayers/pull/12571)
- [PyPI amber package (unrelated namespace collision)](https://pypi.org/pypi/amber/json)
- [Ubuntu packages.ubuntu.com search for amber (unrelated Go templating engine)](https://packages.ubuntu.com/search?keywords=amber&suite=noble&searchon=names&section=all)
- [Debian tracker - golang-github-eknkc-amber (unrelated namespace collision)](https://tracker.debian.org/pkg/golang-github-eknkc-amber)
- [Debian buildd status - golang-github-eknkc-amber](https://buildd.debian.org/status/package.php?p=golang-github-eknkc-amber)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/?q=amber)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project - Announcing the RISE RISC-V Runners: free native RISC-V CI on GitHub](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [Google Open Source Community Guidelines](https://opensource.google.com/conduct/)