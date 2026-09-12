---
title: Javy
parent: Project Reports
color: orange
dependencies:
  - name: QuickJS
    relation: runtime-dependency
    criticality: critical
  - name: Wizer
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: Wasmtime
    relation: test-dependency
    criticality: critical
  - name: Rollup
    relation: build-dependency
    criticality: optional
  - name: cargo-fuzz
    relation: test-dependency
    criticality: optional
---

# Javy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Javy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="javy" %}

## 1. Project Overview

Javy is a Bytecode Alliance project that compiles JavaScript to WebAssembly. It consists of a native Rust CLI host (`javy-cli`) that drives a QuickJS-based JavaScript engine (via the `rquickjs` binding to QuickJS-ng) compiled to a portable `wasm32-wasip1`/`wasm32-wasip2` plugin module, pre-initialized with [Wizer](https://github.com/bytecodealliance/wizer) and executed during the build using [Wasmtime](https://github.com/bytecodealliance/wasmtime). The output `.wasm` module is architecture-independent, but the `javy` CLI tool itself is a native binary shipped per host architecture.

**Governance.** Javy is governed at the [Bytecode Alliance](https://bytecodealliance.org/) organization level (README: "A Bytecode Alliance project"). No per-project MAINTAINERS/OWNERS/CODEOWNERS file exists; governance follows the BA's two-tier Board of Directors / Technical Steering Committee (TSC) structure, with commit access earned through contribution rather than a formal per-repo tier system. License: Apache-2.0.

**Corporate sponsors.** Bytecode Alliance corporate members include Microsoft, Mozilla, Fastly, Shopify, NGINX, DFINITY, Stellar Development Foundation, Cosmonic, Fermyon, StackBlitz, Anaconda, Igalia, Midokura, and others (~24 orgs total, per [bytecodealliance.org](https://bytecodealliance.org/)). In practice Javy is Shopify-led: of the top 5 committers by volume across the full 1297-commit history, 4 are Shopify employees (Jeffrey Charles 461 commits, Maxime Bedard 107, Surma 90, Jackson Hong 33), with Saul Cabrera (264 commits, Bytecode Alliance) and Joel Dice (11 commits, Fermyon) rounding out the list.

**Community culture on new ports.** [CONTRIBUTING.md](https://github.com/bytecodealliance/javy/blob/main/CONTRIBUTING.md) is restrictive on JS API surface (new APIs accepted only if "potentially useful across multiple environments and do not invoke non-WASI hostcalls"), but there is no documented policy, discussion, issue, or PR regarding new CPU-architecture ports of any kind. The topic of RISC-V or any additional architecture target has never been raised in the project's issue tracker, PR history, or commit log.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has been initiated | [GitHub issue search](https://github.com/bytecodealliance/javy/issues) (0 results for riscv/riscv64/RISC-V/riscv32), [PR search](https://github.com/bytecodealliance/javy/pulls) (7 superficial matches, all confirmed dependency-bump PRs, none touching RISC-V support), [commit search](https://github.com/bytecodealliance/javy) (0 results) |

No milestone table entries exist because no RISC-V work has ever been started, proposed, or discussed in this repository. This was verified through exhaustive GitHub issue, PR, and commit search using four query variants ("riscv", "riscv64", "RISC-V", "riscv32"), each returning zero genuine hits. The only PRs that superficially match contain the substring "riscv" solely inside quoted upstream changelog text of unrelated transitive dependencies (`serde_json`, `rollup`, `cc-rs`, `bindgen`) reproduced verbatim in Dependabot/Renovate PR bodies - for example [PR #1105](https://github.com/bytecodealliance/javy/pull/1105) ("Bump the nonbreaking group with 6 updates") quotes a `serde_json` v1.0.146 changelog line "Set fast_arithmetic=64 for riscv64", and [PR #509](https://github.com/bytecodealliance/javy/pull/509) ("Bump cc from 1.0.73 to 1.0.83") quotes a `cc-rs` changelog entry about NetBSD/riscv64 ABI fixes. None of these seven PRs (#1105, #1110, #1113, #541, #623, #530, #928) concern RISC-V support in Javy itself; three were merged into unrelated releases (v8.1.0, v1.3.0/v2.0.0, v5.0.4) purely as routine dependency version bumps.

**Fully upstream?** Not applicable - there is no port to be upstream or out-of-tree. RISC-V support for Javy does not exist in any form, anywhere.

## 3. Upstream Support Tier

No formal per-project maturity tier (Tier 1/2/3, core/incubating) documentation exists for individual Bytecode Alliance projects; a check of [bytecodealliance/rfcs](https://github.com/bytecodealliance/rfcs) confirms it covers only the RFC process, not project tiering. Javy is also not a member project of the RISE Project (riseproject.dev) - it appears only as an unassessed entry in RISE's internal `sw-ecosystem` project-report backlog queue, with no dedicated repo, blog coverage, or funded work [NEEDS VERIFICATION for absence of any private/unpublished RISE engagement].

Evidence for tier: the CI/release matrix in [`.github/workflows/build-assets.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/build-assets.yml) is the de facto tier signal - it defines exactly which architectures are release-blocking and officially published.

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI build | Yes (`x86_64-unknown-linux-gnu`, plus Windows MSVC) | Yes (`aarch64-unknown-linux-gnu` cross-compiled, plus macOS/Windows arm64) | No |
| CI test execution | Yes (`ci.yml`, native_ci job) | No dedicated riscv64/arm64 test job found beyond native_ci on the build host | No |
| Official release binary | Yes (`javy-x86_64-linux`, `javy-x86_64-macos`) | Yes (`javy-arm-linux`, `javy-arm-macos`, plus Windows arm64) | No |
| npm optional-platform package | Yes | Yes | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Javy contains **zero architecture-specific implementation files for any architecture**, including amd64 and arm64. A direct grep of the local clone (`grep -rn target_arch --include="*.rs" .`) returns zero matches across every crate (`cli`, `codegen`, `javy`, `plugin`, `plugin-api`, `plugin-processing`, `profiler`, `profiler-lib`, `runner`). There is no vendored C/C++ source (`find . -name "*.c" -o -name "*.h"` returns zero files) and no `#[cfg(target_arch = ...)]` gate anywhere in the tree. This is architecturally expected: Javy is a Rust CLI/plugin host, not a codec or crypto library - all machine-code generation (JIT/Cranelift) is delegated entirely to the external `wasmtime`/`cranelift-codegen` crates, outside this repository's tree.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned/intrinsics source files in Javy's own tree | 0 | 0 | 0 |
| JIT/codegen backend | External (Wasmtime/Cranelift) | External (Wasmtime/Cranelift) | External (Wasmtime/Cranelift; Wasmtime itself is riscv64 Tier 3) |
| SIMD (optional `json` feature via `simd-json` dependency) | AVX2/SSE4.2 dispatch | NEON dispatch | No riscv64 SIMD dispatch path; silently falls back to scalar/portable implementation |
| Assembly / ISA-specific code | None | None | None |

The only place any architecture is named at all in the repository is CI/build/packaging plumbing (the `build-assets.yml` matrix, and `npm/javy/pnpm-lock.yaml` optional-platform entries) - riscv64 is absent from every one of those, not merely under-optimized. There is no stub, `TODO`, or placeholder code referencing riscv64 anywhere in the repository.

**This is not classified as an optimization-purpose project** under the Step 2 test of the color-coding model: Javy's value (JS-to-WebAssembly compilation via QuickJS) does not depend on architecture-specific hot-path code - it would deliver the same JS-to-Wasm functionality on riscv64 using generic Rust and the external Wasmtime/Cranelift backend, exactly as it does today on amd64 and arm64 (which also have zero hand-tuned files in Javy's own tree). The optional `simd-json` dependency's scalar fallback on riscv64 is a downstream-dependency performance gap, not a gap in Javy's own value proposition.

## 5. Build System, Cross-Compilation, and Toolchain

Javy is a pure Rust/Cargo project - there is no CMakeLists.txt, no `cmake/` toolchain files, and no Dockerfile of any kind in the repository.

**Build requirements** (from [`docs/docs-contributing-building.md`](https://github.com/bytecodealliance/javy/blob/main/docs/docs-contributing-building.md)): `sudo apt-get install curl pkg-config libssl-dev clang` (Ubuntu), rustup with the `stable` channel (`rust-toolchain.toml` pins `channel = "stable"`), plus the `wasm32-unknown-unknown`, `wasm32-wasip1`, and `wasm32-wasip2` Rust targets. `riscv64gc-unknown-linux-gnu` is not present in `rust-toolchain.toml`'s target list.

**Build commands:**
```
cargo build -p javy-plugin --target=wasm32-wasip1 -r
cargo build -p javy-cli -r
```

**QEMU usage:** None found anywhere in the repository (grepped case-insensitively for `qemu`, `cross-rs`, `Cross.toml`, `riscv64gc` - zero hits).

**Known build failures on riscv64:** None documented, because riscv64 has never been attempted or requested in the tracker. Producing a riscv64 `javy` binary today would require adding a new Rust target (e.g. `riscv64gc-unknown-linux-gnu`) to the `build-assets.yml` matrix and running `cargo build --release --target riscv64gc-unknown-linux-gnu -p javy-cli` (the `wasm32-wasip1`/`wasip2` plugin build is target-independent since it produces portable Wasm) - none of this exists upstream as of the inspected HEAD commit (`ba8c45f`).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native `javy` CLI binary | Yes | Yes | No |
| Plugin (`plugin.wasm`) execution | Yes (host-independent Wasm) | Yes (host-independent Wasm) | Yes in principle - the module itself is architecture-neutral, but no CLI build exists to run it from |
| npm package platform support | Yes | Yes | No |
| Optional `json` feature SIMD acceleration (`simd-json`) | AVX2/SSE4.2 | NEON | Scalar fallback only - functional but not accelerated |

**Functional gaps:** A user cannot obtain a working `javy` CLI binary for riscv64 through any official channel today (see Section 8). There is no functional breakage of the underlying JS-to-Wasm compilation logic itself - the gap is entirely one of missing build/release infrastructure, not of code that fails to run.

**Performance gaps:** If a user builds Javy from source on riscv64, the optional `json` feature (off by default) would silently lose the SIMD speedup it is designed to provide, falling back to `simd-json`'s scalar path, since `simd-json`'s dispatch table covers x86 (AVX2/SSE4.2), aarch64 (NEON), and wasm (simd128) only.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening (CFI, stack protector variants, etc.) discussion was found for Javy, consistent with the complete absence of riscv64 build/CI infrastructure to evaluate this against.

**NaN / floating-point semantics issues:** No Javy-specific NaN-boxing or floating-point semantics issue was found. Adjacent context: [Mozilla Bugzilla #1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867) documents a SpiderMonkey (Firefox) Wasm baseline-compiler riscv64 NaN-boxing bug, and [bytecodealliance/wasmtime#5523](https://github.com/bytecodealliance/wasmtime/issues/5523) (closed) documented a Cranelift `rotl.i16`/`i128` riscv64 codegen bug - both illustrate that riscv64 float/bit-manipulation correctness issues are a known bug class in Wasm engines generally, but no equivalent report exists against Wasmtime's current riscv64 backend or against Javy specifically.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** All five GitHub Actions workflow files in `bytecodealliance/javy` were read directly at commit `ba8c45f` (2026-09-02): [`ci.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/ci.yml), [`build-assets.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/build-assets.yml), [`ci-npm-javy.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/ci-npm-javy.yml), [`publish-npm.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/publish-npm.yml), [`check-fuzz.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/check-fuzz.yml). A case-insensitive grep for `riscv|RISC` across the entire `.github/workflows/` directory returns zero matches in any file. No GitLab CI, Jenkinsfile, or Cirrus config exists in the repo.

No RISE runner reference (`riseproject-dev`, RISE runner labels) appears in any workflow file. No riscv64 hardware, QEMU emulation, or cross-compile step exists anywhere in CI.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (`ci.yml` native_ci + wasi_ci on ubuntu-latest; `build-assets.yml` x86_64-unknown-linux-gnu, plus Windows MSVC) | Yes (`build-assets.yml`: aarch64-unknown-linux-gnu cross-compiled with gcc-aarch64-linux-gnu, plus macOS/Windows arm64) | No |
| CI test execution | Yes (`ci.yml`, WPT tests) | Not separately gated beyond the build-host's native_ci | No |
| Release-blocking | Yes (release-triggered `build-assets.yml`) | Yes | N/A - no job exists |
| RISE runners in use | No | No | No |

## 8. Distribution and Release Status

**No official riscv64 binary exists in any channel checked.**

- **GitHub Releases:** Direct asset-download URL probing across the five most recent releases (v8.0.0, v8.1.0, v8.1.1, v9.0.0, [v9.1.0](https://github.com/bytecodealliance/javy/releases/tag/v9.1.0)) shows the known-real assets (`javy-x86_64-linux-vX.Y.Z.gz`, `javy-arm-linux-vX.Y.Z.gz`) return HTTP 200 in every case, while identically-patterned riscv64 asset names (`javy-riscv64-linux-vX.Y.Z.gz`, `javy-riscv64gc-linux-vX.Y.Z.gz`) return HTTP 404 in every case. v9.1.0's confirmed asset list is `javy-arm-linux`, `javy-arm-macos`, `javy-arm-windows`, `javy-x86_64-linux`, `javy-x86_64-macos` - no riscv/riscv64 entry.
- **PyPI:** [`https://pypi.org/pypi/javy/json`](https://pypi.org/pypi/javy/json) returns HTTP 404 - no `javy` PyPI package exists at all (expected: Javy is not a Python project).
- **RISE Python wheel builder:** Falls through to upstream PyPI (HTTP 302 redirect), which is empty - no wheel present.
- **Ubuntu 26.04 (resolute):** [`packages.ubuntu.com` search](https://packages.ubuntu.com/search?keywords=javy&suite=resolute&searchon=names&section=all) returns "no result" - no `javy` package for any architecture.
- **Arch Linux RISC-V** (archriscv.felixc.at): Inconclusive - no queryable package index was reachable to confirm or refute presence [NEEDS VERIFICATION].
- **npm:** The `npm/javy` package's `pnpm-lock.yaml` lists riscv64 only as optional-platform entries for third-party build tooling (`@rollup/rollup-linux-riscv64-gnu`, `@rollup/rollup-linux-riscv64-musl`, `@typescript/typescript-linux-riscv64`) - Javy itself has no riscv64 npm optional-platform package.
- **Project graph database (Ubuntu 26.04 SPARQL query):** Could not be executed - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout the research session. This is a tooling failure, not a confirmed negative, and should be re-run once the server is reachable.

**What a user must do today to get a working riscv64 `javy` binary:** Build from source. Clone the repository, install a `riscv64gc-unknown-linux-gnu` Rust target via rustup, and manually run `cargo build --release --target riscv64gc-unknown-linux-gnu -p javy-cli` plus the target-independent `wasm32-wasip1` plugin build - this path is untested upstream and carries no CI or release verification of any kind.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| QuickJS | Build-dependency, critical - the JS execution engine (bytecode interpreter, no native JIT), consumed via rquickjs binding, compiled to `wasm32-wasip1`/`wasip2` | Host-arch-independent (compiles to Wasm regardless of build host); underlying QuickJS-ng C codebase separately ships prebuilt `qjs-linux-riscv64`/`qjsc-linux-riscv64` GitHub release binaries, and Ubuntu 26.04 packages `quickjs`/`libquickjs` for riscv64 | No dedicated riscv64 CI found for `DelSkayn/rquickjs` itself; QuickJS-ng's own riscv64 test coverage [NEEDS VERIFICATION] | QuickJS-ng upstream ships riscv64 binaries; `rquickjs`/`rquickjs-sys` crates are source-only on crates.io | No blocking issues found |
| Wizer | Build-dependency, critical - pre-initializes/snapshots the compiled QuickJS plugin for fast startup | Pure Rust orchestration over Wasmtime, no architecture-specific code; riscv64 viability is fully inherited from Wasmtime's host-riscv64 support | No riscv64-specific CI job found in `bytecodealliance/wizer` | No GitHub Release riscv64 binary confirmed; crates.io publish is source-only | No riscv64-specific issues found; no separate project-reports entry exists |
| Rust | Build-dependency, critical - toolchain for the CLI and codegen crates | riscv64gc-unknown-linux-gnu is a supported Rust target (general Rust toolchain maturity); not in Javy's own `rust-toolchain.toml` target list | N/A (toolchain, not a tested artifact within Javy's own CI) | Rust project ships riscv64gc host/target toolchains | General Rust riscv64 support is mature; Javy simply does not build against it in CI |
| Wasmtime | Test-dependency, critical - JIT/AOT engine (Cranelift) that runs Wizer's pre-init pass and instantiates the plugin during the CLI build | Builds from source on riscv64; Tier 3 support with a full Cranelift riscv64 backend (~22K LOC) | Upstream CI tests riscv64 under QEMU, conditionally gated (merge-queue/release branches only) | Upstream ships `wasmtime-v48.0.1-riscv64gc-linux.tar.xz`; rated **green** in a separate assessment (project-reports/wasmtime.md) | Open correctness bugs potentially relevant to code Javy's plugin could hit: bus error/unaligned atomics, partial OOB write on trap, ABI panics, ISLE crashes - see Section 11 |
| Rollup | Build-dependency, optional - JS bundler used by the npm CLI wrapper package | Rollup itself ships `@rollup/rollup-linux-riscv64-gnu` / `-musl` native optional-platform builds (confirmed in `npm/javy/pnpm-lock.yaml`, Rollup v4.37.0 changelog: "Support Musl Linux on Riscv64 architectures") | Data not available: no Rollup-specific riscv64 CI/test evidence gathered in this research pass | Rollup upstream ships riscv64 npm optional packages | Rollup's own riscv64 support appears more mature than Javy's; not a blocker for Javy's own riscv64 readiness since it's an optional/secondary tool |
| cargo-fuzz | Test-dependency, optional - builds fuzz targets on nightly Rust (`check-fuzz.yml`) | Inherits general Rust nightly toolchain riscv64 support; no riscv64-specific gating found | `check-fuzz.yml` runs only on `ubuntu-latest` (x86_64); no riscv64 fuzz execution | N/A | Not a functional blocker for riscv64 CLI builds; simply untested on riscv64 like the rest of CI |
| Binaryen / wasm-opt (via the `wasm-opt` crate, builds from source) | Transitive build-dependency, used by `javy-codegen`/`javy-plugin-processing` | Compiles cleanly from source on riscv64 (one historical GCC `-Werror=uninitialized` issue, fixed 2024-03-19) | No upstream CI riscv64 job/test execution exists at all | No upstream GitHub Release riscv64 binary; Ubuntu 26.04 packages `binaryen` for riscv64 (clean unpatched rebuild) | Rated **yellow** (`clean-distro-build`) in a separate assessment (project-reports/binaryen.md); Javy inherits this status since the Rust crate builds Binaryen from source, not a binary download |
| walrus | Transitive build-dependency - WASM binary transformation/composition library used to assemble the final module | Pure portable Rust, no architecture-conditional code found | No riscv64-specific CI or issues found upstream | crates.io source-only, arch-agnostic | No blocking issues found |
| simd-json | Transitive, optional (`json` feature, off by default) - SIMD-accelerated JSON parsing | Builds fine (pure Rust) but has no riscv64 SIMD dispatch path; falls back to scalar | No riscv64-specific test gaps found beyond the scalar fallback | crates.io source-only | Functional, not a build blocker, but a performance gap if the `json` feature is enabled |
| swc_core | Transitive build-dependency - JS/TS parser and codegen used by `javy-codegen` for module bundling | Pure Rust, no architecture-conditional code found | No riscv64-specific CI/issues found | crates.io source-only | No blocking issues found |

**Weakest links for riscv64 investment, in priority order:** (1) Wasmtime's open correctness bugs, since Javy's CLI directly executes Wasmtime on the host during every build; (2) Binaryen's total absence of upstream riscv64 CI (relying entirely on Ubuntu's unpatched distro rebuild for confidence); (3) `simd-json`'s silent SIMD-to-scalar fallback if Javy's optional `json` feature is ever enabled by default.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issue, PR, or bug exists in bytecodealliance/javy | N/A | N/A | Confirmed via exhaustive GitHub issue search (`riscv`, `riscv64`, `RISC-V`, `riscv32`, all 0 genuine results) and [GitHub's own web search](https://github.com/search?q=repo:bytecodealliance/javy+riscv&type=issues) ("0 results") |
| [bytecodealliance/wasmtime#5523](https://github.com/bytecodealliance/wasmtime/issues/5523) | Cranelift: Wrong result for `rotl.i16` with `i128` shift value on riscv64 | Closed | N/A (resolved) | In Wasmtime's Cranelift codegen (transitive dependency via Wasmtime), not in Javy itself; already fixed |
| Mozilla Bugzilla #1975867 | WasmBCFrame: improper Float32 architectural NaN-boxing when popping from stack on riscv64 | Data not available: status not checked in this research pass | N/A | SpiderMonkey (Firefox) Wasm baseline-compiler bug, unrelated to Wasmtime/Javy; cited only to show riscv64 NaN-boxing bugs are a known class across Wasm engines |

No Javy-specific riscv64 performance benchmarks (throughput, startup latency, binary size) were found published anywhere - GitHub search, web search, and the RISE project blog all returned no relevant results. This is a data gap, not evidence of good or bad performance: it reflects the complete absence of riscv64 CI/testing coverage for Javy rather than a confirmed quality signal in either direction.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer, issue, or PR expresses opposition to a riscv64 port. The topic has simply never been raised.

**Technical blockers:** None identified that are specific to Javy's own code (zero architecture-specific code exists to port). The practical blocker is infrastructure: adding a `riscv64gc-unknown-linux-gnu` entry to the `build-assets.yml` release matrix and a corresponding CI test job. Wasmtime, a critical build/test dependency, carries some open correctness bugs on riscv64 (Section 9) that could surface during Javy's own plugin build/test cycle, though none have been reported against Javy specifically.

**Organizational blockers:** No RISE Project engagement exists (Javy sits unassessed in RISE's internal `sw-ecosystem` project-report queue with no funded work, blog coverage, or dedicated repo). No Bytecode Alliance member company has been identified as sponsoring riscv64 work on Javy specifically.

**Acceptance probability:** Given the complete absence of objections or technical obstacles specific to Javy, and given that CONTRIBUTING.md's restrictions target JS API scope rather than architecture, a well-formed PR adding a riscv64 target to the CI/release matrix would likely be uncontroversial to merge - but no such PR has ever been opened, and no one has committed to doing this work as of the search date (2026-09-10).

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no upstream riscv64 release, and no distribution floor applies because no Linux distribution - Ubuntu 26.04, PyPI, or confirmed Arch RISC-V - ships a `javy` package at all)
- **Release provider:** none
- **Optimization gap:** N/A - Javy is not classified as an optimization-purpose project; its value (JS-to-Wasm compilation) does not depend on architecture-specific hot-path code, and it has zero hand-tuned implementation files for any architecture, including amd64 and arm64.
- **Justification:** All five GitHub Actions workflow files in `bytecodealliance/javy` were read directly and contain zero riscv64 references, job, matrix entry, or cross-compile target ([`build-assets.yml`](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/build-assets.yml) release matrix covers only x86_64/aarch64 across Linux, macOS, Windows). No riscv64 release asset exists, confirmed by direct HTTP probing of GitHub release asset URLs across five releases (200 for x86_64/arm, 404 for equivalent riscv64 names). No Linux distribution or package registry (Ubuntu 26.04, PyPI, RISE wheel builder) ships a `javy` package for riscv64 or any other architecture, so the distribution floor that would otherwise raise a no-CI project to yellow does not apply here - the project settles at the base orange row of the color model (no upstream CI, no test, no release).
- **Pending work that could change the grade:** None identified. There is no open PR, no RISE-funded initiative, and no tracked issue proposing riscv64 support for Javy. The only trace of RISE awareness is a single unassessed line-item in RISE's internal `sw-ecosystem` project-report backlog (`project-reports/.queue.yml`), which represents a candidate for future evaluation, not work in progress.

## 14. Investment Analysis

RISE has done no work on Javy specifically - confirmed by the absence of any RISE blog post, dedicated riseproject-dev repository, RISE runner usage, or funded work item; Javy exists only as an unassessed queue entry. All of the work items below are therefore un-covered and available for scoping.

### 14.1 Functional Enablement

Add a `riscv64gc-unknown-linux-gnu` build target to `build-assets.yml`'s `compile_cli` matrix, following the same pattern already used for the `aarch64-unknown-linux-gnu` cross-compilation entry (GCC cross-toolchain). Validate that the full dependency chain (Wasmtime, Wizer, rquickjs/QuickJS-ng, walrus, wasm-opt/Binaryen, swc_core) builds cleanly on riscv64 - most dependencies are pure Rust or already confirmed to build from source on riscv64 (Section 9), so this is expected to be low-risk but unverified until attempted.

### 14.2 Performance Optimization

Not applicable as a primary investment area - Javy is not an optimization-purpose project (Section 4). The one secondary performance item is `simd-json`'s scalar fallback on riscv64 if Javy's optional `json` feature is ever enabled by default; this is an upstream `simd-json` gap, not something fixable within Javy itself.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `ci.yml` that runs the full test suite (not just a build step) on riscv64, ideally using a RISE-provided riscv64 CI runner if one is available for Bytecode Alliance projects [NEEDS VERIFICATION: whether RISE runners are available to bytecodealliance/javy today]. Extend `build-assets.yml`'s release matrix to publish an official `javy-riscv64-linux` release asset once the build target above is validated.

### 14.4 Ecosystem Enablement

Add a riscv64 optional-platform entry to the `npm/javy` package (mirroring how Rollup already ships `@rollup/rollup-linux-riscv64-gnu`/`-musl`), so npm consumers on riscv64 hosts can install a working native binary rather than falling back to a missing platform package.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64gc-unknown-linux-gnu target to build-assets.yml compile_cli matrix; validate full dependency chain builds | 1-2 | Upstream (Bytecode Alliance) or third-party contributor | High |
| CI/CD | Add riscv64 test-execution job to ci.yml (not build-only) | 1-2 | Upstream (Bytecode Alliance) | High |
| CI/CD | Publish official riscv64 release asset via build-assets.yml | 0.5-1 | Upstream (Bytecode Alliance) | Medium |
| Ecosystem | Add riscv64 npm optional-platform package for javy CLI | 0.5-1 | Upstream (Bytecode Alliance) | Medium |
| Dependency | Track and, if needed, contribute fixes for Wasmtime's open riscv64 correctness bugs that could surface in Javy's build/test cycle | 1-2 (monitoring + fix-on-demand) | Wasmtime upstream, with Javy as a consumer/reporter | Medium |
| Distribution | Package `javy` for Ubuntu/Debian riscv64 once an upstream riscv64 build target exists | 1 | Distro maintainers or third-party | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [bytecodealliance/javy repository](https://github.com/bytecodealliance/javy)
- [Javy v9.1.0 release](https://github.com/bytecodealliance/javy/releases/tag/v9.1.0)
- [build-assets.yml workflow](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/build-assets.yml)
- [ci.yml workflow](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/ci.yml)
- [ci-npm-javy.yml workflow](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/ci-npm-javy.yml)
- [publish-npm.yml workflow](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/publish-npm.yml)
- [check-fuzz.yml workflow](https://github.com/bytecodealliance/javy/blob/main/.github/workflows/check-fuzz.yml)
- [docs/docs-contributing-building.md](https://github.com/bytecodealliance/javy/blob/main/docs/docs-contributing-building.md)
- [CONTRIBUTING.md](https://github.com/bytecodealliance/javy/blob/main/CONTRIBUTING.md)
- [Bytecode Alliance homepage](https://bytecodealliance.org/)
- [bytecodealliance/rfcs](https://github.com/bytecodealliance/rfcs)
- [PR #1105 - Bump the nonbreaking group with 6 updates](https://github.com/bytecodealliance/javy/pull/1105)
- [PR #1110 - Bump the nonbreaking group across 1 directory with 8 updates](https://github.com/bytecodealliance/javy/pull/1110)
- [PR #1113 - Bump the nonbreaking group across 1 directory with 9 updates](https://github.com/bytecodealliance/javy/pull/1113)
- [PR #928 - Bump the nonbreaking group across 1 directory with 3 updates](https://github.com/bytecodealliance/javy/pull/928)
- [PR #924 - Bump the nonbreaking group in /npm/javy with 3 updates](https://github.com/bytecodealliance/javy/pull/924)
- [PR #509 - Bump cc from 1.0.73 to 1.0.83](https://github.com/bytecodealliance/javy/pull/509)
- [PR #541 - Bump the nonbreaking group with 23 updates](https://github.com/bytecodealliance/javy/pull/541)
- [PR #623 - Bump the nonbreaking group with 13 updates](https://github.com/bytecodealliance/javy/pull/623)
- [PR #530 - Bump tokio-macros from 1.7.0 to 2.1.0](https://github.com/bytecodealliance/javy/pull/530)
- [GitHub search: repo:bytecodealliance/javy riscv (issues)](https://github.com/search?q=repo:bytecodealliance/javy+riscv&type=issues)
- [PyPI JSON API for javy (404)](https://pypi.org/pypi/javy/json)
- [Ubuntu package search for javy, suite resolute](https://packages.ubuntu.com/search?keywords=javy&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)
- [bytecodealliance/wasmtime issue #5523 - Cranelift rotl.i16 riscv64 bug (closed)](https://github.com/bytecodealliance/wasmtime/issues/5523)
- [Mozilla Bugzilla #1975867 - WasmBCFrame Float32 NaN-boxing riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [riseproject-dev/sw-ecosystem project-report queue](https://github.com/riseproject-dev/sw-ecosystem)
- [Wasmtime GitHub Releases (riscv64gc-linux asset)](https://github.com/bytecodealliance/wasmtime/releases)
- [Wizer repository](https://github.com/bytecodealliance/wizer)
- [rquickjs repository](https://github.com/DelSkayn/rquickjs)
- [rust-brotli repository](https://github.com/dropbox/rust-brotli)
- [simd-json repository](https://github.com/simd-lite/simd-json)
- [swc repository](https://github.com/swc-project/swc)
- [walrus repository](https://github.com/rustwasm/walrus)
- [wasm-tools repository (wasmparser/wit-parser)](https://github.com/bytecodealliance/wasm-tools)
- [Rollup releases (riscv64 musl support)](https://github.com/rollup/rollup/releases)