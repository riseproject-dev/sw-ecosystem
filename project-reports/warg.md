---
title: warg
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="warg" %}

# warg

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for warg<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

warg is the reference implementation of the WebAssembly component package registry protocol, developed under the Bytecode Alliance's SIG-Registries working group (also referred to as "#SIG-Packaging" in the repo README). It ships as a Rust/Cargo workspace producing a CLI (`warg-cli`), a client library (`warg-client`), a server (`warg-server`), and supporting crates (`warg-protocol`, `warg-crypto`, `warg-api`, `warg-transparency`, `warg-credentials`). It is a Merkle-log-based, content-addressed (SHA-256) registry client/server, not a WASM runtime or compiler, and contains no JIT, SIMD library, or codegen backend. License is Apache-2.0, confirmed from the repository's `LICENSE` file.

Governance is layered: Bytecode Alliance Board of Directors -> Technical Steering Committee -> per-project committer group. No repository-level `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists; the [docs/README.md](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/docs/README.md) states the design was "proposed by the Bytecode Alliance SIG Registries group" and that "SIG Registries meetings are held weekly." `CONTRIBUTING.md` asks that significant contributions be discussed at those weekly meetings; this is the only documented process for proposing new work, and it is generic, not architecture-specific.

Active corporate contributors (by commit volume, employer inferred from commit email domain): Lann Martin, 69 commits, Fermyon; Kyle Brown, 44 (+15 under a second email), Liquid Rocketry then SingleStore; Calvin Prewitt, 44, JafLabs; Peter Huene, 32 (+11 personal), Fastly; Daniel Macovei, 15, independent; Kristopher Wuollett, 10, Appbiotic; Nathaniel McCallum, 3, Profian. Fastly and Fermyon are both listed Bytecode Alliance member organizations; the Alliance lists 22+ member orgs overall (Microsoft, Mozilla, Fastly, Shopify, NGINX, Fermyon, Cosmonic, DFINITY, Anaconda, Igalia, and others per [bytecodealliance.org](https://bytecodealliance.org/)), but warg's own contributor base draws from only a handful of these.

Research notes that OCI-based registry work within the Bytecode Alliance has largely moved to a separate repository, `bytecodealliance/wasm-pkg-tools`. Whether `bytecodealliance/registry` is formally archived was not conclusively determined in this research [NEEDS VERIFICATION]; treat the project as low-activity rather than confirmed-archived.

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. `mcp__github__search_commits` for riscv/RISC-V against `bytecodealliance/registry` returned 0 results, and a full local clone (284 commits, complete history) grepped for "riscv" in commit messages and in the tree returned 0 matches anywhere. No commit, PR, or issue in the repository's history references RISC-V in any form.

| Date | Event | Source |
|---|---|---|
| - | No RISC-V-related commit, PR, or issue exists | [search_commits/search_issues/search_pull_requests, all 0 results](https://github.com/bytecodealliance/registry) |

No key contributors did RISC-V-specific work (there is none to attribute). The project is not upstream-supported on riscv64 in any sense: there is no port to be "fully upstream" or "partially upstream."

## 3. Upstream Support Tier

No formal platform-support tier policy exists. Lookups for `PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` all returned empty/404. The only "tier" concept present in the Bytecode Alliance ecosystem is the org-level Board/TSC/committer governance structure, which is unrelated to platform support.

Evidence is CI workflow content and the release binary matrix, both read directly at commit `ec28719bd9ef636628f36ec268d935b69c8face4`:

| Architecture | CI builds | CI tests run | Official release binary |
|---|---|---|---|
| amd64 (x86_64) | Yes (ubuntu-latest, macos-latest, windows-latest) | Yes | Yes: `x86_64-unknown-linux-gnu`, `x86_64-apple-darwin`, `x86_64-pc-windows-gnu` |
| arm64 (aarch64) | Cross-compiled only (via `cross`), not natively CI-tested | No | Yes: `aarch64-unknown-linux-gnu`, `aarch64-apple-darwin` |
| riscv64 | No | No | No |

Sources: [.github/workflows/main.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/main.yml), [.github/workflows/publish-binaries.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-binaries.yml).

## 4. Technical Architecture and RISC-V-Specific Subsystems

warg has no architecture-specific components for any ISA, including its own primary targets (amd64, arm64). Direct repository inspection confirmed:

- No `arch/riscv/` or any `arch/` directory.
- No `.S` assembly files anywhere in the repository.
- No JIT or codegen backend (warg is a registry client/server, not a WASM runtime or compiler).
- No SIMD dispatch code: `grep -rn "target_arch"` across all `.rs` files returned 0 matches; `grep -rln "asm!"` returned 0 matches.
- The only conditional compilation by platform in any `Cargo.toml` is by `target_os` (linux/freebsd/openbsd/macos/ios/windows) in `crates/client/Cargo.toml`, used solely to select a credential-storage backend (the `keyring` crate) - not architecture-related.
- The only architecture-related file in the repo is `Cross.toml`, containing a single cross-compilation profile for `aarch64-unknown-linux-gnu` (OpenSSL linking env vars for `cross-rs`).

| Architecture | Hand-written arch-specific `.rs` files | CI test job | Release binary target |
|---|---|---|---|
| amd64 | 0 | Yes | Yes |
| arm64 | 0 | No (cross-compiled only) | Yes |
| riscv64 | 0 | None | None |

Conclusion: warg is portable Rust relying entirely on rustc/LLVM standard cross-compilation with no hand-tuned intrinsics, SIMD, or assembly for any target. Architecture is addressed only at the CI/release target-triple matrix level, and that matrix simply never lists riscv64 - it is absent, not gated or disabled. This confirms warg is not an optimization-purpose project under the readiness color model (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

warg is a Cargo workspace; there is no CMake, `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `Dockerfile.riscv64` anywhere in the tree, and a repository-wide case-insensitive search for "riscv" (source, docs, CI workflows, Dockerfile, `Cross.toml`, docker-compose files) returned zero matches.

Build commands (from the repo-root `Dockerfile`, based on `rust:1.78-slim`, and `README.md`):
- Build: `cargo build --release --workspace --features postgres`
- Install: `cargo install warg-cli` / `cargo install warg-server`
- Test: `cargo test --workspace` (in-memory backend), or with Postgres via `docker`/`diesel`

Toolchain requirement: README's "Prerequisites" section states only "latest stable Rust"; the Dockerfile pins `rust:1.78-slim`. There is no minimum GCC/Clang version because there is no C/C++ code to compile natively (OpenSSL and libpq are optional native dependencies, only pulled in via non-default Cargo features). No `-DUSE_X=OFF`-style build flags exist; the only build-time toggle is the Cargo feature flag `--features postgres` versus the default in-memory backend. No QEMU usage exists anywhere in the repository.

Cross-compilation support that exists is for **aarch64 only**: `[target.aarch64-unknown-linux-gnu]` in `Cross.toml`, using the `cross-rs` image `ghcr.io/cross-rs/aarch64-unknown-linux-gnu:edge`, with `dpkg --add-architecture`, cross-installed `libssl-dev`, and `OPENSSL_LIB_DIR`/`OPENSSL_INCLUDE_DIR`/`OPENSSL_STATIC` passthrough. No riscv64 entry exists in `Cross.toml` or in the `publish-binaries.yml` release matrix. Source: [Cross.toml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/Cross.toml).

Since the underlying language is Rust rather than C/C++, adding riscv64 support in practice means adding a `riscv64gc-unknown-linux-gnu` (or similar) entry to `Cross.toml` and to the `publish-binaries.yml` matrix - infrastructure that does not exist today.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI-tested build | Yes | No (cross-compile only) | No |
| Official release binary | Yes | Yes | No |
| Documented build path | Yes (native `cargo build`) | Yes (`cross` + `Cross.toml` profile) | No |

**Functional gap:** There is no official riscv64 binary of the `warg` CLI or server in any of the last five GitHub releases checked (v0.10.0 through v0.8.0). A user on riscv64 today cannot install a working binary through any documented or official channel; the only theoretical path is manually cross-compiling from source with `cargo build --target riscv64gc-unknown-linux-gnu`, a path that has never been exercised, documented, or verified by this project.

**Performance gap:** Data not available. No architecture-specific code exists for amd64 or arm64 either (Section 4), so there is no missing-SIMD-style performance delta to characterize; warg's performance profile is not defined by hand-tuned architecture code on any platform.

**Security hardening gap:** Data not available: no riscv64-specific security hardening analysis (e.g., mitigations, hardening flags) was found in the research for warg itself. Note the OpenSSL dependency (Section 9) carries an independently tracked AES T-table cache-timing gap on riscv64 hardware lacking Zkn/Zvkned extensions, but this applies only when the non-default `native-tls`/`native-tls-vendored` feature is selected in place of the default `rustls-tls`.

**NaN / floating-point semantics issues:** Data not available: no floating-point or NaN-semantics issues, riscv64-specific or otherwise, were found for warg or its dependency chain in this research.

## 7. CI/CD Infrastructure

No riscv64 CI exists. There are exactly three GitHub Actions workflow files and no other CI system config (no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`), confirmed by direct file reads at commit `ec28719bd9ef636628f36ec268d935b69c8face4`:

1. **[.github/workflows/main.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/main.yml)** ("CI") - triggers on push to `main`/tags `[0-9]*` and PRs to `main`/`release-*`. `test`/`test-postgres` jobs run on `matrix.os: [ubuntu-latest, macos-latest, windows-latest]` (test-postgres is ubuntu-latest only); `install`/`rustfmt` run on `ubuntu-latest`. No QEMU, no cross-arch emulation, no riscv reference.
2. **[.github/workflows/publish-binaries.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-binaries.yml)** ("Publish binaries") - release matrix: `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu` (via `cross`), `x86_64-apple-darwin`, `aarch64-apple-darwin`, `x86_64-pc-windows-gnu`. Build-only (uploads binaries; no test execution). No riscv64 target.
3. **[.github/workflows/publish-to-crates-io.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-to-crates-io.yml)** ("Publish to crates.io") - runs on `ubuntu-latest` only, no architecture matrix.

A repository-wide case-insensitive grep for "riscv" across all `.yml`/`.yaml`/`Jenkinsfile*` files, and separately across the full source tree, returned zero matches.

No RISE runner usage was found for warg specifically. RISE does offer free native RISC-V GitHub Actions runners (per RISE blog posts [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) and [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)), but nothing in warg's workflows or the RISE blog/wheel-builder/GitHub org references warg using them.

| Architecture | CI build | CI test | Runner type |
|---|---|---|---|
| amd64 | Yes | Yes | GitHub-hosted `ubuntu-latest`/`windows-latest` |
| arm64 | Yes (release only, via `cross`) | No | `cross-rs` Docker image on `ubuntu-latest` host |
| riscv64 | No | No | N/A |

## 8. Distribution and Release Status

No official riscv64 binary exists for warg through any checked channel.

- **GitHub releases** (v0.10.0 down to v0.8.0, all five checked): assets are consistently `warg-cli-aarch64-apple-darwin`, `warg-cli-aarch64-unknown-linux-gnu`, `warg-cli-x86_64-apple-darwin`, `warg-cli-x86_64-pc-windows-gnu`, `warg-cli-x86_64-unknown-linux-gnu`, plus source archives. Confirmed for the latest release via the server-rendered asset fragment: [expanded_assets/v0.10.0](https://github.com/bytecodealliance/registry/releases/expanded_assets/v0.10.0). No riscv64 asset in any release checked.
- **Ubuntu 26.04 (resolute):** No package named `warg`, `python3-warg`, or `libwarg` exists on any architecture. The only substring match was the unrelated Perl module `libkwargs-perl`. Source: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=warg&suite=resolute&searchon=names&section=all).
- **Arch Linux RISC-V port:** No `warg` package listed. Source: [archriscv.felixc.at](https://archriscv.felixc.at/?q=warg).
- **PyPI:** A package literally named `warg` exists on PyPI (v1.5.3, "easing return of multiple values") but it is an unrelated pure-Python project, not the Bytecode Alliance CLI. It ships as a `py3-none-any` wheel, architecture-independent by construction, so no riscv64-specific artifact is needed or present. Source: [pypi.org/pypi/warg/json](https://pypi.org/pypi/warg/json). This package is not evidence of riscv64 support for the WASM registry tool covered by this report.
- **RISE Python wheel builder:** `warg` is not in the 67-package list. Source: [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/).
- **Ubuntu 26.04 riscv64 via project-graph SPARQL:** Data not available. The `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research session; this query was never executed and should be retried once the server is reachable, rather than treated as a negative result.

**What a user must do today to get a working binary on riscv64:** there is no documented or verified path. The only theoretical option is to manually cross-compile from source (`cargo build --release --target riscv64gc-unknown-linux-gnu`) using an unmodified Rust toolchain, since the project has no riscv64-specific code to conflict with; this has never been attempted or validated by the project or in this research [NEEDS VERIFICATION - untested path].

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| wasm-tools | Build-dependency (critical). WASM binary encoding/parsing/composition used throughout `warg-cli`/`warg-client`/`warg-protocol` | Green | Green, verified natively on Banana Pi F3 (SpacemiT K1, rv64gc) per [issue #2463](https://github.com/bytecodealliance/wasm-tools/issues/2463) | Green, `riscv64gc-unknown-linux-gnu` added to the official release matrix, issue #2463 closed 2026-03-12 | No open riscv64 issues found |
| Rust | Build-dependency (critical). Compiler/toolchain; README "Prerequisites" specifies "latest stable Rust", Dockerfile pins `rust:1.78-slim` | Data not available: the formal Rust target-tier status of `riscv64gc-unknown-linux-gnu` was not directly researched for this report | Indirectly supported: wasm-tools' native riscv64 test pass (above) implies the stable Rust toolchain builds and runs correctly on rv64gc hardware [NEEDS VERIFICATION for warg specifically] | N/A | Not independently verified in this research beyond the wasm-tools evidence |
| cargo | Build-dependency (critical). Orchestrates `cargo build`/`cargo test`/`cargo install`/crates.io publish | Inherits from Rust toolchain | Inherits | Inherits | No riscv64-specific cargo issues found in this research |
| tokio | Runtime-dependency (critical). Async runtime underlying CLI, client, and server (default "full" features) | Green | Mostly green, one historical bug: [tokio-rs/tokio#6355](https://github.com/tokio-rs/tokio/issues/6355), SIGSEGV in `park_timeout()` on riscv64 Alpine (tokio 1.25.3), root-caused to a missing compiler/atomic barrier exposed by RISC-V's relaxed memory model; opened 2024-02-17, closed as completed 2024-03-16 | Green | No open riscv64 issues found |
| p256 | Build-dependency (critical). RustCrypto elliptic-curve (P-256) signing/verification for package and operator log entries (`warg-crypto`) | Green, pure Rust with generic fallback | Green | Green | No riscv64-tagged issues found in `RustCrypto/elliptic-curves` |
| sha2 | Build-dependency (critical). Content/log hashing, transparency log (`warg-crypto`) | Green | Green | Green | No riscv64-tagged issues found in `RustCrypto/hashes` |
| OpenSSL | Build-dependency (critical), optional. Alternative TLS backend, used only if the non-default `native-tls`/`native-tls-vendored` feature is selected instead of default `rustls-tls` | Green | Mostly green | Green | See the project's separate OpenSSL status report (`project-reports/openssl.md`); key open item is an AES T-table cache-timing gap on riscv64 hardware lacking Zkn/Zvkned extensions (PRs #31080/#31082 open), plus a `no-deprecated` cross-compile bug (issue #29357, fix PR open) |
| digest, signature (RustCrypto traits, indirect) | Crypto trait plumbing underlying `p256`/`sha2` | Green | Green | Green | No riscv64-tagged issues found in `RustCrypto/traits` or `RustCrypto/signatures` |
| prost / prost-types / pbjson-types (indirect) | Protobuf codegen/runtime for the operator and package log protocol (`warg-protocol`) | Green | Green | Green | No riscv64-specific issues found. warg uses `protox` (pure-Rust protobuf compiler) at build time instead of the C `protoc` binary, removing a native-toolchain risk on riscv64 |
| rustls (indirect, default TLS backend via `reqwest`) | TLS for the registry HTTP client (default `warg-client` feature) | Green, pure Rust | Green | Green | No riscv64-specific issues found on `rustls/rustls`; underlying crypto provider (`ring`/`aws-lc-rs`, pulled transitively) not independently verified in this research |
| reqwest (indirect) | HTTP client for registry protocol calls | Green | Green | Green | No riscv64-tagged issues found |
| keyring + linux-keyutils (indirect, default Linux feature set) | Local credential storage for signing keys (`warg-client`) | Green | Green (uses raw kernel `keyctl`/`add_key` syscalls present on all riscv64 kernels; no libdbus/libsecret link, confirmed by feature-gated dependency inspection) | Green | Not independently verified for open riscv64 issues this session (rate-limited) |
| diesel + diesel-async -> libpq (indirect, optional `postgres` Cargo feature only) | PostgreSQL-backed registry server storage, not built by default | Green | Green | Green | See the project's separate PostgreSQL status report (`project-reports/postgresql.md`); highest-severity item there (OpenSSL AES T-table gap) is inherited transitively via TLS, not a diesel/libpq issue itself |

All seven required direct dependencies (wasm-tools, Rust, cargo, tokio, p256, sha2, OpenSSL) are individually green or near-green on riscv64 in isolation. The blocker for warg on riscv64 is entirely at the warg project level (no CI target, no release target), not inherited from any dependency.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64 issues exist | N/A | N/A | Confirmed via `search_issues repo:bytecodealliance/registry` for "riscv"/"riscv64" (0 results) and `search_pull_requests` (0 results) |

No correctness bugs, performance issues, or open PRs relating to riscv64 exist for warg because no riscv64 port has ever been attempted. Two Wasmtime issues surfaced in web search ([#2217](https://github.com/bytecodealliance/wasmtime/issues/2217) "Support RISC-V target in new backend framework" and #4070 "I am trying to add risc-v backend") are for a different Bytecode Alliance repository (`bytecodealliance/wasmtime`, a WASM runtime/compiler) and are out of scope for warg (a registry client/server with no codegen).

## 12. Objections and Upstream Blockers

No stated objections exist because RISC-V has never been discussed in the repository (no issue, PR, or commit addresses it). There is no technical blocker inherent to warg itself: it is pure Rust with zero architecture-specific code (Section 4), and its direct/indirect dependency chain is predominantly green on riscv64 (Section 9), with `wasm-tools` (its most central non-crypto dependency) already natively verified on rv64gc hardware.

The practical blocker is purely infrastructural: no one has added a `riscv64gc-unknown-linux-gnu` entry to `Cross.toml` or to the `publish-binaries.yml` release matrix, and no riscv64 CI job has been added to `main.yml`.

**Organizational blocker:** the project shows signs of low activity, with OCI-based registry work reportedly having moved to a separate repository (`bytecodealliance/wasm-pkg-tools`) [NEEDS VERIFICATION - not conclusively confirmed as archived in this research]. This reduces the likelihood that existing maintainers would prioritize a new architecture port without external contribution.

**Acceptance probability:** given the code is architecture-neutral and the dependency chain is largely green, a riscv64 patch adding CI/release-matrix entries would face no known technical objection. The main risk to acceptance is not technical rejection but maintainer bandwidth, given the project's apparent low activity.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Optimization gap:** N/A (warg is not an optimization-purpose project; it has no JIT, SIMD library, or performance-differentiating hot path that would trigger Step 2 of the color model - see Section 4)

**Justification:** warg produces native compiled binaries per target triple (not architecture-independent), so it does not qualify for the Step 0 shortcut. Its upstream CI has no riscv64 build or test job in any of its three GitHub Actions workflows ([main.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/main.yml), [publish-binaries.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-binaries.yml), [publish-to-crates-io.yml](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-to-crates-io.yml)), and no riscv64 release asset exists in any of the last five GitHub releases. Per the color model, "no upstream CI" sets the primary grade to orange (not red, since there is no evidence of confirmed breakage, and not grey, since this is a well-researched, thoroughly-negative finding rather than an unknown-unknown). The distribution floor that could otherwise lift or further confirm this grade does not apply in either direction because no Linux distribution packages warg at all - not Ubuntu 26.04 ([resolute search](https://packages.ubuntu.com/search?keywords=warg&suite=resolute&searchon=names&section=all)), not Arch Linux's RISC-V port ([archriscv.felixc.at](https://archriscv.felixc.at/?q=warg)) - so there is no downstream build to check for patches. `release_provider` is therefore `none`.

**Pending work that could change the grade:** none identified. No open PR, tracking issue, or RISE-funded engagement touches warg specifically. RISE does operate free native RISC-V GitHub Actions runners that could host a riscv64 CI job for this project ([RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)), but nothing in the RISE blog, wheel builder, or `riseproject-dev` GitHub org (25 repos, none named warg) references warg. Note also the unresolved project-graph MCP connection failure (Section 8): a future Ubuntu 26.04 riscv64 package-graph check should be retried before this grade is next reviewed, though it is not expected to change the grade given the corroborating negative results from three independent distro/registry checks.

## 14. Investment Analysis

RISE has not funded or performed any work specific to warg (confirmed absence from RISE blog, wheel builder, and `riseproject-dev` GitHub org - Section 1, Section 8). All sizing below is therefore full, uncredited work.

### 14.1 Functional Enablement

Add a `riscv64gc-unknown-linux-gnu` cross-compilation profile to `Cross.toml` (mirroring the existing aarch64 profile) and a corresponding entry to the `publish-binaries.yml` release matrix; validate the build produces a working binary. Given the codebase is pure Rust with zero architecture-specific code (Section 4) and its most central dependency (`wasm-tools`) is already natively verified on rv64gc hardware, this is expected to be low-complexity configuration work, not a code port.

### 14.2 Performance Optimization

Not applicable. warg has no architecture-specific hot paths, SIMD code, or JIT for any architecture (Section 4); there is nothing to optimize for riscv64 that isn't equally absent for amd64 and arm64.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to the `main.yml` test matrix so the test suite (not just the build) runs on riscv64, using either QEMU emulation or a RISE-provided native RISC-V GitHub Actions runner ([RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). This would be required to move the color from orange toward blue (CI build+test passing, no upstream riscv64 artifact) or green (with a published riscv64 release asset).

### 14.4 Ecosystem Enablement

Not applicable; see Section 10 omission rationale (warg has no dependent package ecosystem - it is a standalone CLI/server, not a language package registry with downstream consumers to re-enable).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64gc-unknown-linux-gnu` to `Cross.toml` and `publish-binaries.yml` release matrix; validate build | 0.5-1 | Unassigned | High |
| CI/CD | Add riscv64 build+test job to `main.yml` (QEMU or RISE native runner) | 0.5-1 | Unassigned | High |
| Performance | N/A - no architecture-specific code exists for any platform | 0 | N/A | N/A |
| Ecosystem | N/A - no dependent package ecosystem | 0 | N/A | N/A |
| Verification | Re-run project-graph Ubuntu 26.04 riscv64 package-graph query once MCP server is reachable | 0.1 | Unassigned | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [bytecodealliance/registry (warg repository)](https://github.com/bytecodealliance/registry)
- [warg.io homepage](https://warg.io/)
- [.github/workflows/main.yml at commit ec28719b](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/main.yml)
- [.github/workflows/publish-binaries.yml at commit ec28719b](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-binaries.yml)
- [.github/workflows/publish-to-crates-io.yml at commit ec28719b](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/.github/workflows/publish-to-crates-io.yml)
- [Cross.toml at commit ec28719b](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/Cross.toml)
- [docs/README.md at commit ec28719b](https://github.com/bytecodealliance/registry/blob/ec28719bd9ef636628f36ec268d935b69c8face4/docs/README.md)
- [GitHub releases, expanded assets for v0.10.0](https://github.com/bytecodealliance/registry/releases/expanded_assets/v0.10.0)
- [PyPI warg package metadata (unrelated pure-Python project)](https://pypi.org/pypi/warg/json)
- [RISE Python wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 (resolute) package search for "warg"](https://packages.ubuntu.com/search?keywords=warg&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search for "warg"](https://archriscv.felixc.at/?q=warg)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE blog: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog: RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [bytecode-tools/wasm-tools issue #2463, riscv64gc release target](https://github.com/bytecodealliance/wasm-tools/issues/2463)
- [tokio-rs/tokio issue #6355, riscv64 SIGSEGV in park_timeout()](https://github.com/tokio-rs/tokio/issues/6355)
- [bytecodealliance.org, member organizations](https://bytecodealliance.org/)
- [bytecodealliance/wasmtime issue #2217, out-of-scope reference (different repository)](https://github.com/bytecodealliance/wasmtime/issues/2217)
- Local project reports referenced (not URLs): `project-reports/openssl.md`, `project-reports/postgresql.md`, `project-graph-mcp/README.md`
