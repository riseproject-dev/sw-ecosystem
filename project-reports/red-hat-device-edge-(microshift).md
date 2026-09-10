---
title: Red Hat Device Edge (MicroShift)
parent: Project Reports
color: red
dependencies:
  - name: Kubernetes
    relation: runtime-dependency
    criticality: critical
  - name: CRI-O
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: optional
  - name: crun
    relation: runtime-dependency
    criticality: critical
  - name: libseccomp
    relation: runtime-dependency
    criticality: critical
  - name: etcd
    relation: runtime-dependency
    criticality: critical
  - name: bbolt
    relation: runtime-dependency
    criticality: optional
  - name: Open vSwitch
    relation: runtime-dependency
    criticality: critical
  - name: CNI plugins
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/crypto
    relation: build-dependency
    criticality: optional
  - name: Go
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="red-hat-device-edge-(microshift)" %}

# Red Hat Device Edge (MicroShift)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Red Hat Device Edge (MicroShift)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Red Hat Device Edge (MicroShift) is a small-footprint OpenShift/Kubernetes distribution for single-node edge deployments, developed as a subproject of [openshift/microshift](https://github.com/openshift/microshift) and marketed by Red Hat at [redhat.com/en/topics/edge-computing/microshift](https://www.redhat.com/en/topics/edge-computing/microshift). It is licensed Apache-2.0.

**Governance.** MicroShift has no independent foundation affiliation (no CNCF, no Linux Foundation project layer). The project's own community page states that, until the team decides a formal community framework is needed, community input flows through a public Slack channel - i.e. governance is explicitly informal and deferred. Merge decisions are gated by the repository's `OWNERS` file (standard Kubernetes/OpenShift Prow-style approval).

**Corporate control.** Cross-checking `OWNERS` approvers against ~7,900 commits shows the project is effectively single-vendor: 4,544 commits from `@redhat.com` addresses, 2,821 from anonymized `users.noreply.github.com` (largely Red Hat engineers using GitHub's privacy email), 150 from `@openshift.io`, 140 from a Red Hat engineer's personal domain, versus a long tail of single-digit external contributions. Every approver and emeritus approver identified (copejon, ggiguash, pmtk, pacevedom, eslutsky, kasturinarra, agullon, dhellmann, rootfs, stlaz, benluddy, sallyom, mangelajo, oglok, fzdarsky, zshi-redhat, pliurh) is a Red Hat engineer. No other corporate maintainer or silicon vendor holds approver status.

**Community stance on new ports.** No RFE, issue, commit, or documentation states any position on adding RISC-V support. Combined with the informal governance model and the project's hard dependency on RHEL/RHEL-for-Edge as host OS (which itself does not ship for riscv64), any RISC-V port would be gated entirely by Red Hat's own internal priorities - there is no external multi-vendor body that could greenlight it independently.

Red Hat LLC is listed as a Premier Member of RISE ([riseproject.dev/members](https://riseproject.dev/members/)), alongside Google, NVIDIA, Qualcomm, SiFive, Tenstorrent, Alibaba Damo, and MediaTek. This is Red Hat-the-company's membership; RISE's homepage and members page make no mention of MicroShift or OpenShift, and this should not be read as implying any MicroShift-specific RISC-V roadmap commitment.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-17 | PR #211 merged: bumps `github.com/prometheus/procfs` v0.2.0 -> v0.7.3 so MicroShift's Go code would compile for riscv64 (dependency's `/proc` parsing lacked riscv64 build tags before this) | [PR #211](https://github.com/openshift/microshift/pull/211) |
| 2021-09-03 | Issue #250 filed by fzdarsky (Red Hat): general enhancement request to automate component-image building for architectures OKD does not itself publish (not riscv64-specific; arm64/ppc64le/riscv64 all in scope) | [Issue #250](https://github.com/openshift/microshift/issues/250) |
| 2021-10-07 to 2021-10-26 | PR #328 merged (closes #250): adds `packaging/images/components/build.sh` plus riscv64-specific Dockerfiles (`base-image/Dockerfile.riscv64`, `coredns/Dockerfile.riscv64`, `flannel/Dockerfile.riscv64`, `haproxy-router/Dockerfile.riscv64`, `pause/Dockerfile.riscv64`) and a stub patch `kube-rbac-proxy/0001-workaround-riscv64.patch` that makes `parseCPUInfoRiscv64()` unconditionally return `nil, nil` - a build-enabling stub, not a functional `/proc/cpuinfo` parser, needed only so `kube-rbac-proxy` would compile on riscv64 | [PR #328](https://github.com/openshift/microshift/pull/328) |
| 2022-05-12 | PR #683 opened by mangelajo (Red Hat, "community" contributor): attempted 4.10-rebase multi-arch update. Commit message states verbatim: "riscv64 is still not working due to some in-podman building issue with the tty availability" | [PR #683](https://github.com/openshift/microshift/pull/683) |
| 2022-05-25 | copejon (Red Hat) requests the PR be rebased onto recent CI changes; no further diagnosis of the riscv64 failure is posted by anyone | [PR #683](https://github.com/openshift/microshift/pull/683) |
| 2022-06-21 | mangelajo closes PR #683 himself, unmerged, stating "not relevant anymore." No maintainer objects or requests the effort be continued | [PR #683](https://github.com/openshift/microshift/pull/683) |
| (none since) | No riscv64-related commit, PR, issue, or CI change has occurred in the repository since June 2022 | Confirmed via `search_commits`/`search_issues`/`search_pull_requests` for "riscv"/"riscv64" against `openshift/microshift`, 0 additional results |

**Key contributors:** carlosedp (external, authored PR #211), mangelajo (Red Hat, authored PR #328 and #683), fzdarsky (Red Hat, filed tracking issue #250, reviewed #328), copejon (Red Hat, requested the rebase that #683 never received), rootfs (Red Hat, reviewed/approved #211 and #328).

**Is it fully upstream?** No. The only merged riscv64-touching work is a trivial dependency bump (#211) and generic multi-arch image-building scaffolding that happened to include riscv64 Dockerfiles and one build-enabling stub patch (#328). The one PR that attempted to make riscv64 images actually build end-to-end (#683) failed and was abandoned unmerged. Since June 2022, the build system has been changed to actively exclude riscv64 (see Section 3), meaning even the 2021-era scaffolding is no longer reachable from the current build.

## 3. Upstream Support Tier

No formal architecture-tier policy document exists: `PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` were all checked and none exist in the repository. The de facto tier policy is defined by `packaging/rpm/microshift.spec`, which pins:

```
ExclusiveArch: x86_64 aarch64
```

on all ten architecture-gated subpackages (main `microshift` package plus `olm`, `multus`, `gateway-api`, `cert-manager`, `metrics-server`, `metrics-node-exporter`, `metrics-kube-state`, `sriov`, and the even-narrower `ai-model-serving` which is `x86_64`-only). No `%ifarch riscv64` branch exists anywhere in the spec. This is uniform, active exclusion, not an oversight in one package.

| | amd64/x86_64 | aarch64/arm64 | riscv64 |
|---|---|---|---|
| `ExclusiveArch` in RPM spec | Included | Included | **Excluded** |
| `Makefile` cross-build target | `cross-build-linux-amd64` | `cross-build-linux-arm64` | **None exists** |
| Per-arch version pin file | `Makefile.version.x86_64.var` | `Makefile.version.aarch64.var` | **None exists** |
| Dedicated CRI-O drop-in config | N/A | `packaging/crio.conf.d/10-microshift_arm64.conf` | **None** |
| In-repo CI | None found (see Section 7) | None found | None found |
| Official binaries | Via Red Hat RPM channels | Via Red Hat RPM channels | **None found in any channel checked** |

Source: `packaging/rpm/microshift.spec` and `Makefile`, read directly from a clone of `openshift/microshift` at HEAD `bb2033cc9bd37f4c442f0bde885687793bacbbc4`, cross-checked with `mcp__github__search_code` (`ExclusiveArch riscv64`, `GOARCH riscv64` -> 0 hits each).

## 4. Technical Architecture and RISC-V-Specific Subsystems

MicroShift is a Go-language control-plane orchestrator (Kubernetes apiserver, kubelet, controller-manager, scheduler, plus etcd and CRI-O/OVS as dependencies). It has no JIT, no hand-written SIMD kernels, no GC-barrier assembly, and no cryptographic primitives implemented in-tree (crypto is delegated to Go's standard library and vendored dependencies). There is therefore no architecture-specific "hot path" subsystem intrinsic to MicroShift itself to grade; RISC-V readiness for this project is a pure build/packaging and dependency-availability question, not an optimization question (see Section 13 on optimization-purpose classification).

The one riscv64-specific code artifact in the project's history is the build-enabling stub described in Section 2 (`parseCPUInfoRiscv64` in vendored `prometheus/procfs`, returning `nil, nil` unconditionally). This silently disables `/proc/cpuinfo` parsing on riscv64 rather than implementing it, and was never revisited after landing in [PR #328](https://github.com/openshift/microshift/pull/328). No such code exists in the current tree (grep for "riscv" outside `vendor/`/`deps/` returns zero hits at current HEAD; the stub predates the 2022 abandonment and its containing Dockerfiles are no longer reachable given the current `ExclusiveArch` restriction).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Control-plane binaries (apiserver/kubelet/etcd, all Go) | Full, native GOARCH | Full, native GOARCH | Not built (excluded by `ExclusiveArch`) |
| `/proc/cpuinfo` parsing (via vendored `prometheus/procfs`) | Full | Full | Historically stubbed to no-op ([PR #328](https://github.com/openshift/microshift/pull/328)); moot since riscv64 is not built at all today |
| Container runtime integration (CRI-O/crun) | Full | Full | Dependent on CRI-O/crun riscv64 support (see Section 9); not exercised by MicroShift regardless |

## 5. Build System, Cross-Compilation, and Toolchain

MicroShift is built with `make` + `go build`; there is no CMake, no `-DUSE_X=OFF`-style build flags, and no documented QEMU cross-build path for riscv64. Files checked and confirmed absent: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, `.ci/docker/`, `Dockerfile.riscv64` - all return 404 against the live repository.

The `Makefile` defines exactly two cross-build targets:
```
cross-build-linux-amd64   (GOARCH=amd64)
cross-build-linux-arm64   (GOARCH=arm64)
```
No `cross-build-linux-riscv64` target exists. The toolchain requirement is a pinned Go compiler version (`go 1.26.3` in `go.mod`), not a C/C++ compiler minimum; nothing riscv64-specific is specified anywhere in the build documentation.

**Known build failure:** the only documented riscv64 build attempt failed. [PR #683](https://github.com/openshift/microshift/pull/683)'s commit message states: "riscv64 is still not working due to some in-podman building issue with the tty availability." No stack trace, log, or further diagnosis was ever posted, and the issue was never root-caused before the PR was abandoned.

**Conclusion:** there are no exact build commands to give for riscv64 because none exist. A user cannot cross-compile MicroShift for riscv64 using any documented, supported path in the upstream repository as it stands today.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles from source | Yes | Yes | No (`ExclusiveArch` blocks the RPM build; no Makefile target) |
| Runs control plane | Yes | Yes | Not applicable - cannot be built |
| CRI-O/OVS networking stack | Supported | Supported | Unresolved even at the tooling layer - abandoned podman/tty build issue ([PR #683](https://github.com/openshift/microshift/pull/683)) |
| Official package/binary | Red Hat RPM channels | Red Hat RPM channels | None found in any checked channel |
| Security hardening parity | N/A (baseline) | N/A (baseline) | Not assessable - no working build exists to harden |
| Floating-point/NaN semantics issues | None reported | None reported | No data - project has never run on riscv64 long enough to surface such issues |

There is no functional gap analysis to perform beyond "does not build": every downstream capability (networking, storage, security) is gated on a build that has never succeeded. Performance-gap analysis (SIMD-related deltas) does not apply, per Section 4 - MicroShift has no architecture-specific hot-path code of its own.

## 7. CI/CD Infrastructure

Direct filesystem inspection of a fresh clone of `openshift/microshift` (HEAD `bb2033cc9bd37f4c442f0bde885687793bacbbc4`) confirms:

| CI mechanism | Path checked | Result |
|---|---|---|
| GitHub Actions | `.github/workflows/` | Directory does not exist. `.github/` contains only `ISSUE_TEMPLATE/`. |
| GitLab CI | `.gitlab-ci.yml` | Does not exist. |
| Jenkins | `Jenkinsfile` (root and recursive, excluding vendor) | Does not exist anywhere in the repo. |
| Cirrus CI | `.cirrus.yml` | Does not exist. |
| OpenShift Prow/ci-operator | `*ci-operator*`, `*.prow.yaml` (recursive, excluding vendor/deps) | No matches in-repo (Prow jobs for OpenShift repos are defined out-of-tree in `openshift/release`, which was not accessible to this research session - a scope gap, not a finding of "riscv64 CI exists there") |

**There is no CI configuration of any kind (GitHub Actions, GitLab CI, Jenkins, or Cirrus) in `openshift/microshift`, for any architecture.** `mcp__github__search_code` queries against the live repository (`riscv path:.github/workflows`, `riscv path:.cirrus.yml`, `%ifarch riscv64`, `ExclusiveArch riscv64`) all returned 0 hits. No RISE runner references (`riseproject-dev`, RISE runner labels) were found anywhere.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-repo CI build | Not found in-repo (see Prow caveat above) | Not found in-repo | Not found in-repo |
| In-repo CI test | Not found in-repo | Not found in-repo | Not found in-repo |
| RISE runner usage | No | No | No |

Data not available: whether `openshift/release` (the out-of-tree Prow job repository for OpenShift projects) defines any riscv64 job for MicroShift - this repository was not accessible to the research session performing this audit and requires a separate check.

## 8. Distribution and Release Status

**GitHub Releases** (`openshift/microshift`): the five most recent releases as of the research date (`5.0.0-rc.1-202609041239.p0`, `5.0.0-rc.0-202609010159.p0`, `4.21.31-202608272317.p0`, `4.18.54-202608211117.p0`, `4.16.69-202608202336.p0`) were checked in detail on the newest tag; only two assets exist, both auto-generated GitHub source archives (`.zip`, `.tar.gz`) - no architecture-specific binaries of any kind are published via GitHub Releases for any architecture. Binary/RPM distribution happens exclusively through Red Hat's own channels (RHEL for Edge / OpenShift subscriptions), which are outside the scope of the public sources checked.

**PyPI:** `red-hat-device-edge-(microshift)` and bare `microshift` both return HTTP 404 - not applicable, MicroShift is a Go/RPM project, not a Python package.

**RISE Python wheel builder** ([gitlab.com/riseproject/python/wheel_builder](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/red-hat-device-edge-(microshift)/)): redirects to the PyPI URL above, which 404s. No package present.

**Ubuntu 26.04 "resolute":** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Red%20Hat%20Device%20Edge%20(MicroShift)&suite=resolute&searchon=names&section=all) and a bare "microshift" search both return "Sorry, your search gave no results" - no package exists under this name for any architecture, not just riscv64.

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=microshift)): no package named microshift or "red hat device edge" found.

**What a user must do to get a working binary today:** there is none available for riscv64 through any channel checked. Even amd64/aarch64 binaries are distributed only via Red Hat's proprietary RPM/subscription channels, not via GitHub Releases, PyPI, or community Linux distributions - and riscv64 is additionally blocked at the source level by `ExclusiveArch` (Section 3), so no channel, official or community, could produce a riscv64 build without an upstream code change first.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Kubernetes (`k8s.io/kubernetes`, vendored) | Core control plane | Builds from source (pure Go + some cgo), no upstream CI gate | No riscv64 conformance/e2e lane upstream | No official riscv64 release artifacts | Open, unresolved: [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) "Proposal: Official Support for RISC-V Architecture" (open as of 2026-08-28) |
| CRI-O | Container runtime interface (hard `Requires: cri-o >= 5.1.0, < 5.2.0`) | Builds (Go) | Unclear, no dedicated riscv64 CI reported | Recently added: [cri-o/cri-o#9873](https://github.com/cri-o/cri-o/issues/9873) "Provide native RISC-V builds" - closed 2026-08-07 | Native builds landed only about one month before this research |
| runc | OCI runtime, transitively used | Builds | - | [opencontainers/runc#5166](https://github.com/opencontainers/runc/issues/5166) - closed 2026-03-12, riscv64 now in CI/release pipeline | |
| crun | Primary OCI runtime MicroShift requires (`Requires: crun`) | Builds (small C codebase) | No dedicated riscv64 CI found | [containers/crun#994](https://github.com/containers/crun/issues/994) closed 2024, general parity request, not confirmation of riscv64 release artifacts | |
| libseccomp | Syscall filtering used by crun/runc | riscv64 syscall table supported since ~v2.5 | Included in normal test suite | Shipped in mainline releases | [seccomp/libseccomp#110](https://github.com/seccomp/libseccomp/issues/110) closed 2020 - resolved long ago |
| etcd (+ `microshift-etcd`) | Cluster datastore | Builds (pure Go) | Unclear dedicated riscv64 CI | Recently added: [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509) - closed 2026-07-03 | |
| bbolt (`go.etcd.io/bbolt`) | Storage engine under etcd (mmap-based) | No riscv64-specific issues found | No dedicated signal found | No dedicated signal found | Tracks Go's own riscv64/mmap support |
| Open vSwitch (OVS) | Default CNI datapath (`microshift-networking` requires `openvswitch >= 3.5`) | Data not available: OVS tracks issues primarily via mailing list/patchwork, not GitHub | Data not available | Data not available | Requires a distro-archive graph query that could not be executed this session (project-graph MCP unreachable) |
| CNI plugins (`containernetworking/plugins`) | Weak/`Recommends` dependency | Pure Go, 0 riscv64 issues found | - | - | No known blockers found |
| golang.org/x/crypto | Crypto primitives (TLS, hashing) | Builds via generic Go fallback (no riscv64 asm acceleration) | - | - | 0 riscv64 issues found; risk is performance, not build-blocking |
| Go toolchain (`go 1.26.3` per `go.mod`) | Compiles the Go portion of the stack | riscv64 is a standard, actively-built GOARCH | Upstream riscv64 builders exist but are flaky | Official riscv64 release ports exist | Open: [golang/go#79067-79069](https://github.com/golang/go/issues/79067) (LUCI riscv64 builders reported broken), [#81175](https://github.com/golang/go/issues/81175) (`cmd/go` test broken on riscv64), [#71255](https://github.com/golang/go/issues/71255) (no SIMD-accelerated swiss map on riscv64), [#80880](https://github.com/golang/go/issues/80880) (still adding LUCI linux-riscv64 builder) |

**Deep-dive:** The container-runtime layer (runc, cri-o, libseccomp) and the datastore layer (etcd) have all landed riscv64 support only in the last several months as of this research (closed issues dated March-August 2026). The Go toolchain itself builds for riscv64 but carries open reliability/performance gaps. The single largest structural blocker independent of MicroShift's own exclusion is upstream Kubernetes: no official riscv64 support exists, and the only proposal ([#132836](https://github.com/kubernetes/kubernetes/issues/132836)) remains open and unresolved. Since MicroShift vendors the full Kubernetes control plane, this alone would gate riscv64 readiness even if MicroShift's own `ExclusiveArch` restriction were lifted. Open vSwitch's riscv64 status could not be determined from GitHub search and requires a distro-archive check not completed this session.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #683](https://github.com/openshift/microshift/pull/683) | Community multi-arch image building update for 4.10 rebase | Closed, unmerged (2022-06-21) | Correctness/build - confirmed broken | Author states "riscv64 is still not working due to some in-podman building issue with the tty availability"; never root-caused, abandoned by its own author |
| [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) | Proposal: Official Support for RISC-V Architecture | Open (as of 2026-08-28) | Blocking dependency | Upstream Kubernetes, MicroShift's core vendored dependency, has no committed riscv64 support plan |

No open issue exists specifically in `openshift/microshift` tagged or discussing riscv64 (confirmed via `search_issues` for "riscv64 performance", "riscv64 bug", "riscv nan floating" against `repo:openshift/microshift` - 0 relevant results; the only two hits returned by keyword overlap, [#607](https://github.com/openshift/microshift/issues/607) and [#219](https://github.com/openshift/microshift/issues/219), are unrelated aarch64/BoringSSL bugs). **Correctness bug highlighted separately:** the `parseCPUInfoRiscv64` stub added in PR #328 (Section 4) is a silent-no-op correctness gap (returns `nil, nil` instead of parsing `/proc/cpuinfo`) that was never revisited before the whole riscv64 effort was abandoned; it is moot today only because riscv64 is not built at all.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer has argued against riscv64 support in any issue or PR thread reviewed.

**Technical blockers:**
1. `packaging/rpm/microshift.spec` actively excludes riscv64 via `ExclusiveArch: x86_64 aarch64` on every subpackage - the build system will not even attempt a riscv64 build today.
2. The one historical attempt to build riscv64 container images failed with an unresolved podman/tty build issue ([PR #683](https://github.com/openshift/microshift/pull/683)) and was never fixed.
3. Upstream Kubernetes, MicroShift's core dependency, has no official riscv64 support ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836), open).
4. MicroShift has a hard dependency on RHEL/RHEL-for-Edge as host OS, and RHEL does not ship for riscv64 - this is an organizational/product blocker as much as a technical one, since even a successful upstream port could not be deployed on Red Hat's supported host OS.

**Organizational blockers:** MicroShift is single-vendor governed (Red Hat, via `OWNERS`) with no external foundation or multi-vendor body able to independently prioritize or greenlight a riscv64 port. Red Hat's membership in RISE is corporate-level, not MicroShift-specific, and carries no documented commitment to this subproject.

**Acceptance probability:** Low in the near term. The abandonment of the one genuine attempt (PR #683) in 2022 with no follow-up in over four years, combined with the active `ExclusiveArch` exclusion added since, and the unresolved Kubernetes-level riscv64 gap, indicate this is not an active or planned effort rather than a stalled-but-wanted one.

## 13. Readiness Assessment

- **Color:** red (confirmed-broken)
- **Release provider:** none
- **Justification:** MicroShift's build system explicitly excludes riscv64 today (`ExclusiveArch: x86_64 aarch64` in [packaging/rpm/microshift.spec](https://github.com/openshift/microshift/blob/main/packaging/rpm/microshift.spec), confirmed across all ten architecture-gated subpackages), and the one historical attempt to build riscv64 images failed with an explicitly documented, unresolved build error - "riscv64 is still not working due to some in-podman building issue with the tty availability" ([PR #683](https://github.com/openshift/microshift/pull/683)) - before being abandoned unmerged by its own author in 2022. No upstream CI, no distribution package, and no release artifact exists for riscv64 in any channel checked (GitHub Releases, PyPI, RISE wheel builder, Ubuntu 26.04 resolute, Arch Linux RISC-V). This is not merely "untested" - riscv64 was tried, confirmed broken, and the current build system now affirmatively refuses to attempt it, which is the "explicit upstream statement that the architecture is unsupported" condition for red rather than the default orange for simply-missing CI.
- **Optimization level:** not applicable - MicroShift is a Kubernetes-distribution/orchestration project, not an optimization-purpose project (Section 4); it has no SIMD, crypto-acceleration, or algorithmic hot-path code of its own whose RISC-V coverage would need grading.
- **Pending work that could change the grade:** none identified. No open PR, no open tracking issue, and no RISE engagement with MicroShift specifically were found (Section 1, Section 12). A grade change would require, at minimum: (1) removing the `ExclusiveArch` restriction and re-attempting the build, (2) resolving the historical podman/tty build failure, and (3) upstream Kubernetes closing its own riscv64 gap ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836)), none of which currently has any active owner or timeline.

## 14. Investment Analysis

**RISE prior work check:** No RISE blog post, GitHub repository, or funded engagement mentions Red Hat Device Edge or MicroShift (Section 1; searches against [riseproject.dev/blog](https://riseproject.dev/blog), the `riseproject-dev` GitHub org, and the RISE Python wheel builder all returned no matches). The only occurrence of the project's name in RISE-adjacent infrastructure is a not-yet-processed queue entry in this repository's own `project-reports/.queue.yml`, which is not evidence of engagement. No work is already covered; the sizing below assumes a from-scratch effort.

### 14.1 Functional Enablement

The blocking chain is: (1) remove `ExclusiveArch: x86_64 aarch64` restrictions across ten RPM subpackages and add a `GOARCH=riscv64` branch to the spec and Makefile; (2) diagnose and fix the unresolved podman/tty build issue from PR #683 (root cause was never identified - could be a podman version issue, a QEMU emulation limitation, or a container runtime configuration gap, requiring fresh investigation); (3) validate the full container-image build pipeline (`packaging/images/components/build.sh`) against riscv64 base images (the 2021 approach used `debian:sid` as a base since neither Fedora nor UBI had riscv64 images at the time - this choice needs re-validation against current Red Hat/UBI riscv64 image availability); (4) revisit and properly implement the `parseCPUInfoRiscv64` stub in vendored `prometheus/procfs` rather than leaving it a silent no-op; (5) MicroShift's practical usefulness on riscv64 is gated on upstream Kubernetes itself gaining official riscv64 support - work here is speculative until [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) resolves.

### 14.2 Performance Optimization

Not applicable at this stage - no functional build exists to optimize. Once a functional port lands, performance work would concentrate on the vendored dependency chain (Section 9), not on MicroShift's own code, since MicroShift has no architecture-specific hot paths of its own.

### 14.3 CI/CD Infrastructure

No in-repo CI of any kind exists for MicroShift, for any architecture (Section 7) - OpenShift/MicroShift testing runs through Prow jobs defined out-of-tree in `openshift/release`. Establishing riscv64 CI would require: (1) access to and changes in `openshift/release` to add a riscv64 Prow job (out of scope for this research session), and (2) riscv64 build/test hardware or CI runners - RISE's RISC-V CI runner program ([riseproject.dev](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) could plausibly serve this, but no engagement with MicroShift has occurred to date.

### 14.4 Ecosystem Enablement

Not applicable - MicroShift has no dependent package ecosystem (Section 10 omitted; see the project's classification below). Note: MicroShift is itself an assembly of Kubernetes-ecosystem components (Kubernetes, CRI-O, etcd, OVS) whose own riscv64 readiness is tracked in Section 9 as dependency work, not ecosystem work in the Section-10 sense (this project has no dependent packages/plugins that build on top of it in a package-manager sense).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Remove `ExclusiveArch` restriction, add riscv64 GOARCH branches to spec/Makefile | 1-2 | Red Hat (owns `OWNERS` gate) | Critical |
| Functional | Root-cause and fix the podman/tty build failure from PR #683 | 2-4 (unknown-unknown - never diagnosed) | Red Hat / community | Critical |
| Functional | Re-validate/rebuild riscv64 base images and Dockerfiles for current toolchain | 1-2 | Red Hat / community | High |
| Functional | Implement real `/proc/cpuinfo` parsing on riscv64 (fix stub) in vendored procfs | 0.5 | Red Hat / community | Medium |
| Blocking dependency | Track and depend on upstream Kubernetes riscv64 support ([#132836](https://github.com/kubernetes/kubernetes/issues/132836)) | N/A - external dependency, not directly sizeable | Kubernetes upstream | Critical (blocking) |
| CI/CD | Add riscv64 Prow job in `openshift/release` once a functional build exists | 1-2 | Red Hat | High |
| CI/CD | Evaluate RISE RISC-V CI runners for MicroShift build/test | 0.5 (evaluation only) | RISE / Red Hat | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [openshift/microshift repository](https://github.com/openshift/microshift)
- [Red Hat Device Edge homepage](https://www.redhat.com/en/topics/edge-computing/microshift)
- [PR #211 - Bump module dependency to support riscv64 arch](https://github.com/openshift/microshift/pull/211)
- [Issue #250 - Automate building of component images for alt. architectures](https://github.com/openshift/microshift/issues/250)
- [PR #328 - Multiarch image building](https://github.com/openshift/microshift/pull/328)
- [PR #683 - Community multi-arch image building update for 4.10 rebase](https://github.com/openshift/microshift/pull/683)
- [Issue #607 - Router pod crash loop on Raspberry Pi 400 (unrelated aarch64 issue)](https://github.com/openshift/microshift/issues/607)
- [Issue #219 - runtime.sigpanic on aarch64 (unrelated)](https://github.com/openshift/microshift/issues/219)
- [kubernetes/kubernetes#132836 - Proposal: Official Support for RISC-V Architecture](https://github.com/kubernetes/kubernetes/issues/132836)
- [cri-o/cri-o#9873 - Provide native RISC-V builds](https://github.com/cri-o/cri-o/issues/9873)
- [opencontainers/runc#5166 - Add linux/riscv64 to CI and release artifacts](https://github.com/opencontainers/runc/issues/5166)
- [containers/crun#994 - Will you offer more CPU architecture builds like runc?](https://github.com/containers/crun/issues/994)
- [seccomp/libseccomp#110 - RFE: add RISC-V support](https://github.com/seccomp/libseccomp/issues/110)
- [etcd-io/etcd#21509 - Add riscv64 to supported architectures](https://github.com/etcd-io/etcd/issues/21509)
- [golang/go#79067 - LUCI riscv64 builders reported broken](https://github.com/golang/go/issues/79067)
- [golang/go#81175 - cmd/go test broken on riscv64](https://github.com/golang/go/issues/81175)
- [golang/go#71255 - runtime: swiss map SIMD implementation for non-amd64](https://github.com/golang/go/issues/71255)
- [golang/go#80880 - adding LUCI linux-riscv64 builder](https://github.com/golang/go/issues/80880)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [MicroShift community page (microshift.io)](https://microshift.io/docs/community/)
- [MicroShift getting-started docs (microshift.io)](https://microshift.io/docs/getting-started/)
- [PyPI search - red-hat-device-edge-(microshift)](https://pypi.org/pypi/red-hat-device-edge-(microshift)/json)
- [Ubuntu 26.04 resolute package search](https://packages.ubuntu.com/search?keywords=Red%20Hat%20Device%20Edge%20(MicroShift)&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial repo search](https://archriscv.felixc.at/?q=microshift)
- [Lightweight Kubernetes Distributions: A Performance Comparison (ICPE 2023)](https://research.spec.org/icpe_proceedings/2023/proceedings/p17.pdf)