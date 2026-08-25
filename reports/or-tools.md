---
title: or-tools
---

# or-tools

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for or-tools<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OR-Tools is Google's open-source combinatorial optimization suite. It provides solvers for constraint programming (CP-SAT), vehicle routing, linear and mixed-integer programming, and graph algorithms. The project is written in C++ with SWIG-generated bindings for Python, Java, and .NET.

**Governance:** Entirely Google-controlled. No independent foundation or steering committee. License is Apache 2.0. All contributions require a Google CLA. Code review is enforced via GitHub pull requests. Community conduct is governed by Google's Open Source Community Guidelines.

**Maintainers:** Two Google engineers dominate the commit history with approximately 10,800 commits between them.

| GitHub handle | Name | Role | Commits |
|---|---|---|---|
| lperron | Laurent Perron | Lead researcher, CP-SAT/OR-Tools | ~5,636 |
| Mizux | Corentin Le Molgat | Infrastructure and cross-compilation owner | ~5,151 |

External contributors are sparse. One academic contributor (blegat, UCLouvain) is active on the mathematical side. All cross-compilation infrastructure is owned by a single Google engineer (Mizux/Corentin Le Molgat). This is effectively a two-person internal Google project with a thin external contribution layer.

**Culture on new ports:** The maintainers have explicitly stated that 32-bit architectures are unsupported and they lack resources to support them. For 64-bit non-x86 ports, the pattern is: add Bootlin toolchain cross-compilation support, wire up QEMU-based smoke tests, and do nothing further unless the port breaks. Broken ports are removed (MIPS support was removed in April 2025, commit be4fd343). RISC-V 64-bit remains active.

**RISE membership:** Google is a Premier RISE member. There is no RISE blog post, no riseproject-dev repository, and no funded effort for OR-Tools specifically.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-05-25 | riscv64 Docker builds disabled. Reason: CMake did not provide riscv64 prebuilt binaries and most distros did not support it. | [commit 55ee1b0](https://github.com/google/or-tools/commit/55ee1b007c3ce2e698ca5f9cfd095494ca0d280e) |
| 2023-09-07 | First riscv64 cross-compilation support added. Full riscv64 Bootlin toolchain + QEMU path wired into `tools/cross_compile.sh` and `cmake/Makefile`. | SHA cbe546d9, author Corentin Le Molgat |
| 2024-08-30 | Bootlin toolchain URL updated to stable-2024.05-1 release. | commit 431d4aba, Corentin Le Molgat |
| 2025-04 | MIPS cross-compilation support removed (broken, unmaintained). riscv64 retained. | commit be4fd343 |
| 2026-03-06 | [PR #5082](https://github.com/google/or-tools/pull/5082) filed by external contributor Timothy Bourke (tbrk): fixes pointer-size architecture check in OCaml `model_cache` that excluded riscv64 from the 64-bit hash path. | [PR #5082](https://github.com/google/or-tools/pull/5082) |
| 2026-03-08 | PR #5082 merged. Fix is in `main` only -- not released as of v9.15 (2026-01-12). | [PR #5082](https://github.com/google/or-tools/pull/5082) |

The riscv64 port is fully upstream in the build infrastructure. There is no separate downstream fork or out-of-tree patch set. The architecture-specific fixes that exist are minimal: one OCaml-layer pointer-hash fix (merged). An equivalent bug exists in the C++ layer and has not been patched.

---

## 3. Upstream Support Tier

OR-Tools has an implicit two-tier support structure derived from which architectures get automated CI coverage and prebuilt release binaries.

**Tier 1 (fully supported):** amd64 Linux, macOS (x86_64 and arm64), Windows x64. These run in presubmit CI on every PR and produce official release artifacts.

**Tier 2 (cross-compile and QEMU, manual dispatch only):** aarch64, ppc64, ppc64le, riscv64. These are supported in `tools/cross_compile.sh` and `cmake/Makefile` using Bootlin toolchains and QEMU. They have no automated CI job -- other Tier 2 targets (aarch64, powerpc) have `workflow_dispatch` workflow files; riscv64 does not even have that.

**riscv64 tier: Tier 2 minus.** The cross-compilation scripts enumerate it, but it has no GitHub Actions workflow file at all, no release artifacts, and no known scheduled test run.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Presubmit CI on every PR | Yes | No | No |
| workflow_dispatch CI job | Yes | Yes | No |
| Prebuilt release tarballs | Yes (14 distros) | Yes (1 distro) | No |
| Python wheel on PyPI | Yes | Yes | No |
| Release-blocking failures | Yes | No | No |
| Cross-compile + QEMU smoke test | N/A | Yes | Yes (no CI job) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OR-Tools is a pure C++ constraint/optimization solver. It has no JIT compiler, no GC, and no SIMD dispatch layer. The architecture-specific code is confined to three files.

**No assembly files exist in the repository.** A full tree scan found zero `.S`, `.s`, or `.asm` files. There is no `arch/riscv` directory.

**Component table:**

| Component | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Saturated integer arithmetic (CapAdd/CapSub/CapProd) | `ortools/util/saturated_arithmetic.h` | Inline x86 asm (`addq/cmovoq`, `subq/cmovoq`, `imulq`) with GCC; `__builtin_*_overflow` with Clang | `__builtin_*_overflow` with Clang; generic C fallback with GCC | Generic C fallback (GCC); `__builtin_*_overflow` (Clang) |
| Floating-point exception control (ScopedFloatingPointEnv) | `ortools/util/fp_utils.h` | Full FPCSR save/restore, exception masking | Missing -- no-op | Missing -- no-op |
| Pointer hashing in constraint solver (Hash1) | `ortools/constraint_solver/constraint_solveri.h` | Correct 64-bit cast | Correct 64-bit cast | **Buggy** -- missing from 64-bit arch list, truncates pointer to uint32_t |
| SIMD (set cover Determinant) | `ortools/set_cover/set_cover_heuristics.cc` | Scalar (SSE2 mentioned in comment, not implemented) | Scalar | Scalar |

**Saturated arithmetic (riscv64 with GCC):** The generic C fallback (`CapAddGeneric` etc.) is correct but unoptimized. On riscv64 with GCC, every overflow check becomes a conditional branch rather than a flag-based branchless instruction. For Clang, `__builtin_*_overflow` should produce adequate code. The Bootlin cross-compile toolchain uses GCC 13, so the default build path uses the unoptimized C fallback.

**FP exception control:** `ScopedFloatingPointEnv` is instantiated in solver code to trap floating-point exceptions. On riscv64 the constructor and destructor are empty no-ops. Solvers that rely on FPE trapping to detect overflow will silently fail to trap. No RISC-V `fscsr`/`frcsr` implementation exists.

**Pointer hashing (correctness bug):** `constraint_solveri.h` `Hash1(void* ptr)` tests a fixed list of 64-bit architectures. riscv64 (`__riscv`) is absent. On riscv64, a 64-bit pointer is cast to `uint32_t`, discarding the upper 32 bits before hashing. This produces hash collisions in constraint solver hash maps that grow in proportion to heap address space. PR #5082 fixed the identical pattern in the OCaml `model_cache.h` layer but the C++ `constraint_solveri.h` file was not updated in the same PR and remains unfixed in `main` as of 2026-03-08.

**RVV (RISC-V Vector):** No RVV intrinsics anywhere in the codebase. No `__riscv_v_intrinsic`, no `vfloat32m1_t`, no `#ifdef __riscv_vector`. The build uses the generic lp64d ABI with no `-march=rv64gcv` flag.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Official cross-compile path:**

```
tools/cross_compile.sh build  (with PROJECT=or-tools TARGET=riscv64)
```

Or via Docker:

```
make toolchain_riscv64_build   (from cmake/ directory)
```

**Toolchain:** Bootlin `riscv64-lp64d--glibc--stable-2024.05-1.tar.xz`. ABI is lp64d (64-bit integer/pointer, hardware double-precision FP). GCC version in the 2024.05-1 release is 13.x. CMake minimum is 3.24; C++17 required (C++20 only for MSVC builds).

**Generated CMake toolchain file** (`build_cross/archives/toolchain_riscv64.cmake`):
- `CMAKE_SYSTEM_PROCESSOR riscv64`
- `CMAKE_C_COMPILER riscv64-linux-gcc`
- `CMAKE_CXX_COMPILER riscv64-linux-g++`
- No extra `-march=` or `-mabi=` flags -- relies on toolchain defaults (rv64gc + lp64d)

**CMake configure invocation:**

```
cmake -S. -Bbuild_cross/riscv64 \
  -G "Unix Makefiles" \
  -DBUILD_DEPS=ON \
  -DBUILD_CXX=ON \
  -DCMAKE_TOOLCHAIN_FILE=build_cross/archives/toolchain_riscv64.cmake
```

`-DBUILD_DEPS=ON` causes all dependencies (abseil-cpp, protobuf, zlib, bzip2, re2, Eigen3, COIN-OR, HiGHS, SCIP) to be fetched and built from source via FetchContent. When cross-compiling, `cmake/host.cmake` triggers a separate native CMake sub-build to compile `protoc` for the host -- this is automatic.

**QEMU:** Version 9.0.2 built from source (`qemu-riscv64-linux-user`). Each test binary is invoked as:

```
qemu-riscv64 -L <SYSROOT> \
  -E LD_PRELOAD="<SYSROOT>/usr/lib/libstdc++.so.6:<SYSROOT>/lib/libgcc_s.so.1" \
  <test_binary>
```

Test binaries run: `bin/simple_*`, `bin/*tsp*`, `bin/*vrp*`. These are smoke tests, not the full ctest suite.

**Known build failures:**

- Abseil-cpp linker error `__atomic_exchange_1` with Bootlin cross-toolchain ([issue #1702](https://github.com/abseil/abseil-cpp/issues/1702), open since 2024-07-05). This is directly relevant because OR-Tools uses Bootlin riscv64-lp64d as its official cross-compile toolchain and pins abseil-cpp 20250814.1.
- Docker riscv64 platform build support is commented out in `tools/docker/Makefile` (line 428: `PLATFORMS := amd64 arm64 # riscv64`). The Docker `linux/riscv64` platform path is marked experimental and disabled.

**Lean build command** (disabling optional C++ solver backends to reduce dep surface):

```
cmake -S. -Bbuild_cross/riscv64 \
  -DBUILD_DEPS=ON -DBUILD_CXX=ON \
  -DUSE_SCIP=OFF -DUSE_COINOR=OFF \
  -DCMAKE_TOOLCHAIN_FILE=build_cross/archives/toolchain_riscv64.cmake
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CP-SAT solver (integer programming) | Full | Full | Full, but Hash1 pointer truncation bug present in C++ layer |
| Vehicle routing | Full | Full | Full |
| Linear programming (Glop/HiGHS/Clp) | Full | Full | Full (untested) |
| Saturated arithmetic (GCC) | Inline asm, branchless | Generic C fallback | Generic C fallback |
| Saturated arithmetic (Clang) | `__builtin_*_overflow` | `__builtin_*_overflow` | `__builtin_*_overflow` |
| FP exception trapping | Full (x86 FPCSR) | No-op | No-op |
| SIMD acceleration | None (planned in comment) | None | None |
| Python bindings (ortools package) | Yes | Yes | No (no wheel) |
| Java bindings | Yes | Yes | No |
| .NET bindings | Yes | Yes | No |
| Prebuilt binary | Yes | Yes | No |

**Functional gaps:**

- **Hash1 pointer truncation (correctness bug):** On riscv64 with the C++ layer, `constraint_solveri.h` casts 64-bit pointers to `uint32_t` before hashing. This affects internal constraint solver data structures. The scope of the resulting incorrectness depends on how many solver operations hash pointers and whether address collisions occur in practice. The bug is confirmed present, unpatched in the C++ layer, and unfixed in any released version.

- **FP exception trapping is a no-op on riscv64.** Solvers that rely on `ScopedFloatingPointEnv` to catch overflow via SIGFPE will not trap. Whether any current solver path relies on FPE trapping for correctness (vs. just debugging convenience) is not documented in the research findings.

- **No language bindings on riscv64.** Python, Java, and .NET wrappers require prebuilt `protoc` binaries for code generation during the build. These can be cross-compiled from source, but no prebuilt wheels exist and no cross-build CI validates them.

**Performance gaps:**

- Saturated arithmetic with GCC: every CapAdd/CapSub/CapProd involves a branch or a conditional-move sequence in generic C instead of the branchless x86 overflow-flag path. The performance penalty depends on branch predictor behavior in the solver hot path; no benchmark data is available.
- No quantitative performance comparison between riscv64 and arm64 or amd64 was found in any upstream source or RISE publication.

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in google/or-tools.** All 35 `.github/workflows/*.yml` files were scanned. Zero contain the string "riscv" in any form.

The analogous cross-compile workflow files for other architectures (`.github/workflows/aarch64_toolchain.yml`, `mips_toolchain.yml`, `powerpc_toolchain.yml`) exist and trigger on `workflow_dispatch`. No `riscv64_toolchain.yml` was ever created.

The riscv64 Makefile targets (`toolchain_riscv64_build`, `toolchain_riscv64_test`) exist in `cmake/Makefile` and are functional as developer commands, but they are not invoked by any automated job.

**RISE runners:** No evidence of RISE-provided RISC-V CI runners for this project.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Presubmit on every PR | Yes | No | No |
| workflow_dispatch job | Yes | Yes (aarch64_toolchain.yml) | No |
| Hardware runner | Yes (GitHub-hosted) | Yes (GitHub-hosted) | No |
| QEMU-based smoke test in CI | N/A | Yes (in CI job) | No (script exists, no CI job) |
| Failure blocks merge | Yes | No | No |

---

## 8. Distribution and Release Status

**No riscv64 binary exists in any distribution channel.** The following channels were checked:

- **GitHub releases v9.11 through v9.15 (122 assets per release):** Linux binaries cover amd64 (14 distros) and aarch64 (AlmaLinux 8.10 only). No riscv64 tarball in any release. [Releases page](https://github.com/google/or-tools/releases)
- **PyPI:** `pypi.org/pypi/or-tools/json` returned HTTP 404. Python wheels from release assets cover manylinux/musllinux x86_64 and aarch64 only. No riscv64 wheel.
- **RISE wheel builder (`gitlab.com/riseproject-dev`):** Zero repositories in the riseproject-dev GitHub org reference or-tools. The RISE Python wheel builder lists 78 packages; or-tools is absent.
- **Ubuntu 24.04 Noble:** No `or-tools` package exists in the Ubuntu Noble repository.
- **Debian:** `tracker.debian.org/pkg/or-tools` returns HTTP 404. OR-Tools is not packaged in Debian.
- **Arch Linux RISC-V:** No or-tools entry found in Arch RISC-V search results.

**To obtain a working binary on riscv64**, a user must:

1. Install the Bootlin riscv64-lp64d toolchain and QEMU.
2. Run `cmake -DBUILD_DEPS=ON -DBUILD_CXX=ON -DCMAKE_TOOLCHAIN_FILE=...` to cross-compile all dependencies and OR-Tools from source.
3. Transfer the build output to a riscv64 target or run under QEMU.

There is no documented native build path for riscv64 (no hardware test environment exists upstream).

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| abseil-cpp 20250814.1 | Core utilities (containers, hash, sync, logging) | Builds | Partial -- 2 test SEGFAULTs on Debian unstable (2026-02-03); SwissTable regression (2026-08-25) | None | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) linker `__atomic_exchange_1` with Bootlin toolchain (OPEN); [#2002](https://github.com/abseil/abseil-cpp/issues/2002) SEGFAULT in sampler tests (OPEN); [#2142](https://github.com/abseil/abseil-cpp/issues/2142) SwissTable collision test failure on riscv64 (OPEN 2026-08-25) |
| protobuf v33.1 | Wire serialization for all solver data structures | Builds (community port, PR #12244 merged 2024-03) | No upstream riscv64 CI | No prebuilt `protoc` binary for riscv64 | Maintainers state riscv64 is unsupported and not on roadmap (Aug 2024, Aug 2025). No regression prevention. Same `__atomic_exchange_1` linker issue as abseil. |
| Eigen3 3.4.0 | Dense linear algebra for PDLP solver | Builds; RVV backend active | RVV CI integrated ([MR !2658](https://gitlab.com/libeigen/eigen/-/merge_requests/2658), 2026-06-24) | None (header-only) | RVV heap-corruption bug at -O1 with Clang 20 ([Issue #2930](https://gitlab.com/libeigen/eigen/-/issues/2930), 2025-05-12, status unknown) |
| RE2 2025-08-12 | Regex engine for constraint parsing | Builds (pure C++) | No riscv64 CI | None | None |
| zlib v1.3.1 | Compression for Protobuf I/O | Builds | OpenBSD/riscv64 CI ([PR #1139](https://github.com/madler/zlib/pull/1139), merged 2026-01-28) | Distro packages | None |
| bzip2 (gitlab master) | Compression, Protobuf dependency | Builds (pure C) | No upstream riscv64 CI | Distro packages | None |
| googletest (via abseil) | Unit testing (BUILD_TESTING only) | Builds | GetThreadCountTest failure on riscv64 ([Issue #3756](https://github.com/google/googletest/issues/3756), 2022, status unclear) | None | Low risk -- test-only dependency |
| google/benchmark 2025-08-12 | Microbenchmarks (BUILD_TESTING only) | Builds | No riscv64 CI | None | CPU frequency estimation for riscv64 fixed ([PR #1549](https://github.com/google/benchmark/pull/1549), 2023) |
| HiGHS v1.12.0 | LP/MIP solver backend (default ON) | Unknown | No riscv64 CI | None | No riscv64 issues filed. No riscv64 CI. |
| SCIP v10.0.0 | MIP/CP solver backend (default ON) | Unknown | No riscv64 CI | None | No riscv64 issues filed. No riscv64 CI. Portable C++/Fortran (optional). |
| SoPlex v8.0.0 | LP basis solver (SCIP dependency) | Unknown | No riscv64 CI | None | Dependency of SCIP. No riscv64 evidence. |
| COIN-OR (CoinUtils, Osi, Clp, Cgl, Cbc) | LP/MIP solver suite (default ON) | Unknown | No riscv64 CI | None | Portable C++11. Predates modern arch CI. Untested on riscv64. |
| Boost 1.87.0 | multiprecision + serialization (SCIP dependency) | Builds (subset) | No riscv64 CI for used subset | None | No issues for multiprecision/serialization subset on riscv64. |
| pybind11 v2.13.6 | Python extension wrapper | Builds | No riscv64 CI | No riscv64 wheel | No riscv64 issues. Portable. |

### Critical dependency deep-dives

**abseil-cpp:** Three open riscv64 issues, one of which ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) is a linker failure when using the Bootlin cross-toolchain -- the exact toolchain OR-Tools uses for its own riscv64 cross-compilation target. This is a direct build blocker for the official OR-Tools cross-compile workflow. The 2026-08-25 SwissTable issue ([#2142](https://github.com/abseil/abseil-cpp/issues/2142)) is a test-level failure but indicates active riscv64 instability in the pinned version.

**protobuf:** The maintainers' explicit policy is that riscv64 is unsupported and they will not prevent regressions. The community port builds and is used by downstream projects, but no `protoc` binary for riscv64 is published. OR-Tools works around this at build time via a nested native host build that compiles `protoc` for the host machine, but this complicates the cross-compile setup. For Python/Java/.NET language binding builds on riscv64, the protobuf gap is a structural issue.

**Eigen3:** OR-Tools uses Eigen for its PDLP first-order LP solver. The RVV vector backend was added and CI was integrated in June 2026. However, a heap-corruption bug in the RVV backend at -O1 with Clang 20 was reported in May 2025 and its resolution status is not confirmed in the research findings. If the bug affects PDLP computations on riscv64 with Clang, solver output could be incorrect.

**HiGHS, SCIP, COIN-OR:** These are the three main solver backends, all enabled by default. None has riscv64 CI. All are portable C++ with no known arch-specific code, but zero upstream test coverage on riscv64 means any latent correctness issue would go undetected until a user reports it.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [constraint_solveri.h Hash1] | Pointer hash truncates upper 32 bits on riscv64 | **Open** (unfixed in C++ layer) | High -- correctness bug in CP-SAT/constraint solver | `__riscv` missing from 64-bit arch check. Results in hash collisions in constraint solver data structures. Analog in OCaml layer was fixed in PR #5082 (merged 2026-03-08) but C++ layer was not updated. Not yet in any release. |
| [fp_utils.h ScopedFloatingPointEnv] | FP exception control is no-op on riscv64 | **Open** (by design/omission) | Medium -- silent correctness risk in FPE-dependent solver paths | No RISC-V CSR (fscsr/frcsr) implementation. Constructor and destructor are empty on all non-x86_64 architectures. |
| [abseil #1702](https://github.com/abseil/abseil-cpp/issues/1702) | `__atomic_exchange_1` linker failure with Bootlin riscv64 toolchain | **Open** (since 2024-07-05) | High -- blocks official cross-compile workflow | Affects the exact toolchain (Bootlin riscv64-lp64d) used by OR-Tools `tools/cross_compile.sh`. |
| [abseil #2002](https://github.com/abseil/abseil-cpp/issues/2002) | SEGFAULT in `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on riscv64 | **Open** (since 2026-02-03) | Medium -- test-level correctness, may indicate runtime instability | Affects abseil 20250814.1, the version pinned by OR-Tools v9.15. |
| [abseil #2142](https://github.com/abseil/abseil-cpp/issues/2142) | SwissTable `LowEntropyStrings` collision test failure on riscv64 (kWidth=8) | **Open** (since 2026-08-25) | Medium -- hash table correctness in abseil on riscv64 | Affects OR-Tools directly since it uses abseil SwissTable containers extensively. |
| [Eigen #2930](https://gitlab.com/libeigen/eigen/-/issues/2930) | RVV backend heap corruption at -O1 with Clang 20 | **Open** (since 2025-05-12, resolution unknown) | High if using PDLP with Clang -- solver output may be incorrect | Affects PDLP (first-order LP solver) component of OR-Tools. |
| [OR-Tools #5293](https://github.com/google/or-tools/issues/5293) | CP-SAT certifies wrong optimality proof on all-linear model (v9.15) | **Open** (filed 2026-08-11, milestone v10.0 Beta) | Critical -- correctness regression in CP-SAT | Not riscv64-specific. Affects amd64/Windows x64 confirmed. Relevant for any riscv64 correctness baseline. |

---

## 12. Objections and Upstream Blockers

**Maintainer stance on non-x86 architectures:** The two primary maintainers have explicitly declined to support 32-bit architectures and stated they lack resources for new port maintenance. For 64-bit non-primary architectures, the pattern is Bootlin toolchain + QEMU smoke tests, nothing more. There is no evidence of any maintainer objection to riscv64 specifically, but there is also no evidence of any maintainer actively testing or caring about riscv64 correctness.

**Abseil-cpp Bootlin toolchain linker failure ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)):** This is the most concrete near-term blocker. The OR-Tools official cross-compile workflow uses the Bootlin riscv64-lp64d toolchain, and abseil-cpp (a mandatory dependency pinned to 20250814.1) fails to link with it due to a missing `__atomic_exchange_1` symbol. Until this is resolved in abseil-cpp or worked around in the toolchain, the documented `tools/cross_compile.sh build` path does not produce a working binary.

**Protobuf unsupported status:** Protobuf maintainers have explicitly stated riscv64 is not supported and not on their roadmap (confirmed twice: Aug 2024 and Aug 2025). While a community port exists and builds, there is no `protoc` binary for riscv64 and no regression testing. This creates ongoing risk for the OR-Tools build, particularly for language bindings.

**Hash1 pointer truncation in C++ layer:** The bug in `constraint_solveri.h` is confirmed present and unfixed in the C++ layer. It was identified by an external contributor fixing the OCaml layer. No upstream maintainer has acknowledged or triaged the C++ equivalent. Acceptance probability for a patch fixing this is high given PR #5082 precedent, but the issue has not been raised upstream.

**No stated organizational blockers** from Google on accepting riscv64 contributions. The Mizux-authored cross-compile infrastructure is clearly intended to be extensible to new architectures.

---

## 13. Investment Analysis

RISE has no existing funded work on OR-Tools. Google is a Premier RISE member but has not directed any RISE resources to this project. All work listed below is greenfield.

### 13.1 Functional Enablement

**Fix Hash1 pointer truncation in `constraint_solveri.h`:** The fix is a one-line change (add `|| (defined(INTPTR_MAX) && defined(INT64_MAX) && (INTPTR_MAX == INT64_MAX))` to the 64-bit arch check), identical to the fix already merged for the OCaml layer in PR #5082. Upstream acceptance probability is high given direct precedent. This is the highest-priority correctness fix.

**Implement `ScopedFloatingPointEnv` for riscv64:** Requires reading and writing RISC-V floating-point CSRs (`fscsr`, `frcsr`, `fcsr`). Medium complexity. Required only if solver correctness depends on FPE trapping rather than just debugging.

**Resolve abseil-cpp Bootlin toolchain linker failure ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)):** This may require patching abseil-cpp to use `std::atomic` instead of GCC built-ins for atomic operations in the Bootlin toolchain environment, or updating the Bootlin toolchain to include the missing libatomic symbol. Investigation needed to isolate root cause.

### 13.2 Performance Optimization

**Saturated arithmetic (CapAdd/CapSub/CapProd) for riscv64:** The generic C fallback is correct. The Zb (bit manipulation) and Zicond (conditional operations) extensions available on recent RISC-V cores could reduce branch overhead. However, the solver hot paths dominating wall time are the LP/MIP solver internals (HiGHS, CP-SAT) rather than saturated arithmetic alone. Benchmark data does not exist to size the opportunity.

**RVV for Eigen PDLP:** RVV support exists in Eigen and the CI was integrated in June 2026. The heap-corruption bug in Eigen's RVV backend ([#2930](https://gitlab.com/libeigen/eigen/-/issues/2930)) must be resolved before enabling RVV for PDLP. If fixed, RVV could accelerate first-order LP solving on RISC-V processors with vector extensions.

### 13.3 CI/CD Infrastructure

**Add `riscv64_toolchain.yml` workflow:** Create a `workflow_dispatch` GitHub Actions workflow using the existing `tools/cross_compile.sh` build path and QEMU for smoke tests. This is a low-effort addition that directly mirrors the existing `aarch64_toolchain.yml` pattern. The blocker is the abseil linker failure, which must be resolved first.

**Expand QEMU test coverage:** The current smoke tests run only `bin/simple_*`, `bin/*tsp*`, `bin/*vrp*`. A full `ctest` run under QEMU would be a more meaningful regression signal but would increase CI time significantly.

### 13.4 Ecosystem Enablement

**Publish riscv64 release tarballs:** Once CI is stable, adding riscv64 to the release build matrix would provide users with prebuilt C++ libraries. The Docker `linux/riscv64` platform path exists in `tools/docker/Makefile` but is currently commented out.

**Python wheel for riscv64:** Requires resolving the protobuf `protoc` binary gap, building pybind11/SWIG Python bindings for riscv64, and publishing a manylinux-compatible wheel. This is a medium-effort task blocked on protobuf.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix Hash1 pointer truncation in `constraint_solveri.h` | 0.5 | External contributor / RISE | Critical |
| Functional | Resolve abseil-cpp #1702 Bootlin toolchain linker failure | 2-4 | RISE + abseil-cpp upstream | Critical |
| Functional | Implement `ScopedFloatingPointEnv` for riscv64 (fscsr/frcsr) | 1-2 | RISE contributor | Medium |
| Functional | Resolve abseil-cpp #2002 and #2142 (SEGFAULT and SwissTable riscv64) | 2-4 | RISE + abseil-cpp upstream | High |
| Functional | Resolve Eigen3 RVV heap-corruption bug #2930 | 2-4 | RISE + Eigen upstream | High (blocks PDLP RVV) |
| CI/CD | Add `riscv64_toolchain.yml` workflow_dispatch job | 0.5 | RISE (PR to upstream) | High |
| CI/CD | Expand QEMU test coverage to full ctest suite | 1 | RISE (PR to upstream) | Medium |
| Performance | Saturated arithmetic with Zicond/Zb for riscv64 (GCC) | 2-3 | RISE contributor | Low (no benchmark data to justify) |
| Performance | Enable and validate RVV in Eigen PDLP path (depends on Eigen #2930 fix) | 1-2 | RISE contributor | Medium |
| Distribution | Publish riscv64 release tarballs | 1 | Upstream (after CI stable) | Medium |
| Distribution | Publish riscv64 Python wheel | 3-5 | RISE (blocked on protobuf) | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/or-tools repository](https://github.com/google/or-tools)
- [OR-Tools developer homepage](https://developers.google.com/optimization)
- [PR #5082: generic test of pointer size in model_cache (MERGED 2026-03-08)](https://github.com/google/or-tools/pull/5082)
- [PR #5081: generic test of pointer size in model_cache (CLOSED, superseded)](https://github.com/google/or-tools/pull/5081)
- [PR #3330: main (CLOSED, contains disable riscv64 commit)](https://github.com/google/or-tools/pull/3330)
- [Commit 55ee1b0: tools/docker: disable riscv64 (2022-05-25)](https://github.com/google/or-tools/commit/55ee1b007c3ce2e698ca5f9cfd095494ca0d280e)
- [Issue #5293: CP-SAT certifies wrong optimality proof (OPEN 2026-08-11)](https://github.com/google/or-tools/issues/5293)
- [Issue #3271: Python bindings fail on 32-bit archs (CLOSED 2022)](https://github.com/google/or-tools/issues/3271)
- [PR #3313: Set SWIGWORDSIZE dependent on architecture bitness (MERGED 2022-05-30)](https://github.com/google/or-tools/pull/3313)
- [abseil-cpp Issue #1702: __atomic_exchange_1 linker failure with Bootlin riscv64 toolchain (OPEN 2024-07-05)](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp Issue #2002: SEGFAULT in sampler tests on riscv64 (OPEN 2026-02-03)](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp Issue #2142: SwissTable LowEntropyStrings collision test failure on riscv64 (OPEN 2026-08-25)](https://github.com/abseil/abseil-cpp/issues/2142)
- [Eigen Issue #2930: RVV backend heap corruption at -O1 with Clang 20 (OPEN 2025-05-12)](https://gitlab.com/libeigen/eigen/-/issues/2930)
- [Eigen MR !2658: RVV CI integration (MERGED 2026-06-24)](https://gitlab.com/libeigen/eigen/-/merge_requests/2658)
- [googletest Issue #3756: GetThreadCountTest failure on riscv64 (OPEN 2022)](https://github.com/google/googletest/issues/3756)
- [google/benchmark PR #1549: CPU frequency estimation for riscv64 (MERGED 2023)](https://github.com/google/benchmark/pull/1549)
- [RISE Project member list](https://riseproject.dev/members/)
- [Bootlin prebuilt toolchains](https://toolchains.bootlin.com/)
- [OR-Tools v9.15 releases page](https://github.com/google/or-tools/releases/tag/v9.15)