---
title: Kmesh
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: cilium/ebpf
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: build-dependency
    criticality: optional
  - name: Istio
    relation: test-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: build-dependency
    criticality: optional
---

# Kmesh

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kmesh<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="kmesh" %}

## 1. Project Overview

Kmesh ([kmesh-net/kmesh](https://github.com/kmesh-net/kmesh), [kmesh.net](https://kmesh.net/)) is a CNCF Sandbox project (accepted October 17, 2024) providing an eBPF-based, kernel-programmable service mesh data plane. It reduces service-to-service network hops from 3 (sidecar mesh) to 1 by moving L3-L7 traffic handling into the kernel via eBPF, with an optional "waypoint" mode that hands off L7/mTLS work to a companion Envoy process. It is a Go control plane over a C eBPF data plane, licensed Apache 2.0, and run under Linux Foundation ("LF Projects, LLC") policies as a CNCF Sandbox-tier project.

Governance follows a four-tier contributor ladder documented at [kmesh.net/docs/community/membership](https://kmesh.net/docs/community/membership/): Member (2 approver sponsors, 2FA, active participation) -> Reviewer (>=1 month as Member, 5+ PRs as primary reviewer, 10+ merged substantial PRs) -> Approver (2 maintainer sponsors, >=2 months as Member, package write access) -> Maintainer (2 owner sponsors, >=2 months as Approver, project-owner nomination, top-level write access, listed in `MAINTAINERS.md`). The membership document itself notes a "formal review process for these roles" is still being established, consistent with a Sandbox-stage, maintainer-led project.

Corporate sponsorship is concentrated: the project site lists HuaweiCloud and openEuler as supporters, and `MAINTAINERS.md` lists 7 current maintainers, all Huawei-affiliated (Kevin Wang, Changye Wu, Zhonghu Xu, Songyang Xie, Xin Liu, Zhencheng Lee, Zengzeng Yao). Commit-volume leaders corroborate this: Zhonghu Xu (410 commits), LiZhenCheng9527 (293), YaoZengzeng (161), wuchangye (153), huangliming (144), superCharge-xsy (~79 combined), bitcoffee (33), all @huawei.com, plus `openeuler-ci-bot` and `kmesh-bot` automation. No other company is represented in the maintainer or approver tier. Kmesh is, in practice, a Huawei-led CNCF Sandbox project.

No explicit community statement (positive or negative) on RISC-V or new-architecture ports was found. `CONTRIBUTING.md` is generically welcoming to new contributions but contains no stated architecture policy; a riscv64 port simply has never been proposed or discussed.

## 2. Port History and Upstreaming Timeline

Data not available: no riscv64 port has ever been initiated for Kmesh. Exhaustive GitHub search across issues, pull requests, commits, and code (`search_issues`, `search_pull_requests`, `search_commits`, `search_code` for `riscv`, `riscv64`, and `"RISC-V"` against `kmesh-net/kmesh`) returned zero genuine results. The only "riscv64" string hits in the entire repository (20 occurrences) are an identical, auto-generated Go build-constraint comment emitted by the `bpf2go` code generator in `bpf/kmesh/bpf2go/**/*_bpfel.go`:

```go
//go:build 386 || amd64 || arm || arm64 || loong64 || mips64le || mipsle || ppc64le || riscv64
```

This is boilerplate from the upstream `cilium/ebpf` codegen tool (a generic little-endian architecture list), not evidence of deliberate RISC-V work. There is no milestone table to report, no key contributors to credit, and no "fully upstream" question to answer because there is no port, in-tree or out-of-tree, to evaluate.

## 3. Upstream Support Tier

Kmesh's contributor-role tier policy (Section 1) governs individual contributor privileges, not per-architecture support commitments; no separate architecture-tier policy exists.

Evidence for the riscv64 tier assignment:
- **CI:** all 14 workflow files under `.github/workflows/` were read directly. None contains a riscv64 job of any kind.
- **Release-blocking:** not applicable, since no riscv64 job exists to gate a release.
- **Official binaries:** GitHub Releases for v1.2.0 and v1.1.0 ([expanded asset list](https://github.com/kmesh-net/kmesh/releases/expanded_assets/v1.2.0)) publish only `kmeshctl-linux-amd64` and `kmeshctl-linux-arm64` plus source tarballs and a Helm chart. No riscv64 asset has ever been published.
- **Packaging:** [`kmesh.spec`](https://github.com/kmesh-net/kmesh/blob/main/kmesh.spec) line 23 reads `ExclusiveArch: x86_64 aarch64`, explicitly excluding riscv64 from RPM builds.

| | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI build | yes, native (`main.yml`) | yes, via QEMU in Docker multi-arch jobs | no |
| CI test | yes, native | no dedicated native test job found; relies on cross-build only for the Docker image path | no |
| Release binary (`kmeshctl`) | yes | yes | no |
| Multi-arch Docker image | yes | yes (QEMU-emulated) | no |
| RPM packaging (`kmesh.spec`) | yes | yes | explicitly excluded (`ExclusiveArch`) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kmesh contains no hand-tuned, per-architecture source code of its own for any architecture. It is a pure Go userspace daemon/CLI plus C eBPF programs compiled to BPF bytecode via clang/LLVM; the only genuinely architecture-specific component in the whole stack is the Linux kernel's in-kernel eBPF JIT, which is kernel code, not Kmesh code. Confirmed by direct repository inspection: no `arch/riscv`, `arch/arm64`, or `arch/amd64` directories exist; no `.S` assembly files exist anywhere; no RVV/Zba/Zbb intrinsics exist; a grep for `__x86_64__|__aarch64__|__riscv|__arm__|GOARCH` across all hand-written `.c`/`.h` files (excluding bpf2go-generated output) returns zero matches.

The one place Kmesh's own build tooling is architecture-conditional is `kmesh_compile_env_pre.sh`'s `kmesh_set_env()`:

```bash
function kmesh_set_env() {
	if [ "$(arch)" == "x86_64" ]; then
		export EXTRA_CDEFINE="-D__x86_64__"
		export C_INCLUDE_PATH=/usr/include/x86_64-linux-gnu:$C_INCLUDE_PATH
	fi
	if [ "$(arch)" == "aarch64" ]; then
		export C_INCLUDE_PATH=/usr/include/aarch64-linux-gnu:$C_INCLUDE_PATH
	fi
	export EXTRA_GOFLAGS='-gcflags="-N -l" -buildmode=pie'
	export EXTRA_CFLAGS="-O0 -g"
}
```

riscv64 has no branch here. Combined with `mk/bpf.vars.mk`'s unconditional default `EXTRA_CDEFINE ?= -D__x86_64__`, a riscv64 build attempted today would silently compile eBPF C code with an incorrect `-D__x86_64__` define unless a user manually overrides it - a concrete, code-level correctness risk, not merely an absence of testing.

The kernel-side dependency that actually executes Kmesh's compiled eBPF bytecode, the riscv64 in-kernel BPF JIT (`arch/riscv/net/bpf_jit_comp64.c`), is mature (RV64G eBPF JIT landed circa 2019, per [LWN #776779](https://lwn.net/Articles/776779/)) and is outside Kmesh's own code.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| eBPF C programs (compiled via clang/LLVM) | generic, no arch-specific code needed | generic, no arch-specific code needed | generic C compiles, but inherits wrong `-D__x86_64__` define by default (no arch branch in build script) |
| Go daemon/CLI | generic Go, no asm | generic Go, no asm | generic Go, no asm (Go's own riscv64 port covers this) |
| In-kernel BPF JIT (kernel dependency, not Kmesh code) | mature | mature | mature since ~2019, [LWN #776779](https://lwn.net/Articles/776779/) |
| RPM packaging | included (`kmesh.spec`) | included (`kmesh.spec`) | explicitly excluded (`ExclusiveArch: x86_64 aarch64`) |

## 5. Build System, Cross-Compilation, and Toolchain

Kmesh does not use CMake for its main build. The root of the repository has no `CMakeLists.txt`; the only `CMakeLists.txt` files in the tree belong to the unrelated `oncn-mda/` sub-component and contain no riscv references. The build system is a plain `Makefile` plus shell scripts (`build.sh`, `kmesh_compile.sh`, `kmesh_compile_env.sh`, `kmesh_compile_env_pre.sh`).

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` file exists anywhere in the repository (checked directly against the cloned tree, commit `ec501a9`). There is exactly one Dockerfile in the project (`build/docker/dockerfile`, `FROM openeuler/openeuler:23.09`), with no per-architecture build stage and no riscv64 variant; a code search for `riscv64 filename:Dockerfile repo:kmesh-net/kmesh` returned zero results.

QEMU is used in CI (`docker/setup-qemu-action@v3` in `release-master.yaml` and `push-builder-image.yml`) exclusively to emulate `linux/arm64` for multi-arch Docker builds; it is never invoked for `linux/riscv64` anywhere in the repository, and QEMU is not mentioned in any build documentation.

Toolchain requirements found: clang (pinned via `CLANG ?= clang` in `mk/bpf.vars.mk`) to compile eBPF C programs to BPF bytecode, and Go 1.24.2 (per `go.mod`, `module kmesh.net/kmesh`) to build the daemon/CLI/CNI-plugin. No riscv64-specific minimum-version rationale is documented, because no riscv64 build path exists.

**Known build failures on riscv64:** none are documented, because a riscv64 build has never been attempted or reported. The structural gap identified in Section 4 (missing riscv64 branch in `kmesh_set_env()`, unconditional `-D__x86_64__` default) would need to be fixed before a correct native build could even be attempted.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel-native mode (eBPF only, no Envoy) | supported | supported | not built, not tested; kernel eBPF JIT for riscv64 is mature, so this is the more plausible near-term path |
| Waypoint mode (L7/mTLS via Envoy companion) | supported | supported | blocked: Envoy has no riscv64 port upstream at all (see Section 9) |
| Release binary (`kmeshctl`) | yes | yes | no |
| Multi-arch container image | yes | yes | no |
| RPM package | yes | yes | explicitly excluded |

**Functional gaps:** the most severe gap is not in Kmesh itself but in its waypoint-mode companion, Envoy, which per `project-reports/envoy.md` has "zero riscv64-specific commits ever landed in envoyproxy/envoy" - the port does not exist upstream. This blocks any full-featured (L7/mTLS) Kmesh deployment on riscv64 regardless of what work is done on Kmesh's own build scripts. Kernel-native mode (no Envoy) is comparatively closer to viable, since the kernel eBPF JIT for riscv64 is mature and the eBPF C/Go layers are architecture-generic apart from the build-script gap noted in Section 4.

**Performance gaps:** Data not available. No quantitative benchmark comparing Kmesh on riscv64 vs. arm64 or amd64 exists anywhere searched (Kmesh org pages, kmesh.net, GitHub, riseproject.dev, general web search). Kmesh's own published performance testing (Fortio-based, sidecar-vs-Kmesh comparisons per kmesh.net) is not broken out by architecture at all.

**Security hardening gaps:** Data not available: no research was directed at riscv64-specific hardening (e.g., CFI, stack protector behavior) for Kmesh, and no such data was found incidentally.

**NaN / floating-point semantics:** not applicable. Kmesh is a control-plane/data-plane networking project with no floating-point-sensitive numeric computation in its own code.

## 7. CI/CD Infrastructure

No riscv64 CI exists. All 14 workflow files were read directly, not inferred from search results:

| File | Purpose | Runner | Arch matrix | riscv64? |
|---|---|---|---|---|
| `main.yml` | build, test, lint, eBPF unit tests | `ubuntu-22.04` | none (single job) | no |
| `e2e-istio-1.26/1.27/1.28.yml` | Istio e2e tests | `ubuntu-22.04` | none | no |
| `e2e-ipv6-istio-1.26/1.27/1.28.yml` | Istio IPv6 e2e tests | `ubuntu-22.04` | none | no |
| `release.yml` | `kmeshctl` binary release | `ubuntu-latest` | `arch: [amd64, arm64]` | no |
| `release-master.yaml` | main container image, multi-arch via QEMU+Buildx | `ubuntu-latest` | `platform: [linux/amd64, linux/arm64]` | no (QEMU used only for arm64) |
| `push-builder-image.yml` | builder container image, multi-arch via QEMU+Buildx | `ubuntu-latest` | `platform: [linux/amd64, linux/arm64]` | no (QEMU used only for arm64) |
| `markdownlint.yml`, `code-spell.yml`, `chinese-grammar-check.yml`, `sync-kmeshctl-docs.yml` | lint/docs | `ubuntu-latest` | none | no |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository (confirmed absent by direct listing).

**RISE runners:** not used. Kmesh is not a RISE member or RISE-affiliated project (see Section 12); no reference to `riseproject-dev` or a RISE runner label appears anywhere in the workflow files.

**Hardware:** exclusively GitHub-hosted `ubuntu-latest`/`ubuntu-22.04` x86_64 runners. No self-hosted runner and no dedicated riscv64 runner exists for this project.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | native | QEMU-emulated (Docker image jobs only) | none |
| CI test | native | none found | none |
| Release-blocking | yes (`main.yml`) | no dedicated test gate | N/A |

## 8. Distribution and Release Status

No official riscv64 binaries exist for Kmesh through any channel checked:

- **GitHub Releases:** v1.2.0 and v1.1.0 (representative of the checked set, which also includes v1.2.0-rc.0, v1.0.0, v1.0.0-rc.0, v1.0.0-alpha, v0.5.0, v0.5.0-rc.0, v0.4.1, v1.1.0-alpha) each ship only `kmeshctl-linux-amd64`, `kmeshctl-linux-arm64`, a Helm chart, and source archives. See [v1.2.0 expanded assets](https://github.com/kmesh-net/kmesh/releases/expanded_assets/v1.2.0).
- **PyPI:** no package named `kmesh` exists. [`pypi.org/pypi/kmesh/json`](https://pypi.org/pypi/kmesh/json) and [`pypi.org/simple/kmesh/`](https://pypi.org/simple/kmesh/) both return HTTP 404. Not applicable: Kmesh is a Go/eBPF project, not distributed via PyPI.
- **RISE Python wheel builder:** no entry (consistent with PyPI absence; Kmesh is not a Python project). See [RISE wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/).
- **Ubuntu 26.04 (Resolute):** package does not exist for any architecture. [`packages.ubuntu.com` search](https://packages.ubuntu.com/search?keywords=Kmesh&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results."
- **Arch Linux RISC-V (archriscv):** no package. [`archriscv.felixc.at` search](https://archriscv.felixc.at/?q=kmesh) returns "No match found."
- **RPM packaging:** [`kmesh.spec`](https://github.com/kmesh-net/kmesh/blob/main/kmesh.spec) explicitly declares `ExclusiveArch: x86_64 aarch64`, so even a from-source RPM build on riscv64 would be refused by `rpmbuild` as currently written.

**What a user must do to get a working riscv64 binary today:** there is no official or distro path. A user would need to (1) add a riscv64 branch to `kmesh_set_env()` in `kmesh_compile_env_pre.sh` and fix the unconditional `-D__x86_64__` default in `mk/bpf.vars.mk`, (2) attempt a from-source build with Go 1.24.2 and clang/LLVM targeting riscv64 BPF codegen, (3) remove or extend the `ExclusiveArch` line in `kmesh.spec` if RPM packaging is desired, and (4) accept that waypoint/L7 mode remains unavailable because Envoy has no riscv64 port (Section 9).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / community |
|---|---|---|---|---|---|
| Go | build-dependency, critical | yes, GA since Go 1.14 (2020) | yes, but riscv64 is a "secondary port" - "a broken riscv64 build does not require a release rollback or delay" per `project-reports/go.md` | yes, official binary releases include riscv64 | color green per `project-reports/go.md`; 546 open riscv64-tagged issues repo-wide, mostly CI-builder flakiness (e.g. #79067-79069) |
| cilium/ebpf | build-dependency, critical | yes, pure Go, no cgo required for core paths, inherits Go's riscv64 port | no dedicated riscv64 CI confirmed; `search_issues` for riscv64 found only unrelated arm64 CI issues (#1460, #266) | ships wherever Go builds (library, no standalone binary) | no dedicated `project-reports` entry with riscv64 detail found |
| LLVM | build-dependency, critical | yes, packaged for Ubuntu 26.04 riscv64 resolute (`clang` 1:21.1.6-71, `llvm` 1:21.1.6-71) | riscv64 backend rated "Complete" across codegen/compiler-rt/LLDB per `project-reports/llvm.md`, mainline since 2016 | ships in official LLVM/Ubuntu releases | color yellow per `project-reports/llvm.md` (gap is elsewhere, e.g. libpfm4/llvm-exegesis PMU path, not core BPF codegen) |
| Linux kernel | runtime-dependency, critical | mature RV64G eBPF JIT since ~2019, [LWN #776779](https://lwn.net/Articles/776779/) | "functional but has known gaps" per `project-reports/libbpf.md` section 11 | ships in mainline kernel | not a standalone `projects.yml` entry in this research; treat as inherited kernel-version risk |
| Docker | build-dependency, critical | Data not available: Docker Engine/Buildx riscv64 package status was not directly checked in this research | N/A within Kmesh's own workflows | N/A | Kmesh's own Docker workflows (`release-master.yaml`, `push-builder-image.yml`) build images only for `linux/amd64` and `linux/arm64`; `linux/riscv64` is never in the platform matrix |
| QEMU | build-dependency, optional | QEMU generally supports riscv64 emulation, but Kmesh's CI usage (`docker/setup-qemu-action@v3`) is scoped only to emulate `linux/arm64`, confirmed by direct read of `release-master.yaml` and `push-builder-image.yml` | not exercised for riscv64 in Kmesh CI | N/A | Kmesh does not exercise QEMU's riscv64 emulation path at all today |
| Istio | test-dependency, critical | Data not available: Istio's own riscv64 build/test/release status was not directly researched in this pass [NEEDS VERIFICATION] | Kmesh's e2e-istio workflows (`e2e-istio-1.26/1.27/1.28.yml`, `e2e-ipv6-istio-*.yml`) run only on `ubuntu-22.04` x86_64 runners with no arch matrix, so Istio is never exercised against a riscv64 Kmesh in CI regardless of Istio's own architecture support | N/A | |
| golang.org/x/sys | build-dependency, optional | yes, pure Go module, part of the Go project's extended standard library, inherits Go's riscv64 support | rides on Go toolchain | rides on Go toolchain | subject of Dependabot PR [#1471](https://github.com/kmesh-net/kmesh/pull/1471) (merged, bumping 0.32.0 -> 0.34.0); its changelog body listing "riscv64" among release-artifact platforms is the source of several false-positive search hits during this research, not evidence of riscv64-specific work in Kmesh |

**Additional indirect/recursed dependencies found:**

| Dependency | Role | riscv64 status |
|---|---|---|
| libbpf | loads/verifies BPF progs and maps (C ABI/header reference, required build dep) | packaged for Ubuntu 26.04 riscv64 (`libbpf-dev` 1:1.6.3-1ubuntu1); "complete source-level support, equivalent to arm64 in code coverage, but no upstream CI of any kind" per `project-reports/libbpf.md` (color yellow) |
| bpftool | BPF prog/map inspection, required build dep | packaged for Ubuntu 26.04 riscv64 (`bpftool` 7.7.0+7.0.0-14.14); no dedicated CI found |
| protobuf-c / Protocol Buffers | serializes Kmesh's internal config (BPF map values) | packaged for Ubuntu 26.04 riscv64 (`protobuf-c-compiler` 1.5.1-1ubuntu2, universe); zero riscv64 issues found on `protobuf-c/protobuf-c` |
| gRPC (as consumed: `google.golang.org/grpc` v1.70.0, "grpc-go") | xDS transport to istiod/waypoint control plane | pure Go, rides on Go's riscv64 port. Note: the tracked C++ `grpc/grpc` project (`project-reports/grpc.md`, color yellow) has real riscv64 breakage history (SIGILL via stale abseil-cpp `RDCYCLE` code, issue #37791; open PyPI wheel request #41591) but this is a different codebase from grpc-go and NOT applicable to Kmesh's actual dependency - flagged only to avoid false-positive reuse of that report |
| klauspost/compress (indirect, via `prometheus/client_golang`) | response/metrics compression | pure Go with amd64-only asm fast paths; generic Go fallback covers riscv64; only 1 related issue found and it is an arm64 timeout (#532), not riscv64 |
| libboundscheck (`openeuler-mirror/libboundscheck`) | optional bounds-checked C stdlib replacement, source-built by `kmesh_compile_env_pre.sh` if not preinstalled | not an Ubuntu package (openEuler-only channel); no CI signal found; genuinely untested on riscv64, though Kmesh already has a source-build fallback path for it |
| Kubernetes client-go / apimachinery | watches Pods/Services/Gateway-API | client libraries build fine on riscv64 (pure Go); real risk is the runtime deployment target: per `project-reports/kubernetes.md` (color orange), "no upstream PR for riscv64 architecture support has ever been merged" for Kubernetes itself (4 attempts 2019-2024, all closed for lack of CI); distroless riscv64 base images only merged February 27, 2026 |
| Envoy (external companion process, waypoint/L7 mode) | mTLS/L7 termination in waypoint deployments | per `project-reports/envoy.md` (color orange): "zero riscv64-specific commits have ever landed in envoyproxy/envoy - the port does not exist upstream." This is the single most severe blocker for any full-featured Kmesh riscv64 deployment |
| Prometheus (companion, via `client_golang` and Kmesh's metrics exporter) | metrics scraping | binary tarballs since v2.46.0 (July 2023); Docker images since v3.10.0 (February 2026), after fixing quay.io/distroless riscv64 gaps; color yellow per `project-reports/prometheus.md` |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | no riscv64-tagged issue or PR exists | N/A | N/A | 0 results across `search_issues`/`search_pull_requests` for `riscv`, `riscv64`, `"RISC-V"` against `kmesh-net/kmesh` |
| [#1053](https://github.com/kmesh-net/kmesh/issues/1053) | Encounter crash using the latest version of Kmesh | closed 2024-11-19 | not RISC-V-related | x86_64 bpf-verifier "invalid indirect read from stack" crash on Alibaba Cloud ACK; surfaced only as a loose semantic-search match, included for completeness |
| [#1050](https://github.com/kmesh-net/kmesh/issues/1050) | Sockops bpf prog failed to be loaded in Ubuntu enhanced kernel env | closed 2024-11-20 | not RISC-V-related | x86_64/Ubuntu verifier issue; surfaced only as a loose semantic-search match, included for completeness |

No riscv64-specific correctness or performance bug has ever been filed against Kmesh.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer statement, issue, or discussion thread expresses a position, for or against, on a riscv64 port.

**Technical blockers:**
1. `kmesh_set_env()` in `kmesh_compile_env_pre.sh` has no riscv64 branch; combined with the unconditional `EXTRA_CDEFINE ?= -D__x86_64__` default in `mk/bpf.vars.mk`, a riscv64 build would compile with an incorrect architecture define unless manually overridden (Section 4).
2. `kmesh.spec` declares `ExclusiveArch: x86_64 aarch64`, which blocks RPM packaging for riscv64 outright ([source](https://github.com/kmesh-net/kmesh/blob/main/kmesh.spec)).
3. CI matrices in `release.yml`, `release-master.yaml`, and `push-builder-image.yml` are hardcoded to `[amd64, arm64]`, with no riscv64 entry to extend.
4. Waypoint/L7 mode depends on Envoy, which has no riscv64 port upstream at all (`project-reports/envoy.md`) - this is an external blocker outside Kmesh's own control.

**Organizational blockers:** the maintainer team is entirely Huawei-affiliated (7/7 maintainers, Section 1); no RISC-V silicon vendor or RISE member organization is represented among Kmesh's maintainers, approvers, or top contributors. No user or organization has ever filed a riscv64 request against the project.

**RISE involvement:** none. Kmesh does not appear on the [RISE members list](https://riseproject.dev/members/) (Premier or General tier), has no mention in the [RISE blog](https://riseproject.dev/blog), and is absent from all 25 repositories in the `riseproject-dev` GitHub organization.

**Acceptance probability:** Data not available. Since no riscv64 PR has ever been proposed, there is no direct evidence of how maintainers would respond. `CONTRIBUTING.md`'s generic openness to contributions and the absence of any negative precedent suggest a well-formed PR would likely be reviewed on technical merit, but this is inference rather than evidence. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No upstream riscv64 CI exists anywhere in Kmesh: all 14 GitHub Actions workflow files were read directly and none builds, tests, or releases for riscv64 ([`.github/workflows/`](https://github.com/kmesh-net/kmesh/tree/main/.github/workflows)); `kmesh.spec` explicitly excludes riscv64 from RPM packaging (`ExclusiveArch: x86_64 aarch64`, [source](https://github.com/kmesh-net/kmesh/blob/main/kmesh.spec)); and no Linux distribution ships a Kmesh package for any architecture, let alone riscv64 (confirmed absent from [Ubuntu 26.04 Resolute](https://packages.ubuntu.com/search?keywords=Kmesh&suite=resolute&searchon=names&section=all) and [Arch Linux RISC-V](https://archriscv.felixc.at/?q=kmesh)). This is the base "no upstream CI" orange case per the color model; the distribution floor does not apply because no distro packages the project at all, and the optimization-purpose modifier does not apply because Kmesh is not an optimization-purpose project (it is a service-mesh control/data-plane project with no SIMD, vectorization, or numeric-kernel value proposition; Section 4 confirms it contains no hand-tuned per-architecture code for any architecture).
- **Optimization gap:** N/A (not an optimization-purpose project).
- **Pending work that could change the grade:** none found. No open riscv64 issue or PR exists to track, and no RISE involvement (funded work, RISE runner usage, membership) was found anywhere. A grade change would require someone to first file and land the build-script and CI-matrix changes identified in Section 12.

## 14. Investment Analysis

RISE has not funded or otherwise touched Kmesh in any way (Section 12); none of the work below is already covered by outside investment.

### 14.1 Functional Enablement
- Add a riscv64 branch to `kmesh_set_env()` in `kmesh_compile_env_pre.sh` and correct the unconditional `-D__x86_64__` default in `mk/bpf.vars.mk`.
- Validate eBPF C program compilation via clang/LLVM targeting riscv64 BPF bytecode.
- Validate the `cilium/ebpf` Go loading path against riscv64-compiled BPF objects.
- Bring up and test kernel-native mode (no Envoy) end-to-end on a riscv64 kernel using the mature riscv64 in-kernel BPF JIT.
- Extend or remove the `ExclusiveArch` restriction in `kmesh.spec` once a validated build exists.

### 14.2 Performance Optimization
Not applicable as a distinct investment area: Kmesh has no hand-tuned per-architecture code for any architecture (Section 4), so there is no SIMD/vectorization/numeric gap to close on riscv64 beyond what functional enablement already requires. Not a priority relative to Sections 14.1 and 14.3.

### 14.3 CI/CD Infrastructure
- Add riscv64 to the build/test matrix in `main.yml`.
- Add riscv64 to the `arch` matrix in `release.yml` for `kmeshctl` binary releases.
- Add `linux/riscv64` to the `platform` matrix in `release-master.yaml` and `push-builder-image.yml`, using either QEMU emulation (already present for arm64) or native RISE runner infrastructure ([`riseproject-dev/riscv-runner`](https://riseproject.dev/)), which Kmesh currently does not use at all.

### 14.4 Ecosystem Enablement
Kmesh has no dependent package ecosystem of its own (Section 10 omitted per scope rules: it is a standalone Go/eBPF service, not a language runtime or package registry). The most consequential cross-project ecosystem gap is external to Kmesh: Envoy's absent riscv64 port blocks waypoint/L7 mode entirely (`project-reports/envoy.md`). Closing that gap is an Envoy-upstream investment, not a Kmesh-repo investment, and should be tracked and sized separately.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `kmesh_set_env()` / fix `EXTRA_CDEFINE` default | 1 | TBD | Critical |
| Functional | Validate clang/LLVM eBPF-to-BPF compilation on riscv64 | 1-2 | TBD | Critical |
| Functional | Validate `cilium/ebpf` Go loading path on riscv64-compiled objects | 1 | TBD | Critical |
| Functional | End-to-end kernel-native mode bring-up and test on riscv64 hardware/kernel | 2-3 | TBD | Critical |
| Functional | Extend/remove `kmesh.spec` `ExclusiveArch` restriction | <1 | TBD | High |
| CI/CD | Add riscv64 to `main.yml` build/test matrix | 1 | TBD | High |
| CI/CD | Add riscv64 to `release.yml` binary matrix | <1 | TBD | Medium |
| CI/CD | Add `linux/riscv64` to Docker multi-arch workflows (QEMU or RISE runners) | 1-2 | TBD | Medium |
| Ecosystem (external) | Track Envoy riscv64 upstreaming for waypoint/L7 mode | not sizeable from this repo; external dependency | TBD | High (blocking for full feature parity) |

## 15. Updates
(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [kmesh-net/kmesh repository](https://github.com/kmesh-net/kmesh)
- [Kmesh homepage](https://kmesh.net/)
- [Kmesh community membership policy](https://kmesh.net/docs/community/membership/)
- [kmesh.spec (RPM spec, ExclusiveArch line)](https://github.com/kmesh-net/kmesh/blob/main/kmesh.spec)
- [Kmesh GitHub Releases, v1.2.0 expanded assets](https://github.com/kmesh-net/kmesh/releases/expanded_assets/v1.2.0)
- [PyPI JSON API for "kmesh" (404, no package)](https://pypi.org/pypi/kmesh/json)
- [PyPI simple index for "kmesh" (404, no package)](https://pypi.org/simple/kmesh/)
- [Ubuntu 26.04 Resolute package search for "Kmesh" (no results)](https://packages.ubuntu.com/search?keywords=Kmesh&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search for "kmesh" (no match)](https://archriscv.felixc.at/?q=kmesh)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [RV64G eBPF JIT, LWN.net](https://lwn.net/Articles/776779/)
- [eBPF Core Infrastructure Landscape](https://ebpf.io/infrastructure/)
- [FOSDEM 2026: eBPF Observability on RISC](https://archive.fosdem.org/2026/schedule/event/8SRBCB-ebpf_observability_on_risc_what_works_what_breaks_and_how_to_test_it/)
- [Kmesh issue #1053 (unrelated x86_64 crash, closed)](https://github.com/kmesh-net/kmesh/issues/1053)
- [Kmesh issue #1050 (unrelated x86_64 verifier issue, closed)](https://github.com/kmesh-net/kmesh/issues/1050)
- [Kmesh PR #1471 (golang.org/x/sys bump, merged)](https://github.com/kmesh-net/kmesh/pull/1471)
- Local project reports used as dependency-color priors: `project-reports/go.md`, `project-reports/llvm.md`, `project-reports/libbpf.md`, `project-reports/grpc.md`, `project-reports/prometheus.md`, `project-reports/envoy.md`, `project-reports/kubernetes.md` (paths under `/home/user/sw-ecosystem/project-reports/`)
- Local clone used for direct file inspection: `kmesh-net/kmesh` at commit `ec501a9887b53899ba2760f69740d3d78434d7c8` (`/home/user/kmesh-net/kmesh`)