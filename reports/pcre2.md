---
title: PCRE2
categories:
  - libraries
---

# PCRE2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for PCRE2
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

PCRE2 (Perl Compatible Regular Expressions, version 2) is a C library implementing Perl-compatible regex syntax. It is the de facto standard regex engine for C programs and is embedded directly in CPython, PHP, Ruby (as an option), R, grep utilities, and dozens of other widely deployed systems.

**Governance.** PCRE2 has no foundation, no corporate membership structure, and no formal governance bylaws. Decisions are made via GitHub Issues, pull requests, and the `pcre2-dev@googlegroups.com` mailing list. The project is community-driven and volunteer-operated.

The project transitioned in 2024 from single-author maintenance (Philip Hazel, who created PCRE in 1997) to a two-administrator model. Both are explicitly described in `AUTHORS.md` as "volunteers acting in a personal capacity":

| Maintainer | Affiliation (personal capacity) | Responsibilities |
|---|---|---|
| Nicholas Wilson (NWilson) | Microsoft Research Cambridge, UK | Administration, releases, code |
| Zoltan Herczeg (zherczeg) | University of Szeged, Hungary | Code maintenance, sljit/JIT ownership |

Corporate affiliations are disclosed for transparency. Neither Microsoft nor the University of Szeged is a named sponsor or exercises governance. There are no corporate sponsors listed anywhere in the project.

**License.** BSD 3-clause with a PCRE2 Exception.

**RISE membership.** PCRE2 and the PCRE2Project organization are not members of the RISE project. The RISE blog (27 posts from May 2024 through June 2026) contains zero mentions of PCRE2. The RISE GitLab API confirms `total_count: 0` repositories under `riseproject-dev` matching "PCRE2". The RISE wheel builder (76 packages listed) does not include PCRE2.

**Community stance on new ports.** There is no documented formal tier policy. New architectures are accepted when a contributor submits a working implementation. The riscv64 CI job was added by Nicholas Wilson on 2025-01-11 at the explicit request of the sljit author, with the YAML comment "the Next Big Thing(tm)". This reflects a positive but opportunistic posture - riscv64 is welcome but not strategically driven.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-30 | [Issue #14](https://github.com/PCRE2Project/pcre2/issues/14) opened: "Add support for the RISC-V architecture". Assigned to zherczeg. | GitHub |
| 2022-04-29 | Commit `fb55788d` in `zherczeg/sljit`: "Initial implementation of RISC-V port" (integer operations only). Author: Zoltan Herczeg, University of Szeged. | GitHub (sljit) |
| 2022-05-07 | Commit `1f32a9f2` in `zherczeg/sljit`: FPU operations for RISC-V. Author: Zoltan Herczeg. | GitHub (sljit) |
| 2022-07-14 | sljit RISC-V backend synced into PCRE2 via "JIT compiler update" commit `b67d568`. JIT available on riscv64 from this point. Zherczeg note: "only tested with qemu, so there might be cache flush issues." | GitHub |
| 2022-11-08 onward | Continued sljit RISC-V improvements: `return_to`, `shift_into`, rotate, `ctz/clz`, soft-float ABI handling (contributed by Carlo Marcelo Arenas Belon). | GitHub (sljit) |
| 2022-12 | PCRE2 10.41 released with RISC-V JIT. State at release: no compressed instructions, no vector extensions, hard-float assumed. | GitHub releases |
| 2023-01-18 | Fedora builders confirmed `pcre2_jit_test` passes on real riscv64 hardware on 10.42. [Issue #14](https://github.com/PCRE2Project/pcre2/issues/14) closed. | GitHub |
| 2024-06 | Initial SIMD (V-extension) support added to sljit RISC-V backend. Commit `06a5baf`. | GitHub (sljit) |
| 2024-07 | Atomics rework (`8bcd711`). Only enable SIMD if system supports it ([sljit PR #260](https://github.com/zherczeg/sljit/pull/260)). | GitHub (sljit) |
| 2024-11-30 | [PR #583](https://github.com/PCRE2Project/pcre2/pull/583) merged: JIT compiler update migrating to SLJIT_ENTER_VECTOR. Reviewer carenas raised RISC-V SIMD crash concern; no direct response given. | GitHub |
| 2025-01-11 | [PR #663](https://github.com/PCRE2Project/pcre2/pull/663) merged: RISC-V added to PCRE2 CI multiarch matrix, at zherczeg's explicit request. Commit `971de5f`. | GitHub |
| 2025-01 | sljit RVC (compressed instruction) support: 5 PRs merged ([#290](https://github.com/zherczeg/sljit/pull/290), [#291](https://github.com/zherczeg/sljit/pull/291), [#293](https://github.com/zherczeg/sljit/pull/293), [#294](https://github.com/zherczeg/sljit/pull/294), [#295](https://github.com/zherczeg/sljit/pull/295)) between Jan 16-24, 2025. | GitHub (sljit) |
| 2025-01-07 | [sljit PR #284](https://github.com/zherczeg/sljit/pull/284): fix `sljit_emit_simd_sign` for RISC-V (correctness bug in SIMD sign emission). | GitHub (sljit) |
| 2025-02-05 | PCRE2 10.45 released. First release containing both PR #583 and PR #663. | GitHub releases |
| 2025-10-26 | [Issue #831](https://github.com/PCRE2Project/pcre2/issues/831) opened: `-march=rv64gcb_zicond` causes pcre2_test failure on SpacemiT X60. Reproduced with GCC 15.2.0 and Clang 21.1.4. Root cause: `VERSION_SIZE 64` buffer overflow in pcre2test.c when B+Zicond generate a long arch identifier string. | GitHub / [Gentoo bug 964425](https://bugs.gentoo.org/964425) |
| 2025-10-30 | [PR #835](https://github.com/PCRE2Project/pcre2/pull/835) merged: dynamically allocate JITTARGET buffer. [PR #836](https://github.com/PCRE2Project/pcre2/pull/836) merged 2025-11-01: remove `VERSION_SIZE` entirely. Issue #831 closed. | GitHub |
| 2025-10-31 | Gentoo bug 964425 resolved: `profiles/arch/riscv/package.use.mask` updated to unmask the `jit` USE flag. Backported as `libpcre2-10.47-riscv.patch`. | [Gentoo Bugzilla](https://bugs.gentoo.org/964425) |
| 2025-12-09 | [sljit PR #350](https://github.com/zherczeg/sljit/pull/350): Improve overflow check on RISC-V (correctness fix with code-size impact). | GitHub (sljit) |

**Is the port fully upstream?** Yes. All RISC-V support is in the upstream repository. The sljit submodule is vendored directly in `deps/sljit`. There are no downstream-only patches required for standard rv64gc hardware.

**Key contributors.** Zoltan Herczeg (University of Szeged) authored the initial port and all major sljit RISC-V work. Carlo Marcelo Arenas Belon contributed soft-float ABI handling and post-PR #831 buffer fix work. Nicholas Wilson (Microsoft Research) added riscv64 to CI.

---

## 3. Upstream Support Tier

There is no documented formal tier policy. Support is inferred from observable behavior.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI on every push | Yes (`build.yml`, native runner) | Yes (macOS ARM runner, native) | Yes (QEMU, `dev.yml` `ptarmigan` job) |
| CI on every pull request | Yes | Yes | No (push and workflow_dispatch only) |
| CI hardware | Native x86_64 runner | Native macOS ARM runner | QEMU on x86_64 host |
| Release-blocking | Yes (implicit) | Yes (implicit) | No (separate workflow, not gating) |
| Official upstream binaries | No (source-only releases) | No | No |
| JIT enabled | Yes | Yes | Yes |
| SIMD fast-path in PCRE2 | Yes (SSE2) | Yes (NEON) | No (scalar fallback; see Section 4) |

The riscv64 tier is below amd64 and arm64 on two dimensions: CI does not run on pull requests, and the PCRE2-layer SIMD dispatch does not include RISC-V. For a library that ships source only and whose primary consumers are Linux distributions, this tier difference is not blocking deployment - it does mean that a RISC-V regression in a pull request can merge without CI feedback until the next push.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

PCRE2's performance-critical path has two layers:

1. **SLJIT JIT engine** (`deps/sljit`): generates native code at runtime for the regex match loop. This is where all architecture-specific work lives.
2. **SIMD fast-path dispatcher** (`src/pcre2_jit_simd_inc.h`): character-scan routines (`fast_forward_char_simd`, `fast_requested_char_simd`, `fast_forward_char_pair_simd`) that use SIMD intrinsics outside the JIT path, dispatched by a compile-time architecture guard.

### 4.1 SLJIT JIT Backend

SLJIT detects riscv64 via `__riscv_xlen == 64` and sets `SLJIT_CONFIG_RISCV_64`. The RISC-V backend is implemented in three files under `deps/sljit/sljit_src/`:

| File | Lines | Scope |
|---|---|---|
| `sljitNativeRISCV_common.c` | ~4,865 | Main implementation: register maps, instruction encoding, code generation |
| `sljitNativeRISCV_64.c` | 291 | RV64-specific: 64-bit immediate loading, `sljit_emit_fset64`, `sljit_set_jump_addr` |
| `sljitNativeRISCV_32.c` | ~115 | RV32-specific thin layer |

For size reference: the x86 common file is ~5,445 lines / 158 KB; the RISC-V common file is ~4,865 lines / 160 KB. This is a production-quality implementation, not a stub.

**Per-component status:**

| Component | ISA extensions | riscv64 quality | amd64 quality | arm64 quality |
|---|---|---|---|---|
| Core integer (load/store/branch/arith) | RV64I | Full - hand-written, complete | Full | Full |
| Float/double | F/D extensions | Full - `sljit_emit_fset64`, FPU macros | Full | Full |
| Compressed instructions (code density) | RVC (C extension) | Full - 5 dedicated PRs, Jan 2025 | N/A | N/A |
| Bit manipulation | Zba, Zbb, Zicond | Full - hardware path + software fallback for each | Full (BMI2 etc.) | Full (ARM bitfield insns) |
| Atomics | A extension | Full - LR/SC, reworked Jun 2024 | Full | Full |
| SIMD (JIT vector ops) | V extension | Full in sljit (initial Jun 2024, fixed Jan 2025) | Full (SSE2/AVX) | Full (NEON/SVE) |
| Memory fence | Zifencei | Full (Aug 2024) | Full | Full |
| Code shrinking / jump opt | RVC branches | Full - `reduce_code_size` active | Full | Full |

### 4.2 PCRE2-Layer SIMD Dispatch (the critical gap)

`src/pcre2_jit_simd_inc.h` contains the compile-time guard for PCRE2's own SIMD fast-path character search routines. The guard is:

```c
#if (SLJIT_CONFIG_X86 || SLJIT_CONFIG_ARM_64 || SLJIT_CONFIG_S390X || SLJIT_CONFIG_LOONGARCH_64)
```

`SLJIT_CONFIG_RISCV` is absent. On riscv64, `sljit_has_cpu_feature(SLJIT_HAS_SIMD)` returns 1 on V-extension hardware, but PCRE2 never calls `fast_forward_char_simd`, `fast_requested_char_simd`, or `fast_forward_char_pair_simd` on RISC-V. The regex match loop falls back to scalar code for these routines on all RISC-V targets regardless of hardware capability.

This is the single largest technical gap for PCRE2 on RISC-V relative to arm64 and amd64.

### 4.3 SIMD Crash Concern (unresolved thread)

In [PR #583](https://github.com/PCRE2Project/pcre2/pull/583) (Nov 2024), reviewer carenas asked: "how is this going to affect RISCV, knowing we have a problem there with SIMD that could result in crashes?" Zherczeg did not address RISC-V directly in the response. The `sljit_emit_simd_sign` RISC-V correctness bug was fixed in [sljit PR #284](https://github.com/zherczeg/sljit/pull/284) (Jan 7, 2025), which postdates PR #583. Whether the crash concern from PR #583 is the same underlying issue as sljit PR #284 is not documented. This thread was never formally closed with a "resolved" statement.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** CMake (primary) and autotools both supported.

**Exact cmake command used in CI for riscv64** (from `.github/workflows/dev.yml`):

```
cmake -Wdev -Werror=dev -Wdeprecated -Werror=deprecated --warn-uninitialized \
  -G Ninja \
  -DPCRE2_SUPPORT_JIT=ON \
  -DPCRE2_BUILD_PCRE2_16=ON \
  -DPCRE2_BUILD_PCRE2_32=ON \
  -DBUILD_SHARED_LIBS=ON \
  -DBUILD_STATIC_LIBS=ON \
  -DPCRE2_DEBUG=ON \
  -DCMAKE_C_FLAGS="-Wall -Wextra -pedantic -Wdeclaration-after-statement -Wshadow -Wno-overlength-strings -Wimplicit-fallthrough" \
  -DCMAKE_COMPILE_WARNING_AS_ERROR=OFF \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -B build
cd build && ninja && ctest -j3 --output-on-failure
```

`-DCMAKE_COMPILE_WARNING_AS_ERROR=OFF` is set for all multiarch builds, not riscv64-specifically. The CI comment reads: "TODO: Set -DCMAKE_COMPILE_WARNING_AS_ERROR=ON (there's currently a build failure on S390x)".

**QEMU mechanism.** The CI uses [`uraimo/run-on-arch-action`](https://github.com/uraimo/run-on-arch-action) pinned to `f9b26e3a1a408d5fd530d20c17b9f3f4428ff8d9` (v3.1.0). This pulls a `riscv64/ubuntu_latest` Docker image and runs build and test steps inside QEMU user-space emulation on an `ubuntu-latest` (x86_64) GitHub Actions runner.

**Packages installed in container:** `gcc cmake ninja-build zlib1g-dev libbz2-dev libreadline-dev`.

**Toolchain minimum.** No minimum GCC or Clang version is documented for Linux/riscv64. The NON-AUTOTOOLS-BUILD doc states Visual Studio 2013+ for Windows (due to `inttypes.h`); no equivalent floor exists for Linux.

**Cross-compilation.** No riscv64 CMake toolchain file exists in the `cmake/` directory. The `cmake/` directory contains only platform detection and warning helpers. For cross-compilation:

```
./configure --host=riscv64-linux-gnu --build=x86_64-linux-gnu
```

No riscv64-specific `--disable-*` flags are documented or required.

**Known build issues.** Issue #831 (Oct 2025): building with `-march=rv64gcb_zicond` caused pcre2_test to fail due to a buffer overflow in pcre2test.c. Fixed in upstream 10.47 via PRs #835 and #836 (dynamic buffer allocation for JITTARGET string). Backported to Gentoo. No other documented riscv64-specific build failures.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT regex compilation | Yes | Yes | Yes |
| JIT float operations | Yes | Yes | Yes |
| JIT compressed instructions | N/A | N/A | Yes (C extension) |
| JIT SIMD (in sljit) | Yes (SSE2/AVX) | Yes (NEON) | Yes (V extension, if present) |
| PCRE2-layer SIMD fast-path | Yes (SSE2) | Yes (NEON) | No (scalar fallback) |
| JIT atomic operations | Yes | Yes | Yes (A extension) |
| JIT bit manipulation | Yes (BMI/BMI2) | Yes | Yes (Zba/Zbb/Zicond) |
| Interpreted (non-JIT) mode | Yes | Yes | Yes |
| 8/16/32-bit code units | Yes | Yes | Yes |
| pcre2grep compression (zlib/bzip2) | Yes | Yes | Yes |

**Functional gaps.** None. All PCRE2 functionality is available on riscv64. JIT works. The interpreter fallback is always present.

**Performance gap from missing SIMD fast-path.** PCRE2's scalar `fast_forward_char` scans one byte per iteration. The SSE2 implementation (`fast_forward_char_simd` on x86) and the NEON implementation (on arm64) scan 16 or 32 bytes per iteration. On character-heavy patterns where the engine spends significant time scanning for a first-character match, the scalar path on riscv64 will be slower than SSE2/NEON by a factor proportional to the vector width (16x at 128-bit, 32x at 256-bit for dense scans).

**Quantitative benchmark data.** Data not available: no published benchmarks comparing PCRE2 throughput on riscv64 vs arm64 or amd64 were found in GitHub issues, RISE blog posts, or web search results.

**Security hardening gaps.** No riscv64-specific security hardening differences are documented. OpenBSD CI uses `-DSLJIT_WX_EXECUTABLE_ALLOCATOR` (W^X page protection) but this is OS-specific, not arch-specific.

**Floating-point semantics.** No riscv64-specific floating-point issues are documented in the research findings. The F/D extensions are fully supported in sljit.

---

## 7. CI/CD Infrastructure

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI workflow file | `build.yml` | `build.yml` (macOS runner) | `dev.yml` (`ptarmigan` job) |
| Triggers | push, pull_request | push, pull_request | push, workflow_dispatch only (not pull_request) |
| Runner hardware | Native x86_64 | Native macOS ARM (Apple Silicon) | QEMU on x86_64 |
| JIT enabled in CI | Yes | Yes | Yes |
| Tests run | Full `ctest -j3` | Full `ctest -j3` | Full `ctest -j3` |
| Warning-as-error | Yes (most jobs) | Yes (most jobs) | No (disabled, TODO comment for S390x issue) |
| PR feedback | Yes | Yes | No |

**RISE runners.** None. PCRE2 uses standard GitHub Actions runners (ubuntu-latest) with QEMU for non-native architectures. No RISE-provided RISC-V hardware runners are in use.

**CI riscv64 job trigger.** The `ptarmigan` job in `dev.yml` has an explicit `if:` condition that fires only on `push` to `main`/`release/**` and on `workflow_dispatch`. The top-level `on:` block includes `pull_request`, but the job-level guard overrides it. Riscv64 CI does not execute on pull requests.

---

## 8. Distribution and Release Status

**Upstream releases.** The PCRE2Project releases source archives only (`.tar.bz2`, `.tar.gz`, `.zip` plus `.sig` files). No binary assets exist in any release from 10.44 through 10.47. The upstream project does not distribute riscv64 binaries.

**Debian.** pcre2 version 10.46-1+b2 shows status "Installed" for riscv64 in Debian sid, built on buildd host `rv-osuosl-01`. riscv64 is a first-class architecture in Debian. Packages include libpcre2-8-0, libpcre2-16-0, libpcre2-32-0, libpcre2-dev, libpcre2-posix3, pcre2-utils, and language bindings (python3-pcre2, Rust, OCaml, Lua).

**Ubuntu 24.04 (Noble).** 14 architecture-specific packages including all core libraries and bindings support riscv64. All except the arch-independent `elpa-pcre2el` list riscv64 explicitly.

**Arch Linux RISC-V.** Data not available: the Arch Linux RISC-V status page (archriscv.felixc.at) did not return usable data.

**What a user must do to get a working binary.**
- On Debian/Ubuntu riscv64: `apt install libpcre2-8-0 libpcre2-dev` -- works out of the box.
- On other distributions: build from source. `cmake -DPCRE2_SUPPORT_JIT=ON` with the standard toolchain is sufficient for rv64gc hardware. No patches required as of 10.47.
- For SpacemiT X60 (rv64gcb_zicond): requires PCRE2 10.47 or a backport of PRs #835/#836. Gentoo provides the backport.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| SLJIT (embedded) | JIT backend; generates native code at runtime | Passes in CI (`ptarmigan` job) with `-DPCRE2_SUPPORT_JIT=ON` | Passes on standard rv64gc; B+Zicond failure resolved Oct 2025 | Included in PCRE2 10.47+; Gentoo JIT unmasked Oct 2025 | None open |
| zlib | Compressed input in `pcre2grep` (optional) | Builds on riscv64; Debian sid ships `zlib1g` for riscv64 | No upstream riscv64 CI; tested via Debian/Ubuntu build farms | Available in Debian sid, Ubuntu 24.04 for riscv64 | None |
| bzip2 | Compressed input in `pcre2grep` (optional) | Builds on riscv64; Debian sid ships 1.0.8-6+b2 built on `rv-manda-04` | No upstream riscv64 CI | Available in Debian sid, Ubuntu 24.04 for riscv64 | None |
| libreadline | Interactive input in `pcre2test` (optional) | Builds on riscv64; no arch-specific assembly | No riscv64-specific gaps known | Available in Debian, Ubuntu, Fedora, Alpine | None |
| libedit | Drop-in readline alternative (optional) | Builds on riscv64; pure portable C | No riscv64-specific issues | Available in Debian sid | None |
| pthreads (glibc) | JIT memory allocation on Linux (required when JIT enabled) | Fully supported on riscv64 via glibc 2.27+ | Passes; foundational to riscv64 Linux | Ships in all riscv64 Linux distributions | None |
| Valgrind | Memory debugging (build-time only, not end-user runtime dep) | riscv64 support added in Valgrind 3.25.0 (Apr 2025), covering RV64GC | Memcheck functional; extended ISA (V, B, Zicond) may produce unhandled instruction warnings | Valgrind 3.27.1 (May 2026) lists riscv64/linux as supported | No blocker for PCRE2; Valgrind coverage limited to RV64GC base ISA |

All optional compression and readline dependencies are pure portable C with no riscv64-specific issues. The critical dependency is the embedded SLJIT JIT backend, which is actively maintained for riscv64 with 8 improvement PRs merged in 2025.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #831](https://github.com/PCRE2Project/pcre2/issues/831) | `-march=rv64gcb_zicond` with JIT causes pcre2_test failure | Closed (fixed 2025-10-31) | High (correctness) | Root cause: `VERSION_SIZE 64` buffer overflow in pcre2test.c when B+Zicond generate a long arch identifier string. Fixed by PRs #835/#836. Gentoo backported. No issue with `pcre2_jit_test` itself -- only the test driver. |
| [sljit #284](https://github.com/zherczeg/sljit/pull/284) | Fix `sljit_emit_simd_sign` for RISC-V | Closed (fixed 2025-01-07) | High (correctness) | Correctness bug in SIMD sign emission on RISC-V. Commit `415ddea`. |
| [sljit #260](https://github.com/zherczeg/sljit/pull/260) | Only enable SIMD if supported by system on RISC-V | Closed (fixed 2024-07) | High (stability) | Previously could activate SIMD on hardware without V extension, causing SIGILL. |
| [sljit #140](https://github.com/zherczeg/sljit/issues/140) | Avoid SIGILL in 64-bit while jumping on RISC-V | Closed (fixed 2022-11-29) | Critical (stability) | Early-port jump encoding error causing SIGILL. Fixed before 10.41 release. |
| PR #583 SIMD concern | RISC-V SIMD could result in crashes | Open (informal, no issue filed) | Medium | carenas raised concern in PR #583 review (Nov 2024); zherczeg did not address RISC-V directly. May be resolved by sljit #284 (Jan 2025) but no formal closure. |
| [Issue #654](https://github.com/PCRE2Project/pcre2/issues/654) | Valgrind JIT conditional jump errors | Open | Low | Manifests on amd64 only. Not RISC-V. |

**No correctness bugs affecting standard rv64gc operation are currently open.** The only RISC-V-specific open concern is the informal SIMD crash thread from PR #583, which likely but not definitively corresponds to the fixed sljit #284.

---

## 12. Objections and Upstream Blockers

**Stated objections.** None on record for riscv64 support generally. The maintainers accepted riscv64 CI at the JIT author's request.

**Technical blockers.**
1. **PCRE2-layer SIMD dispatch missing RISC-V.** The four-way guard in `pcre2_jit_simd_inc.h` excludes `SLJIT_CONFIG_RISCV`. Adding RVV fast-path routines is pure implementation work -- no architectural objection exists, only bandwidth. The sljit SIMD infrastructure for RISC-V is in place.
2. **CI does not run on pull requests.** This is a CI configuration choice, not a technical blocker. It means riscv64 regressions from contributors are not caught before merge.
3. **Warning-as-error disabled.** The TODO comment in `dev.yml` attributes this to an S390x build failure. Enabling it for riscv64 independently would require a separate matrix config. Not blocking.

**Organizational blockers.** None. Both maintainers are receptive to RISC-V improvements. The sljit author (zherczeg) is the same person who implemented the RISC-V backend and actively maintains it. Acceptance probability for a well-formed RISC-V SIMD patch is high.

**Acceptance probability for new RISC-V contributions.** High, provided patches are well-tested and include CI verification. The project's track record on riscv64 (issue #14 accepted, PR #663 accepted within hours of request, PR #835 merged within 2 days of issue) supports this assessment.

---

## 13. Investment Analysis

RISE has no prior investment in PCRE2. The following sizing covers the full gap.

### 13.1 Functional Enablement

PCRE2 is fully functional on riscv64 today. JIT works, all regex operations work, all character encodings work. No functional enablement work is required.

### 13.2 Performance Optimization

The primary performance gap is the missing PCRE2-layer SIMD dispatch for RISC-V. The work is:

1. Implement `fast_forward_char_simd`, `fast_requested_char_simd`, and `fast_forward_char_pair_simd` for RISC-V using either RVV intrinsics or sljit vector macros, consistent with the existing x86/arm64 implementations.
2. Add `SLJIT_CONFIG_RISCV` to the guard in `pcre2_jit_simd_inc.h`.
3. Add riscv64-specific tests for the SIMD paths (QEMU-based is acceptable for correctness; native hardware required for performance measurement).

The existing x86 (SSE2) and arm64 (NEON) implementations are the reference. The sljit vector infrastructure for RISC-V is already in place. This is a bounded, well-defined implementation task.

A secondary optimization opportunity is the sljit RVV backend itself -- verify coverage of all PCRE2 JIT vector paths once the SIMD dispatch is enabled, since the sljit RISC-V SIMD code was added in June 2024 and has had limited real-world exercise through PCRE2.

### 13.3 CI/CD Infrastructure

The current CI runs riscv64 under QEMU, which is adequate for correctness testing but does not catch performance regressions or hardware-specific issues (extended ISA interactions like the B+Zicond issue that surfaced only on a SpacemiT X60). The PR #831 issue was caught by a downstream user (Gentoo), not by upstream CI.

Investment options:
- Add a native riscv64 GitHub Actions self-hosted runner to the `ptarmigan` job or a new dedicated job. This would also enable running the riscv64 CI on pull requests.
- Extend the CI job trigger from `push`-only to `pull_request` for the RISC-V matrix entry. This is a one-line change to `dev.yml` and has no infrastructure cost if using QEMU; it would catch regressions before merge.

### 13.4 Ecosystem Enablement

Not applicable. PCRE2 is a system library distributed as source. Its consumers (Debian, Ubuntu, Fedora, Alpine) already build and ship riscv64 packages. No ecosystem enablement work is required.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement PCRE2-layer SIMD dispatch for RISC-V V-extension (`pcre2_jit_simd_inc.h` + three fast-path functions) | 3-5 | RISC-V contributor + zherczeg review | High |
| Performance | Benchmark PCRE2 JIT on riscv64 vs arm64 (throughput, latency, pattern corpus) | 1-2 | RISC-V contributor | High |
| CI/CD | Enable riscv64 CI on pull requests (one-line `dev.yml` change) | 0.1 | NWilson or contributor | Medium |
| CI/CD | Add native riscv64 hardware runner to upstream CI | 2-3 (setup + maintenance) | RISE infrastructure | Medium |
| Reliability | Formally resolve the open PR #583 SIMD crash concern -- confirm fixed by sljit #284 or file a dedicated issue | 0.25 | Contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PCRE2 GitHub repository](https://github.com/PCRE2Project/pcre2)
- [PCRE2 homepage](https://www.pcre.org/)
- [sljit GitHub repository (zherczeg)](https://github.com/zherczeg/sljit)
- [Issue #14: Add support for the RISC-V architecture](https://github.com/PCRE2Project/pcre2/issues/14)
- [Issue #831: -march=rv64gcb_zicond causes JIT test failure](https://github.com/PCRE2Project/pcre2/issues/831)
- [Issue #654: Valgrind JIT conditional jump errors (amd64, open)](https://github.com/PCRE2Project/pcre2/issues/654)
- [PR #583: JIT compiler update](https://github.com/PCRE2Project/pcre2/pull/583)
- [PR #663: Add multiarch build jobs](https://github.com/PCRE2Project/pcre2/pull/663)
- [PR #834: pcre2test sljit platform names WIP (closed unmerged)](https://github.com/PCRE2Project/pcre2/pull/834)
- [PR #835: dynamically allocate JITTARGET buffer](https://github.com/PCRE2Project/pcre2/pull/835)
- [PR #836: remove VERSION_SIZE](https://github.com/PCRE2Project/pcre2/pull/836)
- [sljit PR #260: Only enable SIMD if supported on RISC-V](https://github.com/zherczeg/sljit/pull/260)
- [sljit PR #284: Fix sljit_emit_simd_sign for RISC-V](https://github.com/zherczeg/sljit/pull/284)
- [sljit PR #290: Implement compressed instructions for RISC-V](https://github.com/zherczeg/sljit/pull/290)
- [sljit PR #291: Implement load/store compressed instructions for RISC-V](https://github.com/zherczeg/sljit/pull/291)
- [sljit PR #293: Implement compressed arithmetic instructions for RISC-V](https://github.com/zherczeg/sljit/pull/293)
- [sljit PR #294: Implement 16-bit branches for RISC-V](https://github.com/zherczeg/sljit/pull/294)
- [sljit PR #295: Improve immediate generation on RISC-V](https://github.com/zherczeg/sljit/pull/295)
- [sljit PR #350: Improve overflow check on RISC-V](https://github.com/zherczeg/sljit/pull/350)
- [Gentoo bug 964425: libpcre2 JIT on RISC-V](https://bugs.gentoo.org/964425)
- [PCRE2 CI workflow dev.yml (riscv64 ptarmigan job)](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml)
- [Debian buildd status for pcre2](https://buildd.debian.org/status/package.php?p=pcre2&suite=sid)
- [Ubuntu 24.04 PCRE2 packages](https://packages.ubuntu.com/search?keywords=PCRE2&suite=noble&searchon=names&section=all)
- [RISE project member list](https://riseproject.dev)
- [uraimo/run-on-arch-action (QEMU CI action)](https://github.com/uraimo/run-on-arch-action)