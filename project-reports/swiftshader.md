---
title: SwiftShader
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: marl
    relation: runtime-dependency
    criticality: critical
  - name: Subzero
    relation: runtime-dependency
    criticality: optional
  - name: SPIRV-Tools
    relation: runtime-dependency
    criticality: critical
  - name: SPIRV-Headers
    relation: runtime-dependency
    criticality: optional
  - name: astc-encoder
    relation: runtime-dependency
    criticality: optional
  - name: glslang
    relation: test-dependency
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
---

{% include dependency-graph.html slug="dependencies" subset="swiftshader" %}

# SwiftShader

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-02<br/>
**Readiness:** orange (no-upstream-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for SwiftShader<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SwiftShader is a CPU-based implementation of Vulkan 1.3, with OpenGL ES 3.1 provided through ANGLE. It needs no GPU. It is used for test environments, Android emulation (the Cuttlefish virtual device) and Chromium fallback rendering. The canonical repository is [swiftshader.googlesource.com/SwiftShader](https://swiftshader.googlesource.com/SwiftShader), and [github.com/google/swiftshader](https://github.com/google/swiftshader) is a mirror. The license is Apache 2.0, with third-party components under their own licenses. The last upstream commit was about two weeks before this report. SwiftShader is built from source with CMake or Visual Studio, and the GN build is used by Chromium. No binary releases exist.

**Governance**
- No foundation is involved. Google hosts and stewards the project.
- Code review runs through Gerrit at [swiftshader-review.googlesource.com](https://swiftshader-review.googlesource.com), and merges go through the `swiftshader-scoped` LUCI service account. GitHub pull requests are closed and redirected to Gerrit.
- There is no MAINTAINERS file. The [OWNERS file](https://swiftshader.googlesource.com/SwiftShader/+/HEAD/OWNERS) lists people with commit rights.
  - Standard owners: syoussefi (Shahbaz Youssefi), geofflang (Geoff Lang) and ynovikov (Yuly Novikov), all @google.com. schuffelen is also @google.com.
  - `LAST_RESORT_SUGGESTION` owners: sugoi, chrisforbes, cwallez, amaiorano (Antonio Maiorano) and natsu, all @google.com.
  - No non-Google maintainer and no RISC-V-specific maintainer is named.
- Contributors need the Google CLA, Gerrit review with an owner as reviewer, clang-format 11.0.1 and a passing presubmit. Contact is the swiftshader@googlegroups.com list.
- The README describes the project as "not an official Google product" [NEEDS VERIFICATION: README text not re-read].

**Community stance on new ports**
- The project is open to small external ports. Google staff reviewed and merged the external riscv64 patches (StarFive, 2022; Levi Zim, 2025) and a LoongArch patch (Wang Qing, 2024-04-18) without friction.
- A [LoongArch CMake commit](https://swiftshader.googlesource.com/SwiftShader/+/0a24bb82341ec2cbccaa06683220a02ac067db3d) is a second upstreamed port. This stance is inferred from review history, not from a written policy.
- No explicit statement for or against new ports exists, and no RISC-V roadmap was found. CONTRIBUTING.txt was not read directly in this research.

**RISE**
- SwiftShader is not a RISE project. It does not appear on [riseproject.dev](https://riseproject.dev) or on the [member page](https://riseproject.dev/members/).
- Google LLC is a RISE Premier member. The other Premier members are Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive and Tenstorrent. Nothing found links Google's membership to SwiftShader.
- The [RISE feed](https://riseproject.dev/feed/) lists 7 posts, from 2026-07-07 to 2026-09-28. None mention SwiftShader, Vulkan, graphics or Chromium. A feed may not carry the full archive, so older posts are unchecked.

## 2. Port History and Upstreaming Timeline

Gerrit changes are at swiftshader-review.googlesource.com.

| Date | Event | Source |
|---|---|---|
| 2022-01-04 | Ben Clayton (Google), "Update Marl to 7b43abfc4". The squashed marl subtree pull includes "Add rv64 support (#208)" (marl commit ce3d85d0). | SwiftShader commit history |
| 2022-02-10 | Nicolas Capens (Google), commit 4f504b04, "Fix rr::RoundIntClamped() for architectures other than x86 and ARM". The message notes RISC-V does not return clamped results when casting out-of-range floats to integers. | SwiftShader commit history |
| 2022-04-01 | Rebecca Chang Swee Fun (rebeccasf, StarFive) opens [GitHub PR #18](https://github.com/google/swiftshader/pull/18) (marl BUILD.gn riscv64 files) and [PR #19](https://github.com/google/swiftshader/pull/19) (llvm-10.0 riscv64). She closes both unmerged the same day and moves the work to Gerrit. | PR pages |
| 2022-04-04 | [Gerrit 64668](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64668) merged: "marl: add new source file for riscv64". | Gerrit REST |
| 2022-04-04 | [Gerrit 64669](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64669) merged: "llvm-10.0: update script to include riscv64 target". | Gerrit REST |
| 2022-04-04 | [Gerrit 64670](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64670) merged: "llvm-10.0: add configs/common and configs/linux for riscv64". A same-day commit also records "Reactor: riscv64 is not supported in subzero". | Gerrit REST, commit history |
| 2023-03-20 | Gerrit 71148, commit 5590857: add risc-v to marl's Android build files. Jean-Francois Geyelin (jif@google.com), bug b/217573066. | Gerrit REST; [Dawn roll](https://dawn.googlesource.com/dawn/+/c18e6d1df4f26e9a8b44f6294abbbef0ffda2c8b) |
| 2023-03-23 | Gerrit 71188, commit 0b87966: add riscv64 to the Android llvm-16 config script (`third_party/llvm-16.0/scripts/update.py`). Same author. | Gerrit REST |
| 2023-06-20 | Gerrit 71708, commit f85911d: add files back to fix the build on RISC-V. Same author. | Gerrit REST |
| 2023-06-20 | Gerrit 71768, [commit b8f1a3a](https://swiftshader.googlesource.com/SwiftShader/+/b8f1a3a): "Update Reactor/LLVMJIT for RISC-V" (authored 2023-06-12). Reviewer Ben Clayton, bug b/273278430. Tested by running graphics tests on RISC-V Cuttlefish with SwiftShader in the guest. | Googlesource |
| 2024-01-28 (landed 2026-05-27) | Gerrit 75929, [commit bea72fea](https://swiftshader.googlesource.com/SwiftShader/+/bea72feae3cf98eafd793719150c3ec57a133b8e): "Default to use llvm16" in `src/Reactor/BUILD.gn`. Levi Zim. Fuchsia stays on LLVM 10. The stated motivation is a Chromium riscv64 build error under LLVM 10 (`no member named 'Create' in 'llvm::jitlink::InProcessMemoryManager'`). | Googlesource |
| 2025-12-08 | [Gerrit 76888](https://swiftshader-review.googlesource.com/c/SwiftShader/+/76888), [commit ff4435d](https://swiftshader.googlesource.com/SwiftShader/+/ff4435d3f92dabbf65e210033ea178359ba7db0e): "Fix riscv64 build problem with LLVM 16". Levi Zim. Adds missing includes to `RISCVELFStreamer.h` to fix `sizeof` on incomplete type `llvm::MCCodeEmitter` when building Chromium for riscv64. Reviewed by Shahbaz Youssefi and Yuly Novikov. | Googlesource |
| 2026-06-08 | Gerrit 77428, [commit 5b0479bd](https://swiftshader.googlesource.com/SwiftShader/+/5b0479bd2d15058aaa9eb490e364f920ff824a8c): dan sinclair (Google) reverts bea72fea. Reviewers: Shahbaz Youssefi and Geoff Lang. | Googlesource |
| 2026-04-14 to 2026-09-03 | Downstream activity in Flutter, meta-flutter, emb_cli and android-cuttlefish (see Section 11). | GitHub |

**Earlier context (2021).** A [February 2021 Google Groups thread](https://groups.google.com/g/swiftshader/c/bkJoQRBZprM) ("SwiftShader for RISC-V32") said marl had no first-class RISC-V support. A [December 2021 to January 2022 thread](https://groups.google.com/g/swiftshader/c/jbjYWnuEuZI) ("Updating to llvm-13+ for RISCV JIT support") ended with a RISC-V port that compiled but failed unit tests pending a JIT backend. It states that the Reactor JIT needs LLVM 13 or newer for RISC-V and that the vendored LLVM 10 has no RISC-V JIT.

**Key contributors**
- Rebecca Chang Swee Fun (StarFive): the initial LLVM 10 and marl build enablement.
- Jean-Francois Geyelin (Google): the Android/Cuttlefish work and the functional JIT fix.
- Levi Zim (rsworktech@outlook.com): the LLVM 16 default switch and the December 2025 build fix. Employer not established.
- Ben Clayton, Nicolas Capens, Shahbaz Youssefi and Yuly Novikov (Google): reviewers and committers.

**Discrepancy on the revert cause.**
- The commit message of 5b0479bd says the change "Breaks the Swiftshader -> Dawn roll" with `undefined symbol: public: virtual __cdecl llvm::MCSymbolizer::~MCSymbolizer(void)`. It does not mention Windows ARM64 or riscv64.
- One research pass reported a Windows ARM64 link error. The `__cdecl` in the symbol suggests an MSVC-style target, but that is an inference.
- riscv64 was affected only as a side effect of the default reverting to LLVM 10.

**Upstream status.** All riscv64 code is in the upstream master branch on Gerrit. No downstream-only patches to the main tree were found. One exception is the Yocto [meta-vulkan recipe](https://layers.openembedded.org/layerindex/recipe/399023/) (git f72761e8), which carries `files/0001-CMake-riscv-support.patch`. Its contents were not seen [NEEDS VERIFICATION]. The Flutter engine also carries SwiftShader patches (Section 11).

## 3. Upstream Support Tier

No formal tier policy exists: there is no PLATFORMS.md or SUPPORT.md, and the OWNERS file and repo page have none. Support is implied by CI coverage and build-system presence. riscv64 is supported on a best-effort basis through the LLVM Reactor backend, driven by external contributors, Android/Cuttlefish and Chromium downstream builds.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| LUCI try builders | `linux-swangle-try-tot-swiftshader-x64`, `win-swangle-try-tot-swiftshader-x64`, `win-swangle-try-tot-swiftshader-x86` | None in this repo [NEEDS VERIFICATION: Chromium-side builders not read] | None |
| Kokoro builds | Ubuntu amd64 docker (gcc-13, CMake 3.31.2, LLVM 10.0 Debug confirmed), Windows, macOS | None found | None |
| CMake arch detection | Named branch | Named branch (`arm\|aarch`) | Absent, falls through to `ARCH=x86_64` |
| Official binary releases | None | None | None |
| Blocking on commit queue | Yes | No | No |
| Subzero backend | Supported | Not supported | Not supported |
| LLVM JIT backend | Supported | Supported | Supported on LLVM 16 via GN, scalar, RV64GC hardcoded |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The architecture-sensitive components are the Reactor LLVM JIT, the Subzero backend, the x86 SIMD intrinsic layer, the marl fiber scheduler, CPU feature detection and executable memory allocation. Nothing else in SwiftShader is RISC-V-specific. The first two files below were read from master source.

### 4.1 Reactor LLVM JIT (`src/Reactor/LLVMJIT.cpp`)

Quality: scalar, functional. It has three riscv64 blocks.
- **Linking layer.** Line 32: `#if defined(__riscv) || defined(__loongarch__)` sets `USE_LEGACY_OBJECT_LINKING_LAYER 0`. riscv64 uses `ObjectLinkingLayer` (JITLink) because only it supports RISC-V.
- **ISA features.** Lines 250-262: under `__riscv && __riscv_xlen == 64`, the features `+m +a +f +d +c` (RV64GC) are added by hand. `getHostCPUFeatures` returns nothing on RISC-V.
- **Code model.** The same block forces `CodeModel::Medium` to avoid "Unsupported riscv relocation" errors. Whether this call sits inside a riscv-only guard was not confirmed [NEEDS VERIFICATION].
- **Gaps.** There is no `+v` (RVV), no Zba/Zbb/Zbs and no Zfh. There is no riscv-specific SIMD dispatch.

### 4.2 Subzero Backend

Not available. `src/Reactor/reactor.gni` lines 12-13 exclude riscv64 (`supports_subzero` is false). Its comment reads "Subzero doesn't support ARM64, LOONGARCH64, MIPS64, PPC64, and RISCV64 (only x86 and ARMv7a)". The Subzero source tree has no riscv code. riscv64 must use the LLVM backend.

### 4.3 x86 SIMD Intrinsic Layer (`LLVMReactor.cpp`, `x86.hpp`)

Quality: missing, with a scalar generic-IR fallback.
- The x86 intrinsics are guarded by `#if defined(__i386__) || defined(__x86_64__)`. `LLVMReactor.cpp` has 81 such guards. No riscv or arm paths were seen.
- Generic `lowerXXX()` helpers (`lowerPAVG`, `lowerPMINMAX`) build equivalent operations from plain LLVM IR.
- `FIXME: Fallback required` (`x86::psrlw`) and `FIXME: Signedness` (`x86::pcmpgtb`) comments remain. They mark known missing non-x86 paths.
- The earlier figure of 181 functions in `namespace x86` could not be reconfirmed. About 40 call sites were seen [NEEDS VERIFICATION].

### 4.4 Marl Fiber Scheduler (`third_party/marl`)

Quality: full, hand-written assembly.
- `src/osfiber_asm_rv64.S` is about 80 lines. `marl_fiber_swap` saves and restores s0-s11, fs0-fs11, sp and ra, and returns with `jr ra`.
- `src/osfiber_rv64.c` provides `marl_fiber_trampoline` and `marl_fiber_set_target`, which set ra, a0, a1 and a 16-byte-aligned sp.
- Both are wired into GN at `third_party/marl/BUILD.gn` lines 86-90 (`current_cpu == "riscv64"`, Gerrit 64668) and into marl's CMake at `third_party/marl/CMakeLists.txt` lines 170 and 176.

### 4.5 CPU Feature Detection (`src/Reactor/CPUID.cpp`)

Quality: missing. Only x86 CPUID is implemented, under `#if defined(__i386__) || defined(__x86_64__)` (line 34). The `#else` branch zeroes the result array, so `supportsSSE4_1()` and `supportsAVX2()` return false. There is no HWCAP or `getauxval` probing. The ISA is hardcoded in `LLVMJIT.cpp`, so RVV cannot be enabled at runtime without a new detection path.

### 4.6 Executable Memory (`src/Reactor/ExecutableMemory.cpp`)

Quality: functional fallback. `__NR_memfd_create` is defined for aarch64/arm (279), powerpc64 (360), i386 (356) and x86_64 (319), but not riscv64. `anonymousFd()` returns -1 and the allocator falls back to an anonymous `mmap`. This is a diagnostic gap only. No riscv-specific handling and no `__builtin___clear_cache` call was seen.

### 4.7 Vendored LLVM RISCV Target

- `third_party/llvm-10.0` and `third_party/llvm-16.0` vendor the upstream RISCV backend. The directories hold AsmParser, Disassembler, GISel, MCA, MCTargetDesc and TargetInfo, and the V, Zb*, Zk and XTHead extension definitions. This is vendored upstream LLVM, not SwiftShader-authored code.
- LLVM 16 has a full `elseif(ARCH STREQUAL "riscv64")` branch in `third_party/llvm-16.0/CMakeLists.txt` (line 1486), plus JITLink `ELF_riscv.cpp` and `riscv.cpp`. Its `llvm-config.h` defines the `riscv64-unknown-linux-gnu` triple.
- `third_party/llvm-10.0/CMakeLists.txt` has a riscv64 branch (line 1140) that adds only TargetInfo, BaseInfo and MatInt. That is not enough to build a working JIT.
- `third_party/llvm-10.0/BUILD.gn` has a `swiftshader_llvm_riscv64` source set.

### 4.8 Component Summary

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| LLVM JIT (LLVMJIT.cpp) | Full | Full [NEEDS VERIFICATION: arm64 paths not re-read] | Scalar, JITLink only, RV64GC hardcoded |
| Subzero | Full | Not supported | Not supported |
| x86 SIMD intrinsics | Present | Not applicable | Missing (generic IR fallback) |
| Marl fibers | Hand-written asm | Hand-written asm | Hand-written asm |
| CPUID / feature detection | Full | x86-only code in CPUID.cpp; no ARM branch seen | Missing (static hardcode) |
| memfd_create naming | Present | Present | Missing (silent fallback) |
| RVV acceleration | N/A | N/A | None |
| Vendored LLVM target | Full | Full | Full (LLVM 16); LLVM 10 partial |

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Documentation

- The README gives only the generic build (`cd build; cmake ..; cmake --build . --parallel; ./vk-unittests`). The `docs/` directory has no riscv, cross-compilation or QEMU content. No Dockerfile exists in the repo.
- `docs/LLVM.md` is stale: it names LLVM 10 and lists "x64, x86, ARM, ARM64, MIPS, MIPS64". `docs/Subzero.md` covers only `-DREACTOR_BACKEND=Subzero`.

### 5.2 Why the CMake Build Fails on riscv64 as Shipped

- **Architecture detection.** Root `CMakeLists.txt` lines 47-76 match `arm|aarch`, `^mips`, `^ppc` and `^loongarch`, and everything else falls through to `ARCH=x86_64`. A riscv64 host gets `-m64 -march=x86-64` and the x86 LLVM sources, which fails on a riscv compiler.
- **LLVM version.** Lines 215-223 allow `SWIFTSHADER_LLVM_VERSION=16.0` only for `loongarch64`. Every other architecture is pinned to "10.0". The LLVM 10 vendored tree has no usable riscv64 JIT.
- **`-DARCH=riscv64` is ignored.** `set(ARCH ...)` creates a normal variable that shadows the cache value.
- **LLVM-Submodule.** The `LLVM-Submodule` branch (lines 697-709) has no riscv case, so `llvm_libs` would be empty.
- **Discrepancy.** An earlier recommendation of `-DLLVM_VERSION=16.0` is not supported by the CMake file read in this research. The option is `SWIFTSHADER_LLVM_VERSION`, and it rejects 16.0 for riscv64 until patched.
- **No riscv64 CMake commits.** In the last 1000 commits, none touched the root `CMakeLists.txt` for riscv.

### 5.3 GN Build Path

GN is the only build path where riscv64 works without a CMake patch. It uses `current_cpu`. `src/Reactor/BUILD.gn` selects `llvm-10.0` by default after the revert, so `llvm_dir` must be set to `llvm-16.0` for riscv64. This is what Flutter's patch does (Section 11). GN `args.gn` details were not read.

### 5.4 Minimal Local CMake Patch (suggested, untested)

1. Add before the final `else()` of the arch block:
```
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv.*")
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(ARCH "riscv64")
    else()
        message(FATAL_ERROR "Architecture is not supported")
    endif()
```
2. Change `if(ARCH STREQUAL "loongarch64")` at line 215 to `if(ARCH STREQUAL "loongarch64" OR ARCH STREQUAL "riscv64")`.
3. Optionally, for `LLVM-Submodule`, add `elseif(ARCH STREQUAL "riscv64") llvm_map_components_to_libnames(llvm_libs orcjit riscvasmparser riscvcodegen)`.

### 5.5 Build Commands (derived from the sources above; no upstream riscv64 command exists)

Native build on a riscv64 Linux host, after the patch:
```
git clone https://swiftshader.googlesource.com/SwiftShader && cd SwiftShader
git submodule update --init --recursive
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DREACTOR_BACKEND=LLVM -DSWIFTSHADER_LLVM_VERSION=16.0 \
  -DSWIFTSHADER_BUILD_WSI_XCB=OFF -DSWIFTSHADER_BUILD_WSI_WAYLAND=OFF \
  -DSWIFTSHADER_BUILD_TESTS=OFF -DSWIFTSHADER_WARNINGS_AS_ERRORS=OFF
cmake --build . --parallel
```
Cross-compile from x86 (assumes `gcc-riscv64-linux-gnu` and `g++-riscv64-linux-gnu`):
```
cmake .. -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_ASM_COMPILER=riscv64-linux-gnu-gcc \
  -DREACTOR_BACKEND=LLVM -DSWIFTSHADER_LLVM_VERSION=16.0 <same -D flags as above>
```
`CMAKE_ASM_COMPILER` is needed because the project enables ASM for the marl `.S` files. `-DREACTOR_BACKEND=LLVM` is mandatory because Subzero does not support riscv64. No toolchain file is provided. None of these commands was run.

### 5.6 Toolchain Requirements

| Component | Requirement | Source |
|---|---|---|
| CMake | 3.22.1 minimum; `CMAKE_POLICY_VERSION_MINIMUM` forced to 3.5 | Root CMakeLists.txt |
| C++ standard | C++17; `-fno-exceptions` applied (line 673) | Root CMakeLists.txt |
| GCC | 9 or newer adds `-Wdeprecated-copy` and `-Wno-init-list-lifetime` | Root CMakeLists.txt |
| Clang | Gets `-Wextra`, `-Wdeprecated-copy`, `-Wno-unknown-warning-option` | Root CMakeLists.txt |
| clang-format | 11.0.1 for presubmit style check | Contribution rules |
| LLVM | 16.0 for riscv64 JIT (JITLink riscv support and the `ObjectLinkingLayer` path required by `LLVMJIT.cpp`) | Commits bea72fea, b8f1a3a |

`SWIFTSHADER_WARNINGS_AS_ERRORS` defaults to ON, so newer compilers can break the build on in-tree LLVM 16 and third-party code. This is why the commands above turn it off. A minimum GCC or Clang version for riscv is not stated in the repo.

### 5.7 Build Options

Defaults are in brackets.
- `REACTOR_BACKEND`: `LLVM` [default], `LLVM-Submodule` or `Subzero`. Do not use `Subzero` on riscv64.
- `SWIFTSHADER_LLVM_VERSION`: "10.0" [default] or "16.0".
- `SWIFTSHADER_BUILD_WSI_XCB` [ON], `SWIFTSHADER_BUILD_WSI_WAYLAND` [ON], `SWIFTSHADER_BUILD_WSI_DIRECTFB` [OFF], `SWIFTSHADER_BUILD_WSI_D2D` [OFF].
- `SWIFTSHADER_BUILD_TESTS` [ON], `SWIFTSHADER_BUILD_BENCHMARKS` [OFF], `SWIFTSHADER_BUILD_PVR` [OFF].
- `SWIFTSHADER_ENABLE_ASTC` [ON], `SWIFTSHADER_LESS_DEBUG_INFO` [OFF], sanitizer options [OFF].
- Reactor debug options (`REACTOR_EMIT_*`, `REACTOR_VERIFY_LLVM_IR`) [OFF], plus `REACTOR_DEFAULT_OPT_LEVEL` and `SWIFTSHADER_LOGGING_LEVEL`.

### 5.8 QEMU

No QEMU usage, riscv64 Dockerfile or cross-compilation instructions exist in the repository. A possible invocation with a cross-built `libvk_swiftshader.so` is `qemu-riscv64 -cpu rv64,v=false -L /usr/riscv64-linux-gnu ./vk-unittests`. This is a suggestion and was not run. `LLVMJIT.cpp` hardcodes `+m +a +f +d +c`, so the emulated CPU must support RV64GC, which the default `-cpu rv64` does. JIT executable-memory handling under user-mode QEMU is unverified.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Vulkan 1.3 software rendering | Yes | Yes | Yes (scalar, LLVM 16 only) |
| Shader JIT | LLVM and Subzero | LLVM | LLVM only |
| SIMD shader fast paths | x86 intrinsics (SSE/AVX) | Generic LLVM IR | Generic LLVM IR (scalar) |
| RVV vector acceleration | N/A | N/A | None |
| Runtime ISA detection | CPUID | Not implemented in CPUID.cpp | None (hardcoded RV64GC) |
| Fiber context switch | Asm | Asm | Asm |
| ASTC codec | SIMD [NEEDS VERIFICATION] | SIMD [NEEDS VERIFICATION] | Scalar (inferred) [NEEDS VERIFICATION] |
| memfd JIT naming | Yes | Yes | No (fallback) |
| Upstream CI | Yes | No | No |
| Binary distribution | None | None | None |

**Functional gaps**
- A default CMake build does not work on riscv64 (Section 5.2).
- No Subzero backend.

**Performance gaps**
- The x86 paths in the shader inner loop have no riscv64 counterparts, and SwiftShader never sets `+v`. Shader workloads therefore run as scalar code.
- No riscv64 benchmark data was found. No SwiftShader benchmark for riscv64 or for arm64 vs riscv64 appears in the RISE feed, the GitHub searches or other searched sources.
- The only SwiftShader figure found is x86 and dates from July 2019. In the [Google Groups thread "Performance vs. llvmpipe?"](https://groups.google.com/d/msg/swiftshader/QKcxP0e-PTA/5mGeI7oJDAAJ), on an i7-4790 at 3.6 GHz with a WebRender text benchmark, llvmpipe reached about 46 FPS and SwiftShader about 5 FPS. The cause given was per-instance task splitting with 4,944 instances. It is not RISC-V data and is context only.

**Security hardening gaps.** Data not available: no search was run for CFI, shadow stack or pointer-authentication use in SwiftShader's riscv64 paths.

**Floating-point semantics.**
- Commit 4f504b04 (2022-02-10) records that RISC-V does not return clamped results when casting out-of-range floats to integers. It is the only riscv-related floating-point semantics item found.
- No riscv64 dEQP or Vulkan CTS run results were found, so conformance is unvalidated.

## 7. CI/CD Infrastructure

SwiftShader has no riscv64 CI of any kind. The files below were read via the googlesource `?format=TEXT` endpoint.

- **Root listing.** No `.github`, `.gitlab-ci.yml`, `.buildkite`, `.cirrus.yml`, `.travis.yml` or `Jenkinsfile`. The only CI-related directories are `infra/` and `tests/kokoro/`.
- **`infra/config/main.star` and `infra/config/generated/commit-queue.cfg`.** They define exactly three tryjob builders: `chromium/try/linux-swangle-try-tot-swiftshader-x64`, `chromium/try/win-swangle-try-tot-swiftshader-x64` and `chromium/try/win-swangle-try-tot-swiftshader-x86`. They run on `DRY_RUN`, `FULL_RUN` and `NEW_PATCHSET_RUN`. Neither file contains "riscv" or "rv64".
- **`tests/kokoro/`.** It has `gcp_ubuntu/`, `gcp_windows/` and `macos/`.
  - `gcp_ubuntu/build.sh` uses the docker image `ubuntu-24.04-amd64/cpp-builder`.
  - `gcp_ubuntu/docker.sh` builds with CMake 3.31.2 and gcc-13, with no cross-compilation or QEMU step.
  - The `reactor_llvm/10.0/debug` configs set `REACTOR_BACKEND=LLVM`, `LLVM_VERSION=10.0` and `BUILD_TYPE=Debug`. `reactor_subzero` has debug and release variants.
  - `macos/continuous.sh` is a native CMake build with ASAN on release.
  - The other Ubuntu, Windows and macOS configs were inferred from directory names, not opened.
- **Chromium-side builders.** They live in the Chromium repo and were not read. What they do beyond their names is unknown.
- **Regres.** The docs reference the Regres continuous regression system, which tracks dEQP and Vulkan CTS results. Its platform coverage is unverified, and no riscv64 runner was found [NEEDS VERIFICATION].

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Presubmit build | Yes (LUCI, Kokoro) | None found | No |
| dEQP / CTS testing | Regres [NEEDS VERIFICATION] | None found | No |
| Commit-queue blocking | Yes | No | No |
| QEMU emulation CI | No | No | No |
| RISE runners | No | No | No |
| Hardware used | x86-64 cloud builders | N/A | None |

The December 2025 build-fix commit ff4435d (Gerrit 76888) landed with no riscv64 gate, since the commit queue has no riscv64 builder. The only riscv64 functional test on record is the manual Cuttlefish run cited in commit b8f1a3a. No RISE runner usage was found for SwiftShader.

## 8. Distribution and Release Status

SwiftShader is distributed upstream as source only. No releases, binary packages or riscv64 mention appear on the [repository page](https://swiftshader.googlesource.com/SwiftShader).

| Channel | riscv64 status |
|---|---|
| Upstream releases (Googlesource, GitHub mirror) | None |
| PyPI | HTTP 404 on `swiftshader`; no package |
| RISE wheel builder | No `swiftshader` wheels. The index redirects to PyPI and also returns 404. The [wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) lists 81 packages and SwiftShader is not one of them. |
| Ubuntu 26.04 (resolute) | Unverified. packages.ubuntu.com returned HTTP 503 on all attempts. The Launchpad API `getPublishedBinaries` for exact name `swiftshader` on `resolute/riscv64` returned 0 entries, which is weak negative evidence and does not cover `python3-swiftshader` or `libswiftshader`. |
| Ubuntu Noble (24.04) | Not packaged per the prior assessment [NEEDS VERIFICATION: not re-checked] |
| Debian sid | No package found. The ftp-master `by_metadata/Package?q=swiftshader` query returned an empty list. The sources.debian.org name search returned 404 (unusable). |
| Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=swiftshader)) | No entry |
| Yocto [meta-vulkan](https://layers.openembedded.org/layerindex/recipe/399023/) | Source recipe only, with a downstream CMake riscv patch; no prebuilt binary |
| OCI / npm / Maven | Data not available: not searched |

The project-graph database query for Ubuntu 26.04 riscv64 did not run (the MCP server failed to connect). That is a tooling failure, not evidence the package is absent.

To get a working riscv64 binary a user must build from source. They need either the GN build with `llvm-16.0` selected or a CMake build with the local patches in Section 5.4, plus a riscv64 host or a user-supplied cross toolchain. SwiftShader also ships embedded in Chromium/Chrome and in the Flutter engine, whose riscv64 builds are described in Section 11.

## 9. Dependencies

The project-graph query was unavailable (MCP connection closed) and none of the distro-package checks below were run through it. Projects that appear in `projects.yml` are noted. Where a row says "Data not available", no research addressed that cell.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| LLVM | Reactor JIT backend, critical. Vendored as `third_party/llvm-10.0` (default) and `third_party/llvm-16.0`, plus the `llvm-project` submodule for the LLVM-Submodule backend. Tracked in `projects.yml` (project-reports/llvm.md). | LLVM 16: complete; build fix ff4435d (2025-12). LLVM 10: partial; RISCV target vendored but `InProcessMemoryManager::Create` is missing for riscv64, so the JIT is non-functional. | None (no CI, no dEQP or CTS results) | None | Upstream LLVM; vendored copies maintained by SwiftShader owners |
| marl | Fiber scheduler, critical | Full; `osfiber_asm_rv64.S` and `osfiber_rv64.c`; wired in GN and CMake | None | None | Google; rv64 added in marl commit ce3d85d0 |
| Subzero | Alternative JIT, optional | Not supported (`reactor.gni`) | N/A | N/A | Google |
| SPIRV-Tools | SPIR-V validation and optimization, critical | Architecture-neutral [NEEDS VERIFICATION: not built on riscv64 in this research] | N/A | N/A | Khronos |
| SPIRV-Headers | SPIR-V headers, optional | Architecture-neutral | N/A | N/A | Khronos |
| astc-encoder | ASTC texture codec, optional | Builds, scalar fallback (inferred; SIMD backend selection not confirmed) [NEEDS VERIFICATION] | None | None | Arm |
| glslang | GLSL-to-SPIR-V compiler, test dependency, submodule | Architecture-neutral | N/A | N/A | Khronos |
| googletest | Unit-test framework, test dependency, submodule. In `projects.yml` (project-reports/googletest.md). | Data not available: not assessed for SwiftShader; presumed architecture-neutral | Not assessed | Not assessed | Google |
| benchmark | Benchmarking, test dependency, submodule. In `projects.yml` (project-reports/benchmark.md). | Data not available: not assessed; presumed architecture-neutral | Not assessed | Not assessed | Google |
| CMake | Build system, critical | 3.22.1 minimum; the SwiftShader CMake files themselves lack riscv64 arch detection (Section 5.2) | N/A | N/A | Kitware |
| nlohmann/json (indirect) | JSON parsing, header-only submodule | Not assessed; presumed architecture-neutral | Not assessed | Not assessed | Data not available |
| cppdap, libbacktrace, PowerVR_Examples, git-hooks (indirect) | Debugger protocol, backtraces, sample apps, git hooks (submodules) | Not assessed | Not assessed | Not assessed | Data not available |

**Deep dive: LLVM**
- LLVM is the only dependency with JIT concerns. The riscv64 path requires LLVM 16 with JITLink `ObjectLinkingLayer`. Vendored LLVM 10 lacks the riscv64 `InProcessMemoryManager`, which the commit message of bea72fea names as the Chromium riscv64 build failure.
- The default LLVM version for GN builds is 10.0 after the 2026-06-08 revert. The CMake build can select 16.0 only for loongarch64 until patched.
- Recursing into LLVM 16's RISCV backend: it carries the V, Zb*, Zk and XTHead definitions, but SwiftShader enables only RV64GC.

**Deep dive: marl.** The hand-written context-switch assembly is the only riscv64 assembly in the project and is complete. It has no riscv64 CI or tests.

**Cross-cutting blockers**
- LLVM 10 is the GN default, and its JIT is non-functional on riscv64.
- The CMake build does not detect riscv64.
- There is no riscv64 CI.
- No binary releases exist for any architecture.

## 11. Known Bugs and Active Issues

No SwiftShader riscv64 issue with a tracker number was found, and there is no master tracking issue. The only references are the Google-internal bugs b/217573066 (RISC-V) and b/273278430 (JIT), which could not be opened. The following were not searched: the public [Chromium](https://issues.chromium.org) and `bugs.chromium.org/p/swiftshader` trackers and the Google Group archive.

The GitHub issue search was rate-limited (403), and a GitHub PR search for `riscv repo:google/swiftshader` returned 0 results even though PRs #18 and #19 exist, so that search is unreliable. The absence of public issues is therefore not evidence that no riscv64 bugs exist.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | CMake does not detect riscv64 and falls to `ARCH=x86_64` | Open, untracked | High | Root `CMakeLists.txt` lines 47-76. No tracking issue found. |
| (none) | LLVM 10 default: `InProcessMemoryManager::Create` missing on riscv64 | Open, untracked | High | Motivated bea72fea; returned by the revert 5b0479bd. Not re-tested. |
| [Flutter #178712](https://github.com/flutter/flutter/pull/178712) | Adds riscv64 desktop Linux engine; needs a SwiftShader `src/Reactor/BUILD.gn` patch switching `llvm-10.0` to `llvm-16.0` | Open | Medium | Downstream |
| [Flutter #181225](https://github.com/flutter/flutter/pull/181225) | "swiftshader mirrored + llvm16", described as "llvm16 + riscv on flutter"; marked to land before #178712 | Merged 2026-07-31 | N/A | Downstream |
| [meta-flutter/flutter-engine #22](https://github.com/meta-flutter/flutter-engine/pull/22) | llvm-16 needed for riscv64 because JITLink `InProcessMemoryManager` is absent in llvm-10; arm64 stays on llvm-10, riscv64 uses llvm-16 per CPU | Draft; closed 2026-09-03 per search metadata | N/A | Downstream |
| [emb_cli #153](https://github.com/toyota-connected/emb_cli/pull/153) | Flutter engine riscv64 build works with the meta-flutter patch series, including `swiftshader-llvm-16` and `swiftshader-pointer-cast`; riscv64 glibc and musl builds reported green | Merged 2026-08-13 | N/A | Downstream |
| [android-cuttlefish #2379](https://github.com/google/android-cuttlefish/pull/2379) | Bazel build fix for riscv64 | Merged 2026-04-14 | N/A | Its claim that riscv64 "falls through to pure C/software rendering" could not be verified; SwiftShader normally needs a Reactor JIT backend [NEEDS VERIFICATION] |
| (none) | `0001-CMake-riscv-support.patch` in the Yocto meta-vulkan recipe | Unknown | Low | Contents not seen; suggests CMake riscv support was not upstream [NEEDS VERIFICATION] |

**Correctness bugs.** None with a tracker number. The out-of-range float-to-integer clamping behavior on RISC-V was addressed in commit 4f504b04 (2022).

## 12. Objections and Upstream Blockers

**Stated objections.** None found. Reviews of the riscv64 changes (2022 and 2025) were positive and came from Google engineers, and the owners applied no special restriction.

**Organizational posture.**
- Support is driven by Android/Cuttlefish and Chromium/Flutter build needs.
- Patches serving those use cases (build fixes, JIT correctness) are accepted.
- No champion for RISC-V performance work (RVV, SIMD dispatch) was found.
- No RISC-V maintainer is named in OWNERS.

**Technical blockers**
1. The CMake build does not detect riscv64 and pins the LLVM version to 10.0 for all architectures except loongarch64.
2. The GN default is LLVM 10 after the revert of bea72fea. That revert was caused by a Dawn roll link failure (`MCSymbolizer` destructor undefined symbol), not by riscv64. Re-landing the LLVM 16 default must avoid that breakage, or a riscv64-only conditional can be added.
3. There is no riscv64 CI, so regressions on this path go undetected.
4. The x86 SIMD layer has no riscv equivalent, and there is no runtime ISA detection.
5. There is no toolchain file and no build documentation.

**Acceptance probability for a well-scoped patch** (inferred from review history, not stated policy)
- High for build fixes and correctness patches, given the precedent of 2022 and 2025.
- Moderate for CI additions, since the existing CI is LUCI and Kokoro on Google infrastructure.
- Low for RVV performance patches without an internal champion. No signal for or against was found.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci)
- **Release provider:** none

**Justification.** SwiftShader has riscv64 code merged upstream: marl RV64 fibers, LLVMJIT workarounds in [b8f1a3a](https://swiftshader.googlesource.com/SwiftShader/+/b8f1a3a), and the LLVM 16 build fix [ff4435d](https://swiftshader.googlesource.com/SwiftShader/+/ff4435d3f92dabbf65e210033ea178359ba7db0e). Its CI is only x86/Windows LUCI builders ([main.star](https://swiftshader.googlesource.com/SwiftShader/+/refs/heads/master/infra/config/main.star) has no riscv). There are no binary releases and no PyPI or RISE wheels, and no distro package was found (the Ubuntu 26.04 check failed, so that is unverified). The LLVM 16 path works only when selected explicitly, since the LLVM 16 default was reverted in [5b0479b](https://swiftshader.googlesource.com/SwiftShader/+/5b0479bd2d15058aaa9eb490e364f920ff824a8c). The grade is not red: the LLVM 16 path is used in Cuttlefish and Flutter riscv64 builds, so support is not confirmed broken. SwiftShader is not an optimization-purpose project, since a software Vulkan renderer's value does not depend on RISC-V-specific tuning.

**Pending work that could change the grade**
- There is no RISE involvement. SwiftShader is not RISE-tracked, and Google's RISE Premier membership has no found link to it.
- Downstream Flutter [PR #178712](https://github.com/flutter/flutter/pull/178712) (open) adds a riscv64 Linux engine and needs a SwiftShader llvm-16 `BUILD.gn` patch. Related [PR #181225](https://github.com/flutter/flutter/pull/181225) (merged 2026-07-31) is described as llvm16 + riscv on flutter.
- Re-landing the LLVM 16 default in `BUILD.gn`, adding riscv64 detection to the root `CMakeLists.txt`, and adding riscv64 CI (for example a QEMU job) could move the grade to yellow or higher.
- The Ubuntu 26.04 riscv64 package check and the project-graph query still need a retry. A clean distro build would not move the grade above yellow.

## 14. Investment Analysis

RISE has no existing work, funding or runner usage for SwiftShader. A search of the [riseproject-dev](https://github.com/riseproject-dev) organization (26 repositories) found SwiftShader only in the sw-ecosystem assessment repo, which contains readiness reports rather than engineering work. Nothing below duplicates existing RISE effort. The effort figures are estimates and are not derived from upstream data.

### 14.1 Functional Enablement

1. **CMake riscv64 detection.** Add the riscv branch to the architecture block, extend the LLVM version gate to allow 16.0 for riscv64, fix the `ARCH` cache shadowing and add the `LLVM-Submodule` riscv case (Section 5.4). This is a small change in the root `CMakeLists.txt`.
2. **LLVM 16 selection for riscv64 in GN.** Either re-land bea72fea without the Dawn link breakage or add a riscv64-only conditional in `src/Reactor/BUILD.gn`. The Flutter patch series shows a per-CPU selection that is already in use downstream. This needs Google review.
3. **`__NR_memfd_create` for riscv64** in `ExecutableMemory.cpp`. This is cosmetic, because the mmap fallback already works.
4. **Toolchain file and build documentation** for riscv64 cross-compilation, plus a refresh of the stale `docs/LLVM.md`.

### 14.2 Performance Optimization

- Runtime HWCAP detection of ISA extensions to replace the hardcoded `+m +a +f +d +c` in `LLVMJIT.cpp`.
- RVV (and Zb*/Zfh) enablement through `getauxval` or a new detection path, followed by RVV equivalents of the shader inner-loop paths currently written as x86 intrinsics. This is the dominant performance gap and the largest piece of work.
- An RVV path for the bundled astc-encoder [NEEDS VERIFICATION of the current SIMD backends].
- A benchmark suite for riscv64 vs arm64. No riscv64 or cross-architecture SwiftShader data exists today.

### 14.3 CI/CD Infrastructure

riscv64 has zero upstream CI. Two options:
- **QEMU job.** A QEMU-based job running `vk-unittests` under `qemu-riscv64` would catch build regressions and basic functional failures without physical hardware. Whether it can run on Google's LUCI/Kokoro infrastructure or must be hosted externally is an open question. Under user-mode QEMU the JIT's executable-memory behavior is unverified.
- **Physical builder.** A real riscv64 builder registered with LUCI or Kokoro needs Google cooperation.

### 14.4 Ecosystem Enablement

SwiftShader has no dependent package ecosystem that needs separate riscv64 enablement. Downstream integrators (Chromium, Dawn, the Flutter engine, Android Cuttlefish) consume it from source, so the work above covers them.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 detection and LLVM 16 gate to root CMakeLists.txt | 0.5 | External contributor | Critical |
| Functional | LLVM 16 selection for riscv64 in GN (re-land default or conditional) without Dawn roll breakage | 1 | External contributor plus Google review | Critical |
| Functional | Cross-compilation toolchain file and riscv64 build documentation | 1 | External contributor | High |
| Functional | `__NR_memfd_create` for riscv64 | 0.2 | External contributor | Low |
| CI/CD | QEMU-based riscv64 build-and-test job | 2 | External contributor, with Google infra access | High |
| Performance | Runtime HWCAP-based ISA detection in LLVMJIT.cpp | 1 | External contributor | Medium |
| Performance | Benchmark suite for riscv64 vs arm64 shader throughput | 3 | External contributor | Medium |
| Performance | RVV implementations of the x86 SIMD intrinsic paths | 20-30 | Dedicated riscv64 graphics engineer | Low |

## 15. References

- [SwiftShader canonical repository (Googlesource)](https://swiftshader.googlesource.com/SwiftShader)
- [SwiftShader GitHub mirror](https://github.com/google/swiftshader)
- [SwiftShader Gerrit review](https://swiftshader-review.googlesource.com)
- [OWNERS file](https://swiftshader.googlesource.com/SwiftShader/+/HEAD/OWNERS)
- [GitHub PR #18: marl riscv64 source file](https://github.com/google/swiftshader/pull/18)
- [GitHub PR #19: llvm-10.0 riscv64 support](https://github.com/google/swiftshader/pull/19)
- [Gerrit 64668: marl riscv64 files](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64668)
- [Gerrit 64669: llvm-10.0 update script riscv64 target](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64669)
- [Gerrit 64670: llvm-10.0 riscv64 configs](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64670)
- [Commit b8f1a3a: Update Reactor/LLVMJIT for RISC-V](https://swiftshader.googlesource.com/SwiftShader/+/b8f1a3a)
- [Commit bea72fea: Default to use llvm16](https://swiftshader.googlesource.com/SwiftShader/+/bea72feae3cf98eafd793719150c3ec57a133b8e)
- [Commit ff4435d: Fix riscv64 build problem with LLVM 16](https://swiftshader.googlesource.com/SwiftShader/+/ff4435d3f92dabbf65e210033ea178359ba7db0e)
- [Gerrit 76888: Fix riscv64 build problem with LLVM 16](https://swiftshader-review.googlesource.com/c/SwiftShader/+/76888)
- [Commit 5b0479bd: Revert of Default to use llvm16](https://swiftshader.googlesource.com/SwiftShader/+/5b0479bd2d15058aaa9eb490e364f920ff824a8c)
- [Commit 0a24bb82: loongarch64 CMake support](https://swiftshader.googlesource.com/SwiftShader/+/0a24bb82341ec2cbccaa06683220a02ac067db3d)
- [Commit 27dd2aeb: ARM/AArch64 multiarch compatibility for Reactor](https://swiftshader.googlesource.com/SwiftShader/+/27dd2aeb8c7c01001b91a65f0f15a8e47d719ab4)
- [infra/config/main.star](https://swiftshader.googlesource.com/SwiftShader/+/refs/heads/master/infra/config/main.star)
- [Vendored LLVM 16 RISCV target](https://swiftshader.googlesource.com/SwiftShader/+/HEAD/third_party/llvm-16.0/llvm/lib/Target/RISCV)
- [SwiftShader commit log filtered for riscv64](https://swiftshader.googlesource.com/SwiftShader/+log/HEAD?q=riscv64&n=50)
- [Dawn roll commit containing marl Android riscv change](https://dawn.googlesource.com/dawn/+/c18e6d1df4f26e9a8b44f6294abbbef0ffda2c8b)
- [Google Groups: SwiftShader for RISC-V32 (Feb 2021)](https://groups.google.com/g/swiftshader/c/bkJoQRBZprM)
- [Google Groups: Updating to llvm-13+ for RISCV JIT support](https://groups.google.com/g/swiftshader/c/jbjYWnuEuZI)
- [Google Groups: Performance vs. llvmpipe?](https://groups.google.com/d/msg/swiftshader/QKcxP0e-PTA/5mGeI7oJDAAJ)
- [Yocto meta-vulkan SwiftShader recipe](https://layers.openembedded.org/layerindex/recipe/399023/)
- [Flutter PR #178712](https://github.com/flutter/flutter/pull/178712)
- [Flutter PR #181225](https://github.com/flutter/flutter/pull/181225)
- [meta-flutter/flutter-engine PR #22](https://github.com/meta-flutter/flutter-engine/pull/22)
- [toyota-connected/emb_cli PR #153](https://github.com/toyota-connected/emb_cli/pull/153)
- [google/android-cuttlefish PR #2379](https://github.com/google/android-cuttlefish/pull/2379)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=swiftshader)
- [RISE Project](https://riseproject.dev)
- [RISE member list](https://riseproject.dev/members/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)