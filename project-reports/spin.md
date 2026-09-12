---
title: Spin
parent: Project Reports
color: red
dependencies:
  - name: ring
    relation: runtime-dependency
    criticality: critical
  - name: Wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
---

# Spin

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Spin<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="spin" %}

## 1. Project Overview

Spin (`spinframework/spin`) is a Rust/Cargo command-line tool and runtime for building and running event-driven WebAssembly (Wasm) microservices and applications. It embeds [Wasmtime](https://github.com/bytecodealliance/wasmtime) (with Cranelift as the code generator) as its execution engine rather than implementing its own JIT or SIMD codegen.

Spin is a **CNCF Sandbox project**; the [project homepage](https://www.spinframework.dev/) states it is "an open source Cloud Native Computing Foundation sandbox project," with its community Slack hosted on the CNCF workspace. Website policy pages point to lfprojects.org (Linux Foundation project umbrella). License: Apache 2.0 (`/LICENSE`).

**Governance:** three-tier role ladder (Contributor -> Maintainer -> Core Maintainer), defined per-repo in `MAINTAINERS.md`. Core Maintainers of `spinframework/spin` double as an interim "Spin Governance Committee" pending formation of a 5-7 person multi-stakeholder Steering Committee (not yet bootstrapped). Decisions default to objection-free consensus, escalating to a two-thirds supermajority vote if needed. All substantial scope changes require a Spin Improvement Proposal (SIP; 25 filed to date, governance itself codified as SIP-019). No SIP addresses RISC-V or platform/architecture support.

**Corporate sponsors:** Spin was created by **Fermyon Technologies** (founder/CTO Radu Matei is a Core Maintainer); most Core Maintainers are Fermyon alumni. Fermyon was acquired by / folded into **Akamai**, now the largest single corporate presence among maintainers (Michelle Dhanani, Caleb Schoepp, Kate Goldenring, Zhiwei Liang). **Microsoft** is the other notable corporate maintainer (Ivan Towlson, Core Maintainer). Alex Crichton and Ryan Levick (Bytecode Alliance / rust-lang orgs) are also Core Maintainers, reflecting the tight coupling to the Wasmtime project.

**RISE Project involvement:** none found. Spin/Fermyon/Akamai do not appear on the [RISE members list](https://riseproject.dev/members/) (8 Premier + 12 General members, company-based membership), no RISE blog post references Spin among 34 posts checked, and no repo in the `riseproject-dev` GitHub org relates to Spin or WebAssembly.

**Community stance on new ports:** governance requires new-scope work to go through the SIP + Core-Maintainer-consensus process. No SIP has been filed for RISC-V. The one open RISC-V build-failure issue (#1681, see Section 2) has never been escalated to a SIP or actively worked, indicating RISC-V is not currently a maintainer/governance priority.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-08-06 | Issue #1681 opened: build fails on RISC-V because the `ring` crate's build script panics | [spinframework/spin#1681](https://github.com/spinframework/spin/issues/1681) |
| 2024-03-23 | PR #2392 opened by @endocrimes: attempt to move Spin's TLS stack off `ring`-based types, explicitly framed as unbreaking the RISC-V build | [spinframework/spin#2392](https://github.com/spinframework/spin/pull/2392) |
| 2024-04-07 | Last commit on PR #2392 (`1d72a06`); work stopped, author still checking a `with_safe_defaults()` replacement | [spinframework/spin#2392](https://github.com/spinframework/spin/pull/2392) |
| 2024-05-14 | PR #2508 merged: dynamic pooling-allocator fallback for hosts with 39-bit virtual-address space (aarch64 and riscv64 named as examples); origin is an ARM64 crash report, not riscv64-targeted | [spinframework/spin#2508](https://github.com/spinframework/spin/pull/2508) |
| 2024-06-20 | v2.6.0 tagged - first release containing PR #2508 (verified via `git tag --contains`) | [spinframework/spin releases](https://github.com/spinframework/spin/releases) |
| 2026-06-09 | PR #2392 auto-labeled `stale` | [spinframework/spin#2392](https://github.com/spinframework/spin/pull/2392) |
| 2026-07-06 | PR #2392 closed by @itowlson citing "dormancy and conflicts," never merged | [spinframework/spin#2392](https://github.com/spinframework/spin/pull/2392) |
| (ongoing) | Issue #1681 remains open, unresolved, no successor fix PR opened | [spinframework/spin#1681](https://github.com/spinframework/spin/issues/1681) |

**Key contributors:** @afro-coder (issue reporter, non-maintainer, self-described Rust newcomer); @endocrimes (attempted fix author, contributor); @itowlson (Microsoft, Core Maintainer, closed the stale fix); @alexcrichton (Bytecode Alliance, Core Maintainer, author of the tangential #2508).

**Is it fully upstream?** No. There is no merged RISC-V-enabling change of any kind. The one PR that directly targeted the build blocker (#2392) was closed unmerged. The Spin plugin `Architecture` enum (`crates/plugins/src/manifest.rs`) still has no `Riscv64` variant, so no code path in Spin's own source tree is even structurally aware of riscv64.

## 3. Upstream Support Tier

No formal tier policy document exists: no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file in the repository. Support is defined implicitly by the release CI build matrix.

| | amd64 | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-22.04`, native) | Yes (`ubuntu-22.04`, `--target aarch64-unknown-linux-gnu`) | No |
| CI tests | Yes | Yes | No (no CI job exists) |
| Official release binaries | Yes (gnu + musl static) | Yes (gnu + musl static) | No |
| macOS/Windows equivalents | macOS Intel, Windows amd64 | macOS Apple Silicon | N/A |

Source: [`.github/workflows/build.yml` and `release.yml`](https://github.com/spinframework/spin/tree/main/.github/workflows), read in full (13 workflow files, 1384 lines); platform matrices list only `ubuntu-22.04` (amd64), `ubuntu-22.04, target: aarch64-unknown-linux-gnu`, `macos-15-intel`, `macos-14`, `windows-latest`, plus a musl matrix of `aarch64-unknown-linux-musl` and `x86_64-unknown-linux-musl`. No riscv64 entry anywhere.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Spin itself contains no JIT, SIMD, or cryptographic assembly code - all of that is delegated to embedded dependencies (primarily Wasmtime/Cranelift). Spin's own architecture-awareness is limited to (a) an enum used to select the correct plugin binary to download/install, and (b) a doc comment explaining a runtime probe.

**The plugin `Architecture` enum** (`crates/plugins/src/manifest.rs:133-152`) is the one place Spin's own code enumerates supported CPU architectures for plugin binaries:
```rust
pub(crate) enum Architecture {
    Amd64,
    Aarch64,
    Arm,
}
```
There is no `Riscv64` variant. A plugin cannot declare riscv64 support today without a code change to this enum plus its serde mapping and schema.

**The only repo-wide mention of "riscv"** is a doc comment in `crates/core/src/lib.rs:205`, attached to `use_pooling_allocator_by_default()`:
> "Not all systems support the same amount of virtual memory, for example some aarch64 and riscv64 configuration only support 39 bits of virtual address space."

This is prose context for PR #2508's dynamic virtual-address-space probe; the function itself contains no `target_arch` branching and is architecture-generic (it probes available VA bits at runtime rather than switching on architecture).

`grep -rn "target_arch"` across the repository returns exactly one hit, an x86_64-only test gate (`tests/integration.rs:903`), unrelated to riscv64. No `#[cfg(target_arch = "riscv64")]` or equivalent block exists anywhere.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Plugin architecture enum entry | Yes (`Amd64`) | Yes (`Aarch64`) | No entry exists |
| JIT/codegen | Delegated to Wasmtime/Cranelift | Delegated to Wasmtime/Cranelift | Delegated to Wasmtime/Cranelift (Tier 3 there; see Section 9) |
| Arch-specific files in Spin's own tree | 4 files (toolchain-string parsing, installer guard, plugin enum, test fixture) | 4 files (same categories) | 1 file (doc comment only, no logic) |
| SIMD/assembly in Spin itself | None (Spin has no SIMD/assembly of its own) | None | None |

**Conclusion:** riscv64 is not a stub or partial implementation in Spin - it is structurally absent. There is no enum variant, no conditional-compilation path, no test coverage, and no build target for it in the codebase.

## 5. Build System, Cross-Compilation, and Toolchain

Spin is a pure Rust/Cargo project. Confirmed absent from the repository: `CMakeLists.txt` (any location), `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`. The build is driven by `Cargo.toml`/`Cargo.lock`/`build.rs`, with a `Makefile` wrapping standard `cargo build`/`cargo test` commands.

**Cross-compilation tooling:** `Cross.toml` defines only `aarch64-unknown-linux-musl` (via `./cross/Dockerfile`, which likewise only targets that one architecture). No `Dockerfile.riscv64` or equivalent exists.

**Documented, confirmed build failure on riscv64:**
```
error: failed to run custom build command for `ring v0.16.20`
thread 'main' panicked at 'called `Option::unwrap()` on a `None` value'
```
Panic occurs at line 358 of `ring`'s `build.rs`, in `build_c_code`, exit status 101. Reported in [issue #1681](https://github.com/spinframework/spin/issues/1681), citing upstream [`briansmith/ring#1620`](https://github.com/briansmith/ring) (describes the incompatibility) and `ring#1436` (a proposed patch). The reporter states `ring` appeared "a bit abandoned" on RISC-V at the time.

There is no confirmed successful riscv64 build of Spin against the version of `ring` Spin currently depends on. Separately, dependency research on the upstream `ring` project found [issue briansmith/ring#2745](https://github.com/briansmith/ring) (closed Jan 2026) stating `riscv64gc-unknown-linux-gnu` "does indeed work" on a later `ring` version - but this is a claim about `ring` in isolation, not a confirmation that Spin's own build (pinned to `ring` 0.17.14 per its `Cargo.lock`) succeeds; Spin's own issue #1681 remains open with no comment confirming resolution. This is flagged as a discrepancy: **[NEEDS VERIFICATION]** whether Spin would build cleanly today if someone re-attempted it against current `ring`.

No QEMU usage exists anywhere in the repository for any purpose (`grep -ri qemu` across the whole tree: zero hits).

**Bottom line:** there are no exact cmake/configure commands, toolchain minimums, or `-DUSE_X=OFF`-style flags to report for riscv64 because none exist - Spin does not currently support building for riscv64 out of the box.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds from source | Yes | Yes | **No** (blocked by `ring` build script panic, #1681) |
| Runs `spin up` | Yes | Yes | Not applicable (does not build) |
| Plugin installation | Yes | Yes | Not applicable (no `Architecture` enum entry) |
| Official binary | Yes | Yes | No |
| Wasmtime pooling allocator | Full 48-bit VA space, always on by default | 39-bit VA space, dynamic fallback (PR #2508) | 39-bit VA space; would inherit PR #2508's dynamic fallback logic once/if the build issue is resolved (theoretical - never exercised, since the project does not build) |

**Functional gap:** total. Nothing beyond the build blocker can be assessed, since the toolchain does not produce a binary.

**Performance gap:** not assessable - no riscv64 binary has ever existed to benchmark. No published benchmark data for Spin on riscv64 was found in any source checked (RISE blog, academic papers including "A Cross-Architecture Evaluation of WebAssembly in the Cloud-Edge Continuum," "WebAssembly and Unikernels: A Comparative Study for Serverless at the Edge" [arXiv 2509.09400](https://arxiv.org/abs/2509.09400), "Lumos: Performance Characterization of WebAssembly" [arXiv 2510.05118](https://arxiv.org/abs/2510.05118), or general web search). This gap is stated explicitly rather than estimated.

**Security hardening gaps:** not independently assessable for Spin itself given the build failure. Transitively relevant: Spin's vendored-OpenSSL release path (`openssl` crate with `openssl/vendored`, used for Linux release binaries) has a documented, open riscv64 security gap elsewhere in the dependency research - the AES T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned extensions (open fix PRs #31080/#31082 unmerged in OpenSSL upstream) - but this is moot for Spin today since Spin does not build on riscv64 at all.

**NaN / floating-point semantics:** no riscv64-specific floating-point or NaN-canonicalization issues found in the Spin issue tracker (three separate search queries - "riscv64 performance," "riscv64 bug," "riscv nan floating" - converged on the single #1681 build-failure issue with no distinct FP-correctness reports).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by reading the full text of all 13 files in `.github/workflows/` (`audits.yml`, `build.yml`, `bump-wasmtime.yml`, `check-tags.yml`, `code-coverage.yml`, `deploy-website.yml`, `dispatch.yml`, `publish-env-def.yml`, `publish-wit.yml`, `release.yml`, `rust-sdk-release.yml`, `wasmtime-backport.yml`, `wasmtime-update.yml`) - zero matches for `riscv`/`riscv64`/`risc-v` in any casing. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository root (all three lookups returned "no such file").

No RISE RISC-V Runner usage was found (no reference to `riseproject-dev` or RISE runner labels in any workflow file), consistent with Spin having no relationship to the RISE Project (Section 1).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes | **No** |
| Test suite executed | Yes | Yes | N/A |
| Release-blocking | Yes | Yes | N/A |
| Runner type | GitHub-hosted (`ubuntu-22.04`) | GitHub-hosted, cross-compiled | N/A |

Source: [`.github/workflows/`](https://github.com/spinframework/spin/tree/main/.github/workflows), read directly at commit `b870e46ec6df7788e7a22fda21905139e1dcc7cc`.

## 8. Distribution and Release Status

**No official riscv64 binaries exist.** Verified directly against [GitHub Releases](https://github.com/spinframework/spin/releases) for v4.0.0 through v4.1.0 (latest as of research date): asset lists contain only `linux-aarch64`, `linux-amd64`, `macos-aarch64`, `macos-amd64`, `static-linux-aarch64`, `static-linux-amd64`, `windows-amd64`, checksums, and source archives. Zero riscv64 assets in any release checked.

**No package-manager distribution:**
- PyPI: the package named `spin` on PyPI is an unrelated project ("Scientific Python INcantations," a Meson/build-tool wrapper), not Fermyon Spin. Irrelevant regardless of architecture. Confirmed via [PyPI JSON API](https://pypi.org/pypi/spin/json).
- Ubuntu 26.04 (resolute): the package named `spin` that does list riscv64 in its architecture set is the **SPIN model checker** (spinroot.com, formal software verification tool, Debian-maintained), a completely different, same-named project - not spinframework/spin. Confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/spin), version `6.5.2+dfsg-2build1`.
- Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/)): no `spin` package of any kind found.
- No npm, Maven, or OCI-registry riscv64 artifact search applies - Spin is distributed as a standalone Rust CLI binary/plugin ecosystem, not through those channels.

**What a user must do to get a working binary today:** there is currently no path to a working riscv64 Spin binary short of (1) resolving the `ring` crate build blocker from issue #1681 (either by patching `ring`, or completing the abandoned rustls-migration work from PR #2392), (2) adding a `riscv64gc-unknown-linux-gnu` (or `-musl`) target to `Cross.toml` and the CI build/release matrices, and (3) building from source - none of which any party (upstream, RISE, or a distro) has done.

## 9. Dependencies

Method: `Cargo.toml`/`Cargo.lock` read directly from a fresh clone (commit `b870e46`, workspace version `4.2.0-pre0`). Spin is pure Rust; there is no CMakeLists.txt/setup.py/go.mod.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **ring** (0.17.14, via `rustls`) | Build-dependency, critical - default crypto backend for Spin's TLS stack | **Confirmed broken for Spin's build** - the build-blocking failure in issue #1681; upstream `briansmith/ring#2745` (closed Jan 2026) states `riscv64gc-unknown-linux-gnu` "does indeed work" on a later ring version, but this is unconfirmed against Spin's own pinned version/build | Not reached (build fails first) | Published normally to crates.io (source only) | No dedicated riscv64 assembly path even where it builds - runs the portable/generic C fallback (performance-only gap on top of the build blocker) |
| **Wasmtime** (48.0.0, + in-tree Cranelift) | Runtime-dependency, critical - the JIT/AOT WASM execution engine Spin embeds | Green - Cranelift's riscv64 backend is Tier 3 upstream but functionally complete (~22,300 lines), covering all WASM proposals except stack-switching (a universal gap, not riscv64-specific) | CI runs the full suite under QEMU (synthetic RV64GCV), gated to merge-queue/release branches rather than every PR | Official `riscv64gc-linux` tarball published on every Wasmtime GitHub Release | 8 open correctness bugs tracked (e.g. unaligned-atomic bus error, partial OOB writes, an ISLE crash); no continuous fuzzing on riscv64; the Winch baseline JIT has zero riscv64 code. See the dedicated Wasmtime status report for detail. |
| **Rust** (rustc/cargo toolchain) | Build-dependency, critical - Spin is 100% Rust | Green - `riscv64gc-unknown-linux-gnu` is a supported Rust target upstream | Green upstream | Green - official `rustc`/`cargo` riscv64 releases exist | Not itself a Spin-specific blocker; the toolchain builds fine on riscv64, the failure is in the `ring` crate's build script, not in rustc/cargo |
| candle-core / candle-nn / candle-transformers (0.8.4) | Indirect - local LLM inference numerics, pulled in by the `llm` feature which is part of Spin's **default** feature set | Unclear/unverified - upstream issue [huggingface/candle#1746](https://github.com/huggingface/candle) ("Does it support to be compiled and run on risc-v?") opened Feb 2024, closed with no documented resolution in-thread | No riscv64 CI found | No riscv64 wheels/binaries; source-only via crates.io | Under-researched risk; ships in every ordinary `spin` binary by default via the `llm` feature |
| gemm (0.17.1 / 0.18.2) + pulp (0.18/0.21 SIMD abstraction) | Indirect - matrix-multiply kernel underneath candle | Likely builds via generic scalar fallback; `pulp` provides hand-tuned x86_64/AVX and aarch64/NEON kernels plus a portable `Scalar` fallback for everything else. No riscv64-tagged issues found in the `gemm` repository | Not confirmed | Not confirmed (crates.io source only) | No riscv64 SIMD kernel exists - a performance gap, not a known build blocker |
| rustls (0.23) | Indirect - TLS implementation wrapping `ring` | Green - pure Rust, no arch-specific code; zero riscv64 issues found in the `rustls/rustls` repository | Inherits `ring`'s risk profile | Published normally | Not itself a blocker; risk is entirely inherited from `ring` |
| openssl (0.10, vendored via `openssl/vendored`, Linux release builds only) | Indirect - vendors and compiles its own OpenSSL for Linux release binaries (not a system-libssl link) | Builds, but with a **critical security gap**: AES T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned (majority of deployed silicon); open fix PRs #31080/#31082 unmerged upstream | QEMU-only CI upstream, `fips: no` on all riscv64 rows; an upstream issue reports SSL tests hanging at high parallelism on real riscv64 hardware | No prebuilt binaries upstream (source-only); distro-packaged elsewhere | See the dedicated OpenSSL status report for detail |
| sha2 (0.10, RustCrypto) | Indirect - content-addressing/cache hashing | Green - pure-Rust generic fallback compiles everywhere; no riscv64 assembly-accelerated path exists (only x86/aarch64 intrinsics) | Portable, no known riscv64 issues | Published normally | Performance-only gap (runs unaccelerated) |
| rusqlite (0.34) + libsqlite3-sys (0.32, `bundled`) | Indirect - default key-value store backend, compiles the SQLite amalgamation C source directly | Green - SQLite is pure portable C, no SIMD/JIT/asm; no riscv64-specific issues found in `rusqlite/rusqlite` | No riscv64-specific test gaps known | Bundled/compiled-from-source - no distro dependency | None found |
| flate2 (1.1.9) + miniz_oxide (0.8.9) | Indirect - compression for OCI image layers, plugin archives, templates | Green - Spin's `Cargo.lock` confirms the pure-Rust `miniz_oxide` backend is used, not system zlib or `zlib-rs` - no C toolchain/assembly dependency | No riscv64-specific issues expected (pure Rust) | Published normally | Sidesteps the C `zlib` project's stalled riscv64 CRC-32/Adler-32 performance gap entirely |
| redis (0.32.5, pure-Rust client) | Indirect - optional outbound-redis / key-value-redis / trigger-redis backends | Not deep-dived; pure Rust client, no arch-specific code expected | - | - | Out of scope of the JIT/SIMD/crypto/compression filter applied |
| wasm-encoder / wasmparser / wit-parser / wit-component / wac-graph / wac-types (bytecodealliance/wa-org tooling) | Indirect - component-model tooling used by `spin-componentize`/`spin-build` | Pure Rust, host-side build tooling; not deep-dived | - | - | Part of the WASM toolchain critical path but out of scope of the JIT/SIMD/crypto/compression filter applied |

**Key finding:** the critical-path blocker is `ring` (via `rustls`), confirmed via Spin's own open issue #1681, and it is a build-time failure - it precedes any question of runtime correctness or performance for the rest of the dependency graph. Wasmtime, by contrast, is comparatively mature on riscv64 (Tier 3, CI-tested, releases published) and is not the limiting factor for Spin today.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1681](https://github.com/spinframework/spin/issues/1681) | Build fails on Risc-v due to Ring | Open (since 2023-08-06) | **Critical - build-blocking** | `ring` 0.16.20's build script panics (`Option::unwrap()` on `None`) on riscv64; no maintainer fix landed; no comments beyond the issue body found on two independent fetches |
| [#2392](https://github.com/spinframework/spin/pull/2392) | tls: Update dependencies and fixes for removed types | Closed, not merged (stale) | High (was the only active fix attempt) | Explicitly aimed at unbreaking the riscv64 build by moving off `ring`-based rustls types; abandoned mid-implementation (unresolved `with_safe_defaults()` question), auto-closed stale 2026-07-06 after ~16 months dormant |
| [#2508](https://github.com/spinframework/spin/pull/2508) | Dynamically detect support for Wasmtime's pooling allocator | Merged (2024-05-14, in v2.6.0) | Not riscv64-specific | Fixes an ARM64 allocator crash; riscv64 is namechecked only as sharing the same 39-bit VA-space characteristic; does not touch the `ring`/TLS build failure |

**Correctness bugs:** none riscv64-specific were found beyond the build blocker itself - no open issue reports a riscv64 runtime crash, NaN/floating-point defect, or data-correctness bug, because the project has never successfully built on the architecture to generate such reports.

## 12. Objections and Upstream Blockers

**Technical blocker:** the `ring` crate's build script has no riscv64 support in the version Spin currently resolves to in its dependency tree (issue #1681, filed against `ring` 0.16.20); the one attempted remediation (migrating off `ring`/legacy rustls types in PR #2392) stalled on an unresolved API question (`with_safe_defaults()` replacement) and was never completed.

**Organizational/governance blocker:** Spin's SIP process requires consensus-driven proposals for scope changes; no SIP for RISC-V support has ever been filed. No maintainer (itowlson, lann, alexcrichton, rylev - the active reviewers/committers seen across the relevant threads) has otherwise engaged with riscv64 as a first-class target.

**Stated objections:** none found - there is no maintainer statement rejecting riscv64 support; the issue and PR were simply not prioritized and eventually lapsed from inactivity (auto-stale, then closed).

**Acceptance probability:** assessed as **low in the near term absent external funding or a dedicated contributor**. The evidence: a 3-year-old unresolved build-failure report, a single fix attempt that a maintainer explicitly closed for "dormancy," and zero RISE Project engagement with Spin (Section 1). There is no indication any actor - upstream, RISE, or a distro - currently intends to invest in this.

## 13. Readiness Assessment

- **Color:** red (n/a color_case - red has no sub-type)
- **Release provider:** none
- **Justification:** Spin's own issue tracker documents a confirmed, unresolved build failure on riscv64 - the `ring` crate's build script panics (`Option::unwrap()` on `None`) when targeting the architecture ([spinframework/spin#1681](https://github.com/spinframework/spin/issues/1681), open since 2023-08-06). The only attempted fix, [PR #2392](https://github.com/spinframework/spin/pull/2392), was left unfinished and closed as stale (2026-07-06) without merging, and no successor exists. There is no upstream riscv64 CI (zero matches across all 13 workflow files), no riscv64 release artifact on any GitHub release checked (v4.0.0-v4.1.0), and no distro provides a working riscv64 package for this project (the Ubuntu riscv64 `spin` package is an unrelated namesake, the SPIN model checker). This satisfies the model's red criterion of "a build-blocking dependency with no riscv64 port" combined with "a runtime/build issue documented as a known issue and unresolved" - it is a known-bad state, not merely an untested one.
- **Optimization level:** not applicable - Spin is not an optimization-purpose project under the Step 2 test (it is a general-purpose Wasm application runtime; its value proposition does not rest on outperforming a simpler alternative via architecture-specific code, and any such value is delegated to the embedded Wasmtime/Cranelift dependency, which is assessed separately).
- **Pending work that could change the grade:** none identified. No open PR currently attempts to resolve #1681; PR #2392 is the closest prior art and would need to be resumed and completed (resolving the `with_safe_defaults()` question) before a riscv64 CI/release effort could even begin. No RISE Project engagement exists to date (Section 1). A change to green/blue would minimally require: (1) landing a fix for the `ring`/rustls build blocker, (2) adding a `riscv64gc-unknown-linux-gnu` target to CI build and release matrices, (3) adding a `Riscv64` variant to the plugin `Architecture` enum, and (4) publishing a riscv64 release asset.

## 14. Investment Analysis

RISE has no recorded involvement with Spin (Section 1): no funded RP-numbered project, no RISE Runner CI usage, no wheel-builder or package-ecosystem work references Spin, Fermyon, or WASI. No work is already covered - the full scope below is unaddressed.

### 14.1 Functional Enablement

The dependency chain must be unblocked first: either patch/replace `ring` in Spin's TLS stack (resuming and completing PR #2392's abandoned rustls-migration approach) or otherwise route around it. Only after Spin builds can the plugin `Architecture` enum be extended with a `Riscv64` variant and end-to-end functionality (including the default `llm` feature's `candle`/`gemm` dependency chain, whose own riscv64 buildability is unverified - [huggingface/candle#1746](https://github.com/huggingface/candle) - and is a separate open question) be validated.

### 14.2 Performance Optimization

Not assessable until a working build exists; no riscv64 benchmark of any kind has ever been published for Spin (Section 6). Once building, the dominant performance risk surface is inherited from Wasmtime/Cranelift (Tier 3, already tracked separately) rather than anything in Spin's own code, since Spin contains no SIMD/JIT/assembly of its own (Section 4).

### 14.3 CI/CD Infrastructure

A riscv64 job needs to be added to `.github/workflows/build.yml` and `release.yml` (currently zero riscv64 entries in either), plus a `Cross.toml`/Dockerfile entry for cross-compilation, mirroring the existing `aarch64-unknown-linux-musl` pattern. No RISE Runner relationship exists yet to provide native riscv64 hardware for this (Section 1) - this would need to be established as a prerequisite or alternative to QEMU-based CI.

### 14.4 Ecosystem Enablement

Not applicable in the traditional dependent-package-ecosystem sense (Section 10 omitted; see rule 6) - Spin's "ecosystem" is its own plugin binary-distribution system (Section 4), which is gated entirely on Spin itself building and the `Architecture` enum being extended.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve `ring`/rustls build blocker (resume/complete PR #2392's approach or an equivalent) | 2-4 | Upstream Rust/TLS-familiar contributor | Critical |
| Functional | Add `Riscv64` variant to plugin `Architecture` enum + schema/serde updates | 0.5-1 | Upstream Spin contributor | Critical |
| Functional | Verify/fix `candle-core`/`candle-nn`/`gemm` riscv64 buildability (default `llm` feature) | 1-3 [NEEDS VERIFICATION on candle's own riscv64 status] | Upstream Spin or candle contributor | High |
| CI/CD | Add riscv64 build target to `Cross.toml` + build/release workflow matrices | 1-2 | Upstream Spin contributor | High |
| CI/CD | Establish riscv64 CI hardware/runner access (native or QEMU; no RISE relationship exists today) | 1-2 (coordination) | Upstream Spin + potential RISE outreach | Medium |
| Performance | Benchmark and validate Wasmtime/Cranelift riscv64 path under Spin's actual workload once building | 1-2 | Upstream Spin contributor | Medium |
| Governance | File a SIP for RISC-V platform support per Spin's own process | 0.5 | Upstream Spin maintainer | High (blocks all above from being accepted upstream) |

## 15. Updates

No updates yet - initial report dated 2026-09-10.

## 16. References

- [Spin homepage](https://www.spinframework.dev/)
- [spinframework/spin repository](https://github.com/spinframework/spin)
- [Issue #1681 - Build fails on Risc-v due to Ring](https://github.com/spinframework/spin/issues/1681)
- [PR #2392 - tls: Update dependencies and fixes for removed types](https://github.com/spinframework/spin/pull/2392)
- [PR #2508 - Dynamically detect support for Wasmtime's pooling allocator](https://github.com/spinframework/spin/pull/2508)
- [PR #2596 - add support for client certs (false-positive keyword match, not RISC-V-related)](https://github.com/spinframework/spin/pull/2596)
- [spinframework/spin GitHub Releases](https://github.com/spinframework/spin/releases)
- [spinframework/spin .github/workflows directory](https://github.com/spinframework/spin/tree/main/.github/workflows)
- [Ubuntu 26.04 (resolute) riscv64 "spin" package (unrelated SPIN model checker)](https://packages.ubuntu.com/resolute/riscv64/spin)
- [PyPI "spin" package JSON API (unrelated scientific-python project)](https://pypi.org/pypi/spin/json)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [RISE Project members list](https://riseproject.dev/members/)
- [briansmith/ring upstream project](https://github.com/briansmith/ring)
- [huggingface/candle issue #1746 - riscv64 compile/run support](https://github.com/huggingface/candle)
- [arXiv 2509.09400 - WebAssembly and Unikernels: A Comparative Study for Serverless at the Edge](https://arxiv.org/abs/2509.09400)
- [arXiv 2510.05118 - Lumos: Performance Characterization of WebAssembly](https://arxiv.org/abs/2510.05118)
- Local clone used for research: `/home/user/spinframework/spin` (shallow clone, commit `b870e46ec6df7788e7a22fda21905139e1dcc7cc`)