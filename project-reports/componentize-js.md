---
title: componentize-js
parent: Project Reports
color: red
---

{% include dependency-graph.html slug="dependencies" subset="componentize-js" %}

# componentize-js

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for componentize-js<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ComponentizeJS ([bytecodealliance/ComponentizeJS](https://github.com/bytecodealliance/ComponentizeJS)) compiles ECMAScript modules into WebAssembly Components via a StarlingMonkey (SpiderMonkey) embedding that is itself compiled to the `wasm32-wasip1` target. It is distributed as the npm package `@bytecodealliance/componentize-js`.

**Governance and license.** The project is maintained by the Bytecode Alliance, an independent nonprofit (not a Linux Foundation project), governed by an elected Board of Directors plus a Technical Steering Committee; individual projects are run by their own committer groups. `CODEOWNERS` for this repo lists `@tschneidereit`, `@vados-cosmonic`, and `@andreiltd`. License is Apache 2.0 with LLVM Exception. No `MAINTAINERS`, `GOVERNANCE.md`, `PLATFORMS.md`, or `docs/platforms/` files exist in the repository.

**Corporate contributors** (by commit count, full history of 258 commits since 2023-01-20, affiliation from commit email domains):

| Contributor | Commits | Company |
|---|---|---|
| Guy Bedford | 123 | Fastly |
| Victor Adossi (vados-cosmonic) | 56 | Cosmonic |
| jco-release-bot | 23 | Cosmonic (automated) |
| Till Schneidereit | 16 | Fermyon (publicly known; StarlingMonkey lead) [NEEDS VERIFICATION - affiliation inferred from public reputation, not commit email domain] |
| Karthik Ganeshram | 13 | Fermyon |
| Tomasz Andrzejak (andreiltd) | 3 | not discoverable from public commit data |
| Joel Dice | 3 | Fermyon |
| Saul Cabrera | 2 | independent/unclear |

**Community culture on new ports.** Zero issues, pull requests, or commits in this repository mention RISC-V in any form, confirmed via GitHub search API, GitHub's live web search UI, a full repository clone-and-grep, and general web search. There has been no request, discussion, rejection, or roadmap item regarding a RISC-V port - this is silence, not resistance.

## 2. Port History and Upstreaming Timeline

No riscv64 port has ever been proposed, discussed, or merged for this repository.

| Date | Event | Source |
|---|---|---|
| 2024-09-24 | Commit `274d41f` ("deps: toolchain upgrade (#140)", Guy Bedford, Fastly) incidentally adds `@napi-rs/lzma-linux-riscv64-gnu` into `package-lock.json` as a routine npm build-tooling dependency bump. Not a RISC-V port of ComponentizeJS itself. | [ComponentizeJS repository](https://github.com/bytecodealliance/ComponentizeJS) (local clone, `package-lock.json` history) |

No other riscv64-related event exists in the project's history. There is no upstreaming status to report because there is nothing in flight.

## 3. Upstream Support Tier

No formal architecture support tier policy exists for this project - there is no OS/architecture build matrix at all. CI runs only on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub-hosted runners, all producing a single, architecture-independent build target (`wasm32-wasip1`). The release workflow ([release.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/release.yml)) publishes exactly one asset per release, `bytecodealliance-componentize-js-<version>.tgz` (a plain `npm pack` tarball), with no per-architecture naming. This was directly confirmed by downloading the live `0.22.0` asset (HTTP 200, `Content-Disposition: filename=bytecodealliance-componentize-js-0.22.0.tgz`) and probing hypothetical riscv64-tagged asset names, both of which returned HTTP 404.

However, the package's own architecture neutrality does not translate into functional riscv64 support, because its mandatory runtime dependency `wizer` is host-architecture-specific and has no riscv64 build (see Section 9).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| componentize-js CI build | yes (`ubuntu-latest`) | yes (`macos-latest`, Apple Silicon) | not run - no such job exists |
| componentize-js release artifact | single universal `.tgz`, arch-independent | same | same, but installs a non-functional default code path (see below) |
| `wizer` native binary published | yes (linux-x64) | yes (linux-aarch64, darwin-arm64) | no - explicit `"Unsupported platform"` throw |
| `weval` native binary published | yes (linux-x64) | yes (linux-aarch64) | no - explicit `"Unsupported platform"` throw |
| Default `componentize()` call | works | works | fails at runtime |

## 4. Technical Architecture and RISC-V-Specific Subsystems

ComponentizeJS's own source (Rust splicer crates plus a C++ embedding layer) contains **no architecture-conditional code for any ISA**, confirmed by a repository-wide search for `target_arch`, `__riscv`, `__x86_64__`, `__aarch64__`, and `cfg(target_arch...)` - zero matches across the entire tracked tree. This is expected: the project's compiled output is always `wasm32-wasip1` bytecode, never a native binary, so there is no JIT, SIMD, crypto, or GC-barrier code specific to the *host* CPU in this repository. The relevant architecture-specific work (JIT codegen) lives entirely in the `wizer`/`weval` dependency chain, which wraps Wasmtime's Cranelift backend.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Rust splicer / embedding-splicer crates | arch-neutral | arch-neutral | arch-neutral |
| C++ embedding layer (StarlingMonkey) | arch-neutral | arch-neutral | arch-neutral |
| `wizer`/`weval` JIT backend (via Wasmtime/Cranelift) | Tier 1, native binary shipped | Tier 1, native binary shipped (linux-aarch64, darwin-arm64) | Cranelift Tier 3 backend exists but no binary is shipped; open correctness bug [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) |

No amd64/arm64/riscv64 disparity exists inside ComponentizeJS itself - all three are equally "not applicable" at that layer. The disparity is entirely downstream, in `wizer`/`weval`.

## 5. Build System, Cross-Compilation, and Toolchain

Per the [repository README](https://github.com/bytecodealliance/ComponentizeJS) (build section, lines 330-362) and `CMakeLists.txt`, the build requires: stable Rust with the `wasm32-wasip1`/`wasm32-unknown-unknown` targets, `wasi-sdk-20.0` at `/opt/wasi-sdk/`, CMake >= 3.27, Node.js (CI pins 24.10.0), and `git submodule update --init --recursive` for the StarlingMonkey submodule. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist. No `cmake/riscv64.cmake` or any toolchain files exist - there is no `cmake/` directory containing arch-specific `.cmake` files at all. No Dockerfiles exist anywhere in the repository. No QEMU usage exists in any workflow.

Because the build target is the fixed triple `wasm32-wasip1`, there is no per-host-CPU cross-compilation step for riscv64 (or any other architecture) in ComponentizeJS's own build - hence no arch flags in `CMakeLists.txt` and no documented build failures for any architecture.

**To obtain a functioning riscv64 host setup today**, a user would need to: build `wizer` from source against Cranelift's Tier 3 riscv64 backend and pass it via the `--wizer-bin` CLI override (no npm prebuild exists to install); optionally do the same for `weval` via `--weval-bin`; and either build Binaryen from source or set `USE_WASM_OPT=OFF` in the StarlingMonkey CMake configuration, since no riscv64 Linux Binaryen release exists upstream for the default `wasm-opt` post-processing step (`USE_WASM_OPT=ON` by default).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gap (critical).** The default, non-AOT `componentize()` call mandatorily invokes `@bytecodealliance/wizer` to pre-initialize/snapshot the compiled wasm module. Wizer's `package-helpers.js` `pkgForCurrentPlatform()` function explicitly throws `"Unsupported platform"` for riscv64 - this is not a missing optimization, it is a complete functional failure of the tool's primary code path on a riscv64 host.

**Optional-path gap.** The AOT path (`opts.enableAot`, via `@bytecodealliance/weval`) fails identically, for the same reason.

**Build-time gap.** The default StarlingMonkey C++ build unconditionally downloads Binaryen's `wasm-opt` (`USE_WASM_OPT=ON`); no riscv64 Linux Binaryen release exists upstream, so the default build path also fails unless overridden.

**Performance gap.** Not measurable - no benchmark data exists (see Section 8/12 research), and the default code path does not run at all on riscv64, so there is nothing to benchmark.

**Security hardening / NaN-floating-point issues.** No riscv64-specific security or floating-point issue exists anywhere in this repository's issue tracker - the issue count for RISC-V topics in this repo is zero.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Confirmed by direct reading of all four workflow files at HEAD `73b33e7`: [main.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/main.yml), [release.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/release.yml), [create-release-pr.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/create-release-pr.yml), and [tag-release.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/tag-release.yml). Every `runs-on` value is `ubuntu-latest`, `windows-latest`, `macos-latest`, or `ubuntu-24.04`. No `riscv` string appears in any workflow file. No QEMU setup step exists anywhere. No self-hosted or RISE runner labels appear anywhere. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| CI release | yes (universal artifact) | yes (same artifact) | no |
| RISE runner usage | no | no | no |

## 8. Distribution and Release Status

- **npm** (primary channel): `@bytecodealliance/componentize-js` latest is `0.22.0`. `package.json` has no `optionalDependencies` and no `os`/`cpu` fields - the package itself installs on any Node.js host, including riscv64.
- **PyPI**: no package exists (`https://pypi.org/pypi/componentize-js/json` and [`https://pypi.org/simple/componentize-js/`](https://pypi.org/simple/componentize-js/) both return HTTP 404). Not applicable - this is an npm-only tool.
- **RISE GitLab wheel builder**: [`gitlab.com/.../packages/pypi/simple/componentize-js/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/componentize-js/) redirects to the PyPI 404. Not applicable.
- **Ubuntu 26.04 (resolute)**: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=componentize-js&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" across all architectures, explicitly including riscv64 as a selectable option in the search form.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/)): no mention of componentize-js.
- **GitHub releases**: single universal `.tgz` per release, confirmed live (see Section 3); no riscv64-tagged variant exists.

**What a user must do today:** `npm install @bytecodealliance/componentize-js` succeeds on a riscv64 host (the package itself has no platform restriction), but the default `componentize()` call throws immediately due to the `wizer` dependency's explicit `"Unsupported platform"` error. A working setup requires building `wizer` (and optionally `weval`) from source against Wasmtime's Tier 3 riscv64 Cranelift backend and invoking `componentize()` with `--wizer-bin`/`--weval-bin` CLI overrides, plus either building Binaryen from source or disabling `USE_WASM_OPT`.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| wizer | runtime-dependency, critical - mandatory in the default (non-AOT) `componentize()` call | buildable from source (Cranelift has a native riscv64 backend) | not exercised in wizer's own CI | not released - no CI job, no npm binary; `pkgForCurrentPlatform()` explicitly throws `"Unsupported platform"` for riscv64 | no riscv64 issues found in [bytecodealliance/wizer](https://github.com/bytecodealliance/wizer) |
| weval | runtime-dependency, optional - used only when `enableAot` is requested | buildable from source | not exercised in weval's own CI | not released - same `"Unsupported platform"` throw pattern | no riscv64 issues found in [bytecodealliance/weval](https://github.com/bytecodealliance/weval) |
| Wasmtime | build-dependency, critical - vendored inside wizer and weval as the Cranelift JIT/AOT backend; also downloaded directly by StarlingMonkey's CMake build (pinned v42.0.1) for build-time testing | yes - Cranelift has a native riscv64 backend, part of Wasmtime's own CI | covered in Wasmtime's CI, but classified Tier 3 ("best-effort, no full-time maintainer") per its own `stability-tiers.md` | yes - Wasmtime publishes official `riscv64gc-linux` release tarballs | open bug [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) "Cranelift: run and compile commands on riscv64 backend fail"; several related bugs already closed, indicating an actively-fixed but still-maturing backend |
| Binaryen | build-dependency, critical - `wasm-opt`, downloaded by default (`USE_WASM_OPT=ON`) in StarlingMonkey's `CMakeLists.txt` | buildable from source (portable C++/CMake) but not exercised by upstream CI | not in CI matrix | not released for Linux riscv64 - release workflow builds only macOS x64/arm64, Windows x64/arm64, and Linux x64/arm64 | no riscv64-specific issue found; the separate npm `binaryen` package (used by `jco`, not the CMake build) is arch-neutral wasm and unaffected |
| StarlingMonkey | build-dependency, critical - the C++/SpiderMonkey embedding compiled to `wasm32-wasip1` that componentize-js splices into components | build toolchain (wasi-sdk + Rust) has riscv64 host support in principle; not independently verified end-to-end on riscv64 for this project | not verified | prebuilt SpiderMonkey tarball is `wasm32`-targeted and architecture-independent - not itself a riscv64 blocker | referenced status report at `project-reports/spidermonkey.md` was not read in this session [NEEDS VERIFICATION] |
| wasi-sdk | build-dependency, critical - LLVM/clang cross-compilation toolchain used to compile the C/C++/Rust embedding to `wasm32-wasi` | yes - includes a `riscv64-linux` cross-compile job (via `riscv64-linux-gnu-gcc`/`g++` on `ubuntu-24.04`) | build-tested via cross-compilation only, not on native riscv64 hardware | publishes a `riscv64-linux` release asset per its CI job naming | none found |
| wasm-tools | build-dependency, critical - WASM binary/text manipulation and WIT/Component-Model CLI, plus vendored Rust crates (`wasm-encoder`, `wasmparser`, `wit-component`, `wit-parser`, `wit-bindgen`) compiled directly into componentize-js's own splicer crates | yes - pure Rust, builds cleanly from source on riscv64 | covered by wasm-tools' own release CI (`riscv64-linux` job, `CARGO_BUILD_TARGET: riscv64gc-unknown-linux-gnu`) | publishes `wasm-tools-<ver>-riscv64-linux.tar.gz` | none found |

**Additional indirect dependencies identified during research:**

| Dependency | Role | riscv64 status |
|---|---|---|
| oxc-parser | npm runtime dependency (Rust NAPI addon) - JS/TS parsing front-end | full coverage: `@oxc-parser/binding-linux-riscv64-gnu` and `-musl` prebuilt binaries published |
| SpiderMonkey | Mozilla JS engine embedded via StarlingMonkey, compiled to a `wasm32-wasi` static library | architecture-independent output; host-toolchain-dependent only |
| es-module-lexer, @bytecodealliance/jco | npm dependencies - ESM parsing and JS component transpilation tooling | architecture-neutral (no native platform binaries) |

**Outstanding data gap:** the `project-graph` MCP server was unreachable for the entire research session (`CONNECTION_CLOSED`), so authoritative Ubuntu 26.04 (resolute) package-graph cross-checks for `wasi-sdk`, `binaryen`, and `wasmtime` could not be run via that tool. The direct `packages.ubuntu.com` queries reported in Section 8 independently return a clean, explicit result for componentize-js itself, but this gap should be closed by re-running the graph query when the server is reachable.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue or PR exists in `bytecodealliance/ComponentizeJS` | N/A | N/A | Confirmed via GitHub search API, GitHub web UI search, full-repo clone-and-grep, and web search - zero matches across all methods |
| [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) | "Cranelift: run and compile commands on riscv64 backend fail" | open | high (blocks riscv64 JIT execution correctness in the dependency chain wizer/weval rely on) | Root cause underlying wizer/weval's riscv64 immaturity even if a from-source build were attempted |

No correctness bugs exist for componentize-js itself on riscv64 - there is nothing to run yet, since the default code path fails before executing any user code.

## 12. Objections and Upstream Blockers

**Stated objections:** none. Zero issues or pull requests in this repository ever mention RISC-V - this is documented silence, not documented resistance.

**Technical blockers:** the mandatory `wizer` runtime dependency (and optional `weval`) have zero riscv64 release coverage, rooted in Wasmtime/Cranelift's riscv64 backend being officially Tier 3 (best-effort, no full-time maintainer) with an open correctness bug ([wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050)). The default StarlingMonkey build additionally requires a from-source Binaryen build or a config override, since no riscv64 Binaryen Linux release exists upstream.

**Organizational blockers:** no RISE Project involvement was found anywhere - no blog posts, no `riseproject-dev` org repositories, no entry in the RISE Python wheel builder, and no funded-work listing referencing componentize-js. Two leads surfaced but could not be confirmed and are flagged [NEEDS VERIFICATION]: the RISE Project's ["RISC-V Optimization Guide"](https://gitlab.com/riseproject/riscv-optimization-guide) GitLab repository, and the [riseproject.dev blog index](https://riseproject.dev/blog/), whose content renders client-side and was not fully retrievable via automated fetch.

**Acceptance probability:** likely high if a PR were filed. Two of the three build-dependencies (`wasi-sdk`, `wasm-tools`) already have working riscv64 CI and release coverage, and there is no recorded upstream resistance to a port - only silence. The remaining, concentrated work is in `wizer`/`weval`'s release matrices, contingent on Wasmtime's Cranelift riscv64 backend maturing past Tier 3.

## 13. Readiness Assessment

- **Color:** red (from `/project-color-coding` skill output)
- **Release provider:** none
- ComponentizeJS's own code and release artifacts are architecture-independent (single universal npm tarball, `wasm32-wasip1` output, zero arch-conditional source anywhere in the repository), which would ordinarily qualify it for the green architecture-independence shortcut. However, the default (non-AOT) `componentize()` call has a mandatory dependency, `wizer`, whose `pkgForCurrentPlatform()` function explicitly throws `"Unsupported platform"` for riscv64, with no CI job and no published binary in its own release matrix. This is a documented, explicit runtime failure on riscv64 today, not merely untested territory - it meets the red criterion of "confirmed broken or non-functional," overriding the architecture-independence shortcut. See the [wizer repository](https://github.com/bytecodealliance/wizer) and the [ComponentizeJS release workflow](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/release.yml).
- ComponentizeJS is not an optimization-purpose project (it is a compiler/toolchain, not a library whose value proposition is beating a reference implementation on speed), so the Step 2 optimization modifier and Optimization level header field do not apply.
- **Pending work that could change the grade:** none identified upstream. Zero RISC-V issues or PRs exist in ComponentizeJS, wizer, or weval, and no RISE Project involvement was found. The grade would improve if (a) Wasmtime's Cranelift riscv64 backend matured past Tier 3 (tracked at [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050)) and (b) wizer/weval maintainers subsequently added riscv64 to their CI and release matrices - no such effort is currently visible upstream.

## 14. Investment Analysis

RISE has funded no work specific to componentize-js, wizer, or weval (see Section 12) - all sizing below is net-new.

### 14.1 Functional Enablement

Add riscv64 to `wizer`'s release CI matrix (build and publish a `riscv64-linux` npm-optional-dependency binary, following the existing pattern for `aarch64-unknown-linux-gnu` and `s390x-unknown-linux-gnu`) and update `pkgForCurrentPlatform()` to accept riscv64 instead of throwing. Repeat for `weval` if the AOT path is a priority. This work is gated on Wasmtime/Cranelift's riscv64 backend being correctness-sufficient for wizer/weval's own test suites - currently uncertain given the open bug [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050).

### 14.2 Performance Optimization

Not applicable as a near-term item - functional enablement is the blocking prerequisite. ComponentizeJS itself has zero architecture-specific code (Section 4), so once the default path runs, its performance characteristics on riscv64 flow entirely from Wasmtime/Cranelift's riscv64 codegen quality, not from any componentize-js-specific work.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to wizer's and weval's GitHub Actions release matrices. Add a riscv64 Linux Binaryen release job to StarlingMonkey's release workflow, or change the `USE_WASM_OPT` default handling to fall back gracefully to a from-source build on unsupported hosts. ComponentizeJS's own CI needs no riscv64 job of its own, since its output is architecture-independent `wasm32-wasip1`.

### 14.4 Ecosystem Enablement

Not applicable - componentize-js has no significant dependent package ecosystem (Section 10 omitted per report scope rules).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 build/CI/release to `wizer`; fix `pkgForCurrentPlatform()` platform check | 2-4 (estimate; contingent on Cranelift riscv64 correctness) | wizer maintainers (Fastly/Cosmonic-affiliated committers) | Critical |
| Functional | Same, optional AOT path, for `weval` | 2-3 (estimate) | weval maintainers | Medium |
| CI/CD | Add riscv64 Linux Binaryen release asset, or make StarlingMonkey's `USE_WASM_OPT` degrade gracefully without one | 1-2 (estimate) | StarlingMonkey/Binaryen maintainers | High |
| Dependency (upstream) | Resolve open Cranelift riscv64 correctness bug [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) | sized separately - see `project-reports/wasmtime.md` | Wasmtime maintainers | Critical (blocks all of the above) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [bytecodealliance/ComponentizeJS repository](https://github.com/bytecodealliance/ComponentizeJS)
- [ComponentizeJS CI workflow - main.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/main.yml)
- [ComponentizeJS release workflow - release.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/release.yml)
- [ComponentizeJS - create-release-pr.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/create-release-pr.yml)
- [ComponentizeJS - tag-release.yml](https://github.com/bytecodealliance/ComponentizeJS/blob/main/.github/workflows/tag-release.yml)
- [bytecodealliance/wizer repository](https://github.com/bytecodealliance/wizer)
- [bytecodealliance/weval repository](https://github.com/bytecodealliance/weval)
- [bytecodealliance/wasmtime repository](https://github.com/bytecodealliance/wasmtime)
- [wasmtime#11050 - Cranelift: run and compile commands on riscv64 backend fail](https://github.com/bytecodealliance/wasmtime/issues/11050)
- [bytecodealliance/wasm-tools repository](https://github.com/bytecodealliance/wasm-tools)
- [WebAssembly/binaryen repository](https://github.com/WebAssembly/binaryen)
- [bytecodealliance/StarlingMonkey repository](https://github.com/bytecodealliance/StarlingMonkey)
- [WebAssembly/wasi-sdk repository](https://github.com/WebAssembly/wasi-sdk)
- [PyPI JSON API - componentize-js (404, confirms no package)](https://pypi.org/pypi/componentize-js/json)
- [PyPI simple index - componentize-js (404)](https://pypi.org/simple/componentize-js/)
- [Ubuntu packages.ubuntu.com search - componentize-js, suite resolute](https://packages.ubuntu.com/search?keywords=componentize-js&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
- [RISE GitLab PyPI wheel builder - componentize-js](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/componentize-js/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [RISE RISC-V Optimization Guide (unconfirmed relevance)](https://gitlab.com/riseproject/riscv-optimization-guide)
