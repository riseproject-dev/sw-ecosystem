---
title: mimalloc
parent: Project Reports
color: blue
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Alpine Linux
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="mimalloc" %}

# mimalloc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Blue<br/>
**Optimization level:** Partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for mimalloc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

mimalloc is a general-purpose memory allocator written in C, developed at Microsoft Research. It is licensed under the MIT License (copyright line in `LICENSE`: "Copyright (c) 2018-2025 Microsoft Corporation, Daan Leijen"). The repository is [microsoft/mimalloc](https://github.com/microsoft/mimalloc) under the Microsoft GitHub organization, with a Doxygen-generated API reference at [microsoft.github.io/mimalloc](https://microsoft.github.io/mimalloc/). There is no external foundation affiliation (Linux Foundation, Apache Software Foundation, CNCF, or similar).

Governance is informal and effectively single-maintainer (BDFL-style). `git shortlog` over the full history (around 2,363 commits on the default branch `main3`) shows Daan Leijen (`daanx`, aliases `daanl@outlook.com`, `daan@microsoft.com`, `daan@effp.org`) authoring over 93 percent of all commits. He originally built mimalloc for Microsoft Research's Koka and Lean language runtimes and remains sole lead maintainer. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `PLATFORMS.md`, or `SUPPORT.md` file exists in the repository. The only governance-adjacent file is a boilerplate Microsoft `SECURITY.md` (MSRC vulnerability-reporting process, generic to all Microsoft repos). Contributions require signing Microsoft's standard CLA (`cla.microsoft.com`). Minor commits from other `@microsoft.com` addresses (Gustavo Varo, Angelica Moreira) appear in the shortlog with negligible counts and no stated co-maintainer role; no other company holds a maintainer seat.

Microsoft is not a member of the [RISE Project](https://riseproject.dev). mimalloc and Microsoft do not appear in RISE's published member list (Premier Members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General Members include Canonical, ISCAS, SpacemiT, and others). No RISE blog post discusses mimalloc; the closest post, ["RISE Working Groups move their project tracking to GitHub"](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/) (2026-07-30), does not mention it. No RISE-funded work on mimalloc was found.

Community culture toward new ports is patch-welcoming but maintainer-gated, not committee-run. The readme's "Special thanks" section credits outside porters by name (David Carlier/`devnexen` for Haiku and DragonFly BSD; Rui Ueyama for RISC-V thread-pointer handling; others for arena-bitmap atomics). External PRs do get accepted, but final integration, CI wiring, and architecture-specific optimization flags are consistently folded in and polished by Daan Leijen himself. Across 2024-2026 the RISC-V work followed this exact pattern: community contributors (none Microsoft employees) filed the substantive PRs, and the maintainer merged, rebased, or re-implemented them as direct commits, often same-day once he engaged. As of 2026-09, no RISC-V-specific issue or PR remains open.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-08-10 | Issue [#610](https://github.com/microsoft/mimalloc/issues/610) opened: "MI_HINT area is outside the VA range on some systems", names RISC-V SV39 and AArch64 39-bit VA as affected | GitHub |
| 2022-11-05 | Issue [#640](https://github.com/microsoft/mimalloc/issues/640) opened: general aligned-OS-memory failures; RISC-V SV39 discussion later branched into #939 | GitHub |
| 2024-09-13 | Issue [#939](https://github.com/microsoft/mimalloc/issues/939) opened by Michael Orlitzky (`orlitzky`): "Unable to obtain aligned memory on RISC-V systems with an SV39 MMU", reproduced on a Milk-V Pioneer Box; root cause is a 2 TiB mmap alignment hint exceeding the 256 GiB SV39 ceiling | GitHub |
| 2024-09-20 or 2024-10-18 | PR [#949](https://github.com/microsoft/mimalloc/pull/949) opened by `orlitzky`: build-time SV39 detection via CMake plus `/proc/cpuinfo`, introduces `MI_NO_ALIGNED_HINT`. The opened date is reported inconsistently across sources checked (2024-09-20 in one fetch, 2024-10-18 in another); both are noted here as a discrepancy | GitHub [NEEDS VERIFICATION on exact date] |
| 2024-10-28 | Maintainer `daanx` integrates a CMake SV39 check directly (reported in the prior version of this report as commit `b3828bb`, adding `virtual_address_bits` to `mi_os_mem_config_t` and the `MI_NO_ALIGNED_HINT` macro); states a preference for a future runtime check "if it does not add too much complexity" | [NEEDS VERIFICATION, single-sourced, not re-confirmed in current research pass] |
| 2024-12-23 | Issue #939 and PR #949 both closed; #949 closed without merge, in favor of the maintainer's own build-time integration, "the big problem is solved" per `orlitzky` | GitHub |
| 2026-05-18 | PR [#1296](https://github.com/microsoft/mimalloc/pull/1296) opened by Aurelien Jarno (`aurel32`, Debian/glibc developer): first attempt at runtime VA-space detection via Linux `hwprobe`; closed 2026-06-24, not merged, superseded | GitHub |
| 2026-05-25 | PR [#1299](https://github.com/microsoft/mimalloc/pull/1299) opened by `aurel32`: refined hwprobe-based runtime VA-bits detection with a `/proc/cpuinfo` fallback for pre-6.11 kernels | GitHub |
| 2026-06-05 | PR [#1305](https://github.com/microsoft/mimalloc/pull/1305) opened by Meng Zhuo (`mengzhuo`, Institute of Software, Chinese Academy of Sciences): RISC-V64 TLS access and an atomic-yield (Zihintpause) primitive | GitHub |
| 2026-06-22 | Direct commit [`d7d90c6f`](https://github.com/microsoft/mimalloc/commit/d7d90c6fce717f61ef3b290ceacfbc84aa57b873) by `daanx`: "add detection for riscv sv48 and sv57 mmu's" | GitHub |
| 2026-06-23 | PR [#1319](https://github.com/microsoft/mimalloc/pull/1319) opened by `mengzhuo`: resubmission of #1305 rebased onto the `dev` branch at the maintainer's request | GitHub |
| 2026-06-24 | PR #1296 and PR #1305 both closed without merge, in both cases because they targeted the wrong base branch and were resubmitted (#1296 superseded by #1299; #1305 by #1319) | GitHub |
| 2026-07-07 | PR #1299 merged (merge commit `67ba4a3004a5e8ed5bebe2e2dfffa03c95b4fa2b`); PR #1319 merged same day (merge commit `492522944...6b695c5c39883867aac580e7c2e6ed5`), both by `daanx` | GitHub |
| 2026-07-14 | v3.4.0 tagged; first release containing both #1299 (runtime VA detection) and #1319 (RISC-V TLS and atomic yield) | GitHub (verified via `git merge-base --is-ancestor`) |
| 2026-07-27 | Direct commits `fd18eadb` ("add alpine riscv test") and `f72e2212`/`5ba4441d` ("add riscv to freeBSD") | GitHub |
| 2026-08-03 | Direct commit `59378bea`: "make page->used 32-bit (for better codegen on riscV)" | GitHub |
| 2026-08-10 | PR [#1363](https://github.com/microsoft/mimalloc/pull/1363) opened by Rui Ueyama (`rui314`, author of the mold linker): fixes a Clang/glibc thread-pointer misread that could corrupt the heap via cross-thread frees. Same day, `daanx` lands the equivalent fix directly as commit `d38870fa` ("use __builtin_thread_pointer on riscV, pr #1363 by @rui314") | GitHub |
| 2026-08-11 | PR #1363 closed without merge (the fix had already landed as `d38870fa`); an earlier automated read of the PR thread misidentified this as "merged" because the commit SHA appears in the discussion, the PR state itself is "Closed". Direct commit `ad6c7e6b`: "enable Zacas extension with -DMI_OPT_ARCH=ON on riscV" | GitHub |
| 2026-08-14 | Direct commit `2dc67efb`: "use rva22_zacas for riscV" (part of iterative `MI_OPT_ARCH` refinement, continuing through 2026-08-30 with several same-day `zalasr`/`zalars` flag commits) | GitHub |
| 2026-08-18 | v3.5.0 tagged; first release containing the `__builtin_thread_pointer`-on-RISC-V fix (equivalent of PR #1363) | GitHub |
| 2026-08-30 | Direct commit `9cf99c79`: "fix __riscv macro misspelling"; related commits adding/removing clang(++) from RISC-V CI | GitHub |
| 2026-09-01 | v3.5.1 tagged; changelog entry "Improved riscV support. Various small build fixes." | readme.md changelog |
| 2026-09-12 | PR [#1388](https://github.com/microsoft/mimalloc/pull/1388) merged (dependabot CI bump; its changelog body references `vmactions/freebsd-vm` adding riscv64 support, not itself a mimalloc-code RISC-V change); v3.5.2 tagged same day | GitHub |
| 2026-09-15 | Direct commit [`014be9ac`](https://github.com/microsoft/mimalloc/commit/014be9ac46a8fab538ff201714d6f2663f8696d3): "disable MEMZERO16X for now on riscV (due to compiler errors)", the most recent RISC-V-related commit found | GitHub |
| 2026-09-16/17 | v3.5.3 tagged (HEAD `31d034d94cdb8e22f7d7ed55967f581a2d6e831d`), current upstream release as of this report | GitHub |

**Key contributors to the RISC-V port:** Michael Orlitzky (`orlitzky`, initial bug report and first fix attempt), Aurelien Jarno (`aurel32`, Debian developer, runtime VA detection), Meng Zhuo (`mengzhuo`, ISCAS, TLS and atomic yield), Rui Ueyama (`rui314`, mold linker author, thread-pointer correctness fix). None are affiliated with Microsoft. Daan Leijen (Microsoft Research) is the sole gatekeeper and, in several cases, the one who actually landed the final code as his own commit rather than merging the contributor's branch.

**Is the port fully upstream?** Yes, as of v3.5.0 (2026-08-18). The SV39/SV48/SV57 virtual-address-space detection (#1299), RISC-V TLS and atomic-yield support (#1319), and the Clang thread-pointer correctness fix (equivalent of #1363, landed as `d38870fa`) have all merged or landed via direct maintainer commit. No RISC-V-specific issue or PR has been open since 2026-09. Daan Leijen continues periodic direct-commit tuning (CI, codegen, build flags) on an ongoing basis.

## 3. Upstream Support Tier

mimalloc has no formal tier-policy document; platform support is described informally in the readme's prose ("ported to many systems: Windows, macOS, Linux, WASM, various BSD's, Haiku, MUSL, etc.", now including RISC-V) and in build-flag comments. Support tier must be inferred from CI coverage, release artifacts, and merge history.

riscv64 CI does genuinely exist in `.github/workflows/test.yaml` and runs the real `ctest` suite under QEMU-emulated Alpine Linux across four build configurations (Release-clang, Release-gcc, Debug, Secure). However, this CI is `continue-on-error: true` for all `alpine-*` jobs (riscv64 included), and it triggers only on `workflow_dispatch`, pushes to `dev*` branches, or `v*` tags, never on `pull_request`. A community PR therefore does not automatically exercise riscv64 CI, and a riscv64 failure cannot block a merge even when the job does run. No GitHub Release ships a riscv64 binary asset.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | Native (ubuntu-latest) | Native/QEMU mix depending on job | QEMU-emulated Alpine (jirutka/setup-alpine), on an x86_64 `ubuntu-latest` host |
| CI gates PRs | Yes (standard matrix) | Yes (standard matrix) | No, triggers only on `workflow_dispatch`/`dev*`/`v*` tags |
| CI can fail the build | Yes | Yes | No, `continue-on-error: true` |
| Release binary (GitHub Releases) | Yes | Yes | No |
| Maintainer-authored arch code | Yes | Yes | Yes (sv48/sv57 detection, Zacas/Zalasr flag tuning, MEMZERO16X disable), but driven initially by community PRs |
| Build-time workaround for a known crash | N/A | N/A | Was needed historically (build-time SV39 detection), superseded by the merged runtime hwprobe fix (#1299) |

**riscv64 effective tier: tested-but-non-gating, distro-distributed.** The architecture builds, and its own ctest suite genuinely passes under emulation, but riscv64 is excluded from the standard PR-gating CI matrix and from upstream's own release-binary pipeline. The only consumable prebuilt riscv64 binary available to an end user comes from downstream distro packaging (Ubuntu, Arch Linux RISC-V), not from microsoft/mimalloc directly.

## 4. Technical Architecture and RISC-V-Specific Subsystems

mimalloc has no JIT backend, no garbage collector, and no SIMD-vectorized allocation hot path (searches for `vfloat32m1_t` and `rvv` both returned zero results across the codebase). There is no dedicated `arch/riscv/` directory, no `.S` assembly files, and no riscv-specific source file analogous to a kernel-style port; all architecture-specific code is `#if defined(__riscv)` preprocessor branches scattered through a handful of shared, OS-organized files (`include/mimalloc/bits.h`, `include/mimalloc/prim-tls.h`, `include/mimalloc/internal.h`, `src/libc.c`, `src/prim/unix/prim.c`, `CMakeLists.txt`). A guard-line count found 13 RISC-V guard lines versus 38 for x64 and 32 for arm64, a scope difference driven mainly by riscv having no MSVC/Windows path and no hand-written SIMD path to parallel, not evidence of incompleteness.

**4.1 TLS (thread-local storage) fast path.** Full, hand-tuned. `include/mimalloc/prim-tls.h` reads the `tp` register directly via inline assembly (`__asm__("mv %0, tp" : "=r" (tcb))`) when `__builtin_thread_pointer()` is unavailable, and uses the builtin itself (on par with aarch64's `mrs tpidr_el0` and x86-64's `movq %fs:0`) when the compiler qualifies: GCC >= 7 or Clang >= 14 on riscv. PR #1363 (landed as commit `d38870fa`) fixed a real, non-hypothetical correctness bug here: under Clang on glibc/RISC-V, Clang fakes `__GNUC__` as 4, so the version-gate silently failed to enable the builtin and the fallback path misread `tp` as a TLS-slot array, corrupting the heap on cross-thread frees. The fix extends builtin eligibility to Clang 14+ and falls back safely to the address of `_mi_heap_default` when no builtin is available at all.

**4.2 Virtual-address-space detection.** Full, hand-tuned, and arguably more sophisticated than the x64/arm64 equivalents (which assume a fixed 47/48-bit VA width and need no runtime probing at all). `src/prim/unix/prim.c` uses the Linux 6.11+ `riscv_hwprobe` syscall to detect the highest usable virtual address at runtime, falling back to parsing `/proc/cpuinfo` for `sv39`/`sv48`/`sv57` strings on older kernels (PR #1299, merged). This directly and fully fixes issue #939: the earlier build-time-only `/proc/cpuinfo` check could bake in the wrong VA-bits assumption if a binary was built on one MMU configuration and run on another (a real cross-compilation/redistribution correctness risk); the merged runtime check removes that risk entirely for kernels with hwprobe support.

**4.3 CPU feature detection (bit-manipulation).** Partial. `src/libc.c` sets `_mi_cpu_has_popcnt=true` via the compile-time macros `__riscv_zbb`/`__riscv_b`, not a runtime probe analogous to x64's genuine CPUID-based detection. This tier matches arm64's static always-true assumption, so it is not a riscv-specific deficiency relative to arm64, but it is behind x64's runtime detection.

**4.4 Bit-scan/popcount/rotate.** Partial (compiler intrinsics). No hand-written assembly path for riscv (unlike x64's explicit `tzcnt`/`lzcnt`/`bsf`/`bsr` inline asm); falls through to `__builtin_ctzl`/`clzl`/`popcountl`. arm64 is in the same tier on GCC/Clang.

**4.5 Atomics (Zacas compare-and-swap, Zbb/Zba/Zbc/Zbs bitmanip).** Partial, opt-in. No architecture gets hand-written CAS assembly; Zacas support is purely a compiler `-march=` flag (`rv64gcb_zacas`, with `rv64gcb_zacas_zalasr` for hardware with the newer Zalasr load-acquire/store-release extension) that changes codegen for `__atomic_compare_exchange`. Enabled via `-DMI_OPT_ARCH=rv64gcb_zacas[_zalasr]` or `-DMI_OPT_ARCH=ON` (which auto-picks `rv64gcb_zacas` on riscv64), but this is not the CMake default (`MI_OPT_ARCH` defaults to `OFF`), so a plain build does not get these extensions automatically.

**4.6 Fast memzero (MEMZERO16X).** Scalar fallback, deliberately disabled. `include/mimalloc/internal.h` explicitly excludes `MI_ARCH_RISCV` from the 16x hand-unrolled memzero fast path that x64 and arm64 get, falling back to the portable/generic `_mi_memzero` path, per commit `014be9ac` (2026-09-15): "disable MEMZERO16X for now on riscV (due to compiler errors)". The comment attributes this to current compilers not always correctly replacing a constant `memset`, i.e. a compiler codegen bug, not a mimalloc design limitation; users can force it back on via `-DMI_USE_MEMZERO16X=1`.

**4.7 CI validation.** Full. `.github/workflows/test.yaml` runs Release (both Clang and GCC, the Clang leg with `-DMI_OPT_ARCH=rv64gcb_zacas_zalasr`), Debug (`MI_DEBUG=FULL`), and Secure (`MI_SECURE=ON`) builds under QEMU/Alpine, each running the full `ctest` suite, plus generated-assembly artifact upload for codegen inspection.

No `TODO`/`FIXME`/`unimplemented`/`stub` comment was found anywhere near a `riscv`/`__riscv`/`MI_ARCH_RISCV` guard in the current codebase.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TLS register access | Full (FS-segment asm) | Full (`mrs tpidr_el0`) | Full (`mv %0, tp` asm / `__builtin_thread_pointer`, GCC>=7 or Clang>=14) |
| Virtual-address-space detection | Fixed 47-bit assumption, no probing needed | Fixed 48-bit assumption, no probing needed | Full, runtime hwprobe + `/proc/cpuinfo` fallback for sv39/48/57 |
| CPU feature detection | Full (runtime CPUID) | Static assumption | Partial (compile-time `__riscv_zbb` macro only) |
| Bit-scan/popcount/rotate | Full (hand asm: tzcnt/lzcnt/bsf/bsr) | Partial (compiler intrinsics) | Partial (compiler intrinsics, same tier as arm64) |
| Atomics / CAS extension | Native | Native (LSE on armv8.1+) | Partial, opt-in via `-march=rv64gcb_zacas[_zalasr]`, not default |
| Fast memzero (16x) | Full (hand-unrolled) | Full (hand-unrolled) | Disabled on riscv64 due to a compiler codegen bug (commit `014be9ac`) |
| Build-time arch optimization | `-march=` AVX2-class defaults | armv8.1/armv8.3 defaults | `rv64gcb_zacas` default under `MI_OPT_ARCH=ON`; not the CMake-wide default |
| CI validation | Full, PR-gating | Full, PR-gating | Full test coverage, but non-gating (`continue-on-error`, no `pull_request` trigger) |

## 5. Build System, Cross-Compilation, and Toolchain

**Requirements:** CMake >= 3.18 (`cmake_minimum_required`), identical for every architecture including riscv64. Architecture is auto-detected via `CMAKE_SYSTEM_PROCESSOR MATCHES "^(riscv|riscv32|riscv64)$"`, with `MI_ARCH_BITS` derived from pointer size, no riscv-specific CMake toolchain file exists in the repository (`cmake/` holds only `JoinPaths.cmake` and the package-config files). There is no hard minimum compiler version to build mimalloc on riscv64 at all; GCC >= 7 or Clang >= 14 is only required to get the `__builtin_thread_pointer()` fast TLS path, below that it falls back to the inline-asm `mv %0, tp` path, which still works correctly.

**Exact commands CI uses for riscv64** (`.github/workflows/test.yaml`, job `alpine-riscv64`, executed inside a QEMU-emulated Alpine Linux chroot set up by the `jirutka/setup-alpine@...v1.4.1` action with `arch: riscv64`, packages `build-base cmake ninja clang`):

```
# Release, Clang, with the newer Zalasr extension enabled
CC=clang CXX=clang++ cmake . -B out/release-riscv64-clang -G Ninja \
    -DCMAKE_BUILD_TYPE=Release -DMI_OPT_ARCH=rv64gcb_zacas_zalasr -DMI_SEE_ASM=ON
cmake --build out/release-riscv64-clang --parallel 4 --config Release
ctest --test-dir out/release-riscv64-clang --verbose --timeout 240 -C Release

# Release, default compiler (gcc), auto-picks rv64gcb_zacas
cmake . -B out/release-riscv64 -G Ninja -DCMAKE_BUILD_TYPE=Release -DMI_OPT_ARCH=ON -DMI_SEE_ASM=ON
cmake --build out/release-riscv64 --parallel 4 --config Release
ctest --test-dir out/release-riscv64 --verbose --timeout 240 -C Release

# Debug (full internal checks, MI_TEST_LIGHT=1 to shorten emulated runtime)
cmake . -B out/debug-riscv64 -G Ninja -DCMAKE_BUILD_TYPE=Debug -DMI_DEBUG=FULL
cmake --build out/debug-riscv64 --parallel 4 --config Debug
ctest --test-dir out/debug-riscv64 --verbose --timeout 240 -C Debug

# Secure mode
cmake . -B out/secure-riscv64 -G Ninja -DCMAKE_BUILD_TYPE=Release -DMI_SECURE=ON
cmake --build out/secure-riscv64 --parallel 4 --config Release
ctest --test-dir out/secure-riscv64 --verbose --timeout 240 -C Release
```

**Relevant CMake flags:**

| Flag | Effect on riscv64 |
|---|---|
| `-DMI_OPT_ARCH=OFF\|ON\|rv64gcb_zacas\|rv64gcb_zacas_zalasr\|DEFAULT` | Architecture codegen tuning. `OFF` is the project-wide default; `ON` auto-selects `rv64gcb_zacas` on riscv64 |
| `-DMI_SEE_ASM=ON` | Dumps per-source `.s` files for codegen inspection, used in CI for riscv64 artifact upload |
| `-DMI_SECURE=ON\|FULL` | Guard pages, encrypted free lists, tested on riscv64 in CI |
| `-DMI_DEBUG=FULL` | Full internal invariant checks, used for the riscv64 Debug CI leg |
| `-DMI_LIBC_MUSL=ON` | Enables local-dynamic TLS for static builds, required for musl targets such as Alpine |
| `-DMI_LOCAL_DYNAMIC_TLS=ON` | `dlopen`-compatible TLS (`-ftls-model=local-dynamic`) |
| `-DMI_ALLOW_THP=OFF\|FULL` | Linux-only transparent-huge-page control, applies to riscv64/Linux |

**QEMU usage.** mimalloc's own build/test scripts never invoke QEMU directly. riscv64 CI testing is delegated entirely to the third-party `jirutka/setup-alpine@ae3b3ddba35054804fc4a3507b519fa7e8152050` (pinned v1.4.1) GitHub Action, which transparently builds a QEMU-emulated Alpine riscv64 userspace chroot on an ordinary `ubuntu-latest` x86_64 runner. Build and test steps run inside this emulated root (`shell: alpine-riscv64.sh {0}`), it is full emulation of build and test, not qemu-user execution of a cross-compiled binary. There is no standalone `qemu-riscv64 ./binary`-style invocation anywhere in the repository, and no riscv64 Dockerfile exists (`contrib/docker/` has only `alpine-x86`, `alpine-arm32v7`, a generic `alpine`, and `manylinux-x64`).

**Known build issue.** The current, live issue is the MEMZERO16X compiler-bug workaround (commit `014be9ac`, 2026-09-15): a constant `memset` is "not always replaced correctly by current compilers" on riscv64, so the fast 16x-unrolled memzero path is force-disabled and the generic scalar path is used instead. This is a documented, deliberate, overridable tradeoff, not a build failure. The previously-flagged cross-compilation hazard (a binary built on SV39 hardware segfaulting when redistributed to SV48/SV57 hardware, because the old `/proc/cpuinfo` check ran at build time against the host, not the target) has been substantially mitigated by the merged runtime hwprobe detection in PR #1299, which supersedes the build-time-only check for kernels with hwprobe support (6.11+).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Memory allocation (correctness) | Full | Full | Full |
| Aligned OS memory hints / VA detection | Full | Full | Full, via merged runtime hwprobe detection (#1299), fixes the #939 class of SV39 failures |
| TLS fast path | Full | Full | Full, hand asm / builtin, Clang-specific correctness bug fixed (#1363 equivalent, commit `d38870fa`) |
| Atomic yield / spin-wait hint | Full | Full | Landed via merged PR #1319 (Zihintpause-based, with fallback) |
| ISA extension optimization | SSE2-class defaults | armv8.1/8.3-class defaults | Zacas/Zbb/Zalasr available via `-march=rv64gcb_zacas[_zalasr]`, opt-in, not default |
| Fast memzero (16x unrolled) | Full | Full | Disabled, compiler-bug workaround (commit `014be9ac`) |
| Prebuilt upstream binary | Yes | Yes | No |
| CI validation (build + test) | Yes, PR-gating | Yes, PR-gating | Yes, but non-gating (`continue-on-error`, no `pull_request` trigger) |

**Functional gaps:** none that affect correctness in a default build; mimalloc on riscv64 allocates correctly, and the historical SV39 alignment-failure and Clang/glibc thread-pointer correctness issues are both fixed upstream.

**Performance gaps:** two remain, both narrow and documented rather than structural. First, the fast 16x memzero path is unavailable on riscv64 due to a compiler codegen bug, forcing the generic scalar memzero path for zero-fill operations. Second, the Zacas/Zbb/Zalasr-tuned build (`-DMI_OPT_ARCH=rv64gcb_zacas[_zalasr]`) is opt-in, a default build gets no RISC-V-specific atomics or bitmanip tuning at all. No quantitative riscv64 benchmark data exists anywhere (see Section 14.2) to size the magnitude of either gap.

**Security hardening:** `-DMI_SECURE=ON` (guard pages, encrypted free lists) works on riscv64 via generic C code and is explicitly exercised in CI (`alpine-riscv64, Secure` job). No riscv64-specific gaps found.

**No NaN or floating-point semantics concerns apply**, mimalloc is a pure memory allocator with no numerics surface.

## 7. CI/CD Infrastructure

Confirmed by direct inspection of `.github/workflows/test.yaml` at HEAD `31d034d9` (2026-09-16, tag v3.5.3). riscv appears only in `test.yaml`; `release.yaml` and `stale.yaml` contain zero riscv references. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

**Trigger** (top of `test.yaml`):
```
on:
  workflow_dispatch:
  push:
    branches:
      - 'dev*'
    tags:
      - 'v*'
```
There is no `pull_request` trigger at all. The entire workflow, including the riscv64 job, runs only on manual dispatch, pushes to `dev*` branches, or `v*` tags, i.e. maintainer-initiated events, not community PRs.

**Runner and emulation.** `runs-on: ubuntu-latest`, a plain x86_64 GitHub-hosted runner. The riscv64 target is a VM/chroot built by `jirutka/setup-alpine@ae3b3ddba35054804fc4a3507b519fa7e8152050`, `arch: riscv64`, explicitly commented `# qemu` in the matrix and in the surrounding section comment "VM: Alpine Linux with MUSL libc (riscv64, x64, and arm32)". This is QEMU user-mode emulation on an x86 host, not real silicon.

**What the job does.** Build and test, four configurations, each running `ctest`: Release-clang (`-DMI_OPT_ARCH=rv64gcb_zacas_zalasr`), Release-default (`-DMI_OPT_ARCH=ON`), Debug (`MI_DEBUG=FULL`, `MI_TEST_LIGHT=1`), and Secure (`MI_SECURE=ON`), plus generated-assembly artifact upload for both Release legs.

**Gating.** `.github/workflows/test.yaml` lines 20-21:
```
continue-on-error: ${{ startsWith(matrix.tests,'alpine') || false }}
```
Since `alpine-riscv64` starts with `alpine`, this job is allowed to fail without failing the overall workflow run. A riscv64 regression is informational, not blocking.

**release.yaml** produces binary bundles only for the standard x64/x86/arm64/arm64ec matrix across Windows/macOS/Linux; it has no riscv64 entry and is unaffected by any riscv64 CI result (it is `workflow_dispatch`-only and unrelated to `test.yaml`).

| CI signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | Yes | Partial (QEMU for some jobs) | No, full QEMU/Alpine emulation |
| CI gates on `pull_request` | Yes | Yes | No |
| CI can fail the overall run | Yes | Yes | No (`continue-on-error: true`) |
| Build + test executed | Yes | Yes | Yes, 4 configs with real `ctest` runs |
| Release binary produced | Yes | Yes | No |
| RISE CI runner used | No | No | No |

## 8. Distribution and Release Status

**Upstream GitHub releases.** The five most recent releases (v3.5.3, v3.5.2, v3.5.1, v3.5.0, v3.4.5, spanning Aug-Sep 2026) each ship around 29 binary assets covering Linux/macOS/Windows for x64, x86, arm64, and arm64ec. No asset filename in any of these releases contains "riscv" or "riscv64". Verified via [GitHub Releases](https://github.com/microsoft/mimalloc/releases).

**PyPI.** No PyPI package named `mimalloc` exists at all (`https://pypi.org/pypi/mimalloc/json` returns HTTP 404); this is expected since mimalloc is a C library, not a Python package, so the riscv64-wheel question is moot for this channel.

**Ubuntu 26.04 ("resolute").** Confirmed present for riscv64 via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=mimalloc&suite=resolute&searchon=names&section=all): `libmimalloc-dev`, `libmimalloc3`, `librust-libmimalloc-sys-dev`, and `librust-mimalloc-dev` (architecture list "amd64 arm64 armhf ppc64el riscv64 s390x" for the Rust package; i386 included for the core packages). One fetch recorded the core-package version as `3.2.8+ds-2`, several versions behind the current upstream `v3.5.3`. This is the only confirmed upstream-adjacent riscv64 binary channel for mimalloc, and it is distro-produced, not provided by microsoft/mimalloc itself.

**Arch Linux RISC-V.** Confirmed present, though not via the commonly cited search URL. The search endpoint `archriscv.felixc.at/?q=mimalloc` does not function as a search page on the live site (no query-string search feature exists there). Direct browsing of the repository tree confirms `mimalloc-3.5.3-1-riscv64.pkg.tar.zst` and its signature, last modified 2026-09-19, matching upstream's v3.5.3 (published 2026-09-17) within about two days, this is a current, close-to-upstream riscv64 binary via a volunteer distro port.

**Debian unstable (sid).** The prior version of this report recorded mimalloc `3.3.2+ds-1` as built for riscv64 on Debian's `rv-osuosl-03` build daemon via [buildd.debian.org](https://buildd.debian.org/status/package.php?p=mimalloc&suite=sid). This was not re-checked in the current research pass. [NEEDS VERIFICATION]

**Bottom line / what a user must do.** There is no upstream-provided riscv64 binary. To get a working riscv64 build, a user installs `libmimalloc-dev`/`libmimalloc3` from Ubuntu 26.04 ("resolute") universe, installs the Arch Linux RISC-V package, or builds from source using the CMake commands in Section 5 (which require no riscv-specific toolchain file and succeed with a stock GCC or Clang riscv64 cross or native toolchain).

## 9. Dependencies

mimalloc is a self-contained C library. It has no third-party library dependencies for JIT backends, SIMD, numerics, cryptography, or compression, and no other memory allocator as a dependency. It has no `setup.py`, `go.mod`, `Cargo.toml`, or `package.json`, it is a plain CMake/C project. The externally linked components are standard OS/toolchain pieces, conditionally linked by CMake, plus the toolchain and emulation stack used to build and test it on riscv64.

| Name | Role | riscv64 status |
|---|---|---|
| CMake | Build-dependency, critical | Project-wide minimum is CMake >= 3.18, identical requirement on riscv64; no riscv-specific CMake toolchain file exists, architecture is auto-detected from `CMAKE_SYSTEM_PROCESSOR` |
| Ninja | Build-dependency, optional | Used as the CI generator for all riscv64 jobs (`-G Ninja`); Make also works, Ninja is not mandatory |
| GCC | Build-dependency, critical | Default compiler for the riscv64 "Release" and "Debug"/"Secure" CI legs; GCC >= 7 unlocks the `__builtin_thread_pointer()` fast TLS path, lower versions still build via the inline-asm `mv %0, tp` fallback |
| LLVM (Clang) | Build-dependency, critical | Used for the riscv64 "Release clang" CI leg with `-DMI_OPT_ARCH=rv64gcb_zacas_zalasr`; Clang >= 14 required for the `__builtin_thread_pointer()` fast path and for the PR #1363 correctness fix to apply (older Clang falls back to the safe default-heap-address path) |
| GCC | Runtime-dependency, critical | Supplies `libatomic`, the GCC-runtime fallback for atomic operations on widths lacking native hardware atomics; ships with GCC's riscv64 target runtime and is present in Ubuntu's riscv64 toolchain packages |
| glibc | Runtime-dependency, critical | Supplies `pthread` (POSIX threading) and `librt` (realtime/clock calls) linked on Linux builds; also supplies the `riscv_hwprobe`-related headers (`sys/hwprobe.h`) used by the merged VA-detection fix when present; riscv64 glibc has been mature upstream since around 2018 and is shipped as part of every Ubuntu riscv64 release (`libc6`) |
| musl | Runtime-dependency, optional | Required for `-DMI_LIBC_MUSL=ON` static/local-dynamic-TLS builds; this is also the libc used inside the CI's Alpine riscv64 test environment, where `sys/hwprobe.h`/`asm/hwprobe.h` are absent, so the VA-detection code falls back to parsing `/proc/cpuinfo` instead |
| QEMU | Test-dependency, critical | Provides the user-mode emulation that lets the `alpine-riscv64` CI job build and run the full `ctest` suite on an x86_64 `ubuntu-latest` host; invoked transparently via the `jirutka/setup-alpine` action, not called directly by mimalloc's own scripts |
| Alpine Linux | Test-dependency, critical | The riscv64 CI environment itself: a QEMU-emulated Alpine chroot (packages `build-base cmake ninja clang`) set up by `jirutka/setup-alpine@ae3b3ddba35054804fc4a3507b519fa7e8152050`; this is the only environment in which mimalloc's own riscv64 tests are exercised upstream |

**Indirect/recursed dependencies found during research** (not in the direct list above, surfaced while tracing the critical-dependency chain): `libatomic1` (the distro package providing the GCC `libatomic` runtime on Ubuntu riscv64), `gcc-riscv64-linux-gnu` (the Ubuntu cross-toolchain package), `binutils` (assembler/linker support for recognizing `-march=rv64gcb_zacas`/`zalasr` extension strings, required for the opt-in tuned build to even assemble), and Valgrind (optional dev tooling referenced via `valgrind.h`, whose riscv64 support is historically partial/lagging upstream relative to glibc/GCC). None of these are standalone projects with their own riscv64 issue trackers in the sense relevant to this report, they are components of the base glibc/binutils/GCC toolchain, which is already mature on riscv64.

**Deep-dive conclusion.** There is no critical third-party dependency blocking riscv64 for mimalloc. All of the interesting riscv64 engineering (TLS register access, atomic-yield primitive, VA-width detection, Zacas/bitmanip build flags) is internal to mimalloc's own codebase, not inherited from an unready dependency.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#939](https://github.com/microsoft/mimalloc/issues/939) | Unable to obtain aligned memory on RISC-V systems with an SV39 MMU | Closed (2024-12-23) | High (fixed) | Root cause: 2 TiB mmap hint exceeds the 256 GiB SV39 ceiling. Fully fixed by the merged runtime hwprobe detection in PR #1299 |
| [#610](https://github.com/microsoft/mimalloc/issues/610) | MI_HINT area is outside the VA range on some systems | Status not reconfirmed in current pass; previously reported open | Medium | Names RISC-V SV39 and AArch64 39-bit VA; same root cause as #939, which has since been addressed, so this issue's RISC-V relevance is likely stale [NEEDS VERIFICATION] |
| [#640](https://github.com/microsoft/mimalloc/issues/640) | Lots of warnings due to failing to allocate aligned OS memory | Status not reconfirmed in current pass; previously reported open | Low-Medium | Not RISC-V-specific; the SV39 discussion that branched from it (#939) is resolved [NEEDS VERIFICATION] |
| [#1152](https://github.com/microsoft/mimalloc/issues/1152) | x86 i686 segfault in test-stress with MI_SECURE | Open (2025-10-10) | N/A to RISC-V | Not RISC-V-related, listed for completeness only |
| [#343](https://github.com/microsoft/mimalloc/issues/343) | Apple Silicon/arm64 TLS segfault | Open (since 2020) | N/A to RISC-V | Not RISC-V-related |
| [#876](https://github.com/microsoft/mimalloc/issues/876) | slice_count overflow for very large allocations (s390x divide-by-zero/FPE) | Closed (2024-04-19) | N/A to RISC-V | Not RISC-V-related, affects s390x |

**No open RISC-V-specific issue or PR exists as of 2026-09.** A targeted search for "riscv64 bug" and a direct "RISC-V" query against the issue tracker returned no currently-open RISC-V-tagged item; every RISC-V-titled issue or PR found (#939, #949, #1296, #1299, #1305, #1319, #1363) is closed, and the substantive ones among them (#1299, #1319, and the #1363-equivalent fix) landed rather than being abandoned. No "RISC-V NaN/floating-point" issue exists; the one floating-point-adjacent issue found (#876) affects s390x, not RISC-V.

**Correctness bugs:** none open. The two correctness-class issues found in research, the SV39 VA-hint failure (#939) and the Clang/glibc thread-pointer heap-corruption bug (#1363-class), are both fixed upstream (v3.4.0 and v3.5.0 respectively).

## 12. Objections and Upstream Blockers

**Technical blockers:** none currently open. All RISC-V-specific technical work that was pending as of mid-2026 (#1299's runtime VA detection, #1319's TLS and atomic-yield support, the Clang thread-pointer fix later tracked as #1363) has landed, either as a merged PR or as an equivalent direct maintainer commit, by v3.5.0 (2026-08-18). The only remaining named technical gap is the MEMZERO16X compiler-bug workaround (commit `014be9ac`, 2026-09-15), which the maintainer disabled rather than debugged further, this is an open compiler-codegen question, not a contested design decision.

**Organizational blockers:** the structural bottleneck remains single-maintainer review bandwidth, consistent with the project's general governance model (Section 1). In practice, however, this bottleneck resolved itself for RISC-V during 2026: once Daan Leijen engaged with each PR, turnaround was fast (same-day merges for #1299/#1319 on 2026-07-07, and a same-day direct-commit fix for the #1363 class of bug on 2026-08-10). The two structural non-blockers that persist by design, not by neglect, are CI gating (riscv64 CI is `continue-on-error` and not wired to `pull_request`) and the absence of upstream release binaries for riscv64; neither has an open issue or PR requesting a change, so there is no indication the maintainer currently intends to change either.

**Acceptance probability for further RISC-V work:** high. The maintainer has repeatedly folded community RISC-V contributions into the mainline (sometimes rewriting them as his own commits) and continues unprompted RISC-V-specific tuning on his own initiative (the Zacas/Zalasr flag iteration through August 2026, the MEMZERO16X disable in September 2026). There is no stated objection to RISC-V as a target.

**RISE involvement:** none found. No RISE member organization has filed an issue or PR against microsoft/mimalloc, no RISE blog post discusses mimalloc, and mimalloc is not a RISE member or listed partner. mimalloc appears in RISE's ecosystem only indirectly, as a bundled allocator dependency inside four other riscv64 Python wheels built by `riseproject-dev/python-wheels` on RISE RISC-V Runners: PyArrow (`ARROW_MIMALLOC=ON`), Granian (free-threaded `cp314t` builds), Qiskit (`QISKIT_BUILD_WITH_MIMALLOC=1`), and kiwipiepy (`USE_MIMALLOC=1`, statically bundled). This is RISE's wheel-builder CI consuming mimalloc as a transitive dependency of those packages, not RISE doing engineering work on mimalloc itself.

## 13. Readiness Assessment

- **Color:** Blue (N/A)
- **Release provider:** distro
- **Optimization level:** Partial

mimalloc is an optimization-purpose project (a memory allocator), so RISC-V coverage is graded on fast-path quality, not merely build success. RISC-V gets genuine fast-path coverage: TLS via the `tp` register and `__builtin_thread_pointer` (PR #1363, landed as commit `d38870fa`), the hwprobe-based VA-space fix for the SV39 bug (issue #939, merged via PR #1299, shipped in v3.4.0), and build-flag-gated Zacas/Zbb atomics and bitmanip (`-DMI_OPT_ARCH=rv64gcb_zacas[_zalasr]`). Two gaps keep this at partial rather than full: the MEMZERO16X fast-memzero path is explicitly disabled on riscv64 due to a compiler bug (commit `014be9ac`, 2026-09-15), and the Zacas/Zalasr tuning is opt-in rather than the CMake default. Closing either gap, re-enabling MEMZERO16X once the underlying compiler codegen bug is fixed, or making the Zacas-tuned `-march=` the default for riscv64 builds, would move optimization level toward full.

**Justification for the color.** mimalloc's upstream CI (`.github/workflows/test.yaml`) builds riscv64 and actually executes the `ctest` suite under QEMU/Alpine (Release-clang, Release-gcc, Debug, Secure configurations), see the raw workflow file at [`dev` branch](https://raw.githubusercontent.com/microsoft/mimalloc/dev/.github/workflows/test.yaml), so it clears build and test. However, the job is `continue-on-error`, and upstream's [GitHub releases](https://github.com/microsoft/mimalloc/releases) ship no riscv64 assets, so the only consumable riscv64 binary comes from Ubuntu 26.04 "resolute" (`libmimalloc3`/`libmimalloc-dev`, confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=mimalloc&suite=resolute&searchon=names&section=all)), not from upstream itself. The net primary color is therefore blue, with the optimization-level caveat above capping it there even though both build and test pass in CI.

**Pending work that could change the grade.** No RISC-V-specific issue or PR remains open as of 2026-09 (#939, #1299, #1319/#1305, #1363 all landed by v3.5.0). Maintainer `daanx` continues periodic direct-commit tuning (for example, disabling MEMZERO16X on riscv64, commit `014be9ac`, 2026-09-15) that could close the remaining optimization gap in either direction. No RISE involvement was found in mimalloc upstream (no blog coverage, no funded contributions, not a RISE member); mimalloc appears in RISE's ecosystem only as a bundled allocator dependency inside other riscv64 wheels (PyArrow, Granian, Qiskit, kiwipiepy).

## 14. Investment Analysis

RISE has done no direct work on mimalloc upstream; its only touchpoint is consuming mimalloc as a bundled dependency inside four other packages' riscv64 wheels (Section 12). All of the RISC-V-specific functional work that would otherwise need sizing here, VA-space detection, TLS, atomic yield, and the Clang thread-pointer fix, has already landed upstream without RISE funding, between 2026-07-07 and 2026-08-18. Sizing below reflects only what remains genuinely open.

### 14.1 Functional Enablement

Essentially complete. The riscv64 port allocates correctly, and the two correctness-class bugs found in research (the SV39 VA-hint failure and the Clang/glibc thread-pointer corruption bug) are both fixed upstream. No further functional-enablement work is identified.

### 14.2 Performance Optimization

Two concrete, narrow items remain. First, investigate and fix the compiler codegen bug that forced MEMZERO16X off on riscv64 (commit `014be9ac`), this requires reproducing the bad codegen on the GCC/Clang versions used in CI and either reporting it upstream to the compiler project or finding a mimalloc-side workaround that re-enables the fast path. Second, evaluate promoting `-DMI_OPT_ARCH=rv64gcb_zacas` (or the `_zalasr` variant) to the riscv64 CMake default rather than leaving it opt-in, so that a plain `cmake ..` build on riscv64 gets the same tuned atomics/bitmanip codegen that arm64 and x64 get by default. Neither change has quantitative benchmark data to justify prioritization: no riscv64-vs-arm64 or riscv64-vs-amd64 benchmark numbers exist anywhere searched (not in mimalloc's own `bench.html`, not in the `daanx/mimalloc-bench` suite, not in any RISE blog post or the RISE optimization guide). Establishing a riscv64 baseline using mimalloc's existing `bench/` workloads on representative hardware (for example SpacemiT K3 or Milk-V Pioneer-class silicon) would be the prerequisite for sizing anything further.

### 14.3 CI/CD Infrastructure

The riscv64 CI job itself already exists and already runs the real test suite; the gap is governance, not infrastructure. Two changes would materially raise confidence: making the `alpine-riscv64` job `pull_request`-triggered rather than `dev*`/tag-only, and removing (or narrowing) `continue-on-error` for it once it has demonstrated stability. Both are organizational asks directed at the maintainer rather than engineering work; a RISE-affiliated contributor could propose this via a PR against `.github/workflows/test.yaml`, but it requires `daanx`'s buy-in to accept the stricter gating.

### 14.4 Ecosystem Enablement

Not applicable to mimalloc itself; it has no dependent package ecosystem of its own that would need separate riscv64 enablement (it is consumed via `LD_PRELOAD` or direct linking, not through a plugin or package-manager ecosystem). mimalloc's riscv64 buildability already allows it to be bundled successfully into other projects' riscv64 wheels (PyArrow, Granian, Qiskit, kiwipiepy) via RISE's `python-wheels` repo, so no additional enablement work is needed on mimalloc's side for those downstream consumers.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Diagnose and fix the compiler bug blocking MEMZERO16X on riscv64 (commit `014be9ac`) | 2 | RISE engineer with riscv64 toolchain access, coordinating with `daanx` | Medium |
| Performance | Evaluate promoting `rv64gcb_zacas`/`_zalasr` to the riscv64 CMake default | 1 | RISE contributor | Medium |
| Performance | Establish riscv64 baseline benchmarks using existing `bench/` workloads, vs arm64 and x86-64 | 1.5 | RISE engineer with access to RISC-V hardware | Medium |
| CI/CD | Propose `pull_request`-gating and remove `continue-on-error` for the riscv64 CI job | 1 | RISE contributor, needs maintainer buy-in | Low |
| Functional | None identified, all known RISC-V functional/correctness work has landed upstream | 0 | N/A | N/A |

## 15. References

- [microsoft/mimalloc repository](https://github.com/microsoft/mimalloc)
- [mimalloc homepage / API reference](https://microsoft.github.io/mimalloc/)
- [Issue #610: MI_HINT area is outside the VA range on some systems](https://github.com/microsoft/mimalloc/issues/610)
- [Issue #640: Lots of warnings due to failing to allocate aligned OS memory](https://github.com/microsoft/mimalloc/issues/640)
- [Issue #939: Unable to obtain aligned memory on RISC-V systems with an SV39 MMU](https://github.com/microsoft/mimalloc/issues/939)
- [PR #949: Skip aligned allocation on SV39 MMUs](https://github.com/microsoft/mimalloc/pull/949)
- [PR #1296: RISC-V: detect virtual address space at runtime using hwprobe (superseded)](https://github.com/microsoft/mimalloc/pull/1296)
- [PR #1299: RISC-V: detect virtual address space at runtime using hwprobe (merged)](https://github.com/microsoft/mimalloc/pull/1299)
- [PR #1305: Add RISC-V 64 TLS support and atomic yield functionality (superseded)](https://github.com/microsoft/mimalloc/pull/1305)
- [PR #1319: riscv64 TLS and atomic yield (merged, successor of #1305)](https://github.com/microsoft/mimalloc/pull/1319)
- [PR #1363: Fix RISC-V thread ID lookup](https://github.com/microsoft/mimalloc/pull/1363)
- [PR #1388: dependabot CI bump referencing vmactions/freebsd-vm riscv64 support](https://github.com/microsoft/mimalloc/pull/1388)
- [Commit d7d90c6f: add detection for riscv sv48 and sv57 mmu's](https://github.com/microsoft/mimalloc/commit/d7d90c6fce717f61ef3b290ceacfbc84aa57b873)
- [Commit d38870fa: use __builtin_thread_pointer on riscV, pr #1363 by @rui314](https://github.com/microsoft/mimalloc/commit/d38870faada8169d2becb3c09fd15ab72afed107)
- [Commit 014be9ac: disable MEMZERO16X for now on riscV (due to compiler errors)](https://github.com/microsoft/mimalloc/commit/014be9ac46a8fab538ff201714d6f2663f8696d3)
- [mimalloc test.yaml CI workflow (dev branch)](https://raw.githubusercontent.com/microsoft/mimalloc/dev/.github/workflows/test.yaml)
- [GitHub Releases for microsoft/mimalloc](https://github.com/microsoft/mimalloc/releases)
- [Ubuntu 26.04 (resolute) package search for mimalloc](https://packages.ubuntu.com/search?keywords=mimalloc&suite=resolute&searchon=names&section=all)
- [Debian buildd status for mimalloc (sid)](https://buildd.debian.org/status/package.php?p=mimalloc&suite=sid)
- [mimalloc benchmark page](https://microsoft.github.io/mimalloc/bench.html)
- [daanx/mimalloc-bench](https://github.com/daanx/mimalloc-bench)
- [RISE Project](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE post: Working Groups move their project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE RISC-V optimization guide](https://riscv-optimization-guide.riseproject.dev/)
- [Issue #1152: x86 i686 segfault in test-stress with MI_SECURE](https://github.com/microsoft/mimalloc/issues/1152)
- [Issue #343: Apple Silicon/arm64 TLS segfault](https://github.com/microsoft/mimalloc/issues/343)
- [Issue #876: slice_count overflow for very large allocations](https://github.com/microsoft/mimalloc/issues/876)