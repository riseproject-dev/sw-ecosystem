---
title: Qdrant
parent: Project Reports
color: orange
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: ring
    relation: runtime-dependency
    criticality: critical
  - name: rustls
    relation: runtime-dependency
    criticality: critical
  - name: jemalloc
    relation: runtime-dependency
    criticality: critical
  - name: shaderc
    relation: runtime-dependency
    criticality: optional
  - name: pprof-rs
    relation: runtime-dependency
    criticality: optional
---

# Qdrant

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for Qdrant<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="qdrant" %}

## 1. Project Overview

Qdrant is a Rust-implemented vector similarity search database used for retrieval-augmented generation, semantic search, and recommendation workloads. It is licensed Apache License 2.0.

Qdrant is not a foundation-governed project. It is a single-vendor, VC-backed company product. It was founded in 2021 by Andre Zayarni (CEO) and Andrey Vasnetsov (CTO), who originally built the engine solo before the company formed. The company has 100+ employees across 20+ countries and is backed by Bosch Ventures, Spark Capital, Unusual Ventures, IBB Ventures, 42 Capital, and Accel (AVP). No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file exists in the repository (verified by full-tree search of the local clone); decision-making is informal and company-led, with the CTO personally adjudicating feature requests on GitHub issues. The GitHub org has 15 members, effectively all company engineers.

Qdrant is not a member of RISE, the Linux Foundation, or any RISC-V-focused consortium. Its own site (qdrant.tech) makes no mention of any foundation affiliation. It was explicitly absent from [riseproject.dev/members](https://riseproject.dev/members/) (checked against Premier members Google, NVIDIA, Qualcomm, Red Hat, SiFive, Alibaba, MediaTek, Tenstorrent, and General members including Canonical, Andes, ZTE).

Community stance on new architecture ports is a "bring your own contribution" model: the company will not commit engineering time to new ports but says it will consider community-driven contributions, gated on upstream toolchain readiness (see Section 2 for the direct quote from the CTO).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-12-12 | Issue #5638 "RISC-V Support" opened by community member shaneutt (not a maintainer), requesting a "known to build" state rather than full support | [qdrant/qdrant#5638](https://github.com/qdrant/qdrant/issues/5638) |
| 2024-12-13 | Qdrant CTO (generall) responds: cannot estimate scope without knowing dependency status; no roadmap commitment; invites external contribution | [qdrant/qdrant#5638](https://github.com/qdrant/qdrant/issues/5638) |
| 2024-12-16 | Qdrant engineer timvisee expresses interest in attempting a build via QEMU (no native RISC-V hardware); no follow-up PR was ever opened | [qdrant/qdrant#5638](https://github.com/qdrant/qdrant/issues/5638) |
| 2024-12-21 | Community member camel-cdr notes Rust itself does not yet support RVV intrinsics, a fundamental blocker for the SIMD-kernel work the port would require | [qdrant/qdrant#5638](https://github.com/qdrant/qdrant/issues/5638) |
| 2023-02-22 / 2023-04-04 | PR #1490 and PR #1647 ("Bump pprof from 0.11.0 to 0.11.1") merged - Dependabot bumps whose upstream pprof-rs changelog mentions adding RISC-V support to that unrelated crate; not Qdrant-authored RISC-V work | [PR #1490](https://github.com/qdrant/qdrant/pull/1490), [PR #1647](https://github.com/qdrant/qdrant/pull/1647) |
| 2026-04-14 | PR #8662 (PyO3/maturin-action bump to 1.51.0) merged, whose release notes add "Support native riscv64 builds on manylinux 2_39" to the Python wheel-build tooling; third-party CI-action version bump, not a Qdrant port | [PR #8662](https://github.com/qdrant/qdrant/pull/8662) |

**Key contributors:** shaneutt (community, issue author), generall / Andrey Vasnetsov (Qdrant CTO, noncommittal response), timvisee / Tim Visee (Qdrant engineer, expressed interest, no follow-through), camel-cdr (community, identified the Rust/RVV blocker).

**Is it fully upstream?** No. Issue #5638 remains open and unresolved as of 2026-09-11, with no linked or closing PR. A commit-history search (`riscv repo:qdrant/qdrant`) returns zero results. There is no dedicated RISC-V port PR at any stage of development.

## 3. Upstream Support Tier

No formal tier policy is documented. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists anywhere in the repository. Platform support is de facto - defined entirely by what the release CI matrix builds - with architecture decisions made ad hoc by the CTO rather than via a published policy.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI runs tests | Yes | Yes | No |
| Official GitHub release binaries | Yes (`x86_64-unknown-linux-gnu`, `-musl`, `apple-darwin`, `pc-windows-msvc`, AppImage, amd64 .deb) | Yes (`aarch64-unknown-linux-musl`, `aarch64-apple-darwin`) | No |
| Official Docker images | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |

Source: [release-artifacts.yml](https://github.com/qdrant/qdrant), [docker-image.yml](https://github.com/qdrant/qdrant), verified by direct read of all 17 workflow files in `.github/workflows/` of a local clone at commit `6ab21cac18ebb6f4ae29102c7f8f5cc11affd5de`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Qdrant's performance-critical code is its SIMD-accelerated vector similarity and quantization math, which underlies the entire value proposition of the product (fast approximate nearest-neighbor search over large vector collections).

**Architecture-conditional code inventory:** `target_arch` guards appear in 32 files for `x86_64` and 31 files for `aarch64` (largely the same shared files branching on both). Zero files branch on `riscv64`. A repository-wide grep for `riscv`, `__riscv`, `rvv`, and `vfloat32m1_t` (an RVV intrinsic type) across all `.rs` and `.c` files returns zero matches.

**Dense vector similarity** (`lib/segment/src/spaces`): Euclid, Manhattan, Dot, and Cosine metrics have hand-written AVX/SSE intrinsics for x86_64 (`simple_avx.rs`, `simple_sse.rs`) and NEON intrinsics for aarch64 (`simple_neon.rs`). On riscv64, these fall through to a generic scalar Rust loop (e.g. `-v1.iter().zip(v2).map(|(a, b)| (a - b).powi(2)).sum()`), which is functionally correct but not vectorized, and is unverified on real or emulated riscv64 hardware since no CI ever builds or runs it there.

**f16 metrics and quantization kernels** (`lib/quantization`, `lib/segment/src/spaces/metric_f16`): implemented as hand-written C (`sse.c`, 513 lines; `avx2.c`, 205 lines; `neon.c`, 465 and 137 lines) compiled conditionally by `build.rs`. For any architecture other than x86_64 or aarch64+neon, `build.rs` hits an explicit `else { return; }` branch and compiles **no C kernel at all** on riscv64 - a stricter "missing" condition than the scalar fallback used for dense metrics.

**TurboQuant SIMD backend** (`lib/quantization/src/turboquant/simd`): AVX2/AVX512VNNI backends for x86_64, NEON backend for aarch64. riscv64 uses only scalar fallback codebook constants, explicitly documented in-code as "matches the x86_64 scheme so the scalar reference produces the same numeric result" - i.e. a deliberate, correctness-preserving fallback, not a crash or stub, but zero vectorization.

**Prefetch hints** (`lib/common/common/src/prefetch.rs`): `_mm_prefetch` on x86_64, inline `prfm` assembly on aarch64, a graceful no-op (`let _ = bytes;`) on riscv64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dense vector similarity (Euclid/Manhattan/Dot/Cosine) | Full - hand-tuned AVX/SSE intrinsics | Full - hand-tuned NEON intrinsics | Scalar fallback (generic Rust loop, untested on riscv64) |
| f16 metrics | Partial - C intrinsics | Partial - C intrinsics | Missing - build.rs compiles no C source at all |
| uint8 quantized metrics | Full - AVX2 | Full - NEON | Scalar fallback only |
| Binary/PQ/u8 quantization | Full - hand-written C (sse.c, avx2.c) | Full - hand-written C (neon.c) | Missing - build.rs early-returns, no C kernel built |
| TurboQuant SIMD | Full - AVX2/AVX512VNNI backends | Full - NEON backend | Scalar fallback codebook/constants only |
| Prefetch hints | Full - `_mm_prefetch` | Full - inline `prfm` asm | No-op (correct degradation, not a bug) |

No `panic!()`, `unimplemented!()`, `todo!()`, or `compile_error!` was found in any riscv64-reachable fallback path inspected - the fallback code is genuine and functioning, not a broken placeholder. But it has never been built, run, or tested on riscv64 by upstream CI, so its correctness on real hardware is unverified rather than confirmed.

## 5. Build System, Cross-Compilation, and Toolchain

Qdrant is a pure Cargo/Rust workspace. There is no CMake build system anywhere in the repository (`find . -iname CMakeLists.txt` returns empty); `cmake` appears only as an apt package installed as a build-time dependency for certain crates' native build scripts (e.g. jemalloc-sys), never as Qdrant's own build system. No `BUILDING.md`, `INSTALL`, `cmake/riscv64.cmake`, or riscv64-specific Dockerfile exists.

**Local build** (per `docs/DEVELOPMENT.md`):
```
sudo apt-get install -y curl unzip gcc-multilib clang cmake jq \
    g++-9-aarch64-linux-gnu gcc-9-aarch64-linux-gnu   # aarch64 cross toolchain only, no riscv64 equivalent
rustup component add rustfmt
cargo build --release --bin qdrant
```
No `--target riscv64gc-unknown-linux-gnu` invocation exists anywhere in the documented workflow, and no riscv64 cross-toolchain package (e.g. `gcc-riscv64-linux-gnu`) is installed by any doc, script, or CI workflow.

**Docker cross-compilation** uses `tonistiigi/xx` plus Docker Buildx, not CMake. The root `Dockerfile`'s `BUILDPLATFORM` case statement handles only two architectures and hard-fails on anything else:
```
RUN case "$BUILDPLATFORM" in \
        */amd64 ) PLATFORM=x86_64 ;; \
        */arm64 | */arm64/* ) PLATFORM=aarch64 ;; \
        * ) echo "Unexpected BUILDPLATFORM '$BUILDPLATFORM'" >&2; exit 1 ;; \
    esac; \
    ... TARBALL="mold-$MOLD_VERSION-$PLATFORM-linux.tar.gz"; ...
```
This is a concrete, load-bearing blocker for Docker-based riscv64 builds: the step downloads a prebuilt `mold` linker release tarball that upstream `rui314/mold` only ships for `x86_64-linux` and `aarch64-linux` in the version Qdrant's Dockerfile pins, so `docker buildx build --platform linux/riscv64 .` aborts at this RUN step as written today. (Upstream `mold` v2.41.0 does publish `riscv64-linux` releases, so this is fixable by adding a third case arm, but nobody has done so.)

**Toolchain versions:** `Cargo.toml` declares `rust-version = "1.97"` (MSRV), `edition = "2024"`. The Dockerfile's base image is `lukemathwalker/cargo-chef:latest-rust-1.98.0-bookworm`. No riscv64-specific minimum Rust version is documented since riscv64 is not a supported target; the generic requirement would be whatever Rust version first shipped the stable `riscv64gc-unknown-linux-gnu` Tier-2 target (Rust >=1.75), which 1.97/1.98 satisfies, but this is inferred, not stated by Qdrant.

**QEMU:** No mention of QEMU anywhere in the repository (`grep -i qemu` across all `.yml`, `.md`, `.sh` files returns zero hits). The Docker cross-compile path uses `tonistiigi/xx` (Debian dpkg-arch cross toolchains), not QEMU emulation, and even that path does not extend to riscv64 today.

**Feature flags:** `Cargo.toml` `[features]` default is empty (`default = []`); optional features include `service_debug`, `tracing`, `console`, `tracy`, `dial9`, `stacktrace`, `chaos-testing`, `data-consistency-check`, `gpu` (Vulkan), `deb`, `staging`. None are riscv64-specific toggles. Nothing needs to be disabled to attempt a riscv64 build - the sole concrete blocker identified is the Docker mold-linker download, not a Cargo feature gate.

**Known build failures:** Docker/Buildx riscv64 target fails with `exit 1` at the mold-linker download step (see above). A native `cargo build --target riscv64gc-unknown-linux-gnu` has not been attempted or reported anywhere in the issue tracker, so its outcome is unverified rather than confirmed working or failing.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official release binary | Yes | Yes | No |
| Official Docker image | Yes | Yes | No |
| Vector similarity search (functional) | Yes, SIMD-accelerated | Yes, SIMD-accelerated | Unverified; would run on scalar fallback if built manually |
| Quantized vector search (binary/PQ/u8) | Yes, hand-written C kernels | Yes, hand-written C kernels | Would not compile a native kernel at all (`build.rs` early-return); behavior of the resulting binary is unverified |
| GPU indexing (Vulkan) | Yes (`gpu` feature) | Not evaluated in this research | Unverified; real-world blocker would be Vulkan ICD/driver availability on riscv64 hardware, not the Rust bindings |
| jemalloc allocator | Yes (default) | Yes (default) | No - `Cargo.toml` gates `tikv-jemallocator` to `cfg(target_arch = "x86_64", "aarch64")` only; riscv64 silently falls back to the system allocator |

**Functional gaps:** No official binary, package, or container image can be obtained for riscv64 through any channel researched (Section 8). A user must build from source, and even then the Docker path fails outright; a native `cargo build` path is untested.

**Performance gaps:** Every SIMD-accelerated hot path (dense similarity, quantized similarity, TurboQuant) has no riscv64 vector implementation; a riscv64 build would run measurably slower than amd64/arm64 on identical workloads, though no quantified benchmark exists (Section 11 - no riscv64 benchmark data was found anywhere, including Qdrant's own benchmark suite, RISE's blog, or academic literature).

**Security hardening gaps:** Not separately evaluated; no riscv64-specific security issue was found in this research.

**NaN / floating-point semantics:** No riscv64-specific floating-point or NaN-handling issue was found in the issue tracker. One superficially matching issue (#1435, "panic on division by zero", 2023) was checked and confirmed unrelated to architecture (no architecture mentions in its body).

## 7. CI/CD Infrastructure

No riscv64 CI exists. All 17 GitHub Actions workflow files in `.github/workflows/` were read directly (`codespell.yml`, `coverage.yml`, `debug-tools.yml`, `dev-docker-image-build-gpu.yml`, `dev-docker-image-build.yml`, `dev-docker-image-prune.yml`, `docker-image.yml`, `edge-py-release.yml`, `edge-rust-release.yml`, `edge-test.yml`, `integration-tests.yml`, `io-bridge-object-store-tests.yml`, `long-e2e-tests.yml`, `nightly-model-testing.yml`, `release-artifacts.yml`, `rust-gpu.yml`, `rust-lint.yml`, `rust.yml`); a case-insensitive grep for `riscv` across all of them returns zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository. No RISE runners are referenced anywhere.

- `release-artifacts.yml` (trigger: `on: release: types: [published]`) build matrix, verbatim: `x86_64-unknown-linux-gnu`, `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, `x86_64-apple-darwin`, `aarch64-apple-darwin`.
- `docker-image.yml` and `dev-docker-image-build*.yml` run on `runs-on: [self-hosted, linux, x64]` (x86_64-only self-hosted runner label) and build `platforms: linux/amd64,linux/arm64` (GPU variant: `linux/amd64` only).
- All other workflows (`rust.yml`, `rust-lint.yml`, `edge-test.yml`, `integration-tests.yml`, `coverage.yml`, `long-e2e-tests.yml`, `nightly-model-testing.yml`, `debug-tools.yml`, `codespell.yml`, `io-bridge-object-store-tests.yml`) run on GitHub-hosted `ubuntu-latest`/x86_64 or the self-hosted x64 runners, with no architecture other than x86_64/aarch64 referenced anywhere.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI runs tests | Yes | Yes | No |
| Release-blocking | Yes (release-artifacts.yml fires on published release) | Yes | N/A - no job exists |
| Hardware | GitHub-hosted + self-hosted x64 | Cross-built via Docker/Buildx | N/A |
| RISE runner usage | No | No | No |

Source: local clone of `qdrant/qdrant` at commit `6ab21cac18ebb6f4ae29102c7f8f5cc11affd5de`, confirmed current via `git fetch origin` (HEAD unchanged).

## 8. Distribution and Release Status

No official riscv64 binary exists in any channel checked.

- **GitHub Releases:** the last 10 release tags (v1.19.1 down to v1.16.2) were checked; v1.19.1 (latest) ships `qdrant-aarch64-apple-darwin.tar.gz`, `qdrant-aarch64-unknown-linux-musl.tar.gz`, `qdrant-x86_64-apple-darwin.tar.gz`, `qdrant-x86_64-pc-windows-msvc.zip`, `qdrant-x86_64-unknown-linux-gnu.tar.gz`, `qdrant-x86_64-unknown-linux-musl.tar.gz`, `qdrant-x86_64.AppImage`, `qdrant_1.19.1-1_amd64.deb`, plus source archives - no riscv64 asset. v1.16.2 shows the identical pattern. See [releases/expanded_assets/v1.19.1](https://github.com/qdrant/qdrant/releases/expanded_assets/v1.19.1).
- **PyPI:** `https://pypi.org/pypi/qdrant/json` returns HTTP 404 - no PyPI project literally named `qdrant` exists (the actual client package, `qdrant-client`, is a different name and was out of scope for this check).
- **Ubuntu 26.04 (resolute):** [package search](https://packages.ubuntu.com/search?keywords=Qdrant&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no `qdrant` package exists for any architecture, not just riscv64.
- **Arch Linux RISC-V port (archriscv):** [archriscv.felixc.at search](https://archriscv.felixc.at/?q=qdrant) does not list `qdrant`.
- **Docker images:** official images built only for `linux/amd64,linux/arm64` (Section 7); no `linux/riscv64` platform tag exists.
- **Project graph database (Ubuntu 26.04 index):** could not be queried - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) for the entirety of this research session. This is a tool/connection failure, not a confirmation of absence, and should be retried when the server is available.

**What a user must do to get a working binary today:** build from source with `cargo build --release --bin qdrant` on native riscv64 hardware or a riscv64-capable Rust cross-toolchain; this path is undocumented and untested by upstream. The Docker cross-build path fails outright due to the mold-linker download (Section 5). No prebuilt binary, package, or container image is obtainable through any official or distro channel.

## 9. Dependencies

Qdrant is a Rust/Cargo workspace; nearly all dependencies are source crates built by Cargo rather than consumed as Ubuntu `.deb` packages, so distro archive availability is largely moot for most of them - what matters is whether each crate compiles for the `riscv64gc-unknown-linux-gnu` Rust Tier-2 target. `jemalloc` and `shaderc` are the two entries that also map to system/C packages.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Rust (build-dependency, critical) | Language/compiler toolchain | Yes - `riscv64gc-unknown-linux-gnu` is a Rust Tier-2 target | N/A | N/A | MSRV `1.97` per `Cargo.toml`; Dockerfile pins `1.98.0`. No riscv64-specific minimum documented by Qdrant. |
| ring (build-dependency, critical) | Crypto backend for `rustls` (TLS), pulled in via `rustls = {features=["ring"]}` | Yes - `riscv64gc-unknown-linux-gnu` compiles via portable C fallback (no dedicated riscv64 assembly, so functional but not vector-accelerated) | Not independently verified (no upstream riscv64 CI) | N/A (source crate) | [briansmith/ring#2745](https://github.com/briansmith/ring) (closed "not planned"): only the newer `riscv64a23` ABI profile fails; standard Ubuntu `riscv64gc` is unaffected. Not a blocker for Qdrant. |
| rustls (build-dependency, critical) | TLS implementation for gRPC/HTTP | Yes - pure Rust, no arch-specific code | Not independently verified | N/A (source crate) | No riscv64-blocking issues found. |
| jemalloc (runtime-dependency, critical) | Default global allocator via `tikv-jemallocator` | Gated out entirely on riscv64: Qdrant's `Cargo.toml` restricts this dependency to `cfg(target_arch = "x86_64", "aarch64")` only, so it is not compiled in on riscv64 at all; system allocator is used instead | N/A - not compiled for this arch in Qdrant | Distro-packaged: Debian sid `libjemalloc2` 5.3.1-2 builds successfully on riscv64 per buildd | Upstream jemalloc issue [#2399](https://github.com/jemalloc/jemalloc) (open, 3+ years, no maintainer response) covers cross-compilation docs, not a native-build blocker; moot for Qdrant since the crate is not pulled in for this arch at all. |
| shaderc (build-dependency, optional) | Shader compiler for the optional GPU-indexing feature (`gpu` cargo feature, not default); built from source via CMake/C++ | Debian sid riscv64 build confirmed (buildd, approximately 10 minute build) [NEEDS VERIFICATION for Ubuntu 25.10/26.04 listing] | Not verified for GPU runtime path | Distro-packaged on Debian | Only relevant when the non-default `gpu` feature is enabled. |
| pprof-rs (build-dependency, optional) | Optional profiling support | Added RISC-V architecture support per its own changelog (surfaced only via Dependabot PRs [#1490](https://github.com/qdrant/qdrant/pull/1490) and [#1647](https://github.com/qdrant/qdrant/pull/1647), which are version-bump PRs, not Qdrant-authored RISC-V work) | Not independently verified | N/A (source crate) | Not a blocker; upstream crate itself claims RISC-V support. |
| pyroscope (`grafana/pyroscope-rs`, backend-jemalloc feature) [NEEDS VERIFICATION] | Optional profiling, pulled for all `cfg(target_os="linux")` | Unverified - unlike the primary jemalloc dependency, this one is not arch-gated in Qdrant's `Cargo.toml`; may attempt to pull jemalloc-sys on riscv64 too | Unverified | Unverified | No riscv64 issues found on `grafana/pyroscope-rs`, but this is an untested gap worth a real riscv64 build to confirm. |
| bitpacking (`quickwit-oss/bitpacking`, `BitPacker4x`) | SIMD bit-packing for posting lists (sparse-vector index hot path) | Compiles via portable scalar fallback; only x86 SSE3/AVX2 get real SIMD acceleration | Unverified on riscv64 hardware | N/A (source crate) | No riscv64 issues found on the upstream repo; likely compiles but runs unaccelerated. |
| io-uring (`tokio-rs/io-uring`) | Async I/O syscalls | riscv64 support was added upstream (resolved via a merged PR) | Unverified | N/A (source crate) | Historically resolved; no open riscv64 issue. |

## 10. Ecosystem Status

Omitted. Qdrant is distributed as a standalone server binary/Docker image with a Cargo-built dependency tree; it is not consumed as a dependency by a package ecosystem (npm, PyPI, Maven, Kubernetes operators) whose own riscv64 coverage would need separate assessment. (The `qdrant-client` Python package is a separate, differently-named project outside the scope of this report.)

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#5638](https://github.com/qdrant/qdrant/issues/5638) | RISC-V Support | Open, stalled since 2024-12-21 | Feature request, not a bug | Sole tracking issue; no linked/closing PR; blocked in part on Rust lacking RVV intrinsic support at the time of discussion |

No RISC-V-specific correctness bugs (NaN handling, floating-point divergence, SIMD fallback panics) were found in any open or closed issue. No performance benchmark data for Qdrant on RISC-V exists from any source checked: Qdrant's own benchmark suite ([qdrant.tech/benchmarks](https://qdrant.tech/benchmarks/), `qdrant/benchmark` repo) covers only x86_64/ARM comparisons; the one academic paper benchmarking Qdrant specifically (arXiv 2509.12384, "Exploring Distributed Vector Databases Performance on HPC Platforms: A Study with Qdrant") evaluates HPC/x86 platforms only; RISE's blog has no Qdrant-related post and its own site search for "qdrant" returns no results.

## 12. Objections and Upstream Blockers

**Stated objections:** None outright - the CTO's response to issue #5638 is noncommittal rather than a refusal: "I can't estimate the scope of changes... I can't promise this feature will be prioritized on our roadmap. Still, if there are enthusiasts who want to give it a try, we will consider their contribution." ([qdrant/qdrant#5638](https://github.com/qdrant/qdrant/issues/5638))

**Technical blockers:**
1. Rust's lack of stable RVV intrinsic support at the time of the December 2024 discussion, flagged by community member camel-cdr as the fundamental blocker for bringing the SIMD similarity-search kernels to parity with the existing AVX/SSE/NEON paths.
2. The Docker cross-build pipeline hard-fails on riscv64 today due to the pinned `mold` linker download only covering x86_64/aarch64 (Section 5) - a fixable but unaddressed gap.
3. `build.rs` for the C-based quantization kernels compiles nothing at all on riscv64 (early return), meaning even a successful native Cargo build would ship without any accelerated quantization path, correctness of the resulting scalar-only binary being unverified.

**Organizational blockers:** No dedicated engineering resource has been assigned; the company's default posture is to accept but not originate community contributions. No RISE or other third-party engagement has picked up the work (Section 1).

**Acceptance probability:** Moderate, conditional on external contribution. The maintainer response is explicitly open to a community-submitted PR, and no technical objection rules out a port outright - the blockers are effort and toolchain maturity (RVV in Rust), not upstream resistance. However, 21 months have elapsed since the issue was opened with zero submitted PRs, so nothing currently in motion would close the gap without new investment.

## 13. Readiness Assessment

- **Color:** orange (optimization-absent)
- **Release provider:** none
- **Optimization level:** absent - zero RISC-V-specific code exists anywhere in the codebase (0 matches for `riscv`/`rvv`/RVV intrinsic types across all `.rs`/`.c` files); dense-vector similarity falls back to a generic scalar Rust loop, and the C-based quantization/TurboQuant kernels compile no code at all on riscv64 (`build.rs` early-returns), a stricter condition than the scalar fallback.
- **Justification:** No upstream riscv64 CI exists - all 17 GitHub Actions workflow files were read directly and contain zero riscv references ([`.github/workflows/`](https://github.com/qdrant/qdrant)), and the release-artifacts and Docker build matrices target only `x86_64`/`aarch64` variants. No distribution floor applies because no distro (Ubuntu 26.04, Arch RISC-V) or registry (PyPI) ships a `qdrant` package for any architecture, let alone riscv64. Because Qdrant's core value proposition is SIMD-accelerated vector similarity search and zero RISC-V-specific optimization code exists ([qdrant/qdrant#5638](https://github.com/qdrant/qdrant/issues/5638)), the optimization-absent cap applies - though in this case it coincides with, rather than lowers, the CI-driven primary grade of orange, since no upstream CI already places the project at orange before the optimization modifier is even applied.
- **Pending work:** Issue [#5638](https://github.com/qdrant/qdrant/issues/5638) remains open and is the only tracked path forward; a Qdrant engineer (timvisee) expressed interest in a QEMU-based attempt in December 2024 but never followed up with a PR. No RISE involvement exists (not a RISE member, no RISE blog coverage, no RISE-mirrored wheels or RFP). The one adjacent piece of infrastructure progress is PR [#8662](https://github.com/qdrant/qdrant/pull/8662), which added riscv64 wheel-building capability to the PyO3/maturin-action tooling Qdrant's Python release pipeline depends on - relevant groundwork for a future Python-client riscv64 build, but not itself a Qdrant server port.

## 14. Investment Analysis

RISE has not funded, RFP'd, or otherwise touched Qdrant (Section 1, Section 13) - no existing RISE work can be netted out of the estimates below; all of the following is unstarted.

### 14.1 Functional Enablement

Getting a native `cargo build --release --bin qdrant --target riscv64gc-unknown-linux-gnu` working and verified is the minimum bar for a "known to build" state, which is what issue #5638 actually asks for:
- Validate the existing scalar fallback paths compile and produce correct results on riscv64 (dense similarity metrics) - likely low effort since the code already exists and just needs a build+test pass on real or QEMU-emulated hardware.
- Fix the `build.rs` early-return for the C-based quantization/TurboQuant kernels so that riscv64 at minimum gets a portable C reference implementation instead of compiling nothing - moderate effort, requires auditing what the "missing" condition currently produces at runtime.
- Add a `*/riscv64` case arm to the Dockerfile's `BUILDPLATFORM` switch and source a riscv64 `mold` linker release (upstream `mold` already publishes one) - low effort.
- Add `jemalloc`/`tikv-jemallocator` support for riscv64 in `Cargo.toml`'s arch-gate, contingent on jemalloc's own riscv64 maturity (currently distro-packaged but not upstream-CI-tested) - low-to-moderate effort, optional (system allocator works as a fallback).

### 14.2 Performance Optimization

Full parity with amd64/arm64 requires RVV kernel implementations for the SIMD-accelerated similarity and quantization hot paths (`lib/segment/src/spaces`, `lib/quantization`) - this is explicitly gated on upstream Rust RVV intrinsic maturity, which was flagged as absent at the time of the December 2024 discussion and was not independently re-verified as part of this research [NEEDS VERIFICATION: current Rust RVV intrinsic status as of 2026-09]. This is a substantial, multi-quarter undertaking requiring RISC-V vector-extension expertise, not a quick patch.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `rust.yml`/`rust-lint.yml` (build+test) and a riscv64 target to `release-artifacts.yml` (release binary) and `docker-image.yml` (container image) is low-to-moderate effort once functional enablement (14.1) is done, assuming access to riscv64 CI hardware or RISE-hosted runners - Qdrant has no self-hosted riscv64 runner today and no relationship with RISE to acquire one.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 was omitted because Qdrant has no dependent package ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Validate/fix native `cargo build` on riscv64gc target; resolve `build.rs` early-return for C quantization kernels | 2-4 | Qdrant engineering or external contributor | Critical |
| Functional | Fix Dockerfile `BUILDPLATFORM` case statement and mold-linker sourcing for riscv64 | 0.5-1 | Qdrant engineering or external contributor | High |
| Functional | Resolve jemalloc arch-gate for riscv64 (or confirm system-allocator fallback is acceptable) | 0.5-1 | Qdrant engineering or external contributor | Medium |
| Performance | Implement RVV kernels for dense similarity metrics (Euclid/Manhattan/Dot/Cosine) | 4-8 (contingent on Rust RVV intrinsic maturity) | External contributor with RISC-V SIMD expertise | Medium |
| Performance | Implement RVV/portable-C kernels for quantization (PQ/binary/u8) and TurboQuant | 4-8 (contingent on Rust RVV intrinsic maturity) | External contributor with RISC-V SIMD expertise | Medium |
| CI/CD | Add riscv64 build+test job and release/Docker targets | 2-3 (plus runner acquisition) | Qdrant engineering | High |
| CI/CD | Acquire riscv64 CI hardware or RISE-hosted runner access | Non-engineering / procurement | Qdrant engineering, potentially via RISE partnership | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [qdrant/qdrant#5638 - "RISC-V Support" (master tracking issue)](https://github.com/qdrant/qdrant/issues/5638)
- [qdrant/qdrant PR #1490 - Bump pprof from 0.11.0 to 0.11.1](https://github.com/qdrant/qdrant/pull/1490)
- [qdrant/qdrant PR #1647 - Bump pprof from 0.11.0 to 0.11.1](https://github.com/qdrant/qdrant/pull/1647)
- [qdrant/qdrant PR #8662 - Bump PyO3/maturin-action from 1.50.1 to 1.51.0](https://github.com/qdrant/qdrant/pull/8662)
- [qdrant/qdrant release-artifacts.yml, docker-image.yml, and all .github/workflows files](https://github.com/qdrant/qdrant)
- [qdrant/qdrant releases - v1.19.1 asset listing](https://github.com/qdrant/qdrant/releases/expanded_assets/v1.19.1)
- [qdrant/qdrant releases - v1.16.2 asset listing](https://github.com/qdrant/qdrant/releases/expanded_assets/v1.16.2)
- [PyPI - qdrant package lookup (404)](https://pypi.org/pypi/qdrant/json)
- [Ubuntu 26.04 (resolute) package search - Qdrant](https://packages.ubuntu.com/search?keywords=Qdrant&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port (archriscv) package search - qdrant](https://archriscv.felixc.at/?q=qdrant)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [Qdrant benchmarks (qdrant.tech)](https://qdrant.tech/benchmarks/)
- [qdrant/benchmark repository](https://github.com/qdrant/benchmark)
- [Qdrant ARM architecture support blog post](https://qdrant.tech/blog/qdrant-supports-arm-architecture/)
- [arXiv 2509.12384 - Exploring Distributed Vector Databases Performance on HPC Platforms: A Study with Qdrant](https://arxiv.org/pdf/2509.12384)
- [briansmith/ring issue #2745](https://github.com/briansmith/ring)
- [jemalloc/jemalloc issue #2399](https://github.com/jemalloc/jemalloc)
- [qdrant/qdrant issue #1435 - panic on division by zero (checked, confirmed unrelated to RISC-V)](https://github.com/qdrant/qdrant/issues/1435)