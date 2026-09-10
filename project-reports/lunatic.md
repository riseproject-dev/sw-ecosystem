---
title: Lunatic
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="lunatic" %}

# Lunatic

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Lunatic<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Lunatic is a Rust-implemented, Erlang-inspired actor-model runtime for WebAssembly. It executes guest WASM modules as lightweight, isolated, preemptively-scheduled processes ("actors"), using [Wasmtime](https://github.com/bytecodealliance/wasmtime) and its Cranelift backend as the embedded JIT/AOT compilation engine for guest code. Source: [lunatic-solutions/lunatic](https://github.com/lunatic-solutions/lunatic), homepage [lunatic.solutions](https://lunatic.solutions/).

**Governance.** There is no foundation backing Lunatic and it is not a RISE Project member (checked against [riseproject.dev/members](https://riseproject.dev/members/): Lunatic appears in neither the Premier nor General member lists). Governance is informal: `CONTRIBUTING.md` describes a plain issue-then-PR flow reviewed by an undefined "Lunatic team member" - no named maintainer tiers, no `MAINTAINERS`/`CODEOWNERS`/`PLATFORMS.md` file exists in the repository. The project is dual-licensed Apache-2.0/MIT, with the MIT copyright line held personally by the founder (`Copyright (c) Bernard Kolobara <me@kolobara.com>`). The website states the project is maintained by "Lunatic Inc.," with no disclosed corporate sponsors.

**Top contributors (full commit history, no declared corporate affiliation beyond the founder's own company):**

| Contributor | Commits |
|---|---|
| Bernard Kolobara (founder, Lunatic Inc.) | 345 |
| Hrvoje Bandov | 80 |
| Marin Kostic | 28 |
| Ari Seyhun | 13 |
| Kai Jellinghaus | 12 |
| Ante Kegalj | 10 |

This is effectively a single-founder/small-team project rather than a multi-corporate-sponsor effort.

**Community culture on new ports.** No document states a position for or against new architecture ports. RISC-V has never been raised in any issue, PR, commit, or discussion in the repository's history - the topic appears simply never to have come up, which is distinct from an explicit refusal.

## 2. Port History and Upstreaming Timeline

Data not available: no RISC-V port history exists. `git log --all -i --grep="riscv"` against the full commit history (554 commits on `main`) returns zero matches, and GitHub commit/issue/PR search for `riscv`/`riscv64` scoped to [lunatic-solutions/lunatic](https://github.com/lunatic-solutions/lunatic) returns zero results across every query variant tried. There is no first RISC-V commit, no tracking issue, and no milestone to report. The port has not been started.

## 3. Upstream Support Tier

No formal tier policy exists for any platform. `README.md` lists prebuilt binaries only for Windows, Linux, and macOS, with no architecture-level breakdown beyond that (i.e., no distinction is drawn even between amd64/arm64, let alone riscv64). There is no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes (`ubuntu-latest`, `windows-latest`) | yes (macOS, via `aarch64-apple-darwin`) | no |
| CI runs tests | yes | yes | no (no CI target exists) |
| Official release binary | yes (`lunatic-linux-amd64.tar.gz`, `lunatic-windows-amd64.zip`) | yes (folded into `lunatic-macos-universal.tar.gz` via `lipo`) | no |

Source: [.github/workflows/ci.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/ci.yml), [release assets for v0.13.2](https://github.com/lunatic-solutions/lunatic/releases/expanded_assets/v0.13.2).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Lunatic itself contains **no hand-written, architecture-specific source code for any CPU architecture, including the ones it ships today.** Repository-wide code search for `target_arch` returns exactly 6 hits, all in `crates/lunatic-sqlite-api/`, and all of them are `cfg(target_arch = "wasm32")` guest-vs-host splits (does this code compile into the WASM guest module or the native host runtime), which has nothing to do with host CPU ISA. Searches for `x86_64` (4 hits) and `aarch64` (3 hits) resolve entirely to the macOS `lipo` build step in CI and to transitive `Cargo.lock` crate names (`winapi-x86_64-*`, `windows_aarch64_*`) - not to hand-written machine code.

Concretely: Lunatic's "support" for x86_64 and aarch64 today consists entirely of `cargo build --target <triple>`, i.e. ordinary Rust cross-compilation with codegen delegated to rustc/LLVM for the host runtime, and to the embedded **Wasmtime/Cranelift** dependency for JIT-compiling guest WASM modules. There is no `arch/riscv/` directory, no `.S` assembly, no RVV/Zba/Zbb intrinsics, and no riscv64 `target_arch` value anywhere in the repository.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Host runtime codegen | via rustc/LLVM (no hand-written arch code) | via rustc/LLVM (no hand-written arch code) | not built (would also be via rustc/LLVM if it were) |
| Guest WASM JIT (delegated to Wasmtime/Cranelift) | supported | supported | Wasmtime ships official riscv64gc-linux artifacts and Cranelift has a riscv64 backend (Wasmtime's own Tier 3), but Lunatic never invokes or tests this target - see [wasmtime.md](../reports/wasmtime.md) if present |
| TLS/crypto (`ring` 0.16.20 via `rustls` 0.21.7) | supported | supported | **not supported** - `ring` 0.16.x has no riscv64 asm/fallback path; riscv64 assembly landed only in `ring` >=0.17 |

Because this is a general-purpose actor runtime, not a project whose stated value proposition is beating a reference implementation on speed, Step 2 of the color model's optimization-purpose modifier does not apply here (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

Lunatic is a pure Cargo/Rust workspace (`Cargo.toml`, `crates/*` members) - there is no CMake, no `Dockerfile`, and no `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus.yml` anywhere in the repository. Confirmed by cloning [lunatic-solutions/lunatic](https://github.com/lunatic-solutions/lunatic) (HEAD `28a2f387ebf6a64ce4b87e2638812e2c032d5049`) and grepping the full tree.

**Build commands (from README/CONTRIBUTING):**
- `cargo install lunatic-runtime` or `cargo build` / `cargo build --release` / `cargo test`
- No documented cross-compilation section (`BUILDING.md`, `docs/cross-compilation.md` do not exist)
- Only stated host requirement: a Rust toolchain (rustup, stable channel, per CI)

**QEMU usage:** none found anywhere in the repository.

**Known build failure for riscv64:** the pinned `ring 0.16.20` (via `rustls 0.21.7`, consumed by `lunatic-distributed` and `lunatic-networking-api` for cluster TLS and the guest-facing `lunatic::net` TLS socket API) will not compile on riscv64 targets, since `ring`'s `build.rs` in the 0.16 line gates supported `target_arch` values and has no riscv64 asm or portable-C fallback in that release line. This is corroborated by upstream `ring` issue titles: [#2745 "Doesn't compile for riscv64a23-unknown-linux-gnu"](https://github.com/briansmith/ring/issues/2745), [#2468 "RISC-V Support in ring version 0.16.20"](https://github.com/briansmith/ring/issues/2468), [#2148 "Problem building for riscv64gc. Are there plans to support it?"](https://github.com/briansmith/ring/issues/2148) - all closed without landing riscv64 support in the 0.16 branch. `ring` >=0.17 has riscv64 asm support, so upgrading `rustls`/`ring` (or switching TLS backend) is the concrete unblock. This inference is based on issue titles only, since `issue_read` access was restricted in this research session; a manual read of `ring#2468` is recommended before treating this as load-bearing for a go/no-go decision [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Since no riscv64 build of Lunatic exists in any form (no CI, no release, no package), there is no partial-functionality state to describe - the gap is total: nothing currently runs.

| Feature | amd64/arm64 | riscv64 |
|---|---|---|
| Core actor runtime (spawn, message-pass, supervise) | works | not built/not testable |
| Guest WASM JIT execution (Wasmtime/Cranelift) | works | would depend on Wasmtime's riscv64gc backend (Tier 3 upstream) if built - untested by Lunatic |
| Distributed clustering / TLS (`lunatic-distributed`) | works | **blocked at build time** by `ring 0.16.20` (see Section 5) |
| Guest `lunatic::net` TLS sockets | works | **blocked at build time**, same cause |
| Embedded SQLite (`lunatic-sqlite-api`) | works | plain C, builds via `cc`; no known blocker, but never CI-tested on riscv64 (see Section 9) |

Data not available on NaN/floating-point semantics differences or security-hardening deltas specific to riscv64: no such analysis exists anywhere in the project's issues, docs, or CI, because no riscv64 build has ever been attempted.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by reading the complete content of all three workflow files in `.github/workflows/` (the entire CI surface of the repository):

- [`ci.yml`](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/ci.yml) ("Test & (release)") - triggers on every `push`/`pull_request`, plus a tag-triggered release path. Runner matrix (3 entries, all read): `ubuntu-latest` -> `lunatic-linux-amd64.tar.gz`; `macos-11` -> `lunatic-macos-universal.tar.gz` (via `cargo build --target x86_64-apple-darwin` + `--target aarch64-apple-darwin` + `lipo`); `windows-latest` -> `lunatic-windows-amd64.zip`. No riscv64 entry, no QEMU step, no cross toolchain setup.
- [`homebrew.yml`](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/homebrew.yml) - triggers on `release: published`; dispatches a Homebrew formula update via `curl`, runs on `ubuntu-latest`, no architecture logic at all.
- [`cargo-deny-pr.yml`](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/cargo-deny-pr.yml) - triggers on `Cargo.toml` changes, runs `cargo-deny` (advisories/bans/licenses/sources, not a build) on `ubuntu-latest` only.

A case-insensitive grep for `riscv`/`riscv64` across `.github/workflows/` returns zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. There is no evidence of RISE RISC-V runner usage (no reference to `riseproject-dev` or RISE runner labels anywhere in the CI configuration).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job exists | yes (`ubuntu-latest`, `windows-latest`) | yes (`macos-11`) | no |
| Tests run | yes | yes | no |
| Release-blocking | yes (tag-triggered release path) | yes | N/A |
| Runner type | GitHub-hosted | GitHub-hosted | none |

## 8. Distribution and Release Status

**No riscv64 binaries exist through any channel checked:**

- **GitHub releases** - last three releases (v0.13.2, v0.12.0, v0.10.1) each ship only `lunatic-linux-amd64.tar.gz`, `lunatic-macos-universal.tar.gz`, `lunatic-windows-amd64.zip`, plus source archives. Source: [releases/expanded_assets/v0.13.2](https://github.com/lunatic-solutions/lunatic/releases/expanded_assets/v0.13.2).
- **PyPI** - [pypi.org/pypi/lunatic/json](https://pypi.org/pypi/lunatic/json) lists a package named `lunatic`, but it is an unrelated PostgreSQL Python utility (homepage `github.com/agile4you/lunatic`) - not the WASM runtime. Only a source tarball is published, with no riscv64 relevance either way.
- **RISE Python wheel builder** - [gitlab.com/.../packages/pypi/simple/lunatic/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/lunatic/) redirects (HTTP 302) to the plain PyPI index, meaning RISE has no `lunatic` package of its own. Confirmed also by the RISE wheel builder's full 88-package listing at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), which does not include Lunatic.
- **Ubuntu 26.04 (resolute)** - [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Lunatic&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no `lunatic` package exists in this suite on any architecture, not just riscv64.
- **Arch Linux RISC-V port** - [archriscv.felixc.at/?q=lunatic](https://archriscv.felixc.at/?q=lunatic) - no package listed.

**What a user must do today to get a working riscv64 binary:** build from source with `cargo build --target riscv64gc-unknown-linux-gnu`, and first resolve the `ring 0.16.20` build failure described in Section 5 (e.g. by patching `Cargo.toml` to a `rustls`/`ring` pairing with riscv64 support, or disabling the TLS-dependent crates). No prior art for this exists publicly.

## 9. Dependencies

Manifest: `Cargo.toml` (Rust/Cargo workspace, root crate `lunatic-runtime` v0.13.2) - no CMakeLists.txt/setup.py/go.mod/package.json.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **Wasmtime** (8.0.1, incl. in-tree Cranelift 0.95.1) | Core WASM JIT/AOT engine, compiles every guest actor's wasm32 module; build-dependency, critical | builds on `riscv64gc-unknown-linux-gnu` (upstream ships official riscv64gc tarballs); Lunatic's 8.0.1 pin is late-2022 era, predating several later riscv64 codegen fixes | upstream QEMU matrix exercises riscv64 but only at Tier 3 (no continuous fuzzing) | Wasmtime ships official riscv64gc-linux release artifacts upstream | Open upstream issues referenced in research: [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050), [#7186](https://github.com/bytecodealliance/wasmtime/issues/7186), [#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) [NEEDS VERIFICATION - issue numbers from a single research pass, not independently re-checked in this report] |
| **Rust** (rustc/Cargo toolchain) | Build-dependency, critical - sole compiler/toolchain for the entire project | Rust has an official riscv64gc-unknown-linux-gnu target | N/A (toolchain, not a tested artifact of Lunatic's own CI) | Official Rust riscv64gc target ships from rust-lang | RISE-funded work exists on this exact axis: [RP004 "Support for a 64-bit RISC-V Linux port of Rust to Tier-1"](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) - this is upstream Rust/RISE infrastructure work, not Lunatic-specific, but directly relevant to closing this dependency's gap |
| **SQLite** (bundled via `sqlite3-src`/`sqlite3-sys`, `lunatic-sqlite-api`) | Runtime-dependency, optional - embedded SQL engine exposed to guest actors | Portable C, builds via `cc`; a `__uint128_t` guard bug affecting 128/160-bit multiply helpers (riscv32/riscv64 conflated) was fixed 2026-04, now resolved for riscv64 per prior research [NEEDS VERIFICATION - single source] | no upstream CI for riscv64 ("best-effort community-reported") | distro packages ship SQLite for riscv64 broadly | This is the upstream `sqlite/sqlite` C library vendored by the crate, not a distinct Rust crate |
| `ring` 0.16.20 (pinned via `rustls` 0.21.7) | Crypto primitives (AES/SHA/ECDSA/RSA) underlying TLS for `lunatic-distributed` clustering and the guest `lunatic::net` TLS API | **fails to build** on riscv64 - no asm/fallback path in the 0.16 line | N/A - does not compile | N/A | See Section 5; riscv64 asm landed only in `ring` >=0.17 |
| `rustls` 0.21.7 | TLS handshake/session layer | blocked transitively by `ring` 0.16.20 | N/A | N/A | No riscv64-specific issues found in `rustls` itself - the blocker is entirely the pinned `ring` version |
| `native-tls`/`openssl` 0.2.11 (via `reqwest`, CLI binaries only) | HTTPS client for package-manager operations in the `lunatic`/`cargo-lunatic` CLI | builds fine - OpenSSL has mature riscv64 support across major distros | N/A | ships broadly as a system package on riscv64 | Not part of the guest-facing runtime |
| `zstd` 0.11.2 / `zstd-sys` 2.0.9 (via `zip`, used for `cargo-lunatic` package archives) | Compression codec | builds via vendored C, riscv64 supported with community-only (non-CI) coverage | no upstream RISC-V CI runner | Debian/Ubuntu ship riscv64 zstd | Two stalled community PRs on riscv64 codepaths (`facebook/zstd` #4557, #4622), unreviewed as of the research date [NEEDS VERIFICATION] |
| `bzip2`/`bzip2-sys` 0.1.11+1.0.8 (via `zip`) | Compression codec | trivial - pure C89, no arch-specific code | distro build farms only | Debian sid and Ubuntu 24.04 ship riscv64 bzip2 | No riscv64-specific issues |
| `flate2` 1.0.28 / `miniz_oxide` 0.7.1 / `crc32fast` 1.3.2 (via `zip`) | DEFLATE compression | pure Rust, arch-independent (SIMD CRC paths exist only for x86/aarch64, portable scalar fallback elsewhere) | N/A | N/A | No riscv64-specific issues |
| `cap-std` 1.0.15 / `wasi-common` 8.0.1 / `wiggle` 8.0.1 | WASI syscall layer wasmtime uses for host FS/net exposure to guests | pure Rust + `rustix` syscalls, arch-independent | inherits Wasmtime's Tier 3 riscv64 coverage | ships with Wasmtime | No riscv64-specific issues |
| `regalloc2` 0.6.1 | Register allocator used internally by Cranelift | pure Rust, arch-independent algorithm | inherits Cranelift's coverage | ships with Wasmtime | No riscv64-specific issues |

**Headline dependency finding:** the single most consequential blocker is `ring 0.16.20`, pulled in via `rustls 0.21.7` for Lunatic's inter-node clustering TLS and its guest-exposed `lunatic::net` TLS socket API - this is not an incidental transitive dependency. As currently pinned, **Lunatic's networking/clustering crates cannot build at all on riscv64**, independent of Wasmtime/Cranelift's own (functional-but-Tier-3) riscv64 support.

## 10. Ecosystem Status

Not applicable. Lunatic is a standalone language runtime distributed as native binaries and a Cargo crate; it has no significant dependent package ecosystem (no plugin registry, no package-manager-hosted extension surface analogous to PyPI/npm/Maven modules) that would need separate riscv64 enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | (none found) | N/A | N/A | Zero open or closed issues/PRs mention riscv64/RISC-V in [lunatic-solutions/lunatic](https://github.com/lunatic-solutions/lunatic), confirmed via repeated GitHub issue/PR/code/commit searches across multiple query variants, all returning `total_count: 0` |

No riscv64-specific correctness bugs exist for Lunatic itself, because no riscv64 build has ever been produced to surface them. The one concrete, load-bearing bug affecting a riscv64 port is in a dependency, not Lunatic's own code: `ring`'s lack of riscv64 support in the 0.16 branch (Section 5, Section 9).

## 12. Objections and Upstream Blockers

**Stated objections:** none - RISC-V has never been discussed in the project's issue tracker, PRs, commits, or documentation.

**Technical blockers:**
1. `ring 0.16.20` (via `rustls 0.21.7`) does not build on riscv64 - blocks the networking/distributed-clustering crates outright (Section 5, Section 9).
2. No riscv64 CI target exists to validate a build even if the `ring` blocker were resolved.
3. Wasmtime 8.0.1 (the pinned version) predates later riscv64 Cranelift codegen fixes; the current pin's riscv64 maturity relative to upstream's present-day Tier 3 status is unverified [NEEDS VERIFICATION].

**Organizational blockers:** Lunatic is maintained by a small, single-founder team (Lunatic Inc.) with informal governance and no named platform-support tiering. There is no evidence of engineering capacity dedicated to new-architecture ports, and no RISE or foundation relationship that would supply such capacity externally.

**Acceptance probability:** No data exists to estimate this - there is no precedent of the maintainers accepting or rejecting an architecture-port PR of any kind (the project's only architecture work to date has been ordinary Cargo cross-compilation targets set up by the founder, not community-contributed ports). Data not available: no comparable PR history to gauge maintainer receptiveness.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** Lunatic has no upstream riscv64 CI of any kind - all three CI workflow files ([ci.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/ci.yml), [homebrew.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/homebrew.yml), [cargo-deny-pr.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/cargo-deny-pr.yml)) were read in full and contain zero riscv64 references, and the runner matrix covers only amd64 Linux/Windows and macOS (x86_64+aarch64 via `lipo`). The distribution floor does not raise this: no Linux distribution ships a `lunatic` package for riscv64 or, in fact, for any architecture - [Ubuntu 26.04 (resolute) has no `lunatic` package at all](https://packages.ubuntu.com/search?keywords=Lunatic&suite=resolute&searchon=names&section=all) and [Arch Linux's RISC-V port](https://archriscv.felixc.at/?q=lunatic) does not list it either, so there is no clean or patched distro build to float the grade to yellow. This is not a case of confirmed breakage (red) - no riscv64 build has ever been attempted, so nothing has been shown to fail at runtime - and it is not grey, since the CI/release/packaging evidence is unambiguous and complete rather than absent. This is a general-purpose actor-model runtime, not an optimization-purpose project (removing architecture-specific code would not remove its core value proposition), so the Step 2 optimization modifier of the color model does not apply and `optimization_gap` is N/A.
- **Pending work that could change the grade:** none identified. No open PR, no tracking issue, and no RISE Project involvement exists for Lunatic (checked against [riseproject.dev/blog](https://riseproject.dev/blog) - all 34 posts via sitemap, [riseproject.dev/members](https://riseproject.dev/members/), the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/), and the `riseproject-dev` GitHub org). The only place "Lunatic" appears in any RISE-adjacent data is an unresearched backlog entry in this report repository's own internal `project-reports/.queue.yml` file, which is not a RISE-published statement of involvement. Any movement on this grade would have to originate from a fresh third-party or community-initiated port effort; none is currently visible.

## 14. Investment Analysis

RISE has not funded or otherwise touched Lunatic directly (Section 13). The only RISE work relevant here is indirect, at the dependency layer: [RP004, RISE-funded work to bring the 64-bit RISC-V Linux port of Rust to Tier-1](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/), which benefits Lunatic's toolchain dependency but does nothing to unblock Lunatic's own CI, its `ring`-blocked TLS crates, or its release pipeline. All work items below are therefore unclaimed.

### 14.1 Functional Enablement
- Replace or upgrade the `ring`/`rustls` pairing (target `rustls` >=0.22 with `ring` >=0.17, or an `aws-lc-rs`/`native-tls`-backed alternative) so `lunatic-distributed` and `lunatic-networking-api` can build on riscv64 at all (Section 5, Section 9).
- Add `riscv64gc-unknown-linux-gnu` as a `cargo build --target` in `ci.yml` and confirm the resulting binary starts and can spawn/schedule actors.
- Validate the bundled SQLite build (`lunatic-sqlite-api`) on riscv64 given the previously-fixed `__uint128_t` guard bug [NEEDS VERIFICATION - single-source finding].

### 14.2 Performance Optimization
Not a primary concern for a functional-enablement-stage project, but worth tracking: Lunatic's guest-WASM execution speed on riscv64 is entirely inherited from Wasmtime/Cranelift's riscv64 backend, which sits at Wasmtime's own Tier 3 with several referenced open correctness/codegen issues in SIMD/vector lowering [NEEDS VERIFICATION - issue list from a single research pass]. No Lunatic-specific optimization work is warranted until functional enablement (14.1) lands.

### 14.3 CI/CD Infrastructure
- Add a riscv64 job to `ci.yml`'s runner matrix, running the existing `cargo test` suite (not build-only), to reach at minimum the "blue" tier of the color model.
- Consider RISE's newly-announced free native RISC-V GitHub CI runners ([riseproject.dev, "Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) as the concrete mechanism, since Lunatic already uses GitHub Actions exclusively and has no existing riscv64 runner relationship to replace.
- Add riscv64 release-asset publishing (`lunatic-linux-riscv64.tar.gz`) to the tag-triggered release path once CI is green, to reach "green" (upstream-provided release).

### 14.4 Ecosystem Enablement
Not applicable - Lunatic has no dependent package ecosystem to enable (Section 10).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Replace/upgrade `ring`/`rustls` to unblock riscv64 TLS build | 1-2 | Lunatic maintainers or external contributor | Critical |
| Functional | Add riscv64 Cargo target build and smoke-test actor spawn/scheduling | 1-2 | Lunatic maintainers or external contributor | Critical |
| Functional | Validate bundled SQLite build/runtime on riscv64 | 0.5-1 | Lunatic maintainers or external contributor | Medium |
| CI/CD | Add riscv64 job to `ci.yml` running full test suite (not build-only) | 1 | Lunatic maintainers | High |
| CI/CD | Adopt RISE RISC-V GitHub runners for the new job | 0.5 | Lunatic maintainers | High |
| Distribution | Add riscv64 release-asset publishing to tag-triggered release path | 0.5 | Lunatic maintainers | Medium |
| Performance | Track Wasmtime/Cranelift riscv64 backend maturity (Tier 3, open SIMD-lowering issues) as a monitored dependency, not direct Lunatic work | ongoing (monitoring only) | N/A | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [lunatic-solutions/lunatic (repository)](https://github.com/lunatic-solutions/lunatic)
- [lunatic.solutions (homepage)](https://lunatic.solutions/)
- [.github/workflows/ci.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/ci.yml)
- [.github/workflows/homebrew.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/homebrew.yml)
- [.github/workflows/cargo-deny-pr.yml](https://github.com/lunatic-solutions/lunatic/blob/main/.github/workflows/cargo-deny-pr.yml)
- [Release v0.13.2 assets](https://github.com/lunatic-solutions/lunatic/releases/expanded_assets/v0.13.2)
- [Release v0.12.0 assets](https://github.com/lunatic-solutions/lunatic/releases/expanded_assets/v0.12.0)
- [Release v0.10.1 assets](https://github.com/lunatic-solutions/lunatic/releases/expanded_assets/v0.10.1)
- [PyPI lunatic package (unrelated project)](https://pypi.org/pypi/lunatic/json)
- [RISE Python wheel builder - simple index for lunatic](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/lunatic/)
- [RISE Python wheel builder - full package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 (resolute) package search: Lunatic](https://packages.ubuntu.com/search?keywords=Lunatic&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search: lunatic](https://archriscv.felixc.at/?q=lunatic)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog index](https://riseproject.dev/blog)
- [RISE Project RP004: Support for a 64-bit RISC-V Linux port of Rust to Tier-1](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [RISE Project: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [ring issue #2745: Doesn't compile for riscv64a23-unknown-linux-gnu](https://github.com/briansmith/ring/issues/2745)
- [ring issue #2468: RISC-V Support in ring version 0.16.20](https://github.com/briansmith/ring/issues/2468)
- [ring issue #2148: Problem building for riscv64gc](https://github.com/briansmith/ring/issues/2148)
- [CONTRIBUTING.md](https://github.com/lunatic-solutions/lunatic/blob/main/CONTRIBUTING.md)
- [LICENSE-MIT](https://github.com/lunatic-solutions/lunatic/blob/main/LICENSE-MIT)
- [CHANGELOG.md](https://github.com/lunatic-solutions/lunatic/blob/main/CHANGELOG.md)
