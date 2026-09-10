---
title: SpiderLightning
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="spiderlightning" %}

# SpiderLightning

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for SpiderLightning<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SpiderLightning ("slight") is a Microsoft/DeisLabs project providing a set of WIT (WebAssembly Interface Types) definitions and an associated host runtime CLI abstracting cloud-native capabilities (key-value storage, messaging, HTTP, SQL, distributed locking, blob storage) for WebAssembly components. It is a Rust workspace built around the [wasmtime](https://github.com/bytecodealliance/wasmtime) WebAssembly runtime, compiling guest applications to `wasm32-wasi` while the host `slight` CLI is a natively compiled binary per target OS/architecture.

The repository is hosted at [deislabs/spiderlightning](https://github.com/deislabs/spiderlightning), part of Microsoft's `deislabs` open-source incubation organization. It is MIT licensed (LICENSE.md: "Copyright (c) Microsoft Corporation"). There is no foundation affiliation, no MAINTAINERS/OWNERS/CODEOWNERS/GOVERNANCE file, and no PLATFORMS.md or tiered platform-support policy. CONTRIBUTING.md describes only an informal PR-review process with DCO sign-off, no formal RFC or tier structure.

**Commit history (243 commits total, `git shortlog -sne`):** dominated by Microsoft employees - Jiaxiao Zhou (101 commits, jiazho@microsoft.com), Dan Chiarlone (97 commits, dchiarlone@microsoft.com), dependabot[bot] (22), David Justice/devigned (4, ex-Microsoft), plus single-digit contributions from Kai Walter (independent), Flavio Castelli (SUSE), Radu Matei (formerly Microsoft/Fermyon), and several other Microsoft employees. This is effectively a single-company project with occasional outside drive-by contributions.

**Project status:** The GitHub repository was archived (read-only) by its owner on **2025-07-14**. Development of the Slight CLI was placed on hold as of 2024-01-01, with the project's own site stating that SpiderLightning's WIT interfaces were being folded into the WASI Subgroup's `wasi-cloud-core` standardization effort instead of continuing as a standalone project, with successor implementation work pointed to Spin, wasmCloud, and Wasmtime.

There is no stated community culture on new architecture ports - the topic never arose during the project's active lifetime, which ended (development frozen, then archived) before any such discussion would have occurred.

## 2. Port History and Upstreaming Timeline

No riscv64 port was ever attempted. There are no milestones to report.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related commit, issue, or PR exists in project history | [GitHub code/issue/PR/commit search, 0 results across all queries](https://github.com/deislabs/spiderlightning) |
| 2024-01-01 | Slight CLI development placed on hold; WIT interfaces folded into WASI Subgroup's `wasi-cloud-core` effort | [Project site](https://deislabs.github.io/spiderlightning/) |
| 2025-07-14 | Repository archived (read-only) by owner | [deislabs/spiderlightning repository](https://github.com/deislabs/spiderlightning) |

No riscv64 work is upstream, in flight, or planned. A fork exists at `Mossaka/spiderlightning`, but no RISC-V activity was found there via web search either [NEEDS VERIFICATION - fork not searched via GitHub API per task scope].

## 3. Upstream Support Tier

No formal platform-support tier policy exists (no PLATFORMS.md, no documented tiering scheme, no tiered maintainer structure). The de facto support surface is defined entirely by the CI/release matrix, which never included riscv64 at any point in the project's history.

| Architecture | CI builds | CI tests | Official release binary |
|---|---|---|---|
| amd64 (x86_64) | Yes (ubuntu-latest, windows-latest) | Yes | Yes (`slight-linux-x86_64.tar.gz`, `slight-windows-x86_64.tar.gz`) |
| arm64 (aarch64, macOS only) | Yes (macos-latest, `--target aarch64-apple-darwin`) | Yes | Yes (`slight-macos-aarch64.tar.gz`) |
| riscv64 | No | No | No |

Source: direct read of [`.github/workflows/ci.yaml` and `.github/workflows/release.yml`](https://github.com/deislabs/spiderlightning) at HEAD `283caa0`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

SpiderLightning itself contains **no architecture-specific code of any kind**, for any architecture. A repository-wide search (`mcp__github__search_code` for `__riscv`, `cfg(target_arch`, `target_arch`, `cfg(target_os`, plus local grep) returned zero matches for every query. There is no `#[cfg(target_arch = ...)]` guard anywhere in the codebase - not for amd64, arm64, or riscv64.

This is structurally different from a codec/crypto/numerics library with hand-tuned per-ISA code paths: SpiderLightning is a portable Rust/WASI-component source tree, compiled once per **OS/toolchain target triple** (not per CPU ISA with intrinsics). Its JIT/codegen and any SIMD-relevant work is fully delegated to the embedded Wasmtime/Cranelift dependency (see Section 9), which is a separately tracked project.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture-specific source files | 0 (portable Rust) | 0 (portable Rust) | 0 (portable Rust) |
| Appears only as | CI/release target triple | CI/release target triple | Not present anywhere |
| JIT/codegen (delegated to Wasmtime/Cranelift) | Native backend | Native backend | Tier 3 backend exists in the dependency (see Section 9) |

**Conclusion:** riscv64 "implementation" for SpiderLightning's own code does not exist at any level - not stubbed, not partially guarded, not scalar-fallback-only. It is completely absent, consistent with there being no architecture-conditional compilation of any kind in this project.

## 5. Build System, Cross-Compilation, and Toolchain

The build system is Cargo (`Cargo.toml`, `Cargo.lock`, `build.rs`) driven through a top-level `Makefile` (targets: `build`, `build-rust`, `build-c`, `install-deps`). There is no CMake anywhere in the repository (no `CMakeLists.txt`, no `cmake/` directory).

No riscv64 build documentation exists:
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md`. `docs/` contains only `primer.md`, `pubsub-background.md`, `service-implementation-101.md`, and an `images/` folder.
- Only one Dockerfile exists in the repo (`.devcontainer/Dockerfile`, a plain `ubuntu:22.04` devcontainer) - no `docker/` directory, no `Dockerfile.riscv64`, no arch-specific container config.
- No QEMU usage anywhere in any workflow file.
- No riscv64 toolchain, cross-compilation target, or `.cargo/config.toml` riscv64 target entry found.

Guest WASM applications compile to `wasm32-wasi`/`wasm32-unknown-unknown` (architecture-neutral WebAssembly bytecode); the host `slight` CLI builds natively for `x86_64` (Linux/Windows) and `aarch64-apple-darwin` (macOS) only, per the CI matrix in Section 3.

**Conclusion:** any answer providing exact cmake commands, toolchain version minimums, or a riscv64 Dockerfile for this project would be fabricated - none of these artifacts exist in `deislabs/spiderlightning`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds via upstream CI | Yes | Yes (macOS only) | No |
| Runs test suite via upstream CI | Yes | Yes | No |
| Official release binary | Yes | Yes | No |
| Host CLI (`slight`) usable at all | Yes | Yes (macOS) | No - would require reviving the project's own build pipeline first |

There is no functional gap to characterize beyond "does not exist as a build target" - no partial feature set, no performance delta data (none was found), and no NaN/floating-point semantics data (none found; this is not a numerics library). Data not available: any riscv64-specific functional or performance comparison, because no riscv64 build has ever been produced.

## 7. CI/CD Infrastructure

Direct inspection of both CI workflow files (`.github/workflows/ci.yaml`, `.github/workflows/release.yml`, HEAD `283caa0`) confirms no riscv64 CI exists. Case-insensitive grep for `riscv` across both files, and across the entire repository, returns zero matches. Grep for `qemu` in the workflows also returns zero matches, ruling out cross-arch emulation.

- `ci.yaml` triggers: `push`/`pull_request` to `main`, plus `workflow_call` (invoked by `release.yml`).
- `release.yml` triggers: `push` of tags matching `v*`; calls `ci.yaml` as a reusable workflow, then builds release assets on the same runner matrix.
- Jobs: `rustfmt` (format check) and `build` (`make build`/`cargo build --release`, build examples, run unit tests via `make test`, then package release tarballs).
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.drone.yml`, or `azure-pipelines*` exists anywhere in the repository (a legacy `build/azure-pipeline/workflow-pr.yml` exists but targets `x86`, `x86_64`, `arm`, `aarch64` only).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | `ubuntu-latest`, `windows-latest` | `macos-latest` (`--target aarch64-apple-darwin`) | None |
| Build | Yes | Yes | No |
| Test | Yes | Yes | No |
| RISE runner usage | No | No | No |
| QEMU/cross-arch emulation | No | No | No |

No RISE Project (riseproject.dev) involvement was found: SpiderLightning does not appear in the RISE member list, blog, or wheel-builder listing (see Section 12).

## 8. Distribution and Release Status

No riscv64 binary or package exists through any channel checked:

- **GitHub Releases:** the 5 most recent releases (v0.5.1, v0.5.0, v0.4.1, v0.4.0, v0.3.3) and the earliest (v0.1.0) were inspected via full expanded asset lists. Each ships exactly the same 4 fixed platform binaries: `slight-linux-x86_64.tar.gz`, `slight-macos-aarch64.tar.gz`, `slight-macos-amd64.tar.gz`, `slight-windows-x86_64.tar.gz`, plus WIT/template files and source archives. No riscv64 (and no linux-arm64) asset was ever published in any release. Source: [deislabs/spiderlightning releases](https://github.com/deislabs/spiderlightning/releases).
- **PyPI:** `https://pypi.org/pypi/spiderlightning/json` returns **HTTP 404**; `https://pypi.org/simple/spiderlightning/` also returns **HTTP 404**. No PyPI project named `spiderlightning` exists at all - it is not a Python-distributed project.
- **RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/spiderlightning/` redirects (HTTP 302) to the same 404 PyPI URL.
- **Ubuntu (26.04 resolute and all other suites):** `https://packages.ubuntu.com/search?keywords=spiderlightning&searchon=names&section=all` returns "Sorry, your search gave no results" across every suite and architecture, including riscv64.
- **Arch Linux RISC-V:** direct enumeration of the real riscv64 package repository (`core/` - 558 entries, `extra/` - 28,538 entries, `unsupported/` - 22 entries) returns zero matches for `spiderlightning`/`slight`.

**What a user must do to get a working binary:** there is currently no path to a riscv64 `slight` binary. A user would need to (1) fork the archived repository, (2) add a riscv64 target to the CI/release matrix, (3) resolve any build issues in the pinned dependency chain (see Section 9), and (4) self-host the resulting binary, since no distro or third party packages this project for any architecture at all.

Note: `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) during this research pass, so the Ubuntu 26.04 finding above rests on direct `packages.ubuntu.com` queries rather than the graph database cross-check; this should be re-run once the graph server is restored. [NEEDS VERIFICATION - graph DB cross-check not possible]

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **Rust** | Build-dependency (critical) - toolchain/compiler for the entire workspace | Rust upstream supports riscv64gc-unknown-linux-gnu as a Tier 2 target [NEEDS VERIFICATION - not independently re-confirmed in this research pass, carried from general Rust toolchain knowledge referenced in dependency research] | N/A (toolchain, not a runtime artifact) | Rust ships riscv64gc release toolchains | No project-specific blocker found; the constraint is entirely in the dependency chain below, not the Rust toolchain itself |
| **Wasmtime** (pinned 10.0.1; upstream now v48+) | Runtime-dependency (critical) - core WASM JIT engine everything SpiderLightning executes runs through | riscv64 backend merged upstream at v2.0.0 (Oct 2022) via a Cranelift MachInst/ISLE rewrite; the pinned v10.0.1 (early 2023) already has a riscv64 backend but predates most SIMD/RVV completion work (initial SIMD landed 2023-04/10, after v10) | Upstream CI runs a riscv64gc-unknown-linux-gnu test matrix under QEMU, gated (path-relevant changes / merge-queue / release branches, not every PR) | Upstream ships official riscv64gc-linux release tarballs (Tier 3, no distro packaging); no `wasmtime`/`libwasmtime` package exists in Ubuntu for any architecture | Tier 3 (no full-time maintainer, no continuous fuzzing); 8 open correctness-severity issues on current upstream noted in a separate wasmtime status report (readiness: green per that report) [single-source within this research pass - see project-reports/wasmtime.md reference in findings] |
| **wizer** (pinned 3.0.1, git dependency `bytecodealliance/wizer`) | Build-dependency (critical) - WASM pre-initializer/snapshotter used at `slight` build time, itself instantiates and drives Wasmtime/Cranelift | No riscv64-specific code or open issues found in wizer's own repository; wizer has no architecture-specific logic of its own and fully inherits Wasmtime/Cranelift's riscv64 status since it only calls into Wasmtime to run the module being snapshotted | No dedicated wizer riscv64 CI found | No riscv64 release artifact published by wizer itself; not Ubuntu-packaged (crates.io/source only) | Inherits every Wasmtime/Cranelift riscv64 gap; no wizer-specific blocker found |
| Cranelift (`cranelift-codegen`, in-tree with Wasmtime) | Transitive - JIT/AOT codegen backend, the actual machine-code emitter used by Wasmtime | Hand-written riscv64 ISA backend present; RVV vector support incomplete (widening/narrowing ops, reductions, strided/indexed loads, vector integer division flagged as gaps in upstream tracking) | Exercised via `cranelift/filetests` plus the QEMU matrix | Ships inside Wasmtime's riscv64gc release artifact | Same Tier-3/no-fuzzing gap as Wasmtime |
| ring 0.16.20 (transitive, via rustls -> reqwest/aws-sdk-s3/tokio-postgres TLS) | Default crypto backend behind TLS | Multiple historical upstream riscv64 build-failure issues across point releases exist for `ring`; the pinned 0.16.20 is considerably older than versions where upstream triage of riscv64 issues began | No dedicated riscv64 CI/optimized asm path confirmed | Published normally to crates.io only | Flagged as the weakest link in the dependency chain per the broader dependency research pass |
| rustls (transitive, pinned 0.19.1/0.20.8) | Pure-Rust TLS wrapping ring | No arch-specific code of its own | Inherits ring's risk profile | Published normally | - |
| openssl (transitive, pinned 0.10.55/openssl-sys) | Alternative crypto/TLS backend | riscv64 port merged upstream May 2022, actively extended since (AES-RV64I asm, Zbb/Zbc carry-less multiply for GCM) | Regular 3.0-4.0 releases carry riscv64 asm paths | Distro-packaged for riscv64 (`libssl-dev` present in Ubuntu 26.04 riscv64 per a direct check in the broader dependency research) | No blocking issues found |
| zstd (transitive, pinned 0.11.2+zstd.1.5.2) | Compression, wraps C zstd via `zstd-sys` | Upstream zstd supports riscv64 on a best-effort community basis; a fix (upstream PR referenced in dependency research) corrected riscv64 not being recognized as `__64BIT__`, meaning releases through v1.5.7 silently used 32-bit code paths on riscv64 - the pinned zstd-sys (1.5.2 era, 2022) predates that fix | No dedicated CI signal found | Published normally to crates.io | The `__64BIT__` bug is a specific, concrete regression relevant to this old pinned version |
| flate2 1.0.26 (direct dependency) | Compression, used for release-artifact/tarball handling | Default backend is `miniz_oxide` (pure Rust) unless the `zlib`/`zlib-ng` feature is explicitly enabled - pure-Rust path is architecture-portable | Portable | Published normally | If the zlib-linking feature were enabled, risk becomes zlib's (`libzstd-dev`/`zlib1g-dev` confirmed present for riscv64 in Ubuntu 26.04 resolute) |

**Screened out** (present in the dependency graph but no architecture-specific code of their own): redis, tokio-postgres, etcd-client, aws-sdk-s3, azure_storage_blobs (pure-Rust async network/protocol clients whose only riscv64 exposure is transitive, through the TLS/crypto backends already covered above); regalloc2 (Cranelift's register allocator, architecture-agnostic by design). SpiderLightning/Wasmtime use the system default memory allocator on every platform - no custom allocator dependency exists.

**Net effect:** even if every dependency's riscv64 story were perfect, SpiderLightning ships no riscv64 build target of its own and shows no recent maintenance activity (archived 2025-07-14). Reviving the project's own release pipeline for riscv64 is the actual first blocker, ahead of any single dependency issue.

## 11. Known Bugs and Active Issues

No riscv64-related issues or PRs exist in `deislabs/spiderlightning`. Exhaustive searches (GitHub issue search, PR search, commit search, full-repo case-insensitive grep for `riscv`/`RISCV`/`RISC-V`/`risc-v`) all returned zero matches. The repository has 43 open issues total (as of the archival snapshot), none touching RISC-V.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue exists | N/A | N/A | Confirmed via issue search, PR search, commit search, and full-repo grep - all zero results |

No correctness bugs specific to riscv64 were found, because no riscv64 build has ever existed to surface them. Any riscv64-relevant bugs would currently only surface transitively, through the embedded Wasmtime/Cranelift dependency (see Section 9), which is tracked separately.

## 12. Objections and Upstream Blockers

No stated objections to a riscv64 port exist, because the topic was never raised. There is no evidence of the maintainers being asked for or refusing riscv64 support.

**Technical blockers:**
- The repository is archived (read-only) as of 2025-07-14 - no PR can currently be merged upstream at all, technical or otherwise.
- The project's own release tooling (`install.sh`, CI/release workflows) has no riscv64 target defined anywhere.
- Several pinned dependencies (`ring` 0.16.20, `wasmtime` 10.0.1, `zstd`-era 1.5.2) are old enough to predate later upstream riscv64 fixes/completion work in those projects (see Section 9).

**Organizational blockers:**
- Development of the Slight CLI was placed on hold as of 2024-01-01, with the project's WIT interfaces folded into the WASI Subgroup's `wasi-cloud-core` effort instead. The maintaining organization (Microsoft/deislabs) has redirected effort to that standardization track and to successor projects (Spin, wasmCloud, Wasmtime) rather than continuing standalone SpiderLightning development.
- No RISE Project (riseproject.dev) involvement or affiliation was found: SpiderLightning/deislabs does not appear on the RISE member list (8 Premier Members, 12 General Members, none matching), the RISE blog, or the RISE Python wheel builder's 85-package listing.

**Acceptance probability:** Effectively zero through the current channel. The repository being archived means no PR can be accepted upstream at all without a fork/revival. Any future riscv64 support would require either (a) someone reviving `deislabs/spiderlightning` or a fork (e.g. `Mossaka/spiderlightning`, unverified for RISC-V activity) and adding CI/release targets, or (b) riscv64 support surfacing instead through the successor effort (`wasi-cloud-core` and its reference implementations in Spin/wasmCloud/Wasmtime), which is out of scope for this report.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no distro package to apply a floor)
- **Release provider:** none
- **Optimization gap:** N/A - SpiderLightning is not an optimization-purpose project (it is an application-level WASI capability/runtime tool; its JIT/codegen performance characteristics are entirely inherited from the embedded Wasmtime/Cranelift dependency, tracked separately in Section 9)
- **Justification:** No upstream riscv64 CI exists - direct inspection of [`.github/workflows/ci.yaml` and `.github/workflows/release.yml`](https://github.com/deislabs/spiderlightning) confirms the build/test/release matrix covers only `ubuntu-latest` (x86_64), `macos-latest` (amd64 and `aarch64-apple-darwin`), and `windows-latest`, with zero references to riscv64 anywhere in either file. No riscv64 release artifact has ever been published across the 5 most recent releases or the earliest release ([GitHub Releases](https://github.com/deislabs/spiderlightning/releases)), and no distribution (Ubuntu, Arch Linux RISC-V) packages this project at all, so no distribution floor applies to lift the grade to yellow.
- **Pending work that could change the grade:** None identified. The repository was archived (read-only) on 2025-07-14, so no upstream PR can currently land. No RISE Project involvement, funded work, or open riscv64 tracking issue was found anywhere. The only realistic path to a higher grade is a fork/revival of the project (or riscv64 support emerging through the `wasi-cloud-core` successor effort, outside this report's scope) followed by adding CI/release coverage for riscv64.

## 14. Investment Analysis

RISE has done no work on SpiderLightning: it is not a RISE member project, has no RISE blog coverage, no RISE-funded RFP, and no RISE wheel-builder listing (see Section 12). No prior investment exists to net out against the estimates below.

Because the upstream repository is archived and read-only, any investment here first requires reviving the project (forking it) before functional, performance, or CI work is even possible. This materially changes the nature of the investment relative to an active upstream project.

### 14.1 Functional Enablement

Work required: fork the repository (or adopt `Mossaka/spiderlightning` if suitable [NEEDS VERIFICATION - fork not vetted for RISC-V readiness]), add a `riscv64gc-unknown-linux-gnu` build target to the Cargo/Makefile build path, verify the pinned Wasmtime 10.0.1 / wizer 3.0.1 / ring 0.16.20 dependency chain actually builds and runs on riscv64 (none of this was verified in this research pass - only the dependencies' general riscv64 posture was assessed, not a build attempt against these exact pins), and resolve any build failures surfaced (ring 0.16.20 in particular is flagged as high-risk given its age).

### 14.2 Performance Optimization

Not applicable in the traditional sense - SpiderLightning has no architecture-specific hot paths of its own (Section 4). Any performance work would target the embedded Wasmtime/Cranelift dependency instead, which is out of scope for this report and tracked separately.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to a revived `ci.yaml`/`release.yml` (or their equivalents in a fork), covering build and test execution, plus a riscv64 release artifact (`slight-linux-riscv64.tar.gz` equivalent) to match the existing 4-binary release pattern.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per report rules, as SpiderLightning has no dependent package ecosystem (no PyPI package, no npm package, not distributed through any package manager that other projects depend on).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fork/revive repository; stand up basic riscv64 build capability | 1-2 | Unassigned | Low |
| Functional | Add riscv64gc target to Cargo/Makefile build path; resolve dependency build issues (esp. `ring` 0.16.20) | 1-2 | Unassigned | Low |
| CI/CD | Add riscv64 build+test job to CI workflow (in fork) | 0.5-1 | Unassigned | Low |
| CI/CD | Add riscv64 release artifact to release workflow (in fork) | 0.5 | Unassigned | Low |

**Priority rationale:** All items rated Low. The upstream project is archived with development already halted before this research began, its own maintainers have redirected effort to a successor standardization track (`wasi-cloud-core`), and there is no indication of user or community demand for a riscv64 port of this specific tool. Any investment here only makes sense if a downstream consumer specifically depends on the standalone `slight` CLI rather than its successor implementations.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [deislabs/spiderlightning repository](https://github.com/deislabs/spiderlightning)
- [deislabs/spiderlightning releases](https://github.com/deislabs/spiderlightning/releases)
- [deislabs/spiderlightning CI workflow](https://github.com/deislabs/spiderlightning/blob/main/.github/workflows/ci.yaml)
- [deislabs/spiderlightning release workflow](https://github.com/deislabs/spiderlightning/blob/main/.github/workflows/release.yml)
- [SpiderLightning project site](https://deislabs.github.io/spiderlightning/)
- [PyPI spiderlightning package JSON (404)](https://pypi.org/pypi/spiderlightning/json)
- [PyPI spiderlightning simple index (404)](https://pypi.org/simple/spiderlightning/)
- [RISE Python wheel builder redirect check](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/spiderlightning/)
- [Ubuntu packages search for spiderlightning](https://packages.ubuntu.com/search?keywords=spiderlightning&searchon=names&section=all)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [bytecodealliance/wizer](https://github.com/bytecodealliance/wizer)
- [bytecodealliance/wasmtime](https://github.com/bytecodealliance/wasmtime)
