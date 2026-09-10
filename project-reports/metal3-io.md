---
title: metal3-io
parent: Project Reports
color: orange
dependencies:
  - name: Kubernetes
    relation: build-dependency
    criticality: critical
  - name: controller-runtime
    relation: build-dependency
    criticality: critical
  - name: etcd
    relation: build-dependency
    criticality: critical
  - name: prometheus/client_golang
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="metal3-io" %}

# metal3-io

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for metal3-io<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Metal3 (metal3-io) is a Kubernetes-native bare-metal host provisioning system. `baremetal-operator`, the repository in scope for this report, is the core operator that manages the lifecycle of physical hosts (inspection, provisioning, deprovisioning) via the OpenStack Ironic bare-metal API, talking to server BMCs over Redfish and IPMI. It is written entirely in Go (no CGo, no vendored C/C++ code), targeting `go 1.26.0`, and is built as a set of container images plus a single Kubernetes-manifest release asset rather than distro packages.

**Governance and foundation:** Metal3 is a CNCF project. It was accepted into the CNCF Sandbox on 2020-09-08 and promoted to CNCF Incubating on 2025-08-14, per the [CNCF project page](https://www.cncf.io/projects/metal3/). It operates as a Series of LF Projects, LLC, and is licensed under Apache License 2.0. The project is actively pursuing CNCF Graduation; a self-assessment document exists in the community repo dated April 2026.

**Corporate sponsors:** Approver seats are split almost evenly between two organizations: **Red Hat** (8 approvers) and **Ericsson Software Technology** (9 approvers, `@est.tech` domain), per `metal3-io/community/maintainers/ALL-OWNERS`. Commit-volume analysis (~4,876 human commits, bot/dependabot excluded) confirms the same split at the code level: Red Hat 1,260 commits, Ericsson 776 commits, with smaller contributions from Fujitsu (~83), Mirantis (17), Orange (11), Deutsche Telekom (6), and single-digit contributions from SUSE, Intel, NVIDIA, SAP, and Tesla. Listed adopters include Ericsson, Red Hat (OpenShift), Airship, Deutsche Telekom "Das SCHIFF", Fujitsu, IKEA IT AB, Mirantis, PITS Global Data Recovery, SUSE, Sylva, and Mistral AI, per [community/ADOPTERS.md].

**Governance model:** Kubernetes-style OWNERS/OWNERS_ALIASES files with Prow-compatible `/lgtm` + `/approve` workflow, a four-level contributor ladder (Community Contributor -> Organization Member -> Reviewer -> Approver), majority-yes/zero-no maintainer voting (single veto), and 2/3-maintainer approval required for governance changes. A formal `VENDOR_NEUTRALITY.md` commits to hardware-vendor neutrality on the BMC-protocol axis (Redfish/IPMI, no vendor lock-in) and to running CI/CD on CNCF-donated infrastructure. Notably, this neutrality framing is entirely about BMC/hardware-vendor independence, not CPU ISA independence.

**Community culture on new ports:** No documented community position (blog post, ADR, governance doc) on RISC-V or new-CPU-architecture support was found anywhere in the project's repos or docs. Combined with the total absence of riscv commits, code, or CI targets, and the fact that the build system's `ALL_ARCH` list contains only `amd64` (Section 5), the project's practical stance reads as neutral-by-silence: RISC-V has simply never been proposed or requested, not actively opposed. [NEEDS VERIFICATION: GitHub issue-level search was blocked by rate-limiting/semantic-search restrictions during research, so an issue-level "someone asked and was told no" discussion cannot be fully ruled out; only commit- and code-level search were exhaustive.]

## 2. Port History and Upstreaming Timeline

No RISC-V port exists and none has ever been attempted.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 commit, PR, issue, or tracking item exists anywhere in the metal3-io org | Org-wide `search_commits`/`search_code` for "riscv" returned 0 results; full-repo grep for "riscv" (case-insensitive) returned 0 matches |

**Key contributors:** None - there is no RISC-V work to attribute.

**Is it fully upstream?** Not applicable; there is no work to be upstream or downstream of.

The only GitHub items in the metal3-io org that match the string "riscv"/"riscv64" at all are three routine Dependabot dependency-bump PRs, listed here for completeness because they were the only search hits, not because they represent RISC-V work:

| PR | Repo | Content | Why it matched | Status |
|---|---|---|---|---|
| [#3529](https://github.com/metal3-io/baremetal-operator/pull/3529) | baremetal-operator | Bump `golang.org/x/crypto` 0.54.0 -> 0.55.0 in `/hack/tools` | Linked x/crypto changelog mentions "optimised assembly for riscv64" | Merged 2026-08-17, not yet in a tagged release (pending v0.15.0) |
| [#3531](https://github.com/metal3-io/baremetal-operator/pull/3531) | baremetal-operator | Bump `golang.org/x/crypto` 0.54.0 -> 0.55.0 in `/test` | Same x/crypto changelog entry ("optimizations for riscv64 assembly in poly1305") | Merged 2026-08-17, not yet in a tagged release (pending v0.15.0) |
| [#2576](https://github.com/metal3-io/cluster-api-provider-metal3/pull/2576) | cluster-api-provider-metal3 | Bump `github.com/docker/docker` 28.1.1 -> 28.2.0 in `/test` | Linked Moby changelog notes the `riscv_hwprobe` syscall added to the default seccomp profile | Merged 2025-06-03, shipped in v1.11.0 (released 2025-09-15) |

None of these three PRs contain any RISC-V-specific change to metal3-io code itself; the match is entirely incidental, inside a third-party dependency's changelog text.

## 3. Upstream Support Tier

Metal3 has no architecture-tier policy of the kind seen in projects like Yocto. What it has instead is a per-component **release-version support tier**, documented in `metal3-io/metal3-docs/docs/user-guide/src/version_support.md`:
- **Supported** - the two most recent minor releases.
- **Tested** - one additional prior release kept in CI for emergency patches.
- **EOL** - everything older, dropped immediately on a new minor release.

This tier governs release-branch lifecycle, not CPU architecture. There is no separate architecture-support tier document.

**Comparison table: amd64 vs arm64 vs riscv64**

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In `Makefile` `ALL_ARCH` build list | Yes (only entry) | No | No |
| CI build/test | Yes (only arch built/tested in all 22 GitHub Actions workflows) | No CI matrix entry found | No CI matrix entry found (0 matches for "riscv" repo-wide) |
| Official release asset | Yes (`vbmctl-linux-amd64` shipped in every release) | No architecture-specific asset found | No architecture-specific asset found |
| Documented as supported hardware target | Yes | Claimed as a supported BMC-managed host architecture in project docs, though the operator's own container build/CI covers amd64 only | Not mentioned anywhere in docs |

## 4. Technical Architecture and RISC-V-Specific Subsystems

`baremetal-operator` is a pure-Go Kubernetes operator with no CGo, no SIMD, no JIT, no inline assembly, and no CPU-architecture-conditional source files (no `_riscv64.go`, `_amd64.go`, or `_arm64.go` build-tagged files; no `#ifdef __riscv` equivalents). Its domain is bare-metal host lifecycle management over HTTP-based BMC protocols (Redfish/IPMI) and the Ironic REST API - there is no computational hot path that would call for architecture-specific tuning.

Confirmatory checks performed:
- `mcp__github__search_code` for `__riscv repo:metal3-io/baremetal-operator` -> 0 results.
- `mcp__github__search_code` for `GOARCH riscv64 repo:metal3-io/baremetal-operator` -> 0 results.
- Org-wide repo listing (`org:metal3-io`, 25 repos) shows every repo is Go, Shell, Python, Dockerfile, Smarty, or HTML - zero C/C++/assembly repos in the org.

**Comparison table per component: amd64 vs arm64 vs riscv64**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Source-level arch-specific code (intrinsics/asm/`#ifdef`) | Missing - none exists; pure Go, arch-agnostic by design | Missing - same | Missing |
| Multi-arch container build target | Present (in `ALL_ARCH` build matrix) | Present in some published container images per project docs, but not in the `ALL_ARCH` Makefile list (0 matches) | Missing - not in any workflow's build matrix (confirmed: 0 matches across all 21 `.github/workflows/*.yml` files, Makefile, Dockerfile, Dockerfile.plugin-test, docs) |
| Tracking issue/PR/commit for RISC-V support | N/A | N/A | Missing - 0 genuine hits; only 3 false-positive dependency-bump PRs (Section 2) |

**Conclusion:** Because this project has no architecture-specific source code for any CPU architecture (amd64/arm64 included), the "full/partial/scalar/missing" hand-tuning rubric does not map onto this codebase. This is not an optimization-purpose project (Section 13 explains why Step 2 of the readiness color model is not applied).

## 5. Build System, Cross-Compilation, and Toolchain

There is no CMake/C++ build system in this repository - `baremetal-operator` builds via a `Makefile` (19KB) invoking `go build`, with Go 1.26.6 as the toolchain per the `Dockerfile`'s `BUILD_IMAGE` argument.

**Exact build mechanics (confirmed by reading the live repository, clone HEAD `f59f465`):**
- `Makefile:99`: `ALL_ARCH = amd64` - the only architecture in the all-arch build target.
- `Dockerfile` / `Dockerfile.plugin-test`: `ARG ARCH=amd64` - default and only exercised build arch in CI. `GOOS=linux GOARCH=${ARCH}` is used internally, meaning `make ARCH=riscv64 docker-build` would likely work manually (Go itself supports `GOARCH=riscv64`), but this is untested and unsupported by the project's own CI - no evidence exists that anyone has tried it.
- `CGO_ENABLED=1` is set in the Dockerfile for the plugin build mode, but no minimum C compiler version is pinned or documented anywhere in the repo (this is a light dependency, not a hard cross-toolchain requirement).
- QEMU references in the repo are unrelated to cross-compilation: they are used for libvirt/QEMU VMs in e2e hardware-simulation tests (`test/vbmctl`, `test/e2e`), not `qemu-user-static` emulation for building foreign-arch binaries.

**No riscv64 build documentation exists.** There is no `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, or any toolchain file in the repository - none of these files exist because this is not a CMake/C++ project.

**Known build failures:** None documented, because riscv64 has never been attempted in this project's CI or release pipeline.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Operator container image build | Yes | Present in some published images per docs (not in `ALL_ARCH`) | No |
| Release-published binary (`vbmctl-linux-*`) | Yes (`vbmctl-linux-amd64`) | No arch-specific asset found | No |
| CI build validation | Yes (all 22 workflows) | No riscv64/arm64-specific matrix entry found in workflows checked | No |
| CI test execution | Yes | No CI-level evidence found | No |

There is no functional gap analysis to perform beyond binary/build availability - since the codebase is pure Go with no architecture-conditional logic, there is no reason to expect functional divergence on riscv64 if it were built; the gap is entirely one of untested/unbuilt status, not documented functional limitation.

**Performance gaps:** Not applicable - no SIMD-dependent hot paths exist in this codebase (Section 4).

**Security hardening gaps:** No riscv64-specific security hardening documentation or issues were found; not applicable given the total absence of riscv64 builds.

**NaN/floating-point semantics issues:** None found; searches for "riscv64 bug", "riscv nan floating" against `metal3-io/baremetal-operator` returned 0 results, and this operator has no numerically-sensitive code paths.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was verified by reading, in full, all files in the live repository clone (origin confirmed as `https://github.com/metal3-io/baremetal-operator`, HEAD at the actual v0.14.0 release merge commit `f59f465`, dated 2026-09-08):

`.github/workflows/`: build-images-action.yml, build-pr.yml, dependabot.yml, e2e-fixture-test.yml, e2e-test-optional-periodic.yml, e2e-test-periodic-main.yml, e2e-test-periodic-release-0.11.yml, e2e-test-periodic-release-0.12.yml, e2e-test-periodic-release-0.13.yml, e2e-test.yml, pipeline.yml, plugin-test.yml, pr-gh-workflow-approve.yaml, pr-link-check.yml, pr-verifier.yaml, release.yaml, scheduled-fuzz.yml, scheduled-link-check.yml, unit.yml, validate-security-insights.yml, yamllint.yaml, zizmor.yml.

A repo-wide, case-insensitive `grep -rniE "riscv"` across the entire repository (all directories, not just `.github/`) returns **zero matches** anywhere, including the Makefile, Dockerfile, Dockerfile.plugin-test, and docs.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository (confirmed: `ls` returned "No such file or directory" for all three).

**RISE runners:** No reference to `riseproject-dev` or RISE runner labels found anywhere in CI config. Independently confirmed: metal3-io has no RISE Project involvement of any kind (Section 12).

**Hardware used:** Not applicable - `build-images-action.yml` triggers on push to `main`/`release-*`/tags and delegates to an external reusable workflow (`metal3-io/project-infra/.github/workflows/container-image-build.yml@main`) for a single-image build, with no arch matrix and no QEMU setup step in this repo.

**Comparison table: amd64 vs arm64 vs riscv64**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes (default and only build arch) | Not found in workflow matrix | No (0 matches, confirmed) |
| CI test execution | Yes | Not found | No |
| Release-blocking | Yes (amd64 is the sole build target) | N/A | N/A |
| Runner type | Standard GitHub-hosted runners (no arch-specific config seen) | N/A | N/A |

## 8. Distribution and Release Status

**No riscv64 binaries exist through any channel checked.**

- **GitHub releases** (`metal3-io/baremetal-operator`, live API check via `https://api.github.com/repos/metal3-io/baremetal-operator/releases`): the most recent releases (v0.14.0, v0.13.4, v0.13.3, v0.12.7, v0.14.0-rc.0) ship only two asset types: `baremetal-operator.yaml` (a Kubernetes manifest, architecture-neutral) and `vbmctl-linux-amd64` (an amd64-only binary). Zero asset filenames contain "riscv" or "riscv64" in any release.
- **PyPI**: `https://pypi.org/pypi/metal3-io/json` returns HTTP 404 - no such package exists (metal3-io is not distributed via PyPI; it is a Go project distributed as container images and Kubernetes manifests).
- **Ubuntu** (`packages.ubuntu.com`, suite=resolute/26.04): search for `metal3-io` returns "Sorry, your search gave no results." No package of any name variant (`metal3-io`, `python3-metal3-io`, `libmetal3-io`) exists on any architecture.
- **Project graph** (Ubuntu 26.04 resolute, riscv64 architecture query): 0 bindings for all three candidate package names.
- **Arch Linux RISC-V port** (archriscv.felixc.at): no package named metal3-io or similar listed at any version.
- **Debian, Fedora**: not separately checked, but given the PyPI/Ubuntu/Arch results and the project's distribution model (container images, not OS packages), no distro package is expected to exist.

**What a user must do to get a working binary today:** There is no riscv64 path. A user would need to build from source manually (`make ARCH=riscv64 docker-build`), which is untested by the project and unsupported - no evidence exists that this has ever been attempted successfully or unsuccessfully.

## 9. Dependencies

`baremetal-operator` is pure Go with no CGo and no vendored C/C++ code. Its `go.mod` (go 1.26.0) contains none of the classic JIT-backend/SIMD/numerics/crypto-library/compression-library/memory-allocator C dependencies. The closest analogues to "critical dependencies" are the Go toolchain itself, the Kubernetes client stack, etcd, gRPC-Go/Protocol Buffers, and OpenTelemetry.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Go (golang/go, go 1.26.0) | Language runtime/compiler | Yes - secondary/community port, official `linux/riscv64` since Go 1.14 (2020) | Partial - race detector works but too slow for regular racebuild ([#78258](https://github.com/golang/go/issues/78258)); ASAN open ([#57691](https://github.com/golang/go/issues/57691)); MSan unsupported; fuzzing instrumentation unsupported; TSAN partial fail ([#76816](https://github.com/golang/go/issues/76816)) | Yes - official `go.dev/dl` binaries since Go 1.21 | Open critical bug [#78161](https://github.com/golang/go/issues/78161) (memory-corruption/inlining miscompile); [#74683](https://github.com/golang/go/issues/74683) FIPS140 broken with `-buildmode=pie`; ~20-40% perf gap vs arm64. See `project-reports/go.md` |
| Kubernetes client libs (k8s.io/api, apimachinery, client-go, component-base, klog, utils, v0.36.4) | Talks to k8s API server | Yes (pure Go) | No dedicated upstream riscv64 CI signal found for client-go | No official riscv64 binaries; Ubuntu `kubernetes` package is arch=all metapackage only | Open proposal [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) "Official Support for RISC-V Architecture", still unresolved. See `project-reports/kubernetes.md` |
| sigs.k8s.io/controller-runtime v0.24.1 | Reconciliation/manager framework | Yes (pure Go) | No dedicated riscv64 CI found | Go module only | Not in projects.yml; no dedicated report |
| sigs.k8s.io/cluster-api v1.14.1 | Cluster API integration types | Yes (pure Go) | 0 riscv64-specific issues found | Go module only | Not in projects.yml; no dedicated report |
| go.etcd.io/etcd/client/pkg/v3 v3.7.1 | etcd client; etcd server backs Kubernetes storage | Yes - Debian sid Installed on riscv64 buildd; Ubuntu 24.04 ports has etcd-client/etcd-server | Not fully characterized | Yes via distro packages | [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509) "Add riscv64 to supported architectures" closed as completed 2026-06-04 - the prior `ETCD_UNSUPPORTED_ARCH=riscv64` startup restriction has been resolved upstream. See `project-reports/etcd.md` (predates this fix) |
| google.golang.org/grpc v1.83.1 (indirect) | RPC transport (OTLP exporter, apiserver-network-proxy) | Yes - pure Go, 0 known riscv64-specific issues | No dedicated riscv64 CI signal | Go module only | None found for grpc-go specifically |
| google.golang.org/protobuf v1.36.12 (indirect) | Wire serialization | Yes (pure Go) | No dedicated riscv64 CI found | Go module only | 0 riscv64 issues on `protocolbuffers/protobuf-go`. See `project-reports/protocol-buffers.md` |
| go.opentelemetry.io/* (indirect) | Observability/tracing instrumentation | Yes - pure Go, full feature parity with arm64/amd64 at source level | Tier 3, no active runtime testing on riscv64 per project report | Yes - GitHub releases ship `otelcol*_linux_riscv64.deb`; Debian sid has C++ SDK for riscv64 | See `project-reports/opentelemetry.md` |
| github.com/prometheus/client_golang v1.24.1 | Metrics instrumentation | Yes - pure Go client library | No dedicated riscv64 CI found | Server: yes via Debian/Ubuntu; client library: Go module only | See `project-reports/prometheus.md` |
| github.com/gophercloud/gophercloud/v2 v2.14.0 | OpenStack API client (Ironic/Nova) | Yes - pure Go, 0 riscv64 issue hits | Untested independently | Go module only | Not in projects.yml |
| go.uber.org/zap v1.28.0 | Structured logging | Yes (pure Go) | Untested independently | Go module only | Low-risk, not checked in depth |
| github.com/onsi/ginkgo/v2 v2.32.1, github.com/onsi/gomega v1.43.0 | Test framework | Yes (pure Go) | Minor: [onsi/ginkgo#643](https://github.com/onsi/ginkgo/issues/643) "parallel debug mode not work on mips64le and riscv64" (closed) | Go module only | Not in projects.yml |
| github.com/metal3-io/ironic-standalone-operator/api v0.11.0 | Manages the Ironic backend | Yes - pure Go API types | 0 riscv64 issues found | Go module only | Not in projects.yml |

**Summary:** No riscv64 issues were found on `baremetal-operator` itself. The single materially important, recently-resolved item is [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509) (closed 2026-06-04): etcd's hard architecture allowlist blocking riscv64 has been lifted, removing a longstanding blocker for a full Kubernetes-on-riscv64 stack. The single largest open blocker in this chain is [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) (official RISC-V support proposal, still open), plus Go's own open correctness bug [#78161](https://github.com/golang/go/issues/78161) (memory corruption/miscompile on riscv64, no fix landed) - both upstream of `baremetal-operator`, not within its own repo. Because this operator is pure Go with no CGo, its riscv64 buildability is gated almost entirely by (a) the Go toolchain's riscv64 secondary-port health and (b) whether the broader Kubernetes/etcd stack it deploys against is riscv64-capable, not by any SIMD/JIT/numerics library concerns.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issue exists in metal3-io/baremetal-operator | N/A | N/A | Confirmed by repeated GitHub issue/code/commit search (`riscv repo:metal3-io/baremetal-operator`, `riscv64 repo:metal3-io/baremetal-operator`, org-wide variants) - 0 genuine results across every search performed |

Note (upstream, not metal3-io-owned): [golang/go#78161](https://github.com/golang/go/issues/78161) is a critical, open, unresolved memory-corruption/miscompile bug affecting riscv64 in the Go toolchain that all of `baremetal-operator` depends on transitively. This is flagged here because it is the single most consequential correctness risk in the dependency chain, even though it is not a metal3-io-owned bug (see Section 9 and `project-reports/go.md`).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No community position (blog post, ADR, governance doc) on RISC-V exists anywhere in metal3-io's repos.

**Technical blockers:**
- No riscv64 entry in the `ALL_ARCH` build list (`Makefile:99`) - this is a one-line change to attempt, but has never been made or proposed.
- No riscv64 CI runner or matrix entry to validate a build even if attempted.
- Upstream Go correctness bug [#78161](https://github.com/golang/go/issues/78161) (open, no fix landed) represents residual toolchain-level risk for any Go binary built for riscv64, including this operator.
- Broader Kubernetes ecosystem gap: [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836), the official proposal for RISC-V support in Kubernetes itself, remains open and unresolved - a fully riscv64 Kubernetes control plane is a prerequisite for `baremetal-operator` to be meaningfully deployed on riscv64 nodes.

**Organizational blockers:** None documented. Governance is dominated by Red Hat and Ericsson (Section 1), neither of which appears on the RISE member roster through Metal3 specifically - Red Hat is a RISE Premier Member, but that affiliation is not exercised through the Metal3 project (Section 1, confirmed via [riseproject.dev/members](https://riseproject.dev/members)).

**RISE Project connection:** None found. Exhaustive search across all ~30 RISE blog posts (2024-05-15 to 2026-08-24), the RISE member/project roster, the riseproject-dev GitHub org's 25 repos, and the RISE Python wheel builder listing (~80 packages) found zero references to metal3-io, metal3, or bare-metal Kubernetes provisioning. The only trace of metal3-io in any RISE-adjacent repository is a to-be-researched entry in this repo's own project-tracking queue (`project-reports/.queue.yml`), which is evidence of a pending research task, not an existing relationship.

**Acceptance probability:** Given (a) zero technical blockers specific to metal3-io's own code (pure Go, no arch-conditional logic), (b) an active, well-governed project pursuing CNCF Graduation with clear PR/review process, and (c) no stated objection to new architectures, a riscv64 build target addition to `ALL_ARCH` would likely be technically straightforward to propose and could plausibly be accepted if someone submitted it with working CI validation. The blocker is entirely that no one has proposed it, not that it has been rejected. [NEEDS VERIFICATION: this is an inference from the absence of objections and the project's demonstrated maintenance discipline elsewhere, not a tested claim - no riscv64 PR has ever been submitted to test actual acceptance behavior.]

## 13. Readiness Assessment

- **Color:** orange (plain no-upstream-CI baseline)
- **Release provider:** none
- **Justification:** No upstream riscv64 CI exists anywhere in `metal3-io/baremetal-operator` - confirmed by reading all 22 `.github/workflows/*.yml` files plus a full-repository recursive grep for "riscv" (zero matches), verified against a live clone at HEAD `f59f465` (v0.14.0, 2026-09-08). No upstream riscv64 release artifact exists - confirmed via the live [GitHub releases API](https://api.github.com/repos/metal3-io/baremetal-operator/releases), which shows only `baremetal-operator.yaml` (arch-neutral manifest) and `vbmctl-linux-amd64` across the five most recent releases. The distribution floor does not apply and cannot lift this above orange, because no distribution (Ubuntu, Debian, Arch, PyPI) ships a metal3-io package on any architecture at all, confirmed via direct queries to each. This project is not optimization-purpose (pure-Go operator with no SIMD/JIT/crypto-asm hot paths), so Step 2 of the color model does not apply and no Optimization level is reported.
- **Pending work that could change the grade:** None identified. There is no open PR, no tracking issue, and no RISE involvement of any kind that would move this project toward a higher grade. The path to yellow/blue is a single concrete, low-effort step that has simply never been taken: add `riscv64` to `Makefile:99`'s `ALL_ARCH` list and wire up a CI build job. Because the codebase has no architecture-specific code, reaching blue (build+test passing, no official release) is plausible with modest effort once someone starts; reaching green would additionally require upstream to publish a `vbmctl-linux-riscv64` release asset.

## 14. Investment Analysis

RISE has done no work on metal3-io - confirmed by exhaustive search of the RISE blog, member roster, riseproject-dev GitHub org, and RISE wheel builder listing (Section 12). Nothing here is already covered; all sizing below is from a zero baseline.

### 14.1 Functional Enablement

The core enablement work is small because the codebase has no architecture-conditional logic. Required steps: (1) add `riscv64` to the `ALL_ARCH` Makefile variable, (2) validate `go build`/`GOOS=linux GOARCH=riscv64` compiles cleanly (expected to work out of the box given pure-Go dependencies per Section 9), (3) validate the container image builds via the existing `Dockerfile` with `ARG ARCH=riscv64`, (4) run the existing unit/e2e test suite under riscv64 emulation or native hardware to confirm no runtime issues. Risk is concentrated entirely in upstream dependencies (Go toolchain bug #78161, Kubernetes/etcd stack maturity), not in metal3-io's own code.

### 14.2 Performance Optimization

Not applicable. This is not an optimization-purpose project; there are no SIMD/JIT/numerics hot paths to tune (Section 4). No investment is warranted here.

### 14.3 CI/CD Infrastructure

Requires adding a riscv64 job to the existing GitHub Actions workflows (`build-pr.yml`, `unit.yml`, and the reusable `container-image-build.yml` from `metal3-io/project-infra`), ideally using RISE-provided native RISC-V GitHub runners (announced per the RISE blog post "Announcing the RISE RISC-V Runners", 2026-03-24 - though metal3-io has not adopted these). This is a moderate-effort task requiring coordination with metal3-io's `project-infra` shared-workflow repo, which is outside `baremetal-operator` itself.

### 14.4 Ecosystem Enablement

Not applicable per Section 10 exclusion criteria - `baremetal-operator` has no dependent package ecosystem (no PyPI/npm/Maven packages depend on it; it is a standalone Kubernetes operator distributed as a container image and manifest).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to `ALL_ARCH`, validate `go build`/container build under `GOARCH=riscv64` | 1-2 | metal3-io maintainers or external contributor | Medium |
| Functional | Run existing unit/e2e suite on riscv64 (emulated or native) and triage any failures | 1-2 | metal3-io maintainers or external contributor | Medium |
| CI/CD | Add riscv64 job to `build-pr.yml`/`unit.yml`, coordinate with `project-infra` reusable workflow for container builds | 2-3 | metal3-io CI Team + project-infra maintainers | Medium |
| CI/CD | Evaluate RISE native RISC-V GitHub runners for the new job | 0.5-1 | metal3-io CI Team | Low |
| Release | Add `vbmctl-linux-riscv64` and riscv64 container image tag to release pipeline once CI is green | 0.5-1 | metal3-io Release Team | Low |
| Upstream dependency | Track resolution of [golang/go#78161](https://github.com/golang/go/issues/78161) and [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) as prerequisites for production confidence | ongoing monitoring, not direct effort | N/A | Low (external dependency) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [metal3-io/baremetal-operator repository](https://github.com/metal3-io/baremetal-operator)
- [Metal3 homepage](https://metal3.io/)
- [CNCF Metal3 project page](https://www.cncf.io/projects/metal3/)
- [PR #3529 - Bump golang.org/x/crypto in /hack/tools](https://github.com/metal3-io/baremetal-operator/pull/3529)
- [PR #3531 - Bump golang.org/x/crypto in /test](https://github.com/metal3-io/baremetal-operator/pull/3531)
- [PR #2576 - Bump github.com/docker/docker in /test (cluster-api-provider-metal3)](https://github.com/metal3-io/cluster-api-provider-metal3/pull/2576)
- [GitHub releases API - metal3-io/baremetal-operator](https://api.github.com/repos/metal3-io/baremetal-operator/releases)
- [golang/go#78161 - memory-corruption/miscompile on riscv64](https://github.com/golang/go/issues/78161)
- [golang/go#78258 - race detector too slow on riscv64](https://github.com/golang/go/issues/78258)
- [golang/go#57691 - ASAN support open for riscv64](https://github.com/golang/go/issues/57691)
- [golang/go#76816 - TSAN partial fail on riscv64](https://github.com/golang/go/issues/76816)
- [golang/go#74683 - FIPS140 broken with -buildmode=pie on riscv64](https://github.com/golang/go/issues/74683)
- [kubernetes/kubernetes#132836 - Proposal: Official Support for RISC-V Architecture](https://github.com/kubernetes/kubernetes/issues/132836)
- [etcd-io/etcd#21509 - Add riscv64 to supported architectures (closed as completed)](https://github.com/etcd-io/etcd/issues/21509)
- [onsi/ginkgo#643 - parallel debug mode not work on mips64le and riscv64](https://github.com/onsi/ginkgo/issues/643)
- [RISE Project - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project members list](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog/)
- [Ubuntu package search (resolute/26.04)](https://packages.ubuntu.com/search?keywords=metal3-io&suite=resolute&searchon=names&section=all)
- [PyPI JSON API - metal3-io (404)](https://pypi.org/pypi/metal3-io/json)
- [Arch Linux RISC-V port package listing](https://archriscv.felixc.at/)
- `project-reports/go.md`, `project-reports/etcd.md`, `project-reports/kubernetes.md`, `project-reports/protocol-buffers.md`, `project-reports/opentelemetry.md`, `project-reports/prometheus.md`, `project-reports/grpc.md` (referenced dependency status reports, local repository files)
