---
title: Dart
parent: Project Reports
color: blue
dependencies:
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: ICU
    relation: runtime-dependency
    criticality: critical
  - name: double-conversion
    relation: runtime-dependency
    criticality: critical
  - name: cpu_features
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: Binaryen
    relation: build-dependency
    criticality: optional
  - name: LLVM
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="dart" %}

# Dart

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Dart<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Dart is a general-purpose, garbage-collected, statically-typed programming language and its accompanying VM (the "Dart SDK"), maintained by Google. The SDK ships a self-hosted JIT compiler, an AOT compiler, a garbage collector, an FFI subsystem, and its own core-library runtime. It is the language runtime beneath Flutter, though the Flutter engine itself is a separate project with its own riscv64 status ([flutter/flutter#117973](https://github.com/flutter/flutter/issues/117973)).

**Governance:** Dart has no independent foundation, no CNCF-style technical steering committee, and no `CODEOWNERS`/`MAINTAINERS` file at the GitHub repo root. Development happens on Google's own Gerrit instance (`dart-review.googlesource.com`) and is mirrored read-only to GitHub; `CONTRIBUTING.md` requires "at least two reviewers who are OWNERS on your CL" before a change lands, and merges go through Google's internal Commit Queue, not GitHub's merge button. dart.dev describes the project as "Supported by Google" and "free and open source" (3-Clause BSD license for code, CC BY 4.0 for site content).

**Corporate sponsors:** Virtually every active committer/reviewer observed on `dart-lang/sdk` (Johnni Winther, Konstantin Shcheglov, Brian Wilkerson, Sam Rawlins, Nate Bosch, Ben Konyi, Martin Kustermann, Ryan Macnak, Alexander Markov, Slava Egorov, and others) carries a `@google.com` address. A smaller stream of external contributors (Danny Tuppeny, Simon Binder, Parker Lougheed, and others) lands changes but requires Google OWNERS sign-off. Google LLC is listed as a **Premier Member** of the RISE Project, but Dart itself is not referenced anywhere on riseproject.dev, has no RISE-funded work, and appears only as an unresearched, queued entry in the sw-ecosystem project-reports queue.

**Community culture on new ports:** No formal, written tiering policy or RFC process for new architecture ports exists. In practice the RISC-V port was executed as ordinary Google-internal engineering work: a Google engineer opened a tracking bug ([#38587](https://github.com/dart-lang/sdk/issues/38587)), landed incremental changes through the standard two-OWNERS Gerrit gate, and CI trybots were added alongside existing arm/x64 bots. There is no evidence of an external community vote or DEP-style proposal gating the port.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-09-26 | Master tracking issue opened: "Adding support for RISC-V architecture" | [#38587](https://github.com/dart-lang/sdk/issues/38587) |
| 2021-12-01 | Earliest riscv-touching commit found (dependency roll: "Update double-conversion... Includes RISC-V support") | commit `fc585377`, Ryan Macnak (rmacnak@google.com) |
| 2022-01-12 | First Dart-VM-native RISC-V engineering commit, referencing #38587 | commit `d1135bbb`, Ryan Macnak |
| 2022-02-07 | Wave of initial post-bring-up failures opened (simulator crashes/runtime errors across corelib, language, vm test suites) | [#48333](https://github.com/dart-lang/sdk/issues/48333) |
| 2022-02-15 | Master tracking issue #38587 closed: "basic functionality was operational... some edge cases in FFI that still fail" | [#38587](https://github.com/dart-lang/sdk/issues/38587) (closing comment, rmacnak-google) |
| 2022-01-18 to 2022-07-28 | FFI support for RISC-V (word-sized-only at first; varargs, struct-by-value follow) | [#48164](https://github.com/dart-lang/sdk/issues/48164) |
| 2022-06-14 to 2022-11-18 | JIT-slowness report investigated and closed as a general Dart-2-frontend cost, not RISC-V-specific | [#49253](https://github.com/dart-lang/sdk/issues/49253) |
| 2023-03-24 | "Provide RISC-V builds for Linux" closed same day; confirms RISC-V builds existed only on **dev and beta channels**, "in preview," pending "sufficient testing and validation" before a stable release | [#51843](https://github.com/dart-lang/sdk/issues/51843) (comment, mit-mit) |
| 2023-06-09 to 2023-06-13 | Alpine Linux riscv64 sysroot support landed (PR #52663, PR #52680) | [#52663](https://github.com/dart-lang/sdk/pull/52663), [#52680](https://github.com/dart-lang/sdk/pull/52680) |
| 2024-05-30 | riscv64 enabled by default in the Alpine sysroot installer (Alpine 3.20 stable) | [#55875](https://github.com/dart-lang/sdk/pull/55875) |
| 2025 (Dart 3.9.0) | Cross-compilation support added for `--target-arch riscv64` (RV64GC) targeting Linux | `CHANGELOG.md`, Dart 3.9.0 entry |
| 2024-09-09 | Real-hardware crash reported on StarFive VisionFive 2 board, still open | [#56671](https://github.com/dart-lang/sdk/issues/56671) |
| 2026-09-08 | Most recent RISC-V-specific fix landed on main (assembler shift-op bug) | commit [`57e1425b`](https://github.com/dart-lang/sdk/commit/57e1425bcff4bae7f2415ffe12795854a2ee16cc) |

**Key contributors:** Ryan Macnak (rmacnak-google), Slava Egorov (mraleph), Alexander Markov, Martin Kustermann, Tess Strickland, Liam Appelbe, Daco Harkes (dcharkes) - all Google employees, all landing the port through the standard Gerrit/OWNERS review gate rather than as standalone GitHub PRs.

**Is it fully upstream?** Yes for the compiler/runtime backend (in-tree, no fork required). The port was never merged as a single GitHub PR; it landed as a long series of internal Google Gerrit commits mirrored to GitHub, so no single "the RISC-V port" PR exists to point to. Build-tooling PRs that are visible on GitHub (Alpine sysroot support) did land; one attempted fix ([#51225](https://github.com/dart-lang/sdk/pull/51225)) landed and was reverted 11 hours later the same day for "breaks the riscv64 bot," and never shipped in any release.

## 3. Upstream Support Tier

No published tiering document (no `PLATFORMS.md`/`SUPPORT.md`/tier list) distinguishes riscv64 from arm64/amd64 in the Dart SDK. What exists in practice:

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (LUCI) | Yes (LUCI) | Yes (LUCI, `vm-gcc-linux-*-riscv64`, `vm-ffi-qemu-linux-release-riscv64`) |
| CI runs tests | Yes, native hardware | Yes, native/QEMU | Yes, but via QEMU emulation on x86-64 hosts (`vm-ffi-qemu-linux-release-riscv64`, dimensions `cpu:x86-64`) or Dart's own software simulator (`simriscv64`), not native riscv64 silicon |
| CI gates merges (presubmit/CQ) | Yes | Yes | No - the riscv64 and simriscv64 try-builders are marked `includable_only: true`, meaning they do **not** run automatically on every PR; the QEMU try-builder only fires when a change touches riscv/compiler paths |
| Official stable release artifact | Yes (`storage.googleapis.com/dart-archive`) | Yes | dev/beta channel only as of the last confirmation (2023); no evidence found of a stable-channel riscv64 SDK archive [NEEDS VERIFICATION - dated 2023] |
| Cross-compile target | N/A (native) | Supported | Supported since Dart 3.9.0 (`--target-arch riscv64`, RV64GC) |

The riscv64 postsubmit CI is real and continuously exercised (active fixes as recently as 2026-09-08), but it is not a release-blocking gate the way amd64/arm64 CI is, and the consumable release artifact status on the stable channel is unconfirmed beyond a 2023 "preview" statement.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Dart's VM implements a complete, non-stub RISC-V (RV32 + RV64) backend using the same per-architecture-suffix layout used for arm/arm64/x64/ia32 (files live flat in `runtime/vm/` and `runtime/vm/compiler/{assembler,backend}/` with a `_riscv` suffix; there is no `arch/riscv/` directory).

| File | Lines | Purpose |
|---|---|---|
| `runtime/vm/compiler/assembler/assembler_riscv.cc` | 6,034 | Full RV32I/RV64I + M/A/F/D/C/Zba/Zbb/Zbs/Zbc/V/Zicond/Zfa/Zicfiss/... instruction emitters |
| `runtime/vm/compiler/backend/il_riscv.cc` | 7,206 | IL-to-machine-code lowering (JIT/AOT codegen backend) |
| `runtime/vm/compiler/stub_code_compiler_riscv.cc` | 3,491 | Runtime stub generation (allocation, entry/exit trampolines, RVV-accelerated array fill) |
| `runtime/vm/simulator_riscv.cc` | 3,865 | Instruction-set simulator |
| `runtime/vm/compiler/assembler/disassembler_riscv.cc` | 2,371 | Disassembler |
| `runtime/vm/constants_riscv.h` | 2,009 | ISA encoding constants, extension bitset definitions |
| `runtime/vm/compiler/asm_intrinsifier_riscv.cc` | 1,996 | Hand-written asm intrinsics for hot library methods |
| `runtime/vm/compiler/backend/flow_graph_compiler_riscv.cc` | 1,246 | Frame setup, calling convention, deopt |
| Remaining files (simulator header, instructions, code patcher, CPU id/icache, stack frame, debugger) | ~1,220 combined | Supporting infrastructure |

Total: approximately 53,000 lines including tests (`assembler_riscv_test.cc` alone is 10,216 lines). This is an actively maintained backend, not a stub - the most recent commit (`57e1425b`, 2026-09-08) is a live bug fix to shift-instruction handling with new regression tests.

**ISA extensions modeled/used** (`runtime/vm/constants_riscv.h`, `ExtensionSet`): `RV_I, RV_M, RV_A, RV_F, RV_D, RV_Q, RV_C` (base + compressed), `RV_Zba, RV_Zbb, RV_Zbs, RV_Zbc` (bit-manipulation, grouped as `RV_B`), `RV_V` (Vector), `RV_Zicond, RV_Zcb, RV_Zfa, RV_Zimop, RV_Zcmop, RV_Zawrs, RV_Zicfiss, RV_Zabha, RV_Zalasr, RV_Zfhmin, RV_Zacas`. Baseline profiles `RVA20 = RV_GC`, `RVA22 = RV_GC|RV_B`, `RVA23` are defined, and extension support is runtime-detected/gated (e.g. `Supports(RV_Zfa)` for `fminmd`/`fmaxmd`, `Supports(RV_Zbb)` for bit-manipulation-accelerated ops).

**RVV (Vector) coverage is narrow, not general SIMD codegen.** `vsetvli`, `vle{8,16,32,64}v`, `vse{8,16,32,64}v`, `vmvvx` are implemented in the assembler and used only in `stub_code_compiler_riscv.cc` (3 call sites) to vectorize array/list zero-fill and null-fill runtime stubs, with a scalar-loop fallback when `RV_V` is unsupported.

**Functional gap: Dart's portable SIMD128 language feature (`Float32x4`, `Int32x4`, `Float64x2`, `SimdOpInstr`) is explicitly unimplemented on RISC-V.** In `il_riscv.cc`, both `SimdOpInstr::MakeLocationSummary` and `SimdOpInstr::EmitNativeCode` hit `UNREACHABLE()` - SIMD128 has no RISC-V backend at all. This is a correctness/functional gap for any Dart program using `dart:typed_data` SIMD types on riscv64, not merely a performance shortfall.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Scalar JIT/AOT codegen | Complete | Complete | Complete |
| FFI (varargs, struct-by-value) | Complete | Complete | Complete (landed via [#48164](https://github.com/dart-lang/sdk/issues/48164), [#50858](https://github.com/dart-lang/sdk/issues/50858), [#50853](https://github.com/dart-lang/sdk/issues/50853)) |
| Bit-manipulation intrinsics | Native (BMI/BMI2) | Native | Zba/Zbb/Zbs/Zbc used opportunistically when detected |
| SIMD128 (`Float32x4` et al.) | Hardware-backed (SSE) | Hardware-backed (NEON) | **Unimplemented - `UNREACHABLE()`** |
| Array-fill vectorization | Hardware-backed | Hardware-backed | RVV used in 3 stub call sites only |
| Instruction simulator | N/A | Yes (`simarm64`) | Yes (`simriscv32`/`simriscv64`) |

## 5. Build System, Cross-Compilation, and Toolchain

Dart does not use CMake; the build system is GN + Ninja, invoked through `tools/build.py`, with source fetched via Chromium's `depot_tools`/`gclient` rather than a plain `git clone`.

**Getting the source:**
```
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH="$PATH:$PWD/depot_tools"
mkdir dart-sdk && cd dart-sdk
fetch dart
cd sdk
```

**riscv64 cross-toolchain (Debian/Ubuntu):** the build downloads a Fuchsia-provided Clang toolchain that can target riscv64 from an x64/arm64 host with no manual toolchain setup. For a native GCC cross-toolchain, or building on a riscv64 host directly: `sudo apt-get install g++-riscv64-linux-gnu`. riscv32 is the exception - Ubuntu has no equivalent 32-bit package and Fuchsia Clang does not support riscv32 as a target at all; a toolchain from [toolchains.bootlin.com](https://toolchains.bootlin.com/) is required.

**No documented minimum GCC/Clang version for riscv64** was found in `docs/`, `DEPS`, or any `BUILD.gn`/`.gni` file. The only pin is the internal Fuchsia-Clang revision in `DEPS` (`clang_version: git_revision:dde579becf31add55c5a473f28fd010df36d2490`), which is whatever `gclient sync` currently downloads, not a user-facing floor with documented rationale.

**Build commands** ([docs/Building-Dart-SDK-for-ARM-or-RISC-V.md](https://github.com/dart-lang/sdk/blob/main/docs/Building-Dart-SDK-for-ARM-or-RISC-V.md)):
```
./tools/build.py --no-clang --mode release --arch riscv64 create_sdk
./tools/build.py --no-clang -m release -a riscv64 -t riscv64=/path/to/toolchain/prefix create_sdk
```
Android target: `./tools/build.py --mode=release --arch=riscv64 --os=android create_sdk`. Debian-package build: `./tools/build.py --mode=release --arch=arm,arm64,riscv64 debian_package` (note: `BUILD.gn` explicitly gates `debian_package` off for riscv32, `is_linux && current_cpu != "riscv32"` - supported for riscv64, not riscv32).

**GN args (no CMake-style `-DUSE_X=OFF` flags exist):** `dart_target_arch` in `runtime/runtime_args.gni` accepts `arm, arm64, x64, ia32, riscv32, riscv64`; `build_analyze_snapshot` is enabled only for 64-bit AOT targets (`x64`, `arm64`, `riscv64`), effectively off for riscv32. No explicit `-march=rv64gc` codegen flag is configured anywhere; the build relies on toolchain/GN defaults.

**QEMU testing** ([runtime/docs/qemu.md](https://github.com/dart-lang/sdk/blob/main/runtime/docs/qemu.md)):
```
sudo apt install qemu-user libc6-armhf-cross libc6-arm64-cross libc6-riscv64-cross
./tools/build.py --mode release --arch arm,arm64,riscv64 runtime
./tools/test.py --mode release --arch arm,arm64,riscv64 --use-qemu lib
```

**Known build failures (historical, all closed):** `-fno-strict-vtable-pointers` incompatibility ([#48703](https://github.com/dart-lang/sdk/issues/48703)); no Alpine riscv64 sysroot, blocking musl builds, resolved by [#52680](https://github.com/dart-lang/sdk/pull/52680) ([#52303](https://github.com/dart-lang/sdk/issues/52303)); cross-compile failure on Ubuntu 22.04 ([#50645](https://github.com/dart-lang/sdk/issues/50645)); `-march=rv64gcv` cross-compilation error ([#60164](https://github.com/dart-lang/sdk/issues/60164)); riscv32 build breakage ([#54434](https://github.com/dart-lang/sdk/issues/54434), [#57021](https://github.com/dart-lang/sdk/issues/57021), [#ee5f20b9](https://github.com/dart-lang/sdk/commit/ee5f20b9b4a540b19136ad7603a85efd0497cb0e)). No riscv-specific Dockerfile exists in the repository.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT execution | Full speed | Full speed | Functionally correct; reported as very slow in early hardware testing ([#49253](https://github.com/dart-lang/sdk/issues/49253), see Section 8/11) - later diagnosed as a general Dart-2 frontend cost rather than a riscv-specific defect |
| AOT compilation and execution | Full speed | Full speed | Compile step slow on early hardware, but compiled binary "ran efficiently" per the same report |
| FFI (varargs, struct-by-value, callbacks) | Complete | Complete | Complete (feature parity landed by mid-2023) |
| SIMD128 (`Float32x4`/`Int32x4`/`Float64x2`) | Hardware-backed | Hardware-backed | **Not implemented - functional gap, `UNREACHABLE()`** |
| Stable-channel prebuilt SDK download | Yes | Yes | Unconfirmed - dev/beta preview only as of last check (2023) |
| Native GitHub Actions CI | N/A (uses LUCI) | N/A (uses LUCI) | N/A (uses LUCI; no `.github/workflows/*.yml` reference riscv at all) |
| Debian/Ubuntu package | N/A | N/A | Not applicable - Dart is not packaged in any major Linux distro (Ubuntu, Debian, Alpine, Arch) under any name for any architecture |

**Functional gaps:** SIMD128 language types are entirely unimplemented on riscv64 (Section 4) - any code using `dart:typed_data`'s `Float32x4`/`Int32x4`/`Float64x2` types will not run on this architecture. FFI on the simulator remains an open gap per longstanding issue [#37299](https://github.com/dart-lang/sdk/issues/37299) ("Support FFI on simulated architectures," open since 2019).

**Performance gaps:** No current (2024-2026) quantitative riscv64-vs-arm64 or riscv64-vs-amd64 Dart benchmark data exists in any source checked (GitHub, web search, RISE blog). The only hard numbers found are from 2022, on a Sipeed Lichee RV board, Dart 2.18.0-165.1.beta ([#49253](https://github.com/dart-lang/sdk/issues/49253)):
- JIT hello-world: 35.9s; `dart --help`: 19.5s; AOT compile step: 2m57s; running the compiled AOT binary: 0.015s; equivalent native C compile for comparison: 0.623s.
- Google's closing analysis: reproduced on an in-house Allwinner D1 device and found "no RISC-V specific issue" - the slowness was attributed to Dart 2's higher frontend-compilation cost generally, "much more noticeable" on slow CPUs, not to missing RISC-V codegen support.
This data is 4 years old, taken on early/low-end riscv64 hardware, and is not a controlled riscv64-vs-arm64 comparison; treat any extrapolation from it as [NEEDS VERIFICATION].

**Security hardening gaps:** Not directly assessed in this research pass; BoringSSL (Dart's TLS/crypto dependency) has no riscv64 assembly-optimized primitives and no native Linux riscv64 test coverage (Section 9) - this is a dependency-level gap, not a Dart-VM-level one.

**NaN / floating-point semantics:** Issue [#49423](https://github.com/dart-lang/sdk/issues/49423) ("`double.nan` has a platform-specific bit pattern") documents that NaN payload bits differ across the architectures observed (macOS arm64 vs x64/Rosetta) - not confirmed riscv64-specific in the reports, but architecturally relevant since riscv64's canonical NaN encoding could produce a third distinct bit pattern, which could affect binary-format round-tripping (e.g. protobuf) cross-platform. [NEEDS VERIFICATION - no riscv64 data point found in the issue].

## 7. CI/CD Infrastructure

**GitHub Actions: no riscv64 CI exists.** `.github/workflows/` contains exactly three files - `no-response.yml` (stale-issue bot), `scorecards-analysis.yml` (OpenSSF Scorecard), `third-party-deps-scan.yml` (dependency scanning) - all read and grepped for `riscv`/`RISCV`/`linux/riscv64`, with zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the tree.

**Actual CI is Google's LUCI/Buildbucket system**, configured in `tools/bots/test_matrix.json` (in-tree, 3,613 lines) and `cr-buildbucket.cfg`/`commit-queue.cfg` (on the separate `infra/config` branch). Confirmed riscv64/riscv32 builders:

Postsubmit (run automatically on every commit to `main`, continuously):
- `vm-ffi-qemu-linux-release-riscv64` (+ `-beta`/`-stable` variants) - builds AND runs VM unit tests and FFI tests via `--use-qemu`, dimensions `cpu:x86-64`, `os:Ubuntu-26` (QEMU-emulated, not native riscv64 silicon)
- `vm-gcc-linux-debug-riscv64`, `vm-gcc-linux-release-riscv64` - native GCC cross-build; no `--use-qemu` flag found, so likely build-verification only, unconfirmed whether resulting binaries are executed
- `vm-linux-debug-simriscv64`, `vm-aot-linux-*-simriscv32/simriscv64` - Dart's own software instruction simulator, host x64, also runs tests (not real machine code)
- `vm-aot-android-*-riscv64` - Android AOT target build

Presubmit/CQ (would gate PR merges) - all three riscv-related try-builders (`dart-sdk-linux-riscv64-try`, `vm-linux-debug-simriscv64-try`, `vm-ffi-qemu-linux-release-riscv64-try`) are marked `includable_only: true`, meaning **they do not run automatically on every PR/CL**. The QEMU try-builder additionally requires `location_filters` matching riscv/compiler paths before it triggers even when included. This means riscv64 CI is not an unconditional pre-merge gate, though it does run continuously post-merge.

No evidence of RISE RISC-V Runner usage was found for Dart (searched `riseproject-dev` GitHub org, riscv-runners.riseproject.dev documentation - no Dart-specific reference).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds in CI | Yes (LUCI) | Yes (LUCI) | Yes (LUCI, QEMU + GCC cross-build + simulator) |
| Tests run in CI | Yes, native | Yes | Yes, but via QEMU emulation or software simulator, not native silicon |
| Gates PR merge (presubmit) | Yes | Yes | No - `includable_only: true` on all riscv try-builders |
| Runs on GitHub Actions | N/A | N/A | No - GitHub Actions has zero riscv jobs; all real CI is Google LUCI |

## 8. Distribution and Release Status

**No official riscv64 binaries confirmed on the stable channel.** `dart-lang/sdk` publishes no GitHub Releases at all ("There aren't any releases here" per the GitHub Releases page) - Dart's official distribution channel is `storage.googleapis.com/dart-archive`, not GitHub. Per issue [#51843](https://github.com/dart-lang/sdk/issues/51843) (closed 2023-03-24), RISC-V builds existed at that time only on the **dev and beta channels**, described as "in preview," pending "sufficient testing and validation" before graduating to stable. No later confirmation of stable-channel graduation was found in this research pass; treat current stable-channel availability as **[NEEDS VERIFICATION]**.

**Cross-compilation is available regardless of prebuilt-binary status:** Dart 3.9.0 (2025) added `--target-arch riscv64` (RV64GC) as a cross-compilation target for `dart compile exe` when targeting Linux, per `CHANGELOG.md`. This lets a user on x64/arm64 produce a riscv64 executable without needing a riscv64 host or a prebuilt riscv64 SDK - but it is a different capability from "Google ships a riscv64 SDK download."

**No PyPI, npm, or Maven presence:** Dart is not distributed via any of these registries. The PyPI package named `dart` (version 1.0, `py2.py3-none-any`, dated 2014) is confirmed to be an unrelated, squatted placeholder, not the Google Dart SDK.

**No Linux distro packages:** Checked Ubuntu 26.04 (resolute) via `packages.ubuntu.com` - no package named `dart` exists for any architecture. All 38 name matches for "Dart" are unrelated: `dart-doc`, `darts`, `elpa-dart-mode`, Go Sass bindings (`golang-github-bep-godartsass*`), CUDA runtime (false positive on "cudart"), and the `libdart*`/`python3-dartpy` family, which is DART (Dynamic Animation and Robotics Toolkit), an unrelated C++ robotics library.

**Downstream community workarounds exist:** community `dart-musl/dart` Docker images provide musl-based riscv64 builds (referenced from PR [#52663](https://github.com/dart-lang/sdk/pull/52663)); a real-hardware user tested these on a StarFive VisionFive 2 board and hit a crash ([#56671](https://github.com/dart-lang/sdk/issues/56671)).

**What a user must do today to get a working riscv64 Dart binary:** either (a) build from source via the GN/Ninja toolchain documented in Section 5, (b) use the Dart 3.9+ cross-compilation path from an x64/arm64 host to produce a riscv64-targeted AOT executable, or (c) use an unofficial community musl-based Docker image - there is no confirmed one-command official stable-channel install for native riscv64 Dart as of this research.

## 9. Dependencies

**Note:** Dart's own VM is self-hosted - it has no external JIT-backend dependency. V8 is not a Dart SDK build dependency (only the `d8` shell is checked out for test tooling), so V8's riscv64 status does not propagate into this report.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| BoringSSL | Crypto (`dart:io` TLS, FFI hashing) | `OPENSSL_RISCV64` macro defined (added 2022-06-08); scalar-only, zero assembly-optimized riscv64 primitives in `gen/sources.json` | Android NDK cross-compile-only LUCI builders (`android_riscv64_compile_only`, `android_riscv64_prefixed_compile`); `run_ssl_tests:false`, `run_unit_tests:false`; no native Linux riscv64 test bot | No dedicated FIPS-module riscv64 build [NEEDS VERIFICATION]; ships only via Android fork downstream | No GitHub Issues tracker for BoringSSL; real perf gap vs amd64/arm64 (scalar crypto only), no public benchmark found |
| ICU | Unicode/i18n (`dart:intl`) | Builds cleanly from source with no patches; has a documented riscv64-specific correctness workaround in-source (`units_complexconverter.cpp`, Inf/NaN carry calculation) | Debian sid riscv64 builder `rv-manda-02`, no reported failures (~45 days old at time of check) | No upstream prebuilt riscv64 binaries; Arch Linux RISC-V ships `icu-78.3-1-riscv64.pkg.tar.zst` | No open riscv64 issues found in `unicode-org/icu` |
| double-conversion | Float-to-string conversion, used pervasively by the Dart VM | Pure portable C++, no arch-specific source files needed | Zero riscv64/QEMU references in any of the 4 upstream GitHub Actions workflows - tested only by Debian's external porter machines | Debian ports archive only (not main), porter `rv-osuosl-03` | Only 1 loosely related closed issue found; not riscv-specific |
| cpu_features | CPU-feature runtime detection, informs Dart VM codegen decisions | riscv64 support merged upstream (`include/cpuinfo_riscv.h`, PRs #287 and #289, merged 2023) | Dedicated `riscv_linux_cmake.yml` CI workflow upstream | Tracked via Debian buildd | Issue #247 ("Add support for riscv64?") is stale-but-open despite support already existing; #368/#369/#447 are non-blocking refinements |
| zlib | Compression (`dart:io` gzip/deflate) | Generic C, no arch-specific source | No upstream CI evidence; relies on distro porter builds | Ubuntu 24.04 noble, Debian sid (`rv-manda-03`), Arch Linux RISC-V, Alpine edge all ship riscv64 builds | No riscv64-specific issues found in `madler/zlib` |
| binaryen | Wasm optimizer used by `dart compile wasm` (dart2wasm) | No riscv references found in `.github/` workflows; host-side tool, should build generically | Not verified - no CI evidence found | Not covered by an existing project report | No riscv-related issues found |
| libcxx/libcxxabi (LLVM) | C++ stdlib used to build the Dart VM's own C++ runtime | LLVM riscv64 backend actively developed but has a long tail of open correctness bugs - 801 total open riscv64 issues in `llvm/llvm-project`, including reported miscompilations at -O2/-O3 | N/A (toolchain, not shipped) | Not covered by an existing project report | The one dependency with genuinely open, unresolved riscv64 codegen risk - a toolchain-level concern for the VM's C++ runtime build, though Dart's own JIT is self-hosted and unaffected |

**Key takeaway:** the weakest dependency link is BoringSSL - functionally correct (scalar fallback) but no native riscv64 CI and no riscv64 assembly optimization. `cpu_features` is in better shape than its open-looking tracking issue suggests (real support merged in 2023). Ubuntu 26.04 (resolute) availability could not be confirmed for any dependency in this research pass due to a `project-graph` MCP tool connection failure - flagged as a gap to close on a future pass.

## 11. Known Bugs and Active Issues

### Open

| ID | Title | Severity | Notes |
|---|---|---|---|
| [#56671](https://github.com/dart-lang/sdk/issues/56671) | `si_signo=Illegal instruction(4)` crash running `dart run build_runner build` with dart-musl on StarFive VisionFive 2 | **Correctness - real hardware** | Open since 2024-09-09, 7 comments, no fix posted. Occurs inside `_JsonStringParser.get:isUtf16Input`; confirmed to work on x64. This is the only known-bad report on real (non-emulated, non-simulated) riscv64 hardware in this dataset. |
| [#49791](https://github.com/dart-lang/sdk/issues/49791) | Failures on `vm-ffi-qemu-linux-release-riscv64` from old QEMU (`DoubleMax`/`DoubleMin`/`SingleMax`/`SingleMin`) | CI infra | Open since 2022; body notes tests pass after upgrading to a newer Ubuntu/QEMU - appears to be an environmental fix not yet formally closed out. |
| [#50521](https://github.com/dart-lang/sdk/issues/50521) | `vm/cc/IsolateReload_NotTypedefToTypedef` flaky on `vm-precomp-ffi-qemu-linux-release-riscv64` | CI infra | Open, no diagnosis posted. |
| [#37299](https://github.com/dart-lang/sdk/issues/37299) | FFI not supported on simulated architectures | Functional gap | Open since 2019; relevant to riscv64 simulator/FFI test coverage generally. |
| [#49423](https://github.com/dart-lang/sdk/issues/49423) | `double.nan` has a platform-specific bit pattern | Correctness (cross-platform) | Not confirmed riscv64-specific in the reports (observed on macOS arm64 vs x64/Rosetta), but directly relevant to riscv64's own canonical NaN encoding [NEEDS VERIFICATION]. |

### Closed (notable history)

| ID | Title | Outcome |
|---|---|---|
| [#63479](https://github.com/dart-lang/sdk/issues/63479) | `corelib/int_bit_count_test` failed on `vm-linux-debug-simriscv64` | Closed 2026-06-22; tied to a popcount/ctz intrinsics revert (commit `5b028586`) |
| [#63480](https://github.com/dart-lang/sdk/issues/63480) | FFI not supported on SIMARM and SIMRISC | Closed 2026-06-03 |
| [#60807](https://github.com/dart-lang/sdk/issues/60807) | Possible heap corruption in `language/deferred/global_test` on riscv64 | Closed 2025-05-28 |
| [#60164](https://github.com/dart-lang/sdk/issues/60164) | Cross-compilation error with `-march=rv64gcv` | Closed 2025-02-19 |
| [#59611](https://github.com/dart-lang/sdk/issues/59611) | Fuzzer assertion failure in `il_riscv.cc` | Closed 2024-11-27 |
| [#57021](https://github.com/dart-lang/sdk/issues/57021) | riscv32 build broken | Closed 2024-11-04 |
| [#55623](https://github.com/dart-lang/sdk/issues/55623) | Fuzzer "unreachable code" in `instructions_riscv.cc` | Closed 2024-05-10 |
| [#55040](https://github.com/dart-lang/sdk/issues/55040) | `float32x4_unbox_phi_test` failing on riscv64 | Closed 2024-02-28, fixed by commit `f4857643` |
| [#54434](https://github.com/dart-lang/sdk/issues/54434) | simriscv32 build broken | Closed 2023-12-21 |
| [#52823](https://github.com/dart-lang/sdk/issues/52823) | FFI callback stress test failing under riscv64 QEMU | Closed 2023-07-05 |
| [#52303](https://github.com/dart-lang/sdk/issues/52303) | No Alpine riscv64 sysroot available | Closed 2023-12-30, resolved by PR #52680 |
| [#51111](https://github.com/dart-lang/sdk/issues/51111) | Re-enable tcmalloc for RV64 | Closed 2023-04-19 |
| [#50858](https://github.com/dart-lang/sdk/issues/50858) | FFI vararg support on RISC-V | Closed 2023-01-20 (feature landed) |
| [#50853](https://github.com/dart-lang/sdk/issues/50853) | FFI structs-by-value tests failing on RISC-V | Closed 2022-12-27 |
| [#50645](https://github.com/dart-lang/sdk/issues/50645) | Cross-compile build for riscv64 fails on Ubuntu 22.04 | Closed 2023-05-22 |
| [#49253](https://github.com/dart-lang/sdk/issues/49253) | Very slow execution on RISC-V except for AOT | Closed 2022-11-18, root-caused as general Dart-2 frontend cost |
| [#48703](https://github.com/dart-lang/sdk/issues/48703) | riscv64 build failing due to `-fno-strict-vtable-pointers` | Closed same day, 2022-03-30 |
| [#48333](https://github.com/dart-lang/sdk/issues/48333) | Initial RISC-V failures (large test-failure list) | Closed 2022-07-28 |
| [#48164](https://github.com/dart-lang/sdk/issues/48164) | FFI support for RISC-V | Closed 2022-07-28 (feature landed) |
| [#38587](https://github.com/dart-lang/sdk/issues/38587) | Master tracking: adding RISC-V support | Closed 2022-02-15 |

**Correctness bugs highlighted separately:** [#56671](https://github.com/dart-lang/sdk/issues/56671) (open, real-hardware illegal-instruction crash) is the single most severe unresolved issue in this dataset - it is the only report of a crash on genuine riscv64 silicon rather than QEMU or the software simulator. The SIMD128 `UNREACHABLE()` gap documented in Section 4 is a standing, undocumented-as-a-bug functional limitation rather than a filed issue.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer statement opposing riscv64 support was located anywhere in the issue/PR history reviewed.

**Technical blockers:**
- SIMD128 (`Float32x4`/`Int32x4`/`Float64x2`) has no RISC-V implementation (`UNREACHABLE()` in `il_riscv.cc`) - closing this requires either RVV-based lowering or a scalar-emulation fallback path, neither of which currently exists.
- riscv64 execution in CI is entirely QEMU-emulated or software-simulated; there is no native riscv64 hardware in Google's LUCI fleet observed in this research, which limits confidence in real-hardware correctness (consistent with the still-open real-hardware crash, [#56671](https://github.com/dart-lang/sdk/issues/56671)).
- LLVM/libcxx, used to build the VM's own C++ runtime, carries 801 open riscv64 issues upstream including reported miscompilations - a toolchain-level risk surface outside Dart's direct control.

**Organizational blockers:**
- riscv64 presubmit/CQ builders are `includable_only: true`, so a regression can land without automatically being caught before merge on every change; it depends on postsubmit CI catching it after the fact, followed by manual triage (this is the mechanism visible behind the repeated cycle of "gardening" issues that fix riscv-only build/test breaks after the fact, e.g. [#54434](https://github.com/dart-lang/sdk/issues/54434), [#57021](https://github.com/dart-lang/sdk/issues/57021)).
- No confirmed graduation of riscv64 SDK downloads from dev/beta preview to the stable channel was found beyond the 2023 statement in [#51843](https://github.com/dart-lang/sdk/issues/51843) - this is either an organizational deprioritization or simply undocumented; the data available cannot distinguish the two. [NEEDS VERIFICATION]

**Acceptance probability of further riscv64 investment:** high. Google's own engineers have driven and continue to drive this port (active commits through 2026-09-08) with no recorded opposition; the standing gaps (SIMD128, native-hardware CI, stable-channel release) are engineering backlog items in an already-accepted port, not open questions about whether RISC-V belongs in Dart at all.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** upstream (dev/beta preview channel only as of the last confirmation; no evidence of current stable-channel riscv64 SDK release)
- **Optimization level:** not applicable. Dart is a general-purpose language runtime, not an optimization-purpose project under the color model's test ("would the project still deliver its core value using only generic C code?" - yes, a language runtime's core value is language semantics and correctness, not being faster than a simpler alternative), so the Step 2 modifier is not applied. Note for context, not as a grading factor: within Dart's own architecture-specific compiler backend, RVV vector usage is narrow (array-fill stubs only, 3 call sites) and the SIMD128 language feature is entirely absent (`UNREACHABLE()`) on riscv64 - this is a real functional gap that a technical evaluator should weigh even though it does not change the color under this model's rules.

**Justification:** Dart's riscv64 support clears the CI build+test bar - Google's LUCI postsubmit CI builds riscv64 continuously (`vm-gcc-linux-*-riscv64`, `vm-ffi-qemu-linux-release-riscv64`) and runs real VM unit tests and FFI tests via QEMU emulation and via Dart's own software simulator, with active fixes landing as recently as 2026-09-08 (commit [`57e1425b`](https://github.com/dart-lang/sdk/commit/57e1425bcff4bae7f2415ffe12795854a2ee16cc)). This rules out yellow (build-only) and orange (no upstream CI). It does not clear green because no confirmed upstream-published riscv64 artifact on the stable release channel was found - the only concrete statement located ([#51843](https://github.com/dart-lang/sdk/issues/51843), 2023-03-24) says RISC-V builds were dev/beta preview only, pending further validation before stable, and no later source confirms graduation. Per the color model, CI builds+tests pass with no confirmed upstream stable riscv64 artifact maps to blue.

**Pending work that could change the grade:** confirming current stable-channel riscv64 SDK release status (would resolve to green if confirmed present, or leave at blue if confirmed absent - see Section 8) is the single fact most likely to move this grade and should be the first re-check on any refresh of this report. No RISE involvement or open PRs materially affecting this grade were found in this research pass. Making the riscv64 presubmit builders non-`includable_only` (i.e. release-blocking on every PR, not just postsubmit) would strengthen confidence but would not by itself change the color under this model, since the rubric keys on whether tests execute and artifacts publish, not on presubmit-gating strictness.

## 14. Investment Analysis

RISE has not funded or otherwise engaged with Dart (Section 1) - no existing RISE work exists to net out of the estimates below.

### 14.1 Functional Enablement

- Implement SIMD128 (`Float32x4`/`Int32x4`/`Float64x2`) lowering for riscv64 in `il_riscv.cc`, replacing the current `UNREACHABLE()` path - either via RVV intrinsics (closing the gap with real hardware-backed performance) or a scalar-emulation fallback (closing the functional gap without a performance uplift). Full RVV-based implementation is a larger effort than a scalar shim.
- Diagnose and fix the open real-hardware crash [#56671](https://github.com/dart-lang/sdk/issues/56671) (StarFive VisionFive 2, `_JsonStringParser.get:isUtf16Input` illegal-instruction fault) - requires access to real riscv64 hardware, which the current CI fleet (QEMU/simulator only) does not provide.
- Resolve the two open CI-flakiness issues tied to QEMU version/config ([#49791](https://github.com/dart-lang/sdk/issues/49791), [#50521](https://github.com/dart-lang/sdk/issues/50521)).

### 14.2 Performance Optimization

- Produce current (2024-2026) riscv64-vs-arm64/amd64 benchmark data on modern hardware - none exists today; the only data point is a 2022 report on early, low-end hardware ([#49253](https://github.com/dart-lang/sdk/issues/49253)).
- Extend RVV usage beyond the current 3 array-fill stub call sites into other hot paths where arm64/amd64 already have SIMD-accelerated code, once SIMD128 functional support (14.1) exists to build on.
- BoringSSL riscv64 assembly optimization (crypto primitives are currently scalar-only) - this is upstream BoringSSL work, not Dart-VM work, but Dart's TLS/FFI-hashing performance on riscv64 depends on it (Section 9).

### 14.3 CI/CD Infrastructure

- Add native riscv64 hardware to LUCI (all current riscv64/riscv32 execution is QEMU-emulated or software-simulated on x86-64 hosts) - this is the most direct way to catch real-hardware-only bugs like [#56671](https://github.com/dart-lang/sdk/issues/56671) before they reach users.
- Move the riscv64/simriscv64 try-builders off `includable_only: true` so they gate every PR touching relevant paths, rather than running postsubmit-only.
- Investigate and confirm current stable-channel riscv64 SDK release status; if absent, scope the work to graduate it from dev/beta preview.

### 14.4 Ecosystem Enablement

Not scoped in this report - no dependent-package-ecosystem research (e.g. pub.dev package riscv64 coverage) was conducted; Section 10 is omitted per the report's scope rules pending that research.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement SIMD128 lowering for riscv64 (scalar-fallback shim) | 2-4 | Dart VM team (Google) or external contributor with Gerrit OWNERS sponsor | High |
| Functional | Implement SIMD128 lowering for riscv64 (full RVV-accelerated) | 6-10 | Dart VM team (Google) | Medium |
| Functional | Diagnose/fix real-hardware crash #56671 | 1-3 (blocked on hardware access) | Dart VM team (Google) | High |
| Functional | Resolve open QEMU CI flakiness (#49791, #50521) | 1-2 | Dart VM/infra team (Google) | Medium |
| Performance | Produce current riscv64 benchmark suite on modern hardware | 1-2 | Any contributor with riscv64 hardware access | Medium |
| Performance | Extend RVV usage beyond array-fill stubs | 3-6 (depends on 14.1 scalar/RVV path chosen) | Dart VM team (Google) | Low-Medium |
| CI/CD | Add native riscv64 hardware to LUCI fleet | 2-4 (infra/procurement, not engineering-only) | Dart infra team (Google) | High |
| CI/CD | Make riscv64 try-builders presubmit-gating (remove `includable_only`) | 0.5-1 | Dart infra team (Google) | Medium |
| Distribution | Confirm/complete stable-channel riscv64 SDK graduation | 1-2 (plus validation/soak time) | Dart release team (Google) | High |

## 15. Updates

No updates yet - initial report dated 2026-09-10.

## 16. References

- [Dart SDK repository](https://github.com/dart-lang/sdk)
- [Dart homepage](https://dart.dev/)
- [#38587 - Adding support for RISC-V architecture (master tracking issue)](https://github.com/dart-lang/sdk/issues/38587)
- [#48164 - FFI support for RISC-V](https://github.com/dart-lang/sdk/issues/48164)
- [#48333 - Initial RISC-V failures](https://github.com/dart-lang/sdk/issues/48333)
- [#48703 - RISC-V 64 build failing due to -fno-strict-vtable-pointers](https://github.com/dart-lang/sdk/issues/48703)
- [#49253 - Very slow execution on RISC-V except for AOT](https://github.com/dart-lang/sdk/issues/49253)
- [#49423 - double.nan has a platform-specific bit pattern](https://github.com/dart-lang/sdk/issues/49423)
- [#49791 - Failures on vm-ffi-qemu-linux-release-riscv64 from old QEMU](https://github.com/dart-lang/sdk/issues/49791)
- [#50521 - IsolateReload_NotTypedefToTypedef flaky on riscv64](https://github.com/dart-lang/sdk/issues/50521)
- [#50645 - Cross compile build for riscv64 fails on Ubuntu 22.04](https://github.com/dart-lang/sdk/issues/50645)
- [#50853 - Structs by value tests on RISC-V are failing](https://github.com/dart-lang/sdk/issues/50853)
- [#50858 - Vararg support on RISC-V](https://github.com/dart-lang/sdk/issues/50858)
- [#51111 - Re-enable tcmalloc for RV64](https://github.com/dart-lang/sdk/issues/51111)
- [#51843 - Provide RISC-V builds for Linux (.zip)](https://github.com/dart-lang/sdk/issues/51843)
- [#52303 - No alpine riscv64 sysroot available for builds](https://github.com/dart-lang/sdk/issues/52303)
- [#54434 - simriscv32 build broken](https://github.com/dart-lang/sdk/issues/54434)
- [#55040 - float32x4_unbox_phi_test failing on riscv64](https://github.com/dart-lang/sdk/issues/55040)
- [#55623 - dartfuzz: instructions_riscv.cc unreachable code](https://github.com/dart-lang/sdk/issues/55623)
- [#56671 - Illegal instruction crash on StarFive VisionFive 2](https://github.com/dart-lang/sdk/issues/56671)
- [#57021 - riscv32 build is broken](https://github.com/dart-lang/sdk/issues/57021)
- [#59611 - il_riscv.cc fuzzer assertion failure](https://github.com/dart-lang/sdk/issues/59611)
- [#60164 - Cross-compilation error with -march=rv64gcv](https://github.com/dart-lang/sdk/issues/60164)
- [#60807 - Possible heap corruption on riscv64](https://github.com/dart-lang/sdk/issues/60807)
- [#63479 - int_bit_count_test failed on simriscv64](https://github.com/dart-lang/sdk/issues/63479)
- [#63480 - FFI not supported on SIMARM and SIMRISC](https://github.com/dart-lang/sdk/issues/63480)
- [#37299 - Support FFI on simulated architectures](https://github.com/dart-lang/sdk/issues/37299)
- [PR #51225 - Suppress sign-compare warnings for musl libc (landed then reverted)](https://github.com/dart-lang/sdk/pull/51225)
- [PR #52663 - Enhance Alpine Linux sysroot support](https://github.com/dart-lang/sdk/pull/52663)
- [PR #52680 - Add sysroot config for alpine linux riscv64](https://github.com/dart-lang/sdk/pull/52680)
- [PR #55255 - Update alpine sysroot](https://github.com/dart-lang/sdk/pull/55255)
- [PR #55875 - Install alpine riscv64 sysroot](https://github.com/dart-lang/sdk/pull/55875)
- [PR #56983 - Update Building-Dart-SDK-for-ARM-or-RISC-V.md (closed unmerged)](https://github.com/dart-lang/sdk/pull/56983)
- [Commit 57e1425b - Fix assembler shift ops (2026-09-08)](https://github.com/dart-lang/sdk/commit/57e1425bcff4bae7f2415ffe12795854a2ee16cc)
- [Commit 5b028586 - Revert popcount/ctz intrinsics (riscv regression)](https://github.com/dart-lang/sdk/commit/5b0285866d056e7406219f284c26c51712c8a6bd)
- [Commit f4857643 - Restore BoxLanesInstr::ComputeType (fixes #55040)](https://github.com/dart-lang/sdk/commit/f4857643e097790c4bc294c819cf665ff47bd895)
- [docs/Building-Dart-SDK-for-ARM-or-RISC-V.md](https://github.com/dart-lang/sdk/blob/main/docs/Building-Dart-SDK-for-ARM-or-RISC-V.md)
- [runtime/docs/riscv32.md](https://github.com/dart-lang/sdk/blob/main/runtime/docs/riscv32.md)
- [runtime/docs/qemu.md](https://github.com/dart-lang/sdk/blob/main/runtime/docs/qemu.md)
- [Dart 3.9 announcement blog](https://dart.dev/blog/announcing-dart-3-9)
- [dart.dev - dart compile documentation](https://dart.dev/tools/dart-compile)
- [flutter/flutter#117973 - Support for Android RISC-V](https://github.com/flutter/flutter/issues/117973)
- [leoafarias/fvm#969 - Download the right dart SDK for real RISC-V support](https://github.com/leoafarias/fvm/issues/969)
- [RISC-V Tech Hub - Language Runtimes wiki](https://wiki.riscv.org/display/HOME/Language+Runtimes)
- [RVspace forum - Requested Dart RISC-V builds, VisionFive 2](https://forum.rvspace.org/t/requested-dart-risc-v-builds/2405)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [Ubuntu package search - resolute suite](https://packages.ubuntu.com/search?keywords=Dart&suite=resolute&searchon=names&section=all)
- [PyPI - dart package JSON (unrelated squatted package)](https://pypi.org/pypi/dart/json)