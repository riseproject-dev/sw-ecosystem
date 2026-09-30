---
title: Docker
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: xx
    relation: build-dependency
    criticality: critical
  - name: Buildx
    relation: build-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: BuildKit
    relation: runtime-dependency
    criticality: critical
  - name: libseccomp
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: iptables
    relation: runtime-dependency
    criticality: critical
  - name: rootlesskit
    relation: runtime-dependency
    criticality: optional
  - name: tini
    relation: runtime-dependency
    criticality: optional
  - name: CRIU
    relation: runtime-dependency
    criticality: optional
  - name: Delve
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="docker" %}

# Docker

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Docker<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Docker Engine (upstream project: [moby/moby](https://github.com/moby/moby)) is the container daemon that underpins Docker Desktop, Docker Hub CI runners, and a large fraction of Kubernetes node runtimes worldwide. The `dockerd` binary manages the full container lifecycle: image pull, container start/stop, network namespace creation, volume management, and seccomp-based syscall filtering. Homepage: [docker.com](https://www.docker.com/).

The project is written almost entirely in Go. C code surfaces only at the boundary with libseccomp (CGO linkage) and in third-party binaries bundled into the release image (tini, runc). The build system is `docker buildx bake` driven by `docker-bake.hcl`, with a thin `make` wrapper. There is no CMake, no autoconf, no `setup.py`, no `Cargo.toml` - the standard dependency-discovery method used for C/C++/Rust projects (parsing build-system files for SIMD/JIT/crypto dependencies) does not apply here.

Governance is corporate-led. `project/GOVERNANCE.md` states Moby is "the open-source project used to build Docker, jointly maintained by Docker and the community." There is no Linux Foundation, CNCF, or OCI foundation membership for moby/moby itself - this differs from sibling projects containerd and runc, which did move under CNCF/OCI governance. Decision-making follows an "everything is a pull request" model with two maintainer tiers (Reviewers, who can LGTM but hold no write access, and Committers, who have write access and vote on project-level decisions); new maintainers need 3+ months of sustained contribution, a 7-day public discussion period, then a vote. The license is Apache 2.0.

Mapping `MAINTAINERS` entries by email domain shows Docker, Inc. dominates the roster: committers tonistiigi, vvoland, and robmry, and reviewers rumpl, stevvooe, thompson-shaun, and tiborvass all carry `@docker.com` addresses. Outside Docker Inc., committer corhere is `@mirantis.com` (Mirantis) and AkihiroSuda is `@hco.ntt.co.jp` (NTT); reviewer coolljt0725 is `@huawei.com` (Huawei) and estesp is `@linux.vnet.ibm.com` (IBM). Several other listed maintainers (thaJeztah, cpuguy83, akerouanton, austinvazquez, tianon, crazy-max, dmcgowan, kolyshkin, laurazard, neersighted, samuelkarp, unclejack) use personal email addresses in the `MAINTAINERS` file itself, so their employer cannot be confirmed from that source alone. There is no CNCF-style multi-vendor steering committee - it is Docker-led, with outside contributors earning individual maintainer status. `project/PACKAGERS.md` lists known downstream packagers (Docker CE, Mirantis Container Runtime, Microsoft CBL-Mariner, Amazon Linux) but says nothing about CPU architecture tiers; there is no formal, written platform-tier policy anywhere in the repository.

Docker, Docker Inc., and Moby are not listed among [RISE Project members](https://riseproject.dev/members/) in either the Premier tier (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or the General tier (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

The canonical tracking issue for riscv64 support is [moby/moby#44319, "Adding support for RISC-V"](https://github.com/moby/moby/issues/44319), opened October 18, 2022 and still open as of 2026-09-30. The enabling PR is [moby/moby#44735, "Enable riscv64 cross build"](https://github.com/moby/moby/pull/44735), open as a Draft since January 2, 2023.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-06-26 | Commit `3780098` (merge of PR #2389, "bridge: add riscv64 build tags") adds riscv64 build constraints to libnetwork's netlink sockaddr files, authored by Euan Harris (`euan.harris@docker.com`, Docker Inc.) | [commit 3780098](https://github.com/moby/moby/commit/3780098cd6be0a82f725fa4e2412b33e3be95276) |
| 2019-07-02 | PR #39423 "Update modules to support riscv64" merged; first shipped in v20.10.0 (2020-12-08) | [#39423](https://github.com/moby/moby/pull/39423) |
| 2019-08-21 | PR #39726 "bump x/sys to fix riscv64 epoll" merged; first shipped in v20.10.0 | [#39726](https://github.com/moby/moby/pull/39726) |
| 2020-04-03 | PR #40664 "Add riscv64 support to the build scripts" merged; first shipped in v20.10.0 | [#40664](https://github.com/moby/moby/pull/40664) |
| 2022-05-13 | PR #43553 "seccomp: support riscv64" merged; landed first in the abandoned v22.06.0-beta.0 pre-release (that cycle was scrapped), first stable release v23.0.0 (2023-01-31) | [#43553](https://github.com/moby/moby/pull/43553) |
| 2023-01-02 | PR #44735 "Enable riscv64 cross build" opened as Draft; still open, not merged | [#44735](https://github.com/moby/moby/pull/44735) |
| 2024-09-10 | PR #48455 "seccomp: add riscv64 mapping to seccomp_linux.go" merged (re-fixes bit-rot in #43553's arch table); first shipped in v28.0.0 (2025-02-19); same-day backports #48463 (27.x, shipped v27.3.0), #48465 (25.0, shipped v25.0.7), #48466 (23.0, shipped v23.0.16); #48464 (26.1) merged but never released, since that branch's last tag v26.1.5 (2024-07-23) predates the merge and no later 26.1.x tag was ever cut | [#48455](https://github.com/moby/moby/pull/48455), [#48463](https://github.com/moby/moby/pull/48463) |
| 2024-09-10 | PR #48462 "ci: add linux/riscv64 testing" closed, not merged | [#48462](https://github.com/moby/moby/pull/48462) |
| 2025-05-26 | PR #50077 "profile/seccomp: update to kernel v6.13" (adds `riscv_hwprobe` to seccomp allowlist) merged; first shipped in v28.2.0 (2025-05-28) | [#50077](https://github.com/moby/moby/pull/50077) |
| 2025-10-01 | PR #51081 "feat: add linux/riscv64 to docker-bake" closed, not merged | [#51081](https://github.com/moby/moby/pull/51081) |
| 2026-03-12 | PR #52162 "Add linux/riscv64 to cross-build platform targets" closed unmerged, explicitly in favor of #44735, by gounthar | [#52162](https://github.com/moby/moby/pull/52162) |
| 2026-09-15 | PR #50726 "Dockerfile update to Debian 13 trixie" merged, clearing the Debian riscv64-packages blocker that had gated #44735 since 2023 | [#50726](https://github.com/moby/moby/pull/50726) |

**Data discrepancy on release tagging [NEEDS VERIFICATION]:** Two independent live-research passes disagree on moby/moby's current release lineage. One pass, using `git ls-remote --tags` against the live repository, found the actual latest tag is **v28.5.2**, and separately identified a WebFetch-reported set of tags (v29.8.1, v29.8.0, v25.0.18) as fabricated - `github.com/moby/moby/releases/tag/v29.8.1` returns HTTP 404. A second, independently run pass, using a full local clone with `git log --all`, `git merge-base --is-ancestor`, and tag-date inspection (accounting for a claimed tag-prefix change from `vX.Y.Z` to `docker-vX.Y.Z` at v29.0.0), reports PR #50726 first shipped in a tag named `docker-v29.8.1` (2026-09-15, the same day as the merge). These two findings directly conflict and could not be reconciled with the evidence available. Separately, a dev.to article by gounthar independently references "Docker Engine v29.0.0 (Nov 6, 2025)" as a real upstream release. Treat all specific version/tag claims post-v28.5.2 as unverified pending a clean re-check of the tag list.

**Key contributors:** carlosedp (community, author of the [riscv-bringup](https://github.com/carlosedp/riscv-bringup) tracker) drove the initial 2019 bringup (#39423, #40664) and filed the early interactive-terminal bug (#39461). Euan Harris (Docker Inc.) made the earliest Docker Inc.-authored riscv64 commit (the libnetwork bridge driver tags, June 2019). AkihiroSuda (NTT) authored the original seccomp support PR #43553 and identified the runc riscv64 prerequisite. crazy-max (Docker Inc.) is the owner of the still-open cross-build PR #44735, and has rebased it as recently as October 2025. gdams authored the 2024 seccomp-mapping bugfix #48455, reviewed and merged by thaJeztah (Docker Inc.), who is the consistent maintainer gatekeeper across nearly every riscv64-related PR, including the decision to require genuine Debian riscv64 support rather than an Ubuntu-base-image workaround. neersighted (Docker Inc.) is the maintainer who explicitly blocked that workaround in #44735. gounthar, maintainer of the community [docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) project (117+ riscv64 releases claimed [NEEDS VERIFICATION, single source - gounthar's own README]), is the most active 2026 voice pushing for official upstream inclusion, and closed his own competing PR #52162 in favor of #44735.

**Is it fully upstream?** No. Full, official riscv64 release support has never merged. Tracking issue #44319 remains open nine years after the first riscv64-related commit; enabling PR #44735 remains a Draft nearly four years after it was opened.

## 3. Upstream Support Tier

Docker publishes no formal platform/architecture tier policy document - confirmed by directory search: no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in moby/moby (only generic `*_unsupported.go` build-tag files). Support tiers must be inferred from presence in `docker-bake.hcl`'s platform lists and in CI.

Direct inspection of `docker-bake.hcl` (verified via git clone and confirmed independently by a GitHub code search for `riscv64 repo:moby/moby filename:docker-bake.hcl`, which returns zero matches) shows the `_platforms`, `binary-smoketest`, and `bin-image-cross` targets all enumerate the same eight platforms: `linux/amd64`, `linux/arm/v5`, `linux/arm/v6`, `linux/arm/v7`, `linux/arm64`, `linux/ppc64le`, `linux/s390x`, `windows/amd64`. `linux/riscv64` is absent from all three lists.

| Tier signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In `_platforms` / `binary-smoketest` / `bin-image-cross` | Yes | Yes | No |
| Official release binary (download.docker.com) | Yes | Yes | No |
| Upstream CI coverage | Yes | Yes | No |
| Release-blocking on failure | Yes | Yes | N/A (not built) |

riscv64's effective status is a build-only community/downstream port: source compiles correctly with manual overrides, and Debian/Ubuntu ship their own riscv64 `docker.io` package, but it is not officially supported by Docker Inc.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Docker's riscv64 implementation is fully generic at the Go source level. No architecture-specific assembly, SIMD dispatch, JIT backend, or ISA intrinsics exist anywhere in moby/moby - moby/moby is a Go orchestration daemon with no per-architecture compute kernels, so the JIT/SIMD-rating framework used for numeric libraries is a category error for this codebase. This was confirmed by repeated, independent GitHub code searches across the repository:

- `riscv` / `riscv64` repo-wide: 6 total matches, every one of them either a Dockerfile build-arg check or a Go test-table entry (see below) - confirmed identically by two separate research passes.
- `vfloat32m1_t` (RVV intrinsic type): 0 matches. No RISC-V Vector code exists.
- `rvv`: 1 match, and it is a false positive - a random base64 substring inside a test PEM key file (`integration/testdata/https/client-key.pem`), unrelated to the RISC-V Vector extension.
- `__riscv` (C/cgo architecture guard): 0 matches.
- `GOARCH=riscv64` and `filename:*_riscv64.go`: 0 matches (note: GitHub's `filename:` qualifier does not support wildcards, so this specific check is weaker evidence than the full-text searches above).

The six repo-wide riscv/riscv64 matches are: (1) the root `Dockerfile`'s `ARG DELVE_SUPPORTED=${DELVE_SUPPORTED#linux/riscv64}` line, which strips riscv64 out of the Delve-debugger-supported platform list (see the correction under "Delve" below); and (2) five Go unit-test files - `integration/image/save_test.go`, `daemon/containerd/image_save_test.go`, `client/service_create_test.go`, `integration/image/attestation_test.go`, and `daemon/containerd/image_load_test.go` - each of which constructs a generic `platforms.Platform{Architecture: "riscv64"}` or `ocispec.Platform{...}` struct as one row in a table-driven test of platform-matching logic. `daemon/containerd/image_load_test.go` even contains a variable name typo'd as `linuxRiscv64` (though the string literal itself is correctly spelled `"riscv64"`), a minor sign that this is throwaway test scaffolding rather than a maintained riscv64-specific subsystem. None of these six matches builds, runs, or tests actual riscv64 binaries in CI.

The vendored `golang.org/x/sys/unix` package contains the expected generated files for riscv64 - `asm_linux_riscv64.s`, `syscall_linux_riscv64.go`, `zsysnum_linux_riscv64.go`, `ztypes_linux_riscv64.go`, `zerrors_linux_riscv64.go` - auto-generated from Linux kernel headers with correct riscv64 ABI constants, syscall numbers, and struct layouts.

**Seccomp subsystem - unresolved contradiction in the research [NEEDS VERIFICATION]:** A direct read of PR #48455's body and discussion states it "Adds `riscv64` to the `nativeToSeccomp` map (-> `specs.ArchRISC_V64`) and to the `goToNative` map (-> `"riscv64"`) in `seccomp_linux.go`," ties this back to the original riscv64 arch entry added by PR #43553 (2022, shipped in 23.0), and records four same-day backports into every active release branch. A separate, later adversarial verification pass searched moby/moby directly for the literal string `SCMP_ARCH_RISCV64` and found zero hits in the repository; it found that exact symbol only in **opencontainers/runc**'s `libcontainer/seccomp/config.go`, and concluded the riscv64 seccomp arch-mapping fix may actually live in runc rather than in moby/moby's own source. Both findings come from live, sourced investigation of this repository and directly conflict; this report does not attempt to resolve which is correct. What is independently confirmed by both passes and by the issue tracker is that riscv64 seccomp behavior was broken for real users (see Section 11, issue #48454) and was fixed under PR #48455's number in 2024, whichever repository the underlying code change physically lives in.

**Delve debugger - correction from prior reporting:** The current `Dockerfile` explicitly excludes riscv64 from Delve debugger support via `ARG DELVE_SUPPORTED=${DELVE_SUPPORTED#linux/riscv64}` (confirmed by direct code search against the current default branch). This supersedes an earlier claim that riscv64 is a supported Delve platform as of v1.26.0 (commit f889c34) - that specific commit and version claim could not be corroborated against live source and is contradicted by the Dockerfile's own exclusion logic. As of this report, Delve is **not** supported on riscv64 in moby/moby's own build.

**Networking:** No riscv64-specific networking code exists. The current release-pipeline blocker involving iptables (see Sections 5, 11, 12) is a Debian-13-packaging-level incompatibility, not a riscv64-specific code defect.

## 5. Build System, Cross-Compilation, and Toolchain

**Build tool:** `docker buildx bake` + `docker-bake.hcl`. The Makefile is a thin wrapper. No CMake, no autoconf.

**Cross-compilation mechanism:** [tonistiigi/xx](https://github.com/tonistiigi/xx), pinned at v1.9.0 in the master Dockerfile. For riscv64, `xx` adds the Debian Ports keyring, appends the `debian-ports` riscv64 source to apt, runs `dpkg --add-architecture riscv64`, and installs cross packages via multiarch notation - but historically this path required Debian >= 13 (trixie); on earlier Debian, `xx` silently skipped riscv64 package installation. During review of PR #44735 (December 2023), crazy-max identified and worked around an `xx` apt `sources.list` bug that was specifically breaking riscv64 package installation.

**Why Debian trixie is required:** Debian 12 "bookworm" ships no riscv64 cross-compilation packages, not even in `sid` at the time PR #44735 was opened. Debian 13 "trixie" is the first stable Debian release with riscv64 as a Tier-1 architecture, and PR #50726's body quotes Debian's own release notes confirming this. Tracking issue #44319 was opened in October 2022 specifically because `golang:1.19.2-bullseye` and `debian:bullseye` base images had no riscv64 manifests.

**Current state as of 2026-09-30:** PR #50726 (bumping the Dockerfile's base image to Debian 13 trixie) merged on 2026-09-15, so master's Dockerfile no longer requires a manual `BASE_DEBIAN_DISTRO=trixie` override to get a riscv64-capable base image. This removes a multi-year blocker from PR #44735's dependency chain. It does **not** by itself add riscv64 to the official bake platform lists - that gap remains (Section 3) and is the remaining scope of #44735.

**Build commands to cross-build riscv64 today (source build, not an officially released target):**

```
docker buildx bake binary --set *.platform=linux/riscv64
```

Once PR #44735 merges and riscv64 is added to the official cross-build target:

```
docker buildx bake binary-cross --set *.platform=linux/riscv64
```

**Minimum toolchain versions:**

| Component | Minimum | Notes |
|---|---|---|
| Go | 1.14 | First release with `GOARCH=riscv64`; master Dockerfile pins a much later version |
| Debian base | 13 (trixie) | First stable Debian with riscv64; now the default base image in master since PR #50726 merged 2026-09-15 |
| xx (tonistiigi/xx) | Effectively requires Debian trixie for riscv64 apt support; pinned v1.9.0 in master | Historical apt-sources bug for riscv64 identified and worked around Dec 2023 |
| runc | riscv64 mainline since opencontainers/runc#3446 | Required to be built from runc's main branch before it was backported to a release line |
| containerd | riscv64 binaries released | CI coverage for riscv64 remains incomplete (Section 9) |

**Unofficial community build:** [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) rebuilds official Moby/CLI/Compose/BuildKit/Tini sources with minimal patches for riscv64 and ships automated weekly builds on native BananaPi F3 hardware (Armbian Trixie). Per gounthar's own [dev.to write-up](https://dev.to/gounthar/docker-v29-lands-on-risc-v64-in-under-a-week-the-future-is-here-4g2i), a full Docker Engine v29.0.0 compile took roughly 35-40 minutes natively, with a community riscv64 CLI build shipped within 5 days and Engine build within 6 days of the corresponding upstream x86/arm64 release. A separate [dev.to post](https://dev.to/gounthar/docker-buildx-for-risc-v64-when-infrastructure-just-works-41h3) reports Buildx v0.29.1 compiled and packaged (Deb+RPM) natively in 9 minutes 13 seconds. These figures come from a single source (gounthar's own posts) and are marked [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| docker run / exec / stop | Yes | Yes | Yes (from source build) | Core daemon logic is architecture-agnostic Go |
| seccomp enforcement | Yes | Yes | Yes, with the sourcing caveat in Section 4 | Riscv64-scoped rules were silently dropped until a 2024 fix; see issue #48454 |
| overlay2 graphdriver | Yes | Yes | Yes | Generic Linux code path, no arch-specific logic |
| BuildKit (docker build) | Yes | Yes | Yes | Official `buildkit-*-linux-riscv64.tar.gz` ships (issue #6577 closed Mar 2026) |
| docker compose | Yes | Yes | Yes (downstream) | Ubuntu 26.04 ports pocket ships `docker-compose-v2` for riscv64 (2.40.3+ds1-0ubuntu1) |
| docker buildx | Yes | Yes | No official binary | Issue [#3723](https://github.com/docker/buildx/issues/3723) closed "Not planned" Mar 2026, no rationale documented |
| rootless mode | Yes | Yes | Yes | `rootlesskit` v3.0.1 ships a riscv64 binary |
| docker run --init (tini) | Yes | Yes | Partial | No official riscv64 tini binary (issue #239, open, project stalled since 2021); moby's own Dockerfile builds it from source via xx |
| docker checkpoint (CRIU) | Yes | Yes | No | CRIU issue #1702 open since 2019; only partial (coredump generation) riscv64 work merged upstream in CRIU |
| Delve debugger (dlv) | Yes | Yes | No | Explicitly excluded via `DELVE_SUPPORTED` stripping in the Dockerfile (see Section 4 correction) |
| Official release binary | Yes | Yes | No | `download.docker.com` has no `riscv64/` directory; confirmed via direct listing |

**Functional gaps:** no official `dockerd`/`buildx` binary from upstream; `docker checkpoint` is non-functional on riscv64 (CRIU); `--init` requires a source-built workaround on package installs that do not vendor tini's source build.

**Performance gaps from missing SIMD:** not applicable - moby/moby itself contains no SIMD-dependent code paths (Section 4); any such gap would live in underlying dependencies (Go runtime, libseccomp, kernel), not in moby/moby.

**Security hardening gaps:** the seccomp riscv64 arch-mapping question (Section 4) is unresolved between two live-research passes; a still-open, broader issue [#48471, "seccomp: architecture is not present for (at least) ppc64le"](https://github.com/moby/moby/issues/48471) (filed Sept 2024, updated May 2026, labeled `kind/bug`, `help wanted`) indicates the seccomp architecture table remains incomplete for several non-x86/arm architectures, which may include riscv64-adjacent gaps beyond the originally fixed case.

**NaN / floating-point semantics:** no evidence found of riscv64-specific floating-point or NaN-handling defects in moby/moby; a targeted search found no matching issues.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in moby/moby upstream.** This is confirmed by multiple independent checks:

- A GitHub code search scoped to `path:.github/workflows` for both `riscv` and `riscv64` returns zero matches.
- Direct reading of the individual workflow files (`bin-image.yml`, `buildkit.yml`, `ci.yml`, `codeql.yml`, `labeler.yml`, `pr-review-trigger.yml`, `pr-review.yml`, `test.yml`, `validate-milestone.yml`, `validate-pr.yml`, `vm.yml`, `windows-2022.yml`, `windows-2025.yml`, `windows-integration-flaky.yml`, `zizmor.yml`) finds no riscv reference in any trigger, matrix, or runner specification.
- A search for `riscv64 filename:docker-bake.hcl` returns zero matches, confirming riscv64 was never merged into the cross-build platform bake file used by CI, consistent with PRs #51081 and #52162 both having closed unmerged.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository root.

Workflow file counts varied slightly across research passes (14, 15, 17, and 20, depending on whether hidden/reusable `.`-prefixed workflow files such as `.vm.yml`, `.dco.yml`, `.windows.yml`, `.test.yml`, and `.test-unit.yml` are counted) - every pass, regardless of counting method, found zero riscv/riscv64 references.

QEMU is configured in some workflows (e.g. `buildkit.yml`, `test.yml`) but with no riscv64 platform entries.

PR [#48462, "ci: add linux/riscv64 testing"](https://github.com/moby/moby/pull/48462) was opened and closed unmerged in September 2024, with the work folded (at least nominally) into the scope of PR #44735, which itself remains unmerged.

**External CI infrastructure exists but is not used by moby/moby.** The [RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), announced March 24, 2026, are native, bare-metal Scaleway EM-RV1 (with an EM-RV2 collaboration underway) RISC-V servers exposed as GitHub Actions runners via the `ubuntu-24.04-riscv` label, with Docker-in-Docker available out of the box - `docker build`, `docker run`, Docker Compose, and Buildx all documented as working, with no emulation and no cross-compilation. Per the ["six weeks in" update](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) (May 12, 2026), between March 19 and May 6, 2026 the runners processed 13,000+ jobs across 197 repositories and 87 organizations at a 99.78% completion rate, growing to roughly 445 jobs/day. moby/moby does not use these runners; no PR exists to add moby to the runner user list, and the runners are not operated by Docker Inc. Real users already exercise Docker workloads on them: gounthar ran 501 jobs "across DuckDB, llama.cpp, duckdb, and the whole Docker and Python ecosystem," and eshattow ran 1,707 jobs building riscv64 Home Assistant container images. The [riseproject-dev/riscv-runner](https://github.com/riseproject-dev) repository's own README confirms "full Docker support" via a Docker-in-Docker daemon built into the `linux/riscv64` runner image, and the [riseproject-dev/pytorch-ci](https://github.com/riseproject-dev) repository uses Docker/Buildx/QEMU to build cross-compilation images for PyTorch on riscv64 - a working example of Docker's own toolchain being used productively to target riscv64, even though it is not moby's own CI.

| CI signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In any `.github/workflows/*.yml` trigger/matrix | Yes | Yes | No |
| Free native (non-emulated) runner capacity exists in the ecosystem | Yes | Yes | Yes (RISE RISC-V Runners), unused by moby/moby |
| Attempted CI PR | N/A | N/A | #48462, closed unmerged |

## 8. Distribution and Release Status

| Channel | riscv64 available | Version / detail | Source |
|---|---|---|---|
| [download.docker.com](https://download.docker.com/linux/static/stable/) static binaries (official upstream) | No | Directory listing: aarch64, armel, armhf, ppc64le, s390x, x86_64 only | Direct listing check |
| moby/moby GitHub Releases | No official binary assets for any arch | Distribution runs through download.docker.com, which excludes riscv64 | Direct check |
| Ubuntu 26.04 "resolute" `docker.io` (ports pocket) | Yes | 29.1.3-0ubuntu4 [ports: armhf, ppc64el, riscv64, s390x]; note amd64/arm64 get a newer security build, 29.1.3-0ubuntu4.1, from the primary archive - riscv64 lags one point release behind, typical for a ports architecture | Live `curl` fetch of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Docker&suite=resolute&searchon=names&section=all), 200 OK |
| Ubuntu 26.04 "resolute" `docker-buildx` | Yes | 0.30.1-0ubuntu1, riscv64 included | Same fetch |
| Ubuntu 26.04 "resolute" `docker-compose-v2` | Yes | 2.40.3+ds1-0ubuntu1, riscv64 included | Same fetch |
| Ubuntu 26.04 "resolute" `docker-registry` | Yes | 2.8.3+ds1-2build1, riscv64 included | Same fetch |
| Ubuntu 26.04 "resolute" `python3-docker` | Yes (trivially) | 7.1.0-2ubuntu1, architecture `all` | Same fetch |
| Ubuntu 24.04 "noble" `docker.io` | Reported yes, 24.0.7-0ubuntu4 | Carried from prior reporting; not re-confirmed against a live source in this research cycle [NEEDS VERIFICATION] | Existing report only |
| Debian sid / trixie `docker.io` | Yes (per existing reporting, 28.5.2+dfsg4-2) | Debian downstream repackage, built in Debian's own riscv64 porterbox infrastructure; not produced by the moby project | Existing report; corroborated in spirit by trixie's confirmed riscv64 Tier-1 status (PR #50726) |
| Arch Linux RISC-V port | No | No `docker`/`docker-cli` package listed at [archriscv.felixc.at](https://archriscv.felixc.at); page references only a third-party `riscfive/archlinux` Docker Hub image | Live check |
| PyPI `docker` (docker-py SDK) | Yes (trivially) | All distributions are pure-Python (`py3-none-any`, `py2.py3-none-any`, sdist); no architecture-specific files exist for any platform | Live fetch of [pypi.org/pypi/docker/json](https://pypi.org/pypi/docker/json) |
| RISE wheel-builder proxy for `docker` | N/A | Returns an HTTP 302 straight through to real PyPI - no custom riscv64 build exists or is needed | Live fetch |
| Community: [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) | Yes | Rebuilds Moby/CLI/Compose/BuildKit/Tini from official sources with minimal patches; automated weekly riscv64 builds; the de facto full-stack riscv64 Docker distribution channel today | Web search, dev.to posts |

**docker/cli release target [NEEDS VERIFICATION, single source]:** The existing report states that [docker/cli PR #6858](https://github.com/docker/cli/pull/6858) added `linux/riscv64` to the `bin-image-cross` release target and merged into v29.4.0. This claim was not re-checked by the fresh live research, which was scoped to moby/moby itself, and is neither corroborated nor contradicted by it.

**What a user must do to get a working riscv64 Docker binary today:** install the downstream `docker.io` package from Ubuntu's ports pocket (26.04 "resolute") or Debian sid/trixie, or use the community [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) builds. There is no first-party option from Docker Inc./moby/moby.

## 9. Dependencies

| Dependency | Relation | Criticality | Role | riscv64 build | riscv64 CI/test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|---|---|
| Go | build-dependency | critical | Entire daemon compiled in Go; GC and scheduler have arch-specific assembly | Supported since Go 1.14 | Covered by Go's own upstream CI | Official toolchain ships riscv64 | None |
| [xx](https://github.com/tonistiigi/xx) | build-dependency | critical | Cross-compilation tooling that sets up apt multiarch for `docker buildx bake` cross-builds | Requires Debian trixie for riscv64 apt support; a riscv64 apt-sources bug found Dec 2023 was worked around | N/A (build tool, not tested independently) | Ships as a container-image layer, pinned v1.9.0 in the Dockerfile | Trixie requirement now satisfied in master since PR #50726 merged 2026-09-15 |
| [Buildx](https://github.com/docker/buildx) | build-dependency | critical | BuildKit CLI plugin invoked by `docker buildx bake` for cross-builds | Builds from source | No dedicated riscv64 CI reported | No official riscv64 binary; issue [#3723](https://github.com/docker/buildx/issues/3723) closed "Not planned" Mar 2026 | No rationale documented for the closure |
| [runc](https://github.com/opencontainers/runc) | runtime-dependency | critical | OCI runtime: namespaces, cgroups, seccomp invocation | Clean; riscv64 mainline since opencontainers/runc#3446 | CI added via issue #5166 (closed Mar 2026) | `runc.riscv64` binary ships from v1.5.0+; moby Dockerfile pins v1.3.6 | CRIU checkpoint/restore unsupported on riscv64 within runc |
| [containerd](https://github.com/containerd/containerd) | runtime-dependency | critical | Image/snapshot management, OCI runtime shim | Clean | Not in CI test matrix: issue [#13020](https://github.com/containerd/containerd/issues/13020) reopened, still open as of 2026-08-14; PR [#13124](https://github.com/containerd/containerd/pull/13124) (adds riscv64 to CI) still open | `containerd-*-linux-riscv64.tar.gz` ships; moby Dockerfile pins v2.2.5 | gounthar has offered to help land CI support |
| [BuildKit](https://github.com/moby/buildkit) | runtime-dependency | critical | Dockerfile build engine | Supported | No dedicated riscv64 CI | `buildkit-*-linux-riscv64.tar.gz` ships (issue [#6577](https://github.com/moby/buildkit/issues/6577) closed Mar 2026); moby Dockerfile pins v0.31.0 | None open |
| libseccomp | runtime-dependency | critical | C library (CGO-linked) backing Docker's default seccomp profile | Disputed evidence on whether the riscv64 arch mapping lives in moby/moby or in runc - see Section 4 | No riscv64-specific CI found | N/A (system library, distro-provided) | See the unresolved Section 4 contradiction between PR #48455's description and a direct-code-search verification pass |
| golang.org/x/sys | runtime-dependency | critical | Vendored low-level syscall bindings providing riscv64 ABI/syscall tables | Complete: `asm_linux_riscv64.s`, `syscall_linux_riscv64.go`, and generated syscall-number/type/error tables for riscv64 are present, auto-generated from Linux kernel headers | Covered by the Go project's own CI | Ships with every Go release | Specifically bumped in PR #39726 (2019) to fix riscv64 epoll breakage |
| iptables | runtime-dependency | critical | Bridge-network firewall rules manipulated by `dockerd` | Clean as a distro package | Indirectly release-blocking: Debian 13's iptables-nft v1.8.11 changed an error-string format, breaking `TestBridgeICC`/`TestBridgeINC` integration tests that gate PR #44735 | Distro-provided riscv64 iptables package (Debian/Ubuntu) | Fix status (PR #50862 and related sub-fixes) not reconfirmed in this research cycle [NEEDS VERIFICATION, existing-report only] |
| rootlesskit | runtime-dependency | optional | Rootless Docker networking | Clean | No riscv64 CI reported | `rootlesskit-riscv64.tar.gz` ships (v3.0.1 pinned) | None |
| tini | runtime-dependency | optional | PID 1 init used by `docker run --init` | Builds on riscv64 hardware; moby's own Dockerfile cross-compiles it from source via xx | No CI (issue [#240](https://github.com/krallin/tini/issues/240) open) | No official riscv64 binary; upstream project stalled since 2021 (issue [#239](https://github.com/krallin/tini/issues/239) open) | #239 and #240 both open, upstream inactive |
| CRIU | runtime-dependency | optional | `docker checkpoint`/restore backend | Partial - only coredump-generation support merged upstream | No | No riscv64 release | Issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since 2019; deep, arch-specific kernel integration work, not a quick fix |
| Delve | runtime-dependency | optional | Go debugger (`dlv`) bundled for interactive container debugging | Explicitly excluded: the Dockerfile strips `linux/riscv64` out of `DELVE_SUPPORTED` via ARG substitution | N/A | Not shipped for riscv64 | Corrects a prior claim of v1.26.0 riscv64 Delve support; current Dockerfile source confirms riscv64 is deliberately excluded |

**Additional indirect dependencies surfaced by research (not in the required list above):**

- **QEMU** - used for multi-arch emulation in Buildx-based cross-builds generally, and directly in the RISE-adjacent `pytorch-ci` repository's riscv64 Docker/Buildx image pipeline.
- **docker/cli** - sibling repository providing the `docker` CLI; per the existing report a PR (#6858) added `linux/riscv64` to its own `bin-image-cross` release target and shipped in v29.4.0 [NEEDS VERIFICATION, not corroborated by fresh research].
- **Debian 13 "trixie"** - the base OS image for the Dockerfile; the first Debian stable release with riscv64 as a Tier-1 architecture, required for `xx`'s riscv64 cross-package installation, and now the default base image in master since PR #50726 merged on 2026-09-15.

**Dependency chain summary:** of the critical runtime/build dependencies, runc, containerd, and BuildKit have riscv64 binaries shipping upstream (with containerd's CI coverage still incomplete). Buildx and Delve have no riscv64 binary at all. tini and CRIU are optional dependencies with long-standing, unresolved upstream riscv64 gaps. The libseccomp/seccomp-mapping question is unresolved in the research itself and is flagged rather than asserted either way.

## 11. Known Bugs and Active Issues

**Fixed:**

| Issue/PR | Description | Status |
|---|---|---|
| [#48454](https://github.com/moby/moby/issues/48454) / [#48455](https://github.com/moby/moby/pull/48455) | Seccomp silently failed to apply riscv64-scoped rules (e.g. `riscv_flush_icache`), causing `apt-get install openjdk` and similar workloads to crash with `RISCV_FLUSH_ICACHE not available; error='Operation not permitted'` | Fixed, shipped in Docker 28.0.0; backported to 23.0, 25.0, 27.x (the 26.1 backport, #48464, merged but was never released) |
| [#39461](https://github.com/moby/moby/issues/39461) | Interactive terminals (`-it`) and `docker logs -f` non-functional on a riscv64 QEMU test rig | Fixed, shipped in 20.10.0 via PR #39726 |

**Open:**

| Issue/PR | Description | Severity / notes |
|---|---|---|
| [#44319](https://github.com/moby/moby/issues/44319) | Master tracking issue, "Adding support for RISC-V" | Open since 2022-10-18, 8+ comments, still active |
| [#44735](https://github.com/moby/moby/pull/44735) | Enable riscv64 cross build | Draft since 2023-01-02; blocks all official release artifacts |
| [#48471](https://github.com/moby/moby/issues/48471) | "seccomp: architecture is not present for (at least) ppc64le" | Open since 2024-09-10, updated 2026-05-27, `kind/bug` + `help wanted`; indicates the seccomp arch table is still incomplete for several non-x86/arm architectures |
| [#51081](https://github.com/moby/moby/pull/51081) | feat: add linux/riscv64 to docker-bake | Closed unmerged 2025-10-01 |
| [#52162](https://github.com/moby/moby/pull/52162) | Add linux/riscv64 to cross-build platform targets | Closed unmerged 2026-03-12, in favor of #44735 |
| [#48462](https://github.com/moby/moby/pull/48462) | ci: add linux/riscv64 testing | Closed unmerged 2024-09-10 |
| [tini#239](https://github.com/krallin/tini/issues/239) | No official riscv64 tini binary | Open, upstream project inactive since 2021 |
| [tini#240](https://github.com/krallin/tini/issues/240) | No riscv64 CI in tini | Open |
| [criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) | riscv64 support in CRIU | Open since 2019 |
| [containerd#13020](https://github.com/containerd/containerd/issues/13020) | Add riscv64 to containerd CI test matrix | Reopened, open as of 2026-08-14 |
| [containerd#13124](https://github.com/containerd/containerd/pull/13124) | ci: add riscv64 to Linux integration test matrix | Open |
| [buildx#3723](https://github.com/docker/buildx/issues/3723) | riscv64 buildx release binary | Closed "Not planned," Mar 2026, no rationale documented |

**Correctness bugs highlighted separately:** #48454 was a genuine correctness defect (silently dropped security-relevant seccomp rules on riscv64, causing real workload crashes) that went undetected for roughly two years because no riscv64 CI exists to catch it - the fix was reactive, discovered by an end user running real hardware, not caught by automated gates. The still-open #48471 suggests the underlying class of bug (an incomplete seccomp architecture table for non-x86/arm architectures) may not be fully closed even for the originally-fixed riscv64 case.

## 12. Objections and Upstream Blockers

Updated blocking chain for official riscv64 release artifacts:

```
PR #50862 (TestBridgeICC/TestBridgeINC iptables-nft v1.8.11 fix)
  |
  v
PR #50726 (Debian trixie base image) -- MERGED 2026-09-15
  |
  v
PR #44735 (riscv64 cross build + bake targets) -- still open/Draft
  |
  v
Issue #44319 closed / official riscv64 release artifacts shipped
```

PR #50726's merge on 2026-09-15 clears a multi-year sub-blocker (no Debian release had riscv64 cross-packages before trixie). The status of PR #50862's iptables test fixes was not reconfirmed by the fresh live research in this cycle and is carried forward from prior reporting as still-relevant [NEEDS VERIFICATION]. A further, narrower gap was flagged at PR #52162's closure on March 12, 2026 by gounthar: PR #44735 as currently scoped adds riscv64 to `_platforms` and `binary-smoketest` but not yet to `bin-image-cross`, which is the target that actually produces release container images rather than just static binaries.

**Stated objections:** neersighted (Docker Inc.) explicitly blocked an Ubuntu-base-image shortcut in #44735 in July 2023, insisting on waiting for genuine Debian riscv64 support - a position now satisfied by trixie. thaJeztah (Docker Inc.) is the consistent maintainer gatekeeper across nearly every riscv64 PR, driving both this bar and the subsequent backport process. tianon (Docker Inc.) is listed as a required code owner for the Dockerfile changes in #44735. No community contributor holds the write access needed to merge #44735 - its path to landing runs entirely through Docker Inc. employees.

`docker buildx`'s riscv64 issue [#3723](https://github.com/docker/buildx/issues/3723) was closed "Not planned" by Docker Inc. on March 12, 2026 with no rationale documented in the thread - a standing organizational objection with no stated technical basis.

**Acceptance probability:** moderate to high for PR #44735 itself. Both of its historically hardest blockers - runc riscv64 support and a Debian base image with riscv64 packages - are now resolved upstream. The PR's owner (crazy-max) rebased it as recently as October 2025, and community pressure (gounthar) is active and recent (March 2026). However, nearly four years of Draft status with no committed merge date, even after major sub-blockers cleared, indicates organizational/prioritization friction beyond the remaining technical work.

## 13. Readiness Assessment

- **Color:** Orange (downstream-only)
- **Release provider:** distro

**Justification:** moby/moby has no upstream riscv64 CI - confirmed absent across all GitHub Actions workflow files in `.github/workflows/` (14-20 files depending on counting method, zero riscv/riscv64 matches in every pass) and across all `docker-bake.hcl` platform lists (`_platforms`, `binary-smoketest`, `bin-image-cross`) - and no official upstream riscv64 release artifact: [download.docker.com](https://download.docker.com/linux/static/stable/) has no `riscv64/` directory, and the enabling PR [#44735](https://github.com/moby/moby/pull/44735) is still an open Draft. The distribution floor applies because Ubuntu 26.04 (ports pocket) and Debian sid/trixie ship a riscv64 `docker.io` package ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Docker&suite=resolute&searchon=names&section=all)), but since the research did not establish whether those packages build from unpatched upstream source, the grade is capped at orange (downstream-only) rather than yellow.

**Pending work that could change the grade:** PR [#44735](https://github.com/moby/moby/pull/44735) "Enable riscv64 cross build" is open/Draft and would add official upstream riscv64 build and release targets; its key blocker, the Debian trixie base image (PR [#50726](https://github.com/moby/moby/pull/50726)), merged 2026-09-15, clearing a major sub-blocker. Two competing PRs ([#51081](https://github.com/moby/moby/pull/51081), [#52162](https://github.com/moby/moby/pull/52162)) to add `linux/riscv64` to docker-bake were closed unmerged in favor of #44735. No upstream riscv64 CI exists or is pending (PR [#48462](https://github.com/moby/moby/pull/48462) "ci: add linux/riscv64 testing" was closed unmerged). Tracking issue [#44319](https://github.com/moby/moby/issues/44319) remains open. Community project [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64) continues to push for official inclusion and is currently the de facto riscv64 distribution channel. No RISE membership or funded RISE work targets Docker directly; RISE's only tie-in is that Docker-in-Docker works out of the box on RISE RISC-V Runners.

## 14. Investment Analysis

### 14.1 Functional Enablement

The remaining work to produce official riscv64 Docker Engine release binaries is entirely within the moby/moby project and its immediate blocking chain. The base-image blocker (PR #50726) is now cleared. What remains is: (a) whatever is left of the iptables-nft v1.8.11 integration-test fixes referenced against PR #50862 [NEEDS VERIFICATION on current status], (b) merging PR #44735 itself, and (c) closing the `bin-image-cross` scope gap flagged at PR #52162's closure. All three sit with Docker Inc. employees (akerouanton, thaJeztah, crazy-max, tianon as required code owner); no external contributor has the write access to merge them. RISE has not funded or performed any of this work - no RISE blog post, repository, or funded RFP ties directly to moby/moby.

### 14.2 Performance Optimization

No Docker-daemon-specific performance benchmarks (container start latency, image pull throughput, runtime I/O) exist for riscv64 vs arm64/x86_64 in any source found. The closest available data points are indirect:

- Fedora RISC-V build infrastructure (binutils 2.45.1-4.fc43): a representative package build took 143 minutes on an 8-core/16GB StarFive VisionFive 2 vs 29 minutes on x86_64 (8 cores/29GB) and 36 minutes on aarch64 (12 cores/46GB) - roughly 4-5x slower, corroborated by a Phoronix summary reporting ~5x slower Fedora RISC-V package builds generally. An alternate riscv64 builder (Milk-V Megrez) completed the same package in 58 minutes, still slower than every other architecture tested. ([Marcin Juszkiewicz, "RISC-V is sloooow," Mar 2026](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/))
- Native Docker toolchain builds on real riscv64 hardware (BananaPi F3): full Docker Engine v29.0.0 compile ~35-40 minutes; Buildx v0.29.1 build+package ~9m13s ([gounthar dev.to posts](https://dev.to/gounthar/docker-v29-lands-on-risc-v64-in-under-a-week-the-future-is-here-4g2i)) [NEEDS VERIFICATION, single source].
- QEMU emulation of riscv64 on non-native hosts (relevant to `docker run --platform linux/riscv64` on amd64/arm64 hosts) is generically reported at roughly 15-30% of native performance, or approximately 7x slower than native execution, in cross-architecture emulation benchmarks not specific to Docker.
- An academic paper ([MDPI Electronics 13(17):3494, 2024](https://www.mdpi.com/2079-9292/13/17/3494)) comparing a Turing RK1 (ARM) against a SiFive U740-based RISC-V platform under Docker and Kubernetes reports ARM ahead by roughly 5-15x+ in memory bandwidth and single-/all-core performance, plus "considerable intricacy and difficulties" coordinating RISC-V with Kubernetes; the paper's full tables could not be retrieved (HTTP 403 on MDPI, preprints.org, ResearchGate, Scribd, and ACM), so these figures are indexed-abstract-level only [NEEDS VERIFICATION].

Docker itself has no architecture-specific performance code (Section 4: no SIMD, no JIT). Performance on riscv64 is entirely a function of the underlying Go runtime, kernel, and hardware; performance-optimization investment belongs in the Go runtime/compiler and in RISC-V silicon/kernel work, not in moby/moby.

### 14.3 CI/CD Infrastructure

The RISE RISC-V Runners are free, native (no emulation), and already run Docker-in-Docker workloads successfully at scale (13,000+ jobs, 99.78% completion, ~445 jobs/day as of the May 2026 update). moby/moby does not use them. Once the remaining #44735 blockers clear, adding riscv64 to moby's own CI is comparatively straightforward engineering: add `linux/riscv64` to the bake matrix and add a workflow matrix entry targeting `ubuntu-24.04-riscv`. This work is not currently funded or scheduled by RISE specifically for moby/moby.

### 14.4 Dependency-Chain Enablement

(Section 10, Ecosystem Status, is omitted: moby/moby is a standalone daemon/CLI tool with no significant dependent package ecosystem - e.g. no large body of third-party packages that must independently be ported to riscv64 the way a language's package index would need to be.) The remaining dependency-level gaps that affect Docker's own feature completeness are:

- **tini:** no official riscv64 binary, project stalled since 2021. The workaround (building from source in moby's own Dockerfile via xx) is already implemented; a fork or vendored build is the practical path for package-based installs that do not do this.
- **CRIU:** riscv64 port open since 2019, only partial. `docker checkpoint` is unavailable on riscv64. This is a deep, architecture-specific kernel-integration project, not a quick fix.
- **docker buildx plugin:** closed "Not planned" by Docker Inc. with no documented rationale. The underlying BuildKit binary (which does the actual build work) does ship for riscv64; only the `buildx` CLI wrapper does not. A community fork or separate distribution of the buildx binary is the practical workaround, or renewed engagement with Docker Inc. to reopen the decision.
- **containerd CI:** issues #13020/#13124 remain open; gounthar has offered to help land riscv64 CI coverage for containerd.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm and, if needed, complete the remaining iptables-nft v1.8.11 integration-test fixes (PR #50862 chain) | Data not available: current status not reconfirmed by live research | akerouanton (Docker Inc.) [NEEDS VERIFICATION] | Critical |
| Functional | Merge PR #44735 (riscv64 cross build), including closing the bin-image-cross scope gap noted at #52162's closure | 1-2 | crazy-max + tianon (Docker Inc.) | Critical |
| Functional | Resolve tini riscv64 release binary (issue #239) or vendor/fork | 1-2 | External contribution to tini, or moby | High |
| CI/CD | Add `linux/riscv64` to moby/moby GitHub Actions via RISE RISC-V Runners, once #44735's remaining blockers clear | 1-2 | Community PR to moby | High |
| CI/CD | Add riscv64 to containerd's CI test matrix (issues #13020, PR #13124) | 1 | gounthar + containerd maintainers | Medium |
| Ecosystem | Re-engage Docker Inc. on the buildx riscv64 "Not planned" closure (#3723), or maintain a community fork | Data not available: no information on why the issue was closed | Docker Inc. or community fork | Medium |
| Ecosystem | CRIU riscv64 port (issue #1702, open since 2019) | Large, unknown - deep arch-specific kernel work | CRIU maintainers | Low (niche use case) |
| Performance | Baseline Docker-daemon-specific benchmarks (container start latency, image pull throughput, runtime I/O) on riscv64 vs arm64/x86_64 - none currently published | 2-4 | Internal benchmarking work | Medium |

## 15. References

- [moby/moby issue #44319 - Adding support for RISC-V](https://github.com/moby/moby/issues/44319)
- [moby/moby PR #44735 - Enable riscv64 cross build (Draft)](https://github.com/moby/moby/pull/44735)
- [moby/moby PR #50726 - Dockerfile update to Debian 13 trixie (merged 2026-09-15)](https://github.com/moby/moby/pull/50726)
- [moby/moby PR #52162 - Add linux/riscv64 to cross-build platform targets (closed)](https://github.com/moby/moby/pull/52162)
- [moby/moby PR #51081 - feat: add linux/riscv64 to docker-bake (closed)](https://github.com/moby/moby/pull/51081)
- [moby/moby PR #48462 - ci: add linux/riscv64 testing (closed)](https://github.com/moby/moby/pull/48462)
- [moby/moby PR #48455 - seccomp: add riscv64 mapping to seccomp_linux.go (merged, Docker 28.0.0)](https://github.com/moby/moby/pull/48455)
- [moby/moby PR #48463 - seccomp riscv64 mapping backport to 27.x (merged)](https://github.com/moby/moby/pull/48463)
- [moby/moby issue #48454 - seccomp fails to recognize riscv64 architecture (closed)](https://github.com/moby/moby/issues/48454)
- [moby/moby issue #48471 - seccomp architecture is not present for (at least) ppc64le (open)](https://github.com/moby/moby/issues/48471)
- [moby/moby PR #43553 - seccomp: support riscv64 (merged, Docker 23.0.0)](https://github.com/moby/moby/pull/43553)
- [moby/moby PR #50077 - profile/seccomp: update to kernel v6.13 (merged)](https://github.com/moby/moby/pull/50077)
- [moby/moby PR #40664 - Add riscv64 support to the build scripts (merged, Docker 20.10.0)](https://github.com/moby/moby/pull/40664)
- [moby/moby PR #39726 - bump x/sys to fix riscv64 epoll (merged, Docker 20.10.0)](https://github.com/moby/moby/pull/39726)
- [moby/moby PR #39423 - Update modules to support riscv64 (merged, Docker 20.10.0)](https://github.com/moby/moby/pull/39423)
- [moby/moby issue #39461 - Interactive terminal and tail logs not working on RISC-V (closed)](https://github.com/moby/moby/issues/39461)
- [moby/moby commit 3780098 - bridge: add riscv64 build tags](https://github.com/moby/moby/commit/3780098cd6be0a82f725fa4e2412b33e3be95276)
- [docker/buildx issue #3723 - Add linux/riscv64 to release binaries (closed "Not planned")](https://github.com/docker/buildx/issues/3723)
- [docker/cli PR #6858 - Add linux/riscv64 to bin-image-cross release target](https://github.com/docker/cli/pull/6858)
- [moby/buildkit issue #6577 - Add linux/riscv64 to official release binaries (closed)](https://github.com/moby/buildkit/issues/6577)
- [containerd/containerd issue #13020 - Add linux/riscv64 to CI test matrix (open)](https://github.com/containerd/containerd/issues/13020)
- [containerd/containerd PR #13124 - ci: add riscv64 to Linux integration test matrix (open)](https://github.com/containerd/containerd/pull/13124)
- [opencontainers/runc issue #5166 - riscv64 CI and release (closed)](https://github.com/opencontainers/runc/issues/5166)
- [checkpoint-restore/criu issue #1702 - Support for RISC-V (open since 2019)](https://github.com/checkpoint-restore/criu/issues/1702)
- [krallin/tini issue #239 - No official riscv64 binary](https://github.com/krallin/tini/issues/239)
- [krallin/tini issue #240 - No riscv64 CI](https://github.com/krallin/tini/issues/240)
- [tonistiigi/xx - cross-compilation tooling](https://github.com/tonistiigi/xx)
- [gounthar/docker-for-riscv64 - community riscv64 Docker builds](https://github.com/gounthar/docker-for-riscv64)
- [gounthar, "Docker v29 Lands on RISC-V64 in Under a Week" (dev.to)](https://dev.to/gounthar/docker-v29-lands-on-risc-v64-in-under-a-week-the-future-is-here-4g2i)
- [gounthar, "Docker Buildx for RISC-V64" (dev.to)](https://dev.to/gounthar/docker-buildx-for-risc-v64-when-infrastructure-just-works-41h3)
- [Jeff Geerling, "The state of Docker on popular RISC-V platforms" (2024)](https://www.jeffgeerling.com/blog/2024/state-docker-on-popular-risc-v-platforms/)
- [Marcin Juszkiewicz, "RISC-V is sloooow" (Mar 2026)](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/)
- [Phoronix, "RISC-V Slow Fedora Packages"](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages)
- ["Evaluating ARM and RISC-V Architectures for High-Performance Computing with Docker and Kubernetes," MDPI Electronics 13(17):3494 (2024)](https://www.mdpi.com/2079-9292/13/17/3494)
- [Toni Stiigi, "Early look at Docker containers on RISC-V" (2019, Medium)](https://medium.com/@tonistiigi/early-look-at-docker-containers-on-risc-v-40ed43b16b09)
- [carlosedp/riscv-bringup - multi-arch bringup tracker](https://github.com/carlosedp/riscv-bringup)
- [RISE RISC-V Runners announcement (Mar 24, 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in (May 12, 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members](https://riseproject.dev/members/)
- [download.docker.com static binaries](https://download.docker.com/linux/static/stable/)
- [Ubuntu 26.04 "resolute" Docker package search](https://packages.ubuntu.com/search?keywords=Docker&suite=resolute&searchon=names&section=all)
- [PyPI docker package JSON](https://pypi.org/pypi/docker/json)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)