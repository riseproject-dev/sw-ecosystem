---
title: Hyperlight
parent: Project Reports
color: orange
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: libc (Rust crate)
    relation: build-dependency
    criticality: critical
  - name: cc
    relation: build-dependency
    criticality: critical
  - name: goblin
    relation: build-dependency
    criticality: critical
  - name: picolibc
    relation: build-dependency
    criticality: critical
  - name: vmm-sys-util
    relation: build-dependency
    criticality: critical
  - name: kvm-ioctls
    relation: runtime-dependency
    criticality: critical
  - name: kvm-bindings
    relation: runtime-dependency
    criticality: critical
  - name: seccompiler
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
---

# Hyperlight

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Hyperlight<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="hyperlight" %}

## 1. Project Overview

Hyperlight is a lightweight, Rust-based virtual machine monitor (VMM) for running untrusted code in micro-VMs, used as a security sandbox rather than a general-purpose hypervisor. It supports three host-side hypervisor backends: KVM (Linux), MSHV (Microsoft Hypervisor), and Windows Hypervisor Platform (WHP), per the project [README](https://github.com/hyperlight-dev/hyperlight). It is a **CNCF Sandbox project**, accepted 2026-03-04 (per its CNCF listing), licensed Apache-2.0. The first commit dates to 2024-01-30; the project originated inside Microsoft before its CNCF donation.

Governance is documented in `GOVERNANCE.md`: a **Maintainer Council** made up of all current maintainers, operating by lazy consensus with formal votes (simple majority for most actions, 2/3 for removing a maintainer or amending the charter) when needed. New maintainers are proposed on the CNCF Slack and approved by simple majority. The project adopts the CNCF Code of Conduct, maintains a Security Response Team, and holds weekly community meetings (Mondays 09:00 PT) with public notes on HackMD and a `#hyperlight` CNCF Slack channel.

**Corporate sponsors:** all 10 active maintainers listed in `MAINTAINERS.md` and 9 of 10 in `.github/CODEOWNERS` are Microsoft employees (GitHub profile "company" field and/or `@microsoft.com` commit emails spot-checked for @danbugs, @squillace, @andreiltd, @ludfjig, @marosset). Despite CNCF Sandbox status, governance is effectively single-vendor. Top code-contribution volumes are dominated by the same Microsoft roster (Liljenberg 186, Davies 166, Menon 140, Blanzeanu 73, Chiarlone 68/34, Sturtevant 55, Prendes 41, Andrzejak 15, excluding Dependabot/Copilot commits).

**Community culture on new ports:** the project requires any new capability to start as a Proposal issue (a "Hyperlight Improvement Proposal", HIP) per `CONTRIBUTING.md`, reviewed by the maintainer group described above. Maintainer @devigned (Microsoft) set explicit architecture priority in [issue #63](https://github.com/hyperlight-dev/hyperlight/issues/63) (2025-03-12): "we will prioritize Arm first, then prioritize others as demand and time allow. The project would welcome and support anyone interested in contributing support for additional architectures." This framed RISC-V as contribution-dependent from the outset, not on the maintainers' own roadmap.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-11-16 | Issue #63 opened asking whether RISC-V is on the architecture roadmap | [Issue #63](https://github.com/hyperlight-dev/hyperlight/issues/63) |
| 2024-11-19 | Maintainer @devigned replies: RISC-V/zkVMs "not part of our current roadmap" for the next ~6 months (focus: Wasm component model, performance, DX) | [Issue #63](https://github.com/hyperlight-dev/hyperlight/issues/63) |
| 2025-03-05 | Issue #328 "hyperlight on RISC-V" opened by @RuoqingHe (ISCAS), volunteering to draft a roadmap and lead the port | [Issue #328](https://github.com/hyperlight-dev/hyperlight/issues/328) |
| 2025-03-12 | Issue #63 closed with maintainer statement: "we will prioritize Arm first, then prioritize others as demand and time allow" | [Issue #63](https://github.com/hyperlight-dev/hyperlight/issues/63) |
| 2025-03-05 to present (2026-09-10) | Issue #328 remains open, milestone "Parked", 0 comments, 0 linked PRs, 0 commits | [Issue #328](https://github.com/hyperlight-dev/hyperlight/issues/328) |

**Key contributors:** @RuoqingHe (Institute of Software, Chinese Academy of Sciences), who states he also works on riscv64 enablement in rust-vmm, cloud-hypervisor, and kata-containers. He opened the only RISC-V tracking issue but never posted the promised roadmap, and no maintainer ever replied to it.

**Is it fully upstream?** No. Zero RISC-V code has ever been merged into `hyperlight-dev/hyperlight`. `git log --all --grep` for "riscv"/"risc-v" across the full commit history returns 0 matches, and a repo-wide case-insensitive grep of the current tree (HEAD `570cf7d5e946827eb43797981fa5b6ab8d2f3ba7`) returns 0 matches. The only historical trace of the string "riscv" in the tree came from a squashed vendor import of musl libc (commit `667589ab`, 2024-12-19) that incidentally carried musl's generic `arch/riscv32`/`arch/riscv64` header directories along with every other architecture musl supports; this was never wired into Hyperlight's build or hypervisor code, and the entire musl tree was later deleted when the guest libc was replaced with picolibc (PR #831, merged 2026-04-21, consolidated by PR #1437, merged 2026-05-06).

## 3. Upstream Support Tier

No formal tier policy document (e.g. `PLATFORMS.md`) exists in the repository. The de facto tier is visible from CI and release behavior:

| Signal | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes (`DailyArm64.yml`, `dep_build_test.yml`) | No (0 riscv mentions in any of 28 workflow files) |
| CI tests pass | Yes | Partially - daily aarch64 CI failures auto-filed (e.g. [#1810](https://github.com/hyperlight-dev/hyperlight/issues/1810), open as of 2026-09-09) | N/A - no CI exists |
| Release-blocking | Yes | Yes (part of standard PR checks) | N/A |
| Official binaries shipped | Yes - x86_64 KVM/MSHV3/Hyper-V benchmark and guest-API tarballs in v0.16.0/v0.17.0/dev-latest releases | **No** - release asset audit of v0.16.0, v0.17.0, and dev-latest found zero aarch64 assets; every shipped binary targets x86_64 (AMD/Intel) only | No |
| Feature parity target | Reference architecture | Explicit open tracking issue toward v1.0.0 ([#1602 "aarch64 feature parity"](https://github.com/hyperlight-dev/hyperlight/issues/1602), 4 open sub-issues: gdb, crashdump, trace_guest, hw-interrupts) | Not tracked; no milestone exists |

Even aarch64, which maintainers explicitly prioritized ahead of all other architectures, did not land compilation support until PR #1285 ("feat: enable hyperlight-host compilation for aarch64", March 2026) - roughly 18 months after project start - and is still not at feature parity with x86_64 as of 2026-09-10. This is the direct evidentiary basis for the "Arm first, others as demand and time allow" statement translating into zero riscv64 progress.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Hyperlight has architecture-specific Rust code in four areas: guest low-level bring-up (exceptions, paging, dispatch), guest exit/layout/allocator plumbing, a shared common ABI layer (page tables, VM-exit layout), and host-side hypervisor register/VM plumbing. All are implemented only for `x86_64` and `aarch64`; there is no `riscv64` sibling anywhere.

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| `hyperlight_guest_bin/src/arch/*` (guest init, exceptions, paging, dispatch) | 10 files, 1203 lines | 7 files, 650 lines | 0 files, 0 lines |
| `hyperlight_guest/src/arch/*` (exit, layout, prim_alloc) | 3 files, 114 lines | 3 files, 77 lines | 0 files, 0 lines |
| `hyperlight_common/src/arch/*` (layout, vmem - page-table/VM-exit ABI) | 2 files, 1075 lines | 3 files, 639 lines | 0 files, 0 lines |
| `hyperlight_host/src/hypervisor/virtual_machine/*` (host register/VM plumbing) | `x86_64/` subdir plus `kvm`, `mshv` backends | `hvf/`, `kvm/aarch64.rs`, `regs/aarch64/` | none |
| Toolchain target (`rust-toolchain.toml`) | `x86_64-unknown-none`, `x86_64-unknown-linux-musl` | (aarch64 guest target enabled via PR #1285) | not listed; no riscv64gc target installed |
| `flake.nix` `targetPlatforms` | `x86_64-linux` | `aarch64-linux`, `aarch64-darwin` | not listed |

There is no "stub" to grade as partial or scalar-fallback - this would require at least placeholder files, `todo!()`/`unimplemented!()` bodies, or arch-guarded branches that compile-fail cleanly for riscv64. None of that exists; riscv64 is simply absent from the source tree, confirmed by exhaustive grep (`grep -ril "riscv" .`, `find . -iname "*riscv*"`) returning zero results, cross-checked against GitHub code search (which correctly finds riscv hits in the sibling `hyperlight-dev/picolibc-bsd` repo, confirming the indexer is not the cause of the zero result).

This is not classified as an optimization-purpose project for the purposes of Step 2 grading (see Section 13): Hyperlight's value proposition is VM-based isolation/sandboxing of untrusted code, not out-performing a reference implementation via architecture-specific hot-path optimization. No SIMD, JIT, or hand-tuned numeric kernels exist in the project; the architecture-specific code found is hypervisor/ABI plumbing (paging, VM-exit layout, register access), required for the platform to function at all rather than to make it faster.

## 5. Build System, Cross-Compilation, and Toolchain

Hyperlight is a pure Rust project. There is no CMake build system, no `CMakeLists.txt`, no `cmake/` directory, no `BUILDING.md`, `INSTALL` file, or `docs/building.md`/`docs/cross-compilation.md` anywhere in the repository. Build tooling consists of `Cargo.toml`/`Cargo.lock`, a `Justfile` (task runner), `Cross.toml` (for the `cross` cross-compilation tool), `flake.nix`/`flake.lock` (Nix dev shell), and `rust-toolchain.toml`.

The `Justfile` hard-codes the supported set:
```
hyperlight-target-arch := env("HYPERLIGHT_TARGET", arch())
hyperlight-target := if hyperlight-target-arch == "x86_64" { "x86_64-hyperlight-none" }
    else if hyperlight-target-arch == "aarch64" { "aarch64-hyperlight-none" }
    else { error("Unsupported architecture: " + arch()) }
```
Any architecture other than x86_64/aarch64, including riscv64, hits this explicit `error("Unsupported architecture: ...")` at build-script evaluation time - there is no partial or degraded riscv64 build path to attempt.

No riscv64 toolchain files, Dockerfiles, or CI jobs exist: no `cmake/riscv64.cmake` (no `cmake/` directory at all), a GitHub code search for `riscv64 repo:hyperlight-dev/hyperlight filename:Dockerfile` returned 0 results, and there is no top-level `docker/` or `.ci/` directory. No QEMU usage is documented anywhere; the project's dev/test flow runs directly on KVM/MSHV/WHP hardware (per `docs/getting-started.md`, which requires `/dev/kvm` or `/dev/mshv`), not a generic cross-compiled userspace binary.

**Known build failures:** none to report, because riscv64 has never been attempted as a build target - there is no failing build log, only the immediate `error("Unsupported architecture")` guard.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Guest execution (compile/run untrusted code in a micro-VM) | Yes | Yes | Not possible - no build target exists |
| KVM host backend | Yes | Yes | Not wired up in Hyperlight (dependency crates kvm-ioctls/kvm-bindings have upstream riscv64 support, but Hyperlight never invokes it - see Section 9) |
| MSHV host backend (default feature) | Yes | [NEEDS VERIFICATION - not directly confirmed for aarch64 in findings] | No - MSHV is tied to Microsoft's Hyper-V stack; no riscv64 roadmap found for `mshv-bindings`/`mshv-ioctls` |
| gdb debugging (`gdb` feature) | Yes | Yes | Not applicable - no guest arch exists; upstream `gdbstub_arch` has riscv64 target definitions, but Hyperlight's own `gdb` feature is only wired for its existing guest arches |
| crashdump (`crashdump` feature) | Yes | Open gap - [#1614 "aarch64 crashdump support"](https://github.com/hyperlight-dev/hyperlight/issues/1614) | Not applicable |
| Official release binaries | Yes | **No** (verified absent from v0.16.0/v0.17.0/dev-latest release assets) | No |

**Functional gaps:** the entire riscv64 architecture is absent - there is no guest bring-up code, no host hypervisor backend, and no build target, so "can Hyperlight run untrusted code on riscv64" is answered no in full, not partially.

**Performance gaps:** not applicable - there is no functioning riscv64 build to benchmark. No quantitative Hyperlight riscv64-vs-arm64/amd64 performance data exists in any source checked (GitHub issues/PRs, WebSearch, the RISE blog). Existing performance claims ("VM creation in one to two milliseconds", guest calls in microseconds, per the [Microsoft OSS blog post](https://opensource.microsoft.com/blog/2024/11/07/introducing-hyperlight-virtual-machine-based-security-for-functions-at-scale/)) are architecture-general x86_64/aarch64 figures with no RISC-V breakdown.

**Security hardening gaps:** Data not available: no riscv64-specific security/hardening analysis was found or is possible to conduct, since no port exists to evaluate.

**NaN / floating-point semantics:** Data not available: no floating-point or NaN-semantics research was found for this project; Hyperlight's architecture-specific code is hypervisor/paging/ABI plumbing, not a numerics library, and this was not an area of any finding.

## 7. CI/CD Infrastructure

**No riscv64 CI exists**, confirmed by direct inspection rather than issue-text inference:
- `grep -rniH "riscv" *.yml` across all 28 files in `.github/workflows/` (CargoAudit.yml, CargoPublish.yml, Coverage.yml, CreateDevcontainerImage.yml, CreateRelease.yml, CreateReleaseBranch.yml, DailyArm64.yml, DailyBenchmarks.yml, Fuzzing.yml, IssueLabelChecker.yml, PRLabelChecker.yml, PrimeCaches.yml, RegenSnapshotGoldens.yml, ReleaseBlockerCheck.yml, ReleaseBlockerLabelCleanUp.yml, RustNightly.yml, ValidatePullRequest.yml, auto-merge-dependabot.yml, copilot-setup-steps.yml, dep_benchmarks.yml, dep_build_guests.yml, dep_build_test.yml, dep_code_checks.yml, dep_fuzzing.yml, dep_run_examples.yml, dep_update_guest_locks.yml, ready-for-review-label.yml, ready-for-review-manage.yml) returns 0 matches.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.circleci/` exist in the repo root.
- No workflow filename contains `riscv` or `rv64`.

**RISE runners:** none - no reference to `riseproject-dev` or a RISE runner label exists anywhere in the CI configuration, and Hyperlight is confirmed not to be a RISE member project (see Section 12).

**Hardware used for riscv64:** N/A - no CI job targets riscv64 in any form (native, QEMU-emulated, or cloud VM).

| CI dimension | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Build job exists | Yes | Yes (`DailyArm64.yml`) | No |
| Tests run in CI | Yes | Yes, but with recurring daily failures ([#1810](https://github.com/hyperlight-dev/hyperlight/issues/1810)) | No |
| Benchmarks | Currently disabled repo-wide to reduce CI load ([#1596](https://github.com/hyperlight-dev/hyperlight/issues/1596), open) | Currently disabled (same issue) | No infrastructure exists |
| Release-blocking | Yes | Yes | N/A |

## 8. Distribution and Release Status

**No official riscv64 binaries exist for Hyperlight**, verified across every channel checked:

- **GitHub Releases** (v0.16.0, v0.17.0, dev-latest): asset lists checked via the `expanded_assets` endpoint. All 10 assets per release (`benchmarks_Linux_kvm_amd.tar.gz`, `benchmarks_Linux_kvm_intel.tar.gz`, `benchmarks_Linux_mshv3_amd.tar.gz`, `benchmarks_Linux_mshv3_intel.tar.gz`, `benchmarks_Windows_hyperv-ws2025_amd.tar.gz`, `benchmarks_Windows_hyperv-ws2025_intel.tar.gz`, `hyperlight-guest-c-api-linux.tar.gz`, `include.tar.gz`, plus source zip/tar.gz) target **x86_64 (AMD/Intel) only** - no aarch64 and no riscv64 assets in any release checked. See [v0.17.0 releases](https://github.com/hyperlight-dev/hyperlight/releases).
- **PyPI**: `https://pypi.org/pypi/hyperlight/json` returns a package named `hyperlight`, but it is an unrelated PyTorch hypernetwork library (2 files, version 0.0.5, pure `py3-none-any` wheel + sdist) - a namespace collision, not `hyperlight-dev/hyperlight`. No riscv64 relevance either way.
- **RISE Python wheel builder**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/hyperlight/` 302-redirects to PyPI, confirming no dedicated RISE package exists.
- **Ubuntu 26.04 (Resolute)**: `packages.ubuntu.com` search for `hyperlight` returns "Sorry, your search gave no results" - no package for any architecture, let alone riscv64.
- **Arch Linux RISC-V port** (`archriscv.felixc.at`): no matching package found.

**What a user must do today to get a working riscv64 Hyperlight binary:** there is none available, and none can be built - the `Justfile` explicitly errors out on any architecture other than x86_64/aarch64. A user would need to implement the full architecture port described in Section 4 (guest arch directory, common ABI layer, host hypervisor backend) before any binary could exist.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Rust | Build-dependency, critical (language/toolchain) | Hyperlight's own `rust-toolchain.toml` lists only `x86_64-unknown-none` and `x86_64-unknown-linux-musl` guest targets; no riscv64gc target is installed for this project's toolchain, though the broader rust-vmm ecosystem (kvm-ioctls, kvm-bindings) does compile for riscv64 upstream | N/A - not exercised by Hyperlight | N/A | Toolchain gap is project-configuration, not a language-level riscv64 limitation |
| libc (Rust crate) | Build-dependency, critical | Dependabot-bumped repeatedly (PRs [#1358](https://github.com/hyperlight-dev/hyperlight/pull/1358), [#1160](https://github.com/hyperlight-dev/hyperlight/pull/1160), [#1146](https://github.com/hyperlight-dev/hyperlight/pull/1146), [#910](https://github.com/hyperlight-dev/hyperlight/pull/910), [#628](https://github.com/hyperlight-dev/hyperlight/pull/628), [#420](https://github.com/hyperlight-dev/hyperlight/pull/420), [#119](https://github.com/hyperlight-dev/hyperlight/pull/119), [#83](https://github.com/hyperlight-dev/hyperlight/pull/83)); changelogs quoted in these PR bodies reference RISC-V ELF constant/relocation additions in the crate itself, not in Hyperlight | Not independently verified | Not independently verified | No riscv issues found in any of these bump PRs relating to Hyperlight's own usage |
| cc | Build-dependency, critical | Dependabot-bumped ([#1716](https://github.com/hyperlight-dev/hyperlight/pull/1716), [#1176](https://github.com/hyperlight-dev/hyperlight/pull/1176)); changelog text quoted in PR bodies references RISC-V additions in the crate | Not independently verified | Not independently verified | Purely a build-time C-compiler-invocation helper; not itself invoked for a riscv64 target in Hyperlight since no such target exists |
| goblin | Build-dependency, critical (ELF32/ELF64 parser for guest binaries) | Yes - pure-Rust binary-format parser, no arch-conditional code required to compile on riscv64 | Yes (architecture-agnostic parsing logic) | Yes (crates.io) | 0 riscv issues found in `m4b/goblin`; also Dependabot-bumped ([#1233](https://github.com/hyperlight-dev/hyperlight/pull/1233)) with RISC-V-relevant changelog text (unrelated to Hyperlight usage) |
| picolibc | Build-dependency, critical (guest C library, replaced musl via PR #831, merged 2026-04-21, consolidated by PR #1437, merged 2026-05-06) | The `hyperlight-dev/picolibc-bsd` fork used by the project does contain riscv code (`libc/machine/riscv/`, `libm/machine/riscv/`, a `run-riscv` script) | Not independently verified for Hyperlight's usage | Not wired into Hyperlight's own build (no riscv64 guest target exists to link it against) | This is the one dependency with the most existing riscv64-relevant code, but it is inert for Hyperlight until a riscv64 guest arch is added |
| vmm-sys-util | Build-dependency, critical (host-side eventfd/terminal/tempfile helpers, shared with kvm-ioctls) | Yes - wraps generic Linux syscalls, no arch-specific code path | Yes (no arch branching) | Yes | 0 riscv issues found; consistent with it already being a riscv64-path dependency in cloud-hypervisor/rust-vmm per the ISCAS contributor's note in [issue #328](https://github.com/hyperlight-dev/hyperlight/issues/328); Dependabot-bumped in [#523](https://github.com/hyperlight-dev/hyperlight/pull/523) |
| kvm-ioctls | Runtime-dependency, critical (Linux KVM hypervisor backend, `kvm` feature, in `default` features) | Yes - `#[cfg(any(target_arch="aarch64", target_arch="riscv64"))]` present throughout `ioctls/{vm,vcpu,device}.rs` in the pinned 0.25.0 source | No - not in upstream CI matrix; the repo ships only `coverage_config_{x86_64,aarch64}.json`, no riscv64 coverage config | Yes - present in pinned 0.25.0 release | Added via closed `rust-vmm/kvm-bindings#80` "Experimental riscv64 support"; that PR's own checklist notes cross-compile CI is not yet rust-vmm-ci-aware. Dependabot activity in Hyperlight: [#15](https://github.com/hyperlight-dev/hyperlight/pull/15) (closed unmerged) |
| kvm-bindings | Runtime-dependency, critical (raw KVM ioctl/struct FFI bindings) | Yes - `kvm-bindings/src/riscv64/bindings.rs` present (`KVM_REG_RISCV_*`, `RISCV_MAX_VLENB`, etc.), matching the pinned 0.14.1 version | Same CI gap as kvm-ioctls | Yes - present in pinned release | Same source PR (`rust-vmm/kvm-bindings#80`) as kvm-ioctls. Dependabot activity: [#12](https://github.com/hyperlight-dev/hyperlight/pull/12) (closed unmerged) |
| seccompiler | Runtime-dependency, critical (syscall filtering) | Data not available: no dedicated riscv64 research was found for this crate beyond its Dependabot bump ([#339](https://github.com/hyperlight-dev/hyperlight/pull/339), 0.4.0 to 0.5.0), whose PR body does not mention riscv64 | Data not available | Data not available | No riscv issues found or searched specifically for this crate; flagged as a follow-up item |
| Linux kernel | Runtime-dependency, critical (provides `/dev/kvm`, KVM ioctl surface) | Not directly verified; the existence of `KVM_REG_RISCV_*` constants in kvm-bindings 0.14.1 implies upstream Linux KVM riscv64 (H-extension) support exists, generated from kernel headers per `rust-vmm/kvm-bindings#80` | Data not available: kernel version/maturity of riscv64 KVM was not independently verified in this research | N/A | This is the deepest dependency in the chain and the least directly verified; recommend a dedicated follow-up on Linux KVM riscv64 (H-extension) maturity before relying on this path |

**Additional indirect dependencies found via research (not in the direct-dependency list but relevant to the runtime-dependency graph):**

| Dependency | Role | riscv64 status |
|---|---|---|
| mshv-bindings / mshv-ioctls (`rust-vmm/mshv`) | Host-side MSHV/Hyper-V backend, `mshv3` feature, in `default` features | No riscv64 work found; MSHV is tied to Microsoft's Hyper-V stack (x86_64/aarch64 only), no public riscv64 roadmap. This is a real gap for the `mshv3` default feature on riscv64 even after any future KVM-path parity is reached - Hyperlight would need to make `mshv3` non-default or gate it out on riscv64 |
| BLAKE3 1.8.5 | Crypto hash (snapshot/blob hashing) | Builds and runs via the portable scalar path; functionally tested on real RISC-V hardware (Orange Pi RV2, RVA22) per open [BLAKE3-team/BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484) "Improved RISC-V support + SIMD" - correct but slow (~68 MB/s vs multi-GB/s with AVX2/NEON) because no RVV SIMD backend exists yet. Performance-only gap, not a correctness blocker |
| sha2 0.11 (RustCrypto/hashes) | Crypto hash (OCI image digest verification) | Builds via pure-Rust `soft` fallback, functional, released. Closed `RustCrypto/hashes#328` covers riscv32 (not riscv64) compress-function performance, non-blocking |
| goblin (see above) | - | - |
| FlatBuffers 25.12.19 | Guest/host message serialization | Not independently re-verified in this research pass; tracked separately in the project registry (`project-reports/flatbuffers.md`) |
| elfcore 2.0.2 | Optional (`crashdump` feature, not default) - ELF core dumps on host crash | Not verified; likely has per-architecture register/note-section handling (`NT_PRSTATUS` etc.) that may lack a riscv64 arm - flagged for follow-up |
| gdbstub 0.7.10 / gdbstub_arch 0.3.3 | Optional (`gdb` feature) - guest debugging | `gdbstub_arch` has riscv64 target definitions upstream, but Hyperlight's own `gdb` feature is wired only for its existing supported guest arches (x86_64/aarch64) |
| oci-spec 0.10 | OCI image manifest/config parsing | Pure-Rust JSON/spec crate, arch-agnostic; no riscv issues expected or found; not independently searched (assessed as low risk) |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#328](https://github.com/hyperlight-dev/hyperlight/issues/328) | hyperlight on RISC-V | Open, milestone "Parked" | N/A - tracking/proposal, not a bug | 0 comments, 0 linked PRs, opened 2025-03-05, never progressed past the initial proposal |
| [#63](https://github.com/hyperlight-dev/hyperlight/issues/63) | Arch roadmap | Closed (`lifecycle/fixed`) | N/A | Origin of the "Arm first, others as demand and time allow" priority statement (2025-03-12) |
| [#1602](https://github.com/hyperlight-dev/hyperlight/issues/1602) | aarch64 feature parity | Open, targeting v1.0.0 | Medium (context, not RISC-V-specific) | 4 open sub-issues: #1613 gdb, #1614 crashdump, #1615 trace_guest, #1616 hw-interrupts |
| [#1810](https://github.com/hyperlight-dev/hyperlight/issues/1810) | Daily aarch64 Failure - 71 | Open (as of 2026-09-09) | Medium (context) | Auto-filed daily CI failure tracker for aarch64, illustrating instability even in the second-tier architecture |
| [#1596](https://github.com/hyperlight-dev/hyperlight/issues/1596) | Resume fuzzing on arm64 (and benchmarks) | Open | Low (context) | Benchmarking/fuzzing currently disabled repo-wide to reduce CI runner load - no benchmark infrastructure exists for any secondary architecture, let alone riscv64 |

**Correctness bugs:** none riscv64-specific exist, because no riscv64 port exists to contain bugs. There is no confirmed-broken state (which would warrant red); the state is complete absence of implementation.

## 12. Objections and Upstream Blockers

**Stated objections:** none explicit against RISC-V as a concept. Maintainer @devigned's position (issue #63, 2025-03-12) is prioritization, not refusal: "the project would welcome and support anyone interested in contributing support for additional architectures", with Arm placed first and other architectures handled "as demand and time allow."

**Technical blockers:**
- No riscv64 guest architecture directory, no host hypervisor backend, and no riscv64gc toolchain target configured (Section 4-5).
- The `mshv3` default feature has no riscv64 path at all in its upstream crate (`rust-vmm/mshv`), meaning even a hypothetical KVM-only riscv64 port would need to gate `mshv3` out of the default feature set on that architecture.
- `kvm-ioctls`/`kvm-bindings` riscv64 support upstream is itself unverified by CI (no riscv64 coverage config in the pinned crate versions), so even the one dependency that is closest to riscv64-ready is not battle-tested by its own maintainers.

**Organizational blockers:**
- Governance and code-review bandwidth are concentrated in a single company's engineers (all 10 maintainers are Microsoft employees, Section 1).
- Given that aarch64 - the explicitly prioritized second architecture - took roughly 18 months to reach initial compilation support (PR #1285) and remains incomplete toward v1.0.0 feature parity as of 2026-09-10, riscv64 work would realistically be deprioritized behind finishing aarch64 parity.
- The volunteer who offered to drive the RISC-V port (@RuoqingHe, issue #328) never followed up with the promised roadmap; no other contributor has stepped in.

**Acceptance probability:** the project has stated it would welcome external contributions for new architectures (issue #63), and `CONTRIBUTING.md`'s Proposal-issue (HIP) process provides a defined path. However, with zero roadmap content ever posted to the only tracking issue, zero maintainer engagement on it since April 2025, and the maintainer group's stated priority ordering putting RISC-V behind Arm (which is itself not yet at parity), a RISC-V port has close to zero probability of being maintainer-initiated in the near term. It would need to arrive as a substantially complete, externally-contributed HIP to have a realistic path to acceptance.

## 13. Readiness Assessment

- **Color:** orange (base "no upstream CI" case - no upstream riscv64 CI of any kind, and no Linux distribution ships a riscv64 package for Hyperlight to apply a distribution floor from; not an optimization-purpose project, so no Step 2 modifier applies)
- **Release provider:** none - no upstream, distro, RISE, or third-party channel publishes a riscv64 Hyperlight artifact
- **Optimization gap:** N/A - Hyperlight is not an optimization-purpose project under the skill's test. Its value proposition is VM-based sandboxing/isolation, which it would still deliver on RISC-V with only generic scalar code (once a port existed); the skill explicitly lists sandboxes as a category that does not trigger the Step 2 modifier.
- **Justification:** Confirmed by direct inspection that upstream CI has zero riscv64 jobs across all 28 GitHub Actions workflow files, that the codebase contains zero riscv64 architecture code (only `amd64` and `aarch64` exist under `hyperlight_guest_bin/src/arch`, `hyperlight_common/src/arch`, `hyperlight_guest/src/arch`), and that no GitHub release (v0.16.0, v0.17.0, dev-latest) ships a riscv64 (or even aarch64) binary asset. See [.github/workflows/](https://github.com/hyperlight-dev/hyperlight/tree/main/.github/workflows) and [GitHub Releases](https://github.com/hyperlight-dev/hyperlight/releases). No Linux distribution packages Hyperlight for any architecture (Ubuntu 26.04 Resolute search returns no results), so the distribution floor (which would otherwise upgrade an unpatched clean-source build to yellow) does not apply - there is no package to apply it from.
- **Pending work that could change the grade:** [issue #328](https://github.com/hyperlight-dev/hyperlight/issues/328) remains open with an ISCAS contributor's standing offer to lead a port, but it carries the "Parked" milestone (defined by the project itself as "not currently under active development, and there are no plans for core maintainers to work on it in the foreseeable future") and has had zero comments and zero linked PRs since 2025-03-05. There is no RISE involvement with Hyperlight found in any channel checked (RISE blog, RISE member list, RISE wheel builder, `riseproject-dev` GitHub org). Absent a concrete, externally-driven HIP with actual code, this grade is not expected to change in the near term.

## 14. Investment Analysis

RISE has done no work on Hyperlight and has funded none (Section 12; no RISE blog post, wheel-builder entry, or `riseproject-dev` repository references Hyperlight). All work items below are therefore fully in scope; nothing is already covered.

### 14.1 Functional Enablement

A functional riscv64 port requires, at minimum: a `hyperlight_guest_bin/src/arch/riscv64` module (exception handling, paging, dispatch - comparable in scope to the existing 650-1203 lines per architecture), a `hyperlight_guest/src/arch/riscv64` module (exit/layout/allocator, ~77-114 lines per existing architecture), a `hyperlight_common/src/arch/riscv64` module (shared ABI/VM-exit layout, 639-1075 lines per existing architecture), and a `hyperlight_host/src/hypervisor` riscv64 KVM backend (register access, VM-exit handling - no existing line-count reference since no riscv64 backend of any kind exists to measure against; the aarch64 equivalent spans `hvf/`, `kvm/aarch64.rs`, and `regs/aarch64/`). The `mshv3` default feature would need to be gated out for riscv64 builds since its upstream crate has no riscv64 path. Toolchain configuration (`rust-toolchain.toml`, `Justfile`, `flake.nix`) needs riscv64gc target entries added, and the `Justfile`'s hard `error("Unsupported architecture")` guard needs a riscv64 branch.

### 14.2 Performance Optimization

Not applicable at this stage - there is no functional riscv64 build to optimize. Once functional enablement lands, BLAKE3's RVV SIMD gap (currently ~68 MB/s scalar-only per [BLAKE3-team/BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484)) would be the first dependency-level performance item to revisit, though it is not a correctness blocker.

### 14.3 CI/CD Infrastructure

A riscv64 CI job needs to be added to the existing workflow set (e.g. alongside `DailyArm64.yml`), including a riscv64 coverage config (matching the pattern of the absent `coverage_config_riscv64.json` that would parallel the existing `coverage_config_{x86_64,aarch64}.json`). This depends on functional enablement existing first, and on riscv64 hardware or CI runner access - RISE-provided runners are a plausible source given RISE's stated Kernel & Virtualization working group, but no such arrangement exists today for this project (Section 12).

### 14.4 Ecosystem Enablement

Not applicable - Hyperlight has no significant dependent package ecosystem (no PyPI/npm/Maven consumers depend on architecture-specific Hyperlight builds); Section 10 is omitted per the report's scope rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Guest low-level arch module (`hyperlight_guest_bin`, `hyperlight_guest`, `hyperlight_common` riscv64 equivalents of the existing amd64/aarch64 code) | 6-10 | Upstream maintainer or contributor familiar with rust-vmm riscv64 work (e.g. the issue #328 volunteer) | Critical |
| Functional | Host-side KVM riscv64 hypervisor backend in `hyperlight_host` | 4-8 | Same as above, coordinated with rust-vmm/kvm-ioctls riscv64 maturity | Critical |
| Functional | Toolchain/build wiring (`rust-toolchain.toml`, `Justfile`, `flake.nix`, `Cross.toml`) | 1-2 | Upstream maintainer | Critical |
| Functional | Gate `mshv3` default feature off riscv64 builds | 0.5-1 | Upstream maintainer | High |
| CI/CD | Add riscv64 CI job, coverage config, and (if available) RISE-provided runner access | 2-3 | Upstream maintainer with RISE liaison | High |
| Performance | Re-evaluate BLAKE3 RVV SIMD status once functional build exists | 1-2 (tracking/dependency-only, not Hyperlight code) | Dependency maintainers (BLAKE3-team) | Medium |
| Process | Submit and shepherd a HIP per `CONTRIBUTING.md`, given no maintainer bandwidth is currently allocated | 1 (process overhead, ongoing) | Contributing organization | Critical (gating item for all of the above) |

All effort estimates are engineering judgment based on the line-count and file-count comparisons in Section 4 (aarch64 required roughly 2,000+ lines of hand-written architecture-specific Rust across guest and host layers) and are not sourced from any Hyperlight-specific riscv64 estimate, since none exists.

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [hyperlight-dev/hyperlight repository](https://github.com/hyperlight-dev/hyperlight)
- [Issue #328 - hyperlight on RISC-V](https://github.com/hyperlight-dev/hyperlight/issues/328)
- [Issue #63 - Arch roadmap](https://github.com/hyperlight-dev/hyperlight/issues/63)
- [Issue #1602 - aarch64 feature parity](https://github.com/hyperlight-dev/hyperlight/issues/1602)
- [Issue #1613 - aarch64 gdb support](https://github.com/hyperlight-dev/hyperlight/issues/1613) (referenced as sub-issue of #1602)
- [Issue #1614 - aarch64 crashdump support](https://github.com/hyperlight-dev/hyperlight/issues/1614)
- [Issue #1615 - aarch64 trace_guest support](https://github.com/hyperlight-dev/hyperlight/issues/1615) (referenced as sub-issue of #1602)
- [Issue #1616 - aarch64 hw-interrupts feature support](https://github.com/hyperlight-dev/hyperlight/issues/1616)
- [Issue #1810 - Daily aarch64 Failure - 71](https://github.com/hyperlight-dev/hyperlight/issues/1810)
- [Issue #1596 - Resume fuzzing on arm64 (and benchmarks)](https://github.com/hyperlight-dev/hyperlight/issues/1596)
- [PR #1716 - chore(deps): bump cc from 1.4.0 to 1.4.2](https://github.com/hyperlight-dev/hyperlight/pull/1716)
- [PR #1358 - chore(deps): bump libc from 0.2.183 to 0.2.184](https://github.com/hyperlight-dev/hyperlight/pull/1358)
- [PR #1233 - Bump goblin from 0.10.4 to 0.10.5](https://github.com/hyperlight-dev/hyperlight/pull/1233)
- [PR #1176 - Bump cc from 1.2.52 to 1.2.53](https://github.com/hyperlight-dev/hyperlight/pull/1176)
- [PR #1160 - Bump libc from 0.2.179 to 0.2.180](https://github.com/hyperlight-dev/hyperlight/pull/1160)
- [PR #1146 - Bump libc from 0.2.178 to 0.2.179](https://github.com/hyperlight-dev/hyperlight/pull/1146)
- [PR #910 - Bump libc from 0.2.175 to 0.2.176](https://github.com/hyperlight-dev/hyperlight/pull/910)
- [PR #628 - Bump libc from 0.2.172 to 0.2.173](https://github.com/hyperlight-dev/hyperlight/pull/628)
- [PR #523 - Bump vmm-sys-util from 0.13.0 to 0.14.0](https://github.com/hyperlight-dev/hyperlight/pull/523)
- [PR #420 - Bump libc from 0.2.171 to 0.2.172](https://github.com/hyperlight-dev/hyperlight/pull/420)
- [PR #339 - Bump seccompiler from 0.4.0 to 0.5.0](https://github.com/hyperlight-dev/hyperlight/pull/339)
- [PR #119 - Bump libc from 0.2.168 to 0.2.169](https://github.com/hyperlight-dev/hyperlight/pull/119)
- [PR #83 - Bump libc from 0.2.164 to 0.2.165](https://github.com/hyperlight-dev/hyperlight/pull/83)
- [PR #15 - Update kvm-bindings requirement from 0.9.0 to 0.10.0 (closed, unmerged)](https://github.com/hyperlight-dev/hyperlight/pull/15)
- [PR #12 - Update kvm-ioctls requirement from 0.18.0 to 0.19.0 (closed, unmerged)](https://github.com/hyperlight-dev/hyperlight/pull/12)
- [rust-vmm/kvm-bindings#80 - Experimental riscv64 support](https://github.com/rust-vmm/kvm-ioctls) (parent repo; PR referenced in dependency research)
- [BLAKE3-team/BLAKE3#484 - Improved RISC-V support + SIMD](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- [RustCrypto/hashes#328 - sha2: performance issue on RISC-V](https://github.com/RustCrypto/hashes)
- [Introducing Hyperlight - Microsoft Open Source Blog](https://opensource.microsoft.com/blog/2024/11/07/introducing-hyperlight-virtual-machine-based-security-for-functions-at-scale/)
- [Hyperlight blog](https://hyperlight-draft.vercel.app/blog/)
- [Hyperlight | CNCF](https://www.cncf.io/projects/hyperlight/)
- [RISE Project](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [PyPI hyperlight package (unrelated PyTorch library, namespace collision)](https://pypi.org/pypi/hyperlight/json)
- [Ubuntu package search for hyperlight (Resolute, no results)](https://packages.ubuntu.com/search?keywords=Hyperlight&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)