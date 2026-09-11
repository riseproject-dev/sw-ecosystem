---
title: Spiderpool
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: Kubernetes
    relation: build-dependency
    criticality: critical
  - name: CNI plugins
    relation: runtime-dependency
    criticality: critical
  - name: vishvananda/netlink
    relation: runtime-dependency
    criticality: critical
  - name: Cilium
    relation: runtime-dependency
    criticality: optional
---

# Spiderpool

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Spiderpool<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="spiderpool" %}

## 1. Project Overview

[Spiderpool](https://github.com/spidernet-io/spiderpool) is a Go-based Kubernetes underlay-network CNI IPAM (IP Address Management) plugin. It is a [CNCF Sandbox project](https://spidernet-io.github.io/spiderpool/), accepted into the CNCF landscape in December 2023, and is licensed under the Apache License 2.0.

The repository has no formal `MAINTAINERS` or `GOVERNANCE.md` file (both return 404). Ownership is defined informally via `CODEOWNERS`: **@weizhoublue** and **@cyclinder** own nearly all directories and act as de facto lead maintainers, with **@riverzhang** as default top-level owner, **@windsonsea** owning `/docs/`, and **@lou-lan** owning `/pkg/`. Both primary maintainers' public GitHub profiles show affiliation with **DaoCloud**, a Chinese cloud-native/Kubernetes vendor, which is the de facto corporate sponsor of the project (no formal sponsor list is published).

The contributing documentation covers PR labels, DCO sign-off, CI checks, and E2E test scenarios, but contains no documented process for architecture/platform-support proposals. There is no evidence of any community stance on RISC-V, positive or negative: no requests, no rejections, no discussion. RISC-V support appears to simply not be on the project's radar.

## 2. Port History and Upstreaming Timeline

No port exists and no port history exists. Exhaustive search across GitHub issue search, PR search, commit search, and code search found **zero** results for "riscv", "riscv64", or "risc-v" against `spidernet-io/spiderpool` [(issue/PR/commit/code search)](https://github.com/spidernet-io/spiderpool). There is no master tracking issue for a riscv64 port.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related commit, issue, or PR exists in this repository | [GitHub search across spidernet-io/spiderpool](https://github.com/spidernet-io/spiderpool) |

Two GitHub search hits reference the string "riscv" but are unrelated to Spiderpool's own RISC-V support:
- [PR #2388](https://github.com/spidernet-io/spiderpool/pull/2388) - a Dependabot bump of `golang.org/x/sys` from 0.12.0 to 0.13.0 (closed Oct 2023), whose auto-generated changelog body incidentally quotes an upstream `x/sys` commit titled "unix: update riscv_hwprobe constants." Contains no Spiderpool-authored riscv64 code or discussion.
- [PR #1284](https://github.com/spidernet-io/spiderpool/pull/1284) - a Dependabot bump of `containernetworking/plugins` from 1.1.1 to 1.2.0 (merged Jan 2023), whose changelog body incidentally quotes an upstream CNI-plugins changelog line "build: support riscv64." Contains no Spiderpool-authored riscv64 code or discussion.

No contributors, corporate or individual, have done any riscv64 work on this project. The project is not upstream at all with respect to riscv64, because no such work has ever been proposed.

## 3. Upstream Support Tier

No formal architecture/platform support-tier document exists in the repository (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`). Support tiers must be inferred from the CI build matrix and release process.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes, primary target ([workflows](https://github.com/spidernet-io/spiderpool/tree/main/.github/workflows) hardcode `linux/amd64,linux/arm64`) | Yes, via QEMU-emulated Buildx | No, absent from all 39 workflow files |
| CI tests | Yes (E2E suites run on amd64 runners) | Not confirmed as a separately tested target | No CI exists |
| Official riscv64 release/image | Yes, native default | Yes, published as part of the same multi-arch OCI manifest | No, never built |
| Build toolchain wiring | Native `go build`, default `TARGETARCH ?= amd64` | Explicit CGO cross-compile (`CC=aarch64-linux-gnu-gcc`) in [`Makefile.defs`](https://github.com/spidernet-io/spiderpool/blob/main/Makefile.defs) | No riscv64 toolchain variable exists anywhere |

There is no distribution floor to apply here (see Section 8): no Linux distribution ships a Spiderpool riscv64 package, unpatched or patched, so the "distribution floor" upgrade path from Step 1 of the color model does not apply.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Spiderpool has **no architecture-specific source code for any CPU architecture**, including its two supported targets (amd64, arm64). It is pure, generic Go with no JIT, SIMD, hand-written assembly, or GC-barrier code of its own. Confirmed via GitHub code search: `go:build arm64 NOT path:vendor` and `go:build amd64 NOT path:vendor` both return **0 hits**, as do `riscv NOT path:vendor`, `__riscv`, `"go:build riscv64"`, `GOARCH riscv64`, and `filename:riscv64.go`.

The entire arch-specific footprint of the whole repository is three lines in [`Makefile.defs`](https://github.com/spidernet-io/spiderpool/blob/main/Makefile.defs):
```
ifeq ($(GOARCH),arm64)
    CGO_CC = CC=aarch64-linux-gnu-gcc
endif
```
This is CGO cross-compiler wiring for arm64, not algorithmic code. No riscv64 equivalent exists - not commented out, never added.

The only "riscv" string matches anywhere in the full repo checkout are inside `vendor/golang.org/x/sys/unix/*_riscv64.go` - auto-generated upstream Go standard-library syscall bindings that ship with every Go project vendoring `golang.org/x/sys`, regardless of the project's own target-platform list. They contain no Spiderpool logic.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch-specific source files | None (generic Go) | None (generic Go) | None |
| SIMD/intrinsics | N/A - project has none | N/A - project has none | N/A - project has none |
| CGO cross-compile wiring | Native, no cross-compile needed | Explicit (`aarch64-linux-gnu-gcc`) | Absent - never wired up |

Since Spiderpool has no architecture-specific code even for its two supported platforms, it is **not an optimization-purpose project** under the color model's Step 2 test: the project's value proposition (Kubernetes IPAM/CNI orchestration) does not depend on hand-tuned per-architecture code. The Step 2 optimization modifier does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

Spiderpool is built with `go build` orchestrated by `Makefile`/`Makefile.defs`, plus Docker Buildx for multi-arch container images. There is no CMake, Cargo, or comparable native build system - `CMakeLists.txt` does not exist anywhere in the repo.

Key build facts (from [`Makefile.defs`](https://github.com/spidernet-io/spiderpool/blob/main/Makefile.defs) and `images/Makefile`):
- `TARGETARCH ?= amd64` (default target)
- CGO cross-compilation is enabled only for arm64 (`CC=aarch64-linux-gnu-gcc`); no equivalent riscv64 toolchain variable exists
- `images/Makefile`'s `PLATFORM` defaults to `linux/amd64`, with a commented-out option for `linux/amd64,linux/arm64` - riscv64 is never listed, not even as a disabled option

Dockerfiles (`images/spiderpool-agent/Dockerfile`, `images/spiderpool-controller/Dockerfile`, `images/spiderpool-base/Dockerfile`, `images/spiderpool-plugins/Dockerfile`, `images/cache/Dockerfile`) install architecture-specific `binutils` packages for amd64 and arm64 only (e.g. `binutils-aarch64-linux-gnu`, `binutils-x86-64-linux-gnu`) - no riscv64 equivalent. A GitHub code search for `riscv64 filename:Dockerfile` in this repo returns 0 results.

CI/CD workflows (`build-image-ci.yaml`, `call-release-image.yaml`, `build-image-base.yaml`, `build-image-plugins.yaml`) hardcode `BUILD_PLATFORM: linux/amd64,linux/arm64` and use `docker/setup-qemu-action@v3.6.0` solely to emulate arm64 on the amd64 GitHub-hosted runner for the Buildx matrix - QEMU is never given a riscv64 platform string.

No riscv64-related build failure has ever been reported, because riscv64 has never been attempted: `git log --all --grep=riscv -i` and `git branch -a | grep riscv` both return nothing.

**To add riscv64 support, the following net-new work would be required** (none of it exists today): add `riscv64` to `BUILD_PLATFORM` in the four workflow files; add a `linux/riscv64` case to `PLATFORM` in `images/Makefile`; extend the arm64-only CGO cross-compile block in `Makefile.defs` with a riscv64 toolchain (e.g. `riscv64-linux-gnu-gcc`); update the Dockerfiles' `binutils-*` install lists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds | Yes | Yes | Not attempted (no CI, no toolchain wiring) |
| Passes test suite | Yes | Not independently confirmed | No CI, therefore no test data |
| Multi-arch container image published | Yes | Yes | No |
| Release binary/Helm chart | N/A (ships as image) | N/A (ships as image) | N/A - project ships no per-arch binaries for any architecture, only a generic Helm chart and source archives |

**Functional gap:** Spiderpool cannot be deployed on a riscv64 Kubernetes node today via any official channel - there is no image, no package, and no documented build path.

**Performance gap:** No data exists. Exhaustive search (GitHub issue search for "riscv64 performance", "riscv64 bug"; web search "Spiderpool riscv64 benchmark"; and a direct fetch of the [riseproject.dev blog](https://riseproject.dev/blog)) found zero riscv64-vs-arm64/amd64 benchmark data for Spiderpool. Published Spiderpool performance data exists only for x86_64 (see [DaoCloud's Spiderpool performance report](https://docs.daocloud.io) and the [project's own v0.9 IPAM performance page](https://spidernet-io.github.io/spiderpool/)), with no riscv64 comparison point in either source. Since Spiderpool has no architecture-specific hot-path code (Section 4), there is no reason to expect a riscv64 build to underperform arm64/amd64 beyond generic Go-runtime characteristics - but this is an inference, not measured data.

**Security hardening gaps:** Data not available: no riscv64-specific hardening (e.g. CGO seccomp filters, arch-specific mitigations) was searched for because no riscv64 build exists to harden.

**NaN/floating-point semantics issues:** Data not available: searched GitHub issues for "riscv nan floating repo:spidernet-io/spiderpool" - 0 results. Not applicable to this project's function (IPAM/CNI orchestration involves no floating-point-sensitive numerics).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was independently verified twice, via two different mechanisms:

1. A local shallow-clone `grep -riE "riscv|linux/riscv64"` across all 39 files in `.github/workflows/*.yaml`/`*.yml` returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist at the repo root.
2. A live GitHub code-search API query (`riscv repo:spidernet-io/spiderpool` and `riscv64 repo:spidernet-io/spiderpool`) returns `total_count: 0`. A control query (`arm64 repo:spidernet-io/spiderpool path:.github/workflows`) returns `total_count: 4` with real matched fragments (e.g. `BUILD_PLATFORM: linux/amd64,linux/arm64` in `build-image-ci.yaml`), confirming the search index is live and functioning for this exact repo/path - the riscv64 zero-result is a genuine absence, not a tool failure.

All 39 workflow files were individually enumerated and confirmed clean of riscv references: `auto-cherrypick.yaml`, `auto-clean-image.yaml`, `auto-diff-k8s-ci.yaml`, `auto-nightly-ci.yaml`, `auto-pr-ci.yaml`, `auto-update-authors.yaml`, `auto-upgrade-ci.yaml`, `auto-version-release.yaml`, `build-image-base.yaml`, `build-image-beta.yaml`, `build-image-ci.yaml`, `build-image-latest.yaml`, `build-image-plugins.yaml`, `build-image-release.yaml`, and 25 others (lint/release/cleanup workflows), listed in full in the source research.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Trigger | Native default in all image-build workflows | Included via `BUILD_PLATFORM: linux/amd64,linux/arm64` | N/A - no job exists |
| Runner | GitHub-hosted amd64 runner | Same runner, QEMU-emulated (`docker/setup-qemu-action@v3.6.0`) | N/A |
| Test execution | Yes (E2E suites) | Not confirmed as separately tested | N/A |
| RISE runners used | No | No | No - Spiderpool is not a RISE member and has no RISE relationship (see Section 12) |

## 8. Distribution and Release Status

No riscv64 binary or package exists for Spiderpool through **any** channel checked:

- **GitHub Releases:** Latest tags (v1.2.3, v1.2.3-rc1, v1.2.2, v1.2.1, v1.2.0) ship exactly 3 assets each: `spiderpool-<version>.tgz` (Helm chart), source `.zip`, source `.tar.gz`. **No architecture-specific binaries of any kind** - not even amd64 or arm64 - since Spiderpool ships runtime artifacts exclusively as multi-arch OCI container images, not per-arch release tarballs. [Release assets (v1.2.3)](https://github.com/spidernet-io/spiderpool/releases/expanded_assets/v1.2.3).
- **PyPI:** [`https://pypi.org/pypi/spiderpool/json`](https://pypi.org/pypi/spiderpool/json) returns HTTP 404 - no package named `spiderpool` exists (expected, since this is a Go project, not Python).
- **RISE wheel builder:** [`gitlab.com/.../pypi/simple/spiderpool/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/spiderpool/) redirects to [`pypi.org/simple/spiderpool/`](https://pypi.org/simple/spiderpool/), which also returns 404.
- **Ubuntu 26.04 (resolute):** [package search](https://packages.ubuntu.com/search?keywords=Spiderpool&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no package on any architecture, including riscv64 (which the search page itself lists as a covered architecture).
- **Arch Linux RISC-V port:** [`archriscv.felixc.at/?q=spiderpool`](https://archriscv.felixc.at/?q=spiderpool) and `/packages?q=spiderpool` both return no package/404.
- **Project-graph MCP database:** Query could not be run - the `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) for the entire research session. This is an unattempted check, not a negative result, and should be re-run once that server is reachable. All other independent live sources are unanimous and negative in the meantime.

**What a user must do today to get a working riscv64 binary:** There is no path. A user would need to (1) add riscv64 to the CI/Makefile build matrix as described in Section 5, (2) cross-compile or natively build the Go binaries with `GOARCH=riscv64` (Go itself supports this natively), and (3) build and push their own multi-arch container images including a `linux/riscv64` platform - none of which is supported or documented by the project today.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go | Build-dependency, critical - compiler/runtime for the whole project | Yes - `linux/riscv64` is an official Go port since Go 1.14 | Has a dedicated CI builder farm, but with open reliability issues (see below) | Official riscv64 binaries published on go.dev/dl | See deep-dive below |
| Kubernetes | Build-dependency, critical - `go.mod` pulls the full `k8s.io/kubernetes` module and `client-go`/`apimachinery` | Builds fine (pure Go) | No official riscv64 test signal found | **No official riscv64 release binaries/images from upstream** | See deep-dive below |
| CNI plugins | Runtime-dependency, critical - `containernetworking/cni` core spec types plus `containernetworking/plugins` that Spiderpool chains with | Pure Go, builds on riscv64 | No dedicated riscv64 CI found | Not confirmed whether release tarballs include riscv64 binaries (not verified - repo access scoped in this session) | See deep-dive below |
| vishvananda/netlink | Runtime-dependency, critical - netlink/rtnetlink socket library core to IPAM/coordinator route and interface management | Pure Go, generic Linux syscalls, architecture-independent | No riscv64-specific issues found (0 results) | Library only, no platform binaries | No known problems reported |
| Cilium | Runtime-dependency, optional - imported for `pkg/policy/api` types, used to detect/interoperate with a Cilium-based cluster CNI (not the eBPF datapath) | Imported sub-packages are plain Go and compile on riscv64; the full Cilium agent/daemon does not | No official riscv64 CI signal | **No official riscv64 images** | See deep-dive below |
| klauspost/compress (indirect, via gRPC/OTel) | Compression codec used transitively | Generic pure-Go fallback path (no hand-written SIMD asm for riscv64, unlike amd64/some arm64) | 1 unrelated arm64 issue found ([#532](https://github.com/klauspost/compress/issues/532), closed) | Library only | No blocking issues found |
| google.golang.org/grpc, go.opentelemetry.io/otel*, prometheus/client_golang | RPC, tracing, metrics | Pure Go, architecture-independent | Not individually searched (low risk, no known arch-specific code paths) | Libraries only | Not individually searched |
| golang.org/x/crypto, golang.org/x/sys, golang.org/x/net | Crypto primitives, syscalls, networking extensions | Carry riscv64-specific build tags/assembly stubs upstream in the Go project itself; generic fallback used where no asm exists | Not independently searched | Libraries only, versioned alongside Go | Expected low risk - shipped inside Go's own riscv64 port |

**Deep-dive: Go toolchain.** `linux/riscv64` (GOARCH=riscv64) has been an official Go port since Go 1.14 and has a dedicated CI builder farm, but that infrastructure shows **open reliability issues** as of 2026: [golang/go#80880](https://github.com/golang/go/issues/80880) "add LUCI linux-riscv64 builder" (open); [golang/go#79067](https://github.com/golang/go/issues/79067), [#79068](https://github.com/golang/go/issues/79068), [#79069](https://github.com/golang/go/issues/79069) "bot linux-riscv64-rva22u64-... reported as broken" (open); [golang/go#81175](https://github.com/golang/go/issues/81175) test failure on riscv64 (open). Also [golang/go#71255](https://github.com/golang/go/issues/71255): the Go runtime's swiss-map SIMD implementation has no riscv64 path and falls back to a slower generic implementation (correctness unaffected, performance lower). Official riscv64 binaries are still published on go.dev/dl despite this builder fragility.

**Deep-dive: Kubernetes.** [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836), "Proposal: Official Support for RISC-V Architecture and RVA23 Advancements in Kubernetes Releases," is open and active as of the research date, confirming riscv64 is not yet an officially supported Kubernetes release architecture. Spiderpool's core dependency on `k8s.io/kubernetes`, `client-go`, and `apimachinery` therefore inherits this upstream gap even though the Go code itself compiles.

**Deep-dive: Cilium.** Spiderpool imports only `pkg/policy/api` types from Cilium for coordinator-manager interop detection, not the full eBPF datapath - the imported subset is plain Go and compiles on riscv64. However, the **full Cilium project has no official riscv64 images**. Multiple community feature proposals are tracked: [cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869) "Please provide Cilium images for the riscv64 architecture" (open); [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977), the current live CFP "Adding RISC-V as a supported architecture in Cilium's build system" (open, updated recently); [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451) "CFP/POC: linux/riscv64 support - working PoC + kernel prerequisites" (closed); earlier proposals [#24434](https://github.com/cilium/cilium/issues/24434) and [#40076](https://github.com/cilium/cilium/issues/40076) (closed/superseded). This is the real gate for any Spiderpool deployment that needs full Cilium interoperation rather than just the imported API types.

**Deep-dive: CNI plugins.** [containernetworking/cni#784](https://github.com/containernetworking/cni/issues/784), "CNI support for RISCV ISA," has been open since 2020 with no formal riscv64 commitment from that project, despite Go itself supporting the architecture. No riscv64-tagged issues were found for `containernetworking/plugins` (0 results) - an absence of signal, not a confirmation of support. Whether upstream `plugins` release tarballs include riscv64 binaries was not independently verified in this research pass (session's repo access was scoped to `riseproject-dev/sw-ecosystem`).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue exists | N/A | N/A | GitHub issue search for `riscv64 performance repo:spidernet-io/spiderpool`, `riscv64 bug repo:spidernet-io/spiderpool`, `riscv nan floating repo:spidernet-io/spiderpool`, and broad `riscv repo:spidernet-io/spiderpool` all return 0 relevant results |

The single tangential hit, [issue #1582](https://github.com/spidernet-io/spiderpool/issues/1582) "ipv4-only performance test" (closed 2023-04-25), matched only on the word "performance" and has no RISC-V content whatsoever.

No correctness bugs, no open feature requests, and no rejected proposals related to riscv64 exist for this project.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. There is no governance document, tier policy, or RISC-V-related issue/PR trail from which to draw an explicit stance. The evidence-based conclusion is that RISC-V is simply absent from the project's radar - not the product of a deliberate for-or-against decision.

**Technical blockers:**
- Spiderpool itself is pure Go with no architecture-specific code, so it should build cleanly on riscv64 once CI/toolchain wiring is added (Section 5). This is low-effort, mechanical work.
- Two upstream dependency gaps sit above Spiderpool's own code: Kubernetes has no official riscv64 release ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836), open), and Cilium has no official riscv64 images ([cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977), open CFP). These matter only if a target deployment needs official upstream Kubernetes/Cilium riscv64 artifacts rather than a custom-built stack.

**Organizational blockers:**
- No community request for riscv64 support has ever surfaced in this repository.
- Spiderpool is not a [RISE](https://riseproject.dev/) member (checked against both the Premier tier - Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent - and General tier - Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE - member lists) and has no RISE blog coverage, board-farm usage, or funded work record. It appears only inside RISE's own internal research queue file (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`), which lists it as a candidate for assessment, not as a project RISE has engaged with.
- The project's maintainer base is small and concentrated at a single vendor (DaoCloud), which typically means new-platform work happens only if that vendor or a paying customer prioritizes it.

**Acceptance probability:** High if the work is proposed, given the absence of any objection and the mechanical nature of the required changes (Section 5) - but nothing indicates anyone currently intends to propose it.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI)
- **Release provider:** none
- **Justification:** Spiderpool has no upstream riscv64 CI (confirmed by reading all 39 files in [`.github/workflows/`](https://github.com/spidernet-io/spiderpool/tree/main/.github/workflows), which hardcode a `linux/amd64,linux/arm64` build matrix with zero riscv64 references) and no distribution ships a riscv64 package to apply the distribution floor (Ubuntu 26.04 resolute: [no results](https://packages.ubuntu.com/search?keywords=Spiderpool&suite=resolute&searchon=names&section=all); Arch RISC-V: [404](https://archriscv.felixc.at/?q=spiderpool); no PyPI package exists since this is a Go project). Per the color model's Step 1, "no upstream CI" with no qualifying distribution floor sets the primary color to orange. Spiderpool is not an optimization-purpose project (Section 4), so the Step 2 optimization modifier does not apply and `optimization_gap` is N/A.
- **Pending work that could change the grade:** None identified. No open PR, issue, or RISE engagement exists that would move this grade. The two near-miss dependency-bump PRs (#2388, #1284) are unrelated noise. Should the project's maintainers (DaoCloud-affiliated) or a RISE working group take up the mechanical CI/toolchain work described in Section 5, the grade could move to yellow (build-only CI) or blue/green (tested CI with release) relatively quickly given the absence of any architecture-specific code to port - but no such initiative currently exists.

## 14. Investment Analysis

RISE has no recorded involvement with Spiderpool (Section 12) - no RISE-funded work, RISE CI runners, or RISE board-farm usage exists to net out of the estimates below. All estimated work is net-new.

### 14.1 Functional Enablement

Spiderpool's own codebase requires no algorithmic porting (no architecture-specific code exists to port - Section 4). The work is CI/build-plumbing only:
- Add `riscv64` to the `BUILD_PLATFORM` matrix in four workflow files (`build-image-ci.yaml`, `call-release-image.yaml`, `build-image-base.yaml`, `build-image-plugins.yaml`)
- Add a `linux/riscv64` case to `PLATFORM` in `images/Makefile`
- Extend the arm64-only CGO cross-compile block in `Makefile.defs` with a riscv64 toolchain (e.g. `riscv64-linux-gnu-gcc`)
- Update Dockerfile `binutils-*` install lists for riscv64
- Validate `go build GOARCH=riscv64` output and run the existing E2E suite under QEMU or native riscv64 hardware

Estimated effort: 1-2 person-weeks, low technical risk given Go's native riscv64 support.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Spiderpool has no hand-tuned per-architecture hot paths for any platform (Section 4), so there is no optimization gap to close. Any future work here would be limited to validating that generic Go-runtime performance on riscv64 is acceptable for IPAM workloads, which is a testing/benchmarking task rather than an engineering one.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to the existing GitHub Actions Buildx matrix (QEMU-emulated, following the existing arm64 pattern) is straightforward. If native riscv64 hardware or RISE-hosted runners are desired instead of QEMU emulation, that requires coordinating with RISE's [board-farm/CI-runner offerings](https://riseproject.dev/) - Spiderpool is not currently a RISE member, so establishing that relationship would be a prerequisite, not a code change.

### 14.4 Ecosystem Enablement

Not applicable - Spiderpool has no dependent package ecosystem of its own (Section 10 omitted per scope rules; it is a standalone Kubernetes controller/CNI plugin, not a library with third-party package dependents). Its upstream dependency risk (Kubernetes, Cilium) is tracked in Section 9 and is outside Spiderpool's own control.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to CI build matrix, Makefile toolchain, and Dockerfiles; validate build | 1-2 | Spiderpool maintainers (DaoCloud) or contributor | High |
| Functional | Run E2E test suite on riscv64 (QEMU or native) and fix any surfaced issues | 1-2 | Spiderpool maintainers | High |
| CI/CD | Wire riscv64 into existing Buildx/QEMU matrix for release images | 0.5-1 | Spiderpool maintainers | Medium |
| CI/CD | Establish RISE runner/board-farm access if native hardware CI is desired | 1 (coordination) | Spiderpool maintainers + RISE | Low |
| Upstream dependency | Track/contribute to Kubernetes riscv64 release proposal ([#132836](https://github.com/kubernetes/kubernetes/issues/132836)) | N/A (external project) | Kubernetes community | Medium |
| Upstream dependency | Track/contribute to Cilium riscv64 CFP ([#39977](https://github.com/cilium/cilium/issues/39977)) | N/A (external project) | Cilium community | Low (Spiderpool only imports types, not the datapath) |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [Spiderpool GitHub repository](https://github.com/spidernet-io/spiderpool)
- [Spiderpool homepage/docs](https://spidernet-io.github.io/spiderpool/)
- [Spiderpool PR #2388 - x/sys dependency bump (near-miss, unrelated to Spiderpool RISC-V support)](https://github.com/spidernet-io/spiderpool/pull/2388)
- [Spiderpool PR #1284 - containernetworking/plugins dependency bump (near-miss, unrelated to Spiderpool RISC-V support)](https://github.com/spidernet-io/spiderpool/pull/1284)
- [Spiderpool GitHub Actions workflows directory](https://github.com/spidernet-io/spiderpool/tree/main/.github/workflows)
- [Spiderpool Makefile.defs](https://github.com/spidernet-io/spiderpool/blob/main/Makefile.defs)
- [Spiderpool release assets, v1.2.3](https://github.com/spidernet-io/spiderpool/releases/expanded_assets/v1.2.3)
- [Spiderpool issue #1582 - unrelated IPv4 performance test](https://github.com/spidernet-io/spiderpool/issues/1582)
- [PyPI query for "spiderpool" (404, package does not exist)](https://pypi.org/pypi/spiderpool/json)
- [RISE GitLab wheel-builder proxy for "spiderpool" (redirects to PyPI 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/spiderpool/)
- [PyPI simple index for "spiderpool" (404)](https://pypi.org/simple/spiderpool/)
- [Ubuntu 26.04 (resolute) package search for "Spiderpool" (no results)](https://packages.ubuntu.com/search?keywords=Spiderpool&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search for "spiderpool" (no results)](https://archriscv.felixc.at/?q=spiderpool)
- [RISE project blog (no Spiderpool posts)](https://riseproject.dev/blog)
- [RISE project site search for "spiderpool" (no results)](https://riseproject.dev/?s=spiderpool)
- [RISE project WordPress API search for "spiderpool" (404)](https://riseproject.dev/wp-json/wp/v2/posts?search=spiderpool)
- [RISE Python wheel-builder package listing (no Spiderpool)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project members list](https://riseproject.dev/)
- [Kubernetes proposal for official RISC-V support, kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836)
- [Cilium riscv64 image request, cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869)
- [Cilium riscv64 CFP (current, open), cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977)
- [Cilium riscv64 PoC CFP (closed), cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451)
- [Cilium earlier riscv64 proposal (closed), cilium/cilium#24434](https://github.com/cilium/cilium/issues/24434)
- [Cilium earlier riscv64 proposal (closed/superseded), cilium/cilium#40076](https://github.com/cilium/cilium/issues/40076)
- [CNI riscv64 support request, containernetworking/cni#784](https://github.com/containernetworking/cni/issues/784)
- [Go LUCI linux-riscv64 builder request, golang/go#80880](https://github.com/golang/go/issues/80880)
- [Go linux-riscv64-rva22u64 builder broken report, golang/go#79067](https://github.com/golang/go/issues/79067)
- [Go linux-riscv64-rva22u64 builder broken report, golang/go#79068](https://github.com/golang/go/issues/79068)
- [Go linux-riscv64-rva22u64 builder broken report, golang/go#79069](https://github.com/golang/go/issues/79069)
- [Go riscv64 test failure, golang/go#81175](https://github.com/golang/go/issues/81175)
- [Go runtime swiss-map SIMD non-amd64 fallback, golang/go#71255](https://github.com/golang/go/issues/71255)
- [klauspost/compress arm64 test timeout (unrelated to riscv64), klauspost/compress#532](https://github.com/klauspost/compress/issues/532)
- [DaoCloud Spiderpool performance report](https://docs.daocloud.io)
- [Spiderpool v0.9 IPAM performance page](https://spidernet-io.github.io/spiderpool/)
- Internal: [riseproject-dev/sw-ecosystem project research queue](https://github.com/riseproject-dev/sw-ecosystem) (lists Spiderpool as a research candidate, not evidence of RISE engagement)