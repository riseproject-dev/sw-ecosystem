---
title: gfxstream
---

# gfxstream

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for gfxstream<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

gfxstream is a graphics and media streaming library for virtualized Android environments. It provides guest-side OpenGL ES and Vulkan encoder stubs plus host-side decoder/replay logic, enabling GPU-accelerated graphics inside Android virtual machines running on QEMU (via virtio-gpu) and the Android Cuttlefish emulator. The project is closely tied to the Android virtual device stack. It is distinct from a graphics driver in the conventional sense: it is a transport and protocol layer, not a kernel module or display driver.

**License:** Apache-2.0.

**Repository:** [https://github.com/google/gfxstream](https://github.com/google/gfxstream). The GitHub repo was created 2025-05-07. Development history predates that date; commits were imported from AOSP (Android Open Source Project) Gerrit. The primary review system is Android Gerrit; GitHub is a mirror that also accepts external PRs.

**Governance:** No foundation. Not part of the Linux Foundation, Khronos, or the [RISE Project](https://riseproject.dev). The `google` GitHub organization owns the repo. The README explicitly disclaims official Google product status and excludes gfxstream from Google's Open Source Security Vulnerability Rewards Program. Decision authority rests entirely with Google employees.

**Corporate maintainers:** The OWNERS file at the repo root lists 10 contacts, all `@google.com`. The most active committer by lifetime commit count is Jason Macnak (`natsu@google.com`, 2476 commits). Top-5 lifetime contributors by commit count: `741g`/lfy (Google, 2964), Jason Macnak (2476), Yilong Li/`gnoliyil` (1184), Gurchetan Singh/`gsingh408` (1054), `yahanzhou` (981). All are Google employees.

**External contributors:** Intel (Jason Le, `intel.corp-partner.google.com`) has 2 commits in June 2026 covering virtio/gfxstream-virtio GPU work. QNX/BlackBerry (Aaron Ruby, `aruby@qnx.com`) has contributed PRs #92, #94, #110 for QNX platform support in June 2026. One prolific external committer (`utzcoz`, `outlook.com`) accounts for 27 of the last 100 commits. Outside these individuals, the external contributor base is negligible: 55 GitHub stars, 33 forks.

**Community stance on new ports:** The project accepted QNX platform support (multiple PRs by `aruby@qnx.com`) and macOS support (community PRs #109, #165 in 2026) without stated policy objections. The CONTRIBUTING.md requires a Google CLA and follows Google's Open Source Community Guidelines. There is no architecture exclusion list. However, with 3 open issues and a near-exclusively Google contributor base, review bandwidth for external platform work is limited.

**RISE membership:** Google LLC is a Premier Member of the RISE Project. gfxstream itself is not a RISE project and does not appear on [riseproject.dev](https://riseproject.dev). The RISE blog has no posts mentioning gfxstream.

---

## 2. Port History and Upstreaming Timeline

The riscv64 support in gfxstream is implicit and driven by Android's internal requirement to run on riscv64 Android devices. There has been no dedicated community-driven RISC-V port effort on GitHub.

| Date | Event | Source |
|------|-------|--------|
| Pre-2025 | Android Soong build system begins targeting `android_vendor_riscv64_shared` for gfxstream guest components, inherited from AOSP riscv64 Android device work | Inferred from commit context |
| 2025-02-25 | Commit [383b853dd5](https://github.com/google/gfxstream/commit/383b853dd5701c853a41278db19004cd5e6e2236): add `-Wno-cast-function-type-mismatch` to `guest/egl/Android.bp` for `android_vendor_riscv64_shared` Soong target; Clang warning promoted to error under riscv64 toolchain; Buganizer b/353528991 | GitHub commit |
| 2025-02-26 | Commit [0deaa83985](https://github.com/google/gfxstream/commit/0deaa8398542d32f4d986db25f1b5946a920dc83): revised version of same fix (different Change-Id); same `android_vendor_riscv64_shared` context | GitHub commit |
| 2025-04-07 | Commit d214f9cf5d: copy `hardware/google/aemu/base` into `hardware/google/gfxstream/common/base` to make gfxstream standalone-buildable; carries the `#elif defined(__riscv) && (__riscv_xlen == 64)` memory fence guards from the aemu codebase | GitHub commit |
| 2026-04-10 | `android-cuttlefish` issue #2380 opened: `SharedMemory_posix.cpp` fails to compile on riscv64 because the `__NR_memfd_create` syscall number fallback table omits riscv64 | android-cuttlefish GitHub |
| 2026-04-11 | [PR #117](https://github.com/google/gfxstream/pull/117) merged: "Add missing syscall header include" - fixes `SharedMemory_posix.cpp` by including `<sys/syscall.h>` instead of relying on hardcoded fallback per-arch syscall number table | GitHub PR |
| 2026-04-14 | `android-cuttlefish` [PR #2393](https://github.com/google/android-cuttlefish/pull/2393) merged: update gfxstream to commit 765baff incorporating PR #117 | android-cuttlefish GitHub |

**Key contributors for RISC-V work:** Jason Macnak (Google) for the Feb 2025 build fixes and the aemu base copy. PR #117 author is not attributable from the findings to a specific organization [NEEDS VERIFICATION]. The Arch Linux RISC-V package maintainer (`felixonmars`) independently applied the `sys/syscall.h` fix as a distro patch ([rutabaga-ffi/riscv64.patch](https://github.com/felixonmars/archriscv-packages/blob/main/rutabaga-ffi/riscv64.patch)) before PR #117 landed upstream.

**Is the port fully upstream?** Partially. The Android Soong build for riscv64 is functional for guest components (post PR #117). The standalone CMake/Meson/Bazel build paths have known compile failures on riscv64 (see Section 6). No dedicated riscv64 tracking issue or project milestone exists.

---

## 3. Upstream Support Tier

No formal tier or platform support policy document exists in the gfxstream repository. Supported targets are inferred from CI and build system presence.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| GitHub Actions CI | Yes (ubuntu-22.04) | Yes (ubuntu-22.04-arm) | No |
| Release artifacts | None (repo has zero GitHub releases) | None | None |
| Official binary packages | No | No | No |
| Android Soong build target | Yes | Yes | Yes (guest components) |
| CMake standalone build | Yes | Yes | Partial (compile errors; see Section 6) |
| Meson standalone build | Yes | Yes | Partial (no cross-file provided) |
| Bazel build | Yes | Yes | No (hardcoded k8/x86_64 toolchain) |
| QEMU cross-execution in CI | No | No | No |
| Listed as supported platform | Yes (README) | Implicit | No |

gfxstream has no release infrastructure at all: `gh api /repos/google/gfxstream/releases` returns `[]`. There are no versioned releases on any platform. riscv64 support is below even the minimal bar of arm64: arm64 has a CI runner; riscv64 has none.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

gfxstream has no JIT compiler, no cryptography, and no garbage collector. The architecture-specific code is limited to: (1) memory barrier primitives in a synchronization utility, (2) CPU yield hints in ring buffer spin-wait loops, and (3) CPUID-based ISA detection for a texture decompressor.

### 4.1 Memory Fences (Lock.h)

File: [`common/base/include/gfxstream/synchronization/Lock.h`](https://github.com/google/gfxstream/blob/46d937b7fc0fe620573f59778e6e0aae30cc489e/common/base/include/gfxstream/synchronization/Lock.h)

Purpose: per-architecture store-release (`SmpWmb`) and load-acquire (`SmpRmb`) barriers for a sequence lock (SeqLock).

| Platform | Implementation | Quality |
|----------|---------------|---------|
| aarch64 | `asm volatile("dmb ishst")` / `asm volatile("dmb ishld")` | Hand-tuned inline asm |
| x86_64 | `std::atomic_thread_fence(memory_order_release/acquire)` | C++ intrinsic, compiler-generated |
| riscv64 | `std::atomic_thread_fence(memory_order_release/acquire)` | C++ intrinsic, same as x86_64 |

ISA extensions used for riscv64: none. Base RV64I only via the C++ memory model. No `fence` inline asm, no Zba/Zbb, no Ztso. Functionally correct; not hand-tuned.

### 4.2 Ring Buffer Spin-Wait Pause Hint

Files: `host/address_space/ring_buffer.cpp`, `guest/android-emu/aemu/base/ring_buffer.c`

Purpose: CPU yield hint inside spin-wait polling loops (analogous to `_mm_pause` reducing power consumption and improving SMT performance).

| Platform | Implementation | Quality |
|----------|---------------|---------|
| x86_64 | `_mm_pause()` (SSE2 PAUSE instruction) | Full |
| aarch64 | TODO comment: "TODO(bohu): find aarch64 equivalent" | Missing (no-op) |
| riscv64 | No guard, no implementation | Missing (no-op) |

The correct riscv64 implementation would use the `pause.hint` pseudo-instruction from the Zihintpause extension (encoded as `fence w,0`). Neither the host nor guest ring buffer file has any `#ifdef __riscv` guard. riscv64 is in the same state as aarch64 on this component: a known gap with a TODO that has not been addressed since the code was written.

### 4.3 ASTC Texture Decompressor CPU Detection

File: `host/compressed_textures/astc_cpu_decompressor_impl.cpp`

Purpose: runtime `cpuSupportsAvx2()` check; gates the AVX2-accelerated ASTC decode path.

| Platform | Implementation | Quality |
|----------|---------------|---------|
| x86_64 | `__cpuid` / `__get_cpuid_count` via `<cpuid.h>` | Full |
| aarch64 | Stub returning `false` (AVX2 not applicable on Arm) | Correct stub |
| riscv64 | Falls into `#else` branch using `<cpuid.h>` | Compile error |

The `#else` branch includes `<cpuid.h>`, which is an x86-specific header. On a riscv64 toolchain this header either does not exist or does not provide the required intrinsics, resulting in a compile failure. This only affects the `ASTC_CPU_DECODING=ON` cmake path (off by default). The bundled `third_party/astc-encoder` upstream does have RVV SIMD paths, but gfxstream's `third_party/CMakeLists.txt` selects `ISA_AVX2` as the else-branch for all non-aarch64 architectures, including riscv64, which would also fail.

### 4.4 memfd_create Syscall Number

File: `common/base/SharedMemory_posix.cpp`

The file contains a per-arch fallback table for `__NR_memfd_create` covering aarch64 (279), arm (279), powerpc64 (360), i386 (356), x86_64 (319). riscv64 (also 279 on Linux) was absent, causing a compile failure or wrong syscall number. This was fixed by [PR #117](https://github.com/google/gfxstream/pull/117) (merged 2026-04-11) by switching from the fallback table to `#include <sys/syscall.h>`.

### 4.5 Third-Party SIMD Libraries

| Library | Location | riscv64 SIMD Path |
|---------|----------|-------------------|
| astc-encoder | `third_party/astc-encoder` | AVX2/SSE/NEON dispatched; no RVV path in gfxstream's copy (upstream has RVV but gfxstream's CMakeLists.txt selects AVX2 for non-aarch64) |
| GLM | `third_party/glm` | Falls back to `GLM_ARCH_PURE` software path on riscv64 |

No vector intrinsics, no JIT backend, no crypto assembly exists in the gfxstream codebase proper. The project's own code is architecture-neutral C++17 except for the components listed above.

---

## 5. Build System, Cross-Compilation, and Toolchain

gfxstream supports four build systems. None provides a riscv64 toolchain file or cross-compilation preset.

### 5.1 CMake

Required version: 3.18 (from `cmake_minimum_required(VERSION 3.18)`). C++ standard: C++17. C standard: C11. CI uses Clang (default apt version on ubuntu-22.04, typically clang-14).

Standard Linux build:
```
mkdir build && cd build
cmake .. -G Ninja
ninja
```

For riscv64 cross-compilation (no toolchain file is provided; user must supply one):
```
cmake .. -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-linux-gnu.cmake \
  -DDEPENDENCY_RESOLUTION=SYSTEM \
  -DENABLE_VKCEREAL_TESTS=OFF
ninja
```

The `CMakeLists.txt` sets `CMAKE_GTEST_DISCOVER_TESTS_DISCOVERY_MODE` to `PRE_TEST` with the comment "This is problematic in some build environments. (for example: if cross-compiling)" -- confirming that the project developers are aware of cross-compilation as a use case but have not implemented it.

For Linux, `USE_X11` and `VK_USE_PLATFORM_XCB_KHR` are unconditionally added as compile definitions. These must be suppressed for a headless riscv64 build; there is no automatic mechanism to do so.

Key CMake options (all OFF by default unless noted):

| Flag | Default | Note |
|------|---------|------|
| `ENABLE_VKCEREAL_TESTS` | OFF | Unit tests |
| `BUILD_STANDALONE` | ON | Standalone base libs |
| `DEPENDENCY_RESOLUTION` | AOSP | `AOSP` or `SYSTEM` |
| `ASTC_CPU_DECODING` | OFF | CPU ASTC decode; has riscv64 compile error when ON |
| `USE_ANGLE_SHADER_PARSER` | OFF | ANGLE integration |
| `WITH_BENCHMARK` | OFF | Benchmark build |

### 5.2 Meson

Standard build:
```
meson setup -Ddefault_library=static -Dgfxstream-build=host build
meson compile -C build
```

For riscv64 cross-compilation (no cross-file provided):
```
meson setup -Ddefault_library=static -Dgfxstream-build=host \
  --cross-file /path/to/riscv64-linux-gnu.ini build
meson compile -C build
```

The `meson.build` notes that pkgconfig does not work with cross-compilation. A riscv64 cross-file would need to resolve dependencies via `cc.find_library()` manually.

### 5.3 Bazel

Hermetic LLVM 18.1.8 toolchain via `toolchains_llvm` (pinned in `MODULE.bazel`). The `cc_toolchain_config.bzl` hardcodes `target_cpu = "k8"` (x86_64). No riscv64 platform constraint or toolchain entry exists.

Standard build:
```
bazel build ...
bazel test ...
```

Graphics driver selection:
```
bazel build ... --graphics_drivers=gles_angle_vulkan_swiftshader
bazel build ... --graphics_drivers=gles_angle_vulkan_lavapipe
```

riscv64 cross-compilation via Bazel would require adding a new platform definition and `cc_toolchain` entry. No such entry exists.

### 5.4 Android Soong

```
m libgfxstream_backend
```

Requires a full Android repo checkout. riscv64 is a supported Android target architecture. The `android_vendor_riscv64_shared` Soong build target is active (confirmed by the Feb 2025 build fix commits). This is the only build path where riscv64 is known to work end-to-end (post PR #117).

### 5.5 QEMU Usage

gfxstream is consumed by QEMU as a virtio-gpu backend; QEMU is not a build-time dependency. No `qemu-user-static` or cross-execution scripts are present in the repo. No CI job uses QEMU for test execution.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Compile-Time Gaps (will prevent successful build)

| File / Component | Condition | Failure Mode |
|-----------------|-----------|-------------|
| `host/compressed_textures/astc_cpu_decompressor_impl.cpp` | `ASTC_CPU_DECODING=ON` | `<cpuid.h>` is x86-only; compile error on riscv64 toolchain |
| `third_party/CMakeLists.txt` (astc-encoder ISA selection) | `ASTC_CPU_DECODING=ON` | Selects `ISA_AVX2` for all non-aarch64; compile error on riscv64 |
| `common/base/SharedMemory_posix.cpp` | Kernel headers older than Linux 3.17 on riscv64 | `__NR_memfd_create` undefined; fixed by PR #117 on modern kernels |

`ASTC_CPU_DECODING` is OFF by default; the build failure only affects users who enable it explicitly. With default CMake options, gfxstream should compile on riscv64 after PR #117, but this has not been verified by any CI.

### 6.2 Runtime Functional Gaps

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Memory fence barriers (SeqLock) | Correct (C++ intrinsic) | Correct (inline asm) | Correct (C++ intrinsic) |
| Ring buffer spin-wait pause | Full (_mm_pause) | Missing (no-op TODO) | Missing (no-op) |
| ASTC CPU decode (optional) | Full (AVX2) | Scalar (returns false) | Compile error |
| SharedMemory / memfd_create | Full | Full | Fixed (PR #117, 2026-04-11) |
| Vulkan guest encoder | Full | Full | Untested |
| OpenGL ES guest encoder | Full | Full | Untested |
| virtio-gpu host decoder | Full | Full | Untested |
| Cuttlefish gfxstream GPU mode | Working | Working | Broken (Issues #144, #145) |
| SwiftShader software renderer | Full | Full | Partial (LLVM version caveat; see Section 9) |

### 6.3 Performance Gaps

No RISC-V benchmark data exists for gfxstream. No fps, throughput, or latency numbers comparing riscv64 to amd64 or arm64 have been published in GitHub issues, RISE blog posts, or web-accessible conference proceedings.

The ring buffer pause hint gap (Section 4.2) affects spin-wait efficiency in the encoder/decoder communication path. The impact on riscv64 is unknown without measurement.

### 6.4 Security Hardening

Data not available: no search results for CFI, shadow call stack, or other hardening flags specific to riscv64 in gfxstream.

### 6.5 Floating-Point Semantics

Data not available: no riscv64-specific floating-point or NaN handling issues have been filed against gfxstream.

---

## 7. CI/CD Infrastructure

All CI is via GitHub Actions. Three workflow files exist:

- `.github/workflows/postsubmit.yaml`
- `.github/workflows/presubmit.yaml`
- `.github/workflows/presubmit_bazel.yml`

The string "riscv" appears zero times across all three files. The complete runner inventory is:

| Runner | Architecture | Used for |
|--------|-------------|---------|
| `ubuntu-22.04` | x86_64 | All build and test jobs |
| `ubuntu-22.04-arm` | AArch64 | Build-only; tests explicitly skipped (too slow) |
| `macos-26` | macOS (Apple Silicon or x86-64) | Host backend only |
| `windows-latest` | x86_64 Windows | Windows CMake build |

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Native CI runner | Yes | Yes | No |
| QEMU emulation in CI | No | No | No |
| Build tested in CI | Yes | Yes | No |
| Tests run in CI | Yes | No (explicitly skipped) | No |
| RISE-provided runner | No | No | No |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository. The Android Soong build for riscv64 (`android_vendor_riscv64_shared`) runs inside Google's internal Android CI infrastructure and is not visible via GitHub Actions.

---

## 8. Distribution and Release Status

`gh api /repos/google/gfxstream/releases` returns `[]`. Zero GitHub releases have ever been published.

| Channel | Status |
|---------|--------|
| GitHub Releases | Zero releases on any platform |
| PyPI | HTTP 404 - not a Python package |
| Ubuntu noble (packages.ubuntu.com) | Not packaged |
| Debian tracker | HTTP 404 - not tracked |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged |
| RISE Python wheel builder | Not applicable (not a Python package) |

gfxstream is a source-only project. To obtain a working riscv64 binary, a user must:

1. Clone the repository.
2. Use the Android Soong build path (requires a full AOSP checkout with riscv64 target configured) OR use CMake with a self-supplied riscv64 cross-compilation toolchain file and `-DDEPENDENCY_RESOLUTION=SYSTEM`.
3. Resolve system dependencies manually (libgtest, libgmock, Vulkan headers, etc.) for the riscv64 sysroot.
4. Disable `ASTC_CPU_DECODING` (default) or patch `astc_cpu_decompressor_impl.cpp` to handle riscv64 before enabling it.

No prebuilt binary exists for any architecture; this is not a riscv64-specific gap.

---

## 9. Dependencies

### 9.1 Summary Table

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------|------|--------------|-------------|----------------|-------|
| SwiftShader | Software Vulkan/GLES renderer (JIT via LLVM Reactor); bundled in `third_party/swiftshader` | Partial: riscv64 guards exist in `LLVMJIT.cpp`; 2026-06-08 revert of LLVM 16 default breaks cross-builds using bundled LLVM 10 | Untested (no CI) | No release artifacts | Must pass `-DSWIFTSHADER_LLVM_VERSION=16.0` explicitly; see below |
| ANGLE | OpenGL ES-to-Vulkan/Metal translation layer; optional (`USE_ANGLE_SHADER_PARSER`) | Builds on riscv64; TLS inline asm and gn arch detection fixed (Alibaba/ISCAS 2022-2023) | No riscv64 CI | No riscv64 prebuilt | Tracking bug `angleproject:8423` is an empty placeholder with zero comments since 2023 |
| astc-encoder | ASTC texture decode; optional (`ASTC_CPU_DECODING=ON`) | Upstream has RVV SIMD path; gfxstream integration broken: `CMakeLists.txt` selects AVX2 for non-aarch64 including riscv64 | Untested | No riscv64 prebuilt | Compile error when `ASTC_CPU_DECODING=ON`; off by default |
| Mesa (lavapipe) | Software Vulkan ICD (test only; only ICD JSON referenced, not compiled by gfxstream) | Mesa builds on riscv64 in major distros | Mesa CI has riscv64 via QEMU | Available in Debian/Fedora riscv64 | No build issue for gfxstream |
| glslang | GLSL-to-SPIR-V compiler; bundled (Bazel-only stub) | Builds on riscv64 (pure C++) | No riscv64 CI | No riscv64 prebuilt | No known blocking issues |
| SPIRV-Tools | SPIR-V optimizer/assembler; bundled | Builds on riscv64 (pure C++) | No riscv64 CI | No riscv64 prebuilt | No known blocking issues |
| SPIRV-Headers | SPIR-V header files | Header-only | N/A | N/A | No issues |
| Vulkan Headers | Vulkan API headers (interface only) | Header-only | N/A | N/A | No issues |
| DRM Headers | libdrm kernel interface (interface only) | Header-only | N/A | N/A | No issues |
| GLM | GLSL math library (interface only) | Header-only; falls to `GLM_ARCH_PURE` software path on riscv64 | N/A | No riscv64-specific release | No blocking issues |
| Abseil-cpp | Base utility library; `bazel_dep` | Builds on riscv64; `stacktrace_riscv-inl.inc` present | No riscv64 CI | Source release only | Issue #2002: test SEGFAULT (`absl_hashtablez_sampler_test`) on Debian riscv64 (does not reproduce on Ubuntu) |
| Protocol Buffers | Serialization; `bazel_dep` | Builds from source | No riscv64 CI | No riscv64 `protoc` prebuilt | Maintainers explicitly declined riscv64 in official releases (Issue #17798); `protoc` must be built from source for riscv64 CI |
| zlib | Compression; `bazel_dep` | Builds via portable C | OpenBSD/riscv64 CI target added (PR #1139, merged 2026-01-28) | Standard distro packages | No blocking issues; RVV Adler32 PR #1099 unmerged |
| googletest | Test framework | Builds on riscv64 | No riscv64 CI | Standard releases | Issue #3756: `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 |
| rutabaga_gfx | Rust virtio-gpu context manager; `third_party/rutabaga` | Builds on riscv64; serde_json fast-path issue #63 closed | No riscv64 CI | No riscv64 prebuilt | No blocking issues remaining |
| stb | Single-header image decode/encode | Header-only C | N/A | N/A | No issues |

### 9.2 SwiftShader Deep Dive

SwiftShader is the critical dependency. It is bundled in `third_party/swiftshader` and provides software-only Vulkan and GLES when no GPU is available, which is the expected deployment scenario for riscv64 Cuttlefish.

The SwiftShader `LLVMJIT.cpp` contains explicit riscv64 support: ORC linking layer, Medium code model, and manual ISA flags. However, commit `5b0479bd` (2026-06-08) reverted the LLVM 16 default back to the bundled LLVM 10 submodule, for Windows ARM64 reasons. LLVM 10's `InProcessMemoryManager` has a known linking failure on riscv64. Users building gfxstream with SwiftShader on riscv64 must explicitly pass `-DSWIFTSHADER_LLVM_VERSION=16.0` to the cmake configure step. This is not documented in gfxstream's build instructions.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [android-cuttlefish #144](https://github.com/google/android-cuttlefish/issues/144) | drm_virgl GPU mode broken on riscv64 Cuttlefish | Open | High | CVD fails to find OpenGL ES implementation with virpipe/drm_virgl on riscv64 |
| [android-cuttlefish #145](https://github.com/google/android-cuttlefish/issues/145) | Build instructions for QEMU with rutabaga/gfxstream support; linking errors then snowflake display corruption | Open | High | User eventually built QEMU but hit `CHECK failed in rutabaga_cmd_resource_flush()`; display output is noise |
| [android-cuttlefish #137](https://github.com/google/android-cuttlefish/issues/137) | Cuttlefish fails with `--gpu_mode=gfxstream` combined with `--cpus`/`--memory_mb` flags | Open | Medium | Maintainer comment: "QEMU emulation isn't fast and there are long-term projects going on" (references RISE RP005) |
| [android-cuttlefish #163](https://github.com/google/android-cuttlefish/issues/163) | Cuttlefish subprocess signal 11 crash on GCP Debian 11; suspected EGL/Vulkan/Display issue | Open | Medium | Not confirmed as riscv64-specific |
| [gfxstream PR #117](https://github.com/google/gfxstream/pull/117) | Missing `<sys/syscall.h>` include in `SharedMemory_posix.cpp` | Closed/Fixed (2026-04-11) | Was High | `__NR_memfd_create` table missing riscv64; now fixed |
| Internal b/353528991 | `-Wcast-function-type-mismatch` error in `guest/egl/egl.cpp` for `android_vendor_riscv64_shared` | Fixed (2025-02-25) | Was Low | Build warning promoted to error under riscv64 Clang toolchain |
| gfxstream `third_party/CMakeLists.txt` | AVX2 selected for riscv64 when `ASTC_CPU_DECODING=ON` | Open, no issue filed | High (when feature enabled) | Compile error on riscv64; `ASTC_CPU_DECODING` is OFF by default |
| gfxstream `ring_buffer.cpp`, `ring_buffer.c` | No `pause.hint`/Zihintpause for riscv64 spin-wait | Open, no issue filed | Low-Medium | No-op fallback same as aarch64; correctness intact, efficiency reduced |
| [Abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) | `absl_hashtablez_sampler_test` SEGFAULT on Debian riscv64 | Open | Low | Does not reproduce on Ubuntu riscv64; may affect gfxstream test suites using Abseil sampling |
| [Protocol Buffers #17798](https://github.com/protocolbuffers/protobuf/issues/17798) | No official riscv64 `protoc` prebuilt | Open (maintainer declined) | Low-Medium | Source build works; affects CI setups that depend on prebuilt `protoc` |
| [googletest #3756](https://github.com/google/googletest/issues/3756) | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open | Low | One test failure; low-severity for gfxstream unless exercised in CI |

**Correctness bugs:** android-cuttlefish #145 documents actual display corruption (snowflake noise from `rutabaga_cmd_resource_flush` CHECK failure) on riscv64 Cuttlefish. This is the most significant correctness-class bug: GPU-accelerated graphics output is broken on riscv64 Cuttlefish as of the last reported observation.

---

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support exist in any GitHub issue, PR, or maintainer comment. The project accepted QNX and macOS platform contributions without policy objections. The primary barriers are neglect and test infrastructure gaps, not active opposition.

**Technical blockers:**

1. `ASTC_CPU_DECODING=ON` compile failure on riscv64 in standalone build (medium-complexity fix: add riscv64 branch to `astc_cpu_decompressor_impl.cpp` and `third_party/CMakeLists.txt`).
2. SwiftShader LLVM 10 `InProcessMemoryManager` failure on riscv64 (workaround exists: `-DSWIFTSHADER_LLVM_VERSION=16.0`; upstream fix requires SwiftShader maintainers to restore LLVM 16 as default or document the override).
3. `rutabaga_cmd_resource_flush()` CHECK failure causing display corruption on riscv64 Cuttlefish (android-cuttlefish #145): root cause undiagnosed; no fix in progress.
4. `USE_X11` / `VK_USE_PLATFORM_XCB_KHR` unconditionally set for Linux in CMake/Meson: requires suppression for headless riscv64 cross-builds.
5. No Bazel platform/toolchain entry for riscv64: adding one requires upstream acceptance.

**Organizational blockers:**

- Google CLA required for all PRs. Straightforward for corporate contributors.
- The primary review queue is Android internal Gerrit. GitHub PRs are reviewed but may take longer than AOSP-internal changes.
- No RISE RP (Research Project) covers gfxstream directly. RISE RP005 (QEMU TCG V/Zvk support) is adjacent and may improve the host emulation performance that affects gfxstream on riscv64, but it does not address gfxstream's own code gaps.

**Acceptance probability for a riscv64 port PR:** High for correctness fixes (the syscall header fix was merged in 1 day). Lower for CI infrastructure changes (no riscv64 CI runner budget, no maintainer-driven demand). The rutabaga display corruption bug requires access to riscv64 Cuttlefish hardware for diagnosis, which is a practical barrier for external contributors.

---

## 13. Investment Analysis

RISE has not funded any gfxstream-specific RISC-V work. The syscall header fix (PR #117) was contributed externally (distro community via Arch Linux RISC-V, then upstreamed). No RISE working group has gfxstream on its roadmap.

### 13.1 Functional Enablement

1. Fix `astc_cpu_decompressor_impl.cpp` and `third_party/CMakeLists.txt` for riscv64: add `#ifdef __riscv` stub returning `false` (matching the aarch64 pattern); add `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv"` branch selecting `ISA_NONE` or `ISA_RVV` in the CMakeLists.
2. Add `USE_X11` / `VK_USE_PLATFORM_XCB_KHR` suppression for riscv64 cross-builds in CMake and Meson.
3. Diagnose and fix `rutabaga_cmd_resource_flush()` CHECK failure on riscv64 Cuttlefish (android-cuttlefish #145). Requires riscv64 Cuttlefish hardware access and familiarity with the rutabaga protocol.
4. Document the `-DSWIFTSHADER_LLVM_VERSION=16.0` workaround in gfxstream build instructions until SwiftShader restores LLVM 16 as default.

### 13.2 Performance Optimization

1. Add `pause.hint` (Zihintpause extension) to `ring_buffer.cpp` and `ring_buffer.c` for riscv64: `asm volatile("fence w,0")`. Low-complexity; maps directly to existing x86/arm64 pattern.
2. Enable RVV (V extension) path in `third_party/astc-encoder` for riscv64 once `ASTC_CPU_DECODING=ON` build is fixed: upstream astc-encoder already has this; gfxstream's `CMakeLists.txt` integration needs `ISA_RVV` selection for riscv64 with `__riscv_v` guard.
3. Replace C++ intrinsic memory fences in `Lock.h` with riscv64 inline asm (`fence rw,rw` / `fence r,rw`) for the Ztso or base spec case, matching the aarch64 `dmb` quality level. Low-priority: the C++ intrinsic is functionally correct.

### 13.3 CI/CD Infrastructure

1. Add riscv64 build job to `.github/workflows/presubmit.yaml` using QEMU (`ubuntu-22.04` + `qemu-user-static` + riscv64 sysroot) or a RISE-provided native riscv64 runner.
2. Run tests under QEMU (software-only path via SwiftShader/lavapipe). Performance will be slow; the arm64 pattern (build-only, tests skipped) is the minimum viable starting point.

### 13.4 Ecosystem Enablement

Not applicable. gfxstream has no dependent package ecosystem. It is a runtime library consumed by Cuttlefish, QEMU, and Android.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | Fix `astc_cpu_decompressor_impl.cpp` and `third_party/CMakeLists.txt` for riscv64 (`ASTC_CPU_DECODING=ON` compile error) | 1 | External contributor or RISE | High |
| Functional | Add riscv64 headless build option (suppress `USE_X11`/`VK_USE_PLATFORM_XCB_KHR`) in CMake and Meson | 1 | External contributor | High |
| Functional | Diagnose and fix `rutabaga_cmd_resource_flush()` CHECK failure on riscv64 Cuttlefish (android-cuttlefish #145) | 4-8 | Google or party with riscv64 Cuttlefish hardware | Critical |
| Functional | Document SwiftShader `-DSWIFTSHADER_LLVM_VERSION=16.0` workaround in gfxstream build docs | 0.25 | Any contributor | Medium |
| Performance | Add riscv64 `pause.hint` (Zihintpause) to ring buffer spin-wait loops | 0.5 | Any contributor | Medium |
| Performance | Enable RVV path in `third_party/astc-encoder` integration for riscv64 | 2 | Any contributor with RVV test hardware | Low |
| CI/CD | Add riscv64 build job to GitHub Actions presubmit (QEMU or RISE native runner) | 2 | RISE infra / contributor | High |
| CI/CD | Add riscv64 software-rendering test execution to CI (lavapipe or SwiftShader) | 3 | RISE infra / Google | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [gfxstream GitHub repository](https://github.com/google/gfxstream)
- [Lock.h with riscv64 memory fence guards](https://github.com/google/gfxstream/blob/46d937b7fc0fe620573f59778e6e0aae30cc489e/common/base/include/gfxstream/synchronization/Lock.h)
- [Commit 383b853dd5: Disable -Wcast-function-type-mismatch for android_vendor_riscv64_shared (2025-02-25)](https://github.com/google/gfxstream/commit/383b853dd5701c853a41278db19004cd5e6e2236)
- [Commit 0deaa83985: Disable -Wcast-function-type-mismatch revised version (2025-02-26)](https://github.com/google/gfxstream/commit/0deaa8398542d32f4d986db25f1b5946a920dc83)
- [PR #117: Add missing syscall header include (merged 2026-04-11)](https://github.com/google/gfxstream/pull/117)
- [android-cuttlefish issue #144: drm_virgl GPU mode broken on riscv64](https://github.com/google/android-cuttlefish/issues/144)
- [android-cuttlefish issue #145: QEMU with rutabaga/gfxstream linking errors and display corruption on riscv64](https://github.com/google/android-cuttlefish/issues/145)
- [android-cuttlefish issue #137: Cuttlefish fails with --gpu_mode=gfxstream on riscv64](https://github.com/google/android-cuttlefish/issues/137)
- [android-cuttlefish PR #2393: Update Gfxstream to 765baff (merged 2026-04-14)](https://github.com/google/android-cuttlefish/pull/2393)
- [Arch Linux RISC-V rutabaga-ffi/riscv64.patch](https://github.com/felixonmars/archriscv-packages/blob/main/rutabaga-ffi/riscv64.patch)
- [RISE Project member list](https://riseproject.dev/members/)
- [Abseil-cpp issue #2002: SEGFAULT in sampler tests on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [Protocol Buffers issue #17798: No riscv64 protoc prebuilt](https://github.com/protocolbuffers/protobuf/issues/17798)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [zlib PR #1139: OpenBSD/riscv64 CI target (merged 2026-01-28)](https://github.com/madler/zlib/pull/1139)