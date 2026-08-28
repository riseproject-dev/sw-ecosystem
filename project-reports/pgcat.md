---
title: pgcat
---

# pgcat

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for pgcat<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

pgcat is a pure-Rust PostgreSQL connection pooler and proxy. It implements transaction-mode and session-mode pooling, sharding, load balancing, and health checking for PostgreSQL backends. It is positioned as a high-performance alternative to PgBouncer with built-in sharding support.

**Governance:** pgcat is owned by the `postgresml` GitHub organization (PostgresML Inc., a VC-backed startup). Governance is informal - no MAINTAINERS, OWNERS, or CODEOWNERS file exists. License: MIT. No foundation membership.

**Maintainers and contributors:**
- Primary maintainer: Lev Kokotov (`levkk`, 264 commits) - originally at PostgresML, now at pgdog.dev. He founded pgcat and has since moved to a competing product (PgDog).
- Second contributor: Mostafa (`drdrsh`, 80 commits) - no listed company affiliation.
- Third contributor: Zain Kabani (`zainkabani`, 43 commits) - no listed company affiliation.

**Corporate sponsors:** No formal sponsorship program. Known production users acting as implicit sponsors: Instacart, PostgresML, OneSignal. [NEEDS VERIFICATION - no formal sponsorship agreements confirmed]

**Community culture on new ports:** No documented policy on new architecture ports. The project has a small contributor base, and the founding contributor has moved to a competing project. The only non-x86/non-arm architecture request on record is [issue #934](https://github.com/postgresml/pgcat/issues/934) (Jul 2025) for loongarch64. RISC-V has never been discussed in any issue, PR, or commit.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-11-02 | PR #218 merged: Dependabot bump of jemallocator 0.3.2 to 0.5.0. The word "riscv64" appears in the auto-generated Dependabot changelog because jemallocator 0.4.3 upstream added riscv64 support. This is not a pgcat-native RISC-V action. | [PR #218](https://github.com/postgresml/pgcat/pull/218) |
| Never | No pgcat-native riscv64 commit, issue, PR, or patch has ever been made | Exhaustive search across all GitHub APIs |

There is no RISC-V port. No contributors with identified RISC-V affiliations have touched the project.

---

## 3. Upstream Support Tier

pgcat has no formal tier or platform support policy. No PLATFORMS.md, SUPPORT.md, or docs/platforms directory exists. Platform support is implicitly defined by what CI builds.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI builds | Yes | Yes | No |
| Docker image published | Yes | Yes | No |
| .deb package published | Yes (Ubuntu 22.04) | Yes (Ubuntu 22.04) | No |
| Official binary release | Source tarball only | Source tarball only | Source tarball only |
| Release-blocking test | Yes | Yes | No |
| Distro packages | Alpine edge, AUR, NixOS | [NEEDS VERIFICATION] | None |

All official CI targets are `linux/amd64` and `linux/arm64` only. riscv64 is absent from all build and release infrastructure.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

pgcat is a pure-Rust async PostgreSQL connection pooler built on tokio. It has no architecture-specific code of any kind.

A complete scan of all 142 files in the repository found:
- Zero files with riscv/rvv/arch-specific paths
- Zero assembly files (.S/.asm)
- Zero SIMD dispatch files
- Zero `#[cfg(target_arch = ...)]` attributes in any source file
- Zero `build.rs` (no build script to inject arch-specific compile flags)
- The only conditional dependency is jemallocator under `cfg(not(target_env = "msvc"))` - a Windows/non-Windows split, not an architecture split

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Connection pooling logic | scalar (Rust std) | scalar (Rust std) | scalar (Rust std) |
| PostgreSQL protocol parsing | scalar | scalar | scalar |
| TLS (tokio-rustls) | scalar | scalar | scalar |
| DNS (trust-dns-resolver) | scalar | scalar | scalar |
| Memory allocator (jemallocator) | scalar | scalar | scalar |
| Sharding / query routing | scalar | scalar | scalar |
| Metrics / admin interface (hyper) | scalar | scalar | scalar |

All components are scalar pure-Rust. The Rust compiler handles all ISA-specific code generation. riscv64 gets exactly the same source code as amd64 and arm64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Cargo (Rust). No CMakeLists.txt, configure scripts, or Makefiles.

**Pinned toolchain version:** `rust:1.81.0` (Rust stable, edition 2021), pinned in the production Dockerfile and test Dockerfile. No `rust-toolchain.toml` file exists in the repository.

**Standard build command:**
```
cargo build --release
```

No project-specific feature flags are required.

**Cross-compilation for riscv64:**
```bash
rustup target add riscv64gc-unknown-linux-gnu
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc
cargo build --release --target riscv64gc-unknown-linux-gnu
```

The `cc` crate (used transitively by jemallocator) requires a riscv64 C linker. On Debian/Ubuntu: `apt install gcc-riscv64-linux-gnu`.

**Known build concern - ring 0.16:** pgcat uses `tokio-rustls 0.24`, which requires `rustls 0.21`, which depends on `ring 0.16.x`. The riscv64 port of ring landed in ring 0.17 (merged September 2023, PR #1627). ring 0.16.x (last release: 0.16.20, 2022) predates that port. This means pgcat's TLS stack will fail to compile on riscv64 with the current dependency versions. [NEEDS VERIFICATION - exact ring version pinned by rustls 0.21 dependency resolution]

**Workaround:** Build without TLS (if a `--no-default-features` path is available), or upgrade to `tokio-rustls 0.26` + `rustls 0.23` which uses ring 0.17+. pgcat has not made this upgrade as of `main`.

**No official cross-compilation documentation, toolchain files, or riscv64 CI exists.**

QEMU is used in CI only for building arm64 Docker images via `docker/setup-qemu-action@v3`. It is not used for riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Transaction-mode pooling | Yes | Yes | Yes (untested) |
| Session-mode pooling | Yes | Yes | Yes (untested) |
| Sharding / query routing | Yes | Yes | Yes (untested) |
| TLS client/server connections | Yes | Yes | Blocked (ring 0.16 lacks riscv64 support) |
| Prometheus metrics endpoint | Yes | Yes | Yes (untested) |
| Admin interface | Yes | Yes | Yes (untested) |
| jemalloc allocator | Yes | Yes | Yes (jemalloc 5.x supports riscv64) |
| Pre-built binary | Yes | Yes | No |
| SIMD acceleration | None (N/A) | None (N/A) | None (N/A) |

**Functional gap:** TLS connections are blocked on riscv64 until ring is upgraded to 0.17+. All connection pooling and routing logic is architecture-neutral and has no functional gap.

**Performance gap:** No SIMD is used by any component, so there is no SIMD performance regression on riscv64 relative to amd64 or arm64. The Rust compiler's scalar code generation for riscv64gc will produce functional but unoptimized code compared to an optimized riscv64 build - the delta is unknown as no benchmarks exist.

**Security hardening:** No architecture-specific security mitigations (stack canaries, CFI, pointer authentication) are configured. No gap relative to amd64 or arm64 on this axis.

---

## 7. CI/CD Infrastructure

All CI is GitHub Actions. No CircleCI, Jenkins, GitLab CI, or Buildbot configuration exists.

| Workflow file | Purpose | amd64 | arm64 | riscv64 |
|---------------|---------|-------|-------|---------|
| build-and-push.yaml | Docker image build and push to ghcr.io | Yes (QEMU+Buildx) | Yes (QEMU+Buildx) | No |
| publish-deb-package.yml | .deb package build and upload to apt.postgresml.org | Yes (buildjet runner) | Yes (buildjet runner) | No |
| chart-lint-test.yaml | Helm chart linting | ubuntu-latest only | - | No |
| chart-release.yaml | Helm chart release | ubuntu-latest only | - | No |
| generate-chart-readme.yaml | Helm chart README update | ubuntu-latest only | - | No |
| publish-ci-docker-image.yml | CI Docker image build | ubuntu-latest only | - | No |

The string "riscv" does not appear in any of the 6 workflow files. No RISE runners are used.

**RISE involvement:** None. pgcat and PostgresML do not appear on riseproject.dev. pgcat is not listed in the RISE wheel builder project list.

---

## 8. Distribution and Release Status

**GitHub Releases:** Latest release is pgcat-0.2.5 (2024-11-11). The v1.x series (v1.0.0 through v1.2.0) has no uploaded release assets at all. The pgcat-0.x.x releases each contain a single source tarball (~7.8 KB) - not a binary. No release asset filename contains any architecture string. riscv64: absent.

**Docker images:** Published to `ghcr.io/postgresml/pgcat` for `linux/amd64` and `linux/arm64` only. No riscv64 image.

**Debian/Ubuntu packages:** Published to `apt.postgresml.org` for Ubuntu 22.04 on amd64 and arm64 only. No riscv64 package. pgcat is not in the Debian archive (tracker.debian.org returns HTTP 404 for pgcat).

**PyPI:** pgcat does not exist on PyPI (HTTP 404). It is not a Python package.

**Ubuntu Noble (24.04):** Not packaged (search returns no results).

**Arch Linux RISC-V mirror (archriscv.felixc.at):** pgcat is not listed. An AUR package exists (version 1.2.0-2) but has no official Arch package, so the RISC-V mirror has nothing.

**Repology:** pgcat appears in Alpine Linux Edge (testing) 1.2.0, ALT Linux 1.2.0, AUR 1.2.0, nixpkgs 1.1.1-1.2.0, and Rosa 1.2.0. NixPkgs build logs show x86_64-linux, aarch64-linux, x86_64-darwin, and aarch64-darwin only - no riscv64-linux build.

**To get a working binary on riscv64:** compile from source using the cross-compilation procedure described in Section 5. No validated riscv64 binary release exists from any distribution or upstream.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------------|------|---------------|--------------|-----------------|-------|
| jemallocator 0.5 | Memory allocator (Linux/non-MSVC) | Yes | No upstream CI | Distro packages available | jemalloc 5.x supports riscv64. See `project-reports/jemalloc.md`. |
| ring 0.16 (via rustls 0.21) | Cryptographic primitives for TLS | No | No | No | **Blocking.** riscv64 support landed in ring 0.17 (Sept 2023, PR #1627). ring 0.16.x predates that. pgcat must upgrade to rustls 0.23+ / ring 0.17+ to build TLS on riscv64. |
| rustls 0.21 + tokio-rustls 0.24 | TLS termination | Blocked by ring 0.16 | No | No | Pure Rust, but ring dependency prevents riscv64 build. Upgrade to tokio-rustls 0.26 + rustls 0.23 resolves this. |
| tokio 1.x | Async runtime (I/O, timers, task scheduling) | Yes | No riscv64 CI lane | Available via crates.io | Two historical riscv64 issues (#6355 segfault in park_timeout, #6356 fix for try_lock optimization) both closed. No open blockers. |
| ring 0.17 (upstream, not yet in pgcat) | Same crypto role if upgraded | Yes | Partial (Alpine riscv64 musl, at PR merge) | Available in ring >= 0.17 | PR #1627 merged 2023-09-30. |
| parking_lot 0.12 | Fast mutex/RwLock/Condvar | Yes | No explicit riscv64 CI | Available | Pure Rust, futex-based. Linux riscv64 has futex support. No known issues. |
| hyper 1.4 + hyper-util 0.1 | HTTP server for metrics/admin endpoint | Yes | No riscv64 CI | Available | Pure Rust, no arch-specific code. |
| trust-dns-resolver 0.22 (hickory-dns) | DNS resolution for backend discovery | Yes | No riscv64 CI | Available | Pure Rust. DNSSEC pulls in ring; resolved once ring 0.17 is in use. |
| sqlparser 0.52 | SQL parsing for query routing/sharding | Yes | No riscv64 CI | Available | Pure Rust parser, no arch-specific code. |
| regex 1.x | Query pattern matching | Yes | No riscv64 CI | Available | Pure Rust DFA/NFA. SIMD (aho-corasick/memchr) degrades to scalar on riscv64 without performance gap for this use case. |
| serde / serde_json 1.x | Configuration deserialization | Yes | Broad cross-platform | Available | Architecture-independent. |
| sha-1 0.10, sha-2 0.10, hmac 0.12 | PostgreSQL MD5/SCRAM authentication | Yes | RustCrypto cross-platform | Available | Pure-Rust RustCrypto implementations, independent of ring. |
| nix 0.26.2 | POSIX/Linux syscall bindings | Yes | No riscv64 CI | Available | riscv64 Linux is supported. |

**Critical blocker summary:** ring 0.16 is the sole functional blocker. Every other dependency builds and runs on riscv64gc-unknown-linux-gnu. The fix is a one-time dependency upgrade in pgcat's Cargo.toml.

---

## 11. Known Bugs and Active Issues

**General performance and correctness issues (architecture-independent):**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#882](https://github.com/postgresml/pgcat/issues/882) | pgcat has higher overall latency vs pgbouncer in Kubernetes | Open | ~15 ms latency increase with 50 high-traffic pods, transaction-mode pooling |
| [#810](https://github.com/postgresml/pgcat/issues/810) | Durations in SHOW STATS reported in milliseconds, not microseconds | Open | Metric reporting bug |
| [#720](https://github.com/postgresml/pgcat/issues/720) | pgcat not using idle connections, spawns new ones instead | Open | Connection reuse logic bug |
| [#492](https://github.com/postgresml/pgcat/issues/492) | Unrecognized configuration parameter "shard" | Open | Configuration parsing bug |
| [#414](https://github.com/postgresml/pgcat/issues/414) | Many metrics not implemented, warn logs | Open | Incomplete metrics implementation |
| [#297](https://github.com/postgresml/pgcat/issues/297) | Cancellations seem to have bugs | Open | Correctness bug in query cancellation |
| [#72](https://github.com/postgresml/pgcat/issues/72) | pgcat does not honor startup parameters | Open | Protocol compliance bug |
| [#479](https://github.com/postgresml/pgcat/issues/479) | Add PGO support | Open | Enhancement - no Profile-Guided Optimization applied |
| [#752](https://github.com/postgresml/pgcat/issues/752) | 4-5x TPS reduction vs direct PostgreSQL on x86 Linux | Closed | x86 Linux shows ~19-20 TPS vs 133 TPS baseline in -C mode. Apple M1 same setup: 624 TPS via pgcat vs 154 TPS baseline. Root cause not identified. |
| [#534](https://github.com/postgresml/pgcat/issues/534) | prepared_statements=true causes ~20-50 TPS instead of 2000-20000 TPS | Closed | Regression traced to commit 4b78af9, fixed. |
| [#617](https://github.com/postgresml/pgcat/issues/617) | Large result sets (~10k rows) show 28-44 TPS at 20-35 ms latency | Closed | Small queries of equal wire size show 1577-1645 TPS. Performance gap in result buffering. |

**riscv64-specific bugs:** None. No riscv64 issue exists in the repository.

**Correctness bugs of note:** Issues #297 (cancellation), #72 (startup parameters), and #720 (idle connection reuse) are correctness bugs that affect all platforms equally.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. ring 0.16 (via rustls 0.21 / tokio-rustls 0.24) lacks riscv64 support. TLS connections will fail to build. Fix: upgrade to tokio-rustls 0.26 + rustls 0.23 + ring 0.17+. Effort: small (dependency version bump with API compatibility check). This is a prerequisite for any riscv64 CI or deployment.

2. The test Dockerfile downloads Toxiproxy and Go binaries using `$(dpkg --print-architecture)` for architecture selection. riscv64 Toxiproxy and Go binaries may not be available from those download URLs for riscv64. Integration tests would fail until these are resolved or the test harness is adapted.

**Organizational blockers:**

The primary maintainer has left for a competing project (PgDog). The project shows reduced active maintenance. Any PR adding riscv64 CI would need review from remaining contributors with no clear SLA. There is no stated resistance to new ports - the topic has simply never arisen.

**Acceptance probability:** Moderate for a CI-only PR after the ring dependency is upgraded. Low for official binary distribution without an organizational sponsor. The project has no governance structure to accept a formal tier commitment.

---

## 13. Investment Analysis

RISE has no prior involvement with pgcat. No funded work exists to avoid duplicating.

### 13.1 Functional Enablement

The primary functional blocker is the ring 0.16 dependency. Upgrading pgcat to use tokio-rustls 0.26 + rustls 0.23 resolves the TLS build failure on riscv64. This is a contained Cargo.toml change with a compatibility verification pass. The test Dockerfile's Toxiproxy/Go download scripts require riscv64 binary availability checks or workarounds.

### 13.2 Performance Optimization

pgcat has no architecture-specific code. The Rust compiler generates scalar riscv64 code from the same source. There are no SIMD paths to enable. Performance on riscv64 is expected to match arm64 at equivalent clock speeds. No optimization investment is warranted until functional CI exists and baseline benchmarks are collected.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding riscv64 to the `build-and-push.yaml` Docker build matrix (QEMU is already present for arm64) is a one-line platform addition. Adding a riscv64 .deb build requires a riscv64 BuildJet or self-hosted runner. Adding riscv64 to functional test CI requires resolving the Toxiproxy/Go binary availability issue.

### 13.4 Ecosystem Enablement

pgcat has no dependent package ecosystem requiring riscv64 enablement. It is a standalone binary. Section 10 is omitted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Upgrade ring dependency: tokio-rustls 0.24->0.26, rustls 0.21->0.23, ring 0.16->0.17. Verify no API regressions. | 0.5 | RISE / chip vendor | Critical |
| Functional | Verify or replace Toxiproxy/Go binary downloads in test Dockerfile for riscv64 | 0.5 | RISE / chip vendor | High |
| CI/CD | Add `linux/riscv64` to Docker build matrix in build-and-push.yaml (QEMU already present) | 0.1 | RISE / chip vendor | High |
| CI/CD | Add riscv64 runner to publish-deb-package.yml matrix | 0.5 | RISE / chip vendor | Medium |
| CI/CD | Add riscv64 runner to functional/integration test CI | 1.0 | RISE / chip vendor | Medium |
| Performance | Baseline benchmark on riscv64 hardware (TPS, latency vs pgbouncer) | 1.0 | RISE / chip vendor | Low |

Total estimated effort: approximately 3.6 person-weeks for full functional + CI enablement.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [pgcat GitHub repository](https://github.com/postgresml/pgcat)
- [pgcat PR #218: Dependabot jemallocator bump (only riscv64 mention in entire repo)](https://github.com/postgresml/pgcat/pull/218)
- [pgcat issue #882: higher latency vs pgbouncer in Kubernetes](https://github.com/postgresml/pgcat/issues/882)
- [pgcat issue #752: 4-5x TPS reduction vs direct PostgreSQL on x86](https://github.com/postgresml/pgcat/issues/752)
- [pgcat issue #720: not using idle connections](https://github.com/postgresml/pgcat/issues/720)
- [pgcat issue #534: prepared_statements=true TPS regression](https://github.com/postgresml/pgcat/issues/534)
- [pgcat issue #479: no PGO support](https://github.com/postgresml/pgcat/issues/479)
- [pgcat issue #297: cancellation bugs](https://github.com/postgresml/pgcat/issues/297)
- [pgcat issue #72: startup parameters not honored](https://github.com/postgresml/pgcat/issues/72)
- [ring PR #1627: riscv64 support added to ring 0.17](https://github.com/briansmith/ring/pull/1627)
- [pgcat Repology entry](https://repology.org/project/pgcat/versions)
- [pgcat on RISE wheel builder - not listed](https://riseproject.gitlab.io/python/wheel_builder/)
- [pgcat Docker image at ghcr.io/postgresml/pgcat](https://github.com/postgresml/pgcat/pkgs/container/pgcat)
- [pgcat CI workflow build-and-push.yaml](https://github.com/postgresml/pgcat/blob/main/.github/workflows/build-and-push.yaml)
- [pgcat CI workflow publish-deb-package.yml](https://github.com/postgresml/pgcat/blob/main/.github/workflows/publish-deb-package.yml)
- [pgcat Cargo.toml](https://github.com/postgresml/pgcat/blob/main/Cargo.toml)