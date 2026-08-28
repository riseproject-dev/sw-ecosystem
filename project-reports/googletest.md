---
title: googletest
parent: Project Reports
---

# googletest

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for googletest<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

googletest is Google's C++ unit testing and mocking framework, providing `TEST()`, `EXPECT_*`/`ASSERT_*` macros, death tests, parameterized tests, and the gMock matcher/mock infrastructure. It is a pure portable C++ library with no SIMD, JIT, or assembly in any form. The framework is consumed almost exclusively as a build-time dependency: downstream projects link it into test binaries.

**Governance:** Google-owned, hosted under the [`google` GitHub org](https://github.com/google/googletest). Not affiliated with any external foundation (not Linux Foundation, CNCF, Apache, or RISE). Code flows from Google-internal repos via Copybara automation (`copybara-worker@google.com`) and the Abseil team (`absl-team@google.com`). External contributors exist but the project is Google-controlled.

**Key maintainers:**

| Contributor | Org | Commits |
|---|---|---|
| Gennadiy Civil (gennadiycivil) | Google | 1,279 |
| Derek Mauro (derekmauro) | Google | 160 |
| Billy Donahue (BillyDonahue) | MongoDB | 111 |
| Gennadiy Rozental (rogeeff) | Tesla | 18 |

**License:** BSD-3-Clause.

**Platform policy:** Google's [Foundational C++ Support Policy](https://opensource.google/documentation/policies/cplusplus-support) governs the project. The supported matrix covers Linux (x86/arm/android), macOS, Windows, and iOS. No CPU architecture is called out explicitly. The `gtest-port.h` header states: "core members of the Google Test project don't have access to other platforms, support for them may be less stable." The project accepts community patches for non-Tier-1 platforms but does not proactively maintain them. New port submissions have no stated acceptance criteria beyond passing the existing test suite.

**Community stance on new ports:** Reactive. The 2022 RISC-V bug (#3756) elicited a one-sentence acknowledgment from a maintainer and no further action in four years.

**Recent releases:** v1.18.0 (2026-08-10, requires C++17), v1.17.0 (2025-04-30), v1.16.0 (2025-02-07, last C++14 release), v1.15.2 (2024-07-31). All releases ship a single source tarball; no binary assets of any kind.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-02-05 | Issue [#3756](https://github.com/google/googletest/issues/3756) filed: `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (openSUSE Tumbleweed, kernel 5.14.2, GCC 11.2.1) | GitHub Issues |
| 2022-02-07 | Maintainer derekmauro responds: "We don't officially support risc-v64." Closes engagement. | GitHub Issues #3756 |
| 2026-08-14 | Issue #3756 still open, no PR, no code change addressing RISC-V. | GitHub Issues |

There is no RISC-V port. No `GTEST_OS_RISCV64` define, no `#ifdef __riscv` guard, no dedicated riscv64 source file, and no RISC-V commit exist in the repository history. Code search for "riscv", "riscv64", "rvv", and "risc-v" across all files in google/googletest returns zero results.

RISE has no documented involvement with googletest.

---

## 3. Upstream Support Tier

googletest has no formal tier classification for CPU architectures. The Foundational C++ Support Policy specifies OS and compiler combinations only.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Officially supported | Yes | Yes (Android Tier 1) | No - explicitly unsupported |
| CI coverage | Yes (Kokoro, internal) | No public CI | No |
| Release-blocking | Yes | No | No |
| Official binaries | No (source-only releases) | No | No |
| `GTEST_OS_*` define | `GTEST_OS_LINUX` via `__linux__` | `GTEST_OS_LINUX` via `__linux__` | `GTEST_OS_LINUX` via `__linux__` (no dedicated define) |
| `GetThreadCount()` status | Working | Working | Broken - returns 0 (issue #3756) |

riscv64 falls through to the generic `GTEST_OS_LINUX` branch, which is correct but undifferentiated from any other Linux target.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

googletest is a pure portable C++ library. It contains no JIT, no SIMD, no crypto primitives, no hardware accelerators, no GC barriers, and no hand-tuned assembly of any kind for any architecture. The sole architecture-conditional logic in the codebase is:

1. Two lines in `gtest-port.h` (lines 691-692) gating Android/Bionic ABI behavior for `__arm__` and `__mips__` at specific Android API levels. No riscv64 guard exists.
2. The `GetThreadCount()` function in `gtest-port.cc`, which reads `/proc/<pid>/stat` field 19 to get the thread count. This is the one function with a confirmed riscv64 failure.

**Component table:**

| Component | amd64 | arm64 | riscv64 | ISA extensions |
|---|---|---|---|---|
| OS/platform detection (`gtest-port-arch.h`) | `GTEST_OS_LINUX` | `GTEST_OS_LINUX` | `GTEST_OS_LINUX` (no dedicated define) | None required |
| `GetThreadCount()` | Working | Working | Broken - returns 0 (issue #3756, open since 2022) | None required |
| `clone(2)` for death tests | `GTEST_HAS_CLONE=1` | `GTEST_HAS_CLONE=1` | `GTEST_HAS_CLONE=1` (via generic `!defined(__ia64__)` path) | None required |
| pthreads integration | Working | Working | Working | None required |
| Stack unwinding (optional, via Abseil) | Working | Working | Two segfaults on Debian (see Section 9) | None required |

The project has no components where a riscv64 implementation would be materially different from other Linux targets, except for `GetThreadCount()`.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (minimum 3.16) and Bazel. The upstream `CMakeLists.txt` enforces C++17 as of v1.18.0 via `target_compile_features(... cxx_std_17)`.

**Compiler requirements (from Google Foundational C++ Support Policy):**

| Dimension | Minimum | Notes |
|---|---|---|
| C++ standard | C++17 | Hard requirement since v1.18.0 |
| CMake | 3.16 | Declared minimum; 3.22 recommended |
| GCC | >= 10 | Policy floor; GCC 12+ recommended for riscv64 |
| Clang | >= 14.0.0 | Policy floor |
| glibc | >= 2.27 | Policy baseline |

**Native build (riscv64 host):**

No riscv64-specific build commands exist in the upstream repository. The standard CMake invocation applies without modification:

```
git clone https://github.com/google/googletest.git -b v1.18.0
cd googletest && mkdir build && cd build
cmake .. -DCMAKE_CXX_STANDARD=17 -Dgtest_build_tests=ON -Dgmock_build_tests=ON
make -j$(nproc) && ctest -j$(nproc) --output-on-failure
```

**Cross-compilation (no upstream toolchain file provided):**

```
cmake .. \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_CXX_STANDARD=17 \
  -Dgtest_disable_pthreads=OFF \
  -DBUILD_GMOCK=ON
```

No upstream Dockerfile or `cmake/riscv64.cmake` toolchain file exists. Code search for "riscv64" across all files returns zero results.

**Relevant CMake flags for embedded/cross builds:**

| Flag | Default | Purpose |
|---|---|---|
| `-Dgtest_disable_pthreads=ON` | OFF | Bare-metal or no-pthread targets |
| `-Dgtest_build_tests=OFF` | OFF | Required for cross (tests need a runner) |
| `-DBUILD_GMOCK=OFF` | OFF | Build only gtest |
| `-DGTEST_HAS_CLONE=0` | auto-detected | Force fork() instead of clone() |

**QEMU for cross-compiled test execution:**

No upstream documentation. Standard pattern:

```
cmake .. \
  -DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64-static;-L;/usr/riscv64-linux-gnu" \
  ...
make && ctest
```

Alternatively, set `GTEST_DEATH_TEST_USE_FORK=1` when running under QEMU user-mode emulation to avoid `clone(2)` issues.

**Known build failures on riscv64:** None beyond `GetThreadCountTest.ReturnsCorrectValue` (issue #3756). The library itself compiles cleanly. Debian sid confirms a successful build at 1.18.0-1.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

googletest is a testing framework. Its feature set is OS-level (process forking for death tests, thread counting for warnings, signal handling). There are no SIMD paths, no crypto, no floating-point numerics beyond what the C++ compiler provides.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Basic assertions (`EXPECT_EQ`, etc.) | Yes | Yes | Yes | None |
| Death tests (fork mode) | Yes | Yes | Yes | None |
| Death tests (clone mode) | Yes | Yes | Yes (auto-selected via `GTEST_HAS_CLONE=1`) | None |
| Parameterized tests | Yes | Yes | Yes | None |
| Typed tests | Yes | Yes | Yes | None |
| gMock matchers | Yes | Yes | Yes | None |
| `GetThreadCount()` | Yes | Yes | No - returns 0 | Broken (issue #3756) |
| Multi-threaded death test warning | Yes | Yes | Silently suppressed | Functional gap (low severity) |
| Stack symbolization (with Abseil) | Yes | Yes | Partial - 2 Abseil segfaults on Debian | Optional dep gap |
| CI coverage | Yes | No | No | Missing |

**Floating-point / NaN:** The NaN-related issues in the tracker (#4315, #4255) are Intel oneAPI compiler warnings on x86_64 with `-ffast-math` active, unrelated to RISC-V.

**Security hardening gaps:** Data not available: no upstream documentation on sanitizer coverage or hardening flags specific to riscv64 was found.

---

## 7. CI/CD Infrastructure

**Result: No riscv64 CI exists for googletest.**

The repository uses Google's internal Kokoro CI system triggered from three shell scripts. There is no `.github/workflows/` directory; `.github/` contains only `ISSUE_TEMPLATE`. The two GitHub Actions workflows that do exist ("CodeQL" and "pages-build-deployment") perform security scanning and docs deployment, not build/test CI.

| CI file | Platform | riscv64 coverage |
|---|---|---|
| `ci/linux-presubmit.sh` | x86_64 Linux (Docker: `gcr.io/google.com/absl-177019/linux_hybrid-latest`) | None |
| `ci/macos-presubmit.sh` | macOS (Xcode 26.2) | None |
| `ci/windows-presubmit.bat` | Windows (Visual Studio 2022) | None |
| `.github/workflows/` | Does not exist | None |

**CI matrix comparison:**

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes (internal Kokoro) | No | No |
| QEMU emulation in CI | No | No | No |
| Cross-compilation in CI | No | No | No |
| Build verified in public CI | No (internal only) | No | No |
| Build verified via distro | Implied | Implied | Yes (Debian sid buildd) |

RISE has no runners in googletest CI. No hardware CI for riscv64 exists anywhere in the project.

---

## 8. Distribution and Release Status

**Official releases:** Source tarballs only. Every release (confirmed for v1.16.0, v1.17.0, v1.18.0) ships one asset: `googletest-<version>.tar.gz`. No pre-built binaries, no riscv64 assets.

**PyPI:** googletest does not exist as a PyPI package. `https://pypi.org/pypi/googletest/json` returns HTTP 404.

**Debian/Ubuntu packaging (arch: all - source/headers, not compiled binaries):**

| Distribution | Version | Architecture |
|---|---|---|
| Debian sid | 1.18.0-1 | arch: all (source/CMake/headers); riscv64 build confirmed on `rv-manda-01` |
| Debian trixie | 1.16.0-1 | arch: all |
| Debian bookworm | 1.12.1-0.2 | arch: all |
| Ubuntu 24.04 LTS | 1.14.0-1 | arch: all |
| Ubuntu 26.04 LTS | 1.17.0-1build1 | arch: all; explicitly lists riscv64 in supported arches |

The `arch: all` designation means the package distributes source and headers; the consumer compiles googletest as part of their own build. No pre-compiled `.so` or `.a` for riscv64 is shipped by any distribution.

**Debian tracker:** riscv64 is absent from the autopkgtest migration results shown on [tracker.debian.org/pkg/googletest](https://tracker.debian.org/pkg/googletest). The six architectures listed are amd64, arm64, armhf, i386, ppc64el, s390x.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/)):** googletest is not listed.

**What a user must do:** Build googletest from source using the standard CMake invocation. The `libgtest-dev` Debian package provides a convenient source drop-in but is not a compiled binary. This is the same procedure on all architectures; riscv64 is not special here.

---

## 9. Dependencies

googletest has two dependency categories: a mandatory system dependency and optional C++ library dependencies.

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| pthreads (glibc libpthread) | Thread creation, mutex, GetThreadCount via `/proc/self/status` | Green | Yellow - GetThreadCount returns 0 on kernel 5.14.2 | Green | [#3756](https://github.com/google/googletest/issues/3756) open since 2022 |
| Abseil-cpp (optional, `GTEST_HAS_ABSL=ON`) | Stack symbolization, failure signal handler, flags parsing, RE2 bridge | Green (Debian sid 20260526.0-2 on `rv-osuosl-02`) | Yellow - 2/232 tests segfault on Debian riscv64 (abseil-cpp [#2002](https://github.com/abseil/abseil-cpp/issues/2002), open since Feb 2026, no response) | Green | Debian bug #1126886; [abseil-cpp#1236](https://github.com/abseil/abseil-cpp/issues/1236) ILP32E stack alignment open since 2022; CRC32C hw acceleration PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) stalled |
| RE2 (optional, required when Abseil enabled) | Regular expression matching for matchers | Green (pure C++17) | Green (no riscv64 issues found) | Green | None identified |

**Abseil-cpp detail:** When googletest is built with `GTEST_HAS_ABSL=ON`, it pulls in Abseil for stack symbolization, the failure signal handler, and flags parsing. Two Abseil tests segfault on Debian riscv64 (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`); these pass on Ubuntu riscv64, suggesting a Debian-specific kernel or libc interaction. The CRC32C hardware acceleration PR for Zbc/Zbkc extensions ([abseil-cpp#1986](https://github.com/abseil/abseil-cpp/pull/1986)) is stalled pending Google internal hardware verification. `UnscaledCycleClock` was removed for riscv64 in 2024 with no RDTIME fallback exported. See `project-reports/abseil-cpp.md` for full Abseil RISC-V status.

Neither Abseil nor RE2 involves a JIT backend or architecture-specific numerics relevant to googletest's use case. The Abseil segfaults are the only active concern when using `GTEST_HAS_ABSL=ON`, which is not the default build configuration.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3756](https://github.com/google/googletest/issues/3756) | GetThreadCountTest.ReturnsCorrectValue fails on risc-v64 | OPEN (since 2022-02-05) | Low | `GetThreadCount()` returns 0 on openSUSE Tumbleweed riscv64 (kernel 5.14.2, GCC 11.2.1). Maintainer derekmauro stated riscv64 is not officially supported and declined to pursue a fix. Functional impact: the failing code path only governs a warning about death tests in multi-threaded contexts - tests still run. No PR linked. Assigned to derekmauro with no activity. |

No other RISC-V-specific open issues, PRs, or commits exist in google/googletest. No correctness bugs in actual test execution have been reported; the framework compiles and runs on riscv64 for all practical purposes.

Historical precedent: an identical `GetThreadCount()` failure appeared on Debian/m68k in 2016 ([issue #949](https://github.com/google/googletest/issues/949), now closed), where the kernel reported 0 threads from `/proc/<pid>/stat` field 19. The riscv64 instance is the same class of bug.

---

## 12. Objections and Upstream Blockers

**Stated objection:** Maintainer derekmauro (Google) explicitly stated on 2022-02-07: "We don't officially support risc-v64." No reconsideration has been signaled in the four years since.

**Organizational blocker:** googletest is Google-internal-first; public releases are Copybara exports. Platform additions require Google's internal Kokoro CI to be updated, which is not publicly controllable. External contributors cannot add riscv64 CI to the published repository.

**Technical blockers:** None for the core framework. The `GetThreadCount()` bug is a kernel-level issue (same class as the 2016 m68k bug) and would require either a kernel fix or a googletest-side workaround reading from a different `/proc` interface.

**Acceptance probability for a `GetThreadCount()` fix:** Moderate. The fix would be a small, contained change to `gtest-port.cc` - read `/proc/self/status` for the `Threads:` field as a fallback, which is more portable than parsing `/proc/<pid>/stat` field 19. The precedent from issue #949 (m68k, 2016) suggests the project will accept a correct patch but will not write one itself.

**Acceptance probability for riscv64 CI:** Low. CI is Google-internal Kokoro. There is no GitHub Actions matrix to extend. Adding riscv64 CI requires Google organizational action.

---

## 13. Investment Analysis

RISE has no existing involvement with googletest. There is no ongoing upstream work to check against.

### 13.1 Functional Enablement

The framework is functionally usable on riscv64 today. The one confirmed bug (issue #3756, `GetThreadCount()` returns 0) has no impact on actual test correctness - it only suppresses a warning about multi-threaded death test usage. A fix to read `/proc/self/status` (`Threads:` field) as a fallback is a one-day engineering task. Upstreaming it requires engaging derekmauro; the maintainer has not been hostile, only indifferent.

### 13.2 Performance Optimization

Not applicable. googletest is a testing framework, not a compute library. There are no performance-sensitive code paths to optimize.

### 13.3 CI/CD Infrastructure

The only realistic path to riscv64 CI is a GitHub Actions workflow using a QEMU or hardware riscv64 runner. The upstream project has no GitHub Actions for build/test (only CodeQL and docs). Adding a community-contributed workflow is technically possible; it would need to be accepted as a PR. Given the maintainer's stated lack of interest in riscv64, the probability of acceptance is low without sustained external pressure.

An alternative is to maintain a downstream CI fork or a RISC-V distro-level test job (Debian/Ubuntu autopkgtest) that validates googletest on riscv64 without upstream cooperation. Debian autopkgtest does not currently include riscv64 for googletest (not listed in tracker migration data).

### 13.4 Ecosystem Enablement

Not applicable. googletest is a build-time testing dependency. It has no runtime plugin or extension ecosystem requiring riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `GetThreadCount()` to use `/proc/self/status` `Threads:` field as fallback for riscv64 (and other Linux arches where field 19 of stat is unreliable) | 0.5 | Upstream contributor | Low |
| Functional | File and track upstream acceptance of the above fix | 0.5 | Upstream contributor | Low |
| CI/CD | Add GitHub Actions workflow for riscv64 (QEMU user-mode or hardware runner) and negotiate upstream acceptance | 2 | RISE or Qualcomm | Low |
| CI/CD | Add riscv64 to Debian autopkgtest for googletest (distro-side, no upstream cooperation needed) | 1 | Debian RISC-V maintainers | Low |

**Overall assessment:** googletest presents no meaningful RISC-V investment requirement. The framework builds and runs correctly on riscv64 for all practical test workloads today. The one open bug is low-severity and small to fix. The absence of riscv64 CI is the more significant gap, but googletest itself is a means to an end - what matters is whether the projects that depend on googletest can build and test their own code on riscv64. Investment should be directed at those projects, not at googletest itself.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/googletest repository](https://github.com/google/googletest)
- [googletest homepage](https://google.github.io/googletest/)
- [Issue #3756: GetThreadCountTest.ReturnsCorrectValue fails on risc-v64](https://github.com/google/googletest/issues/3756)
- [Issue #949: Testsuite fails on many targets in Debian (historical m68k precedent)](https://github.com/google/googletest/issues/949)
- [Google Foundational C++ Support Policy](https://opensource.google/documentation/policies/cplusplus-support)
- [Debian tracker: googletest](https://tracker.debian.org/pkg/googletest)
- [Debian sid package: googletest 1.18.0-1](https://packages.debian.org/sid/googletest)
- [Ubuntu 24.04 package: googletest](https://packages.ubuntu.com/noble/googletest)
- [abseil-cpp issue #2002: segfault on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #1236: ILP32E stack alignment](https://github.com/abseil/abseil-cpp/issues/1236)
- [abseil-cpp PR #1986: CRC32C hardware acceleration for Zbc/Zbkc](https://github.com/abseil/abseil-cpp/pull/1986)
- [RISE Project homepage](https://riseproject.dev/)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/)