---
title: HAMi
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: CUDA
    relation: runtime-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: build-dependency
    criticality: optional
  - name: HAMi-core
    relation: build-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="hami" %}

# HAMi

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for HAMi<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

HAMi (Heterogeneous AI Computing Virtualization Middleware) is a Kubernetes device-plugin and scheduler-extender for GPU sharing. It is a CNCF **Incubating** project ([SECURITY-INSIGHTS.yml](https://github.com/Project-HAMi/HAMi), CNCF Landscape, CNAI Landscape listing) licensed under Apache 2.0. The project consists of a pure-Go control plane (scheduler extender, device plugin, admission webhook, monitor) plus a companion native-code repository, [HAMi-core](https://github.com/Project-HAMi/HAMi-core), which builds `libvgpu.so`, a CUDA/NVML API-interception library injected into GPU containers to enforce per-container memory and utilization limits.

Governance follows a standard CNCF 4-tier ladder (Member -> Reviewer -> Approver -> Maintainer), documented in `Project-HAMi/community` (`community-membership.md`). The repo `OWNERS` file lists approvers archlitchi, DSFans2014, fouof, wawa0210, shouren. Top corporate maintainers/committers by commit volume: **dynamia.ai** (Li Mengxuan / archlitchi, the dominant contributor at ~530 commits across email variants; also Xiao Zhang / wawa0210), **NVIDIA** (Wang Leibo), **4Paradigm** (Shouren Yang, peizhaoyou). The project's website lists a broader contributor roster including Alibaba Group, Huawei, ByteDance, Oracle, VMware, DaoCloud, Alauda, TenxCloud, ZStack, Visa, Ping An Bank, plus academic contributors, and cites 80+ adopter organizations.

CONTRIBUTING.md describes an open, case-by-case review process for new hardware/device backend support (fork -> PR -> maintainer review), with a hardware-validation gate requiring real-device testing for allocation/isolation-touching changes. No RFC-style vendor-onboarding policy exists, and there is no recorded precedent, positive or negative, specific to RISC-V or any new CPU architecture (a CPU architecture port is a different kind of change than the accelerator-vendor backends the roadmap process is built around).

## 2. Port History and Upstreaming Timeline

No riscv64 port exists or has been attempted. Exhaustive search of the full, unshallowed git history plus the live GitHub search index found zero RISC-V presence:

| Date | Event | Source |
|---|---|---|
| N/A | No riscv-related commit, issue, or PR exists in project history | `git log --all -i --grep="riscv"` -> 0 commits; GitHub issue/PR/commit/code search -> 0 genuine results |
| 2026-09-09 | Dependabot PR [#2984](https://github.com/Project-HAMi/HAMi/pull/2984) merged (bump `golang.org/x/sys` 0.47.0 -> 0.48.0); its upstream changelog text incidentally references a "riscv64 hwprobe drift test" commit in the Go standard library, unrelated to any HAMi RISC-V work | [PR #2984](https://github.com/Project-HAMi/HAMi/pull/2984) |

There is no first RISC-V commit to date, no tracking issue, and no evidence the port has even been requested. **Fully upstream: not applicable** - there is nothing upstream to be merged.

## 3. Upstream Support Tier

No formal `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` tiering document exists. Hardware/device-backend support is tracked informally via `docs/develop/roadmap.md`, a checklist table of accelerator vendors (NVIDIA, Cambricon, Enflame, Hygon, Ascend, Iluvatar, Teco, Moore Threads, Birentech, MetaX, Kunlunxin, Vastai, AWS Neuron) and features - it contains **no RISC-V CPU entry, planned or shipped**. Project maturity sits at CNCF Incubating (below Graduated).

| Architecture | CI builds | CI tests | Release artifact |
|---|---|---|---|
| amd64 | yes (`BUILD_PLATFORM: linux/amd64`, [ci.yaml](https://github.com/Project-HAMi/HAMi)) | yes (e2e workflows) | yes (container images) |
| arm64 | yes (`BUILD_PLATFORM: linux/arm64`) | yes (same e2e coverage) | yes (container images) |
| riscv64 | no | no | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

HAMi contains no hand-written, architecture-specific source code for **any** architecture, including amd64 and arm64. `search_code "filename:*_amd64.go"` and `"filename:*_riscv64.go"` against `Project-HAMi/HAMi` both returned 0 results; the only `GOARCH`-related hits are `runtime.GOARCH` used generically in `pkg/version/version.go`, `pkg/version/version_test.go`, and `pkg/metrics/metrics_test.go` to report the build-platform string, plus `GOARCH=$TARGETARCH` in `docker/Dockerfile.no-core-test` (standard Docker buildx plumbing). There is no JIT, no SIMD, no crypto intrinsics, and no assembly anywhere in HAMi or HAMi-core - the project is a Kubernetes control-plane/device-plugin (scheduler, webhook, device plugin, metrics) plus a CUDA/NVML symbol-interception library, not a CPU-ISA-specific compute-kernel project.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go control plane (scheduler/webhook/device-plugin) | generic Go, no arch-specific code | generic Go, no arch-specific code | would compile (pure Go), untested - no CI |
| HAMi-core `libvgpu.so` (CUDA/NVML hook, `src/cuda/hook.c`, `src/nvml/hook.c`, `src/allocator/allocator.c`) | links against `nvidia/cuda:*` base image, `-lcuda -lnvidia-ml` | same | would plausibly compile (plain C, CMake >= 2.8.12, no SIMD/asm) but functionally inert - no riscv64 NVIDIA CUDA/NVML driver exists to link/hook against |

## 5. Build System, Cross-Compilation, and Toolchain

**Main repo (`Project-HAMi/HAMi`):** pure Go, built via `make build` (`go build` per `cmd/*`), no top-level `CMakeLists.txt`. `Makefile.defs` sets `TARGETARCH ?= amd64` as the only default; `version.mk` pins `TARGET_PLATFORMS=linux/amd64`. Dockerfiles (`docker/Dockerfile`, `Dockerfile.hamimaster`, `Dockerfile.withlib`, `Dockerfile.hamicore`, `Dockerfile.no-core-test`) build the Go binaries from `golang:1.27.0-bookworm` and the GPU-hooking library from `nvidia/cuda:13.3.0-cudnn-devel-ubi8` / `nvidia/cuda:13.3.1-base-ubuntu22.04`. No `Dockerfile.riscv64` exists (`search_code "filename:Dockerfile riscv64 repo:Project-HAMi/HAMi"` -> 0 results). No `.cmake` toolchain files exist anywhere in either repo. No QEMU usage was found in any Makefile, Dockerfile, or CI config in either repo.

**HAMi-core (`Project-HAMi/HAMi-core`, submodule `libvgpu`):** the actual CMake project (`cmake_minimum_required (VERSION 2.8.12)`). `CMakeLists.txt` hard-codes `CUDA_HOME` (default `/usr/local/cuda`) and links `-lcuda -lnvidia-ml`; `src/CMakeLists.txt` builds `libvgpu.so` against the same libraries. `build.sh` runs plain `cmake .. <options> && make -j$J` with feature flags (`DLSYM_HOOK_ENABLE`, `MULTIPROCESS_LIMIT_ENABLE`, `HOOK_MEMINFO_ENABLE`, `HOOK_NVML_ENABLE`, `CMAKE_BUILD_TYPE`) - none architecture-related, and no `-DUSE_*=OFF` flag exists for disabling components by architecture.

No exact riscv64 build commands, toolchain minimums, or documented QEMU/cross-compilation path exist because none has ever been written. Since HAMi-core's CMake build requires linking `-lcuda -lnvidia-ml` against a CUDA toolkit that does not exist for riscv64, attempting the build on riscv64 would fail at the link stage regardless of compiler used, even though the C source itself contains no architecture-specific code.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Scheduler extender / device plugin (Go control plane) | full | full | not built/released; would likely compile but is untested |
| HAMi-core GPU-memory/utilization interception (`libvgpu.so`) | full | full | not built - blocked by absence of riscv64 CUDA/NVML |
| Container images (Docker Hub `projecthami/hami`, `projecthami/hamicore`) | published | published | not published |
| End-to-end test coverage (`call-e2e*.yaml`) | yes | yes | none |

**Functional gap:** total. HAMi cannot run its core GPU-virtualization function on riscv64 at all, because its hard dependency - the NVIDIA CUDA driver and NVML - has no riscv64 build from NVIDIA (proprietary, closed-source; no public target found via GitHub issue search on NVIDIA's own repos). This is an external blocker outside HAMi's own codebase and outside the RISC-V software ecosystem's control.

**Performance gap:** not applicable - no riscv64 build exists to benchmark. No quantitative riscv64 vs arm64/amd64 performance data was found anywhere (project docs, GitHub, RISE, or general web search).

**Security hardening gap:** no riscv64-specific hardening posture exists to evaluate; not applicable in the absence of any build.

**NaN / floating-point semantics:** no relevant issue found; HAMi does not itself perform floating-point compute (that is delegated to CUDA), so this class of bug is not applicable to HAMi's own code.

## 7. CI/CD Infrastructure

No riscv64 CI exists. All 18 files in `.github/workflows/` were read directly (`auto-label-pr.yaml`, `auto-release.yaml`, `call-e2e-mig.yaml`, `call-e2e-upgrade.yaml`, `call-e2e.yaml`, `call-release-helm.yaml`, `call-release-image-hamicore.yaml`, `call-release-image.yaml`, `call-release-notes.yaml`, `call-release-website.yaml`, `ci-image-scanning.yaml`, `ci.yaml`, `codeql-analysis.yml`, `issue-translate.yaml`, `lint-chart.yaml`, `scorecard.yaml`, `stale.yaml`, `test-self-hosted.yaml`), and a full-repo grep for `risc`/`riscv`/`riscv64`/`RISC-V` returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist. Runners used are `ubuntu-latest`, `ubuntu-22.04`, and `self-hosted` (Helm chart testing only, not architecture-related); the e2e matrix (`call-e2e.yaml`, `call-e2e-mig.yaml`) selects GPU **device** type and test type, not CPU architecture. No RISE runner labels or references to `riseproject-dev` appear anywhere.

| Item | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes (`BUILD_PLATFORM: linux/amd64`) | yes (`BUILD_PLATFORM: linux/arm64`) | no |
| CI test | yes | yes | no |
| RISE runner usage | no | no | no |

## 8. Distribution and Release Status

No riscv64 binary or package exists for HAMi through any channel checked:

- **GitHub Releases:** assets for v2.10.0 (2026-08-21) and v2.9.0 (2026-05-19) are `hami-<version>.tgz` (Helm chart), `v<version>.zip`, `v<version>.tar.gz` (source archives only) - no riscv64-named asset. HAMi is distributed as container images built from Dockerfiles (amd64/arm64 only per CI), not architecture-specific release binaries.
- **PyPI:** `https://pypi.org/pypi/hami/json` -> HTTP 404. No package named "hami" exists (expected - HAMi is a Go/CMake project, not Python-distributed).
- **Ubuntu 26.04 (resolute):** `packages.ubuntu.com` search for "hami" returns only unrelated substring matches (`python3-shamir-mnemonic`, `shamir`); no `hami`/`python3-hami`/`libhami` package exists.
- **Arch Linux RISC-V (archriscv):** `archriscv.felixc.at/?q=hami` -> zero results.
- **Docker Hub** (`projecthami/hami`, `projecthami/hamicore`): no riscv64 platform tag.

To obtain a working HAMi binary today, a user would need to cross-compile the Go control plane themselves (`GOARCH=riscv64 go build`, likely to succeed for the pure-Go components) and separately attempt to build HAMi-core's CMake project against a riscv64 CUDA toolkit - which does not exist, making a functional riscv64 HAMi-core build impossible today regardless of user effort.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Go | build-dependency, critical - compiles HAMi's scheduler/device-plugin/webhook Go control plane | Go's riscv64 backend is mature; HAMi's own Go code is architecture-neutral (no `_riscv64.go` files needed since none exist for any arch) | untested for HAMi specifically - no CI | N/A (toolchain, not shipped) | No blocking issues found |
| CUDA (NVIDIA CUDA driver / NVML) | runtime-dependency, critical - the actual hardware interface HAMi-core hooks via `-lcuda -lnvidia-ml` | N/A - proprietary, closed-source, no riscv64 build exists from NVIDIA | N/A | not released for riscv64 | **Hard blocker.** GPU virtualization is HAMi's entire purpose; no public riscv64 CUDA Toolkit/driver/NVML target found via issue search on NVIDIA's own repos |
| CMake | build-dependency, critical - builds HAMi-core's `libvgpu.so` (`cmake_minimum_required (VERSION 2.8.12)`) | CMake itself is portable to riscv64; the blocker is the CUDA link dependency, not CMake | N/A | N/A (build tool) | No riscv64-specific CMake issue found for this project |
| golang.org/x/sys | build-dependency, optional - low-level Go syscall bindings, recently bumped 0.47.0 -> 0.48.0 in [PR #2984](https://github.com/Project-HAMi/HAMi/pull/2984) | builds on riscv64 (Go's mature riscv64 syscall table); note the changelog for this exact bump incidentally references a "riscv64 hwprobe drift test" upstream, unrelated to HAMi | untested for HAMi specifically | N/A (Go module) | Routine dependency; no riscv64 issue against the module itself found |
| HAMi-core | build-dependency, critical - the native C library (`libvgpu.so`) implementing CUDA/NVML API interception for GPU memory/utilization limiting | plain C, CMake-based, no SIMD/asm - would plausibly compile for riscv64 in isolation | no CI evidence for any non-amd64/arm64 target; `search_issues riscv64 repo:Project-HAMi/HAMi-core` -> 0 results | not released for riscv64 | Blocked entirely by the CUDA dependency above, not by its own code |
| Docker | build-dependency, optional - used for containerized builds/releases via `docker buildx` multi-platform images | Docker/buildx itself supports riscv64 targets in general, but HAMi's own `BUILD_PLATFORM` is set to `linux/arm64,linux/amd64` only | N/A | HAMi does not publish riscv64 container images | Project-level configuration choice, not a Docker limitation |

Additional indirect dependencies identified via `go.mod` (all pure Go, architecture-neutral, no riscv64-specific issues found for any): `github.com/NVIDIA/go-nvml` (dlopen-based NVML bindings, likely builds but functionally inert without a driver), `github.com/NVIDIA/go-gpuallocator`, `github.com/NVIDIA/k8s-device-plugin`, `github.com/NVIDIA/nvidia-container-toolkit`, `github.com/opencontainers/cgroups`, `github.com/opencontainers/runc` (not a go.mod dependency but the assumed OCI runtime; riscv64 functionally works upstream per [opencontainers/runc#5166](https://github.com/opencontainers/runc)), `github.com/moby/sys/capability` and `github.com/moby/sys/devices`, `google.golang.org/grpc`, the `k8s.io/*` and `sigs.k8s.io/controller-runtime` Kubernetes client libraries, `github.com/prometheus/client_golang`, and general Go plumbing (`sirupsen/logrus`, `spf13/cobra`/`pflag`, `google/uuid`, `fsnotify/fsnotify`, `gopkg.in/yaml.v2`/`v3`). All of these are pure Go or dlopen-pattern bindings and are expected to build on riscv64; none carries a hard riscv64 blocker of its own. The single hard blocker in the entire dependency graph is the proprietary NVIDIA CUDA/NVML stack.

## 11. Known Bugs and Active Issues

No riscv64-related issues, PRs, or bugs exist in the tracker.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 tracking issue, correctness bug, or feature request exists | N/A | N/A | Confirmed via exhaustive issue/PR/commit/code search across all spelling variants (`riscv`, `riscv64`, `RISC-V`, `risc-v`) |

No correctness bugs, no performance bugs, and no benchmark data exist for HAMi on RISC-V, because no riscv64 build has ever been produced to test.

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. No maintainer has commented for or against a riscv64 port; the topic has never been raised in an issue, PR, or discussion.
- **Technical blocker (hard, external):** NVIDIA's CUDA driver and NVML have no riscv64 build. This is the dominant blocker and sits entirely outside HAMi's own codebase and outside the RISC-V ecosystem's control - HAMi-core's `libvgpu.so` cannot function without it regardless of how well HAMi's own C/Go code ports.
- **Technical blocker (soft, addressable):** absence of a riscv64 entry in the CI `BUILD_PLATFORM` matrix and `version.mk` `TARGET_PLATFORMS` means even the architecture-neutral Go control plane is neither built nor tested on riscv64 today, despite likely compiling cleanly.
- **Organizational blocker:** none identified beyond the CUDA dependency. CONTRIBUTING.md describes an open, case-by-case review process (fork -> PR -> maintainer review, with a hardware-validation gate for allocation/isolation-touching changes) with no precedent, positive or negative, for a CPU-architecture port.
- **Acceptance probability:** low-to-moderate for the Go control plane alone (mechanically straightforward - add `linux/riscv64` to the build matrix, cross-compile, run scheduler/webhook unit tests), but effectively zero for the project's actual purpose (GPU virtualization) until NVIDIA ships riscv64 CUDA/NVML support, which is outside HAMi's or RISE's control.

## 13. Readiness Assessment

- **Color:** orange (plain "no upstream CI, no distro availability" - the taxonomy's `downstream-only` and `optimization-absent` orange subtypes do not apply since no distro ships HAMi at all and HAMi is not an optimization-purpose project)
- **Release provider:** none
- HAMi is not an optimization-purpose project under the skill's test: if it ran on riscv64 using only generic Go/C code with no architecture-specific optimizations, it would still deliver its full value proposition (Kubernetes GPU scheduling and virtualization), because that value comes from control-plane logic and CUDA delegation, not from CPU-ISA-specific hot paths. The Step 2 optimization modifier therefore does not apply (`optimization_gap: N/A`).
- **Justification:** Zero riscv64 references exist anywhere in `Project-HAMi/HAMi` - confirmed by reading all 18 GitHub Actions workflow files (build matrix is `BUILD_PLATFORM: linux/arm64,linux/amd64` only in [ci.yaml](https://github.com/Project-HAMi/HAMi), [call-release-image.yaml](https://github.com/Project-HAMi/HAMi), [call-release-image-hamicore.yaml](https://github.com/Project-HAMi/HAMi)) and by exhaustive issue/PR/commit/code search. No riscv64 release artifact exists on GitHub Releases, PyPI, Ubuntu 26.04 resolute, or Arch Linux RISC-V. This places HAMi at "no upstream CI" per the color model's Step 1 table, and no distribution floor applies because no distro package exists to floor up from. Independently, the project's hard dependency (NVIDIA CUDA/NVML) has no riscv64 target at all, meaning even a hypothetical HAMi port could not deliver its core function on riscv64 today.
- **Pending work that could change the grade:** none identified. No open PR proposes riscv64 CI or build-matrix changes; no RISE involvement exists (riseproject.dev does not list HAMi as a member project, and no RISE blog post, runner usage, or funded work ties the two together - confirmed via direct site fetch and search). The only near-term lever available to HAMi maintainers is adding `linux/riscv64` to the Go-only build/test matrix (which would likely succeed and could move the Go control plane to blue/green independent of HAMi-core), but this has not been proposed or discussed anywhere in the tracked history.

## 14. Investment Analysis

RISE has done no work on HAMi: it is not a RISE member project, has no RISE blog coverage, no RISE-funded CI runners, and no RISE wheel-builder entry (confirmed via direct fetch of riseproject.dev, its member list, and its Python wheel builder listing). All investment below is therefore unclaimed.

### 14.1 Functional Enablement

The Go control plane (scheduler extender, device plugin, webhook, monitor) is pure Go with no architecture-specific code for any platform and would very likely cross-compile for riscv64 with minimal effort: add `linux/riscv64` to `BUILD_PLATFORM` in `ci.yaml`/`call-release-image*.yaml` and `TARGET_PLATFORMS` in `version.mk`, then validate `go build`/`go test` pass. HAMi-core (`libvgpu.so`) would plausibly compile as plain C via CMake, but delivers zero functional value on riscv64 until NVIDIA ships a riscv64 CUDA driver/NVML - a dependency entirely outside this project's or RISE's control. Functional enablement work should therefore be scoped to the Go control plane only; HAMi-core enablement is blocked and not actionable today.

### 14.2 Performance Optimization

Not applicable. HAMi is not an optimization-purpose project (Section 13); no CPU-ISA-specific hot paths exist to optimize, and its actual GPU compute is delegated entirely to CUDA.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `ci.yaml` (build + unit test of the Go control plane only, since e2e tests require live GPU devices unrelated to CPU architecture) is a small, well-scoped change. Extending to `call-release-image.yaml`/`call-release-image-hamicore.yaml` for container image publishing would additionally require a riscv64-capable builder (native or QEMU) and, for HAMi-core specifically, a riscv64 CUDA base image that does not currently exist.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 omitted. HAMi is a standalone Kubernetes device-plugin/scheduler with no dependent package ecosystem (not distributed via PyPI, npm, or Maven; consumed via container image and Helm chart, not as a library).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `linux/riscv64` to Go control-plane build/test in `ci.yaml`; validate `go build`/`go test` pass on riscv64 hardware or emulation | 1-2 | Upstream (Project-HAMi maintainers) or RISE | Medium |
| Functional | HAMi-core (`libvgpu.so`) riscv64 build validation | Blocked - not actionable until NVIDIA ships riscv64 CUDA/NVML | NVIDIA (external, outside HAMi/RISE control) | Low (blocked) |
| CI/CD | Add riscv64 build job to `ci.yaml` for the Go components | 0.5-1 | Upstream or RISE (contributed PR) | Medium |
| CI/CD | Add riscv64 target to `call-release-image.yaml` for Go-only container images (control plane only, not HAMi-core) | 1 | Upstream or RISE | Low |
| Ecosystem | N/A - no dependent package ecosystem | - | - | - |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [Project-HAMi/HAMi repository](https://github.com/Project-HAMi/HAMi)
- [HAMi homepage](https://project-hami.io/)
- [HAMi device-supported documentation](https://project-hami.io/docs/userguide/device-supported)
- [Project-HAMi/HAMi-core repository (libvgpu native library)](https://github.com/Project-HAMi/HAMi-core)
- [Project-HAMi/HAMi-WebUI repository](https://github.com/Project-HAMi/HAMi-WebUI)
- [Project-HAMi/community repository (governance)](https://github.com/Project-HAMi/community)
- [PR #2984 - build(deps): bump golang.org/x/sys from 0.47.0 to 0.48.0](https://github.com/Project-HAMi/HAMi/pull/2984)
- [HAMi GitHub Releases](https://github.com/Project-HAMi/HAMi/releases)
- [PyPI package lookup for "hami" (404, no package exists)](https://pypi.org/pypi/hami/json)
- [Ubuntu packages.ubuntu.com search for "HAMi" in resolute](https://packages.ubuntu.com/search?keywords=HAMi&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search for "hami"](https://archriscv.felixc.at/?q=hami)
- [RISE project homepage](https://riseproject.dev/)
- [RISE project members](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [opencontainers/runc issue #5166 - Add linux/riscv64 to CI and release artifacts](https://github.com/opencontainers/runc)
- [Docker Hub - projecthami/hami](https://hub.docker.com/r/projecthami/hami)
- [Docker Hub - projecthami/hamicore](https://hub.docker.com/r/projecthami/hamicore)
