---
title: Odigos
parent: Project Reports
color: orange
dependencies:
  - name: eBPF
    relation: runtime-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: Kubernetes
    relation: runtime-dependency
    criticality: critical
  - name: OpenTelemetry eBPF Instrumentation
    relation: build-dependency
    criticality: critical
  - name: OpenTelemetry Go Instrumentation
    relation: build-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: optional
  - name: Buildx
    relation: build-dependency
    criticality: optional
  - name: GoReleaser
    relation: build-dependency
    criticality: optional
---

# Odigos

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Odigos<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="odigos" %}

## 1. Project Overview

Odigos ([odigos-io/odigos](https://github.com/odigos-io/odigos), [odigos.io](https://odigos.io/)) is a Kubernetes-native, mostly-eBPF-based "zero-code" OpenTelemetry auto-instrumentation platform. It is implemented as a Go monorepo (no single root `go.mod`; separate modules for `odiglet`, `instrumentation`, `common`, `cli`, `operator`, etc.) and is distributed as a CLI binary, container images (odiglet, collector, autoscaler, scheduler, instrumentor, ui, operator, agents), and Helm charts. License is Apache 2.0 ([LICENSE](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/LICENSE)).

Governance is not formalized: there is no `GOVERNANCE.md` in the repository, and Odigos is not part of a neutral foundation (not CNCF-hosted, no Linux Foundation affiliation found). All code changes are gated by a single team, `@keyval-dev/odigos-maintainers`, per [`.github/CODEOWNERS`](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.github/CODEOWNERS) (`keyval-dev` is the project's legacy GitHub org name, predating its rename to Odigos); `operator/OWNERS` lists a single individual owner (`damemi`). The company behind the project (Odigos, formerly Keyval) is VC-backed, per its own site, by Y Combinator, Mango Capital, Salesforce Ventures, and Venture Guides [NEEDS VERIFICATION - single source, odigos.io]. Top contributors by commit count (blumamir, BenElferink, tamirdavid1, alonkeyval, RonFed, edeNFed, damemi) all show no outside-corporation affiliation in their public GitHub profile `company` field except two listed as "Odigos" itself - this is effectively a single-company-staffed maintainer group with no evidence of contributors from other organizations.

Community culture on new architecture ports: no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repository, and `VERSIONING.md` documents only release channels (stable/RC/pre-release), not architecture tiers. There is no RFC, discussion thread, or roadmap item anywhere in the project's issue tracker, PR history, or commit history regarding RISC-V or any additional CPU architecture - the topic has never been raised. Any new port would have to go through the core maintainer team informally, with no established, documented process for architecture additions.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been proposed, started, or discussed | Exhaustive search below |

No milestone table can be populated because there is no port history to report. Verification performed:
- `search_issues`, `search_pull_requests`, `search_commits`, and `search_code` in [odigos-io/odigos](https://github.com/odigos-io/odigos), queried for `riscv`, `riscv64`, and `RISC-V` - all returned zero genuine results (see Section 11 for the false-positive analysis of the handful of loosely-matched PRs the search API surfaced).
- Direct grep of all 40 `.github/workflows/*.yml` files at commit `14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628` for "riscv" (case-insensitive) - zero matches in every file.
- Repo-wide grep for "riscv" - the only two genuine hits are incidental npm lockfile entries (`frontend/webapp/yarn.lock`, `docs/yarn.lock`) listing `@esbuild/linux-riscv64` and `@img/sharp-linux-riscv64` as optional platform binaries pulled in transitively by JS frontend tooling (esbuild, sharp) - not Odigos-authored code or evidence of Odigos RISC-V support.
- No key contributors, no organizations, and no first commit exist to report. **It is not upstream at all** - there is no code, workflow entry, build target, or tracked issue referencing RISC-V anywhere in the project's history.

## 3. Upstream Support Tier

There is no formal tiering document. The de-facto platform-support policy lives in the build tooling:
- [`.goreleaser.yaml`](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.goreleaser.yaml) (CLI release build): `goarch: [amd64, arm64]`.
- `collector/.goreleaser.yaml`: same `goarch: [amd64, arm64]`.
- Root, `odiglet/`, `collector/`, and `operator/` `Dockerfile`s: multi-stage Go builds using `ARG TARGETARCH` via Docker Buildx, built for `linux/amd64` and `linux/arm64` only.
- Seven GitHub Actions workflow files (`full-build.yaml`, `release.yml`, `publish-modules.yml`, `publish-modules-rhel.yml`, `publish-collector-linux-packages.yml`, `publish-odiglet-base-builder.yaml`, `verify-odiglet-base-builder.yaml`) all hardcode `platforms: linux/amd64,linux/arm64`.

This is release-blocking in the sense that it is the exhaustive list of what the release workflows can ever produce - riscv64 is not present as a build target, a disabled matrix entry, or a documented future goal anywhere in these files.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI tests | Yes | Yes | No (no CI job exists) |
| Official release binaries (CLI) | Yes (`cli_*_linux_amd64.tar.gz`) | Yes (`cli_*_linux_arm64.tar.gz`) | No |
| Official container images | Yes | Yes | No |

Source: [odigos-io/odigos releases](https://github.com/odigos-io/odigos/releases) (`v1.37.0-rc1` and `v1.36.0` asset lists checked directly), [`.goreleaser.yaml`](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.goreleaser.yaml), and the workflow files cited above.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Odigos' cross-architecture support is implemented entirely through pure, architecture-agnostic Go (`CGO_ENABLED=0`, `GOARCH=$TARGETARCH` passed generically at build time) plus Docker Buildx multi-platform manifests hardcoded to `linux/amd64,linux/arm64`. There are no architecture-suffixed Go source files for *any* architecture: GitHub code search for `filename:*_arm64.go` and `filename:*_amd64.go` scoped to `repo:odigos-io/odigos` both returned zero results. There is consequently no per-architecture hand-tuned code, no assembly, and no SIMD/crypto intrinsics of any kind in the Odigos codebase itself - all architecture sensitivity lives one layer down, in Odigos' eBPF instrumentation dependencies (see Section 9).

The one genuinely architecture-sensitive subsystem Odigos owns directly is its eBPF loading and process-lifecycle tracking (`odiglet/pkg/ebpf/...`, `github.com/odigos-io/runtime-detector`), which relies on `github.com/cilium/ebpf` for CO-RE bytecode loading, BTF relocation, and kprobe/uprobe attachment. This code is architecture-generic Go wrapping Linux `bpf()` syscalls; no riscv64-specific incompatibility was found in it, but it has never been built or tested on riscv64 (see Section 9 for the full dependency-level breakdown).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core Go control-plane/CLI code | full (compiled, tested, released) | full (compiled, tested, released) | missing (never built) |
| eBPF loader / uprobe-kprobe attach (`cilium/ebpf`, `runtime-detector`) | full | full | untested - plausibly portable, no CI evidence either way |
| eBPF auto-instrumentation engines (OBI, `opentelemetry-go-instrumentation`) | full | full | missing (upstream scopes to amd64/arm64 only, per project documentation) [NEEDS VERIFICATION - single-source claim, no specific OBI docs URL captured during research] |

## 5. Build System, Cross-Compilation, and Toolchain

Odigos is a Go + `Makefile` + Docker Buildx project - there is no CMake, no `configure` script, and no `BUILDING.md`/`INSTALL`/`docs/building.md`/`docs/cross-compilation.md`. The actual build/dev docs are `DEVELOPMENT.md`, `CONTRIBUTING.md`, and the root `Makefile`.

- Toolchain: `golang:1.26.6` (root, `odiglet`) and `golang:1.26.6-trixie` (`collector`) Docker base images - architecture-agnostic Go version pins, not riscv64-specific.
- Build command pattern (from `Makefile`/`cli.mk` and the Dockerfiles): `CGO_ENABLED=0 GOARCH=$TARGETARCH go build ...`, invoked through `docker buildx build --platform linux/amd64,linux/arm64 ...`. No `-DUSE_X=OFF`-style flags exist (that is a CMake convention; this project has none).
- QEMU is used only implicitly, via Docker Buildx multi-arch emulation for the amd64/arm64 platform pairs already in the matrix - it is never invoked for riscv64.
- Since `linux/riscv64` has been an official Go port since Go 1.14 (a second-tier, non-Tier-1 Go port, but actively maintained) [NEEDS VERIFICATION - not independently re-verified against go.dev in this research pass; stated from general Go-project knowledge in the dependency-analysis finding, not confirmed against a primary source this session], the pure-Go pieces of Odigos are plausibly `GOARCH=riscv64`-buildable today with a one-line change to the `goarch:`/`platforms:` lists. This has never been attempted or documented: no known build failure exists because no build has ever been tried.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CLI install/run | Yes | Yes | No - no binary published, unverified if it would build |
| Odiglet (node agent, eBPF auto-instrumentation) | Yes | Yes | No - OBI/opentelemetry-go-instrumentation scope to amd64/arm64 only |
| Collector deployment | Yes | Yes | No |
| Operator / Helm install | Yes | Yes | No |
| Kubernetes cluster compatibility | Any amd64 node pool | Any arm64 node pool | Not applicable - no image exists to schedule |

Functional gap: a riscv64 Kubernetes node cannot run any Odigos component at all - not "with reduced performance," but not at all, since no container image is published or buildable via the existing CI/release pipeline, and Odigos' core value proposition (eBPF-based zero-code instrumentation) depends on `go.opentelemetry.io/obi` and `go.opentelemetry.io/auto`, both of which explicitly scope to amd64/arm64 in their own documentation. There is no performance-gap analysis to make (no SIMD/vectorization claims apply to this project) and no NaN/floating-point semantics concerns (Odigos is not a numerics library). Security-hardening gap: none identified beyond the blanket absence of a riscv64 build to harden in the first place.

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was verified by directly reading all 40 files in [`.github/workflows/`](https://github.com/odigos-io/odigos/tree/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.github/workflows) at commit `14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628` (re-confirmed current via a fresh `git fetch origin main`, which returned the identical SHA):

- Every `grep -ni "riscv"` (and the alternate spelling `rv64`) across all 40 workflow files returned zero matches.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at the repo root.
- Every Docker Buildx `platforms:` line in the workflow tree is either `linux/amd64` (8 occurrences in `build.yaml`) or `linux/amd64,linux/arm64` (`full-build.yaml`, `publish-collector-linux-packages.yml`, `publish-modules-rhel.yml` x2, `publish-modules.yml`, `publish-odiglet-base-builder.yaml`, `verify-odiglet-base-builder.yaml`).
- Every `runs-on:` value across all 40 files resolves to `ubuntu-latest`, `ubuntu-22.04`, or a Depot cloud x86 runner (`depot-ubuntu-latest`, `depot-ubuntu-24.04`, `depot-ubuntu-24.04-2`, `depot-ubuntu-24.04-4`, `depot-ubuntu-24.04-8`, `depot-ubuntu-24.04-16`) - none are RISC-V runners, and no RISE RISC-V Runner reference (`riseproject-dev` or a RISE runner label) appears anywhere.
- The two matrix-driven workflows (`publish-modules.yml`, `publish-modules-rhel.yml`) were expanded in full: all 8 `runner:` values across the 8 published services (autoscaler, scheduler, instrumentor, collector, odiglet, ui, operator, agents) are Depot x86 cloud runners.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job exists | Yes | Yes | No |
| CI test job exists | Yes | Yes | No |
| Native or emulated hardware | Native cloud runners | QEMU/Buildx emulation on x86 runners | N/A - no job |
| RISE RISC-V Runner usage | No | No | No |

## 8. Distribution and Release Status

No riscv64 artifact exists through any distribution channel checked:

- **GitHub releases**: `v1.37.0-rc1` (latest) and `v1.36.0` asset lists on [odigos-io/odigos releases](https://github.com/odigos-io/odigos/releases) contain only `cli_*_{darwin,linux,windows}_{amd64,arm64}.tar.gz`, `checksums.txt`, two Helm chart `.tgz` files, and source archives - zero riscv64 filenames in either release.
- **PyPI**: [`https://pypi.org/pypi/odigos/json`](https://pypi.org/pypi/odigos/json) returns HTTP 404 - there is no PyPI package named "odigos" at all (Odigos is a Go CLI/Kubernetes tool, not a Python package), so there is no upstream Python wheel matrix to check for riscv64.
- **RISE Python wheel builder**: [`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/odigos/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/odigos/) 302-redirects to `pypi.org/simple/odigos/`, which itself 404s - no entry, consistent with there being no PyPI package.
- **Ubuntu**: [`packages.ubuntu.com` search](https://packages.ubuntu.com/search?keywords=odigos&suite=resolute&searchon=names&section=all) for Ubuntu 26.04 "resolute" returns "Sorry, your search gave no results" - no `odigos` package exists for any architecture, let alone riscv64.
- **Arch Linux RISC-V port**: [`archriscv.felixc.at`](https://archriscv.felixc.at/?q=odigos) lists no `odigos` package.
- **Ubuntu 26.04 riscv64 project-graph database**: the `project-graph` MCP server failed to connect for the entire research session (`CONNECTION_CLOSED`). This is an unresolved gap, not a confirmed-empty result, though the direct `packages.ubuntu.com` check above independently corroborates non-existence.

**To get a working riscv64 Odigos binary today, a user would have to**: fork the repository, add `riscv64` to `.goreleaser.yaml`'s `goarch:` list and to every Docker Buildx `platforms:` line, resolve or accept the absence of riscv64 support in `go.opentelemetry.io/obi` and `go.opentelemetry.io/auto` (Odigos' core eBPF auto-instrumentation engines), and self-build and self-host every container image and CLI binary. No upstream, RISE, or distro-provided path exists.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| eBPF (Linux kernel eBPF subsystem: JIT, kprobes/uprobes, CO-RE) | runtime-dependency, critical | Yes - RV64G BPF JIT and riscv kprobe/kretprobe support are merged upstream in the Linux kernel [NEEDS VERIFICATION - cited from prior research without a direct commit link captured this session] | Partial gap exists (see below) | Yes, via distro kernels | Independently tracked; not an Odigos-specific gap |
| Go | build-dependency, critical | Yes - `linux/riscv64` is an official Go port since Go 1.14 [NEEDS VERIFICATION - not re-verified against go.dev this session] | Yes, via Go's own upstream builders (separate from Odigos' test matrix) | Yes (Go toolchain itself ships for riscv64) | No blocker in Go itself |
| Linux kernel | runtime-dependency, critical | Yes | See eBPF note above | Yes, via distro kernels | Foundational; not Odigos-specific |
| Kubernetes | runtime-dependency, critical | Not independently verified this session; Kubernetes upstream riscv64 status was out of scope for this report's research | Not verified | Not verified | Data not available: this report did not search Kubernetes' own riscv64 CI/release status |
| OpenTelemetry eBPF Instrumentation (`go.opentelemetry.io/obi`, `open-telemetry/opentelemetry-ebpf-instrumentation`) | build-dependency, critical | No - project documentation scopes support to Linux amd64/arm64 only; pre-built binaries ship for those two arches only [NEEDS VERIFICATION - single source, no specific docs URL captured] | None found | None - amd64/arm64 only | No riscv64 GitHub issue found for this dependency during research; gap is an unaddressed scope limitation, not a tracked bug |
| OpenTelemetry Go Instrumentation (`go.opentelemetry.io/auto`, `open-telemetry/opentelemetry-go-instrumentation`) | build-dependency, critical | No - same amd64/arm64-only scope as OBI | None found | None | Same scope gap as OBI; no tracked riscv64 issue found |
| Docker | build-dependency, optional | Yes - Docker Engine and Buildx run on riscv64 in general use [NEEDS VERIFICATION - not independently re-checked this session] | N/A (tooling, not tested code) | N/A | Not Odigos-specific; used only as the build/packaging mechanism |
| Buildx | build-dependency, optional | Same as Docker above | N/A | N/A | Odigos' own Buildx invocations are hardcoded to `linux/amd64,linux/arm64` regardless of Buildx's own riscv64 capability |
| GoReleaser | build-dependency, optional | Not independently verified this session | N/A | N/A | Odigos' `.goreleaser.yaml` restricts `goarch` to `[amd64, arm64]` regardless of GoReleaser's own riscv64 capability |

Deep-dive on the critical, architecture-sensitive dependencies:

**`cilium/ebpf`** (transitive, via `odiglet`, `instrumentation`, and the `obi` submodule, versions v0.20.0/v0.22.0 observed) - the core Go library Odigos and OBI use to load/attach eBPF programs (the `bpf()` syscall wrapper, BTF/CO-RE relocation, map/program management). It is pure Go with an architecture-generic syscall path; upstream CI covers amd64/arm64 only, with no riscv64 runners, and no riscv64-specific GitHub issue was found (only unrelated arm64 CI issues). This is "likely buildable, unverified" rather than confirmed-working - the blocker is CI coverage, not a known incompatibility.

**`github.com/odigos-io/runtime-detector`** (Odigos' own eBPF process-lifecycle tracker, used by `odiglet` for exec/exit detection) - built on `cilium/ebpf` plus generic scheduler tracepoints, with no obvious architecture-specific assembly. No CI evidence either way; no riscv64 issue found in its own issue tracker.

**Linux kernel eBPF JIT/kprobes/uprobes** - the runtime substrate everything above depends on. RV64G BPF JIT and riscv kprobe/kretprobe support exist upstream, and `CONFIG_UPROBE_EVENTS` is a generic kernel option available on riscv64. A previously-identified gap (from an existing kernel-focused report referenced in research, not independently re-verified here) is that neither riscv64 nor arm64 BPF JITs implement 1-/2-byte read-modify-write atomics, a hardware atomic-memory-operation (AMO) limitation [NEEDS VERIFICATION - single-source claim carried from prior research this session, arm64 comparison unverified].

**Compression libraries** (`klauspost/compress`, `andybalholm/brotli`, `golang/snappy`, `pierrec/lz4/v4`, all indirect via OTel exporters) - pure Go with amd64/arm64 assembly fast paths and portable Go scalar fallbacks; expected to build and run correctly on riscv64 without the vectorized fast paths, though this was not independently tested. No riscv64 issues were found for any of them.

**`golang.org/x/crypto`** (indirect, TLS/cert handling for the control plane and OpAMP connections) - pure Go; Go's `crypto/*` and `x/crypto` build on all Go-supported ports, no known riscv64 issue.

## 10. Ecosystem Status

Not applicable. Odigos is a standalone Kubernetes-native tool distributed as a CLI binary, container images, and Helm charts - it has no dependent package ecosystem (no PyPI package exists at all; see Section 8) requiring separate riscv64 enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue, PR, or bug exists | N/A | N/A | Exhaustive search across `search_issues`, `search_pull_requests`, `search_commits`, `search_code` (queried for `riscv`, `riscv64`, `RISC-V`) all returned zero genuine matches in [odigos-io/odigos](https://github.com/odigos-io/odigos) |

Two categories of false positives were investigated and ruled out:

- **[Issue #1236](https://github.com/odigos-io/odigos/issues/1236)** "support for multi-arch dev builds (arm and x86)" (closed, opened 2024-05-27, labeled `stale`) - surfaced by a semantic query for `arch riscv`. Read in full: the issue requests multi-arch dev builds for ARM and x86 only; it contains no mention of RISC-V or riscv64 anywhere in its body or comments.
- **Six Dependabot dependency-bump PRs** ([#5774](https://github.com/odigos-io/odigos/pull/5774), [#5772](https://github.com/odigos-io/odigos/pull/5772), [#5285](https://github.com/odigos-io/odigos/pull/5285), [#4426](https://github.com/odigos-io/odigos/pull/4426), [#4318](https://github.com/odigos-io/odigos/pull/4318), [#3269](https://github.com/odigos-io/odigos/pull/3269)) - surfaced by a fuzzy/semantic fallback search for `riscv64`. All are routine `helm.sh/helm` or `charset-normalizer` version bumps; PR #5285 was read in full and its only "riscv" occurrence is a quoted upstream `charset-normalizer` changelog line ("chore: ast_serialize musl missing prebuilt riscv,s390x,ppc64le") referring to that Python dependency's own wheel-build matrix, unrelated to Odigos running on RISC-V. Of the six, only #5774 and #5772 remain open (as routine dependency bumps unrelated to RISC-V); the rest are closed unmerged.

No correctness bugs, performance issues, or benchmark data exist to report for Odigos on riscv64, because no riscv64 build has ever existed to generate them.

## 12. Objections and Upstream Blockers

No stated objections exist - because the topic has never been raised, there is no record of any maintainer accepting, rejecting, or discussing a riscv64 port. Technical blockers:

- Odigos' core value-add, the eBPF auto-instrumentation engines (`go.opentelemetry.io/obi` and `go.opentelemetry.io/auto`), explicitly scope to amd64/arm64 only per their own documentation [NEEDS VERIFICATION - single source]. This is the primary technical blocker, since Odigos itself is otherwise pure Go with no known riscv64-incompatible code.
- `cilium/ebpf` and `github.com/odigos-io/runtime-detector` are plausibly portable but have never been built or tested on riscv64 - this is an unknown, not a confirmed blocker.

Organizational blockers: Odigos has no documented architecture-support tier policy and no public RFC process for new platforms; any port proposal would have to go through the single-vendor `@keyval-dev/odigos-maintainers` team informally. Given the single-vendor, VC-backed governance model, there is no external pressure (foundation mandate, multi-vendor steering committee) that would prioritize a riscv64 port absent a customer or community request, of which none currently exists.

Acceptance probability: Data not available - no proposal has ever been made, so there is no maintainer response to gauge acceptance likelihood from.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No upstream riscv64 CI exists in any of the 40 [`.github/workflows/*.yml`](https://github.com/odigos-io/odigos/tree/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.github/workflows) files (confirmed by direct per-file grep and by [`search_code`](https://github.com/odigos-io/odigos) returning zero results), and no Linux distribution ships an Odigos package at all - not even unpatched - so the distribution floor cannot even engage (see [Ubuntu 26.04 "resolute" search](https://packages.ubuntu.com/search?keywords=odigos&suite=resolute&searchon=names&section=all), which returns no results for any architecture). Per the color model's Step 1, absent upstream CI and absent any distro floor defaults to orange, not red (no positive evidence of breakage exists - riscv64 has simply never been attempted) and not grey (research was exhaustive across CI, releases, PyPI, Ubuntu, Arch, and issue/PR/commit search, rather than data-starved).
- Odigos is not an optimization-purpose project (it is an observability/distributed-tracing tool, not a performance-differentiated algorithm library), so the Step 2 optimization modifier does not apply and no "Optimization level" header field is used.
- **Pending work that could change the grade:** none identified. Odigos is not a RISE member, has no RISE blog coverage, does not appear on the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/), and has no dedicated `riseproject-dev` GitHub org repo. Its only trace within the RISE ecosystem is a single queued entry in this repository's own [`project-reports/.queue.yml`](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/.queue.yml) - a backlog list of candidate projects awaiting a RISC-V-readiness report, not evidence of active engineering work. No open PR, issue, or roadmap item exists anywhere that would move this project's readiness state.

## 14. Investment Analysis

RISE has not funded, benchmarked, or otherwise engaged with Odigos in any capacity found during this research (see Section 13) - all work sized below is unaddressed and would be new investment.

### 14.1 Functional Enablement

The primary blocker is not Odigos' own code (pure Go, no architecture-specific source) but its two core eBPF instrumentation dependencies (`go.opentelemetry.io/obi`, `go.opentelemetry.io/auto`), which scope to amd64/arm64 only. Enabling Odigos on riscv64 requires, at minimum: (1) upstream riscv64 support landing in OBI and/or `opentelemetry-go-instrumentation` first (external dependency, not sizeable as Odigos-team work), (2) adding `riscv64` to `.goreleaser.yaml`'s `goarch` list and every Buildx `platforms:` line across seven workflow files and four Dockerfiles, and (3) validating `cilium/ebpf` and `runtime-detector` actually load/attach BPF programs correctly on a real riscv64 kernel.

### 14.2 Performance Optimization

Not applicable - Odigos is not a performance-optimization-purpose project, and no riscv64-specific performance work is warranted before functional enablement exists.

### 14.3 CI/CD Infrastructure

Once a riscv64 build path exists, Odigos would need a riscv64 CI runner (RISE RISC-V Runners are a plausible fit, per [the RISE runner announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), though Odigos has not adopted them) added to its existing Depot-cloud-runner-based workflow matrix, mirroring the existing amd64/arm64 build-and-test jobs.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm/land riscv64 support in `go.opentelemetry.io/obi` and `go.opentelemetry.io/auto` (external upstream dependency; not directly ownable by an Odigos-focused effort) | Data not available - depends entirely on external project scope and willingness, not sizeable from Odigos-side research alone | OBI / opentelemetry-go-instrumentation maintainers | Critical (blocking) |
| Functional | Add `riscv64` to `.goreleaser.yaml` goarch and all Buildx `platforms:` entries; validate `cilium/ebpf` / `runtime-detector` load and attach correctly on riscv64 | 2-3 | Odigos maintainers or external contributor | High (once OBI/auto unblock exists) |
| CI/CD | Add a riscv64 build-and-test job (e.g. via RISE RISC-V Runners) to the existing workflow matrix | 1 | Odigos maintainers or external contributor | Medium (follows functional enablement) |
| Functional | End-to-end validation on a real riscv64 Kubernetes node (eBPF attach, instrumentation correctness) | 1-2 | Odigos maintainers or external contributor | High (once build exists) |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [odigos-io/odigos (GitHub repository)](https://github.com/odigos-io/odigos)
- [Odigos homepage](https://odigos.io/)
- [odigos-io/odigos LICENSE](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/LICENSE)
- [odigos-io/odigos .github/CODEOWNERS](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.github/CODEOWNERS)
- [odigos-io/odigos .goreleaser.yaml](https://github.com/odigos-io/odigos/blob/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.goreleaser.yaml)
- [odigos-io/odigos .github/workflows](https://github.com/odigos-io/odigos/tree/14e4aaef8f8c9ab3b20507dccd9fb3228c7a9628/.github/workflows)
- [odigos-io/odigos releases](https://github.com/odigos-io/odigos/releases)
- [odigos-io/odigos issue #1236](https://github.com/odigos-io/odigos/issues/1236)
- [odigos-io/odigos PR #5774](https://github.com/odigos-io/odigos/pull/5774)
- [odigos-io/odigos PR #5772](https://github.com/odigos-io/odigos/pull/5772)
- [odigos-io/odigos PR #5285](https://github.com/odigos-io/odigos/pull/5285)
- [odigos-io/odigos PR #4426](https://github.com/odigos-io/odigos/pull/4426)
- [odigos-io/odigos PR #4318](https://github.com/odigos-io/odigos/pull/4318)
- [odigos-io/odigos PR #3269](https://github.com/odigos-io/odigos/pull/3269)
- [PyPI JSON API for "odigos"](https://pypi.org/pypi/odigos/json) (404 - package does not exist)
- [RISE Python wheel builder GitLab package index for "odigos"](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/odigos/)
- [Ubuntu package search for "odigos" (suite: resolute)](https://packages.ubuntu.com/search?keywords=odigos&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=odigos)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project homepage (member list)](https://riseproject.dev/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev/sw-ecosystem project-reports/.queue.yml](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/.queue.yml)