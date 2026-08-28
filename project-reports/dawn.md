---
title: dawn
---

# dawn

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for dawn<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Dawn is Google's open-source implementation of the WebGPU API and the WGSL shader language. It serves as the WebGPU backend for Chromium, Chrome OS, and Android. Dawn translates WebGPU draw calls into platform GPU APIs: Vulkan on Linux/Android, Metal on macOS/iOS, Direct3D 12 on Windows, and OpenGL ES as a fallback. The Tint compiler component handles WGSL source and SPIR-V conversion. Dawn carries a BSD 3-Clause license. Google's own disclaimer in the repository reads "this is not an officially supported Google product."

**Governance.** Dawn uses Chromium-style governance via Gerrit at [dawn-review.googlesource.com](https://dawn-review.googlesource.com). All changes require at least one committer review; non-trivial changes require two. There is no independent steering committee. Google employees control the top-level OWNERS file. The committer nomination path is meritocratic: 20 non-trivial patches, three endorsing reviewers, then a vote by top-level OWNERS. Non-Google contributors are eligible. Top-level OWNERS at time of research: Corentin Wallez, David Neto, Dan Sinclair, Geoff Lang (all Google or Chromium identity), Jiawei Shao (Intel), James Price and Kai Ninomiya (Google).

**Corporate composition.** From the 100 most recent commits: google.com accounts for approximately 42 commits, chromium.org accounts (Google employees using Chromium identity) approximately 36 commits, intel.com 7 commits, microsoft.com 2 commits.

**Community stance on new ports.** The `docs/support.md` file categorizes targets as "Supported," "Work in progress," or "Not supported, contributions welcome." RISC-V does not appear in any of these tiers. The CONTRIBUTING.md directs contributors to discuss architectural or risky changes on the Dawn Matrix channel or mailing list before submitting a patch.

**RISE involvement.** Google is a RISE Premier Member. Dawn itself is not a RISE project and has no RISE working group. A complete scan of all RISE blog posts and the RISE Python wheel builder package list found zero mentions of Dawn, WebGPU, or GPU-related RISC-V work.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-08-07 | Commit [af908a32](https://github.com/google/dawn/commit/af908a32679248b3a6a3f4a6f32519fc622bbf8a) by Corentin Wallez (Google) adds `DAWN_PLATFORM_IS_RISCV`, `DAWN_PLATFORM_IS_RISCV32`, `DAWN_PLATFORM_IS_RISCV64` macros to `src/dawn/common/Platform.h` and implements `BreakPoint()` using `asm volatile("ebreak")` for RISC-V. Reviewed by Austin Eng and Loko Kung (both Google). Bug: dawn:1506. | [GitHub commit af908a32](https://github.com/google/dawn/commit/af908a32679248b3a6a3f4a6f32519fc622bbf8a) / [Gerrit CL 98121](https://dawn-review.googlesource.com/c/dawn/+/98121) |
| 2023-03-23 | Autoroll commit [73570d8f](https://github.com/google/dawn/commit/73570d8f484d04a46d425d63a5789976942dcfd1) brings SwiftShader change "Add riscv to the list of configs generated on android" (author: jif@google.com) into Dawn's vendored SwiftShader dependency. | [GitHub commit 73570d8f](https://github.com/google/dawn/commit/73570d8f484d04a46d425d63a5789976942dcfd1) |
| 2023-11-25 | Autoroll commit [ca985447](https://github.com/google/dawn/commit/ca985447d7bfc99009715037a83c8a28a61faff6) brings ANGLE change "[riscv] Add riscv support" by yahan@iscas.ac.cn into Dawn's vendored ANGLE dependency. | [GitHub commit ca985447](https://github.com/google/dawn/commit/ca985447d7bfc99009715037a83c8a28a61faff6) |
| 2026-08-11 | [PR #78](https://github.com/google/dawn/pull/78) / [Gerrit CL 331475](https://dawn-review.googlesource.com/c/dawn/+/331475) submitted by community contributor Xeonacid (h.dwwwwww@gmail.com): "CIPD: Add riscv64 string to detect native riscv64." Adds `'riscv64'` to the `platform.machine()` check in `tools/python/cipd_deps.py`, fixing a `ValueError` that aborted CIPD dependency resolution on native riscv64 build hosts. Reviewed by Kai Ninomiya and Brian Sheedy (both Google). | [GitHub PR #78](https://github.com/google/dawn/pull/78) / [Gerrit CL 331475](https://dawn-review.googlesource.com/c/dawn/+/331475) |
| 2026-08 | **Discrepancy:** The initial research data reported PR #78 as merged (merge commit `f469154421dd8fe8beeccd29489ceafcad0622f7`, merged 2026-08-18). Direct API verification of PR #78 returned `state="closed"`, `merged_at=null`, indicating it was closed without merging on GitHub. The Gerrit CL 331475 may have landed independently via Gerrit (the canonical upstream path for Dawn), but the Gerrit review page could not be scraped to confirm. The current status of `tools/python/cipd_deps.py` in the upstream tree is therefore unverified: it may or may not contain the riscv64 detection fix. | [GitHub PR #78 API verification](https://github.com/google/dawn/pull/78) |

**All RISC-V work to date is either foundational platform infrastructure (platform macros, breakpoint instruction) contributed by Google engineers in 2022 as part of a multi-arch cleanup, or transitive dependency autorolls. There is no dedicated RISC-V porting effort, no tracking issue, and no external (non-Google, non-ISCAS) sustained contributor. The only community contribution (PR #78) has a disputed merge status.**

---

## 3. Upstream Support Tier

Dawn's `docs/building.md` defines supported Linux CPU architectures as x86-64 and arm64. x86 and mips/mips64 are listed as "untested." riscv64 is absent from the list entirely -- not even classified as "untested."

Dawn's `docs/support.md` defines three tiers for platform targets:
- Supported: Linux/Vulkan, Win32/D3D12, macOS-iOS/Metal
- Work in progress: Android, Fuchsia
- Not supported, contributions welcome: Xbox, UWP, tvOS/iPadOS

RISC-V does not appear in any tier. It is an architecture-level compile-time macro presence only, not a listed platform target.

| Metric | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| Listed in `docs/building.md` | Yes (supported) | Yes (supported) | No |
| Listed in `docs/support.md` | Yes (Supported tier) | Yes (Supported tier) | No |
| CI builders in Google infra | Yes (dozens: cq, rel, dbg variants) | Yes (dozens) | None |
| GitHub Actions CI | Yes (`ubuntu-latest` = x64) | Yes (`macos-latest`) | None |
| Upstream binary release | Yes | Yes (macOS ARM) | No |
| Debian packaging | Yes | Yes | Yes (unstable/testing only) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Dawn's CPU-side hot paths contain **no architecture-specific SIMD intrinsics for any architecture.** A search for `__m128`, `__m256`, `vld1q`, `__builtin_ia32`, `vfloat32m1_t`, and `rvv` in the source tree returns zero results relevant to optimization code. Dawn's computational workload is offloaded entirely to GPU drivers via Vulkan/Metal/D3D/OpenGL. The CPU-side code (Tint shader compiler, IR pipeline, command encoding) is pure portable C++.

The architecture-specific code in Dawn is limited to debug infrastructure:

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Platform detection macros (`platform.h`) | Yes (`__x86_64__`) | Yes (`__aarch64__`) | Yes (`__riscv` + `__riscv_xlen`) |
| Debug breakpoint instruction | Yes (`int $3`) | Yes (`brk #0`) | Yes (`ebreak`) |
| SIMD intrinsics (any) | None | None | None |
| JIT backend | None in Dawn itself | None in Dawn itself | None in Dawn itself |
| Crypto acceleration | None | None | None |
| Inline assembly (non-debug) | None | None | None |

The RISC-V breakpoint implementation in `src/utils/force_crash.h` uses `asm volatile("ebreak")`, which is the correct standard RISC-V software breakpoint instruction -- on par with the x86 and arm64 implementations. The `platform.h` detection uses `defined(__riscv)` for the family and `__riscv_xlen == 32` to distinguish RV32 from RV64, which is the standard approach. No ISA extensions beyond base RV64I are required or used.

**SwiftShader (CPU-fallback Vulkan)** is a separate concern. When Dawn is built with `DAWN_ENABLE_SWIFTSHADER=ON`, SwiftShader acts as a software Vulkan driver for headless or no-GPU contexts. SwiftShader contains an LLVM-based JIT (Reactor) with explicit riscv64 code model guards. This is tracked in `project-reports/swiftshader.md` and is a blocking dependency for software rendering paths on riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Minimum toolchain requirements** (from `docs/building.md`):
- Clang 19 or later (primary supported compiler for Linux)
- GCC 12 or later (supported)
- CMake 3.16 or later
- C++20 required

**Known compiler compatibility issue:** Clang 17-19 combined with GCC 15+ standard library causes constraint self-dependency errors at compile time. Workaround documented in `docs/building.md`:
```
sudo apt-get install gcc-14 libgcc-14-dev
cmake -DCMAKE_CXX_FLAGS="--gcc-install-dir=/usr/lib/gcc/riscv64-linux-gnu/14" ...
```

**Native riscv64 build commands** (CMake path, no depot_tools):
```
git clone https://dawn.googlesource.com/dawn dawn && cd dawn
python tools/fetch_dawn_dependencies.py

cmake -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DDAWN_FETCH_DEPENDENCIES=OFF \
  -S . -B out/Release
ninja -C out/Release
```

**Headless build (no GPU hardware, compilation check only):**
```
cmake -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DDAWN_FETCH_DEPENDENCIES=ON \
  -DDAWN_ENABLE_VULKAN=OFF \
  -DDAWN_ENABLE_OPENGLES=OFF \
  -DDAWN_ENABLE_DESKTOP_GL=OFF \
  -DDAWN_ENABLE_NULL=ON \
  -DDAWN_USE_WAYLAND=OFF \
  -DDAWN_USE_X11=OFF \
  -DDAWN_BUILD_SAMPLES=OFF \
  -DDAWN_BUILD_TESTS=OFF \
  -S . -B out/riscv64-headless
```

**Cross-compilation.** `docs/building.md` lists tested cross-compilation targets as: macOS arm64/x64 from Linux host, Windows x64 from Linux/Mac host, and Android arm64 from Linux host. `target_cpu="riscv64"` is not listed and there is no toolchain file for riscv64 in the repository. Cross-compilation to riscv64 requires a manually written CMake toolchain file; no upstream-provided file exists.

**CIPD dependency resolution.** Dawn uses CIPD (Chrome Infrastructure Package Deployment) to fetch prebuilt toolchain components. The `tools/python/cipd_deps.py` helper maps `platform.machine()` to a CIPD architecture string. Before PR #78, a native riscv64 Linux host raised `ValueError: Unable to determine architecture`. PR #78 added `'riscv64'` to the detection. However, as noted in Section 2, PR #78's GitHub merge status is disputed (GitHub API shows `merged_at=null`). Even if the detection code lands, there are no riscv64 CIPD package entries in the `DEPS` file -- the architecture is detected but there are no prebuilt packages to download for it. [NEEDS VERIFICATION: current state of `tools/python/cipd_deps.py` in the canonical Gerrit tree]

**QEMU.** No QEMU usage anywhere in the Dawn repository. No CI runner, script, or documentation references QEMU.

**Docker.** No Dockerfiles exist in the google/dawn repository. Dawn CI uses LUCI bots on Google Compute Engine instances.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Vulkan backend | Yes, tested in CI | Yes, tested in CI | Source compiles; not CI-tested; requires a Vulkan driver |
| Metal backend | macOS only | macOS/iOS only | N/A (macOS-only API) |
| D3D12 backend | Yes (Windows) | N/A | N/A |
| OpenGL ES backend | Yes | Yes | Source compiles; not CI-tested |
| Desktop GL backend | Yes | Yes | Source compiles; not CI-tested |
| Null backend (headless) | Yes | Yes | Should compile (no arch-specific code) |
| SwiftShader (CPU Vulkan) | Yes, LLVM JIT working | Yes, LLVM JIT working | Blocked -- CMake misdetects arch; LLVM 10 default breaks JIT (see `project-reports/swiftshader.md`) |
| Tint shader compiler | Yes | Yes | Should compile (pure C++); not CI-tested |
| Debug breakpoint | Yes | Yes | Yes (`ebreak`) |
| Platform detection macros | Yes | Yes | Yes |
| CIPD toolchain fetch on native host | Yes | Yes | Disputed (PR #78 status unclear) |

**Functional gaps:** SwiftShader CPU-fallback Vulkan is the only functional gap with a concrete identified blocker. All GPU backends require an appropriate GPU driver for the target hardware -- riscv64 Vulkan drivers exist (e.g., for SpacemiT/ESWIN SoCs) but are not Dawn's responsibility. The Tint compiler and all Dawn GPU backend code are pure portable C++ with no arch-specific compilation paths.

**Performance gaps:** No benchmark data of any kind exists for Dawn on riscv64. Data not available: no published benchmark results, no CI performance baselines, and no RISE blog posts covering Dawn GPU performance on RISC-V hardware.

**Security hardening gaps:** Data not available: no analysis of CFI, stack protector, or shadow call stack configurations for riscv64 in Dawn's build system was conducted.

**Floating-point semantics:** Dawn does not perform CPU-side floating-point computation in performance-critical paths; shader arithmetic is executed on GPU hardware. No riscv64-specific floating-point issues were identified.

---

## 7. CI/CD Infrastructure

**Verdict: zero riscv64 CI of any kind exists upstream.**

Evidence comes from direct file reads of all six workflow files in the repository:

- `.github/workflows/ci.yml` -- OS matrix is `[windows-latest, ubuntu-latest, macos-latest, macos-15-intel]`. The Ubuntu job runs in a `dockcross/manylinux_2_28-x64:latest` container (x86-64). Zero occurrences of "riscv" or "riscv64."
- `.github/workflows/release.yml` -- Zero occurrences of "riscv."
- `.github/workflows/pr-manager.yml` -- Zero occurrences of "riscv."
- `.github/workflows/pr-watcher.yml` -- Zero occurrences of "riscv."
- `dawn-ci.cmake` -- Zero occurrences of "riscv."
- `package-emdawnwebgpu.sh` -- Zero occurrences of "riscv."

The Google internal LUCI/Siso builder configuration (`infra/config/global/`) contains dozens of named builders for x86-64 and arm64 (e.g., `dawn-cq-win-x86-dbg`, `dawn-cq-mac-arm64-rel`, `dawn-android-arm64-builder-rel`). Zero riscv64 equivalents exist.

| CI metric | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| GitHub Actions build job | Yes | Yes (macOS) | No |
| Google LUCI/Siso CQ builders | Yes (many) | Yes (many) | None |
| Android device testing | Yes (x86 emulator) | Yes (arm64 emulator) | None |
| QEMU integration | No | No | No |
| RISE-provided runners | No | No | No |

Debian's buildd infrastructure (`rv-manda-04`) builds the Debian `dawn` package for riscv64 as part of Debian's own packaging pipeline. This is external to Dawn's upstream CI and does not exercise Dawn's test suite.

---

## 8. Distribution and Release Status

**Upstream GitHub releases.** Releases are published daily as automated date-stamped tags (e.g., `v20260820.214911`). Each release ships assets for macOS (Intel + ARM), Ubuntu (x86-64 only, `ubuntu-latest` runner), Windows, Android, Apple xcframework, headers, and Emscripten WebGPU packages. Zero assets contain "riscv64." Direct API verification of three recent releases confirmed no riscv64 binary in any release.

**Debian.** The `dawn` package is present in Debian unstable and testing as version `0.0~git20260724.1e897275-4`. Listed architectures: amd64, arm64, riscv64. Binary packages: `libwebgpu-dawn-dev`, `libwebgpu-dawn0`, `tint-tools`. Buildd status for riscv64: "Installed," built on `rv-manda-04` approximately six days before the research check (approximately 2026-08-08). This is a Debian packaging effort independent of upstream Google support. The package is not in Debian stable (bookworm).

**Ubuntu.** Dawn is not packaged in Ubuntu 24.04 Noble.

**Arch Linux RISC-V.** No package named "dawn" found in the [Arch Linux RISC-V porting tracker](https://archriscv.felixc.at/).

**PyPI.** A package named "dawn" exists on PyPI (`dawn-0.11.0.tar.gz`), but research indicates this is an unrelated project, not Google's WebGPU Dawn. No riscv64 wheels exist.

**What a user must do to get a working riscv64 binary today:**
1. Install Debian unstable or testing and run `apt install libwebgpu-dawn-dev` -- the only path to a prebuilt riscv64 binary.
2. Alternatively, build from source on a native riscv64 host with Clang 19+ or GCC 12+, CMake 3.16+, and manually resolving CIPD dependencies (since the cipd_deps.py fix has disputed upstream status).

---

## 9. Dependencies

Critical dependencies are those with JIT backends, arch-specific SIMD, or code generation. Dawn's Vulkan/Khronos-stack dependencies (SPIRV-Tools, SPIRV-Headers, glslang, Vulkan-Headers, Vulkan-Loader, Vulkan-ValidationLayers, VulkanMemoryAllocator) are all pure portable C++ with no arch-specific code. The blocking concerns are concentrated in SwiftShader, Abseil-cpp, and Protocol Buffers.

| Dependency | Role in Dawn | riscv64 Build | riscv64 Test | riscv64 Release | Blocking? |
|-----------|-------------|--------------|-------------|----------------|----------|
| [SwiftShader](https://github.com/google/swiftshader) | CPU-fallback software Vulkan driver (`DAWN_ENABLE_SWIFTSHADER`) | Broken by default: CMakeLists.txt has no riscv branch, falls through to x86_64 path; LLVM 10 default breaks JIT (LLVM 16 fix reverted 2026-06-08) | None | None | YES (high) -- blocks headless/software rendering |
| [ANGLE](https://github.com/google/angle) | OpenGL-over-Vulkan translation, used for Dawn's GL backends on Linux | Partial: riscv64 platform macros, TLS inline asm (`mv %0, tp`), GN build entries present; standalone CMake riscv64 untested | None upstream | None; Android/Chromium only | Conditional -- high if GL backend used, low if Vulkan-only |
| [Abseil-cpp](https://github.com/abseil/abseil-cpp) | Base library: containers, strings, logging, synchronization | Builds; stacktrace unwinder present for riscv64 | None upstream | Source-only | Soft block: open issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT in sampling tests on Debian riscv64 with GCC 15.2); issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (atomic link failure with older Bootlin toolchain) |
| [Protocol Buffers](https://github.com/protocolbuffers/protobuf) | Dawn IR binary format (`TINT_BUILD_IR_BINARY`, `DAWN_BUILD_PROTOBUF`) | Builds since [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) (merged 2024-03) | None | No `protoc` riscv64 prebuilt in any official release; [issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) closed "won't fix" | Build-time block for cross-compilation: `protoc` must be compiled from source |
| [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools) | SPIR-V assembler/validator/optimizer (Tint path) | Yes (pure C++) | None upstream | None | No |
| [SPIRV-Headers](https://github.com/KhronosGroup/SPIRV-Headers) | SPIR-V spec headers | Header-only | N/A | N/A | No |
| [glslang](https://github.com/KhronosGroup/glslang) | GLSL/HLSL to SPIR-V compiler | Yes (pure C++) | None | None | No |
| [Vulkan-Headers](https://github.com/KhronosGroup/Vulkan-Headers) | Vulkan API headers | Header-only | N/A | N/A | No |
| [Vulkan-Loader](https://github.com/KhronosGroup/Vulkan-Loader) | Vulkan ICD dispatch | Yes (no arch-specific code) | None | None | No |
| [Vulkan-ValidationLayers](https://github.com/KhronosGroup/Vulkan-ValidationLayers) | Vulkan debug layers | Yes | None | None | No |
| [VulkanMemoryAllocator](https://github.com/GPUOpen-LibrariesAndSDKs/VulkanMemoryAllocator) | GPU heap allocator (Vulkan backend) | Header-only, portable | N/A | Header-only | No |
| [zlib](https://chromium.googlesource.com/chromium/src/third_party/zlib) | Compression utilities | Builds; riscv64 uses scalar path (no arch SIMD) | N/A | N/A | No (performance degradation only) |
| [DirectXShaderCompiler](https://github.com/microsoft/DirectXShaderCompiler) | HLSL/DXIL compiler (`DAWN_USE_BUILT_DXC`) | N/A -- D3D12 backend is Windows-only | N/A | N/A | No |

**SwiftShader deep-dive** (blocking, high severity): SwiftShader's Reactor JIT has explicit `#if defined(__riscv) && __riscv_xlen == 64` guards in `LLVMJIT.cpp` (ObjectLinkingLayer, Medium code model). These guards require LLVM 16 (for JITLink). However, the SwiftShader default was switched from LLVM 10 to LLVM 16 in May 2026 and then **reverted on 2026-06-08** (commit `5b0479bd`) for unrelated Windows ARM64 reasons. The CMakeLists.txt arch-detection block has no riscv branch and misdetects riscv64 as x86_64. Combined, the default configuration is broken for riscv64. See `project-reports/swiftshader.md` for full details.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) | SEGFAULT in `hashtablez_sampler_test` and `cordz_sample_token_test` on Debian riscv64 with GCC 15.2 | Open | Medium | Affects Dawn's Abseil dependency; impacts test reliability, not runtime correctness |
| [abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) | Missing `__atomic_compare_exchange_1`/`__atomic_exchange_1` when cross-compiling with older Bootlin riscv64 toolchain | Open | Low | Toolchain-specific; use Clang 19+ or GCC 12+ to avoid |
| [protobuf #17798](https://github.com/protocolbuffers/protobuf/issues/17798) | Maven riscv64 prebuilts requested | Closed ("won't fix") | Low-Medium | No `protoc` binary for riscv64 in official releases; build-time block for cross-compilation |
| SwiftShader riscv64 CMake misdetection | CMakeLists.txt has no riscv branch; falls through to x86_64 | Open (no dedicated issue found) | High | Blocks `DAWN_ENABLE_SWIFTSHADER=ON` builds |
| SwiftShader LLVM 10 JIT failure on riscv64 | LLVM 16 riscv64 JIT support reverted to LLVM 10 default 2026-06-08 | Open (regression) | High | Blocks software rendering path |
| PR #78 disputed merge status | `tools/python/cipd_deps.py` riscv64 detection fix has unclear upstream state | Disputed | Low | GitHub API shows not merged; Gerrit landing unconfirmed |

No open RISC-V correctness bugs were found in the google/dawn GitHub mirror. The Chromium issue tracker (issues.chromium.org) requires authentication and could not be searched.

---

## 12. Objections and Upstream Blockers

**No stated objections identified.** PR #78 received two approving reviews from Google engineers (Kai Ninomiya, Brian Sheedy). The 2022 platform macro commit was authored and reviewed entirely by Google employees. There are no recorded comments in any searched source objecting to riscv64 support in Dawn.

**Technical blockers:**

1. SwiftShader CMakeLists.txt misdetection of riscv64 arch (falls through to x86_64 path) -- blocks software rendering. Requires a fix in the SwiftShader submodule.
2. SwiftShader LLVM 10 default breaks riscv64 JIT; requires LLVM 16 -- the default was reverted for unrelated reasons. Requires re-landing or a separate riscv64-specific override.
3. No riscv64 CIPD packages registered -- even after cipd_deps.py correctly detects the host architecture, there are no prebuilt toolchain packages to fetch. Dawn would require compiling all dependencies from source.
4. Protocol Buffers `protoc` has no riscv64 prebuilt -- build-time code generation for `TINT_BUILD_IR_BINARY` requires either a source build of `protoc` or cross-compilation with a host `protoc`.

**Organizational blockers:** None identified. Dawn's committer nomination process is open to external contributors. The "contributions welcome" language in support.md is consistent with accepting a riscv64 port.

**Acceptance probability for a riscv64 CI and support tier addition:** High for correctness-level CI (build + basic test). Dawn's governance does not require Google sign-off for adding a new tier; the precedent of ARM64 and Android shows Google will accept external CI contributions when backed by hardware. A RISE-funded or Qualcomm-funded CI runner would likely be accepted.

---

## 13. Investment Analysis

RISE has no current investment in Dawn. The Debian packaging (external to RISE) provides a working riscv64 library build but no CI or upstream support tier. All work scoped below is greenfield.

### 13.1 Functional Enablement

Three items are needed before Dawn functions correctly on riscv64 in all supported configurations:

1. Verify and land PR #78 / Gerrit CL 331475 (cipd_deps.py riscv64 detection). If the Gerrit CL did not land, re-submit the 5-line patch and obtain the two already-given approvals.
2. Fix SwiftShader CMakeLists.txt to add a riscv64 arch branch (prevents misdetection as x86_64). This is in the SwiftShader submodule, not Dawn proper.
3. Re-enable or override the SwiftShader LLVM 16 default for riscv64 to restore JIT functionality on the software rendering path.

Items 1-3 are prerequisite to any meaningful testing.

### 13.2 Performance Optimization

Dawn contains no CPU-side SIMD optimization code for any architecture. GPU workloads are dispatched to hardware drivers. RVV or other RISC-V ISA extension work is not applicable to Dawn itself. Performance investment should be directed at the GPU driver stack (Mesa Vulkan drivers for RISC-V SoCs) and the SwiftShader JIT code generation quality for riscv64, neither of which is inside the Dawn repository.

### 13.3 CI/CD Infrastructure

Two CI additions are needed:
1. A native riscv64 build job in GitHub Actions (using a RISC-V hardware runner or QEMU under `ubuntu-latest`) that compiles Dawn with Null backend and runs the Tint compiler unit tests.
2. A hardware-backed riscv64 Vulkan test job for targets with available Vulkan drivers (e.g., SpacemiT or ESWIN boards).

### 13.4 Ecosystem Enablement

Dawn is a C++ system library. There is no Python wheel, npm package, or Maven JAR ecosystem requiring separate riscv64 enablement. The only distribution gap is upstream binary releases (GitHub releases ship no riscv64 binary). Debian already provides riscv64 packages. No ecosystem enablement work beyond the upstream binary gap is warranted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Land cipd_deps.py riscv64 detection (re-verify PR #78 / Gerrit CL 331475 status; re-submit if not landed) | 0.5 | Any contributor | Critical |
| Functional | Fix SwiftShader CMakeLists.txt riscv64 arch detection | 1 | SwiftShader team or external contributor | Critical |
| Functional | Fix SwiftShader LLVM 16 default for riscv64 JIT | 2 | SwiftShader/Dawn team | High |
| Functional | Document riscv64 in `docs/building.md` as "untested" or "community supported" | 0.5 | Any contributor | Medium |
| CI/CD | Add riscv64 QEMU build + Tint unit test job to GitHub Actions | 2 | RISE or Qualcomm infra | High |
| CI/CD | Add riscv64 hardware Vulkan test job (requires RISC-V board with Vulkan driver) | 4 | RISE or hardware partner | Medium |
| Distribution | Add riscv64 binary to upstream GitHub releases (requires riscv64 CI runner for release.yml) | 1 | Follows CI work above | Low |
| Functional | Compile and register riscv64 CIPD packages for Dawn's toolchain dependencies | 3 | Google infra or RISE | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/dawn GitHub mirror](https://github.com/google/dawn)
- [Dawn canonical Gerrit repository](https://dawn.googlesource.com/dawn)
- [PR #78: CIPD: Add riscv64 string to detect native riscv64](https://github.com/google/dawn/pull/78)
- [Gerrit CL 331475 (PR #78 mirror)](https://dawn-review.googlesource.com/c/dawn/+/331475)
- [Commit af908a32: dawn: Make ASSERT() breakpoint on all supported platforms (2022-08-07)](https://github.com/google/dawn/commit/af908a32679248b3a6a3f4a6f32519fc622bbf8a)
- [Gerrit CL 98121 (commit af908a32 mirror)](https://dawn-review.googlesource.com/c/dawn/+/98121)
- [Commit ca985447: Roll ANGLE (2023-11-25, includes ISCAS riscv support)](https://github.com/google/dawn/commit/ca985447d7bfc99009715037a83c8a28a61faff6)
- [Gerrit CL 162325 (ANGLE autoroll mirror)](https://dawn-review.googlesource.com/c/dawn/+/162325)
- [Commit 73570d8f: Roll SwiftShader (2023-03-23, includes riscv Android build configs)](https://github.com/google/dawn/commit/73570d8f484d04a46d425d63a5789976942dcfd1)
- [Gerrit CL 125260 (SwiftShader autoroll mirror)](https://dawn-review.googlesource.com/c/dawn/+/125260)
- [Debian tracker: dawn package](https://tracker.debian.org/pkg/dawn)
- [Debian buildd riscv64 status for dawn](https://buildd.debian.org/status/package.php?p=dawn&suite=unstable)
- [RISE Project member list](https://riseproject.dev/members/)
- [abseil-cpp issue #2002: SEGFAULT in sampling tests on Debian riscv64 GCC 15.2](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #1702: missing atomic symbols with Bootlin riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [protobuf PR #12244: riscv64 build fix (merged 2024-03)](https://github.com/protocolbuffers/protobuf/pull/12244)
- [protobuf issue #17798: Maven riscv64 prebuilts (closed won't fix)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [google/swiftshader GitHub](https://github.com/google/swiftshader)
- [google/angle GitHub](https://github.com/google/angle)