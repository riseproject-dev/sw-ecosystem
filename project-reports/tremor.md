---
title: Tremor
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="tremor" %}

# Tremor

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Tremor<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Tremor (tremor-rs/tremor-runtime) is an event-processing / stream-processing runtime written entirely in Rust, distributed under the Apache License 2.0. It is a [CNCF Early Stage Sandbox project](https://github.com/tremor-rs/tremor-runtime) in the "Streaming & Messaging" category, credited to The Linux Foundation. The project originated at Wayfair before its donation into the CNCF sandbox [NEEDS VERIFICATION - not independently re-confirmed in repo docs].

Governance rests on three stated pillars (per tremor.rs/community/governance/): CNCF/Linux Foundation Core Infrastructure Initiative best practices, a Linux-kernel-style development process, and a Rust-community-style engagement model. In practice, governance is thin: the only in-repo governance artifact is a flat `CODEOWNERS` file naming a single "core team" tier with no per-path or per-tier structure:

```
*   @anupdhml @darach @Licenser @mfelsche @skoech
```

Top contributors by commit count: Heinz N. Gies (@Licenser, 1,540 commits, historically lead architect), Matthias Wahl (@mfelsche, 822 commits), Darach Ennis (@darach, company: Squircle Systems Ltd), Anup Dhamala (@anupdhml, 104 commits, CodeforNepal/kahaco), Sharon Koech (@skoech). No ADOPTERS.md, SPONSORS.md, or public corporate-sponsor list exists beyond a Netlify credit for doc hosting.

On architecture portability, the community culture observed in the one relevant issue thread is receptive-but-unresourced: maintainer Licenser has acknowledged a riscv64-blocking dependency issue as a "good idea" but stated "can't make promises as to when we'd get to it" ([issue #2265](https://github.com/tremor-rs/tremor-runtime/issues/2265), comment 2023-03-26). No community member has filed a tracking issue or PR for a riscv64 port itself.

Tremor is **not** a RISE (RISC-V Software Ecosystem) member. The full RISE member list (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE), fetched from [riseproject.dev/members](https://riseproject.dev/members/), contains no entry for Tremor.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 port has ever been started, proposed as a tracking issue, or upstreamed. | Exhaustive search of issues/PRs/commits/code, see Section 11 and 12. |

No key contributors exist for a riscv64 port because no such work has been attempted. The single dependency-bump PR that surfaces in "riscv" searches, [PR #1373 "Bump serde from 1.0.131 to 1.0.132"](https://github.com/tremor-rs/tremor-runtime/pull/1373) (merged 2021-12-17 by dependabot, approved by Licenser), is unrelated to Tremor's own architecture support - it matched only because the pulled-in serde 1.0.132 changelog text (serde itself adding riscv64 atomic-type serialization) appears in the PR body. There is nothing to call "fully upstream" because nothing has been proposed.

## 3. Upstream Support Tier

There is no formal tier policy beyond the flat CODEOWNERS "core team" - any core team member's sign-off (`r+`) merges a PR, under a rebase-only (no merge-commit) policy. There is no per-architecture tier system (no "Tier 1/2/3" concept as seen in, e.g., Rust itself).

Evidence for the comparison below: all 17 workflow files in `.github/workflows/` were read directly at commit `bf4564193df81c01eab2b78bfed8a3e1c5765348`; `.drone.yml` was also read; `Cross.toml`, `Makefile`, and the `packaging/builder-images/` Dockerfiles were inspected.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Yes (all `ubuntu-latest`/`macos-latest` GitHub-hosted runners) | Yes, but only via `.drone.yml`'s `test-on-arm64` job on a native arm64 Drone runner | No |
| Upstream CI runs tests | Yes | Yes (native runner, `test-on-arm64`) | No (no job exists) |
| Release-blocking | Yes (`release.yaml` runs `make builds`/`make packages` on `ubuntu-latest`) | No (no arm64 job in `release.yaml`) | No (no job exists) |
| Official binaries published | Yes: `.rpm`, `.deb`, `x86_64-unknown-linux-gnu.tar.gz` per [GitHub releases](https://github.com/tremor-rs/tremor-runtime/releases) (verified v0.13.0-rc.33, v0.13.0-rc.29) | No (per [issue #2321](https://github.com/tremor-rs/tremor-runtime/issues/2321), maintainer states "github doesn't offer build infrastructure on arm") | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

GitHub code search for `cfg(target_arch`, `target_arch`, and `#ifdef __riscv` scoped to `tremor-rs/tremor-runtime` returned **zero matches for all three queries**. Rust's `cfg(target_arch = ...)` is the language's actual mechanism for architecture-conditional code (the equivalent of C's `#ifdef`); its total absence means Tremor has **no architecture-specific source files of any kind** - not for amd64, not for arm64, not for riscv64. There is no `arch/` directory, no per-arch module, no hand-written SIMD/intrinsics layer, no assembly. The codebase is entirely portable, generic Rust; whatever architecture-specific work exists lives one layer down, in dependencies (see Section 9), not in Tremor itself.

The only architecture-sensitive behavior in the Tremor codebase proper is in the **build configuration**, not the source: the main `Dockerfile`, `tests.yaml`/`integration.yaml` CI, and `packaging/cross_build.sh` all hardcode
```
RUSTFLAGS="-C target-feature=+avx,+avx2,+sse4.2 --cfg tokio_unstable"
```
for `simd-json` compilation. `avx`/`avx2`/`sse4.2` are x86-only ISA extensions with no arch-conditional branching to swap them out - passing this `RUSTFLAGS` unmodified against a riscv64 target triggers an immediate rustc "unrecognized/incompatible target feature" error.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned arch-specific code (any kind) | None (relies on LLVM/rustc default codegen; only RUSTFLAGS sets AVX2/SSE4.2 for simd-json) | None (per issue #2321, "should build" on NEON-capable systems, untested by CI) | None - and would not even build as-is, since the AVX2/SSE4.2 RUSTFLAGS are hardcoded with no riscv64 branch |
| SIMD (via simd-json dependency) | AVX2/SSE4.2 dispatch (source-verified in simd-json's `portability.rs`) | NEON dispatch | Falls through to simd-json's generic scalar path (gating covers only x86/x86_64/wasm32) |
| Crypto (via ring/rustls dependency) | Supported | Supported | Current pinned `ring 0.17.8` supports `riscv64gc-unknown-linux-gnu` (added pre-0.17.0); a stale transitive `ring 0.16.20` (pulled via `jsonwebtoken 7.2.0` for an optional cloud-connector auth path) predates riscv64 support - see Section 9 and 12 |

**Rating: riscv64 architecture-specific coverage = missing.** Not "scalar fallback" in the sense of a deliberate abstraction layer - there is no abstraction layer for any architecture in Tremor itself to grade a fallback against.

## 5. Build System, Cross-Compilation, and Toolchain

Tremor is a pure Cargo/Rust workspace (~25 crates: `tremor-connectors`, `tremor-interceptor`, `tremor-script`, `tremor-archive`, `tremor-pipeline`, etc.). There is no CMakeLists.txt anywhere in the tree (`find . -iname "CMakeLists*"` and `find . -iname "*.cmake"` both return zero results). `cmake` appears only as an `apt-get install` line in the main Dockerfile for building a C dependency (likely `rdkafka-sys`/`librdkafka`), not for Tremor's own build.

- **Toolchain:** `rust-toolchain` pins `channel = "1.82.0"`.
- **Official release target:** `Makefile`'s `RELEASE_TARGETS` has only `x86_64-unknown-linux-gnu` active; `x86_64-unknown-linux-musl` and `x86_64-alpine-linux-musl` are commented out. This is the only target the project officially releases.
- **`Cross.toml`:** defines custom builder images only for `x86_64-unknown-linux-musl`, `x86_64-alpine-linux-musl`, and `x86_64-unknown-linux-gnu`. No riscv64 entry, no generic cross-target config.
- **Builder images:** `packaging/builder-images/` contains 5 Dockerfiles, all named `Dockerfile.x86_64-*`. No riscv64 builder image exists.
- **QEMU:** zero usage anywhere in the repository (`grep -ril "qemu" .` returns nothing).

**Known/predictable build failure if riscv64 were attempted today:** the hardcoded `RUSTFLAGS="-C target-feature=+avx,+avx2,+sse4.2 ..."` (Section 4) would need to be made arch-conditional before a riscv64 `cargo build`/`cross build` could even proceed; this is not an existing tracked bug (no issue references it), it is a direct reading of the build scripts.

The project's actual precedent for a non-x86_64 target is arm64, handled via `.drone.yml`'s `test-on-arm64` job: a **native** arm64 Drone runner (`platform: arch: arm64`) with `RUSTFLAGS="-C target-cpu=native"` - i.e., "different native runner + different RUSTFLAGS," not QEMU cross-emulation, and this pattern exists only for arm64, not riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles at all (as-shipped build config) | Yes | Yes (per maintainer, untested by CI) | No - would fail immediately on the hardcoded AVX2/SSE4.2 `RUSTFLAGS` without manual intervention |
| Test suite executes | Yes (CI) | Yes (`test-on-arm64` Drone job) | Never attempted (no CI, no reported manual runs) |
| Official binary/package available | Yes (rpm/deb/tar.gz) | No | No |
| TLS/crypto stack builds | Yes | Yes | Current `ring 0.17.8` should build (riscv64gc support added pre-0.17.0); the stale transitive `ring 0.16.20` path (if reachable in a riscv64 build) would not - see Section 9 |

Functional gaps: none demonstrated as *impossible* on riscv64 (no RISC-V-exclusive missing feature identified), but nothing has been validated - the gap is entirely "untested," not "known-broken," with one exception (Section 5's RUSTFLAGS blocker, which is a concrete, unaddressed build-breaking configuration issue).

Performance gaps: simd-json (the core JSON engine used by nearly every Tremor crate) has no RVV (RISC-V Vector) acceleration - it falls back to a generic scalar parse/serialize path on riscv64 by design (SIMD dispatch gated only on x86/x86_64/wasm32 in simd-json's `portability.rs`, `numberparse.rs`, `stage2.rs`). No riscv64 performance numbers exist for Tremor from any source checked (GitHub search, web search, RISE blog) - Data not available: riscv64 vs amd64/arm64 benchmark figures for Tremor.

Security hardening gaps: Data not available: no riscv64-specific hardening (CFI, stack-clash, shadow stack) analysis exists for Tremor, as no riscv64 build has ever been produced to analyze.

NaN / floating-point semantics: Data not available: no issue, test, or code comment addresses RISC-V floating-point NaN-boxing or canonicalization behavior in Tremor or its direct dependencies; searches for "riscv nan floating" against the repository returned zero results.

## 7. CI/CD Infrastructure

**No riscv64 CI exists, in any form (build-only, test, QEMU-emulated, or native).** Verified by directly reading all 17 workflow files in `.github/workflows/` at commit `bf4564193df81c01eab2b78bfed8a3e1c5765348`, plus `.drone.yml`, and confirming the absence of `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml`.

| File | Trigger | Runner(s) | riscv mentions |
|---|---|---|---|
| checks.yaml | pull_request, push | ubuntu-latest (x6) | none |
| create-release.yaml | pull_request (closed/labeled) | ubuntu-latest | none |
| depandabot-auto-merge.yaml | pull_request_target | ubuntu-latest | none |
| doc-test.yaml | pull_request, push | ubuntu-latest-8-cores | none |
| docs.yaml | push | ubuntu-latest | none |
| draft-release.yaml | workflow_dispatch | ubuntu-latest | none |
| eqc.yaml | pull_request, push | ubuntu-latest (x2) | none |
| integration.yaml | pull_request, push | matrix: macos-latest, ubuntu-latest-8-cores + ubuntu-latest | none |
| licenses.yaml | schedule | ubuntu-latest | none |
| publish-crates.yaml | workflow_dispatch | ubuntu-latest (x7 jobs) | none |
| publish-edge.yaml | push | ubuntu-latest | none |
| publish-tags.yaml | push | ubuntu-latest | none |
| release.yaml | release: [published] | ubuntu-latest | none |
| security.yaml | schedule | ubuntu-latest | none |
| test-crates.yaml | pull_request, push | ubuntu-latest | none |
| tests.yaml | pull_request, push | ubuntu-latest-16-cores (x2), ubuntu-latest (x3), matrix by crate name | none |
| validate-packages.yaml | pull_request, push | ubuntu-latest | none |
| .drone.yml | (arm64 job) | native arm64 Drone runner | none |

Every `matrix:` block found (checks.yaml, integration.yaml, tests.yaml) varies over OS choice or crate/package name, never CPU architecture. No `docker/setup-qemu-action`, no `qemu` reference, no self-hosted riscv64 runner label, and no `riscv64gc-unknown-linux-gnu` (or any riscv target triple) appears anywhere. A repo-wide `grep -rin "riscv" .` (excluding `.git`) returns zero matches across the entire tree, not just CI.

No RISE runners are used; Tremor is not a RISE member (Section 1). No riscv64 hardware of any kind is used in this project's CI.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes (17 GH Actions workflows) | Yes (1 Drone job, native runner) | No |
| Tests run in CI | Yes | Yes | No |
| Release-blocking | Yes | No | No |

## 8. Distribution and Release Status

No official riscv64 binaries exist for Tremor, and in fact **no distribution package exists for Tremor at all, on any architecture**, outside upstream's own GitHub releases:

- **GitHub releases** (checked [v0.13.0-rc.33](https://github.com/tremor-rs/tremor-runtime/releases) and v0.13.0-rc.29 directly via the `expanded_assets` fragment, GitHub's REST API having returned 403 to unauthenticated session fetches): assets are `tremor-<ver>.x86_64.rpm`, `tremor-<ver>-x86_64-unknown-linux-gnu.tar.gz`, `tremor-cli_<ver>_amd64.deb`, plus source archives. x86_64 only, both releases.
- **PyPI:** `https://pypi.org/pypi/tremor/json` lists only `tremor-0.1-py3-none-any.whl` / `tremor-0.1.tar.gz`, described as a "Placeholder for private GA package" - this is an unrelated squatted/placeholder package, not tremor-rs's runtime, and carries no riscv64 artifact regardless.
- **RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tremor/` 302-redirects to public PyPI (no `tremor` package registered there); the RISE wheel builder's full package list (80+ packages) does not include Tremor.
- **Ubuntu** (checked "resolute"/26.04 and all-suites): `packages.ubuntu.com` search for `tremor` returns "Sorry, your search gave no results" in every case. The package does not exist in the Ubuntu archive at all.
- **Arch Linux RISC-V unofficial repo:** `https://archriscv.felixc.at/?q=tremor` returns no matching package.
- **README** states explicitly: "We do provide RPM, DEB and pre-compiled binaries (`x86_64` only) for each release."

**What a user must do to get a working riscv64 binary today:** there is no path. A user would need to (1) fix the hardcoded AVX2/SSE4.2 `RUSTFLAGS` (Section 5), (2) resolve the stale `ring 0.16.20` transitive dependency if that path is compiled in (Section 9), (3) run `cargo build --release` manually on native riscv64 hardware or a VM (the same "spin up a VM and cargo build" workaround the maintainer suggested for arm64 in [issue #2321](https://github.com/tremor-rs/tremor-runtime/issues/2321) would presumably apply), since no cross-compilation config or builder image exists for the target. This is an unverified, untested path - Data not available: any report of someone successfully doing this.

**Step 0 caveat:** the `project-graph` MCP server used to cross-check the Ubuntu riscv64 package index via SPARQL failed to connect (`CONNECTION_CLOSED`) across every attempt this session (multiple independent retries, same failure). This is a tooling gap, not evidence either way, though the direct `packages.ubuntu.com` fetch above independently and directly confirms no `tremor` package exists in Ubuntu.

## 9. Dependencies

| Dependency | Role | Category | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|---|
| **Rust** | Build-dependency, critical - toolchain (pinned 1.82.0 via `rust-toolchain`) | Toolchain | riscv64gc-unknown-linux-gnu is a Rust target; no Tremor-specific blocker identified | N/A | N/A | Not independently re-researched in this report beyond confirming the pinned version; general Rust riscv64 tier status not evaluated here. |
| **simd-json** | Runtime-dependency, critical - core JSON parse/serialize engine used by nearly every crate | SIMD | Builds: SIMD dispatch (`portability.rs`, `numberparse.rs`, `stage2.rs`) gates only x86/x86_64/wasm32; riscv64 falls through to the generic scalar path, no arch-specific gating blocks compilation | No dedicated riscv64 CI in upstream simd-json repo (only x86/ARM64/wasm runners observed) | Ships via crates.io only (source crate) | [Issue #303 "Basic support for riscv64"](https://github.com/simd-lite/simd-json/issues/303) (2023, closed) fixed a build failure when `allow-non-simd` leaked SSE4.2 code; no open riscv64 issues remain. |
| **cross** | Build-dependency, critical - the `cross-rs` cross-compilation tool wrapped by `packaging/cross_build.sh` | Build tooling | Tremor's own `Cross.toml` defines builder images only for `x86_64-unknown-linux-musl`, `x86_64-alpine-linux-musl`, `x86_64-unknown-linux-gnu` - no riscv64 entry exists in Tremor's config, regardless of `cross` tool's own upstream riscv64 target support | N/A (not configured) | N/A (not configured) | Blocker is Tremor's own `Cross.toml`, not `cross` itself; upstream `cross` project's own riscv64 target support was not independently researched in this pass. |
| **ring** (via `rustls`) | TLS crypto primitives | Crypto | Current pinned 0.17.8 (via rustls 0.23.18): supports `riscv64gc-unknown-linux-gnu`, added before the 0.17.0 tag (commits `1e1e8e1ee`, `036b80aa9`, `4e5436138` add CI/QEMU coverage). A **stale 0.16.20** is also transitively resolved via `jsonwebtoken 7.2.0` (old webpki/sct/rustls 0.18-0.20 chain, likely reachable only through an optional cloud-connector auth path) and predates riscv64 support entirely. | Upstream ring 0.17.x has riscv64 in its QEMU CI matrix. | n/a (source crate) | Many closed riscv64 build-failure issues against 0.16.x (e.g. #1612, #1615, #1619, #1878, #1936, #1967), all predate the fix. One narrower open-class issue, [#2745](https://github.com/briansmith/ring/issues/2745) (closed "not planned"), concerns a newer riscv64a23 ABI profile, not standard riscv64gc. Also the direct subject of [Tremor issue #2265](https://github.com/tremor-rs/tremor-runtime/issues/2265) as an Alpine-packaging blocker. |
| **rustls** | TLS | Crypto | 0.23.18 (primary) builds wherever its selected crypto provider (ring) builds, so it is fine on riscv64gc; older 0.18-0.21 versions pulled transitively by `reqwest 0.11`, `hyper-rustls 0.24`, `tungstenite 0.17`, `surf`, `attohttpc`, `async-tls`, `http-client` inherit the stale ring 0.16.20 problem if actually compiled | No riscv64-specific issues found in rustls' own tracker | n/a | Only 2 riscv64-adjacent search hits found, both unrelated (mips64/aarch64-msvc). |
| **hashbrown** | SwissTable hashmap backing `std::HashMap`/`HashSet` | SIMD (group-match) | Generic non-SIMD "swar" fallback covers riscv64; no riscv64-specific issues found | No riscv64-specific issues found | n/a | GitHub issue search returned zero riscv64 issues (only one unrelated aarch64 illegal-instruction bug). |
| **rdkafka / librdkafka** | Kafka connector (`connector-kafka`), cmake-built, statically links zlib/OpenSSL/cyrus-sasl2/zstd/lz4 | Native build (cmake/cc) | No riscv64-specific build logic found; portable C, no per-arch assembly in the core | No riscv64 CI evidence found upstream | n/a | GitHub search on both `fede1024/rust-rdkafka` and `confluentinc/librdkafka` returned zero riscv64 issues (only unrelated ARM/i686 bugs) - "quietly works," not "actively validated." |
| **zstd** (via zstd-sys, `tremor-interceptor`) | Compression interceptor | Compression | riscv64 in upstream QEMU CI (non-release-blocking) | same | Debian/Ubuntu ship `libzstd-dev` for riscv64 | None blocking; RVV Adler32-class optimization work partially merged upstream. |
| **lz4** (via lz4-sys, `tremor-interceptor`) | Compression interceptor | Compression | riscv64 in upstream "Tier 3" QEMU cross-CI, non-release-blocking | same | Debian/Ubuntu ship LZ4 for riscv64 | None blocking. |
| **xz2** (via lzma-sys / liblzma) | Compression codec, used across `tremor-interceptor`, `tremor-pipeline`, `tremor-script` | Compression | riscv64 BCJ filter at functional parity with x86/arm64, no upstream riscv64 CI runner, not release-blocking | same | Debian sid/Ubuntu build riscv64 packages | None blocking (gaps are optimization-only: no hw CRC accel, no CI runner). |
| **brotli** (Rust crate, dropbox/rust-brotli, not the google/brotli C library) | Compression | Compression | Pure Rust, no arch-specific unsafe/asm - lower risk than the C library | n/a | n/a | No riscv64 issues found for the Rust crate specifically; do not conflate with the separate `google/brotli` project-report entry, which Tremor does not depend on. |
| **snap** (BurntSushi/rust-snappy) | Optional Snappy codec in `tremor-interceptor` | Compression | Pure Rust, no C deps - low risk | n/a | n/a | None found. |
| **sha2** (RustCrypto/hashes) | Content hashing, `tremor-script`/`tremor-archive` | Crypto | Pure-Rust with optional x86/aarch64 asm acceleration; portable fallback covers riscv64 | n/a | n/a | None found. |
| **jsonwebtoken** (7.2.0) | Pulls in the stale rustls/webpki/sct/ring 0.16.20 chain for an optional cloud-connector auth path | Crypto (indirect) | Inherits ring 0.16.20's lack of riscv64 support if this path is compiled | n/a | n/a | Flagged risk: worth a `cargo tree -i ring@0.16.20` check and a version bump/removal before a riscv64 build target is attempted. |

Summary: Tremor's two named critical runtime/build dependencies most exposed to riscv64 risk are (1) the Tremor-specific `Cross.toml` configuration (no riscv64 target defined at all, independent of upstream `cross` tool support), and (2) the stale transitive `ring 0.16.20` reachable via `jsonwebtoken 7.2.0`, which predates ring's riscv64 support - this is the one concrete, named blocker in the project's own issue tracker ([#2265](https://github.com/tremor-rs/tremor-runtime/issues/2265)). All compression-library dependencies (zstd/lz4/xz2/brotli/snap) and the current `ring 0.17.8` show working, best-effort riscv64 support upstream. `simd-json` and `hashbrown`, the two SIMD-flavored dependencies, both fall back cleanly to portable/scalar code on riscv64 by design.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2265](https://github.com/tremor-rs/tremor-runtime/issues/2265) | Feature flag to compile a binary dynamically linked to system OpenSSL | Open (since 2023-03-25, unaddressed) | High (names the concrete riscv64 blocker) | Names `ring` (via `rustls`) as unable to build on riscv64/s390x/ppc64le at time of filing; proposes swapping to `native-tls`/OpenSSL via a feature flag. Maintainer Licenser responded positively but non-committally; no PR filed, no milestone, no assignee. Also names a secondary, compounding blocker: `onig_sys` (via the `grok` crate) fails to build under clang16, unresolved. |
| [#2321](https://github.com/tremor-rs/tremor-runtime/issues/2321) | ARM64 Container | Open (since 2023-05-02) | Medium (not RISC-V; included for context) | Explicitly about arm64, not riscv64. Shows the project's general non-x86_64 stance: "tremor should compile on (most) ARM64 systems... the problem with publishing packages is that github doesn't offer build infrastructure on arm." Workaround offered: manual `cargo build --release` or `docker build` on self-provisioned hardware/cloud VM - the same pattern that would apply, likely more severely, to riscv64. |
| [#1221](https://github.com/tremor-rs/tremor-runtime/issues/1221) | Build always uses AVX2 instructions | Closed (2021-09-21) | N/A (x86_64-only SIGILL bug, unrelated to RISC-V) | Confirms AVX2 has historically been hardcoded/problematic even within x86_64 targeting; consistent with Section 5's finding that the same AVX2/SSE4.2 RUSTFLAGS remain hardcoded today with no arch-conditional branching. |

No correctness bugs specific to riscv64 exist because no riscv64 build has ever been produced to find correctness bugs in.

## 12. Objections and Upstream Blockers

**Stated objections:** None. No maintainer has objected to a riscv64 port; the only relevant comment (Licenser, [#2265](https://github.com/tremor-rs/tremor-runtime/issues/2265)) is receptive ("Good ideas! We'll put it on the list") but unresourced.

**Technical blockers (concrete, named in-repo):**
1. `ring` (via `rustls`) did not build on riscv64 at the time [#2265](https://github.com/tremor-rs/tremor-runtime/issues/2265) was filed (2023-03-25); the currently pinned `ring 0.17.8` has since gained riscv64gc support upstream (pre-0.17.0), but the stale transitive `ring 0.16.20` via `jsonwebtoken 7.2.0` has not been addressed and may still be compiled for an optional cloud-connector path.
2. Hardcoded x86-only `RUSTFLAGS` (`+avx,+avx2,+sse4.2`) in the Dockerfile, CI, and `packaging/cross_build.sh`, with no arch-conditional branching - would break an as-is riscv64 build attempt (Section 5).
3. No `Cross.toml` entry, no builder image, no CI job, no distro package exists as a starting point (Sections 5, 7, 8).
4. `onig_sys` (via the `grok` crate) build-under-clang16 issue, named alongside the riscv64 blocker in #2265, is a compounding but distinct obstacle for non-mainstream-architecture packaging generally.

**Organizational blockers:** No dedicated non-x86_64 GitHub Actions build/runner infrastructure exists at all; per Licenser's comment on #2321, "github doesn't offer build infrastructure on arm" (and by extension, presumably riscv64) to this project. No RISE membership or funded relationship exists to supply such infrastructure (Section 1).

**Acceptance probability:** Based on the maintainer's stated response to #2265 (receptive, unscheduled, nearly three and a half years unaddressed as of this report's date), a riscv64 port proposal would likely be accepted in principle but would require an external contributor to supply the patch, CI, and (per the arm64 precedent) accept that no GitHub-hosted riscv64 build infrastructure will be provided by the maintainers themselves. [NEEDS VERIFICATION - this is an inference from a single comment thread, not a maintainer statement about riscv64 specifically.]

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none - no upstream riscv64 release exists, no RISE-provided release exists, and no Linux distribution packages Tremor at all (on any architecture), so there is no consumable riscv64 artifact from any provider.
- Not an optimization-purpose project: Tremor's stated value is a general-purpose stream/event-processing runtime, not a performance-differentiated algorithm implementation (SIMD library, allocator, compression codec, etc.) in its own right. The Step 2 optimization modifier from the `/project-color-coding` skill therefore does not apply; `optimization_gap: N/A`.
- **Justification:** No upstream riscv64 CI exists in any of the 17 GitHub Actions workflow files or the `.drone.yml` Drone pipeline (verified by direct read of every file at commit `bf4564193df81c01eab2b78bfed8a3e1c5765348`), and no Linux distribution ships a `tremor` package at all - the [Ubuntu package search](https://packages.ubuntu.com/search?keywords=tremor&suite=resolute&searchon=names&section=all) returns "no results" in every suite checked, so the distribution floor from the skill's Step 1 (which would otherwise upgrade an unpatched clean-distro-build to yellow) does not apply, since there is no distro build to apply it to. This places Tremor at the base "no upstream riscv64 CI" grade of **orange** directly from Step 1 of the color model, without a distribution-floor subtype (`downstream-only` and `clean-distro-build` both presuppose an existing distro package, which does not exist here).
- **Pending work that could change the grade:** [Issue #2265](https://github.com/tremor-rs/tremor-runtime/issues/2265) remains open and, if resourced, would remove the named `ring`/riscv64 blocker via a `native-tls` feature flag - this alone would not produce green or blue without upstream also adding a riscv64 CI job and fixing the hardcoded AVX2/SSE4.2 `RUSTFLAGS` (Section 5). No RISE involvement exists today to accelerate this (Section 1); RISE engagement (a CI runner grant, or a funded contributor) would be the most direct lever to move this from orange to yellow (build-only CI) or blue (tested CI, no upstream binary).

## 14. Investment Analysis

**RISE prior work check:** No RISE involvement, funding, runner grant, or wheel-builder listing exists for Tremor (Section 1) - confirmed by checking the full RISE blog archive (30 posts, oldest to newest, zero mentions), the RISE members list, the `riseproject-dev` GitHub org's 25 repos (none named or related to Tremor), and the RISE Python wheel-builder's full package list. Nothing below is already covered by RISE or any third party.

### 14.1 Functional Enablement

Work required to get a first working riscv64 build: (1) resolve the stale `ring 0.16.20` transitive path via `jsonwebtoken 7.2.0` (bump or gate out the affected cloud-connector auth feature) or implement the `native-tls`/OpenSSL feature-flag proposed in [#2265](https://github.com/tremor-rs/tremor-runtime/issues/2265); (2) make the hardcoded AVX2/SSE4.2 `RUSTFLAGS` arch-conditional in the Dockerfile, CI, and `packaging/cross_build.sh`; (3) add a riscv64 entry to `Cross.toml` and a corresponding builder image under `packaging/builder-images/`; (4) validate the full workspace (~25 crates) builds and the test suite passes on riscv64gc-unknown-linux-gnu.

### 14.2 Performance Optimization

Not applicable as a distinct workstream at this stage - functional enablement has not been attempted, so there is no baseline to optimize against. Once functional, the primary latent performance gap is `simd-json`'s lack of an RVV backend (scalar-only fallback on riscv64 today, per Section 9) - this is an upstream `simd-json` project concern, not a Tremor-internal one.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to the existing GitHub Actions workflows (or a Drone job mirroring the existing native-arm64 `test-on-arm64` pattern in `.drone.yml`), including test execution, and - given the project has stated it lacks non-x86_64 GitHub-hosted runner access - either a self-hosted riscv64 runner or an external riscv64 CI resource (e.g., a RISE-hosted runner, which the project does not currently use).

### 14.4 Ecosystem Enablement

Not applicable - Tremor has no dependent package ecosystem (no npm/PyPI/Maven consumers depend on a riscv64 Tremor build; Tremor is itself a standalone runtime binary/service). Section 10 is correctly omitted per the task's scope rule.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve stale `ring 0.16.20` transitive dependency (via `jsonwebtoken 7.2.0`) or implement the `native-tls`/OpenSSL feature flag proposed in [#2265](https://github.com/tremor-rs/tremor-runtime/issues/2265) | 1-2 | Upstream (tremor-rs) or external contributor | Critical |
| Functional | Make hardcoded AVX2/SSE4.2 `RUSTFLAGS` arch-conditional across Dockerfile/CI/`cross_build.sh` | 0.5-1 | Upstream (tremor-rs) or external contributor | Critical |
| Functional | Add riscv64 target to `Cross.toml` + new builder image; validate full workspace build | 1-2 | Upstream (tremor-rs) or external contributor | High |
| Functional | Run full test suite on riscv64gc-unknown-linux-gnu, fix any failures found | 1-3 (unknown until attempted) | Upstream (tremor-rs) or external contributor | High |
| CI/CD | Add riscv64 CI job (build + test) to GitHub Actions or Drone, following the existing native-arm64 precedent | 1-2 | Upstream (tremor-rs), potentially RISE-runner-assisted | High |
| CI/CD | Secure riscv64 build/runner access (self-hosted or RISE-provided, since GitHub-hosted runners lack riscv64) | 0.5-1 (coordination) | RISE engagement or self-hosted | Medium |
| Distribution | Add riscv64 release artifacts (rpm/deb/tar.gz) to `release.yaml` once CI validates | 0.5-1 | Upstream (tremor-rs) | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [tremor-rs/tremor-runtime GitHub repository](https://github.com/tremor-rs/tremor-runtime)
- [Tremor homepage](https://www.tremor.rs/)
- [Issue #2265 - Feature flag to compile a binary dynamically linked to system OpenSSL](https://github.com/tremor-rs/tremor-runtime/issues/2265)
- [Issue #2321 - ARM64 Container](https://github.com/tremor-rs/tremor-runtime/issues/2321)
- [Issue #1221 - Build always uses AVX2 instructions](https://github.com/tremor-rs/tremor-runtime/issues/1221)
- [PR #1373 - Bump serde from 1.0.131 to 1.0.132](https://github.com/tremor-rs/tremor-runtime/pull/1373)
- [Tremor GitHub releases](https://github.com/tremor-rs/tremor-runtime/releases)
- [PyPI tremor package JSON API](https://pypi.org/pypi/tremor/json)
- [RISE Python wheel builder index for tremor](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tremor/)
- [Ubuntu package search for tremor (resolute)](https://packages.ubuntu.com/search?keywords=tremor&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial repo search for tremor](https://archriscv.felixc.at/?q=tremor)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE project members list](https://riseproject.dev/members/)
- [simd-json issue #303 - Basic support for riscv64](https://github.com/simd-lite/simd-json/issues/303)
- [ring issue #2745 - riscv64a23 ABI profile](https://github.com/briansmith/ring/issues/2745)
- [Local clone used for verification: /home/user/tremor-rs/tremor-runtime (commit bf4564193df81c01eab2b78bfed8a3e1c5765348)]
