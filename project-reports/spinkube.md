---
title: SpinKube
parent: Project Reports
color: red
---

{% include dependency-graph.html slug="dependencies" subset="spinkube" %}

# SpinKube

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for SpinKube<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SpinKube is a Kubernetes platform for running [Spin](https://github.com/spinframework/spin) WebAssembly applications as first-class workloads. Its core repository, `spin-operator`, is a Go Kubernetes controller (built on client-go / controller-runtime, using kubebuilder tooling) that reconciles `SpinApp` custom resources into pods scheduled onto a `RuntimeClass` backed by `containerd-shim-spin`, which in turn invokes the Spin runtime and its embedded Wasmtime JIT engine to execute the WebAssembly module. spin-operator itself contains no architecture-specific code (no assembly, no SIMD, no per-arch build tags); all riscv64-relevant behavior in the stack lives one or two layers below it, in `spinframework/spin` and `spinframework/containerd-shim-spin`.

**Governance:** SpinKube is a **CNCF Sandbox project**, operated as "a Series of LF Projects, LLC." Code lives under the `spinframework` GitHub org (renamed from `spinkube`), Apache-2.0-licensed. Per [spinframework/governance](https://github.com/spinframework/governance) (GOVERNANCE.md), every sub-project should have 2+ maintainers and a MAINTAINERS.md, but `spin-operator` has no MAINTAINERS.md at its root - only a `.github/CODEOWNERS` file - so the governance requirement is not fully applied in practice. Decision-making is objection-free consensus, escalating to a 2/3 supermajority vote or the Spin Governance Committee. New platform ports would formally go through a Spin Improvement Proposal (SIP); no SIP, tier policy, PLATFORMS.md, or SUPPORT.md addressing architecture support was found in the repository.

**Corporate sponsors:** the spinkube.dev site credits Microsoft, SUSE, Liquid Reply, and Fermyon. Fermyon was subsequently acquired by Akamai, so several "Fermyon" maintainers (e.g. Caleb Schoepp, Matt "bacongobbler", Kate Goldenring) now show as Akamai employees. Effective corporate sponsor base: **Microsoft, Akamai (via Fermyon), SUSE, Liquid Reply**.

**Community culture on new ports:** no explicit stance on new architecture ports (RISC-V or otherwise) exists in `CONTRIBUTING.md`, governance docs, or issues reviewed. The only formal channel for proposing one would be the general SIP process; no RISC-V-specific discussion or roadmap commitment was found anywhere in the `spinframework` org.

## 2. Port History and Upstreaming Timeline

No riscv64 port has been started, proposed, or merged into `spin-operator` itself. `git log --all -i --grep=riscv` and `-S"riscv"` against the local clone (594 commits, excluding dependabot) return zero matches, and GitHub commit search across the entire `spinframework` org for "riscv" and "risc-v" returns `total_count: 0`.

The only riscv64-relevant activity anywhere in the dependency stack:

| Date | Event | Source |
|---|---|---|
| 2023-08-06 | `spin` issue #1681 opened: build fails on riscv64 because the `ring` crypto crate has no riscv64 target branch in its build script. Still open. | [spinframework/spin#1681](https://github.com/spinframework/spin/issues/1681) |
| 2024-05-06 | `containerd-shim-spin` issue #102 opened: "Building for RISCV64?" - `Makefile` cross-compile with `TARGET=riscv64gc-unknown-linux-gnu` does not work. | [spinframework/containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102) |
| 2024-05-14 | `spin` PR #2508 merged: dynamically detect Wasmtime pooling-allocator support, primarily to fix aarch64 (tracked by #2119) but incidentally also relevant to riscv64's narrower (39-bit) virtual address space. | [spinframework/spin#2508](https://github.com/spinframework/spin/pull/2508) |
| 2024-05-28 | `containerd-shim-spin` issue #128 opened: on real riscv64 hardware (StarFive VisionFive 2), a Spin app run via `io.containerd.spin.v2` panics in Wasmtime with `PermissionDenied` on a cache-clear syscall. | [spinframework/containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128) |
| 2026-08-19 | Issue #102 closed as `completed`. | [spinframework/containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102) |
| 2026-08-19 | Issue #128 closed as **`not_planned`** - maintainers explicitly declined to fix the riscv64 containerd/Kubernetes execution-path bug. | [spinframework/containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128) |

**Key contributors:** afro-coder (issue #1681 reporter, self-described non-Rust-programmer volunteer); matsbror (issues #102 and #128 reporter, built and tested a personal riscv64 fork at [matsbror/containerd-shim-spin@riscv-arm](https://github.com/matsbror/containerd-shim-spin/tree/riscv-arm) and [matsbror/spin@v2.5.1](https://github.com/matsbror/spin/tree/v2.5.1)); alexcrichton (Bytecode Alliance/Wasmtime maintainer, authored PR #2508, mirroring [bytecodealliance/wasmtime#8610](https://github.com/bytecodealliance/wasmtime/issues/8610)); lann (filed the aarch64/riscv64-adjacent tracking issue #2343 that scoped #2508).

**Is it fully upstream?** No. There is no upstream-merged riscv64 support anywhere in the stack that spin-operator depends on for the containerized execution path. The one closed-`completed` issue (#102, shim build) has an unretrievable resolution [NEEDS VERIFICATION - the closing comment/commit could not be fetched with available session access]; the one hands-on hardware validation (#128) was closed `not_planned`, i.e., explicitly not accepted as upstream work.

## 3. Upstream Support Tier

No formal tier policy document (PLATFORMS.md, SUPPORT.md, or equivalent) exists for spin-operator or the wider SpinKube/Spin ecosystem. Support is de facto defined by the CI `platforms:` matrix in `publish.yaml`.

| Architecture | CI builds | CI runs tests | Official release artifact |
|---|---|---|---|
| amd64 | Yes (`ubuntu-latest` runners, all workflows) | Yes | Yes - included in `publish.yaml` `platforms: linux/amd64,linux/arm64` |
| arm64 | Yes (via `docker/setup-qemu-action` + buildx) | Not independently tested per-arch (spin-operator is pure Go with no arch-specific code) | Yes - included in `publish.yaml` |
| riscv64 | **No** - absent from `publish.yaml` `platforms:` field and from all 7 workflow files | No | No |

Evidence: full contents of all 7 workflow files (`build.yaml`, `docs.yaml`, `e2e.yaml`, `helm-install-smoketest.yaml`, `publish.yaml`, `sample-apps.yaml`, `smoketest.yaml`) were read directly; `publish.yaml` is the only multi-arch build and its `platforms:` field is explicitly `linux/amd64,linux/arm64`. GitHub code search scoped to `repo:spinframework/spin-operator` for `riscv`, `riscv64`, and `"risc-v"` returns `total_count: 0` across the entire repository, not just workflows - a repo-wide zero, not a workflow-only zero.

## 4. Technical Architecture and RISC-V-Specific Subsystems

spin-operator has no architecture-specific subsystems of its own. `search_code` for `GOARCH repo:spinframework/spin-operator` finds only 4 files, none implementing per-architecture logic: the `Dockerfile` (`GOARCH=${TARGETARCH}` cross-compile plumbing), the `Makefile` (`GOARCH=$(shell go env GOARCH)`), and two test files that use `runtime.GOARCH` only to build a path to a downloaded `envtest` binary. `search_code` for `amd64 arm64 repo:spinframework/spin-operator language:go` returns zero results - no Go source file branches on architecture at all.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| spin-operator Go controller logic | full - single unbranched codebase | full - same codebase | full - same codebase (no arch-specific code needed or present for any target) |
| Container cross-compile inclusion | included in `publish.yaml` platforms | included in `publish.yaml` platforms | **missing** - absent from platforms list |
| Arch-specific source files | 0 | 0 | 0 |

All riscv64-relevant technical risk sits below spin-operator, in the components it schedules:

- **Wasmtime/Cranelift** (JIT/AOT compiler, in the Spin runtime): full hand-tuned riscv64 Cranelift backend (~22,300 LOC), builds and passes CI under QEMU. See Section 9.
- **ring** (crypto backend behind Spin's `wasi-tls`): no riscv64 target branch in its build script; this is a confirmed build blocker for the Spin runtime itself ([spin#1681](https://github.com/spinframework/spin/issues/1681)).
- **containerd-shim-spin**: the specific runtime component that failed on real riscv64 hardware with an `EPERM` panic in Wasmtime's `code_memory.rs:254` cache-clear call ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)).

## 5. Build System, Cross-Compilation, and Toolchain

spin-operator is a Go project built with `go build` via a standard `Makefile` (kubebuilder/controller-gen tooling), not CMake. `mcp__github__search_code` queries for `riscv64 Dockerfile filename:Dockerfile repo:spinframework/spin-operator`, `org:spinframework riscv64 Dockerfile`, and `org:spinframework riscv64gc` all return zero results. There is no `CMakeLists.txt`, no `cmake/riscv64.cmake` or `toolchain-riscv64.cmake`, and no `Dockerfile.riscv64` anywhere in the `spinframework` org. No documented riscv64 build command, toolchain version requirement, or QEMU cross-compilation instructions exist for spin-operator.

The only build-time riscv64 evidence anywhere in the org: a `crates/core/src/lib.rs` comment in `spinframework/spin` noting the Wasmtime pooling allocator's virtual-memory sizing constraint on "some aarch64 and riscv64 configuration"; and `riscv64-gnu` prebuilt native-binding npm package variants (`@napi-rs/lzma-linux-riscv64-gnu`, `@oxc-parser/binding-linux-riscv64-gnu`) inside `package-lock.json` files in `spinframework/spin-js-sdk`, which are third-party transitive npm dependencies, not SpinKube build documentation.

**Known build failure:** attempting to build `containerd-shim-spin` for `TARGET=riscv64gc-unknown-linux-gnu` via the standard Makefile does not work as of the report opening ([containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102), closed `completed` but the resolving change is not retrievable with current session access [NEEDS VERIFICATION]). A user (matsbror) who built a working fork had to manually remove the `trigger-sqs` and `trigger-command` features from `engine.rs` because they would not build on riscv64 ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `spin-operator` controller runs | Yes | Yes | Untested by upstream; no CI evidence either way at the controller level |
| Container image published (`publish.yaml`) | Yes | Yes | No |
| `containerd-shim-spin` builds | Yes | Yes | Possible via manual patching only ([containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102)); not in standard Makefile flow |
| `spin` runtime builds from vanilla source | Yes | Yes | **No** - blocked by `ring` crate lacking a riscv64 build-script branch ([spin#1681](https://github.com/spinframework/spin/issues/1681)) |
| Spin app runs under `containerd`/Docker (`io.containerd.spin.v2`) | Yes | Yes | **Confirmed broken**: panics with `PermissionDenied` in Wasmtime's `code_memory.rs:254` cache-clear syscall on a VisionFive 2 board ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)); closed `not_planned` |
| Bare `spin up` (no containerd) | Yes | Yes | Reported working by one user, but only after applying the Wasmtime pooling-allocator memory-pool patch from [spin#2508](https://github.com/spinframework/spin/pull/2508) to a personal fork [NEEDS VERIFICATION - single reporter, not upstream-verified] |

**Functional gap:** the containerized execution path that SpinKube specifically exists to provide (Kubernetes pod running a Spin app via a `RuntimeClass`-scheduled `containerd-shim-spin` container) is the exact path documented as broken and declined for a fix ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)). This is not a peripheral feature gap - it is the platform's core function.

**Performance gaps:** no published SpinKube performance benchmarks exist on riscv64 in any form (arm64-comparison or otherwise). Exhaustive search of GitHub issues/PRs, the RISE blog, and general web search returned nothing. Data not available: SpinKube riscv64 vs arm64/amd64 performance benchmarks.

**Security hardening gaps:** not directly assessed for spin-operator (control-plane only). At the dependency level, the vendored OpenSSL alternative to `ring` has an open, unmerged constant-time AES gap on riscv64 hardware lacking Zkn/Zvkned extensions - see Section 9.

**NaN/floating-point semantics issues:** none found specific to SpinKube, Spin, or Wasmtime. One related bug exists in an unrelated project - SpiderMonkey's WasmBCFrame (Firefox) - [Mozilla Bugzilla #1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867), "Improper Float32 architectural NaN-boxing when popping from stack on riscv64" - flagged here only to note it is not a SpinKube-stack issue.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in `spinframework/spin-operator`.** Confirmed independently via (a) full-text local-clone grep of all 7 workflow files, (b) GitHub's repo-scoped code-search API (`riscv`, `riscv64`, `"risc-v"` all return `total_count: 0` against the entire repository, not just workflows), and (c) issue/PR/commit search (0 hits for all three terms).

- All jobs run on `runs-on: ubuntu-latest` (x86_64 GitHub-hosted runners); no riscv64 self-hosted runner and no riscv64 QEMU emulation target anywhere.
- `publish.yaml` is the only multi-arch job (via `docker/setup-qemu-action` + buildx); its `platforms:` field is `linux/amd64,linux/arm64` only.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.
- No reference to RISE RISC-V runners (`riseproject-dev` or RISE runner labels) anywhere in the org's workflows for this repo.

| Architecture | CI build | CI test | Release-blocking | Runner |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes | GitHub-hosted `ubuntu-latest` (native) |
| arm64 | Yes | Not independently tested (no arch-specific code) | Yes (image build) | GitHub-hosted `ubuntu-latest` + QEMU/buildx |
| riscv64 | **No** | **No** | N/A | N/A |

## 8. Distribution and Release Status

No riscv64 binary or package exists for SpinKube through any channel checked, confirmed both by initial research and by an independent adversarial re-verification pass:

| Channel | riscv64 available? | Evidence |
|---|---|---|
| GitHub Releases, `spin-operator` (v0.6.1, v0.6.0, v0.5.0) | No | Asset lists confirmed: `spin-operator-<version>.tgz`, `spin-operator.crds.yaml`, `spin-operator.runtime-class.yaml`, `spin-operator.shim-executor.yaml`, plus source archives - architecture-agnostic Helm/YAML manifests, no per-arch binaries at all (expected, since spin-operator is a K8s controller deployed via manifest, not a compiled per-arch download) |
| PyPI (`spinkube`) | No | [`pypi.org/pypi/spinkube/json`](https://pypi.org/pypi/spinkube/json) returns HTTP 404; no such package exists (expected - SpinKube is not a Python project) |
| RISE Python wheel builder | No | GitLab redirect resolves to the same 404 PyPI page |
| Ubuntu 26.04 (resolute) | No | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=SpinKube&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" for any architecture |
| Arch Linux RISC-V (unofficial, archriscv.felixc.at) | No | Query and direct guessed package path both return no listing / HTTP 404 |
| project-graph SPARQL DB (Ubuntu riscv64 binaries) | **Unknown/unverified** | `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research session - not run, not a corroborating negative |

**What a user must do to get a working deployment today:** deploy the standard amd64/arm64 spin-operator Helm chart (architecture-agnostic manifests, so the control plane itself may schedule on any node) but supply a working `containerd-shim-spin` binary for riscv64 worker nodes - which requires manually patching the Makefile/`engine.rs` and applying an unmerged memory-pool workaround, per the only documented attempt ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)), with no guarantee of success given the underlying issue was closed `not_planned`.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **Wasmtime** (runtime-dependency, critical) | Core JIT/AOT WASM execution engine (Cranelift backend); everything a Spin app executes runs through it | Green - full hand-tuned Cranelift riscv64 backend (~22,300 LOC) | Green under QEMU, but Tier 3 (conditionally gated, not every PR) | Green - official `riscv64gc-linux` GitHub Release tarball | Tier 3, not Tier 2: 8 open correctness bugs including [#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) (bus error on unaligned atomics) and [#7237](https://github.com/bytecodealliance/wasmtime/issues/7237) (partial OOB write, spec violation); no continuous fuzzing on riscv64; Winch baseline compiler has zero riscv64 code. Not packaged in Ubuntu at all, any architecture. Full detail: internal report `project-reports/wasmtime.md` |
| **Cranelift** (in-tree in Wasmtime) | Codegen backend used for every compiled function | Same as Wasmtime | Same as Wasmtime | Ships inside the Wasmtime release tarball | Same issue set as Wasmtime; no separate tracking or report |
| **ring** (via `rustls`, crypto backend for `wasi-tls`) | Default TLS crypto backend | Builds only after upstream patch; no riscv64 target branch in stock build script | Not confirmed / no dedicated riscv64 CI | Published to crates.io normally | **Confirmed build blocker for Spin itself**: [spin#1681](https://github.com/spinframework/spin/issues/1681), open since 2023-08-06, citing [briansmith/ring#1620](https://github.com/briansmith/ring/issues/1620) and candidate patch [briansmith/ring#1436](https://github.com/briansmith/ring/pull/1436), neither merged. A community fork (`OkitaSan/ring@rv64gc-support`) exists [NEEDS VERIFICATION]. `rustls` is separately trending toward `aws-lc-rs` as default backend, which has zero riscv64 support today - forward regression risk |
| **rustls** (pure-Rust TLS stack wrapping `ring`) | TLS protocol implementation | Pure Rust, builds anywhere | Inherits `ring`'s risk profile | Published normally | Not itself a blocker; risk is fully inherited from whichever crypto backend is active |
| **OpenSSL** (`openssl-sys`, vendored, direct dependency of `containerd-shim-spin`) | Alternative/vendored TLS+crypto backend, statically linked into the shim binary | Green - riscv64 port merged since May 2022 (PR #17640), actively extended (AES-RV64I asm, Zbb/Zbc GCM) | Green via QEMU CI, conditionally triggered | Green - Debian/Ubuntu/Arch all package current versions for riscv64 | Open, unmerged security gap: the AES T-table fallback used on hardware lacking Zkn/Zvkned (the majority of deployed riscv64 silicon) is not constant-time, leaking key material via cache timing ([openssl#31080](https://github.com/openssl/openssl/pull/31080), [openssl#31082](https://github.com/openssl/openssl/pull/31082), both open). `libssl-dev` 3.5.5-1ubuntu3 confirmed present for Resolute riscv64. Full detail: internal report `project-reports/openssl.md` |
| **zstd** (`zstd-sys`, vendors zstd C source) | Compression codec, transitively pulled in by the Spin runtime | Builds fine - pure C, no assembly required | No native riscv64 CI (QEMU-only, PR-triggered, not release-blocking) | Green - Debian/Ubuntu ship `libzstd1`/`libzstd-dev` for riscv64 | RVV-accelerated paths only partially merged; several perf PRs stalled 2-6 months unreviewed ([facebook/zstd#4596](https://github.com/facebook/zstd/pull/4596), [#4557](https://github.com/facebook/zstd/pull/4557), [#4629](https://github.com/facebook/zstd/pull/4629)). Full detail: internal report `project-reports/zstd.md` |
| **flate2** (backend: `miniz_oxide`) | DEFLATE/gzip compression used by the Spin runtime | Green - pure Rust, no arch-specific assembly | Green | Published normally to crates.io | Lowest-risk dependency in this table by design |
| **wasm-encoder / wasmparser / wit-component / wit-parser** (`bytecodealliance` crates) | WASM/WIT binary format parsing, used by the Spin loader/componentizer | Green - pure Rust, no native code | Green | Published normally | Not architecture-sensitive |
| **containerd-shim-wasm** (crates.io) | Generic containerd shim scaffolding `containerd-shim-spin` builds on | Not independently assessed - pure-Rust glue crate over containerd's shim protocol, no obvious SIMD/crypto/JIT surface | - | - | Not identified as a risk in this research pass |

**Deep-dive summary:** the single dependency that matters most is Wasmtime/Cranelift - rated green (upstream CI genuinely builds+tests riscv64, ships official binaries) but formally Tier 3 with real open correctness bugs. The next-most-material risk is the crypto backend split: `ring` (default) has a confirmed riscv64 build blocker; the vendored OpenSSL alternative is more mature but carries an unresolved constant-time AES security gap on the majority of deployed riscv64 silicon.

## 11. Known Bugs and Active Issues

`spin-operator` itself has zero RISC-V-related issues (search for "riscv" returns 0 results). All RISC-V bug activity is one layer down, in `spinframework/spin` and `spinframework/containerd-shim-spin`:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [spin#1681](https://github.com/spinframework/spin/issues/1681) | Build fails on Risc-v due to Ring | Open (since 2023-08-06) | Critical - build blocker | `ring` v0.16.20 build script panics on `Option::unwrap()` for riscv64; no riscv64 branch exists in its target-config lookup. Unresolved 3+ years |
| [containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128) | Issue when running a spin image in docker/containerd on RISCV64 | Closed, `not_planned` | Critical - correctness/runtime crash | Real-hardware (VisionFive 2) reproduction: Spin app under `io.containerd.spin.v2` panics with `PermissionDenied` in Wasmtime's `code_memory.rs:254` cache-clear syscall. Worked on x86_64/arm64. Maintainers declined to fix - this is the exact containerized execution path SpinKube depends on |
| [containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102) | Building for RISCV64? | Closed, `completed` | Medium - build tooling | Standard Makefile cross-compile for riscv64 did not work; eventually closed as resolved, but the resolving PR/commit and 11-comment discussion could not be retrieved with current session access [NEEDS VERIFICATION] |

**Correctness bugs highlighted separately:** [containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128) is the most consequential - it is a reproduced, real-hardware runtime panic in exactly the code path (containerd-managed execution) that SpinKube's entire value proposition depends on, and it was explicitly closed without a fix.

## 12. Objections and Upstream Blockers

**Stated objections:** none found explicitly opposing a riscv64 port. No maintainer statement argues against riscv64 support in principle.

**Technical blockers:**
1. `ring` crate has no riscv64 build-script branch, blocking the Spin runtime from building on riscv64 without a patch ([spin#1681](https://github.com/spinframework/spin/issues/1681), unresolved since 2023).
2. A confirmed, reproduced runtime panic (`PermissionDenied` on a Wasmtime cache-clear syscall) in the containerd-managed execution path on real riscv64 hardware, root cause never diagnosed in retrievable text ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)).
3. Standard shim build tooling did not initially support the riscv64 target; resolution unverifiable from available access ([containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102)).

**Organizational blockers:**
- Maintainers closed the one concrete, hardware-validated riscv64 bug report as `not_planned` rather than accepting it as scoped work - the clearest evidence that riscv64 support for the containerized/Kubernetes execution path is not currently in-scope for the project.
- No SIP, tracking issue, or roadmap item for a riscv64 port exists anywhere in the `spinframework` org.
- No RISE Project involvement, sponsorship, or funded work ties to SpinKube, Spin, Fermyon, or Akamai - confirmed against [riseproject.dev/members/](https://riseproject.dev/members/) (Premier and General member lists) and the RISE blog index; none of these organizations appear as RISE members.

**Acceptance probability:** low in the near term. The project has no stated demand signal (zero community-filed tracking issues beyond the two individual reporters above), no RISE sponsorship, and the one substantive functional bug report was explicitly declined rather than deferred.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Optimization gap:** N/A - spin-operator is a Kubernetes control-plane operator, not an optimization-purpose project (its value does not derive from architecture-specific performance work; it would deliver its full stated value on any architecture where its dependency stack functions correctly). Step 2 of the color model is not applicable.
- **Justification:** spin-operator itself has zero riscv64 CI (build, test, or release), zero riscv64 issues/PRs/commits, and no distribution channel (PyPI, Ubuntu 26.04, Arch RISC-V, GitHub Releases) ships anything riscv64-related for it. Beyond the absence of testing, the platform's core function - running a Spin WASM app inside a containerd-managed Kubernetes pod - is confirmed non-functional on real riscv64 hardware: a reproduced panic (`PermissionDenied` in Wasmtime's `code_memory.rs:254`) on a StarFive VisionFive 2 board was documented in [containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128) and closed `not_planned` by maintainers, i.e. explicitly declined rather than merely untested. Combined with an unresolved, multi-year build blocker in the `ring` crypto crate ([spin#1681](https://github.com/spinframework/spin/issues/1681)) that prevents building the underlying Spin runtime on riscv64 at all without a patch, this meets the color model's bar for red: "a runtime crash documented as a known issue and unresolved."
- **Pending work that could change the grade:** none identified. No open PR proposes riscv64 CI, riscv64 release artifacts, or a fix for `containerd-shim-spin#128`. No RISE involvement exists to fund or drive such work. The one closed-`completed` build-tooling issue ([containerd-shim-spin#102](https://github.com/spinframework/containerd-shim-spin/issues/102)) suggests the shim can at least be made to compile for riscv64 with effort, but this alone does not address the closed-`not_planned` runtime blocker.

## 14. Investment Analysis

RISE has done and funded no work touching SpinKube, Spin, or containerd-shim-spin - confirmed against the RISE blog index, the `riseproject-dev` GitHub org (25 repos, none SpinKube-related), and RISE membership lists. All investment sized below is therefore uncovered by existing external funding.

### 14.1 Functional Enablement

The critical path is not spin-operator itself (pure Go, no arch-specific code, would build trivially for riscv64) but its dependency stack:
1. Fix or replace the `ring` crate build blocker in `spin` (upstream `ring` PR [#1436](https://github.com/briansmith/ring/pull/1436) exists as a candidate but is unmerged) so the Spin runtime builds on riscv64 from vanilla source.
2. Diagnose and fix the containerd/Wasmtime `EPERM` cache-clear panic documented in [containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128) - root cause was never identified in the retrievable issue text; likely a seccomp/capability restriction on a riscv64-specific syscall inside the container sandbox.
3. Add riscv64 to `containerd-shim-spin`'s standard build tooling (Makefile/`Cross.toml`) as a first-class target, building on the unretrievable fix that closed [#102](https://github.com/spinframework/containerd-shim-spin/issues/102).
4. Add spin-operator itself to `publish.yaml`'s `platforms:` list once the above are resolved (low effort - it is pure Go with no arch-specific code).

### 14.2 Performance Optimization

Not applicable at the spin-operator level (non-optimization-purpose project). At the dependency level, Wasmtime's Tier 3 riscv64 status (open correctness bugs #5882, #7237) and OpenSSL's non-constant-time AES fallback on non-Zkn/Zvkned hardware are the material performance/security items, but both are upstream Wasmtime/OpenSSL concerns rather than SpinKube-specific work.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `publish.yaml` (QEMU-based, following the existing `linux/arm64` pattern) once the functional blockers above are cleared, plus riscv64 coverage in `e2e.yaml`/`smoketest.yaml` to validate the actual containerd execution path that is currently broken.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix/replace `ring` crate riscv64 build blocker in `spin` (upstream dependency work) | 2-4 | Spin runtime maintainers / Bytecode Alliance | Critical |
| Functional | Diagnose and fix containerd/Wasmtime `EPERM` cache-clear panic ([containerd-shim-spin#128](https://github.com/spinframework/containerd-shim-spin/issues/128)) | 3-6 (unknown root cause; requires riscv64 hardware access) | containerd-shim-spin maintainers | Critical |
| Functional | Add riscv64 as first-class Makefile/Cross.toml target for containerd-shim-spin | 1-2 | containerd-shim-spin maintainers | High |
| Functional | Add spin-operator to `publish.yaml` `platforms:` for riscv64 | 0.5 | spin-operator maintainers | Medium (blocked on above) |
| CI/CD | Add riscv64 QEMU job to `publish.yaml`, `e2e.yaml`, `smoketest.yaml` | 1-2 | spin-operator maintainers | Medium (blocked on above) |
| Community | File a tracking issue / SIP for riscv64 support to create a documented roadmap item | 0.25 | Any contributor | High (currently zero visibility into project intent) |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [spinframework/spin-operator](https://github.com/spinframework/spin-operator) - main repository
- [SpinKube homepage](https://www.spinkube.dev/)
- [SpinKube compatibility docs](https://www.spinkube.dev/docs/misc/compatibility/)
- [spinframework/spin](https://github.com/spinframework/spin) - Spin runtime
- [spinframework/containerd-shim-spin](https://github.com/spinframework/containerd-shim-spin) - containerd shim
- [spinframework/governance](https://github.com/spinframework/governance) - GOVERNANCE.md
- [spin#1681 - Build fails on Risc-v due to Ring](https://github.com/spinframework/spin/issues/1681)
- [containerd-shim-spin#102 - Building for RISCV64?](https://github.com/spinframework/containerd-shim-spin/issues/102)
- [containerd-shim-spin#128 - Issue when running a spin image in docker/containerd on RISCV64](https://github.com/spinframework/containerd-shim-spin/issues/128)
- [spin#2508 - Dynamically detect support for Wasmtime's pooling allocator](https://github.com/spinframework/spin/pull/2508)
- [spin#2119 - cannot allocate memory (os error 12) on arm64](https://github.com/spinframework/spin/issues/2119)
- [spin#2343 - Disable pooling allocator automatically in environments where it will fail](https://github.com/spinframework/spin/issues/2343)
- [spin#2596 - add support for client certs](https://github.com/spinframework/spin/pull/2596)
- [containerd-shim-spin#393 - dependency bump (incidental riscv64 mention)](https://github.com/spinframework/containerd-shim-spin/pull/393)
- [containerd-shim-spin#169 - nix crate bump (incidental riscv64 mention, unmerged)](https://github.com/spinframework/containerd-shim-spin/pull/169)
- [bytecodealliance/wasmtime#8610 - pooling allocator VA-space detection (mirrored by spin#2508)](https://github.com/bytecodealliance/wasmtime/issues/8610)
- [bytecodealliance/wasmtime#5882 - bus error on unaligned atomics](https://github.com/bytecodealliance/wasmtime/issues/5882)
- [bytecodealliance/wasmtime#7237 - partial OOB write](https://github.com/bytecodealliance/wasmtime/issues/7237)
- [briansmith/ring#1620 - riscv64 support tracking](https://github.com/briansmith/ring/issues/1620)
- [briansmith/ring#1436 - candidate riscv64 patch](https://github.com/briansmith/ring/pull/1436)
- [openssl#31080 - constant-time AES fallback](https://github.com/openssl/openssl/pull/31080)
- [openssl#31082 - constant-time AES fallback](https://github.com/openssl/openssl/pull/31082)
- [facebook/zstd#4596 - RVV compression perf](https://github.com/facebook/zstd/pull/4596)
- [facebook/zstd#4557 - RVV perf](https://github.com/facebook/zstd/pull/4557)
- [facebook/zstd#4629 - RVV perf](https://github.com/facebook/zstd/pull/4629)
- [Mozilla Bugzilla #1975867 - SpiderMonkey riscv64 NaN-boxing bug (unrelated project, cited to rule out confusion)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867)
- [matsbror/containerd-shim-spin@riscv-arm - reporter's working fork](https://github.com/matsbror/containerd-shim-spin/tree/riscv-arm)
- [matsbror/spin@v2.5.1 - reporter's working fork](https://github.com/matsbror/spin/tree/v2.5.1)
- [nigelpoulton/dockercon2023-wasm-lab - sample app used in #128 reproduction](https://github.com/nigelpoulton/dockercon2023-wasm-lab)
- [pypi.org/pypi/spinkube/json - PyPI package lookup (404)](https://pypi.org/pypi/spinkube/json)
- [packages.ubuntu.com search for SpinKube in resolute](https://packages.ubuntu.com/search?keywords=SpinKube&suite=resolute&searchon=names&section=all)
- [archriscv.felixc.at - Arch Linux RISC-V unofficial repo](https://archriscv.felixc.at)
- [riseproject.dev/members/ - RISE Project membership list](https://riseproject.dev/members/)
- [riseproject.dev/blog - RISE Project blog index](https://riseproject.dev/blog)
- [riseproject.gitlab.io/python/wheel_builder/ - RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- Internal report: `project-reports/wasmtime.md`
- Internal report: `project-reports/openssl.md`
- Internal report: `project-reports/zstd.md`
