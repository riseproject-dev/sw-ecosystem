---
title: wasm-bindgen
parent: Project Reports
color: yellow
---

{% include dependency-graph.html slug="dependencies" subset="wasm-bindgen" %}

# wasm-bindgen

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for wasm-bindgen<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

wasm-bindgen is a Rust and WebAssembly tool that generates JavaScript bindings for Rust code compiled to WebAssembly, and vice versa: it facilitates high-level interactions between wasm modules and JavaScript, such as passing structured values (strings, objects, classes) across the wasm/JS boundary. It compiles Rust to the `wasm32-unknown-unknown` (and `wasm64`) WebAssembly target, not to any native host CPU ISA.

The project has **no foundation membership** - it is not under the Rust Foundation, Linux Foundation, Apache Software Foundation, or any other umbrella, and is explicitly described in its own governance documentation as "not owned by any specific entity or group and belongs to the community as a whole" ([governance.md](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/contributing/governance.md)). It originated under the now-sunsetted Rust and WebAssembly Working Group (the historical `rustwasm` GitHub org, which now redirects to `wasm-bindgen/wasm-bindgen`).

Governance is consensus-based: a Core Team (daxpedda, Ingvar Stepanyan / RReverser, Guy Bedford / guybedford) plus a set of Collaborators, all with equal PR rights; every PR needs at least one collaborator review, and core-team votes are a last resort. New collaborators self-nominate after 2-3 significant contributions. License is dual Apache-2.0/MIT.

Corporate affiliation is informal and inferred only from commit-author email domains (not formally documented): current core-team member Guy Bedford has a substantial share of commits from a `cloudflare.com` address, suggesting Cloudflare affiliation for part of his work; the historically dominant contributors (Alex Crichton, 1,574 commits; Nick Fitzgerald, 457 commits) were from the Mozilla/Fastly-era Rust and WebAssembly Working Group but have since rolled off the active team. There is no declared corporate sponsor list or foundation-tier membership; the only funding mechanism found is a personal GitHub Sponsors link for daxpedda in `.github/FUNDING.yaml`.

Community culture toward new platform ports is informal and low-friction: the one RISC-V port PR was submitted by a non-core community contributor, reviewed by a single core-team member, and merged the same day with no RFC process or debate (see Section 2).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-08-07 | PR #5265 "Add `riscv64gc-unknown-linux-gnu` release artifacts" opened by Xeonacid | [PR #5265](https://github.com/wasm-bindgen/wasm-bindgen/pull/5265) |
| 2026-08-07 | PR #5265 reviewed and merged by core-team member guybedford (same day, squash merge, 64 checks passed); reviewer added a follow-up commit stripping debug symbols from the new binaries | [PR #5265](https://github.com/wasm-bindgen/wasm-bindgen/pull/5265) |
| 2026-08-08 | Change shipped in Release 0.2.127, changelog: "Added `riscv64gc-unknown-linux-gnu` release artifacts" | [CHANGELOG.md](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/CHANGELOG.md), PR #5219 |
| 2026-09-05 | Release 0.2.128 continues to ship `riscv64gc-unknown-linux-gnu` release artifacts (latest release checked) | GitHub Releases page (verified by direct asset download and checksum, see Section 8) |

**Key contributors:** Xeonacid (author of the sole riscv64 PR; no stated corporate affiliation found); Guy Bedford / guybedford (reviewer/merger, current core team, partial Cloudflare affiliation inferred from commit email domain [NEEDS VERIFICATION]).

**Is it fully upstream?** Yes, for what exists: the change is merged into `main` and shipped in two releases. But "what exists" is narrow: it is solely a CI job that cross-compiles and publishes a prebuilt CLI binary for riscv64 hosts. There is no dedicated riscv64 tracking issue, no follow-on work, and no evidence of an active riscv64 port effort beyond this single PR - confirmed by an exhaustive `git log --all -i --grep="risc"` and `git log -S"riscv" --all` over full repository history, both returning exactly this one commit.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. There is no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` directory in the repository; the only platform-related document is `guide/src/reference/browser-support.md`, which covers browser/JS compatibility, not compile-target architectures. Which host architectures get prebuilt CLI binaries is governed informally by the CI workflow file (`.github/workflows/main.yml`), not by a documented tier system.

**Evidence:**
- CI: builds (cross-compiles) riscv64, does not run tests on riscv64, does not run on pull requests (see Section 7).
- Release: riscv64 binaries are published to GitHub Releases starting with 0.2.127, independently verified as genuine RISC-V64 ELF binaries via checksum-matched download (see Section 8).
- Not release-blocking in the pre-merge sense: the `dist_linux_riscv64_gnu` job's own `if:` condition (`github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/')`) means it never runs on PR events, so a riscv64 build regression could merge to `main` without being caught until a release or main-branch push triggers the job.

**Comparison table: amd64 vs arm64 vs riscv64**

| Architecture | Source-level implementation | CI job | Tests run | Release artifact |
|---|---|---|---|---|
| amd64 (x86_64) | none (arch-agnostic Rust) | `dist_linux_x86_64_musl` / gnu variant | Native jobs (`test_*`) run on x86_64 runners | Yes, upstream GitHub Releases |
| arm64 (aarch64) | none (arch-agnostic Rust) | `dist_linux_aarch64_gnu` | Not confirmed as tested natively in this research | Yes, upstream GitHub Releases |
| riscv64 | none (arch-agnostic Rust) | `dist_linux_riscv64_gnu` (PR #5265, merged) | No - cross-compile and strip only, binary never executed | Yes, upstream GitHub Releases (0.2.127+) |

Structurally, the riscv64 dist job is a same-pattern copy of the aarch64 job (cross-compile, strip, upload-artifact). It is on par with arm64's release-packaging tier for CLI binary distribution, but - critically - wasm-bindgen's own primary test suite (`test_wasm_bindgen`, `test_native`, `test_wasm64`, `test_with_geckodriver`, and roughly a dozen other `test_*` jobs) does not target riscv64 at all; none of those jobs run on a riscv64 host.

## 4. Technical Architecture and RISC-V-Specific Subsystems

wasm-bindgen has **no architecture-specific subsystems for any host CPU architecture** - not for amd64, arm64, or riscv64. This is not a codec, crypto library, or math kernel with hand-tuned per-host-ISA code paths. It is a Rust tool/library whose actual logic operates on WebAssembly bytecode and compiles to the `wasm32`/`wasm64` WebAssembly **target**, which is itself architecture-independent of the host CPU that eventually executes it.

Confirmed by direct code search:
- `search_code` for `__riscv repo:wasm-bindgen/wasm-bindgen` -> 0 results. No `#ifdef __riscv` guards exist because there is no C/intrinsics layer in the repository.
- `search_code` for `target_arch repo:wasm-bindgen/wasm-bindgen` -> 31 hits, and every one is `target_arch = "wasm32"` or `target_arch = "wasm64"` (the WASM compile *output* target) - never `x86_64`, `aarch64`, or `riscv64`.

There is no JIT backend, no SIMD dispatch, no crypto/assembly, and no GC-barrier code conditioned on host architecture anywhere in this repository.

**Comparison table per component**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / codegen backend | Not applicable (project has none; operates on wasm bytecode, not native codegen) | Not applicable | Not applicable |
| SIMD dispatch | Not applicable | Not applicable | Not applicable |
| Crypto / assembly | Not applicable (relies on Rust crates such as rustls/native-tls, see Section 9) | Not applicable | Not applicable |
| GC barriers | Not applicable | Not applicable | Not applicable |
| Host-architecture-conditional Rust code | None found | None found | None found |

**Conclusion:** riscv64 is not a "stub" relative to amd64/arm64 in this project - there is no deeper per-architecture implementation to be incomplete on any of the three. "Architecture support" for wasm-bindgen consists entirely of CI cross-compilation jobs producing prebuilt CLI binaries per host platform, and riscv64's job is structurally identical to the existing amd64/arm64 jobs.

## 5. Build System, Cross-Compilation, and Toolchain

wasm-bindgen has no CMake, no Dockerfiles, no toolchain files, and no build documentation (`BUILDING.md`, `INSTALL`, `docs/cross-compilation.md`) anywhere in the repository - confirmed by an exhaustive `find` for these filename patterns returning zero results.

**Exact build command (from `.github/workflows/main.yml`, job `dist_linux_riscv64_gnu`):**

```
sudo apt update -y && sudo apt install gcc-riscv64-linux-gnu -y
cargo build --manifest-path crates/cli/Cargo.toml --target riscv64gc-unknown-linux-gnu --features vendored-openssl --release
riscv64-linux-gnu-strip -g target/riscv64gc-unknown-linux-gnu/release/wasm-bindgen
riscv64-linux-gnu-strip -g target/riscv64gc-unknown-linux-gnu/release/wasm-bindgen-test-runner
riscv64-linux-gnu-strip -g target/riscv64gc-unknown-linux-gnu/release/wasm2es6js
```
with `CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER: riscv64-linux-gnu-gcc` as the cross-linker.

**Toolchain:** stock `rustup`/`dtolnay/rust-toolchain@stable` with the `riscv64gc-unknown-linux-gnu` target added, plus the `gcc-riscv64-linux-gnu` cross-toolchain package pulled from Ubuntu's default apt repositories on the `ubuntu-latest` GitHub Actions runner. **No minimum GCC or Rust version is pinned or documented** for the riscv64 path specifically - it uses whatever `rustup stable` and Ubuntu's default `gcc-riscv64-linux-gnu` resolve to at CI run time. This is a genuine gap: there is no documented rationale for toolchain version choices because none are pinned.

**QEMU usage:** None. The produced riscv64 binary is never executed in CI - it is built, stripped, and uploaded as a release artifact only.

**Known build failures:** None found. No riscv64-tagged build-failure issues exist in the tracker (see Section 11), though the absence of documentation and absence of any test execution means undetected build regressions cannot be ruled out from CI evidence alone.

**What a user must do to get a working binary:** Download the prebuilt tarball from GitHub Releases (`wasm-bindgen-<version>-riscv64gc-unknown-linux-gnu.tar.gz`, verified against the published `.sha256sum`), or run `cargo install wasm-bindgen-cli` on a riscv64 host and let Cargo build from source (untested by upstream CI on riscv64 hardware either way).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| wasm-bindgen-cli prebuilt binary | Yes | Yes | Yes (since 0.2.127) |
| CI test execution of the produced binary | Not confirmed as riscv64-style QEMU-free native testing in this research; amd64 is the primary CI host and runs the full `test_*` matrix | Not directly confirmed | No - CI never executes the riscv64 binary |
| PR-gated CI (pre-merge signal) | Yes (core `test_*` jobs run on PR) | Not confirmed | No - `dist_linux_riscv64_gnu` skips PR events entirely |
| Functional capability of the generated bindings (wasm32/wasm64 output) | Identical | Identical | Identical - the tool's actual output is architecture-independent of the host running the CLI |

**Functional gaps:** None identified in the tool's actual function (bindings generation targets `wasm32`/`wasm64`, not the host CPU), because that function does not vary by host architecture. The only gap is in **build-time confidence**: a riscv64-hosted user has no CI-verified guarantee that the binary they download actually runs correctly on their machine, only that it compiles.

**Performance gaps:** Not applicable in the SIMD/hand-tuned-kernel sense - see Section 4. No RISC-V/arm64/amd64 performance data of any kind was found for wasm-bindgen (see Section 12/14 research).

**Security hardening gaps:** No riscv64-specific security concerns identified in this research. The CLI's optional TLS dependencies (rustls, native-tls) carry general per-architecture crypto-backend risk (see Section 9) that is not riscv64-specific to wasm-bindgen itself.

**NaN / floating-point semantics issues:** None found. No issue, PR, or documentation anywhere in the repository or in web search results mentions RISC-V NaN or floating-point semantics for wasm-bindgen. Given that wasm-bindgen's role is binding-code generation rather than floating-point computation, this is expected rather than a notable gap.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist?** A riscv64 CI *job* exists, but it does not function as continuous integration testing in the normal sense - it is release-artifact build tooling. Read directly from `.github/workflows/main.yml` (the only workflow file besides the non-CI `codecov.yml`; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repo):

```yaml
dist_linux_riscv64_gnu:
  if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/')
  runs-on: ubuntu-latest
  steps:
  - uses: actions/checkout@v7
  - uses: dtolnay/rust-toolchain@stable
    with:
      targets: riscv64gc-unknown-linux-gnu
  - run: sudo apt update -y && sudo apt install gcc-riscv64-linux-gnu -y
  - run: |
      cargo build --manifest-path crates/cli/Cargo.toml --target riscv64gc-unknown-linux-gnu --features vendored-openssl --release
      riscv64-linux-gnu-strip -g target/riscv64gc-unknown-linux-gnu/release/wasm-bindgen
      riscv64-linux-gnu-strip -g target/riscv64gc-unknown-linux-gnu/release/wasm-bindgen-test-runner
      riscv64-linux-gnu-strip -g target/riscv64gc-unknown-linux-gnu/release/wasm2es6js
    env:
      CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER: riscv64-linux-gnu-gcc
  - uses: actions/upload-artifact@v7
    with:
      name: dist_linux_riscv64_gnu
      path: "target/riscv64gc-unknown-linux-gnu/release/wasm*"
```
([source: main.yml lines 506-525](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/.github/workflows/main.yml))

Points established by direct file read:
- **Runner:** `ubuntu-latest` (x86-64) - cross-compilation only, no riscv64 hardware and no QEMU.
- **No test execution:** the job runs `cargo build`, strips symbols, and uploads the artifact. It never runs `cargo test` and never executes the produced binary.
- **Not PR-gating:** the job's own `if:` condition means it is skipped on pull-request-triggered workflow runs (on a PR, `github.ref` is the PR merge ref, not `refs/heads/main` or `refs/tags/*`). It fires only on pushes to `main` or on tag pushes - i.e., it is a release-packaging step, not a pre-merge quality gate.
- **RISE runners:** None used. No reference to RISE, `riseproject-dev`, or any riscv64-labeled self-hosted runner was found anywhere in `main.yml`.
- Downstream, the `deploy` job (lines ~670-748) lists `dist_linux_riscv64_gnu` in its `needs:` and packages the artifact as `wasm-bindgen-$tag-riscv64gc-unknown-linux-gnu.tar.gz` for GitHub Releases.

**Comparison table**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes (`dist_linux_x86_64_musl`/gnu) | Yes (`dist_linux_aarch64_gnu`) | Yes (`dist_linux_riscv64_gnu`) |
| Test execution | Full `test_*` matrix runs on x86_64 | Not confirmed in this research | No - build/strip/upload only |
| Runs on PR | Yes for core `test_*` jobs | Not confirmed | No (main/tag pushes only) |
| Hardware/emulation | Native x86_64 | Not confirmed (cross-compile vs native not established in this research) [NEEDS VERIFICATION] | Cross-compiled on x86_64 runner; no QEMU, no native hardware |

## 8. Distribution and Release Status

**Official binaries for riscv64:** Yes, via upstream GitHub Releases only, confirmed with binary-level verification (not just page scraping):
- Release 0.2.128 (latest, 2026-09-05) ships `wasm-bindgen-0.2.128-riscv64gc-unknown-linux-gnu.tar.gz` plus a `.sha256sum` file.
- The asset was independently downloaded (HTTP 200, 10,996,302 bytes), its SHA-256 checksum computed locally and matched exactly against the published `.sha256sum`, and the extracted binaries confirmed via `file` as genuine `ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI ... interpreter /lib/ld-linux-riscv64-lp64d.so.1` - i.e. real, working RISC-V64 GNU/Linux executables (`wasm-bindgen`, `wasm-bindgen-test-runner`).
- Release 0.2.127 (2026-08-08) is the first release to include riscv64 artifacts, per its release notes ("Added `riscv64gc-unknown-linux-gnu` release artifacts").
- Release 0.2.126 (2026-06-24) predates 0.2.127 and therefore predates riscv64 artifact availability.

**PyPI:** Not applicable - wasm-bindgen is a Rust/Cargo tool, not a Python package. `https://pypi.org/pypi/wasm-bindgen/json` returns HTTP 404; there is no such PyPI project.

**npm:** Not checked directly in this research; wasm-bindgen's CLI is not primarily distributed via npm (it is a Cargo/Rust tool). No npm-specific claim is made here. Data not available: npm registry was not queried for a `wasm-bindgen` package.

**Maven, OCI:** Not applicable - no evidence of Maven or container-image distribution channels for this tool was found or expected given its nature as a native Rust CLI.

**Ubuntu 26.04 (resolute) apt:** No package named `wasm-bindgen` or `wasm-bindgen-cli` (the CLI binary) exists. Only eight `librust-*-dev` Cargo-source packaging packages exist (e.g. `librust-wasm-bindgen-dev`, `librust-wasm-bindgen-futures-dev`), which list riscv64 among their supported architectures, but these are source packages used to build *other* Rust software from source - not an installable standalone `wasm-bindgen` CLI binary.

**Arch Linux RISC-V port (archriscv.felixc.at):** `wasm-bindgen` is **not listed** in the package index. Separately, an unrelated project-reports note observed that Arch Linux's `archriscv` repo packages `wasm-bindgen`/`wasm-pack`/`wasm-tools`/`wasmer`/`wasmtime` for riscv64 in the context of researching a different project (wasm3) - this is a third-party Arch Linux port, not confirmed as an authoritative current package listing in this research's own direct archriscv query, and not RISE-funded work. Flagged as a discrepancy: direct archriscv index query in this research found no `wasm-bindgen` entry, while a separate cross-reference (from unrelated `project-reports/wasm3.md` research) asserted archriscv does package it. **[NEEDS VERIFICATION]**

**What a user must do to get a working binary on riscv64:** Download the release tarball from [GitHub Releases](https://github.com/wasm-bindgen/wasm-bindgen/releases) and verify against the published checksum (the only channel confirmed to work), or `cargo install wasm-bindgen-cli` and build from source on a riscv64 host (untested by upstream CI on riscv64 hardware).

## 9. Dependencies

wasm-bindgen's own root crate (`Cargo.toml`) has minimal dependencies (`cfg-if`, `once_cell`, optional `serde`/`serde_json`, and its own `wasm-bindgen-macro`/`-shared` crates) - none involve JIT backends, SIMD, numerics, crypto, or compression. The toolchain and build-time dependencies relevant to producing a working riscv64 binary are:

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / blocking issues |
|---|---|---|---|---|---|
| Rust | Build-dependency (critical) - compiler and `riscv64gc-unknown-linux-gnu` target, installed via `dtolnay/rust-toolchain@stable` in CI | Yes - `riscv64gc-unknown-linux-gnu` is used directly in the CI job | Not verified for wasm-bindgen's own test suite on riscv64 | N/A (toolchain, not a shipped artifact) | No riscv64-blocking issue found for wasm-bindgen's use of it |
| cargo | Build-dependency (critical) - invoked directly (`cargo build --manifest-path crates/cli/Cargo.toml --target riscv64gc-unknown-linux-gnu`) | Yes, used directly in CI | N/A | N/A | No riscv64-blocking issue found |
| GCC | Build-dependency (critical) - `gcc-riscv64-linux-gnu` cross-toolchain installed via apt, used as the linker (`CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER: riscv64-linux-gnu-gcc`) | Yes, installed and used directly in CI, no version pinned | N/A | N/A | No riscv64-blocking issue found; version is whatever Ubuntu's `ubuntu-latest` apt repo resolves to at CI run time (unpinned - a minor reproducibility gap) |
| OpenSSL | Build-dependency (critical) - the CI build uses `--features vendored-openssl` for the CLI release build | Yes, vendored (built from source as part of the Rust build), avoiding a system OpenSSL dependency for the release binary itself | Not verified | Used in the shipped 0.2.127+/0.2.128 riscv64 release binaries | No riscv64-blocking issue found in this research |
| walrus (`rustwasm/walrus`, v0.27.2) | WASM binary IR transform library used by `wasm-bindgen-cli-support` - closest analog to a bytecode-manipulation toolchain dependency | Pure Rust crate, no architecture-specific code found; not independently verified on riscv64 | Not verified (no riscv64 CI matrix entry found in this repo) | crates.io only, not release-blocking | None found via search |
| wasm-tools / wasmparser (`bytecodealliance/wasm-tools`, v0.245) | WASM binary parser used by `wasm-bindgen-cli` and `-cli-support` | Not independently verified (project-graph query unavailable, see below) | Not verified | crates.io only | Listed in `projects.yml` but has no dedicated status report; no riscv64-specific issue found via search |
| rustls | Default TLS backend for `ureq` in `wasm-bindgen-cli` (`rustls-tls` feature, default) | Pure Rust; optional `aws-lc-rs`/`ring` backends carry per-architecture assembly which is the real risk area and was not independently verified here | Not verified | crates.io only | Listed in `projects.yml` but has no dedicated status report; no riscv64 issue found via search |
| native-tls (optional, `openssl`/`vendored-openssl` feature) | Alternate/legacy TLS backend, links system OpenSSL when not vendored | Depends on system OpenSSL packaging on riscv64, not independently confirmed here | Not verified | System-library dependent | A tangential issue (#211) concerns riscv32/ESP-IDF lacking native-tls support, not riscv64, and not this repo's blocking issue |
| ureq (v3, `brotli`+`gzip` features) | HTTP client used by the CLI for network operations | Pure Rust; no known riscv64 blockers surfaced | Not verified | crates.io only | None found via search |
| minicov (pinned `=0.3.8`) | LLVM coverage-instrumentation runtime, test-build only | `no_std`/embedded-focused crate; no riscv64-specific issue or CI entry found | Not verified | crates.io only | Repo's only open issue ("coverage report is empty," #9) is unrelated to architecture |

**Deep-dive note:** the project-graph MCP server (used for authoritative Ubuntu riscv64 package-graph queries) was unreachable for the entirety of this research (`CONNECTION_CLOSED`, confirmed on repeated retries). Package-availability claims for `walrus`, `wasm-tools`, `rustls`, `native-tls`, `ureq`, and `minicov` on riscv64 beyond what is stated above should be treated as unverified until that server is available and the queries are re-run. Of the toolchain-critical dependencies (Rust, cargo, GCC, OpenSSL), all four are directly and successfully exercised by the CI job that produces the riscv64 release binaries described in Section 8 - this is stronger evidence than a package-graph lookup, since it demonstrates an actual, checksum-verified working build.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific bugs or issues exist | N/A | N/A | Confirmed by repeated queries (`riscv`, `riscv64`, `risc-v`, `riscv64gc`, `riscv64gc-unknown-linux-gnu`) via `search_issues` and `search_commits` scoped to `wasm-bindgen/wasm-bindgen`: 0 issues, 0 commits beyond the one merged PR. A semantic-search false positive, [issue #1368](https://github.com/wasm-bindgen/wasm-bindgen/issues/1368) ("Index 114 is out of range for a slice of length 33", closed 2019), was checked and confirmed unrelated to RISC-V. |

**Correctness bugs:** None found. No open or closed issue in `wasm-bindgen/wasm-bindgen` references RISC-V correctness, riscv64 NaN/floating-point behavior, or riscv64 crashes.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. There is no recorded pushback, no RFC debate, and no rejected riscv64 proposal anywhere in the repository history.

**Technical blockers:** None identified as currently blocking. The build succeeds (verified via the checksummed, binary-inspected release artifact in Section 8). The main technical gap is the absence of test execution on riscv64 (Section 7), which is a coverage gap rather than a known blocker.

**Organizational blockers:** None found. Governance is informal and low-gatekeeping: the sole riscv64 PR was authored by a non-core contributor and merged same-day by a single core-team reviewer with one brief comment, consistent with the project's documented "full consensus, always assuming good faith" model.

**Acceptance probability (for future riscv64 work, e.g. adding test execution):** High, based on the precedent set by PR #5265 - the project has demonstrated willingness to accept RISC-V platform contributions that follow the existing convention (mirroring the aarch64 job pattern) with minimal review friction. No RISE or other organized effort is currently pursuing this, so it depends on a similar unsolicited community contribution recurring, or a funded initiative.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Justification:** Upstream CI cross-compiles the `wasm-bindgen-cli` binary for `riscv64gc-unknown-linux-gnu` in the `dist_linux_riscv64_gnu` job, but never executes the test suite or the produced binary (no `cargo test`, no QEMU, no native riscv64 runner), and this job is skipped entirely on pull-request-triggered CI runs, firing only on pushes to `main` or on tag pushes - see [`.github/workflows/main.yml`](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/.github/workflows/main.yml) lines 506-525. Per the color model's CI evidence rule, a job that builds riscv64 but does not run the test suite sets the primary color to yellow regardless of whether a release artifact is also published. Upstream does publish a genuine, checksum-verified riscv64 release binary via GitHub Releases starting with 0.2.127 (verified directly against [Release 0.2.128](https://github.com/wasm-bindgen/wasm-bindgen/releases)), which establishes `release_provider: upstream`, but does not raise the color above yellow because green and blue both require upstream CI that runs the test suite on riscv64, which does not exist here.
- This is not an optimization-purpose project (it is a bindings-generator tool, not a performance-critical numeric/crypto/codec library, per Section 4's finding that no architecture-specific hot-path code exists for any host architecture), so the Step 2 optimization modifier and Optimization level field do not apply.
- **Pending work that could change the grade:** No open PRs, no RISE involvement, and no tracking issue currently exist that would move this project past yellow (confirmed absent across GitHub search, riseproject.dev, the RISE wheel_builder page, and the `riseproject-dev` GitHub org - see Section 14). The grade would move to blue if the existing `dist_linux_riscv64_gnu` job were extended to run `cargo test` (or the equivalent native test suite) on riscv64, either via a native riscv64 runner or QEMU-based test execution; it would move to green additionally requiring nothing further, since upstream already publishes the release artifact.

## 14. Investment Analysis

RISE has done no work on wasm-bindgen: confirmed absent from the RISE blog (searched and reviewed the full available post index plus the closest WASM-adjacent post, "A Glimpse Into V8 Development for RISC-V," which does not mention wasm-bindgen), the RISE Python wheel_builder page (not applicable anyway, since wasm-bindgen has no PyPI package), the `riseproject-dev` GitHub org (no dedicated repo; the only two code-search hits are inside this same `sw-ecosystem` reports repository, one noting a third-party Arch Linux port and one listing wasm-bindgen as merely queued-but-unresearched), and issue searches across RISE working-group repos (0 results). All work items below are therefore fully unclaimed.

### 14.1 Functional Enablement

The functional build path already works and is upstream (Section 8). No functional-enablement work is needed for the CLI to build and run correctly enough to ship a release binary - this has already been demonstrated by the checksummed, binary-verified 0.2.128 riscv64 release.

### 14.2 Performance Optimization

Not applicable in the traditional sense - wasm-bindgen has no architecture-specific hot paths on any host CPU architecture (Section 4). No riscv64-vs-arm64/amd64 performance data exists for wasm-bindgen in any source checked (RISE blog, GitHub, web search) - this is a genuine documentation/benchmarking gap, not evidence of a performance problem, since the tool's own output (wasm32/wasm64 bytecode) does not vary by host architecture and the CLI itself is not a performance-sensitive component in typical build pipelines. No investment is recommended here absent a specific use case demonstrating a need.

### 14.3 CI/CD Infrastructure

This is the primary gap. Extending `dist_linux_riscv64_gnu` (or adding a parallel job) to actually execute `cargo test` on riscv64 - via a native riscv64 CI runner (e.g. a RISE-provided runner, referenced in RISE's "Announcing the RISE RISC-V Runners" blog post context found during research, though not connected to wasm-bindgen currently) or via QEMU user-mode emulation - would close the test-execution gap and is the single change that would move the project's color from yellow to blue. This also would let the existing build-only job catch regressions pre-release rather than only at tag-push time; making the job PR-gating (removing or loosening the current `if:` restriction) would close the "no pre-merge signal" gap identified in Section 3/7.

### 14.4 Ecosystem Enablement

Section 10 is omitted per the report rules: wasm-bindgen is a standalone CLI/library tool with no dependent package ecosystem (no PyPI, npm, Maven, or Kubernetes-operator-style consumer ecosystem requiring separate riscv64 enablement) - Section 9 already covers its own build/toolchain dependencies.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 test execution to `dist_linux_riscv64_gnu` (native runner or QEMU) so `cargo test` actually runs on riscv64, closing the yellow-to-blue gap | 2-4 | Upstream contributor or RISE-sponsored contribution | High |
| CI/CD | Make the riscv64 job (or a new test-only riscv64 job) run on pull requests, not only on `main`/tag pushes, to provide pre-merge signal | 1-2 | Upstream contributor | Medium |
| Build | Pin the `gcc-riscv64-linux-gnu` cross-toolchain and Rust toolchain versions used in the riscv64 CI job for reproducibility (currently unpinned, resolves to whatever `ubuntu-latest`/`rustup stable` provide at run time) | 0.5-1 | Upstream contributor | Low |
| Distribution | Investigate and, if warranted, resolve the Arch Linux `archriscv` packaging discrepancy noted in Section 8 [NEEDS VERIFICATION] | 0.5 | Upstream or distro maintainer | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [wasm-bindgen/wasm-bindgen repository](https://github.com/wasm-bindgen/wasm-bindgen)
- [PR #5265 - Add riscv64gc-unknown-linux-gnu release artifacts](https://github.com/wasm-bindgen/wasm-bindgen/pull/5265)
- [PR #5219 - Release 0.2.127 (folds in PR #5265's changelog entry)](https://github.com/wasm-bindgen/wasm-bindgen/pull/5219)
- [.github/workflows/main.yml (CI workflow, dist_linux_riscv64_gnu job)](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/.github/workflows/main.yml)
- [CHANGELOG.md](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/CHANGELOG.md)
- [GitHub Releases page (0.2.127, 0.2.128 riscv64 assets)](https://github.com/wasm-bindgen/wasm-bindgen/releases)
- [governance.md - project governance model](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/contributing/governance.md)
- [team.md - current Core Team and Collaborators](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/contributing/team.md)
- [browser-support.md - the only platform-support document found (JS/browser, not CPU architecture)](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/browser-support.md)
- [Issue #1368 - unrelated semantic-search false positive checked for RISC-V content](https://github.com/wasm-bindgen/wasm-bindgen/issues/1368)
- [PyPI JSON API for "wasm-bindgen" - HTTP 404, confirms no such package](https://pypi.org/pypi/wasm-bindgen/json)
- [Ubuntu 26.04 (resolute) package search for wasm-bindgen](https://packages.ubuntu.com/search?keywords=wasm-bindgen&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package index](https://archriscv.felixc.at/)
- [riseproject.dev homepage](https://riseproject.dev)
- [RISE blog - "A Glimpse Into V8 Development for RISC-V" (closest WASM-adjacent post, no wasm-bindgen mention)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [RISE Python wheel_builder coverage page](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISC-V Optimization Guide (riseproject.dev) - no WebAssembly/wasm-bindgen mention](https://riscv-optimization-guide.riseproject.dev/)
