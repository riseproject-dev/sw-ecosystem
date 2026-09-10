---
title: Edge Impulse CLI
parent: Project Reports
color: orange
dependencies:
  - name: sharp
    relation: runtime-dependency
    criticality: critical
  - name: serialport
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="edge-impulse-cli" %}

# Edge Impulse CLI

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse CLI<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse CLI (npm package `edge-impulse-cli`, distributed at [github.com/edgeimpulse/edge-impulse-cli](https://github.com/edgeimpulse/edge-impulse-cli)) is a Node.js/TypeScript command-line tool for the Edge Impulse embedded-ML platform: device management, data ingestion/upload, a daemon, serial connection handling, and related sub-tools (`edge-impulse-daemon`, `edge-impulse-uploader`, `edge-impulse-blocks`, etc.). It is not the inference SDK/runtime (that is a separate repository such as `inferencing-sdk-cpp`); this repo is purely the operator-facing CLI.

**Governance.** No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE`, or `SUPPORT.md` file exists anywhere in the repository, and there is no `.github/` directory of any kind (no PR template, no CODEOWNERS). This is a conventional single-company repository, not a foundation-governed project with a documented tiering or new-port policy.

**License.** `LICENSE.3-clause-bsd-clear` - BSD-3-Clause-Clear ("Clear BSD License"), copyright Edge Impulse Inc. (2025). Confirmed in `package.json`: `"author": "EdgeImpulse Inc. <hello@edgeimpulse.com>"`, `"license": "BSD-3-Clause-Clear"`.

**Corporate sponsors / community culture.** All contributors are Edge Impulse Inc. staff or automation: Edge Impulse Firmware Uploader (bot, 84 commits), Jorge Silva (33 commits), Jan Jongboom (29 commits, Edge Impulse co-founder/CTO), Mateusz Majchrzycki (17 commits), plus two minor contributors. No commits from Intel, Google, Arm, SiFive, or any other named corporate sponsor were found. Edge Impulse Inc. was acquired by Qualcomm Technologies in March 2025 [NEEDS VERIFICATION - acquisition date sourced from a single web search result, not a primary Edge Impulse or Qualcomm press release in these findings]. Qualcomm is a RISE Premier Member, but Edge Impulse itself has no separate/direct RISE membership found anywhere.

There is no evidence of any community culture around new architecture ports for this repo specifically - no governance document addresses the question, and no port (RISC-V or otherwise) appears anywhere in its history.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists, so there is no timeline to report.

| Date | Event | Source |
|---|---|---|
| - | No RISC-V-related commit, issue, or PR found in full repo history (166 commits, all branches: `master`, `main`, `better-freq-detection`, `fix-npm-build`) | `git log --all --grep -i riscv` (0 matches); [GitHub code search `riscv repo:edgeimpulse/edge-impulse-cli`](https://github.com/search?q=riscv+repo%3Aedgeimpulse%2Fedge-impulse-cli&type=code) (0 results) |

No key contributors exist for a RISC-V port because none has ever been attempted. There is nothing "fully upstream" or otherwise to assess.

## 3. Upstream Support Tier

No formal tier policy exists (no governance documentation of any kind, see Section 1). There is no CI, no release-blocking gate, and no official riscv64 binaries.

| Architecture | CI builds | CI tests | Official binaries |
|---|---|---|---|
| amd64 | N/A - no CI configuration exists for this repo at all | N/A | Runs via npm + Node.js on any platform with Node >=16; not architecture-differentiated |
| arm64 | N/A - no CI configuration exists for this repo at all | N/A | Same as above |
| riscv64 | N/A - no CI configuration exists for this repo at all | N/A | Same as above; no riscv64-specific claim made anywhere |

Official docs at [docs.edgeimpulse.com/docs/tools/edge-impulse-cli](https://docs.edgeimpulse.com/docs/tools/edge-impulse-cli) state supported platforms as x86_64, ARMv7, and AArch64 for "Edge Impulse for Linux" - RISC-V is not mentioned anywhere in official documentation, forum posts, or repo content.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The CLI repository itself contains **no compiled, architecture-specific code of any kind**, for any ISA:

- No `arch/` directory (`path:arch` code search: 0 results).
- No assembly files (`filename:*.S` search: 0 results; repo-wide file-type scan found zero `.c/.cpp/.cc/.h/.node/.s/.asm` files outside `node_modules`).
- No `Dockerfile`, no CMake, no Makefile-based native build system anywhere.
- No `process.arch` branching anywhere in the 984-file TypeScript/JavaScript source tree (`grep -rn "process.arch"`: 0 matches).
- No JIT backend, no SIMD dispatch, no crypto acceleration, no GC barriers - this is a pure Node.js CLI wrapper with `engines.node >= 16.0.0`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / native codegen | none in repo (delegated to Node.js/V8 runtime) | none in repo (delegated to runtime) | none in repo (delegated to runtime) |
| SIMD / vectorization | none in repo | none in repo | none in repo |
| Crypto acceleration | none in repo | none in repo | none in repo |
| Hand-written assembly | none | none | none |

The only place architecture could plausibly matter is in the *prebuilt native binaries* shipped by two transitive npm dependencies, `sharp` (image codec bindings) and `serialport` (N-API serial bindings) - see Section 9. That surface lives entirely outside this repository's own source and is not "architecture-specific code" belonging to Edge Impulse CLI itself.

This project is **not optimization-purpose** (it is an operator CLI, not a numerics/SIMD/codec library), so the Step 2 optimization-gap modifier does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

The only build/install instructions in `README.md`:

```
git clone https://github.com/edgeimpulse/edge-impulse-cli
npm install
npm run build      # runs `tsc -p ./`
npm link
```

Stated requirement: Node.js v16 or higher. No architecture-specific or cross-compilation guidance exists anywhere in `README.md` or the seven auxiliary README files (`README-blocks.md`, `README-daemon.md`, `README-data-forwarder.md`, `README-himax-flash-tool.md`, `README-internal.md`, `README-run-impulse.md`, `README-uploader.md`) - exhaustive case-insensitive greps for `riscv`, `toolchain`, `qemu`, `cross-compil`, `arm64`/`aarch64`, and `cmake` across the entire tree all returned zero matches.

`npm install` and `tsc` are architecture-agnostic for the CLI's own TypeScript source. The risk is entirely in `npm install`'s resolution of the two native transitive dependencies (`sharp`, `serialport`), which use `node-gyp`/`prebuild-install` mechanics that are architecture-sensitive - the CLI's own build system documents nothing about this, let alone riscv64. No QEMU usage, no documented build failures specific to this repository were found (because no one has attempted the build on riscv64, per the exhaustive issue/PR/commit search in Section 2).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core CLI (device mgmt, ingestion, daemon) | Works (pure JS, Node >=16) | Works (pure JS, Node >=16) | Would run wherever Node.js >=16 is available, but never tested or claimed by Edge Impulse [NEEDS VERIFICATION - no direct riscv64 execution report found] |
| Image dataset upload (depends on `sharp`) | Prebuilt native binary available | Prebuilt native binary available | No prebuilt binary; build-from-source against system libvips reported failing even when libvips is present ([lovell/sharp#4352](https://github.com/lovell/sharp/issues/4352)) |
| Serial/USB device communication (depends on `serialport`) | Prebuilt/buildable native binary | Prebuilt/buildable native binary | No prebuilt binary; falls back to `node-gyp rebuild` from source (architecture-generic C++, no SIMD/asm), but no confirmed successful riscv64 report found either way |

No performance-gap analysis applies (no SIMD/hot-path code in this repo, see Section 4). No security-hardening or floating-point/NaN semantics issues apply for the same reason - this is not a numerics or codec project.

**Functional gap:** image-dataset-upload workflows that depend on `sharp` are the concrete, documented risk point on riscv64, since sharp's own npm distribution channel excludes riscv64 and its from-source build path is reported broken by at least one third-party user even against a working system `libvips` ([lovell/sharp#4352](https://github.com/lovell/sharp/issues/4352), [lovell/sharp#4367](https://github.com/lovell/sharp/issues/4367)).

## 7. CI/CD Infrastructure

**No riscv64 CI exists - confirmed independently across two research passes on this repository.**

Direct filesystem inspection of a fresh, verified clone (`git rev-parse HEAD` = `000b0f8`, "Release v1.39.3", origin confirmed as `github.com/edgeimpulse/edge-impulse-cli`):

- `ls -la` at repo root: **no `.github` directory exists at all**.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, or `.cirrus.yml` at root.
- Checked on every branch, not only default: `master` (default, `origin/HEAD`), `main`, `better-freq-detection`, `fix-npm-build`. `git ls-tree -r --name-only` grepped for `^\.github` on each: **no `.github` path on any branch**.
- `git grep -il "riscv"` against each branch's full tree: **zero matches on any branch**.
- GitHub's own code-search index cross-check: `path:.github/workflows repo:edgeimpulse/edge-impulse-cli` -> **0 results** (nothing indexed at that path at all).

There is nothing to quote lines from, no trigger conditions, no runner type, and no QEMU or cross-compilation setup of any kind to report, because no CI configuration of any kind exists in this repository for any architecture, not only riscv64.

| Architecture | CI exists | Runner type | RISE runners used |
|---|---|---|---|
| amd64 | No (no CI config of any kind in the repo) | N/A | N/A |
| arm64 | No (no CI config of any kind in the repo) | N/A | N/A |
| riscv64 | No | N/A | No - confirmed zero RISE involvement (Section 12) |

## 8. Distribution and Release Status

No riscv64 binary, package, or release asset exists anywhere checked:

- **GitHub Releases:** Only one formal release exists, [`v1.13.16-alpha`](https://github.com/edgeimpulse/edge-impulse-cli/releases) (pre-release), with exactly two assets - auto-generated `v1.13.16-alpha.zip` and `v1.13.16-alpha.tar.gz` (source archives only). Neither filename references riscv. Many version tags exist (e.g., 1.39.3, 1.39.2 down through 1.35.1) but these are npm-publish git tags, not GitHub Releases with attached binaries.
- **npm registry** (the actual distribution channel): [`registry.npmjs.org/edge-impulse-cli`](https://registry.npmjs.org/edge-impulse-cli) returns HTTP 200, latest version `1.39.3`, pure JavaScript/TypeScript package, `engines.node >= 16.0.0`, no per-architecture binaries published by Edge Impulse itself (npm doesn't carry per-arch assets for this package).
- **PyPI:** `https://pypi.org/pypi/edge-impulse-cli/json` -> HTTP 404. No such package exists on PyPI (the tool is npm-distributed, not Python-distributed).
- **Ubuntu 26.04 (Resolute):** [`packages.ubuntu.com` search](https://packages.ubuntu.com/search?keywords=edge-impulse-cli&searchon=names&suite=resolute&section=all) -> "Sorry, your search gave no results." No package under any architecture, not only riscv64. Project-graph SPARQL query against the Ubuntu 26.04 riscv64 binary-package graph (`edge impulse cli` / `python3-edge-impulse-cli` / `libedge-impulse-cli`) also returned 0 bindings.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=edge%20impulse%20cli)): no results.
- **RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-cli/` redirects to the nonexistent PyPI project (404) - not applicable since this is not a Python package.

**What a user must do to get a working install on riscv64:** run `npm install -g edge-impulse-cli` on a riscv64 machine with Node.js >=16 present. This has not been documented as tried or verified by anyone (Edge Impulse, RISE, or a third party) in any source checked. Success is contingent on `sharp` and `serialport` resolving on riscv64, which is unconfirmed and, for `sharp`, has at least one documented third-party failure report (Section 6, Section 9).

## 9. Dependencies

The CLI's JS-level dependency tree (express, ws, socket.io, undici, tar, yauzl, cbor, js-yaml, papaparse, jpeg-js, etc.) is pure JavaScript and architecture-agnostic. Two dependencies carry native/compiled, architecture-dependent code, plus the JS runtime itself:

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Node.js / V8 (engine `>=16`) | JS runtime + JIT for the whole CLI | Found in Ubuntu 26.04 riscv64 (resolute) as a distro-built package. Upstream Node.js declined official riscv64 support: [nodejs/node#56175](https://github.com/nodejs/node/issues/56175) "Please add official support for riscv64-linux", closed not planned. Only community `unofficial-builds.nodejs.org` binaries exist upstream. | Multiple open 2026 correctness bugs on riscv64: [nodejs/node#65724](https://github.com/nodejs/node/issues/65724) (SIGILL in JS-to-wasm wrapper, opened 2026-09-01), [#64538](https://github.com/nodejs/node/issues/64538) (illegal-instruction crash from V8 vector-instruction misdetection, opened 2026-07-16), [#64717](https://github.com/nodejs/node/issues/64717) (`test-code-cache` fails w/ FFI, opened 2026-07-24), [#61110](https://github.com/nodejs/node/issues/61110) (Single Executable Application tests fail, opened 2025-12-18) | No official upstream binary release for riscv64; distro-built or unofficial-builds only | [nodejs/node#56175](https://github.com/nodejs/node/issues/56175) (official support declined), #65724, #64538, #64717 (all open) |
| sharp 0.32.6 | Native image decode/resize (uploader/data pipelines for image datasets) | libvips (its C backend) found in Ubuntu 26.04 riscv64 (resolute): `libvips-dev`, `libvips-tools`, `libvips42t64`. sharp itself ships no prebuilt riscv64 binary; build-from-source reported failing even with system libvips present ([lovell/sharp#4352](https://github.com/lovell/sharp/issues/4352), sharp 0.33.5 on Milk-V Mars, libvips 8.17.0 installed but build failed) | No riscv64 CI evidence in the sharp repo; only user bug reports | No official riscv64 prebuilt npm binary; `npm install --build-from-source` is the only path and is not confirmed reliably working | [lovell/sharp#4367](https://github.com/lovell/sharp/issues/4367) "Prebuilt binaries for linux-riscv64" (closed, unresolved), [#4352](https://github.com/lovell/sharp/issues/4352) (closed, unresolved) |
| serialport 8.0.8 | Native N-API serial-port bindings for daemon/uploader/serial-terminal | Not distro-tracked as a separate package (npm-distributed native module; largely self-contained C++, not tied to a shared lib like libserialport). Supporting system libs `libserialport0`/`libserialport-dev`, `libudev1`/`libudev-dev` present in Ubuntu 26.04 riscv64 (resolute). No riscv64-specific issues found in `serialport/node-serialport` (0 direct hits; 2 general ARM-adjacent issues, neither riscv64-specific) | No riscv64 CI evidence found | Predates any riscv64 prebuild target (2019-era); `npm install` falls back to `node-gyp rebuild` from source, architecture-generic (no SIMD/asm), should compile given a build toolchain, but no confirmed successful report found | None found - likely untested by that community, not evidence of a known fix |

Deeper trace of the libvips codec chain sharp depends on (all confirmed present in Ubuntu 26.04 riscv64 "resolute" per the project graph):

- **libjpeg-turbo:** has a real RVV 1.0 intrinsics SIMD port but declined to publish riscv64 release binaries ([libjpeg-turbo#885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), "won't implement"); Ubuntu therefore carries pre-RVV versions. 2 of 590 unit tests fail on `qemu-system-riscv64` ([libjpeg-turbo#710](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710), worked around).
- **libpng:** upstream merged RVV support May 2025 (PR #666, released v1.6.49), with a follow-up build-break fix in v1.6.53 (PR #771) under `-march=rv64gv`. No blocking issues.
- **libwebp:** no RISC-V port at all upstream (0 riscv64 files in `src/dsp/`, no CI target); Ubuntu ships a working scalar-C riscv64 build regardless.
- **zlib:** pure-C, builds on riscv64 without dedicated effort; only OpenBSD/riscv64 CI exists upstream (merged PR #1139), no Linux/riscv64 CI; an RVV-accelerated Adler32 PR (#1099) is unmerged.
- **Highway (libhwy):** found packaged (`libhwy1t64`) in Ubuntu 26.04 riscv64; not independently deep-dived in this pass.

The mitigating finding: the entire native library chain behind `sharp` (libvips, libjpeg-turbo, libpng, libwebp, zlib, lcms2, Highway, and further transitive deps) is already packaged and available on Ubuntu 26.04 riscv64, so a from-source `sharp` build against system libvips is theoretically viable on that distro even though sharp's own npm distribution channel does not support riscv64 - the packaging/build glue is the gap, not the underlying C libraries.

Of these, `libpng`, `libjpeg-turbo`, `libwebp`, `zlib`, `V8`, and `Highway` are separately tracked in `projects.yml`; `sharp`, `libvips`, `serialport`, and Node.js itself are not currently tracked as separate projects in that file.

## 11. Known Bugs and Active Issues

No riscv64-related issues, PRs, or commits exist in `edgeimpulse/edge-impulse-cli` itself. Confirmed via multiple independent search passes:

- [`search_issues`](https://github.com/search?q=riscv+repo%3Aedgeimpulse%2Fedge-impulse-cli&type=issues) for "riscv", "riscv64", "risc-v" scoped to the repo: 0 results each.
- [`search_pull_requests`](https://github.com/search?q=riscv+repo%3Aedgeimpulse%2Fedge-impulse-cli&type=pullrequests) for "riscv", "riscv64", "risc-v": 0 results each.
- `search_commits` for "riscv" (default branch): 0 results.
- Full-repo case-insensitive `grep -ril "riscv"` on a fresh clone: 0 matches.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue or PR exists in this repository | N/A | N/A | Corpus is empty, not merely thin |

**Correctness bugs affecting riscv64 exist one dependency layer down, not in this repo:** [nodejs/node#65724](https://github.com/nodejs/node/issues/65724) (SIGILL, open, 2026-09-01), [nodejs/node#64538](https://github.com/nodejs/node/issues/64538) (illegal-instruction crash, open, 2026-07-16), and [lovell/sharp#4352](https://github.com/lovell/sharp/issues/4352) (install/build failure, closed unresolved). None of these are filed against edge-impulse-cli itself.

## 12. Objections and Upstream Blockers

**Stated objections:** none found - because no one has ever asked. No feature request, no tracking issue, and no discussion of riscv64 support exists anywhere in this repository's history.

**Technical blockers:**
- No CI infrastructure of any kind exists to validate a riscv64 build even if contributed (Section 7).
- The `sharp` native dependency has a documented, unresolved riscv64 install/build failure report even when the system `libvips` backend is present ([lovell/sharp#4352](https://github.com/lovell/sharp/issues/4352)), which is a blocker outside this repo's control.
- Node.js itself carries open, unresolved 2026 correctness bugs (SIGILL/illegal-instruction crashes) on the only available (unofficial) riscv64 builds, and upstream Node.js has explicitly declined official riscv64 support ([nodejs/node#56175](https://github.com/nodejs/node/issues/56175)).

**Organizational blockers:**
- No governance process exists for accepting new-platform contributions (no MAINTAINERS/GOVERNANCE doc, no PR template, no CODEOWNERS - Section 1).
- Single-vendor repo maintained exclusively by Edge Impulse Inc. staff/automation, with no RISE membership or RISE-tracked involvement of any kind found (Section "RISE Project" research, Section 13 below).

**Acceptance probability:** Low in the near term absent an external contribution, given zero prior engagement, no CI to validate a port, and unresolved blockers in two upstream dependencies (Node.js, sharp) that sit outside Edge Impulse's control.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No upstream CI of any kind exists for this repository (no `.github/workflows`, no GitLab CI, no Jenkinsfile - confirmed on every branch via direct clone inspection and cross-checked against GitHub's own code-search index), and no distribution ships a riscv64 package for this project under any name (Ubuntu 26.04 "resolute" package search returns no results for any architecture; no PyPI package exists; no Arch Linux RISC-V listing). Per the color model's Step 1, "no upstream riscv64 CI" with no distribution floor available (nothing is packaged anywhere to apply the floor to) places this project at orange, not grey, because the absence is well-established through exhaustive search rather than being an unknown-unknown, and not red, because there is no direct evidence that edge-impulse-cli itself is confirmed broken on riscv64 (no one has attempted or reported an install on riscv64 in any source checked). See [Ubuntu 26.04 package search](https://packages.ubuntu.com/search?keywords=edge-impulse-cli&searchon=names&suite=resolute&section=all) and the [GitHub Releases page](https://github.com/edgeimpulse/edge-impulse-cli/releases).
- This is not an optimization-purpose project (Step 2 does not apply); no `Optimization level` header field is included.
- **Pending work that could change the grade:** none identified. No open PRs, no open issues, and no RISE involvement of any kind exists for this project (confirmed by checking [riseproject.dev/blog](https://riseproject.dev/blog) via its feed - 26 posts scanned back to September 2024, the [RISE GitLab wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) - 85 packages listed, none Edge Impulse-related, and the full `riseproject-dev` GitHub org - 25 repos, org-wide code search, and issue search in `ai-ml-wg` and `python-wheels`, all returning zero Edge Impulse CLI references). The single trace of "Edge Impulse CLI" anywhere in RISE-affiliated sources is an unresearched backlog entry in this repository's own tracking queue (`project-reports/.queue.yml`), not a RISE-funded or RISE-tracked deliverable. Should upstream Node.js resolve its open riscv64 correctness bugs and sharp gain a working riscv64 build path, the practical runnability of this CLI on riscv64 would improve without any change needed in edge-impulse-cli itself - but that is downstream work in other projects, not evidence bearing on this project's own grade today.

## 14. Investment Analysis

**RISE-funded work check:** Confirmed zero RISE involvement with Edge Impulse CLI or its sibling repos (Section 13). No work is currently covered by RISE that would need to be excluded from sizing below.

### 14.1 Functional Enablement

Core CLI functionality (device management, data ingestion, daemon) is pure JavaScript and requires no porting work - it will run wherever Node.js >=16 runs. The functional risk is narrow and concentrated in validating the two native transitive dependencies (`sharp`, `serialport`) on riscv64: confirming `npm install` succeeds, that `sharp` builds against the already-packaged Ubuntu riscv64 `libvips` stack (or securing a working alternative), and that `serialport`'s `node-gyp` fallback compiles cleanly. No code changes to edge-impulse-cli itself are anticipated to be required; this is primarily a validation and packaging-glue exercise.

### 14.2 Performance Optimization

Not applicable. This project has no architecture-specific hot paths, no SIMD/JIT/crypto code of its own (Section 4), and is not optimization-purpose. Any performance characteristics on riscv64 are inherited entirely from the Node.js/V8 runtime, which is out of scope for this repo's own optimization work.

### 14.3 CI/CD Infrastructure

The repository has no CI of any kind for any architecture, so introducing riscv64 CI first requires introducing CI at all (e.g., a baseline GitHub Actions workflow covering `npm install && npm run build`), then adding a riscv64 job (native runner or QEMU) atop it. This is a larger lift than adding a riscv64 job to an existing matrix, since there is no existing amd64/arm64 CI to extend.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's own rule. Edge Impulse CLI is a standalone tool distributed via npm; it has no dependent package ecosystem (no plugins, no packages that consume it as a library) requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Validate `npm install -g edge-impulse-cli` end-to-end on riscv64 hardware/QEMU; confirm `sharp` builds against Ubuntu-packaged `libvips` or document a working workaround | 1-2 | Edge Impulse Inc. or a RISE-affiliated contributor | High |
| Functional | Track and, if feasible, contribute to resolving [lovell/sharp#4352](https://github.com/lovell/sharp/issues/4352)/[#4367](https://github.com/lovell/sharp/issues/4367) upstream (sharp riscv64 prebuilt binaries or reliable from-source build) | 2-4 (upstream-dependent, outside this repo's control) | sharp/lovell upstream, with possible RISE assistance | Medium |
| Functional | Validate `serialport` 8.0.8 `node-gyp` fallback build on riscv64; upgrade to a newer serialport release if compatibility issues are found | 0.5-1 | Edge Impulse Inc. or a RISE-affiliated contributor | Medium |
| CI/CD | Introduce a baseline GitHub Actions workflow for the repo (none currently exists for any architecture), then add a riscv64 build/test job | 1-2 | Edge Impulse Inc. | Medium |
| Runtime dependency | No direct action item for edge-impulse-cli; monitor upstream Node.js riscv64 correctness bugs ([nodejs/node#65724](https://github.com/nodejs/node/issues/65724), [#64538](https://github.com/nodejs/node/issues/64538)) that could affect CLI reliability | N/A (tracking only) | N/A | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Edge Impulse CLI repository](https://github.com/edgeimpulse/edge-impulse-cli)
- [Edge Impulse CLI documentation](https://docs.edgeimpulse.com/docs/tools/edge-impulse-cli)
- [Edge Impulse CLI releases page](https://github.com/edgeimpulse/edge-impulse-cli/releases)
- [Edge Impulse CLI v1.13.16-alpha expanded assets](https://github.com/edgeimpulse/edge-impulse-cli/releases/expanded_assets/v1.13.16-alpha)
- [Edge Impulse CLI tags](https://github.com/edgeimpulse/edge-impulse-cli/tags)
- [npm registry: edge-impulse-cli](https://registry.npmjs.org/edge-impulse-cli)
- [PyPI JSON API: edge-impulse-cli (404)](https://pypi.org/pypi/edge-impulse-cli/json)
- [PyPI simple index: edge-impulse-cli (404)](https://pypi.org/simple/edge-impulse-cli/)
- [Ubuntu 26.04 (resolute) package search: edge-impulse-cli](https://packages.ubuntu.com/search?keywords=edge-impulse-cli&searchon=names&suite=resolute&section=all)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/?q=edge%20impulse%20cli)
- [RISE GitLab wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project homepage](https://riseproject.dev)
- [nodejs/node#56175 - official riscv64-linux support declined](https://github.com/nodejs/node/issues/56175)
- [nodejs/node#65724 - SIGILL in JS-to-wasm wrapper](https://github.com/nodejs/node/issues/65724)
- [nodejs/node#64538 - illegal-instruction crash from V8 vector-instruction misdetection](https://github.com/nodejs/node/issues/64538)
- [nodejs/node#64717 - test-code-cache fails w/ FFI](https://github.com/nodejs/node/issues/64717)
- [nodejs/node#61110 - Single Executable Application tests fail on RISC-V](https://github.com/nodejs/node/issues/61110)
- [lovell/sharp#4352 - Error when installing on RISCV](https://github.com/lovell/sharp/issues/4352)
- [lovell/sharp#4367 - Prebuilt binaries for linux-riscv64](https://github.com/lovell/sharp/issues/4367)
- [libjpeg-turbo#885 - riscv64 release binaries declined ("won't implement")](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)
- [libjpeg-turbo#710 - 2/590 unit tests fail on qemu-system-riscv64](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710)
- Internal status reports: `project-reports/v8.md`, `project-reports/libjpeg-turbo.md`, `project-reports/libpng.md`, `project-reports/libwebp.md`, `project-reports/zlib.md`
- Local full checkout of `edgeimpulse/edge-impulse-cli` (HEAD `000b0f8`, "Release v1.39.3") at `/home/user/edgeimpulse/edge-impulse-cli`, used for direct filesystem/CI-configuration/grep verification
- `/home/user/sw-ecosystem/projects.yml` (project tracking scope reference)
