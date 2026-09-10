---
title: Edge Impulse FFI (Rust)
parent: Project Reports
color: orange
dependencies:
  - name: TensorFlow Lite Micro (TFLM)
    relation: build-dependency
    criticality: critical
  - name: TensorFlow Lite
    relation: build-dependency
    criticality: optional
  - name: XNNPACK
    relation: build-dependency
    criticality: optional
  - name: cpuinfo
    relation: build-dependency
    criticality: optional
  - name: ruy
    relation: build-dependency
    criticality: optional
  - name: FlatBuffers
    relation: build-dependency
    criticality: optional
  - name: farmhash
    relation: build-dependency
    criticality: optional
  - name: pthreadpool
    relation: build-dependency
    criticality: optional
  - name: ONNX
    relation: build-dependency
    criticality: optional
  - name: Apache TVM / microTVM
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="edge-impulse-ffi-(rust)" %}

# Edge Impulse FFI (Rust)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse FFI (Rust)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse FFI (Rust) ([edgeimpulse/edge-impulse-ffi-rs](https://github.com/edgeimpulse/edge-impulse-ffi-rs)) is a Rust crate providing a safe Foreign Function Interface layer over Edge Impulse's C++ inference SDK, allowing Rust applications to run Edge Impulse-trained machine learning models. It is licensed under the Clear BSD License (BSD-3-Clause-Clear), copyright "EdgeImpulse Inc." (2025).

**Governance:** No foundation affiliation. Not part of CNCF, Linux Foundation, Eclipse, or any neutral governance body - this is a single-vendor corporate repository. No governance artifacts exist: no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, CONTRIBUTING.md, PLATFORMS.md, or SUPPORT.md file is present anywhere in the repository. Issue creation is restricted to organization members, meaning there is no public intake process for feature requests such as a new architecture port.

**Corporate ownership:** Owned by Edge Impulse Inc., which was acquired by Qualcomm Technologies, Inc. in March 2025 and now operates as "Edge Impulse, a Qualcomm company." Qualcomm Technologies, Inc. is a RISE Project Premier Member (confirmed at [riseproject.dev/members](https://riseproject.dev/members/)), but Edge Impulse itself is not separately listed as a RISE member - any RISC-V ecosystem standing would have to run through its parent Qualcomm, and no evidence of that connection materializing for this specific repository was found.

**Contributor base:** Full commit history (72 commits, first commit 2025-07-05, latest 2026-07-23) shows ~85% of commits (61/72) from a single engineer, Fernando Jimenez Moreno (GitHub `ferjm`, bio: "Principal Engineer at @edgeimpulse and @qualcomm"). The remaining commits come from two other Edge Impulse/Qualcomm employees (Raul James, 7 commits; Mateusz Majchrzycki, 4 commits). No outside/community committers appear anywhere in history.

**Community culture on new ports:** Cannot be characterized as open or welcoming in any documented sense - there is no CONTRIBUTING guide, no governance document, and issue filing is disabled for non-members. A new architecture port would have to originate from Edge Impulse/Qualcomm engineering itself; nothing in the commit, issue, or PR history indicates such a request has ever been made or is in progress.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-07-05 | First commit to repository | [Repository history](https://github.com/edgeimpulse/edge-impulse-ffi-rs) |
| 2025-07-12 | PR #2 opened ("Link with standard lib environment on more environments/targets"), still open as of research date | [edgeimpulse/edge-impulse-ffi-rs](https://github.com/edgeimpulse/edge-impulse-ffi-rs) |
| 2025-11-18 | PR #6 merged ("Add x86_64 support") - the only new-architecture work merged in this repo's history | [edgeimpulse/edge-impulse-ffi-rs](https://github.com/edgeimpulse/edge-impulse-ffi-rs) |
| 2026-07-23 | Latest commit (HEAD at research time: `81ff65c15f15657c609fdbcc8788b5015648cac3`) | [Repository history](https://github.com/edgeimpulse/edge-impulse-ffi-rs) |

**No RISC-V port exists or has ever been attempted.** An exhaustive search of the complete 72-commit history (`git log --grep`, pickaxe `-S` search on "riscv"/"risc"/"rv32"/"rv64" across all commits) found zero RISC-V references. The one pickaxe hit ("Version tflite binaries") was a false positive on a binary blob. The repository's own README Platform Support table lists only: macOS ARM64/x86_64, Linux x86, Linux ARM64, Linux ARMv7 - no RISC-V row.

**Is it fully upstream?** Not applicable - there is no downstream/fork riscv64 port to compare against upstream. Zero work of any kind has been done, upstream or otherwise.

## 3. Upstream Support Tier

No formal tier policy exists. There is no published support-tier document (Tier 1/2/3 or similar) anywhere in the repository or its documentation.

| Architecture | CI builds | CI tests | Official release/binary | Documented support |
|---|---|---|---|---|
| amd64 (linux-x86) | No CI exists for any architecture (see Section 7) | No CI | No GitHub releases exist (source-only, 0 tags) | Explicit branch in `build.rs`, prebuilt libs present, documented in README |
| arm64 (linux-aarch64, incl. Jetson/TI/Renesas aliases) | No CI exists | No CI | No GitHub releases | Explicit branch, prebuilt libs, Docker cross-compilation tooling, dedicated example script (`run-aarch64-example.sh`), most-documented target |
| armv7 (linux-armv7) | No CI exists | No CI | No GitHub releases | Explicit branch, prebuilt libs, documented |
| riscv64 | No CI exists | No CI | No GitHub releases | **Not supported at any level** - absent from `build.rs` platform dispatch, absent from README, absent from prebuilt library directories |

Note: the repository has **no GitHub Actions workflows, no releases, and no tags at all** (confirmed via direct filesystem inspection of a clone and via the GitHub releases page, which states "There aren't any releases here"). This means even amd64 and arm64 lack CI-verified or officially released binaries - the entire project is source-only. RISC-V's disadvantage relative to arm64/amd64 is therefore specifically in source-level platform recognition and cross-compilation tooling, not in CI or release infrastructure (which is absent uniformly).

## 4. Technical Architecture and RISC-V-Specific Subsystems

This crate itself contains no JIT, no hand-written SIMD, no crypto, no GC, and no inline assembly - it is a Rust FFI wrapper. The architecture-specific surface is entirely in `build.rs` (2070 lines), which selects which prebuilt native libraries to link and which C++ preprocessor flags to pass when compiling the vendored Edge Impulse C++ SDK / TensorFlow Lite glue.

**`build.rs` platform-detection logic (lines 1718-1762)** enumerates every supported target explicitly:

```rust
let target_platform = if env::var("TARGET_MAC_ARM64").is_ok() { "mac-arm64" }
    else if env::var("TARGET_MAC_X86_64").is_ok() { "mac-x86_64" }
    else if env::var("TARGET_LINUX_X86").is_ok() { "linux-x86" }
    else if env::var("TARGET_LINUX_AARCH64").is_ok() || target.contains("aarch64-unknown-linux-gnu") { "linux-aarch64" }
    else if env::var("TARGET_LINUX_ARMV7").is_ok() { "linux-armv7" }
    else if env::var("TARGET_JETSON_NANO").is_ok() { "linux-jetson-nano" }
    else if /* Jetson Orin, Renesas RZ/V2L, RZ/G2L, TI AM68PA/AM62A/AM68A/TDA4VM */ { "linux-aarch64" }
    else {
        if cfg!(target_os = "macos") { ... }
        else if cfg!(target_os = "linux") {
            if cfg!(target_arch = "aarch64") { "linux-aarch64" }
            else if cfg!(target_arch = "arm") { "linux-armv7" }
            else { "linux-x86" }   // riscv64 lands here
        } else { "linux-x86" }
    };
```

A riscv64 host or cross-compile target falls through every explicit branch and is silently misclassified as `linux-x86`, meaning `build.rs` would attempt to select x86_64 prebuilt TensorFlow Lite static libraries for a riscv64 build. This is not a graceful failure with a clear "unsupported architecture" error - it is a silent mis-detection that would fail at link time (mixing x86_64 and riscv64 object code), source: [`build.rs`, edgeimpulse/edge-impulse-ffi-rs](https://github.com/edgeimpulse/edge-impulse-ffi-rs).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Platform-detection branch in `build.rs` | Explicit (`linux-x86`) | Explicit (`linux-aarch64`, incl. Jetson/Renesas/TI aliases) | **Missing** - falls through to `linux-x86` default |
| Prebuilt TFLite static libraries (`tflite/<platform>/`) | Present (`tflite/linux-x86/`) | Present (`tflite/linux-aarch64/`) | **Missing** - no `tflite/linux-riscv64/` directory exists |
| Rust `cfg(target_arch=...)` gates | None needed (falls through to default) | None found in `src/` or `ffi_glue/` | None exist |
| Cross-compilation tooling | N/A (native) | Docker + `.cargo/config.toml` toolchain entries + example script | **Missing entirely** |

The critical numerics/SIMD/JIT dependency surface (pulled in at C++ build time via `USE_FULL_TFLITE`) is documented in Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

**Toolchain and dependencies:** `Cargo.toml` runtime deps are `libc`, `serde`; build-deps are `bindgen`, `cc`, `ureq`, `serde_json`, `zip`, `regex` - none are architecture-critical on their own. The actual native build happens via `build.rs` + `ffi_glue/CMakeLists.txt`, compiling Edge Impulse's C++ SDK.

**Cross-compilation infrastructure that exists** covers only aarch64:
- `Dockerfile` (repo root) - base image `rust:1.90-slim-bullseye`, installs `gcc-aarch64-linux-gnu`/`g++-aarch64-linux-gnu`, runs `rustup target add aarch64-unknown-linux-gnu`, sets `CC_aarch64_unknown_linux_gnu`/`CXX_aarch64_unknown_linux_gnu`, builds via `cargo build --target aarch64-unknown-linux-gnu --release`.
- `.cargo/config.toml`: `[target.aarch64-unknown-linux-gnu]` linker/ar entries.
- `docker-compose.yml` exposes an `aarch64-build` service.

**Supported `TARGET_*` env vars** (from `build.rs`): `TARGET_MAC_ARM64`, `TARGET_MAC_X86_64`, `TARGET_LINUX_X86`, `TARGET_LINUX_AARCH64`, `TARGET_LINUX_ARMV7`, `TARGET_JETSON_NANO`, `TARGET_JETSON_ORIN`, `TARGET_RENESAS_RZV2L`, `TARGET_RENESAS_RZG2L`, `TARGET_AM68PA`, `TARGET_AM62A`, `TARGET_AM68A`, `TARGET_TDA4VM`. No RISC-V entry exists among them.

**riscv64 build path:** Does not exist. No `cmake`/`configure` command, no toolchain version requirement, no `-DUSE_X=OFF`-style flag, no QEMU usage, and no `Dockerfile.riscv64` are documented or present. There is no `BUILDING.md`, `INSTALL`, `docs/` directory, top-level `CMakeLists.txt`, or `cmake/` toolchain directory referencing RISC-V. A GitHub code search for `riscv64 repo:edgeimpulse/edge-impulse-ffi-rs filename:Dockerfile` returned 0 results.

**Known build failures:** None documented (0 issues exist in the repository at all - see Section 11), but based on direct source inspection, attempting a riscv64 build today would silently select the `linux-x86` platform branch in `build.rs` and attempt to link x86_64 prebuilt libraries, which would fail at link time.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Documented in README platform table | Yes | Yes | No |
| `build.rs` explicit target branch | Yes | Yes | No (falls through to x86 default) |
| Prebuilt TFLite libraries | Yes | Yes | No |
| Docker cross-compile support | N/A (native) | Yes | No |
| Example script | N/A | Yes (`run-aarch64-example.sh`) | No |
| Full-TFLite build (`USE_FULL_TFLITE=1`) | Presumed functional (no test evidence) | Presumed functional (no test evidence) | Would require compiling TensorFlow Lite + XNNPACK from source via CMake since no `tflite/linux-riscv64/` prebuilt directory exists |

**Functional gap:** riscv64 cannot currently produce a working build via any documented or automated path. A user would have to add a new `TARGET_LINUX_RISCV64` branch to `build.rs`, install/configure a `riscv64-linux-gnu` cross toolchain plus a `.cargo/config.toml` entry, and either provide prebuilt riscv64 TFLite libraries or force a from-source CMake build.

**Performance gap:** Not applicable in the sense of "missing SIMD in this crate" since the crate itself has no SIMD code; the performance gap is entirely inherited from the C++/dependency layer (see Section 9) - specifically ruy's scalar-only matmul path and XNNPACK's open RVV correctness issues.

**Security hardening gap:** Data not available: no riscv64-specific hardening documentation, fuzzing, or sanitizer configuration was found for this project on any architecture (the project has no CI at all).

**NaN / floating-point semantics issues:** Data not available: no project-specific NaN/floating-point issue reports exist for this crate (0 issues total). At the dependency level, [ONNX Runtime issue #20030](https://github.com/microsoft/onnxruntime/issues/20030) documents an accuracy collapse (15% vs 86%) on non-ratified RVV0.7 hardware, relevant only if `USE_ONNX=1` is selected.

## 7. CI/CD Infrastructure

**No CI of any kind exists for this repository - not just no riscv64 CI.** Confirmed via direct clone inspection (HEAD `81ff65c15f15657c609fdbcc8788b5015648cac3`):
- `.github/workflows/` directory does not exist (`ls .github` returns "No such file or directory").
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci`, `azure-pipelines`, or `.cirrus.yml` files exist anywhere in the tree.
- The only YAML file in the repository is `docker-compose.yml`, a local dev-container definition, not a CI pipeline - it contains no riscv reference.
- A full-tree case-insensitive grep for "riscv" and "risc-v" across every file returns zero matches.

No RISE runners are used (there is no CI to use them in). No hardware of any kind is used for testing this project.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No | No | No |
| Tests run | No | No | No |
| Release-blocking | N/A | N/A | N/A |
| Runner type | N/A | N/A | N/A |

## 8. Distribution and Release Status

**No release artifacts exist for this project in any form, on any architecture:**
- **GitHub Releases:** "There aren't any releases here" ([edgeimpulse/edge-impulse-ffi-rs/releases](https://github.com/edgeimpulse/edge-impulse-ffi-rs/releases)). Confirmed independently via `git tag --list` on a local clone, which returned zero tags.
- **PyPI:** `https://pypi.org/pypi/edge-impulse-ffi-(rust)/json` and `https://pypi.org/pypi/edge-impulse-ffi/json` both return HTTP 404 Not Found. No package exists under either name.
- **RISE GitLab wheel-builder mirror:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-ffi-(rust)/` redirects to PyPI, which 404s. Not listed among the 81 supported packages at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/).
- **Ubuntu packages.ubuntu.com (26.04 Resolute):** No match for "Edge Impulse FFI (Rust)" or "edge-impulse-ffi" under any architecture, including riscv64.
- **Arch Linux RISC-V port ([archriscv.felixc.at](https://archriscv.felixc.at/)):** No package listing found.
- **Project graph SPARQL query** against Ubuntu 26.04 "resolute" riscv64 binary packages for plausible names: empty result set (0 bindings).

**What a user must do to get a working binary today:** Clone the repository and build from source (`cargo build --release`), which is the only path that exists for any architecture since there are no official releases at all. For riscv64 specifically, a user would first need to patch `build.rs` to add riscv64 platform detection (see Section 5) before a build could even be attempted.

## 9. Dependencies

The crate's own `Cargo.toml` is thin and non-critical for riscv64 purposes. The numerics/SIMD/JIT-critical dependency surface is pulled in at C++ build time via `ffi_glue/CMakeLists.txt` when `USE_FULL_TFLITE=1` is set.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| TensorFlow Lite (full) | Inference engine (`-ltensorflow-lite`) | Builds from source; Ubuntu-packaged for riscv64 (`libtensorflow-lite-dev`, suite=resolute) | No dedicated upstream riscv64 CI found | Ubuntu 26.04 riscv64 package exists | Inherits all sub-dependency issues below |
| XNNPACK | SIMD NN kernel backend (`-lXNNPACK`) | Green - RVV kernels merged steadily 2022-2026, dedicated `cmake-linux-riscv64` CI job; RV32GC/RV64GC explicitly supported | Broken: [issue #9886](https://github.com/google/XNNPACK/issues/9886) - 100+ RVV FP16 test failures on QEMU (open); [issue #8052](https://github.com/google/XNNPACK/issues/8052) transpose-test cross-compile failure (open) | No GitHub releases (source-only); Ubuntu `libxnnpack-dev` is a ~19-month-stale Nov-2024 snapshot predating all 2025-26 RVV kernels | Root cause of #9886: unconditional Zvfh dispatch without cpuinfo support |
| cpuinfo | CPU-feature detection for XNNPACK/ruy dispatch | Green (QEMU + Android CI) | Mostly green; 1 flaky test ([googletest#3756](https://github.com/google/googletest/issues/3756)) | No GitHub releases; Ubuntu/Debian packages built from a stale Sept-2025 snapshot | [PR #397](https://github.com/pytorch/cpuinfo/pull/397) (28 ISA extensions, vendor/uarch, cache) open/unreviewed |
| ruy | Matrix-multiply backend for TFLite | Scalar-only (`kStandardCpp`) - no RVV kernel exists at all, no port ever initiated | No riscv64 CI; correct-but-unoptimized | No upstream releases; Ubuntu/Debian package ships scalar path only | Zero RVV work exists - pure performance gap |
| FlatBuffers | Model-format serialization (`-lflatbuffers`) | Green - pure C++, no SIMD/JIT | Green | Debian/Ubuntu packages exist; no official riscv64 `flatc` binary in GH releases | None blocking |
| farmhash | Non-crypto hashing | Green - portable scalar fallback | Green | No upstream releases; Debian/Ubuntu ship it | Zero riscv64 issues ever filed; project dormant since 2019 but functional |
| pthreadpool | Thread pool for parallel kernel dispatch | Green - architecture-agnostic C | Green | Ubuntu 26.04 riscv64 packages exist | Zero riscv64 issues/PRs in google/pthreadpool |
| ONNX Runtime (optional, `USE_ONNX=1`) | Alternative inference engine | Community-driven RVV work (SiFive/Nuclei/ZTE/Andes); burst of kernel merges Apr-Jun 2026 | [Issue #20030](https://github.com/microsoft/onnxruntime/issues/20030) open - accuracy collapse (15% vs 86%) on non-ratified RVV0.7 hardware; [issue #26187](https://github.com/microsoft/onnxruntime/issues/26187) open - `DeviceDiscoveryTest.HasCpuDevice` fails on riscv64/musl | No official Microsoft riscv64 binary/wheel; Debian sid package is 4 releases behind | Port dormant Jan 2024-Mar 2026, then concentrated burst |
| Apache TVM (optional, `USE_TVM=1`) | ML-compiler JIT/AOT codegen backend | LLVM RVV backend solid, but TVM's own RVV vectorization is actively regressing | 13 open perf-regression bugs ([#18560](https://github.com/apache/tvm/issues/18560)-[#18572](https://github.com/apache/tvm/issues/18572)): RVV-vectorized ops run slower than scalar on SpacemiT K1-X hardware; only 1 of 13 partially fixed | No compiled binaries for any arch (source-tarball-only policy); no riscv64 PyPI wheel; no distro package at all | No riscv64 CI/Jenkinsfile/Docker image exists (deleted 2022) |
| TensorFlow Lite Micro (TFLM, default engine) | Bare inference engine (default build, no `USE_FULL_TFLITE`) | riscv32 Tier-2 in-tree with CI; riscv64 has no official support - community fork only (`cordawyn/tflite-micro`, branch `riscv64-generic`) | [Issue #3107](https://github.com/tensorflow/tflite-micro/issues/3107) (riscv64 support offer) closed stale after 8 months, zero maintainer engagement | Zero binary releases of any kind | No riscv64 tracking issue open; relies on scalar reference kernels |

**Overall dependency risk:** The default build (TFLM) compiles only via an unmerged community fork with no official riscv64 support. A `USE_FULL_TFLITE=1` build would, per package availability alone, build and link on Ubuntu 26.04 riscv64 (all core libraries - tensorflow-lite, XNNPACK, cpuinfo, ruy, flatbuffers, farmhash, pthreadpool - are packaged), but XNNPACK's open FP16/RVV correctness bug ([#9886](https://github.com/google/XNNPACK/issues/9886)) and stale distro packages mean numerical correctness is not guaranteed without building from a recent source commit. This is moot for `edge-impulse-ffi-rs` today regardless, since the crate's own `build.rs` has no riscv64 platform branch at all (Section 4) and no `tflite/linux-riscv64/` prebuilt-library directory exists.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | (none) | N/A | N/A | The repository has zero issues and zero riscv-related PRs. GitHub Issues page shows "Issues 0" ([edgeimpulse/edge-impulse-ffi-rs/issues](https://github.com/edgeimpulse/edge-impulse-ffi-rs/issues)), confirmed via direct fetch, not just keyword search. |

No correctness bugs to highlight for this project itself. Correctness/performance risk is entirely inherited from dependencies (Section 9): [XNNPACK #9886](https://github.com/google/XNNPACK/issues/9886) (RVV FP16 test failures), [ONNX Runtime #20030](https://github.com/microsoft/onnxruntime/issues/20030) (accuracy collapse on non-ratified RVV0.7 hardware), and [Apache TVM #18560-#18572](https://github.com/apache/tvm/issues/18560) (13 open RVV performance regressions) - all conditional on optional backend flags this crate does not enable by default.

## 12. Objections and Upstream Blockers

**Stated objections:** None found - there is no record of any riscv64 request being made to this project, so there is no documented objection to evaluate.

**Technical blockers:**
- No riscv64 branch in `build.rs` platform dispatch (Section 4) - would need to be added from scratch.
- No `tflite/linux-riscv64/` prebuilt library directory - either prebuilt libraries would need to be produced, or the build would need to compile TensorFlow Lite + XNNPACK from source via CMake.
- No riscv64 cross-compilation tooling (Docker/toolchain config) exists to build from - only aarch64 has this.
- Dependency-level blockers if `USE_FULL_TFLITE=1` or `USE_ONNX=1` or `USE_TVM=1` paths are needed: XNNPACK RVV FP16 correctness bug, ONNX Runtime RVV0.7 accuracy bug, TVM RVV performance regressions (Section 9).

**Organizational blockers:**
- No public contribution path exists (no CONTRIBUTING.md, issue filing restricted to org members) - an external riscv64 port could not be proposed via the normal open-source channels this project would use if it had them.
- ~85% of commits from a single Qualcomm/Edge Impulse engineer - the project has no demonstrated capacity to absorb externally-contributed platform work; the one architecture addition in its history (PR #6, x86_64 support, merged 2025-11-18) was presumably internal, not community-sourced.

**Acceptance probability:** Data not available for a quantified estimate. Qualitatively: low near-term probability absent a direct business/customer driver, given (a) no external contribution path exists, (b) the maintaining organization (Edge Impulse/Qualcomm) has shown no RISC-V-directed activity for this repo specifically despite Qualcomm's own RISE Premier Membership, and (c) the underlying dependency stack (ruy scalar-only, TVM regressions, XNNPACK correctness bugs) would need separate upstream fixes before a riscv64 full-TFLite build would be trustworthy in production.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI)
- **Release provider:** none (no GitHub releases, no PyPI package, no distro packages, no third-party builds of any kind exist for this project on any architecture)
- **Optimization gap:** N/A - this is a project-purpose FFI/binding crate, not an optimization-purpose project. Its value proposition (safe Rust bindings over the Edge Impulse C++ SDK) does not depend on RISC-V-specific optimization work within the crate itself; any performance characteristics are inherited entirely from the linked inference-engine dependencies (Section 9).

**Justification:** No `.github/workflows/` directory or any other CI configuration exists in this repository at all (confirmed by direct filesystem inspection of a clone, HEAD `81ff65c`), so there is no upstream riscv64 CI to evaluate - the primary color determinant per the color model's Step 1 table ("orange = no upstream riscv64 CI"). This is corroborated by zero riscv64 mentions in source, docs, issues (0 total), PRs (0 riscv-related), commits (0 of 72), and by the complete absence of a riscv64 branch in `build.rs`'s platform-detection logic ([`build.rs`, edgeimpulse/edge-impulse-ffi-rs](https://github.com/edgeimpulse/edge-impulse-ffi-rs)). The distribution floor does not raise this color because no Linux distribution, PyPI package, or third-party build channel ships this project for riscv64 (or for any architecture) - the project has zero GitHub releases and zero git tags, confirmed via [the releases page](https://github.com/edgeimpulse/edge-impulse-ffi-rs/releases) ("There aren't any releases here") and independently via a local `git tag --list`. Red was considered but rejected per the color model's rule that red requires *confirmed* breakage (a documented crash, an actual failed build report, or an explicit upstream unsupported-architecture statement) - here the evidence of the `linux-x86` fallthrough is a source-code-level inference from `build.rs`, not an observed failure, and no issue or PR documents an actual attempted riscv64 build. Grey was also rejected: this is not an unknown-unknown (extensive research was performed and returned definitive negative results across every channel) and RISC-V is not architecture-exclusive-inapplicable to this project's purpose.

**Pending work that could change the grade:** None identified. The only RISE-project touchpoint found is an unactioned queue-file entry in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` marking this project as awaiting a RISC-V readiness assessment (not yet written prior to this report, and not a funded engineering effort). No open PR, no RISE blog post, no RISE wheel-builder listing, and no CI/runner integration exists for this project. The one open PR in the repository (#2, "Link with standard lib environment on more environments/targets") broadens existing (non-RISC-V) targets and does not touch RISC-V.

## 14. Investment Analysis

RISE has done and funded no work whatsoever on this specific project (Section 2, Section 12). The only RISE touchpoint is the unactioned backlog queue entry noted above - it represents zero completed or in-progress engineering. All investment areas below are therefore fully unaddressed and must be sized from scratch, though several of the underlying dependency-level RVV gaps (XNNPACK, ONNX Runtime, TVM, ruy) are separately tracked in their own project reports and should not be re-sized here beyond what is needed to unblock this crate specifically.

### 14.1 Functional Enablement

Work needed to get `edge-impulse-ffi-rs` building on riscv64 at all:
1. Add a `TARGET_LINUX_RISCV64` branch to `build.rs`'s platform-detection logic (currently falls through to `linux-x86`, Section 4).
2. Establish a riscv64 cross-compilation toolchain path (`.cargo/config.toml` entry, `riscv64-linux-gnu-gcc`/`g++`, analogous to the existing aarch64 Docker setup).
3. Decide the default-engine strategy: either (a) get riscv64 support merged/upstreamed into `tflite-micro` proper (currently only a stale community fork exists, [issue #3107](https://github.com/tensorflow/tflite-micro/issues/3107) closed stale) so the default TFLM engine works, or (b) target `USE_FULL_TFLITE=1` and build TensorFlow Lite + XNNPACK from source via CMake since no `tflite/linux-riscv64/` prebuilt directory exists.
4. Validate the resulting binary against Edge Impulse's own C++ SDK test/example suite (no existing test suite risk data exists for this crate on any architecture, since it has no CI at all).

### 14.2 Performance Optimization

Not applicable to this crate directly (no SIMD/JIT code within it), but if `USE_FULL_TFLITE=1` is the chosen path, this crate's performance ceiling is capped by ruy's scalar-only matmul path (no RVV kernel exists at all, estimated 15-25 person-weeks to add per the ruy project report) and by resolving XNNPACK's open RVV FP16 correctness issue ([#9886](https://github.com/google/XNNPACK/issues/9886)) before results can be trusted in production.

### 14.3 CI/CD Infrastructure

The project has no CI at all for any architecture. Establishing riscv64 CI here means first establishing *any* CI for this repository (a GitHub Actions workflow building at minimum linux-x86/linux-aarch64/linux-riscv64, ideally on RISE-hosted native riscv64 runners per [riseproject.dev's RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) - this is greenfield work, not an incremental riscv64 addition to existing infrastructure.

### 14.4 Ecosystem Enablement

Not applicable. This is a standalone Rust crate with no dependent package ecosystem of its own (Section 10 omitted per report guidelines - it is a leaf FFI binding, not a platform with plugins/extensions that third parties build on top of).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `build.rs` platform dispatch + cross-toolchain config | 1-2 | Edge Impulse/Qualcomm engineering (no external contribution path exists) | Critical |
| Functional | Establish working default-engine (TFLM) path for riscv64 - either upstream `tflite-micro` riscv64 support or adopt community fork | 4-8 (depends on whether upstreaming into tflite-micro itself is pursued; see tflite-micro project report) | Edge Impulse/Qualcomm + TensorFlow upstream | High |
| Functional | Produce/validate `USE_FULL_TFLITE=1` riscv64 build path (from-source CMake, since no prebuilt `tflite/linux-riscv64/` exists) | 2-4 | Edge Impulse/Qualcomm engineering | Medium |
| Performance | Add RVV kernels to ruy (dependency-level, not this crate) | 15-25 (tracked separately, see ruy project report) | Google/ruy upstream | Medium |
| Performance | Resolve XNNPACK RVV FP16 correctness bug [#9886](https://github.com/google/XNNPACK/issues/9886) before trusting `USE_FULL_TFLITE` results | Data not available (tracked upstream, not this project's scope) | Google/XNNPACK upstream | Medium |
| CI/CD | Stand up any CI for this repository (none exists today), including a riscv64 job on RISE-hosted runners | 1-2 | Edge Impulse/Qualcomm engineering | High |
| Organizational | Establish a public contribution path (CONTRIBUTING.md, open issue filing) to make future architecture ports (riscv64 included) externally proposable | 0.5 | Edge Impulse/Qualcomm engineering | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/edge-impulse-ffi-rs](https://github.com/edgeimpulse/edge-impulse-ffi-rs) - main repository
- [edgeimpulse/edge-impulse-ffi-rs/releases](https://github.com/edgeimpulse/edge-impulse-ffi-rs/releases) - "There aren't any releases here"
- [edgeimpulse/edge-impulse-ffi-rs/issues](https://github.com/edgeimpulse/edge-impulse-ffi-rs/issues) - "Issues 0"
- [edgeimpulse/edge-impulse-ffi-rs pull request #2](https://github.com/edgeimpulse/edge-impulse-ffi-rs/pull/2) - open PR, target-broadening, not RISC-V
- [edgeimpulse/edge-impulse-ffi-rs pull request #6](https://github.com/edgeimpulse/edge-impulse-ffi-rs/pull/6) - "Add x86_64 support," merged 2025-11-18
- [edgeimpulse/edge-impulse-runner-rs](https://github.com/edgeimpulse/edge-impulse-runner-rs) - related repository, checked for RISC-V references (none found)
- [Edge Impulse blog: Bringing Edge AI to Rust](https://www.edgeimpulse.com/blog/bringing-edge-ai-to-rust-introducing-the-edge-impulse-rust-library/)
- [Edge Impulse docs: Rust SDK](https://docs.edgeimpulse.com/tools/libraries/sdks/inference/linux/rust)
- [riseproject.dev/members](https://riseproject.dev/members/) - RISE member list (Qualcomm Technologies Inc. listed as Premier Member; Edge Impulse not separately listed)
- [riseproject.dev/blog](https://riseproject.dev/blog) - full 34-post inventory checked, no Edge Impulse mention
- [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) - "Edge Impulse FFI (Rust)" not listed among 81 supported packages
- [riseproject-dev/sw-ecosystem project-reports/.queue.yml](https://github.com/riseproject-dev/sw-ecosystem) - internal backlog entry, report not yet written prior to this document
- [google/XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886) - RVV FP16 test failures (open)
- [google/XNNPACK issue #8052](https://github.com/google/XNNPACK/issues/8052) - transpose-test cross-compile failure (open)
- [pytorch/cpuinfo pull request #397](https://github.com/pytorch/cpuinfo/pull/397) - ISA extension coverage (open/unreviewed)
- [google/googletest issue #3756](https://github.com/google/googletest/issues/3756) - flaky test reference
- [microsoft/onnxruntime issue #20030](https://github.com/microsoft/onnxruntime/issues/20030) - accuracy collapse on non-ratified RVV0.7 hardware (open)
- [microsoft/onnxruntime issue #26187](https://github.com/microsoft/onnxruntime/issues/26187) - `DeviceDiscoveryTest.HasCpuDevice` failure on riscv64/musl (open)
- [apache/tvm issue #18560](https://github.com/apache/tvm/issues/18560) - RVV performance regression (open, representative of #18560-#18572 range)
- [tensorflow/tflite-micro issue #3107](https://github.com/tensorflow/tflite-micro/issues/3107) - riscv64 support offer, closed stale
- Project graph SPARQL query against Ubuntu 26.04 "resolute" riscv64 binary packages (empty result set)
- PyPI JSON API queries: `https://pypi.org/pypi/edge-impulse-ffi-(rust)/json`, `https://pypi.org/pypi/edge-impulse-ffi/json` (both HTTP 404)
- [packages.ubuntu.com](https://packages.ubuntu.com/) search (no results for any name variant)
- [archriscv.felixc.at](https://archriscv.felixc.at/) - Arch Linux RISC-V port (no listing)
- Local repository clone inspection, HEAD `81ff65c15f15657c609fdbcc8788b5015648cac3`, at `/home/user/edgeimpulse/edge-impulse-ffi-rs`
