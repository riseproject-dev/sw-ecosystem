---
title: Docker
parent: Project Reports
categories:
  - containers
---

# Docker

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Docker (moby/moby)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Docker Engine (upstream project: [moby/moby](https://github.com/moby/moby)) is the container daemon that underpins Docker Desktop, Docker Hub CI runners, and a large fraction of Kubernetes node runtimes worldwide. The `dockerd` binary manages the full container lifecycle: image pull, container start/stop, network namespace creation, volume management, and seccomp-based syscall filtering.

The project is written almost entirely in Go. C code surfaces only at the boundary with libseccomp (CGO linkage) and in third-party binaries bundled in the release image (tini, runc). The build system is `docker buildx bake` driven by `docker-bake.hcl`, with a thin `make` wrapper. There is no CMake, no autoconf.

Governance is corporate-led by Docker Inc., with committers from Docker Inc., Mirantis, NTT, Microsoft, and individual contributors. The project is Apache 2.0 licensed. Docker Inc. is not a RISE Project member. There is no external foundation (the CNCF hosts containerd and runc separately).

The canonical tracking issue for riscv64 support is [moby/moby#44319](https://github.com/moby/moby/issues/44319), opened October 18, 2022. The enabling PR is [moby/moby#44735](https://github.com/moby/moby/pull/44735), open as a Draft since January 2, 2023 and not yet merged as of June 2026.

---

## 2. Port History and Upstreaming Timeline

All dates are merge dates to moby/moby master unless noted.

| Date | PR | Description | Author | Milestone |
|---|---|---|---|---|
| 2019-07-02 | [#39423](https://github.com/moby/moby/pull/39423) | Update vendor deps (netns, libnetwork, sctp) for riscv64 | carlosedp | 20.10.0 |
| 2019-08-21 | [#39726](https://github.com/moby/moby/pull/39726) | Bump golang.org/x/sys to fix broken epoll on riscv64 | carlosedp | 20.10.0 |
| 2020-04-03 | [#40664](https://github.com/moby/moby/pull/40664) | Add riscv64 to build scripts (hack/make.sh, hack/make/.binary, projectquota.go) | carlosedp | 20.10.0 |
| 2022-05-13 | [#43553](https://github.com/moby/moby/pull/43553) | Add riscv64 to seccomp profile (architecture entry) | AkihiroSuda | 23.0.0 |
| 2023-01-02 | [#44735](https://github.com/moby/moby/pull/44735) | Enable riscv64 cross build (Draft, not merged) | crazy-max | -- |
| 2024-09-10 | [#48455](https://github.com/moby/moby/pull/48455) | Fix seccomp architecture mapping for riscv64 (bugfix) | gdams | 28.0.0 |
| 2026-02 | commit f889c34 | Upgrade Delve to v1.26.0 (adds linux/riscv64 support) | -- | -- |
| 2026-05 | commit 76adc50 | Vendor golang.org/x/sys v0.45.0 (riscv64 zbc extension detection) | -- | -- |

The initial bringup was driven entirely by a single community contributor, **carlosedp** (Carlos de Paula), whose broader [riscv-bringup](https://github.com/carlosedp/riscv-bringup) project coordinated riscv64 porting across the Go ecosystem in 2019. The first Docker Inc. internal contribution was from **tonistiigi** (Tonis Tiigi), who added riscv64 build tags to the bridge network driver in libnetwork in June 2019 [NEEDS VERIFICATION -- this event is in libnetwork, which was later merged into moby; the primary source attributes it to tonistiigi but the merge SHA for libnetwork is not in the moby findings].

The seccomp fix in 2024 ([#48455](https://github.com/moby/moby/pull/48455)) was a correctness bug that had been silently broken since 2022. The 2-year gap before it was fixed reflects the absence of CI on riscv64 -- without native hardware or QEMU runners in the test matrix, the defect was invisible to the project's automated gates.

---

## 3. Upstream Support Tier

Docker does not publish a formal tier policy document for architecture support. Support tiers are implicit, inferred from presence in the release artifact matrix (`_platforms` in `docker-bake.hcl`) and from presence in CI.

**Tier 1 (official release, CI-tested):** linux/amd64, linux/arm64, linux/arm/v5, linux/arm/v6, linux/arm/v7, linux/ppc64le, linux/s390x, windows/amd64. These eight platforms are in the `_platforms`, `binary-smoketest`, and `bin-image-cross` targets in `docker-bake.hcl`. They are built, tested, and released on every merge to master.

**linux/riscv64:** Not in any of the three bake platform lists. No CI exists (see Section 7). No official binary is distributed. Source compiles correctly and a Debian downstream package exists (see Section 8). Effective support tier: build-only community port, not officially supported by Docker Inc.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Docker's riscv64 implementation is fully generic at the Go source code level. There is no architecture-specific assembly, SIMD dispatch, JIT backend, or ISA intrinsics anywhere in moby/moby. The following confirms this by absence:

- No `arch/riscv/` directory.
- No `.S` assembly files in the repository.
- No `_riscv64.go` build-tagged files in the moby/moby source tree (outside vendored dependencies).
- No RVV intrinsics, no riscv64-specific crypto paths.
- No SIMD dispatch in daemon/, pkg/, internal/, or hack/.

The vendored `golang.org/x/sys/unix` dependency contains the expected generated files for riscv64: `asm_linux_riscv64.s`, `syscall_linux_riscv64.go`, `zsysnum_linux_riscv64.go`, `ztypes_linux_riscv64.go`, `zerrors_linux_riscv64.go`. These are auto-generated from Linux kernel headers and contain correct riscv64 ABI constants, syscall numbers, struct layouts, and register definitions.

**Seccomp subsystem (the one area requiring riscv64-specific code):**

`profiles/seccomp/seccomp_linux.go` contains:

- `"riscv64": specs.ArchRISCV64` in the `nativeToSeccomp` map.
- `"riscv64": "riscv64"` in the `goToNative` map.
- riscv64-specific syscalls in `default.json`: `riscv_flush_icache`, `riscv_hwprobe`.

This mapping was added in two steps: architecture entry in PR [#43553](https://github.com/moby/moby/pull/43553) (May 2022) and the correct architecture mapping in PR [#48455](https://github.com/moby/moby/pull/48455) (September 2024). Without the 2024 fix, `includes.arches: ["riscv64"]` rules in the seccomp profile were silently skipped, causing JVM workloads to crash with `RISCV_FLUSH_ICACHE not available` errors.

**Delve debugger:**

riscv64 is listed as a supported Delve platform in the Dockerfile (`DELVE_SUPPORTED` stripping logic). Delve v1.26.0 support was confirmed via commit f889c34 in February 2026.

**Networking:**

No riscv64-specific networking code. The iptables integration is the current blocker for the release pipeline (see Section 12), but this is an incompatibility at the Debian trixie packaging level, not a riscv64-specific code defect.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build tool:** `docker buildx bake` + `docker-bake.hcl`. The Makefile is a thin wrapper. No CMake, no configure.

**Cross-compilation mechanism:** [`tonistiigi/xx`](https://github.com/tonistiigi/xx) (version 1.9.0 pinned in master Dockerfile). For riscv64 on Debian trixie, `xx` adds the Debian Ports keyring, appends `deb [ arch=riscv64 ] http://ftp.ports.debian.org/debian-ports sid main` to apt sources, runs `dpkg --add-architecture riscv64`, and installs cross packages via multiarch notation. This behavior requires Debian >= 13 (trixie); earlier versions skip riscv64 package installation entirely (hardcoded version check: `$(cut -d. -f 1 /etc/debian_version) -lt 13`).

**Why Debian trixie is required:** Debian 12 "bookworm" has no riscv64 packages. Debian 13 "trixie" (released June 2025) is the first stable Debian release with official riscv64. The tracking issue [#44319](https://github.com/moby/moby/issues/44319) was opened in October 2022 specifically because `golang:1.19.2-bullseye` and `debian:bullseye` had no riscv64 platform manifests.

**Key version ARGs in master Dockerfile (as of June 2026):**

```
GO_VERSION=1.26.4
BASE_DEBIAN_DISTRO="bookworm"   -- blocks riscv64 on current master
XX_VERSION=1.9.0
CONTAINERD_VERSION=v2.2.5
RUNC_VERSION=v1.3.6
TINI_VERSION=v0.19.0
ROOTLESSKIT_VERSION=v3.0.1
DOCKER_STATIC=1
```

The current master uses `BASE_DEBIAN_DISTRO="bookworm"`. PR [#44735](https://github.com/moby/moby/pull/44735) changes this to `trixie` and adds `e2fsprogs` to the `apt-get install` block. Until #44735 merges, riscv64 cross-compilation from master requires passing `--build-arg BASE_DEBIAN_DISTRO=trixie` explicitly.

**Build commands:**

To build riscv64 from source today (requires manual overrides -- not the official procedure):

```bash
docker buildx bake binary \
  --set *.args.BASE_DEBIAN_DISTRO=trixie \
  --set *.platform=linux/riscv64
```

Once [#44735](https://github.com/moby/moby/pull/44735) merges:

```bash
docker buildx bake binary-cross --set *.platform=linux/riscv64
```

**Minimum toolchain versions:**

| Component | Minimum | Notes |
|---|---|---|
| Go | 1.14 | First release with GOARCH=riscv64; master uses 1.26.4 |
| Debian base | 13 (trixie) | First stable Debian with riscv64; bookworm (12) has no riscv64 |
| tonistiigi/xx | 1.7.0 | Minimum with trixie riscv64 apt support; 1.9.0 pinned in master |
| runc | v1.3.6 | riscv64 mainline since opencontainers/runc#3446 |
| containerd | v2.2.5 | riscv64 binaries released; CI coverage incomplete (see Section 9) |

**Unofficial community build:** [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) has produced 117+ successful riscv64 Docker builds on native hardware (BananaPi F3 with Armbian Trixie). Build time on native hardware is approximately 35-40 minutes [NEEDS VERIFICATION -- single source, gounthar README].

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| docker run / exec / stop | Yes | Yes | Yes (from source build) | Core daemon: architecture-agnostic Go |
| seccomp enforcement | Yes | Yes | Yes (since Docker 28.0.0) | Fixed in PR #48455, Sep 2024; backported to 23.0/25.0/26.1/27.x |
| JVM workloads | Yes | Yes | Yes (since Docker 28.0.0) | Required the seccomp fix |
| overlay2 graphdriver | Yes | Yes | Yes | Generic Linux; no arch-specific code |
| BuildKit (docker build) | Yes | Yes | Yes | buildkit v0.31.0 ships riscv64 binary (issue #6577 closed Mar 2026) |
| docker compose | Yes | Yes | Yes | Ships riscv64 binary |
| docker buildx | Yes | Yes | No (official binary absent) | Issue [#3723](https://github.com/docker/buildx/issues/3723) closed as "Not planned" Mar 2026 |
| rootless mode | Yes | Yes | Yes | rootlesskit v3.0.1 ships riscv64 binary |
| docker init (tini) | Yes | Yes | Partial | No official riscv64 tini binary (issue #239, open); moby Dockerfile builds from source |
| docker checkpoint (CRIU) | Yes | Yes | No | CRIU issue #1702 open since 2019; CRIU riscv64 port incomplete |
| Delve debugger | Yes | Yes | Yes (v1.26.0+) | Confirmed via commit f889c34, Feb 2026 |
| Official release binary | Yes | Yes | No | download.docker.com has no riscv64/ directory; HTTP 404 confirmed |
| Docker Scout | Yes | Yes | No | Closed source; no riscv64 binaries exist |

**Key gaps specific to riscv64:**

1. **No official `dockerd` binary from upstream.** The `download.docker.com/linux/static/stable/` distribution point has no `riscv64/` directory. This is the primary blocker.

2. **`docker checkpoint` is non-functional.** CRIU's riscv64 port (issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2019) is incomplete. Checkpoint/restore for riscv64 containers is not possible.

3. **`docker run --init` requires a workaround.** tini has no official riscv64 binary (issue [#239](https://github.com/krallin/tini/issues/239), open). The moby Dockerfile builds tini from source via xx cross-tools; end-users on package-based installs do not benefit from this.

4. **`docker buildx` (the Buildx CLI plugin) has no official riscv64 binary.** Issue [#3723](https://github.com/docker/buildx/issues/3723) was closed as "Not planned" on March 12, 2026. The rationale for closure is not documented in the thread.

---

## 7. CI/CD Infrastructure

**Result: No riscv64 CI exists in moby/moby.**

This is verified by direct inspection of 17 GitHub Actions workflow files under `.github/workflows/` and the full contents of `docker-bake.hcl`.

The three explicit platform lists in `docker-bake.hcl` (`_platforms`, `binary-smoketest`, `bin-image-cross`) enumerate 8 platforms each (see Section 3). `linux/riscv64` does not appear in any of the three lists. It does not appear in any workflow file trigger, runner specification, or matrix definition. No QEMU configuration references riscv64 (QEMU is configured in `buildkit.yml` and `test.yml` but with no riscv64 platform entries).

**History of failed CI attempts:**

- PR [#48462](https://github.com/moby/moby/pull/48462) ("ci: add linux/riscv64 testing", September 2024, gdams): closed after thaJeztah noted this was already being worked on in PR #44735. Not merged.
- PR [#44735](https://github.com/moby/moby/pull/44735) includes CI enablement as part of its scope but remains unmerged as a Draft since January 2023.

**External CI infrastructure for riscv64 (not moby-integrated):**

The RISE Project launched [RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) on March 24, 2026. These are native Scaleway EM-RV1 bare-metal nodes exposed as GitHub Actions runners (label: `ubuntu-24.04-riscv`). Docker-in-Docker is available by default. Between March 19 and May 6, 2026, the runners completed 13,000+ jobs across 197 repositories with a 99.78% completion rate. moby/moby does not use these runners. The community user "gounthar" ran 501 jobs spanning Docker and Python ecosystem workloads on these runners. "eshattow" ran 1,707 jobs building riscv64 Home Assistant container images.

These runners represent available infrastructure for moby CI integration, but no PR has been filed to add moby to the runner user list, and the runners are not operated by Docker Inc.

---

## 8. Distribution and Release Status

| Distribution channel | riscv64 available | Version | Notes |
|---|---|---|---|
| [download.docker.com](https://download.docker.com/linux/static/stable/) (official upstream static binaries) | No | -- | Directory listing: aarch64, armel, armhf, ppc64le, s390x, x86_64 only. HTTP 404 on `riscv64/` confirmed. |
| moby/moby GitHub releases (latest: v29.6.0) | No | -- | Release assets are empty; canonical distribution is via download.docker.com |
| [Debian sid `docker.io`](https://packages.debian.org/sid/riscv64/docker.io/) | Yes | 28.5.2+dfsg4-2 | Debian downstream repackage in unstable only; not produced by moby project; built on `rv-manda-03` |
| [Ubuntu 24.04 Noble `docker.io`](https://packages.ubuntu.com/noble/docker.io) | Yes | 24.0.7-0ubuntu4 | Separate Ubuntu downstream repackage |
| [Arch Linux RISC-V](https://archriscv.felixc.at/) | Unknown | -- | Site sub-pages returned 404 during research; no package listing retrievable |
| PyPI `docker` (Python SDK) | N/A | 7.1.0 | Pure Python (`py3-none-any`); no native binary; pip-installable on riscv64 |

**Critical distinction:** The Debian `docker.io` and Ubuntu `docker.io` packages are downstream repackagings maintained by Debian/Ubuntu, not by Docker Inc. They do not represent upstream moby project support and diverge from upstream releases on their own packaging timelines.

The [`docker/cli` PR #6858](https://github.com/docker/cli/pull/6858) ("Add linux/riscv64 to bin-image-cross release target") was merged on March 13, 2026 and included in v29.4.0. This means the Docker CLI binary (`docker`) is now in the `dockereng/cli-bin` image for riscv64, but it is NOT yet on `download.docker.com`'s official package distribution -- the official pipeline has a hardcoded amd64/arm architecture list that was not updated by this PR.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 CI | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go runtime | Entire stack compiled in Go; GC and scheduler have arch-specific assembly | Supported since Go 1.14 | Included in Go's own CI | Official toolchain ships riscv64 | None |
| [opencontainers/runc](https://github.com/opencontainers/runc) v1.3.6 | OCI container runtime; namespaces, cgroups, seccomp | Clean | CI integration tests added via issue [#5166](https://github.com/opencontainers/runc/issues/5166) (closed Mar 2026) | `runc.riscv64` binary in v1.5.0+ | CRIU checkpoint/restore not supported on riscv64 ([criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2019) |
| [containerd/containerd](https://github.com/containerd/containerd) v2.2.5 | Image/snapshot management, OCI runtime shim | Clean | riscv64 NOT in CI test matrix ([#13020](https://github.com/containerd/containerd/issues/13020) open, [#13124](https://github.com/containerd/containerd/pull/13124) open) | `containerd-*-linux-riscv64.tar.gz` ships | Issues #13020, #13124 open |
| [moby/buildkit](https://github.com/moby/buildkit) v0.31.0 | Dockerfile build engine | Supported | No dedicated riscv64 CI | `buildkit-*-linux-riscv64.tar.gz` ships (issue [#6577](https://github.com/moby/buildkit/issues/6577) closed Mar 2026) | None |
| [rootless-containers/rootlesskit](https://github.com/rootless-containers/rootlesskit) v3.0.1 | Rootless Docker networking | Clean | No riscv64 CI reported | `rootlesskit-riscv64.tar.gz` ships | None |
| [krallin/tini](https://github.com/krallin/tini) v0.19.0 | PID 1 init for containers started with `--init`; C, arch-specific build | Builds on riscv64 hardware; moby Dockerfile cross-compiles via xx | No CI for riscv64 (issue [#240](https://github.com/krallin/tini/issues/240) open) | No official riscv64 binary (issue [#239](https://github.com/krallin/tini/issues/239) open; last release 2021, project stalled) | Issues #239, #240 open |
| [docker/buildx](https://github.com/docker/buildx) | BuildKit CLI plugin | -- | -- | No riscv64 binary (issue [#3723](https://github.com/docker/buildx/issues/3723) closed "Not planned" Mar 2026) | Closed as not planned |
| [checkpoint-restore/criu](https://github.com/checkpoint-restore/criu) | Container checkpoint/restore; deep arch-specific kernel integration | Partial (coredump generation merged) | No | No riscv64 release | Issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since 2019 |

**Dependency chain summary:** Of the seven runtime dependencies, three (runc, BuildKit, rootlesskit) have fully landed riscv64 support. Two (tini, buildx) have open or closed-as-not-planned issues. One (containerd) has released riscv64 binaries but no riscv64 CI. One (CRIU) is a long-standing incomplete port that blocks the checkpoint/restore feature.

---

## 10. Ecosystem Status

**RISE Project involvement:** Docker Inc. is not a RISE Project member. There is no RISE-funded project with a Docker project ID. The only Docker-relevant RISE content is the incidental availability of Docker-in-Docker on the [RISE RISC-V GitHub Actions runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (launched March 24, 2026). This is infrastructure, not a directed investment in Docker riscv64 support.

**Community activity:** The [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) project has produced 117+ riscv64 Docker builds [NEEDS VERIFICATION -- single source]. PR [#52162](https://github.com/moby/moby/pull/52162) (closed March 12, 2026) states: "moby is the last piece of the Docker stack without official riscv64 release artifacts -- runc, containerd, BuildKit, BuildX [sic], and Compose all already ship riscv64 binaries." This characterization of buildx is incorrect per issue [#3723](https://github.com/docker/buildx/issues/3723), which was closed as "Not planned" on the same date.

**Downstream distros:** Both Debian sid and Ubuntu 24.04 ship riscv64 `docker.io` packages (see Section 8). These packages are maintained downstream and do not require upstream moby to ship official binaries.

**Performance data (Docker-adjacent):** The only published hardware-measured data for Docker-related riscv64 workloads comes from [k3s PR #13854](https://github.com/k3s-io/k3s/pull/13854) (March 26, 2026), measuring `docker buildx build` and Go compilation on RISE RISC-V Runners (Scaleway EM-RV1, native, no QEMU):

| Build step | arm64 | riscv64 (EM-RV1) | Ratio |
|---|---|---|---|
| Go compile (`scripts/build`) | 3m 55s | 40m 28s | ~10.4x slower |
| `scripts/package-cli` | 22s | 2m 31s | ~6.7x slower |
| `docker buildx build` | 5m 46s | 48m 32s | ~8.4x slower |

Per-package Go compilation slowdown distribution on the same hardware: median 10.2x, p90 15.5x, p99 25.6x, max 42x. Characterized as CPU-bound, not I/O [NEEDS VERIFICATION -- single source, k3s PR comment].

No published benchmarks exist for Docker daemon-specific operations (container start latency, image pull throughput, container network/storage I/O) on riscv64 vs arm64 or x86_64.

---

## 11. Known Bugs and Active Issues

**Fixed:**

| PR/Issue | Description | Fixed in |
|---|---|---|
| [#48454](https://github.com/moby/moby/issues/48454) / [#48455](https://github.com/moby/moby/pull/48455) | seccomp silently ignored arch-conditional rules for riscv64; JVM workloads crashed with RISCV_FLUSH_ICACHE EPERM | Docker 28.0.0; backported to 23.0, 25.0, 26.1, 27.x |
| [#39461](https://github.com/moby/moby/issues/39461) | Interactive terminals (-it) and log tailing (logs -f) non-functional on riscv64; broken epoll | 20.10.0 (PR #39726) |

**Open:**

| Issue/PR | Description | Owner | Severity |
|---|---|---|---|
| [#44735](https://github.com/moby/moby/pull/44735) | Enable riscv64 cross build -- Draft since Jan 2023 | crazy-max | Blocks all official release artifacts |
| [#50726](https://github.com/moby/moby/pull/50726) | Upgrade Dockerfile base to Debian trixie -- Draft since Aug 2025 | thaJeztah | Blocks #44735 |
| [#50862](https://github.com/moby/moby/pull/50862) | Fix TestBridgeICC and TestBridgeINC networking test failures on trixie | akerouanton | Blocks #50726 |
| [criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) | CRIU riscv64 support -- open since 2019 | -- | Blocks docker checkpoint on riscv64 |
| [tini#239](https://github.com/krallin/tini/issues/239) | No official riscv64 tini binary -- project last released 2021 | -- | `docker run --init` on non-source builds |
| [containerd#13020](https://github.com/containerd/containerd/issues/13020) | Add riscv64 to containerd CI test matrix -- opened Mar 2026 | gounthar | Regressions may go undetected |
| [buildx#3723](https://github.com/docker/buildx/issues/3723) | riscv64 buildx release binary closed as "Not planned" -- Mar 2026 | -- | docker buildx non-functional on riscv64 |

**Root cause of the networking test blocker:** Debian 13 ships iptables-nft v1.8.11. This version changed the error output when querying a nonexistent chain from `"chain '<chain>' in table 'filter' is incompatible, use 'nft' tool."` to `"No chain/target/match by that name."` Several Docker integration tests match against the old error string. Multiple sub-fixes have been merged (PRs #50727, #50736, #50745, #50819, #50841) but `TestBridgeICC` and `TestBridgeINC` remain failing as of December 2025.

---

## 12. Objections and Upstream Blockers

The blocking chain for official riscv64 Docker Engine release artifacts is:

```
PR #50862 (TestBridgeICC/TestBridgeINC fix, owner: akerouanton)
  |
  v
PR #50726 (Debian trixie base image, owner: thaJeztah)
  |
  v
PR #44735 (riscv64 cross build + bake targets, owner: crazy-max)
  |
  v
Issue #44319 closed / official riscv64 release artifacts shipped
```

**Historical pattern:** The PR #44735 has been open as a Draft since January 2, 2023. In 3.5 years it has accumulated the following resolved sub-blockers: missing runc riscv64 support (resolved upstream), missing Debian riscv64 packages (resolved with trixie, June 2025), broken tonistiigi/xx riscv64 apt support (resolved in xx #207). The only remaining sub-blocker is the iptables integration test failures on trixie, which have themselves been partially resolved (5 of 7 sub-PRs merged) with 2 test cases remaining open. The project has demonstrated the ability to ship partial fixes but has not been able to close the loop on the final test blockers.

**Maintainer availability:** The three PRs in the blocking chain have three different owners (akerouanton, thaJeztah, crazy-max), all of whom are Docker Inc. employees or close contributors. tianon (Docker Inc.) is listed as a required code owner for the Dockerfile changes in #44735. There is no community contributor with the write access needed to merge these PRs.

**bin-image-cross gap:** PR [#52162](https://github.com/moby/moby/pull/52162) raised, on its closure on March 12, 2026, that PR #44735 currently adds riscv64 to `_platforms` and `binary-smoketest` but not to `bin-image-cross` (which produces the release container images, not just static binaries). This gap was noted but not resolved before #52162 was closed.

**`docker buildx` closed as not planned:** Issue [buildx#3723](https://github.com/docker/buildx/issues/3723) was closed as "Not planned" on March 12, 2026. No rationale is documented in the thread. This means even when `dockerd` gains an official riscv64 binary, the `docker buildx` plugin will not have one from the upstream project.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The minimum work to produce official riscv64 Docker Engine release binaries is entirely within the Docker project. The code is complete; the blocker is two integration test failures in the networking stack (`TestBridgeICC`, `TestBridgeINC`), owned by `@akerouanton` at Docker Inc. External contributors cannot merge the required PRs.

The practical path for a third party is to either (a) fix the integration test failures and submit patches to the open Draft PRs, or (b) publish riscv64 binaries through a separate distribution channel (as Debian and Ubuntu already do). Option (a) requires debugging the iptables-nft v1.8.11 behavior change in Docker's bridge networking integration test suite.

The [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) project demonstrates that building `dockerd` for riscv64 from source is achievable today with the trixie override. The gap is the official distribution pipeline, not the build capability.

### 13.2 Performance Optimization

No Docker-specific performance benchmarks for riscv64 exist in public sources. The available data (k3s PR #13854) shows the Scaleway EM-RV1 runs `docker buildx build` at approximately 8.4x slower than arm64 and Go compilation at approximately 10.4x slower. No data exists for container startup latency, image pull throughput, or runtime throughput of containerized workloads.

Docker itself has no architecture-specific performance code (no SIMD, no JIT). Performance on riscv64 is entirely a function of the underlying Go runtime, kernel, and hardware. Performance optimization work would be in the Go runtime and compiler, not in moby/moby itself.

### 13.3 CI/CD Infrastructure

The RISE RISC-V Runners (Scaleway EM-RV1, native, Docker-in-Docker available) are free and available for open-source projects. The moby/moby project does not currently use them. Adding riscv64 to moby's GitHub Actions CI via these runners requires (a) resolving the open test failures so the CI would be green, then (b) a PR to add `linux/riscv64` to the bake matrix and a workflow matrix entry using `ubuntu-24.04-riscv`. This is straightforward engineering work once the test failures are resolved.

### 13.4 Ecosystem Enablement

The Docker stack (excluding moby/moby itself) is largely complete for riscv64: runc, containerd, BuildKit, BuildX (no official binary but builds from source), Compose, and rootlesskit all ship riscv64 binaries or are addressable. The two remaining ecosystem gaps are:

- **tini:** No official riscv64 binary, project stalled since 2021. The workaround (build from source in the Dockerfile) is already implemented in moby's Dockerfile. A fork or vendored build is the practical resolution.
- **CRIU:** riscv64 port has been open since 2019. `docker checkpoint` is not available on riscv64. This is a deep, architecture-specific kernel-integration project; not a quick fix.
- **docker buildx plugin:** Closed as "Not planned" by Docker Inc. The BuildKit binary (which does the actual build work) ships riscv64; the `buildx` CLI wrapper does not. A community fork or separate distribution of the buildx binary is the workaround.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix TestBridgeICC and TestBridgeINC iptables-nft v1.8.11 test failures in PR [#50862](https://github.com/moby/moby/pull/50862) | 1-3 | akerouanton (Docker Inc.) | Critical |
| Functional | Merge PR [#50726](https://github.com/moby/moby/pull/50726) (trixie Dockerfile) after #50862 | 0.5 | thaJeztah (Docker Inc.) | Critical |
| Functional | Merge PR [#44735](https://github.com/moby/moby/pull/44735) (riscv64 cross build) after #50726, resolve bin-image-cross gap | 1 | crazy-max + tianon (Docker Inc.) | Critical |
| Functional | Resolve tini riscv64 release binary (issue [#239](https://github.com/krallin/tini/issues/239)) or vendor a fork | 1-2 | external contribution to tini or moby | High |
| CI/CD | Add `linux/riscv64` to moby/moby GitHub Actions via RISE Runners once tests are green | 1-2 | community PR to moby | High |
| CI/CD | Add riscv64 to containerd CI test matrix (issue [#13020](https://github.com/containerd/containerd/issues/13020), PR [#13124](https://github.com/containerd/containerd/pull/13124)) | 1 | gounthar + containerd maintainers | Medium |
| Ecosystem | Investigate buildx riscv64 binary path (issue [#3723](https://github.com/docker/buildx/issues/3723) closed "Not planned" -- requires re-engagement with Docker Inc.) | Data not available: no information on why the issue was closed | Docker Inc. or community fork | Medium |
| Ecosystem | CRIU riscv64 port (issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2019) | Large (unknown -- deep arch-specific kernel work) | criu maintainers | Low (niche use case) |
| Performance | Baseline benchmarks for container start latency, image pull, and runtime I/O on riscv64 vs arm64 | 2-4 | internal benchmarking work | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [moby/moby issue #44319 -- Adding support for RISC-V](https://github.com/moby/moby/issues/44319)
- [moby/moby PR #44735 -- Enable riscv64 Cross Build (Draft)](https://github.com/moby/moby/pull/44735)
- [moby/moby PR #50726 -- Dockerfile: update to Debian 13 trixie (Draft)](https://github.com/moby/moby/pull/50726)
- [moby/moby PR #50862 -- Fix TestBridgeICC/TestBridgeINC on trixie (Draft)](https://github.com/moby/moby/pull/50862)
- [moby/moby PR #52162 -- Add linux/riscv64 to cross-build platform targets (closed)](https://github.com/moby/moby/pull/52162)
- [moby/moby PR #51081 -- feat: add linux/riscv64 to docker-bake (closed)](https://github.com/moby/moby/pull/51081)
- [moby/moby PR #48462 -- ci: add linux/riscv64 testing (closed)](https://github.com/moby/moby/pull/48462)
- [moby/moby PR #48455 -- seccomp: add riscv64 mapping to seccomp_linux.go (merged, Docker 28.0.0)](https://github.com/moby/moby/pull/48455)
- [moby/moby issue #48454 -- seccomp fails to recognize riscv64 architecture (closed)](https://github.com/moby/moby/issues/48454)
- [moby/moby PR #43553 -- seccomp: support riscv64 (merged, Docker 23.0.0)](https://github.com/moby/moby/pull/43553)
- [moby/moby PR #40664 -- Add riscv64 support to the build scripts (merged, Docker 20.10.0)](https://github.com/moby/moby/pull/40664)
- [moby/moby PR #39726 -- bump x/sys to fix riscv64 epoll (merged, Docker 20.10.0)](https://github.com/moby/moby/pull/39726)
- [moby/moby PR #39423 -- Update modules to support riscv64 (merged, Docker 20.10.0)](https://github.com/moby/moby/pull/39423)
- [docker/cli PR #6858 -- Add linux/riscv64 to bin-image-cross release target (merged, v29.4.0)](https://github.com/docker/cli/pull/6858)
- [docker/buildx issue #3723 -- Add linux/riscv64 to release binaries (closed "Not planned")](https://github.com/docker/buildx/issues/3723)
- [moby/buildkit issue #6577 -- Add linux/riscv64 to official release binaries (closed)](https://github.com/moby/buildkit/issues/6577)
- [moby/buildkit PR #6523 -- Add riscv64 support in LLB client (merged)](https://github.com/moby/buildkit/pull/6523)
- [containerd/containerd issue #13020 -- Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [containerd/containerd PR #13124 -- ci: add riscv64 to Linux integration test matrix](https://github.com/containerd/containerd/pull/13124)
- [opencontainers/runc issue #5166 -- riscv64 CI and release (closed)](https://github.com/opencontainers/runc/issues/5166)
- [checkpoint-restore/criu issue #1702 -- Support for RISC-V (open since 2019)](https://github.com/checkpoint-restore/criu/issues/1702)
- [krallin/tini issue #239 -- No official riscv64 binary](https://github.com/krallin/tini/issues/239)
- [gounthar/docker-for-riscv64 -- community riscv64 Docker builds](https://github.com/gounthar/docker-for-riscv64)
- [k3s-io/k3s PR #13854 -- riscv64 build time benchmark data (Mar 2026)](https://github.com/k3s-io/k3s/pull/13854)
- [RISE RISC-V Runners announcement (Mar 24, 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in (May 12, 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members](https://riseproject.dev/members/)
- [download.docker.com static binaries](https://download.docker.com/linux/static/stable/)
- [Debian docker.io package tracker](https://tracker.debian.org/pkg/docker.io)
- [Ubuntu 24.04 docker.io package](https://packages.ubuntu.com/noble/docker.io)