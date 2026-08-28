---
title: k0s
parent: Project Reports
categories:
  - containers
---

# k0s

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for k0s<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[k0s](https://k0sproject.io/) ([github.com/k0sproject/k0s](https://github.com/k0sproject/k0s)) is a single-binary Kubernetes distribution designed for minimal resource consumption and simple deployment. It statically embeds the full Kubernetes control plane (kubelet, kube-apiserver, kube-controller-manager, kube-scheduler, kubectl), containerd, runc, etcd, kine, konnectivity, CoreDNS, kube-router, and supporting binaries into one self-contained executable.

k0s holds CNCF Sandbox status under "a Series of LF Projects, LLC." It is governed informally via GitHub pull requests with no written GOVERNANCE.md. The project is Mirantis-dominated: 5 of 6 active maintainers are Mirantis employees (Jussi Nummelin @jnummelin, Tom Wieczorek @twz123, Natanael Copa @ncopa, Aleksey Makhov @makhov, Kimmo Lehto @kke). One seat is held by Ethan Mosbaugh of Replicated (@emosbaugh). Mirantis originated k0s and provides paid enterprise support tiers. k0s is not a RISE member organization.

The license is Apache 2.0 (code) and CC-BY-SA 4.0 (documentation).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | PR / Issue |
|---|---|---|
| 2022-07-14 | Feature request filed: "RISC-V support" by jekader. Notes no Kubernetes distro supported riscv64 at the time; real hardware (low-end SBCs) emerging; containerd/Podman already functional on Debian/Ubuntu RISC-V ports. | [Issue #1919](https://github.com/k0sproject/k0s/issues/1919) |
| 2025-04-30 | First intentional riscv64 commit. PR "Various Image version bumps for riscv64" migrates four container images (pause, metrics-server, coredns, cni-node) from registry.k8s.io to quay.io/k0sproject where riscv64 builds existed. Author: @ncopa (Mirantis). | [PR #5803](https://github.com/k0sproject/k0s/pull/5803) |
| 2025-05-07 | PR #5803 merged. | [PR #5803](https://github.com/k0sproject/k0s/pull/5803) |
| 2025-05-14 | PR "Allow riscv64 build" opens. Adds Kubernetes riscv64 build patch referencing upstream k/k PRs #86011 and #116686. Skips checks for etcd and cri-o (no riscv64 upstream binaries). Reviewer @twz123 flags that Envoy (NLLB) will not compile for riscv64. Author: @ncopa (Mirantis). | [PR #5848](https://github.com/k0sproject/k0s/pull/5848) |
| 2025-05-20 | PR #5848 merged. | [PR #5848](https://github.com/k0sproject/k0s/pull/5848) |
| 2025-06-27 | Duplicate issue "Assessment of the difficulty in porting CPU architecture for k0s" filed. RAX tool rates k0s RISC-V migration complexity as "Low" (cyclomatic complexity score 9026). Closed as duplicate of #1919 by maintainers. | [Issue #6059](https://github.com/k0sproject/k0s/issues/6059) |
| 2026-03-24 | RISE announces RISE RISC-V Runners: free, native, bare-metal GitHub Actions CI on Scaleway EM-RV1 hardware for open-source projects. | [RISE blog](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) |
| 2026-04-09 | PR "ci: Add support for linux-riscv64" opens. Author: luhenry (external contributor). Adds RISE RISC-V CI runners and nightly workflow. | [PR #7414](https://github.com/k0sproject/k0s/pull/7414) |
| 2026-04-17 | Dependency PR "Make airgap list-images platform-aware" merged by @twz123. Fixes airgap image list to be target-platform-aware, enabling correct riscv64 image lists. | [PR #7459](https://github.com/k0sproject/k0s/pull/7459) |
| 2026-05-05 | CNCF approves installation of RISE RISC-V runners into the k0sproject GitHub org. | [PR #7414](https://github.com/k0sproject/k0s/pull/7414) discussion |
| 2026-05-10 | check-basic and check-airgap smoke tests confirmed passing on RISE runners. | [PR #7414](https://github.com/k0sproject/k0s/pull/7414) discussion |
| 2026-05-12 | RISE "six weeks in" blog post names k0s as near-completion integration target. | [RISE blog](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) |
| 2026-05-13 | Prerequisite PR "Split out the unittests job to a separate workflow_call file" merged by @twz123. | [PR #7606](https://github.com/k0sproject/k0s/pull/7606) |
| 2026-06-19 | PR #7414 merged by @twz123. Commit SHA: 1218cbd7ac5dd3e84b16c97d26d41085a0f0dab3. 306 of 311 CI checks passed at merge. | [PR #7414](https://github.com/k0sproject/k0s/pull/7414) |

The first intentional riscv64 commit was April 30, 2025 by Natanael Copa (@ncopa, Mirantis). The CI enablement (PR #7414) was driven by an external contributor (luhenry) over approximately 10 weeks.

---

## 3. Upstream Support Tier

k0s does not publish a formal tiering policy with numbered tiers. The implicit hierarchy from docs and CI configuration is:

| Tier | Architectures | CI on PR | Nightly CI | Pre-built Binaries | Race Tests |
|---|---|---|---|---|---|
| Full support | x86_64, aarch64 | Yes | Yes | Yes | Yes |
| Best-effort | armv7l | Partial | Yes | Yes | No |
| Experimental | riscv64 | No | Yes (nightly only, as of 2026-06-19) | No | No |

The `docs.k0sproject.io` system-requirements page listed riscv64 with the caveat "No pre-compiled binaries, no CI coverage" prior to PR #7414. The CI coverage caveat is now partially resolved: nightly CI was added. The binary release caveat remains accurate as of the latest release (v1.35.5+k0s.0, 2026-06-16).

The nightly CI is a canary, not a merge gate. No `pull_request:` trigger exists in `.github/workflows/riscv64.yml`. The workflow fires only on `workflow_dispatch` and `schedule` (cron `45 2 * * *`). riscv64 failures do not block merges.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

k0s is a pure-Go project. It contains no C source files, no assembly, no SIMD intrinsics, no JIT backend, and no `#ifdef __riscv` guards anywhere in the repository. The Go application layer is fully architecture-agnostic and requires no riscv64-specific code modifications.

Architecture-specific artifacts in the repository are limited to four items:

**`embedded-bins/kubernetes/riscv64.patch` (54 lines):**
Applied at Kubernetes build time via `embedded-bins/kubernetes/Dockerfile`. Adds `linux/riscv64` to four platform lists in Kubernetes' `hack/lib/golang.sh` (`KUBE_SUPPORTED_SERVER_PLATFORMS`, `KUBE_SUPPORTED_NODE_PLATFORMS`, `KUBE_SUPPORTED_CLIENT_PLATFORMS`, `KUBE_SUPPORTED_TEST_PLATFORMS`) and adds `riscv64` to the `host_arch` detection case statement in `hack/lib/util.sh`. This patch is necessary because upstream Kubernetes 1.36.x does not officially include riscv64 in its build platform lists.

**`internal/pkg/sysinfo/probes/linux/types_unsigned.go` (9 lines):**
Build constraint: `//go:build linux && (arm || riscv64)`. Defines `utsChar = uint8`. On riscv64 (as on 32-bit arm), `syscall.Utsname` uses `uint8` for character arrays rather than `int8`. This file provides the correct type alias for `parseUname()` to decode uname syscall results without sign-extension corruption.

**`internal/pkg/sysinfo/probes/linux/types_signed.go` (9 lines):**
Build constraint: `//go:build linux && !(arm || riscv64)`. Defines `utsChar = int8` for all other Linux targets.

**`.github/workflows/riscv64.yml`:**
Dedicated CI workflow. Discussed in Section 7.

The Makefile contains four riscv64 references: `HOST_ARCH` detection (maps `uname -m` output `riscv64`), airgap image targets (`airgap-images-linux-riscv64.txt`, `airgap-image-bundle-linux-riscv64.tar`), race detector exclusion (`ifneq (, $(filter $(HOST_ARCH), arm riscv64))`), and cleanup rules.

There is no assembly, no SIMD dispatch, no architecture-specific optimization path, and no JIT code in k0s at any level.

---

## 5. Build System, Cross-Compilation, and Toolchain

k0s uses a Make + Docker build system. There is no CMake.

**Toolchain versions (from `embedded-bins/Makefile.variables`):**

| Component | Version |
|---|---|
| Go | 1.26.4 |
| Alpine base | 3.24.1 |

CGO is disabled by default (`BUILD_GO_CGO_ENABLED = 0`). Build tags include `osusergo`. Static linking is enforced via `-extldflags=-static`. No GCC or Clang cross-compiler is required for k0s itself. Embedded component Dockerfiles install a native toolchain inside the container using the architecture-native Alpine/Debian package manager.

**Build commands:**

Standard build (all architectures including riscv64):
```
make
```

Cross-compiling for riscv64 from a non-riscv64 host:
```
GOARCH=riscv64 make
```

Airgap image bundle for riscv64 (auto-sets `TARGET_PLATFORM := linux/riscv64`):
```
make airgap-image-bundle-linux-riscv64.tar
```

Without embedded binaries (package maintainer mode):
```
make EMBEDDED_BINS_BUILDMODE=none
```

The race detector is disabled for riscv64 builds. The Makefile condition `ifneq (, $(filter $(HOST_ARCH), arm riscv64))` unsets `GO_TEST_RACE`. This is not a k0s policy choice but a Go platform limitation: Go's race detector does not support riscv64.

**QEMU usage:** None. The build system uses native riscv64 GitHub Actions runners (`ubuntu-24.04-riscv`) rather than emulation. No `--platform linux/riscv64` Docker buildx cross-build invocations exist in any CI workflow.

**Embedded component versions relevant to riscv64:**

| Component | Version in k0s |
|---|---|
| Kubernetes | 1.36.1 |
| containerd | 2.3.2 |
| runc | 1.4.3 |
| etcd | 3.7.0-rc.0 |
| kine | 0.16.2 |
| konnectivity | 0.36.0 |
| iptables | 1.8.13 |
| keepalived | 2.3.4 |
| libseccomp (for runc) | 2.6.0 |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Binary build | Yes | Yes | Yes | Nightly CI only; not in release pipeline |
| Unit tests | Yes | Yes | Yes | Race detector disabled on riscv64 |
| Smoke test: basic | Yes | Yes | Yes | Verified passing (PR #7414) |
| Smoke test: airgap | Yes | Yes | Yes | Verified passing (PR #7414) |
| Remaining 81 smoke tests | Yes | Yes | No | Not yet enabled |
| Network conformance (Calico, kube-router) | Yes | Yes | No | Blocked on sonobuoy riscv64 image |
| NLLB (Node-Local Load Balancing via Envoy) | Yes | Yes | No | Envoy has no riscv64 build; @twz123: "the last image directly used by k0s not available for RISC-V" |
| SBOM generation (syft) | Yes | Yes | No | anchore/syft lacks riscv64; upstream PR filed |
| IPv6 test image bundles | Yes | Yes | No | build-k0s.yml restricts to amd64 and arm64 |
| OS-level e2e tests (ostests) | Yes | Yes | No | No riscv64 entries in ostests-e2e.yaml or ostests-nightly.yaml |
| Release binary artifacts | Yes | Yes | No | release.yml covers amd64, arm64, arm only |
| Docker image publishing | Yes | Yes | No | riscv64 not in release Docker manifest |
| CI merge gate | Yes | Yes | No | riscv64 workflow has no pull_request trigger |

The riscv64 port covers 2 of the 83 integration test scenarios that amd64 and arm64 run.

**Real-world deployment note:** A blog post published April 20, 2026 (Bas Magre, blog.k0sproject.io) describes deploying k0s on a StarFive VisionFive2 Lite with Debian Trixie, kernel 6.19.0. Key findings: k0s binary required building from source on-device; `ETCD_UNSUPPORTED_ARCH=riscv64` environment variable was required; node reached `Ready` status with `kubernetes.io/arch=riscv64`; MetalLB required custom riscv64 image builds (`opvolger/metallb-controller:v0.15.3`, `opvolger/metallb-speaker:v0.15.3`) with FRR disabled. No performance numbers were reported in this post.

---

## 7. CI/CD Infrastructure

**Workflow file:** `.github/workflows/riscv64.yml` (merged via [PR #7414](https://github.com/k0sproject/k0s/pull/7414), June 19, 2026)

**Triggers:**
- `workflow_dispatch` (manual, with optional `smoketests` input)
- `schedule`: daily cron at 02:45 UTC (`45 2 * * *`)
- No `push` trigger. No `pull_request` trigger.

**Runner:** `ubuntu-24.04-riscv` -- self-hosted label. Per RISE project documentation, this label maps to Scaleway EM-RV1 bare-metal nodes running jobs as ephemeral Kubernetes pods. The workflow YAML does not contain the string "QEMU"; however, native hardware confirmation derives from RISE project infrastructure documentation, not from the YAML itself.

**Hardware specification (from RISE runner announcements):** Scaleway EM-RV1, TH1520 SoC. Kernel version 5.9 at time of PR #7414 development. RISE blog states transition to VMs on RVA23 hardware is planned once that hardware becomes available.

**Jobs:**
1. `build-k0s` - calls `build-k0s.yml` with `target-os: linux`, `target-arch: riscv64`
2. `build-airgap-image-bundle` - calls `build-image-bundle.yml` with `image-bundle-platform: linux-riscv64`, `runs-on: ubuntu-24.04-riscv`
3. `unittests-k0s` - calls `unittests-k0s.yml` with `runs-on: ubuntu-24.04-riscv`; runs `make check-unit` natively
4. `smoketests` - matrix over `["airgap", "basic"]`; calls `smoketest.yaml` with `arch: riscv64`

**Technical blockers encountered and resolved during PR #7414 development:**

| Issue | Root Cause | Resolution |
|---|---|---|
| overlayfs-on-overlayfs failure | RISE runners are k8s pods; k0s inside those pods attempted a second overlayfs layer. dmesg: "overlayfs: filesystem on '/var/lib/k0s/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/13/fs' not supported as upperdir" | Mount empty k8s volume at /var/lib/k0s to provide ext4-backed path |
| ip_set_hash_net module missing | Scaleway EM-RV1 kernel (5.9) does not include this module by default; required by kube-router | Manually build and load the module from Scaleway kernel sources |
| DNS CIDR conflict | kube-proxy CIDR inside k0s cluster clashed with outer k8s pod CIDR | Use hostNetwork for the pods |
| anchore/syft: no riscv64 | Upstream gap | Disable syft for riscv64; file upstream [PR anchore/syft#4757](https://github.com/anchore/syft/pull/4757) |
| replicatedhq/troubleshoot: no riscv64 | Upstream gap | File upstream [PR replicatedhq/troubleshoot#2010](https://github.com/replicatedhq/troubleshoot/pull/2010) (merged) |
| sonobuoy: no riscv64 image | Upstream gap | File upstream [PR vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049) (open at merge) |
| CNCF approval required | Policy: k0sproject org required CNCF approval before installing RISE GitHub App | Obtained May 5, 2026 |

**RISE CI statistics at time of "six weeks in" report (March 19 - May 6, 2026):** 13,000+ jobs completed across 197 unique repositories in 87 organizations, 99.78% completion rate, approximately 445 jobs/day.

---

## 8. Distribution and Release Status

**GitHub Releases:** As of v1.35.5+k0s.0 (latest as of June 16, 2026), release assets are: `k0s-v1.35.5+k0s.0-amd64`, `k0s-v1.35.5+k0s.0-amd64.exe`, `k0s-v1.35.5+k0s.0-arm`, `k0s-v1.35.5+k0s.0-arm64`, `k0s-airgap-bundle-v1.35.5+k0s.0-amd64`, `k0s-airgap-bundle-v1.35.5+k0s.0-arm`, `k0s-airgap-bundle-v1.35.5+k0s.0-arm64`. No riscv64 asset in any release. The `release.yml` workflow matrix covers amd64, arm64, and arm only.

PR #7414 (merged June 19, 2026) adds CI infrastructure but does not modify the release pipeline. No k0s release was tagged after the PR merged as of the research date.

**PyPI:** A stub package `k0s-0.0.1.tar.gz` exists at [pypi.org/project/k0s](https://pypi.org/project/k0s/). No binary wheels for any architecture. Not relevant to riscv64 deployment.

**Debian:** k0s has no Debian package. [tracker.debian.org/pkg/k0s](https://tracker.debian.org/pkg/k0s) returns HTTP 404.

**Ubuntu:** No k0s package in Ubuntu Noble. Search at packages.ubuntu.com returns only an unrelated package with a similar name prefix.

**Arch Linux RISC-V:** k0s is not present in the Arch RISC-V port repository ([archriscv.felixc.at](https://archriscv.felixc.at/)).

**Summary:** There is no riscv64 k0s binary available through any distribution channel. The only path to a riscv64 k0s binary is building from source.

---

## 9. Dependencies

The following table covers the critical embedded and runtime dependencies of k0s and their riscv64 status.

| Dependency | Role | Version in k0s | riscv64 Build | riscv64 Release Binary | riscv64 CI | Blocking Issues |
|---|---|---|---|---|---|---|
| Go toolchain | Entire k0s binary | 1.26.4 | Yes, since Go 1.14 | Official tarball `go1.26.4.linux-riscv64.tar.gz` | Secondary port (non-blocking for Go releases) | None |
| Kubernetes (kubelet, apiserver, etc.) | Core orchestration; embedded | 1.36.1 | No official build; community branch `riseproject-dev/kubernetes-riscv` exists | None | None | Upstream PRs #116686 (closed 2023) and #123661 (closed 2024); proposal #132836 open. Maintainers have not merged riscv64 support. **Hard blocker for official distribution.** |
| containerd | Container runtime (CRI); embedded | 2.3.2 | Yes; `containerd-2.3.2-linux-riscv64.tar.gz` confirmed in official release (30.3 MB) | Yes | CI PR [containerd#13124](https://github.com/containerd/containerd/pull/13124) open (1752 tests pass, awaiting 2 reviews and RISE GitHub App install in containerd org) | No official riscv64 CI yet; PR pending |
| runc | OCI container runtime; embedded | 1.4.3 (k0s embeds 1.4.3; upstream v1.5.0 available) | Yes; `runc.riscv64` present in v1.5.0 release assets | Yes (v1.5.0) | No dedicated riscv64 CI; Issue #5166 (2026-03-12) requested it, closed without linked merged PR | k0s embeds v1.4.3; upstream v1.5.0 has riscv64 binary. Static build confirmed. |
| etcd | Distributed KV store (control-plane state); embedded | 3.7.0-rc.0 | Builds with `ETCD_UNSUPPORTED_ARCH=riscv64` env var | None | None (Prow has no riscv64 nodes) | PR #15490 closed 2023-04; PR #21510 (remove arch check) closed: maintainer response "No plans." **Hard blocker for multi-node HA.** Workaround: use kine backend for single-node deployments. |
| kine (etcd shim) | Lightweight SQLite/Postgres/MySQL datastore; embedded | 0.16.2 | Yes | Yes; `kine-riscv64` and `kine-riscv64-nocgo` in v0.16.2 (released 2026-06-02) | Basic build verification | Bypasses etcd gap for single-node clusters. Multi-node HA requires etcd. |
| modernc.org/sqlite | Pure-Go SQLite used by kine | v1.52.0 | Yes | Via Go module | Listed as supported (linux/riscv64) | No issues. |
| konnectivity | Network proxy (control-plane to node); embedded | 0.36.0 | Unknown; `ALL_ARCH` in Makefile is `"amd64 arm arm64 ppc64le s390x"`, riscv64 absent | None | None | Likely buildable (pure Go) but untested and absent from release arch list. [NEEDS VERIFICATION] |
| iptables | Packet filtering (CNI dependency); embedded | 1.8.13 | Depends on Alpine riscv64 packages; Alpine supports riscv64 since 3.20 | No k0s-specific binary | None | Alpine 3.24.1 is k0s build base. Build should succeed; runtime requires kernel netfilter (Linux 5.4+ has full riscv64 netfilter). [NEEDS VERIFICATION] |
| keepalived | VRRP-based HA virtual IP; embedded | 2.3.4 | Yes; snap builds added/fixed January 2025 via PRs #2525, #2533, #2543 | riscv64 snap available since 2025; no official tarball | Via snap build infra | HA mode only. C binary. |
| helm | Kubernetes package manager (bundled) | v3.21.1 | Yes | Yes; `helm-v3.21.2-linux-riscv64.tar.gz` confirmed in release | Yes (cross-compiled Go) | No issues. |
| golang.org/x/crypto | TLS/crypto | Current | Yes (pure Go) | Via Go module | Yes | No issues. |
| kube-router | Default CNI (pod networking); embedded image | bundled | Partial; PR #1525 added riscv64 (2023-08-28), then PR #1534 partially reverted (2023-08-30) | Uncertain; no confirmed riscv64 image in recent releases | None | k0s PR #7414 comments state kube-router "already available for RISC-V" [NEEDS VERIFICATION against current image manifest] |
| Calico | Alternative CNI (optional) | bundled | No | None | None | Not a blocker if kube-router is used. |
| Envoy | L4/L7 proxy (NLLB feature) | indirect | No; Envoy issue #42787 ("arch: official support for RISC-V") marked "Not planned (skipped)" February 2026 | None | None | Blocks NLLB and network conformance test suite. @twz123 (April 2026): "the last image directly used by k0s which is not available for RISC-V." Traefik noted as potential future alternative. |
| sonobuoy | Kubernetes conformance testing | v0.57.3 | No | None | None | Upstream [PR vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049) opened 2026-05-10 by luhenry, open at time of k0s PR #7414 merge. Blocks conformance certification. |
| CoreDNS | Cluster DNS; embedded image | bundled | No official riscv64 release binary found; loong64 recently added but riscv64 absent | None | None | Pure Go; likely buildable but no official riscv64 image. Non-functional cluster DNS without it. [NEEDS VERIFICATION on current state] |
| anchore/syft | SBOM generation | indirect | No at time of k0s PR merge | None | None | Upstream [PR anchore/syft#4757](https://github.com/anchore/syft/pull/4757) filed by luhenry. Disabled for riscv64 in k0s CI. |

**Summary by category:**

- Unblocked (riscv64 binary released): Go, containerd (release exists, CI PR pending), runc (v1.5.0 has binary; k0s embeds v1.4.3), kine (v0.16.2 riscv64 released), modernc.org/sqlite, helm, golang.org/x/crypto, keepalived (snap).
- Uncertain/partial: kube-router (partially reverted; claimed working but unverified), konnectivity (pure Go, absent from release arch list), iptables (Alpine should support; unverified), CoreDNS (pure Go, no official image).
- Hard blockers: Kubernetes (no official binary; community branch only), etcd (explicit "no plans" from maintainers; multi-node HA blocked), Envoy ("not planned"), sonobuoy (PR open), syft (PR open).

---

## 10. Ecosystem Status

**RISE Project involvement:** RISE provides the free Scaleway EM-RV1 runner infrastructure used by k0s CI. This is infrastructure access, not a funded development engagement. No RISE project number (RP0XX) is associated with k0s in any public RISE blog post or documentation. RISE Premier Members include Google, NVIDIA, Qualcomm, Red Hat, SiFive, MediaTek, DAMO Academy, Tenstorrent, Andes Technology. General members include Canonical, ByteDance, SpacemiT, and others. k0s/Mirantis is not listed as a RISE member.

**Governance and merge-gate stance:** CNCF membership provided the organizational pathway for runner approval. Maintainer @twz123 acted as primary technical gatekeeper for PR #7414, requiring the CI to run as nightly rather than on every PR to avoid blocking normal development. External contributors (luhenry) were accepted to drive the integration work.

**Related projects:** k3s ([github.com/k3s-io/k3s](https://github.com/k3s-io/k3s)) is a comparable lightweight Kubernetes distribution. Its riscv64 status is outside the scope of this report.

**Quantitative k0s benchmarks available (x86 only):** The k0smotron Big Bang Benchmark ([blog.k0sproject.io/posts/k0smotron-big-bang-benchmark](https://blog.k0sproject.io/posts/k0smotron-big-bang-benchmark/)) measures hosted control plane (HCP) provisioning latency and write throughput on AWS x86. At 100 concurrent HCPs, etcd backend achieves p50 provisioning latency of 22.5s and 2920 ops/s write throughput at c1000. These numbers are not relevant to riscv64 deployment and are cited only to establish that quantitative k0s performance data exists in the public domain, just not for riscv64.

No riscv64 performance benchmarks for k0s have been published by any source.

---

## 11. Known Bugs and Active Issues

| Item | Status | Description |
|---|---|---|
| [Issue #1919](https://github.com/k0sproject/k0s/issues/1919) "RISC-V support" | Open since 2022-07-14 | Master tracking issue. Open despite PR #7414 merging -- full production-grade support with release artifacts is not yet achieved. |
| overlayfs-on-overlayfs (k0s inside k8s pod) | Resolved (PR #7414) | k0s inside a RISE runner pod (itself a k8s pod) cannot use overlayfs as upperdir. Fixed by mounting ext4-backed volume at /var/lib/k0s. |
| ip_set_hash_net kernel module missing (Scaleway EM-RV1, kernel 5.9) | Resolved (PR #7414, manual workaround) | Required for kube-router. Module not present in Scaleway's kernel image. Fixed by building from kernel sources. |
| DNS CIDR conflict in nested k0s | Resolved (PR #7414) | kube-proxy CIDR clashed with outer pod CIDR. Fixed by using hostNetwork. |
| sonobuoy: no riscv64 image | Open; upstream [PR vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049) | Blocks check-network-conformance-calico and check-network-conformance-kuberouter in k0s CI. |
| anchore/syft: no riscv64 | Open; upstream [PR anchore/syft#4757](https://github.com/anchore/syft/pull/4757) | Blocks SBOM generation. syft disabled for riscv64 in k0s CI. |
| Envoy: no riscv64 | Not planned (Envoy issue #42787 closed "Not planned," February 2026) | Blocks NLLB feature and network conformance test infrastructure. |
| etcd: no riscv64 support | Not planned (upstream maintainers: "No plans") | `ETCD_UNSUPPORTED_ARCH=riscv64` workaround required to start. Blocks multi-node HA. kine is the workaround for single-node deployments. |
| Kubernetes: no official riscv64 binary | No upstream PR open with traction | k0s maintains its own `riscv64.patch` as a workaround. No official k8s release includes riscv64. |
| CoreDNS: no official riscv64 image | Unknown upstream status | Pure Go; likely buildable but no official container image confirmed. Cluster DNS non-functional without it. [NEEDS VERIFICATION] |
| konnectivity: no riscv64 in release arch list | Unknown; no upstream issue found | `ALL_ARCH` in konnectivity Makefile does not include riscv64. [NEEDS VERIFICATION on buildability] |
| Race detector disabled on riscv64 | Permanent (Go platform limitation) | Go's race detector does not support riscv64. This is a Go limitation, not a k0s bug. |

---

## 12. Objections and Upstream Blockers

**Blocker 1 - Kubernetes (no official riscv64 binary):**
Upstream Kubernetes does not ship riscv64 binaries. k0s works around this with `embedded-bins/kubernetes/riscv64.patch`, a 7-line addition to Kubernetes' own build scripts. This patch is maintained out-of-tree by k0s. Upstream PRs #116686 (2023) and #123661 (2024) were both closed. Proposal #132836 is open but shows no merge momentum. This means k0s riscv64 users are running a community-patched Kubernetes build, not an upstream-supported binary. Any security vulnerability requiring a Kubernetes patch would require the k0s team to maintain the fix in their embedded build rather than consuming an upstream release.

**Blocker 2 - etcd (explicit "no plans" for riscv64):**
etcd maintainers have stated no plans to support riscv64. The `ETCD_UNSUPPORTED_ARCH=riscv64` workaround allows single-node startup but is not a production posture. Multi-node HA control planes require etcd. kine (SQLite or Postgres backend) provides a workaround for single-node deployments only. High-availability riscv64 clusters are not achievable with the current upstream posture.

**Blocker 3 - Envoy ("not planned"):**
Envoy issue #42787 was closed as "Not planned (skipped)" in February 2026. This blocks NLLB (Node-Local Load Balancing), which is a k0s enterprise feature. @twz123 noted in PR #7414 that Traefik is a potential future alternative, but no implementation work has been done.

**Blocker 4 - No release artifacts:**
The release pipeline (`release.yml`) does not include riscv64. Users must build from source or consume nightly CI artifacts, which are not persisted as public downloads. This is not a technical blocker but is an adoption blocker for any deployment that expects pre-built binaries.

**Blocker 5 - CI is nightly-only, not a merge gate:**
riscv64 regressions are not caught at PR time. A broken commit on main could go undetected for up to 24 hours. The full conformance test suite (83 integration tests) is not run on riscv64; only 2 are.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The current port is functionally real: the k0s binary builds on riscv64, starts a cluster, and passes basic and airgap smoke tests. A community member (Bas Magre) has demonstrated a working single-node k0s cluster on StarFive VisionFive2 hardware (blog.k0sproject.io, April 2026). The remaining functional gaps are:

- No pre-built binaries (users must build from source)
- No cluster DNS confirmed working from official images (CoreDNS riscv64 image status unverified)
- No NLLB/Envoy
- etcd workaround required (`ETCD_UNSUPPORTED_ARCH=riscv64`); multi-node HA requires etcd

The upstream Kubernetes and etcd blockers require either out-of-tree maintenance (current approach for Kubernetes) or architectural workarounds (kine for etcd in single-node mode). Resolving them upstream is a multi-quarter engagement with projects that have explicitly declined riscv64 support (etcd) or have no active upstream momentum (Kubernetes riscv64).

### 13.2 Performance Optimization

Data not available: no riscv64 performance benchmarks for k0s have been published by any source. The k0smotron Big Bang Benchmark provides x86 control-plane latency and throughput data, not riscv64 data. No riscv64 vs arm64 comparison has been published.

k0s itself is a pure-Go project with no architecture-specific optimization paths. Performance on riscv64 is determined entirely by the performance of the Go runtime on riscv64, the embedded binaries (Kubernetes, etcd/kine, containerd), and the underlying hardware. Performance optimization work at the k0s application layer is not applicable.

### 13.3 CI/CD Infrastructure

The nightly CI is in place and uses native RISE RISC-V hardware (Scaleway EM-RV1) at no cost to the project. The infrastructure is functional and has been operational since June 2026. The current gaps are:

- PR-gate CI does not exist for riscv64
- 81 of 83 integration tests are not run
- Network conformance tests blocked on sonobuoy (upstream PR open)

Adding riscv64 to the PR gate would require maintainer buy-in (unlikely until the architecture is more stable) and sufficient runner capacity from RISE.

### 13.4 Ecosystem Enablement

k0s is one of several CNCF sandbox projects adding riscv64 CI via RISE runners. The pattern -- CI enablement first, release artifacts later -- is consistent with how arm64 support was added to Kubernetes distributions. The critical path to a production-usable k0s on riscv64 runs through:

1. Upstream Kubernetes official riscv64 builds (no current traction)
2. Upstream etcd riscv64 support for multi-node HA (explicitly declined by maintainers)
3. sonobuoy riscv64 image (PR open)
4. Official k0s release pipeline inclusion

Items 1 and 2 are the highest-effort, lowest-traction blockers. Both require sustained upstream engagement with project maintainer communities that have resisted riscv64 support.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to k0s release pipeline (`release.yml`) | 1-2 | k0s maintainers (Mirantis) | High |
| Functional | Resolve CoreDNS riscv64 image availability | 2-4 | CoreDNS upstream | High |
| Functional | Resolve konnectivity riscv64 build and release | 1-2 | konnectivity upstream | Medium |
| Functional | Upstream Kubernetes riscv64 official build support | 12+ | Kubernetes SIG-Release | Critical (no current traction) |
| Functional | etcd riscv64 support for multi-node HA | 8-16 | etcd maintainers (explicitly declined) | Critical (blocked upstream) |
| Functional | Envoy riscv64 support for NLLB | 20+ | Envoy maintainers (not planned) | Low (upstream closed as not planned) |
| CI/CD | Merge sonobuoy riscv64 PR to unblock network conformance tests | 1 (reviewer time) | vmware-tanzu/sonobuoy maintainers | High |
| CI/CD | Merge syft riscv64 PR to unblock SBOM generation | 1 (reviewer time) | anchore/syft maintainers | Medium |
| CI/CD | Expand riscv64 smoke test matrix beyond basic and airgap | 4-8 | k0s maintainers + luhenry | Medium |
| CI/CD | Add riscv64 to PR gate CI | 2-4 | k0s maintainers + RISE | Low (requires runner capacity agreement) |
| Performance | Publish riscv64 vs arm64 baseline benchmarks | 2-4 | Data not available: no prior work exists | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [k0sproject/k0s GitHub repository](https://github.com/k0sproject/k0s)
- [Issue #1919 -- RISC-V support (master tracking)](https://github.com/k0sproject/k0s/issues/1919)
- [Issue #6059 -- Assessment of porting difficulty](https://github.com/k0sproject/k0s/issues/6059)
- [PR #5803 -- Various Image version bumps for riscv64](https://github.com/k0sproject/k0s/pull/5803)
- [PR #5848 -- Allow riscv64 build](https://github.com/k0sproject/k0s/pull/5848)
- [PR #7414 -- ci: Add support for linux-riscv64](https://github.com/k0sproject/k0s/pull/7414)
- [PR #7459 -- Make airgap list-images platform-aware](https://github.com/k0sproject/k0s/pull/7459)
- [PR #7606 -- Split out the unittests job to a separate workflow_call file](https://github.com/k0sproject/k0s/pull/7606)
- [Upstream PR -- anchore/syft#4757](https://github.com/anchore/syft/pull/4757)
- [Upstream PR -- replicatedhq/troubleshoot#2010](https://github.com/replicatedhq/troubleshoot/pull/2010)
- [Upstream PR -- vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [k0s real-world RISC-V deployment report (blog.k0sproject.io, 2026-04-20)](https://blog.k0sproject.io/posts/k0s-multi-arch-kubernetes-cluster/)
- [k0smotron Big Bang Benchmark (blog.k0sproject.io)](https://blog.k0sproject.io/posts/k0smotron-big-bang-benchmark/)