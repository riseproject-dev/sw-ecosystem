---
title: Rust
parent: Project Reports
color: yellow
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Wasmtime
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="rust" %}

# Rust

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Rust<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Rust is a systems programming language and its reference compiler (`rustc`), built primarily on an LLVM codegen backend, with two alternate first-party backends: `rustc_codegen_cranelift` (fast-compile, JIT-capable) and `rustc_codegen_gcc` (via libgccjit). The toolchain also includes `cargo` (package manager), `std`/`core`/`alloc` (standard library), and `stdarch` (architecture-specific intrinsics).

**Governance:** RFC-driven, team-based. There is no `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file; governance runs through `triagebot.toml` plus the separate `rust-lang/team` repository. Roughly nine top-level teams (Leadership Council, Compiler, Language, Library, Dev Tools, Cargo, Infrastructure, Moderation, Launching Pad) oversee about 124 active subteams. The Leadership Council has seven seats, one per top-level team.

**License:** Dual MIT / Apache-2.0.

**Corporate sponsorship:** Flows through the independent nonprofit Rust Foundation, not the project itself:
- Platinum: Arm, AWS, Google, Huawei, Meta, Microsoft, NVIDIA, OpenAI, Solana Foundation
- Gold: Canonical
- Silver (40+): 1Password, AdaCore, Ferrous Systems, JetBrains, Mozilla, Sentry, Zed Industries, others

Neither Rust nor the Rust Foundation is listed as a [RISE project member](https://riseproject.dev/members/) [NEEDS VERIFICATION - fetched directly, single source].

**Community culture on new ports:** Structurally welcoming but judgment-gated. A dedicated `O-riscv` triagebot label and an active RISC-V notification/ping group with its own Zulip channel exist (`@rustbot ping risc-v`). New targets always start at Tier 3 with a deliberately minimal bar (open a PR, fill out the Tier 3 policy checklist, add docs, tag `r? compiler`). Promotion to Tier 2/1 requires increasing compiler-team (and, for host tools, infra-team) sign-off, and the [target-tier-policy](https://github.com/rust-lang/rust) document explicitly states no target has an automatic right to support.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-07-24 | First RISC-V commit, "[RISCV] Enable LLVM backend", by David Craven (`dvc94ch`), an independent community contributor | commit history via `search_commits query="riscv repo:rust-lang/rust" sort=author-date` |
| 2018-08-02 | Merged via [PR #52787](https://github.com/rust-lang/rust/pull/52787) ("Enable RISCV"), reviewed by Alex Crichton (then Mozilla, long-time rustc reviewer) | same |
| 2018-09 | `riscv32imc-unknown-none-elf` target added | same |
| 2019 | Atomic CAS support (`fintelia`), position-independent code for riscv64 (`Disasm`), ThinLTO patch, target marked "no longer experimental" in LLVM (`lenary`/Sam Elliott, then lowRISC) | same |
| 2019-11 | `riscv64gc-unknown-linux-gnu` target added by `msizanoen1`, sponsored by `tmandry` | same |
| 2020-01-30 | `riscv64gc-unknown-linux-gnu` ships in Rust 1.41.0; std support lands | search-summary findings |
| 2023 | RFP issued for Tier-1 promotion work | [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) |
| 2024 | RISE contract awarded to Codethink, SiFive, Rivos, Ferrous Systems (Project RP004); 8 PRs merged (#125220, #125669, #126355, #126707, #126916, #126917, #127280, #127967) plus CI infra [PR #126641](https://github.com/rust-lang/rust/pull/126641) | same |
| 2024-10 | [RFC #3707](https://github.com/rust-lang/rfcs/pull/3707) opened: "Promote riscv64gc-unknown-linux-gnu to Tier-1" - still open | same |
| 2026-05-05 | [Issue #156191](https://github.com/rust-lang/rust/issues/156191) opened: tracking issue for MCP 982, promote `riscv64gc-unknown-linux-musl` to Tier 2 with host tools | issue body |
| 2026-07-24 | [PR #158766](https://github.com/rust-lang/rust/pull/158766) merged (author `eshattow`, reviewer `marcoieni`): musl promoted to Tier 2 with host tools | merge commit `f907604ba588e7b6781c7d9356194193cc653be8`, verified via `git ls-remote` (`refs/pull/158766/merge` absent = closed/merged) |
| 2026-07-31 | [Issue #160259](https://github.com/rust-lang/rust/issues/160259) opened: release-notes follow-up for #158766 | issue body |
| 2026-08-13 | [PR #161064](https://github.com/rust-lang/rust/pull/161064) merged: emergency revert of d/e/f target-feature stabilization, beta-backported | PR body/comments |
| 2026-09-07 (last activity) | [PR #161385](https://github.com/rust-lang/rust/pull/161385) still open, in lang-team FCP, blocked on doc updates and a CI test-bless fix | PR review thread; verified open via `git ls-remote` (`refs/pull/161385/merge` present) |

**Key contributors and orgs:** David Craven (initial port, independent), Alex Crichton (Mozilla, review), Sam Elliott/`lenary` (lowRISC), `msizanoen1`/`tmandry` (Tier-3 gnu target), RISE-funded team (Codethink, SiFive, Rivos, Ferrous Systems) for the Tier-1 push, `eshattow` (musl Tier-2 implementation), `RalfJung`, `beetrees`, `workingjubilee`, `romancardenas` (current target-feature ABI design work).

**Is it fully upstream?** Yes. All RISC-V support lives in `rust-lang/rust` proper; there is no separate fork required for mainline support. The bare-metal runtime crate (`riscv-rt`) is a separate, non-upstream-tree crate, consistent with how other embedded targets are structured.

## 3. Upstream Support Tier

Rust's formal [target-tier-policy](https://doc.rust-lang.org/nightly/rustc/target-tier-policy.html) defines three tiers: Tier 3 (in-tree, no CI guarantee) -> Tier 2 (CI-built) -> Tier 1 (CI-built and tested). Tier 2's formal bar is "guaranteed to build", not "guaranteed to work" - only Tier 1 carries a test guarantee.

**Current riscv64 tier status** (per `src/doc/rustc/src/platform-support.md` and `target-tier-policy.md`, HEAD as of the researched clone, Sept 2026):
- Tier 2 with host tools: `riscv64gc-unknown-linux-gnu`, `riscv64gc-unknown-linux-musl`
- Tier 2 (no host tools): `riscv64a23-unknown-linux-gnu`, plus several `riscv32*-unknown-none-elf` bare-metal targets
- Tier 3 (~20 targets): ESP-IDF, NuttX, Xous, Hermit, Redox, NetBSD, OpenBSD, VxWorks, Android, Fuchsia, RISC Zero zkVM, Managarm, and others

**Evidence gap:** Despite Tier-2 status, the actual CI jobs backing `riscv64gc-unknown-linux-gnu`/`-musl` (`dist-riscv64-linux-gnu`, `dist-riscv64-linux-musl` in `src/ci/github-actions/jobs.yml`) are build/package (`dist`) jobs only, with no test execution - see Section 7. This is technically consistent with the formal Tier-2 definition ("guaranteed to build") but means the CI does not verify correctness on every merge, which is the gating requirement for Tier 1.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tier | 1 | 1 (`aarch64-unknown-linux-gnu`) | 2 (with host tools, gnu and musl) |
| CI builds | yes | yes | yes (build-only, `dist` jobs) |
| CI tests | yes (every PR) | yes (every PR) | no (no test execution anywhere in upstream CI) |
| Release-blocking | yes | yes | no (dist jobs run under `auto:`/bors merges, not required PR checks) |
| Official rustup binary | yes | yes | yes (gnu and musl, Tier 2 with host tools) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Rust has no `arch/riscv/` runtime directory in-tree (boot/trap-vector assembly lives in the separate `riscv-rt` crate) and no dedicated RISC-V JIT backend beyond the generic inline-asm plumbing shared by all three codegen backends.

**Target definitions** (`compiler/rustc_target/src/spec/targets/riscv*.rs`, ~33 files): complete target-spec metadata (LLVM triple, base feature string e.g. `+m,+a,+f,+d,+c,+zicsr,+zifencei`, ABI name, code model, atomic width) covering Linux glibc/musl, BSDs, Fuchsia, Hermit, Redox, VxWorks, Android, embedded ESP-IDF/NuttX/Xous, RISC0 zkVM, and bare-metal `none-elf` variants.

**Inline-asm registers** (`compiler/rustc_target/src/asm/riscv.rs`, 191 lines): defines `x0`-`x31`, `f0`-`f31`, and `v0`-`v31` register classes, but the vector register class's `supported_types()` returns an empty slice - vector registers exist for inline-asm clobbers/allocation only, with **no typed vector operand support**.

**Calling convention** (`compiler/rustc_target/src/callconv/riscv.rs`, 472 lines): complete implementation of the RISC-V ELF psABI, including FP-pair classification for `ilp32d`/`lp64d` and struct-flattening, mirroring Clang's lowering.

**Codegen backends:** LLVM is the default and only mature backend. `rustc_codegen_cranelift` has a dedicated `cranelift:area:riscv64` label but visibly less maturity - open crashes include [wasmtime#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) (Cranelift crash in riscv64 ISLE) and [wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) (ISLE panic, no rule matched for `gen_bitcast`). `rustc_codegen_gcc` (libgccjit) inherits GCC's decades-mature riscv64 backend.

**RISC-V intrinsics (`stdarch`, `library/stdarch/crates/core_arch/src/riscv*`):**
- `Zb` (bit-manipulation): complete for modeled subset
- `Zk` (scalar crypto - AES/SHA/SM3/SM4): complete and stable
- `P` (packed-SIMD): explicitly documented as a draft/stub - the source comment states "the P extension is still unratified, so there is no support for it in upstream LLVM"; functions are emitted via raw `.insn` encoding pending LLVM support
- Hypervisor/supervisor fence and load/store instructions: complete

**RVV (vector extension): zero intrinsics implemented.** A search for `vfloat32m1_t` (the standard RVV intrinsic naming convention) returns zero hits in `rust-lang/rust`. The `v`/`zve32x`/`zve64d`/etc. extensions exist only as `-Ctarget-feature` flags and `is_riscv_feature_detected!` detection strings - there is no `core::arch::riscv64::v` module and no vector-intrinsic codegen path anywhere in the compiler or standard library. [Issue #138789](https://github.com/rust-lang/rust/issues/138789) (open) reports RVV is not even enabled with `-Ctarget-cpu=native`.

**Runtime feature detection** (`library/std_detect`): complete and actively maintained. Reads `auxv` for single-letter extensions and the `riscv_hwprobe` syscall (`__NR_riscv_hwprobe = 258`) for multi-letter extensions (Zba/Zbb/Zk*/Zv*), plus `prctl(PR_RISCV_V_GET_CONTROL)` for per-thread vector-extension state.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD/vector intrinsics | full (SSE/AVX family, stable) | full (NEON, stable) | absent (RVV: detection-only, zero intrinsics) |
| Scalar crypto intrinsics | full (AES-NI etc.) | full (crypto extensions) | complete (Zk family) |
| Bit-manipulation intrinsics | full (BMI1/2) | partial | complete (Zb family) |
| JIT/alt codegen backend maturity | Cranelift: mature | Cranelift: mature | Cranelift: open ISLE crashes, less mature |
| Runtime feature detection | full | full | full (`riscv_hwprobe`-based) |

## 5. Build System, Cross-Compilation, and Toolchain

Rust has no `CMakeLists.txt` - it is not a CMake project. CMake is used only internally, to build the bundled LLVM submodule (`src/bootstrap/src/core/build_steps/llvm.rs`, via the Rust `cmake` crate), and RISC-V is always included in `LLVM_TARGETS_TO_BUILD` by default (no RISC-V-specific disable switch exists).

The actual build system is `x.py` (Python bootstrapper wrapping a Rust `bootstrap` crate), driven by `bootstrap.toml`, optionally generated via a `./configure` wrapper.

**Cross-compile example:**
```toml
[build]
target = ["riscv64gc-unknown-linux-gnu"]
```
```sh
./x.py build && ./x.py install
```

**CI toolchain construction** (Dockerfiles under `src/ci/docker/host-x86_64/`):
- `dist-riscv64-linux-gnu/Dockerfile`: `FROM ubuntu:22.04`, builds a `riscv64-unknown-linux-gnu` crosstool-ng toolchain, `HOSTS=riscv64gc-unknown-linux-gnu`, `TARGETS=riscv64gc-unknown-linux-gnu,riscv64a23-unknown-linux-gnu`
- `dist-riscv64-linux-musl/Dockerfile`: same pattern via crosstool-ng + musl
- `dist-various-1/Dockerfile`: cross-compiles bare-metal `riscv32i*`/`riscv64imac-unknown-none-elf`/`riscv64gc-unknown-none-elf` via `install-riscv32-none-elf.sh`/`install-riscv64-none-elf.sh`

**No QEMU usage anywhere for riscv64.** Unlike the ARM path in `dist-various-1/Dockerfile` (which installs `qemu-system-arm` to execute ARM binaries), no QEMU package or execution step exists for any riscv target in CI - these jobs build and package output but never run it.

**Known build failures:**
- [#111700](https://github.com/rust-lang/rust/issues/111700) - `rustc` fails to build for target `riscv64gc-unknown-linux-musl` (open since 2023-05-18, still updated 2025-09-14)

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tier | 1 | 1 | 2 |
| Vector/SIMD intrinsics usable from Rust | yes | yes | no (RVV absent) |
| Upstream CI test execution | yes | yes | no |
| LTO with non-medium code model | yes | yes | no ([#139479](https://github.com/rust-lang/rust/issues/139479), open) |
| `-Zbuild-std` | works | works | broken for `riscv32gc-unknown-linux-gnu` ([#88995](https://github.com/rust-lang/rust/issues/88995), open) |
| Atomics + `linker-plugin-lto` | works | works | broken ([#69689](https://github.com/rust-lang/rust/issues/69689), open) |

**Functional gaps:**
- RVV never enabled, even with `-Ctarget-cpu=native` ([#138789](https://github.com/rust-lang/rust/issues/138789), open)
- `P` (packed-SIMD) extension is a stub pending LLVM/ISA ratification, no functional path
- Code model other than "medium" incompatible with LTO on riscv64 ([#139479](https://github.com/rust-lang/rust/issues/139479))

**Performance gaps:**
- No RVV means no vectorized codegen benefit at all versus amd64 AVX/arm64 NEON paths
- Target-feature-gated intrinsics not inlined ([#137293](https://github.com/rust-lang/rust/issues/137293), open)
- Missed `match` optimization specific to riscv64 codegen ([#136216](https://github.com/rust-lang/rust/issues/136216), open)
- Suboptimal dual-exit codegen ([#113346](https://github.com/rust-lang/rust/issues/113346), open)

**Security hardening / ABI gap:** [#132618](https://github.com/rust-lang/rust/issues/132618) (open) - disabling FP target features on a hard-float target can make LLVM silently fall back to the soft-float ABI without a compiler error, an unflagged ABI hazard that also blocks stabilizing the ratified-extension intrinsics tracked in [#114544](https://github.com/rust-lang/rust/issues/114544).

**Floating-point semantics bug:** [#156529](https://github.com/rust-lang/rust/issues/156529) (open, labeled `C-defective-hardware`) - `tests/ui/float/minmax.rs` fails on `riscv64gc-unknown-linux-gnu`: a min/max float operation returns `NaN` instead of the expected value.

**Silent correctness bug:** [#146393](https://github.com/rust-lang/rust/issues/146393) (open) - since Rust 1.87.0 (LLVM 20 bump, nightly 2025-02-17/18), when nearly all registers are reserved on RISC-V (only `a0` free), LLVM performs the same operand twice instead of adding two distinct values, silently producing wrong results with no compile error. Reproduces through 1.89.0 and current nightly.

**Target-feature ABI design instability:** The d/e/f target-feature stabilization saga ([#150257](https://github.com/rust-lang/rust/issues/150257) tracking, [#156188](https://github.com/rust-lang/rust) merged then reverted via [#161064](https://github.com/rust-lang/rust/pull/161064) on soundness grounds, re-stabilization of d/f only via [#161385](https://github.com/rust-lang/rust/pull/161385) currently in lang-team FCP as of 2026-09-07) reflects an unresolved compiler-internals question about negative/toggleable target features on RISC-V's `e` (embedded) ABI variant - `e` stabilization itself remains deferred pending resolution of `workingjubilee`'s objection.

## 7. CI/CD Infrastructure

Confirmed by direct reading of `.github/workflows/ci.yml`, `.github/workflows/ghcr.yml`, `.github/workflows/post-merge.yml` (the only three workflow files present) and `src/ci/github-actions/jobs.yml` (the actual job matrix, dynamically expanded by the `citool` program). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

**riscv64 jobs** (`src/ci/github-actions/jobs.yml`, `auto:` section):
```yaml
  - name: dist-riscv64-linux-gnu
    <<: *job-linux-4c
  - name: dist-riscv64-linux-musl
    <<: *job-linux-4c
```
`job-linux-4c` runs on `ubuntu-24.04` (a standard x86_64 GitHub-hosted runner) - not native riscv64 hardware; the target is built by cross-compiling inside a Docker container.

**Trigger scope:** These jobs live only under `auto:` (bors auto-merge/try builds), not under `pr:` (ordinary PR CI), `try:` (default `@bors try`), or `optional:`. They therefore do not run on every PR by default; a contributor can request them explicitly via `@bors try jobs=dist-riscv64-linux-gnu`.

**No test execution.** There is no `test-riscv64-*` job anywhere in `jobs.yml`, and no QEMU package is installed for any riscv target. riscv64 output is built and packaged for distribution but never executed inside upstream CI.

**RISE runners:** Not used in rust-lang/rust's own gating CI. RISE-provided hardware (Scaleway Elastic Metal RV1, six SG2042 machines) is used out-of-band, specifically for the still-open Tier-1 promotion effort (RFC #3707), where a full `x.py test` run takes approximately 6 hours (per the [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)) or 3-4 hours across the six-SG2042 configuration (per the RFC), both exceeding the infra team's stated cap - this is the explicit blocker to Tier-1.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | yes (build-only, bors `auto:` only) |
| CI test execution | yes | yes | no |
| Runner | native x86_64 | native/hosted arm64 | x86_64 host, Docker cross-compile |
| Release-blocking | yes | yes | no |
| RISE hardware involvement | none needed | none needed | out-of-band Tier-1 test runs only, not gating CI |

## 8. Distribution and Release Status

Rust does not ship GitHub Release binary tarballs for any platform; distribution is via `rustup` / `static.rust-lang.org`.

- **Official rustup builds:** `riscv64gc-unknown-linux-gnu` and `riscv64gc-unknown-linux-musl` are Tier 2 with host tools, meaning official rustup-distributed compiler+tool binaries exist for both, built from the same `dist-riscv64-linux-*` CI jobs described in Section 7.
- **Ubuntu 26.04 (Resolute):** `rustc` is confirmed available for riscv64 as a distro package, alongside amd64, arm64, armhf, i386, ppc64el, s390x ([packages.ubuntu.com/resolute/rustc](https://packages.ubuntu.com/resolute/rustc)).
- **GitHub Releases page:** confirmed via WebFetch to carry no binary assets for any architecture (release notes only) - not the distribution channel for this project.

**To get a working riscv64 Rust toolchain, a user can:**
1. Install natively on riscv64 Ubuntu 26.04 hardware via the distro `rustc` package, or
2. Run `rustup target add riscv64gc-unknown-linux-gnu` (or `-musl`) from a Tier-1 host for cross-compilation, or install the RISC-V host-tools build directly on riscv64 hardware (Tier 2 with host tools covers both gnu and musl).

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| [LLVM](https://github.com/llvm/llvm-project) (submodule, `rust-lang/llvm-project` fork) | Primary/default codegen backend for every riscv64 target | Mature; active `backend:RISC-V` label, 801 open+closed riscv64 issues, dedicated buildbots | Green in general via LLVM's own CI and downstream distro CI; open correctness/perf bugs still land, e.g. [llvm#221521](https://github.com/llvm/llvm-project/issues/221521) (O2 hang, fixed within a day), [llvm#221163](https://github.com/llvm/llvm-project/issues/221163) (RVV loop-carried WAR hazard, open) | Distro packages (Debian, Ubuntu, Fedora) ship riscv64 clang/LLVM; official upstream binary-release status not independently reconfirmed [NEEDS VERIFICATION] | No dedicated status report exists for LLVM despite it being Rust's single most load-bearing riscv64 dependency - flagged as the biggest coverage gap in this research pass |
| Cranelift (`bytecodealliance/wasmtime`, consumed via `rustc_codegen_cranelift`, a sibling project not in-tree) | Alternate codegen/JIT backend | Dedicated `cranelift:area:riscv64` label, actively maintained | Multiple open crashes: [wasmtime#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [wasmtime#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [wasmtime#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) | Ships as part of wasmtime/cranelift releases, not a separate Ubuntu package | 108 riscv64-tagged issues total; less mature than LLVM's backend |
| GCC (submodule `src/gcc`, backs `rustc_codegen_gcc`/libgccjit) | Alternate codegen backend | Decades-mature RV64GC support (primary GCC target since GCC 7+) | Well-tested via GCC's own riscv64 CI/testsuite | `gcc-riscv64-linux-gnu` standard in Ubuntu/Debian | No issues specific to the `rustc_codegen_gcc` integration found in this pass |
| jemalloc (`tikv-jemalloc-sys`) | Optional allocator | Debian sid / Ubuntu Noble ship `libjemalloc2` for riscv64; `libjemalloc-dev` reportedly not available for riscv64 in Ubuntu Noble [NEEDS VERIFICATION - needs recheck for 26.04] | No upstream riscv64 CI; correctness fine, perf gaps (no Zihintpause spin-wait, libatomic sub-word emulation) | Debian sid / Ubuntu Noble | `riscv64gc-unknown-linux-gnu` triple recognition only fixed in jemalloc's `configure` as of commit c51949e (Mar 2026) |
| zlib (`libz-sys`/`zlib-rs`) | Compression | Ubuntu Noble `zlib1g`/`zlib1g-dev` present for riscv64 | Only incidental OpenBSD/vmactions CI coverage, no dedicated Linux cross-compile testing | Ubuntu Noble, Debian sid, Arch RISC-V, Alpine | Unmerged RVV Adler32 perf PR ([zlib#1099](https://github.com/madler/zlib/pull/1099), 10+ months stale) |
| xz/liblzma (`lzma-sys`) | Compression | Debian sid installed on riscv64 | No riscv64 upstream CI runner, no open correctness bugs | Debian sid, Arch RISC-V | Perf-only gap (no Zbc hardware CRC path) |
| OpenSSL (`openssl-sys`, used transitively by bundled `cargo`) | Crypto/TLS for registry access | Debian sid installed; Ubuntu Noble - 63/65 OpenSSL-related packages support riscv64 | Extensive riscv64 CI but all QEMU-emulated, FIPS disabled; [openssl#22166](https://github.com/openssl/openssl/issues/22166) SSL test hangs at high parallelism (open since 2023) | Debian sid, Ubuntu Noble, Arch RISC-V | Critical open security gap: AES T-table fallback not constant-time on riscv64 hardware lacking Zkn/Zvkned ([openssl#31080](https://github.com/openssl/openssl/issues/31080), [#31082](https://github.com/openssl/openssl/issues/31082)) |
| libcurl (`curl-sys`, transitive via `cargo`) | Networking | Debian sid (RC quality); Ubuntu Noble ships `libcurl4t64` | No riscv64 test-suite execution anywhere upstream | Debian sid, Ubuntu Noble | Zero open curl-side riscv64 issues; risk inherited from OpenSSL/zstd |
| zstd (`ruzstd` pure-Rust, plus optional C `zstd`) | Compression | Pure-Rust `ruzstd` has no riscv64-specific gap | Non-blocking perf gap in upstream C libzstd ([zstd#4622](https://github.com/facebook/zstd/issues/4622)) | Debian sid | N/A |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#146393](https://github.com/rust-lang/rust/issues/146393) | Wrong codegen (silently wrong results) when nearly all registers reserved on RISC-V | Open | **Correctness, critical** | Regression from LLVM 20 bump (1.87.0), reproduces through 1.89.0 and nightly |
| [#145769](https://github.com/rust-lang/rust/issues/145769) | RISC-V memcpy routine allegedly uses misaligned loads/stores, corrupting data | Open, thread stalled since 2025-08-30 | **Correctness, disputed** | Root cause not confirmed - could be a compiler bug, hardware/emulator quirk, or a harness artifact; no maintainer confirmation of a defect in generated assembly |
| [#156529](https://github.com/rust-lang/rust/issues/156529) | float min/max returns NaN instead of expected value on riscv64 | Open | **Correctness** | Labeled `C-defective-hardware` |
| [#143749](https://github.com/rust-lang/rust/issues/143749) | rustc SIGSEGV compiling `serde` and other crates natively on RISC-V hardware | Open | **Correctness/stability** | rustc 1.88.0 / LLVM 20.1.5 |
| [#157749](https://github.com/rust-lang/rust/issues/157749) | rustc SIGSEGV building "Hello World" on RISC-V, stable and nightly | Open | **Correctness/stability** | |
| [#127180](https://github.com/rust-lang/rust/issues/127180) | rustc SIGSEGV compiling `rug` crate on RISC-V (Armbian) | Closed | Correctness | Historical, illustrative of recurring crash class |
| [#139479](https://github.com/rust-lang/rust/issues/139479) | Code model other than "medium" fails with LTO on riscv64 | Open | Functional | |
| [#132618](https://github.com/rust-lang/rust/issues/132618) | `-Ctarget-feature` restraints needed on RISC-V; disabling FP can silently produce soft-float ABI | Open | ABI hazard | Blocks #114544 (ratified-extension intrinsics stabilization) |
| [#69689](https://github.com/rust-lang/rust/issues/69689) | Atomics unusable with `linker-plugin-lto` on RISC-V | Open | Functional | |
| [#88995](https://github.com/rust-lang/rust/issues/88995) | `-Zbuild-std` produces broken std for `riscv32gc-unknown-linux-gnu` | Open | Functional | |
| [#111700](https://github.com/rust-lang/rust/issues/111700) | `rustc` fails to build for `riscv64gc-unknown-linux-musl` | Open since 2023, updated 2025-09-14 | Build | |
| [#138789](https://github.com/rust-lang/rust/issues/138789) | RVV not enabled despite `-Ctarget-cpu=native` | Open | Performance | RVV has zero intrinsic coverage regardless |
| [#137293](https://github.com/rust-lang/rust/issues/137293) | RISC-V intrinsics gated behind target features not inlined | Open | Performance | |
| [#136216](https://github.com/rust-lang/rust/issues/136216) | Missed `match` optimization specific to RISC-V codegen | Open | Performance | |
| [#113346](https://github.com/rust-lang/rust/issues/113346) | Suboptimal dual-exit codegen on RISC-V | Open | Performance | |
| [#150257](https://github.com/rust-lang/rust/issues/150257) | Tracking issue for `riscv_target_feature` (the d/e/f saga) | Open, 40 comments | Process/ABI design | `e` remains unresolved pending `workingjubilee`'s objection |
| [#161385](https://github.com/rust-lang/rust/pull/161385) | Re-stabilize `d`/`f` target features | Open, in lang FCP | Process | Blocked on doc updates + CI test-bless fix per `mejrs`'s last review (2026-09-07) |

## 12. Objections and Upstream Blockers

**Technical blocker - Tier-1 test-suite runtime:** The single stated blocker to promoting `riscv64gc-unknown-linux-gnu` to Tier 1 is that a full `x.py test` run takes roughly 6 hours on RISE's Scaleway Elastic Metal RV1 hardware, or 3-4 hours spread across six SG2042 machines per [RFC #3707](https://github.com/rust-lang/rfcs/pull/3707) - both exceeding the infrastructure team's stated performance cap for Tier-1 test execution. RFC #3707 has been open since October 2024 without resolution.

**Technical blocker - target-feature ABI soundness:** The `e` (embedded) target feature is a negative feature (it removes registers x16-x31 rather than adding capability). `workingjubilee` raised a compiler-internals objection during review of [#150257](https://github.com/rust-lang/rust/issues/150257): Rust's SIMD API design assumes target features are inherited/monotonic post-inlining, and a toggleable negative feature breaks that assumption. This led to an emergency revert ([#161064](https://github.com/rust-lang/rust/pull/161064)) of the original three-feature stabilization, beta-backported within roughly 24-36 hours of the objection being raised. As of the last thread activity (2026-08-22), `d` and `f` are proceeding to re-stabilization ([#161385](https://github.com/rust-lang/rust/pull/161385)) but `e` itself remains deferred with no resolution path yet agreed.

**Organizational stance:** Rust's tier-promotion process is explicitly judgment-gated by the lang and compiler teams, not a checklist-only process - both the Tier-1 RFC and the target-feature stabilization required live team review/FCP, not merely satisfying a written checklist.

**Acceptance probability:**
- Tier 2 (musl, with host tools): already landed ([PR #158766](https://github.com/rust-lang/rust/pull/158766), merged 2026-07-24) - low remaining barrier, essentially resolved.
- Tier 1: blocked on a structural CI performance/infrastructure problem (test runtime), not a technical-correctness disagreement - resolution requires either faster riscv64 hardware/parallelism or a reduced Tier-1 test scope; no committed timeline found in available sources. Given the RFC has been open nearly two years as of this report with the blocker unchanged, near-term Tier-1 promotion is not assured.
- `e` target-feature stabilization: open-ended pending a compiler-team design decision; `d`/`f` re-stabilization is close to landing (in FCP as of 2026-09-07).

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream (rustup / static.rust-lang.org ships official `riscv64gc-unknown-linux-gnu` and `riscv64gc-unknown-linux-musl` Tier-2-with-host-tools builds)
- **Optimization level:** not applicable - Rust the compiler/toolchain is a general-purpose language implementation, not an optimization-purpose project in the sense defined by the color model (allocator, SIMD library, inference-kernel library, etc.), so the Step 2 optimization-gap modifier does not apply. `optimization_gap: N/A`.

**Justification:** Upstream CI builds riscv64 via the `dist-riscv64-linux-gnu` and `dist-riscv64-linux-musl` jobs in [`src/ci/github-actions/jobs.yml`](https://github.com/rust-lang/rust), but these are build/package (`dist`) jobs only, cross-compiling on x86_64 GitHub-hosted runners with no QEMU and no `test-riscv64-*` job anywhere in the CI configuration - confirmed by direct reading of every workflow file in the repository. Per the color model's CI evidence rule, build-only CI caps the primary grade at yellow regardless of the fact that upstream does publish official riscv64 rustup binaries (Tier 2 with host tools) built from that same pipeline. This is consistent with, not contradicted by, Rust's own formal tier policy: Tier 2 is defined as "guaranteed to build," and only Tier 1 - the status riscv64gc-unknown-linux-gnu is explicitly still trying to reach via the open [RFC #3707](https://github.com/rust-lang/rfcs/pull/3707) - carries a test guarantee.

**Pending work that could change the grade:** RISE's Project RP004 (Codethink, SiFive, Rivos, Ferrous Systems) is funded specifically to close this gap and reach Tier 1, but is blocked on a concrete, unresolved infrastructure problem (test-suite runtime exceeding the Tier-1 performance cap), not a design disagreement - if RISE or another party supplies faster/more parallel riscv64 test hardware, or the test matrix is trimmed, the Tier-1 (and thus a blue/green re-evaluation) path opens. Separately, [#161385](https://github.com/rust-lang/rust/pull/161385) (d/f target-feature re-stabilization) is near merge, and the still-open silent-correctness bug [#146393](https://github.com/rust-lang/rust/issues/146393) and the SIGSEGV reports ([#143749](https://github.com/rust-lang/rust/issues/143749), [#157749](https://github.com/rust-lang/rust/issues/157749)) are exactly the class of defect that upstream test execution on riscv64 would be expected to catch before merge - their continued presence is itself evidence for why the color is capped at yellow rather than blue.

## 14. Investment Analysis

RISE has already funded and staffed the primary functional-enablement and Tier-1 gap-closing work for Rust (Project RP004: Codethink, SiFive, Rivos, Ferrous Systems), and has independently landed the musl Tier-2-with-tools promotion. The sizing below excludes that already-funded scope and focuses on gaps RISE's funded work does not cover or has not yet closed.

### 14.1 Functional Enablement

- Diagnose and fix the silent wrong-codegen bug [#146393](https://github.com/rust-lang/rust/issues/146393) (near-full register-reservation cases producing wrong results with no compile error) - this is a regalloc/LLVM-20-era regression, likely requires LLVM-side investigation as well as rustc-side triage.
- Root-cause the two open rustc SIGSEGV reports on real riscv64 hardware ([#143749](https://github.com/rust-lang/rust/issues/143749), [#157749](https://github.com/rust-lang/rust/issues/157749)) and the disputed memcpy-alignment report ([#145769](https://github.com/rust-lang/rust/issues/145769), currently stalled for lack of instruction-level debugging access on the reporter's hardware).
- Resolve the ABI-hazard class around FP target-feature disabling silently falling back to soft-float ([#132618](https://github.com/rust-lang/rust/issues/132618)) - this currently blocks stabilizing the RISC-V ratified-extension intrinsics tracked in [#114544](https://github.com/rust-lang/rust/issues/114544).
- Progress the `e` target-feature ABI design question left open by [#150257](https://github.com/rust-lang/rust/issues/150257) - primarily a compiler-team design decision, not a bulk-effort item.

### 14.2 Performance Optimization

- Implement RVV vector intrinsics (`core::arch::riscv64::v` does not currently exist at all) - this is a substantial, currently entirely unaddressed gap: no `vfloat32m1_t`-equivalent types, no vector codegen dispatch, nothing to use once `is_riscv_feature_detected!("v")` returns true.
- Investigate and fix RVV not being enabled under `-Ctarget-cpu=native` ([#138789](https://github.com/rust-lang/rust/issues/138789)).
- Address the smaller missed-optimization bugs (target-feature-gated intrinsics not inlined [#137293](https://github.com/rust-lang/rust/issues/137293), riscv64-specific missed match optimization [#136216](https://github.com/rust-lang/rust/issues/136216), suboptimal dual-exit codegen [#113346](https://github.com/rust-lang/rust/issues/113346)).

### 14.3 CI/CD Infrastructure

- Add actual test execution (not just build) to upstream riscv64 CI - the single structural gap keeping the color at yellow. This is precisely the scope RISE's RP004 contract is already targeting via RFC #3707, currently blocked on hardware/parallelism sufficient to bring `x.py test` under the infra team's runtime cap (currently ~3-6 hours depending on configuration, versus the required threshold). Do not re-fund this; track RFC #3707's progress instead.
- Consider funding additional riscv64 CI capacity/parallelism specifically to unblock the RFC #3707 performance requirement, if leadership wants to accelerate beyond RISE's current pace.

### 14.4 Ecosystem Enablement

Not applicable as a distinct workstream in this report - rustc/cargo is a toolchain, not itself a package ecosystem requiring per-package riscv64 enablement in the Section 10 sense. crates.io ecosystem-wide riscv64 build health for individual crates was outside the scope of this research pass and is not sized here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix silent wrong-codegen bug #146393 (regalloc/LLVM-20 regression) | 2-4 | Compiler team + LLVM liaison | Critical |
| Functional | Root-cause open SIGSEGV reports (#143749, #157749) and memcpy report (#145769) | 3-6 | Compiler team | High |
| Functional | Resolve FP target-feature soft-float ABI hazard (#132618) | 2-3 | Lang/compiler team | High |
| Functional | Resolve `e` target-feature negative-feature design question | 1-2 (design only) | Lang team | Medium |
| Performance | Design and implement RVV vector intrinsics (`core::arch::riscv64::v`) | 12-20 (new subsystem) | stdarch/compiler team | High (currently zero coverage) |
| Performance | Fix RVV not enabled under `-Ctarget-cpu=native` (#138789) | 1-2 | Compiler team | Medium |
| Performance | Address smaller missed-optimization bugs (#137293, #136216, #113346) | 2-4 | Compiler team | Low |
| CI/CD | Bring riscv64 test-suite runtime under Tier-1 infra cap (unblock RFC #3707) | already funded via RISE RP004 - track, do not re-fund | RISE / Codethink / SiFive / Rivos / Ferrous Systems | Critical (blocked, not un-staffed) |
| CI/CD | Add test execution to existing `dist-riscv64-linux-*` CI jobs (incremental, ahead of full Tier-1) | 2-4 | Infra team | High |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [rust-lang/rust repository](https://github.com/rust-lang/rust)
- [Rust homepage](https://www.rust-lang.org/)
- [Issue #150257 - Tracking Issue for riscv_target_feature](https://github.com/rust-lang/rust/issues/150257)
- [Issue #156191 - Tracking issue for MCP 982 (musl Tier 2 with tools)](https://github.com/rust-lang/rust/issues/156191)
- [Issue #160259 - Release-notes tracking for #158766](https://github.com/rust-lang/rust/issues/160259)
- [Issue #114544 - Tracking Issue for RISC-V Ratified Extensions Intrinsics](https://github.com/rust-lang/rust/issues/114544)
- [Issue #111192 - Tracking Issue for stdarch_riscv_feature_detection](https://github.com/rust-lang/rust/issues/111192)
- [Issue #111889 - Tracking Issue for riscv-interrupt ABIs](https://github.com/rust-lang/rust/issues/111889)
- [Issue #132618 - Target features must be restrained on RISCV](https://github.com/rust-lang/rust/issues/132618)
- [Issue #139479 - Code model other than medium fails with LTO on riscv64](https://github.com/rust-lang/rust/issues/139479)
- [Issue #145769 - RISC-V memcpy misaligned loads and stores](https://github.com/rust-lang/rust/issues/145769)
- [Issue #111700 - rustc fails to build for riscv64gc-unknown-linux-musl](https://github.com/rust-lang/rust/issues/111700)
- [Issue #157749 - rustc SIGSEGV on RISC-V hardware](https://github.com/rust-lang/rust/issues/157749)
- [Issue #143749 - rustc SIGSEGV compiling real crates on RISC-V](https://github.com/rust-lang/rust/issues/143749)
- [Issue #146393 - Incorrect codegen with reserved registers on RISC-V](https://github.com/rust-lang/rust/issues/146393)
- [Issue #156529 - float min/max NaN on riscv64](https://github.com/rust-lang/rust/issues/156529)
- [Issue #138789 - RVV not enabled with target-cpu=native](https://github.com/rust-lang/rust/issues/138789)
- [Issue #137293 - RISC-V intrinsics not inlined](https://github.com/rust-lang/rust/issues/137293)
- [Issue #136216 - Missed match optimization on RISC-V](https://github.com/rust-lang/rust/issues/136216)
- [Issue #113346 - Suboptimal dual-exit codegen on RISC-V](https://github.com/rust-lang/rust/issues/113346)
- [Issue #69689 - Atomics unusable with linker-plugin-lto on RISC-V](https://github.com/rust-lang/rust/issues/69689)
- [Issue #88995 - Zbuild-std broken for riscv32gc-unknown-linux-gnu](https://github.com/rust-lang/rust/issues/88995)
- [PR #161385 - riscv: stabilize d and f target features](https://github.com/rust-lang/rust/pull/161385)
- [PR #161064 - Revert d/e/f target-feature promotion](https://github.com/rust-lang/rust/pull/161064)
- [PR #158766 - Promote riscv64-unknown-linux-musl to tier 2 with host tools](https://github.com/rust-lang/rust/pull/158766)
- [PR #126641 - Enable riscv64gc-gnu testing](https://github.com/rust-lang/rust/pull/126641)
- [PR #52787 - Enable RISCV (original port)](https://github.com/rust-lang/rust/pull/52787)
- [RFC #3707 - Promote riscv64gc-unknown-linux-gnu to Tier-1](https://github.com/rust-lang/rfcs/pull/3707)
- [RISE Project RP004 blog post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [Ferrous Systems blog - Improving 64-bit RISC-V Linux support in Rust](https://ferrous-systems.com/blog/improving-64-bit-risc-v-support/)
- [RISE RISC-V Runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE members page](https://riseproject.dev/members/)
- [Rust Foundation members](https://rustfoundation.org/members)
- [Ubuntu 26.04 (Resolute) rustc package](https://packages.ubuntu.com/resolute/rustc)
- [TinyComputers.io - Would You Pay for RISC-V?](https://tinycomputers.io/posts/would-you-pay-for-risc-v.html)
- [wasmtime#13959 - Cranelift crash in riscv64 isle](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [wasmtime#12195 - ISLE panic on riscv64](https://github.com/bytecodealliance/wasmtime/issues/12195)
- [llvm#221521 - O2 compiler hang on riscv64](https://github.com/llvm/llvm-project/issues/221521)
- [llvm#221163 - RVV loop-carried WAR hazard](https://github.com/llvm/llvm-project/issues/221163)
- [openssl#31080 - AES T-table not constant-time on riscv64](https://github.com/openssl/openssl/issues/31080)
- [openssl#22166 - SSL test hangs at high parallelism on riscv64](https://github.com/openssl/openssl/issues/22166)
- [zlib#1099 - RVV Adler32 perf PR, unmerged](https://github.com/madler/zlib/pull/1099)
- [zstd#4622 - HUF_4X2_4WAY not enabled on riscv64](https://github.com/facebook/zstd/issues/4622)
