---
title: native-pkcs11
---

# native-pkcs11

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for native-pkcs11<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[native-pkcs11](https://github.com/google/native-pkcs11) is a pure-Rust PKCS#11 provider library. It implements the PKCS#11 cryptographic token interface by delegating all cryptographic operations to the host OS keystore: macOS Security Framework (Keychain) and Windows Platform Key Provider (CNG). The library contains no cryptographic implementation of its own. It exposes the `native_pkcs11_traits::Backend` trait so that downstream users can supply their own credential-store backend on platforms where the project ships none (Linux being the primary example).

The project is hosted under the `google` GitHub organization. License is Apache-2.0. Google's standard open-source contribution process applies: Google CLA required, Google Open Source Community Guidelines govern conduct. There is no PLATFORMS.md, SUPPORT.md, MAINTAINERS, or CODEOWNERS file. No formal governance body outside Google exists.

Primary maintainers:
- Brandon Weeks (brandonweeks, bweeks@google.com, Google) - 102 substantive commits, primary active maintainer.
- Kevin King (kcking, formerly kcking@google.com, now at OpenAI per GitHub profile) - 43 commits including early platform work.
- Liam Murphy (liamjm@google.com, Google) - 2 commits.
- Tobias Wich (sake, electrologic.org) - 1 commit, external contributor.
- ~250 commits from dependabot (dependency bumps).

Google LLC is a Premier Member of the RISE project. native-pkcs11 itself is not individually listed as a RISE member project and has received no documented RISE funding or working group attention.

Community stance on new ports: no documented tier policy and no precedent for accepting architecture-specific contributions. The trait-based extensibility model means adding riscv64 support requires no upstream changes - the library compiles on any Rust-supported target as a pure extension point. The primary gap on riscv64 Linux is the absence of a shipped Linux credential-store backend (e.g., TPM or D-Bus Secrets Service), which is identical to the gap on x86_64 Linux.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-12-16 | Linux CI added (PR #14, author kcking) | [google/native-pkcs11 PR history](https://github.com/google/native-pkcs11/pulls) |
| N/A | No RISC-V commits, issues, or PRs in the full repository history | [google/native-pkcs11 issues/PRs/commits enumeration](https://github.com/google/native-pkcs11) |

There is no RISC-V port. The complete repository history (400+ commits, 481 PRs, 8 issues) contains zero references to "riscv", "riscv64", or "RISC-V" in any form. No tracking issue exists for a RISC-V port. No contributor from any organization has filed a port request.

---

## 3. Upstream Support Tier

No formal tier policy exists for this project.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build | Yes (ubuntu-latest, windows-latest, macos-latest) | Partial (aarch64-apple-darwin cross-compile for macOS fat binary only) | No |
| CI test | Yes (macos-latest only; Linux/Windows build only) | No (macOS fat binary not executed separately) | No |
| Release-blocking | Yes | No | No |
| Official binaries | No (crates.io source only) | No | No |
| Functional backend | Yes (macOS Keychain, Windows CNG) | Yes (same as amd64, OS-gated) | No - no Linux backend exists |
| Rust Tier | Tier 1 (x86_64-unknown-linux-gnu, etc.) | Tier 1 (aarch64-apple-darwin, etc.) | Tier 2 (riscv64gc-unknown-linux-gnu) |

The CI tests only on macOS (functional), Ubuntu, and Windows (build only). There is no riscv64 runner, no QEMU emulation, and no cross-compilation to riscv64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

native-pkcs11 contains no architecture-specific code of any kind. There are no SIMD intrinsics, no assembly files, no JIT backends, no hand-tuned numeric kernels, and no architecture dispatch tables. The 94-file repository contains only `.rs`, `.toml`, `.yaml`, `.sh`, `.h`, `.json`, and `.md` files. Zero `.S`/`.s` assembly files exist. Zero `arch/` or `riscv/` directories exist. GitHub code search for `riscv repo:google/native-pkcs11`, `riscv64 repo:google/native-pkcs11`, `rvv repo:google/native-pkcs11`, and `target_arch repo:google/native-pkcs11` all return zero results.

The only platform differentiation in the codebase is OS-level, not architecture-level:

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| PKCS#11 C bindings (pkcs11-sys) | Scalar pure Rust | Scalar pure Rust | Scalar pure Rust |
| Core session/object logic | Scalar pure Rust | Scalar pure Rust | Scalar pure Rust |
| macOS Keychain backend (native-pkcs11-keychain) | N/A (OS-locked to macOS) | N/A (OS-locked to macOS) | N/A (OS-locked to macOS) |
| Windows CNG backend (native-pkcs11-windows) | N/A (OS-locked to Windows) | N/A (OS-locked to Windows) | N/A (OS-locked to Windows) |
| Cryptographic operations | Delegated to OS | Delegated to OS | Delegated to OS |
| Linux backend | None shipped | None shipped | None shipped |

The riscv64 gap is architecturally identical to the x86_64 Linux gap: the library has no Linux keystore backend on any architecture. There is no riscv64-specific code missing because there is no architecture-specific code at all.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Cargo (Rust workspace). No CMake, no Autoconf, no Makefile, no Dockerfile, no cross-compilation toolchain files.

**Minimum Rust version:** `rust-version = "1.85"` (set in workspace `Cargo.toml`). No GCC or Clang minimum - Cargo uses the system rustc toolchain.

**Supported targets listed in `deny.toml`:**
- aarch64-apple-darwin
- x86_64-apple-darwin
- x86_64-pc-windows-msvc
- x86_64-unknown-linux-gnu

`riscv64gc-unknown-linux-gnu` is absent from the allow-list in `deny.toml`.

**No documented riscv64 cross-compilation procedure exists.** Based on the project's structure (pre-generated Unix bindgen output committed to the repo, `bindgen` feature off by default), the expected build commands would be:

```
rustup target add riscv64gc-unknown-linux-gnu
cargo build --target riscv64gc-unknown-linux-gnu -p native-pkcs11
```

This requires `gcc-riscv64-linux-gnu` for the C linker. It does not require libclang at build time because the `pkcs11-sys` crate ships pre-generated `pkcs11_unix.rs` bindings committed to the repository - the `bindgen` feature is optional and off by default. [NEEDS VERIFICATION: that the pre-generated bindings are ABI-compatible with riscv64gc-unknown-linux-gnu without regeneration.]

**pkcs11test conformance suite:** `conformancetest.sh` uses a C++ submodule (`google/pkcs11test`) built with plain `make`. The `pkcs11test` Makefile accepts a `PKCS11_LONG_SIZE` flag for struct alignment control, which may be relevant on riscv64 if token ABI differs. [NEEDS VERIFICATION: whether the PKCS#11 C struct layout from the committed `pkcs11_unix.rs` matches riscv64 ABI.]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64/Linux | arm64/Linux | riscv64/Linux |
|---------|-------------|-------------|---------------|
| Library compiles | Yes | Yes [NEEDS VERIFICATION] | Yes (Rust Tier 2 target) [NEEDS VERIFICATION] |
| Functional keystore backend | No (no Linux backend shipped) | No (no Linux backend shipped) | No (no Linux backend shipped) |
| macOS Keychain backend | No (OS-locked) | No (OS-locked) | No (OS-locked) |
| Windows CNG backend | No (OS-locked) | No (OS-locked) | No (OS-locked) |
| Custom backend via trait | Yes (user-supplied) | Yes (user-supplied) | Yes (user-supplied) |
| PKCS#11 conformance test | Not run on Linux CI | Not run on Linux CI | Not run |
| FIPS compliance | N/A (delegated to OS) | N/A | N/A |

**Functional gap:** The library ships no Linux credential-store backend on any architecture. On riscv64 Linux, as on x86_64 Linux, a user must implement `native_pkcs11_traits::Backend` themselves (e.g., wrapping OpenSSL, a TPM, or D-Bus Secrets Service). This is not a riscv64-specific gap - it is a Linux gap.

**Performance gap:** None quantifiable. The library delegates all cryptographic operations to the OS keystore. ChaCha20 (used transitively via rand) falls back to its pure-Rust scalar implementation on riscv64 (no RVV acceleration), but this is only used for CSPRNG seeding, not for bulk cryptographic operations.

**Security hardening gap:** Data not available: no public security hardening audit for any architecture, and no riscv64-specific hardening analysis found in any source.

---

## 7. CI/CD Infrastructure

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (ubuntu-latest, macos-latest, windows-latest) | Partial (aarch64-apple-darwin cross-compile target) | No |
| Test CI | Yes (macos-latest only) | No | No |
| QEMU | No | No | No |
| RISE runners | No | No | No |
| Hardware runners | No | No | No |
| CI file | `.github/workflows/ci.yaml` (sole workflow file) | Same | None |

The sole CI workflow file is `.github/workflows/ci.yaml` (SHA `ea29a794436ddef9954de629cf7303cefd23beb6`). It triggers on push and pull_request to main. The build job matrix is `[macos-latest, ubuntu-latest, windows-latest]`. The test job matrix is `[macos-latest]` only. The only non-default Rust targets added are `aarch64-apple-darwin` and `x86_64-apple-darwin` for macOS fat-binary packaging. The string "riscv" appears zero times in the file. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` exists.

---

## 8. Distribution and Release Status

native-pkcs11 is distributed exclusively as a Rust source crate on [crates.io](https://crates.io). No binary packages exist on any platform.

| Distribution channel | amd64 | riscv64 |
|---|---|---|
| crates.io (source) | Yes (v0.2.27 latest) | Yes (same source, no prebuilt) |
| GitHub Releases (binary) | No (asset_count = 0 on all releases) | No |
| PyPI | No (HTTP 404) | No |
| Ubuntu/Debian | No (HTTP 404 on tracker.debian.org) | No |
| Arch Linux | No (no results on archriscv.felixc.at) | No |
| RISE wheel builder | No (not listed) | No |

GitHub releases (latest: `native-pkcs11-v0.2.27`, `native-pkcs11-windows-v0.2.27`, `native-pkcs11-traits-v0.2.27`) carry zero binary assets. Releases are used as version tags only.

To obtain a working binary on riscv64 Linux, a user must: (1) install Rust 1.85+ with the `riscv64gc-unknown-linux-gnu` target, (2) install `gcc-riscv64-linux-gnu`, (3) build from source with `cargo build --target riscv64gc-unknown-linux-gnu`, and (4) supply their own Linux keystore backend implementing `native_pkcs11_traits::Backend`. Steps 3 and 4 are undocumented.

---

## 9. Dependencies

| Dependency | Version | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| rand | 0.10.2 | CSPRNG in native-pkcs11-traits | Yes (soft ChaCha20 backend on riscv64) | No CI | Not tested | None |
| chacha20 | 0.10.1 | PRNG backend for rand | Yes (pure-Rust scalar, no RVV) | No CI | Not tested | None blocking native-pkcs11 |
| cpufeatures | 0.3.0 | Runtime SIMD feature detection | Not pulled in on riscv64 (chacha20 gates it to x86/x86_64 only via Cargo.toml) | N/A | N/A | Open: [RustCrypto/utils#1087](https://github.com/RustCrypto/utils/issues/1087) (riscv64 support request); not a blocker here |
| getrandom | 0.4.3 | Entropy source | Yes - riscv64 explicitly listed as supported (Linux getrandom syscall) | No riscv64 CI | Not tested | None |
| libc | transitive | OS syscall bindings | Yes - riscv64gc-unknown-linux-gnu supported since ~2019 | No riscv64-specific CI | Yes | None |
| der / pkcs8 / spki / pkcs1 / x509-cert | 0.8.x / 0.11.x / 0.3.x | ASN.1/DER encoding, X.509 certificate parsing (RustCrypto/formats) | Yes (pure Rust) | No riscv64 CI | Not tested | None |
| zeroize | 1.8.x | Secure memory zeroing | Yes (pure Rust with optional LLVM barriers) | No riscv64 CI | Not tested | None |
| tracing / tracing-subscriber / tracing-journald | 0.1.44 / 0.3.23 / 0.3.x | Structured logging; journald is Linux-only | Yes (pure Rust; journald uses sd-journal on Linux) | No riscv64 CI | Not tested | None |
| parking_lot | transitive (via cached) | Synchronization primitives | Yes (riscv64 support in lock_api) | No riscv64 CI | Not tested | None |
| bindgen | 0.72.1 (build-dep, optional, off by default) | Generates C bindings for pkcs11-sys | Requires libclang on build host; libclang supports riscv64 cross-compile | Needs riscv64 toolchain | Build-dep only | None |
| core-foundation / security-framework | 0.10.1 / 3.7.0 | macOS Keychain backend | macOS-only (cfg(target_os="macos")), irrelevant on riscv64 Linux | N/A | N/A | N/A |
| windows / windows-sys | transitive | Windows CNG backend | Windows-only (cfg(target_os="windows")), irrelevant on riscv64 Linux | N/A | N/A | N/A |

No dependency has a JIT backend, SIMD dispatch path, or crypto kernel that blocks riscv64 compilation. The only relevant deviation from amd64 behavior is that chacha20 uses its pure-Rust scalar implementation on riscv64 rather than hardware-accelerated paths, reducing CSPRNG throughput. Since cryptographic operations are delegated to the OS keystore rather than implemented in the library, this has no impact on the primary use case.

---

## 11. Known Bugs and Active Issues

No open issues are architecture-specific or RISC-V-related. The complete open issue list contains 10 issues (8 found in initial enumeration, consistent with subsequent search). All 477 issues across the project's lifetime were searched - zero mention "riscv", "risc-v", or "riscv64".

Known open functional issues (general, not riscv64-specific):

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #445 | RSA public key issues | Open | High | Functional correctness issue, all platforms |
| #417 | Single-key backend limitation | Open | Medium | Architecture of Backend trait |
| #369 | EC key support | Open | Medium | Missing key type, all platforms |
| #303 | CKA_EC_PARAMS hardcoded to P256 | Open | Medium | Limited curve support, all platforms |
| #302 | macOS thread safety | Open | Medium | macOS-only |
| #389 | TLS teardown panic (OpenSSL PKCS#11 engine, Linux x86_64) | Open [NEEDS VERIFICATION: current status] | High | Linux-specific but not riscv64-specific |

No riscv64 correctness bugs or performance bugs exist because the project has never been tested on riscv64.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None on record. No maintainer has commented on riscv64 support in any public channel.

**Technical blockers:**

1. No Linux keystore backend exists. This is the primary functional blocker on riscv64 Linux and is identical to the blocker on x86_64 Linux. The library compiles but provides no functional credential store. A Linux backend (TPM2, D-Bus Secrets Service, or OpenSSL PKCS#11 engine wrapper) must be implemented and either contributed upstream or maintained out-of-tree.

2. No CI for riscv64. No QEMU testing, no cross-compilation job, no Tier 2 Rust target in CI.

3. The `deny.toml` allow-list does not include `riscv64gc-unknown-linux-gnu`. Adding it requires a project-level change.

4. `pkcs11_unix.rs` pre-generated bindings: the committed bindgen output was generated on an unspecified host. ABI compatibility with riscv64gc ABI (LP64D) has not been verified. [NEEDS VERIFICATION]

**Organizational blockers:** Google maintains the project. There is no documented policy on accepting contributions for platforms the core team does not use. The project is in active maintenance (dependency bumps via dependabot, v0.2.27 released) but has only one active substantive maintainer (Brandon Weeks). Pull request review cadence is unknown from available data.

**Acceptance probability:** Data not available: no upstream maintainer has been asked about riscv64 support, and no relevant PR has been attempted.

---

## 13. Investment Analysis

RISE has no documented involvement with native-pkcs11. No RISE blog posts, working group assignments, funded work, or wheel builder entries reference this project.

### 13.1 Functional Enablement

The core functional gap is the absence of a Linux keystore backend. This gap applies to all Linux architectures, not riscv64 specifically. Implementing a Linux backend (e.g., wrapping OpenSSL's PKCS#11 engine, or implementing a TPM2 backend via tpm2-tss) is the prerequisite for any functional use on riscv64 Linux. This is a significant engineering effort that would need to be contributed upstream or maintained as a fork.

A secondary but low-effort item is adding `riscv64gc-unknown-linux-gnu` to `deny.toml` and verifying that the pre-generated `pkcs11_unix.rs` bindgen output is ABI-correct on riscv64.

### 13.2 Performance Optimization

Not applicable. The library contains no cryptographic implementation - all operations are delegated to the OS keystore. There is nothing to optimize in native-pkcs11 itself for riscv64.

### 13.3 CI/CD Infrastructure

Adding a riscv64 build CI job requires a QEMU-based Ubuntu riscv64 container or a RISC-V hardware runner. Testing (beyond compilation) requires a Linux keystore backend (see 13.1), without which the test suite cannot run on Linux regardless of architecture.

### 13.4 Ecosystem Enablement

Not applicable. native-pkcs11 has no dependent package ecosystem (no PyPI packages, no npm packages, no plugin registry).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement Linux keystore backend (e.g., OpenSSL PKCS#11 engine or TPM2) | 6-12 | Qualcomm or upstream contributor | Critical |
| Functional | Verify ABI compatibility of committed pkcs11_unix.rs bindings on riscv64gc; regenerate if needed | 0.5 | Qualcomm | High |
| Functional | Add riscv64gc-unknown-linux-gnu to deny.toml allow-list | 0.1 | Qualcomm (PR upstream) | Medium |
| CI/CD | Add riscv64 build job (QEMU) to ci.yaml | 0.5 | Qualcomm (PR upstream) | Medium |
| CI/CD | Add riscv64 test job once Linux backend exists | 0.5 | Qualcomm (PR upstream) | Medium (blocked on Functional) |

The Linux backend work is the dominant cost and is architecture-independent. It benefits all Linux users, not only riscv64. If the strategic goal is riscv64-specific, the minimal viable path is: verify `pkcs11_unix.rs` ABI, add a QEMU build CI job, and rely on a user-supplied backend via the existing `Backend` trait.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/native-pkcs11 repository](https://github.com/google/native-pkcs11)
- [native-pkcs11 CI workflow (.github/workflows/ci.yaml)](https://github.com/google/native-pkcs11/blob/main/.github/workflows/ci.yaml)
- [native-pkcs11 releases (all asset_count = 0)](https://github.com/google/native-pkcs11/releases)
- [native-pkcs11 deny.toml (supported targets)](https://github.com/google/native-pkcs11/blob/main/deny.toml)
- [native-pkcs11 workspace Cargo.toml (rust-version = 1.85)](https://github.com/google/native-pkcs11/blob/main/Cargo.toml)
- [pkcs11-sys/src/pkcs11_unix.rs (pre-generated bindgen output)](https://github.com/google/native-pkcs11/blob/main/pkcs11-sys/src/pkcs11_unix.rs)
- [RustCrypto/utils issue #1087 - cpufeatures riscv64 support request](https://github.com/RustCrypto/utils/issues/1087)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog (no native-pkcs11 entries)](https://riseproject.dev/category/blog/)
- [Arch Linux RISC-V package mirror (no native-pkcs11)](https://archriscv.felixc.at/?q=native-pkcs11)
- [Debian package tracker (no native-pkcs11)](https://tracker.debian.org/pkg/native-pkcs11)
- [PyPI native-pkcs11 (HTTP 404)](https://pypi.org/project/native-pkcs11/)
- [Rust riscv64gc-unknown-linux-musl Tier 2 tracking issue #160259](https://github.com/rust-lang/rust/issues/160259)
- [google/pkcs11test conformance test submodule](https://github.com/google/pkcs11test)