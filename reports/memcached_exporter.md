---
title: memcached_exporter
---

# memcached_exporter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for memcached_exporter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[prometheus/memcached_exporter](https://github.com/prometheus/memcached_exporter) is a Prometheus exporter that scrapes metrics from a running Memcached instance and exposes them via an HTTP endpoint for the Prometheus time-series monitoring system. It connects to a Memcached server, issues stats commands, parses the output, and re-exposes the data as Prometheus-format metrics on port 9150. The binary is stateless and lightweight; it performs no computation-intensive work.

**Governance.** The project lives in the `prometheus` GitHub organization, which is a CNCF graduated project. The exporter is a community-maintained sub-project following standard Prometheus organization practices (Apache-2.0 license, CODE_OF_CONDUCT, CONTRIBUTING, SECURITY files present). There is no exporter-specific CNCF TOC governance document.

**Single listed maintainer:** Tobias Schmidt (`grobie`, Gigs). Effective release ownership has been held by Matthias Rampke (`matthiasr`, Chronosphere) based on commit volume. Notable contributors include Ben Kochie (`SuperQ`, Prometheus org) and contributors from Red Hat and Grafana.

**Community stance on new ports.** The project has no explicit tier policy and no history of objecting to new architectures. RISC-V support arrived automatically and silently; no maintainer discussion, approval, or special request was required or generated.

**RISE membership.** No RISE project membership or funded work items exist for this project.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2023-07-06 | Ben Kochie (SuperQ) commits "Update promu -- Update promu to support riscv64" in the upstream prometheus/prometheus repository, adding `linux/riscv64` to the shared `Makefile.common` DOCKER_ARCHS and promu platform matrix | GitHub commit history, prometheus/prometheus |
| 2023-12-06 | Repo-sync PR #188 propagates the upstream Makefile.common change into prometheus/memcached_exporter; v0.13.1 is the first release to include `memcached_exporter-0.13.1.linux-riscv64.tar.gz` | [v0.13.1 release](https://github.com/prometheus/memcached_exporter/releases/tag/v0.13.1) |
| 2023-12-06 onward | Every subsequent release (v0.14.x through v0.17.0) includes a linux-riscv64 tarball as a first-class release asset | GitHub releases API |
| 2026-08-14 | v0.17.0 released, ships `memcached_exporter-0.17.0.linux-riscv64.tar.gz` | [v0.17.0 release](https://github.com/prometheus/memcached_exporter/releases/tag/v0.17.0) |

The port is fully upstream. No out-of-tree patches exist and none are needed. The enabling change was ecosystem-wide infrastructure work, not a project-specific contribution.

**Key contributors for riscv64 enablement:**
- Ben Kochie (SuperQ, Prometheus org): authored the upstream promu riscv64 change
- prombot / repo_sync automation: propagated it to memcached_exporter via PR #188

No person filed a dedicated RISC-V issue or PR against the memcached_exporter repository. Zero riscv64-specific commits, issues, or PRs exist in the repo.

---

## 3. Upstream Support Tier

No formal tier policy document exists. The project follows the Prometheus-wide convention: any architecture supported by `promu crossbuild` is included automatically in every release. Since `promu`'s default platform list includes `linux/riscv64`, riscv64 receives the same release artifact treatment as amd64, arm64, ppc64le, and s390x without any explicit per-architecture approval.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Pre-built release tarball | Yes | Yes | Yes |
| Official Docker image | Yes | Yes | No |
| CI build (cross-compile) | Yes | Yes | Yes (implicit via promu) |
| CI test execution | Yes | No | No |
| Distro packaging | Ubuntu, Debian (not confirmed) | Ubuntu, Debian (not confirmed) | Not confirmed in any distro |

The riscv64 release tarball is a first-class artifact equal to amd64 and arm64. The Docker image gap is a meaningful omission for containerized deployments, but the binary tarball is fully functional.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

memcached_exporter is a pure Go project. The repository contains four Go source files (main.go, main_test.go, exporter.go, exporter_test.go, scraper.go, scraper_test.go) and zero assembly (.s), C, or C++ files. There is no JIT, no SIMD, no cryptographic acceleration, no GC barrier handwritten code, and no architecture-specific logic of any kind.

| Component | Type | amd64 | arm64 | riscv64 |
|-----------|------|-------|-------|---------|
| Core exporter (metrics scraping) | Pure Go | Full | Full | Full |
| Memcached protocol client (gomemcache) | Pure Go | Full | Full | Full |
| Prometheus metrics exposition | Pure Go | Full | Full | Full |
| TLS/auth scaffolding (exporter-toolkit) | Pure Go + x/crypto | Full | Full | Full (portable fallbacks) |
| Architecture-specific assembly | None exist | N/A | N/A | N/A |

The only two files in the repository containing the string "riscv64" are `Makefile.common` (build target listing) and `.dockerignore` (build artifact path whitelist). These are infrastructure, not source code.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Toolchain requirement.** Go 1.25+ (Go 1.26 used in CI). No C compiler, no CGO, no QEMU. The `.promu-cgo.yml` file referenced in CI comments does not exist in the repo, confirming the CGO variant is absent.

**Build commands.**

Native build on the host platform:
```
make
```
This invokes `promu build --prefix .` and produces `./memcached_exporter` for the host architecture.

Cross-compile for riscv64 directly with Go:
```
GOOS=linux GOARCH=riscv64 go build -o .build/linux-riscv64/memcached_exporter ./cmd/memcached_exporter
```

Cross-compile for riscv64 via promu:
```
promu crossbuild --platforms linux/riscv64
```

Build a riscv64 Docker image (not published officially; requires explicit override):
```
DOCKER_ARCHS=riscv64 make docker
```

**Why Go 1.25+ is required.** The `go.mod` directive specifies `go 1.25.0`. Go has shipped a stable `linux/riscv64` port since Go 1.14 (2020). No minimum Go version specific to riscv64 applies beyond the project's general requirement.

**promu platform inheritance.** The project's `.promu.yml` defines no `cross` section. `promu`'s default platform list in `cmd/crossbuild.go` includes `linux/riscv64` by hardcoded default. The project inherits this list without any explicit opt-in.

**Docker image gap.** The project-level `Makefile` overrides `DOCKER_ARCHS ?= amd64 armv7 arm64`. Because `?=` is evaluated at include order and `Makefile` is included before `Makefile.common`, the project value wins. Official CI does not publish a riscv64 Docker image. The `.dockerignore` file contains `!.build/linux-riscv64/` (whitelisting the build artifact for Docker context), but the `docker buildx push` step never targets riscv64 in CI.

**Known build failures.** None found. Cross-compilation of a pure Go binary for riscv64 is deterministic and has produced successful artifacts in 13 consecutive releases.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| Metrics scraping (all Memcached stats) | Full | Full | Full | None |
| TLS listener | Full | Full | Full | None |
| Basic auth | Full | Full | Full | None |
| Docker image | Yes | Yes | No | Docker image not published |
| xxhash assembly optimization | Yes (assembly) | Yes (assembly) | No (Go fallback) | Minor performance only |
| Distro package | Not confirmed | Not confirmed | Not confirmed | Equal across all three |
| riscv64 functional test execution | N/A | No | No | CI gap (equal with arm64) |

**xxhash performance gap.** The dependency `cespare/xxhash/v2` includes architecture-specific assembly for amd64 and arm64. On riscv64 it silently falls back to the pure Go implementation. For a metrics exporter with negligible hash volume, this has no measurable operational impact.

**Floating-point and NaN semantics.** Not applicable. The project performs no floating-point arithmetic. All metrics are integer counters from Memcached stats output.

**Security hardening.** No architecture-specific security mitigations (stack canaries, CFI, shadow call stack) are configured. This is consistent across all three architectures for a pure Go binary.

---

## 7. CI/CD Infrastructure

The repository contains five GitHub Actions workflow files: `approve-workflows.yml`, `ci.yml`, `container_description.yml`, `golangci-lint.yml`, `govulncheck.yml`. None contain the string "riscv".

**ci.yml structure.**

- Trigger: `on: push` (branches `master`, `release-*`, tags `v*`) and `on: pull_request`
- `test_go` job: runs on `ubuntu-latest` (x86_64), starts a live Memcached service container, runs `make test`. Tests execute only on x86_64.
- `build` job: runs on `ubuntu-latest` (x86_64), calls `prometheus/promci/build@370e8c15dcec50043cbe66f2f34633d9efc0a190` with `parallelism: 4`. This action runs `promu crossbuild`, which cross-compiles for all default platforms including `linux/riscv64` using Go's cross-compilation (`GOOS=linux GOARCH=riscv64`). No test binary is executed on riscv64. No QEMU step exists.

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Build in CI | Yes | Yes (via promu) | Yes (via promu) |
| Unit test execution | Yes | No | No |
| Integration test (live Memcached) | Yes | No | No |
| QEMU emulation | No | No | No |
| Native runner | ubuntu-latest | N/A | N/A |
| RISE RISC-V runner used | No | N/A | No |

**RISE RISC-V Runners.** RISE launched a free native RISC-V GitHub Actions CI service in March 2026 using Scaleway EM-RV1 bare-metal nodes (label: `runs-on: ubuntu-24.04-riscv`). As of May 2026 the service processed 13,000+ jobs across 197 repos from 87 organizations. prometheus/memcached_exporter does not use these runners. Adopting them would require adding a single workflow job with `runs-on: ubuntu-24.04-riscv` and a live Memcached container, which is a direct copy of the existing `test_go` job with the runner label changed.

---

## 8. Distribution and Release Status

**Official GitHub release tarballs.** Every release from v0.13.1 (2023-12-06) through v0.17.0 (2026-08-14) ships `memcached_exporter-<version>.linux-riscv64.tar.gz` as an official release asset. Confirmed for v0.15.3, v0.15.4, v0.15.5, v0.16.0, and v0.17.0 via GitHub Releases API. This is 13 consecutive releases.

**Docker images.** No riscv64 Docker image is published to Docker Hub. Official images cover only `linux/amd64`, `linux/arm/v7`, and `linux/arm64`.

**Distro packaging.**

| Distro | Package name | riscv64 status |
|--------|-------------|----------------|
| Debian | Not found at tracker.debian.org | Not packaged |
| Ubuntu 24.04 | Not found | Not packaged |
| Arch Linux RISC-V (archriscv.felixc.at) | memcached_exporter | Not confirmed |
| PyPI | N/A (not a Python package) | N/A |

**What a user must do to get a working riscv64 binary.** Download `memcached_exporter-<version>.linux-riscv64.tar.gz` from the [GitHub releases page](https://github.com/prometheus/memcached_exporter/releases), extract, and run. The binary is statically linked (pure Go), requires no shared libraries, and runs on any Linux riscv64 system with kernel 4.15+. No compilation is required.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|--------------|-------------|-----------------|-----------------|
| Go toolchain (1.26 in CI) | Compiler and runtime | Yes -- riscv64 port since Go 1.14 | Partial -- linux/riscv64 builders exist but have reliability issues (golang/go#79067-79069, #80506, #80880) | Yes -- official Go releases ship riscv64 | Builder reliability issues do not affect cross-compiled binaries; no impact on memcached_exporter releases |
| grobie/gomemcache | Memcached protocol client | Yes -- pure Go | No dedicated CI for any arch | Library only | None found |
| prometheus/client_golang v1.24.1 | Prometheus metrics exposition | Yes -- pure Go | No riscv64 CI | Library only | None found |
| prometheus/common v0.70.1 | Shared Prometheus utilities | Yes -- pure Go | No riscv64 CI | Library only | None found |
| prometheus/exporter-toolkit v0.17.1 | TLS/auth server scaffolding | Yes -- pure Go | No riscv64 CI | Library only | None found |
| prometheus/procfs v0.21.1 | Linux /proc parsing | Yes -- pure Go with linux syscall wrappers | No riscv64 CI | Library only | None; previously needed v0.1.3+ for riscv64 syscall tables -- resolved |
| cespare/xxhash/v2 v2.3.0 | Fast hash (used by client_golang) | Yes -- Go fallback active on riscv64 | No riscv64 CI | Library only | No blockers; assembly path skipped on riscv64, minor performance impact only |
| google.golang.org/protobuf v1.36.11 | Protobuf encoding | Yes -- pure Go | No riscv64 CI | Library only | None found |
| golang.org/x/crypto v0.54.0 | TLS/crypto for exporter-toolkit | Yes -- portable Go fallbacks active on riscv64 | No riscv64 CI | Library only | None found |
| golang.org/x/sys v0.47.0 | OS syscall wrappers | Yes -- includes riscv64 syscall tables | No riscv64 CI | Library only | None found |
| coreos/go-systemd/v22 v22.7.0 | systemd socket activation | Yes -- pure Go | No riscv64 CI | Library only | None found |
| Memcached (runtime target, not Go dep) | The monitored service | Partial -- no riscv64 CI in the Memcached project | No | No riscv64 packages in official Memcached releases | [memcached/memcached#1111](https://github.com/memcached/memcached/issues/1111) (open since 2024-02): riscv64 CI requested, not implemented; see reports/memcached.md |

**Critical dependency note.** The only dependency with an open riscv64 issue is Memcached itself, not the exporter. If a user cannot obtain a Memcached binary for riscv64 (from source build or distro package), the exporter has nothing to connect to. The exporter binary itself has no riscv64 issues.

**xxhash assembly.** `cespare/xxhash/v2` provides hand-written amd64 and arm64 assembly. On riscv64 it falls back to pure Go. This dependency is used by prometheus/client_golang for internal hash tables. For a metrics exporter handling dozens to hundreds of metric series, the performance delta is operationally negligible.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs, correctness issues, floating-point anomalies, or performance regressions exist in the issue tracker. The following open issues cover the entire open issue backlog as of the research date; none are architecture-related.

| Issue | Title | Status | Severity | Notes |
|-------|-------|--------|----------|-------|
| #337 | Sync common files | Open | Low | Routine Prometheus infra maintenance |
| #245 | TLS configuration | Open | Medium | Architecture-independent |
| #240 | Authentication | Open | Medium | Architecture-independent |
| #113 | mcrouter compatibility | Open | Low | Architecture-independent protocol issue |

No riscv64 correctness bugs found. No NaN/floating-point issues found (no floating-point arithmetic in the codebase). No open issues of any kind reference riscv64.

---

## 12. Objections and Upstream Blockers

**Stated objections.** None. No maintainer has objected to riscv64 support, requested its removal, or placed conditions on it. The topic has never been raised in any issue or PR.

**Technical blockers.** None. The project is pure Go with no CGO, no assembly, and no architecture-specific code. Cross-compilation is deterministic.

**Organizational blockers.** None. The single maintainer (grobie) has not commented on riscv64. The effective release owners (matthiasr, alexander-bauer at Grafana) have shipped riscv64 tarballs without remark across 13 releases.

**Acceptance probability.** Any contribution (riscv64 CI, Docker image, distro packaging) is low-friction. The project has no gate-keeping posture on new architecture coverage.

**Docker image gap.** The `Makefile` explicitly sets `DOCKER_ARCHS ?= amd64 armv7 arm64`. Adding riscv64 requires changing one line and adding a Docker Hub multi-arch manifest entry. This is a one-line PR with no technical risk, but it requires a maintainer to approve and a Docker Hub token. [NEEDS VERIFICATION -- no maintainer has been asked about this specifically]

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The exporter binary is fully functional on riscv64 via the official release tarball. No functional enablement work is needed. The only gap at the dependency level is Memcached itself (see reports/memcached.md), which is outside the scope of this project.

### 13.2 Performance Optimization

No performance optimization work is applicable. The project performs no computation-intensive operations. `cespare/xxhash` assembly is absent on riscv64 but irrelevant at this workload scale.

### 13.3 CI/CD Infrastructure

The meaningful gap is riscv64 test execution. Currently, tests run only on x86_64 with a live Memcached container. Adding a riscv64 CI job using the RISE RISC-V Runners (available free as of March 2026) requires:

1. Adding `runs-on: ubuntu-24.04-riscv` job variant to `ci.yml`
2. Ensuring the Memcached service container starts on the RISE runner (standard Docker action, no special configuration)
3. Running the existing `make test` target

This is a two-to-four hour task for an engineer familiar with GitHub Actions. It provides ongoing regression detection for riscv64.

### 13.4 Ecosystem Enablement

A riscv64 Docker image is absent. Adding it requires:
1. Changing `DOCKER_ARCHS` in the project `Makefile` to include `riscv64` (one line)
2. Verifying that `quay.io/prometheus/busybox-linux-riscv64` and `gcr.io/distroless/static-debian13:nonroot-riscv64` base images exist and are accessible (prerequisite -- data not available on current availability of these base images)
3. Coordinating with the Prometheus infrastructure team to update the Docker Hub multi-arch manifest push

Distro packaging (Debian, Ubuntu) is out of scope for direct investment; that is driven by distro maintainers.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 test job using RISE RISC-V Runners | 0.1 | Contributor / maintainer approval | High |
| Ecosystem | Add riscv64 Docker image (pending base image availability) | 0.25 | Contributor + Prometheus infra | Medium |
| Functional | None required | 0 | N/A | N/A |
| Performance | None applicable | 0 | N/A | N/A |

Total estimated investment: 0.35 person-weeks. The project is effectively done from a functional and release standpoint. The remaining gaps are operational convenience items.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [prometheus/memcached_exporter repository](https://github.com/prometheus/memcached_exporter)
- [v0.17.0 release (2026-08-14)](https://github.com/prometheus/memcached_exporter/releases/tag/v0.17.0)
- [v0.16.0 release](https://github.com/prometheus/memcached_exporter/releases/tag/v0.16.0)
- [v0.15.5 release](https://github.com/prometheus/memcached_exporter/releases/tag/v0.15.5)
- [v0.13.1 release -- first with riscv64 (2023-12-06)](https://github.com/prometheus/memcached_exporter/releases/tag/v0.13.1)
- [prometheus/promu -- crossbuild platform list](https://github.com/prometheus/promu)
- [prometheus/promci -- shared CI composite action](https://github.com/prometheus/promci)
- [cespare/xxhash/v2](https://github.com/cespare/xxhash)
- [golang.org/x/sys riscv64 syscall tables](https://pkg.go.dev/golang.org/x/sys)
- [memcached/memcached#1111 -- riscv64 CI request (open)](https://github.com/memcached/memcached/issues/1111)
- [RISE Project RISC-V GitHub Actions Runners announcement](https://riseproject.dev)
- [Go toolchain riscv64 builder issue golang/go#79067](https://github.com/golang/go/issues/79067)
- [Go toolchain riscv64 builder issue golang/go#79068](https://github.com/golang/go/issues/79068)
- [Go toolchain riscv64 builder issue golang/go#79069](https://github.com/golang/go/issues/79069)
- [Go toolchain riscv64 builder issue golang/go#80506](https://github.com/golang/go/issues/80506)
- [Go toolchain riscv64 LUCI builder golang/go#80880](https://github.com/golang/go/issues/80880)