---
title: Eclipse Zenoh
parent: Project Reports
color: orange
dependencies:
  - name: ring
    relation: build-dependency
    criticality: critical
  - name: rustls
    relation: build-dependency
    criticality: critical
  - name: quinn
    relation: build-dependency
    criticality: critical
  - name: io-uring
    relation: build-dependency
    criticality: optional
  - name: flate2
    relation: build-dependency
    criticality: optional
  - name: lz4_flex
    relation: build-dependency
    criticality: optional
  - name: rsa
    relation: build-dependency
    criticality: optional
  - name: sha3
    relation: build-dependency
    criticality: optional
  - name: aes
    relation: build-dependency
    criticality: optional
  - name: x509-parser
    relation: build-dependency
    criticality: optional
  - name: buddy_system_allocator
    relation: build-dependency
    criticality: optional
  - name: talc
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="eclipse-zenoh" %}

# Eclipse Zenoh

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Eclipse Zenoh<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Eclipse Zenoh is a pub/sub, query, and edge-computing protocol/middleware for unifying data-in-motion, data-at-rest, and computation, aimed at IoT and robotics use cases. The core implementation (`eclipse-zenoh/zenoh`) is a pure-Rust Cargo workspace; a separate pure-C implementation, `zenoh-pico`, targets embedded/microcontroller environments and uses a CMake build system.

**Governance.** Zenoh is hosted by the Eclipse Foundation as an incubating project (project ID `iot.zenoh`), under the IoT and "Eclipse Software Defined Vehicle" working groups, and is dual-licensed under the Eclipse Public License 2.0 or the Apache License 2.0. Governance follows the standard Eclipse Development Process, requiring a signed Eclipse Contributor Agreement (ECA) and `Signed-off-by` trailers for non-committer commits.

**Corporate sponsor.** The primary corporate steward is ZettaScale Technology, a spin-out of the original team at ADLINK Technology (commit history shows 1,380 historical commits from `@adlinktech.com` addresses versus 330 from `@zettascale.tech`, reflecting that migration). Current Eclipse-registered project leads are Angelo Corsaro and Yong He. Committer-list and `CONTRIBUTORS.md` analysis confirms the founding/majority-commit cohort (Angelo Corsaro, Julien Enoch, Olivier Hecart, Gabriele Baldoni, Luca Cominardi, Ivan Paez) are ZettaScale employees; Luca Cominardi alone accounts for 1,229 all-time commits. No chip vendor or RISE-affiliated organization appears among maintainer affiliations.

**RISE membership.** Neither Eclipse Zenoh nor ZettaScale appear in the [RISE members list](https://riseproject.dev/members/) (Premier or General). Zenoh is not a RISE member project, and no RISE blog post, wheel-builder listing, or GitHub-org content references Zenoh in any way.

**Community culture on new ports.** No formal platform-tier policy document exists. GitHub issue/PR search for "riscv" across the org returns effectively zero substantive results (one incidental hit, detailed in Section 2). There is no open feature request, discussion thread, or community pressure for a RISC-V port. Because Zenoh is written in largely portable Rust/C with minimal platform-specific code, the project's stance reads as passive/receptive rather than actively invested: nothing indicates hostility to RISC-V, but there is also no roadmap item, dedicated hardware, CI runner, or release artifact for it.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-07-23 | [PR #2700](https://github.com/eclipse-zenoh/zenoh/pull/2700) merged: restricts the optional `zenoh-uring` crate to build only on platforms `tokio-rs/io-uring` supports (x86_64, aarch64, riscv64, loongarch64, powerpc64); riscv64 appears only as one of five architectures already supported upstream by the `io-uring` crate. | [PR #2700](https://github.com/eclipse-zenoh/zenoh/pull/2700) |
| 2026-08-14 | [Zenoh 1.10.0 released](https://github.com/eclipse-zenoh/zenoh/releases), first release containing the merge commit `8358cd5` (PR #2700). No riscv64 release assets included. | [Zenoh releases](https://github.com/eclipse-zenoh/zenoh/releases) |

**Key contributor.** The single riscv64-touching commit (`8358cd5`) was authored by Julien Enoch (`julien.enoch@zettascale.tech`, ZettaScale Technology), reviewed by yellowhatter and diogomatsubara.

**Is it fully upstream?** There is no dedicated RISC-V port to speak of. PR #2700 is not RISC-V-specific work: it was written to fix [issue #2692](https://github.com/eclipse-zenoh/zenoh/issues/2692), a 32-bit ARM cross-compilation failure (`arm-unknown-linux-gnueabi(hf)`, `armv7-unknown-linux-gnueabihf`), by gating the optional `uring` feature to the architecture allowlist the upstream `tokio-rs/io-uring` crate supports. riscv64 was included incidentally because it was already on that upstream list. No commit, issue, or PR in `eclipse-zenoh/zenoh` or `eclipse-zenoh/zenoh-pico` represents a deliberate riscv64 enablement effort, and no master tracking issue for a riscv64 port exists.

## 3. Upstream Support Tier

No formal platform-tier policy document exists in the repository. De facto support tiers are implicit in the CI and release matrices: x86_64/aarch64/arm across Linux/macOS/Windows are effectively Tier-1-equivalent (built, tested, and released), while riscv64 has none of these.

| | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-latest`, `windows-latest`, `macos-latest` runners) | Yes (cross-compiled in release matrix) | No |
| CI tests | Yes | Not verified as tested (release matrix builds only; main `ci.yml` runs on x86 runners) | No |
| Official release artifact | Yes (standalone + deb, gnu/musl) | Yes (standalone + deb, gnu/musl) | No |
| Docker/OCI image | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |

Source: [`eclipse-zenoh/zenoh/.github/workflows/ci.yml`, `release.yml`](https://github.com/eclipse-zenoh/zenoh/tree/main/.github/workflows), [`eclipse-zenoh/ci` build-crates-standalone.yml](https://github.com/eclipse-zenoh/ci).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Zenoh has no architecture-specific subsystems in the conventional sense (no JIT, no hand-tuned SIMD, no GC barriers, no hand-written assembly) for **any** architecture, not just riscv64. A full-text grep of `eclipse-zenoh/zenoh` for `is_x86_feature_detected|std::arch::|core::arch::|target_feature|asm!(` returns zero matches anywhere in the codebase. `zenoh-pico` (C) likewise has zero `__x86_64__|__aarch64__|__arm__|__riscv|asm!` matches; its portability boundary is OS/RTOS (POSIX/FreeRTOS/Zephyr/Mbed), not CPU architecture.

The only architecture-conditional code in the entire project is a single, non-default, optional feature gate:

```rust
#[cfg(all(
    target_os = "linux",
    any(
        target_arch = "x86_64",
        target_arch = "aarch64",
        target_arch = "riscv64",
        target_arch = "loongarch64",
        target_arch = "powerpc64"
    )
))]
```

This gate appears in 6 files (`commons/zenoh-uring/{Cargo.toml,src/lib.rs}`, `io/zenoh-transport/src/{lib.rs,manager.rs,common/batch.rs,unicast/universal/link.rs}`) and enables the optional `zenoh-uring` Linux io_uring I/O-batching backend, a 2,051-line module using the `io-uring`/`libc`/`nix` crates with no further arch-conditional branches, no assembly, and no SIMD intrinsics inside it. The whitelist is copied verbatim from `tokio-rs/io-uring`'s own supported-platform list (per a comment in `Cargo.toml`), not authored for riscv64 specifically.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core transport/serialization (zenoh-protocol, zenoh-transport) | Generic Rust, no arch-specific code | Generic Rust, no arch-specific code | Generic Rust, no arch-specific code (identical path) |
| Optional `zenoh-uring` io_uring backend | Enabled (whitelist) | Enabled (whitelist) | Enabled (whitelist) - same generic code path as amd64/arm64 |
| Crypto (AES, SHA-3, RSA via RustCrypto/`ring`) | Portable Rust, HW-accelerated path (AES-NI) available via `ring`/`aes` crate | Portable Rust, HW-accelerated path (ARM crypto extensions) available | Portable Rust, software fallback only - no Zvkned vector-crypto backend |

Because there is no per-architecture hand-tuned code anywhere in this codebase, riscv64 is not "stubbed" or "degraded" relative to amd64/arm64 for core functionality - it runs the identical generic code path. The one measurable difference is the crypto dependency `aes` (RustCrypto), which has optional hardware-accelerated paths on x86 (AES-NI) and aarch64 (ARM crypto extensions) but falls back to portable software on riscv64 with no Zvkned vector-crypto backend yet - a performance gap, not a functional one.

## 5. Build System, Cross-Compilation, and Toolchain

`eclipse-zenoh/zenoh` is a Cargo/Rust project with no `CMakeLists.txt`, `Dockerfile`, `BUILDING.md`, or cross-compilation documentation for RISC-V. Build instructions in `README.md` are simply `cargo build --release --all-targets` (requires Rust >= 1.75.0; `rust-toolchain.toml` pins 1.97.1).

`Cross.toml` (the cross-compilation tool config) defines images only for: `x86_64-unknown-linux-musl`, `arm-unknown-linux-gnueabi(hf)`, `armv7-unknown-linux-gnueabihf`, `aarch64-unknown-linux-gnu/musl`. No riscv64 entry exists.

`eclipse-zenoh/zenoh-pico` is the actual CMake-based project. Its `cmake/platforms/` directory contains 15 per-platform files (`opencr.cmake`, `espidf.cmake`, `arduino_esp32.cmake`, `windows.cmake`, `flipper.cmake`, `threadx_stm32.cmake`, `emscripten.cmake`, `rpi_pico.cmake`, `zephyr.cmake`, `macos.cmake`, `bsd.cmake`, `mbed.cmake`, `posix_compatible.cmake`, `freertos_lwip.cmake`, `linux.cmake`, `freertos_plus_tcp.cmake`) - no `riscv64.cmake` exists. Its `GNUmakefile` cross-build targets (`CROSSBUILD_TARGETS`) are `linux-armv5 linux-armv6 linux-armv7 linux-armv7a linux-arm64 linux-mips linux-x86 linux-x64` - no riscv64.

The only "riscv" string in `zenoh-pico` is in `examples/rpi_pico/FreeRTOS_Kernel_import.cmake`, selecting the Raspberry Pi Pico 2's RISC-V core variant (`rp2350-riscv`) for an embedded microcontroller example - a 32-bit embedded target unrelated to riscv64 Linux userspace.

No QEMU usage exists anywhere in either repository's CI. No exact `cmake`/`configure` command, toolchain file, minimum GCC/Clang version, or `-DUSE_X=OFF` flag exists for riscv64 because riscv64 build support has never been implemented for either the Cargo or CMake build system.

Source: [`eclipse-zenoh/zenoh/Cross.toml`](https://github.com/eclipse-zenoh/zenoh/blob/main/Cross.toml), [`eclipse-zenoh/zenoh-pico/cmake/platforms`](https://github.com/eclipse-zenoh/zenoh-pico/tree/main/cmake/platforms), [`eclipse-zenoh/zenoh-pico/GNUmakefile`](https://github.com/eclipse-zenoh/zenoh-pico/blob/main/GNUmakefile).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core pub/sub/query protocol | Available | Available | Data not available: no upstream build/test exists to confirm functional parity, though no arch-specific code suggests it would work if built |
| TCP/UDP transport | Available | Available | Same generic code path; untested by upstream |
| TLS transport (`zenoh-link-tls`, via `rustls`+`ring`) | Available | Available | `ring` crate builds on riscv64gc; `rustls` has no upstream code blocker, but the Ubuntu 26.04 binary package `librust-rustls-dev` is not built for riscv64 (packaging gap, see Section 9) |
| QUIC transport (`quinn`) | Available | Available | `quinn`/`quinn-proto` build on riscv64 per Ubuntu packaging; no known code blocker |
| Optional `zenoh-uring` io_uring backend | Available | Available | Compiles via the same 5-arch whitelist as amd64/arm64 (untested by CI) |
| Official prebuilt binary/package | Yes (deb, standalone, Docker) | Yes (deb, standalone, Docker) | None |
| PyPI wheel (`eclipse-zenoh`) | Yes | Yes (aarch64) | None |

**Functional gaps.** None identified in the code itself; the gap is entirely in build/test/release infrastructure, not in missing feature implementation.

**Performance gaps.** The `aes` crate lacks a riscv64 vector-crypto (Zvkned) accelerated path and falls back to portable software, versus AES-NI on amd64 and ARM crypto extensions on arm64. Data not available: no benchmark comparing this delta was found (see Section 11).

**Security hardening gaps.** Data not available: no riscv64-specific hardening/mitigation analysis (e.g., stack protector, CFI) was found in any source searched.

**NaN / floating-point semantics issues.** No open or closed GitHub issue in `eclipse-zenoh/zenoh`, `zenoh-pico`, `zenoh-c`, `zenoh-plugin-dds`, `zenoh-plugin-ros2dds`, or `ros2/rmw_zenoh` reports a NaN/floating-point-comparison class of bug on RISC-V, or any RISC-V bug at all, per exhaustive issue search.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed directly by cloning both repositories and grepping every workflow file's raw content (not just search-index results):

- `eclipse-zenoh/zenoh/.github/workflows/` (8 files: `ci.yml`, `eclipse-ipddp.yml`, `fuzz-scheduled.yml`, `pr-label-checklists-generate.yml`, `pr-label-checklists-verify.yml`, `pre-release.yml`, `release.yml`, `trigger-sync-lockfiles.yml`) - zero "riscv" matches.
- `eclipse-zenoh/zenoh-pico/.github/workflows/` (18 files, including `ci.yml`, `build-shared.yaml`, `build-static.yaml`, `integration.yaml`, `espidf.yaml`, `zephyr.yaml`, `rpi_pico.yaml`) - zero "riscv" matches.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in either repository.
- The `determine-runner` job in `ci.yml` falls back to `['ubuntu-latest', 'windows-latest', 'macos-latest']` because `ci/runners.json` does not exist in the repo.
- `Cross.toml` cross-compilation targets: `x86_64-unknown-linux-musl`, `arm-unknown-linux-gnueabi(hf)`, `armv7-unknown-linux-gnueabihf`, `aarch64-unknown-linux-gnu/musl`. No riscv64.

The only "riscv" string found anywhere in CI/release tooling (across both repos and the shared `eclipse-zenoh/ci` workflows) is a `process.arch -> Debian arch name` lookup table entry (`riscv64: "riscv64"`) in `eclipse-zenoh/ci/src/publish-crates-debian.ts`, used only to filter already-built `.deb` packages for an installability smoke-test on the CI host's own architecture - it never triggers building anything for riscv64, since no job definition specifies a riscv64 runner.

No use of RISE RISC-V runners (`riseproject-dev` or RISE runner labels) appears anywhere in any workflow file.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI: builds | Yes | Yes (cross-compiled in release matrix) | No |
| CI: runs tests | Yes | Not confirmed as test-executing (release matrix is build-only; native test runners are x86) | No |
| CI: release-blocking | Yes (main `ci.yml`) | Not confirmed | No |
| Hardware | Native cloud runner | Cross-compiled on x86 host | N/A |
| RISE runners used | No | No | No |

Source: [`eclipse-zenoh/zenoh/.github/workflows/ci.yml`](https://github.com/eclipse-zenoh/zenoh/blob/main/.github/workflows/ci.yml), [`eclipse-zenoh/zenoh-pico/.github/workflows`](https://github.com/eclipse-zenoh/zenoh-pico/tree/main/.github/workflows), [`eclipse-zenoh/zenoh/Cross.toml`](https://github.com/eclipse-zenoh/zenoh/blob/main/Cross.toml).

## 8. Distribution and Release Status

**No riscv64 binary exists in any channel checked.**

| Source | riscv64 present? | Notes |
|---|---|---|
| GitHub releases (last 5: 1.10.1, 1.10.0, 1.9.0, 1.8.0, 1.7.2) | No | Each ships ~17 assets covering aarch64/arm/armv7/x86_64 (macOS, Linux gnu/musl, deb, source archives). Zero riscv asset filenames in any of the 5 releases. |
| PyPI (`eclipse-zenoh`) | No | Wheels cover `x86_64`, `i686`, `aarch64`, `armv7l`, `armv6l`, `macosx` (universal2/x86_64), `win_amd64` only. Source: [PyPI JSON API](https://pypi.org/pypi/eclipse-zenoh/json). |
| RISE wheel builder (GitLab project 56254198) | No | `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/eclipse-zenoh/` redirects (302) to the plain PyPI simple index; no RISE override entry, same architecture list as PyPI. |
| Ubuntu 26.04 "resolute" (`packages.ubuntu.com`) | No package at all | Search for both "Eclipse Zenoh" and "zenoh" returns "Sorry, your search gave no results." Zenoh is not packaged for Ubuntu 26.04 under any name, for any architecture. |
| Project graph DB (SPARQL, Ubuntu 26.04 riscv64) | No | Query for `"eclipse zenoh"`/`"python3-eclipse-zenoh"`/`"libeclipse-zenoh"` returns 0 bindings; a broadened `CONTAINS(..., "zenoh")` query across any suite/architecture also returns 0 bindings - Zenoh has no binary package record in the indexed Ubuntu archive at all. |
| Docker Hub / OCI | No | Release Docker job (`release-crates-dockerhub.yml`) publishes only `linux/amd64` and `linux/arm64`. |
| Arch Linux RISC-V (archriscv.felixc.at) | Inconclusive | Site's search appears client-side/JS-driven; WebFetch could not positively confirm presence or absence. Not cited as evidence either way. |

**What a user must do to get a working binary on riscv64.** Build from source with `cargo build --release` on a riscv64 host or via a self-configured `cross`/QEMU toolchain not provided by upstream (`Cross.toml` has no riscv64 target, so this would require manually adding one). No prebuilt binary, wheel, or distro package is available through any official or third-party channel found.

Source: [Zenoh GitHub releases](https://github.com/eclipse-zenoh/zenoh/releases), [PyPI eclipse-zenoh](https://pypi.org/project/eclipse-zenoh/), [Ubuntu packages search](https://packages.ubuntu.com/search?keywords=zenoh&suite=resolute&searchon=names&section=all).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| `ring` 0.17.14 | Crypto primitives (AEAD/ECDH/ECDSA) backing rustls | Yes - Ubuntu 26.04 riscv64 (resolute) ships `librust-ring-dev`; native `riscv64gc-unknown-linux-gnu` supported since ~0.17.9 via portable C fallback (no hand-tuned RV64 asm) | Presumed covered by Ubuntu buildd/autopkgtest; no public upstream riscv64 CI lane found [NEEDS VERIFICATION] | Actively maintained | [briansmith/ring#2745](https://github.com/briansmith/ring/issues/2745) - fails to build for the newer Tier-3 `riscv64a23-unknown-linux-gnu` target (closed *not_planned*, Jan 2026); standard `riscv64gc` (what Ubuntu/Zenoh use) unaffected |
| `rustls` 0.23.43 | TLS 1.2/1.3 stack for `zenoh-link-tls`/QUIC | Pure Rust, no known code blocker | N/A (not built by Ubuntu archive) | crates.io only | Ubuntu 26.04 `librust-rustls-dev` built for `amd64`/`arm64` only - a packaging gap, not a code defect |
| `quinn`/`quinn-proto` 0.11.5 | QUIC implementation for `zenoh-link-quic` | Yes - Ubuntu 26.04 riscv64 ships `librust-quinn-dev`, `librust-quinn-proto-dev` | Presumed covered by archive autopkgtest [NEEDS VERIFICATION] | Available | [quinn-rs/quinn#1812](https://github.com/quinn-rs/quinn/issues/1812) was a transitive `ring` 0.16.7 failure, resolved once `ring` 0.17.8 added riscv64 support; Zenoh already pins `ring` 0.17.14 |
| `io-uring` 0.7.10 (crate) | Linux io_uring backend for the optional `zenoh-uring` feature | Yes - Ubuntu 26.04 ships `librust-io-uring-dev`; C `liburing`/`liburing-dev` also present | Packaged | Available | [tokio-rs/io-uring#307](https://github.com/tokio-rs/io-uring/issues/307) - earlier versions shipped prebuilt FFI bindings not covering riscv64, fixed and closed *completed* 2025-04-29; Zenoh's pinned 0.7.10 postdates the fix |
| `flate2` 1.1.5 | DEFLATE/gzip compression | Packaged (`librust-flate2-dev`) | Packaged | Available | None found for riscv64 |
| `lz4_flex` 0.10.0 | LZ4 compression (pure-Rust reimplementation) | Packaged (`librust-lz4-flex-dev`) | Packaged | Available | None found |
| `rsa` 0.9.10 (RustCrypto) | RSA crypto (cert/key tooling via `rcgen`) | Packaged (`librust-rsa-dev`) | Packaged | Available | None found |
| `sha3` 0.10.9 (RustCrypto) | SHA-3/Keccak hashing (`zenoh-crypto`) | Packaged (`librust-sha3-dev`) | Packaged | Available | None found |
| `aes` 0.8.4 (RustCrypto) | AES block cipher (`zenoh-crypto`) | Packaged (`librust-aes-dev`); portable software fallback on riscv64, no Zvkned vector-crypto backend | Packaged | Available | None open; performance gap only |
| `x509-parser` 0.18.0 | X.509 cert parsing | Pure Rust, no known code blocker | N/A (not built by Ubuntu archive) | crates.io only | Ubuntu `librust-x509-parser-dev` built for `amd64`/`arm64` only - packaging gap |
| `buddy_system_allocator` 0.10.0 | `no_std` heap allocator (`zenoh-shm`) | Not packaged for Ubuntu at all (any arch); crates.io only | N/A | crates.io only | Originates from the rCore-OS teaching-OS project, whose primary target is riscv64 - effectively first-class upstream |
| `talc` 4.4.3 | `no_std` global allocator | Not packaged for Ubuntu (any arch); crates.io only | N/A | crates.io only | None found |

**Summary.** No dependency has an open, currently-blocking riscv64 build/runtime defect at the versions Zenoh pins (`ring` 0.17.14, `io-uring` 0.7.10). The two historically real riscv64 breakages in this dependency graph - `ring` (dropped support in 0.16, restored in 0.17.x) and `io-uring` (missing prebuilt FFI bindings, fixed 2025) - are both resolved. The main residual risk is Ubuntu 26.04 packaging completeness rather than upstream code: `librust-rustls-dev` and `librust-x509-parser-dev` are built for `amd64`/`arm64` but not riscv64 in resolute, even though their own build-dependencies (e.g. `ring`) are already riscv64-ready there - an archive/build-queue gap, not a technical blocker, but it means `apt install librust-rustls-dev` will not currently work on riscv64 Ubuntu 26.04 (building via `cargo` from crates.io is unaffected).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2692](https://github.com/eclipse-zenoh/zenoh/issues/2692) | Cross-compilation fails for 32-bit ARM targets when the uring feature is enabled | Closed (fixed by PR #2700) | N/A to RISC-V | About 32-bit ARM (`arm-unknown-linux-gnueabi(hf)`, `armv7-unknown-linux-gnueabihf`); riscv64 is not affected and not mentioned in the issue body itself |
| [#453](https://github.com/eclipse-zenoh/zenoh/issues/453) | [Bug] Compilation issue without 'unstable' feature | Closed | N/A to RISC-V | Architecture-agnostic |

**No open or closed correctness or performance bug in `eclipse-zenoh/zenoh`, `zenoh-pico`, `zenoh-c`, `zenoh-plugin-dds`, `zenoh-plugin-ros2dds`, or `ros2/rmw_zenoh` mentions RISC-V**, per exhaustive `search_issues`/`search_pull_requests`/`search_commits` queries (riscv, riscv64, RISC-V, org-wide and per-repo) that all returned zero relevant hits. This is best read as an untested/uncharacterized combination rather than a "clean bill of health": no benchmark or stress-test on riscv64 has been published to surface latent bugs.

## 12. Objections and Upstream Blockers

**Stated objections.** None found. No maintainer or community member has stated an objection to riscv64 support.

**Technical blockers.** None identified in Zenoh's own codebase - it is portable pure-Rust/C with no arch-specific code for any platform. The nearest technical friction point is entirely in tooling: `Cross.toml` and the `eclipse-zenoh/ci` release-matrix workflows would need a riscv64 target added, and CI runners (native riscv64 hardware or QEMU) would need to be provisioned.

**Organizational blockers.** No RISC-V-specific roadmap item, GitHub Project board entry, or milestone was found. Zenoh is not a RISE member project, and RISE has not engaged with it (Section 1). Enablement would require either upstream ZettaScale prioritizing it or third-party (e.g. RISE, distro, or chip-vendor) contribution.

**Acceptance probability.** [NEEDS VERIFICATION - no direct statement from maintainers was found either way.] Given the absence of arch-specific code, a portable-Rust/C codebase, and the precedent of PR #2700 being merged without objection (it treats riscv64 identically to the four other architectures on an allowlist), a well-formed contribution adding riscv64 to `Cross.toml` and the CI/release matrices appears likely to be accepted on technical merit, based on the low-friction pattern of the one riscv64-adjacent PR that has been merged. This is an inference from precedent, not a stated policy.

## 13. Readiness Assessment

- **Color:** orange (no color_case subtype cleanly applies: this is not a "downstream-only" case, since no distribution ships Zenoh at all - not even patched - and not an "optimization-absent" case, since Zenoh is not an optimization-purpose project. It is the plain "no upstream CI, no distribution floor available" case within the orange band.)
- **Release provider:** none. No upstream, RISE, distro, or third-party channel publishes a riscv64 build of Eclipse Zenoh in any form (binary, deb package, PyPI wheel, or OCI image).
- **Optimization level:** N/A (not an optimization-purpose project). Zenoh is a pub/sub and query middleware; its value proposition (protocol semantics, transport flexibility, edge-computing model) does not depend on architecture-specific performance tuning, and confirmed by Section 4, it has zero hand-tuned/SIMD/arch-specific code for any architecture, so the Step 2 modifier does not apply.
- **Justification.** Zero riscv64 CI exists anywhere in `eclipse-zenoh/zenoh` or `eclipse-zenoh/zenoh-pico`, confirmed by reading every workflow file directly ([`ci.yml`](https://github.com/eclipse-zenoh/zenoh/blob/main/.github/workflows/ci.yml) and 7 others in `zenoh`; 18 workflow files in `zenoh-pico`) - all return zero "riscv" matches, and the runner matrix falls back to x86-only cloud runners. No upstream release channel (GitHub releases, PyPI, Docker Hub) publishes a riscv64 artifact ([last 5 GitHub releases checked](https://github.com/eclipse-zenoh/zenoh/releases), [PyPI JSON API](https://pypi.org/pypi/eclipse-zenoh/json)). No distribution floor applies because no distro packages Zenoh for riscv64, or for any architecture - confirmed via [Ubuntu 26.04 package search](https://packages.ubuntu.com/search?keywords=zenoh&suite=resolute&searchon=names&section=all) returning zero results and a project-graph SPARQL query returning 0 bindings. This places the project squarely in the "no upstream CI" row of Step 1, yielding orange.
- **Pending work that could change the grade.** None found. There is no open PR, no RISE involvement, and no tracking issue for a riscv64 port. The only riscv64-adjacent change merged to date, [PR #2700](https://github.com/eclipse-zenoh/zenoh/pull/2700), was reactive maintenance for a 32-bit-ARM build fix, not a porting initiative, and did not touch CI, `Cross.toml`, or the release matrix. Given the absence of arch-specific code in the codebase (Section 4) and no known-blocking dependency issues at pinned versions (Section 9), the technical bar to move this to yellow/blue (adding a riscv64 cross-compilation target plus CI build/test jobs) appears low relative to typical projects in this grading exercise, but no such work is currently in flight.

## 14. Investment Analysis

RISE has not funded, tracked, or otherwise engaged with Eclipse Zenoh in any capacity found in this research (Section 1). No RISE runner time, wheel-builder slot, or blog coverage exists to build on or avoid duplicating. All of the following work items are therefore unclaimed.

### 14.1 Functional Enablement

Add a `riscv64gc-unknown-linux-gnu` target to `Cross.toml` and verify a local cross-build succeeds. Given the codebase has no riscv64-specific blockers identified in Section 4 or Section 9, this is expected to be low-risk, but has never been attempted or documented, so an initial validation pass (build + minimal smoke test) is required before claiming it works. Two of the TLS/cert-parsing dependencies (`rustls`, `x509-parser`) build cleanly from crates.io on riscv64 with no known code defect; the only friction is that their Ubuntu binary packages are missing (irrelevant to a `cargo build` from source).

### 14.2 Performance Optimization

Not a priority: Zenoh has no architecture-specific optimization code for any platform (Section 4), so there is no "amd64/arm64 parity gap" to close for the core protocol. The one identifiable performance-relevant gap is the `aes` crate's lack of a riscv64 Zvkned vector-crypto path (software fallback only) versus AES-NI/ARM-crypto-extension paths elsewhere - this is an upstream RustCrypto concern, not something actionable within the Zenoh repo itself.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `eclipse-zenoh/zenoh/.github/workflows/ci.yml` (build + test) and to the `eclipse-zenoh/ci` release-matrix workflows (`build-crates-standalone.yml`, `build-crates-debian.yml`) to produce a riscv64 standalone/deb artifact and, ideally, a `linux/riscv64` Docker Hub image. This would require either RISE-hosted native riscv64 runners or QEMU-based cross-execution for the test step (build-only CI would only reach yellow per the color model, not blue/green).

### 14.4 Ecosystem Enablement

Section 10 is omitted: Zenoh has no significant dependent package ecosystem requiring separate riscv64 enablement (it is a standalone middleware/runtime consumed as a library or binary, not a plugin/package hub with many third-party extensions that themselves need porting).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64gc-unknown-linux-gnu` to `Cross.toml`, validate local cross-build compiles and links | 1 | Upstream (ZettaScale) or third-party contributor | High |
| Functional | Smoke-test the optional `zenoh-uring` feature specifically on riscv64 (currently untested on any arch other than what CI covers) | 1 | Upstream or third-party contributor | Medium |
| CI/CD | Add riscv64 build+test job to `ci.yml`, run on native riscv64 runner (e.g. RISE runners) or QEMU | 2 | RISE or upstream, needs RISE runner access | High |
| CI/CD | Add riscv64 target to `eclipse-zenoh/ci` release-matrix workflows to produce standalone/deb artifacts | 1-2 | Upstream (ZettaScale) or RISE | Medium |
| CI/CD | Add `linux/riscv64` to the Docker Hub release job | 0.5 | Upstream (ZettaScale) | Low |
| Distribution | File/track an Ubuntu/Debian packaging request for `eclipse-zenoh` once upstream riscv64 CI exists (currently no package exists for Zenoh in Ubuntu at all, on any architecture) | 1 (tracking/coordination, not engineering) | Distro maintainers | Low |
| Performance | Track upstream RustCrypto `aes` crate for a riscv64 Zvkned vector-crypto backend; no action within Zenoh's own repo | N/A (external dependency) | RustCrypto upstream | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [Eclipse Zenoh GitHub repository](https://github.com/eclipse-zenoh/zenoh)
- [Eclipse Zenoh homepage](https://zenoh.io/)
- [PR #2700 - Make zenoh-uring to build only on platforms supported by io-uring](https://github.com/eclipse-zenoh/zenoh/pull/2700)
- [Issue #2692 - Cross-compilation fails for 32-bit ARM targets when the uring feature is enabled](https://github.com/eclipse-zenoh/zenoh/issues/2692)
- [Issue #453 - Compilation issue without 'unstable' feature](https://github.com/eclipse-zenoh/zenoh/issues/453)
- [Zenoh GitHub releases](https://github.com/eclipse-zenoh/zenoh/releases)
- [Zenoh CI workflow - ci.yml](https://github.com/eclipse-zenoh/zenoh/blob/main/.github/workflows/ci.yml)
- [Zenoh Cross.toml](https://github.com/eclipse-zenoh/zenoh/blob/main/Cross.toml)
- [zenoh-pico GitHub repository](https://github.com/eclipse-zenoh/zenoh-pico)
- [zenoh-pico cmake/platforms directory](https://github.com/eclipse-zenoh/zenoh-pico/tree/main/cmake/platforms)
- [zenoh-pico GNUmakefile](https://github.com/eclipse-zenoh/zenoh-pico/blob/main/GNUmakefile)
- [eclipse-zenoh/ci shared release workflows](https://github.com/eclipse-zenoh/ci)
- [PyPI eclipse-zenoh JSON API](https://pypi.org/pypi/eclipse-zenoh/json)
- [PyPI eclipse-zenoh project page](https://pypi.org/project/eclipse-zenoh/)
- [RISE wheel builder GitLab package registry (eclipse-zenoh)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/eclipse-zenoh/)
- [Ubuntu packages.ubuntu.com search for "zenoh"](https://packages.ubuntu.com/search?keywords=zenoh&suite=resolute&searchon=names&section=all)
- [RISE project members list](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [Eclipse Foundation project page - iot.zenoh](https://projects.eclipse.org/projects/iot.zenoh)
- [Eclipse Foundation committer list - iot.zenoh](https://projects.eclipse.org/projects/iot.zenoh/who)
- [Zenoh GitHub Wiki - Performance](https://github.com/eclipse-zenoh/zenoh/wiki/Performance)
- [Zenoh vs MQTT/Kafka/DDS blog post](https://zenoh.io/blog/2023-03-21-zenoh-vs-mqtt-kafka-dds/)
- [arXiv:2303.09419 - underlying Zenoh performance paper](https://arxiv.org/abs/2303.09419)
- [Zenoh-Pico performance improvements blog post (Apr 2025)](https://zenoh.io/blog/2025-04-09-zenoh-pico-performance/)
- [ScienceDirect - On the performance of Zenoh in Industrial IoT Scenarios](https://www.sciencedirect.com/science/article/pii/S1570870525000320)
- [briansmith/ring issue #2745 - riscv64a23 build failure](https://github.com/briansmith/ring/issues/2745)
- [quinn-rs/quinn issue #1812 - Add riscv64 Support](https://github.com/quinn-rs/quinn/issues/1812)
- [tokio-rs/io-uring issue #307 - riscv64 FFI bindings gap](https://github.com/tokio-rs/io-uring/issues/307)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
