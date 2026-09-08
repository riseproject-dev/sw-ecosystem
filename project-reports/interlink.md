---
title: Interlink
parent: Project Reports
color: orange
---

# Interlink

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Interlink<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

interLink ([interlink-hq/interLink](https://github.com/interlink-hq/interLink)) is a Kubernetes Virtual Kubelet abstraction layer that lets pods execute on remote resources - HPC batch systems (SLURM, HTCondor), VMs, remote Kubernetes clusters, and serverless backends - via a pluggable provider architecture. It is written in pure Go (module `github.com/interlink-hq/interlink`, Go 1.26 per `go.mod`), with `CGO_ENABLED=0` on every build target.

The project originates from the EU-funded interTwin project and is led by INFN (Istituto Nazionale di Fisica Nucleare, Italy). It is a **CNCF Sandbox project**, accepted March 4, 2025 (per [cncf.io/projects/interlink](https://www.cncf.io/projects/interlink/)). License is Apache 2.0. `GOVERNANCE.md` describes a tiered lazy-consensus model (routine decisions: 1 maintainer approval / 24h; significant decisions: 2 approvals / 5-day window; major decisions: 2/3 supermajority / 14-day discussion). All three listed maintainers in `MAINTAINERS.md` (Diego Ciangottini, Giulio Bianchini, Daniele Spiga) are affiliated with INFN - no corporate/vendor maintainers are listed. CNCF health metrics show 77 contributors / 35 contributing organizations, both trending down year-over-year, with GitHub stars (~46) also declining, indicating a research-institution-led project rather than a heavily corporate-backed one.

On new-port culture: the plugin architecture is stated to be vendor-neutral and open to new backend/platform plugins, explicitly excluding "proprietary vendor-specific implementations unless contributed as open source." A new architecture target such as riscv64 would go through the standard significant-decision review tier (2 maintainer approvals, 5-day window) - there is no evidence of resistance to such a change, but also no evidence it has ever been proposed. [NEEDS VERIFICATION: governance stance is inferred from GOVERNANCE.md text, not from a direct maintainer statement about riscv64 specifically.]

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| - | No riscv64 port has ever been started, proposed, or discussed | [GitHub issue search](https://github.com/interlink-hq/interLink/issues?q=riscv), [PR search](https://github.com/interlink-hq/interLink/pulls?q=riscv), [commit search](https://github.com/interlink-hq/interLink/commits?q=riscv) - all return 0 results |
| 2024-10-21 to 2024-10-22 | Tangentially related: Issue #305 "CI: Support aarch64 build" opened and closed (aarch64/ARM64, not RISC-V) | [interlink-hq/interLink#305](https://github.com/interlink-hq/interLink/issues/305) |

There is no first RISC-V commit, no tracking issue, and no key contributor associated with any riscv64 work. The project is **not upstream on riscv64 at all** - there is nothing to be "fully upstream" for.

## 3. Upstream Support Tier

interLink has no formal architecture support-tier policy document (no `PLATFORMS.md`/`SUPPORT.md` found in the repo). The de facto support tier is defined by the `.goreleaser.yaml` build matrix and the container-image CI matrix, both read directly from the repository:

- `.goreleaser.yaml` `goarch` lists: `virtual-kubelet` binary targets `[arm64, amd64]`; `interlink-api`, `installer`, and `ssh-tunnel` binaries target `[arm64, amd64, ppc64le]`.
- `.github/workflows/build_images.yaml` container image matrix: `linux/amd64, linux/arm64, linux/aarch64` (via QEMU/Buildx), release-triggered on `push: tags: "*"`.

Neither list is release-blocking test coverage for any architecture other than the native `ubuntu-latest` (x86_64) CI runner - no test suite runs under QEMU for arm64 or ppc64le either; those are build/cross-compile targets only for release artifacts.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes (native) | yes (cross-build via QEMU for images; native Go cross-compile for binaries) | no |
| CI tests | yes (native, `integration-test-k3s.yaml`) | no (no arch-matrixed test job) | no |
| Official release binaries | yes | yes | no |
| Official container images | yes | yes | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

interLink has **no architecture-specific subsystems of any kind**. It is a Kubernetes control-plane orchestration tool (HTTP/REST API glue between the Virtual Kubelet framework and pluggable execution-backend sidecars) - there is no JIT, no SIMD, no hand-written crypto, and no inline assembly anywhere in the codebase, for any architecture.

Verification performed on a local clone (`/home/user/interlink-hq/interlink`, HEAD `badedec3fffe509c140ba5e945ffab15388fa792`):
- `find` for `*_riscv64.go`, `*_amd64.go`, `*_arm64.go`, `*_ppc64le.go`, `*_386.go`, `*_arm.go` -> zero files, any architecture.
- `grep -rn "go:build"` for any arch keyword -> zero matches. No per-architecture Go build tags exist anywhere in the project.
- `find . -name '*.S' -o -name '*.s'` -> no assembly files exist in the repo.
- `find . -type d -iname 'arch*'` -> no `arch/` directory of any kind.
- `grep -rIni "riscv"` across the entire repository -> zero matches.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A (none exists) | N/A | N/A |
| SIMD | N/A (none exists) | N/A | N/A |
| Crypto | generic Go `x/crypto` (no arch-specific assembly path in this project's own code) | same | same (functionally correct, no hardware acceleration for any arch in interLink itself) |
| Architecture-conditional source files | 0 | 0 | 0 |

Since the project contains no architecture-conditional application code, riscv64 enablement is purely a matter of adding `riscv64` to the `GOARCH`/build-platform lists - there is no source-level porting work required in interLink's own codebase.

## 5. Build System, Cross-Compilation, and Toolchain

interLink builds with plain `go build` (no CMake, no Cargo, no autoconf - `find . -iname CMakeLists.txt` returns empty). Dockerfiles (`docker/Dockerfile.interlink`, `docker/Dockerfile.vk`, `docker/Dockerfile.refresh-token`) use a `golang:1.26` base image with `CGO_ENABLED=0 GOOS=linux go build ...` and no `--platform`-specific logic, since CGO is disabled and no C compiler is invoked at all.

- **No riscv64 build documentation exists** - no exact cmake/configure commands, no toolchain version requirements, no feature-off flags to report, because none of that machinery exists in this project.
- **No QEMU usage** referenced anywhere in build docs (QEMU is used only in `build_images.yaml` for arm64/aarch64 container cross-builds, not for riscv64).
- **No known riscv64 build failures are documented**, because riscv64 has never been attempted: Go's standard toolchain has supported `GOOS=linux GOARCH=riscv64` since Go 1.14, and since the project is CGO-free, adding `riscv64` to the four `goarch:` lists in `.goreleaser.yaml` and to the `platforms:` list in `build_images.yaml` is, in principle, the entire enablement step - but this has never been proposed, attempted, or discussed in the repository's history.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature/artifact | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `virtual-kubelet` binary | yes | yes | no |
| `interlink-api` (`interlink`) binary | yes | yes | no |
| `interlink-installer` binary | yes | yes | no |
| `ssh-tunnel` binary | yes | yes | no |
| Container image (interlink core, virtual-kubelet, refresh-token) | yes | yes | no |
| CI test execution | yes | no (no arch-matrixed test job for arm64 either) | no |

**Functional gaps:** A riscv64 user cannot obtain any official interLink binary or container image at all - full functional gap, not partial. Since the project ships no ppc64le container image either (ppc64le gets binaries but not images), riscv64's gap is a strict superset of the smallest existing gap.

**Performance gaps:** Not applicable. interLink has no SIMD or numerics hot paths in its own code (Section 4); no performance delta from missing vectorization exists because there was never any to begin with.

**Security hardening gaps:** Not evaluated - no riscv64 build exists to assess hardening flags against.

**NaN/floating-point semantics:** Not applicable - interLink's control-plane code has no floating-point-sensitive computation identified in the research.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for interLink**, confirmed by reading all 9 GitHub Actions workflow files in the repository:

1. `build_docusaurus.yaml` - Docusaurus doc site build. Runner: `ubuntu-latest`. No arch matrix.
2. `build_images.yaml` - Container image builds. Runner: `ubuntu-latest` + QEMU + Buildx. Platforms: `linux/amd64, linux/arm64, linux/aarch64`. No riscv64.
3. `build_openapi.yaml` - OpenAPI spec update. Runner: `ubuntu-latest`.
4. `check-links.yml` - Markdown link checker. Runner: `ubuntu-latest`.
5. `ci.yaml` - "integration-tests" workflow; Dagger-based jobs are disabled (placeholder only, points to `integration-test-k3s.yaml`). Runner: `ubuntu-latest`.
6. `goreleaser.yaml` - Go release via goreleaser. Runner: `ubuntu-latest`.
7. `integration-test-k3s.yaml` - the real e2e test workflow (K3s-based). Runner: `ubuntu-latest`, no arch matrix.
8. `lint.yml` - golangci-lint + jscpd. Runner: `ubuntu-latest`.
9. `scorecard.yml` - OSSF Scorecard. Runner: `ubuntu-latest`.

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.drone.yml`, or `azure-pipelines.yml` exists in the repository. A repository-wide `grep -rIni "riscv"` across the entire cloned working tree returns zero matches. No RISE runner labels or references (`riseproject-dev`, RISE runner names) appear anywhere in any workflow file.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | native `ubuntu-latest` | cross-build via QEMU/Buildx (images only) | none |
| Test execution | yes (`integration-test-k3s.yaml`) | no | no |
| RISE runner usage | no | no | no |

## 8. Distribution and Release Status

**No riscv64 binary or package exists for interLink through any channel checked:**

- **GitHub Releases**: enumerated all assets for recent releases (0.6.1 through 0.7.0-pre2, e.g. [0.6.2 assets](https://github.com/interlink-hq/interLink/releases/expanded_assets/0.6.2)). Architectures shipped: Darwin/arm64, Darwin/x86_64, Linux/arm64, Linux/x86_64, Linux/ppc64le, across all four binaries (`interlink`, `interlink-installer`, `ssh-tunnel`, `virtual-kubelet`). Zero riscv64 filenames in any release.
- **PyPI**: the package named `interlink` on PyPI ([pypi.org/pypi/interlink/json](https://pypi.org/pypi/interlink/json)) is a **name collision** with an unrelated project (author Maximilian/Jannis Kohl, version 0.0.1, "Development Status :: 1 - Planning", zero release files of any architecture) - it is not interLink's upstream PyPI presence and ships no files at all.
- **Ubuntu 26.04 (resolute)**: confirmed via both the project graph DB (SPARQL query against `interlink`, `python3-interlink`, `libinterlink` for `targetArchitecture=riscv64` in suite `resolute` -> zero bindings) and a live fetch of [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Interlink&suite=resolute&searchon=names&section=all) ("Sorry, your search gave no results") - the package does not exist in Ubuntu under any architecture, not just riscv64.
- **Arch Linux RISC-V** (archriscv.felixc.at): no listing for "interlink".
- **Debian, Fedora**: not searched directly in this pass; given Ubuntu's complete absence of the package, presence in Debian/Fedora is considered unlikely but unconfirmed. Data not available: Debian tracker and Fedora package search were not queried.

**What a user must do to get a working riscv64 binary today:** build from source manually - clone the repository, run `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build` against the desired binary target. Since the project is pure Go with no CGO and no architecture-conditional source, this is expected to work without code changes, but it has never been attempted, tested, or documented by any party found in this research. [NEEDS VERIFICATION: no one has empirically confirmed a working riscv64 build.]

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| containerd | Container image/snapshot mgmt, OCI shim | clean, CGO-free | not in upstream CI matrix ([containerd/containerd#13020](https://github.com/containerd/containerd/issues/13020), open) | ships since v1.6.8 (2022) | Active riscv64 CI-matrix PR open ([containerd/containerd#13124](https://github.com/containerd/containerd/pull/13124)) |
| runc | OCI runtime under containerd | clean | integration tests added ([opencontainers/runc#5166](https://github.com/opencontainers/runc/issues/5166), closed) | ships v1.5.0+ | CRIU checkpoint/restore unsupported on riscv64 ([criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2019) |
| Docker/moby (supported execution backend, not a go.mod dep) | VM/edge-node container execution provider | clean via distro source builds | no dedicated upstream riscv64 CI | no official upstream binary (download.docker.com has no riscv64/ dir) | [moby/moby#44319](https://github.com/moby/moby/issues/44319) (open since 2022), [#44735](https://github.com/moby/moby/pull/44735) (draft, unmerged since Jan 2023) |
| k8s.io client libs (`k8s.io/api`, `apimachinery`, `client-go`, `cri-api`, `cri-client`, `kubelet`) | Pod spec types, API client, CRI types | clean as Go source | no release-blocking riscv64 CI | no official riscv64 binaries for kubelet/kubectl | Open, untriaged proposal for official RISC-V/RVA23 support: [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) |
| virtual-kubelet (`virtual-kubelet/virtual-kubelet`, replaced by `superfly/virtual-kubelet` fork) | Core framework for interLink's Virtual Node | pure Go, CGO-free | none found | N/A (library) | zero riscv64 issues found on either repo |
| golang.org/x/crypto v0.38.0 | TLS/mTLS, OAuth2, SSH-tunnel crypto | clean - generic Go fallback (no assembly-optimized path for riscv64; only amd64/arm64/s390x/ppc64 get accelerated ChaCha20/Poly1305 etc.) | none found | N/A (library) | functionally correct, not vector-accelerated on riscv64 |
| google.golang.org/grpc v1.72.2 | RPC transport, OTLP export | clean, CGO-free | none found | N/A (library) | none found |
| go.opentelemetry.io/otel v1.36.0 | Tracing/metrics | clean, CGO-free | none found | N/A (library) | none found |

**Deep-dive:** interLink itself carries essentially no riscv64 risk from its own Go dependency tree - every direct Go module is pure/CGO-free and compiles on riscv64 without known open issues, since Go has had first-class (Tier-1) riscv64 support since Go 1.22 and none of these modules require CGO. The real exposure sits in the **execution backends interLink orchestrates but does not vendor as Go code**: containerd and runc are solid (riscv64 release binaries have shipped since 2022, remaining gaps are CI-matrix coverage and CRIU only); Docker/moby is the weakest link (no official upstream riscv64 binary as of a 2022 tracking issue and an unmerged 2023 draft PR, though Ubuntu's downstream `docker.io` package does build for riscv64 as a stopgap); Kubernetes has no assigned riscv64 support tier upstream at all, with only an open, untriaged proposal as forward motion. Full detail is in the existing project reports: [containerd.md](../containerd.md), [docker.md](../docker.md), [kubernetes.md](../kubernetes.md). The HPC-side execution backends interLink's README lists (SLURM, HTCondor, Apptainer/Singularity, Enroot) live in separate plugin repos (e.g. `interlink-hq/interlink-slurm-plugin`) not covered by this research pass.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issues, PRs, or commits exist | N/A | N/A | Confirmed via `search_issues(query="riscv")` -> 0, `search_pull_requests(query="riscv")` -> 0, `search_code(query="riscv64 repo:interlink-hq/interLink")` -> 0, `search_issues(query="risc-v")` -> 0, and a full local repo grep -> 0 matches |
| [#305](https://github.com/interlink-hq/interLink/issues/305) | "CI: Support aarch64 build" | Closed (2024-10-22) | N/A to RISC-V | Tangential only - about aarch64 (ARM64), surfaced by keyword overlap with "riscv64" in fuzzy search, not a RISC-V issue |

No correctness or performance bugs exist to highlight, because there is no riscv64 build or CI surface on which such bugs could be observed or reported.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer statement, issue, or discussion opposes riscv64 support.

**Technical blockers:** None identified in interLink's own code (pure Go, CGO-free, no architecture-conditional source - Section 4). The only technical blockers found sit in dependencies outside interLink's control: Docker/moby's lack of an official riscv64 binary ([moby/moby#44319](https://github.com/moby/moby/issues/44319)) would affect Docker-backed providers specifically, and Kubernetes's lack of an assigned riscv64 support tier ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836)) would affect the "Remote Kubernetes" provider. Neither blocks interLink's own core binaries or containerd/runc-backed providers.

**Organizational blockers:** None identified. The project's governance (Section 1) requires only a significant-decision review (2 maintainer approvals, 5-day window) for a change of this scope, and the plugin architecture is explicitly stated to welcome new open-source backend/platform contributions.

**Acceptance probability:** Given the absence of any stated objection, the absence of any technical blocker in interLink's own codebase, and a governance process that does not single out architecture additions for extra scrutiny, a well-formed riscv64 PR (adding `riscv64` to the `goarch` lists in `.goreleaser.yaml` and the `platforms` list in `build_images.yaml`) faces no known upstream resistance. [NEEDS VERIFICATION: this assessment is inferred from governance documents and the absence of negative signals, not from a maintainer's direct statement on riscv64.] The limiting factor is that no one has proposed it yet - there is no demand signal from the RISC-V community (interLink is not a RISE member, and no RISE blog post, funding record, or repository references it).

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** interLink has no upstream riscv64 CI of any kind - all 9 GitHub Actions workflows run exclusively on `ubuntu-latest`, and the only multi-architecture step ([build_images.yaml](https://github.com/interlink-hq/interLink/blob/main/.github/workflows/build_images.yaml)) targets `linux/amd64, linux/arm64, linux/aarch64` with riscv64 absent; the Go binary release matrix in [.goreleaser.yaml](https://github.com/interlink-hq/interLink/blob/main/.goreleaser.yaml) is limited to `arm64`, `amd64`, and `ppc64le`. Per Step 1 of the color model, no upstream CI sets a baseline of orange. The distribution floor does not apply and cannot raise this: interLink is not packaged in Ubuntu 26.04 under any candidate name at all (confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Interlink&suite=resolute&searchon=names&section=all), "Sorry, your search gave no results"), so there is no distro build - patched or unpatched - to raise the grade to yellow. No release binary, container image, or package of any kind is available for riscv64 through any channel checked (GitHub Releases, PyPI, Ubuntu, Arch Linux RISC-V).
- This is not an optimization-purpose project (Kubernetes control-plane orchestration tool with no SIMD/JIT/numerics-tuning purpose), so the Step 2 optimization modifier does not apply and no Optimization level is reported.
- **Pending work that could change the grade:** None found. No open PR, no tracking issue, and no RISE involvement of any kind exists for interLink's riscv64 support (interLink does not appear in RISE's member list, blog, or repositories - checked directly at [riseproject.dev/members](https://riseproject.dev/) and via the RISE blog RSS feed). Because the project is pure Go, CGO-free, and has no architecture-conditional source code, the technical lift to reach yellow/blue is small (adding `riscv64` to two build-matrix lists plus validating the resulting binary), but as of this report no party has undertaken it.

## 14. Investment Analysis

RISE has done no work on or funding of interLink specifically - confirmed via the RISE member list, blog RSS feed (34 most recent posts scanned, zero mentions), and the `riseproject-dev` GitHub org's 25 public repositories (none reference interLink). All investment below is therefore unclaimed.

### 14.1 Functional Enablement

Add `riscv64` to the `goarch` lists for all four binaries in `.goreleaser.yaml`, add `linux/riscv64` to the `platforms` list in `build_images.yaml`, and validate that `go build` and the resulting container images actually run correctly on riscv64 hardware or QEMU (nothing in this research confirms an empirical build has ever been attempted). Since the project is CGO-free with zero architecture-conditional source, no code porting is expected to be needed - this is primarily a CI/build-matrix change plus validation.

### 14.2 Performance Optimization

Not applicable. interLink has no SIMD, JIT, or numerics hot paths in its own code; there is no optimization work specific to this project. Any performance characteristics would flow entirely from the Go runtime and the execution backends it orchestrates (containerd, runc, etc.), which are covered in their own project reports.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to the existing GitHub Actions workflows: extend `build_images.yaml`'s QEMU/Buildx matrix and `goreleaser.yaml`'s release build to include riscv64, and ideally extend `integration-test-k3s.yaml` (the real e2e test workflow) to run against a riscv64 target so that riscv64 gets actual test coverage rather than build-only status, which would be required to reach blue rather than yellow.

### 14.4 Ecosystem Enablement

Not applicable - interLink has no significant dependent package ecosystem of its own (Section 10 omitted; it is a standalone control-plane tool, not a library with npm/PyPI/Maven consumers). The relevant ecosystem-adjacent work is in its execution-backend dependencies (Docker/moby, Kubernetes) and their own riscv64 status, tracked in their respective project reports.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to `.goreleaser.yaml` goarch lists and `build_images.yaml` platforms list; validate build | 1-2 | Upstream (INFN maintainers) or third-party contributor | High |
| Functional | Empirically validate a riscv64 binary/image runs correctly (no prior attempt found) | 1 | Upstream or third-party contributor | High |
| CI/CD | Add riscv64 job to `integration-test-k3s.yaml` for actual test execution (needed for blue) | 1-2 | Upstream maintainers | Medium |
| Dependencies | Track and, if needed, contribute to Docker/moby riscv64 binary availability ([moby/moby#44319](https://github.com/moby/moby/issues/44319)) for Docker-backed providers | N/A (external project) | External (moby maintainers) | Low (workaround exists via Ubuntu's `docker.io` riscv64 package) |
| Dependencies | Track Kubernetes riscv64 support tier proposal ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836)) for Remote Kubernetes provider | N/A (external project) | External (Kubernetes SIG) | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [interlink-hq/interLink GitHub repository](https://github.com/interlink-hq/interLink)
- [interLink homepage](https://interlink-project.dev/)
- [interLink issue search: "riscv"](https://github.com/interlink-hq/interLink/issues?q=riscv)
- [interLink pull request search: "riscv"](https://github.com/interlink-hq/interLink/pulls?q=riscv)
- [interlink-hq/interLink#305 - CI: Support aarch64 build](https://github.com/interlink-hq/interLink/issues/305)
- [.github/workflows/build_images.yaml](https://github.com/interlink-hq/interLink/blob/main/.github/workflows/build_images.yaml)
- [.goreleaser.yaml](https://github.com/interlink-hq/interLink/blob/main/.goreleaser.yaml)
- [GOVERNANCE.md](https://github.com/interlink-hq/interLink/blob/main/GOVERNANCE.md)
- [MAINTAINERS.md](https://github.com/interlink-hq/interLink/blob/main/MAINTAINERS.md)
- [CNCF Sandbox project listing - interLink](https://www.cncf.io/projects/interlink/)
- [GitHub Releases 0.6.2 asset listing](https://github.com/interlink-hq/interLink/releases/expanded_assets/0.6.2)
- [GitHub Releases 0.7.0-pre2 asset listing](https://github.com/interlink-hq/interLink/releases/expanded_assets/0.7.0-pre2)
- [PyPI JSON API - interlink (unrelated name-collision package)](https://pypi.org/pypi/interlink/json)
- [Ubuntu packages search - Interlink, resolute suite](https://packages.ubuntu.com/search?keywords=Interlink&suite=resolute&searchon=names&section=all)
- [RISE Project members](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [containerd/containerd#13020 - riscv64 CI matrix](https://github.com/containerd/containerd/issues/13020)
- [containerd/containerd#13124 - add riscv64 to CI matrix](https://github.com/containerd/containerd/pull/13124)
- [opencontainers/runc#5166 - riscv64 integration tests](https://github.com/opencontainers/runc/issues/5166)
- [checkpoint-restore/criu#1702 - CRIU riscv64 unsupported](https://github.com/checkpoint-restore/criu/issues/1702)
- [moby/moby#44319 - riscv64 tracking issue](https://github.com/moby/moby/issues/44319)
- [moby/moby#44735 - riscv64 draft PR](https://github.com/moby/moby/pull/44735)
- [kubernetes/kubernetes#132836 - official RISC-V/RVA23 support proposal](https://github.com/kubernetes/kubernetes/issues/132836)
- Local clone of interlink-hq/interLink at `/home/user/interlink-hq/interlink`, HEAD `badedec3fffe509c140ba5e945ffab15388fa792`
- [containerd project report](../containerd.md)
- [Docker project report](../docker.md)
- [Kubernetes project report](../kubernetes.md)