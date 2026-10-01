---
title: oneTBB
parent: Project Reports
color: orange
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: hwloc
    relation: runtime-dependency
    criticality: optional
  - name: gperftools
    relation: runtime-dependency
    criticality: optional
  - name: doctest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="onetbb" %}

# oneTBB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for oneTBB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

oneTBB (Threading Building Blocks) is a C++ task-parallel runtime library providing thread pools, work-stealing schedulers, concurrent containers, and a scalable memory allocator (tbbmalloc). It is the parallelism substrate used by several Intel oneAPI libraries, including oneDAL. It is a task-parallel scheduling/concurrency runtime, not a SIMD, compression, crypto, or numerics kernel library.

**Governance:** The project is governed by the UXL Foundation (Unified Acceleration Foundation), a Linux Foundation project, and implements the open oneAPI specification. The repository moved from [oneapi-src/oneTBB](https://github.com/oneapi-src/oneTBB) to [uxlfoundation/oneTBB](https://github.com/uxlfoundation/oneTBB); the old org is no longer a resolvable GitHub search target (issues, PRs, and docs now live under `uxlfoundation`), and the documented homepage [oneapi-src.github.io/oneTBB](https://oneapi-src.github.io/oneTBB/) redirects to the UXL Foundation's docs site. License: Apache 2.0.

**Corporate control:** Intel is the dominant contributor. All named Maintainers and Code Owners in MAINTAINERS.md except one are Intel employees:

| Name | GitHub | Affiliation | Role |
|---|---|---|---|
| Ilya Isaev | @isaevil | Intel Corporation | Code Owner |
| Alexey Kukanov | @akukanov | Intel Corporation | Code Owner |
| Konstantin Boyarinov | @kboyarinov | Intel Corporation | Maintainer |
| Aleksei Fedotov | @aleksei-fedotov | Intel Corporation | Maintainer |
| Michael Voss | @vossmjp | Intel Corporation | Maintainer |
| Dmitri Mokhov | @dnmokhov | Intel Corporation | Maintainer |
| Lukasz Plewa | @lplewa | Intel Corporation | Maintainer (tbbmalloc) |
| Olga Malysheva | @omalyshe | Intel Corporation | Code Owner / Maintainer (docs, release mgmt) |
| Alexandra Epanchinzeva | @aepanchi | Independent | Code Owner (docs) |

Governance is formally merit-based (Contributor -> Code Owner -> Maintainer, each tier requiring nomination and approval by existing titleholders per MAINTAINERS.md) but in practice almost entirely Intel-staffed. Top contributors by commit count across the full git history (145 unique contributors) are Ilya Isaev (160), Aleksei Fedotov (115), Alexandra Epanchinzeva (89), Konstantin Boyarinov (85), Olga Malysheva (78), Pavel Kumbrasev (59), and Dmitri Mokhov (52), all Intel-affiliated, plus dependabot[bot] (72, automated).

**Culture on new architecture ports:** Non-x86 port patches are accepted informally and quickly. All three merged RISC-V PRs (#917, #1053, #1086) were reviewed and approved within days by Intel's @isaevil or @kboyarinov with routine "LGTM" comments and no technical pushback. CONTRIBUTING.md states that contributions "known or suspected to break support for any currently supported hardware" are blocked, but RISC-V is not in the officially supported hardware set (see Section 3), so this protection does not formally apply to it. SUPPORT.md explicitly suggests that contributors for an unsupported platform "create a branch specifically for the unsupported platform" rather than expecting first-class support.

**RISE Project relationship:** riseproject.dev's own membership page does not list Intel, oneAPI, or the UXL Foundation as a member or sponsor; SiFive (whose employees Yun Hsiang / ElEHsiang authored PRs #1053 and #1086) is listed as a RISE Premier Member, but no evidence was found tying those PRs to RISE funding, program, or infrastructure - they read as an independent SiFive contribution. No RISE blog post (36 posts checked via the blog's sitemap, plus targeted site searches) mentions oneTBB or Threading Building Blocks. RISE's `riseproject-dev/python-wheels` repository does track riscv64 packaging of the `tbb` PyPI package (not `onetbb`, which does not exist on PyPI) via open issue [#1041 "tbb riscv64 support"](https://github.com/riseproject-dev/python-wheels/issues/1041) (opened 2026-09-06 by luhenry) and merged PR #1024, which produced a published `tbb` 2023.1.0 riscv64 wheel at [pypi.riseproject.dev/packages/tbb.html](http://pypi.riseproject.dev/packages/tbb.html). This is infrastructure/packaging work, not a blog-covered initiative, and is the only concrete RISE-oneTBB connection found.

---

## 2. Port History and Upstreaming Timeline

All RISC-V-specific work was contributed by external (non-Intel) engineers between September 2022 and April 2023, plus one still-open tangentially related PR from 2022. No further RISC-V commits have landed on `master` since April 2023.

| Date | Event | Source |
|---|---|---|
| 2022-02-14 | [Issue #776](https://github.com/uxlfoundation/oneTBB/issues/776) opened by cdluminate (Mo Zhou, Debian): build failure "`__TBB_machine_fetchadd4` was not declared in this scope" on s390x; proposes a generic-architecture fallback. | Issue #776 |
| 2022-09-24 | [PR #917](https://github.com/uxlfoundation/oneTBB/pull/917) opened by dirkmueller (SUSE), incorporating cdluminate's prior commit; supersedes earlier PR #834. Adds s390x, hppa, and riscv64 architecture detection. | PR #917 |
| 2022-10-18 | PR #917 merged (commit [`e8666c0b9cd64ebedfbaf3032412983deebc9e43`](https://github.com/uxlfoundation/oneTBB/commit/e8666c0b9cd64ebedfbaf3032412983deebc9e43)), reviewed/approved by Intel's ekovanova and kboyarinov ("LGTM"); closes #776. This is the commit that made riscv64 buildable at all. | PR #917 |
| 2022-12-09 | [PR #987](https://github.com/uxlfoundation/oneTBB/pull/987) opened by glaubitz (Debian): CMake probe for GCC's missing auto-link of `-latomic`. Not riscv64-specific in origin (modeled on a PowerPC/GCC bug), but later flagged as relevant to riscv64's 8-bit atomics (see Section 5). Still open as of this report. | PR #987 |
| 2023-03-27 | [Issue #1051 "Support RISC-V"](https://github.com/uxlfoundation/oneTBB/issues/1051) opened by ElEHsiang (Yun Hsiang, SiFive): asks whether `__TBB_USE_ITT_NOTIFY` needs to be disabled for RISC-V as it is for other non-x86 architectures. | Issue #1051 |
| 2023-03-28 to 03-29 | [PR #1053 "Disable ITT_NOTIFY for RISC-V"](https://github.com/uxlfoundation/oneTBB/pull/1053) opened and merged by ElEHsiang, approved by isaevil ("LGTM!"); closes #1051. | PR #1053 |
| 2023-04-24 to 04-27 | [PR #1086 "Add riscv64 toolchain.cmake"](https://github.com/uxlfoundation/oneTBB/pull/1086) opened and merged by ElEHsiang (commit [`e8e550e84f9ff93b8ce1bb192d8a3772f0aac94d`](https://github.com/uxlfoundation/oneTBB/commit/e8e550e84f9ff93b8ce1bb192d8a3772f0aac94d)); adds `cmake/toolchains/riscv64.cmake`. Author states the change "is verified by running tests on qemu" using SiFive's riscv-toolchain-qemu scripts. isaevil initially requested a license-header/copyright fix; author pushed 3 follow-up commits before final approval. | PR #1086 |

**Commit hash discrepancy [NEEDS VERIFICATION]:** one research pass recorded PR #1053's merge commit as `5d6c09f1d3e777719ce127364301f058bbaf2546` (signed off by Yun Hsiang), while an independent clone-based verification pass recorded it as `44505eb653b16aaee597ebf1fb97ecc5511c032e`. Both are attributed to the same PR and merge date (2023-03-29); the discrepancy was not resolved within this research and should be checked directly against the repository before being relied on for tooling that keys on commit SHA.

**Duplicate PR side-finding:** a merged commit `c828ae47`, titled identically to PR #987 ("Add cmake check for libatomic requirement when building with gcc"), same author (glaubitz) and same date (2022-12-09), was found under [PR #980](https://github.com/uxlfoundation/oneTBB/pull/980) rather than #987, on a history line not reachable from `master`. This looks like a twin/duplicate submission; it does not change the open/unmerged status of #987 itself but indicates the libatomic fix history is split across two PR numbers.

**Exact first-release version per PR could not be verified.** A dedicated verification pass attempted to determine which numbered release first shipped each of #917/#1053/#1086 by walking tag ancestry in a local clone, and found that none of the official release tags (`v2021.9.0` through `v2023.2.0-rc1`) share ancestry with `master` in either direction in that clone - they sit on a disjoint packaging-branch history. Only a non-public-facing convenience tag (`v2021.11.0-src-rc1`) contained all three commits. Specific "first shipped in vX.Y.Z" claims therefore cannot currently be substantiated and are omitted here; this needs either real GitHub API access or GitHub's own "released in" UI, neither of which was reachable in this research session. [NEEDS VERIFICATION]

**Fully upstream, informally supported:** all RISC-V-enabling changes are merged into `master` and present in current source (the toolchain file and the ITT_NOTIFY CMake guards). No out-of-tree patch is needed for a Clang-based cross-build. The outstanding gap is PR #987 (GCC libatomic auto-detection), open and unmerged for roughly four years.

---

## 3. Upstream Support Tier

oneTBB has no documented tiering policy for non-Intel architectures beyond SYSTEM_REQUIREMENTS.md's two explicit tiers ("Supported Hardware" - Intel and Intel-compatible x86 processors - and "Community-Supported Platforms" - MinGW, FreeBSD, Windows on ARM/ARM64, macOS on ARM64). RISC-V appears in neither tier.

| Indicator | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in SYSTEM_REQUIREMENTS.md | Yes (explicit, Supported Hardware) | Yes (Community-Supported) | No - absent from both tiers |
| CI runner present | Yes (`ubuntu-latest`, `windows-2025`, `macos-15-intel`, etc.) | Yes (`ubuntu-24.04-arm`, `ubuntu-22.04-arm`, `windows-11-arm`, `macos-14`/`macos-15` Apple Silicon) | No |
| Official upstream binary | Yes (`-lin.tgz`, `-mac.tgz`, `-win.zip`) | No separate binary (bundled in generic lin/mac tarball) | No |
| Upstream test suite runs | Yes | Yes | No (one-off manual QEMU run by the PR #1086 author in April 2023, never repeated in CI) |
| Cross-compilation toolchain file | Not applicable | Not applicable | Yes, `cmake/toolchains/riscv64.cmake`, unreferenced by any CI job |

**Effective tier:** RISC-V is an unofficial, community-contributed port. It compiles (via Clang cross-compilation or native GCC) and runs, but receives no upstream CI coverage, no official binaries, and no mention in SYSTEM_REQUIREMENTS.md. The only channel reaching riscv64 end users is downstream distro packaging (Section 8).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

oneTBB is a task-parallel runtime, not a code-generation or crypto library. Its architecture-specific surface is limited to spin-pause hints, atomic memory fences, bit-scan helpers, FPU control save/restore, and the (now largely dead) ITT instrumentation hooks. A direct file-by-file comparison of architecture-gated code found:

| Architecture | Files with arch-specific `#ifdef` logic | What is actually implemented |
|---|---|---|
| x86-64 (amd64) | 8: `_config.h`, `_machine.h`, `global_control.h`, `mutex.h`, `rw_mutex.h`, `src/tbb/scheduler_common.h`, `misc.cpp`, `profiling.cpp`, `tbbmalloc/frontend.cpp` | Hand asm/intrinsics: `_mm_pause()`, `lock; notb` fence, `rdtsc`-based `machine_time_stamp()` scheduling heuristic, `stmxcsr`/`fstcw` FPU save/restore, `bsr` asm in malloc bin indexing |
| aarch64/arm64 | 4: `_machine.h`, `ittnotify_config.h`, `tbbmalloc/frontend.cpp`, `TypeDefinitions.h` | One hand-tuned instruction, `isb sy` as the pause hint; everything else falls to generic code; 32-bit-only `clz`/`rsb` asm in malloc applies to `__arm__`, not aarch64 itself |
| riscv64 | 1: `src/tbb/tools_api/ittnotify_config.h` | A single enum constant, `ITT_ARCH_RISCV64 = 10`, for the ITT instrumentation layer, and even that is unreachable in built binaries (see below) |

**The one riscv64-specific source line is dead code in practice.** `src/tbb/CMakeLists.txt` (line 77) and `src/tbbmalloc/CMakeLists.txt` (line 40) exclude `riscv` from the `__TBB_USE_ITT_NOTIFY` compile definition via the regex `(armv7-a|aarch64|mips|arm64|riscv)` (per PR #1053), so the `ITT_ARCH_RISCV64` branch in `ittnotify_config.h` never compiles into a riscv64 build. Net riscv-specific code shipped in a built binary: zero lines.

Every function that branches by architecture falls through to the generic, portable path on riscv64, never a riscv-tuned one:

| Function | x86-64 | arm64 | riscv64 |
|---|---|---|---|
| `atomic_fence_seq_cst()` | Hand asm on old GCC | Generic | Generic `std::atomic_thread_fence` |
| `machine_pause()` (spin-wait hint) | `_mm_pause()` | `isb sy` inline asm | Generic `yield()` syscall, discards the delay count (see Section 6) |
| `machine_log2()` / bit-scan | Inline asm (`bsr`) on 32-bit | `__builtin_clz` | `__builtin_clz` (generic, compiler emits the correct riscv64 instruction, no functional gap) |
| `cpu_ctl_env` (FPU control save/restore) | Dedicated struct, `stmxcsr`/`fstcw` asm | Generic `fenv.h` | Generic `fenv.h` |
| `highestBitPos()` (tbbmalloc bin lookup) | `bsr` asm | `clz` asm (32-bit ARM only) | Generic static lookup table |
| `machine_time_stamp()` (scheduling heuristic) | `rdtsc`-based | Not applicable | No equivalent exists |
| TSX/RTM speculative-lock elision (`rtm_mutex.cpp`, `rtm_rw_mutex.cpp`) | Present | Absent | Absent (expected, x86-only feature) |

No `arch/riscv/` directory, no `.S` assembly files, and no RVV/vector intrinsics (`vfloat32m1_t`, `rvv`/`RVV`) exist anywhere in the tree - all confirmed by direct repo-wide search. oneTBB's atomics rely entirely on compiler `__atomic`/`std::atomic` builtins across every architecture, so it never needed hand-written per-arch atomic assembly. The ISA extensions named in the riscv64 toolchain file are `rv64imafd_zba_zbb` (base integer/mul/atomic/float/double plus the Zba and Zbb bit-manipulation extensions), with no `V` (vector) and no `Zihintpause`.

**Verdict:** riscv64 "support" in oneTBB consists of a CMake cross-toolchain file plus a regex entry that lets the generic/portable code path compile - not a ported or tuned backend. This is not a broken stub (nothing throws `not implemented`, there is no `#error` for riscv64), and the library should function correctly on riscv64 because it rides entirely on portable C++/libc paths that are correct everywhere. But it has no riscv64-specific implementation anywhere, and with zero CI coverage, nothing would catch a future regression (e.g., a change to the `CMAKE_SYSTEM_PROCESSOR` regex, or new code assuming only `__TBB_x86_64`/`__aarch64__` exist).

---

## 5. Build System, Cross-Compilation, and Toolchain

### Cross-compilation toolchain file

`cmake/toolchains/riscv64.cmake`, added by [PR #1086](https://github.com/uxlfoundation/oneTBB/pull/1086), unchanged since creation (`git diff` against the merge commit is empty; the file has exactly one commit in its history):

```cmake
# Copyright (c) 2023 Intel Corporation
# Licensed under the Apache License, Version 2.0

if (RISCV_TOOLCHAIN_INCLUDED)
    return()
endif()
set(RISCV_TOOLCHAIN_INCLUDED TRUE)

set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_VERSION 1)
set(CMAKE_SYSTEM_PROCESSOR riscv)

set(CMAKE_C_COMPILER ${CMAKE_FIND_ROOT_PATH}/bin/riscv64-unknown-linux-gnu-clang)
set(CMAKE_CXX_COMPILER ${CMAKE_FIND_ROOT_PATH}/bin/riscv64-unknown-linux-gnu-clang++)
set(CMAKE_LINKER ${CMAKE_FIND_ROOT_PATH}/bin/riscv64-unknown-linux-gnu-ld)

set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)

# Most linux on riscv64 support rv64imafd_zba_zbb extensions
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=rv64imafd_zba_zbb -mabi=lp64d " CACHE INTERNAL "")
```

The file targets Clang exclusively (`riscv64-unknown-linux-gnu-clang`/`clang++`), using the SiFive prebuilt-toolchain naming convention, not the Linux distro multiarch triplet (`riscv64-linux-gnu-gcc`). No GCC cross-compiler variant is provided by this file.

### Build command

```bash
mkdir build && cd build
cmake \
  -DCMAKE_TOOLCHAIN_FILE=<repo_root>/cmake/toolchains/riscv64.cmake \
  -DCMAKE_FIND_ROOT_PATH=/path/to/riscv64-toolchain-root \
  -DTBB_TEST=OFF \
  <repo_root>
cmake --build . -j$(nproc)
```

This invocation is inferred directly from the toolchain file's own `${CMAKE_FIND_ROOT_PATH}` references and comment; the project's actual build documentation, `cmake/README.md` ("Build System Description" - there is no `BUILDING.md`), has zero mentions of `riscv`, `toolchain`, `cross`, or `CMAKE_FIND_ROOT_PATH`, so no written tutorial exists for this path. `-DTBB_TEST=OFF` is the project's own documented example (`INSTALL.md`) for disabling tests during cross/non-native configuration. `-DTBB_DISABLE_HWLOC_AUTOMATIC_SEARCH=ON` is auto-set when `CMAKE_CROSSCOMPILING` is true, but an explicit override is advisable since pkg-config-based hwloc discovery otherwise assumes a native/sysroot-matched library.

### QEMU testing

PR #1086's author verified the change "by running tests on qemu" using SiFive's `riscv-toolchain-qemu` scripts, i.e. `CMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64;-L;/path/to/sysroot/lib"`, which makes `ctest` wrap each test binary with the emulator. This was a one-time manual verification in April 2023, not a repeated or automated process: no Dockerfile for riscv64 exists anywhere in the repository (confirmed: no `docker/` or `.ci/docker/` directory, no file matching `*dockerfile*`), and `git grep -i qemu` across the whole tree returns zero riscv/QEMU-related hits outside this one historical PR.

### Known build failure: GCC + libatomic (PR #987, open ~4 years)

GCC-based builds on riscv64 (and other architectures) can fail at link time with errors such as `undefined reference to '__atomic_fetch_sub_8'` because GCC does not auto-link `-latomic` for certain atomic widths. [PR #987](https://github.com/uxlfoundation/oneTBB/pull/987), opened 2022-12-09 by glaubitz (Debian), adds a CMake compile-time probe to detect this and link `-latomic` automatically. It remains open and contested:

1. pavelkumbrasev (Intel, Jan 2023) objected that the probe "looks like an attempt to guess missing functionality" and questioned whether the compiler could optimize the test code away, giving a false negative; proposed an alternative minimal test.
2. glaubitz tested that alternative and reported it did not actually exercise 64-bit atomics, so it passed even without `-latomic`.
3. The exchange continued into a disagreement about test minimality/correctness that was never fully resolved on technical grounds.
4. barracuda156 (Feb 2023) asked for it to be merged; glaubitz (May 2023) responded "I don't think this will ever get merged," signaling the PR was effectively stalled.
5. pavelkumbrasev (May 2023) re-engaged, asked for a documentation comment, and explicitly pinged isaevil (Intel) for a decision.
6. isaevil (Jun 2023) reviewed and suggested simplifying the test to a single `uint64_t` atomic check with a comment citing [GCC bug 81358](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=81358). **This suggested change was never incorporated into the PR** and remains the last unaddressed reviewer request.
7. chewi (Jul 2024) reported "Gentoo is now applying this patch in its package," confirming real downstream demand despite non-merge.
8. barracuda156 (Jan 2026, most recent activity) commented that 8-bit atomics specifically may be the relevant case for riscv64, versus 64-bit for powerpc/arm - the first and only riscv64-specific contribution to this thread; the PR itself originated as a PowerPC/GCC-bug workaround, not a riscv64 feature.

Net effect: GCC-toolchain riscv64 users must manually pass `-latomic`:

```bash
cmake ... \
  -DCMAKE_EXE_LINKER_FLAGS="-latomic" \
  -DCMAKE_SHARED_LINKER_FLAGS="-latomic"
```

Debian and Gentoo instead carry PR #987 as a local distro patch, which is the specific fact that drives this project's "downstream-only" (orange) grade rather than a clean-build (yellow) grade - see Section 13.

### Compiler requirements

SYSTEM_REQUIREMENTS.md's general (x86-oriented) table lists GCC 8.x-16.x and Clang 7.x-22.x, with glibc 2.28-2.43; RISC-V is entirely absent from Supported Hardware, Supported OS, and Community-Supported Platforms sections. No riscv64-specific minimum compiler version is stated anywhere in the repository. The `-march=rv64imafd_zba_zbb` flag implies the compiler must support the Zba/Zbb bit-manipulation extensions, which is a reasonably modern requirement, but the repository offers no explicit minimum or rationale beyond the toolchain file's own comment, "Most linux on riscv64 support rv64imafd_zba_zbb extensions." [NEEDS VERIFICATION]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

| Feature | amd64 | arm64 | riscv64 | Impact |
|---|---|---|---|---|
| VTune / ITT instrumentation | Yes | No | No (disabled at build time by PR #1053) | No profiling hooks with Intel tools; deliberate exclusion, not a defect |
| TSX/RTM speculative lock elision | Yes | No | No | Not applicable outside x86 |
| Dedicated `__TBB_riscv64` architecture macro | Not applicable | Not applicable | Missing | Future riscv64-specific optimizations have no clean macro to gate on; a prerequisite change |

### Performance gaps

**Spin-pause / `machine_pause` is the single most impactful gap.** `machine_pause(delay)` in `include/oneapi/tbb/detail/_machine.h` implements exponential backoff for spin-wait loops in the work-stealing scheduler, concurrent queue operations, and mutex contention:

- amd64: `_mm_pause()` (SSE2 PAUSE instruction, nanosecond-scale, reduces SMT speculation pressure)
- arm64: `"isb sy"` inline asm (memory-barrier/yield hint, nanosecond-scale)
- riscv64: `(void)delay; yield();` - discards the delay count entirely and unconditionally calls `sched_yield()` (microsecond-scale, an OS context switch)

This collapses exponential backoff into an immediate OS yield on every spin iteration. The RISC-V Zihintpause extension's `pause` hint instruction (ratified in the base v1.0 spec) is not used anywhere, and is not even part of the toolchain file's `-march` string. The regression is most visible in high-contention, spin-intensive workloads; no benchmark data quantifying this exists in any source found (see below). No GitHub issue tracks this gap.

### Benchmark data

No published performance-benchmark numbers for oneTBB on RISC-V hardware were found in any source: not on GitHub, not via general web search, not in academic literature, and not on the RISE blog. Academic RISC-V HPC papers that do exist (e.g. arXiv 2406.12394, characterizing the 64-core SG2042 RISC-V CPU, reporting 2.6x-16.7x single-core improvement over other RISC-V solutions on compute-bound code but losing relative ground on memory-bandwidth-bound workloads) use the NAS Parallel Benchmark suite or RAJAPerf, not oneTBB. [uxlfoundation/oneTBB issue #1021](https://github.com/uxlfoundation/oneTBB/issues/1021), an open question from 2023 asking which benchmark suites are suggested for oneTBB generally, has no replies and no architecture-specific data. Data not available: oneTBB-specific riscv64 throughput/latency/scalability numbers on any hardware.

### Floating-point / NaN semantics

No RISC-V-specific NaN or floating-point correctness bugs were identified against oneTBB. This is expected: oneTBB performs no floating-point computation itself; it is a scheduling and concurrency library, and FPU control save/restore on riscv64 uses the generic `fenv.h` path shared with arm64.

### Security hardening

No RISC-V-specific security hardening gaps were identified. oneTBB does not use custom stack management or JIT code generation; standard compiler-provided mitigations apply uniformly across architectures.

---

## 7. CI/CD Infrastructure

All 7 workflow files in `.github/workflows/` (`abi.yml`, `ci.yml`, `codeql.yml`, `coverity.yml`, `issue_labeler.yml`, `labeler.yml`, `ossf-scorecard.yml`) were grepped directly, case-insensitively, for `riscv`/`riscv64`/`RISCV`: zero hits in any file, confirmed independently across two separate research passes on the same commit (`e8060251ebaf4a4e1b355abab0d42a7f809b0e90`). Related `.github/` config (`actions/abi-check/action.yml`, `labeler.yml`, `dependabot.yml`, `issue_labeler.yml`) was also checked with the same result. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or Azure Pipelines config exists anywhere in the repository.

`cmake/toolchains/riscv64.cmake` is an orphaned file: a repo-wide grep for the literal string `riscv64.cmake` returns zero hits anywhere, including in every workflow - nothing ever points `CMAKE_TOOLCHAIN_FILE` at it, passes `--toolchain`, or references it in a CI matrix entry.

| CI capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions native runner | Yes (`ubuntu-latest`, `ubuntu-22.04`, `windows-2025`, `macos-14`/`macos-15-intel`) | Yes (`ubuntu-24.04-arm`, `ubuntu-22.04-arm`, `windows-11-arm`, `macos-14`/`macos-15` Apple Silicon) | No |
| QEMU emulation in CI | No | No | No |
| Build tested in CI | Yes | Yes | No |
| Test suite runs in CI | Yes | Yes | No (one-off manual QEMU run by a contributor in April 2023; never repeated) |
| CodeQL analysis | Yes | No | No |
| Coverity scan | Yes | No | No |
| RISE CI runners | No | No | No (not used for oneTBB itself; RISE runner infrastructure exists for other projects per riseproject.dev, but no evidence ties it to oneTBB) |

**Verdict: riscv64 has zero CI coverage.** This is the primary fact behind the "fails the CI-build/test/release bar for blue or green" element of this project's readiness grade (Section 13). Regressions on riscv64 will not be caught automatically, and the cross-compilation toolchain file is exercised only by whoever runs it manually.

---

## 8. Distribution and Release Status

### Upstream GitHub releases

[github.com/uxlfoundation/oneTBB/releases](https://github.com/uxlfoundation/oneTBB/releases) ships exactly three generic platform archives per release: `oneapi-tbb-<version>-lin.tgz`, `-mac.tgz`, and `-win.zip`. No riscv64 or other per-architecture asset exists in any release inspected. The latest release found via direct page fetch was v2023.1.0, carrying only these three assets; note that a separate tags-page fetch produced internally inconsistent release dates for older tags (e.g., an implausible "Sep 29, 2026" date on `v2021.13.4`), which looks like a fetch/summarization artifact rather than real data, so exact version/date fields beyond the asset-filename finding should be treated with caution. [NEEDS VERIFICATION]

### PyPI

The package name `onetbb` does not exist on PyPI (`pypi.org/pypi/onetbb/json` returns HTTP 404). The actual upstream Python package is named `tbb`; its PyPI releases (2022.3.0 through 2023.1.0) ship only `manylinux_2_28_x86_64`, `win_amd64`, and older `i686`/`win32`/`macosx` wheels - zero riscv64 wheels from upstream.

### RISE wheel builder

RISE's `python-wheels` project (separate from the `pypi.riseproject.dev` package index) **does** publish a riscv64 wheel for the `tbb` package: version 2023.1.0, Apache-2.0, sourced from [uxlfoundation/oneTBB](https://github.com/uxlfoundation/oneTBB), installable via `pip install tbb --index-url https://pypi.riseproject.dev/simple/`, with the release artifact at [riseproject-dev/python-wheels tbb-v2023.1.0-20260906121917](https://github.com/riseproject-dev/python-wheels/releases/tag/tbb-v2023.1.0-20260906121917) and tracked by [python-wheels issue #1041](https://github.com/riseproject-dev/python-wheels/issues/1041) / PR #1024. This package is not listed on the separate `riseproject.gitlab.io/python/wheel_builder/` page, and TBB is also bundled as a transitive dependency inside other RISE-built wheels (`usd-core`, `openvino`). This wheel is downstream of the `tbb` PyPI name, not `onetbb`, and is a different release channel from the GitHub-release/distro-package channels this project's readiness grade is based on.

### Distro packages

| Distro | Package(s) | Version | riscv64 status |
|---|---|---|---|
| Debian sid | `libtbb12`, `libtbb-dev`, `libtbbmalloc2`, `libtbbbind-2-5` (source: `onetbb`) | 2022.3.0-2 | "Installed" on buildd host rv-osuosl-05 |
| Ubuntu 22.04 LTS | `libtbb12`, `libtbb-dev`, `libtbbmalloc2` | 2021.5.0-7ubuntu2 | Available for riscv64 |
| Ubuntu 24.04 LTS | `libtbb12`, `libtbb-dev`, `libtbbbind-2-5`, `libtbbmalloc2` | 2021.11.0-2ubuntu2 | Available for riscv64 (SHA256 confirmed in package metadata) |
| Ubuntu 26.04 "resolute" | `libtbb12`, `libtbb-dev`, `libtbbbind-2-5`, `libtbbmalloc2` (source: `onetbb`) | 2022.3.0-2 | See discrepancy note below |
| Arch Linux RISC-V port | `onetbb`/`tbb` | n/a | Not ported - confirmed absent from [archriscv.felixc.at](https://archriscv.felixc.at/) in a direct check, correcting an earlier "unparseable" finding |

**Ubuntu 26.04 "resolute" discrepancy [NEEDS VERIFICATION]:** one research pass searched `packages.ubuntu.com` by binary-package keyword `libtbb` in suite `resolute` and found `libtbb-dev`, `libtbb-doc`, `libtbb12`, `libtbbbind-2-5`, `libtbbmalloc2` listed, with the `libtbb12` detail page showing a riscv64 download link returning HTTP 200 ([packages.ubuntu.com/resolute/libtbb12](https://packages.ubuntu.com/resolute/libtbb12)), and the source package page confirming source package name `onetbb`. A later adversarial verification pass instead searched by the literal keyword `onetbb` in suite `resolute` and got "Sorry, your search gave no results." Ubuntu's package-name search generally matches binary package names, not source package names, which could explain why searching `onetbb` (the source name) finds nothing while searching `libtbb` (the binary names) succeeds - but this reconciliation was not conclusively confirmed within this research, so both results are reported here rather than treated as settled. This project's readiness grade (Section 13) relies on the `libtbb12`/riscv64/`resolute` finding being correct.

**What a user must do to get a working binary:** install from Debian or Ubuntu packages (`apt install libtbb-dev`), or cross-compile from source using the SiFive Clang toolchain and `cmake/toolchains/riscv64.cmake`, manually adding `-latomic` linker flags if using GCC instead of Clang. No prebuilt binary from upstream UXL Foundation/Intel exists for riscv64 via any official channel (GitHub Releases, PyPI, or otherwise).

---

## 9. Dependencies

| Dependency | Role | Relation | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|---|
| glibc | C library runtime (pthreads via `find_package(Threads REQUIRED)`, the only hard CMake dependency; `fenv.h` FPU control) | runtime-dependency | critical | Fully supported | Tested via glibc itself | Present on all riscv64 Linux distros | No riscv64-specific issues found |
| GCC | Compiler and runtime library (libatomic); required for 8-bit atomic linking on riscv64 | runtime-dependency | critical | Required, not auto-linked (see PR #987) | Not exercised by upstream CI | Available on all riscv64 distros | [PR #987](https://github.com/uxlfoundation/oneTBB/pull/987) (CMake libatomic detection) open and unmerged since Dec 2022; downstream (Debian, Gentoo) carry it as a local patch - this is the specific fact driving the orange/downstream-only grade |
| LLVM | Clang cross-compiler named by `cmake/toolchains/riscv64.cmake` (`riscv64-unknown-linux-gnu-clang`/`clang++`); the only compiler family the toolchain file supports | build-dependency | critical | Required for the documented cross-compile path | N/A (build tool) | Available via SiFive and generic LLVM riscv64 cross-toolchain distributions | No minimum version documented in-repo; Zba/Zbb codegen requires a reasonably modern LLVM [NEEDS VERIFICATION] |
| CMake | Build system; `cmake_minimum_required(VERSION 3.5.0...3.31.3)` at top level, no riscv64-specific minimum | build-dependency | critical | Architecture-agnostic | N/A | Ships on riscv64 distros | No issues found |
| QEMU | User-mode emulation (`qemu-riscv64`) used to run the cross-compiled test suite via `CMAKE_CROSSCOMPILING_EMULATOR` | test-dependency | critical | N/A | Used only in the one-off manual verification for PR #1086; never wired into CI | N/A | Not referenced anywhere in `.github/workflows/`; confirmed via repo-wide `qemu` grep (zero hits outside documentation of the historical manual run) |
| hwloc | Optional NUMA-aware task scheduling for `src/tbbbind` (pkg-config search, gated by `TBB_DISABLE_HWLOC_AUTOMATIC_SEARCH`) | runtime-dependency | optional | Builds on riscv64 | Partial | Debian sid riscv64 package | [open-mpi/hwloc#650](https://github.com/open-mpi/hwloc/issues/650) "get RISC-V CPU info on Linux," open, milestone "Future" - affects NUMA topology completeness, not correctness; most current riscv64 SBCs lack NUMA entirely, which also triggers oneTBB's own [issue #2039](https://github.com/uxlfoundation/oneTBB/issues/2039) (Section 11) |
| gperftools | Optional alternative allocator (tcmalloc) | runtime-dependency | optional | Builds with generic fallback | No riscv64 CI | Available in Debian | oneTBB issue #1278: generic stacktrace path is slower than the x86-specific path - a profiling-quality gap, not a correctness one |
| doctest | Header-only test framework used by the test suite | test-dependency | optional | Architecture-agnostic (header-only) | Used in-tree | No packaging concern (header-only) | No issues found |

**Indirect/recursed dependency - libatomic:** GCC's runtime library `libatomic` is the specific sub-dependency behind the PR #987 gap: riscv64 needs it explicitly linked for 8-bit atomics under GCC (per barracuda156's Jan 2026 PR comment), distinct from the 64-bit-atomic case that drives the same GCC bug on 32-bit PowerPC/ARM. This is the root cause of the "patched-distribution floor" that produces this project's orange grade (Section 13).

**ITT notify / ittapi** (VTune instrumentation) is deliberately excluded from this table: it is disabled at build time for riscv64 by PR #1053 and is not a real runtime dependency on this architecture.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #987](https://github.com/uxlfoundation/oneTBB/pull/987) | Add cmake check for libatomic requirement when building with gcc | Open (since Dec 2022, ~4 years) | High (build) | GCC-based riscv64 builds fail at link without `-latomic`; stalled since isaevil's unaddressed Jun 2023 review request; Debian and Gentoo apply it as a distro patch; the direct driver of this project's orange grade |
| [#2039](https://github.com/uxlfoundation/oneTBB/issues/2039) | Tests `conformance_arena_constraints` fail on machine without NUMA | Open (Apr 2026) | Medium | `numa_info.index` returns -1 while `numa_id` is 0 on no-NUMA systems; most current RISC-V SBCs are no-NUMA; affects `src/tbbbind/tbb_bind.cpp` |
| [#1454](https://github.com/uxlfoundation/oneTBB/issues/1454) | armel: undefined reference to `__atomic_fetch_add_8@@LIBATOMIC_1.0` | Open (Jul 2024) | Medium (armel) | 32-bit ARM linking bug of the same root-cause class as PR #987; the report explicitly states riscv64 is NOT affected ("armhf, arm64, mips, powerpc, riscv, s390x etc do not have this problem") |
| [#1021](https://github.com/uxlfoundation/oneTBB/issues/1021) | Which benchmark suites are suggested to run with TBB? | Open (2023) | Low | No replies, no data; confirms the absence of an established oneTBB benchmark methodology on any architecture, including riscv64 |
| [#2023](https://github.com/uxlfoundation/oneTBB/issues/2023) | Investigate performance regressions caused by #1779 | Open (Mar 2026) | Medium | Scheduler performance regression, reverted via #2022; not architecture-specific |
| [#1913](https://github.com/uxlfoundation/oneTBB/issues/1913) | Relative performance of `affinity_partitioner` doesn't match documentation | Open (Nov 2025) | Low | Documentation issue, reference chart dates to 2009; not riscv64-specific but relevant to any cross-architecture performance comparison |

**No correctness bugs specific to riscv64 were found.** The one open "riscv" lexical match among GitHub issues (#1454) is an armel bug that explicitly excludes riscv64. Searching `is:open label:riscv` on the repository returns zero results, and no RISC-V NaN/floating-point bug exists in oneTBB (confirmed against general RISC-V NaN-boxing bug trackers elsewhere, e.g. Valgrind, CVA6, GCC, none of which reference oneTBB).

**Untracked gap:** the `machine_pause()` degeneration to `sched_yield()` on riscv64 (Section 6) has no corresponding GitHub issue.

---

## 12. Objections and Upstream Blockers

**No objection has ever blocked a riscv64-specific PR.** All three riscv64-focused changes (#917, #1053, #1086) were approved and merged within days of being opened by Intel's @isaevil or @kboyarinov with routine "LGTM" reviews and no technical debate.

**PR #987 (the open libatomic fix) does have a stated, substantive technical objection**, which corrects any characterization of it as merely "stalled without pushback": Intel's @pavelkumbrasev raised a concrete correctness concern in January 2023 - that the CMake atomic-detection probe "looks like an attempt to guess missing functionality" and might be optimized away by the compiler, producing a false negative - and this was never fully resolved on technical grounds even after the author (glaubitz) cited MariaDB's precedent for the same mechanism. Separately, @isaevil's June 2023 review requested a specific simplification (a single `uint64_t` atomic test plus a comment referencing [GCC bug 81358](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=81358)); that request was never incorporated into the PR and remains the last unaddressed ask. No maintainer has approved or merged the PR since.

**Organizational blockers:**

- Intel controls all Maintainer and Code Owner seats. Any improvement to the riscv64 performance path (e.g. the spin-pause fix in Section 6) touches a core header (`_machine.h`) and will require Intel engineer review.
- PR #987's nearly four-year stall demonstrates that infrastructure fixes for non-Intel architectures can stall indefinitely even without an outright "no," simply through unaddressed review comments and no reviewer follow-through.

**Technical blockers:**

- No `__TBB_riscv64` macro exists in `_config.h`, so there is no clean way to add riscv64-specific code paths without first adding this macro as a prerequisite change.
- No riscv64 CI means any submitted riscv64 performance patch carries the full burden of proof via the contributor's own QEMU or hardware testing, with no automated regression safety net afterward.

**Acceptance probability for well-formed patches remains high** based on the track record of #917, #1053, and #1086 - Intel maintainers accept clearly scoped non-x86 patches that do not break existing architectures and come with test evidence, even QEMU-based. The libatomic fix specifically has an identified, narrow path to merging: a re-post addressing isaevil's unactioned June 2023 simplification request.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

oneTBB has zero riscv64 upstream CI: none of the 7 GitHub Actions workflows in `.github/workflows/` reference riscv64 or QEMU (Section 7), and it ships no riscv64 release asset from GitHub Releases, only generic lin/mac/win tarballs (Section 8), so the project fails the CI-build/test/release bar required for a blue or green grade. It reaches riscv64 users only through downstream Debian/Ubuntu packages (e.g. [packages.ubuntu.com/resolute/libtbb12](https://packages.ubuntu.com/resolute/libtbb12), source package `onetbb`), and those are not clean, unpatched builds: upstream's own CMake libatomic-detection fix, [PR #987](https://github.com/uxlfoundation/oneTBB/pull/987), has sat open and unmerged since December 2022, with a January 2026 reviewer comment confirming it is specifically needed for riscv64 8-bit atomics under GCC, so Debian and Gentoo carry it as a local distro patch. This triggers the patched-distribution floor (orange, downstream-only) rather than the clean-build floor (yellow). oneTBB is a task-parallel scheduling/concurrency runtime, not a SIMD/compression/crypto/numerics speed library, so no optimization-purpose modifier applies to this grade, and no Optimization level is reported.

**Pending work that could change the grade:** [PR #987](https://github.com/uxlfoundation/oneTBB/pull/987) (CMake libatomic detection for GCC on riscv64/ppc32) remains open and unmerged after roughly four years; merging it would remove the need for the downstream riscv64 patch and could support a future reclassification toward yellow (clean-distro-build). No open PR or issue proposes adding riscv64 to upstream CI, and the tracking issue ([#1051](https://github.com/uxlfoundation/oneTBB/issues/1051), "Support RISC-V") was closed in 2023 after only the ITT_NOTIFY fix landed, so there is no active upstream push to add riscv64 CI or releases. The RISE-funded riscv64 wheel for the `tbb` PyPI package (Section 8) is a separate, Python-packaging-only channel and does not itself change the upstream CI/release picture this grade is based on.

---

## 14. Investment Analysis

RISE has not funded upstream oneTBB engineering. The riscv64 port itself (#917, #1053, #1086) was contributed independently by SiFive and SUSE/Debian engineers, with no evidence of RISE program involvement. The one confirmed RISE-funded item is downstream: a riscv64 Python wheel for the `tbb` PyPI package, tracked by [riseproject-dev/python-wheels issue #1041](https://github.com/riseproject-dev/python-wheels/issues/1041) / PR #1024, published 2026-09-06. That work is complete and should not be resized below.

### 14.1 Functional Enablement

**libatomic auto-detection (PR #987):** the fix exists but is stalled on an unaddressed reviewer request. Re-posting a clean PR that incorporates @isaevil's June 2023 ask - simplify to a single `uint64_t` atomic test and add a "Workaround for GCC bug 81358" comment - has a real path to acceptance given @pavelkumbrasev's own May 2023 "let's try to move with this one" comment. This is the single highest-leverage item: merging it removes the distro-patch dependency that is the direct cause of the current orange grade. Effort: 0.5 person-weeks.

### 14.2 Performance Optimization

**Spin-pause hint (Zihintpause):** add a `__riscv` branch to `machine_pause()` in `include/oneapi/tbb/detail/_machine.h` using the RISC-V Zihintpause `pause` hint, gated on `__riscv_zihintpause`. Requires: (1) adding a `__TBB_riscv64` macro to `_config.h` as a prerequisite, since no such macro currently exists; (2) the `machine_pause()` branch itself; (3) updating the toolchain file's `-march` string to include `_zihintpause`; (4) QEMU- or hardware-based benchmark data showing improvement in spin-heavy microbenchmarks, since none currently exists for oneTBB on RISC-V anywhere (Section 6). Effort: 2-3 person-weeks including benchmark development and review cycle.

**Scheduler topology (hwloc#650):** this is an upstream hwloc issue, not an oneTBB one. Any investment should target [open-mpi/hwloc](https://github.com/open-mpi/hwloc) directly; out of scope for oneTBB engineering.

### 14.3 CI/CD Infrastructure

**Add a riscv64 QEMU-based CI job to `.github/workflows/ci.yml`:** a matrix entry using a riscv64 Docker container with `qemu-user-static`, cross-compiling with the existing (currently orphaned) toolchain file and running the test suite under emulation. This is the only way to close the "zero riscv64 CI" gap identified in Section 7 and is a prerequisite for any future yellow/green reclassification independent of the PR #987 fix. Effort: 1.5-2 person-weeks, including identifying a suitable base image and negotiating added CI time/cost with Intel maintainers, who control the CI budget and currently run only native GitHub-hosted runners.

### 14.4 Ecosystem Enablement

oneTBB has no significant dependent package ecosystem of its own requiring riscv64-specific enablement work: it is a C++ runtime library, not a package-index hub. Its Python binding (`tbb` on PyPI) already has a working RISE-funded riscv64 wheel (Section 8), so no further packaging investment is indicated there. Section 10 is omitted per this report's scope (system libraries and runtimes with no dependent package ecosystem do not require it).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Re-post PR #987 addressing isaevil's unaddressed Jun 2023 review (simplify to `uint64_t` test, add workaround comment) | 0.5 | RISC-V ecosystem engineer | Critical |
| Performance | Add `__TBB_riscv64` macro to `_config.h` (prerequisite for riscv64-specific code paths) | 0.5 | RISC-V ecosystem engineer | High |
| Performance | Implement Zihintpause `machine_pause()` for riscv64, with benchmark data | 2-2.5 | RISC-V ecosystem engineer | High |
| CI/CD | Add QEMU-based riscv64 CI job to `ci.yml`, wiring up the orphaned `riscv64.cmake` toolchain file | 1.5-2 | RISC-V ecosystem engineer | Medium |
| Performance | Update `riscv64.cmake` march string to include `_zihintpause` | 0.5 | RISC-V ecosystem engineer | Medium (bundled with spin-pause work) |

**Total estimated investment: approximately 5-6 person-weeks**, concentrated on two items that would directly change the readiness grade: merging PR #987 (removes the downstream-patch dependency) and adding riscv64 CI (removes the "zero CI" disqualifier for blue/green).

---

## 15. References

- [oneTBB repository (uxlfoundation, canonical)](https://github.com/uxlfoundation/oneTBB)
- [oneTBB repository (oneapi-src, legacy, redirects)](https://github.com/oneapi-src/oneTBB)
- [oneTBB homepage](https://oneapi-src.github.io/oneTBB/)
- [Issue #776 - undefined `__TBB_machine_fetchadd4` on s390x](https://github.com/uxlfoundation/oneTBB/issues/776)
- [PR #917 - Add s390x, hppa and riscv64 architecture detection](https://github.com/uxlfoundation/oneTBB/pull/917)
- [PR #917 merge commit](https://github.com/uxlfoundation/oneTBB/commit/e8666c0b9cd64ebedfbaf3032412983deebc9e43)
- [PR #987 - Add cmake check for libatomic requirement when building with gcc](https://github.com/uxlfoundation/oneTBB/pull/987)
- [PR #980 - duplicate libatomic submission](https://github.com/uxlfoundation/oneTBB/pull/980)
- [Issue #1051 - Support RISC-V](https://github.com/uxlfoundation/oneTBB/issues/1051)
- [PR #1053 - Disable ITT_NOTIFY for RISC-V](https://github.com/uxlfoundation/oneTBB/pull/1053)
- [PR #1086 - Add riscv64 toolchain.cmake](https://github.com/uxlfoundation/oneTBB/pull/1086)
- [PR #1086 merge commit](https://github.com/uxlfoundation/oneTBB/commit/e8e550e84f9ff93b8ce1bb192d8a3772f0aac94d)
- [Issue #1454 - armel: undefined reference to `__atomic_fetch_add_8`](https://github.com/uxlfoundation/oneTBB/issues/1454)
- [Issue #1021 - Which benchmark suites are suggested to run with TBB?](https://github.com/uxlfoundation/oneTBB/issues/1021)
- [Issue #2039 - Tests conformance_arena_constraints fail on machine without NUMA](https://github.com/uxlfoundation/oneTBB/issues/2039)
- [Issue #1913 - Relative performance of affinity_partitioner doesn't match documentation](https://github.com/uxlfoundation/oneTBB/issues/1913)
- [Issue #2023 - Investigate performance regressions caused by #1779](https://github.com/uxlfoundation/oneTBB/issues/2023)
- [Issue #1278 - gperftools generic stacktrace path slower than x86](https://github.com/uxlfoundation/oneTBB/issues/1278)
- [open-mpi/hwloc issue #650 - get RISC-V CPU info on Linux](https://github.com/open-mpi/hwloc/issues/650)
- [GCC bug 81358 - libatomic not auto-linked](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=81358)
- [Ubuntu 26.04 "resolute" libtbb12 package page](https://packages.ubuntu.com/resolute/libtbb12)
- [Ubuntu "resolute" onetbb source package page](https://packages.ubuntu.com/source/resolute/onetbb)
- [Ubuntu 24.04 libtbb12 package](https://packages.ubuntu.com/noble/libtbb12)
- [Debian tracker: onetbb](https://tracker.debian.org/pkg/onetbb)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/)
- [PyPI: tbb package](https://pypi.org/pypi/tbb/json)
- [pypi.riseproject.dev: tbb package page](http://pypi.riseproject.dev/packages/tbb.html)
- [riseproject-dev/python-wheels issue #1041 - tbb riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/1041)
- [riseproject-dev/python-wheels tbb riscv64 wheel release](https://github.com/riseproject-dev/python-wheels/releases/tag/tbb-v2023.1.0-20260906121917)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [arXiv 2406.12394 - Performance characterisation of the 64-core SG2042 RISC-V CPU for HPC](https://arxiv.org/pdf/2406.12394)