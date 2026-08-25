---
title: OpenSK
---

# OpenSK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux and riscv32/bare-metal) support status for OpenSK<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OpenSK is a FIDO2/U2F security key firmware written in Rust, developed by Google as a proof-of-concept and research platform. The project targets embedded microcontrollers running [Tock OS](https://github.com/tock/tock) and, since 2025, the [Wasefire](https://github.com/google/wasefire) embedded application framework. The sole supported hardware is the Nordic nRF52840 SoC (ARM Cortex-M4F) across four commercially available boards (nRF52840-DK, nRF52840 Dongle, Feitian, MDK), plus an OpenTitan-based target (RV32I) added via the Wasefire layer.

The project carries the explicit disclaimer "This is not an officially supported Google product." It is not affiliated with any Linux Foundation project, and no FIDO Alliance governance membership is documented for the repository itself. Google LLC is a Premier Member of the RISE project, but OpenSK has no documented connection to RISE activities: zero repositories, zero code search hits, and no mention in any of the 34 RISE blog posts audited through 2026-08-24.

**Corporate maintainers (by commit count, from GitHub):**

| Contributor | Affiliation | Commits |
|---|---|---|
| kaczmarczyck (Fabian Kaczmarczyck) | Google | 399 |
| ia0 (Julien Cretin) | Google | 342 |
| jmichelp (Jean-Michel Picod) | Google | 214 |
| gendx (Guillaume E) | not disclosed | 173 |
| pwnall (Victor Costan) | Google | active |
| hcyang-google | Google (implied by username) | 21 |

All contributors with disclosed affiliations list Google. The project is effectively Google-internal in its maintainer base, though contributions are accepted from the community under a Google CLA requirement.

**Repository metadata:** Created 2019-12-17, Apache-2.0 license, default branch `develop`, 3,403 stars, 334 forks, 12 open issues (as of research date). One tagged release (`ctap2.0`, published 2021-06-23) with no binary assets attached.

**Community stance on new ports:** No formal tier policy or port acceptance criteria are documented. Maintainer responses in Issue [#44](https://github.com/google/OpenSK/issues/44) (2020) and Issue [#573](https://github.com/google/OpenSK/issues/573) (2022) indicate willingness to support new platforms if a contributor authors the required Wasefire API surface (api-button, api-crypto-*, api-usb-ctap), but no commitment to do so themselves.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-02-20 | Community asks whether OpenSK can run on RISC-V; maintainer confirms Tock OS supports RV32I but no qualifying board (USB + button + LED + Tock upstream) exists commercially | [Issue #44](https://github.com/google/OpenSK/issues/44) |
| 2022 | Community member attempts port to ESP32-C3/C2 (RV32I); maintainer notes atomics limitation but says timing is not a concern; issue resolved noting Wasefire migration will generalize platform support | [Issue #573](https://github.com/google/OpenSK/issues/573) |
| 2023-01-08 | Contributor (L0g4n, thesis on OpenTitan FIDO2) asks maintainers if they want a Tock 2.x port; maintainer notes libtock-rs 2.0 requires ARM or RISC-V host to compile natively | [Issue #579](https://github.com/google/OpenSK/issues/579) |
| 2023-01-17 | PR #580 opened (WIP Tock v2 port); explicitly states "OpenSK can not be built on x86 host machines... cross-compile for ARM or RISCV" is the supported path | [PR #580](https://github.com/google/OpenSK/pull/580) |
| 2023-05-05 | PR #620 merged (Tock v2 port, rebased by maintainer kaczmarczyck); libtock-rs 2.0 is now the runtime, supporting ARM and RISC-V cross-compilation targets; no dedicated RISC-V board support added | [PR #620](https://github.com/google/OpenSK/pull/620) |

No RISC-V-specific commits exist in the repository. The `riscv32imc-unknown-none-elf` target present in the Wasefire subproject toolchain (`third_party/wasefire/rust-toolchain.toml`) is for the OpenTitan hardware runner maintained by the Wasefire project, not by OpenSK. No riscv64 work has ever been started. The work in PR #620 is fully upstream and merged.

---

## 3. Upstream Support Tier

OpenSK has no published tier policy. In practice, the project supports exactly one architecture family: ARM Cortex-M4 (thumbv7em-none-eabi). The OpenTitan RV32I path exists in the Wasefire dependency but is not part of OpenSK's own build scripts, CI, or release artifacts.

| Property | amd64 | arm64 | armv7em (Cortex-M4) | riscv32imc (OpenTitan) | riscv64 |
|---|---|---|---|---|---|
| CI build | host sim only | no | no | no | no |
| CI test | host sim only | no | no | no | no |
| Hardware flash target | no | no | yes (4 boards) | partial (Wasefire only) | no |
| Official binary | no | no | no | no | no |
| Release artifact | no | no | no | no | no |

No official binaries exist for any architecture. The single GitHub release (`ctap2.0`) has an empty assets array. The amd64 build path is a desktop simulation mode (`--features std`) used for unit testing only.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenSK is embedded firmware. It has no JIT compiler, no SIMD dispatch, no garbage collector, and no architecture-specific assembly files. The cryptographic core was migrated from a custom implementation to RustCrypto crates via [PR #722](https://github.com/google/OpenSK/pull/722) (merged March 2025 [NEEDS VERIFICATION - PR number and exact date not in research findings]). The relevant architecture-sensitive subsystems are:

**Cryptography (RustCrypto crates):**

| Component | Role | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| p256 (ECDH + ECDSA) | CTAP2 required | pure Rust | pure Rust | pure Rust, no HW accel |
| sha2 (SHA-256) | CTAP2 PIN, attestation | x86 SHA-NI intrinsics | ARMv8 SHA intrinsics | Zknh scalar extension available but must be enabled via RUSTFLAGS |
| aes (v0.8.4, AES-CBC) | credential protection | x86 AES-NI | ARMv8 AESE | pure-Rust soft fallback only |
| ed25519-compact | optional Ed25519 | pure Rust | pure Rust | pure Rust |
| getrandom | entropy source | OS syscall | OS syscall | Linux riscv64 via linux_raw backend; bare-metal requires custom backend |

Four PRs to add RISC-V hardware AES acceleration to RustCrypto block-ciphers ([#397](https://github.com/RustCrypto/block-ciphers/pull/397), [#399](https://github.com/RustCrypto/block-ciphers/pull/399), [#492](https://github.com/RustCrypto/block-ciphers/pull/492), [#493](https://github.com/RustCrypto/block-ciphers/pull/493)) were all closed without merge. The locked version aes 0.8.4 has no RISC-V hardware path in any branch. SHA-256 Zknh support was merged in RustCrypto/hashes [PR #614](https://github.com/RustCrypto/hashes/pull/614) (2024-08-23) and improved in [PR #617](https://github.com/RustCrypto/hashes/pull/617) (2024-08-27).

**WebAssembly interpreter (Wasefire layer):**

Wasefire runs OpenSK applets as WebAssembly modules. CoreMark benchmark data from [Wasefire issue #46](https://github.com/google/wasefire/issues/46) provides the only RISC-V-adjacent performance figures, run in a RISC-V Linux docker container on a contributor's laptop (no embedded RISC-V hardware measured):

| Runtime | CoreMark (Linux RISC-V docker) | Wall time |
|---|---|---|
| Wasefire base interpreter | ~27-28 | ~18-19 s |
| dev/fast-interp (side-table + value-stack) | 38.3 | 18.5 s |
| wasm3 | ~870-957 | ~12-14 s |
| wasmi (unoptimized) | ~620-692 | ~17-19 s |
| wasmi (LLVM optimizations) | ~1112 | 28.2 s |

Embedded comparison (ARM nRF52840, Cortex-M4, same Wasefire codebase):

| Runtime | CoreMark | Wall time | Code size | RAM |
|---|---|---|---|---|
| Wasefire base | 0.0887 | 225.9 s | 136 KB | 5,416 B |
| dev/fast-interp | 0.1541 | 130.0 s | 141 KB | 6,244 B |
| wasmi (unoptimized) | 3.394 | 20.7 s | 912 KB | 91,960 B |
| wasmi (LLVM opt) | 4.489 | 15.6 s | 820 KB | 91,960 B |
| wasm3 | N/A (failed to compile for Nordic) | -- | -- | -- |

No benchmark data exists for OpenSK running on embedded RISC-V hardware. There is no RISC-V embedded port to benchmark.

---

## 5. Build System, Cross-Compilation, and Toolchain

OpenSK uses Rust/Cargo exclusively. There is no CMake, no GCC cross-toolchain, no Dockerfile anywhere in the repository.

**OpenSK toolchain pin** (`rust-toolchain.toml` at repo root):
```
channel = "nightly-2026-06-03"
components = ["clippy", "miri", "rustfmt", "rust-src"]
targets = ["thumbv7em-none-eabi"]
```

The `thumbv7em-none-eabi` target is the only cross-compilation target declared in OpenSK's own toolchain file.

**Wasefire subproject toolchain pin** (`third_party/wasefire/rust-toolchain.toml`):
```
channel = "nightly-2026-08-04"
targets = [
  "i686-unknown-linux-gnu",
  "riscv32imc-unknown-none-elf",
  "thumbv7em-none-eabi",
  "wasm32-unknown-unknown",
  "x86_64-unknown-linux-gnu",
]
```

The `riscv32imc-unknown-none-elf` target in the Wasefire subproject is for the OpenTitan runner (`runner-opentitan` crate), which depends on `riscv = "0.16.1"` and `riscv-rt = "0.18.0"`. Build commands for that target:

```sh
# Via OpenSK flash.sh (delegates to cargo xtask):
./flash.sh opentitan

# Direct cargo check (from third_party/wasefire/crates/runner-opentitan/test.sh):
cargo check --bin=runner-opentitan --target=riscv32imc-unknown-none-elf \
  --features=wasm,release,usb-ctap

# RISCV_MTVEC_ALIGN env var set by xtask:
RISCV_MTVEC_ALIGN=256
```

For a hypothetical riscv64 port, all toolchain infrastructure would need to be built from scratch. No build commands, no cargo targets, and no cross-compilation documentation for riscv64 exist in the repository.

**QEMU:** Not used anywhere. The OpenTitan platform uses the physical Teacup A2 board with `opentitantool` over serial.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | armv7em (Cortex-M4) | riscv32imc (OpenTitan) | riscv64 |
|---|---|---|---|---|
| FIDO2 / CTAP2 operation | simulation only | full | partial (Wasefire path, board-dependent) | not possible |
| CTAP1 / U2F | simulation only | full | partial | not possible |
| USB HID transport | simulation only | full (4 boards) | board-dependent | not possible |
| PIN protocol | simulation only | full | partial | not possible |
| Hardware crypto (AES) | AES-NI | CryptoCell-310 (nRF) | otcrypto (OT) | none - soft fallback only |
| Hardware crypto (SHA-256) | SHA-NI | CryptoCell-310 | otcrypto | Zknh extension (opt-in, RUSTFLAGS required) |
| Hardware RNG | host OS | nRF RNG peripheral | OT RNG | none (bare-metal); OS TRNG on Linux |
| Desktop simulation / unit tests | full | N/A | N/A | Linux riscv64 host builds possible |
| Flash/firmware update | N/A | full (nrfdfu) | opentitantool | not possible |

**Functional gaps for riscv64:**
- No board configuration in `flash.sh` or xtask for any RISC-V target beyond OpenTitan (RV32I).
- No Tock OS riscv64 port (see Section 9 dependency blocker).
- No Wasefire riscv64 runner.
- USB CTAP transport requires a RISC-V board with a USB controller, a Tock or Wasefire hardware driver, and an upstream board definition - none exist.

**Performance gaps for riscv64 (hypothetical, no measured data):**
- AES-CBC: pure-Rust fallback only. All four RISC-V hardware AES backend PRs to RustCrypto were closed without merge.
- SHA-256: Zknh acceleration available but requires explicit RUSTFLAGS opt-in and a CPU that implements Zknh.
- P-256 (ECDSA): pure-Rust only on all architectures including riscv64.

**Security hardening:** No Rust unsafe code audit specific to RISC-V was found. cpufeatures (RustCrypto/utils) fires a `compile_error!` for riscv64 targets ([issue #1087](https://github.com/RustCrypto/utils/issues/1087), open since 2024-07-16), but OpenSK's locked aes 0.8.4 only imports cpufeatures under `#[cfg(any(target_arch = "x86", target_arch = "x86_64", target_arch = "aarch64"))]`, so this does not block OpenSK's desktop test builds on riscv64.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists. All six CI workflow files in `.github/workflows/` were inspected and contain zero references to "riscv", "riscv64", "RISCV", cross-compilation targeting RISC-V, or QEMU emulation.

| Workflow file | Trigger | Runner | riscv64 |
|---|---|---|---|
| ci.yml | push/PR to develop, weekly | ubuntu-latest, macos-latest | none |
| cargo_audit.yml | scheduled | ubuntu-latest | none |
| cargo_bloat.yml | pull_request | ubuntu-latest | none |
| cifuzz.yml | push to develop | ubuntu-latest | none |
| coveralls.yml | push/PR | ubuntu-latest | none |
| mdlint.yml | push/PR | ubuntu-latest | none |

The sole occurrence of "riscv64" in the entire repository is a download URL inside `uv.lock` for the `ruff` Python linter's own riscv64 wheel - a lockfile artifact from the Python dev toolchain, unrelated to OpenSK's build output.

| CI property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build tested | yes (host sim) | no | no |
| Tests run | yes (host sim) | no | no |
| RISE runners used | no | no | no |
| Hardware-in-loop | no | no | no |

---

## 8. Distribution and Release Status

OpenSK is embedded firmware. It does not publish binary packages for any conventional OS architecture.

| Channel | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Releases (binaries) | no (empty assets array) | no | no |
| PyPI | N/A (HTTP 404) | N/A | N/A |
| Debian | N/A (HTTP 404) | N/A | N/A |
| Ubuntu packages | not present | not present | not present |
| Arch Linux RISC-V | not present | not present | not present |
| OCI / container image | none | none | none |

The single GitHub release (`ctap2.0`, 2021-06-23) has `"assets": []`. The Tock v2 changes from PR #620 (merged 2023-05-05) are not included in any tagged release. There is no binary distribution mechanism for any architecture. To obtain a working firmware image, a user must clone the repository and build from source with the exact pinned Rust nightly toolchain.

To get a working binary on a supported nRF52840 board:
1. Install `rustup` and the pinned nightly toolchain with `thumbv7em-none-eabi` target.
2. Install `nrfdfu` or Nordic's proprietary tools.
3. Run `./flash.sh nrf52840dk` (or the appropriate board variant).

No equivalent path exists for any RISC-V board. The closest available path is the OpenTitan RV32I route via the Wasefire subproject, which requires access to a Teacup A2 board and `opentitantool`.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Tock OS (tock/tock) | Microkernel for nRF52840 boards | RV32I yes; RV64I incomplete | no riscv64 CI | no | [#2332](https://github.com/tock/tock/issues/2332) open since 2021, missing 64-bit syscall.rs, PMP rv64, QEMU rv64 CI, 64-bit TRD; last updated 2026-06-25 |
| Wasefire (google/wasefire) | Embedded OS/HAL abstraction; main runtime | RV32I (OpenTitan runner); no riscv64 runner | no | no | No riscv64 runner exists; OpenTitan runner targets riscv32imc only |
| p256 (RustCrypto/elliptic-curves) | P-256 ECDH + ECDSA | yes (pure Rust) | no | crates.io | None; pure-Rust fallback functional |
| sha2 (RustCrypto/hashes) | SHA-256 | yes; Zknh backend available | not in CI | crates.io | None blocking; Zknh opt-in via RUSTFLAGS |
| aes v0.8.4 (RustCrypto/block-ciphers) | AES-CBC | yes (pure-Rust soft fallback) | no | crates.io | [#397](https://github.com/RustCrypto/block-ciphers/pull/397), [#399](https://github.com/RustCrypto/block-ciphers/pull/399), [#492](https://github.com/RustCrypto/block-ciphers/pull/492), [#493](https://github.com/RustCrypto/block-ciphers/pull/493) all closed without merge; no RISC-V HW AES path exists |
| cpufeatures v0.2.17 (RustCrypto/utils) | CPU feature detection | compile_error! for riscv64 | N/A | N/A | [#1087](https://github.com/RustCrypto/utils/issues/1087) open since 2024-07-16; does not block OpenSK because aes 0.8.4 guards cpufeatures behind x86/aarch64 cfg |
| ed25519-compact v1.0.16 | Ed25519 signatures (optional) | yes (pure Rust) | no | crates.io | None |
| getrandom v0.2.15 | Entropy source | yes (linux_raw backend on riscv64-linux) | no | crates.io | Bare-metal riscv64 requires custom backend; Wasefire provides its own RNG API |
| sk-cbor (in-tree) | CBOR encoding/decoding | yes (pure Rust) | no | N/A (in-tree) | None |
| portable-atomic-util v0.2.6 | Lock-free allocator utilities | yes (riscv64 supported via portable-atomic fallback) | no | crates.io | None |
| openssl v0.10.80 (build-dep only) | UUID generation in build script | yes (build host only) | N/A | crates.io | 82 open riscv64 issues in openssl/openssl but none block this build-dep usage; see reports/openssl.md |

**Hard blockers for riscv64 bare-metal firmware deployment:**

1. Tock OS riscv64 ([#2332](https://github.com/tock/tock/issues/2332)): Missing 64-bit syscall register handling, PMP rv64, and QEMU rv64 CI. Open since 2021. Without this, Tock-based OpenSK cannot run on any 64-bit RISC-V target.
2. No Wasefire riscv64 runner: The `runner-opentitan` targets riscv32imc. A riscv64 runner (board HAL, drivers for USB-CTAP, button, LED, flash) must be authored from scratch.
3. No commercially available riscv64 board with all required peripherals (USB controller, button, LED) and Tock/Wasefire upstream support has been identified. This was the stated blocker in Issue [#44](https://github.com/google/OpenSK/issues/44) in 2020 and remains unresolved.

**Hard blockers for desktop test builds on riscv64 Linux:** None. The `--features std` simulation path should build and run on riscv64-unknown-linux-gnu.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#44](https://github.com/google/OpenSK/issues/44) | Can OpenSK be used on RiscV? | closed (2020-02-25) | N/A | No qualifying RISC-V board identified; no resolution |
| [#573](https://github.com/google/OpenSK/issues/573) | ESP32-C3/C2 port interest | closed (2022) | N/A | Wasefire migration opens path to any board implementing required API surface; no port completed |
| [Tock #2332](https://github.com/tock/tock/issues/2332) | RISC-V 64-bit support | open (since 2021) | blocker | Missing syscall.rs XLEN, PMP rv64, QEMU rv64 CI, 64-bit TRD; last updated 2026-06-25 |
| [RustCrypto utils #1087](https://github.com/RustCrypto/utils/issues/1087) | cpufeatures: add RISC-V support | open (since 2024-07-16) | low (does not block OpenSK aes 0.8.4) | compile_error! fires for riscv64 if cpufeatures is used directly |

No riscv64-specific correctness bugs are open in the google/OpenSK tracker. Zero results were returned by GitHub searches for "riscv64" in issues or PRs.

---

## 12. Objections and Upstream Blockers

**Technical blockers (in dependency order):**

1. Tock OS must gain riscv64 support before any Tock-based OpenSK port can function on 64-bit RISC-V. This requires work outside the OpenSK repository (tock/tock, tracked in [#2332](https://github.com/tock/tock/issues/2332)).
2. A Wasefire riscv64 runner must be written. The Wasefire framework is extensible by design but requires a complete HAL implementation for a target board, including USB-CTAP HID, button, LED, flash, and RNG drivers.
3. A qualifying RISC-V board (USB controller, button, LED, Tock/Wasefire upstream support) must be identified and acquired. None has been identified in any public discussion.
4. AES hardware acceleration is unavailable on riscv64 via the current locked aes 0.8.4 crate and has no viable upstream patch path (all four RISC-V AES PRs closed). This is a performance gap, not a correctness blocker.

**Organizational blockers:**

- The OpenSK maintainer team is exclusively Google engineers. New architecture support would require either Google internal prioritization or a sustained community contributor effort.
- CLA requirement (Google CLA) applies to all contributions.
- The project is explicitly framed as a research platform, not a production product. Investment in new architectures is unlikely to be prioritized without an external driver (e.g., a FIDO2 security key product based on RISC-V hardware).

**Acceptance probability:** High for a well-formed PR that includes a Wasefire runner for a qualified board, passing CTAP2 compliance tests (the test harness already exists; PR #620 shows 63/66 passing on ARM). Low for riscv64 specifically, as no riscv64 Linux board is a natural security key form factor. Higher probability for rv32 targets (OpenTitan already partially supported).

---

## 13. Investment Analysis

RISE has no involvement in OpenSK. No prior investment to account for.

### 13.1 Functional Enablement

The minimal path to a working OpenSK on a RISC-V embedded target is:

1. Resolve Tock riscv64 ([#2332](https://github.com/tock/tock/issues/2332)): syscall register handling, PMP, QEMU CI. This work is in the tock/tock repository, not OpenSK. Alternatively, target an rv32 board (OpenTitan path via Wasefire is further along).
2. Author a Wasefire riscv64 (or rv32) runner with the required API surface.
3. Add the board to OpenSK's `flash.sh` and `boards/` documentation.
4. Run the CTAP2 compliance test suite to confirm correctness.

A more tractable near-term path: complete the OpenTitan (riscv32imc) OpenSK support within Wasefire, since the `runner-opentitan` crate already exists. This does not address riscv64 but produces a working RISC-V FIDO2 security key on a real board.

### 13.2 Performance Optimization

- SHA-256 Zknh acceleration requires no code change to OpenSK or RustCrypto; it requires only a `RUSTFLAGS` change at build time. Effort: trivial (build system change only).
- AES hardware acceleration on riscv64 requires either upstreaming a new patch to RustCrypto block-ciphers (four prior attempts failed) or vendoring a modified crate. Moderate effort; uncertain acceptance. The locked aes 0.8.4 would also need to be updated.
- P-256 pure-Rust performance is adequate for infrequent FIDO2 operations (one registration, one assertion per session). This is not a high-priority gap.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding QEMU-based riscv64 simulation for the desktop test suite (`--features std`) is the lowest-cost entry point and requires no new hardware. Hardware-in-loop CI for an embedded RISC-V board requires both a qualifying board and CI runner infrastructure (e.g., RISE RISC-V runners announced 2026-03-24).

### 13.4 Ecosystem Enablement

Not applicable. OpenSK is embedded firmware with no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve Tock riscv64 support (tock/tock [#2332](https://github.com/tock/tock/issues/2332)) | 6-10 | Tock community / RISE | Critical (dependency for all riscv64 paths) |
| Functional | Author Wasefire riscv64 or rv32 runner (board HAL + USB-CTAP) | 8-16 | Wasefire contributor | Critical |
| Functional | Add OpenSK board config + flash.sh entry for qualifying RISC-V board | 1-2 | OpenSK contributor | High (after runner exists) |
| Functional | Run CTAP2 compliance tests on RISC-V target and fix regressions | 2-4 | OpenSK contributor | High |
| Performance | Enable SHA-256 Zknh acceleration via RUSTFLAGS in build scripts | 0.5 | OpenSK contributor | Low |
| Performance | Upstream RISC-V AES hardware acceleration to RustCrypto block-ciphers (riscv64 Zknd) | 4-8 | RustCrypto contributor | Medium (4 prior failures; uncertain acceptance) |
| CI/CD | Add QEMU riscv64 simulation build + unit test job to ci.yml | 1-2 | OpenSK contributor | Medium |
| CI/CD | Hardware-in-loop CI for RISC-V board | 3-5 | OpenSK + RISE runner infra | Low (board prerequisite) |

Total estimated effort for minimal functional riscv64 (or rv32) support: 20-36 person-weeks, the majority in the Tock OS and Wasefire dependencies rather than OpenSK itself.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [OpenSK repository (google/OpenSK)](https://github.com/google/OpenSK)
- [Issue #44: Can OpenSK be used on RiscV?](https://github.com/google/OpenSK/issues/44)
- [Issue #573: ESP32-C3/C2 port interest](https://github.com/google/OpenSK/issues/573)
- [Issue #579: Interest in Tock 2.x Port?](https://github.com/google/OpenSK/issues/579)
- [PR #580: Overview: Add tock v2 support (closed)](https://github.com/google/OpenSK/pull/580)
- [PR #620: Tock V2 port - rebased and updated (merged 2023-05-05)](https://github.com/google/OpenSK/pull/620)
- [Tock OS issue #2332: RISC-V 64-bit Support](https://github.com/tock/tock/issues/2332)
- [Wasefire repository (google/wasefire)](https://github.com/google/wasefire)
- [Wasefire issue #46: interpreter performance and footprint (CoreMark benchmarks)](https://github.com/google/wasefire/issues/46)
- [RustCrypto hashes PR #614: SHA-256 Zknh support (merged 2024-08-23)](https://github.com/RustCrypto/hashes/pull/614)
- [RustCrypto hashes PR #617: SHA-256 Zknh improvement (merged 2024-08-27)](https://github.com/RustCrypto/hashes/pull/617)
- [RustCrypto block-ciphers PR #397: RISC-V AES (closed)](https://github.com/RustCrypto/block-ciphers/pull/397)
- [RustCrypto block-ciphers PR #399: RISC-V AES (closed)](https://github.com/RustCrypto/block-ciphers/pull/399)
- [RustCrypto block-ciphers PR #492: RISC-V AES (closed)](https://github.com/RustCrypto/block-ciphers/pull/492)
- [RustCrypto block-ciphers PR #493: RISC-V AES (closed)](https://github.com/RustCrypto/block-ciphers/pull/493)
- [RustCrypto utils issue #1087: cpufeatures RISC-V support](https://github.com/RustCrypto/utils/issues/1087)
- [RISE project member list](https://riseproject.dev)
- [RISE blog: Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/blog)