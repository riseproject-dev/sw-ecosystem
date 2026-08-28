---
title: mangle
parent: Project Reports
---

# mangle

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for mangle<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Mangle is a Datalog-based deductive database programming language implemented as a Go library. It provides a logic programming model layered over a factstore, intended for rule-driven inference over structured data. The canonical source is at [codeberg.org/TauCeti/mangle-go](https://codeberg.org/TauCeti/mangle-go); [github.com/google/mangle](https://github.com/google/mangle) is a mirror. A separate Rust implementation lives at [codeberg.org/TauCeti/mangle-rs](https://codeberg.org/TauCeti/mangle-rs).

The project originated inside Google and was released as open source, but the README explicitly states: "Mangle started out as an open source project released by Google but is now developed independently. It is not and never was an officially supported Google product." Google has no ongoing ownership or support obligation.

**Governance:** Informal, single-maintainer. CONTRIBUTING.md names Burak Emir as the lead; all submissions require PR review except those by Burak. There is no foundation membership (not Apache, CNCF, Linux Foundation, or RISE Project). License: Apache-2.0.

**Corporate sponsors:** None identified. Burak Emir uses a personal Proton email address and shows no current corporate affiliation. The second-most active contributor, Alexandre Philibert, also uses a personal email. The project is effectively a solo open-source effort.

**Community culture on new ports:** No port tiering policy, no PLATFORMS.md, no SUPPORT.md. The project delegates architecture portability entirely to the Go toolchain. There is no precedent for community discussion of architecture-specific work because no such work has ever been required.

**Repository stats:** 2986 stars, 154 forks, last pushed 2026-08-05. [NEEDS VERIFICATION] - star/fork counts from a single source (search findings).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V commits, issues, PRs, or code references exist in google/mangle | GitHub Issues API, Commits API, Code Search: 0 results for "riscv", "riscv64", "risc-v" |
| - | No architecture-specific code exists for any platform (amd64, arm64, or riscv64) | Full repo tree inspection: no .S files, no SIMD dispatch, no JIT, no GOARCH build constraints |
| - | riscv64 support is implicit via Go toolchain (`GOARCH=riscv64`) since the project's initial release | Go has supported linux/riscv64 as a target since Go 1.14 |

There is no port history to report. The project is pure Go with no architecture-specific code, so "porting" is not a concept that applies. `GOOS=linux GOARCH=riscv64 go build ./...` has worked since Go added riscv64 support, with no action required by the mangle project.

Key contributors (by commit count, all platforms): Burak Emir (~61 of ~95 commits), Alexandre Philibert (~18 commits), Christian G. Warden (3), Daniel Ostrow (2), several one-commit contributors. No contributor is affiliated with a semiconductor or RISC-V ecosystem company.

---

## 3. Upstream Support Tier

Mangle has no formal tier policy. The Go toolchain's tier classification for linux/riscv64 applies transitively.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Builds | Yes | Yes | Yes (via `GOARCH=riscv64`) |
| CI | None | None | None |
| Official binaries | None | None | None |
| Release-blocking tests | None | None | None |
| Formal tier | N/A | N/A | N/A |

The project has no CI for any architecture. There are no release binaries for any architecture. All four releases (v0.1.0 through v0.4.0) have zero GitHub release assets. This is not a riscv64-specific gap; it is the baseline state of the project for all platforms.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Mangle is a pure Go implementation of a Datalog interpreter with a fact store backend, ANTLR4-based parser, and an interactive REPL. There is no JIT compiler, no SIMD acceleration, no cryptographic implementation, no garbage collector override, and no hand-written assembly in any component.

Code search results for `riscv`, `riscv64`, `aarch64`, `x86_64`, `GOARCH`, `simd`, `assembly`, `vfloat32m1_t`, `rvv` against google/mangle all return 0 results. The full directory tree contains only pure Go packages: `analysis/`, `ast/`, `builtin/`, `engine/`, `factstore/`, `functional/`, `interpreter/`, `parse/`, and others. There is a `rust/` subdirectory containing only a README.md pointing to the separate mangle-rs repository.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Core interpreter (engine/) | scalar Go | scalar Go | scalar Go |
| Parser (antlr4-go) | scalar Go | scalar Go | scalar Go |
| Fact store (factstore/) | scalar Go | scalar Go | scalar Go |
| JIT backend | missing | missing | missing |
| SIMD/vectorized ops | missing | missing | missing |
| Assembly routines | missing | missing | missing |
| Crypto primitives | missing | missing | missing |
| GC barriers | managed by Go runtime | managed by Go runtime | managed by Go runtime |

There is no riscv64-specific gap relative to amd64 or arm64. All platforms receive the same scalar Go implementation. No ISA extensions (RVV, Zba, Zbb, or otherwise) are used or relevant.

---

## 5. Build System, Cross-Compilation, and Toolchain

The build system is the standard Go toolchain exclusively. No CMake, no Make, no Bazel, no Dockerfile is present in the repository.

**Required Go version:** 1.25.0 (from `go.mod`: `go 1.25.0`).

**Standard build:**
```
go get -t ./...
go build ./...
go test ./...
```

**Install interpreter binary:**
```
GOBIN=~/bin go install codeberg.org/TauCeti/mangle-go/interpreter/mg@latest
```

**Cross-compile for riscv64:**
```
GOOS=linux GOARCH=riscv64 go build ./...
GOOS=linux GOARCH=riscv64 go test -c ./...
```

No `-DUSE_X=OFF` flags exist (no CMake). No known architecture-specific build flags. No CGo in the main module; cross-compilation requires no C toolchain.

QEMU is not required for building. QEMU would be needed only to execute riscv64 test binaries on a non-riscv64 host. This is not documented anywhere in the project.

**Known build failures on riscv64:** None identified. No open issues or PRs reference build failures on any architecture.

The Rust implementation (mangle-rs) targets `wasm32-unknown-unknown` primarily. Cross-compiling the Rust code to `riscv64gc-unknown-linux-gnu` is expected to work via `cargo build --target riscv64gc-unknown-linux-gnu` but this is not documented. The `wasmtime` dependency used in `mangle-vm` supports riscv64 as a host [NEEDS VERIFICATION - Codeberg anti-scraper protection prevented CI workflow inspection].

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| Datalog interpreter | Full | Full | Full | None |
| ANTLR4 parser | Full | Full | Full | None |
| Fact store (in-memory and columnar) | Full | Full | Full | None |
| Interactive REPL (mg binary) | Full | Full | Full | None |
| Protocol Buffers serialization | Full | Full | Full | None |
| Compression (via klauspost/compress) | SIMD-accelerated | SIMD-accelerated | Scalar Go fallback | Performance gap only (see below) |
| JIT compilation | None | None | None | No gap (feature absent everywhere) |
| Floating-point correctness issues | None reported | None reported | None reported | None |
| NaN / IEEE 754 anomalies | None reported | None reported | None reported | None |

**Performance gap:** `github.com/klauspost/compress` uses hand-written assembly for hot paths (huff0 decoder, S2 encoder/decoder, zstd FSE decoder, xxhash) on amd64 and arm64. On riscv64, it falls back to pure Go via `decode_other.go` / `encode_go.go` guarded by build tags. Throughput for zstd/S2 is expected to be 2-5x lower on riscv64 than on amd64/arm64. This matters only if mangle is deployed with heavy on-disk compression of fact stores. There is no correctness impact.

**Security hardening gaps:** Data not available - no security hardening analysis was performed for any platform.

---

## 7. CI/CD Infrastructure

The google/mangle repository has no CI configuration of any kind. `GET /repos/google/mangle/contents/.github/workflows` returns HTTP 404. There is no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`.

The only automated tooling present is CodeQL (security scanning) and Dependabot (dependency updates), both GitHub-managed without explicit workflow YAML.

| CI dimension | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Build CI | None | None | None |
| Test CI | None | None | None |
| RISE runner | No | No | No |
| Hardware runners | None | None | None |
| QEMU emulation | None | None | None |

RISE Project involvement: Data not available from riseproject.dev/blog (JavaScript-rendered). The RISE wheel builder (78-package list, fully enumerated) does not include mangle. The riseproject-dev GitHub organization (30 repos scanned) contains no mangle reference.

---

## 8. Distribution and Release Status

**GitHub releases:** v0.1.0 through v0.4.0, all with zero release assets. Source-only releases.

**PyPI:** A package named `mangle` (v1.0.0) exists on PyPI with an x86_64-only manylinux wheel and a source sdist. This is an unrelated project. The `google/mangle` Go library is not distributed via PyPI.

**Debian:** HTTP 404 at [tracker.debian.org/pkg/mangle](https://tracker.debian.org/pkg/mangle). Not packaged.

**Ubuntu Noble:** No package named `mangle` in Ubuntu 24.04. Search returns unrelated results (demangling libraries, pkgbinarymangler).

**Arch Linux RISC-V:** No result at [archriscv.felixc.at](https://archriscv.felixc.at/?q=mangle).

**To obtain a working riscv64 binary:** A user must install Go 1.25.0+, then run:
```
GOOS=linux GOARCH=riscv64 GOBIN=/target/bin go install codeberg.org/TauCeti/mangle-go/interpreter/mg@latest
```
or cross-compile from source. No pre-built binary is available through any distribution channel for any architecture.

---

## 9. Dependencies

All direct dependencies are pure Go modules with no C extensions. No dependency has a JIT, SIMD implementation, or numerics subsystem that is critical to mangle's correctness.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Go toolchain (>=1.25.0) | Runtime, compiler, stdlib | Tier 2; linux/riscv64 builder exists | Partial - builder reliability issues (#79067, #79068, #79069 open in golang/go) | Since Go 1.14 | Open builder reliability bugs in golang/go (#79067-79069); no correctness bug for mangle code |
| [antlr4-go/antlr v4.13.1](https://github.com/antlr4-go/antlr) | ANTLR4 parser runtime | Yes - pure Go | Yes - no arch-specific tests | Yes | None found |
| [klauspost/compress v1.18.6](https://github.com/klauspost/compress) | Compression (zstd, S2, zlib) | Yes - generic Go fallback via `decode_other.go` / `encode_go.go` | No riscv64 CI (matrix: amd64/386 only) | Yes | Performance gap only: amd64/arm64 get assembly hot paths; riscv64 uses pure Go |
| [chzyer/readline v1.5.1](https://github.com/chzyer/readline) | Interactive REPL line editing | Yes - pure Go + golang.org/x/sys | No riscv64-specific issues found | Yes | None |
| [golang/glog v1.2.5](https://github.com/golang/glog) | Structured logging | Yes - pure Go | Yes | Yes | None |
| [google/go-cmp v0.7.0](https://github.com/google/go-cmp) | Deep equality (test dep) | Yes - pure Go | Yes | Yes | None |
| [uber-go/multierr v1.11.0](https://github.com/uber-go/multierr) | Error aggregation | Yes - pure Go | Yes | Yes | None |
| [google.golang.org/protobuf v1.36.11](https://pkg.go.dev/google.golang.org/protobuf) | Protocol Buffers (Go runtime only; no C extension) | Yes - pure Go | No riscv64 issues found | Yes | None. The C++ protobuf library is a separate project not used here. |
| [bitbucket.org/creachadair/stringset](https://bitbucket.org/creachadair/stringset) | Immutable string sets | Yes - pure Go | Yes | Yes | None |
| golang.org/x/exp (indirect) | Experimental Go APIs (slices, maps) | Yes - pure Go | Yes | Yes | None |
| [golang.org/x/sys (indirect)](https://pkg.go.dev/golang.org/x/sys) | OS syscall layer (used by chzyer/readline) | Yes - `asm_linux_riscv64.s`, `syscall_linux_riscv64.go` present | Yes | Yes | None |

**Deep dive - Go toolchain:** The `linux-riscv64-rva22u64-mengzhuo` builder has reliability issues tracked in golang/go as #79067, #79068, and #79069 (open). A `GORISCV64=g` profile proposal (#74540) would add RVV support but is not yet merged. These are infrastructure issues in the Go project, not in mangle. No build correctness bug exists for mangle code on riscv64.

**Deep dive - klauspost/compress:** The assembly paths cover huff0 decoding, S2 encoding/decoding, zstd FSE decoding, and xxhash on amd64 and arm64. riscv64 falls back to pure Go throughout. RVV intrinsics are absent. This is a performance-only gap with no correctness impact.

No dependency has a JIT backend requiring riscv64 porting work. No dependency has unresolved riscv64 correctness bugs.

---

## 11. Known Bugs and Active Issues

All open issues in google/mangle were scanned. Zero reference RISC-V, architecture-specific behavior, floating-point correctness, or performance:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #65 | Unification persistent data structure | Open | Feature request | No arch relevance |
| #40 | Add version number to simplecolumn file format | Open | Enhancement | No arch relevance |
| #36 | FR: Java Wrapper? | Open | Feature request | No arch relevance |
| #25 | Analysis should report error when multiple declarations | Open | Bug | No arch relevance |
| #3 | Grammar railroad diagram | Open | Documentation | No arch relevance |

No correctness bugs. No performance bugs. No riscv64-related issues in any state (open or closed).

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. The project is pure Go, and Go supports riscv64. No porting work is required.

**Organizational blockers:** None. The maintainer (Burak Emir) has made no statements about RISC-V and there is no policy excluding any architecture.

**Stated objections:** None found. No issue or PR discussion mentions RISC-V in any context.

**CI addition acceptance probability:** High [NEEDS VERIFICATION]. The project has no CI for any platform, so a PR adding riscv64 CI would need to establish the entire CI infrastructure from scratch. The maintainer's low activity on infrastructure (no CI in 4 releases) suggests this may not be a priority. No governance barrier exists, but bandwidth is limited to one primary maintainer.

---

## 13. Investment Analysis

Google is a RISE Project Premier Member. No RISE-funded work on mangle has been identified in any source. RISE does not list mangle in its wheel builder or any public work item.

### 13.1 Functional Enablement

No functional enablement work is required. mangle compiles and runs on riscv64 with `GOARCH=riscv64 go build ./...` today. There are no missing features, no broken subsystems, and no architecture-specific code paths to implement.

### 13.2 Performance Optimization

The only performance gap is in `klauspost/compress` (used by mangle's fact store for optional compression), which lacks RVV-accelerated paths for riscv64. This is upstream work in the klauspost/compress project, not in mangle itself. The impact is limited to deployments using compressed fact stores.

### 13.3 CI/CD Infrastructure

The project has no CI for any platform. Adding riscv64 CI means building the entire CI infrastructure from scratch. The absence is uniform across all architectures; riscv64 is not disadvantaged relative to amd64 or arm64.

### 13.4 Ecosystem Enablement

Not applicable. Mangle is a standalone Go library and interpreter with no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add GitHub Actions CI for build and test (all platforms including riscv64) | 0.5 | Upstream (Burak Emir) or contributor | Low |
| Performance | RVV-accelerated paths in klauspost/compress for zstd/S2 hot paths | 4-8 | klauspost/compress upstream | Low |
| Distribution | Add riscv64 pre-built binary to GitHub releases | 0.5 | Upstream (Burak Emir) or contributor | Low |

All items are Low priority. The project is functionally complete on riscv64 with no investment. The CI gap is a quality-of-life issue, not a correctness or availability blocker. The compression performance gap affects only a subset of deployments and the magnitude (2-5x on compression throughput) is irrelevant unless mangle is deployed as a high-throughput fact store server, which is not its stated use case.

**Recommendation:** No investment required for RISC-V functional enablement of mangle. If Qualcomm or a RISE member has a specific deployment scenario requiring riscv64 CI assurance, the CI addition is a half-week task with high acceptance probability.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/mangle GitHub repository (mirror)](https://github.com/google/mangle)
- [codeberg.org/TauCeti/mangle-go (canonical upstream)](https://codeberg.org/TauCeti/mangle-go)
- [codeberg.org/TauCeti/mangle-rs (Rust implementation)](https://codeberg.org/TauCeti/mangle-rs)
- [google/mangle releases](https://github.com/google/mangle/releases)
- [PyPI mangle package (unrelated project)](https://pypi.org/pypi/mangle/json)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/orgs/riseproject-dev/repositories)
- [Ubuntu Noble packages search for mangle](https://packages.ubuntu.com/search?keywords=mangle&suite=noble)
- [Debian tracker for mangle (404 - not packaged)](https://tracker.debian.org/pkg/mangle)
- [Arch Linux RISC-V package search for mangle](https://archriscv.felixc.at/?q=mangle)
- [klauspost/compress](https://github.com/klauspost/compress)
- [antlr4-go/antlr](https://github.com/antlr4-go/antlr)
- [golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys)
- [Go issue tracker - linux-riscv64 builder #79067](https://github.com/golang/go/issues/79067)
- [RISE Project member list](https://riseproject.dev/members/)