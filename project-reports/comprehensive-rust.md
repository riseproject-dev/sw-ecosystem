---
title: comprehensive-rust
---

# comprehensive-rust

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for comprehensive-rust<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[comprehensive-rust](https://google.github.io/comprehensive-rust/) is a multi-day Rust programming language training course developed and maintained by the Android team at Google. It is delivered as an [mdBook](https://rust-lang.github.io/mdBook/) static site hosted at `google.github.io/comprehensive-rust`. The course covers Rust fundamentals, advanced Rust, Android-specific Rust, bare-metal embedded Rust (Cortex-M and AArch64), and concurrency. It is used internally at Google and is available publicly under Apache-2.0 (code) and CC-BY-4.0 (content).

**This is not a compiled runtime, library, or tool.** It produces no binary artifacts. Its "build" produces HTML documentation, and its Rust code snippets are compiled and tested as part of CI verification. There are no versioned releases; the course is deployed continuously from `main`.

**Governance:** No formal governance body, no foundation membership (not Apache, CNCF, RISE, or similar). The repository lives under the `google` GitHub organization. CODEOWNERS designates three individuals as gatekeepers for Cargo manifests and CI workflows: @djmitche (Dustin J. Mitchell), @mgeisler (Martin Geisler), and @qwandor (Andrew Walbran). There is no formal tier policy, steering committee, or RFC process for new architecture modules.

**Corporate maintainers:**
- Martin Geisler (@mgeisler) - 649 commits, top contributor, ProtonMail listed as GitHub affiliation (may be personal email provider; employer not confirmed) [NEEDS VERIFICATION]
- Andrew Walbran (@qwandor) - 227 commits, Google employee (@googlers)
- randomPoison - 121 commits, Immunant, Inc.
- Dustin J. Mitchell (@djmitche) - 102 commits, employer not listed
- henrif75 - 97 commits, Discord

**RISE involvement:** Google LLC is a Premier RISE member. comprehensive-rust itself has no RISE involvement: it is not listed in the RISE wheel builder, has no RISE-funded work, no RISE GitLab repositories, and no coverage in the 10 RISE blog posts published April 2025 through August 2026.

---

## 2. Port History and Upstreaming Timeline

There is no RISC-V port. No milestone table can be constructed because no RISC-V work has occurred.

| Date | Event | Source |
|------|-------|--------|
| (none) | No RISC-V content, CI target, or tracking issue has ever been created | Exhaustive search of issues, PRs, commits, and file tree: zero direct hits |

The repository has never contained RISC-V course content, RISC-V build targets, or RISC-V CI jobs. The three PRs that surfaced in broad RISC-V searches (PRs [#1916](https://github.com/google/comprehensive-rust/pull/1916), [#1913](https://github.com/google/comprehensive-rust/pull/1913), [#3011](https://github.com/google/comprehensive-rust/pull/3011)) are Dependabot dependency bumps whose RISC-V mentions appear exclusively in upstream dependency changelogs bundled into the auto-generated PR descriptions - not in comprehensive-rust code or content.

No contributor has filed an issue or PR requesting RISC-V bare-metal content or a riscv64 CI target. The absence is not a regression; the project never targeted RISC-V.

---

## 3. Upstream Support Tier

No tier policy exists. comprehensive-rust is a training course, not a compiler or runtime with a formal supported-targets matrix. "Porting" the project to RISC-V means authoring a new bare-metal curriculum section targeting `riscv64gc-unknown-none-elf` or similar, analogous to the existing AArch64 and Cortex-M sections.

| Criterion | amd64 | arm64 (AArch64) | riscv64 |
|-----------|-------|-----------------|---------|
| CI build target | Yes (ubuntu-latest runner) | Yes (aarch64-unknown-none bare-metal CI) | No |
| Course content | Yes (Rust fundamentals, async, concurrency) | Yes (bare-metal APS section: full MMU, exceptions, UART, PSCI) | No |
| Bare-metal exercises | No | Yes (alloc, RTC, compass) | No |
| Release assets | N/A (no versioned releases) | N/A | N/A |
| Official status | Implicit default | Explicitly supported in bare-metal section | Not supported, not planned |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

comprehensive-rust contains no JIT, no GC, no SIMD dispatch, and no crypto implementation. Its only architecture-specific content is in the bare-metal section, which consists of hand-written assembly and Rust examples targeting ARM.

**Architecture-specific files:**

| File | Architecture | Type | RISC-V equivalent |
|------|-------------|------|-------------------|
| `src/bare-metal/aps/examples/src/entry.S` | AArch64 only | Hand-written startup assembly (MMU init, stack setup, EL1 configuration) | Missing |
| `src/bare-metal/aps/examples/src/exceptions.S` | AArch64 only | Hand-written exception vector table (AArch64 `stp x0, x1` register pairs) | Missing |
| `src/bare-metal/aps/examples/src/idmap.S` | AArch64 only | Identity-map page table assembly | Missing |
| `src/bare-metal/aps/examples/src/asm.rs` | AArch64 only | `global_asm!` wrapper for the three `.S` files above | Missing |

**Component coverage:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Bare-metal entry / MMU init | Not taught | Full (hand-tuned AArch64 asm) | Missing |
| Exception handling | Not taught | Full (hand-tuned AArch64 asm) | Missing |
| Page table / identity map | Not taught | Full (hand-tuned AArch64 asm) | Missing |
| Microcontroller HAL exercises | Not taught | Full (thumbv7em Cortex-M4F exercises) | Missing |
| Async / concurrency | Yes | Yes | Yes (architecture-independent Rust) |
| Rust fundamentals / memory model | Yes | Yes | Yes (architecture-independent Rust) |

There are zero instances of `#[cfg(target_arch = "riscv64")]`, `#[cfg(target_arch = "riscv32")]`, `cfg(riscv)`, RVV intrinsics, or any RISC-V ISA extension usage in the repository. The single prose mention of RISC-V in the course material is in speaker notes at `src/bare-metal/microcontrollers/hals.md`: "HAL crates exist for many Cortex-M and RISC-V devices" - a parenthetical reference to the external embedded-hal ecosystem, not course content.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build toolchain:**
- Bazel `9.1.1` (from `.bazelversion`)
- `rules_rust` `0.70.0`
- Rust edition 2024
- Nightly toolchain pinned to `2025-09-01` (mdBook binary builds only)
- mdBook `0.5.3`, mdbook-i18n-helpers `0.4.0`, mdbook-svgbob `0.3.1`, mdbook-pandoc `0.11.0`

**Build commands (from README.md):**

```shell
cargo xtask install-tools      # installs mdbook and plugins to ~/.cargo/bin/
cargo xtask serve              # local server at http://localhost:3000
cargo xtask build              # static HTML to book/
cargo xtask rust-tests         # compile/test embedded Rust snippets
bazel test //...               # full Bazel test suite
```

**Cross-compilation targets present (non-riscv64):**

| Workspace path | Target triple | Toolchain required |
|----------------|---------------|--------------------|
| `src/bare-metal/aps/examples/` | `aarch64-unknown-none` | `gcc-aarch64-linux-gnu` (installed in CI) |
| `src/bare-metal/alloc-example/` | `aarch64-unknown-none` | `gcc-aarch64-linux-gnu` |
| `src/exercises/bare-metal/rtc/` | `aarch64-unknown-none` | `gcc-aarch64-linux-gnu` |
| `src/bare-metal/microcontrollers/examples/` | `thumbv7em-none-eabihf` | ARM Cortex-M toolchain |
| `src/exercises/bare-metal/compass/` | `thumbv7em-none-eabihf` | ARM Cortex-M toolchain |

**QEMU usage:** None on riscv64. The bare-metal APS documentation references `qemu-system-aarch64` for local testing of AArch64 examples. No QEMU riscv64 configuration exists anywhere in the repository.

**riscv64-specific build failures:** None reported, because no riscv64 build is attempted.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Rust language fundamentals course content | Full | Full | Full (architecture-independent) |
| Async / concurrency course content | Full | Full | Full (architecture-independent) |
| Bare-metal application processor section | Not included | Full | Missing - no content, no exercises |
| Bare-metal microcontroller section | Not included | Full (Cortex-M4F) | Missing - no content, no exercises |
| Pre-built mdBook binary | Yes (x86_64 release on GitHub) | Yes (aarch64 release on GitHub) | Missing - must `cargo install mdbook` from source |

The bare-metal section of the course (spanning approximately one full day of the multi-day course) is the only area where architecture choice is material. The rest of the course (Rust fundamentals, memory management, generics, traits, error handling, closures, iterators, async, concurrency, Android) is architecture-independent Rust and works identically on riscv64.

**Performance gaps:** Not applicable. The course produces no runtime artifacts with measurable performance characteristics.

**Floating-point / NaN semantics:** Not applicable for the same reason.

---

## 7. CI/CD Infrastructure

**Result: No riscv64 CI exists.**

All 7 workflow files were read in full. Zero lines contain "riscv", "risc-v", or "riscv64" in any workflow file.

| CI job | Runner | riscv64 coverage |
|--------|--------|------------------|
| `cargo` (Rust snippet compilation and tests) | `ubuntu-latest`, `macos-latest` | None |
| `bare-metal` (cross-compile bare-metal examples) | `ubuntu-latest` | None - targets `aarch64-unknown-none` and `thumbv7em-none-eabihf` only |
| `build` (mdBook HTML generation) | `ubuntu-latest` | None |
| `web-tests` (Playwright link/rendering checks) | `ubuntu-latest` | None |
| `lint`, `publish`, `check-msgid-changes`, `check-redirects`, `labeler` | `ubuntu-latest` | None |

No RISE CI runners are used. No QEMU-based riscv64 emulation is configured. The only riscv64 string in the entire repository is a passive entry in `tests/package-lock.json` for the npm bundler's optional platform package `@esbuild/linux-riscv64` version `0.28.1` - a transitive test dependency that is downloaded if the build runs on a riscv64 host, not a CI job.

**Comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner | Yes (ubuntu-latest) | Yes (ubuntu-latest + cross-compile) | No |
| Bare-metal build target | No | Yes (aarch64-unknown-none) | No |
| QEMU testing | No | Referenced in docs only | No |
| RISE-hosted runner | No | No | No |

---

## 8. Distribution and Release Status

comprehensive-rust publishes no binary artifacts of any kind for any architecture. The project is deployed as a static website continuously from `main`. There are zero tagged releases in the GitHub repository.

| Channel | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| GitHub Releases | No (zero releases published) | No | No |
| PyPI | No (HTTP 404) | No | No |
| Ubuntu / Debian | No (not packaged) | No | No |
| Arch Linux | No (not packaged) | No | No |
| Arch Linux RISC-V (archriscv.felixc.at) | No | No | No |

**What a user on riscv64 must do to use the course:**

The course content is consumed as a website at `google.github.io/comprehensive-rust`. No local binary is required for consumption. To build the course locally on riscv64:

1. Install Rust via `rustup`
2. Build mdBook from source: `cargo install mdbook` (no pre-built riscv64 binary exists; see [mdBook issue #3055](https://github.com/rust-lang/mdBook/issues/3055), open as of March 2026)
3. Install mdBook plugins from source: `cargo xtask install-tools`
4. Run `cargo xtask build`

The bare-metal exercises cannot be compiled for riscv64 locally without authoring new course content, because no riscv64 bare-metal workspace or target configuration exists.

---

## 9. Dependencies

comprehensive-rust is a pure Rust workspace with approximately 180 crates in `Cargo.lock`. It contains no CMakeLists.txt, no go.mod, and no Python setup.py. The critical dependencies and their riscv64 status:

| Dependency | Version | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|---------|------|---------------|--------------|-----------------|-----------------|
| mdBook | 0.5.3 (mdbook-driver) | Static site builder - produces course HTML | Pass (builds from source) | No failures reported | No pre-built riscv64 binary | [mdBook #3055](https://github.com/rust-lang/mdBook/issues/3055): riscv64 CI and release assets missing (open, updated Mar 2026) |
| ring | 0.17.14 | Crypto primitives via rustls | Pass (C fallback; no riscv64 asm) | CI includes riscv64gc-unknown-linux-gnu | Via crates.io | All resolved; riscv64 uses generic C path |
| aws-lc-rs | 1.15.2 | Alternative TLS crypto backend | Pass for riscv64gc-unknown-linux-gnu; musl added Nov 2025 | CI matrix includes riscv64gc | Pregenerated bindings on crates.io | All resolved: pregenerated bindings added Apr 2025; musl bindings added Nov 2025 |
| rustls | 0.23.31 | TLS for networking exercises | Pass (inherits from ring + aws-lc-rs) | No riscv64 CI issues | Via crates.io | None open |
| tokio | 1.53.1 | Async runtime | Pass | Prior segfault (tokio [#6355](https://github.com/tokio-rs/tokio/issues/6355), closed Mar 2024) was LLVM optimizer bug - fixed | Via crates.io | None open |
| quinn | 0.11.x | QUIC protocol (async chat example) | Pass | [quinn #1812](https://github.com/quinn-rs/quinn/issues/1812) closed Apr 2024 after ring 0.17 upgrade | Via crates.io | None open |
| cpufeatures | 0.2.17 / 0.3.0 | Runtime CPU feature detection (sha2, chacha20) | Partial - compiles but disables all SIMD acceleration on riscv64 | No correctness failures; C fallback used | Via crates.io | [RustCrypto/utils #1087](https://github.com/RustCrypto/utils/issues/1087): add RISC-V support (open). Performance gap only; no correctness issue. |
| sha2 | latest | SHA-256/SHA-512 | Pass (C fallback via cpufeatures) | No riscv64 failures | Via crates.io | No Zvknh extension support; same as cpufeatures |
| chacha20 | 0.10.1 | ChaCha20 cipher | Pass (scalar fallback) | No riscv64 failures | Via crates.io | No riscv64 SIMD acceleration |
| getrandom | 0.2.16 / 0.3.3 / 0.4.3 | OS RNG | Pass | Uses linux_raw syscall backend on riscv64 | Via crates.io | None open |
| cxx / cxx-build | 1.0.x | C++/Rust FFI bridge (blobstore example) | Pass | No riscv64 issues | Via crates.io | None open |
| simdutf8 | 0.1.5 | SIMD-accelerated UTF-8 validation | Pass (scalar fallback on riscv64) | No RISC-V SIMD (no Zvbb/Zvkb support) | Via crates.io | None open - scalar path used |
| zerocopy | 0.8.55 | Zero-copy byte access (bare-metal example) | Pass | Pure Rust, architecture-independent | Via crates.io | None open |
| buddy_system_allocator | 0.13.0 | Bare-metal heap allocator | Pass | Pure Rust | Via crates.io | None open |

**Dependency summary:** All critical runtime dependencies build and function correctly on riscv64. The two gaps are: (1) mdBook has no pre-built riscv64 binary (open issue, low severity - source build is straightforward); (2) cpufeatures has no RISC-V backend, meaning crypto operations use scalar C paths rather than Zvknh/Zvbb hardware acceleration. Neither gap affects correctness. Neither gap is relevant to the course content itself.

---

## 11. Known Bugs and Active Issues

No RISC-V-specific bugs or issues exist in the google/comprehensive-rust tracker. The following general open bugs were identified; none are RISC-V-related:

| ID | Title | Status | Severity |
|----|-------|--------|----------|
| [#3155](https://github.com/google/comprehensive-rust/issues/3155) | Code snippets without `main` pass tests but fail to compile in the slide | Open | Medium - content correctness |
| [#3122](https://github.com/google/comprehensive-rust/issues/3122) | Unsafe Rust: Integer overflow is not UB | Open | Medium - content accuracy |
| [#3101](https://github.com/google/comprehensive-rust/issues/3101) | Copyright notice in code snippets | Open | Low |
| [#2845](https://github.com/google/comprehensive-rust/issues/2845) | Bare Metal "Raw MMIO" omits details | Open | Low |

No RISC-V correctness or performance bugs exist because RISC-V is not a supported or attempted target.

---

## 12. Objections and Upstream Blockers

**There are no stated objections and no upstream blockers** because no RISC-V contribution has been proposed. The project accepts contributions via pull requests with no stated tier or acceptance policy for new architecture modules.

**Technical prerequisites for a RISC-V bare-metal section:**

1. A target RISC-V board or QEMU machine model analogous to the AArch64 APS platform (`virt` machine is the likely choice for QEMU)
2. Hand-written or Rust-inline assembly for supervisor-mode entry, trap vectors, and identity-mapped page tables (`Sv39` or `Sv48`)
3. A UART driver for the chosen platform (e.g., `ns16550` for QEMU virt)
4. A Rust bare-metal crate for RISC-V (e.g., `riscv`, `riscv-rt`)
5. CI additions: new bare-metal workspace with `target = "riscv64gc-unknown-none-elf"` and QEMU test harness

None of these are blocked by upstream issues. The work is straightforward authoring and CI configuration, not porting of a complex runtime.

---

## 13. Investment Analysis

RISE has not funded any work on comprehensive-rust. No prior investment exists to deduct.

### 13.1 Functional Enablement

The only functional gap is the absence of a RISC-V bare-metal curriculum section. The Rust fundamentals, async, and concurrency content already works on riscv64 (it is architecture-independent Rust). Adding a RISC-V bare-metal section would require:

- Choosing a platform (QEMU `virt` + `riscv64gc-unknown-none-elf` is the obvious choice)
- Writing startup assembly (`entry.S` equivalent: machine/supervisor mode entry, trap vector, stack)
- Writing a minimal UART driver
- Porting or authoring the equivalent of the AArch64 APS examples (alloc, UART, PSCI-equivalent power management for RISC-V would be SBI)
- Writing student exercises (equivalent of the RTC and compass exercises)

The AArch64 bare-metal section spans approximately 15-20 slide groups and 5 exercises. A RISC-V section of equivalent depth is the scope of the work.

### 13.2 Performance Optimization

Not applicable. The course is documentation, not a runtime.

### 13.3 CI/CD Infrastructure

Adding riscv64 to CI requires:
- A new Cargo workspace with `target = "riscv64gc-unknown-none-elf"` in `.cargo/config.toml`
- A new bare-metal CI job in `.github/workflows/build.yml` using `qemu-system-riscv64`
- Installation of `binutils-riscv64-linux-gnu` or equivalent on the ubuntu-latest runner

This is a small CI addition. QEMU riscv64 is available on standard ubuntu-latest GitHub Actions runners.

### 13.4 Ecosystem Enablement

Not applicable. comprehensive-rust has no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Author RISC-V bare-metal section (QEMU virt platform, SBI, UART, trap handling) | 6-10 | Google Android team or external contributor | Medium |
| Functional | Author RISC-V microcontroller section (riscv-rt HAL exercises for a supported dev board) | 4-6 | External contributor familiar with RISC-V embedded | Low |
| CI | Add riscv64gc-unknown-none-elf bare-metal CI job (QEMU virt, ubuntu-latest runner) | 0.5 | Any contributor | Medium (prerequisite for bare-metal section) |
| Distribution | Upstream riscv64 pre-built mdBook release binary (rust-lang/mdBook#3055) | 1-2 | mdBook maintainers; contribution welcome | Low |

**Investment rationale:** comprehensive-rust is the primary Rust training resource used internally at Google and publicly for onboarding engineers to Rust. Adding a RISC-V bare-metal section would provide a canonical, maintained reference for RISC-V bare-metal Rust development - a gap that currently has no equivalent at this quality level. The effort is modest (curriculum authoring, not compiler/runtime work). The return is a training resource that reduces the RISC-V embedded Rust onboarding cost for every engineer who takes the course.

The absence of a RISC-V section does not block RISC-V ecosystem adoption (the course is optional training), but it reflects and reinforces the perception that RISC-V bare-metal Rust lacks first-class support. Investment here is ecosystem signaling as much as technical enablement.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/comprehensive-rust repository](https://github.com/google/comprehensive-rust)
- [comprehensive-rust course website](https://google.github.io/comprehensive-rust/)
- [PR #1916: Dependabot cc bump (RISC-V mention in upstream changelog only)](https://github.com/google/comprehensive-rust/pull/1916)
- [PR #1913: Dependabot cc + chrono bump (RISC-V mention in upstream changelog only)](https://github.com/google/comprehensive-rust/pull/1913)
- [PR #3011: Dependabot serde_json bump (RISC-V mention in upstream changelog only)](https://github.com/google/comprehensive-rust/pull/3011)
- [mdBook issue #3055: add riscv64 CI and release assets](https://github.com/rust-lang/mdBook/issues/3055)
- [RustCrypto/utils issue #1087: add RISC-V support to cpufeatures](https://github.com/RustCrypto/utils/issues/1087)
- [tokio issue #6355: riscv64 segfault (closed Mar 2024)](https://github.com/tokio-rs/tokio/issues/6355)
- [quinn issue #1812: riscv64 build failure via ring 0.16 (closed Apr 2024)](https://github.com/quinn-rs/quinn/issues/1812)
- [RISE project homepage](https://riseproject.dev/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)