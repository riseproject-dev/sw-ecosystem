---
title: Grain
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="grain" %}

# Grain

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Grain<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Grain](https://github.com/grain-lang/grain) ([grain-lang.org](https://grain-lang.org/)) is a strongly-typed functional programming language whose compiler emits [WebAssembly](https://webassembly.org/) exclusively, using [Binaryen](https://github.com/WebAssembly/binaryen) as its code-generation and optimization backend. The compiler itself (`grainc`, `graindoc`, `grainformat`, `grainlsp`) is implemented in OCaml/Reason and built with `dune` and `esy`; the surrounding CLI, stdlib, and tooling are orchestrated as an npm workspace monorepo. Grain has no native-CPU codegen path of any kind (no x86, arm64, or riscv64 backend) - its only "target architecture" is the WebAssembly virtual ISA.

Copyright is held by "Philip Blair, Oscar Spencer, & contributors" (2017-2025). No foundation, charter, or steering committee was found; governance appears founder-led/informal. No corporate maintainer affiliation or named company sponsor was identified in the README, site, or docs. The project is licensed [LGPL v3](https://github.com/grain-lang/grain). A Code of Conduct and Contributing Guide exist, but there is no formal platform-tier or architecture-support policy document (`PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` all 404).

Grain does not appear in the [RISE](https://riseproject.dev/) member roster (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) - see [riseproject.dev/members](https://riseproject.dev/members/) (fetched live). No stance on RISC-V ports, favorable or unfavorable, was found in issues, discussions, or documentation, because none have ever been raised: no RISC-V-related issue, PR, or commit exists in the project's history.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| - | No RISC-V port has ever been proposed, opened, or merged | [grain-lang/grain issue search](https://github.com/grain-lang/grain/issues) and [PR search](https://github.com/grain-lang/grain/pulls), all "riscv"/"riscv64"/"risc-v" queries return 0 results |

No key contributors exist for a RISC-V port because no such effort has been started. The project is not "partially upstream" or "fully upstream" with respect to RISC-V - there is nothing to upstream. A repo-wide case-insensitive grep for "riscv" across the full cloned tree at HEAD `d6ab36811236010bccb203cda4d93c9903ccb192` returned zero matches, confirmed independently in two separate verification passes.

## 3. Upstream Support Tier

No formal tier policy exists for any architecture in Grain (no `PLATFORMS.md`/`SUPPORT.md`). In practice, tiering is defined implicitly by the CI matrix and release-asset list.

| Architecture | CI builds | CI tests | Release binary published | Docker image |
|---|---|---|---|---|
| amd64 (Linux/macOS/Windows x64) | yes | yes | yes (`grain-linux-x64`, `grain-mac-x64`, `grain-win-x64.exe`) | yes (`linux/amd64`) |
| arm64 | no native CI job; Docker cross-build only | no | no native arm64 CLI binary found in release assets | yes (`linux/arm64`, built on real AWS Graviton EC2, not QEMU) |
| riscv64 | no | no | no | no |

Source: all 10 GitHub Actions workflow files in [`.github/workflows/`](https://github.com/grain-lang/grain/tree/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows) were read in full (`ci.yml`, `build.yml`, `build-native.yml`, `build-js.yml`, `dependencies.yml`, `docker-publish.yml`, `generate-docs.yml`, `release.yml`, `test-pkg.yml`, `upload-binaries.yml`); release assets confirmed via the [releases page](https://github.com/grain-lang/grain/releases) asset listing for `grain-v0.7.2`, `preview`, `stdlib-v0.7.2`, `compiler-v0.7.2`, `cli-v0.7.2`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Grain has no architecture-specific subsystems of its own (no JIT, no hand-written SIMD, no crypto primitives, no GC-barrier assembly). This was independently verified by:

- A full-tree search for any file or directory named `riscv`, `arm64`, `aarch64`, `amd64`, `x86_64`, or `x86-64` (case-insensitive): zero hits.
- A recursive grep for `__riscv`, `__aarch64__`, `__x86_64__`, `__amd64__`, or `cfg(target_arch)`-style guards across `.c/.h/.rs/.re/.rei/.ml/.js/.ts`: zero matches. `search_code` for `"__riscv repo:grain-lang/grain"` independently confirmed `total_count: 0`.
- A file-type survey of the repository: source is `.gr` (Grain), `.re`/`.rei` (Reason/OCaml), `.snapshot` (test fixtures), and `.wat`/`.wasm` (2 files each). There are no `.c`, `.s`, `.S`, or `.asm` files anywhere.
- The one codegen directory (`compiler/src/codegen/`) - `compcore.re` (3,571 lines) and `emitmod.re` (129 lines) are the largest files, and both, along with `comp_wasm_prim.re`, `comp_utils.re`, and `compmod.re`, call directly into the `binaryen` OCaml bindings. `compiler/grainc/dune`, `compiler/graindoc/dune`, and `compiler/grainformat/dune` all link the `binaryen` library, confirming Binaryen is the sole and only code-generation backend, targeting `.wasm`/`.wat` uniformly for every host.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native codegen backend | none (Wasm only) | none (Wasm only) | none (Wasm only, N/A by design) |
| SIMD/vector code | none | none | none |
| Crypto primitives | none | none | none |
| GC barriers / runtime assembly | none | none | none |

Because Grain's compiler output (WebAssembly bytecode plus a Wasm runtime, e.g. Wasmtime/Wasmer/V8-in-Node) is architecture-independent by construction, "riscv64 support" for Grain reduces to two separate questions that are outside Grain's own source tree: (1) does the OCaml/Reason compiler binary itself build and run correctly on a riscv64 host, and (2) does the downstream Wasm runtime executing Grain's compiled output support riscv64. Neither is addressed by anything in Grain's own codebase - there is no per-architecture code path to grade as full/partial/minimal/missing, because there is exactly one code path (Wasm) for every host.

## 5. Build System, Cross-Compilation, and Toolchain

Grain is not a CMake project - no `CMakeLists.txt` exists anywhere in the repository. The build stack is:

- **Compiler** (`compiler/`): OCaml/Reason, built with `dune` (`compiler/dune-project`) and `esy` (`compiler/esy.json`, `compiler/esy.lock`), pinning `ocaml` `5.2.0`.
- **Monorepo orchestration**: npm workspaces (`cli`, `stdlib`, `compiler`) declared in the root `package.json`, requiring Node.js `>=22.13`.
- **Documentation**: [`grain-lang.org/docs/getting_grain#Building-Grain-from-Source`](https://grain-lang.org/docs/getting_grain) is the only build guidance; there is no in-repo `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md`.

No riscv64 toolchain file, `cmake/riscv64.cmake`-equivalent, `-DUSE_X=OFF`-style flag, QEMU usage, or minimum-GCC/Clang-version requirement for riscv64 exists anywhere in the project - confirmed by a full-tree grep returning zero matches for "riscv" in any case variant.

Two Dockerfiles exist (`Dockerfile`, `Dockerfile-slim`), both building via `node:22` + `esy` + `npm run compiler build`, with an in-line comment noting `esy` has no `linux/arm64` binaries (worked around manually) - no riscv64 handling is present. `docker-publish.yml` is the only place in the repo where a target architecture list appears at all: `platforms: linux/amd64,linux/arm64`, with `linux/arm64` built on a genuine AWS EC2 Graviton (arm64) instance as a Buildx remote node - no `docker/setup-qemu-action` step (QEMU) is referenced anywhere in the repository.

**Known build failures on riscv64:** none documented, because no one has attempted the build and reported an outcome (positive or negative) in the issue tracker.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CLI binary (`grain`, `grainc`, `graindoc`, `grainformat`, `grainlsp`) built and released | yes | no (only Docker image, no native release asset found) | no |
| Native CI test execution | yes | no | no |
| Compiled `.wasm` output correctness | yes (V8/Node on x64) | yes (V8/Node on arm64, implied by Docker/arm64 support) | untested - depends on host Node/V8 build, see Section 9 |

There is no functional gap in the sense of "Grain cannot do X on riscv64 that it can do on amd64" at the language-feature level, because Grain's own compiler produces architecture-independent Wasm regardless of host. The gap is entirely in **toolchain availability**: no CI validates that the Grain compiler itself builds and runs correctly on a riscv64 host, and no release binary exists for one. No SIMD-related performance gap applies (Grain has no SIMD code of its own). No riscv64-specific NaN/floating-point semantics issue was found for Grain itself; the OCaml jump-table miscompile ([ocaml/ocaml#14799](https://github.com/ocaml/ocaml/issues/14799), open 2026-05-08, closed/fixed 2026-05-15) is a dependency-level correctness risk, not a Grain-authored bug - see Section 9.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** All 10 workflow files were read in full; ground-truth grep confirms zero "riscv" occurrences in `.github/workflows/` or anywhere else in the repo (verified twice, independently, against a fresh clone at HEAD `d6ab36811236010bccb203cda4d93c9903ccb192`).

| File | Trigger | Runner(s) | riscv64 present |
|---|---|---|---|
| [`ci.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/ci.yml) | push (main), pull_request, merge_group | `ubuntu-latest, macos-latest, windows-latest` | no |
| [`build.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/build.yml) | workflow_call | inherits `os` input (same 3) | no |
| [`build-native.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/build-native.yml) | workflow_dispatch + workflow_call | `os` restricted to same 3 | no |
| [`build-js.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/build-js.yml) | workflow_call | same 3 | no |
| [`dependencies.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/dependencies.yml) | workflow_call | same 3 | no |
| [`docker-publish.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/docker-publish.yml) | push (main), workflow_dispatch | `ubuntu-latest` + AWS EC2 arm64 (Buildx remote node) | no - `platforms: linux/amd64,linux/arm64` only, no QEMU |
| [`generate-docs.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/generate-docs.yml) | workflow_call | `ubuntu-latest` | no |
| [`release.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/release.yml) | push (main) | `ubuntu-latest` | no |
| [`test-pkg.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/test-pkg.yml) | workflow_call | same 3 | no |
| [`upload-binaries.yml`](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/upload-binaries.yml) | workflow_call | `ubuntu-latest` | no - uploads exactly `grain-linux-x64`, `grain-mac-x64`, `grain-win-x64.exe` |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. No RISE runner reference (`riseproject-dev`, RISE runner labels) was found anywhere in the CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | Docker only | no |
| CI tests | yes | no | no |
| CI is release-blocking | yes (ci.yml gates main) | n/a | n/a |
| Hardware | GitHub-hosted x64 | real AWS Graviton EC2 (Docker leg only) | none |

## 8. Distribution and Release Status

No riscv64 binary or release artifact exists for Grain through any channel checked:

- **GitHub Releases** ([grain-lang/grain/releases](https://github.com/grain-lang/grain/releases)): the 5 most recent releases (`preview`, `stdlib-v0.7.2`, `grain-v0.7.2`, `compiler-v0.7.2`, `cli-v0.7.2`) publish only `grain-linux-x64`, `grain-mac-x64`, `grain-win-x64.exe`, and `.zip`/`.tar.gz` source archives. No riscv64-named asset in any release. Note: direct API confirmation (`mcp__github__list_releases`) was blocked in this research session because `grain-lang/grain` was not in the session's allowed-repository scope; this data was obtained by scraping the GitHub release-page asset-expansion HTML, which is reliable for filenames but less authoritative than a direct API call - flagged per rule 4 as [NEEDS VERIFICATION] against a structured API response.
- **Docker** (`docker-publish.yml`): `linux/amd64,linux/arm64` only, no `linux/riscv64` platform tag.
- **Ubuntu 26.04 ("resolute")**: [packages.ubuntu.com search for "Grain"](https://packages.ubuntu.com/search?keywords=Grain&suite=resolute&searchon=names&section=all) shows no package named `grain`, `python3-grain`, or `libgrain` on any architecture at all - not just riscv64. The only riscv64 hit under the search term "Grain" is an unrelated package, `librust-av1-grain-dev` (a Rust AV1 film-grain helper crate, not the Grain language).
- **Arch Linux RISC-V port**: [archriscv.felixc.at](https://archriscv.felixc.at/?q=grain) lists no `grain` package at all.
- **PyPI `grain`**: this is a distinct, unrelated project (Google's data-loading library) confirmed via [pypi.org/pypi/grain/json](https://pypi.org/pypi/grain/json) - 400+ wheels checked across versions 0.1.0-0.2.18, platforms limited to `manylinux2014_x86_64`, `manylinux2014_aarch64`, macOS arm64, and `win_amd64`; no riscv64 wheel. Not applicable to the Grain programming language.

**What a user must do today to get a working Grain toolchain on riscv64:** build the OCaml/Reason compiler from source using a manually-provisioned OCaml >=5.2 and Node.js >=22.13 toolchain on riscv64 (both are available as unpatched Ubuntu 26.04 riscv64 packages - see Section 9), since no upstream CI has ever validated this path and no prebuilt binary exists on any channel.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/blocking issues |
|---|---|---|---|---|---|
| Binaryen | build-dependency, critical - Wasm codegen/optimizer; Grain's compiler emits IR that Binaryen lowers/optimizes into the final `.wasm` binary | Ubuntu 26.04 riscv64 confirmed (`binaryen` 120-4build1, universe, unpatched rebuild per [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/binaryen)); upstream build blocker fixed by [WebAssembly/binaryen#6410](https://github.com/WebAssembly/binaryen/pull/6410) (2024-03-19), superseded by [WebAssembly/binaryen#8094](https://github.com/WebAssembly/binaryen/pull/8094) (merged 2025-12-05) | no upstream riscv64 CI job at all | no riscv64 asset in upstream GitHub Releases; distro-only | none open |
| OCaml | build-dependency, critical - the native-code compiler used to build `grainc`/`graindoc`/`grainformat`/`grainlsp` (Grain pins `ocaml` 5.2.0 in `esy.json`) | Ubuntu 26.04 riscv64 confirmed (`ocaml` 5.4.0-3ubuntu1, `ocaml-base` 5.4.0-3ubuntu1); native riscv64 codegen backend exists upstream since OCaml 5.2 | no riscv64 entry in `ocaml/ocaml`'s CI matrix | no official riscv64 release binaries; distro-packaged only | [ocaml/ocaml#14799](https://github.com/ocaml/ocaml/issues/14799) - riscv64 jump-table dispatch miscompile under `rv64gc` compressed-jump codegen, opened 2026-05-08, closed/fixed 2026-05-15 - a live correctness risk for roughly one week that could in principle have miscompiled Grain's own compiler if hit before the fix |
| Node.js | runtime-dependency, critical - hosts the `grain` CLI wrapper and executes compiled `.wasm` output via V8's embedded Wasm engine (also runs `js_of_ocaml` bytecode targets); engine requirement `>=22.13` | Ubuntu 26.04 riscv64 confirmed (`nodejs` 22.22.1+dfsg+~cs22.19.15-1ubuntu1, universe) | upstream `BUILDING.md` classifies GNU/Linux riscv64 as "Experimental" tier (not Tier 1/2, not release-blocking) | no riscv64 build on official nodejs.org/dist; unofficial-builds.nodejs.org and distro packages only | 4 open riscv64 issues: [nodejs/node#65724](https://github.com/nodejs/node/issues/65724) (SIGILL in JS-to-wasm wrapper, lazy compilation), [nodejs/node#64538](https://github.com/nodejs/node/issues/64538) ("Illegal instruction" crash when V8 detects vector instructions), [nodejs/node#64717](https://github.com/nodejs/node/issues/64717) (`test-code-cache` fails with FFI enabled), [nodejs/node#61110](https://github.com/nodejs/node/issues/61110) (Single Executable Application tests often fail on RISC-V) |

The remaining pure-OCaml build dependencies declared in `compiler/esy.json` (menhir, sedlex, cmdliner, ocamlgraph, ppx_deriving*, yojson, uri, sexplib) carry no architecture-specific code and were not independently probed; their riscv64 fate is entirely gated on the OCaml toolchain above, not on anything in their own sources.

**Bottom line:** Grain has never had a riscv64 issue filed against it directly - its riscv64 posture is inherited entirely from Binaryen + OCaml + Node.js/V8. All three are installable today on Ubuntu 26.04 riscv64, but none carries upstream riscv64 CI, and Node.js's "Experimental" tier plus its two open Wasm/V8 crash bugs ([#65724](https://github.com/nodejs/node/issues/65724), [#64538](https://github.com/nodejs/node/issues/64538)) are the most concrete residual risk for actually *running* Grain-compiled `.wasm` modules on a riscv64 host, alongside the now-fixed OCaml jump-table miscompile ([#14799](https://github.com/ocaml/ocaml/issues/14799)) that affected the compiler build itself.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue, PR, or commit exists in grain-lang/grain | N/A | N/A | Confirmed across `search_issues`, `search_pull_requests`, `search_commits`, and a semantic (natural-language) issue search, all returning zero riscv content, plus a full-tree grep returning zero matches |
| [ocaml/ocaml#14799](https://github.com/ocaml/ocaml/issues/14799) | riscv64 jump-table dispatch miscompile under `rv64gc` | Closed/fixed (2026-05-15) | Correctness (dependency, not Grain-authored) | Live for ~1 week (opened 2026-05-08); could have silently mis-dispatched `match` statements with >=3 constant arms while building Grain's own compiler if hit before the fix |
| [nodejs/node#65724](https://github.com/nodejs/node/issues/65724) | SIGILL in JS-to-wasm wrapper on riscv64 (lazy compilation) | Open | Correctness/crash (dependency) | Directly relevant: Grain's compiled output is executed as Wasm inside Node's V8 |
| [nodejs/node#64538](https://github.com/nodejs/node/issues/64538) | "Illegal instruction" crash when V8 detects vector instructions on riscv64 | Open | Correctness/crash (dependency) | Same relevance as above |
| [nodejs/node#64717](https://github.com/nodejs/node/issues/64717) | `test-code-cache` fails with FFI enabled on riscv64 | Open | Lower severity (dependency) | Secondary relevance |
| [nodejs/node#61110](https://github.com/nodejs/node/issues/61110) | Single Executable Application tests often fail on riscv64 | Open | Lower severity (dependency) | Not on Grain's critical path (Grain does not use Node SEA) |

No correctness bugs specific to Grain itself have ever been reported for any architecture in connection with riscv64, because no one has run Grain on riscv64 and reported back.

## 12. Objections and Upstream Blockers

No stated objection to a RISC-V port exists, favorable or unfavorable - because no one has ever proposed one. There is no technical blocker intrinsic to Grain's own source (it has no architecture-specific code to port; see Section 4). The practical blockers are entirely at the CI/packaging layer:

- No `riscv64` entry exists in any `workflow_dispatch` choice list, CI matrix, or `platforms:` string in the repository, and no `docker/setup-qemu-action` step exists to add one cheaply.
- No riscv64 GitHub-hosted runner exists for GitHub Actions matrices generally, so adding riscv64 CI would require either QEMU emulation or a self-hosted/RISE-provided riscv64 runner - neither is referenced anywhere in the repo.
- No organizational blocker was identified (no closed-as-wontfix issue, no maintainer statement against RISC-V) because the topic has simply never come up.

**Acceptance probability if proposed:** [NEEDS VERIFICATION] - no maintainer statement on this exists in any source checked. Given the project has already added arm64 support via Docker/Buildx (albeit via a real cloud arm64 instance rather than QEMU) and shows no evidence of hostility to new platforms, a riscv64 CI addition (build-and-test via QEMU, following the arm64 precedent) appears procedurally straightforward, but this is an inference from the absence of objections, not a documented fact, and is marked accordingly.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Optimization gap:** N/A (Grain is a general-purpose language toolchain, not an optimization-purpose project per the color-coding skill's Step 2 test - it has no SIMD/vector/crypto/allocator hot paths whose value proposition depends on architecture-specific tuning)
- **Justification:** Grain has no upstream riscv64 CI (all 10 [GitHub Actions workflow files](https://github.com/grain-lang/grain/tree/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows) confirmed to reference only `ubuntu-latest`/`macos-latest`/`windows-latest` plus a `linux/amd64,linux/arm64` Docker matrix, no riscv64 anywhere) and no riscv64 release artifact on any channel checked ([GitHub Releases](https://github.com/grain-lang/grain/releases), [Ubuntu 26.04](https://packages.ubuntu.com/search?keywords=Grain&suite=resolute&searchon=names&section=all), [Arch RISC-V](https://archriscv.felixc.at/?q=grain)). The distribution floor does not apply and cannot lift the color above orange, because no Linux distribution packages Grain at all, on any architecture - there is no unpatched or patched distro build to credit. This places Grain squarely in the "no upstream riscv64 CI" default orange case (Step 1 of the color model), with no optimization-purpose modifier applicable.
- **Pending work:** None identified. There is no open PR, no tracking issue, and no RISE involvement of any kind - Grain does not appear in the RISE member list, the RISE blog (34 posts checked), the RISE GitHub organization, or the RISE Python wheel builder (80 packages listed, Grain not among them). The only artifact connecting Grain to this reporting effort is an unresearched queue entry in `riseproject-dev/sw-ecosystem`'s internal project-report queue - not a report, funded work item, or RISE-runner usage. Nothing currently in flight could change this grade; it would require someone to originate a riscv64 CI job (a Docker/Buildx or QEMU-based build-and-test leg, following the existing arm64 precedent) and, ideally, a riscv64 release artifact.

## 14. Investment Analysis

RISE has done no work on Grain (Section 12/13) - none of the sizing below is already covered by existing RISE or upstream effort; all of it is unfunded.

### 14.1 Functional Enablement

The core functional risk is not in Grain's own source (it has none to port - Section 4) but in validating that the OCaml/Reason compiler toolchain itself builds and produces a correct binary on riscv64, and that Node's V8 Wasm engine correctly executes Grain's compiled output there. This requires: (1) standing up a riscv64 build/test leg (native runner or QEMU) mirroring `build-native.yml`/`build-js.yml`/`test-pkg.yml`, (2) confirming the OCaml 5.2.0 pin (or a newer OCaml) builds and runs `grainc`/`graindoc`/`grainformat`/`grainlsp` correctly on riscv64 given the recently-fixed jump-table miscompile history ([ocaml/ocaml#14799](https://github.com/ocaml/ocaml/issues/14799)), and (3) running Grain's existing test suite against a riscv64 Node.js build to surface any interaction with the two open Node/V8 Wasm crash bugs ([#65724](https://github.com/nodejs/node/issues/65724), [#64538](https://github.com/nodejs/node/issues/64538)).

### 14.2 Performance Optimization

Not applicable in the traditional sense - Grain has no architecture-specific hot paths to tune (Section 4). Any "performance" concern is downstream, in the Wasm runtime's own riscv64 code quality (V8/Wasmtime/Wasmer), which is out of scope for Grain's own repository.

### 14.3 CI/CD Infrastructure

Add a `workflow_dispatch`/matrix entry for riscv64 to `build-native.yml`, `build-js.yml`, and `test-pkg.yml`, following the pattern already used for the `linux/arm64` Docker leg (either a real riscv64 cloud instance or a QEMU-emulated `ubuntu-latest` job, since no `docker/setup-qemu-action` step exists in the repo today). Extend `docker-publish.yml`'s `platforms:` string to include `linux/riscv64`. Extend `upload-binaries.yml` to publish a `grain-linux-riscv64` release asset once a build leg exists.

### 14.4 Ecosystem Enablement

Not applicable - Grain has no dependent package ecosystem of its own to enable (Section 10 omitted per rule 6: Grain is a standalone language toolchain, not a package registry with a plugin/extension ecosystem).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Stand up riscv64 native or QEMU build/test leg for `grainc`/CLI/stdlib; validate OCaml 5.2+ toolchain correctness on riscv64 | 2-3 | Grain maintainers or a RISE-sponsored contributor | High |
| Functional | Validate Grain's compiled `.wasm` test suite against a riscv64 Node.js build; triage against open [#65724](https://github.com/nodejs/node/issues/65724)/[#64538](https://github.com/nodejs/node/issues/64538) | 1-2 | Grain maintainers, coordinating with Node.js upstream | High |
| CI/CD | Add riscv64 entries to `build-native.yml`, `build-js.yml`, `test-pkg.yml`, `docker-publish.yml` (`platforms:` string) | 1-2 | Grain maintainers | High |
| Distribution | Publish `grain-linux-riscv64` release asset via `upload-binaries.yml` once CI leg exists; pursue an Ubuntu/Debian/Arch riscv64 package (none currently exists for Grain on any architecture) | 1 | Grain maintainers / distro packagers | Medium |
| Dependency | Track and confirm resolution of open Node.js riscv64 Wasm/V8 issues ([#65724](https://github.com/nodejs/node/issues/65724), [#64538](https://github.com/nodejs/node/issues/64538)) as an external dependency risk | 0.5 (monitoring only) | N/A (upstream Node.js) | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Grain repository](https://github.com/grain-lang/grain)
- [Grain homepage](https://grain-lang.org/)
- [Grain build documentation](https://grain-lang.org/docs/getting_grain)
- [grain-lang/grain issues search](https://github.com/grain-lang/grain/issues)
- [grain-lang/grain pull requests search](https://github.com/grain-lang/grain/pulls)
- [grain-lang/grain releases](https://github.com/grain-lang/grain/releases)
- [ci.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/ci.yml)
- [build.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/build.yml)
- [build-native.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/build-native.yml)
- [build-js.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/build-js.yml)
- [dependencies.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/dependencies.yml)
- [docker-publish.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/docker-publish.yml)
- [generate-docs.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/generate-docs.yml)
- [release.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/release.yml)
- [test-pkg.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/test-pkg.yml)
- [upload-binaries.yml](https://github.com/grain-lang/grain/blob/d6ab36811236010bccb203cda4d93c9903ccb192/.github/workflows/upload-binaries.yml)
- [Ubuntu 26.04 resolute package search for "Grain"](https://packages.ubuntu.com/search?keywords=Grain&suite=resolute&searchon=names&section=all)
- [Ubuntu 26.04 riscv64 binaryen package](https://packages.ubuntu.com/resolute/riscv64/binaryen)
- [Ubuntu 26.04 riscv64 ocaml package](https://packages.ubuntu.com/resolute/riscv64/ocaml)
- [Ubuntu 26.04 riscv64 nodejs package](https://packages.ubuntu.com/resolute/riscv64/nodejs)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=grain)
- [PyPI grain JSON API](https://pypi.org/pypi/grain/json)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [WebAssembly/binaryen PR #6410](https://github.com/WebAssembly/binaryen/pull/6410)
- [WebAssembly/binaryen PR #8094](https://github.com/WebAssembly/binaryen/pull/8094)
- [ocaml/ocaml issue #14799](https://github.com/ocaml/ocaml/issues/14799)
- [nodejs/node issue #65724](https://github.com/nodejs/node/issues/65724)
- [nodejs/node issue #64538](https://github.com/nodejs/node/issues/64538)
- [nodejs/node issue #64717](https://github.com/nodejs/node/issues/64717)
- [nodejs/node issue #61110](https://github.com/nodejs/node/issues/61110)
- [Node.js BUILDING.md](https://github.com/nodejs/node/blob/main/BUILDING.md)
