---
title: Node-RED
parent: Project Reports
color: green
dependencies:
  - name: Node.js
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: build-dependency
    criticality: optional
  - name: libuv
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="node-red" %}

# Node-RED

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Node-RED<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Node-RED is a flow-based, low-code programming tool for wiring together hardware devices, APIs, and online services, built on Node.js. It was originally created inside IBM's Emerging Technology Services team and open-sourced in September 2013. It is now a project of the **OpenJS Foundation**, licensed **Apache-2.0** (per the repository `LICENSE` and `package.json`), with contributors required to sign the OpenJS Foundation CLA (per `CONTRIBUTING.md`).

Governance is role-based (Users to Contributors to Committers) with no named board; the Committer community operates by consensus-seeking decision-making and is empowered to amend the governance model itself (per nodered.org's governance page). No repository-level `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists, and no `PLATFORMS.md`/`SUPPORT.md` architecture-tier policy exists anywhere in the project.

Corporate backing, from full commit history (10,794 commits on `main`):

| Contributor | Commits | Affiliation |
|---|---|---|
| Nick O'Leary | 6,417 (+79 alt-email) | Co-creator/lead, ex-IBM, now founder of FlowFuse, Inc. (current sponsor) |
| Dave Conway-Jones | 477 (+~260 across name variants) | Co-creator/lead, IBM |
| Hiroyasu Nishiyama | 423 | Hitachi |
| Kazuhito Yokoi | 229 (+174 alt) | Hitachi |
| Steve-Mcl / Stephen McLaughlin | 383 (+129 alt) | Independent/community core contributor |
| Ben Hardill | 96 | Ex-IBM, now FlowFuse-affiliated |

nodered.org lists the project as "actively sponsored by: FlowFuse," with IBM and Hitachi as past sponsors, consistent with the commit data.

Node-RED has no C/C++/assembly source files, no `binding.gyp` native addon configs, and no `arch`-keyed entries in any of its own `package.json` files. It is 100% JavaScript running on top of Node.js. This means the project has never had to treat a new CPU architecture as a distinct porting problem the way a compiled runtime does; it inherits whatever platforms Node.js itself supports. Consistent with this, there is no documented community stance for or against RISC-V, no tracking issue, and no RISE affiliation.

## 2. Port History and Upstreaming Timeline

There is no port history because there was never a port to perform. GitHub search (`search_issues`, `search_pull_requests`, `search_commits` against `node-red/node-red`) for `riscv`, `riscv64`, and `risc-v` returned zero results in every variant, confirmed independently through both direct GitHub API/MCP calls and a full local-clone `git log --all -i --grep`/`-S"riscv"` search across all 10,794 commits.

Only two incidental, non-porting "riscv" occurrences exist in the entire commit history:

| Date | Commit | Event | Source |
|---|---|---|---|
| 2025-09-07 | `b074b67ed` (Steve-Mcl) | "Fix uncaught error, update monaco, update types" - regenerated bundled Node.js `.d.ts` type definitions (upstream DefinitelyTyped) that list `'riscv64'` as one of the enum values `os.arch()`/`process.arch` can return. Not RISC-V-specific work. | Local clone `git log`, `/home/user/node-red/node-red` |
| 2026-04-29 | `64b8a40a1` (Nick O'Leary) | "Replace Grunt task runner with npm scripts and direct CLIs" - migration to esbuild pulled in esbuild's optional per-platform binaries, including `@esbuild/linux-riscv64`, as a transitive devDependency in `package-lock.json`. Not a port commit. | Local clone `git log`, `/home/user/node-red/node-red` |

No master tracking issue for a riscv64 port exists in `node-red/node-red`. There is no key contributor associated with RISC-V work because none has been done. The project is "fully upstream" on riscv64 in the only sense that applies to it: it ships identical, architecture-agnostic source (a single generic `.zip`/npm tarball per release) that runs on riscv64 wherever a compatible Node.js runtime is present, requiring zero Node-RED-specific engineering.

## 3. Upstream Support Tier

No formal platform/architecture tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or equivalent in the repo or on nodered.org). Node-RED's only stated runtime requirement is `"node": ">=22.9"` in `package.json`'s `engines` field - there is no architecture qualifier of any kind.

CI evidence: the two GitHub Actions workflows (`tests.yml`, `release.yml`) run exclusively on `ubuntu-latest` (x86_64 GitHub-hosted runner) with no architecture matrix dimension (only `node-version: [22, 24]`) and no riscv64 reference anywhere. Releases (checked via GitHub's release-assets endpoint for 5.0.6, 5.0.5, 5.0.4, 5.0.3, 4.1.14) ship exactly one generic `.zip`/`.tar.gz` source archive per version - identical across every architecture, including riscv64, because there is nothing architecture-specific to build.

| Architecture | Upstream CI | Official binary artifact | Notes |
|---|---|---|---|
| amd64 | Yes (tests.yml runs natively on `ubuntu-latest`) | Generic .zip/npm tarball (same file for all arches) | Native CI execution |
| arm64 | No dedicated arm64 CI job found in this repo's workflows | Same generic .zip/npm tarball | No arch-specific CI or artifact; runs via npm/Node.js like all platforms |
| riscv64 | No dedicated riscv64 CI job (none exists) | Same generic .zip/npm tarball | Runs identically wherever a compatible Node.js exists; no Node-RED-specific gating |

Because Node-RED ships one architecture-neutral artifact for all platforms and requires no compiled toolchain, the project takes the Step 0 architecture-independent classification (see Section 13) rather than being graded on a per-architecture CI matrix that does not exist for any architecture, including amd64 beyond native test execution.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Node-RED has no architecture-specific subsystems of any kind - no JIT, no SIMD, no crypto backend, no assembly, no GC barriers of its own. GitHub code search (`search_code`) for `__riscv repo:node-red/node-red`, `riscv64 repo:node-red/node-red`, and `process.arch repo:node-red/node-red` all returned zero results. Direct filesystem inspection of the local clone (HEAD `d5d883d`) found:

- `find . -name "*.c" -o -name "*.cc" -o -name "*.cpp" -o -name "*.S" -o -name "*.asm"` -> 0 files
- `find . -name "binding.gyp"` -> 0 files (no native Node addon build configs)
- `grep -rl '"cpu"'` across all `package.json` files -> 0 matches
- No arch-named directories (`arm64/`, `x64/`, `riscv/`) anywhere in the tree

The only three "riscv" string matches in the entire repository are non-functional:
1. `packages/node_modules/@node-red/editor-client/src/types/node/process.d.ts` and `os.d.ts` - auto-generated TypeScript ambient declarations (explicitly headed "Do not edit directly! This file is generated...") listing `'riscv64'` as one of Node.js's documented `process.arch`/`os.arch()` return values, vendored for Monaco editor autocomplete. Pure metadata, not Node-RED code.
2. `package-lock.json` - `@esbuild/linux-riscv64`, a transitive devDependency lockfile entry from esbuild's own per-platform prebuilt-binary mechanism. Reflects esbuild's riscv64 support, not Node-RED's.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A (delegated to Node.js/V8) | N/A (delegated to Node.js/V8) | N/A (delegated to Node.js/V8) |
| SIMD | N/A (none in Node-RED itself) | N/A | N/A |
| Crypto | N/A (delegated to Node.js `crypto`/OpenSSL) | N/A | N/A |
| Architecture-specific source files | 0 | 0 | 0 |

Runtime riscv64 viability for Node-RED is entirely a function of the Node.js runtime's own (separately tracked, upstream) riscv64 support, documented in Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

There is no CMake-based build system, no cross-compilation toolchain, and no riscv64-specific build documentation, because Node-RED has no compiled components. Checked directly in the local clone of `node-red/node-red` and the separate `node-red/node-red-docker` repo:

| Requested item | Result |
|---|---|
| `README.md` | Describes `npm install -g node-red` as the only install method; no build/compile section |
| `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` | None exist |
| `CMakeLists.txt` (repo-wide search) | Does not exist anywhere in the repo |
| `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake` | No `cmake/` directory exists at all |
| Dockerfiles | None in `node-red/node-red`. The separate `node-red/node-red-docker` repo has `.docker/Dockerfile.debian`, `.docker/Dockerfile.alpine`, `docker-custom/Dockerfile.debian`, `docker-custom/Dockerfile.custom` - none reference riscv64 |
| Official multi-arch Docker platforms (`node-red-docker/.github/workflows/main.yml`) | `linux/amd64`, `linux/arm64`, `linux/arm/v6`, `linux/arm/v7` only - riscv64 is not a supported Docker platform |
| GCC/Clang minimum versions, `-DUSE_X=OFF` flags, QEMU cross-build usage | N/A - no C/C++ compilation step exists, so there is no compiler-version requirement and QEMU is not used anywhere in the build/CI process |

The only per-architecture concern anywhere in the ecosystem is npm's own optional native-binary resolution for build tooling (esbuild's `@esbuild/linux-riscv64` optionalDependency, a devDependency, not shipped to end users) - this requires no user-facing build steps, toolchain files, or Dockerfiles.

**Local clones used for verification:** `/home/user/node-red/node-red`, `/home/user/node-red/node-red-docker`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

No functional gaps, performance gaps, security hardening gaps, or NaN/floating-point semantics issues specific to Node-RED itself were found in any search. Node-RED's own feature set is identical across all platforms because there is no platform-conditional code in the project.

| Feature/capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core flow engine, editor, admin API | Full | Full | Full (pure JS, identical code path) |
| Native bcrypt password hashing (`@node-rs/bcrypt`) | Native (Rust/NAPI) | Native (Rust/NAPI) | Falls back to pure-JS `bcryptjs` (see Section 9) - correctness preserved, performance lower |
| Docker image | Official (`linux/amd64`) | Official (`linux/arm64`) | Not published (Section 5, 8) |

The one documented functional-adjacent gap is `@node-rs/bcrypt` having no riscv64 build target (Section 9); Node-RED's own code already handles this gracefully via a try/catch fallback to `bcryptjs`, so this is a performance gap (slower password hashing) rather than a correctness or functional gap. No NaN/floating-point semantics issues were found for Node-RED; a web search for "Node-RED riscv NaN floating point bug" returned only unrelated generic Modbus float-register forum threads with no architecture angle.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for `node-red/node-red`.** Verified by reading actual file content, not inference. The complete workflow inventory is exactly two files:

**`.github/workflows/tests.yml`** (31 lines):
- Trigger: `push`/`pull_request` to `main`/`dev` only.
- Runner: `ubuntu-latest` (x86_64, GitHub-hosted). No QEMU, no `docker buildx`, no `arch`/`os` matrix dimension - the only matrix axis is Node.js version (`[22, 24]`).
- Job: checkout -> setup-node -> `npm ci` -> `npm run test`, run natively on x86_64.
- Zero lines containing "riscv".

**`.github/workflows/release.yml`** (63 lines):
- Trigger: `release: types: [published]` only.
- Runner: `ubuntu-latest`.
- Job: checks out `node-red`, `node-red-docker`, and `node-red.github.io`, runs two scripts that open auto-generated version-bump PRs against those other repos. No build, no test execution, no Docker image build/push, no `platforms:` step.
- Zero lines containing "riscv".

Corroborating checks (all negative): no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` anywhere in the tree; `.github/dependabot.yml` only tracks `github-actions` ecosystem updates; none of 186 remote branches contain "riscv" or "risc-v" in their name; local clone HEAD (`d5d883d1`) confirmed identical to `git ls-remote origin HEAD`, so the tree examined is current. No RISE runner references (`riseproject-dev` or RISE runner labels) appear anywhere in the CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (native, `ubuntu-latest`) | No dedicated job in this repo | No |
| CI runs tests | Yes | No dedicated job | No |
| Release-blocking | N/A (tests run on push/PR to main/dev) | N/A | N/A - no job exists |
| Runner type | GitHub-hosted native x86_64 | N/A | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

No official riscv64 binaries exist because Node-RED ships no architecture-specific binaries for any architecture. What was checked:

- **GitHub releases** (`https://github.com/node-red/node-red/releases/expanded_assets/5.0.6` and prior versions 5.0.5, 5.0.4, 5.0.3, 4.1.14): each release publishes exactly one generic `node-red-<version>.zip` plus GitHub's auto-generated source `.zip`/`.tar.gz` archives. Zero assets contain "riscv" or "riscv64" - or any architecture string at all - in the filename.
- **PyPI** (`https://pypi.org/pypi/node-red/json` and `https://pypi.org/simple/node-red/`): HTTP 404. No package named `node-red` exists on PyPI (expected - Node-RED is npm-native, not Python).
- **RISE wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/node-red/`): 302-redirects to the PyPI URL above, which 404s. No package found.
- **Ubuntu 26.04 (resolute)** (`https://packages.ubuntu.com/search?keywords=node-red&suite=resolute&searchon=names&section=all` and direct `https://packages.ubuntu.com/resolute/node-red`): "No such package." The package `node-red` does not exist in Ubuntu at all, for any architecture.
- **Arch Linux RISC-V port** (`https://archriscv.felixc.at/?q=node-red`): no results.
- **Official Docker images** (`node-red/node-red-docker/.github/workflows/main.yml`): multi-arch builds target `linux/amd64`, `linux/arm64`, `linux/arm/v6`, `linux/arm/v7` only. riscv64 is not a supported Docker platform.

**What a user must do to get a working Node-RED on riscv64:** install a working Node.js runtime for riscv64 (built from source or via a distro package - see Section 9 for the maturity caveats on that runtime), then run `npm install -g node-red` as on any other platform. There is no dedicated riscv64 packaging step for Node-RED itself because none is needed or exists.

## 9. Dependencies

Node-RED's own `package.json` (5.0.6) is pure JavaScript; none of its ~55 direct npm dependencies (express, mqtt, got, ws, etc.) carry a JIT/SIMD/native-crypto/compression backend of their own. The riscv64-relevant dependencies are (a) the Node.js runtime itself (`engines.node >=22.9`), which embeds V8 (JIT/SIMD), OpenSSL (crypto), zlib (compression), and libuv, and (b) `@node-rs/bcrypt`, the one native/compiled `optionalDependency` in the manifest.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/blocking issues |
|---|---|---|---|---|---|
| Node.js (runtime, via `engines.node`) | JS execution host (V8 JIT/Wasm/SIMD, `crypto`=OpenSSL, `zlib`, libuv) | Present in Ubuntu 26.04 riscv64 (resolute), builds from source; **Experimental tier** per upstream `BUILDING.md`, requires GCC>=14/Clang>=19 | Not guaranteed - Experimental tier explicitly disclaims full test-suite passage | No official upstream binary releases for riscv64 (Experimental tier = source/distro-only); unofficial community builds exist at unofficial-builds.nodejs.org; Debian/Ubuntu ship riscv64 builds from source | `nodejs/build#4099` (open tracking issue); `nodejs/node#64538` (open - V8 illegal-instruction crash on RVV vector instructions, SpacemiT-K3); `nodejs/node#65724` (open, filed 2026-09-01 - SIGILL in JS-to-Wasm wrapper); `nodejs/node#64717` (open - FFI `test-code-cache` failures); `nodejs/node#61110` (open - Single Executable Application tests fail on RISC-V); Sv39 39-bit VA space exhaustion under Wasm trap-handler guard pages (unresolved per `#4099` body) |
| V8 (embedded in Node.js) | JIT (Turbofan/Maglev/Liftoff), Wasm, SIMD/RVV vector codegen | Community-maintained by ISCAS/PLCT Lab; "unofficially supported" per v8.dev/docs/ports | Simulator-fidelity gaps; 12 open riscv-collab/v8 issues (5 of 12 are RV32G, being deprecated) | No standalone binaries (source-only, embedded distribution) | RVV vector-instruction lowering bug is the same root cause surfacing as `nodejs/node#64538`/`#65724` |
| OpenSSL (Node core `crypto`/`tls`; also transitively used by `got`, `https-proxy-agent`, `tough-cookie`) | TLS/crypto backend | Present in Ubuntu 26.04 riscv64 (resolute) as `libssl3t64`; treated as de facto first-class target upstream with dedicated CI | Passes; flaky at high `HARNESS_JOBS` on riscv64 (#22166, open) | Source-only upstream releases; Debian/Ubuntu/Arch RISC-V all carry current riscv64 packages | AES T-table cache side-channel without Zkn/Zvkned (critical, open PRs #31080/#31082); musl extension-detection broken (#28118, open) |
| zlib (Node core `zlib`; used by `tar`, compression middleware) | Compression backend | Present in Ubuntu 26.04 riscv64 (resolute) as `zlib1g`; builds cleanly (pure C, no SIMD path) | No riscv64-specific correctness bugs; not release-blocking in upstream CI | Distro packages available (Debian, Ubuntu, Arch RISC-V, Alpine); no upstream prebuilt binaries for any arch | RVV Adler32 PR #1099 stalled 8+ months, zero maintainer response |
| libuv (Node core event loop/async I/O) | epoll/io_uring, thread pool | Present in Ubuntu 26.04 riscv64 (resolute) as `libuv1t64` | No riscv64-specific open issues found (io_uring crash issue #4283 is ppc64le-specific) | Distro packages available | None found specific to riscv64 |
| `@node-rs/bcrypt` (optionalDependency, native Rust/NAPI addon) | Fast native bcrypt for Node-RED's admin auth | **Not built for riscv64** - confirmed directly in `packages/bcrypt/package.json` `napi.targets`: 14 target triples listed, no `riscv64gc-unknown-linux-gnu` entry; `package-lock.json` confirms no `@node-rs/bcrypt-linux-riscv64-*` platform package exists | N/A - no artifact produced | N/A - npm-distributed prebuilt binaries only, never published for riscv64 | No dedicated riscv64 issues in napi-rs/napi-rs. Functionally non-blocking for Node-RED: `packages/node_modules/@node-red/editor-api/lib/auth/users.js` wraps the require in try/catch and falls back to pure-JS `bcryptjs` when the native module is unavailable - riscv64 users get correct auth, just slower password hashing |
| node-red (self) | - | Not packaged in Ubuntu archive at all ("No such package" for `resolute`); always installed via npm, architecture-independent | - | - | - |

**Key takeaway:** Node-RED's own dependency tree is architecture-agnostic; all real riscv64 risk is inherited from the Node.js/V8 runtime it requires, which remains at Experimental support tier upstream with active, unresolved JIT/vector-instruction crash reports as recent as 2026-09-01 (`#65724`). The only compiled dependency in Node-RED's own manifest, `@node-rs/bcrypt`, has zero riscv64 build coverage but Node-RED's own code already handles that gracefully via a JS fallback - it degrades performance, not correctness.

Local clones used for inspection: `/home/user/node-red/node-red` (`package.json`, `package-lock.json`, `packages/node_modules/@node-red/editor-api/lib/auth/users.js`), `/home/user/node-rs` (napi-rs/node-rs, `packages/bcrypt/package.json`).

[NEEDS VERIFICATION]: The `project-graph` MCP server (for authoritative SPARQL-verified Ubuntu 26.04 package-graph cross-checks, including `hasDependency` transitive-closure queries) failed to connect this session (`CONNECTION_CLOSED`) across multiple retries. All "present in Ubuntu 26.04 riscv64" statements above are WebFetch/`packages.ubuntu.com` substitutes, not SPARQL-verified. Re-run once the graph server reconnects.

## 11. Known Bugs and Active Issues

No bugs or active issues specific to Node-RED itself exist on riscv64. GitHub issue/PR/code search against `node-red/node-red` for `riscv`, `riscv64`, `risc-v` in every combination (titles, bodies, comments) returned zero results, confirmed independently through two separate verification passes (direct API calls and GitHub MCP tools).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue or PR exists in `node-red/node-red` | - | - | Confirmed via `search_issues`/`search_pull_requests`/`search_commits`/`search_code`, all `total_count: 0` |

Bugs affecting Node-RED transitively through its Node.js runtime dependency (documented in Section 9, not in the node-red/node-red repository itself):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| `nodejs/build#4099` | RISC-V riscv64 tracking issue | Open | Tracking | Node.js remains Experimental tier for riscv64 |
| `nodejs/node#64538` | V8 illegal-instruction crash when RVV vector instructions detected (SpacemiT-K3) | Open | Correctness (crash) | Root-caused to V8's RVV vector codegen |
| `nodejs/node#65724` | SIGILL in JS-to-Wasm wrapper, lazy compilation into unpopulated code pages | Open (filed 2026-09-01) | Correctness (crash) | Same RVV-related root cause family as #64538 |
| `nodejs/node#64717` | FFI `test-code-cache` failures | Open | Test failure | - |
| `nodejs/node#61110` | Single Executable Application tests fail on RISC-V | Open | Test failure | - |
| `napi-rs/napi-rs` (bcrypt riscv64 target) | No dedicated riscv64 build target for `@node-rs/bcrypt` | N/A (no issue filed) | Performance only | Node-RED's own try/catch fallback to `bcryptjs` prevents this from being a correctness bug |

No correctness bugs affect Node-RED itself; the correctness-affecting bugs listed (V8 illegal-instruction crashes) live entirely in the Node.js/V8 runtime layer, not in any Node-RED code.

## 12. Objections and Upstream Blockers

No objections, technical blockers, or organizational blockers to riscv64 support exist within Node-RED's own project, because no one has needed to raise or resolve any - the project already runs on riscv64 by construction (pure JavaScript, no compiled code, generic npm distribution). No issue or PR has ever proposed riscv64 support and been rejected or stalled; none exists to be blocked.

The only real blockers sit one layer down, in the Node.js runtime Node-RED depends on: Node.js's riscv64 support remains at Experimental tier upstream (`nodejs/build#4099`), with open, unresolved V8/RVV crash bugs as of 2026-09-01 (`nodejs/node#65724`). These are Node.js project blockers, not Node-RED blockers, and Node-RED's community has no visibility into or stated position on them (no discourse.nodered.org thread or GitHub issue connects the two topics).

**Acceptance probability for future riscv64-specific work in Node-RED itself:** not applicable in the ordinary sense - there is nothing to accept, since Node-RED requires no riscv64-specific code to run on riscv64. Any future risk to Node-RED on riscv64 would have to originate from Node.js itself regressing or remaining unstable on that architecture, or from an as-yet-nonexistent native dependency being added to Node-RED's own manifest.

## 13. Readiness Assessment

- **Color:** green (architecture-independent)
- **Release provider:** upstream
- **Justification:** Node-RED is a pure JavaScript npm package with no compiled or native code of its own; per Step 0 of the color model (architecture-independent shortcut), it runs on riscv64 by construction wherever a compatible Node.js runtime exists. This is confirmed by the absence of any C/C++/assembly files, any `binding.gyp` native addon config, or any `"cpu"` field in any of Node-RED's own `package.json` files (Section 4), and by GitHub releases shipping a single generic `.zip`/npm tarball identical across all architectures ([node-red/node-red releases](https://github.com/node-red/node-red/releases)). The project's one optional native dependency, `@node-rs/bcrypt`, has no riscv64 build target, but Node-RED's own code (`packages/node_modules/@node-red/editor-api/lib/auth/users.js`) catches the require failure and falls back to pure-JS `bcryptjs`, preserving correctness with only a performance cost - this does not disqualify the architecture-independent classification, since it is a graceful, already-implemented fallback rather than a missing code path. Per the skill's Step 0 rule, an architecture-independent project is not penalized for lacking riscv64 CI, so the total absence of riscv64 references in Node-RED's CI, issues, PRs, and commits (Sections 2, 7, 11) does not lower the grade.
- **Pending work that could change the grade:** None identified within Node-RED itself - no open PRs, issues, or RISE involvement exist to track (Sections 2, 11, 12). The only factor that could downgrade the practical (not the formal) readiness of Node-RED on riscv64 is regression or continued instability in the Node.js runtime it depends on, tracked separately upstream at `nodejs/build#4099` and the open V8/RVV crash issues (`nodejs/node#64538`, `#65724`) - these are outside Node-RED's own scope and would need to be resolved in `nodejs/node`, not in `node-red/node-red`.

## 14. Investment Analysis

**RISE involvement check:** Confirmed via `riseproject.dev` blog (all 33 post titles scanned, full-text searched for "node-red" - zero matches), `riseproject.dev/members/` (Node-RED is not a RISE member or partner; RISE's 8 Premier and 12 General members are all chip/silicon/OS companies), the RISE Python wheel builder (`riseproject.gitlab.io/python/wheel_builder/`, 60+ packages listed, no Node-RED entry), and the `riseproject-dev` GitHub org (25 repos, none related to Node-RED). **RISE has funded or done nothing for Node-RED.** No prior work needs to be excluded from the sizing below.

### 14.1 Functional Enablement

No functional enablement work is required for Node-RED itself - it already runs on riscv64 wherever Node.js is available, with graceful degradation already implemented for its one native dependency. Data not available: no evidence was found of any functional gap requiring engineering work in `node-red/node-red`.

### 14.2 Performance Optimization

Not applicable in Node-RED's own codebase (no SIMD/JIT/numerics workload of its own; Section 4). The only concrete, identified performance gap is `@node-rs/bcrypt` falling back to slower pure-JS `bcryptjs` on riscv64 for password hashing during admin authentication (Section 9) - closing this requires upstream `napi-rs/node-rs` to add a `riscv64gc-unknown-linux-gnu` NAPI target, which is external to Node-RED and not sized here as Node-RED-specific work.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `tests.yml` would require a riscv64-capable GitHub Actions runner (self-hosted or RISE-provided) and would validate that Node-RED's test suite passes under a riscv64 Node.js build - largely a confidence-building exercise given the architecture-independent nature of the codebase, not a correctness necessity.

### 14.4 Ecosystem Enablement

Section 10 omitted per instructions - Node-RED's third-party "node" plugin ecosystem was outside the scope of the research findings provided, and no data on riscv64 coverage of community-contributed nodes (which may carry their own native dependencies) was gathered.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required - project is architecture-independent | 0 | N/A | N/A |
| Performance | Upstream `@node-rs/bcrypt` riscv64 NAPI target (external dependency, not Node-RED-owned work) | Data not available: no effort estimate found for napi-rs riscv64 target work | napi-rs/node-rs maintainers | Low |
| CI/CD | Add optional riscv64 job to `tests.yml` for confidence validation (requires riscv64 runner access) | 0.5-1 (workflow authoring plus runner provisioning coordination) | Node-RED committers / RISE (runner) | Low |
| Ecosystem | Audit community "node" plugin ecosystem for native-dependency riscv64 gaps | Data not available: no research was conducted on the third-party node ecosystem | Not assigned | Not assessed |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [node-red/node-red GitHub repository](https://github.com/node-red/node-red)
- [Node-RED homepage](https://nodered.org/)
- [Node-RED governance page](https://nodered.org/about/governance/)
- [node-red/node-red releases](https://github.com/node-red/node-red/releases)
- [node-red/node-red-docker GitHub repository](https://github.com/node-red/node-red-docker)
- [Node-RED PyPI lookup (404 - package does not exist)](https://pypi.org/pypi/node-red/json)
- [RISE Python wheel builder package index (Node-RED not listed)](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 (resolute) package search for node-red (no such package)](https://packages.ubuntu.com/resolute/node-red)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=node-red)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE project members list](https://riseproject.dev/members/)
- [nodejs/build#4099 - RISC-V tracking issue](https://github.com/nodejs/build/issues/4099)
- [nodejs/node#64538 - V8 illegal-instruction crash on RVV vector instructions](https://github.com/nodejs/node/issues/64538)
- [nodejs/node#65724 - SIGILL in JS-to-Wasm wrapper](https://github.com/nodejs/node/issues/65724)
- [nodejs/node#64717 - FFI test-code-cache failures](https://github.com/nodejs/node/issues/64717)
- [nodejs/node#61110 - Single Executable Application tests fail on RISC-V](https://github.com/nodejs/node/issues/61110)
- [nodejs/build#2876 - RISC-V to Experimental tier](https://github.com/nodejs/build/issues/2876)
- [v8.dev ports documentation](https://v8.dev/docs/ports)
- [Discourse Node-RED forum - Node-RED performance benchmark thread (not architecture-specific)](https://discourse.nodered.org/t/node-red-performance-benchmark/43072)
