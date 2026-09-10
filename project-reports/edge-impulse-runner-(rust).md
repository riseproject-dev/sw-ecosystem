---
title: Edge Impulse Runner (Rust)
parent: Project Reports
color: orange
dependencies:
  - name: Edge Impulse FFI (Rust)
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="edge-impulse-runner-(rust)" %}

# Edge Impulse Runner (Rust)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Runner (Rust)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse Runner (Rust) is a Rust library for running Edge Impulse Linux ML inference models, published at [github.com/edgeimpulse/edge-impulse-runner-rs](https://github.com/edgeimpulse/edge-impulse-runner-rs), on [crates.io](https://crates.io/crates/edge-impulse-runner), and documented on [docs.rs](https://docs.rs/edge-impulse-runner). It is a thin Rust orchestration layer (HTTP client via `reqwest`, HMAC-SHA256 ingestion signing via `sha2`/`hmac`/`hex`, JSON via `serde`) that, with the default `ffi` feature, delegates all native ML inference work via FFI to a pinned git dependency, `edgeimpulse/edge-impulse-ffi-rs` (rev `81ff65c`). That crate binds to the vendored Edge Impulse Inferencing SDK (C++), which in turn vendors TensorFlow Lite/TFLM, FlatBuffers, ruy, gemmlowp, kissfft, and ARM-only CMSIS-NN.

**Governance.** Single-vendor: the repository is owned and controlled directly by Edge Impulse Inc. under the `edgeimpulse` GitHub org, with no CNCF/Linux Foundation/OpenSSF-style governance markers. No `MAINTAINERS`, `CODEOWNERS`, `OWNERS`, or `CONTRIBUTING.md` file exists (confirmed 404 at repo root and `main` branch). License is BSD-3-Clause-Clear (permissive). There is no separate steering committee or community governance body.

**Corporate sponsor / top contributors** (from commit history; company affiliation inferred from `edgeimpulse` org membership, since no MAINTAINERS file exists): ferjm (26+ commits, dominant contributor), rajames (4 commits, Nov 2025, aarch64 cross-compilation/Docker infra), mmajchrzycki (2 commits), furtiman (1 commit).

**Community culture on new ports.** No documented stance exists on how new architecture ports would be proposed, reviewed, or accepted, since no CONTRIBUTING.md or governance doc exists at all. The most recent platform-related work (Nov 2025, rajames) targeted aarch64 cross-compilation infrastructure exclusively, with no indication RISC-V is on the roadmap.

**RISE membership.** [riseproject.dev/members](https://riseproject.dev/members/) does not list Edge Impulse or edge-impulse-runner-rs as a member (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, ESWIN, ISCAS, Canonical, Douyin, Institute of Software CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). No RISE blog post, working group, or funded-work item references Edge Impulse or this crate in any form.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been proposed, discussed, or merged | Full 149-commit history (cloned to HEAD `89608ca`) contains zero commits mentioning riscv/RISC-V |

No key contributors exist for a RISC-V port because no such work has occurred. The project is **not** upstream for riscv64 in any sense - there is no riscv64 code path to be "upstream" or "downstream" of.

## 3. Upstream Support Tier

No formal tiered support policy exists (no Tier 1/2/community designations; no `PLATFORMS.md`/`SUPPORT.md`/`docs/platforms/` - all return 404; the `docs/` directory itself returns 404). The README informally documents supported platforms via a target-selection table and build-flag list, without stated support-level guarantees.

| Architecture | CI builds | CI tests | Official binaries | Prebuilt native libs | Documented target |
|---|---|---|---|---|---|
| amd64/x86_64 | Yes (`ubuntu-latest`) | Yes | No (crate has zero GitHub releases) | Yes (`tflite/linux-x86/`) | Yes |
| arm64/aarch64 | No (Docker-based test, not GH Actions matrix) | Via Docker scripts (`test-aarch64-image-infer.sh`) | No | Yes (`tflite/linux-aarch64/`, hand-tuned NEON) | Yes |
| riscv64 | No | No | No | No | **No - absent from support matrix entirely** |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The Rust crate itself does no architecture branching; `build.rs` delegates all native compilation to `edge-impulse-ffi-rs`. Architecture selection happens in that crate's `ffi_glue/CMakeLists.txt`:

```
if(APPLE)
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm64")   -> tflite/mac-arm64
    else()                                        -> tflite/mac-x86_64
else()
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "aarch64") -> tflite/linux-aarch64
    else()                                        -> tflite/linux-x86   (unconditional catch-all)
```

This is a critical structural finding: **any non-aarch64, non-Apple `CMAKE_SYSTEM_PROCESSOR` (riscv64 included) silently falls through to the `tflite/linux-x86` prebuilt libraries** - i.e., x86_64 binaries. On a riscv64 target this would either fail to link (wrong-ISA object files) or, in a misconfigured cross environment, produce a non-functional binary. This is an opaque failure mode, not an explicit "unsupported platform" error.

| Component | amd64/x86_64 | arm64/aarch64 | riscv64 |
|---|---|---|---|
| Prebuilt TFLite native libs | `tflite/linux-x86/`, `tflite/mac-x86_64/` | `tflite/linux-aarch64/`, `tflite/mac-arm64/` | None |
| Hand-tuned SIMD kernels | NEON_2_SSE translation shim (`CMAKE_SYSTEM_PROCESSOR MATCHES "x86"` -> `find_package(NEON_2_SSE)`) | 24 files with native NEON intrinsics (`neon_tensor_utils.cc`, `neon_fully_connected.cc/.h`, `cpu_check.cc` dotprod detection, depthwise-conv 3x3 kernels) | 0 files; 0 `#ifdef __riscv` guards anywhere in the vendored TFLite tree |
| RVV / Zb* intrinsics | N/A | N/A | None found |
| Assembly | N/A (compiler-generated SSE via shim) | Native NEON intrinsics | None |
| CMake fallback behavior | Explicit match | Explicit match | **Falls through to x86_64 path (mis-arch)** |

Code-search confirmation: `search_code` for `riscv` against both `edge-impulse-runner-rs` and `edge-impulse-ffi-rs` returned 0 hits in each repo.

## 5. Build System, Cross-Compilation, and Toolchain

- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists anywhere in the repo or its history; the repo has exactly one Markdown file, `README.md`.
- No `CMakeLists.txt` exists in `edge-impulse-runner-rs` itself - it is a pure Cargo/`build.rs`-driven build; native build is entirely delegated to `edge-impulse-ffi-rs` (git dependency, `Cargo.toml` pin `rev = "81ff65c"`).
- No `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists.
- Only one Dockerfile exists at repo root, targeting **aarch64 exclusively** (`rust:1.90.0-bookworm` base, `gcc-aarch64-linux-gnu`/`g++-aarch64-linux-gnu`, target `aarch64-unknown-linux-gnu`).
- Documented target env-vars (host/native builds only, no toolchain files provided): `TARGET_MAC_ARM64`, `TARGET_MAC_X86_64`, `TARGET_LINUX_X86`, `TARGET_LINUX_AARCH64`, `TARGET_LINUX_ARMV7`, `TARGET_JETSON_NANO`, `TARGET_JETSON_ORIN`, `TARGET_AM68A`, `TARGET_RENESAS_RZV2L`. No `TARGET_LINUX_RISCV64` exists.
- Advanced flags (`USE_TVM`, `USE_ONNX`, `USE_QUALCOMM_QNN`, `USE_ETHOS`, `USE_AKIDA`, `USE_MEMRYX`, `LINK_TFLITE_FLEX_LIBRARY`, `TENSORRT_VERSION`) mirror the Makefile in `edgeimpulse/example-standalone-inferencing-linux` per the README - that separate repo was out of scope for this research.
- No QEMU usage is documented anywhere in this repo.
- No GCC/Clang minimum-version rationale tied to RISC-V exists; the only toolchain pin is the Docker base image `rust:1.90.0-bookworm` (Debian bookworm default toolchain), unrelated to RISC-V.
- **What would be required to add riscv64:** extend `edge-impulse-ffi-rs`'s CMake logic with an explicit riscv64 branch, build/vendor a `tflite/linux-riscv64/` native library, add a `riscv64-linux-gnu-gcc`/`g++` cross toolchain and `TARGET_LINUX_RISCV64` env plumbing (following the aarch64 Dockerfile as a template), and add a `riscv64gc-unknown-linux-gnu` Rust target. None of this exists as of commit `89608ca`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native inference (FFI to Edge Impulse SDK) | Full | Full | **Absent** - no build path exists |
| GStreamer-based image/audio pipelines (`eim` feature, tested in CI) | Full | Untested in CI (Docker-only) | Not tested; unknown if it would build (crate itself is architecture-agnostic Rust, but native SDK is not) |
| Hand-tuned NN kernels (NEON) | N/A (uses NEON_2_SSE shim) | Full (24 files) | **Absent** |
| Docker cross-compile pipeline | N/A (native) | Full | **Absent** |
| Documented as supported platform | Yes | Yes | **No** |

**Functional gap.** A riscv64 build cannot currently be produced through any documented or coded path; the CMake fallback would misroute to x86_64 binaries rather than fail cleanly, which is a correctness risk if anyone attempts a naive cross-build.

**Performance gap.** Not measurable - there is no working riscv64 build to benchmark. No RISC-V-vs-arm64/amd64 performance data exists for this project from any source checked (RISE blog, GitHub, general web search).

**Security hardening gap.** Not assessed - no build exists to evaluate.

**NaN / floating-point semantics issues.** None reported; no riscv64-specific bug reports exist for this repository at all (see Section 11).

## 7. CI/CD Infrastructure

Two GitHub Actions workflow files exist in `.github/workflows/`: `docs.yml` and `edge-impulse-runner.yml`. No other CI system is configured (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, `azure-pipelines.yml`, `.travis.yml` all confirmed absent at repo root).

**`edge-impulse-runner.yml`** ("Edge Impulse Runner Tests") - triggers on `push`/`pull_request` to `main`; three jobs (`test`, `clippy`, `format`), all `runs-on: ubuntu-latest`, no matrix strategy of any kind. The `test` job runs `cargo test --no-default-features --features eim` and builds examples natively on x86_64.

**`docs.yml`** ("Deploy Rust Docs to GitHub Pages") - triggers on `push` to `main` and `workflow_dispatch`; single `ubuntu-latest` job running `cargo doc` and deploying to GitHub Pages.

Grep for "riscv" (case-insensitive) across both files: zero matches. No self-hosted RISE runners, no QEMU step, no Docker `--platform` cross-build, no `cross` tool usage.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (`ubuntu-latest`, native) | No (Docker-based manual testing scripts, not in GH Actions matrix) | No |
| CI test | Yes | Via Docker scripts, not GH Actions-gated | No |
| CI release-blocking | Yes (test/clippy/format required) | No | No |
| Hardware | GitHub-hosted x86 runner | N/A (build-time only in CI) | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases.** [github.com/edgeimpulse/edge-impulse-runner-rs/releases](https://github.com/edgeimpulse/edge-impulse-runner-rs/releases) states "There aren't any releases here." The repository has **zero** GitHub releases published for any architecture - there are no release assets to check for a riscv64 filename.

**crates.io / PyPI.** Distributed as a Rust crate via [crates.io/crates/edge-impulse-runner](https://crates.io/crates/edge-impulse-runner) (source crate, not arch-gated binaries; a user builds natively via `cargo build`, which invokes the FFI native build described in Section 5). It is not a Python package: `https://pypi.org/pypi/edge-impulse-runner-(rust)/json` returns HTTP 404. The RISE GitLab PyPI wheel-builder proxy also 404s on the same query.

**Ubuntu 26.04 (resolute), riscv64.** Project graph SPARQL query against `deb#BinaryPackage` filtered by `targetArchitecture=riscv64`, `inSuite=resolute`, across all plausible package names returned empty bindings. `packages.ubuntu.com` search for "edge-impulse-runner" returned "Sorry, your search gave no results" across all architectures, not just riscv64.

**Arch Linux RISC-V port.** No package listing found on [archriscv.felixc.at](https://archriscv.felixc.at) for this project.

**What a user must do today to get a working binary on riscv64:** Nothing currently produces one. A user would need to: (1) fork/patch `edge-impulse-ffi-rs`'s CMake logic to add an explicit riscv64 branch, (2) build or obtain riscv64 native libraries for the Edge Impulse Inferencing SDK / TFLite stack (none exist upstream in any form, source or binary), (3) cross-compile with a `riscv64gc-unknown-linux-gnu` Rust target using a self-supplied toolchain, since none of this is documented or automated anywhere in the project.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| `edge-impulse-ffi-rs` (git, default `ffi` feature, rev `81ff65c`) | Rust<->C++ FFI bridge; drives native inference build via `bindgen`+`cc` | Untested/unverified (not a distro package - git dependency); inherits all gaps below | None | None (consumed via git rev pin, no releases) | No riscv64 issues/PRs (0 hits) |
| Edge Impulse Inferencing SDK (C++), vendored under `edge-impulse-ffi-rs/model/edge-impulse-sdk` | Core DSP + NN inference engine | Not found in any package graph, no releases exist for any arch; falls through to generic scalar `porting/posix` path, untested | None (no CI at all, any arch) | None (zero GitHub releases) | Zero riscv64 activity ever (0 issues/PRs/commits) - see `project-reports/reports/edge-impulse-inferencing-sdk-(c++).md` |
| TensorFlow Lite Micro (TFLM), default `tflite-eon` engine | Quantized NN interpreter (matmul/conv/pooling kernels) | riscv32 only upstream (Tier-2, reference kernels, nightly QEMU CI, not PR-gated); riscv64 exists only in an unmerged community fork (cordawyn), 186 commits behind main | riscv32 only, nightly | No riscv64 releases; PyPI wheels are `manylinux_2_28_x86_64`-only | Issue #3107 "Support for RISCV64" closed stale; PR #3280 (RVV kernels) targets riscv32 only, unreviewed since Jan 2026 - see `project-reports/reports/tensorflow-lite-micro-(tflm).md` |
| FlatBuffers | `.tflite`/EI model (de)serialization | Pure C++, architecture-agnostic, builds cleanly; `libflatbuffers-dev` present in Ubuntu 26.04 riscv64 | No upstream CI; validated via Debian buildd | No riscv64 `flatc` binary in upstream GitHub releases; Debian/Arch RISC-V fill the gap; Rust crate is pure Rust (Tier 2 target) | See `project-reports/reports/flatbuffers.md` |
| ruy | int8/float32 matmul backend used by TFLM/full TFLite | Scalar `kStandardCpp` fallback only, no `RUY_PLATFORM_RISCV` macro, no RVV kernels; `libruy-dev` present in Ubuntu 26.04 riscv64 | No riscv64 CI beyond org-level CodeQL | Packaged in Ubuntu (scalar-only) | Zero riscv64 issues/PRs in `google/ruy`; primary matmul performance bottleneck for any RISC-V target - see `project-reports/reports/ruy.md` |
| gemmlowp | Legacy fixed-point matmul fallback | Scalar fallback only, no RISC-V detection (has ARM NEON/x86 SSE headers); `libgemmlowp-dev` in Ubuntu 26.04 riscv64 | No riscv64 CI (maintenance mode) | Packaged in Ubuntu | Superseded by ruy |
| kissfft | FFT kernels for MFCC/audio DSP features | Pure portable C, architecture-agnostic; `libkissfft-dev` in Ubuntu 26.04 riscv64 | No known riscv64 failures | Packaged in Ubuntu | None |
| CMSIS-NN (vendored) | Hand-tuned Cortex-M SIMD NN kernels | ARM Cortex-M only by design, compiled out on riscv64 (same behavior as amd64) | N/A | N/A | Not RISC-V-relevant |
| `ring` v0.17.14 (crypto backend under `rustls`, via `reqwest`'s `rustls-tls`) | TLS crypto primitives | `librust-ring-dev` present in Ubuntu 26.04 riscv64; no arch-specific asm deps needed | Yes - upstream CI builds and QEMU-tests `riscv64gc-unknown-linux-gnu` on every run | Published to crates.io normally | Historical support issues (#1182, #2041, #2148, #2403, #2468) all resolved; one residual gap on the new `riscv64a23` profile target (issue #2745, closed not-planned - `-mabi=lp64d` not recognized by host `cc`); plain `riscv64gc` unaffected; scalar-only, no RVV/crypto-extension acceleration |
| `bindgen`/`clang-sys` (build-dep of `edge-impulse-ffi-rs`) | Generates Rust FFI bindings; requires libclang | `librust-bindgen-dev`, `libclang-dev`, `llvm`, `clang` all present in Ubuntu 26.04 riscv64 | N/A (build tool) | Packaged in Ubuntu | No riscv64-specific issues found |
| `rustls` (via `reqwest` `rustls-tls`) | TLS protocol implementation | Not found under exact distro package name (likely cargo-vendored); pure Rust, no arch-specific code | 0 riscv64-tagged issues on `rustls/rustls` | Published normally to crates.io | None found |
| `sha2`/`hmac`/`hex` (RustCrypto) | HMAC-SHA256 ingestion API signing | Pure-Rust, portable, no SIMD/asm feature enabled in this crate's dependency selection | No riscv64-specific issues expected | Published normally to crates.io | Low risk |

**Summary.** The Rust crate itself has no riscv64 activity and no riscv64-specific code, but also carries no architecture-specific risk of its own - all real exposure is transitive. The riscv64-blocking chain is entirely inside the native FFI inference stack (`edge-impulse-ffi-rs` -> Edge Impulse Inferencing SDK (C++) -> TFLM/TFLite -> ruy/gemmlowp), none of which has ever been built or CI-tested on riscv64 end-to-end - even though every individual C/C++ leaf dependency (FlatBuffers, ruy, gemmlowp, kissfft, full `libtensorflow-lite-dev`) is independently packaged for Ubuntu 26.04 riscv64. This is a gap in Edge Impulse's own porting/CI/release process, not a transitive-package blocker. The Rust-native side (`ring`, `bindgen`/`clang-sys`, `rustls`, RustCrypto) is comparatively healthy.

## 11. Known Bugs and Active Issues

The repository has exactly 5 issues total (open and closed combined):

| # | Title | State | Severity | Notes |
|---|---|---|---|---|
| 33 | crates.io is out of date | Open | N/A | No RISC-V relevance |
| 30 | Outdated version in crates.io? | Closed | N/A | No RISC-V relevance |
| 23 | Cross-compiling on x86 container does not use the correct linker | Closed | N/A | Cross-compilation issue, but for a non-riscv64 target - no RISC-V mention |
| 21 | Docker compose for cross-compilation fails to install dependencies | Closed | N/A | Same - no RISC-V mention |
| 1 | Image features should be RGB in the 0xff0000 format (and not in [0,1] range) | Closed | N/A | No RISC-V relevance |

No issue, open or closed, mentions RISC-V, riscv64, performance, benchmarks, NaN, or floating-point semantics. There are no open correctness bugs of any kind related to RISC-V - there is no RISC-V-related discussion in this repository's issue tracker at all.

## 12. Objections and Upstream Blockers

**Stated objections.** None exist - RISC-V has never been proposed, discussed, or objected to in any issue, PR, commit, or documentation in this repository.

**Technical blockers.**
1. No riscv64 build path exists in `edge-impulse-ffi-rs`'s CMakeLists.txt; the else-branch fallback would misroute a riscv64 build to x86_64 prebuilt libraries rather than fail explicitly.
2. No riscv64 native libraries exist for the vendored Edge Impulse Inferencing SDK / TFLite stack - none in source or binary form.
3. Transitively, TFLM (default inference engine) has no riscv64 upstream target (Tier-2 riscv32 only; riscv64 exists solely in an unmerged, 186-commits-stale community fork).
4. ruy (matmul backend) has no RISC-V kernel at all - scalar fallback only, with zero riscv64 issues/PRs ever filed upstream.

**Organizational blockers.** Single-vendor, informally governed project with no published contribution policy or platform-acceptance process. No RISE membership or funding relationship exists to seed this work. The most recent platform investment (Nov 2025) went to aarch64 infrastructure, not new-architecture expansion.

**Acceptance probability.** Low, absent external investment. There is no technical objection to overcome (nothing has ever been proposed), but there is also no demonstrated interest, no roadmap mention, and no community/RISE pressure identified in any source checked. A riscv64 port would require someone external to do the work end-to-end (crate, FFI crate, and native SDK build) and contribute it, since the project shows no self-motivated momentum in this direction.

## 13. Readiness Assessment

- **Color:** orange (base case - no upstream riscv64 CI and no distribution package on any channel checked)
- **Release provider:** none
- **Optimization gap:** N/A. This project is a bindings/orchestration crate (HTTP client, HMAC signing, FFI dispatch) rather than a kernel/optimization library in its own right; even with a fully generic scalar build of its native dependency chain, it would still deliver its core value proposition (running Edge Impulse models from Rust). The optimization-purpose test in the color-coding skill therefore does not apply to this crate directly - the RISC-V kernel-level optimization gap belongs to its transitive dependencies (TFLM, ruy; see Section 9 and their respective reports).
- **Justification:** No upstream riscv64 CI exists - both GitHub Actions workflows (`docs.yml`, `edge-impulse-runner.yml`) run exclusively on `ubuntu-latest` with no cross-arch matrix ([workflow directory](https://github.com/edgeimpulse/edge-impulse-runner-rs/tree/main/.github/workflows)). No distribution package exists on any channel checked (Ubuntu 26.04 resolute riscv64 SPARQL query returned empty bindings; PyPI 404; no Arch RISC-V listing), so the distribution floor does not apply either - there is nothing to float up from. The repository has zero GitHub releases for any architecture ([releases page](https://github.com/edgeimpulse/edge-impulse-runner-rs/releases)), and the underlying `edge-impulse-ffi-rs` CMake build logic has an unconditional non-aarch64/non-Apple fallback that would misroute a riscv64 build to x86_64 prebuilt binaries - a structural landmine, though not a confirmed/documented runtime failure (no one has filed an issue reporting an actual riscv64 build attempt), so this does not meet the bar for red per the skill's "confirmed broken" requirement.
- **Pending work that could change the grade:** None identified. No open PR, no RISE involvement, and no roadmap statement of any kind was found across GitHub search (issues/PRs/commits/code), RISE's blog and member list, and web search. Any grade change would require new work to be initiated from outside this investigation's findings.

## 14. Investment Analysis

**RISE prior work check.** No RISE involvement, funding, blog coverage, or infrastructure use was found for this project or its immediate `edge-impulse-ffi-rs` dependency (Section 1, Section 12). RISE's Python wheel builder (88 riscv64 wheels listed) does not include Edge Impulse. Nothing described below is already covered by RISE.

### 14.1 Functional Enablement

Getting a working riscv64 build requires, in order: (1) adding an explicit riscv64 branch to `edge-impulse-ffi-rs`'s CMake architecture-selection logic (currently falls through to x86_64), (2) building the vendored Edge Impulse Inferencing SDK (C++) and its TFLite/TFLM/ruy/gemmlowp/FlatBuffers/kissfft dependency stack for riscv64 - most C/C++ leaves already have Ubuntu 26.04 riscv64 packages available to build against, but the SDK's own build/CI has never targeted riscv64, (3) adding riscv64 Docker/cross-compile infrastructure analogous to the existing aarch64 `Dockerfile`, and (4) validating `cargo test --no-default-features --features eim` passes under `riscv64gc-unknown-linux-gnu` (native or QEMU).

### 14.2 Performance Optimization

Not applicable to this crate directly (see Section 13 optimization gap). Performance work belongs to the transitive dependency chain: TFLM/ruy have no riscv64 matmul/conv kernels (scalar-only fallback), which is the real performance-determining gap for ML inference throughput on riscv64. That work is scoped in `project-reports/reports/tensorflow-lite-micro-(tflm).md` and `project-reports/reports/ruy.md`, not this report.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `edge-impulse-runner.yml`, ideally running the same `cargo test --no-default-features --features eim` suite used for x86_64 today, either via QEMU emulation or RISE-hosted riscv64 hardware runners (RISE's runner infrastructure exists per its own project catalog, but this project has never engaged with it).

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `edge-impulse-ffi-rs` CMake logic (fix silent x86_64 fallback) | 1-2 | Edge Impulse or contributor | Critical |
| Functional | Build/validate Edge Impulse Inferencing SDK (C++) native stack for riscv64 | 3-5 | Edge Impulse or contributor | Critical |
| Functional | Add riscv64 Docker/cross-compile infra (mirror existing aarch64 Dockerfile) | 1-2 | Edge Impulse or contributor | High |
| CI/CD | Add riscv64 job (build + `cargo test`) to `edge-impulse-runner.yml` | 1 | Edge Impulse or contributor | High |
| Performance | RVV/scalar-optimization work in TFLM and ruy (tracked separately, not in this crate) | See TFLM/ruy reports | Upstream TFLM/ruy communities | Medium (blocked on functional enablement first) |
| Distribution | Publish riscv64-inclusive GitHub releases and/or crates.io native-asset guidance | 1 | Edge Impulse | Medium |

Note: this crate currently has zero GitHub releases for any architecture, so "riscv64 release" work is really "first release, riscv64-inclusive" rather than an incremental add.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Edge Impulse Runner (Rust) - GitHub repository](https://github.com/edgeimpulse/edge-impulse-runner-rs)
- [Edge Impulse Runner (Rust) - GitHub Releases page (zero releases)](https://github.com/edgeimpulse/edge-impulse-runner-rs/releases)
- [Edge Impulse Runner (Rust) - CI workflow directory](https://github.com/edgeimpulse/edge-impulse-runner-rs/tree/main/.github/workflows)
- [edge-impulse-runner.yml - Edge Impulse Runner Tests workflow](https://github.com/edgeimpulse/edge-impulse-runner-rs/blob/main/.github/workflows/edge-impulse-runner.yml)
- [docs.yml - Deploy Rust Docs to GitHub Pages workflow](https://github.com/edgeimpulse/edge-impulse-runner-rs/blob/main/.github/workflows/docs.yml)
- [edge-impulse-runner - crates.io](https://crates.io/crates/edge-impulse-runner)
- [edge-impulse-runner - docs.rs](https://docs.rs/edge-impulse-runner)
- [Bringing Edge AI to Rust: Introducing the Edge Impulse Rust Library - Edge Impulse blog](https://www.edgeimpulse.com/blog/bringing-edge-ai-to-rust-introducing-the-edge-impulse-rust-library/)
- [edge-impulse-ffi-rs - GitHub repository (native FFI dependency)](https://github.com/edgeimpulse/edge-impulse-ffi-rs)
- [PyPI package lookup for "edge-impulse-runner-(rust)" - 404, not a Python package](https://pypi.org/pypi/edge-impulse-runner-(rust)/json)
- [RISE GitLab PyPI wheel-builder proxy - 404 for this package](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-runner-(rust)/)
- [Ubuntu Packages Search - no results for this project](https://packages.ubuntu.com/search?keywords=Edge%20Impulse%20Runner%20(Rust)&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
- [riseproject.dev - Members page](https://riseproject.dev/members/)
- [riseproject.dev - RISE RISC-V Runners: six weeks in (unrelated CI infra post)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [riseproject.dev - Python Wheel Builder page (riscv64 wheel coverage, no Edge Impulse entry)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners site](https://riscv-runners.riseproject.dev/)
- [project-reports/reports/tensorflow-lite-micro-(tflm).md - TFLM riscv64 status (internal report)]()
- [project-reports/reports/ruy.md - ruy riscv64 status (internal report)]()
- [project-reports/reports/flatbuffers.md - FlatBuffers riscv64 status (internal report)]()
- [project-reports/reports/edge-impulse-inferencing-sdk-(c++).md - Edge Impulse Inferencing SDK riscv64 status (internal report)]()
