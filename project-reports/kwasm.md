---
title: Kwasm
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="kwasm" %}

# Kwasm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kwasm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Kwasm ([kwasm.sh](https://kwasm.sh/), repository [KWasm/kwasm-operator](https://github.com/KWasm/kwasm-operator)) is a Kubernetes operator/controller written in pure Go that provisions cluster nodes to run WebAssembly workloads by installing containerd Wasm runtime shims via a companion image, `KWasm/kwasm-node-installer`. It is built with `CGO_ENABLED=0` and depends only on `k8s.io/*`, `controller-runtime`, `zerolog`, and `ginkgo`/`gomega` - no C/C++/Rust code, no JIT, SIMD, crypto, or assembly of its own.

**Governance.** Kwasm is not a foundation project. It carries no `GOVERNANCE.md`, `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file in either `kwasm-operator` or `kwasm-node-installer`. The org-level README states: *"KWasm.sh is a project founded by Liquid Reply employees. It should make it easy to discover and evaluate new technologies. It is not intended to be used in production environments!"* License: Apache 2.0. It is not a RISE Project member; `riseproject.dev`'s partner/member list has no connection to Kwasm.

**Project status: retired.** As of 2026-05-15, the entire KWasm GitHub organization (six repositories: `kwasm-operator`, `kwasm-node-installer`, `podman-wasm`, `kwasm-docker-extension`, `.github`, `kwasm.github.io`) is archived. Every README carries the banner: *"KWasm has been retired... The `kwasm.sh` domain will continue to resolve until January 20, 2027... The repo is archived and will not receive updates."* Current Wasm-on-Kubernetes work is redirected to [spinframework/runtime-class-manager](https://github.com/spinframework/runtime-class-manager).

**Corporate sponsors (by commit authorship / email domain):**

| Contributor | Company | Commits (operator / node-installer) |
|---|---|---|
| Flavio Castelli | SUSE | 69 / 1 |
| Sven Pfennig | Liquid Reply (Reply Group) | 17+5 / 27 |
| Max Schmidt | Liquid Reply (Reply Group) | 7 / - |
| Till Knuesting | Liquid Reply (Reply Group) | 6+1 / - |
| Kingdon Barrett | Weaveworks | 2 / - |
| Jiaxiao Zhou ("Mossaka") | independent Wasm community | - / 6 |
| dependabot[bot] | automated | 72 (largest single contributor) |

Dominant backers are Liquid Reply/Reply Group (founders, most human commits) and SUSE (second-largest human contributor). No CNCF or Linux Foundation affiliation.

**Community culture on new ports:** since the project is fully archived with zero maintenance activity, there is no active process to accept new hardware ports. The retirement banner explicitly redirects all new Wasm-on-Kubernetes work to `spinframework/runtime-class-manager` - the de facto community stance is that KWasm itself is closed to new contributions.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists and none was ever attempted. Confirmed by:

- `search_commits` for "riscv" in `kwasm-operator`: 0 results; full local `git log --all --grep -i riscv` and `git log --all -S riscv` across both `kwasm-operator` and `kwasm-node-installer`: 0 hits.
- `search_issues` for "riscv"/"riscv64", repo-scoped and org-wide (`org:KWasm`): 0 results across every query.
- `search_pull_requests` for "riscv"/"riscv64", repo-scoped and org-wide: 0 results.
- Full-repository case-insensitive grep of the cloned working tree (`riscv`, `riscv64`, `linux/riscv64`, `RISCV`): 0 matches in any file.

There is no first RISC-V commit, no date, and no author to record. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists in either repo. **Is it fully upstream? Not applicable - no port exists to be upstream or not.**

## 3. Upstream Support Tier

No formal architecture-tier policy exists. The only documented support matrix, in `kwasm-node-installer/README.md`, is by **Kubernetes distribution** (KinD, MiniKube, MicroK8s, Rancher RKE2, Azure AKS, GCP GKE, AWS EKS, DigitalOcean Kubernetes; explicitly unsupported: OCI OKE, OpenShift) - not by CPU architecture. The operator's own README only warns it is for "development or evaluation purpose... Your nodes may get damaged!", i.e. not production-grade for any architecture.

The only place architecture is tiered at all is the CI/release build-platform list:

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes (`ubuntu-latest`, native) | yes (`ubuntu-latest` + QEMU cross-build) | no |
| CI test execution | yes (`make test` on native amd64 runner) | no (never executed on target arch, image is built not tested) | no |
| Container image published (`platforms:` in [container-image.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/container-image.yml)) | yes | yes | no |
| SBOM/signing matrix ([sbom.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/sbom.yml), [release.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/release.yml)) | yes (`amd64`) | yes (`arm64`) | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

`kwasm-operator` itself has **no architecture-specific subsystems for any architecture**, RISC-V included. It is a pure Go Kubernetes controller (`main.go`, `controllers/job_controller.go`, `controllers/provisioner_controller.go`) built with `CGO_ENABLED=0`:

- No `arch/riscv/` or any `arch/` directory exists.
- No `.S` assembly files exist anywhere in the repo.
- No JIT backends, SIMD dispatch, cryptography, or GC-barrier code exist for any architecture - the repo has no such subsystem at all.
- `grep -rnE "//go:build|+build|GOARCH|runtime.GOARCH" --include="*.go"` across the repo: 0 matches. No Go build-tag/conditional-compilation arch guards exist anywhere.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / SIMD / crypto / assembly / GC barriers in kwasm-operator | none (arch-agnostic Go) | none (arch-agnostic Go) | none (arch-agnostic Go) |

The real architecture-sensitive surface lives one layer down, in the containerd Wasm-runtime shims the operator's companion node-installer downloads and wires up (`containerd-shim-{wasmedge,wasmtime,wasmer}-v1`, `containerd-wasm-shims-v2-spin`, plus `crun` and `containerd` itself). Those are covered in full in Section 9, since they are separate upstream projects with their own JIT/build-target concerns.

## 5. Build System, Cross-Compilation, and Toolchain

Build system: a plain `Makefile` driving `go build` (`make build` -> `go build -o bin/manager main.go`; also `make test`, `make docker-build`). Pinned tool versions: `KUSTOMIZE_VERSION ?= v3.8.7`, `CONTROLLER_TOOLS_VERSION ?= v0.9.2`, `ENVTEST_K8S_VERSION = 1.24.2`, `GOLANGCI_LINT_VERSION ?= v1.54.2`. No GCC/Clang minimum-version requirement anywhere (Go toolchain only, no CGO).

There is no CMake, no `cmake/riscv64.cmake` or toolchain file, no `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md`. Only build-related docs are `README.md` and `CONTRIBUTING.md`, neither discussing cross-compilation.

The repository's only `Dockerfile`:

```dockerfile
FROM golang:1.22 as builder
WORKDIR /workspace
COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download
COPY main.go main.go
COPY controllers/ controllers/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o manager main.go
FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /workspace/manager .
USER 65532:65532
ENTRYPOINT ["/manager"]
```

No arch-specific Dockerfile variants exist. QEMU (`docker/setup-qemu-action`) is used in `container-image.yml`, but only to emulate the amd64/arm64 cross-builds already in the explicit `platforms:` list - it is never invoked for riscv64. No known riscv64 build failures exist because no one has attempted the build on that architecture; because the binary is pure Go with `CGO_ENABLED=0`, it would very likely cross-compile cleanly for `GOARCH=riscv64` (Go has shipped riscv64 support since 1.14), but this is untested and unverified [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Operator binary buildable | yes | yes | untested, likely yes (pure Go) [NEEDS VERIFICATION] |
| Operator container image published | yes (`ghcr.io`) | yes (`ghcr.io`) | **no - not published at all** |
| Node-installer image (`ghcr.io/kwasm/kwasm-node-installer`) buildable | yes | yes | not evaluated - `kwasm-node-installer` was not directly source-inspected this session |
| WasmEdge/Wasmtime/Wasmer/Spin shim binaries the installer fetches | yes | yes | mixed to absent - see Section 9 |

**Functional gap:** because no riscv64 container image is published for `kwasm-operator`, a riscv64 Kubernetes node cannot even pull and run the operator today, independent of the downstream runtime-shim gaps. Even if a user built and pushed their own riscv64 image, the node-installer's actual payload (the Wasm runtime shims via `runwasi`) has no riscv64 build target at all (Section 9), and the `spin` shim path fails to build on riscv64 outright due to an unresolved `ring` crate issue.

**Performance / SIMD / NaN semantics:** not applicable to kwasm-operator itself - it contains no numeric or SIMD code. Any such gap would live in the JIT engines it deploys (Wasmtime, WasmEdge, Wasmer), which are separately tracked with their own riscv64 correctness bugs (Section 9, Section 11).

**Security hardening gaps:** not evaluated for kwasm-operator itself (no arch-specific hardening logic exists in this repo). Downstream, `crun`'s riscv64 build explicitly excludes `--with-wasmedge`/`--with-libkrun` (`rpm/crun.spec %ifarch`).

## 7. CI/CD Infrastructure

All 8 GitHub Actions workflow files were read directly from the cloned repository (`/home/user/kwasm/kwasm-operator`, HEAD `866ccdd1a9a4eef72f7ac7a5c6505eb619185885`), since `mcp__github__get_file_contents` returned "repository not configured for this session" for `KWasm/kwasm-operator`. `grep -rniH "riscv" .github/workflows/` returned zero matches, exit code 1.

| File | Trigger | Runner | Purpose | riscv64? |
|---|---|---|---|---|
| [ci.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/ci.yml) | `workflow_call`, `push`, `pull_request` | `ubuntu-latest` | `make test` + golangci-lint | no |
| [container-build.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/container-build.yml) | `workflow_call`, `push` (main/feat-**) | orchestrates other jobs | calls container-image, sign-image, sbom | no |
| [container-image.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/container-image.yml) | `workflow_call` | `ubuntu-latest` | Docker build via QEMU+Buildx; `platforms: linux/amd64, linux/arm64` explicit | no - only amd64/arm64 |
| [helm-chart-release.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/helm-chart-release.yml) | `push` (main) | `ubuntu-latest` | Helm chart-releaser | no |
| [release-drafter.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/release-drafter.yml) | `workflow_dispatch`, `push`, `pull_request`, `pull_request_target` | `ubuntu-latest` | drafts GitHub release notes | no |
| [release.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/release.yml) | `push` tags `v*` | `ubuntu-latest` | uploads release assets, hardcoded filenames `-amd64`/`-arm64` only | no |
| [sbom.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/sbom.yml) | `workflow_call` | `ubuntu-latest` | `strategy.matrix.arch: [amd64, arm64]` | no |
| [sign-image.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/sign-image.yml) | `workflow_call` | `ubuntu-latest` | cosign signing, single image (not arch-matrixed) | no |

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, or `.travis.yml` exists. Every job runs on `runs-on: ubuntu-latest` - no riscv64 self-hosted runner, no RISE RISC-V runner label anywhere, no riscv64 QEMU target (QEMU is set up generically but only exercised for the amd64/arm64 platforms explicitly listed).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes (QEMU cross-build) | **no** |
| CI test | yes (native) | no | **no** |
| CI release | yes | yes | **no** |

## 8. Distribution and Release Status

No riscv64 (or, in fact, any per-architecture compiled binary) artifact exists for `kwasm-operator` anywhere checked:

- **GitHub Releases** (all releases checked, live via `expanded_assets` endpoints since `mcp__github__list_releases` refused as out-of-scope for this session): `kwasm-operator-chart-0.2.3`, `kwasm-operator-0.2.3`, `-0.2.2`, `-0.2.1`, `-0.2.0`, `-0.1.0`. Every release's assets are only `<name>.tgz` (Helm chart) plus GitHub's auto-generated `Source code (zip)`/`(tar.gz)`. **No architecture-specific binaries at all - not riscv64, not amd64/arm64 either.** This is a Helm chart/operator-manifest repo, not a compiled-binary release; the actual container image is published separately to a container registry (`ghcr.io`) via `container-image.yml`, restricted to `linux/amd64, linux/arm64`.
- **PyPI** ([pypi.org/pypi/kwasm/json](https://pypi.org/pypi/kwasm/json)): a package named `kwasm` exists (latest 0.2.26) but is an **unrelated** pure-Python package shipping a single `kwasm-0.2.26-py3-none-any.whl` - architecture-independent, not this project.
- **RISE wheel builder**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kwasm/` 302-redirects to plain PyPI; not a RISE-built artifact, and confirms the same unrelated pure-Python package.
- **Ubuntu 26.04 (resolute)** ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Kwasm&suite=resolute&searchon=names&section=all)): "Sorry, your search gave no results" - package does not exist for any architecture.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=kwasm)): no `kwasm` entry.

**What a user must do to get a working riscv64 deployment today:** (1) build the `kwasm-operator` Go binary for `GOARCH=riscv64` themselves (untested but likely straightforward given `CGO_ENABLED=0`), (2) build and push a riscv64 container image manually since none is published, and (3) separately solve the much harder problem of a working riscv64 Wasm runtime shim for the node-installer to deploy - which, per Section 9, is unsolved upstream for the shim-glue layer (`runwasi`) and outright broken for `Spin`.

## 9. Dependencies

`kwasm-operator`'s own `go.mod` carries no JIT/SIMD/crypto dependencies (only `k8s.io/*`, `controller-runtime`, `zerolog`, `ginkgo`/`gomega`). The riscv64-relevant dependency surface is one layer down, in the companion `KWasm/kwasm-node-installer` image, which pulls and wires up containerd Wasm runtime shims for four engines plus the OCI runtime and host daemon they plug into.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| WasmEdge | JIT/AOT engine behind `containerd-shim-wasmedge` | yes (cross-compiled, merged 2023) | yes, curated "quick" subset under QEMU only; heavy/flaky suites and optional plugins excluded | **no** - zero riscv64 asset in any GitHub Release | `wasi_crypto` plugin's OpenSSL AES path not constant-time on riscv64 (only relevant if that plugin is enabled) |
| Wasmtime | JIT/AOT engine behind `containerd-shim-wasmtime`; also embedded inside Spin | yes - full Cranelift riscv64 backend (~22,300 lines), Tier 3 upstream tier | yes under QEMU, but gated (merge-queue/release branches only, not every PR) | yes - official `riscv64gc-linux` tarball on every GitHub Release | Open bugs: #5882 (bus error, unaligned atomics), #7237 (partial OOB writes), #11050 (vector-return ABI), #13959 (ISLE crash), #7186 (RVV gaps) |
| Wasmer | JIT engine behind `containerd-shim-wasmer` | yes - Cranelift riscv64 backend; LLVM backend exists but disabled in riscv64 CI (`ENABLE_LLVM=0`); Singlepass not wired into riscv64 path | yes - Cranelift-only WAST suite under QEMU, required in `ci_success` gate | yes - `wasmer-linux-riscv64.tar.gz` shipped since v3.2.0-beta.1 (2023) | Open: #5816 (Cranelift `skip_stack_guard_page` SIGSEGV, memory-safety, reproduced on real hardware), #6078 (ISLE `gen_bitcast` panic). No riscv64 SIMD (`simd128`) on any backend |
| Spin | Application framework behind `containerd-wasm-shims-v2-spin`; embeds Wasmtime | **no** - build fails outright, `ring` crate build script panics (`Option::unwrap()` on `None`) on riscv64 | N/A - never reaches test | **no** - zero riscv64 assets in any release checked | Open since 2023-08-06, unresolved: [spinframework/spin#1681](https://github.com/spinframework/spin/issues/1681). Remediation PR #2392 (migrate off `ring`) abandoned, closed stale July 2026 |
| crun | OCI runtime kwasm's node-installer configures as `crun-wasmedge`/`crun-wasmtime` variants | yes - QEMU-emulated build in `test.yaml`, every push/PR | **no** - build job is build-only; the functional/integration `Test:` job has no arch matrix at all (x86_64-only) | contradictory evidence: `release.yaml` source loops riscv64 into build/upload steps, but two live fetches of the v1.29.1 release-asset page disagreed on whether a riscv64 asset is actually present [NEEDS VERIFICATION] | `--with-wasmedge`/`--with-libkrun` explicitly excluded on riscv64 (`rpm/crun.spec %ifarch`) |
| containerd | Host daemon every shim plugs into via CRI | yes - nightly cross-compile CI since 2022 (PR #6882) | **no** - zero riscv64 rows in `ci.yml`'s integration-test matrix; PR #13124 (adds riscv64 via RISE runners, 1752/1752 tests passing in fork CI) open since March 2026 with 0/2 approvals, blocked only on a containerd org admin installing the RISE GitHub App | yes - riscv64 binaries in every release since v1.6.8 (2022) | No open riscv64 correctness bugs. CRIU checkpoint/restore unavailable on riscv64 (upstream CRIU gap, criu#1702, open since 2021) |
| runwasi (indirect - provides the actual shim binaries) | Supplies `containerd-shim-{wasmtime,wasmedge,wasmer}-v1` that the node-installer downloads | **no** - `Cross.toml`/CI matrix hardcoded to `["x86_64","aarch64"]`, zero riscv64 references anywhere | **no** - no riscv64 CI job exists at all | **no** - `SHA256SUMS` manifests confirm only aarch64/x86_64 assets for every shim train | One closed bug: #767 (wasmtime shim panicked on riscv64 mmap sizing, fixed same-day by #768 - but that fix has never been exercised by any CI) |

**Reading across the table:** `kwasm-operator`'s own code carries zero riscv64 risk (pure Go, `CGO_ENABLED=0`). The real risk sits in the four Wasm engines and the OCI/shim/host plumbing wired together at node-provisioning time. The weakest link is `runwasi`: it has no riscv64 build target at all, so no official riscv64 shim binary exists for kwasm's installer to download regardless of how mature Wasmtime, WasmEdge, or Wasmer are individually. The single worst dependency is `Spin` (build-blocking, 3-year-old unresolved bug) - relevant only if the `spin` shim path is used. `crun` is capped on CI methodology alone (build-tested, never functionally tested on riscv64). `containerd` is one merged PR away from full riscv64 CI parity. Of the three JIT engines, Wasmtime and Wasmer both ship official riscv64 release binaries and pass CI (each with an open memory-safety bug); WasmEdge builds and passes a curated CI subset but publishes no riscv64 binary at all.

## 11. Known Bugs and Active Issues

No riscv64-specific issues, PRs, or bugs exist for `kwasm-operator` or anywhere in the KWasm GitHub org - because no riscv64 support was ever attempted, there is nothing riscv64-specific to report as broken. The only architecture-related issue found in `kwasm-operator` is **#27** ("exec container process `/wasi_example_main.wasm`: Exec format error"), confirmed via direct fetch to be unrelated to RISC-V - it is an x86/x64 environment issue caused by `crun` no longer being auto-installed by the operator (manual `crun` install required as workaround).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | (no riscv64-related issue or PR exists in KWasm/kwasm-operator or the KWasm org) | N/A | N/A | confirmed by repo-scoped and org-wide GitHub search across issues/PRs/commits, plus full local grep |

**Dependency-level correctness bugs relevant to a riscv64 deployment** (see Section 9 for full detail): Wasmtime #5882, #7237, #11050, #13959, #7186; Wasmer #5816, #6078; Spin [#1681](https://github.com/spinframework/spin/issues/1681) (build-blocking); runwasi #767/#768 (fixed but never CI-exercised); containerd PR #13124 (riscv64 CI, pending merge); crun release-asset ambiguity [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

**Organizational blocker (primary):** the project is archived and retired. The README states explicitly it "will not receive updates," and the entire KWasm GitHub organization was marked archived on 2026-05-15. There is no maintainer capacity, no governance body, and no accepted mechanism for merging any new architecture port, riscv64 or otherwise.

**Stated technical objections:** none exist, because riscv64 was never proposed, discussed, or raised in any issue, PR, or commit across the project's lifetime.

**Successor path:** the retirement banner explicitly redirects all new Wasm-on-Kubernetes work to [spinframework/runtime-class-manager](https://github.com/spinframework/runtime-class-manager) - not accessible for direct inspection via GitHub tooling in this research session (422 error), so its own riscv64 posture is unverified [NEEDS VERIFICATION].

**Acceptance probability of a riscv64 port PR to `kwasm-operator` today: effectively zero.** The repository is archived and not accepting contributions of any kind. Any RISC-V investment aimed at "Kwasm" as a K8s+Wasm control plane should instead target `spinframework/runtime-class-manager`, and independently, the underlying blockers that would affect either project equally: `runwasi`'s complete absence of a riscv64 target, and `Spin`'s build-blocking `ring` crate issue.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none - no upstream, RISE, distro, or third party publishes a riscv64 artifact for `kwasm-operator` (no riscv64 container image, no riscv64 binary in GitHub Releases, no distro package, no PyPI artifact for this project).
- **Optimization level:** not applicable - `kwasm-operator` is a control-plane orchestration tool with no SIMD/JIT/performance-critical code; the optimization-purpose modifier (Step 2 of the color model) does not apply.
- **Justification:** No upstream riscv64 CI exists - all 8 GitHub Actions workflows explicitly restrict build, SBOM, and release matrices to `amd64`/`arm64` only ([container-image.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/container-image.yml), [sbom.yml](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/sbom.yml)), and no distribution (Ubuntu 26.04, Arch RISC-V) or registry (PyPI, GitHub Releases) ships any riscv64 artifact for the project. This is the base "no upstream CI, no artifact" case in Step 1 of the color model, which maps to orange; it is not red because there is no evidence of confirmed breakage, only absence of any attempt. Note: the project does not qualify for the Step 0 architecture-independent shortcut despite being pure Go with `CGO_ENABLED=0` - it is distributed as a platform-specific container image with an explicit, non-riscv64-inclusive publish target list, not as a `noarch`/arch-neutral package.
- **Color-case deviation:** the two documented orange sub-types (`downstream-only`: distro ships with/without patches; `optimization-absent`: optimization-purpose project with no RISC-V code) do not cleanly apply here - there is no downstream/distro package at all (not even a patched one), and this is not an optimization-purpose project. The applicable case is simply the base Step 1 orange row: no upstream CI, no distro floor available because no distro packages it.
- **Pending work that could change the grade:** none identified. No open PR, issue, or RISE engagement targets riscv64 for `kwasm-operator` or the wider KWasm org. The grade would only improve if `spinframework/runtime-class-manager` (the stated successor) is separately assessed and found to have riscv64 CI/release support - that assessment is out of scope here and was not obtainable this session (422 error accessing the repo).

## 14. Investment Analysis

RISE has done no work on Kwasm: zero mentions of Kwasm anywhere on `riseproject.dev` (blog, member list, wheel builder), zero RISE-affiliated repos or runner usage tied to the KWasm org, and zero riscv64-related commits, issues, or PRs in the project's history. There is nothing already covered to subtract from the estimates below.

**Investment in `kwasm-operator` itself is not recommended.** The project is archived, has no maintainers, and states it will not receive updates. Any engineering effort should instead be directed at (a) its stated successor, `spinframework/runtime-class-manager` (unverified riscv64 posture this session), and (b) the shared-dependency blockers in Section 9 that would gate riscv64 readiness for any Wasm-on-Kubernetes control plane, not just this one.

### 14.1 Functional Enablement
- Add `linux/riscv64` to `kwasm-operator`'s `container-image.yml` platform list and `sbom.yml` arch matrix, and publish a riscv64 image: low effort in isolation (pure Go, `CGO_ENABLED=0`), but moot while the repo is archived and not accepting PRs.
- The actual functional blocker is downstream: `runwasi` (shim binaries) has zero riscv64 build target, and `Spin` fails to build on riscv64 at all (`ring` crate panic, [spinframework/spin#1681](https://github.com/spinframework/spin/issues/1681), open since 2023).

### 14.2 Performance Optimization
Not applicable to `kwasm-operator` - it has no performance-critical code path. Performance concerns belong to the JIT engines it deploys (Wasmtime, WasmEdge, Wasmer), each separately tracked.

### 14.3 CI/CD Infrastructure
Moot for the archived `kwasm-operator` repo. If the successor project is adopted, add a riscv64 build+test job (the pattern already proven in `containerd`'s pending PR #13124, using RISE-provided runners) would be the template to follow.

### 14.4 Ecosystem Enablement
Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Revive/fork `kwasm-operator` (or adopt `spinframework/runtime-class-manager`) with `linux/riscv64` added to build/SBOM/release targets | 1-2 (isolated Go change) | Downstream fork maintainer (archived upstream will not merge) | Low - blocked on organizational decision, not technical effort |
| Functional (blocking dependency) | Add riscv64 build target to `runwasi` (`Cross.toml`, CI matrix, shim release assets) | 2-4 | runwasi upstream / RISE-sponsored contribution | Critical - hard blocker for any Wasm-on-K8s riscv64 deployment regardless of which control plane is used |
| Functional (blocking dependency) | Resolve `Spin`'s `ring`-crate riscv64 build failure ([#1681](https://github.com/spinframework/spin/issues/1681)) | 2-3 (prior attempt PR #2392 abandoned - needs fresh approach) | Spin upstream | High - only blocks the `spin` shim path, not the raw Wasmtime/WasmEdge/Wasmer shims |
| CI/CD | Land `containerd` PR #13124 (riscv64 CI via RISE runners, tests already passing in fork) | <1 (unblocking two maintainer approvals + org admin app install) | containerd maintainers | High - lowest-effort, highest-readiness-gain item in the entire dependency chain |
| Distribution | Publish riscv64 release asset for `WasmEdge` (builds and tests today, just doesn't publish) | 1-2 | WasmEdge upstream | Medium |
| Governance | Clarify `spinframework/runtime-class-manager`'s riscv64 posture (not assessable this session, repo inaccessible) | <1 (research only) | Assessment team | Medium - prerequisite to any further investment decision on the K8s+Wasm control-plane layer |

## 15. Updates
(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [KWasm/kwasm-operator](https://github.com/KWasm/kwasm-operator) (repository, README, Dockerfile, Makefile, all 8 GitHub Actions workflow files)
- [kwasm.sh](https://kwasm.sh/) (project homepage)
- [KWasm/kwasm-node-installer](https://github.com/KWasm/kwasm-node-installer) (companion node-installer repo, README support matrix; not directly source-inspected this session)
- [spinframework/runtime-class-manager](https://github.com/spinframework/runtime-class-manager) (stated successor project; not accessible via GitHub API this session, 422 error)
- [PyPI kwasm package JSON](https://pypi.org/pypi/kwasm/json) (unrelated pure-Python package, verified not this project)
- [RISE wheel builder redirect for kwasm](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kwasm/) (302-redirects to plain PyPI)
- [Ubuntu 26.04 (resolute) package search for Kwasm](https://packages.ubuntu.com/search?keywords=Kwasm&suite=resolute&searchon=names&section=all) (zero results, any architecture)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=kwasm) (no entry)
- [RISE Project blog](https://riseproject.dev/blog) (no Kwasm content found)
- [RISE Project Python wheel builder coverage list](https://riseproject.gitlab.io/python/wheel_builder/) (Kwasm not listed)
- [container-image.yml workflow](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/container-image.yml) (platform list: linux/amd64, linux/arm64 only)
- [sbom.yml workflow](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/sbom.yml) (arch matrix: amd64, arm64 only)
- [release.yml workflow](https://github.com/KWasm/kwasm-operator/blob/main/.github/workflows/release.yml) (release asset naming, amd64/arm64 only)
- [KWasm/kwasm-operator issue #27](https://github.com/KWasm/kwasm-operator/issues/27) (confirmed unrelated to RISC-V - crun auto-install issue)
- [spinframework/spin issue #1681](https://github.com/spinframework/spin/issues/1681) (ring crate riscv64 build failure, open since 2023-08-06)
- Local project-reports read in full: `/home/user/sw-ecosystem/project-reports/{wasmtime,wasmedge,wasmer,crun,runwasi,containerd,spin}.md`
- Local clones used for verification: `/home/user/kwasm/kwasm-operator` (HEAD `866ccdd1a9a4eef72f7ac7a5c6505eb619185885`), `/home/user/kwasm/kwasm-node-installer`, `/home/user/kwasm/dotgithub`
- Note: `project-graph` MCP server (Ubuntu 26.04 SPARQL package graph) failed to connect (`CONNECTION_CLOSED`) across multiple sessions - Step 0 of the readiness assessment relied on live fallback checks (PyPI, Ubuntu package search, Arch RISC-V port) rather than the authoritative graph query; this should be re-verified once the server is reachable.
