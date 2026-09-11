---
title: Databend
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="databend" %}

# Databend

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Databend<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Databend is a cloud-native, general-purpose SQL data warehouse written entirely in Rust, developed by **Databend Labs** (Las Vegas, NV, USA). It is company-led, not foundation-governed: there is no Apache Software Foundation, CNCF, or Linux Foundation affiliation, no `MAINTAINERS`/`GOVERNANCE.md` file, and review authority is assigned only through `.github/CODEOWNERS` GitHub teams (`databend-query-reviewer`, `databend-executor-reviewer`, `databend-planner-reviewer`, etc.), plus one named individual for meta protobufs. The company's own about page discloses no founders, investors, or board, describing itself only as "a team of dedicated and passionate engineers" with "230+ contributors" and "9.4k+ stars" ([databend.com/about](https://databend.com/about/)).

Licensing is dual: **Apache-2.0** for the core/community codebase, and **Elastic License 2.0** (source-available, not fully open) for enterprise-only paths (`src/meta/ee`, `src/query/ee`, `src/bendsave`), gated behind a paid license key.

Top corporate contributors by commit count (full history, 34,637 commits): BohuTANG (5,440, publicly identified Databend Labs co-founder), sundyli (1,827), Xuanwo (1,741), dantengsky (1,547), zhang2014 (1,374), everpcpc (935). Individual current-employer attribution beyond BohuTANG could not be independently verified from repo/site data alone [NEEDS VERIFICATION].

On community culture toward new ports: the record shows no active or historical push for a RISC-V port. The only two RISC-V build-failure reports in the project's history were both closed by a maintainer with explicit statements of non-support ("Not used so far. Let's closing." and "We don't provide riscv64gc support now, closing.") - see Section 2. The official README badge states supported platforms as "Linux, macOS, ARM" only; no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-06-21 | Issue #860 opened: `cross build --target riscv64gc-unknown-linux-gnu` fails on missing `arrow-rs` `cfg(target_arch = "riscv")` alignment arm | [Issue #860](https://github.com/databendlabs/databend/issues/860) |
| 2021-09-04 | Issue #1720 opened: riscv64gc build fails in `ring` v0.16.20's build script (transitively via `rustls-native-certs`) | [Issue #1720](https://github.com/databendlabs/databend/issues/1720) |
| 2021-09-04 | Contributor PsiACE proposes making the `tls`/native-certs feature optional to sidestep `ring`'s riscv64 build-script panic (precedent cited: [miniserve PR #580](https://github.com/svenstaro/miniserve/pull/580)) - never implemented | [Issue #1720 comments](https://github.com/databendlabs/databend/issues/1720) |
| 2021-12-17 | PR #3517 merged (routine Dependabot serde 1.0.131 -> 1.0.132 bump; changelog incidentally notes serde enabled `AtomicI64/AtomicU64` on riscv64 upstream - not a Databend-authored riscv64 change) | [PR #3517](https://github.com/databendlabs/databend/pull/3517) |
| 2022-05-19 | Issue #1720 closed, `state_reason: completed`, closing comment by Xuanwo: "We don't provide `riscv64gc` support now, closing." | [Issue #1720](https://github.com/databendlabs/databend/issues/1720) |
| 2022-07-02 | Issue #860 closed, `state_reason: not_planned`, closing comment by Xuanwo: "Not used so far. Let's closing." | [Issue #860](https://github.com/databendlabs/databend/issues/860) |
| 2023-10-18 | PR #13329 merged (routine Dependabot rustix 0.36.9 -> 0.36.16 bump; changelog incidentally notes rustix "Disable riscv64 testing" upstream - unrelated to Databend's own architecture support) | [PR #13329](https://github.com/databendlabs/databend/pull/13329) |
| 2026-09-11 | Repository HEAD `37c532fcab6913cef8649ce11b9359b1f141d7e8` confirmed to have zero riscv64 references in any of 18 CI workflow files, no merge/open riscv64 PRs, no tracking issue | Direct repository inspection |

**Key contributors:** bohutang (Databend Labs co-founder) authored both riscv64 build-failure issues. Xuanwo (Databend Labs collaborator) closed both, in each case with an explicit non-support statement rather than a fix. No individual or team has ever driven a dedicated riscv64 port effort.

**Is it fully upstream?** No. There is no riscv64 port to be "upstream" of - no merged PR implements riscv64 support, no CI target exists, and the two build-failure issues were closed unresolved (`not_planned` / effectively abandoned despite `state_reason: completed`).

## 3. Upstream Support Tier

No formal tier policy document exists (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` all absent). The only explicit platform statement is the README badge: **"Platform: Linux, macOS, ARM"** - i.e. officially supported are Linux/macOS on x86_64 and ARM64. RISC-V is not listed anywhere as supported.

| | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes ([release.yml](https://github.com/databendlabs/databend/blob/main/.github/workflows/release.yml)) | Yes | No |
| CI tests pass | Yes | Yes | No test target exists |
| Official release artifact | Yes (`.tar.gz`, `.deb`) | Yes (`.tar.gz`, `.deb`) | None |
| Release-blocking | Yes | Yes | N/A |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Databend is pure Rust. Architecture-specific code is gated with `#[cfg(target_arch = "...")]`, not preprocessor macros. A repository-wide search found **10 files** with `x86_64`-specific branches, **4 files** with `aarch64`-specific branches, and **1 file** with a `riscv64` token - a shared boilerplate allocator-alignment constant, not riscv64-specific engineering.

| Component | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Vector-search distance kernels (`vector.rs`, `encoded_vectors_u8.rs`) | Full - hand-tuned AVX2/FMA + SSE intrinsics | Partial - hand-tuned NEON intrinsics | Missing - no branch; falls through to generic scalar |
| Bloom filter (`sbbf.rs`) | Full - hand-tuned AVX2 | Scalar fallback (no arch branch) | Missing - same scalar fallback as aarch64, no riscv64 acknowledgment |
| Hash-table / byte-compare fast paths (`short_string_hashtable.rs`, `utils.rs`, `position.rs`) | Full - hand-tuned SSE4.2 | Scalar fallback (plain `==`) | Missing - same scalar fallback |
| Startup CPU-feature gate (`entry.rs`) | Full - hard-requires SSE4.2 via `is_x86_feature_detected!` | N/A | Missing - never considered |
| Crash/signal-handler ABI (`crash_hook.rs`, test-only) | Full (`__jmp_buf` layout defined) | Full (`__jmp_buf` layout defined) | Missing - no `__jmp_buf` layout defined; this test module would fail to compile on riscv64 |
| Memory allocator alignment constant (`jemalloc.rs`) | Full (16-byte, shared `cfg` list) | Full (16-byte, shared `cfg` list) | Present but boilerplate - one shared constant (alongside powerpc64/mips64/s390x/sparc64), not riscv64-specific work |
| WASM UDF JIT (Wasmtime/Cranelift, `arrow-udf-runtime`, default-enabled feature) | Full - Tier 1 upstream | Full - Tier 1 upstream | Exists upstream (Cranelift Tier 2 riscv64 backend since v2.0.0, 2022-10) but with several **open, unresolved riscv64-specific correctness bugs**: [wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) (ISLE panic), [wasmtime#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) (Cranelift crash), [wasmtime#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) (vxrm/vxsat registers not preserved), [wasmtime#7186](https://github.com/bytecodealliance/wasmtime/issues/7186) (unimplemented vector instructions) |

**Verdict:** riscv64 is not a stub in Databend's own code - it is effectively absent. No riscv64 code branch exists anywhere in the performance-critical paths (SIMD vector search, bloom filter, hash-table comparison, startup feature checks). riscv64 would, if it built at all, run purely on the generic/portable Rust fallback path identical to any unlisted architecture, combined with a test module (`crash_hook.rs`) that would not compile.

## 5. Build System, Cross-Compilation, and Toolchain

Databend is a pure-Rust project: no `CMakeLists.txt` or `*.cmake` file exists anywhere in the repository. Build files are `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml` (pinned to `nightly-2025-12-11`), and a `Makefile`. Official release builds run `cargo build --target $TARGET` inside prebuilt `datafuselabs/build-tool:<base>-<rust-toolchain-version>` Docker images, for `x86_64` and `aarch64` gnu/musl targets only - no QEMU is used for cross-architecture Rust builds in this pipeline.

Historical attempted build command and failures (both via `cross`, not the official build-tool pipeline):
```
cargo install cross
cross build --target riscv64gc-unknown-linux-gnu
```
- **Failure 1 (2021, Issue #860):** `error[E0432]: unresolved import alignment::ALIGNMENT` - `arrow-rs`'s `arrow/src/alloc/alignment.rs` had no `cfg(target_arch = "riscv")` arm for the `ALIGNMENT` constant at the pinned arrow-rs commit.
- **Failure 2 (2021, Issue #1720):** build-script panic (`Option::unwrap()` on `None`) in `ring` v0.16.20's `build.rs:358`, pulled in transitively via `rustls-native-certs` -> `rustls` -> `ring`.

Whether these specific blockers are resolved against Databend's *currently pinned* dependency versions was not re-tested in this research pass; dependency research (Section 9) shows `ring` and `arrow-rs`'s broader ecosystem have since gained riscv64 support upstream, but no fresh `cargo build --target riscv64gc-unknown-linux-gnu` attempt against the current `Cargo.lock` was performed or found documented. **Data not available: a current, verified riscv64 build attempt against HEAD.**

No `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` exists. No riscv64 toolchain minimum-version requirement is documented anywhere, since no riscv64 target is officially supported.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native binary build | Yes | Yes | Unverified - no CI, no recent build attempt confirmed against current `Cargo.lock` |
| Official release artifact | Yes | Yes | No |
| WASM UDF execution (default-enabled) | Full, well-tested | Full, well-tested | Functionally present via upstream Cranelift but with open correctness bugs (Section 4) |
| SIMD-accelerated vector search / bloom filter / hashing | Full (AVX2/SSE) | Partial (NEON) | Absent - scalar fallback only |
| Test suite passes | Yes (CI-verified) | Yes (CI-verified) | Unverified - `crash_hook.rs` test module has no riscv64 `__jmp_buf` layout and would fail to compile |

**Functional gaps:** No riscv64 release binary exists at all (Section 8). A user must build from source with no CI-verified path.

**Performance gaps:** Vector-search, bloom-filter, and hash-table fast paths that are hand-tuned on x86_64 (AVX2/SSE) and partially on aarch64 (NEON) have zero riscv64 acceleration; riscv64 would run the generic scalar path. Downstream dependencies show the same pattern: zstd and BLAKE3 build and run correctly on riscv64 but lack RVV-accelerated kernels (open upstream feature requests: [zstd#4471](https://github.com/facebook/zstd/issues/4471), [zstd#4546](https://github.com/facebook/zstd/issues/4546), [BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484)).

**Security hardening gaps:** Data not available - no riscv64-specific hardening analysis (ASLR, stack protector, CFI) was found or performed for Databend on this architecture, since no riscv64 build exists to analyze.

**NaN / floating-point semantics:** One open, general cross-platform float-precision issue exists ([Issue #12515](https://github.com/databendlabs/databend/issues/12515), follow-up to closed [#12510](https://github.com/databendlabs/databend/issues/12510)), discussed in-thread as an x87-vs-other extended-precision register-width difference (a macOS/x86 concern). **No RISC-V involvement is mentioned in either issue** - this is not a RISC-V-specific finding.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Independently verified by reading all 18 files under `.github/workflows/` (`bindings.python.yml`, `build_tool.yml`, `cloud.yml`, `deb.yml`, `dev.yml`, `links.yml`, `main.yml`, `merge_group.yml`, `meta.yml`, `pr.yml`, `release.yml`, `retry.yml`, `reuse.benchmark.yml`, `reuse.explain.yml`, `reuse.linux.yml`, `reuse.macos.yml`, `reuse.sqllogic.yml`, `typos.yml`) plus a case-insensitive full-repository grep: **zero matches for "riscv" in any CI configuration file**. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. This was cross-checked twice: once via direct file read/grep against a local clone at commit `37c532fcab6913cef8649ce11b9359b1f141d7e8`, and independently via GitHub's own code-search index (`search_code` for `riscv repo:databendlabs/databend`) - identical (empty) result set both times.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes (`ubuntu-latest` + self-hosted x86_64) | Yes (self-hosted arm64) | No |
| Build job | Yes | Yes | No |
| Test execution | Yes | Yes | No |
| Release-blocking | Yes | Yes | N/A |
| RISE runner usage | N/A | N/A | None - Databend is not a RISE Project member (Section 12) and no CI file references RISE runners |

## 8. Distribution and Release Status

No official riscv64 binary exists on any channel checked:

| Channel | riscv64 available? | Evidence |
|---|---|---|
| GitHub Releases | No | Latest nightly `v1.2.940-nightly` [release assets page](https://github.com/databendlabs/databend/releases) lists all 17 assets explicitly: `.tar.gz` for `aarch64-unknown-linux-gnu` and `x86_64-unknown-linux-gnu` only (default/debug/docker/testsuite variants), `.deb` for `amd64`/`arm64` only |
| PyPI (`databend` package) | No | [pypi.org/pypi/databend/json](https://pypi.org/pypi/databend/json) - 62 wheels across versions 1.2.307-1.2.895, all `macosx_x86_64`/`macosx_arm64`/`manylinux_x86_64`/`manylinux_aarch64`; zero riscv64 wheels |
| RISE GitLab wheel-builder mirror | No | [gitlab.com API endpoint for `databend`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/databend/) 302-redirects to plain PyPI (same result as above) |
| Ubuntu 26.04 "resolute" | No | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Databend&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - the package is absent from the archive entirely, on any architecture, not just riscv64 |
| Arch Linux RISC-V (unofficial repo) | No | [archriscv.felixc.at/?q=databend](https://archriscv.felixc.at/?q=databend) - no package listed |

**What a user must do to get a working binary today:** Clone the repository and attempt `cargo build --target riscv64gc-unknown-linux-gnu` themselves, with no CI verification that this succeeds, no vendor support, and a known-broken test module (`crash_hook.rs`, Section 4). The last two documented attempts (2021) both failed on upstream dependency issues (Section 5); whether those specific blockers are resolved against the current `Cargo.lock` is unverified.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| Apache Arrow (build-dependency, critical, via `apache/arrow-rs`/`parquet` crates, pinned 58.4.0/58.1.0, patched via `datafuse-extras/arrow-rs`) | Core columnar in-memory format + Parquet I/O; Databend's primary data engine substrate | Historically blocked (Issue #860, 2021: missing `cfg(target_arch = "riscv")` alignment arm) | Not evidenced | Not tracked | Low riscv64-focused issue volume upstream (2 hits total, neither blocking) - ambiguous: could mean "works" or "rarely tested" |
| Rust (build-dependency, critical, toolchain pinned `nightly-2025-12-11` via `rust-toolchain.toml`) | Compiler/toolchain for the entire codebase | riscv64gc-unknown-linux-gnu is a Rust-supported target (Tier 2/3 depending on variant) | N/A | N/A | Toolchain itself is not the blocker; Databend's own CI never invokes it for riscv64 |
| jemalloc (build-dependency, optional, via `tikv-jemalloc-sys`, default feature in `databend-binaries`, not arch-gated) | Default global allocator | Open, unanswered upstream question: [jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399) "Does jemalloc support cross build for RISCV64" | Unresolved | Unresolved | Since Databend does not arch-gate the `jemalloc` feature, a riscv64 build risks pulling in a still-fragile allocator path |
| cross (build-dependency, optional; the `cargo install cross` tool used in both historical build attempts) | Cross-compilation harness used for riscv64gc attempts | Tool itself works; failures occurred in dependencies it built (arrow-rs, ring) | N/A | N/A | Not a Databend code dependency - a build-time tool only |
| rustix (build-dependency, optional, transitive) | Low-level Unix syscall bindings | Upstream rustix "disabled riscv64 testing" per changelog referenced in [PR #13329](https://github.com/databendlabs/databend/pull/13329) | Disabled upstream per that changelog note | Unresolved | Incidental Dependabot bump; not a Databend-authored riscv64 change |
| serde (build-dependency, optional, transitive) | Serialization framework | Upstream serde 1.0.132 enabled `AtomicI64/AtomicU64` on riscv64 per changelog referenced in [PR #3517](https://github.com/databendlabs/databend/pull/3517) | Not evidenced | N/A | Incidental Dependabot bump; not a Databend-authored riscv64 change |
| Wasmtime + Cranelift (indirect, via `arrow-udf-runtime`, `wasm` feature, workspace default) | JIT-compile/execute WASM UDFs - Databend's only true JIT dependency | Yes - Cranelift has a dedicated riscv64 Tier 2 backend since v2.0.0 (2022-10) | Tier 2 = reduced CI/fuzz coverage vs Tier 1 (x86_64/aarch64) | Tier 2, actively developed | Multiple **open** riscv64-specific correctness bugs: [wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [wasmtime#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [wasmtime#13078](https://github.com/bytecodealliance/wasmtime/issues/13078), [wasmtime#7186](https://github.com/bytecodealliance/wasmtime/issues/7186) |
| QuickJS / rquickjs (indirect, via `arrow-udf-runtime`, `javascript` feature, workspace default) | JS UDF interpreter | No riscv64-specific bugs found; portable C interpreter | No riscv64 issues surfaced | Not independently tracked | rquickjs vendors quickjs-ng, not the `bellard/quickjs` repo sometimes tracked elsewhere |
| ring (indirect, crypto backend for `rustls` via `tonic`/`reqwest`) | TLS crypto | Native riscv64gc support merged; issues closed as resolved ([ring#2520](https://github.com/briansmith/ring/issues/2520), [ring#2468](https://github.com/briansmith/ring/issues/2468)) | No open riscv64 test-failure issues | Supported since ring >=0.17.x | This is the same crate that blocked Issue #1720 in 2021 at v0.16.20 - later versions appear healthy, but this was not re-verified against Databend's current pinned version |
| aws-lc-rs / aws-lc-sys (indirect, alternate TLS crypto candidate present in `Cargo.lock`) | Crypto backend | riscv64 bindings pregenerated as of 2025 ([aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874), [aws-lc-rs#714](https://github.com/aws/aws-lc-rs/issues/714)); build tooling simplified ([aws-lc-rs#735](https://github.com/aws/aws-lc-rs/issues/735)) | No open riscv64 test issues found | Recently stabilized (2025) | Healthy |
| OpenSSL (indirect, vendored via `native-tls-vendored`/`openssl-tls`) | Crypto/TLS | Has dedicated riscv64 CI ("OS Zoo CI") | [openssl#30880](https://github.com/openssl/openssl/issues/30880) `test_lhash` occasionally fails on linux-riscv64 CI - open, flaky | Supported | Active but unfinished hardening work open: [openssl#28118](https://github.com/openssl/openssl/issues/28118) (musl extension detection broken), [openssl#29453](https://github.com/openssl/openssl/issues/29453) (asm->intrinsics rework), [openssl#28664](https://github.com/openssl/openssl/issues/28664) (SHA256 perf) |
| zstd / zstd-sys (indirect, compression for Arrow IPC/Parquet) | Compression | Builds and runs (portable C) | No functional-failure issues open | Supported | Open perf-gap requests: [zstd#4471](https://github.com/facebook/zstd/issues/4471) (RVV XXH3), [zstd#4546](https://github.com/facebook/zstd/issues/4546) (unaligned access) - runs the slow/portable path, not vectorized |
| BLAKE3 (indirect, checksum hashing) | Crypto hashing | Builds (portable Rust/C reference) | N/A | N/A | Open: [BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484) "Improved RISC-V support + SIMD" - falls back to scalar |
| tantivy (indirect, patched fork `datafuse-extras/tantivy`) | Full-text search index | Zero riscv64-tagged issues on upstream `quickwit-oss/tantivy` | Zero riscv64-tagged issues | Not tracked | Untested/unknown rather than confirmed-good; pure Rust, no known arch-specific unsafe blocks reported |
| mlua / mlua-sys (indirect, vendored Lua 5.4) | Embedded Lua interpreter for UDFs | No riscv64 issues on `mlua-rs/mlua`; portable ANSI C | N/A | N/A | Low risk - Lua's C core has no architecture-specific assembly |
| hdrs / hdfs-sys (indirect, native `libhdfs` C bindings) | HDFS client bindings | Unresearched - niche, JVM-dependent | Unresearched | Not tracked | Flag as an unresearched risk: requires a riscv64 JVM plus a riscv64-built `libhdfs.so` |
| ittapi / ittapi-sys (indirect, pulled in by Wasmtime for Intel VTune hooks) | Optional profiling instrumentation, historically x86/x86_64-oriented | Unresearched | Unresearched | N/A | Low functional risk (typically no-ops on unsupported archs) but unverified for riscv64 |

**Highest-risk dependency:** Wasmtime's Cranelift riscv64 JIT backend - it exists and is Tier 2 (actively maintained upstream) but carries multiple open, unresolved riscv64-specific correctness bugs, and Databend enables the `wasm` UDF feature by default.

**Allocator risk:** jemalloc is a default, non-arch-gated feature in `databend-binaries`, while upstream jemalloc's own riscv64 cross-build support is an open, unanswered question ([jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399)).

Note: `project-graph` MCP server (Ubuntu 26.04/resolute SPARQL query source) failed to connect (`CONNECTION_CLOSED`) throughout this research pass. This is a tool-connection failure, not evidence of absence - it could not corroborate or refute any dependency's distro-packaging status beyond what was checked via direct `packages.ubuntu.com`/`archriscv.felixc.at` fetches above.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#860](https://github.com/databendlabs/databend/issues/860) | `[build] support RISC-V build` | Closed (`not_planned`, 2022-07-02) | Build-blocking (historical) | Blocked on upstream `arrow-rs` missing `cfg(target_arch = "riscv")` alignment arm. Closed as unused/not-planned, no fix attempted |
| [#1720](https://github.com/databendlabs/databend/issues/1720) | `[build] riscv64gc-unknown-linux-gnu target build error` | Closed (`completed`, 2022-05-19), labeled "good first issue" | Build-blocking (historical) | Blocked on `ring` v0.16.20 build-script panic. Proposed fix (make TLS optional) never implemented. Closing comment explicit: "We don't provide riscv64gc support now" |
| [#12510](https://github.com/databendlabs/databend/issues/12510) | "Bug with H3 functions exhibiting cross-platform floating-point inconsistencies" | Closed | Correctness (non-RISC-V) | `h3_exact_edge_length_m`/`km` produced different float results across platforms; no RISC-V mention |
| [#12515](https://github.com/databendlabs/databend/issues/12515) | "test: cross-platform float-point values inconsistency" | Open | Correctness (non-RISC-V) | Follow-up to #12510; discussed as x87/extended-precision register-width differences (macOS/x86), not RISC-V |

**Correctness bugs:** No open issue in the tracker ties RISC-V to a correctness or NaN/floating-point bug. A dedicated search for "riscv nan floating" and for open RISC-V issues (`riscv is:open`) returned zero results beyond the two closed build issues above.

## 12. Objections and Upstream Blockers

**Stated objections:** Both maintainer closing comments are explicit non-support statements, not deferrals: Xuanwo, closing #860 (2022-07-02): "Not used so far. Let's closing." Xuanwo, closing #1720 (2022-05-19): "We don't provide `riscv64gc` support now, closing."

**Technical blockers (historical, 2021):** `arrow-rs` missing a `cfg(target_arch = "riscv")` alignment arm (#860); `ring` v0.16.20 build-script panic on riscv64 (#1720). Contributor PsiACE proposed making the TLS/native-certs feature optional as a workaround - never implemented. Whether these specific blockers persist against Databend's current pinned dependency versions is unverified (Section 5, Section 9) - dependency research suggests the broader `ring`/`aws-lc-rs` ecosystem has gained riscv64 support since, but this has not been re-tested end-to-end for Databend.

**Organizational blockers:** No dedicated port effort exists or has ever existed. No open tracking issue. Databend is not a RISE Project member - confirmed via [riseproject.dev/members](https://riseproject.dev/) (8 Premier Members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; 12 General Members: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE - Databend appears in neither list). No RISE blog post, wheel-builder listing, or benchmark report mentions Databend anywhere.

**Acceptance probability:** Low without external (non-Databend-Labs) engineering contribution. The signal from both closed issues is explicit non-demand ("not used so far"), there is no current tracking issue to reopen, and no RISE or third-party funding/engineering pressure has been directed at this project.

## 13. Readiness Assessment

- **Color:** orange (baseline orange - no upstream riscv64 CI, and no riscv64 package from any distribution or third party to trigger the distribution floor)
- **Release provider:** none
- Databend is a general-purpose cloud data warehouse / SQL query engine, not an optimization-purpose project under the color model's test (memory allocators, SIMD libraries, NN inference kernels, speed-differentiated compression, or hardware-accelerated crypto libraries). Its value proposition - a full cloud-native DBMS - would still be delivered on RISC-V running purely generic scalar code, even without any SIMD acceleration; the Step 2 optimization modifier therefore does not apply, and no Optimization level is assigned.
- **Justification:** Independently verified across 18 GitHub Actions workflow files ([`.github/workflows/`](https://github.com/databendlabs/databend/tree/main/.github/workflows)): zero riscv64 references in any CI configuration - no job, no matrix entry, no runner, no QEMU step, no Docker `linux/riscv64` platform target. No riscv64 release artifact exists on [GitHub Releases](https://github.com/databendlabs/databend/releases) (only aarch64/x86_64 tarballs and amd64/arm64 `.deb` packages), [PyPI](https://pypi.org/pypi/databend/json) (only macOS x86_64/arm64 and Linux x86_64/aarch64 wheels), [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=Databend&suite=resolute&searchon=names&section=all) (package absent from the archive entirely), or [Arch Linux RISC-V](https://archriscv.felixc.at/?q=databend) (not listed). Since no distribution ships even an unpatched build, the yellow distribution floor does not apply, leaving the project at baseline orange (no upstream CI, no distro package, not confirmed broken).
- **Pending work that could change the grade:** None identified. No open PR advances riscv64 support. No RISE involvement exists (Section 12). The only prior activity - Issues #860 and #1720 - is closed and explicitly marked as non-supported by the maintainer, with no reopened tracking issue as of this report's research date (2026-09-11).

## 14. Investment Analysis

RISE has done no work specific to Databend: it is not a RISE member, has no RISE blog coverage, and does not appear in the RISE Python wheel-builder listing (verified: the RISE GitLab mirror for `databend` redirects to plain PyPI with no riscv64 wheel present either way). All investment below is therefore unclaimed by any external party.

### 14.1 Functional Enablement

- Re-attempt `cargo build --target riscv64gc-unknown-linux-gnu` against the current `Cargo.lock` to determine whether the 2021-era `arrow-rs`/`ring` blockers (Section 5) are already resolved upstream or still present.
- Verify or arch-gate the default `jemalloc` feature in `databend-binaries` given jemalloc's own unresolved upstream riscv64 cross-build question ([jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399)).
- Add a riscv64 `__jmp_buf` layout to `crash_hook.rs` or exclude that test module on riscv64 so `cargo test` can compile.
- Confirm the WASM UDF path (Wasmtime/Cranelift) does not trip the open riscv64 Cranelift correctness bugs (Section 4) under Databend's actual UDF test suite.

### 14.2 Performance Optimization

- Add RISC-V Vector (RVV) paths for the vector-search distance kernels (`vector.rs`, `encoded_vectors_u8.rs`) and bloom filter (`sbbf.rs`) currently hand-tuned only for x86_64 AVX2/SSE and (partially) aarch64 NEON.
- This work is partially blocked on upstream dependency RVV support that is outside Databend's control (zstd XXH3 RVV kernel: [zstd#4471](https://github.com/facebook/zstd/issues/4471); BLAKE3 RVV: [BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484)) - Databend-side effort below covers only Databend's own kernels, not upstream dependency acceleration.

### 14.3 CI/CD Infrastructure

- Add a riscv64 target to `release.yml` and `reuse.linux.yml`, extend the `datafuselabs/build-tool` Docker images to a riscv64 variant.
- Adopt RISE's free `ubuntu-24.04-riscv` GitHub Actions runners (per ["Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), 2026-03-24) for test execution rather than build-only CI.

### 14.4 Ecosystem Enablement

Section 10 is omitted: Databend is a standalone database system and its own PyPI client-binding package (`databend`), not a base library with a significant dependent package ecosystem requiring separate riscv64 enablement across many third-party packages. The only follow-on item is building a riscv64 wheel for the `databend` PyPI binding itself once native builds succeed - captured in the summary table below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Re-verify/fix `cargo build --target riscv64gc-unknown-linux-gnu` against current `Cargo.lock`; resolve or confirm resolution of arrow-rs/ring blockers | 2-3 | Databend Labs (or contributor) | Critical |
| Functional | Arch-gate or verify default `jemalloc` feature for riscv64 | 0.5-1 | Databend Labs | High |
| Functional | Fix `crash_hook.rs` test module for riscv64 (`__jmp_buf` layout or exclusion) | 0.5 | Databend Labs | Medium |
| Functional | Validate default-enabled WASM UDF path against open Cranelift riscv64 bugs | 1-2 | Databend Labs | High |
| CI/CD | Add riscv64 build target to `release.yml`/`reuse.linux.yml`, extend build-tool Docker images | 1-2 | Databend Labs | High |
| CI/CD | Wire in RISE RISC-V GitHub Actions runners for riscv64 test execution | 1 | Databend Labs | High |
| Performance | RVV kernels for vector-search distance functions (`vector.rs`, `encoded_vectors_u8.rs`) | 4-6 | Databend Labs / contributor | Medium |
| Performance | RVV kernel for bloom filter (`sbbf.rs`) | 2-3 | Databend Labs / contributor | Low |
| Ecosystem | riscv64 wheel for PyPI `databend` binding (post native-build fix) | 1 | Databend Labs | Medium |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [Databend GitHub repository](https://github.com/datafuselabs/databend) (redirects to [databendlabs/databend](https://github.com/databendlabs/databend))
- [Databend homepage](https://databend.com/)
- [Databend about page](https://databend.com/about/)
- [Issue #860 - support RISC-V build](https://github.com/databendlabs/databend/issues/860)
- [Issue #1720 - riscv64gc-unknown-linux-gnu target build error](https://github.com/databendlabs/databend/issues/1720)
- [Issue #12510 - H3 functions cross-platform floating-point inconsistencies](https://github.com/databendlabs/databend/issues/12510)
- [Issue #12515 - cross-platform float-point values inconsistency](https://github.com/databendlabs/databend/issues/12515)
- [Issue #5787 - New processor in Arm performance issue](https://github.com/databendlabs/databend/issues/5787)
- [PR #13329 - bump rustix 0.36.9 to 0.36.16](https://github.com/databendlabs/databend/pull/13329)
- [PR #3517 - Bump serde 1.0.131 to 1.0.132](https://github.com/databendlabs/databend/pull/3517)
- [miniserve PR #580 (precedent cited for optional TLS feature)](https://github.com/svenstaro/miniserve/pull/580)
- [Databend GitHub Releases page](https://github.com/databendlabs/databend/releases)
- [Databend PyPI package JSON API](https://pypi.org/pypi/databend/json)
- [RISE GitLab PyPI wheel-builder mirror for databend](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/databend/)
- [Ubuntu 26.04 "resolute" package search for Databend](https://packages.ubuntu.com/search?keywords=Databend&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial repo search for databend](https://archriscv.felixc.at/?q=databend)
- [riseproject.dev members page](https://riseproject.dev/)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [Python Now Officially Supports RISC-V (riseproject.dev)](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [Databend .github/workflows directory](https://github.com/databendlabs/databend/tree/main/.github/workflows)
- [wasmtime#12195 - ISLE panic on riscv64](https://github.com/bytecodealliance/wasmtime/issues/12195)
- [wasmtime#13959 - Cranelift crash in riscv64 isle](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [wasmtime#13078 - vxrm/vxsat registers not preserved](https://github.com/bytecodealliance/wasmtime/issues/13078)
- [wasmtime#7186 - remaining vector instructions unimplemented](https://github.com/bytecodealliance/wasmtime/issues/7186)
- [jemalloc#2399 - Does jemalloc support cross build for RISCV64](https://github.com/jemalloc/jemalloc/issues/2399)
- [jemalloc#2323 - riscv64gc support (closed)](https://github.com/jemalloc/jemalloc/issues/2323)
- [ring#2520](https://github.com/briansmith/ring/issues/2520)
- [ring#2468](https://github.com/briansmith/ring/issues/2468)
- [ring#2745 - riscv64a23 non-standard target](https://github.com/briansmith/ring/issues/2745)
- [aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874)
- [aws-lc-rs#714](https://github.com/aws/aws-lc-rs/issues/714)
- [aws-lc-rs#735 - removed CMake/Clang requirement for riscv64](https://github.com/aws/aws-lc-rs/issues/735)
- [aws-lc-rs#1022 - aarch64 cross-compile issue (unrelated arch)](https://github.com/aws/aws-lc-rs/issues/1022)
- [openssl#30880 - test_lhash flaky on linux-riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [openssl#28118 - RISC-V extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [openssl#29453 - asm to intrinsics rework for RISC-V](https://github.com/openssl/openssl/issues/29453)
- [openssl#28664 - SHA256 riscv64 perf work](https://github.com/openssl/openssl/issues/28664)
- [zstd#4471 - Add RISC-V Vector (RVV) Support for XXH3](https://github.com/facebook/zstd/issues/4471)
- [zstd#4546 - Add RISC-V unaligned access](https://github.com/facebook/zstd/issues/4546)
- [BLAKE3#484 - Improved RISC-V support + SIMD](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- Local repository inspection: `/home/user/datafuselabs/databend`, shallow clone at commit `37c532fcab6913cef8649ce11b9359b1f141d7e8` (2026-09-11)
