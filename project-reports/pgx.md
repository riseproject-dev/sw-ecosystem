---
title: pgx
parent: Project Reports
---

# pgx

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for pgx<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[pgx](https://github.com/jackc/pgx) is a PostgreSQL driver and toolkit for Go. It implements the PostgreSQL wire protocol directly in pure Go, providing both a low-level interface (`pgconn`) and a higher-level driver interface compatible with `database/sql`. It is the dominant PostgreSQL driver in the Go ecosystem, used as a dependency by major Go infrastructure projects including `sqlx`, `pgxpool`, and a large fraction of Go-based database tooling.

**Governance:** pgx is a solo project maintained by Jack Christensen (GitHub: [jackc](https://github.com/jackc)). No company affiliation is listed. The only governance artifact is `.github/FUNDING.yml` pointing to individual GitHub Sponsors. There is no formal governance document, no MAINTAINERS file, no CODEOWNERS, and no foundation membership (not CNCF, Linux Foundation, or RISE Project).

**License:** MIT.

**Corporate sponsors:** None active. PlanetScale was a past GitHub Sponsor but is no longer listed. The 10 current GitHub Sponsors are all individuals. [NEEDS VERIFICATION - sponsor list was not cross-confirmed against a second source.]

**Community culture on new ports:** Not applicable. pgx has no architecture-specific code on any platform. New architecture support is inherited from the Go toolchain automatically. No community discussion of RISC-V support exists in any issue, PR, or mailing list searched.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| ~2020 (Go 1.14) | Go toolchain adds linux/riscv64 as a supported GOARCH target; pgx gains implicit riscv64 support with no project-level action required | [Go 1.14 release notes](https://go.dev/doc/go1.14) |
| Never | No riscv64-specific commit, issue, PR, or patch has ever been filed in the jackc/pgx repository | GitHub Issues API: `riscv repo:jackc/pgx` -- 0 results; `riscv64 repo:jackc/pgx` -- 0 results |

There is no RISC-V port history because no port was ever needed. pgx is pure Go with no assembly, no CGo, and no ISA-specific code. The Go compiler handles cross-compilation to riscv64 transparently. No contributor has ever submitted RISC-V-related work to the project.

---

## 3. Upstream Support Tier

pgx defines no formal platform support tiers. The stated support policy is: "pgx supports the same versions of Go and PostgreSQL that are supported by their respective teams" -- currently Go 1.25+ and PostgreSQL 14+. The project does not enumerate OS/architecture combinations.

**Evidence:**

- CI runs on `ubuntu-22.04` (x86-64) and `windows-latest` only. Architecture is not a CI matrix dimension. No riscv64 runner, no QEMU, no cross-compilation step exists in `.github/workflows/ci.yml`.
- No PLATFORMS.md, SUPPORT.md, or equivalent document exists in the repository.
- No binary releases have ever been published (the GitHub releases page is empty). pgx is a library; it ships only as Go source.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI tested | Yes (ubuntu-22.04) | No | No |
| Builds | Yes | Yes (implicit) | Yes (implicit) |
| Official binary | N/A (library) | N/A | N/A |
| Formal tier | Untested (CI only) | Not defined | Not defined |
| Release blocking | Yes | N/A | N/A |

riscv64 is in the same position as arm64: neither is tested by upstream CI, and both are implicitly supported because the Go toolchain compiles the code correctly.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

pgx has no architecture-specific subsystems. The complete inventory of platform-conditional files in the repository is:

- `pgconn/defaults_windows.go` -- Windows-only socket path handling. Not architecture-specific.

Everything else is unconditional portable Go source. There is no assembly (no `.s` files), no SIMD dispatch, no CGo, no JIT backend, no GC barrier code, no ISA intrinsics, and no `//go:build` tags referencing any architecture.

**Component table:**

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Wire protocol engine | Scalar (Go) | Scalar (Go) | Scalar (Go) | Pure Go; identical on all architectures |
| TLS / SCRAM-SHA-256 crypto | Scalar (Go) | Scalar (Go) | Scalar (Go) | Delegates entirely to Go stdlib `crypto/tls`, `crypto/hmac`, `crypto/pbkdf2` |
| Type codec system (pgtype) | Scalar (Go) | Scalar (Go) | Scalar (Go) | Pure Go encoding/decoding for all PostgreSQL types |
| Connection pooling (pgxpool) | Scalar (Go) | Scalar (Go) | Scalar (Go) | Built on `jackc/puddle/v2`, pure Go goroutine pool |
| OS path handling | Full | Full | Full | Only Windows has a conditional file; Linux is identical across architectures |

"Scalar (Go)" means the implementation is fully functional on riscv64. It is not a stub or fallback. There is simply no hand-tuned assembly on any architecture, including amd64 and arm64.

There are no ISA extension opportunities for pgx. The hot paths (protocol parsing, type encoding) are Go byte-slice operations. Any performance benefit from RVV or Zba/Zbb would accrue at the Go compiler level, not at the pgx library level.

---

## 5. Build System, Cross-Compilation, and Toolchain

pgx uses Go modules exclusively. There is no CMake, no Makefile, no C compiler dependency, and no CGo.

**Build command:**

```
GOOS=linux GOARCH=riscv64 go build ./...
```

No additional flags, no toolchain files, no sysroot. The Go toolchain handles riscv64 natively.

**Test command (requires a running PostgreSQL server):**

```
go test -race ./...
```

Cross-compiling tests for riscv64 is straightforward (`GOOS=linux GOARCH=riscv64 go test -c ./...` produces a test binary), but running them requires either riscv64 hardware or QEMU user-mode emulation. No QEMU setup is documented or present in CI.

**Go version minimum:** `go 1.25.0` as declared in `go.mod`.

**No C compiler is required** at any stage. The Windows CI job sets `CGO_ENABLED=0` as a workaround for a Windows CGo environment limitation, but since there is no C code in pgx, this flag is irrelevant on Linux/riscv64.

**Known build failures:** None. No riscv64 build failure has been reported in the issue tracker or any public forum searched.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There are no functional gaps. Every feature of pgx is available on riscv64 identically to amd64 and arm64. This is a structural property of pure-Go libraries.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PostgreSQL wire protocol (v3) | Full | Full | Full |
| SCRAM-SHA-256 authentication | Full | Full | Full |
| TLS (1.2 and 1.3) | Full | Full | Full |
| All pgtype codecs (numeric, JSON, arrays, ranges, etc.) | Full | Full | Full |
| `database/sql` compatibility layer | Full | Full | Full |
| Connection pooling (pgxpool) | Full | Full | Full |
| `COPY` protocol | Full | Full | Full |
| Pipeline mode | Full | Full | Full |
| Large objects | Full | Full | Full |
| CockroachDB compatibility | Full | Full | Full |

**Performance gaps:** No riscv64-specific benchmark data exists. The only public benchmarks are from Apple M1 Max (arm64). Data not available: riscv64 vs amd64 latency and throughput comparison for pgx wire protocol operations.

**Security hardening gaps:** None specific to pgx. Any riscv64-specific stack protection or CFI gaps would be a Go toolchain issue, not a pgx issue.

**Floating-point / NaN semantics:** pgx PR #2598 (closed Jul 2026) fixed a bug where PostgreSQL `Infinity` and `-Infinity` numeric values were silently marshaled as `0` in JSON. This was a correctness bug on all architectures, not riscv64-specific. The fix is included in current releases.

---

## 7. CI/CD Infrastructure

**riscv64 CI exists:** No.

The repository contains exactly one CI workflow file: `.github/workflows/ci.yml`. It defines three jobs:

| Job | Runner | Go versions | PostgreSQL versions |
|---|---|---|---|
| `test` | ubuntu-22.04 (x86-64) | 1.25, 1.26 | 14, 15, 16, 17, 18, CockroachDB |
| `test-pgbouncer` | ubuntu-22.04 (x86-64) | latest | 16 |
| `test-windows` | windows-latest (x86-64) | latest | N/A (no PG server) |

Architecture is not a matrix dimension. There are zero references to `riscv`, `riscv64`, `arm`, `arm64`, QEMU, or cross-compilation in the workflow file.

**RISE infrastructure:** RISE Project has no recorded involvement with pgx. The RISE wheel builder (riseproject.gitlab.io/python/wheel_builder) lists 76 packages; pgx is not among them (and is not relevant -- pgx is a Go library, not a Python package).

**Debian buildd riscv64:** The Debian package `golang-github-jackc-pgx-v5` (5.9.2-1, forky/sid) is `Architecture: all`. It shows "No entry in riscv64 database" in the Debian buildd tracker, meaning Debian does not run riscv64 tests for it either.

**CI comparison table:**

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes | No | No |
| QEMU in CI | No | N/A | No |
| Debian buildd | Yes (arch:all) | Yes (arch:all) | Not tested |
| RISE runner | No | No | No |
| Hardware tested | GitHub-hosted | None | None |

---

## 8. Distribution and Release Status

pgx publishes no compiled binaries. The GitHub releases page for jackc/pgx is empty -- zero releases have ever been published. pgx is consumed as a Go module source dependency via `go get github.com/jackc/pgx/v5@latest`.

**To use pgx on riscv64, a user:**
1. Installs Go 1.25+ with riscv64 support (standard Go distribution).
2. Runs `go build` or `go get` in their own project. The Go toolchain downloads pgx source and compiles it for the target architecture.
3. No architecture-specific action is required.

**Linux distribution packages:**

| Distribution | Package | Architecture | Status |
|---|---|---|---|
| Ubuntu 24.04 (Noble) | `golang-github-jackc-pgx-v4-dev` (v4.18.1-1) | `all` (arch-independent) | Available on riscv64 via standard `universe` repo |
| Debian | `pgx` tracker entry | N/A | HTTP 404 -- no Debian package named `pgx` exists |
| Arch Linux RISC-V | pgx | N/A | No entry in [archriscv.felixc.at](https://archriscv.felixc.at/) porting tracker |

Note: the Ubuntu package covers pgx v4, not v5. pgx v5 (current) is not separately packaged in Ubuntu Noble. [NEEDS VERIFICATION - Ubuntu v5 packaging status was not confirmed against a second source.]

**PyPI:** The name `pgx` on PyPI refers to an unrelated pure-Python JAX board game library (versions 0.0.1-2.6.0, all tagged `py3-none-any`). This has no relation to jackc/pgx.

---

## 9. Dependencies

pgx v5 (`go.mod` requires Go 1.25) has the following direct module dependencies. All are pure Go with no CGo. No third-party C library is in the dependency tree.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Go runtime / stdlib (1.25+) | Execution environment, crypto (SCRAM, TLS), net, encoding | Tier 2 supported since Go 1.14; `GOARCH=riscv64` is a first-class defined target | `linux-riscv64` LUCI builder active; open issue #80880 adds riscv64 builder; #70401 is a gotip flakiness issue not affecting Go 1.25 stable | Released; `GOOS=linux GOARCH=riscv64` ships with every Go release | None blocking pgx on Go 1.25 stable |
| golang.org/x/sync v0.17.0 | Goroutine synchronization primitives used by `jackc/puddle/v2` | Pure Go, no arch-specific code | No riscv64-specific test failures found | Released on pkg.go.dev | None |
| golang.org/x/text v0.29.0 | Unicode normalization, character set conversion for text types | Pure Go; x86 SSE2/AVX paths are build-tag-guarded; riscv64 uses scalar fallback | No riscv64-specific failures found | Released | Scalar fallback is correct; performance gap vs x86 for bulk text normalization only |
| jackc/pgpassfile v1.0.0 | `.pgpass` file parsing | Pure Go, no external deps | No riscv64 issues | Released | None |
| jackc/pgservicefile v0.0.0-20240606120523 | `pg_service.conf` parsing | Pure Go, no external deps | No riscv64 issues | Released | None |
| jackc/puddle/v2 v2.2.2 | Connection pool (goroutine-based resource pool) | Pure Go; previous `runtime.nanotime` linkname hack removed in favor of `time.Since` -- fully portable | No riscv64 issues | Released | None |
| PostgreSQL server (runtime dep, not compile-time) | Wire protocol peer; pgx correctness depends on server behavior | Builds on riscv64; documented as supported in PG 18 | Regression tests pass on riscv64 build farm | Packaged in Debian trixie / Ubuntu Noble for riscv64 | LLVM JIT disabled on riscv64 (performance only, not correctness); missing arch-specific atomics and CRC32C patches under review. See `project-reports/postgresql.md`. |

The only riscv64 concern in the full stack is the PostgreSQL server's LLVM JIT being disabled on riscv64. This is a server-side performance issue for JIT-accelerated query plans; it has no effect on pgx's correctness or availability. The memory-barrier correctness bug in PostgreSQL was fixed 2025-11-07 and backpatched -- it is not a current blocker.

---

## 11. Known Bugs and Active Issues

**Open issues (no riscv64-specific component):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2551](https://github.com/jackc/pgx/issues/2551) | TOC/TOU bug on transaction rollback | Open | Medium | Race condition; no architecture component |
| [#2557](https://github.com/jackc/pgx/issues/2557) | Transaction rollback returns `conn closed` instead of `ErrTxDone` | Open | Low | Error type mismatch; no architecture component |
| [#2332](https://github.com/jackc/pgx/issues/2332) | panic: BUG: slow write timer already active | Open | Medium | Concurrency bug in write path; no architecture component |
| [#2466](https://github.com/jackc/pgx/pull/2466) | perf(trace): optimize traceSingleQuotedString (PR) | Open PR | Low | Performance improvement; benchmark data available (arm64 only) |

**Recently fixed correctness bugs (affecting riscv64 as any 64-bit platform):**

| ID | Title | Fixed in | Severity | Notes |
|---|---|---|---|---|
| [#2520](https://github.com/jackc/pgx/issues/2520) | `FunctionCall.Decode` broken null sentinel on 64-bit platforms | v5.8.x | High | Missing `int32()` cast made null sentinel dead code on all 64-bit platforms including riscv64; caused panic |
| [#2415](https://github.com/jackc/pgx/issues/2415) | pgtype: NUMERIC binary decode hangs / infinite loop for large-weight values | Fixed | High | int16 overflow in intermediate calculation; affected all platforms |
| [PR #2599](https://github.com/jackc/pgx/pull/2599) | Fix infinite loop decoding binary numeric zero with ndigits > 0 | Merged Jul 2026 | High | Unnormalized zero from CockroachDB or poolers caused infinite loop |
| [PR #2598](https://github.com/jackc/pgx/pull/2598) | Encode numeric Infinity/-Infinity in JSON instead of 0 | Merged Jul 2026 | Medium | Infinity silently marshaled as 0 in JSON output |
| [#2429](https://github.com/jackc/pgx/issues/2429) | Optimize code/structs for memory alignment | Fixed | Low | Struct field alignment improvements; flagged by static analysis |

No riscv64-specific open bugs exist. All three targeted searches (`riscv64 performance repo:jackc/pgx`, `riscv64 bug repo:jackc/pgx`, `riscv nan floating repo:jackc/pgx`) returned zero results.

---

## 12. Objections and Upstream Blockers

There are no upstream blockers for riscv64 support of pgx. There are no stated objections from the maintainer. There are no organizational blockers. RISE Project has no recorded involvement.

The project has zero riscv64-related issues, PRs, or community discussion. This is not because riscv64 was rejected -- it is because no porting work was ever needed. A pure-Go library with no CGo compiles to riscv64 via the standard toolchain.

The only gap is CI: riscv64 is not tested upstream. Adding a riscv64 CI lane would require either riscv64 hardware or QEMU-based GitHub Actions. The project does not currently operate QEMU-based CI for any architecture.

---

## 13. Investment Analysis

RISE Project has not funded or contributed any work on pgx. There is nothing to exclude from sizing.

### 13.1 Functional Enablement

No work required. pgx compiles and runs correctly on riscv64 today via `GOOS=linux GOARCH=riscv64 go build ./...`. All features are available.

### 13.2 Performance Optimization

No pgx-level performance work is warranted. The library has no SIMD paths on any architecture. Any performance gap on riscv64 relative to amd64 or arm64 is attributable to:
1. The Go compiler's riscv64 backend code generation quality (Go team scope).
2. The PostgreSQL server's disabled JIT on riscv64 (PostgreSQL team scope).

Neither is addressable within pgx itself.

### 13.3 CI/CD Infrastructure

One actionable gap: upstream riscv64 CI does not exist. A single-maintainer project with no foundation backing is unlikely to accept a persistent riscv64 CI lane unless runner costs are externally sponsored. The effort to implement QEMU-based riscv64 integration tests in `.github/workflows/ci.yml` is low (1 person-week), but acceptance by the maintainer is uncertain.

### 13.4 Ecosystem Enablement

Not applicable. pgx is a Go library consumed as source via Go modules. There is no binary package ecosystem to enable.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | None required at pgx level | 0 | N/A | N/A |
| CI/CD | Add riscv64 QEMU-based CI lane to `.github/workflows/ci.yml`; requires maintainer acceptance | 1 | External contributor + jackc | Low |
| Ecosystem | None required | 0 | N/A | N/A |

The total incremental investment to achieve full riscv64 parity for pgx is 1 person-week, conditional on maintainer cooperation, and only required if upstream CI coverage is a goal. The functional work is already complete.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [jackc/pgx repository](https://github.com/jackc/pgx)
- [pgx CI workflow (.github/workflows/ci.yml)](https://github.com/jackc/pgx/blob/master/.github/workflows/ci.yml)
- [GitHub Issues API: riscv repo:jackc/pgx -- 0 results](https://github.com/search?q=riscv+repo%3Ajackc%2Fpgx&type=issues)
- [GitHub Issues API: riscv64 repo:jackc/pgx -- 0 results](https://github.com/search?q=riscv64+repo%3Ajackc%2Fpgx&type=issues)
- [Go 1.14 release notes (linux/riscv64 tier-2 support added)](https://go.dev/doc/go1.14)
- [Issue #2520: FunctionCall.Decode broken null sentinel on 64-bit platforms](https://github.com/jackc/pgx/issues/2520)
- [Issue #2415: NUMERIC binary decode hangs for large-weight values](https://github.com/jackc/pgx/issues/2415)
- [PR #2599: Fix infinite loop decoding binary numeric zero with ndigits > 0](https://github.com/jackc/pgx/pull/2599)
- [PR #2598: Encode numeric Infinity/-Infinity in JSON instead of 0](https://github.com/jackc/pgx/pull/2598)
- [Issue #2429: optimize code/structs for memory alignment](https://github.com/jackc/pgx/issues/2429)
- [PR #2618: perf(pgtype): reuse backing arrays during row scans (benchmark data)](https://github.com/jackc/pgx/pull/2618)
- [PR #2466: perf(trace): optimize traceSingleQuotedString (open, benchmark data)](https://github.com/jackc/pgx/pull/2466)
- [Issue #2551: TOC/TOU bug on transaction rollback](https://github.com/jackc/pgx/issues/2551)
- [Issue #2557: Transaction rollback returns conn closed instead of ErrTxDone](https://github.com/jackc/pgx/issues/2557)
- [Issue #2332: panic: BUG: slow write timer already active](https://github.com/jackc/pgx/issues/2332)
- [Ubuntu Noble package: golang-github-jackc-pgx-v4-dev](https://packages.ubuntu.com/noble/golang-github-jackc-pgx-v4-dev)
- [RISE Project wheel builder (pgx absent)](https://riseproject.gitlab.io/python/wheel_builder/)
- [jackc/puddle/v2 repository](https://github.com/jackc/puddle)
- [golang.org/x/text module](https://pkg.go.dev/golang.org/x/text)
- [golang.org/x/sync module](https://pkg.go.dev/golang.org/x/sync)