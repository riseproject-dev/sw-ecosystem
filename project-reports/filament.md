---
title: filament
---

# filament

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for Google Filament<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Google Filament](https://google.github.io/filament/) is a physically based rendering (PBR) engine written in C++, targeting Android (arm64-v8a primary), Linux, macOS, iOS, Windows, and WebAssembly. Its primary use case is Android application rendering. The engine provides OpenGL ES, Vulkan, and Metal backends; a material compiler (`matc`/`filamat`); and supporting tools for mesh optimization, texture compression, and asset pipelines.

Filament is released under the Apache License 2.0. It is a Google-internal open-source project hosted at [github.com/google/filament](https://github.com/google/filament) and explicitly described as "not an officially supported Google product." Governance is informal and single-vendor: Google employees own all CI/CD configuration, the `.github/` workflow directory is restricted to maintainers, and all contributors must sign the [Google CLA](https://cla.developers.google.com). No MAINTAINERS, OWNERS, or CODEOWNERS file exists in the repository.

The five highest-commit contributors are all Google employees or ex-Google employees: pixelflinger/Mathias Agopian (2,621 commits, @google), prideout/Philip Rideout (1,754 commits), bejado (1,210 commits, @google), romainguy/Romain Guy (788 commits), and poweifeng/Powei Feng (783 commits). There is no evidence of non-Google corporate contributors with significant commit counts.

Filament is not a member of, tracked by, or funded by the [RISE Project](https://riseproject.dev). The RISE working groups cover compilers, toolchains, system libraries, kernel, language runtimes, AI/ML, and distro integration; graphics rendering engines are outside RISE's current scope. A scan of all 33 RISE blog posts (2024-05 through 2026-08) found zero references to Filament.

There is no documented tier policy for platform support and no stated criteria for accepting new architecture ports. Given the single-vendor governance model, a community-contributed RISC-V port would require active Google maintainer buy-in, a signed Google CLA, and ongoing CI coverage funded by Google infrastructure. There is no precedent for external contributors adding new architecture support to this project.

The project is actively developed: v1.75.0 was released 2026-08-04, with 10+ PRs merged per week as of August 2026.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port has ever been started for google/filament.

| Date | Event | Source |
|---|---|---|
| - | Zero issues filed for riscv or riscv64 | [GitHub Issues API](https://api.github.com/search/issues?q=riscv+repo:google/filament) |
| - | Zero PRs filed for riscv or riscv64 | [GitHub PR search](https://github.com/google/filament/pulls) |
| - | Zero commits mentioning riscv or riscv64 | [GitHub Commits API](https://api.github.com/search/commits?q=riscv+repo:google/filament) |
| - | No riscv64 toolchain cmake in build/ | [github.com/google/filament build/ tree](https://github.com/google/filament/tree/main/build) |
| - | No riscv64 CI job in any of 14 workflow files | [github.com/google/filament .github/workflows/](https://github.com/google/filament/tree/main/.github/workflows) |

There are no key contributors to cite. There is no upstreaming timeline because no port effort has been initiated by any party.

---

## 3. Upstream Support Tier

Filament has no formal tier policy document. Support tiers are inferred from CI coverage, release binary availability, and BUILDING.md documentation.

| Tier criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI build job | Yes (ubuntu-24.04) | Yes (arm-ubuntu-24.04-16core) | No |
| CI test job | Yes | Yes | No |
| Release binary (linux) | Yes (filament-v1.75.0-linux.tgz) | Yes (filament-v1.75.0-arm-linux.tgz) | No |
| Android ABI | x86, x86_64 | arm64-v8a, armeabi-v7a | No |
| Documented in BUILDING.md | Yes | Yes (primary target) | No |
| CMake toolchain file | Yes (implicit native) | Yes (android aarch64) | No |

BUILDING.md states: "our implementation is optimized first and foremost for arm64-v8a." riscv64 is absent from every layer of the official support surface.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Filament's own source tree contains zero RISC-V-specific code. All three RISC-V files in the repository are in vendored third-party libraries.

### 4.1 Architecture-Specific Components

**Color Grading SIMD (filament native)**

`ColorGrading.cpp` has five `#if defined(__ARM_NEON)` guards. `ColorGradingNeon.h` provides 432 lines of hand-optimized NEON tone-mapping loops. No `__riscv` equivalent exists anywhere in the filament source tree. On riscv64, the scalar C fallback path runs.

**bluegl OpenGL trampolines (filament native)**

`BlueGLCoreLinuxAArch64Impl.S` and `BlueGLCoreDarwinAArch64Impl.S` exist for aarch64. `BlueGLCoreLinuxImpl.S` exists for x86. No riscv64 `.S` file or equivalent exists. On riscv64 Linux, bluegl falls back to the generic runtime-link path [NEEDS VERIFICATION - runtime fallback behavior not directly tested].

**math/fast.h SIMD paths (filament native)**

`libs/math/include/math/fast.h` uses `#ifdef __ARM_NEON` and `#ifdef __aarch64__` exclusively. No `#ifdef __riscv` guards exist anywhere in filament's math library.

**ASTC texture compression RVV (third_party/tinyexr/deps/astcenc)**

`astcenc_vecmathlib_rvv_n.h` (1,230 lines, Arm Limited / Olaf Bernstein, Apache-2.0, copyright 2026) implements N-wide 32-bit float/int/mask SIMD vector math for ASTC texture encoding using RVV. Dispatch guard: `#elif defined(__riscv_v_fixed_vlen) && (__riscv_v_fixed_vlen == 256)`. This requires VLEN=256 fixed-length mode. Scalable-vector mode (the default on most current RISC-V hardware) is not supported. RVV intrinsics used include `__riscv_vle32_v_f32m1`, `__riscv_vfmv_v_f_f32m1`, `__riscv_vsetvlmax_e32m1`, `vbool32_t`, and many others. ISA extension required: V extension (RVV), VLEN=256 fixed-length.

**libdeflate LZ77 matchfinder RVV (third_party/tinyexr/deps/libdeflate)**

`lib/riscv/matchfinder_impl.h` (97 lines, Eric Biggers, MIT, 2024) implements `matchfinder_init_rvv()` and `matchfinder_rebase_rvv()` for bulk LZ77 hash table initialization using scalable RVV (m8 LMUL, no fixed-length constraint). Guard: `defined(ARCH_RISCV) && defined(__riscv_vector)`. ISA extension required: V extension (RVV), scalable.

**Abseil stack unwinder (third_party/abseil)**

`absl/debugging/internal/stacktrace_riscv-inl.inc` (203 lines, Google Apache-2.0) implements frame-pointer-based stack walking for riscv64 Linux using `ucontext_t` / `mcontext_t` via `uc_mcontext.__gregs[REG_PC]` and `REG_S0`. No ISA extensions required; pure base RV64I. Complete implementation.

### 4.2 Component Comparison Table

| Component | Owner | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| ColorGrading SIMD tone-mapping | filament native | scalar | hand-tuned NEON (432 lines) | missing (scalar fallback) |
| bluegl OpenGL trampolines | filament native | .S asm | .S asm (2 files) | missing (generic fallback) |
| math/fast.h SIMD | filament native | scalar | NEON + aarch64 intrinsics | missing (scalar) |
| ASTC texture compression SIMD | third_party/astcenc | SSE-4 (1,351 lines), AVX2 (1,229 lines) | NEON (1,130 lines), SVE (1,106 lines) | RVV VLEN=256 only (1,230 lines) |
| libdeflate matchfinder | third_party/libdeflate | x86 RVV equiv. (123 lines) | arm (79 lines) | RVV scalable (97 lines) |
| Abseil stack unwinder | third_party/abseil | x86 (406 lines) | aarch64 (289 lines) | riscv (203 lines) |
| GPU backends (Vulkan, OpenGL, Metal) | filament native | generic C/GLSL | generic C/GLSL | no riscv64 path |
| Shader compiler (filamat/matc) | filament native | generic | generic | no riscv64 path |
| Job system | filament native | generic C++ atomics | generic C++ atomics | no riscv64 path |

ISA extensions used by third-party RVV code: V extension only. No Zba, Zbb, Zbc, or other extensions referenced anywhere in the repository.

No hand-written .S assembly files exist for riscv64 in either filament or its vendored dependencies (filament-level; individual deps not exhaustively checked).

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Requirements (from BUILDING.md)

- CMake >= 3.22.1
- Clang >= 17.0 (required; MSVC supported on Windows only; libc++ required on Linux/macOS, NOT libstdc++)
- libc++-17-dev and libc++abi-17-dev
- ninja >= 1.10

### 5.2 Native Linux Build (amd64 only, documented)

```shell
mkdir out/cmake-release && cd out/cmake-release
CC=/usr/bin/clang CXX=/usr/bin/clang++ CXXFLAGS=-stdlib=libc++ \
  cmake -G Ninja -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=../release/filament ../..
ninja
```

### 5.3 Cross-Compilation Model

Filament uses a two-phase cross-compilation model because host tools (`matc`, `resgen`, `cmgen`, `filamesh`) must run on the build host to generate shaders and resources during the target build:

- Phase 1: Build host tools on x86_64, export via `FILAMENT_EXPORT_PREBUILT_EXECUTABLES_DIR`
- Phase 2: Cross-compile target with `-DCMAKE_TOOLCHAIN_FILE=<toolchain> -DIMPORT_EXECUTABLES_DIR=<host-tools-dir>`

CMake key variables: `IMPORT_EXECUTABLES_DIR`, `FILAMENT_EXPORT_PREBUILT_EXECUTABLES_DIR`, `FILAMENT_IMPORT_PREBUILT_EXECUTABLES_DIR`.

Existing toolchain cmake files in `build/`:
- `toolchain-aarch64-linux-android.cmake`
- `toolchain-arm7-linux-android.cmake`
- `toolchain-x86-linux-android.cmake`
- `toolchain-x86_64-linux-android.cmake`

No `build/toolchain-riscv64-linux-gnu.cmake` or any equivalent exists.

### 5.4 riscv64 Build Status

No riscv64 build has been attempted or documented. To attempt a riscv64 build, a contributor would need to:

1. Author `build/toolchain-riscv64-linux-gnu.cmake` modeled after the aarch64-android toolchain
2. Supply Clang >= 17 cross-compiler targeting riscv64-linux-gnu with `-stdlib=libc++`
3. Build host tools phase for x86_64 and export `matc`, `resgen`, `cmgen`, `filamesh`
4. Cross-compile with the new toolchain file and `IMPORT_EXECUTABLES_DIR` pointing to phase 1 output
5. Add `#ifdef __riscv` guards or stub paths in CMakeLists.txt where arch-specific paths are currently amd64/arm64 only

No QEMU-based build or test is configured anywhere in the project. None of the above steps are upstreamed or tested.

### 5.5 Known Build Failures

No riscv64 build failures are documented because no riscv64 build has been attempted. The Abseil dependency requires `-latomic` with some cross-toolchains on riscv64 (see [Abseil issue #1702](https://github.com/abseil/abseil-cpp/issues/1702)).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| OpenGL ES backend | Yes | Yes | Unknown - untested | bluegl trampoline missing |
| Vulkan backend | Yes | Yes | Unknown - untested | No riscv64 Vulkan driver known |
| Metal backend | N/A | macOS/iOS | N/A | Apple platforms only |
| ASTC texture compression | Yes (SSE4/AVX2) | Yes (NEON/SVE) | Partial - VLEN=256 only | Fixed-length RVV constraint |
| WebP texture decode | Yes | Yes | Scalar only | No RVV path in libwebp |
| zstd compression | Yes | Yes | Yes (scalar) | RVV optimization PRs stalled upstream |
| Android ABI target | x86/x86_64 | arm64-v8a (primary) | No | Not listed in BUILDING.md |
| filamat material compiler | Yes | Yes | Untested | Host tool; may work if built natively |
| ColorGrading SIMD | scalar | NEON hand-tuned | Missing (scalar) | Performance gap, not correctness gap |
| bluegl trampolines | .S asm | .S asm | Missing (fallback) | May affect OpenGL load latency |

### 6.2 Performance Gaps

- **ColorGrading/tone mapping**: Arm64 has 432 lines of hand-written NEON. riscv64 runs the scalar path. Throughput difference is unquantified (no published benchmarks on any RISC-V platform).
- **ASTC encoding**: RVV path requires `__riscv_v_fixed_vlen == 256`. Hardware that does not set this fixed-length mode runs the scalar fallback. SpacemiT X60 (VLEN=256) would hit the RVV path; other hardware may not.
- **WebP decode**: Scalar only on riscv64. Expected 3-5x throughput gap vs x86 SSE2/AVX2 [NEEDS VERIFICATION - figure from libwebp report, not from filament-specific benchmark].
- **zstd**: RVV optimization PRs stalled; scalar-only in practice.
- **Basis Universal (basisu) texture transcoding**: SSE-4.1 encoder/transcoder disabled on riscv64 at compile time; no RVV path exists upstream; scalar fallback only.

### 6.3 Floating-Point and NaN Semantics

Issue [#10280](https://github.com/google/filament/issues/10280) (open, 2026-08-09): NaN propagation in lit shading model from half-precision NoV underflow on Metal `fastMathEnabled=YES`. This is Metal/macOS-specific and not a riscv64 issue. No riscv64-specific floating-point correctness issues have been filed because riscv64 has never been tested.

### 6.4 Security Hardening

Data not available: no riscv64-specific security hardening analysis (shadow call stack, pointer authentication equivalent, CFI) was found in any upstream issue or document.

---

## 7. CI/CD Infrastructure

Direct inspection of all 14 workflow files confirms zero occurrences of "riscv" in any CI configuration file.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes (ubuntu-24.04) | Yes (arm-ubuntu-24.04-16core) | No |
| Test job | Yes | Yes | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |
| Hardware runner | GitHub-hosted | GitHub-hosted | None |
| Release blocking | Yes | Yes | N/A |

Workflow files inspected: `auto-close-restricted-paths.yml`, `cocopods-deploy.yml`, `npm-deploy.yml`, `postsubmit-main.yml`, `postsubmit.yml`, `presubmit.yml`, `release.yml`, `status-android.yml`, `status-ios.yml`, `status-linux.yml`, `status-macos.yml`, `status-web.yml`, `status-windows.yml`, `verify-release-notes.yml`. None contain "riscv".

The `.github/` directory is explicitly restricted to Google maintainers. External contributors cannot add CI jobs. Adding riscv64 CI requires a Google maintainer to configure and fund the runner infrastructure.

---

## 8. Distribution and Release Status

### 8.1 Official Release Binaries (v1.75.0, 2026-08-04)

Release assets (12 total) target: android, android-native, arm-linux, ios, linux, mac, web, windows. No asset filename contains "riscv64" or "riscv".

| Platform | Binary available | riscv64 variant |
|---|---|---|
| Linux (x86_64) | Yes (filament-v1.75.0-linux.tgz) | No |
| Linux (arm64) | Yes (filament-v1.75.0-arm-linux.tgz) | No |
| Android arm64-v8a | Yes | No riscv64 ABI |
| macOS | Yes | N/A |
| Windows | Yes | N/A |
| WebAssembly | Yes | N/A |

### 8.2 Package Managers and Distributions

| Channel | Status | Notes |
|---|---|---|
| PyPI pypi.org/project/filament | Not google/filament | filament-0.0.2.tar.gz is an unrelated stub package; source-only, no wheels |
| Debian | Different project | Debian "filament" package (v1.9.25+dfsg3) is the KDE thumbnail plugin, not google/filament |
| Ubuntu noble | Not packaged | packages.ubuntu.com search returned no results |
| Arch Linux RISC-V (archriscv.felixc.at) | Not listed | Not present in Arch RISC-V port |
| RISE wheel builder | Not listed | google/filament not among the ~80 packages built |

### 8.3 Getting a Working Binary on riscv64

A user wanting to run google/filament on riscv64 must build from source with no upstream guidance. Required steps: author a riscv64 CMake toolchain file, perform the two-phase cross-compilation, and resolve any build failures independently. No documentation, no prebuilt toolchain, no CI results exist to reference.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| SPIRV-Tools | SPIR-V optimizer/validator (Vulkan/filamat) | Pass (pure C++) | No riscv64 CI | Source only | None found |
| glslang | GLSL/HLSL-to-SPIR-V compiler (filamat) | Pass (pure C++) | No riscv64 CI | Source only | None found |
| SPIRV-Cross | SPIR-V decompiler (Vulkan backend) | Pass (pure C++) | No riscv64 CI | Source only | None found |
| SPIRV-Headers | SPIR-V grammar headers (header-only) | N/A | N/A | N/A | None |
| abseil-cpp | Base library (containers, strings, synchronization) | Partial (-latomic workaround required) | Partial (QEMU/RISE); 2 SEGFAULTs open | Debian/Ubuntu package ships | Issues #1702, #2002 open; see project-reports/abseil-cpp.md |
| zstd | Compressed material archives, mesh data | Pass (QEMU CI since 2025) | QEMU CI on PR branch only | Debian/Ubuntu packages ship | RVV PRs stalled (#4546, #4471, #4557, #4622, #4668); see project-reports/zstd.md |
| Dawn | WebGPU backend (optional) | No riscv64 CI found | Unknown | Source only | Effectively untested on riscv64 |
| Vulkan Memory Allocator | GPU heap allocator for Vulkan (header-only) | Pass | No riscv64 CI | N/A | None found |
| Basis Universal (basisu) | GPU texture transcoding (KTX2) | Partial (BASISU_SSE=OFF required) | No riscv64 CI | Source only | SSE-4.1 paths disabled; scalar fallback only; no RVV path |
| draco | Mesh geometry compression (glTF loader) | Pass (pure C++) | No upstream riscv64 CI; Debian passes | Debian/Ubuntu ship riscv64 | None blocking; see project-reports/draco.md |
| libwebp | WebP texture decode (optional) | Pass (scalar) | No riscv64 CI | Debian/Ubuntu ship (libwebp7) | Scalar only; ~3-5x throughput gap; see project-reports/libwebp.md |
| meshoptimizer | Mesh optimization (tools) | Pass (SSE2/NEON compiled out) | No riscv64 CI | Source only | None found |
| smol-v | SPIR-V size optimizer (material bundles) | Pass (pure C++) | No riscv64 CI | N/A | None |
| imgui | Debug UI overlay (filagui) | Pass (pure C++) | No riscv64 CI | N/A | None found |
| google/benchmark | Microbenchmarking | Pass | No upstream riscv64 CI | Source only | CPU frequency estimation uses busy-loop fallback; see project-reports/benchmark.md |
| libpng | PNG decode (imageio/tools) | Pass (scalar; NEON skipped) | No riscv64 CI | Debian/Ubuntu ship | None found; no RVV path exists |
| SDL2 (vendored 2.0.8) | Window/input for desktop samples (optional) | Stale - predates riscv64 maturity | Not tested | N/A | SDL 2.0.8 (2018) has no riscv64 joystick/audio drivers; use system SDL2 >= 2.26 |
| perfetto | CPU/GPU tracing (dev-mode) | Pass (issue #936 fixed) | N/A | N/A | Issue #936 (closed): riscv64 stack-unwind bug fixed |
| tinyexr | EXR image read (tools) | Pass (header-only) | N/A | N/A | None |
| cgltf | glTF 2.0 parser (header-only) | Pass | N/A | N/A | None |
| stb | Image I/O (header-only) | Pass | N/A | N/A | None |
| libassimp | 3D asset importer (tools) | Pass | No riscv64 CI | Debian/Ubuntu ship | None found |
| googletest | Unit test framework | Pass (test #3756 cosmetic fail) | Issue #3756 open (riscv64 not officially supported) | Debian/Ubuntu ship | Cosmetic test failure; no functional impact |

### 9.2 Critical Dependency Deep-Dive

**abseil-cpp:** Two open riscv64 issues. Issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702): `-latomic` link failure with some cross-toolchains; workaround is to add `-latomic` explicitly. Issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002): `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` SEGFAULT on Debian riscv64 with GCC 15; no maintainer response. CRC32C hardware acceleration blocked pending Google riscv64 hardware (PR #1986). See `project-reports/abseil-cpp.md`.

**Basis Universal (basisu):** No riscv64 issues filed upstream. The SSE-4.1 encoder paths (`basisu_kernels_sse.cpp`, `basisu_bc15_spmd_sse.cpp`) are compiled out on riscv64 when built with `BASISU_SSE=OFF`. No NEON or RVV acceleration path exists. Texture transcoding throughput is scalar-only on riscv64. This affects all KTX2 texture workflows in filament.

**zstd:** Builds and runs on riscv64 with QEMU CI. Five RVV optimization PRs are stalled: unaligned access (#4546), RVV XXH3 (#4471), fast decode path (#4557), Huffman 4-way (#4622), prefetch (#4668). Scalar performance is functional. See `project-reports/zstd.md`.

**libwebp:** No RVV DSP path. All DSP paths (loop filter, transform, predictor, encode) are scalar on riscv64. See `project-reports/libwebp.md`.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in google/filament because riscv64 has never been tested. The following issues are relevant to correctness and performance on the platforms that are tested:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#10280](https://github.com/google/filament/issues/10280) | lit shading model produces black faces on Metal (NaN propagation from half-precision NoV) | Open | Medium | Metal/macOS only; fastMathEnabled=YES + float16 underflow; not riscv64 |
| [#10332](https://github.com/google/filament/issues/10332) | JobSystem: lock-free redesign and optimizations | Open | Perf | macOS: 3.71ms->0.10ms (36x); Android ARM64: 4.02ms->0.63ms (6.4x); no riscv64 data |
| [#9831](https://github.com/google/filament/issues/9831) | Move some presubmit tests to arm linux build | Merged 2026-03-24 | Low | Added arm-linux CI; no riscv64 runner added |

No correctness bugs specific to riscv64 are documented. The absence of reported bugs reflects the absence of any riscv64 testing, not the absence of bugs.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

- Single-vendor governance. CI and release infrastructure is restricted to Google maintainers. External contributors cannot add CI jobs or release targets without Google approval.
- No stated interest from Google in riscv64 support. No issue, PR, comment, or blog post from any Google employee mentions RISC-V in the context of filament.
- Google CLA required for all contributions. This is a standard barrier but must be cleared by any contributing organization.
- No RISE involvement. Filament is outside RISE's current working group scope; no funded effort exists.

**Technical blockers:**

- Two-phase cross-compilation requires authoring a riscv64 CMake toolchain file (no template exists).
- Abseil-cpp requires `-latomic` workaround and has two open riscv64 test failures.
- ASTC RVV path requires `__riscv_v_fixed_vlen == 256`; hardware not setting this fixed-length mode falls back to scalar. Current SpacemiT X60 uses VLEN=256 and would activate the RVV path [NEEDS VERIFICATION - hardware behavior not directly confirmed in filament context].
- No Vulkan driver for riscv64 Linux is known to exist; the Vulkan backend cannot be tested.
- Basisu has no RVV path; texture transcoding will be scalar-only regardless of hardware.

**Acceptance probability:** Low in the near term. The project has zero community governance, no external precedent for architecture additions, and no stated roadmap for RISC-V. A port landing upstream requires sustained Google maintainer engagement. The Android riscv64 ABI trajectory (Google announced riscv64 Android support in 2023 for API level 35+) is the most plausible forcing function for Google to add riscv64 to filament's Android build, but no public timeline exists for this.

---

## 13. Investment Analysis

No prior RISE funding or work has been done on filament. All items below are net-new.

### 13.1 Functional Enablement

The minimum viable work to build filament on riscv64 Linux:

- Author `build/toolchain-riscv64-linux-gnu.cmake` (2 person-days; copy aarch64-android toolchain and adjust)
- Perform two-phase cross-compilation, debug link failures (abseil `-latomic`, any additional failures) (3-5 person-days)
- Verify OpenGL ES backend via generic bluegl fallback path (2-3 person-days testing with a RISC-V board that has OpenGL ES support)
- Fix or stub any `#ifdef __aarch64__` paths that have no `__riscv` equivalent in filament native code (1-2 person-days; primarily math/fast.h and ColorGrading)

Total functional enablement estimate: 2-3 person-weeks.

Blocker: requires Google maintainer to review and merge the toolchain file and any CMake changes. Without maintainer engagement, this work cannot land upstream.

### 13.2 Performance Optimization

- ColorGrading RVV SIMD: Port 432-line NEON tone-mapping to RVV intrinsics (3-5 person-weeks; requires shader/pipeline knowledge and RISC-V SIMD expertise)
- bluegl riscv64 trampolines: Author `BlueGLCoreLinuxRiscV64Impl.S` (1-2 person-weeks; requires ABI knowledge; aarch64 version is the reference)
- basisu RVV texture transcoding: No upstream RVV path exists; contributing to basisu upstream is a prerequisite (5-10 person-weeks; basisu encoder is complex)
- libwebp RVV DSP: Outside filament scope; tracked separately
- zstd RVV: Outside filament scope; tracked separately

Total performance optimization estimate: 10-18 person-weeks for filament-native work only.

### 13.3 CI/CD Infrastructure

- Add riscv64 QEMU-based CI job to `presubmit.yml` and `postsubmit.yml` (1-2 person-days authoring; requires Google maintainer approval and runner provisioning)
- Procure or access RISC-V hardware runners (if QEMU performance is insufficient for GPU/render testing) - organizational effort, timeline not estimable

Note: CI access is restricted to Google maintainers. An external contributor can draft the YAML but cannot enable the runner. This is an organizational dependency, not a technical one.

### 13.4 Ecosystem Enablement

Not applicable. google/filament has no dependent package ecosystem requiring separate enablement (it is a native C++ rendering engine, not a language runtime or package manager host).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | riscv64 CMake toolchain file + two-phase cross-build | 0.5 | Contributor + Google maintainer | Critical |
| Functional | Resolve link failures (abseil -latomic, others) | 0.5 | Contributor | Critical |
| Functional | Stub/fix aarch64-only paths in CMakeLists and native code | 0.5 | Contributor | High |
| Functional | Verify OpenGL ES backend on riscv64 hardware | 0.5 | Contributor | High |
| Performance | ColorGrading RVV SIMD port | 4 | Contributor (RISC-V SIMD expert) | Medium |
| Performance | bluegl riscv64 trampolines (.S) | 1.5 | Contributor (ABI expert) | Medium |
| Performance | basisu RVV texture transcoding (upstream first) | 8 | Contributor + basisu maintainer | Low |
| CI/CD | riscv64 QEMU presubmit/postsubmit job | 0.5 (authoring) | Contributor + Google maintainer | High |
| CI/CD | riscv64 hardware runner provisioning | organizational | Google | Low |

**Pre-condition for all items:** Google maintainer engagement. Without a committed Google reviewer, no upstream work can land. The investment estimate above assumes that engagement has been secured.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/filament GitHub repository](https://github.com/google/filament)
- [Filament project homepage](https://google.github.io/filament/)
- [Filament BUILDING.md](https://github.com/google/filament/blob/main/BUILDING.md)
- [Filament .github/workflows/ directory](https://github.com/google/filament/tree/main/.github/workflows)
- [Filament v1.75.0 release assets](https://github.com/google/filament/releases/tag/v1.75.0)
- [astcenc_vecmathlib_rvv_n.h (third_party/tinyexr/deps/astcenc)](https://github.com/google/filament/blob/main/third_party/tinyexr/deps/astcenc/astcenc_vecmathlib_rvv_n.h)
- [libdeflate riscv matchfinder_impl.h (third_party/tinyexr/deps/libdeflate)](https://github.com/google/filament/blob/main/third_party/tinyexr/deps/libdeflate/lib/riscv/matchfinder_impl.h)
- [Abseil stacktrace_riscv-inl.inc (third_party/abseil)](https://github.com/google/filament/blob/main/third_party/abseil/absl/debugging/internal/stacktrace_riscv-inl.inc)
- [Filament issue #10280 - NaN propagation Metal](https://github.com/google/filament/issues/10280)
- [Filament issue #10332 - JobSystem lock-free redesign](https://github.com/google/filament/issues/10332)
- [Abseil-cpp issue #1702 - riscv64 -latomic link failure](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #2002 - riscv64 SEGFAULT on Debian](https://github.com/abseil/abseil-cpp/issues/2002)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog (all posts scanned)](https://riseproject.dev/category/blog/)
- [Debian packages.ubuntu.com search for filament](https://packages.ubuntu.com/search?keywords=filament)
- [Arch Linux RISC-V package port (archriscv.felixc.at)](https://archriscv.felixc.at/)
- [PyPI filament package (unrelated stub)](https://pypi.org/project/filament/)