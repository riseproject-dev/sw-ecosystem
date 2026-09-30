---
title: k0s
parent: Project Reports
color: blue
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: Kubernetes
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: etcd
    relation: runtime-dependency
    criticality: critical
  - name: kine
    relation: runtime-dependency
    criticality: optional
  - name: CoreDNS
    relation: runtime-dependency
    criticality: optional
  - name: kube-router
    relation: runtime-dependency
    criticality: optional
  - name: Calico
    relation: runtime-dependency
    criticality: optional
  - name: Envoy
    relation: runtime-dependency
    criticality: optional
  - name: Helm
    relation: runtime-dependency
    criticality: optional
  - name: keepalived
    relation: runtime-dependency
    criticality: optional
  - name: konnectivity
    relation: runtime-dependency
    criticality: optional
  - name: iptables
    relation: runtime-dependency
    criticality: optional
  - name: sonobuoy
    relation: test-dependency
    criticality: optional
  - name: syft
    relation: test-dependency
    criticality: optional
  - name: troubleshoot
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="k0s" %}

# k0s

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for k0s<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[k0s](https://k0sproject.io/) ([github.com/k0sproject/k0s](https://github.com/k0sproject/k0s)) is a single-binary Kubernetes distribution built for minimal resource consumption and simple deployment. It statically embeds the full Kubernetes control plane (kubelet, kube-apiserver, kube-controller-manager, kube-scheduler, kubectl) together with containerd, runc, etcd, kine, konnectivity, CoreDNS, kube-router, and supporting binaries into one self-contained executable.

k0s is a CNCF Sandbox project (accepted 2025-01-19) under "a Series of LF Projects, LLC," and has since formally applied for CNCF Incubation, per CNCF's ["k0s in 2025" blog post](https://www.cncf.io/blog/2026/01/26/k0s-in-2025-a-year-of-community-growth-governance-and-kubernetes-innovation/). License is Apache 2.0 for code, CC-BY-SA 4.0 for documentation. Governance is informal (GitHub pull requests, no written GOVERNANCE.md); governance and technical-review documents live under `docs/governance/cncf/`, tied to [cncf/sandbox#125](https://github.com/cncf/sandbox/issues/125).

The project is Mirantis-dominated: 5 of 6 active maintainers are Mirantis employees (Jussi Nummelin, Tom Wieczorek, Natanael Copa, Aleksey Makhov, Kimmo Lehto). One seat is held by Ethan Mosbaugh of Replicated, Inc. Mirantis originated k0s and sells commercial support (LabCare 8x5, ProdCare 24x7) and ships k0s inside Mirantis MKE. Replicated builds its "Embedded Cluster" commercial product on top of k0s. `ADOPTERS.md` lists further production users (AudioCodes, DeepSquare, Defense Unicorns, k0smotron, KubeArmor, National Astronomical Observatory of Japan, Progress Chef 360, Splunk, vCluster) but none hold maintainer seats. k0s is not a RISE member organization.

Community stance on new ports is pragmatic and maintainer-driven: the riscv64 work was initiated and carried out by core Mirantis maintainers themselves (not an outside contributor push for the initial build-enablement phase), moving the architecture from "compiles" to "documented supported" to "has CI" over roughly 14 months, with caveats retained throughout (no official release binaries). The CI-enablement phase (PR #7414) was then driven by an external contributor over about ten weeks, with Mirantis maintainer Tom Wieczorek acting as technical gatekeeper.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-07-14 | Feature request filed: "RISC-V support," by jekader. Notes no Kubernetes distro supported riscv64 at the time; containerd/Podman already functional on RISC-V; Debian/Ubuntu/Alpine all shipped riscv64 ports. Still the master tracking issue. | [Issue #1919](https://github.com/k0sproject/k0s/issues/1919) |
| 2024-06-22 | Community member (IngwiePhoenix) attempts `make HOST_ARCH=riscv64 EMBEDDED_BINS_BUILDMODE=none` on a StarFive VisionFive2 board, a year before official enablement work began. Fails with `binutils-gold (no such package)` (Alpine has no riscv64 build of that package). No maintainer response recorded; closed 2024-08-03 as not planned. | [Issue #4665](https://github.com/k0sproject/k0s/issues/4665) |
| 2025-04-30 | First riscv64-enabling code change: commit `c41ae49` "Use proper types on RISC-V" by Tom Wieczorek (Mirantis), "This makes the k0s sources compile on RISC-V." | [commit c41ae49](https://github.com/k0sproject/k0s/commit/c41ae49) |
| 2025-04-30 to 2025-05-01 | PR "Add initial RISC-V support to Makefile" opens and merges. Author: twz123 (Mirantis). Reviewed/approved by ncopa. This is the actual foundational build-system PR; #5803, #5807 and #5848 each describe themselves as fixing gaps left by it. | [PR #5802](https://github.com/k0sproject/k0s/pull/5802) |
| 2025-05-07 | PR "Various Image version bumps for riscv64" merges. Bumps metrics-server, pause, coredns, cni-node to versions that publish riscv64 image variants. Author: ncopa (Mirantis). Merge commit `e4d8fa2e`. | [PR #5803](https://github.com/k0sproject/k0s/pull/5803) |
| 2025-05-08 | PR "Ignore RISC-V Linux airgap image bundle" merges, fixing an oversight left in #5802 (riscv64 airgap bundle entry not ignored in the Makefile). Author: twz123. Merge commit `e70c826e`. | [PR #5807](https://github.com/k0sproject/k0s/pull/5807) |
| 2025-05-20 | PR "Allow riscv64 build" merges. Fixes the embedded Kubernetes build for riscv64 via upstream-referencing patch (citing kubernetes/kubernetes#86011, #116686); skips check-externaletcd and check-byocri on riscv64 (no upstream binaries); reviewer twz123 flags that Envoy/NLLB will not compile for riscv64. Author: ncopa. Merge commit `9ed17923`. | [PR #5848](https://github.com/k0sproject/k0s/pull/5848) |
| 2025-05-21 | #5803, #5807 and #5848 all first ship in release **v1.33.1+k0s.0** (also same-day rc v1.33.1-rc.0). | Release history |
| 2025-06-27 | Duplicate issue "Assessment of the difficulty in porting CPU architecture for k0s" (automated complexity-scoring tool rates the port "Low difficulty," cyclomatic complexity 9026). Closed as duplicate of #1919. | [Issue #6059](https://github.com/k0sproject/k0s/issues/6059) |
| 2025-11-07 to 2025-11-13 | PR "List RISC-V as supported architecture ... with some caveats" merges, promoting riscv64 from build-only to a documented supported target in `docs/system-requirements.md`. | commit `0f43e86` via PR #6615 |
| 2026-03-24 | RISE announces the RISE RISC-V Runners: free, native, bare-metal GitHub Actions CI on Scaleway EM-RV1 hardware. Does not mention k0s by name. | [RISE blog, 2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) |
| 2026-04-09 | PR "ci: Add support for linux-riscv64" opens. Author: luhenry (external contributor). Explicitly framed "currently an experiment." First blocker reported: anchore/syft has no riscv64 build. | [PR #7414](https://github.com/k0sproject/k0s/pull/7414) |
| 2026-04-17 | Dependency PR "Make airgap list-images platform-aware" merges (twz123 requested it as a prerequisite). First ships in v1.36.1+k0s.0 (2026-06-12). Same-day: groundwork commit `1c3aa2f` "[CI] Enable nightly build and tests on ubuntu-24.04-riscv," authored by Ludovic Henry (committed 2026-06-01). | [PR #7459](https://github.com/k0sproject/k0s/pull/7459), [commit 1c3aa2f](https://github.com/k0sproject/k0s/commit/1c3aa2fa8caf82a04b48c4a7fbce0b3e249af4e2) |
| 2026-05-05 | CNCF approves installing the RISE RISC-V Runners GitHub App into the k0sproject org. Scope narrowed at twz123's request from per-PR to nightly-plus-manual-dispatch to avoid blocking normal development. | [PR #7414 discussion](https://github.com/k0sproject/k0s/pull/7414) |
| 2026-05-10 | `check-basic` and `check-airgap` smoketests confirmed passing on RISE runners; `check-network-conformance-*` blocked only on sonobuoy's missing riscv64 support. | [PR #7414 discussion](https://github.com/k0sproject/k0s/pull/7414) |
| 2026-05-12 | RISE "six weeks in" post names k0s as "in the home stretch of integrating with the runners." | [RISE blog, 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) |
| 2026-05-13 | Prerequisite PR "Split out the unittests job to a separate workflow_call file" merges. | [PR #7606](https://github.com/k0sproject/k0s/pull/7606) |
| 2026-06-19 | PR #7414 merges. Merge commit `1218cbd7ac5dd3e84b16c97d26d41085a0f0dab3`. twz123: "The changes here are a bit hacky, but I don't have a better proposal right now... let's just live with it for now." | [PR #7414](https://github.com/k0sproject/k0s/pull/7414) |
| 2026-06-23 | luhenry confirms nightly riscv64 CI has been green for several days. | [PR #7414 discussion](https://github.com/k0sproject/k0s/pull/7414) |
| 2026-06-30 | **v1.37.0-alpha.1+k0s.0** becomes the first tagged release whose source tree includes the riscv64 CI workflow; this is a source-tag milestone, not evidence of a published riscv64 binary asset (see Section 8). No stable release has shipped it as of 2026-09-30. | Release history |
| 2026-09-19 | Latest stable release, **v1.36.4+k0s.1**, still ships assets for amd64/arm/arm64/windows2022-amd64 only. No riscv64 asset. | [GitHub Releases](https://github.com/k0sproject/k0s/releases) |

The master tracking issue (#1919) remains open since 2022. Real implementation work happened entirely through a chain of merged PRs rather than issue-thread discussion. The CI-enablement path (PR #7414) is not yet reflected in any stable release.

## 3. Upstream Support Tier

k0s publishes no formal numbered tiering policy. The implicit hierarchy from `docs/system-requirements.md` and CI configuration is:

| Tier | Architectures | CI on PR | Nightly/dispatch CI | Pre-built binaries | Race detector |
|---|---|---|---|---|---|
| Full support | x86_64, aarch64 | Yes | Yes | Yes | Yes |
| Best-effort | armv7l | Partial | Yes | Yes | No |
| Experimental | riscv64 | No | Yes (nightly cron `45 2 * * *`, plus manual dispatch) | No | No |

`docs/system-requirements.md` on `main` still states riscv64 has "No pre-compiled binaries, no CI coverage." This text is stale: a dedicated `riscv64.yml` workflow exists and has run nightly since PR #7414 merged (2026-06-19), so the "no CI coverage" half of that sentence is now contradicted by the repository's own CI configuration. The "no pre-compiled binaries" half remains accurate through the latest stable release, v1.36.4+k0s.1 (2026-09-19).

The riscv64 CI workflow (`.github/workflows/riscv64.yml`) is triggered only by `workflow_dispatch` and `schedule`; it has no `pull_request` trigger, confirmed by direct fetch of the workflow file and by confirming `.github/workflows/go.yml` (the actual PR/push gate) contains zero occurrences of the string "riscv" anywhere in its build/smoketest matrices (which cover only amd64, arm64, and self-hosted arm). riscv64 failures do not block merges to `main`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

k0s is a pure-Go project. It contains no C source files, no assembly, no SIMD intrinsics, no JIT backend, no `arch/riscv/` directory, and no `__riscv` preprocessor guards anywhere in the repository (confirmed via repeated code search for `riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, and `__riscv`, all returning either the same 13-file plumbing set or zero hits). There is no category of code in k0s where RVV, Zba, or Zbb intrinsics would apply; this project has no natural analog to the hand-tuned/intrinsics/scalar-fallback rubric used for numerics or codec libraries.

All 13 files referencing riscv64 are narrow, complete build/CI/ABI plumbing, none are stubs:

| File | Purpose | ISA extensions | Status |
|---|---|---|---|
| `Makefile` | Detects `HOST_HARDWARE=riscv64`, sets `HOST_ARCH`; disables Go race detector for riscv64/arm builds; defines riscv64 airgap-bundle targets | None | Complete |
| `embedded-bins/kubernetes/patches/riscv64.patch` (53-54 lines) | Out-of-tree patch adding `linux/riscv64` to Kubernetes' own `KUBE_SUPPORTED_*_PLATFORMS` lists and `host_arch()` detection in `hack/lib/golang.sh`/`hack/lib/util.sh`, since upstream Kubernetes does not officially support riscv64 | None | Complete (patch on vendored upstream source, not k0s-native code) |
| `embedded-bins/kubernetes/Dockerfile` | Applies `riscv64.patch` during embedded-Kubernetes build stage | None | Complete |
| `.github/workflows/riscv64.yml` | Dedicated nightly-cron + manual-dispatch CI: build, unit tests, airgap bundle, basic/airgap smoketests on `ubuntu-24.04-riscv` | None | Complete, operational |
| `.github/workflows/build-k0s.yml`, `build-image-bundle.yml`, `smoketest.yaml` | Runner-selection and artifact-naming wiring for `target-arch == 'riscv64'` | None | Complete |
| `hack/list-images/main.go` | Adds `{linux, riscv64}` to the enumerated image-reference platform list | None | Complete |
| `pkg/airgap/images.go` | Excludes the Envoy-based Node-Local Load-Balancing (NLLB) image for `arm`/`riscv64` targets | None | Complete (honest functional gap, not a stub) |
| `internal/pkg/sysinfo/probes/linux/types_signed.go` (8 lines) | `//go:build linux && !(arm \|\| riscv64)`; defines `utsChar = int8` | None | Complete |
| `internal/pkg/sysinfo/probes/linux/types_unsigned.go` (8 lines) | `//go:build linux && (arm \|\| riscv64)`; defines `utsChar = uint8`, since riscv64 (like arm) uses unsigned `char` in glibc's `struct utsname`, needed for correct `uname()` syscall parsing | None | Complete |
| `inttest/bootloose-alpine/Dockerfile` | Skips installing the etcd test binary for arm/riscv64 targets (no upstream etcd binaries published) | None | Complete (confirms a real test-coverage gap) |
| `docs/system-requirements.md` | Lists riscv64 as supported with caveats | N/A | Stale relative to current CI state (see Section 3) |

Comparison vs amd64/arm64: both established architectures are the implicit default/fallback case throughout the Makefile and Go build-tag conditionals; riscv64 is one `case`/build-tag branch among several, functionally identical in kind (conditional compilation only, no vectorized code path for any architecture) but administratively second-tier (nightly CI rather than PR-gated, no release artifacts).

## 5. Build System, Cross-Compilation, and Toolchain

k0s uses Make plus Docker. There is no CMake, no `CMakeLists.txt`, no `setup.py`, no `Cargo.toml`, and no `BUILDING.md`/`docs/cross-compilation.md` (confirmed by direct repository inspection). Build documentation is spread across `Makefile`, `embedded-bins/Makefile*`, and `.github/workflows/*.yml`.

**Toolchain (from `embedded-bins/Makefile.variables`, cross-checked against `go.mod`):**

| Component | Version |
|---|---|
| Go | 1.27.1 (go.mod minimum: 1.27.0) |
| Build image | `golang:1.27.1-alpine3.24` |
| Alpine base | 3.24.2 |

CGO is disabled for the main k0s binary (`BUILD_GO_CGO_ENABLED = 0`), statically linked via `-extldflags=-static`. No pinned GCC/Clang version is documented or required beyond what Alpine 3.24 ships (`apk add make gcc musl-dev binutils`), since k0s itself has no C/C++ toolchain requirement outside building its small embedded C dependencies (iptables, keepalived) with the distro's stock gcc.

**Build commands:**

```
make .k0sbuild.docker-image.k0s
touch go.sum
make --touch codegen
make build
```

Airgap image bundle for riscv64:

```
make airgap-image-bundle-linux-riscv64.tar
```

Package-maintainer mode (skip embedded binaries):

```
make EMBEDDED_BINS_BUILDMODE=none
```

`HOST_ARCH` auto-detection recognizes riscv64 directly (`else ifneq (, $(filter $(HOST_HARDWARE), riscv64)) HOST_ARCH := riscv64`).

**No QEMU is used.** Both the k0s binary and all embedded component binaries for riscv64 are built **natively** on GitHub-hosted `ubuntu-24.04-riscv` runners (real riscv64 hardware/VMs supplied by RISE, on Scaleway EM-RV1). The string "qemu" does not appear anywhere in the repository's workflow files, confirmed by direct grep of all 26 files under `.github/workflows/`.

The Go race detector is disabled for riscv64 builds (`ifneq (, $(filter $(HOST_ARCH), arm riscv64)) check-unit: GO_TEST_RACE ?=`). This is a Go platform limitation (the race detector does not support riscv64), not a k0s policy choice.

**Known build failure (historical, community-reported):** Issue #4665 (2024-06-22) - `make HOST_ARCH=riscv64 EMBEDDED_BINS_BUILDMODE=none` failed with `ERROR: unable to select packages: binutils-gold (no such package)` on Alpine (riscv64 has no `binutils-gold` package). This predates official enablement work and was closed not-planned; the maintainer-driven enablement path (PR #5802 onward) did not hit or need to resolve this specific error, since it took a different code path.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Binary build | Yes | Yes | Yes | Nightly CI only; not in release pipeline |
| Unit tests | Yes | Yes | Yes | Race detector disabled on riscv64 |
| Smoke test: basic | Yes | Yes | Yes | Confirmed passing, PR #7414 discussion, 2026-05-10 |
| Smoke test: airgap | Yes | Yes | Yes | Confirmed passing, PR #7414 discussion |
| Network conformance (Calico, kube-router) | Yes | Yes | No | Blocked on sonobuoy riscv64 image |
| NLLB (Node-Local Load Balancing, Envoy) | Yes | Yes | No | Envoy has no riscv64 build; twz123 (PR #7414): "the last image that's directly used by k0s which is not available for RISC-V" |
| SBOM generation (syft) | Yes | Yes | No | anchore/syft lacks riscv64; upstream PR filed, not re-verified live this run |
| Support-bundle collection (troubleshoot) | Yes | Yes | Yes (fixed) | Upstream replicatedhq/troubleshoot#2010 merged, resolving the riscv64 gap flagged during PR #7414 |
| PR-gate CI | Yes | Yes | No | `go.yml` has zero riscv references |
| Release binary artifacts | Yes | Yes | No | `release.yml` has zero riscv64 references |

**NaN/floating-point semantics:** No k0s-specific NaN or floating-point bug was found. The relevant ecosystem issue is upstream Go itself: [golang/go#64917](https://github.com/golang/go/issues/64917) documents that `uint32(math.NaN())` returns `4294967295` on riscv64 versus `0` on every other architecture (confirmed on Go 1.21.5/linux-riscv64). Status: open, labeled `NeedsInvestigation`/`FrozenDueToAge`. This is a real architecture-specific correctness divergence in the Go toolchain that any Go program, including k0s, could hit if it converts a NaN value to an unsigned integer on riscv64. No evidence was found that k0s code actually exercises this conversion path; it is flagged as ecosystem-level risk, not a confirmed k0s defect.

**Security hardening gaps:** Data not available: no riscv64-specific CVEs, security advisories, or hardening regressions for k0s were found in issue search, PR search, or web search.

**Performance gaps:** No riscv64 performance data of any kind exists for k0s (see Section 13.2), so no SIMD/vectorization-related performance delta can be quantified. k0s's own layer is pure Go with no vectorized code path on any architecture; any performance gap would originate from the Go runtime or the embedded components (Kubernetes, etcd/kine, containerd) rather than from k0s itself.

## 7. CI/CD Infrastructure

**Workflow file:** `.github/workflows/riscv64.yml`, merged via [PR #7414](https://github.com/k0sproject/k0s/pull/7414) (2026-06-19), confirmed by direct fetch of the raw file content from `main` as of 2026-09-30:

```yaml
name: "RISC-V build"

on:
  workflow_dispatch:
    inputs:
      smoketests:
        description: Which smoketests to run.
        type: string
  schedule:
    - cron: 45 2 * * *

jobs:
  build-k0s:
    uses: ./.github/workflows/build-k0s.yml
    with:
      target-os: linux
      target-arch: riscv64

  build-airgap-image-bundle:
    needs: [build-k0s]
    uses: ./.github/workflows/build-image-bundle.yml
    with:
      image-bundle-name: airgap
      image-bundle-platform: linux-riscv64
      runs-on: ubuntu-24.04-riscv

  unittests-k0s:
    uses: ./.github/workflows/unittests-k0s.yml
    with:
      runs-on: ubuntu-24.04-riscv

  smoketests:
    needs: [build-k0s, build-airgap-image-bundle]
    uses: ./.github/workflows/smoketest.yaml
    with:
      arch: riscv64
      name: ${{ matrix.smoke-suite }}
```

**Triggers:** `workflow_dispatch` (manual, optional `smoketests` input) plus `schedule` (daily, 02:45 UTC). No `push` or `pull_request` trigger.

**Runner:** `ubuntu-24.04-riscv`, backed by RISE's Scaleway EM-RV1 bare-metal nodes. No QEMU anywhere in any of the four riscv64-touching workflow files (`riscv64.yml`, `build-k0s.yml`, `build-image-bundle.yml`, `smoketest.yaml`), confirmed by direct content fetch, not merely repo-wide search. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repo; all CI is GitHub Actions.

**Comparison table:**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR-gate CI (`go.yml`) | Yes | Yes | No |
| Nightly/dispatch CI | N/A (covered by PR gate) | N/A | Yes, since 2026-06-19 |
| Release CI (`release.yml`) | Yes | Yes | No riscv64 entries |
| Runner | `ubuntu-24.04` | `ubuntu-24.04-arm` | `ubuntu-24.04-riscv` (RISE/Scaleway) |
| Emulation | N/A | None | None (native) |

**Technical blockers encountered and resolved during PR #7414 development** (from the PR's own discussion thread, verbatim where quoted):

| Issue | Root cause | Resolution |
|---|---|---|
| anchore/syft has no riscv64 build | Upstream gap | Disabled for riscv64 in k0s CI; upstream PR filed |
| RISE runner org-level access | CNCF policy required approval before installing the RISE GitHub App into k0sproject | Approved 2026-05-05 |
| overlayfs-on-overlayfs failure | RISE runners are themselves k8s pods; k0s inside those pods attempted a second overlayfs layer | Mount an empty volume at `/var/lib/k0s` |
| `ip_set_hash_net` kernel module missing | Not present by default on the Scaleway EM-RV1 kernel image used by RISE at the time | Built/loaded from Scaleway-supplied kernel sources |
| DNS CIDR conflict | kube-proxy CIDR inside the nested k0s cluster clashed with the outer pod CIDR | Fixed at the pod-networking level |
| replicatedhq/troubleshoot missing riscv64 releases | Upstream gap | Upstream PR [replicatedhq/troubleshoot#2010](https://github.com/replicatedhq/troubleshoot/pull/2010) merged |
| vmware-tanzu/sonobuoy unavailable on riscv64 | Upstream gap | Upstream PR [vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049) filed by luhenry, open at merge, not re-verified live in this pass |
| Scope required narrowing from per-PR to nightly | Maintainer twz123 requested it explicitly to avoid blocking normal development given limited runner capacity | Workflow set to `schedule` + `workflow_dispatch` only |

**RISE usage context:** per the RISE ["six weeks in" post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) (2026-05-12), RISE's runner fleet ran 13,000+ jobs across 197 repos/87 orgs (2026-03-19 to 2026-05-06) at a 99.78% completion rate, roughly 445 jobs/day. k0s is named as "in the home stretch of integrating with the runners" in that post; llama.cpp (2,589 jobs), PyTorch (870 jobs), and post-quantum crypto workloads (2,208 jobs) are the heaviest users by job count. RISE does not maintain a k0s fork or package; its involvement is purely as CI infrastructure provider, via `riseproject-dev/riscv-runner*` app tooling. RISE holds no dedicated k0s repository in its GitHub org (confirmed: `search_repositories k0s org:riseproject-dev` returns zero results; full 26-repo org listing confirmed no k0s-named repo).

## 8. Distribution and Release Status

**GitHub Releases:** latest stable release as of 2026-09-30 is **v1.36.4+k0s.1** (published 2026-09-19). Full asset list: `airgap-images-linux-{amd64,arm,arm64}.txt`, `airgap-images-windows2022-amd64.txt`, `cosign.pub`, `k0s-airgap-bundle-v1.36.4+k0s.1-linux-{amd64,arm,arm64}.tar`, `k0s-airgap-bundle-...-windows2022-amd64.tar`, `k0s-v1.36.4+k0s.1-amd64`, source archives, attestation JSON. **Zero asset filenames contain "riscv" or "riscv64."** Only amd64, arm, arm64, and windows2022-amd64 are shipped. Recent tags also include v1.35.8+k0s.1, v1.34.11+k0s.1 (all 2026-09-19), v1.36.4+k0s.0, v1.35.8+k0s.0 (2026-08-31) - none carry riscv64 assets. `release.yml` has no riscv64 target.

The pre-release tag **v1.37.0-alpha.1+k0s.0** (2026-06-30) is the first git tag whose source tree includes the riscv64 CI workflow file, but this reflects source-tree content, not a published riscv64 binary asset: since `release.yml` has no riscv64 build step, there is no reason to expect that pre-release's published assets differ from the amd64/arm/arm64/windows pattern. Data not available: the exact asset list for v1.37.0-alpha.1+k0s.0 was not independently fetched in this research pass.

**PyPI:** `https://pypi.org/pypi/k0s/json` returns a package named `k0s`, version `0.0.1`, a single source distribution (`k0s-0.0.1.tar.gz`, uploaded 2024-04-20). No wheels of any kind, no riscv64 evidence. This is almost certainly an unrelated, name-squatted package - k0s is a Go binary, not a Python distribution.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/k0s/` returns HTTP 302, redirecting to upstream PyPI (i.e., no RISE-built wheels exist for "k0s"; it simply proxies to the unrelated PyPI stub above).

**Debian:** No Debian package; `tracker.debian.org/pkg/k0s` returns HTTP 404.

**Ubuntu (26.04 "resolute"):** Inconclusive. Direct fetches of `packages.ubuntu.com/search?...suite=resolute...` returned HTTP 503 on every attempt across four URL variants in this research pass; separately, a page fetch returned only architecture-filter boilerplate with no package match table, and no "k0s," "python3-k0s," or "libk0s" entry. k0s has never been distributed as an apt package upstream (install is via curl script or standalone GitHub-release binaries), which makes an official Ubuntu package improbable, but this is not independently confirmed and should not be read as a verified "absent" result given the 503s.

**Arch Linux RISC-V port (archriscv.felixc.at):** No k0s entry found on direct fetch.

**Ubuntu package graph (project-graph MCP):** Not queried. The `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) across the entire research session. This is a tool-availability gap, not a finding that the package is absent from Ubuntu riscv64; it should be retried once the server is reachable.

**Summary:** There is no riscv64 k0s binary available through any distribution channel that could be directly checked. The only path to a riscv64 k0s binary today is building from source.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go | build-dependency, critical | Yes, since Go 1.14; official `go1.27.1.linux-riscv64` toolchain | Secondary Go port (non-blocking for Go's own releases) | Official tarball | None |
| Kubernetes | runtime-dependency, critical | No official upstream build; k0s carries out-of-tree `riscv64.patch` to compile embedded Kubernetes | None upstream | None | kubernetes/kubernetes#132836 open, no merge traction (confirmed live 2026-09-30); prior PRs #116686, #123661 closed. Hard blocker - k0s riscv64 users run a community-patched, not upstream-supported, Kubernetes build |
| containerd | runtime-dependency, critical | Yes; official riscv64 release tarball (`containerd-2.3.2-linux-riscv64.tar.gz`, ~30.3 MB) | 1752 tests passing in open PR [containerd#13124](https://github.com/containerd/containerd/pull/13124); issue #13020 (CI matrix) still open (confirmed live 2026-09-30) | Yes (release tarball) | No merged riscv64 CI yet; PR pending 2 reviews and RISE GitHub App install in containerd org |
| runc | runtime-dependency, critical | Yes; v1.5.0 release includes `runc.riscv64`. k0s embeds v1.4.3 | No dedicated CI | Yes (v1.5.0) | Issue #5166 (2026-03-12) closed without a linked merged PR (confirmed live 2026-09-30); k0s's embedded v1.4.3 predates the v1.5.0 riscv64 binary |
| etcd | runtime-dependency, critical | Builds only via `ETCD_UNSUPPORTED_ARCH=riscv64` | None (no Prow riscv64 nodes) | None | Maintainers stated "No plans" (issues #21509/#21510 closed, confirmed live 2026-09-30). Hard blocker for multi-node HA |
| kine | runtime-dependency, optional | Yes | Basic build verification only | Yes; `kine-riscv64` and `kine-riscv64-nocgo` assets shipped in v0.16.2 | None - workaround path for the etcd gap, single-node only |
| CoreDNS | runtime-dependency, optional | Pure Go, likely buildable | Unknown | No official riscv64 image confirmed | Non-functional cluster DNS without an official image [NEEDS VERIFICATION] |
| kube-router | runtime-dependency, optional | Partial; PR #1525 added riscv64 (2023-08-28), PR #1534 partially reverted it (2023-08-30) | Unknown | Uncertain; no confirmed riscv64 image in recent releases | twz123 (PR #7414 thread): "already available for RISC-V" [NEEDS VERIFICATION against current image manifest]. Is k0s's default CNI, so this matters more than Calico |
| Calico | runtime-dependency, optional | No | None | None | Not a blocker since kube-router is the default CNI |
| Envoy | runtime-dependency, optional | No | None | None | Envoy issue #42787 closed "Not planned" (Feb 2026). twz123: "the last image that's directly used by k0s which is not available for RISC-V." Blocks NLLB and part of the conformance suite |
| Helm | runtime-dependency, optional | Yes | Yes (cross-compiled Go) | Yes; `helm-v3.21.2-linux-riscv64.tar.gz` confirmed in release | None |
| keepalived | runtime-dependency, optional | Yes; snap builds added/fixed January 2025 (PRs #2525, #2533, #2543) | Via snap build infra | riscv64 snap available since 2025; no official tarball | HA mode only; C binary |
| konnectivity | runtime-dependency, optional | Unknown; `ALL_ARCH` in its Makefile ("amd64 arm arm64 ppc64le s390x") does not list riscv64 | None | None | Likely buildable (pure Go) but untested and absent from the release arch list [NEEDS VERIFICATION] |
| iptables | runtime-dependency, optional | Depends on Alpine riscv64 packages; Alpine has supported riscv64 since 3.20 | None | No k0s-specific binary | Runtime needs Linux 5.4+ netfilter riscv64 support [NEEDS VERIFICATION] |
| sonobuoy | test-dependency, optional | No | None | None | Upstream PR [vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049) open (not re-verified live this pass); blocks network-conformance testing on riscv64 |
| syft | test-dependency, optional | No | None | None | Upstream PR [anchore/syft#4757](https://github.com/anchore/syft/pull/4757) open (not re-verified live this pass); disabled for riscv64 in k0s CI, blocks SBOM generation |
| troubleshoot | test-dependency, optional | Yes (fixed) | Yes | Yes | Upstream PR [replicatedhq/troubleshoot#2010](https://github.com/replicatedhq/troubleshoot/pull/2010) merged, resolving the missing riscv64 releases gap flagged during PR #7414 |
| modernc.org/sqlite (indirect, used by kine) | indirect dependency | Yes (pure Go) | Listed as supported (linux/riscv64) | Via Go module | None |
| golang.org/x/crypto (indirect, TLS/crypto) | indirect dependency | Yes (pure Go) | Yes | Via Go module | None |

**Summary by category:**

- Unblocked (riscv64 artifact exists): Go, containerd (release exists, CI PR pending merge), runc (v1.5.0 has a binary; k0s's embedded v1.4.3 does not), kine, Helm, keepalived (snap), troubleshoot, modernc.org/sqlite, golang.org/x/crypto.
- Uncertain/partial: kube-router (partially reverted, claimed working but unverified against current manifest), konnectivity (pure Go, absent from release arch list), iptables (should build on Alpine but unverified), CoreDNS (pure Go, no official image confirmed).
- Hard blockers: Kubernetes (no official upstream binary, k0s carries an out-of-tree patch), etcd (explicit upstream "no plans," blocks multi-node HA), Envoy (upstream "not planned," blocks NLLB), sonobuoy (upstream PR open), syft (upstream PR open).

All dependencies listed above fall within the broader RISC-V ecosystem tracking scope; several (kine, kube-router, keepalived, konnectivity, sonobuoy, syft, troubleshoot, iptables, modernc.org/sqlite, golang.org/x/crypto) do not yet have their own dedicated status reports and are candidates for individual deep-dives if further dependency-chain verification is needed.

## 11. Known Bugs and Active Issues

| Item | Status | Description |
|---|---|---|
| [Issue #1919](https://github.com/k0sproject/k0s/issues/1919) "RISC-V support" | Open since 2022-07-14 | Master tracking issue. Remains open despite PR #7414 merging - full production-grade support with release artifacts is not yet achieved |
| [Issue #4665](https://github.com/k0sproject/k0s/issues/4665) "feat(riscv64): Here is how far I've got." | Closed, not planned (2024-08-03) | Community build attempt on a StarFive VisionFive2 failed at `binutils-gold` missing on Alpine riscv64. Predates official enablement; not revisited |
| overlayfs-on-overlayfs (k0s inside a nested k8s pod) | Resolved, via PR #7414 | Mounted an ext4-backed empty volume at `/var/lib/k0s` |
| `ip_set_hash_net` kernel module missing (Scaleway EM-RV1 default kernel) | Resolved, via PR #7414 (manual workaround) | Required by kube-router; built from Scaleway-supplied kernel sources |
| DNS CIDR conflict in nested k0s | Resolved, via PR #7414 | kube-proxy CIDR clashed with the outer pod CIDR |
| sonobuoy: no riscv64 image | Open; upstream [PR vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049) | Blocks `check-network-conformance-calico` and `check-network-conformance-kuberouter` in k0s CI |
| anchore/syft: no riscv64 | Open; upstream [PR anchore/syft#4757](https://github.com/anchore/syft/pull/4757) | Blocks SBOM generation; syft disabled for riscv64 in k0s CI |
| replicatedhq/troubleshoot: no riscv64 releases | Resolved; upstream [PR #2010](https://github.com/replicatedhq/troubleshoot/pull/2010) merged | Support-bundle collection now works on riscv64 |
| Envoy: no riscv64 | Not planned (Envoy issue #42787 closed, Feb 2026) | Blocks NLLB and part of the conformance test infrastructure |
| etcd: no riscv64 support | Not planned (maintainers: "No plans," confirmed live 2026-09-30) | `ETCD_UNSUPPORTED_ARCH=riscv64` workaround required. Blocks multi-node HA; kine is the single-node workaround |
| Kubernetes: no official riscv64 binary | No merge traction on k8s#132836 (confirmed live 2026-09-30) | k0s maintains its own out-of-tree `riscv64.patch` as a workaround |
| CoreDNS: no official riscv64 image | Unknown upstream status | Pure Go; likely buildable but no official container image confirmed [NEEDS VERIFICATION] |
| konnectivity: absent from riscv64 release arch list | No upstream issue found | `ALL_ARCH` in its Makefile does not include riscv64 [NEEDS VERIFICATION on buildability] |
| Race detector disabled on riscv64 | Permanent (Go platform limitation) | Go's race detector does not support riscv64; not a k0s-specific bug |
| [golang/go#64917](https://github.com/golang/go/issues/64917): `uint32(NaN())` returns `4294967295` on riscv64 vs `0` elsewhere | Open (Go toolchain, not k0s) | Real architecture-specific correctness divergence in Go's float-to-uint conversion on riscv64. No evidence k0s code hits this conversion path; flagged as ecosystem-level risk |

## 12. Objections and Upstream Blockers

**Blocker 1 - Kubernetes has no official riscv64 binary.** k0s works around this with `embedded-bins/kubernetes/riscv64.patch`, maintained entirely out-of-tree. Upstream PRs #116686 (2023) and #123661 (2024) were both closed; proposal #132836 remains open with no merge momentum as of 2026-09-30. Any security fix requiring a patch to Kubernetes' own build scripts must be carried in k0s's patch rather than consumed from an upstream release.

**Blocker 2 - etcd maintainers have stated no plans to support riscv64.** The `ETCD_UNSUPPORTED_ARCH=riscv64` environment variable permits single-node startup but is not a production posture; issues #21509/#21510 were closed with that explicit "no plans" response. kine (SQLite/Postgres backend) is a workaround, but only for single-node deployments. Multi-node HA control planes are not achievable with the current upstream posture.

**Blocker 3 - Envoy closed its riscv64 support request "Not planned."** Issue #42787 was closed in February 2026. This blocks NLLB (Node-Local Load Balancing), a feature k0s uses in default multi-node setups. twz123 noted Traefik as a potential future substitute, but no implementation work has started.

**Blocker 4 - No release artifacts.** `release.yml` has zero riscv64 references, even in the pre-release tag (v1.37.0-alpha.1+k0s.0) that first contains the riscv64 CI workflow file. Users must build from source; nightly CI artifacts are not persisted as public downloads. This is an adoption blocker, not a technical one.

**Blocker 5 - CI is nightly-only, not a merge gate.** riscv64 regressions are not caught at PR time; a broken commit on `main` could go undetected for up to 24 hours. Only 2 smoketest suites (basic, airgap) run on riscv64; network-conformance and SBOM-related suites remain blocked on sonobuoy and syft respectively.

## 13. Readiness Assessment

- **Color:** blue (no color_case sub-type applies; sub-types apply only to grey, yellow, or orange projects in this model).
- **Release provider:** none.
- **Optimization-purpose project:** no - k0s is a lightweight Kubernetes distribution, not a SIMD/allocator/crypto-performance library, so the Step 2 optimization-level modifier does not apply and no optimization-level field is reported.
- **Justification:** Upstream k0s merged [PR #7414 "ci: Add support for linux-riscv64"](https://github.com/k0sproject/k0s/pull/7414) (merged 2026-06-19), which builds k0s natively on `ubuntu-24.04-riscv` runners, runs the unit-test suite (`unittests-k0s`), and runs "basic" and "airgap" smoketests, confirmed passing per the PR discussion ("I got check-basic to work... check-basic and check-airgap are working"). That satisfies build=yes and test=yes. However, no riscv64 asset exists in any stable [GitHub Release](https://github.com/k0sproject/k0s/releases) (latest checked: v1.36.4+k0s.1, only amd64/arm/arm64/windows2022-amd64 assets), and `release.yml` has no riscv64 target, so release=yes/no/no maps to blue.
- **Pending work that could change the grade:** Master tracking issue [#1919](https://github.com/k0sproject/k0s/issues/1919) "RISC-V support" remains open since 2022. The riscv64 CI (#7414) is nightly/workflow_dispatch only, not wired into the pull_request gate, and only landed in the v1.37.0-alpha.1+k0s.0 pre-release, not yet any stable release. Hard upstream blockers acknowledged by k0s maintainers themselves: etcd has no riscv64 plans (blocks multi-node HA), Envoy has no riscv64 build (blocks NLLB), and Kubernetes itself has no official riscv64 binaries (k0s carries an out-of-tree patch). Open upstream PRs for sonobuoy ([vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049)) and syft ([anchore/syft#4757](https://github.com/anchore/syft/pull/4757)) would unblock network-conformance and SBOM testing on riscv64. RISE Project supplies the free native riscv64 CI runner hardware (Scaleway EM-RV1) behind #7414, though k0s/Mirantis is not a RISE member and RISE holds no dedicated k0s repo.

## 14. Investment Analysis

RISE has already funded and continues to provide the free native riscv64 GitHub Actions runner infrastructure (Scaleway EM-RV1 hardware, `ubuntu-24.04-riscv` label) that backs `riscv64.yml`. That CI infrastructure cost should not be re-sized below; the remaining work is upstream engineering and release-pipeline integration, not runner procurement.

### 14.1 Functional Enablement

The port is functionally real: the k0s binary builds on riscv64, starts a cluster, and passes basic and airgap smoke tests. A community member (Bas Magre) demonstrated a working single-node k0s cluster on StarFive VisionFive2 hardware in an April 2026 [k0s multi-arch blog post](https://blog.k0sproject.io/posts/k0s-multi-arch-kubernetes-cluster/), requiring `ETCD_UNSUPPORTED_ARCH=riscv64`, a from-source k0s build, and custom riscv64 MetalLB images with FRR disabled (no riscv64 FRR build). Remaining functional gaps: no pre-built binaries, unconfirmed CoreDNS riscv64 image availability, no NLLB/Envoy, and the etcd single-node-only workaround.

### 14.2 Performance Optimization

Not applicable at the k0s application layer - k0s is pure Go with no architecture-specific optimization paths. Performance is entirely a function of the Go runtime, the embedded components (Kubernetes, etcd/kine, containerd), and the underlying hardware.

### 14.3 CI/CD Infrastructure

Nightly CI is operational on RISE hardware at no cost to k0s. Remaining gaps: no PR-gate CI for riscv64, network-conformance tests blocked on sonobuoy, SBOM generation blocked on syft. Extending to a PR gate requires maintainer buy-in (currently declined, citing runner capacity) and RISE capacity headroom, which the RISE "six weeks in" post itself flags as thin.

### 14.4 Ecosystem Enablement

k0s follows the same pattern seen across other CNCF-adjacent projects adopting RISE runners: CI enablement first, release artifacts later. The critical path to a production-usable k0s on riscv64 runs through: (1) upstream Kubernetes official riscv64 builds (no current merge traction), (2) upstream etcd riscv64 support for multi-node HA (explicitly declined by etcd maintainers), (3) sonobuoy riscv64 image (PR open), (4) k0s release-pipeline inclusion. Items 1 and 2 are the highest-effort, lowest-traction blockers, requiring sustained upstream engagement with maintainer communities that have resisted riscv64 support.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to k0s release pipeline (`release.yml`) | 1-2 | k0s maintainers (Mirantis) | High |
| Functional | Resolve CoreDNS riscv64 image availability | 2-4 | CoreDNS upstream | High |
| Functional | Resolve konnectivity riscv64 build and release | 1-2 | konnectivity upstream | Medium |
| Functional | Upstream Kubernetes riscv64 official build support | 12+ | Kubernetes SIG-Release | Critical, no current traction |
| Functional | etcd riscv64 support for multi-node HA | 8-16 | etcd maintainers, explicitly declined | Critical, blocked upstream |
| Functional | Envoy riscv64 support for NLLB | 20+ | Envoy maintainers, not planned | Low, upstream closed as not planned |
| CI/CD | Review and merge sonobuoy riscv64 PR to unblock network conformance tests | 1 (reviewer time) | vmware-tanzu/sonobuoy maintainers | High |
| CI/CD | Review and merge syft riscv64 PR to unblock SBOM generation | 1 (reviewer time) | anchore/syft maintainers | Medium |
| CI/CD | Expand riscv64 smoke test matrix beyond basic and airgap | 4-8 | k0s maintainers plus luhenry | Medium |
| CI/CD | Add riscv64 to the PR-gate CI | 2-4 | k0s maintainers plus RISE | Low, requires runner capacity agreement |
| Performance | Publish riscv64 vs arm64 baseline benchmarks | 2-4 | Data not available: no prior work exists | Medium |

## 15. References

- [k0sproject/k0s GitHub repository](https://github.com/k0sproject/k0s)
- [k0s project homepage](https://k0sproject.io/)
- [Issue #1919, RISC-V support, master tracking issue](https://github.com/k0sproject/k0s/issues/1919)
- [Issue #4665, feat(riscv64): Here is how far I've got.](https://github.com/k0sproject/k0s/issues/4665)
- [Issue #6059, Assessment of the difficulty in porting CPU architecture for k0s](https://github.com/k0sproject/k0s/issues/6059)
- [Commit c41ae49, Use proper types on RISC-V](https://github.com/k0sproject/k0s/commit/c41ae49)
- [PR #5802, Add initial RISC-V support to Makefile](https://github.com/k0sproject/k0s/pull/5802)
- [PR #5803, Various Image version bumps for riscv64](https://github.com/k0sproject/k0s/pull/5803)
- [PR #5807, Ignore RISC-V Linux airgap image bundle](https://github.com/k0sproject/k0s/pull/5807)
- [PR #5848, Allow riscv64 build](https://github.com/k0sproject/k0s/pull/5848)
- [PR #7414, ci: Add support for linux-riscv64](https://github.com/k0sproject/k0s/pull/7414)
- [PR #7459, Make airgap list-images platform-aware](https://github.com/k0sproject/k0s/pull/7459)
- [PR #7606, Split out the unittests job to a separate workflow_call file](https://github.com/k0sproject/k0s/pull/7606)
- [Commit 1c3aa2f, [CI] Enable nightly build and tests on ubuntu-24.04-riscv](https://github.com/k0sproject/k0s/commit/1c3aa2fa8caf82a04b48c4a7fbce0b3e249af4e2)
- [k0sproject/k0s GitHub Releases](https://github.com/k0sproject/k0s/releases)
- [k0s system requirements documentation](https://docs.k0sproject.io/main/system-requirements/)
- [Upstream PR, anchore/syft#4757](https://github.com/anchore/syft/pull/4757)
- [Upstream PR, replicatedhq/troubleshoot#2010](https://github.com/replicatedhq/troubleshoot/pull/2010)
- [Upstream PR, vmware-tanzu/sonobuoy#2049](https://github.com/vmware-tanzu/sonobuoy/pull/2049)
- [Upstream PR, containerd/containerd#13124](https://github.com/containerd/containerd/pull/13124)
- [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836)
- [golang/go#64917, uint32(math.NaN()) returns the wrong value on riscv64](https://github.com/golang/go/issues/64917)
- [RISE RISC-V Runners announcement, 2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in, 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members page](https://riseproject.dev/members/)
- [k0s Multi Architectures Kubernetes Cluster AMD/ARM/RISC-V (blog.k0sproject.io)](https://blog.k0sproject.io/posts/k0s-multi-arch-kubernetes-cluster/)
- [The k0smotron Big Bang Benchmark (blog.k0sproject.io)](https://blog.k0sproject.io/posts/k0smotron-big-bang-benchmark/)
- [CNCF blog, k0s in 2025: A year of community growth, governance, and Kubernetes innovation](https://www.cncf.io/blog/2026/01/26/k0s-in-2025-a-year-of-community-growth-governance-and-kubernetes-innovation/)
- [cncf/sandbox#125](https://github.com/cncf/sandbox/issues/125)
- [Mirantis blog, A milestone for lightweight Kubernetes: k0s joins CNCF Sandbox](https://www.mirantis.com/blog/a-milestone-for-lightweight-kubernetes-k0s-joins-cncf-sandbox/)
- [k3s-io/k3s#7151, Add support for riscv64 architecture (adjacent project, context only)](https://github.com/k3s-io/k3s/issues/7151)