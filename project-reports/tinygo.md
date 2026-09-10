---
title: TinyGo
parent: Project Reports
color: yellow
---

# TinyGo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for TinyGo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

TinyGo is an ahead-of-time Go compiler built on LLVM, targeting embedded microcontrollers, WebAssembly, and (secondarily) small command-line binaries. It reuses the Go frontend/type system but replaces the standard Go runtime and code generator with an LLVM-based pipeline sized for constrained devices (flash/RAM-limited MCUs). License: BSD 3-Clause, matching upstream Go, with LLVM-derived (Apache 2.0 with LLVM exceptions) and Teensy-derived (PJRC) code in specific files.

**Governance:** TinyGo is not part of any foundation (not CNCF, not Linux Foundation). Per `GOVERNANCE.md`, an informal "Board" of maintainers governs by majority vote, do-ocracy, and a "proof of work" weighting model, with self-elected membership. Current board: Ayke van Laethem (project creator/lead), Ron Evans (`ron@hybridgroup.com`, The Hybrid Group), Daniel Esteban, Damian Gryski, Masaaki Takasago, Patricio Whittingslow, Yurii Soldak. Copyright is held by "The TinyGo Authors," with one corporate copyright holder listed in `CONTRIBUTORS`: Loon, LLC.

**Corporate/financial sponsorship:** Funded via OpenCollective (`.github/FUNDING.yml`), fiscally hosted by The Hybrid Group (Ron Evans's company), the largest contributor to date ($3,456.26). Quesma is the only other named organizational sponsor ($100). Corporate affiliation is otherwise visible only through contributor commit emails: Fastly (`dkegel@fastly.com`, `randy.reddig@fastly.com` - Fastly is a major TinyGo/WASI consumer for Compute@Edge) and 9elements (`leon.gross@9elements.com`). TinyGo is **not** a RISE member; RISE's published member list (Premier and General tiers) contains no Go/TinyGo entity, and no RISE blog post, working-group repo, or issue mentions TinyGo (see Section 12).

**Community culture on new ports:** No formal PLATFORMS.md/SUPPORT.md/MAINTAINERS/CODEOWNERS document exists. Boards are informally bucketed into Featured/Supported/Older tiers on the docs site (RISC-V's HiFive1 Rev B currently sits in "Older Boards"). Contribution guidance (tinygo.org/docs/guides/contributing) is welcoming: contributors are asked to open an issue first, and the guidance explicitly separates "new architecture" work (compiler changes) from "new chip on existing architecture" work (mainly `src/runtime` and `machine` package changes) - the latter is called out as a good first contribution.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-03-30 (authored) / 2019-07-07 (merged) | First RISC-V commit: adds SiFive HiFive1 Rev B board (riscv32) | commit `ffa38b183b32331dd247e337a985c4eb5a7d9350` |
| 2019-11-29 | RISC-V codegen switched from GNU toolchain to LLVM/lld; RISC-V promoted to stable, enabled in CI by default | [PR #762](https://github.com/tinygo-org/tinygo/pull/762), commit `d441f0152fb5943c960544cd39675bb7792b641e` |
| 2019-11-29 | `hifive1-qemu` target added for CI testing | [PR #763](https://github.com/tinygo-org/tinygo/pull/763) |
| 2020-01 to 2020-03 | Interrupt support, CSR intrinsics, task-based scheduler for RV32, VirtIO/QEMU RISC-V test target | [PR #838](https://github.com/tinygo-org/tinygo/pull/838), [PR #1220](https://github.com/tinygo-org/tinygo/pull/1220), [PR #976](https://github.com/tinygo-org/tinygo/pull/976) |
| 2020-06-01 | Kendryte K210 (riscv64 hardware) added | [PR #1149](https://github.com/tinygo-org/tinygo/pull/1149) |
| 2020-07-01 | Assembly refactor to support RV64 + F extension (early riscv64 groundwork) | commit `43a66b39ccf0f0206913cd4efce71f66bd103781` |
| 2021-09 | ESP32-C3 support (riscv32), software 32-bit atomics, MSTATUS.MIE workaround for chips lacking the MIE CSR | commits `b31d24138831f328cc43fbb94b935b3264399578`, `af00e218a8e9c7c38adad7d1646445c06afffba4` |
| 2022-06-16 | `recover()` builtin added; PR body explicitly lists riscv64 as an unimplemented TODO | [PR #2331](https://github.com/tinygo-org/tinygo/pull/2331) |
| 2022-09-02 | `hifive1-qemu` removed in favor of generic `riscv-qemu` (riscv32) | [PR #3124](https://github.com/tinygo-org/tinygo/pull/3124) |
| 2023-03-13 | Dedicated `riscv64-qemu` target opened as WIP | [PR #3545](https://github.com/tinygo-org/tinygo/pull/3545) - **never merged, stalled since first review** |
| 2025-03 to 2025-06 | riscv-qemu (riscv32) gains VirtIO RNG, real `time.Sleep`, multicore scheduler prototype | [PR #4791](https://github.com/tinygo-org/tinygo/pull/4791), [PR #4841](https://github.com/tinygo-org/tinygo/pull/4841), [PR #4851](https://github.com/tinygo-org/tinygo/pull/4851) |
| 2026-07-24 | `recover()` support added for riscv64, closing a gap that existed since 2022 | [PR #5551](https://github.com/tinygo-org/tinygo/pull/5551), merged into `dev`, first shipped in v0.42.0 |
| 2026-07-24 (still open) | Broader panic/unwinding mechanism (Wasm + riscv64, since riscv64 lacks native unwinding) | [PR #5550](https://github.com/tinygo-org/tinygo/pull/5550) - open, unmerged |

**Key contributors:** Ayke van Laethem (project lead, personal) authored essentially all of the foundational RISC-V work (HiFive1, LLVM switch, interrupts, scheduler). Community contributor Yannis Huber added I2C and the RV64+F-extension refactor in 2020. Jake Bailey (independent contributor, no listed corporate affiliation found) authored the 2026 riscv64 recover/unwinding work (PR #5550/#5551).

**Is it fully upstream?** Partially. Base riscv32 support (HiFive1, FE310, K210, ESP32-C3/C6, RP2350's riscv32 core, VirtIO/QEMU) is fully merged and has been stable since 2019-2020. riscv64 as a distinct, dedicated codegen/execution target is not fully upstream: the only dedicated riscv64-qemu bring-up attempt (PR #3545) remains open and stalled since March 2023, so riscv64 has no emulated test target and no CI execution path at all - it exists only as a cross-compile target for one real-hardware board (K210/maixbit).

## 3. Upstream Support Tier

There is no formal tiering document (no PLATFORMS.md/SUPPORT.md). Evidence-based tier assessment:

- **CI:** riscv32 is built and tested (QEMU-executed) in every PR/push to `dev`/`release` via `.github/workflows/linux.yml`. riscv64 is built (one board, K210/maixbit) but never executed/tested.
- **Release-blocking:** The `smoketest-linux` and `assert-test-linux` jobs run on `pull_request` and `push` to `dev`/`release`, i.e. are part of the required CI gate - but riscv64's contribution to that gate is compile-only.
- **Official binaries:** No riscv64 host binary is published in any checked release (v0.42.0, v0.41.1, v0.41.0, v0.40.0) - see Section 8.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | yes | yes | yes (1 board, K210/maixbit, build-only) |
| Upstream CI executes tests | yes (native) | not directly assessed this session, but arm64 is a full release target | no (no QEMU riscv64 target exists) |
| Upstream release binary (host TinyGo compiler) | yes (`tinygo0.42.0.linux-amd64.tar.gz`, `.deb`) | yes (`tinygo0.42.0.darwin-arm64.tar.gz`, `tinygo0.42.0.linux-arm64.tar.gz`, `.deb`) | no |
| Compile *target* support (`tinygo build -target=...`) | n/a (host) | yes, mature | yes, but incomplete (see Section 4) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

TinyGo has no JIT (it is strictly ahead-of-time via LLVM for all architectures) and no SIMD/vector dispatch anywhere in the codebase for any architecture searched. A recursive search of `compiler/`, `builder/`, `src/runtime/`, `src/device/riscv/`, `src/internal/task/` for `vector|simd|rvv|vfloat|vint` returned zero RVV/vector-extension hits (only unrelated matches: C++ `std::vector`, interrupt "vector tables", LLVM's generic `VectorTypeKind`). No `V` (vector) extension appears in any `targets/*.json` `features` field.

### File inventory comparison (source: direct clone inspection, HEAD `02021b5853f39750fd0c12c92be2f3e09a9352ac`)

| Arch | Dedicated files | Notes |
|---|---|---|
| amd64 | 9 (`task_stack_amd64.S/.go`, Windows ABI variants, `asm_amd64.S`, `arch_amd64.go`, `device/amd64/cpu_amd64.S`, `device/uefi/asm_amd64.S`) | All amd64-exclusive, full CFI unwind info, multiple OS variants |
| arm64 | 7 (`task_stack_arm64.S/.go`, `asm_arm64.S`, `arch_arm64.go`, `dynamic_arm64.go`, `device/arm64/arm64.go`) | All arm64-exclusive, full CFI unwind info |
| riscv64 | 2 exclusive (`arch_tinygoriscv64.go`, 8 lines; `runtime_tinygoriscv64.go`, 38 lines) out of 12 riscv-tagged files total | The other 10 files are shared with riscv32 via the generic `tinygo.riscv` build tag or `targets/riscv.json`'s `extra-files`; no riscv64-only assembly file exists at all |

### Component-level verdict

| Component | Verdict | Basis |
|---|---|---|
| `.bss`/`.data` init, `GOARCH`/`TargetBits` constants | full (hand-tuned) | `runtime_tinygoriscv64.go` - correct 8-byte-word copy loop, mirrors riscv32 pattern |
| Compiler codegen (march flags, int128 builtins, defer-frame asm) | full (hand-tuned) | `builder/library.go` (`riscvMarch`), `builder/builtins.go` (`genericBuiltins128` for riscv64), `compiler/defer.go` all correctly branch riscv32 vs riscv64 (`sd` vs `sw`, correct `-march=`) |
| Interrupt entry/exit (`src/device/riscv/handleinterrupt.S`) | full (hand-tuned) | Properly `__riscv_xlen`-gated, handles both integer and float (`__riscv_flen`) register banks |
| Panic/recover, stack scan, longjmp (`src/runtime/asm_riscv.S`) | full, but only since 2026-07-24 | Was entirely broken/unsupported on riscv64 until [PR #5551](https://github.com/tinygo-org/tinygo/pull/5551) - six weeks before this research - which fixed `asm_riscv.S` to use xlen-conditional register loads instead of raw `lw` |
| **Goroutine task-switch (`src/internal/task/task_stack_tinygoriscv.S`)** | **missing / broken** | Hardcoded `sw`/`lw` (32-bit store/load) and a fixed 52-byte (13x4) stack frame, with no `__riscv_xlen` guard, despite being force-included for both riscv32 and riscv64 via `targets/riscv.json`'s `extra-files`. `calleeSavedRegs` (`task_stack_tinygoriscv.go`) declares 13 `uintptr` fields, 8 bytes each on riscv64 - so a riscv64 task switch would save/restore only the low 32 bits of `ra, s0-s11`, silently corrupting state. Currently masked because `targets/riscv64.json` sets no `scheduler` key (defaults to `"none"`, no goroutines) - `targets/riscv32.json` explicitly sets `"scheduler": "tasks"`. [NEEDS VERIFICATION - this is source-code analysis by this research pass, not a filed upstream issue] |
| QEMU/emulated target | missing | `targets/riscv-qemu.json` inherits `riscv32`, not riscv64. `src/runtime/runtime_tinygoriscv_qemu.go` (524 lines, the bulk of substantive RISC-V runtime logic - multicore SMP, ACLINT interrupts, spinlocks, GC stop-the-world) is gated only on generic `tinygo.riscv && virt && qemu` tags but is dead code for riscv64 in practice since no riscv64 target sets those tags. Dedicated attempt: [PR #3545](https://github.com/tinygo-org/tinygo/pull/3545), open/stalled since March 2023 |
| Real hardware target | partial | Only `targets/k210.json` (Kendryte K210 dual-core, added 2020 via [PR #1149](https://github.com/tinygo-org/tinygo/pull/1149)), and `maixbit` (Sipeed MAIX Bit board, flashed via `kflash`). Not exercised in CI/smoketest beyond a compile-only build |
| Native stack unwinding | absent | [PR #5550](https://github.com/tinygo-org/tinygo/pull/5550) (open, unmerged) states explicitly: "RISCV64 is a platform without native unwinding... not sure why that's the case" |
| RVV/vector, Zb* bit-manipulation extensions | absent | Zero RVV intrinsic hits; no `V` extension in any target JSON; ISA extension flags present are only base/standard ones (`i/m/a/c/f/d`, `Zaamo`, `Zalrsc`, `Zicsr`, `Zifencei`, `Zmmul`, `Zihintpause`) - `Zbb` not present anywhere |

### Comparison table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT backend | none (AOT only, all archs) | none | none |
| SIMD/vector dispatch | none found in TinyGo itself | none found in TinyGo itself | none found |
| Goroutine task switch | dedicated, full | dedicated, full | shared file, width-broken for 64-bit (see above) |
| Panic/recover | full | full | full, only since 2026-07-24 ([PR #5551](https://github.com/tinygo-org/tinygo/pull/5551)) |
| Native stack unwinding | yes (implied by platform) | yes (implied by platform) | no ([PR #5550](https://github.com/tinygo-org/tinygo/pull/5550)) |
| Emulated CI test target | native runner (no QEMU needed) | not directly assessed this session | none exists |

## 5. Build System, Cross-Compilation, and Toolchain

TinyGo is not a CMake project (no `CMakeLists.txt`, no `cmake/riscv64.cmake`, no riscv64-specific Dockerfile anywhere in the repo). It is built via `go build`/`go install` orchestrated by a top-level `GNUmakefile`; CMake only appears as the build system for the vendored LLVM/Clang/LLD that TinyGo statically links, and for bundled Binaryen.

**Exact build commands** (from `BUILDING.md` and `GNUmakefile`):
```
git clone --recursive https://github.com/tinygo-org/tinygo
cd tinygo
make llvm-source     # shallow-fetches the pinned LLVM commit
make llvm-build       # configures+builds LLVM/Clang/LLD via CMake+Ninja
make                  # builds the tinygo Go binary
make release          # optional: static release tarball
```

`make llvm-build` runs CMake with `-DLLVM_TARGETS_TO_BUILD=X86;ARM;AArch64;AVR;Mips;RISCV;WebAssembly` (`make/llvm.mk` line 92) - RISCV is hardcoded into the target list; there is no documented flag to disable it, and no `-DLLVM_ENABLE_RISCV=OFF`-style toggle exists. The `-D..._OFF` flags present (`LLVM_ENABLE_TERMINFO`, `LLVM_ENABLE_ZLIB`, `LLVM_ENABLE_ZSTD`, `LLVM_ENABLE_LIBEDIT`, `LLVM_ENABLE_Z3_SOLVER`, `LLVM_ENABLE_OCAMLDOC`, `LLVM_ENABLE_LIBXML2`, `LLVM_TOOL_CLANG_TOOLS_EXTRA_BUILD`, `CLANG_ENABLE_STATIC_ANALYZER`, `CLANG_ENABLE_ARCMT`) are all generic LLVM feature toggles, none riscv64-specific.

**Toolchain version requirements and why:**
- Go: `BUILDING.md` states 1.19+, but `go.mod` pins `go 1.25.0`; CI uses Go 1.27.1.
- LLVM: TinyGo does not use the system LLVM/Clang for riscv64 codegen - it builds and statically links its own fork, `tinygo-org/llvm-project`, pinned by commit hash in `llvm-version.txt` (`2be7242b6a4d59fe89fb43f7d1e7333dc9b307a2`, tracking `tinygo_22.x`). This is why there is no external "GCC/Clang minimum for riscv64" requirement - TinyGo brings its own compiler/assembler/linker (clang+lld) for cross-compiling to riscv64 and does not shell out to `riscv64-unknown-elf-gcc` (confirmed: zero references to that toolchain name in the Go source; the only external `riscv64-unknown-elf-gdb` reference in `targets/riscv.json` is for debugging, not building).

**QEMU usage:** Only `qemu-system-riscv32` is installed in CI (`.github/workflows/linux.yml` line 240) and referenced by any target JSON (`targets/riscv-qemu.json`'s `emulator` field). There is no `qemu-system-riscv64` anywhere in the repository - workflows, Makefiles, or target JSON. 64-bit RISC-V has no emulated test path in this codebase.

**Known build failures:**
- [Issue #4924](https://github.com/tinygo-org/tinygo/issues/4924) (open): `ld.lld: error: couldn't allocate output register for constraint '{r0}'` when building a large go-ethereum-derived codebase for `-target=riscv-qemu` on the `dev` branch.
- [Issue #4192](https://github.com/tinygo-org/tinygo/issues/4192) (open, unanswered since 2024-03-13): `tinygo build -target=riscv32` fails with undefined references (`putchar`, `exit`, `ticks`), indicating incomplete bare-metal RV32IM runtime support - not riscv64-specific but indicative of runtime gaps in the shared riscv code path.
- [Issue #4966](https://github.com/tinygo-org/tinygo/issues/4966) (open): `TestEmulatedRISCV` runs under LLVM 18 but times out under LLVM 19 and hangs indefinitely under LLVM 20 in QEMU - a live CI-health risk as the project moves to newer LLVM (this affects the riscv32 QEMU test suite, the only executed RISC-V tests in CI).

**Host cross-compilation gap:** `make/config.mk`'s `CROSS=` variable (for cross-building the `tinygo` compiler binary itself on a different host architecture) implements only `arm-linux-gnueabihf` and `aarch64-linux-gnu` - there is no riscv64 case; setting `CROSS=riscv64-linux-gnu` hits an explicit `$(error Unknown cross compilation target: $(CROSS))` (`make/config.mk` line 129). TinyGo's own build system supports host cross-compilation to arm/aarch64 but explicitly not to riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Host TinyGo compiler binary | yes | yes | no (must build from source) |
| Compile target (`-target=riscv64` generic) | n/a | n/a | yes, but no linker script/board provided by default |
| Compile target with real hardware | n/a | n/a | k210/maixbit only |
| Emulated/QEMU compile+execute target | n/a (native) | not assessed | no (riscv-qemu.json is riscv32-only) |
| Goroutine scheduler | full | full | unsafe if enabled (see Section 4); currently defaults to no scheduler |
| panic/recover | full | full | full, only since 2026-07-24 |
| Native stack unwinding | yes | yes | no |
| FPU/hardware float | yes | yes | depends on board; TinyGo overall lacks general hardware-FPU integration ([Issue #2672](https://github.com/tinygo-org/tinygo/issues/2672), open since 2022, stalled) - affects RISC-V boards without the F/D extension the same way it affects Cortex-M |

**Functional gaps:** No riscv64 emulated test target exists at all (cannot run/verify riscv64 code without physical K210 hardware). Goroutine-based concurrency is unsafe on riscv64 if explicitly enabled (task-switch register-width bug, Section 4). No native stack unwinding on riscv64 (Wasm and riscv64 share this gap per [PR #5550](https://github.com/tinygo-org/tinygo/pull/5550)).

**Performance gaps:** No RVV/vector or Zb*-extension usage anywhere in the codebase for riscv64 (or for any TinyGo-authored code path on any architecture - TinyGo has no SIMD dispatch layer at all, so this is not a riscv64-specific deficit but a project-wide characteristic). No published TinyGo riscv64 performance benchmarks were found anywhere (see Section 12 for the exhaustive search record) - `tinygo-org/tinybench` compares compiler output across languages (Go/Rust/Zig/C) but only on an x86-64 host, with no RISC-V or ARM64 data.

**Security hardening gaps:** Not separately assessed this session beyond the generic `-fno-exceptions -fno-unwind-tables -fno-asynchronous-unwind-tables` flags shared by all riscv targets (`targets/riscv.json`) - these are consistent with TinyGo's bare-metal embedded design goals (small binaries), not a riscv64-specific weakening.

**NaN/floating-point semantics issues:** No open NaN-specific or floating-point-correctness bug scoped to RISC-V was found (searched "riscv nan floating"; only a generic, architecture-agnostic issue [#276](https://github.com/tinygo-org/tinygo/issues/276) exists, "Float to integer conversion may result in undefined behavior").

## 7. CI/CD Infrastructure

**Verdict: no riscv64 execution/test CI exists.** Confirmed by direct read of every file in `.github/workflows/` (`build-macos.yml`, `compat.yml`, `docker.yml`, `linux.yml`, `llvm.yml`, `nix.yml`, `release.yml`, `sizediff.yml`, `windows.yml`) at HEAD `02021b5853f39750fd0c12c92be2f3e09a9352ac`, plus confirmed absence of `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`.

The literal string `riscv64` appears in **zero** workflow YAML files. Only `linux.yml` mentions "riscv" at all, in exactly two places:

1. **`smoketest-riscv` job** (`smoketest-linux`, line 197, triggered on `pull_request`/`push` to `dev`/`release`, runner `ubuntu-latest` x86_64): cross-compiles example programs for `esp32c3-*`, `hifive1b`, `tkey` (all riscv32) and `maixbit` (the one riscv64 target, inherits `k210.json` -> `riscv64.json`, `-march=rv64gc`). This is compile-only - `tinygo build` producing a `.bin`/`.hex` checksummed with `md5sum` - no execution, no boot, no flash, no emulation.
2. **`assert-test-linux` job** (line 240, runner `ubuntu-24.04` x86_64): installs `qemu-system-riscv32` via apt. `qemu-system-riscv64` is never installed or referenced anywhere. This QEMU is used by `make tinygo-test-baremetal` -> `tinygo test -target riscv-qemu`, and `targets/riscv-qemu.json` inherits `riscv32`. This is the only place in CI that actually boots and executes RISC-V code, and it is unambiguously 32-bit.

No RISE runners are referenced anywhere in CI (no `riseproject-dev` string, no RISE runner labels found in any workflow file).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | native GitHub-hosted x86_64 | not directly assessed this session (separate matrix legs exist per `linux.yml`) | none (all riscv work runs cross-compiled on x86_64 `ubuntu-latest`/`ubuntu-24.04`) |
| Build in CI | yes | yes | yes (1 board, K210/maixbit, compile-only) |
| Test execution in CI | yes | not assessed | no (only riscv32 executes, via `qemu-system-riscv32`) |
| Release-blocking | yes | yes | build step only (no test gate) |

Any claim of "riscv64 CI" for TinyGo should be qualified sharply: it exists only as an unexercised cross-compile smoke test for one board (K210/maixbit), not as tested/executed CI.

## 8. Distribution and Release Status

**No riscv64 binary is available for TinyGo through any channel checked:**

- **GitHub Releases:** v0.42.0 (latest, Sep 2026), v0.41.1, v0.41.0, and v0.40.0 all ship the identical asset pattern: `darwin-amd64`, `darwin-arm64`, `linux-amd64`, `linux-arm`, `linux-arm64`, `windows-amd64` tarballs/zip, plus `.deb` for `amd64`/`arm64`/`armhf`, plus source archives. Zero riscv64 assets in any of the four releases checked.
- **PyPI:** No `tinygo` package exists (`https://pypi.org/pypi/tinygo/json` -> HTTP 404; `https://pypi.org/simple/tinygo/` -> HTTP 404). Expected, since TinyGo is a Go toolchain, not Python-distributed - confirms the channel is genuinely absent rather than unchecked.
- **RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tinygo/` redirects to the same 404 PyPI page - no RISE-built wheel exists (moot, since TinyGo isn't a Python package).
- **Ubuntu 26.04 (Resolute):** No `tinygo` package for any architecture. Direct search at `packages.ubuntu.com` returned "Sorry, your search gave no results" (confirmed twice, once via a Launchpad fallback: "No packages matching 'tinygo' are published in Resolute").
- **Arch Linux RISC-V (archriscv.felixc.at):** No mention of `tinygo` found on the project's porting/status pages (two independent fetches).

**What a user must do to get a working TinyGo compiler capable of targeting riscv64:** build TinyGo from source on their own host (the Section 5 build sequence), regardless of host architecture, since no upstream distribution channel ships a prebuilt binary for riscv64 hosts and no distribution ships TinyGo at all for any architecture. Once built, `tinygo build -target=riscv64` (or `-target=k210`/`-target=maixbit`) can cross-compile output binaries to riscv64, but only for the K210/MAIX Bit hardware target - there is no generic riscv64 Linux userspace target and no riscv64 QEMU target to run/verify the output.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| LLVM (`tinygo.org/x/go-llvm`, pin `20260721072906-185673ef46a5`) | Core codegen backend | yes, full backend, actively maintained (SiFive/Craig Topper contributes RISC-V codegen upstream) | partial - zero riscv64 in LLVM's own required pre-merge CI; only `libc/**`-scoped QEMU execution | Ubuntu 26.04 ships `llvm` 1:21.1.6-71 and `llvm-17`...`llvm-22` for riscv64 (per existing `project-reports/llvm.md`, graded yellow) - no upstream LLVM riscv64 release binaries | 10 open riscv64 correctness bugs in LLVM per `project-reports/llvm.md`, incl. #200030 (NaN canonicalization), #171978 (miscompile at -O2/O3), #138130 (infinite loop w/ stack-clash protection) |
| `tinygo.org/x/go-llvm` (Cgo bindings) | Glue linking TinyGo's Go code to LLVM's C API | architecture-generic wrapper, should build wherever LLVM+headers are present; not independently verified this session | not verified this session | source-built, n/a | 0 riscv64-tagged issues found |
| Boehm-Demers-Weiser GC (`ivmai/bdwgc`, submodule `lib/bdwgc`) | Selectable GC backend (`-gc=boehm`) | yes, confirmed by source inspection - `include/private/gcconfig.h` has a native `RISCV` arch port (32/64-bit, Linux/*BSD) | inconclusive (GitHub search errored, not a real "zero issues" signal) | vendored submodule, not packaged | not independently assessed |
| musl libc (`tinygo-org/musl-libc` fork, submodule `lib/musl`) | Static libc for `-libc=musl` Linux targets | yes, confirmed by source inspection - `arch/riscv64/` present in the fork | n/a, vendored | vendored submodule | 0 riscv64 issues found on the fork |
| picolibc (`picolibc/picolibc`, submodule `lib/picolibc`) | libc for bare-metal RISC-V/ARM MCU targets (used by most RISC-V embedded boards TinyGo supports) | yes, actively maintained riscv target (dedicated meson cross files, CI) | n/a, vendored | vendored submodule | [#819](https://github.com/picolibc/picolibc/issues/819) `-fcf-protection=full` build failure on some RISC-V toolchains, open since 2024-08 |
| binaryen (`WebAssembly/binaryen`, submodule `lib/binaryen`) | Provides `wasm-opt` for TinyGo's wasm optimization pipeline | no riscv64-specific build failures found | not verified this session | no upstream riscv64 release binaries (only x86_64/arm64/macOS/Windows shipped) | none found |
| wazero (`github.com/tetratelabs/wazero` v1.9.0) | Pure-Go WebAssembly runtime used by TinyGo's WASM/WASI tooling | yes, pure Go, riscv64 fully supported `GOARCH` | n/a (Go module) | n/a (Go module) | **Gap found by source inspection:** wazero's optimizing "wazevo" compiler engine (`internal/engine/wazevo/backend/isa/`) has native codegen backends only for `amd64/` and `arm64/` - no riscv64 ISA backend. `NewRuntimeConfigCompiler()`'s own doc-comment warns it panics at runtime where the compiler isn't supported; `NewRuntimeConfig()`'s auto-detect silently falls back to the slower pure-Go interpreter on riscv64. Not a filed/tracked bug - a real functional/perf gap surfaced by this research |
| klauspost/compress (indirect, v1.17.11) | Pure-Go compression, pulled in indirectly | pure Go, riscv64 fully supported by the Go toolchain | not independently verified | n/a | not searched this session |

**Deep-dive - LLVM (load-bearing dependency):** Already has a full RISC-V readiness report on file (`project-reports/llvm.md`, dated 2026-06-17), graded **yellow** - build-only CI, no upstream release binaries, distro-packaged on Ubuntu 26.04 riscv64. Since TinyGo statically links its own LLVM fork rather than a system LLVM, TinyGo's riscv64 code quality is bounded by this fork's LLVM RISC-V backend correctness, independent of what distro-packaged LLVM offers.

**Deep-dive - wazero:** The lack of a riscv64 JIT/native-codegen backend (interpreter-only fallback) is a genuine, previously-undocumented gap. It affects TinyGo's WASI/Component-model tooling path specifically (where TinyGo uses wazero as an embedded WASM runtime), not TinyGo's own riscv64 codegen target.

**Note on methodology gap:** The `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) for the entirety of this research effort, blocking direct SPARQL verification against the Ubuntu 26.04 package graph for `libgc-dev`/`libgc1`, `musl`/`musl-dev`, `picolibc`, and `binaryen` on riscv64. This should be re-run once the server reconnects; the one figure obtained (LLVM) came from a previously-cached report, not a live graph query this session.

Note: TinyGo has no significant dependent package ecosystem (npm/PyPI/Maven/Kubernetes-operator style) requiring separate riscv64 enablement - it is a standalone compiler toolchain. Section 10 (Ecosystem Status) is omitted per the report's own scoping rule.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4924](https://github.com/tinygo-org/tinygo/issues/4924) | riscv-qemu: `ld.lld` error, couldn't allocate output register for constraint `{r0}` | open (filed 2025-06-12) | High - hard build blocker | Reproduced with go-ethereum `core`/`vm` packages on `dev` branch; no maintainer reply |
| [#4966](https://github.com/tinygo-org/tinygo/issues/4966) | `TestEmulatedRISCV` slowdown with LLVM 19+ | open (filed 2025-07-21) | High - CI health risk | Works under LLVM 18; times out under LLVM 19 (needs `-timeout 30m`); hangs indefinitely under LLVM 20. No root cause identified, no maintainer response |
| [#5173](https://github.com/tinygo-org/tinygo/issues/5173) | RISCV Hazard3 support? | open (filed 2026-01-12) | Feature request, not a bug | RP2350's Hazard3 RISC-V core explicitly out of scope per prior maintainer decision (referencing closed #4452); unanswered |
| [#4192](https://github.com/tinygo-org/tinygo/issues/4192) | Support for RV32IM | open (filed 2024-03-13), unanswered | Medium | `tinygo build -target=riscv32` fails with undefined references (`putchar`, `exit`, `ticks`); indicates incomplete bare-metal RV32IM runtime, adjacent to shared riscv code riscv64 also uses |
| [#2672](https://github.com/tinygo-org/tinygo/issues/2672) | Add FPU support | open since 2022-03-03, stalled | Medium | No general hardware-FPU integration; software float on cores without automatic HW float support, relevant to RISC-V boards lacking F/D extension |
| [PR #3545](https://github.com/tinygo-org/tinygo/pull/3545) | WIP: riscv64-qemu target | open, stalled since 2023-03-13 | High - blocks all riscv64 CI/test execution | Blocked on: wrong QEMU binary reference, missing LLVM feature flags (`+64bit`, `+d`, `+f`), no smoke test added. No maintainer follow-up after April 2023 review |
| [PR #5550](https://github.com/tinygo-org/tinygo/pull/5550) | compiler: support panic/recover in Wasm without exceptions (also targets riscv64 unwinding) | open, 16 comments, 11 commits | Medium | Explicitly names riscv64 as lacking native stack unwinding; blocked partly on a separate GC global-variable marking bug ([#5575](https://github.com/tinygo-org/tinygo/issues/5575)) surfaced during review |

**Correctness bugs highlighted separately:** #4924 (hard build failure, unresolved) and the task-switch 32-bit/64-bit register-width bug in `task_stack_tinygoriscv.S` (Section 4 - source-analysis finding by this research, not a filed issue; [NEEDS VERIFICATION] as an upstream-acknowledged bug since no issue tracks it).

## 12. Objections and Upstream Blockers

**Stated objections:** None found opposing riscv64 support in principle - the maintainers' review comments on [PR #3545](https://github.com/tinygo-org/tinygo/pull/3545) are constructive (missing tests, wrong QEMU binary, incomplete feature flags), not objections to the goal. No maintainer statement was found declining riscv64 support as a matter of policy.

**Technical blockers:**
- PR #3545's specific defects were never fixed: wrong `qemu-system-riscv32` reference for a 64-bit target, missing `+64bit`/`+d`/`+f` LLVM feature flags, no test coverage added.
- A linker relocation bug (`R_RISCV_HI20 out of range`) was hit by the PR author in the reflect package and never resolved.
- The task-switch register-width bug (Section 4) is unaddressed and unfiled.

**Organizational blockers:** PR #3545 has had zero commits or maintainer follow-up since April 2023 - this reads as an attention/prioritization gap rather than an active rejection. TinyGo's maintainer base is small (7-person informal board) and RISC-V is not the project's primary focus area (embedded ARM/Cortex-M and WASM dominate the boards list and commit history). No RISE funding or engagement has been directed at TinyGo (confirmed via exhaustive search of RISE's blog, GitHub org, and working-group issue trackers - zero hits beyond a single self-referential entry in this project's own research queue file).

**Acceptance probability:** Moderate-to-low without dedicated external investment. The one recent, successful riscv64 contribution (PR #5551, `recover()` support) shows the maintainers merge focused, small, well-scoped riscv64 fixes quickly (same-day merge). But the larger structural gap - no riscv64 CI, no riscv64 emulator target, no riscv64 release binary - has sat unaddressed since 2023 with no signs of being prioritized absent a motivated external contributor picking it back up.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** none
- Optimization level: not applicable - TinyGo is a general-purpose compiler/language toolchain (Section 1), not an optimization-purpose project under the color-coding skill's Step 2 test. It would still deliver its core value (a Go compiler targeting embedded/WASM) on RISC-V using only generic scalar codegen; there is no SIMD/vectorization or allocator-speed differentiator that would trigger the Step 2 modifier.

**Justification (from the project-color-coding skill):** Upstream CI (`.github/workflows/linux.yml`) builds exactly one riscv64 target (K210/maixbit, `-march=rv64gc`) as a compile-only cross-compile smoke test on an x86_64 runner - no execution, no boot, verified only by `md5sum`. The only QEMU-executed, actually-tested RISC-V target in CI, `riscv-qemu`, inherits `riscv32`, and `qemu-system-riscv64` is never installed anywhere in the repository. No upstream riscv64 release binary exists in any of the four most recent GitHub releases checked (v0.42.0, v0.41.1, v0.41.0, v0.40.0). Per the skill's Step 1 table (CI builds but does not test = yellow), and confirmed by the dedicated riscv64-qemu bring-up PR [#3545](https://github.com/tinygo-org/tinygo/pull/3545) remaining open and stalled since March 2023.

**Pending work that could change the grade:**
- [PR #3545](https://github.com/tinygo-org/tinygo/pull/3545) (riscv64-qemu target) - if resurrected and merged, would add riscv64 to CI's execution path, likely moving the grade toward blue (tested, no upstream release) pending resolution of the linker relocation issue the author hit.
- [PR #5550](https://github.com/tinygo-org/tinygo/pull/5550) (panic/unwinding for riscv64/Wasm) - open, would close the native-unwinding gap if merged.
- No RISE involvement exists to accelerate either of these (Section 12) - any progress depends on volunteer/community maintainer bandwidth.
- The task-switch register-width bug (Section 4) is unfiled and would need to be raised before riscv64 goroutine scheduling could be safely enabled - this is a prerequisite for any grade improvement that involves enabling `scheduler=tasks` on riscv64 targets.

## 14. Investment Analysis

RISE has not funded or engaged with TinyGo in any capacity (Section 12) - no RISE blog post, working-group repo, runner allocation, or funded contributor was found. All investment items below represent genuinely unaddressed work; none of it duplicates existing RISE effort.

### 14.1 Functional Enablement

- Resurrect and complete [PR #3545](https://github.com/tinygo-org/tinygo/pull/3545): fix the QEMU binary reference, add the missing `+64bit`/`+d`/`+f` LLVM feature flags, resolve the `R_RISCV_HI20 out of range` reflect-package relocation bug, add smoke test coverage per maintainer's 2023 review.
- Fix the `task_stack_tinygoriscv.S` 32-bit/64-bit register-width bug (Section 4) - add `__riscv_xlen` gating consistent with `asm_riscv.S` and `handleinterrupt.S`, following the same pattern PR #5551 used to fix panic/recover.
- Investigate and fix [#4924](https://github.com/tinygo-org/tinygo/issues/4924) (`ld.lld` register allocation failure for inline asm on riscv-qemu).

### 14.2 Performance Optimization

Not applicable as a distinct workstream - TinyGo has no SIMD/vector dispatch layer for any architecture, so there is no riscv64-specific "catch up to arm64/amd64 SIMD coverage" gap to close (Section 4, Section 6). No RISC-V performance benchmarking exists for TinyGo on any platform; establishing a baseline (compile+run a representative embedded workload on real riscv64 hardware, e.g. K210) would be a prerequisite before any optimization work could be scoped or justified.

### 14.3 CI/CD Infrastructure

- Add `qemu-system-riscv64` to CI dependencies and wire up an actual riscv64 QEMU-executed test target (this is the core of what #14.1's PR #3545 completion requires).
- Extend `smoketest-riscv`'s build-only coverage to include test execution once a riscv64 QEMU target exists.
- No RISE-provided riscv64 CI runners are currently used by TinyGo - engaging RISE's board farm or CI runner program (referenced generically in RISE's working groups, not specifically offered to TinyGo per this research) could substitute for or supplement QEMU-based testing with real K210 hardware-in-the-loop, though this was not something this research found evidence RISE has offered.

### 14.4 Ecosystem Enablement

Not applicable - TinyGo has no dependent package ecosystem requiring separate riscv64 enablement (it is a standalone compiler toolchain).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete PR #3545 (riscv64-qemu target): fix QEMU binary ref, LLVM feature flags, reflect-package relocation bug, add smoke tests | 2-4 | TinyGo maintainer or funded contributor with LLVM/riscv64 codegen experience | Critical |
| Functional | Fix `task_stack_tinygoriscv.S` 32/64-bit register-width bug in goroutine task switch | 0.5-1 | TinyGo maintainer or funded contributor | High |
| Functional | Resolve #4924 (`ld.lld` inline-asm register allocation failure) | 1-2 | TinyGo maintainer or funded contributor with LLVM lld experience | Medium |
| Functional | Investigate/complete #4966 (LLVM 19+ QEMU test slowdown/hang) - blocks safe LLVM version bumps for the whole riscv test suite | 1-2 | TinyGo maintainer | Medium |
| CI/CD | Add `qemu-system-riscv64` and wire riscv64 into `assert-test-linux` once PR #3545 lands | 0.5 | TinyGo maintainer (bundled with #14.1 PR #3545 item) | Critical |
| Distribution | Evaluate publishing riscv64 host binaries alongside existing linux-arm64 releases (TinyGo already builds for other architectures via `make release`) | 1-2 | TinyGo maintainer / release infra owner | Medium |
| Ecosystem | wazero riscv64 JIT backend (wazevo) - affects TinyGo's WASI/Component tooling, owned upstream by tetratelabs/wazero, not TinyGo itself | not sized (external project) | wazero maintainers | Low (indirect dependency, interpreter fallback works) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [tinygo-org/tinygo repository](https://github.com/tinygo-org/tinygo)
- [TinyGo homepage](https://tinygo.org/)
- [PR #3545 - WIP: riscv64-qemu target](https://github.com/tinygo-org/tinygo/pull/3545)
- [PR #5551 - compiler, runtime: support recover on riscv64](https://github.com/tinygo-org/tinygo/pull/5551)
- [PR #5550 - compiler: support panic/recover in Wasm without exceptions](https://github.com/tinygo-org/tinygo/pull/5550)
- [PR #762 - riscv: use LLVM tools instead of GNU toolchain](https://github.com/tinygo-org/tinygo/pull/762)
- [PR #763 - Add support for debugging RISC-V using QEMU](https://github.com/tinygo-org/tinygo/pull/763)
- [PR #1149 - riscv: add new kendryte k210 chip](https://github.com/tinygo-org/tinygo/pull/1149)
- [PR #2331 - Add support for the recover() builtin function](https://github.com/tinygo-org/tinygo/pull/2331)
- [PR #3124 - targets: remove hifive1-qemu target](https://github.com/tinygo-org/tinygo/pull/3124)
- [Issue #4924 - riscv-qemu: ld.lld register allocation error](https://github.com/tinygo-org/tinygo/issues/4924)
- [Issue #4966 - TestEmulatedRISCV slowdown with LLVM 19+](https://github.com/tinygo-org/tinygo/issues/4966)
- [Issue #5173 - RISCV Hazard3 support?](https://github.com/tinygo-org/tinygo/issues/5173)
- [Issue #4192 - Support for RV32IM](https://github.com/tinygo-org/tinygo/issues/4192)
- [Issue #2672 - add FPU support](https://github.com/tinygo-org/tinygo/issues/2672)
- [Issue #5178 - feature: need a way to determine targets that cannot be built without a board](https://github.com/tinygo-org/tinygo/issues/5178)
- [Issue #5575 - GC global-variable marking bug (blocks PR #5550)](https://github.com/tinygo-org/tinygo/issues/5575)
- [commit ffa38b1 - first RISC-V commit (HiFive1 rev B)](https://github.com/tinygo-org/tinygo/commit/ffa38b183b32331dd247e337a985c4eb5a7d9350)
- [commit d441f01 - switch RISC-V toolchain to LLVM](https://github.com/tinygo-org/tinygo/commit/d441f0152fb5943c960544cd39675bb7792b641e)
- [commit 43a66b3 - refactor assembly for RV64 + F extension](https://github.com/tinygo-org/tinygo/commit/43a66b39ccf0f0206913cd4efce71f66bd103781)
- [.github/workflows/linux.yml (CI configuration)](https://github.com/tinygo-org/tinygo/blob/dev/.github/workflows/linux.yml)
- [TinyGo GOVERNANCE.md](https://github.com/tinygo-org/tinygo/blob/dev/GOVERNANCE.md)
- [TinyGo OpenCollective](https://opencollective.com/tinygo)
- [TinyGo contributing guide](https://tinygo.org/docs/guides/contributing/)
- [TinyGo 0.42 release blog - "Recover Is Real"](https://tinygo.org/blog/2026/tinygo-0.42-recover-is-real/)
- [RISE - Advancing Go on RISC-V: Progress Through the RISE Project](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) (covers mainline Go, not TinyGo)
- [RISE members page](https://riseproject.dev/members/) (no TinyGo/Go entity listed)
- [picolibc issue #819 - -fcf-protection=full build failure on some RISC-V toolchains](https://github.com/picolibc/picolibc/issues/819)
- [tetratelabs/wazero - wazevo backend/isa directory (amd64/arm64 only, no riscv64)](https://github.com/tetratelabs/wazero/tree/main/internal/engine/wazevo/backend/isa)
- [tinygo-org/tinybench](https://github.com/tinygo-org/tinybench) (x86-64-only cross-language benchmark, no RISC-V data)
- Existing internal report: `project-reports/llvm.md` (dated 2026-06-17), used for the LLVM dependency deep-dive in Section 9

---

Report file written to: `/home/user/sw-ecosystem/project-reports/tinygo.md`
