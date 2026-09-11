---
title: Sysbox
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="sysbox" %}

# Sysbox

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Sysbox<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Sysbox is a Go-based OCI-compatible container runtime that enables unprivileged, rootless "system containers" - containers that can run Docker-in-Docker, Kubernetes-in-Docker, and other privileged workloads without granting the host full root access. It is a fork of `runc` combined with three custom components: `sysbox-fs` (a FUSE-based virtual filesystem that emulates parts of `/proc` and `/sys` inside the container), `sysbox-mgr` (a management daemon), and `sysbox-ipc` (inter-process communication glue). The umbrella repository is [nestybox/sysbox](https://github.com/nestybox/sysbox), which references the component repos as git submodules.

Sysbox was originally developed by Nestybox and, per the project [README](https://github.com/nestybox/sysbox/blob/master/README.md), "Docker is the main sponsor of the Sysbox project" following Nestybox's acquisition by Docker (approximately 2022, confirmed by author email domains shifting from `@nestybox.com` to `@docker.com` in the git history). The same README states plainly that Sysbox "is a community open-source project and it's not officially supported by Docker" - support is best-effort via GitHub issues and Slack.

Governance is informal. The [MAINTAINERS](https://github.com/nestybox/sysbox/blob/master/MAINTAINERS) file lists exactly two named maintainers, Rodny Molina and Cesar Talledo, both now committing under `@docker.com` addresses; there is no `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file, and no foundation membership (not CNCF, not Linux Foundation). [CONTRIBUTING.md](https://github.com/nestybox/sysbox/blob/master/CONTRIBUTING.md) states "The Sysbox maintainers are in charge of approving pull requests" - a benevolent-maintainer model, not a technical steering committee. CONTRIBUTING.md also codifies an explicit open-core split: features benefiting individual practitioners stay open source, while features addressing "enterprise-level needs" are kept proprietary for Docker to monetize, decided "on a feature by feature basis." License is Apache 2.0 ([LICENSE](https://github.com/nestybox/sysbox/blob/master/LICENSE)).

Commit volume is dominated by the two named maintainers (Cesar Talledo: 583 commits as `ctalledo@nestybox.com` + 330 as `cesar.talledo@docker.com`; Rodny Molina: 523 as `rmolina@nestybox.com` + 50 as `rodny.molina@docker.com`); community contributors (Christos Roussidis, Gabriele Diener, Andrew Balmos, and others) appear in single or low double-digit commit counts. There is no evidence in this research of an active community culture specifically around adding new host architectures: `docs/arch-compat.md` invites users to "file a new issue if you have a use-case that requires a non-supported architecture," but no such issue has ever been filed for riscv64.

## 2. Port History and Upstreaming Timeline

No riscv64 port exists and none has ever been attempted. There is no milestone table to report: zero commits, zero issues, zero pull requests, and zero CI additions reference riscv64 anywhere in the `nestybox` GitHub organization (`nestybox/sysbox`, `sysbox-runc`, `sysbox-fs`, `sysbox-mgr`, `sysbox-ipc`, `sysbox-libs`, `sysbox-pkgr`), confirmed via `git log --all -i --grep=riscv` (0 matches) and GitHub's `search_commits`/`search_issues`/`search_pull_requests` APIs scoped to the org (0 matches in every case except one tangential hit, detailed in Section 11).

Key contributors to a riscv64 port: none, as no port exists. Fully upstream: not applicable, there is nothing upstreamed.

## 3. Upstream Support Tier

There is no formal architecture-tier policy document (no equivalent of Go's port tiers or Rust's target tiers). The de facto policy, from [docs/arch-compat.md](https://github.com/nestybox/sysbox/blob/master/docs/arch-compat.md):

| Architecture | Supported since |
|---|---|
| amd64 | v0.1.0+ |
| arm64 | v0.5.0+ |
| riscv64 | not listed / not supported |

The document adds: "Sysbox implementation is expected to be fully platform agnostic ... it should be relatively easy to extend the number of supported architectures - it's expected to be mostly a testing/validation exercise. Please file a new issue if you have a use-case that requires a non-supported architecture." No such issue exists for riscv64 (verified in Section 11).

Evidence table:

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in arch-compat.md | yes | yes | no |
| Makefile `TARGET_ARCH` branch | yes | yes | no |
| Official `.deb` release asset (v0.6.5-v0.7.1) | yes | yes | no |
| Release-blocking / CI-gated | no CI exists for any architecture (Section 7) | no CI exists for any architecture (Section 7) | no CI exists for any architecture (Section 7) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Sysbox has no JIT, no SIMD, and no numeric/compression/crypto subsystems of its own. Its only native (cgo) dependency is **libseccomp**, used by `sysbox-runc` and `sysbox-fs` (`#cgo pkg-config: libseccomp`) to compile seccomp-BPF syscall filters. Beyond that, the architecture-sensitive surface consists of: `sysbox-runc`'s `nsenter/` package (cgo C code for namespace entry, forked from `runc`), the Go cross-compilation toolchain selection in the Makefiles, and generic Linux syscall-table plumbing inherited from `opencontainers/runc`.

Sysbox does not use a per-architecture source-file convention (no `foo_arm64.go` / `foo_riscv64.go` pattern was found; `filename:arm64` and `filename:amd64` searches scoped to the org both returned 0 hits). Instead, architecture handling lives entirely in the Makefile's `TARGET_ARCH`/`SYS_ARCH` logic (Section 5) and in Go's native `GOARCH` cross-compilation.

Searching the entire `nestybox` org for riscv64-related code (`riscv`, `riscv64`, `__riscv`, `GOARCH riscv64`, `arch/riscv`, `extension:.S`) returns exactly **four** string matches, none of which is Sysbox-authored riscv64 implementation work:

| File | Repo | What it is |
|---|---|---|
| [docs/user-guide/dind.md](https://github.com/nestybox/sysbox/blob/master/docs/user-guide/dind.md) | sysbox | Sample `docker buildx` CLI output listing `linux/riscv64` as a QEMU-emulated **target platform for images built inside a Sysbox container** - documentation, unrelated to Sysbox's own host architecture |
| `libcontainer/seccomp/config.go` | sysbox-runc | Generic `SCMP_ARCH_*` name-mapping table enumerating every libseccomp-known architecture, copied wholesale from upstream `opencontainers/runc` |
| `libcontainer/system/syscall_linux_64.go` | sysbox-runc | A Go build-tag line gating a generic 64-bit syscall wrapper; riscv64 rides along passively as one of several listed 64-bit arches, no riscv64-specific logic inside |
| `libcontainer/seccomp/patchbpf/enosys_linux.go` | sysbox-runc | A C preprocessor `#define AUDIT_ARCH_RISCV64` fallback constant, present only so the file compiles cross-arch |

The `nsenter/` directory (where real arch-specific work - clone flags, syscall numbers - would live) has zero riscv64 references of any kind.

Component comparison:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `sysbox-runc` (nsenter cgo) | full | full | missing - no build target, no `#ifdef __riscv` guard |
| `sysbox-fs` (FUSE) | full | full | missing - never built for this target |
| libseccomp cgo binding | full | full | not exercised by Sysbox (dependency itself supports riscv64, see Section 9) |
| Makefile `TARGET_ARCH` | yes | yes | absent |

**Verdict: riscv64 does not qualify even as "partial" or "scalar" coverage - there is zero riscv64-specific or riscv64-exercised code path anywhere in Sysbox.** This assessment is descriptive only; Section 13 applies the optimization-purpose modifier and confirms it does not apply to Sysbox (a container runtime, not a performance-optimization library).

## 5. Build System, Cross-Compilation, and Toolchain

Sysbox uses a plain GNU Makefile build (root [Makefile](https://github.com/nestybox/sysbox/blob/master/Makefile) plus per-component Makefiles in `sysbox-runc/`, `sysbox-fs/`, `sysbox-mgr/`). There is no CMake, no `BUILDING.md`/`INSTALL`, and no `docs/cross-compilation.md`; the build documentation is [docs/developers-guide/build.md](https://github.com/nestybox/sysbox/blob/master/docs/developers-guide/build.md), whose only documented commands are:

```
make sysbox-static
make sysbox TARGET_ARCH=arm64
```

riscv64 is never mentioned as a build target anywhere in the docs.

Root Makefile architecture detection (`UNAME_M` -> `SYS_ARCH`):
```make
ifeq ($(UNAME_M),x86_64)
    SYS_ARCH := amd64
else ifeq ($(UNAME_M),aarch64)
    SYS_ARCH := arm64
else ifeq ($(UNAME_M),arm)
    SYS_ARCH := armhf
else ifeq ($(UNAME_M),armel)
    SYS_ARCH := armel
else
    SYS_ARCH := $(UNAME_M)
endif
```
and further down, `HOST_TRIPLE` defaults to `x86_64-linux-gnu` for any `TARGET_ARCH` not explicitly matched (armel/armhf/arm64) - a riscv64 target would silently receive the wrong compiler triple.

[sysbox-runc/Makefile](https://github.com/nestybox/sysbox-runc/blob/master/Makefile) cross-compile toolchain selection has explicit branches only for `armel`, `armhf`, `arm64`, and `amd64` (`GO_XCOMPILE`/`CC` set per target); **there is no riscv64 branch**, so `TARGET_ARCH=riscv64` produces no valid `GO_XCOMPILE`/`CC` pairing and the build fails or misconfigures.

The [sysbox-runc/Dockerfile](https://github.com/nestybox/sysbox-runc/blob/master/Dockerfile) build-container installs only `crossbuild-essential-{arm64,armel,armhf}` and matching `libseccomp-dev` variants on a `golang:1.16-bullseye` base image - no riscv64 cross-toolchain package, and no `qemu-user-static` binfmt setup for build-time emulation. (Separately, and unrelated to riscv64: `go.mod` requires Go 1.24.0 while the Dockerfile base image pins Go 1.16, a staleness issue independent of architecture.)

Known build failures for riscv64: none documented, because no attempt has been made; the Makefile analysis above establishes it would fail on the first cross-compile step (missing `CC`).

To add riscv64 support at the build-system level would require: (a) a `TARGET_ARCH=riscv64` branch in both the root and `sysbox-runc` Makefiles with `CC=riscv64-linux-gnu-gcc`, `GOARCH=riscv64`; (b) `crossbuild-essential-riscv64` and `libseccomp-dev:riscv64` added to `sysbox-runc/Dockerfile`; (c) filing the upstream feature-request issue that `arch-compat.md` explicitly invites.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The functional gap is total: Sysbox cannot be built for riscv64 today (Section 5), is not published for riscv64 in any channel (Section 8), and has no riscv64 CI to validate correctness even if a port were attempted (Section 7). There is no partial feature set to compare - the feature matrix below reflects "exists" vs "does not exist," not a degraded-performance comparison.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds from source | yes | yes | no (Section 5) |
| Runs as a container runtime | yes | yes | no |
| Docker-in-Docker via Sysbox | yes | yes | no |
| Official `.deb` package | yes | yes | no |

Performance-gap and NaN/floating-point analysis do not apply: Sysbox has no SIMD, numeric, or floating-point subsystem (Section 4), and there is no working riscv64 build to benchmark. Security-hardening comparison (seccomp filter parity, namespace isolation guarantees) cannot be assessed on riscv64 because no build exists to test.

## 7. CI/CD Infrastructure

**Sysbox has no CI configuration of any kind, for any architecture.** Confirmed by direct repository inspection: no `.github/workflows` directory, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` anywhere in `nestybox/sysbox`. This was cross-verified live via GitHub's code-search index, scoped to the entire `nestybox` org:

- Query `riscv org:nestybox path:.github/workflows` -> `total_count: 0`
- Query `riscv64 org:nestybox extension:yml` -> `total_count: 0`

Both confirm zero `.yml`/`.yaml` workflow files anywhere in the org reference riscv64 - because no CI workflow files exist to reference it. Build and test automation, to the extent it exists, lives in the Makefile and is presumably run manually/locally by the two maintainers. No RISE RISC-V runners are referenced anywhere in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists at all | no | no | no |
| CI builds | N/A | N/A | N/A |
| CI runs tests | N/A | N/A | N/A |
| CI-gated release | N/A | N/A | N/A |

This is a project-wide gap, not a riscv64-specific one: even amd64 and arm64, Sysbox's two officially supported architectures, have no automated CI validating them.

## 8. Distribution and Release Status

The only release channel found is [GitHub Releases](https://github.com/nestybox/sysbox/releases) on `nestybox/sysbox`. The five most recent releases checked (v0.7.1, v0.7.0, v0.6.7, v0.6.6, v0.6.5) each publish `sysbox-ce_<ver>.linux_amd64.deb` and `sysbox-ce_<ver>.linux_arm64.deb` - **no riscv64 asset in any release checked**.

No Linux distribution packages Sysbox itself, for any architecture: a search of [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=Sysbox&suite=resolute&searchon=names&section=all) for "Sysbox" returns "Sorry, your search gave no results" - the package does not exist in Ubuntu at all, let alone as a riscv64 build. [Arch Linux RISC-V (archriscv.felixc.at)](https://archriscv.felixc.at/?q=sysbox) likewise shows no `sysbox` package.

A PyPI package named `sysbox` exists ([pypi.org/project/sysbox](https://pypi.org/pypi/sysbox/json), version 0.1.2, pure-Python `py3-none-any` wheel) but is almost certainly an unrelated small Python project sharing the name - the actual Nestybox/Docker `sysbox` container runtime is Go-based and is not distributed via PyPI. No npm, Maven, or OCI-registry distribution channel was found for Sysbox in this research; data not available beyond what was checked here.

**What a user must do today to get a working riscv64 binary:** there is none available through any channel. A user would have to build from source after first adding the missing Makefile `TARGET_ARCH=riscv64` branch and cross-toolchain packages described in Section 5 - i.e., contribute the port themselves.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| **Go** | build-dependency (critical) - compiler/toolchain for all Sysbox Go components | Data not available: the Go toolchain's own riscv64 support status was not researched in this pass | Data not available | Data not available | Data not available |
| **libseccomp** | build-dependency (critical) - C library providing the seccomp-BPF backend, cgo-linked into `sysbox-runc` and `sysbox-fs` for container syscall filtering/interposition | Yes - full riscv64 support upstream since v2.5.0 (Feb 2020, PR #197); no upstream riscv64 CI, but downstream packagers build it | Live-tested on real riscv64 hardware pre-merge (5,229/5,229 tests passed per this repo's `libseccomp.md` project report); no ongoing riscv64 CI | v2.6.0 (Jan 2025) packaged in Debian, Ubuntu, and Arch RISC-V | No open riscv64 issues found. (riscv32 support is separately stalled at PR #327 - not relevant, Sysbox targets riscv64) |
| **cilium/ebpf** | runtime-dependency (critical) - Go eBPF bytecode assembler/loader used by `sysbox-runc`'s cgroup v1 device filter (`libcontainer/cgroups/ebpf/devicefilter`); loaded programs are JIT-compiled by the kernel | Yes - riscv64 issue #1110 closed 2023-08 per this repo's `runc.md` cross-reference [NEEDS VERIFICATION - not independently re-checked against cilium/ebpf's own tracker in this pass] | No dedicated riscv64 CI found; a semantic issue search on cilium/ebpf surfaced only arm64 CI issues (#266, #1460), no riscv64-specific open issues | Distributed as source Go module only, no separate binary release | No open riscv64 issues found |
| **runc** (opencontainers/runc; `sysbox-runc` is a fork/replace of this) | build-dependency (critical) - base container-runtime code that `sysbox-runc` extends | Yes - riscv64 release target since v1.2.0 (2022); no native riscv64 CI runner upstream | An integration-test image (busybox) exists for riscv64 but has never been executed in CI (issue #5166, closed unresolved, March 2026) | v1.5.0 (June 2026) ships `runc.riscv64` plus signature | Issue #3950 (static-link-on-musl regression, may trace to a riscv64 1.1.x backport, PR #3905); no correctness blockers found for normal run/exec/kill |
| libseccomp-golang (indirect - Go cgo binding wrapping libseccomp, consumed by `sysbox-runc`/`sysbox-fs`) | indirect build-dependency | Yes - riscv64 support added, issue #52 closed 2021-09-11 | Not verified in CI on riscv64 [NEEDS VERIFICATION] | Consumed as a Go module; no separate release artifacts | 0 open riscv64 issues found |
| opencontainers/selinux (indirect - transitive Go module dependency of `sysbox-fs`, bumped via [sysbox-fs#114](https://github.com/nestybox/sysbox-fs/pull/114)) | indirect build-dependency | Only evidence found is that the upstream changelog quoted in the Dependabot PR body mentions an unrelated selinux-repo PR extending its own `build-cross` target with riscv64 - not a Sysbox-authored or Sysbox-tested change | Data not available | Data not available | [NEEDS VERIFICATION - single-source mention inside a Dependabot changelog quote] |

Sysbox itself carries no crypto, compression, SIMD, or custom-allocator dependency - it is a pure-Go container runtime plus one cgo binding (libseccomp). The critical-dependency chain (libseccomp, cilium/ebpf, runc) is functionally complete for riscv64 upstream (working releases/packages exist even without upstream CI); **the blocker is entirely in Sysbox's own build/release/CI process, not in its dependencies.**

## 10. Ecosystem Status

Omitted. Sysbox is a standalone systems tool (a container runtime) with no dependent package ecosystem (no Python/npm/Maven/Kubernetes-operator packages that consume Sysbox as a library) identified in this research.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [nestybox/sysbox#592](https://github.com/nestybox/sysbox/issues/592) | "qemu-multiarch support" | Closed | N/A - not a riscv64 bug | Tracks a fix (landed in Sysbox v0.6.7) so `docker buildx` can build **target** images for architectures including `linux/riscv64` from **inside** a Sysbox container via binfmt_misc/QEMU. This is about Sysbox enabling cross-arch guest image builds, not about Sysbox running on a riscv64 **host**. No RISC-V text appears in the issue body itself. |
| [nestybox/sysbox-fs#114](https://github.com/nestybox/sysbox-fs/pull/114) | "Bump github.com/opencontainers/selinux from 1.8.0 to 1.13.0" | Merged (2026-07-25) | N/A - dependency bump, no code changes | Dependabot PR; the only riscv64 text present is inside the *upstream* selinux library's own changelog, which the PR body quotes verbatim. Reviewer (ctalledo) comment: "clean go.mod/go.sum bump, builds cleanly, no code changes." Not a Sysbox riscv64 change. |

**No correctness bugs, performance regressions, or NaN/floating-point issues specific to riscv64 exist for Sysbox**, because no riscv64 port has ever been attempted - there is no code to be buggy. GitHub issue search across the entire `nestybox` org for `riscv`, `riscv64`, and `risc-v` (issues, PRs, and commits) returns zero results beyond the two tangential items above.

## 12. Objections and Upstream Blockers

No explicit maintainer objection to riscv64 was found - no issue exists where riscv64 support was requested and rejected. `docs/arch-compat.md` frames new-architecture support as welcome in principle ("Please file a new issue if you have a use-case that requires a non-supported architecture" and "it's expected to be mostly a testing/validation exercise"), but this is an untested invitation: no riscv64 request has ever been filed against `nestybox/sysbox` or any sibling repo.

**Technical blockers:** no `TARGET_ARCH=riscv64` Makefile branch, no riscv64 cross-toolchain in the `sysbox-runc` build Docker image, and - most significantly - **no CI infrastructure exists for any architecture**, meaning even a correctly-built riscv64 port could not be automatically validated on merge; it would rely entirely on manual maintainer testing.

**Organizational blockers:** a two-person maintainer team (both Docker employees) operating a benevolent-maintainer PR-approval process, with Docker's own involvement explicitly framed as "best-effort" and "not officially supported." There is no foundation-backed or tiered acceptance process, and no roadmap commitment to riscv64 was found anywhere (README, issues, blog, or elsewhere).

**Acceptance probability:** Given the explicit "expected to be mostly a testing/validation exercise" framing in `docs/arch-compat.md`, a well-tested community PR adding riscv64 support has a plausible path to acceptance in principle. However, the total absence of any CI infrastructure (Section 7) - which also affects the project's two currently-supported architectures - means such a PR would need to include its own validation evidence (e.g., manual test runs on real riscv64 hardware) rather than relying on any automated gate, raising the practical bar for a successful contribution. No RISE involvement, funded work, or open PR toward a riscv64 port was found anywhere (Section 13).

## 13. Readiness Assessment

- **Color:** orange (color_case: `downstream-only`, applied as the general "no upstream riscv64 CI" floor - noting explicitly that no downstream distribution actually packages Sysbox for riscv64, or for any architecture, either; this is a total-absence orange, not one softened by a distro-provided fallback)
- **Release provider:** none
- **Optimization gap:** N/A - Sysbox is a container runtime/systems tool, not an optimization-purpose project (no SIMD/vectorization/numerics workload whose value proposition depends on architecture-specific hot-path code). The Step 2 optimization-code-coverage modifier does not apply, and no Optimization level is reported in the header.
- **Justification:** Sysbox has no upstream CI for any architecture (confirmed by the absence of `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml`, and by a zero-result GitHub code-search of the whole org for riscv64 in `.yml` workflow files), publishes riscv64 release assets nowhere (only `linux_amd64.deb`/`linux_arm64.deb` across the five most recent [releases](https://github.com/nestybox/sysbox/releases)), and is packaged by no Linux distribution for any architecture (confirmed via a zero-result [Ubuntu 26.04 package search](https://packages.ubuntu.com/search?keywords=Sysbox&suite=resolute&searchon=names&section=all)). Its own [docs/arch-compat.md](https://github.com/nestybox/sysbox/blob/master/docs/arch-compat.md) lists only amd64 and arm64 as supported. This is the base "no upstream riscv64 CI" state of the color model's Step 1 table, which yields orange; there is no distro-package floor to apply upward because no distro ships the package at all.
- **Pending work that could change the grade:** none found. No open PR, no tracking issue, and no RISE project involvement exists anywhere for Sysbox (checked against RISE's blog post index, member list, `riseproject-dev` GitHub org repositories, and the RISE Python wheel builder - none reference Sysbox). The grade will not move without a new contribution or a change in upstream CI/release posture.

## 14. Investment Analysis

RISE has not funded, referenced, or otherwise touched Sysbox anywhere found in this research (Section 12); all of the work below is unaddressed and would need to be sized and resourced from scratch.

### 14.1 Functional Enablement

- Add a `TARGET_ARCH=riscv64` branch to the root [Makefile](https://github.com/nestybox/sysbox/blob/master/Makefile) and [sysbox-runc/Makefile](https://github.com/nestybox/sysbox-runc/blob/master/Makefile), including a correct `HOST_TRIPLE`/`CC=riscv64-linux-gnu-gcc` and `GO_XCOMPILE` entry (Section 5).
- Add `crossbuild-essential-riscv64` and `libseccomp-dev:riscv64` to [sysbox-runc/Dockerfile](https://github.com/nestybox/sysbox-runc/blob/master/Dockerfile).
- Validate the `nsenter/` cgo C code (namespace entry, clone flags) compiles and behaves correctly under riscv64 - this package has zero riscv64 references today and has never been exercised on the architecture.
- Validate the `sysbox-fs` FUSE-based virtual filesystem layer against a riscv64 Linux kernel.
- Because Sysbox interacts deeply with Linux namespaces, cgroups, and seccomp, functional validation requires live testing on real riscv64 hardware or a full-system emulator, not just a successful cross-compile.
- File the upstream feature-request issue that `docs/arch-compat.md` explicitly invites, to establish maintainer buy-in before investing further.

### 14.2 Performance Optimization

Not applicable / low priority. Sysbox has no SIMD, numeric, or vectorized hot path (Section 4); its value proposition (secure, unprivileged system containers) does not depend on architecture-specific performance tuning the way an optimization-purpose library would.

### 14.3 CI/CD Infrastructure

Sysbox has no CI for any architecture today (Section 7) - this is a prerequisite gap larger than riscv64 alone. Establishing general CI (e.g., GitHub Actions covering build + test for amd64/arm64) would need to precede or accompany a riscv64 CI job. RISE's own [RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) infrastructure explicitly supports "Docker-in-Docker available out of the box," which is architecturally relevant to what Sysbox provides, but that finding describes RISE's generic runner design, not any Sysbox-specific integration or funding commitment.

### 14.4 Ecosystem Enablement

N/A - no dependent package ecosystem was identified for Sysbox (Section 10).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 Makefile/Dockerfile cross-compile targets | 1-2 | Contributor / maintainer-reviewed | Critical |
| Functional | Validate `nsenter` cgo/namespace code on riscv64 hardware | 2-4 | Contributor with riscv64 hardware access | Critical |
| Functional | Validate `sysbox-fs` FUSE layer on riscv64 kernel | 2-3 | Contributor with riscv64 hardware access | High |
| Functional | File upstream feature-request issue, secure maintainer buy-in | 0.5 | Requesting org | Critical (blocking, low effort) |
| CI/CD | Stand up general CI (amd64/arm64) as a prerequisite, since none exists today | 3-5 | Contributor / Docker maintainers | High (blocks any CI-gated riscv64 support) |
| CI/CD | Add riscv64 CI job once general CI exists (build, then test) | 1-2 | Contributor, possibly using RISE runners | Medium |
| Distribution | Add riscv64 `.deb` release asset to GitHub Releases pipeline | 0.5-1 | Maintainers | Medium |
| Ecosystem | N/A | - | - | - |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [nestybox/sysbox (repository)](https://github.com/nestybox/sysbox)
- [nestybox/sysbox releases](https://github.com/nestybox/sysbox/releases)
- [docs/arch-compat.md](https://github.com/nestybox/sysbox/blob/master/docs/arch-compat.md)
- [docs/developers-guide/build.md](https://github.com/nestybox/sysbox/blob/master/docs/developers-guide/build.md)
- [docs/user-guide/dind.md](https://github.com/nestybox/sysbox/blob/master/docs/user-guide/dind.md)
- [MAINTAINERS](https://github.com/nestybox/sysbox/blob/master/MAINTAINERS)
- [CONTRIBUTING.md](https://github.com/nestybox/sysbox/blob/master/CONTRIBUTING.md)
- [README.md](https://github.com/nestybox/sysbox/blob/master/README.md)
- [LICENSE](https://github.com/nestybox/sysbox/blob/master/LICENSE)
- [Makefile](https://github.com/nestybox/sysbox/blob/master/Makefile)
- [sysbox-runc/Makefile](https://github.com/nestybox/sysbox-runc/blob/master/Makefile)
- [sysbox-runc/Dockerfile](https://github.com/nestybox/sysbox-runc/blob/master/Dockerfile)
- [nestybox/sysbox issue #592, "qemu-multiarch support"](https://github.com/nestybox/sysbox/issues/592)
- [nestybox/sysbox-fs PR #114, selinux dependency bump](https://github.com/nestybox/sysbox-fs/pull/114)
- [GitHub code search: riscv in nestybox/.github/workflows](https://github.com/search?q=riscv+org%3Anestybox+path%3A.github%2Fworkflows&type=code)
- [GitHub code search: riscv64 in nestybox *.yml files](https://github.com/search?q=riscv64+org%3Anestybox+extension%3Ayml&type=code)
- [PyPI: sysbox package (unrelated project)](https://pypi.org/pypi/sysbox/json)
- [Ubuntu 26.04 "resolute" package search: Sysbox](https://packages.ubuntu.com/search?keywords=Sysbox&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search: sysbox](https://archriscv.felixc.at/?q=sysbox)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members](https://riseproject.dev/members/)
- Internal report: `project-reports/libseccomp.md` (this repository, consulted for libseccomp riscv64 status)
- Internal report: `project-reports/runc.md` (this repository, consulted for runc and cilium/ebpf riscv64 status)
