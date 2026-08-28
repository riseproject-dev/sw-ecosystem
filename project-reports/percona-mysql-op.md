---
title: Percona MySQL-op
---

# Percona MySQL-op

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Percona MySQL-op (Percona Operator for MySQL/XtraDB Cluster)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Percona Operator for MySQL (XtraDB Cluster variant) is a Kubernetes controller written entirely in Go that automates the lifecycle of Percona XtraDB Cluster (PXC) -- a Galera-based MySQL high-availability cluster. The operator manages pod scheduling, configuration, backup via MinIO/S3 (using XtraBackup), TLS certificate provisioning, and upgrade orchestration. It does not contain any database engine code; the engine runs in separately built container images (percona/percona-xtradb-cluster, ProxySQL, HAProxy, XtraBackup).

Repository: [percona/percona-xtradb-cluster-operator](https://github.com/percona/percona-xtradb-cluster-operator). Language breakdown: Go (1,226,124 bytes), Shell (543,906 bytes), Makefile, Dockerfile, Go Template. No C, C++, or assembly.

**Governance.** The project is governed entirely by Percona, LLC, a commercial open-source database company. Copyright notice: "Percona LLC and/or its affiliates, 2018-2025." License: Apache 2.0. There is no CNCF, Linux Foundation, or other neutral-foundation membership. Issue tracking uses Jira at jira.percona.com (project key K8SPXC), not GitHub Issues. Contributions require signing a Percona CLA.

**Corporate sponsors.** All top contributors use @percona.com email addresses: delgod (399 commits), hors (350), cap1984 (231), tplavcic (198), nonemax (189), dAdAbird (173), mayankshah1607 (157), egegunes (143), pooknull (136), nmarukovich (89). One external contributor (geo.kechagias@gmail.com) was identified among recent committers.

**Community culture on new ports.** No explicit policy on new architecture ports exists in any public documentation. The track record shows: arm64 support was requested and then delivered roughly 2.5 years after the project's initial release. ARM64 full support (K8SPXC-1728) was a v1.20.0 release highlight in June 2026, with a preceding bug fix (K8SPXC-1821) addressing a logrotate crash on ARM64 due to a cron package binary dependency. No community member has filed a RISC-V request.

**RISE project.** Percona is not a RISE member (confirmed absent from both Premier and General member tiers at [riseproject.dev/members](https://riseproject.dev/members/)). No RISE blog post, funded work, or riseproject-dev repository is associated with this project. The [RISE databases vertical report](https://github.com/riseproject-dev/sw-ecosystem/blob/main/examples/vertical-report/out/databases.md) rates the Percona MySQL Operator as RED and characterizes the Kubernetes operator layer as a "structural gap" -- every PostgreSQL and MySQL Kubernetes operator is red.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2018 | Initial project creation by Percona | Repository history |
| 2023-12-14 | [PR #1550](https://github.com/percona/percona-xtradb-cluster-operator/pull/1550) merged: K8SPXC-1309 -- add multi-architecture build support (arm64 + amd64) | GitHub PR |
| 2023-12-22 | [PR #1567](https://github.com/percona/percona-xtradb-cluster-operator/pull/1567) merged: K8SPXC-1309 -- fix multi-architecture builds | GitHub PR |
| 2026-06 | v1.20.0 released, noting "All Operator images are now available for ARM64" as a formal release highlight (K8SPXC-1728) | GitHub Releases |
| Never | RISC-V (riscv64) support: no issue filed, no PR, no commit, no code reference | GitHub search (0 results) |

The two multi-arch PRs define the full scope of architecture expansion in this project. Neither PR included riscv64, and no follow-up has been filed. RISC-V has not been upstream at any point.

## 3. Upstream Support Tier

Percona has no formal architecture tier policy documented publicly. In practice, the observable tier behavior is:

- **amd64:** Primary. All CI, all releases, all documentation assume x86_64.
- **arm64:** Secondary. Added December 2023 (operator binary), formalized in v1.20.0 (June 2026) with confirmed working container images for all components including ProxySQL, HAProxy, and XtraBackup.
- **riscv64:** Absent. No CI, no release images, no tracking issue.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build (scan.yml) | Yes | Yes | No |
| Container image published | Yes | Yes | No |
| Release notes mention | Implicit | v1.20.0 | Never |
| Jira tracking issue | N/A | K8SPXC-1728 (closed) | None |
| Managed component images (PXC, ProxySQL, HAProxy) | Yes | Yes | No |

Kubernetes platform support as of v1.20.0: GKE 1.33-1.35, EKS 1.33-1.35, AKS 1.33-1.36, OpenShift 4.18-4.21, Minikube 1.38.1. No RISC-V Kubernetes distribution is listed.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The operator binary itself contains zero architecture-specific code. It is a pure-Go Kubernetes controller (CGO_ENABLED=0) that communicates with the Kubernetes API server and manages PXC cluster lifecycle via API calls. There is no JIT, no SIMD dispatch, no assembly, no GC barrier customization, and no crypto acceleration in the operator repo.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Operator binary (Go, CGO_ENABLED=0) | Full | Full | Compilable via GOARCH=riscv64 [NEEDS VERIFICATION -- not tested] |
| Assembly / SIMD | None | None | None |
| JIT | None | None | None |
| Arch-specific build tags | None | None | None |
| PXC/MySQL engine container image | Full | Full (v1.20.0+) | Missing |
| ProxySQL container image | Full | Full (v1.20.0+) | Missing |
| HAProxy container image | Full | Full (v1.20.0+) | Missing |
| XtraBackup container image | Full | Full (v1.20.0+) | Missing |

The architecture-sensitivity lives entirely in the managed components (PXC, ProxySQL, HAProxy, XtraBackup), not in the operator itself. The PXC source repo (percona/percona-xtradb-cluster) does list architecture-specific considerations: its CMakeLists.txt KNOWN_64BIT_ARCHITECTURES set includes arm64, aarch64, ppc64, ppc64le, s390x, x86_64 -- riscv64 is absent. The bundled gperftools-2.15 explicitly excludes riscv from its fast path via `#if !(__i386__ || __x86_64__ || __riscv || __aarch64__)`.

## 5. Build System, Cross-Compilation, and Toolchain

**Operator build (Go + Docker buildx):**

The build script (`e2e-tests/build`) passes `DOCKER_DEFAULT_PLATFORM` to `docker buildx build`. Default value is `linux/amd64`. The Dockerfile (`build/Dockerfile`) uses:

```
FROM --platform=${BUILDPLATFORM} golang:1.26 AS go_builder
ARG GOOS=linux
ARG TARGETARCH
ARG CGO_ENABLED=0

RUN GOOS=$GOOS GOARCH=${TARGETARCH} CGO_ENABLED=$CGO_ENABLED \
    go build -o build/_output/bin/percona-xtradb-cluster-operator cmd/manager/main.go
```

Go version required: 1.26 (from go.mod). Base runtime image: `registry.access.redhat.com/ubi9/ubi-minimal`. Because `CGO_ENABLED=0` and the Dockerfile already uses the `TARGETARCH` buildx ARG, adding `linux/riscv64` to `DOCKER_DEFAULT_PLATFORM` is the only Dockerfile change required for the operator binary. No C toolchain is needed. No QEMU is required for the Go cross-compilation step (Go cross-compiles natively).

Multi-arch pushes require `DOCKER_PUSH=1` -- `--load` does not support multi-arch manifests.

**PXC engine build (C++/CMake):**

The underlying database uses cmake with a standard release configuration. No riscv64-specific cmake flags, no toolchain file (`cmake/riscv64.cmake` does not exist), and no QEMU usage in any build script. The compiler minimum is GCC >= 7.1 / Clang >= 5 (universal Linux minimum; no riscv64-specific override stated). The bundled third-party libraries (gperftools, ICU, abseil, libtirpc) individually recognize riscv64 in their config.sub/config.guess scripts, but the top-level CMakeLists.txt does not declare riscv64 as a known 64-bit architecture.

**Known build failures on riscv64:** Data not available: no riscv64 build attempt has been recorded in any public CI or issue tracker. The operator binary cross-compilation is expected to succeed given pure-Go + CGO_ENABLED=0, but this is untested [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Operator binary execution | Full | Full | Not built |
| PXC cluster management | Full | Full | No base images |
| Backup/restore via XtraBackup | Full | Full | No XtraBackup image |
| ProxySQL load balancing | Full | Full | No ProxySQL image |
| HAProxy load balancing | Full | Full | No HAProxy image |
| TLS via cert-manager integration | Full | Full | Soft blocker (no cert-manager riscv64 image) |
| MinIO/S3 backup storage (operator client) | Full | Full | Functional with degraded checksum throughput |
| Kubernetes platform | All major | All major | No official K8s distribution |

**Functional gaps:** The entire stack is non-functional on riscv64 due to missing container images for the managed components. No single component can be substituted; all four (PXC, ProxySQL, HAProxy, XtraBackup) require riscv64 images.

**Performance gaps:** For the operator binary itself -- none, because there is no native code. For backup throughput to S3, the MinIO client's checksum libraries (md5-simd, crc64nvme, zeebo/xxh3) fall back to pure-Go scalar paths on riscv64. The functional impact is reduced throughput for large backup operations, not a correctness issue.

**Security hardening gaps:** Data not available: no riscv64 security hardening audit has been conducted. The UBI9 base image used by the operator runtime does not publish riscv64 images.

**NaN / floating-point semantics issues:** Not applicable. The operator binary performs no floating-point computation.

## 7. CI/CD Infrastructure

No riscv64 CI exists for any workflow in this repository. Confirmed by reading all workflow files directly.

| Workflow file | Purpose | amd64 | arm64 | riscv64 |
|---------------|---------|-------|-------|---------|
| `.github/workflows/scan.yml` | Docker image build + Trivy security scan | Yes | Yes | No |
| `.github/workflows/test.yml` | Unit/integration tests | Yes (ubuntu-latest) | No | No |
| `.github/workflows/reviewdog.yml` | Linting | Yes (ubuntu-latest) | No | No |
| `.github/workflows/labeler.yml` | PR labeling | N/A | N/A | N/A |
| `Jenkinsfile` | Release builds (internal) | Yes | Yes | No |

All GitHub Actions jobs run on `ubuntu-latest` (x86_64) runners. QEMU is used in scan.yml for cross-building arm64 images. No RISE runners are configured. No riscv64 hardware is referenced.

The scan.yml workflow is the only one that builds container images. It explicitly lists exactly two platforms: `linux/arm64` and `linux/amd64`. There is no conditional riscv64 path, no riscv64 QEMU target, and no architecture matrix that could be extended with a single variable change.

## 8. Distribution and Release Status

The operator is distributed exclusively as container images pushed to Docker Hub and quay.io. GitHub Releases contain only tags and changelogs -- zero binary release assets are attached to any release (verified across v1.17.0 through v1.20.0).

| Distribution channel | amd64 | arm64 | riscv64 |
|---------------------|-------|-------|---------|
| Container image (Docker Hub / quay.io) | Yes | Yes (v1.20.0+) | No |
| GitHub Releases binary assets | None | None | None |
| PyPI | N/A (no package) | N/A | N/A |
| Debian/Ubuntu package | No | No | No |
| Arch Linux RISC-V | No | No | No |

To obtain a working riscv64 operator binary, a user would need to: (1) run `GOARCH=riscv64 CGO_ENABLED=0 go build` from source, (2) build a custom operator container image with a riscv64-compatible base image (UBI9 minimal does not support riscv64; a Debian or Alpine riscv64 base would be needed), (3) build all four managed component images (PXC, ProxySQL, HAProxy, XtraBackup) from source with riscv64 targets, and (4) deploy on a community Kubernetes distribution that supports riscv64 (e.g., k0s or k3s). None of this is documented or tested upstream.

## 9. Dependencies

The operator binary's Go dependencies are pure-Go or have graceful fallbacks on riscv64. The blocking dependencies are the container images for managed components.

| Dependency | Role | riscv64 Build | riscv64 Test/CI | riscv64 Release | Notes |
|------------|------|---------------|-----------------|-----------------|-------|
| percona-xtradb-cluster (PXC) container image | Database engine the operator manages | Debian community builds only; no Oracle binary | None | No official image (Docker Hub: amd64, arm64 only) | Hard blocker. MySQL upstream has no RISC-V support. One ISCAS CRC32C PR was auto-closed 2026-01-18 for OCA non-compliance. |
| Kubernetes (k8s.io/api, k8s.io/client-go) | Platform runtime | Pure Go; compilable | No riscv64 CI | No official riscv64 images | Hard blocker. Issue #132836 open (proposal for Tier 3 riscv64). No KEP yet as of 2026-08. See [project-reports/kubernetes.md](../project-reports/kubernetes.md). |
| cert-manager/cert-manager | TLS certificate lifecycle | Builds (pure Go) | No riscv64 CI | No official riscv64 image (releases: amd64, arm64, s390x, ppc64le, arm only) | Soft blocker. Upstream distroless riscv64 blocker resolved 2026-02-27, but cert-manager has not shipped a riscv64 image. Building from source required. |
| sigs.k8s.io/controller-runtime | Kubernetes controller framework | Pure Go | No riscv64 CI | Source-only | Depends on Kubernetes platform support. No controller-runtime-specific riscv64 issues. |
| klauspost/cpuid v2 | CPU feature detection (used by minio-go) | Full -- has detect_riscv64.go, riscv_isa.go, os_linux_riscv64.go; detects V, Zb*, Zk* extensions | Not specifically tested | Source-only | Issue #158 "Support RISC-V" was resolved and closed. riscv64 is first-class since cpuid v2.2+. |
| klauspost/compress v1 | Zstd/S2/deflate/snappy (minio-go, backup) | Pure-Go fallbacks | No riscv64 CI | Source-only | ASM acceleration (x86/arm64) absent on riscv64; pure-Go fallback is functional. |
| minio/md5-simd v1 | SIMD-parallel MD5 for MinIO checksums | Pure-Go fallback via build tag `!amd64` | No riscv64 CI | Source-only | x86-only ASM; scalar fallback is correct. No riscv64 issues. |
| minio/crc64nvme v1 | CRC-64/NVMe checksum (minio-go) | Pure-Go fallback via crc64_other.go | No riscv64 CI | Source-only | No riscv64 ASM path; functional. No issues filed. |
| zeebo/xxh3 v1 | Fast hash (MinIO ETag computation) | Pure-Go via accum_stubs_other.go (`!amd64 && !arm64`) | No riscv64 CI | Source-only | Generic path is guarded by build tag; no panic risk. ~2-3x slower than amd64 [NEEDS VERIFICATION -- no riscv64 benchmark data found]. |
| minio/minio-go v7 | S3/MinIO object storage client (backup) | Pure-Go orchestrator with degraded SIMD sub-deps | No riscv64 CI | Source-only | End-to-end backup/restore functional on riscv64 with lower checksum throughput. No blocking issues. |
| go-sql-driver/mysql v1 | MySQL wire-protocol driver (health checks) | Pure Go | No riscv64 CI | Source-only | Transparent riscv64 support. No issues. |
| golang.org/x/crypto v0 | TLS, AES-GCM, SHA for Kubernetes API comms | Go stdlib paths on riscv64; ASM paths are amd64/arm64 only | Part of Go toolchain testing | Source-only | Fully functional on riscv64 since Go 1.22+. Go 1.22+ promotes riscv64 to first-class. |
| prometheus/client_golang v1 | Prometheus metrics exposition | Pure Go | No riscv64 CI | Source-only | Client library is pure Go. Prometheus server itself ships riscv64 since v2.46.0. |
| filippo.io/edwards25519 v1 | Ed25519 crypto (MySQL caching_sha2_password auth) | Pure Go | No riscv64 CI | Source-only | Pure-Go fallback. No riscv64 issues. |

**Summary:** All Go library dependencies either have riscv64-specific implementations or graceful pure-Go fallbacks. The hard blockers are at the container image and platform layer, not the library layer.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| K8SPXC-1728 | Full ARM64 support | Closed (v1.20.0) | High | Resolved. Reference baseline for what a new-architecture port requires. |
| K8SPXC-1821 | Logrotate crash on ARM64 (cron binary dep) | Closed (v1.20.0) | Medium | ARM64 post-port correctness bug. Illustrates that dependency binaries (not just the operator) must be validated per architecture. |
| Kubernetes #132836 | Proposal: official Tier 3 riscv64 support | Open | Critical (platform-level) | Acknowledged by @saschagrunert (2026-03). No KEP approved. Hard blocker for all Kubernetes operators. |

No riscv64-specific bugs exist for this project because no riscv64 port has been attempted. The ARM64 post-port bug (K8SPXC-1821) is instructive: even after the operator image was ported, a dependency binary (cron/logrotate) had an architecture-specific crash. A riscv64 port would require similar validation across all bundled binaries.

## 12. Objections and Upstream Blockers

**Hard blockers:**

1. **Kubernetes platform (critical).** No official riscv64 Kubernetes release exists. Kubernetes issue #132836 (proposal for Tier 3 riscv64) is open with maintainer acknowledgment but no KEP. All major managed Kubernetes distributions (GKE, EKS, AKS) do not offer riscv64. A riscv64 PXC deployment requires a community distribution (k0s or k3s). The operator cannot be used without a functioning Kubernetes cluster.

2. **PXC/MySQL container images (critical).** Percona publishes no riscv64 PXC image. MySQL upstream (Oracle) has no RISC-V support and actively closes RISC-V contribution PRs for licensing reasons (OCA non-compliance). Debian provides community builds, but building a production-grade PXC (MySQL + Galera + Percona patches) image for riscv64 requires substantial effort independent of the operator. ProxySQL, HAProxy, and XtraBackup each require separate riscv64 image builds.

3. **UBI9 base image (critical).** The operator runtime image uses `registry.access.redhat.com/ubi9/ubi-minimal`. Red Hat does not publish UBI9 riscv64 images. The Dockerfile base image must be changed (e.g., to Debian bookworm or Alpine) for a riscv64 operator image.

**Soft blockers:**

4. **cert-manager (soft).** If TLS is managed via cert-manager integration, no official riscv64 cert-manager image exists. The underlying distroless-debian13 riscv64 blocker was resolved 2026-02-27. A cert-manager riscv64 image could be built from source with modest effort; the cert-manager project has not re-enabled riscv64 releases post-distroless fix.

**Organizational posture:**

Percona has shown no interest in RISC-V. The project has no foundation membership, no RISE relationship, and all engineering is internal. Filing a community issue would go to Jira (not GitHub), requiring a Percona CLA. There is no public roadmap item. The probability of Percona independently investing in riscv64 support in the near term is low without a customer or partner commitment.

## 13. Investment Analysis

RISE has no documented prior investment in this project. All work described below is new.

### 13.1 Functional Enablement

The operator binary itself requires minimal work (Dockerfile base image swap, platform matrix addition). The dominant effort is in the managed component images. MySQL/PXC riscv64 enablement is tracked separately in [project-reports/mysql.md](../project-reports/mysql.md) and is a prerequisite for this operator to be useful. Kubernetes riscv64 enablement is tracked in [project-reports/kubernetes.md](../project-reports/kubernetes.md) and is also a prerequisite.

Assuming MySQL/PXC and Kubernetes riscv64 images are available externally, the operator-specific work is:
- Replace UBI9 base image in Dockerfile with a riscv64-compatible alternative (Debian bookworm-slim or Alpine)
- Add `linux/riscv64` to the platform matrix in scan.yml and the build script
- Validate that all bundled binaries referenced in operator pods (cron, logrotate equivalents) work on riscv64
- Add riscv64 to the CI scan workflow with QEMU emulation

### 13.2 Performance Optimization

No performance optimization is applicable to the operator binary itself (pure-Go controller). Performance work would apply to the managed components (MySQL/InnoDB buffer pool, Galera replication, XtraBackup compression). That is out of scope for the operator repo.

MinIO backup throughput: the scalar fallbacks in md5-simd, crc64nvme, and zeebo/xxh3 are not operator-owned dependencies. Upstream fixes in those libraries would automatically benefit the operator.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to the operator requires: QEMU riscv64 emulation in scan.yml (similar to existing arm64 QEMU path), a riscv64-capable Kubernetes test cluster for e2e tests (no cloud provider offers this; would require RISE hardware or k3s/k0s on RISE runners), and riscv64 base images for all test dependencies.

### 13.4 Ecosystem Enablement

Not applicable. The operator has no dependent package ecosystem. Its downstream users are Kubernetes cluster operators running MySQL. Enablement is deployment-level (Kubernetes + container images), not package-ecosystem-level.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | MySQL/PXC riscv64 container image (prerequisite) | 16-24 | MySQL/Percona maintainers or RISE contractor | Critical |
| Functional | Kubernetes riscv64 official support (prerequisite) | External -- see kubernetes.md | Kubernetes SIG-release | Critical |
| Functional | Operator Dockerfile: replace UBI9 base with riscv64-compatible image | 1 | RISE or community contributor | High |
| Functional | ProxySQL riscv64 container image | 4-8 | ProxySQL maintainers or RISE contractor | High |
| Functional | HAProxy riscv64 container image | 2-4 | HAProxy or Percona maintainers | High |
| Functional | XtraBackup riscv64 container image | 4-8 | Percona maintainers or RISE contractor | High |
| Functional | cert-manager riscv64 image (enable existing source build) | 1-2 | cert-manager maintainers or RISE | Medium |
| CI/CD | Add linux/riscv64 to scan.yml platform matrix + QEMU | 1 | RISE or community contributor | High |
| CI/CD | riscv64 e2e test cluster (k3s/k0s on RISE hardware) | 4-6 | RISE infrastructure | Medium |
| Functional | Post-port validation: all bundled binaries on riscv64 (cron, logrotate, etc.) | 2-3 | Percona or RISE contractor | Medium |

Total operator-specific effort (excluding MySQL/PXC, Kubernetes, ProxySQL, HAProxy, XtraBackup which are separate projects): approximately 8-13 person-weeks, conditional on the prerequisite container images existing.

The investment is not justified in isolation. The operator is only useful when all managed component images are available. The correct sequencing is: MySQL/PXC riscv64 first, then the operator.

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

## 15. References

- [percona/percona-xtradb-cluster-operator repository](https://github.com/percona/percona-xtradb-cluster-operator)
- [Percona Operator for MySQL documentation](https://docs.percona.com/percona-operator-for-mysql/)
- [PR #1550: K8SPXC-1309 add multi architecture build support](https://github.com/percona/percona-xtradb-cluster-operator/pull/1550)
- [PR #1567: K8SPXC-1309 fix multi architecture builds](https://github.com/percona/percona-xtradb-cluster-operator/pull/1567)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE databases vertical report](https://github.com/riseproject-dev/sw-ecosystem/blob/main/examples/vertical-report/out/databases.md)
- [Kubernetes issue #132836: proposal for official Tier 3 riscv64 support](https://github.com/kubernetes/kubernetes/issues/132836)
- [klauspost/cpuid: riscv64 support](https://github.com/klauspost/cpuid)
- [cert-manager releases](https://github.com/cert-manager/cert-manager/releases)