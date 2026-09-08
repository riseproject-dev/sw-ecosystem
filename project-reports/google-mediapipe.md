---
title: Google MediaPipe
parent: Project Reports
color: red
---

# Google MediaPipe

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Google MediaPipe<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MediaPipe is Google's cross-platform, on-device ML inference and media-processing framework, providing prebuilt "Solutions" (pose/hand/face landmark detection, object detection, gesture recognition, text/audio classification, generative AI helpers) built on a graph-based "calculator" pipeline architecture. It is built with Bazel and C++, with Python, Web/JS, Android (Java/Kotlin), and iOS bindings. Canonical documentation is at [developers.google.com/edge/mediapipe](https://developers.google.com/edge/mediapipe/solutions/guide).

**Governance.** MediaPipe is wholly owned and governed by Google. There is no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE` file in the repository, and no independent foundation is involved. The repository lives under the Google-controlled GitHub org `google-ai-edge`.

**License.** Code is Apache License 2.0 (confirmed in the repository `LICENSE` file); documentation content is CC BY 4.0.

**Corporate sponsors / maintainers.** Analysis of the last 500 commits on `master` shows commits concentrated almost entirely under `@google.com` addresses: 286 commits from the internal export bot `mediapipe-team@google.com`, 162 from `mrschmidt@google.com`, and the remainder split across roughly 15 more `@google.com` authors. Of 25 unique authors in that window, only one (GitHub user `a2105z`, PR #6344) was external. This is effectively 100% single-vendor maintainership.

**Community culture on new ports.** `CONTRIBUTING.md` states the project accepts "only bug fixes and documentation fixes" and explicitly says "we are currently not planning to accept new feature pull requests." Contributors must sign Google's CLA, and accepted fixes are manually merged into Google's internal codebase, then exported back to GitHub on the next release cycle - a closed, internal-source-of-truth workflow rather than an open external-contribution model. `CONTRIBUTING.md` directs anyone wanting new capabilities (which a new architecture port constitutes) to publish it as a separate third-party repository listed on "Awesome MediaPipe" rather than submit it upstream.

## 2. Port History and Upstreoming Timeline

No RISC-V port has ever been started. There is no "first RISC-V commit" to report because none exists.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related issue, PR, or commit has ever been filed against `google-ai-edge/mediapipe` | Confirmed by exhaustive `mcp__github__search_issues`, `search_pull_requests`, `search_commits`, and `search_code` queries for `riscv`, `riscv64`, `riscv in:title,body`, and `"risc-v"`, all returning 0 results |

Key contributors: not applicable, no port work exists. Fully upstream: not applicable, there is nothing to upstream.

## 3. Upstream Support Tier

No formal tier policy document exists. `PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` are all absent from the repository. Supported platforms are only implicit in the Bazel build configuration (`.bazelrc`, `platform_mappings`) and setup docs, which define targets for Android (arm, arm64, x86, x86_64), iOS/macOS/Apple, Windows, and Linux x86_64 - and nothing else. Notably, even Linux/arm64 has no first-class Bazel platform entry (the `linux` platform target in `mediapipe/BUILD` is hardcoded to `@platforms//cpu:x86_64` only).

| Architecture | CI builds | CI tests | Official binaries |
|---|---|---|---|
| amd64 | Implicit (no dedicated CI at all repo-wide; developer/manual Bazel builds) | No repo-wide CI test execution found | PyPI `mediapipe` wheels (manylinux x86_64), source archives |
| arm64/aarch64 | Implicit (Android/iOS/macOS build targets defined in `.bazelrc`) | No repo-wide CI test execution found | PyPI `mediapipe` wheels (manylinux aarch64), Android/iOS builds |
| riscv64 | No | No | No |

The repository's only GitHub Actions workflow, `.github/workflows/stale.yaml`, is a daily cron-triggered stale-issue/PR bot (`actions/stale@v7`) with zero build or test steps of any kind, for any architecture. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

## 4. Technical Architecture and RISC-V-Specific Subsystems

MediaPipe is not itself a low-level SIMD/JIT library; it delegates most performance-critical numeric computation to bundled dependencies (TensorFlow/XLA, XNNPACK, TFLite/LiteRT, OpenCV, Eigen, Halide). Within MediaPipe's own source, architecture-specific preprocessor guards are limited to a handful of low-level utility files.

Repo-wide inventory of the only files containing any CPU-architecture guard at all (local clone, HEAD `c17b2a8`):

| File | Guards present |
|---|---|
| `mediapipe/framework/deps/mathutil.h` | `__i386__`, `__SSE2__`, `__AVX__`, `__x86_64__`, `__aarch64__`, `__powerpc64__` |
| `mediapipe/framework/formats/image_frame.cc` | `__i386__`, `__x86_64__`, `__POPCNT__` |
| `mediapipe/framework/demangle.h` | `__ANDROID__`, `__i386__`, `__x86_64__`, `__mips__` |

`__riscv` appears in zero files anywhere in the repository (confirmed via GitHub code search and a full local repo grep).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Low-level math/util guards (mathutil.h, image_frame.cc, demangle.h) | Partial (SSE2/AVX/POPCNT guarded blocks) | Partial (guarded block, no NEON intrinsics beyond the guard) | Missing (no guard; falls to generic `#else` scalar path if it compiles at all) |
| Inference backend (TensorFlow/XLA) | Full (official upstream support) | Full (official upstream support) | Missing (no working riscv64 build - see Section 9) |
| SIMD NN kernels (XNNPACK) | Full | Full | Missing at MediaPipe's consumption point (upstream cross-compile test failures - see Section 9) |
| Image processing (OpenCV, RVV-capable) | Full | Full | Present but with open RVV accuracy bugs (see Section 9, Section 11) |
| Bazel platform/toolchain definitions | Defined (`linux` = x86_64) | Defined (Android/iOS/macOS arm64 targets) | Not defined at all |

**Caveat on portability**: the guarded blocks in `mathutil.h` all fall through to a plain, architecture-agnostic `#else return Round<int64_t>(x);` scalar path with no arch check, so a riscv64 build of MediaPipe's own code would very likely compile via that generic fallback. This is an unverified hypothesis, not a tracked or CI-validated capability - no one has filed evidence of attempting it, and it is moot regardless because the framework's core inference dependency (TensorFlow) does not build on riscv64 at all (Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

MediaPipe builds exclusively with **Bazel** (`WORKSPACE`, `MODULE.bazel`, `.bazelrc`, `BUILD.bazel` files). No `CMakeLists.txt` exists anywhere in the repository, so it is not a CMake project.

None of the following expected build/install documentation files exist: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`. Actual build docs live at `docs/getting_started/install.md` and `docs/getting_started/building_examples.md`; scanning `install.md` for architecture references shows only `aarch64-linux-gnu`, `arm-linux-gnueabihf`, and `x86_64-linux-gnu` multiarch OpenCV include paths - no riscv64 mention.

No riscv64 toolchain files exist. `.bazelrc` defines `--cpu=` configs only for `android_arm`, `android_arm64`, various `ios_*`, and `darwin_*` targets; `platform_mappings` maps only Android/iOS/macOS/Windows/Linux(k8) CPUs. There is no riscv64 platform/config_setting block anywhere.

No riscv64 Dockerfile exists. The only Dockerfiles present are `Dockerfile`, `Dockerfile.manylinux2014_aarch64rp4`, `Dockerfile.manylinux_2_28_x86_64`, and `mediapipe/examples/coral/Dockerfile.{arm64,amd64,armhf}`.

The only occurrence of the string "riscv" anywhere in the repository is in `pnpm-lock.yaml`, an auto-generated npm/pnpm lockfile for the web/Studio JS tooling, listing `@rollup/rollup-linux-riscv64-gnu@4.60.0` and `@rollup/rollup-linux-riscv64-musl@4.60.0` as optional platform-binary dependencies of the Rollup JS bundler. This is a transitive `optionalDependencies` entry Rollup publishes for every release across many platforms; it reflects nothing about MediaPipe's own native/C++ build and is not documentation, CI, or a build artifact for MediaPipe.

There is no exact cmake/configure command, toolchain minimum version, `-DUSE_X=OFF` flag set, or QEMU step to report for riscv64, because no riscv64 build path exists in any form.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build from source | Yes (implicit, Bazel) | Yes (implicit, Android/iOS/macOS Bazel targets) | Not possible today - blocked by TensorFlow (Section 9) |
| Python API (`mediapipe` wheel) | Yes (manylinux x86_64) | Yes (manylinux aarch64) | No (Section 8) |
| Prebuilt binaries (any channel) | Yes | Yes (Android/iOS/macOS) | No (Section 8) |
| Bazel platform/toolchain definition | Yes | Yes | No |
| Solutions relying on TFLite/LiteRT inference | Functional | Functional | Non-functional - core inference engine does not build (Section 9) |
| Solutions relying on Halide calculators | Functional | Functional | Non-functional - Halide's riscv64 build is confirmed broken upstream (Section 9) |
| OpenCV-backed image ops (RVV-accelerated paths) | Functional | Functional | Available in distro (Ubuntu) but with open RVV accuracy bugs (opencv/opencv#27279, opencv/opencv#27281) |

**Functional gap.** MediaPipe cannot currently be built for riscv64 at all: its core ML inference/JIT backend, TensorFlow, has no working riscv64 build ([tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), open), and its Halide-based calculators depend on an upstream Halide riscv64 build that is explicitly broken ([halide/Halide#8114](https://github.com/halide/Halide/issues/8114), open). This is a total functional gap, not a partial one.

**Performance gap.** Not assessable - there is no working riscv64 build to benchmark. No MediaPipe-specific riscv64 benchmark data exists anywhere (GitHub, general web search, or the RISE project blog were all checked and returned nothing). The closest available proxy data points are for adjacent, non-MediaPipe projects on RISC-V hardware (see Section 12 note on IREE/PyTorch), which are not substitutable evidence for MediaPipe's own performance.

**Security hardening / NaN and floating-point semantics gaps.** Two of MediaPipe's dependencies have open riscv64-specific floating-point correctness issues that would affect MediaPipe if a build were ever attempted: NumPy has open spurious floating-point-exception test failures on riscv64 ([numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461), [numpy/numpy#32376](https://github.com/numpy/numpy/issues/32376)), and Abseil-cpp has a closed NegativeNaN test failure ([abseil/abseil-cpp#1684](https://github.com/abseil/abseil-cpp/issues/1684), closed) plus an open ILP32E stack-alignment issue ([abseil/abseil-cpp#1236](https://github.com/abseil/abseil-cpp/issues/1236)). No MediaPipe-specific security-hardening data was found (no CI, no fuzzing/sanitizer results for riscv64 exist to check).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by direct inspection of a live clone of `google-ai-edge/mediapipe` (HEAD `c17b2a83e8944d2811889a2a08d629c20bcb6ed8`):

- `.github/workflows/` contains exactly one file, `stale.yaml`. Its full trigger is `on: schedule` (cron `"30 1 * * *"`, daily) - no `push`, `pull_request`, or `workflow_dispatch` triggers. It runs on `runs-on: ubuntu-latest` (standard x86_64 GitHub-hosted runner, no QEMU or cross-arch emulation), and its only step invokes `actions/stale@v7` to label/close inactive issues and PRs. It performs zero build, zero test, and zero architecture-specific logic. The string "riscv" does not appear in this file at all.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.circleci` directory exists anywhere in the repository.
- A repo-wide `grep -rIn "riscv"` returns exactly 4 matches, all in `pnpm-lock.yaml` (the npm/Rollup optional-binary entries described in Sections 5 and 9). `grep -rIn "risc-v"` returns zero matches.
- No RISE RISC-V runners or `riseproject-dev` references appear anywhere in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | No dedicated CI job (repo has no build/test workflow of any kind) | No dedicated CI job | No dedicated CI job |
| CI test | No | No | No |
| CI release-blocking | N/A (no CI) | N/A (no CI) | N/A (no CI) |
| Hardware | N/A | N/A | N/A |
| RISE runner usage | No | No | No |

Because there is no CI system of any kind for any architecture in this repository, MediaPipe's riscv64 CI absence is consistent with (not worse than) its treatment of every other architecture at the CI layer specifically - the difference for riscv64 is that it also lacks any manual/implicit build path or release artifact (Sections 5, 8), unlike amd64/arm64.

## 8. Distribution and Release Status

**No official riscv64 binaries exist for MediaPipe in any channel checked:**

| Channel | riscv64 available? | Evidence |
|---|---|---|
| GitHub Releases (`google-ai-edge/mediapipe`) | No | [Releases page](https://github.com/google-ai-edge/mediapipe/releases) and [v1.0.0 expanded assets](https://github.com/google-ai-edge/mediapipe/releases/expanded_assets/v1.0.0) list only generic `v1.0.0.zip` / `v1.0.0.tar.gz` source archives - no per-architecture binaries of any kind, for any architecture |
| PyPI, real package `mediapipe` | No | [pypi.org/pypi/mediapipe/json](https://pypi.org/pypi/mediapipe/json) lists wheels only for `manylinux_2_17_x86_64`, `manylinux2014_aarch64`, `macosx_11_0_x86_64`/`universal2`, and `win_amd64` - no riscv64 tag |
| PyPI, package name `google-mediapipe` (as sometimes referenced) | N/A | [pypi.org/pypi/google-mediapipe/json](https://pypi.org/pypi/google-mediapipe/json) returns HTTP 404 - this project name does not exist on PyPI at all |
| RISE GitLab wheel builder | No | [gitlab.com project 56254198 pypi simple index for google-mediapipe](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/google-mediapipe/) 302-redirects to the same nonexistent PyPI project (#4) |
| Ubuntu 26.04 "resolute" | No | Project graph DB SPARQL query (architecture=riscv64, suite=resolute, names "google mediapipe"/"python3-google-mediapipe"/"libgoogle-mediapipe") returns 0 bindings; independently, [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=google-mediapipe&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" |
| Arch Linux RISC-V port tracker | No | [archriscv.felixc.at query](https://archriscv.felixc.at/?q=google%20mediapipe) shows no mediapipe entry |

**What a user must do to get a working riscv64 binary today: nothing works.** There is no source path either - building from source requires TensorFlow, which does not build on riscv64 (Section 9), so even a from-source build attempt fails at a dependency level before reaching MediaPipe's own code.

## 9. Dependencies

Parsed from MediaPipe's `WORKSPACE`, `MODULE.bazel`, and `requirements.txt` (local clone). Checked against the project graph for Ubuntu 26.04 (resolute) riscv64 packaging and each dependency's own GitHub repo for riscv64 issues.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| TensorFlow (pinned commit, provides XLA JIT) | Core ML/inference framework + JIT compiler | Not distro-packaged; community from-source builds fail | No working build to test | No official riscv64 binaries/wheels | [tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) (open, "Can't compile tensorflow 2.19.1 on riscv"), [#100940](https://github.com/tensorflow/tensorflow/issues/100940) (open), [#62241](https://github.com/tensorflow/tensorflow/issues/62241) (closed, soft/double-float link mismatch), [#47636](https://github.com/tensorflow/tensorflow/issues/47636) (closed, TFLite riscv build target) |
| XNNPACK | SIMD-optimized NN inference kernels via TFLite/LiteRT delegate | Packaged in Ubuntu 26.04 riscv64 (`libxnnpack-dev`) | Open cross-compile test failure | No official upstream riscv64 release binaries | [google/XNNPACK#8052](https://github.com/google/XNNPACK/issues/8052) (open, transpose-test fails cross-compiling for riscv64), [#4650](https://github.com/google/XNNPACK/issues/4650) (open, "RISC-V cpuinfo build error") |
| LiteRT (TFLite runtime) | On-device inference interpreter, MediaPipe's core inference engine | Not distro-packaged (pip wheels/prebuilt libs only) | No riscv64 CI evidence found | No official riscv64 wheels (x86_64/aarch64/armv7 only) | No riscv64-specific issues filed upstream |
| Eigen | SIMD/vectorized linear algebra, used by TF and MediaPipe math ops | Ubuntu `libeigen3-dev` exists for arm64/amd64 only, not riscv64 | N/A | Not packaged for riscv64 | Header-only, generic scalar fallback plausible, but no packaged riscv64 binary in Ubuntu 26.04 |
| OpenCV | Image processing/CV primitives, RVV-accelerated paths | Packaged in Ubuntu 26.04 riscv64 (`libopencv-dev`) | Multiple open RVV accuracy/crash failures | Packaged for riscv64 in Ubuntu | [opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279) (open, Remap accuracy fails on RVV), [#27281](https://github.com/opencv/opencv/issues/27281) (open, WarpPerspective accuracy fails on RVV), [#19844](https://github.com/opencv/opencv/issues/19844) (open, GAPI test fails on RISC-V) |
| Abseil-cpp | Foundational C++ library underpinning TF/Protobuf/MediaPipe | Packaged in Ubuntu 26.04 riscv64 (`libabsl-dev`) | [#1684](https://github.com/abseil/abseil-cpp/issues/1684) NegativeNaN test failure (closed); [#1236](https://github.com/abseil/abseil-cpp/issues/1236) ILP32E stack-alignment issue (open) | Packaged for riscv64 in Ubuntu | [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) (open, "Can't link using riscv64 toolchain") |
| Protocol Buffers | Serialization for calculator graphs/configs and TF SavedModel | Packaged in Ubuntu 26.04 riscv64 | N/A | Packaged for riscv64 | [protocolbuffers/protobuf#12266](https://github.com/protocolbuffers/protobuf/issues/12266) ("Add riscv64 support", closed/merged); no open blockers found |
| RE2 | Regex engine (via Abseil/Protobuf) | Packaged in Ubuntu 26.04 riscv64 | N/A | Packaged for riscv64 | None found |
| zlib | Compression | Packaged in Ubuntu 26.04 riscv64 | N/A | Packaged for riscv64 | None found |
| cpuinfo (pytorch/cpuinfo) | Runtime CPU feature detection driving XNNPACK SIMD kernel selection | Packaged in Ubuntu 26.04 riscv64 despite upstream feature gap | Downstream integration failure reported | Packaged for riscv64 in Ubuntu | [pytorch/cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124) (open, "Add: RISC-V support" - no native riscv64 CPU-feature detection upstream yet) |
| pthreadpool | Thread pool backing XNNPACK parallel dispatch | Packaged in Ubuntu 26.04 riscv64 | N/A | Packaged for riscv64 | None found |
| BoringSSL | Crypto/TLS backend | Not a distro package for any architecture (Google-only vendored consumption) | N/A | Not released as a system package anywhere | None found upstream |
| libcurl | HTTP(S) client for model/asset downloads | Packaged in Ubuntu 26.04 riscv64 | N/A | Packaged for riscv64 | None found |
| FlatBuffers | Serialization for `.tflite` model files | Packaged in Ubuntu 26.04 riscv64 | N/A | Packaged for riscv64 | None found |
| NumPy | Python array/numerics used by MediaPipe's Python API | Packaged in Ubuntu 26.04 riscv64 (`python3-numpy`, distro only) | Open floating-point-exception test failures | No official upstream PyPI riscv64 wheels | [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461) (open), [#32376](https://github.com/numpy/numpy/issues/32376) (open), [#30216](https://github.com/numpy/numpy/issues/30216) (open, "Build and distribute manylinux wheels for riscv64"), [#26200](https://github.com/numpy/numpy/issues/26200) (open, "Add RISC-V Vector V1.0 Support") |
| Halide | LLVM-based JIT/AOT image-processing DSL compiler used by Halide calculators | Not distro-packaged; MediaPipe's `WORKSPACE` only pins prebuilt x86-64/arm64/Windows release archives, no riscv64 prebuilt | RISC-V `simd_op_check` support merged upstream (#7122, closed), but overall build is broken | No riscv64 release artifact usable by MediaPipe | [halide/Halide#8114](https://github.com/halide/Halide/issues/8114) (open, "riscv64 build is broken in 17.0.0"), [#6281](https://github.com/halide/Halide/issues/6281) (open, wrong environment for Linux RISC-V triples) |

**Gating dependencies.** Of the above, TensorFlow (no working riscv64 build) and Halide (build explicitly broken upstream) are the true gates on a native riscv64 MediaPipe build - both are unresolved, open, upstream issues with no fix in sight. Most of the smaller supporting libraries (XNNPACK, OpenCV, Abseil-cpp, Protobuf, RE2, zlib, cpuinfo, pthreadpool, libcurl, FlatBuffers, python3-numpy) are already packaged for riscv64 in Ubuntu 26.04, though several (OpenCV, NumPy) carry open riscv64-specific correctness bugs in their RVV paths.

Section 10 (Ecosystem Status) is omitted: MediaPipe is a standalone application framework consumed as a single Python/native package, not a project with a large dependent-package ecosystem (e.g. plugins or extensions built on top of it) requiring separate riscv64 enablement.

## 11. Known Bugs and Active Issues

**No riscv64 bugs or issues have ever been filed against MediaPipe itself.** GitHub issue and PR searches for `riscv`, `risc-v`, `riscv64 bug`, `riscv64 performance`, `riscv nan floating`, and `riscv OR risc-v OR riscv64 vector RVV` all returned zero genuine matches (a handful of semantic false positives - #5163 Apple Silicon segfault, #1617 Face Detection APK crash, #865 desktop hand_tracking crash, #1115 Raspberry Pi 4 CPU load - none RISC-V related).

The correctness bugs that matter for a future MediaPipe riscv64 port live in its dependencies, not in MediaPipe's own tracker:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) | Can't compile tensorflow 2.19.1 on riscv | Open | Critical (blocks MediaPipe entirely) | Core inference/JIT backend does not build |
| [halide/Halide#8114](https://github.com/halide/Halide/issues/8114) | riscv64 build is broken in 17.0.0 | Open | Critical (blocks Halide calculators) | Explicit upstream confirmation of breakage |
| [opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279) | Remap accuracy fails on RVV | Open | Correctness | Would affect OpenCV-backed MediaPipe calculators if built |
| [opencv/opencv#27281](https://github.com/opencv/opencv/issues/27281) | WarpPerspective accuracy fails on RVV | Open | Correctness | Same as above |
| [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461) | Spurious FP-exception test fails on riscv | Open | Correctness | Affects Python API numerics |
| [google/XNNPACK#8052](https://github.com/google/XNNPACK/issues/8052) | Transpose test fails cross-compiling for riscv64 | Open | Correctness/build | Affects TFLite delegate kernel path |
| [pytorch/cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124) | Add RISC-V support | Open | Feature gap | No native riscv64 CPU-feature detection, affects XNNPACK kernel dispatch |

## 12. Objections and Upstream Blockers

**Stated objections.** None specific to RISC-V exist because no RISC-V port has ever been proposed to MediaPipe's maintainers - there is nothing to object to yet.

**Technical blockers.** The dominant blocker is architectural: MediaPipe's core value (on-device ML inference) depends entirely on TensorFlow/XLA and, for some calculators, Halide, and both are currently non-functional on riscv64 upstream (Sections 9, 11). No amount of MediaPipe-level work closes this gap - it requires the TensorFlow and Halide riscv64 build issues to be resolved first. Secondary blockers: MediaPipe's own Bazel build has no riscv64 platform/toolchain definition at all (Section 5), and Eigen (used by TF) is not riscv64-packaged in Ubuntu 26.04.

**Organizational blockers.** MediaPipe's contribution model is a hard blocker for any external riscv64 porting effort: `CONTRIBUTING.md` states the project accepts "only bug fixes and documentation fixes" and is "not planning to accept new feature pull requests" (Section 1). A CLA gate and an internal-merge-then-export workflow (commits titled "Internal" or "No public description" from `mediapipe-team@google.com`) mean an unsolicited RISC-V port PR would very likely be redirected to a third-party fork rather than merged.

**RISE Project involvement.** None found. No RISE blog post mentions MediaPipe (all 34 posts on [riseproject.dev/blog](https://riseproject.dev/blog/) checked, plus the on-site search returning "Sorry, no results were found" for "mediapipe"), MediaPipe is absent from the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (86 packages listed, none is mediapipe), and MediaPipe has no dedicated repository or tracking issue under the `riseproject-dev` GitHub org (25 repos checked via `search_repositories`, 0 matches for "mediapipe"). Google LLC is listed as a RISE Premier Member on [riseproject.dev](https://riseproject.dev) alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent - but this corporate membership has not been applied to MediaPipe specifically; RISE lists corporate members, not individual Google product repos.

The closest adjacent RISE work found is unrelated to MediaPipe: "[Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)" (2026-07-07) uses Google's IREE compiler (not MediaPipe) for an object-detection pipeline on a Banana Pi BPI-F3, and "[PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)" (2026-08-18) covers PyTorch/oneDNN kernels - neither touches MediaPipe.

**Acceptance probability.** Low, absent a change in MediaPipe's contribution policy or Google directly funding the work internally (as its own internal-merge model would require), and contingent on the TensorFlow and Halide riscv64 build blockers being resolved first by their respective upstream projects.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Optimization gap:** N/A (MediaPipe is a full ML application/inference framework, not an optimization-purpose SIMD/allocator/codec library; the Step 2 optimization modifier does not apply)
- **Justification:** MediaPipe has no upstream riscv64 CI of any kind (its sole GitHub Actions workflow, [`stale.yaml`](https://github.com/google-ai-edge/mediapipe/blob/master/.github/workflows/stale.yaml), is a stale-issue bot with zero build/test logic), no riscv64 package in any distribution checked (Ubuntu 26.04 resolute confirmed empty via two independent sources), and no riscv64 release artifact in any channel (GitHub Releases, PyPI, RISE wheel builder). Beyond the absence of support, there is positive evidence of a build-blocking dependency failure: MediaPipe's core inference/JIT backend, TensorFlow, has an open, unresolved riscv64 build failure ([tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159)), and its Halide-based calculators depend on a Halide riscv64 build that upstream confirms is explicitly broken ([halide/Halide#8114](https://github.com/halide/Halide/issues/8114)). Per the color model's red criteria ("a build-blocking dependency with no riscv64 port"), this combination of zero upstream CI, zero distro package, and confirmed-broken critical dependencies places MediaPipe at red rather than the orange default for merely untested projects.
- **Pending work that could change the grade:** none identified. No open PR targets riscv64 support in `google-ai-edge/mediapipe` (Section 2), and no RISE-funded work is underway on MediaPipe specifically (Section 12). The grade would improve only if TensorFlow and Halide resolve their own riscv64 build failures upstream and MediaPipe subsequently adds a Bazel riscv64 platform target - none of which shows any current momentum.

**color_case, report_date, verified_date, as_of, confidence, delta_vs_report:** color_case is empty (red carries no sub-type per the model). No prior `project-reports/reports/mediapipe.md` existed before this report (`report_date: none`); all facts above were verified live during this research pass (`verified_date: 2026-06-17`, `as_of: 2026-06-17`). Confidence: high, given the volume of independently corroborating negative results (GitHub search, live repo grep, project graph DB, packages.ubuntu.com, PyPI, RISE wheel builder, Arch RISC-V tracker) across all axes of the color decision. `delta_vs_report: n/a` (no prior report existed to diff against).

## 14. Investment Analysis

**RISE involvement check.** As documented in Section 12, RISE has funded and published no work on MediaPipe specifically - no blog post, no wheel-builder package, no dedicated repo, no CI runner usage. Therefore no scoped work below is already covered by RISE and all estimates are for work starting from zero.

### 14.1 Functional Enablement

The blocking path is entirely upstream of MediaPipe: (1) get TensorFlow building on riscv64 (tracked at [tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), not scoped here as it is a separate multi-project effort of its own), (2) get Halide's riscv64 build fixed ([halide/Halide#8114](https://github.com/halide/Halide/issues/8114), likewise a separate upstream effort), (3) add Eigen riscv64 packaging to Ubuntu, (4) only then define a riscv64 Bazel platform/toolchain in MediaPipe itself and validate a from-source build. Given MediaPipe's closed CLA/internal-merge contribution model (Section 1), any external riscv64 patch would also need direct engagement with Google's MediaPipe team to have a realistic path to merge - a non-technical, non-trivial precondition.

### 14.2 Performance Optimization

Not assessable pre-functional-enablement. No riscv64-specific optimization work (RVV kernels, ISA-extension tuning) can be scoped until a working riscv64 build exists at all.

### 14.3 CI/CD Infrastructure

MediaPipe has no CI/CD system of any kind for any architecture (Section 7) - there is no existing CI pipeline to extend with a riscv64 job. Standing up riscv64 CI for MediaPipe would first require MediaPipe to adopt CI at all, which is outside the scope of a riscv64-specific investment.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's scope rules (MediaPipe has no significant dependent-package ecosystem requiring separate riscv64 enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Track/contribute to resolving TensorFlow riscv64 build failure ([tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159)) - prerequisite, not MediaPipe-specific | Not scoped here (separate TensorFlow-project effort) | External (TensorFlow upstream) | Critical |
| Functional | Track/contribute to resolving Halide riscv64 build breakage ([halide/Halide#8114](https://github.com/halide/Halide/issues/8114)) - prerequisite, not MediaPipe-specific | Not scoped here (separate Halide-project effort) | External (Halide upstream) | Critical |
| Functional | Get Eigen packaged for riscv64 in Ubuntu (currently arm64/amd64 only) | 1-2 | Distro packaging / RISE | High |
| Functional | Define riscv64 Bazel platform/toolchain in MediaPipe's `.bazelrc` and `platform_mappings`, once dependencies above are resolved | 2-4 | MediaPipe contributor (subject to CLA/internal-merge gate) | High (blocked on above) |
| Functional | Validate end-to-end from-source riscv64 build and a representative Solution (e.g. object detection) end to end | 2-3 | MediaPipe contributor | High (blocked on above) |
| CI/CD | Stand up any CI at all for MediaPipe (prerequisite to a riscv64 CI job, since none exists for any architecture) | Not scoped here (out of riscv64-specific scope) | MediaPipe maintainers (Google) | Low (organizational, not riscv64-specific) |
| Organizational | Engage Google's MediaPipe team directly (given CLA-gated, internal-merge-only contribution model) to establish a path for any riscv64 patches to land | Ongoing relationship-building, not person-weeks | Business development / partnerships | Critical (gates all technical work above) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [google-ai-edge/mediapipe repository](https://github.com/google-ai-edge/mediapipe)
- [MediaPipe documentation homepage](https://developers.google.com/edge/mediapipe/solutions/guide)
- [MediaPipe CONTRIBUTING.md contribution policy](https://github.com/google-ai-edge/mediapipe/blob/master/CONTRIBUTING.md)
- [MediaPipe stale.yaml, the repository's only CI workflow](https://github.com/google-ai-edge/mediapipe/blob/master/.github/workflows/stale.yaml)
- [MediaPipe GitHub Releases page](https://github.com/google-ai-edge/mediapipe/releases)
- [MediaPipe v1.0.0 release assets](https://github.com/google-ai-edge/mediapipe/releases/expanded_assets/v1.0.0)
- [PyPI mediapipe package JSON API](https://pypi.org/pypi/mediapipe/json)
- [PyPI google-mediapipe package JSON API (404, does not exist)](https://pypi.org/pypi/google-mediapipe/json)
- [RISE GitLab PyPI index for google-mediapipe (redirects to nonexistent PyPI project)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/google-mediapipe/)
- [packages.ubuntu.com search for google-mediapipe on resolute](https://packages.ubuntu.com/search?keywords=google-mediapipe&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port tracker query for google mediapipe](https://archriscv.felixc.at/?q=google%20mediapipe)
- [tensorflow/tensorflow#102159 - Can't compile tensorflow 2.19.1 on riscv](https://github.com/tensorflow/tensorflow/issues/102159)
- [tensorflow/tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940)
- [tensorflow/tensorflow#62241](https://github.com/tensorflow/tensorflow/issues/62241)
- [tensorflow/tensorflow#47636](https://github.com/tensorflow/tensorflow/issues/47636)
- [halide/Halide#8114 - riscv64 build is broken in 17.0.0](https://github.com/halide/Halide/issues/8114)
- [halide/Halide#6281](https://github.com/halide/Halide/issues/6281)
- [google/XNNPACK#8052](https://github.com/google/XNNPACK/issues/8052)
- [google/XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650)
- [opencv/opencv#27279 - Remap accuracy fails on RVV](https://github.com/opencv/opencv/issues/27279)
- [opencv/opencv#27281 - WarpPerspective accuracy fails on RVV](https://github.com/opencv/opencv/issues/27281)
- [opencv/opencv#19844 - GAPI test fails on RISC-V](https://github.com/opencv/opencv/issues/19844)
- [abseil/abseil-cpp#1684](https://github.com/abseil/abseil-cpp/issues/1684)
- [abseil/abseil-cpp#1236](https://github.com/abseil/abseil-cpp/issues/1236)
- [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702)
- [protocolbuffers/protobuf#12266](https://github.com/protocolbuffers/protobuf/issues/12266)
- [pytorch/cpuinfo#124 - Add: RISC-V support](https://github.com/pytorch/cpuinfo/issues/124)
- [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461)
- [numpy/numpy#32376](https://github.com/numpy/numpy/issues/32376)
- [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216)
- [numpy/numpy#26200](https://github.com/numpy/numpy/issues/26200)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members page](https://riseproject.dev)
- [Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V (RISE blog, adjacent, non-MediaPipe)](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [PyTorch is available on riscv64! (RISE blog, adjacent, non-MediaPipe)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
