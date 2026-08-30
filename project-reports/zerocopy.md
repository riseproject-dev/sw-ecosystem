---
title: zerocopy
parent: Project Reports
color: yellow
---

# zerocopy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for zerocopy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

zerocopy is a Rust library providing safe, zero-cost memory layout manipulation via the type system. Its core value is enabling safe transmutation between byte slices and typed structs without runtime overhead, through traits such as `FromBytes`, `IntoBytes`, `TryFromBytes`, and `FromZeros`. The derive macros in the companion `zerocopy-derive` crate generate compile-time-verified implementations of these traits.

The library originated inside the Fuchsia OS project at Google (earliest commit: 2019-12-27; first crates.io publication: 2018-08-15). It was extracted into a standalone GitHub repository on 2022-09-08. Copyright is held by "The Fuchsia Authors." License is `BSD-2-Clause OR Apache-2.0 OR MIT`.

**Governance:** No foundation affiliation (not Linux Foundation, CNCF, Rust Foundation, Apache, or RISE). No CODEOWNERS, MAINTAINERS, or OWNERS file exists. The project is Google-controlled in practice. Joshua Liebow-Feeser (`joshlf`, Google) is the de-facto BDFL: 767 commits, 165 of 167 crates.io releases, and sole merge authority. Jack Wrenn (`jswrenn`, Amazon) is co-maintainer with 133 commits and crates.io co-ownership. All other contributors have fewer than 20 commits each. A Google CLA is required for contributions.

**Community stance on new ports:** No formal tier policy document exists. The implicit policy inferred from maintainer decisions is that Miri support is the gating criterion for adding a target to the full CI matrix. Targets without Miri support are treated as lower-value additions. Compile-check-only is acceptable for exotic embedded targets. Community contributions are welcome but the bar is high: thorough tests, Miri coverage, and soundness proofs are expected. Decisions route through `joshlf` directly with no foundation overhead.

**RISE involvement:** None. zerocopy has no RISE blog coverage, no RISE-funded work, no RISE runner usage, and does not appear in the RISE Python wheel builder. It appears in this repository only as a transitive Rust dependency of Alioth (a RISC-V hypervisor) and Comprehensive Rust.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-10-04 | Issue [#22](https://github.com/google/zerocopy/issues/22) opened by `joshlf`: Miri does not support `riscv64gc-unknown-linux-gnu`; RISC-V CI blocked | [Issue #22](https://github.com/google/zerocopy/issues/22) |
| 2023-08-16 | [PR #269](https://github.com/google/zerocopy/pull/269) merged by `joshlf`: adds `riscv64gc-unknown-linux-gnu` to CI build matrix; Miri explicitly excluded | [PR #269](https://github.com/google/zerocopy/pull/269), commit [`d0724b27`](https://github.com/google/zerocopy/commit/d0724b27a9422785f1c7d8815d5410b5b71a973c) |
| 2023-08-16 | [PR #272](https://github.com/google/zerocopy/pull/272) closed without merge: loongarch64 rejected as redundant given the existing riscv64gc target | [PR #272](https://github.com/google/zerocopy/pull/272) |
| 2024-10-06 | Issue #22 updated: Miri still does not support `riscv64gc-unknown-linux-gnu`; remains open and blocked on upstream | [Issue #22](https://github.com/google/zerocopy/issues/22) |
| 2025-08-23 | Issue [#1077](https://github.com/google/zerocopy/issues/1077) updated with user comment describing production use of zerocopy structs shared between RISC-V firmware and x86-64 host code | [Issue #1077](https://github.com/google/zerocopy/issues/1077) |
| 2026-03-10 | [PR #3103](https://github.com/google/zerocopy/pull/3103) opened by `joshlf`: adds `riscv32imc-unknown-none-elf` codegen/assembly snapshot tracking alongside `thumbv7m-none-eabi`; not yet merged | [PR #3103](https://github.com/google/zerocopy/pull/3103) |

**Key contributors to RISC-V work:**

| Contributor | Org | Role |
|---|---|---|
| `joshlf` (Joshua Liebow-Feeser) | Google | Opened issue #22, authored and merged PR #269, authored PR #3103 |
| `jswrenn` (Jack Wrenn) | Amazon | Co-maintainer; reviewing PR #3103 |
| `RalfJung` | (Miri maintainer, external) | Confirmed Miri does not support riscv64gc; no fix timeline given |

**Upstreaming status:** Fully upstream. There is no downstream fork or patch set. `riscv64gc-unknown-linux-gnu` has been in the upstream CI matrix since August 2023. No out-of-tree patches are required.

---

## 3. Upstream Support Tier

No formal tier policy document exists in the zerocopy repository. The implicit policy is Miri-gated: targets without Miri support are excluded from the Miri job and from PR-event CI runs.

**Comparison table:**

| Dimension | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| In CI build matrix | Yes | Yes | Yes (since Aug 2023) |
| CI runs on PRs | Yes | No (cross target) | No (cross target) |
| CI runs on push/merge | Yes | Yes | Yes |
| Test execution in CI | Yes (native) | No (cross-compile only) | No (cross-compile only) |
| Miri coverage | Yes | Yes | No - excluded (issue #22) |
| Official upstream binary | N/A (source crate) | N/A | N/A |
| Ubuntu 26.04 package | Yes | Yes | Yes (0.8.26-4) |

**Notes on CI scope for riscv64:** The CI step for cross targets runs `cargo check --tests` (type-checks all test code) and `cargo build` (full compilation to riscv64 ELF). The CI comment in `ci.yml` states explicitly: "Cross targets cannot execute tests on this Linux x86_64 runner, so check test-only code and build library code in separate passes." No QEMU is installed; no native riscv64 runner is used. The runner is `ubuntu-latest` (x86_64) for all jobs without exception.

riscv64 is also excluded from `pull_request` events via an explicit matrix exclusion (`event_name: pull_request`). It runs only on `push` to `main`, `merge_group`, and `workflow_dispatch`.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

zerocopy is a pure-Rust, architecture-agnostic library. Its entire implementation operates on byte slices and Rust's type system. There is no JIT, no GC, no crypto, no compression, and no hand-written assembly in the library itself.

The only architecture-specific code in the repository is in `zerocopy/src/impls.rs`, in the `mod simd {}` block, which implements `FromZeros`, `FromBytes`, and `IntoBytes` for platform SIMD vector types from `core::arch`. This block covers x86/x86_64 (SSE/AVX/AVX-512), wasm32 (`v128`), aarch64 (47 NEON types), powerpc/powerpc64 (AltiVec, nightly-only), and arm 32-bit (nightly-only, no types listed). RISC-V is absent from this block.

**Why RISC-V SIMD is absent:** Rust's `core::arch` module does not expose stable RISC-V Vector (RVV) types. The RISC-V Vector extension intrinsics are not yet stabilized in Rust's stdarch. There is nothing for zerocopy to implement. This is the correct state of the ecosystem, not a stub or oversight.

**Component coverage table:**

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Core traits (`FromBytes`, `IntoBytes`, `TryFromBytes`, `FromZeros`) | Full | Full | Full | Pure Rust, arch-neutral |
| Derive macros (`zerocopy-derive`) | Full | Full | Full | Proc-macro, arch-neutral |
| Atomic type impls | Full | Full | Full | Via `target_has_atomic` cfg; riscv64gc supports all widths |
| SIMD type impls | Full (10 types + AVX-512) | Full (47 NEON types) | Absent | No stable `core::arch::riscv64` SIMD types in Rust |
| Miri test execution | Full | Full | Excluded | Upstream Miri limitation; issue #22 |
| Codegen/assembly snapshots | Full (70 benches) | Absent | Absent | x86-64 only today; PR #3103 adds riscv32 (not yet merged) |

**Assembly quality data (from PR #3103, `riscv32imc-unknown-none-elf`):**

The codegen snapshots in PR #3103 show real, non-trivial RISC-V 32-bit assembly. For `read_from_bytes_static_size` (a 6-byte struct read), rv32 emits 6 individual `lbu` (load byte unsigned) instructions plus shift/or reconstruction, versus x86-64's 2 memory operations. This is an architectural consequence of `riscv32imc` lacking guaranteed unaligned word access, not a zerocopy deficiency. For reference-only operations (`ref_from_bytes_static_size`), rv32 and x86-64 produce identical instruction counts (7 each). For `transmute_ref_static_size`, the output is a single `ret` on both architectures - zero-cost as expected.

These snapshots are for `riscv32imc-unknown-none-elf` (embedded, no-std). No equivalent codegen snapshots exist for `riscv64gc-unknown-linux-gnu`.

---

## 5. Build System, Cross-Compilation, and Toolchain

zerocopy uses Cargo exclusively. There is no CMake, Autoconf, Meson, or any other build system. No `CMakeLists.txt`, `BUILDING.md`, `INSTALL`, or cross-compilation documentation files exist in the repository.

**Mandatory wrapper:** The repository requires using `./cargo.sh` instead of raw `cargo`. The wrapper builds `tools/cargo-zerocopy` and translates human-friendly toolchain names to pinned versions from `Cargo.toml`.

**Exact commands for riscv64:**

```
rustup target add riscv64gc-unknown-linux-gnu

./cargo.sh +stable check --tests \
  --package zerocopy \
  --target riscv64gc-unknown-linux-gnu \
  --no-default-features \
  --features __internal_use_only_features_that_work_on_stable \
  --verbose

./cargo.sh +stable build \
  --package zerocopy \
  --target riscv64gc-unknown-linux-gnu \
  --no-default-features \
  --features __internal_use_only_features_that_work_on_stable \
  --verbose
```

**Pinned toolchain versions (from `Cargo.toml` `[package.metadata.ci]`):**

| Toolchain | Version |
|---|---|
| MSRV | 1.56.0 |
| stable | 1.93.1 |
| nightly | nightly-2026-01-25 |

**MSRV policy:** An MSRV increase is treated as a semver-breaking change and is only made on major version trains (e.g., 0.7 to 0.8).

**Cross-compilation toolchain:** Rust's built-in LLVM linker handles riscv64 cross-compilation. No `gcc-riscv64-linux-gnu` cross-linker is installed in the CI Dockerfile. No `Cross.toml` exists. No `cross` tool is invoked.

**QEMU:** Not used. The CI Dockerfile installs no QEMU packages. Test binaries are never executed for riscv64.

**Known build failures:** None. The research findings confirm that all 16 CI jobs for `riscv64gc-unknown-linux-gnu` pass on the latest main branch run (Build and Tests #12736, 2026-08-26), across msrv/stable/nightly toolchains and multiple feature profiles.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| `alloc` | Works | Works | Works | |
| `std` | Works | Works | Works | |
| `derive` | Works | Works | Works | |
| `simd` (stable) | Works (SSE/AVX types) | Works (NEON types) | Compiles, no-op | No `core::arch::riscv64` SIMD types in stable Rust |
| `simd-nightly` | Works (AVX-512 + more) | Works | Compiles, no-op | Same reason |
| `float-nightly` | Works | Works | Works | Architecture-neutral |
| `__internal_use_only_features_that_work_on_stable` | Works | Works | Works | Alias for alloc+derive+simd+std |

**Functional gaps:** None. All core zerocopy functionality (safe transmutation, layout verification, derive macros, atomic type impls) works identically on riscv64.

**Performance gaps from missing SIMD:** The `simd` feature on riscv64 compiles but registers no types. Code that uses zerocopy to transmute SIMD vector types (e.g., processing `__m256` buffers on x86-64 or `float32x4_t` buffers on aarch64) has no equivalent on riscv64 because the underlying `core::arch::riscv64` SIMD types do not exist in stable Rust. This is an upstream Rust/stdarch gap. Once RVV types are stabilized in Rust, zerocopy would need to add implementations for them.

**Security hardening gaps:** Miri is excluded from riscv64 CI (issue #22, open since 2022). Miri is zerocopy's primary tool for detecting undefined behavior and unsound transmutations. All code is fully type-checked and compiled for riscv64, but runtime memory-model verification via Miri is absent. This is a soundness-check gap, not a confirmed runtime defect.

**Floating-point semantics:** Issue [#1121](https://github.com/google/zerocopy/issues/1121) (closed 2024-09-10) investigated whether `f32`/`u32` transmutation is sound given DAZ/FTZ (denormals-are-zero/flush-to-zero) modes. The investigation found that `thumbv7neon` (AArch32 Neon) exhibits DAZ/FTZ by default. Standard RISC-V with F/D extensions does not have a DAZ/FTZ default mode, so this concern does not apply to riscv64. zerocopy's float transmutation is considered sound on riscv64.

**Cross-platform layout stability:** Issue [#1077](https://github.com/google/zerocopy/issues/1077) (open) documents a real-world use case: a user shares zerocopy structs between RISC-V firmware and x86-64 host code and wants automated cross-platform layout guarantees. The current workaround is manual `const` field-offset assertions. `FromBytes` does not imply cross-platform layout stability; `#[repr(C)]` is required separately. No automated tooling exists for this use case.

---

## 7. CI/CD Infrastructure

**CI system:** GitHub Actions only. No GitLab CI, Jenkins, Cirrus CI, or Travis CI files exist in the repository.

**Relevant workflow file:** `.github/workflows/ci.yml` (1072 lines). All other workflow files (`anneal-release.yml`, `anneal.yml`, `backport-pr.yml`, `dependency-review.yml`, `docs.yml`, `release-crate-version.yml`, `release.yml`, `roll-pinned-toolchain-versions.yml`, `scorecard.yml`) contain no riscv references.

**CI comparison table:**

| Dimension | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| In `build_test` matrix | Yes | Yes | Yes |
| Runs on PRs | Yes | No | No |
| Runs on push to main | Yes | Yes | Yes |
| Runner | `ubuntu-latest` (native) | `ubuntu-latest` (cross) | `ubuntu-latest` (cross) |
| Test execution | Yes | No | No |
| Miri | Yes | Yes | No (excluded, line 607) |
| QEMU | N/A | No | No |
| Native hardware | N/A | No | No |
| RISE runners used | No | No | No |

**RISE runners:** The RISE RISC-V Runners (`ubuntu-24.04-riscv`, Scaleway EM-RV1 hardware) were announced 2026-03-24 and are available for free use by open-source projects. zerocopy does not use them. All CI runs on `ubuntu-latest` (x86_64) without exception.

**Toolchains tested on riscv64:** `msrv` (1.56.0), `stable` (1.93.1), `nightly` (nightly-2026-01-25), `no-zerocopy-target-has-atomics-1-60-0`, `no-zerocopy-panic-in-const-and-vec-try-reserve-1-57-0`. Excluded from riscv64: `no-zerocopy-aarch64-simd-*` (aarch64-only), `no-zerocopy-core-error-*`, `no-zerocopy-diagnostic-*`, `no-zerocopy-generic-bounds-*` (only tested on i686/x86_64).

---

## 8. Distribution and Release Status

zerocopy is a Rust library crate distributed via [crates.io](https://crates.io/crates/zerocopy) as source code. GitHub releases contain no binary assets. The concept of "riscv64 binary release" does not apply in the same way as for compiled executables or Python wheels.

**Current upstream version:** 0.8.56 (released 2026-08-06; 167 total releases, all published by `joshlf`).

**Ubuntu 26.04 (resolute) packages:**

| Package | Version | Architectures | Pool |
|---|---|---|---|
| `librust-zerocopy-dev` | 0.8.26-4 | amd64 arm64 armhf ppc64el riscv64 s390x | universe/rust |
| `librust-zerocopy-derive-dev` | 0.8.26-3 | amd64 arm64 armhf ppc64el riscv64 s390x | universe/rust |

Both packages were confirmed present as downloadable `.deb` files on `ports.ubuntu.com` via HTTP HEAD (200 OK, `Content-Type: application/vnd.debian.binary-package`). `librust-zerocopy-dev_0.8.26-4_riscv64.deb` is 187,104 bytes; `librust-zerocopy-derive-dev_0.8.26-3_riscv64.deb` is 62,856 bytes. Last-modified dates are October 2025 and September 2025 respectively.

**Version lag:** The Ubuntu 26.04 packages are at 0.8.26, while upstream is at 0.8.56 - 30 patch releases behind. This is a standard Ubuntu packaging lag and is not specific to riscv64.

**What a user must do to get a working riscv64 build:**

- Via Cargo (recommended): `cargo add zerocopy` in a Rust project; cross-compile with `--target riscv64gc-unknown-linux-gnu`. No special steps required.
- Via Ubuntu 26.04: `apt install librust-zerocopy-dev` on a riscv64 system. Installs version 0.8.26-4.

**PyPI note:** A Python package named `zerocopy` (v0.1.0) exists on PyPI but is a completely different project ("Zero-copy model loading for PyTorch and Ray"). It ships a `py3-none-any` pure-Python wheel and is unrelated to `google/zerocopy`.

---

## 9. Dependencies

**Runtime dependency table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| `zerocopy-derive` | Proc-macro for `#[derive(FromBytes, IntoBytes, ...)]`; optional, gated by `derive` feature | Pass | Pass (cross-compiled; Miri excluded) | `librust-zerocopy-derive-dev` 0.8.26-3 in Ubuntu 26.04 riscv64 | Ubuntu package 30 patch releases behind upstream |
| `proc-macro2` | Proc-macro infrastructure used by zerocopy-derive | Pass | Pass | `librust-proc-macro2-dev` 1.0.101-1build1 in Ubuntu 26.04 riscv64 | None |
| `syn` | Rust syntax parsing used by zerocopy-derive | Pass | Pass | `librust-syn-dev` 2.0.105-1build1 in Ubuntu 26.04 riscv64 | None |
| `quote` | Quasi-quoting used by zerocopy-derive | Pass | Pass | `librust-quote-dev` 1.0.40-1 in Ubuntu 26.04 riscv64 | None |
| `rustc` (Rust toolchain) | Compiler | Pass (`riscv64gc-unknown-linux-gnu` is Tier 2 with Host Tools) | Partial - CI infrastructure improvements ongoing | `rustc` 1.93.1ubuntu1 in Ubuntu 26.04 riscv64 | [rust-lang/rust#157749](https://github.com/rust-lang/rust/issues/157749) SIGSEGV on RISC-V (open); [rust-lang/rust#126641](https://github.com/rust-lang/rust/issues/126641) enable riscv64gc-gnu testing (open); [rust-lang/rust#152098](https://github.com/rust-lang/rust/issues/152098) wrong rust-lld for riscv64gc (open) |

**Dev/test dependency table (not blocking runtime):**

| Dependency | Role | Ubuntu 26.04 riscv64 | Notes |
|---|---|---|---|
| Miri | UB detection for test suite | Not available as standalone package | Excluded from riscv64 CI; issue #22 open since 2022 |
| `rand` 0.8.7 | Randomized testing | `librust-rand-dev` 0.8.5-1 (minor version mismatch) | Not blocking |
| `regex` 1.0 | Test utilities | `librust-regex-dev` 1.12.2-1 | None |
| `itertools` 0.11 | Test utilities | `librust-itertools-dev` 0.14.0-2 | None |
| `elain` 0.3.0 | Layout gadgets in tests | Not found in Ubuntu 26.04 riscv64 | May affect building tests from Ubuntu packages |
| `static_assertions` 1.1 | Compile-time assertions | `librust-static-assertions-dev` 1.1.0-1build1 | None |
| `rustversion` 1.0 | Conditional compilation by Rust version | `librust-rustversion-dev` 1.0.22-1 | None |

**Rust toolchain open issues affecting riscv64:** Three open issues in `rust-lang/rust` are relevant. [#157749](https://github.com/rust-lang/rust/issues/157749) reports a SIGSEGV on RISC-V in some builds. [#126641](https://github.com/rust-lang/rust/issues/126641) tracks enabling `riscv64gc-gnu` testing in the Rust CI. [#152098](https://github.com/rust-lang/rust/issues/152098) reports wrong `rust-lld` for `riscv64gc`. None of these have been observed to block zerocopy builds specifically, but they represent upstream toolchain risk.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#22](https://github.com/google/zerocopy/issues/22) | Run `cargo miri test` on wasm and riscv target once they're supported | Open | Medium | Miri does not support `riscv64gc-unknown-linux-gnu`; explicitly excluded from CI Miri job (ci.yml line 607); blocked on upstream `rust-lang/miri`; `@RalfJung` (Miri maintainer) confirmed no fix timeline |
| [#3103](https://github.com/google/zerocopy/pull/3103) | [codegen] Track thumbv7m-none-eabi, riscv32imc-unknown-none-elf | Open PR | Low | Adds riscv32 assembly snapshots; has a critical build.rs path bug flagged by `gemini-code-assist`; not yet merged |
| [#1077](https://github.com/google/zerocopy/issues/1077) | Document layout stability considerations | Open | Low | User comment (2025-08-23) describes RISC-V firmware / x86-64 host struct sharing; no automated cross-platform layout guarantee exists |

**Architecture-agnostic correctness/soundness issues (affect riscv64 equally):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#388](https://github.com/google/zerocopy/issues/388) | Other proc macros can break the soundness of our custom derives | Open | High | Architecture-agnostic soundness bug |
| [#1292](https://github.com/google/zerocopy/issues/1292) | `KnownLayout` violates private-in-public rules | Open | Medium | Blocked on Rust upstream |
| [#707](https://github.com/google/zerocopy/issues/707) | Not all UI tests are run in CI | Open | Low | CI infrastructure gap |
| [#2751](https://github.com/google/zerocopy/issues/2751) | Optimize `Ref` size and performance | Open | Low | Performance; would benefit riscv64 equally |

**No riscv64-specific correctness bugs have been reported.** The research found zero GitHub issues matching `riscv64 bug repo:google/zerocopy state:open`.

---

## 12. Objections and Upstream Blockers

**Miri support (upstream blocker, open since 2022):** Miri does not support `riscv64gc-unknown-linux-gnu`. This is tracked in issue [#22](https://github.com/google/zerocopy/issues/22), labeled `blocked-on-rust`. The Miri maintainer (`@RalfJung`) is aware but has given no fix timeline. A PR to add riscv64 native CI runners to the Miri project was rejected by Miri maintainers (who prefer a cross-testing approach). zerocopy cannot resolve this unilaterally.

**Implicit policy barrier:** The maintainer (`joshlf`) has stated that targets without Miri support "don't buy us much" (from the PR #272 closure comment). This means riscv64 will remain in a second-class CI position (build-only, excluded from PRs) until Miri adds riscv64 support.

**RVV SIMD type impls (upstream Rust/stdarch blocker):** No stable `core::arch::riscv64` SIMD types exist in Rust. Until Rust's stdarch stabilizes RVV intrinsics, zerocopy cannot implement SIMD trait coverage for riscv64. This is not a zerocopy-specific blocker but an ecosystem-wide gap.

**PR #3103 build.rs path bug:** The open PR adding riscv32 codegen tracking has a critical path bug flagged by `gemini-code-assist`. The `#[path]` attribute generates paths relative to the crate root but the bench files are at the repo root. This must be fixed before the PR can merge. [NEEDS VERIFICATION - the exact impact on merge timeline is not confirmed from the research findings.]

**Acceptance probability for new RISC-V contributions:** High for build/CI improvements (the project already accepted PR #269 with no review delay). Low for SIMD type impls until upstream Rust stabilizes RVV intrinsics. Moderate for Miri-related work if upstream Miri adds riscv64 support.

---

## 13. Readiness Assessment

**Color:** Yellow (build-only CI, no test execution on riscv64)

**Release provider:** distro (Ubuntu 26.04 ships `librust-zerocopy-dev` 0.8.26-4 for riscv64; upstream publishes source only via crates.io)

**Justification:** zerocopy's upstream CI cross-compiles and type-checks for `riscv64gc-unknown-linux-gnu` across msrv/stable/nightly toolchains, but does not execute tests on riscv64 - the CI comment in `ci.yml` states explicitly "Cross targets cannot execute tests on this Linux x86_64 runner." No QEMU is used, no native riscv64 runner is used, and riscv64 is excluded from PR-event CI runs. This places the project at yellow under the distribution floor rule: upstream CI builds riscv64 but does not run tests. The library is functionally correct on riscv64 (pure Rust, architecture-agnostic, no known riscv64 bugs), but the absence of test execution in CI means the upstream has not formally verified runtime behavior on the target.

**Pending work that could change the grade:**
- If zerocopy adopts RISE RISC-V Runners (`ubuntu-24.04-riscv`) to execute tests natively, the grade would move to blue (CI builds + tests pass, no upstream riscv64 artifact - since the crate is source-only).
- If upstream Miri adds `riscv64gc-unknown-linux-gnu` support (tracked in issue [#22](https://github.com/google/zerocopy/issues/22)), zerocopy would gain full Miri coverage and the grade would move to blue.
- Neither of these is currently in progress. zerocopy does not use RISE runners and issue #22 is blocked on `rust-lang/miri` with no timeline.

---

## 14. Investment Analysis

RISE has no existing investment in zerocopy. The library is not in the RISE Python wheel builder, has no RISE blog coverage, and has no RISE-funded work. All gaps described below are unaddressed.

### 14.1 Functional Enablement

No functional gaps exist. zerocopy's core traits work correctly on riscv64. No investment is required for functional enablement.

### 14.2 Performance Optimization

zerocopy is not an optimization-purpose library in the sense of providing SIMD-accelerated compute kernels. Its operations are zero-cost by construction (compile-time layout verification, no runtime dispatch). The only performance-relevant gap is the absence of SIMD type impls for RVV types, which would allow users to safely transmute RVV vector buffers. This gap is blocked on upstream Rust stabilizing `core::arch::riscv64` SI