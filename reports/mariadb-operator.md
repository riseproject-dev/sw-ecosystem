---
title: mariadb-operator
---

# mariadb-operator

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for mariadb-operator<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[mariadb-operator](https://github.com/mariadb-operator/mariadb-operator) is a Kubernetes operator for deploying and managing MariaDB instances in cloud-native environments. It handles lifecycle operations including provisioning, replication, failover, backup/restore via S3, and TLS certificate management. The operator is distributed as a container image and Helm chart, not as a standalone daemon or library.

**Language:** Pure Go (Go 1.26.0, CGO_ENABLED=0). No C, no assembly, no architecture-specific code in the operator source.

**Governance:** No formal foundation membership (not CNCF, not Linux Foundation, not OpenSSF). No GOVERNANCE.md, MAINTAINERS, OWNERS, or CODEOWNERS file. Contributing is governed by CONTRIBUTING.md only (fork-and-PR model). There is no published platform support tier policy.

**Corporate sponsors:** MariaDB Corporation is the de facto sole backer. Martin Montes (mmontes11, @mariadb-corporation) accounts for 3503 of approximately 4000 total commits. Other contributors - Stefan Genov (150 commits), Pieter Humphrey (46 commits), Daniel Black (16 commits) - are all MariaDB employees. No independent governance structure exists.

**RISE membership:** Not a member. The project has no engagement with the RISE project.

**Community culture on new ports:** No evidence of any community discussion, request, or initiative related to RISC-V. Adding a new architecture would require either a MariaDB employee initiative or a community PR accepted by the primary maintainer.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V activity of any kind | GitHub issue/PR/commit search: 0 results across all 10 vectors |

No RISC-V port has been started, proposed, or discussed. GitHub code search returns zero results for "riscv" and "riscv64" in the repository. No issues, no pull requests, no commits, no mailing list threads. First RISC-V commit: none.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project publishes no architecture support matrix document.

**De facto architecture support by evidence:**

| Architecture | Binary Release | Docker Image | CI Coverage | Issues Filed |
|---|---|---|---|---|
| linux/amd64 | Yes (v26.6.0) | Yes | Yes (ubuntu-latest) | Full |
| linux/arm64 | Yes (v26.6.0) | Yes | No dedicated runner | 6 issues |
| linux/riscv64 | No | No | No | 0 issues |

The `.goreleaser.yaml` enumerates `goarch: [amd64, arm64]` only. The release workflow sets `platforms: linux/arm64,linux/amd64` only. Both are explicit exclusions of riscv64, not oversights attributable to the Go toolchain.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The operator itself contains no architecture-specific code. There are no JIT backends, no SIMD dispatch, no hand-written assembly, no crypto acceleration, no GC barriers, and no ISA extension usage. The Dockerfile uses `ARG TARGETARCH` and passes it directly to `GOARCH=${TARGETARCH}` - the build is architecturally neutral at the source level.

**Component inventory:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go source files (arch-specific) | 0 | 0 | 0 |
| Assembly (.S) | 0 | 0 | 0 |
| CGO / C code | 0 | 0 | 0 |
| SIMD / RVV intrinsics | N/A | N/A | N/A |
| JIT backend | N/A | N/A | N/A |

The operator binary is a pure Go controller loop. RISC-V enablement for the operator source requires zero code changes.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go toolchain only. No cmake, no autoconf, no C toolchain. CGO_ENABLED=0 eliminates all C dependency at build time.

**To build the operator binary for riscv64 (unofficial, untested by upstream):**

```bash
GOOS=linux GOARCH=riscv64 go build -o bin/mariadb-operator cmd/controller/*.go
```

**To build the container image for riscv64 via buildx + QEMU:**

```bash
docker buildx build \
  --platform linux/riscv64 \
  -t ghcr.io/mariadb-operator/mariadb-operator:riscv64 \
  .
```

No toolchain flags, no `-DUSE_X=OFF` equivalents, no known build failures specific to riscv64. The binary should cross-compile cleanly given that all dependencies either have pure-Go riscv64 paths or fallback stubs that do not panic under normal operator operation.

**Practical blocker:** The operator without working operand images is not useful. The images it deploys - `mariadb:11.8.8`, `mariadb/maxscale:23.08.5`, `prom/mysqld-exporter:v0.15.1` - do not publish riscv64 variants. See the MariaDB and MariaDB Connector/C reports for the database-side status.

**Required infrastructure changes to release officially:**
1. Add `riscv64` to `goarch` list in `.goreleaser.yaml`
2. Add `linux/riscv64` to `platforms:` in `.github/workflows/release.yml`

Both are one-line changes. No source code modifications required.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None in the operator source. All operator functionality (controller loops, CRD reconciliation, backup/restore orchestration, TLS management, primary election) is implemented in pure Go with no arch-conditional code paths.

**Performance gaps:** The operator is a control-plane component. It does not process database query traffic. Throughput-sensitive paths are in the database server (MariaDB), not the operator. Backup/restore uses S3 via minio-go; the minio/md5-simd and minio/crc64nvme dependencies fall back to scalar implementations on riscv64, which reduces checksum throughput for large backups. No quantitative benchmark data exists for any architecture.

**Security hardening gaps:** Data not available: no upstream documentation of security hardening flags (stack canaries, CFI, PIE) per architecture was found.

**Floating-point / NaN semantics:** Not applicable. The operator performs no floating-point computation.

---

## 7. CI/CD Infrastructure

All 8 workflow files in `.github/workflows/` were checked: `ci.yml`, `helm-release-crds.yml`, `helm-release.yml`, `helm.yml`, `release.yml`, `stale.yaml`, `test-image-ubi.yml`, `test-image.yml`. No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` found.

**Result: zero riscv64 CI of any kind.**

| CI Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes (ubuntu-latest) | No dedicated job | No |
| Test job | Yes (ubuntu-latest) | No dedicated job | No |
| Docker multi-arch build | Yes (QEMU in release.yml) | Yes (QEMU in release.yml) | No |
| RISE runner | No | No | No |
| Hardware runner | No | No | No |

The `release.yml` workflow uses `docker/setup-qemu-action` and `docker/build-push-action`, confirming the project already uses QEMU for arm64. Adding riscv64 to the `platforms:` string is the only CI change needed for image builds. Unit and integration test jobs on riscv64 would require either a hardware runner or a QEMU-based GitHub Actions runner.

No RISE CI runners are used or planned for this project.

---

## 8. Distribution and Release Status

**Official binaries (v26.6.0):**

| Asset | Available |
|---|---|
| linux_amd64 tarball | Yes |
| linux_arm64 tarball | Yes |
| linux_riscv64 tarball | No |
| darwin_amd64 tarball | Yes |
| darwin_arm64 tarball | Yes |

**Container image (ghcr.io/mariadb-operator/mariadb-operator:26.6.0):**

Manifests published for linux/amd64 and linux/arm64 only. No linux/riscv64 manifest entry.

**Package repositories:**

| Repository | Status |
|---|---|
| PyPI | HTTP 404 - not applicable (Go binary, not Python) |
| Debian tracker | HTTP 404 - not packaged |
| Ubuntu 24.04 Noble | Not found |
| Arch Linux RISC-V | Not found |

**What a user must do to get a working riscv64 binary:** Build from source using `GOOS=linux GOARCH=riscv64 go build`, then build a custom container image via `docker buildx`. No pre-built artifacts are available. The resulting operator will be non-functional until riscv64 MariaDB server images also exist.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| github.com/klauspost/cpuid/v2 | CPU feature detection | Yes - `riscv_isa.go`, `os_linux_riscv64.go` added 2026 (issue #158 closed) | No - CI is amd64/arm64/macOS/Windows only | No | ISA string parser added in 2026; untested in upstream CI |
| github.com/klauspost/compress | Compression (zstd, snappy, lz4) | Yes - `riscv64` explicit in build tags; pure-Go fallback | No | No | SIMD acceleration absent on riscv64; scalar fallback used |
| github.com/zeebo/xxh3 | Fast hashing (xxHash3) | Yes (partial) - `accum_stubs_other.go` covers `!amd64 && !arm64`; AVX2/SSE/NEON stubs panic if called | No | No | Scalar only on riscv64; no vector path |
| github.com/cespare/xxhash/v2 | xxHash64 (Prometheus client) | Yes - `xxhash_other.go` covers `!amd64 && !arm64`; pure-Go fallback | No | No | Scalar only |
| github.com/minio/md5-simd | Parallel MD5 (S3 checksums) | Yes (fallback only) - `md5-server_fallback.go` uses stdlib `crypto/md5`; amd64 assembly not compiled | No | No | No riscv64 acceleration; correctness fine via fallback |
| github.com/minio/crc64nvme | CRC-64/NVMe (S3 data integrity) | Partial - `crc64_other.go` compiles; `hasAsm=false`; `updateAsm()` panics if called; code guards correctly around `hasAsm` | No | No | No hardware acceleration on riscv64; amd64 and arm64 only |
| github.com/minio/minio-go/v7 | S3 object storage client (backup/restore) | Yes - pure Go client; arch-specific deps fall back gracefully | No | No | Functional on riscv64 at reduced checksum throughput |
| github.com/go-mysql-org/go-mysql | MySQL replication protocol (failover) | Yes - pure Go; no arch-specific code | No | No | No known issues |
| github.com/pingcap/tidb/pkg/parser (indirect) | SQL parser (via go-mysql-org) | Unknown - builds from source but no riscv64 CI machine | No - maintainer confirmed no riscv64 machine (issue #46088, closed informally) | No | Upstream maintainer (@hawkingrei) stated "TiDB has no riscv64 machine, we can not build and test tidb for it" [NEEDS VERIFICATION that this remains current] |
| golang.org/x/crypto | TLS, SSH, crypto primitives | Yes - Go stdlib team supports riscv64 | Yes (golang.org CI) | Yes | No issues |
| sigs.k8s.io/controller-runtime | Kubernetes controller scaffolding | Yes - pure Go | No riscv64 CI | No riscv64 image | No issues |
| github.com/cert-manager/cert-manager | TLS certificate management | Yes - pure Go | No riscv64 CI | No riscv64 image | No arch-related open issues |
| github.com/prometheus/client_golang | Metrics instrumentation | Yes - pure Go | No riscv64 CI | No | No issues |

**Cross-references to other reports in this series:**
- Kubernetes (k8s.io/api, k8s.io/client-go): see `reports/kubernetes.md`
- Prometheus (github.com/prometheus/client_golang): see `reports/prometheus.md`
- MariaDB (the database the operator manages): see `reports/mariadb.md`
- MariaDB Connector/C: see `reports/mariadb-connector-c.md`

**Key finding on pingcap/tidb parser:** This is an indirect dependency pulled in via go-mysql-org/go-mysql. The TiDB maintainer explicitly confirmed no riscv64 CI capacity in issue #46088. Whether this dependency is required at runtime (versus only at compile time for the SQL parser) and whether the absence of riscv64 testing introduces correctness risk requires further analysis.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| - | No RISC-V issues exist | - | - | Zero results across all 10 GitHub search vectors |

No correctness bugs, no performance regressions, no build failures on riscv64 have been filed. This is because riscv64 has never been attempted, not because it has been validated.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**
- None in the operator source. CGO_ENABLED=0, pure Go, one-line goreleaser and release.yml changes required.
- The practical blocker is the operand: `mariadb:11.8.8` and `mariadb/maxscale:23.08.5` do not publish riscv64 images. An operator that cannot deploy its managed resource is not useful.
- pingcap/tidb SQL parser (indirect dependency via go-mysql-org): no upstream riscv64 CI and no maintainer capacity confirmed. Correctness exposure is unclear without a riscv64 test run.

**Organizational blockers:**
- The project has no formal governance. The single effective maintainer (Martin Montes, MariaDB Corporation, 3503/~4000 commits) would need to accept a PR or initiate the change himself.
- No community interest has been expressed. Zero issues, zero PR attempts.
- MariaDB Corporation's prioritization of riscv64 is unknown from available data.

**Acceptance probability:** High for the operator binary and image, given the trivial nature of the changes and the existing QEMU infrastructure. The bottleneck is the MariaDB server image availability, which is outside this project's control.

---

## 13. Investment Analysis

RISE has not funded or engaged with mariadb-operator. No work on this project is covered by existing RISE initiatives.

### 13.1 Functional Enablement

Adding riscv64 to the goreleaser `goarch` list and Docker buildx `platforms` list are the two required changes. Both are one-line edits. No source code changes needed.

The primary dependency risk is the pingcap/tidb SQL parser (indirect, via go-mysql-org). A compile-and-runtime validation on riscv64 hardware should be completed before declaring the operator functional.

### 13.2 Performance Optimization

The operator is a control-plane process. It does not lie on any database query hot path. Performance optimization within the operator itself has no user-visible impact.

For backup/restore operations using minio-go: minio/md5-simd and minio/crc64nvme use scalar fallbacks on riscv64. The throughput impact depends on backup file sizes and network bandwidth. No benchmark data is available from any architecture. Enabling hardware CRC and MD5 acceleration on riscv64 would require upstream work in minio/crc64nvme and minio/md5-simd respectively - these are separate projects not controlled by the operator maintainers.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding QEMU-based riscv64 builds to `release.yml` is a one-line change and reuses existing QEMU setup. A riscv64 integration test runner (hardware or QEMU VM) would be needed for full regression coverage.

### 13.4 Ecosystem Enablement

Not applicable. The operator has no dependent package ecosystem on riscv64. The downstream dependency is the MariaDB server image, addressed in the MariaDB and MariaDB Connector/C reports.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `linux/riscv64` to `release.yml` platforms and `.goreleaser.yaml` goarch | 0.1 | Contributor / MariaDB Corp | Critical |
| Functional | Validate indirect pingcap/tidb SQL parser builds and runs correctly on riscv64 | 0.5 | Contributor | High |
| CI/CD | Add QEMU riscv64 build job to release.yml | 0.1 | Contributor / MariaDB Corp | High |
| CI/CD | Add riscv64 integration test runner (hardware or QEMU VM) | 2 | RISE / Contributor | Medium |
| Performance | Upstream riscv64 acceleration to minio/crc64nvme and minio/md5-simd | 4 | Contributor (separate projects) | Low |

Total estimated effort for functional enablement and CI: approximately 3 person-weeks. Majority of effort is in CI infrastructure, not source changes. Performance optimization in minio dependencies is optional and low-priority for a control-plane operator.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [mariadb-operator GitHub repository](https://github.com/mariadb-operator/mariadb-operator)
- [mariadb-operator release v26.6.0 assets](https://github.com/mariadb-operator/mariadb-operator/releases/tag/v26.6.0)
- [mariadb-operator release.yml CI workflow](https://github.com/mariadb-operator/mariadb-operator/blob/main/.github/workflows/release.yml)
- [mariadb-operator Dockerfile](https://github.com/mariadb-operator/mariadb-operator/blob/main/Dockerfile)
- [klauspost/cpuid issue #158 - Support RISC-V](https://github.com/klauspost/cpuid/issues/158)
- [klauspost/compress repository](https://github.com/klauspost/compress)
- [minio/md5-simd repository](https://github.com/minio/md5-simd)
- [minio/crc64nvme repository](https://github.com/minio/crc64nvme)
- [pingcap/tidb issue #46088 - riscv64 build](https://github.com/pingcap/tidb/issues/46088)
- [go-mysql-org/go-mysql repository](https://github.com/go-mysql-org/go-mysql)
- [RISE project member list](https://riseproject.dev)
- [Arch Linux RISC-V package tracker](https://archriscv.felixc.at)
- [Debian package tracker - mariadb-operator (not found)](https://tracker.debian.org/pkg/mariadb-operator)
- [ghcr.io mariadb-operator container image](https://github.com/mariadb-operator/mariadb-operator/pkgs/container/mariadb-operator)