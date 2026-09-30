---
title: Kubernetes
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: etcd
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: optional
  - name: runc
    relation: runtime-dependency
    criticality: optional
  - name: CNI plugins
    relation: runtime-dependency
    criticality: optional
  - name: CoreDNS
    relation: runtime-dependency
    criticality: optional
  - name: CRIU
    relation: runtime-dependency
    criticality: critical
  - name: libseccomp
    relation: runtime-dependency
    criticality: optional
  - name: Ginkgo
    relation: test-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="kubernetes" %}

# Kubernetes

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kubernetes<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Kubernetes is the de facto standard container orchestration platform. It is a [CNCF](https://cncf.io/) graduated project (the highest CNCF maturity tier), operating under "Kubernetes, a Series of LF Projects, LLC" (a Linux Foundation legal umbrella; governance follows [LF Projects policies](https://lfprojects.org/policies/)). Source code is licensed Apache License 2.0; documentation/website content is CC BY 4.0. The primary repository is [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes).

Governance uses a SIG (Special Interest Group) structure. A 7-seat Steering Committee holds top decision authority (elected by contributors, ratifies major changes and new SIG charters); day-to-day technical direction is delegated to autonomous SIGs, each with chairs and OWNERS files. There is no single MAINTAINERS file and no BDFL; decisions happen via SIG consensus plus OWNERS approval, escalating to Steering only for cross-cutting or charter-level issues. Root OWNERS delegates go.mod and architecture approval to `dep-approvers` and `sig-architecture-approvers`.

Current Steering Committee members and employers:

| Member | Employer |
|---|---|
| Antonio Ojea (@aojea) | Google |
| Benjamin Elder (@BenTheElder) | Google |
| Sascha Grunert (@saschagrunert) | Red Hat |
| Rita Zhang (@ritazh) | CoreWeave |
| Paco Xu (@pacoxu) | DaoCloud |
| Maciej Szulik (@soltysh) | Defense Unicorns |
| Kat Cosgrove (@katcosgrove) | Minimus, per one source; VillageSQL (independent), per a second source [NEEDS VERIFICATION, conflicting sources] |

Top recent corporate contributors, sampled from the latest ~30 commits to `kubernetes/kubernetes` as of September 2026: Davanum Srinivas (dims, Red Hat), Jordan Liggitt (liggitt, Google), Tim Hockin (thockin, Google), Marek Siarkowicz (serathius, Google), Lucas Kaldstrom (luxas, Amazon), Stephen Kitt (skitt, Red Hat), jubittajohn (Red Hat). This is broadly consistent with the CNCF governing board composition, whose Kubernetes-linked seats span Red Hat, Google, Microsoft, Apple, NVIDIA, AWS and others.

**Community stance on new architecture ports is cautious but organically interested.** Issue [#132570](https://github.com/kubernetes/kubernetes/issues/132570) ("Assessment of the difficulty in porting CPU architecture for kubernetes," an unsolicited automated porting-complexity pitch, opened 2025-06-27) was closed and tagged `priority/awaiting-more-evidence`, a skeptical default response to low-effort porting pitches. Issue [#132836](https://github.com/kubernetes/kubernetes/issues/132836) ("Proposal: Official Support for RISC-V Architecture and RVA23 Advancements in Kubernetes Releases," opened 2025-07-09) is a substantive, still-open proposal labeled `sig/testing`, `sig/release`, `sig/architecture`, `sig/k8s-infra`, `needs-triage`. One research pass reported this issue carries 26 comments and 12 "rocket" reactions; a separate direct read of the issue in the same research round reported no comments visible. This is a direct contradiction in the source material and is marked [NEEDS VERIFICATION].

**RISE Project membership:** Kubernetes and CNCF are not listed as RISE Project members (checked against [riseproject.dev/members](https://riseproject.dev/members/)). RISE Premier members are Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive and Tenstorrent; General members include Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT and ZTE. Despite non-membership, ZTE (a RISE General member) has directly engaged Kubernetes riscv64 enablement through [riseproject-dev/kubernetes-riscv#2](https://github.com/riseproject-dev/kubernetes-riscv/issues/2) (see Section 12).

---

## 2. Port History and Upstreaming Timeline

The RISC-V porting effort in Kubernetes began in September 2019 with Carlos de Paula (carlosedp), who independently drove early cloud-native RISC-V work. No effort predates him in this repository. Four upstream PR attempts have been made to add riscv64 build/platform support; three were closed unmerged, one remains open on hold. Exactly one riscv64-motivated PR has ever merged.

| Date | Event | Author | Outcome |
|---|---|---|---|
| 2019-09-04 | [PR #82349](https://github.com/kubernetes/kubernetes/pull/82349), bump x/sys and runc deps for riscv64 buildability | carlosedp | Closed unmerged 2019-12-06; superseded by other dependency bumps |
| 2019-12-06 | [PR #86011](https://github.com/kubernetes/kubernetes/pull/86011), add riscv64 to build scripts | carlosedp | All core binaries (kube-apiserver, kubelet, kubectl, etc.) demonstrated compiling for riscv64 via `KUBE_BUILD_PLATFORMS=linux/riscv64`. Closed by @cblecker (no architecture-addition policy/KEP existed); reopened by @dims August 2020; auto-closed stale 2021-01-10. Never merged |
| 2019-12-06 to 2019-12-20 | [PR #86013](https://github.com/kubernetes/kubernetes/pull/86013), bump Ginkgo to support riscv64 build | carlosedp | **Merged** 2019-12-20 (commit `4ff6928`), shipped in v1.18.0 (released 2020-03-25). The only riscv64-motivated merge into Kubernetes core to date |
| 2023-03-16 | [PR #116686](https://github.com/kubernetes/kubernetes/pull/116686), "feat: add riscv64 support" | ernado | Closed by author 2023-04-21, citing missing riscv64 distroless image, etcd image and Kubernetes base images; estimated readiness Q4 2023 to 2025. A March 2026 follow-up comment on the same PR confirms the distroless and base-image blockers materialized, roughly on the author's original schedule |
| 2024-03-04 | [PR #123661](https://github.com/kubernetes/kubernetes/pull/123661), "Add riscv64 support" | JasenChao | Closed by @dims 2024-05-22. Reviewer @liggitt stated builds succeeding is not sufficient: "we need a good set of tests that exercise a wide battery of jobs in this new architecture," citing the same blocker that stalled #86011 and #116686 |
| 2025-06-27 to 2025-07-10 | [Issue #132570](https://github.com/kubernetes/kubernetes/issues/132570), automated RISC-V porting-difficulty assessment ("RAX" tool: 8,714 architecture-specific LOC, cyclomatic complexity 569,001, rated "low" difficulty) | carlosqwqqwq | Closed, tagged `priority/awaiting-more-evidence`, no substantive maintainer follow-up |
| 2025-07-09 | [Issue #132836](https://github.com/kubernetes/kubernetes/issues/132836), master tracking proposal for official RISC-V/RVA23 support | yu8833 | Open. Still the current umbrella issue as of 2026-09-30; last updated 2026-08-28 |
| 2026-07-20 | [riseproject-dev/kubernetes-riscv#2](https://github.com/riseproject-dev/kubernetes-riscv/issues/2), "Proposal: Joint collaboration to advance official RISC-V Tier 2 support for Kubernetes and etcd" | Weihong Qiu (ZTE Corporation) | Open. Identifies insufficient CI hardware and a shortage of maintainers as the concrete blockers; ZTE offers to donate physical RISC-V CI servers |
| 2026-08-10 | [PR #141291](https://github.com/kubernetes/kubernetes/pull/141291), "Add RISC-V build for the pause image" | chazapis | Open. A minimal, build-config-only, single-file change (no source changes) adding riscv64 to `build/pause/Makefile`. Placed `/hold` by @dims, referencing the unresolved policy discussion in #132836. Depends on a companion kube-cross container change, [kubernetes/release#4489](https://github.com/kubernetes/release/pull/4489) (status not stated in available sources) |
| 2026-09-18 | [kubernetes/sig-release#3107](https://github.com/kubernetes/sig-release/issues/3107), "Tier3 Platform Support Request for RISC-V" | RISE Project | Open. States mandatory Tier 3 requirements are already satisfied and artifacts are released; long-term goal is Tier 2 after two release cycles |
| 2026-09-21 | [kubernetes/sig-release PR #3110](https://github.com/kubernetes/sig-release/pull/3110), "add riscv64 as a tier 3 platform" | upodroid | Open. Small diff (10-29 lines) implementing #3107/#132836; received positive maintainer reactions; auto-assigned to release-engineering approvers |
| 2026-09-28 | [RISE blog post on Kairos and RISC-V productization](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/) | RISE Project (Ashleigh Bustamante, Google) | Not a kubernetes/kubernetes event, but documents lightweight Kubernetes (k3s) successfully booting on riscv64 under the CNCF Sandbox project Kairos |

**Net position:** exactly one merged PR touches riscv64 in the repository's history (#86013, a Ginkgo test-framework dependency bump), and it does not add riscv64 as a supported build or release platform. No PR adding actual riscv64 build or release support has ever merged. A commit-message search of the default branch for "riscv" returns zero results, confirming no riscv64-labeled commit has landed via that path.

---

## 3. Upstream Support Tier

Historically, Kubernetes had no formal Tier 1/2/3 platform classification (unlike, e.g., Node.js or Rust); architecture support was defined de facto by (a) inclusion in the `KUBE_SUPPORTED_*_PLATFORMS` arrays in `hack/lib/golang.sh`, and (b) CI/test-infra coverage and official release-artifact publishing controlled jointly by SIG Release, SIG Architecture and SIG K8s-Infra.

That is changing: [kubernetes/sig-release PR #2974](https://github.com/kubernetes/sig-release/pull/2974) (merged 2026-03-26) formally rewrote the platform-support-tier policy, and as of September 2026 there is an active, concrete Tier 3 request specifically for riscv64:

- [kubernetes/sig-release#3107](https://github.com/kubernetes/sig-release/issues/3107) (open, 2026-09-18, filed by the RISE Project) asserts all mandatory Tier 3 requirements are already met.
- [kubernetes/sig-release PR #3110](https://github.com/kubernetes/sig-release/pull/3110) (open, 2026-09-21, upodroid) is the implementing change, referencing #3107 and #132836, currently pending review.

No platform is currently formally designated Tier 3; #3107/#3110 would be the first such designation under the revised policy.

| Platform | Official binaries | Release-blocking CI | Documentation | Status as of 2026-09-30 |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes | Full (listed in all `KUBE_SUPPORTED_*` arrays) |
| arm64 | Yes | Yes | Yes | Full (listed in all `KUBE_SUPPORTED_*` arrays) |
| ppc64le / s390x | Yes | Yes | Yes | Full (listed in server/node/client/test arrays) |
| riscv64 | No | No | No | Not listed in any `KUBE_SUPPORTED_*` array; Tier 3 designation proposed but not merged (sig-release#3107/#3110, open) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kubernetes is written in pure Go. It has no JIT backends, no SIMD dispatch, no hand-written assembly, and no CPU-feature-gated code paths in first-party source for any architecture, including amd64 and arm64. There is nothing analogous to a JIT, hand-tuned intrinsics, or scalar-fallback dispatch to grade on a full/partial/scalar/missing scale, because that category of code does not exist in this repository for any platform.

**First-party riscv64 files: zero, confirmed independently twice.** An exhaustive repository-wide code search (`riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, `GOARCH=riscv64`, `path:arch/riscv`) across `pkg/`, `cmd/`, `staging/`, `build/`, `hack/`, `test/`, `api/`, `cluster/` found no `//go:build riscv64` constraints, no architecture-specific build tags, and no C preprocessor guards. The only non-empty hit is one source comment in `staging/src/k8s.io/dynamic-resource-allocation/deviceattribute/numa_linux.go`: "Linux defines MAX_NUMNODES ... capped at 10 across all architectures (x86, arm64, riscv)" - a generic comment, not architecture-specific logic. Two additional "rvv"/"RVV" string matches in `handler_proxy_test.go` and a test certificate file are coincidental substring hits inside base64-encoded test material, unrelated to the RISC-V Vector extension.

**Vendor tree: approximately 24 riscv64 files, all upstream pass-throughs, not Kubernetes-authored.** These arrived incidentally via dependency version bumps:

| Vendor package | File count | Content |
|---|---|---|
| `golang.org/x/sys/unix` | ~19 | Auto-generated Linux/BSD syscall tables, ABI type definitions, assembly trampolines |
| `golang.org/x/sys/cpu` | 3 | CPU feature detection: HasV (RVV), HasC, Zba, Zbb, Zbs, Zbc, Zvbb, Zvbc, Zvkb, Zvkg, Zvkt, Zvkn/c/g, Zvks/c/g |
| `go.etcd.io/bbolt` | 1 | `MaxMapSize=256TB` constant for riscv64 |
| `github.com/prometheus/procfs` | 1 | `/proc/cpuinfo` parser dispatch for riscv/riscv64 |

For comparison, the vendor tree contains roughly 53 amd64-specific files and 51 arm64-specific files; riscv64 vendor coverage is incomplete relative to arm64, covering syscall bindings and CPU detection but lacking architecture-specific netlink, seccomp and eBPF bindings. None of these vector/crypto extension detections (Zvkn, Zvks, etc.) are used by any Kubernetes code path; they exist only because `x/sys` ships them as part of its own portability work.

A `third_party/multiarch/qemu-user-static/register/qemu-binfmt-conf.sh` file lists ELF magic-number/mask pairs for many architectures including riscv32/riscv64, for generic `binfmt_misc` multi-arch container emulation. This is a vendored copy of an upstream QEMU script, not Kubernetes-authored code, and contains no Kubernetes build instructions.

| Component | amd64 | arm64 | riscv64 | Rating basis |
|---|---|---|---|---|
| Core language runtime | Full | Full | Full (Go GOARCH=riscv64, first-class since ~Go 1.22) | Inherited from Go toolchain, not Kubernetes code |
| Architecture-specific source (JIT/SIMD/asm) | None | None | None | No such code exists in this repo for any platform |
| Vendored syscall/CPU-feature bindings | Full | Full | Partial (syscalls + CPU detection present; netlink/seccomp/eBPF bindings for riscv64 not confirmed) | Vendor-tree file count comparison |

---

## 5. Build System, Cross-Compilation, and Toolchain

Kubernetes uses Go's native cross-compilation, invoked through shell scripts and a Docker-based "kube-cross" build container. There is no CMake and no Bazel (removed in v1.21); confirmed by an exhaustive search finding zero `CMakeLists.txt` files, no `cmake/` directory, and no `BUILDING.md`/cross-compilation documentation anywhere in the repository.

**Standard build invocation:**

```
make WHAT=./cmd/<binary> KUBE_BUILD_PLATFORMS=linux/riscv64
```

Output lands in `_output/local/bin/linux/riscv64/`. This invocation succeeds with an unmodified Go toolchain, because Go has supported `GOARCH=riscv64` natively since Go 1.14; the build scripts do not block on architecture for local/dev builds, only for release builds via the supported-platform arrays.

**Platform lists in `hack/lib/golang.sh` (authoritative, confirmed current as of this report):**

```
KUBE_SUPPORTED_SERVER_PLATFORMS:  linux/amd64 linux/arm64 linux/s390x linux/ppc64le
KUBE_SUPPORTED_NODE_PLATFORMS:    linux/amd64 linux/arm64 linux/s390x linux/ppc64le windows/amd64
KUBE_SUPPORTED_CLIENT_PLATFORMS:  linux/amd64 linux/386 linux/arm linux/arm64 linux/s390x linux/ppc64le
                                   darwin/amd64 darwin/arm64 windows/amd64 windows/386 windows/arm64
KUBE_SUPPORTED_TEST_PLATFORMS:    linux/amd64 linux/arm64 linux/s390x linux/ppc64le
                                   darwin/amd64 darwin/arm64 windows/amd64 windows/arm64
```

`linux/riscv64` is absent from all four arrays.

**Cross-compiler assignments (`hack/lib/golang.sh kube::golang::set_platform_envs()`):** explicit CC entries exist for amd64, arm64, arm, ppc64le and s390x; there is no `linux/riscv64` entry. A generic fallback derives the CC environment variable name from the platform string, so setting `KUBE_LINUX_RISCV64_CC=riscv64-linux-gnu-gcc` externally would wire CGO correctly for riscv64 without a code change to this specific mechanism.

**kube-cross build container image (official cross-compilation environment):**

- Image: `registry.k8s.io/build-image/kube-cross`
- Current pinned version: `v1.38.0-go1.27.1-bullseye.0` (confirmed via live fetch of `.go-version` and the cross-build image VERSION file), a Debian Bullseye base.
- `KUBE_CROSSPLATFORMS`: `linux/386 linux/arm linux/arm64 linux/ppc64le linux/s390x darwin/amd64 windows/amd64 windows/386`. No riscv64 cross-toolchain package (e.g., `gcc-riscv64-linux-gnu` or `crossbuild-essential-riscv64`) is installed.
- [kubernetes/release PR #4303](https://github.com/kubernetes/release/pull/4303) ("add debian trixie and riscv64 support for debian-base"), opened 2026-03-02 by @Opvolger, was placed on hold by @BenTheElder citing lack of CI resources, and was closed without merging.
- A newer, currently referenced companion change is [kubernetes/release#4489](https://github.com/kubernetes/release/pull/4489), cited by PR #141291 as the required kube-cross update to add a RISC-V cross-compiler; its current status is not stated in available sources [NEEDS VERIFICATION].

**Pause container build (`build/pause/Makefile`):** confirmed current content on the default branch reads `ALL_ARCH.linux = amd64 arm64 ppc64le s390x`; riscv64 is absent. PR #141291 is a minimal, single-file, four-line diff adding `riscv64` to this array, a `TRIPLE.linux-riscv64 := riscv64-linux-gnu` cross-compile mapping, and two buildx flags. No new source code is introduced. It remains blocked on the kube-cross toolchain update above and is under a maintainer `/hold`.

**QEMU emulation:** PR #116686 (closed, unmerged) had proposed adding `["riscv64"]="riscv64"` to the `QEMUARCHS` map in `test/images/image-util.sh`; this has not landed. A vendored, generic `qemu-user-static` binfmt script (Section 4) already lists riscv64 ELF magic bytes for generic multi-arch emulation, independent of this specific Kubernetes integration point.

**Go toolchain version:** current minimum enforced is 1.27.1 (per `.go-version`). Go has supported `GOARCH=riscv64` since Go 1.14 and promoted it toward first-class status by Go 1.22+. The Go toolchain itself is not a blocker to building Kubernetes for riscv64.

**Items required to add riscv64 as a supported build platform (per PR #116686's own enumeration, largely still applicable):**

1. `hack/lib/golang.sh`, add `linux/riscv64` to the four `KUBE_SUPPORTED_*_PLATFORMS` arrays
2. `build/pause/Makefile`, add riscv64 (in progress via open PR #141291)
3. `cluster/images/etcd/Makefile`, add riscv64 and a riscv64 base image
4. `hack/lib/util.sh`, add a `riscv64*) host_arch=riscv64 ;;` case
5. `test/images/image-util.sh`, add `riscv64` to `QEMUARCHS`
6. `test/typecheck/main.go`, add `linux/riscv64` to the typecheck platform list
7. `kubernetes/release` kube-cross Dockerfile, install a riscv64 cross-compiler and add `linux/riscv64` to `KUBE_CROSSPLATFORMS` (tracked by release#4489)

The code changes required are small and mechanical. The persistent blocking constraint, across every rejected attempt since 2019, is CI infrastructure and organizational policy, not code complexity (see Sections 7 and 12).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| kube-apiserver, kube-scheduler, kube-controller-manager, kube-proxy, kubelet | Official binary | Official binary | No official binary | Release gap |
| kubectl (client) | Official binary | Official binary | No official upstream binary; patched Debian sid build only (client-only) | Release gap |
| pause container image | Official (registry.k8s.io) | Official | No official image; open PR #141291 pending | Image gap |
| kube-cross build image | Full toolchain | Full toolchain | No riscv64 toolchain installed | Build infrastructure gap |
| Container images (registry.k8s.io) | All SIG images | All SIG images | None | Image gap |
| CI coverage | Full, release-blocking | Full, release-blocking | None confirmed (no GitHub Actions workflows exist in this repo at all; Prow coverage in kubernetes/test-infra not independently checked this round) | CI gap |
| Pod live migration / checkpoint-restore (CRIU) | Supported (via containerd) | Supported | Unavailable, CRIU has no riscv64 implementation | Feature gap |
| kubeadm preflight checks | Pass | Pass | Reported failures requiring `--ignore-preflight-errors` on a v1.16-era community deployment [NEEDS VERIFICATION, single community source, version outdated] | Compatibility gap |
| iptables / nftables | nftables default | nftables default | Legacy iptables reportedly required on a v1.16-era community deployment [NEEDS VERIFICATION, single community source, version outdated] | Kernel feature gap |

**Performance gap evidence (new this cycle):** the only rigorous, peer-reviewed benchmark of Kubernetes-adjacent orchestration on RISC-V found is Lumpp, Barchi, Acquaviva and Bombieri, "On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing," ESAAM 2023 ([ACM DL](https://dl.acm.org/doi/fullHtml/10.1145/3624486.3624490), [PDF](https://cris.unibo.it/retrieve/976f8d03-98e3-4565-b2c4-a921e6561322/3624486.3624490.pdf)). This paper does not test vanilla kubernetes/kubernetes; it tests a custom-built fork called **KubeEdge-V** (KubeEdge ported to RISC-V) on a SiFive HiFive Unmatched board (4x U74 cores at 1GHz, part of the "Monte Cimone" cluster), compared against a power-matched NVIDIA Jetson Xavier AGX (ARM64, throttled to 4 cores at 1.2GHz). Results:

- Sysbench (CPU, 1M primes, 4 threads): RISC-V native 2.47 event/s to KubeEdge 2.46 event/s (-0.4% overhead); ARM64 native 6.40 to KubeEdge 6.17 (-3.7% overhead).
- STREAM memory bandwidth: average orchestration overhead was +0.4% on RISC-V vs -3.8% on ARM64 (absolute bandwidth remains far lower on RISC-V, roughly 30 GB/s theoretical max dual-channel DDR4-1866 64-bit bus vs roughly 86 GB/s on the Jetson's LPDDR4x-1333 256-bit bus).
- Phoronix test suite (Rodinia/LavaMD, x265, 7-Zip, POV-Ray, OpenSSL): average overhead -1.9% on RISC-V vs -3.1% on ARM64.
- OSBench/IPC-Benchmark/stress-ng (OS-level): average overhead -5.4% on RISC-V vs -2.9% on ARM64, with a notable outlier: **a 21.4% context-switch performance loss on RISC-V under KubeEdge vs only 0.26% on ARM64**, traced via `perf` to container-runtime syscall interception adding up to 40% extra syscall time (syscall time: native 192.18ns, manual namespaces/cgroups 191.72ns, KubeEdge 206.48ns).
- Memory footprint: KubeEdge plus EdgeMesh plus CRI-O used roughly 250MB system memory on the RISC-V board; per-container overhead ranged from 1.4MB at 4 containers to 1.9MB at 64 containers (122.52MB total overhead at 64 containers).

The paper's conclusion: containerization/orchestration overhead on RISC-V is comparable to, and in several application-level benchmarks smaller than, ARM64; OS-level process/thread/context-switch operations suffer disproportionately due to an unoptimized container-runtime syscall-interception path, and the roughly 250MB memory footprint is a real constraint on memory-limited edge boards. This is a substantive, citable data point but is scoped to a research fork (KubeEdge-V) on 2023-era, low-power RISC-V hardware, not to kubernetes/kubernetes itself or to current-generation RISC-V server silicon. No other quantitative, independently verifiable riscv64-vs-arm64/amd64 Kubernetes benchmark was found; a secondary MDPI paper reference ("Evaluating ARM and RISC-V Architectures for HPC with Docker and Kubernetes") could not be fetched (HTTP 403) and its figures are cited only via search-engine summary, not verified against the source PDF [NEEDS VERIFICATION].

---

## 7. CI/CD Infrastructure

**Official riscv64 CI coverage: zero, and confirmed in an adversarial verification pass this cycle.**

Direct inspection of the `.github` directory on the default branch (`github.com/kubernetes/kubernetes/tree/master/.github`) shows only `ISSUE_TEMPLATE/`, `OWNERS`, `PULL_REQUEST_TEMPLATE.md` and `SECURITY.md`; there is no `workflows/` subdirectory at all. Kubernetes has **no GitHub Actions CI of any kind** in this repository, riscv64 or otherwise; confirmed independently via the repository's Actions tab, which lists only GitHub's own auto-injected default workflows (Copilot, Copilot code review, Dependency Graph). GitHub code search scoped to `repo:kubernetes/kubernetes` for `riscv64` returns 0 results repo-wide, and for `riscv` returns exactly 1 result (the NUMA comment noted in Section 4); neither is CI-related.

Kubernetes' actual pre-submit/post-submit CI runs on **Prow**, configured in the separate `kubernetes/test-infra` repository, which could not be directly inspected this cycle (GitHub MCP access was scoped to `riseproject-dev/sw-ecosystem` only, and `kubernetes/test-infra` was out of scope for the checks performed). Given PR #123661 was explicitly rejected by @liggitt for lacking "a wide battery of CI jobs," and no tracking issue or PR in the available evidence claims a Prow job for riscv64 was ever merged, there is no basis in the available evidence to believe such a job exists, but `kubernetes/test-infra` itself was not directly re-checked this round.

**RISE RISC-V Runners:** the RISE Project announced a free, native RISC-V GitHub Actions runner service in March 2026 (Scaleway EM-RV1 bare-metal hardware). It is used internally by the RISE Project's own infrastructure (a Kubernetes device plugin schedules CI jobs onto RISC-V worker nodes) and by CNCF-adjacent projects including k0s (nightly RISC-V builds pending per k0sproject/k0s#7414, referenced in the Kairos blog post as k0s issue 1919) and Kairos (via kairos-init and hadron, both building and testing continuously on RISE runners). As of the most recent check, no Kubernetes upstream (kubernetes/kubernetes) CI job uses the RISE runners.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions workflows in kubernetes/kubernetes | None (repo has no GHA workflows for any platform) | None | None |
| Prow (kubernetes/test-infra) | Full, release-blocking | Full, release-blocking | Not confirmed present; not directly re-checked this cycle |
| Free native CI hardware available via RISE | N/A | N/A | Yes (RISE RISC-V Runners), not yet integrated with Kubernetes upstream Prow |

---

## 8. Distribution and Release Status

**Canonical release binaries (dl.k8s.io):** directly verified this cycle. `https://dl.k8s.io/v1.37.1/bin/linux/riscv64/kubectl` returns **HTTP 404 Not Found**. A control check of the same release for a supported architecture, `https://dl.k8s.io/v1.37.1/bin/linux/amd64/kubectl`, resolves to a real binary object (the fetch tool's own size cap was the only failure mode, confirming the URL pattern is valid and serves real content for amd64). This is a direct, positive confirmation of absence, not a missing-URL artifact.

CHANGELOG download tables for v1.36, v1.35 and v1.34 (checked against v1.36.2, v1.35.6, v1.34.9 per the readiness grade below) list supported client architectures as linux-386/amd64/arm/arm64/ppc64le/s390x, darwin-amd64/arm64, windows-386/amd64/arm64; server as linux-amd64/arm64/ppc64le/s390x; node as linux-amd64/arm64/ppc64le/s390x plus windows-amd64. riscv64 is absent from every category in every checked release.

**GitHub Releases:** recent releases (v1.38.0-alpha.1, v1.37.1, v1.36.5, v1.35.9, v1.34.12) each show only "Assets 2," the standard GitHub auto-generated source `.zip`/`.tar.gz`, not platform binaries for any architecture, because dl.k8s.io is the canonical binary distribution channel. This is expected behavior and not specific evidence against riscv64, but it confirms GitHub Releases cannot be used to find riscv64 artifacts either.

**Container images (registry.k8s.io):** all official Kubernetes component images (kube-apiserver, kube-scheduler, kube-controller-manager, kube-proxy, pause, etc.) are published for amd64, arm64, ppc64le and s390x. No riscv64 manifests exist in the official registry.

**Debian Unstable (sid):** the `kubectl` binary (v1.33.4+ds-1 per prior verification) is listed as built on riscv64 at [buildd.debian.org](https://buildd.debian.org/status/package.php?p=kubernetes). This is a patched, Debian-source-repackaged (`+ds` suffix) cross-compilation, not an upstream Kubernetes release artifact, and it produces only `kubectl`, `kubernetes-client` and `golang-k8s-kubectl-dev`, not server-side components (kube-apiserver, kubelet, etc.). This is the specific artifact underlying the readiness grade's "patched, not clean" distro distinction (Section 13).

**Ubuntu archive:** a direct check against Ubuntu 26.04 ("resolute") via `packages.ubuntu.com` found 7 matching packages containing "kubernetes" in the name, none named plainly `kubernetes` or `libkubernetes`:

| Package | Version | Arches |
|---|---|---|
| golang-github-kubernetes-cri-api-dev | - | all |
| golang-github-kubernetes-gengo-dev | - | all |
| golang-github-kubernetes-kubelet-dev | - | all |
| golang-github-ovn-kubernetes-libovsdb-dev | - | all |
| kubernetes-split-yaml | 0.4.0-1build2 | amd64, arm64, armhf, ppc64el, **riscv64**, s390x |
| python3-kubernetes | 30.1.0-3 | all (architecture-independent) |
| rsyslog-kubernetes | 8.2512.0-1 | amd64, arm64, armhf, ppc64el, **riscv64**, s390x |

A separate, independent check against the authoritative Ubuntu archive database (Launchpad, used because `packages.ubuntu.com` returned HTTP 503 on repeated attempts) found that the literal `kubernetes` source package has **no current release in resolute at all** ("There is no current release of this source package in The Resolute Raccoon"); its broader history shows a stale stub frozen at version "1.0," last touched in 2019 (Focal), 2021 (Jammy) and 2023 (Noble), unrelated in substance to real upstream Kubernetes 1.3x and never published for resolute on any architecture. This corrects and supersedes the notion of a meaningful `kubernetes` package existing in current Ubuntu releases: the only real, current riscv64-relevant Ubuntu artifacts are `kubernetes-split-yaml` and `rsyslog-kubernetes` (both minor utilities, both built for riscv64), plus `python3-kubernetes` (architecture-independent).

**PyPI (Python client library, not the orchestrator):** current version 36.0.3, shipped only as `py3-none-any` wheels and a source tarball, architecture-independent by design; this was cross-checked across 200+ historical release files (0.0.0a2 to 37.0.0b1) with zero riscv64-specific files found, consistent with pure-Python packaging needing none. The RISE GitLab wheel-builder project (`gitlab.com/.../packages/pypi/simple/kubernetes/`) returns an HTTP 302 redirect to real PyPI, confirming no custom riscv64 build was needed or registered.

**Arch Linux RISC-V:** `kubernetes-control-plane-common-1.35.4-1-riscv64.pkg.tar.zst` and `python-kubernetes-33.1.0-1-any.pkg.tar.zst` were previously reported as available; this could not be re-verified this cycle (the archriscv.felixc.at package search did not return usable results via automated fetch). [NEEDS VERIFICATION, single source, unconfirmed this cycle]

**Snap Store:** the `kubectl` snap's architecture list could not be checked this cycle (API endpoint requires a header the fetch tool could not set). [NEEDS VERIFICATION]

**Community/third-party builds (all non-upstream):**

- [go-riscv/kind](https://github.com/go-riscv/kind), community riscv64 builds of kind, kubectl, kubeadm, k9s
- [CARV-ICS-FORTH/kubernetes-riscv64](https://github.com/CARV-ICS-FORTH/kubernetes-riscv64), a k3s-based riscv64 port, 35 stars, last updated 2026-08-26, funded via the EU RISER, AERO and REBECCA/Chips JU programs
- [alitariq4589/kubernetes-riscv](https://github.com/alitariq4589/kubernetes-riscv/releases), periodic upstream-tag tracking releases
- [portainer/kubesolo](https://github.com/portainer/kubesolo), a lightweight Kubernetes distribution with riscv64 support
- [carlosedp/riscv-bringup](https://github.com/carlosedp/riscv-bringup), a guide for running Kubernetes/K3s on RISC-V
- Kairos (CNCF Sandbox), publishing bootable riscv64 ISOs and a raw OCI disk image (`quay.io/mauromorales/kairos-riscv64:0.1.3-img`) that boots k3s on riscv64, per the RISE blog post of 2026-09-28
- The `riseproject-dev` GitHub org's `kubernetes-riscv` repository, the current home of RISE/community riscv64 enablement discussion (issue #2, Section 2 and 12)

**Bottom line for a user wanting a working riscv64 binary:** no official upstream path exists. The only client-only option close to upstream fidelity is the patched Debian sid `kubectl` build. A functioning cluster requires assembling community forks (CARV-ICS-FORTH's k3s port, Kairos's k3s-based images, or similar), none of which are official Kubernetes releases.

---

## 9. Dependencies

The following table covers the ten direct dependencies in scope for this report, plus additional indirect dependencies surfaced during research.

| Dependency | Relation | Criticality | Role | riscv64 Build | riscv64 CI/Test | riscv64 Release/Artifacts | Blocking Issues |
|---|---|---|---|---|---|---|---|
| Go | build-dependency | critical | Compiler and runtime for all Kubernetes binaries | Yes, GOARCH=riscv64 supported since Go 1.14, first-class port since roughly Go 1.22 | Covered by Go's own upstream CI | Shipped with every Go toolchain release | None |
| etcd | runtime-dependency | critical | Control-plane key-value store | Yes, `ETCD_UNSUPPORTED_ARCH` workaround removed via [PR #21510](https://github.com/etcd-io/etcd/pull/21510) (merged 2026-03-29) | No riscv64 CI found | No, absent from all release assets v3.4 through v3.7-rc | Hard blocker: no official release binaries despite build support |
| containerd | runtime-dependency | optional | Default CRI (container runtime) backend | Yes | No dedicated riscv64 integration tests confirmed (issues #13020, #13124, carried from prior research, not re-verified live this cycle) | Yes, v2.3.2 ships `containerd-2.3.2-linux-riscv64.tar.gz` | CI gap; CRIU checkpoint unsupported on riscv64 |
| runc | runtime-dependency | optional | OCI low-level container execution runtime | Yes | CI reportedly includes riscv64 ([opencontainers/runc PR #5166](https://github.com/opencontainers/runc/pull/5166), merged; not re-verified live this cycle) | Yes, v1.5.0 ships `runc.riscv64` | #3950 open: musl static build broken on riscv64 |
| CNI plugins | runtime-dependency | optional | Pod networking (bridge, loopback, host-local, portmap) | Yes | No dedicated riscv64 CI visible | Yes, v1.9.1 ships `cni-plugins-linux-riscv64-v1.9.1.tgz` | None found |
| CoreDNS | runtime-dependency | optional | Cluster DNS | Yes | No dedicated riscv64 CI visible | Yes, v1.14.4 ships `coredns_1.14.4_linux_riscv64.tgz` | None found |
| CRIU | runtime-dependency | critical | Pod live migration and checkpoint-restore | No | N/A | No | [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2021, confirmed still open (last updated 2023-06-27, effectively stale); RISC-V not implemented |
| libseccomp | runtime-dependency | optional | Syscall filtering for seccomp profiles | Yes (v2.5.x+) | Tested in CI | Released | #327 open: riscv32 unsupported, does not affect riscv64 |
| Ginkgo | test-dependency | critical | Go BDD test framework used for Kubernetes e2e/unit test suites | Yes, enabled specifically via [PR #86013](https://github.com/kubernetes/kubernetes/pull/86013), merged 2019-12-20, the only riscv64-motivated merge into kubernetes/kubernetes core, shipped in v1.18.0 (2020-03-25) | Not independently exercised on riscv64 hardware for kubernetes/kubernetes, since no riscv64 CI runners exist for the project itself | N/A, test-only dependency, not a shipped artifact | None beyond the general absence of riscv64 CI |
| GCC | build-dependency | critical | C cross-compiler needed for CGO-linked components (notably the pause image) inside the kube-cross build image | GCC itself has mature, long-standing upstream riscv64 support, but the specific `riscv64-linux-gnu-gcc` package is absent from Kubernetes' kube-cross image | N/A within kube-cross | kube-cross image does not currently ship a riscv64 cross-toolchain | [kubernetes/release#4489](https://github.com/kubernetes/release/pull/4489) (status not stated in available sources) is the current open item, referenced as a dependency of PR #141291; a prior attempt [kubernetes/release#4303](https://github.com/kubernetes/release/pull/4303) was closed on hold over CI resource cost |
| distroless base images (indirect, via etcd/pause/component base images) | indirect runtime-dependency | critical (historical blocker) | Minimal base images for Kubernetes component containers | Yes, distroless-debian13 (static, base, cc) riscv64 images merged February 2026 | N/A | Available for riscv64 | Historical blocker resolved; corroborated by a March 2026 follow-up comment on PR #116686 |
| kube-cross build image (indirect, via GCC/toolchain) | indirect build-dependency | critical | Official cross-compilation container for all Kubernetes release builds | No riscv64 toolchain installed (see GCC row) | N/A | Current pin `v1.38.0-go1.27.1-bullseye.0`, no riscv64 support | Same as GCC row above |

**Hard blockers for a deployable production riscv64 Kubernetes cluster, in order of severity:**

1. **etcd**: no official riscv64 release binaries exist in any currently supported release series, a single-point hard blocker for any standard Kubernetes installation.
2. **Kubernetes itself**: not on the official supported platform list; no release binaries or container images published to registry.k8s.io for riscv64.
3. **kube-cross image**: lacks a riscv64 cross-compiler (GCC), blocking the pause-image build and, by extension, the broader CI/release build pipeline.
4. **CRIU**: no riscv64 support since the upstream issue was opened in 2021; blocks pod checkpoint/restore and live migration.

---

## 10. Ecosystem Status

Not applicable. Kubernetes is an orchestration runtime/standalone platform, not a language runtime or package manager with a large dependent package ecosystem (comparable to, for example, PyPI, npm or Maven packages that must each be separately validated on riscv64). The Python client library (`kubernetes` on PyPI) is the only package-ecosystem-adjacent artifact identified, and it requires no riscv64-specific work because it ships pure-Python, architecture-independent wheels (Section 8). This section is omitted per the reporting criteria.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) | Proposal: Official Support for RISC-V Architecture and RVA23 Advancements | Open | N/A (feature proposal, not a bug) | `needs-triage`; comment count is disputed between two research passes (26 vs 0), see Section 1 |
| [kubernetes/kubernetes#139894](https://github.com/kubernetes/kubernetes/issues/139894) / [PR #141937](https://github.com/kubernetes/kubernetes/pull/141937) | `resource.Quantity.AsApproximateFloat64()` returns NaN instead of 0 for a zero-valued quantity with large scale | Closed, fixed, merged 2026-09-08, targeted for v1.38 | Low, correctness | Surfaced in a "riscv nan floating" search but **confirmed platform-independent**: a pure math overflow bug (`0 * math.Pow10(overflow) = +Inf -> NaN`), not RISC-V-specific. Authored by wilmerdooley, approved by jpbetz and liggitt |
| [riseproject-dev/kubernetes-riscv#2](https://github.com/riseproject-dev/kubernetes-riscv/issues/2) | Proposal: Joint collaboration to advance official RISC-V Tier 2 support for Kubernetes and etcd | Open | N/A (process/infrastructure issue, not a code bug) | Filed by ZTE Corporation, identifies insufficient CI hardware and a maintainer shortage as the concrete blockers; ZTE offers to donate physical RISC-V CI servers |

**No dedicated, open, RISC-V-labeled correctness or performance bug is filed against kubernetes/kubernetes itself.** Targeted searches (`riscv64 bug`, `riscv nan floating`, scoped to the repository) returned zero riscv-specific hits beyond the items above. All substantive RISC-V activity in the core repository is enablement/support proposal work, not bug reports, consistent with riscv64 not yet being an officially built or tested platform (there is no CI to surface architecture-specific bugs). The real bug/blocker backlog for Kubernetes-on-RISC-V currently lives in process and infrastructure issues (CI hardware, maintainer capacity) rather than code defects. See Section 6 for the one architecture-specific performance characteristic found, the 21.4% context-switch regression observed in the KubeEdge-V research fork, which is not a filed bug against any tracked repository.

---

## 12. Objections and Upstream Blockers

The primary gate has been stated consistently across three PR review cycles (2020, 2023, 2024) by multiple maintainers:

**@cblecker, closing PR #86011 (2020):** new architecture support requires a formal KEP via SIG Release; the project had not decided to take on any additional architectures.

**@liggitt, reviewing PR #123661 (2024-03-04):**
> "It is not enough for builds to work as it gets bit-rotted quickly when we vendor in new changes, update versions of things we use etc. So we need a good set of tests that exercise a wide battery of jobs in this new architecture."

**@BenTheElder, in issue #132836 (2025-07-09), enumerating blockers:** confirmed a lack of RISC-V CI/CD servers, and cited manpower and maintenance concerns from "poor experiences with adding lesser used architectures in the past." He also directed subsequent hardware/funding offers (including from RISE) to SIG Release and SIG K8s Infra.

**@dims, placing `/hold` on PR #141291 (2026-08-10):** blocked the minimal pause-image build PR pending resolution of the broader architecture-support policy discussion in #132836, an explicitly organizational/policy hold, not a technical objection to the diff itself.

**ZTE Corporation, via riseproject-dev/kubernetes-riscv#2 (2026-07-20):** independently converges on the same two blockers from the community side, insufficient CI hardware and a shortage of maintainers, and offers physical RISC-V CI server donation as a remedy. This stems from a CNCF TAG Infra discussion of a dedicated RISC-V enablement subproject.

**Current formal path forward (as of September 2026):** the parallel Tier 3 platform designation request, [sig-release#3107](https://github.com/kubernetes/sig-release/issues/3107) and its implementing [PR #3110](https://github.com/kubernetes/sig-release/pull/3110), is the concrete mechanism most likely to satisfy the long-standing policy gate identified back in #86011. It is open, not yet merged or formally accepted, as of 2026-09-30.

**Remaining blockers even if Tier 3 is granted:**
- kube-cross image must gain a riscv64 cross-toolchain (kubernetes/release#4489, status not stated).
- PR #141291's `/hold` must be lifted, contingent on #132836 policy resolution.
- No official etcd riscv64 release binaries exist, which blocks a standard deployable cluster regardless of Kubernetes' own platform status.

**Blockers resolved since 2023:** distroless riscv64 base images (merged February 2026); the platform tier policy rewrite defining a documented Tier 3 path (merged March 2026); etcd's `ETCD_UNSUPPORTED_ARCH` build-time restriction removed (merged 2026-03-29), though etcd still ships no riscv64 release binaries.

---

## 13. Readiness Assessment

- **Color:** Orange (downstream-only)
- **Release provider:** distro
- **Justification:** No riscv64 CI runs against kubernetes/kubernetes upstream (no Prow/TestGrid riscv64 jobs, no GitHub Actions) and no official riscv64 release binaries or container images are published (checked v1.36.2, v1.35.6, v1.34.9); see [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836). The only riscv64 availability is a patched Debian sid `kubectl` client build (client-only, not the core server components), which caps the grade at orange (downstream-only) per the distribution floor, since the distro build is patched rather than clean. Three substantive upstream attempts to add riscv64 build support (#86011, #116686, #123661) were each closed without merging, and the current minimal attempt (#141291, pause-image build) is open but on hold pending resolution of policy proposal #132836.
- **Pending work that could change the grade:** open PR [#141291](https://github.com/kubernetes/kubernetes/pull/141291) (pause image riscv64 build, on `/hold` by maintainer dims); open tracking issue [#132836](https://github.com/kubernetes/kubernetes/issues/132836) (untriaged, no maintainer consensus); the parallel Tier 3 platform designation proposal [kubernetes/sig-release#3107](https://github.com/kubernetes/sig-release/issues/3107) and [PR #3110](https://github.com/kubernetes/sig-release/pull/3110) (open, not yet merged or accepted as of 2026-09-30); informal RISE Project engagement offering CI and hardware resources on #132836, joined this cycle by a formal ZTE-filed collaboration proposal ([riseproject-dev/kubernetes-riscv#2](https://github.com/riseproject-dev/kubernetes-riscv/issues/2)) offering physical CI server donation.

This is not an optimization-purpose project (no JIT, SIMD or numerics core requiring per-architecture tuning), so no optimization-level rating applies.

---

## 14. Investment Analysis

### 14.1 Functional Enablement

The code changes required to add riscv64 to the Kubernetes build system are small and mechanical (roughly 7 files, tens of lines total, per the PR #116686 and #141291 analysis in Section 5). An open PR (#141291) already implements the first concrete piece (the pause image) but is held on policy, not engineering. The riscv64-motivated implementation work is dominated by CI infrastructure and build-image work, not Kubernetes source code itself. RISE has not, per available evidence, funded a direct engineering submission to kubernetes/kubernetes; its confirmed role to date is CI hardware (RISE RISC-V Runners) and informal advocacy on #132836. ZTE's proposal (riseproject-dev/kubernetes-riscv#2) is a hardware and collaboration offer, not yet executed engineering work.

Effort to prepare and land the remaining build-system changes (items 1, 3-6 from Section 5's enumeration, since item 2 is already in flight as #141291) and shepherd them through review given the established CI-coverage bar: estimated 2-4 person-weeks including maintainer iteration, contingent on the policy question in #132836 being resolved first.

### 14.2 Performance Optimization

No performance-tuning work is required to reach Tier 3 or Tier 2; Kubernetes core has no architecture-specific code paths to optimize (Section 4). Performance on riscv64 will be governed by hardware (instruction throughput, memory bandwidth) and by the container runtime layer (containerd, runc), not by Kubernetes-code-level bottlenecks. The one available data point (Section 6, ESAAM 2023 KubeEdge-V benchmark) suggests orchestration-layer overhead on RISC-V is broadly comparable to, and in several application-level tests smaller than, ARM64, with a notable OS-level context-switch regression traced to the container runtime's syscall-interception path rather than to Kubernetes. That finding is on a research fork and 2023-era low-power hardware, not on current-generation RISC-V server silicon or on kubernetes/kubernetes proper, so it should inform but not substitute for a direct measurement before committing engineering time to runtime-layer syscall-path optimization.

### 14.3 CI/CD Infrastructure

This remains the critical-path item and the reason every prior attempt stalled. Required to reach Tier 2 (informing, non-blocking CI):

1. Provision native riscv64 build/test capacity reachable by Kubernetes' Prow infrastructure. RISE RISC-V Runners (GitHub Actions-based, free) and ZTE's offered hardware donation (riseproject-dev/kubernetes-riscv#2) are both available inputs, but integrating either with Prow's GCP/AWS-based autoscaling requires dedicated engineering on both sides; no evidence this integration work has started for kubernetes/kubernetes specifically.
2. Add riscv64 Prow job definitions in kubernetes/test-infra covering at minimum cross-build, kubelet unit tests and conformance tests, to satisfy @liggitt's "wide battery of jobs" bar from PR #123661.
3. Resolve the `/hold` on PR #141291, contingent on #132836 or the Tier 3 proposal (sig-release#3107/#3110) reaching maintainer consensus.

Tier 3 itself requires none of this; it requires only a documented, externally maintained build process with a link to artifacts, which is the basis of the currently open #3107/#3110 request.

### 14.4 Ecosystem Enablement

Two dependency gaps require investment from outside the Kubernetes project itself before a full cluster is deployable on riscv64:

- **etcd**: no riscv64 release binaries exist despite the build-time `ETCD_UNSUPPORTED_ARCH` restriction being removed (PR #21510, merged 2026-03-29). The etcd project must add riscv64 to its own release pipeline; this is separate ownership and separate maintainers.
- **CRIU**: no riscv64 support since the tracking issue opened in 2021 (checkpoint-restore/criu#1702), with no active upstream work found. This blocks pod checkpoint/restore and live migration specifically, not baseline scheduling/networking functionality.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land remaining build-system PR items (Section 5, items 1, 3-6) once #132836/policy is resolved | 2-4 | RISE / community contributors | Critical |
| Functional | Unblock and merge PR #141291 (pause image) and its kube-cross dependency (release#4489) | 1-2 | Kubernetes maintainers (dims et al.) / kubernetes/release maintainers | Critical |
| Functional | Add riscv64 to etcd's release pipeline | 4-8 | etcd maintainers (external project) | Critical |
| Functional | Publish official riscv64 Kubernetes container images to registry.k8s.io | 2-4 | SIG K8s Infra | High |
| Process | Land Tier 3 designation (sig-release#3107/PR#3110) | 1-2 | RISE Project / SIG Release | High |
| CI | Integrate RISE RISC-V Runners and/or ZTE-donated hardware with upstream Prow for informing (Tier 2) CI | 8-16 | RISE + ZTE + SIG K8s Infra | High |
| CI | Add riscv64 Prow job definitions in kubernetes/test-infra | 2-4 | RISE + SIG Testing | High |
| Ecosystem | CRIU riscv64 platform bring-up | 16-32 | CRIU maintainers / separate investment | Medium |
| Performance | Validate the KubeEdge-V ESAAM 2023 context-switch/syscall-overhead finding against current-generation RISC-V server hardware and unmodified kubernetes/kubernetes, before scoping runtime-layer optimization work | 2-4 | RISE / benchmarking effort | Low |

---

## 15. References

- [kubernetes/kubernetes repository](https://github.com/kubernetes/kubernetes)
- [Issue #132836, Proposal: Official Support for RISC-V Architecture and RVA23 Advancements](https://github.com/kubernetes/kubernetes/issues/132836)
- [Issue #132570, Assessment of the difficulty in porting CPU architecture for kubernetes](https://github.com/kubernetes/kubernetes/issues/132570)
- [PR #82349, Bump x/sys and opencontainers/runc to support Risc-V architecture (closed)](https://github.com/kubernetes/kubernetes/pull/82349)
- [PR #86011, Add build support for riscv64 arch (closed)](https://github.com/kubernetes/kubernetes/pull/86011)
- [PR #86013, Bump Ginkgo to support building on riscv64 arch (merged, v1.18.0)](https://github.com/kubernetes/kubernetes/pull/86013)
- [PR #116686, feat: add riscv64 support (closed)](https://github.com/kubernetes/kubernetes/pull/116686)
- [PR #123661, Add riscv64 support (closed)](https://github.com/kubernetes/kubernetes/pull/123661)
- [PR #141291, Add RISC-V build for the pause image (open, on hold)](https://github.com/kubernetes/kubernetes/pull/141291)
- [Issue #139894, Quantity.AsApproximateFloat64 returns NaN](https://github.com/kubernetes/kubernetes/issues/139894)
- [PR #141937, fix for #139894 (merged)](https://github.com/kubernetes/kubernetes/pull/141937)
- [hack/lib/golang.sh, authoritative platform list](https://github.com/kubernetes/kubernetes/blob/master/hack/lib/golang.sh)
- [kubernetes/release PR #4303, add debian trixie and riscv64 support for debian-base (closed)](https://github.com/kubernetes/release/pull/4303)
- [kubernetes/release PR #4489, kube-cross riscv64 update](https://github.com/kubernetes/release/pull/4489)
- [kubernetes/sig-release PR #2974, rewrite platform support tiers documentation (merged 2026-03-26)](https://github.com/kubernetes/sig-release/pull/2974)
- [kubernetes/sig-release#3107, Tier3 Platform Support Request for RISC-V (open)](https://github.com/kubernetes/sig-release/issues/3107)
- [kubernetes/sig-release PR #3110, add riscv64 as a tier 3 platform (open)](https://github.com/kubernetes/sig-release/pull/3110)
- [riseproject-dev/kubernetes-riscv#2, Proposal: Joint collaboration to advance official RISC-V Tier 2 support (open)](https://github.com/riseproject-dev/kubernetes-riscv/issues/2)
- [opencontainers/runc PR #5166](https://github.com/opencontainers/runc/pull/5166)
- [etcd PR #21510, remove ETCD_UNSUPPORTED_ARCH for riscv64 (merged 2026-03-29)](https://github.com/etcd-io/etcd/pull/21510)
- [checkpoint-restore/criu#1702, riscv64 support (open since 2021)](https://github.com/checkpoint-restore/criu/issues/1702)
- [CARV-ICS-FORTH/kubernetes-riscv64](https://github.com/CARV-ICS-FORTH/kubernetes-riscv64)
- [alitariq4589/kubernetes-riscv releases](https://github.com/alitariq4589/kubernetes-riscv/releases)
- [go-riscv/kind](https://github.com/go-riscv/kind)
- [carlosedp/riscv-bringup, Kubernetes on RISC-V notes](https://github.com/carlosedp/riscv-bringup)
- [buildd.debian.org, kubernetes riscv64 build status](https://buildd.debian.org/status/package.php?p=kubernetes)
- [PyPI kubernetes package](https://pypi.org/pypi/kubernetes/json)
- [RISE Project, Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project, RISE RISC-V Runners: six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project, How Kairos is Charting the Stepping Stones of RISC-V Productization (2026-09-28)](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [RISE Project members](https://riseproject.dev/members/)
- [Lumpp, Barchi, Acquaviva, Bombieri, On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing, ESAAM 2023 (ACM DL)](https://dl.acm.org/doi/fullHtml/10.1145/3624486.3624490)
- [ESAAM 2023 paper, PDF](https://cris.unibo.it/retrieve/976f8d03-98e3-4565-b2c4-a921e6561322/3624486.3624490.pdf)
- [MDPI, Evaluating ARM and RISC-V Architectures for HPC with Docker and Kubernetes (fetch blocked, figures unverified)](https://www.mdpi.com/2079-9292/13/17/3494)
- [Kairos CNCF Sandbox project, issue tracker](https://github.com/kairos-io/kairos/issues)
- [kubernetes/sig-release platform support guide](https://github.com/kubernetes/sig-release/blob/master/release-engineering/platforms/README.md)