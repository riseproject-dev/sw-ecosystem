---
title: whisper.cpp
parent: Project Reports
color: yellow
dependencies:
  - name: ggml
    relation: build-dependency
    criticality: critical
  - name: llama.cpp
    relation: build-dependency
    criticality: optional
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: FFmpeg
    relation: runtime-dependency
    criticality: optional
  - name: SDL2
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="whisper-cpp" %}

# whisper.cpp

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for whisper.cpp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

whisper.cpp is a C/C++ port of OpenAI's Whisper automatic speech recognition (ASR) model, created and led by Georgi Gerganov, hosted under the `ggml-org` GitHub organization (his own venture, ggml.ai; the repository was renamed/transferred from `ggerganov/whisper.cpp` during the research period). It is MIT-licensed ("Copyright 2023-2026, The ggml authors").

**Governance.** No formal foundation exists: no MAINTAINERS/OWNERS/CODEOWNERS file, no GOVERNANCE.md or FOUNDATION.md, and no affiliation with the Linux Foundation, NumFOCUS, or any other foundation. This is a BDFL-style project: Gerganov holds roughly 1,400 of the top commits, far ahead of any other contributor. `CONTRIBUTING.md` defines a three-tier policy: Contributors (no special privileges), Collaborators/Triage (own specific code areas), and Maintainers (merge PRs after code-owner approval, and "reserve the right to decline review or close pull requests for any reason, without any questions"). A separate AI-generated-PR policy (`CONTRIBUTING.md` + `AGENTS.md`) bars fully/predominantly AI-generated PRs.

**Corporate sponsors.** No corporate entity formally sponsors whisper.cpp. Because most of its compute core (`ggml`) is shared with and synced from `ggml-org/llama.cpp`, top-committer corporate affiliations reflect that shared codebase: Jeff Bolz (NVIDIA, Vulkan backend), Neo Zhang Jianyu (Intel, SYCL backend), Max Krasnyansky (Qualcomm, CPU backend), plus a broader AUTHORS-file domain scan showing Intel (9), Codeplay/Intel subsidiary (6), Red Hat (4), Qualcomm (3), Arm (3), AMD (2), and single contributors from Samsung, Google, NVIDIA, and Hugging Face. No RISC-V vendor employees appear among top overall committers, though SpacemiT-authored commits exist specifically in the RISC-V code path (see Section 2).

**Community culture on new ports.** whisper.cpp's own README "Supported platforms" list (Mac OS, iOS, Android, Java, Linux/FreeBSD, WebAssembly, Windows, Raspberry Pi, Docker) and its feature-bullet list (Apple Silicon/NEON, AVX/x86, POWER/VSX, Vulkan, NVIDIA, AMD ROCm, OpenVINO, Ascend, Moore Threads) **do not mention RISC-V at all**, despite substantial RVV/SpacemiT kernel code existing in the tree. New architecture support generally arrives as sync commits from `ggml`/`llama.cpp` rather than as whisper.cpp-native PRs, consistent with the maintainers' stated preference for long-term-committed contributors who "own" the code they add.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-07-16 | PR [#1101](https://github.com/ggml-org/whisper.cpp/pull/1101) merged: adds `linux/riscv64` to a QEMU/docker-buildx multi-arch CI matrix (not prioritized; the matrix has since been superseded, current `docker.yml` no longer lists riscv64). Also fixes an `#if !defined(__riscv)` header-inclusion guard in `ggml.c`, the earliest RISC-V-adjacent portability fix in the repo. | [PR #1101](https://github.com/ggml-org/whisper.cpp/pull/1101) |
| 2023-09-05 | Commit `c3f319d7`, "ggml: sync latest llama.cpp", by Georgi Gerganov - earliest RISC-V-related commit (an upstream sync bringing in early RVV intrinsics, not native work). | Repository history |
| 2024-07-22 | Commit `0bc8bffe`, "ggml: fix compile error for RISC-V (llama/8623)", by Mark Zhuang - implies RISC-V support already existed upstream by this point. | Repository history |
| 2024-09-12 | Commit `3f8f8a78`, "riscv: modify Makefile and add a RISCV_VECT to print log info (llama/9442)", by Ahmad Tameem - first feature-level RISC-V commit; adds `ggml_cpu_has_riscv_v()`. | Repository history |
| 2025-03-27 | Commit `8ca67df2`, "ggml: sync/merge cmake,riscv,powerpc, add common.cmake (ggml/0)", by Georgi Gerganov - the sync that introduced the intrinsic later reported broken in issue #2989. | Repository history |
| 2025-04-02 | Issue [#2989](https://github.com/ggml-org/whisper.cpp/issues/2989) opened: `__riscv_vcreate_v_i8m1_i8m2` intrinsic fails on GCC 13.2. | [Issue #2989](https://github.com/ggml-org/whisper.cpp/issues/2989) |
| 2025-05-27 | Commit `15ae9dc2`, "ggml: riscv: add xtheadvector support (llama/13720)", by xctan - adds T-Head's older RVV v0.7.1 vector ISA support. | [llama.cpp PR #13720](https://github.com/ggml-org/llama.cpp/pull/13720) |
| 2025-09-03 | Commit `75f739c7`, "ggml-cpu: optimize RVV kernels (llama/15720)", by xctan - fixes pipeline stalls in q4_K/q6_K/f32 dot products; +183%/+177% throughput on Qwen3-4B pp512/tg128. | [llama.cpp PR #15720](https://github.com/ggml-org/llama.cpp/pull/15720) |
| 2025-09-29/30 | Commit `35ebdf73`, "ggml: riscv: add riscv spacemit backend (llama/15288)", by alex-spacemit - adds SpacemiT X60 IME matrix-extension backend, the largest RISC-V feature landed to date. | [llama.cpp PR #15288](https://github.com/ggml-org/llama.cpp/pull/15288) |
| 2025-11-29 / 2025-12-12 | Commit `28dff065`, "ggml: replace hwcap with riscv_hwprobe for RVV detection (llama/17567)", by Wang Yang. | Repository history |
| 2026-03-23 | Issue [#3717](https://github.com/ggml-org/whisper.cpp/issues/3717) opened: malformed CMake-generated `-march=` string rejected by GCC 13.3. | [Issue #3717](https://github.com/ggml-org/whisper.cpp/issues/3717) |
| 2026-04-16 / 2026-04-30 | Commit `07c181b5`, "ggml: implemented simd_gemm kernel for riscv vector extension (llama/20627)", by rehan-10xengineers. | Repository history |
| 2026-09-06 / 2026-09-07 | Issues #2989 and #3717 both auto-closed by the stale bot as `not_planned`, with no fix merged in either case. | [Issue #2989](https://github.com/ggml-org/whisper.cpp/issues/2989), [Issue #3717](https://github.com/ggml-org/whisper.cpp/issues/3717) |

**Key contributors and orgs:** xctan (RVV kernel optimization, xtheadvector support - org not identified in AUTHORS), alex-spacemit (SpacemiT IME backend - SpacemiT), Ahmad Tameem / rehan-10xengineers (10xEngineers-pattern usernames, org affiliation [NEEDS VERIFICATION]), Wang Yang, Mark Zhuang.

**Is it fully upstream?** All RISC-V code lives in `ggml/src/ggml-cpu/arch/riscv/` and `ggml/src/ggml-cpu/spacemit/`, both vendored into whisper.cpp via periodic sync commits from `ggml-org/llama.cpp` (visible from the `(llama/NNNNN)` PR references above). Direct lexical searches for `rvv`, `rv64`, `xtheadvector`, `spacemit`, `riscv_hwprobe` in whisper.cpp's own pull requests returned zero results. whisper.cpp itself has produced no native RISC-V feature PRs - only two CI/build-adjacent PRs touch riscv64 at all (#1101, generic CI matrix work; #2914, Vulkan cross-compile work unrelated to RISC-V, closed without merging).

## 3. Upstream Support Tier

whisper.cpp's tier policy (`CONTRIBUTING.md`) is generic to all contributions, not RISC-V-specific: Contributors -> Collaborators (Triage) -> Maintainers, with maintainers holding final, unqualified discretion to decline or close PRs.

Evidence for riscv64 specifically: no riscv64 CI job exists anywhere in the repository (Section 7), and no riscv64 release-blocking gate exists because no riscv64 CI job exists at all to gate on.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes (`ubuntu-22.04` runner, `build-cpu.yml`) | yes (`ubuntu-22.04-arm` runner) | no |
| CI tests run | yes | yes | no |
| Release-blocking | yes | yes | N/A (no CI to gate) |
| Official binary published | yes (`whisper-bin-x64.tar.gz`, `whisper-cublas-*`) | yes (`whisper-bin-ubuntu-arm64.tar.gz`) | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

RISC-V support is implemented entirely within the vendored `ggml` tensor library, in two layers.

**Portable RVV baseline** (`ggml/src/ggml-cpu/arch/riscv/`):
- `quants.c` (6,596 lines): quantize/dequantize + `ggml_vec_dot_*` SIMD kernels for nearly every ggml quant format (Q4_0/1, Q5_0/1, Q8_0/1, Q2-Q6_K, IQ1_S/M, IQ2_XXS/XS/S, IQ3_XXS/S, IQ4_NL/XS, MXFP4, TQ1/TQ2_0), with `_generic`/`_vl128`/`_vl256`/`_vl512`/`_xtheadvector` vector-length-specialized variants for several quant dot products (e.g. `ggml_vec_dot_q3_K_q8_K_vl512`), containing 1,744 `__riscv_v_*` intrinsic calls.
- `repack.cpp` (1,703 lines): weight/activation repacking for blocked GEMV/GEMM kernels, 726 more RVV intrinsic calls.
- `cpu-feats.cpp` (38 lines): runtime feature detection via the modern `riscv_hwprobe` syscall (`RISCV_HWPROBE_KEY_IMA_EXT_0`), feeding the `GGML_BACKEND_DL_SCORE_IMPL` dynamic-dispatch scorer - functionally on par with x86's CPUID-based detection.

**Vendor-optimized layer** (`ggml/src/ggml-cpu/spacemit/`, ~15,900 lines): a full backend for SpacemiT K1/X60-class SoCs using SpacemiT's proprietary IME (Integer Matrix Extension) instructions (`vmadot`, `vfwmadot`, `vpack`, `vnspack`). Files: `ime2_kernels.cpp` (5,768 lines, IME2 matmul kernels), `repack.cpp` (1,795 lines), `ime.cpp` (1,742 lines, dispatch/orchestration), `rvv_kernels.cpp` (3,178 lines, pure-RVV fallback), `ime1_kernels.cpp` (1,027 lines), plus memory-pool, topology-detection, and header support files. Gated behind `GGML_CPU_RISCV64_SPACEMIT`, probed via `FindSMTIME.cmake`.

**ISA extensions used:** V (RVV 1.0), Zfh/Zfhmin (scalar half-float), Zvfh/Zvfhmin (vector half-float), Zvfbfwma/Zvfbfmin (vector bf16), Zba, Zicbop, Zihintpause, optional XTheadVector (T-Head vendor ISA), and SpacemiT's proprietary IME1/IME2 (`xsmtvdotii`, GCC>=15 only).

**Quality:** Hand-tuned, not a stub. Only one throwaway code comment (`// fixme: use v0p7 mask layout directly`) exists anywhere in the RISC-V files; no `TODO`/`stub`/`unimplemented`/`placeholder` markers were found. Two minor incomplete spots exist in shared (non-riscv-exclusive) files: a `// todo: RVV implementation` fallback in `vec.cpp` (~line 9878) and a `//TODO: Write SVE code and RVV code` scalar-route comment in `ggml-cpu.c` (~line 11427) - both are single unimplemented sub-cases inside otherwise-complete files, the same partial-coverage pattern every architecture in this codebase has.

**Architecture-specific SIMD code, line-count comparison** (`ggml/src/ggml-cpu/arch/`):

| Arch | quants.c | repack.cpp | cpu-feats.cpp | Total |
|---|---|---|---|---|
| x86 | 4,108 | 6,407 | 327 | 10,842 |
| arm | 4,319 | 5,156 | 41 | 9,516 |
| **riscv** | **6,596** | **1,703** | **38** | **8,337** |
| powerpc | 2,304 | - | 82 | 2,386 |
| loongarch | 2,309 | - | - | 2,309 |
| s390 | 1,465 | - | 50 | 1,515 |
| wasm | 1,292 | - | - | 1,292 |

RISC-V is the third-largest architecture-specific implementation (ahead of powerpc/loongarch/s390/wasm by 3-5x) and has the largest `quants.c` of any architecture, including x86 and arm. Combined with the 15,900-line SpacemiT extra backend, total RISC-V-related code is approximately 23,800 lines - a scope of dedicated vendor-extension support that no other non-x86/arm architecture in this codebase receives. No JIT backend exists for any architecture in ggml; all dispatch is compile-time `-march` flags plus an optional runtime multi-versioning selector (`cpu-feats.cpp`).

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists in the repository, and the README has zero RISC-V content. Everything below was recovered directly from CMake source and code comments.

**Cross-compile toolchain file:** `cmake/riscv64-spacemit-linux-gnu-gcc.cmake` requires a `RISCV_ROOT_PATH` environment variable pointing at a `riscv64-unknown-linux-gnu-*` toolchain install (unless the build host is itself riscv64). Bakes in `-march=rv64gcv_zfh_zba_zicbop -mabi=lp64d` and links `-latomic`.

Exact cross-compile command:
```
export RISCV_ROOT_PATH=/path/to/riscv64-unknown-linux-gnu-toolchain
cmake -B build -DCMAKE_TOOLCHAIN_FILE=cmake/riscv64-spacemit-linux-gnu-gcc.cmake \
  -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=OFF -DWHISPER_SDL2=OFF
cmake --build build -j
```

Native (on-device) build:
```
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
```
`ggml_get_system_arch()` auto-detects `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv64"` and sets `GGML_SYSTEM_ARCH=riscv64` with no extra flags required.

**Relevant build flags** (`ggml/CMakeLists.txt`): `GGML_RVV` (ON), `GGML_RV_ZFH` (ON), `GGML_RV_ZVFH` (ON), `GGML_RV_ZICBOP` (ON), `GGML_RV_ZIHINTPAUSE` (ON), `GGML_RV_ZVFBFWMA` (OFF), `GGML_XTHEADVECTOR` (OFF), `GGML_CPU_RISCV64_SPACEMIT` (opt-in, no default), `GGML_CPU_ALL_VARIANTS` (OFF; when combined with `GGML_BACKEND_DL=ON`, builds `riscv64_0`/`riscv64_v` runtime-dispatched variants). Only `Linux` is a supported `CMAKE_SYSTEM_NAME` for riscv64 - any other OS triggers `FATAL_ERROR "Unsupported RISC-V target OS"`.

**Toolchain version requirement:** the only version floor explicitly documented in source is **GCC >= 15**, required for the `xsmtvdotii` march extension used by the SpacemiT IME2 path (code comment, `ggml/src/ggml-cpu/CMakeLists.txt:500`). No other minimum is documented anywhere in the repo. Based on the RVV 1.0 intrinsic names actually used (e.g. `__riscv_vsetvl_e32m8`), a practical floor of GCC>=14 or Clang/LLVM>=17 can be inferred but is not upstream-documented [NEEDS VERIFICATION - inference, not a stated requirement]. This inference is corroborated by two confirmed build failures on GCC 13.x (below).

**QEMU usage:** none for riscv64 anywhere in the repository. `setup-qemu-action` exists only in `build-gcc.yml`/`build-clang.yml`, and only emulates `linux/ppc64le` and `linux/arm/v7`.

**Known build failures:**
- [Issue #3717](https://github.com/ggml-org/whisper.cpp/issues/3717): CMake auto-generates `-march=rv64gc_zfh_v_zvfh_zicbop_zihintpause`, which GCC 13.3 rejects as an "unexpected ISA string at end". Reporter speculated GCC 14 would fix it; unconfirmed by any maintainer, unresolved.
- [Issue #2989](https://github.com/ggml-org/whisper.cpp/issues/2989): `__riscv_vcreate_v_i8m1_i8m2` intrinsic (introduced by commit `8ca67df2`) is not recognized by GCC 13.2 in `ggml_vec_dot_q5_0_q8_0`/`q5_1_q8_1`. A community commenter (not a maintainer) confirmed the same failure in llama.cpp and identified the fix: "GCC 14 and above support the `vcreate` function, but GCC 13 and below do not."

Both issues were auto-closed `not_planned` by the stale bot (2026-09-06 and 2026-09-07 respectively) with no code fix ever merged in whisper.cpp.

**Unrelated riscv64 machinery in the tree:** `ggml/src/ggml-et/et-kernels/` configures a separate bare-metal riscv64 toolchain (`-march=rv64imf`, `-nostdlib`) for Esperanto Technologies' ET-SoC device, requiring an external non-public SDK (`ET_PLATFORM_PATH`). This is unrelated to general Linux riscv64 CPU support and should not be conflated with it.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU inference (generic C fallback) | yes | yes | yes |
| RVV-accelerated quantized dot products | n/a (AVX/AVX2/AVX512) | n/a (NEON) | yes |
| Vendor matrix-extension acceleration | n/a | n/a | yes, SpacemiT IME (opt-in) |
| Official prebuilt binary | yes | yes | no |
| CI test execution | yes | yes | no |

**Functional gaps:** no official upstream riscv64 binary exists at all (source build or a distro package is the only path); a plain `cmake -B build` fails outright on GCC<14 environments per the two confirmed compiler-compatibility issues above.

**Performance gaps:** none identified from missing SIMD coverage - the RVV implementation is described in the underlying research as "not a stub," hand-tuned, and the third-largest architecture-specific backend in the codebase. **Data not available: no quantitative riscv64 whisper.cpp inference throughput or real-time-factor (RTF) benchmark could be located from any accessible source.** DeepComputing's "Whisper on RISC-V" page (qualitative claim that Whisper runs locally on their ESWIN EIC7702-based DC-ROMA AI PC) returned HTTP 202 with an empty body on every fetch attempt (bot-gated); OpenBenchmarking.org's whisper-cpp test page returned HTTP 403; two related YouTube videos exist per search results but are not retrievable via automated tooling.

**Security hardening gaps:** Data not available - no riscv64-specific hardening/sanitizer research was surfaced (whisper.cpp's `build-sanitize.yml` was not confirmed to include riscv64, and by Section 7 no riscv64 CI job of any kind exists).

**NaN / floating-point semantics issues:** none found. A targeted search for RISC-V-specific NaN/floating-point correctness bugs was performed and returned only the two compiler/build-toolchain issues (#3717, #2989) plus one unrelated PPC64 big-endian byte-order issue (#376); no numerical-correctness issue specific to RVV output exists in the tracker.

## 7. CI/CD Infrastructure

**No riscv64 CI exists**, confirmed by directly reading all 22 files in `.github/workflows/` (`bindings-go.yml`, `bindings-ruby.yml`, `build-android.yml`, `build-clang.yml`, `build-coreml.yml`, `build-cpu.yml`, `build-freebsd.yml`, `build-gcc.yml`, `build-macos.yml`, `build-quantize.yml`, `build-sanitize.yml`, `build-self-hosted.yml`, `build-sycl.yml`, `build-vad.yml`, `build-wasm.yml`, `build-windows.yml`, `close-issue.yml`, `deploy-examples-wasm.yml`, `docker.yml`, `examples.yml`, `make-release.yml`, `release.yml`) plus the composite action `ccache-clear`. A case-insensitive grep for `riscv|rvv|rv64|xtheadvector|spacemit` across every workflow, every Dockerfile (`.devops/*.Dockerfile`), and the repository at large returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

Specifics checked directly:
- `docker.yml`: matrix has exactly 7 entries, platforms limited to `linux/amd64` and `linux/arm64`, runners `ubuntu-24.04`/`ubuntu-24.04-arm`, triggered by `workflow_dispatch` and a daily `schedule` cron.
- `build-cpu.yml`: 5 jobs, all on `ubuntu-22.04` or `ubuntu-22.04-arm`, triggered by `workflow_dispatch`, `push` to master, and `pull_request`.
- `build-self-hosted.yml`: runner labels are `[self-hosted, Linux, NVIDIA]`, `[self-hosted, macOS, ARM64]`, `[self-hosted, Windows, X64, stx, rai300-400]`, `[self-hosted, Linux, X64, stx, rai300-400]` - no riscv64 self-hosted runner.

**RISE runners:** not used by whisper.cpp. The sibling project `ggml-org/llama.cpp` (which shares the `ggml` codebase whisper.cpp vendors) has its own RISE self-hosted riscv64 CI runner (`ubuntu-24.04-riscv` label) that is PR-path-triggered on changes inside the riscv arch directory, per [RISE's "RISC-V Runners: six weeks in" post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/), which names llama.cpp as an adopter. This CI does not run for, or cover, whisper.cpp's own repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI: build | yes | yes | no |
| CI: test | yes | yes | no |
| CI: release-gating | yes | yes | N/A |

## 8. Distribution and Release Status

**Official upstream GitHub Releases:** no riscv64 assets. The five most recent releases checked (v1.9.3, b4938, v1.9.2, v1.9.1, v1.9.0) via the raw [GitHub Releases API](https://api.github.com/repos/ggml-org/whisper.cpp/releases) show asset filenames limited to `whisper-bin-ubuntu-{arm64,x64}.tar.gz`, `whisper-bin-Win32.zip`, `whisper-bin-x64.zip`, `whisper-blas-bin-*.zip`, `whisper-cublas-*.zip`, and `whisper-*-xcframework.zip` - no `riscv64` string anywhere.

**PyPI:** no `whisper-cpp` package exists (confirmed 404 at both `pypi.org/pypi/whisper-cpp/json` and `pypi.org/simple/whisper-cpp/`). The separately-named `whispercpp` PyPI project ships only `manylinux2014_x86_64` and `macosx_10_9_x86_64` wheels - no riscv64.

**RISE Python wheel builder:** no entry; the RISE index redirects to upstream PyPI, which lacks the package.

**Debian sid/testing:** riscv64 binaries confirmed live via four independent sources - [buildd.debian.org](https://buildd.debian.org/status/package.php?p=whisper.cpp&suite=sid) (status "Installed", riscv64, version `1.9.3+dfsg-1`, built on buildd `rv-manda-04`), [packages.debian.org/sid/riscv64/libwhisper1](https://packages.debian.org/sid/riscv64/libwhisper1), the raw `ftp.debian.org` pool listing (`libwhisper-dev_1.9.3+dfsg-1_riscv64.deb`, `libwhisper1_1.9.3+dfsg-1_riscv64.deb`, `whisper.cpp-tools_1.9.3+dfsg-1_riscv64.deb`), and the ftp-master madison API, verbatim: `libwhisper1 | 1.9.3+dfsg-1 | testing | amd64, arm64, loong64, ppc64el, riscv64, s390x` (same line for `unstable`). The `whisper.cpp` source package itself is `Architecture: all` (a metapackage); the compiled riscv64 binaries live in `libwhisper1` and `whisper.cpp-tools`. No riscv64-specific patches were identified in the packaging diff - this is a clean build from unpatched upstream source with `GGML_RVV=ON` at its CMake default.

**Ubuntu 26.04 (Resolute):** `whisper.cpp` (version `1.8.3+dfsg-2`, `universe/libs`) listed with riscv64 among supported architectures (amd64, arm64, ppc64el, riscv64, s390x) per an original `packages.ubuntu.com` search; a later re-verification attempt returned HTTP 503 from the site and could not re-confirm this live [NEEDS VERIFICATION - re-check was inconclusive due to site unavailability, not a contradiction].

**Arch Linux:** no official riscv64 package found (`archlinux.org` search returned zero matches; `archriscv.felixc.at/riscv64/extra/` returned 404).

**What a user must do to get a working binary:** either (a) install Debian sid/testing's `libwhisper1` + `whisper.cpp-tools` packages (or Ubuntu 26.04's `whisper.cpp` package, pending re-verification), or (b) build from source with GCC>=14 (GCC 13.x is confirmed to fail per #3717/#2989), using either the default native CMake configuration (RVV enabled by default) or the provided `cmake/riscv64-spacemit-linux-gnu-gcc.cmake` cross-toolchain file. No upstream-published prebuilt binary exists via any channel checked.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| ggml (vendored, upstream `ggml-org/ggml`) | Tensor/SIMD compute core | Yes, RVV/zfh/zvfh/zicbop/zihintpause on by default in-tree | No dedicated upstream `ggml-org/ggml` riscv64 CI found in this sweep | Found in Ubuntu 26.04 riscv64 (`libggml-dev`, packaged with llama.cpp) | Blocking issues: whisper.cpp [#3717](https://github.com/ggml-org/whisper.cpp/issues/3717), [#2989](https://github.com/ggml-org/whisper.cpp/issues/2989); upstream ggml #1475 (gate cpu-riscv64 backend on Zv* sub-extensions, open), #1535 (ggml-0.14.0 build fails on OpenBSD/riscv64, open) |
| llama.cpp (vendored under `examples/talk-llama`; optional system package) | LLM inference sharing the ggml core, used by the talk-llama example | Yes, RVV kernels + SpacemiT backend, CODEOWNERS entry for `ggml/src/ggml-cpu/arch/riscv/` | Native (non-QEMU) CI via RISE self-hosted runner `ubuntu-24.04-riscv`, non-blocking, path-triggered only | Found in Ubuntu 26.04 riscv64 (`llama.cpp` + `libggml-dev`); also Debian sid | None release-blocking as of this report; historical VLEN>256 correctness bug (PR #3453) fixed by #8748 |
| OpenBLAS | Optional BLAS backend (`GGML_BLAS`, off by default off-Apple) | Yes, dedicated RVV kernels (C910V, x280 RVV1.0/VLEN512, generic ZVL128B/256B, SiFive U74 4x4 GEMM) | QEMU-emulated only, no native riscv64 hardware in upstream CI | Found in Ubuntu 26.04 riscv64 (`libopenblas-dev`, `libopenblas0-pthread`, 0.3.32+ds-5) | Draft PR #5928 (VLEN-agnostic TRSM kernels); closed DGEMM regression #5811 (SpacemiT K1 correctness, 0.3.31 to 0.3.33) shows QEMU-only-CI risk |
| libcurl | Optional model download (`WHISPER_CURL`, off by default) | Yes, riscv64 listed among 28 supported archs in INSTALL.md | Tier-2: CI cross-compiles a musl static binary for riscv64, but the test suite never executes on riscv64 | Found in Ubuntu 26.04 riscv64 (`libcurl4-openssl-dev`, `libcurl4t64` 8.18.0-1ubuntu2.4) | None merge-blocking; riscv64 explicitly not release-blocking |
| FFmpeg | Optional audio decode on Linux (`WHISPER_COMMON_FFMPEG`, off by default) | Yes, first-class target, dedicated `libavcodec/riscv/` etc. | Yes, real test execution: 3 FATE configs at Remlab.net, 5531-5532/5532 tests passing | Found in Ubuntu 26.04 riscv64 (`ffmpeg` 7:8.0.1-3ubuntu2) | Open unreviewed patch (since 2025-11-09) adding Zve32x/Zve32f/Zve64x/Zve64d subset detection; not merge-blocking |
| SDL2 | Audio capture for `stream`/`command`/`talk-llama` examples (`WHISPER_SDL2`, off by default) | Portable C, no riscv64-specific code path needed | No riscv64-tagged issues/PRs found | Found in Ubuntu 26.04 riscv64 (`libsdl2-dev` 2.32.10+dfsg-6) | None identified |
| OpenMP (libgomp) | Default-on (`GGML_OPENMP`) CPU-backend threading | Ships with the riscv64 GCC toolchain | N/A (toolchain runtime) | Found in Ubuntu 26.04 riscv64 (`libgomp1` 16-20260322-1ubuntu1) | None identified |

**GPU/JIT accelerator backends** (CUDA, HIP, MUSA, Vulkan, Metal, SYCL, OpenCL, WebGPU, OpenVINO, Hexagon, zDNN, ZenDNN) are all `OFF` by default and have no riscv64 relevance - excluded from the table above.

**Net assessment of dependencies:** every non-GPU dependency whisper.cpp can pull in already has a riscv64 binary published in Ubuntu 26.04 (resolute). The gaps are in CI rigor (OpenBLAS is QEMU-only with a real regression history; libcurl's own test suite does not run on riscv64) and in whisper.cpp's own build glue (#3717's malformed `-march=` string), not in upstream dependency availability.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3717](https://github.com/ggml-org/whisper.cpp/issues/3717) | Compilation problems on RISC-V | Closed, `not_planned` (stale bot) | Blocking - build fails entirely | Malformed `-march=rv64gc_zfh_v_zvfh_zicbop_zihintpause` string rejected by GCC 13.3; unresolved, no fix merged, no maintainer engagement beyond the reporter's own comment |
| [#2989](https://github.com/ggml-org/whisper.cpp/issues/2989) | The instrinsic function fail of `__riscv_vcreate_v_i8m1_i8m2` on RISC-V | Closed, `not_planned` (stale bot) | Blocking - build fails in dot-product kernels | GCC 13.2 does not support the intrinsic; a community member (not a maintainer) confirmed the same failure in llama.cpp and identified GCC 14+ as the fix; no code fix merged in whisper.cpp |

**Correctness bugs:** none found. A targeted search for RISC-V-specific NaN/floating-point correctness issues returned no results beyond the two compile-failure issues above.

## 12. Objections and Upstream Blockers

**Stated objections:** none found specifically against RISC-V support. On the llama.cpp side (where the actual RISC-V engineering happens), Georgi Gerganov - sole reviewer/gatekeeper across the relevant PRs - set three concrete gating requirements before merging the SpacemiT backend ([PR #15288](https://github.com/ggml-org/llama.cpp/pull/15288)): adopt the project's coding/naming style, provide CI workflows for the new backend, and add a CODEOWNERS entry. All three were satisfied and the PR merged - but only on the llama.cpp side; whisper.cpp itself never added an equivalent riscv64 CI job.

**Technical blockers:** GCC<14 fails to compile whisper.cpp on riscv64 (two confirmed, unresolved issues); no upstream riscv64 CI exists to catch regressions before they reach users.

**Organizational blockers:** all substantive RISC-V engineering happens in `ggml-org/llama.cpp`/`ggml`, not natively in whisper.cpp. Neither whisper.cpp compile-failure issue received a maintainer reply - #3717 has 2 comments (both from the reporter), #2989 has 3 comments (fix identified by a community member, not a maintainer) - and both were closed by the stale bot for inactivity rather than resolved.

**Acceptance probability:** whisper.cpp's `CONTRIBUTING.md` explicitly favors contributors who "own" the code they add long-term. Given that RISC-V investment already succeeds upstream in ggml/llama.cpp - three merged feature PRs ([#15288](https://github.com/ggml-org/llama.cpp/pull/15288) SpacemiT backend, [#15720](https://github.com/ggml-org/llama.cpp/pull/15720) RVV kernel optimization with +183%/+177% throughput gains, [#13720](https://github.com/ggml-org/llama.cpp/pull/13720) xtheadvector support) and syncs automatically into whisper.cpp - the most likely path to closing the CI/release gap is adding a whisper.cpp-side CI workflow mirroring llama.cpp's RISE-runner-based approach, rather than new kernel engineering. This is a comparatively low-effort, high-confidence contribution given the precedent already set upstream.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Debian (distro-provided; upstream publishes no riscv64 artifact)
- **Justification:** whisper.cpp has zero riscv64 CI - confirmed by directly reading all 22 GitHub Actions workflow files, none of which reference `riscv`/`rvv`/`rv64` in any form - and ships no riscv64 upstream release artifact (the [GitHub Releases API](https://api.github.com/repos/ggml-org/whisper.cpp/releases) shows no riscv64 asset in the last five releases; no PyPI package exists at all). This alone would place the project at orange under Step 1 of the color model. However, Debian's own build infrastructure ([buildd.debian.org](https://buildd.debian.org/status/package.php?p=whisper.cpp&suite=sid), [packages.debian.org](https://packages.debian.org/sid/riscv64/libwhisper1), and the ftp-master madison API) confirms a live riscv64 build of `libwhisper1`/`whisper.cpp-tools` (version 1.9.3+dfsg-1) compiled directly from unmodified upstream source, with `GGML_RVV` enabled at its default. Per the distribution floor rule, a clean (unpatched) distro build raises the grade from orange to **yellow**.
- **Optimization note (not a color-determining factor here, since whisper.cpp is an application rather than a pure optimization library, but material to interpreting the "yellow" grade):** the underlying RVV/SpacemiT implementation itself is not the limiting factor - it is described in Section 4 as hand-tuned, third-largest of any architecture-specific backend in the codebase, and "not a stub." The color is capped at yellow purely by the absence of upstream CI and upstream release artifacts, not by any deficiency in RISC-V code coverage.
- **Pending work that could change the grade:** none identified as in-flight specifically for whisper.cpp's own CI. The precedent exists in the sibling `llama.cpp` repository, which already runs a RISE self-hosted riscv64 CI runner (`ubuntu-24.04-riscv`) - extending an equivalent job to whisper.cpp's own `.github/workflows/` would close this gap directly, per the analysis in Section 12. No open PR toward that end was found in this research.

## 14. Investment Analysis

RISE has not funded or directly touched whisper.cpp (Section on RISE involvement in the research findings: no RISE blog post, no RISE member/project entry, no dedicated repo under `riseproject-dev`, and the only trace anywhere in the RISE org is an unfulfilled backlog line in this repository's own `.queue.yml`). RISE-member SpacemiT is, however, the author of whisper.cpp's most actively maintained RISC-V code path (the IME backend), and RISE does fund riscv64 CI runner infrastructure that the sibling `llama.cpp` project already uses.

### 14.1 Functional Enablement
Already substantially complete upstream via the `ggml` sync pipeline - the RVV baseline and SpacemiT backend are full, in-tree implementations. The remaining functional gap is narrow: fix (or at minimum document) the CMake `-march=` string generation and the GCC>=14 requirement that trips #3717/#2989. This is a build-robustness fix, not new kernel engineering, since Debian's own riscv64 build already succeeds against unpatched upstream source.

### 14.2 Performance Optimization
Already substantially complete upstream - the RVV kernel optimization work ([llama.cpp PR #15720](https://github.com/ggml-org/llama.cpp/pull/15720)) delivered +183% prompt-processing and +177% token-generation throughput on a representative model in the shared ggml codebase, and the SpacemiT IME backend adds further vendor-specific matrix-extension acceleration. No whisper.cpp-specific performance investment is indicated beyond what `ggml` already provides via sync. **Data not available:** no whisper.cpp-specific (as opposed to generic ggml/llama.cpp) riscv64 throughput or RTF numbers could be located in this research.

### 14.3 CI/CD Infrastructure
Not yet done for whisper.cpp itself, despite being done for `llama.cpp`. The concrete work item is adding a riscv64 job to whisper.cpp's own `.github/workflows/` (extending `build-cpu.yml` or adding a new `build-riscv.yml`), reusing RISE's existing runner infrastructure and the GCC>=14 toolchain already proven to work by Debian's package build. This is the single highest-leverage item identified in this report: it would catch regressions like #3717/#2989 before they reach users, and is a small, well-precedented piece of engineering given llama.cpp's existing workflow to copy from.

### 14.4 Ecosystem Enablement
whisper.cpp has no significant dependent package ecosystem of its own (Section 10 omitted per report criteria). The relevant "ecosystem" work is at the distribution level: re-verify Ubuntu 26.04's riscv64 `whisper.cpp` package (last confirmed at the older 1.8.3+dfsg-2, versus Debian's more current 1.9.3+dfsg-1) and, if desired, publish an official upstream GitHub Release riscv64 binary (e.g. `whisper-bin-ubuntu-riscv64.tar.gz`) analogous to the existing arm64/x64 assets.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix CMake `-march=` string generation for GCC 13.x compatibility, or document GCC>=14 as the minimum and gate the build accordingly | 1-2 | whisper.cpp maintainer/contributor | High |
| CI/CD | Add a riscv64 CI job to whisper.cpp's own workflows, reusing RISE's `ubuntu-24.04-riscv` runner (precedent: llama.cpp's `build-riscv.yml`) | 2-3 | whisper.cpp maintainer + RISE runner infra | High |
| Distribution | Publish an official upstream GitHub Release riscv64 binary asset, once CI exists to validate it | 1 | whisper.cpp maintainer | Medium |
| Distribution | Re-verify and, if lapsed, refresh Ubuntu 26.04's `whisper.cpp` riscv64 package to track current upstream (1.9.3+dfsg-1 per Debian) | 0.5 | Ubuntu/Debian packaging | Low |
| Performance | No whisper.cpp-specific work indicated; monitor upstream ggml/llama.cpp RVV/SpacemiT kernel progress for sync-in gains | N/A (tracked upstream) | ggml-org/llama.cpp | Low |

## 15. Updates
(No updates yet - initial report dated 2026-09-07.)

## 16. References

- [whisper.cpp repository](https://github.com/ggml-org/whisper.cpp)
- [Issue #3717 - Compilation problems on RISC-V](https://github.com/ggml-org/whisper.cpp/issues/3717)
- [Issue #2989 - intrinsic function fail of __riscv_vcreate_v_i8m1_i8m2](https://github.com/ggml-org/whisper.cpp/issues/2989)
- [PR #1101 - Multi platforms CI](https://github.com/ggml-org/whisper.cpp/pull/1101)
- [PR #2914 - Vulkan cross-compile fix (not RISC-V-related, not merged)](https://github.com/ggml-org/whisper.cpp/pull/2914)
- [llama.cpp PR #15288 - add riscv spacemit backend](https://github.com/ggml-org/llama.cpp/pull/15288)
- [llama.cpp PR #15720 - optimize RVV kernels](https://github.com/ggml-org/llama.cpp/pull/15720)
- [llama.cpp PR #13720 - add xtheadvector support](https://github.com/ggml-org/llama.cpp/pull/13720)
- [GitHub Releases API - ggml-org/whisper.cpp](https://api.github.com/repos/ggml-org/whisper.cpp/releases)
- [PyPI - whispercpp project](https://pypi.org/project/whispercpp/)
- [Debian buildd status - whisper.cpp (sid)](https://buildd.debian.org/status/package.php?p=whisper.cpp&suite=sid)
- [Debian packages - libwhisper1 (sid/riscv64)](https://packages.debian.org/sid/riscv64/libwhisper1)
- [Debian ftp pool - whisper.cpp](https://ftp.debian.org/debian/pool/main/w/whisper.cpp/)
- [Ubuntu packages search - whisper.cpp (resolute)](https://packages.ubuntu.com/search?keywords=whisper.cpp&suite=resolute&searchon=names&section=all)
- [DeepComputing - Whisper on RISC-V](https://deepcomputing.io/open-source-projects-on-risc-v/whisper-on-risc-v/)
- [RISE Project blog index](https://riseproject.dev/blog)
- [RISE - "RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE - "SALTyRN: Turning Neon Kernels into Fast, Verified RVV Code with LLMs"](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE members](https://riseproject.dev/members/)
- [whisper.cpp CONTRIBUTING.md governance policy](https://github.com/ggml-org/whisper.cpp/blob/master/CONTRIBUTING.md)
- [whisper.cpp cmake/riscv64-spacemit-linux-gnu-gcc.cmake](https://github.com/ggml-org/whisper.cpp/blob/master/cmake/riscv64-spacemit-linux-gnu-gcc.cmake)
- [whisper.cpp ggml/src/ggml-cpu/arch/riscv/](https://github.com/ggml-org/whisper.cpp/tree/master/ggml/src/ggml-cpu/arch/riscv)
- [whisper.cpp ggml/src/ggml-cpu/spacemit/](https://github.com/ggml-org/whisper.cpp/tree/master/ggml/src/ggml-cpu/spacemit)