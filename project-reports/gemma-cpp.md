---
title: gemma.cpp
parent: Project Reports
---

# gemma.cpp

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for gemma.cpp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified from only one source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

gemma.cpp is a C++ inference runtime for Google's Gemma family of language models. It was created on 2024-02-13 by Google DeepMind engineers and is published under Apache-2.0 (with a BSD-3-Clause file also present). The project homepage explicitly states it is "not an officially supported Google product," meaning there is no formal product-support SLA.

**Architecture.** gemma.cpp delegates all SIMD-accelerated computation to [Google Highway](https://github.com/google/highway), a portable SIMD abstraction library. Highway's multi-target dispatch (HWY_NAMESPACE mechanism) provides runtime ISA selection across x86 (AVX-2, AVX-512), ARM (NEON, SVE), WebAssembly (SIMD128), and RISC-V (RVV). gemma.cpp contains no architecture-specific subdirectories and no hand-written assembly in its own codebase. This design means RISC-V support is inherited from Highway rather than authored in gemma.cpp itself.

**Governance.** Governance is informal and Google-internal. There is no foundation membership (Linux Foundation, Apache Software Foundation, etc.), no steering committee, no governance charter, and no CODEOWNERS or MAINTAINERS file. Development guidance is in DEVELOPERS.md. Active development happens on the `dev` branch; `main` is frozen at 2025-10-23. Community contributions are welcomed via Discord. The project follows Google's Open Source Community Guidelines. Google LLC is a Premier member of the RISE Project (highest tier), so RISE membership covers Google projects indirectly, but gemma.cpp has no dedicated RISE engagement.

**Corporate maintainers.** Jan Wassenberg (Google DeepMind, 293 commits) is the top contributor and originator of the Google Highway dependency. Austin Huang (co-founder per the homepage, 40 commits). A Google Copybara sync bot accounts for 67 commits, indicating the real development tree is Google-internal with GitHub as a downstream mirror. All other named contributors (danielkeysers, pculliton, theraysmith, szabadka, pchx, dan-zheng, apoorvreddy) appear to be Google/Google DeepMind engineers based on commit patterns. [NEEDS VERIFICATION - no public affiliation list]

**Culture toward new ports.** DEVELOPERS.md describes a "Narrow Scope" philosophy: the project focuses on direct Gemma model implementation with a small team and is willing to trade generality for simplicity. Jan Wassenberg stated directly in [issue #875](https://github.com/google/gemma.cpp/issues/875) (2026-03-26): "So far we don't have any plans for highly constrained environments." No objection to RISC-V was stated, but no active interest was stated either.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2024-02-22 | v0.1.0 released; no RISC-V code | [GitHub Releases](https://github.com/google/gemma.cpp/releases) |
| 2025-10-23 | Last commit on `main` branch; no RISC-V code on main | [google/gemma.cpp main](https://github.com/google/gemma.cpp) |
| 2026-05-29 | PR #922 "Miscellaneous cleanup" merged to `dev` branch; adds 2-line `#elif HWY_ARCH_RISCV / #define GEMMA_DISABLED_TARGETS HWY_SCALAR` block in `compression/types.h` | [gemma.cpp PR #922](https://github.com/google/gemma.cpp/pull/922) |
| 2026-08-14 (present) | `dev` branch changes from PR #922 not yet merged to `main` | [google/gemma.cpp dev](https://github.com/google/gemma.cpp/tree/dev) |

**Key contributors to the RISC-V change.** No specific author for PR #922 is identified in the research findings beyond that it was merged by Google-affiliated maintainers. [NEEDS VERIFICATION]

**Is it fully upstream?** The sole RISC-V-specific change (the 2-line `#elif HWY_ARCH_RISCV` block) is upstream in the `dev` branch of the canonical repository at [github.com/google/gemma.cpp](https://github.com/google/gemma.cpp) but is NOT yet present on `main`. No additional RISC-V commits exist anywhere in the repository: zero RISC-V issues, zero RISC-V PRs, zero RISC-V commits were found by exhaustive search across GitHub issues, PRs, commits, and code.

---

## 3. Upstream Support Tier

**Formal tier policy.** No formal platform support tier policy exists. The README states the portability target as "Linux, Windows/OS X supported. CMake/Bazel. 'Any' CPU." No tier matrix, no support matrix, no documented platform deprecation policy.

**Evidence summary by platform:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner | ubuntu-latest (x86) | macos-latest (Apple Silicon) | None |
| CI QEMU cross-compile | No | No | No |
| Build tested in CI | Yes | Yes (macOS ARM) | No |
| Release-blocking | Yes | Implicit (macOS job) | No |
| Official binaries | No (source-only releases) | No | No |
| Highway SIMD backend | AVX-2, AVX-512 | NEON, SVE | RVV (via Highway; not CI-tested in gemma.cpp) |
| `GEMMA_DISABLED_TARGETS` defined | HWY_SCALAR | HWY_SCALAR | HWY_SCALAR (dev branch only; absent on main) |

The CI workflow file `.github/workflows/build.yml` was read directly and contains zero occurrences of "riscv", "riscv64", "RISCV", "RVV", "qemu", or "cross". Runners are `ubuntu-latest`, `macos-latest`, and `windows-latest` only.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

gemma.cpp has no JIT backend, no arch-specific subdirectory, and no hand-written assembly. Architecture differentiation is entirely delegated to Highway. The sections below describe each SIMD-sensitive component.

**4.1 Target selection (`compression/types.h`)**

On `main`, the `#elif` chain enumerates ARM_V7, ARM_A64, and X86. RISC-V is absent. This means on riscv64, `GEMMA_DISABLED_TARGETS` is undefined and Highway's scalar fallback can be compiled as one of the targets alongside any RVV target Highway detects. This is a functional gap on `main`.

On `dev` (PR #922, merged 2026-05-29), a 2-line block was added:

```c
#elif HWY_ARCH_RISCV
#define GEMMA_DISABLED_TARGETS HWY_SCALAR
```

This disables the scalar fallback and forces Highway to use its RVV backend. This mirrors the identical treatment applied to WASM (HWY_ARCH_WASM / HWY_SCALAR) added in the same PR. No ISA extensions are named explicitly; the Highway RVV backend covers Zve32f/Zve64f/Zve64d as needed.

**4.2 Matrix multiply (`ops/matmul-inl.h`)**

One architecture guard exists at line 59: `#if HWY_TARGET < HWY_AVX2`. This is an x86-only block that uses `vmovdqu16` inline AVX-512 assembly to manipulate BF16 register lanes. Below AVX2 - which includes all ARM and riscv64 targets - the code falls back to `hn::PromoteOddTo()`, a Highway portable intrinsic.

The BF16 matmul hot path (`ElementwiseMulAccNativeBF` at lines 465-476) is guarded by `HWY_DASSERT(HWY_NATIVE_DOT_BF16)`. Highway sets `HWY_NATIVE_DOT_BF16 = 0` for RVV (confirmed via `set_macros-inl.h` line 703). Therefore gemma.cpp takes the `ElementwiseMulAccEmuBF` path on riscv64, which uses FMA emulation rather than pairwise widening multiply-accumulate.

**4.3 Softmax, argmax, attention (`ops/ops-inl.h`)**

Zero architecture guards for riscv64. All operations use Highway's portable SIMD API (`hn::ScalableTag<float>`, `hn::Vec`). The only arch-specific branch is `if constexpr (HWY_TARGET & HWY_ALL_SVE)`, an ARM SVE codegen workaround with no RISC-V equivalent. On riscv64, Highway selects HWY_RVV at compile time and these routines execute through Highway's RVV backend automatically.

**4.4 NUQ compression (`compression/nuq-inl.h`)**

Lines 424 and 509 contain `!HWY_ARCH_X86` conditions. riscv64 takes the non-x86 path, which is the same path used by ARM. No riscv64-specific handling.

**4.5 Assembly and intrinsics**

Zero `.S` files in the repository. Zero `#include <riscv_vector.h>` or `rvv_` prefixed calls anywhere. Zero `__asm__` blocks targeting RISC-V. Zero JIT infrastructure.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Target selection (`compression/types.h`) | HWY_SCALAR disabled | HWY_SCALAR disabled | HWY_SCALAR disabled (dev only; missing on main) |
| Matmul BF16 (avx-512 lane mask) | Inline ASM (hand-tuned) | hn::PromoteOddTo() (scalar/portable) | hn::PromoteOddTo() (scalar/portable) |
| Matmul hot path (ElementwiseMulAcc) | HWY_NATIVE_DOT_BF16 path | HWY_NATIVE_DOT_BF16 path | EmuBF FMA path (HWY_NATIVE_DOT_BF16=0) |
| Softmax / attention | Highway portable | Highway portable | Highway portable |
| Hand-written assembly | Yes (1 AVX-512 block) | No | No |
| Dedicated arch files | No | No | No |
| ISA extensions explicitly named | AVX-2, AVX-512, BF16 | NEON, SVE | None (Highway RVV auto-detected) |
| Quality | Intrinsics + portable | Workaround + portable | Portable only |

**Summary:** riscv64 has no hand-tuned kernels, no assembly, and no intrinsics in gemma.cpp itself. The classification is "scalar/portable" for all components - Highway provides RVV dispatch automatically, but gemma.cpp contributes nothing riscv64-specific beyond one 2-line `#define` on the dev branch.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** CMake (primary) and Bazel. CMakeLists.txt fetches Highway via FetchContent pinned at commit `2a16a50ff61071bb25ddef0ce35d92b0e2b9c579` (Highway 1.1.0 circa Oct 2025). No `cmake.sh` riscv64 preset, no riscv64 CMakePreset, no toolchain file for riscv64. CMakePresets.json provides only `make` (Unix Makefiles) and `windows` (VS2022/ClangCL) presets.

**Compiler requirements.**
- C++17 is required (`set(CMAKE_CXX_STANDARD 17)` in CMakeLists.txt).
- cmake.sh references clang-14/clang++-14 as the team's development baseline.
- For riscv64 RVV: Clang 13 first supported RVV intrinsics; Clang 19+ treats RVV 1.0 as finalized and removes the need for `-menable-experimental-extensions`. Highway CI uses Clang 22 for riscv64. GCC 14+ is required for full RVV 1.0 intrinsics; Highway CI uses GCC 16 for riscv64.
- GCC 15 build failure (issue #778, see Section 11) affects any distro shipping GCC 15 as default.

**Cross-compilation.** No riscv64-specific documentation exists in gemma.cpp. The pattern is inferred from the documented aarch64 command ([issue #21](https://github.com/google/gemma.cpp/issues/21)), where jan-wassenberg confirmed cross-compilation works with `CC=aarch64-linux-gnu-gcc-11 CXX=aarch64-linux-gnu-g++-11 cmake ..`. The riscv64 analog:

```sh
CC=riscv64-linux-gnu-gcc-16 \
CXX=riscv64-linux-gnu-g++-16 \
cmake -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_CROSSCOMPILING=true \
  -DCMAKE_C_COMPILER_TARGET=riscv64-linux-gnu \
  -DCMAKE_CXX_COMPILER_TARGET=riscv64-linux-gnu
cmake --build build -j$(nproc)
```

[NEEDS VERIFICATION - this command is inferred from the aarch64 precedent; no riscv64-specific cmake invocation is documented in the gemma.cpp repository]

Highway (the pinned dependency) handles riscv64 detection: when `CMAKE_SYSTEM_PROCESSOR` is riscv64, Highway's CMake appends `-march=rv64gcv1p0` and (for Clang < 19) `-menable-experimental-extensions`. The `HWY_CMAKE_RVV=ON` flag (default) enables this; set `HWY_CMAKE_RVV=OFF` to suppress the march flag.

**QEMU.** No QEMU support in gemma.cpp CI or documentation. Highway's CI uses QEMU for riscv64 tests (`qemu-riscv64 -cpu max,v=true,vlen=256`) with the full cmake cross-compile invocation documented in [highway's multiarch.yml](https://github.com/google/highway/blob/master/.github/workflows/multiarch.yml). To test gemma.cpp under QEMU, the Highway CI cmake flags can be adapted with the gemma.cpp source root, adding `-DSPM_ENABLE_SHARED=OFF -DSPM_ABSL_PROVIDER=module` for the sentencepiece dependency.

**Known build failures.**

1. GCC 15 build fails (issue #778): sentencepiece headers are missing `<cstdint>`; cmake version check also fails. Fix is in Google's internal sentencepiece repo but not yet pushed to the public fork used by gemma.cpp as of this report. Affects Arch Linux RISC-V and any distro shipping GCC 15.
2. On-device compilation OOM (issue #688): building Highway test files on a resource-constrained board causes the compiler to be killed by the OS. Cross-compilation is the supported path; no riscv64 guidance exists but the maintainer confirmed cross-compilation as the intended workflow.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps.**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Inference (CPU) | Yes | Yes | Yes (via Highway RVV; no CI coverage) |
| BF16 native dot product | Yes (HWY_NATIVE_DOT_BF16=1) | Yes (HWY_NATIVE_DOT_BF16=1) | No (HWY_NATIVE_DOT_BF16=0; FMA emulation) |
| API server (HTTPS/TLS) | Yes | Yes | Yes (with OpenSSL caveats; see Section 9) |
| GPU offload | Via external (not gemma.cpp scope) | Via external | N/A |
| Prebuilt binary | No (source-only) | No (source-only) | No (source-only) |
| GEMMA_DISABLED_TARGETS set | Yes | Yes | dev branch only; absent on main |

**Performance gaps.**

The absence of `HWY_NATIVE_DOT_BF16` on riscv64 means the BF16 matmul hot path uses `ElementwiseMulAccEmuBF` (FMA emulation using `hn::WidenMulPairwiseAdd`-equivalent operations) rather than the native pairwise widening multiply-accumulate path used on x86 and ARM. The quantitative throughput penalty versus arm64 is not available: no gemma.cpp riscv64 benchmark data (tokens/second) was found in any repository, issue tracker, or public web source. Data not available: end-to-end inference throughput on any RISC-V hardware.

Additionally, Highway issue [#3281](https://github.com/google/highway/issues/3281) documents that `ReorderWidenMulAccumulate` on RVV is 10-30% slower than `WidenMulAccumulate` on Banana Pi BPI-F3 (SpacemiT K1, RVV 1.0) due to unnecessary `vsetvli`/`vslideup`/`vslidedown` instructions. A fix PR is being drafted (as of 2026-08-20). Since gemma.cpp's riscv64 path does NOT call `ReorderWidenMulAccumulate` (guarded by `HWY_NATIVE_DOT_BF16=0`), this specific issue does not directly penalize the current hot path. However, if `HWY_NATIVE_DOT_BF16` were to become 1 for RVV in a future Highway release, this performance bug would become directly relevant.

**Security hardening gaps.**

OpenSSL (used by the API server for HTTPS transport) has three open riscv64 crypto-correctness issues (see Section 9 and Section 11). For gemma.cpp deployments serving the REST API over HTTPS on riscv64 hardware without Zkn extensions, AES uses T-table lookups that are not constant-time (highway #20980).

**Floating-point semantics.** RISC-V "F" and "D" extensions guarantee hardware FMA. Highway issue [#2542](https://github.com/google/highway/issues/2542) notes that Highway's SCALAR/EMU128 fallback paths do not exploit `__builtin_fma` on RISC-V. Since `compression/types.h` (dev branch) disables SCALAR on riscv64, this missed optimization is avoided - but only on the dev branch. On main, SCALAR is not excluded and this missed FMA optimization applies.

---

## 7. CI/CD Infrastructure

**gemma.cpp CI (`.github/workflows/build.yml`).**

The file was read directly. It contains zero occurrences of "riscv", "riscv64", "RISCV", "RVV", "qemu", or "cross". The runner matrix is exclusively `ubuntu-latest` (x86), `macos-latest` (Apple Silicon/x86), and `windows-latest` (x86). A Bazel job also runs on `ubuntu-latest` only. No other workflow files (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`) exist in the repository.

**RISE CI runners.** RISE provides riscv64 native runners for some projects (e.g., OpenSSL's os-zoo.yml uses a `linux-riscv64` RISE runner). gemma.cpp has no CI configuration that could use these runners.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI job exists | Yes | Yes (macOS) | No |
| QEMU cross-compile CI | No | No | No |
| RISE native runner | N/A | N/A | No |
| Build is release-blocking | Yes | Yes | No |
| Test suite runs in CI | Yes | Yes (macOS) | No |

---

## 8. Distribution and Release Status

**GitHub Releases.** Five releases exist: v0.1.0 (2024-02-22) through v0.1.4 (2025-03-25). All releases have `assets: []` - zero binary artifacts attached to any release. Releases are source-code-only auto-generated zip/tar.gz archives. Confirmed by live GitHub API.

**PyPI.** The package `gemma-cpp` returns HTTP 404 on PyPI. No package exists. Not applicable.

**Debian.** The source package `gemma-cpp` returns HTTP 404 on the Debian tracker. Not packaged.

**Ubuntu.** Not packaged in Ubuntu Noble. Search returned zero results.

**Arch Linux RISC-V.** Not in the Arch Linux RISC-V port ([archriscv.felixc.at](https://archriscv.felixc.at)). Search returned zero results.

**RISE wheel builder.** [RISE's GitLab wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) does not list gemma.cpp. RISE's LLM inference work targets llama.cpp ([riseproject-dev/llama.cpp](https://github.com/riseproject-dev/llama.cpp)), not gemma.cpp.

**What a user must do to get a working riscv64 binary.** Build entirely from source. The recommended path is cross-compilation from an x86 host using `riscv64-linux-gnu-gcc-16` or `clang-22`. On-device compilation is possible but will OOM on boards with under 8 GB RAM during Highway test compilation.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------------|------|--------------|-------------|----------------|-------|
| [Highway](https://github.com/google/highway) (`2a16a50`, Oct 2025) | All SIMD acceleration (matmul, softmax, SFP compression, NUQ, dot products) | PASS (Highway CI: GCC 16 + Clang 22, `multiarch.yml`) | PASS (QEMU vlen=256, Highway CI) | v1.4.0 shipped with RVV runtime dispatch | Open: #2854 (mold linker), #3305 (RVV correctness), #3281 (RVV perf) |
| [sentencepiece](https://github.com/google/sentencepiece) (`53de765`) | Tokenizer (BPE/Unigram for all Gemma variants) | PASS (`cross_build.yml` includes riscv64 after GCC-14 bump) | PASS (QEMU in `cross_build.yml`) | No riscv64 PyPI wheel (issue #1250 open); C++ static lib builds fine | Open #1250: no PyPI wheel. Open #1303: intermittent abort in free-threaded Python 3.14 riscv64. Neither blocks C++ embedding in gemma.cpp. |
| [nlohmann/json](https://github.com/nlohmann/json) (`9cca280`) | JSON parsing (model configs, benchmark results) | Implicitly portable (header-only, no arch code) | Not tested explicitly | Not applicable (header-only) | No known riscv64 issues |
| [OpenSSL](https://openssl.org) (system `find_package`) | HTTPS transport for `gemma_api_server`; optional | PASS (`os-zoo.yml` includes `linux-riscv64` runner; `cross-compiles.yml` includes riscv64) | PASS on RISE native runner | riscv64 in OS Zoo CI | Open #20980 (non-constant-time AES without Zkn), #25334 (AES accel requires both `_zknd` and `_zkne`), #30330 (correctness bug in Zkne key setup), #30880 (test_lhash intermittently fails on riscv64) |
| [cpp-httplib](https://github.com/yhirose/cpp-httplib) (`v0.18.1`) | HTTP/1.1 server for REST API and SSE streaming; header-only | Implicitly portable (header-only) | Not tested explicitly | Not applicable (header-only) | Old Debian FTBFS #1266 closed/fixed 2022. No open riscv64 issues. |
| [google/benchmark](https://github.com/google/benchmark) (`v1.8.2`) | Microbenchmark harness (dev/test only) | Not tested explicitly | Not tested explicitly | Not applicable (dev only) | No known riscv64 issues. Pure C++, no SIMD. |

**Highway deep-dive (critical dependency).**

Highway is the only dependency that determines whether gemma.cpp can execute with vector acceleration on riscv64. The pinned commit `2a16a50` (Highway 1.1.0 circa Oct 2025) includes `rvv-inl.h` (282,706 bytes). Highway's `multiarch.yml` CI runs dedicated riscv64 jobs with both GCC 16 and Clang 22 under QEMU (vlen=256). Highway's most recent CI run (2026-08-21) shows both riscv64 jobs in a passing state.

The open issue [highway#3305](https://github.com/google/highway/issues/3305) reports a correctness bug in `RearrangeToOddPlusEven` in `rvv-inl.h`: the output depends on tail state of a prior register rather than solely on declared inputs, producing incorrect results when a `ReorderWidenMulAccumulate` result is stored to memory and reloaded. Because gemma.cpp's hot matmul path guards `ReorderWidenMulAccumulate` with `HWY_DASSERT(HWY_NATIVE_DOT_BF16)` and `HWY_NATIVE_DOT_BF16 = 0` for RVV, gemma.cpp does not currently exercise this code path on riscv64. If a future Highway version sets `HWY_NATIVE_DOT_BF16 = 1` for RVV, this correctness bug becomes directly relevant.

The open issue [highway#3281](https://github.com/google/highway/issues/3281) documents a 10-30% throughput regression in `ReorderWidenMulAccumulate` on riscv64 RVV versus the generic `WidenMulAccumulate`. The fix PR is being drafted. For the same reason as above, gemma.cpp does not currently trigger this path.

The open issue [highway#2854](https://github.com/google/highway/issues/2854) documents build failures when using the mold linker on riscv64. Workaround: use `ld` instead of `mold`. This affects any project that depends on Highway on riscv64.

Ecosystem scope reports for Highway, sentencepiece, OpenSSL, and google/benchmark are available in this repository at `project-reports/highway.md`, `project-reports/sentencepiece.md`, `project-reports/openssl.md`, and `project-reports/benchmark.md`.

---

## 11. Known Bugs and Active Issues

| ID | Project | Title | Status | Severity | Notes |
|----|---------|-------|--------|----------|-------|
| [#3305](https://github.com/google/highway/issues/3305) | highway | RVV: Bug: RearrangeToOddPlusEven - UB, incorrect results on store/reload | Open | **High (correctness)** | Does not affect current gemma.cpp riscv64 path (gated by HWY_NATIVE_DOT_BF16=0); becomes critical if HWY_NATIVE_DOT_BF16 is enabled for RVV |
| [#3281](https://github.com/google/highway/issues/3281) | highway | RVV: ReorderWidenMulAccumulate 10-30% slower than generic WidenMulAccumulate on BPI-F3 | Open | High (performance) | Fix PR being drafted (2026-08-20); does not affect current gemma.cpp riscv64 hot path; will matter if HWY_NATIVE_DOT_BF16 is enabled |
| [#2854](https://github.com/google/highway/issues/2854) | highway | Problems with mold-linker on riscv64 | Open | Medium (build) | Affects any project depending on Highway with mold; workaround is to use ld |
| [#2542](https://github.com/google/highway/issues/2542) | highway | FMA optimizations not implemented in SCALAR/EMU128 on RISC-V | Open | Low (performance) | Missed optimization; avoided on dev branch where SCALAR is excluded on riscv64; relevant on main |
| [#778](https://github.com/google/gemma.cpp/issues/778) | gemma.cpp | Build fails on GCC 15: sentencepiece missing `<cstdint>` | Open | High (build) | Blocks builds on Arch Linux RISC-V and any distro shipping GCC 15; fix exists internally at Google but not yet public |
| [#688](https://github.com/google/gemma.cpp/issues/688) | gemma.cpp | OOM during on-device compilation of Highway tests | Open | Medium (usability) | Affects RISC-V boards with under 8 GB RAM; cross-compilation is the workaround |
| [#885](https://github.com/google/gemma.cpp/issues/885) | gemma.cpp | LLM output regression from #857 building with Emscripten (WASM/SCALAR) | Open | High (correctness) | WASM uses identical `HWY_SCALAR` exclusion pattern now applied to riscv64; analogous correctness issues on riscv64 are plausible [NEEDS VERIFICATION] |
| [#958](https://github.com/google/gemma.cpp/issues/958) | gemma.cpp | Crash/abort in matmul when partition size exceeds kMaxNC | Open | High (correctness) | Not riscv64-specific; affects all platforms |
| [#20980](https://github.com/openssl/openssl/issues/20980) | openssl | AES without Zkn extensions uses T-table (not constant-time) | Open | **High (security)** | Affects gemma.cpp API server HTTPS on riscv64 hardware without Zkn; not a build blocker |
| [#25334](https://github.com/openssl/openssl/issues/25334) | openssl | Both `_zknd` and `_zkne` must be present to accelerate AES | Open | Medium (correctness) | Logic issue in Zkn dispatch |
| [#30330](https://github.com/openssl/openssl/issues/30330) | openssl | `rv64i_zkne_set_encrypt_key` null-key check is backwards | Open | High (correctness) | Correctness bug in Zkne key setup path |
| [#30880](https://github.com/openssl/openssl/issues/30880) | openssl | `test_lhash` intermittently fails on riscv64 CI | Open | Low (flaky test) | Non-deterministic; may be latent race exposed by weak memory ordering |
| [#1250](https://github.com/google/sentencepiece/issues/1250) | sentencepiece | No riscv64 PyPI wheel | Open | Low (C++ embedding unaffected) | Does not affect gemma.cpp which embeds sentencepiece statically |

---

## 12. Objections and Upstream Blockers

**Stated objections.** Jan Wassenberg (principal maintainer) stated in [issue #875](https://github.com/google/gemma.cpp/issues/875) (2026-03-26): "So far we don't have any plans for highly constrained environments." This is not a rejection of RISC-V specifically but signals the core team is not prioritizing non-server hardware.

**Technical blockers.**

1. GCC 15 build failure (issue #778): sentencepiece `<cstdint>` issue blocks builds on bleeding-edge distros (Arch Linux RISC-V). Fix is in Google's internal tree; needs a public sync.
2. `main` branch frozen at 2025-10-23: the only riscv64-specific change (PR #922) is on `dev` only. Any user building from `main` gets the gap-state where `GEMMA_DISABLED_TARGETS` is undefined on riscv64.
3. No riscv64 CI: correctness and performance regressions on riscv64 will be invisible to the project's CI until a CI job is added.
4. Highway issue #3305 (RVV correctness bug): currently bypassed by `HWY_NATIVE_DOT_BF16=0`, but a future Highway upgrade that enables BF16 native dot on RVV would introduce a correctness regression.

**Organizational blockers.** gemma.cpp's governance is entirely Google-internal. RISE has no engagement with this project; RISE's LLM inference investment is focused on llama.cpp. There is no RISE AI/ML WG tracking issue for gemma.cpp. No external organization has taken ownership of a riscv64 port.

**Acceptance probability.** Contributions that follow the existing pattern (disabling SCALAR on riscv64, mirroring the WASM treatment) have already been accepted (PR #922). The project is unlikely to accept work that significantly expands scope or maintenance burden. A CI job addition (cross-compile only, QEMU-based) would have a high probability of acceptance given precedent from Highway's own CI. Hand-tuned RVV kernels would be accepted if they follow the Highway portable-SIMD style. Probability of acceptance for a well-scoped CI + correctness PR: high.

---

## 13. Investment Analysis

RISE has no existing investment in gemma.cpp. The riseproject-dev organization has no gemma.cpp repository, no wheel builder entry, and no AI/ML WG tracking issue for this project. All work below is net-new.

### 13.1 Functional Enablement

1. Merge dev to main: The riscv64 `GEMMA_DISABLED_TARGETS` fix from PR #922 is on `dev` but not `main`. A PR merging this to `main` (or the next release cut) removes the gap-state where SCALAR is not excluded on riscv64. This is trivially small work but requires a release cut from the Google-internal tree.

2. GCC 15 sentencepiece `<cstdint>` fix: The fix exists in Google's internal sentencepiece fork. The work is to file a PR against the public sentencepiece repo used by gemma.cpp's CMakeLists.txt and get it accepted. Scope: 0.5 person-weeks for the PR and follow-up.

3. Highway #3305 fix: The `RearrangeToOddPlusEven` correctness bug is in Highway's RVV backend. This does not affect gemma.cpp's current hot path but is a latent risk. Contributing the fix to Highway is relevant work independent of gemma.cpp. Estimated scope in Highway: 1-2 person-weeks.

### 13.2 Performance Optimization

1. Highway #3281 fix: The `ReorderWidenMulAccumulate` performance regression (10-30% throughput loss on RVV) is being addressed by a community contributor (nils-david-s, 2026-08-20). Monitor the PR. If it stalls, completing and upstreaming the fix to Highway requires approximately 2-3 person-weeks including validation on multiple RVV implementations.

2. BF16 native dot product on RVV: `HWY_NATIVE_DOT_BF16 = 0` for RVV means gemma.cpp uses the FMA emulation path. Enabling hardware BF16 dot product on RVV (Zvfbfwma extension, available on SpacemiT K1 and upcoming RVV-1.0 silicon) would unlock the faster `ElementwiseMulAccNativeBF` path. This requires a Highway change first, then testing in gemma.cpp. Estimated scope: 3-5 person-weeks in Highway, 1 week in gemma.cpp.

3. End-to-end performance baseline: Zero public gemma.cpp riscv64 benchmark data exists. Establishing a baseline (tokens/second for Gemma-2B and Gemma-7B on available RISC-V hardware such as BPI-F3 or VisionFive 2) requires hardware access plus test time. Estimated scope: 1-2 person-weeks.

### 13.3 CI/CD Infrastructure

1. Add a riscv64 cross-compile CI job to `.github/workflows/build.yml`: Mirror Highway's multiarch.yml pattern using GCC 16 or Clang 22 + QEMU (vlen=256). This catches regressions before they reach hardware. Estimated scope: 1 person-week (drafting the job, handling FetchContent cross-compile quirks for sentencepiece, getting it accepted upstream).

2. Hardware-in-the-loop CI using RISE runners: If RISE native riscv64 runners are available (OpenSSL uses them via os-zoo.yml), adding a native hardware test job catches OOM and performance regressions that QEMU masks. Estimated scope: 1-2 person-weeks including infra setup.

### 13.4 Ecosystem Enablement

No gemma.cpp Python package exists (not on PyPI). The project is a C++ library and CLI tool. No package ecosystem work is required. Highway's RVV wheel-builder work is tracked separately under the Highway report. sentencepiece riscv64 PyPI wheel (issue #1250) does not affect gemma.cpp's C++ embedding path.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Backport PR #922 riscv64 `GEMMA_DISABLED_TARGETS` to main / next release | 0.5 | gemma.cpp maintainer (Google) | Critical |
| Functional | Fix sentencepiece `<cstdint>` GCC 15 issue (issue #778) upstream | 0.5 | sentencepiece contributor | High |
| Functional | Fix Highway #3305 RVV RearrangeToOddPlusEven correctness bug | 1-2 | Highway contributor | High |
| CI/CD | Add riscv64 cross-compile + QEMU CI job to build.yml | 1 | RISE or contributor | High |
| Performance | Complete and upstream Highway #3281 ReorderWidenMulAccumulate fix (if stalled) | 2-3 | Highway contributor (nils-david-s in progress) | Medium |
| CI/CD | Add RISE native riscv64 hardware CI job | 1-2 | RISE infra | Medium |
| Performance | Establish gemma.cpp riscv64 inference benchmark baseline (tokens/sec) | 1-2 | RISE AI/ML WG or contributor | Medium |
| Performance | Enable HWY_NATIVE_DOT_BF16 for Zvfbfwma on RVV in Highway + validate in gemma.cpp | 4-6 | Highway + gemma.cpp contributor | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/gemma.cpp repository](https://github.com/google/gemma.cpp)
- [google/gemma.cpp releases (v0.1.0-v0.1.4)](https://github.com/google/gemma.cpp/releases)
- [google/gemma.cpp .github/workflows/build.yml](https://github.com/google/gemma.cpp/blob/main/.github/workflows/build.yml)
- [google/gemma.cpp compression/types.h (dev branch)](https://github.com/google/gemma.cpp/blob/dev/compression/types.h)
- [google/gemma.cpp PR #922 "Miscellaneous cleanup"](https://github.com/google/gemma.cpp/pull/922)
- [google/gemma.cpp issue #778 "Build fails on Linux (GCC 15)"](https://github.com/google/gemma.cpp/issues/778)
- [google/gemma.cpp issue #688 "Impossible to Build and Run on a Resource-Constrained Google Edge Device"](https://github.com/google/gemma.cpp/issues/688)
- [google/gemma.cpp issue #885 "LLM output regression from #857 building with Emscripten"](https://github.com/google/gemma.cpp/issues/885)
- [google/gemma.cpp issue #958 "Fix crash/abort in matmul when partition size exceeds kMaxNC"](https://github.com/google/gemma.cpp/issues/958)
- [google/gemma.cpp issue #875 (maintainer statement on constrained environments)](https://github.com/google/gemma.cpp/issues/875)
- [google/gemma.cpp issue #21 "Android aarch64 support"](https://github.com/google/gemma.cpp/issues/21)
- [google/highway repository](https://github.com/google/highway)
- [google/highway .github/workflows/multiarch.yml](https://github.com/google/highway/blob/master/.github/workflows/multiarch.yml)
- [google/highway issue #3305 "RVV: Bug: RearrangeToOddPlusEven"](https://github.com/google/highway/issues/3305)
- [google/highway issue #3281 "RVV: ReorderWidenMulAccumulate slower than generic WidenMulAccumulate"](https://github.com/google/highway/issues/3281)
- [google/highway issue #2854 "Problems with mold-linker on riscv64"](https://github.com/google/highway/issues/2854)
- [google/highway issue #2542 "Should FMA optimizations be implemented for SCALAR/EMU128 on RISC-V?"](https://github.com/google/highway/issues/2542)
- [google/sentencepiece issue #1250 "No riscv64 PyPI wheel"](https://github.com/google/sentencepiece/issues/1250)
- [google/sentencepiece issue #1303 "intermittent abort in free-threaded Python 3.14 riscv64"](https://github.com/google/sentencepiece/issues/1303)
- [openssl issue #20980 "AES without Zkn uses T-table (not constant-time)"](https://github.com/openssl/openssl/issues/20980)
- [openssl issue #25334 "Both `_zknd` and `_zkne` must be present to accelerate AES"](https://github.com/openssl/openssl/issues/25334)
- [openssl issue #30330 "rv64i_zkne_set_encrypt_key null-key check is backwards"](https://github.com/openssl/openssl/issues/30330)
- [openssl issue #30880 "test_lhash intermittently fails on riscv64 CI"](https://github.com/openssl/openssl/issues/30880)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE AI/ML Working Group GitHub](https://github.com/riseproject-dev/ai-ml-wg)
- [RISE wheel builder project list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE blog post: IREE for RISC-V (mentions Gemma4 as future direction)](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)