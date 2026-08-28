---
title: SwiftShader
categories:
  - libraries
  - browser
---

# SwiftShader

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for SwiftShader
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

SwiftShader is a CPU-based software renderer implementing the Vulkan and OpenGL ES APIs without a GPU. Its primary use cases are test environments, Android emulation (the Cuttlefish virtual device), and Chromium fallback rendering. It is hosted at [swiftshader.googlesource.com/SwiftShader](https://swiftshader.googlesource.com/SwiftShader) with a read-only mirror at [github.com/google/swiftshader](https://github.com/google/swiftshader). The license is Apache 2.0.

SwiftShader is explicitly disclaimed as "not an official Google product," but all active maintainers are Google employees. The OWNERS file lists three standard owners: Shahbaz Youssefi (syoussefi@google.com), Geoff Lang (geofflang@google.com), and Yuly Novikov (ynovikov@google.com). Six additional "last resort suggestion" owners (sugoi, chrisforbes, cwallez, amaiorano, natsu, schuffelen) are all @google.com addresses. No external corporate maintainers exist.

All code review proceeds through Gerrit at swiftshader-review.googlesource.com, not GitHub. GitHub PRs are systematically closed and redirected to Gerrit. Contributors must sign the Google CLA. CONTRIBUTING.txt advises coordinating large changes early via the issue tracker but contains no explicit policy on new CPU port contributions.

SwiftShader is not a RISE Project member. Google is a RISE Premier Member, but SwiftShader is not listed among RISE-funded or RISE-tracked projects. No RISE blog post (27 posts, May 2024 through June 2026) mentions SwiftShader.

---

## 2. Port History and Upstreaming Timeline

All Gerrit changes below are at swiftshader-review.googlesource.com.

| Date | Event | Who | Org | Source |
|---|---|---|---|---|
| 2022-04-01 | GitHub PRs #18 and #19 opened (marl BUILD.gn, llvm-10.0 riscv64 target) | Chang Rebecca Swee Fun (rebeccasf) | StarFive Technology | [PR #18](https://github.com/google/swiftshader/pull/18), [PR #19](https://github.com/google/swiftshader/pull/19) |
| 2022-04-01 | Both PRs closed same day; work redirected to Gerrit changes 64668, 64669, 64670 | Same | StarFive Technology | PR comments |
| 2022-04-04 | [Gerrit 64668](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64668) merged: marl BUILD.gn riscv64 fiber files wired in | Same | StarFive Technology | Gerrit |
| 2022-04-04 | [Gerrit 64669](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64669) merged: llvm-10.0 update.py adds riscv64 target | Same | StarFive Technology | Gerrit |
| 2022-04-04 | [Gerrit 64670](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64670) merged: llvm-10.0 BUILD.gn and CMakeLists.txt add riscv64 configs and TableGen .inc files | Same | StarFive Technology | Gerrit |
| 2023-03-23 | Commit 0b87966: add riscv64 to Android llvm-16 config generation script; bug b/217573066 | Jean-Francois Geyelin (jif@google.com) | Google | Googlesource |
| ~2023-03 | Commit 5590857: add riscv64 to marl Android build files | Same | Google | Googlesource |
| ~2023-05 | Commit f85911d: restore missing files for riscv64 build | Same | Google | Googlesource |
| 2023-06-20 | Commit b8f1a3a: "Update Reactor/LLVMJIT for RISC-V" -- the key functional commit. Fixes ORC linking layer, manual ISA feature flags, Medium code model; tested on riscv64 Cuttlefish; bug b/273278430 | Same | Google | Googlesource |
| 2024-01-28 (landed 2026-05-27) | Commit bea72fea: switch default LLVM from 10 to 16 in BUILD.gn; motivated by riscv64 InProcessMemoryManager link failure on LLVM 10 | Levi Zim (rsworktech@outlook.com) | Independent | Googlesource |
| 2025-12-08 | [Gerrit 76888](https://swiftshader-review.googlesource.com/c/SwiftShader/+/76888) merged (commit ff4435d): fix riscv64 build with LLVM 16 -- missing forward includes in RISCVELFStreamer.h causing sizeof-on-incomplete-type error | Levi Zim | Independent | Gerrit |
| 2026-06-08 | Commit 5b0479bd: revert bea72fea ("Default to use llvm16") due to Windows ARM64 linker error; riscv64 LLVM 16 default reverted as collateral | dan sinclair | Google | Googlesource |

Key observations:

- The initial Chromium-on-RISC-V effort (bug b/217573066) originated at StarFive Technology and was adopted by a Google engineer for Android Cuttlefish.
- The functional JIT fix (b8f1a3a) was written and tested by a Google employee on real riscv64 Cuttlefish hardware.
- The 2025-12 build fix and the 2024 LLVM 16 default switch were contributed by Levi Zim, an independent external contributor. The LLVM 16 default was subsequently reverted for non-riscv64 reasons, leaving riscv64 cross-compilation on LLVM 10 broken again by default [NEEDS VERIFICATION -- the revert commit 5b0479bd was identified; actual build-break behavior on riscv64 was not re-tested].
- All changes are fully upstream (Gerrit, master branch). No downstream-only patches exist.

---

## 3. Upstream Support Tier

SwiftShader has no formal tier policy document. No PLATFORMS.md, SUPPORT.md, or docs/platforms/ file exists in the repository. Architecture support is implicitly defined by (a) CI builder coverage and (b) presence in the build system.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builders | 1 Linux, 2 Windows (LUCI/Kokoro) | None | None |
| CMakeLists.txt arch detection | Named branch | Named branch | Absent -- falls to x86_64 default |
| Android.bp coverage | x86/x86_64 only | aarch64 | riscv64 (via Geyelin commits) |
| Official binary releases | None (source-only) | None | None |
| Blocking on presubmit | Yes (commit-queue.cfg) | No | No |
| LLVM JIT backend | Full (ObjectLinkingLayer + RTDyld) | Full | Partial (ObjectLinkingLayer only, scalar) |

riscv64 is not a recognized tier. It receives no CI, no release artifacts, and the build system does not detect it by default. Support exists as Android-specific code paths (Android.bp, LLVMJIT.cpp runtime guards) and Chromium cross-compilation patches. There is no documented riscv64 support commitment from the maintainers.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SwiftShader's architecture-sensitive components are: (1) the Reactor JIT backend (LLVMJIT.cpp), (2) the Subzero JIT backend, (3) the x86 SIMD intrinsic layer (LLVMReactor.cpp / x86.hpp), (4) the Marl fiber scheduler, (5) CPU feature detection (CPUID.cpp), and (6) executable memory allocation (ExecutableMemory.cpp).

### 4.1 JIT Backend (LLVMJIT.cpp)

Three riscv64-specific code blocks are present in `src/Reactor/LLVMJIT.cpp`:

**Linking layer selection:**
```c
#if defined(__riscv) || defined(__loongarch__)
// uses ObjectLinkingLayer (JITLink)
#else
// uses RTDyldObjectLinkingLayer (legacy)
#endif
```
RTDyld does not support riscv64 relocation types; JITLink does.

**Manual ISA extension injection** (because `llvm::sys::getHostCPUFeatures()` returns empty on riscv64):
Features added: `+m` (multiply/divide), `+a` (atomics), `+f` (single-precision float), `+d` (double-precision float), `+c` (compressed). This corresponds to the RV64GC baseline mandated by the Linux ABI.
No `+v` (RVV), no Zba/Zbb/Zbs bit-manipulation, no Zfh half-precision float.

**Code model override:**
Forces `llvm::CodeModel::Medium` because the default Small model triggers "Unsupported riscv relocation" errors at JIT link time.

These workarounds are genuine and necessary. The JIT will produce correct scalar riscv64 machine code via LLVM's RISCV backend, but without any vector acceleration.

### 4.2 Subzero Backend

Not available on riscv64. `src/Reactor/reactor.gni` explicitly states: "Subzero doesn't support ARM64, LOONGARCH64, MIPS64, PPC64, and RISCV64 (only x86 and ARMv7a)." The build variable `use_swiftshader_with_subzero` evaluates to false on riscv64.

### 4.3 x86 SIMD Intrinsics Layer (LLVMReactor.cpp / x86.hpp)

181 functions in the `namespace x86` scope are gated behind `#if defined(__i386__) || defined(__x86_64__)`. These cover SSE, SSE2, and AVX operations: saturated add/subtract, pack/unpack, multiply-high, compare, shift, convert, min/max, reciprocal approximation, and more.

On riscv64 none of these functions exist. Callers fall back to LLVM IR generic equivalents where the code provides them. Some paths carry explicit "FIXME: Fallback required" or "FIXME: Unsigned" comments indicating known missing non-x86 paths. LLVM's auto-vectorizer may emit RVV instructions when targeting a cpu with +v, but SwiftShader never sets +v (see 4.1), so the fallback is scalar.

### 4.4 Marl Fiber Scheduler (third_party/marl)

Status: complete, hand-tuned.

`third_party/marl/src/osfiber_asm_rv64.S` is a 100-line riscv64 context-switch implementation that saves and restores all 12 callee-saved integer registers (s0-s11), all 12 callee-saved float registers (fs0-fs11), sp, and ra. It is structurally equivalent to the aarch64 (166 lines) and x64 (65 lines) implementations. The companion `osfiber_rv64.c` implements the trampoline. These files were merged to upstream Marl in 2021 and are present in SwiftShader's vendored copy. Gerrit change 64668 wired them into the GN build.

### 4.5 CPU Feature Detection (CPUID.cpp)

`src/Reactor/CPUID.cpp` implements only x86 CPUID probing. On riscv64 all probing returns zero. There is no HWCAP-based detection of RVV or any other riscv64 extension. The base extensions (+m+a+f+d+c) are statically hardcoded in LLVMJIT.cpp rather than detected at runtime. Dynamic RVV enablement is architecturally impossible in the current design without a new detection path.

### 4.6 Executable Memory Allocation (ExecutableMemory.cpp)

`__NR_memfd_create` is defined for x86_64, i386, aarch64, arm, powerpc64, and mips in this file. riscv64 is absent. The `anonymousFd()` function returns -1 on riscv64, and the allocator falls back to `MAP_ANONYMOUS mmap`. JIT execution still works; named JIT regions in `/proc/pid/maps` are unavailable. This is a diagnostic/debug gap, not a functional one.

### 4.7 Component Summary Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT backend (LLVMJIT.cpp) | Full (RTDyld + JITLink) | Full (RTDyld + JITLink) | Partial (JITLink only, scalar, RV64GC manual flags) |
| Subzero backend | Full | Not supported | Not supported |
| x86 SIMD intrinsics | 181 functions | 0 (not applicable) | 0 (MISSING) |
| Marl fiber scheduler | Full (hand-tuned asm) | Full (hand-tuned asm) | Full (hand-tuned asm) |
| CPUID / feature detection | Full (CPUID leaf parsing) | Partial (HWCAP) | Missing (static hardcode only) |
| memfd_create JIT memory naming | Present | Present | Missing (silent fallback) |
| RVV acceleration | N/A | N/A | None |
| Bundled LLVM RISCV target | Full | Full | Full (vendored upstream LLVM) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake Architecture Detection Gap

`CMakeLists.txt` lines 48-76 check `CMAKE_SYSTEM_PROCESSOR` against patterns for arm/aarch, mips, ppc, and loongarch, then fall to a default of `x86_64`. The string "riscv" is absent. On a native riscv64 host, `ARCH` is set to `x86_64` by cmake. LLVM's own `LLVM_DEFAULT_TARGET_TRIPLE` will still be riscv64 (it is set at compiler time, not by SwiftShader cmake), so the JIT generates correct riscv64 code, but any cmake logic conditioned on `ARCH` will behave incorrectly.

### 5.2 Build Commands for riscv64

No official riscv64 build guide or toolchain file exists in the repository. Based on CMakeLists.txt analysis:

Native build on a riscv64 host:
```bash
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DREACTOR_BACKEND=LLVM \
  -DLLVM_VERSION=16.0
cmake --build . --parallel
```

`-DREACTOR_BACKEND=LLVM` is mandatory. Subzero will not compile for riscv64.

For cross-compilation from x86_64, no toolchain file is provided. The user must supply one:
```bash
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DREACTOR_BACKEND=LLVM \
  -DLLVM_VERSION=16.0
```

### 5.3 LLVM Version Status

As of 2026-06-08, the revert of commit bea72fea restores the default LLVM version to 10.0. LLVM 10.0's bundled JITLink does not provide `llvm::jitlink::InProcessMemoryManager::Create` on riscv64 (the reported failure in the bea72fea commit message). This means the LLVM 10.0 path is broken for riscv64 JIT. The correct riscv64 path requires `-DLLVM_VERSION=16.0`, but this is not the default after the 2026-06-08 revert.

### 5.4 Toolchain Requirements

| Component | Version | Source |
|---|---|---|
| CMake | 3.22.1 minimum | cmake_minimum_required in CMakeLists.txt |
| GCC | 9+ (practical minimum) | CMakeLists.txt VERSION_GREATER_EQUAL 9 check |
| clang (for style) | 11.0.1 for clang-format presubmit | CI docker.sh |
| LLVM | 16.0 required for riscv64 JIT (not the current default) | Commit bea72fea + its revert |

### 5.5 QEMU

No QEMU usage or reference exists anywhere in the SwiftShader repository. No riscv64 Dockerfile exists. The only CI Docker image is `ubuntu-24.04-amd64/cpp-builder`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Vulkan software rendering | Yes | Yes | Yes (scalar) |
| OpenGL ES software rendering | Yes | Yes | Yes (scalar) |
| Shader JIT compilation | Yes (LLVM + Subzero) | Yes (LLVM) | Yes (LLVM only) |
| Subzero JIT backend | Yes | No | No |
| SIMD shader fast paths | Yes (SSE/SSE2/AVX via 181 intrinsics) | Partial (LLVM auto-vectorizer) | None (LLVM auto-vectorizer, scalar) |
| RVV vector acceleration | N/A | N/A | None |
| CPUID / ISA runtime detection | Yes (full) | Partial | None (hardcoded) |
| Fiber context switch | Yes (hand-tuned asm) | Yes (hand-tuned asm) | Yes (hand-tuned asm) |
| ASTC texture codec | Yes (SIMD) | Yes (SIMD) | Scalar fallback |
| memfd JIT memory naming | Yes | Yes | No (silent fallback) |
| CI coverage | Yes | No | No |
| Official binary distribution | No | No | No |

Performance gap: SwiftShader on amd64 benefits from 181 hand-coded SSE/SSE2/AVX intrinsic functions that execute in the inner shader execution loop. On riscv64 all of these paths are absent and the burden falls to LLVM's auto-vectorizer with no vector ISA enabled. The resulting scalar code will be significantly slower for any workload that exercises SIMD-heavy shader operations. No benchmark numbers exist to quantify this gap.

Security hardening gap: Data not available -- no search was conducted for CFI, shadow stack, or pointer authentication usage within SwiftShader's riscv64 code paths.

Floating-point semantics: SwiftShader uses LLVM's RISCV backend with +f+d flags (RV64GC). IEEE 754 compliance depends on LLVM's code generation for the RISCV target. No riscv64-specific floating-point correctness issues were reported in the issue tracker. Data not available: no riscv64 dEQP / Vulkan CTS run results exist to validate conformance.

---

## 7. CI/CD Infrastructure

SwiftShader has zero riscv64 CI of any kind.

Evidence:
- `.github/workflows/` does not exist (HTTP 404 on GitHub API for that path).
- `infra/config/main.star` defines exactly three LUCI builders: `chromium:try/linux-swangle-try-tot-swiftshader-x64`, `chromium:try/win-swangle-try-tot-swiftshader-x86`, `chromium:try/win-swangle-try-tot-swiftshader-x64`. The string "riscv" does not appear in this file.
- `infra/config/generated/commit-queue.cfg` reflects the same three builders.
- No `.cirrus.yml`, `Jenkinsfile`, or `.travis.yml` exists.

The December 2025 riscv64 build-fix commit (ff4435d) was reviewed and merged with only x86/x64 presubmit results. It was accepted by Google reviewers without any riscv64 build verification gate.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Presubmit build | Yes (LUCI Kokoro) | No | No |
| Presubmit test (dEQP / Vulkan CTS) | Yes (Regres) | No | No |
| Commit-queue blocking | Yes | No | No |
| QEMU-based emulation CI | No | No | No |
| RISE runners | No | No | No |

The Regres continuous regression system (referenced in PR/commit comments) tracks dEQP and Vulkan CTS results for x86_64 Linux, Windows, and macOS. No riscv64 runner is configured.

---

## 8. Distribution and Release Status

SwiftShader has no binary release distribution on any channel for any architecture.

| Channel | riscv64 status |
|---|---|
| GitHub Releases | Empty -- zero releases published |
| PyPI | HTTP 404 -- package does not exist |
| RISE wheel builder | Not applicable (C++ library, not Python) |
| Ubuntu Noble (24.04) | Not packaged |
| Debian sid | Not packaged (HTTP 404 on tracker) |
| Arch Linux | Not packaged |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged |

SwiftShader is distributed exclusively as source code via Googlesource/GitHub. It ships as a compiled component embedded inside Chromium/Chrome. End users who need a riscv64 SwiftShader binary must build from source, supply the correct cmake flags (`-DREACTOR_BACKEND=LLVM -DLLVM_VERSION=16.0`), and either work on a riscv64 native host or provide a cross-compilation toolchain file that the repository does not include.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| LLVM 10.0 (bundled third_party/llvm-10.0) | JIT backend (default after 2026-06-08 revert) | Partial -- RISCV target present in vendored tree; InProcessMemoryManager missing for riscv64 JIT | None | None | JIT non-functional on riscv64 with current default; requires -DLLVM_VERSION=16.0 override |
| LLVM 16.0 (bundled third_party/llvm-16.0) | JIT backend (required for riscv64) | Complete -- RISCV target present; build fix applied (ff4435d) | None | None | Not the current default after bea72fea revert |
| Subzero (bundled third_party/subzero) | JIT backend (x86/ARMv7 only) | Not supported on riscv64 | N/A | N/A | Must use LLVM instead |
| marl (bundled third_party/marl) | Fiber scheduler for pipeline parallelism | Full -- osfiber_rv64.c and osfiber_asm_rv64.S present; wired in BUILD.gn (Gerrit 64668) | None | None | CMakeLists.txt riscv64 wire-up not confirmed [NEEDS VERIFICATION] |
| SPIRV-Tools (bundled third_party/SPIRV-Tools) | SPIR-V validation and optimization | Architecture-neutral | N/A | N/A | Not a blocker |
| SPIRV-Headers (bundled third_party/SPIRV-Headers) | SPIR-V specification headers | Architecture-neutral | N/A | N/A | Not a blocker |
| glslang (submodule third_party/glslang) | GLSL-to-SPIR-V compiler | Architecture-neutral | N/A | N/A | Not a blocker |
| astc-encoder (bundled third_party/astc-encoder) | ASTC texture codec | Builds on riscv64; scalar fallback | None | None | No RVV path in bundled astc-encoder; performance gap only |

The most significant dependency issue is the LLVM version conflict: LLVM 10.0's bundled JITLink is insufficient for riscv64 JIT (missing InProcessMemoryManager), but LLVM 10.0 is the current default after the 2026-06-08 revert. LLVM 16.0 works and had its riscv64 build fixed in December 2025, but is not selected by default. This gap is a one-line BUILD.gn change that was already landed and reverted for unrelated reasons.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | No open riscv64 issues or PRs exist in github.com/google/swiftshader | -- | -- | Confirmed by exhaustive search for "riscv", "riscv64", "risc-v" in GitHub issues and PRs |

The absence of open issues does not indicate complete support. It indicates that no one has filed reports against riscv64 builds, consistent with no CI and no binary distribution.

The LLVM 10.0 JIT incompatibility on riscv64 (identified by the bea72fea commit message) is known but has no tracking issue.

---

## 12. Objections and Upstream Blockers

**No stated objections:** No maintainer has publicly stated opposition to riscv64 support. The three merged Gerrit changes from 2022 and the 2023 LLVMJIT.cpp functional fix all received positive reviews from Google engineers.

**Organizational posture:** RISC-V support in SwiftShader is driven entirely by Android/Cuttlefish and Chromium cross-compilation needs. Patches that serve those use cases (build fixes, JIT correctness) are accepted. Performance optimization (RVV intrinsics, SIMD dispatch) has no evident champion inside Google's SwiftShader team.

**Technical blockers:**

1. CMakeLists.txt arch detection missing for riscv64: a minor cmake change, not a philosophical blocker.
2. LLVM version default: the revert of bea72fea leaves riscv64 JIT broken with the default LLVM 10.0. Re-landing the LLVM 16 default without breaking Windows ARM64 is the immediate blocker.
3. x86 SIMD intrinsic layer: 181 functions with no riscv64 equivalent. Adding RVV-accelerated counterparts would require a full SIMD abstraction layer for RISC-V, which is a large engineering effort with no upstream demand signal.
4. No CI: without CI there is no regression detection. The riscv64 build fix in December 2025 was merged without any build verification on riscv64 -- it was accepted on the basis that the includes were obviously correct.
5. No toolchain file and no build documentation: increases friction for first-time builders.

**Acceptance probability for a well-scoped patch:** High for build fixes and correctness patches (precedent established). Moderate for CI additions (requires Google infrastructure access or external runner integration). Low for RVV performance patches without an internal champion or significant external usage data.

---

## 13. Investment Analysis

RISE has no existing investment in SwiftShader on RISC-V.

### 13.1 Functional Enablement

Three blockers prevent a clean out-of-the-box riscv64 build today:

1. CMakeLists.txt does not detect riscv64 as a named architecture. Patch is a six-line addition to the `CMAKE_SYSTEM_PROCESSOR` block.
2. The default LLVM version (10.0 after 2026-06-08 revert) has a non-functional JIT for riscv64. The fix is to re-land LLVM 16 as default (with the Windows ARM64 issue resolved), or to add a riscv64 conditional in BUILD.gn that selects LLVM 16 on that architecture.
3. `ExecutableMemory.cpp` is missing `__NR_memfd_create` for riscv64 (cosmetic, not functional).

### 13.2 Performance Optimization

The 181 x86 SIMD intrinsics in `namespace x86` have no riscv64 counterparts. Adding RVV equivalents would require: (a) a new `namespace riscv` SIMD abstraction layer, (b) runtime detection of +v via HWCAP (replacing the current static hardcode in LLVMJIT.cpp), (c) RVV implementations of each intrinsic.

This is the dominant performance gap. Without it, all shader workloads run scalar. RVV support in LLVM 16's RISCV backend is available as a code generation target, but SwiftShader never sets the +v flag and has no dispatch infrastructure to use it.

### 13.3 CI/CD Infrastructure

riscv64 has zero CI. A minimal riscv64 CI addition would require either: (a) a QEMU-based GitHub Actions runner (feasible, no Google infra access needed), or (b) a physical riscv64 builder registered with the LUCI/Kokoro system (requires Google cooperation).

A GitHub Actions QEMU job running the vk-unittests binary under `qemu-user riscv64` would catch build regressions and basic functional failures without requiring physical hardware.

### 13.4 Ecosystem Enablement

SwiftShader has no downstream package ecosystem requiring separate enablement. Section 10 is omitted per scope rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch CMakeLists.txt riscv64 arch detection | 0.5 | External contributor | Critical |
| Functional | Re-land LLVM 16 default for riscv64 (or add conditional) without Windows ARM64 regression | 1 | External contributor + Google review | Critical |
| Functional | Add `__NR_memfd_create` for riscv64 in ExecutableMemory.cpp | 0.2 | External contributor | Low |
| Functional | Add cross-compilation toolchain file and build documentation for riscv64 | 1 | External contributor | High |
| CI/CD | QEMU-based GitHub Actions riscv64 build-and-test job | 2 | External contributor | High |
| Performance | Runtime HWCAP detection for riscv64 ISA extensions in LLVMJIT.cpp | 1 | External contributor | Medium |
| Performance | RVV SIMD intrinsic implementations for the 181 x86 namespace functions | 20-30 | Requires dedicated riscv64 graphics engineer | Low |
| Performance | Benchmark suite measuring SwiftShader shader throughput on riscv64 vs arm64 | 3 | External contributor | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [SwiftShader GitHub repository (mirror)](https://github.com/google/swiftshader)
- [SwiftShader Googlesource canonical repository](https://swiftshader.googlesource.com/SwiftShader)
- [GitHub PR #18: third_party: marl: add new source file for riscv64](https://github.com/google/swiftshader/pull/18)
- [GitHub PR #19: llvm-10.0: include riscv64 support](https://github.com/google/swiftshader/pull/19)
- [Gerrit 64668: marl BUILD.gn riscv64 fiber files](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64668)
- [Gerrit 64669: llvm-10.0 update.py riscv64 target](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64669)
- [Gerrit 64670: llvm-10.0 riscv64 configs and TableGen .inc files](https://swiftshader-review.googlesource.com/c/SwiftShader/+/64670)
- [Gerrit 76888: Fix riscv64 build problem with LLVM 16 (commit ff4435d)](https://swiftshader-review.googlesource.com/c/SwiftShader/+/76888)
- [infra/config/main.star (LUCI CQ config, x86/x64 only)](https://swiftshader.googlesource.com/SwiftShader/+/refs/heads/master/infra/config/main.star)
- [src/Reactor/LLVMJIT.cpp (riscv64 ORC and code model workarounds)](https://swiftshader.googlesource.com/SwiftShader/+/refs/heads/master/src/Reactor/LLVMJIT.cpp)
- [src/Reactor/reactor.gni (Subzero exclusion list includes RISCV64)](https://swiftshader.googlesource.com/SwiftShader/+/refs/heads/master/src/Reactor/reactor.gni)
- [CMakeLists.txt (root, missing riscv64 arch detection)](https://swiftshader.googlesource.com/SwiftShader/+/refs/heads/master/CMakeLists.txt)
- [RISE Project member list](https://riseproject.dev)