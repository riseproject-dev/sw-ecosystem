---
title: Wasm Workers Server
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="wasm-workers-server" %}

# Wasm Workers Server

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Wasm Workers Server<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wasm Workers Server (`wws`) is a Rust application that runs a local/edge HTTP server executing WebAssembly "workers" via the [Wasmtime](https://github.com/bytecodealliance/wasmtime) runtime. It is a standalone binary/CLI tool, not a library consumed by a package ecosystem.

Governance: no independent foundation. The project was created and solely maintained by VMware, Inc. as a "VMware Labs" project (copyright "(c) 2022/2023 VMware, Inc.", Apache-2.0 license). There is no MAINTAINERS, OWNERS, CODEOWNERS, or GOVERNANCE file in the repository history; contributions require signing VMware's own CLA (cla.vmware.com), a standard single-corporate-copyright model rather than a foundation-chartered one.

Corporate sponsor / maintainers (by commit volume, all VMware/Broadcom-affiliated): Angel M De Miguel (~143 commits, lead), Rafael Fernandez Lopez (43 commits, email domain shifted from `@vmware.com` to `@broadcom.com`, reflecting the Broadcom acquisition), Asen Alexandrov (14 commits), plus the VMware GitHub Bot (6 automation commits). No other company appears among top committers.

Current status: the [vmware-labs/wasm-workers-server](https://github.com/vmware-labs/wasm-workers-server) repository carries a banner stating it will be archived, with development continuing as an independent community fork at [webassemblylabs/wasm-workers-server](https://github.com/webassemblylabs/wasm-workers-server). The last commit to the VMware repo was 2024-05-31; the fork has received exactly one post-fork community commit (2024-06-03), so the "community continuation" is nascent, not an active project.

Community culture on new ports: effectively silent. No issues, discussions, or roadmap items request or discuss RISC-V support beyond a single throwaway bullet (see Section 2). Combined with the archival banner and the barely-active fork, there is no evidence of institutional appetite, from either VMware/Broadcom or the fork maintainers, for adding new CPU architecture support.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022 | Project created by VMware Labs (per LICENSE/NOTICE copyright headers) | [Repository](https://github.com/vmware-labs/wasm-workers-server) |
| 2023-10-16 | Commit `a7bf26b` ("feat: provide the right URL to workers (#234)") incidentally adds `@esbuild/linux-riscv64` as a transitive npm dependency inside `examples/js-hono`'s `package-lock.json`. This is esbuild's own prebuilt-binary manifest entry, not any RISC-V enablement work for `wws` itself. | Full commit-history grep of both `vmware-labs` and `webassemblylabs` repos for "riscv" |
| (undated, issue #6 filed early in project life, closed) | Issue #6, "Add automation to build the different binaries in every release," lists "RISC-V (if possible)" as one bullet under an "Optional" wishlist section. Zero comments; no follow-up PR referencing RISC-V; issue closed with RISC-V never implemented. | [Issue #6](https://github.com/vmware-labs/wasm-workers-server/issues/6) |
| 2024-05-31 | Last commit to `vmware-labs/wasm-workers-server` before archival | Repository commit history |
| 2024-06-03 | First (and to date, only) commit to the community fork `webassemblylabs/wasm-workers-server` | [webassemblylabs/wasm-workers-server](https://github.com/webassemblylabs/wasm-workers-server) |

No genuine riscv64 port exists, upstream or in the fork. Key contributors: none, for RISC-V specifically, since no work was ever done. Is it fully upstream? Not applicable, there is nothing to upstream.

## 3. Upstream Support Tier

No formal tier policy (tier-1/tier-2/etc.) is documented anywhere in the repository. The project supports two build architectures (x86_64, aarch64) across three OS targets (Linux, macOS, Windows), treated uniformly with no explicit tiering language.

| | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI build | yes (native, `ubuntu-latest`/`macos-latest`/`windows-latest`) | yes (Linux via `cross`; native on macOS/Windows GH runners) | no |
| CI test execution | yes (`build-and-test` job, `build.yml`) | not confirmed as executed against the cross-compiled artifact; `build.yml` runs no arch matrix at all | no |
| Release binary (GitHub Releases v1.7.0) | yes: `wws-linux-musl-x86_64.tar.gz`, plus macOS/Windows x86_64 | yes: `wws-linux-musl-aarch64.tar.gz`, plus macOS/Windows aarch64 | no |
| Container image platform | yes (`linux/amd64`) | yes (`linux/arm64`) | no |

Source: [`.github/workflows/artifacts.yml`, `build.yml`, `container-preview.yml`, `container-release.yml`](https://github.com/vmware-labs/wasm-workers-server/tree/main/.github/workflows), read directly at HEAD `918569779cbf60c008c9732e89bd5699e28ef57b`; [GitHub Releases v1.7.0 asset list](https://github.com/vmware-labs/wasm-workers-server/releases/expanded_assets/v1.7.0).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Wasm Workers Server's own source tree contains **zero architecture-specific code for any architecture**, not just riscv64. GitHub code search against the repository for `target_arch`, `"#ifdef __riscv"`, and `x86_64 aarch64 extension:rs` all return 0 results. There is no `arch/` directory, no `#[cfg(target_arch = ...)]` conditional compilation anywhere in the codebase.

This is architecturally expected: `wws` is a high-level Rust application built on `wasmtime`/Cranelift. All actual machine-code generation (JIT codegen for each target ISA) is delegated to the Wasmtime/Cranelift dependency, not implemented in `wws`'s own source. `wws`'s "architecture support" is purely a build-target and release-packaging concern (which Rust target triple to cross-compile and which artifact to publish), never a source-level one.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT/codegen | N/A in `wws` itself; delegated entirely to Wasmtime/Cranelift | N/A in `wws` itself; delegated | N/A in `wws` itself; delegated (Wasmtime's own riscv64gc backend is Tier 3, see Section 9) |
| SIMD | N/A in `wws` itself | N/A in `wws` itself | N/A in `wws` itself |
| Crypto | via OpenSSL dependency (Section 9) | via OpenSSL dependency | via OpenSSL dependency (with an unresolved AES T-table timing gap on riscv64, Section 9) |
| Hand-written assembly | none in `wws` | none in `wws` | none in `wws` |

Source: [`mcp__github__search_code` queries against `vmware-labs/wasm-workers-server`](https://github.com/vmware-labs/wasm-workers-server) (0 results for all arch-related patterns), full-tree grep of the shallow clone at HEAD `918569779cbf60c008c9732e89bd5699e28ef57b`.

## 5. Build System, Cross-Compilation, and Toolchain

Build system: Cargo/rustc (`Cargo.toml` + workspace crates under `crates/`), plus a thin `Makefile` (`cargo build --release`, and `docker buildx build --platform linux/arm64/v8,linux/amd64` for container images). There is no CMakeLists.txt, no `cmake/` toolchain files, no `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` anywhere in the repo, this is not a CMake project.

Cross-compilation of the aarch64-linux release binary uses the [`cross`](https://github.com/cross-rs/cross) tool (Docker-based cross-compilation); macOS and Windows builds run natively on GitHub-hosted `macos-latest`/`windows-latest` runners. `install.sh` recognizes only `aarch64`, `x86_64`, and `x86_32` as valid target architectures.

There is no riscv64gc-unknown-linux-* target anywhere: not in `Cargo.toml`, not in any CI workflow, not in a `Cross.toml`, and not in `install.sh`. No QEMU usage appears in any workflow except `docker/setup-qemu-action`, which is used only to cross-build the `linux/amd64,linux/arm64` container image, never for a riscv64 platform.

No documented toolchain version requirements, build flags, or known build failures exist for riscv64, because riscv64 has never been attempted.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There is no partial feature gap to enumerate: riscv64 has zero functional coverage. A user cannot obtain a working `wws` binary for riscv64 through any official channel; the only path would be building unofficially from source (untested by anyone, per all research channels checked, Section 2 and 8).

Performance gap: not measurable, no riscv64 build exists to benchmark. No third-party riscv64-vs-arm64/amd64 benchmark of `wws` was found in any web search or benchmark repository (Section 11 covers the search performed).

Security hardening gap: the project's `vendored-openssl` feature path (used by `wws-project`'s git-template support via `git2`) would inherit OpenSSL's riscv64 AES T-table non-constant-time fallback on hardware lacking Zkn/Zvkned extensions, a live side-channel gap documented against the OpenSSL dependency itself (Section 9), should `wws` ever be built for riscv64.

NaN / floating-point semantics: not assessed, no riscv64 build exists to test Wasmtime's floating-point/NaN canonicalization behavior on riscv64 in the context of this project.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by directly reading all four workflow files at HEAD `918569779cbf60c008c9732e89bd5699e28ef57b`:

| File | Trigger | Runner(s) | Arch matrix | riscv64? |
|---|---|---|---|---|
| [`artifacts.yml`](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/artifacts.yml) | `push: tags: v[0-9]+.[0-9]+.[0-9]+` | `ubuntu-latest`/`windows-latest`/`macos-latest` | `x86_64`, `aarch64` only (aarch64-linux via `cross`) | absent |
| [`build.yml`](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/build.yml) | `push`/`pull_request` on `main`, `v[0-9]+.[0-9]+` | `ubuntu-latest`, `macos-latest`, `windows-latest` | no arch matrix; native runner arch only | absent |
| [`container-preview.yml`](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/container-preview.yml) | `push` to `main` | `ubuntu-latest` (QEMU/Buildx for image step) | `aarch64`, `x86_64`; container `platforms: linux/amd64,linux/arm64` | absent |
| [`container-release.yml`](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/container-release.yml) | `push: tags: v[0-9]+.[0-9]+.[0-9]+` | `ubuntu-latest` (QEMU/Buildx for image step) | `aarch64`, `x86_64`; container `platforms: linux/amd64,linux/arm64` | absent |

Repo-wide `grep -rniI "riscv"` across the full working tree (code, docs, CI configs) returns zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.circleci` config exists. No `workflow_dispatch` or `schedule` trigger exists anywhere. No RISE RISC-V runner labels or references appear in any workflow. No native or QEMU riscv64 hardware is used anywhere in the pipeline.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | not confirmed as arch-specific execution | no |
| CI release publish | yes | yes | no |

## 8. Distribution and Release Status

**No riscv64 distribution channel exists for this project through any avenue checked:**

- GitHub Releases v1.7.0: 8 assets total (`wws-linux-musl-aarch64.tar.gz`, `wws-linux-musl-x86_64.tar.gz`, `wws-macos-darwin-aarch64.tar.gz`, `wws-macos-darwin-x86_64.tar.gz`, `wws-pc-windows-aarch64.tar.gz`, `wws-pc-windows-x86_64.tar.gz`, source zip, source tar.gz). No riscv64 asset. [Source](https://github.com/vmware-labs/wasm-workers-server/releases/expanded_assets/v1.7.0).
- PyPI: `https://pypi.org/pypi/wasm-workers-server/json` returns HTTP 404, no package exists under this name (expected, this is a Rust binary tool, not distributed via PyPI). [Source](https://pypi.org/pypi/wasm-workers-server/json).
- RISE Python wheel builder (GitLab PyPI proxy): redirects to the same PyPI 404. [Source](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasm-workers-server/).
- Ubuntu 26.04 (resolute): "Sorry, your search gave no results" for any architecture, not just riscv64, the package is not in Ubuntu's archive at all. [Source](https://packages.ubuntu.com/search?keywords=Wasm%20Workers%20Server&suite=resolute&searchon=names&section=all).
- Arch Linux RISC-V (archriscv.felixc.at): no entry matching "wasm workers server". [Source](https://archriscv.felixc.at/?q=wasm%20workers%20server).

What a user must do to get a working binary on riscv64: build from source manually using Cargo, adding a `riscv64gc-unknown-linux-gnu` target that does not currently exist in the project's toolchain configuration, install scripts, or CI. This path is entirely unverified, no one has reported doing it successfully (Section 11).

Note: the `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) throughout this research for the intended authoritative SPARQL check against the Ubuntu 26.04 riscv64 package graph. The live `packages.ubuntu.com` fallback query above is corroborating but not the graph query itself; this should be re-run once the connection is restored.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Rust | build-dependency, critical | riscv64gc-unknown-linux-gnu is an upstream-supported (Tier 2/3-class) Rust target [NEEDS VERIFICATION: exact tier not confirmed in this research pass] | n/a (toolchain, not tested independently) | Rust project ships riscv64gc host/target toolchains | Toolchain prerequisite for any riscv64 build of `wws` |
| cargo | build-dependency, critical | ships with the Rust toolchain for riscv64 targets | n/a | n/a | Standard Rust build tool; no riscv64-specific issue found |
| Wasmtime | runtime-dependency, critical | full riscv64gc-unknown-linux-gnu Cargo/CMake cross-build upstream, Tier 3 | upstream QEMU-emulated test matrix runs on merge-queue/release branches (not every PR); 8 open correctness bugs found including bus-error on unaligned atomics (#5882), partial OOB writes (#7237), ISLE panics (#13959, #12195) | upstream GitHub Releases ship official riscv64gc-linux tarballs; no PyPI wheel, no Ubuntu package | `wws` pins Wasmtime `13.0.0`, far behind current upstream (~v48); see dedicated report `project-reports/wasmtime.md` (color: green) |
| cross | build-dependency, optional | Docker-based cross-compilation tool used today only for the aarch64-linux release build; not configured for riscv64 in this project's `Cross.toml`/CI | n/a | n/a | Would need a riscv64 target entry added to enable a `wws` riscv64 release build |
| wasmtime-wasi-nn / wasi-common | runtime-dependency (indirect, via `wws-worker` crate for the `rust-wasi-nn` example) | depends entirely on its backend (OpenVINO); `wasi-common` itself is portable Rust | inherits OpenVINO's QEMU-only, narrow-filter test coverage | no riscv64 wheel/binary distribution for wasmtime-wasi-nn itself | Gated on OpenVINO riscv64 maturity |
| OpenVINO Runtime | runtime-dependency (indirect, ML inference backend behind wasi-nn) | not packaged in Ubuntu 26.04 riscv64 (any arch); upstream cross-compile only via `riscv-collab` toolchain + custom CMake toolchain file, experimental tier, no native convolution/BRGEMM JIT kernel (scalar fallback) | upstream QEMU CI, narrow test filter, not release-blocking | no official riscv64 binaries anywhere (PyPI, GitHub Releases, storage.openvinotoolkit.org) | See `project-reports/openvino-runtime.md` (color: blue, optimization: partial). Weakest link in the dependency chain if wasi-nn examples are exercised on riscv64 |
| OpenSSL | runtime-dependency (indirect, TLS/crypto behind `vendored-openssl` feature and `git2`'s HTTPS transport) | packaged in Ubuntu 26.04 riscv64 (`libssl-dev` 3.5.5-1ubuntu3 confirmed); upstream riscv64 port merged 2022, actively extended | upstream unconditional QEMU baseline CI + conditional extension matrix; open reliability bug, SSL tests hang at HARNESS_JOBS>=38 (#22166, open since 2023) | distro-packaged; no upstream prebuilt binaries (standard for OpenSSL on every arch) | **Critical unresolved security gap**: AES T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned; fix PRs #31080/#31082 open. See `project-reports/openssl.md` (color: blue) |
| libgit2 | runtime-dependency (indirect, via `git2` crate for git-based project templates) | packaged in Ubuntu 26.04 riscv64 (`libgit2-dev` 1.9.1+ds-1ubuntu1 confirmed) | no riscv64-specific correctness issues found via GitHub issue search | distro-packaged across jammy/noble/questing/resolute for riscv64 | Portable C, no dedicated report exists |
| zstd | runtime-dependency (indirect, compression, transitively via OpenSSL and Cargo.lock) | packaged in Ubuntu 26.04 riscv64 (`zstd`/`libzstd-dev` 1.5.7+dfsg-3); upstream RVV-vectorized hot paths merged, but 7 further RVV/perf PRs stalled 2-6 months | PR-only QEMU CI, not push/nightly, not release-blocking | distro-packaged; no upstream GitHub binary releases for any arch | See `project-reports/zstd.md` (color: blue) |
| brotli | runtime-dependency (indirect, compression, transitively via HTTP-stack crates) | packaged in Ubuntu 26.04 riscv64 (`brotli`/`libbrotli-dev` 1.2.0-3build1); base port merged 2018 | zero upstream CI of any kind for riscv64; two RVV optimization PRs stalled/abandoned | distro-packaged only; no upstream binaries, no PyPI wheel | See `project-reports/brotli.md` (color: yellow) |
| flate2 | runtime-dependency (indirect, gzip/deflate, used transitively) | pure-Rust wrapper (miniz_oxide) or links system zlib (`libz-dev`, universally packaged incl. riscv64); no architecture-specific code path | no riscv64-specific issues found | standard crates.io publish | No dedicated report exists |

Cross-cutting observations: `wws` uses the system default allocator throughout, no jemalloc/mimalloc/tcmalloc is pulled in, eliminating that risk category. The weakest link in the dependency graph is the wasi-nn to OpenVINO chain (experimental, no native riscv64 GEMM/convolution JIT), not Wasmtime's core JIT path. The highest-severity unresolved item across the whole dependency set is OpenSSL's AES T-table non-constant-time fallback on riscv64 hardware without Zkn/Zvkned, a live side-channel security gap, not a build/test/release gap. Wasmtime and OpenVINO are absent from Ubuntu's archive entirely on every architecture, so `wws` itself would need to be built from source or via upstream release tarballs on Ubuntu 26.04 riscv64 regardless of its other dependencies' packaging maturity.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#6](https://github.com/vmware-labs/wasm-workers-server/issues/6) | "Add automation to build the different binaries in every release" | closed | n/a (not a bug) | Lists "RISC-V (if possible)" as one optional bullet in a general release-automation issue. Zero comments, never acted on, no follow-up PR merged for RISC-V. Not a riscv64 correctness bug or tracking issue. |

No riscv64-specific correctness, build, or runtime bugs exist because no riscv64 build has ever been attempted for this project. `mcp__github__search_pull_requests` for riscv/riscv64/risc-v against this repository returns 0 results; `mcp__github__search_issues` returns exactly the one match above. GitHub's own search UI (`issues?q=riscv`, `search?q=repo:...+riscv&type=issues`) independently confirms 0 or 1 result across multiple query variants. Note: an earlier research pass in this evidence log also checked issue #63 ("Adding multi-language support") as a tangential search hit and confirmed it has no RISC-V content.

## 12. Objections and Upstream Blockers

Stated objections: none found, RISC-V has never been discussed substantively by any maintainer.

Technical blockers: none structural, Wasmtime (the actual execution engine) already has a Tier 3 riscv64gc-unknown-linux-gnu port upstream (Section 9), so the technical path to adding a `wws` riscv64 build target is not blocked by a missing dependency capability, only by the absence of the work itself (CI matrix entry, `cross`/`Cross.toml` configuration or native runner, release packaging).

Organizational blockers: significant. The upstream repository is marked for archival with no active maintainer engagement, and the community fork (`webassemblylabs/wasm-workers-server`) has received only one commit since forking in mid-2024. There is no corporate sponsor with a stated interest in RISC-V (VMware/Broadcom is not a RISE member; Section 1). No RISE involvement was found in any channel checked: not a RISE member organization, not mentioned in any of RISE's 34 blog posts (full sitemap and RSS reviewed), not in the RISE Python wheel builder's supported-package list, and no wasm-related repository in the `riseproject-dev` GitHub org.

Acceptance probability: low in the near term, given the archival status and dormant fork. A riscv64 port would most plausibly need to originate from a third party willing to both do the CI/build work and sustain it against a project with minimal active maintenance.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No riscv64 CI exists in any of the four GitHub Actions workflow files ([`artifacts.yml`](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/artifacts.yml), `build.yml`, `container-preview.yml`, `container-release.yml`), confirmed by direct file read at HEAD `918569779cbf60c008c9732e89bd5699e28ef57b`, and no riscv64 asset exists in GitHub Releases [v1.7.0](https://github.com/vmware-labs/wasm-workers-server/releases/expanded_assets/v1.7.0). The distribution floor does not apply because no Linux distribution (Ubuntu 26.04 resolute checked directly) packages `wasm-workers-server` at all, for any architecture, so there is no distro build to upgrade the grade from baseline "no upstream CI." This is not an optimization-purpose project (it is a server application whose execution engine, Wasmtime, is a separate dependency), so the Step 2 optimization modifier does not apply.
- **Pending work that could change the grade:** none identified. No open riscv64 PR exists against the upstream repository (`search_pull_requests` returns 0 results for riscv/riscv64/risc-v). No RISE involvement or funded work targets this project. The upstream repository's archival status and the fork's near-total inactivity (one commit since June 2024) mean the grade is unlikely to change without new, currently unplanned, third-party investment.

## 14. Investment Analysis

RISE has not funded or performed any work on this project: confirmed via full review of RISE's 34 blog posts, the RISE Python wheel builder's package list, and the `riseproject-dev` GitHub org repository list (Section 1, Section 12). No prior RISE work exists to net out of the estimates below.

### 14.1 Functional Enablement

Add a `riscv64gc-unknown-linux-gnu` target to `Cargo.toml`/CI, extend `cross`/`Cross.toml` (or a native riscv64 runner) to build the release binary, and extend `install.sh` to recognize `riscv64`. Because Wasmtime already has an upstream Tier 3 riscv64gc port (Section 9), the core execution engine is not a blocker; the work is primarily CI/build-matrix plumbing plus validating the transitive dependency chain (OpenSSL, libgit2, zstd, brotli, flate2) builds cleanly, all of which are already riscv64-packaged in Ubuntu 26.04 per Section 9.

### 14.2 Performance Optimization

Not applicable in the traditional sense: `wws` itself has no architecture-specific code to optimize (Section 4), all codegen/SIMD/crypto work is delegated to dependencies. Any performance work would target Wasmtime/Cranelift's riscv64 backend directly (out of scope for this project) rather than `wws`'s own source.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `artifacts.yml` (release binaries), `container-preview.yml`/`container-release.yml` (add `linux/riscv64` to the Buildx platform list), and ideally `build.yml` for test execution. RISE's free RISC-V GitHub Actions runners (announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), update [2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)) are a candidate resource for native (non-QEMU) test execution, though no evidence this project has engaged with that offering.

### 14.4 Ecosystem Enablement

Not applicable, Section 10 is omitted, `wws` has no dependent package ecosystem (npm, PyPI, Maven) requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64gc-unknown-linux-gnu target to Cargo/CI build matrix; validate build against existing riscv64-packaged transitive deps (OpenSSL, libgit2, zstd, brotli, flate2) | 1-2 | Upstream (VMware/Broadcom) or fork maintainers, or third party | Medium (project is in maintenance/archival mode, so organizational blocker outweighs technical effort) |
| CI/CD | Add riscv64 job to `artifacts.yml`, `build.yml` (test execution), and `linux/riscv64` platform to container workflows; evaluate RISE RISC-V runners for native test execution | 1-2 | Same as above | Medium |
| Functional | Address organizational blocker: engage upstream or fork maintainers, or fork the project independently if archival proceeds and no response is received | n/a (organizational, not engineering effort) | Requesting organization | High (gates all other work) |
| Optimization | None applicable, `wws` has no architecture-specific code of its own; any optimization work belongs to the Wasmtime dependency (see `project-reports/wasmtime.md`) | 0 (out of scope for this project) | n/a | Low |

## 15. Updates

(No updates yet, initial report dated 2026-06-17.)

## 16. References

- [vmware-labs/wasm-workers-server (repository)](https://github.com/vmware-labs/wasm-workers-server)
- [Wasm Workers Server homepage](https://workers.wasmlabs.dev/)
- [webassemblylabs/wasm-workers-server (community fork)](https://github.com/webassemblylabs/wasm-workers-server)
- [artifacts.yml workflow](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/artifacts.yml)
- [build.yml workflow](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/build.yml)
- [container-preview.yml workflow](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/container-preview.yml)
- [container-release.yml workflow](https://github.com/vmware-labs/wasm-workers-server/blob/main/.github/workflows/container-release.yml)
- [GitHub Releases v1.7.0 asset list](https://github.com/vmware-labs/wasm-workers-server/releases/expanded_assets/v1.7.0)
- [Issue #6, release automation wishlist including "RISC-V (if possible)"](https://github.com/vmware-labs/wasm-workers-server/issues/6)
- [GitHub issue search: repo:vmware-labs/wasm-workers-server riscv](https://github.com/search?q=repo:vmware-labs/wasm-workers-server+riscv&type=issues)
- [GitHub issue search: riscv (via repo issue search UI)](https://github.com/vmware-labs/wasm-workers-server/issues?q=riscv)
- [GitHub issue search: performance/benchmark](https://github.com/search?q=repo:vmware-labs/wasm-workers-server+performance+benchmark&type=issues)
- [PyPI JSON API for wasm-workers-server (404)](https://pypi.org/pypi/wasm-workers-server/json)
- [RISE GitLab PyPI proxy for wasm-workers-server (redirects to PyPI 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasm-workers-server/)
- [Ubuntu 26.04 (resolute) package search, no results](https://packages.ubuntu.com/search?keywords=Wasm%20Workers%20Server&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search, no results](https://archriscv.felixc.at/?q=wasm%20workers%20server)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project blog post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Project RSS feed](https://riseproject.dev/feed/)
- [RISE Python wheel builder supported-package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [A Glimpse Into V8 Development for RISC-V (RISE blog, unrelated project cross-check)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [hwclass/wasm-workers-server-benchmarks (third-party benchmark repo, no RISC-V content)](https://github.com/hwclass/wasm-workers-server-benchmarks)
- Internal dependency reports: `project-reports/wasmtime.md` (color: green), `project-reports/openssl.md` (color: blue), `project-reports/openvino-runtime.md` (color: blue, optimization: partial), `project-reports/zstd.md` (color: blue), `project-reports/brotli.md` (color: yellow)
