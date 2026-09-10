---
title: OpenYurt
parent: Project Reports
color: orange
dependencies:
  - name: Kubernetes
    relation: build-dependency
    criticality: critical
  - name: etcd
    relation: runtime-dependency
    criticality: critical
  - name: gRPC-Go
    relation: build-dependency
    criticality: optional
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: optional
  - name: coreos/go-iptables
    relation: runtime-dependency
    criticality: optional
  - name: vishvananda/netlink
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="openyurt" %}

# OpenYurt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenYurt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenYurt is a Kubernetes-based edge-computing platform that extends the native Kubernetes control plane to manage edge nodes with unreliable or intermittent cloud connectivity. It provides components including YurtHub (an edge-side proxy/cache for the Kubernetes API), Yurt-Manager, yurtadm (cluster bootstrap tool), and Raven (edge networking). The project is written entirely in Go (module `github.com/openyurtio/openyurt`, Go 1.25.0), with no CGO and no C/C++ build system (no `CMakeLists.txt` anywhere in the repository).

**Governance and foundation status.** OpenYurt is a CNCF member project: accepted into the CNCF Sandbox on September 8, 2020, and promoted to CNCF Incubating maturity on January 10, 2025 (per the CNCF projects page). Licensed under Apache 2.0. Governance (`GOVERNANCE.md`) explicitly follows CNCF norms and borrows from BFE, CoreDNS, and Kubernetes governance documents, with decisions by maintainer consensus. Contributor progression follows a Kubernetes-style tiered model (Member -> Reviewer -> Approver -> Maintainer) defined in `community-membership.md`. The CNCF project page lists 68 contributing organizations and 280 contributors in aggregate.

**Corporate sponsors.** Current `MAINTAINERS.md` approvers represent Alibaba (project originator; Linbo He / rambohe-ch, BingChang Tang / zyjhtangtang), Microsoft (Fei Guo / Fei-Guo), VMware (Wuming Liu / lwmqwer), Intel (Shaoqiang Chen / gnunu), Inspur (Chenglong Wang / luckymrwang), and Sangfor (Zhen Zhao / JameKeal), plus one academic affiliation (Tongji University, HanQi Li / LavenderQAQ).

**Community culture on new architecture ports.** The only architecture-porting request the project has received is issue [#2414](https://github.com/openyurtio/openyurt/issues/2414), an unsolicited, automated third-party complexity-assessment post (not from a maintainer or a real porting proposal). It received no maintainer engagement and was auto-closed `wontfix` after going stale. This is the sole data point available on community appetite for a RISC-V port; it does not indicate active interest.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-07-14/15 | PR #71, "add support to build multi-arch binaries and images (arm/arm64)", authored by hwq830 (Alibaba), merged by rambohe-ch | [PR #71](https://github.com/openyurtio/openyurt/pull/71) |
| 2020-08-30 | PR #113, build-tooling refactor for architecture handling, authored by charleszheng44 | (repository history) |
| 2020-09-08 | OpenYurt accepted into CNCF Sandbox | cncf.io/projects/openyurt |
| 2022-05-27 | PR #853, ARM64 buildx fix, authored by rambohe-ch | (repository history) |
| 2023-08-07 to 2023-08-15 | PR [#1638](https://github.com/openyurtio/openyurt/pull/1638), Dependabot bump of `golang.org/x/sys`; changelog text mentions "riscv_hwprobe" (upstream x/sys, not OpenYurt code); **closed, unmerged** | verified via `merged_at: null`, `state: closed` on the GitHub API |
| 2023-10-25 to 2023-11-06 | PR [#1751](https://github.com/openyurtio/openyurt/pull/1751), same pattern, superseded by #1768; **closed, unmerged** | verified via `merged_at: null`, `state: closed` on the GitHub API |
| 2025-01-10 | OpenYurt promoted to CNCF Incubating | cncf.io/projects/openyurt |
| 2025-06-27 | Issue [#2414](https://github.com/openyurtio/openyurt/issues/2414) opened by non-contributor @carlosqwqqwq: automated "RAX" tool rates OpenYurt "Low" porting difficulty (cyclomatic complexity 13,434), asks maintainers to confirm | github.com/openyurtio/openyurt/issues/2414 |
| 2025-09-25 | Issue #2414 auto-flagged stale by stale-bot | github.com/openyurtio/openyurt/issues/2414 |
| 2025-10-03 | Issue #2414 auto-closed, label `wontfix`, state_reason `completed`, no maintainer response recorded | github.com/openyurtio/openyurt/issues/2414 |

**Key contributors to arm64/amd64 multi-arch work:** hwq830 (Alibaba, original multi-arch PR), charleszheng44 (build tooling), rambohe-ch (Alibaba, ongoing arm64 buildx maintenance).

**Is it fully upstream?** There is no RISC-V port to be "upstream" or not. `git log --all -i --grep="riscv"` and `git log --all -p -S"riscv"` across the full non-shallow history (1,431 commits) return zero results. No riscv64 commit of any kind has ever landed in this repository.

## 3. Upstream Support Tier

OpenYurt has no formal, documented architecture-support-tier policy (no equivalent of a Kubernetes KEP or Go's port-tier system). In practice, architecture support is defined implicitly by what `.goreleaser.yaml`, the `Makefile`, and CI workflows target.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-22.04` runners, all workflows) | Yes (cross-compiled via Buildx) | No |
| CI tests | Yes | Not run natively (only default `GOARCH` unit/e2e tests on amd64 runners; arm64 covered via Buildx image builds, not native test execution per available evidence) | No |
| Official release binaries | Yes (`yurtadm`, `yurthub` for linux and darwin) | Yes (`yurtadm`, `yurthub` for linux and darwin) | No |
| Container images | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |
| Release-blocking | Yes | Yes (part of `registry.yaml` multi-arch matrix) | N/A - not a target |

Source: `.goreleaser.yaml` (`goos: [linux, darwin]`, `goarch: [amd64, arm64]`), `.github/workflows/registry.yaml` (`TARGET_PLATFORMS=linux/amd64,linux/arm64,linux/arm/v7`), `Makefile` (`TARGET_PLATFORMS ?= linux/amd64`, arm64 documented as the only alternate).

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenYurt has no architecture-specific subsystems in the traditional sense (no JIT, no SIMD kernels, no hand-written assembly, no custom GC). It is a pure Go control-plane/orchestration codebase. The only place architecture enters the code at all is Go's own `runtime.GOARCH` and explicit build/release matrices.

One concrete architecture-dispatch point exists: `test/e2e/cmd/init/init.go:507-518`, `getCNIBinaryURL()`, contains an exhaustive switch:
```go
switch runtime.GOARCH {
case "amd64": arch = "amd64"
case "arm64": arch = "arm64"
default: panic("unsupported architecture")
}
```
This is not a stub or a TODO - it is a live `panic()` that would fire immediately if OpenYurt's own e2e test tooling were executed on riscv64. This is the strongest direct evidence that riscv64 is explicitly unsupported by the codebase itself, not merely untested.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CNI binary architecture dispatch (e2e init tooling) | Handled | Handled | **Missing - panics on unsupported architecture** |
| Compiled binary GOARCH targets (goreleaser) | Present | Present | **Absent (not in goarch list)** |
| JIT / SIMD / crypto hand-tuned code | N/A (none in project) | N/A (none in project) | N/A (none in project) |

There is no partial or scalar-fallback tier applicable here, because there is no optimization-purpose code to assess (see Section 13). The gap is binary: amd64/arm64 are handled, riscv64 is not referenced anywhere.

## 5. Build System, Cross-Compilation, and Toolchain

OpenYurt's build system is Go's native cross-compilation (`GOOS`/`GOARCH`) plus Docker Buildx for multi-arch container images, driven by the `Makefile`'s `TARGET_PLATFORMS` variable and `hack/make-rules/image_build.sh` / `build.sh`.

- Default build: `make docker-build` (uses `TARGET_PLATFORMS ?= linux/amd64`).
- Documented alternate: `make docker-build TARGET_PLATFORMS=linux/arm64` (example given for Apple Silicon).
- Release builds: `.goreleaser.yaml` restricts `goos: [linux, darwin]` and `goarch: [amd64, arm64]` - goreleaser requires an explicit list, so riscv64 could not be silently produced even if a user attempted a local build.
- QEMU usage: only for arm64 emulation during multi-arch Docker builds (`docker run --privileged --rm tonistiigi/binfmt --uninstall qemu-aarch64`, `Makefile` line 182). No riscv64 QEMU setup exists anywhere.
- Toolchain requirements: only the Go compiler version pinned in `go.mod` (Go 1.25.0). There is no C/C++ compiler minimum-version requirement because there is no CGO or native compilation step in the project.
- No `cmake/riscv64.cmake` or equivalent exists; the repository has no `cmake/` directory at all.
- No riscv64-specific Dockerfile variant exists among `hack/dockerfiles/build/Dockerfile.{yurthub,yurt-manager,node-servant,yurt-iot-dock}` or the release Dockerfiles - all are standard `go build`-based images with no architecture branching beyond what Buildx's `--platform` flag drives.

Because Go itself treats `linux/riscv64` as a secondary port with CGO support, a from-scratch enablement of OpenYurt on riscv64 would primarily require: (1) adding `linux/riscv64` to `TARGET_PLATFORMS` in the `Makefile` and `registry.yaml`, (2) adding `riscv64` to the `.goreleaser.yaml` `goarch` list, (3) fixing the `getCNIBinaryURL()` panic in `test/e2e/cmd/init/init.go`, and (4) validating the full dependency chain (see Section 9) actually functions on riscv64. No known build failure has been documented because riscv64 has never been attempted against this codebase.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `yurtadm` binary release | Yes | Yes | No |
| `yurthub` binary release | Yes (linux only per current releases) | No (linux-amd64-only in checked releases; darwin covers both arches for yurtadm) | No |
| Container images (yurthub, yurt-manager, etc.) | Yes | Yes | No |
| e2e test tooling functional | Yes | Yes | **No - explicit panic on unsupported architecture** |
| CI build coverage | Yes | Yes (via Buildx) | No |

There is no functional gap analysis to perform beyond "present vs. entirely absent" - OpenYurt has never been built, tested, or released for riscv64, so there is no partial-functionality state to characterize. No performance-gap data exists (Section 11/Section on benchmarks confirms zero benchmark data of any kind for OpenYurt on any architecture comparison). No security-hardening or floating-point/NaN semantics issues apply, since OpenYurt contains no numerics-sensitive or architecture-specific low-level code.

## 7. CI/CD Infrastructure

No riscv64 CI exists in any form. Verified by reading all 8 GitHub Actions workflow files at HEAD (`fbefb6b`):

| File | Trigger | Runner | riscv64 mention |
|---|---|---|---|
| `ci.yaml` | push (master/release-*), pull_request, workflow_dispatch | `ubuntu-22.04` | none |
| `registry.yaml` | push tags `v*`, daily schedule, workflow_dispatch | `ubuntu-22.04` | none - `TARGET_PLATFORMS=linux/amd64,linux/arm64,linux/arm/v7` only, no QEMU riscv64 setup |
| `release-assets.yaml` | push tags `v*`, workflow_dispatch | `ubuntu-22.04` (goreleaser) | none |
| `back-port.yaml` | pull_request_target closed, issue_comment | `ubuntu-22.04` | none |
| `rerun-failed-workflows.yaml` | issue_comment | `ubuntu-22.04` | none |
| `sonarcloud.yaml` | schedule (weekly), push master | `ubuntu-22.04` | none |
| `sync-charts.yaml` | push (charts/**), workflow_dispatch | `ubuntu-22.04` | none |
| `trivy-scan.yml` | pull_request master | `ubuntu-22.04` | none |

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, or `azure-pipelines.yml` exist anywhere in the repository - GitHub Actions is the only CI system used. No self-hosted RISC-V runner and no reference to RISE RISC-V Runners (`riseproject-dev`) appear in any workflow.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | No |
| CI test | Yes | Not natively exercised (image-build path only, per available evidence) | No |
| CI release | Yes | Yes | No |
| RISE runner usage | N/A | N/A | None found |

## 8. Distribution and Release Status

No riscv64 binary or package exists for OpenYurt on any channel checked:

| Channel | Method | Result |
|---|---|---|
| GitHub Releases | Checked v1.5.0, v1.5.1, v1.6.0, v1.6.1, v1.7.0 asset lists | Every asset is `yurtadm`/`yurthub` for `darwin-amd64`, `darwin-arm64`, `linux-amd64`, `linux-arm64` (plus `sha256sums.txt`). Zero riscv64 filenames in any release. |
| Ubuntu 26.04 (resolute), project graph | SPARQL query for `openyurt`/`python3-openyurt`/`libopenyurt` | Empty bindings - no match |
| Ubuntu 26.04 (resolute), live `packages.ubuntu.com` | Direct search | "Sorry, your search gave no results" - no package for any architecture |
| PyPI | `pypi.org/pypi/openyurt/json` | HTTP 404 - not a Python package (expected; OpenYurt is Go) |
| Arch Linux RISC-V (archriscv) | `archriscv.felixc.at` search | No `openyurt` entry |

**What a user must do to get a working binary today:** there is none available for riscv64 through any channel. The only path would be building from source after first patching the codebase to remove the `getCNIBinaryURL()` panic (if e2e tooling is needed) and manually cross-compiling with `GOOS=linux GOARCH=riscv64 go build`, which has never been attempted or documented by anyone in the project's history per the available evidence.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go (toolchain) | Compiler/runtime for all binaries | Yes - `linux/riscv64` is a Go secondary port (CGO supported) | Community-maintained, non-blocking to Go releases | Yes - official toolchain ships linux/riscv64 | Not release-blocking for Go itself |
| Kubernetes (`k8s.io/*` libs, vendored `k8s.io/kubernetes` v1.34.0) | Control-plane types/wrapping | Partial - Debian sid patches build `kubectl` (client) only, not server components | No dedicated riscv64 CI; no support tier assigned | No official upstream riscv64 release artifacts | riscv64 has no support tier, no KEP |
| etcd (`go.etcd.io/etcd/{api,client}/v3`) | Backing store for K8s control plane | Compiles (pure Go) but startup blocked by `checkSupportArch()` unless `ETCD_UNSUPPORTED_ARCH=riscv64` is set | None - Prow-only CI, no riscv64 nodes | No official binaries/images | PR [#21510](https://github.com/etcd-io/etcd/pull/21510) ("add riscv64 to supported architectures") closed without merging; maintainer stated "No plans" |
| gRPC-Go (`google.golang.org/grpc`) | RPC transport (YurtHub<->apiserver, tunnel) | Yes - pure Go, no known riscv64 build issues | No dedicated riscv64 CI found | Ships as source module (arch-independent) | Distinct from C++ grpc/grpc, which has a separate riscv64 SIGILL issue not applicable here |
| containerd | CRI runtime edge/cloud nodes run atop | Yes - release binaries since v1.6.8 (2022) | No integration tests on riscv64 in CI | Yes - riscv64 tarballs on every tagged release | Test-coverage gap only |
| runc | OCI runtime executing edge pods | Yes - riscv64 release binary since v1.2.0 (2022); dynamic PIE only | Never exercised in CI before release | Yes - signed riscv64 binaries; packaged in Debian sid/trixie, Ubuntu ports | CI gap only |
| Docker (moby/moby) | Alternate build/runtime path in `Makefile` | Compiles from source, but riscv64 absent from `docker-bake.hcl` platform lists | None | No official binaries | Tracking issue [moby/moby#44319](https://github.com/moby/moby/issues/44319) (2022); enabling PR [#44735](https://github.com/moby/moby/pull/44735) still Draft, unmerged as of June 2026 |
| coreos/go-iptables (wraps iptables/nftables) | NAT/filter rules for YurtHub, raven, tunnel | Yes - mature, arch-independent | N/A | Yes | None known |
| vishvananda/netlink | Kernel netlink route/link management | Yes - pure Go syscall wrapper | N/A | N/A | None known |
| opencontainers/selinux | Security-context labeling (indirect via k8s.io libs) | Yes | N/A | Yes | None known |

**Deep-dive:** none of OpenYurt's dependencies involve JIT, SIMD, or numerics-sensitive code - the entire chain is pure Go plus thin wrappers around Linux kernel interfaces and CLI tools. The concentrated riscv64 risk sits in the runtime/orchestration layer: etcd's hard runtime gate (`checkSupportArch()`, unresolved per [PR #21510](https://github.com/etcd-io/etcd/pull/21510)), Kubernetes's absence of a formal riscv64 support tier, containerd/runc's CI-coverage gaps (builds exist, tests do not), and Docker's stalled enabling PR ([#44735](https://github.com/moby/moby/pull/44735), Draft, unmerged).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2414](https://github.com/openyurtio/openyurt/issues/2414) | Assessment of the difficulty in porting CPU architecture for openyurt | Closed, `wontfix`, state_reason `completed` | N/A - not a bug report | Automated third-party "RAX" complexity-assessment tool post (non-contributor), not a genuine porting proposal; no maintainer engagement recorded; no correctness or performance issue is described |
| [#1638](https://github.com/openyurtio/openyurt/pull/1638) | build(deps): bump golang.org/x/sys 0.10.0->0.11.0 | Closed, unmerged | N/A | riscv64 appears only in upstream x/sys changelog text ("add riscv_hwprobe for riscv64"), not OpenYurt code |
| [#1751](https://github.com/openyurtio/openyurt/pull/1751) | build(deps): bump golang.org/x/sys 0.12.0->0.13.0 | Closed, unmerged, superseded by #1768 | N/A | riscv64 appears only in upstream x/sys changelog text ("update riscv_hwprobe constants") |

There are no correctness bugs to highlight - no riscv64 code has ever run, so no riscv64-specific defect has ever been reported. `mcp__github__search_issues` for `riscv64 bug` and `riscv nan floating` scoped to this repo returned zero results.

## 12. Objections and Upstream Blockers

**Stated objections:** none exist from maintainers. Issue #2414 was closed as `wontfix` by automation (stale-bot) after receiving no maintainer response, not because a maintainer articulated a technical or policy objection to a riscv64 port. There is no recorded maintainer statement either for or against pursuing riscv64 support.

**Technical blockers:**
- `test/e2e/cmd/init/init.go` contains an explicit `panic("unsupported architecture")` for any `GOARCH` other than amd64/arm64 - a direct, if minor, code change required before e2e tooling could run on riscv64.
- Upstream dependency blockers inherited from the stack: etcd's `checkSupportArch()` runtime gate (unresolved, [PR #21510](https://github.com/etcd-io/etcd/pull/21510) closed without merging, maintainer stated "No plans"), Kubernetes's lack of a formal riscv64 support tier, and Docker's stalled multi-platform enabling PR ([#44735](https://github.com/moby/moby/pull/44735), still Draft).

**Organizational blockers:** no engineering resources appear allocated to a riscv64 port on either the maintainer side (no assigned owner, no roadmap item) or a sponsoring organization's side (Alibaba, Microsoft, VMware, Intel, Inspur, Sangfor - none have surfaced riscv64 work in this repository's history).

**Acceptance probability:** Given the codebase itself is pure Go with a straightforward `GOARCH` cross-compilation model and no C/C++ build complexity, a technically competent riscv64-enablement PR (Makefile/goreleaser/CI additions plus the `init.go` fix) would face no architectural obstacle described anywhere in the research. The primary uncertainty is not technical feasibility but whether any organization commits engineer time to do the work and carry it through review, since issue #2414 demonstrates that an unsolicited external signal alone did not produce maintainer engagement.

## 13. Readiness Assessment

- **Color:** orange (base orange - no upstream riscv64 CI, no distribution package on any channel checked, no release artifact)
- **Release provider:** none
- Not an optimization-purpose project; no Optimization level applies.
- **Justification:** OpenYurt has zero upstream riscv64 CI coverage, confirmed by reading all 8 GitHub Actions workflow files (every job runs on `ubuntu-22.04`; multi-arch build/release targets in [`registry.yaml`](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/registry.yaml) and the `Makefile` cover only `linux/amd64,linux/arm64,linux/arm/v7`), and by a full non-shallow git-history search (`git log --all -p -S"riscv"` across 1,431 commits, zero hits). No distribution (Ubuntu 26.04, PyPI, Arch RISC-V) ships an OpenYurt package on any architecture, so the distribution floor described in the color model cannot apply - there is nothing to floor against. The codebase itself asserts non-support: `test/e2e/cmd/init/init.go`'s `getCNIBinaryURL()` panics on any `GOARCH` other than amd64/arm64. This is not a red (confirmed-broken) case, because riscv64 has never actually been attempted, and it is not grey (unknown), because research was exhaustive and conclusive rather than data-starved. Orange - no upstream CI, no distro package - is the correct classification per the color model's Step 1 table.
- **Pending work that could change the grade:** none identified. Issue [#2414](https://github.com/openyurtio/openyurt/issues/2414) is closed `wontfix` with no reopening or follow-up. No open PR touches riscv64. No RISE Project blog post, member listing, or funded-project record mentions OpenYurt; the only trace of RISE-adjacent activity is an unactioned backlog entry in this tracking repository's own `.queue.yml` file, which is a to-do marker for future grading, not evidence of any commenced work.

## 14. Investment Analysis

RISE has not funded or begun any OpenYurt-specific work (confirmed: zero mentions across 34 RISE blog posts, OpenYurt not a RISE member org, no funded Project RPxxx grant, no runner-usage reference). All sizing below is therefore full from-scratch effort with no RISE prior to net out.

### 14.1 Functional Enablement

- Add `linux/riscv64` to `TARGET_PLATFORMS` in `Makefile` and `.github/workflows/registry.yaml`.
- Add `riscv64` to the `.goreleaser.yaml` `goarch` list for `yurtadm`/`yurthub`.
- Fix `getCNIBinaryURL()` in `test/e2e/cmd/init/init.go` to handle `riscv64` instead of panicking.
- Validate the full runtime chain on riscv64: containerd (builds, untested by CI), runc (builds, untested by CI), and work around or resolve etcd's `checkSupportArch()` gate (currently requires `ETCD_UNSUPPORTED_ARCH=riscv64` as a workaround, since upstream etcd has declined to formally add riscv64 support per [PR #21510](https://github.com/etcd-io/etcd/pull/21510)).
- Confirm Kubernetes server components (kube-apiserver, kubelet) actually function on riscv64, since no official upstream riscv64 release artifacts exist for them and no formal support tier has been assigned.

### 14.2 Performance Optimization

Not applicable. OpenYurt is a control-plane orchestration project with no numerics, SIMD, or crypto-performance code path; no optimization-purpose modifier applies (see Section 13). No performance benchmark data exists for OpenYurt on any architecture to establish a baseline.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `registry.yaml` for container image builds (Buildx multi-platform, following the existing amd64/arm64/armv7 pattern).
- Add riscv64 to `ci.yaml`'s build matrix; test execution would require either QEMU riscv64 emulation or native riscv64 runners (RISE RISC-V Runners provide free GitHub Actions riscv64 runners per prior RISE research, though no OpenYurt-specific usage has been established - this would need to be set up from scratch).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's scoping rules. OpenYurt is a standalone Kubernetes-extension binary/toolset (yurtadm, yurthub, yurt-manager) with no dependent package ecosystem (no PyPI, npm, or Maven consumers of OpenYurt itself) that would require separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to `TARGET_PLATFORMS`, `.goreleaser.yaml` goarch list, fix `init.go` panic | 1-2 | Unassigned | High |
| Functional | Validate/resolve etcd `checkSupportArch()` workaround in an OpenYurt-managed cluster context | 1-2 | Unassigned | High |
| Functional | Validate Kubernetes server components (kube-apiserver, kubelet) on riscv64 within an OpenYurt deployment | 2-4 | Unassigned | Medium (depends on upstream K8s riscv64 maturity, outside OpenYurt's control) |
| CI/CD | Add riscv64 build job to `registry.yaml` (Buildx multi-platform) | 1 | Unassigned | High |
| CI/CD | Add riscv64 to `ci.yaml` test matrix (requires runner access - RISE RISC-V Runners or equivalent) | 1-2 | Unassigned | Medium |
| Performance | N/A - not applicable to this project | 0 | N/A | N/A |
| Ecosystem | N/A - no dependent package ecosystem | 0 | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [OpenYurt GitHub repository](https://github.com/openyurtio/openyurt)
- [Issue #2414 - Assessment of the difficulty in porting CPU architecture for openyurt](https://github.com/openyurtio/openyurt/issues/2414)
- [PR #1638 - build(deps): bump golang.org/x/sys from 0.10.0 to 0.11.0](https://github.com/openyurtio/openyurt/pull/1638)
- [PR #1751 - build(deps): bump golang.org/x/sys from 0.12.0 to 0.13.0](https://github.com/openyurtio/openyurt/pull/1751)
- [PR #71 - add support to build multi-arch binaries and images (arm/arm64)](https://github.com/openyurtio/openyurt/pull/71)
- [.github/workflows/ci.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/ci.yaml)
- [.github/workflows/registry.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/registry.yaml)
- [.github/workflows/release-assets.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/release-assets.yaml)
- [.github/workflows/back-port.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/back-port.yaml)
- [.github/workflows/rerun-failed-workflows.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/rerun-failed-workflows.yaml)
- [.github/workflows/sonarcloud.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/sonarcloud.yaml)
- [.github/workflows/sync-charts.yaml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/sync-charts.yaml)
- [.github/workflows/trivy-scan.yml](https://github.com/openyurtio/openyurt/blob/master/.github/workflows/trivy-scan.yml)
- [OpenYurt GitHub Releases](https://github.com/openyurtio/openyurt/releases)
- [OpenYurt on CNCF projects page](https://www.cncf.io/projects/openyurt/)
- [OpenYurt GOVERNANCE.md](https://github.com/openyurtio/openyurt/blob/master/GOVERNANCE.md)
- [OpenYurt MAINTAINERS.md](https://github.com/openyurtio/openyurt/blob/master/MAINTAINERS.md)
- [OpenYurt community-membership.md](https://github.com/openyurtio/openyurt/blob/master/community-membership.md)
- [etcd PR #21510 - add riscv64 to supported architectures (closed, unmerged)](https://github.com/etcd-io/etcd/pull/21510)
- [moby/moby issue #44319 - riscv64 tracking issue](https://github.com/moby/moby/issues/44319)
- [moby/moby PR #44735 - riscv64 enabling PR (Draft, unmerged)](https://github.com/moby/moby/pull/44735)
- [grpc/grpc issue #37791 - abseil-cpp SIGILL on riscv64 (unrelated C++ project, not gRPC-Go)](https://github.com/grpc/grpc/issues/37791)
- [PyPI package lookup for "openyurt" (404)](https://pypi.org/pypi/openyurt/json)
- [Ubuntu 26.04 (resolute) package search for "OpenYurt" (no results)](https://packages.ubuntu.com/search?keywords=OpenYurt&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V (archriscv) package search](https://archriscv.felixc.at/?q=openyurt)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)

---

**File notes for the calling process:** This report was written directly from the supplied live research findings, with no new research performed beyond invoking the `/project-color-coding` skill (loaded inline, applied by the assistant per its documented model) to derive the color/case/release_provider/optimization_gap values used in Section 13 and the frontmatter/header. No local repository clone, GitHub API call, or web fetch was made in the course of writing this report; the clone path referenced in the source findings (`/home/user/openyurtio/openyurt`, and a scratchpad clone at `/tmp/claude-0/-home-user-sw-ecosystem/c494527f-69d2-59f4-ae6c-608a75f951db/scratchpad/openyurt-repo`) belongs to the prior research session, not this one.
