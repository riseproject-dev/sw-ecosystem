---
title: WinterJS
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="winterjs" %}

# WinterJS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for WinterJS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

WinterJS is a Rust-based JavaScript Service Workers runtime built around the SpiderMonkey (mozjs) engine. It compiles primarily to a `wasm32-wasmer-wasi` (WASIX) artifact intended to run on the Wasmer Edge runtime, though its own CI also produces native x86 and arm builds for testing purposes. It implements the WinterCG server-runtime API surface but has no formal relationship with the WinterCG standards body; the project README states explicitly: "WinterJS is not officially endorsed by WinterCG, despite sharing 'Winter' in their name."

The project is wholly owned and maintained by a single vendor, Wasmer, Inc. (GitHub org `wasmerio`), under the MIT license (copyright header: "Copyright (c) 2023-present Wasmer, Inc. and its affiliates."). There is no external foundation, no MAINTAINERS/OWNERS/CODEOWNERS file, no SUPPORT.md or PLATFORMS.md, and no CONTRIBUTING guide anywhere in the repository.

**As of 2026-03-17 the repository is archived and read-only.** The top of the README states WinterJS is deprecated in favor of Wasmer's own "Edge.js" runtime. No new pull requests can be merged into this repository going forward.

**Governance / corporate maintainers** (derived from `git shortlog` across full project history, since no maintainer list is published):
- Arshia Ghafoori (`arshia001@live.com`) - 187 commits, the primary hands-on author, Wasmer-affiliated.
- Syrus Akbary (`me@syrusakbary.com`) - Wasmer, Inc. co-founder/CEO, 67 commits.
- Christoph Herzog (`chris@theduke.at`) - long-time Wasmer engineer, 55 commits.

A separate block of high-commit-count names (Josh Matthews, Ms2ger, Alan Jeffrey, Michael Wu, bors-servo, Vladimir Vukicevic, all `@mozilla.com`/`@servo`-affiliated) are **not** WinterJS maintainers - their commits are vendored SpiderMonkey/Servo engine history imported into the repo's git log via "Update SpiderMonkey" commits, and should not be read as WinterJS governance.

**Community culture on new ports:** no tier policy, no platform-support document, and no RFC/porting-request process of any kind exists in this repository. Combined with the March 2026 archival, there is no live process through which a riscv64 port could be proposed or accepted upstream.

## 2. Port History and Upstreaming Timeline

No riscv64 port exists for WinterJS. There is no milestone table to produce.

| Date | Event | Source |
|---|---|---|
| n/a | No riscv64-related commit, PR, or issue has ever been opened against `wasmerio/winterjs` | Confirmed via GitHub API `search_issues`, `search_pull_requests`, `search_code`, `search_commits` - each returns `total_count: 0` for "riscv"/"riscv64" scoped to this repo |

The only occurrences of the string "riscv" anywhere in the repository's full git history are incidental and not WinterJS-specific:
- Vendored SpiderMonkey engine source (`js/src/jit/riscv64/*.cpp`) added by the commit "Update SpiderMonkey to 115.3.0 (ESR)" (2023-09-16, author `sagudev`) - this is Mozilla's own RISC-V JIT backend for SpiderMonkey, imported wholesale as part of an engine version bump, not a WinterJS enablement effort.
- An autoconf `config.guess`/`config.sub` triplet-list bump ("Bump up config.{guess,sub} to latest", 2015-01-05, author Akos Kiss) that predates WinterJS's own creation (2023, per the LICENSE header) by roughly eight years - it comes from imported Servo/mozjs history, not a WinterJS commit.

**Fully upstream:** not applicable - there is no port to be fully or partially upstream, and the repository's archived state forecloses any future one.

## 3. Upstream Support Tier

No formal support-tier policy is documented for any architecture. The de facto tier is defined entirely by the CI matrix in `.github/workflows/build-and-test.yml` (191 lines, read in full) and `.github/workflows/release.yml` (51 lines, read in full).

| Architecture | CI: builds | CI: tests | Official release artifact |
|---|---|---|---|
| amd64 (x86_64) | yes - `ubuntu-latest` (native), `macos-13` (native) | yes | no per-architecture GitHub release binary; only the WASIX wasm artifact is published, to the Wasmer registry, not GitHub Releases |
| arm64 (aarch64) | yes - `macos-latest` (native) | yes | same as above |
| wasm32 (WASIX, architecture-neutral) | yes - `ubuntu-latest` wasix job (`wasm32-wasmer-wasi` target) | yes | yes - this is the only artifact `release.yml` actually publishes, to the Wasmer registry on `v*` tag push |
| riscv64 | no | no | no |

Source: direct read of [build-and-test.yml and release.yml](https://github.com/wasmerio/winterjs/tree/main/.github/workflows) (only two workflow files in the repo; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` present). Also confirmed: [the repository's Releases page](https://github.com/wasmerio/winterjs/releases) shows "There aren't any releases here" - zero GitHub releases have ever been published for any architecture.

## 4. Technical Architecture and RISC-V-Specific Subsystems

WinterJS's own Rust source contains **zero architecture-specific code for any architecture**, not only riscv64:
- Full-tree search for `#[cfg(target_arch = ...)]` guards, filtered for x86_64/aarch64/arm/riscv, returned zero matches.
- No file or directory anywhere in the repo is named `*riscv*`, `*x86_64*`, `*aarch64*`, `*arm64*`, or `*amd64*`.
- `mcp__github__search_code` for `__riscv repo:wasmerio/winterjs` and `target_arch repo:wasmerio/winterjs` both return `total_count: 0`.

WinterJS embeds a JIT engine (SpiderMonkey, via the `mozjs`/`mozjs_sys` crates, `wasmerio/mozjs` fork on the `wasi-gecko` branch) but builds that engine exclusively for the `wasm32-wasi` target - not as native per-ISA machine code within this repository. Any genuine ISA-specific JIT code (baseline/Ion/Warp compilers, SIMD dispatch) lives inside the SpiderMonkey engine itself, a separate upstream project, and is moot for WinterJS's own build path since it is not compiled to native riscv64 machine code here.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| WinterJS-native arch-specific code | none (0 `cfg(target_arch)` guards) | none | none |
| JIT (SpiderMonkey, embedded) | compiled to `wasm32-wasi`, not native amd64 | compiled to `wasm32-wasi`, not native arm64 | compiled to `wasm32-wasi`, not native riscv64; native riscv64 JIT exists upstream in SpiderMonkey itself but is not exercised by WinterJS's build |
| SIMD / vectorization | delegated to Wasmer WASM runtime layer beneath the artifact | same | same, and unverified for riscv64 (see Section 8) |

Portability across host architectures is a property of the Wasmer WASM runtime that executes the `wasm32-wasmer-wasi` artifact, not of any per-architecture code inside `wasmerio/winterjs`. That runtime's own riscv64 status is a separate project and was not verified in this research (out of scope of the WinterJS manifest and CI). Data not available: riscv64 support status of the Wasmer host runtime itself.

## 5. Build System, Cross-Compilation, and Toolchain

WinterJS is a Rust/Cargo project. There is no CMakeLists.txt, no `*.cmake` file, and no `cmake/` directory anywhere in the repository - `docs/` contains only `References.md` and a SpiderMonkey cookbook file.

**Native build** (used for the amd64/arm64 CI jobs): `cargo build --profile release-compact`. Requirements, per CI configuration:
- Rust **1.76**, pinned via `dtolnay/rust-toolchain@master`.
- Clang/LLVM **15** (`clang-15`, `libclang-dev`) - required to build the embedded SpiderMonkey fork.
- Python **3.12** - part of the SpiderMonkey build toolchain.

**WASIX (WASM) build**, the actual release path: `bash build.sh` -> `cargo +wasix build --target wasm32-wasmer-wasi -r`. Requires the `wasix-org/rust` toolchain, a `wasix-libc` sysroot, plus `wasm-opt`, `wasm-strip`, and `wabt`.

**Cross-compilation:** `Cross.toml` is the only cross-compilation configuration file in the repo, and it defines exactly two targets, both via `cross`'s `servo` container images:
```
[target.aarch64-unknown-linux-gnu]
image = "ghcr.io/servo/cross-aarch64-unknown-linux-gnu:main"
[target.armv7-unknown-linux-gnueabihf]
image = "ghcr.io/servo/cross-armv7-unknown-linux-gnueabihf:main"
```
No riscv64 target is configured. No QEMU usage exists anywhere in the repository. There is no Dockerfile of any kind (no `docker/`, no `.ci/docker/`, no `Dockerfile.riscv64`).

**Known build failures for riscv64:** none documented, because no riscv64 build has ever been attempted in this project's CI or release process.

Source: direct file reads of `Cargo.toml`, `Cargo.lock`, `Cross.toml`, `build.sh`, `build-single-threaded.sh`, and both workflow files from a local clone of [wasmerio/winterjs](https://github.com/wasmerio/winterjs) (commit `fece1bb64f9d0fd8e50ea9ff7171491fd55c397e`).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native build | yes (CI-verified) | yes (CI-verified) | no build target configured at all |
| WASIX/WASM artifact execution | via Wasmer runtime | via Wasmer runtime | unverified - depends on Wasmer runtime's own riscv64 support, not established by this research |
| Official release | no (WASM artifact only, published to Wasmer registry, not per-arch) | same | none |

**Performance:** the only published WinterJS performance figures come from Wasmer's own blog posts ([WinterJS v1.0 announcement](https://wasmer.io/posts/winterjs-v1), [WinterJS vs. alternatives](https://wasmer.io/posts/winterjs-vs-alternatives-is-blazing-fast)): WinterJS native ~150,000 req/s, WinterJS compiled to WASIX ~20,000 req/s, Bun (comparison baseline) ~117,000 req/s. These figures carry no disclosed hardware, OS, or methodology detail in what is fetchable, and are not broken out by architecture at all - there is no amd64-vs-arm64-vs-riscv64 comparison, so a riscv64 performance delta cannot be computed. Data not available: any riscv64 performance measurement for WinterJS.

**Correctness / NaN and floating-point semantics:** no open or closed issue in `wasmerio/winterjs` mentions RISC-V, riscv64, or floating-point/NaN bugs tied to that architecture (confirmed via `search_issues` for multiple query variants, all zero results). This should be read as absence of testing, not as a clean bill of health - no riscv64 testing has ever occurred against which correctness could be confirmed.

**Security hardening gaps:** data not available - no riscv64-specific security research or hardening documentation was found for this project.

## 7. CI/CD Infrastructure

Confirmed by direct read of the only two CI workflow files in the repository (no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist):

- [`.github/workflows/build-and-test.yml`](https://github.com/wasmerio/winterjs/tree/main/.github/workflows) - triggers on `workflow_call`, `pull_request`, and `push` to `main`. Matrix has exactly four active entries: `ubuntu-latest` (x86 native), `macos-latest` (arm native), `macos-13` (x86 native), `ubuntu-latest` (wasix, targeting `wasm32-wasmer-wasi`). A fifth entry (macOS wasix) is present but commented out.
- `.github/workflows/release.yml` - triggers on `push` of `v*` tags; calls `build-and-test.yml`, then publishes the WASIX wasm artifact to the Wasmer registry.

No riscv64 job, no QEMU-based emulation, and no `linux/riscv64` platform target exist anywhere in either file. A full-repo case-insensitive grep for "riscv" across the entire working tree returned zero matches. No RISE RISC-V runner usage exists (no references to `riseproject-dev` or RISE runner labels anywhere in the CI configuration).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| RISE runner usage | no | no | no |
| Release-blocking gate | yes (both native jobs run on every PR) | yes | n/a - no job exists |

## 8. Distribution and Release Status

There are **no official riscv64 binaries for WinterJS**, and in fact no official binaries of any kind published through GitHub Releases for any architecture:

- **GitHub Releases:** [the repository's Releases page](https://github.com/wasmerio/winterjs/releases) shows "There aren't any releases here." Zero releases, zero release assets, for any architecture.
- **PyPI:** [`https://pypi.org/pypi/winterjs/json`](https://pypi.org/pypi/winterjs/json) returns HTTP 404 - no such PyPI project exists.
- **RISE Python wheel builder:** [the GitLab PyPI proxy query](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/winterjs/) 302-redirects to the same 404ing `pypi.org/simple/winterjs/` URL - no package present.
- **Ubuntu 26.04 (Resolute):** [package search](https://packages.ubuntu.com/search?keywords=WinterJS&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no `winterjs`, `python3-winterjs`, or `libwinterjs` package in any architecture.
- **Arch Linux RISC-V port:** [archriscv.felixc.at query](https://archriscv.felixc.at/?q=winterjs) shows no match for "winterjs".
- **RISE wheel builder page:** [the 79-package supported list](https://riseproject.gitlab.io/python/wheel_builder/) does not include WinterJS or any JS runtime.

The only distribution channel that ever existed while the project was active was the Wasmer registry itself (the WASIX wasm artifact published via `release.yml`), reachable through the Wasmer CLI/platform - not a GitHub release, not a distro package, and not independently verified here for riscv64-host executability, since that depends on the separate Wasmer runtime project.

**What a user must do to get a working binary today:** clone the archived repository at its last commit and build from source. For a native amd64/arm64 host, this is the `cargo build --profile release-compact` path documented in Section 5. There is no path today to a native riscv64 binary - no build target is configured, no CI has ever exercised one, and no distribution channel carries one. Whether the WASIX wasm artifact executes correctly under a riscv64-hosted Wasmer runtime is unverified; that question sits outside this repository and outside the scope of what could be confirmed in this research (data not available: riscv64 support status of the Wasmer runtime itself).

## 9. Dependencies

**Method note:** WinterJS is a Rust/Cargo project; `Cargo.toml`/`Cargo.lock` are the manifest of record (no CMakeLists/setup.py/go.mod). GitHub API access in this session was scoped to `riseproject-dev/sw-ecosystem` only, so upstream dependency issue-tracker checks used WebSearch/WebFetch rather than direct `search_issues` calls against each dependency's own repository - noted per-row below where that substitution applies.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| **SpiderMonkey** (critical, build) | JS engine / JIT that WinterJS embeds, via `mozjs`/`mozjs_sys` crates (`wasmerio/mozjs`, `wasi-gecko` branch, v0.14.1/0.68.2) | Upstream mainline SpiderMonkey has a riscv64 JIT (Baseline + Ion/Warp + Wasm baseline), full since Firefox 111, default-on since Firefox 143 [NEEDS VERIFICATION - sourced from a prior project report, `spidermonkey.md`, not independently re-verified in this session]. The `wasi-gecko` fork WinterJS actually consumes is purpose-built to cross-compile to `wasm32-wasi` and is not exercised as a native riscv64 host build in any CI found | not applicable to WinterJS's WASM-only build target; upstream mainline SpiderMonkey riscv64 has no Mozilla Taskcluster CI [NEEDS VERIFICATION] | `libmozjs-*` packages reportedly present for riscv64 in Debian trixie/sid and Ubuntu 25.10/26.04 per a prior report [NEEDS VERIFICATION]; the `wasmerio/mozjs` fork specifically is not packaged anywhere | Fork's native-riscv64 buildability is unverified; upstream Wasm SIMD has a hard compile-time block on riscv64 per the prior report, relevant only if WinterJS ever executes Wasm-SIMD-using JS on a riscv64-hosted Wasmer runtime |
| **Rust** (critical, build) | Toolchain - native build pinned to **1.76** via `dtolnay/rust-toolchain@master`; WASIX build uses the separate `wasix-org/rust` toolchain | Rust's own riscv64gc-unknown-linux-gnu target is a standard rustc tier; specific 1.76-era riscv64 status not independently checked in this research | n/a | n/a | Data not available: whether rustc 1.76 specifically (rather than a later release) has any riscv64-relevant regressions |
| **Wasmer** (critical, runtime) | The WASM host runtime that executes WinterJS's WASIX artifact at deployment time; not a Cargo dependency of this repository, a separate project | Data not available - out of scope of this manifest-based analysis; not independently verified in this research | Data not available | Data not available | This is the single most consequential unresolved dependency for riscv64 readiness: WinterJS's own portability story runs entirely through this runtime, and its riscv64 status was not established |
| **WASIX** (critical, build) | The `wasix-org` toolchain/libc sysroot (`wasix-libc`) that enables the `wasm32-wasmer-wasi` build target | Data not available - no riscv64-specific research performed on the WASIX toolchain itself in this session | Data not available | Data not available | Out of scope of the direct GitHub search performed against `wasmerio/winterjs`; would require separate research against `wasix-org` repositories |
| **libc (Rust crate)** (optional, build) | Standard Rust `libc` FFI bindings crate, a transitive/optional build dependency | Data not available - no riscv64-specific findings were produced for this crate in the research gathered | Data not available | Data not available | No blocking issues found, but none were specifically searched for either |
| ring (indirect, via rustls) | Cryptography (AEAD, ECDH, signatures) backing TLS in the fetch/HTTPS stack; WinterJS pins the `wasix-org/ring` fork | Upstream `briansmith/ring` builds on riscv64 via its portable-C fallback (no riscv64 asm kernels) per older reports, but with regressions reported against newer 0.17.x lines | Historical reports of undefined-reference link errors on `cargo test` for riscv64gc | Source crate only, no prebuilt binaries; not packaged standalone in Debian/Ubuntu | [briansmith/ring#2022 "Add riscv64 Support"](https://github.com/briansmith/ring/issues/2022) closed as duplicate, underlying regression status on 0.17.x unconfirmed; [briansmith/ring#1430](https://github.com/briansmith/ring/issues/1430) unresolved riscv64 link errors; the `wasix-org` fork WinterJS actually pins has no separate riscv64 tracking found |
| rustls (indirect) | TLS orchestration (`wasix-org/rustls` v0.22.2) | n/a - pure Rust, gated entirely by `ring`'s riscv64 status above | n/a | n/a | Inherits `ring`'s riscv64 status; no rustls-specific riscv64 issues found |
| tikv-jemalloc-sys / tikv-jemallocator (indirect, via `static-web-server`) | Memory allocator (v0.5.4, vendors jemalloc 5.3.0) | Vendored jemalloc predates the jemalloc `riscv64gc` triple-recognition fix [NEEDS VERIFICATION - dated to "March 2026" in the underlying research, not independently confirmed here]; cross-compiling to riscv64gc may hit an untriple-recognition failure absent a patch or version bump | Partial per a prior report on upstream jemalloc (libatomic-backed sub-word atomics, no CI on riscv64) [NEEDS VERIFICATION] | Debian sid reportedly ships `rust-tikv-jemalloc-sys` for riscv64 [NEEDS VERIFICATION]; Ubuntu 26.04 availability not confirmed | A version bump past the vendored jemalloc 5.3.0 likely resolves the build-triple issue |
| brotli / brotli-decompressor (indirect) | Compression, pure-Rust reimplementation (v3.4.0, not the `google/brotli` C library) | Pure Rust, no C/asm - builds on any Rust tier-2 target including riscv64gc | No riscv64-specific issues found | crates.io source only | None found; distinct from the C `google/brotli` library covered elsewhere |
| flate2 / miniz_oxide / crc32fast (indirect) | Compression (gzip/deflate) | Configured with the default pure-Rust `miniz_oxide` backend (no system zlib feature in the lockfile) - portable to riscv64gc | `crc32fast` has SIMD dispatch for x86/aarch64 with a portable scalar fallback elsewhere; riscv64 unaffected | crates.io source only | None found |
| num-bigint / num-integer / num-traits (indirect) | Numerics (transitive) | Pure Rust, no architecture-specific code paths | No riscv64-specific issues found | crates.io source only | None found - lowest-risk dependency in the graph |

**Highest-risk dependency:** SpiderMonkey/`mozjs`, not because mainline SpiderMonkey lacks riscv64 support but because WinterJS consumes a Wasmer-specific `wasi-gecko` fork built only for `wasm32-wasi`, whose native-riscv64 buildability has no independent verification.

**Second-highest risk:** `ring` (crypto) - documented upstream build/link regressions specifically on riscv64 in the 0.17.x line, compounded by a further unwatched fork.

**Structural point that outranks all dependency-level findings:** none of this dependency analysis changes WinterJS's own riscv64 readiness, because the project has no riscv64 build target at all (absent from `Cross.toml` and CI) and the repository is now archived and read-only.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue, PR, or commit exists | n/a | n/a | Confirmed via GitHub API `search_issues`, `search_pull_requests`, `search_code`, `search_commits` scoped to `wasmerio/winterjs`, each returning `total_count: 0` |

No correctness bugs, performance regressions, or NaN/floating-point issues tied to riscv64 have ever been filed against this project. As noted in Section 6, this is best read as absence of testing rather than confirmed correctness.

## 12. Objections and Upstream Blockers

**Stated objections:** none - no riscv64 request has ever been raised in this repository, so no objection has ever needed to be voiced.

**Technical blockers:** no riscv64 build target is configured (`Cross.toml`, CI matrix); the Wasmer runtime's own riscv64 status - the actual gating factor for whether WinterJS's WASIX artifact would run on riscv64 hardware at all - is unverified and out of scope of this repository.

**Organizational blocker (decisive):** the repository was archived on 2026-03-17 and is read-only. No new pull requests can be merged regardless of technical merit. This is a hard, permanent blocker to any future upstream riscv64 enablement work in `wasmerio/winterjs` specifically.

**Acceptance probability:** effectively zero through this upstream repository, since it can no longer accept contributions. Any riscv64 path forward would require either a community fork of the archived code, or redirecting effort toward Wasmer's stated successor runtime, "Edge.js" [NEEDS VERIFICATION - referenced only in WinterJS's own README as the deprecation target; Edge.js's own repository, governance, and riscv64 status were not researched in this session].

## 13. Readiness Assessment

- **Color:** orange (base Step-1 "no upstream CI" case - neither of the standard orange sub-types (`downstream-only`, `optimization-absent`) applies cleanly, since no distribution channel ships WinterJS at all, patched or otherwise, and WinterJS is not an optimization-purpose project)
- **Release provider:** none - zero releases exist through GitHub for any architecture, and no distro, RISE, or third-party channel packages WinterJS in any form
- **Optimization level:** not applicable - WinterJS is a JS Service Workers runtime/server, not a project whose stated purpose is architecture-specific performance optimization. It embeds SpiderMonkey's JIT as a dependency, but WinterJS itself would still deliver its functional value (running JS service workers) with a purely generic build; the Step 2 optimization-purpose test therefore does not trigger, and this is not scored as an optimization gap.
- **Justification:** WinterJS's own CI (`build-and-test.yml`, `release.yml`) never builds or tests a riscv64 target - confirmed by direct reading of [both workflow files](https://github.com/wasmerio/winterjs/tree/main/.github/workflows), which cover only `ubuntu-latest`/`macos-latest`/`macos-13` native jobs plus a `wasm32-wasmer-wasi` WASIX job. No riscv64 GitHub issue, PR, commit, or code reference exists anywhere in the repository (`search_issues`/`search_pull_requests`/`search_code`/`search_commits`, all `total_count: 0`). No distribution channel - PyPI, Ubuntu 26.04, Arch Linux RISC-V, or the RISE wheel builder - carries a WinterJS package of any kind, riscv64 or otherwise, and [the repository's Releases page](https://github.com/wasmerio/winterjs/releases) confirms zero releases have ever been published for any architecture. This places WinterJS squarely in Step 1's "no upstream CI" row: no build, no test, no release, and no distribution floor available to upgrade it, yielding orange.
- **Pending work that could change the grade:** none identified. WinterJS sits only as an unevaluated entry in `riseproject-dev/sw-ecosystem`'s internal report queue ([`.queue.yml`](https://github.com/wasmerio/winterjs)) - no RISE blog coverage, no RISE runner usage, no funded work, and no RISE membership by either WinterJS or its parent company Wasmer (confirmed against [riseproject.dev's member list](https://riseproject.dev/members/)). The repository's archival on 2026-03-17 means the grade cannot improve through this repository going forward; any change would have to originate from a fork or from Wasmer's stated successor, Edge.js, which was not researched here.

## 14. Investment Analysis

**RISE prior work check:** confirmed via the `riseproject-dev/sw-ecosystem` queue file, the RISE blog (all ~35 post titles scanned), the RISE wheel builder package list, and the `riseproject-dev` GitHub org (repo search and org-wide code search) that RISE has done or funded **nothing** for WinterJS - it is an unevaluated queue entry only. There is therefore no prior RISE investment to net out of any of the estimates below.

### 14.1 Functional Enablement

Not recommended against this repository. The repository is archived and read-only - no functional enablement PR could be merged upstream today under any circumstances, regardless of engineering effort. A meaningful investment decision requires first choosing between: (a) maintaining a community fork of the last commit (`fece1bb`) to add a riscv64 build target, or (b) redirecting effort to Wasmer's stated successor, Edge.js, whose repository and riscv64 status were not researched in this session [NEEDS VERIFICATION]. Sizing functional-enablement work against the archived repository itself would be sizing work that cannot be delivered upstream.

### 14.2 Performance Optimization

Not meaningful to size. WinterJS carries no architecture-specific code for any architecture by design (Section 4) - its performance characteristics on any host are a function of the embedded SpiderMonkey engine and the Wasmer runtime, both separate projects outside this repository's own optimization surface.

### 14.3 CI/CD Infrastructure

Not actionable against the archived repository - no new CI configuration can be merged into a read-only repo. If a fork were pursued, adding a riscv64 job (native `cargo build`/`cargo test` on a riscv64 runner) would follow the same pattern already used for the existing `aarch64`/`armv7` cross-compilation entries in `Cross.toml`, but this is contingent on the fork-vs-Edge.js decision in 14.1.

### 14.4 Ecosystem Enablement

Not applicable - WinterJS has no dependent package ecosystem (no PyPI/npm/Maven consumers that need separate riscv64 enablement); Section 10 is omitted per the reporting rules for standalone runtimes with no dependent ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Strategic decision | Determine whether to fork the archived WinterJS repository or redirect evaluation to Wasmer's Edge.js successor runtime | 1 (research/decision only) | Engineering leadership | Critical (blocks all other rows) |
| Functional | If forking: add a native `riscv64gc-unknown-linux-gnu` build target to `Cross.toml` and CI, and verify the `wasi-gecko` SpiderMonkey fork and `wasix-org/ring` build on riscv64 | Data not available - not sized pending the 14.1 strategic decision | Unassigned | Low (contingent, not recommended without the decision above) |
| CI/CD | If forking: add a riscv64 CI job mirroring the existing aarch64/armv7 cross-compilation pattern | Data not available - contingent on functional enablement above | Unassigned | Low |
| Runtime verification | Independently verify the Wasmer host runtime's own riscv64 support (out of scope of this repository, but the actual gating factor for WinterJS's deployability on riscv64 hardware) | Data not available - separate research effort against the Wasmer runtime project | Unassigned | Medium (informs whether any of the above has value at all) |

## 15. Updates

No updates yet - initial report dated 2026-09-10.

## 16. References

- [wasmerio/winterjs (repository)](https://github.com/wasmerio/winterjs)
- [wasmerio/winterjs releases page](https://github.com/wasmerio/winterjs/releases)
- [wasmerio/winterjs CI workflows](https://github.com/wasmerio/winterjs/tree/main/.github/workflows)
- [wasmerio/winterjs benchmark harness](https://github.com/wasmerio/winterjs/tree/main/benchmark)
- [PyPI JSON API for "winterjs" (404, package does not exist)](https://pypi.org/pypi/winterjs/json)
- [RISE GitLab PyPI wheel-builder proxy for "winterjs" (redirects to 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/winterjs/)
- [RISE Python wheel builder supported-package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 (Resolute) package search for "WinterJS" (no results)](https://packages.ubuntu.com/search?keywords=WinterJS&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search for "winterjs" (no match)](https://archriscv.felixc.at/?q=winterjs)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members list](https://riseproject.dev/members/)
- [riseproject-dev/sw-ecosystem project-report queue, listing WinterJS as unevaluated](https://github.com/wasmerio/winterjs)
- [Wasmer blog: WinterJS v1.0 announcement](https://wasmer.io/posts/winterjs-v1)
- [Wasmer blog: WinterJS vs. alternatives performance comparison](https://wasmer.io/posts/winterjs-vs-alternatives-is-blazing-fast)
- [briansmith/ring issue #2022 "Add riscv64 Support"](https://github.com/briansmith/ring/issues/2022)
- [briansmith/ring issue #1430 (riscv64 link errors)](https://github.com/briansmith/ring/issues/1430)
- Local clone of `wasmerio/winterjs` at commit `fece1bb64f9d0fd8e50ea9ff7171491fd55c397e`, used for direct file reads of `Cargo.toml`, `Cargo.lock`, `Cross.toml`, `build.sh`, `build-single-threaded.sh`, and both CI workflow files
- Prior project reports referenced for dependency context (not independently re-verified in this session): `project-reports/spidermonkey.md`, `project-reports/jemalloc.md`, `project-reports/brotli.md`, `project-reports/zlib.md`
