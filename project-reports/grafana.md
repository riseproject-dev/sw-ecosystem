---
title: Grafana
parent: Project Reports
---

# Grafana

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for Grafana<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Grafana is an open-source observability and data visualization platform. The Go backend exposes a web server and data-source plugin API; the frontend is a TypeScript/React single-page application. The server is approximately 97% Go with no native architecture-specific code. The project is licensed AGPL-3.0.

**Governance:** Grafana Labs-controlled benevolent-dictator model. `GOVERNANCE.md` describes a "rough consensus" process with a private `grafana-team` Google Group for voting. Governance changes are explicitly reserved to Grafana Labs. Virtually all named maintainers in `GOVERNANCE.md` are Grafana Labs employees; the handful of exceptions are Fredrik Enestad (Embark Studios), Julien Pivotto (Inuits), Mitsuhiro Tanda (GREE), and Utkarsh Bhatnagar (Tinder).

**Corporate sponsors:** Grafana Labs (private company, CEO Raj Dutt) is the sole controlling entity. Grafana is not a member of RISE, CNCF, or the Linux Foundation.

**Community culture on new ports:** Cautious and commercially-gated. The response to the ISCAS riscv64 proposal (issue [#109717](https://github.com/grafana/grafana/issues/109717)) began with the question of whether the requestor is "a paying Grafana Enterprise customer today" before any technical evaluation. The maintainer (@Proximyst) warned of "a veeery long-winded maybe." As of 2026-05-03 no official decision has been published.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023 (closed 2025-03-18) | Issue [#82633](https://github.com/grafana/grafana/issues/82633) "risc-v support" opened by community member mvysny (LicheeRV Dock); closed as stale | GitHub |
| 2025-08-15 | Issue [#109717](https://github.com/grafana/grafana/issues/109717) filed by @wcz0910 (ISCAS) proposing official riscv64 builds, CI, and Docker images | GitHub |
| 2025-08-20 | PR [#109931](https://github.com/grafana/grafana/pull/109931) merged by @kminehart (Grafana Labs): replaced Zig toolchain with musl-cross for riscv64 community builds; added `BuildOptsStaticRiscv64` with `CC=/toolchain/riscv64-linux-musl-cross/bin/riscv64-linux-musl-gcc`; musl-cross tarball hosted at `dl.grafana.com/ci/riscv64-linux-musl-cross.tgz` | GitHub |
| 2025-08-28 | @Proximyst (Grafana member) acknowledges ISCAS context, promises decision "in at least a few weeks" | GitHub issue #109717 comment |
| 2026-04-01 | PR [#121534](https://github.com/grafana/grafana/pull/121534) merged: CI pipeline migrated from Dagger to Makefile-based release builds; riscv64 community target carried through into `release-build.yml` with explicit `allow-failure: true` annotation | GitHub |
| 2026-05-03 | @Xeonacid (community) asks for progress on issue #109717; no response from Grafana Labs | GitHub issue #109717 comment |
| 2026-07-16 | Alpine Linux edge ships `grafana 12.4.4-r1` for riscv64, maintained by Konstantin Kulikov outside Grafana upstream | Alpine Linux |

The first internal Grafana Labs commit targeting riscv64 was commit `4adbab15715e43c98a55742a1164647d4fa6fc52` by @kminehart on 2025-08-20. All work is upstream in the main branch. There is no downstream fork.

---

## 3. Upstream Support Tier

Grafana explicitly marks riscv64 as "community supported" (not officially supported). The evidence is direct and machine-readable.

From `.github/workflows/release-build.yml`, present in every riscv64 matrix entry:

```
# riscv64 is not an officially supported architecture; failures are allowed.
- name: linux-riscv64
  os: linux
  arch: riscv64
  allow-failure: true
```

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR/pre-merge CI gate | yes | yes | no |
| Release/nightly build | yes | yes | yes (allow-failure) |
| Build failure blocks release | yes | yes | no |
| Official GitHub release binary | yes | yes | no |
| Docker image published | yes | yes | no |
| Debian/Ubuntu package | no (removed 2018) | no | no |
| Alpine Linux package | yes | yes | yes (community, 12.4.4-r1) |
| Formally documented support tier | Supported | Supported | "Community supported" |

Official binaries for riscv64 do not appear in any Grafana GitHub release (checked v13.2.0, v13.1.4, v13.0.7, v12.4.9, v12.3.11). riscv64 packages built in the release pipeline are uploaded to the `grafana-prerelease` GCS bucket, which is not a public download channel.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Grafana has no architecture-specific native code. The codebase is a pure-Go backend and a TypeScript/React frontend. The following searches returned zero architecture-specific results:

- `riscv extension:go repo:grafana/grafana` -- 0 results
- `vfloat32m1_t repo:grafana/grafana` -- 0 results
- Assembly files (`extension:S`, `extension:asm`) -- one file: `pkg/web/macaron.s`, a 2-line Go linkname stub with no ISA content

The only riscv64 reference in the source tree is in `.github/workflows/release-build.yml` (CI configuration, not compiled code).

The single arch-specific divergence in the Go source is two files under `pkg/expr/sql/` with `//go:build arm` stubs, replacing the SQL expression engine with a "not implemented" stub on 32-bit ARM. riscv64 hits the `!arm` full implementation path.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go backend binary | scalar (Go stdlib) | scalar (Go stdlib) | scalar (Go stdlib) |
| SQL expression engine | full | full | full (not in ARM stub) |
| JIT compilation | none | none | none |
| SIMD / vectorized paths | none | none | none |
| Architecture-specific assembly | none | none | none |
| CGo usage at runtime | no (CGO_ENABLED=0 in CI) | no | no |
| Frontend (JS/WASM) | arch-independent | arch-independent | arch-independent |

No performance gap from missing SIMD or JIT exists because no such code exists for any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Backend (Go):** Pure Go with CGO_ENABLED=0 in CI. Cross-compilation is trivial: set `GOARCH=riscv64 GOOS=linux` and invoke `go build`. The release pipeline cross-compiles on `ubuntu-x64-large` GitHub-hosted runners.

For CGO-enabled builds (not required for the Grafana binary itself), PR #109931 introduced a dedicated musl-cross toolchain:

```
wget https://dl.grafana.com/ci/riscv64-linux-musl-cross.tgz
CC=/toolchain/riscv64-linux-musl-cross/bin/riscv64-linux-musl-gcc
CXX=/toolchain/riscv64-linux-musl-cross/bin/riscv64-linux-musl-cpp
```

Go version required: go.mod specifies `go 1.26.x` (the exact patch version is Data not available: go.mod was not directly fetched). The Go 1.26 toolchain supports `linux/riscv64` as a Tier 2 target (CGo supported, no dedicated LUCI builder).

**Frontend (Node.js + esbuild + webpack):** The frontend build requires Node.js on the build host. Node.js has no official `linux/riscv64` binary from nodejs.org. Grafana's release CI cross-compiles the frontend on x86 runners, which sidesteps this requirement. A native riscv64 build from source would require either building Node.js from source or using a distribution-packaged Node.js.

**QEMU usage:** None for binary builds or test execution. QEMU is not present in any CI workflow for Grafana.

**Known build failures:** No specific build failure bug reports exist. The `allow-failure: true` flag means failures are silently tolerated, not actively tracked.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Backend binary | yes | yes | yes (community build) |
| .deb package | yes | yes | yes (prerelease bucket only) |
| .rpm package | yes | yes | yes (prerelease bucket only) |
| .tar.gz package | yes | yes | yes (prerelease bucket only) |
| Docker image | yes | yes | no |
| Official release artifact | yes | yes | no |
| PR CI validation | yes | yes | no |
| Alpine Linux package | yes | yes | yes (12.4.4-r1, community) |

**Functional gaps:** None in the application code. The backend compiles to a complete binary. All features are available because there is no arch-specific code that could be absent on riscv64.

**Performance gaps:** None measurable from code analysis. No SIMD paths exist for any architecture, so riscv64 is not disadvantaged relative to arm64.

**Security hardening:** Data not available: no analysis of compiler hardening flags (stack canaries, RELRO, PIE) specific to riscv64 builds was found in the research.

**Floating-point / NaN correctness:** No riscv64-specific floating-point bugs were found. The three closed NaN/Infinity bugs found (#122378, #122504, #61074) are data-layer issues in Tempo and alerting, not architecture-specific.

---

## 7. CI/CD Infrastructure

CI is GitHub Actions only. No GitLab CI, Jenkinsfile, or Cirrus CI files exist in the repository.

| CI scope | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR pre-merge gate (`build-go-matrix.yml`) | yes | yes | no |
| Nightly/release build (`release-build.yml`) | yes | yes | yes (allow-failure) |
| Build failure blocks PR | yes | yes | N/A - not in matrix |
| Docker build CI | yes | yes | no |
| Runner type | ubuntu-x64-large | ubuntu-x64-large (cross) | ubuntu-x64-large (cross) |
| Native hardware runner | no | no (cross-compile) | no (cross-compile) |
| QEMU execution | no | no | no |
| RISE CI runners | no | no | no |

Five jobs in `release-build.yml` include riscv64: `build-backend`, `build-targz`, `build-deb-rpm`, `publish-targz`, `publish-deb-rpm`. All carry `allow-failure: true`. None of the Docker build/publish jobs include riscv64.

No RISE project involvement was found. RISE project package list (78 packages) was checked directly; Grafana does not appear. Zero results for `Grafana org:riseproject-dev` in GitHub API search.

---

## 8. Distribution and Release Status

**Official Grafana download channels:** grafana.com/grafana/download lists amd64 and arm64 only. No riscv64 option is presented.

**GitHub Releases:** v13.2.0, v13.1.4, v13.0.7, v12.4.9, v12.3.11 were checked. Each ships exactly 12 assets covering amd64, arm-6, arm-7, arm64 (both OSS and Enterprise editions). Zero assets contain "riscv64" in any filename.

**Docker Hub / OCI:** Images published for linux/amd64, linux/arm64, linux/arm/v7, linux/s390x. No riscv64 manifest entry exists.

**Debian:** Grafana was removed from Debian in October 2018 (last version 2.6.0+dfsg-3). It is not in any current Debian distribution for any architecture.

**Ubuntu:** No standalone `grafana` package in Ubuntu 24.04 (noble). Only peripheral Go library packages (golang-github-grafana-\*) are present. Users must use the upstream Grafana apt repository, which does not serve riscv64.

**Alpine Linux:** `grafana 12.4.4-r1` for riscv64 is available in Alpine edge/community (build date 2026-07-16, maintainer Konstantin Kulikov). This is a community-maintained package outside the Grafana upstream release process. [NEEDS VERIFICATION: whether this package is functional and passes Grafana's own smoke tests]

**Arch Linux RISC-V:** Grafana does not appear in the [Arch Linux RISC-V package portal](https://archriscv.felixc.at/).

**What a user must do to get a working riscv64 binary:**

Option A: Build from source on a riscv64 machine (confirmed working by ISCAS in issue #109717; requires Node.js from source or a distro package for the frontend build step).

Option B: Use Alpine Linux edge/community on Alpine-based riscv64 systems (version 12.4.4-r1).

Option C: Download prerelease `.tar.gz` or `.deb`/`.rpm` from the `grafana-prerelease` GCS bucket - these are produced by the nightly CI but are not linked from any public download page and carry no support commitment.

---

## 9. Dependencies

### Summary Table

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go runtime (go 1.26) | Language runtime | yes | limited (no LUCI builder) | yes (Tier 2) | Open issues: #80880, #79997, #78918 |
| Prometheus client Go | Metrics collection | yes | unknown | no binary (library) | No blocking issues |
| gRPC-Go | Plugin RPC transport | yes (pure Go) | unknown | no binary (library) | No riscv64 issues in grpc-go |
| protobuf-Go | Serialization | yes | unknown | no binary (library) | riscv64 support merged #12244 (2024-03) |
| OpenTelemetry Go | Tracing / metrics SDK | yes (pure Go) | unknown | no binary (library) | No blocking issues |
| modernc.org/sqlite | Embedded SQL (CGo-free) | yes | unknown | no binary (library) | GitLab issue #90 closed 2022 |
| dgraph-io/badger v4 | KV storage (Bleve) | yes (pure Go) | unknown | no binary (library) | No blocking issues |
| blevesearch/bleve | Full-text search | yes (pure Go core) | unknown | no binary (library) | go-faiss CGo not used in main build |
| apache/arrow-go | Columnar data frames | yes (pure Go) | unknown | no binary (library) | Arrow C++ JIT fix (#50862) does not affect Go impl |
| klauspost/compress (zstd/snappy/lz4) | Compression | yes (pure Go) | unknown | no binary (library) | No riscv64 issues |
| esbuild v0.25.8 | Frontend bundler (build-time) | yes | unknown | `@esbuild/linux-riscv64` on npm | Not needed at server runtime |
| Node.js v22+ | Frontend build host (build-time) | no official binary | no | no (nodejs.org) | Blocking for native source builds |
| go-redis v9 | Session cache client | yes (pure Go) | unknown | no binary (library) | No riscv64 issues |
| jackc/pgx v5 | PostgreSQL driver | yes (pure Go) | unknown | no binary (library) | No riscv64 issues |
| go-sql-driver/mysql | MySQL driver | yes (pure Go) | unknown | no binary (library) | No riscv64 issues |

### Critical Dependency Deep-Dives

**Go runtime (linux/riscv64, Tier 2):** `linux/riscv64` is a supported platform with `CgoSupported: true`. It is not marked FirstClass. Open issues include: missing `hash/crc32` assembly ([#80880](https://github.com/golang/go/issues/80880) - LUCI CI builder requested but not deployed), `indexbyte` optimization pending ([#79997](https://github.com/golang/go/issues/79997)), and other missing assembly optimizations ([#78918](https://github.com/golang/go/issues/78918)). The lack of a LUCI builder means regressions on riscv64 may not be caught promptly. For Grafana's use case (HTTP server, JSON processing, SQL queries), the absence of crc32/memchr assembly introduces a measurable but not blocking performance delta.

**Node.js (build-time, blocking for native builds):** No official `linux/riscv64` binary is distributed at nodejs.org. Open issues include V8 `Illegal instruction` crash on riscv64 with vector detection ([nodejs/node#64538](https://github.com/nodejs/node/issues/64538)) and CI failures ([nodejs/node#62251](https://github.com/nodejs/node/issues/62251)). Grafana's release CI sidesteps this by cross-compiling the frontend on x86. Any user attempting a fully native riscv64 build must compile Node.js from source or use a distribution-packaged binary.

**esbuild (build-time, not blocking):** `@esbuild/linux-riscv64` is published to npm and the version pinned by Grafana (0.25.8) is available. This dependency is not a blocker once Node.js is available.

**modernc.org/sqlite (CGo-free embedded DB):** Uses a transpiled-to-Go version of SQLite C source code, requiring no C toolchain on the target. riscv64 support was confirmed when GitLab issue #90 was closed in 2022. Not a blocker.

**blevesearch/go-faiss (optional, not in main build):** FAISS C++ added riscv64 cross-compile CI ([#5184](https://github.com/facebookresearch/faiss/pull/5184)) but no native test infrastructure exists. No code search hits confirm go-faiss is compiled into the main Grafana binary. If it were enabled, it would require a FAISS native riscv64 build.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#109717](https://github.com/grafana/grafana/issues/109717) | Proposal: Add official support and builds for riscv64 architecture | Open | Organizational blocker | ISCAS request; Grafana Labs silent since 2025-08-28 |
| [#82633](https://github.com/grafana/grafana/issues/82633) | risc-v support | Closed (stale, 2025-03-18) | Historical | Community member request for LicheeRV Dock; a follow-up "any news?" appeared 2025-06-29 with no response |

No correctness bugs specific to riscv64 were found in the research. The three NaN/floating-point bugs found (#122378, #122504, #61074) are all closed and not architecture-specific.

---

## 12. Objections and Upstream Blockers

**Stated organizational objection:** Grafana Labs explicitly conditioned their evaluation on whether the requestor is a "paying Grafana Enterprise customer." ISCAS is not. The response from @Proximyst prepared for "a very quick no or a veeery long-winded maybe." The internal discussion has been running since August 2025 with no public output as of May 2026.

**Technical blockers:**

- Node.js: no official riscv64 binary from nodejs.org. This is the primary gap blocking a fully reproducible official release pipeline. Grafana's current CI works around this by cross-compiling on x86, so it is not a hard blocker for the existing CI approach but prevents native source builds without Node.js from source.
- Docker images: not produced for riscv64 in any CI pipeline. The Docker build jobs in `release-build.yml` do not include riscv64 in their platform matrix.
- PR CI gate: riscv64 is absent from `build-go-matrix.yml`. A riscv64 build regression introduced by a PR would not be detected until the nightly build ran.

**Probability assessment for official tier promotion:** Low in the near term. The Grafana Labs response was commercially motivated, the issue has received no internal update since August 2025, and the only follow-up from Grafana was asking for Enterprise customer status. The ISCAS team has a credible track record (Linux kernel, MinIO, Ruff contributions cited in the issue) and offered to provide hardware and maintenance, but Grafana Labs has not engaged with those specifics.

---

## 13. Investment Analysis

RISE has no current involvement with Grafana (confirmed: zero results in RISE package list, zero GitHub results under riseproject-dev org).

Grafana Labs is already maintaining the riscv64 community build toolchain internally (musl-cross tarball hosted at `dl.grafana.com/ci/`, maintained by @kminehart). The software itself has no arch-specific code gaps. The work required to reach official status is organizational and infrastructure-level, not algorithmic.

### 13.1 Functional Enablement

The Go backend is already functionally complete on riscv64 - no code gaps exist. The only functional gap is the absence of Docker images.

### 13.2 Performance Optimization

Not applicable. Grafana is a pure-Go web application. There are no SIMD or JIT paths for any architecture. Performance is bounded by Go's compiler output and the stdlib, both of which are within the Go team's riscv64 Tier 2 roadmap.

### 13.3 CI/CD Infrastructure

The highest-leverage infrastructure investment is adding riscv64 to the PR pre-merge CI gate (`build-go-matrix.yml`). This requires no hardware - it is a cross-compilation step on x86 runners. A second-order investment is adding riscv64 to Docker image builds, which requires a multi-platform buildx configuration.

### 13.4 Ecosystem Enablement

The primary external enabler is Node.js riscv64 support. Without an official Node.js binary, the Grafana frontend build pipeline cannot run natively on riscv64, which blocks downstream distros from packaging Grafana without patching the build system. Contributing to Node.js riscv64 CI or providing native test infrastructure would unblock this.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 to `build-go-matrix.yml` PR gate (cross-compile only) | 0.5 | Grafana Labs or external contributor | High |
| CI/CD | Add riscv64 to Docker image multi-platform build | 1 | Grafana Labs | High |
| CI/CD | Publish riscv64 artifacts from `grafana-prerelease` to official release channel | 1 | Grafana Labs (policy decision required) | High |
| Functional | No code work required -- backend is functionally complete | 0 | N/A | N/A |
| Ecosystem | Contribute riscv64 CI to Node.js upstream to unblock native builds | 4-8 | Node.js / external contributor | Medium |
| CI/CD | Add native riscv64 test runner (QEMU or hardware) to validate nightly builds | 2-4 | Grafana Labs or RISE | Medium |
| Organizational | Drive Grafana Labs to official tier decision (engage as Enterprise customer or via RISE) | indeterminate | Commercial engagement | Critical |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [Grafana GitHub repository](https://github.com/grafana/grafana)
- [Issue #109717: Proposal: Add official support and builds for riscv64 architecture](https://github.com/grafana/grafana/issues/109717)
- [Issue #82633: risc-v support (closed stale)](https://github.com/grafana/grafana/issues/82633)
- [PR #109931: CI: For community supported riscv64 builds use musl-cross instead of zig for build](https://github.com/grafana/grafana/pull/109931)
- [PR #121534: CI: Use make build-targz instead of Dagger for release builds](https://github.com/grafana/grafana/pull/121534)
- [Grafana release-build.yml CI workflow](https://github.com/grafana/grafana/blob/main/.github/workflows/release-build.yml)
- [Grafana build-go-matrix.yml CI workflow](https://github.com/grafana/grafana/blob/main/.github/workflows/build-go-matrix.yml)
- [Grafana GOVERNANCE.md](https://github.com/grafana/grafana/blob/main/GOVERNANCE.md)
- [Grafana MAINTAINERS.md](https://github.com/grafana/grafana/blob/main/MAINTAINERS.md)
- [Grafana v13.2.0 GitHub Release](https://github.com/grafana/grafana/releases/tag/v13.2.0)
- [Alpine Linux edge/community grafana package](https://pkgs.alpinelinux.org/package/edge/community/riscv64/grafana)
- [Debian tracker: grafana (removed)](https://tracker.debian.org/pkg/grafana)
- [Arch Linux RISC-V package portal](https://archriscv.felixc.at/)
- [Go issue #80880: riscv64 LUCI CI builder](https://github.com/golang/go/issues/80880)
- [Node.js issue #64538: V8 Illegal instruction on riscv64](https://github.com/nodejs/node/issues/64538)
- [Node.js issue #62251: riscv64 CI failures](https://github.com/nodejs/node/issues/62251)
- [npm @esbuild/linux-riscv64](https://www.npmjs.com/package/@esbuild/linux-riscv64)
- [RISE project homepage](https://riseproject.dev/)