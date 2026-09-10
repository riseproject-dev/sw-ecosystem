---
title: Scale
parent: Project Reports
color: red
dependencies:
  - name: Wazero
    relation: runtime-dependency
    criticality: critical
  - name: QuickJS
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: esbuild
    relation: build-dependency
    criticality: optional
---

# Scale

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Scale<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="scale" %}

## 1. Project Overview

Scale ([github.com/loopholelabs/scale](https://github.com/loopholelabs/scale), homepage [scale.sh](https://scale.sh/)) is a WebAssembly-based plugin/function framework. It compiles Go, Rust, and TypeScript "guest" functions to `wasm32-wasi` bytecode, which a Go host process then loads and executes inside the [wazero](https://github.com/tetratelabs/wazero) WASM runtime. The project's stated goals are sandboxed extension execution, low startup latency, and cross-language plugin portability.

The homepage `scale.sh` currently returns HTTP 404 (dead/decommissioned) despite being referenced as the canonical docs domain in the repository README.

**Governance:** Scale is a single-vendor, VC-funded project with no foundation affiliation (not CNCF, Apache, Linux Foundation, or similar). It is wholly owned and governed by Loophole Labs, Inc., a systems-infrastructure startup founded in 2021 and funded by Amplify Partners, Cervin Ventures, and Peak XV. There is no OWNERS/CODEOWNERS or formal governance document, only a flat `MAINTAINERS.md`. All three named maintainers, Shivansh Vij (@shivanshvij), Dan(iel) Phillips (@dphilla), and Jimmy Moore (@jimmyaxod), are Loophole Labs employees; the remaining commit history is dependabot/github-actions automation plus a handful of one-off external contributors, none of them maintainers.

**Project status:** `loopholelabs/scale` was archived by its owner on 2025-10-17 and is now read-only. The companion `loopholelabs/scale-benchmarks` repository was archived on 2025-09-30. No new issues, PRs, or commits can be filed against either repository going forward.

**Community culture on new ports:** `CONTRIBUTING.md` states no explicit policy on architecture/platform ports; general guidance is limited to "open a PR for trivial fixes" and "discuss non-trivial work on Discord first." There is no `PLATFORMS.md`, `SUPPORT.md`, or platform-tier documentation of any kind. License is Apache 2.0.

License and governance data source: repository files `MAINTAINERS.md`, `CONTRIBUTING.md`, and `LICENSE` at [loopholelabs/scale](https://github.com/loopholelabs/scale) (local clone, HEAD `fa61d80bd57bf5fea18921f214cec72d84e0740c`).

## 2. Port History and Upstreaming Timeline

No RISC-V port exists or has ever been attempted.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv/riscv64/risc-v reference in any commit, issue, PR, or code across the repository's full history | `git log --all --grep=riscv` (case-insensitive) on the local clone, and GitHub `search_commits`/`search_issues`/`search_pull_requests`/`search_code` scoped to `repo:loopholelabs/scale`, all returning zero results |
| 2025-09-30 | `loopholelabs/scale-benchmarks` archived by owner | GitHub repository metadata |
| 2025-10-17 | `loopholelabs/scale` archived by owner (read-only) | GitHub repository metadata |

No key contributors worked on RISC-V support because no such work exists. The port is not upstream, not in progress, and, with the repository now archived, cannot be merged upstream without a fork.

## 3. Upstream Support Tier

No formal tier policy exists (no `PLATFORMS.md`/`SUPPORT.md`). Evidence from CI and releases is unambiguous: no riscv64 build, no riscv64 test execution, no riscv64 release artifact, and (per Section 4) a confirmed hard build failure in the native builder toolchain on a `linux/riscv64` host.

| Architecture | CI build | CI test | Official release binary |
|---|---|---|---|
| amd64 (x86_64) | Yes, on `ubuntu-latest`/`ubuntu-20.04` | Yes (`test.yml`) | Yes, `jsbuilder-x86_64-{linux,macos,windows}` |
| arm64 | Yes, cross-compiled in `typescript_compiler.yml` builder matrix (`aarch64-unknown-linux-gnu`, `aarch64-apple-darwin`) | No dedicated arm64 test job found | Yes, `jsbuilder-arm-{linux,macos}` |
| riscv64 | No | No | No, and native builder toolchain does not build on riscv64 hosts (Section 4) |

Source: `.github/workflows/{lint,release,test,typescript_compiler}.yml` at [loopholelabs/scale](https://github.com/loopholelabs/scale), and GitHub release asset listings for v0.4.8 and v0.3.19 at `https://github.com/loopholelabs/scale/releases`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Scale's guest payloads are `wasm32-wasi` bytecode, which is architecture-independent by design, this is the whole point of targeting WebAssembly rather than native code. The only place native, per-host-architecture code exists is the TypeScript-to-WASM compiler toolchain under `compile/typescript/builder/`.

**Native builder binary embeds (`compile/typescript/builder/`):**

| File | Build tag | Covers |
|---|---|---|
| `builder_x86_64-linux.go` | `linux && amd64` | embeds `js_builder-x86_64-unknown-linux-gnu` |
| `builder_x86_64-macos.go` | `darwin && amd64` | embeds `js_builder-x86_64-apple-darwin` |
| `builder_x86_64-windows.go` | `windows && amd64` | embeds `js_builder-x86_64-pc-windows-msvc.exe` |
| `builder_arm-linux.go` | `linux && arm64` | embeds `js_builder-aarch64-unknown-linux-gnu` |
| `builder_arm-macos.go` | `darwin && arm64` | embeds `js_builder-aarch64-apple-darwin` |
| `builder_other.go` | `!darwin && !linux && !windows` | empty fallback `var BuilderExecutable []byte` |

No `builder_riscv64-linux.go` (or any riscv variant) exists, and `builder_other.go`'s tag explicitly excludes `linux`. On `GOOS=linux, GOARCH=riscv64`, none of the six files' build tags match: not the amd64/arm64 files (wrong architecture), and not `builder_other.go` (wrong OS, it targets non-linux/darwin/windows platforms only). Consequently the `builder` Go package has no file defining `BuilderExecutable`, which produces a compile-time `undefined: BuilderExecutable` error. This is a confirmed hard build failure, not a graceful fallback.

The underlying Rust toolchain has an independent, corroborating failure mode. `compile/typescript/builder/quickjs-wasm-sys/build.rs` (which downloads the WASI SDK needed to build the vendored QuickJS engine to WASM) contains:

```rust
let file_suffix = match (env::consts::OS, env::consts::ARCH) {
    ("linux", "x86") | ("linux", "x86_64") => "linux",
    ("macos", "x86") | ("macos", "x86_64") | ("macos", "aarch64") => "macos",
    ("windows", "x86") => "mingw-x86",
    ("windows", "x86_64") => "mingw",
    other => return Err(anyhow!("Unsupported platform tuple {:?}", other)),
};
```

riscv64 falls into the `other` arm and hard-errors with `"Unsupported platform tuple"`. The build toolchain itself cannot be compiled on a riscv64 host, independent of the Go build-tag gap above.

There is no JIT, SIMD, crypto, or assembly code native to Scale itself (the only C source in the repository is the vendored QuickJS engine at `compile/typescript/builder/quickjs-wasm-sys/quickjs/{quickjs.c,quickjs.h,qjs.c,qjsc.c}`, used solely to build the TypeScript compiler; it contains no riscv-specific code, `__riscv` guards, or inline assembly). All WASM execution happens through the wazero runtime dependency (see Section 9), which is where the project's only architecture-relevant execution-engine gap lives (interpreter-only on riscv64, no JIT).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native builder binary (host CLI) | Prebuilt, embedded | Prebuilt, embedded | Missing, build tag gap causes compile failure |
| QuickJS WASI-SDK build step | Supported | Supported | Hard error, "Unsupported platform tuple" |
| WASM guest payload execution (via wazero) | JIT (wazevo) | JIT (wazevo) | Interpreter only, no wazevo backend |

Source: local clone of [loopholelabs/scale](https://github.com/loopholelabs/scale) (HEAD `fa61d80bd57bf5fea18921f214cec72d84e0740c`), files `compile/typescript/builder/builder_*.go` and `compile/typescript/builder/quickjs-wasm-sys/build.rs`.

## 5. Build System, Cross-Compilation, and Toolchain

Per `test.yml`'s `integration-test` job: Go 1.21, TinyGo 0.29.0, Rust 1.74.1 (targeting `wasm32-wasi`), and Node 20. No riscv64 target or QEMU step appears in any workflow.

Toolchain versions and why, where documented:
- Go 1.21: builds the Scale host CLI/tooling and compiles Go-language guest functions via TinyGo.
- TinyGo 0.29.0: compiles Go guest functions to `wasm32-wasi`. Its own riscv64-as-*host*-platform build/run status (as opposed to riscv32 as a TinyGo *compile target* for microcontrollers) was not conclusively verified in this research. [NEEDS VERIFICATION]
- Rust 1.74.1 targeting `wasm32-wasi`: compiles Rust guest functions and builds the QuickJS-based TypeScript compiler toolchain.
- Node 20: used in JS/TS-side build and packaging steps.

**Known build failure on riscv64 (confirmed via source inspection, not via an actual CI run):** `go build` of the `compile/typescript/builder` package fails with `undefined: BuilderExecutable` on `GOOS=linux, GOARCH=riscv64` (Section 4), and the Rust `quickjs-wasm-sys` `build.rs` independently fails with `"Unsupported platform tuple"` for the same host. No QEMU-based riscv64 build has ever been attempted in CI (repo-wide grep for `riscv`, `QEMU`, `linux/riscv64` across all workflow files: zero matches).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build native builder CLI | Yes | Yes | No, compile-time failure |
| Run prebuilt builder CLI binary | Yes (shipped) | Yes (shipped) | No binary exists |
| Compile TypeScript guest functions | Yes | Yes | No (blocked by builder CLI gap) |
| Compile Go guest functions (TinyGo) | Yes | Yes | Unverified [NEEDS VERIFICATION] |
| Compile Rust guest functions | Yes | Yes | Rust itself has tier-2 `riscv64gc-unknown-linux-gnu`, but Scale's own build tooling blocks this host regardless |
| Execute compiled WASM guest functions (host runtime) | Yes, JIT via wazero wazevo | Yes, JIT via wazero wazevo | Yes, functionally correct, but interpreter-only (no wazevo riscv64 backend), materially slower |

**Functional gap:** the native builder CLI cannot be built or run on a riscv64 host at all (Section 4), which blocks the entire "compile a guest function" workflow on riscv64, not merely a subset of features.

**Performance gap:** for the one code path that does run on riscv64 (WASM execution of already-compiled guest functions via the wazero interpreter), throughput is materially worse than amd64/arm64 hosts because wazero's JIT compiler engine (wazevo) has no riscv64 codegen backend upstream (Linux compiler support is amd64/arm64 only). No quantified benchmark numbers for this gap were found for Scale specifically.

**Security hardening gaps and NaN/floating-point semantics:** No RISC-V-specific correctness, NaN, or floating-point issues were found for Scale, because no riscv64 issue or bug report of any kind exists in the repository's history (Section 11).

## 7. CI/CD Infrastructure

No riscv64 CI exists. All four GitHub Actions workflows were read directly from the repository:

- `lint.yml`: triggers on `pull_request`; jobs `typescript` and `golang`, both `runs-on: ubuntu-latest`.
- `release.yml`: triggers on `release: published` and `workflow_dispatch`; job `npm`, `runs-on: ubuntu-latest`.
- `test.yml`: triggers on `pull_request`; jobs `test` and `integration-test`, both `runs-on: ubuntu-latest`.
- `typescript_compiler.yml`: triggers on `pull_request` (path-filtered); job `interpreter` (`macos-latest`), job `builder` (matrix of `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, `x86_64-apple-darwin`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc` on `ubuntu-20.04`/`macos-latest`/`windows-latest`).

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository (confirmed by full-tree `find`). No self-hosted runner, no QEMU step, and no `linux/riscv64` platform string appears anywhere in CI. No RISE runners are used (RISE has no involvement with this project at all, Section 12).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes (Rust cross-compile target only) | No |
| CI test | Yes | No dedicated arm64 test job | No |
| CI release | Yes | Yes (binary shipped) | No |
| Hardware | GitHub-hosted (`ubuntu-latest`, `ubuntu-20.04`) | Cross-compiled on GitHub-hosted `ubuntu-20.04` (no native arm64 runner, no QEMU test) | N/A |

Source: `.github/workflows/{lint,release,test,typescript_compiler}.yml` at [loopholelabs/scale](https://github.com/loopholelabs/scale/tree/main/.github/workflows).

## 8. Distribution and Release Status

No riscv64 artifact exists on any channel checked:

- **GitHub releases:** v0.4.8 (latest) ships only `Source code (zip)` and `Source code (tar.gz)`. v0.3.19 ships `jsbuilder-{arm,x86_64}-{linux,macos,windows}.gz` plus `jslinksource.wasm` and source archives. No riscv64 filename in any checked release. Source: [loopholelabs/scale releases](https://github.com/loopholelabs/scale/releases).
- **PyPI:** a package literally named `scale` exists on PyPI (pure-Python `py3-none-any` wheel/sdist, versions 1.1.0-1.1.2), but its stated purpose is "Single-Cell ATAC-seq Analysis via Latent feature Extraction," an unrelated bioinformatics project. This is a namespace collision, not loopholelabs/scale's artifact, and is not applicable to this report. Source: [pypi.org/pypi/scale/json](https://pypi.org/pypi/scale/json).
- **RISE wheel mirror:** the GitLab-hosted RISE wheel builder mirror for `scale` 302-redirects straight to the same unrelated PyPI package; no custom RISE build exists. Source: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/scale/`.
- **Ubuntu 26.04 (resolute):** no package named `scale`, `python3-scale`, or `libscale` exists at all (23 unrelated substring matches, e.g. `python3-scalene`, `libswscale-dev`). Source: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Scale&suite=resolute&searchon=names&section=all).

**What a user must do to get a working setup on riscv64 today:** there is none available. Because `loopholelabs/scale` is archived (read-only), a user would need to fork the repository, add a riscv64 build-tag variant of the native builder CLI (Section 4), patch the `quickjs-wasm-sys` `build.rs` platform match statement to support riscv64, build the toolchain locally, and accept that WASM execution runs through wazero's interpreter (no JIT) once the toolchain problem is fixed.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Wazero | Runtime dependency, critical. WASM execution engine (`wazero.Runtime` instantiated in `scale.go`/`module.go`/`template.go`/`tracing.go`) | Builds (pure Go, no cgo) | Interpreter engine runs correctly; JIT/AOT compiler engine ("wazevo") has no riscv64 codegen backend upstream (Linux compiler support is amd64/arm64 only) | Ships as Go module source, no prebuilt binary needed | No dedicated tracking issue found for a riscv64 wazevo backend. This is the single most consequential riscv64 finding for anything built on Scale, functions run correctly but lose JIT performance |
| QuickJS | Build dependency, critical. Vendored C engine used to build the TypeScript-to-WASM compiler toolchain (`quickjs.c`, `quickjs.h`, `qjs.c`, `qjsc.c`) | The QuickJS C source itself has no riscv-specific code and should be portable, but the Rust wrapper crate `quickjs-wasm-sys`'s `build.rs` hard-errors ("Unsupported platform tuple") for any host other than linux/x86_64, macos x86_64/aarch64, windows x86_64/x86 | N/A, blocked at build step | N/A | Primary confirmed build blocker for the whole TypeScript toolchain on riscv64 hosts (Section 4) |
| Rust | Build dependency, critical. Compiles Rust guest functions and the QuickJS-based TypeScript compiler toolchain | Rust upstream has a tier-2 `riscv64gc-unknown-linux-gnu` host target and generally builds | No Scale-specific issue found | Released via rustup | Rust's own riscv64 support is not the blocker, Scale's own `build.rs` platform match statement is (Section 4) |
| Go | Build dependency, critical. Builds the Scale host CLI/tooling; TinyGo (separate toolchain) compiles Go guest functions to WASM | Go itself supports `GOARCH=riscv64` broadly, but `compile/typescript/builder`'s build-tag files have no riscv64 variant, causing `undefined: BuilderExecutable` on `GOOS=linux, GOARCH=riscv64` | N/A, blocked at build step | N/A | TinyGo 0.29.0's own riscv64-as-host build/run status is unverified [NEEDS VERIFICATION] |
| esbuild | Build dependency, optional. Bundler used in `build/typescript.go` for TypeScript Scale functions | Builds (Go source) | No riscv64-specific blocking issue found | Released, `@esbuild/linux-riscv64` is an actively published npm package (~0.27.1 at time of research) | The one dependency in this table with an actual published riscv64 release artifact |
| loopholelabs/wasm-toolkit (indirect) | Build-time WASM introspection tooling (`wasm2wat`/`wat2wasm`) used by Scale's build/extension generators | Pure Go, should build | No riscv64-specific issues found | N/A | Repository archived/unmaintained (archived 2025-09-23), zero open issues, no riscv64 testing of any kind |
| loopholelabs/polyglot (indirect) | Wire-format serialization between host and guest (`module.go`) | Pure Go/TS/Rust, no native/SIMD code found | No riscv64 issues found | Released per-ecosystem | Low risk |
| hashicorp/hcl v2, BurntSushi/toml (indirect) | Parse `scalefile` config | Pure Go, no architecture risk | N/A | N/A | Low risk |
| lazy_static, regex (indirect, Rust guest deps) | Pure-Rust utility crates | Portable to `riscv64gc` target | N/A | N/A | Low risk |
| buffer, fast-sha256, uuid (indirect, TS deps) | Pure JS, no native bindings | N/A | N/A | N/A | Low risk |

**Deep-dive:** the only dependency with a genuine execution-engine (JIT) concern is wazero, whose riscv64 gap is documented in wazero's own architecture support statements rather than any Scale-specific issue. The only dependency that is an outright build blocker on riscv64 is QuickJS's Rust wrapper (`quickjs-wasm-sys`), via its `build.rs` platform match statement (Section 4). All other listed dependencies are pure-language (Go/Rust/TypeScript) code with no native/SIMD/riscv-specific concerns identified.

Note: dependency-level Ubuntu/distro package-graph verification could not be run this session; the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`). Most rows above are Go-module/npm/cargo-ecosystem dependencies rather than Debian-packaged system libraries, so a distro package graph query would likely return empty for most of them regardless, but this should be confirmed once the server is available.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue or PR exists | N/A | N/A | Confirmed via `search_issues`, `search_pull_requests`, `search_commits`, and `search_code` scoped to `repo:loopholelabs/scale` for `riscv`, `riscv64`, and `risc-v`, all returning zero results, and independently via a local clone + repo-wide grep of HEAD `fa61d80bd57bf5fea18921f214cec72d84e0740c` |

No correctness bugs (NaN, floating-point, or otherwise) related to riscv64 were found, because there is no riscv64 activity of any kind in this repository's history to report a bug against.

## 12. Objections and Upstream Blockers

**Stated objections:** none exist; riscv64 has never been discussed in any issue, PR, commit, or Discord-referenced thread found in this research.

**Technical blockers (confirmed):**
1. `compile/typescript/builder`'s Go build-tag files have no riscv64 variant and the catch-all fallback explicitly excludes `linux`, causing a guaranteed compile-time failure on `GOOS=linux, GOARCH=riscv64` (Section 4).
2. `quickjs-wasm-sys/build.rs`'s platform match statement hard-errors on any host tuple other than the five it lists, excluding riscv64 (Section 4).
3. wazero's JIT compiler engine (wazevo) has no riscv64 codegen backend upstream, capping riscv64 WASM execution at interpreter-only performance even if the above two build blockers were fixed (Section 9).

**Organizational blockers:** `loopholelabs/scale` is archived (read-only) as of 2025-10-17; the entire maintainer base is three Loophole Labs employees, and the company shows no public indication of reviving the project. There is no RISE Project involvement, membership, funding, or blog coverage of Scale (confirmed against RISE's full current member list, all 34 RISE blog posts, and the 25-repository `riseproject-dev` GitHub organization).

**Acceptance probability:** effectively zero through the current upstream channel, since the repository cannot accept new PRs while archived. Any riscv64 work would require a fork with no clear path back to upstream.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Justification:** Scale ships no riscv64 upstream CI, no riscv64 release artifact, and no riscv64 distro package (Sections 3, 7, 8). Beyond the absence of support, riscv64 is confirmed broken by direct source inspection: the native builder CLI's Go build-tag files have no riscv64 variant and the fallback file explicitly excludes `linux` (`compile/typescript/builder/builder_other.go`, tag `!darwin && !linux && !windows`), guaranteeing an `undefined: BuilderExecutable` compile failure on `GOOS=linux, GOARCH=riscv64`; independently, the QuickJS Rust wrapper's `build.rs` hard-errors with `"Unsupported platform tuple"` for the same host (`compile/typescript/builder/quickjs-wasm-sys/build.rs`, local clone of [loopholelabs/scale](https://github.com/loopholelabs/scale), HEAD `fa61d80bd57bf5fea18921f214cec72d84e0740c`). This is a confirmed-broken state per the color model's red criterion ("riscv64 support confirmed broken or non-functional"), not merely an untested one.
- **Optimization purpose:** not applicable. Scale is a general-purpose WASM plugin/sandboxing framework, not a project whose core value proposition is architecture-specific performance; the optimization-purpose modifier (Step 2 of the color model) does not apply.
- **Pending work that could change the grade:** none identified. There is no open PR, no RISE involvement, and no active maintainer effort, and the repository is archived (read-only), so no upstream change can occur without a fork. A revival or fork that (a) adds a riscv64 build-tag file with a native or interpreter-based builder path, and (b) patches the `quickjs-wasm-sys` platform match statement, would be the minimum needed to move off red; even then the project would remain capped by wazero's interpreter-only riscv64 execution path (Section 9) absent upstream wazero work.

## 14. Investment Analysis

RISE has done no work on this project and has no relationship with it (Section 12); no prior investment exists to avoid duplicating.

### 14.1 Functional Enablement

Because `loopholelabs/scale` is archived, any functional work requires forking first. Within a fork, the minimum functional fix is: (a) add a `builder_riscv64-linux.go` build-tag file (either a prebuilt `js_builder` binary for riscv64, requiring the upstream Rust `js_builder` project to also target riscv64, or an interpreter-based fallback), and (b) patch `quickjs-wasm-sys/build.rs` to add a riscv64 arm to its platform match statement and confirm a WASI SDK build is actually obtainable for that host. TinyGo's own riscv64-host build/run status needs verification before Go-guest-function compilation on riscv64 can be confirmed as unblocked. [NEEDS VERIFICATION]

### 14.2 Performance Optimization

Not applicable in the optimization-purpose sense (Section 13). The one relevant performance gap is inherited from the wazero dependency: riscv64 hosts run WASM execution through wazero's interpreter rather than its JIT engine (wazevo), which has no riscv64 codegen backend upstream. Closing this gap is upstream wazero work, not Scale-specific work, and no dedicated wazero tracking issue for it was found.

### 14.3 CI/CD Infrastructure

Would require forking the archived repository, adding a riscv64 target to the `typescript_compiler.yml` builder matrix, and adding a riscv64 job to `test.yml`. No RISE runner relationship exists to leverage today (Section 12).

### 14.4 Ecosystem Enablement

Not applicable; Scale has no dependent package ecosystem of the kind Section 10 addresses (Section 10 omitted per report rules).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fork the archived repository (prerequisite for any further work) | 1 | Unassigned | Low |
| Functional | Add riscv64 build-tag file and resolve native builder binary availability for riscv64 | 2-4 | Unassigned | Low |
| Functional | Patch `quickjs-wasm-sys/build.rs` platform match statement for riscv64 and verify WASI SDK build | 1-2 | Unassigned | Low |
| Functional | Verify TinyGo riscv64-host build/run status [NEEDS VERIFICATION] | 0.5 | Unassigned | Low |
| CI/CD | Add riscv64 job to a forked repository's CI workflows | 1 | Unassigned | Low |
| Performance | Track/contribute to upstream wazero riscv64 wazevo JIT backend (not Scale-specific) | Not sized here, upstream wazero scope | Unassigned | Low |

Given the repository's archived status, single-vendor governance with no indication of revival, zero RISE involvement, and zero evidence of user demand for riscv64 support (no issue, PR, or discussion ever raised it), this project is not recommended for investment at this time.

## 15. Updates

(No updates yet, initial report dated 2026-06-17.)

## 16. References

- [loopholelabs/scale repository](https://github.com/loopholelabs/scale)
- [loopholelabs/scale releases](https://github.com/loopholelabs/scale/releases)
- [loopholelabs/scale-benchmarks repository](https://github.com/loopholelabs/scale-benchmarks)
- [scale.sh homepage (returns 404)](https://scale.sh/)
- [loopholelabs/scale .github/workflows/lint.yml](https://github.com/loopholelabs/scale/blob/main/.github/workflows/lint.yml)
- [loopholelabs/scale .github/workflows/release.yml](https://github.com/loopholelabs/scale/blob/main/.github/workflows/release.yml)
- [loopholelabs/scale .github/workflows/test.yml](https://github.com/loopholelabs/scale/blob/main/.github/workflows/test.yml)
- [loopholelabs/scale .github/workflows/typescript_compiler.yml](https://github.com/loopholelabs/scale/blob/main/.github/workflows/typescript_compiler.yml)
- [PyPI scale package JSON API (unrelated bioinformatics project, namespace collision)](https://pypi.org/pypi/scale/json)
- [PyPI scale simple index](https://pypi.org/simple/scale/)
- [RISE GitLab wheel mirror for scale (redirects to PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/scale/)
- [Ubuntu 26.04 resolute package search for Scale](https://packages.ubuntu.com/search?keywords=Scale&suite=resolute&searchon=names&section=all)
- [tetratelabs/wazero repository](https://github.com/tetratelabs/wazero)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE Project wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)