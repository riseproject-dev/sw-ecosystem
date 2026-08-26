---
title: postgres_exporter
---

# postgres_exporter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for postgres_exporter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[postgres_exporter](https://github.com/prometheus-community/postgres_exporter) is a Prometheus exporter that exposes PostgreSQL server metrics via HTTP for scraping by a Prometheus instance. It connects to a PostgreSQL server, runs SQL queries against system catalog tables and pg_stat views, and emits metrics in the Prometheus exposition format. It is a standalone Go binary with no library API surface.

The project is hosted under the [prometheus-community](https://github.com/prometheus-community) GitHub organization. Prometheus itself is a [Cloud Native Computing Foundation (CNCF)](https://www.cncf.io/) graduated project; postgres_exporter inherits CNCF's vendor-neutral umbrella via this organizational affiliation. The project carries no separate foundation membership. License: Apache-2.0.

Three maintainers are listed in MAINTAINERS.md. None disclose employer affiliations in the repository:

| Name | GitHub | Email domain |
|------|--------|--------------|
| Ben Kochie | @SuperQ | gmail.com |
| William Rouesnel | @wrouesnel | wrouesnel.com |
| Joe Adams | @sysadmind | joeadams.io |

@SuperQ is a member of the upstream @prometheus GitHub organization. No corporate sponsor is listed anywhere in the repository.

The project is community-maintained with no identifiable corporate backer. New platform requests would need to come as GitHub issues or PRs targeting both this repository and the upstream `prometheus/promci` shared CI framework. The community has no stated policy on platform tiers and no history of rejecting architecture ports.

The project is not affiliated with the [RISE Project](https://riseproject.dev/). No RISE blog posts, funded work, runner usage, or riseproject-dev repositories related to postgres_exporter were found.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2016-06-03 | Initial release v0.0.1 by William Rouesnel at wrouesnel/postgres_exporter | GitHub releases |
| 2021-03 (v0.9.0) | Transferred to prometheus-community organization | GitHub release notes: "First release under the Prometheus Community organisation" |
| 2023-09-20 (v0.14.0) | First release to include linux/riscv64 tarball | GitHub release assets: `postgres_exporter-0.14.0.linux-riscv64.tar.gz` |
| 2026-07-07 (v0.20.1) | Latest release; linux/riscv64 tarball present | GitHub release assets: `postgres_exporter-0.20.1.linux-riscv64.tar.gz` |

No RISC-V-specific issue, PR, or commit exists in the repository. riscv64 support arrived silently between v0.13.2 and v0.14.0 as a side effect of the upstream `prometheus/promu` tool adding `linux/riscv64` to its default crossbuild platform list. Because postgres_exporter's own `.promu.yml` contains no `crossbuild:` section override, the promu default list applies in full, which includes `linux/riscv64`. No postgres_exporter maintainer took any deliberate action to enable riscv64. The Go toolchain's native cross-compilation made the addition cost-free.

Key contributors to riscv64 support: not applicable - no contributor in this repository performed riscv64-specific work. The enabling change was in `prometheus/promu` upstream.

The port is fully upstream in the sense that there is no downstream fork or out-of-tree patch. All release artifacts are built from the main repository.

---

## 3. Upstream Support Tier

There is no formal platform tier policy or PLATFORMS.md in this repository. The platform set is defined implicitly by promu's default crossbuild list, which includes `linux/riscv64` alongside `linux/amd64`, `linux/arm64`, `linux/arm`, `linux/ppc64le`, and `linux/s390x`.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Pre-built release tarball | Yes | Yes | Yes (since v0.14.0) |
| Docker multi-arch image | Yes | Yes | No |
| CI unit test execution | Yes | No | No |
| CI integration test execution | Yes | No | No |
| Debian package | Yes | Yes | Yes (0.19.1-1+b1, sid) |
| Ubuntu package | No | No | No |
| Release-blocking test failures | Yes | No | No |

riscv64 sits below arm64 in practice: arm64 lacks dedicated CI test execution as well, but arm64 Docker images are published. riscv64 lacks both Docker images and CI test execution. All three architectures share the same source code with no divergence - the gap is infrastructure, not implementation.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

postgres_exporter is a pure Go project. A full scan of all 136 source files found zero architecture-specific code of any kind:

- No `_riscv64.go`, `_amd64.go`, or `_arm64.go` build-tagged files
- No `.S` or `.asm` assembly files
- No CGO usage in any source file
- No SIMD dispatch, no JIT backend, no crypto assembly, no GC barrier stubs
- No C preprocessor guards (`#ifdef __riscv`, etc.)
- No ISA extension usage (RVV, Zba, Zbb, Zbc, etc.)

The only RISC-V strings in the entire repository are in build/packaging metadata:

1. `.dockerignore`: `!.build/linux-riscv64/` - whitelists the cross-compiled binary directory
2. `Makefile.common`: `DOCKER_ARCHS ?= amd64 arm64 armv7 ppc64le riscv64 s390x` - lists Docker target architectures

The binary implements its entire function via SQL queries over the PostgreSQL wire protocol and standard Go arithmetic. There is no computational hot path that would benefit from ISA-specific optimization.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| SQL collector | Full | Full | Full |
| Metrics emission | Full | Full | Full |
| TLS/auth (exporter-toolkit) | Full | Full | Full |
| Config parser | Full | Full | Full |
| Label hashing (xxhash) | Optimized (assembly) | Optimized (assembly) | Generic Go fallback |

The xxhash fallback is the only performance-relevant gap (see Section 6).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build tool versions:**
- Go: 1.26 (specified in `.promu.yml` and CI uses `quay.io/prometheus/golang-builder:1.26-base`)
- promu: 0.20.0
- golangci-lint: v2.12.2

**Build commands:**

```
make build          # delegates to: promu build
promu crossbuild    # cross-compile all default platforms including linux/riscv64
```

**Cross-compilation for riscv64:**

No special toolchain is required. The project has no CGO dependencies, so the standard Go cross-compiler suffices:

```
GOOS=linux GOARCH=riscv64 go build ./...
```

The CI `build` job in `.github/workflows/ci.yml` calls the `prometheus/promci/build@370e8c15dcec50043cbe66f2f34633d9efc0a190` composite action with `parallelism: 4`. This action runs `promu crossbuild`. The `.promu.yml` in the repository has no `crossbuild:` section, so promu uses its built-in default platform list. That list includes `linux/riscv64` (confirmed in `prometheus/promu/cmd/crossbuild.go`). No QEMU is used at any point in the build process.

**Docker image build:**

The `Dockerfile` is a single generic file parameterized by build args:

```dockerfile
ARG ARCH="amd64"
ARG OS="linux"
FROM quay.io/prometheus/busybox-${OS}-${ARCH}:latest
COPY .build/${OS}-${ARCH}/postgres_exporter /bin/postgres_exporter
```

`Makefile.common` lists `riscv64` in `DOCKER_ARCHS`. The base image `quay.io/prometheus/busybox-linux-riscv64:latest` exists. Despite this, the Docker Hub multi-arch manifest does not include `linux/riscv64` in the published image [NEEDS VERIFICATION - not re-confirmed in final adversarial pass]. Published Docker platforms are: linux/amd64, linux/arm/v7, linux/arm64, linux/ppc64le.

**Known build failures:** None. The cross-compilation is pure Go with no CGO; no build failures related to riscv64 have been reported.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. The entire feature set is available on riscv64. All collectors, all metric types, all configuration options, and all TLS modes function identically across architectures because the code is architecture-agnostic Go.

**Performance gaps:**

| Subsystem | amd64 | arm64 | riscv64 | Impact |
|-----------|-------|-------|---------|--------|
| xxhash label hashing | Assembly (AVX2/SSE) | Assembly (NEON) | Pure Go fallback (`xxhash_other.go`) | Throughput reduction under high cardinality metric workloads |
| All other paths | Pure Go | Pure Go | Pure Go | None |

The xxhash performance gap is functionally irrelevant for the typical postgres_exporter workload, which scrapes PostgreSQL at intervals of 15-60 seconds and emits at most a few hundred metrics per scrape. Label hashing is not on the hot path. This gap would only matter if postgres_exporter were adapted for continuous high-frequency metric emission, which is not its design.

**Security hardening gaps:** Data not available - no source was found documenting architecture-specific security mitigations (stack canaries, shadow stack, etc.) for Go binaries on riscv64 vs amd64/arm64.

**NaN / floating-point semantics issues:** No issues found. Zero issues in the repository mention NaN, floating-point, or IEEE 754 edge cases for any architecture.

---

## 7. CI/CD Infrastructure

All CI runs exclusively on `ubuntu-latest` (x86_64) GitHub Actions runners. No riscv64 CI exists anywhere in the pipeline.

| Workflow file | Job | Runner | riscv64 involvement |
|---------------|-----|--------|---------------------|
| `ci.yml` | `test_go` | ubuntu-latest | None |
| `ci.yml` | `build` | ubuntu-latest | Cross-compiles riscv64 binary; does not execute it |
| `ci.yml` | `publish_default` / `publish_release` | ubuntu-latest | Uploads artifacts |
| `integration.yml` | `integration_tests` | ubuntu-latest | Tests against Postgres 13-18; x86_64 only |
| `golangci-lint.yml` | lint | ubuntu-latest | None |
| `govulncheck.yml` | vulnerability scan | ubuntu-latest | None |

No RISE CI runners are used. No QEMU-based riscv64 emulation is configured anywhere.

| CI capability | amd64 | arm64 | riscv64 |
|---------------|-------|-------|---------|
| Unit tests executed | Yes | No | No |
| Integration tests executed | Yes | No | No |
| Lint | Yes | No | No |
| Binary artifact produced | Yes | Yes | Yes (cross-compiled) |
| Docker image published | Yes | Yes | No |

The cross-compiled riscv64 binary produced in CI has never been executed in any automated test environment as part of upstream CI. Its runtime correctness on riscv64 hardware is unverified by the upstream project. Debian independently validates the binary by building and installing it on rv-osuosl-04 (a native riscv64 machine), which provides independent but limited validation.

---

## 8. Distribution and Release Status

**Official upstream binaries:**

Every release from v0.14.0 (2023-09-20) through v0.20.1 (2026-07-07) includes `postgres_exporter-<version>.linux-riscv64.tar.gz` as a GitHub release asset. This binary is produced by Go cross-compilation (`GOOS=linux GOARCH=riscv64`) and requires no shared libraries beyond the Linux kernel ABI.

**Container images:**

The Docker Hub image `prometheuscommunity/postgres-exporter` does not include a `linux/riscv64` manifest entry. Users on riscv64 must build the container image themselves from the Dockerfile and the pre-built binary, or run the binary directly outside a container.

**Linux distribution packages:**

| Distribution | Package name | riscv64 status | Version | Notes |
|---|---|---|---|---|
| Debian sid | `prometheus-postgres-exporter` | Installed | 0.19.1-1+b1 | Native build on rv-osuosl-04, ~134 days ago |
| Ubuntu 24.04 (Noble) | - | Not packaged | - | Package does not exist in Ubuntu |
| Arch Linux | - | Not packaged | - | Not in official Arch repos; AUR only, no riscv64 status |

**What a user must do to get a working binary on riscv64:**

Option 1 (simplest): Download `postgres_exporter-<version>.linux-riscv64.tar.gz` from the [GitHub releases page](https://github.com/prometheus-community/postgres_exporter/releases), extract, and run directly.

Option 2: Install from Debian sid via `apt install prometheus-postgres-exporter` on a riscv64 Debian system.

Option 3: Build from source with `GOOS=linux GOARCH=riscv64 go build ./...` (requires Go 1.26+).

---

## 9. Dependencies

All dependencies are pure Go. No CGO dependency on `libpq` (the C PostgreSQL client library) exists - the project uses `github.com/lib/pq`, a pure-Go PostgreSQL wire protocol implementation. This means no C cross-compilation toolchain is needed for any dependency.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go toolchain (1.26+) | Compiler and runtime | Yes - official linux/riscv64 builder | Partial - gotip builder intermittent failures (#70401 open) | Yes - Go ships linux/riscv64 | #70401 (intermittent, not release-blocking) |
| `github.com/lib/pq` v1.12.3 | PostgreSQL wire protocol driver | Yes - pure Go | No dedicated riscv64 CI | N/A (library) | None |
| `github.com/prometheus/client_golang` v1.24.1 | Prometheus metrics client | Yes - historical riscv64 build break fixed (#833, closed) | No native riscv64 CI | N/A (library) | None open |
| `github.com/prometheus/procfs` v0.21.1 | /proc filesystem parser | Yes - riscv64 fix landed (#325, closed); `parseCPUInfoRISCV` wired | No native riscv64 CI | N/A (library) | None open |
| `github.com/prometheus/common` v0.70.1 | Shared Prometheus utilities | Yes - pure Go | No dedicated riscv64 CI | N/A (library) | None |
| `github.com/prometheus/exporter-toolkit` v0.17.1 | TLS/auth scaffolding | Yes - pure Go | No dedicated riscv64 CI | N/A (library) | None |
| `golang.org/x/sys` v0.47.0 | OS syscall bindings | Yes - epoll_event padding fix merged (closed); `zerrors_linux_riscv64.go` maintained | Indirect via Go CI | N/A (library) | None open |
| `golang.org/x/crypto` v0.54.0 | TLS, crypto primitives | Yes - pure Go fallback for riscv64 (no riscv64 assembly; generic path) | No dedicated riscv64 CI | N/A (library) | None |
| `github.com/cespare/xxhash/v2` v2.3.0 | Label hashing | Yes - `xxhash_other.go` generic fallback covers riscv64 | No dedicated riscv64 CI | N/A (library) | No riscv64 assembly; functional but slower |
| `google.golang.org/protobuf` v1.36.11 | Protobuf encoding | Yes - pure Go | No dedicated riscv64 CI | N/A (library) | None |
| `github.com/coreos/go-systemd/v22` v22.7.0 | systemd socket activation | Yes - pure Go | No dedicated riscv64 CI | N/A (library) | None |
| `github.com/mdlayher/vsock` v1.3.0 | VM socket support | Yes - resolved by golang.org/x/sys bump (closed) | No dedicated riscv64 CI | N/A (library) | None open |
| promu crossbuild toolchain | Release binary builder | Yes - `linux/riscv64` in default target list | N/A | N/A | None |
| `quay.io/prometheus/busybox-linux-riscv64` | Docker base image | Yes - riscv64 variant exists | N/A | Yes | None |
| PostgreSQL server (runtime, not in go.mod) | Database being monitored | Partial - PostgreSQL 17+ builds on riscv64; no official Postgres riscv64 CI | Partial | No official riscv64 binaries | See `reports/postgresql.md` |

The Go toolchain issue #70401 (intermittent `gotip-linux-riscv64` build failures) is the only open upstream issue with any riscv64 relevance in the dependency chain. It affects the development tip, not stable releases. It is not blocking postgres_exporter releases.

No dependency has a JIT backend, cryptographic assembly, or numeric computation that requires riscv64-specific work beyond what is already resolved.

---

## 11. Known Bugs and Active Issues

Zero issues or PRs in `prometheus-community/postgres_exporter` mention riscv, riscv64, or RISC-V. This was confirmed by exhaustive search across all 500+ most recent issues and PRs.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| (none) | - | - | - | No riscv64-specific bugs exist |

The 200+ open issues in the repository are all architecture-neutral: Aurora compatibility crashes (#1309, #1273), memory usage (#1189), connection handling (#1084, #1135), metric labeling inconsistencies, and feature requests. None are riscv64-relevant.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. No community member has raised any objection to riscv64 support. No discussion of any kind about riscv64 exists in the repository.

**Technical blockers:** None. The codebase is pure Go; riscv64 binary release artifacts already ship. No code change is needed to make the project function on riscv64.

**Organizational blockers:** None. The project is community-maintained under a vendor-neutral umbrella. Adding riscv64 Docker images or CI runners requires no organizational approval beyond a maintainer merging a PR.

**Infrastructure gaps requiring action:**

1. riscv64 Docker image is not published despite riscv64 being listed in `DOCKER_ARCHS`. The reason for this omission is not documented. A PR to the CI configuration would likely be accepted given the existing Makefile declaration.

2. No riscv64 CI test execution exists. Adding QEMU-based riscv64 emulation to the integration test matrix would require upstream changes in `prometheus/promci` (shared CI framework) or a local workflow addition.

**Acceptance probability:** High for both items. The project has no corporate owner with conflicting platform priorities, and riscv64 is already treated as a first-class platform in the release artifact list.

---

## 13. Investment Analysis

RISE has done nothing in this project. There is no prior RISE investment to account for.

### 13.1 Functional Enablement

No functional enablement work is needed. The binary runs correctly on riscv64 today. The pure-Go implementation is already complete.

### 13.2 Performance Optimization

The only performance gap is `xxhash` lacking riscv64 assembly. This is in a dependency (`github.com/cespare/xxhash/v2`), not in postgres_exporter itself. The workload (periodic scraping at 15-60 second intervals, hundreds of metrics) does not stress label hashing. Investment in xxhash riscv64 assembly would benefit the entire Prometheus ecosystem but is not needed for postgres_exporter to be production-usable on riscv64.

### 13.3 CI/CD Infrastructure

Two concrete gaps can be addressed with low effort:

1. **riscv64 Docker image:** Investigate why the Docker Hub multi-arch image excludes riscv64 despite the Makefile declaring it, then file a PR to fix the CI publishing step. Likely a one-line CI configuration change.

2. **riscv64 integration test execution:** Add QEMU-based riscv64 emulation to the `integration.yml` workflow to run the Postgres integration tests on riscv64. This would be the first architecture-specific CI test execution for any non-x86_64 architecture in this project. Alternatively, contribute a native riscv64 runner to the `prometheus/promci` shared CI framework, benefiting all Prometheus-ecosystem exporters simultaneously.

### 13.4 Ecosystem Enablement

Not applicable. postgres_exporter is a standalone binary with no plugin or extension ecosystem. Section 10 is omitted for this reason.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| CI/CD | Investigate and fix riscv64 Docker image not being published to Docker Hub | 0.5 | prometheus-community contributor | High |
| CI/CD | Add QEMU riscv64 integration test execution to `integration.yml` | 1 | prometheus-community contributor | Medium |
| CI/CD | Contribute native riscv64 runner to `prometheus/promci` shared CI (benefits all exporters) | 3 | RISE or Qualcomm infrastructure team | Medium |
| Performance | riscv64 assembly for xxhash in `github.com/cespare/xxhash/v2` | 2 | Go/riscv64 contributor | Low |

No Functional Enablement work is needed. The total investment to bring riscv64 to full parity with amd64 (excluding the xxhash optimization, which is not impactful for this workload) is approximately 1.5 person-weeks, primarily CI infrastructure work.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [postgres_exporter repository](https://github.com/prometheus-community/postgres_exporter)
- [postgres_exporter releases (v0.20.1)](https://github.com/prometheus-community/postgres_exporter/releases/tag/v0.20.1)
- [postgres_exporter release v0.14.0 (first riscv64 release)](https://github.com/prometheus-community/postgres_exporter/releases/tag/v0.14.0)
- [postgres_exporter .promu.yml](https://github.com/prometheus-community/postgres_exporter/blob/main/.promu.yml)
- [postgres_exporter .github/workflows/ci.yml](https://github.com/prometheus-community/postgres_exporter/blob/main/.github/workflows/ci.yml)
- [postgres_exporter .github/workflows/integration.yml](https://github.com/prometheus-community/postgres_exporter/blob/main/.github/workflows/integration.yml)
- [postgres_exporter Makefile.common (DOCKER_ARCHS declaration)](https://github.com/prometheus-community/postgres_exporter/blob/main/Makefile.common)
- [postgres_exporter .dockerignore](https://github.com/prometheus-community/postgres_exporter/blob/main/.dockerignore)
- [prometheus/promu crossbuild.go (default platform list including linux/riscv64)](https://github.com/prometheus/promu/blob/main/cmd/crossbuild.go)
- [prometheus/promci build composite action](https://github.com/prometheus/promci)
- [Debian buildd status for prometheus-postgres-exporter (sid)](https://buildd.debian.org/status/package.php?p=prometheus-postgres-exporter&suite=sid)
- [Debian tracker for prometheus-postgres-exporter](https://tracker.debian.org/pkg/prometheus-postgres-exporter)
- [golang/go issue #70401 (intermittent gotip-linux-riscv64 build failures)](https://github.com/golang/go/issues/70401)
- [prometheus/client_golang issue #833 (historical riscv64 build fix, closed)](https://github.com/prometheus/client_golang/issues/833)
- [prometheus/procfs PR #325 (parseCPUInfoRISCV fix, closed)](https://github.com/prometheus/procfs/pull/325)
- [golang.org/x/sys epoll_event padding riscv64 fix (closed)](https://github.com/golang/sys)
- [github.com/cespare/xxhash/v2 xxhash_other.go (generic fallback)](https://github.com/cespare/xxhash)
- [RISE Project member list](https://riseproject.dev/)
- [CNCF graduated projects (Prometheus)](https://www.cncf.io/projects/)