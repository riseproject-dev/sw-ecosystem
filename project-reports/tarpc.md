---
title: tarpc
parent: Project Reports
color: orange
---

# tarpc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for tarpc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[tarpc](https://github.com/google/tarpc) is an async RPC framework for Rust, built on [Tokio](https://tokio.rs/) and [Serde](https://serde.rs/). It provides client and server abstractions, transport-layer pluggability (TCP, Unix domain sockets, custom transports), and optional OpenTelemetry tracing integration. The current release is v0.38.0 (published 2026-08-12 on crates.io).

**Governance:** Informal. The repository is hosted under the `google` GitHub organization, but the README explicitly states "This is not an official Google product." There are no OWNERS, MAINTAINERS, CODEOWNERS, or GOVERNANCE files. Contributions require a Google Individual or Corporate CLA and pass through GitHub pull request review. No foundation affiliation (no CNCF, Apache, or similar).

**Primary maintainers:**
- Tim Kuehn (`tikue`, Google, 660 commits) -- primary author and maintainer.
- Adam Wright (`shaladdle`, Google, 122 commits) -- co-author.
- David Tolnay (`dtolnay`, independent, 4 commits) -- occasional contributor from the broader Rust ecosystem.

**License:** MIT.

**Community stance on new ports:** No formal tier policy exists. No documented position on RISC-V was found in issues, documentation, or maintainer communications. Since the codebase contains no architecture-specific code, acceptance of a RISC-V CI contribution would be a CI infrastructure addition rather than a code port.

## 2. Port History and Upstreaming Timeline

No RISC-V port activity exists.

| Date | Event | Source |
|------|-------|--------|
| -- | Zero issues, PRs, or commits referencing riscv or riscv64 | [Issues search](https://github.com/google/tarpc/issues?q=riscv), [PR search](https://github.com/google/tarpc/pulls?q=riscv), commit search |
| -- | No PLATFORMS.md, SUPPORT.md, or docs/platforms/ file exists | Repository file tree |
| -- | No RISE project involvement found | RISE member list and blog search |

tarpc has never had a RISC-V tracking issue, no contributor has submitted a riscv64 CI patch, and no RISE deliverable covers this project. The project is fully upstream as a pure Rust library but has never been targeted for riscv64.

## 3. Upstream Support Tier

No formal tier policy. The CI matrix defines supported configurations implicitly by what runs.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build | Yes (ubuntu-latest) | No | No |
| CI test | Yes | No | No |
| Official binary release | No (library crate, no binaries) | No | No |
| crates.io source release | Yes | Yes (source is arch-neutral) | Yes (source is arch-neutral) |
| Distro package | Not found | Not found | Not found |

tarpc publishes source only to crates.io. There are no binary releases on GitHub (the releases API returns `[]`). Users on any architecture build from source using the Rust toolchain. The implicit supported configuration is: Rust >= 1.85.0 on ubuntu-latest (x86_64).

## 4. Technical Architecture and RISC-V-Specific Subsystems

tarpc is entirely portable Rust. There are no architecture-specific subsystems.

Source tree (`tarpc/src/`): `cancellations.rs`, `client.rs`, `context.rs`, `lib.rs`, `serde_transport.rs`, `server.rs`, `trace.rs`, `transport.rs`, `util.rs`. All files contain only portable Rust with no platform branching.

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| RPC transport layer | Portable Rust | Portable Rust | Portable Rust | No arch-specific code |
| Serialization | Delegated to serde | Delegated to serde | Delegated to serde | No arch-specific code |
| Async runtime | Delegated to tokio | Delegated to tokio | Delegated to tokio | No arch-specific code |
| SIMD / vectorized paths | Absent | Absent | Absent | None exist anywhere |
| Inline assembly | Absent | Absent | Absent | Zero .S files in repo |
| JIT / codegen | Absent | Absent | Absent | Not applicable |
| Crypto | Absent (delegated to ring/rustls in examples) | Same | Same | ring uses pure-Rust on riscv64 |

GitHub code search for `cfg(target_arch`, `riscv`, `riscv64`, `aarch64`, `x86_64`, `simd`, `assembly`, and `JIT` within `repo:google/tarpc` returned 0 results in all cases. The `cfg` attributes in `lib.rs` are exclusively Cargo feature guards (`serde1`, `tokio1`, `docsrs`), not architecture guards.

## 5. Build System, Cross-Compilation, and Toolchain

tarpc is a pure Rust library crate. There is no CMake, no C/C++ build system, no `build.rs`, no native linker dependency, no Dockerfile, and no QEMU configuration in the repository.

**MSRV:** Rust 1.85.0 (declared in `tarpc/Cargo.toml`).

**riscv64 cross-compilation (no special steps required):**

```
rustup target add riscv64gc-unknown-linux-gnu
cargo build --target riscv64gc-unknown-linux-gnu
```

With an explicit cross-linker if none is on PATH:

```
CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc \
  cargo build --target riscv64gc-unknown-linux-gnu
```

No `-DUSE_X=OFF` flags, no configure script, no architecture feature flags to toggle. All Cargo features (`serde1`, `tokio1`, `serde-transport`, `tcp`, `unix`, `full`) are architecture-neutral.

**Known cross-compilation blockers:** None identified. All direct dependencies are pure Rust or have confirmed riscv64gc build support.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There are no functional gaps. Because tarpc has no architecture-specific code, every feature available on amd64 is equally available on riscv64.

| Feature area | amd64 | arm64 | riscv64 | Gap |
|--------------|-------|-------|---------|-----|
| TCP transport | Yes | Yes | Yes (untested) | None |
| Unix domain socket transport | Yes | Yes | Yes (untested) | None |
| Serde serialization (JSON, bincode) | Yes | Yes | Yes (untested) | None |
| OpenTelemetry tracing | Yes | Yes | Yes (untested) | None |
| TLS (via rustls/ring in examples) | Yes | Yes | Yes (pure-Rust ring, no assembly) | Performance only: ring uses pure-Rust path on riscv64 vs. hand-tuned assembly on amd64/arm64 |
| Async cancellation | Yes | Yes | Yes (untested) | None |

The only gap is performance in the TLS path via ring (used only in examples, not the core library): ring has hand-written assembly for amd64 and arm64, but uses a pure-Rust fallback on riscv64gc. This does not affect tarpc's RPC transport layer itself.

No NaN or floating-point semantic differences are relevant: tarpc does not perform floating-point computation.

## 7. CI/CD Infrastructure

No riscv64 CI exists.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (ubuntu-latest) | No | No |
| Test CI | Yes (ubuntu-latest) | No | No |
| QEMU cross-test | No | No | No |
| RISE CI runners | No | No | No |
| Hardware runners | No | No | No |

The repository contains two workflow files: [`.github/workflows/main.yml`](https://github.com/google/tarpc/blob/main/.github/workflows/main.yml) and [`.github/workflows/pr_review.yml`](https://github.com/google/tarpc/blob/main/.github/workflows/pr_review.yml). All jobs in both files use `runs-on: ubuntu-latest` exclusively. Jobs covered: `test`, `list-examples`, `run-example`, `fmt`, `clippy`, `test-suite` (main.yml) and `clippy` (pr_review.yml). Neither file contains any reference to riscv, riscv64, QEMU, or cross-compilation.

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or other CI configuration files exist in the repository.

## 8. Distribution and Release Status

tarpc is distributed exclusively as a source crate on [crates.io](https://crates.io/crates/tarpc) (9,460,518 total downloads; v0.38.0 is the latest release, published 2026-08-12).

| Channel | riscv64 artifact | Notes |
|---------|-----------------|-------|
| GitHub Releases | None | Releases API returns `[]` -- zero release objects exist |
| crates.io | Source only (arch-neutral) | Users build locally; no precompiled binary |
| PyPI | Not applicable | tarpc is a Rust crate, not a Python package; returns HTTP 404 |
| Ubuntu / Debian | Not packaged | Debian tracker returns HTTP 404 for `tarpc` and `rust-tarpc` |
| Arch Linux RISC-V port | Not packaged | archriscv.felixc.at returns zero results for `tarpc` |
| RISE wheel builder | Not applicable | Python-only; tarpc absent |

To obtain a working riscv64 binary: a downstream application must cross-compile using `cargo build --target riscv64gc-unknown-linux-gnu` with Rust >= 1.85.0. No pre-built artifact is available from any channel.

## 9. Dependencies

**Core and direct dependency riscv64 status:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| tokio v1 | Async runtime | Builds | Not in tokio CI cross-test matrix | crates.io (riscv64gc is Rust Tier 2) | Closed: tokio#6355 segfault in `park_timeout()` on riscv64, fixed and closed 2024-03-16. No open issues. |
| serde v1 | Serialization | Builds (pure Rust) | No cross-CI targets in serde CI | crates.io | None. Pure Rust, no assembly. |
| futures v0.3 | Async combinators | Builds (pure Rust) | cross-CI tests armv7, arm, i686, s390x; no riscv64 | crates.io | None. |
| rand v0.10 | Random number generation | Builds | cross-CI tests powerpc; no riscv64 | crates.io | None. `getrandom` syscall works on Linux riscv64. |
| tracing v0.1 | Observability | Builds (pure Rust) | No riscv64 in CI | crates.io | None. |
| opentelemetry v0.32/0.33 | OpenTelemetry integration | Builds (pure Rust) | No cross-compilation matrix | crates.io | None. |
| tokio-serde v0.9 | Codec/framing (optional) | Builds (pure Rust) | No cross-CI | crates.io | None. |
| ring (transitive, dev-dep) | Crypto primitives via rustls examples | Builds (pure-Rust fallback) | ring CI explicitly tests riscv64gc-unknown-linux-gnu | crates.io | No open issues. Pure-Rust path on riscv64, no hand-written assembly. Functional but potentially slower. |
| rustls v0.26 (dev-dep) | TLS in examples | Builds | rustls `cross.yml` includes riscv64gc-unknown-linux-gnu as cross-test target | crates.io | None. Full cross-test CI coverage. |
| tonic / h2 / hyper (dev-dep, grpc feature) | OTLP gRPC exporter in examples | Builds (pure Rust) | No riscv64 in tonic or hyper CI | crates.io | None known. |
| flate2 v1.1 (dev-dep) | Compression in examples | Builds (uses miniz_oxide, pure Rust) | No riscv64 in CI | crates.io | None. |

**Dependency summary:** No blocking issues. The only notable characteristic is that ring uses a pure-Rust code path on riscv64 rather than hand-written assembly, which may produce lower throughput in TLS-heavy workloads. tarpc's own code does not invoke ring directly. The one historical riscv64 correctness bug in tokio (park_timeout segfault, #6355) was resolved in 2024.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the tarpc issue tracker.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| tokio#6355 | Segfault in `park_timeout()` on riscv64 | Closed (fixed 2024-03-16) | Was: Critical | Fixed in tokio upstream; not a tarpc issue per se |

The only performance-related issue found is [tarpc#501 "why tarpc so slow?"](https://github.com/google/tarpc/issues/501) (opened 2025-01-03, closed 2025-09-26), which involved x86_64 hardware only. Root cause was request/response handling on a single shared thread causing starvation under high concurrency. No RISC-V involvement.

No open correctness bugs, no open riscv64 issues anywhere in the dependency graph.

## 12. Objections and Upstream Blockers

**Technical blockers:** None. tarpc is pure Rust with no architecture-specific code. A riscv64 build requires only `rustup target add riscv64gc-unknown-linux-gnu` and `cargo build`. No code changes are needed.

**Organizational blockers:** No maintainer has commented on riscv64 in any issue or PR. Given the project's informal governance and pure-Rust architecture, CI additions would likely be low-friction if proposed, but this is unverified [NEEDS VERIFICATION].

**CI addition complexity:** Low. Adding riscv64gc testing via `cross` (the standard Rust cross-compilation tool) requires a single workflow addition of approximately 10 lines. No code changes to tarpc itself would be required.

**Stated objections:** None found.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI; no distro package providing a floor)
- **Release provider:** none

tarpc has no upstream riscv64 CI in either of its two workflow files (both use `runs-on: ubuntu-latest` exclusively), and is not packaged in Ubuntu, Debian, or Arch Linux for riscv64. The [GitHub releases API](https://api.github.com/repos/google/tarpc/releases) returns an empty array, so no binary artifacts exist at all. The project is pure Rust with no architecture-specific code, meaning a riscv64 build is theoretically straightforward, but it is untested and unclaimed.

**Pending work that could change the grade:** No open PRs or RISE involvement found. Adding `cross`-based riscv64 testing to `.github/workflows/main.yml` would raise the grade to blue.

## 14. Investment Analysis

### 14.1 Functional Enablement

No functional work is required. tarpc compiles and should run on riscv64gc-unknown-linux-gnu with Rust >= 1.85.0 and a standard cross-linker. No code modifications are needed.

### 14.2 Performance Optimization

No performance optimization work is applicable. tarpc delegates all performance-sensitive operations (serialization, I/O, scheduling, cryptography) to upstream crates. Any performance work belongs in tokio, ring, or serde -- not in tarpc.

### 14.3 CI/CD Infrastructure

One actionable item: add riscv64gc cross-testing to tarpc's CI using the `cross` tool. This would validate the build and test suite on riscv64gc-unknown-linux-gnu under QEMU. Effort is low: add `riscv64gc-unknown-linux-gnu` to a `cross test` matrix step in `.github/workflows/main.yml`.

### 14.4 Ecosystem Enablement

Not applicable. tarpc is a library crate with no dependent package ecosystem that requires separate enablement work.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64gc-unknown-linux-gnu to cross-test matrix in main.yml | 0.2 | Upstream contributor | Low |
| Functional | None required | -- | -- | -- |
| Performance | None in tarpc itself; ring assembly for riscv64 is upstream ring work | -- | ring maintainers | Low |

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [google/tarpc repository](https://github.com/google/tarpc)
- [tarpc CI workflow main.yml](https://github.com/google/tarpc/blob/main/.github/workflows/main.yml)
- [tarpc CI workflow pr_review.yml](https://github.com/google/tarpc/blob/main/.github/workflows/pr_review.yml)
- [tarpc issues search: riscv](https://github.com/google/tarpc/issues?q=riscv)
- [tarpc PR search: riscv](https://github.com/google/tarpc/pulls?q=riscv)
- [tarpc on crates.io (v0.38.0)](https://crates.io/crates/tarpc)
- [GitHub Releases API: google/tarpc](https://api.github.com/repos/google/tarpc/releases)
- [Debian package tracker: tarpc](https://tracker.debian.org/pkg/tarpc)
- [Arch Linux RISC-V port search: tarpc](https://archriscv.felixc.at/?q=tarpc)
- [tokio issue #6355: segfault in park_timeout on riscv64 (closed 2024-03-16)](https://github.com/tokio-rs/tokio/issues/6355)
- [tarpc issue #501: why tarpc so slow?](https://github.com/google/tarpc/issues/501)
- [RISE project member list](https://riseproject.dev)
