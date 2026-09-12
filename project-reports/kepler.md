---
title: Kepler
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: NVIDIA go-nvml
    relation: runtime-dependency
    criticality: optional
---

# Kepler

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kepler<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="kepler" %}

## 1. Project Overview

Kepler (Kubernetes-based Efficient Power Level Exporter) is a Prometheus exporter that estimates and exposes energy/power consumption metrics (CPU, DRAM, GPU) for Kubernetes pods and nodes. It is a pure-Go binary that reads Linux kernel sysfs interfaces -- primarily Intel RAPL (`/sys/class/powercap/intel-rapl*`) and `hwmon` -- and optionally uses `CGO_ENABLED=1` to load NVIDIA's `go-nvml` bindings for GPU power telemetry via `dlopen("libnvidia-ml.so.1")`.

**Governance and foundation:** Kepler is a CNCF Sandbox project (not yet graduated) under the Linux Foundation, licensed Apache-2.0. Governance is an elected-maintainer model with 6-month active cycles (Spring: Apr 1-Sep 30; Fall: Oct 1-Mar 31); maintainers who don't confirm activity roll off to Emeritus. New maintainers require approval from 3 or more existing maintainers.

**Corporate sponsors:** Red Hat dominates current governance -- Project Lead (Vimal Kumar) plus 3 of the active Technical Committee members (Vibhu Prashar, Kaiyi Liu, Sunil Thaha). Other current maintainers come from cogiot, Basiq, IBM, Grafana Labs, and CERN (off-cycle). By raw commit count, the top contributors are Sunil Thaha (263 commits, Red Hat), Vibhu Prashar (~233, Red Hat), and Vimal Kumar (65, Red Hat) -- Red Hat authored roughly 70% or more of tracked top-contributor commits. Historical (Emeritus) contributors were also concentrated in Red Hat, IBM, and Intel.

**Community culture on new ports:** No formal architecture-tier policy document exists (no `PLATFORMS.md`/`SUPPORT.md`). There is no dedicated "new platform" GitHub issue template -- only `bug_report.yml`, `feature_request.yml`, and `maintainer_nominate.yaml` -- so a new architecture port would go through the generic feature-request path with standard maintainer review (no supermajority requirement outside governance/maintainer changes).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been attempted, discussed, or tracked | Confirmed via zero-hit searches across issues, PRs, commits, and code (see Section 11) |
| 2025-03-27 | Kepler "reboot" -- current `main` branch history starts fresh from commit `5ca019d`; all pre-reboot history (including old ARM64 issues) is disconnected from present codebase lineage | Local git log analysis of clone at `/home/user/sustainable-computing-io/kepler` |
| 2026-03-18 | ARM64 multi-arch build support added (commit `a8c32db`, "feat(build): add multi-arch support for ARM64 builds and container images") by Vimal Kumar (Red Hat) | [docs/developer/multi-arch-builds.md](https://github.com/sustainable-computing-io/kepler/blob/main/docs/developer/multi-arch-builds.md) |

Key contributors: Vimal Kumar (Red Hat) authored the ARM64 multi-arch work; no individual or organization has proposed, prototyped, or discussed riscv64 support. **Is it fully upstream? Not applicable -- there is no riscv64 port to be upstream or out-of-tree; none exists in any form.**

## 3. Upstream Support Tier

No formal tier policy document exists. The closest analog is the build/release architecture list, which is treated informally as the supported-tier boundary.

Evidence:
- **CI**: `Makefile: IMAGE_ARCHES ?= amd64 arm64` -- these are the only architectures ever built, tested, or released.
- **Release-blocking status**: Not applicable to riscv64 since no riscv64 build path exists to be blocking or non-blocking.
- **Official binaries**: GitHub Releases ship `linux-amd64` tarballs only (see Section 8); the multi-arch container image build covers amd64 and arm64.

| Architecture | Build tier | CI tested | Official release artifact |
|---|---|---|---|
| amd64 | Primary/Tier 1 | Yes | Yes (`linux-amd64` tarball, container image) |
| arm64 | Tier 1 (added 2026-03-18) | Multi-arch build present | Yes (container image; helm chart is arch-neutral) |
| riscv64 | Not supported | No | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kepler has **no per-ISA implementation pattern at all**, for any architecture including amd64. Direct source inspection of the clone at `/home/user/sustainable-computing-io/kepler` (HEAD `63f0271d`) confirms:

- Zero Go files matched `grep -rlE '(amd64|arm64|s390x|riscv)' --include='*.go' .`
- No `//go:build` or `// +build` constrained files exist anywhere in the tree.
- No `import "C"` usage outside the go-nvml dependency path; no `.c`/`.h`/`.s` files exist (excluding vendor/hack directories).
- The only `runtime.GOARCH` references (in `internal/version/version.go` and `cmd/kepler/main.go`) are used to report the build's architecture in version/telemetry output, not to branch implementation logic.

This means Kepler's core energy-measurement design is **architecture-agnostic by construction**: `internal/device/rapl_sysfs_power_meter.go` and `internal/device/hwmon_power_meter.go` are generic Go readers of Linux kernel sysfs interfaces, with no SIMD, JIT, hand-tuned assembly, or crypto acceleration code anywhere in the project for any target.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| RAPL sysfs power meter | Functional (native use case -- Intel RAPL is x86-specific) | Presumed non-functional (no RAPL on ARM) | Missing -- untested; no riscv64-equivalent kernel powercap interface confirmed |
| hwmon power meter | Functional (generic sysfs reader) | Functional (generic sysfs reader) | Missing -- generic reader exists in source but never built/tested for riscv64 |
| GPU (NVML via go-nvml, CGO) | Functional (NVIDIA driver available) | Functional where NVIDIA ships an arm64 driver | Missing -- NVIDIA has no riscv64 datacenter GPU driver; `dlopen` would fail, GPU feature would no-op |
| Architecture-specific code files (any kind) | None found | None found | None found (project has no such pattern at all) |

**Conclusion:** there is no stub, no partial implementation, and no placeholder to grade for riscv64 -- the gap is entirely in the build/CI/release matrix and in unverified hardware/kernel compatibility (RAPL-equivalent sysfs interfaces on riscv64), not in missing per-ISA source code.

## 5. Build System, Cross-Compilation, and Toolchain

Kepler uses Go modules plus a plain `Makefile` -- **there is no CMake, autoconf, or configure-based build system.**

- `go.mod`: `go 1.24.0`, `toolchain go1.24.9`.
- Base build image: `golang:1.24` ([Dockerfile](https://github.com/sustainable-computing-io/kepler/blob/main/Dockerfile)); final image `registry.access.redhat.com/ubi9:latest`.
- **`CGO_ENABLED=1` is required project-wide** because `go-nvml` `dlopen`s `libnvidia-ml.so.1` at runtime -- this is why a C cross-compiler is needed at all for any target architecture, per [docs/developer/multi-arch-builds.md](https://github.com/sustainable-computing-io/kepler/blob/main/docs/developer/multi-arch-builds.md).

Existing cross-compilation mechanism (arm64/amd64 only):
```bash
GOARCH=arm64 CC=aarch64-linux-gnu-gcc make build
```
The Makefile auto-detects a Fedora cross sysroot via `$(CC) --print-sysroot`; on Debian/Ubuntu the developer is told to `apt install gcc-aarch64-linux-gnu`.

**riscv64 build path: does not exist.** The Dockerfile's cross-compiler install logic branches only on `TARGETARCH = arm64` (installs `gcc-aarch64-linux-gnu`) or `amd64` (installs `gcc-x86-64-linux-gnu`) -- there is no `riscv64` branch. A Docker build with `--platform=linux/riscv64` would fail at the toolchain-install `elif` step with no matching case, before the Go build step is ever reached.

No QEMU-based cross-build documentation exists for any architecture (the project's only QEMU references, in `internal/resource/vm.go` and related test/docs files, concern detecting QEMU *virtual machines at runtime* for power attribution -- unrelated to build tooling). No known riscv64 build failures are documented because riscv64 building has never been attempted.

**What would be required to enable a riscv64 build:** (1) add a `riscv64` branch to the Dockerfile's cross-compiler install logic (e.g. `gcc-riscv64-linux-gnu`), (2) add `riscv64` to `IMAGE_ARCHES` and the release workflow's architecture list, (3) document it in `docs/developer/multi-arch-builds.md`. None of these exists today.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds via `make build` | Yes | Yes (`GOARCH=arm64`) | No (toolchain not wired in Dockerfile; `GOARCH` itself is a free-form Makefile var so a manual native build is theoretically unblocked, but untested and unsupported) |
| Container image | Yes | Yes | No |
| Official release binary | Yes | No (container image only; no standalone arm64 tarball found in Section 8's checked releases) | No |
| CPU/package energy via RAPL | Yes (native use case) | No (x86-only interface) | No (x86-only interface; no confirmed riscv64 equivalent) |
| Generic hwmon energy readings | Yes | Yes | Untested |
| GPU energy via NVML | Yes (where NVIDIA driver present) | Yes (where NVIDIA driver present) | No (NVIDIA has no riscv64 datacenter driver) |
| Pre-trained ML power models | x86_64 only (trained on Intel Xeon E5-2667 v3) | "coming soon" per Kepler docs | Not available |

**Functional gaps:** the primary energy-measurement backend (Intel RAPL) has no riscv64 equivalent confirmed to exist; even a hypothetically successful riscv64 build would have no working CPU/package energy-measurement path unless an alternative sysfs powercap driver is added on riscv64 hardware/kernels -- this is a hardware/kernel-ecosystem gap, not a Kepler code gap.

**Performance gaps:** Not applicable -- Kepler has no SIMD/vectorized hot paths on any architecture, so there is no missing-SIMD performance delta to report.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening discussion (ASLR, stack-clash protection, etc.) was found for Kepler on any architecture; the project has no architecture-specific hardening code at all.

**NaN / floating-point semantics issues:** Data not available: no riscv64 NaN/floating-point issue was found (search for `riscv nan floating` against the repository returned 0 results); this is consistent with the project having no riscv64 build to have surfaced such an issue in the first place.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified directly against the repository's actual file contents (local clone confirmed byte-identical to `origin/main` HEAD `63f0271d`):

- All 13 workflow files in [.github/workflows/](https://github.com/sustainable-computing-io/kepler/tree/main/.github/workflows) (`assign-labels.yaml`, `check-x-crypto-deps.yaml`, `config-change.yaml`, `e2e.yaml`, `k8s-bm.yaml`, `pr-checks.yaml`, `pr-comment.yaml`, `profiling.yaml`, `push.yaml`, `release.yaml`, `scorecard.yml`, `stale.yml`, `test-and-codecov.yaml`) were grepped case-insensitively for "riscv" -- zero matches.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository at all.
- [release.yaml](https://github.com/sustainable-computing-io/kepler/blob/main/.github/workflows/release.yaml) explicitly builds release binaries "for linux-amd64 only."
- No RISE RISC-V CI runners (`riseproject-dev` references) appear anywhere in workflow files -- consistent with Kepler not being a RISE-affiliated project (see Section 12).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes (multi-arch build, added 2026-03-18) | No |
| Test suite runs | Yes | Data not available: multi-arch doc covers build, not confirmed test execution per arch | N/A -- no job |
| Runner type | Standard GitHub-hosted | Data not available (not verified in this research pass) | N/A |
| Native hardware / QEMU / cloud VM | GitHub-hosted (cloud VM) | Data not available | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**No riscv64 binary exists in any checked distribution channel:**

- **GitHub Releases** ([v0.11.4](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.4), [v0.11.3](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.3), [v0.11.2](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.2)): assets are `kepler-<version>.linux-amd64.tar.gz`, `kepler-helm-<version>.tgz`, and source zip/tar.gz only. No riscv64 asset in any of the three checked releases.
- **PyPI**: `https://pypi.org/pypi/kepler/json` lists a `kepler` package (latest 0.3.0, `py3-none-any` wheel) -- but this is confirmed to be an **unrelated project** (a small Python instrumentation/timing library), not the sustainable-computing-io/kepler exporter, per a name collision. Not applicable to this report.
- **Ubuntu 26.04 (resolute)**: `https://packages.ubuntu.com/search?keywords=kepler&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" -- no `kepler`, `python3-kepler`, or `libkepler` package exists for **any** architecture, so riscv64 is a fortiori absent.
- **Arch Linux RISC-V port**: `https://archriscv.felixc.at/?q=kepler` lists no `kepler` package.
- **Debian / Fedora**: Data not available: not directly checked in this research pass, but the Ubuntu-resolute absence and the project's niche (CNCF Sandbox Kubernetes exporter) make distro packaging elsewhere unlikely; not confirmed either way.

**What a user must do to get a working binary today:** There is none available for riscv64 through any channel. The only path to a riscv64 Kepler binary would be manually patching the Dockerfile's cross-compiler branch and building from source with `GOARCH=riscv64` -- untested, unsupported, and (per Section 6) would lack a functioning energy-measurement backend even if it compiled.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test/runtime | riscv64 release status | Notes / blocking issues |
|---|---|---|---|---|---|
| Go | Compiler/runtime for the whole binary (build-dependency, critical) | Known-good; Tier-1 `linux/riscv64` Go port, mature since roughly Go 1.14 | Fine -- routine maintenance-level open issues only (e.g. golang/go#81175, minor test flake), none release-blocking | Graded **green** per this project-reports series' own Go assessment | None blocking |
| golang.org/x/sys | Low-level syscalls (procfs/sysfs access underlying RAPL/hwmon reads) (build-dependency, critical) | riscv64 syscall tables (`zsysnum_linux_riscv64.go` etc.) have existed upstream for years -- mature | Mature, no known issues | Tracked in `projects.yml` but no dedicated per-project report file exists yet | None found. (Note: a Dependabot bump PR for this dependency was the source of an earlier false-positive "riscv" search hit in Kepler's own PR history -- its changelog mentions "cpu: add support for detecting RISC-V extensions," an upstream `x/sys` commit message, not a Kepler-specific change) |
| GCC | Cross-compiler toolchain for CGO builds (build-dependency, critical) | `gcc-riscv64-linux-gnu` is a real, available Ubuntu package (i.e. GCC itself supports riscv64 cross-compilation) | N/A (toolchain, not a runtime dependency) | N/A | **Kepler's own Dockerfile does not wire in a riscv64 GCC branch** -- this is Kepler's build-integration gap, not a GCC capability gap (see Section 5) |
| NVIDIA go-nvml | GPU power monitoring via CGO `dlopen` of `libnvidia-ml.so.1` (runtime-dependency, optional) | The Go binding itself is pure Go (cgo shim would compile); the blocker is the proprietary NVIDIA driver library it loads at runtime | **Runtime blocker**: NVIDIA does not ship a riscv64 build of the datacenter GPU driver stack; `dlopen` would fail and the GPU-monitoring feature would no-op (rest of Kepler unaffected) | No official riscv64 packaging by NVIDIA; not a distro-packaged component (installed via NVIDIA's own driver repo) | `NVIDIA/go-nvml` search for "riscv64" returns 0 issues -- no community request tracked |
| k8s.io/client-go, apimachinery, api, utils | Kubernetes API client for pod/container attribution | Pure Go, arch-independent | Expected to work once built | Kubernetes itself has no official riscv64 support yet -- open proposal [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) ("Proposal: Official Support for RISC-V Architecture") | Usefulness gated on upstream Kubernetes riscv64 maturity, which is pre-official |
| sigs.k8s.io/controller-runtime | Kubernetes controller scaffolding | Pure Go | Same Kubernetes-maturity caveat as above | Same caveat | None found directly |
| prometheus/client_golang, client_model, exporter-toolkit, procfs | Metrics exposition (the exporter half of Kepler) | Pure Go; `procfs` parses `/proc/cpuinfo` etc., whose fields differ per architecture -- riscv64-specific parsing gaps are plausible but unverified | No riscv64 issues found in `prometheus/client_golang` search | Not in `projects.yml` | None found |
| golang.org/x/crypto | TLS/auth for exporter-toolkit's HTTPS listener | Falls back to portable Go implementation on riscv64 (no hand-written asm fast path, unlike amd64/arm64/ppc64le/s390x) -- functionally correct, just unoptimized | Functional | Tracked in `projects.yml`, no dedicated report file | None found |
| github.com/stmcginnis/gofish | Redfish/BMC client for platform power telemetry | Pure Go, arch-independent | Expected to work | Not in `projects.yml` | None found |
| go.uber.org/zap, google.golang.org/protobuf, dario.cat/mergo, etc. | Logging / protobuf marshaling / config merging | Pure Go, no arch-specific code | Expected to work | Not individually tracked | None found |

**Dependency-graph screening note:** Kepler's `go.mod` (~50 direct+indirect dependencies) contains no zstd/lz4/brotli/gonum/BLAS/jemalloc/wasm/JIT library (grepped `go.sum`, no hits). It is a thin Go binary over Prometheus/Kubernetes client libraries plus the single native/binary dependency `go-nvml`. **The dependency graph itself is not the primary riscv64 blocker** -- Go, the Kubernetes client libraries, the Prometheus client, `x/sys`, and `x/crypto` are all riscv64-capable or riscv64-neutral pure Go. The two real blockers are (1) NVIDIA's proprietary driver has no riscv64 build (GPU feature only, optional), and (2) RAPL's x86-only sysfs interface (core CPU/package power feature, not optional).

**Note on tooling limitation:** the `project-graph` MCP server returned `CONNECTION_CLOSED` throughout this research session, so Ubuntu 26.04 riscv64 package-graph lookups for `golang-go`/`golang-1.24` and related C-library dependencies could not be cross-verified against that database. This is a tool/connectivity gap, not evidence of absence, and should be re-run once the server is reachable. [NEEDS VERIFICATION]

## 11. Known Bugs and Active Issues

No riscv64-specific issues exist. Confirmed by exhaustive search: `search_issues("riscv")`, `search_issues("riscv64")`, `search_issues("risc-v")`, `search_pull_requests("riscv")`, `search_commits("riscv")`, `search_code("riscv")` against `sustainable-computing-io/kepler` all returned `total_count: 0`.

Two broader semantic-search passes surfaced apparent hits that were individually verified and ruled out as false positives (incidental matches in vendored `golang.org/x/sys` dependency-changelog text, not Kepler-specific RISC-V content):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2520](https://github.com/sustainable-computing-io/kepler/pull/2520) | chore(deps): bump the go-dependencies group with 9 updates | Closed, unmerged | N/A | Dependabot bump; "riscv64" matched only in `x/sys` changelog text |
| [#1772](https://github.com/sustainable-computing-io/kepler/pull/1772) | build(deps): bump the go-dependencies group with 3 updates | Closed, unmerged | N/A | Same as above |
| [#1786](https://github.com/sustainable-computing-io/kepler/pull/1786) | build(deps): bump the go-dependencies group across 1 directory with 6 updates | Merged 2024-09-18 | N/A | Same as above; pre-reboot history, not reachable from current `main` |
| [#1516](https://github.com/sustainable-computing-io/kepler/pull/1516) | build(deps): bump the go-dependencies group with 17 updates | Closed, unmerged | N/A | Same as above |
| [#986](https://github.com/sustainable-computing-io/kepler/pull/986) | build(deps): bump github.com/jaypipes/ghw from 0.10.0 to 0.12.0 | Merged 2023-10-16 | N/A | Pre-reboot history, not reachable from current `main` |
| [#995](https://github.com/sustainable-computing-io/kepler/pull/995) | build(deps): bump github.com/opencontainers/runtime-spec to 1.1.0 | Merged 2023-10-16 | N/A | Pre-reboot history, not reachable from current `main` |
| [#1029](https://github.com/sustainable-computing-io/kepler/pull/1029) | CPUID alternative solution | Merged 2023-11-23 | N/A | Intel/AMD CPU microarchitecture detection refactor; body confirmed to not discuss RISC-V at all |
| [#2390](https://github.com/sustainable-computing-io/kepler/pull/2390) | Feature/prometheus power meter | Open, stale (60+ days inactive as of 2026-07-24) | N/A | Generic Prometheus-based power input; body confirmed to not discuss RISC-V at all |

**Correctness bugs on riscv64:** None to report -- there is no riscv64 build to have surfaced a correctness bug.

**For context, the project's only actual architecture-support bug history is for ARM64, not RISC-V** (all closed/wontfix/not-planned, none open):
- [#482 -- ARM support](https://github.com/sustainable-computing-io/kepler/issues/482) (closed, wontfix)
- [#1156 -- Missing support for linux/arm64/v8 container images](https://github.com/sustainable-computing-io/kepler/issues/1156) (closed, not planned)
- [#1347 -- kepler_node_info reports UNKNOWN cpu_architecture on RHEL9/arm64](https://github.com/sustainable-computing-io/kepler/issues/1347) (closed, not planned)
- [#1616 -- duplicate of #1347 on ARM64 Ampere/Neoverse-N1](https://github.com/sustainable-computing-io/kepler/issues/1616) (closed, not planned)
- [#522 -- getCPUArchitecture doesn't recognize Sapphire Rapids](https://github.com/sustainable-computing-io/kepler/issues/522) (closed, x86-only issue)

## 12. Objections and Upstream Blockers

**Stated objections:** None -- RISC-V has never been raised as a topic in any issue, PR, commit, or discussion, so no maintainer has stated a position for or against it.

**Technical blockers:**
1. Kepler's build tooling (Dockerfile, `Makefile`) has no riscv64 branch; a riscv64 build would fail at the toolchain-install step today (Section 5).
2. The primary energy-measurement backend, Intel RAPL, is an x86-specific sysfs interface with no confirmed riscv64 equivalent (Section 4, 6) -- even a successful build would likely lack a working core feature.
3. Optional GPU monitoring depends on NVIDIA's proprietary driver, which has no riscv64 build (Section 9) -- this would gate only the optional GPU feature, not core functionality.
4. Kubernetes itself (a hard runtime dependency, via `k8s.io/client-go`) has no official riscv64 support yet -- open upstream proposal [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) -- so Kepler's riscv64 usefulness is gated on Kubernetes' own riscv64 maturity regardless of what Kepler itself does.

**Organizational blockers:** Kepler is not a RISE project and has no RISE involvement of any kind (see Section 14 for detail). Red Hat, Kepler's dominant maintaining organization, is a RISE Premier Member, but this is an indirect corporate link, not a project affiliation or an indicator of planned work.

**Acceptance probability if proposed:** No formal architecture-tier policy exists and no supermajority requirement applies to platform PRs outside governance changes, so a well-formed riscv64 PR would likely follow the standard feature-request -> PR -> maintainer-review path. However, given (a) the unresolved RAPL-equivalent hardware/kernel question and (b) the general immaturity of Kubernetes-on-riscv64 itself, a merge-ready contribution would need to resolve both the build-integration gap and demonstrate a working energy-measurement backend before it would deliver real value -- neither exists today. [NEEDS VERIFICATION: no explicit maintainer statement on riscv64 acceptance criteria was found, since the topic has never come up]

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI, no distribution floor" case -- neither of the standard orange sub-types (`downstream-only`, `optimization-absent`) applies precisely, since no distribution ships a `kepler` package at all and Kepler is not an optimization-purpose project)
- **Release provider:** none
- Not an optimization-purpose project (Kepler is a functional Kubernetes power-monitoring exporter, not a performance/SIMD/allocator/crypto library) -- Step 2 of the color model does not apply; no Optimization level is reported.
- **Justification:** Zero riscv64 CI exists anywhere in the repository -- a grep of all 13 GitHub Actions workflow files for "riscv" (case-insensitive) returns zero matches, confirmed against [.github/workflows/](https://github.com/sustainable-computing-io/kepler/tree/main/.github/workflows), and no GitLab/Jenkins/Cirrus configs exist. GitHub Releases ship `linux-amd64` tarballs only ([v0.11.4 assets](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.4)), and no Linux distribution packages Kepler for any architecture (Ubuntu 26.04 resolute returns zero search results for `kepler`), so the distribution floor cannot upgrade the grade from orange.
- **Pending work that could change the grade:** None found. No open PR, issue, or RISE blog/wiki content references RISC-V for this project (see Sections 11-12 and 14). The `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) throughout this research session and should be re-queried to corroborate the Ubuntu/distro-package findings. [NEEDS VERIFICATION]

## 14. Investment Analysis

**RISE involvement check:** Confirmed exhaustively that RISE (riseproject.dev) has no involvement with Kepler. All 31 RISE blog posts (2024-05-15 through 2026-08-24) were checked by title and full-text grep for "kepler" -- zero matches. The RISE Python wheel builder roster (68 packages checked) does not include Kepler (not applicable regardless, since Kepler is not a Python package). All 25 repositories in the `riseproject-dev` GitHub org were checked by name -- none relate to Kepler. RISE membership (Premier: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Canonical, ZTE, and others) is corporate/silicon-vendor based, not a project registry, and Kepler is not listed as a RISE-funded or RISE-adjacent project. **No RISE-funded work exists to net out of the estimates below.**

### 14.1 Functional Enablement

Work required to produce a buildable, minimally-functional riscv64 Kepler binary:
1. Add a `riscv64` branch to the Dockerfile's cross-compiler install logic (`gcc-riscv64-linux-gnu`).
2. Add `riscv64` to `Makefile`'s `IMAGE_ARCHES` and to the release workflow's architecture list.
3. Verify/implement a riscv64-compatible energy-measurement backend -- this is the largest unknown: it requires investigating whether target riscv64 hardware/kernels expose any RAPL-equivalent or generic `hwmon`-compatible power/energy sysfs interface at all. If none exists, core functionality (CPU/package power attribution) cannot work regardless of Kepler-side code changes -- this is a hardware/kernel-ecosystem gap, not solvable in Kepler's own repository.
4. Document the new architecture in `docs/developer/multi-arch-builds.md`.
5. Validate that all pure-Go dependencies (Kubernetes client libraries, Prometheus client, `x/sys`, `x/crypto`) build and run correctly on riscv64 in practice (expected to be low-risk given their riscv64-neutral/mature status per Section 9, but unverified in this research pass).

### 14.2 Performance Optimization

Not applicable -- Kepler has no SIMD/vectorized/hand-tuned hot paths on any architecture (Section 4), so there is no riscv64-specific performance-optimization workstream to size.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to the existing GitHub Actions workflow set, mirroring the arm64 multi-arch pattern added 2026-03-18. Given RISE operates free native riscv64 GitHub Actions runners (`riseproject-dev/riscv-runner*`, per research findings, unrelated to Kepler today), a future riscv64 CI job could plausibly use RISE's free runner infrastructure rather than requiring dedicated hardware procurement -- this would need to be arranged by whoever proposes the port, as no such arrangement currently exists for Kepler.

### 14.4 Ecosystem Enablement

Not applicable (Section 10 omitted per rule 6) -- Kepler is a standalone Go binary/exporter with no dependent package ecosystem (no npm/PyPI/Maven consumers depend on it as a library).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Wire riscv64 into Dockerfile cross-compiler branch, `IMAGE_ARCHES`, release workflow | 0.5-1 | Data not available: no owner assigned; would require a Kepler maintainer or external contributor | Medium |
| Functional | Investigate/implement riscv64 energy-measurement backend (RAPL-equivalent or generic sysfs powercap interface) | Data not available: effort depends entirely on unresolved question of whether target riscv64 hardware/kernels expose any usable energy sysfs interface at all -- could range from "trivial if hwmon works out of the box" to "blocked indefinitely without kernel/hardware support" [NEEDS VERIFICATION] | Data not available | Critical (this is the actual value-delivery blocker, not the build wiring) |
| Functional | Document riscv64 support in `docs/developer/multi-arch-builds.md` | 0.1 | Data not available | Low |
| CI/CD | Add riscv64 CI job (build at minimum; test execution depends on backend availability per above) | 0.5-1 | Data not available; could leverage RISE's free native riscv64 GitHub Actions runners if arranged | Medium |
| Ecosystem | Not applicable | -- | -- | -- |

## 15. Updates

(No updates yet -- initial report dated 2026-09-11.)

## 16. References

- [sustainable-computing-io/kepler GitHub repository](https://github.com/sustainable-computing-io/kepler)
- [Kepler homepage (sustainable-computing.io)](https://sustainable-computing.io/)
- [.github/workflows/ (all 13 CI workflow files)](https://github.com/sustainable-computing-io/kepler/tree/main/.github/workflows)
- [.github/workflows/release.yaml](https://github.com/sustainable-computing-io/kepler/blob/main/.github/workflows/release.yaml)
- [docs/developer/multi-arch-builds.md](https://github.com/sustainable-computing-io/kepler/blob/main/docs/developer/multi-arch-builds.md)
- [Dockerfile](https://github.com/sustainable-computing-io/kepler/blob/main/Dockerfile)
- [Makefile](https://github.com/sustainable-computing-io/kepler/blob/main/Makefile)
- [GOVERNANCE.md](https://github.com/sustainable-computing-io/kepler/blob/main/GOVERNANCE.md)
- [MAINTAINERS.md](https://github.com/sustainable-computing-io/kepler/blob/main/MAINTAINERS.md)
- [GitHub Releases: v0.11.4 assets](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.4)
- [GitHub Releases: v0.11.3 assets](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.3)
- [GitHub Releases: v0.11.2 assets](https://github.com/sustainable-computing-io/kepler/releases/expanded_assets/v0.11.2)
- [Ubuntu 26.04 (resolute) package search: "kepler"](https://packages.ubuntu.com/search?keywords=Kepler&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search: "kepler"](https://archriscv.felixc.at/?q=kepler)
- [PyPI kepler package JSON](https://pypi.org/pypi/kepler/json)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project blog index](https://riseproject.dev/blog)
- [RISE RISC-V optimization guide](https://riscv-optimization-guide.riseproject.dev/)
- [kubernetes/kubernetes#132836 -- Proposal: Official Support for RISC-V Architecture](https://github.com/kubernetes/kubernetes/issues/132836)
- [kubernetes/kubernetes#132570 -- Assessment of difficulty in porting CPU architecture for kubernetes](https://github.com/kubernetes/kubernetes/issues/132570)
- [Kepler issue #482 -- ARM support](https://github.com/sustainable-computing-io/kepler/issues/482)
- [Kepler issue #1156 -- Missing support for linux/arm64/v8 container images](https://github.com/sustainable-computing-io/kepler/issues/1156)
- [Kepler issue #1347 -- UNKNOWN cpu_architecture on RHEL9/arm64](https://github.com/sustainable-computing-io/kepler/issues/1347)
- [Kepler issue #1616 -- duplicate ARM64 cpu_architecture bug](https://github.com/sustainable-computing-io/kepler/issues/1616)
- [Kepler issue #522 -- getCPUArchitecture doesn't recognize Sapphire Rapids](https://github.com/sustainable-computing-io/kepler/issues/522)
- [Kepler PR #1029 -- CPUID alternative solution](https://github.com/sustainable-computing-io/kepler/pull/1029)
- [Kepler PR #2390 -- Feature/prometheus power meter](https://github.com/sustainable-computing-io/kepler/pull/2390)
- [Kepler PR #1786 -- go-dependencies group bump](https://github.com/sustainable-computing-io/kepler/pull/1786)
- [Kepler PR #986 -- bump github.com/jaypipes/ghw](https://github.com/sustainable-computing-io/kepler/pull/986)
- [Kepler PR #995 -- bump github.com/opencontainers/runtime-spec](https://github.com/sustainable-computing-io/kepler/pull/995)
- [NVIDIA/go-nvml GitHub repository](https://github.com/NVIDIA/go-nvml)
- Local clone used for research: `/home/user/sustainable-computing-io/kepler` (fetched to full history via `git fetch --unshallow`, HEAD `63f0271d7a0460373fdab8f48fc7a4870dec5c9c`)