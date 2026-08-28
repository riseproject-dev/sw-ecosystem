---
title: alioth
---

# alioth

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for alioth<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Alioth ([google/alioth](https://github.com/google/alioth)) is an experimental Type-2 hypervisor written from scratch in Rust. It runs on Linux (via KVM) and macOS (via Apple's Hypervisor.framework). The README states plainly: "Alioth is an experimental project and is NOT an officially supported Google product." The project carries no CNCF, Linux Foundation, or other foundation affiliation, no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, or SECURITY.md file, and is licensed Apache-2.0.

Governance is effectively single-maintainer: Changyuan Lyu ("Lencerf"), a Google software engineer, holds 738 of the repository's commits and authored every architecture port (aarch64/KVM and Apple Hypervisor Framework) to date. dependabot[bot] accounts for 145 commits (automated dependency bumps); one other human contributor ("astro") has a single, unrelated commit. There is no multi-vendor contributor base.

Contribution process (`docs/contributing.md`): standard Google open-source process, requiring a signed Google CLA and adherence to [Google's Open Source Community Guidelines](https://opensource.google/conduct/). All changes go through GitHub PR review. No formal RFC or tiered maintainer/design-review process is documented.

On community culture toward new architecture ports: RISC-V has never been raised in any issue, PR, commit message, README, or roadmap ("Future Work" lists ACPI DSDT generation, test coverage, documentation, and generic performance optimization only). There is no basis in the record to infer either receptiveness or resistance to a hypothetical RISC-V port, it has simply never been requested or attempted by anyone at any point in the project's history.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port, in progress, planned, or attempted. The only architecture-porting milestones in the project's history are for aarch64 and x86_64:

| Date | Event | Source |
|---|---|---|
| 2024-02-05 | First commit ("Initial release"), by Changyuan Lyu. Established x86_64/Linux/KVM as baseline. | [Repository](https://github.com/google/alioth) |
| 2024-06-17 to 2024-07-19 | aarch64/KVM port lands (PRs #42-#80), all authored by Lencerf | [google/alioth pull requests](https://github.com/google/alioth/pulls?q=is%3Apr) |
| 2025-08-19 to 2025-09-02 | Apple Hypervisor Framework port (aarch64/macOS) lands (PR #281), solely by Lencerf | [PR #281](https://github.com/google/alioth/pull/281) |
| never | No riscv64 commit, PR, branch, or fork exists | Full commit history (~884 commits), all 474 PRs, and all 30 forks searched for "riscv"/"risc-v", zero matches |

Key contributors: Changyuan Lyu (Google) is the sole author of both existing architecture ports and remains the de facto only maintainer. No other organization or individual has contributed architecture-level code. Is RISC-V fully upstream? Not applicable, there is no RISC-V code to upstream, and no branch or fork carrying such work was found among the 30 forks checked.

## 3. Upstream Support Tier

Alioth has no formal, published tiering policy for architecture support. Support is de facto defined by what the CI matrix builds, tests, and what the release pipeline ships:

| Architecture | CI build | CI test | Release binaries | README claim |
|---|---|---|---|---|
| amd64 (x86_64) | Yes, `x86_64-unknown-linux-gnu`/`-musl` (`rust.yml`) | Yes, native runner (`ubuntu-latest`) | Yes, `alioth-linux-x86_64.tar.xz` | "Runs on x86_64 (Linux)" |
| arm64 (aarch64) | Yes, `aarch64-unknown-linux-gnu`/`-musl` and `aarch64-apple-darwin` (`rust.yml`) | Yes, native runner (`ubuntu-24.04-arm`, `macos-latest`) | Yes, `alioth-linux-aarch64.tar.xz`, `alioth-darwin-aarch64.tar.xz` | "and aarch64 (Linux & macOS)" |
| riscv64 | No | No | No | Not mentioned anywhere, including "Future Work" |

Verified by reading `.github/workflows/rust.yml`, `.github/workflows/bootloader.yml`, and `.github/workflows/release.yml` in full; all three enumerate only the five targets above. No riscv64 target string appears in any workflow file, `dependabot.yml`, `Cargo.toml`, or `rust-toolchain.toml`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Architecture-specific code lives under `alioth/src/arch/`, with parallel arch-gated modules in `cpu/`, `board/`, `hv/kvm/`, `loader/`, and `firmware/`. The dispatch file `alioth/src/arch/arch.rs` (fetched in full, 23 lines):

```rust
#[path = "aarch64/aarch64.rs"]
pub mod aarch64;
#[path = "x86_64/x86_64.rs"]
pub mod x86_64;

#[cfg(target_arch = "aarch64")]
pub use self::aarch64::*;
#[cfg(target_arch = "x86_64")]
pub use self::x86_64::*;
```

There is no third `#[cfg(target_arch = "riscv64")]` arm, no fallback branch, and no `compile_error!` guard for unsupported architectures, there is simply nothing riscv64-specific anywhere to gate. Repo-wide, 231 occurrences of `#[cfg(target_arch = ...)]` were found across 25 files; every one resolves to `"x86_64"` or `"aarch64"`. Line-count comparison: x86_64/amd64 code totals 2,873 lines across 21 files; aarch64/arm64 code totals 1,393 lines across 11 files; riscv64 code totals 0 lines across 0 files.

There is no JIT backend anywhere (Alioth is a hypervisor built on host virtualization extensions, not an emulator, so there is no instruction-translation layer to port). No `.S`/`.s`/`.asm` files exist anywhere in the 320-entry repo tree. The one SIMD-relevant detail is a dependency, not Alioth's own code: `parking_lot`'s `hardware-lock-elision` feature (enabled by Alioth) is hard-gated to `x86`/`x86_64` and compiles to a safe no-op stub on aarch64 today, which would apply identically on riscv64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU state / vCPU model | `cpu/cpu_amd64.rs` present | `cpu/cpu_arm64.rs` present | Missing, no file |
| Hypervisor backend | `hv/kvm` (KVM) | `hv/kvm` (KVM) + `hv/hvf` (macOS) | Missing, despite upstream Linux KVM/RISC-V existing since Linux 6.4 |
| Board/device model | amd64 paths present | arm64 paths present | Missing |
| Bootloader | `bootloader/build.sh` builds for `x86_64` | builds for `arm64` | No case-statement branch |
| Firmware (OVMF/ACPI) | `firmware/ovmf/ovmf_amd64/` present | arm64 equivalent present | Missing |
| JIT | N/A, no JIT in project | N/A | N/A |

## 5. Build System, Cross-Compilation, and Toolchain

Alioth is a pure Cargo/Rust workspace: no CMake, no `configure` script, no `CMakeLists.txt`, no `cmake/` directory anywhere. `rust-toolchain.toml` pins `channel = "stable"` with no explicit minimum version; CI additionally uses Rust `nightly` for `rustfmt` and `cargo llvm-cov`. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists, so there is no documented cross-compilation procedure for any architecture.

`bootloader/build.sh` builds a Linux kernel bootloader, dispatching on an `ARCH=` variable mapped via case statement to `x86` or `arm64` only, no riscv branch. No Dockerfile exists anywhere (CI installs dependencies directly via `apt-get`/`cargo`/`go install`). QEMU is not used as a build or test dependency; the only QEMU reference in the repo is a design comment in `docs/coco.md` citing QEMU as an architectural reference for x86_64 SEV/TDX confidential computing, unrelated to riscv64.

Cargo `[features]` in `alioth/Cargo.toml` contains only `test-hv = []`, no riscv-related flag. `deny.toml` permits Unicode-3.0, MIT, Apache-2.0 licenses with no architecture-specific logic. Since no riscv64 target is declared anywhere, there is no documented or known riscv64 build failure to report, the build has never been attempted upstream as far as the record shows.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boot/run a Linux guest VM | Yes (KVM) | Yes (KVM) | No, no hv backend |
| Boot/run a macOS host guest | N/A | Yes (Hypervisor.framework) | N/A |
| musl target build | Yes | Yes | No |
| Release binary tarball | Yes (`alioth-linux-x86_64.tar.xz`) | Yes (`alioth-linux-aarch64.tar.xz`, `alioth-darwin-aarch64.tar.xz`) | No |
| TDX / confidential computing | Yes (x86_64 TDX, per open issue #415) | N/A | N/A, no RISC-V confidential-computing integration exists |
| PVH boot note parsing | Yes (`search_pvh_note`, per issue #174) | Generic loader code, presumed shared | Not evaluated, no riscv64 loader exists |

Because there is zero riscv64 code, every functional gap is total: Alioth cannot build, run, boot a guest, or produce a release artifact for riscv64, this is a binary yes/no gap, not a partial-feature gap. There is consequently no performance delta to measure (no missing-SIMD-path benchmark exists because there is no riscv64 binary to benchmark, see Section 11), no security-hardening gap to characterize beyond "the feature does not exist," and no NaN/floating-point semantics issue reported for any architecture in this project's 5-issue tracker.

## 7. CI/CD Infrastructure

No riscv64 CI exists in any form, not building, not testing, not even referenced in a disabled job. Verified by reading all three GitHub Actions workflow files plus `dependabot.yml` in full, `grep -i riscv` across all four (zero matches), and a GitHub code-search API call (`search/code?q=riscv+repo:google/alioth`, `riscv64`, `"risc-v"`, all `total_count: 0`).

| Workflow | Trigger | Targets | riscv64? |
|---|---|---|---|
| [`rust.yml`](https://github.com/google/alioth/blob/main/.github/workflows/rust.yml) | push/PR to `main`, paths `*.rs`/`Cargo.toml`/`Cargo.lock` | `x86_64-unknown-linux-gnu` (ubuntu-latest), `aarch64-unknown-linux-gnu` (ubuntu-24.04-arm), `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, `aarch64-apple-darwin` (macos-latest) | No |
| [`bootloader.yml`](https://github.com/google/alioth/blob/main/.github/workflows/bootloader.yml) | workflow_dispatch/workflow_call/PR to `main` | `x86_64` (ubuntu-latest), `aarch64` (ubuntu-24.04-arm) | No |
| [`release.yml`](https://github.com/google/alioth/blob/main/.github/workflows/release.yml) | tag push `v*` | `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, `aarch64-apple-darwin`; calls `bootloader.yml` | No |
| `dependabot.yml` | n/a | `github-actions` and `cargo` ecosystems only | No arch relevance |

Every job runs on a native GitHub-hosted runner matching the target's real architecture. There is no QEMU-based cross-arch emulation job and no self-hosted runner of any kind. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `azure-pipelines.yml`, or `.travis.yml` exists in the repo.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Native runner | Native runner | None |
| Test CI | Native runner | Native runner | None |
| Release CI | Native runner | Native runner (Linux + Darwin) | None |
| RISE runner used | No | No | No, project has no RISE affiliation at all (see Section 12) |

## 8. Distribution and Release Status

No official riscv64 binary exists for Alioth through any channel checked.

**GitHub Releases** (last 5 checked): v0.12.0 (2026-03-14) and v0.11.0 (2026-01-30) each publish exactly three assets, `alioth-darwin-aarch64.tar.xz`, `alioth-linux-aarch64.tar.xz`, `alioth-linux-x86_64.tar.xz`. v0.10.0 (2025-12-21), v0.9.0 (2025-09-02), and v0.8.0 (2025-06-10) publish zero assets. No release has ever published a riscv64 artifact.

**Package managers:** No PyPI package exists for the Alioth hypervisor (the PyPI package named `alioth`, latest v1.0.9, is an unrelated remote-vulnerability scanner by a different author, ships only architecture-independent `py3-none-any` wheels, and is unrelated to google/alioth). No npm or Maven artifact was found or is applicable. No OCI/container image was found within the scope of this research.

**Linux distributions:** No "alioth" package exists in Ubuntu (noble; `packages.ubuntu.com` search returns "Sorry, your search gave no results" for any section/architecture), Debian (`tracker.debian.org/pkg/alioth` returns HTTP 404; `madison` and `sources.debian.org` searches are empty), or Arch Linux's RISC-V port (`archriscv.felixc.at` shows nothing under this name; direct checks of the `core`/`extra`/`community`/`unsupported`/`multilib` riscv64 repo directories and the `felixonmars/archriscv-packages` patch repo found nothing).

**What a user must do today to get a working riscv64 binary:** there is no path. A user would need to write and upstream net-new riscv64 architecture support (CPU/board/hv-backend/bootloader/firmware modules, see Section 4) before any build, let alone a packaged release, becomes possible.

## 9. Dependencies

Data drawn from the workspace `Cargo.toml`, per-crate `Cargo.toml` files, and the full `Cargo.lock` (1,152 lines, approximately 90 locked packages).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| [rust-lang/libc](https://github.com/rust-lang/libc) v0.2.189 | FFI bindings for Unix syscalls (mmap, ioctl for KVM) | Builds; `riscv64gc-unknown-linux-gnu` in `test_tier2` matrix | Full test suite executes via QEMU inside Docker (`ci/run-docker.sh`) | Source-only crate, arch-agnostic | Issue #4603 (EM_RISCV const) closed/fixed; #5379 open but scoped to `riscv32gc`, not riscv64 |
| [google/zerocopy](https://github.com/google/zerocopy) v0.8.55 | Zero-copy (de)serialization / safe transmute | Builds + `cargo check --tests` for riscv64gc | `cargo test` skipped for riscv64 in CI (x86 runners only); Miri excluded on riscv64 | Source-only crate, arch-agnostic | Issue #22, open since 2022: miri coverage gap on riscv/wasm, not a functional bug |
| [tokio-rs/io-uring](https://github.com/tokio-rs/io-uring) v0.7.13 | Async I/O backend for Linux `io_uring` | Dedicated `src/sys/sys_riscv64.rs` bindings; clippy passes on riscv64gc in `check-tier2` | No functional test execution on riscv64 | Source-only crate, arch-agnostic | Issue #307 ("Support RISC-V?") closed after native bindings added |
| [tokio-rs/mio](https://github.com/tokio-rs/mio) v1.2.2 | Cross-platform I/O event loop | No explicit riscv64gc CI target; relies on generic Linux epoll/libc path | Not covered by any riscv64 CI target | Source-only crate, arch-agnostic | None found |
| [Amanieu/parking_lot](https://github.com/Amanieu/parking_lot) v0.12.5 (`hardware-lock-elision` enabled) | Mutex/RwLock | Builds; elision fast-path gated to x86/x86_64 only, safe no-op elsewhere | No riscv64 CI target; core logic is generic | Source-only crate, arch-agnostic | x86-only elision is a documented no-op elsewhere, not a blocker |
| [Frommi/miniz_oxide](https://github.com/Frommi/miniz_oxide) v0.9.1 (`simd`) + [mcountryman/simd-adler32](https://github.com/mcountryman/simd-adler32) | DEFLATE decompression for disk images | Builds on riscv64 (pure-Rust core); simd-adler32 dispatcher has no riscv64 path, falls back to scalar | No riscv64-specific test target | Source-only crates, arch-agnostic | SIMD gap is performance-only, correctness unaffected |
| [chronotope/chrono](https://github.com/chronotope/chrono), [bitflags/bitflags](https://github.com/bitflags/bitflags), [shepmaster/snafu](https://github.com/shepmaster/snafu), [zesterer/flume](https://github.com/zesterer/flume), [dzamlo/rust-bitfield](https://github.com/dzamlo/rust-bitfield) | Timestamps, bitflags, error handling, MPMC channels, bitfield macros | Pure, portable Rust, no `target_arch` gating in any of the five repos | No riscv64-specific gaps identified | Source-only crates, arch-agnostic | None found |
| [rust-random/getrandom](https://github.com/rust-random/getrandom) (transitive) | Randomness via `getrandom()` syscall | Arch-generic syscall wrapper | Syscall path is architecture-independent | Source-only crate, arch-agnostic | Only an unrelated libc-to-rustix porting issue found |

Every dependency with JIT/SIMD/numerics relevance (`parking_lot`, `miniz_oxide`, `simd-adler32`) degrades safely to a scalar or no-op fallback on riscv64 rather than failing to build; `zerocopy`'s gap is a Miri soundness-check coverage hole, not a runtime defect. None of these dependency-level items block building or running Alioth on riscv64 today. The only real blocker is Alioth's own source tree, which has never added a riscv64 CPU/board/hypervisor backend. None of Alioth's Cargo dependencies appear as separate entries in this project's `project-reports/scope.yml` tracking (they are Rust crates distinct from the C/C++ system libraries tracked elsewhere).

## 10. Ecosystem Status

Not applicable. Alioth is a standalone Rust hypervisor binary with no dependent plugin, package, or extension ecosystem that would separately require riscv64 enablement.

## 11. Known Bugs and Active Issues

The repository has 5 issues filed in its history (per a full `gh issue list --state all` fetch); none is RISC-V-related. [One earlier research pass in this session reported a total issue count of 2, listing only #454 and #415; this appears to be a stale or partial search. The more thorough, explicitly-enumerated fetch found 5 issues total and is treated as authoritative below.]

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#454](https://github.com/google/alioth/issues/454) | Error compiling for linux-musl | Closed | Build bug | `x86_64-unknown-linux-musl`, private-field `msghdr`/`cmsghdr` error. Not RISC-V. |
| [#415](https://github.com/google/alioth/issues/415) | `struct kvm_cpuid_entry2` from KVM_TDX_CAPABILITIES omits SIGNIFICANT_INDEX flag | Open | Correctness bug (labels: bug/KVM/TDX/tech_debt) | x86_64 Intel TDX-specific. Not RISC-V. |
| [#189](https://github.com/google/alioth/issues/189) | The instructions on the README are wrong | Status not independently reconfirmed | Docs | CLI flag documentation. Not RISC-V. |
| [#174](https://github.com/google/alioth/issues/174) | `search_pvh_note` should verify input `align` is a power of 2 | Status not independently reconfirmed | Correctness bug | Xen PVH loader. Not RISC-V. |
| [#15](https://github.com/google/alioth/issues/15) | Cannot compile for target x86_64-unknown-linux-musl | Closed | Build bug | ioctl macro type mismatch. Not RISC-V. |

No riscv64-specific bug, correctness issue, or performance report exists because no riscv64 code path exists to file a bug against. The 9 PRs surfaced by a naive "riscv"/"riscv64"/"risc-v" text search (#120, #169, #206, #207, #236, #257, #293, #385, #440) are exclusively Dependabot `libc`-crate version bumps whose auto-generated changelog bodies incidentally mention riscv64/RISC-V changes for other platforms (VxWorks, NetBSD, Musl syscall tables, an `EM_RISCV` ELF constant, a `max_align_t` definition, a `clone_args` backport). None touch Alioth's own architecture code, and #206 was closed unmerged. Confirmed by fetching and reading each PR's body and comments in full.

## 12. Objections and Upstream Blockers

**Stated objections:** none exist. RISC-V has never been raised as a topic in any issue, PR, commit message, README, or roadmap document, so there is no recorded objection to weigh.

**Technical blockers:** Alioth's hypervisor backend (`hv/kvm`) is hard-coded to x86_64 and aarch64 KVM ioctl paths. A riscv64 port would require: a `cpu`/`board` module set analogous to the existing amd64/arm64 ones; a KVM/riscv64-specific `hv/kvm` backend (upstream Linux KVM/RISC-V support exists since Linux 6.4, so the kernel-side prerequisite is met); a bootloader/firmware equivalent (no PVH/ACPI-DSDT-equivalent boot path currently exists for riscv64 in the project); and new CI targets. This is substantial net-new development, not a build-flag toggle.

**Organizational blockers:** Alioth is a single-maintainer (Changyuan Lyu / Google), explicitly-experimental, "NOT an officially supported Google product" project with no external contributor base, no governance process, and no RISE Project membership or affiliation (confirmed by fetching riseproject.dev directly: Alioth, or any hypervisor initiative, is absent from RISE's listed working groups and named partnerships). Google itself is listed as a RISE Premier member at the organizational level [NEEDS VERIFICATION, this reflects RISE's general public member list, not an Alioth-specific commitment], but no funding, runner, or work item connects RISE to Alioth specifically.

**Acceptance probability:** Given a single de facto maintainer with sole commit authority and no demonstrated demand, acceptance of a RISC-V PR would depend entirely on that maintainer's willingness to review and merge a large, net-new architecture backend with no existing test/CI infrastructure to validate it against. No evidence either supports or refutes willingness; the honest assessment is "untested, no signal in either direction."

## 13. Investment Analysis

RISE has funded no work touching Alioth (see Section 12); none of RISE's public blog posts, working-group repos, or board-farm/runner infrastructure references Alioth by name. There is nothing to net out against prior RISE investment; the sizing below is for work that would be entirely new.

### 13.1 Functional Enablement

Requires a riscv64 CPU/vCPU state module, a KVM/riscv64 `hv` backend (ioctl bindings and vCPU run-loop), board/device-model riscv64 wiring, a boot/firmware path (equivalent to the existing PVH-note and OVMF/ACPI work), and `bootloader/build.sh` support for a riscv64 kernel target. The aarch64/KVM port, a comparable net-new-architecture effort, took roughly one month of a single experienced maintainer's time (2024-06-17 to 2024-07-19, PRs #42-#80) and produced 1,393 lines of arch-specific code; a riscv64 port of similar scope, plus overhead for a contributor unfamiliar with the codebase, is estimated in the same order of magnitude.

### 13.2 Performance Optimization

Not yet applicable, there is no functional riscv64 backend to optimize. Once functional support exists, the only known optimization-relevant dependency gap is `simd-adler32`'s missing riscv64 SIMD dispatch path (falls back to scalar, correctness unaffected, only a compression-throughput delta), which is upstream work in a third-party crate, not Alioth-specific.

### 13.3 CI/CD Infrastructure

Requires adding a `riscv64gc-unknown-linux-gnu` (or similar) target to `rust.yml`, `bootloader.yml`, and `release.yml`, plus a runner. RISE's public RISC-V Runners fleet (Scaleway EM-RV1/EM-RV2, CloudV 10xE Pioneer and Jupiter boards) provides free native GitHub-hosted riscv64 CI that Alioth could adopt directly, since its workflows already use standard GitHub-hosted runner syntax. Actual hypervisor testing would additionally require a riscv64 host with KVM/RISC-V enabled in the kernel and hardware virtualization extensions present, a materially higher bar than typical compile/lint CI, and it is unconfirmed whether RISE's current board-farm hardware meets that bar. [NEEDS VERIFICATION]

### 13.4 Ecosystem Enablement

Not applicable (see Section 10).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | CPU/board/loader riscv64 modules (scope comparable to existing aarch64 port) | 4-6 | New contributor or Lencerf | Critical, prerequisite for everything else |
| Functional | KVM/riscv64 `hv` backend (ioctl bindings, vCPU run loop) | 3-5 | New contributor or Lencerf | Critical |
| Functional | Boot/firmware path (PVH-note or ACPI/DT equivalent for riscv64) | 2-3 | New contributor or Lencerf | High |
| CI/CD | Add riscv64gc target to rust.yml/bootloader.yml/release.yml; wire to a KVM-capable riscv64 runner | 1 | New contributor | High, blocked on Functional items landing first |
| Performance | Upstream `simd-adler32` riscv64 SIMD dispatch (third-party crate, not Alioth's own repo) | 0.5-1 | Third party / community | Low |
| Governance | Secure buy-in from sole maintainer (Lencerf) and confirm Google's stance on architecture expansion for an experimental project | n/a, soft blocker | Requester | Critical, gates any code being written |

## 14. Updates

(No updates yet, initial report dated 2026-06-17.)

## 15. References

- [google/alioth repository](https://github.com/google/alioth)
- [google/alioth README](https://github.com/google/alioth/blob/main/README.md)
- [google/alioth contributing guide](https://github.com/google/alioth/blob/main/docs/contributing.md)
- [google/alioth arch dispatch module, arch.rs](https://github.com/google/alioth/blob/main/alioth/src/arch/arch.rs)
- [google/alioth CI workflow, rust.yml](https://github.com/google/alioth/blob/main/.github/workflows/rust.yml)
- [google/alioth CI workflow, bootloader.yml](https://github.com/google/alioth/blob/main/.github/workflows/bootloader.yml)
- [google/alioth CI workflow, release.yml](https://github.com/google/alioth/blob/main/.github/workflows/release.yml)
- [google/alioth dependabot config](https://github.com/google/alioth/blob/main/.github/dependabot.yml)
- [google/alioth pull requests](https://github.com/google/alioth/pulls?q=is%3Apr)
- [google/alioth PR #42-#80 range, aarch64/KVM port](https://github.com/google/alioth/pulls?q=is%3Apr+is%3Amerged)
- [google/alioth PR #281, Apple Hypervisor Framework port](https://github.com/google/alioth/pull/281)
- [google/alioth PR #120, libc 0.2.155->0.2.156 bump](https://github.com/google/alioth/pull/120)
- [google/alioth PR #169, patches group bump](https://github.com/google/alioth/pull/169)
- [google/alioth PR #206, patches group bump (closed unmerged)](https://github.com/google/alioth/pull/206)
- [google/alioth PR #207, patches group bump](https://github.com/google/alioth/pull/207)
- [google/alioth PR #236, patches group bump](https://github.com/google/alioth/pull/236)
- [google/alioth PR #257, patches group bump](https://github.com/google/alioth/pull/257)
- [google/alioth PR #293, patches group bump](https://github.com/google/alioth/pull/293)
- [google/alioth PR #385, patches group bump](https://github.com/google/alioth/pull/385)
- [google/alioth PR #440, patches group bump](https://github.com/google/alioth/pull/440)
- [google/alioth issue #454, error compiling for linux-musl](https://github.com/google/alioth/issues/454)
- [google/alioth issue #415, kvm_cpuid_entry2 TDX flag omission](https://github.com/google/alioth/issues/415)
- [google/alioth issue #189, README instructions wrong](https://github.com/google/alioth/issues/189)
- [google/alioth issue #174, search_pvh_note alignment check](https://github.com/google/alioth/issues/174)
- [google/alioth issue #15, cannot compile for x86_64-unknown-linux-musl](https://github.com/google/alioth/issues/15)
- [google/alioth releases](https://github.com/google/alioth/releases)
- [rust-lang/libc repository](https://github.com/rust-lang/libc)
- [rust-lang/libc issue #4603, EM_RISCV const](https://github.com/rust-lang/libc/issues/4603)
- [rust-lang/libc issue #5379](https://github.com/rust-lang/libc/issues/5379)
- [rust-lang/libc PR #5029, max_align_t for riscv64](https://github.com/rust-lang/libc/pull/5029)
- [rust-lang/libc PR #4659, EM_RISCV](https://github.com/rust-lang/libc/pull/4659)
- [rust-lang/libc PR #3935, VxWorks riscv64 support](https://github.com/rust-lang/libc/pull/3935)
- [rust-lang/libc PR #3811, riscv64 clone_args backport](https://github.com/rust-lang/libc/pull/3811)
- [google/zerocopy repository](https://github.com/google/zerocopy)
- [google/zerocopy issue #22, cargo miri test on wasm/riscv](https://github.com/google/zerocopy/issues/22)
- [tokio-rs/io-uring repository](https://github.com/tokio-rs/io-uring)
- [tokio-rs/io-uring issue #307, Support RISC-V?](https://github.com/tokio-rs/io-uring/issues/307)
- [tokio-rs/mio repository](https://github.com/tokio-rs/mio)
- [Amanieu/parking_lot repository](https://github.com/Amanieu/parking_lot)
- [Frommi/miniz_oxide repository](https://github.com/Frommi/miniz_oxide)
- [mcountryman/simd-adler32 repository](https://github.com/mcountryman/simd-adler32)
- [chronotope/chrono repository](https://github.com/chronotope/chrono)
- [bitflags/bitflags repository](https://github.com/bitflags/bitflags)
- [shepmaster/snafu repository](https://github.com/shepmaster/snafu)
- [zesterer/flume repository](https://github.com/zesterer/flume)
- [dzamlo/rust-bitfield repository](https://github.com/dzamlo/rust-bitfield)
- [rust-random/getrandom repository](https://github.com/rust-random/getrandom)
- [PyPI package alioth (unrelated scanner tool)](https://pypi.org/pypi/alioth/json)
- [Ubuntu package search, noble, "alioth"](https://packages.ubuntu.com/search?keywords=alioth&suite=noble&searchon=names&section=all)
- [Debian package tracker, "alioth" (404)](https://tracker.debian.org/pkg/alioth)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Google Open Source Community Guidelines](https://opensource.google/conduct/)
