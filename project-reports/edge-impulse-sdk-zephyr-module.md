---
title: Edge Impulse SDK Zephyr Module
parent: Project Reports
color: orange
dependencies:
  - name: TensorFlow Lite Micro (TFLM)
    relation: build-dependency
    criticality: critical
  - name: ruy
    relation: build-dependency
    criticality: critical
  - name: gemmlowp
    relation: build-dependency
    criticality: optional
  - name: FlatBuffers
    relation: build-dependency
    criticality: critical
  - name: kissfft
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="edge-impulse-sdk-zephyr-module" %}

# Edge Impulse SDK Zephyr Module

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse SDK Zephyr Module<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

The [Edge Impulse SDK Zephyr Module](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr) is a Zephyr RTOS "west module" that wraps a vendored, in-tree source drop of Edge Impulse's C++ inferencing SDK, including a stripped copy of TensorFlow Lite Micro (TFLM) and its own third-party dependencies (CMSIS, ruy, gemmlowp, FlatBuffers, kissfft), so a Zephyr application can link a trained Edge Impulse model into firmware via `west build`. It is source-only: there is no build-time package resolution, everything ships in-repo, and the consuming application compiles it as part of its own Zephyr build.

The repository was created 2025-07-25 and carries 12 stars / 4 forks, C language, `edge-ai`/`zephyr` topics, and is licensed Clear BSD (3-clause), copyright held solely by EdgeImpulse Inc. (`LICENSE.3-clause-bsd-clear`).

**Governance:** none. There is no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/`, or `.github/` directory of any kind in the repository. No foundation governs the project; it is not a RISE member or RISE-tracked project (confirmed: Edge Impulse does not appear on RISE's [member list](https://riseproject.dev) or [blog](https://riseproject.dev/blog)).

**Corporate sponsors / maintainers:** effectively one company. Of 116 commits on the default branch, 105 are mechanical "SDK version" bumps by the bot `edgeimpulse-firmware-uploader[bot]`, and every identifiable human author (francovaro, Francesco, Eoin Jordan) uses an Edge Impulse email address or personal address tied to Edge Impulse staff. No other corporate co-maintainer was found. [NEEDS VERIFICATION: whether Qualcomm, which acquired Edge Impulse in 2025, has begun contributing under a Qualcomm identity - not found in the commit history examined, and no live source could confirm the acquisition itself from this session.]

**Community stance on new ports:** undocumented. There is no `CONTRIBUTING.md` and no in-repo or linked-docs statement on architecture support policy or a process for adding a new port.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-07-25 | Repository created | [github.com/edgeimpulse/edge-impulse-sdk-zephyr](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr) |
| 2025-10-31 | PR #1 merged: "Kconfig: add CONFIG_EDGE_IMPULSE_SDK to include the SDK in the build" (author szczys) - unrelated to RISC-V, gates the module behind a Kconfig symbol | [PR #1](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr/pull/1) |
| N/A | No RISC-V-related commit, issue, or PR exists at any point in the repository's 116-commit history | `git log --all -i --grep="riscv" --grep="risc-v"` returned zero matches |

**There is no riscv64 port history to report.** A full-history search (`git log --all -i --grep`) across all 116 commits, combined with `mcp__github__search_issues` and `mcp__github__search_pull_requests` queries for `riscv`, `riscv64`, and `risc-v` scoped to this repository, returned zero results in every case. The repository currently has zero open or closed issues in total and exactly one PR (#1, unrelated to RISC-V). No RISC-V port was ever attempted, started, or abandoned in this repository - it simply was never a distinguished code path. Key contributors and their affiliations are listed in Section 1; none are tied to a RISC-V port effort because none exists.

Is it fully upstream? Not applicable - there is no separate "riscv64 port" that could be upstream or out-of-tree. The generic (non-ESP32, non-ARM) code path that a riscv64 board would use is simply the module's ordinary portable C/C++ path, present since the repository's initial commit.

## 3. Upstream Support Tier

No formal tier policy exists anywhere in this repository or its linked documentation (`https://docs.edgeimpulse.com/hardware/deployments/run-zephyr-module` - the correct doc URL; the URL given in this report's header, `https://docs.edgeimpulse.com/docs/run-inference/cpp-library/deploy-your-model-as-a-zephyr-module`, returns 404). The linked doc is a purely mechanical West-module deployment guide with no governance, license discussion, or architecture-tier language.

Evidence-based comparison, derived from the module's own build-system branching (`edge-impulse-sdk/cmake/zephyr/CMakeLists.txt`) and the CI/release findings in Sections 7-8:

| Architecture | Upstream CI | Hand-tuned acceleration | Official binary/release | Support status |
|---|---|---|---|---|
| arm (Cortex-M, `ARCH STREQUAL "arm"` branch) | none (no CI in repo at all) | CMSIS-NN / CMSIS-DSP (hand-tuned SIMD/fixed-point) | none (no repo releases) | First-class code path, explicitly branched |
| Xtensa (`BOARD MATCHES "esp32"` branch) | none (no CI in repo at all) | ESP-NN assembly, esp-dsp | none (no repo releases) | First-class code path, explicitly branched |
| riscv64 (generic Zephyr board) | none (no CI in repo at all) | none - falls into the unlabeled `else()` branch, generic portable C/C++ only | none (no repo releases) | Not distinguished as a code path; inherits the generic fallback |
| amd64 | none (no CI in repo at all) | none - same generic `else()` fallback as riscv64 | none (no repo releases) | Not distinguished as a code path; inherits the generic fallback |

No architecture, including arm and Xtensa, has upstream CI or official release artifacts - this repository has no CI system and has never cut a GitHub release (`https://github.com/edgeimpulse/edge-impulse-sdk-zephyr/releases` shows "There aren't any releases here."). riscv64 is not singled out for worse treatment than amd64; it simply receives no dedicated optimization work, identically to amd64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The module itself contains no JIT, no crypto, and no GC. Its architecture-specific surface is limited to SIMD/DSP/NN acceleration inherited from vendored dependencies (CMSIS, ESP-NN, esp-dsp) plus TFLM's own reference/optimized kernel split.

Repo-wide file counts by architecture guard (verified by cloning the repo at commit `2af9742` and grepping the full tree, cross-checked against `mcp__github__search_code`):

| Component | riscv64 | arm64/Cortex-M | amd64 |
|---|---|---|---|
| Zephyr OS porting layer (`edge-impulse-sdk/porting/zephyr/*.cpp`: malloc, timing, printf) | scalar (identical portable C++ across all architectures) | scalar (same code) | scalar (same code) |
| CMSIS-DSP (Cortex-M fixed-point/SIMD) | missing | full (hand-tuned, ARM-exclusive) | missing |
| NEON-accelerated CMSIS-DSP kernels (84 of 574 files) | missing | full (hand-tuned) | missing |
| CMSIS-NN (ARM NN op acceleration) | missing | full (hand-tuned, ARM-exclusive) | missing |
| gemmlowp quantized GEMM | scalar - RISC-V is not even a recognized platform in `third_party/gemmlowp/internal/detect_platform.h`, which enumerates ARM32/64+NEON, MIPS32/64+MSA, and x86 32/64+SSE3/SSE4/AVX2 but no RISC-V entry at all, not even an `#else` stub | partial (NEON path) | partial (SSE/AVX2 path) |
| TFLite Micro op kernels | scalar (reference C) | scalar reference, with CMSIS-NN offloading what it can | scalar reference |
| ESP-DSP RISC-V header guard (`dsp_common.h`, `dsp_platform.h`) | 2-line `#if defined(__XTENSA__) \|\| defined(__riscv)` preprocessor guard selecting an ESP-IDF cycle-counter header/symbol name for ESP32-C3/C6 - no compute code, not applicable to a generic riscv64 Zephyr board | n/a (Xtensa side of the same guard) | n/a |

Repo-wide arch-token counts: `__aarch64__`/NEON appears in 6 files (hand-tuned NEON SIMD intrinsics: dot-product, Cholesky, MSE, f64 accumulate in CMSIS-DSP kernels); `__x86_64__`/SSE/AVX appears in 4 files (vendored library platform-detection tables only - no x86 SIMD DSP/NN kernels exist in this SDK at all); `__riscv` appears in exactly 2 files, both `#include`-selection guards, zero compute or vector code. No `rvv`, `riscv_vector`, `__riscv_v`, or `CONFIG_RISCV` string exists anywhere in the repository (0 hits via full clone + grep, not sampling).

**Conclusion:** riscv64 was never carved out as its own component - it rides the same architecture-agnostic scalar/reference fallback that amd64 and any non-Cortex-M/non-NEON target uses throughout this SDK. The only architecture receiving genuine hand-tuned acceleration is ARM (CMSIS-DSP/CMSIS-NN for Cortex-M, NEON for Cortex-A/aarch64). This is consistent with the total absence of riscv64 issues/PRs/commits documented in Section 2.

## 5. Build System, Cross-Compilation, and Toolchain

There is no riscv64-specific build documentation, toolchain file, Dockerfile, CI config, or QEMU usage anywhere in this repository (verified directly by cloning and inspecting the full tree at commit `2af9742`).

- `README.md` covers only adding the module via a `west.yml`/manifest import - no build/toolchain content.
- `BUILDING.md`, `INSTALL`, `INSTALL.md`, `docs/building.md`, `docs/cross-compilation.md`, `CONTRIBUTING.md`: none exist.
- Root `CMakeLists.txt` (243 bytes): gates on `CONFIG_EDGE_IMPULSE_SDK` and includes `edge-impulse-sdk/cmake/utils.cmake` plus `edge-impulse-sdk/cmake/zephyr/`. No riscv references, no `-DUSE_X=OFF`-style feature flags of any kind.
- `edge-impulse-sdk/cmake/zephyr/CMakeLists.txt` is the actual source-selection logic. It branches only on `BOARD MATCHES "esp32"` (pulls in Espressif esp-dsp/ESP-NN) and `ARCH STREQUAL "arm"` (CMSIS-DSP/CMSIS-NN, `EI_CLASSIFIER_TFLITE_ENABLE_CMSIS_NN=1`). Any generic riscv64 board (QEMU riscv64, SiFive, etc.) falls into the unlabeled `else()` branch: generic `porting/zephyr/*.cpp` sources only, no CMSIS, no special compile definitions.
- `.github/`, `.ci/`, `docker/`, any `Dockerfile*`: none exist. A targeted `mcp__github__search_code` for `filename:Dockerfile repo:edgeimpulse/edge-impulse-sdk-zephyr riscv64` returned zero results.
- No arch gating exists in `Kconfig`, `zephyr/module.yml`, or `CMakeLists.txt` - a grep for `riscv`/`aarch64`/`x86`/`arm` in these files returned zero matches beyond the two branches noted above.
- `cmake_minimum_required(VERSION 3.20.0)` (root, `zephyr/CMakeLists.txt`) / `3.20.10` (sample) is the only version constraint present in the repo. No GCC/Clang minimum version is stated or enforced for any architecture. Toolchain selection is entirely delegated to the parent Zephyr build (Zephyr SDK / `west`), which this module does not override or document.

**Build failures:** none documented, because no CI has ever attempted a riscv64 build of this module to fail. No known-build-failure reports exist for any architecture (zero issues in the repo).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | arm (Cortex-M) | Xtensa (ESP32) | riscv64 | amd64 |
|---|---|---|---|---|
| Inference execution (TFLM interpreter) | yes | yes | yes (scalar reference kernels) | yes (scalar reference kernels) |
| Hand-tuned NN kernel acceleration | yes (CMSIS-NN) | yes (ESP-NN assembly) | no | no |
| Hand-tuned DSP/feature-extraction acceleration | yes (CMSIS-DSP, incl. NEON on Cortex-A) | yes (esp-dsp) | no | no |
| Dedicated architecture branch in build system | yes (`ARCH STREQUAL "arm"`) | yes (`BOARD MATCHES "esp32"`) | no (falls to generic `else()`) | no (falls to generic `else()`) |
| Official prebuilt binary | no (no releases exist for any arch) | no | no | no |

**Functional gaps:** none identified - the module compiles and runs the same TFLM reference-kernel inference path on riscv64 as it does on amd64 or a non-CMSIS-NN ARM target. There is no operation that riscv64 categorically cannot perform.

**Performance gaps:** riscv64 (like amd64) has zero hand-tuned kernel acceleration in this SDK, versus full CMSIS-NN/CMSIS-DSP hand-tuning on Cortex-M and NEON on Cortex-A. Per the dependency analysis in Section 9, TFLM's own reference-vs-optimized-kernel gap means inference on the scalar path can be substantially slower than the CMSIS-NN-optimized ARM Cortex-M path; no vendor-published multiplier specific to this SDK on riscv64 was found, so no numeric factor is reported here [NEEDS VERIFICATION - no riscv64-specific benchmark exists to cite].

**Security hardening gaps:** not assessed by any source found - no security-focused documentation or hardening comparison for this module exists on any architecture.

**NaN / floating-point semantics issues:** none found. A full-repo issue/PR/commit search on `edgeimpulse/edge-impulse-sdk-zephyr` for riscv64-related NaN or floating-point bugs returned zero results, consistent with the repo having zero issues in total. (Note: the dependency TFLM itself has an open, unresolved float-precision bug, [tflite-micro #3271](https://github.com/tensorflow/tflite-micro/issues/3271) ("Fouble" bug), which affects all architectures including riscv64 - see Section 9.)

## 7. CI/CD Infrastructure

**No riscv64 CI exists - and no CI of any kind exists for this repository, for any architecture.** Verified by direct inspection of the repository file tree at commit `2af974221d72b3dc512ec0038478e38fb8c01c3f`:

```
drwxr-xr-x 7 root root 4096 .
drwxr-xr-x 5 root root 4096 ..
drwxr-xr-x 8 root root 4096 .git
-rw-r--r-- 1 root root   10 .gitignore
-rw-r--r-- 1 root root  243 CMakeLists.txt
-rw-r--r-- 1 root root  322 Kconfig
-rw-r--r-- 1 root root 1687 LICENSE.3-clause-bsd-clear
-rw-r--r-- 1 root root 1235 README.md
drwxr-xr-x 9 root root 4096 edge-impulse-sdk
drwxr-xr-x 3 root root 4096 samples
drwxr-xr-x 2 root root 4096 west
drwxr-xr-x 2 root root 4096 zephyr
```

No `.github` directory exists at all, and there is no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or CircleCI config. Every YAML file in the repository (5 total) was read in full and none is a CI configuration: `west/west-commands.yml` (west CLI command registration), `edge-impulse-sdk/porting/espressif/ESP-NN/idf_component.yml` (ESP-IDF component manifest for a vendored dependency), `zephyr/module.yml` (Zephyr module build declaration), `samples/example-standalone-inferencing/west.yml` (west manifest), and `samples/example-standalone-inferencing/sample.yaml` (Twister sample metadata with no `platform_allow`/`arch` filter and, critically, not consumed by any workflow since none exists).

No RISE runner usage was found (no reference to `riseproject-dev` or a RISE runner label anywhere in the repo, consistent with Section 2 of the RISE-involvement findings).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | no (no CI exists) | no (no CI exists) | no (no CI exists) |
| CI runs tests | no | no | no |
| CI publishes release | no | no | no |
| Hardware/runner used | n/a | n/a | n/a |

## 8. Distribution and Release Status

No official binaries exist for riscv64 - or for any architecture - through any channel checked:

- **GitHub Releases:** `https://github.com/edgeimpulse/edge-impulse-sdk-zephyr/releases` shows "There aren't any releases here." Zero releases, zero assets, any architecture.
- **PyPI:** `https://pypi.org/pypi/edge-impulse-sdk-zephyr-module/json` returns HTTP 404 - the package does not exist under this name.
- **RISE wheel builder (GitLab PyPI mirror):** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-sdk-zephyr-module/` redirects to the same PyPI 404.
- **Ubuntu 26.04 (Resolute):** project-graph SPARQL query against `deb:BinaryPackage`/`core:targetArchitecture = riscv64`/`deb:inSuite = "resolute"` for plausible package names returned zero bindings; live `packages.ubuntu.com` search also returned no results.
- **Arch Linux RISC-V port:** `https://archriscv.felixc.at/?q=edge%20impulse%20sdk%20zephyr%20module` shows no matching package.

**What a user must do to get a working binary:** there is no binary to obtain. A user must vendor this repository as a Zephyr west module (via `west.yml` manifest import, per the repo's own README) and build it themselves from source as part of their own Zephyr application, on whatever architecture their board targets, including riscv64. This is true identically for amd64 and arm - the module has never published a binary artifact for any target.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| [TensorFlow Lite Micro](https://github.com/tensorflow/tflite-micro) | Core inference engine/interpreter | No - riscv64 is not a recognized upstream target (only Tier-2 `riscv32_generic`, reference kernels only); an unmerged community fork (`cordawyn/tflite-micro`, branch `riscv64-generic`, 186 commits behind, never PR'd) exists | No upstream CI (only riscv32 nightly QEMU) | No official binary for any arch except an x86_64 PyPI wheel of full TFLite (not TFLM) | [tflite-micro #3107](https://github.com/tensorflow/tflite-micro/issues/3107) riscv64 support request closed stale (Feb 2026, zero maintainer engagement); [#3252](https://github.com/tensorflow/tflite-micro/issues/3252) double-rounding quantization bug (open, affects all archs incl. riscv64); [#3271](https://github.com/tensorflow/tflite-micro/issues/3271) float-precision bug (open); [PR #3280](https://github.com/tensorflow/tflite-micro/pull/3280) RVV kernels, targets riscv32 only, unreviewed since Jan 2026 |
| [ruy](https://github.com/google/ruy) | Matrix-multiply backend TFLM selects at runtime | Yes - scalar `kStandardCpp` fallback only, no RISC-V-specific code | No upstream CI for any arch; Debian/Ubuntu build-validated only | No upstream binary releases (source-only); Ubuntu ships riscv64 `libruy-dev` | Zero riscv-tagged issues in `google/ruy`. Transitive: [cpuinfo #397](https://github.com/pytorch/cpuinfo/issues/397) ISA-detection incomplete on riscv64 (blocks future RVV dispatch); [googletest #3756](https://github.com/google/googletest/issues/3756) thread-count test fails on riscv64 (test-only, non-blocking) |
| [gemmlowp](https://github.com/google/gemmlowp) | Legacy low-precision (int8) matmul fallback, maintenance mode | Yes - scalar fallback, no RISC-V branch in `detect_platform.h`, but generic path compiles cleanly | No riscv64 CI | Ubuntu ships riscv64 `libgemmlowp-dev` | Zero riscv-tagged issues found |
| [FlatBuffers](https://github.com/google/flatbuffers) | On-device model container / serialization | Yes - architecture-agnostic, no SIMD/JIT/asm | Passes (Debian buildd `rv-osuosl-02`); no dedicated upstream riscv64 CI job | No prebuilt `flatc` riscv64 binary in upstream GitHub releases; Debian sid / Arch RISC-V / Ubuntu packages available | None blocking. Latent (unfiled) risk: `ReadScalar` in `base.h` suppresses UBSan on an unaligned cast rather than using `memcpy` - a hardening item, not a confirmed bug |
| [kissfft](https://github.com/mborgerding/kissfft) | FFT kernels for MFCC/spectral DSP features | Yes - pure portable C, no SIMD | Passes; zero riscv-tagged issues | Ubuntu ships riscv64 package | None found |
| CMSIS-NN / CMSIS-DSP / CMSIS-Core ([ARM-software](https://github.com/ARM-software)) | ARM Cortex-M hand-tuned SIMD NN/DSP kernels | Not applicable - ARM-exclusive intrinsics/assembly; on riscv64, TFLM silently falls back to portable reference C kernels instead | n/a | n/a | Zero riscv-tagged issues (expected, out of scope by design) |
| arc_mli_package (Synopsys ARC MLI, vendored binary) | ARC EM/HS/VPX accelerator NN kernels | Not applicable - Synopsys ARC-exclusive, excluded from non-ARC builds | n/a | n/a | Irrelevant to riscv64 by architecture |

**Deep-dive - the critical blocker:** every dependency with an actual open-source/Debian packaging path (ruy, gemmlowp, FlatBuffers, kissfft) is present in Ubuntu 26.04 riscv64 and builds/runs correctly there via scalar/portable fallback - no correctness blockers among them. The real gap is that **TensorFlow Lite Micro itself has no riscv64 target upstream at all** (only riscv32 Tier-2), which is the actual functional blocker for a riscv64 Zephyr build of this SDK, compounded by zero RVV-optimized kernel paths anywhere in the stack (ruy, gemmlowp, and TFLM reference kernels are all scalar-only on RISC-V).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue or PR exists in this repository | N/A | N/A | Repository has zero issues (open or closed) in total and exactly one PR ([PR #1](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr/pull/1), unrelated to RISC-V), confirmed via `search_issues`/`search_pull_requests` with zero and unfiltered queries alike |
| [tflite-micro #3107](https://github.com/tensorflow/tflite-micro/issues/3107) | riscv64 support request | Closed stale (Feb 2026) | High (blocks functional riscv64 target) | Zero maintainer engagement; dependency-level, not this repo's own tracker |
| [tflite-micro #3252](https://github.com/tensorflow/tflite-micro/issues/3252) | Double-rounding quantization bug | Open | Correctness | Affects all architectures including riscv64; dependency-level |
| [tflite-micro #3271](https://github.com/tensorflow/tflite-micro/issues/3271) | Float-precision ("Fouble") bug | Open | Correctness | Affects all architectures including riscv64; dependency-level |
| [tflite-micro PR #3280](https://github.com/tensorflow/tflite-micro/pull/3280) | RVV kernels | Open, unreviewed since Jan 2026 | N/A | Targets riscv32 only, not riscv64; dependency-level |

**Correctness bugs specific to this repository on riscv64:** none exist to report - there is no tracked issue of any kind against `edge-impulse-sdk-zephyr`. The correctness-relevant bugs above belong to the vendored TFLM dependency and are inherited transitively, not filed against this repository.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer, issue, or PR in this repository states an objection to riscv64 support, because no one has ever proposed it.

**Technical blockers:**
- TensorFlow Lite Micro (the core inference engine this SDK vendors) has no riscv64 target upstream at all - see [tflite-micro #3107](https://github.com/tensorflow/tflite-micro/issues/3107) - which is the primary technical blocker to a functionally complete riscv64 build, independent of this repository's own (nonexistent) CI gap.
- No CI infrastructure of any kind exists in this repository to validate a riscv64 build even if one were attempted.

**Organizational blockers:**
- Single-vendor repository (Edge Impulse Inc.) with no documented external contribution process, no CONTRIBUTING.md, and no architecture-tier policy.
- No RISE involvement of any kind has been found to date (Section 1), so there is no funded external effort currently pushing a riscv64 port.

**Acceptance probability:** cannot be assessed from available evidence - there is no historical pattern of architecture-port PRs in this repository to gauge maintainer receptiveness (only one PR exists total, and it is a build-system Kconfig change, not a new-architecture port). [NEEDS VERIFICATION: Edge Impulse's general stance on community contributions, not documented in any source examined.]

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Optimization gap:** N/A - this project's own value proposition is deployment/porting tooling for edge ML models, not itself a hand-tuned kernel library; the optimization-purpose modifier is not applied to this repository. (Its dependency, TensorFlow Lite Micro, is separately graded in `project-reports/tensorflow-lite-micro-(tflm).md` as orange, with an absent riscv64-specific optimization path - ruy, gemmlowp, and TFLM reference kernels are all scalar-only on RISC-V per Section 9 above.)

**Justification:** No upstream CI exists in this repository at all - confirmed by direct inspection of the file tree, which has no `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` (Section 7) - so Step 1's CI-based grade defaults toward "no upstream CI." No Linux distribution (Ubuntu 26.04 Resolute, Debian, Arch RISC-V) ships a riscv64 package for this module and it is not on PyPI, so the distribution floor that could raise it to yellow does not apply; there is simply no distro package to float on (Section 8). This places the project at orange: no upstream CI, no distro package, no release of any kind by any provider, but no confirmed breakage either (the generic build path compiles the same portable code on riscv64 as it does on amd64, per Section 5-6) - which rules out red. See [github.com/edgeimpulse/edge-impulse-sdk-zephyr](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr) (repository root, no CI/no releases) as the primary source.

**Pending work that could change the grade:** none identified. No open PR, no open issue, and no RISE blog post or RISE working-group repository references this project (Section "RISE Project (riseproject.dev) membership check" in the research findings). Nothing currently in flight would move this project off orange; a grade change would require either (a) upstream adding CI plus a working generic-board build/test job, or (b) a distribution beginning to package it.

## 14. Investment Analysis

RISE has not funded or performed any work on this project - confirmed by exhaustive search of riseproject.dev's blog, member list, and all `riseproject-dev` GitHub organization repositories (25 enumerated, none related to Edge Impulse or this Zephyr module). All sizing below is therefore for work not yet covered by any known third party.

### 14.1 Functional Enablement

The module's own generic build path already compiles for riscv64 today via the unlabeled `else()` branch in `edge-impulse-sdk/cmake/zephyr/CMakeLists.txt` (Section 5) - no code change is required in this repository to attempt a functional riscv64 Zephyr build. The actual functional blocker sits one layer down: TensorFlow Lite Micro has no riscv64 target upstream (Section 9, [tflite-micro #3107](https://github.com/tensorflow/tflite-micro/issues/3107)). Enabling a genuinely supported riscv64 target requires upstreaming or maintaining a riscv64 TFLM target first; this repository's own work is then limited to CI validation of the existing generic path against a riscv64 Zephyr board/QEMU target.

### 14.2 Performance Optimization

No riscv64-specific optimization exists anywhere in the dependency stack (Section 4, Section 9). Closing this gap would require RVV-based kernels in TFLM (the stalled [PR #3280](https://github.com/tensorflow/tflite-micro/pull/3280) targets riscv32 only and is unreviewed) and/or in ruy/gemmlowp, none of which are this repository's own code to change - they are upstream dependency efforts this module would simply inherit once available.

### 14.3 CI/CD Infrastructure

This repository has zero CI for any architecture, so a riscv64 job cannot be added without first establishing baseline CI (build + Twister test execution) for the module generally. This is a green-field CI buildout, not an incremental riscv64 addition.

### 14.4 Ecosystem Enablement

Not applicable to this project - see Section 10 omission rationale (below).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Establish and upstream a working riscv64 target in TensorFlow Lite Micro (dependency-level, blocking) | 8-16 (dependency-level effort, not this repo's own scope) | TFLM upstream / external contributor | Critical |
| Functional | Add basic riscv64 board build validation for this repository's generic `else()` path once a CI system exists at all | 1-2 | edge-impulse-sdk-zephyr maintainers | Medium |
| CI/CD | Stand up baseline GitHub Actions CI (build + Twister test) for this repository, covering all architectures including riscv64 | 2-3 | edge-impulse-sdk-zephyr maintainers | High |
| Performance | RVV kernel implementation in TFLM and/or ruy for the primary NN/DSP hot paths | 6-10 (dependency-level effort) | TFLM/ruy upstream / external contributor | Medium |
| Distribution | Establish any riscv64 release/packaging channel (currently none exists for any architecture) | 1-2 | edge-impulse-sdk-zephyr maintainers | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/edge-impulse-sdk-zephyr (repository root)](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr)
- [PR #1: Kconfig: add CONFIG_EDGE_IMPULSE_SDK](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr/pull/1)
- [GitHub Releases page (empty)](https://github.com/edgeimpulse/edge-impulse-sdk-zephyr/releases)
- [Edge Impulse Zephyr module deployment docs](https://docs.edgeimpulse.com/hardware/deployments/run-zephyr-module)
- [RISE Project homepage and member list](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [PyPI JSON API - edge-impulse-sdk-zephyr-module (404)](https://pypi.org/pypi/edge-impulse-sdk-zephyr-module/json)
- [RISE wheel builder mirror (redirects to PyPI 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-sdk-zephyr-module/)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/?q=edge%20impulse%20sdk%20zephyr%20module)
- [google/ruy](https://github.com/google/ruy)
- [google/gemmlowp](https://github.com/google/gemmlowp)
- [google/flatbuffers](https://github.com/google/flatbuffers)
- [mborgerding/kissfft](https://github.com/mborgerding/kissfft)
- [tensorflow/tflite-micro](https://github.com/tensorflow/tflite-micro)
- [tflite-micro issue #3107 - riscv64 support request (closed stale)](https://github.com/tensorflow/tflite-micro/issues/3107)
- [tflite-micro issue #3252 - double-rounding quantization bug](https://github.com/tensorflow/tflite-micro/issues/3252)
- [tflite-micro issue #3271 - float-precision bug](https://github.com/tensorflow/tflite-micro/issues/3271)
- [tflite-micro PR #3280 - RVV kernels (riscv32-only, unreviewed)](https://github.com/tensorflow/tflite-micro/pull/3280)
- [cpuinfo issue #397 - incomplete riscv64 ISA detection](https://github.com/pytorch/cpuinfo/issues/397)
- [googletest issue #3756 - thread-count test fails on riscv64](https://github.com/google/googletest/issues/3756)
- [ARM-software/CMSIS-NN](https://github.com/ARM-software/CMSIS-NN)
- Internal report: `project-reports/tensorflow-lite-micro-(tflm).md`
- Internal report: `project-reports/ruy.md`
- Internal report: `project-reports/flatbuffers.md`

**Note on Section 10:** omitted. This project is a firmware SDK/deployment module compiled as native object code into a Zephyr application; it has no dependent package ecosystem of its own (no PyPI/npm/Maven/Kubernetes-operator consumers depend on it as a library package) - it is consumed directly as vendored source by individual Zephyr firmware projects.