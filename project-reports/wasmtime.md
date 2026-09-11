---
title: Wasmtime
parent: Project Reports
color: green
dependencies:
  - name: regalloc2
    relation: build-dependency
    criticality: critical
  - name: capstone
    relation: runtime-dependency
    criticality: optional
  - name: ring
    relation: runtime-dependency
    criticality: optional
  - name: rustls
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: sha2
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="wasmtime" %}

# Wasmtime

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Wasmtime<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wasmtime is a standalone WebAssembly runtime built by the Bytecode Alliance, implementing a JIT/AOT compiler (Cranelift, the default backend) plus a baseline compiler (Winch) and a portable bytecode interpreter (Pulley). It is written in Rust, licensed Apache 2.0 WITH LLVM-exception, and distributed as a CLI tool, a set of embeddable Rust/C/Python/.NET/Go language bindings, and a C API.

**Governance.** Wasmtime is a project of the Bytecode Alliance, a 501(c)(6) nonprofit. Governance runs through a Board of Directors (elected from member organizations, the Technical Steering Committee, and a Recognized Contributor track), a Technical Steering Committee that is the top-level technical authority, and CODEOWNERS-based review teams (`wasmtime-core-reviewers`, `wasmtime-compiler-reviewers`, `wasmtime-wasi-reviewers`, `wasmtime-fuzz-reviewers`, and a dedicated `wasmtime-compiler-s390x-reviewers` team). Commit access is explicitly restricted to people "employed full-time to work on this project." Major changes to Tier 1 (and some Tier 2) components require an RFC and prior agreement before implementation.

**Corporate sponsors.** Board seats are held by Mozilla (chair), Fastly, F5, and Microsoft, plus UC San Diego (academic) and independent at-large/TSC directors. Google donates continuous OSS-Fuzz infrastructure for Tier 1 targets. Listed production adopters (`ADOPTERS.md`) include Akamai, Cosmonic, DFINITY, Embark Studios, Fastly, Huawei, InfinyOn, Microsoft, Redpanda, Shopify, and SingleStore.

**Community stance on new ports.** Wasmtime's own documentation states that omission of a feature or platform "does not mean Wasmtime does not want to ever support" it, and invites design discussion and PRs to move new targets to Tier 3. New ports are explicitly expected to enter at Tier 3 and graduate through sustained CI, continuous fuzzing, and a responsive, identified full-time-equivalent maintainer - graduation is deliberately gated on sustained resourcing, not code landing alone. Sources: [wasmtime.dev](https://wasmtime.dev/), [Bytecode Alliance - About](https://bytecodealliance.org/about), [docs/stability-tiers.md](https://docs.wasmtime.dev/stability-tiers.html), [ADOPTERS.md](https://github.com/bytecodealliance/wasmtime/blob/main/ADOPTERS.md).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-08-04 | First "riscv" scaffolding appears in the codebase (legacy pre-MachInst backend, added by Jakob Stoklund Olesen/Mozilla); later described as "fairly skeletal" and largely dormant | [Issue #2217](https://github.com/bytecodealliance/wasmtime/issues/2217) |
| 2020-09-21 | Tracking issue [#2217](https://github.com/bytecodealliance/wasmtime/issues/2217) opened by cfallin, requesting a RISC-V backend written in Cranelift's new MachInst/ISLE framework | [Issue #2217](https://github.com/bytecodealliance/wasmtime/issues/2217) |
| 2021-09-29 | Old legacy riscv backend removed (commit `59e18b7d`), clearing the way for the new-framework rewrite | [Commit 59e18b7d](https://github.com/bytecodealliance/wasmtime/commit/59e18b7d1b130a0e498701a37cdb3bdc33dd02d0) |
| 2022-04 | Exploratory issue [#4070](https://github.com/bytecodealliance/wasmtime/issues/4070) "I am trying to add risc-v backend" opened by yuyang-ok (closed) | Search data |
| 2022-06-15 | PR [#4271](https://github.com/bytecodealliance/wasmtime/pull/4271) "add riscv64 backend for cranelift" opened by yuyang-ok | [PR #4271](https://github.com/bytecodealliance/wasmtime/pull/4271) |
| 2022-09-27/28 | PR #4271 merged (commit `cdecc858b47cb1b27d2c38773d802b237c8ed36a`), co-authored/reviewed by Chris Fallin and Afonso Bordado (both Fastly-affiliated Cranelift maintainers); closes tracking issue #2217 | [PR #4271](https://github.com/bytecodealliance/wasmtime/pull/4271) |
| 2022-10-20 | First release containing the riscv64 backend: **v2.0.0** (confirmed via `git merge-base --is-ancestor cdecc858b v2.0.0` = yes; absent from v1.0.0, tagged 2022-09-20) | Git ancestry verification, this session |
| 2023-04/2023-10 | Initial SIMD vector implementation (PR [#6240](https://github.com/bytecodealliance/wasmtime/pull/6240)), TLS/ABI work (PR [#5017](https://github.com/bytecodealliance/wasmtime/pull/5017)), compressed instructions and ELF TLS/GOT relocations (PRs [#7030](https://github.com/bytecodealliance/wasmtime/pull/7030), [#7003](https://github.com/bytecodealliance/wasmtime/pull/7003), [#7184](https://github.com/bytecodealliance/wasmtime/pull/7184)) | PR list, search data |
| 2024-08 | Initial FP16 math support (PR [#9135](https://github.com/bytecodealliance/wasmtime/pull/9135)) | [PR #9135](https://github.com/bytecodealliance/wasmtime/pull/9135) |
| 2026-02 to 2026-08 | Continued active work: riscv32imac fiber support (PR [#12506](https://github.com/bytecodealliance/wasmtime/pull/12506)), Zvbb vector bit-manipulation extension (PR [#13738](https://github.com/bytecodealliance/wasmtime/pull/13738)), fiber stack-switch fix (PR [#13943](https://github.com/bytecodealliance/wasmtime/pull/13943)), f16 conversion instructions (PR [#14071](https://github.com/bytecodealliance/wasmtime/pull/14071)) | PR list, search data |

**Key contributors:** yuyang-ok (independent contributor, original backend author), Chris Fallin and Afonso Bordado (Fastly-affiliated Cranelift maintainers, primary reviewers and co-authors of follow-on work).

**Is it fully upstream?** Yes. There is no fork or out-of-tree patch set; the riscv64 backend lives in `bytecodealliance/wasmtime` main and has done so since v2.0.0 (2022-10-20). No separate riscv64-specific fork was found in any of the research passes.

**Design-decision note:** During PR #4271 review, the design question of runtime CPU-feature detection was resolved by cfallin's explicit recommendation to ship "assuming a baseline RISC-V ISA level for now (in other words, running with no features ever detected)" rather than block on building a `getauxval`-based detection path. This is why several scalar operations (popcnt, ctz, rev8, brev8) fell back to loop implementations at merge time, unless later covered by the feature-detection work in `cranelift/native/src/riscv.rs` described in Section 4. Source: [PR #4271 review thread](https://github.com/bytecodealliance/wasmtime/pull/4271).

## 3. Upstream Support Tier

Wasmtime defines a formal three-tier target policy in [`docs/stability-tiers.md`](https://docs.wasmtime.dev/stability-tiers.html), modeled on Rust's target-tier policy:

- **Tier 1 (Production Ready):** `x86_64-apple-darwin`, `x86_64-pc-windows-msvc`, `x86_64-unknown-linux-gnu`. Requires continuous fuzzing, full Tier-1 wasm/WASI proposal support, CVE response commitments, RFC required for major changes.
- **Tier 2 (Almost Production Ready):** `aarch64-unknown-linux-gnu`, `aarch64-apple-darwin`, `s390x-unknown-linux-gnu`, `x86_64-pc-windows-gnu`, `no_std`. CI-tested but not continuously fuzzed; maintainers must respond within a week.
- **Tier 3 (Not Production Ready / baseline for inclusion):** **both RISC-V targets** - `riscv64gc-unknown-linux-gnu` (missing: full-time maintainer) and `riscv32imac-unknown-none-elf` (missing: CI testing, full-time maintainer) - alongside aarch64-ios/android, i686, powerpc64le, armv7, and musl targets.

Tier 3 is explicitly not a rubber stamp: it requires no undue CI/maintenance burden on others, no major known bugs at inclusion, acceptable code quality, a clear completion path, and a clearly identified owner "on the hook." Unmaintained Tier 3 features can be disabled after a week of maintainer silence and removed after a month.

Despite the Tier 3 self-classification, live CI evidence (Section 7) shows upstream does build, test, and release riscv64gc artifacts as part of its normal pipeline - the gap that keeps it at Tier 3 is organizational (no committed full-time maintainer, no continuous fuzzing coverage) rather than an absence of automated build/test/release infrastructure.

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Formal tier | Tier 1 | Tier 2 | Tier 3 |
| CI builds | Yes | Yes | Yes (conditionally gated, see Section 7) |
| CI runs tests | Yes | Yes | Yes, under QEMU user-mode emulation (no native hardware runner) |
| Continuous fuzzing (OSS-Fuzz) | Yes | Not confirmed Tier-2-wide | No |
| Official release binaries | Yes | Yes | Yes (`riscv64gc-linux` tarball + C-API tarball) |
| CVE response SLA | Yes | No (Tier 2 = best-effort within a week) | No |
| Winch (baseline compiler) | Yes | In development | No support at all |

Sources: [docs/stability-tiers.md](https://docs.wasmtime.dev/stability-tiers.html), [docs/stability-platform-support.md](https://github.com/bytecodealliance/wasmtime/blob/main/docs/stability-platform-support.md).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Source repository inspected at commit `e8890cc7b3670d14426a15742b81b125df5e288f`. RISC-V code is organized under `isa/riscv64/` (Cranelift) plus per-crate `arch/riscv64.rs` / `stackswitch/riscv64.rs` files rather than a single `arch/riscv/` tree. All code inventoried below is complete and actively maintained, not stubbed.

**Cranelift codegen backend** (`cranelift/codegen/src/isa/riscv64/`) - approximately 22,300 lines of RISC-V-specific Rust/ISLE, including:

| File | Lines | Purpose |
|---|---|---|
| `mod.rs` | 307 | `Riscv64Backend` struct: ISA entry point, VCode compilation |
| `abi.rs` | 1128 | Calling convention (Wasmtime, SystemV), stack frame layout |
| `lower.isle` | 3196 | ISLE lowering rules: CLIF IR to RISC-V machine instructions |
| `inst.isle` | 3307 | ISLE instruction definitions (scalar) |
| `inst_vector.isle` | 1989 | ISLE instruction definitions for the V (vector/RVV) extension |
| `inst/mod.rs` | 1936 | Core `Inst` enum, register allocation traits |
| `inst/emit.rs` | 2859 | Binary instruction encoding/emission |
| `inst/vector.rs` | 1201 | RVV vector instruction types (`VecAvl`, `VecElementWidth`, `VecLmul`, vtype config) |
| `inst/unwind/systemv.rs` | ~160 | DWARF/CFI unwind info |

RVV support is implemented as a hand-written machine-code encoder generating native `vsetvli`/`vadd.vv`/etc. instructions directly - GitHub code search for `vfloat32m1_t` returned zero results, confirming Wasmtime does not use C-style RVV intrinsics.

**ISA extensions explicitly modeled** (`cranelift/codegen/meta/src/isa/riscv64.rs`): baseline RV64G (M, A, F, D, Zicsr, Zifencei always on) plus toggleable Zfa, Zfhmin, Zfh, V (base vector), Zvfh, Zvbb, Zca/Zcd/Zcb (compressed instructions), Zbkb, Zba, Zbb, Zbc, Zbs, Zicond, and a full Zvl32b-Zvl65536b vector-register-length ladder.

**Runtime unwinding** (`crates/unwinder/src/arch/riscv64.rs`, 46 lines): inline assembly for stack-pointer capture and trap/exception handoff.

**Fiber (stack-switching) support**: `crates/fiber/src/stackswitch/riscv64.rs` (167 lines) - full hand-written `naked_asm!` context switch saving/restoring 16 GPRs and 12 FPRs with CFI directives; `crates/fiber/src/stackswitch/riscv32imac.rs` (140 lines) - separate implementation for the riscv32imac embedded target. Both are production hand-tuned assembly.

**Host feature detection** (`cranelift/native/src/riscv.rs`, 128 lines): `hwcap_detect` reads `AT_HWCAP` auxval bits; `cpuinfo_detect` parses `/proc/cpuinfo`'s `isa:` line and enables matching Cranelift flags dynamically.

**I-cache coherence** (`crates/jit-icache-coherence/src/libc.rs`): issues the RISC-V-specific `sys_riscv_flush_icache` syscall, required post-JIT-emission since RISC-V does not guarantee coherent I/D caches.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cranelift JIT backend | Full, hand-tuned | Full, hand-tuned | Full, hand-tuned (~22,300 lines); missing `stack-switching` proposal (same gap on every arch) |
| Winch (baseline JIT) | Full | In development | **None - zero riscv64 code exists** |
| SIMD | Full (SSE/AVX) | Full (NEON) | Present via V/RVV extension, but Section 6 gap analysis shows incomplete coverage (widening ops, reductions, strided/indexed loads, vector integer division) |
| Fiber/stack-switch assembly | Hand-written asm | Hand-written asm | Hand-written asm (riscv64 and riscv32imac both) |
| Host feature detection | Yes | Yes | Yes (`AT_HWCAP` + `/proc/cpuinfo` parsing) |
| Unwind/CFI info | Yes | Yes | Yes |
| I-cache maintenance | N/A (x86 coherent) | Yes | Yes (explicit syscall) |

Sources: local inspection of `bytecodealliance/wasmtime` at `e8890cc7b3670d14426a15742b81b125df5e288f`; [winch/README.md](https://github.com/bytecodealliance/wasmtime/blob/main/winch/README.md); [Issue #7186](https://github.com/bytecodealliance/wasmtime/issues/7186).

## 5. Build System, Cross-Compilation, and Toolchain

Wasmtime's primary build system is Cargo/Rust; CMake exists only as an optional wrapper around `cargo build` for the C API (`crates/c-api/`), with no riscv64-specific CMake toolchain file.

**Native/cross build:**
```
rustup target add riscv64gc-unknown-linux-gnu
sudo apt install gcc-riscv64-linux-gnu qemu-user
cargo build --target riscv64gc-unknown-linux-gnu --release
```

**Cross-compile test config** (`docs/contributing-cross-compiling.md`):
```
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER='riscv64-linux-gnu-gcc'
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_RUNNER='qemu-riscv64 -L /usr/riscv64-linux-gnu -E LD_LIBRARY_PATH=/usr/riscv64-linux-gnu/lib -E WASMTIME_TEST_NO_HOG_MEMORY=1'
cargo test --target riscv64gc-unknown-linux-gnu
```

**C API build (CMake wraps Cargo):**
```
cmake -S crates/c-api -B build -DWASMTIME_TARGET=riscv64gc-unknown-linux-gnu -DBUILD_SHARED_LIBS=OFF
cmake --build build
```
Winch should be disabled explicitly for riscv64 builds via `-DWASMTIME_FEATURE_WINCH=OFF` (it has no riscv64 backend, though Cargo simply will not use it if left on).

**Release Docker image** (`ci/docker/riscv64gc-linux/Dockerfile`):
```
FROM ubuntu:22.04
RUN apt-get update -y && apt-get install -y gcc gcc-riscv64-linux-gnu ca-certificates cmake git ninja-build
RUN git config --global --add safe.directory '*'
ENV CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc
```

**Toolchain versions:**
- Rust MSRV: `1.96.0` (root `Cargo.toml`).
- GCC: no version pinned in the repo; CI's riscv64 Docker image is `ubuntu:22.04`, which ships GCC 11.x for `gcc-riscv64-linux-gnu`. No documented minimum-version rationale (e.g., for vector-extension support) exists in the docs.
- QEMU: CI does **not** use the distro package - it builds QEMU from source (pinned by a `QEMU_BUILD_VERSION` value referenced in `main.yml` but not itself defined in the checked-out files, resolving via a GitHub Actions variable) to get newer/faster emulation than the runner's stock QEMU.

**QEMU invocation** (`ci/build-test-matrix.js`):
```
qemu-riscv64 -cpu rv64,v=true,vlen=256,vext_spec=v1.0,zfa=true,zfh=true,zba=true,zbb=true,zbc=true,zbs=true,zbkb=true,zcb=true,zicond=true,zvfh=true -L /usr/riscv64-linux-gnu
```
This emulates a synthetic RV64GCV CPU with the vector extension and most scalar-crypto/bit-manipulation extensions enabled, at `vlen=256`.

**Known build failures:** None specific to Wasmtime's own riscv64 build were found in the search data; however, see Section 9 for the `ring` crypto dependency's documented history of riscv64 build issues on some point releases.

Sources: [docs/contributing-cross-compiling.md](https://github.com/bytecodealliance/wasmtime/blob/main/docs/contributing-cross-compiling.md), [ci/docker/riscv64gc-linux/Dockerfile](https://github.com/bytecodealliance/wasmtime/blob/main/ci/docker/riscv64gc-linux/Dockerfile), [ci/build-test-matrix.js](https://github.com/bytecodealliance/wasmtime/blob/main/ci/build-test-matrix.js).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| WASM proposal / feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| mutable-globals, threads, tail-call, gc, component-model, wide-arithmetic, exception-handling, SIMD, relaxed-simd | Yes (Cranelift) | Yes (Cranelift) | Yes (Cranelift) |
| stack-switching | No | No | No (universal gap, not riscv64-specific) |
| Winch (baseline compiler) coverage | Full | In development | **None** |

**Functional gaps specific to riscv64 (Cranelift, vector/RVV completeness):** tracked centrally in [Issue #7186](https://github.com/bytecodealliance/wasmtime/issues/7186), which enumerates five incomplete categories: (1) widening/narrowing vector operations, (2) multi-register vector moves beyond `vmv1r.v`, (3) vector reduction operations, (4) strided/indexed/segment load-store addressing modes (only unit-stride is implemented today), (5) vector integer division (blocked upstream on Cranelift IR itself lacking vector `sdiv`/`udiv`, not just riscv64 lowering).

**Correctness/functional bug: vector return-value ABI.** [Issue #11050](https://github.com/bytecodealliance/wasmtime/issues/11050) documents that `.clif` test functions returning `i32x4` fail on riscv64 with "Too many return values to fit in registers. Use a StructReturn argument instead" - a working x86_64 case fails entirely on riscv64, indicating the vector-return ABI-conversion mechanism referenced by upstream issue #9510 is not yet hooked up for this backend.

**Performance gaps from incomplete SIMD/codegen (not benchmarked, but documented as inefficiencies):**
- [#7147](https://github.com/bytecodealliance/wasmtime/issues/7147): redundant register move (`mv`) emitted on every short function with back-to-back loads - suboptimal register allocation.
- [#7322](https://github.com/bytecodealliance/wasmtime/issues/7322): Cranelift's NaN-canonicalization legalization pass runs unconditionally even though RISC-V FP hardware already always produces canonical NaN - pure wasted overhead per NaN-producing FP op, open, needs a per-backend flag.
- [#6600](https://github.com/bytecodealliance/wasmtime/issues/6600), [#6623](https://github.com/bytecodealliance/wasmtime/issues/6623), [#7188](https://github.com/bytecodealliance/wasmtime/issues/7188): suboptimal codegen for `ExtAddPairwise`, SIMD `icmp` with immediates, and `vslideup`-based operations respectively.
- [#9186](https://github.com/bytecodealliance/wasmtime/issues/9186): `*_overflow` instructions unimplemented on riscv64 (and s390x), forcing slower fallback sequences.

**Security hardening gaps:**
- [#5882](https://github.com/bytecodealliance/wasmtime/issues/5882): unaligned `atomic_rmw` causes a hard bus-error crash instead of a controlled trap - a soundness gap for any Wasm module performing unaligned atomic memory access on real riscv64 hardware. Parallel to a similar AArch64 issue (#5483).
- [#7237](https://github.com/bytecodealliance/wasmtime/issues/7237): partially out-of-bounds writes on ARM and riscv - an unaligned store crossing a page boundary can partially mutate memory before trapping, violating the Wasm spec's all-or-nothing semantics. Confirmed reproducing on JH7110 (SiFive U74) hardware; does not reproduce on Apple M2/RPi4/Ampere Altra, indicating hardware-dependent, implementation-defined behavior.

**Floating-point/NaN semantics:** No divergent-behavior bug was found beyond the NaN-canonicalization redundancy noted above (#7322); RISC-V FP hardware's canonical-NaN behavior is described as already spec-compliant, the issue is pure performance waste, not correctness.

**No published performance benchmark data exists** comparing Wasmtime on riscv64 against arm64 or amd64 - Sightglass (Wasmtime's own benchmark suite), the Bytecode Alliance blog, and third-party runtime-comparison sites (wasmruntime.com returned HTTP 403; hostmycode.com's 2026 comparison reports aggregate, non-arch-broken-out numbers) all lack riscv64-specific figures. This is a material data gap for any performance-based investment decision.

## 7. CI/CD Infrastructure

**Verified by directly reading workflow files** at commit `e8890cc7b3670d14426a15742b81b125df5e288f` - a naive grep of `.github/workflows/*.yml` alone is misleading (see below).

A plain grep of the 8 YAML files under `.github/workflows/` for "riscv" yields only two hits, both compile-checks, not test execution:
- Line 644 of `main.yml`: `cargo check -p cranelift-codegen --no-default-features --features x86,arm64,riscv64` (a feature-flag compile check within an `x86_64-unknown-none` no_std target check).
- Line 676: `- target: riscv32imac-unknown-none-elf` (RISC-V **32-bit**, not riscv64; also compile-only, explicitly commented "A no_std target without 64-bit atomics").

**The genuine riscv64 test job is defined not in YAML but in JavaScript**, `ci/build-test-matrix.js`, and dynamically invoked from `main.yml` (`node ./ci/build-test-matrix.js ./commits.log ./names.log $run_full`, line 259). The `FULL_MATRIX` entry (lines 180-190):
```js
{
  "name": "Test Linux riscv64",
  "os": ubuntu,
  "target": "riscv64gc-unknown-linux-gnu",
  "gcc_package": "gcc-riscv64-linux-gnu",
  "gcc": "riscv64-linux-gnu-gcc",
  "qemu": "qemu-riscv64 -cpu rv64,v=true,vlen=256,vext_spec=v1.0,zfa=true,...",
  "qemu_target": "riscv64-linux-user",
  "filter": "linux-riscv64",
  "isa": "riscv64",
}
```
This cross-compiles the full workspace and executes real test binaries under a self-built QEMU user-mode emulator, sharded across `wasmtime`, `wasmtime-cli`, `wasmtime-wasi`, and other crate suites. `main.yml` lines 910-948 build QEMU from source and set `CARGO_TARGET_..._RUNNER` to the QEMU binary.

**Runner type:** `"os": ubuntu"` resolves to a standard x86_64 GitHub-hosted `ubuntu-24.04` runner. **There is no native riscv64 hardware runner** - all execution is via QEMU user-mode emulation of a synthetic RV64GCV CPU on x86 silicon. No reference to RISE runner infrastructure (`riseproject-dev` labels) was found in any Wasmtime workflow file.

**Trigger conditionality (verified by tracing `main.yml` lines 1-30 and 193-261):**
- `on:` fires on `pull_request` (to `main` and `release-*`), `merge_group`, `push` (to `release-*` only, not `main`), and `workflow_dispatch`.
- For an ordinary PR to `main`, `run_full` defaults to **false** unless the event isn't `pull_request`, `base_ref != main`, or the commit message contains `prtest:full`.
- When `run_full` is false, `build-test-matrix.js` (lines 409-437) filters `FULL_MATRIX` to only entries whose ISA-tagged source directory changed (`cranelift/codegen/src/isa/riscv64`), or `cranelift/filetests/filetests/runtests` changed, or the commit message contains `prtest:linux-riscv64`. If none match, riscv64 is dropped and CI falls back to `FAST_MATRIX` (x86_64 only).
- `merge_group` events (the pre-merge-to-main queue) and `push`/`pull_request` against `release-*` branches set `run_full=true` unconditionally, running the full matrix including riscv64.

**Verdict:** riscv64 test-execution CI genuinely exists and is substantive, but it is conditionally gated rather than run on every ordinary PR - it does run before code merges to `main` (via the merge queue) and on all release-branch activity, which is the basis for the CI-passing claim behind official release artifacts.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | Native x86_64 GitHub-hosted | [NEEDS VERIFICATION - not directly confirmed native vs emulated in this research pass] | x86_64 GitHub-hosted, QEMU user-mode emulation (synthetic RV64GCV CPU) |
| Runs on every PR to main | Yes (FAST_MATRIX) | [NEEDS VERIFICATION] | No - only on path-relevant changes, explicit opt-in, merge-queue, or release branches |
| Runs before merge to main | Yes | Yes | Yes (via `merge_group`) |
| Release-blocking | Yes | Yes | Yes (release matrix runs the Docker-based cross-compile pipeline) |

Sources: local read of `/home/user/bytecodealliance/wasmtime/.github/workflows/main.yml` and `/home/user/bytecodealliance/wasmtime/ci/build-test-matrix.js` at commit `e8890cc7b3670d14426a15742b81b125df5e288f`.

## 8. Distribution and Release Status

| Channel | riscv64 available? | Detail |
|---|---|---|
| GitHub Releases (native/CLI binaries) | **Yes** | `wasmtime-v48.0.1-riscv64gc-linux.tar.xz` and the C-API tarball `wasmtime-v48.0.1-riscv64gc-linux-c-api.tar.xz`, confirmed present in the v48.0.1 release, built via `ci/build-build-matrix.js`'s Docker-based cross-compile pipeline (`ci/docker/riscv64gc-linux/Dockerfile`) |
| PyPI (`wasmtime` Python bindings) | **No** | `https://pypi.org/pypi/wasmtime/json` (latest 48.0.0) lists wheels for `py3-none-any`, macOS x86_64, manylinux x86_64/aarch64, Windows amd64 - no riscv64 wheel |
| RISE wheel builder (GitLab project 56254198) | No | The project-specific package index redirects (302) to plain PyPI, i.e. no separate RISE-hosted riscv64 wheel exists for `wasmtime` |
| Ubuntu 26.04 (Resolute) | N/A | No `wasmtime`, `python3-wasmtime`, or `libwasmtime` package exists in Ubuntu 26.04 at all, for any architecture - the package is simply not in Ubuntu's archive |

**What a user must do today to get a working riscv64 binary:** download the official `riscv64gc-linux` tarball directly from GitHub Releases, or build from source with `cargo build --target riscv64gc-unknown-linux-gnu --release` (Section 5). For the Python embedding API, there is no installable wheel for riscv64 - a user must build the Rust crate and Python bindings from source themselves; no upstream or RISE path currently produces a riscv64 Python wheel. No Linux distribution packages Wasmtime at all as of this research, so no `apt install` path exists on any architecture.

Sources: [Wasmtime GitHub Releases](https://github.com/bytecodealliance/wasmtime/releases), [PyPI wasmtime JSON API](https://pypi.org/pypi/wasmtime/json), [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Wasmtime&suite=resolute&searchon=names&section=all).

## 9. Dependencies

Wasmtime is a Rust project; the manifest is `Cargo.toml` (workspace root). No CMakeLists.txt/setup.py/go.mod/package.json exists at the top level driving dependency resolution (the CMake file is only a wrapper around Cargo for the C API).

Note on evidence quality: the `project-graph` MCP server failed to connect for the entire research session (`CONNECTION_CLOSED`), so the intended Ubuntu 26.04 package-graph SPARQL queries could not be run. Direct queries to `packages.ubuntu.com` were used as a substitute for corroborating distro-level build evidence only; this should be treated as weaker evidence than the intended graph query and re-run once the server is available.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Cranelift (in-tree) | Default JIT/AOT codegen backend | Full riscv64 ISA backend, all WASM proposals supported except stack-switching (universal gap) | Exercised via `cranelift/filetests` and the full QEMU test-matrix job | Ships in official `riscv64gc-linux` release tarball | None blocking codegen; Tier 3 status means no maintainer SLA |
| Pulley (in-tree) | Portable bytecode interpreter fallback | Architecture-independent by design | Covered incidentally by the riscv64 QEMU test job | Ships in same release artifact | None |
| Winch (in-tree) | Baseline (non-optimizing) JIT, alternative to Cranelift | **No riscv64 backend exists** (`winch/codegen/src/isa/` contains only `x64/` and `aarch64/`) | N/A - not built for riscv64 | N/A - off by default | Open gap, not tracked by a specific numbered issue found; blocked behind aarch64, which is next in the port queue |
| regalloc2 (`bytecodealliance/regalloc2`, v0.15.2) | Register allocator used by every Cranelift backend | Architecture-agnostic; operates on abstract register classes | Exercised transitively by all riscv64 Cranelift tests | Published normally to crates.io | None found |
| capstone (`capstone-rs`/`capstone-sys` v0.14.0/0.18.0) | Disassembler for `objdump`/hot-blocks CLI features | riscv (rv32G/rv64G) disassembly upstream since ~2019 | Known minor bug: wrong operand count on compressed store instructions (`c.sw`), issue #2351 | Distro-packaged for riscv64 (`libcapstone-dev` confirmed in Ubuntu 26.04 riscv64 per direct packages.ubuntu.com check) | Minor, non-blocking for wasmtime's use |
| ring (`briansmith/ring` v0.17.14) | Default crypto backend behind `rustls` for the `wasi-tls` feature (on by default) | Debian/Ubuntu packages the exact pinned version for riscv64, but multiple historical upstream GitHub issues report riscv64 build failures across point releases (#1419, #1612, #2022) and a community fork (`OkitaSan/ring@rv64gc-support`) exists | No dedicated riscv64 CI or optimized assembly path confirmed - riscv64 likely runs ring's portable/generic C fallback, unlike x86_64/aarch64/arm which have hand-tuned assembly | Published normally to crates.io | **Flagged for follow-up:** no clean confirmation of officially maintained riscv64 support; `rustls` upstream is separately moving its default backend toward `aws-lc-rs`, which documents support only for x86/x86-64/aarch64/macOS with **no riscv64** - a future default-backend change could regress `wasi-tls` on riscv64 |
| rustls (`rustls/rustls`) | Pure-Rust TLS, wraps `ring` by default | Pure Rust, no arch-specific code itself | Inherits ring's risk profile | Published normally | Not itself a blocker; risk is entirely inherited from the crypto backend |
| openssl (`openssl-sys`, optional, non-default for `wasi-tls`) | Alternative TLS/crypto backend | riscv port merged upstream May 2022 (PR #17640), actively extended since (AES-RV64I asm, Zbb/Zbc carry-less mult for GCM, Zbb BSWAP) | Regular releases (3.0-4.0 series) all carry riscv64 asm paths | Distro-packaged (`libssl-dev` confirmed in Ubuntu 26.04 riscv64) | None blocking; materially more mature riscv64 story than the default `ring` path |
| sha2 (RustCrypto, v0.10.2) | Hashing, used by cache/content-addressing paths | Pure-Rust generic fallback compiles everywhere including riscv64; no riscv64 assembly-accelerated path exists (only x86/aarch64 intrinsics exist) | Portable, no known riscv64-specific issues | Published normally | None blocking (performance-only caveat: runs unaccelerated) |
| Memory allocator | - | **No dependency** - Wasmtime uses the system default allocator on every platform, including riscv64 | n/a | n/a | None - eliminates a common cross-arch risk category entirely |

**Key dependency risk:** the weakest link identified is `ring`, the default crypto backend behind the default-on `wasi-tls` feature - it has scattered upstream riscv64 build-failure history and no confirmed optimized assembly path on riscv64, and the ecosystem trend of `rustls` moving toward `aws-lc-rs` (which currently has zero riscv64 support) is a forward-looking regression risk worth monitoring, not yet realized.

Sources: [ring GitHub issues #1419](https://github.com/briansmith/ring), [OpenSSL riscv64 port PR #17640](https://github.com/openssl/openssl), [packages.ubuntu.com search for librust-ring-dev, libcapstone-dev, libssl-dev on resolute/riscv64].

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7237](https://github.com/bytecodealliance/wasmtime/issues/7237) | Partially out-of-bounds writes on ARM and riscv | Open | **Correctness/spec-compliance** | Unaligned store crossing a page boundary can partially mutate memory before trapping - violates Wasm's all-or-nothing semantics; confirmed on JH7110 (SiFive U74) hardware |
| [#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) | Bus error with unaligned atomics on RISC-V backend | Open | **Correctness** | Unaligned `atomic_rmw` crashes with a hard bus error instead of a controlled trap; parallel to AArch64 #5483 |
| [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) | run/compile commands on riscv64 backend fail (vector return-value ABI) | Open | Functional | `i32x4`-returning functions fail with "too many return values to fit in registers"; works fine on x86_64 |
| [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) | Cranelift crash in riscv64 isle (gen_store/i8x16 unreachable panic) | Open | Correctness (compiler crash) | Reduced from real-world libsodium `kx` module; affects Wasmtime 46.0.1/47.0.2; filed July 2026, most recent open bug found |
| [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) | vxrm/vxsat registers not preserved or handled | Open | Correctness (latent) | Vector fixed-point rounding/saturation registers aren't saved/restored across calls; currently masked only because QEMU doesn't exercise the conflict |
| [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) | ISLE panic "no rule matched for term gen_bitcast" | Open | Correctness (compiler crash) | Panic compiling `br_table` on riscv64; workaround exists |
| [#11183](https://github.com/bytecodealliance/wasmtime/issues/11183) | Unexpected panic on riscv64: Option::unwrap() on None | Open | Correctness (compiler crash) | Multi-return (f32,f32) combined with spectre-guard + frame-pointer/sret flags |
| [#10281](https://github.com/bytecodealliance/wasmtime/issues/10281) | RISCV frame pointer position differs from LLVM | Open | Interop | Breaks stack unwinding/backtraces/perf profiling when Cranelift- and LLVM-compiled code interoperate; fix proposed, unimplemented |
| [#9186](https://github.com/bytecodealliance/wasmtime/issues/9186) | Support `*_overflow` instructions on s390x and riscv64 | Open | Performance | Missing instruction lowerings force slower fallback sequences |
| [#7186](https://github.com/bytecodealliance/wasmtime/issues/7186) | riscv64: Implement Remaining Vector Instructions | Open | Feature completeness | Parent tracking issue for widening ops, reductions, strided/indexed loads, vector integer division |
| [#7147](https://github.com/bytecodealliance/wasmtime/issues/7147) | Suboptimal register allocation for short function | Open | Performance | Redundant `mv` on trivial functions |
| [#7322](https://github.com/bytecodealliance/wasmtime/issues/7322) | Disable NaN Canonicalization for RISC-V | Open | Performance | Redundant legalization pass on hardware that already produces canonical NaN |
| [#5033](https://github.com/bytecodealliance/wasmtime/issues/5033) | Perform I-Cache Maintenance on RISC-V | Open | Correctness-adjacent | Needed for JIT'd code visibility; filed as completeness item |
| [#13884](https://github.com/bytecodealliance/wasmtime/issues/13884) | Stack switching routine for riscv64 needs to decrement SP before saving registers | Closed 2026-07-23 | Was correctness | Fixed |
| [#13076](https://github.com/bytecodealliance/wasmtime/issues/13076) | Atomics for 8/16-bit values incorrectly have two atomic loads | Closed 2026-05-18 | Was correctness | Fixed |
| [#11540](https://github.com/bytecodealliance/wasmtime/issues/11540) | `uadd_overflow.i64` not in ISLE | Closed 2025-09-03 | Was functional gap | Fixed via PR #11583 |
| [#11133](https://github.com/bytecodealliance/wasmtime/issues/11133) | Segfault on riscv64 related to `call` instruction | Closed 2025-06-25 | Was correctness | Fixed |
| [#10982](https://github.com/bytecodealliance/wasmtime/issues/10982) | Bus error on QEMU executing `atomic_cas.i64` | Closed 2025-06-15 | Was correctness | Fixed |
| [#11011](https://github.com/bytecodealliance/wasmtime/issues/11011) | Segfault on riscv64 with `opt_level=speed` | Closed 2025-06-15 | Was correctness | Fixed |

**Correctness bugs are highlighted separately above** - as of this research, eight open issues carry correctness-severity impact (crashes, hard traps in place of clean Wasm traps, latent register-corruption, ABI mismatches breaking interop), against a backdrop of several similar bugs having been fixed over the preceding 12 months. This density is consistent with a Tier 3 (no continuous fuzzing) classification rather than a Tier 1/2 target.

## 12. Objections and Upstream Blockers

**Stated organizational blocker:** `docs/stability-tiers.md` explicitly names the missing element for Tier 3 to Tier 2 graduation - a committed **full-time maintainer** - as the reason riscv64gc-unknown-linux-gnu remains Tier 3 despite functioning CI. No RFC or formal objection to riscv64 support itself was found; the blocker is resourcing, not technical disagreement.

**Technical blockers:**
- Winch has no riscv64 backend and aarch64, not riscv64, is next in the stated port queue (`winch/README.md`), so Winch parity is not imminent absent dedicated investment.
- Cranelift IR itself lacks vector `sdiv`/`udiv` support, which blocks vector integer division on riscv64 independent of any riscv64-specific work (#7186).
- No continuous fuzzing infrastructure covers riscv64, which correlates with the higher density of open correctness bugs relative to Tier 1/2 targets.

**Organizational blockers:** commit/reviewer access is restricted to people "employed full-time to work on this project" - a would-be riscv64 maintainer would need either an employer sponsoring dedicated Bytecode Alliance work or Recognized Contributor status achieved through sustained contribution.

**Acceptance probability for further riscv64 investment:** High. The community stance explicitly welcomes new-port work and Tier 3 to Tier 2 graduation is a defined, achievable path (sustained CI, fuzzing, identified maintainer) rather than a closed door. The backend already has multiple corporate-affiliated reviewers (Fastly) actively merging riscv64 PRs through 2026, indicating a receptive review process for further contributions.

## 13. Readiness Assessment

- **Color:** green (no sub-type - green carries no `color_case`)
- **Release provider:** upstream
- Wasmtime is not an optimization-purpose project under the skill's test (a general-purpose WebAssembly runtime, not a SIMD/allocator/crypto-speed library), so the Step 2 optimization-coverage cap does not apply and `optimization_gap` is N/A.
- **Justification:** Upstream CI genuinely builds and executes the full test suite for `riscv64gc-unknown-linux-gnu` under QEMU user-mode emulation with vector-extension flags enabled, defined in [`ci/build-test-matrix.js`](https://github.com/bytecodealliance/wasmtime/blob/main/ci/build-test-matrix.js) and wired through [`.github/workflows/main.yml`](https://github.com/bytecodealliance/wasmtime/blob/main/.github/workflows/main.yml), satisfying "CI builds + tests pass." Upstream also publishes official riscv64 binaries directly via GitHub Releases (`wasmtime-v48.0.1-riscv64gc-linux.tar.xz` and C-API tarball), satisfying "upstream publishes riscv64 artifact" with `release_provider: upstream`. All three green criteria in the color model are met on primary source evidence.
- **Pending work that could change the grade:** none identified that would raise it further (green is the ceiling). Work that could **erode** the grade if unaddressed: the open correctness-bug cluster in Section 11 (particularly #7237 and #5882, which are spec-compliance/soundness issues, not mere performance gaps), and the dependency risk on `ring`/`aws-lc-rs` in Section 9. No RISE-funded work specifically targeting Wasmtime was found - RISE tracks Wasmtime only as a transitive dependency risk in other projects' reports and has it queued, not yet written, for its own dedicated report (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`). Formal tier graduation to Tier 2 is gated purely on securing a committed full-time maintainer and continuous-fuzzing coverage - both are addressable investment targets, discussed in Section 14.

## 14. Investment Analysis

**Check of RISE prior work:** No RISE-funded work specifically on Wasmtime was found (no grant, RFP, or blog announcement referencing it). RISE's own tracking repository (`riseproject-dev/sw-ecosystem`) references Wasmtime only as a dependency risk inside a dozen-plus other projects' reports (runwasi, youki, kuasar, wasmcloud, wasmedge, pyodide, etc.) and lists it as queued but not yet given its own dedicated report. RISE's riscv64 CI runners incidentally exercise wasmtime/cranelift as a transitive dependency when building unrelated packages (e.g., `yara-x`, `dprint-py`) in `riseproject-dev/python-wheels`, but this is not dedicated Wasmtime investment. No work items below are already covered by RISE.

### 14.1 Functional Enablement
- Fix the two correctness bugs with soundness implications: unaligned-atomic bus error (#5882) and partial out-of-bounds writes (#7237) - both need either clean trap-on-misalignment behavior or Zam-extension support.
- Fix the vector-return-value ABI gap (#11050) blocking `i32x4`-and-similar return types.
- Complete the RVV instruction gaps tracked in #7186 (widening/narrowing ops, multi-register vector moves, reductions, strided/indexed/segment load-store).
- Address the register-preservation bug for vxrm/vxsat (#13078) before any concurrent/interleaved SIMD workload is trusted.
- Triage and fix the ISLE panic/crash cluster (#13959, #12195, #11183).

### 14.2 Performance Optimization
- Establish a Sightglass (or equivalent) riscv64 benchmark baseline - none currently exists, which is itself a blocker to quantifying any optimization work's value.
- Close #7147 (redundant register move) and #7322 (unneeded NaN canonicalization) - both are described in their issues as straightforward, scoped fixes.
- Evaluate and close remaining SIMD codegen-quality issues (#6600, #6623, #7188).
- Evaluate a hand-tuned riscv64 assembly path for `sha2` and other numerics crates currently running the generic Rust fallback.

### 14.3 CI/CD Infrastructure
- Fund/commit a full-time maintainer for `riscv64gc-unknown-linux-gnu` - this is the single named blocker to Tier 2 graduation per `docs/stability-tiers.md`.
- Extend continuous fuzzing (OSS-Fuzz-style) coverage to riscv64, which Tier 1 requires and which likely would have caught several of the closed-but-recent crash bugs (#13959, #12195, #11183) earlier.
- Evaluate native riscv64 hardware runners (e.g., RISE RISC-V Runners, announced 2026-03-24) as a faster/more representative alternative to QEMU user-mode emulation for at least a subset of the test matrix.

### 14.4 Ecosystem Enablement
- Produce a riscv64 wheel for the `wasmtime` Python package (currently absent from both PyPI and the RISE wheel builder) - straightforward packaging work once native riscv64 binaries already exist.
- Package Wasmtime for at least one major Linux distribution on riscv64 (currently absent from Ubuntu entirely, any architecture) if distro-level availability matters to target users.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix unaligned-atomic bus error and partial OOB write correctness bugs (#5882, #7237) | 2-4 | Cranelift/riscv64 maintainer | Critical |
| Functional | Fix vector return-value ABI gap (#11050) | 1-2 | Cranelift maintainer | High |
| Functional | Complete RVV instruction gaps per #7186 (widening ops, reductions, strided/indexed load-store) | 6-10 | Cranelift/riscv64 maintainer | High |
| Functional | Fix vxrm/vxsat register preservation (#13078) | 1-2 | Cranelift/riscv64 maintainer | High |
| Functional | Triage/fix ISLE panic cluster (#13959, #12195, #11183) | 2-3 | Cranelift maintainer | Medium |
| Performance | Establish riscv64 Sightglass benchmark baseline | 1-2 | Perf engineer | High |
| Performance | Fix regalloc redundancy (#7147) and NaN-canonicalization overhead (#7322) | 1 | Cranelift maintainer | Medium |
| Performance | Close SIMD codegen-quality gaps (#6600, #6623, #7188) | 2-4 | Cranelift/riscv64 maintainer | Low |
| CI/CD | Fund/commit full-time riscv64 maintainer for Tier 2 graduation | ongoing (0.5-1.0 FTE) | Sponsoring org | Critical |
| CI/CD | Extend continuous fuzzing to riscv64 | 2-3 setup, ongoing infra cost | Infra engineer | High |
| CI/CD | Evaluate native riscv64 hardware runners vs QEMU | 1-2 | Infra engineer | Medium |
| Ecosystem | Produce riscv64 PyPI wheel for `wasmtime` Python bindings | 1 | Packaging engineer | Medium |
| Ecosystem | Package Wasmtime for a major Linux distro on riscv64 | 2-3 | Packaging engineer | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [Wasmtime homepage](https://wasmtime.dev/)
- [bytecodealliance/wasmtime GitHub repository](https://github.com/bytecodealliance/wasmtime)
- [Issue #2217 - Support RISC-V target in new backend framework](https://github.com/bytecodealliance/wasmtime/issues/2217)
- [PR #4271 - add riscv64 backend for cranelift](https://github.com/bytecodealliance/wasmtime/pull/4271)
- [Commit 59e18b7d - Remove the old riscv backend](https://github.com/bytecodealliance/wasmtime/commit/59e18b7d1b130a0e498701a37cdb3bdc33dd02d0)
- [PR #5017 - Tls and abi for riscv64](https://github.com/bytecodealliance/wasmtime/pull/5017)
- [PR #6240 - riscv64: Initial SIMD Vector Implementation](https://github.com/bytecodealliance/wasmtime/pull/6240)
- [PR #9135 - riscv64: Initial support for FP16 math](https://github.com/bytecodealliance/wasmtime/pull/9135)
- [PR #10652 - Add initial support for f16/f128 to riscv64 backend](https://github.com/bytecodealliance/wasmtime/pull/10652)
- [PR #12506 - Add fiber implementation for riscv32imac](https://github.com/bytecodealliance/wasmtime/pull/12506)
- [PR #13738 - riscv64: Add Zvbb extension support](https://github.com/bytecodealliance/wasmtime/pull/13738)
- [Issue #7186 - riscv64: Implement Remaining Vector Instructions](https://github.com/bytecodealliance/wasmtime/issues/7186)
- [Issue #5882 - bus error with unaligned atomics on RISC-V backend](https://github.com/bytecodealliance/wasmtime/issues/5882)
- [Issue #7237 - Partially out-of-bounds writes on ARM and riscv](https://github.com/bytecodealliance/wasmtime/issues/7237)
- [Issue #11050 - run/compile commands on riscv64 backend fail](https://github.com/bytecodealliance/wasmtime/issues/11050)
- [Issue #13959 - Cranelift crash in riscv64 isle](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [Issue #13078 - vxrm/vxsat registers not preserved or handled](https://github.com/bytecodealliance/wasmtime/issues/13078)
- [Issue #10281 - RISCV frame pointer position differs from LLVM](https://github.com/bytecodealliance/wasmtime/issues/10281)
- [Issue #7147 - Suboptimal register allocation for short function](https://github.com/bytecodealliance/wasmtime/issues/7147)
- [Issue #7322 - Disable NaN Canonicalization for RISC-V](https://github.com/bytecodealliance/wasmtime/issues/7322)
- [Issue #9186 - Support *_overflow instructions on s390x and riscv64](https://github.com/bytecodealliance/wasmtime/issues/9186)
- [docs/stability-tiers.md](https://docs.wasmtime.dev/stability-tiers.html)
- [docs/stability-platform-support.md](https://github.com/bytecodealliance/wasmtime/blob/main/docs/stability-platform-support.md)
- [docs/contributing-cross-compiling.md](https://github.com/bytecodealliance/wasmtime/blob/main/docs/contributing-cross-compiling.md)
- [ci/build-test-matrix.js](https://github.com/bytecodealliance/wasmtime/blob/main/ci/build-test-matrix.js)
- [ci/docker/riscv64gc-linux/Dockerfile](https://github.com/bytecodealliance/wasmtime/blob/main/ci/docker/riscv64gc-linux/Dockerfile)
- [.github/workflows/main.yml](https://github.com/bytecodealliance/wasmtime/blob/main/.github/workflows/main.yml)
- [winch/README.md](https://github.com/bytecodealliance/wasmtime/blob/main/winch/README.md)
- [Wasmtime GitHub Releases](https://github.com/bytecodealliance/wasmtime/releases)
- [PyPI wasmtime JSON API](https://pypi.org/pypi/wasmtime/json)
- [packages.ubuntu.com search for Wasmtime](https://packages.ubuntu.com/search?keywords=Wasmtime&suite=resolute&searchon=names&section=all)
- [Bytecode Alliance - About](https://bytecodealliance.org/about)
- [ADOPTERS.md](https://github.com/bytecodealliance/wasmtime/blob/main/ADOPTERS.md)
- [Bytecode Alliance - Wasmtime and Cranelift in 2023](https://bytecodealliance.org/articles/wasmtime-and-cranelift-in-2023)
- [Bytecode Alliance - Wasmtime 1.0: A Look at Performance](https://bytecodealliance.org/articles/wasmtime-10-performance)
- [RISE Project - A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/sw-ecosystem GitHub organization](https://github.com/riseproject-dev)