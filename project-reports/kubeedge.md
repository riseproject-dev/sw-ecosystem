---
title: KubeEdge
parent: Project Reports
color: orange
dependencies:
  - name: Kubernetes
    relation: runtime-dependency
    criticality: critical
  - name: SQLite
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="kubeedge" %}

# KubeEdge

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for KubeEdge<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

KubeEdge is a CNCF **graduated project** (operating as a Series of LF Projects, LLC under the Linux Foundation, Apache 2.0 license) that extends native Kubernetes container orchestration and device management to edge hosts and IoT devices. It is a pure-Go codebase with a Kubernetes-style split control plane: `cloudcore` (cloud-side, `CGO_ENABLED=0`) and `edgecore`/`keadm`/`edgesite` (edge-side agents, `CGO_ENABLED=1` due to an embedded SQLite dependency for local metadata storage).

**Governance**: merit-based, layered structure per `kubeedge/community/GOVERNANCE.md` - a Technical Steering Committee (TSC) at the top, open-membership Special Interest Groups (SIGs) owning specific project areas, temporary cross-SIG Working Groups, and TSC-formed sub-committees for security/release management. All contributors sign the CNCF CLA. There is no explicit platform/architecture tier policy in the governance documents - new-platform support is not formally tiered and falls to the relevant SIG under the general contribution process.

**Corporate sponsors**: commit-author analysis across 6,447 commits shows Huawei dominates (1,644 commits - the project's originator/primary backer), followed by DaoCloud (310), China Mobile (~102 combined), Sony (via Fujita Tomoya, ~107 combined), Arm (26), Inspur (25), plus QingCloud/KubeSphere-affiliated contributors. The TSC includes representatives from QingCloud, DaoCloud, HarmonyCloud, TikTok, VMware, and Huawei. Maintainers additionally include representatives from Bluedot, Alibaba Cloud, Google, Caze Labs, Infoblox, and Southwest Automation Research Institute.

**Community culture on new ports**: no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists in the repository. New-architecture support is exploratory and community-driven rather than a project-sanctioned roadmap item - the sole RISC-V validation effort explicitly frames itself as "a practical reference point for future RISC-V validation efforts," not a committed platform.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-02-17 | Issue [#3617](https://github.com/kubeedge/kubeedge/issues/3617) opened asking if KubeEdge can run on RISC-V; a community member posts a patch commenting out `keadm`'s tarball checksum verification as a workaround for the missing official riscv64 tarball | [Issue #3617](https://github.com/kubeedge/kubeedge/issues/3617) |
| 2022-06-08 | PR [#3904](https://github.com/kubeedge/kubeedge/pull/3904) ("support cross build riscv64") opened by gy95 (MEMBER) - adds a `gcc-riscv64-linux-gnu` cross-compiler to the build-tools image and refactors `hack/lib/golang.sh` toward architecture-agnostic build logic | [PR #3904](https://github.com/kubeedge/kubeedge/pull/3904) |
| 2022-09-24 | PR #3904 auto-closed unmerged by the stale bot after ~3 months of inactivity (never rebased after merge conflicts, never un-drafted) | [PR #3904 timeline](https://github.com/kubeedge/kubeedge/pull/3904) |
| 2023-12-20 | Issue [#5324](https://github.com/kubeedge/kubeedge/issues/5324) opened asking the same question; maintainer Shelley-BaoYue points back at the abandoned PR #3904 as the only lead ("I think it may be supported... You can give it a try") | [Issue #5324](https://github.com/kubeedge/kubeedge/issues/5324) |
| 2025-04-29 | Issue [#6305](https://github.com/kubeedge/kubeedge/issues/6305) opened - riscv64 edge nodes stay `NotReady` because no riscv64 `kube-proxy` image exists to pull | [Issue #6305](https://github.com/kubeedge/kubeedge/issues/6305) |
| 2025-06-27 | Issue [#6369](https://github.com/kubeedge/kubeedge/issues/6369) - third-party "RAX" tool rates KubeEdge riscv64 porting difficulty as "Middle" (21,136 lines of arch-related code); no maintainer response | [Issue #6369](https://github.com/kubeedge/kubeedge/issues/6369) |
| 2026-01-20 | Issue [#6614](https://github.com/kubeedge/kubeedge/issues/6614) opened by Shelley-BaoYue (COLLABORATOR) - master tracking issue, structured as an LFX Mentorship 2026 Term 1 project idea; still **OPEN**, unstaffed, 2 interested applicants with no maintainer technical follow-up | [Issue #6614](https://github.com/kubeedge/kubeedge/issues/6614) |
| 2026-04-21 (published) | KubeEdge blog post documents a successful manual from-source build and functional validation on a VisionFive2 board (KubeEdge v1.21.0) | [KubeEdge RISC-V validation blog](https://kubeedge.io/blog/kubeedge-riscv-validation/) |

**Key contributors**: Shelley-BaoYue (COLLABORATOR, org affiliation not stated in findings) is the recurring maintainer touching every RISC-V thread; gy95 (MEMBER) authored the one code attempt (PR #3904); ddc-baiye / Dongdong Chen (Bluedot) authored the VisionFive2 validation blog, merged into `kubeedge/website` via PR #787 on 2026-06-24.

**Is it fully upstream?** No. Zero riscv64-related commits exist on the default branch (confirmed by `search_commits` returning 0 results for "riscv"/"riscv64" scoped to the repo, and by a fresh clone at commit `509543d7` showing 0 non-vendor matches for "riscv" anywhere in the tree). The only code contribution attempt (#3904) was closed unmerged.

## 3. Upstream Support Tier

There is no formal tier policy document. In practice, architecture support is defined entirely by what `hack/lib/golang.sh` and `.github/workflows/release.yml` implement.

| Architecture | Upstream CI | Release-blocking | Official binaries | Official multi-arch images |
|---|---|---|---|---|
| amd64 | Yes (`main.yaml`, `ubuntu-22.04`) | Yes | Yes | Yes (`platforms: linux/amd64,...`) |
| arm64 | Yes (`main-arm64.yaml`, self-hosted `openeuler-linux-arm64` runner) | Yes | Yes | Yes |
| arm/v7 | No dedicated workflow | No | Yes (release binaries only) | Yes (in buildx platform list) |
| riscv64 | **No** (zero riscv references across all 12 workflow files) | No | **No** | **No** (absent from `platforms:` list) |

Source: [`.github/workflows/release.yml`](https://github.com/kubeedge/kubeedge/blob/master/.github/workflows/release.yml), [`.github/workflows/main-arm64.yaml`](https://github.com/kubeedge/kubeedge/blob/master/.github/workflows/main-arm64.yaml), direct grep of `hack/lib/golang.sh` at commit `509543d7`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

KubeEdge is not applicable to the JIT/SIMD/crypto-intrinsic component analysis that applies to compute libraries. It is an orchestration control plane written in pure Go with no project-authored architecture-conditional source (no `//go:build` arch-specific files, no assembly, no SIMD, no custom GC barriers). Architecture handling exists only at the build-script/CGO-compiler level (cross-compiler selection for CGO-enabled binaries), not in application source code.

A full-repo code search for `riscv`, `vfloat32m1_t`, `rvv`, and `riscv64` (excluding `vendor/`) returned zero hits; a control query for `GOARCH` returned 13 real hits confirming the search index itself works. The only files matching `*riscv*` by name (25 total) are entirely inside `vendor/` and belong to third-party Go standard-library/runtime packages (`golang.org/x/sys/cpu`, `golang.org/x/sys/unix`) and dependencies (`prometheus/procfs`, `tklauser/go-sysconf`) - these are stock, auto-generated cross-platform files shipped for every Go-supported architecture and contain zero KubeEdge-authored code.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cross-build compiler mapping (`hack/lib/golang.sh`) | full (default GOARCH, no cross-compiler needed) | full (`aarch64-linux-gnu-gcc`) | **missing** (no branch in the if/elif chain; `GOARCH=riscv64` silently builds nothing) |
| CGO-enabled edgecore/edgesite (needs `sqlite-dev`) | full | full | **missing** (no riscv64 GCC cross-compiler provisioned anywhere in `build-tools.dockerfile`) |
| Architecture-conditional application source | n/a (none exists project-wide) | n/a | n/a - project carries no arch-conditional Go source at all |

**Conclusion**: This is a pure control-plane project, not an optimization-purpose one. The Step 2 ISA-coverage capping in the readiness model does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

KubeEdge has **no CMake build system** - `CMakeLists.txt`, `cmake/`, and any `*.cmake` files are entirely absent from the repository. The build system is GNU Make + Bash driving `go build`, defined in the root `Makefile` and `hack/make-rules/*.sh` / `hack/lib/golang.sh`.

**Toolchain requirements**:
- Minimum Go version enforced in code: Go >= 1.21 (checked by `kubeedge::golang::verify_golang_version` in `hack/lib/golang.sh`).
- Actual build container pins **Go 1.23.12** (`build/docker/build-tools/build-tools.dockerfile` downloads `go1.23.12.linux-{amd64,arm64,armv6l}.tar.gz`; Docker images build `FROM golang:1.23.12-alpine3.21`).
- GCC cross-toolchains installed in `build-tools.dockerfile`: `gcc-aarch64-linux-gnu` + `libc6-dev-arm64-cross`, and `gcc-arm-linux-gnueabihf`. **No `gcc-riscv64-linux-gnu` package is installed anywhere** - there is no riscv64 toolchain provisioned to report a minimum version for.

**Exact supported cross-build commands** (verbatim from `hack/lib/golang.sh`):
```bash
# arm64 (GOARM8)
GOARM="" GOARCH=arm64 GOOS=linux CGO_ENABLED=1 CC=aarch64-linux-gnu-gcc \
  go build -o <out>/<name> -ldflags "$ldflags" <pkg>

# armv7 (GOARM7)
GOARCH=arm GOOS=linux GOARM=7 CGO_ENABLED=1 CC=arm-linux-gnueabihf-gcc \
  go build -o <out>/<name> -ldflags "$ldflags" <pkg>
```
`KUBEEDGE_ALL_CROSS_GOARMS=(8 7)` is the entire supported list. Passing `GOARCH=riscv64` to `make crossbuild` falls through the if/elif chain and builds nothing, because the function only acts when `goarm` is "8" or "7".

**cloudcore exception**: `cloudcore` builds with `CGO_ENABLED=0`, meaning it could in principle cross-compile to riscv64 with a plain `GOARCH=riscv64 GOOS=linux go build` even without a C cross-compiler - but this path is not wired into any official Make target, Dockerfile, or CI workflow. `edgecore`/`edgesite` cannot use this shortcut because they require CGO for the embedded SQLite dependency.

**QEMU usage**: appears only in `build/edge/Dockerfile`, and only for `x86_64` emulation (`QEMU_ARCH=x86_64` default, used so an x86 edgecore binary/image can run under emulation on other host architectures during multi-arch buildx builds) - never set to riscv64 anywhere in the repository.

**Multi-arch image build platform list** (`.github/workflows/release.yml` line 169, and `hack/make-rules/crossbuildimage.sh`):
```bash
docker buildx build --build-arg GO_LDFLAGS="${GO_LDFLAGS}" \
  -t ${IMAGE_REPO_NAME}/${IMAGE_NAME}:${IMAGE_TAG} \
  -f ${DOCKERFILE_PATH} \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  --push .
```
riscv64 is absent from this hard-coded list.

**No `-DUSE_X=OFF`-style flags exist** - there is no CMake, no configure script, and no such flag convention anywhere; only `GOLDFLAGS`, `GOGCFLAGS`, `GO_LDFLAGS`, `ARCH`, `ARM_VERSION`, `OS`, `BUILD_WITH_CONTAINER` Make/shell variables exist.

**Known build failures**: none documented specifically, because no riscv64 build has ever been attempted through official tooling. The one manual out-of-band build (VisionFive2 blog) reports success, not failure, using `GOARCH=riscv64 go build` directly outside the official Make/Docker pipeline.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official binary download | Yes | Yes | **No** |
| Official container image | Yes | Yes | **No** |
| CI-verified build | Yes | Yes | **No** |
| CI-verified tests | Yes | Yes | **No** |
| `keadm join` / node bootstrap | Yes | Yes | Works via manual source build only ([blog](https://kubeedge.io/blog/kubeedge-riscv-validation/)) |
| Node reaches `Ready` state | Yes | Yes | **Functional gap**: nodes stay `NotReady` because no official riscv64 `kube-proxy` image exists to pull ([Issue #6305](https://github.com/kubeedge/kubeedge/issues/6305)) - an upstream Kubernetes image-distribution gap, not a KubeEdge code defect |
| Workload scheduling (e.g. Nginx pod) | Yes | Yes | Confirmed working in manual validation ([blog](https://kubeedge.io/blog/kubeedge-riscv-validation/)) |
| Network stress / fault-recovery / long-term stability | Validated in production | Validated in production | **Not tested** - author explicitly scopes the validation to "basic feasibility, not full production readiness" |

**Performance gaps**: Data not available - no quantitative KubeEdge-specific benchmark (throughput, latency, resource overhead) comparing riscv64 against amd64/arm64 was found from the KubeEdge project itself. A third-party academic paper (Lumpp, Barchi, Acquaviva, Bombieri, ["On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing,"](https://dl.acm.org/doi/10.1145/3624486.3624490) ACM SEA4DQ 2023, introducing "KubeEdge-V") measured container-orchestration overhead on a SiFive HiFive Unmatched vs. an NVIDIA Jetson Xavier AGX (ARM64), but this uses a research prototype ("KubeEdge-V"), not upstream KubeEdge, and the paper is not affiliated with the RISE Project. Reported findings [NEEDS VERIFICATION - single source, full paper text behind 403 paywalls at ACM/MDPI/Preprints.org/ResearchGate, only abstract/summary text retrievable]: sysbench CPU overhead -0.4% (RISC-V) vs -3.7% (ARM64); STREAM memory +0.4% net (RISC-V) vs -3.8% (ARM64); Phoronix app-level -1.9% (RISC-V) vs -3.1% (ARM64); OS-level (OSBench/IPC/stress-ng) -5.4% (RISC-V) vs -2.9% (ARM64), with context-switching under stress-ng showing the largest divergence (RISC-V -21.4% vs ARM64 -0.26%), root-caused to container-runtime syscall interception adding up to 40% syscall latency. Absolute STREAM throughput: RISC-V Copy 1,294 MiB/s vs ARM64 Jetson 22,765 MiB/s (reflecting DDR4/64-bit vs LPDDR4x/256-bit memory bus differences, not a KubeEdge-specific effect).

**Security hardening gaps**: Data not available - no riscv64-specific security hardening documentation, CVE, or hardening-flag comparison was found for KubeEdge.

**NaN / floating-point semantics issues**: Not applicable - KubeEdge is a control-plane/orchestration project with no floating-point-sensitive numerics in its core logic. Data not available beyond this scoping conclusion.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by cloning `kubeedge/kubeedge` master (commit `509543d78311bb696dcfa525c168cf739527819f`, dated 2026-09-03) and grepping every workflow file's actual content: `grep -rin "riscv" .github/workflows/` returns 0 matches across all 12 files (`build-tools.yml`, `cifuzz-doc.yaml`, `cifuzz.yml`, `cilium-e2e.yml`, `codespell.yml`, `fossa-doc.yaml`, `fossa.yml`, `main-arm64.yaml`, `main-doc.yaml`, `main.yaml`, `release.yml`, `schedule.yml`). No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.circleci/`, or `.drone.yml` exists at the repository root.

No RISE runner usage was found for KubeEdge: the RISE RISC-V Runners service (`riseproject-dev/riscv-runner`, `riscv-runner-images`, `riscv-runner-device-plugin`, `riscv-runner-sample`) is a managed GitHub Actions CI service on bare-metal RISC-V hardware (Scaleway EM-RV1), orchestrated with vanilla Kubernetes + a custom device plugin/node-labeller - its README does not mention KubeEdge, and no KubeEdge workflow references RISE runners or `riseproject-dev`.

| Architecture | CI exists | Builds | Runs tests | Release-blocking | Runner |
|---|---|---|---|---|---|
| amd64 | Yes | Yes | Yes | Yes | GitHub-hosted `ubuntu-22.04` |
| arm64 | Yes | Yes | Yes (`make`, `make smallbuild`) | Yes | Self-hosted `openeuler-linux-arm64` |
| riscv64 | **No** | No | No | No | None |

## 8. Distribution and Release Status

**Official binaries for riscv64**: none. Verified via GitHub's release-asset partial for `https://github.com/kubeedge/kubeedge/releases/expanded_assets/v1.23.1` and cross-checked across the 10 most recent tags (v1.19.2-v1.23.1): only `linux-amd64`, `linux-arm`, `linux-arm64`, and `windows-amd64` tarballs exist for `edgesite`, `keadm`, and `kubeedge` binaries, plus checksums and source archives.

**PyPI**: not applicable - `https://pypi.org/pypi/kubeedge/json` returns HTTP 404; no package named "kubeedge" exists on PyPI (expected, since KubeEdge is a Go project).

**npm / Maven**: Data not available - no npm or Maven artifacts were searched for or found relevant to this Go-only project; none expected given the technology stack.

**OCI images**: Official multi-arch images are built for `linux/amd64,linux/arm64,linux/arm/v7` only (`.github/workflows/release.yml`); no riscv64 image tag is published.

**Ubuntu 26.04 (resolute)**: `https://packages.ubuntu.com/search?keywords=KubeEdge&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" - no `kubeedge` package exists in Ubuntu for **any** architecture.

**Debian, Fedora**: Data not available - not explicitly checked in the research findings, but consistent with the Ubuntu result (KubeEdge is not packaged in general-purpose Linux distributions; it is distributed as GitHub release binaries and container images only).

**Arch Linux RISC-V** (archriscv.felixc.at): no mention of "kubeedge" anywhere on the port's package listing.

**RISE Python wheel builder**: not applicable - KubeEdge is a Go project, and a GitLab API check of `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kubeedge/` redirects to the same PyPI 404.

**What a user must do to get a working binary today**: clone the source, install Go >= 1.21 (project uses 1.23.12), manually run `GOARCH=riscv64 GOOS=linux go build` for `cloudcore` (CGO_ENABLED=0, no cross-compiler needed) - this path is not officially supported or documented. For `edgecore`/`edgesite`/`keadm` (which require CGO for the embedded SQLite dependency), a user must additionally provision their own `gcc-riscv64-linux-gnu` cross-compiler, since none of KubeEdge's official Dockerfiles or build-tools images include one. This is exactly the manual procedure the [VisionFive2 validation blog](https://kubeedge.io/blog/kubeedge-riscv-validation/) documents (native build on the target hardware itself, avoiding cross-compilation entirely, using Ubuntu Server 24.04.4 riscv64, Go 1.22.4, containerd v2.2.2, runc, CNI plugins v1.9.1). A user must also independently build or source a riscv64 `pause` image and address the missing riscv64 `kube-proxy` image gap ([Issue #6305](https://github.com/kubeedge/kubeedge/issues/6305)) to get a node to `Ready` state.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community |
|---|---|---|---|---|---|
| Go toolchain (go.mod: `go 1.23.12`) | Compiler/runtime for all KubeEdge Go code | Found: `golang-go` riscv64 1.24~2 (release), 1.26~1 (proposed) in Ubuntu resolute | Full upstream Go riscv64 CI (builders since Go 1.19+) | Official upstream Go releases ship riscv64 tarballs | None open blocking KubeEdge specifically |
| SQLite (via `mattn/go-sqlite3` CGO binding) | Embedded local-metadata DB for `edgecore` (`CGO_ENABLED=1`, `sqlite-dev` in official Dockerfile) | Found: `libsqlite3-dev` riscv64 3.46.1-9; `golang-github-mattn-go-sqlite3-dev` riscv64 1.14.27~ds1-1 / 1.14.32~ds1-1 | No riscv64-specific test issues found; pure portable C with no asm/SIMD/JIT | Both C library and Go binding ship riscv64 builds in Ubuntu 26.04 | None found for `mattn/go-sqlite3` specifically |
| `golang.org/x/crypto` | TLS/cert/JWT crypto for cloud-edge channel security | Found: `golang-golang-x-crypto-dev` riscv64 1:0.25.0-1 / 1:0.47.0-1 | Open upstream Go issue for riscv64 fips140 test failures ([golang/go#70516](https://github.com/golang/go/issues/70516), targeted Go 1.26) [NEEDS VERIFICATION - single source] | Ships as part of standard golang-x-crypto Debian/Ubuntu packaging | golang/go#70516 - upstream Go issue, not KubeEdge-blocking |
| `klauspost/compress` | Optimized compression, transitively pulled via image/registry, gRPC-gateway, containerd chain | Found: `golang-github-klauspost-compress-dev` riscv64 1.18.0+ds1-1 / 1.18.1+ds1-1 | No riscv64-specific issues found | Packaged for riscv64 in Ubuntu 26.04 | None found |
| containerd | CRI container runtime backing `edgecore`'s pod lifecycle | Found: riscv64 2.1.3-0ubuntu3, 2.2.2-0ubuntu1(.1) | Historical issue [containerd/containerd#3389](https://github.com/containerd/containerd/issues/3389) ("100% CPU on container deletion" on RISC-V) - closed, 2019-era, since resolved | Ships riscv64 packages in Ubuntu 26.04; upstream releases riscv64 binaries | No open riscv64 blockers found |
| runc | Low-level OCI runtime under containerd | Found: riscv64 1.3.0-0ubuntu2 / 1.4.0-0ubuntu1 | riscv64 support landed via three separate community PRs over ~4 years, each shipped with a "not officially supported" disclaimer [NEEDS VERIFICATION - single source]; no dedicated maintainer-owned riscv64 CI | Packaged for riscv64 in Ubuntu 26.04 | No open GitHub issues found for runc riscv64 specifically |
| `golang.org/x/sys` | Low-level syscall bindings (netlink, cgroups, gopsutil) | Found: `golang-golang-x-sys-dev` riscv64 0.22.0-1 / 0.38.0-1 | Stable, mature riscv64 syscall support in Go's x/sys | Packaged for riscv64 in Ubuntu 26.04 | None found |

**Deep-dive**: none of these dependencies involve JIT, SIMD, or numerics-critical code paths - KubeEdge's dependency chain is standard Go tooling plus the OCI/CRI container-runtime stack (containerd, runc) and pure-C SQLite. All are already available on Ubuntu 26.04 riscv64 and none carry an open, riscv64-specific blocking issue. Note: this table's per-package availability was cross-checked against Launchpad build pages as a substitute for the `project-graph` SPARQL query, which could not be executed in this session because the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) - a connection failure, not evidence of absence.

The gap is entirely in **KubeEdge's own release/CI process** (does not build or publish riscv64 binaries) and in the **missing upstream riscv64 `kube-proxy` image** (an external Kubernetes ecosystem gap, not a KubeEdge or dependency defect), which currently prevents nodes from reaching `Ready` in real deployments despite `edgecore`/`keadm` themselves building and running fine per the VisionFive2 validation.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#6614](https://github.com/kubeedge/kubeedge/issues/6614) | Enable and Verify KubeEdge Support on RISC-V Architecture | OPEN (2026-01-20) | Tracking/feature | Master tracking issue, LFX Mentorship 2026 Term 1 project; 2 interested applicants, zero maintainer technical follow-up recorded |
| [#6305](https://github.com/kubeedge/kubeedge/issues/6305) | Does the edgecore need the kube-proxy to be ready?? | OPEN (2025-04-29) | **Correctness/functional bug** | riscv64 nodes stay `NotReady` because no riscv64 `kube-proxy` image exists to pull; maintainer clarified edgecore does not hard-require kube-proxy but did not resolve the underlying `NotReady` cause - thread unresolved |
| [#5324](https://github.com/kubeedge/kubeedge/issues/5324) | Could KubeEdge run on device with RISC-V architecture? (node) | OPEN (2023-12-20) | Question | Maintainer points back at the abandoned PR #3904 as the only lead |
| [#3617](https://github.com/kubeedge/kubeedge/issues/3617) | Could KubeEdge run on device with RISC-V architecture? | OPEN, stale label (2022-02-17) | Question | Community-supplied patch bypassing keadm's checksum gate (symptom of no official riscv64 tarball existing) |
| [#6369](https://github.com/kubeedge/kubeedge/issues/6369) | Assessment of the difficulty in porting CPU architecture for kubeedge | OPEN (2025-06-27) | Informational | Third-party "RAX" tool rates porting difficulty "Middle" (21,136 arch-related LOC); zero maintainer response |
| [#3904](https://github.com/kubeedge/kubeedge/pull/3904) | support cross build riscv64 (PR) | **CLOSED, unmerged** (2022-06-08 to 2022-09-24) | N/A | Only historical code contribution; died from author inactivity (never rebased, never un-drafted), not maintainer rejection |

**Correctness bugs highlighted separately**: [#6305](https://github.com/kubeedge/kubeedge/issues/6305) is the only concrete riscv64 correctness/functional bug on record - an image-availability gap causing nodes to stay `NotReady`. No RISC-V-specific memory-safety, floating-point, or logic bugs were found (searches for "riscv64 bug" and "riscv nan floating" returned zero or only-ARM-related results). For comparison, [#4662](https://github.com/kubeedge/kubeedge/issues/4662) documents an unaligned 64-bit atomic operation panic on ARMv7 (Cortex-A7) - the same bug *class* (Go atomic-alignment requirements) could plausibly affect riscv32 targets, though this is not itself a riscv64 report.

## 12. Objections and Upstream Blockers

**Stated objections**: none found. No maintainer has technically rejected riscv64 support anywhere in the six issues/PRs reviewed. Every stall traces to contributor inactivity, not review pushback: PR #3904 was never rebased after conflicts arose and was never un-drafted by its author; issue #6614 has two interested mentee applicants with zero maintainer technical response recorded.

**Technical blockers**:
1. No `gcc-riscv64-linux-gnu` cross-compiler provisioned in the build-tools image, needed for CGO-enabled `edgecore`/`edgesite` (SQLite dependency).
2. No `GOARCH=riscv64` branch in `hack/lib/golang.sh`'s cross-build function.
3. No `linux/riscv64` entry in the Buildx multi-arch platform lists (`release.yml`, `crossbuildimage.sh`).
4. External blocker outside KubeEdge's control: no official riscv64 `kube-proxy` image exists upstream in Kubernetes, which prevents riscv64 nodes from reaching `Ready` even when `edgecore`/`keadm` build and run correctly ([#6305](https://github.com/kubeedge/kubeedge/issues/6305)).

**Organizational blockers**: the work is currently framed as an unstaffed LFX Mentorship 2026 Term 1 project ([#6614](https://github.com/kubeedge/kubeedge/issues/6614)) requiring a mentee to supply their own RISC-V hardware. No corporate sponsor (Huawei, DaoCloud, or otherwise) has committed engineering time to riscv64 as of this report. RISE Project involvement: none - confirmed by checking RISE's blog (34 posts, full sitemap scanned, zero KubeEdge mentions), RISE's member list (KubeEdge, CNCF, and Bluedot are not RISE members), and all 25 `riseproject-dev` GitHub repos (none reference KubeEdge).

**Acceptance probability**: No maintainer objection exists to the *approach* used in PR #3904 - the prerequisite chain for real support is understood and has been informally validated end-to-end (build system changes in #3904, functional validation via the VisionFive2 blog). Given a properly staffed contribution that rebases/completes the #3904 approach, publishes official riscv64 binaries/images, and the upstream Kubernetes `kube-proxy` image gap is separately resolved, acceptance probability is assessed as high based on the absence of any recorded technical objection - but this is contingent on staffing, which has not materialized since 2022. [NEEDS VERIFICATION - this probability assessment is inferential, not a stated maintainer commitment.]

## 13. Readiness Assessment

- **Color:** orange (no upstream CI, no distribution floor applicable)
- **Release provider:** none
- **Justification:** No upstream riscv64 CI exists - confirmed by grepping all 12 GitHub Actions workflow files in `kubeedge/kubeedge` at commit `509543d7`, with zero "riscv" matches anywhere ([`.github/workflows/`](https://github.com/kubeedge/kubeedge/tree/master/.github/workflows)). No official riscv64 release binaries or images exist ([release asset listing](https://github.com/kubeedge/kubeedge/releases), platform list in [`release.yml`](https://github.com/kubeedge/kubeedge/blob/master/.github/workflows/release.yml) covering only `linux/amd64,linux/arm64,linux/arm/v7`). No Linux distribution packages KubeEdge at all (Ubuntu resolute search returns zero results for any architecture), so the distribution floor (which would otherwise upgrade a no-CI project to yellow or orange based on a distro build) does not apply here - there is no distro package to floor to. This differs from the "downstream-only" orange sub-case (distro ships with patches) and the "clean-distro-build" yellow sub-case (distro ships from unmodified source): neither applies because no distro ships KubeEdge in any form. The project is not red, because riscv64 is not confirmed broken - a manual from-source build succeeds ([VisionFive2 validation blog](https://kubeedge.io/blog/kubeedge-riscv-validation/)), demonstrating the code itself builds and runs correctly when a user manually provisions the missing tooling. It is not grey, because there is sufficient positive evidence (both the manual build success and the precise inventory of missing build-system pieces) to classify it definitively rather than as unknown. Because KubeEdge is a control-plane/orchestration project, not an optimization-purpose one, the Step 2 ISA-coverage modifier does not apply (`optimization_gap: N/A`).
- **Pending work that could change the grade:** Issue [#6614](https://github.com/kubeedge/kubeedge/issues/6614) (open LFX Mentorship 2026 proposal, unstaffed) is the only tracked path to a color upgrade - it explicitly lists producing official riscv64 binaries/images and optionally adding riscv64 CI as goals. Resurrecting and rebasing PR [#3904](https://github.com/kubeedge/kubeedge/pull/3904)'s build-system changes (Makefile/`golang.sh`/`release.sh`/build-tools Dockerfile/CI) is the only known working cross-build recipe and the concrete first step. No RISE involvement exists today to accelerate this (confirmed: zero mentions of KubeEdge across RISE's blog, member list, and GitHub org). Separately, resolving the upstream Kubernetes `kube-proxy` riscv64 image gap ([#6305](https://github.com/kubeedge/kubeedge/issues/6305)) is a precondition for functional deployments even if KubeEdge's own release pipeline is fixed, though this sits outside KubeEdge's own repository.

## 14. Investment Analysis

**RISE involvement check**: RISE has not funded, published, or run CI for any KubeEdge riscv64 work - confirmed across RISE's full blog history (34 posts), member list, and all 25 `riseproject-dev` GitHub repositories. No RISE-funded RP-numbered project or working group targets KubeEdge. All investment items below are fully unaddressed and not double-counted against any RISE effort.

### 14.1 Functional Enablement

- Resurrect and rebase PR [#3904](https://github.com/kubeedge/kubeedge/pull/3904): update the Makefile `ARCHITECTURE` parameter, `hack/lib/golang.sh` `CC_FLAG`/`GOARCH_FLAG`/`GOARM_FLAG` generalization, and add `gcc-riscv64-linux-gnu` to `build/docker/build-tools/build-tools.dockerfile`, against current (2026) master - the original PR is 4 years stale and will have accumulated conflicts.
- Add `linux/riscv64` to the Buildx platform lists in `.github/workflows/release.yml` and `hack/make-rules/crossbuildimage.sh`.
- Build and publish an official riscv64 `pause` image (the VisionFive2 validation had to build this manually - no upstream Kubernetes riscv64 `pause` image was confirmed available in these findings) [NEEDS VERIFICATION - pause image availability not directly checked].
- Coordinate with or track upstream Kubernetes on the missing riscv64 `kube-proxy` image ([#6305](https://github.com/kubeedge/kubeedge/issues/6305)) - outside KubeEdge's own repository but blocking real deployments.

### 14.2 Performance Optimization

Not applicable in the SIMD/JIT/numerics sense - KubeEdge has no architecture-specific hot paths to optimize (Section 4). Any performance work would be limited to validating the container-runtime overhead findings from the third-party KubeEdge-V academic study (Section 6) against upstream KubeEdge on real riscv64 hardware, which has not been done.

### 14.3 CI/CD Infrastructure

- Add a riscv64 CI job. Given no self-hosted riscv64 runner currently exists in KubeEdge's infrastructure (unlike arm64's `openeuler-linux-arm64` self-hosted runner), this requires either provisioning dedicated riscv64 hardware/VM runners or evaluating RISE's free RISC-V GitHub Actions runners (announced 2026-03-24, unused by KubeEdge to date).
- Wire riscv64 into the existing `main.yaml`-style build+test pipeline, following the `main-arm64.yaml` pattern as a template.

### 14.4 Ecosystem Enablement

Not applicable - KubeEdge has no dependent package ecosystem (Section 10 omitted; it is a standalone Go control-plane/agent project with no npm/PyPI/Maven consumer ecosystem tied to its own package).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Rebase/complete PR #3904 build-system changes against current master | 2-3 | Unassigned (candidate: LFX mentee under #6614) | Critical |
| Functional | Add `linux/riscv64` to Buildx release platform lists and validate multi-arch image build | 1 | Unassigned | Critical |
| Functional | Build/publish official riscv64 `pause` image | 0.5-1 | Unassigned | High |
| Functional | Track/escalate upstream Kubernetes riscv64 `kube-proxy` image gap (#6305) | 0.5 (coordination only; fix is external) | Unassigned | High |
| CI/CD | Provision riscv64 CI runner (self-hosted or RISE-provided) and add build+test workflow modeled on `main-arm64.yaml` | 2-3 | Unassigned | High |
| Functional | Real-hardware validation beyond VisionFive2 (network stress, fault-recovery, long-term stability per the blog's own scoping gap) | 3-4 | Unassigned | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-07.)

## 16. References

- [Issue #6614 - Enable and Verify KubeEdge Support on RISC-V Architecture](https://github.com/kubeedge/kubeedge/issues/6614)
- [Issue #6369 - Assessment of the difficulty in porting CPU architecture for kubeedge](https://github.com/kubeedge/kubeedge/issues/6369)
- [Issue #6305 - Does the edgecore need the kube-proxy to be ready??](https://github.com/kubeedge/kubeedge/issues/6305)
- [Issue #5324 - Could KubeEdge run on device with RISC-V architecture? (node)](https://github.com/kubeedge/kubeedge/issues/5324)
- [Issue #3617 - Could KubeEdge run on device with RISC-V architecture?](https://github.com/kubeedge/kubeedge/issues/3617)
- [PR #3904 - support cross build riscv64](https://github.com/kubeedge/kubeedge/pull/3904)
- [KubeEdge blog - KubeEdge on RISC-V, Deploying and Validating on VisionFive2](https://kubeedge.io/blog/kubeedge-riscv-validation/)
- [KubeEdge GitHub Releases](https://github.com/kubeedge/kubeedge/releases)
- [`.github/workflows/release.yml`](https://github.com/kubeedge/kubeedge/blob/master/.github/workflows/release.yml)
- [`.github/workflows/main-arm64.yaml`](https://github.com/kubeedge/kubeedge/blob/master/.github/workflows/main-arm64.yaml)
- [`hack/lib/golang.sh`](https://github.com/kubeedge/kubeedge/blob/master/hack/lib/golang.sh)
- [Ubuntu package search, KubeEdge, suite=resolute](https://packages.ubuntu.com/search?keywords=KubeEdge&suite=resolute&searchon=names&section=all)
- [PyPI JSON API - kubeedge (404, package does not exist)](https://pypi.org/pypi/kubeedge/json)
- [RISE wheel builder GitLab mirror redirect check](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kubeedge/)
- [Arch Linux RISC-V port package listing](https://archriscv.felixc.at/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members)
- [Lumpp, Barchi, Acquaviva, Bombieri - "On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing," ACM SEA4DQ 2023](https://dl.acm.org/doi/10.1145/3624486.3624490)
- ["Evaluating ARM and RISC-V Architectures for High-Performance Computing with Docker and Kubernetes," MDPI Electronics 13(17):3494, 2024](https://www.mdpi.com/2079-9292/13/17/3494)
- [golang/go#70516 - fips140 test failures on riscv64](https://github.com/golang/go/issues/70516)
- [containerd/containerd#3389 - [Risc-V] CPU at 100% on container deletion (closed)](https://github.com/containerd/containerd/issues/3389)
- [kubeedge/community GOVERNANCE.md](https://github.com/kubeedge/community)
- [kubeedge/kubeedge MAINTAINERS / OWNERS](https://github.com/kubeedge/kubeedge)
- [KubeEdge homepage](https://kubeedge.io/)
