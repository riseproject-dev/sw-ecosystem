---
title: CosmWasm
parent: Project Reports
color: orange
dependencies:
  - name: Wasmer
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: cargo
    relation: build-dependency
    criticality: critical
  - name: ark-ff
    relation: runtime-dependency
    criticality: optional
---

# CosmWasm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for CosmWasm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="cosmwasm" %}

## 1. Project Overview

CosmWasm is a Rust smart-contract framework for the Cosmos SDK ecosystem. It is a Cargo workspace of crates (`cosmwasm-std`, `cosmwasm-vm`, `cosmwasm-crypto`, `cosmwasm-schema`, `cosmwasm-check`, etc.) that lets contracts be written in Rust and compiled to `wasm32-unknown-unknown` bytecode; that bytecode is then executed inside a host process (typically `wasmd`/Cosmos SDK chains) via the sibling repository `CosmWasm/wasmvm`, which wraps a Rust VM for Go consumption. Because contracts target WebAssembly, the contract bytecode itself is architecture-agnostic; the architecture-dependent part of the stack is the native execution engine and its host shared library.

**Governance and corporate backing.** CosmWasm has no separate foundation. It was built and solely maintained by Confio (Confio OU 2019-2021, Confio GmbH 2021-2025, Berlin) until June 30, 2025. Confio GmbH is now in liquidation ("does not look for new business or investment" per confio.gmbh, with Simon Warta listed as liquidator). Since July 1, 2025, the [CosmWasm org-profile README](https://github.com/CosmWasm/.github) states the project is maintained by the "CosmWasm Community" - an informal, non-incorporated model. The public GitHub org "People" page lists only two public members: Dariusz Depta (@DariuszDepta, Engos Software-affiliated, 109 commits since the July 2025 handover - by far the dominant contributor since then) and Simon Warta (the former Confio lead). There is no MAINTAINERS/OWNERS/CODEOWNERS file, no disclosed corporate sponsor program, and no platform/architecture support-tier policy (no PLATFORMS.md or SUPPORT.md exists) anywhere in the repository or the separate [maintainers process docs site](https://cosmwasm.github.io/maintainers).

**License:** Apache License 2.0 (NOTICE file: Jehan Tremback 2019, Confio OU 2019-2021, Simon Warta 2019-2020, Confio GmbH 2021-2025).

**Community culture on new ports.** No evidence exists of any new-architecture request, discussion, or precedent within `CosmWasm/cosmwasm` itself. The closest analog found anywhere in the org is [CosmWasm/go-cosmwasm#53 "Add support for ARM"](https://github.com/CosmWasm/go-cosmwasm/issues/53), filed against the predecessor repo to `wasmvm` (not against `cosmwasm`, and not RISC-V), which at least shows the historical pattern for how a new-CPU-architecture ask would be tracked (as a feature request against the native-library repo).

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. No milestone table can be produced because there are no dated events.

| Date | Event | Source |
|---|---|---|
| - | No riscv/riscv64/"risc-v" issue, pull request, or commit exists in `CosmWasm/cosmwasm` at any date | Confirmed via `mcp__github__search_issues`, `mcp__github__search_pull_requests`, `mcp__github__search_commits` (all queries scoped to `repo:CosmWasm/cosmwasm` and `org:CosmWasm`, all returned 0 results); full local-clone grep (`git log --all -i --grep="riscv"` and `git log --all -i -S"riscv"` across 7,787 commits) also returned 0 hits |

There are no key contributors to a RISC-V port to name, because no such work has been attempted. The project is consequently **not upstream at all** with respect to RISC-V - there is nothing to be "fully" or "partially" upstream.

## 3. Upstream Support Tier

No formal architecture-support tier policy exists. The closest analog is the [maintainers docs site's "Versions" page](https://cosmwasm.github.io/maintainers), which is a release-version compatibility matrix (wasmd/wasmvm/std/SDK/IBC/wasmer/Rust-version pairings), not a CPU-architecture tier system.

CI evidence (see Section 7 for full detail): both CI workflows in `CosmWasm/cosmwasm` (`.github/workflows/contracts.yml` and `.github/workflows/packages.yml`) run exclusively on `ubuntu-latest`, `macos-latest`, `windows-latest` (all x86_64 GitHub-hosted runners). Build targets referenced anywhere in either file are `wasm32-unknown-unknown` and `thumbv7em-none-eabi` only.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | yes (native runner) | partial - a caching-only job ("Add arm64 job to CI", PR #1532 "arm-caching-ci") was added at some point for build caching; not a full test-matrix leg [NEEDS VERIFICATION - PR content not independently re-read] | no |
| Upstream CI runs tests | yes | not established from available evidence | no |
| Official release artifacts | none (see Section 8 - releases are source-archive only for every architecture) | none | none |
| Release-blocking gate | N/A - no compiled release artifacts of any architecture are published | N/A | N/A |

## 4. Technical Architecture and RISC-V-Specific Subsystems

`CosmWasm/cosmwasm` itself contains **no CPU-architecture-specific code of any kind**. A live `target_arch` code search against the repository returned 17 hits, every one of which is `#[cfg(target_arch = "wasm32")]` / `#[cfg(not(target_arch = "wasm32"))]` - i.e., the only architecture distinction the codebase ever makes is guest (wasm32 contract sandbox) vs. host/native (not-wasm32, for tooling and tests). There is no `#[cfg(target_arch = "x86_64")]`, `"aarch64"`, or `"riscv64"` branch, no SIMD/intrinsics module, and no scalar-fallback module anywhere in the repo. This is architecturally expected: `cosmwasm-std`/`cosmwasm-vm`/`cosmwasm-crypto` are pure-Rust contract-and-host-tooling crates; the JIT execution engine is delegated entirely to the external **Wasmer** dependency (see Section 9).

The one place native, per-architecture compiled output is actually produced is the sibling repository `CosmWasm/wasmvm`, which builds `libwasmvm.<arch>.so` (filename generated dynamically from the active `rustc` target triple - a generic build rule, not per-arch source) and ships a hardcoded `libwasmvm_muslc.x86_64.a` static library for musl/Alpine targets with no riscv64 equivalent. A live code search (`riscv repo:CosmWasm/wasmvm`) returned 0 hits, confirming no riscv work exists there either.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Contract-side crates (`cosmwasm-std`, `cosmwasm-vm`, `cosmwasm-crypto`) | N/A - no arch-specific code exists for any architecture; portable Rust compiling to `wasm32-unknown-unknown` | N/A - same | N/A - same |
| Host-side native library (`CosmWasm/wasmvm`, `libwasmvm.<arch>.so`) | partial - generic cross-compile via rustc target triple, plus a hardcoded musl static-lib artifact (`libwasmvm_muslc.x86_64.a`) | partial - same generic cross-compile mechanism, no hardcoded artifact confirmed in research | missing - zero references anywhere (Makefile, source, CI, issues, PRs, releases) |
| Execution engine (external dependency: Wasmer Singlepass backend) | full - Singlepass is wired into Wasmer's default/CI build path | full - same | missing - Wasmer's own `docs/RISCV.md` states "Singlepass can be done, but no resources are allocated on this task for now," and Wasmer's Makefile `ENABLE_SINGLEPASS` gate checks only `IS_AMD64`/`IS_AARCH64` |

There is no RVV/Zba/Zbb/intrinsics question to assess for CosmWasm's own code, since it has no per-architecture hot paths of its own - all execution-speed characteristics are inherited entirely from Wasmer.

## 5. Build System, Cross-Compilation, and Toolchain

`CosmWasm/cosmwasm` is a pure Cargo workspace (`Cargo.toml`/`Cargo.lock`), orchestrated via `Taskfile.yml`. There is no CMakeLists.txt, no `cmake/` directory, and no Dockerfile anywhere in the repository (`find . -iname "Dockerfile*"` returns nothing). Contract builds use `cargo wasm` targeting `wasm32-unknown-unknown`; reproducible production builds go through a separate Docker image (`cosmwasm/optimizer`, maintained in the separate `CosmWasm/rust-optimizer` repository, not checked in this task).

- **Required toolchain:** Rust/Cargo. A Minimum Supported Rust Version (MSRV) is tracked externally on the [GitHub wiki](https://github.com/CosmWasm/cosmwasm/wiki/Minimum-Supported-Rust-Version-(MSRV)) rather than pinned via an in-repo `rust-toolchain` file (none found). No GCC/Clang minimum version requirement exists anywhere in the repo (there is no C/C++ toolchain dependency at the build-system level).
- **QEMU usage:** none found anywhere in the repository.
- **Known build failures on riscv64:** none documented, because riscv64 has never been attempted or discussed (see Section 2). This is untested territory, not a documented failure.
- Since the build system has no cmake/configure flags, GCC/Clang version gates, or Dockerfile content of any kind, there is nothing further to report for exact riscv64 build commands - none exist.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because contracts compile to architecture-agnostic `wasm32-unknown-unknown` bytecode, CosmWasm's own functional surface (contract API, `cosmwasm-std` types, message-passing, IBC hooks, etc.) does not vary by host CPU architecture in principle. The entire feature-availability question on riscv64 collapses to a single external gate: **whether the host process can execute wasm bytecode at all**, which depends on Wasmer's Singlepass backend (see Section 9). Wasmer's own documentation states Singlepass riscv64 has "no resources allocated," so on riscv64 hosts CosmWasm contracts cannot currently execute through the code path CosmWasm actually uses (Singlepass), independent of anything in `cosmwasm-vm` itself.

- **Functional gaps:** contract execution itself is blocked at the dependency layer (Wasmer Singlepass on riscv64), not by anything CosmWasm-specific. No riscv64-specific functional gap exists within `cosmwasm-std`/`cosmwasm-vm` because none of that code is architecture-specific.
- **Performance gaps:** none measurable - no CosmWasm-on-riscv64 execution has been reported anywhere (see Section 11), so there is no performance delta to report, only an inability to execute at all via Singlepass.
- **Security hardening gaps:** not assessed in research; no riscv64-specific security discussion found for CosmWasm.
- **NaN / floating-point semantics:** CosmWasm gates float operations behind an `allow_floats` flag and relies on Wasmer's NaN-canonicalization pass for cross-platform determinism - this is generic, architecture-independent handling already in place for amd64/arm64/riscv64 alike. No RISC-V-specific NaN/float issue was found; this is not evidence of a RISC-V bug, only evidence that the existing determinism mechanism is architecture-agnostic by design.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified directly by reading both CI workflow files in the local clone (HEAD `160f8c533bed8bbc0749e7ff84d19f8ac87553b7`):

- [`.github/workflows/contracts.yml`](https://github.com/CosmWasm/cosmwasm/blob/main/.github/workflows/contracts.yml) - builds/tests example contracts (burner, hackatom, staking, etc.) to `wasm32-unknown-unknown` and runs `cosmwasm-check` on the resulting `.wasm`. Triggers: `workflow_dispatch`, `push` to `main`, `pull_request`. Runners: matrix `[ubuntu-latest, macos-latest, windows-latest]` - all standard x86_64 GitHub-hosted runners. No QEMU, no riscv64 runner.
- [`.github/workflows/packages.yml`](https://github.com/CosmWasm/cosmwasm/blob/main/.github/workflows/packages.yml) - clippy/build/test for all workspace crates (cosmwasm-core, cosmwasm-crypto, cw-schema, cosmwasm-derive, cosmwasm-schema, cosmwasm-std, cosmwasm-vm, cosmwasm-vm-derive, cosmwasm-check). Same trigger set and the same `[ubuntu-latest, macos-latest, windows-latest]` runner matrix. Build targets referenced: `wasm32-unknown-unknown`, `thumbv7em-none-eabi` only.
- No other CI configuration exists in the repository: no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` anywhere.
- A repository-wide, case-insensitive grep for the string `riscv` across every file returned **zero matches** (exit code 1).
- No RISE RISC-V runners are referenced anywhere (no `riseproject-dev` reference, no RISE runner label) - consistent with Section 12's finding that CosmWasm has no RISE involvement at all.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes (native `ubuntu-latest`/`windows-latest` runners) | partial (a caching-only job was added at some point per governance-history evidence; not confirmed to run the full test matrix) [NEEDS VERIFICATION] | no |
| CI runs tests | yes | not established | no |
| CI publishes release artifact | no (releases are source-archive only, see Section 8) | no | no |
| Hardware | GitHub-hosted x86_64 cloud runners | not established | none - no job exists |

## 8. Distribution and Release Status

No official riscv64 binaries exist, but neither do official binaries for **any** architecture - CosmWasm ships as source only.

- **GitHub Releases:** the five most recent releases checked (v3.1.0-rc.1, v3.0.9, v2.3.4, v2.2.9, v3.0.8, via [the releases page](https://github.com/CosmWasm/cosmwasm/releases)) each contain only the two GitHub auto-generated source archives (`.zip`, `.tar.gz`). Zero compiled binary assets of any architecture, confirmed independently in a re-verification pass via `expanded_assets` fetch of the latest release.
- **PyPI:** [`https://pypi.org/pypi/cosmwasm/json`](https://pypi.org/pypi/cosmwasm/json) returns HTTP 404 - no package exists (CosmWasm is not a Python project).
- **RISE Python wheel builder:** the GitLab-hosted PyPI proxy redirects to the same nonexistent PyPI package (404) - N/A, not a Python package.
- **Ubuntu 26.04 (resolute):** [package search](https://packages.ubuntu.com/search?keywords=CosmWasm&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no `cosmwasm` package exists in this or any Ubuntu suite checked.
- **Arch Linux RISC-V port:** [archriscv.felixc.at search](https://archriscv.felixc.at/?q=cosmwasm) lists no `cosmwasm` package.
- **crates.io:** CosmWasm crates are published to crates.io as source (arch-agnostic Rust source distribution) - this is the only real "release channel," and it carries no architecture-specific artifact of any kind, so it is neither a riscv64 blocker nor a riscv64 enabler.

**What a user must do to get a working setup on riscv64 today:** compile the Rust crates from source via Cargo (which is architecture-agnostic and untested-but-plausible for the pure-Rust crates themselves per Section 9), and separately obtain or build a working `libwasmvm` for riscv64 from `CosmWasm/wasmvm` - which has zero riscv64 references anywhere - and a Wasmer build with a functioning Singlepass backend on riscv64, which Wasmer's own documentation says has no allocated engineering resources. No path to a working riscv64 CosmWasm deployment currently exists without first-party work upstream in Wasmer.

**Data-source caveat:** the `project-graph` MCP server was unreachable this session (`CONNECTION_CLOSED`) for every attempt, so Ubuntu-suite SPARQL cross-checks could not be run as an independent confirmation of the web-scraped Ubuntu/PyPI results above. This is a tool/connectivity failure, not evidence either way, and should be re-run once the server is reachable.

## 9. Dependencies

Source manifests read: the workspace `Cargo.toml`, `packages/vm/Cargo.toml`, `packages/crypto/Cargo.toml` (local clone, HEAD `160f8c533bed8bbc0749e7ff84d19f8ac87553b7`).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **Wasmer** | Runtime dependency, critical - JIT execution engine (`packages/vm` pins `=5.0.6`, features=`["singlepass"]`; Singlepass is the *only* compiler backend CosmWasm compiles in) | Wasmer overall: yes, via Cranelift/LLVM (upstream CI). **Singlepass specifically: source exists but is not wired into Wasmer's Makefile riscv64 build path** (`ENABLE_SINGLEPASS` checks only `IS_AMD64`/`IS_AARCH64`); Wasmer's `docs/RISCV.md` states "Singlepass can be done, but no resources are allocated on this task for now." | Cranelift riscv64 tests run in Wasmer's CI but with open crash reports; Singlepass riscv64 has no CI coverage at all. | Wasmer ships `wasmer-linux-riscv64.tar.gz` release binaries (Cranelift-based) - not the backend CosmWasm uses. | This is the single most important blocker. Wasmer-in-general is graded green elsewhere (Cranelift/LLVM), but that grade does not transfer to CosmWasm since CosmWasm never uses Cranelift or LLVM. One Wasmer PR (#6053) ambiguously may have dropped rather than enabled a riscv64 Singlepass feature gate - unresolved. |
| **Rust** | Build dependency, critical - compiler/language toolchain for all CosmWasm crates | Rust (`rustc`/`cargo`) has upstream riscv64 tier support generally [context from research, not independently re-verified for this report - NEEDS VERIFICATION against Rust's own platform-support tables] | not independently verified in this research | not independently verified | No CosmWasm-specific MSRV-on-riscv64 issue found; MSRV is tracked externally on the [GitHub wiki](https://github.com/CosmWasm/cosmwasm/wiki/Minimum-Supported-Rust-Version-(MSRV)), not pinned in-repo. |
| **cargo** | Build dependency, critical - build orchestration for the Cargo workspace | Ships with Rust; see Rust row | see Rust row | see Rust row | No CosmWasm-specific issue found. |
| **ark-ff** (via `cosmwasm-crypto`'s `ark-bls12-381`/`ark-ec` at `0.5.0`, features on ark-ff = `["asm","parallel"]`) | Build dependency, optional - BLS12-381 pairing crypto for contract crypto host functions | Builds - the `"asm"` feature's fast bigint paths are `cfg(target_arch = "x86_64")`-gated in `ff/src/biginteger/arithmetic.rs`/`ff-macros`; riscv64 falls back to the portable Rust implementation with no compile failure. | No riscv64-specific arkworks CI found. | crates.io only (arch-agnostic source crate). | No riscv64 issue found in arkworks-rs/algebra. Falls back to a slower generic path vs. the x86_64 asm fast path - a performance gap, not a correctness/build blocker. |
| wasmer-middlewares, wasmer-types (`=5.0.6`, indirect via Wasmer) | Indirect - gas-metering middleware and shared Wasmer type definitions | Same as Wasmer row | Same as Wasmer row | Same as Wasmer row | Thin wrapper crates over the same engine; inherit the Singlepass gap. |
| k256, p256, ecdsa (RustCrypto, indirect via `cosmwasm-crypto`) | Indirect - secp256k1/secp256r1 ECDSA verify+recover host functions | Pure Rust, no arch-gated asm found | No riscv64 issues found in RustCrypto/elliptic-curves | crates.io only | Zero riscv64 issues reported - read as "not reported," not "verified passing." |
| ed25519-zebra (`=4.0.3`, indirect) | Indirect - Ed25519 signature verification host function | Pure Rust (curve25519-dalek backed), no riscv64 issues found | none found | crates.io only | - |
| curve25519-dalek (indirect, pinned transitively >=4.1.3 for a RUSTSEC fix) | Indirect - underlying curve arithmetic for ed25519-zebra | Pure Rust portable backend | no riscv64-specific test issues found | crates.io only | Only open riscv-adjacent issue found (#717, wasm32 simd v128 backend) is unrelated to riscv64. |
| rayon (`1.9.0`, indirect, used with `ark-ec`'s `"parallel"` feature) | Indirect - data-parallelism for BLS12-381 pairing math | Pure Rust work-stealing threadpool, no riscv64 issues found | none found | crates.io only | - |
| crc32fast, blake2, sha2 (indirect, `cosmwasm-vm`) | Indirect - checksums/hashing for module-cache integrity and contract hashing | Pure Rust with optional SIMD-accelerated backends (x86 pclmulqdq / aarch64 crc32 intrinsics for crc32fast) that are feature/arch-gated; falls back to a portable table-based implementation on riscv64 | no riscv64 issues found for any of the three | crates.io only | Performance-only gap (no arch-specific speedup on riscv64), not a build/correctness blocker. |

**Summary:** All crypto/numeric dependencies (arkworks BLS12-381, RustCrypto k256/p256, ed25519-zebra, curve25519-dalek, rayon, sha2/blake2/crc32fast) are pure Rust or properly `cfg(target_arch = "x86_64")`-gated for their asm fast paths, so none of them are expected to block a riscv64 build on their own - they would simply run without the x86_64-specific speedups (a performance gap, not a correctness/build blocker). The one genuinely architecture-blocking dependency is **Wasmer's Singlepass backend**, the only compiler backend `cosmwasm-vm` uses, which is not wired into Wasmer's riscv64 build path per Wasmer's own documentation.

## 10. Ecosystem Status

Not applicable. CosmWasm contracts compile to architecture-agnostic `wasm32-unknown-unknown` bytecode and CosmWasm's own crates are Rust libraries consumed via Cargo/crates.io, not a dependent package ecosystem (Python/npm/Maven/Kubernetes-operator style) requiring separate per-architecture enablement. Per the task's Section 10 inclusion rule, this section is omitted.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue or PR exists | N/A | N/A | Confirmed via `mcp__github__search_issues` (`riscv`, `riscv64`, `"risc-v"` scoped to `repo:CosmWasm/cosmwasm`) and `mcp__github__search_pull_requests` (same terms, plus `org:CosmWasm`) - all zero results. A broader `riscv repo:CosmWasm/wasmvm` search returned 2 hits, both false positives (s390x support requests #257 and #173, where "riscv" matched only as a substring artifact, not actual RISC-V content). |

**No correctness bugs, performance benchmarks, or NaN/float-determinism issues specific to RISC-V exist anywhere for CosmWasm.** This reflects an untested/undocumented combination, not a documented-working or documented-broken state - nobody appears to have attempted running CosmWasm on riscv64 and reported results.

## 12. Objections and Upstream Blockers

No stated objections exist, because no riscv64 request or discussion has ever been raised against `CosmWasm/cosmwasm` (or, per the researched sibling-repo check, `CosmWasm/wasmvm`). There is consequently nothing to relay in terms of maintainer pushback.

**Technical blockers:**
- CosmWasm's execution engine depends exclusively on Wasmer's Singlepass compiler backend, which Wasmer's own `docs/RISCV.md` documentation states has no allocated engineering resources for riscv64, and which is not wired into Wasmer's Makefile riscv64 build path.
- `CosmWasm/wasmvm` (the repo that would need to produce a riscv64 `libwasmvm.so`) has zero riscv references anywhere and ships a hardcoded x86_64-only musl static library with no riscv64 equivalent.

**Organizational blockers:**
- CosmWasm has no foundation and no disclosed corporate sponsor program. Its sole prior corporate steward, Confio GmbH, is in liquidation as of mid-2025.
- Stewardship since July 2025 rests with an informal "CosmWasm Community" whose visible activity is dominated by a single Engos Software-affiliated contributor - there is no evidence of engineering bandwidth allocated to new-architecture work.
- CosmWasm is not a RISE Project member (confirmed against the [full RISE members list](https://riseproject.dev/members/): Premier Members Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General Members Akeana, Andes, ESWIN, BOSC, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE - CosmWasm appears on neither list), and no RISE blog post, wheel-builder entry, or funded RFP references CosmWasm anywhere.

**Acceptance probability:** cannot be assessed from available evidence - there is no track record of the maintainer community's posture toward new-architecture requests specific to this project (the closest historical precedent, [go-cosmwasm#53 "Add support for ARM"](https://github.com/CosmWasm/go-cosmwasm/issues/53), was in the predecessor repo and concerned ARM, not RISC-V).

## 13. Readiness Assessment

- **Color:** orange (no sub-case cleanly matches the skill's enumerated orange color_case values - this is the base "no upstream CI, no distribution package exists at all to apply a floor" scenario, distinct from `downstream-only`, which presumes a distro ships the package)
- **Release provider:** none - no channel (upstream, RISE, any Linux distro, or any third party) publishes a riscv64 artifact for CosmWasm, and none publishes any architecture-specific artifact for CosmWasm at all (see Section 8)
- **Optimization gap:** N/A - CosmWasm is a general-purpose smart-contract framework, not an optimization-purpose project by the skill's test ("if the project ran on RISC-V using only generic C/Rust code with no architecture-specific optimizations, would it still deliver the value that justifies using it over a simpler alternative?" - yes: CosmWasm's value proposition is a secure, deterministic contract execution environment, not raw architecture-specific speed). The Optimization level header field is correctly omitted per the report rules.
- **Justification:** No upstream riscv64 CI exists in `CosmWasm/cosmwasm` - both CI workflow files ([contracts.yml](https://github.com/CosmWasm/cosmwasm/blob/main/.github/workflows/contracts.yml), [packages.yml](https://github.com/CosmWasm/cosmwasm/blob/main/.github/workflows/packages.yml)) run only on x86_64 GitHub-hosted runners with no riscv64 leg, confirmed further by a zero-match repository-wide grep for "riscv" and zero riscv-tagged issues/PRs/commits. No Linux distribution ships a `cosmwasm` package (Ubuntu 26.04 resolute: no results; Arch RISC-V: not listed; PyPI: not applicable, 404), so the distribution floor (which would otherwise upgrade the grade to yellow or orange-via-patches) does not apply - there is simply no distro package to apply it to. This places CosmWasm at the base "no upstream CI" orange row of the color model's Step 1 table.
- **Pending work that could change the grade:** none identified - no open PRs, no tracking issue, no RISE involvement of any kind was found anywhere in the CosmWasm org or the RISE project's blog, wheel-builder, or GitHub org. The dominant blocker that any future work would need to resolve first is entirely upstream of CosmWasm itself: Wasmer's Singlepass compiler backend (the only backend `cosmwasm-vm` compiles in) is not wired into Wasmer's riscv64 build path, per Wasmer's own `docs/RISCV.md` ("Singlepass can be done, but no resources are allocated on this task for now") [NEEDS VERIFICATION - Wasmer's own riscv64/Singlepass status should be independently confirmed against the live Wasmer repository as part of grading Wasmer itself; this report's Wasmer-specific facts are carried from the dependency-research pass rather than a fresh read of Wasmer's current CI files]. Until that dependency edge is resolved, CosmWasm cannot realistically execute contracts on riscv64 hosts even if CosmWasm's own crates build successfully.

## 14. Investment Analysis

Before sizing any work: no RISE-funded or RISE-adjacent work exists anywhere in the CosmWasm ecosystem (confirmed in Sections 8 and 12) - nothing here is already covered and none of the estimates below can be reduced for prior investment.

### 14.1 Functional Enablement

The dominant functional blocker is not inside `CosmWasm/cosmwasm` at all - it is in the upstream Wasmer dependency (Singlepass backend on riscv64) and in the sibling `CosmWasm/wasmvm` repository (which would need a riscv64 build/release leg for `libwasmvm.so`). Functional enablement work for CosmWasm itself is limited to: (a) validating that the pure-Rust crates (`cosmwasm-std`, `cosmwasm-vm`, `cosmwasm-crypto`) actually build and pass tests on a riscv64 host once a working Rust toolchain and Wasmer-with-Singlepass are available, and (b) adding a riscv64 leg to `CosmWasm/wasmvm`'s build/release Makefile once Wasmer's Singlepass gap is closed. Both are gated on upstream Wasmer work outside this project's control.

### 14.2 Performance Optimization

Not applicable to CosmWasm's own code (no architecture-specific hot paths exist in-repo, see Section 4). Any future riscv64 performance work would target the external Wasmer Singlepass backend, not CosmWasm.

### 14.3 CI/CD Infrastructure

Adding a riscv64 CI leg to `.github/workflows/contracts.yml` and `.github/workflows/packages.yml` is straightforward in principle (both already use a simple `matrix.os` GitHub Actions pattern) but is blocking-dependent: without a working Wasmer Singlepass build on riscv64, a riscv64 CI leg for `cosmwasm-vm`'s test suite cannot pass, since `cosmwasm-vm` hard-pins Wasmer with `features=["singlepass"]`.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 was omitted because CosmWasm has no dependent package ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve Wasmer Singlepass riscv64 build/test gap (upstream Wasmer work, outside CosmWasm's direct control - contact Wasmer maintainers re: PR #6053 ambiguity) | Data not available: no engineering-effort estimate found for Wasmer's own Singlepass-on-riscv64 work | Wasmer upstream (not CosmWasm) | Critical - blocks everything else |
| Functional | Validate `cosmwasm-std`/`cosmwasm-vm`/`cosmwasm-crypto` build and test cleanly on a riscv64 host once toolchain + Wasmer dependency are available | Data not available: no riscv64 hardware/CI access was exercised in this research to produce a real estimate | CosmWasm community (currently informal, thin bandwidth) | High, but gated on the Wasmer item above |
| Functional | Add riscv64 build/release leg to `CosmWasm/wasmvm`'s Makefile and release pipeline (`libwasmvm.riscv64.so`, plus a musl static-lib equivalent to the existing x86_64 one) | Data not available: no estimate found or derivable from available evidence | CosmWasm community | High, but gated on the Wasmer item above |
| CI/CD | Add a riscv64 leg to `contracts.yml` and `packages.yml` GitHub Actions matrices | Data not available: no estimate found | CosmWasm community | Medium - only meaningful once the functional blockers above are cleared |
| Organizational | Establish a documented architecture-support tier policy (none exists today for any architecture) | Data not available: no estimate found | CosmWasm community / governance | Low-Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [CosmWasm/cosmwasm repository](https://github.com/CosmWasm/cosmwasm)
- [CosmWasm homepage](https://cosmwasm.com/) (returned HTTP 403 through the research proxy on every attempt during this research; not independently confirmed)
- [.github/workflows/contracts.yml](https://github.com/CosmWasm/cosmwasm/blob/main/.github/workflows/contracts.yml)
- [.github/workflows/packages.yml](https://github.com/CosmWasm/cosmwasm/blob/main/.github/workflows/packages.yml)
- [CosmWasm/cosmwasm releases](https://github.com/CosmWasm/cosmwasm/releases)
- [CosmWasm/cosmwasm wiki: Minimum Supported Rust Version (MSRV)](https://github.com/CosmWasm/cosmwasm/wiki/Minimum-Supported-Rust-Version-(MSRV))
- [CosmWasm/.github org-profile repository](https://github.com/CosmWasm/.github)
- [CosmWasm/maintainers docs site](https://cosmwasm.github.io/maintainers)
- [CosmWasm/go-cosmwasm#53 "Add support for ARM"](https://github.com/CosmWasm/go-cosmwasm/issues/53)
- [CosmWasm/wasmvm repository](https://github.com/CosmWasm/wasmvm)
- [PyPI JSON API for "cosmwasm"](https://pypi.org/pypi/cosmwasm/json) (404 - package does not exist)
- [Ubuntu package search, suite=resolute, keywords=CosmWasm](https://packages.ubuntu.com/search?keywords=CosmWasm&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=cosmwasm)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [confio.gmbh](https://confio.gmbh) (liquidation notice)
- Data not available: Wasmer's own `docs/RISCV.md` content and PR #6053 were characterized secondhand via prior dependency research in this task chain, not fetched directly in this pass - flagged as [NEEDS VERIFICATION] in Section 13.