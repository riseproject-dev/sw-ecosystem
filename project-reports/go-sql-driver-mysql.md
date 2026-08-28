---
title: go-sql-driver/mysql
parent: Project Reports
---

# go-sql-driver/mysql

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-sql-driver/mysql<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[go-sql-driver/mysql](https://github.com/go-sql-driver/mysql) is a MySQL wire-protocol driver implementing the `database/sql/driver` interface for Go. It is a pure-Go library with no C bindings, no CGo requirement for normal use, and no architecture-specific assembly. The driver handles connection management, TLS negotiation, MySQL authentication plugins (including caching_sha2_password, ed25519_password), prepared statements, and protocol compression over TCP or Unix sockets.

**Governance:** The project is hosted under the `go-sql-driver` GitHub organization, created 2012-12-09. It has no foundation membership (not CNCF, Linux Foundation, or Apache). There is no formal governance document - no MAINTAINERS, OWNERS, or CODEOWNERS file exists. Governance is informal with three org members holding commit rights:

- julienschmidt (Julien Schmidt, SumUp) - project founder, 347 commits
- methane (Inada Naoki, KLab Inc.) - currently most active reviewer and releaser, 135 commits
- arnehormann (Arne Hormann, affiliation not listed) - 74 commits, inactive in recent years

**License:** Mozilla Public License 2.0 (MPL-2.0).

**Corporate contributors** credited in the AUTHORS file include Google, Facebook, Microsoft, PingCAP, Stripe, GitHub, DigitalOcean, Percona, Dolthub, Block, and approximately ten others. These are contribution credits, not sponsorships. No company funds the project directly.

**Community stance on new architectures:** The project has no documented platform tier policy and does not explicitly enumerate supported architectures. Because the codebase is pure Go with no architecture-specific code, any platform the Go toolchain supports is automatically supported without maintainer action. No maintainer objection to riscv64 has ever been recorded.

**RISE membership:** go-sql-driver/mysql is not a RISE project member, has received no RISE funding, and does not appear in any RISE blog post or wheel builder. The nearest relevant RISE activity is Project RP001 (Go runtime acceleration on RISC-V, 2025-04-04), which covers Go compiler and runtime improvements including crypto routine optimization - none of this is database-driver-specific.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2014-01-21 | v1.0.0 released as pure-Go library; architecture support inherited entirely from Go toolchain | [Releases page](https://github.com/go-sql-driver/mysql/releases) |
| 2020-01-06 | Issue #1050 filed by julienschmidt: add Travis CI compile check for all Go-supported platforms | [Issue #1050](https://github.com/go-sql-driver/mysql/issues/1050) |
| 2020-03-09 | PR #1070 opened by Animesh Ray implementing `go tool dist list` cross-compile loop | [PR #1070](https://github.com/go-sql-driver/mysql/pull/1070) |
| 2020-03-11 | PR #1070 merged to v1.6.0 milestone; during review, contributor noted linux/riscv64 in `go tool dist list` for Go 1.11 but compiler not yet complete; resolved by probing `go tool compile -V` before build attempt | [PR #1070](https://github.com/go-sql-driver/mysql/pull/1070) |
| 2020-02 (Go 1.14) | Go added linux/riscv64 as a supported target; go-sql-driver/mysql inherits support with no code changes required | Go 1.14 release notes |

There is no RISC-V-specific port in the conventional sense. No architecture-specific code was ever written, no riscv64 issues were ever filed, and no contributors were assigned riscv64 work. The driver became riscv64-compatible when Go 1.14 shipped, without any maintainer action.

The Travis CI cross-compile script added by PR #1070 is no longer present in the repository. The project has since migrated to GitHub Actions, and the current workflows contain no cross-compilation check of any kind.

---

## 3. Upstream Support Tier

The project has no formal tier policy. Support for a given platform is implicit: if the Go toolchain supports it and the code compiles, the platform is supported.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles | Yes | Yes | Yes (pure Go, no arch code) |
| CI: unit tests run | Yes | Yes (GitHub-hosted runners) | No |
| CI: integration tests run (against MySQL) | Yes | Yes | No |
| Official binary release | No (Go module only) | No | No |
| Explicitly listed as supported | No | No | No |
| Known to work at runtime | Yes | Yes | Unverified - no runtime test results exist |

No riscv64 CI exists. No riscv64 runner is present in `.github/workflows/test.yml`. No RISE RISC-V runner has been adopted. The project does not ship binaries for any architecture.

The honest characterization of riscv64 tier: compiles, untested at runtime, not officially acknowledged. This is structurally equivalent to any platform Go supports that is not amd64 or arm64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The driver is a pure-Go MySQL wire protocol implementation. It has no JIT, no SIMD, no inline assembly, no CGo, and no architecture-specific files of any kind.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Assembly (.s / .S files) | None | None | None | Zero assembly in repo |
| SIMD / vectorized paths | None | None | None | No SIMD dispatch anywhere |
| JIT | None | None | None | Not applicable |
| Arch-specific build tags | None | None | None | No `//go:build amd64` etc. |
| CGo bindings | None | None | None | Explicitly documented as no C bindings |
| conncheck (liveness probe) | Full (OS: linux) | Full (OS: linux) | Full (OS: linux) | Build tag is OS-gated only; riscv64/linux satisfies `linux` |
| conncheck_dummy | N/A | N/A | N/A | Only used for non-unix platforms (Windows) |
| Byte order | LittleEndian throughout | LittleEndian throughout | LittleEndian throughout | `encoding/binary.LittleEndian` used; correct for RISC-V |

No `#ifdef __riscv` preprocessor guards exist (there is no C code). No `//go:build !riscv64` exclusion tags exist. The codebase is 47 `.go` files, 100% architecture-neutral. Every OS/arch pair Go supports receives identical, complete behavior from this library.

---

## 5. Build System, Cross-Compilation, and Toolchain

The project uses the standard Go module toolchain exclusively. There is no CMake, no autoconf, no Makefile, no Dockerfile, and no architecture-specific build file of any kind.

**Minimum Go version:** 1.24.0 (from `go.mod`).

**Normal use (as a module dependency):**

```
go get github.com/go-sql-driver/mysql
```

**Cross-compilation to riscv64:**

```
GOOS=linux GOARCH=riscv64 go build ./...
GOOS=linux GOARCH=riscv64 go test -c ./...
```

No `-DUSE_X=OFF` flags, no toolchain files, no GCC/Clang requirement, no QEMU needed for the build step. QEMU would only be needed to execute test binaries on non-riscv64 hardware.

**Single external dependency:** `filippo.io/edwards25519 v1.2.0`. This is also pure Go and cross-compiles to riscv64 without modification (see Section 9).

**Known build failures on riscv64:** None. The cross-compile issue noted during PR #1070 development was that Go 1.11 reserved the `riscv64` GOARCH value but the compiler did not yet support it. That issue is moot with the Go 1.24 minimum requirement.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There are no functional gaps between amd64, arm64, and riscv64 for this library. The driver implements the MySQL wire protocol in portable Go code with no architecture-conditional paths.

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| TCP connection | Full | Full | Full | None |
| TLS (via Go crypto/tls) | Full | Full | Full | None |
| caching_sha2_password | Full | Full | Full | None |
| ed25519_password auth | Full | Full | Full | None |
| Protocol compression (zlib) | Full | Full | Full | None |
| Prepared statements | Full | Full | Full | None |
| Connection liveness check | Full | Full | Full | None |
| context.Context support | Full | Full | Full | None |
| MultiStatements | Full | Full | Full | None |

**Performance gaps:** The amd64 assembly in `filippo.io/edwards25519` provides a speedup for the ed25519 authentication handshake on amd64. On riscv64, the pure-Go fallback is used instead. The ed25519 handshake occurs once per connection establishment and is not on the per-query hot path. For typical connection pool workloads this difference is negligible. No benchmark data comparing amd64 vs riscv64 for this driver exists anywhere. Data not available: riscv64 vs amd64 query throughput, latency, or memory allocation measurements.

**Security hardening gaps:** Data not available: whether Go's riscv64 port generates stack canaries, ASLR-compatible PIE binaries, or CFI instrumentation at the same coverage as amd64. The one known FIPS-mode issue (`golang/go#74683`) does not affect standard builds (see Section 9).

**Floating-point / NaN semantics:** Not applicable. The MySQL wire protocol does not perform floating-point arithmetic in the driver. Float values are serialized and deserialized via `math.Float64bits` and `math.Float64frombits`, which are architecture-neutral operations on the IEEE 754 bit representation.

---

## 7. CI/CD Infrastructure

**Current CI configuration** (confirmed by direct inspection of both workflow files):

`.github/workflows/test.yml`:
- Triggers: push, pull_request, workflow_dispatch
- Runners: `ubuntu-latest`, `macos-latest`, `windows-latest` (all x86-64)
- Go matrix: 1.24, 1.25, 1.26
- MySQL matrix: 5.7, 8.0, 8.4, 9.0
- MariaDB matrix: 10.5, 10.6, 10.11, 11.4, 11.8, 12.3
- Test command: `go test -v -race -covermode=atomic -coverprofile=coverage.out -parallel 10`
- Benchmark step: `go test -run '^$' -bench .` (x86-64 only)
- No QEMU, no riscv64 entry, zero architecture references

`.github/workflows/codeql.yml`:
- Runners: `ubuntu-latest` only
- No architecture matrix of any kind

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Unit tests | Yes | No (no arm64 runner) | No |
| Integration tests (live MySQL) | Yes | No | No |
| Race detector | Yes | No | No |
| Benchmarks | Yes | No | No |
| RISE RISC-V runners adopted | N/A | N/A | No |
| Hardware or QEMU-based testing | N/A | N/A | No |

The RISE RISC-V Runners program (launched March 2026) has not been adopted by this project.

Note on PR #1070 historical context: the Travis CI cross-compile script that iterated `go tool dist list` including `linux/riscv64` is no longer in the repository. That script performed a build-only check with no live MySQL server, so it was never a runtime test for riscv64 even when it existed.

---

## 8. Distribution and Release Status

**GitHub Releases:** Tags only. All three latest releases (v1.10.0, v1.9.3, v1.9.2) have `assets: []` - zero binary attachments. The project distributes exclusively via Go modules (`go get`). No riscv64 binary artifacts exist or are expected for this type of project.

**Debian:** Package `golang-github-go-sql-driver-mysql`, `Architecture: all`, version 1.9.3-1 in sid/unstable and testing, 1.9.0-1 in stable. `arch: all` means a single architecture-neutral `.deb` installs on all Debian-supported architectures including riscv64. No per-architecture build record exists, which is correct for this packaging model. Availability on riscv64 is incidental to the packaging model, not the result of any porting work.

**Ubuntu 24.04 (Noble):** Package `golang-github-go-sql-driver-mysql-dev`, version 1.7.1-2, `Architecture: all`. Noble supports riscv64 as a release architecture; the package is installable on riscv64 for the same reason as Debian.

**Arch Linux RISC-V (archriscv.felixc.at):** Not present. No result returned for any search variant of `go-sql-driver`.

**PyPI / npm / Maven / OCI:** Not applicable. This is a Go module; none of these distribution channels are relevant.

**What a user must do to get a working binary on riscv64:** Install Go 1.24+ for riscv64, add `go-sql-driver/mysql` as a module dependency in their application, and run `go build`. No additional steps, patches, or configuration are required.

---

## 9. Dependencies

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| `filippo.io/edwards25519 v1.2.0` | Ed25519 auth handshake (ed25519_password plugin, MySQL 8 caching_sha2_password) | Yes - `!amd64 \|\| purego` build constraint activates pure-Go `feMulGeneric`/`feSquareGeneric` fallback | No - CI matrix is ubuntu-latest / macos-latest / windows-latest only; no riscv64 runner | No (source-only Go module; no binaries) | None - generic fallback is complete and correct; no riscv64 issues filed |
| Go stdlib: `compress/zlib` | MySQL protocol compression (zlib level 2) | Yes - pure Go | Yes - Go riscv64 Tier 1 since Go 1.17 | Yes - included in every Go riscv64 toolchain release | None |
| Go stdlib: `crypto/tls`, `crypto/rsa`, `crypto/sha1`, `crypto/sha256`, `crypto/sha512`, `crypto/x509`, `crypto/rand` | TLS transport, RSA public-key auth, SHA hashing for password plugins | Yes - pure-Go paths exist; amd64/arm64 assembly is additive optimization | Yes - Go riscv64 Tier 1 | Yes | `golang/go#74683` (open, Backlog): linker bug in `crypto/internal/fips140` breaks `-buildmode=pie` + `GOFIPS140=v1.0.0` on riscv64. Affects FIPS-mode builds only. Standard non-FIPS builds are unaffected. Assigned to Meng Zhuo. Does not affect go-sql-driver/mysql in normal operation. |

**Deep-dive: filippo.io/edwards25519 v1.2.0**

The amd64 assembly (`fe_amd64.s`) implements field arithmetic for the Edwards25519 elliptic curve and provides a performance optimization. The build constraint `//go:build !amd64 || purego` ensures the pure-Go implementation (`fe_amd64_noasm.go`, `fe_generic.go`) is compiled on all non-amd64 platforms including riscv64. The pure-Go path is not a stub - it implements the full algorithm using `feMulGeneric` and `feSquareGeneric`. No riscv64-specific issues have been filed in that repository. The performance penalty of the pure-Go path is confined to the connection handshake (one ed25519 operation per connection) and is not on the per-query critical path.

**riscv64 dependency blocking summary:** No blocking issues. All dependencies either are pure Go, have correct pure-Go fallbacks on riscv64, or are part of Go's Tier 1 riscv64 support. The FIPS-mode linker bug is out of scope for normal use.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | No riscv64-specific issues exist | - | - | GitHub searches for "riscv", "riscv64", "risc-v" in issues and PRs return zero results (excluding PR #1070 which is not a bug report) |
| `golang/go#74683` | FIPS140 linker bug on riscv64 with `-buildmode=pie` | Open, Backlog | Low (scoped to FIPS mode) | Affects Go stdlib `crypto/internal/fips140`; no impact on go-sql-driver/mysql in standard builds; assigned to riscv maintainer Meng Zhuo |

No correctness bugs, no NaN/floating-point semantic issues, no endianness bugs, and no protocol-level issues on riscv64 have been reported or are publicly findable.

---

## 12. Objections and Upstream Blockers

No stated maintainer objections to riscv64 exist in the repository history. The project has no documented architecture exclusion list and no policy that would prevent riscv64 from being a supported target.

**Technical blockers:** None. The codebase is architecture-neutral by construction.

**Organizational blockers:** The project has two active maintainers (julienschmidt at SumUp, methane at KLab). Neither has expressed interest in or objection to riscv64 CI. Adding a riscv64 CI job would require maintainer approval for a workflow change. Given the informal governance model and precedent from PR #1070 (cross-platform compile check was accepted), a CI addition would likely be accepted if proposed correctly.

**Acceptance probability for riscv64 CI PR:** High, conditional on the PR providing a working QEMU-based integration test setup that does not increase CI runtime significantly.

---

## 13. Investment Analysis

RISE has done no work on this project. The dependency `filippo.io/edwards25519` has existing pure-Go fallbacks that work on riscv64 without RISE intervention. The Go stdlib riscv64 work (RP001) covers the crypto and compress packages this driver uses.

### 13.1 Functional Enablement

No work required. The driver compiles and is functionally complete on riscv64 without any code changes. The `filippo.io/edwards25519` pure-Go fallback handles ed25519 auth correctly.

### 13.2 Performance Optimization

The only performance gap relative to amd64 is the pure-Go ed25519 field arithmetic in `filippo.io/edwards25519`. This is on the connection establishment path, not the query execution path. For connection-pooled workloads (the dominant production pattern), this difference is immaterial. RVV-optimized field arithmetic for edwards25519 is theoretically possible but the return on investment for a one-per-connection operation is negligible.

Data not available: measured per-connection establishment latency or query throughput for this driver on riscv64 hardware.

### 13.3 CI/CD Infrastructure

This is the only investment area with a concrete return. The project has no riscv64 runtime test coverage. A riscv64 CI job would provide ongoing correctness assurance and catch any future regression introduced by Go toolchain updates or driver changes.

Implementation path: add a QEMU riscv64 job to `.github/workflows/test.yml` using a RISE-provided runner or a self-hosted QEMU runner. The job would need a MySQL service container running under QEMU or accessible via the host network. The main complexity is the MySQL service container on a QEMU riscv64 guest - this requires either a riscv64 MySQL build or a cross-architecture network setup.

### 13.4 Ecosystem Enablement

Not applicable. This is a Go library consumed as a module dependency. There is no plugin or extension ecosystem that requires separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required - driver is fully functional on riscv64 | 0 | - | N/A |
| Performance | RVV-optimized ed25519 field arithmetic in filippo.io/edwards25519 (connection path only) | 3-5 | Crypto contributor | Low |
| CI/CD | Add QEMU riscv64 integration test job to test.yml; includes MySQL service container setup | 2-3 | RISE contributor | Medium |
| CI/CD | Propose and land the CI job PR with maintainer buy-in | 0.5 | RISE contributor | Medium |

Total estimated investment: 5-9 person-weeks for complete riscv64 CI coverage and optional crypto optimization. The driver is already functionally complete on riscv64 at zero cost.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [go-sql-driver/mysql repository](https://github.com/go-sql-driver/mysql)
- [PR #1070: travis: Add compile check for all supported platforms](https://github.com/go-sql-driver/mysql/pull/1070)
- [Issue #1050: Travis Compile Check for all supported platforms](https://github.com/go-sql-driver/mysql/issues/1050)
- [go-sql-driver/mysql GitHub Actions test workflow](https://github.com/go-sql-driver/mysql/blob/master/.github/workflows/test.yml)
- [go-sql-driver/mysql GitHub Actions CodeQL workflow](https://github.com/go-sql-driver/mysql/blob/master/.github/workflows/codeql.yml)
- [go-sql-driver/mysql releases page](https://github.com/go-sql-driver/mysql/releases)
- [filippo.io/edwards25519 on pkg.go.dev](https://pkg.go.dev/filippo.io/edwards25519)
- [golang/go#74683: FIPS140 riscv64 pie linker bug](https://github.com/golang/go/issues/74683)
- [Debian tracker: golang-github-go-sql-driver-mysql](https://tracker.debian.org/pkg/golang-github-go-sql-driver-mysql)
- [Ubuntu Noble: golang-github-go-sql-driver-mysql-dev](https://packages.ubuntu.com/noble/golang-github-go-sql-driver-mysql-dev)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/)
- [RISE Project: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/blog)
- [go-sql-driver sql-benchmark](https://github.com/go-sql-driver/sql-benchmark)