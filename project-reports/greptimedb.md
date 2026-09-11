---
title: GreptimeDB
parent: Project Reports
color: yellow
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: jemalloc
    relation: runtime-dependency
    criticality: critical
  - name: aws-lc-rs
    relation: runtime-dependency
    criticality: critical
  - name: ring
    relation: runtime-dependency
    criticality: critical
  - name: pprof-rs
    relation: runtime-dependency
    criticality: critical
  - name: simd-json
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: optional
  - name: distroless
    relation: runtime-dependency
    criticality: critical
---

# GreptimeDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for GreptimeDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="greptimedb" %}

## 1. Project Overview

GreptimeDB is an open-source, cloud-native time-series database written entirely in Rust, developed and led by Greptime Inc. (founded 2022, HQ Sunnyvale CA / Spring TX). The core engine is licensed Apache-2.0; a separate `LICENSE-ENTERPRISE` covers paid, source-available enterprise features (open-core model). Homepage: [greptime.com](https://greptime.com/). Repository: [GreptimeTeam/greptimedb](https://github.com/GreptimeTeam/greptimedb).

**Governance.** GreptimeDB is a single-vendor, company-led project. It is not under CNCF, the Apache Software Foundation, the Linux Foundation, or any other neutral foundation - the Apache-2.0 license is a licensing choice, not a governance structure. There is no technical steering committee, no public voting process, and no written platform-tier policy (`PLATFORMS.md`/`SUPPORT.md` do not exist in the repo). [CONTRIBUTING.md](https://github.com/GreptimeTeam/greptimedb/blob/main/CONTRIBUTING.md) describes an informal committer ladder: sustained high-quality contributors become "committers" with repo write access, tracked in [AUTHOR.md](https://github.com/GreptimeTeam/greptimedb/blob/main/AUTHOR.md). [.github/CODEOWNERS](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/CODEOWNERS) shows module ownership concentrated in roughly ten named Greptime engineers plus a catch-all `@GreptimeTeam/db-approver` team - centralized, company-controlled review authority.

**Corporate maintainers.** `AUTHOR.md` splits "Individual Committers" from "Team Members"; the latter maps 1:1 onto Greptime Inc. leadership and staff: Ning Sun (`sunng87`, Cofounder & CTO), Jiachun Feng (`fengjiachun`, Cofounder & Tech VP), Xiaodan Zhuang (Founder & CEO), Weny Xu (`WenyXu`), discord9, Ruihang Xia (`waynexia`), Yingwen (`evenyag`), Lei Huang (`v0y4g3r`), dennis zhuang (`killme2008`), and MichaelScofield.

**Community culture on new ports.** There is no RFC process for platform ports (`docs/rfcs/` covers only engine/feature design). The RISC-V port was authored and merged directly by a core maintainer (`v0y4g3r`) in a single comprehensive PR rather than through any documented community-approval or tiering process, consistent with the project's pragmatic, engineering-driven governance style. `CONTRIBUTING.md`'s general tone ("we will happily accept a PR ... don't wait to have everything working") signals openness to contribution broadly, but this specific port was maintainer-initiated, not community-requested.

**RISE membership.** GreptimeDB/Greptime Inc. is not a member of the RISE Project. Checked directly against [riseproject.dev/members](https://riseproject.dev/members/): Premier members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent; General members are Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, and ZTE. No Greptime entry exists in either tier.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-08-10 | PR [#8820](https://github.com/GreptimeTeam/greptimedb/pull/8820), "feat: add riscv64 cross-build support," opened and merged same day (~3.5 hours open-to-merge) | [PR #8820](https://github.com/GreptimeTeam/greptimedb/pull/8820) |
| 2026-09-03 | Release [v1.3.0-alpha.1](https://github.com/GreptimeTeam/greptimedb/releases/tag/v1.3.0-alpha.1) published - first release to include a `greptime-linux-riscv64-*` binary artifact | [Release notes](https://docs.greptime.com/release-notes/release-1-3-0-alpha-1/) |
| 2026-09-07 | Nightly pre-release `v1.3.0-alpha.1-nightly-20260907` published, also carrying a riscv64 artifact | GitHub Releases page (verified via asset fetch) |
| 2026-09-08 | Stable release v1.2.0 published; cut from an older 1.2.x branch that predates the PR #8820 merge, so it carries **no** riscv64 artifact | GitHub Releases page (verified via asset fetch) |

**Key contributor.** Lei Huang (GitHub `v0y4g3r`), a Greptime Inc. core Team Member and CODEOWNER for log-store, store-api, and metric-engine modules - i.e. an internal engineer, not an external drive-by contributor - authored the entire port. Sole review: Jiachun Feng (`fengjiachun`, Cofounder & Tech VP), one-word approval "LGTM". Two automated bots (Copilot AI, `chatgpt-codex-connector`) left non-blocking inline comments on the Makefile, both resolved.

**No prior tracking issue.** Exhaustive search of GreptimeTeam/greptimedb issues for `riscv`, `riscv64`, and `risc-v` returned zero results in every case. The PR itself is the de facto tracking record; it references no prior issue.

**Is it fully upstream?** Yes, the build/release infrastructure is merged to `main` with no fork or downstream patch required. The PR body states no source-code changes were needed because the codebase already compiled cleanly for riscv64 via Rust/LLVM's generic backend, and all architecture-sensitive dependencies (`tikv-jemalloc-sys`, `aws-lc-sys` 0.41, `ring` 0.17, `pprof` 0.14, `simd-json`) already supported the target. However, "fully upstream" as merged code does not equal "fully supported" as a release: the artifact currently ships only in the `v1.3.0-alpha.*` pre-release channel, not in the latest stable release (v1.2.0).

## 3. Upstream Support Tier

No formal, written tier policy exists (no `PLATFORMS.md`, `SUPPORT.md`, or tier-policy doc anywhere in the repo). De facto tiers must be inferred from [release.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/release.yml): official Linux artifacts cover amd64, arm64, and riscv64; macOS covers arm64/x86_64 Darwin; Windows covers x86_64-msvc.

`build-linux-riscv64-artifacts` is a hard requirement (`needs.build-linux-riscv64-artifacts.result == 'success'`) for `publish-github-release`, unlike macOS/Windows jobs which are allowed to report `skipped`. This means riscv64 build success gates the release pipeline exactly as amd64/arm64 do - but the *content* of what riscv64 CI verifies is materially thinner, per the direct file comparison below.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | native | native | cross-compile on an amd64 runner |
| Build job | shared `build-linux-artifacts` action | shared `build-linux-artifacts` action | bespoke job (`build-linux-riscv64-artifacts`), not the shared action |
| PR-gate CI job | `test` (full build + test suite) | `test` | `check-riscv64` = `cargo check` only (type-check, no build, no test) |
| Integration tests | run | run | explicitly skipped ("cross-compiled binary cannot run on the amd64 host") |
| Runtime Docker image | built and pushed | built and pushed | none published - distroless has no riscv64 base image |

Source: direct read of [rust.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/rust.yml) and [release.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/release.yml), cross-verified via raw file fetch from `raw.githubusercontent.com`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

GreptimeDB has **no RISC-V ISA-specific source code of its own**. A full-tree search of the cloned repository (`GreptimeTeam/greptimedb` @ commit `1c4d3a1`) found:

- `grep -rn 'target_arch' --include='*.rs' .` -> **0 matches** in the entire Rust source tree. There is no `#[cfg(target_arch = "riscv64")]`, no architecture-conditional compilation for riscv64, amd64, or arm64 anywhere in GreptimeDB's own code.
- Full case-insensitive `riscv` search across the repo -> exactly 8 files, all build/CI/Docker plumbing, zero `.rs` files: `Makefile`, `.cargo/config.toml`, `docker/dev-builder/riscv64/Dockerfile`, `.github/workflows/rust.yml`, `.github/workflows/release.yml`, `.github/workflows/release-dev-builder-images.yaml`, `.github/actions/build-dev-builder-images/action.yml`, and `cyborg/pnpm-lock.yaml` (an incidental transitive npm dependency - esbuild's optional riscv64 binary for the frontend dashboard build, unrelated to the database engine).

GreptimeDB is a pure-Rust workspace with no JIT compiler, no hand-tuned SIMD kernels, and no per-architecture GC-barrier or assembly code of its own for any architecture (amd64 and arm64 included). Whatever architecture-specific optimization exists in the stack lives entirely inside upstream dependency crates (jemalloc allocator, aws-lc-rs/ring cryptography, pprof-rs profiling, simd-json parsing) rather than in GreptimeDB's own code. This is confirmed by the PR #8820 author's own claim that "no source changes are required."

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | none in GreptimeDB (uses DataFusion's LLVM-based query engine, not custom JIT) | same | same |
| SIMD | none hand-written by GreptimeDB; relies on dependency crates (`simd-json`) and LLVM auto-vectorization | same | same, portable/scalar fallback per `simd-json`'s riscv64 support |
| Crypto | delegated to `aws-lc-rs`/`ring` | delegated | delegated |
| Assembly | none | none | none |
| GC barriers | N/A (Rust, no GC) | N/A | N/A |

**Conclusion for Section 4/13 purposes:** GreptimeDB is not an "optimization-purpose" project in the sense defined by the readiness color model - it is a general-purpose database server whose value proposition does not depend on hand-tuned per-architecture kernels. The optimization-purpose modifier (Step 2 of the color model) therefore does not apply to GreptimeDB itself, although it is highly relevant to several of its dependencies (see Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

GreptimeDB is a pure Rust/Cargo project, not CMake-based. There is no `CMakeLists.txt`, `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/` directory, or cmake toolchain file anywhere in the repo (verified by direct search of the cloned tree). All riscv64 cross-compilation is driven by Cargo, a dedicated Docker cross-toolchain image, and Make targets.

**Toolchain requirements (exact, from source):**
- Rust: `nightly-2026-03-21`, pinned in `rust-toolchain.toml`
- Rust target: `riscv64gc-unknown-linux-gnu`
- C cross toolchain: `gcc-riscv64-linux-gnu` / `g++-riscv64-linux-gnu` from Ubuntu 22.04 apt (no pinned minimum version beyond "whatever Ubuntu 22.04 ships"), needed because Cargo build scripts compile native C dependencies and link via `riscv64-linux-gnu-gcc`
- protoc/protobuf v29.3, installed manually from an upstream release zip in the Dockerfile - apt's bundled v3.12 is explicitly called out in the Dockerfile as too old

**Cross-build Dockerfile** ([docker/dev-builder/riscv64/Dockerfile](https://github.com/GreptimeTeam/greptimedb/blob/main/docker/dev-builder/riscv64/Dockerfile)): based on `ubuntu:22.04`, installs the riscv64 cross-gcc toolchain, protoc, rustup, and adds the `riscv64gc-unknown-linux-gnu` Rust target.

**Linker configuration** (`.cargo/config.toml`):
```
[target.riscv64gc-unknown-linux-gnu]
linker = "riscv64-linux-gnu-gcc"
```

**Exact commands:**
```
# Build the cross dev-builder image
make dev-builder-riscv64

# Cross-compile the greptime release binary
make build-riscv64-bin CARGO_PROFILE=release FEATURES=servers/dashboard

# CI compile-check (no linking of a full binary)
cargo check --locked --workspace --all-targets --features servers/dashboard --target riscv64gc-unknown-linux-gnu
```

**QEMU usage: none for riscv64 execution.** `docker/setup-qemu-action@v3` appears in the repo but is explicitly scoped to `platforms: linux/amd64,linux/arm64` for multi-arch Docker buildx image builds - riscv64 is excluded from that platform list. The PR author manually booted the cross-compiled binary under `qemu-riscv64` in standalone mode outside of CI and confirmed `CREATE TABLE`/`INSERT`/`SELECT` worked over HTTP, but this manual smoke test is not part of any automated CI job.

**Known build issues:** none reported. The PR states the codebase "already compiles cleanly for riscv64." `Cross.toml` passes through `JEMALLOC_SYS_WITH_LG_PAGE`, evidence the team has already hand-tuned the jemalloc build for cross targets.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles | yes | yes | yes (`cargo check` in CI; full release build succeeds) |
| Test suite executes | yes | yes | no - explicitly skipped |
| Official binary artifact | yes | yes | yes, but pre-release channel only (v1.3.0-alpha.1+) |
| Official Docker/OCI image | yes | yes | no - distroless has no riscv64 base image |
| Stable release inclusion | yes (v1.2.0) | yes (v1.2.0) | no - not yet in a stable tag |

**Functional gaps.** A riscv64 user cannot pull an official container image (must use the bare binary tarball); cannot get a riscv64 artifact from the current stable release (must use a pre-release/alpha build); and has no CI-verified guarantee that the binary actually runs correctly, since integration tests never execute on riscv64 in any automated pipeline.

**Performance gaps.** Data not available: no performance benchmark of GreptimeDB on riscv64 hardware exists from any source checked (GreptimeDB's own `docs/benchmarks/tsbs/` documents, greptime.com's blog, riseproject.dev, or general web search). GreptimeDB's published TSBS benchmark documents cover only x86_64 cloud instances with no RISC-V or ARM64 comparison.

**Security hardening gaps.** Data not available: no research was conducted (or findings returned) on hardening flags (stack protector, FORTIFY_SOURCE, PIE, RELRO) for the riscv64 build specifically.

**NaN / floating-point semantics.** Data not available: no findings addressed RISC-V floating-point NaN-boxing or canonical-NaN semantics for GreptimeDB specifically; no related bug reports were found (see Section 11).

## 7. CI/CD Infrastructure

Confirmed riscv64 references exist in exactly 3 of 23 GitHub Actions workflow files in the repo; all other workflows (apidoc, cargo-lock-check, dependency-check, dev-build, docs, grafana, nightly-build, nightly-ci, nightly-jsonbench, pr-labeling, query-regression, run-multi-lang-tests, schedule, semantic-pull-request, etc.) contain zero riscv references. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, Azure Pipelines, Travis, CircleCI, or Buildkite configuration exists anywhere in the repository.

**1. `check-riscv64`** ([rust.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/rust.yml), lines 99-123). Runner: `ubuntu-latest` (x86_64 GitHub-hosted). Triggers: `schedule` (weekdays 15:00 UTC), `merge_group`, `pull_request`, `workflow_dispatch`. Action: installs the riscv64 cross-gcc toolchain and runs `cargo check --locked --workspace --all-targets --features servers/dashboard --target riscv64gc-unknown-linux-gnu`. This is a type-check only - no `cargo build`, no `cargo test`. The job is not listed in any other job's `needs:` (only the `test` job declares `needs: [conflict-check, clippy, fmt, check-udeps]`, which excludes `check-riscv64`), so it cannot be confirmed as a required branch-protection status check from the workflow file alone.

**2. `build-linux-riscv64-artifacts`** ([release.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/release.yml), lines 231-275). Runner: a self-hosted amd64 EC2 instance (`ec2-c6i.4xlarge-amd64` by default). Triggers: `push` on tags `v*.*.*`, `schedule` (Monday 00:00 UTC), `workflow_dispatch`. Action: cross-compiles the `greptime` binary via `make build-riscv64-bin` using the `dev-builder-riscv64` Docker image, uploads `greptime-linux-riscv64-<version>` as a release artifact. The file's own comment states: "Integration tests are skipped because the cross-compiled binary cannot run on the amd64 host." This job IS release-blocking (`needs.build-linux-riscv64-artifacts.result == 'success'` gates `publish-github-release`).

**3. `release-dev-builder-images.yaml`** publishes only the riscv64 cross-toolchain Docker image (`dev-builder-riscv64`) consumed by job 2 above - not application CI.

**No RISE runner usage.** No reference to `riseproject-dev`, RISE RISC-V runners, or RISE infrastructure was found anywhere in the workflow files or in RISE's own public records.

**Hardware used:** none. All riscv64 CI activity - compile-check and release cross-build alike - runs on x86_64 GitHub-hosted or self-hosted EC2 amd64 instances. No native riscv64 hardware and no QEMU emulation of riscv64 execution is used anywhere in GreptimeDB's CI.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | yes | yes | yes (build/check only) |
| Native or emulated hardware | native | native | cross-compile on amd64, no emulation of execution |
| Test suite runs | yes | yes | no |
| Release-blocking | yes | yes | yes (for the build/artifact step only) |
| RISE runner used | no | no | no |

## 8. Distribution and Release Status

**GitHub Releases (primary and only real channel).** `greptime-linux-riscv64-v1.3.0-alpha.1.tar.gz` was independently verified live and downloadable: HTTP 200, `Content-Length: 190879395` bytes (~190.9 MB), served from `release-assets.githubusercontent.com`, with a matching `.sha256sum` file also fetched and confirmed. Shipped in [v1.3.0-alpha.1](https://github.com/GreptimeTeam/greptimedb/releases/tag/v1.3.0-alpha.1) (2026-09-03) and the subsequent `v1.3.0-alpha.1-nightly-20260907` pre-release. The current **latest stable release, v1.2.0 (2026-09-08), does not carry a riscv64 asset** - it was cut from a pre-PR#8820 branch.

**PyPI.** `https://pypi.org/pypi/greptimedb/json` returns HTTP 404 - no package of this name exists. A separate unrelated package named `greptime` exists (a pure-Python mock/test library for GreptimeDB's scripting feature, maintained by a different author, last released 2023, `py3-none-any` only) and is not relevant to riscv64 distribution.

**Ubuntu 26.04 ("resolute").** `packages.ubuntu.com` search for `greptimedb` across all sections/architectures in suite `resolute` returns "Sorry, your search gave no results." No package exists for any architecture, riscv64 included.

**Debian, Fedora, Arch Linux RISC-V.** [archriscv.felixc.at](https://archriscv.felixc.at/?q=greptimedb) does not list `greptimedb` at all. Data not available for Debian/Fedora: not independently queried this cycle, but no evidence of any package exists in any source consulted.

**Ubuntu 26.04 project-graph query.** Could not be executed - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) for the entire research session. This is a tooling gap, not confirmed evidence of absence, though it is consistent with the direct `packages.ubuntu.com` web check above.

**What a user must do to get a working riscv64 binary today:**
1. Download `greptime-linux-riscv64-v1.3.0-alpha.1.tar.gz` (or a later `v1.3.0-alpha.*`/nightly build) directly from [GitHub Releases](https://github.com/GreptimeTeam/greptimedb/releases) - there is no package-manager path.
2. Accept that this is a pre-release/alpha build, not GreptimeDB's current stable channel.
3. Run the bare binary directly - there is no official riscv64 container image, since distroless (the runtime base image GreptimeDB uses for amd64/arm64) has no riscv64 base.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| Rust | build-dependency, critical | Yes - `nightly-2026-03-21` pinned toolchain with `riscv64gc-unknown-linux-gnu` target added via rustup | N/A (toolchain, not tested itself in this context) | N/A | Toolchain pinned in `rust-toolchain.toml`; no riscv64-specific issues reported |
| GCC | build-dependency, critical | Yes - `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu` from Ubuntu 22.04 apt, used as the Cargo linker for the riscv64 target | N/A | N/A | No pinned minimum version beyond Ubuntu 22.04's apt package |
| jemalloc (`tikv-jemalloc-sys` via a `GreptimeTeam/jemallocator` fork, rev `e1846d8`, jemalloc 5.3.1+TSD/tcache backport) | runtime-dependency, critical | Builds in GreptimeDB's own riscv64 CI/release pipeline today; upstream jemalloc's riscv64gc triple was only recognized in a config.sub/config.guess update as of March 2026 | No riscv64 execution in jemalloc's own CI (x86_64/arm64 only) nor GreptimeDB's riscv64 job | Debian sid / Ubuntu 24.04 Noble ship `libjemalloc2` riscv64; `libjemalloc-dev` availability for riscv64 on Noble is [NEEDS VERIFICATION] | [jemalloc/jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399) (cross-compile docs gap, open, no maintainer response in 3+ years); no correctness bugs open |
| aws-lc-rs (`aws-lc-sys`) | runtime-dependency, critical | Yes - v0.41 ships pregenerated riscv64 bindings per the PR body; historically the highest-risk crypto crate due to hand-written per-arch assembly, but all riscv64-blocking issues found (`#714`/`#874` bindings, `#735` CMake/Clang removal) are closed/resolved | Not independently verified | Presumed available (cargo crate) | No open riscv64 issues found in current search |
| ring | runtime-dependency, critical | Yes - v0.17 per the PR body; history of riscv64 build failures (issues `#1419`, `#1612`, `#1615`, `#1967`, `#2148`) are all closed | Not independently verified | Presumed available (cargo crate) | 0 open riscv64 issues in [briansmith/ring](https://github.com/briansmith/ring) at time of research |
| pprof-rs | runtime-dependency, critical | Yes - v0.14 per the PR body | Not independently verified | Presumed available (cargo crate) | No riscv64-specific issues found in research |
| simd-json | runtime-dependency, critical | Yes - portable/scalar fallback when no SIMD target is detected; [simd-lite/simd-json#303](https://github.com/simd-lite/simd-json/issues/303) "Basic support for riscv64" is closed/resolved | Not independently verified | Presumed available (cargo crate) | None currently open |
| QEMU | test-dependency, critical | N/A (emulator, not a build target) | Used only for a one-time manual smoke test by the PR author (`qemu-riscv64` standalone execution of `CREATE TABLE`/`INSERT`/`SELECT`) - not part of any automated CI job; `setup-qemu-action` in the repo is scoped only to `linux/amd64,linux/arm64` for Docker buildx, excluding riscv64 | N/A | Not currently integrated into automated CI - a gap, since it is the only path to automated riscv64 test execution without native hardware |
| Docker | build-dependency, optional | Used to build the `dev-builder-riscv64` cross-toolchain image and to run the cross-compilation step (`make build-riscv64-bin`) | N/A | N/A | Not required to consume a release binary, only to build one via the documented cross-build workflow |
| distroless | runtime-dependency, critical | N/A - no riscv64 base image exists upstream from Google's `distroless` project | N/A | **No riscv64 runtime container image is published** - this is an explicit, acknowledged gap in the PR body ("Runtime docker images are NOT built for riscv64 ... can be evaluated separately") | Blocking factor for official riscv64 container image; distroless riscv64 base availability is [NEEDS VERIFICATION] from Google's own project |

**Deeper-recursed indirect dependencies identified via `Cargo.lock`/`Cargo.toml` analysis** (not in the direct-dependency list above, but material to the storage/network hot path and confirmed to compile for riscv64 because GreptimeDB's own `check-riscv64` job type-checks the full workspace dependency tree on every PR):

- **rustls** - TLS used across 11+ workspace crates; pure-Rust, portable; no riscv64 issues found in [rustls/rustls](https://github.com/rustls/rustls).
- **zstd** (`zstd-sys`, wraps `facebook/zstd`) - compression used by mito2, Parquet, tantivy, gRPC. Builds and passes correctness tests on riscv64 via upstream QEMU CI (PR-triggered only), but the RVV performance path has 7 open PRs stalled on maintainer review for 2-6 months each. No PyPI riscv64 wheel.
- **lz4** (`lz4_flex`, pure Rust; C `lz4`/`lz4-sys` pulled in separately by `rskafka`) - functionally complete on riscv64 (QEMU correctness CI), RVV/fast-decode-loop paths not yet enabled (perf gap only). 5 open perf PRs stalled on single-maintainer bandwidth.
- **brotli** - riscv64 base port merged upstream since 2018; functionally complete. No riscv64 execution in any of 8 upstream CI workflow files. RVV optimization PRs exist but are CLA-blocked or abandoned.
- **bzip2** - pure, portable C89 with no architecture-specific code; works by construction, zero riscv64 issues ever filed.
- **crc32fast** - pure-Rust checksum used by mito2 and raft-engine; portable fallback, not independently deep-researched.
- **crc32c** (Google `crc32c`, used by `rskafka`) - no hardware CRC path for riscv64 (portable scalar fallback, correctness OK); one open build-detection PR (`#75`) CLA-blocked; project largely dormant upstream since Sep 2024.
- **nalgebra** - pure-Rust linear algebra used by common-function/index/query; no riscv64-specific issues found.
- **tantivy** - full-text search engine used by the `index` crate; no riscv64 issues found; inherits any gaps from its zstd/lz4/crc32fast dependencies.
- **raft-engine** (tikv/raft-engine) - WAL storage engine for `log-store`; no riscv64 issues found; depends on crc32fast/zstd above.

**Key takeaway:** GreptimeDB's own `check-riscv64` CI job type-checks this entire dependency graph on every PR, which is the strongest single data point that the whole stack compiles for `riscv64gc-unknown-linux-gnu` today. However, no dependency in this chain is ever executed on riscv64 in GreptimeDB's own CI (explicitly skipped), and only zstd/lz4/brotli have any upstream riscv64 test execution of their own (correctness-only QEMU CI, not performance).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | (none found) | - | - | Exhaustive search of GreptimeTeam/greptimedb issues for `riscv`, `riscv64`, `risc-v`, `riscv64gc`, and "riscv nan floating" returned zero matching issues or PRs in every query variant. One issue (`#7295`, an ARM64 crash report) surfaced under a semantic "riscv64 bug" search but is unrelated (ARM64, not RISC-V) and is excluded. |

No open or closed correctness bugs, no performance bugs, and no reported crashes exist for riscv64 in GreptimeDB's issue tracker. Given riscv64 support only reached cross-build/CI-check maturity with PR #8820, and the only verification beyond CI is a single manual QEMU smoke test by the author, the absence of bug reports is consistent with minimal real-world exercise of the riscv64 build - not with a track record of confirmed correctness.

## 12. Objections and Upstream Blockers

**Stated objections:** none. The PR received a single "LGTM" approval with no debate, no blocking comments, and no correctness concerns raised by either human reviewers or the two automated review bots (Copilot AI, `chatgpt-codex-connector`).

**Technical blockers (self-identified by the author, in the PR body):**
1. **Runtime container image gap:** "Runtime docker images are NOT built for riscv64 (distroless has no riscv64 base image; can be evaluated separately)." This remains unresolved as of the research date.
2. **Release-sequencing hazard:** the `build-linux-riscv64-artifacts` job pulls `dev-builder-riscv64:${DEV_BUILDER_IMAGE_TAG}` from ECR, which only exists after (1) the PR merges, (2) `release-dev-builder-images` runs and publishes the image, and (3) a follow-up "update dev-builder image tag" PR merges. If a tagged release runs between steps (1) and (3), the riscv64 job fails and gates `publish-github-release`. This is a self-identified operational risk, not yet reported as having caused an actual failure.
3. **No test execution:** the release job explicitly skips integration tests because the cross-compiled binary cannot run on the amd64 CI host - there is no automated verification that the riscv64 binary is correct beyond compilation and one manual smoke test.

**Organizational blockers:** none found. No governance body, tier-approval process, or external stakeholder stands between the current state and further riscv64 work - GreptimeDB's informal, company-controlled governance model means a maintainer can extend riscv64 support unilaterally, as already happened with PR #8820.

**Acceptance probability for further riscv64 work:** high. The precedent (single maintainer-authored PR, same-day merge, no pushback) indicates the project is receptive to riscv64 contributions with essentially no institutional friction - the remaining gaps (test execution, container image, stable-release promotion) are technical rather than political.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Justification:** GreptimeDB's riscv64 CI builds the codebase (both a compile-check via `cargo check` in [rust.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/rust.yml) and a full cross-compiled release binary via `build-linux-riscv64-artifacts` in [release.yml](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/release.yml)), but the test suite is never executed on riscv64 anywhere in the pipeline - the release workflow's own comment states integration tests "are skipped because the cross-compiled binary cannot run on the amd64 host," and no QEMU-based execution or native riscv64 runner is used. Per the color model, a CI posture that builds but does not test riscv64 sets the primary color to yellow regardless of whether an artifact is published. Upstream does publish the riscv64 binary directly via GitHub Releases (verified as a live, downloadable 190.9 MB asset in [v1.3.0-alpha.1](https://github.com/GreptimeTeam/greptimedb/releases/tag/v1.3.0-alpha.1)), so `release_provider` is `upstream`; that artifact is currently pre-release/alpha only and absent from the latest stable tag (v1.2.0), which is a caveat but does not itself change the yellow grade (which is already capped by the missing test execution, not by release-channel maturity).
- **Optimization-purpose modifier:** not applicable. GreptimeDB is a general-purpose time-series database, not a project whose core value proposition depends on hand-tuned architecture-specific kernels (Section 4 confirms zero RISC-V ISA-specific code, and also zero amd64/arm64-specific code, in GreptimeDB's own source - it relies entirely on Rust/LLVM's generic codegen and on its dependencies' own architecture support). No optimization-level cap applies.
- **Pending work that could change the grade:** (1) enabling automated riscv64 test execution - either via QEMU-based test running in CI or a native riscv64 CI runner (no RISE involvement or RISE runner usage was found for GreptimeDB, so this would need to be sourced independently or via a new RISE engagement) - would allow an upgrade from yellow toward blue; (2) publishing a riscv64 build in a stable (non-alpha) release tag would close the release-maturity gap noted above; (3) resolving the distroless riscv64 base-image gap would enable an official riscv64 container image, matching amd64/arm64 parity. No open PR or RISE-funded initiative addressing any of these was found as of the research date.

## 14. Investment Analysis

RISE has no recorded involvement with GreptimeDB whatsoever (Section 1) - no RISE blog post, no RISE membership, no RISE runner usage, and GreptimeDB does not appear in the RISE Python wheel builder's 76-package list or in the `riseproject-dev` GitHub organization's 49 repos. Every item below is therefore unfunded, unscoped work with no existing RISE investment to net out.

### 14.1 Functional Enablement

The functional baseline (compiles, produces a working binary, boots and serves SQL under QEMU) is already done, delivered entirely by a single Greptime engineer in PR #8820. Remaining functional gaps: (a) a riscv64 container image (blocked on a distroless riscv64 base or an alternative minimal base image), and (b) promotion of riscv64 artifacts into a stable release tag rather than alpha-only.

### 14.2 Performance Optimization

No riscv64 performance work exists or has been attempted. This is not an optimization-purpose gap for GreptimeDB itself (Section 4), but several critical dependencies (zstd, lz4, brotli) have open, stalled RVV optimization PRs in their own upstreams that would benefit GreptimeDB's storage/compression hot path if merged - none of this is GreptimeDB-specific work, and none of it is currently funded by RISE or anyone else per the research.

### 14.3 CI/CD Infrastructure

The highest-leverage gap: add automated test execution for riscv64, either via QEMU-based emulated test running (the setup-qemu-action already in the repo would need to be extended to riscv64, currently scoped only to amd64/arm64) or a native riscv64 CI runner. This is the single change that would move the color from yellow toward blue.

### 14.4 Ecosystem Enablement

Not applicable in the Section 10 sense - GreptimeDB is a standalone database binary with no dependent package ecosystem (no PyPI, npm, or Maven package that other projects import). Section 10 is therefore omitted from this report per the scoping rule.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU-based (or native-runner) riscv64 test execution to `check-riscv64` and/or a new dedicated job | 2-4 | GreptimeDB maintainers or a sponsoring third party | High |
| Functional | Resolve distroless riscv64 base-image gap; ship an official riscv64 container image | 1-3 (dependent on distroless/alternative base availability, outside GreptimeDB's control) | GreptimeDB maintainers | Medium |
| Functional | Promote riscv64 artifacts from alpha-only to the stable release channel | <1 (process change once the above two items land) | GreptimeDB release engineering | Medium |
| Distribution | Package GreptimeDB for at least one major distro (Ubuntu/Debian) including riscv64 | 2-4 | Distro packagers / third party | Low |
| Performance | Benchmark GreptimeDB on riscv64 hardware and publish results | 1-2 | GreptimeDB or a sponsoring third party | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [GreptimeTeam/greptimedb repository](https://github.com/GreptimeTeam/greptimedb)
- [greptime.com homepage](https://greptime.com/)
- [PR #8820, "feat: add riscv64 cross-build support"](https://github.com/GreptimeTeam/greptimedb/pull/8820)
- [PR #9011 (unrelated, false-positive search hit)](https://github.com/GreptimeTeam/greptimedb/pull/9011)
- [rust.yml workflow (check-riscv64 job)](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/rust.yml)
- [release.yml workflow (build-linux-riscv64-artifacts job)](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/release.yml)
- [release-dev-builder-images.yaml workflow](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/workflows/release-dev-builder-images.yaml)
- [docker/dev-builder/riscv64/Dockerfile](https://github.com/GreptimeTeam/greptimedb/blob/main/docker/dev-builder/riscv64/Dockerfile)
- [Release v1.3.0-alpha.1](https://github.com/GreptimeTeam/greptimedb/releases/tag/v1.3.0-alpha.1)
- [v1.3.0-alpha.1 release notes (docs.greptime.com)](https://docs.greptime.com/release-notes/release-1-3-0-alpha-1/)
- [Greptime August 2026 monthly report](https://www.greptime.com/blogs/2026-08-31-greptimedb-monthly-report)
- [AUTHOR.md](https://github.com/GreptimeTeam/greptimedb/blob/main/AUTHOR.md)
- [CONTRIBUTING.md](https://github.com/GreptimeTeam/greptimedb/blob/main/CONTRIBUTING.md)
- [.github/CODEOWNERS](https://github.com/GreptimeTeam/greptimedb/blob/main/.github/CODEOWNERS)
- [PyPI package lookup for "greptimedb" (404, does not exist)](https://pypi.org/pypi/greptimedb/json)
- [Ubuntu package search for "greptimedb" (resolute, no results)](https://packages.ubuntu.com/search?keywords=greptimedb&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package tracker (no greptimedb entry)](https://archriscv.felixc.at/?q=greptimedb)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [jemalloc/jemalloc issue #2399 (cross-compile docs)](https://github.com/jemalloc/jemalloc/issues/2399)
- [briansmith/ring repository](https://github.com/briansmith/ring)
- [simd-lite/simd-json issue #303 (riscv64 support, closed)](https://github.com/simd-lite/simd-json/issues/303)