---
title: GStreamer Plugin for Edge Impulse
parent: Project Reports
color: orange
dependencies:
  - name: GStreamer
    relation: build-dependency
    criticality: critical
  - name: Cairo
    relation: build-dependency
    criticality: optional
  - name: Pango
    relation: build-dependency
    criticality: optional
  - name: Edge Impulse Runner (Rust)
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="gstreamer-plugin-for-edge-impulse" %}

# GStreamer Plugin for Edge Impulse

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for GStreamer Plugin for Edge Impulse<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[GStreamer Plugin for Edge Impulse](https://github.com/edgeimpulse/gst-plugins-edgeimpulse) (`edgeimpulse/gst-plugins-edgeimpulse`) is a Rust-based GStreamer plugin providing seven pipeline elements (audio inference, video inference, crop, overlay, OCR, sink, continue-if) that run Edge Impulse machine-learning models inside a GStreamer pipeline. It is a `cdylib` Cargo project (`Cargo.toml`/`Cargo.lock`, no CMake, no autotools) built on `gstreamer-rs` bindings, with a default feature set (`ffi`, `ocr`, `presentation`, `ingestion`) that pulls in the `edge-impulse-runner` FFI crate, `cairo-rs`/`pango`/`pangocairo` for overlay rendering, and `ocrs`/`rten` for self-contained OCR.

**Governance:** No foundation membership (not Linux Foundation, Apache, or CNCF affiliated). No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE.md`, or `CONTRIBUTING.md` exist anywhere in the repository history. Licensed under Clear BSD License (BSD-3-Clause-Clear), `Copyright (c) 2025 EdgeImpulse Inc.`.

**Corporate sponsor:** Single-vendor repository owned by Edge Impulse Inc. (acquired by Qualcomm in 2025, per publicly known corporate history [NEEDS VERIFICATION - not independently confirmed within this repo's own materials]). Repository itself carries no documentation of that acquisition or any resulting platform-support commitments.

**Maintainer concentration:** Of 132 commits (2025-02-10 to 2026-07-27), Fernando Jimenez Moreno (personal Gmail address, `ferjmoreno@gmail.com`) authored ~96% (127 commits). Mateusz Majchrzycki (`mateusz@edgeimpulse.com`, corporate address) authored 2 commits. Raul James (`raul@nobi.io`, an unrelated external company) authored 1 commit. This is a de facto single-maintainer project with a token corporate commit, not a multi-company-governed one.

**Community culture on new ports:** No tier policy, no `CONTRIBUTING.md`, and no documented process exists for proposing a new platform port. Platform support is expressed only as ad hoc Cargo feature flags and Docker build variables (`TARGET_LINUX_AARCH64`, `USE_ETHOS`, `USE_AKIDA`, `USE_MEMRYX`, `USE_QUALCOMM_QNN`, `TENSORRT_VERSION`, etc.), not as a formal acceptance policy. There is no articulated stance toward RISC-V or any other new architecture - the question has never been raised in the project's history.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port, commit, PR, or issue exists at any point in the project's history | Full history search: `git log --all --grep`, pickaxe `-S"riscv"`, and repo-wide grep, zero matches |

No RISC-V-related contributor has ever touched this repository. There is no upstreaming timeline to report because no RISC-V work has ever been proposed, in this repo or in its issue/PR tracker. The project is not fully upstream on RISC-V in the sense of "already merged" - it is simply absent: zero commits, zero PRs, zero issues referencing RISC-V across the entire 132-commit history and all 54 pull requests (#1-#56) and both issues (#8, #49) enumerated.

## 3. Upstream Support Tier

No formal tier policy exists (see Section 1). Platform support tiers are inferred only from what CI actually exercises and what cross-compilation tooling exists.

| Architecture | CI builds | CI tests | Official binary release | Cross-compile tooling |
|---|---|---|---|---|
| amd64 (x86_64) | Yes - `ci.yml`, `docs.yml`, `e2e.yml` all run on `ubuntu-latest` | Yes - `cargo test` for runner-free and eim feature sets in `ci.yml` | No releases published for any architecture ("There aren't any releases here.") | Native, implicit |
| arm64 (aarch64) | No dedicated CI job; build-only via manual local Docker script (`test-cross-compilation.sh`, not invoked by any GitHub Actions workflow) | No | No releases published for any architecture | `aarch64-unknown-linux-gnu` target, `.cargo/config.toml` linker entry, dedicated `Dockerfile`/`docker-compose.yml` `aarch64-build` service |
| riscv64 | No | No | No releases published for any architecture; no PyPI, Ubuntu, or Arch RISC-V package exists under this name | None - no target triple, no toolchain, no Dockerfile stage, no compose service |

Evidence: [`.github/workflows/ci.yml`, `docs.yml`, `e2e.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/tree/main/.github/workflows) (all `ubuntu-latest`, no matrix), [GitHub Releases page](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/releases) ("There aren't any releases here").

## 4. Technical Architecture and RISC-V-Specific Subsystems

The plugin itself is inference-pipeline glue code (GStreamer elements calling into TFLite/ONNX/EIM backends); the model runtime is out-of-tree via the `edge-impulse-runner`/`edge-impulse-ffi-rs` crates. There is no architecture-specific compute code in this repository at all, for any architecture.

- `src/` contains 29 pure-Rust files (audio/, crop/, ocr/, overlay/, filter/, sink/, tracker/kalman.rs, video/, common.rs, detection.rs, meta.rs, resize.rs, lib.rs). No file named `*riscv*`, `*_x86*`, `*_arm*`, or `*_amd64*` exists.
- `grep -n "target_arch"` across the whole repository returns 0 matches. No `#[cfg(target_arch = ...)]` conditional compilation exists anywhere.
- No `#ifdef __riscv` guards (confirmed both by local grep and GitHub code-search index).
- The only conditional-compilation target in `Cargo.toml` is `[target.'cfg(target_os = "macos")'.dev-dependencies]` - an OS gate, not a CPU-architecture gate.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core plugin logic (Rust) | Native, full | Cross-compiles via Docker, generic Rust (no arch-specific code) | Absent - no target triple registered |
| Inference backend (`ffi`/`edge-impulse-ffi-rs`) | Native TFLite prebuilt libs | Native aarch64 build path documented | Not evaluated in-repo; see Section 9 for the transitive Edge Impulse Inferencing SDK (C++) gap, which has an unconditional non-aarch64/non-Apple fallback to x86_64 prebuilt libraries |
| OCR backend (`rten`/`ocrs`) | AVX2/AVX-512 SIMD | NEON SIMD | Scalar fallback only - RVV not mentioned anywhere in `rten`'s documented SIMD backends (AVX2, AVX-512, Arm Neon, WebAssembly SIMD) |
| Overlay rendering (Cairo/Pango) | Native | Native | Builds (per Section 9 dependency analysis) but compositing runs scalar-only pending an unmerged `pixman-rvv.c` upstream |

Because this project is inference-glue code rather than a performance-differentiating library in its own right, it is not classified as optimization-purpose (see Section 13); this section documents the absence of arch-specific code for completeness, not as an optimization-gap analysis.

## 5. Build System, Cross-Compilation, and Toolchain

- Build system: Cargo/Rust only. No `CMakeLists.txt`, no `cmake/` directory, no `BUILDING.md`/`INSTALL`/`docs/building.md` exist anywhere in the repository.
- Stated MSRV: `rust-version = "1.75"` in `Cargo.toml`; the Docker build image itself uses Rust 1.90 (`rust:1.90-slim-bullseye`).
- The only documented cross-compilation target in the entire repository is `aarch64-unknown-linux-gnu`:
  - Toolchain: `gcc-aarch64-linux-gnu`/`g++-aarch64-linux-gnu` via `dpkg --add-architecture arm64` + apt, `rustup target add aarch64-unknown-linux-gnu`.
  - Build command: `cargo build --target aarch64-unknown-linux-gnu --features ffi,ocr,presentation,ingestion --release` with env `CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc`, `CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++`, `TARGET_LINUX_AARCH64=1`, `USE_FULL_TFLITE=1`.
  - Orchestration: `docker-compose.yml` service `aarch64-build`, driven by `test-cross-compilation.sh` (a manual/local dev script, not invoked by any GitHub Actions workflow).
- No QEMU usage exists anywhere in the repository.
- riscv64 build: not documented, not implemented. There is no `riscv64gc-unknown-linux-gnu` target addition, no riscv toolchain package installation, no Dockerfile stage, and no `docker-compose.yml` service for riscv64. A user attempting a riscv64 build would need to add the Rust Tier-2 target, install a riscv64 cross-toolchain, and replicate the aarch64 Docker/CI plumbing from scratch - none of this exists today.
- Known build failures on riscv64: none documented, because no riscv64 build has ever been attempted per the available evidence.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature (Cargo flag) | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `ffi` (default) - core ML inference via Edge Impulse Inferencing SDK | Full | Full (documented cross-compile path) | Not buildable as-is: `edge-impulse-ffi-rs`'s CMake logic has an unconditional non-aarch64/non-Apple fallback to x86_64 prebuilt TFLite libraries, meaning a naive riscv64 build would silently link wrong-ISA binaries rather than fail cleanly (see Section 9) |
| `ocr` (default) - `rten`/`ocrs` text detection/recognition | Full, AVX2/AVX-512 accelerated | Full, NEON accelerated | Would compile via the Rust Tier-2 `riscv64gc-unknown-linux-gnu` target (pure Rust, no C++ FFI) but runs entirely unaccelerated - scalar fallback only |
| `presentation` (default) - Cairo/Pango overlay text rendering | Full | Full | Builds (all C dependencies - Cairo, Pango, HarfBuzz, FreeType - are packaged for Ubuntu 26.04 riscv64) but compositing is scalar-only pending pixman's unmerged RVV backend |
| `ingestion` (default) | Full | Full | Not independently verified; no known blocker found but also no riscv64 evidence of any kind |
| `eim` (non-default, external EIM process backend) | Full | Full | Not independently verified |

**Functional gaps:** The default feature set (`ffi` is in `default = [...]`) will not produce a working `ffi`/`eim`-backed inference element on riscv64 because of the unconditional x86_64 fallback in the transitive `edge-impulse-ffi-rs` build logic (see Section 9). This is the single hard functional blocker.

**Performance gaps:** OCR (`rten`/`ocrs`) and overlay compositing (Cairo via pixman) would both run correctly but unaccelerated on riscv64, versus SIMD-accelerated paths on amd64/arm64. Magnitude of that gap: Data not available - no riscv64 benchmark of any kind exists for this plugin or its dependencies (see Section 11).

**Security hardening gaps:** Data not available - no riscv64 build has been produced to assess hardening flags, ASLR behavior, or any other security posture on this architecture.

**NaN / floating-point semantics issues:** Data not available - no riscv64 build or test run exists to surface such issues; no issue report of any kind mentions floating-point or NaN behavior for this project on any architecture.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Confirmed by reading all three GitHub Actions workflow files directly at HEAD (`c763395b638eaef46b8ff1e8f58f8e2de057b692`, 2026-07-27):

- [`.github/workflows/ci.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/ci.yml): triggers on push/PR to `main`; single job on `runs-on: ubuntu-latest`; no `strategy: matrix:` block; installs GStreamer/Rust deps, runs `cargo fmt --check`, several `cargo build --no-default-features --features <set>` combinations, a backend-guard negative-build check, and `cargo test` for two feature sets. No `--target`, no QEMU, no `docker buildx`.
- [`.github/workflows/docs.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/docs.yml): triggers on push to `main` and `workflow_dispatch`; both `build` and `deploy` jobs run on `ubuntu-latest`; builds `cargo doc` and publishes to GitHub Pages.
- [`.github/workflows/e2e.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/e2e.yml): triggers on push/PR to `main`, gated to skip fork PRs; single job on `runs-on: ubuntu-latest`; runs `docker compose -f docker-compose.test.yml up --build` with `EI_ENGINE: tflite`.
- `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`: none exist in the repository.
- Repo-wide `grep -rniE "riscv"` (excluding `.git`) across the entire working tree: zero matches.
- No RISE runner references (no `riseproject-dev` mentions, no RISE runner labels) anywhere in the CI configuration.

| Architecture | CI: build | CI: test | CI: release-blocking | Runner |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes (implicit, only CI target) | GitHub-hosted `ubuntu-latest` (native) |
| arm64 | No (manual local Docker script only, not in CI) | No | No | N/A (not run in CI) |
| riscv64 | No | No | No | None |

## 8. Distribution and Release Status

- **GitHub Releases:** Zero releases exist for the repository, for any architecture - "There aren't any releases here." ([releases page](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/releases)). This means there are no release assets of any kind, not merely an absence of riscv64 assets.
- **PyPI:** Package does not exist under the name `gstreamer-plugin-for-edge-impulse` - `GET https://pypi.org/pypi/gstreamer-plugin-for-edge-impulse/json` returns HTTP 404. This is not project-appropriate anyway (it is a Rust `cdylib`, not a Python package), included here only because it was checked as part of the standard distribution sweep.
- **RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/gstreamer-plugin-for-edge-impulse/` redirects to the same PyPI 404.
- **Ubuntu 26.04 (resolute):** Project graph SPARQL query for `deb#BinaryPackage` under plausible names (`gstreamer plugin for edge impulse`, `python3-gstreamer-plugin-for-edge-impulse`, `libgstreamer-plugin-for-edge-impulse`) in suite `resolute`, architecture `riscv64`: zero bindings. Live confirmation via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=gstreamer-plugin-for-edge-impulse&suite=resolute&searchon=names&section=all): "Sorry, your search gave no results" for any architecture.
- **Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at)): no matching package listed.
- **Maven, npm, OCI:** Not applicable to this project's ecosystem (Rust Cargo `cdylib`); not checked.

**What a user must do to get a working binary:** There is no path to a working riscv64 binary today through any official or community channel. A user would need to: (1) build a riscv64 toolchain and Cargo cross-compilation plumbing analogous to the existing aarch64 path (none of which exists in this repo, see Section 5), (2) resolve the transitive `edge-impulse-ffi-rs`/Edge Impulse Inferencing SDK (C++) x86_64-fallback blocker (see Section 9), and (3) self-host the resulting binary, since upstream publishes no release binaries for any architecture whatsoever.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GStreamer (core + audio/base/app/video bindings) | Pipeline framework | Packaged Ubuntu 26.04 riscv64 (resolute): `libgstreamer1.0-0`, `-dev`, `gstreamer1.0-plugins-base/good` | No upstream riscv64 CI job | Debian sid/testing, Ubuntu Noble, Alpine edge ship riscv64; no official upstream Linux binaries for any arch | See `project-reports/gstreamer.md` |
| liborc (ORC) - GStreamer's JIT SIMD compiler | JIT backend for DSP (colorspace/audio conversion, compositing) | Packaged Ubuntu 26.04 riscv64: `liborc-0.4-0t64`, `-dev`. Native RVV 1.0 backend exists (~2,700 lines, Samsung-authored, landed May 2025, first released in ORC 0.4.42, Jan 2026) | No ORC riscv64 CI | Released in ORC 0.4.42, packaged Debian/Alpine | RVV API gated behind `ORC_ENABLE_UNSTABLE_API`; RV32 explicitly rejected; two open GStreamer core MRs (!11768, !11773) unmerged as of Jun 2026. See `project-reports/gstreamer.md` |
| Cairo (`cairo-rs`) | Overlay-element rendering surface | Packaged Ubuntu 26.04 riscv64: `libcairo2`, `-dev`; pure portable C, builds trivially | No upstream CI (Anubis-blocked GitLab); Debian buildd confirms clean riscv64 builds | Debian sid/Ubuntu/Arch RISC-V ship it | Compositing engine `pixman` has no merged RVV backend (`pixman-rvv.c`, 3,272 lines, unmerged as of Jun 2026) -> scalar fallback, ~4-5x throughput deficit on vector-dominated compositing per `project-reports/cairo.md` |
| Pango / pangocairo | Text shaping/layout | Packaged Ubuntu 26.04 riscv64: `libpango-1.0-0`, `-dev`, `libpangocairo-1.0-0`; pure C, no arch-specific code found | Not independently verified | Packaged Ubuntu/Debian riscv64 | No dedicated report |
| HarfBuzz (via Pango) | OpenType/complex-script shaping | Packaged Ubuntu 26.04 riscv64: `libharfbuzz0b`, `-dev` | No upstream riscv64 CI job | Debian/Ubuntu package it; no official upstream Linux binary for any arch | See `project-reports/harfbuzz.md` |
| FreeType (via Pango/Cairo) | Glyph rendering | Packaged Ubuntu 26.04 riscv64: `libfreetype6`, `-dev`/`libfreetype6-dev` | No upstream riscv64 CI | Debian buildd/Ubuntu launchpad ship it | See `project-reports/freetype.md` |
| `rten`/`rten-tensor`/`rten-imageproc` | Tensor/ML inference engine backing the OCR feature | Not a Debian/Ubuntu package (crates.io source only); compiles as generic scalar Rust via Tier-2 `riscv64gc-unknown-linux-gnu` target; no RVV kernel path | No riscv64-specific CI/test evidence; GitHub issue search for "riscv" on `robertknight/rten` returned zero results | Published to crates.io (source only, no arch-gated release) | Documented SIMD backends: "AVX2, AVX-512, Arm Neon and WebAssembly SIMD" - RISC-V/RVV not mentioned anywhere |
| `ocrs` | OCR detection/recognition models built on `rten` | Not a Debian/Ubuntu package (crates.io only) | No riscv64-specific issues found | crates.io only | Inherits `rten`'s scalar-fallback status entirely |
| `edge-impulse-runner` (Rust) (`ffi`/`eim`/`ingestion` features) | FFI bridge to native ML inference | Not a Debian/Ubuntu package; the `ffi` backend's CMake logic has an unconditional non-aarch64/non-Apple fallback to x86_64 prebuilt TFLite libraries - a riscv64 build would silently misroute to wrong-ISA binaries rather than fail cleanly | No CI at all for riscv64 (both GitHub Actions workflows run only on `ubuntu-latest`) | Zero GitHub releases published for any architecture | Critical structural gap. See `project-reports/edge-impulse-runner-(rust).md` (readiness: orange). Repository's own issue tracker (5 issues total) has zero RISC-V mentions |
| Edge Impulse Inferencing SDK (C++) (vendored, pulled transitively via `edge-impulse-ffi-rs`) | Core NN inference + DSP, used whenever `ffi` feature is built (i.e. the default build) | Not packaged on any channel; source-vendored only | No CI of any kind exists in the repo for any architecture | Zero GitHub releases for any architecture | No `porting/riscv*` target among 26 named ports; falls through to untested generic `porting/posix` path. Transitive deps (TFLite Micro, ruy, gemmlowp) individually are packaged for Ubuntu 26.04 riscv64, but the SDK itself has never been built/tested on riscv64 by anyone traceable. See `project-reports/edge-impulse-inferencing-sdk-(c++).md` (readiness: orange) |
| `image` (Rust crate) | JPEG/PNG/GIF decode for video/image frame handling | Not a Debian/Ubuntu package (crates.io only) | Not independently researched | crates.io | Pure/mostly-pure-Rust codecs; expected to build via Tier-2 riscv64gc target with no known blocker, but not verified against upstream issue tracker |
| `tokio` | Async runtime | Not a Debian/Ubuntu package (crates.io only) | Not independently researched | crates.io | Low risk - no SIMD/crypto/allocator surface exercised by this plugin's feature set |
| `regex` (transitive) | Pattern matching with SIMD-accelerated `memchr` internals | Not a Debian/Ubuntu package (crates.io only) | Not researched | crates.io | Not independently verified for this task |

**Deep-dive - critical dependency (`edge-impulse-ffi-rs` -> Edge Impulse Inferencing SDK C++):** This is the single hard blocker in the whole dependency chain. The default feature set (`ffi` is in `default = [...]`) makes this the default build path for the plugin. It has an unconditional CMake fallback that would silently link x86_64 prebuilt TFLite binaries on a riscv64 build (rather than failing cleanly), has zero CI on any architecture, and has never been built or tested on riscv64 by anyone traceable in the available evidence.

**OS-level C library dependencies (GStreamer, ORC, Cairo, Pango, HarfBuzz, FreeType):** all present in Ubuntu 26.04 riscv64 (resolute) and do not block a native riscv64 build via `apt`.

**Rust-crate dependencies (`rten`, `ocrs`, `edge-impulse-runner`, `image`, `tokio`, `regex`):** not Ubuntu binary packages - they build from crates.io source via `cargo`/`rustc`, both of which are available in Ubuntu 26.04 riscv64. Their riscv64 viability is governed by Rust's Tier-2 `riscv64gc-unknown-linux-gnu` target, not Debian packaging.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue or PR exists | N/A | N/A | The repository currently has 0 open issues and 3 open PRs (#27, #28, #48), none RISC-V related. The only 2 closed issues in the repo's entire history (#8 "Make text overlay font size relative to output resolution", closed 2025-07-29; #49 "Planned element: edgeimpulsedynamiccrop", closed 2026-03-25) are unrelated to RISC-V, performance, or correctness on any architecture |

**Correctness bugs:** None found, on any architecture. No issue or PR in this repository mentions NaN, floating-point problems, or riscv64 in any form.

**Performance benchmarks:** None found. No RISC-V (riscv64) benchmark data for this project exists in any searched source. The project's README contains no performance numbers at all, RISC-V or otherwise - only a generic "Slow Inference" troubleshooting note suggesting input-resolution reduction, with no metrics.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer, issue, or PR has ever raised or rejected a RISC-V port proposal, because no such proposal has ever been made.

**Technical blockers:**
1. No riscv64 Rust cross-compilation toolchain plumbing exists in the repo's Docker/CI infrastructure (only aarch64 is documented; see Section 5).
2. The default `ffi` feature's transitive dependency chain (`edge-impulse-runner` -> `edge-impulse-ffi-rs` -> Edge Impulse Inferencing SDK C++) has an unconditional x86_64 fallback in its CMake build logic and zero riscv64 CI/testing of any kind (see Section 9).

**Organizational blockers:**
1. Single-maintainer project (~96% of commits by one individual) with no formal contribution/governance process for proposing new platform ports (see Section 1).
2. Not a RISE member and no RISE blog post, RFP, or funded work references this project or its immediate GStreamer/Edge Impulse dependency chain.
3. Zero GitHub releases exist for any architecture, meaning there is no established release-engineering process this project could extend to riscv64 even if the technical blockers were resolved.

**Acceptance probability:** Data not available for a quantified estimate. Qualitatively: the absence of any tier policy, contribution process, or prior architecture-port precedent (only aarch64 exists, and even that has no dedicated CI) means a riscv64 port would be entering a project with no established process for accepting new platform work of any kind.

## 13. Readiness Assessment

- **Color:** orange (plain "no upstream CI" base case - no upstream riscv64 CI exists, and no distribution channel of any kind (Ubuntu, PyPI, Arch RISC-V, or a GitHub release) ships this project for any architecture, so the distribution floor described in the color model does not apply - there is nothing to floor to)
- **Release provider:** none
- **Justification:** No upstream CI builds or tests riscv64 - all three GitHub Actions workflows run exclusively on `ubuntu-latest` (x86_64) with no matrix, no QEMU, and no cross-compile target ([`ci.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/ci.yml)). No release of any kind exists for any architecture ("There aren't any releases here" - [releases page](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/releases)), and no distribution channel (Ubuntu 26.04 riscv64, PyPI, Arch Linux RISC-V) packages this project under any plausible name, so the distribution floor cannot upgrade the grade to yellow.
- **Pending work that could change the grade:** None identified. There are no open PRs, issues, or RISE involvement of any kind related to RISC-V for this project. The 3 currently open PRs (#27, #28, #48) are unrelated to RISC-V. A grade change would require new work to be initiated from zero: no in-flight activity exists to track.

## 14. Investment Analysis

RISE has not funded or performed any work on this project - no blog post, RFP, GitHub org (`riseproject-dev`, 25 repos checked), or wiki reference ties RISE to "GStreamer Plugin for Edge Impulse" in any way. All work items below are therefore fully unaddressed and not already covered by RISE.

### 14.1 Functional Enablement

- Add `riscv64gc-unknown-linux-gnu` Rust target and toolchain plumbing to the Docker/CI infrastructure, mirroring the existing `aarch64-unknown-linux-gnu` path (Dockerfile stage, `docker-compose.yml` service, `.cargo/config.toml` linker entry, `rustup target add`).
- Resolve the `edge-impulse-ffi-rs`/Edge Impulse Inferencing SDK (C++) unconditional x86_64 CMake fallback so a riscv64 build either produces a correct native build or fails cleanly instead of silently linking wrong-ISA binaries. This is a prerequisite for the plugin's default `ffi` feature to function on riscv64 at all, and depends on upstream work in `edge-impulse-runner` and the Edge Impulse Inferencing SDK (C++) tracked separately (see `project-reports/edge-impulse-runner-(rust).md` and `project-reports/edge-impulse-inferencing-sdk-(c++).md`).
- Verify the pure-Rust `ocr` feature path (`rten`/`ocrs`) builds cleanly under the Tier-2 riscv64gc target; no known blocker but unverified in practice.

### 14.2 Performance Optimization

- Not in scope as a primary deliverable for this plugin itself (it is glue code, not an optimization-purpose library; see Section 13). Any performance gap traces to dependencies: `rten`/`ocrs` scalar-only OCR inference (no RVV backend documented anywhere in `rten`), and Cairo/pixman scalar-only compositing (unmerged `pixman-rvv.c`). Closing these requires upstream work in `rten` and `pixman` respectively, outside this project's own control.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `ci.yml` (build + `cargo test`, matching the existing amd64 job's feature-combination matrix). Given no native riscv64 GitHub-hosted runner exists in this project's current CI, this would require either QEMU emulation or a RISE-provided riscv64 runner - neither is currently referenced anywhere in the repo's workflows.

### 14.4 Ecosystem Enablement

Not applicable - this project does not have a significant dependent package ecosystem (npm, Maven, Python packages depending on it) that would require separate riscv64 enablement; Section 10 is omitted per the report's scoping rule.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 Rust target + toolchain to Docker/CI, mirroring existing aarch64 path | 1-2 | Project maintainer or contributor | High |
| Functional | Fix `edge-impulse-ffi-rs` CMake x86_64 fallback for riscv64 (upstream dependency work, tracked separately) | Data not available - depends on `edge-impulse-runner`/Edge Impulse Inferencing SDK (C++) scope, see those reports | Edge Impulse Inc. / dependency maintainers | Critical (blocks default feature set) |
| Functional | Verify `ocr` (pure-Rust) feature builds on riscv64gc target | 0.5-1 | Project maintainer or contributor | Medium |
| CI/CD | Add riscv64 CI job (build + test) to `ci.yml` | 1-2 (plus runner provisioning, unscoped) | Project maintainer or contributor | High |
| Performance | Track upstream `rten` RVV backend and `pixman-rvv.c` merge status (no work owned by this project) | N/A - upstream dependency work | `rten`/`pixman` maintainers | Low (not this project's responsibility) |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [GStreamer Plugin for Edge Impulse - repository](https://github.com/edgeimpulse/gst-plugins-edgeimpulse)
- [GStreamer Plugin for Edge Impulse - releases page](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/releases) ("There aren't any releases here")
- [`.github/workflows/ci.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/ci.yml)
- [`.github/workflows/docs.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/docs.yml)
- [`.github/workflows/e2e.yml`](https://github.com/edgeimpulse/gst-plugins-edgeimpulse/blob/main/.github/workflows/e2e.yml)
- [Ubuntu package search - resolute, gstreamer-plugin-for-edge-impulse](https://packages.ubuntu.com/search?keywords=gstreamer-plugin-for-edge-impulse&suite=resolute&searchon=names&section=all) ("Sorry, your search gave no results")
- [PyPI JSON API - gstreamer-plugin-for-edge-impulse](https://pypi.org/pypi/gstreamer-plugin-for-edge-impulse/json) (HTTP 404)
- [RISE GitLab wheel builder - gstreamer-plugin-for-edge-impulse](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/gstreamer-plugin-for-edge-impulse/) (redirects to PyPI 404)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at)
- [RISE Project blog](https://riseproject.dev/blog) / [RSS feed](https://riseproject.dev/feed/)
- [riseproject.gitlab.io Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- `project-reports/gstreamer.md` (dependency: GStreamer)
- `project-reports/cairo.md` (dependency: Cairo)
- `project-reports/harfbuzz.md` (dependency: HarfBuzz)
- `project-reports/freetype.md` (dependency: FreeType)
- `project-reports/edge-impulse-runner-(rust).md` (dependency: edge-impulse-runner, readiness: orange)
- `project-reports/edge-impulse-inferencing-sdk-(c++).md` (dependency: Edge Impulse Inferencing SDK C++, readiness: orange)
- `robertknight/rten` GitHub repository (issue search for "riscv": 0 results)
- Local clone used for direct file inspection: `/home/user/edgeimpulse/gst-plugins-edgeimpulse` (HEAD `c763395b638eaef46b8ff1e8f58f8e2de057b692`, 2026-07-27)
