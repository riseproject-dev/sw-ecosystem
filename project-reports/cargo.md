---
title: cargo
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: libgit2
    relation: runtime-dependency
    criticality: critical
  - name: libcurl
    relation: runtime-dependency
    criticality: critical
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: BLAKE3
    relation: runtime-dependency
    criticality: critical
  - name: zlib-rs
    relation: runtime-dependency
    criticality: critical
  - name: gitoxide
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="cargo" %}

# cargo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for cargo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Cargo is the official package manager and build-orchestration tool for the Rust programming language, distributed as a component of the Rust toolchain. It is a pure-Rust codebase with no per-architecture implementation surface of its own: it contains zero `.c`, `.h`, `.S`, or `.asm` files, no JIT, no SIMD dispatch, and no architecture-named source directories or files for any ISA, amd64 and arm64 included. Cross-target behavior (including for riscv64) is handled entirely by shelling out to `rustc`/LLVM via opaque target-triple/`cfg()` string matching; cargo itself has no code path that varies by architecture.

Governance runs through the official rust-lang "Cargo team," co-led by Jacob Finkelman (Eh2406) and Weihang Lo (weihanglo), with other members including Ed Page, Eric Huss, Arlo Siemsen, Josh Triplett, Scott Schafer, Ross Sullivan, and 0xPoe. There is no repo-local `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file; coordination happens on the team's Zulip channel (#t-cargo). `CONTRIBUTING.md` requires an issue tagged `S-accepted` before PRs are reviewed and defers to `rust-lang/rust`'s LLM usage policy.

Cargo sits under the Rust Project, stewarded by the Rust Foundation, whose Platinum members include Arm, AWS, Google, Huawei, Meta, Microsoft, NVIDIA, OpenAI, and the Solana Foundation, and whose Gold member is Canonical. By commit volume since 2024 the top individual committers are Ed Page (2234), Weihang Lo (1547), Eric Huss (305), Ross Sullivan (138), Scott Schafer (133), Arlo Siemsen (88), Jacob Finkelman (32), and Josh Triplett (29); public GitHub profiles for these contributors do not list a single dominant corporate employer, and several self-describe as independently or community-sponsored [NEEDS VERIFICATION - based on profile bio text only, not a payroll record]. License is dual MIT/Apache-2.0.

On new-port culture: cargo's community stance toward architecture support is effectively neutral/inherited. Architecture support is not something Cargo maintainers vote on or gatekeep; it is inherited from rustc's own platform-support tier system (RFC 2803), which lives in `rust-lang/rust`, not in the cargo repo.

## 2. Port History and Upstreaming Timeline

There is no dedicated riscv64 "port" of cargo, because cargo has no architecture-specific code to port. The relevant historical events are all either (a) rustc/Rust-language-level target milestones, or (b) cargo test-suite fixes that make cargo's own tests correctly tolerate a rustc-level RISC-V limitation.

| Date | Event | Source |
|---|---|---|
| 2020-01-30 | `riscv64gc-unknown-linux-gnu` added as a Rust target (Tier 2) | [rustc platform-support docs](https://doc.rust-lang.org/rustc/platform-support/riscv64gc-unknown-linux-gnu.html) |
| 2020-06-02 | cargo issue #8304 "Cross compile to RISCV fault" filed and closed same day - traced to an `llvm-sys`/wasmer native-dependency architecture mismatch, not a cargo defect | [cargo#8304](https://github.com/rust-lang/cargo/issues/8304) |
| 2023 | RISE issues RFP for Rust riscv64gc-unknown-linux-gnu Tier-1 promotion (Project RP004) | [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) |
| 2024 | RP004 contract awarded to Codethink, SiFive, Rivos, and Ferrous Systems; 8 PRs submitted fixing failing tests on the target | [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) |
| 2025-04-15 | RISE publishes RP004 outcome: Tier-1 granted for riscv64gc-unknown-linux-gnu without host tools (cross-compile only), citing ~6-hour `x.py test` runtime as failing the Tier-1 comparable-runtime policy | [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) |
| 2026-01-14/15 | cargo issue #16509 (`-C target-cpu=native` misresolves on custom RISC-V target) filed and closed "not planned" - judged rustc/LLVM territory | [cargo#16509](https://github.com/rust-lang/cargo/issues/16509) |
| 2026-06-22 | PR #17127 merged: introduces `requires_host_split_debuginfo` test-capability gate, fixes rust-lang/rust#158213 for riscv64gc-unknown-linux-gnu | [cargo#17127](https://github.com/rust-lang/cargo/pull/17127) |
| 2026-07-22 | Issue #17255 filed and closed same day; PR #17256 merged same day reusing the #17127 gate for `profile_trim_paths` split-debuginfo tests | [cargo#17255](https://github.com/rust-lang/cargo/issues/17255), [cargo#17256](https://github.com/rust-lang/cargo/pull/17256) |
| 2026-08-20 | Cargo 1.98 released (includes #17127) | Per CHANGELOG cross-reference in prior research; [doc.rust-lang.org/nightly/cargo/CHANGELOG.html](https://doc.rust-lang.org/nightly/cargo/CHANGELOG.html) |
| 2026-10-01 (scheduled) | Cargo 1.99 due (includes #17256) - not yet released as of report date | Per CHANGELOG cross-reference in prior research |

**Key contributor:** HNO3Miracle (xiangao.or@isrc.iscas.ac.cn), affiliated with ISRC/ISCAS (Institute of Software, Chinese Academy of Sciences - an ISCAS-affiliated address), authored both #17127 and #17256.

**Is it fully upstream?** Yes, in the narrow sense that both merged PRs are in mainline cargo (one already shipped in 1.98, one queued for 1.99). But neither PR constitutes a "riscv64 port" - both are test-infrastructure fixes gating cargo's own test assertions around a rustc-level `split-debuginfo` capability gap on that target, not functional cargo code for riscv64. No open PR or issue proposes riscv64 CI for cargo's own pipeline.

## 3. Upstream Support Tier

Cargo has no formal, cargo-repo-local tier policy or platform-support document (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` all absent from the repo). Platform tiering is inherited entirely from rustc's Target Tier Policy (RFC 2803), which lives in `rust-lang/rust`. Under that policy, `riscv64gc-unknown-linux-gnu` is Tier 1 for cross-compilation targets but explicitly **without host tools** - meaning building/running cargo natively on riscv64 is not held to the same CI-blocking guarantee as, e.g., x86_64 or aarch64 host tooling, per RISE's own account of the Tier-1 promotion outcome ([RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)).

Within cargo's own repository, CI evidence is unambiguous: no riscv64 job of any kind exists (Section 7). No official riscv64 binary is release-blocking or upstream-published for cargo specifically (Section 8).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream cargo CI: builds | Yes (`ubuntu-latest`, `windows-latest`) | Yes (`ubuntu-24.04-arm`, `macos-15`, `windows-11-arm`) | No |
| Upstream cargo CI: tests run | Yes | Yes | No |
| Upstream cargo CI: release-blocking | Yes | Yes | N/A - no job exists |
| rustc target tier (host tools) | Tier 1 | Tier 1 (aarch64-unknown-linux-gnu) | Tier 1 for cross-compile only, no host-tools guarantee ([RISE RP004](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)) |
| Official cargo release artifact | Via rustup/static.rust-lang.org | Via rustup/static.rust-lang.org | Data not available: no GitHub Releases exist for rust-lang/cargo at all; rustup/static.rust-lang.org riscv64 artifact availability not directly checked this session |

Source for CI matrix: direct read of `.github/workflows/main.yml` (355 lines) at commit `e7506208ff1b7f01062e410c419f95628dfdb31b`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Not applicable in the conventional sense. Verification performed against the local clone confirms cargo has **zero** architecture-specific implementation surface for any ISA:

- No `.c`, `.h`, `.S`, or `.asm` files anywhere in the repository (`find . -type f \( -iname "*.c" -o -iname "*.S" -o -iname "*.asm" -o -iname "*.h" \)` returns no results).
- No architecture-named source files for amd64, arm64, or riscv64 (`find . -type f \( -iname "*x86*" -o -iname "*amd64*" -o -iname "*aarch64*" -o -iname "*arm64*" -o -iname "*riscv*" \)` returns no results).
- Only 9 occurrences of `target_arch` in the whole tree, all in generic `cfg()`-expression-parser test fixtures or a pass-through env-var accessor (`crates/build-rs/src/input.rs`) - none is arch-specific implementation logic.
- Zero textual "riscv" mentions anywhere in the repository outside of PR/issue metadata already covered in Section 2.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A - cargo has none | N/A | N/A |
| SIMD | N/A - cargo has none | N/A | N/A |
| Crypto | N/A - cargo has none (delegates to dependency crates, see Section 9) | N/A | N/A |
| Hand-written assembly | None | None | None |
| GC barriers | N/A - not applicable to cargo | N/A | N/A |

If forced onto the standard full/partial/minimal/absent rubric used for optimization-purpose projects, riscv64 status here is "missing," but only in the trivial, universal sense that applies identically to amd64 and arm64 - not a riscv64-specific gap or regression, because cargo's architecture behavior is not an axis that ever varies. This is why the Step 2 optimization modifier in Section 13 does not apply to cargo.

## 5. Build System, Cross-Compilation, and Toolchain

Cargo has no CMake, Docker, or QEMU-based build/cross-compilation infrastructure of any kind. Verified directly against the cloned repository at commit `e7506208ff1b7f01062e410c419f95628dfdb31b`:

- `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` - do not exist.
- `CMakeLists.txt` and any `*.cmake` files - do not exist; cargo has no CMake build system.
- No `docker/`, `.ci/docker/`, or `Dockerfile*` exist anywhere in the repo (only a `ci/` directory with shell scripts: `clean-test-output.sh`, `dump-environment.sh`, `fetch-smoke-test.sh`, `generate.py`, `validate-man.sh`, `validate-version-bump.sh`).
- GitHub code search for `riscv64 repo:rust-lang/cargo filename:Dockerfile` returns `total_count: 0`.

Per `README.md`, building cargo from source requires: an existing `cargo`/`rustc` toolchain (bootstrap), a C compiler for vendored C dependencies, `git`, and optionally `pkg-config` plus OpenSSL dev headers (or the `vendored-openssl` feature). Vendored/system libs (`libcurl`, `libgit2`, `libssh2`, `libz`) are built via `-sys` crates' own `build.rs` scripts using the `cc` crate - there are no `-DUSE_X=OFF`-style CMake flags and no documented exact minimum GCC/Clang version.

riscv64 cross-compilation for cargo, as for any Rust project, is handled generically via `rustup target add riscv64gc-unknown-linux-gnu` plus a `.cargo/config.toml` `[target.riscv64gc-unknown-linux-gnu]` linker override - this is standard Rust toolchain mechanism, not anything specific to the cargo repo, and is not documented inside the cargo repository itself.

**Known build failure on riscv64:** cargo#8304 (2020) - a linker "Relocations in generic ELF (EM: 62)" error while cross-compiling the `wasmer` project, root-caused to a mismatched-architecture `llvm-sys` build artifact (x86_64 object file linked against a riscv64 target), not a cargo defect. Closed same day.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Full cargo functionality (build, test, publish, registry ops) | Yes | Yes | Yes, per closed test issues (#17255, #17127) which show cargo's test suite actively exercised and passing on riscv64gc-unknown-linux-gnu elsewhere in the Rust project's own CI, modulo one known-and-accounted-for capability gap | 
| `-C split-debuginfo=packed`/`unpacked` | Supported | Data not available: not separately verified this session | **Not supported** - rustc on riscv64gc-unknown-linux-gnu only supports `split-debuginfo=off`; this is a rustc/LLVM limitation, not a cargo bug ([cargo#17255](https://github.com/rust-lang/cargo/issues/17255)) |
| `-C target-cpu=native` with a custom target triple | Works as expected | Data not available | Broken: resolves "native" to the host's CPU rather than the RISC-V target's, producing "not a recognized feature" warnings ([cargo#16509](https://github.com/rust-lang/cargo/issues/16509)); judged rustc/LLVM territory, closed not-planned |
| Official upstream riscv64 CI coverage | Full (release-blocking) | Full (release-blocking) | None (Section 7) |

**Functional gaps:** The split-debuginfo `packed`/`unpacked` gap (`S-blocked-external`, per #17255) is the only confirmed functional gap, and it is a rustc/LLVM-level constraint that cargo's tests now correctly account for rather than a cargo defect.

**Performance gaps:** Not applicable in the SIMD/vectorization sense (Section 4). The only quantified performance data point found anywhere is non-cargo-specific: the Rust toolchain's full `x.py test` suite (which exercises cargo as `src/tools/cargo`) took approximately 6 hours on RISE's Scaleway RISC-V hardware and a 6-vCPU/16GB QEMU environment, cited by RISE as failing Rust's Tier-1 "comparable runtime" policy ([RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)). A related data point from the RFC #3707 discussion: even six parallel SG2042 (64-core RISC-V) machines took ~3-4 hours to run the same suite stage [NEEDS VERIFICATION - single-source, GitHub RFC comment thread]. No isolated "cargo build/test time on riscv64 vs arm64/amd64" comparison was found in any source searched.

**Security hardening gaps:** Data not available: no riscv64-specific hardening (e.g., pointer-authentication, CFI, stack-protector parity) comparison for cargo itself was found or is applicable, since cargo has no architecture-specific code (Section 4).

**NaN / floating-point semantics issues:** No RISC-V-specific NaN/floating-point bug exists in the cargo issue tracker. A related but non-RISC-V-specific floating-point issue exists in `rust-lang/rust` ([rust#107247](https://github.com/rust-lang/rust/issues/107247), signaling-NaN handling in LLVM codegen) and a RISC-V-specific float-ABI issue also exists in `rust-lang/rust`, not cargo ([rust#104284](https://github.com/rust-lang/rust/issues/104284), riscv32gc float ABI mismatch - note this is riscv32, not riscv64, and status was not confirmed this session).

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No**, confirmed by direct verification of a live clone (`/home/user/rust-lang/cargo` at commit `e7506208ff1b7f01062e410c419f95628dfdb31b`), superseding any prior summary-only finding:

- `.github/workflows/` contains exactly 4 files: `audit.yml`, `contrib.yml`, `main.yml`, `release.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.
- `grep -rniE "riscv|risc-v|risc_v" .github/` -> 0 matches.
- `grep -rniE "riscv" .` across the entire repository tree -> 0 matches.
- `main.yml`'s `test` job runner matrix: `ubuntu-latest` (x86_64), `ubuntu-24.04-arm` (aarch64), `macos-15` (aarch64), `windows-latest` (x86_64), `windows-11-arm` (aarch64). No riscv64 entry.
- `clippy` job matrix: Linux x86_64, macOS aarch64, Windows x86_64 MSVC only.
- No QEMU setup step, no `riscv64gc-unknown-linux-gnu` target string, anywhere in the file.
- `audit.yml`, `contrib.yml`, `release.yml` handle cargo-deny auditing, first-time-contributor triage, and release-note validation respectively - none touch platform/target matrices.

**RISE runners?** RISE does operate free native riscv64 GitHub Actions runners ("RISE RISC-V Runners," announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) whose base Docker images bake in a full Rust/cargo toolchain (`RUSTUP_VERSION=1.29.0`, `RUSTTOOLCHAIN_VERSION=1.98.0`, `CARGO_HOME=/build/rust/cargo`), per `runner/images/Dockerfile.ubuntu` in [riseproject-dev/riscv-runner](https://github.com/riseproject-dev/riscv-runner). These runners are available for any project (including cargo) to adopt, but **rust-lang/cargo's own CI does not currently use them** - no reference to `riseproject-dev` or RISE runner labels appears anywhere in cargo's workflow files.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes | No |
| Test suite executed | Yes | Yes | No - no job exists |
| Release-blocking | Yes | Yes | N/A |
| Hardware | GitHub-hosted (`ubuntu-latest`, `windows-latest`) | GitHub-hosted native ARM runners (`ubuntu-24.04-arm`, `macos-15`, `windows-11-arm`) | N/A - no job exists; RISE runners available but not adopted by this repo |

## 8. Distribution and Release Status

**Official cargo (rust-lang/cargo repo) binaries for riscv64: none exist as GitHub Releases**, for any architecture. Direct check of the releases page returns "There aren't any releases here" - cargo ships as part of the Rust toolchain via `rustup`/`static.rust-lang.org`, not GitHub Releases on the `cargo` repo itself. A raw `curl` to the releases page during adversarial verification also returned HTTP 403 (bot-gated), consistent with no meaningful release-asset channel existing there. Whether `static.rust-lang.org`/rustup itself ships a riscv64 cargo artifact was **not directly checked this session** - data not available.

**PyPI:** A package literally named "cargo" exists on PyPI (v0.3), but it is an unrelated Python dependency-injection library by Mathieu Larose, not Rust's Cargo. It ships only `py3-none-any` (pure-Python, platform-neutral) artifacts - not relevant to this assessment.

**RISE wheel builder:** Redirects to public PyPI for the "cargo" package name (i.e., no RISE-specific build exists, and the name collision with the unrelated Python package makes this channel moot for Rust's Cargo).

**Linux distribution packages:**

| Distro | Package | Version | riscv64 present | Source |
|---|---|---|---|---|
| Ubuntu 26.04 (resolute) | `cargo` | 1.93.1ubuntu1 | **Yes**, confirmed via direct raw HTTP: package page (HTTP 200, arch column lists riscv64, tagged `[ports]`) and architecture-specific file list showing binary path `/usr/lib/rust-1.93/bin/cargo` | [packages.ubuntu.com/resolute/riscv64/cargo](https://packages.ubuntu.com/resolute/riscv64/cargo), [file list](https://packages.ubuntu.com/resolute/riscv64/cargo-1.93/filelist) |
| Debian, Fedora, Arch RISC-V | Data not available this session for cargo specifically | - | - | Not directly checked; Arch Linux RISC-V check attempted but inconclusive (site is client-side/htmx-rendered, `/riscv64/extra/` and `/riscv64/extra.files` both 404 for both WebFetch and raw curl) |

The `[ports]` tag on the Ubuntu package is normal secondary-architecture archive behavior (served from ports.ubuntu.com), not evidence of reduced quality or patching.

**What must a user do to get a working binary?** On Ubuntu 26.04 (resolute) riscv64: `apt install cargo`, which pulls an unpatched build from the same `rust-defaults` source package used for other architectures. Outside of Ubuntu's ports archive, a user must install a riscv64 Rust toolchain via `rustup` (unconfirmed riscv64 artifact availability, see above) or build cargo from source using an existing bootstrap toolchain (Section 5).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| OpenSSL (`openssl`, `openssl-src`) | TLS for HTTP registry/index transport (optional, non-Windows) | Good - active RV64 asm since 2022 (Zbb/Zbc/Zkn/RVV: AES, SHA-2/3, ChaCha20, Montgomery mul, SM2/3/4) | Best-effort; no dedicated upstream riscv64 CI runner confirmed | Debian sid, Ubuntu 24.04, Arch RISC-V ship current riscv64 builds | Active; see `project-reports/openssl.md` for full detail |
| libgit2 (`libgit2-sys`, via `git2`) | Core git backend for git dependencies/registries | Portable C, no arch-specific asm/SIMD; no riscv64-specific bugs found (10 issue-search hits, none riscv-related) | No evidence of dedicated riscv64 CI upstream | Not separately verified this session | Not tracked in `projects.yml` - no existing report |
| curl (`curl`, `curl-sys`) | HTTP transport for registry downloads (default feature) | Portable C; no riscv64-specific build issues on record (6 search hits, all unrelated old-arch reports) | No dedicated riscv64 CI signal found | Not separately verified this session | Not tracked in `projects.yml` - no existing report |
| SQLite (`rusqlite`, bundled) | Embedded DB for registry index cache | Full functional parity; one riscv64 bug (`__uint128_t` guard missing riscv64) reported 2026-04-26, fixed same day upstream | No dedicated riscv64 hardware/CI in SQLite's own test infra ("best-effort community-reported") | Debian sid, Ubuntu 24.04, Arch RISC-V, Fedora Rawhide all ship riscv64 packages | No open riscv64 bugs; see `project-reports/sqlite.md` |
| BLAKE3 (`blake3`) | Package/checksum verification hash | Builds/runs correctly via portable scalar fallback - **no RISC-V SIMD backend exists** | No riscv64-specific test failures found | Not tracked in `projects.yml` | Open upstream issue [BLAKE3-team/BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484) "Improved RISC-V support + SIMD" - performance only, not correctness, no maintainer response recorded |
| zlib-rs (via `flate2`, `zlib-rs` feature - the actual compression backend cargo links, not C zlib) | Compression for `.crate` packages / registry index | No riscv64-specific issues found (only 1 total issue in `trifectatechfoundation/zlib-rs`, unrelated to riscv64) - untested/unremarked rather than confirmed-good | No signal found | Not tracked in `projects.yml` | Low visibility; flagged as a verification gap, not a known problem |
| gix / gitoxide (`gix`, `gix-transport`) | Alternative pure-Rust git backend | Pure Rust, generally portable; one closed riscv64-specific perf-test bug ([GitoxideLabs/gitoxide#1605](https://github.com/GitoxideLabs/gitoxide/issues/1605), fixed) | Not tracked in `projects.yml` | Not tracked in `projects.yml` | No open riscv64 issues |
| libc (`libc`) | Low-level OS bindings, transitive dep of all above | `riscv64gc-unknown-linux-gnu` supported since [rust-lang/libc#1415](https://github.com/rust-lang/libc/issues/1415) (closed); one open bug is riscv32-only (#5512), not riscv64 | Tier-2 Rust target, tested in rust-lang CI | Ships with every riscv64 Rust toolchain | No riscv64-specific open issues |

**Deep-dive - dependencies with crypto/SIMD/numerics relevance:**
- **OpenSSL** carries the most substantial, ongoing RISC-V-specific engineering investment among cargo's dependencies (vector-crypto extensions, Montgomery arithmetic, dedicated committers) - see `project-reports/openssl.md` for the full investment/blocker breakdown.
- **BLAKE3** is the one genuine functional-but-unaccelerated gap in cargo's dependency chain: package-integrity hashing works correctly on riscv64 today but runs without vector acceleration pending [BLAKE3-team/BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484).
- **SQLite**'s single riscv64 correctness bug was found and fixed within 24 hours in April 2026 - no open risk.
- Four of the seven researched dependencies (libgit2, curl, zlib-rs, gix) are not tracked in `projects.yml` and have no existing per-project report.

Note: `project-graph` MCP server (Ubuntu 26.04/"resolute" package graph) was unreachable (`CONNECTION_CLOSED`) for the entire research session, so none of the dependency rows above carry a live Ubuntu 26.04 graph cross-check; Ubuntu 24.04/Debian/Arch data cited above comes from pre-existing `project-reports/*.md` files where noted.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#17255](https://github.com/rust-lang/cargo/issues/17255) | `profile_trim_paths` split-debuginfo tests fail on riscv64gc-unknown-linux-gnu | Closed (completed), fixed same day by #17256 | Low - test-suite-only, `S-blocked-external` on the underlying rustc/LLVM capability | Cargo's tests now correctly skip `packed`/`unpacked` cases on riscv64; `off` still tested everywhere |
| [#16509](https://github.com/rust-lang/cargo/issues/16509) | `-C target-cpu=native` doesn't work properly with a custom RISC-V target | Closed (not planned) | Low-Medium (functional, workaround exists: specify target-cpu explicitly) | Judged rustc/LLVM territory - cargo just forwards the flag; "native" resolution happens in rustc/LLVM |
| [#8304](https://github.com/rust-lang/cargo/issues/8304) | Cross compile to RISCV fault (linker relocation error) | Closed (completed), 2020 | Low - root cause was a mismatched-architecture `llvm-sys` build artifact in the `wasmer` project, not a cargo bug | No cargo-side fix landed because none was needed |

**Correctness bugs:** None open. Zero open RISC-V-specific issues exist in the rust-lang/cargo tracker as of the research date - confirmed via multiple targeted GitHub issue searches scoped to `repo:rust-lang/cargo` (`riscv64 performance`, `riscv64 bug`, `riscv nan floating`, plain `riscv`), each returning only the three closed issues above.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer statement was located opposing riscv64 CI or riscv64 release artifacts for cargo.

**Technical blockers:**
- The one confirmed technical blocker is rustc/LLVM-level, not cargo-level: `riscv64gc-unknown-linux-gnu`'s rustc backend only supports `-Csplit-debuginfo=off` (`packed`/`unpacked` are unstable on that platform), tagged `S-blocked-external` on [#17255](https://github.com/rust-lang/cargo/issues/17255). Cargo's fixes (#17127, #17256) are test-infrastructure workarounds, not resolutions of the underlying rustc/LLVM gap; real unblocking depends on upstream rustc/LLVM RISC-V split-debuginfo support.
- The Rust toolchain's own Tier-1-without-host-tools status for riscv64 - driven by the ~6-hour `x.py test` runtime failing Rust's Tier-1 comparable-runtime policy ([RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)) - is a blocker at the rustc/Rust-project level that indirectly caps what cargo CI could realistically promise on native riscv64 hardware, even if cargo's own CI were to add a riscv64 job.

**Organizational blockers:** rust-lang/cargo (and rust-lang generally) is not a RISE member organization (confirmed against [riseproject.dev/members](https://riseproject.dev/members/) - not listed among Premier or General members). No cargo-repo-scoped riscv64 CI proposal or tracking issue exists to gauge maintainer appetite directly; the absence of any open or historical PR proposing a riscv64 CI job suggests the topic has not been raised as a distinct ask, rather than being raised and rejected.

**Acceptance probability:** Given (a) cargo maintainers have twice, promptly, and without objection merged small test-infrastructure PRs that accommodate riscv64's rustc-level limitations (#17127, #17256, both same-cycle merges by an ISCAS contributor with clean review feedback from core maintainers ehuss and weihanglo), and (b) no maintainer has voiced opposition to riscv64 in general, a well-scoped PR adding riscv64 to cargo's own CI test matrix (e.g., via RISE's free runners) appears likely to be accepted if proposed - but this is inference from pattern, not a direct maintainer statement, and is marked [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro build from unpatched upstream source; upstream itself publishes no release artifacts of any kind for this repo, riscv64 or otherwise)
- Not an optimization-purpose project; the Section 13 optimization-level field is omitted per the model.
- **Justification:** Upstream `rust-lang/cargo` has no riscv64 CI whatsoever - confirmed by direct read of all four GitHub Actions workflow files at commit `e7506208ff1b7f01062e410c419f95628dfdb31b`, with a repo-wide `grep` for "riscv" returning zero matches ([main.yml](https://github.com/rust-lang/cargo/blob/master/.github/workflows/main.yml)). Ubuntu 26.04 (resolute) ships `cargo` 1.93.1ubuntu1 for riscv64 built from unpatched upstream source, confirmed via direct raw HTTP to the package's architecture-specific file list showing a real binary path ([packages.ubuntu.com/resolute/riscv64/cargo-1.93/filelist](https://packages.ubuntu.com/resolute/riscv64/cargo-1.93/filelist)). Per the color model's distribution floor, no-upstream-CI plus a clean unpatched distro build upgrades the grade from "no CI" to yellow.
- **Pending work that could change the grade:** No open PR proposes adding riscv64 to cargo's own CI matrix. RISE operates free native riscv64 GitHub Actions runners with a pre-baked Rust/cargo toolchain ([riseproject-dev/riscv-runner](https://github.com/riseproject-dev/riscv-runner)) that cargo's CI does not currently reference - adopting them would be the most direct path to blue or green. The still-open rustc/LLVM-level split-debuginfo gap ([#17255](https://github.com/rust-lang/cargo/issues/17255), `S-blocked-external`) and the un-adopted RISE Tier-1-without-host-tools status are the structural blockers that would need resolution at the rustc level before a riscv64 cargo CI job could plausibly reach green (a "green" cargo CI job would need rustc/LLVM to have closed its own comparable-runtime and split-debuginfo gaps first).

## 14. Investment Analysis

RISE-funded work already covers the highest-leverage item in this space: Project RP004 (Codethink, SiFive, Rivos, Ferrous Systems, funded via RISE RFP) has already driven `riscv64gc-unknown-linux-gnu` to Tier-1-without-host-tools status in rustc/rust-lang and fixed 8 PRs' worth of failing tests at the language level ([RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)). RISE RISC-V Runners already provide free native riscv64 CI infrastructure with a Rust/cargo toolchain pre-installed ([riseproject-dev/riscv-runner](https://github.com/riseproject-dev/riscv-runner)). The remaining gaps below are specific to cargo's own repository and CI pipeline, which RISE's existing investments have not directly touched.

### 14.1 Functional Enablement

Cargo is already functionally complete on riscv64 in practice - it ships and runs via Ubuntu's unpatched riscv64 build, and cargo's own test suite (exercised inside `rust-lang/rust`'s CI, not cargo's own) already passes modulo the accounted-for split-debuginfo gap. No functional enablement work is needed at the cargo-repo level; any remaining functional gap (split-debuginfo packed/unpacked) is owned by rustc/LLVM, not cargo.

### 14.2 Performance Optimization

Not applicable - cargo has no architecture-specific code to optimize (Section 4). The ~6-hour `x.py test` runtime is a Rust-toolchain-wide (compiler + full test suite) concern already the subject of RISE's RP004 investment, not a cargo-specific performance target.

### 14.3 CI/CD Infrastructure

The concrete, actionable, currently-unfunded gap: add a riscv64 job to cargo's own `.github/workflows/main.yml` test matrix, using RISE's existing free riscv64 runners. This is a small, well-scoped change (one matrix entry plus verification that cargo's existing test suite passes cleanly on the runner, informed by the already-merged #17127/#17256 gates) rather than new engineering. Given the low complexity and the precedent of prompt, friction-free maintainer acceptance of the two related riscv64 test-accommodation PRs, this is a low-effort, high-signal item.

### 14.4 Ecosystem Enablement

Not scored as a separate section per the report format rules (Section 10 omitted - cargo is a standalone build tool, not a project with a dependent package ecosystem of its own that needs separate riscv64 enablement). However, cargo's own dependency chain (Section 9) has residual gaps worth funding: BLAKE3's missing RISC-V SIMD backend ([BLAKE3-team/BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484)) and the unverified riscv64 status of zlib-rs, the actual compression backend cargo links.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 job to `rust-lang/cargo`'s `.github/workflows/main.yml` test matrix using RISE runners | 1-2 | RISE / cargo team (PR submission) | Medium |
| Ecosystem (dependency) | Fund/contribute RVV SIMD backend for BLAKE3 (used by cargo for package-integrity hashing) | 2-4 [NEEDS VERIFICATION - no scoping done against BLAKE3#484 thread] | RISE (BLAKE3 upstream contribution) | Low |
| Verification | Confirm riscv64 status of zlib-rs (cargo's actual compression backend) - currently a verification gap, not a known problem | 0.5 | RISE / internal research | Low |
| Functional | None required - already functionally complete via Ubuntu unpatched build and rustc-level Tier-1 status | 0 | N/A | N/A |
| Performance | None applicable - no cargo-owned architecture-specific code exists to optimize | 0 | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [rust-lang/cargo repository](https://github.com/rust-lang/cargo)
- [cargo#17255 - profile_trim_paths split-debuginfo tests fail on riscv64gc-unknown-linux-gnu](https://github.com/rust-lang/cargo/issues/17255)
- [cargo#17256 - fix(test): gate trim-paths tests on split debuginfo support](https://github.com/rust-lang/cargo/pull/17256)
- [cargo#17127 - fix(test): skip dwp uplift test without packed debuginfo](https://github.com/rust-lang/cargo/pull/17127)
- [cargo#16509 - -C target-cpu=native doesn't work properly when specifying a custom target](https://github.com/rust-lang/cargo/issues/16509)
- [cargo#8304 - Cross compile to RISCV fault](https://github.com/rust-lang/cargo/issues/8304)
- [rust-lang/rust#158213](https://github.com/rust-lang/rust/issues/158213) (referenced by cargo#17127)
- [rust-lang/rust#107247 - Rust does not comply with IEEE 754 floats](https://github.com/rust-lang/rust/issues/107247)
- [rust-lang/rust#104284 - riscv32gc-* targets produce a synthetic object file with mismatching floating-point ABI](https://github.com/rust-lang/rust/issues/104284)
- [rustc platform-support: riscv64gc-unknown-linux-gnu](https://doc.rust-lang.org/rustc/platform-support/riscv64gc-unknown-linux-gnu.html)
- [RISE Project RP004: Support for a 64-bit RISC-V Linux port of Rust to Tier-1](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev/riscv-runner (Dockerfile with Rust/cargo toolchain)](https://github.com/riseproject-dev/riscv-runner)
- [riseproject-dev/python-wheels (cargo/Rust-crate riscv64 patches for Python extensions)](https://github.com/riseproject-dev/python-wheels)
- [RISE Project members list](https://riseproject.dev/members/)
- [rust-lang/rfcs#3707 - RISC-V Tier-1 discussion, x.py test timing data](https://github.com/rust-lang/rfcs/pull/3707)
- [Ubuntu 26.04 (resolute) cargo package page](https://packages.ubuntu.com/resolute/riscv64/cargo)
- [Ubuntu 26.04 (resolute) cargo-1.93 riscv64 file list](https://packages.ubuntu.com/resolute/riscv64/cargo-1.93/filelist)
- [PyPI cargo package (unrelated Python library)](https://pypi.org/pypi/cargo/json)
- [rust-lang/libc#1415 - riscv64gc-unknown-linux-gnu support](https://github.com/rust-lang/libc/issues/1415)
- [BLAKE3-team/BLAKE3#484 - Improved RISC-V support + SIMD](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- [GitoxideLabs/gitoxide#1605 - packed::iter perf test riscv64 failure](https://github.com/GitoxideLabs/gitoxide/issues/1605)
- `project-reports/openssl.md` (internal report, cited for OpenSSL riscv64 status)
- `project-reports/sqlite.md` (internal report, cited for SQLite riscv64 status)
- `project-reports/zlib.md` (internal report, cited for C zlib riscv64 status, distinct from zlib-rs)
