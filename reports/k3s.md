---
title: k3s
categories:
  - containers
---

# k3s

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for k3s<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

k3s is a lightweight, CNCF Sandbox-level Kubernetes distribution created by Rancher Labs (now SUSE). It packages an embedded Kubernetes control plane, containerd, etcd, flannel, CoreDNS, Traefik, and a local storage provisioner into a single static binary under 100 MB. Its primary use cases are edge computing, IoT, and resource-constrained environments -- making RISC-V hardware an architecturally relevant target.

The project is licensed Apache-2.0. The Linux Foundation holds the trademark. Governance is documented in MAINTAINERS and GOVERNANCE.md and administered by a Maintainer Council under CNCF Technical Oversight Committee oversight. As of the current research, all listed maintainers are SUSE employees except for one SAP-affiliated community manager. Top contributors by commit count are brandond (1067), erikwilson (697), dereknola (420), and ibuildthecloud (338).

k3s officially releases binaries and container images for three architectures: amd64, arm64, and armhf (arm32/ARMv7). The README also references s390x as supported in downloads. RISC-V (riscv64) is not in any official release.

---

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2022-08-22 | [Issue #6022](https://github.com/k3s-io/k3s/issues/6022): community user reports running a custom-compiled riscv64 k3s v1.21.11 under QEMU, hitting an HTTP 403 on metrics-server scraping. First documented riscv64 usage. |
| 2023-03-27 | [Issue #7151](https://github.com/k3s-io/k3s/issues/7151) opened requesting official riscv64 support. Maintainer brandond repurposes it as the official tracking issue and states: "This has not been prioritized, and we don't have any build infra for riscv64, so at the moment this will be purely experimental." |
| 2023-05-12 | brandond states: "we don't have any hardware for CI or QA so we probably won't have official support any time soon." |
| 2023-06-14 | [PR #7778](https://github.com/k3s-io/k3s/pull/7778) opened by chazapis (CARV-ICS-FORTH): build and packaging script changes for riscv64 cross-compilation. No Kubernetes or k3s runtime code changes. PR remains open as of 2026. |
| 2023-07-21 | chazapis confirms k3s-root v0.13.0 and runc v1.1.8 both support riscv64; tests a full single-node cluster on QEMU using custom-built images from carvicsforth/ Docker Hub. |
| 2023-09-11 | brandond tests PR #7778 on a three-node cluster of SiFive Unmatched boards running openSUSE Tumbleweed (kernel 6.4.12, k3s v1.28.1+k3s1). Nodes reach Ready state with label `kubernetes.io/arch=riscv64`. No workload pods run due to missing official riscv64 container images. |
| 2024-03 | [PR #9719](https://github.com/k3s-io/k3s/pull/9719) by dereknola (SUSE): bumps go-libp2p to fix TCP build failure on riscv64. Receives two maintainer approvals. Closed 2024-04-03 when [PR #9863](https://github.com/k3s-io/k3s/pull/9863) (Bump spegel to v0.0.20-k3s1) is merged instead, incorporating the same change. |
| 2024-10-02 | chazapis reports that CoreDNS, Local Path Provisioner, Helm, and Traefik now ship official riscv64 images. Remaining exceptions: klipper-helm and klipper-lb. |
| 2026-01-18 | mmoll asks for status on PR #7778. pgonin notes: "The CNCF does not provide RISC-V build runners as part of its 'standard' service to projects." |
| 2026-03-24 | Draft [PR #13854](https://github.com/k3s-io/k3s/pull/13854) by luhenry: adds GitHub Actions CI configuration for linux-riscv64 using RISE RISC-V Runners. No source code changes. CI run documents 10-11x build slowdown vs arm64. |
| 2026-04-11 | [Issue #13910](https://github.com/k3s-io/k3s/issues/13910) by pgonin: proposes installing the RISE RISC-V Runners GitHub App on the k3s-io organization. |
| 2026-04-28 | luhenry notes CNCF gave informal go-ahead to engage k3s maintainers on RISE runner usage. |
| 2026-06-05 | luhenry comments that faster Scaleway hardware (EM-RV1 class) is being provisioned through agreements with Spacemit, Scaleway, Canonical, and RISE; expects online by end of July 2026. k3s listed in the "high priority bucket." [NEEDS VERIFICATION] |

The CARV-ICS-FORTH work (PR #7778) is funded by EU Horizon Europe programs RISER, AERO, and REBECCA. [NEEDS VERIFICATION]

---

## 3. Upstream Support Tier

k3s has no published formal tier or maturity policy for architecture support. The implicit policy, stated explicitly by brandond in multiple comments, is that an architecture must have CI runners (CNCF-provided or otherwise) before being included in the release pipeline.

Current classification by architecture:

| Architecture | Status |
|---|---|
| amd64 | Official, fully released |
| arm64 | Official, fully released |
| armhf (arm32) | Official, fully released |
| s390x | Official in install.sh, unclear release artifact status |
| riscv64 | Experimental, no official release, no CI |

riscv64 has been explicitly labeled "purely experimental" by maintainers since the tracking issue was opened in 2023. The tracking issue ([#7151](https://github.com/k3s-io/k3s/issues/7151)) carries milestone "Backlog" and label "arch/other" and is listed as "Working" on the K3s Development project board as of 2026 -- meaning someone is working on it, not that it is done.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

k3s is a pure Go application. It has zero assembly source files (`.S`), zero `arch/riscv/` directories, zero JIT backends, zero SIMD dispatch, and zero RVV intrinsics (`vfloat32m1_t`, `rvv`, etc.). No Go source files carry `//go:build riscv64` build constraints. Architecture-specific behavior in the Go runtime (instruction scheduling, register allocation, memory model) is handled entirely by the Go toolchain at compile time.

There are no RISC-V ISA extension optimizations planned or present: no RVV, no Zba, no Zbb, no Zkn, no Zvk tuning anywhere in the k3s codebase or its build configuration.

The only riscv64-specific content that exists in the k3s-io/k3s master branch today is:

- `scripts/version.sh`: a `case ${ARCH}` block includes `riscv64` with SHA256 `3b76a4a5bfc5c8623702a3b99e3015cd36b0336dd73c7ba4a765d018dc5a9685` for the k3s-root v0.15.2 tarball download. This is the only riscv64 string in the main branch.
- `scripts/download`: uses `${K3S_ROOT_SHA256}` set by `version.sh` to fetch and verify `k3s-root-riscv64.tar`; this path is functional for riscv64 if `ARCH=riscv64` is set.

Everything else in PR #7778 (build script changes, install.sh detection, Drone CI pipeline, cross-compilation environment) is not merged.

---

## 5. Build System, Cross-Compilation, and Toolchain

k3s uses no cmake. It is a pure Go plus Buildroot project.

**Main build chain:**

| Layer | Tool | Version |
|---|---|---|
| Go | Go toolchain | 1.26.2 minimum (go.mod: `go 1.26.2`) |
| Container build | Docker Buildx | `DOCKER_BUILDKIT=1` required |
| Build container | `golang:1.26.4-alpine3.22` | Produces statically linked binary |
| Static linking | musl-libc via Buildroot | `ENV STATIC_BUILD=true` in Dockerfile.local |
| Build orchestration | Makefile | invokes Docker-based scripts |

Go build tags used: `ctrd netcgo osusergo providerless urfave_cli_no_docs sqlite_omit_load_extension apparmor seccomp` (plus `static` when `STATIC_BUILD=true`).

**k3s-root (separate dependency repo: k3s-io/k3s-root):**

k3s-root builds the userspace root filesystem bundled into k3s. riscv64 was added in v0.13.0 ("Added RISC-V support"). The Makefile sets `ALL_ARCH = amd64 arm64 arm riscv64`. The Buildroot configuration for riscv64 (`buildroot/riscv64config`) sets:

```
BR2_riscv=y
BR2_RISCV_64=y
BR2_GCC_TARGET_ARCH="riscv64"
BR2_ENDIAN="LITTLE"
BR2_OPTIMIZE_S=y    (-Os, size optimization)
BR2_STATIC_LIBS=y
BR2_TOOLCHAIN_BUILDROOT_MUSL=y
BR2_GCC_VERSION="14.3.0"
```

No ISA extension flags are set (no `BR2_RISCV_ISA_RVV`, no Zba, Zbb, Zbc, etc.). The shared config (`buildroot/config`) uses GCC 14.3.0, binutils 2.44, and kernel headers 6.6.101. The Buildroot toolchain builds a `riscv64-buildroot-linux-musl` cross-compiler from source inside a `registry.suse.com/bci/bci-base:16.0` container using host gcc-15.

k3s-root v0.15.2 ships `k3s-root-riscv64.tar` (10.2 MB) and `k3s-root-xtables-riscv64.tar` (1.81 MB) as release assets. [NEEDS VERIFICATION for exact sizes]

**Building k3s for riscv64 today (manually, not via CI):**

The developer-facing build command documented in PR #7778 is:
```
ARCH=riscv64 SKIP_VALIDATE=true SKIP_IMAGE=true SKIP_AIRGAP=true make
```

This works because:
1. `scripts/version.sh` has the riscv64 SHA256 hash.
2. `scripts/build` falls through to the default Go build path (no riscv64-specific block), which works for a pure-Go build when `GOARCH=riscv64` is set.
3. `scripts/package-cli` falls through to the default `"-${ARCH}"` suffix.

QEMU support: the k3s CI uses QEMU only for arm (armv7). For riscv64, no QEMU step is wired anywhere. A developer can use `docker run --privileged tonistiigi/binfmt --install riscv64` to enable QEMU-based cross-builds on non-riscv64 hosts, but this is not documented upstream.

**What is in PR #7778 but not merged:**

| File | Change |
|---|---|
| `install.sh` | Adds `riscv64)` case to `setup_verify_arch()` |
| `scripts/build` | Adds `riscv64` block: `GOARCH=riscv64`, sets cross-compiler `CC` and `PKG_CONFIG_PATH` |
| `scripts/ci` | Calls `./prepare-cross` when `ARCH=riscv64` |
| `scripts/package-cli` | Adds riscv64 suffix handling and `GOARCH` export |
| `scripts/prepare-cross` | New file: sets up Alpine-based cross-compilation environment for riscv64 |
| `scripts/binary_size_check.sh` | Adds riscv64 binary size threshold |
| `.drone.yml` | Adds riscv64 build and release pipeline steps |
| `Dockerfile.dapper` | Adds `ARCH` to `DAPPER_ENV` |

Cross-compiling riscv64 on arm64 is slightly faster than on amd64, per a reviewer comment on PR #13854 (shanduur). [NEEDS VERIFICATION]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The table below covers functional features that differ in availability for riscv64 vs the two tier-1 architectures.

| Feature | amd64 | arm64 | riscv64 | Gap Description |
|---|---|---|---|---|
| Official release binary | Yes | Yes | No | Never shipped; install.sh calls `fatal` on riscv64 |
| install.sh support | Yes | Yes | No | `setup_verify_arch()` does not include riscv64; PR #7778 not merged |
| Default storage class (local-path-provisioner) | Yes | Yes | No (partial history) | PR #346 (rancher/local-path-provisioner) closed abandoned Sep 2024; Oct 2024 comment in PR #7778 says Rancher began shipping the image -- the current state is contradictory [NEEDS VERIFICATION] |
| Default ingress (Traefik) | Yes | Yes | Partial | Merged into GoReleaser config in Traefik v2.10 (2023); a "no space left on device" CI failure blocked binary distribution at the v2.10.4 release; v3.x artifact availability is unconfirmed |
| Default DNS (CoreDNS) | Yes | Yes | Yes | [PR #6195](https://github.com/coredns/coredns/pull/6195) merged Jul 2023; `coredns_*.linux_riscv64.tgz` ships in releases |
| Helm (HelmChart CRD) | Yes | Yes | Yes | [PR #12204](https://github.com/helm/helm/pull/12204) merged, released in Helm 3.14.0 (Jan 2024); test suite not fully passing on riscv64 |
| klipper-helm | Yes | Yes | No | [k3s-io/klipper-helm#64](https://github.com/k3s-io/klipper-helm/pull/64) open |
| klipper-lb | Yes | Yes | No | [k3s-io/klipper-lb#56](https://github.com/k3s-io/klipper-lb/pull/56) open |
| pause image (rancher/mirrored-pause) | Yes | Yes | No | CI run in PR #13854 shows `"no match for platform in manifest: not found"` for `rancher/mirrored-pause:3.6` |
| rancher/systemd-node | Yes | Yes | No | PR #13854 CI: `"Unable to find image 'rancher/systemd-node:v0.0.8'"` -- 7 CI jobs blocked |
| Pod checkpoint/restore (CRIU) | Yes | Partial | No | [criu/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since 2021; not a blocker for basic cluster operation |
| Airgap bundle | Yes | Yes | No | `scripts/manifest` hard-codes `PLUGIN_PLATFORMS="linux/amd64,linux/arm64,linux/arm"`; riscv64 absent |
| CI (automated build + test) | Yes | Yes | No | All 18 workflow files in `.github/workflows/` target only amd64, arm64, arm; zero riscv64 references in master |

The `rancher/mirrored-pause:3.6` gap is the most operationally severe: every pod sandbox depends on the pause image. Without it, no workload pods can be scheduled, making any riscv64 k3s cluster inoperable for user workloads even if the cluster control plane initializes successfully.

---

## 7. CI/CD Infrastructure

All 18 workflow files in `.github/workflows/` were verified against the master branch. The string "riscv" does not appear in any file. Architecture coverage in the relevant workflows:

| Workflow | Architectures |
|---|---|
| `build-k3s.yaml` | amd64, arm64, arm only (stated in input description) |
| `airgap.yaml` | amd64, arm64, arm only |
| `e2e.yaml` | amd64, arm64 only |
| `release.yml` | `linux/amd64, linux/arm64, linux/arm/v7` only |
| `install.yaml` | amd64 only |
| `integration.yaml` | amd64 only |
| `nightly-install.yaml` | amd64 only |
| `validate.yaml` | amd64 only |

There are no QEMU riscv64 emulation steps, no `ubuntu-24.04-riscv` runner references, and no `linux/riscv64` Docker platform strings anywhere in the CI configuration.

Draft [PR #13854](https://github.com/k3s-io/k3s/pull/13854) proposes adding riscv64 to `build-k3s.yaml` and `e2e.yaml` using RISE RISC-V Runners (`ubuntu-24.04-riscv`, Scaleway EM-RV1 hardware). It has zero reviews, zero approvals, and has not been merged. Its own CI run (https://github.com/luhenry/k3s/actions/runs/23554260675) shows 15 failures, all riscv64-specific. All amd64 and arm64 jobs passed in the same run.

CI failure breakdown from PR #13854:

| Root Cause | Affected Jobs |
|---|---|
| Missing `rancher/systemd-node:v0.0.8` riscv64 image | 7 |
| Missing `rancher/mirrored-pause:3.6` riscv64 manifest | 4 |
| Missing prior k3s release images for riscv64 (`v1.34.5-k3s1`, `v1.35.2-k3s1`) | 2 |
| `DeterminateSystems/nix-installer-action` missing `RISCV64-Linux` platform mapping | 1 |
| Test setup bug -- config file not created before bind mount | 1 |

The Nix installer issue was diagnosed by luhenry as a bug in `DeterminateSystems/detsys-ts` and an upstream fix PR (DeterminateSystems/detsys-ts#172) was opened. The test setup bug was fixed in the RISE runner app. [NEEDS VERIFICATION for fix status of both]

[Issue #13910](https://github.com/k3s-io/k3s/issues/13910) (Apr 2026) requests that a k3s-io organization-level administrator install the RISE RISC-V Runners GitHub App. No maintainer response is recorded. This is a prerequisite for merging PR #13854.

The CNCF does not provide riscv64 build runners as part of its standard service to projects (confirmed by pgonin in issue #7151 comments, Jan 2026). The current CI runners for arm64 and amd64 are CNCF-hosted (`cncf-ubuntu-16-64-arm`, `cncf-ubuntu-16-64-x86`). riscv64 would require the third-party RISE runner service or equivalent.

---

## 8. Distribution and Release Status

**GitHub Releases (k3s-io/k3s):**

The five most recent releases checked (v1.36.2-rc1+k3s1 through v1.36.1+k3s1) each have exactly 16 assets covering three architectures: amd64, arm64, armhf. No asset containing "riscv64" or "riscv" exists in any release. The SHA256 sum files (`sha256sum-amd64.txt`, `sha256sum-arm.txt`, `sha256sum-arm64.txt`) confirm the closed architecture list.

**Official install script (https://get.k3s.io):**

The `setup_verify_arch()` function covers `amd64/x86_64`, `arm64/aarch64`, `arm*`, and `s390x`. Any other architecture, including riscv64, triggers `fatal "Unsupported architecture $ARCH"`. The script aborts.

**Linux distribution packaging:**

| Distribution | k3s packaged? | riscv64 path |
|---|---|---|
| Ubuntu 24.04 (Noble) | No | N/A |
| Debian (all suites) | No | N/A |
| Arch Linux RISC-V (archriscv.felixc.at) | No | Not in core/extra; not in AUR for this arch |
| PyPI | No (k3s is a Go binary) | N/A |

k3s is not packaged by any major Linux distribution. There is no distro-provided riscv64 path.

The only riscv64-capable k3s binaries that exist are developer builds produced from PR #7778 by individual contributors, not from any official source.

---

## 9. Dependencies

The table below covers k3s's critical dependencies and their riscv64 status, based on the research findings.

| Dependency | Role | riscv64 Build | riscv64 Release Artifacts | Blocking Issues |
|---|---|---|---|---|
| Go runtime | Primary language runtime | Yes, first-class since Go 1.22 (experimental since 1.14) | Yes, every Go release | None |
| k3s-io/kubernetes fork (v1.36.2-k3s1) | Embedded control plane and kubelet | Buildable manually | No | kube-cross image lacks `riscv64-linux-gnu-gcc`; no official pause image; no riscv64 in `hack/lib/golang.sh` platform arrays |
| k3s-io/containerd fork (v2.3.1-k3s2) | Default CRI, container lifecycle | Yes | Yes -- upstream containerd v2.3.2 ships `containerd-*-linux-riscv64.tar.gz` | CI gap: [#13020](https://github.com/containerd/containerd/issues/13020) and [#13124](https://github.com/containerd/containerd/pull/13124) open (Mar 2026); CRIU checkpoint unavailable |
| opencontainers/runc (v1.4.2) | OCI low-level container runtime | Yes | Yes -- `runc.riscv64` confirmed per [PR #5166](https://github.com/opencontainers/runc/pull/5166) scope | [#3950](https://github.com/opencontainers/runc/issues/3950) (open): musl static build broken on riscv64 |
| k3s-io/etcd fork (v3.6.12-k3s1) | Embedded key-value store | Yes -- [PR #21510](https://github.com/etcd-io/etcd/pull/21510) removed `ETCD_UNSUPPORTED_ARCH` workaround, merged Mar 2026 | No -- upstream etcd v3.6.12 ships no riscv64 binaries | No upstream riscv64 release binary; k3s builds etcd from its own fork source, partially mitigating this |
| k3s-io/kine (v0.16.1) | etcd shim (SQLite/Postgres/MySQL alternative) | Yes -- [PR #297](https://github.com/k3s-io/kine/pull/297) merged Feb 2025 | Yes -- multiplatform CI including riscv64 merged in [PR #462](https://github.com/k3s-io/kine/pull/462) Apr 2025 | None |
| flannel-io/flannel (v0.28.4) | Default CNI networking (VXLAN/WireGuard) | Yes -- [PR #1824](https://github.com/flannel-io/flannel/pull/1824) merged 2023 | Yes -- multi-arch images including riscv64 | Subsequent build failures [#1988](https://github.com/flannel-io/flannel/issues/1988), [#1853](https://github.com/flannel-io/flannel/issues/1853) closed as wontfix; riscv64 support is best-effort |
| containernetworking/plugins (v1.9.1) | CNI plugins (bridge, loopback, portmap) | Yes -- [PR #739](https://github.com/containernetworking/plugins/pull/739) merged May 2022 | Yes -- `cni-plugins-linux-riscv64-v1.9.1.tgz` confirmed working per PR #7778 | None |
| coredns/coredns | Cluster DNS | Yes -- [PR #6195](https://github.com/coredns/coredns/pull/6195) merged Jul 2023 | Yes -- `coredns_*.linux_riscv64.tgz` ships in releases | None |
| traefik/traefik (default ingress) | Ingress and reverse proxy | Yes -- [PR #10026](https://github.com/traefik/traefik/pull/10026) merged Jul 2023 (v2.10) | Partial -- added to GoReleaser in v2.10 but a "no space left on device" CI failure removed riscv64 from the v2.10.4 release; v3.x status unconfirmed | CI infrastructure failure prevented distribution at initial merge; v3.x riscv64 artifact availability requires verification |
| rancher/local-path-provisioner | Default storage class | No -- [PR #346](https://github.com/rancher/local-path-provisioner/pull/346) closed abandoned Sep 2024 | No | Hard gap for any riscv64 k3s user; default storage class is inoperable (contradictory Oct 2024 note in PR #7778 thread; see Section 6) |
| helm (via helm-controller) | HelmChart CRD management | Yes -- [PR #12204](https://github.com/helm/helm/pull/12204) merged, Helm 3.14.0 Jan 2024 | Yes -- Helm 3.14.0+ ships riscv64 binaries | Test suite not fully passing on riscv64 |
| k3s-io/klipper-helm | Helm chart job runner | No | No | [k3s-io/klipper-helm#64](https://github.com/k3s-io/klipper-helm/pull/64) open |
| k3s-io/klipper-lb | Service load balancer | No | No | [k3s-io/klipper-lb#56](https://github.com/k3s-io/klipper-lb/pull/56) open |
| golang.org/x/crypto (v0.47.0) | TLS, SSH, certificate management | Yes, pure Go | Yes | None |
| modernc.org/sqlite (v1.51.0) | Pure-Go SQLite for kine | Yes, pure Go (no CGO) | Yes | None |
| go.etcd.io/bbolt (v1.4.3) | Embedded B-tree key-value store | Yes -- [PR #666](https://github.com/etcd-io/bbolt/pull/666) added riscv64 `MaxMapSize` constant | Yes, pure Go | None |
| OpenSSL (via CGO in containerd/runc TLS) | TLS and crypto primitives | Yes -- comprehensive RISC-V assembly (Zkn, Zksh, Zvk, RVV, ChaCha20) since 2022, active through 2026 | Yes | None |

**Hard blockers for a deployable riscv64 k3s cluster:**

1. k3s ships no riscv64 release binary and the installer explicitly aborts on riscv64.
2. `rancher/mirrored-pause:3.6` has no riscv64 manifest entry. Every pod sandbox creation fails.
3. `rancher/systemd-node:v0.0.8` has no riscv64 image. Seven categories of CI integration tests fail.
4. `klipper-helm` and `klipper-lb` have no riscv64 images (PRs open).
5. `local-path-provisioner` has no official riscv64 support (PR abandoned; current state contradictory -- see Section 6).
6. Prior k3s release images for riscv64 do not exist, blocking upgrade and skew tests.
7. Traefik v3.x riscv64 binary availability is unconfirmed.

---

## 10. Ecosystem Status

**RISE Project involvement:**

The RISE Project (Linux Foundation) operates a free managed GitHub Actions runner service providing real RISC-V hardware (Scaleway EM-RV1 nodes running Ubuntu 24.04) to open source projects. RISE Premier members include Google, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent.

A RISE blog post from May 2026 ("RISE RISC-V Runners: Six Weeks In") lists k3s as an "engagement target" alongside Kubernetes and containerd. The phrase "engagement target" means the RISE team intends to help bring these projects to riscv64; it does not mean funded work has started or that deliverables exist. No RISE-sponsored k3s PR, dedicated repository, or committed milestone was found. The `riseproject-dev` GitHub organization contains no k3s repository.

The connection between RISE and k3s is through luhenry (the author of draft PR #13854), who is associated with the RISE Runners initiative. SUSE (the k3s maintainer organization) is not listed as a RISE member.

RISE does maintain `riseproject-dev/kubernetes-riscv`, a fork of upstream Kubernetes with a `v1.36.0-riscv64` release. k0s (a competing lightweight Kubernetes distribution) has an open PR (#7414) for nightly RISC-V builds via RISE Runners. k3s does not.

**k3s-root (the userspace dependency):**

riscv64 support is fully integrated in k3s-root since v0.13.0. The v0.15.2 release (the version referenced by k3s master) ships official riscv64 tarballs. This is the one area where riscv64 is treated identically to other architectures in the official release pipeline.

**Hardware validation:**

A three-node k3s cluster on SiFive Unmatched boards (brandond, Sep 2023) confirmed the cluster control plane forms and nodes reach Ready state. No user workload pods were able to run due to missing container images. A single-node cluster on QEMU (chazapis, Jul 2023) ran pods successfully using community-maintained images from carvicsforth/ Docker Hub.

No external benchmark papers, slides, or dedicated performance repositories were found. All quantitative performance data comes from the CI PR comment thread.

---

## 11. Known Bugs and Active Issues

**Open issues and PRs:**

| ID | Title | Status | Priority Impact |
|---|---|---|---|
| [#7151](https://github.com/k3s-io/k3s/issues/7151) | Add support for riscv64 architecture (tracking) | Open, Backlog | Master tracking; no schedule |
| [#7778](https://github.com/k3s-io/k3s/pull/7778) | Add support for RISC-V (build scripts) | Open, not merged since Jun 2023 | Core enablement; blocked by image gaps and install.sh.sha256sum update |
| [#13854](https://github.com/k3s-io/k3s/pull/13854) | [Experiment] Add CI on linux-riscv64 | Draft, no reviews | CI prerequisite for merging #7778 |
| [#13910](https://github.com/k3s-io/k3s/issues/13910) | Add native riscv64 CI using RISE Runners | Open, Working | Organizational prerequisite for #13854 |
| [k3s-io/klipper-helm#64](https://github.com/k3s-io/klipper-helm/pull/64) | Add riscv64 support | Open | Blocks Helm CRD functionality |
| [k3s-io/klipper-lb#56](https://github.com/k3s-io/klipper-lb/pull/56) | Add riscv64 support | Open | Blocks LoadBalancer service type |

**Active correctness failures (from PR #13854 CI run):**

- `"no match for platform in manifest: not found"` on `rancher/mirrored-pause:3.6` -- blocks all pod sandboxes, causes timeouts in etcd, basics, bootstraptoken, and cacerts jobs.
- `"Unable to find image 'rancher/systemd-node:v0.0.8'"` -- blocks hardened, autoimport, snapshotrestore, dualstack, svcpoliciesandfirewall, secretsencryption, and token jobs.
- `"bind source path does not exist: /tmp/k3s-test-.../server-0.yaml"` in lazypull test -- test environment setup bug; reportedly fixed in RISE runner app. [NEEDS VERIFICATION]
- `"ArchOs (RISCV64-Linux) doesn't map to a supported Nix platform"` in nixsnapshotter -- upstream fix PR opened by luhenry. [NEEDS VERIFICATION for merge status]

**Closed issues:**

[Issue #6022](https://github.com/k3s-io/k3s/issues/6022): HTTP 403 on metrics-server scraping in a custom riscv64 QEMU build (k3s v1.21.11). Closed with no public comments; attributed to RBAC misconfiguration in the custom setup, not an upstream k3s bug.

---

## 12. Objections and Upstream Blockers

**Maintainer position (brandond, multiple statements 2023-2026):**

1. No RISC-V CI runners provided by CNCF. The CNCF standard runner fleet does not include riscv64 hardware. Any riscv64 CI must come from a third-party provider (RISE Runners) or dedicated hardware. This requires a GitHub organization-level action (installing the RISE Runners GitHub App on k3s-io) that only an org administrator can perform.

2. Rancher image-mirror infrastructure does not support riscv64. The mirror scripts that populate official Rancher images (including pause, systemd-node, klipper-helm, klipper-lb) explicitly filter out riscv64. Until this changes, even a merged k3s riscv64 build cannot run user workloads.

3. The build toolchain (Dapper) has no riscv64 release. Dapper is used for hermetic builds; without a riscv64 Dapper binary, the build pipeline is not fully reproducible. [NEEDS VERIFICATION -- identified as a blocker in Jan 2026 comments; current status unclear]

4. flannel riscv64 build failures are marked wontfix by the flannel maintainers. The default CNI backend has best-effort riscv64 support with no guarantee of forward compatibility.

5. riscv64 hardware build times are 10-11x slower than arm64 for CPU-bound compilation (median 10.2x, p90 15.5x, max 42x from PR #13854 measurements). This significantly increases CI resource cost per job.

**What needs to happen before official support is feasible:**

| Prerequisite | Owner | Status |
|---|---|---|
| RISE Runners GitHub App installed on k3s-io org | k3s-io org admin | Open (Issue #13910) |
| `rancher/mirrored-pause:3.6` riscv64 manifest | Rancher | Missing |
| `rancher/systemd-node` riscv64 image | Rancher | Missing |
| `klipper-helm` riscv64 image | SUSE/Rancher | PR #64 open |
| `klipper-lb` riscv64 image | SUSE/Rancher | PR #56 open |
| `rancher/image-mirror` riscv64 support | Rancher | Not addressed |
| Prior k3s release images for riscv64 | Rancher | Missing (blocks upgrade tests) |
| PR #7778 reviewed and merged | k3s maintainers | Open since Jun 2023, no active review |
| PR #13854 drafted into reviewable state | luhenry | Draft |
| Traefik v3.x riscv64 artifact confirmation | Traefik | Unverified |

None of these prerequisites is controlled solely by an external contributor. The Rancher/SUSE image infrastructure items require internal SUSE engineering action.

---

## 13. Investment Analysis

The following analysis is based on the gap analysis in Sections 6-12. Effort estimates are rough engineering approximations and should be validated with the engineering team before resource commitment.

### 13.1 Functional Enablement

Getting k3s to the point where a developer can install it on riscv64 hardware via the standard installer and schedule user pods requires the following work:

1. **Install script riscv64 support** (PR #7778, partially done): Add `riscv64` to `setup_verify_arch()` in `install.sh`. The code exists in PR #7778 but is unreviewed.
2. **Build pipeline riscv64 support** (PR #7778): The build scripts already work implicitly; the PR formalizes cross-compilation tooling. Primary outstanding task is the `install.sh.sha256sum` update (known fix: `sha256sum install.sh &> install.sh.sha256sum`).
3. **klipper-helm and klipper-lb riscv64 images**: PRs are open (k3s-io/klipper-helm#64, k3s-io/klipper-lb#56). These require Rancher image build infrastructure changes.
4. **rancher/mirrored-pause riscv64 manifest**: The pause image gap is the single most critical blocker. This requires adding riscv64 to the Rancher image-mirror infrastructure.
5. **rancher/systemd-node riscv64 image**: Required by seven categories of integration tests.
6. **local-path-provisioner riscv64 image**: Requires a new PR to replace the abandoned PR #346, plus a Rancher image publish.

Items 3-6 are inside the Rancher/SUSE organization. They require an internal decision to add riscv64 to the image build and mirror pipeline.

### 13.2 Performance Optimization

No performance optimization work is warranted at this stage. The 10-11x build slowdown vs arm64 is a hardware characteristic of the current RISE runner generation (Scaleway EM-RV1). It affects CI throughput, not application runtime performance.

No application-level RISC-V performance benchmarks exist (pod startup latency, API server throughput, network I/O). There is no data on which k3s workloads are CPU-bound vs I/O-bound on riscv64 hardware. ISA extension optimization (RVV, Zba, etc.) is not applicable: k3s is a Go application and the Go runtime does not expose riscv64 SIMD intrinsics at the application layer. The crypto dependency (OpenSSL) already ships comprehensive RISC-V assembly optimization.

Performance optimization work should wait until application-level profiling data exists on target hardware.

### 13.3 CI/CD Infrastructure

The primary CI investment is organizational, not engineering:

1. **Install RISE Runners GitHub App on k3s-io org** (Issue #13910): Requires a k3s-io org administrator action. Zero engineering effort; one organizational decision.
2. **Promote PR #13854 from Draft to Ready for Review**: The author (luhenry) is iterating on CI failure fixes. The remaining blockers are primarily the image gaps in 13.1 and caching improvements for build time. Once images are available and caching is tuned, this PR can be promoted.
3. **Faster hardware provisioning**: luhenry noted faster Scaleway hardware is expected to come online by end of July 2026, which should reduce the 10-11x build time multiplier. [NEEDS VERIFICATION]

### 13.4 Ecosystem Enablement

The following dependency gaps require external engagement, not k3s-internal work:

- **flannel wontfix stance**: The flannel project's wontfix on riscv64 build failures means the default k3s CNI is unreliable on riscv64. An alternative CNI (Calico, Cilium, or a fork of flannel with maintained riscv64 support) should be evaluated for riscv64 deployments.
- **Traefik v3.x riscv64 artifacts**: Requires verification against the current release; may need a PR if the GoReleaser migration (May 2026) did not include riscv64.
- **Helm test suite on riscv64**: Test failures are documented but the scope is not fully characterized. Not a blocker for production use but a gap in test coverage.
- **etcd no official release binary**: k3s builds etcd from its own fork source, mitigating this for k3s specifically. No action required within k3s scope.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Install RISE Runners GitHub App on k3s-io org | 0 (org admin action) | k3s-io org admin | Critical |
| Functional | Add riscv64 pause image to rancher/image-mirror | 1-2 | SUSE/Rancher | Critical |
| Functional | Add riscv64 systemd-node image | 1-2 | SUSE/Rancher | Critical |
| Functional | Merge klipper-helm#64 (riscv64 image) | 1 | SUSE/Rancher | High |
| Functional | Merge klipper-lb#56 (riscv64 image) | 1 | SUSE/Rancher | High |
| Functional | Review and merge PR #7778 (build scripts + install.sh) | 1-2 | k3s maintainers | High |
| Functional | local-path-provisioner riscv64 support (new PR) | 2-3 | Community/SUSE | High |
| CI/CD | Promote PR #13854 to ready-for-review | 1-2 | luhenry | High |
| CI/CD | Wire riscv64 into release.yml after CI is stable | 1 | k3s maintainers | Medium |
| Ecosystem | Evaluate and document alternative CNI for riscv64 (flannel wontfix) | 1-2 | Community | Medium |
| Ecosystem | Verify Traefik v3.x riscv64 artifact availability | 0.5 | Community | Medium |
| Performance | Application-level profiling on riscv64 target hardware | 2-4 | Engineering | Low |

Functional enablement (a working riscv64 k3s install with user pods scheduling) requires primarily Rancher/SUSE internal actions on the image build pipeline. The external engineering work in PRs #7778 and #13854 is nearly complete -- the bottleneck is the image-mirror infrastructure decision inside SUSE, not additional code changes.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [k3s-io/k3s Issue #7151 -- riscv64 tracking](https://github.com/k3s-io/k3s/issues/7151)
- [k3s-io/k3s PR #7778 -- Add support for RISC-V](https://github.com/k3s-io/k3s/pull/7778)
- [k3s-io/k3s PR #9719 -- Bump libp2p for riscv support (closed)](https://github.com/k3s-io/k3s/pull/9719)
- [k3s-io/k3s Issue #13910 -- Add native riscv64 CI using RISE RISC-V Runners](https://github.com/k3s-io/k3s/issues/13910)
- [k3s-io/k3s PR #13854 -- [Experiment] Add CI on linux-riscv64](https://github.com/k3s-io/k3s/pull/13854)
- [k3s-io/k3s Issue #6022 -- metrics-server on riscv64 (closed)](https://github.com/k3s-io/k3s/issues/6022)
- [k3s-io/k3s-root -- riscv64config and ALL_ARCH](https://github.com/k3s-io/k3s-root)
- [k3s-io/klipper-helm PR #64](https://github.com/k3s-io/klipper-helm/pull/64)
- [k3s-io/klipper-lb PR #56](https://github.com/k3s-io/klipper-lb/pull/56)
- [k3s-io/kine PR #297 -- riscv64 support](https://github.com/k3s-io/kine/pull/297)
- [k3s-io/kine PR #462 -- multiplatform CI](https://github.com/k3s-io/kine/pull/462)
- [coredns/coredns PR #6195 -- RISC-V support](https://github.com/coredns/coredns/pull/6195)
- [helm/helm PR #12204 -- RISC-V support](https://github.com/helm/helm/pull/12204)
- [traefik/traefik PR #10026 -- RISC-V support](https://github.com/traefik/traefik/pull/10026)
- [flannel-io/flannel PR #1824 -- riscv64 support](https://github.com/flannel-io/flannel/pull/1824)
- [containernetworking/plugins PR #739 -- riscv64 support](https://github.com/containernetworking/plugins/pull/739)
- [etcd-io/etcd PR #21510 -- remove ETCD_UNSUPPORTED_ARCH for riscv64](https://github.com/etcd-io/etcd/pull/21510)
- [rancher/local-path-provisioner PR #346 -- riscv64 (closed abandoned)](https://github.com/rancher/local-path-provisioner/pull/346)
- [opencontainers/runc PR #5166 -- riscv64 CI](https://github.com/opencontainers/runc/pull/5166)
- [etcd-io/bbolt PR #666 -- riscv64 MaxMapSize](https://github.com/etcd-io/bbolt/pull/666)
- [criu/criu Issue #1702 -- RISC-V support (open since 2021)](https://github.com/checkpoint-restore/criu/issues/1702)
- [RISE Project -- Announcing RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project -- RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [riseproject-dev/kubernetes-riscv](https://github.com/riseproject-dev/kubernetes-riscv)