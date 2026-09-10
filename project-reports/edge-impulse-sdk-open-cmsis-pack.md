---
title: Edge Impulse SDK Open CMSIS Pack
parent: Project Reports
color: grey
dependencies:
  - name: TensorFlow Lite Micro (TFLM)
    relation: build-dependency
    criticality: critical
  - name: FlatBuffers
    relation: build-dependency
    criticality: critical
  - name: gemmlowp
    relation: build-dependency
    criticality: optional
  - name: ruy
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="edge-impulse-sdk-open-cmsis-pack" %}

# Edge Impulse SDK Open CMSIS Pack

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** grey<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse SDK Open CMSIS Pack<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse SDK Open CMSIS Pack ([edgeimpulse/edge-impulse-sdk-pack](https://github.com/edgeimpulse/edge-impulse-sdk-pack)) is a packaging repository that distributes the Edge Impulse embedded-ML inferencing SDK as an [Open-CMSIS-Pack](https://github.com/Open-CMSIS-Pack) (`.pack`/`.pdsc`) for consumption by Arm's Keil MDK / Arm Development Studio / CMSIS-Toolbox ecosystem. CMSIS (Cortex Microcontroller Software Interface Standard) is Arm's own packaging and toolchain-integration standard; this repository exists specifically to make the Edge Impulse SDK importable into Arm Cortex-M development environments.

The repository is small: root contents are `EdgeImpulse.EI-SDK.pdsc` (pack descriptor), `EdgeImpulse.pidx` (pack index), `gen_pack.sh`, `README.md`, `LICENSE.3-clause-bsd-clear`, one GitHub Actions workflow, and a vendored `edgeimpulse/edge-impulse-sdk` source subtree (classifier, DSP, TensorFlow Lite Micro, third-party libs, porting layer).

**Governance:** No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. Copyright is held solely by EdgeImpulse Inc. under the Clear BSD License. Every commit visible in the repository's history is authored by an automated bot account, `edge-impulse-firmware-uploader[bot]`, with releases (e.g. v1.95.10, v1.95.9) pushed automatically roughly every 1-3 days, apparently synced from Edge Impulse's private main SDK repository. There is no independent open-source governance board, TSC, or foundation overseeing this repository - it is a fully corporate-owned, bot-automated release mirror.

**Corporate sponsors:** None beyond EdgeImpulse Inc. itself. The project is not affiliated with RISE (RISC-V Software Ecosystem). RISE's published Premier and General Member lists (fetched from [riseproject.dev](https://riseproject.dev)) do not include Edge Impulse in any tier.

**Community culture on new ports:** No evidence of any port activity, RISC-V or otherwise, exists in this repository's 4-issue, effectively-zero-human-contributor history. The repository's only stated purpose (packaging for Arm CMSIS toolchains) gives no indication of an intent to support non-Arm targets.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-12-19 | Repository created | [github.com/edgeimpulse/edge-impulse-sdk-pack](https://github.com/edgeimpulse/edge-impulse-sdk-pack) |
| - | No RISC-V port ever initiated | Zero matches for "riscv" across full repository history, all branches (only branch is `main`), confirmed via local clone at commit `6e0d3bba2b1b26fc58c03670d9e26761d6112884` (2026-09-03) and GitHub's own code-search index |

There is no port history to report. No first commit, no author, no milestone exists for RISC-V support in this repository. `mcp__github__search_commits` for `riscv repo:edgeimpulse/edge-impulse-sdk-pack` returns zero results, and a full-text, case-insensitive grep of the entire working tree (including `EdgeImpulse.EI-SDK.pdsc` and `gen_pack.sh`) returns zero matches.

**Is it fully upstream?** Not applicable - there is no RISC-V code to be upstream or out-of-tree. The project's only supported cores, per the pack manifest's `<accept Dcore=.../>` list, are Cortex-M0, M0+, M3, M4, M7, M23, M33, M55, and M85. No RISC-V core is declared.

## 3. Upstream Support Tier

**No formal tier policy exists** for any architecture in this repository - it packages source/header content for a single vendor toolchain family (Arm CMSIS) rather than compiling or testing per-architecture binaries.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | No (CI is release-packaging only, see Section 7) | No | No |
| Upstream CI tests | No | No | No |
| Official upstream binary/artifact | No per-architecture binaries produced at all - only a `.pack`/`.pdsc` source/header bundle | Same | Same |
| Architecturally accepted target | No (not a listed Cortex-M core) | Partial (Cortex-A/NEON handled via config macros in the vendored SDK, not via the pack's own device-acceptance list, which is Cortex-M only) | No - not a listed Cortex-M core, and not a supported architecture family at all |

This project does not compile or release architecture-specific binaries for amd64, arm64, or riscv64. It ships a source/header package consumed and compiled by the end user's own Arm Cortex-M toolchain. The comparison table above is included per the report template; in this project's case, none of amd64/arm64/riscv64 receive a compiled release artifact from this repository.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The vendored `edge-impulse-sdk/dsp/` engine-selection cascade (`numpy.hpp`) is the relevant architecture-specific subsystem:

```c
#if EIDSP_USE_CEVA_DSP
    ... ei_ceva_dsp.h / ei_ceva_dsp_fixed.h ...
#elif EIDSP_USE_CMSIS_DSP
    #include "edge-impulse-sdk/dsp/dsp_engines/ei_arm_cmsis_dsp.h"
    #include "edge-impulse-sdk/dsp/dsp_engines/ei_cmsis_numpy.hpp"
#elif EIDSP_USE_ESP_DSP
    #include "edge-impulse-sdk/dsp/dsp_engines/ei_esp_dsp.h"
#else
    #define EIDSP_INCLUDE_KISSFFT 1
    #include "edge-impulse-sdk/dsp/dsp_engines/ei_no_hw_dsp.h"
#endif
```

`edge-impulse-sdk/dsp/config.hpp` gates `EIDSP_USE_CMSIS_DSP` on `__MBED__`, `__ARM_ARCH_PROFILE == 'M'`, and explicit `__TARGET_CPU_CORTEX_M{0,0PLUS,3,4,7,33,55,85}` checks; it gates `EIDSP_USE_NEON` on `__ARM_NEON`/`__aarch64__`. The complete `dsp_engines/` directory contains exactly six files: `ei_arm_cmsis_dsp.h`, `ei_ceva_dsp.h`, `ei_ceva_dsp_fixed.h`, `ei_cmsis_numpy.hpp`, `ei_esp_dsp.h`, `ei_no_hw_dsp.h`. There is no `ei_riscv_*` or `ei_rvv_*` file.

Targeted code searches for RISC-V vector/architecture signatures (`__riscv`, `riscv`, `vsetvli`, `rvv`, `__riscv_vector`, `rv64gc`) all returned zero hits.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| DSP feature extraction (CMSIS-DSP) | Scalar C fallback (`ei_no_hw_dsp.h`/KissFFT) - no dedicated x86 engine | Partial - NEON path via `__ARM_NEON`/`__aarch64__` guards | Missing - falls through the same generic scalar fallback as any unrecognized architecture; zero RISC-V-aware detection, guard, comment, TODO, or stub |
| NN kernels (CMSIS-NN) | N/A - CMSIS-NN is Cortex-M SIMD/DSP-extension-only | N/A (CMSIS-NN targets Cortex-M, not Cortex-A/NEON) | Missing |
| Espressif DSP (ESP-DSP) | N/A | N/A | Reached only via ESP-IDF macros (ESP32/S3/P4/C3 detection), not via `__riscv` or any architecture-level RISC-V check - even ESP32-C3/P4, which are RISC-V cores, are not detected through RISC-V-specific logic |
| CEVA DSP | N/A | N/A | N/A - separate DSP vendor target, unrelated to RISC-V |

**Per-architecture optimization rating (from source inspection):**

| Target | Rating |
|---|---|
| ARM Cortex-M (CMSIS-DSP/NN) | Full - dedicated engine files, explicit per-core (M0-M85) preprocessor detection; this is the pack's entire reason for existing |
| ARM Cortex-A / NEON | Partial (C intrinsics) |
| Espressif (Xtensa / RISC-V ESP32-C3) | Partial (C intrinsics), reached via ESP-IDF macros, not RISC-V-level detection |
| CEVA DSP | Partial |
| x86/amd64 | Scalar (generic C fallback) - no dedicated engine |
| riscv64 | **Missing** - zero references anywhere in source, config, CI, `.pdsc` metadata, issues, PRs, or commits |

The pack manifest itself (`EdgeImpulse.EI-SDK.pdsc`) further confirms structural exclusivity: its `<condition>` block gates the whole component on Cortex-M core, and its `<requirements><packages>` block hard-requires three ARM-vendor packages (CMSIS 5.9.0-6.1.0, CMSIS-DSP 1.11.0-1.15.0, CMSIS-NN 4.0.0-4.1.0) - none of which exist as Ubuntu 26.04 riscv64 (or any-architecture distro) packages, per the project graph SPARQL check (empty result set for all three).

## 5. Build System, Cross-Compilation, and Toolchain

There is no build system in this repository to cross-compile for riscv64 or any other target.

- No `CMakeLists.txt`, `.cmake` toolchain file, or Dockerfile exists anywhere in the tree (`find -iname "*Dockerfile*"` and `find -iname "*riscv*"` both empty; GitHub code search for `riscv64 repo:edgeimpulse/edge-impulse-sdk-pack filename:Dockerfile` returns 0 results).
- `gen_pack.sh` (v2.7) does not compile anything. It bootstraps the `Open-CMSIS-Pack/gen-pack` library from `raw.githubusercontent.com` and archives the `edgeimpulse/` source tree plus the license file into a `.pack` zip. There is no compiler invocation, no toolchain selection, no architecture flag of any kind.
- `porting/open-cmsis/` (the SDK's generic CMSIS port) contains exactly two files - `debug_log.cpp` and `ei_classifier_porting.cpp` - platform-porting shims, not build configuration.
- No QEMU usage anywhere in the repository.
- No known build failures documented for any architecture, because no architecture is actually built by this repository's own tooling; compilation happens downstream, in the consuming Keil/CMSIS-Toolbox project, entirely outside this repo's control.

**Conclusion:** riscv64 build/cmake/Docker/QEMU tooling, if it exists anywhere for Edge Impulse's SDK, would live in a different Edge Impulse repository (e.g. `edgeimpulse/edge-impulse-sdk` directly, or a firmware/board example repo), not in this CMSIS-Pack wrapper. This finding is bounded to a shallow (`--depth 1`) clone of current HEAD plus GitHub's live code-search index (also 0 hits); it does not rule out deleted historical content, though nothing in the CMSIS-Pack architecture of this repo suggests any ever existed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Pack importable into Arm toolchain | Yes (host tooling, architecture-independent of the target) | Yes | Yes (host tooling), but the resulting pack's device-acceptance list excludes any riscv64 target entirely |
| Compiled, optimized inference | N/A - scalar fallback only | Partial via NEON | Not available - no CMSIS-Pack device slot exists for RISC-V cores at all |
| DSP feature extraction acceleration | None (scalar) | CMSIS-DSP/NEON-class | None - generic scalar/KissFFT fallback, same tier as amd64's unoptimized path, but with zero architecture awareness |

**Functional gaps:** A riscv64 target cannot be selected as a device in the pack's `.pdsc` manifest at all - this is a categorical exclusion, not a missing optimization. There is no path by which a user could target riscv64 through this specific packaging mechanism as currently defined.

**Performance gaps:** Not meaningfully assessable, since riscv64 is not an acceptable target device in the first place. Even a hypothetical generic-C build (bypassing the pack mechanism entirely and using the vendored SDK source directly) would fall to the same unoptimized scalar/KissFFT fallback used by amd64, since no RVV or other RISC-V SIMD path exists anywhere in the codebase.

**Security hardening gaps:** Data not available: no security-hardening documentation, CVE tracker, or hardening-flag configuration specific to riscv64 (or any architecture) was found in this repository.

**NaN / floating-point semantics issues:** Data not available: no RISC-V-specific floating-point or NaN-handling issue was found in the 4-issue history of this repository, and no such issue exists to investigate (confirmed via `mcp__github__search_issues` query `riscv nan floating repo:edgeimpulse/edge-impulse-sdk-pack` -> 0 results).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by direct file read, not by absence of search hits.

Exactly one workflow file exists: `.github/workflows/pack.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml`, or `.circleci/` exists anywhere in the tree. Full content:

```yaml
name: Build pack
on:
  workflow_dispatch:
  push:
    tags:
      - '*'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  pack:
    name: Generate pack
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      - name: Build pack
        id: build_cmsis_pack
        uses: Open-CMSIS-Pack/gen-pack-action@main
        with:
          doxygen-version: 1.9.6
          packchk-version: 1.3.98
          gen-pack-script: ./gen_pack.sh
          gen-pack-output: ./output
      - name: Upload release asset
        id: upload-release-asset
        uses: AButler/upload-release-assets@v3.0
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          files: "./output/*.pack;EdgeImpulse.EI-SDK.pdsc"
          release-id: ${{ steps.create_release.outputs.id}}
```

Source: [.github/workflows/pack.yml](https://github.com/edgeimpulse/edge-impulse-sdk-pack/blob/main/.github/workflows/pack.yml).

- **Trigger:** `workflow_dispatch` (manual) and `push` on tags matching `'*'` only - never runs on ordinary commits or pull requests.
- **Runner:** `ubuntu-22.04`, standard x86_64 GitHub-hosted runner. No architecture matrix, no self-hosted riscv64 runner label, no QEMU setup step (`docker/setup-qemu-action` or equivalent).
- **Job purpose:** Checks out the repo, creates a GitHub Release, invokes `Open-CMSIS-Pack/gen-pack-action` to run `./gen_pack.sh` (packaging the CMSIS-Pack - a zip-like `.pack`/`.pdsc` bundle of source/header files, not a compiled binary), and uploads the result as release assets. It does not compile, cross-compile, run QEMU, or execute tests for Cortex-M, x86, riscv64, or any other architecture.
- **RISE runners:** No reference to `riseproject-dev`, RISE runner labels, or any RISC-V hardware anywhere in the workflow or repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | N/A - job packages source, does not compile for any target | N/A | N/A |
| CI test | No | No | No |
| CI release | Release-packaging job runs on an x86_64 runner and produces one architecture-independent `.pack`/`.pdsc` bundle, not per-architecture artifacts | Same bundle | Same bundle (no riscv64-specific content) |

## 8. Distribution and Release Status

**No official riscv64 binaries exist, and none would be expected given the project's distribution model.**

- **GitHub Releases** (verified against `v1.95.10`, the most recent tag, via [expanded release assets](https://github.com/edgeimpulse/edge-impulse-sdk-pack/releases/expanded_assets/v1.95.10)): exactly four assets - `EdgeImpulse.EI-SDK.1.95.10.pack`, `EdgeImpulse.EI-SDK.pdsc`, source `.zip`, source `.tar.gz`. None is architecture-specific; there is no per-architecture binary split at all in this project's release model.
- **PyPI:** `https://pypi.org/pypi/edge-impulse-sdk-open-cmsis-pack/json` returns HTTP 404 - no package exists under this name, confirmed independently via direct curl and via the GitLab/RISE wheel-builder mirror (also 404).
- **Ubuntu 26.04 (resolute):** Project-graph SPARQL query against `deb#BinaryPackage`/`deb#inSuite`, filtered to `arch=riscv64, suite=resolute`, for candidate names `"edge impulse sdk open cmsis pack"`, `"python3-edge-impulse-sdk-open-cmsis-pack"`, `"libedge-impulse-sdk-open-cmsis-pack"` -> empty result set. Live `packages.ubuntu.com` search independently returned "your keyword was too generic" / no packages found.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no matching package found under any tried name.

**What a user must do to get a working "binary":** There is no compiled binary to obtain from this project at any architecture, riscv64 included. A user imports the `.pack`/`.pdsc` bundle into an Arm CMSIS-Pack-compatible toolchain (Keil MDK, Arm Development Studio, CMSIS-Toolbox) targeting a supported Cortex-M core, and that toolchain compiles the vendored source for the selected Cortex-M target. There is no supported path to target riscv64 through this mechanism, because riscv64 is not an acceptable device core in the pack's manifest.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| CMSIS (ARM-software/CMSIS_5, req. 5.9.0-6.1.0) | Cortex-M core headers/intrinsics; hard pack requirement | N/A - Cortex-M-only by design | N/A | N/A - not found in Ubuntu 26.04 riscv64 (any arch) | One open, stale issue asking for RISC-V/AArch64 support: [ARM-software/CMSIS_5 issue on riscv-dsp compatibility](https://github.com/ARM-software/CMSIS_5) (open since March 2023, unaddressed) |
| CMSIS-DSP (req. 1.11.0-1.15.0) | SIMD DSP kernels for feature extraction | N/A - Cortex-M SIMD intrinsics, not portable | N/A | Not found in Ubuntu archive | 0 riscv64-tagged issues in ARM-software/CMSIS-DSP itself |
| CMSIS-NN (req. 4.0.0-4.1.0) | Optimized Cortex-M NN kernels (conv/fc/pooling) | N/A - Cortex-M SIMD-only | N/A | Not found in Ubuntu archive | 0 riscv64-tagged issues found |
| TensorFlow Lite Micro (vendored) | Core inference runtime | Tier 2 / reference-kernel only for `riscv32_generic`, no riscv64/Linux target, MCU-only reference C kernels - see `project-reports/tensorflow-lite-micro-(tflm).md` | Tier 2 CI exists for riscv32 QEMU but reported flaky | No optimized riscv64 kernel pack exists | See `project-reports/tensorflow-lite-micro-(tflm).md` |
| FlatBuffers (vendored) | Zero-copy model schema/serialization | Architecture-agnostic; builds cleanly on riscv64 | Not CI'd on riscv64 upstream, no known failures | Packaged and released for riscv64 in Ubuntu (`libflatbuffers-dev` et al.) | See `project-reports/flatbuffers.md` |
| gemmlowp (vendored) | Quantized (int8) fixed-point math primitives | Header-only, portable, no known riscv64 breakage | No dedicated CI found | Packaged for riscv64 in Ubuntu (`libgemmlowp-dev`) | Not in `projects.yml` scope; no dedicated report |
| ruy (vendored) | Dense int8/float matmul backend | ARM/x86-centric hand-optimized kernel packs; no optimized RISC-V kernel path, would fall back to generic/reference path | 0 riscv64 issues found upstream | Debian/Ubuntu packages `libruy-dev` for riscv64, but this is the portable reference build, not an optimized kernel | See `project-reports/ruy.md` |

**Deep-dive - the actual blocker:** The pack's direct, hard-pinned dependencies (CMSIS, CMSIS-DSP, CMSIS-NN) are categorically Arm Cortex-M-only. They do not exist in the Ubuntu archive under any architecture, and there is exactly one open, stale, unaddressed cross-repo issue in ARM-software/CMSIS_5 asking for RISC-V/AArch64 support - with no sign of upstream action. This is the primary structural blocker: the pack cannot target riscv64 without Arm first deciding to support RISC-V in CMSIS itself.

The vendored numerics stack that does the actual inference math is more mixed: FlatBuffers and gemmlowp are architecture-agnostic and riscv64-clean; TFLM has a Tier-2, reference-only, flaky-CI riscv32 (not riscv64) path with a maintainer-abandoned riscv64 support offer that was closed stale after 8 months of zero maintainer engagement [NEEDS VERIFICATION - specific issue number not captured in these findings]; ruy has zero RISC-V engagement and would run unoptimized if ever wired to a RISC-V target. Net effect: even bypassing the Arm-only packaging gate entirely, inference would degrade to unoptimized reference kernels on RISC-V - there is no accelerated riscv64 path anywhere in this dependency chain.

## 11. Known Bugs and Active Issues

The repository's entire issue history consists of 4 issues, none related to RISC-V:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1](https://github.com/edgeimpulse/edge-impulse-sdk-pack) | CMSIS Pack Import failed | Closed (Aug 2024) | N/A to RISC-V | Release/pack-build tooling bug, unrelated to any ISA |
| #2 | CMSIS Pack import error | Open | N/A to RISC-V | `.pdsc`/`.pidx` URL versioning bug in the pack importer |
| #3 | `EI_PORTING_ARDUINO` redefined | Closed (June 2025) | N/A to RISC-V | Compiler warning on Arduino/Windows toolchain |
| #4 | Please release version 1.74.15 | Closed (Sept 2025) | N/A to RISC-V | Release-request issue |

No correctness bugs, RISC-V-specific bugs, or riscv64 performance issues exist to highlight. Confirmed via `mcp__github__search_issues`/`search_pull_requests`/`search_commits` for `riscv`, `riscv64`, `RISC-V` scoped to this repository - 0 results across all query variants, verified independently in two separate passes.

## 12. Objections and Upstream Blockers

**Stated objections:** None found - there has never been a RISC-V support request or discussion in this repository's issue tracker to object to.

**Technical blockers:**
1. The pack's `.pdsc` manifest structurally excludes any non-Cortex-M device from being accepted as a target - this is a hard, declarative exclusion, not merely an absence of testing.
2. The pack's mandatory dependencies (CMSIS, CMSIS-DSP, CMSIS-NN) are themselves Arm-only; per [ARM-software/CMSIS_5](https://github.com/ARM-software/CMSIS_5), RISC-V/AArch64 compatibility has been requested but remains open and unaddressed since March 2023.
3. Even the underlying vendored numerics (TFLM, ruy) provide no accelerated riscv64 path, so a RISC-V port of this pack's contents would deliver unoptimized reference-kernel performance at best.

**Organizational blockers:** The repository is a fully automated, bot-driven mirror with no human maintainer engagement visible in commit history, no MAINTAINERS file, and no governance structure through which a RISC-V port proposal could even be raised or reviewed.

**Acceptance probability:** Effectively zero under the current architecture. A riscv64 port is not a matter of writing missing code within this repository - it would require Arm's own CMSIS project to support RISC-V first (which it does not, per the unaddressed CMSIS_5 issue), or Edge Impulse abandoning the CMSIS-Pack packaging model for RISC-V targets in favor of a different, non-CMSIS packaging/distribution mechanism entirely.

## 13. Readiness Assessment

- **Color:** grey (arch-exclusive)
- **Release provider:** none
- Optimization gap: not applicable. This repository is architecture-exclusive by design (Step 0/Step 1 grey case), which precludes the Step 2 optimization-purpose modifier from being evaluated - there is no riscv64 code path, hot or cold, to assess coverage against.
- **Justification:** This project is an Arm CMSIS-Pack whose `.pdsc` manifest gates device acceptance to Cortex-M cores only (M0/M0+/M3/M4/M7/M23/M33/M55/M85) and hard-requires the Arm-vendor packages CMSIS, CMSIS-DSP, and CMSIS-NN ([EdgeImpulse.EI-SDK.pdsc](https://github.com/edgeimpulse/edge-impulse-sdk-pack/blob/main/EdgeImpulse.EI-SDK.pdsc)). CMSIS (Cortex Microcontroller Software Interface Standard) is by definition an Arm-only packaging and toolchain-integration standard, making riscv64 not applicable to this specific repository by design, not merely unported - this parallels the "architecture-exclusive" grey case (analogous to ARM Compute Library) rather than an unsupported-but-plausible target. The sole CI workflow ([.github/workflows/pack.yml](https://github.com/edgeimpulse/edge-impulse-sdk-pack/blob/main/.github/workflows/pack.yml)) is a tag-triggered release-packaging job with no build or test step for any architecture, and zero riscv references exist anywhere in the repository, its issues, its PRs, or its commit history.
- **Pending work:** None identified. No open PRs, no tracking issues, and no RISE involvement of any kind exists for this repository (confirmed against riseproject.dev's blog, sitemap, and member pages, and against GitHub org `riseproject-dev`'s 25 public repositories and code search). The only path that could change this grade is upstream: (1) Arm's CMSIS project adding RISC-V core support (tracked, unaddressed, in [ARM-software/CMSIS_5](https://github.com/ARM-software/CMSIS_5) since March 2023), or (2) Edge Impulse introducing a separate, non-CMSIS packaging mechanism for RISC-V targets - neither of which shows any sign of happening based on current evidence.

## 14. Investment Analysis

RISE has done and funded nothing for this project - confirmed via riseproject.dev blog/sitemap/members, the RISE Python wheel-builder listing (85 packages, none related), and a full sweep of the `riseproject-dev` GitHub org (25 repos, none dedicated to Edge Impulse or CMSIS; code search for "CMSIS" and "Edge Impulse" across the org surfaced only this project's own unresearched queue entry in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml`). No prior work is being duplicated by any recommendation below.

### 14.1 Functional Enablement

Not applicable in the traditional sense - there is no "port" to write inside this repository, because the packaging mechanism itself structurally excludes riscv64 as a target device. Any functional enablement work would have to happen upstream, in Arm's CMSIS project (adding RISC-V core support to CMSIS/CMSIS-DSP/CMSIS-NN), which is outside this repository's or a chip vendor's direct control. Alternatively, a chip company could pursue riscv64 inference support through the separate `edgeimpulse/edge-impulse-sdk` core repository or a standalone build (bypassing the CMSIS-Pack format entirely), but that is out of scope for this specific project.

### 14.2 Performance Optimization

Not applicable for the same structural reason. Even a hypothetical direct-source build (bypassing the pack) would rely on the vendored TFLM/ruy/gemmlowp stack, which has no optimized riscv64 kernel path (Section 9) - so performance optimization work would need to start at the dependency layer (TFLM, ruy), not within this repository.

### 14.3 CI/CD Infrastructure

Not applicable. The repository's only CI job is a release-packaging step on `ubuntu-22.04`; there is no target-architecture build or test matrix to extend, because the artifact produced (`.pack`/`.pdsc`) is architecture-independent packaging content, not a compiled binary.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | No actionable work within this repository; riscv64 support is structurally excluded by the CMSIS-Pack device model and would require upstream Arm CMSIS RISC-V support (see [CMSIS_5 tracking issue](https://github.com/ARM-software/CMSIS_5)) or a non-CMSIS Edge Impulse distribution path | N/A | N/A - outside this project's control | Low |

No further investment is recommended for this specific repository. A chip company evaluating Edge Impulse's embedded-ML tooling on RISC-V should redirect investment analysis to `edgeimpulse/edge-impulse-sdk` (the core inferencing SDK) or the RISE-relevant dependency chain (TensorFlow Lite Micro, ruy), where riscv32-tier work already exists and riscv64 work would be architecturally possible - not to this Arm-exclusive packaging wrapper.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/edge-impulse-sdk-pack (repository)](https://github.com/edgeimpulse/edge-impulse-sdk-pack)
- [.github/workflows/pack.yml](https://github.com/edgeimpulse/edge-impulse-sdk-pack/blob/main/.github/workflows/pack.yml)
- [EdgeImpulse.EI-SDK.pdsc (pack manifest)](https://github.com/edgeimpulse/edge-impulse-sdk-pack/blob/main/EdgeImpulse.EI-SDK.pdsc)
- [GitHub Releases - v1.95.10 expanded assets](https://github.com/edgeimpulse/edge-impulse-sdk-pack/releases/expanded_assets/v1.95.10)
- [GitHub Releases listing](https://github.com/edgeimpulse/edge-impulse-sdk-pack/releases)
- [ARM-software/CMSIS_5 (RISC-V/AArch64 compatibility request, open since March 2023)](https://github.com/ARM-software/CMSIS_5)
- [Open-CMSIS-Pack/gen-pack-action](https://github.com/Open-CMSIS-Pack/gen-pack-action)
- [PyPI JSON API - edge-impulse-sdk-open-cmsis-pack (404, package does not exist)](https://pypi.org/pypi/edge-impulse-sdk-open-cmsis-pack/json)
- [packages.ubuntu.com search - Edge Impulse SDK Open CMSIS Pack (no results)](https://packages.ubuntu.com/search?keywords=Edge%20Impulse%20SDK%20Open%20CMSIS%20Pack&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search (archriscv.felixc.at, no match)](https://archriscv.felixc.at/)
- [riseproject.dev (homepage and member listing)](https://riseproject.dev)
- [riseproject.dev blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [Edge Impulse docs - Open CMSIS Pack deployment (404, page does not exist)](https://docs.edgeimpulse.com/docs/run-inference/cpp-library/deploy-your-model-as-an-open-cmsis-pack)
- Related project report: `project-reports/tensorflow-lite-micro-(tflm).md`
- Related project report: `project-reports/flatbuffers.md`
- Related project report: `project-reports/ruy.md`
- Related but distinct project (not this pack): `project-reports/edge-impulse-inferencing-sdk-(c++).md`

**Note on Section 10 (Ecosystem Status):** Omitted per instructions. This project is a single embedded-toolchain packaging artifact (a CMSIS-Pack consumed directly by Keil MDK/Arm Development Studio/CMSIS-Toolbox) with no dependent package ecosystem of its own (no downstream PyPI, npm, Maven, or Kubernetes-operator consumers found or expected) - it does not meet the threshold for a significant ecosystem of packages/plugins/extensions requiring separate riscv64 enablement.