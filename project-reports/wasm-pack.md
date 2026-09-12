---
title: wasm-pack
parent: Project Reports
color: red
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: cargo
    relation: build-dependency
    criticality: critical
  - name: wasm-bindgen
    relation: runtime-dependency
    criticality: critical
  - name: Binaryen
    relation: runtime-dependency
    criticality: optional
  - name: ureq
    relation: runtime-dependency
    criticality: critical
  - name: binary-install
    relation: build-dependency
    criticality: critical
---

# wasm-pack

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for wasm-pack<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="wasm-pack" %}

## 1. Project Overview

wasm-pack is a Rust CLI tool that orchestrates `cargo` and `wasm-bindgen` to build Rust-generated WebAssembly and package it for consumption from npm. It is a pure-Rust CLI orchestrator with no compute kernels of its own: no JIT, no SIMD, no cryptography, no GC. Its only "architecture-specific" logic is picking which prebuilt companion-binary URL (wasm-opt/Binaryen, `cargo-generate`, `geckodriver`, `chromedriver`) to download for the host machine.

**Governance:** No foundation membership, MAINTAINERS file, OWNERS file, CODEOWNERS, GOVERNANCE.md, or platform-support-tier document exists in the repository. The README states only: "This project was started by [ashleygwilliams] and is maintained by [drager]" - an informal, two-person maintenance model. `CONTRIBUTING.md` ties the project to the "rust-wasm" working group, described as "an official working group of the Rust project" - but that group's repository (`rustwasm/team`) is archived as of 2025-08-25, with a banner stating activity has moved elsewhere. The repository itself has migrated from `rustwasm/wasm-pack` to `wasm-bindgen/wasm-pack`; the historical homepage [https://rustwasm.github.io/wasm-pack/](https://rustwasm.github.io/wasm-pack/) returns HTTP 404, with the live docs now at [https://wasm-bindgen.github.io/wasm-pack/](https://wasm-bindgen.github.io/wasm-pack/). License is dual MIT OR Apache-2.0.

**Corporate sponsors:** None documented. No `FUNDING.yml`, no sponsors section in README or docs. `Cargo.toml` lists two individual authors with personal (non-corporate) email addresses. Top contributors by commit count in the full clone history: Jesper Hakansson (266), Ashley Williams (229, plus 252 under an earlier name spelling), Nick Fitzgerald (98), Alex Crichton (46), Michael Gattozzi (27) - none attributed to a company in-repo.

**Community culture on new ports:** No evidence found either way. There is no RFC process, platform-support policy, or documented stance on new architecture ports, and no RISC-V-related history to draw a stance from. This should be read as "no signal found," not as hostility or welcome.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| - | No riscv64/RISC-V commit, issue, or pull request exists anywhere in project history | [GitHub search across wasm-bindgen/wasm-pack](https://github.com/wasm-bindgen/wasm-pack) (zero results, all query variants) |

No milestone table can be populated: exhaustive searches (`search_issues`, `search_pull_requests`, `search_commits`, `search_code`, both scoped to `wasm-bindgen/wasm-pack` and unscoped GitHub-wide) returned zero RISC-V-related results at every stage of this research, independently re-verified twice. There are no key contributors to credit for RISC-V work because none has been done. The project is **not upstream-ported to RISC-V** in any sense - functional, tested, or partial.

## 3. Upstream Support Tier

No formal tier policy exists (no PLATFORMS.md, no tiered-support section in README or the docs book). wasm-pack's own scope makes a CPU-architecture tier policy largely moot for its *output* (it drives `cargo`/`wasm-bindgen` toward `wasm32` targets, not native CPU architectures) - but the *host* architecture the tool itself runs on is gated by an explicit `Arch` enum in source (see Section 4), which has no riscv64 variant.

| Aspect | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes ([test.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/test.yml), [release.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/release.yml)) | Yes (release.yml, via `cross`) | No |
| CI tests | Yes (ubuntu/macos/windows matrix in test.yml) | Not directly tested (only cross-compiled for release) | No |
| Official release binaries | Yes (`x86_64-unknown-linux-musl`, `x86_64-apple-darwin`, `x86_64-pc-windows-msvc`) | Yes (`aarch64-unknown-linux-musl`, `aarch64-apple-darwin`) | No |
| Host-arch dispatch in source (`Arch` enum) | `Arch::X86_64` | `Arch::AArch64` | Absent - `Arch::get()` returns `Err("Unrecognized target!")` |

## 4. Technical Architecture and RISC-V-Specific Subsystems

wasm-pack has no compute kernels (no JIT, no SIMD, no crypto, no hand-written assembly). Its only architecture-specific surface is host-detection code used to pick companion-binary download URLs. Every file performing this dispatch was read directly from a full local clone (`/home/user/rustwasm/wasm-pack`, HEAD `e33b17a`):

- `src/target.rs` (18 lines) - `cfg!()` constants: `LINUX`, `MACOS`, `WINDOWS`, `x86_64`, `x86`, `aarch64`. **No `riscv64` constant exists.**
- `src/install/arch.rs` (42 lines) - `enum Arch { X86_64, X86, AArch64 }`. `Arch::get()` checks the three constants in order and calls `bail!("Unrecognized target!")` for anything else, including riscv64. No stub arm, no TODO, no placeholder - riscv64 was simply never added.
- `src/install/os.rs` (42 lines) - OS enum only, not arch-related.
- `src/install/mod.rs` (lines 151-186) - maps `(Os, Arch, Tool)` tuples to download-URL suffixes for wasm-opt/`cargo-generate`. Since `Arch::get()` already errors before this point for riscv64, no riscv64 arm could ever be reached.
- `src/test/webdriver/geckodriver.rs`, `chromedriver.rs` - hand-rolled if/else chains on `target::LINUX && target::x86_64`, `target::aarch64`, etc. No riscv branch.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Host `Arch` enum variant | Present (`X86_64`) | Present (`AArch64`) | **Absent** - falls through to `bail!("Unrecognized target!")` |
| wasm-opt/Binaryen download URL mapping | Present | Present | **Absent** (unreachable - blocked upstream by missing `Arch` variant) |
| `cargo-generate` download URL mapping | Present | Present | **Absent** (same block) |
| geckodriver/chromedriver URL mapping | Present | Present | **Absent** (same block) |

**Consequence:** even a riscv64 build of the `wasm-pack` binary itself (e.g. the Ubuntu `stonking` package, Section 8) will compile and run for commands that need no companion download, but will unconditionally fail with `Error: Unrecognized target!` the moment `wasm-pack build` needs to auto-install `wasm-opt` or any other companion tool - which is the tool's primary workflow. This is a direct, source-verified functional gap, not merely an untested configuration.

## 5. Build System, Cross-Compilation, and Toolchain

wasm-pack is a pure Cargo project. There is no CMake, no Dockerfile, no QEMU usage, and no architecture-specific toolchain file anywhere in the repository (confirmed via `search_code` for `filename:CMakeLists.txt`, `filename:Dockerfile`, `qemu`, `cross-compilation`, `toolchain riscv` against `rustwasm/wasm-pack` - zero matches for all). Build is `cargo build --release`; the only cross-compilation infrastructure used upstream is the `cross` tool, applied in `release.yml` solely for `aarch64-unknown-linux-musl` - no riscv64 target is configured.

No riscv64-specific build failure is documented because no one has attempted to build wasm-pack's own CI for riscv64. The Ubuntu `stonking` package (Section 8) demonstrates the crate compiles cleanly with plain `cargo build --release` under Debian/Ubuntu's own riscv64 buildd infrastructure - i.e., compilation itself is not blocked, only the runtime host-arch dispatch described in Section 4.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `wasm-pack new` / `wasm-pack init` (no download needed) | Works | Works | Likely works (no `Arch::get()` call path in this command) [NEEDS VERIFICATION] |
| `wasm-pack build` (requires downloading wasm-bindgen/wasm-opt) | Works | Works | **Fails** - `Arch::get()` returns `Err("Unrecognized target!")` before any download URL is resolved |
| `wasm-pack test` (requires geckodriver/chromedriver auto-install) | Works | Works | **Fails** - same dispatch gap |
| Official prebuilt CLI binary | Yes | Yes | **No** (no upstream release asset) |

**Functional gap:** the core value proposition of wasm-pack - automating the download/install of wasm-bindgen, wasm-opt, and webdriver binaries - is confirmed non-functional on riscv64 by direct source inspection (Section 4). This is not a performance gap; it is a hard failure of the primary command.

**Performance/SIMD gaps:** not applicable to wasm-pack itself (no SIMD code). One indirect performance note: the `crc32fast` dependency has accelerated SIMD paths for x86 (`pclmulqdq`) and aarch64 (CRC intrinsics) but falls back to a portable table-based implementation on riscv64 with no Zbc (carry-less multiply) dispatch - correctness is unaffected, this is a latent optimization gap in a transitive dependency, not in wasm-pack.

**Security hardening gaps:** the `ring` crate (reached via `ureq` -> `rustls` -> `ring`, used for HTTPS downloads) has riscv64gc support (closed complete, [ring#2520](https://github.com/briansmith/ring/issues/2520)) but no hand-written riscv64 assembly fast paths, unlike its x86_64/aarch64 accelerated paths - crypto operations run on a portable/C fallback. Correctness is not in question; performance/side-channel-hardening parity with other architectures is unconfirmed [NEEDS VERIFICATION].

**NaN/floating-point semantics:** not applicable to wasm-pack (it contains no floating-point compute). A genuinely relevant but separate finding: a RISC-V-specific WASM NaN-boxing correctness bug was found and fixed in Firefox/SpiderMonkey ([Bugzilla #1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867), resolved, last updated August 2025) - this affects a WASM *engine* running wasm-pack's *output*, not wasm-pack itself.

## 7. CI/CD Infrastructure

All four GitHub Actions workflow files were read directly from the repository (commit `e33b17a`, confirmed identical to remote HEAD at verification time):

| File | Trigger | Runners | riscv64? |
|---|---|---|---|
| [test.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/test.yml) | push/pull_request on master | ubuntu-latest, macos-latest, windows-latest (rust: stable) | No |
| [release.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/release.yml) | push tags `v*` | ubuntu-latest (x86_64/aarch64-unknown-linux-musl via `cross`), macos-latest (x86_64/aarch64-apple-darwin), windows-latest (x86_64-pc-windows-msvc) | No |
| [approve.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/approve.yml) | schedule (daily cron), workflow_dispatch | ubuntu-latest | No |
| [book.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/book.yml) | push/pull_request | ubuntu-latest | No |

A repository-wide `grep -rniE "riscv"` across every `.yml`/`.yaml`/`.toml` file returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or Azure Pipelines file exists. No QEMU riscv64 emulation, no `linux/riscv64` platform strings, no riscv64 self-hosted or RISE runner references anywhere.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes (release.yml only, via `cross`) | No |
| CI test | Yes (test.yml) | No (not directly tested, only cross-built at release time) | No |
| RISE runner usage | N/A | N/A | None found |

## 8. Distribution and Release Status

**Upstream GitHub releases:** v0.15.0 and v0.14.0 assets checked directly via the `expanded_assets` endpoint. Full v0.15.0 asset list: `wasm-pack-init.exe`, `wasm-pack-v0.15.0-aarch64-apple-darwin.tar.gz`, `wasm-pack-v0.15.0-aarch64-unknown-linux-musl.tar.gz`, `wasm-pack-v0.15.0-x86_64-apple-darwin.tar.gz`, `wasm-pack-v0.15.0-x86_64-pc-windows-msvc.tar.gz`, `wasm-pack-v0.15.0-x86_64-unknown-linux-musl.tar.gz`, plus source archives. **Zero riscv64 assets in any recent release.**

**PyPI:** not applicable - `https://pypi.org/pypi/wasm-pack/json` returns HTTP 404; wasm-pack is a Rust CLI tool, not a Python package, and has no PyPI presence under that name.

**RISE wheel builder:** not applicable, same reason. wasm-pack is absent from the [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/) (85 packages enumerated, wasm-pack not among them).

**Ubuntu 26.04 "resolute" (current/upcoming LTS):** package **absent entirely** - confirmed via direct search (`packages.ubuntu.com/search?keywords=wasm-pack&suite=resolute` -> "Sorry, your search gave no results"). No `wasm-pack` package exists in this suite for any architecture.

**Ubuntu "stonking" (post-26.04 unreleased development suite):** `wasm-pack 0.15.0+ds-2` (universe) **is** built for amd64, arm64, armhf, ppc64el, **riscv64**, and s390x - confirmed directly via [packages.ubuntu.com/stonking/wasm-pack](https://packages.ubuntu.com/stonking/wasm-pack) (riscv64 row: 1,711.0 kB package / 4,671.0 kB installed). This is a real riscv64 `.deb`, but it lives only in an unreleased development suite with no guarantee it survives to a shipped Ubuntu release, and - per Section 4 - the resulting binary would fail on its primary command (`wasm-pack build`) due to the unaddressed `Arch::get()` dispatch gap.

**Arch Linux RISC-V port (archriscv.felixc.at):** wasm-pack does **not** appear at all - not listed, not marked broken, simply absent from that repository.

**What a user must do today to get a working riscv64 binary:** there is none. No upstream release, no stable-distro package, and the one downstream artifact that exists (Ubuntu `stonking`, unreleased) would be non-functional for the tool's primary use case per the source-code finding in Section 4. A user would have to build from source (`cargo build --release`, which compiles cleanly) and then manually work around the missing `Arch` variant (e.g. patch the enum, or manually pre-install wasm-opt/wasm-bindgen to sidestep the auto-download path) to get a working setup [NEEDS VERIFICATION - no documented workaround found].

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Rust | Build-dependency, critical (toolchain wasm-pack is written in) | Yes (`rustc --target riscv64gc-unknown-linux-gnu` is a supported target) [NEEDS VERIFICATION - not directly confirmed in this research pass] | N/A | N/A | Not separately investigated in this pass; assumed functional per general Rust riscv64gc target support |
| cargo | Build-dependency, critical (invoked by wasm-pack to build the target crate) | Ships with Rust toolchain | N/A | N/A | Same as Rust above |
| wasm-bindgen | Runtime-dependency, critical (downloaded as a companion binary by wasm-pack) | Blocked at download-dispatch stage on riscv64 - see Section 4 (`Arch::get()` gap) | N/A | No upstream riscv64 release asset confirmed in this pass | Noted in `sw-ecosystem/project-reports/wasm3.md` as packaged for riscv64 by Arch Linux (third-party, not upstream) |
| Binaryen | Runtime-dependency, optional (wasm-opt, downloaded as a companion binary) | Same download-dispatch gap as wasm-bindgen | N/A | No upstream riscv64 release asset confirmed in this pass | Same third-party Arch Linux note as wasm-bindgen |
| ureq | Build-dependency, critical (HTTP client used to download companion binaries) | Pure-Rust-adjacent (pulls in `rustls`/`ring`), no riscv64-specific blockers found | No riscv64 issues found | Ships normally | Version 2.12.1 pinned in `Cargo.lock` |
| binary-install | Build-dependency, critical (extracts downloaded companion-binary archives) | Pulls `zip`, `flate2`, `tar`; no riscv64-specific blockers found in this chain | No riscv64 issues found | Ships normally | Version 0.4.1 pinned in `Cargo.lock`; not in RISE `projects.yml`, no dedicated report |
| rustls (indirect, via ureq) | TLS orchestration | Pure Rust, no arch-specific code | No riscv64 issues found (2 unrelated matches: mips64el, aarch64-msvc) | Ships normally (arch-agnostic) | Version 0.23.40 |
| ring (indirect, via rustls) | Crypto primitives for TLS | riscv64gc support added, closed complete ([ring#2520](https://github.com/briansmith/ring/issues/2520)) | Passes in CI on riscv64gc per issue history | Ships in releases >=0.17.x for riscv64gc | No hand-written riscv64 assembly fast paths (unlike x86_64/aarch64) - portable/C fallback only. [ring#2745](https://github.com/briansmith/ring/issues/2745) (non-standard `riscv64a23` triple) closed not_planned - does not affect the standard `riscv64gc-unknown-linux-gnu` target |
| zip (indirect, via binary-install) | Archive extraction for downloaded release bundles | No riscv64-specific issues found | Inherits status of transitive codecs | Pure-Rust facade, ships normally | Version 2.4.2 |
| flate2 (indirect, via binary-install/zip) | DEFLATE/gzip decompression | No riscv64-specific issues found | Default `miniz_oxide` backend is pure Rust, arch-agnostic | Ships normally | Version 1.1.9 |
| miniz_oxide (indirect, via flate2) | Pure-Rust DEFLATE backend | Pure Rust, arch-agnostic | No riscv64 issues found | Ships normally | No dedicated project report |
| zstd (indirect, via zip) | Optional zip compression codec | RVV-accelerated paths exist upstream (facebook/zstd) but 7 open riscv64 PRs stalled on maintainer non-response | Emulated QEMU CI only, PR-triggered, not release-blocking | Ubuntu 24.04 ships riscv64 `zstd`/`libzstd-dev`; 26.04 status not confirmed this pass | Full existing report: [project-reports/zstd.md](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/zstd.md) (RVV gaps, maintainer review bottleneck) |
| crc32fast (indirect, via zip) | Checksum for zip/gzip entries | No riscv64 SIMD dispatch path (only x86/aarch64 accelerated paths exist); falls back to portable table-based implementation | No riscv64 issues found | Ships normally | Potential future optimization gap - no Zbc(carry-less-mul) path, unlike x86/arm64 |
| bzip2 (indirect, via zip, optional codec) | Optional zip compression codec (C library) | Pure portable C89, no arch-specific code on any platform | No riscv64-specific issues (0 of 40 GitLab issues mention RISC-V) | Debian sid / Ubuntu 24.04 ship riscv64 packages | Full existing report: [project-reports/bzip2.md](https://github.com/riseproject-dev/sw-ecosystem/blob/main/project-reports/bzip2.md) - confirms zero riscv64 blockers |

**Note on dependency-graph verification:** `mcp__project-graph__project_graph_query` failed to connect (`CONNECTION_CLOSED`) across every research pass in this task - flagged as a recurring infrastructure gap. No SPARQL-backed cross-check of Ubuntu 26.04 package-availability or `hasDependency` relationships for these crates was possible; all dependency findings above rest on direct web/registry lookups and existing project reports only.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue or PR exists in wasm-pack | N/A | N/A | Confirmed by repeated, independently re-verified searches ([search_issues](https://github.com/wasm-bindgen/wasm-pack/issues), [search_pull_requests](https://github.com/wasm-bindgen/wasm-pack/pulls), [search_commits](https://github.com/wasm-bindgen/wasm-pack), [search_code](https://github.com/wasm-bindgen/wasm-pack)) - zero results across every query variant |
| [ring#2520](https://github.com/briansmith/ring/issues/2520) | "Support for riscv64" | Closed, completed | N/A (transitive dependency, not wasm-pack itself) | riscv64gc support landed; no accelerated assembly path |
| [Bugzilla #1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867) | SpiderMonkey WasmBCFrame riscv64 Float32 NaN-boxing bug | Resolved (fixed) | N/A (a WASM engine bug, not wasm-pack) | Included for context: it affects consumption of wasm-pack's *output*, not wasm-pack itself |

**Correctness bug specific to wasm-pack:** none filed anywhere upstream. The most consequential correctness-relevant finding in this report is the source-verified `Arch::get()` -> `bail!("Unrecognized target!")` gap (Section 4), which has never been filed as an issue because, per this research, no one appears to have attempted running wasm-pack on riscv64 hardware yet.

## 12. Objections and Upstream Blockers

No stated objections exist because no RISC-V port has ever been proposed, requested, or discussed in the project's issue tracker, pull requests, or commit history (Section 2). There is no technical blocker at the compilation level - the crate builds cleanly with plain `cargo build --release`, evidenced by the Ubuntu `stonking` riscv64 package (Section 8). The concrete technical blocker is narrow and well-defined: add a `RiscV64` (or similar) variant to `src/install/arch.rs`'s `Arch` enum, wire it through the `cfg!()` detection in `src/target.rs`, and add corresponding URL-mapping arms in `src/install/mod.rs` and the webdriver install modules. This is a small, self-contained change with no known upstream design objection blocking it - the absence is one of neglect (no one has filed it), not refusal.

Organizational blockers: the project's informal two-person maintainer model and its now-archived parent working group (`rustwasm/team`, archived 2025-08-25) mean there is no dedicated triage or platform-support process to receive such a contribution, which could slow review even for a well-scoped PR. Acceptance probability for a correctly-scoped PR is assessed as **medium-to-high** given the small blast radius of the change and the absence of any stated objection to RISC-V - but this is a qualitative judgment, not evidenced by any actual PR history, since none exists [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none (the only artifact anywhere that includes riscv64 - Ubuntu's unreleased `stonking` development-suite package - is a downstream build with no upstream involvement, and per Section 4 would fail on the tool's primary command due to the unaddressed host-architecture dispatch gap)
- **Optimization level:** not applicable - wasm-pack is not an optimization-purpose project (it is a build/packaging orchestrator with no compute kernels of its own); Step 2 of the color model does not apply.
- **Justification:** No upstream riscv64 CI exists at any level - all four GitHub Actions workflow files ([test.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/test.yml), [release.yml](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/release.yml), approve.yml, book.yml) were read directly and contain zero riscv64 references. No upstream release has ever shipped a riscv64 asset (confirmed against v0.15.0 and v0.14.0 asset lists). Direct inspection of `src/install/arch.rs` confirms `Arch::get()` calls `bail!("Unrecognized target!")` for any architecture outside `{X86_64, X86, AArch64}`, which unconditionally breaks the tool's primary command (`wasm-pack build`) on riscv64 before any companion-binary download can be attempted - this is positive, source-verified evidence of non-functionality for the project's core use case, meeting the bar for red rather than a default "untested" grade of orange.
- **Pending work that could change the grade:** none found. No open PR, no open issue, and no RISE-funded or RISE-blog-documented work targets wasm-pack. wasm-pack is listed only as a queued (not started) candidate in RISE's own internal project-report backlog (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`), and its only other RISE-repo footprint is as an unrelated CI build dependency (`jetli/wasm-pack-action`) used to compile a different tool (`pagefind`) in `riseproject-dev/python-wheels` - not work on wasm-pack itself.

## 14. Investment Analysis

RISE has not funded, initiated, or documented any work on wasm-pack (Section 1, Section 13). All items below represent net-new investment; nothing is already covered.

### 14.1 Functional Enablement

- Add a `RiscV64` variant to the `Arch` enum in `src/install/arch.rs`, wire riscv64 host detection into `src/target.rs`, and add corresponding companion-binary URL-mapping arms in `src/install/mod.rs` and the webdriver install modules (`src/test/webdriver/geckodriver.rs`, `chromedriver.rs`). This is the single blocking change identified by direct source inspection (Section 4) and is small and self-contained.
- This enablement is necessary but not sufficient on its own: it only resolves wasm-pack's *own* host-arch dispatch. It does not guarantee that the companion binaries it would then try to download (wasm-bindgen, Binaryen/wasm-opt) actually publish riscv64 release assets upstream - that was not confirmed as available in this research pass and would need separate verification/enablement work in those two projects.

### 14.2 Performance Optimization

Not applicable as a primary investment area - wasm-pack has no compute kernels. The one adjacent, low-priority item is the `crc32fast` transitive dependency's lack of a riscv64 SIMD/Zbc dispatch path (Section 6); this is upstream work in a third-party crate, not in wasm-pack, and affects performance only, not correctness.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `release.yml`'s build matrix (mirroring the existing `aarch64-unknown-linux-musl` `cross`-based entry) once the functional gap in 14.1 is fixed, so upstream begins publishing riscv64 release assets directly (raising `release_provider` from `none` to `upstream`).
- Add riscv64 to `test.yml`'s test matrix to get real test execution, not just a build - this requires either a riscv64 CI runner (RISE runner infrastructure could serve this) or QEMU-based emulation.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report rules (wasm-pack is a standalone CLI tool with no dependent package ecosystem to enable).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `Arch::RiscV64` variant and wire through `src/target.rs`, `src/install/mod.rs`, webdriver install modules | 1-2 | Upstream (small PR) or RISE-sponsored contribution | Critical |
| Functional | Verify/enable riscv64 release assets for wasm-bindgen and Binaryen (upstream dependencies wasm-pack downloads) | Not sized - out of scope for this report; requires separate investigation of those two projects | Upstream (wasm-bindgen, Binaryen) | High |
| CI/CD | Add riscv64 build target to `release.yml` matrix | 0.5-1 | Upstream, contingent on 14.1 | High |
| CI/CD | Add riscv64 test execution to `test.yml` (native runner or QEMU) | 1-2 | Upstream, or RISE runner infrastructure | Medium |
| Distribution | Get Ubuntu `stonking` `wasm-pack` package promoted to a stable/LTS suite once functional gap is fixed | Not sized - distro-process dependent, not engineering effort | Ubuntu/Debian maintainers | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [wasm-bindgen/wasm-pack (current repo location)](https://github.com/wasm-bindgen/wasm-pack)
- [rustwasm/wasm-pack (legacy repo location, redirects to above)](https://github.com/rustwasm/wasm-pack)
- [wasm-pack docs (live)](https://wasm-bindgen.github.io/wasm-pack/)
- [wasm-pack docs (dead legacy URL, HTTP 404)](https://rustwasm.github.io/wasm-pack/)
- [test.yml workflow](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/test.yml)
- [release.yml workflow](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/release.yml)
- [approve.yml workflow](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/approve.yml)
- [book.yml workflow](https://github.com/wasm-bindgen/wasm-pack/blob/master/.github/workflows/book.yml)
- [wasm-pack v0.15.0 release assets](https://github.com/wasm-bindgen/wasm-pack/releases/tag/v0.15.0)
- [wasm-pack v0.14.0 release assets](https://github.com/wasm-bindgen/wasm-pack/releases/tag/v0.14.0)
- [PyPI JSON API for wasm-pack (404, package does not exist)](https://pypi.org/pypi/wasm-pack/json)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 "resolute" package search (no results)](https://packages.ubuntu.com/search?keywords=wasm-pack&suite=resolute)
- [Ubuntu "stonking" package page (riscv64 .deb present)](https://packages.ubuntu.com/stonking/wasm-pack)
- [Arch Linux RISC-V unofficial repo](https://archriscv.felixc.at/)
- [ring issue #2520 - Support for riscv64 (closed, completed)](https://github.com/briansmith/ring/issues/2520)
- [ring issue #2745 - riscv64a23 target build failure (closed, not planned)](https://github.com/briansmith/ring/issues/2745)
- [Bugzilla #1975867 - SpiderMonkey riscv64 Float32 NaN-boxing bug (resolved)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867)
- [WebAssembly/design#646 - RISC-V and NaNs](https://github.com/WebAssembly/design/issues/646)
- [riseproject.dev - "A Glimpse Into V8 Development for RISC-V"](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [riseproject.dev - "Project RP009: LLVM SPEC Optimization"](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [riseproject.dev - "Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V"](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [riseproject.dev - "RISE RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- Local clone used for source inspection: `/home/user/rustwasm/wasm-pack` (origin resolves to wasm-bindgen/wasm-pack, HEAD `e33b17a`)
- Existing dependency reports referenced: `project-reports/zstd.md`, `project-reports/bzip2.md` (in `riseproject-dev/sw-ecosystem`)