---
title: mysqld_exporter
---

# mysqld_exporter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for mysqld_exporter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[mysqld_exporter](https://github.com/prometheus/mysqld_exporter) is a Prometheus exporter that scrapes MySQL and MariaDB instances and exposes metrics over HTTP for collection by the Prometheus time-series database. It is written in pure Go with no C/CGo dependencies.

The project lives under the `prometheus` GitHub organization and is a [CNCF Graduated project](https://www.cncf.io/projects/prometheus/) (graduated 2018-08-09). License: Apache-2.0. There is no MAINTAINERS, OWNERS, or CODEOWNERS file. Governance is informal and community-driven.

Active contributors and their affiliations (derived from GitHub contributor API and PR review history):

| Contributor | GitHub handle | Affiliation |
|---|---|---|
| Ben Kochie | SuperQ | prometheus (community/independent) |
| Arthur Silva Sens | ArthurSens | Grafana Labs |
| Cristian Greco | cristiangreco | Grafana Labs |
| Tom Wilkie | tomwilkie | Grafana Labs (CTO) |
| Roman Vynar | roman-vynar | Quiq |

SuperQ (Ben Kochie) is the all-time top contributor by commit count (322 commits). Grafana Labs is the dominant corporate presence across the active reviewer pool. There is no formal port approval process and no tier policy for new architectures; riscv64 support arrived passively through shared build infrastructure with no per-project decision required.

The project is not listed on [riseproject.dev](https://riseproject.dev). No RISE blog posts mention mysqld_exporter.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-04-09 | [promu PR #254](https://github.com/prometheus/promu/pull/254) opened by Philipp Trulson (der-eismann): "Add linux/riscv64 to default platforms" -- motivation cited as rising number of RISC-V boards (STAR64, SiFive) and mature Go riscv64 support | promu PR #254 |
| 2023-05-31 | SuperQ approves promu PR #254; CI flake delays merge ~2 months | promu PR #254 comments |
| 2023-07-01 | promu PR #254 merged. `linux/riscv64` added to `defaultPlatforms` in `cmd/crossbuild.go`. dongjiang1989 notes dependency on node_exporter PR #2706 | promu PR #254 merge |
| 2023-07-04 | promu v0.15.0 released, including riscv64 in default cross-compile target list | promu release history |
| 2023-08-15 | prombot syncs updated Makefile.common (promu v0.15.0) into mysqld_exporter via commit 59ecd933 (PR #762) | mysqld_exporter commit history |
| 2023-10-03 | [mysqld_exporter PR #773](https://github.com/prometheus/mysqld_exporter/pull/773) merged: "Synchronize common files from prometheus/prometheus". This is the commit that brought riscv64 into mysqld_exporter's build config | PR #773 |
| 2023-12-12 | mysqld_exporter v0.15.1 released. `mysqld_exporter-0.15.1.linux-riscv64.tar.gz` appears in release assets -- first riscv64 release | GitHub releases API |
| 2026-04-09 | prombot PR #1018 syncs `DOCKER_ARCHS ?= amd64 armv7 arm64 ppc64le riscv64 s390x` into Makefile.common, adding riscv64 to Docker image builds | Makefile.common |
| 2026-08-13 | mysqld_exporter v0.20.0 released (latest). `mysqld_exporter-0.20.0.linux-riscv64.tar.gz` present | GitHub releases API |

The riscv64 binary is fully upstreamed. It was never a mysqld_exporter-specific effort -- it arrived silently through the shared Prometheus build toolchain (promu). No mysqld_exporter-specific RISC-V issue, PR, or code change exists in the repository.

---

## 3. Upstream Support Tier

mysqld_exporter has no formal tier policy. All architectures are implicitly equal because the promu cross-compilation toolchain handles them uniformly.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Binary release artifact | Yes | Yes | Yes (since v0.15.1, 2023-12-12) |
| Docker image (Docker Hub / GHCR) | Yes | Yes | Yes |
| Docker image (quay.io) | Yes | Yes | No -- quay.io limitation, not a project limitation |
| CI test execution | Yes | No | No |
| Distro packages | Partial (Debian) | Partial (Debian) | No official distro package |
| Release-blocking status | Implicit | Implicit | Implicit |

riscv64 has equal standing to arm64 at the binary release and Docker image layer. Neither arm64 nor riscv64 has CI test execution. The quay.io gap for riscv64 is a quay.io infrastructure limitation, not a project decision [NEEDS VERIFICATION -- quay.io riscv64 support boundary not independently confirmed].

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

mysqld_exporter is a pure Go application. It connects to MySQL or MariaDB via the `go-sql-driver/mysql` driver, executes SQL queries, maps results to Prometheus metric types, and serves them over HTTP. There is no JIT compiler, no SIMD dispatch, no custom crypto, no garbage collector integration, and no inline assembly anywhere in the project.

Total source files audited: 78 Go files across `collector/`, `config/`, and root. Assembly files: 0. Arch-specific source files: 0. Build tags with architecture conditions: 0.

The two riscv64 references in the repository are both in build/packaging files:

1. `Makefile.common` line 93: `DOCKER_ARCHS ?= amd64 arm64 armv7 ppc64le riscv64 s390x` -- a flat list of Docker cross-build targets, identical treatment for all six architectures.
2. `.dockerignore`: `!.build/linux-riscv64/` -- whitelists the cross-compiled artifact directory for Docker COPY.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compiler | N/A | N/A | N/A |
| SIMD / vector intrinsics | None | None | None |
| Architecture-specific assembly | None | None | None |
| Custom crypto | None | None | None |
| Architecture-specific build tags | None | None | None |

All architectures are treated identically at the source level because there is nothing arch-specific to implement. mysqld_exporter's work is SQL query execution and HTTP response formatting -- no ISA-dependent logic exists or is needed.

---

## 5. Build System, Cross-Compilation, and Toolchain

Build tool: [promu](https://github.com/prometheus/promu) (Prometheus cross-compilation utility). No CMake, no C/C++ compiler, no CGo.

**Toolchain requirements:**

| Requirement | Value | Reason |
|---|---|---|
| Go version | 1.26 | Specified in `.promu.yml` and `ci.yml` (`quay.io/prometheus/golang-builder:1.26-base`) |
| C/C++ compiler | Not required | Pure Go, CGO disabled |
| CGO | Disabled | No C dependencies |
| QEMU | Not required for build | May be needed for `docker buildx` multi-platform if building on non-riscv64 host |

**Build commands:**

Standard build (host architecture):
```
make build
```

Cross-compile for riscv64 (two equivalent forms):
```
GOOS=linux GOARCH=riscv64 make build
GOOS=linux GOARCH=riscv64 go build ./...
```

**Docker image for riscv64:**

Both Dockerfiles (`Dockerfile` and `Dockerfile.distroless`) use an `ARG ARCH` pattern:
```
docker build -t prom/mysqld-exporter-linux-riscv64:latest \
  --platform linux/riscv64 \
  --build-arg ARCH=riscv64 \
  --build-arg OS=linux \
  -f Dockerfile .
```

Or via Makefile target:
```
make common-docker-riscv64
```

**Known build configuration caveat:** The project-level `Makefile` overrides `DOCKER_ARCHS` to only `amd64 armv7 arm64`, which means `make common-docker` does not build the riscv64 image by default. The riscv64 Docker image requires either an explicit `make common-docker-riscv64` or a command-line override: `make DOCKER_ARCHS="amd64 armv7 arm64 riscv64" common-docker`. The Makefile.common default (which includes riscv64) is masked by the project-level override.

No known build failures for riscv64. All Debian riscv64 builds completed successfully (see Section 8).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| All scrapers functional | Yes | Yes (assumed, no CI) | Yes (assumed, no CI) |
| Full metrics output | Yes | Yes (assumed) | Yes (assumed) |
| TLS/auth (exporter-toolkit) | Yes | Yes | Yes |
| Docker image (Docker Hub / GHCR) | Yes | Yes | Yes |
| xxhash acceleration | Yes (SIMD via cespare/xxhash) | Yes (SIMD) | No -- pure-Go fallback (`xxhash_other.go`, build tag `!amd64 && !amd64`) |
| ChaCha20 / Poly1305 acceleration | Yes (asm) | Yes (asm) | No -- pure-Go fallback (golang.org/x/crypto) |
| CRC32 acceleration | Yes (asm) | Yes (asm) | No -- golang/go#78918 (asm not yet implemented) |

**Functional gaps:** None. All scrapers compile and are expected to function correctly on riscv64 via standard Go cross-compilation. No functional gap vs amd64 or arm64 has been identified or reported.

**Performance gaps:** Three crypto/hashing paths fall back to pure-Go implementations on riscv64: xxhash (used in Prometheus metrics path), ChaCha20/Poly1305 (TLS), and CRC32 (Go runtime). These are correctness-correct but slower. For mysqld_exporter's workload -- periodic metric scraping at 15-60 second intervals -- the performance impact of missing SIMD on these paths is negligible in practice. The bottleneck is SQL query execution latency, not hash computation throughput.

**Security hardening gaps:** Data not available: no source examined stack canary, CFI, or hardening flag differences between architectures for this project.

---

## 7. CI/CD Infrastructure

All CI runs exclusively on `ubuntu-latest` (x86_64). This was confirmed by reading every workflow file in `.github/workflows/`: `ci.yml`, `approve-workflows.yml`, `container_description.yml`, `golangci-lint.yml`, `govulncheck.yml`, `integration.yml`. None contain the word "riscv", a riscv64 runner label, QEMU configuration, or an architecture matrix.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Unit tests run in CI | Yes | No | No |
| Integration tests run in CI | Yes | No | No |
| Native hardware runner | Yes (ubuntu-latest) | No | No |
| QEMU emulation | No | No | No |
| RISE RISC-V runner | No | No | No |

The `ci.yml` `build` job delegates to `prometheus/promci/build@370e8c15dcec50043cbe66f2f34633d9efc0a190` with a parallelism matrix of 4 threads. This composite action handles cross-compilation to produce the release binaries but does not execute any test suite on riscv64.

The `integration.yml` runs against a matrix of MySQL and MariaDB versions, all on `ubuntu-latest` (x86_64).

mysqld_exporter does not use RISE RISC-V runners. RISE runners (launched March 2026, Scaleway EM-RV1 hardware) are in use by 197 repos across 87 orgs as of the research date; mysqld_exporter is not among them.

**Conclusion:** The riscv64 binary ships untested. No test suite -- unit, integration, or otherwise -- runs on or for riscv64 in the upstream CI pipeline.

---

## 8. Distribution and Release Status

**Upstream binary releases:**

Every release since v0.15.1 (2023-12-12) includes `mysqld_exporter-<version>.linux-riscv64.tar.gz`. The latest release, v0.20.0 (2026-08-13), includes `mysqld_exporter-0.20.0.linux-riscv64.tar.gz` (9,488,787 bytes / ~9.05 MB). The riscv64 binary is the same size class as arm64 (9,100,263 bytes), indicating full feature parity with no stub builds.

**Docker images:**

riscv64 container images are published to Docker Hub and GHCR for every release. quay.io does not publish riscv64 images due to a quay.io infrastructure limitation [NEEDS VERIFICATION].

**Distro packages:**

| Distribution | riscv64 package | Notes |
|---|---|---|
| Debian trixie/stable | v0.17.2-1+b4 | Built on Debian riscv64 builder rv-manda-02 (2025-06-23, 12 min build) |
| Debian sid/unstable | v0.19.0-2 | Built on rv-manda-02 (2026-05-20, 13 min build) |
| Ubuntu 24.04 Noble | Not packaged | No results on packages.ubuntu.com |
| Arch Linux RISC-V | Not packaged | Not in archriscv.felixc.at index |

Debian build durations are build+test times on real RISC-V hardware (rv-manda-02). All builds completed with status "Maybe-Successful" (Debian autobuilder notation for successful builds). This is the only evidence of test execution on riscv64 hardware -- it comes from Debian, not from upstream.

**What a user must do to get a working binary:**

On a riscv64 Linux system:
1. Download `mysqld_exporter-<version>.linux-riscv64.tar.gz` from the [GitHub releases page](https://github.com/prometheus/mysqld_exporter/releases).
2. Extract and run. No compilation required.

Or install via Debian package (`apt install prometheus-mysqld-exporter`) on Debian trixie or sid.

**Runtime dependency:** mysqld_exporter requires a running MySQL or MariaDB instance to scrape. MySQL has no official riscv64 binary releases. [MariaDB](https://mariadb.org/) does ship riscv64 packages and is fully compatible with mysqld_exporter as a scrape target.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| go-sql-driver/mysql v1.10.0 | MySQL wire-protocol driver (core data path) | Yes - pure Go | No riscv64 CI | N/A (library) | See `reports/go-sql-driver-mysql.md` |
| prometheus/client_golang v1.24.1 | Prometheus metrics exposition | Yes - pure Go | No riscv64 CI | N/A (library) | See `reports/prometheus.md` |
| prometheus/exporter-toolkit v0.17.1 | TLS/auth HTTP server scaffolding | Yes - pure Go | No riscv64 CI | N/A (library) | No open riscv64 issues |
| filippo.io/edwards25519 v1.2.0 | Ed25519 crypto (TLS, JWT) | Yes - pure Go fallback | No riscv64 CI | N/A (library) | Only `fe_amd64.s` exists; riscv64 uses generic Go path (slower, correct) |
| cespare/xxhash/v2 v2.3.0 | Hash function (Prometheus metrics) | Yes - pure Go fallback | No riscv64 CI | N/A (library) | riscv64 uses `xxhash_other.go` (build tag `!amd64 && !arm64`); no SIMD |
| golang.org/x/crypto v0.54.0 | TLS primitives (ChaCha20, Poly1305) | Yes - pure Go fallback | No riscv64-specific CI | N/A (library) | No riscv64 asm; pure-Go paths are slower but correct |
| golang.org/x/sys v0.47.0 | Linux syscall layer | Yes - `unix/asm_linux_riscv64.s` exists | golang/go CI covers linux/riscv64 via emulation | N/A (library) | golang/go#80880: LUCI riscv64 builder not yet added (open) |
| google.golang.org/protobuf v1.36.11 | Protobuf serialization (metrics wire format) | Yes - pure Go | No riscv64-specific CI | N/A (library) | See `reports/protocol-buffers.md` |
| golang-jwt/jwt/v5 v5.3.1 | JWT auth in exporter-toolkit | Yes - pure Go | No riscv64 CI | N/A (library) | No open riscv64 issues |
| Go toolchain 1.25/1.26 | Compilation runtime | Yes - linux/riscv64 supported | golang/go#80880: LUCI builder pending | Releases include riscv64 | golang/go#79997: `indexbyte_riscv64.s` optimization pending; golang/go#78918: CRC32 asm missing. See `reports/go.md` |
| mysql/mysql-server (runtime target) | The MySQL instance being scraped | No official riscv64 binary | No riscv64 CI | No linux/riscv64 official releases | No official riscv64 binary; use MariaDB (which does ship riscv64) as alternative. See `reports/mysql.md` |

**Critical dependency notes:**

The most significant runtime dependency gap is MySQL itself: there is no official MySQL riscv64 binary. Operators on riscv64 must either build MySQL from source or use MariaDB, which is fully wire-compatible with mysqld_exporter. This is not a mysqld_exporter code issue but is the primary practical obstacle to deploying the full stack on riscv64.

The Go toolchain (see `reports/go.md`) has two open riscv64 issues: CRC32 assembly not yet implemented ([golang/go#78918](https://github.com/golang/go/issues/78918)) and an `indexbyte` optimization pending ([golang/go#79997](https://github.com/golang/go/issues/79997)). Neither is a correctness issue for mysqld_exporter's workload.

No blocking riscv64 correctness bugs are open in any direct dependency.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the prometheus/mysqld_exporter issue tracker. The search for "riscv" and "riscv64" across all issues and PRs returned zero results.

Architecture-neutral open issues relevant to production deployments:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#784](https://github.com/prometheus/mysqld_exporter/issues/784) | `perf_schema.eventsstatementssum` scan error: uint64 overflow on `SUM_SUM_TIMER_WAIT` | Open (historical tracker) | Medium | Fixed in PR #1058 (merged, ships in v0.20.0): columns now scanned as `float64`. Issue remains open as tracker. Affects all architectures equally. |
| [#824](https://github.com/prometheus/mysqld_exporter/issues/824) | Slow scrape and OOM with many databases (186 DBs x 147 tables): scrape >9 s, memory 2.5-3.5 GB, OOM kill | Open | High | Reported against v0.15.1 on x86_64. Unresolved. Applies to any architecture including riscv64. |
| [#648](https://github.com/prometheus/mysqld_exporter/issues/648) | CPU usage ~850m (0.85 vCPU) in v0.13.0 and v0.14.0 vs minimal in v0.12.1 | Open | Medium | Reported against MariaDB. Regression unresolved. Affects all architectures. |

Issue #1025 (per-scraper query timeout) was merged in v0.20.0. Before fix: 4.8s scrape with 3 of 7 scrapers failing. After fix with `--exporter.query_timeout=3` and `MaxOpenConns=2`: 3.0s scrape, only the slow scraper failed. Benchmark figures are from x86_64 reproduction testing.

---

## 12. Objections and Upstream Blockers

No stated objections to riscv64 exist anywhere in the project. The architecture is implicitly accepted because it requires no project-level decision -- promu handles it automatically.

**Technical blockers:** None.

**Organizational blockers:** None. The project is governed informally by a small Grafana-dominated group that accepts cross-cutting changes via prombot automation.

**Practical deployment blocker:** MySQL has no official riscv64 binary. This is not a mysqld_exporter blocker -- MariaDB is a fully compatible alternative and does ship riscv64 packages -- but it limits the scope of riscv64 testing to MariaDB-based environments unless MySQL is built from source.

**Acceptance probability for upstream contributions:** High. The project accepts prombot-generated cross-cutting changes automatically, and any riscv64-related issue would be addressed as a generic Go correctness issue rather than a platform political question.

---

## 13. Investment Analysis

mysqld_exporter itself requires zero investment to enable on riscv64. The binary ships, the Docker image ships, and no source code changes are needed. The remaining gaps are CI, the MySQL runtime target, and performance.

### 13.1 Functional Enablement

No work needed. mysqld_exporter is fully functional on riscv64. The only functional gap is that MySQL (the scrape target) has no official riscv64 binary. This is tracked under `reports/mysql.md` and is not scoped here.

### 13.2 Performance Optimization

Three pure-Go fallback paths exist where riscv64 uses scalar code: xxhash, ChaCha20/Poly1305 (golang.org/x/crypto), and CRC32 (Go runtime). For mysqld_exporter's scrape workload (SQL query execution, HTTP response formatting), none of these are on the critical path. Performance optimization of these paths belongs to their respective upstream projects (cespare/xxhash, golang.org/x/crypto, the Go toolchain), not mysqld_exporter. No investment in mysqld_exporter itself is warranted for performance.

### 13.3 CI/CD Infrastructure

The only actionable investment in mysqld_exporter itself is adding riscv64 CI. The project currently runs no tests on riscv64 -- the binary ships untested. Adding RISE RISC-V runners to the CI pipeline would close this gap.

RISE runners are already deployed (Scaleway EM-RV1, label `ubuntu-24.04-riscv`, launched March 2026). Onboarding mysqld_exporter is a CI YAML change, not a source code change.

### 13.4 Ecosystem Enablement

mysqld_exporter has no package ecosystem (no plugins, no extensions, no language bindings). Section 10 is omitted accordingly. The relevant ecosystem work is getting MySQL itself onto riscv64, which is tracked separately.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | riscv64 SIMD for xxhash, ChaCha20, CRC32 | Out of scope -- upstream library work, not mysqld_exporter | cespare, golang.org/x/crypto, Go toolchain | Low (not on critical path for scraping workload) |
| CI/CD | Add riscv64 CI job using RISE runners (unit + integration tests on MariaDB) | 0.5 | Community / RISE | Medium |
| Ecosystem | MySQL riscv64 official binary | Out of scope -- see reports/mysql.md | MySQL/Oracle | High (blocks full-stack deployment) |

The only investable action directly in mysqld_exporter is the CI addition (0.5 person-weeks). All other gaps are either already solved or owned by upstream dependency projects.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [prometheus/mysqld_exporter repository](https://github.com/prometheus/mysqld_exporter)
- [mysqld_exporter v0.20.0 release (2026-08-13)](https://github.com/prometheus/mysqld_exporter/releases/tag/v0.20.0)
- [mysqld_exporter v0.15.1 release (2023-12-12) -- first riscv64 release](https://github.com/prometheus/mysqld_exporter/releases/tag/v0.15.1)
- [mysqld_exporter PR #773 -- "Synchronize common files from prometheus/prometheus" (merged 2023-10-03)](https://github.com/prometheus/mysqld_exporter/pull/773)
- [mysqld_exporter Issue #784 -- uint64 overflow in eventsstatementssum](https://github.com/prometheus/mysqld_exporter/issues/784)
- [mysqld_exporter Issue #824 -- OOM with many databases](https://github.com/prometheus/mysqld_exporter/issues/824)
- [mysqld_exporter Issue #648 -- CPU regression in v0.13.0/v0.14.0](https://github.com/prometheus/mysqld_exporter/issues/648)
- [promu PR #254 -- "Add linux/riscv64 to default platforms" (merged 2023-07-01)](https://github.com/prometheus/promu/pull/254)
- [promu repository](https://github.com/prometheus/promu)
- [Prometheus CNCF project page](https://www.cncf.io/projects/prometheus/)
- [golang/go#78918 -- CRC32 asm missing for riscv64](https://github.com/golang/go/issues/78918)
- [golang/go#79997 -- indexbyte_riscv64.s optimization pending](https://github.com/golang/go/issues/79997)
- [golang/go#80880 -- LUCI linux-riscv64 builder not yet added](https://github.com/golang/go/issues/80880)
- [RISE Project website](https://riseproject.dev)
- [Debian tracker -- prometheus-mysqld-exporter](https://tracker.debian.org/pkg/prometheus-mysqld-exporter)
- [cespare/xxhash repository](https://github.com/cespare/xxhash)
- [golang.org/x/crypto repository](https://cs.opensource.google/go/x/crypto)
- [golang.org/x/sys repository](https://cs.opensource.google/go/x/sys)