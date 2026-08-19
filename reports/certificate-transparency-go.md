---
title: certificate-transparency-go
---

# certificate-transparency-go

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for certificate-transparency-go<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

certificate-transparency-go is Google's Go implementation of Certificate Transparency (CT) log tooling: CTFE (CT front-end), log-list handling, x509 parsing, and the client libraries used by CT log operators. It is a pure-Go module with no CMake/Autotools build system.

Governance: no formal foundation. Not under Linux Foundation, CNCF, or OpenSSF. [certificate.transparency.dev](https://certificate.transparency.dev/) states the project "started by engineers at Google, for the internet," now operating as a decentralized ecosystem of independent log operators and monitors coordinated via GitHub and a Google Group, under the umbrella brand "transparency.dev." No GOVERNANCE.md, MAINTAINERS.md, SUPPORT.md, or PLATFORMS.md exist in the repo (all confirmed 404). CODEOWNERS is a single blanket rule, `* @google/certificate-transparency`, meaning a private Google-managed GitHub team owns the entire codebase with no distributed maintainer-by-subsystem model. License: Apache 2.0. Contribution requires a Google CLA (individual or corporate).

Corporate contributors, overwhelmingly Google-employed:

| Contributor | Company field | Commits/role |
|---|---|---|
| David Drysdale | none set (long-time Google) | 657 commits, historical top committer |
| Roger Ng | @Google | Current most-active maintainer, merges most PRs today |
| Al Cutter | none set (Google) | 120 commits |
| Pavel Kalinnikov | @cockroachlabs (ex-Google) | 94 commits |
| Martin | @Google UK | 87 commits |
| Pierre Phaneuf | @google | 77 commits |
| Martin Hutchinson | Google | Active (CTFE work, 2026) |
| Philippe Boneff | Google | Active (2026 commits) |
| Gary Belvin | "GDB Security" (was Google) | 37 commits |
| Rob Stradling | @Sectigo | 12 commits, the sole significant non-Google corporate contributor |

The wider CT ecosystem (per certificate.transparency.dev) credits Apple, Google, Censys, Cloudflare, DigiCert, Geomys, IPng Networks, Let's Encrypt, Sectigo, SSLMate, and TrustAsia with contributing "time, expertise, and resources," but these are mostly CT-log operators, not committers to this specific repository.

Community culture on portability: no explicit port-acceptance policy document exists, but two precedents are instructive. [Issue #1539 / PR #1540](https://github.com/google/certificate-transparency-go/issues/1539) (2024): a reporter hit int-overflow build failures on 32-bit (i386, via Debian autopkgtest) and stated "due to the CLA requirement I won't be submitting a pull request"; Google maintainer Roger Ng fixed it himself within days and merged it. [Issue #1118 / PR #1119](https://github.com/google/certificate-transparency-go/issues/1118) (2023): removed the glibc dependency from the `ct_server` binary (switched to a distroless static build), a general portability improvement. The pattern suggests Google maintainers absorb portability fixes personally rather than requiring outside contributors to clear CLA friction.

RISE project membership: certificate-transparency-go is not a RISE project and has no RISE involvement of any kind (see Section 7). Google LLC is a RISE Premier member at the company level (alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent), but Certificate Transparency tooling is not listed anywhere in RISE materials and there is no evidence this project draws on that membership.

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. Exhaustive search (GitHub issue/PR/commit/code search, WebSearch) found zero genuine RISC-V-related commits, issues, or PRs for this repository.

| Date | Event | Source |
|---|---|---|
| 2020 | Go adds experimental `GOOS=linux GOARCH=riscv64` (Go 1.14) - upstream Go toolchain work, not project-specific | Cited in dependency/toolchain findings |
| 2021-03-22 | Dependabot opens [PR #783](https://github.com/google/certificate-transparency-go/pull/783), bumping `prometheus/client_golang` 1.9.0 to 1.10.0; the auto-included upstream changelog text quoted in the PR body incidentally contains "Fix build on riscv64," describing a fix in the dependency itself | [PR #783](https://github.com/google/certificate-transparency-go/pull/783) |
| 2021-03-30 | PR #783 closed unmerged (`merged_at: null`) after CI failures traced to the repo being pinned on Go 1.11 (unrelated to architecture); superseded by a later dependency bump | [PR #783](https://github.com/google/certificate-transparency-go/pull/783) |
| 2024-11-01 | [Issue #1606](https://github.com/google/certificate-transparency-go/issues/1606) opened: darwin-amd64 build failure with `CGO_ENABLED=1`, the repo's only tracked non-standard-architecture build issue, and it is not RISC-V | [Issue #1606](https://github.com/google/certificate-transparency-go/issues/1606) |
| N/A | No riscv64 commit, issue, PR, or CI job has ever been filed or merged in this repository | Exhaustive `gh` search across issues/PRs/commits/code |

Key contributors with orgs: none - no RISC-V-specific contribution exists to attribute.

Is it fully upstream? Not applicable. There is no RISC-V port work to upstream. Any riscv64 capability this project has is entirely inherited, unmodified, from the Go toolchain's own linux/riscv64 port (experimental since Go 1.14/2020, cgo support since Go 1.16). No certificate-transparency-go-specific engineering (code, tests, CI, docs) has ever targeted riscv64.

## 3. Upstream Support Tier

certificate-transparency-go has no architecture-tier policy of its own. It is a pure Go module (go.mod requires `go 1.25.0`, toolchain `go1.25.11`; README states "Go version 1.24," stale relative to go.mod), and its architecture support is a direct pass-through of whatever the Go toolchain supports. Per go.dev/wiki/PortingPolicy (as referenced in dependency findings), linux/riscv64 is a Secondary Port in the Go toolchain, not First Class: breaking it does not block a Go release, Google's Go team does not own a builder for it, and named community port-maintainers are responsible instead.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage (this repo) | Yes, all 4 GitHub Actions workflows + 4 Cloud Build configs run on `ubuntu-latest` | None found | None, zero riscv64 references in any CI file |
| Official release binaries | None, GitHub Releases ship 0 assets for any architecture (all 20 releases checked) | None | None |
| Architecture-specific code in repo | 0 files | 0 files | 0 files |
| Go toolchain tier | Primary/First Class | Primary/First Class | Secondary Port |
| Race detector (`-race`) support | Yes | Yes | No, unsupported GOARCH |

Because the project has zero architecture-specific code for amd64 or arm64 either, the "support tier" question resolves almost entirely to the Go toolchain's own tiering rather than to any certificate-transparency-go-specific decision.

## 4. Technical Architecture and RISC-V-Specific Subsystems

certificate-transparency-go contains zero RISC-V-specific code, and, notably, zero amd64- or arm64-specific code either. Of 493 total repo files, this is a pure-Go module with no assembly (`.s`/`.S`) files of any kind, no JIT, no hand-written SIMD/vector intrinsics, and no custom GC barriers (it uses the stock Go runtime GC). The only cgo code path in the entire repository is `x509/root_cgo_darwin.go`, which links macOS's Security.framework for keychain access and is gated `!arm && !arm64 && !ios` - this excludes cgo on ARM Macs for build reasons, not a RISC-V or general CPU-architecture differentiation, and has no bearing on Linux/riscv64.

A repo-wide `go:build` tag inventory found 15 hits, all OS-based (darwin, windows/go1.11, wasip1, zos, plan9, bsd, unix) or Go-version-based; none reference riscv64, amd64, or arm64 as CPU architectures. The one architecture-adjacent hit is `x509/rpki_test.go`, gating `TestParseRPKIAddrBlocks`:

```go
//go:build amd64 || arm64 || ppc64le || ppc64 || mips64le || mips64 || s390x
```

This tag is inherited verbatim from the upstream Go standard library's `crypto/x509` package (certificate-transparency-go vendors/forks Go's x509 implementation for legacy Go-version compatibility). It omits riscv64 from an already-idiosyncratic architecture allowlist that also omits 386, arm, mips, mipsle, and wasm, likely because the test predates riscv64 support in upstream Go or was never updated. It gates no RISC-V-specific behavior.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A, none in project | N/A | N/A |
| SIMD/vector intrinsics | None (pure Go) | None (pure Go) | None (pure Go) |
| Hand-written assembly | 0 files | 0 files | 0 files |
| Crypto paths | Go stdlib crypto/x509, no project-specific arch dispatch | Same | Same |
| GC barriers | Stock Go runtime (shared across GOARCH) | Same | Same |
| cgo paths | 1 file (darwin-only) | Excluded from that file for build reasons unrelated to RISC-V | N/A |

Rating: Missing, but not a gap relative to other architectures - amd64 and arm64 score identically to riscv64 (zero architecture-specific files each). The project is 100% portable Go with a single Darwin-only cgo exception unrelated to CPU architecture. Under the Go toolchain's own `GOOS=linux GOARCH=riscv64` support, this code is expected to build and run without modification, but there is no explicit riscv64 enablement, testing, CI coverage, or tracking issue/PR confirming anyone has verified this in practice.

## 5. Build System, Cross-Compilation, and Toolchain

No riscv64-specific build documentation, CMake, cross-compilation toolchain file, or Dockerfile exists. This is a pure Go module built with `go build`/`go test`. `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, and any riscv64 CMake toolchain file all 404 (do not exist).

Implied build command for riscv64 (undocumented, untested by upstream): `GOOS=linux GOARCH=riscv64 go build ./...`.

Toolchain versions and why:
- go.mod requires `go 1.25.0`, toolchain pinned `go1.25.11`; README states Go 1.24 (stale vs go.mod).
- Go's riscv64 history: Go 1.14 added experimental `GOOS=linux GOARCH=riscv64` (no cgo); Go 1.16 added cgo support for linux/riscv64 plus `-buildmode=pie`. Since this project requires Go 1.25, that groundwork is long available.

Only 3 Dockerfiles exist, none riscv64-specific:
1. `integration/Dockerfile` (CI test base image): based on `golang:1.26.5-bookworm`, hardcodes downloading `protoc-3.20.1-linux-x86_64.zip`, not architecture-parameterized. protoc 3.20.1 has no riscv64 release asset published upstream (verified against v3.20.1; even the current v36.0-rc2 release ships only aarch64/ppcle_64/s390_64/x86_32/x86_64 for Linux). A riscv64 build would need a source-built protoc or Debian's riscv64-built `protobuf-compiler` package (3.21.12-16, sid) as a substitute.
2. `trillian/examples/deployment/docker/ctfe/Dockerfile` (production `ct_server` image): plain `go build ./trillian/ctfe/ct_server` from `golang:1.26.5-bookworm`, output copied into `gcr.io/distroless/base-debian12`. No explicit CGO flags and no arch-specific RUN step. Both base images publish riscv64 variants, so this Dockerfile would likely build for riscv64 unmodified via `docker buildx build --platform linux/riscv64`, but this has never been tested or documented by upstream.
3. `trillian/examples/deployment/docker/envsubst/Dockerfile`: Alpine 3.24 + `gettext`, an unrelated config-templating helper; both available on riscv64.

QEMU usage: none found anywhere in the repo.

Known build-affecting facts relevant to riscv64 (all inherited from the Go toolchain, none project-specific):
- Go's race detector (`-race`) does not support riscv64 as a GOARCH (supported: linux/amd64, linux/ppc64le, linux/arm64, linux/s390x, linux/loong64, freebsd/amd64, netbsd/amd64, darwin/amd64, darwin/arm64, windows/amd64). This blocks 3 of 6 CI test steps in `cloudbuild.yaml` - `race_detection`, `etcd_with_race`, `with_pkcs11_and_race` (all set `GOFLAGS=-race`) - from ever running on riscv64.
- `with_pkcs11_and_race` also pulls in `github.com/letsencrypt/pkcs11key` -> `github.com/miekg/pkcs11`, cgo-based (`import "C"`, `#cgo linux LDFLAGS: -ldl`), requiring a working cgo toolchain (available on riscv64 since Go 1.16) plus system `libpkcs11`. Combined with the `-race` blocker, this step is doubly blocked on riscv64.
- `golangci-lint` is pinned v1.61.0 in `integration/Dockerfile` and v2.10.1 in `.github/workflows/golangci-lint.yml` (via `golangci-lint-action`). v2.10.1 confirmed to ship official riscv64 binaries (`golangci-lint-2.10.1-linux-riscv64.{tar.gz,deb,rpm}`); v1.61.0's riscv64 asset availability was not independently verified [NEEDS VERIFICATION].
- `protoc` v3.20.1 has no riscv64 official binary (see above); practical substitute is Debian's riscv64-built `protobuf-compiler`.

GORISCV64 microarchitecture profile: not referenced anywhere in the repo. If cross-compiled or built natively, it would default to Go's `rva20u64` baseline (most portable); the project never sets `GORISCV64` to enable newer profiles (`rva22u64`, `rva23u64`) or extensions like Zba/Zbb/Zbs/vector.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core CT log / CTFE functionality | Functional (pure-Go portability, not independently riscv64-tested) | Functional (same caveat) | Not tested/confirmed; theoretically buildable, unverified in practice |
| `-race` test coverage in CI | Yes | Not run in this repo's CI either (no arm64 job found) | No, Go's race detector does not support riscv64 |
| PKCS#11/HSM support (`pkcs11` build tag) | Yes (cgo works) | Not verified in this repo's CI | Theoretically possible since Go 1.16 cgo riscv64 support, but untested here |
| Official release binaries | None (0 assets on all releases, any platform) | None | None |
| Debian packaging | arch:all (source package) | arch:all | arch:all, identical, no per-arch gap since package is arch-independent |

Functional gaps: none identified specific to certificate-transparency-go's own code, because the project has no architecture-specific implementation for amd64 or arm64 either. The only concrete "cannot do X" gap is that CI's `-race` steps cannot run on riscv64, a Go-toolchain-level limitation, not a certificate-transparency-go code gap.

Performance gaps: Data not available: no RISC-V benchmark data exists for certificate-transparency-go on any channel searched (GitHub issues/PRs, RISE blog, web search). Since the project has no SIMD or hand-tuned crypto paths of its own, there is no basis to estimate a delta-from-missing-SIMD performance gap.

Security hardening gaps: Data not available: no RISC-V-specific security-hardening discussion (PIE, ASLR, W^X, pointer-authentication equivalents) was found for this project.

NaN / floating-point semantics: Data not available: no discussion found; certificate-transparency-go performs DER/ASN.1 parsing, Merkle-tree hashing, and gRPC/HTTP serving, none of which is architecture-sensitive floating-point work per the research.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Confirmed by directly fetching and reading the full raw content of every CI configuration file in the repository.

| File | Trigger | Runner | "riscv" match |
|---|---|---|---|
| [`codeql.yml`](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/codeql.yml) | push (master), pull_request (master), scheduled cron | ubuntu-latest | None |
| [`golangci-lint.yml`](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/golangci-lint.yml) | push, pull_request (all branches) | ubuntu-latest | None |
| [`govulncheck.yml`](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/govulncheck.yml) | push (master), pull_request (master) | ubuntu-latest (implicit, via golang/govulncheck-action) | None |
| [`scorecard.yml`](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/scorecard.yml) | branch_protection_rule, schedule, push (master) | ubuntu-latest | None |

All 4 Cloud Build configs (`cloudbuild.yaml`, `cloudbuild_master.yaml`, `cloudbuild_postgresql.yaml`, `cloudbuild_tag.yaml`) were fetched in full: no "riscv" match in any. No other CI system exists - `.circleci`, `.travis.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `azure-pipelines.yml` all 404.

There is no build matrix, architecture dimension, QEMU step, or self-hosted riscv64 runner label anywhere. Every job runs on GitHub-hosted x86_64 (`ubuntu-latest`) runners, targeting default `amd64` GOARCH, with no cross-compilation step.

RISE runners/hardware: none used. Exhaustive checks of riseproject.dev's blog (33 posts, May 2024 - Aug 2026), the RISE member list, the `riseproject-dev` GitHub org (48 repos as of Aug 2026, including the Language Runtimes WG repo's 62 Go-runtime issues and the Security Software WG repo's single OP-TEE issue), and a direct probe (`riseproject-dev/certificate-transparency-go` returns 404) confirm zero RISE involvement with this project.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI | Yes (all 4 workflows) | No dedicated job | No dedicated job |
| Cloud Build CI | Yes (all 4 configs) | No | No |
| RISE-hosted runners | No | No | No |
| Any cross-arch/QEMU step | No | No | No |

## 8. Distribution and Release Status

No official riscv64 binaries or packages exist for certificate-transparency-go on any channel checked.

GitHub Releases: 20 releases spanning v1.0.18 to v1.3.3 (2018-2026). `gh release view <tag> --json assets` across all 20 tags shows every release has an empty asset list - git-tag-only releases with auto-generated source archives, zero uploaded binaries for any architecture. There is no riscv64-specific gap here; there are no compiled release artifacts of any kind to check.

PyPI: `https://pypi.org/pypi/certificate-transparency-go/json` returns HTTP 404. No such package exists, expected since this is a Go module.

RISE wheel builder: redirects to the same 404'd PyPI page. Not present.

Debian: exact name `certificate-transparency-go` 404s on the tracker. The actual source package is [`golang-github-google-certificate-transparency`](https://tracker.debian.org/pkg/golang-github-google-certificate-transparency), 1.3.3-1 in sid/forky, 1.3.1-2 in trixie. Its buildd status page shows arch: all and explicitly states "No entry in riscv64 database, check Packages-arch-specific" - an identical notice also appears for loong64, ppc64el, s390x, and alpha on the same page, confirming this is the generic arch:all "not applicable" pattern, not an active-but-failing riscv64 build.

Ubuntu 24.04 (noble): no exact-name match. A broader search surfaces `golang-github-google-certificate-transparency-dev` (0.0~git20160709.0.0f6e3d1~ds1-3, universe, arch: all), a stale 2016 snapshot, again arch-independent rather than riscv64-specific.

Arch Linux / Arch Linux RISC-V: not packaged at all, on either the mainline x86_64 database or the Arch Linux RISC-V status page (17,000+ lines checked; no "certificate-transparency" token found, only unrelated substring matches like `khealthcertificate`).

What a user must do for a working riscv64 binary: build from source, e.g. `GOOS=linux GOARCH=riscv64 go build ./trillian/ctfe/ct_server`, since no upstream, Debian, Ubuntu, or Arch riscv64 binary exists. This is expected to succeed given the pure-Go, no-assembly codebase, but it is unverified and untested by any party found in this research.

## 9. Dependencies

certificate-transparency-go is a pure-Go module (go.mod only). Its riscv64 fate is inherited almost entirely from its dependencies, which are overwhelmingly pure Go with generic fallbacks for the few packages shipping amd64/arm64 assembly. The most significant soft spot is `etcd`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/blocking issues |
|---|---|---|---|---|---|
| [`google.golang.org/grpc`](https://github.com/grpc/grpc-go) (grpc-go) | RPC/transport for CTFE, migrillian, Trillian client | Yes, pure Go | Not independently verified; no reported failures | Go module, source-only | None found (0 riscv64/riscv issues) |
| [`google.golang.org/protobuf`](https://github.com/protocolbuffers/protobuf-go) (protobuf-go) | Wire codec/runtime for proto messages | Yes, pure Go | Not independently verified | Go module, source-only | None found |
| [`golang.org/x/crypto`](https://cs.opensource.google/go/x/crypto) | cryptobyte/ASN.1 DER parsing in x509 package | Yes, explicit riscv64 asm path (`internal/poly1305/sum_riscv64.s`, gated amd64 or loong64 or ppc64 or ppc64le or riscv64) | Inherits Go project's riscv64 builder coverage (secondary port) | Go module, source-only | None found |
| [`github.com/google/trillian`](https://github.com/google/trillian) | Transparency-log backend (Merkle tree storage/signing) CTFE talks to via gRPC; supplies createtree tooling | Likely yes, pure Go, zero riscv-named commits | No riscv64-specific CI job found (codeql, golangci-lint, govulncheck, scorecard, test_crdb, test_pgdb workflows checked) | No riscv64 release artifacts identified | None found |
| `go.etcd.io/etcd/{v3,client/v3,etcdctl/v3}` | etcd client wired into ct_server for optional mastership election/naming | Yes, confirmed on native hardware (server 2m20s, etcdctl 34s on BananaPi F3/SpacemiT K1) [NEEDS VERIFICATION, single source] | Runs correctly per reporter, but no official CI, blocked on lack of riscv64 nodes in Kubernetes Prow | No official binary; startup gated behind `ETCD_UNSUPPORTED_ARCH=riscv64` env override | [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509), closed unresolved, maintainer stated "No plans"; see `reports/etcd.md` |
| `go.etcd.io/bbolt` (indirect, via etcd) | Embedded KV store backing etcd's storage engine | Yes, explicit riscv64 build-tagged file (`internal/common/bolt_riscv64.go`) | Yes, riscv64 explicitly in GitHub Actions `cross-arch-test.yaml` matrix | Go module, source-only | None, bright spot in the dependency tree |
| [`github.com/jackc/pgx/v5`](https://github.com/jackc/pgx) | PostgreSQL driver for Trillian/CTFE storage | Yes, pure Go, zero arch-specific code | Not independently verified | Go module, source-only | None found |
| [`github.com/go-sql-driver/mysql`](https://github.com/go-sql-driver/mysql) | MySQL driver for Trillian/CTFE storage + IssuanceChain storage | Yes, pure Go, zero arch-specific code | Not independently verified | Go module, source-only | None found |
| `github.com/klauspost/compress` (indirect) | Compression codec (gzip/zstd/s2), transitive | Yes, no riscv64 asm exists, falls back cleanly to `*_generic.go` | Not independently verified | Go module, source-only | None found |
| `github.com/cespare/xxhash/v2` (indirect) | Fast hashing, transitive (grpc-go/Trillian/Prometheus client chain) | Yes, riscv64 falls outside amd64/arm64 asm build tag, uses portable `xxhash_other.go` | Not independently verified | Go module, source-only | None found |
| `filippo.io/edwards25519` (indirect) | Ed25519/X25519 primitives (ct-go's own Ed25519 paths use stdlib crypto/ed25519 directly) | Yes, pure constant-time Go | Not independently verified | Go module, source-only | None found |

Cross-references to existing scope.yml reports, with caveats - several dependency names collide with other reports but point to different repositories:
- `reports/grpc.md` covers `grpc/grpc` (C++ core/multi-language repo), which has documented riscv64 friction (issues #35839, #36112, #37791, open wheel request #41591). certificate-transparency-go instead depends on `grpc/grpc-go`, a separate pure-Go repository with zero riscv64 issues found, a materially better position than the C-core report implies.
- `reports/protocol-buffers.md` covers `protocolbuffers/protobuf` (C++), where maintainers have explicitly rejected riscv64 support ("not on our roadmap," Aug 2025). certificate-transparency-go instead depends on `protocolbuffers/protobuf-go`, a separate pure-Go repository with zero riscv64 issues found.
- `reports/mysql.md` and `reports/postgresql.md` cover the database servers themselves. certificate-transparency-go's actual dependencies are the client drivers (`go-sql-driver/mysql`, `jackc/pgx`), pure Go and unaffected by server-side gaps. These reports remain relevant only if a riscv64 deployment self-hosts the Trillian storage backend on MySQL or PostgreSQL.
- `reports/etcd.md` is a direct, correct match: same repository, same riscv64 status (blocked on Prow CI infrastructure, runtime-gated by `ETCD_UNSUPPORTED_ARCH`).

`golang.org/x/crypto` is a sibling repository to `golang/go` (the scope.yml "Go" entry) and benefits from the same Go-team riscv64 investment documented in `reports/go.md`.

BoringSSL was checked as a candidate crypto dependency but is not actually part of the dependency tree - the only cgo path in the repo is `x509/root_cgo_darwin.go`, which links macOS's Security.framework, not BoringSSL.

Section 10 (Ecosystem Status) is omitted: certificate-transparency-go is a standalone Go module/tool consumed directly via `go get`, with no dependent plugin/extension/package ecosystem of its own that would separately need riscv64 enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No RISC-V-specific bug, issue, or correctness report exists | N/A | N/A | Confirmed via exhaustive `gh search issues/prs/commits/code` for "riscv", "riscv64", "risc-v", "risc", "RV64"; only one false-positive hit (PR #783) |
| [#1606](https://github.com/google/certificate-transparency-go/issues/1606) | Build fails for darwin-amd64 with CGO_ENABLED=1 | Open, 0 comments | Not RISC-V; included for comparison as the repo's only tracked architecture-specific build issue | Docker cross-compilation fails building x509 against macOS SDK 14.4 (renamed/removed SecTrustSettings* constants); no riscv64 row in reporter's compatibility matrix |
| [PR #783](https://github.com/google/certificate-transparency-go/pull/783) | Bump github.com/prometheus/client_golang from 1.9.0 to 1.10.0 | Closed, unmerged (`merged: false`, `merged_at: null`) | Not RISC-V, false positive | Only occurrence of "riscv64" in this repo's issue/PR corpus: a line inside Dependabot's auto-inserted upstream changelog quote ("[BUGFIX] Fix build on riscv64") describing a fix in the `prometheus/client_golang` dependency itself, not in certificate-transparency-go. Closed after CI failures traced to the repo being pinned on Go 1.11 (unrelated to architecture) |
| [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509) | etcd riscv64 CI/support (dependency, not this repo) | Closed, unresolved | Medium (affects optional mastership-election feature only) | Maintainer @serathius stated "No plans"; relevant only if `ct_server` is run with etcd-based mastership election enabled; see `reports/etcd.md` |

Correctness bugs: none found. No RISC-V-specific correctness, numerical, or logic bug has ever been reported against certificate-transparency-go.

## 12. Objections and Upstream Blockers

Stated objections: none exist, because no riscv64 proposal, issue, or PR has ever been filed against this repository for maintainers to object to or accept.

Technical blockers:
- Go's race detector (`-race`) does not support riscv64, blocking 3 of 6 Cloud Build CI test steps (`race_detection`, `etcd_with_race`, `with_pkcs11_and_race`) from running on that architecture if it were added to CI.
- `with_pkcs11_and_race` additionally requires a working cgo/PKCS#11 toolchain on riscv64 (theoretically available since Go 1.16, but unverified in this project's context).
- The CI test-base Dockerfile hardcodes a `protoc-3.20.1-linux-x86_64.zip` download; no riscv64 protoc binary is published upstream for that version, requiring a substitute (e.g., Debian's riscv64-built `protobuf-compiler`).
- The `etcd` dependency (used only for optional mastership election) has no official riscv64 CI or binaries and requires a runtime override (`ETCD_UNSUPPORTED_ARCH=riscv64`) to even start on that architecture.

Organizational blockers:
- Google CLA requirement has previously deterred at least one external contributor from submitting a portability fix (the i386 int-overflow case, Issue #1539), though the maintainer absorbed the fix directly. The same CLA friction would apply to any external riscv64 contribution.
- Single Google-controlled CODEOWNERS team (`@google/certificate-transparency`) owns 100% of the codebase; there is no distributed maintainer structure that might independently champion a riscv64 initiative.
- No RISE membership or funded work item touches this project, so there is no existing external funding or engineering pipeline to draw on.

Acceptance probability: likely high if a well-formed PR were submitted, based on the observed pattern of maintainers (Roger Ng, Al Cutter) quickly absorbing small portability fixes (32-bit int-overflow fix, distroless static-build change). However, this is inferred from analogous non-RISC-V portability fixes, not from any direct riscv64 precedent, since none exists. [NEEDS VERIFICATION: no direct riscv64 acceptance precedent exists to confirm this inference.]

## 13. Investment Analysis

Before sizing: RISE has not funded, tracked, or touched certificate-transparency-go in any way (Section 7). No existing work to net out.

### 13.1 Functional Enablement

The codebase is pure Go with no architecture-specific paths, so no functional enablement work is required for the core project to build and run under `GOARCH=riscv64`. The only functional item is verification: confirm the pure-Go build actually works end-to-end (unit tests, integration tests using `integration/Dockerfile`, and the CTFE Docker image build) on real riscv64 hardware, since this has never been done or documented by any party found in this research. Effort: 1 person-week (build, run existing test suite, file any bugs found).

If PKCS#11/HSM support is required on riscv64, additional verification of the cgo `pkcs11` build tag path against a real riscv64 target with libpkcs11 installed would be needed. Effort: 0.5 person-week, contingent on whether HSM support is a deployment requirement.

### 13.2 Performance Optimization

No performance optimization work is identified or justified. certificate-transparency-go has no hand-tuned SIMD, crypto assembly, or JIT of its own; all cryptographic and hashing work goes through Go stdlib or pure-Go dependencies. Any performance characteristics on riscv64 are inherited from the Go compiler's code generation and from dependencies like `golang.org/x/crypto` (which does have a riscv64 assembly path for poly1305). No project-specific optimization backlog exists. Data not available: no riscv64 vs arm64/amd64 performance benchmarks exist for this project to establish a baseline or target.

### 13.3 CI/CD Infrastructure

Add a riscv64 job to the existing GitHub Actions matrix (or a new Cloud Build config) covering build and non-race test steps. Given Go's race detector does not support riscv64, the `-race` steps would need to be explicitly skipped for that architecture rather than fixed. Effort: 1 person-week (CI YAML changes, initial debugging of any environment-specific failures, coordination with existing Google-owned Cloud Build infrastructure). Requires either a QEMU-emulated runner (slow, e.g. for correctness-only checks) or native riscv64 hardware/self-hosted runner (faster, needed for realistic timing/integration tests); no such runner presently exists for this project.

### 13.4 Ecosystem Enablement

Not applicable; Section 10 omitted, no dependent package ecosystem for certificate-transparency-go itself. The one ecosystem-adjacent item is ensuring Debian/Ubuntu's arch:all Go source packaging continues to build correctly wherever it is compiled for riscv64 targets (already the case today, since arch:all packages build wherever consumed, not per-architecture).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify pure-Go build and test suite pass on real riscv64 hardware | 1 | Unassigned | Medium |
| Functional | Verify PKCS#11/HSM cgo path on riscv64 (contingent on deployment need) | 0.5 | Unassigned | Low |
| CI/CD | Add riscv64 build+test job (excluding `-race` steps) to CI | 1 | Unassigned | Medium |
| Performance | None identified, no project-specific hot paths to optimize | 0 | N/A | Low |
| Ecosystem | None required, no dependent package ecosystem | 0 | N/A | N/A |

Total estimated effort: approximately 2.5 person-weeks. This is a low-cost, low-risk enablement target: the blocking factor is verification and CI plumbing, not code changes, since the codebase is architecture-agnostic Go with no ported subsystems needed.

## 14. Updates

No updates yet, initial report dated 2026-06-17.

## 15. References

- [certificate-transparency-go GitHub repository](https://github.com/google/certificate-transparency-go)
- [certificate.transparency.dev homepage](https://certificate.transparency.dev/)
- [PR #783: Bump github.com/prometheus/client_golang from 1.9.0 to 1.10.0](https://github.com/google/certificate-transparency-go/pull/783)
- [Issue #1606: Build fails for darwin-amd64 with CGO_ENABLED=1](https://github.com/google/certificate-transparency-go/issues/1606)
- [Issue #1539: i386 int-overflow build failure](https://github.com/google/certificate-transparency-go/issues/1539)
- [Issue #1118: Remove glibc dependency from ct_server](https://github.com/google/certificate-transparency-go/issues/1118)
- [codeql.yml workflow](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/codeql.yml)
- [golangci-lint.yml workflow](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/golangci-lint.yml)
- [govulncheck.yml workflow](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/govulncheck.yml)
- [scorecard.yml workflow](https://github.com/google/certificate-transparency-go/blob/master/.github/workflows/scorecard.yml)
- [integration/Dockerfile](https://github.com/google/certificate-transparency-go/blob/master/integration/Dockerfile)
- [trillian/examples/deployment/docker/ctfe/Dockerfile](https://github.com/google/certificate-transparency-go/blob/master/trillian/examples/deployment/docker/ctfe/Dockerfile)
- [trillian/examples/deployment/docker/envsubst/Dockerfile](https://github.com/google/certificate-transparency-go/blob/master/trillian/examples/deployment/docker/envsubst/Dockerfile)
- [grpc-go repository](https://github.com/grpc/grpc-go)
- [protobuf-go repository](https://github.com/protocolbuffers/protobuf-go)
- [golang.org/x/crypto source (cs.opensource.google)](https://cs.opensource.google/go/x/crypto)
- [google/trillian repository](https://github.com/google/trillian)
- [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509)
- [go.etcd.io/bbolt repository](https://github.com/etcd-io/bbolt)
- [jackc/pgx repository](https://github.com/jackc/pgx)
- [go-sql-driver/mysql repository](https://github.com/go-sql-driver/mysql)
- [Debian package tracker: golang-github-google-certificate-transparency](https://tracker.debian.org/pkg/golang-github-google-certificate-transparency)
- [Debian buildd status: golang-github-google-certificate-transparency](https://buildd.debian.org/status/package.php?p=golang-github-google-certificate-transparency)
- [PyPI lookup (404, package does not exist)](https://pypi.org/pypi/certificate-transparency-go/json)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/.status/status.htm)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE blog: Advancing Go on RISC-V: Progress Through the RISE Project](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)