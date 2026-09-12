---
title: Wasmer
parent: Project Reports
color: green
dependencies:
  - name: Wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: runtime-dependency
    criticality: optional
  - name: corosensei
    relation: runtime-dependency
    criticality: critical
  - name: libunwind
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="wasmer" %}

# Wasmer

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Wasmer<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wasmer is a WebAssembly runtime written in Rust, providing three interchangeable JIT/AOT compiler backends (Cranelift, LLVM, Singlepass) plus a universal/dylib engine model, a CLI, and language bindings (Python, C-API, etc.).

Wasmer is not a foundation-governed project. It is a Y Combinator-backed commercial entity ("Wasmer Inc."). It is not a member of the Bytecode Alliance (checked the member list at [bytecodealliance.org](https://bytecodealliance.org/) - Anaconda, Fastly, Fermyon, Microsoft, Mozilla, Shopify, Stellar Development Foundation, and others appear; Wasmer does not) and is not a member of the RISE Project (checked [riseproject.dev/members](https://riseproject.dev/members/) - 8 Premier members including Google, NVIDIA, Qualcomm, SiFive, and 12 General members including Canonical, Microchip, ZTE; Wasmer is absent from both tiers).

There is no `GOVERNANCE.md`, `MAINTAINERS.md`, or `OWNERS` file in the repository (both return 404). The closest governance artifact is `.github/CODEOWNERS`, which assigns nearly every core directory (`lib/api`, `lib/cli`, `lib/compiler*`, `lib/engine*`, `lib/vm`, `lib/wasmer-types`, `scripts`) to a single person: **@syrusakbary** (Syrus Akbary, Wasmer's founder/CEO). This is a BDFL/company-centric governance model, not a multi-stakeholder process. License: MIT.

RISC-V-relevant contributors identified from commit history are largely community/external or affiliated with other organizations rather than Wasmer Inc. directly: **ptitSeb** (Sebastien Chevalier, authored the original RISC-V PR), **xdoardo** (Edoardo Marangoni, maintained RISC-V build reinstatement in 2024-2025), **marxin** (Martin Liska, current primary RISC-V maintainer), and **wakabat**, an external downstream embedded/bare-metal RISC-V user who has repeatedly found and fixed real blocking bugs (a Singlepass far-jump relocation failure, unaligned-memory-access and trap-handling gaps) rather than a paid Wasmer Inc. engineer. A complete ranked, company-affiliated contributor list could not be obtained (`api.github.com/repos/wasmerio/wasmer/contributors` returned 403 during research) [NEEDS VERIFICATION].

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-05-18 | Issue #1448 opened: cross-compiling to riscv64gc fails outright (no Cranelift ISA support) | [#1448](https://github.com/wasmerio/wasmer/issues/1448) |
| 2022-02-19 | PR #2799 "Add riscv64 support (wasmer-vm)" opened by tnayuki, **closed unmerged** the next day | [#2799](https://github.com/wasmerio/wasmer/pull/2799) |
| 2022-11-15 | Issue #3306 opened: feature request for RISC-V Cranelift support | [#3306](https://github.com/wasmerio/wasmer/issues/3306) |
| 2023-03-22 | **PR #3244 merged**: "Feat riscv llvm and cranelift", the original bring-up for both LLVM and Cranelift backends, by ptitSeb; bumped Rust toolchain to 1.65 | [#3244](https://github.com/wasmerio/wasmer/pull/3244) |
| 2023-03-24 | First shipped release with riscv64: v3.2.0-beta.1 | Release index (verified during PR merge-status check) |
| 2023-04-14 | PR #3706 merged: CI adds riscv64 to test/build matrix | [#3706](https://github.com/wasmerio/wasmer/pull/3706) |
| 2023-06-13 / 06-16 | PR #3992 and #4002 merged: CI cross-image fixes (Debian bookworm, simpler package install) | [#3992](https://github.com/wasmerio/wasmer/pull/3992), [#4002](https://github.com/wasmerio/wasmer/pull/4002) |
| 2024-10-21 | riscv64/aarch64 explicitly **disabled** as release-blocking requirements and asset upload, due to CI instability (commits `ab0f3d3`, `fb537fd`, maminrayej) | Commit search |
| 2024-10-30 / 11-01 | riscv64 build **reinstated** (xdoardo, commits `5eac95c`/`108c835`) | Commit search |
| 2025-02-07 | Fix: add `UNWIND_DATA_REG`s for riscv64/loongarch64 targets (xdoardo) | Commit `0f7f7b1` |
| 2025-08-29 to 2026-01-14 | **PR #5711 merged**: "SinglePass: add support for riscv64 target" (marxin, with a critical far-jump-relocation fix contributed by wakabat); claims all 104 spec tests pass at merge | [#5711](https://github.com/wasmerio/wasmer/pull/5711) |
| 2026-01-14 | **PR #6053 merged**, same day: "chore(singlepass): drop `riscv` feature gate" | [#6053](https://github.com/wasmerio/wasmer/pull/6053) |
| 2026-01-13 | PR #6007 merged: enable riscv32 in LLVM backend + relocation fixes | [#6007](https://github.com/wasmerio/wasmer/pull/6007) |
| 2026-01-22 | PR #6072 merged: fix LLVM riscv64 calling conventions for i32; PR #6093 merged: "CI: skip tests on RISC-V and LoongArch64" | [#6072](https://github.com/wasmerio/wasmer/pull/6072), [#6093](https://github.com/wasmerio/wasmer/pull/6093) |
| 2026-01-23 | First shipped release with Singlepass riscv64 code present: v7.0.0-rc.1 | Release index |
| 2026-05-13 | PR #6388 merged: `--enable-experimental-unaligned-memory-accesses` flag (successor to #6354/#6351) | [#6388](https://github.com/wasmerio/wasmer/pull/6388) |
| 2026-05-27 / 06-04 | PR #6604 and #6663 merged: soft-float libcall support for cross-compiling to hardware-FP-less riscv64 | [#6604](https://github.com/wasmerio/wasmer/pull/6604), [#6663](https://github.com/wasmerio/wasmer/pull/6663) |
| 2026-07-28 | PR #6828 merged (breaking): drops the never-properly-tested rv32 LLVM target, narrowing to riscv64 only | [#6828](https://github.com/wasmerio/wasmer/pull/6828) |
| 2026-08-18 | PR #6895 merged (most recent riscv64-relevant change found): fixes double stack usage on 16-byte-alignment platforms (AArch64/RISC-V) in Singlepass | [#6895](https://github.com/wasmerio/wasmer/pull/6895) |

**Fully upstream?** Yes - all currently-active RISC-V code lives in `wasmerio/wasmer` main branch; there is no fork or out-of-tree patch set. There is no single master tracking issue; PR #3244 (LLVM+Cranelift) and PR #5711 (Singlepass) function as the de facto tracking PRs, each carrying its own embedded TODO checklist.

**Contradiction flagged:** PR #6053's title, "drop the `riscv` feature gate," is ambiguous from the title alone - it could mean either removing a Cargo feature flag that previously gated an opt-in unstable path (i.e., making riscv64 Singlepass unconditionally compiled), or removing riscv64 support from Singlepass outright. Independently, live inspection of the current `Makefile` (Section 5) shows the `ENABLE_SINGLEPASS` block checks only `IS_AMD64` and `IS_AARCH64`, never `IS_RISCV64`, and `docs/RISCV.md` (treated by the build-system researcher as the current, authoritative statement) explicitly says "Singlepass can be done, but no resources are allocated on this task for now." Both sources point to Singlepass riscv64 not being part of the default/CI-invoked build today, despite the PR #5711 code (`riscv_decl.rs`, `emitter_riscv.rs`, `machine_riscv.rs`) being present in-tree and continuing to receive fixes (PR #6389 April 2026, PR #6895 August 2026, PR #6252 closed unmerged March 2026). This is noted as a discrepancy rather than resolved definitively - the diff content of #6053 was not read.

## 3. Upstream Support Tier

**No formal, published tier policy.** `PLATFORMS.md`, `docs/platforms/`, and any `SUPPORT.md`-style document all return 404 in the repository - there is no explicit tier-1/2/3 support matrix comparable to, e.g., Rust's platform tiers.

In practice, riscv64's history shows an informal, fluctuating support posture: added by an outside contributor in 2023, stripped from release requirements in late 2024 under CI pressure, restored days later, and had one of three backends' support (Singlepass) effectively de-wired from the default build in January 2026 even as its source code kept receiving fixes.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | Yes (cross-compiled via Docker+QEMU on x86_64 runners) |
| CI runs tests | Yes (native) | Yes | Yes, for the Cranelift-only `wast-tests`/`capi`/`wasmer` matrix under QEMU (`build_linux_riscv64`, required in `ci_success`) |
| Official release binary | Yes | Yes | Yes - `wasmer-linux-riscv64.tar.gz` in every recent GitHub Release |
| Release-blocking | Yes | Yes | Yes today; was explicitly made non-blocking Oct 2024 then reinstated within days |
| All three backends built | Yes (Cranelift, LLVM, Singlepass) | Yes | Cranelift only in CI/Makefile; LLVM explicitly disabled in riscv64 CI (`ENABLE_LLVM=0`) despite being "supported" per docs; Singlepass code exists but is not wired into the Makefile's `ENABLE_SINGLEPASS` block for riscv64 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

There is no `arch/riscv/` directory and no RVV/vector-intrinsic code anywhere in the repository (searches for `vfloat32m1_t`, `rvv`, `Zba`, `Zbb`, "vector extension" all returned zero matches). RISC-V-specific code is instead flat `*_riscv.rs` files inside the shared `lib/compiler-singlepass/src/` tree, plus scattered `Architecture::Riscv64(_)` match arms in generic compiler/VM crates. There are no `.S` assembly files.

| Component | riscv64 implementation | ISA extensions covered | Quality |
|---|---|---|---|
| Singlepass - `riscv_decl.rs` (493 lines) | GPR/FPR register enums, calling-convention argument allocator | Base integer registers only | Complete for its scope |
| Singlepass - `emitter_riscv.rs` (~1,850 lines) | `EmitterRiscv` trait over `dynasmrt`'s `VecAssembler`; `dynasm!` forces `.feature g` (=IMAFD) | RV64I, M, A (incl. `.aqrl`/lr-sc atomics), F/D. No C (compressed), no V (vector) | Scalar RV64GC largely complete; `get_simd_arch()` and `get_jmp_instr_size()` are `todo!()` stubs |
| Singlepass - `machine_riscv.rs` (~2,800+ lines) | Register allocation, arithmetic/bitwise/popcnt/clz/ctz, float ops, load/store (incl. unaligned), atomic CAS/RMW 8-64 bit, control flow, prologue/epilogue | RV64I, M, A, F/D, Zicsr | SIMD/vector explicitly unimplemented - WASM SIMD locations mapped onto FPRs hit "unsupported location" errors |
| LLVM backend | `config.rs` (`Riscv64gc`->`Riscv64` normalization, `initialize_riscv`), `abi.rs`, `object_file.rs` (soft-float detection, `R_RISCV_ADD32` handling), `intrinsics.rs` (RV64 sign-extension invariant) | Relies on upstream LLVM 22's mature riscv64 codegen | Treated as "supported" per `docs/RISCV.md`, but multiple test categories are excluded via `tests/ignores.txt` for ABI/float/SIMD gaps |
| Cranelift backend | `abi.rs` dispatch, `translation_utils.rs` (`RiscvCallPlt` mapping), Cargo feature `riscv64` | Relies on upstream Cranelift's riscv64 backend | Two open unresolved crash bugs (Section 11); no SIMD support - RISC-V had no official ratified vector extension when this was implemented, per `docs/RISCV.md`, and no workaround exists |
| VM/runtime - `traphandlers.rs` | `target_arch = "riscv64"` signal-handler illegal-instruction detection | n/a | Linux/Android only |
| VM/runtime - `eh/gcc.rs` | `UNWIND_DATA_REG = (10, 11)` (a0/a1) for riscv64/riscv32 EH ABI | n/a | Complete for this arm |
| Shared compiler infra | ELF relocation mapping (`RiscvPCRelHi20`/`Lo12I`/`Call`), return-value ABI classification (`classify_return_type_riscv64`), hand-encoded `RISCV64_TRAMPOLINE` bytes, link-time hi/lo relocation pairing | n/a | Reasonably mature; multiple recent bugfix PRs (#6072, #6079, #6114, #6118, #6389, #6661/#6663) |

Reference: [`docs/RISCV.md`](https://github.com/wasmerio/wasmer/blob/main/docs/RISCV.md) - "Only Cranelift and LLVM compiler are supported. Singlepass can be done, but no resources are allocated on this task for now... LLVM code needs a hack to force the ABI to 'lp64d'... On Cranelift, SIMD is not supported as the CPU doesn't have official SIMD/Vector extension for now, and no Workaround is in place. Test have be conducted on actual hardware, with a Vision Five 2 board running Debian."

Comparison vs arm64/amd64: both reference architectures get all three backends, full SIMD (via native NEON/SSE-AVX lowering in Cranelift/LLVM), and no equivalent open crash bugs of the kind logged for riscv64. Singlepass is fully wired for amd64 and arm64 in the Makefile; riscv64 is not.

## 5. Build System, Cross-Compilation, and Toolchain

Wasmer is a Rust/Cargo project (not CMake); build orchestration is a `Makefile` wrapping `cargo`, with `rust-toolchain.toml` pinning the compiler.

**Toolchain versions and why:**
- Rust: `rust-toolchain.toml` pins `channel = "1.95"` (exact MSRV; `tests/integration/cli/tests/msrv.rs` reads the cross-riscv64 Dockerfile as the canonical reference).
- LLVM: exactly LLVM 22 (`>=22.1.x`) for the LLVM backend - "the backend needs LLVM 22 exactly; any other version silently disables it," per `docs/BUILD.md`.
- GCC cross toolchain: `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu` from `debian:stable`, no pinned minimum version.
- OpenSSL: built from source, pinned to 3.1.1 (static, `no-asm no-tests`, target `linux64-riscv64`).

**Cross-compilation mechanism:** [`.github/cross-linux-riscv64/Dockerfile`](https://github.com/wasmerio/wasmer/blob/main/.github/cross-linux-riscv64/Dockerfile) builds an image (`wasmer/riscv64`) containing the Rust 1.95 toolchain, `gcc-riscv64-linux-gnu`, `qemu-user-static`, and a statically-built OpenSSL. `cargo` invocations are routed through `docker run` against this image. QEMU wiring lives in a `.cargo/config.toml` baked into the image:
```
[target.riscv64gc-unknown-linux-gnu]
linker = "riscv64-linux-gnu-gcc"
runner = "qemu-riscv64 -L /usr/riscv64-linux-gnu/"
```
`QEMU_LD_PREFIX` is set redundantly as an env var, and `RUST_TEST_THREADS=1` serializes tests under emulation.

**Exact build commands** (from CI):
```
docker build -t wasmer/riscv64 ${GITHUB_WORKSPACE}/.github/cross-linux-riscv64/
CARGO_BINARY="docker run -v /var/run/docker.sock:/var/run/docker.sock -v ${GITHUB_WORKSPACE}:/project -w /project wasmer/riscv64:latest cargo" \
CARGO_TARGET=riscv64gc-unknown-linux-gnu ENABLE_LLVM=0 make build-wasmer
make build-capi-headless && make package-capi-headless
make build-capi && make package-capi
make distribution
```
Note `ENABLE_LLVM=0` is set explicitly for the riscv64 CI job, meaning **CI builds and tests riscv64 with Cranelift only**, despite `docs/RISCV.md` describing LLVM as supported.

**Singlepass exclusion in the Makefile** (support-matrix table and `ENABLE_SINGLEPASS` logic):
```
ifeq ($(ENABLE_SINGLEPASS), 1)
    ifneq (, $(filter 1, $(IS_WINDOWS) $(IS_DARWIN) $(IS_LINUX) $(IS_FREEBSD)))
        ifeq ($(IS_AMD64), 1)
            compilers_engines += singlepass
        endif
        ifeq ($(IS_AARCH64), 1)
            compilers_engines += singlepass
        endif
    endif
```
`IS_RISCV64` never appears in this block, consistent with `docs/RISCV.md`'s statement that Singlepass is unresourced for riscv64 (see the flagged contradiction with PR #6053 in Section 2).

**Known build/test exclusions** (`tests/ignores.txt`): a block of `llvm+riscv64` entries is excluded with the comment "riscv support is still early, function call ABI needs some work" (covers `static_function*`, `spec::f32`/`f64`/`float_misc`, `spec::memory_copy`/`memory_init`/`memory_trap`, `spec::multi_value::*`, `spec::simd::simd_align`, SIMD rounding tests, `nan_canonicalization`, `stack_overflow_sret`, `traps::test_trap_trace`, `spec::skip_stack_guard_page`), followed by a trailing comment "riscv support on Cranelift is also very young" with no further entries shown in the fetched excerpt.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cranelift backend | Yes | Yes | Yes, with two open crash bugs (Section 11) |
| LLVM backend | Yes | Yes | Yes in principle; excluded from CI builds (`ENABLE_LLVM=0`); numerous tests disabled for ABI/float/SIMD gaps |
| Singlepass backend | Yes | Yes | Source exists (PR #5711) but not wired into the Makefile's riscv64 build path; `todo!()` stubs remain for SIMD-arch detection and jump sizing |
| WASM SIMD | Yes | Yes | **Absent on all backends.** `docs/RISCV.md`: "SIMD is not supported as the CPU doesn't have official SIMD/Vector extension for now, and no Workaround is in place" |
| Unaligned memory access | Native | Native | Historically crashed; default-safe 1-byte emulation, with an opt-in `--enable-experimental-unaligned-memory-accesses` flag (PR #6388, merged 2026-05-13) to use full-size native ops |
| Trap delivery | `wasmer_vm_raise_trap` (LLVM/Singlepass) | Same | Cranelift on riscv64 instead relies on OS signal handlers, which breaks on signal-less (bare-metal/no-OS) environments - reported in issue [#6024](https://github.com/wasmerio/wasmer/issues/6024) |
| create-exe (AOT) | Yes | Yes | Was broken (segfault, issue [#5951](https://github.com/wasmerio/wasmer/issues/5951)), fixed within a day |
| rv32 (32-bit RISC-V) | n/a | n/a | Added to LLVM (PR #6007) then dropped entirely as "never properly tested" (PR #6828) - riscv64 only going forward |

**Functional gaps:** no WASM SIMD execution path on riscv64 under any backend; Singlepass effectively unavailable for riscv64 in the default build.

**Performance gaps:** the complete absence of SIMD lowering means any WASM module using `simd128` instructions either fails to run on riscv64 or must be interpreted/scalarized - no quantified performance-delta data was found for this gap (see Section 11 on benchmarks).

**Security hardening gaps:** the stack-guard-page test crashes on Cranelift/riscv64 (issue [#5816](https://github.com/wasmerio/wasmer/issues/5816), open, confirmed both under QEMU and on real hardware) - this is a memory-safety-relevant test, not a generic correctness test, and remains unresolved.

**NaN/floating-point semantics:** `tests/ignores.txt` excludes `wasmer::nan_canonicalization::llvm` for riscv64, indicating a known, unresolved NaN-canonicalization gap in the LLVM backend on this architecture; no equivalent Cranelift-specific NaN issue was found in the search.

## 7. CI/CD Infrastructure

Two of the ten workflow files under `.github/workflows/` reference riscv64: `build.yml` (job `linux-riscv64`) and `test.yaml` (job `build_linux_riscv64`). The other eight (`benchmark.yaml`, `cache-bucket-cleanup.yaml`, `check-public-api.yaml`, `cloudcompiler.yaml`, `copilot-setup-steps.yml`, `documentation.yaml`, `patchsmith-test.yml`, `typos.yaml`) have zero riscv references. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | Native x86_64 | Native/emulated (not researched) | `aux-pub-16cpu-amd64` (PR) / `aux-pub-trusted-16cpu-amd64` (else) - **x86_64 self-hosted runners, not native riscv64 hardware** |
| Build mechanism | Native cargo | n/a | Docker image `wasmer/riscv64` cross-compile |
| Test execution mechanism | Native | n/a | `qemu-riscv64` user-mode emulation, `RUST_TEST_THREADS=1` |
| Gating | Required | Required | `build_linux_riscv64` is a required dependency of the `ci_success` gate job |
| RISE runner usage | n/a | n/a | **None found.** No reference to `riseproject-dev` or a RISE runner label in either workflow |

`build.yml`'s `linux-riscv64` job is gated to push/tag/`workflow_dispatch`, or PRs whose head branch starts with `release-`; `test.yaml`'s `build_linux_riscv64` job runs on every push to `main`/`edge`/`with-ci-*` and every pull request, with a matrix of `wast-tests` (`make test-wast`), `capi`, and `wasmer` (CLI binary) build-and-package steps, all under `ENABLE_LLVM=0`.

## 8. Distribution and Release Status

| Channel | riscv64 available? | Detail |
|---|---|---|
| GitHub Releases (upstream) | **Yes** | `wasmer-linux-riscv64.tar.gz` (91.9 MB) shipped in v7.3.0, v7.4.0, v7.4.1, and every release since v3.2.0-beta.1 (2023-03-24) |
| PyPI `wasmer` package | No | Stuck at stale v1.1.0 (vs upstream v7.4.x); all 129 wheels target only manylinux x86_64, macOS x86_64/arm64, Windows x86_64, CPython 3.5-3.10 |
| RISE wheel builder | No | `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasmer/` redirects (302) straight to upstream PyPI - no custom RISE build exists |
| Ubuntu (any suite, any arch) | No | Wasmer is not packaged in Ubuntu at all; the only search hit is an unrelated crate (`librust-wasmer-enumset-derive-dev`) that happens to also list riscv64 among its architectures |
| Debian / Fedora / Arch | Not checked / no data found | Data not available: no targeted search performed against Debian tracker, Fedora packages, or Arch RISC-V beyond the Ubuntu check |

**What a user must do to get a working riscv64 binary today:** download `wasmer-linux-riscv64.tar.gz` directly from a [GitHub Release](https://github.com/wasmerio/wasmer/releases) and extract it. There is no package-manager path (`apt`, `pip`) on riscv64.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Cranelift (bytecodealliance/wasmtime) | Default JIT backend | Ships native riscv64 target | Two open Wasmer-filed crashes: [#6078](https://github.com/wasmerio/wasmer/issues/6078), [#5816](https://github.com/wasmerio/wasmer/issues/5816) | In-tree, no separate artifact | Cranelift itself is external; Wasmer's riscv64 bugs are in how Wasmer drives it, and possibly in Cranelift's own riscv64 ISLE rules (the `gen_bitcast` gap in #6078 traces to `src/isa/riscv64/inst.isle`) |
| LLVM (via `inkwell`, `target-riscv` feature) | Optional high-perf JIT backend | Compiled in explicitly | One blocking issue ([#6000](https://github.com/wasmerio/wasmer/issues/6000)) already closed | Mature upstream riscv64 codegen | Excluded from Wasmer's own riscv64 CI job (`ENABLE_LLVM=0`) |
| Singlepass -> `dynasm`/`dynasmrt` (CensoredUsername/dynasm-rs) | Fast baseline JIT assembler | **Contradicted finding** | N/A | N/A | One research pass reported dynasm-rs has *no* riscv64 arch module (x86/x86-64/aarch64 only) - a hard architectural blocker. This directly contradicts the confirmed presence of `emitter_riscv.rs`, which implements `EmitterRiscv` over `VecAssembler<RiscvRelocation>` (dynasmrt) with a `dynasm!` macro targeting `.arch riscv64 .feature g`, and PR #5711's claim of passing 104 spec tests. Not resolved in this research pass - flagged as a discrepancy requiring direct inspection of Wasmer's `dynasmrt` dependency (possibly a fork) [NEEDS VERIFICATION]. |
| `corosensei` (wasmerio/corosensei) | Stackful-coroutine/fiber context switching for wasmer-vm | Explicit `riscv64`/`riscv32` arch module in `src/arch/mod.rs` | No open riscv64 issues found | n/a | Appears solid |
| `libunwind` (Rust binding) | Runtime stack unwinding for traps/backtraces | riscv64 port shipped since v1.6.0 (2021), ongoing hardening | No blocking issues found | Stable/shipped | See separate report `project-reports/reports/libunwind.md` |
| `wasm-tools` crates (`wasmparser`, `wasm-encoder`, `wasm-smith`) | Wasm binary parsing/encoding/fuzzing | Pure Rust, architecture-agnostic | n/a | n/a | Not a riscv64 risk |
| `rkyv`/`bincode`/`serde`/`tokio`/`rayon`/`hyper`/`clap`/`tracing` | Workspace infrastructure | Pure Rust, architecture-agnostic | n/a | n/a | Not a riscv64 risk |

**Note on data completeness:** the `project-graph` MCP server was unreachable in the research session (`CONNECTION_CLOSED`), so no SPARQL queries against a distro package graph (e.g., transitive riscv64 dependency checks for LLVM toolchain packages, `libunwind-dev`) were executed. This is a data gap, not a finding of absence, and should be re-run.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#5816](https://github.com/wasmerio/wasmer/issues/5816) | Cranelift `skip_stack_guard_page` SIGSEGV on riscv64gc | **OPEN** (opened 2025-10-22) | High - memory safety | Reproduced both under QEMU and on real hardware; no fix or assignee action visible in the thread beyond assignment to marxin |
| [#6078](https://github.com/wasmerio/wasmer/issues/6078) | Cranelift ISLE `gen_bitcast` panic on SIMD-extended-ops test | **OPEN** (opened 2026-01-19) | Medium-High - crash | Follow-up to #5687; missing instruction-selection rule at `src/isa/riscv64/inst.isle:2999`; assigned to marxin, unfixed |
| [#6024](https://github.com/wasmerio/wasmer/issues/6024) | Cranelift unaligned load/store crashes + OS-signal-based trap model breaks bare-metal use | Closed 2026-05-19 | Correctness/portability | Reported by external embedded user wakabat; fed the `--enable-experimental-unaligned-memory-accesses` flag work (#6354/#6388) |
| [#6000](https://github.com/wasmerio/wasmer/issues/6000) | LLVM riscv64 exception-handling relocations unsupported (`R_RISCV_ADD32` etc.) | Closed 2026-01-08 | Correctness | Fixed before v7.0 |
| [#5951](https://github.com/wasmerio/wasmer/issues/5951) | `create-exe` for riscv64 segfaults | Closed 2025-12-09 | Correctness | Fixed within a day |
| [#5811](https://github.com/wasmerio/wasmer/issues/5811) | Cranelift SIMD spec tests crash instead of being skipped on riscv64 | Closed 2025-10-22 | Test-infra | 110 test failures until the missing `ignores.txt` entries were added - the underlying crash itself was worked around by skip-listing, not fixed |
| [#5810](https://github.com/wasmerio/wasmer/issues/5810) | `huge_number_of_arguments_fn` test hangs indefinitely under QEMU on riscv64gc | Closed 2025-11-11 | Reliability | Surfaced while working on PR #5711 |
| [#1448](https://github.com/wasmerio/wasmer/issues/1448) | Early (2020) cross-compilation failure report | Closed 2023-04-28 | Historical | Resolved by #3244 |

**Correctness bugs highlighted:** #5816 and #6078 are both open, unresolved, and involve crashes (one a SIGSEGV, memory-safety-relevant), not just missing features. #5811's closure by skip-listing rather than fixing the underlying Cranelift crash is a pattern worth flagging: Wasmer's riscv64 CI stays green in part by excluding known-failing test cases via `tests/ignores.txt` rather than resolving every underlying defect (see Section 13 for how this affects the readiness grade).

**Benchmarks:** no riscv64-specific Wasmer performance benchmark data (throughput, latency, or a riscv64-vs-arm64/amd64 comparison) was found in any source searched - not on GitHub, the Wasmer blog, academic literature, or the RISE Project blog. The [Wasmer 3.2 blog post](https://wasmer.io/posts/wasmer-3_2) announcing riscv64 support contains no numeric figures, only an unquantified performance claim. Data not available: quantified riscv64 throughput/latency benchmarks for Wasmer.

## 12. Objections and Upstream Blockers

**Stated objections:** none found framed as objections to RISC-V as a target; `docs/RISCV.md` instead frames the gaps (no SIMD, LLVM ABI hacks, Singlepass unresourced) as accepted current limitations rather than contested decisions.

**Technical blockers:**
- No ratified vector extension usage anywhere in the codebase - SIMD is entirely absent on riscv64 across all backends, and there is no workaround planned per `docs/RISCV.md`.
- Two open, unresolved Cranelift crash bugs (#5816, #6078), one of which is a memory-safety-relevant SIGSEGV reproduced on real hardware.
- Singlepass riscv64: real code exists (PR #5711, ~5,000+ lines across three files) but is not wired into the default Makefile build path for riscv64, and its own documentation (`docs/RISCV.md`) disclaims official support - see the flagged PR #6053 contradiction in Section 2.
- Unclear/contradictory dependency status for Singlepass's `dynasm`/`dynasmrt` assembler on riscv64 (Section 9) - needs direct resolution before Singlepass riscv64 can be assessed as production-ready.

**Organizational blockers:**
- Single-maintainer, company-centric governance (Wasmer Inc., CODEOWNERS = @syrusakbary) means RISC-V's priority is subject to one commercial entity's roadmap, not a multi-stakeholder process.
- Wasmer is not a Bytecode Alliance or RISE Project member; no RISE-funded work, blog coverage, GitHub repo, or CI runner integration involving Wasmer was found in an extensive search (34 RISE blog posts scanned, 25 `riseproject-dev` org repos enumerated, RISE members list checked) - RISC-V investment in Wasmer today is entirely a matter of Wasmer Inc.'s own unfunded, informal prioritization.
- Direct evidence of deprioritization under pressure: riscv64 was explicitly stripped from release-blocking requirements in October 2024 "due to CI instability," then reinstated days later - a documented instance of RISC-V support being treated as expendable when it threatens release stability.

**Acceptance probability for further RISC-V investment:** Wasmer's own commit and PR history shows it accepts community-contributed RISC-V work readily (PR #3244 from ptitSeb, PR #5711 from marxin with a critical fix from external contributor wakabat, all merged with maintainer @syrusakbary's approval). There is no evidence of upstream resistance to riscv64 contributions - the blocker is resourcing, not willingness.

## 13. Readiness Assessment

- **Color:** green (no sub-case)
- **Release provider:** upstream
- **Optimization gap:** N/A - Wasmer is a general-purpose WebAssembly runtime, not an optimization-purpose project under the color model's Step 2 test (it is analogous to the model's explicitly excluded "general-purpose language runtimes" category: if it ran on RISC-V with only generic scalar codegen and no SIMD lowering, it would still deliver its core value - WASM execution and sandboxing - which is why it is graded purely on CI/build/test/release posture)

**Justification:** Upstream CI builds riscv64 via a dedicated Docker+QEMU cross-compilation pipeline (`.github/workflows/build.yml` job `linux-riscv64`, `.github/workflows/test.yaml` job `build_linux_riscv64`), and the `test.yaml` job's matrix executes the WAST spec test suite (`make test-wast`) under QEMU as a **required** dependency of the `ci_success` gate - not a build-only job. Upstream publishes a riscv64 release artifact directly from its own release pipeline: `wasmer-linux-riscv64.tar.gz` ships in every recent GitHub Release ([v7.4.1](https://github.com/wasmerio/wasmer/releases), v7.4.0, v7.3.0, and every release since v3.2.0-beta.1 via [PR #3244](https://github.com/wasmerio/wasmer/pull/3244)). Per the color model's Step 1 table (build=yes, test=yes, release=yes, `release_provider: upstream`), this is green.

This grade carries real caveats that a reader should weigh alongside the color: two Cranelift correctness bugs remain open and unresolved ([#5816](https://github.com/wasmerio/wasmer/issues/5816), a SIGSEGV reproduced on real hardware; [#6078](https://github.com/wasmerio/wasmer/issues/6078), a Cranelift codegen panic), CI achieves its "passing" status partly by skip-listing known-failing tests rather than fixing them (the closure pattern of [#5811](https://github.com/wasmerio/wasmer/issues/5811)), riscv64 CI tests Cranelift only (`ENABLE_LLVM=0`) even though LLVM is nominally "supported," Singlepass riscv64 is not wired into the default build despite its source existing, and SIMD is entirely absent on riscv64 with no workaround in progress.

**Pending work that could change the grade:** resolution of #5816 and #6078 (both assigned to marxin, no visible fix in progress); clarification of PR #6053's actual effect on Singlepass riscv64 availability and whether it will be wired into CI; any future RISC-V vector-extension (RVV) work in upstream Cranelift/LLVM that Wasmer could adopt to close the SIMD gap. No RISE involvement exists today that could accelerate any of this - RISC-V progress on Wasmer depends entirely on Wasmer Inc.'s own (currently informal, unfunded) prioritization and community contributors like wakabat.

## 14. Investment Analysis

RISE has done no work on Wasmer (confirmed in Section 1/12 via exhaustive search of RISE's blog, org repos, and members list) - there is no existing RISE investment to avoid duplicating. All items below are net-new.

### 14.1 Functional Enablement
- Fix the two open Cranelift crash bugs (#5816 stack-guard SIGSEGV, #6078 SIMD-ext-ops ISLE panic) - both require Cranelift-level (bytecodealliance/wasmtime) riscv64 ISLE/codegen work, not just Wasmer-side changes.
- Resolve the Singlepass/dynasm-rs riscv64 status contradiction (Section 9) and, if genuinely blocked, either upstream a riscv64 backend to `dynasm-rs` or confirm/document Wasmer's fork.
- Wire Singlepass into the Makefile's riscv64 build path and CI matrix if #6053's effect turns out to have been a genuine drop, or confirm and document that it already works if the feature-gate removal was additive.
- Enable the LLVM backend in riscv64 CI (`ENABLE_LLVM=1`) so LLVM-path regressions are caught continuously rather than only in ad hoc local testing (as #6000 and #6024 were).

### 14.2 Performance Optimization
- No RISC-V vector extension (RVV) codegen exists in Cranelift, LLVM, or Singlepass for Wasmer's WASM SIMD lowering. This is upstream-compiler-level work (Cranelift/LLVM), not Wasmer-specific, and is a multi-quarter effort tracked at the compiler level, not the runtime level.
- No quantified performance baseline exists (Section 11) - before sizing optimization work, a benchmark suite comparing riscv64 Cranelift/LLVM codegen quality against amd64/arm64 on representative WASM workloads should be established.

### 14.3 CI/CD Infrastructure
- Current riscv64 CI runs on x86_64 self-hosted runners via Docker+QEMU cross-compilation and emulation - no native riscv64 hardware is used, and no RISE runner integration exists. RISE explicitly offers free native RISC-V GitHub Actions runners ([riseproject.dev, 2026-03-24 announcement](https://riseproject.dev/blog)); adopting these for the `build_linux_riscv64` test-execution job would remove QEMU-emulation overhead and increase confidence that CI results reflect real hardware behavior (relevant given #5816 required real-hardware reproduction to confirm it wasn't a QEMU artifact).

### 14.4 Ecosystem Enablement
Not applicable - see Section 10 note below. Wasmer is a standalone runtime/CLI/library; no significant dependent package ecosystem (e.g., a large body of third-party packages requiring separate riscv64 enablement) was identified in the research.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix Cranelift #5816 (stack-guard SIGSEGV) | 2-4 | Cranelift/riscv64 codegen engineer | Critical |
| Functional | Fix Cranelift #6078 (ISLE gen_bitcast panic) | 1-3 | Cranelift/riscv64 codegen engineer | High |
| Functional | Resolve Singlepass/dynasm-rs riscv64 status and wire into Makefile/CI if viable | 2-4 (investigation + fix) | Rust/JIT engineer | High |
| Functional | Enable LLVM backend in riscv64 CI (`ENABLE_LLVM=1`) | 1 | CI/build engineer | Medium |
| Performance | Establish riscv64 benchmark baseline vs amd64/arm64 | 2-3 | Performance engineer | Medium |
| Performance | RVV-based SIMD lowering in Cranelift/LLVM for riscv64 (upstream compiler work, out of Wasmer's direct control) | 12+ (multi-quarter, upstream-dependent) | Upstream Cranelift/LLVM contributor | Low (long-horizon) |
| CI/CD | Migrate riscv64 test execution to native RISE RISC-V runners | 1-2 | CI/build engineer | Medium |
| CI/CD | Reduce reliance on skip-listing (`tests/ignores.txt`) by triaging and fixing rather than excluding failing riscv64 tests | 3-6 (ongoing) | Test/QA engineer | Medium |

## 15. Updates
(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [wasmerio/wasmer repository](https://github.com/wasmerio/wasmer)
- [Wasmer homepage](https://wasmer.io/)
- [Issue #6078 - Cranelift ISLE gen_bitcast panic](https://github.com/wasmerio/wasmer/issues/6078)
- [Issue #5816 - Cranelift skip_stack_guard_page SIGSEGV](https://github.com/wasmerio/wasmer/issues/5816)
- [Issue #6024 - Testing cranelift on RISC-V](https://github.com/wasmerio/wasmer/issues/6024)
- [Issue #6000 - RISC-V LLVM compiler tests fail](https://github.com/wasmerio/wasmer/issues/6000)
- [Issue #5951 - create-exe riscv64 segfault](https://github.com/wasmerio/wasmer/issues/5951)
- [Issue #5811 - spec::simd should be ignored on riscv64](https://github.com/wasmerio/wasmer/issues/5811)
- [Issue #5810 - huge_number_of_arguments_fn stuck on riscv64gc](https://github.com/wasmerio/wasmer/issues/5810)
- [Issue #5167 - Fix CI in Wasmer](https://github.com/wasmerio/wasmer/issues/5167)
- [Issue #3306 - Add RISC-V Support to Cranelift Compiler](https://github.com/wasmerio/wasmer/issues/3306)
- [Issue #1448 - Cross compilation to RISCV using cargo](https://github.com/wasmerio/wasmer/issues/1448)
- [PR #3244 - Feat riscv llvm and cranelift](https://github.com/wasmerio/wasmer/pull/3244)
- [PR #2799 - Add riscv64 support (wasmer-vm)](https://github.com/wasmerio/wasmer/pull/2799)
- [PR #2800 - RISC-V support (tnayuki)](https://github.com/wasmerio/wasmer/pull/2800)
- [PR #3706 - CI Add RISCV in test and build](https://github.com/wasmerio/wasmer/pull/3706)
- [PR #3992 - CI RISCV64 bookworm debian](https://github.com/wasmerio/wasmer/pull/3992)
- [PR #4002 - RISCV64 CI simpler package install](https://github.com/wasmerio/wasmer/pull/4002)
- [PR #4005 - Remove build_linux_riscv64 prereq](https://github.com/wasmerio/wasmer/pull/4005)
- [PR #5711 - SinglePass: add support for riscv64 target](https://github.com/wasmerio/wasmer/pull/5711)
- [PR #6053 - chore(singlepass): drop riscv feature gate](https://github.com/wasmerio/wasmer/pull/6053)
- [PR #6007 - Enable riscv32 target in LLVM compiler](https://github.com/wasmerio/wasmer/pull/6007)
- [PR #6072 - fix(LLVM,riscv64) calling conventions for i32](https://github.com/wasmerio/wasmer/pull/6072)
- [PR #6079 - fix(LLVM) RISC-V rounding operations](https://github.com/wasmerio/wasmer/pull/6079)
- [PR #6093 - CI: skip tests on RISC-V and LoongArch64](https://github.com/wasmerio/wasmer/pull/6093)
- [PR #6114 - fix(LLVM) ABI issues noticed while fuzzing](https://github.com/wasmerio/wasmer/pull/6114)
- [PR #6118 - fix(LLVM) ABI related to pointer type](https://github.com/wasmerio/wasmer/pull/6118)
- [PR #6252 - fix(singlepass) float return values from SIMD regs](https://github.com/wasmerio/wasmer/pull/6252)
- [PR #6351 - feat(Singlepass) strict memory boundary checking config](https://github.com/wasmerio/wasmer/pull/6351)
- [PR #6354 - feat enable-nonaligned-memory-accesses](https://github.com/wasmerio/wasmer/pull/6354)
- [PR #6388 - feat enable-experimental-unaligned-memory-accesses](https://github.com/wasmerio/wasmer/pull/6388)
- [PR #6389 - feat(Singlepass) correct wasmer_vm_x fn types](https://github.com/wasmerio/wasmer/pull/6389)
- [PR #6604 - Add soft-float libcall support for LLVM backend](https://github.com/wasmerio/wasmer/pull/6604)
- [PR #6661 - fix(riscv64) RISC-V LP64 ABI mismatch](https://github.com/wasmerio/wasmer/pull/6661)
- [PR #6663 - fix(llvm) recognise soft-float libcalls](https://github.com/wasmerio/wasmer/pull/6663)
- [PR #6828 - feat!(rv32) drop LLVM target](https://github.com/wasmerio/wasmer/pull/6828)
- [PR #6895 - fix(Singlepass) simplify stack rounding logic](https://github.com/wasmerio/wasmer/pull/6895)
- [Wasmer 3.2 blog post](https://wasmer.io/posts/wasmer-3_2)
- [Release v7.0.0](https://github.com/wasmerio/wasmer/releases/tag/v7.0.0)
- [bytecodealliance/wasmtime PR #4271 - add riscv64 backend for cranelift](https://github.com/bytecodealliance/wasmtime/pull/4271)
- [docs/RISCV.md](https://github.com/wasmerio/wasmer/blob/main/docs/RISCV.md)
- [.github/workflows/build.yml](https://github.com/wasmerio/wasmer/blob/main/.github/workflows/build.yml)
- [.github/workflows/test.yaml](https://github.com/wasmerio/wasmer/blob/main/.github/workflows/test.yaml)
- [.github/cross-linux-riscv64/Dockerfile](https://github.com/wasmerio/wasmer/blob/main/.github/cross-linux-riscv64/Dockerfile)
- [tests/ignores.txt](https://github.com/wasmerio/wasmer/blob/main/tests/ignores.txt)
- [Makefile](https://github.com/wasmerio/wasmer/blob/main/Makefile)
- [.github/CODEOWNERS](https://github.com/wasmerio/wasmer/blob/main/.github/CODEOWNERS)
- [Bytecode Alliance](https://bytecodealliance.org/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [PyPI wasmer package JSON API](https://pypi.org/pypi/wasmer/json)
- [PyPI wasmer simple index](https://pypi.org/simple/wasmer/)
- [RISE GitLab wheel builder for wasmer](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasmer/)
- [Ubuntu package search - Wasmer](https://packages.ubuntu.com/search?keywords=Wasmer&suite=resolute&searchon=names&section=all)