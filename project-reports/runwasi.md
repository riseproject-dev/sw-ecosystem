---
title: runwasi
parent: Project Reports
color: orange
dependencies:
  - name: wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: WasmEdge
    relation: runtime-dependency
    criticality: optional
  - name: wasmer
    relation: runtime-dependency
    criticality: optional
  - name: WAMR
    relation: runtime-dependency
    criticality: optional
  - name: youki
    relation: runtime-dependency
    criticality: optional
  - name: containerd
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="runwasi" %}

# runwasi

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for runwasi<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

runwasi is a pure-Rust containerd sub-project that provides containerd shims (`containerd-shim-wasmtime`, `containerd-shim-wasmedge`, `containerd-shim-wasmer`, `containerd-shim-wamr`) enabling containerd to run WebAssembly/WASI workloads as if they were OCI containers. It does not implement any guest-execution logic itself: each shim wraps a third-party Wasm runtime (wasmtime, WasmEdge, wasmer, or WAMR) and handles the OCI/containerd lifecycle plumbing (via `libcontainer`/youki), leaving all architecture-specific code generation and execution to the wrapped runtime.

**License:** Apache 2.0. **Foundation:** Cloud Native Computing Foundation (CNCF); runwasi is explicitly a "non-core containerd sub-project" and inherits containerd's governance rather than holding independent CNCF project status. Communication happens on CNCF Slack (`#runwasi`) and a biweekly public community call.

**Corporate backing:** the project was founded at Docker (first commit 2022-01-27, `cpuguy83`/Brian Goff) but is now dominated by Microsoft: 6 of 10 listed maintainers/reviewers are Microsoft-affiliated (`mossaka`, `danbugs`, `devigned`, `jsturtevant`, `andreiltd`, plus `cpuguy83` who has since moved to Microsoft/Azure). Docker (1, `rumpl`) and Intel (1, `ipuustin`) retain a foothold; Preferred Networks (1, `utam0k`) is the only non-US/non-hyperscaler affiliation. `jprendes` lists no company. Commit-count leaderboard: Jiaxiao Zhou/Microsoft (~580 commits), Jorge Prendes (266), Brian Goff (167), James Sturtevant/Microsoft (161).

**Community culture on new ports:** no formal CPU-architecture tier policy exists. `CONTRIBUTING.md` documents a policy for adding new **Wasm-runtime shims** (not CPU architectures): open an issue first, adopt the WASI spec, and commit to ongoing maintenance; an unmaintained shim is flagged after 6 months and removed after 1 month without a new maintainer. RISC-V has never surfaced as a topic requiring this kind of policy discussion in the project's history.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-11-07 | Issue [#722](https://github.com/containerd/runwasi/issues/722) opened: multi-arch (amd64/arm64/riscv64) image-pull failure, riscv64 reproduces the same generic bug as the other two arches | [Issue #722](https://github.com/containerd/runwasi/issues/722) |
| 2024-12-08 | Issue [#767](https://github.com/containerd/runwasi/issues/767) opened: wasmtime shim panics on RISCV64 with `mmap failed to reserve 0x5dc80000000 bytes... Cannot allocate memory (os error 12)` during engine creation | [Issue #767](https://github.com/containerd/runwasi/issues/767) |
| 2024-12-09 | PR [#768](https://github.com/containerd/runwasi/pull/768) merged, fixing #767 with a one-line change (`config.static_memory_maximum_size(1 << BITS_TO_TEST)`) in `crates/containerd-shim-wasmtime/src/instance.rs` | [PR #768](https://github.com/containerd/runwasi/pull/768) |
| 2024-12-09 | Issue #767 closed as completed, same day as the fix | [Issue #767](https://github.com/containerd/runwasi/issues/767) |
| 2026-08-19 | Issue #722 closed "not planned" (root cause was a generic `ctr` platform-index/content-store behavior, unrelated to riscv64 specifically) | [Issue #722](https://github.com/containerd/runwasi/issues/722) |

**Key contributors to the only RISC-V-relevant work:** `matsbror` (reporter of both issues, Wasm/riscv64 end user), `andreiltd` (Microsoft-affiliated, authored the fix PR #768), `jprendes` (reviewer/approver), `Mossaka` (Microsoft-affiliated, triage).

**Is it fully upstream?** No RISC-V port exists to be "upstream" or not. The only artifact is a single one-line bugfix (#768) that happened to unblock a user who was manually building and running the wasmtime shim on riscv64 hardware outside any official CI or release path. There is no riscv64 build target, CI job, or release train in the project at any point in its history (1,973 commits back to 2022-01-27; `git log -S"riscv"` / `-S"riscv64"` returns zero hits).

## 3. Upstream Support Tier

No formal architecture-tier policy exists for runwasi. Evidence of actual tier status is CI- and release-derived:

| | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | No -- `arch: ["x86_64", "aarch64"]` is a hardcoded 2-element matrix in [`ci.yml`](https://github.com/containerd/runwasi) and `release.yml` |
| CI test execution | Yes | Yes | No |
| Official release binary | Yes (`*-x86_64-linux-musl.tar.gz`) | Yes (`*-aarch64-linux-musl.tar.gz`) | No -- confirmed absent from every SHA256SUMS manifest across all four shim release trains (wasmtime, wasmedge, wasmer, wamr) |
| Cross.toml target | Yes | Yes | No |
| rust-toolchain.toml target | Implicit (host) | Yes (cross) | No |

Every architecture-facing configuration file in the repository (`Cross.toml`, `rust-toolchain.toml`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`) enumerates exactly two architectures. There is no build-blocking or non-blocking riscv64 job of any kind.

## 4. Technical Architecture and RISC-V-Specific Subsystems

runwasi contains no architecture-specific subsystems of its own (no JIT, no SIMD, no crypto, no assembly, no GC barriers in-tree) -- all such logic lives in the wrapped Wasm runtimes. A repo-wide `search_code` for `riscv64` (bare), `target_arch riscv64`, `riscv64gc`, `rvv`, and `vfloat32m1_t` all returned **zero hits**. By contrast, `aarch64` appears in 7 files and `x86_64` in 15 files (`Cross.toml`, `cross/Dockerfile.gnu`, `cross/Dockerfile.musl`, `ci.yml`, `release.yml`, `Cargo.lock`, `crates/stress-test/src/containerd/client.rs`, docs, scripts).

The one place architecture identity is handled in Rust source is `crates/stress-test/src/containerd/client.rs`:
```rust
match platform.architecture() {
    Arch::Amd64 => cfg!(target_arch = "x86_64"),
    Arch::ARM64 => cfg!(target_arch = "aarch64"),
    _ => false,
}
```
riscv64 falls into the `_ => false` catch-all -- there is not even an `Arch::Riscv64` enum variant to be a stub of. This is classified **MISSING**, not "partial" or "scalar fallback": there is no riscv64 code path anywhere in the tree to grade the quality of.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch-detection enum (`stress-test`) | Explicit `Arch::Amd64` arm | Explicit `Arch::ARM64` arm | Missing -- falls into `_ => false` |
| Cross-compile Dockerfile | `cross/Dockerfile.gnu`/`.musl`, hardcoded `x86_64` branch | Hardcoded `aarch_64` branch | No branch; unhandled `uname -m` |
| JIT/SIMD/crypto | N/A (delegated to backend crate) | N/A (delegated to backend crate) | N/A (delegated to backend crate; see Section 9) |

## 5. Build System, Cross-Compilation, and Toolchain

runwasi is a pure Cargo workspace; there is no CMake, no `BUILDING.md`, and no `docs/cross-compilation.md`. Build orchestration is a `Makefile` (`make build`, `make build-wasmtime`, etc.) driving `cargo build --target=<TARGET>`.

- **Cross-compilation tool:** [`cross`](https://github.com/cross-rs/cross), configured via `Cross.toml`, which defines exactly four targets: `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`. No `riscv64gc-unknown-linux-*` target block exists.
- **Toolchain pin:** `rust-toolchain.toml` pins `channel = "1.91.1"`, `targets = ["wasm32-wasip1"]` -- no riscv64gc host target is declared. No riscv64-specific GCC/Clang minimum version is documented anywhere, because no riscv64 target exists to document one for.
- **QEMU:** not used anywhere in this repository for riscv64 (or any other emulated target).
- **riscv64 Dockerfile:** none exists. Both `cross/Dockerfile.gnu` and `cross/Dockerfile.musl` hard-branch their protoc-download logic on `uname -m` = `x86_64` -> `x86_64` and `aarch64` -> `aarch_64`; any other value (riscv64 included) falls through unhandled.
- **Known build failures:** none documented, because riscv64 has never been attempted through the official build path. The only known riscv64 failure is a runtime crash (issue #767, Section 11), which occurred with a manually-built shim outside this build system.

To add riscv64 support, an implementer would need: a new `Cross.toml` target entry, a `riscv64gc-unknown-linux-*` addition to `rust-toolchain.toml`, a new `cross/Dockerfile.*riscv64` image, and a new CI matrix entry -- none of which currently exist upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Shim builds via official cross toolchain | Yes | Yes | No target defined |
| Shim runs under CI test suite | Yes | Yes | No CI exists |
| Official release binary | Yes | Yes | No |
| User-reported functional status | Working | Working | One user got the wasmtime shim panicking on engine creation (#767, since fixed at the code level but never validated in CI); WAMR shim reported working as a substitute |

**Functional gaps:** riscv64 cannot be obtained as an official binary through any channel (Section 8); a user must self-build with a hand-modified toolchain configuration, since the official `Cross.toml`/CI path does not cover it.

**Performance gaps:** Data not available: no benchmark data of any kind exists for runwasi on riscv64 (WebSearch for "runwasi riscv64 benchmark", "runwasi riscv64 vs arm64 performance" returned no runwasi-specific results in any year 2024-2026).

**Security hardening gaps:** Data not available: no riscv64-specific security/hardening discussion was found for runwasi itself; hardening posture is inherited from the wrapped Wasm runtime and from `libcontainer`/youki (see Section 9), neither of which has riscv64 CI.

**NaN / floating-point semantics issues:** Data not available: no NaN or floating-point semantics issue specific to runwasi on riscv64 was found in issue search (queries for "riscv64 NaN floating" returned only the single #767 result, which is a memory-allocation bug, not an FP semantics bug).

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** This was verified directly by cloning `containerd/runwasi` at commit `f1401719a3e981956ced9cd685abb2a49190bd1c` and running a repository-wide case-insensitive `grep -ri riscv` across the entire tree: zero matches, not limited to `.github/workflows/`. All 15 workflow files (`action-build.yml`, `action-check.yml`, `action-test-image.yml`, `action-test-k3s.yml`, `action-test-kind.yml`, `action-test-smoke.yml`, `benchmarks.yml`, `ci.yml`, `docs.yml`, `labeler.yml`, `release-wasi-demo-app.yml`, `release.yml`, `sbom.yml`, `scorecard-analysis.yml`, `sign.yml`) were individually inspected. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

- **Build matrix** (`ci.yml`, appears twice -- shim build matrix and oci-tar-builder matrix): `arch: ["x86_64", "aarch64"]`, a hardcoded 2-element array.
- **Runners:** every `runs-on` resolves to `ubuntu-latest` or `ubuntu-22.04`; no self-hosted or riscv64-labeled runner exists.
- **RISE runners:** no evidence runwasi CI uses RISE RISC-V Runners; no reference to `riseproject-dev` or a RISE runner label anywhere in the workflow files.
- **Triggers:** `ci.yml` triggers on `push`/`pull_request` to `main` -- genuinely active CI, but with zero riscv64 coverage of any kind (build, test, or QEMU-emulated).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | No |
| CI test execution | Yes | Yes | No |
| Release-blocking | Yes (via matrix) | Yes (via matrix) | N/A -- no job exists |
| Hardware/QEMU | GitHub-hosted (native) | GitHub-hosted (cross via `cross`) | N/A |

## 8. Distribution and Release Status

**No riscv64 binary exists for runwasi through any channel checked.**

- **GitHub Releases (authoritative, cryptographic-manifest-level check):** the self-published `SHA256SUMS` manifest for the latest tag of each shim train lists exactly two assets, `aarch64-linux-musl.tar.gz` and `x86_64-linux-musl.tar.gz` -- for `containerd-shim-wasmtime/v0.6.1`, `containerd-shim-wasmedge/v0.6.1`, `containerd-shim-wasmer/v0.6.1`, and `containerd-shim-wamr/v0.2.1`. Guessed riscv64 asset names (`-riscv64-linux-musl.tar.gz`, `-riscv64-linux-gnu.tar.gz`, `-riscv64gc-linux-musl.tar.gz`) all returned HTTP 404, while the known aarch64 asset returned HTTP 200, confirming the download endpoint works and riscv64 simply has no published asset.
- **Ubuntu 26.04 (resolute):** [`packages.ubuntu.com` search](https://packages.ubuntu.com/search?keywords=runwasi&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" -- no `runwasi` package exists for resolute on **any** architecture, not just riscv64. Project-graph SPARQL query (`runwasi`/`python3-runwasi`/`librunwasi` x riscv64 x resolute) independently confirms an empty result set.
- **PyPI:** `https://pypi.org/pypi/runwasi/json` returns HTTP 404 -- not a Python package (expected, given it's a Rust/Go containerd shim); project-graph `PythonPackage` query for `runwasi` also returns empty.
- **RISE GitLab PyPI mirror:** redirects to pypi.org, which 404s.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no `runwasi` package listed.

**What a user must do to get a working binary today:** self-build from source using `cargo build` with a manually-configured riscv64gc target (there is no `Cross.toml` entry or CI validation for this path), as the one documented riscv64 user (issue #767) evidently did.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **wasmtime** (36.0.10, Cranelift) | JIT/AOT backend for `containerd-shim-wasmtime` | Cranelift has an in-tree riscv64 backend; not in the project-graph (no Ubuntu package, crates.io-only) | wasmtime classifies `riscv64gc-unknown-linux-gnu` as Tier 3 -- "not production-ready," no continuous fuzzing requirement met | No official riscv64 release guarantee (Tier 3 has none) | Open upstream: [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) Cranelift crash in riscv64 ISLE, [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) run/compile fail on riscv64, [#9186](https://github.com/bytecodealliance/wasmtime/issues/9186) missing overflow instrs on riscv64/s390x, [#12197](https://github.com/bytecodealliance/wasmtime/issues/12197) tracking issue for missing ISLE lowering rules, [#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) bus error on unaligned atomics. Downstream: runwasi [#767](https://github.com/containerd/runwasi/issues/767), fixed by [#768](https://github.com/containerd/runwasi/pull/768). |
| **WasmEdge** (`wasmedge-sdk` 0.14.0) | JIT/AOT backend for `containerd-shim-wasmedge` | Not in project-graph. Upstream port merged, CI-green (cross-compiled + QEMU) since 2023 | Curated "quick tests" subset under QEMU only; heavy/flaky suites and optional plugins excluded | None -- no riscv64 asset in any WasmEdge release | Full detail in `project-reports/wasmedge.md` (readiness: blue) |
| **wasmer** (7.1.0) + **wasmer-wasix** (0.701.0) | JIT backend (Cranelift default) for `containerd-shim-wasmer` | Not in project-graph. Builds for riscv64gc via Cranelift/LLVM | Partial -- SIMD spec tests explicitly skip-listed on riscv64 ([`ignores.txt`](https://github.com/wasmerio/wasmer/issues/5811)) | Best-positioned of the four: official GitHub Release binaries since v3.2.0 (`wasmer-linux-riscv64.tar.gz`) | Open: [#6078](https://github.com/wasmerio/wasmer/issues/6078) SIMD ext ops crash Cranelift on RISC-V, [#5816](https://github.com/wasmerio/wasmer/issues/5816) `skip_stack_guard_page` crashes on riscv64gc |
| **WAMR** (`wamr-rust-sdk`, git tag v1.1.0) | Interpreter/AOT/fast-JIT backend for `containerd-shim-wamr` | Not in project-graph; source-built only via git dependency, not even a crates.io release | Upstream spectest-on-riscv64 enabled since [PR #2843](https://github.com/bytecodealliance/wasm-micro-runtime/pull/2843) (merged 2023) | No packaging of any kind | Most mature riscv64 story of the four backends (5 of 6 riscv64-titled upstream issues resolved); one open memory-correctness bug, [#2136](https://github.com/bytecodealliance/wasm-micro-runtime/issues/2136) "unaligned memory access on RISCV64 targets" (open since Apr 2023). This is the runtime the #767 reporter switched to as a working alternative. |
| **libcontainer** (youki-dev/youki, workspace dep 0.6) | OCI container-lifecycle backend required by every shim | Not in project-graph. No `Cross.toml` riscv64 target upstream | No CI (youki's 13 workflow files have zero riscv matches; matrix is `["x86_64","aarch64"]` only) | None -- not packaged anywhere | Full detail in `project-reports/youki.md` (readiness: orange). Non-optional `rust-criu` dependency needs Linux kernel >=6.12-rc7 on riscv64 and lacks RVV vector-register save/restore. A riscv64 dev-tooling reference was added 2025-05 then removed 2026-04 ([PR #3497](https://github.com/youki-dev/youki/pull/3497)) -- a negative signal. |
| **libseccomp** (transitive, via libcontainer) | Syscall filtering | **Found in Ubuntu 26.04 riscv64** (`libseccomp2`, `libseccomp-dev`, suite resolute) | No upstream non-amd64 CI, but distro packages current and downstream-validated (5,229/5,229 tests passed on real riscv64 hardware at merge, Feb 2020) | Ships in Debian Trixie, Ubuntu, Arch RISC-V | Fully solved. See `project-reports/libseccomp.md`. |
| **containerd** (host project) | Shim host / gRPC-ttrpc client | **Found in Ubuntu 26.04 riscv64** | Nightly cross-compile CI on riscv64; integration test suite not yet running on riscv64, pending [PR #13124](https://github.com/containerd/containerd/pull/13124) | Static binaries available | Open tracking: [#13020](https://github.com/containerd/containerd/issues/13020) add linux/riscv64 to CI test matrix. See `project-reports/containerd.md`. |

**wasmtime, wasmer, and WAMR/wasm-micro-runtime are not currently tracked as separate entries in `projects.yml`** and have no existing per-project report; given they are runwasi's primary JIT backends and each carries its own distinct riscv64 maturity level, they represent a research gap worth closing independently of this report.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [containerd/runwasi#767](https://github.com/containerd/runwasi/issues/767) | Memory allocation problem with wasmtime on RISCV64 | Closed (completed) | Was correctness-blocking (shim panicked on startup) | Fixed same-day by [PR #768](https://github.com/containerd/runwasi/pull/768); root cause was wasmtime's pooling-allocator probe reserving an oversized (~6.4 TB) memory region that riscv64's mmap/address-space behavior rejected with `ENOMEM`. Correctness bug, now resolved in-tree but never validated by any CI. |
| [containerd/runwasi#722](https://github.com/containerd/runwasi/issues/722) | Issues pulling Wasm image to run on the Wasmtime shim | Closed (not planned) | Low -- generic, not riscv64-specific | riscv64 was one of three architectures (amd64/arm64/riscv64) where the same `ctr` content-store/platform-index bug reproduced identically; resolved operationally via `--all-platforms`, not a code fix. |

**No open riscv64 bugs remain in runwasi.** Both known items are closed. No CI exists to catch regressions of the fix in #768.

**Upstream dependency bugs (not tracked as runwasi issues, but block runwasi's riscv64 usability):** open wasmtime Cranelift/riscv64 issues (Section 9), open wasmer SIMD/riscv64 issues (Section 9), and the open WAMR unaligned-memory issue (Section 9) all remain live risk for any runwasi shim built for riscv64.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer or issue thread has argued against riscv64 support; the topic has simply never been raised as a port proposal.

**Technical blockers:**
- No riscv64 entry in `Cross.toml`, no riscv64 target in `rust-toolchain.toml`, no riscv64 CI matrix entry, no riscv64 cross-compilation Dockerfile -- all four would need to be added before an official build path exists.
- Backend maturity varies sharply: wasmtime (the default/most-used backend) is officially Tier 3 upstream (not production-ready on riscv64gc); `libcontainer`/youki, required by every shim, has zero riscv64 CI and depends on `rust-criu`, which needs a kernel >=6.12-rc7 and lacks RVV register save/restore.

**Organizational blockers:** no RISE (riseproject.dev) involvement of any kind was found -- runwasi is not a RISE member-company project, has no RISE blog coverage, no RISE working-group reference, and no evidence of RISE runner usage in its CI. Its dominant corporate backer (Microsoft) and secondary backer (Docker) do not appear on the RISE Premier or General member lists. No dedicated resourcing exists anywhere for a riscv64 port.

**Acceptance probability:** Data not available for a formal estimate; qualitatively, the project's stated shim-addition policy (open an issue, commit to maintenance) suggests a low-friction contribution path for the runwasi-side work (four config files, one CI matrix entry) if a contributor and their organization commit to it -- but the harder blocker is upstream backend maturity (wasmtime Tier 3, youki no riscv64 CI at all), which runwasi cannot fix by itself.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, and no distribution ships the package under any name at all -- so the yellow/orange distribution floor cannot be applied, since there is no downstream package to floor upon)
- **Release provider:** none -- no riscv64 build of runwasi is published by upstream, by any Linux distribution, by RISE, or by any third party
- runwasi is not itself an optimization-purpose project (it is an OCI/containerd integration shim, not a project whose value proposition is RISC-V-specific speed), so the Step 2 optimization modifier does not apply and Optimization level is omitted.
- **Justification:** upstream CI (`.github/workflows/ci.yml`, `release.yml`) hardcodes its build/test matrix to `arch: ["x86_64", "aarch64"]` with no riscv64 entry, confirmed by a repository-wide `grep -ri riscv` returning zero matches ([source](https://github.com/containerd/runwasi)); GitHub release `SHA256SUMS` manifests for all four shim trains list only `aarch64-linux-musl` and `x86_64-linux-musl` assets ([latest wasmtime-shim release](https://github.com/containerd/runwasi/releases)); and no Linux distribution, PyPI, or RISE channel ships a `runwasi` package at all ([Ubuntu package search](https://packages.ubuntu.com/search?keywords=runwasi&suite=resolute&searchon=names&section=all)). The single riscv64 bug on record (issue [#767](https://github.com/containerd/runwasi/issues/767)) was fixed within 24 hours ([PR #768](https://github.com/containerd/runwasi/pull/768)), but that fix has never been exercised by any CI job, so it provides no ongoing assurance.
- **Pending work that could change the grade:** none identified. No open PR adds riscv64 CI, a `Cross.toml` target, or a release matrix entry; no RISE involvement was found in any channel checked (blog, working groups, member list, GitHub org). The grade would move to yellow if a distribution began shipping an unpatched riscv64 build, or to blue/green if upstream added a riscv64 CI job that runs (blue) and eventually ships a release artifact (green).

## 14. Investment Analysis

RISE has not funded or performed any work specific to runwasi (Section 12) -- none of the sizing below is already covered.

### 14.1 Functional Enablement

Add a riscv64 target to `Cross.toml`, extend `rust-toolchain.toml`, add a riscv64 cross-compilation Dockerfile (following the existing `cross/Dockerfile.gnu`/`.musl` pattern), and get all four shims (wasmtime, wasmedge, wasmer, wamr) building. Because runwasi has no riscv64-specific source code to write (Section 4), this is primarily plumbing plus dealing with whichever backend crate fails to build first -- most likely `libcontainer`/youki (no riscv64 CI, `rust-criu` kernel-version requirement) or wasmtime (Tier 3, open Cranelift riscv64 issues). Re-validating and re-landing the fix pattern from [PR #768](https://github.com/containerd/runwasi/pull/768) style issues across all four backends should be expected.

### 14.2 Performance Optimization

Not applicable to runwasi directly -- there is no runwasi-owned hot path to optimize. Any performance work belongs in the wrapped JIT backends (wasmtime/Cranelift, wasmer/Cranelift-or-LLVM, WAMR); see the corresponding upstream projects' own investment analyses once those reports are written (Section 9 notes wasmtime/wasmer/WAMR are not yet tracked in `projects.yml`).

### 14.3 CI/CD Infrastructure

Add a `riscv64` entry to the `arch` matrix in `ci.yml` and `release.yml` (currently hardcoded to `["x86_64", "aarch64"]`), decide between native riscv64 runners (e.g. RISE RISC-V Runners, not currently used by this project) versus QEMU cross-testing, and wire test execution (not just build) to reach blue/green rather than yellow.

### 14.4 Ecosystem Enablement

Not applicable -- runwasi has no dependent package ecosystem (Section 10 omitted; it is a standalone set of containerd shim binaries, not a library consumed by a package registry).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 target to `Cross.toml`, `rust-toolchain.toml`, and a cross-compile Dockerfile; get all four shims building | 2-4 | Data not available: no named owner or in-progress effort found | High |
| Functional | Resolve `libcontainer`/youki riscv64 build/CI gap (blocking dependency for every shim) | Data not available: sizing depends on youki's own port status; see `project-reports/youki.md` | Data not available | Critical (blocks all shims) |
| CI/CD | Add riscv64 to `ci.yml`/`release.yml` build matrix (build-only first, yellow-equivalent) | 1-2 | Data not available | High |
| CI/CD | Extend riscv64 CI to run the test suite (blue-equivalent) | 1-2 (after build-only lands) | Data not available | Medium |
| Distribution | Publish riscv64 release assets for all four shim trains (green-equivalent) | 0.5-1 (mostly CI matrix + release workflow changes once build/test exist) | Data not available | Medium |
| Performance | Track and consume upstream wasmtime Tier 3 -> Tier 2/1 progress on riscv64gc | N/A to runwasi directly | Upstream (bytecodealliance/wasmtime) | Informational |

## 15. Updates
(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [containerd/runwasi repository](https://github.com/containerd/runwasi)
- [Issue #767 -- Memory allocation problem with wasmtime on RISCV64](https://github.com/containerd/runwasi/issues/767)
- [PR #768 -- Set memory maximum size when checking pool allocation](https://github.com/containerd/runwasi/pull/768)
- [Issue #722 -- Issues pulling Wasm image to run on the Wasmtime shim](https://github.com/containerd/runwasi/issues/722)
- [Ubuntu package search for runwasi (suite resolute)](https://packages.ubuntu.com/search?keywords=runwasi&suite=resolute&searchon=names&section=all)
- [PyPI JSON API for runwasi (404)](https://pypi.org/pypi/runwasi/json)
- [wasmtime issue #13959 -- Cranelift crash in riscv64 ISLE](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [wasmtime issue #11050 -- run/compile fail on riscv64 backend](https://github.com/bytecodealliance/wasmtime/issues/11050)
- [wasmtime issue #9186 -- missing overflow instructions on riscv64/s390x](https://github.com/bytecodealliance/wasmtime/issues/9186)
- [wasmtime issue #12197 -- riscv64 tracking issue, missing ISLE lowering rules](https://github.com/bytecodealliance/wasmtime/issues/12197)
- [wasmtime issue #5882 -- bus error, unaligned atomics on RISC-V](https://github.com/bytecodealliance/wasmtime/issues/5882)
- [wasmer issue #6078 -- SIMD ext ops crash Cranelift on RISC-V](https://github.com/wasmerio/wasmer/issues/6078)
- [wasmer issue #5816 -- skip_stack_guard_page crashes on riscv64gc](https://github.com/wasmerio/wasmer/issues/5816)
- [wasmer issue #5811 -- SIMD spec test skip-list on riscv64](https://github.com/wasmerio/wasmer/issues/5811)
- [wasm-micro-runtime issue #2136 -- unaligned memory access on RISCV64 targets](https://github.com/bytecodealliance/wasm-micro-runtime/issues/2136)
- [wasm-micro-runtime PR #2843 -- enable spectest on riscv64](https://github.com/bytecodealliance/wasm-micro-runtime/pull/2843)
- [youki PR #3497 -- removal of riscv64 dev-tooling reference](https://github.com/youki-dev/youki/pull/3497)
- [containerd PR #13124 -- riscv64 integration test coverage](https://github.com/containerd/containerd/pull/13124)
- [containerd issue #13020 -- add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE project blog index (sitemap)](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- `project-reports/wasmedge.md` (readiness: blue)
- `project-reports/youki.md` (readiness: orange)
- `project-reports/libseccomp.md`
- `project-reports/containerd.md`
