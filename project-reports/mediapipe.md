---
title: MediaPipe
parent: Project Reports
color: orange
dependencies:
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: XNNPACK
    relation: runtime-dependency
    criticality: critical
  - name: LiteRT
    relation: runtime-dependency
    criticality: critical
  - name: BoringSSL
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: OpenCV
    relation: runtime-dependency
    criticality: optional
  - name: Halide
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="mediapipe" %}

# MediaPipe

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for MediaPipe<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MediaPipe is Google's cross-platform framework for building applied ML pipelines (vision, audio, and multimodal "solutions" such as face detection, hand tracking, pose estimation, and on-device LLM inference). It provides a graph/calculator execution model in C++ with Python, JavaScript/Web, Android, and iOS bindings, and now ships under the `google-ai-edge/mediapipe` GitHub organization (the historical `google/mediapipe` repository redirects there). Homepage: [mediapipe.dev](https://mediapipe.dev/), which itself redirects to `developers.google.com/mediapipe` / `ai.google.dev/edge/mediapipe`.

**Governance:** There is no neutral foundation home (no CNCF, Linux Foundation, or Apache Foundation affiliation). No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. This is a Google-internal project mirrored to open source (a Copybara-style upstream-sync model): `CONTRIBUTING.md` states external pull requests are accepted **only for bug fixes and documentation fixes**; new-feature PRs, including new platform ports, are explicitly declined, with contributors redirected to publish separate repos and list them in "Awesome MediaPipe."

**License:** Apache License 2.0 (code); documentation separately under CC-BY 4.0.

**Corporate sponsors / maintainers:** Effectively 100% Google. Of roughly 1,038 commits sampled over an April 2025-May 2026 window, 660 are attributed to the generic squash-author "MediaPipe Team" and 265 to a single named Google engineer (Sebastian Schmidt, `@google.com`); every other named committer also uses a `@google.com` address. No other company holds committer or maintainer standing. Google LLC is a RISE Project Premier Member ([riseproject.dev members page](https://riseproject.dev/)), but this membership has not translated into RISC-V work inside MediaPipe itself.

**Community culture on new ports:** Effectively closed to third-party architecture ports via upstream PR, by explicit written policy, regardless of technical quality. The documented path for a RISC-V port would be a separate community fork, not a merge into `google-ai-edge/mediapipe`.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists, so there is no genuine milestone timeline to report.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 issue, PR, commit, or tracking ticket has ever been opened in the repository | [GitHub issue search, 0 results for "risc-v"](https://github.com/google-ai-edge/mediapipe/issues) |
| 2026-05-06 | Only commit touching the string "riscv" anywhere in history: `36cd48c0`, "Add a Module.BAZEL to MediaPipe and migrate JS dependencies to Aspect JS" (Sebastian Schmidt, `mrschmidt@google.com`). This added an incidental `pnpm-lock.yaml` entry for the Rollup JS bundler's optional `@rollup/rollup-linux-riscv64-gnu`/`-musl` platform binaries -- a transitive JS build-tooling dependency, not a MediaPipe RISC-V port | Local clone, `git log -S riscv` |

**Key contributors with orgs:** None -- there is no riscv64 work to attribute.

**Is it fully upstream?** Not applicable; there is nothing upstream or downstream to compare. MediaPipe has never had riscv64 support in any form.

## 3. Upstream Support Tier

No formal supported-platform tier document (`Tier 1/2/3`, `SUPPORT.md`, `PLATFORMS.md`) exists in the repository [NEEDS VERIFICATION -- absence confirmed only by directory search, not an explicit statement]. Platform support is de facto whatever Google builds, tests, and ships internally: Android, iOS, Linux x86_64, and macOS/Windows for desktop demos.

| Architecture | Explicit Bazel build target | CI coverage | Official release binary |
|---|---|---|---|
| amd64 (x86_64) | Yes (`@platforms//cpu:x86_64` in `mediapipe_tasks_aar.bzl`; default desktop dev target) | Implicit (primary dev platform; no dedicated riscv-style CI job exists for any arch since the repo has only a stale-bot workflow) | PyPI `manylinux_2_17_x86_64`/`manylinux2014_x86_64` wheels |
| arm64 (aarch64) | Yes (`@platforms//cpu:arm64`; NDK cross-compile, `arm64-v8a` AAR target) | Android NDK build path | PyPI `manylinux_2_17_aarch64`/`manylinux2014_aarch64` wheels |
| riscv64 | **No** -- zero `select()` arms, zero Bazel platform/toolchain config anywhere in the repository | **None** -- the repository's only GitHub Actions workflow is a nightly stale-issue bot with no build/test logic | **None** -- no wheel, no GitHub release binary, no distro package |

Source: [`mediapipe/tasks/java/com/google/mediapipe/tasks/mediapipe_tasks_aar.bzl`](https://github.com/google-ai-edge/mediapipe) (via code search), [`.github/workflows/stale.yaml`](https://github.com/google-ai-edge/mediapipe/blob/master/.github/workflows/stale.yaml), [PyPI `mediapipe` JSON](https://pypi.org/pypi/mediapipe/json).

## 4. Technical Architecture and RISC-V-Specific Subsystems

MediaPipe's own C++ codebase contains a small number of hand-tuned architecture-specific fast paths, none of which extend to riscv64:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `FastInt64Round` (`mediapipe/framework/deps/mathutil.h`) | Hand-written SSE2 intrinsics fast path (`#elif defined __x86_64__`) | Included in the generic fast-path bucket (`__aarch64__`) alongside x86/ppc64 | Not included in any fast-path guard; falls to generic/portable code |
| Bit counting (`mediapipe/framework/formats/image_frame.cc`) | x86-specific `__builtin_popcount` gated on `__POPCNT__` | Falls to portable `#else` branch (generic loop) | Falls to the same portable `#else` branch as arm64 (compiles, unvalidated on riscv64) |
| AAR native library selection (`mediapipe_tasks_aar.bzl`) | Explicit `@platforms//cpu:x86_64` select arm | Explicit `@platforms//cpu:arm64` select arm | No select arm; would fall to `//conditions:default` (build-from-source fallback), untested and uncertified |
| `.bazelrc` / `platform_mappings` toolchain configs | `x86_64` dev configs | `android_arm64` (`--cpu=arm64-v8a`) | No `riscv64` or `android_riscv64` config exists |
| Preprocessor arch guards (`__riscv`) | N/A | N/A | **Zero occurrences anywhere in the repository** (confirmed by code search for `__riscv`) |

MediaPipe's inference workloads (the actual compute-heavy path) are delegated to **LiteRT** (TFLite) and **XNNPACK** as external dependencies, not vendored in-tree. XNNPACK has a genuine, actively developed RISC-V Vector (RVV) backend (see Section 9), but this is irrelevant to MediaPipe's own riscv64 status because MediaPipe cannot currently be built for riscv64 at all -- the blocking chain runs through LiteRT/TensorFlow, which has no riscv64 build target of any kind (Section 9).

No JIT compiler, garbage collector, or cryptographic primitive is implemented natively in MediaPipe's own source (crypto is delegated to BoringSSL via libcurl for networking paths).

**Conclusion:** MediaPipe defines architecture-specific build paths and hand-tuned intrinsics for exactly four targets -- armv7, arm64, x86_32, x86_64. riscv64 is absent from every one of these mechanisms: Bazel `select()` arms, `.bazelrc`/`platform_mappings` toolchain configs, CI, and source-level `#ifdef` guards. This is a **missing** implementation, not a stub -- no placeholder file, guard, or build target acknowledges the architecture anywhere in the repository.

## 5. Build System, Cross-Compilation, and Toolchain

MediaPipe's build system is Bazel-only (`WORKSPACE`, `MODULE.bazel`, `.bazelrc`, `BUILD.bazel` files throughout). **No `CMakeLists.txt` exists anywhere in the repository**, so there is no CMake-based riscv64 configure/build path to document.

- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` file exists.
- Actual build documentation (`docs/getting_started/install.md`, `docs/getting_started/building_examples.md`) covers only Linux x86_64/ARM (Debian/Ubuntu/CentOS), macOS, Windows, and Android/iOS/Coral -- no riscv64 section anywhere.
- No riscv64 Dockerfile exists. Dockerfiles present: `Dockerfile`, `Dockerfile.manylinux2014_aarch64rp4`, `Dockerfile.manylinux_2_28_x86_64`, plus Coral examples `Dockerfile.arm64`, `Dockerfile.amd64`, `Dockerfile.armhf` -- aarch64, x86_64, and armhf only.
- No `cmake/` or `toolchain*` directories, no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the tree.
- No QEMU usage of any kind is referenced in the repository, since no riscv64 CI or build path exists to run under emulation.

**There are no exact build commands, toolchain version requirements, or documented workarounds to report for riscv64** -- this is a hard, undocumented gap, confirmed by a direct repository clone and exhaustive grep (HEAD `c17b2a83e8944d2811889a2a08d629c20bcb6ed8`, checked 2026-09-07). Source: local clone at `/home/user/google/mediapipe`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildable from source | Yes (Bazel, primary dev target) | Yes (Bazel + Android NDK) | **No build path exists at all** |
| Python `pip install mediapipe` | Yes (`manylinux` wheels) | Yes (`manylinux_aarch64` wheels) | **No** |
| Prebuilt Android AAR | Yes (`x86_64` select arm) | Yes (`arm64-v8a` select arm) | **No** (would silently fall to `//conditions:default`, untested) |
| Desktop demo examples | Yes | Partial | **No** |
| Distro packaging (any distro, any suite) | N/A -- not distro-packaged at all | N/A -- not distro-packaged at all | N/A -- not distro-packaged at all (confirmed empty across all Ubuntu suites, checked "resolute"/26.04 and jammy/noble/questing plus -updates/-backports) |

**Functional gaps:** MediaPipe cannot be built, installed, or run on riscv64 today by any documented or undocumented means. This is a complete absence, not a partial or degraded feature set.

**Performance gaps:** Not applicable -- there is no functioning build to benchmark against amd64/arm64.

**Security hardening gaps:** Not directly assessable for MediaPipe's own code (no riscv64 build exists), but the dependency chain carries known gaps: BoringSSL has zero RISC-V assembly (all crypto falls to scalar C, no hardware-accelerated AES-GCM/SHA/ChaCha20 on riscv64), and OpenSSL (a libcurl dependency in some configurations) has open issues on constant-time AES/GHASH fallback without crypto extensions on riscv64 ([openssl#31080](https://github.com/openssl/openssl/issues/31080), [openssl#31082](https://github.com/openssl/openssl/issues/31082)).

**NaN / floating-point semantics issues:** No RISC-V-specific NaN or floating-point issue exists in MediaPipe's own issue tracker (confirmed by direct search for `riscv nan floating`, 0 direct hits).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by direct repository clone and file read, not inference:

- The entire `.github/workflows/` directory contains exactly one file: [`stale.yaml`](https://github.com/google-ai-edge/mediapipe/blob/master/.github/workflows/stale.yaml).
- Its trigger is `schedule: cron "30 1 * * *"` only -- not `push`, not `pull_request`, not `workflow_dispatch`.
- It runs on `runs-on: ubuntu-latest` (a standard GitHub-hosted x86_64 runner). No arm, riscv64, or self-hosted runner reference exists anywhere.
- Its single step (`uses: actions/stale@v7`) closes/labels inactive issues and PRs. It does not build, compile, or test source code, and contains zero occurrences of "riscv" anywhere in its content.
- No `.gitlab-ci.yml`, `Jenkinsfile*`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines*`, or `.circleci*` files exist anywhere in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | No dedicated CI job (only a stale-bot workflow exists for the whole repo) | No dedicated CI job | No dedicated CI job |
| CI runs tests | No | No | No |
| RISE runners referenced | No | No | No |
| Hardware used | N/A | N/A | N/A |

Because the repository's *only* workflow is unrelated to building or testing any architecture, riscv64 is not disadvantaged relative to amd64/arm64 in the CI system per se -- but this also means there is no CI-based signal of riscv64 buildability at all, positive or negative, for any part of the project.

## 8. Distribution and Release Status

**No official riscv64 binaries exist in any channel checked:**

- **GitHub Releases:** All recent releases (v1.0.0, v0.10.35, v0.10.33, v0.10.32, v0.10.26, v0.10.25, v0.10.24, v0.10.22, v0.10.21, v0.10.20) carry exactly 2 assets each -- `.zip` and `.tar.gz` **source archives only**. No platform-specific binaries exist for any architecture, not even x86_64, so riscv64's absence here is consistent with the project shipping no binary release assets at all via GitHub.
- **PyPI** ([`pypi.org/pypi/mediapipe/json`](https://pypi.org/pypi/mediapipe/json)): latest version 1.0.1. Wheel platform tags present: `macosx_11_0_universal2`, `macosx_11_0_x86_64`, `manylinux_2_17_aarch64`/`manylinux2014_aarch64`, `manylinux_2_17_x86_64`/`manylinux2014_x86_64`, `win_amd64`. No `riscv64` wheel across any of the 172 files checked spanning versions 0.10.5-1.0.1.
- **RISE wheel builder** ([`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mediapipe/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mediapipe/)): returns an HTTP 302 redirect to upstream PyPI, meaning RISE has **no MediaPipe package of its own**.
- **Ubuntu** (all suites, including 26.04 "resolute"): "Sorry, your search gave no results" -- MediaPipe is not packaged in Ubuntu/Debian archives at all, source or binary, for any architecture. This is a project-wide packaging gap, not a riscv64-specific one.
- **Arch Linux RISC-V port** ([`archriscv.felixc.at`](https://archriscv.felixc.at/?q=mediapipe)): fetch was inconclusive -- the page's package-search results table appears to be client-side rendered and did not surface in a static fetch. No positive signal found, but this channel could not be definitively ruled out. [NEEDS VERIFICATION]

**What a user must do to get a working binary today:** There is none available through any channel. A user would need to write riscv64 Bazel platform/toolchain configuration from scratch, resolve the entire upstream dependency blocking chain (Section 9), and build from source -- an undertaking with no existing documentation, precedent, or upstream support.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/notes |
|---|---|---|---|---|---|
| **Abseil-cpp** | Core C++ base library used by nearly every MediaPipe/TF module | Ubuntu 26.04 riscv64 package exists (`libabsl-dev 20260107.0-4`); builds from source, requires `-latomic` on GCC 11-12 | Two open SEGFAULTs on Debian riscv64 (hashtablez/cordz sampler), 7+ months unaddressed | Ubuntu 22.04+ ports, 25.10+ main archive, Debian sid | [abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) linker failure (open 12+ mo); [abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002) test SEGFAULT (open); CRC32C Zbc/Zbkc accel [abseil-cpp#1986](https://github.com/abseil/abseil-cpp/pull/1986) stalled on HW access |
| **XNNPACK** | CPU inference-kernel backend used by LiteRT/TFLite and directly by MediaPipe tasks | Ubuntu 26.04 riscv64 package exists but ~19 months stale (`libxnnpack-dev 0.0~git20241108.4ea82e5-2build1`, predates 2025-26 RVV work). Upstream has dedicated `cmake-linux-riscv64` CI, 200+ RVV kernel files | CI is QEMU-only; tests **not run on merge-to-master**; FP16/Zvfh CI currently broken (100+ failures) | No fresh binary; only stale distro snapshot | [XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886) 100+ RVV FP16 test failures (open, root cause: unconditional Zvfh dispatch bypassing missing `cpuinfo_has_riscv_zvfh()`); [XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650) cpuinfo syscall build error (open 3 yrs) |
| **cpuinfo** (pytorch/cpuinfo) | Runtime ISA/vendor detection consumed by XNNPACK for kernel dispatch | Ubuntu 26.04 riscv64 package exists (`libcpuinfo0 0.0~git20250905.877328f-1`); builds, QEMU CI only, build-only | No tests executed in any riscv64 CI job | Debian sid, Ubuntu noble/resolute (stale Sept-2025 snapshot) | [cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124) tracking issue open since 2022; completion PR [cpuinfo#397](https://github.com/pytorch/cpuinfo/pull/397) open/unreviewed since June 2026 -- root-cause dependency for XNNPACK#9886 |
| **BoringSSL** | TLS/crypto for MediaPipe's networking paths | Only the Android fork is packaged in Ubuntu 26.04 riscv64 (`android-libboringssl 14.0.0+r45-3`), not upstream BoringSSL; compiles via Android NDK cross-compile CI only | Compile-only CI (2 LUCI builders, both `run_unit_tests:false`) | No native Linux binary | Zero RISC-V assembly exists (0 of 23 amd64 / 15 arm64 asm files ported) -- all crypto runs scalar C fallback, no HW accel |
| **zlib** | DEFLATE compression | Ubuntu 26.04 riscv64 package exists (`zlib1g 1:1.3.dfsg+really1.3.1-1ubuntu3`); pure portable C, no functional gaps | CI is OpenBSD-only, not release-blocking | Ubuntu, Debian sid, Arch RISC-V, Alpine all current | Performance-only: unmerged RVV Adler32 PR [zlib#1099](https://github.com/madler/zlib/pull/1099) (8+ months, no maintainer response) |
| **LiteRT** (TFLite rebrand) | MediaPipe's on-device ML inference runtime (pinned v2.1.6) | **No riscv64 CMake preset, no Bazel `config_setting`, no toolchain, no CI job.** Zero RISC-V mentions in the repo | No CI, no QEMU harness | No PyPI wheel (231 wheels checked, zero riscv64); not in Ubuntu, Debian, or Arch RISC-V | No port exists at all; blocked transitively by cpuinfo/XNNPACK/Abseil chain plus TensorFlow compile failures |
| **libcurl** | HTTP(S) data-transfer | Ubuntu 26.04 riscv64 package exists (`libcurl4t64 8.18.0-1ubuntu2`); fully functional, no arch-specific code | Only an auxiliary `curl-for-win` cross-compile job tests riscv64; main test suite never runs on riscv64 | Debian sid (RC only), Ubuntu ports | No open riscv64 issues in curl itself; risk inherited from OpenSSL (see Section 6) |
| **TensorFlow / XLA** | Full ML framework pulled in transitively via LiteRT | Not in local report scope. Multiple open riscv64 compile failures | Not run on riscv64 in any TF CI | No riscv64 PyPI wheel | [tensorflow#75555](https://github.com/tensorflow/tensorflow/issues/75555) Bazel build fails on riscv64; [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940) open "can't compile on riscv"; [tensorflow#62241](https://github.com/tensorflow/tensorflow/issues/62241) soft-float linking issue |
| **OpenCV** (3.4.11 pinned in MediaPipe's WORKSPACE) | Image I/O, geometric transforms | Not in local report scope. Upstream OpenCV 4.x mainline has an active riscv-rvv HAL backend (PR [opencv#23246](https://github.com/opencv/opencv/pull/23246)); MediaPipe's pinned **3.4.11** predates this work entirely | Active 2026 GSoC RVV work targets OpenCV 4.x, not 3.4.11 | Ubuntu 26.04 riscv64 has `libopencv-dev 4.10.0+dfsg-7ubuntu5`, but MediaPipe builds 3.4.11 from source via Bazel, not the distro package | MediaPipe's pinned version cannot benefit from upstream OpenCV's riscv64/RVV work even if it built |
| **Ceres Solver** | Nonlinear least-squares solver (camera pose/geometric optimization), built on Eigen | Not in local report scope. No riscv64-specific issues found (no independent SIMD path) | No riscv64 CI observed | Ubuntu 26.04 riscv64 has `libceres-dev 2.2.0+dfsg-4.1ubuntu3` | Risk fully inherited from Eigen |
| **Eigen** | Linear algebra template library used by TF, Ceres, OpenCV | Ubuntu 26.04 riscv64 has `libeigen3-dev 3.4.0-5` (header-only, arch-independent build) but predates all RVV work; RVV backend merged to `master` Nov 2025, requires `-DEIGEN_RISCV64_USE_RVV10`, GCC-14/Clang-18 minimum | Native SpacemiT K3 CI exists but `allow_failure: true` on every riscv64 job (fixed June 2026) | **RVV support has not shipped in any versioned release** (3.4.0/3.4.1/5.0.x all predate the Nov 2025 merge) | [eigen#3086](https://gitlab.com/libeigen/eigen/-/issues/3086) masked-tail optimization missing for RVV; no vectorized transcendentals |
| **Halide** (v15.0.1) | JIT/AOT codegen for image-processing kernels | Upstream Halide has a RISC-V codegen backend (`CodeGen_RISCV.cpp`) and a community fork (YADRO-KNS/halide_riscv) demonstrated RVV 0.7 on a C906 CPU. But MediaPipe's WORKSPACE has **zero riscv64 `http_archive` entries** -- only x86-64/arm64 macOS/Windows/Linux binaries are wired up | Not applicable -- no MediaPipe-side integration | No riscv64 Halide release binary published by upstream Halide | This is a MediaPipe-specific build-integration gap, distinct from upstream Halide's RISC-V codegen maturity |

**Key cross-cutting finding -- the blocking chain:** MediaPipe's inference path runs LiteRT -> XNNPACK -> cpuinfo, and its native build depends on Abseil, BoringSSL, zlib, and Eigen/Ceres/OpenCV. None of these has a clean, current, fully-tested riscv64 story:

1. `pytorch/cpuinfo` lacks a released `cpuinfo_has_riscv_zvfh()` API surface for XNNPACK's use ([cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124), open since Dec 2022; fix [cpuinfo#397](https://github.com/pytorch/cpuinfo/pull/397) unreviewed).
2. This causes XNNPACK to unconditionally enable FP16/Zvfh dispatch, producing 100+ CI test failures ([XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886), open since April 2026).
3. Abseil-cpp has an open riscv64 shared-library linker failure ([abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702)) and a Debian-only SEGFAULT ([abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002)).
4. LiteRT/TensorFlow has **no riscv64 build target at all** in its own build system, with open compile failures ([tensorflow#75555](https://github.com/tensorflow/tensorflow/issues/75555), [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159)).

**Bright spots:** zlib, libcurl, and the base Abseil compilation path are functionally solid on riscv64 (pure scalar C, no correctness bugs). Eigen's RVV backend is real and actively maintained by Tenstorrent/SpacemiT with native CI hardware, but has not shipped in a release yet. XNNPACK's RISC-V investment is the deepest of any dependency reviewed (200+ kernel files) but is currently CI-red for FP16.

## 11. Known Bugs and Active Issues

**No riscv64-specific bugs or issues exist in MediaPipe's own tracker.** Confirmed by direct `search_issues` and `search_pull_requests` queries against `google-ai-edge/mediapipe` for `riscv64`, `riscv`, and `risc-v` (all returning `total_count: 0` for PRs; issue search returned only unrelated fuzzy-matched results):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issue or PR exists | N/A | N/A | Zero genuine riscv64 tracking items in the repository |
| [mediapipe#2324](https://github.com/google-ai-edge/mediapipe/issues/2324) | "Failing to build macos dylib" | Open/closed status not verified here | N/A | Contains one incidental `linux_riscv64` string inside a pasted Bazel build-error log (a `cpuinfo` `BUILD.bazel` `select()` condition list) -- not a RISC-V bug report; the issue's actual topic is macOS |

**Correctness bugs highlighted separately (in dependencies, not MediaPipe itself):** the Abseil-cpp hashtablez/cordz sampler SEGFAULT on Debian riscv64 ([abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002)) is the most severe correctness-adjacent issue in the dependency chain, though it does not originate in MediaPipe's own code.

## 12. Objections and Upstream Blockers

**Stated objections:** None specific to RISC-V exist, because no RISC-V port has ever been proposed. The general objection that applies to *any* new-platform port is `CONTRIBUTING.md`'s explicit restriction to bug-fix and documentation-fix PRs only -- a RISC-V port PR would be declined on policy grounds regardless of quality.

**Technical blockers:** The full dependency blocking chain in Section 9 -- no riscv64 build target in LiteRT/TensorFlow, unresolved cpuinfo/XNNPACK RVV dispatch bugs, and open Abseil-cpp linker/SEGFAULT issues -- means MediaPipe has no realistic riscv64 build path today even setting the governance question aside.

**Organizational blockers:** MediaPipe is a Google-internal project with a closed contribution model for new features/ports. Google's own RISE Premier membership has not been applied to MediaPipe. No RISE-funded work, no RISE CI/runner usage, and no dedicated MediaPipe repo exist under the `riseproject-dev` GitHub organization -- MediaPipe currently sits, unstarted, in an internal project-report backlog queue (`project-reports/.queue.yml`) [NEEDS VERIFICATION -- internal queue file, not a public source].

**Acceptance probability:** Low, for two independent reasons. First, the technical blocking chain requires fixes to be merged and released in at least four upstream dependencies (cpuinfo, XNNPACK, Abseil-cpp, TensorFlow) before MediaPipe itself could realistically build. Second, even if a working riscv64 port were produced by a third party, MediaPipe's `CONTRIBUTING.md` policy directs new-platform contributions to a separate fork rather than upstream merge, meaning full upstream acceptance is structurally unlikely regardless of technical readiness.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no distro packaging for MediaPipe in any suite or architecture)
- **Release provider:** none
- **Justification:** MediaPipe's only GitHub Actions workflow is a nightly stale-issue bot with zero build/test logic ([`.github/workflows/stale.yaml`](https://github.com/google-ai-edge/mediapipe/blob/master/.github/workflows/stale.yaml)); no riscv64 CI, Bazel build target, or toolchain configuration exists anywhere in the repository. No distribution packages MediaPipe at all, for any architecture (confirmed across every Ubuntu suite). No riscv64 PyPI wheel or GitHub release binary exists. Per the color model's explicit default rule, "no CI and no distro package" resolves to orange rather than grey, since this is a well-evidenced confirmed absence rather than an unknown-unknown, and rather than red, since there is no report of confirmed breakage (there is simply nothing to break -- no build has ever been attempted).
- **Optimization gap:** Not applicable. MediaPipe is a graph/pipeline application framework, not itself a SIMD/kernel/allocator/crypto optimization library; the Step 2 optimization-purpose modifier does not apply to it. (Its dependency XNNPACK, which does carry optimization-purpose characteristics, is graded separately in Section 9 and is currently irrelevant to MediaPipe's own riscv64 status since no build exists to exercise it.)
- **Pending work that could change the grade:** None identified. No open riscv64 PR, issue, or RISE-funded initiative targets MediaPipe specifically. The nearest adjacent RISE-ecosystem activity is unrelated (an IREE/MLIR object-detection pipeline optimization post on the RISE blog that explicitly does not involve MediaPipe: [riseproject.dev, 2026-07-07](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)). Any grade change would require, at minimum, resolution of the four-dependency blocking chain in Section 9 followed by a deliberate MediaPipe-side Bazel platform/toolchain addition -- none of which is currently in progress upstream.

## 14. Investment Analysis

RISE has not funded or performed any MediaPipe-specific work (Section 12); all sizing below is therefore full incremental effort, not a delta against existing RISE work.

### 14.1 Functional Enablement

The dependency blocking chain must be resolved before MediaPipe itself can be addressed:
1. Land and release `cpuinfo_has_riscv_zvfh()` (or an equivalent capability query) from the open [cpuinfo#397](https://github.com/pytorch/cpuinfo/pull/397).
2. Fix XNNPACK's unconditional Zvfh dispatch bypass ([XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886)) once cpuinfo exposes the needed check.
3. Resolve the Abseil-cpp riscv64 linker failure ([abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702)) and SEGFAULT ([abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002)).
4. Add a riscv64 build target to TensorFlow/LiteRT (no CMake preset or Bazel `config_setting` exists today; multiple open compile failures: [tensorflow#75555](https://github.com/tensorflow/tensorflow/issues/75555), [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159)).
5. Only then add MediaPipe's own Bazel `select()` arms (`@platforms//cpu:riscv64`), `.bazelrc`/`platform_mappings` entries, and a riscv64 Halide `http_archive` fetch (Section 9).

Given the closed contribution model (Section 12), this work would likely need to be maintained as a third-party fork rather than merged upstream, adding ongoing maintenance burden on top of the initial port.

### 14.2 Performance Optimization

Not meaningfully assessable until functional enablement (14.1) is complete -- there is no riscv64 build to benchmark or optimize. Once buildable, Eigen's unshipped RVV backend and XNNPACK's partially-broken RVV/Zvfh kernels would need to be validated end-to-end through MediaPipe's actual inference graphs, which has never been done (Section on benchmark data: no MediaPipe-specific riscv64 benchmark exists anywhere; the closest data point is XNNPACK microbenchmarks on unrelated hardware, e.g. SiFive's ~45x scalar-to-RVV speedup claim for XNNPACK end-to-end models on a SiFive Intelligence X390, [SiFive blog](https://www.sifive.com/blog/sifive-accelerates-risc-v-vector-integration-in-xnnpack-for-optimized-ai-inference) -- not a MediaPipe measurement).

### 14.3 CI/CD Infrastructure

MediaPipe has no CI infrastructure for any architecture beyond a stale-issue bot, so establishing riscv64 CI would mean building a build/test pipeline essentially from scratch (something the project has never had for amd64 or arm64 either, based on repository evidence) -- a materially larger undertaking than adding a riscv64 job to an existing amd64/arm64 CI matrix.

### 14.4 Ecosystem Enablement

Not applicable -- Section 10 is omitted per instructions, as MediaPipe does not have a significant dependent package ecosystem (npm/PyPI packages, plugins, or extensions that themselves require riscv64 enablement) built on top of it in the sense the report format targets; MediaPipe itself is the leaf consumer of its own dependency chain (Section 9).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land cpuinfo riscv64 Zvfh capability API ([cpuinfo#397](https://github.com/pytorch/cpuinfo/pull/397)) | 1-2 (review/land existing PR) | cpuinfo maintainers / RISE | Critical |
| Functional | Fix XNNPACK Zvfh dispatch bypass and restore green riscv64 CI ([XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886)) | 3-5 | XNNPACK maintainers / RISE | Critical |
| Functional | Fix Abseil-cpp riscv64 linker failure and SEGFAULT ([abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702), [#2002](https://github.com/abseil/abseil-cpp/issues/2002)) | 2-4 | Abseil maintainers / RISE | Critical |
| Functional | Add riscv64 build target to TensorFlow/LiteRT (no existing CMake preset or Bazel config) | 8-16 | TensorFlow maintainers / RISE, large scope | Critical |
| Functional | Add MediaPipe-side Bazel `select()` arms, toolchain config, riscv64 Halide fetch | 3-6 | MediaPipe fork maintainer (unlikely to be accepted upstream, Section 12) | High |
| Performance | Validate/tune Eigen RVV and XNNPACK RVV kernels through actual MediaPipe inference graphs once buildable | 4-8 | RISE / interested silicon vendor | Medium |
| CI/CD | Stand up riscv64 build+test CI (no existing CI matrix to extend from) | 3-6 | RISE runner infrastructure | Medium |
| Ecosystem | Not applicable (Section 10 omitted) | - | - | - |

## 15. Updates

(No updates yet -- initial report dated 2026-09-07.)

## 16. References

- [google-ai-edge/mediapipe repository](https://github.com/google-ai-edge/mediapipe)
- [MediaPipe homepage / mediapipe.dev](https://mediapipe.dev/)
- [`.github/workflows/stale.yaml`](https://github.com/google-ai-edge/mediapipe/blob/master/.github/workflows/stale.yaml)
- [MediaPipe issue search, "risc-v" query, 0 results](https://github.com/google-ai-edge/mediapipe/issues)
- [MediaPipe issue #2324, "Failing to build macos dylib"](https://github.com/google-ai-edge/mediapipe/issues/2324)
- [MediaPipe issue #5625, ARM64/aarch64 cross-compile failure](https://github.com/google-ai-edge/mediapipe/issues/5625)
- [MediaPipe issue #6250, Windows ARM64 support request](https://github.com/google-ai-edge/mediapipe/issues/6250)
- [MediaPipe issue #4581, "No aarch64 support" (closed)](https://github.com/google-ai-edge/mediapipe/issues/4581)
- [MediaPipe issue #5977, Windows XNNPACK build error](https://github.com/google-ai-edge/mediapipe/issues/5977)
- [MediaPipe issue #5468, closed LLM benchmark feature request](https://github.com/google-ai-edge/mediapipe/issues/5468)
- [PyPI `mediapipe` package JSON](https://pypi.org/pypi/mediapipe/json)
- [PyPI `mediapipe` simple index](https://pypi.org/simple/mediapipe/)
- [RISE Project GitLab PyPI wheel index for mediapipe (redirects to upstream PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mediapipe/)
- [Ubuntu package search, "MediaPipe", suite resolute -- no results](https://packages.ubuntu.com/search?keywords=MediaPipe&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search for mediapipe (inconclusive)](https://archriscv.felixc.at/?q=mediapipe)
- [dkurt/hair_segmentation, third-party MediaPipe-derived model run on RISC-V](https://github.com/dkurt/hair_segmentation)
- [homuler/MediaPipeUnityPlugin, third-party Unity plugin](https://github.com/homuler/MediaPipeUnityPlugin)
- [PINTO0309/mediapipe-bin, aarch64-only third-party wheel builds](https://github.com/PINTO0309/mediapipe-bin)
- [RISE Project members page](https://riseproject.dev/)
- [RISE Project blog post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Project blog, "Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V" (unrelated to MediaPipe)](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [RISE Project Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Abseil-cpp issue #1702, riscv64 linker failure](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #2002, riscv64 test SEGFAULT](https://github.com/abseil/abseil-cpp/issues/2002)
- [Abseil-cpp PR #1986, CRC32C Zbc/Zbkc hardware acceleration](https://github.com/abseil/abseil-cpp/pull/1986)
- [XNNPACK issue #9886, 100+ RVV FP16 test failures](https://github.com/google/XNNPACK/issues/9886)
- [XNNPACK issue #4650, cpuinfo syscall build error](https://github.com/google/XNNPACK/issues/4650)
- [pytorch/cpuinfo issue #124, riscv64 tracking issue](https://github.com/pytorch/cpuinfo/issues/124)
- [pytorch/cpuinfo PR #397, comprehensive riscv64 completion](https://github.com/pytorch/cpuinfo/pull/397)
- [zlib PR #1099, unmerged RVV Adler32](https://github.com/madler/zlib/pull/1099)
- [OpenSSL issue #31080, constant-time AES/GHASH fallback on riscv64](https://github.com/openssl/openssl/issues/31080)
- [OpenSSL issue #31082, related GHASH constant-time issue](https://github.com/openssl/openssl/issues/31082)
- [TensorFlow issue #75555, Bazel build fails on riscv64](https://github.com/tensorflow/tensorflow/issues/75555)
- [TensorFlow issue #102159, cannot compile on riscv](https://github.com/tensorflow/tensorflow/issues/102159)
- [TensorFlow issue #100940, cannot compile on riscv](https://github.com/tensorflow/tensorflow/issues/100940)
- [TensorFlow issue #62241, soft-float/double-float linking issue on riscv64](https://github.com/tensorflow/tensorflow/issues/62241)
- [TensorFlow PR #32812, closed XLA riscv64 codegen attempt](https://github.com/tensorflow/tensorflow/pull/32812)
- [OpenCV PR #23246, universal-intrinsics RVV support](https://github.com/opencv/opencv/pull/23246)
- [Eigen issue #3086, masked-tail optimization missing for RVV](https://gitlab.com/libeigen/eigen/-/issues/3086)
- [YADRO-KNS/halide_riscv, community RISC-V Halide fork](https://github.com/YADRO-KNS/halide_riscv)
- [SiFive blog, "SiFive Accelerates RISC-V Vector Integration in XNNPACK for Optimized AI Inference"](https://www.sifive.com/blog/sifive-accelerates-risc-v-vector-integration-in-xnnpack-for-optimized-ai-inference)
- Local clone used for source-level verification: `/home/user/google/mediapipe` (shallow clone, HEAD `c17b2a83e8944d2811889a2a08d629c20bcb6ed8`)
