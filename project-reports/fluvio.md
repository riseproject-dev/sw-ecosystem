---
title: Fluvio
parent: Project Reports
color: orange
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: Wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: musl
    relation: build-dependency
    criticality: critical
---

# Fluvio

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Fluvio<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="fluvio" %}

## 1. Project Overview

Fluvio is a Rust-based distributed streaming/messaging platform (a Kafka-alternative) with a WebAssembly-based "SmartModule" extension system for inline data transformation (filter/map/aggregate), executed via the Wasmtime/Cranelift JIT. The project is developed as `infinyon/fluvio` on GitHub; that repository identifier is no longer resolvable through the GitHub Search API (`422 resource does not exist or no permission`), but direct git clone confirms the remote is genuinely `infinyon/fluvio` (HEAD `52673942c1c7364f36f2e05da972436f761243c`). A separate GitHub org, `fluvio-community/fluvio`, hosts an active fork/mirror that appears to be assuming CI and release responsibilities; the project's own `README.md` states it is "transitioning to a new **fluvio-community** hosted fluvio build and release," and the `ghcr.io/fluvio-community/fluvio` Docker namespace is already used inside the project's own workflows.

**Governance:** Fluvio is a corporate open-source project owned by **InfinyOn, Inc.** (Santa Clara, CA) - not a neutral foundation project (not CNCF/Linux Foundation/Apache Foundation). License is Apache 2.0. No `MAINTAINERS`, `GOVERNANCE`, `OWNERS`, `CODEOWNERS`, or `PLATFORMS.md` file exists in the repository; the release process is still routed through an "Infinyon Slack `#dev` channel" per `RELEASE.md`.

**Corporate sponsor / top contributors** (by all-time commit count):

| Contributor | Affiliation | Commits |
|---|---|---|
| Sehyo Chang | InfinyOn founder/CEO (sehyo@fluvio.io) | 702 |
| Nick Mosher | personal email | 303 |
| Felipe Cardozo | personal email | 186 |
| T.J. Telan | personal email | 180 |
| Esteban Borai | personal email | 172 |
| Alan Chen | personal email | 159 |
| Luis Moreno (morenol) | personal email | 97+62+53 |
| Alexander Galibey | InfinyOn (alexander.galibey@infinyon.com) | 92+35 |

Only two contributors commit under an `@infinyon.com`/`@fluvio.io` address, confirming direct InfinyOn-employee identity for those two; the rest use personal emails.

**Governance trend - corporate to community handoff:** In the last 6 months of commit history, activity is dominated by `dependabot[bot]` and one community contributor (Luis Moreno); no `@infinyon.com`-addressed commits appear in that window. This is consistent with the stated transition to `fluvio-community`, i.e. a real drift away from direct corporate engineering commitment even though InfinyOn remains the nominal owner and copyright holder.

**Community culture on new ports:** `CONTRIBUTING.md` states, unchanged in spirit since project start: "Currently, fluvio supports the following platforms: macOS X, Linux. Other platforms such as Windows can be made to work, but we haven't tried them yet." There is no mention of RISC-V and no documented process for proposing a new architecture target - the stance toward a riscv64 port is "unaddressed/untried," not an explicit refusal.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-10-30 | Installer commit `2bcbec99` ("Add bootstrapping install script for Linux/Mac installation," PR #436) adds generic `uname -m` architecture-detection scaffolding, including a `riscv64` case, to `install.sh`. This is copied rustup-style boilerplate, not a build target. | [install.sh](https://github.com/infinyon/fluvio/blob/52673942c1c7364f36f2e05da972436f761243c/install.sh) |
| N/A | No commit in Fluvio's full history (2,574 commits, searched via `git log -S"riscv"` and full message grep) adds actual riscv64 build, test, or release support. | Direct clone `git log` search |
| N/A | No GitHub issue, pull request, or discussion thread proposing or tracking a riscv64 port exists (searched across both `infinyon/fluvio` and its current live identity `fluvio-community/fluvio`, using `riscv`, `riscv64`, and `risc-v`). | GitHub issue/PR/code search (multiple independent passes) |

**Key contributors to RISC-V work:** none - no RISC-V-specific commit, PR, or issue exists to attribute.

**Is it fully upstream?** Not applicable - there is no RISC-V port to be upstream or out-of-tree. The only "riscv64" code path in the repository is the installer's architecture-detection stanza, which explicitly rejects the case with `err "riscv64 with 32-bit userland unsupported"` rather than enabling installation.

## 3. Upstream Support Tier

**Formal tier policy:** None exists today. The only historical precedent for an explicit platform tier is informal changelog language: `CHANGELOG.md` "Platform Version 0.9.1 (2021-08-06): Add Apple M1 as **Tier2** platform for `fluvio-run`" - showing the project has used an ad hoc Tier1/Tier2 concept in the past but never published criteria or a promotion process. No tier of any kind has ever been assigned to riscv64.

**Evidence:**
- CI: no riscv64 job exists in any of the 17 GitHub Actions workflow files (`benchmarks.yml`, `cd_dev.yaml`, `cd_dev_mac.yaml`, `cd_release.yml`, `ci.yml`, `ci_mac.yaml`, `ci_unused_deps.yml`, `connector-publish.yml`, `hourly.yml`, `lint_pr.yml`, `merge_queue.yaml`, `publish.yml`, `publish_crates.yml`, `release.yml`, `smartmodule-publish.yml`, `stale.yml`, `weekly.yml`). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.
- Release-blocking: not applicable - there is no riscv64 job to be release-blocking or not.
- Official binaries: none for riscv64, on any release channel checked (see Section 8).

**Comparison table: amd64 vs arm64 vs riscv64**

| Architecture | CI build | CI test | Release binaries (all tools) | Source-level guard | Rating |
|---|---|---|---|---|---|
| x86_64 (amd64) | Yes, all 17 workflows | Yes | Yes - musl/darwin/windows | none needed | Full |
| aarch64 (arm64) | Yes | Yes | Yes - linux-musl, apple-darwin | none needed | Full |
| arm (32-bit v7) | Yes (limited) | Partial | Yes, but with SmartModule/Cranelift test features disabled via `cfg(not(target_arch="arm"))` | Yes, functionality-reducing gate | Partial (feature-reduced) |
| riscv64 | None - 0 hits in 17 workflow files | None | None - 0 riscv64 assets in any release (v0.17.x-v0.18.1 checked) | None (only an installer error path) | Missing |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Fluvio is a pure-Rust distributed streaming platform. It has no SIMD/codec/crypto hot loops of its own requiring hand-tuned per-architecture code; its only `cfg(target_arch = ...)` conditionals in the codebase gate `wasm32` (browser/WASM builds) and `arm` (32-bit, because the Wasmtime/Cranelift JIT used by SmartModules is unavailable there, so `smartmodule-test` features are compiled out via `cfg(not(target_arch = "arm"))`). Neither `x86_64`, `aarch64`, nor `riscv64` ever appears in a `cfg(target_arch = ...)` guard in Fluvio's own source - they are build targets, not conditionally-compiled code branches.

The one architecture-relevant subsystem is the **SmartModule WASM JIT**, provided entirely by the third-party **Wasmtime** dependency (see Section 9 for its own riscv64 status). Fluvio's own code contains no JIT backend, no assembly, no GC barriers, and no crypto primitives of its own.

**Comparison table per component: amd64 vs arm64 vs riscv64**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SmartModule JIT (Wasmtime/Cranelift, third-party dep) | Full hand-tuned backend, Tier 1 upstream | Full hand-tuned backend, Tier 2 upstream | Full hand-tuned Cranelift backend exists upstream (~22,300 lines), Tier 3, but never exercised in Fluvio's own CI/release pipeline since none exists |
| Core Fluvio business logic (Rust) | Native | Native | Compiles generically (pure Rust, no arch-specific code), but never built or tested by any Fluvio CI/release job |
| Installer architecture detection | Maps to `x86_64-unknown-linux-musl` | Maps to `aarch64-unknown-linux-musl` | Maps `riscv64` -> `riscv64gc`, then explicitly errors: `err "riscv64 with 32-bit userland unsupported"` |

**Conclusion:** There is no riscv64 implementation to grade as full/partial/scalar at the Fluvio-source level - it does not exist at the source, build, CI, or release level. The only artifact is an installer script line whose entire function is to print an error and exit; it never reaches a compiled Fluvio binary.

## 5. Build System, Cross-Compilation, and Toolchain

Fluvio is a pure Rust/Cargo project (`Cargo.toml`, `rust-toolchain.toml`, `Makefile` wrapping `cargo`). There is no CMakeLists.txt, no `*.cmake` file, and no CMake anywhere in the repository (verified via repo-wide search, zero matches).

**No riscv64 build/cross-compilation documentation exists:**
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` in the repo.
- `README.md` and `DEVELOPER.md` document only these cross-compilation targets:
  ```bash
  rustup target add x86_64-unknown-linux-musl      # x86/64
  rustup target add aarch64-unknown-linux-musl     # Apple Silicon
  make build-cli build_k8_image
  ```
- No `riscv64gc-unknown-linux-gnu`/`musl` Rust target is added, tested, or built anywhere (checked `.github/workflows/*.yml`, `Makefile`, `makefiles/`, `build-scripts/`, `Cargo.toml`).

**Dockerfiles found** (none riscv64-specific): `k8-util/docker/fluvio.Dockerfile`, `connector/docker/Dockerfile`, `examples/docker-compose/Dockerfile`, `dev-tools/smartmodule.Dockerfile`. No `Dockerfile.riscv64` and no `.ci/docker/` riscv-specific files exist.

**QEMU usage:** none documented or referenced anywhere in the repository (zero matches for "qemu").

**Known build failures:** none documented, because riscv64 has never been attempted in any CI job - there is no build log to fail.

**Toolchain requirement for a hypothetical riscv64 build:** would require, at minimum, adding a `riscv64gc-unknown-linux-musl` (or `-gnu`) target to `rustup`, plus resolving whatever riscv64 issues exist in the dependency tree (Section 9) - none of which has been attempted upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core broker/client functionality | Full | Full | Not buildable via any documented/CI path |
| SmartModule (WASM JIT) execution | Full | Full | Not exercised (would depend on upstream Wasmtime's Tier 3 riscv64 backend, itself carrying 8 open correctness bugs - see Section 9) |
| CLI tools (cdk, fvm, smdk, run, test, benchmark) | Full, released | Full, released | Not released, not built |
| Helm charts / Kubernetes deployment | Full | Full | No riscv64 container image published |
| Installer (`install.sh`) | Functional | Functional | Explicitly errors: `err "riscv64 with 32-bit userland unsupported"` |

**Functional gaps:** total - a riscv64 user cannot install Fluvio through any official channel (installer script, GitHub Release binary, PyPI wheel, or Linux distribution package).

**Performance gaps:** not measurable - no riscv64 build exists to benchmark. No official Fluvio benchmark (the InfinyOn Kafka-vs-Fluvio comparison, [infinyon.com/blog/2025/02/kafka-vs-fluvio-bench](https://infinyon.com/blog/2025/02/kafka-vs-fluvio-bench/)) tests any architecture other than Apple M1 Max and AWS Graviton3 (both ARM64); RISC-V is not mentioned in that post.

**Security hardening gaps:** not directly assessable for Fluvio itself (no riscv64 build exists to audit), but the transitive dependency chain carries a specific, documented gap: the default TLS backend (`openssl`/`native-tls`, via `fluvio-future`) has a non-constant-time AES fallback on riscv64 hardware lacking Zkn/Zvkned extensions (see Section 9).

**NaN / floating-point semantics issues:** none found or reported - not applicable, since no riscv64 build of Fluvio has ever been produced to surface such an issue.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for Fluvio.** Verified by direct clone and full-text grep of the repository (not just GitHub's search API, which is unreliable for this repo identifier) - HEAD `52673942c1c7364f36f2e05da972436f761243c`.

**Repo-wide search for "riscv" (case-insensitive):** exactly 2 files match, both shell installer scripts (`install.sh`, `crates/fluvio-version-manager/tests/install-fvm.sh`), neither is CI configuration.

**`.github/` directory (workflows + actions), grepped in full:** zero matches for `riscv`/`risc-v`/`risc_v`. Confirmed by reading the actual build-target matrices in all 17 workflow files:

| Workflow | Rust target matrix values found |
|---|---|
| `ci.yml` (3 matrices) | `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl` |
| `merge_queue.yaml` (build/docker) | `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl` |
| `merge_queue.yaml` (release matrix) | `aarch64-unknown-linux-musl`, `aarch64-apple-darwin`, `armv7-unknown-linux-gnueabihf`, `arm-unknown-linux-gnueabihf`, `x86_64-apple-darwin`, `x86_64-unknown-linux-musl` |
| `hourly.yml` | `x86_64-unknown-linux-musl` (job disabled: `if: ${{ false }}`) |
| `ci_mac.yaml` | `x86_64-apple-darwin`, `x86_64-unknown-linux-musl` |
| `connector-publish.yml` | `aarch64-unknown-linux-musl`, `aarch64-unknown-linux-gnu`, `x86_64-unknown-linux-musl`, `x86_64-unknown-linux-gnu` |

No other CI system exists: no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, Buildkite config, or Earthfile anywhere in the tree.

**RISE runners:** not used - Fluvio has no RISE Project involvement of any kind (see Section 1 and Section 12).

**Trigger/runner/QEMU:** moot - since no matrix entry, step, job condition, or label anywhere references riscv64, there is nothing to characterize for trigger type, runner type, or QEMU usage.

**Comparison table: amd64 vs arm64 vs riscv64**

| Architecture | CI build | CI test | CI release | Runner type |
|---|---|---|---|---|
| x86_64 | Yes | Yes | Yes | Standard GitHub-hosted |
| aarch64 | Yes | Yes | Yes | Standard GitHub-hosted (cross-compile) |
| armv7/arm | Yes (limited) | Partial | Yes | Standard GitHub-hosted (cross-compile) |
| riscv64 | No | No | No | N/A - no job exists |

## 8. Distribution and Release Status

**Official binaries:** none for riscv64 on any channel checked.

- **GitHub Releases** (`infinyon/fluvio`, redirects to `fluvio-community/fluvio` asset hosting): full asset list for v0.18.1 (43 assets - cdk, fluvio core, fluvio-benchmark, fluvio-channel, fluvio-run, fluvio-test, fvm, smdk, helm charts) covers `aarch64-apple-darwin`, `aarch64-unknown-linux-musl`, `arm-unknown-linux-gnueabihf`, `armv7-unknown-linux-gnueabihf`, `x86_64-apple-darwin`, `x86_64-unknown-linux-musl`, `x86_64-pc-windows-gnu`/`msvc`. Zero asset filenames contain "riscv64" or "riscv," confirmed for v0.18.1, v0.18.0, v0.17.3, and v0.17.2.
- **PyPI** (`https://pypi.org/pypi/fluvio/json`): package `fluvio` exists; full `urls[]` list checked across all versions 0.0.1 through 0.18.x. Wheel platform tags present: `macosx_10_9_x86_64`, `macosx_10_9_universal2`, `manylinux_2_17_x86_64`/`manylinux2014_x86_64`, `manylinux2010_x86_64`, `manylinux2010_i686`, `linux_armv6l`, `linux_armv7l`. **No riscv64 wheel exists.**
- **RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/fluvio/`): returns a 302 redirect straight to `pypi.org/simple/fluvio/` - RISE hosts no separate riscv64 wheel for Fluvio and simply points back to public PyPI, which itself has no riscv64 wheel.
- **Ubuntu 26.04 "resolute"** (`https://packages.ubuntu.com/search?keywords=Fluvio&suite=resolute&searchon=names&section=all`): "Sorry, your search gave no results." No `fluvio`, `python3-fluvio`, or `libfluvio` package exists in this suite, for any architecture.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no `fluvio` package found in the mirror listing.
- **OCI / container images:** no riscv64-tagged image identified; Dockerfiles present (`k8-util/docker/fluvio.Dockerfile` etc.) are not riscv64-specific and no riscv64 build step exists in any workflow to produce one.
- **npm, Maven:** not applicable - Fluvio does not distribute through these channels for its core artifacts.

**What a user must do to get a working binary on riscv64:** there is currently no path. The installer (`install.sh`) actively refuses to proceed on riscv64 (`err "riscv64 with 32-bit userland unsupported"`), no prebuilt binary exists on any release channel, and no distribution packages Fluvio at all (any architecture, in the suite checked). A user would need to build every workspace crate from source using an unverified, undocumented `riscv64gc-unknown-linux-*` Rust target and resolve whatever issues arise in the dependency chain (Section 9) without any upstream reference build to compare against.

## 9. Dependencies

Fluvio is a Rust workspace (root `Cargo.toml`, `[workspace.dependencies]`, version 0.50.2). No CMakeLists.txt/setup.py/go.mod exists.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **Rust** (build-dependency, critical) | Toolchain/compiler for the entire workspace | No riscv64-specific issue found blocking Fluvio's own use of the toolchain; Rust's riscv64gc Linux target maturity is tracked separately (RISE-funded Project RP004, "Support for a 64-bit RISC-V Linux port of Rust to Tier-1," [riseproject.dev](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)) | N/A to Fluvio directly - Fluvio never invokes the riscv64gc target in its own CI | N/A - no Fluvio release ever targets riscv64 | Toolchain-level readiness is improving industry-wide via RISE, but this has no bearing on Fluvio unless Fluvio itself adds a riscv64 CI target |
| **Wasmtime** (runtime-dependency, critical) 38.0.4 + wasi-common + wasmparser | JIT backend - `fluvio-smartengine` executes SmartModules (user filter/map/aggregate WASM) via Wasmtime's Cranelift JIT | Full hand-tuned Cranelift riscv64 backend exists upstream (~22,300 lines); builds via `cargo --target riscv64gc-unknown-linux-gnu` | Upstream QEMU CI runs the full test suite, but conditionally gated (path-filtered on PR, full on merge-queue/release) - Tier 3 | Upstream GitHub Releases ship an official `riscv64gc-linux` tarball; no Ubuntu package exists for Wasmtime at all (any architecture) | 8 open correctness bugs including an unaligned-atomic bus error (#5882), partial OOB writes (#7237), and vector-return ABI failure (#11050); the Winch baseline JIT has zero riscv64 code; Tier 3 status means no full-time maintainer and no fuzzing coverage. None of this is currently reachable from Fluvio since Fluvio has no riscv64 build/CI in which Wasmtime's riscv64 code path would ever execute |
| **musl** (build-dependency, critical) | C library target for Fluvio's static-linked release binaries (`x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`) | Data not available in this research pass: musl's own riscv64 build/test/CI status was not directly investigated; Fluvio's build system never references a `riscv64gc-unknown-linux-musl` target anywhere in `Makefile`, workflows, or documentation | Data not available: not investigated for riscv64 specifically in this pass | Data not available: no Fluvio release ever attempts a riscv64-musl target, so this has never been exercised | Fluvio's entire release strategy is built around musl static linking for portability; a riscv64 port would need a working `riscv64gc-unknown-linux-musl` Rust target, which is unverified/undocumented for this project |
| mimalloc 0.1.39 | Memory allocator - workspace default allocator for SPU/SC | Compiles via generic C fallback upstream; no CI validates it | No upstream riscv64 CI at all | No upstream riscv64 binary; Ubuntu ships v2.1.2 (two major versions behind) in `universe`; Debian sid has current 3.3.2 | TLS fast-path and atomic-yield fall back to slow generic paths (perf regression under contention); two open PRs (#1299 VA-detection, #1319 TLS/yield) unmerged for months; single-maintainer review bottleneck |
| openssl (openssl-sys, via `fluvio-future`'s default `native-tls`/openssl backend) | Crypto/TLS - Fluvio's default TLS stack for client/server connections | Upstream riscv port merged May 2022, actively extended (AES, GCM, SHA2, ChaCha20, RVV crypto extensions) | Upstream QEMU CI, conditionally gated extension matrix (13 configs); no native hardware runner | Debian sid/Ubuntu 24.04/Arch RISC-V all ship current riscv64 builds; upstream itself ships source-only (no prebuilt binaries, any architecture) | Critical open gap: AES T-table fallback is not constant-time on hardware lacking Zkn/Zvkned (a live side-channel risk on most deployed riscv64 silicon) - fix PRs #31080/#31082 open, unmerged; musl extension-detection broken (#28118); SSL test hangs at high parallelism (#22166, open since 2023) |
| rustls 0.23 (-> ring as default crypto provider, transitively via `ureq`'s `tls` feature used for Hub/package-index/version-manager downloads) | Crypto/TLS - secondary TLS path for CLI package/hub downloads | `ring`: Debian/Ubuntu package the pinned version for riscv64 | `ring` has no dedicated riscv64 CI or optimized asm path - runs the portable/generic C fallback | Both publish normally to crates.io; no dedicated riscv64 release artifacts (source-only, standard cargo) | `ring` has a recurring history of riscv64 build breakage across point releases: closed issues [briansmith/ring#2148](https://github.com/briansmith/ring/issues/2148), [#2468](https://github.com/briansmith/ring/issues/2468)/[#2520](https://github.com/briansmith/ring/issues/2520), and as recently as 2026-01 [#2745](https://github.com/briansmith/ring/issues/2745) ("Doesn't compile for riscv64a23-unknown-linux-gnu"); a community fork (`OkitaSan/ring@rv64gc-support`) exists |
| zstd 0.13 (feature `wasm`) | Compression - one of 4 `fluvio-compression` codecs, default-on | RVV vectorization merged upstream for several hot paths (copy16, sequence conversion); GCC>=14/Clang>=19 required for RVV intrinsics | Upstream QEMU CI (PR-triggered only on dev/release branches, not release-blocking) at vlen=128/256/512 | Debian sid + Ubuntu 24.04 ship current riscv64 builds; no upstream prebuilt binaries any architecture | 7+ open riscv64 perf PRs stalled on maintainer non-response for 2-6 months; no hand-written riscv64 assembly fast path exists |
| flate2 1.0.25 (gzip) | Compression codec | No dedicated riscv64 CI found; wraps miniz_oxide (pure Rust) or system zlib | No dedicated riscv64 CI found | Standard, ships everywhere via distro zlib packages | None found specific to riscv64 |
| lz4_flex 0.11.6 | Compression codec | Pure Rust, no arch-specific asm | No riscv64-specific issues found | Compiles/publishes normally on crates.io | None found - riscv64-agnostic pure-Rust reimplementation |
| snap 1.x (Snappy) | Compression codec | Pure Rust reimplementation, not a C-binding | Not investigated in depth (low risk) | Standard crates.io publish | None found |
| sha2 0.10 (RustCrypto) | Crypto hashing - content-addressing/checksums | Pure-Rust generic fallback compiles everywhere; no riscv64 assembly-accelerated path exists | Closed issue [RustCrypto/hashes#328](https://github.com/RustCrypto/hashes/issues/328), "sha2: performance issue on RISC-V" (2021, closed) | Standard crates.io publish | Performance-only gap, no correctness blocker |
| crc32c 0.6 (zowens/crc32c) | Checksum - protocol/storage record integrity | SSE4.2/ARM-CRC hardware fast paths, generic table-based software fallback for riscv64 and other architectures | No riscv64 issues found in the crate's repo | Standard crates.io publish, no known riscv64 blockers | None found |
| rayon 1.10 | Data-parallelism (benchmark/CLI tooling, not core hot path) | Architecture-agnostic (built on `std::thread` + work-stealing) | No riscv64 issues found | Standard crates.io publish | Lowest-risk dependency in the set |

**Summary:** The dependencies that carry real riscv64 risk if Fluvio were ever to add a riscv64 build are Wasmtime (Tier 3 upstream, 8 open correctness bugs, but CI/tests/release binaries genuinely exist), mimalloc (no upstream riscv64 CI, unmerged fixes), and the `ring` crypto backend (multi-year history of riscv64 build breakage). The default `openssl` TLS backend carries one critical unresolved item - non-constant-time AES on hardware without Zkn/Zvkned. All of this is presently moot for Fluvio itself, since Fluvio has no riscv64 CI, build target, or release process in which any of these dependency-level capabilities or gaps would ever be exercised.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issue, PR, or commit exists for Fluvio itself | N/A | N/A | Confirmed by exhaustive search (issues, PRs, commits, code) across both `infinyon/fluvio` and its current live identity `fluvio-community/fluvio` for "riscv", "riscv64", "risc-v" - zero genuine results. The only matches are false positives: issue #1082 ("Full support for 64-bit ARM," closed 2021-07-20) is about ARM64, not RISC-V; four dependabot PRs (#3268, #3269, #2953, #2952, wasmtime/wasmtime-wasi version bumps, all closed unmerged/merged 2023) and one tokio bump PR (#3593) matched only because their auto-generated changelog bodies quote upstream Wasmtime/Tokio commits mentioning "riscv64" |
| wasmtime-bytecodealliance/wasmtime#5882 | Unaligned-atomic bus error on riscv64 | Open | Correctness | Upstream Wasmtime dependency issue, not a Fluvio issue directly - relevant only if/when Fluvio adds a riscv64 build |
| wasmtime-bytecodealliance/wasmtime#7237 | Partial OOB writes on riscv64 | Open | Correctness | Same as above |
| wasmtime-bytecodealliance/wasmtime#11050 | Vector-return ABI failure on riscv64 | Open | Correctness | Same as above |
| openssl/openssl#31080, #31082 | AES T-table fallback not constant-time on hardware lacking Zkn/Zvkned | Open, unmerged | Security | Live side-channel risk on most deployed riscv64 silicon; relevant only if/when Fluvio ships a riscv64 build using the default openssl TLS backend |
| briansmith/ring#2745 | ring doesn't compile for riscv64a23-unknown-linux-gnu | Open (as of 2026-01) | Build-blocking | Part of the `rustls`/`ring` transitive chain used for CLI hub downloads |

**Correctness bugs highlighted separately:** all correctness-severity items above belong to the Wasmtime dependency, not to Fluvio's own code, and none is currently reachable in practice because Fluvio has never built or tested against riscv64.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer, issue, or discussion thread contains an explicit objection to a riscv64 port. The absence of support is a byproduct of no one having attempted it, not a stated refusal.

**Technical blockers:**
- No riscv64 Rust target is added, tested, or built anywhere in the project's build system or CI.
- The dependency chain includes at least one component (`ring`, via `rustls`) with a documented multi-year history of riscv64 build breakage across releases (most recently [briansmith/ring#2745](https://github.com/briansmith/ring/issues/2745), 2026-01).
- The default TLS backend (`openssl`) carries an open, unresolved constant-time AES gap on riscv64 hardware without Zkn/Zvkned.
- The SmartModule JIT dependency (Wasmtime) is Tier 3 upstream on riscv64, with 8 open correctness bugs and no dedicated maintainer for that backend.

**Organizational blockers:**
- Fluvio's release process is gated through an internal InfinyOn Slack channel (`RELEASE.md`), not a public/automated pipeline, adding friction to any external contribution proposing a new platform target.
- The project is mid-transition from corporate (`infinyon`) to community (`fluvio-community`) ownership, with recent commit activity dominated by `dependabot[bot]` and a single community contributor - reducing the likelihood of proactive new-architecture investment from the current maintainer base.
- No RISE Project membership or funded engagement exists for Fluvio or InfinyOn (absent from RISE's Premier and General member lists; zero RISE blog posts, repositories, or wheel-builder entries reference Fluvio) - so no external RISC-V ecosystem funding is currently directed at this project.

**Acceptance probability:** Data not available to quantify - no proposal has ever been made, so there is no track record of the project's response to a riscv64 port request. Given the informal, untried stance in `CONTRIBUTING.md` ("Other platforms such as Windows can be made to work, but we haven't tried them yet") and the project's ongoing corporate-to-community governance transition, a well-formed external contribution (functional port plus CI) appears plausible in principle but has no precedent to confirm it would be merged or maintained long-term.

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI, no distribution package" case)
- **Release provider:** none
- Optimization level: not applicable - Fluvio is a general-purpose distributed streaming platform/application runtime, not a RISC-V performance-optimization library. It has no SIMD/codec/crypto hot-path kernels of its own whose value proposition depends on architecture-specific tuning; Step 2 of the color model does not apply.
- **Justification:** No upstream riscv64 CI exists in any of Fluvio's 17 GitHub Actions workflow files (build matrices cover only x86_64/aarch64/armv7/arm variants - see [infinyon/fluvio/.github/workflows](https://github.com/infinyon/fluvio/tree/master/.github/workflows)); no riscv64 release asset exists on GitHub Releases or PyPI; and no Linux distribution packages Fluvio for riscv64 (Ubuntu 26.04 "resolute" does not package Fluvio at all, on any architecture, so the distribution floor cannot even be applied). The only two "riscv64" occurrences in the entire codebase are in `install.sh`'s architecture-detection stanza, which explicitly errors out (`err "riscv64 with 32-bit userland unsupported"`) rather than enabling a build path - see [install.sh](https://github.com/infinyon/fluvio/blob/52673942c1c7364f36f2e05da972436f761243c/install.sh).
- **Pending work that could change the grade:** none identified. There is no open tracking issue, pull request, or commit anywhere in Fluvio's history proposing riscv64 support, and neither Fluvio nor InfinyOn has any RISE Project membership or funded engagement (confirmed absent from RISE's Premier/General member lists, RISE blog, RISE GitHub org repositories, and the RISE Python wheel builder's supported-package list).

## 14. Investment Analysis

**RISE involvement check:** RISE has funded no work touching Fluvio directly. RISE-funded initiatives that are relevant only at the dependency layer include Project RP004 (Rust Tier-1 riscv64gc Linux port, [riseproject.dev](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)) and general Python/PyTorch/IREE ecosystem work - none of which is specific to or coordinated with Fluvio. No sizing below assumes any Fluvio-specific work is already covered by RISE.

### 14.1 Functional Enablement

Add a `riscv64gc-unknown-linux-musl` (matching the project's existing musl-static-link release strategy) or `-gnu` Rust target to the build matrix; resolve any compile-time issues surfaced by the dependency chain, particularly the historically riscv64-fragile `ring` crate ([briansmith/ring#2745](https://github.com/briansmith/ring/issues/2745)) and confirm `mimalloc`/`zstd`/`openssl-sys` all link cleanly; produce a first working riscv64 binary for at minimum the core `fluvio` broker/client and `fvm`/CLI tools; validate SmartModule execution against Wasmtime's Tier 3 riscv64 Cranelift backend, accounting for its 8 open correctness bugs.

### 14.2 Performance Optimization

Not a priority for a first-pass port - Fluvio has no architecture-specific hot-path code of its own to optimize. Any performance work would target the dependency layer (e.g. `zstd`'s already-upstream-proposed RVV vectorization PRs, currently stalled on maintainer review) rather than Fluvio's own codebase.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `ci.yml` (build) and, once stable, to `merge_queue.yaml`/`release.yml` (build + test + release). Given RISE's free native RISC-V GitHub runners ([riseproject.dev, March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)), these could plausibly be used to avoid provisioning dedicated riscv64 hardware, though no such integration has been attempted or requested by Fluvio to date.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below. Fluvio's `fluvio` PyPI package is a thin client SDK, not a broad dependent-package ecosystem requiring separate riscv64 enablement across many downstream packages.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64gc Rust target, resolve dependency build issues (ring, mimalloc, openssl-sys), produce first working core+CLI binaries | 3-5 | Fluvio/InfinyOn maintainers or external contributor | Medium |
| Functional | Validate SmartModule execution against Wasmtime's Tier 3 riscv64 backend, track/triage the 8 open Wasmtime correctness bugs for exposure | 1-2 | Fluvio/InfinyOn maintainers | Medium |
| CI/CD | Add riscv64 build job to `ci.yml`; evaluate RISE RISC-V Runners for hosting | 1-2 | Fluvio/InfinyOn maintainers | Medium |
| CI/CD | Extend riscv64 job to test execution and, once stable, to `release.yml` for official binary publication | 1-2 | Fluvio/InfinyOn maintainers | Low (depends on functional work landing first) |
| Security | Track upstream resolution of the openssl AES constant-time gap (Zkn/Zvkned) before recommending Fluvio-on-riscv64 for production TLS use | 0 (tracking only, no direct fix owned by Fluvio) | N/A - upstream openssl | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [infinyon/fluvio GitHub repository](https://github.com/infinyon/fluvio)
- [fluvio.io homepage](https://fluvio.io/)
- [infinyon/fluvio .github/workflows](https://github.com/infinyon/fluvio/tree/master/.github/workflows)
- [infinyon/fluvio install.sh](https://github.com/infinyon/fluvio/blob/52673942c1c7364f36f2e05da972436f761243c/install.sh)
- [infinyon/fluvio CONTRIBUTING.md](https://github.com/infinyon/fluvio/blob/master/CONTRIBUTING.md)
- [infinyon/fluvio RELEASE.md](https://github.com/infinyon/fluvio/blob/master/RELEASE.md)
- [infinyon/fluvio CHANGELOG.md](https://github.com/infinyon/fluvio/blob/master/CHANGELOG.md)
- [infinyon/fluvio releases](https://github.com/infinyon/fluvio/releases)
- [infinyon/fluvio release v0.18.1](https://github.com/infinyon/fluvio/releases/tag/v0.18.1)
- [PyPI fluvio package JSON API](https://pypi.org/pypi/fluvio/json)
- [Ubuntu 26.04 resolute package search for Fluvio](https://packages.ubuntu.com/search?keywords=Fluvio&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [fluvio-community/fluvio GitHub repository](https://github.com/fluvio-community/fluvio)
- [fluvio-community/fluvio issue #1082 (ARM64, false positive)](https://github.com/fluvio-community/fluvio/issues/1082)
- [InfinyOn Kafka vs Fluvio benchmark blog post](https://infinyon.com/blog/2025/02/kafka-vs-fluvio-bench/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members page](https://riseproject.dev/members)
- [RISE Project RP004: Rust Tier-1 riscv64 Linux port](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [RISE Project - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Python wheel builder simple index](https://riseproject.gitlab.io/python/wheel_builder/)
- [wasmtime-bytecodealliance/wasmtime issue #5882](https://github.com/bytecodealliance/wasmtime/issues/5882)
- [wasmtime-bytecodealliance/wasmtime issue #7237](https://github.com/bytecodealliance/wasmtime/issues/7237)
- [wasmtime-bytecodealliance/wasmtime issue #11050](https://github.com/bytecodealliance/wasmtime/issues/11050)
- [openssl/openssl PR #31080](https://github.com/openssl/openssl/pull/31080)
- [openssl/openssl PR #31082](https://github.com/openssl/openssl/pull/31082)
- [openssl/openssl issue #28118](https://github.com/openssl/openssl/issues/28118)
- [openssl/openssl issue #22166](https://github.com/openssl/openssl/issues/22166)
- [briansmith/ring issue #2148](https://github.com/briansmith/ring/issues/2148)
- [briansmith/ring issue #2468](https://github.com/briansmith/ring/issues/2468)
- [briansmith/ring issue #2520](https://github.com/briansmith/ring/issues/2520)
- [briansmith/ring issue #2745](https://github.com/briansmith/ring/issues/2745)
- [RustCrypto/hashes issue #328](https://github.com/RustCrypto/hashes/issues/328)