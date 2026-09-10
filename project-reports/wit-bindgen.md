---
title: wit-bindgen
parent: Project Reports
color: yellow
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: wasm-tools
    relation: build-dependency
    criticality: critical
---

# wit-bindgen

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for wit-bindgen<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="wit-bindgen" %}

## 1. Project Overview

wit-bindgen is a code generator that turns WIT (WebAssembly Interface Type) documents into language-specific bindings (Rust, C, C++, Go, D, and others) for the WebAssembly Component Model. It emits target-agnostic source/glue code against the WASM canonical ABI; it is not a runtime, compiler backend, or JIT, and it performs no CPU-architecture-specific code generation of any kind. It is a Rust/Cargo workspace with a `build.rs` and no CMake, no C/system-library dependencies of its own.

**Governance:** wit-bindgen is a project of the [Bytecode Alliance](https://github.com/bytecodealliance/wit-bindgen), an independent, non-Linux-Foundation alliance with published Bylaws and an IP Policy. The Alliance Technical Steering Committee (TSC) governs member projects; the Alliance Board has 9 seats (Bobby Holley/Mozilla-Chair, Ralph Squillace/Microsoft-Treasurer, David Bryant/Executive Director, Tyler McMullen/Fastly, Oscar Spencer/F5, Deian Stefan/UCSD, Bailey Hayes and Pat Hickey at-large, Till Schneidereit as TSC representative). At the repository level there is no formal governance: no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE`, `PLATFORMS.md`, or `SUPPORT.md` file exists. Platform/target support is handled ad hoc via the CI build matrix rather than a documented tier policy. License: triple Apache-2.0 / Apache-2.0 WITH LLVM-exception / MIT.

**Corporate sponsors (by commit count):** Alex Crichton, 513 commits, Fastly (primary maintainer); Dan Gohman, 92, personal domain; Peter Huene, 78+43, Fastly; Joel Dice, 63, Fermyon; Jiaxiao Zhou, 40+14, Microsoft; James Sturtevant, 37, unconfirmed; Guy Bedford, 26, Fastly; Pat Hickey, 23, Bytecode Alliance board; Nick Fitzgerald, 23, unconfirmed; Zihang Ye, 19, IDEA Research (China); Ryan Levick, 15, Fermyon; Victor Adossi, 13, Cosmonic. Corporate presence is dominated by Fastly, with Fermyon and Microsoft also active, plus one academic/independent contributor.

**Community culture on new ports:** no written policy governs adding new architecture/platform ports. The riscv64 addition (see Section 2) shows the actual process: a community contributor with a working, hardware-validated build opened an issue, mirrored the existing CI pattern for a comparable target (aarch64), and received a same-day merge from the lead maintainer with a one-word "Thanks!" review comment, no extended discussion. This mirrors the pattern seen in sibling Bytecode Alliance projects (wasm-tools, wasm-pkg-tools), where riscv64 support was also added by individual/community contributors rather than a corporately sponsored initiative.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-02-23 | Repository history begins | [git log, full history] |
| 2022-09-06 | Issue #104 "64bit support" closed - foundational ABI discussion on 64-bit pointer widths, not RISC-V-specific | [Issue #104](https://github.com/bytecodealliance/wit-bindgen/issues/104) |
| 2026-03-13 | Issue #1567 "Add riscv64gc-unknown-linux-gnu to release artifacts" opened and closed same day | [Issue #1567](https://github.com/bytecodealliance/wit-bindgen/issues/1567) |
| 2026-03-13 | PR #1568 "ci: add riscv64gc-unknown-linux-gnu to release artifacts" merged (commit `3704b06e9b2480cb2f87c474d48f5fcad8f6d511`), approved by Alex Crichton (Fastly) | [PR #1568](https://github.com/bytecodealliance/wit-bindgen/pull/1568) |
| 2026-04-17 | v0.57.0 released - first release to ship a `riscv64gc-linux` binary artifact | [wit-bindgen Releases](https://github.com/bytecodealliance/wit-bindgen/releases) |

**Key contributor:** Bruno Verachten ("gounthar"), an external/community contributor (email `gounthar@gmail.com`), not a listed corporate maintainer. He authored both issue #1567 and PR #1568, citing that sibling Bytecode Alliance projects wasm-tools and wasm-pkg-tools (wkg) already shipped riscv64gc release artifacts, making wit-bindgen "the remaining piece needed for a complete WASIP2 toolchain on RISC-V." He validated the build on physical RISC-V hardware (BananaPi BPI-F3 and SpacemiT K1 boards) before submitting, per his own [dev.to writeup](https://dev.to/gounthar/building-wasi-sdk-on-risc-v-self-hosted-webassembly-development-on-a-banana-pi-f3-eoj).

**Is it fully upstream?** Yes. PR #1568 is merged to `main` and ships in every release from v0.57.0 onward. There is exactly one riscv64-related commit in the project's entire history (confirmed by full-history `git log --all --grep="riscv" -i`); no other riscv64 work is pending, open, or blocked.

## 3. Upstream Support Tier

No formal tier policy exists (no `PLATFORMS.md`/`SUPPORT.md`). Support is determined empirically from the CI build matrix in `.github/workflows/main.yml`, which lists these targets: `x86_64-linux`, `aarch64-linux`, `riscv64gc-linux`, `x86_64-macos`, `aarch64-macos`, `x86_64-windows`, `aarch64-windows`. The `build` job (which produces release artifacts) is a required dependency of the `ci-status` join node that `merge_group` gates on, so a failing riscv64 cross-compile blocks a merge-queue merge - riscv64 is release-blocking for the build step. However, the separate `test` job matrix (`ubuntu-latest`, `macos-latest`, `windows-latest`, `windows-11-arm`) that runs wit-bindgen's actual codegen/runtime test suite across languages (c, rust, cpp, go, d) has no riscv64 entry at all.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`x86_64-linux`) | Yes (`aarch64-linux`) | Yes (`riscv64gc-linux`, cross-compiled) |
| CI runs test suite | Yes (native, `ubuntu-latest`) | No (also not natively tested - cross-compiled to Docker on `ubuntu-latest`, no dedicated test entry) | No |
| Release-blocking (merge_group gate) | Yes | Yes | Yes (build step only) |
| Official release binary | Yes | Yes | Yes, since v0.57.0 |
| Native runner used | Yes (x86_64 host) | No (x86_64 host, Docker cross-compile per `ci/docker/aarch64-linux/Dockerfile`) | No (x86_64 host, Docker cross-compile per `ci/docker/riscv64gc-linux/Dockerfile`) |

Note: aarch64 and riscv64 share the same build-only pattern - neither is natively tested in this CI, only x86_64-linux exercises the full test suite natively. This is a structural characteristic of the project's CI, not a riscv64-specific penalty, but it means riscv64 has no CI signal beyond "compiles and links."

## 4. Technical Architecture and RISC-V-Specific Subsystems

wit-bindgen has no architecture-specific subsystems of the kind this section normally covers (no JIT, no SIMD, no cryptography, no hand-written assembly, no GC barriers). It is a source-to-source generator: it parses WIT documents and emits target-agnostic Rust/C/C++/Go/D source code implementing the WASM Component Model's canonical ABI, which is by design independent of the host CPU's instruction set architecture.

Verification performed: whole-repository search for `riscv`, `vfloat32m1_t`, `rvv`, `riscv64`, `path:riscv`, `riscv32`, `xlen`, `target_arch riscv`, and code search for `target_arch = "riscv64"` / `__riscv` all returned zero source-code hits; the only 2 files anywhere in the repository referencing riscv are `ci/docker/riscv64gc-linux/Dockerfile` and `.github/workflows/main.yml` (both CI/build configuration, not source). The only `target_arch` cfg usage found in the Rust source tree (`crates/guest-rust/src/rt/mod.rs`, `crates/rust/src/lib.rs`, `crates/rust/src/interface.rs`) discriminates `wasm32` (WASM guest) from everything else (native host test harness) - it does not discriminate between host CPU ISAs (x86_64/aarch64/riscv64). A lone `aarch64` reference in `crates/test/src/csharp.rs` is an unrelated .NET packaging workaround for the C# test harness on Windows arm64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture-specific codegen | None (arch-independent by design) | None | None |
| ISA extensions used | N/A | N/A | N/A |
| Quality/tuning | N/A | N/A | N/A |

**Conclusion:** there is no "riscv64 implementation" to be full, partial, or missing at the code level - the project's design makes CPU-architecture-specific code unnecessary. This is not a gap; it is the expected shape of a bindings generator. See Section 13 for how this affects the optimization-purpose modifier (not applicable to this project).

## 5. Build System, Cross-Compilation, and Toolchain

wit-bindgen is a pure Cargo/Rust project - there is no `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, or `cmake/` directory anywhere in the repository. All riscv64 build documentation lives in the CI configuration.

**riscv64 build files:**
- `.github/workflows/main.yml` - CI matrix entry
- `ci/docker/riscv64gc-linux/Dockerfile` - cross-toolchain container
- `ci/build-release-artifacts.sh` - driver script invoking the Docker cross-build
- `ci/build-tarballs.sh` - packages the resulting binary

**Full Dockerfile (`ci/docker/riscv64gc-linux/Dockerfile`):**
```
FROM ubuntu:18.04
RUN apt-get update -y && apt-get install -y gcc gcc-riscv64-linux-gnu ca-certificates git
ENV PATH=$PATH:/rust/bin
ENV CARGO_BUILD_TARGET=riscv64gc-unknown-linux-gnu
ENV CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc
```

**CI matrix entry (`.github/workflows/main.yml`):**
```yaml
- build: riscv64gc-linux
  os: ubuntu-latest
  env:
    CARGO_BUILD_TARGET: riscv64gc-unknown-linux-gnu
    DOCKER_IMAGE: ./ci/docker/riscv64gc-linux/Dockerfile
```

**Reproduction commands:**
```bash
docker build --tag build-image --file ci/docker/riscv64gc-linux/Dockerfile ci/docker
rustup target add riscv64gc-unknown-linux-gnu
docker run --interactive \
  --volume "$(pwd)":"$(pwd)" \
  --volume "$(rustc --print sysroot)":/rust:ro \
  --workdir "$(pwd)" \
  --env CARGO_BUILD_TARGET=riscv64gc-unknown-linux-gnu \
  --env CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc \
  build-image \
  bash -c 'PATH=$PATH:/rust/bin CARGO_PROFILE_RELEASE_STRIP=debuginfo CARGO_PROFILE_RELEASE_PANIC=abort cargo build --release --target riscv64gc-unknown-linux-gnu'
```

**Toolchain versions and why:**
- GCC: not explicitly pinned; installed via `apt-get install gcc-riscv64-linux-gnu` on Ubuntu 18.04 (bionic), which ships GCC 7.3.0 by default. The Dockerfile pattern uses the oldest base image per target that has the needed cross-toolchain packages (16.04 for aarch64, 18.04 for riscv64, almalinux:8 native for x86_64) to maximize glibc-version portability of the released binary - riscv64 glibc cross-support was not available before Ubuntu 18.04 [NEEDS VERIFICATION: no in-repo statement of why 18.04 specifically, this reasoning is inferred from the pattern].
- Clang: not used for the riscv64 host target at all (Clang/wasi-sdk only appears elsewhere in CI for building wasm32 test components, unrelated to riscv64 host builds).
- Rust/Cargo: `rust-version = "1.88.0"`, `edition = "2024"` from the workspace `Cargo.toml`, applies uniformly to all targets. No `rust-toolchain.toml`; CI uses `rustup update stable`.
- No CMake, so no `-DUSE_X=OFF`-style feature flags exist for any target including riscv64.

**QEMU usage:** none found anywhere in the repository (`grep -rin qemu` across the full tree returns zero matches). riscv64 code is cross-compiled and packaged but never executed under emulation or on native hardware within CI.

**Known build failures:** none found. No open issues reference a riscv64 build failure.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CLI binary builds | Yes | Yes | Yes |
| CLI binary tested in CI | Yes (native) | No | No |
| Official release binary | Yes | Yes | Yes (since v0.57.0) |
| Generated-code correctness verified on this host arch | Yes (test job runs on ubuntu-latest/x86_64) | Not directly (no native arm64 test job found in main.yml matrix) | No |
| Community hardware validation | N/A | N/A | Yes, out-of-band (author-reported, BananaPi BPI-F3 and SpacemiT K1) [NEEDS VERIFICATION: single-source, author's own report] |

**Functional gaps:** none identified beyond the absence of test execution. There is no reported case of wit-bindgen failing to generate correct bindings on riscv64; the generated code itself targets the architecture-independent WASM canonical ABI, so a functional gap specific to riscv64 codegen output is not architecturally plausible given how the tool works.

**Performance gaps:** not applicable. wit-bindgen is a build-time source generator; no SIMD or hot-path optimization is part of its value proposition (see Section 13).

**Security hardening gaps:** no data found. No riscv64-specific hardening flags, ASLR/stack-protector configuration differences, or CVEs were identified in the search.

**NaN / floating-point semantics issues:** none found. Multiple targeted searches ("riscv64 performance," "riscv64 bug," "riscv nan floating") in the repository issue tracker returned zero results or only the already-resolved release-artifact issue (#1567).

## 7. CI/CD Infrastructure

**Does riscv64 CI exist?** Yes, narrowly: a build-only, x86_64-hosted, Docker-cross-compiled `riscv64gc-unknown-linux-gnu` target in `.github/workflows/main.yml`'s `build` job, gated on `pull_request` and `merge_group` triggers (no `push`, `workflow_dispatch`, or `schedule` triggers exist in this workflow). This was verified by direct file read of `.github/workflows/main.yml`, `ci/build-release-artifacts.sh`, and `ci/docker/riscv64gc-linux/Dockerfile`.

**RISE runners?** No. The riscv64 build runs on standard `ubuntu-latest` GitHub-hosted x86_64 runners using an installed `gcc-riscv64-linux-gnu` cross-toolchain, not a RISE-provided or any other native riscv64 runner.

**Hardware used:** none - build-only, cross-compiled, never executed. `ci/build-release-artifacts.sh` runs `cargo build --release` inside the Docker container and stops; it does not invoke `cargo test` or execute the resulting binary.

Other CI files checked and confirmed to have no riscv references: `.github/workflows/publish.yml`, `.github/workflows/release-process.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes (native) | Yes (Docker cross-compile) | Yes (Docker cross-compile) |
| CI test job | Yes (native, full test matrix: c/rust/cpp/go/d) | No dedicated entry found | No |
| Merge-blocking | Yes | Yes | Yes (build step only) |
| Runner | `ubuntu-latest` native | `ubuntu-latest` + Docker cross-compile | `ubuntu-latest` + Docker cross-compile |
| QEMU execution | N/A | Not found | Not found |

## 8. Distribution and Release Status

**Official binaries for riscv64:** Yes. GitHub Releases ships `wit-bindgen-<version>-riscv64gc-linux.tar.gz` starting at v0.57.0 (published 2026-04-17), consistent with PR #1568 merging 2026-03-13. This was verified to the byte level: the v0.61.1 asset (6,391,297 bytes, `content_type: application/x-gtar`) was downloaded directly and extracted; it contains `LICENSE-APACHE`, `LICENSE-MIT`, `README.md`, and a `wit-bindgen` binary. Running `file` on the extracted binary confirms: `ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI, ... dynamically linked, interpreter /lib/ld-linux-riscv64-lp64d.so.1, for GNU/Linux 4.15.0` - a genuine RISC-V ELF executable, not a naming artifact or placeholder.

**PyPI:** not applicable. wit-bindgen is a Rust CLI tool, not distributed via PyPI (`https://pypi.org/pypi/wit-bindgen/json` returns HTTP 404).

**npm, Maven, OCI:** no evidence searched or found of distribution via these channels; wit-bindgen's primary distribution channels are GitHub Releases and `cargo install`/crates.io source builds.

**Ubuntu (26.04/resolute):** not packaged at all, for any architecture. `packages.ubuntu.com` search for `wit-bindgen` in suite `resolute` returns "Sorry, your search gave no results."

**Debian, Fedora, Arch RISC-V:** not checked in detail beyond the Ubuntu result; given wit-bindgen is absent from Ubuntu, it is unlikely to be packaged elsewhere, but this was not independently confirmed. Data not available: Debian tracker, Fedora packages, and Arch RISC-V (archriscv.felixc.at) were not queried for wit-bindgen specifically in this research pass.

**What a user must do to get a working binary today:** download the `riscv64gc-linux` tarball directly from the [GitHub Releases page](https://github.com/bytecodealliance/wit-bindgen/releases) (v0.57.0 or later), or build from source via `cargo build --release --target riscv64gc-unknown-linux-gnu` using a riscv64 cross-toolchain, or `cargo install wit-bindgen-cli` on a native riscv64 host if the Rust toolchain and target are available there [NEEDS VERIFICATION: native on-device `cargo install` path was not directly tested in the research].

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Rust (build-dependency, critical) | Compiler/toolchain; `rust-version = "1.88.0"`, edition 2024. `riscv64gc-unknown-linux-gnu` is a Rust Tier-2 target on stable toolchains. | Yes - Rust stable supports the target via `rustup target add riscv64gc-unknown-linux-gnu` | N/A (toolchain, not tested itself in this context) | N/A | No riscv64-specific issues found for the Rust toolchain in this research |
| GCC (build-dependency, critical) | Cross-linker for the riscv64gc target: `gcc-riscv64-linux-gnu` package supplies `riscv64-linux-gnu-gcc`, set as `CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER`. Installed via `apt-get install gcc-riscv64-linux-gnu` on Ubuntu 18.04 (GCC ~7.3.0, unpinned). | Yes - confirmed working in CI (`ci/docker/riscv64gc-linux/Dockerfile`) | N/A | N/A | No version pin in-repo; relies on distro-default cross-gcc package |
| wasm-tools (build-dependency, critical) | The `bytecodealliance/wasm-tools` crate family (wat, wasmparser, wasm-encoder, wasm-metadata, wit-parser, wit-component, wasm-compose) - WASM binary-format parsers/encoders and component-model tooling that wit-bindgen cannot function without. Pure Rust, no arch-specific code. | Yes - `bytecodealliance/wasm-tools` CI builds `riscv64gc-unknown-linux-gnu` (build label `riscv64-linux`) via the same cross-compile pattern | No - same as wit-bindgen, cross-compiled only, not executed in CI | Yes - `bytecodealliance/wasm-tools#2463` "Add riscv64gc-unknown-linux-gnu to release artifacts," closed/merged | No open riscv64 issues found for wasm-tools |
| General Rust ecosystem crates (anyhow, bitflags, heck, pulldown-cmark, serde/serde_json, clap, indexmap, prettyplease, syn, futures, macro-string, env_logger) | General-purpose codegen/CLI plumbing, transitive dependencies via Cargo.toml | Pure Rust, no architecture-specific code; builds wherever `rustc`/`cargo` targets riscv64 | Exercised indirectly via `cargo test` on any host | Distributed via crates.io (architecture-independent source) | No riscv64 issues surfaced for any of these crates |

Note: **Wasmtime is not a dependency of wit-bindgen** - a sibling Bytecode Alliance project, easy to conflate, but confirmed absent from `Cargo.toml`. wit-bindgen has no dependencies in the traditionally "critical" risk categories (JIT backend, SIMD library, numerics/crypto/compression library, custom memory allocator) - it is a source-code generator, not a runtime.

## 10. Ecosystem Status

Not applicable. wit-bindgen has no dependent package ecosystem of the kind this section covers (no PyPI/npm/Maven/Kubernetes-operator consumers to enumerate) - it is consumed as a standalone CLI tool or a Cargo build-dependency by individual projects, not via a package-manager ecosystem with its own riscv64 coverage fraction to measure. Section omitted per report convention for standalone tools without a dependent ecosystem.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1567](https://github.com/bytecodealliance/wit-bindgen/issues/1567) | Add riscv64gc-unknown-linux-gnu to release artifacts | Closed (resolved by #1568) | N/A - feature request, not a bug | Resolved same-day, 2026-03-13 |

No open riscv64 issues or PRs exist in the repository as of this report. A targeted `state:open` search for riscv64 issues returned zero results. No correctness bugs, no performance bugs, and no NaN/floating-point issues were found on riscv64 (see Section 6).

## 12. Objections and Upstream Blockers

**Stated objections:** none found. The riscv64 CI/release PR (#1568) was approved and merged same-day with a one-word "Thanks!" review comment from lead maintainer Alex Crichton (Fastly) - no requested changes, no blocking discussion, no correctness concerns raised.

**Technical blockers:** none identified. The change was a 12-line diff mirroring the existing, working `aarch64-linux` pattern; the generic build/tarball scripts (`ci/build-release-artifacts.sh`, `ci/build-tarballs.sh`) required zero riscv64-specific modification since they are already parameterized by `CARGO_BUILD_TARGET`.

**Organizational blockers:** none. No formal port-acceptance process was invoked or needed; the Bytecode Alliance's informal, low-friction process (a contributor with a working, hardware-validated build gets a same-day merge) applied cleanly.

**Acceptance probability for further riscv64 work:** high, based on demonstrated precedent - this project (and its sibling wasm-tools/wasm-pkg-tools) accepted riscv64 CI/release additions without friction. The remaining gap (no riscv64 test execution in CI) is a natural next ask that follows the same low-friction pattern, though no such PR or issue currently exists.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Optimization level:** not applicable - wit-bindgen is not an optimization-purpose project (it is a source-code generator whose value proposition does not depend on architecture-specific performance tuning; see Section 4).
- **Justification:** Upstream CI in `.github/workflows/main.yml` cross-compiles the `riscv64gc-unknown-linux-gnu` target in the `build` job (required for merge via the `ci-status` gate on `merge_group`), but the project's `test` job matrix - which runs the actual codegen/runtime test suite across languages (c, rust, cpp, go, d) - has no riscv64 entry and never executes on riscv64, confirmed by direct read of the workflow file and by the absence of any QEMU usage anywhere in the repository (`grep -rin qemu` returns zero matches). Per the color model's Step 1 table, "builds riscv64 but does not run tests" places the project at yellow regardless of release status. Upstream does directly publish a riscv64 release binary (GitHub Releases, `wit-bindgen-<version>-riscv64gc-linux.tar.gz`, verified as a genuine RISC-V ELF executable since [v0.57.0](https://github.com/bytecodealliance/wit-bindgen/releases)), so `release_provider` is `upstream`, but green and blue both require upstream test execution, which is absent here.
- **Pending work that could change the grade:** none currently in flight. No open PR or issue proposes adding riscv64 test execution (native or QEMU-based) to CI. No RISE Project involvement was found for this project (not a RISE member, no RISE blog posts, no `riseproject-dev` repository or code references beyond this report's own tracking queue). Given the demonstrated low-friction acceptance pattern (Section 12), a future PR adding a QEMU-based or native-hardware test step to the existing `riscv64gc-linux` build job would plausibly upgrade this project to blue (test passes, no change to release provider) with minimal upstream resistance.

## 14. Investment Analysis

RISE has not funded or performed any work on wit-bindgen: no RISE blog posts, no `riseproject-dev` repository dedicated to it, and no RISE-runner usage were found (Section 2/13). All riscv64 work to date (PR #1568) was contributed by an unaffiliated community member (gounthar) validating on personally-owned hardware (BananaPi BPI-F3, SpacemiT K1), not RISE infrastructure. The following sizing assumes no prior RISE coverage.

### 14.1 Functional Enablement

No functional enablement work is required. riscv64 already builds cleanly and ships official release binaries since v0.57.0. No open functional gaps were identified.

### 14.2 Performance Optimization

Not applicable. wit-bindgen is a build-time source-code generator with no architecture-specific hot paths; there is no performance-optimization work to size (see Section 4 and Section 13).

### 14.3 CI/CD Infrastructure

The one concrete gap is test execution on riscv64. Closing it requires adding either a QEMU-based emulated test step or access to native riscv64 CI hardware/runners to the existing `build` job (or a new job) in `.github/workflows/main.yml`, then wiring the existing `test`/`test_unit` job logic (currently `ubuntu-latest`/`macos-latest`/`windows-latest`) to also run against the riscv64gc cross-built or natively-built binary. This is a small, well-scoped change given the precedent of low-friction acceptance for the aarch64/riscv64 build-matrix pattern.

### 14.4 Ecosystem Enablement

Not applicable per Section 10 - no dependent package ecosystem exists for this project.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU-based (or native-hardware) riscv64 test execution to `.github/workflows/main.yml`, extending the existing `build`/`test` job pattern | 1-2 | Upstream (Bytecode Alliance) or a community/RISE contributor following the established PR pattern | Medium |
| Functional | None - already builds and releases cleanly on riscv64 | 0 | N/A | N/A |
| Performance | None - not an optimization-purpose project | 0 | N/A | N/A |
| Ecosystem | None - no dependent package ecosystem | 0 | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Issue #1567 - Add riscv64gc-unknown-linux-gnu to release artifacts](https://github.com/bytecodealliance/wit-bindgen/issues/1567)
- [PR #1568 - ci: add riscv64gc-unknown-linux-gnu to release artifacts](https://github.com/bytecodealliance/wit-bindgen/pull/1568)
- [Issue #104 - 64bit support](https://github.com/bytecodealliance/wit-bindgen/issues/104)
- [wit-bindgen GitHub repository](https://github.com/bytecodealliance/wit-bindgen)
- [wit-bindgen Releases page](https://github.com/bytecodealliance/wit-bindgen/releases)
- [.github/workflows/main.yml (CI workflow, riscv64gc-linux matrix entry)](https://github.com/bytecodealliance/wit-bindgen/blob/main/.github/workflows/main.yml)
- [ci/docker/riscv64gc-linux/Dockerfile](https://github.com/bytecodealliance/wit-bindgen/blob/main/ci/docker/riscv64gc-linux/Dockerfile)
- [Building WASI SDK on RISC-V: Self-Hosted WebAssembly Development on a Banana Pi F3 (dev.to, gounthar)](https://dev.to/gounthar/building-wasi-sdk-on-risc-v-self-hosted-webassembly-development-on-a-banana-pi-f3-eoj)
- [bytecodealliance/wasm-tools PR #2464 / issue #2463 - riscv64 release artifacts (sibling project precedent)](https://github.com/bytecodealliance/wasm-tools)
- [RISE Project (riseproject.dev) - member list, checked for wit-bindgen involvement, none found](https://riseproject.dev)
- [PyPI JSON API - wit-bindgen not found (HTTP 404), confirming this is not a PyPI-distributed package](https://pypi.org/pypi/wit-bindgen/json)
- [Ubuntu packages search - wit-bindgen not packaged in suite resolute](https://packages.ubuntu.com/search?keywords=wit-bindgen&suite=resolute&searchon=names&section=all)