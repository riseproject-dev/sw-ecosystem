---
title: Zalando PG-op
parent: Project Reports
color: orange
---

# Zalando PG-op

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Zalando PG-op<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Zalando `postgres-operator` is a Kubernetes operator written in Go that manages PostgreSQL clusters on Kubernetes. It provisions and manages StatefulSets, Services, Secrets, and CRDs; it does not contain or ship PostgreSQL binaries itself. The actual database image is `zalando/spilo`, a separate repository. The operator also ships a PgBouncer-based connection pooler, a logical-backup sidecar, and a React/Python UI.

**Governance:** The project is governed entirely by Team ACID at Zalando (`team-acid@zalando.de`). There is no foundation affiliation, no CNCF membership, no TSC, and no steering committee. All seven listed maintainers are Zalando employees. The top five all-time contributors by commit count are all current or former Zalando engineers. Decisions are driven by Zalando's internal infrastructure needs.

**License:** MIT.

**Corporate sponsors:** Zalando SE is the sole corporate sponsor. Zalando is not a RISE Project member.

**Community culture on new ports:** Receptivity to new architecture ports is very low. The arm64 port was requested in September 2022 (issue [#2030](https://github.com/zalando/postgres-operator/issues/2030)) and did not reach full CI coverage until April 2026 -- a gap of approximately three and a half years. A ppc64le PR ([#2418](https://github.com/zalando/postgres-operator/pull/2418)) has been open and stalled since September 2023 with no maintainer response. New ports are accepted only when Zalando has an internal production need, or when community pressure is sustained over multiple years with a working PR already submitted.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-09-01 | Issue #2030 filed: "add arm64 support" | [GitHub issue #2030](https://github.com/zalando/postgres-operator/issues/2030) |
| 2023-04-17 | First multi-arch commit `a9c6d46f` by Polina Bungina (Zalando): adds `linux/amd64,linux/arm64` to GHCR publish pipeline | [zalando/postgres-operator](https://github.com/zalando/postgres-operator) |
| 2023-09-14 | PR #2418 opened: ppc64le multiarch support (community contributor, stalled) | [GitHub PR #2418](https://github.com/zalando/postgres-operator/pull/2418) |
| 2024-02-23 | PR #2555 opened: arm-compatible pooler image (closed) | [GitHub PR #2555](https://github.com/zalando/postgres-operator/pull/2555) |
| 2024-12-23 | v1.15.0 released: arm64 officially supported | [GitHub releases](https://github.com/zalando/postgres-operator/releases) |
| 2026-01-27 | Issue #3036: postgres-pooler exec format error on arm64 (closed) | [GitHub issue #3036](https://github.com/zalando/postgres-operator/issues/3036) |
| 2026-04-17 | PR #3077 opened: build multi-arch pooler image | [GitHub PR #3077](https://github.com/zalando/postgres-operator/pull/3077) |
| 2026-04-28 | PR #3077 merged by Felix Kunde: last component achieves full arm64 coverage | [GitHub PR #3077](https://github.com/zalando/postgres-operator/pull/3077) |
| 2026-08-28 | riscv64: zero issues, zero PRs, zero commits, zero code references | [GitHub code search](https://github.com/zalando/postgres-operator) |

**RISC-V port history:** None. There is no first commit, no tracking issue, no contributor, and no roadmap entry for riscv64. The project has never acknowledged riscv64 as a target.

## 3. Upstream Support Tier

There is no formal platform tier policy. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists. Platform support is implicitly determined by what Zalando builds and tests internally.

The Dockerfile uses `ARG TARGETOS / TARGETARCH` with Go cross-compilation, making additional platforms technically feasible, but the CI platform list is hardcoded as `platforms: linux/amd64,linux/arm64` in `publish_ghcr_image.yaml` with no matrix variable and no conditional.

| Architecture | CI build | CI tests | Published image | Official status |
|---|---|---|---|---|
| amd64 | Yes | Yes (unit + e2e) | Yes (all 4 images) | Supported |
| arm64 | Yes (QEMU) | No (build only) | Yes (all 4 images) | Supported since v1.15.0 / v2.0.x |
| ppc64le | No | No | No | Stalled community PR (#2418) |
| riscv64 | No | No | No | Not acknowledged |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The operator is a pure-Go Kubernetes control-plane process. It contains no C, no C++, no assembly, no JIT backends, no SIMD dispatch, and no ISA-specific code paths. `CGO_ENABLED=0` is set in the Dockerfile, `build_operator.sh`, and Makefile. There are 130 `.go` source files and zero `.s` assembly files.

| Subsystem | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Operator binary (Go) | Yes | Yes | Not built | Pure Go; GOARCH=riscv64 supported by Go toolchain |
| JIT compilation | N/A | N/A | N/A | JIT lives in PostgreSQL (LLVM), not in this repo |
| SIMD / vector | N/A | N/A | N/A | No SIMD in operator code |
| Crypto (TLS) | Via Go stdlib | Via Go stdlib | Via Go stdlib | Go stdlib supports riscv64; no RVV acceleration |
| Assembly | None | None | None | No `.s` files anywhere |
| CGO | Disabled | Disabled | Disabled | `CGO_ENABLED=0` everywhere |

RISC-V portability for the operator binary is entirely a function of Go's cross-compilation support for `GOARCH=riscv64`, which is handled by the Go toolchain and not by this repository. The PostgreSQL container images deployed by the operator (from `zalando/spilo`) are a separate concern.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go modules (`go.mod`), GNU Make, Docker Buildx with QEMU. No CMake, no autoconf in the operator itself, no toolchain files, no `BUILDING.md`, no `INSTALL` file.

**Minimum Go version:** 1.26 (specified by `go.mod` toolchain directive; required by `k8s.io/client-go v0.36.1`).

**Operator binary cross-compile (no QEMU needed):**
```bash
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 \
  go build -o postgres-operator -v \
  -ldflags "-X=main.version=v2.0.2" \
  cmd/main.go
```

**Via Makefile:**
```bash
make linux GOARCH=riscv64
```

**Docker image (1-line CI change to add riscv64):**
```bash
docker buildx build \
  -f docker/Dockerfile \
  --build-arg BASE_IMAGE="alpine:3" \
  --platform linux/amd64,linux/arm64,linux/riscv64 \
  --push .
```

**QEMU usage:**

| Stage | QEMU required | Reason |
|---|---|---|
| Operator builder | No | `--platform=$BUILDPLATFORM` + `GOARCH=${TARGETARCH}` Go cross-compile |
| Operator runtime | Yes (non-native) | Alpine `apk` on target arch |
| Pooler build (C/PgBouncer) | Yes | No `--platform=$BUILDPLATFORM`; C compilation runs on target arch |
| Logical-backup | Yes | Ubuntu apt + pip on target arch |

CI already uses `docker/setup-qemu-action@v4` (tonistiigi/binfmt), which includes riscv64 support.

**Known build failures for riscv64:** None reported, because no build has ever been attempted. The operator binary itself has no known blockers. Two of the four shipped images have hard upstream dependency blockers (see Section 6).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Operator binary | Yes | Yes | Not built | Missing (trivial to fix) |
| Pooler (PgBouncer) image | Yes | Yes | Not built | Missing (trivial to fix) |
| UI image | Yes | Yes | Blocked | Hard blocker: `node:lts-alpine` has no riscv64 variant |
| Logical-backup image | Yes | Yes | Blocked | Hard blockers: Azure CLI and PGDG apt repo have no riscv64 packages |
| PostgreSQL JIT (via Spilo) | Yes | Partial | Disabled | LLVM JIT segfaults on riscv64; all distro packages ship with JIT off |
| PostgreSQL spinlock asm | Yes | Yes | Semaphore fallback | No spinlock assembly for riscv64 in PostgreSQL |
| PostgreSQL CRC32C | Yes (hw) | Yes (hw) | Software | Zbc patch series v4 open but unmerged |
| OpenSSL AES | Constant-time | Constant-time | Non-constant-time | T-table fallback without Zkn; most current riscv64 hardware lacks Zkn |
| etcd (Patroni DCS) | Yes | Yes | Blocked | `checkSupportArch()` hard-exits without `ETCD_UNSUPPORTED_ARCH=riscv64` |
| WAL-G (backup) | Yes | Yes | Blocked | No riscv64 release binary; Spilo `dependencies.sh` hardcodes amd64/aarch64 paths |

**Functional gaps (cannot operate at all without workaround):**
- Logical-backup container cannot be built for riscv64 due to missing Azure CLI and PGDG apt packages.
- etcd will not start on riscv64 without the `ETCD_UNSUPPORTED_ARCH=riscv64` environment variable; no official riscv64 binary is published.
- WAL-G has no riscv64 release binary; Spilo's build script hardcodes download paths for amd64 and aarch64 only.
- Kubernetes itself has no official riscv64 binary; community workaround is k3s or a RISE community build.

**Performance gaps (degraded but operational):**
- PostgreSQL LLVM JIT is disabled on riscv64, impacting complex analytical queries.
- PostgreSQL uses semaphore fallback instead of spinlock assembly, impacting high-concurrency workloads.
- OpenSSL AES is non-constant-time on riscv64 hardware without Zkn extensions.

**NaN / floating-point semantics issues:** Data not available: no riscv64 correctness bugs have been filed against this project or its PostgreSQL dependency specifically for floating-point semantics on riscv64.

## 7. CI/CD Infrastructure

All three workflow files in `.github/workflows/` were read directly from the repository.

| Workflow | Trigger | Runner | Platforms | riscv64 CI |
|---|---|---|---|---|
| `publish_ghcr_image.yaml` | push on tags | ubuntu-latest (x86) | `linux/amd64`, `linux/arm64` via QEMU/Buildx | No |
| `run_tests.yaml` | PR / push to master | ubuntu-latest (x86) | x86 only | No |
| `run_e2e.yaml` | PR / push to master | ubuntu-latest (x86) | x86 only | No |

The `platforms:` field in `publish_ghcr_image.yaml` is hardcoded as `linux/amd64,linux/arm64` in all four build steps (operator, pooler, UI, logical-backup). There is no matrix variable, no conditional, and no commented-out riscv64 entry. The word "riscv64" does not appear in any file in the repository.

**RISE runners:** None. Code search across `riseproject-dev/riscv-runner-app` and `riseproject-dev/kubernetes-riscv` returned zero results for Zalando.

**Other CI systems:** `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.circleci/config.yml`, `azure-pipelines.yml`, and `.buildkite/pipeline.yml` are all absent (404).

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build | Yes | Yes (QEMU) | No |
| Unit tests | Yes | No | No |
| End-to-end tests | Yes | No | No |
| Published image on tag | Yes | Yes | No |
| RISE runner | No | No | No |

## 8. Distribution and Release Status

The project distributes exclusively as container images via GHCR (`ghcr.io/zalando/postgres-operator`). There are no binary release assets of any kind: `gh release view v2.0.2 --json assets` returns `{"assets":[]}` for the three most recent releases (v2.0.0, v2.0.1, v2.0.2).

**GHCR manifest for v2.0.2 (all four images):**

| Image | Platforms |
|---|---|
| `ghcr.io/zalando/postgres-operator:v2.0.2` | `linux/amd64`, `linux/arm64` |
| `ghcr.io/zalando/postgres-operator/pgbouncer:v2.0.2` | `linux/amd64`, `linux/arm64` |
| `ghcr.io/zalando/postgres-operator/logical-backup:v2.0.2` | `linux/amd64`, `linux/arm64` |
| `ghcr.io/zalando/postgres-operator/ui:v2.0.2` | `linux/amd64`, `linux/arm64` |

The two `unknown/unknown` entries in each manifest are OCI provenance attestation blobs (SLSA/sigstore), not riscv64 images.

**Ubuntu 26.04 (Resolute):** `packages.ubuntu.com` returns "no results" for `postgres-operator` and all name variants, for all architectures. The project is not packaged in Ubuntu.

**Debian:** `packages.debian.org` returns "no results" for `postgres-operator`.

**Arch Linux RISC-V:** Not listed at `archriscv.felixc.at`.

**PyPI:** Package does not exist (`404` for `zalando-pg-op`, `postgres-operator`, and `zalando-postgres-operator`).

**To obtain a working riscv64 binary today:** A user would need to build from source using `CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build cmd/main.go` with Go 1.26+. This produces only the operator binary; the logical-backup and UI images cannot be built for riscv64 due to upstream dependency blockers.

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking |
|---|---|---|---|---|---|
| Go 1.26 | Operator build toolchain | Yes | Partial (secondary port) | Yes (`linux/riscv64`) | No (minor issues) |
| Kubernetes (k8s.io/client-go) | Operator runtime platform | Cross-compile only | No upstream CI | No official binary | Yes (workaround: k3s) |
| OpenSSL 3.5 | TLS (pooler, backup) | Yes | Cross-compile only | Yes (distro packages) | No (performance gap) |
| libevent 2.1 | PgBouncer async I/O | Yes | Yes | Yes | No |
| c-ares | PgBouncer DNS | Yes | Yes | Yes | No |
| PostgreSQL 18 | Managed database | Yes | Partial (JIT disabled) | Yes (distro packages) | No (functional gaps) |
| PgBouncer | Connection pooler | Yes | Yes (Debian buildd) | Yes (distro packages) | No |
| Patroni | HA cluster manager | Yes (pure Python) | Yes | Yes (`py3-none-any`) | No (etcd workaround needed) |
| etcd | Patroni DCS backend | Yes (pure Go) | No upstream CI | No riscv64 binary | **Yes (hard blocker)** |
| WAL-G | WAL archiving / backup | Yes (Go+CGO) | No riscv64 CI | No riscv64 binary | **Yes (hard blocker)** |
| Prometheus | Metrics | Yes | Yes | Yes (since v2.46.0) | No |
| Helm | Operator deployment | Yes | No riscv64 CI | Yes (since v3.14.0) | No |

### Critical Dependency Deep-Dives

**etcd** (Patroni DCS backend): etcd's `checkSupportArch()` function hard-exits on startup for any architecture not in its allowlist. riscv64 is not in the allowlist. PR [#21510](https://github.com/golang/go/issues/79275) was closed; the maintainer's stated position is "No plans" for riscv64 support. The workaround is to set `ETCD_UNSUPPORTED_ARCH=riscv64` and build from source. No official riscv64 binary is published. This is a hard blocker for any Patroni-based HA deployment.

**WAL-G** (WAL archiving and backup): WAL-G's release pipeline builds only `linux/amd64` and `linux/aarch64`. The Spilo `dependencies.sh` build script hardcodes download paths for those two architectures. There is no riscv64 release binary. Building from source is possible (all CGO dependencies are available on Ubuntu riscv64), but this requires a custom build pipeline. This is a hard blocker for the logical-backup container.

**Go 1.26**: Available in Ubuntu 26.04 as `golang-go 2:1.26~1`. Two known riscv64 issues: J-type relocation overflow ([golang/go#79275](https://github.com/golang/go/issues/79275)) and a `cover_atomic` test failure ([golang/go#81175](https://github.com/golang/go/issues/81175)). Neither is expected to block operator compilation given `CGO_ENABLED=0`.

**Kubernetes**: No official riscv64 binary. Four upstream PRs for riscv64 support were rejected. A Tier 3 path is now open. Community workaround: k3s or `riseproject-dev/kubernetes-riscv` (v1.36.0-riscv64). See [project-reports/kubernetes.md](project-reports/kubernetes.md).

**PostgreSQL 18**: Available in Ubuntu 26.04 as `postgresql-18 18.3-1`. LLVM JIT is disabled (segfaults under LLVM backend). No spinlock assembly for riscv64. CRC32C Zbc patch series v4 is open but unmerged. See [project-reports/postgresql.md](project-reports/postgresql.md).

**OpenSSL 3.5**: Available in Ubuntu 26.04 as `openssl 3.5.5-1ubuntu3`. AES is non-constant-time without Zkn extensions ([openssl/openssl#20980](https://github.com/openssl/openssl/issues/20980)). A null-key bug in `rv64i_zkne` exists ([openssl/openssl#30330](https://github.com/openssl/openssl/issues/30330)). See [project-reports/openssl.md](project-reports/openssl.md).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| -- | riscv64 tracking issue | Does not exist | -- | No issue has ever been filed for riscv64 support |
| [#2418](https://github.com/zalando/postgres-operator/pull/2418) | ppc64le multiarch support | Open / stalled | Medium | Community PR, no maintainer response since Sep 2023; not riscv64 but illustrates maintainer posture |
| [etcd #21510](https://github.com/etcd-io/etcd/pull/21510) | riscv64 arch support | Closed / rejected | Critical | `checkSupportArch()` blocks startup; maintainer: "No plans" |
| [openssl #20980](https://github.com/openssl/openssl/issues/20980) | AES non-constant-time without Zkn | Open | Medium | Security: timing side-channel on riscv64 hardware without Zkn |
| [openssl #30330](https://github.com/openssl/openssl/issues/30330) | rv64i_zkne null-key bug | Open | Medium | Correctness bug in Zkn AES path |
| [golang/go #79275](https://github.com/golang/go/issues/79275) | J-type relocation overflow | Open | Low (for this project) | CGO_ENABLED=0 mitigates for operator binary |
| [golang/go #81175](https://github.com/golang/go/issues/81175) | cover_atomic test failure | Open | Low | Test infrastructure only |

No correctness bugs specific to Zalando postgres-operator on riscv64 have been filed, because no riscv64 testing has ever been performed.

## 12. Objections and Upstream Blockers

**Organizational blockers:**
- Zalando has no known riscv64 infrastructure and is not a RISE member. There is no internal business driver for a riscv64 port.
- The ppc64le PR (#2418) has been open for over three years with no maintainer response, establishing a clear precedent for how non-Zalando-priority architectures are handled.
- All maintainers are Zalando employees; there is no external co-maintainer who could champion a riscv64 port.

**Technical blockers (hard -- cannot ship a complete release without resolving):**

1. **etcd**: No official riscv64 binary; `checkSupportArch()` exits without `ETCD_UNSUPPORTED_ARCH=riscv64`; PR #21510 closed; maintainer: "No plans." Workaround: build from source with env var set.
2. **WAL-G**: No riscv64 release binary; Spilo `dependencies.sh` hardcodes amd64/aarch64 download paths. Workaround: build from source.
3. **Kubernetes**: No official riscv64 cluster to run the operator on. Workaround: k3s or RISE community build.
4. **Logical-backup image**: Azure CLI has no riscv64 apt package; PGDG apt repo has no riscv64 postgresql-client packages for Ubuntu 22.04. No workaround short of replacing these dependencies.
5. **UI image**: `node:lts-alpine` has no riscv64 variant (only amd64/arm64/s390x). Workaround: use a different Node.js base image.

**Technical blockers (soft -- degraded but operational):**
- PostgreSQL LLVM JIT disabled on riscv64.
- OpenSSL AES non-constant-time without Zkn.
- No PostgreSQL spinlock assembly for riscv64.

**Acceptance probability for an upstream riscv64 PR:** Low. Based on the ppc64le precedent (3+ years, no response), a riscv64 PR would require either Zalando adopting riscv64 infrastructure internally or sustained multi-year community pressure with a fully working PR. RISE involvement or membership could accelerate this, but Zalando is not currently a RISE member.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI; no distro package; no published riscv64 artifact of any kind)
- **Release provider:** none

**Justification:** The upstream CI (`publish_ghcr_image.yaml`) explicitly lists `platforms: linux/amd64,linux/arm64` for all four image builds and contains zero riscv64 references. No riscv64 artifact is published through any channel: no GHCR image, no GitHub release binary, no Ubuntu/Debian package, no PyPI package. The project has never acknowledged riscv64 as a target -- there are zero issues, PRs, commits, or code references mentioning riscv, riscv64, or risc-v in the entire repository history. The RISE sw-ecosystem tracker independently assigns this project orange status with the same gap description.

**Pending work that could change the grade:** None. There is no open riscv64 PR, no tracking issue, no RISE-funded work, and no stated maintainer intent. A grade change to yellow would require at minimum a merged CI change adding `linux/riscv64` to the `platforms:` field in `publish_ghcr_image.yaml`. A grade change to blue would additionally require resolving the etcd, WAL-G, and Kubernetes hard blockers to produce a functionally complete riscv64 release.

## 14. Investment Analysis

RISE has no existing involvement with this project (no funded work, no blog posts, no CI runners, no dedicated project report). The analysis below covers the full scope of work required.

### 14.1 Functional Enablement

The operator binary and pooler image are trivially buildable for riscv64 with a one-line CI change. The logical-backup and UI images require resolving upstream dependency blockers (Azure CLI, PGDG apt, Node.js Alpine) before a complete riscv64 release can be published. The etcd and WAL-G blockers require either upstream fixes or maintained forks/build pipelines.

### 14.2 Performance Optimization

This is not an optimization-purpose project. The operator is a Kubernetes control-plane process; its performance is not sensitive to SIMD or ISA-specific optimizations. Performance gaps (PostgreSQL JIT, OpenSSL AES, spinlock assembly) are in downstream dependencies (PostgreSQL, OpenSSL), not in this repository.

### 14.3 CI/CD Infrastructure

Adding riscv64 to the existing QEMU-based Buildx pipeline requires a one-line change to `publish_ghcr_image.yaml`. The QEMU action already supports riscv64. End-to-end testing on riscv64 would require a riscv64 Kubernetes cluster (k3s or RISE community build).

### 14.4 Ecosystem Enablement

Not applicable. This project has no dependent package ecosystem (no Python packages, no npm packages, no Maven JARs, no Kubernetes operators that depend on this operator).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `linux/riscv64` to `publish_ghcr_image.yaml` (operator + pooler images) | 0.5 | Community / RISE | High |
| Functional | Replace `node:lts-alpine` with a riscv64-compatible Node.js base image for UI | 1 | Community | Medium |
| Functional | Fix logical-backup image: replace Azure CLI and PGDG apt with riscv64-compatible alternatives | 3 | Community | Medium |
| Functional | Resolve etcd riscv64 blocker (upstream PR or maintained build with `ETCD_UNSUPPORTED_ARCH`) | 2 | RISE / etcd upstream | Critical |
| Functional | Resolve WAL-G riscv64 blocker (upstream release pipeline or Spilo build script patch) | 2 | Community / RISE | Critical |
| Functional | Provide riscv64 Kubernetes cluster for e2e testing (k3s or RISE community build) | 2 | RISE | Critical |
| CI/CD | File tracking issue and upstream PR for riscv64 support | 0.5 | Community | High |
| CI/CD | Add riscv64 to e2e test matrix once cluster is available | 1 | Community | Medium |

## 15. Updates

No updates yet -- initial report dated 2026-08-30.

## 16. References

- [zalando/postgres-operator repository](https://github.com/zalando/postgres-operator)
- [postgres-operator documentation](https://postgres-operator.readthedocs.io/)
- [GitHub issue #2030: add arm64 support](https://github.com/zalando/postgres-operator/issues/2030)
- [GitHub PR #2418: ppc64le multiarch support (open/stalled)](https://github.com/zalando/postgres-operator/pull/2418)
- [GitHub PR #2555: arm-compatible pooler image (closed)](https://github.com/zalando/postgres-operator/pull/2555)
- [GitHub issue #3036: postgres-pooler exec format error on arm64 (closed)](https://github.com/zalando/postgres-operator/issues/3036)
- [GitHub PR #3077: build multi-arch pooler image (merged 2026-04-28)](https://github.com/zalando/postgres-operator/pull/3077)
- [zalando/postgres-operator GitHub releases](https://github.com/zalando/postgres-operator/releases)
- [GHCR image: ghcr.io/zalando/postgres-operator](https://github.com/zalando/postgres-operator/pkgs/container/postgres-operator)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE RISC-V Runners: six weeks in (May 2026)](https://riseproject.dev/blog/rise-risc-v-runners-six-weeks-in/)
- [RISE End of Year 2024 Webinar PDF](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [riseproject-dev/sw-ecosystem: databases stack report](https://github.com/riseproject-dev/sw-ecosystem)
- [etcd PR #21510: riscv64 arch support (closed)](https://github.com/etcd-io/etcd/pull/21510)
- [openssl issue #20980: AES non-constant-time without Zkn](https://github.com/openssl/openssl/issues/20980)
- [openssl issue #30330: rv64i_zkne null-key bug](https://github.com/openssl/openssl/issues/30330)
- [golang/go issue #79275: J-type relocation overflow on riscv64](https://github.com/golang/go/issues/79275)
- [golang/go issue #81175: cover_atomic test failure on riscv64](https://github.com/golang/go/issues/81175)
- [Ubuntu 26.04 (Resolute) package search](https://packages.ubuntu.com/search?suite=resolute&searchon=names&section=all)
- [Debian package search](https://packages.debian.org/search)
- [Arch Linux RISC-V package overlay](https://archriscv.felixc.at/)
- [project-reports/kubernetes.md](project-reports/kubernetes.md)
- [project-reports/postgresql.md](project-reports/postgresql.md)
- [project-reports/openssl.md](project-reports/openssl.md)
- [project-reports/patroni.md](project-reports/patroni.md)
- [project-reports/go.md](project-reports/go.md)
- [project-reports