---
title: trillian
parent: Project Reports
color: orange
---

# trillian

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for trillian<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[google/trillian](https://github.com/google/trillian) is a transparent, scalable, cryptographically verifiable data structure library and server, originally designed as the backend for Certificate Transparency (RFC 6962). It implements append-only Merkle tree logs and maps, exposed via gRPC. Storage backends include MySQL, PostgreSQL, CockroachDB, and Google Cloud Spanner. The project is written entirely in Go (97% Go, 2% Shell per GitHub language stats) with no C, C++, or assembly in the default build.

**Status:** The project is in explicit maintenance mode. The README states no new features are planned and recommends [Tessera](https://github.com/transparency-dev/tessera) for new deployments. The latest release is v1.7.3 (2026-03-30); the first release was v1.0 (2018-02-05).

**Governance:** Corporate BDFL under Google. No foundation affiliation (not CNCF, not Linux Foundation, not OpenSSF). No `GOVERNANCE.md`. Contributions require a Google CLA. The `@google/trillian-team` GitHub team is the default code owner. Copyright holders in the AUTHORS file include Google LLC, Internet Security Research Group (ISRG), Sectigo Limited, and two individuals. License: Apache-2.0.

**Key maintainers:**

| GitHub | Name | Org | Activity |
|---|---|---|---|
| @mhutchinson | Martin Hutchinson | Google | Primary maintainer, CODEOWNERS |
| @AlCutter | Al Cutter | Google | CODEOWNERS |
| @roger2hk | Roger Ng | Google | Active maintainer |
| @robstradling | Rob Stradling | Sectigo | Active contributor |
| @fghanmi | Firas Ghanmi | Red Hat | MySQL/PostgreSQL TLS |
| @osmman | Tomas Turek | Red Hat | Election system fixes |

**Community stance on new ports:** No explicit platform tier policy or `PLATFORMS.md` exists. CONTRIBUTING.md asks contributors to file an issue before submitting a PR. Given maintenance-mode status, a riscv64 CI addition would face a high bar. The team's stated direction is toward Tessera, not Trillian.

**RISE involvement:** None. Trillian has zero RISE blog posts, no funded work, no riseproject-dev repository, and no RISE runner adoption. It appears only as a pending entry in the sw-ecosystem research queue (`queue.yml`) and as a named dependency in the [certificate-transparency-go report](project-reports/certificate-transparency-go.md).

## 2. Port History and Upstreaming Timeline

There is no riscv64 port history for trillian. The project has zero riscv64-specific commits, zero riscv64 issues, and zero riscv64 PRs. All riscv64 mentions in the repository are indirect, appearing only in dependency-bump PRs where upstream Go packages added riscv64 support.

| Date | Event | Source |
|---|---|---|
| 2021-03-22 | PR #2418 merged: prometheus/client_golang 1.9.0 -> 1.10.0, upstream changelog includes "Fix build on riscv64 (#833)" | [PR #2418](https://github.com/google/trillian/pull/2418) |
| 2023-05-26 | PR #3011 opened and closed same day: build log from a Sigstore/Rekor contributor shows `ko publish --platform=all` targeting `linux/riscv64` alongside amd64, arm64, ppc64le, s390x -- PR was not merged | [PR #3011](https://github.com/google/trillian/pull/3011) |
| 2023-08-07 | PR #3053 closed (not merged): golang.org/x/sys 0.10.0 -> 0.11.0, upstream adds `riscv_hwprobe` syscall for riscv64 | [PR #3053](https://github.com/google/trillian/pull/3053) |
| 2024-09-10 | PR #3617 merged: golang.org/x/sys 0.24.0 -> 0.25.0, upstream adds RISC-V extension detection and riscv64 hwprobe for Linux kernel 6.10 | [PR #3617](https://github.com/google/trillian/pull/3617) |
| 2026-06-04 | PR #3891 closed (not merged): golang.org/x/sys 0.44.0 -> 0.45.0, upstream adds `zbc` extension detection for riscv64 | [PR #3891](https://github.com/google/trillian/pull/3891) |

No contributor has ever filed a riscv64 tracking issue, submitted a riscv64 CI PR, or made any riscv64-specific code change to trillian. The project builds for `linux/riscv64` as a free consequence of Go's cross-compilation, not as the result of any porting effort.

## 3. Upstream Support Tier

No formal tier policy document exists (`PLATFORMS.md`, `SUPPORT.md`, or equivalent: not found). All CI runs exclusively on `ubuntu-latest` (x86_64) GitHub-hosted runners and Google Cloud Build `E2_HIGHCPU_32` (x86_64) machines. There are no riscv64 runners, no QEMU emulation steps, and no architecture matrix entries in any CI file.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | No | No |
| CI tests | Yes | No | No |
| Release binaries | No (Go module only) | No | No |
| Container images (official) | No confirmed multi-arch release pipeline | No | No |
| Ubuntu 26.04 package | arch:all (source library) | arch:all | arch:all |
| OpenSSF Scorecard | 8/10 (2026-08-25) | -- | -- |

Note on the container image claim: PR #3011 (closed, not merged) contains a build log showing `ko publish --platform=all` targeting `linux/riscv64`. This is evidence that a contributor's local build included riscv64, not that the official release pipeline produces riscv64 images. The committed `cloudbuild_tag.yaml` uses `kaniko` with no `--platform` flag and no multi-arch configuration. No riscv64 container image is produced by the official CI.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Trillian has no architecture-specific subsystems. A full recursive scan of all 678 files in the repository found zero occurrences of `riscv`, `riscv64`, `arm64`, `amd64`, `simd`, `neon`, `avx`, `sse`, `jit`, or `asm` in any source file. There are no assembly files (`.S`, `.asm`), no C or C++ files, no arch-suffixed Go files (`_riscv64.go`, `_amd64.go`, `_arm64.go`), and no `arch/` directory.

The project's hot paths are:

- **Merkle tree hashing:** SHA-256 via Go's `crypto/sha256` standard library. No hand-written SIMD or intrinsics in trillian itself. The Go runtime's `crypto/sha256` has scalar assembler for riscv64 as of Go 1.21+ (delivered by RISE RP001 per the [RISE blog post on Go RISC-V progress](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)).
- **gRPC transport:** Pure Go via `google.golang.org/grpc`.
- **Database I/O:** Pure Go drivers (go-sql-driver/mysql, jackc/pgx).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Merkle hashing (SHA-256) | Go stdlib (asm in runtime) | Go stdlib (asm in runtime) | Go stdlib (scalar asm via RISE RP001) |
| gRPC transport | Pure Go | Pure Go | Pure Go |
| Storage drivers | Pure Go | Pure Go | Pure Go |
| JIT | None | None | None |
| SIMD dispatch | None | None | None |
| Assembly files | 0 | 0 | 0 |
| Arch-specific source files | 0 | 0 | 0 |

The absence of arch-specific files is the correct state for this project, not a gap. riscv64 is architecturally equivalent to every other supported platform.

The only feature-gated code is `crypto/keys/pkcs11/` (build tag `pkcs11`), which wraps a PKCS#11 C library via CGo. This is a feature gate, not an architecture gate, and is discussed in Section 5.

## 5. Build System, Cross-Compilation, and Toolchain

The build system is standard Go modules (`go build`, `go test`). There is no CMake, autoconf, or Makefile. No `BUILDING.md` or `INSTALL` file exists.

**Go version requirements:**
- `go.mod` minimum: Go 1.25.0
- Toolchain directive: `go1.25.11`
- Dockerfile pinned version: `golang:1.26.4-bookworm`
- riscv64 support in Go: since Go 1.14; all versions >= 1.25 work

**Standard cross-compilation (no CGo):**

```bash
git clone https://github.com/google/trillian.git
cd trillian
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...
```

**With MySQL backend only (recommended for riscv64 deployments):**

```bash
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build -tags=mysql \
  ./cmd/trillian_log_server ./cmd/trillian_log_signer
```

**Build tags and riscv64 status:**

| Tag | Effect | riscv64 Status |
|---|---|---|
| (none) | All backends | Works |
| `-tags=mysql` | MySQL/MariaDB only | Works; use MariaDB (has riscv64 images), not MySQL 8.4 (no official riscv64 image) |
| `-tags=postgresql` | PostgreSQL only | Works |
| `-tags=cloudspanner` | Cloud Spanner only | Works (pure Go) |
| `-tags=crdb` | CockroachDB only | Avoid: testbase Dockerfile hardcodes `cockroach-v22.2.7.linux-amd64.tgz`; no riscv64 CockroachDB binary exists |
| `-tags=pkcs11` | PKCS#11 HSM support | CGo required; needs `libp11-dev`/SoftHSM2 and `gcc-riscv64-linux-gnu` for cross-compile; all required C libraries are available in Ubuntu 26.04 riscv64 |
| `-tags=batched_queue` | Batched queue mode | Works |

**Known build blockers in the testbase Dockerfile** (`integration/cloudbuild/testbase/Dockerfile`):

1. `cockroach-v22.2.7.linux-amd64.tgz` -- hardcoded amd64 binary; no riscv64 CockroachDB release exists.
2. `protoc-3.20.1-linux-x86_64.zip` -- hardcoded x86_64 binary; workaround is `apt-get install protobuf-compiler` (needed only for code generation, not runtime).
3. MySQL 8.4 Docker image -- no official riscv64 image; workaround is `mariadb:11.1`.

**QEMU:** Not referenced anywhere in the repository. No QEMU-based testing, emulation setup, or user-mode QEMU in CI.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Core Merkle log | Full | Full | Full | None |
| Core Merkle map | Full | Full | Full | None |
| MySQL backend | Full | Full | Full | None |
| PostgreSQL backend | Full | Full | Full | None |
| Cloud Spanner backend | Full | Full | Full | None |
| CockroachDB backend | Full | Full | Build only (no server binary) | No official CockroachDB riscv64 binary |
| PKCS#11 HSM keys | Full (CGo) | Full (CGo) | Full (CGo, cross-compile required) | None functional; cross-compile setup more complex |
| Race detector (`-race`) | Yes | Yes | No | Go toolchain limitation on riscv64 |
| etcd coordination | Full | Full | Requires `ETCD_UNSUPPORTED_ARCH=riscv64` env var | etcd upstream refuses to start on riscv64 without this flag; issue #21509 closed June 2026 with "no plans" |

**Floating-point / NaN:** Not applicable. Trillian performs Merkle tree hashing (SHA-256/SHA-512), gRPC serving, and SQL storage. No floating-point arithmetic exists in any hot path. Zero NaN/floating-point issues found.

**Performance gap:** No published benchmark data exists for any architecture (see Section 11). Trillian is I/O-bound (database operations, gRPC, Merkle hashing). The SHA-256 hot path benefits from scalar assembler added to Go's `crypto/sha256` for riscv64 by RISE RP001. No SIMD or vectorized code paths exist in trillian itself. Expected performance gap vs arm64: minimal [NEEDS VERIFICATION -- no benchmark data exists].

**Security hardening:** The race detector (`-race`) is not available on riscv64 due to a Go toolchain limitation. This affects test coverage quality, not production correctness.

## 7. CI/CD Infrastructure

No riscv64 CI exists in google/trillian. Every CI file was read directly from the repository and confirmed to contain zero occurrences of `riscv`, `risc-v`, or any riscv64 runner reference.

| CI File | Runner | riscv64 |
|---|---|---|
| `.github/workflows/codeql.yml` | `ubuntu-latest` (x86_64) | None |
| `.github/workflows/golangci-lint.yml` | `ubuntu-latest` (x86_64) | None |
| `.github/workflows/govulncheck.yml` | `ubuntu-latest` (x86_64) | None |
| `.github/workflows/scorecard.yml` | `ubuntu-latest` (x86_64) | None |
| `.github/workflows/test_crdb.yaml` | `ubuntu-latest` / `ubuntu-22.04` (x86_64) | None |
| `.github/workflows/test_pgdb.yaml` | `ubuntu-latest` (x86_64) | None |
| `cloudbuild.yaml` | GCB `E2_HIGHCPU_32` (x86_64) | None |
| `cloudbuild_master.yaml` | GCB `E2_HIGHCPU_32` (x86_64) | None |
| `cloudbuild_pr.yaml` | GCB `E2_HIGHCPU_32` (x86_64) | None |
| `cloudbuild_tag.yaml` | GCB `E2_HIGHCPU_32` (x86_64) | None |

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | No | No |
| Test CI | Yes | No | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |
| Release pipeline | kaniko (single-arch) | No | No |

The `ko publish --platform=all` reference in PR #3011 (which would have included `linux/riscv64`) came from a single closed, unmerged PR's build log. It is not reflected in any committed CI configuration. The official release pipeline (`cloudbuild_tag.yaml`) uses `kaniko` with no `--platform` flag.

## 8. Distribution and Release Status

**GitHub releases:** v1.7.3 (2026-03-30) through v1.6.1 (2024-08-28) -- zero binary assets in any release. Trillian is distributed as a Go module; consumers use `go get github.com/google/trillian`.

**Ubuntu 26.04 (resolute):** `golang-github-google-trillian-dev` 1.7.2-1, `Architecture: all`, `universe` section. This is a Go source library package (`.go` files), not a compiled binary. It is one version behind upstream (1.7.2 vs upstream 1.7.3). The package installs on riscv64 because `arch:all` packages are architecture-independent, not because a riscv64 binary was compiled.

**Debian trixie:** `golang-github-google-trillian-dev` 1.6.1-1, `Architecture: all`. Same caveat: source library only.

**Arch Linux RISC-V:** Not packaged. The Arch Linux RISC-V extra database (14,398 packages) contains no trillian entry.

**PyPI:** A package named `trillian` exists at version 0.0.0 with summary "place holder" -- this is a namespace squatter unrelated to google/trillian.

**OCI container images:** No official riscv64 container image is produced by the upstream release pipeline. The `cloudbuild_tag.yaml` uses `kaniko` with no multi-arch flags.

**To obtain a working riscv64 binary:** Cross-compile from source using `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build -tags=mysql ./cmd/trillian_log_server`. No pre-built binary is available from any official channel.

## 9. Dependencies

All 41 direct Go module dependencies are pure Go and compile on riscv64 without modification. The single meaningful runtime blocker is etcd.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| google.golang.org/grpc v1.82.1 | RPC transport | Yes (pure Go) | No CI | Go module only | None |
| google.golang.org/protobuf v1.36.11 | Protobuf serialization | Yes (pure Go) | No CI | Go module only | `protoc` binary (C++) needed only at code-gen time, not runtime; no riscv64 binary for protoc 3.20.1 |
| go.etcd.io/etcd v3.6.14 | Distributed coordination | Yes (pure Go) | No CI | No riscv64 binary | **Soft blocker:** etcd server refuses to start on riscv64 without `ETCD_UNSUPPORTED_ARCH=riscv64`; issue #21509 closed June 2026 with "no plans"; PR #21510 rejected; 12 riscv64 issues all closed without merging support |
| github.com/go-sql-driver/mysql v1.10.0 | MySQL driver | Yes (pure Go) | No CI | Go module only | None (1 closed riscv64 issue from 2020) |
| github.com/jackc/pgx/v5 v5.10.0 | PostgreSQL driver | Yes (pure Go) | No CI | Go module only | None |
| github.com/prometheus/client_golang v1.23.2 | Metrics | Yes (pure Go) | No CI | Go module only | None (riscv64 build fix merged upstream in 2021) |
| cloud.google.com/go/spanner v1.91.0 | Cloud Spanner backend | Yes (pure Go) | No CI | Go module only | None; not packaged in Ubuntu 26.04 riscv64 (cloud-only backend) |
| github.com/cockroachdb/cockroach-go/v2 v2.4.3 | CockroachDB client | Yes (pure Go) | No CI | Go module only | Client library has no issues; CockroachDB server has no official riscv64 binary |
| k8s.io/client-go v0.35.5 | Kubernetes integration | Yes (pure Go) | No CI | Go module only | None for client-go; k8s/kubernetes has open #132836 (Official RISC-V Support proposal) |
| github.com/transparency-dev/merkle v0.0.2 | Merkle tree core | Yes (pure Go) | No CI | Go module only | None |
| github.com/letsencrypt/pkcs11key/v4 v4.0.1 | HSM key management (opt-in) | Yes (CGo, requires libpkcs11) | No CI | No binary | None; all required C libraries available in Ubuntu 26.04 riscv64 |
| github.com/go-redis/redis v6.15.9 | Redis quota backend | Yes (pure Go) | No CI | Go module only | None |
| golang.org/x/crypto v0.52.0 | Cryptographic primitives | Yes (pure Go fallbacks) | No CI | Go module only | None; has asm for AES/SHA/ChaCha20 on x86/arm64; pure-Go fallbacks active on riscv64 |
| golang.org/x/sys v0.45.0 | OS syscall wrappers | Yes (riscv64 support since 2019) | No CI | Go module only | None; riscv64 syscall definitions well-maintained |
| MySQL server (runtime) | Storage backend server | Community build | No Oracle CI | Community only | No Oracle riscv64 support; community PR #639 auto-closed; use MariaDB as workaround |
| PostgreSQL server (runtime) | Storage backend server | Yes | Community CI | Ubuntu ships it | None |

**etcd deep-dive:** etcd is the only dependency with a meaningful riscv64 runtime blocker. The server binary builds and runs correctly on riscv64 but contains an explicit architecture guard that prints an error and exits unless `ETCD_UNSUPPORTED_ARCH=riscv64` is set in the environment. Upstream issue #21509 was closed in June 2026 with the maintainer stating "No plans" to officially support riscv64. PR #21510 was rejected. Ubuntu 26.04 ships etcd 3.5.16-10, while Trillian requires etcd v3.6.x -- a version gap that compounds the issue. The workaround (`ETCD_UNSUPPORTED_ARCH=riscv64`) is functional but unsupported.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist. The following are the open issues in the tracker as of the research date:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3914](https://github.com/google/trillian/issues/3914) | Unauthenticated remote crash: unbounded Count in GetLeavesByRange on PREORDERED_LOG trees | Open | High -- DoS/crash | `GetLeavesByRange` does not bound client-supplied `Count` before `make([]*trillian.LogLeaf, 0, count)`; passing `Count = math.MaxInt64` panics the entire `trillian_log_server` process; no gRPC interceptor recovers panics; affects all three SQL backends; reporter has a PR ready with a `1<<16` cap fix |
| [#3911](https://github.com/google/trillian/issues/3911) | Old opencensus dependency brings in security warnings | Open | Medium | Transitive CVEs from opencensus |
| [#3657](https://github.com/google/trillian/issues/3657) | PopulateLogTile error in MySQL storage tests | Open | Low | Bug, Low Priority label |
| [#3294](https://github.com/google/trillian/issues/3294) | Log client: WaitForRootUpdate "stuck" with concurrent calls to AddLeaf | Open | Medium | Liveness bug under concurrency |
| [#1188](https://github.com/google/trillian/issues/1188) | Investigate sequencer init tree latency | Open | Medium | Linear growth of sequencer latency as tree grows; `initMerkleTreeFromStorage` rebuilds subtree cache from scratch on every sequencer run; open since 2018-06-01; no exact latency numbers provided |
| [#420](https://github.com/google/trillian/issues/420) | Statement cache should be aware of errors | Open | Low | Correctness/reliability |
| [#733](https://github.com/google/trillian/issues/733) | Errors in sequencer aren't easily visible/exported anywhere | Open | Low | Observability |

Issue #3914 is the most critical: it is a fully unauthenticated remote crash affecting all SQL backends. A `TODO` comment in the source (`// TODO(pavelkalinnikov): Further clip count to a safe upper bound like 64k`) was never resolved. This is architecture-independent.

No published benchmark results exist for any architecture. The four benchmark functions in the test suite (`BenchmarkHStar3Root`, `BenchmarkHStar3Prepare`, `BenchmarkWriterBigBatch`, `BenchmarkRepopulateLogSubtree`) have never had results published for amd64, arm64, or riscv64.

## 12. Objections and Upstream Blockers

| Blocker | Type | Severity | Workaround |
|---|---|---|---|
| No riscv64 CI | Organizational | Medium | Add QEMU-based CI or RISE runner; project in maintenance mode makes acceptance unlikely |
| etcd server architecture guard | Technical (dependency) | Medium | Set `ETCD_UNSUPPORTED_ARCH=riscv64`; functional but unsupported; upstream has no plans to remove the guard |
| No official riscv64 container image | Organizational | Low | Build from source with `ko --platform=linux/riscv64` or cross-compile |
| CockroachDB: no riscv64 server binary | Technical (dependency) | Low | Use MySQL (MariaDB) or PostgreSQL backends instead |
| MySQL 8.4: no official riscv64 image | Technical (dependency) | Low | Use MariaDB 11.1 (has riscv64 images) |
| protoc 3.20.1: no riscv64 binary | Technical (build-time only) | Low | `apt-get install protobuf-compiler`; only needed for code generation |
| Maintenance mode | Organizational | High | New CI additions face high bar; team recommends Tessera for new deployments |
| Race detector unavailable on riscv64 | Go toolchain limitation | Low | Affects test quality, not production correctness |

The most significant organizational blocker is maintenance mode. The upstream team has explicitly stated that Tessera is the successor. A riscv64 CI PR would need to be low-friction (e.g., a single QEMU workflow addition with no code changes) to have any acceptance probability.

## 13. Readiness Assessment

**Color:** orange (no upstream riscv64 CI; distribution floor does not apply -- no distro ships a compiled riscv64 binary, only an arch:all source library package)

**Release provider:** none -- no upstream riscv64 binary, no RISE involvement, no distro compiled binary

**Justification:** google/trillian has no riscv64 CI of any kind. All six GitHub Actions workflows and all four Cloud Build configurations run exclusively on x86_64. The Ubuntu 26.04 `golang-github-google-trillian-dev` package is `arch:all` (Go source files, not a compiled binary) and does not constitute a distribution floor for a compiled artifact. The project is pure Go and cross-compiles to riscv64 without code changes, but this has never been tested or validated in any CI environment. The etcd dependency requires a non-default environment variable (`ETCD_UNSUPPORTED_ARCH=riscv64`) to start on riscv64, and upstream has closed the tracking issue with no plans to address it.

**Pending work that could change the grade:** No open PRs or RISE involvement exist. A QEMU-based CI addition (single workflow file, no code changes) would move the grade to yellow. If upstream also published multi-arch container images via `ko --platform=all`, the grade would move to blue. Neither is planned or in progress.

## 14. Investment Analysis

RISE has no existing investment in trillian. The project is in maintenance mode; the upstream team recommends Tessera for new deployments. Investment in trillian riscv64 CI should be weighed against investing in [Tessera](https://github.com/transparency-dev/tessera) instead.

### 14.1 Functional Enablement

The project cross-compiles to riscv64 today without code changes. No functional enablement work is required in trillian itself. The etcd workaround (`ETCD_UNSUPPORTED_ARCH=riscv64`) is a one-line environment variable addition in deployment configuration, not a code change.

The testbase Dockerfile requires three substitutions for riscv64: replace `cockroach-v22.2.7.linux-amd64.tgz` with a PostgreSQL or MariaDB test path, replace `protoc-3.20.1-linux-x86_64.zip` with `apt-get install protobuf-compiler`, and replace MySQL 8.4 with MariaDB 11.1. These are low-effort changes.

### 14.2 Performance Optimization

No performance optimization work is applicable. Trillian has no architecture-specific code, no SIMD, no JIT, and no hand-written assembly. The SHA-256 hot path is handled by Go's standard library, which already has scalar assembler for riscv64 via RISE RP001. No further optimization investment is warranted for trillian itself.

### 14.3 CI/CD Infrastructure

The minimum viable CI addition is a single GitHub Actions workflow using QEMU (`docker/setup-qemu-action`) to run `go test ./...` on riscv64. This requires no code changes and no upstream binary dependencies. Acceptance probability is low given maintenance mode, but the PR would be low-friction.

A RISE runner addition (native riscv64 hardware) would eliminate QEMU overhead and is the preferred approach if CI is added.

### 14.4 Ecosystem Enablement

Not applicable. Trillian is a Go library/server with no dependent package ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix testbase Dockerfile for riscv64 (replace amd64-only binaries with riscv64-compatible alternatives) | 0.5 | Contributor | Medium |
| Functional | Document `ETCD_UNSUPPORTED_ARCH=riscv64` requirement in deployment docs | 0.1 | Contributor | Low |
| CI/CD | Add QEMU-based riscv64 test workflow (single `.github/workflows/test_riscv64.yaml`) | 1 | Contributor | Medium |
| CI/CD | Adopt RISE runners for native riscv64 CI (replaces QEMU workflow) | 0.5 | RISE / Contributor | Low |
| Functional | Evaluate Tessera instead of Trillian for new riscv64 deployments | 0.5 | Architecture | High |

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [google/trillian repository](https://github.com/google/trillian)
- [Tessera -- successor project](https://github.com/transparency-dev/tessera)
- [transparency.dev community site](https://transparency.dev)
- [PR #2418 -- prometheus/client_golang bump with riscv64 build fix](https://github.com/google/trillian/pull/2418)
- [PR #3011 -- go.sum fix with