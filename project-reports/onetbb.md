---
title: oneTBB
parent: Project Reports
categories:
  - libraries
---

# oneTBB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for oneTBB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

oneTBB (Threading Building Blocks) is a C++ task-parallel runtime library providing thread pools, work-stealing schedulers, concurrent containers, and a scalable memory allocator (tbbmalloc). It is the parallelism substrate for several Intel oneAPI libraries, including oneDAL.

**Governance:** The project is governed by the UXL Foundation (Unified Acceleration Foundation), a Linux Foundation project. The repository moved from `oneapi-src/oneTBB` to [uxlfoundation/oneTBB](https://github.com/uxlfoundation/oneTBB). The UXL Foundation steering committee includes Arm, Fujitsu, Google Cloud, Imagination Technologies, Intel, Qualcomm, and Samsung.

**Corporate control:** Intel is the dominant contributor. All listed maintainers in MAINTAINERS.md are Intel employees:
- Konstantin Boyarinov (@kboyarinov) - Maintainer
- Aleksei Fedotov (@aleksei-fedotov) - Maintainer
- Michael Voss (@vossmjp) - Maintainer
- Dmitri Mokhov (@dnmokhov) - Maintainer
- Lukasz Plewa (@lplewa) - TBBMALLOC Maintainer
- Olga Malysheva (@omalyshe) - Release Maintainer
- Ilya Isaev (@isaevil) - Code Owner (Build/Infra)
- Alexey Kukanov (@akukanov) - Code Owner (Core/API)

One documentation co-owner (Alexandra Epanchinzeva, @aepanchi) is listed as independent. The Bazel build owner (@Vertexwahn) is also community.

**Culture on new architecture ports:** Non-x86 port patches are accepted informally. Both RISC-V PRs (#917 and #1086) received single-reviewer "LGTM!" approvals from Intel's @isaevil with minimal technical discussion. No formal architecture addition process or tiering review is documented. The CONTRIBUTING.md states that contributions breaking "any currently supported hardware" are blocked, but RISC-V is not in the officially supported set, so there is no formal protection for RISC-V regressions.

**RISE membership:** oneTBB is not a RISE-funded project. All 27 RISE blog posts (May 2024 through June 2026) were checked; none reference oneTBB or Threading Building Blocks. The RISE wheel builder package list (85 packages) does not include oneTBB.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work was contributed by a single engineer from SiFive (Yun Hsiang, yun.hsiang@sifive.com) between October 2022 and April 2023. No follow-on commits to the RISC-V support have been made since April 2023.

| Date | Event | Source |
|---|---|---|
| 2022-10-18 | [PR #917](https://github.com/oneapi-src/oneTBB/pull/917) merged: added riscv64 to architecture detection in build system. Authors: Dirk Muller (SUSE), Mo Zhou. Merged by @kboyarinov (Intel). Fixed `undefined __TBB_machine_fetchadd4` linker errors on unrecognized architectures. | PR #917 |
| 2022-10-28 | PR #917 first shipped in release v2021.7.0. | Release timeline |
| 2022-12-09 | [PR #987](https://github.com/oneapi-src/oneTBB/pull/987) opened: CMake libatomic detection for GCC builds. Author: John Paul Adrian Glaubitz (Gentoo/Debian). Still unmerged as of June 2026. | PR #987 |
| 2023-03-27 | [Issue #1051](https://github.com/oneapi-src/oneTBB/issues/1051) opened by ElEHsiang (SiFive): "Support RISC-V" -- queried whether `__TBB_USE_ITT_NOTIFY` needed to be disabled for RISC-V. | Issue #1051 |
| 2023-03-29 | [PR #1053](https://github.com/oneapi-src/oneTBB/pull/1053) merged: disabled `__TBB_USE_ITT_NOTIFY` for RISC-V. Author: ElEHsiang (SiFive). Merged by @isaevil (Intel). Closed issue #1051. First shipped in v2021.9.0 (2023-04-14). | PR #1053 |
| 2023-04-27 | [PR #1086](https://github.com/oneapi-src/oneTBB/pull/1086) merged: added `cmake/toolchains/riscv64.cmake` for cross-compilation. Author: ElEHsiang (SiFive). Merged by @isaevil (Intel). Verified on QEMU using a SiFive preparation script. First shipped in v2021.10.0 (2023-07-24). | PR #1086 |

**Fully upstream:** Yes. All three PRs are merged into master. The `cmake/toolchains/riscv64.cmake` file and the ITT_NOTIFY CMakeLists guards are present in current releases. No out-of-tree patches are needed for a Clang-based build.

**Outstanding gap:** [PR #987](https://github.com/oneapi-src/oneTBB/pull/987) (libatomic CMake detection) has been open since December 2022 and remains unmerged. GCC-based riscv64 builds without the downstream patch require manual `-latomic` linker flags.

---

## 3. Upstream Support Tier

oneTBB has no documented tiering policy for non-Intel architectures. The observable tier indicators are:

| Indicator | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in SYSTEM_REQUIREMENTS.md | Yes (explicit) | Yes (community) | No |
| CI runner present | Yes (ubuntu-latest, ubuntu-22.04, windows-2022/2025, macos-14/15) | Yes (ubuntu-24.04-arm, ubuntu-22.04-arm, windows-11-arm) | No |
| Official upstream binary | Yes (lin.tgz, mac.tgz, win.zip) | No separate binary | No |
| Upstream test suite runs | Yes | Yes | No (QEMU only, not in CI) |
| Architecture macro in _config.h | Yes (`__TBB_x86_64`, `__TBB_x86_32`) | Partial (Windows `_M_ARM64` only) | No (falls to `__TBB_generic_arch`) |
| Cross-compilation toolchain file | Not applicable | Not applicable | Yes (`cmake/toolchains/riscv64.cmake`) |
| Release notes mention | Multiple entries | Yes | Never |

**Effective tier:** RISC-V is an unofficial community port. It compiles and runs but receives no upstream CI coverage, no official binaries, and no mention in SYSTEM_REQUIREMENTS.md. The only downstream distros maintaining builds are Debian and Ubuntu.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

oneTBB is a task-parallel runtime, not a JIT compiler. It has no code generation backend and no crypto subsystem. The architecture-specific surface is limited to: spin-pause hints, atomic memory fences, architecture detection macros, and ITT instrumentation hooks.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Architecture detection macro | Full (`__TBB_x86_64`, `__TBB_x86_32`) | Partial (Windows-only `_M_ARM64`) | Missing (falls to `__TBB_generic_arch`) | RISC-V has no dedicated macro in `include/oneapi/tbb/detail/_config.h` |
| Spin-pause hint (`machine_pause`) | Full (`_mm_pause()`) | Partial (`"isb sy"` inline asm) | Scalar (`yield()` syscall) | Critical performance gap; see Section 6 |
| Log2 / bit-scan | Full (`"bsr %1,%0"` inline asm on i386) | Full (GCC `__builtin_clz`, compiler-emits-native) | Scalar (GCC `__builtin_clz` generic) | No practical gap; compiler emits correct RISC-V instruction |
| FPU control environment | Full (mxcsr, x87cw) | Generic (fenv.h) | Generic (fenv.h) | Acceptable |
| TSX/RTM mutexes | Present (rtm_mutex.cpp, rtm_rw_mutex.cpp) | Absent | Absent | x86-only feature; expected absence |
| ITT/VTune instrumentation | Enabled | Disabled | Disabled (CMakeLists regex) | Deliberately disabled in PR #1053; Intel-only hardware feature |
| Coroutine context | Generic ucontext / Win32 fibers | Generic ucontext | Generic ucontext | No performance gap |
| SIMD / RVV intrinsics | x86 SSE/AVX in adjacent oneAPI libs | Absent in oneTBB | Absent | oneTBB itself has no SIMD dispatch |
| Cross-compilation toolchain | Not applicable | Not applicable | Present (`cmake/toolchains/riscv64.cmake`) | Targets `rv64imafd_zba_zbb`, lp64d ABI, Clang only |
| WAITPKG intrinsics | x86-only | Absent | Absent | Expected absence |

**ISA extensions declared in the toolchain file:** `rv64imafd_zba_zbb` with ABI `lp64d`. No RVV (vector), no Zihintpause, no Zbc, no Zbs.

**No RISC-V source files exist:** There is no `arch/riscv/` directory, no `.S` assembly, no RVV intrinsics (`vfloat32m1_t`, `rvv`, etc.), and no `__riscv` preprocessor guard in any `.cpp` or `.h` file. The only `riscv` string in source code is the regex `"(armv7-a|aarch64|mips|arm64|riscv)"` in CMakeLists.txt used to suppress ITT_NOTIFY.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Cross-compilation toolchain file

`cmake/toolchains/riscv64.cmake` (added by [PR #1086](https://github.com/oneapi-src/oneTBB/pull/1086)):

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv)
set(CMAKE_C_COMPILER   ${CMAKE_FIND_ROOT_PATH}/bin/riscv64-unknown-linux-gnu-clang)
set(CMAKE_CXX_COMPILER ${CMAKE_FIND_ROOT_PATH}/bin/riscv64-unknown-linux-gnu-clang++)
set(CMAKE_LINKER       ${CMAKE_FIND_ROOT_PATH}/bin/riscv64-unknown-linux-gnu-ld)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=rv64imafd_zba_zbb -mabi=lp64d " CACHE INTERNAL "")
```

The toolchain requires a Clang-based cross-compiler named `riscv64-unknown-linux-gnu-clang`. The SiFive LLVM toolchain is the reference distribution. No GCC cross-compiler variant is provided.

### Build command

```bash
cmake \
  -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/riscv64.cmake \
  -DCMAKE_FIND_ROOT_PATH=/path/to/riscv64-sysroot \
  -DTBB_TEST=OFF \
  -DTBBMALLOC_BUILD=ON \
  -DTBB_DISABLE_HWLOC_AUTOMATIC_SEARCH=ON \
  -DCMAKE_BUILD_TYPE=Release \
  /path/to/oneTBB
cmake --build . -j$(nproc)
```

`-DTBB_DISABLE_HWLOC_AUTOMATIC_SEARCH=ON` is technically auto-set when `CMAKE_CROSSCOMPILING` is true, but an explicit override is recommended to prevent pkg-config from searching host library paths.

### QEMU testing

[PR #1086](https://github.com/oneapi-src/oneTBB/pull/1086) confirmed that the test suite runs under `qemu-riscv64` user-mode emulation using a SiFive preparation script. The standard mechanism is `CMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64;-L;/path/to/sysroot/lib"`, which causes `ctest` to wrap each test executable with the emulator automatically. No Dockerfile for riscv64 exists in the repository; the upstream CI does not use QEMU for RISC-V at all.

### Known build failures

**GCC + libatomic (PR #987, open since December 2022):** GCC builds on riscv64 fail at link time:
```
undefined reference to `__atomic_fetch_sub_8'
undefined reference to `__atomic_load_8'
```
Root cause: GCC does not auto-link `-latomic` for 8-bit atomics on riscv64. The fix in PR #987 adds a CMake compile test to detect this and link `-latomic` automatically. This PR has been blocked in review since December 2022. Downstream packagers (Gentoo, Debian) carry this as a distro patch. The Clang-based cross-compilation toolchain (riscv64.cmake) is not affected.

**Manual workaround:**
```bash
cmake ... \
  -DCMAKE_EXE_LINKER_FLAGS="-latomic" \
  -DCMAKE_SHARED_LINKER_FLAGS="-latomic"
```

### Compiler requirements

From SYSTEM_REQUIREMENTS.md: GCC 8.x minimum, Clang 7.x minimum, CMake 3.5 minimum. No riscv64-specific minimum versions are stated. The toolchain file names a Clang-based cross-compiler exclusively; no minimum Clang version for riscv64 cross-compilation is documented [NEEDS VERIFICATION].

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps (cannot do X at all)

| Feature | amd64 | arm64 | riscv64 | Impact |
|---|---|---|---|---|
| VTune / ITT instrumentation | Yes | No | No (disabled at build time) | No profiling hooks with Intel tools |
| TSX/RTM speculative lock elision | Yes | No | No | Not applicable outside x86 |
| `__TBB_riscv64` architecture macro | Not applicable | Not applicable | Missing | Future arch-specific optimizations cannot be cleanly gated |

### Performance gaps

**Spin-pause / `machine_pause`:** This is the single most impactful performance gap. The `machine_pause(delay)` function in `include/oneapi/tbb/detail/_machine.h` implements exponential backoff for spin-wait loops used in the work-stealing scheduler, concurrent queue operations, and mutex contention. The implementations are:

- amd64: `_mm_pause()` (SSE2 PAUSE instruction, O(nanoseconds), reduces SMT speculation pressure)
- arm64: `"isb sy"` inline asm (memory barrier/yield hint, O(nanoseconds))
- riscv64: `(void)delay; yield();` -- discards the delay count entirely and calls `sched_yield()` unconditionally (O(microseconds))

This degenerates the exponential backoff to an immediate OS yield on every spin iteration. The RISC-V Zihintpause extension (the `pause` hint instruction, ratified in the v1.0 spec) is not used. The performance regression is most visible in high-contention, spin-intensive workloads. No benchmark data for oneTBB on riscv64 is available in any public source.

### Floating-point / NaN semantics

No NaN correctness bugs specific to RISC-V were identified. oneTBB does not perform floating-point computation itself; it is a scheduling and concurrency library.

### Security hardening

No RISC-V-specific security hardening gaps were identified. oneTBB does not use custom stack management or JIT code generation. Standard compiler-provided mitigations (shadow stacks, CFI) apply normally.

---

## 7. CI/CD Infrastructure

All six workflow files in `.github/workflows/` (ci.yml, codeql.yml, coverity.yml, labeler.yml, ossf-scorecard.yml, issue_labeler.yml) were read directly. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

| CI capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions native runner | Yes (ubuntu-latest, ubuntu-22.04, windows-2022/2025, macos-14/15) | Yes (ubuntu-24.04-arm, ubuntu-22.04-arm, windows-11-arm) | No |
| QEMU emulation in CI | No | No | No |
| Build tested in CI | Yes | Yes | No |
| Test suite runs in CI | Yes | Yes | No |
| CodeQL analysis | Yes (ubuntu-latest) | No | No |
| Coverity scan | Yes (ubuntu-latest, windows-latest) | No | No |
| RISE CI runners | No | No | No |

**Verdict:** riscv64 has zero CI coverage. Regressions will not be caught automatically. The cross-compilation toolchain file (riscv64.cmake) is not exercised in any upstream pipeline.

---

## 8. Distribution and Release Status

### Upstream releases

GitHub releases at [oneapi-src/oneTBB/releases](https://github.com/oneapi-src/oneTBB/releases) ship three platform archives per release: `oneapi-tbb-<version>-lin.tgz`, `oneapi-tbb-<version>-mac.tgz`, `oneapi-tbb-<version>-win.zip`. No riscv64-specific binary is distributed. The five most recent releases checked (v2023.0.0 through v2022.0.0) contain no asset with "riscv64" in the filename.

### Distro packages

| Distro | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | libtbb12, libtbb-dev, libtbbmalloc2, libtbbbind-2-5 | 2022.3.0-2 | Built and installed on buildd host rv-osuosl-05 |
| Ubuntu 22.04 LTS | libtbb12, libtbb-dev, libtbbmalloc2 | 2021.5.0-7ubuntu2 | Available for riscv64 |
| Ubuntu 24.04 LTS | libtbb12, libtbb-dev, libtbbbind-2-5, libtbbmalloc2 | 2021.11.0-2ubuntu2 | Available for riscv64 (SHA256 confirmed in package metadata) |
| Ubuntu 26.04 LTS | libtbb12, libtbb-dev, libtbbbind-2-5, libtbbmalloc2 | 2022.3.0-2 | Available for riscv64 |
| Arch Linux RISC-V port | onetbb | Unknown | Page content not parseable for per-package status |

The Debian buildd page confirms riscv64 status "Installed" for `onetbb` 2022.3.0-2 in Debian sid [NEEDS VERIFICATION for Ubuntu direct binary -- download URL returned HTTP 403, but package metadata with SHA256 is present on packages.ubuntu.com].

**PyPI:** The `onetbb` package does not exist on PyPI (HTTP 404). No riscv64 wheel from RISE or any other source.

**What a user must do:** Install from Debian/Ubuntu packages (`apt install libtbb-dev`), or cross-compile from source using the SiFive Clang toolchain with `cmake/toolchains/riscv64.cmake` and manually pass `-latomic` linker flags for GCC-based builds. No prebuilt binary from upstream Intel is available.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| pthreads (system) | Core threading | Fully supported | Tested via glibc | All riscv64 Linux distros | No issues |
| hwloc | NUMA-aware task scheduling (libtbbbind) | Builds on riscv64 | Partial | Debian sid riscv64 package | Issue #650 open: CPU info retrieval incomplete on Linux (enhancement, milestone "Future") -- affects NUMA scheduling quality, not correctness |
| Intel ITT notify / ittapi | VTune instrumentation hooks | N/A -- disabled | N/A | Not released for riscv64 | Disabled in PR #1053; deliberate; no VTune on RISC-V |
| tbbmalloc (internal) | Scalable memory allocator | Builds (no arch-specific asm) | No riscv64 CI | Debian `libtbbmalloc2` for riscv64 | GCC builds require `-latomic`; PR #987 unmerged |
| libatomic (GCC runtime) | 64-bit/8-bit atomic ops for GCC builds | Required, not auto-linked | Not in CI | Available on all riscv64 distros | PR #987 unmerged since Dec 2022; most impactful build friction for GCC users |
| gperftools | Optional: tcmalloc as alternative allocator | Builds with generic fallbacks | No riscv64 CI | Available in Debian | Issue #1278: generic stacktrace significantly slower than x86-specific path -- profiling quality only |
| SWIG | Build-time Python binding generation | Architecture-agnostic | N/A | Ships on riscv64 | No issues |
| doctest | Header-only test framework | Architecture-agnostic | Used in tests | Header-only | No issues |

**hwloc detail:** hwloc issue #650 (CPU info retrieval incomplete on Linux) is open with milestone "Future". Most current RISC-V SBCs and development boards lack NUMA. The NUMA topology test in oneTBB (issue #2039) fails when `numa_info.index` returns `-1` on no-NUMA systems. This affects `tbbbind` and `libtbbbind-2-5` specifically, not the core task scheduler.

**libatomic detail (critical):** PR #987 reviewer discussion confirmed that for riscv64 specifically, 8-bit atomics (`std::atomic<uint8_t>`) require `-latomic` under GCC, while 64-bit atomics are the concern on 32-bit platforms (ppc32, arm). The unmerged state forces all downstream packagers to carry this patch. Gentoo applies it. Debian applies a variant. The upstream build instructions do not mention this requirement.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2039](https://github.com/uxlfoundation/oneTBB/issues/2039) | Tests conformance_arena_constraints fail on machine without NUMA | Open (Apr 2026) | Medium | `numa_info.index` returns -1 while `numa_id` is 0 on no-NUMA systems. Most RISC-V SBCs are no-NUMA. Test `Test NUMA topology traversal correctness` fails. Fix in `src/tbbbind/tbb_bind.cpp`. |
| [#987](https://github.com/oneapi-src/oneTBB/pull/987) (PR) | Add cmake check for libatomic requirement when building with gcc | Open (Dec 2022) | High (build) | GCC-based riscv64 builds fail at link without `-latomic`. PR stalled in review for 3+ years. Downstream packagers apply it as a distro patch. Clang builds are unaffected. |
| [#1454](https://github.com/oneapi-src/oneTBB/issues/1454) | armel: undefined reference to `__atomic_fetch_add_8` | Open (Jul 2024) | Medium (armel) | Affects 32-bit ARM. Reporter explicitly confirmed riscv64 is NOT affected by this specific issue. Same root cause class as PR #987. |
| [#2023](https://github.com/uxlfoundation/oneTBB/issues/2023) | Investigate performance regressions caused by #1779 | Open (Mar 2026) | Medium | Scheduler performance regression; PR #1779 reverted via #2022. Not architecture-specific. |
| [#1913](https://github.com/uxlfoundation/oneTBB/issues/1913) | Relative performance of affinity_partitioner doesn't match documentation | Open (Nov 2025) | Low | Documentation issue; performance chart dates to 2009. Not riscv64-specific but relevant to cross-architecture comparisons. |

**No correctness bugs specific to riscv64 were found.**

**Missing RISC-V spin-pause (no issue filed):** The absence of a `__riscv` branch in `machine_pause()` and the consequent degeneration to `sched_yield()` is an untracked performance regression. No issue exists in the tracker for this gap.

---

## 12. Objections and Upstream Blockers

**No stated objections to RISC-V support.** Both SiFive PRs were approved promptly ("LGTM!") by Intel's @isaevil. The project culture is permissive for non-Intel architecture patches.

**Organizational blockers:**

- Intel controls all maintainer seats. Improvements to RISC-V performance paths require Intel engineer review and approval. The spin-pause gap (Section 6) would require a change to `include/oneapi/tbb/detail/_machine.h`, a core header -- this will receive scrutiny.
- The libatomic PR (#987) has been blocked for 3+ years, demonstrating that infrastructure fixes for non-Intel architectures can stall indefinitely in review even without stated objections. The reviewer requested simplification to `uint64_t`-only test; this request appears unaddressed in the final commit, per PR discussion.

**Technical blockers:**

- No `__TBB_riscv64` macro in `_config.h` means there is no clean way to add RISC-V-specific code paths without also adding this macro -- a prerequisite change that must land first.
- No RISC-V CI means there is no automated mechanism to catch regressions after contributing optimizations. Any submitted RISC-V performance patch carries the burden of proof via QEMU testing by the contributor.

**Acceptance probability for well-formed patches:** High, based on the track record of PR #917, #1053, and #1086. Intel maintainers accept RISC-V patches that are clearly scoped, do not break x86/arm64, and come with test evidence (even QEMU-based).

---

## 13. Investment Analysis

RISE has not funded any oneTBB work. All work described in this report was contributed by SiFive independently. No RISE-covered baseline exists.

### 13.1 Functional Enablement

The port is functionally complete for a Clang cross-compilation workflow. One functional gap remains:

**libatomic auto-detection (PR #987):** The upstream GCC build fails silently at link time on riscv64 without `-latomic`. The fix exists (PR #987) but is stalled. Re-posting this as a clean PR addressing the reviewer's outstanding comments (simplify to `uint64_t` test sample; add "Workaround for..." comment wording per @isaevil's request) has a high probability of acceptance given that @pavelkumbrasev explicitly said "Let's try to move with this one" in May 2023. Effort: 0.5 person-weeks.

### 13.2 Performance Optimization

**Spin-pause hint (Zihintpause `pause` instruction):** Add a `__riscv` branch to `machine_pause()` in `include/oneapi/tbb/detail/_machine.h` using the RISC-V Zihintpause `pause` hint (encoded as `FENCE` with `fm=0, pred=W, succ=0`, or the `pause` mnemonic when `-march` includes Zihintpause). This requires:

1. Adding a `__TBB_riscv64` macro to `include/oneapi/tbb/detail/_config.h` (prerequisite PR).
2. Adding the `__riscv` branch to `machine_pause()` with a Zihintpause `asm volatile("pause" ::: "memory")` instruction, gated on `__riscv_zihintpause`.
3. Updating the cross-compilation toolchain file march string to include `_zihintpause`.
4. Providing QEMU performance data showing improvement in spin-heavy microbenchmarks.

Effort: 2-3 person-weeks (including benchmark development and review cycle).

**Scheduler topology (hwloc issue #650):** This is an upstream hwloc issue, not an oneTBB issue. Contribution should be directed at [open-mpi/hwloc](https://github.com/open-mpi/hwloc). Out of scope for oneTBB direct investment.

### 13.3 CI/CD Infrastructure

**Add riscv64 QEMU-based CI job to `.github/workflows/ci.yml`:** Add a matrix entry using `ubuntu-latest` runner with `qemu-user-static` and a riscv64 Docker container (e.g., `riscv64/ubuntu:24.04`), cross-compiling with the existing toolchain file and running the test suite via QEMU. This prevents future regressions.

Effort: 1-2 person-weeks (includes identifying a suitable base image, verifying QEMU test pass rate, and negotiating the CI addition with Intel maintainers who control CI costs).

**Prerequisite:** Intel maintainers must accept a QEMU-based CI job. There is no stated policy against this, but the CI currently uses only native GitHub-hosted runners. A QEMU job will be significantly slower than native runs. The PR may require justification for the added CI time.

### 13.4 Ecosystem Enablement

oneTBB has no significant dependent package ecosystem of its own that requires riscv64 enablement work. It is a dependency of other libraries (oneDAL, Intel oneAPI components), but those are separate projects. Section 10 is omitted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix libatomic auto-detection (re-post PR #987 clean) | 0.5 | RISC-V ecosystem engineer | Critical |
| Performance | Add `__TBB_riscv64` macro to `_config.h` (prerequisite) | 0.5 | RISC-V ecosystem engineer | High |
| Performance | Add Zihintpause `machine_pause` for riscv64 | 2 | RISC-V ecosystem engineer | High |
| CI/CD | Add QEMU riscv64 CI job to `ci.yml` | 1.5 | RISC-V ecosystem engineer | Medium |
| Performance | Update riscv64.cmake march string to include `_zihintpause` | 0.5 | RISC-V ecosystem engineer | Medium (part of spin-pause work) |

**Total estimated investment: 5 person-weeks.**

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [oneTBB GitHub repository (uxlfoundation)](https://github.com/uxlfoundation/oneTBB)
- [oneTBB GitHub repository (oneapi-src, legacy)](https://github.com/oneapi-src/oneTBB)
- [oneTBB Homepage](https://oneapi-src.github.io/oneTBB/)
- [Issue #1051 -- Support RISC-V](https://github.com/oneapi-src/oneTBB/issues/1051)
- [PR #917 -- Add s390x, hppa and riscv64 architecture detection](https://github.com/oneapi-src/oneTBB/pull/917)
- [PR #987 -- Add cmake check for libatomic requirement when building with gcc](https://github.com/oneapi-src/oneTBB/pull/987)
- [PR #1053 -- Disable ITT_NOTIFY for RISC-V](https://github.com/oneapi-src/oneTBB/pull/1053)
- [PR #1086 -- Add riscv64 toolchain.cmake](https://github.com/oneapi-src/oneTBB/pull/1086)
- [Issue #1454 -- armel: undefined reference to `__atomic_fetch_add_8`](https://github.com/oneapi-src/oneTBB/issues/1454)
- [Issue #2039 -- Tests conformance_arena_constraints fail on machine without NUMA](https://github.com/uxlfoundation/oneTBB/issues/2039)
- [Issue #1913 -- Relative performance of affinity_partitioner doesn't match documentation](https://github.com/uxlfoundation/oneTBB/issues/1913)
- [Issue #2023 -- Investigate performance regressions caused by #1779](https://github.com/uxlfoundation/oneTBB/issues/2023)
- [Debian tracker: onetbb](https://tracker.debian.org/pkg/onetbb)
- [Ubuntu 24.04: libtbb12 package](https://packages.ubuntu.com/noble/libtbb12)
- [RISE Project blog](https://riseproject.dev/blog)
- [GCC bug #81358 -- libatomic not auto-linked](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=81358)