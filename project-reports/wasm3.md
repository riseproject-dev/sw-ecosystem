---
title: wasm3
parent: Project Reports
color: green
dependencies:
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: optional
  - name: GNU make
    relation: build-dependency
    criticality: optional
  - name: PlatformIO
    relation: build-dependency
    criticality: optional
---

# wasm3

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for wasm3<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="wasm3" %}

## 1. Project Overview

wasm3 is a WebAssembly interpreter written in C99. It is a tail-call-threaded interpreter with no JIT backend and no SIMD fast paths for any architecture - the interpreter core is architecture-generic by design, which is the main reason RISC-V support required almost no interpreter-level work.

Governance is informal: there is no `MAINTAINERS`, `OWNERS`, `GOVERNANCE.md`, or `CODEOWNERS` file in the repository. The `LICENSE` file (MIT, copyright Steven Massey and Volodymyr Shymanskyy) names the two de facto maintainers. The GitHub org is "Wasm3 Labs" (`github.com/wasm3`), with 14 repos and no published sponsorship program. Lead/sole active maintainer Volodymyr Shymanskyy is a co-founder of Blynk Technologies (an IoT platform company, based in Kyiv, Ukraine); co-creator Steven Massey (Epigram Labs, Portland OR) is largely inactive on recent commits. Since September 2022 the README has carried a note that Shymanskyy's home was destroyed in the Russian invasion of Ukraine, and the project entered a "minimal maintenance phase": no new feature development, but active PR review and merging continues.

Community culture toward new ports is welcoming. `AGENTS.md` documents a CI/build-warning bar new ports are expected to clear (`extra/check.py`, 70+ CI configs, a `-Werror` sweep) but sets no port-specific gatekeeping beyond code quality, and the README frames community contributions as "now more valuable than ever." The project has historically merged externally-contributed platform and architecture support readily (contributors cited in research include Espressif/Ivan Grokhotkov, Colin Ihrig, and MaxGraey).

Source: [wasm3/wasm3 repository](https://github.com/wasm3/wasm3), [LICENSE](https://github.com/wasm3/wasm3/blob/main/LICENSE), [AGENTS.md](https://github.com/wasm3/wasm3/blob/main/AGENTS.md).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-10-25 | Commit `a59f740` "Add HiFive1 platform" (SiFive FE310, RV32IMAC) - first RISC-V-related commit | [a59f740](https://github.com/wasm3/wasm3/commit/a59f740552e34383eadfee12e1127599d3e28911) |
| 2019-10-26 | Commit `ffb8a3d` "Add Fomu platform" (Lattice iCE40UP5K, VexRiscv soft core, RV32I) | [ffb8a3d](https://github.com/wasm3/wasm3/commit/ffb8a3d8755ec4d86b7967bf82b677961faf1147) |
| 2019-10-26 | Commit `c5e6420` "Add source for Fomu" | [c5e6420](https://github.com/wasm3/wasm3/commit/c5e64200b25aa2036f002df8884082ba5226d523) |
| 2020-01-08 | Commit `c6bf46f` "Detect RISC-V ISA extensions" - adds `__riscv_xlen`/`muldiv`/`atomic`/`flen`/`compressed` macro detection | cited in research (commit hash as given) |
| 2020-01-31 | PR #80 "Two minor documentation fixes" merged (author mithro) - Fomu flash-size doc fix and a typo; the only RISC-V-touching PR in the project's history. First release containing it: v0.4.7 (2020-04-27), confirmed by ancestry check (`7508650` is an ancestor of tag v0.4.7 but not v0.4.6) | [PR #80](https://github.com/wasm3/wasm3/pull/80) |
| 2020-06-12 | Issue #150 "Native linear memory access on Riscv64" opened by robinvanemden | [Issue #150](https://github.com/wasm3/wasm3/issues/150) |
| 2021-03-20 | Issue #150 closed as completed | [Issue #150](https://github.com/wasm3/wasm3/issues/150) |
| 2021-05-27 | Commit `ebe2098` "Fix FOMU build" | [ebe2098](https://github.com/wasm3/wasm3/commit/ebe20986d7479e5506c28cb2c924d47d39d6a459) |
| 2021-12-22 | Commit `767f3cc` "Add cross-arch build script" - introduces `build-cross.py`'s `linux-rv32`/`linux-rv64` musl+QEMU cross targets | [767f3cc](https://github.com/wasm3/wasm3/commit/767f3cc17113db1723658b2fa4cf7615c46c52ee) |
| 2026-08-27 | Commit `fb1fb68` "Refactor CI cross-builds" - replaces the old dedicated `cross-qemu` riscv64 job with a generic matrix-driven `cross` job fed by `build-cross.py --list --nowasi`; riscv64 CI coverage preserved but no longer literally named "riscv" in CI YAML (explains why keyword search on recent history finds nothing) | [fb1fb68](https://github.com/wasm3/wasm3/commit/fb1fb686fa086f0e6176bd214d4434a4913e6dee) |

Key contributors: Volodymyr Shymanskyy (Blynk Technologies) authored essentially every RISC-V-related commit, all landed as direct pushes to `main` (no PR review) except PR #80, a documentation fix by external contributor mithro. Is it fully upstream? Yes - all RISC-V support (Fomu and HiFive1 ports, ISA-extension detection, `build-cross.py` targets, CI jobs) lives in `wasm3/wasm3`'s mainline `main` branch, not a fork or a downstream patch set.

## 3. Upstream Support Tier

No formal tier policy document exists (`PLATFORMS.md`/`SUPPORT.md` are absent). The closest equivalent is [`docs/Hardware.md`](https://github.com/wasm3/wasm3/blob/main/docs/Hardware.md), which informally splits devices into "Recommended devices" (beginner-friendly, full support), a "Compatibility table" (fully supported, with clock/flash/RAM specs), and "Limited support" - the SiFive HiFive1 (RV32IMAC) falls in this last category because it cannot allocate a full 64KB linear-memory page. The Sipeed MAIX (Kendryte K210, RV64IMAFDC) appears in the full-support compatibility table.

Evidence for CI/release tier: the `cross` job in `.github/workflows/build.yml` builds the `linux-rv64` target and runs it under `qemu-riscv64-static` (regression suite, full WebAssembly spec suite, WASI app suite) on every push and every pull request. The `release` job bundles `linux-rv64`'s output into `wasm3-linux-other.tar.gz`, uploaded to every tagged GitHub Release. This was independently confirmed by downloading `wasm3-linux-other.tar.gz` from release v0.9.1 (published 2026-09-10) and extracting `wasm3-linux-rv64` (364,712 bytes), verified with `file` as `ELF 64-bit LSB executable, UCB RISC-V, RVC, double-float ABI, version 1 (SYSV), statically linked, stripped`.

| Architecture | Upstream CI: build | Upstream CI: test | Upstream release artifact |
|---|---|---|---|
| amd64 | yes (native build, plus part of the `cross` matrix) | yes | yes - `wasm3-linux-x64.elf`, a distinctly named top-level release asset |
| arm64 | Data not available: research did not enumerate the arm64-specific entry among the `build-cross.py --list --nowasi` matrix's 25 targets (only the `linux-rv32`/`linux-rv64` entries were extracted). [NEEDS VERIFICATION] | Data not available: same limitation | Data not available: same limitation |
| riscv64 | yes - `linux-rv64` target, cross-compiled with a `riscv64-unknown-linux-musl` clang toolchain | yes - regression, WebAssembly spec, and WASI test suites, all run under `qemu-riscv64-static` emulation | yes - `wasm3-linux-rv64`, bundled inside `wasm3-linux-other.tar.gz` (not a distinctly-named top-level asset) |

Source: [.github/workflows/build.yml](https://github.com/wasm3/wasm3/blob/main/.github/workflows/build.yml), [build-cross.py](https://github.com/wasm3/wasm3/blob/main/build-cross.py), [v0.9.1 release page](https://github.com/wasm3/wasm3/releases/tag/v0.9.1).

## 4. Technical Architecture and RISC-V-Specific Subsystems

wasm3 has no JIT backend for any architecture (it is a portable tail-call-threaded interpreter) and no SIMD fast paths for any architecture. This context matters for grading: RISC-V is not missing a JIT/SIMD path that other architectures have - none exist project-wide.

RISC-V-specific components that do exist:

- **ISA detection** (`source/wasm3_defs.h:137-172`): the most granular per-architecture detection in the file. Distinguishes `rv32e`/`rv32i`/`rv64i`/`rv128i` via `__riscv_xlen`, then layers `__riscv_muldiv`/`__riscv_atomic`/`__riscv_flen`/`__riscv_compressed` to build a precise `M3_ARCH` string (e.g. `rv64imafdc`). x86_64/aarch64 get one-line detection by comparison.
- **Correctness fix** (`source/m3_config_platforms.h:301-304`): riscv64 explicitly sets `d_m3Use32BitSlots=0` (native 64-bit interpreter value slots), a deliberate fix traced directly to the resolution of issue #150.
- **Tail-call dispatch** (`source/m3_config_platforms.h:82-95`): `M3_HAS_TAIL_CALL=1` for riscv64 (only m68k/microblaze/powerpc/sh are excluded project-wide), giving riscv64 the same guaranteed `musttail`-based interpreter dispatch as x86_64/aarch64 when built with clang.

Documented gaps versus x86_64/aarch64 (both non-correctness, performance-tier gaps):

- No `d_m3GuardedMemory` (mmap guard-page, trap-based bounds checking) for riscv64 - it falls back to explicit branch-checked bounds (`m3MemCheck`), the same tier as MIPS, PowerPC, s390x, and LoongArch.
- The `preserve_none`/`vectorcall` register-pinning calling convention is explicitly commented out for riscv64 (`source/m3_config_platforms.h:178-179`, `//# elif defined(__riscv) && (__riscv_xlen == 64)`) while enabled for x86_64/aarch64 - a visible, intentionally-deferred micro-optimization, not a stub.
- No `d_m3PreloadNextOp` opcode-prefetch (an aarch64-only feature, not present on any other architecture either).
- No RVV/vector-extension usage anywhere in the codebase - consistent with the project having zero SIMD fast paths for any architecture, so this is not a RISC-V-specific deficit.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT backend | none (interpreter-only, project-wide) | none | none |
| SIMD fast paths | none (project-wide) | none | none |
| Tail-call dispatch (`musttail`) | yes | yes | yes |
| Guard-page (mmap trap) memory bounds check | Data not available: not explicitly confirmed present for amd64/arm64 in available research, inferred from framing "same tier as MIPS/PPC/s390x/LoongArch" implying x86_64/aarch64 have it | same as amd64 [NEEDS VERIFICATION] | absent - falls back to branch-checked bounds (`m3MemCheck`) |
| `preserve_none`/vectorcall register-pinning | enabled | enabled | explicitly disabled/commented out in source |
| ISA-extension detection granularity | coarse (one-line) | coarse (one-line) | fine-grained (`rv32e/rv32i/rv64i/rv128i` x `muldiv/atomic/flen/compressed`) |

Source: [source/wasm3_defs.h](https://github.com/wasm3/wasm3/blob/main/source/wasm3_defs.h), [source/m3_config_platforms.h](https://github.com/wasm3/wasm3/blob/main/source/m3_config_platforms.h).

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, dedicated `cmake/riscv64*.cmake` toolchain file, or `Dockerfile` exists in the repository (confirmed by repo-wide search, including a `filename:Dockerfile` code search returning 0 results). RISC-V64 build documentation is spread across `CMakeLists.txt`, `build-cross.py`, `.github/workflows/build.yml`, `extra/utils.mk`, `docs/Installation.md`, and `docs/Hardware.md`.

**Primary CI/release path** (`build-cross.py`, target `linux-rv64`, line 41):
```python
{ "name": "linux-rv64", "arch": "riscv64-unknown-linux-musl", "runner": "qemu-riscv64-static" }
```
No `"gcc": True` flag - this path uses Clang, not GCC. Toolchain source (pinned to a dated release tag, not a semantic version): [cross-tools/clang-cross riscv64-unknown-linux-musl (tag 20260823)](https://github.com/cross-tools/clang-cross/releases/download/20260823/riscv64-unknown-linux-musl.tar.xz).

Build commands (`build_musl()` in `build-cross.py`):
```sh
export CC="../../.toolchains/riscv64-unknown-linux-musl/bin/riscv64-unknown-linux-musl-clang"
export CFLAGS="-Dd_m3HasTypedRefs=1"
export LDFLAGS="-static -s"
cmake -GNinja -DBUILD_NATIVE=OFF ../..
cmake --build .
```
Test execution under QEMU:
```sh
qemu-riscv64-static ../build-cross/wasm3-linux-rv64
```
driven via `run-regression-test.py`, `run-spec-test.py`, and `run-wasi-test.py --fast`, each invoked with `--exec "qemu-riscv64-static ../build-cross/wasm3-linux-rv64"`. The GitHub Actions `cross` job installs the emulator with `sudo apt install -y qemu-user-static` on an `ubuntu-latest` (x86_64) runner - no native riscv64 hardware or GitHub-hosted riscv64 runner is used anywhere.

**Alternate/manual build path** (`extra/utils.mk`, target `test_rv64`, GCC-based, non-CMake):
```sh
riscv64-linux-gnu-gcc -DDEBUG -Dd_m3HasWASI \
    -I./source ./source/*.c ./platforms/app/main.c \
    -O3 -g0 -flto -lm -static \
    -o wasm3-rv64
python3 run-wasi-test.py --fast --exec "qemu-riscv64-static ../wasm3-rv64"
```
Invoked via `make -f extra/utils.mk test_rv64`.

**Toolchain version requirements**: no riscv64-specific minimum GCC/Clang version is stated anywhere in the repo. General constraints: `CMAKE_C_STANDARD 99`, `cmake_minimum_required(VERSION 3.11)`. The CI-pinned cross toolchains are identified only by the `cross-tools/clang-cross` release date tag (`20260823`), not a compiler semantic version. Because the `preserve_none` tail-call attribute path is disabled for RISC-V (Section 4), there is no minimum-compiler-version gate tied to that feature on this architecture. Per `docs/Hardware.md`'s legend, RISC-V targets (Sipeed MAIX, Fomu) are not flagged with the "fails to perform TCO" warning that Xtensa/Cortex-M0/ARC/AVR carry - RISC-V tail-call optimization works out of the box.

**Known build failures**: none found in available research - no open riscv64 build-failure issues were located.

**Embedded (RV32) boards, included for completeness** since the CI job is named `platformio-riscv`: `platforms/embedded/hifive1/` (SiFive HiFive1, PlatformIO, `pio run`) and `platforms/embedded/fomu/` (Lattice iCE40, Makefile-based, toolchain prefix `riscv64-unknown-elf-` except on Raspberry Pi hosts, which use `riscv32-unknown-elf-`). Sipeed MAIX (RV64IMAFDC, actual RV64 hardware) is built via `pio run -e maix` in the same `platformio-riscv` job. This job is build-only - no test execution, no QEMU.

Source: [CMakeLists.txt](https://github.com/wasm3/wasm3/blob/main/CMakeLists.txt), [build-cross.py](https://github.com/wasm3/wasm3/blob/main/build-cross.py), [extra/utils.mk](https://github.com/wasm3/wasm3/blob/main/extra/utils.mk), [docs/Installation.md](https://github.com/wasm3/wasm3/blob/main/docs/Installation.md), [docs/Hardware.md](https://github.com/wasm3/wasm3/blob/main/docs/Hardware.md).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Interpreter core execution | full | full | full (architecture-generic C, no gap) |
| Tail-call dispatch | yes | yes | yes |
| Guard-page memory bounds check | present [NEEDS VERIFICATION - inferred] | present [NEEDS VERIFICATION - inferred] | absent, branch-checked fallback (same tier as MIPS/PPC/s390x/LoongArch) |
| Register-pinning calling convention (`preserve_none`) | yes | yes | disabled in source |
| Linear-memory native-pointer conversion (`m3_GetMemory()`) | working | working | working - fixed via issue #150 (closed 2021-03-20) |
| 64KB linear-memory page allocation on constrained hardware | N/A (desktop) | N/A (desktop) | limited on HiFive1 specifically (documented in `docs/Hardware.md`'s "Limited support" table) - a hardware RAM constraint, not an architecture-wide riscv64 gap |

**Functional gaps**: none confirmed open. The sole documented functional defect (issue #150, WASM-malloc pointer to native-pointer conversion on riscv64) is closed as completed.

**Performance gaps**: the two documented non-correctness micro-optimizations from Section 4 (guard-page memory, register-pinning calling convention) are missing on riscv64 relative to x86_64/aarch64. Data not available: no isolated microbenchmark was found in research that quantifies the specific performance delta attributable to these two missing features on riscv64 - the closest available numbers (Section 6 of the underlying research: fib(24)/fib(40)/bubble-sort benchmarks) measure end-to-end interpreter performance and cannot be decomposed to isolate these two gaps.

**Security hardening gaps**: Data not available: research did not find a riscv64-specific security-hardening analysis. The absence of guard-page memory affects OOB-detection mechanism (trap-based vs. explicit branch-checked), not correctness - `m3MemCheck` branch-checked bounds still enforces memory-safety correctness on riscv64, it does so via a different mechanism than the guard-page architectures use.

**NaN / floating-point semantics**: research explicitly searched wasm3/wasm3 issues for NaN/float-canonicalization problems tied to RISC-V - zero results. No open or closed issue ties NaN/float handling to RISC-V in this project.

## 7. CI/CD Infrastructure

Confirmed by direct clone and file inspection (commit `fbbb7d49d444c8be7b7bfb4ad8513103fabf8715`, branch `main`): the repository has exactly two workflow files, `.github/workflows/build.yml` (39,249 bytes) and `.github/workflows/cifuzz.yml` (1,007 bytes) - no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

Two distinct riscv-related jobs exist in `build.yml`:

1. **`platformio-riscv`** (lines ~817-838): `ubuntu-latest`, build-only. Cross-compiles HiFive1 (RV32IMAC, `pio run`) and Sipeed MAIX (RV64GC, `pio run -e maix`) embedded firmware via PlatformIO. No test execution, no QEMU.
2. **`cross` job** (lines ~354-409), matrix-fed at runtime from `python3 build-cross.py --list --nowasi`: includes `linux-rv32` (`riscv32-unknown-linux-musl`, `qemu-riscv32-static`) and `linux-rv64` (`riscv64-unknown-linux-musl`, `qemu-riscv64-static`). Runs on `ubuntu-latest` (x86_64), installs `qemu-user-static`, cross-compiles via `build-cross.py --target linux-rv64 --build`, then executes the resulting binary under `qemu-riscv64-static` against three test suites: `run-regression-test.py`, `run-spec-test.py` (WebAssembly spec suite), and `run-wasi-test.py --fast`. Neither target carries a `nodist` flag, so both are release artifacts.

Trigger conditions apply to the whole workflow: `push` on any branch, `push` on `v*.*.*` tags, `pull_request`, and manual `workflow_dispatch`. No native riscv64 hardware runner or GitHub-hosted riscv64 runner is used anywhere - execution is QEMU user-mode emulation on x86_64 hosts throughout. No reference to `riseproject-dev` or RISE runner labels was found anywhere in the CI configuration.

| Architecture | Build | Test | Release | Runner | Hardware |
|---|---|---|---|---|---|
| amd64 | yes | yes | yes (`wasm3-linux-x64.elf`) | `ubuntu-latest` | native x86_64 |
| arm64 | Data not available: not enumerated in this research pass among the 25-entry cross matrix [NEEDS VERIFICATION] | Data not available: same limitation | Data not available: same limitation | Data not available | Data not available |
| riscv64 | yes (`linux-rv64`, Clang musl cross toolchain) | yes (regression + spec + WASI suites) | yes (bundled in `wasm3-linux-other.tar.gz`) | `ubuntu-latest` | QEMU user-mode emulation (`qemu-riscv64-static`), no native hardware |

**Verification gap, disclosed honestly**: this research could not independently confirm the pass/fail history of recent `cross-linux-rv64` runs - `api.github.com` calls were blocked in this session (no push-level GitHub access attached), and the Actions run-detail UI is JS-rendered so it could not be scraped. What is confirmed directly from file content is that the job is configured and wired to run on every push and PR; recent run-history verification remains an open item.

Source: [.github/workflows/build.yml](https://github.com/wasm3/wasm3/blob/main/.github/workflows/build.yml).

## 8. Distribution and Release Status

**GitHub Releases**: latest is v0.9.1 (published 2026-09-10). Top-level assets: `wasm3-android-coremark.apk`, `wasm3-cosmopolitan.com` (+`.dbg`), `wasm3-linux-other.tar.gz`, `wasm3-linux-x64.elf`, `wasm3-strace-linux-x64.elf`, `wasm3-strace-win-x64.exe`, `wasm3-strace.wasm`, `wasm3-wasi-zig.wasm`, `wasm3-wasi.wasm`, plus source archives. No top-level asset filename literally contains "riscv64" or "riscv". However, direct download and extraction of `wasm3-linux-other.tar.gz` (5,011,005 bytes) confirmed it contains `wasm3-linux-rv64` (364,712 bytes) and `wasm3-linux-rv32`, alongside 18 other architectures. `file` confirms `wasm3-linux-rv64` is `ELF 64-bit LSB executable, UCB RISC-V, RVC, double-float ABI, version 1 (SYSV), statically linked, stripped`. Upstream does publish a genuine riscv64 binary - it is simply not exposed as a distinctly-named top-level release asset, which produces a false negative under naive filename-substring checks against release assets.

**PyPI**: `GET https://pypi.org/pypi/wasm3/json` returns HTTP 404. No PyPI project named `wasm3` exists at all, for any architecture. Not applicable to this project's riscv64 status.

**RISE Python wheel builder**: `GET https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasm3/` redirects to `pypi.org/simple/wasm3/`, which itself 404s. No wasm3 package on the RISE wheel builder.

**Ubuntu 26.04 (Resolute)**: `packages.ubuntu.com` returns zero genuine `wasm3` rows; the only string matches are `libc++-dev-wasm32`/`libclang-rt-dev-wasm32` (LLVM WASM32-target toolchain packages, a false positive on the `wasm3` substring inside `wasm32`). `libwasm3` and `python3-wasm3` searches return no results. wasm3 is not packaged in Ubuntu 26.04 under any plausible name.

**Arch Linux RISC-V (archriscv)**: checked the live mirror's flat package indices (`core`, `extra`, `community`, `unsupported`, `multilib`, all riscv64-only repos). No `wasm3` package anywhere. Notably, `extra/` does carry `wasm-bindgen`, `wasm-pack`, `wasm-tools`, `wasmer`, and `wasmtime` built for riscv64 - proof the porters actively package other WASM runtimes for riscv64, but not wasm3 specifically.

**Project-graph / Ubuntu SPARQL cross-check**: unavailable this session - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout research. This is a tooling failure, not a negative result, and needs to be retried.

**What a user must do today to get a working riscv64 binary**: (1) download `wasm3-linux-other.tar.gz` from the [GitHub Releases page](https://github.com/wasm3/wasm3/releases) and extract `wasm3-linux-rv64` - not discoverable by filename alone, requires knowing to look inside the "other" archive; or (2) build from source via `build-cross.py --target linux-rv64 --build` using the pinned `cross-tools/clang-cross` toolchain; or (3) use `extra/utils.mk`'s `test_rv64` recipe with a distro `riscv64-linux-gnu-gcc` cross toolchain. No distro package manager (apt, pacman) currently provides wasm3 on riscv64.

Source: [wasm3 v0.9.1 releases page](https://github.com/wasm3/wasm3/releases/tag/v0.9.1), [PyPI wasm3 project](https://pypi.org/pypi/wasm3/json), [Ubuntu package search](https://packages.ubuntu.com/search?keywords=wasm3&suite=resolute&searchon=names&section=all), [Arch Linux RISC-V port](https://archriscv.felixc.at/).

## 9. Dependencies

wasm3 has no `Cargo.toml`/`go.mod`/`package.json`/`setup.py`; its only manifest is `CMakeLists.txt`. Its runtime C dependency surface is narrow: `libuv` and `uvwasi`, pulled in via CMake `FetchContent` only for the default native/WASI build (`BUILD_WASI=uvwasi`). The remainder of the table below covers the build/test toolchain dependencies specified for this report.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **QEMU** | test-dependency, critical (`qemu-riscv64-static`/`qemu-riscv32-static` user-mode emulation, installed via `apt install qemu-user-static` in CI) | N/A - QEMU is a tool, not cross-compiled by wasm3 | Executes and tests every riscv64/riscv32 wasm3 binary under emulation on `ubuntu-latest` x86_64 runners; without it, wasm3's `cross` job cannot run its riscv64 test suites at all | Ships via the Ubuntu apt package `qemu-user-static` | No riscv64-specific blocking issues found against wasm3; QEMU's own upstream riscv64 CI/test posture was not separately researched in this pass. Data not available: QEMU's own riscv64-as-host or riscv64-as-target CI status |
| **LLVM** | build-dependency, critical (the pinned `cross-tools/clang-cross` riscv64-unknown-linux-musl Clang cross toolchain is wasm3's primary CI/release compiler for riscv64) | Yes - `riscv64-unknown-linux-musl-clang` is the actual compiler CI uses to build `linux-rv64` | N/A (compiler, not itself tested) | Toolchain distributed as a dated GitHub release tag (`20260823`) by `cross-tools/clang-cross`, not an official LLVM.org release | No riscv64-specific minimum LLVM/Clang version documented in wasm3's repo |
| **musl** | build-dependency, critical (`riscv64-unknown-linux-musl`/`riscv32-unknown-linux-musl` target triple; all cross-built riscv64/riscv32 wasm3 binaries are statically linked against musl, not glibc) | Yes | N/A | musl libc is statically linked into the shipped `wasm3-linux-rv64` binary, confirmed via `file` output ("statically linked") | - |
| **Python** | build-dependency, critical (`build-cross.py` is the CI build driver; `run-spec-test.py`/`run-wasi-test.py`/`run-regression-test.py` are the test runners; CI installs Python 3.x via `actions/setup-python`) | N/A - runs as host-side Python 3.x on the `ubuntu-latest` CI runner, not cross-compiled | Python orchestrates riscv64 test execution (invoking `qemu-riscv64-static`) but is not itself tested on riscv64 | N/A | - |
| **GCC** | build-dependency, optional (`extra/utils.mk`'s manual `test_rv64` target invokes `riscv64-linux-gnu-gcc` directly, bypassing CMake/Clang; also the fallback toolchain prefix `riscv64-unknown-elf-gcc` in `platforms/embedded/fomu/Makefile` on non-Raspberry-Pi hosts) | Yes - alternate/manual build path, not the primary CI-driven build | Manual path also runs `run-wasi-test.py --fast` under `qemu-riscv64-static` | N/A - not the release-producing path | Secondary to the primary Clang cross-toolchain path used by CI |
| **GNU make** | build-dependency, optional (`extra/utils.mk` drives the manual `test_rv64` recipe; `platforms/embedded/fomu/Makefile` drives the Fomu RV32I embedded build) | Yes, for these two optional paths | Yes, for `test_rv64` (invokes the WASI fast test suite under QEMU) | N/A | Primary CI/release path uses CMake+Ninja, not make; make is secondary/dev-convenience tooling |
| **PlatformIO** | build-dependency, optional (drives the `platformio-riscv` CI job: `pio run` for HiFive1 RV32IMAC, `pio run -e maix` for Sipeed MAIX RV64GC) | Yes - build-only, no test/QEMU execution for this job | No - `platformio-riscv` is explicitly build-only | N/A - embedded firmware images are not part of the `wasm3-linux-*` release archive | Separate from the `linux-rv64` cross/QEMU path; covers embedded RISC-V microcontroller targets only |
| **libuv** (indirect, `libuv/libuv`, pinned v1.52.1) | Async I/O backend uvwasi's WASI syscalls run on; fetched via CMake `FetchContent` for the default native/WASI build | Yes - libuv's own CI (`CI-unix.yml`, `build-cross-qemu` job) cross-compiles with `gcc-riscv64-linux-gnu` as an official target | Yes - same CI job runs libuv's full test suite under `qemu-riscv64` emulation, a first-class target | Source-only releases (no prebuilt per-arch binaries); riscv64 not treated differently at release time | No riscv64-specific open issues found in `libuv/libuv` |
| **uvwasi** (indirect, `nodejs/uvwasi`, tag `main`) | WASI syscall implementation wasm3 links in for filesystem/clock access in the default desktop build | Not independently riscv64-tested by its own CI (no riscv64 job in `CI.yml`/`Android.yml`/`Coverage.yml`/`cflite.yml`); cross-compiled for riscv64 only indirectly, as part of wasm3's own cross-build | Exercised on riscv64 only transitively, through wasm3's "Test WASI apps" CI step | No standalone release artifacts; consumed as source via `FetchContent` | No riscv64/RISC-V issues of any kind found on `nodejs/uvwasi` (0 results) |

Deep-dive: the "critical dependency chain with a JIT/SIMD/crypto/compression profile" that a comparable project might have does not exist for wasm3 - it has no JIT, no bundled SIMD/crypto/compression library, and no custom allocator dependency. The real critical chain for I/O is wasm3 -> uvwasi -> libuv, and both links in that chain are first-class, tested riscv64 CI targets in their own right.

Source: [libuv CI-unix.yml](https://github.com/libuv/libuv/blob/v1.x/.github/workflows/CI-unix.yml), [nodejs/uvwasi CI.yml](https://github.com/nodejs/uvwasi/blob/main/.github/workflows/CI.yml), [build-cross.py](https://github.com/wasm3/wasm3/blob/main/build-cross.py).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#150](https://github.com/wasm3/wasm3/issues/150) | Native linear memory access on Riscv64 | Closed (completed), 2020-06-12 to 2021-03-20 | Labeled HIGH PRIORITY while open | The only RISC-V-specific issue in the project's history. `m3_GetMemory()` pointer conversion on riscv64 did not work as it did on ESP32; resolved via the `d_m3Use32BitSlots=0` fix (Section 4). Resolution comment thread text was not retrievable in this session (GitHub's JS-rendered comment UI could not be scraped by WebFetch, and `api.github.com` returned 403 to unauthenticated access) |

Non-RISC-V correctness bugs, included for general context on project correctness posture (none affect the riscv64 grading):

| ID | Title | Status | Architecture |
|---|---|---|---|
| [#544](https://github.com/wasm3/wasm3/issues/544) [NEEDS VERIFICATION - URL constructed from issue number, not independently re-fetched] | SEGV on WRITE (Memory Corruption) in `op_CopySlot_64` | Closed as duplicate (2025-12-03 to 2026-01-12) | x86_64 |
| #378, #379, #380 | Fuzzing-found SEGVs in `op_Select_i32_srs`, `RunCode`, `op_CallIndirect` | Closed (Aug 2022) | x86_64 |
| #158 | OOB read in `Read_f64` during module parsing | Closed (2020) | x86_64 |
| #321 | Mis-parses i32 globals on s390x (big-endian) | Closed (2022) | s390x (endianness bug, not RISC-V) |

**NaN / floating-point canonicalization**: explicit search for RISC-V-tied NaN/float issues returned zero results - no open or closed issue in wasm3/wasm3 ties NaN/float handling to RISC-V.

## 12. Objections and Upstream Blockers

No stated objections to RISC-V support were found. No open RISC-V issues or PRs exist. No technical blockers were identified - the sole substantive RISC-V bug (issue #150) closed in 2021.

Organizational: the project has been in a "minimal maintenance phase" since September 2022, with a single de facto active maintainer (Volodymyr Shymanskyy) following personal hardship from the Russian invasion of Ukraine. The stated "no new feature development" posture could slow any future riscv64 work that requires new features, but existing riscv64 support is already implemented, CI-tested, and released, so this does not block current functionality.

Acceptance probability for new RISC-V-related contributions is assessed as high: the project has historically merged externally-contributed platform and architecture support readily, and the README explicitly frames community contributions as "now more valuable than ever" during the maintenance phase. Because all RISC-V-specific work to date landed via direct maintainer commits rather than PR review, there is no established reviewer or prerequisite-dependency chain to navigate for a future riscv64 contribution beyond the standard CI/`-Werror` bar documented in `AGENTS.md`.

## 13. Readiness Assessment

- **Color:** green (no color_case qualifier applies to green)
- **Release provider:** upstream
- **Optimization gap:** N/A - wasm3 is not an optimization-purpose project. It has no JIT and no SIMD fast paths for any architecture (project-wide, not a RISC-V-specific gap), so the value it provides (a portable WASM interpreter) does not depend on architecture-specific performance code, and the Step 2 optimization modifier of the color-coding model does not apply and does not cap the primary CI-derived color.
- **Justification:** the `cross` job in [.github/workflows/build.yml](https://github.com/wasm3/wasm3/blob/main/.github/workflows/build.yml), matrix-fed from [build-cross.py](https://github.com/wasm3/wasm3/blob/main/build-cross.py)'s `linux-rv64` target, builds and tests riscv64 under `qemu-riscv64-static` emulation (regression suite, full WebAssembly spec suite, WASI app suite) on every push and pull request. Upstream also publishes a genuine riscv64 binary, confirmed by directly downloading and `file`-inspecting `wasm3-linux-rv64` inside [release v0.9.1's `wasm3-linux-other.tar.gz`](https://github.com/wasm3/wasm3/releases/tag/v0.9.1) (`ELF 64-bit LSB executable, UCB RISC-V, RVC, double-float ABI, statically linked`). Build = yes, test = yes, release = yes, all from upstream, which is the definition of green under Step 1 of the color model.
- **Pending work that could change the grade:** none identified. Issue #150 (the only riscv64 defect ever reported) is closed; there are zero open riscv64 PRs; no RISE involvement was found in any channel (blog, wheel builder, `riseproject-dev` GitHub org) that would alter current distribution status. The one open procedural item is re-verifying the most recent `cross-linux-rv64` CI run history once GitHub API access is available (Section 7), and re-running the Ubuntu 26.04 riscv64 package-availability check once the `project-graph` MCP server reconnects (Section 8) - neither is expected to change the color, both are noted as evidence-freshness gaps.

## 14. Investment Analysis

RISE involvement check: confirmed none. No RISE blog post mentions wasm3, no `riseproject-dev` GitHub repository references wasm3, and wasm3 is absent from the RISE Python wheel builder. There is no RISE-funded or RISE-covered work to net out of the sizing below - the following is a from-scratch external assessment of the (narrow) remaining gaps.

### 14.1 Functional Enablement

riscv64 support (both rv32 and rv64) is already functionally complete and CI-tested; the sole historical functional bug (#150) is resolved. No functional backlog exists; future work here would be reactive bug-fixing only, as issues are reported.

### 14.2 Performance Optimization

Two documented, non-correctness gaps versus x86_64/aarch64 (Section 4): (1) absence of guard-page (mmap/trap-based) memory bounds checking on riscv64, which would require wiring riscv64 `mmap`/`mprotect`/signal-handler support into `d_m3GuardedMemory`; (2) the `preserve_none`/vectorcall register-pinning tail-call calling convention, currently commented out in source for riscv64, which is a smaller, more contained re-enablement-and-validation task for riscv64 clang builds. Data not available: no isolated microbenchmark was found quantifying the performance delta these two gaps cause on riscv64 specifically - end-to-end benchmarks in available research (fib/bubble-sort figures) cannot be decomposed to attribute cost to these two features individually.

### 14.3 CI/CD Infrastructure

Already strong: build, test, and release all happen via QEMU on every push and PR. The one gap is verification, not infrastructure - this research could not confirm recent green/red run history for `cross-linux-rv64` because `api.github.com` access was blocked in-session; a periodic spot-check of Actions run history is recommended over new infrastructure investment. Separately, no native riscv64 hardware runner is used anywhere (QEMU emulation only); if genuine riscv64 silicon coverage is desired, RISE's infrastructure partners (OSU OSL for a US board farm, Scaleway for an EU build farm, per RISE's public infrastructure-partner listing) are a plausible avenue, though none is currently wired into wasm3's CI.

### 14.4 Ecosystem Enablement

Section 10 is omitted - wasm3 has no dependent package ecosystem (no PyPI package exists for wasm3 at all, for any architecture; it is not an npm/Maven-style project). The relevant enablement gap is distribution, not ecosystem: wasm3 is absent from Ubuntu, absent from Arch Linux RISC-V, and absent from PyPI entirely. Packaging wasm3 for Arch Linux RISC-V (archriscv) would be comparatively low-effort, since that repository already builds sibling WASM runtimes (wasmer, wasmtime, wasm-tools) for riscv64, demonstrating the toolchain and packaging path already work there.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Reactive bug triage only (no known open riscv64 functional defects) | <1 | upstream (wasm3 maintainer) | Low |
| Performance | Implement guard-page (mmap-based) OOB bounds checking for riscv64 | 1-2 | upstream / contributor | Low |
| Performance | Re-enable and validate `preserve_none`/vectorcall tail-call convention for riscv64 clang builds | 1 | upstream / contributor | Low |
| CI/CD | Verify recent `cross-linux-rv64` CI run history (green/red); no infrastructure change needed | <1 | investigator with API access | Medium |
| CI/CD | Evaluate adding a native riscv64 hardware runner (e.g. via RISE board farm / OSU OSL) for the `cross` job's rv64 target | 1-2 | RISE / infra team | Low |
| Distribution | Package wasm3 for Arch Linux RISC-V (archriscv), modeled on existing wasmer/wasmtime/wasm-tools riscv64 packages | 1 | distro packager | Low |
| Distribution | Surface `wasm3-linux-rv64` as a distinctly-named top-level GitHub Release asset (currently nested inside `wasm3-linux-other.tar.gz`) | <1 | upstream (wasm3 maintainer) | Low |

## 15. Updates

No updates yet - initial report dated 2026-09-10.

## 16. References

- [wasm3/wasm3 repository](https://github.com/wasm3/wasm3)
- [wasm3 LICENSE](https://github.com/wasm3/wasm3/blob/main/LICENSE)
- [wasm3 AGENTS.md](https://github.com/wasm3/wasm3/blob/main/AGENTS.md)
- [wasm3 docs/Hardware.md](https://github.com/wasm3/wasm3/blob/main/docs/Hardware.md)
- [wasm3 docs/Installation.md](https://github.com/wasm3/wasm3/blob/main/docs/Installation.md)
- [wasm3 docs/Performance.md](https://github.com/wasm3/wasm3/blob/main/docs/Performance.md)
- [wasm3 CMakeLists.txt](https://github.com/wasm3/wasm3/blob/main/CMakeLists.txt)
- [wasm3 build-cross.py](https://github.com/wasm3/wasm3/blob/main/build-cross.py)
- [wasm3 extra/utils.mk](https://github.com/wasm3/wasm3/blob/main/extra/utils.mk)
- [wasm3 .github/workflows/build.yml](https://github.com/wasm3/wasm3/blob/main/.github/workflows/build.yml)
- [wasm3 source/wasm3_defs.h](https://github.com/wasm3/wasm3/blob/main/source/wasm3_defs.h)
- [wasm3 source/m3_config_platforms.h](https://github.com/wasm3/wasm3/blob/main/source/m3_config_platforms.h)
- [Issue #150 - Native linear memory access on Riscv64](https://github.com/wasm3/wasm3/issues/150)
- [PR #80 - Two minor documentation fixes](https://github.com/wasm3/wasm3/pull/80)
- [Commit a59f740 - Add HiFive1 platform](https://github.com/wasm3/wasm3/commit/a59f740552e34383eadfee12e1127599d3e28911)
- [Commit ffb8a3d - Add Fomu platform](https://github.com/wasm3/wasm3/commit/ffb8a3d8755ec4d86b7967bf82b677961faf1147)
- [Commit c5e6420 - Add source for Fomu](https://github.com/wasm3/wasm3/commit/c5e64200b25aa2036f002df8884082ba5226d523)
- [Commit ebe2098 - Fix FOMU build](https://github.com/wasm3/wasm3/commit/ebe20986d7479e5506c28cb2c924d47d39d6a459)
- [Commit 767f3cc - Add cross-arch build script](https://github.com/wasm3/wasm3/commit/767f3cc17113db1723658b2fa4cf7615c46c52ee)
- [Commit fb1fb68 - Refactor CI cross-builds](https://github.com/wasm3/wasm3/commit/fb1fb686fa086f0e6176bd214d4434a4913e6dee)
- [wasm3 v0.9.1 releases page](https://github.com/wasm3/wasm3/releases/tag/v0.9.1)
- [PyPI wasm3 project (404 - does not exist)](https://pypi.org/pypi/wasm3/json)
- [RISE Python wheel builder](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasm3/)
- [Ubuntu 26.04 (Resolute) package search for wasm3](https://packages.ubuntu.com/search?keywords=wasm3&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)
- [cross-tools/clang-cross riscv64-unknown-linux-musl toolchain (tag 20260823)](https://github.com/cross-tools/clang-cross/releases/download/20260823/riscv64-unknown-linux-musl.tar.xz)
- [libuv/libuv repository](https://github.com/libuv/libuv)
- [libuv CI-unix.yml](https://github.com/libuv/libuv/blob/v1.x/.github/workflows/CI-unix.yml)
- [nodejs/uvwasi repository](https://github.com/nodejs/uvwasi)
- [nodejs/uvwasi CI.yml](https://github.com/nodejs/uvwasi/blob/main/.github/workflows/CI.yml)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [arXiv 2512.00035 - WebAssembly on Resource-Constrained IoT Devices](https://arxiv.org/html/2512.00035v1)
- [GitHub Issue #117 - Rudimentary perf comparison: x86_64 v.s. arm64](https://github.com/wasm3/wasm3/issues/117)