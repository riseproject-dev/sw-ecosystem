---
title: wasmCloud
parent: Project Reports
color: orange
dependencies:
  - name: wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: aws-lc-rs
    relation: runtime-dependency
    criticality: critical
  - name: rustls
    relation: runtime-dependency
    criticality: critical
  - name: sha2
    relation: runtime-dependency
    criticality: optional
  - name: flate2
    relation: runtime-dependency
    criticality: optional
  - name: async-nats
    relation: runtime-dependency
    criticality: critical
  - name: tokio
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="wasmcloud" %}

# wasmCloud

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for wasmCloud<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

wasmCloud is a Rust-based distributed application runtime and orchestrator for WebAssembly components. It consists of a host process (`wasmcloud-host`), a CLI/shell (`wash`), and a set of capability providers that give WASM components access to external resources (NATS messaging, HTTP, key-value stores, etc.). The core execution engine is [Wasmtime](https://wasmtime.dev/) with the Cranelift JIT backend.

**Foundation and license.** wasmCloud is a **CNCF (Cloud Native Computing Foundation) Incubating project**; trademarks are held by the Linux Foundation, and the legal entity is referenced as "wasmCloud LLC." Code is licensed under **Apache License 2.0**, documentation under **Creative Commons Attribution 4.0**, and a **Developer Certificate of Origin (DCO)** is required on all contributions (per `GOVERNANCE.md`). A third-party security assessment was completed by OSTIF.

**Governance.** A two-tier maintainer structure applies: **org maintainers** (2-9 people) set project direction, control the brand, interface with CNCF, and are elected by supermajority vote of existing org maintainers after a 3-week nomination window; **project maintainers** own specific codebases/areas (`wash`, Go SDK, CI, examples) and are added by 7-day lazy consensus. Default decisions use lazy consensus; formal votes are required for Code of Conduct enforcement, maintainer removal, governance changes, and licensing/IP changes. The Code of Conduct is the CNCF Code of Conduct.

**Corporate sponsors.** **Cosmonic** is the dominant corporate steward: 4 of 7 org maintainers (Bailey Hayes/@ricochet, Liam Randall, Victor Adossi, Jeremy Fleitz, Eric Gregory are all Cosmonic-affiliated maintainers) and the largest share of commit volume (a tally across 2,175 default-branch commits found Bailey Hayes ~518 commits combined across email variants, Victor Adossi 227, Jeremy Fleitz 149, Lucas Fontes 114, all Cosmonic). **Capital One** is the clear #2 corporate contributor (Brooks Townsend, ~383 commits) - notably, wasmCloud originated inside Capital One (creator Kevin Hoffman, now an emeritus maintainer) before Cosmonic was spun out as primary steward. Other maintainer affiliations include Adobe, Synadia, Betty Blocks, Helmet Security, T-Bank, Microsoft, Tambo, commercetools, Lattica, and Operatik Inc.

**Community culture on new ports.** wasmCloud has **no formally published platform-tier policy**. In practice the stance toward new architecture requests is pragmatic and contribution-driven rather than commitment-driven: a request gets labeled `enhancement`/`help wanted` and is generally accepted quickly at the source-build level if a contributor does the work (riscv64 landed in about two months via a community-adjacent PR), but full release-pipeline parity (static/musl builds, sustained official CI-published binaries) is not guaranteed and can stall or regress indefinitely, as shown both by issue #1060 going stale and by the subsequent silent removal of riscv64 build support entirely (see Section 2). This makes RISC-V historically a **best-effort, community-maintained port** rather than a committed, permanently supported platform.

**RISE membership.** wasmCloud is **not** a Premier or General member of the [RISE Project](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: 12 others - wasmCloud is not among them).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-09-11 | Issue [#853](https://github.com/wasmCloud/wasmCloud/issues/853) opened by matsbror: `wash-cli` fails to build on riscv64 (StarFive VisionFive, Ubuntu 23.04) because the `ring` crypto crate does not support riscv64 | [#853](https://github.com/wasmCloud/wasmCloud/issues/853) |
| 2023-10-05 | Issue [#724](https://github.com/wasmCloud/wasmCloud/issues/724) opened by org maintainer Bailey Hayes (@ricochet): requests a `riscv64gc-unknown-linux-gnu` host binary, citing Wasmtime's Tier 3 riscv64 support as the enabling factor | [#724](https://github.com/wasmCloud/wasmCloud/issues/724) |
| 2023-10-10 | PR [#741](https://github.com/wasmCloud/wasmCloud/pull/741) opened by rvolosatovs (maintainer): adds `riscv64gc-unknown-linux-gnu` (glibc) build target; blocked on `ring` needing an upgrade to 0.17 | [#741](https://github.com/wasmCloud/wasmCloud/pull/741) |
| 2023-11-06 | PR [#935](https://github.com/wasmCloud/wasmCloud/pull/935) opened by rvolosatovs: updates Nix/crane build tooling to v0.15.0, bringing riscv64 cross-compilation support into the `nixify` project - the prerequisite that unblocks #741 | [#935](https://github.com/wasmCloud/wasmCloud/pull/935) |
| 2023-11-16 | PR #935 merged | [#935](https://github.com/wasmCloud/wasmCloud/pull/935) |
| 2023-11-20 | PR #741 merged, closing #724 and #853. First commit is `51a1892` "feat(wash): support RISCV64" | [#741](https://github.com/wasmCloud/wasmCloud/pull/741) |
| 2023-11-21 | Issue [#1060](https://github.com/wasmCloud/wasmCloud/issues/1060) opened by rvolosatovs: requests a follow-on statically-linked (musl) riscv64 build | [#1060](https://github.com/wasmCloud/wasmCloud/issues/1060) |
| 2023-11-22 | `wash-cli-v0.24.0` released - first release to carry PR #741 and #935 per its changelog | Release changelog (wash-cli-v0.24.0) |
| 2023-12-28 | `v0.81.0` released - first **host** binary release carrying PR #741 per its changelog | Release changelog (v0.81.0) |
| 2024-07-26 | Commit `b25a747` "fix(wash-lib): invalid target_arch riscv64gc" | Git history |
| 2024-08-13 | Release `v1.9.0` published, confirmed to include a genuine riscv64 ELF binary asset `wasmcloud-riscv64gc-unknown-linux-gnu` (downloaded and verified: 22,790,184 bytes, `ELF 64-bit LSB pie executable, UCB RISC-V`) | v1.9.0 release assets |
| 2024-08 (v1.9.0-v1.9.2) | The riscv64 binary asset exists **only** on these three patch releases | Release asset manifests |
| 2024-01-28 / 2024-02-04 | Issue #1060 marked stale, auto-closed | Issue #1060 timeline |
| 2024-03-27 | Issue #1060 manually reopened with a `pinned` label | Issue #1060 timeline |
| 2024-10-09 | `pinned` label removed from #1060 | Issue #1060 timeline |
| 2024-12-08 / 2024-12-15 | Issue #1060 marked stale again, final auto-close, **never implemented** | [#1060](https://github.com/wasmCloud/wasmCloud/issues/1060) |
| v1.9.3 onward, all v1.10.x, v2.0.0 - v2.8.0 (latest, 2024-08-25) | riscv64 asset filename returns 404 on every release after v1.9.2 | Direct asset-URL probing across release history |
| ~Q1 2026 (undated) | The Nix/nixify build subsystem that once hosted riscv64 cross-compilation (`flake.nix`, `flake.lock`, `.github/actions/build-nix`, etc.) is removed from the repository entirely, apparently as collateral of a migration to a zigbuild/GitHub-Actions-matrix build system; no dedicated "drop riscv64" issue or PR was found | Full repo file listing (1,052 files) shows no `nix`/`flake` files; Dependabot "build(nix): update dependencies" PRs stop appearing after March 2026 |
| 2026-09-08 | Verified: `main` HEAD `d5733f7` contains zero riscv64 references anywhere in the repository (`grep -ri riscv` across full working tree: 0 matches); `install.sh` explicitly rejects riscv64 | Direct clone and grep of `wasmCloud/wasmCloud` main |

**Key contributors:** Roman Volosatovs (@rvolosatovs, maintainer, Helmet Security) authored both enabling PRs (#741, #935) and the follow-on musl request (#1060). Bailey Hayes (@ricochet, org maintainer, Cosmonic) filed the originating feature request (#724). matsbror (community member) filed the independent wash-cli build-failure report (#853), motivated by a demonstrative goal ("showcase the architecture independence nature of WebAssembly"), not a concrete business case, per his own comment on the issue.

**Is it fully upstream today?** No. The build-target addition was merged upstream in November 2023, but the resulting artifact shipped in only three patch releases (August 2024) and has since vanished from both the release pipeline and the source tree - riscv64 is not buildable from current `main` by any documented or discovered path.

## 3. Upstream Support Tier

wasmCloud has no formally published platform-tier policy or `PLATFORMS.md`/`SUPPORT.md` document. The only "tier" language traceable in the project's history is a reference to **Wasmtime's own Tier 3** riscv64 classification, cited by Bailey Hayes in issue #724 as the technical basis for feasibility - this is a property of a dependency, not a wasmCloud-authored commitment.

There is no current evidence of riscv64 being release-blocking, CI-gated, or officially binary-published. The one period (August 2024, v1.9.0-v1.9.2) during which upstream did publish a riscv64 binary is now roughly two years stale relative to the current latest release (v2.8.0).

**Comparison: amd64 vs arm64 vs riscv64 (current state, verified against `.github/workflows/wash.yml` and `install.sh` on `main`, HEAD `d5733f7`)**

| Property | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| In CI build matrix (`wash.yml`) | Yes (gnu + musl + darwin + windows-msvc) | Yes (gnu + musl + darwin) | **No** |
| Tests run in CI | Yes | Yes | **N/A - not built** |
| Official release binary (v2.8.0) | Yes | Yes | **No** |
| Recognized by `install.sh` | Yes | Yes | **No - hits "Unsupported architecture" error** |
| Historical release binary | N/A (always shipped) | N/A (always shipped) | Shipped only in v1.9.0-v1.9.2 (Aug 2024), then removed |

Note: s390x is also present in the current CI build matrix and release asset list, despite being a far more obscure architecture than riscv64 - underscoring that riscv64's absence reflects an active decision/regression rather than a general policy against niche architectures.

## 4. Technical Architecture and RISC-V-Specific Subsystems

wasmCloud itself contains **no architecture-specific source code for any CPU architecture**. It is a single portable Rust codebase with no `#ifdef`/`cfg(target_arch)` branches, intrinsics, or per-architecture implementation files in application logic. Every "aarch64" string match found in the repository (7 total) occurs in CI YAML, `install.sh`, an internal arch-string normalizer in `update.rs`, `Cargo.lock` (transitive `windows_aarch64_*` dependency names), and a bench README - never in `crates/` application logic.

"Architecture support" for wasmCloud therefore reduces to exactly two things: (a) a Cargo target triple wired into the CI build matrix, and (b) a string match in `install.sh`'s `uname -m` case statement. There is no JIT, SIMD, or crypto code within the wasmCloud repository itself; all such subsystems are inherited transitively through dependencies (see Section 9).

**Comparison table (architecture-specific code, in-repo)**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned assembly / intrinsics in `crates/` | None | None | None |
| JIT/compiler backend | Inherited from Wasmtime/Cranelift (Tier 1) | Inherited from Wasmtime/Cranelift (Tier 2) | Inherited from Wasmtime/Cranelift (Tier 3) |
| Crypto backend | Inherited from aws-lc-rs / ring | Inherited from aws-lc-rs / ring | Inherited, with an open riscv64-musl gap in aws-lc-rs (see Section 9) |
| CI target triple wired in | Yes | Yes | No (removed) |
| `install.sh` recognition | Yes | Yes | No |

Since wasmCloud has no architecture-specific implementation code of its own, the entire question of RISC-V code quality resolves to the dependency chain in Section 9, principally Wasmtime/Cranelift.

## 5. Build System, Cross-Compilation, and Toolchain

**Current build system:** a plain Cargo workspace. `Cargo.toml` sets `rust-version = "1.94.0"` (MSRV); `rust-toolchain.toml` pins `channel = "1.96.0"` with targets `wasm32-unknown-unknown`, `wasm32-wasip1`, `wasm32-wasip2` - no native riscv64 target is listed. There is **no CMake anywhere in the repository** (confirmed by `find . -iname CMakeLists.txt -o -iname "*.cmake"` returning zero results on a full checkout).

**Docker/CI build matrix** (`.github/workflows/docker-build-push.yml`):
```yaml
matrix:
  include:
    - arch: amd64
      runner: ubuntu-24.04
    - arch: arm64
      runner: ubuntu-24.04-arm
```
QEMU (`docker/setup-qemu-action`) and Buildx are configured in this workflow, but only to support the amd64/arm64 native-runner matrix above - there is no riscv64 leg, so there is no QEMU-emulated riscv64 build to document.

**`wash.yml` release build matrix** (843 lines, full file read) lists exactly 8 targets: `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, `s390x-unknown-linux-gnu`, `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, `x86_64-apple-darwin`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`. No riscv64.

**Historical build path (no longer present):** riscv64 cross-compilation was previously handled by the Nix `nixify` project (`crane` v0.15.0+, per PR #935), producing `riscv64gc-unknown-linux-gnu` glibc binaries via `cargo build --target riscv64gc-unknown-linux-gnu` under Nix's cross-compilation harness. This entire subsystem (`flake.nix`, `flake.lock`, `Cross.toml`, `.github/actions/build-nix`, `.github/actions/install-nix`) is absent from the current repository (all 404 on `raw.githubusercontent.com/.../main/...`, and absent from a full 1,052-file repo listing) - it appears to have been decommissioned as part of a migration away from Nix-based builds, with the loss of riscv64 support as an apparent (undocumented) side effect.

**Known build failure (historical, resolved):** the original blocker for both #724 and #853 was identical - the `ring` crypto crate (v0.16.20) does not support riscv64. It is a transitive dependency reaching the host through `wascap` -> `wasmcloud-core` -> `wasmcloud-host`, and through `async-nats` -> `wasmcloud-control-interface`, and through `rustls` -> `hyper-rustls` -> `reqwest`. The exact failure captured in PR #741's comments:
```
error: failed to run custom build command for `ring v0.16.20`
```
This was resolved once `ring` reached 0.17 (which added riscv64 support upstream) and once dependent crates (`async-nats` to 0.33, `bindle` to a git revision) were updated accordingly.

**Companion repo cross-compilation still present (but not wasmCloud/wasmCloud itself):** the `wasmCloud/wadge` repo (Go/Rust cgo bindings for Wasmtime, used in wasmCloud's test tooling) still cross-builds for `riscv64gc-unknown-linux-gnu` via plain `cargo build --target riscv64gc-unknown-linux-gnu` in its own CI (`.github/workflows/wadge.yml`), alongside `aarch64-linux-android`, `aarch64-unknown-linux-musl`, `x86_64-pc-windows-gnu`, `x86_64-unknown-linux-musl`. This is unrelated to and does not restore riscv64 support in the main host/wash repo.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gap: total.** riscv64 cannot currently be built from `main` by any documented path (no CI target, no Nix/nixify tooling, `install.sh` rejects the architecture outright). There is no partial-functionality state to describe - the platform is entirely unavailable, a regression from the working (if release-inconsistent) state that existed August 2024.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `wash` CLI runs | Yes | Yes | No (no binary available; unbuildable from documented tooling) |
| `wasmcloud-host` runs | Yes | Yes | No |
| Capability providers | Yes | Yes | No |
| Static (musl) build | Yes | Yes | Never existed (issue #1060 closed unimplemented) |
| Official install script support | Yes | Yes | No - explicit error path |

**Performance gap:** not independently measurable for wasmCloud itself (no published wasmCloud benchmark on riscv64 exists at all - see Section 11). At the dependency level, Wasmtime's riscv64 backend (Tier 3) lacks the Winch fast-baseline compiler entirely - only the optimizing Cranelift path runs on riscv64, meaning cold-start/compile latency would be structurally worse than on Tier 1/2 architectures (x86-64, arm64) even if a riscv64 build existed. Multiple open Cranelift riscv64 codegen gaps (suboptimal register allocation, unimplemented vector instructions, missing `*_overflow` lowering) compound this. See Section 9 and 11 for specifics.

**Security hardening gap:** the `ring`-to-`aws-lc-rs` TLS/crypto migration wasmCloud has made means the project's current crypto provider (`aws-lc-rs`) has an **open, unresolved gap for riscv64-musl** (pregenerated bindings missing - [aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874), open since 2025-09-08). Since wasmCloud never shipped a musl riscv64 build in the first place (#1060 unimplemented), this compounds rather than newly introduces a gap, but it does confirm that even if wasmCloud restored riscv64-gnu support, a statically-linked riscv64 build remains blocked upstream in a critical dependency.

**NaN/floating-point semantics:** not a wasmCloud-level concern (no floating-point-sensitive code in the wasmCloud repo itself); at the dependency level, Wasmtime/Cranelift has an open, unresolved item, bytecodealliance/wasmtime#7322, noting that Cranelift's NaN-canonicalization pass is redundant/wasted work on the riscv64 backend since RISC-V FP instructions already return canonical NaN per spec - a code-quality item, not a correctness bug.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in wasmCloud/wasmCloud, verified directly.** A full clone of `main` (HEAD `d5733f743b0c9b76d18354960077c62668226b43`, 2026-09-08) was checked:
- All 21 files in `.github/workflows/` were read: `audit.yml`, `bench-compare.yml`, `bench-host-checks.yml`, `bench.yml`, `charts.yml`, `codeql.yml`, `component-matrix.yml`, `docker-build-push.yml`, `examples.yml`, `lint-workflows.yml`, `proto.yml`, `release-tag.yml`, `release-train.yml`, `runtime-gateway.yml`, `runtime-operator.yml`, `scorecard.yml`, `templates.yml`, `test-install-scripts.yml`, `tools-bump.yml`, `wash.yml`, `wit.yml`. None contain the string "riscv".
- `grep -ri riscv` across the **entire working tree** (not just workflows), excluding `.git`, returned **zero matches, in any file**.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repository.
- GitHub's own code search (`riscv repo:wasmCloud/wasmCloud`) independently corroborates: **0 results**.

There is no RISE runner usage (no references to `riseproject-dev` or RISE runner labels anywhere in the workflow files, consistent with Section 12's finding of no RISE involvement).

**Comparison table**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-24.04` native runner) | Yes (`ubuntu-24.04-arm` native runner) | No |
| CI tests | Yes | Yes | No (nothing to test) |
| CI publishes release artifact | Yes | Yes | No |
| Runner type | Native GitHub-hosted | Native GitHub-hosted (`-arm` runner) | N/A |
| QEMU used | No (native) | No (native) | N/A - no job exists |

## 8. Distribution and Release Status

**No official riscv64 binaries exist today.** Direct verification against the three most recent releases (v2.6.1, v2.7.0, v2.8.0) shows an identical asset pattern with no riscv64 entry: `wash-aarch64-apple-darwin`, `wash-aarch64-unknown-linux-gnu`, `wash-aarch64-unknown-linux-musl`, `wash-s390x-unknown-linux-gnu`, `wash-x86_64-apple-darwin`, `wash-x86_64-pc-windows-msvc(.zip)`, `wash-x86_64-unknown-linux-gnu`, `wash-x86_64-unknown-linux-musl`, `wash.sigstore.json`, source archives.

**Historical riscv64 binary confirmed and then withdrawn:** `https://github.com/wasmCloud/wasmCloud/releases/download/v1.9.0/wasmcloud-riscv64gc-unknown-linux-gnu` returned HTTP 200 and downloaded a genuine 22,790,184-byte `ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI, dynamically linked` binary (verified by `file`). This asset exists only on v1.9.0, v1.9.1, v1.9.2 (all August 2024); every release from v1.9.3 through the current v2.8.0 returns 404 for that filename.

**PyPI:** `https://pypi.org/pypi/wasmcloud/json` returns **HTTP 404**. No PyPI package named `wasmcloud` exists on any architecture - consistent with wasmCloud being a Rust/Go project distributed via `wash`/cargo/OCI rather than PyPI.

**Ubuntu 26.04 (resolute):** `https://packages.ubuntu.com/search?keywords=wasmCloud&suite=resolute&searchon=names&section=all` explicitly states "Sorry, your search gave no results." No `wasmcloud` package exists in Ubuntu 26.04 for **any** architecture, confirmed independently via a project-graph SPARQL query (0 bindings) and direct search.

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/)): `wasmcloud` is not listed anywhere on the page.

**RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasmcloud/`): redirects to PyPI, which 404s. No package present.

**What a user must currently do to get a working binary:** there is no documented path. The riscv64 build tooling (Nix/nixify) that once produced a working binary has been removed from the repository, `install.sh` actively rejects the architecture, and no CI target exists to cross-compile from. A user would need to either (a) manually add back a `riscv64gc-unknown-linux-gnu` target to the Cargo build and resolve any accumulated dependency drift since November 2023, or (b) attempt to run the two-year-old v1.9.0-v1.9.2 binary, which will be significantly behind current wasmCloud functionality and unsupported.

## 9. Dependencies

Source: `wasmCloud/wasmCloud` root `Cargo.toml` (workspace deps; fetched via raw content, GitHub MCP API access to this repo was not available in-session). Cross-checked against `projects.yml` in this repository - none of wasmCloud, wasmtime, Cranelift, aws-lc-rs, ring, or async-nats are tracked there (out of scope); `tokio` and `serde` are tracked but have no dedicated report file; `OpenTelemetry` is tracked with its own report.

| Dependency | Role | riscv64 build | riscv64 test/maturity | riscv64 release | Community/blocking issues |
|---|---|---|---|---|---|
| **wasmtime** (`47.0.4`) + **Cranelift** | Core WASM component/module JIT execution engine | Not in Ubuntu 26.04 for any arch (crates.io/GH-releases distributed). Upstream builds for `riscv64gc-unknown-linux-gnu`. | **Tier 3**: "CI testing, full-time maintainer" requirement not fully met; explicitly not continuously fuzzed, "not production-ready" per Wasmtime's own tier definitions. **Winch (fast baseline compiler) has no riscv64 support** - only the optimizing Cranelift path runs. | Ships in normal crates.io/GH releases; no riscv64-specific release blocker beyond the Tier-3 caveat. | Multiple open Cranelift riscv64 bugs, see Section 11 |
| **aws-lc-rs** | TLS/crypto backend (rustls `aws_lc_rs` feature, also used by async-nats) | Not in Ubuntu 26.04 for any arch. `riscv64gc-unknown-linux-gnu` supported upstream since commit `b99c661` (closed [aws/aws-lc-rs#714](https://github.com/aws/aws-lc-rs/issues/714)). | gnu/dynamic variant builds; no dedicated riscv64 CI lane confirmed. | **musl variant NOT supported** - pregenerated bindings missing, requires cmake at build time - directly blocks statically-linked riscv64 wasmCloud binaries. | [aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874), open since 2025-09-08, unassigned, no PR |
| **ring** (historical crypto provider; still transitively present, project has since moved to aws-lc-rs) | Crypto backend; was the original riscv64 blocker | Found in Ubuntu 26.04 riscv64 (resolute) as `librust-ring-dev` | `riscv64gc-unknown-linux-gnu` works since ring 0.17. Newer `riscv64a23-unknown-linux-gnu` profile target not supported. | Fine for standard riscv64gc/gnu | [briansmith/ring#2745](https://github.com/briansmith/ring/issues/2745) (`riscv64a23` ABI-flag mismatch), closed "not planned" - shows newer RISC-V profiles are not prioritized |
| **rustls** | TLS implementation (NATS, OCI client, HTTP) | Not in Ubuntu 26.04 riscv64 - notably `librust-rustls-dev` exists for arm64 and amd64 in the same suite but is absent for riscv64: a distro packaging gap, not an upstream code issue | Pure-Rust, no riscv64 issues found upstream | Unaffected on crates.io | None open upstream |
| **sha2** (RustCrypto) | Hashing (artifact/content verification, OCI) | Found in Ubuntu 26.04 riscv64 as `librust-sha2-dev` | Correct but historically slower on RISC-V - no hand-tuned vector-crypto intrinsics path (RustCrypto/hashes#328, closed 2024) | No gating issue | None open |
| **flate2** (wraps miniz_oxide/libz-sys/zlib-ng) | gzip/deflate for OCI layer/artifact decompression | Found in Ubuntu 26.04 as `librust-flate2-dev`; transitive deps also present | No riscv64 issues found | No known problems | None |
| **async-nats** | Transport for wasmCloud's control plane/RPC | Not in Ubuntu 26.04 (crates.io only) | 0 riscv64-tagged issues on nats-io/nats.rs; pure-Rust | n/a (crates.io) | None found |
| **tokio** (tracked in projects.yml, no dedicated report) | Foundational async runtime | Found in Ubuntu 26.04 as `librust-tokio-dev` | Well-supported, no riscv64-specific problems | Fine | None |

**Deep-dive: Wasmtime/Cranelift (most critical dependency).** Wasmtime is the sole execution engine wasmCloud embeds. Its riscv64 backend is officially Tier 3 per [Wasmtime's stability tiers documentation](https://docs.wasmtime.dev/stability-tiers.html) - functional and covered by CI, but explicitly not continuously fuzzed and not asserted production-ready. Concretely: no Winch (fast baseline JIT) backend for riscv64 means cold-start compile latency is worse than Tier 1/2 architectures; a documented, open, unresolved out-of-bounds-write correctness issue ([bytecodealliance/wasmtime#7237](https://github.com/bytecodealliance/wasmtime/issues/7237)) reproduces specifically on JH7110 RISC-V hardware; and I-cache maintenance after JIT code writes is unimplemented on RISC-V ([bytecodealliance/wasmtime#5033](https://github.com/bytecodealliance/wasmtime/issues/5033), open since 2022), a memory/execution-coherence gap not present on the AArch64 backend, which has a fix. See Section 11 for the full bug list.

**Deep-dive: aws-lc-rs (crypto provider currently selected by wasmCloud).** wasmCloud's `Cargo.toml` selects `rustls` with the `aws_lc_rs` feature. The gnu/dynamic riscv64 build path works, but the musl/static riscv64 path is blocked by an open, unassigned upstream issue with no PR ([aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874)) - meaning even if wasmCloud restored its glibc riscv64 build, the statically-linked riscv64 build requested in issue #1060 would still be blocked by this dependency today, independent of wasmCloud's own engineering effort.

## 10. Ecosystem Status

Not applicable. wasmCloud is distributed as standalone binaries (`wash` CLI, `wasmcloud-host`) and Rust/Go/TypeScript SDKs consumed via cargo/go modules/npm, with capability providers distributed as OCI artifacts. There is no significant dependent package ecosystem (no PyPI package, no broad plugin/extension registry) whose members would each independently require riscv64 enablement in the way a language's package index does. This section is omitted per the report's scoping rule.

## 11. Known Bugs and Active Issues

**In wasmCloud/wasmCloud itself:** an `is:open` search for riscv64-related issues returns **zero results** - there are currently no open riscv64-tagged issues in the repository, only historical closed ones:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#724](https://github.com/wasmCloud/wasmCloud/issues/724) | [FEATURE] add RISCV64 build | Closed (completed) | N/A | Resolved by PR #741; original build was blocked on `ring` 0.16 lacking riscv64 support |
| [#853](https://github.com/wasmCloud/wasmCloud/issues/853) | [FEATURE] Add support for riscv64 to wash | Closed (completed) | N/A | Same `ring` blocker; no concrete business case, demonstrative motivation |
| [#1060](https://github.com/wasmCloud/wasmCloud/issues/1060) | [FEATURE] Add static (musl) RISCV64 build | Closed (auto-closed stale) | Medium (permanent functional gap) | **Never implemented** despite one manual reopen with a `pinned` label; no engineering discussion beyond the stale bot |

**Upstream (Wasmtime/Cranelift), since wasmCloud's riscv64 correctness/performance is entirely inherited from its JIT engine:**

*Correctness bugs, open:*

| ID | Title | Notes |
|---|---|---|
| [bytecodealliance/wasmtime#7237](https://github.com/bytecodealliance/wasmtime/issues/7237) | Partially out-of-bounds writes on ARM and riscv | An unaligned store crossing a page boundary can mutate the in-bounds portion before trapping, violating Wasm spec atomicity. Reproduced on JH7110 RISC-V hardware. Open since 2023-10-13. |
| [bytecodealliance/wasmtime#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) | Cranelift: bus error with unaligned atomics on RISC-V backend | Unaligned atomic RMW crashes with SIGBUS; lowering doesn't check Zam extension/alignment flags. Open since 2023-02-25. |
| [bytecodealliance/wasmtime#5033](https://github.com/bytecodealliance/wasmtime/issues/5033) | Perform I-Cache Maintenance on RISC-V | No I-cache maintenance after JIT code writes; RISC-V ISA does not guarantee I/D cache coherence. AArch64 has a fix; RISC-V does not. Open since 2022-10-07. |
| [bytecodealliance/wasmtime#4994](https://github.com/bytecodealliance/wasmtime/issues/4994) | Riscv float abi variant handling | ABI-level float-argument handling gap. Open. |
| [bytecodealliance/wasmtime#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) | riscv64: vxrm and vxsat registers not preserved/handled | Vector rounding/saturation state not preserved. Open. |
| [bytecodealliance/wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [#11183](https://github.com/bytecodealliance/wasmtime/issues/11183), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) | Assorted Cranelift ISLE panics/crashes/compile failures specific to riscv64 | All open |

*Performance gaps, open (none carry quantified "N% slower" figures - described qualitatively as unimplemented paths, redundant instructions, or missing hardware-assist usage):*

| ID | Title |
|---|---|
| [bytecodealliance/wasmtime#7147](https://github.com/bytecodealliance/wasmtime/issues/7147) | riscv64: Suboptimal register allocation for short functions |
| [bytecodealliance/wasmtime#7186](https://github.com/bytecodealliance/wasmtime/issues/7186), [#6600](https://github.com/bytecodealliance/wasmtime/issues/6600), [#6623](https://github.com/bytecodealliance/wasmtime/issues/6623), [#6826](https://github.com/bytecodealliance/wasmtime/issues/6826), [#6571](https://github.com/bytecodealliance/wasmtime/issues/6571), [#7188](https://github.com/bytecodealliance/wasmtime/issues/7188), [#7190](https://github.com/bytecodealliance/wasmtime/issues/7190), [#7191](https://github.com/bytecodealliance/wasmtime/issues/7191) | Backlog of unimplemented/unoptimized riscv64 SIMD/vector codegen (vector instructions, ExtAddPairwise, SIMD icmp, splat/vconst matchers, mask/const rules, vslideup, clobber save/restore, linker relaxation) |
| [bytecodealliance/wasmtime#9186](https://github.com/bytecodealliance/wasmtime/issues/9186) | `*_overflow` instructions unimplemented on s390x and riscv64 (forces slower fallback lowering) |
| [bytecodealliance/wasmtime#10281](https://github.com/bytecodealliance/wasmtime/issues/10281) | Cranelift RISC-V frame-pointer position differs from LLVM (ABI/interop friction) |

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer expressed opposition to riscv64 support in principle; matsbror's own issue (#853) noted the request had no concrete business case, only a demonstrative goal, which is the closest thing to a stated reservation on record - and even that did not block the work from being accepted and merged.

**Technical blockers:**
- **Resolved historically:** the `ring` crate lacking riscv64 support (v0.16.20) blocked both #724 and #853 for roughly six weeks until `ring` 0.17 landed upstream and dependent crates were updated.
- **Currently active, unaddressed:** no CI target and no cross-compilation tooling exist in the current repository to rebuild a riscv64 binary at all - this is now an infrastructure gap rather than a code-level blocker.
- **Currently active, upstream (not wasmCloud's to fix):** aws-lc-rs's riscv64-musl gap ([aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874), open) would block a statically-linked riscv64 build even if wasmCloud restored its glibc target.

**Organizational blockers:** none explicit, but the practical pattern observed (a feature accepted and merged quickly at the build-target level, followed by the follow-on static-build request going stale for 13 months and then a later silent removal of the entire riscv64 build path during an infrastructure migration) indicates riscv64 has no dedicated, ongoing maintenance owner within the project. No corporate maintainer's organization (Cosmonic, Capital One, Adobe, Synadia, etc.) has publicly stated a riscv64 roadmap commitment.

**Acceptance probability for restoring support:** likely favorable if a contributor does the work - the project's historical pattern shows quick acceptance of well-formed architecture-support PRs (#741 merged with two approvals and no substantive pushback). The primary obstacle is not opposition but the absence of anyone currently doing or requesting the work; issue #1060's fate (silent, low-engagement stale-closure) is the operative precedent for what happens to riscv64 asks that lack a dedicated engineer following through.

## 13. Readiness Assessment

- **Color:** orange (default - no upstream CI, no distribution package)
- **Release provider:** none (no channel - upstream, RISE, any distro, or third-party - currently publishes a riscv64 wasmCloud artifact)
- **Justification:** Current `main` (HEAD `d5733f7`, verified 2026-09-08) contains zero riscv64 references anywhere in the repository - no CI workflow among the 21 files in [`.github/workflows/`](https://github.com/wasmCloud/wasmCloud/tree/main/.github/workflows) builds or tests riscv64, [`install.sh`](https://github.com/wasmCloud/wasmCloud/blob/main/install.sh) explicitly rejects the architecture via its case statement, and the Nix/nixify cross-compilation system that once produced a riscv64 build has been removed from the tree entirely. No distribution (Ubuntu 26.04, Arch RISC-V, PyPI) ships a `wasmcloud` package for any architecture, so the distribution floor does not apply either. This is a regression: [PR #741](https://github.com/wasmCloud/wasmCloud/pull/741) (merged 2023-11-20) did add riscv64gc-unknown-linux-gnu build/release support, and it shipped in releases v1.9.0-v1.9.2 (August 2024), but no release since (through the current latest, v2.8.0) carries a riscv64 asset.
- **Pending work that could change the grade:** none identified. Issue [#1060](https://github.com/wasmCloud/wasmCloud/issues/1060) (static/musl riscv64 build) is closed-stale and unimplemented; no open PRs or issues currently address riscv64 restoration; and no RISE Project involvement exists beyond a single unassessed line-item for wasmCloud in RISE's internal project-tracking queue (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`), which is not evidence of active or funded work. Restoring blue/green would require upstream to re-add a riscv64 CI/build target and resume shipping a release asset; this is a comparatively small effort since wasmCloud's own codebase has no architecture-specific code and the historical `ring`-crate blocker is long resolved - the work is almost entirely CI/build-infrastructure re-plumbing plus, for a static build specifically, waiting on the unresolved upstream [aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874) riscv64-musl gap.

## 14. Investment Analysis

RISE has not funded or performed any work on wasmCloud (Section 12 confirms no RISE blog posts, no RISE-owned repo, no RISE runner usage, and no funded work - only an unassessed queue entry). All sizing below assumes work starts from zero.

### 14.1 Functional Enablement

Re-adding a `riscv64gc-unknown-linux-gnu` CI build target to `.github/workflows/wash.yml` (following the same pattern already used for the existing aarch64/s390x cross-compile targets), verifying the codebase still builds cleanly against current dependency versions (the original `ring` blocker is long resolved, but roughly two years of dependency drift since the riscv64 path was last exercised needs re-validation), and adding riscv64 recognition to `install.sh`'s architecture case statement. This restores parity with the August 2024 state, not new work from scratch.

### 14.2 Performance Optimization

Not wasmCloud-specific work - wasmCloud contains no architecture-specific code to optimize. Any performance gap is inherited from Wasmtime/Cranelift's Tier 3 riscv64 backend (missing Winch fast-baseline compiler, several open codegen-quality issues per Section 11). Improving this is upstream Wasmtime/Cranelift work, outside wasmCloud's own repository, and would benefit every Wasmtime consumer, not wasmCloud specifically.

### 14.3 CI/CD Infrastructure

Add a native or emulated riscv64 runner to the build matrix (the existing amd64/arm64 matrix in `docker-build-push.yml` and `wash.yml` provides the template to extend); wire riscv64 into the release-asset publishing step so `v2.9.0`+ resumes shipping a riscv64 `wash`/host binary. A static (musl) riscv64 target remains blocked on upstream `aws-lc-rs` ([aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874)) regardless of wasmCloud-side CI work.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 established wasmCloud has no significant dependent package ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Restore riscv64gc-unknown-linux-gnu build target in CI; validate build against current dependency tree; re-add install.sh recognition | 1-2 | wasmCloud (Cosmonic/community) | High |
| CI/CD | Wire riscv64 into release-asset publishing (`wash.yml`, `release-train.yml`) so future tagged releases carry a riscv64 binary | 1 | wasmCloud (Cosmonic/community) | High |
| Functional (static/musl) | Statically-linked riscv64 build | Blocked - not sizeable until [aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874) resolves upstream | aws-lc-rs upstream (external dependency) | Low (blocked) |
| Performance | Close Wasmtime/Cranelift riscv64 codegen gaps (Winch backend, register allocation, vector codegen) | Not wasmCloud-specific; large, ongoing upstream Wasmtime effort, out of scope for wasmCloud investment | bytecodealliance/wasmtime upstream | Low (out of scope) |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [wasmCloud/wasmCloud repository](https://github.com/wasmCloud/wasmCloud)
- [wasmCloud homepage](https://wasmcloud.com/)
- [Issue #724 - add RISCV64 build](https://github.com/wasmCloud/wasmCloud/issues/724)
- [Issue #853 - Add support for riscv64 to wash](https://github.com/wasmCloud/wasmCloud/issues/853)
- [Issue #1060 - Add static (musl) RISCV64 build](https://github.com/wasmCloud/wasmCloud/issues/1060)
- [PR #741 - build: add riscv64gc-unknown-linux-gnu build](https://github.com/wasmCloud/wasmCloud/pull/741)
- [PR #935 - build(nix): update dependencies](https://github.com/wasmCloud/wasmCloud/pull/935)
- [wasmCloud .github/workflows/wash.yml](https://github.com/wasmCloud/wasmCloud/blob/main/.github/workflows/wash.yml)
- [wasmCloud .github/workflows/docker-build-push.yml](https://github.com/wasmCloud/wasmCloud/blob/main/.github/workflows/docker-build-push.yml)
- [wasmCloud install.sh](https://github.com/wasmCloud/wasmCloud/blob/main/install.sh)
- [wasmCloud releases](https://github.com/wasmCloud/wasmCloud/releases)
- [v1.9.0 release riscv64 asset (verified download)](https://github.com/wasmCloud/wasmCloud/releases/download/v1.9.0/wasmcloud-riscv64gc-unknown-linux-gnu)
- [wasmCloud GOVERNANCE.md](https://github.com/wasmCloud/wasmCloud/blob/main/GOVERNANCE.md)
- [wasmCloud MAINTAINERS.md](https://github.com/wasmCloud/wasmCloud/blob/main/MAINTAINERS.md)
- [wasmCloud CONTRIBUTION_LADDER.md](https://github.com/wasmCloud/wasmCloud/blob/main/CONTRIBUTION_LADDER.md)
- [wasmCloud bench README](https://github.com/wasmCloud/wasmCloud/blob/main/scripts/bench/README.md)
- [Introducing the wasmCloud benchmark chart (2025-02-18)](https://wasmcloud.com/blog/2025-02-18-introducing-the-wasmcloud-benchmark-chart/)
- [Wasmtime stability tiers documentation](https://docs.wasmtime.dev/stability-tiers.html)
- [bytecodealliance/wasmtime#7237 - Partially out-of-bounds writes on ARM and riscv](https://github.com/bytecodealliance/wasmtime/issues/7237)
- [bytecodealliance/wasmtime#5882 - bus error with unaligned atomics on RISC-V backend](https://github.com/bytecodealliance/wasmtime/issues/5882)
- [bytecodealliance/wasmtime#5033 - Perform I-Cache Maintenance on RISC-V](https://github.com/bytecodealliance/wasmtime/issues/5033)
- [bytecodealliance/wasmtime#7322 - Disable NaN Canonicalization for RISC-V](https://github.com/bytecodealliance/wasmtime/issues/7322)
- [bytecodealliance/wasmtime#4994 - Riscv float abi variant handling](https://github.com/bytecodealliance/wasmtime/issues/4994)
- [bytecodealliance/wasmtime#13078 - vxrm and vxsat registers not preserved](https://github.com/bytecodealliance/wasmtime/issues/13078)
- [bytecodealliance/wasmtime#7147 - Suboptimal register allocation for short function](https://github.com/bytecodealliance/wasmtime/issues/7147)
- [bytecodealliance/wasmtime#9186 - overflow instructions unimplemented on s390x and riscv64](https://github.com/bytecodealliance/wasmtime/issues/9186)
- [aws/aws-lc-rs#874 - Pregenerated bindings for riscv64gc-unknown-linux-musl](https://github.com/aws/aws-lc-rs/issues/874)
- [aws/aws-lc-rs#714 - riscv64gc-unknown-linux-gnu support (closed)](https://github.com/aws/aws-lc-rs/issues/714)
- [briansmith/ring#2745 - riscv64a23 ABI-flag mismatch (closed, not planned)](https://github.com/briansmith/ring/issues/2745)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Ubuntu packages.ubuntu.com search for wasmCloud (resolute)](https://packages.ubuntu.com/search?keywords=wasmCloud&suite=resolute&searchon=names&section=all)
- [PyPI wasmcloud package (404)](https://pypi.org/pypi/wasmcloud/json)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
- [wasmCloud/wadge riscv64 cross-build workflow](https://github.com/wasmCloud/wadge/blob/main/.github/workflows/wadge.yml)
