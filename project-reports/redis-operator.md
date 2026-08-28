---
title: redis-operator
parent: Project Reports
---

# redis-operator

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for redis-operator<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[redis-operator](https://ot-container-kit.github.io/redis-operator/) is a Kubernetes operator that automates the lifecycle management of Redis and Valkey clusters on Kubernetes. It implements the operator pattern using the controller-runtime framework: it watches custom resources (RedisCluster, RedisReplication, RedisSentinel, RedisStandalone) and reconciles the cluster state by managing StatefulSets, Services, and ConfigMaps.

The project is written entirely in Go with CGO disabled. There is no C/C++ code, no native extension, and no architecture-specific source. The operator is distributed exclusively as a container image published to [quay.io/opstree/redis-operator](https://quay.io/opstree/redis-operator) and GHCR.

**Governance:** Informal, GitHub-native. There is no foundation affiliation (not CNCF, not LF, not Apache). The project is owned and maintained by [OpsTree Solutions](https://opstree.com), an Indian DevOps consultancy. A CODEOWNERS file designates three named maintainers:

- @iamabhishek-dubey (Abhishek Dubey) -- OpsTree Solutions; 288 contributions; primary author
- @shubham-cmyk (Shubham Gupta) -- company not disclosed; 124 contributions
- @drivebyer -- DaoCloud (Chinese cloud-native company); 220 contributions

License: Apache 2.0. No tiered architecture support policy exists. No documented process for requesting new platform targets. The project carries a Hacktoberfest label, indicating openness to community contributions.

**RISE membership:** Neither OT-CONTAINER-KIT nor OpsTree Solutions appears in the [RISE Project member list](https://riseproject.dev/members/). No RISE involvement of any kind.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port has ever been initiated. The complete issue tracker (1,823 issues) and PR history (1,119 PRs), all states, were scanned for "riscv", "riscv64", "risc-v", and "risc_v" -- zero matches.

Multi-arch history is included as context for assessing the cost of a future riscv64 addition:

| Date | Event | Source |
|---|---|---|
| 2022-10-18 | Initial arm64 support added via TARGETARCH build ARG | [PR #356](https://github.com/OT-CONTAINER-KIT/redis-operator/pull/356) by @iamabhishek-dubey |
| 2023-01-16 | arm64 support fixed (broken in prior release) | [PR #404](https://github.com/OT-CONTAINER-KIT/redis-operator/pull/404) by Michael Primeaux |
| 2023-11-08 | QEMU added to CI via docker/setup-qemu-action, enabling cross-build | [PR #694](https://github.com/OT-CONTAINER-KIT/redis-operator/pull/694) by @shubham-cmyk |
| Never | riscv64 mentioned, proposed, or added | Full scan of 1,823 issues and 1,119 PRs |

No RISC-V work is upstream. There is no port in progress, no tracking issue, and no roadmap entry for riscv64.

---

## 3. Upstream Support Tier

No formal tier policy exists. Platform support is defined by the Docker buildx platforms list, which is set in two files and is identical in both:

- [Makefile](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/Makefile): `PLATFORMS = "linux/arm64,linux/amd64"`
- [publish-image.yaml](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/publish-image.yaml): `platforms: linux/amd64,linux/arm64` (both GHCR and Quay.io jobs)

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Container image published | Yes | Yes | No |
| CI build coverage | Yes | Yes | No |
| Official release binary | N/A (image only) | N/A (image only) | N/A |
| Included in PLATFORMS list | Yes | Yes | No |
| Any upstream mention | Yes | Yes | None (0 results) |

riscv64 is not a supported tier. It has never been listed, tested, or shipped.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

redis-operator is a pure Go controller binary. It contains no architecture-specific code of any kind:

- No assembly files (.s, .S)
- No C or C++ files
- No GOARCH build-tag source files
- No SIMD intrinsics
- No JIT backend
- No cryptographic assembly
- No arch-specific subdirectory

The operator's sole function is to make Kubernetes API calls and manage Redis custom resources. All compute-intensive work runs inside the Redis server pods (a separate process), not in the operator binary itself.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT backend | N/A | N/A | N/A |
| SIMD / vector | N/A | N/A | N/A |
| Crypto assembly | N/A | N/A | N/A |
| GC barriers (Go runtime) | Implemented | Implemented | Implemented (Go 1.14+) |
| Architecture-specific Go files | None | None | None |

The arch-sensitivity in this project lies entirely in the container build pipeline and in the managed Redis server image -- not in the operator binary itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Language:** Go 1.25.0 (hard requirement from `go.mod` and `CI GOLANG_VERSION: 1.25.0`).

**CGO:** Disabled (`CGO_ENABLED=0`). No GCC or Clang required. No native libraries linked.

**Dockerfile** (at repo root) uses `TARGETARCH` and `TARGETOS` Docker Buildx ARGs, and builds with:

```
GOOS=$TARGETOS GOARCH=$TARGETARCH CGO_ENABLED=0
go build -ldflags "-s -w" -a -o operator cmd/main.go
```

Base images: `golang:1.25-alpine3.24` (builder stage), `gcr.io/distroless/static:nonroot` (final stage).

**To build for riscv64 today (no upstream changes required):**

Native cross-compile:
```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build -ldflags "-s -w" -a -o manager-riscv64 cmd/main.go
```

Container cross-build via Buildx (requires QEMU binfmt registered):
```
docker run --privileged --rm tonistiigi/binfmt --install riscv64
docker buildx build --platform linux/riscv64 -t redis-operator:riscv64 -f Dockerfile .
```

**To upstream riscv64 into official builds:** a one-line change in the Makefile (`PLATFORMS = "linux/arm64,linux/amd64,linux/riscv64"`) plus a matching update to `publish-image.yaml` and `ci.yaml`. No code changes required.

**Known build failures on riscv64:** Data not available: no riscv64 build attempts exist in public CI logs or issue reports for this project.

**Toolchain versions:**
- Go >= 1.25.0 (has supported GOARCH=riscv64 since Go 1.14; riscv64 is a fully supported target in the official Go distribution)
- Docker Buildx with QEMU riscv64 binfmt for cross-builds
- No CMake, no autoconf, no native toolchain

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The operator binary itself has no feature gaps on riscv64 relative to amd64 or arm64. All operator logic is pure Go and is architecture-neutral.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Operator binary compiles | Yes | Yes | Yes (untested officially) |
| Container image available | Yes | Yes | No |
| Reconciliation logic | Full | Full | Full (same code) |
| Metrics endpoint | Full | Full | Full |
| Webhook server | Full | Full | Full |
| Redis cluster management | Depends on Redis image | Depends on Redis image | Redis has no official riscv64 image |

**Functional gap:** The operator can be compiled and run on riscv64, but it cannot manage a Redis cluster unless a riscv64 Redis container image is available. The official Redis image does not include riscv64 (see Section 9).

**Performance gaps:** None attributable to the operator binary. No SIMD or assembly involved.

**Floating-point/NaN semantics:** Not applicable. The operator performs no floating-point computation.

**Security hardening:** The distroless base image (`gcr.io/distroless/static:nonroot`) does not publish riscv64 manifests in official releases [NEEDS VERIFICATION]. If riscv64 distroless images are unavailable, an alternative base (e.g., `scratch` or `alpine`) would be required for a production riscv64 image build.

---

## 7. CI/CD Infrastructure

All 10 workflow files under `.github/workflows/` were read directly. No riscv64 CI exists in any form.

| Workflow | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `ci.yaml` build_go_binary (matrix: arch) | Yes | Yes | No |
| `ci.yaml` build_scan_container_image | Yes | Yes | No |
| `publish-image.yaml` release-ghcr-image | Yes | Yes | No |
| `publish-image.yaml` release-quay-image | Yes | Yes | No |
| All other 6 workflows (rebase, semantics, etc.) | N/A | N/A | N/A |

All runners are `ubuntu-latest` (x86_64). QEMU (`docker/setup-qemu-action@v3`) is present but configured only for arm64 cross-build emulation. The string "riscv" does not appear in any workflow file.

No RISE CI runners. No hardware-based riscv64 testing of any kind. No riscv64 smoke tests.

---

## 8. Distribution and Release Status

The project publishes releases as Git tags with no attached binary assets. GitHub releases v0.22.2 through v0.26.0 all have `"assets": []` -- zero downloadable files.

Distribution is container image only:
- [quay.io/opstree/redis-operator](https://quay.io/opstree/redis-operator): `linux/amd64`, `linux/arm64`
- GHCR (`ghcr.io/ot-container-kit/redis-operator`): `linux/amd64`, `linux/arm64`

| Channel | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Container image (Quay.io) | Published | Published | Not published |
| Container image (GHCR) | Published | Published | Not published |
| Binary release on GitHub | None | None | None |
| PyPI | N/A (not a Python package; HTTP 404) | N/A | N/A |
| Debian | Not packaged (HTTP 404 on tracker) | Not packaged | Not packaged |
| Ubuntu Noble | Not packaged | Not packaged | Not packaged |
| Arch Linux RISC-V port | Not packaged | Not packaged | Not packaged |

**To get a working riscv64 image today:** Build from source using the cross-compile command in Section 5. No official path exists.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| Redis (`redis/redis`) | Managed data store | Builds (unaligned-access PRs #14166, #14251, #14342 merged) | No official CI -- [PR #14660](https://github.com/redis/redis/pull/14660) open since 2026-01-05 | No official riscv64 binary or image | Yes -- operator is useless without a Redis image |
| Go toolchain | Operator runtime language | Yes, linux/riscv64 in official distribution | 208 open riscv64 issues; active LUCI builder work ([#80880](https://github.com/golang/go/issues/80880)) | Yes, official riscv64 tarballs in every release | No |
| Kubernetes (`kubernetes/kubernetes`) | Orchestration platform | Yes ([#86011](https://github.com/kubernetes/kubernetes/issues/86011), [#116686](https://github.com/kubernetes/kubernetes/pull/116686)) | Limited -- riscv64 pause image still pending ([PR #141291](https://github.com/kubernetes/kubernetes/pull/141291)) | Partial -- pause image PR open | Soft -- operator runs without the pause image but cluster bootstrapping may be affected |
| `sigs.k8s.io/controller-runtime` | Kubernetes operator framework | Yes -- pure Go, cross-compiles | No riscv64-specific CI | Released as Go module, no arch barrier | No |
| `prometheus/client_golang` | Metrics exposition | Yes -- pure Go | No arch-specific issues | Released as Go module | No |
| `redis/go-redis` v9 | Redis client library | Yes -- pure Go | 0 riscv64 issues | Released as Go module | No |
| `grpc/grpc-go` | OTel transport | Yes -- pure Go | No riscv64 CI | Released as Go module | No |
| `open-telemetry/opentelemetry-go` | Tracing/metrics | Yes -- cross-build CI PR merged | 9 issues, all closed | Released as Go module | No |

**Critical dependency: Redis server image.** The operator manages Redis pods. Those pods require a Redis container image built for riscv64. No official riscv64 Redis image exists. [PR #14660](https://github.com/redis/redis/pull/14660) (add riscv64 QEMU CI) has been open since 2026-01-05 without merge. Users must build and host a custom Redis riscv64 image. This is the primary functional blocker for using redis-operator on a riscv64 Kubernetes cluster.

**Kubernetes pause image.** The Kubernetes pause container image (required for every pod sandbox) does not have an official riscv64 build. [PR #141291](https://github.com/kubernetes/kubernetes/pull/141291) is open. This is a Kubernetes-level blocker for running any workload on a riscv64 node, not specific to redis-operator.

Go riscv64 performance gaps exist (missing crc32 assembly [#78918](https://github.com/golang/go/issues/78918), missing bytealg assembly [#79997](https://github.com/golang/go/issues/79997)) but are not relevant to operator control-plane throughput.

---

## 11. Known Bugs and Active Issues

No riscv64-related bugs or issues exist in the redis-operator issue tracker. The full issue history (1,823 issues, all states) was scanned.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | No riscv64 issues exist | -- | -- | Exhaustive scan confirmed 0 results |

The only relevant upstream bugs are in dependencies:

| Repo | Issue/PR | Title | Status | Severity |
|---|---|---|---|---|
| redis/redis | [PR #14660](https://github.com/redis/redis/pull/14660) | CI: add riscv64 QEMU build and smoke test | Open (since 2026-01-05) | High -- no official Redis riscv64 CI or image |
| kubernetes/kubernetes | [PR #141291](https://github.com/kubernetes/kubernetes/pull/141291) | Add riscv64 pause image | Open | High -- required for any pod on riscv64 node |
| golang/go | [#78918](https://github.com/golang/go/issues/78918) | riscv64: missing crc32 asm | Open | Low (performance only) |
| golang/go | [#79997](https://github.com/golang/go/issues/79997) | riscv64: missing bytealg asm | Open | Low (performance only) |

No correctness bugs for redis-operator on riscv64 have been reported.

---

## 12. Objections and Upstream Blockers

**No stated objections exist.** No maintainer has commented on riscv64 in any issue, PR, or commit. The topic has never arisen.

**Technical blockers:**

1. Redis server image for riscv64 is absent. This is the functional blocker that makes the operator non-deployable on a riscv64 cluster regardless of operator image availability. Requires either upstreaming Redis riscv64 CI (PR #14660) or maintaining a custom image.

2. Kubernetes pause image for riscv64 is absent (PR #141291 open). This is a cluster-level blocker that affects all Kubernetes workloads on riscv64, not redis-operator specifically.

3. `gcr.io/distroless/static:nonroot` riscv64 availability is unconfirmed [NEEDS VERIFICATION]. If the distroless base image does not publish a riscv64 manifest, the operator Dockerfile requires a base image substitution.

**Organizational blockers:**

None. OpsTree Solutions has shown willingness to accept community contributions (Hacktoberfest label). The three CODEOWNERS control merges. DaoCloud (@drivebyer) has active interest in cloud-native riscv64 enablement -- this is a positive signal [NEEDS VERIFICATION: no direct statement from @drivebyer about riscv64 interest in this project].

**Probability of acceptance:** A PR adding `linux/riscv64` to the platforms lists would be mechanically straightforward and likely acceptable, but would have low priority without a demonstrated user need on riscv64 Kubernetes clusters.

---

## 13. Investment Analysis

RISE has done nothing for this project. All work described below is unstarted.

### 13.1 Functional Enablement

The operator binary cross-compiles to riscv64 with zero code changes. The only build work is adding `linux/riscv64` to the platforms list in `Makefile` and `publish-image.yaml`, plus verifying the distroless base image availability for riscv64.

The functional gap blocking real deployments is the **Redis server image for riscv64**, not the operator. A functioning deployment requires: (a) a riscv64 Redis container image, (b) a riscv64 Kubernetes cluster with pause image support.

### 13.2 Performance Optimization

Not applicable. The operator is a control-plane component with negligible compute requirements. No SIMD, no JIT, no performance-sensitive path exists in the operator binary.

### 13.3 CI/CD Infrastructure

Adding riscv64 to CI requires extending the build matrix in `ci.yaml` and registering QEMU riscv64 binfmt in the CI setup step. The QEMU infrastructure is already present for arm64 -- adding riscv64 is additive. No hardware runners are needed; emulated builds are sufficient for a pure Go binary.

### 13.4 Ecosystem Enablement

Not applicable. redis-operator is a single Kubernetes operator with no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `linux/riscv64` to Makefile PLATFORMS and publish-image.yaml; open upstream PR | 0.25 | RISE contributor | High |
| Functional | Verify or substitute distroless base image for riscv64 | 0.25 | RISE contributor | High |
| Functional | Upstream Redis riscv64 CI (PR #14660) and publish official Redis riscv64 image | 3-5 (Redis team) | Redis maintainers / RISE | Critical |
| Functional | Upstream Kubernetes riscv64 pause image (PR #141291) | 2-3 (K8s team) | Kubernetes maintainers / RISE | Critical |
| CI/CD | Extend `ci.yaml` build matrix to include riscv64 QEMU cross-build and smoke test | 0.5 | RISE contributor | Medium |
| CI/CD | Add riscv64 end-to-end test on a real riscv64 Kubernetes cluster | 4-6 | RISE infrastructure | Low |

The operator itself is a 0.5 person-week task. The blocking work is in Redis and Kubernetes, both of which are tracked separately in the scope.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [redis-operator GitHub repository](https://github.com/OT-CONTAINER-KIT/redis-operator)
- [redis-operator documentation](https://ot-container-kit.github.io/redis-operator/)
- [publish-image.yaml workflow](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/publish-image.yaml)
- [ci.yaml workflow](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/ci.yaml)
- [Makefile](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/Makefile)
- [Dockerfile](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/Dockerfile)
- [CODEOWNERS file](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/CODEOWNERS)
- [PR #356: Initial arm64 support](https://github.com/OT-CONTAINER-KIT/redis-operator/pull/356)
- [PR #404: arm64 support fix](https://github.com/OT-CONTAINER-KIT/redis-operator/pull/404)
- [PR #694: Add QEMU to CI](https://github.com/OT-CONTAINER-KIT/redis-operator/pull/694)
- [redis/redis PR #14660: CI: add riscv64 QEMU build and smoke test](https://github.com/redis/redis/pull/14660)
- [kubernetes/kubernetes PR #141291: Add riscv64 pause image](https://github.com/kubernetes/kubernetes/pull/141291)
- [golang/go issue #78918: riscv64 missing crc32 assembly](https://github.com/golang/go/issues/78918)
- [golang/go issue #79997: riscv64 missing bytealg assembly](https://github.com/golang/go/issues/79997)
- [golang/go issue #80880: riscv64 LUCI builder work](https://github.com/golang/go/issues/80880)
- [RISE Project member list](https://riseproject.dev/members/)
- [quay.io/opstree/redis-operator image registry](https://quay.io/opstree/redis-operator)