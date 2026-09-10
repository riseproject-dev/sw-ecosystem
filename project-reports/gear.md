---
title: GEAR
parent: Project Reports
color: red
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: polkavm
    relation: runtime-dependency
    criticality: optional
  - name: polkavm-linker
    relation: build-dependency
    criticality: optional
---

# GEAR

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for GEAR<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="gear" %}

## 1. Project Overview

GEAR (`gear-tech/gear`) is the node implementation for [Vara Network](https://gear-tech.io/), a Substrate/Polkadot-SDK-based Layer-1 blockchain that executes WASM smart-contract programs, plus a newer Ethereum-execution-layer component (`ethexe`) built on a fork of the Malachite BFT consensus engine.

**License:** core Gear source is GPL-3.0-or-later WITH Classpath-exception-2.0 (root `Cargo.toml` license field, SPDX headers enforced by `scripts/check-license-headers.sh`); vendored components forked from Substrate/Polkadot-SDK retain their upstream Apache-2.0 SPDX headers. Copyright holder on file headers is "Copyright (C) Gear Technologies Inc."

**Governance:** no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists. Governance is process-based, defined in `CONTRIBUTING.md` (Issue -> Branch -> PR -> Review -> Merge via merge queue, Conventional Commits, label-gated CI matrices). Two entities appear across the project's web and source-code presence: **Gear Technologies, Inc.** (copyright holder in source, operates the GitHub org, core engineering) and **Gear Foundation** (described on gear-tech.io as "the core entity behind the Gear ecosystem," hosts the whitepaper). No published tiered-membership or open-governance model was found for the software repository itself.

**RISE membership:** GEAR/gear-tech does not appear in RISE's Premier member list (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or General member list (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE), per the [riseproject.dev members page](https://riseproject.dev/). No RISE blog post (all 34 posts in the archive checked) mentions GEAR, and no RISE working group or funded project references it.

**Community culture on new ports:** absent, not opposed. Exhaustive search (GitHub issue search, PR search, commit search, semantic search under multiple phrasings, and web search) found zero discussion, RFC, or maintainer commentary about a riscv64 port, either for or against. RISC-V is not a topic the community has engaged with.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-06-08 | Commit `1117293878a7df3c97be7918d560736129237174`, "refactor(vara): migrate polkadot-sdk to upstream stable2409 (#5471)," authored by Vadim Smirnov (`ukint-vs@proton.me`). Bulk dependency-version bump/vendoring that pulled in Parity's `substrate-wasm-builder` and `sp-runtime-interface-proc-macro` crates, which carry upstream PolkaVM riscv32-guest-ISA plumbing. Not a deliberate GEAR RISC-V porting effort. | gear-tech/gear commit history (local clone verification) |

No native host-architecture riscv64 port exists or has ever been attempted in gear-tech/gear. `search_commits` for `riscv`/`risc-v`/`riscv64` scoped to the repository returned zero results across all three phrasings. No riscv64-titled GitHub issue exists (`issues?q=riscv+in%3Atitle` -> 0 results). There is no tracking issue, no roadmap entry, and nothing "upstream" to speak of, since the work has never started.

Key contributors overall (by commit volume, last ~2000 commits, Feb 2023-Aug 2026): StackOverflowExcept1on (245), Gregory Sobol (218), Arsenii Lyashenko (191), Dmitrii Novikov (186), Vadim Smirnov (142, author of the only commit touching vendored RISC-V-adjacent code), clearloop (115), Dmitry Novikov (99), Sabaun Taraki (96). All commits carry the Gear Technologies Inc. copyright header. None of this activity is riscv64-port work.

## 3. Upstream Support Tier

No formal tier policy for new architecture ports was found: no `PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` directory, and no such policy on gear-tech.io or wiki.vara.network. The observed pattern is ad hoc CI opt-in via PR labels (`ci: windows`, `ci: macos`, `ci: linux-aarch64`, `ci: full`, `ci: release`, `ci: production`) rather than a documented tiering rubric. No `ci: riscv64` label exists.

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | yes (`x86_64-unknown-linux-gnu`, default) | yes (`aarch64-unknown-linux-gnu`, opt-in `linux-aarch64` label; also macOS aarch64) | no |
| CI tests | yes | yes | no (no job exists) |
| Official release binaries | yes (GitHub Releases v2.0.0, v1.10.0) | not confirmed as a distinct release asset [NEEDS VERIFICATION] | no |
| Compiles at all | yes | yes (full lazy-pages arch arm exists) | **no** - hard `compile_error!` in load-bearing source, see Section 4 |

Source: `.github/workflows/build.yml` dynamic-matrix job (read in full), GitHub Releases pages for v2.0.0 and v1.10.0.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The decisive architecture-specific component is `protocol/lazy-pages/src/sys/unix.rs` (Gear-authored, `Copyright (C) Gear Technologies Inc.`), which decodes the CPU's page-fault exception state (from `ucontext_t`/`mcontext_t`) inside the SIGSEGV/SIGBUS handler that drives lazy-pages - the mechanism the WASM executor uses to lazily fault-in program memory pages. This is non-optional, load-bearing code: `gear-lazy-pages` is a plain dependency of `protocol/processor`, `protocol/backend`, `ethexe/processor`, `ethexe/runtime`, `vara/pallets/gear`, and `sdk/gtest`.

Its `cfg_if!` dispatch has exactly four arms, each hand-tuned:
- `(linux|android, x86_64)`: parses `REG_ERR`/`gregs`, decodes the page-fault W/R bit per the OSDev spec.
- `(linux|android, aarch64)`: parses `ESR_EL1` out of the sigcontext reserved area (including an Android-specific struct-layout workaround), decodes the WNR bit.
- `(macos, x86_64)`: parses `__es.__trapno`/`__err` from Darwin's mcontext.
- `(macos, aarch64)`: parses `__es.__esr`, checks exception class plus the WNR bit.

There is no riscv64 arm. The `else` branch is:
```rust
compile_error!("lazy-pages are not supported on your system. Disable `lazy-pages` feature");
```
The same all-or-nothing pattern repeats in `protocol/lazy-pages/src/sys/mod.rs` (`windows` / `unix` / `compile_error!`) and in `lib.rs`'s Darwin-only exception-port setup (`x86_64` / `aarch64`, no riscv64).

The only other "riscv" references anywhere in the repository (5 files total, `grep -rn riscv --include=*.rs --include=*.toml .` repo-wide) are under `substrate/`, vendored verbatim from Parity's Polkadot-SDK `stable2409` and still carrying `Copyright (C) Parity Technologies (UK) Ltd.` headers:
- `substrate/substrate-wasm-builder/src/lib.rs`, `prerequisites.rs`, `wasm_project.rs`: support compiling the **on-chain runtime blob** to `riscv32ema-unknown-none-elf` for **PolkaVM**, documented by upstream itself as "experimental, do not use it in production!"
- `substrate/sp-runtime-interface-proc-macro/.../bare_function_interface.rs`: emits a single `unimp` trap instruction under `cfg(target_arch = "riscv32"|"riscv64")` - the only inline asm in the repo.
- `substrate/sp-runtime-interface-proc-macro/.../host_function_interface.rs`: a `polkavm_import` ABI attribute under the same cfg.

None of this is riscv64 support for running the GEAR/Vara node on riscv64 host hardware. It answers a different question (can on-chain contract bytecode be compiled to PolkaVM's RISC-V-derived instruction set) than the one that matters for this report (can the node itself build and run on a riscv64 host). No `arch/riscv/` directory, no `.S` assembly files, and no SIMD/vector dispatch code exist in the repository; searches for `vfloat32m1_t` and `rvv` both returned zero matches.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| lazy-pages fault decoding (Gear-authored, load-bearing) | full, hand-tuned | full, hand-tuned | **missing** - zero lines, hard `compile_error!` |
| WASM JIT execution (wasmtime/Cranelift, dependency) | mature | mature | Tier 2 codegen / Tier 3 host per wasmtime's own docs; open correctness bugs (see Section 9, 11) |
| PolkaVM host recompiler (dependency, optional) | native JIT | native JIT | no native JIT; interpreted-only fallback |
| SIMD/vector code (Gear-authored) | none found | none found | none found (n/a - none exists for any arch) |

## 5. Build System, Cross-Compilation, and Toolchain

The project is a Cargo/Rust workspace; there is no CMake anywhere in the repository (`filename:CMakeLists.txt` -> 0 results), and therefore no riscv64 CMake toolchain file to speak of.

`rust-toolchain.toml` pins:
```
[toolchain]
channel = "nightly-2026-07-21"
components = ["rustfmt", "clippy", "llvm-tools"]
targets = ["wasm32v1-none"]
```
`riscv64gc-unknown-linux-gnu` is not in the pinned `targets` list.

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist beyond `vara/node/README.md`'s standard `cargo build` instructions. Of the 6 Dockerfiles in the repository (`vara/docker/Dockerfile`, `vara/docker/Dockerfile-release`, `vara/docker/gear-loader/Dockerfile`, `vara/docker/runtime-fuzzer/Dockerfile`, `ethexe/docker/ethexe_builder.Dockerfile` - explicitly `FROM --platform=linux/amd64 amazonlinux:2023`), none target riscv64 and no `Dockerfile.riscv64` exists. No QEMU usage related to riscv64 build or test was found anywhere in the repository.

**Known build failure:** a `riscv64gc-unknown-linux-gnu` build of the default feature set will hit the `compile_error!` documented in Section 4 inside `protocol/lazy-pages/src/sys/unix.rs` / `sys/mod.rs`, because `gear-lazy-pages` is a non-optional dependency of the node's core crates. This is a confirmed, source-verified, unconditional build failure, not an untested-but-plausible gap.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Node compiles | yes | yes | **no** |
| Node runs (lazy-pages WASM execution) | yes | yes | n/a - cannot compile |
| CI build | yes | yes | no |
| CI test | yes | yes | no |
| Official release binary | yes | not confirmed as distinct asset [NEEDS VERIFICATION] | no |

The gap is not a performance delta or a missing-SIMD regression - it is a total functional gap. The node cannot be built for riscv64 today under any configuration found in this research. No NaN/floating-point semantics issues or security-hardening gaps were assessed as relevant, since the build does not reach a state where such differences could manifest. Data not available: any partial/degraded riscv64 build mode, since none exists.

## 7. CI/CD Infrastructure

All 18-19 `.github/workflows/*.yml` files and all composite actions under `.github/actions/*/action.yml` were read in full and grepped case-insensitively for `riscv`, `RISCV`, `RISC-V`, `riscv64`, `linux/riscv64`. Zero matches anywhere. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist in the repository; CI is GitHub Actions exclusively.

The actual build matrix, from `build.yml`'s `dynamic-matrix` job (the canonical target list consumed by `CI.yaml` and `PR.yml`):
- `x86_64-unknown-linux-gnu` on `ubuntu-latest`
- `aarch64-apple-darwin` / `x86_64-apple-darwin` on `macos-latest` (opt-in `macos` label)
- `aarch64-unknown-linux-gnu` on `ubuntu-24.04-arm` (opt-in `linux-aarch64` label)
- `x86_64-pc-windows-msvc` (opt-in `windows` label)

No riscv64 target, no QEMU riscv64 emulation, no `linux/riscv64` Docker platform, and no RISE riscv64 runner reference (`riseproject-dev`, `ubuntu-24.04-riscv`) anywhere in these definitions.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | yes | yes (opt-in label) | no |
| Runs tests | yes | yes | no |
| Release-blocking | yes (default target) | opt-in | no |
| Hardware/emulation | native cloud runner | native `ubuntu-24.04-arm` runner | none |

## 8. Distribution and Release Status

**GitHub Releases** (v2.0.0, 2025-06-02; v1.10.0, 2024-12-02) asset lists: `ethexe`, `gear`, `production_vara_runtime_v*.wasm`, `production_vara_runtime_v*_metadata.scale`, `testnet_vara_runtime_v*.wasm`, `testnet_vara_runtime_v*_metadata.scale`, source zip/tar.gz. No filename in either release contains "riscv" or "riscv64"; binaries are unqualified by architecture in the filename at all, consistent with x86_64-only Linux builds.

**PyPI:** the `gear` package on PyPI ([pypi.org/pypi/gear/json](https://pypi.org/pypi/gear/json)) is an unrelated project - a pure-Python async client for the Gearman job-server protocol, not a packaging of gear-tech/gear. Not applicable to this assessment.

**Ubuntu 26.04 (resolute):** no package literally named `gear`, `python3-gear`, or `libgear` exists ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=GEAR&suite=resolute&searchon=names&section=all)), for any architecture, not just riscv64. The only "gear"-adjacent hits (`flightgear`, `gearman-job-server`, `geary`, `libsimgear-dev`, etc.) are unrelated projects that happen to share the substring "gear."

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=gear)): no `gear` package listed.

GEAR is not distro-packaged anywhere; it ships exclusively as GitHub Release binaries built for x86_64 Linux (and possibly macOS/Windows - not independently confirmed by architecture-tagged filenames). There is no path today by which a user obtains a working riscv64 GEAR binary: it would have to be built from source, and building from source fails at compile time per Section 4/5.

## 9. Dependencies

| Dependency | Role in GEAR | riscv64 build | riscv64 test/runtime | riscv64 release | Notes |
|---|---|---|---|---|---|
| **Rust** | Build-dependency, critical. Sole toolchain (Cargo workspace, pinned nightly-2026-07-21 via `rust-toolchain.toml`). | riscv64gc-unknown-linux-gnu is a Rust-supported target generally, but is not in GEAR's pinned `targets` list, and GEAR's own source (lazy-pages) refuses to compile for riscv64 regardless of toolchain availability. | n/a - blocked upstream of this by Gear's own `compile_error!` | n/a | Toolchain is not the blocker; Gear's application code is. |
| **polkavm** (0.9.3) | Runtime-dependency, optional. Alternative VM/recompiler powering `sc-executor-polkavm`. | builds (pure interoperable Rust crate) | riscv64 **host** has no native JIT/recompiler per project README - "anything else will run in an interpreted mode." Note this is distinct from RISC-V as PolkaVM's *guest* bytecode ISA. | no confirmed riscv64-specific release status found | Even if GEAR's lazy-pages blocker were fixed, PolkaVM on riscv64 host would run interpreted-only, a significant performance regression. |
| **polkavm-linker** (0.9.2) | Build-dependency, optional. Links compiled ELF into `.polkavm` bytecode. | builds (pure Rust) | n/a (build-time tool) | n/a | No riscv64-specific issues found. |
| wasmtime (44.0.1, features `anyhow, winch`) | Primary JIT execution engine for WASM smart-contract programs (`sc-executor-wasmtime`). Most critical indirect dependency. | Cranelift riscv64 codegen is Tier 2 (no continuous fuzzing) per wasmtime's own stability-tier docs. | riscv64 as a wasmtime **host** platform is Tier 3 (lowest tier - "requires CI testing, full-time maintainer"). The `winch` feature GEAR enables has almost no riscv64 support. | experimental/immature on riscv64 host | Multiple open Cranelift riscv64 bugs (ISLE panics, crashes, unimplemented vector instructions) - see Section 11. |
| wasmi (0.38) | Secondary pure-interpreter WASM engine. | pure-Rust interpreter, architecture-agnostic | fine - no native codegen | n/a | Zero riscv64 issues found; lowest-risk dependency in the stack. |
| RocksDB / rust-rocksdb (0.21) | Storage backend for `ethexe-db`. | C++ build from source; historical riscv64 build failures, all closed/fixed. | builds today per closed issues; no open riscv64-specific bugs found | buildable | See `project-reports/rocksdb.md`. |
| mimalloc (0.1.46) | Global memory allocator (`vara/node/cli`). | builds | closed issue re: SV39-MMU alignment edge case on riscv64 - resolved but flags historical fragility | generally working | Watch for SV39-specific edge cases. |
| RustCrypto hashes (blake2, sha2, sha3, sha-1) | Hashing throughout protocol/runtime and crypto builtins. | pure Rust, portable fallback | closed perf-only issue on sha2 (no correctness issue) | functionally fine | Possible unrealized performance vs. x86/ARM asm-accelerated paths. |
| arkworks (ark-bls12-381, ark-ec, ark-ff, ark-serialize, ark-scale, ark-std) | BLS12-381 pairing cryptography (`gbuiltin-bls381`). | pure Rust, no arch-specific codegen | 0 riscv64 issues found | presumed fine | No reported problems. |
| region (3.0.2) | Low-level page-protection (mmap/mprotect) for lazy-pages/sandbox. | 0 riscv64 issues found | presumed fine (thin libc/mmap wrapper) | presumed fine | No reported problems. |
| rustix | Low-level syscalls wrapper (transitive, via wasmtime/polkavm/substrate stack). | riscv64gc-linux-**gnu** generally supported | open issue re: riscv64gc-linux-**musl** build failure (glibc unaffected) | fine for glibc target GEAR uses | Musl-specific caution only. |
| libp2p / rust-libp2p (=0.51.4 pinned) | P2P networking. | open, unresolved issue reporting riscv64 build friction | unresolved | uncertain | Networking-critical; unresolved upstream. |
| malachitebft-* (git fork of `circlefin/malachite`) | BFT consensus engine for ethexe. | not independently assessed this pass | unassessed | unknown | Flagged for follow-up; out of this pass's research budget. |
| schnorrkel | sr25519 signatures (`vara/sdk/gcli`). | not independently queryable this pass (repo access issue) | presumed portable (pure Rust, built on curve25519-dalek) | unverified | [NEEDS VERIFICATION]. |

Given the Section 4/5 finding, every row in this table is moot for the node itself until Gear's own `compile_error!` blocker is removed - no dependency's riscv64 maturity matters if the application code never reaches the point of linking against it.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| n/a | No riscv64-specific issue, PR, or bug report exists for gear-tech/gear itself | n/a | n/a | Confirmed by exhaustive GitHub issue/PR/commit search across every phrasing tried; all apparent "riscv" hits are Dependabot changelog false positives (e.g. PR [#4054](https://github.com/gear-tech/gear/pull/4054), [#3959](https://github.com/gear-tech/gear/pull/3959), [#673](https://github.com/gear-tech/gear/pull/673)) quoting unrelated upstream crate changelog text. |
| protocol/lazy-pages `compile_error!` | riscv64 build fails outright - no arm in the arch dispatch | confirmed, unresolved, no tracking issue filed | **Correctness/blocking - build-breaking** | Direct source read, `protocol/lazy-pages/src/sys/unix.rs`. This is the single decisive finding of this report. |
| wasmtime #12195 | Cranelift ISLE panic "no rule matched ... gen_bitcast" on riscv64 (opened Dec 2025) | open | correctness | Indirect dependency; would affect JIT correctness once/if the node could be built for riscv64. |
| wasmtime #13959 | Cranelift crash in riscv64 ISLE (Jul 2026) | open | correctness | Same as above. |
| wasmtime #11050 | run/compile failure on riscv64 backend | open | correctness | Same. |
| wasmtime #13078 | vxrm/vxsat vector registers not preserved on riscv64 | open | correctness | Same. |
| wasmtime #9186 | missing `*_overflow` instructions on riscv64 | open | functional gap | Same. |
| wasmtime #7186 | remaining vector instructions unimplemented on riscv64 | open | functional gap | Same. |
| libp2p #5590 | "Build libp2p on RISC-V CPU architecture" | open, unresolved | build-blocking (networking) | Additional indirect blocker even independent of the lazy-pages issue. |
| rustix #1462 | riscv64gc-linux-**musl** build failure with `mm`/`use-libc` features | open | build (musl-specific only) | GEAR would use the glibc target; lower relevance. |

Correctness bugs are concentrated in the wasmtime/Cranelift riscv64 backend (JIT codegen), which is load-bearing for GEAR's core value proposition (executing untrusted WASM smart contracts). These are pre-existing conditions on top of the primary blocker, not the primary blocker itself.

## 12. Objections and Upstream Blockers

No stated objections - supportive or opposed - to a riscv64 port were found anywhere in gear-tech/gear's issues, PRs, discussions, or public communications. The topic has not been raised.

**Technical blocker:** the `compile_error!` in `protocol/lazy-pages/src/sys/unix.rs` and `sys/mod.rs` (Section 4) is the primary, concrete blocker. Closing it requires authoring a new riscv64 Linux arm that parses the kernel's `ucontext_t`/`mcontext_t` sigcontext structure to extract the trap cause and read/write access bit for a SIGSEGV/SIGBUS - the RISC-V analogue of the existing aarch64 ESR_EL1 parsing or x86_64 `REG_ERR` parsing. This is nontrivial, security-and-correctness-sensitive systems code with no existing draft or precedent in the repository.

**Organizational blockers:** no roadmap slot for riscv64 was found; GEAR is not a RISE member and no RISE funding or working-group activity targets it; no community demand signal (issue, discussion, feature request) exists.

**Acceptance probability:** low in the near term absent external prompting. There is no evidence of active opposition, but there is also no evidence of any interest, discussion, or resourcing directed at riscv64, and the blocking code change is a nontrivial low-level systems contribution with no template to follow inside the project.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Optimization gap:** N/A (GEAR is a blockchain execution-engine/runtime, not an optimization-purpose project; its value does not depend on architecture-specific performance tuning as the differentiator, so the Step 2 optimization modifier does not apply)
- **Justification:** GEAR has no upstream riscv64 CI (zero matches across all 18-19 `.github/workflows/*.yml` files and all composite actions), no riscv64 release artifacts (GitHub Releases v2.0.0 and v1.10.0 asset lists), and no riscv64 distro packaging anywhere (no `gear` package exists in Ubuntu resolute or Arch Linux RISC-V for any architecture). Critically, this is not merely an absence-of-testing case: direct inspection of Gear's own load-bearing source, [`protocol/lazy-pages/src/sys/unix.rs`](https://github.com/gear-tech/gear/blob/master/protocol/lazy-pages/src/sys/unix.rs), shows the architecture-dispatch `cfg_if!` has exactly four hand-tuned arms (linux/android x x86_64/aarch64, macos x x86_64/aarch64) and falls through to a hard `compile_error!("lazy-pages are not supported on your system...")` for any other target, riscv64 included. This is a confirmed, source-verified build-blocking condition on a non-optional dependency of the node's core execution path - not an inferred or suspected breakage, which is why the project is graded red rather than the "no CI, presumed buildable" orange default.
- **Pending work that could change the grade:** none identified. No open PR, no RISE engagement, and no community discussion touches this blocker. The grade would move only if someone authors and lands the missing riscv64 arm in `gear-lazy-pages` (closing the hard blocker, likely moving the grade to orange pending CI), and separately adds riscv64 to the CI build matrix (moving toward yellow/blue depending on test execution and release-artifact provider).

## 14. Investment Analysis

RISE has no involvement with GEAR (not a member, no funded work, no blog coverage - Section 1), so no prior RISE work exists to net out of the estimates below.

### 14.1 Functional Enablement

- Author a riscv64 Linux arm for `protocol/lazy-pages/src/sys/unix.rs` and `sys/mod.rs`: parse the riscv64 Linux sigcontext (`ucontext_t`/`mcontext_t`, `scause`/`mcause`-derived trap-cause fields) to extract the faulting-access read/write bit, mirroring the existing x86_64 and aarch64 arms. This is security- and correctness-sensitive systems code (drives lazy WASM memory paging) and needs careful validation, not just enough to compile.
- Once the build compiles, run the full workspace test suite on riscv64 hardware or QEMU to surface any further riscv64-specific gaps (none can be predicted from static analysis alone, since the code has never run).
- Validate the `wasmtime`/`winch`/Cranelift and `polkavm` dependency stack end to end on riscv64, given the multiple open upstream correctness bugs cataloged in Section 11.

### 14.2 Performance Optimization

Not sizeable independently of upstream dependency work: GEAR's own code has no architecture-specific hot paths of its own (Section 4). Performance on riscv64 is gated entirely by (a) wasmtime/Cranelift's Tier 2/3 riscv64 maturity and open correctness bugs, and (b) PolkaVM's lack of a native riscv64 JIT (interpreted-only fallback per its own README). Both are upstream, third-party efforts outside GEAR's control; GEAR-side investment here would mean tracking and validating against those upstream projects' riscv64 progress, not writing new GEAR code.

### 14.3 CI/CD Infrastructure

- Add a riscv64 target to `build.yml`'s dynamic matrix, gated behind a new opt-in label (mirroring the existing `ci: linux-aarch64` pattern).
- Evaluate RISE's free RISC-V GitHub Actions runners (`ubuntu-24.04-riscv`, documented at [riseproject-dev/riscv-runner](https://riseproject-dev.github.io/riscv-runner/)) as the CI backend, since GEAR has no existing riscv64 hardware/runner relationship.
- This work is blocked on 14.1 landing first - there is nothing to build in CI while the source does not compile.

### 14.4 Ecosystem Enablement

Not applicable. GEAR has no significant dependent package ecosystem (no Python/npm/Maven/Kubernetes-operator consumers requiring separate riscv64 enablement) - it ships as a standalone node binary.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Author riscv64 arm in `gear-lazy-pages` sigcontext decoding (unix.rs, mod.rs) | 2-4 | GEAR core/systems engineer | Critical |
| Functional | Validate/fix any further riscv64 gaps surfaced once the build compiles (full workspace test pass) | 2-6 (unknown until 14.1 lands) | GEAR core engineer | Critical |
| Functional | Track/validate wasmtime and polkavm riscv64 dependency maturity (external, monitoring only) | 1-2 (ongoing) | GEAR core engineer | High |
| CI/CD | Add riscv64 target + opt-in label to `build.yml` matrix | 1 | GEAR CI/infra engineer | High (after functional blocker clears) |
| CI/CD | Evaluate/integrate RISE riscv64 runners for the new CI target | 1 | GEAR CI/infra engineer | Medium |
| Ecosystem | N/A - no dependent package ecosystem | 0 | n/a | n/a |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [gear-tech/gear repository](https://github.com/gear-tech/gear)
- [Gear-tech / Vara Network homepage](https://gear-tech.io/)
- [protocol/lazy-pages/src/sys/unix.rs (decisive compile_error! finding)](https://github.com/gear-tech/gear/blob/master/protocol/lazy-pages/src/sys/unix.rs)
- [gear-tech/gear .github/workflows/build.yml](https://github.com/gear-tech/gear/blob/master/.github/workflows/build.yml)
- [gear-tech/gear release v2.0.0](https://github.com/gear-tech/gear/releases/tag/v2.0.0)
- [gear-tech/gear release v1.10.0](https://github.com/gear-tech/gear/releases/tag/v1.10.0)
- [PyPI gear package JSON (unrelated Gearman client library)](https://pypi.org/pypi/gear/json)
- [Ubuntu resolute package search for "GEAR"](https://packages.ubuntu.com/search?keywords=GEAR&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=gear)
- [RISE Project members page](https://riseproject.dev/)
- [RISE Project blog archive](https://riseproject.dev/blog)
- [RISE riscv-runner project](https://riseproject-dev.github.io/riscv-runner/)
- [gear-tech/gear commit 1117293878a7df3c97be7918d560736129237174 (#5471, polkadot-sdk stable2409 migration)](https://github.com/gear-tech/gear/commit/1117293878a7df3c97be7918d560736129237174)
- [gear-tech/gear PR #4054 (Dependabot false-positive match example)](https://github.com/gear-tech/gear/pull/4054)
- [gear-tech/gear PR #673 (Dependabot false-positive match example)](https://github.com/gear-tech/gear/pull/673)
- [wasmtime GitHub repository (dependency)](https://github.com/bytecodealliance/wasmtime)
- [polkavm GitHub repository (dependency)](https://github.com/paritytech/polkavm)
- [libp2p issue #5590 - Build libp2p on RISC-V CPU architecture](https://github.com/libp2p/rust-libp2p/issues/5590)
- [rustix issue #1462 - riscv64gc-linux-musl build failure](https://github.com/bytecodealliance/rustix/issues/1462)
- [substrate/README.md - vendoring provenance note (gear-tech/gear)](https://github.com/gear-tech/gear/blob/master/substrate/README.md)