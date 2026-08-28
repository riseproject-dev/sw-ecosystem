---
title: Abseil-cpp
parent: Project Reports
categories:
  - libraries
---

# Abseil-cpp
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Abseil-cpp
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Abseil-cpp is Google's collection of C++ foundation libraries covering containers, strings, synchronization, hashing, CRC, random number generation, debugging utilities, and time. It is a direct extraction from Google's internal Piper monorepo. The current upstream release is `20260526.0` (May 2026).

**Governance:** Google Inc. holds sole copyright and sole merge authority. All changes originate in Google's internal Piper repository and are exported to GitHub via a Copybara-based synchronization process. The "Abseil Team" listed on commits is Google's internal C++ infrastructure team. External contributors submit GitHub PRs, but no external contributor has commit rights. PRs are only merged if an Abseil team member converts them to an internal Google CL, reviews them internally, and exports the result. PRs that lack internal adoption stall indefinitely.

**License:** Apache 2.0.

**Corporate sponsors:** Google Inc. exclusively.

**RISE Project membership:** None. No RISE blog post, working group, or funded engineering effort mentions Abseil-cpp.

**Community stance on new ports:** The governance model creates a structural barrier for community-contributed architecture ports. The 2024 RDCYCLE/RDTIME series (PRs [#1550](https://github.com/abseil/abseil-cpp/pull/1550), [#1631](https://github.com/abseil/abseil-cpp/pull/1631)) and the 2024-2025 warning-fix series (PRs [#1783](https://github.com/abseil/abseil-cpp/pull/1783), [#1788](https://github.com/abseil/abseil-cpp/pull/1788), [#1929](https://github.com/abseil/abseil-cpp/pull/1929)) illustrate the pattern: patches from community contributors are accepted only when a Google engineer champions them internally. Two of the three abandoned RDCYCLE PRs were never merged; the third was merged only after the Google reviewer decided to accept removal of the feature entirely (PR [#1644](https://github.com/abseil/abseil-cpp/pull/1644)). PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) (CRC32C hardware acceleration) is currently blocked waiting for a Google engineer to find RISC-V hardware for internal verification.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-02-21 | First RISC-V commit: `GetProgramCounter()` reads PC from signal context via `__gregs[REG_PC]`. Community contributor Khem Raj (OpenEmbedded). | [PR #621](https://github.com/abseil/abseil-cpp/pull/621) |
| 2021-08-19 | `stacktrace_riscv-inl.inc` added -- full RISC-V 32/64 call-stack unwinding (234 lines, modeled on AArch64 implementation). Contributed by Saleem Abdulrasool (compnerd), exported by the Abseil Team. | Abseil GitHub commit a05366d |
| 2021-09-10 | `UnscaledCycleClock` on RISC-V using RDCYCLE instruction added. | Abseil Team Copybara export |
| 2022-04-05 | Fix VDSO symbol name for unwinding on RISC-V Linux. | Abseil Team Copybara export |
| 2022-06-08 | Correct stack trace frame pointer walk on RISC-V. | compnerd via Abseil Team |
| 2022-07-29 | Bug filed: ILP32E ABI does not mandate 16-byte stack alignment; abseil assumes it does. | [Issue #1236](https://github.com/abseil/abseil-cpp/issues/1236) |
| 2022-07-29 | Honor `STRICT_UNWINDING` in RISC-V path. | compnerd via Abseil Team |
| 2022-08-04 | Handle alternate signal stacks on RISC-V. | compnerd via Abseil Team |
| 2024-03-22 | `UnscaledCycleClock` RISC-V implementation removed. Linux 6.6 made RDCYCLE privileged; RDTIME has no userland frequency API. RISC-V now uses `std::chrono::steady_clock` fallback. Google kept a private internal patch. | [PR #1644](https://github.com/abseil/abseil-cpp/pull/1644) |
| 2024-11-06 | Fix implicit signed-to-unsigned and precision-loss warnings in `stacktrace_riscv-inl.inc`. Motivated by V8 RISC-V strict-mode builds. | [PR #1783](https://github.com/abseil/abseil-cpp/pull/1783) |
| 2024-12-03 | Fix `-Wsign-conversion` in `stacktrace_riscv-inl.inc` ternary expression. | [PR #1788](https://github.com/abseil/abseil-cpp/pull/1788) |
| 2025-09-02 | Fix `-Wshorten-64-to-32` in `stacktrace_riscv-inl.inc`; motivated by Chromium warnings-as-errors policy on RISC-V. | [PR #1929](https://github.com/abseil/abseil-cpp/pull/1929) |
| 2025-12-25 | PR opened: hardware CRC32C acceleration for RISC-V via Zbc/Zbkc extensions. Under internal Google review. | [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) |
| 2026-02-03 | Bug filed: `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` SEGFAULT on Debian riscv64. Does not reproduce on Ubuntu riscv64. | [Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002) |

**Key contributors with affiliations:**

| Contributor | Affiliation | Contributions |
|---|---|---|
| Khem Raj (kraj) | OpenEmbedded/Yocto | Initial `GetProgramCounter()` RISC-V support |
| Saleem Abdulrasool (compnerd) | LLVM/ClangBuiltLinux | `stacktrace_riscv-inl.inc` full port, frame pointer and signal stack fixes |
| aurel32 | Debian | RDCYCLE/RDTIME PRs (abandoned/merged after negotiation) |
| apavlyutkin | Google (inferred from same-day merge) | Warning fixes for V8 RISC-V builds |
| luyahan | Community | Sign-conversion warning fix |
| kxxt | Community (Chromium/Arch context) | Shorten-64-to-32 warning fix |
| PeterPtroc | Community | CRC32C hardware acceleration PR (open) |

**Is it fully upstream?** The core RISC-V port (stack unwinding, GetProgramCounter) is fully upstream. Google maintains an internal-only patch restoring `UnscaledCycleClock` support (noted by reviewer derekmauro in PR [#1644](https://github.com/abseil/abseil-cpp/pull/1644)); this patch has not been exported. The CRC32C hardware acceleration (PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986)) is in internal Google review and has not been exported. Two open correctness bugs (#1702, #2002) have no upstream response.

---

## 3. Upstream Support Tier

**Formal tier policy:** Abseil follows Google's Foundational C++ Support Policy, documented at [google/oss-policies-info](https://github.com/google/oss-policies-info/blob/main/foundational-cxx-support-matrix.md). That matrix specifies supported Linux distributions and compiler versions only. No CPU architecture is mentioned. RISC-V does not appear in any official supported-platform document.

**Practical tier evidence:**

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI job | Yes (multiple: GCC/Clang, Bazel/CMake, ASAN, TSAN) | Yes (one: `linux_arm_clang-latest_libcxx_bazel.sh`) | No |
| Docker container defined in `ci/linux_docker_containers.sh` | Yes (`LINUX_CLANG_LATEST_CONTAINER`, `LINUX_GCC_LATEST_CONTAINER`, etc.) | Yes (`LINUX_ARM_CLANG_LATEST_CONTAINER`) | No |
| GitHub Actions workflows | None (Abseil uses Kokoro, internal to Google) | None | None |
| Release-blocking test failures | Yes | Yes (inferred from CI presence) | Not applicable (no CI) |
| Official binary releases via GitHub | No (source-only tarballs) | No | No |
| `StackTraceWorksForTest()` returns true | Yes | Yes | Yes |
| Mentioned in supported platforms doc | No explicit list | No explicit list | No explicit list |

RISC-V is an unsupported architecture: code exists and has been accepted, but there is no CI, no release-blocking gate, and no official binary. The project ships source only for all architectures.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Abseil-cpp has architecture-specific code in five subsystems: stack unwinding, program counter extraction, cycle clock, CRC32C, and the Randen PRNG (AES path). Each is analyzed below.

**Stack Unwinding (`absl/debugging/internal/stacktrace_riscv-inl.inc`)**

A dedicated 234-line RISC-V implementation following the RISC-V ELF psABI frame layout: `fp[-1]` is the return address, `fp[-2]` is the previous frame pointer. Uses `ucontext_t` register index `[8]` (x8/fp/s0) for signal context, per psABI Table 18.2. `StackTraceWorksForTest()` returns `true`. Selected via `stacktrace_config.h` on Linux + `__riscv` as the default unwinder, not the generic fallback. The three warning-fix PRs (#1783, #1788, #1929) driven by Chromium and V8 production builds confirm active use.

**Program Counter Extraction (`absl/debugging/internal/examine_stack.cc`)**

Dedicated `#elif defined(__riscv)` branch reads `context->uc_mcontext.__gregs[REG_PC]`. Added in PR [#621](https://github.com/abseil/abseil-cpp/pull/621) (2020). At parity with x86_64, aarch64, arm, powerpc64, and loongarch.

**Cycle Clock (`absl/base/internal/unscaledcycleclock.cc`)**

No RISC-V implementation. Linux 6.6 made `RDCYCLE` a privileged instruction by default (SIGILL in userspace unless kernel built without `CONFIG_RISCV_PMU_SBI`). RDTIME was considered but has no userland frequency API. PR [#1644](https://github.com/abseil/abseil-cpp/pull/1644) removed the RISC-V path. RISC-V now uses `std::chrono::steady_clock` -> `clock_gettime(CLOCK_MONOTONIC)` -> VDSO RDTIME. This is functionally correct but returns wall-clock nanoseconds rather than raw cycles.

FreeBSD keeps RDCYCLE accessible from userspace. Reviewer jrtc27 noted post-merge that the removal guard is `#if defined(__riscv)` without OS qualification, penalizing FreeBSD unnecessarily. The correct fix (`defined(__riscv) && defined(__linux__)`) has not been applied. [NEEDS VERIFICATION: whether internal Google patch restores a Linux-only guard or a full RDCYCLE implementation.]

**CRC32C Hardware Acceleration (`absl/crc/internal/`)**

No RISC-V implementation exists in the current codebase. The existing hardware paths cover x86 (PCLMUL) and ARM/AArch64 (PMULL/VMULL). PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) (opened 2025-12-25 by PeterPtroc) proposes a Zbc/Zbkc implementation using `clmul`/`clmulh` inline assembly with a folding approach. As of 2026-01-05, derekmauro converted it to an internal Google CL but the change is blocked on finding RISC-V hardware for internal verification. No further activity has been reported.

Benchmarks from PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) on a 64-core 2.6 GHz RISC-V system (software fallback vs Zbc hardware path):

| Benchmark | Software (ns or MiB/s) | Hardware (ns or MiB/s) | Speedup |
|---|---|---|---|
| BM_Calculate/500000 (latency) | 892,621 ns | 724,135 ns | 1.23x |
| BM_Extend/100000000 (latency) | 177,236,199 ns | 139,494,419 ns | 1.27x |
| BM_ExtendCacheMiss/100 (throughput) | 294.81 MiB/s | 476.85 MiB/s | 1.62x |
| BM_ExtendCacheMiss/1000 (throughput) | 502.45 MiB/s | 710.23 MiB/s | 1.41x |
| BM_ExtendCacheMiss/100000 (throughput) | 533.85 MiB/s | 681.29 MiB/s | 1.28x |

Note: these figures compare RISC-V software fallback against RISC-V hardware path only. No cross-architecture comparison data (riscv64 vs arm64 vs x86_64) is present in any source consulted.

**Randen PRNG / AES Path (`absl/random/internal/`)**

`platform.h` defines `ABSL_ARCH_RISCV` nowhere. `randen_detect.cc` checks for `ABSL_ARCH_X86_64`, PPC, ARM, and AARCH64 only. On RISC-V, `RandenHwAes` never activates; `randen_slow` (software path) is always used. The RISC-V Vector Cryptography extensions (Zvkned for AES-128-ECB, Zvkg for GF(2^128) multiply) could support the Randen hardware path, but no implementation or tracking issue exists.

**Integer Atomics**

RISC-V lacks native sub-word (byte/halfword) atomic instructions. GCC and Clang synthesize them using LR/SC word-width sequences, but this requires linking against `-latomic` when using sub-word atomic types in shared libraries. Abseil's logging internals (`absl_log_internal_globals`) use sub-word atomics. When building Abseil as a shared library on riscv64 with GCC 11-12, the result is undefined references to `__atomic_compare_exchange_1` and `__atomic_exchange_1` unless `-latomic` is explicitly added to the link line. Issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702) documents this. No upstream fix has been merged.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Stack unwinding | Hand-tuned (dedicated file) | Hand-tuned (dedicated file) | Hand-tuned (dedicated file) |
| GetProgramCounter | Dedicated `__x86_64` branch | Dedicated `__aarch64__` branch | Dedicated `__riscv` branch |
| Cycle clock | `rdtsc` inline asm | `cntvct_el0` inline asm | std::chrono fallback (RDCYCLE removed) |
| CRC32C hw accel | PCLMUL (x86-only) | PMULL/VMULL (AArch64) | Software fallback (PR #1986 pending) |
| AES / Randen hw path | AES-NI + SSE4 | NEON + ARMv8 crypto | Software fallback (randen_slow) |
| int128 | Compiler intrinsic | Compiler intrinsic | Compiler intrinsic |
| Sub-word atomics in .so | No extra link flags | No extra link flags | Requires -latomic (GCC 11-12) |
| Cache line size | 64 bytes (explicit constant) | 64 bytes (explicit constant) | 64 bytes (default fallback, no __riscv guard) |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Minimum toolchain versions** (from [Google Foundational C++ Support Policy](https://github.com/google/oss-policies-info/blob/main/foundational-cxx-support-matrix.md)):

| Tool | Minimum |
|---|---|
| GCC | 10 |
| Clang | 14.0.0 |
| CMake | 3.22 (policy doc); 3.16 (CMake/README.md) |
| C++ standard | C++17 |

No riscv64 toolchain file (`cmake/riscv64.cmake` or similar) is provided in the repository. No riscv64 Dockerfile exists in `ci/`.

**Standard native build (riscv64 host):**

```bash
cmake -S abseil-cpp -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -DABSL_ENABLE_INSTALL=ON \
  -DABSL_BUILD_TESTING=OFF
cmake --build build -j$(nproc)
cmake --install build
```

`-DABSL_BUILD_TESTING=OFF` is recommended because the test suite has two known SEGFAULT failures on Debian riscv64 (issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002)) and no riscv64 QEMU wrapper is provided.

**Cross-compilation from x86_64 host:**

No official toolchain file is provided. User must supply:

```cmake
# riscv64-toolchain.cmake (user-provided, not in repo)
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_SYSROOT /path/to/sysroot)
```

```bash
cmake -S abseil-cpp -B build \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -DABSL_ENABLE_INSTALL=ON \
  -DABSL_BUILD_TESTING=OFF \
  -DCMAKE_EXE_LINKER_FLAGS="-latomic" \
  -DCMAKE_SHARED_LINKER_FLAGS="-latomic"
```

The `-latomic` flags are required when using GCC 11-12 on riscv64 to avoid undefined references to `__atomic_exchange_1` and `__atomic_compare_exchange_1` in shared library builds. This may not be necessary with GCC 13+ or Clang.

**Bazel:** Abseil's CI uses Bazel. No `platforms/riscv64` target or toolchain configuration is present in the repository. Bazel cross-compilation for riscv64 requires a user-supplied platform and toolchain configuration.

**QEMU:** No official QEMU instructions or CMake wrapper are provided. Standard approach: install `qemu-user-static` and `binfmt-support` on the build host; binfmt_misc will transparently invoke `qemu-riscv64-static` for riscv64 ELF test binaries.

**Known build failures:**

- Undefined reference to `__atomic_exchange_1` / `__atomic_compare_exchange_1` with Bootlin riscv64 toolchain (GCC 11.3); workaround: `-latomic`. [Issue #1702](https://github.com/abseil/abseil-cpp/issues/1702), no upstream fix.
- Two test SEGFAULTs on Debian riscv64 with GCC 15.2 (hashtablez sampler, cordz sample token). Does not reproduce on Ubuntu riscv64. [Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002), no upstream response.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Stack unwinding | Full | Full | Full | None |
| GetProgramCounter (signal context) | Full | Full | Full | None |
| Cycle clock (raw cycles) | Full (rdtsc) | Full (cntvct_el0) | Missing | Performance: profiling disabled |
| CRC32C hardware acceleration | Full (PCLMUL) | Full (PMULL) | Missing (PR #1986 pending) | Performance |
| Randen PRNG hardware (AES path) | Full (AES-NI) | Full (ARMv8 crypto) | Missing | Performance: ~3x slower PRNG |
| ABSL_ARCH_* macro defined | Yes | Yes | No | Functional gap: AES hw path will never activate even when Zvkned is present |
| Cache line size explicit constant | Yes (64) | Yes (64) | Fallback (64, same value but no `__riscv` guard) | Minor |
| int128 | Compiler intrinsic | Compiler intrinsic | Compiler intrinsic | None |
| Sub-word atomics in .so | No extra flags | No extra flags | -latomic required (GCC 11-12) | Build friction |

**Functional gaps:**

- No `ABSL_ARCH_RISCV` macro. Even when a future RISC-V system has Zvkned, the Randen hardware AES path will never activate without adding this macro and a corresponding detection call in `randen_detect.cc`.
- Cycle clock missing: any Abseil subsystem that depends on `UnscaledCycleClock` for high-resolution timing (internal use by profilers, some spinlock back-off implementations) degrades to `clock_gettime(CLOCK_MONOTONIC)` on RISC-V. This is a correctness degradation for profiling tools, not for correctness of computation.

**Performance gaps:**

- Randen PRNG: software path is approximately 3x slower than the hardware AES path. No benchmark data from the research findings; 3x figure is from the Abseil documentation citing randen_slow vs randen_hwaes. [NEEDS VERIFICATION: exact ratio on riscv64 hardware.]
- CRC32C: software fallback vs Zbc hardware path, measured at 1.23x-1.62x speedup depending on payload size (from PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) benchmarks).

**NaN / floating-point issues:**

Issue [#1684](https://github.com/abseil/abseil-cpp/issues/1684) (closed): `FloatingPointLogFormatTest/0.NegativeNaN` failed under GCC 14 and Clang 18 on riscv64 Fedora because RISC-V hardware canonicalizes NaN sign bits. Debian and Fedora patched locally; the issue was resolved upstream (test disabled or fixed). No open floating-point correctness bugs remain.

---

## 7. CI/CD Infrastructure

**Summary:** No riscv64 CI exists in abseil/abseil-cpp. This is confirmed by direct inspection of every CI configuration file in the repository.

**Evidence:**

- `.github/workflows/` does not exist. The `.github/` directory contains only `ISSUE_TEMPLATE/` and `PULL_REQUEST_TEMPLATE.md`. There are zero GitHub Actions YAML files.
- `ci/linux_docker_containers.sh` defines containers for: x86_64 (multiple GCC/Clang variants), Alpine (unspecified arch), and AArch64 (`LINUX_ARM_CLANG_LATEST_CONTAINER`). No RISC-V container is defined.
- 18 files total in `ci/`. None is named `*riscv*`.
- No `.cirrus.yml`, `.gitlab-ci.yml`, or `Jenkinsfile` (HTTP 404 confirmed for each).
- Abseil uses Google Kokoro for CI, invoked via the shell scripts in `ci/`. Kokoro is internal to Google; the shell scripts are the authoritative entry points. None targets riscv64.

**Comparison:**

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes (multiple) | Yes (one) | No |
| CI system | Google Kokoro | Google Kokoro | N/A |
| Publicly observable CI | No | No | No |
| GitHub Actions | No | No | No |
| RISE CI runners | No | No | No |
| Test results visible | No (internal) | No (internal) | N/A |

**RISE involvement in CI:** None. RISE's CI infrastructure (GitHub-hosted runners at RISE) is not used by abseil/abseil-cpp.

---

## 8. Distribution and Release Status

**GitHub Releases:** Source-only tarballs (`.tar.gz`, `.zip`). Latest: `20260526.0`. No binary assets. No riscv64-specific artifacts.

**Ubuntu:**

| Release | Package | Version | riscv64 |
|---|---|---|---|
| 22.04 LTS (Jammy) | libabsl-dev | 0~20210324.2-2 | Yes (ports archive) |
| 24.04 LTS (Noble) | libabsl-dev | 20220623.1-3.1ubuntu3 | Yes (ports archive) |
| 25.10 (Questing) | libabsl-dev | 20240722.0-4ubuntu1 | Yes (main archive) |
| 26.04 LTS (Resolute) | libabsl-dev | 20260107.0-4 | Yes |

From Ubuntu 25.10 onward, riscv64 is in the main Ubuntu archive, not the ports archive.

**Debian:**

`libabsl-dev` version `20260107.0-5` is installed on Debian sid for riscv64, built on `rv-osuosl-02`. The package builds and installs. However, [Debian bug #1126886](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886) (severity: important) documents two test SEGFAULTs on riscv64 (see Section 11). The package migrated to testing because the maintainer downgraded severity from serious to important.

**Arch Linux riscv64 (archriscv.felixc.at):** Data not available: the search URL returned HTTP 404 during research; no data confirming or denying availability was retrieved.

**Fedora/Koji:** Data not available: access blocked by Anubis bot protection during research.

**PyPI:** No `abseil-cpp` package on PyPI (404). The Python Abseil library is `absl-py`, a separate project.

**To get a working riscv64 binary today:** Install `libabsl-dev` from Ubuntu 24.04 ports, Ubuntu 25.10+ main, or Debian sid. Build from source for toolchains requiring `-latomic` or for versions newer than what distributions carry. Note that distribution packages lag upstream by months to years (Debian sid carries `20260107.0` vs upstream `20260526.0`).

---

## 9. Dependencies

Abseil-cpp is nearly self-contained. Runtime dependencies are minimal. Test dependencies are build-time only.

**Dependency table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| pthreads (glibc) | Threading primitives | Pass | Pass | Shipped | glibc riscv64 support is mature. |
| GoogleTest | Test framework (test-only, not runtime) | Pass | Pass | Shipped | No known riscv64-specific issues. |

**Downstream projects depending on Abseil-cpp** (within scope of this repository):

| Project | Relationship | Known riscv64 impact |
|---|---|---|
| Protocol Buffers | Direct dependency (merged protobuf 3.22+) | [Issue #1561](https://github.com/abseil/abseil-cpp/issues/1561): riscv64 build failure reported (closed); the `-latomic` and AES-fallback gaps propagate. |
| gRPC | Depends on abseil and protobuf | Inherits atomics and AES-fallback gaps. |
| Envoy | Uses abseil, gRPC, protobuf | Inherits all riscv64 gaps. |
| LiteRT (TFLite) | Uses abseil via flatbuffers/proto | May be affected by hashtablez sampler SEGFAULT in debug builds. |
| sentencepiece | Direct abseil dependency | Inherits Randen slow path and missing cycle clock. |

There are no JIT backends, GPU paths, or deep numeric dependency chains in abseil-cpp.

---

## 11. Known Bugs and Active Issues

**Open issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2002](https://github.com/abseil/abseil-cpp/issues/2002) | `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` SEGFAULT on riscv64 | Open | High | Debian riscv64 only; GCC 15.2, CMake 4.2.3, abseil 20260107.0. Ubuntu riscv64 passes. Filed 2026-02-03. No upstream response. Forwarded as [Debian bug #1126886](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886). |
| [#1702](https://github.com/abseil/abseil-cpp/issues/1702) | Can't link using riscv64 toolchain -- undefined `__atomic_exchange_1`, `__atomic_compare_exchange_1` | Open | High | Bootlin riscv64 GCC 11.3 cross-toolchain, Abseil 20240116.2 via Protobuf. Missing `-latomic`. No upstream response. Filed 2024-07-05. |
| [#1236](https://github.com/abseil/abseil-cpp/issues/1236) | RISCV ILP32E does not mandate 16-byte stack alignment | Open | Low | Stack-walk code assumes 16-byte alignment. ILP32E ABI does not guarantee it. Embedded-only use case. No activity since 2022-07-29. |
| [#1986](https://github.com/abseil/abseil-cpp/pull/1986) | RISC-V hardware CRC32C acceleration (Zbc/Zbkc) | Open PR | Medium (performance) | Under internal Google review since 2026-01-05. Blocked on hardware availability for verification. No further activity since Jan 2026. |

**Closed issues (resolved, relevant context):**

| ID | Title | Resolution |
|---|---|---|
| [#1644](https://github.com/abseil/abseil-cpp/pull/1644) | `UnscaledCycleClock` RISC-V support removed | Merged 2024-03-22. Linux 6.6 RDCYCLE privilege issue. RISC-V uses std::chrono fallback. |
| [#1684](https://github.com/abseil/abseil-cpp/issues/1684) | NegativeNaN test fails on riscv64 | Fixed/disabled upstream. RISC-V hardware canonicalizes NaN sign bits. |
| [#1561](https://github.com/abseil/abseil-cpp/issues/1561) | riscv64 Protobuf build fails due to abseil | Closed; root cause (atomics linking) remains unfixed upstream. |

**Correctness bugs (distinct from performance gaps):**

1. [#2002](https://github.com/abseil/abseil-cpp/issues/2002): Two test SEGFAULTs on Debian riscv64. The affected subsystems (hashtablez sampler, cordz sample token) are internal telemetry/sampling, not core library operations. Production code that does not exercise these sampling code paths is not affected. However, the SEGFAULT is a correctness defect and has no upstream response after 4+ months.
2. [#1702](https://github.com/abseil/abseil-cpp/issues/1702): Linker failure for shared library builds. Correctness defect that prevents deployment entirely for consumers using `FetchContent` or shared library builds on GCC 11-12 riscv64 toolchains. No upstream fix after 12+ months.

---

## 12. Objections and Upstream Blockers

**Structural blocker: Google internal adoption requirement.** Every code change must be adopted and tested internally by Google before it lands on GitHub. Community patches that Google has not internally adopted stall or are closed. This is not a stated policy objection -- it is the operating model. The three warning-fix PRs (#1783, #1788, #1929) each took 0-15 days because Google had internal RISC-V build consumers (V8, Chromium). PRs without internal adoption (aurel32's RDTIME fix #1631, marv's RDCYCLE fix #1550) were closed after months.

**PR #1986 (CRC32C):** Internally adopted by derekmauro on 2026-01-05 but blocked on hardware access for verification. The bottleneck is not engineering willingness but Google's internal access to RISC-V hardware for CI/verification. This is solvable.

**Issue #1702 (atomics linker failure):** No Google-internal consumer of abseil shared libraries on riscv64 has surfaced, so the bug has no internal priority. This will not self-resolve unless a team proposes the `-latomic` fix internally.

**Issue #2002 (SEGFAULT on Debian):** No upstream response in 4+ months. Likely low internal priority because the failure is Debian-specific and does not affect Google's internal riscv64 builds. Investigation requires access to the Debian riscv64 build environment.

**Issue #1236 (ILP32E):** No activity in 4 years. ILP32E targets are embedded-only and not a focus for Google or any identified contributor. Low probability of resolution without an external champion.

**No stated objection to riscv64 as an architecture.** Maintainer derekmauro has accepted every RISC-V patch that cleared Google's internal review. The blocker is internal resource availability, not opposition to the port.

---

## 13. Investment Analysis

RISE has no prior investment in Abseil-cpp. All RISC-V work to date has been community-driven without coordinated external funding.

### 13.1 Functional Enablement

**Fix atomics linker failure (issue #1702):** Add `-latomic` to CMake shared library link flags for riscv64, guarded by architecture and compiler checks. The fix is straightforward CMake. The bottleneck is getting it through Google's internal review. Requires: identify an internal Google adopter or work through an existing Abseil team contact to champion internally.

**Fix hashtablez/cordz SEGFAULT on Debian riscv64 (issue #2002):** Reproduce the crash, bisect to toolchain or environment difference (GCC 15.2 vs GCC 14, CMake version, or Debian-specific linker flags), and submit a fix or upstream test condition. Potentially a GCC 15 ABI or stack-alignment issue specific to the sampling subsystem.

**Add `ABSL_ARCH_RISCV` macro:** One-line addition to `absl/random/internal/platform.h` and corresponding detection in `randen_detect.cc`. Prerequisite for any future hardware AES/Zvkned path, and corrects cache-line-size detection for architectures with non-64-byte lines. Low internal risk.

### 13.2 Performance Optimization

**Merge PR #1986 (CRC32C Zbc/Zbkc):** The PR is already internally queued at Google. The only stated blocker is hardware availability for verification. Providing access to a 2.6 GHz+ riscv64 board (SpacemiT K1, T-Head TH1520, or equivalent) to derekmauro's team would directly unblock this. Expected gain: 1.23x-1.62x CRC32C throughput once Zbc is present in hardware.

**Randen PRNG hardware path via Zvkned:** Add `ABSL_ARCH_RISCV` detection in `randen_detect.cc` + `randen_hwaes_impl.cc` RISC-V variant using `vaeskf1`, `vaeskf2`, `vaesef` RVV-Crypto intrinsics. Requires a target with Zvkned extension. No benchmark data available from any source. This is new engineering work with no existing PR.

**Restore `UnscaledCycleClock` for non-Linux (FreeBSD) or via alternate mechanism:** The jrtc27 post-merge comments on PR [#1644](https://github.com/abseil/abseil-cpp/pull/1644) describe the correct fix. Scoped to FreeBSD only; low priority for most Linux deployments.

### 13.3 CI/CD Infrastructure

**Add riscv64 CI container to `ci/linux_docker_containers.sh`:** This requires Google Kokoro access, which is not externally available. GitHub Actions are not used by Abseil at all. Realistically, riscv64 CI for abseil-cpp requires either Google enabling it internally (most likely path) or a community fork with a GitHub Actions workflow. RISE could contribute a GitHub Actions workflow running on RISE-hosted riscv64 runners, but this would be a community CI fork, not the upstream Kokoro CI that gates releases.

### 13.4 Ecosystem Enablement

Not applicable. Abseil-cpp is a C++ library with no dependent package ecosystem requiring separate enablement (no PyPI wheels, no npm packages, no Maven JARs).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix atomics linker failure on riscv64 (issue #1702) | 1 (code) + 3 (Google internal advocacy) | Abseil team contact required | Critical |
| Functional | Reproduce and fix hashtablez/cordz SEGFAULT on Debian riscv64 (issue #2002) | 2-4 (bisect + fix) | Community contributor with riscv64 Debian access | High |
| Functional | Add ABSL_ARCH_RISCV macro and cache-line detection | 0.5 | Community + Abseil team | High |
| Performance | Provide RISC-V hardware access to Google team to unblock PR #1986 (CRC32C) | 0 engineering (hardware provision only) | RISE infrastructure / SiFive / SpacemiT | High |
| Performance | Randen PRNG Zvkned hardware path | 4-6 (new implementation + benchmarks) | Abseil team or community with Zvkned hardware | Medium |
| Performance | Restore UnscaledCycleClock for FreeBSD riscv64 | 1 | Community contributor | Low |
| CI/CD | GitHub Actions riscv64 workflow on RISE runners | 2 (workflow YAML + infra) | RISE + community | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [abseil/abseil-cpp GitHub repository](https://github.com/abseil/abseil-cpp)
- [PR #621: Add RISCV support to GetProgramCounter()](https://github.com/abseil/abseil-cpp/pull/621)
- [Issue #1236: RISCV ILP32E does not mandate 16-byte alignment for stack](https://github.com/abseil/abseil-cpp/issues/1236)
- [Issue #1561: Riscv build of Protobuf fails due to abseil](https://github.com/abseil/abseil-cpp/issues/1561)
- [PR #1550: Replace rdcycle instruction with rdtime](https://github.com/abseil/abseil-cpp/pull/1550)
- [PR #1631: unscaledcycleclock: use RDTIME instead of RDCYCLE on RISC-V](https://github.com/abseil/abseil-cpp/pull/1631)
- [PR #1644: unscaledcycleclock: remove RISC-V support](https://github.com/abseil/abseil-cpp/pull/1644)
- [Issue #1684: NegativeNaN test fails on riscv64](https://github.com/abseil/abseil-cpp/issues/1684)
- [Issue #1702: Can't link using riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [PR #1783: Fix few warnings in RISC-V inlines](https://github.com/abseil/abseil-cpp/pull/1783)
- [PR #1788: Fix warning for sign-conversion on riscv](https://github.com/abseil/abseil-cpp/pull/1788)
- [PR #1929: Fix shorten-64-to-32 warning in stacktrace_riscv-inl.inc](https://github.com/abseil/abseil-cpp/pull/1929)
- [PR #1986: absl/crc: Add RISC-V hardware acceleration for CRC32C](https://github.com/abseil/abseil-cpp/pull/1986)
- [Issue #2002: Segfault in absl_hashtablez_sampler_test and absl_cordz_sample_token_test on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [Debian bug #1126886: abseil fails two tests on riscv64](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886)
- [Debian buildd tracker: abseil (sid)](https://buildd.debian.org/status/package.php?p=abseil&suite=sid)
- [Ubuntu packages: libabsl-dev noble](https://packages.ubuntu.com/search?keywords=libabsl&suite=noble&searchon=names)
- [Google Foundational C++ Support Policy matrix](https://github.com/google/oss-policies-info/blob/main/foundational-cxx-support-matrix.md)
- [Abseil homepage](https://abseil.io/)