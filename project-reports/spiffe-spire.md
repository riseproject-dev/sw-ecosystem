---
title: SPIFFE / SPIRE
parent: Project Reports
color: orange
---

# SPIFFE / SPIRE

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for SPIFFE / SPIRE<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SPIFFE (Secure Production Identity Framework For Everyone) defines a workload-identity standard, and SPIRE (the SPIFFE Runtime Environment) is its reference implementation: a Go-based control plane (`spire-server`, `spire-agent`, plus an OIDC discovery provider) that performs node and workload attestation and issues X.509/JWT SVIDs (identity documents) to production workloads.

SPIRE is hosted by the **Cloud Native Computing Foundation (CNCF)**, accepted 2018-03-29, and currently carries **Graduated** status in the Key Management category. License is **Apache License 2.0**.

Governance follows the SPIFFE project's model, reporting to the **SPIFFE Technical Steering Committee (TSC)**, engaged only for serious maintainer disputes (described in `MAINTAINERS.md` as never yet needed in practice). The project deliberately keeps **5 maintainer seats** (odd number, to ease dispute resolution). Involuntary removal requires unanimous vote of the remaining maintainers, capped at one removal per 9-month window, with CNCF notified of all changes.

Corporate maintainer roster (from `CODEOWNERS`):

| Maintainer | GitHub | Company |
|---|---|---|
| Evan Gilman | @evan2645 | SPIRL, Inc. |
| Agustin Martinez Fayo | @amartinezfayo | Hewlett Packard Enterprise (HPE) |
| Sorin Dumitru | @sorindumitru | Bloomberg L.P. |
| Marcos Yacob | @MarcosDY | Hewlett Packard Enterprise (HPE) |
| Ryan Turner | @rturner3 | Cielara AI |
| Community Chair: Umair Khan | @umairmkhan | Stacklet, Inc. |

HPE holds 2 of 5 maintainer seats, the largest single corporate presence in governance. `ADOPTERS.md` lists a broad adopter base (Anthem, Bloomberg, ByteDance, Duke Energy, GitHub, Netflix, Niantic, Pinterest, Square, Twilio, Uber, Unity) and a wider user list including Amazon, Anthropic, Arm, Cisco, F5, HashiCorp, HPE, Intel, Google, IBM, SAP, VMware.

**Community stance on new ports**: `doc/supported_operating_systems.md` states the project is "open to adding operating systems to the officially supported list" but frames this explicitly as an ongoing maintenance commitment, not a one-time patch: a new platform requires in-tree node **and** workload attestor implementations, a dedicated CI runner running the integration suite on every PR, and a committed long-term community maintainer. No one has opened an issue, PR, or discussion proposing RISC-V support as of this report.

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. There is no tracking issue, no port pull request, and no commit anywhere in `spiffe/spire` that adds, discusses, or references RISC-V support in SPIRE's own code, build system, or documentation.

Every GitHub search performed (`mcp__github__search_issues`, `search_pull_requests`, `search_commits`, `search_code`, scoped to `repo:spiffe/spire`, plus general org-wide queries) for `riscv`, `riscv64`, and `risc-v` returns either zero results or only incidental Dependabot dependency-bump PRs whose *upstream* dependency changelog happens to mention "riscv" (see Sections 9 and 11 for the full list). None of these PRs touch SPIRE's own source, build matrix, or documentation.

| Date | Event | Source |
|---|---|---|
| n/a | No RISC-V port work of any kind exists in spiffe/spire | [GitHub code search](https://github.com/spiffe/spire), 0 hits for "riscv"/"riscv64" |

There are no contributors, corporate or individual, associated with RISC-V work on this project because no such work exists. The project is not fully upstream on RISC-V; it is entirely absent from RISC-V.

## 3. Upstream Support Tier

`doc/supported_operating_systems.md` defines a formal, two-tier support policy:

- **Officially supported**: Linux, Windows. Built and released with full CI (unit + integration tests) on every PR; bugs are treated as project bugs.
- **Supported for development**: macOS. Builds and unit tests run in CI, no integration tests, best-effort issue handling.
- **Everything else** (explicitly, per the doc): "receives no project attention at all."

Formal criteria to promote a platform to officially-supported status: (1) in-tree node **and** workload attestor implementations, (2) a dedicated CI runner so the integration suite runs on every PR, and (3) a committed community maintainer for the long haul ("Maintainers cannot take this on for platforms they do not run"). None of these three prerequisites exist for riscv64.

| Architecture | Build (upstream CI) | Test (upstream CI) | Official release artifact |
|---|---|---|---|
| amd64/x64 | Yes | Yes (unit + integration) | Yes (`spire-*-linux-amd64-musl.tar.gz`) |
| arm64 | Yes | Yes (unit + integration) | Yes (`spire-*-linux-arm64-musl.tar.gz`) |
| riscv64 | No | No | No |

Source: [`pr_build.yaml`](https://github.com/spiffe/spire/blob/main/.github/workflows/pr_build.yaml) and [`release_build.yaml`](https://github.com/spiffe/spire/blob/main/.github/workflows/release_build.yaml), both read directly at commit `b232c970fcb66be40f334f57c0c462996a15c25c`, confirm `arch: [x64, arm64]` as the complete build matrix in both files, with no third entry.

## 4. Technical Architecture and RISC-V-Specific Subsystems

SPIRE has **no architecture-specific source code for any architecture**. It is a pure-Go application with one cgo dependency (`mattn/go-sqlite3`, gated behind an optional `sqlite3` datastore backend) and no hand-written assembly, no SIMD/vector kernels, and no JIT compiler of its own.

Repository-wide search confirms this:
- `mcp__github__search_code` queries for `__riscv repo:spiffe/spire`, `riscv64 repo:spiffe/spire`, and `GOARCH repo:spiffe/spire` each returned 0 results (control query `package main` returned 459 hits, confirming the index itself is live).
- Full local-clone grep (`grep -rniE "riscv|risc-v" .`, excluding `.git`) returned 0 matches anywhere in source, docs, tests, CI, or shell scripts.
- Only one Go file in the entire repository references `amd64` at all (`pkg/agent/plugin/workloadattestor/k8s/k8s_posix_test.go`), and that reference is a container-image tag string in a test fixture (`quay.io/coreos/flannel:v0.9.0-amd64`), not an architecture-conditional code path. Zero Go files reference `arm64`. The only `//go:build` constraint found in the codebase (`!windows`) is OS-level, not CPU-architecture-level.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-written assembly / SIMD | None (pure Go) | None (pure Go) | None (pure Go) - N/A, none exists for any arch |
| JIT compiler | None in SPIRE itself | None in SPIRE itself | None in SPIRE itself |
| cgo (SQLite datastore) | Standard gcc toolchain | Standard gcc toolchain | Untested - no riscv64 gcc cross-toolchain wired into the Dockerfile/Makefile |
| Crypto (TLS/SVID signing) | Go stdlib + `golang.org/x/crypto`, portable | Go stdlib + `golang.org/x/crypto`, portable | Portable Go fallback available (per-arch assembly in `x/crypto` degrades gracefully; not verified end-to-end for SPIRE's build) |

Because SPIRE implements no per-architecture compute logic anywhere, its amd64/arm64 "support" is entirely a build/release-infrastructure property (CI matrix membership plus Docker `TARGETARCH` branching), not a code-quality property. riscv64 is absent at that same infrastructure layer, not as a degraded/stub implementation, so there is nothing to grade as partial, minimal, or scalar - it is simply not present as a build target.

## 5. Build System, Cross-Compilation, and Toolchain

SPIRE is a pure Go project with **no CMake build system** - there is no `CMakeLists.txt`, no `cmake/` directory, and no toolchain files anywhere in the repository. Build orchestration is a top-level `Makefile` that wraps the Go toolchain (`go build`, `go test`, protoc codegen) plus a `Dockerfile` for containerized multi-arch builds.

- Go version pinned via `.go-version` and `go.mod`: **1.27.1**. No separately stated minimum GCC/Clang version exists in the repository; the Alpine-based Docker builder installs `clang`, `lld`, `build-base`, `musl-dev` at whatever version ships with `alpine3.23`, unpinned.
- Main `Dockerfile` uses `tonistiigi/xx:1.7.0` (a generic Clang-based cross-compilation helper, not QEMU) inside a `golang:1.27.1-alpine3.23` base, with `CGO_ENABLED=1` and `libseccomp-dev` installed via `xx-apk`. `TARGETARCH` handling explicitly special-cases only `arm64` and `s390x` for the musl `CC` cross-compiler prefix (`aarch64-alpine-linux-musl`, `s390x-alpine-linux-musl`); there is no riscv64 branch.
- `.github/workflows/scripts/build_linux_artifacts.sh` hardcodes its entire architecture dispatch as two lines: `build_artifact amd64` and `build_artifact arm64` - no riscv64 call exists, commented out or otherwise.
- The Makefile's OS/architecture autodetection block explicitly errors out (`$(error unsupported ARCH: $(arch1))`) for any architecture other than `x86_64`, `aarch64`/`arm64`, `s390x`, and `ppc64le`. riscv64 would hit this error path if attempted.
- No QEMU usage exists anywhere in the Makefile or Dockerfiles for any supported architecture - cross-compilation uses Clang via `xx`, not emulation.
- No `BUILDING.md`, `docs/building.md`, or `docs/cross-compilation.md` exists; build instructions live in `CONTRIBUTING.md` under "## Building" (`make`, `make all`, `make bin/spire-server`, `make bin/spire-agent`, `make bin/oidc-discovery-provider`, `make images`, `make test`).

**Known build failures on riscv64**: none documented, because no one has attempted or reported a riscv64 build. This is an untested gap, not a confirmed failure - Go's standard `GOARCH=riscv64` cross-compilation would very likely produce a working binary for the pure-Go portions, but the cgo-gated SQLite datastore path and the Docker/Makefile toolchain plumbing above would require new work (a riscv64 gcc cross-toolchain wired into `xx`/Alpine, plus a new `TARGETARCH` branch and Makefile arch-detection entry) before an official riscv64 artifact could be produced through the existing pipeline.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| spire-server binary | Builds, tested, released | Builds, tested, released | Not built, not tested, not released |
| spire-agent binary | Builds, tested, released | Builds, tested, released | Not built, not tested, not released |
| Node attestor plugins | Full | Full | Untested (no riscv64-specific attestor gap identified, but never exercised) |
| Workload attestor plugins | Full | Full | Untested |
| SQLite datastore (cgo) | Works | Works | Untested - no riscv64 cross-toolchain wired in |
| Container images (`ghcr.io/spiffe/spire-server`, etc.) | Published | Published | Not published |
| OIDC discovery provider | Built, released | Built, released | Not built, not released |

There is no performance-gap analysis to make: SPIRE has no SIMD/vector code paths on any architecture (Section 4), so there is no "missing SIMD" delta to characterize on riscv64 relative to amd64/arm64 - the gap is purely one of build/test/release existence, not of execution quality once built.

**Security hardening gaps**: not evaluable - since no riscv64 build has ever been produced or tested, there is no data on whether SPIRE's seccomp profile, cgo/SQLite linkage, or crypto stack behave correctly on riscv64. This is an unknown, not a confirmed absence of hardening.

**NaN / floating-point semantics issues**: none found or applicable - SPIRE's control-plane logic (attestation, SVID issuance, X.509/JWT signing) does no floating-point numerical computation of the kind that would expose RISC-V floating-point semantics differences.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for SPIFFE/SPIRE.** This was verified by direct content reads (not GitHub search alone) of every file in `.github/workflows/`: `assign_reviewer.yaml`, `assign_reviewer_review_apply.yaml`, `assign_reviewer_review_capture.yaml`, `dco.yaml`, `dependabot_milestone.yml`, `depsreview.yaml`, `milestone_check.yaml`, `nightly_build.yaml`, `pr_build.yaml`, `release_build.yaml`, `stalebot.yaml`. Zero case-insensitive matches for `riscv`/`RISCV`/`RISC-V` in any of them. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

Runner/architecture inventory read directly from [`pr_build.yaml`](https://github.com/spiffe/spire/blob/main/.github/workflows/pr_build.yaml) and [`release_build.yaml`](https://github.com/spiffe/spire/blob/main/.github/workflows/release_build.yaml):
- Runners used: `ubuntu-22.04`, `ubuntu-24.04`, `ubuntu-24.04-arm`, `ubuntu-22.04-arm`, `windows-2022`, `ubuntu-latest`.
- Build matrix `arch:` values in both files: `[x64, arm64]` only.
- `nightly_build.yaml` has only two jobs, both `runs-on: ubuntu-22.04`, with no arch matrix at all.
- No riscv64 runner label, no QEMU-based riscv64 emulation step, and no riscv64 cross-compilation target anywhere in the workflow set.
- No use of RISE RISC-V runners (no reference to `riseproject-dev` or any RISE runner label anywhere in the workflow files).

| | amd64/x64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-24.04`/`ubuntu-22.04`) | Yes (`ubuntu-24.04-arm`/`ubuntu-22.04-arm`) | No |
| CI runs tests | Yes (unit + integration) | Yes (unit + integration) | No |
| CI publishes release artifact | Yes | Yes | No |
| Runner type | Native GitHub-hosted (`ubuntu-*`) | Native GitHub-hosted (`ubuntu-*-arm`) | N/A |
| RISE runner usage | No | No | No |

RISE (riseproject.dev) has no involvement with SPIFFE/SPIRE whatsoever: it is not a RISE member project, has no RISE blog post, no dedicated repo in the `riseproject-dev` GitHub org (25 repos checked, none SPIFFE/SPIRE-related via both `search_repositories` and `search_code`), and no RISE runner usage. The only mentions of SPIFFE/SPIRE found in RISE-adjacent or local tracking material are (1) an unactioned candidate entry in this repository's own `project-reports/.queue.yml`, and (2) `spiffe/go-spiffe` appearing as a third-party dependency in an unrelated Traefik RISC-V readiness report - neither reflects RISE project involvement with SPIRE itself.

## 8. Distribution and Release Status

**No official riscv64 binaries exist for SPIFFE/SPIRE from any channel checked.**

- **GitHub Releases**: latest release v1.15.3 (2026-08-21) assets are `spire-1.15.3-linux-amd64-musl.tar.gz`, `spire-1.15.3-linux-arm64-musl.tar.gz`, `spire-1.15.3-windows-amd64.zip`, plus matching `spire-extras-*` bundles, sha256sums, and source archives. Zero asset filenames in any recent release contain "riscv" or "riscv64". Source: [spiffe/spire releases](https://github.com/spiffe/spire/releases).
- **PyPI**: the `spiffe` package (a separate, minor Python SDK, not the Go server/agent) publishes pure-Python `py3-none-any` wheels and sdists across all 38 files, versions 0.1.0-0.3.1 - architecture-independent by construction, so this is not evidence either way about the compiled Go binaries. Source: [pypi.org/pypi/spiffe/json](https://pypi.org/pypi/spiffe/json).
- **RISE Python wheel builder**: request to `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/spiffe/` returned an HTTP 302 redirect to `pypi.org`, i.e. RISE does not host a dedicated build for this package - it defers to upstream PyPI (which, as above, is pure-Python anyway).
- **Ubuntu (all suites, including resolute/26.04)**: **no `spire`, `spiffe`, `spire-server`, or `spire-agent` binary package exists in any suite.** The only match is `golang-github-spiffe-spire-api-sdk-dev` (present in noble, questing, resolute), architecture **`all`** - a Go source/protobuf-definitions library, not a compiled SPIRE binary. Source: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=spire&suite=resolute).
- **Arch Linux RISC-V port** (`archriscv.felixc.at`): zero matches for "spire" or "spiffe".
- **OCI/container images** (`ghcr.io/spiffe/spire-server`, `spire-agent`, `oidc-discovery-provider`): published for amd64/arm64 only, consistent with the release_build.yaml `arch: [x64, arm64]` matrix; no riscv64 platform tag found.

**What a user must do today to get a working riscv64 binary**: build from source with the standard Go toolchain (`GOARCH=riscv64 GOOS=linux go build ./cmd/spire-server` and equivalent for `spire-agent`), bypassing the project's own Makefile/Docker pipeline (which errors out on unrecognized architectures per Section 5) or patching around that limitation. If the SQLite datastore backend is required, a riscv64 gcc cross-toolchain must also be available since that path uses cgo. This is unverified as a working procedure - no one has reported attempting or succeeding at it upstream.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| `tetratelabs/wazero` (now `wazero/wazero`) | JIT/AOT WASM runtime, transitive via `open-policy-agent/opa` | Builds (pure Go, no cgo) | Interpreter engine tested on riscv64 upstream; **Compiler (JIT/AOT) engine explicitly unsupported on riscv64** per project README compatibility matrix | Go module, source-built | Structural gap: no JIT backend for riscv64, falls back to slower interpreter. Closed issue [wazero/wazero#249](https://github.com/wazero/wazero/issues/249) (resolved); no open riscv64 issues found. |
| `open-policy-agent/opa` | Embedded Rego policy engine; optional WASM target pulls in wazero | Builds (pure Go) | No dedicated riscv64 CI found upstream | Go module | Inherits wazero's WASM-path JIT gap; risk applies only if SPIRE exercises the WASM policy-evaluation path. |
| `mattn/go-sqlite3` | cgo binding for optional SQLite datastore backend | Requires working cgo + riscv64 C toolchain; no riscv64-specific code issues found | No go-sqlite3-specific riscv64 CI found | Go module, source-built | Underlying C SQLite engine is functionally complete on riscv64 (portable C, no SIMD/JIT) per separate SQLite research; no riscv64-specific issues open or closed for go-sqlite3 itself. |
| `cloudflare/circl` | Advanced crypto primitives (incl. post-quantum), via JOSE/signing chain | Portable Go fallback on riscv64 (hand-asm only for amd64/arm64) | No riscv64-specific issues found | Go module | 1 unrelated open generic-impl issue (#120, P384); no riscv64 issues. |
| `decred/dcrd/dcrec/secp256k1/v4` | secp256k1 elliptic-curve crypto | Portable Go fallback on riscv64 | No issues found | Go module | 0 riscv64-related results. |
| `klauspost/compress` | Compression codecs, transitive dependency | Portable Go fallback on riscv64 | No riscv64 issues found | Go module | 1 unrelated closed issue (#532, aarch64 timeout). |
| `golang/snappy` | Compression codec (distinct from C++ google/snappy) | Portable Go fallback on riscv64 | No riscv64 issues found | Go module | Do not conflate with the C++ `google/snappy` project, which has separate, unrelated RVV work in flight. |
| `golang.org/x/crypto` | TLS/crypto primitives (chacha20poly1305, curve25519, etc.) | Portable Go fallback on riscv64; per-arch assembly for amd64/arm64/s390x | riscv64 is a Tier-2 Go port exercised by the Go project's own build infrastructure | Go module | None found specific to this package. |
| `filippo.io/edwards25519` | Ed25519 crypto (indirect) | Pure Go, architecture-neutral by construction | No riscv64 concerns | Go module | None. |

**Critical-dependency deep dive**: the only structural, unresolved riscv64 gap among SPIRE's dependencies is **wazero's missing JIT/Compiler backend on riscv64**, which transitively affects `open-policy-agent/opa`'s optional WASM policy-execution path. All other flagged dependencies (crypto and compression libraries) degrade gracefully to a portable Go scalar fallback on riscv64 with no reported functional blockers. Note that the SPIRE toolchain manifest is `go.mod` only - the project has no `CMakeLists.txt`, `setup.py`, or `Cargo.toml`.

**Unresolved research gap**: the `project-graph` MCP server was unavailable for this entire research pass (`CONNECTION_CLOSED`), so the two SPARQL queries against the Ubuntu 26.04 (resolute) package graph for `golang-1.27`/`golang-go` and `gcc-riscv64-linux-gnu` toolchain availability could not be run. This is a tooling outage, not a confirmed finding either way, and should be re-run once the server reconnects.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| n/a | No riscv64-related issue, PR, or commit exists in spiffe/spire | n/a | n/a | Confirmed via `mcp__github__search_issues`/`search_pull_requests`/`search_commits`/`search_code` for `riscv`, `riscv64`, `risc-v` scoped to `repo:spiffe/spire` - all return 0 results for issues/commits |
| [PR #4409](https://github.com/spiffe/spire/pull/4409) | Bump golang.org/x/sys from 0.10.0 to 0.11.0 | Merged 2023-08-08 | n/a (not a SPIRE-side change) | Dependency changelog mentions "unix: add riscv_hwprobe for riscv64" - unrelated to SPIRE code |
| [PR #4933](https://github.com/spiffe/spire/pull/4933) | Bump github.com/shirou/gopsutil/v3 from 3.24.1 to 3.24.2 | Merged 2024-03-03 | n/a | gopsutil changelog mentions "add support for OpenBSD/riscv64" - unrelated |
| [PR #5465](https://github.com/spiffe/spire/pull/5465) | Bump golang.org/x/sys from 0.24.0 to 0.25.0 | Merged 2024-09-05 | n/a | x/sys changelog: "update riscv64 hwprobe to Linux kernel 6.10" - unrelated |
| [PR #6047](https://github.com/spiffe/spire/pull/6047) | Bump golang.org/x/sys from 0.32.0 to 0.33.0 | Merged 2025-05-08 | n/a | x/sys changelog: "cpu: add crypto extensions detection for riscv64" - unrelated |
| [PR #6095](https://github.com/spiffe/spire/pull/6095) | Bump github.com/docker/docker from 28.1.1 to 28.2.1+incompatible | Closed without merging (superseded by #6097) | n/a | Docker's seccomp profile changelog mentions `riscv_hwprobe` syscall allowlisting - never shipped via this PR |
| [PR #6457](https://github.com/spiffe/spire/pull/6457) | Bump github.com/google/go-containerregistry from 0.20.6 to 0.20.7 | Merged 2025-11-30 | n/a | changelog mentions "Build artifacts for riscv64" - unrelated to SPIRE |
| [PR #6526](https://github.com/spiffe/spire/pull/6526) | Bump github.com/shirou/gopsutil/v4 from 4.25.11 to 4.25.12 | Merged 2026-01-01 | n/a | gopsutil release notes: "[cpu][linux]: add riscv cpu parser" - unrelated |
| [PR #6979](https://github.com/spiffe/spire/pull/6979) | Bump the golang-org-x group across 1 directory with 3 updates | Merged 2026-05-26 | n/a | x/sys changelog: "cpu: detect zbc extension on riscv64" - unrelated |
| [PR #7227](https://github.com/spiffe/spire/pull/7227) | build(deps): bump the minor-and-patch group with 16 updates | Merged 2026-08-20 | n/a | x/crypto changelog: "crypto/internal/poly1305: provide optimised assembly for riscv64" - unrelated |

**Correctness bugs**: none found or applicable - since no riscv64 build has ever been produced by this project, there is no reported runtime behavior (correct or incorrect) to evaluate. No NaN/floating-point issues were found because SPIRE performs no relevant floating-point computation (Section 6).

All nine "riscv"-mentioning PRs above are Dependabot dependency bumps whose bodies incidentally quote an upstream dependency's own changelog text; none is a tracking issue, port PR, or CI change for SPIRE itself.

## 12. Objections and Upstream Blockers

**Stated objections**: none found - no maintainer has commented for or against RISC-V support, because no one has proposed it.

**Technical blockers**:
1. No riscv64 entry in the CI build matrix (`pr_build.yaml`, `release_build.yaml`) - would need to be added.
2. No riscv64 branch in the Dockerfile's `TARGETARCH` handling and no riscv64 gcc cross-toolchain wired into the Alpine/`xx` build path (needed for the cgo-gated SQLite datastore).
3. Makefile's architecture-detection block explicitly errors on unrecognized architectures - needs a new case for riscv64.
4. wazero (transitive, via OPA's optional WASM path) has no JIT/Compiler backend for riscv64 - only relevant if SPIRE's WASM policy-evaluation path is exercised in production configurations.

**Organizational blockers**: per `doc/supported_operating_systems.md`, official support requires (1) in-tree node and workload attestor implementations for the platform, (2) a dedicated CI runner running the integration suite on every PR, and (3) a committed long-term community maintainer. None of these three exist for riscv64 today, and standing up all three is an explicit prerequisite the maintainers have stated they will hold to ("Maintainers cannot take this on for platforms they do not run").

**Acceptance probability**: the stated policy is that the project is open in principle to new platforms, and the technical blockers are modest (SPIRE has no per-architecture source code to port - Section 4). The primary blocker is organizational: nobody has stepped up as a committed riscv64 maintainer, and no CI runner has been contributed. Given the policy's explicit precondition list, a well-resourced sponsor (silicon vendor or RISE-adjacent effort) contributing CI infrastructure and a maintainer commitment would likely be well received, but as of this report no such effort has been initiated.

## 13. Readiness Assessment

- **Color:** orange (from skill invocation of `/project-color-coding` against this project's findings; case is "no upstream CI and no distro package," the closest fit among the model's orange sub-cases)
- **Release provider:** none - no channel (upstream, RISE, distro, or third party) publishes a riscv64 artifact for SPIFFE/SPIRE.
- SPIRE is **not** an optimization-purpose project (it is an identity/attestation control plane, not a project whose value proposition depends on algorithmic speed), so the Step 2 optimization modifier does not apply and no Optimization level is reported.
- **Justification**: Upstream CI's build matrix is `arch: [x64, arm64]` only, confirmed by direct reads of [`pr_build.yaml`](https://github.com/spiffe/spire/blob/main/.github/workflows/pr_build.yaml) and [`release_build.yaml`](https://github.com/spiffe/spire/blob/main/.github/workflows/release_build.yaml) at commit `b232c970`, with zero riscv64 references anywhere in the workflow set. No Linux distribution ships a compiled `spire-server`/`spire-agent` binary for any architecture - the only Ubuntu match is an `arch: all` Go source-library stub ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=spire&suite=resolute)), so the distribution floor (which would otherwise cap at yellow or orange) does not apply because there is no distro package to floor on. Per the color model's default rule, "no upstream CI and no distro package" resolves to **orange**, not red (no evidence of confirmed breakage - this is untested, not broken) and not grey (ample data exists to classify confidently).
- **Pending work that could change the grade**: none identified. There is no open PR, no open issue, and no RISE Project involvement of any kind tied to SPIFFE/SPIRE (Section 7). The grade will not move until either (a) a distro packages a working riscv64 build (yellow floor), or (b) upstream adds a riscv64 CI build-and-test job and/or release artifact (yellow/blue/green depending on scope).

## 14. Investment Analysis

RISE has done and funded nothing for SPIFFE/SPIRE (Section 7) - all work sized below is unclaimed.

### 14.1 Functional Enablement

- Add a `riscv64` entry to the `arch:` matrix in `pr_build.yaml` and `release_build.yaml`, and a matching runner.
- Add a `riscv64` branch to the Dockerfile's `TARGETARCH` handling (mirroring the existing `arm64`/`s390x` cases) and install a riscv64 gcc cross-toolchain via `xx-apk` for the cgo-gated SQLite datastore path.
- Add a riscv64 case to the Makefile's architecture-detection block (currently errors on unrecognized architectures).
- Validate node/workload attestor plugins function correctly on riscv64 (no known architecture-specific logic in these plugins per Section 4, but unverified end-to-end).
- Estimated effort: 2-4 person-weeks for an engineer already familiar with SPIRE's build system, assuming no unexpected attestor or cgo/SQLite issues surface.

### 14.2 Performance Optimization

Not applicable in the traditional sense - SPIRE has no SIMD/vector/JIT code paths on any architecture to optimize (Section 4). The only performance-relevant gap is wazero's missing riscv64 JIT/Compiler backend, which is an upstream wazero project concern, not something fixable within SPIRE itself; SPIRE could avoid the affected WASM/OPA path if riscv64 performance in that path proves inadequate, at no engineering cost of its own. No dedicated optimization work is sized here.

### 14.3 CI/CD Infrastructure

- Stand up a riscv64 CI runner (RISE free GitHub riscv64 runners are a plausible source, though no relationship currently exists - see Section 7) and wire it into the existing `pr_build.yaml`/`release_build.yaml` job structure alongside the existing x64/arm64 matrix entries.
- Add riscv64 to the integration-test job matrix once the runner exists, matching the arm64 precedent (arm64 was added specifically to close this kind of arch gap, per its own CI history).
- Estimated effort: 1-2 person-weeks for CI wiring, contingent on runner availability (external dependency, not purely internal effort).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted because SPIRE has no significant dependent package ecosystem (no npm/PyPI/Maven consumer ecosystem depends on riscv64-specific SPIRE artifacts; the separate `spiffe` PyPI SDK is pure-Python and already architecture-independent).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to CI build matrix, Dockerfile `TARGETARCH` branch, riscv64 gcc cross-toolchain, Makefile arch-detection case | 2-4 | Unclaimed | High |
| Functional | Validate node/workload attestor plugins on riscv64 | 0.5-1 | Unclaimed | Medium |
| CI/CD | Stand up riscv64 CI runner and wire into pr_build.yaml/release_build.yaml | 1-2 | Unclaimed (RISE runners a plausible source, no current relationship) | High |
| CI/CD | Add riscv64 to integration-test job matrix | 0.5-1 | Unclaimed | Medium |
| Performance | None sized - no SIMD/JIT code paths in SPIRE itself; wazero JIT gap is an upstream wazero concern | n/a | n/a | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [spiffe/spire GitHub repository](https://github.com/spiffe/spire)
- [SPIFFE homepage](https://spiffe.io/)
- [spiffe/spire release_build.yaml workflow](https://github.com/spiffe/spire/blob/main/.github/workflows/release_build.yaml)
- [spiffe/spire pr_build.yaml workflow](https://github.com/spiffe/spire/blob/main/.github/workflows/pr_build.yaml)
- [spiffe/spire nightly_build.yaml workflow](https://github.com/spiffe/spire/blob/main/.github/workflows/nightly_build.yaml)
- [spiffe/spire doc/supported_operating_systems.md](https://github.com/spiffe/spire/blob/main/doc/supported_operating_systems.md)
- [spiffe/spire MAINTAINERS.md](https://github.com/spiffe/spire/blob/main/MAINTAINERS.md)
- [spiffe/spire CODEOWNERS](https://github.com/spiffe/spire/blob/main/CODEOWNERS)
- [spiffe/spire ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md)
- [spiffe/spire LICENSE](https://github.com/spiffe/spire/blob/main/LICENSE)
- [spiffe/spire releases page](https://github.com/spiffe/spire/releases)
- [spiffe/spire Makefile](https://github.com/spiffe/spire/blob/main/Makefile)
- [spiffe/spire Dockerfile](https://github.com/spiffe/spire/blob/main/Dockerfile)
- [spiffe/spire CONTRIBUTING.md](https://github.com/spiffe/spire/blob/main/CONTRIBUTING.md)
- [PyPI spiffe package JSON API](https://pypi.org/pypi/spiffe/json)
- [RISE Python wheel builder index for spiffe (redirects to PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/spiffe/)
- [Ubuntu package search: spire](https://packages.ubuntu.com/search?keywords=spire&suite=resolute)
- [Ubuntu package search: spiffe](https://packages.ubuntu.com/search?keywords=spiffe&suite=resolute)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=spire)
- [riseproject.dev homepage](https://riseproject.dev/)
- [riseproject.dev blog](https://riseproject.dev/blog)
- [riseproject.gitlab.io Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [PR #4409 - Bump golang.org/x/sys from 0.10.0 to 0.11.0](https://github.com/spiffe/spire/pull/4409)
- [PR #4933 - Bump github.com/shirou/gopsutil/v3 from 3.24.1 to 3.24.2](https://github.com/spiffe/spire/pull/4933)
- [PR #5465 - Bump golang.org/x/sys from 0.24.0 to 0.25.0](https://github.com/spiffe/spire/pull/5465)
- [PR #6047 - Bump golang.org/x/sys from 0.32.0 to 0.33.0](https://github.com/spiffe/spire/pull/6047)
- [PR #6095 - Bump github.com/docker/docker (closed without merging)](https://github.com/spiffe/spire/pull/6095)
- [PR #6457 - Bump github.com/google/go-containerregistry from 0.20.6 to 0.20.7](https://github.com/spiffe/spire/pull/6457)
- [PR #6526 - Bump github.com/shirou/gopsutil/v4 from 4.25.11 to 4.25.12](https://github.com/spiffe/spire/pull/6526)
- [PR #6979 - Bump the golang-org-x group across 1 directory with 3 updates](https://github.com/spiffe/spire/pull/6979)
- [PR #7227 - build(deps): bump the minor-and-patch group with 16 updates](https://github.com/spiffe/spire/pull/7227)
- [wazero/wazero GitHub repository](https://github.com/wazero/wazero)
- [wazero/wazero issue #249 - interpreter copysign f32 spec compatibility on RISC-V 64 (resolved)](https://github.com/wazero/wazero/issues/249)
- [open-policy-agent/opa GitHub repository](https://github.com/open-policy-agent/opa)
- [mattn/go-sqlite3 GitHub repository](https://github.com/mattn/go-sqlite3)