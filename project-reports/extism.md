---
title: Extism
parent: Project Reports
color: orange
dependencies:
  - name: Wasmtime
    relation: build-dependency
    criticality: critical
  - name: sha2
    relation: runtime-dependency
    criticality: optional
---

# Extism

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Extism<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="extism" %}

## 1. Project Overview

Extism is a cross-language WebAssembly plugin framework: a host SDK/runtime (`extism/extism`, Rust/C core with bindings for Python, .NET, Rust, Perl, JS, Go, and others) that lets applications embed sandboxed WASM plugins. It embeds [Wasmtime](https://github.com/bytecodealliance/wasmtime) as its WASM execution engine (JIT/AOT codegen via Cranelift) rather than implementing its own compiler.

**Governance:** Extism is a single-vendor commercial open-source project owned outright by Dylibso, Inc. Copyright in `LICENSE` reads "Copyright 2022 Dylibso, Inc."; the README's "Who's behind this?" section states Extism is "an open-source product from the team at Dylibso"; extism.org's footer confirms the same. License is BSD-3-Clause. There is no MAINTAINERS/OWNERS/GOVERNANCE.md file; `.github/CODEOWNERS` names a single owner, `@zshipko` (Zach Shipko, Dylibso founder/CEO). No CNCF/Linux Foundation/OpenSSF affiliation was found on extism.org or in the repo.

**Corporate sponsors / contributors (by commit volume in this clone's history, all Dylibso, Inc. employees):**

| Contributor | Affiliation | Approx. commits |
|---|---|---|
| Zach Shipko (zshipko) | Dylibso (founder/CEO), sole CODEOWNER | ~261 |
| Benjamin Eckel (bhelx) | Dylibso (co-founder) | ~128 |
| Steve Manuel | Dylibso | 65 |
| Chris Dickinson | Dylibso | 25 |
| Gavin Hayes | Dylibso | 15 |
| Muhammad Azeez | Dylibso | 9 |
| dependabot[bot] | automated | 134 |

No maintainers from other companies appear among top contributors -- this is effectively a single-vendor project.

**Community culture on new ports:** Process is informal -- GitHub issues and Discord for small changes; larger changes go through an "EIP" (Extism Improvement Proposal) process in the separate `extism/proposals` repo ("Anyone can submit a proposal"). There is no RFC voting body, board, or member-tier structure; decision authority rests with Dylibso maintainers. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists documenting a tiered-platform policy.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 port, issue, PR, or commit has ever been opened against `extism/extism` | `git log --all -i --grep="riscv"` returns zero commits; GitHub issue/PR/commit search for "riscv", "riscv64", "risc-v" all return zero results |

There is no milestone timeline to report because no RISC-V work exists. `git log --all -i -S"riscv"` (pickaxe, diff-content search) surfaces only two false positives -- commits `7e8031f` and `a94a0a7` -- both of which only add/remove an `esbuild-linux-riscv64` npm lockfile entry (a transitive esbuild build-tool dependency, unrelated to Extism's own target support). No key contributors, no organizations, and no upstreaming milestones exist for this port because the port does not exist. Extism is **not** upstream on riscv64.

## 3. Upstream Support Tier

Extism has no formal tiered-platform policy document. Its README's "Supported Targets" list (prebuilt release binaries) is a flat, undifferentiated list:

```
aarch64-apple-darwin
aarch64-unknown-linux-gnu
aarch64-unknown-linux-musl
x86_64-apple-darwin
x86_64-pc-windows-gnu
x86_64-pc-windows-msvc
x86_64-unknown-linux-gnu
x86_64-unknown-linux-musl
```

riscv64 (`riscv64gc-unknown-linux-gnu`/`musl`) does not appear in this list and is not built by CI. The 8-entry build matrix in [`.github/workflows/release.yml`](https://github.com/extism/extism/blob/main/.github/workflows/release.yml) matches this list exactly.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes (ubuntu-latest, macos-latest, windows) | yes (macos aarch64, ubuntu aarch64-gnu/musl) | no |
| CI tests | yes (`cargo test`, 3 feature variants, ci.yml) | not explicitly (macos-latest runners are Apple Silicon incidentally, not targeted as an arm64 test lane) | no |
| Official prebuilt binaries | yes | yes | no |
| Listed in README "Supported Targets" | yes | yes | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Extism's own codebase carries **zero architecture-specific source code for any architecture** -- not amd64, not arm64, not riscv64. Verified by:
- `mcp__github__search_code query="#ifdef __riscv repo:extism/extism"` -> 0 results
- `__x86_64__` / `__aarch64__` C preprocessor guards -> 0 results, repo-wide
- Local grep for `riscv|__x86_64__|__aarch64__|__amd64__` across `.rs/.c/.h` files -> 0 matches
- No `.s` assembly files, no per-architecture subdirectory under `runtime/src/` (11 flat files: `current_plugin.rs, function.rs, internal.rs, lib.rs, manifest.rs, pdk.rs, plugin.rs, plugin_builder.rs, pool.rs, sdk.rs, timer.rs`) or `libextism/`
- The only `target_arch` hit in the whole repo is `#[cfg(all(target_arch = "wasm32", not(test)))]` in `kernel/src/bin/extism-runtime.rs` -- this distinguishes compiling to WebAssembly vs. native test builds, not host CPU architecture

All CPU-architecture-specific work (JIT codegen, SIMD lowering, calling conventions) is delegated entirely to the **Wasmtime/Cranelift** dependency, which Extism does not vendor, fork, or patch.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Extism-authored arch-specific code (guards, intrinsics, asm) | none exists | none exists | none exists |
| Pre-built release binary | present (generic `cargo build --target`) | present (generic `cargo build --target`) | absent -- no target in matrix |
| Underlying JIT/codegen (Wasmtime/Cranelift, external, unmodified) | full, hand-tuned (outside this repo) | full, hand-tuned (outside this repo) | Cranelift ships a riscv64gc backend (merged 2022, covers SIMD/memory64/GC) but classified **Tier 3 "not production ready"** upstream -- irrelevant to grading Extism's own code since Extism carries zero riscv64-specific logic of its own |

**Conclusion:** "Support" for amd64/arm64 in `extism/extism` means nothing more than "generic portable Rust/C code compiles, and Wasmtime/CI has a runner and target triple for it." There is no Extism-authored architecture-specific implementation to grade for any of the three architectures -- riscv64 is simply absent from the build/CI/release surface, not stubbed or partially implemented.

## 5. Build System, Cross-Compilation, and Toolchain

Extism is a Cargo workspace, not a top-level CMake project:
- **`Makefile`**: wraps `cargo build --release --manifest-path libextism/Cargo.toml --target $(RUST_TARGET)`. No architecture-specific flags, no `-DUSE_X=OFF`-style options.
- **`libextism/CMakeLists.txt`** (the only CMakeLists.txt in the repo): wraps the Rust build via Corrosion (`FetchContent` of `corrosion-rs/corrosion` v0.4.4) and calls `corrosion_import_crate(...)`. No architecture conditionals, no toolchain logic, no riscv mention.
- **`kernel/.cargo/config.toml`**: sets `target = "wasm32-unknown-unknown"` for the guest-side wasm kernel build -- unrelated to host architecture.
- **`rust-toolchain.toml`** (root and `kernel/`): pins Rust `stable` via `actions-rust-lang/setup-rust-toolchain@v1`. No minimum GCC/Clang version documented (no C/C++ compiler required for the core build beyond what `cross`'s prebuilt Docker images provide for the release workflow).

**Files confirmed absent:** `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, any `Dockerfile*`, `.ci/docker/`, `docker/`. There is no `docs/` directory at all.

**Release workflow** ([`.github/workflows/release.yml`](https://github.com/extism/extism/blob/main/.github/workflows/release.yml)): uses `cargo install cross` + `cross build --release --target <target> -p libextism` for its 8-entry matrix. `cross` internally uses Docker/QEMU generically for cross-targets, but there is no riscv64 case wired into the matrix, so this QEMU capability is never exercised for riscv64.

**What a user would need to do today:** No documented path exists. In principle, since the runtime is Rust/Wasmtime-based, a user could attempt `rustup target add riscv64gc-unknown-linux-gnu` followed by `cargo build --target riscv64gc-unknown-linux-gnu` with a self-supplied linker/cross-toolchain, but none of this is wired into the repo's CI, Makefile, or CMake, and no one has reported doing so successfully (zero issues/PRs/commits on the topic).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native `libextism` binary build | yes | yes | no (untested, unbuilt by upstream) |
| CI test execution | yes | no explicit arm64-targeted lane (macos-latest runners are incidentally Apple Silicon) | no |
| Official release artifact | yes | yes | no |
| Python (PyPI) native wheel | yes (via compiled `extism_sys`) | yes | no compiled wheel for any riscv64 target exists |
| .NET NuGet native runtime | yes (`win-x64`) | yes (`osx-arm64`, `linux-arm64`) | no |

**Functional gaps:** riscv64 users cannot obtain a working Extism binary through any upstream channel; there is no functional gap analysis possible beyond "does not exist."

**Performance gaps:** No benchmark data comparing Extism on riscv64 vs. arm64/amd64 exists anywhere (confirmed by exhaustive GitHub issue search and web search). The one adjacent data point: this repository's own [`project-reports/helm.md`](https://github.com/riseproject-dev/sw-ecosystem) notes that Helm's WASM plugin system, which uses `extism/go-sdk` on top of `tetratelabs/wazero`, is "functionally correct but slower on riscv64" because wazero's Compiler/AOT/JIT mode is unavailable on riscv64 (interpreter-only) -- but no riscv64 benchmark numbers back this claim either, and it concerns `wazero`, a different WASM engine than the Wasmtime/Cranelift Extism itself embeds.

**Security hardening gaps:** Data not available -- no source discusses riscv64-specific hardening (ASLR, CFI, stack protector) for Extism or its Wasmtime dependency in this context.

**NaN / floating-point semantics issues:** No Extism-specific reports found. One adjacent, unverified data point from Extism's Wasmtime dependency: [bytecodealliance/wasmtime#5523](https://github.com/bytecodealliance/wasmtime/issues/5523), "Cranelift: Wrong result for `rotl.i16` with `i128` shift value on riscv64" -- a Wasmtime/Cranelift correctness bug, not an Extism issue, and not floating-point/NaN specific (it is an integer rotate bug). [NEEDS VERIFICATION -- relevance to Extism workloads not established].

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** All 6 workflow files were read in full from the local clone (`/home/user/extism/extism`, HEAD `d5da29759bba88645f886d9e12d3f4e4376df7b3`). A repo-wide case-insensitive grep for "riscv" returned zero matches.

| File | Trigger | Runner(s) | riscv64? |
|---|---|---|---|
| [`ci.yml`](https://github.com/extism/extism/blob/main/.github/workflows/ci.yml) ("Rust CI") | `pull_request` (paths: runtime/rust/convert/manifest/libextism), `workflow_dispatch` | `ubuntu-latest`, `macos-latest` | no |
| [`kernel.yml`](https://github.com/extism/extism/blob/main/.github/workflows/kernel.yml) ("Kernel") | `pull_request` (path: `kernel/**`), `workflow_dispatch` | `ubuntu-latest` | no (builds `wasm32-unknown-unknown`, a Wasm target not a host CPU arch) |
| [`release.yml`](https://github.com/extism/extism/blob/main/.github/workflows/release.yml) ("Release") | `push` to `main`/`v*`, `v*` tags, `workflow_dispatch` | matrix of macos/ubuntu/windows | no -- 8 explicit targets, none riscv64 |
| `release-dotnet-native.yaml` | `release: [published, edited]`, `workflow_dispatch` | `ubuntu-latest` | no |
| `release-python.yaml` | `workflow_call` (from release.yml) | `ubuntu-latest` | no |
| `release-rust.yaml` | `release: [published, edited]`, `workflow_dispatch` | `ubuntu-latest` | no -- no target matrix at all (crates.io `cargo publish`) |

No workflow uses QEMU. No workflow references a riscv64/RISC-V runner or label. No RISE runner usage was found anywhere.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test | yes (ci.yml, `cargo test`) | not explicitly targeted | no |
| Release-blocking gate | yes (release.yml matrix) | yes | no |
| Hardware/emulation | native GitHub-hosted runners | native (macos aarch64) / cross via `cross`+Docker (ubuntu aarch64) | N/A -- no job exists |

## 8. Distribution and Release Status

**No riscv64 binary exists in any channel checked:**

| Channel | riscv64 available? | Evidence |
|---|---|---|
| GitHub Releases | No | Releases up to v1.30.0 checked; no asset filename contains "riscv" ([extism/extism releases](https://github.com/extism/extism/releases)) |
| PyPI | No (N/A) | `extism` package (v1.1.1): `urls[]` = `extism-1.1.1-py3-none-any.whl`, `extism-1.1.1.tar.gz` -- architecture-independent Python wrapper; no compiled native artifact of any kind exists for riscv64, so this does not constitute riscv64 support of the underlying native `libextism` ([PyPI JSON API](https://pypi.org/pypi/extism/json)) |
| RISE Python wheel builder | No | `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/extism/` returns HTTP 302, redirecting to plain PyPI -- no distinct RISE-built wheel exists |
| Ubuntu 26.04 (resolute) | No (N/A) | Zero packages of any architecture -- Extism is not in the Ubuntu archive at all ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Extism&suite=resolute&searchon=names&section=all)) |
| Arch Linux (official) | No | Zero results ([archlinux.org package search](https://archlinux.org/packages/search/json/?name=extism)) |
| AUR | Source recipe only, unbuilt | 2 hits (`extism` v1.7.0-0, `extism-js-bin`) but these are unbuilt PKGBUILD source recipes, not riscv64 binaries, and AUR is not mirrored by `archriscv.felixc.at` (which only mirrors official `[core]`/`[extra]`/`[unsupported]` repos) |
| NuGet (.NET) | No | `release-dotnet-native.yaml` packs runtimes for `win-x64`, `osx-arm64`, `osx-x64`, `linux-x64`, `linux-arm64`, `linux-musl-arm64` only |

**What a user must do to get a working riscv64 binary:** There is no upstream, RISE, distro, or third-party path today. A user would have to build `libextism` from source using `cargo build --target riscv64gc-unknown-linux-gnu` with a self-supplied toolchain -- an untested, unsupported, undocumented path with no confirmed successful reports.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test/CI | riscv64 release | Notes |
|---|---|---|---|---|---|
| Wasmtime | Core WASM execution engine Extism embeds (build-dependency, critical) | Builds -- Cranelift riscv64 backend merged 2022-09 (first shipped v2.0.0), covers SIMD, memory64, GC, exception handling, FP16, Zvbb vector-bitmanip ext. | **Tier 3** per upstream [`stability-tiers.md`](https://github.com/bytecodealliance/wasmtime): no CI-testing requirement, no continuous fuzzing, no full-time maintainer assigned | "Tier 3 = not production ready"; features may be disabled/removed if maintenance lapses. **Winch** (Extism's fast baseline-compiler alternative to Cranelift) has zero riscv64 support | Open bugs: [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) Cranelift crash in riscv64 isle; [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) ISLE panic in `gen_bitcast`; [#12197](https://github.com/bytecodealliance/wasmtime/issues/12197) tracking issue for missing ISLE lowering rules; [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) vxrm/vxsat vector-CSR registers not preserved; [#9186](https://github.com/bytecodealliance/wasmtime/issues/9186) `*_overflow` ops unsupported on riscv64. Also relevant: [#5008](https://github.com/bytecodealliance/wasmtime/issues/5008) tls_value unsupported on riscv64, [#5523](https://github.com/bytecodealliance/wasmtime/issues/5523) `rotl.i16` correctness bug on riscv64 |
| sha2 | Content-hashing of plugin/module bytes (runtime-dependency, optional) | Builds -- portable/generic scalar fallback used on riscv64 (x86_64/aarch64 get hand-written asm/intrinsics acceleration; riscv64 does not) | No open riscv64 issues found; cross-target CI exists upstream but riscv64-specific coverage is unclear | Published as pure-Rust, no arch exclusion | One historical, closed issue: RustCrypto/hashes "sha2: performance issue on RISC-V" -- a perf-only report, not a build/correctness blocker |

**Scope note:** No direct compression (zlib/zstd/brotli/lz4) or standalone crypto/TLS library (OpenSSL, libsodium, BLAKE3) dependency exists in Extism's own Cargo manifests. `base64`, `serde`, `serde_json`, `toml`, and `prost`/`protobuf`/`rmp-serde` (all optional, serialization-only) are pure-Rust and architecture-agnostic; `bytemuck` (optional `raw` feature) is likewise pure Rust with no SIMD/asm paths that would exclude riscv64. The optional `ureq` HTTP client (features `http`/`register-http`) may pull a TLS backend transitively, but no `Cargo.lock` is checked into the repo, so the exact transitive pin could not be confirmed.

**Bottom line:** Extism's one architecturally consequential dependency for riscv64 is Wasmtime/Cranelift -- it works (comprehensive codegen support since 2022) but is explicitly upstream-classified Tier 3 "not production ready," with multiple currently-open riscv64-specific correctness bugs. Everything else Extism depends on (sha2, bytemuck, serde family) is portable pure-Rust with no known riscv64 blockers.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issue exists in `extism/extism` | -- | -- | Confirmed by GitHub issue search ("riscv", "riscv64", "risc-v", all query variants) returning zero results |
| [extism/extism#808](https://github.com/extism/extism/issues/808) | "Consider support for more platforms" | Open, opened 2024-12-20, zero replies | Informational only | Notes Wasmtime's Pulley interpreter could let Extism "easily add support for more platforms," implying riscv64 is not first-class today; contains no riscv64-specific data or commitment |
| [extism/extism#456](https://github.com/extism/extism/issues/456) | "Benchmarking" | Open, opened 2023-09-14 | Informational only | Proposes `cargo bench` + github-action-benchmark tracking; architecture-agnostic, no RISC-V mention |

**Correctness bugs (in the Wasmtime dependency, not Extism itself, surfaced during research):**
- [bytecodealliance/wasmtime#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) -- Cranelift crash in riscv64 isle
- [bytecodealliance/wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) -- ISLE panic in `gen_bitcast`
- [bytecodealliance/wasmtime#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) -- vxrm/vxsat vector-CSR registers not preserved on riscv64
- [bytecodealliance/wasmtime#5523](https://github.com/bytecodealliance/wasmtime/issues/5523) -- wrong result for `rotl.i16` with `i128` shift value on riscv64
- [bytecodealliance/wasmtime#9186](https://github.com/bytecodealliance/wasmtime/issues/9186) -- `*_overflow` ops unsupported on riscv64
- Recently closed (in Wasmtime): #13884 stack-switch SP-decrement bug, #12170 "unimplemented for >64 bits", #11133 riscv64 segfault on `call`

None of these are filed against `extism/extism`; they are cited because Extism's functional correctness on riscv64 would be gated by them if a port were attempted.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has stated an objection to riscv64 support; the topic has simply never been raised as a proposal, issue, or PR.

**Technical blockers:**
- No riscv64 target in the release build matrix or CI -- purely an engineering gap, not a stated technical impossibility.
- The embedded Wasmtime/Cranelift dependency's riscv64 backend is Tier 3 ("not production ready") with multiple open correctness bugs, which would need to be tracked or worked around for a production-quality Extism riscv64 release.
- Winch (Wasmtime's fast baseline compiler, an alternative Extism could use for faster non-optimizing compilation) has zero riscv64 support, per the dependency research above.

**Organizational blockers:**
- Single-vendor project (Dylibso, Inc.) with one CODEOWNER (`@zshipko`) and no consortium/foundation governance -- there is no external pressure mechanism (e.g., a RISE membership commitment) driving a riscv64 port.
- No RISE Project membership: Extism/Dylibso does not appear among RISE Premier or General members ([riseproject.dev/members/](https://riseproject.dev/members/)).

**Acceptance probability:** Given the EIP process is open to "anyone" and the codebase requires no architecture-specific code (delegating entirely to Wasmtime), a riscv64 port is *technically* low-effort to propose (add a target triple to `release.yml`, add a CI job) if a contributor or funded initiative (e.g., RISE) chose to pursue it. No such effort currently exists or is planned per any source found.

## 13. Readiness Assessment

**Color:** orange (no clean orange sub-type applies: no upstream riscv64 CI exists, and no distribution -- Ubuntu, Arch, or otherwise -- ships an Extism package of any architecture, so the distribution floor is not reachable at all)

**Release provider:** none

Extism is not an optimization-purpose project (per the /project-color-coding skill's test): it is a general-purpose WASM plugin host SDK, and it would deliver its core value on riscv64 using generic/portable code with no architecture-specific optimization required -- this falls under the skill's explicit "general-purpose language runtimes" exclusion. Step 2 (optimization modifier) therefore does not apply, and no Optimization level is reported.

**Justification:** No riscv64 CI job exists in any of Extism's 6 GitHub Actions workflows -- verified by reading `ci.yml`, `kernel.yml`, `release.yml`, `release-dotnet-native.yaml`, `release-python.yaml`, and `release-rust.yaml` in full, all of which run exclusively on x86_64/aarch64 runners with an 8-entry release matrix containing no riscv64 target ([release.yml](https://github.com/extism/extism/blob/main/.github/workflows/release.yml)). No riscv64 release artifact exists in any channel ([GitHub Releases](https://github.com/extism/extism/releases), [PyPI](https://pypi.org/pypi/extism/json)), and the distribution floor does not apply because Extism has zero packages in Ubuntu 26.04 or the official Arch archive for any architecture ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Extism&suite=resolute&searchon=names&section=all), [archlinux.org](https://archlinux.org/packages/search/json/?name=extism)). Per the color model's rule that "no CI and no distro package defaults to orange or grey, not red," and given that extensive, corroborated research (CI files, releases, PyPI, Ubuntu, Arch/AUR, issues, PRs, commits) produced consistent evidence of absence rather than a genuine data gap, orange (not grey) is the correct classification.

**Pending work that could change the grade:** [extism/extism#808](https://github.com/extism/extism/issues/808) is the only forward-looking signal (notes Wasmtime's Pulley interpreter could ease multi-platform support) but has zero replies and no concrete riscv64 commitment. No RISE Project involvement exists for Extism directly -- it is not a RISE member, has no RISE blog coverage, and appears in this repository's own tracking only as a queued-but-unauthored report entry (`project-reports/.queue.yml`) and as an incidental transitive-dependency note in `project-reports/helm.md` (via `extism/go-sdk` -> wazero, unrelated to the Wasmtime path Extism itself uses). Because Extism's own code requires no architecture-specific work, the primary external gate on upgrading this grade is Wasmtime/Cranelift's riscv64 backend maturing past Tier 3.

## 14. Investment Analysis

**RISE involvement check:** No RISE Project funding, blog coverage, membership, or dedicated repository exists for Extism (confirmed via `riseproject.dev/members/`, `riseproject.dev/blog`, and GitHub org `riseproject-dev` search). No prior work is covered; all estimates below are from a zero baseline.

### 14.1 Functional Enablement

Add a `riscv64gc-unknown-linux-gnu` (and optionally `-musl`) target to the `release.yml` build matrix and validate that `cross build --target riscv64gc-unknown-linux-gnu -p libextism` succeeds. Since Extism carries no architecture-specific code, this is primarily a CI/build-matrix change plus validation, not a porting effort. Risk is concentrated in the embedded Wasmtime/Cranelift dependency's Tier 3 status and open riscv64 correctness bugs, which may surface during integration testing rather than at build time.

### 14.2 Performance Optimization

Not applicable in the traditional sense -- Extism itself has no architecture-specific hot paths to optimize (Section 4). Any performance work would occur upstream in Wasmtime/Cranelift, outside Extism's control or scope.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `ci.yml` (build + `cargo test`, matching the existing `ubuntu-latest`/`macos-latest` pattern) and a riscv64 target to `release.yml`'s matrix. Given no RISE runners are currently used by this project, this would require either QEMU-based emulation in existing `cross`-based tooling or access to native riscv64 CI hardware (e.g., RISE-provided runners, per [the RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), which was not found to be in use by Extism).

### 14.4 Ecosystem Enablement

Not applicable -- Section 10 is omitted per the report rules; Extism is a standalone host SDK/library, not a package manager with a dependent ecosystem requiring per-package riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64gc-unknown-linux-gnu/musl target to release.yml build matrix; validate `cross build` succeeds | 1-2 | Extism/Dylibso maintainers or external contributor | Medium |
| Functional | Track and, where feasible, contribute fixes for open Wasmtime riscv64 ISLE/vector-CSR bugs blocking correctness ([#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078)) | 4-8 (upstream Wasmtime work, not Extism-scoped) | Wasmtime/bytecodealliance maintainers | High (blocking for production use, not blocking for a build-only riscv64 target) |
| CI/CD | Add riscv64 build+test job to ci.yml and release matrix entry to release.yml | 1 | Extism/Dylibso maintainers or external contributor | Medium |
| CI/CD | Secure riscv64 CI runner access (RISE runners or QEMU) | 0.5-1 | Extism/Dylibso maintainers, RISE liaison | Medium |
| Distribution | Publish riscv64 release artifacts (tar.gz, NuGet runtime, PyPI wheel for compiled `extism_sys`) once build/CI validated | 1 | Extism/Dylibso maintainers | Low (depends on functional/CI items above) |

## 15. Updates

(No updates yet -- initial report dated 2026-09-10.)

## 16. References

- [extism/extism GitHub repository](https://github.com/extism/extism)
- [Extism homepage](https://extism.org/)
- [extism/extism .github/workflows/release.yml](https://github.com/extism/extism/blob/main/.github/workflows/release.yml)
- [extism/extism .github/workflows/ci.yml](https://github.com/extism/extism/blob/main/.github/workflows/ci.yml)
- [extism/extism .github/workflows/kernel.yml](https://github.com/extism/extism/blob/main/.github/workflows/kernel.yml)
- [extism/extism releases](https://github.com/extism/extism/releases)
- [PyPI extism package JSON API](https://pypi.org/pypi/extism/json)
- [RISE GitLab Python wheel builder, extism simple index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/extism/)
- [Ubuntu packages.ubuntu.com search for Extism, resolute suite](https://packages.ubuntu.com/search?keywords=Extism&suite=resolute&searchon=names&section=all)
- [Arch Linux official package search API](https://archlinux.org/packages/search/json/?name=extism)
- [Arch Linux RISC-V port mirror (archriscv.felixc.at)](https://archriscv.felixc.at/)
- [extism/extism#808, "Consider support for more platforms"](https://github.com/extism/extism/issues/808)
- [extism/extism#456, "Benchmarking"](https://github.com/extism/extism/issues/456)
- [bytecodealliance/wasmtime stability-tiers.md](https://github.com/bytecodealliance/wasmtime)
- [bytecodealliance/wasmtime#13959, Cranelift crash in riscv64 isle](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [bytecodealliance/wasmtime#12195, ISLE panic in gen_bitcast](https://github.com/bytecodealliance/wasmtime/issues/12195)
- [bytecodealliance/wasmtime#12197, tracking issue for missing ISLE lowering rules](https://github.com/bytecodealliance/wasmtime/issues/12197)
- [bytecodealliance/wasmtime#13078, vxrm/vxsat vector-CSR registers not preserved](https://github.com/bytecodealliance/wasmtime/issues/13078)
- [bytecodealliance/wasmtime#9186, *_overflow ops unsupported on riscv64](https://github.com/bytecodealliance/wasmtime/issues/9186)
- [bytecodealliance/wasmtime#5008, tls_value unsupported on riscv64](https://github.com/bytecodealliance/wasmtime/issues/5008)
- [bytecodealliance/wasmtime#5523, rotl.i16 correctness bug on riscv64](https://github.com/bytecodealliance/wasmtime/issues/5523)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project RISC-V runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- Local shallow clone used for verification: `/home/user/extism/extism`, HEAD `d5da29759bba88645f886d9e12d3f4e4376df7b3`