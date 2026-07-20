---
title: Kubernetes
categories:
  - containers
---

# Kubernetes

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kubernetes<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Kubernetes is the de facto standard container orchestration platform. It is a [CNCF](https://cncf.io/) graduated project (highest CNCF maturity tier) under The Linux Foundation, licensed Apache 2.0. The primary repository is [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes).

Governance uses a SIG (Special Interest Group) structure overseen by a 7-member Steering Committee with staggered 2-year terms. Current committee composition as of mid-2026:

| Member | Employer |
|---|---|
| Antonio Ojea (@aojea) | Google |
| Benjamin Elder (@BenTheElder) | Google |
| Sascha Grunert (@saschagrunert) | Red Hat |
| Rita Zhang (@ritazh) | CoreWeave |
| Paco Xu (@pacoxu) | DaoCloud |
| Maciej Szulik (@soltysh) | Defense Unicorns |
| Kat Cosgrove (@katcosgrove) | Minimus |

CNCF Governing Board Representative: Christoph Blecker (@cblecker). CNCF Staff Liaison: Jeff Sica (@jeefy).

Corporate composition of the committee -- Google (2 seats), Red Hat (1), CoreWeave (1), DaoCloud (1), Defense Unicorns (1), Minimus (1) -- reflects historical dominant contributors: Google (original creator), Red Hat, and Microsoft. There is no single MAINTAINERS file; governance is distributed via per-SIG OWNERS files throughout the repo.

---

## 2. Port History and Upstreaming Timeline

The RISC-V porting effort in Kubernetes began in September 2019 with carlosedp (Carlos de Paula), who independently drove the cloud-native RISC-V ecosystem. No work predates him in this repository. Four separate attempts to add riscv64 have been made; all failed for the same structural reason: absence of CI infrastructure.

| Date | Event | Author | Outcome |
|---|---|---|---|
| 2019-09-04 | [PR #82349](https://github.com/kubernetes/kubernetes/pull/82349) -- bump x/sys and runc deps for riscv64 buildability | carlosedp | Voluntarily closed; Go 1.13 upgrade (PR #82809) landed the needed deps first |
| 2019-12-06 | [PR #86011](https://github.com/kubernetes/kubernetes/pull/86011) -- add riscv64 to build scripts | carlosedp | Closed by @cblecker citing no KEP and no architecture policy; reopened by @dims Aug 2020; auto-closed stale Jan 2021 |
| 2019-12-20 | [PR #86013](https://github.com/kubernetes/kubernetes/pull/86013) -- bump Ginkgo to support riscv64 build | carlosedp | **Merged** into v1.18; first and only riscv64-motivated merge into Kubernetes core |
| 2023-03-16 | [PR #116686](https://github.com/kubernetes/kubernetes/pull/116686) -- feat: add riscv64 support (draft) | ernado | Closed by author 2023-04-21; cited missing distroless image, etcd image, and Kubernetes base images for riscv64; author estimated readiness in 2025 tied to Debian full riscv64 support |
| 2024-03-04 | [PR #123661](https://github.com/kubernetes/kubernetes/pull/123661) -- Add riscv64 support | JasenChao | Closed by @dims 2024-05-22; @liggitt stated CI coverage is mandatory and cited the two prior failed attempts |
| 2024-11-07 | [PR #128148](https://github.com/kubernetes/kubernetes/pull/128148) -- bump opencontainers/selinux to v1.11.1 | bzsuni | **Merged** into v1.32 as routine dependency update; v1.11.1 upstream had extended its riscv64 build target |
| 2025-07-09 | [Issue #132836](https://github.com/kubernetes/kubernetes/issues/132836) -- Proposal: Official Support for RISC-V Architecture and RVA23 Advancements | yu8833 | Open; tagged sig/architecture, sig/k8s-infra, sig/release, sig/testing; no milestone, no linked PRs, awaiting triage |
| 2026-02-27 | distroless-debian13 riscv64 images (static, base, cc) merged by distroless maintainer @loosebazooka | loosebazooka | Distroless image blocker resolved |
| 2026-03-26 | [kubernetes/sig-release PR #2974](https://github.com/kubernetes/sig-release/pull/2974) -- Rewrite platform support tiers | saschagrunert | **Merged**; formally defined Tier 3 entry path (no KEP required; documented build process + external artifact link sufficient) |
| 2026-04 | [riseproject-dev/kubernetes-riscv](https://github.com/kubernetes/kubernetes/compare/master...riseproject-dev:kubernetes-riscv:riscv-support) riscv-support branch in preparation | brianredbeard / RISE | Active; no upstream PR yet as of 2026-04-10 |

Two merged PRs touch riscv64 in the entire history of the repository (#86013 in 2019 and #128148 in 2024). Neither adds riscv64 as a supported build target. No upstream PR for riscv64 architecture support has ever been merged.

---

## 3. Upstream Support Tier

Kubernetes defines platform support tiers in [kubernetes/sig-release release-engineering/platforms/README.md](https://github.com/kubernetes/sig-release/blob/master/release-engineering/platforms/README.md), last substantively rewritten by PR #2974 (merged 2026-03-26).

**Tier 1** -- Official binaries and images, release-blocking CI, kubernetes.io documentation, minimum 2 dedicated maintainers. Current platforms: `linux/amd64`, `linux/arm64`, `linux/ppc64le`, `linux/s390x`.

**Tier 2** -- Official binaries, informing (non-blocking) CI, 2 maintainers, Go first-class port required. Current: `darwin/amd64`, `darwin/arm64`, `windows/amd64`, `windows/arm64` (client/node scope, varying).

**Tier 3** -- No official builds, no project CI, externally maintained with a documented community build process and link to external artifacts. No platforms are currently formally designated Tier 3, though this is the entry point for new architectures under the revised policy.

**Restriction:** Platforms using Go secondary or experimental ports are capped at Tier 3. Go promoted riscv64 to a first-class port in Go 1.22+; this restriction no longer applies to riscv64.

**riscv64 current tier: not listed.** The architecture has no tier designation, no KEP, and no formal proposal accepted by any SIG. @saschagrunert stated in March 2026 that contributing a documented build process targeting Tier 3 would be the correct next step ([issue #132836 comment, 2026-03-31](https://github.com/kubernetes/kubernetes/issues/132836)).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kubernetes is written in Go. It has no JIT backends, no SIMD dispatch, no hand-written assembly, and no CPU-feature-gated code paths in first-party source. The entire codebase is architecture-neutral from the perspective of the language runtime.

**First-party riscv64 files: zero.** An exhaustive search of all non-vendor files (pkg/, cmd/, staging/, build/, hack/, test/, api/, cluster/) found no files matching `riscv`, no `//go:build riscv64` constraints, no architecture-specific build tags, and no `#ifdef __riscv` guards. `linux/riscv64` does not appear anywhere in first-party source code.

**Vendor tree: 24 riscv64 files, all upstream pass-throughs.** These arrived incidentally via dependency version bumps and do not constitute Kubernetes riscv64 support:

| Vendor package | File count | Content |
|---|---|---|
| `golang.org/x/sys/unix` | ~19 | Auto-generated Linux/BSD syscall tables, ABI type definitions, assembly trampolines |
| `golang.org/x/sys/cpu` | 3 | CPU feature detection: HasV (RVV), HasC, Zba, Zbb, Zbs, Zbc, Zvbb, Zvbc, Zvkb, Zvkg, Zvkt, Zvkn/c/g, Zvks/c/g |
| `go.etcd.io/bbolt` | 1 | `MaxMapSize=256TB` constant for riscv64 |
| `github.com/prometheus/procfs` | 1 | `/proc/cpuinfo` parser dispatch for riscv/riscv64 |

For comparison: the vendor tree contains 53 amd64-specific files and 51 arm64-specific files. The riscv64 vendor coverage (24 files) is incomplete relative to what arm64 has -- it covers syscall bindings and CPU detection but lacks architecture-specific netlink, seccomp, and eBPF bindings present for arm64.

The `vendor/golang.org/x/sys/cpu/cpu_riscv64.go` file detects V, Zba, Zbb, Zbs, Zbc, and the vector cryptography extensions (Zvkn, Zvks, etc.) via Linux `hwcap`. These detections are unused by any Kubernetes code path -- they exist only because x/sys ships them as part of its own portability work.

A `third_party/multiarch/qemu-user-static/` helper script lists riscv32/riscv64 ELF magic bytes for binfmt_misc cross-arch emulation. This is a vendored copy of an upstream QEMU script, not Kubernetes-authored code.

---

## 5. Build System, Cross-Compilation, and Toolchain

Kubernetes uses Go's native cross-compilation invoked through shell scripts and a Docker-based "kube-cross" container image. There is no CMake, no Bazel (removed in v1.21), and no architecture-specific build configuration files.

**Standard build invocation:**

```
make WHAT=./cmd/<binary> KUBE_BUILD_PLATFORMS=linux/riscv64
```

Output lands in `_output/local/bin/linux/riscv64/`. This invocation will succeed with an unmodified Go toolchain because Go supports `GOARCH=riscv64` natively since Go 1.14. The build scripts do not block on architecture; they only enforce the supported list for release builds.

**Platform lists in `hack/lib/golang.sh` (authoritative):**

```
KUBE_SUPPORTED_SERVER_PLATFORMS:  linux/amd64 linux/arm64 linux/s390x linux/ppc64le
KUBE_SUPPORTED_NODE_PLATFORMS:    linux/amd64 linux/arm64 linux/s390x linux/ppc64le windows/amd64
KUBE_SUPPORTED_CLIENT_PLATFORMS:  linux/amd64 linux/386 linux/arm linux/arm64 linux/s390x linux/ppc64le
                                   darwin/amd64 darwin/arm64 windows/amd64 windows/386 windows/arm64
KUBE_SUPPORTED_TEST_PLATFORMS:    linux/amd64 linux/arm64 linux/s390x linux/ppc64le
                                   darwin/amd64 darwin/arm64 windows/amd64 windows/arm64
```

`linux/riscv64` is absent from all four arrays. The fallback at line 215-216 explicitly defaults to amd64 for any platform not in the server list.

**Cross-compiler assignments (from `hack/lib/golang.sh kube::golang::set_platform_envs()`):**

```
linux/amd64:   CC=${KUBE_LINUX_AMD64_CC:-x86_64-linux-gnu-gcc}
linux/arm64:   CC=${KUBE_LINUX_ARM64_CC:-aarch64-linux-gnu-gcc}
linux/arm:     CC=${KUBE_LINUX_ARM_CC:-arm-linux-gnueabihf-gcc}
linux/ppc64le: CC=${KUBE_LINUX_PPC64LE_CC:-powerpc64le-linux-gnu-gcc}
linux/s390x:   CC=${KUBE_LINUX_S390X_CC:-s390x-linux-gnu-gcc}
# linux/riscv64: no entry
```

A generic fallback derives the CC variable name from the platform string, so setting `KUBE_LINUX_RISCV64_CC=riscv64-linux-gnu-gcc` externally will wire CGO correctly for riscv64. No code change is needed for that specific integration.

**kube-cross container image (the official cross-compilation build environment):**

- Image: `registry.k8s.io/build-image/kube-cross`
- Current version pin in kubernetes/kubernetes: `v1.37.0-go1.26.4-bullseye.0`
- Base: Debian Bullseye
- `KUBE_CROSSPLATFORMS`: `linux/386 linux/arm linux/arm64 linux/ppc64le linux/s390x darwin/amd64 windows/amd64 windows/386`
- `KUBE_DYNAMIC_CROSSPLATFORMS`: `arm64 armhf i386 ppc64el s390x`
- Installed cross-toolchains: gcc for arm, arm64, ppc64le, s390x, 386; no `gcc-riscv64-linux-gnu` or `crossbuild-essential-riscv64`

The kube-cross image is maintained in the `kubernetes/release` repository. [PR #4303](https://github.com/kubernetes/release/pull/4303) (by @Opvolger, opened 2026-03-02) proposed adding riscv64 support. It was placed on hold by @BenTheElder citing resource cost and lack of CI: "We do not have any CI resources available for this architecture." The PR was closed without merge.

**Go version:** Current minimum enforced is 1.26.4 (from `.go-version`). Go has supported `GOARCH=riscv64` since Go 1.14. The Go toolchain is not a blocker.

**Pause container:** The pause binary is a small C program in `build/pause/`. PR #116686 proposed adding `riscv64` to `ALL_ARCH.linux` in `build/pause/Makefile` and setting `TRIPLE.linux-riscv64 := riscv64-linux-gnu`. The pause binary compilation is the immediate blocker cited by @shanduur in issue #132836 (July 2025): "The biggest issue right now is lack of pause image -- every other component is easy to build. The `kube-cross` image lacks `riscv64-linux-gnu-gcc`."

**QEMU emulation:** PR #116686 proposed adding `["riscv64"]="riscv64"` to the `QEMUARCHS` map in `test/images/image-util.sh`. Standard `qemu-user-static` binfmt_misc registration would then enable riscv64 container image builds on x86_64 hosts. This has not been merged.

**What adding riscv64 requires in the build system (from PR #116686 analysis):**

1. `hack/lib/golang.sh` -- add `linux/riscv64` to all four `KUBE_SUPPORTED_*_PLATFORMS` arrays; extend fast-build arch check
2. `build/pause/Makefile` -- add `riscv64` to `ALL_ARCH.linux`; set `TRIPLE.linux-riscv64 := riscv64-linux-gnu`
3. `cluster/images/etcd/Makefile` -- add `riscv64` to `ALL_ARCH.linux`; set base image (e.g., `docker.io/riscv64/debian:sid-slim`)
4. `hack/lib/util.sh` -- add `riscv64*) host_arch=riscv64 ;;` case
5. `test/images/image-util.sh` -- add `["riscv64"]="riscv64"` to `QEMUARCHS`
6. `test/typecheck/main.go` -- add `"linux/riscv64"` to typecheck platform list
7. `kubernetes/release` kube-cross Dockerfile -- install `gcc-riscv64-linux-gnu`; add `linux/riscv64` to `KUBE_CROSSPLATFORMS`

The code changes are mechanical and small. The blocking constraint is not code complexity -- it is CI infrastructure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The following table covers the components and features that constitute a functioning Kubernetes cluster.

| Component | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| kube-apiserver | Official binary | Official binary | No official binary | Release gap |
| kube-scheduler | Official binary | Official binary | No official binary | Release gap |
| kube-controller-manager | Official binary | Official binary | No official binary | Release gap |
| kube-proxy | Official binary | Official binary | No official binary | Release gap |
| kubelet | Official binary | Official binary | No official binary | Release gap |
| kubectl (client) | Official binary | Official binary | No official binary (Debian sid only) | Release gap |
| pause container image | Official (registry.k8s.io) | Official | No official image | Image gap |
| kube-cross build image | Full toolchain | Full toolchain | No toolchain, image missing riscv64-gcc | Build infrastructure gap |
| Container images (registry.k8s.io) | All SIG images | All SIG images | None | Image gap |
| CI coverage (Prow/TestGrid) | Full, release-blocking | Full, release-blocking | None | CI gap |
| kubeadm preflight checks | Pass | Pass | Fail (SystemVerification, KubeletVersion) [NEEDS VERIFICATION] | Compatibility gap |
| iptables / nftables | nftables default | nftables default | Legacy iptables required [NEEDS VERIFICATION] | Kernel feature gap |
| Pod live migration (CRIU) | Supported (containerd) | Supported | Unavailable (CRIU has no riscv64 support) | Feature gap |
| Vendor syscall bindings (x/sys) | Full | Full | Auto-generated partial set | Minor vendor gap |

The iptables and kubeadm preflight items are sourced from [carlosedp/riscv-bringup](https://github.com/carlosedp/riscv-bringup/blob/master/kubernetes/Readme.md) which documents a Kubernetes v1.16-era deployment. These issues may be resolved in current kernel versions; both are marked [NEEDS VERIFICATION].

---

## 7. CI/CD Infrastructure

**Official CI coverage for riscv64: zero.**

Kubernetes CI is run by Prow, with job definitions in [kubernetes/test-infra](https://github.com/kubernetes/test-infra). Direct inspection of the relevant job configuration files confirms:

- `config/jobs/kubernetes/sig-release/kubernetes-builds.yaml` -- cross-build jobs run on AWS EKS and GCP; no riscv64 architecture enumeration
- `config/jobs/kubernetes/sig-node/node-kubelet.yaml` -- 20 jobs; only arm64 appears once (`--target-build-arch=linux/arm64`); riscv64 absent
- TestGrid dashboards -- architectures tested: amd64, arm64, ppc64le, s390x; riscv64 absent

There is no `.github/workflows/` directory in kubernetes/kubernetes. The repo has no GitHub Actions workflows at all; CI is entirely Prow-based.

No QEMU-based riscv64 emulation jobs exist in any CI tier (blocking, informing, or experimental).

**Hardware availability:** @BenTheElder stated in [issue #132836](https://github.com/kubernetes/kubernetes/issues/132836) (2025-07-09): "Is there a lack of RISC-V servers for CI/CD automation testing and builds? Yes." and "NOTE: We also do not have any CI resources available for this architecture."

@pl4nty noted in issue #132836 (2025-11-28) that a particular riscv64 CI job took over 10 hours -- a maintainer asked for under 1 hour (the amd64/arm64 standard) before considering official support. This is the practical hardware performance constraint for CI viability [NEEDS VERIFICATION for the specific time figures].

**RISE RISC-V Runners:** The RISE Project announced a free native RISC-V GitHub Actions runner service in March 2026 (label: `ubuntu-24.04-riscv`, backed by Scaleway EM-RV1 bare-metal hardware). The service is used by cloud-native ecosystem projects including k0s (k0sproject/k0s#7414 pending merge for nightly builds), Kairos (kairos-io/kairos-init), and kubetail-org/kubetail (499 jobs). The RISE service uses Kubernetes internally (each job runs as an ephemeral Kubernetes pod via a custom device plugin). As of June 2026, no Kubernetes upstream CI jobs use the RISE runners, but active engagement is described as underway.

---

## 8. Distribution and Release Status

**Upstream Kubernetes releases (dl.k8s.io / github.com/kubernetes/kubernetes):**

The v1.36.2, v1.35.6, and v1.34.9 releases have `"assets": []` in the GitHub API -- binaries are distributed via dl.k8s.io, not as GitHub release file attachments. The CHANGELOG-1.36.md download section lists the following supported architectures:

- Client: linux-386, linux-amd64, linux-arm, linux-arm64, linux-ppc64le, linux-s390x, darwin-amd64, darwin-arm64, windows-386, windows-amd64, windows-arm64
- Server: linux-amd64, linux-arm64, linux-ppc64le, linux-s390x
- Node: linux-amd64, linux-arm64, linux-ppc64le, linux-s390x, windows-amd64

riscv64 is absent from all three categories in all checked releases.

**Container images (registry.k8s.io):** All official Kubernetes component images (kube-apiserver, kube-scheduler, kube-controller-manager, kube-proxy, pause, etc.) are published for amd64, arm64, ppc64le, and s390x. No riscv64 manifests exist in the official registry.

**Debian Unstable (sid):** The `kubectl` binary (v1.33.4+ds-1) is listed as "Installed" on riscv64 at [buildd.debian.org](https://buildd.debian.org/status/package.php?p=kubernetes). This is a Debian cross-compilation from patched source; it is not an upstream Kubernetes release artifact. The `+ds` suffix denotes Debian source repackaging. The Debian kubernetes source package produces only `kubectl`, `kubernetes-client`, and `golang-k8s-kubectl-dev` -- it does not build server-side components (kube-apiserver, kubelet, etc.). A riscv64 kubectl in Debian sid is not a deployable Kubernetes cluster.

**Arch Linux RISC-V (archriscv.felixc.at):** `kubernetes-control-plane-common-1.35.4-1-riscv64.pkg.tar.zst` (built 2026-04-22) and `python-kubernetes-33.1.0-1-any.pkg.tar.zst` are available. [NEEDS VERIFICATION -- secondary source only; Arch RISC-V is a community port.]

**Ubuntu 24.04 Noble:** The `kubernetes` package (version 1.0) in Noble is `arch=all` (a metapackage/installer), available on riscv64 because arch=all packages are architecture-independent. This is not a native binary build.

**Third-party unofficial riscv64 Kubernetes builds (community-maintained):**

- [alitariq4589/kubernetes-riscv](https://github.com/alitariq4589/kubernetes-riscv/releases) -- periodic release tracking of upstream tags
- [CARV-ICS-FORTH/kubernetes-riscv64](https://github.com/CARV-ICS-FORTH/kubernetes-riscv64) -- K3s-based port (chazapis), maintained for 2+ years as of 2025
- KubeSolo (shanduur) -- unofficial, community build
- Unofficial Talos Linux port (pl4nty) -- includes kubernetes, etcd, and dependency tree
- [riseproject-dev/kubernetes-riscv](https://github.com/kubernetes/kubernetes/compare/master...riseproject-dev:kubernetes-riscv:riscv-support) -- `riscv-support` branch and `riscv-support-v1.36` branch, backed by RISE, being prepared for upstream submission by brianredbeard

---

## 9. Dependencies

The following table covers direct dependencies that affect riscv64 Kubernetes cluster deployability.

| Dependency | Role | riscv64 Build | riscv64 CI | riscv64 Release Artifacts | Blocking Issues |
|---|---|---|---|---|---|
| **Go runtime** | Primary language; all Kubernetes binaries compiled with Go | Yes (since Go 1.14, secondary; first-class since ~1.22) | Go's own CI covers riscv64 | Released with every Go toolchain | No blockers |
| **containerd** | Default CRI backend | Yes | No riscv64 integration tests (issues #13020, #13124 open as of 2026-03-25) | Yes -- v2.3.2 ships `containerd-2.3.2-linux-riscv64.tar.gz` | CI gap (#13124 open); CRIU checkpoint not supported on riscv64 |
| **runc** | OCI runtime (low-level container execution) | Yes | CI includes riscv64 ([PR #5166](https://github.com/opencontainers/runc/pull/5166) merged) | Yes -- v1.5.0 ships `runc.riscv64` | #3950 (open): musl static build broken on riscv64 |
| **etcd** | Control plane key-value store | Yes (ETCD_UNSUPPORTED_ARCH workaround removed [PR #21510](https://github.com/etcd-io/etcd/pull/21510), merged 2026-03-29) | No riscv64 CI | No -- absent from all release assets v3.4 through v3.7-rc | Hard blocker: no release binaries; no CI |
| **CNI plugins** | Pod networking (bridge, loopback, host-local, portmap) | Yes | No dedicated riscv64 CI visible | Yes -- v1.9.1 ships `cni-plugins-linux-riscv64-v1.9.1.tgz` | No open blocking issues found |
| **CoreDNS** | Cluster DNS | Yes | No dedicated riscv64 CI visible | Yes -- v1.14.4 ships `coredns_1.14.4_linux_riscv64.tgz` | No open blocking issues found |
| **CRIU** | Pod live migration / checkpoint-restore | No | N/A | No | [criu/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since 2021 -- RISC-V not implemented; blocks all checkpoint/restore features |
| **libseccomp** | Syscall filtering (seccomp profiles) | Yes (v2.5.x+) | Tested in CI | Released | #327 (open): riscv32 not supported -- does not affect riscv64 |
| **distroless images** | Base images for Kubernetes component containers | Yes -- distroless-debian13 (static, base, cc) merged Feb 2026 by @loosebazooka | N/A | Available for riscv64 | Blocker resolved Feb 2026 |
| **kube-cross image** | Official cross-compilation build container | No -- no riscv64 toolchain | N/A | No | PR #4303 (kubernetes/release) placed on hold by @BenTheElder, then closed; this is a current active blocker |

**Summary of hard blockers for a production Kubernetes cluster on riscv64:**

1. **etcd** -- no official riscv64 release binaries exist in any currently supported release series (v3.4 through v3.7-rc). A standard Kubernetes installation requires etcd; this is a single-point hard blocker.
2. **Kubernetes itself** -- not in the official supported platform list; no release binaries or container images published to `registry.k8s.io` for riscv64.
3. **kube-cross image** -- lacks `riscv64-linux-gnu-gcc`; blocking the CI build pipeline and the pause container build.
4. **CRIU** -- checkpoint/restore unavailable on riscv64 since 2021, with no active upstream work. Blocks pod live migration and stateful container checkpointing.

---

## 10. Ecosystem Status

**RISE Project:** The RISE Project (Linux Foundation) runs a free native RISC-V GitHub Actions runner service using Scaleway EM-RV1 bare-metal hardware. As of the six-weeks-in status post (May 2026), Kubernetes-adjacent projects using the runners include:

- **kubetail-org/kubetail** -- real-time Kubernetes log explorer; 499 jobs logged
- **k0s** (CNCF Sandbox Kubernetes distro) -- [k0sproject/k0s#7414](https://github.com/k0sproject/k0s/pull/7414) pending merge to enable nightly RISC-V builds and tests
- **Kairos** (CNCF Sandbox, immutable Linux for edge/Kubernetes) -- active use via kairos-io/kairos-init

The RISE blog has zero posts mentioning Kubernetes upstream. The RISE wheel builder page (~80 Python packages for riscv64 binary wheels) does not include any Kubernetes packages (the Python client is pure Python and needs no riscv64 wheel).

RISE has begun active engagement with the Kubernetes upstream per issue #132836: @luhenry (Ludovic Henry) commented 2025-11-03 offering funding, machines, engineering, and documentation resources. @BenTheElder directed engagement to SIG Release and SIG K8s Infra.

**go-riscv GitHub org:** Maintained by @ernado (author of PR #116686) to host riscv64 forks of cloud-native dependencies including etcd and Kubernetes base images. Referenced as an interim build source by the community.

**k3s (Rancher/SUSE):** No riscv64 release binaries found in k3s releases. [NEEDS VERIFICATION -- community reportedly built K3s on riscv64 per multiple issue comments.]

**Upstream engagement level:** Five substantive community contributors have expressed intent to drive riscv64 support since 2019 (carlosedp, ernado, JasenChao, chazapis, brianredbeard/RISE). Two Steering Committee members (@BenTheElder, @saschagrunert) have engaged in the thread with substantive technical guidance. The March 2026 platform tier policy rewrite was explicitly motivated in part by the riscv64 discussion.

---

## 11. Known Bugs and Active Issues

**Open upstream issues:**

- [Issue #132836](https://github.com/kubernetes/kubernetes/issues/132836) (2025-07-09, open): Proposal for official RISC-V support. Not a bug; a feature proposal awaiting triage. 11 upvote reactions. Stale lifecycle removed 2026-03-31 by @saschagrunert.

**No riscv64-specific correctness or performance bugs are open in kubernetes/kubernetes.** This absence reflects that riscv64 is untested and unsupported, not that it is defect-free.

**Known practical issues from community builds ([carlosedp/riscv-bringup](https://github.com/carlosedp/riscv-bringup/blob/master/kubernetes/Readme.md), Kubernetes v1.16.0-era, [NEEDS VERIFICATION for current versions]):**

1. kubeadm preflight failures on riscv64: `--ignore-preflight-errors SystemVerification,KubeletVersion` required to bypass platform validation
2. API server liveness probe timeouts: `initialDelaySeconds` and `timeoutSeconds` require manual patching; indicates slower startup on RISC-V hardware relative to x86_64 baseline
3. iptables incompatibility: modern nftables-based iptables do not work on riscv64 kernel builds available at the time; all four tools (iptables, ip6tables, arptables, ebtables) require legacy variant
4. Missing upstream pause and CoreDNS images: pause Makefile requires patching to add riscv64 to `ALL_ARCH`

**Performance data:** No published quantitative benchmarks exist for Kubernetes on riscv64 (pod scheduling latency, API server throughput, container startup time, etcd operation latency). No academic papers, vendor reports, or community benchmarks with actual numeric comparisons against amd64 or arm64 were found.

---

## 12. Objections and Upstream Blockers

The primary gate has been stated consistently across three PR review cycles (2020, 2023, 2024) by two maintainers (@cblecker, @liggitt):

**@liggitt (Jordan Liggitt), reviewing [PR #123661](https://github.com/kubernetes/kubernetes/pull/123661) on 2024-03-04:**
> "It is not enough for builds to work as it gets bit-rotted quickly when we vendor in new changes, update versions of things we use etc. So we need a good set of tests that exercise a wide battery of jobs in this new architecture."

**@BenTheElder (Benjamin Elder), in [issue #132836](https://github.com/kubernetes/kubernetes/issues/132836) on 2025-07-09, enumerating blockers:**
- Lack of RISC-V CI/CD servers: "Yes" (explicit)
- Manpower and maintenance concerns: "Yes" (explicit), citing "poor experiences with adding lesser used architectures in the past"
- KVM/QEMU RISC-V virtualization maturity: "That doesn't sound mature, which will be a problem for our qemu based cross-builds"

**@saschagrunert, in [issue #132836](https://github.com/kubernetes/kubernetes/issues/132836) on 2026-03-31, post-policy-rewrite:**
> "For RISC-V, the next step would be to target Tier 3 support, which requires: a documented, publicly available build process; no official builds or automated testing guarantees."

**Current formal path (as of March 2026):** Tier 3 designation does not require a KEP. It requires: (1) a documented, publicly available build process; (2) a link to external artifacts. A PR demonstrating this plus engagement with SIG Release is the minimum viable path.

**Remaining blockers for Tier 3:**
- kube-cross image must be updated to include `riscv64-linux-gnu-gcc` (kubernetes/release PR #4303 was closed; must be reopened or replaced)
- Documented build process for riscv64 (not yet published as official documentation)
- No current PR open against master (riseproject-dev/kubernetes-riscv `riscv-support` branch is in preparation but not submitted as of 2026-04-10)

**Blockers resolved since 2023:**
- distroless riscv64 images (merged Feb 2026) -- previously the most-cited dependency gap
- Platform tier policy now defines Tier 3 without KEP requirement (merged March 2026)
- etcd can be built for riscv64 without `ETCD_UNSUPPORTED_ARCH` override (PR #21510 merged 2026-03-29) -- though etcd still ships no riscv64 release binaries

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The code changes required to add riscv64 to the Kubernetes build system are small and mechanical (7 files, 30-50 lines total, per PR #116686 analysis). The riscv64-motivated implementation work is dominated by CI infrastructure and build image work, not Kubernetes source code.

The immediate code-level work items are:

1. Add `linux/riscv64` to platform arrays in `hack/lib/golang.sh` -- 4 line additions
2. Add riscv64 to `build/pause/Makefile` -- 2 line additions
3. Add riscv64 to `cluster/images/etcd/Makefile` -- 2-3 line additions
4. Update `hack/lib/util.sh` host arch detection -- 1 line
5. Update `test/images/image-util.sh` QEMU map -- 1 line
6. Update `test/typecheck/main.go` -- 1 line
7. Update kube-cross Dockerfile (kubernetes/release) -- install `crossbuild-essential-riscv64`, add to `KUBE_CROSSPLATFORMS`

The riseproject-dev/kubernetes-riscv `riscv-support` branch (brianredbeard) is being prepared covering these items. Effort to prepare and submit a clean upstream-mergeable PR is estimated at 2-4 person-weeks including maintainer iteration.

### 13.2 Performance Optimization

No performance work is required to reach Tier 3 or Tier 2. Performance optimization (SIMD, JIT) is not applicable to Kubernetes core -- the project is written in pure Go with no architecture-specific code paths. Kubernetes performance on riscv64 will be hardware-bound (instruction throughput, memory bandwidth) and container runtime-bound (containerd, runc), not Kubernetes-code-bound.

Data not available: quantitative latency or throughput comparison between riscv64 and arm64 for Kubernetes workloads. No benchmarks exist in any public source.

### 13.3 CI/CD Infrastructure

This is the hardest item and the reason prior attempts stalled. The following CI items are needed to reach Tier 2 (informing CI, non-blocking):

1. Provision native riscv64 build machines in the Kubernetes CI cluster (Prow on GCP/AWS). The RISE RISC-V Runner service provides free GitHub Actions runners; these are GitHub Actions, not Prow. Integrating RISE runners with Prow's autoscaling would require engineering work on both sides.
2. Add riscv64 Prow job definitions in kubernetes/test-infra covering at minimum: cross-build, kubelet unit tests, and conformance tests.
3. Address CI job execution time -- one riscv64 job run was reported at 10+ hours [NEEDS VERIFICATION]. Hardware performance and QEMU emulation both contribute. Native hardware is required for sub-1-hour CI.

Tier 3 requires none of this -- it requires only a documented external build process with no Prow integration.

### 13.4 Ecosystem Enablement

Two dependency gaps require investment to fully enable a deployable cluster:

- **etcd:** No riscv64 release binaries exist. The etcd team must add riscv64 to its release pipeline. This is a separate project with separate maintainers. Without riscv64 etcd release binaries, a standard Kubernetes installation is not possible regardless of Kubernetes build status.
- **CRIU:** No riscv64 support since issue opened in 2021. Checkpoint/restore for pods is unavailable. This is a separate project (checkpoint-restore/criu) requiring platform bring-up work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Submit riscv64 platform PR to kubernetes/kubernetes (build system + pause image) | 2-4 | RISE / brianredbeard | Critical |
| Functional | Update kube-cross image to include `riscv64-linux-gnu-gcc` (kubernetes/release) | 1-2 | RISE / kubernetes/release maintainers | Critical |
| Functional | Add riscv64 to etcd release pipeline | 4-8 | etcd maintainers (external) | Critical |
| Functional | Publish official riscv64 Kubernetes container images to registry.k8s.io | 2-4 | SIG K8s Infra | High |
| Process | Engage SIG Release for Tier 3 designation (documented build process) | 1-2 | RISE | High |
| CI | Integrate RISE RISC-V Runners with upstream Prow for informing (Tier 2) CI | 8-16 | RISE + SIG K8s Infra | High |
| CI | Add riscv64 Prow job definitions in kubernetes/test-infra | 2-4 | RISE + SIG Testing | High |
| Ecosystem | CRIU riscv64 port (platform bring-up) | 16-32 | CRIU maintainers / separate investment | Medium |
| Performance | Data not available: benchmarks required before scoping optimization work | N/A | N/A | Low |

---

## 14. Updates

No updates -- initial report dated 2026-06-17.

---

## 15. References

- [kubernetes/kubernetes repository](https://github.com/kubernetes/kubernetes)
- [Issue #132836 -- Proposal: Official Support for RISC-V Architecture and RVA23 Advancements](https://github.com/kubernetes/kubernetes/issues/132836)
- [Issue #132570 -- Assessment of the difficulty in porting CPU architecture for kubernetes](https://github.com/kubernetes/kubernetes/issues/132570)
- [PR #86013 -- Bump Ginkgo to support building on riscv64 arch (MERGED, v1.18)](https://github.com/kubernetes/kubernetes/pull/86013)
- [PR #128148 -- Dependences: update opencontainers/selinux to v1.11.1 (MERGED, v1.32)](https://github.com/kubernetes/kubernetes/pull/128148)
- [PR #86011 -- Add build support for riscv64 arch (CLOSED)](https://github.com/kubernetes/kubernetes/pull/86011)
- [PR #82349 -- Bump x/sys and opencontainers/runc to support Risc-V architecture (CLOSED)](https://github.com/kubernetes/kubernetes/pull/82349)
- [PR #116686 -- feat: add riscv64 support (CLOSED)](https://github.com/kubernetes/kubernetes/pull/116686)
- [PR #123661 -- Add riscv64 support (CLOSED)](https://github.com/kubernetes/kubernetes/pull/123661)
- [kubernetes/release PR #4303 -- add debian trixie and riscv64 support for debian-base (CLOSED)](https://github.com/kubernetes/release/pull/4303)
- [kubernetes/sig-release PR #2974 -- Rewrite platform support tiers documentation (MERGED 2026-03-26)](https://github.com/kubernetes/sig-release/pull/2974)
- [hack/lib/golang.sh -- authoritative platform list](https://github.com/kubernetes/kubernetes/blob/master/hack/lib/golang.sh)
- [kubernetes/sig-release platform support guide](https://github.com/kubernetes/sig-release/blob/master/release-engineering/platforms/README.md)
- [carlosedp/riscv-bringup Kubernetes notes](https://github.com/carlosedp/riscv-bringup/blob/master/kubernetes/Readme.md)
- [riseproject-dev/kubernetes-riscv riscv-support branch](https://github.com/kubernetes/kubernetes/compare/master...riseproject-dev:kubernetes-riscv:riscv-support)
- [RISE Project blog -- Announcing RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project blog -- RISC-V Runners six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [buildd.debian.org kubernetes riscv64 status](https://buildd.debian.org/status/package.php?p=kubernetes)
- [packages.debian.org kubectl riscv64](https://packages.debian.org/sid/riscv64/kubectl)
- [etcd PR #21510 -- remove ETCD_UNSUPPORTED_ARCH for riscv64 (MERGED 2026-03-29)](https://github.com/etcd-io/etcd/pull/21510)
- [criu issue #1702 -- riscv64 support (OPEN since 2021)](https://github.com/checkpoint-restore/criu/issues/1702)
- [CARV-ICS-FORTH/kubernetes-riscv64](https://github.com/CARV-ICS-FORTH/kubernetes-riscv64)
- [alitariq4589/kubernetes-riscv releases](https://github.com/alitariq4589/kubernetes-riscv/releases)