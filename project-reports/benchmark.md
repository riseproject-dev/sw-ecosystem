---
title: benchmark
---

# benchmark

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for benchmark<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

google/benchmark is a C++ microbenchmarking library developed and maintained by Google. It provides a harness for writing repeatable, statistically-sound micro-benchmarks (timing loops, statistics aggregation, CPU/cache/perf-counter instrumentation) and is widely used as a dependency by other C++ projects for their own performance test suites. It is licensed Apache-2.0 and hosted at [github.com/google/benchmark](https://github.com/google/benchmark).

**Governance:** google/benchmark is not part of any foundation (not Linux Foundation, not Apache Software Foundation, not CNCF); it is a Google-originated, Google-governed repository. There is no GOVERNANCE.md, OWNERS, MAINTAINERS, or CODEOWNERS file in the repository. Governance is informal: a small set of Google-employed maintainers with GitHub "MEMBER" author-association hold merge/approval authority, while outside contributors (including prolific ones) carry "NONE" or "CONTRIBUTOR" association. Contribution requires signing Google's individual or corporate CLA and adding oneself to the AUTHORS/CONTRIBUTORS files. An AGENTS.md policy was added to the repository around 2026-06 requiring explicit disclosure of AI-assisted contributions and prohibiting fully autonomous bot PRs (Dependabot excepted).

**Corporate sponsors and maintainers:**
- Dominic Hamon (dmah42), Google - de facto lead maintainer; approves or merges nearly all PRs, including every RISC-V-related PR since 2023.
- Pierre Phaneuf (pphaneuf), Google.
- Chris Kennelly (ckennelly) and Pascal Leroy (pleroy), Google (per @google.com emails in the AUTHORS file).
- Roman Lebedev (LebedevRI), no listed company - a top-3 contributor by commit count (121 commits) and a frequent reviewer/merger of RISC-V-adjacent fixes; regularly cites the RISC-V ISA spec in review threads.
- IBM (multiple named individuals), MongoDB, Stripe, Carto, and Shapr3D appear as corporate copyright holders in AUTHORS but have no RISC-V-specific commits.

**Community stance on new architecture ports:** Consistently receptive and low-friction. Every RISC-V patch submitted across 2019-2024 was merged within 1 to 3 days (the fastest, PR #1802, same-day), with substantive but non-obstructive technical review. Google's own maintainer, dmah42, personally approved 3 of the 5 RISC-V-related PRs. No evidence was found of a RISC-V contribution being rejected, stalled, or contested. The pattern is opportunistic and contributor-driven (lowRISC engineers first, then independent LLVM/Debian/Yocto contributors) rather than a maintainer-initiated roadmap item, but the project has never pushed back on a RISC-V submission. Repo stats: 10,351 stars, 175 open issues total (none RISC-V-specific), last push 2026-08-12, latest release v1.9.5 (2026-01-21).

## 2. Port History and Upstreaming Timeline

There is no master tracking issue for a riscv64 port. RISC-V support entered the codebase incrementally, entirely through the `src/cycleclock.h` cycle-counter timing primitive, via five small PRs spanning 2019 to 2024, all merged.

| Date | Event | Source |
|---|---|---|
| 2019-07-02 (opened) / 2019-07-05 (merged) | PR #833, "Add RISC-V support in cycleclock::Now": initial RISC-V support, `rdcycle`/`rdcycleh` userspace instructions to read the cycle counter, following the existing PowerPC overflow-correction pattern. | [PR #833](https://github.com/google/benchmark/pull/833) |
| 2020-04-08 (opened) / 2020-04-10 (merged) | PR #955, "Fix cycleclock::Now for RISC-V and PPC": fixed a compile-breaking typo, added missing `volatile` to inline asm (the compiler was optimizing away repeated counter reads and breaking overflow handling), and fixed reliance on unguaranteed zero/sign-extension behavior across GCC/Clang. | [PR #955](https://github.com/google/benchmark/pull/955) |
| 2023-02-19 (opened) / 2023-02-21 (merged) | PR #1549, "Fix CPU frequency estimation on riscv": replaced `nanosleep`-based CPU-frequency estimation (broken on riscv64 because neither `cpufreq` nor BogoMIPS is available) with a busy-loop pinned to a single core; removed `sleep.cc`/`sleep.h`. Closed 6-year-old issue #312 as a side effect. | [PR #1549](https://github.com/google/benchmark/pull/1549) |
| 2024-01-03 (opened) / 2024-01-04 (merged) | PR #1727, "CycleClock: use RDTIME instead of RDCYCLE on RISC-V": Linux 6.6 made `RDCYCLE` a privileged instruction (kernel commit cc4c07c89aada16229084eeb93895c95b7eabaa3), forcing a switch to the less-precise but accessible `RDTIME`. | [PR #1727](https://github.com/google/benchmark/pull/1727) |
| 2024-06-11 (opened and merged same day) | PR #1802, "cycleclock: Fix type conversion to match function return type on riscv64": one-line fix for a `-Wsign-conversion` Clang build error introduced by PR #1727. | [PR #1802](https://github.com/google/benchmark/pull/1802) |
| 2020-06-19 (opened) / 2021-05-30 (closed, unmerged) | PR #988, "Add support for changing cpu affinity": abandoned after ~11 months; contains the maintainer admission that CI does not cover RISC-V. Not RISC-V-specific; stalled on macOS's lack of a true CPU-affinity API. | [PR #988](https://github.com/google/benchmark/pull/988) |

**Key contributors and organizations:**
- Sam Elliott (lenary), lowRISC at the time of PR #833 (2019); now at Qualcomm. His CLA signing was delegated: asb (lowRISC) docusigned the corporate CLA on lenary's behalf, per the PR #833 thread - the only holdup on that PR was administrative, not technical.
- Luis Marques (luismarques), lowRISC, authored PR #955.
- Yingwei Zheng (dtcxzyw), independent LLVM contributor, authored PR #1549 - the most substantial RISC-V change (+138/-86 lines across 8 files), tested on Linux 5.19 riscv64 + GCC 11.3 on a SiFive U74-mc core.
- Aurelien Jarno (aurel32), no listed company (Debian/QEMU contributor context), authored PR #1727.
- Khem Raj (kraj), Yocto Project/OpenEmbedded maintainer, authored PR #1802.

**Is it fully upstream?** Yes, for the one architecture-specific subsystem that needs it (the cycle-counter timing primitive in `src/cycleclock.h`). All 5 RISC-V-touching PRs are merged; none are open, pending, or rejected. There is no separate riscv64 fork or downstream patch set required to build and run google/benchmark on riscv64.

**Verified PR merge-to-release mapping** (via `gh pr view --json state,mergedAt,mergeCommit` and tag bisection):

| PR # | Status | merged_at | First release containing it |
|---|---|---|---|
| #833 | merged | 2019-07-05 | v1.5.1 (tagged 2020-06-09) |
| #955 | merged | 2020-04-10 | v1.5.1 (tagged 2020-06-09) |
| #1549 | merged | 2023-02-21 | v1.8.0 (tagged 2023-05-05) |
| #1727 | merged | 2024-01-04 | v1.8.4 (tagged 2024-05-23) |
| #1802 | merged | 2024-06-11 | v1.8.5 (tagged 2024-07-18) |
| #988 | closed, unmerged | n/a | never merged / no release |

#833 and #955 both land in the same first release (v1.5.1) because no release was cut between v1.5.0 (2019-05-13) and v1.5.1 (2020-06-09), a 13-month gap, despite both PRs merging inside that window.

A supplementary search (`gh pr list --search "riscv|riscv64|rdcycle|rdtime|cycleclock"`) surfaced PRs #1794, #1899, #1753, #1777, which add cycleclock.h support for Alpha, hppa, z/OS, and generic-Linux fallback architectures respectively; diff inspection confirmed none of these touch the `#elif defined(__riscv)` branch.

## 3. Upstream Support Tier

There is no formal platform-tier document in this repository (no PLATFORMS.md, SUPPORT.md, or equivalent tier list). The closest analog, `docs/dependencies.md`, defers to Google's org-wide "Foundational C++ Support Policy" for build-tool version floors (CMake, Python) and says nothing about hardware architecture tiers. `docs/platform_specific_build_instructions.md` covers GCC/pthread, MSVC, Intel, and Solaris quirks only; it has no RISC-V section.

In the absence of a formal tier system, tier can be inferred from evidence:

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build/test coverage | Yes (ubuntu-24.04, ubuntu-22.04, macos-latest, Windows MSVC/MSYS2) | Yes (ubuntu-24.04-arm native runner in build-and-test.yml; macos-latest is arm64) | None (confirmed absent across all 12 workflow files) |
| Release-blocking status | Implicit (CI must pass) | Implicit (CI must pass) | Not gated at all (no CI job exists to gate on) |
| Official prebuilt binaries | None (source-only releases) | None (source-only releases) | None (source-only releases; not a riscv64-specific gap, applies to all architectures) |
| Assembly codegen tests (test/*_assembly_test.cc) | Enabled | Disabled (x86_64-only gate) | Disabled (same x86_64-only gate) |
| Maintainer statement | N/A (default target) | N/A (default target) | dmah42 in PR #988: "our CI doesn't cover android or ppc or riscv, so we may need some followups to support these platforms." |

**Conclusion:** riscv64 support in google/benchmark is best characterized as community-contributed, best-effort, and untested-in-CI. It compiles and, per distro build-farm evidence (Section 8), functions correctly, but it holds no official tier, is not part of any release gate, and has never been validated by the project's own automation. This is a materially lower support level than arm64, which has a native CI runner (`ubuntu-24.04-arm`) actively exercising the build and test suite on every push and PR.

## 4. Technical Architecture and RISC-V-Specific Subsystems

google/benchmark has exactly one architecture-specific subsystem: the cycle/time-counter primitive in `src/cycleclock.h` (261 lines). It has no JIT, no SIMD kernels, no cryptographic code, no GC, and no other per-architecture code path anywhere in the repository. This was confirmed by direct inspection of `src/sysinfo.cc` (910 lines, CPU/cache/load info), `src/internal_macros.h` (123 lines, OS macros, organized by OS not by CPU architecture), `src/perf_counters.cc` (341 lines, libpfm wrapper), the Bazel/CMake toolchain files, the Rust and Python bindings, and the docs tree - none contain riscv/RVV references outside cycleclock.h.

**`src/cycleclock.h`:** Implements `benchmark::cycleclock::Now()`, a per-architecture inline-asm reader of a cycle or time counter, used as the library's core high-resolution timing primitive. It is a single large `#if`/`#elif` chain dispatching on `__i386__`, `__x86_64__`, `__powerpc__`, `__sparc__`, `__ia64__`, `__aarch64__`, `__ARM_ARCH`, `__mips__`, `__loongarch__`, `__s390__`, `__riscv`, `__e2k__`, `__hexagon__`, `__alpha__`, `__hppa__`, and a generic Linux fallback.

The riscv64 branch (`#elif defined(__riscv)`), after PR #1727:
```c
#if __riscv_xlen == 32
  // rdtimeh/rdtime/rdtimeh sequence with overflow correction (asm, no branch)
#else
  uint64_t cycles;
  asm volatile("rdtime %0" : "=r"(cycles));
  return static_cast<int64_t>(cycles);
#endif
```

- **ISA extensions used:** None. `RDTIME`/`RDTIMEH` are base-ISA (RV32I/RV64I) time-CSR-read pseudo-instructions, not an extension. There is zero use of RVV, Zba, Zbb, Zicond, or any other extension anywhere in the codebase.
- **Completeness:** Complete and functional; actively exercised by every benchmark run on riscv64 (this is not a stub). Its multi-year revision history (#833 in 2019, #955 in 2020, #1727 in 2024, #1802 in 2024) reflects real-world correctness fixes, not abandonment.
- **Caveat carried forward from PR #1727:** the switch from `RDCYCLE` to `RDTIME` silently changed the semantic meaning of a "cycle" in reported riscv64 measurements, from raw core cycles to platform-timer ticks. This does not break relative-timing correctness (which is what google/benchmark's statistics rely on) but it does mean absolute cycle-count interpretations on riscv64 differ in kind from what the same code reports on x86_64/aarch64, where `RDCYCLE`-equivalent instructions still read core cycles directly.

**Explicitly checked and confirmed absent:**
- No `arch/riscv/` directory (or any `arch/` directory) exists in the repository.
- No standalone `.S` assembly files exist for any architecture.
- No RVV/vector intrinsics (`vfloat32m1_t`, `riscv_vector.h`, `vsetvl`, etc.).
- No bit-manipulation extension usage (Zba, Zbb).
- No JIT backend (not applicable - google/benchmark has no JIT component).
- No SIMD dispatch for riscv64 or any other architecture (the project has no numerics/codec kernels; it is a benchmarking harness).
- No riscv64 CI job (detailed in Section 7).
- Assembly codegen tests (`test/*_assembly_test.cc`, LLVM FileCheck-based) are explicitly gated to x86_64 only via `CMakeLists.txt`'s `should_enable_assembly_tests()` function (`elseif(NOT CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64") return()`); no riscv `CHECK` prefixes exist.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cycle/time counter (cycleclock.h) | Hand-written asm, `RDTSC`/`RDTSCP`, reads raw core cycles | Hand-written asm, `CNTVCT_EL0`, reads virtual counter | Hand-written asm, `RDTIME` (base ISA), reads platform-timer ticks (not raw core cycles, since PR #1727) |
| CPU frequency estimation (sysinfo.cc) | `cpufreq`/`/proc/cpuinfo` MHz field | `cpufreq` (where exposed) | Busy-loop estimation (PR #1549); neither cpufreq nor BogoMIPS available on Linux/riscv64 |
| SIMD kernels | None in this project | None in this project | None in this project |
| Assembly codegen tests | Enabled | Disabled | Disabled |
| JIT | N/A (none in project) | N/A (none in project) | N/A (none in project) |

## 5. Build System, Cross-Compilation, and Toolchain

There is no dedicated riscv64 build documentation, no riscv64 CI job, no cross-compilation toolchain file, and no Dockerfile of any kind in the repository (confirmed via a full recursive listing of all 245 tracked paths). RISC-V support is limited to the source-level `#ifdef __riscv` branch in `src/cycleclock.h`; the generic CMake/Bazel build path is otherwise architecture-agnostic and builds normally given a working riscv64 compiler.

**Files confirmed absent:** `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` (all return 404); `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake` (no toolchain files for any architecture ship in-repo); `.ci/docker/`, `docker/`, `Dockerfile.riscv64` (the repository has no Dockerfiles at all).

**Generic CMake configure/build** (no riscv64-specific flags exist or are needed on a native riscv64 host):
```bash
git clone https://github.com/google/benchmark.git
cd benchmark
cmake -E make_directory "build"
cmake -DBENCHMARK_DOWNLOAD_DEPENDENCIES=on -DCMAKE_BUILD_TYPE=Release -S . -B "build"
cmake --build "build" --config Release
cmake -E chdir "build" ctest --build-config Release
```

**Cross-compiling pattern** (generic pattern maintainers point contributors to for other non-x86 architectures such as aarch64, per issues #351 and #1200; nothing riscv-specific is documented):
```bash
cmake -DCMAKE_TOOLCHAIN_FILE=<your-riscv64-toolchain>.cmake \
      -DCMAKE_CROSSCOMPILING=1 \
      -DBENCHMARK_ENABLE_GTEST_TESTS=OFF \
      -DBENCHMARK_DOWNLOAD_DEPENDENCIES=OFF \
      -S . -B build
```
Because `CXXFeatureCheck.cmake`'s `cxx_feature_check()` uses `try_run`, which cannot execute a target binary on the build host while cross-compiling, four feature-check cache variables must be pre-seeded (per issue #351, maintainer-provided workaround, still the only documented path):
```bash
-DRUN_HAVE_STD_REGEX=0 -DRUN_HAVE_GNU_POSIX_REGEX=0 -DRUN_HAVE_POSIX_REGEX=0 -DRUN_HAVE_STEADY_CLOCK=0
```
(0 indicates success per the executable's own convention; `std::regex` is virtually always available on a Linux riscv64 glibc/musl toolchain, so `RUN_HAVE_STD_REGEX=0` is correct in practice.)

**Flags relevant to a constrained riscv64 build:**
- `BENCHMARK_ENABLE_TESTING=OFF`, `BENCHMARK_ENABLE_GTEST_TESTS=OFF`, `BENCHMARK_ENABLE_INSTALL=OFF`, `BENCHMARK_ENABLE_DOXYGEN=OFF`, `BENCHMARK_INSTALL_DOCS=OFF`, `BENCHMARK_INSTALL_TOOLS=OFF` - trims install surface, the recommended pattern for embedding the library.
- `BENCHMARK_ENABLE_LIBPFM=OFF` (default) - perf-counter support needs libpfm4-dev; leave off unless the riscv64 kernel/libpfm build actually supports RISC-V PMU events, which it does not (Section 9).
- `BENCHMARK_BUILD_32_BITS=OFF` (default) - only relevant to riscv32, not riscv64.
- `BENCHMARK_ENABLE_LTO=OFF` (default) - LTO with gcc-ar/gcc-ranlib should work on riscv64 GCC toolchains but is untested there.
- Assembly tests auto-disable off x86_64 (`CMakeLists.txt` line 73), so `BENCHMARK_ENABLE_ASSEMBLY_TESTS` is automatically OFF on riscv64; no flag needed.

**Toolchain version floor and why it matters in practice:** No riscv64-specific minimum version is documented anywhere in the repository. Generic minimums (per `docs/dependencies.md` and Google's Foundational C++ Support Policy) are CMake >= 3.13 (hard floor via `cmake_minimum_required` in `CMakeLists.txt` line 2), GCC >= 10 (Debian 11 default) or Clang >= 14.0.0 (Ubuntu 22.04 default), and C++17 to build the library. These are not riscv-specific, but the merged riscv fix history makes a practical floor load-bearing even though it is not written down anywhere:
- PR #1802 (merged 2024-06-11, first shipped in v1.9.0) fixes a `-Werror,-Wsign-conversion` build failure in `cycleclock.h` hit specifically by Clang on riscv64. Any Clang riscv64 build of a release before v1.9.0 will fail with `-Werror` enabled (`BENCHMARK_ENABLE_WERROR=ON` by default for Release builds). Workaround for older releases: `-DBENCHMARK_ENABLE_WERROR=OFF`.
- PR #1549 (merged 2023-02-21, first shipped in v1.8.0) rewrites CPU-frequency estimation because riscv64 Linux has neither `cpu MHz`/BogoMIPS nor a working `cpufreq`; any release before v1.8.0 silently produces wrong `--benchmark_min_time` timing results on riscv64.
- PR #833 (merged 2019-07-05, first shipped in v1.5.1) is the original `__riscv` `cycleclock::Now()` implementation; anything before v1.5.1 does not build the RISC-V code path at all.

**Practical floor: use v1.9.0 or later when building with Clang on riscv64; v1.8.0 is the minimum for anyone (GCC or Clang) to get correct timing results on riscv64.**

**QEMU usage:** None exists anywhere in the repository - no CI job, no docs, no scripts reference `qemu-riscv64`, `qemu-user`, or any emulation. All CI runs on native GitHub-hosted runners. There is a native arm64 runner (`ubuntu-24.04-arm`) but no riscv64 equivalent on GitHub Actions, and maintainers have made no accommodation for emulated or cross-compiled testing of any kind.

**Known open issues analogous to riscv64 pain points** (no riscv64-specific build issue exists in the tracker):
- Issue #1200, "Help wanted: Build support for Aarch64" (open, unresolved): maintainer's standing answer for any non-x86 cross-compile is "we don't do anything special." A follow-up commenter cross-building with a Raspberry Pi aarch64-gnu toolchain needed `-DHAVE_POSIX_REGEX=1` manually plus explicit `Threads::Threads` linking - an equivalent papercut would likely apply to riscv64 cross-builds.
- Issue #351: cross-compiling requires manually presetting the four `RUN_HAVE_*` cache variables because `try_run` cannot execute the probe binary for a foreign architecture.
- Issue #312 (closed 2016): explains why BogoMIPS-based frequency estimation is untrustworthy; directly the motivating context for PR #1549.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cycle-accurate timing | Yes (`RDTSC`, raw core cycles) | Yes (`CNTVCT_EL0`, virtual counter) | Partial - `RDTIME` reads platform-timer ticks, not raw core cycles, since PR #1727; monotonic and constant-frequency but a different semantic quantity than "cycles" on amd64/arm64 |
| CPU frequency estimation | `cpufreq`/`/proc/cpuinfo` | `cpufreq` where exposed | Busy-loop estimation (PR #1549); works, but no hardware-exposed frequency source exists at all on Linux/riscv64 |
| Hardware performance counters (libpfm4 backend) | Full PMU event tables | Full PMU event tables | None - libpfm4 has no RISC-V architecture port at all (Section 9); `BENCHMARK_ENABLE_LIBPFM` is non-functional on riscv64 even though the distro package builds |
| Assembly codegen tests | Enabled | Disabled | Disabled (same x86_64-only gate as arm64) |
| CI validation | Full matrix | Full matrix (native `ubuntu-24.04-arm` runner) | None |
| Official prebuilt binaries | None (source-only) | None (source-only) | None (source-only) - not a riscv64-specific gap |

**Functional gaps:** The only functional gap that is riscv64-specific arises from the missing libpfm4 RISC-V PMU port: `--benchmark_perf_counters` (hardware counter mode) cannot report real counter values on riscv64, even though the feature is fully functional on amd64 and arm64. This is a dependency-level gap, not a gap in google/benchmark's own code (detailed in Section 9).

**Performance gaps:** None attributable to missing SIMD, because the project has no SIMD kernels for any architecture (it is a benchmarking harness, not a numerics or codec library). The only performance-adjacent difference is the `RDTIME`-vs-`RDCYCLE` semantic change described in Section 4: relative timing correctness on riscv64 is unaffected, but absolute "cycles" reported on riscv64 are platform-timer ticks rather than raw core cycles, so cross-architecture comparisons of raw cycle counts (as opposed to wall-clock time) are not apples-to-apples between riscv64 and amd64/arm64.

**Security hardening gaps:** None found. No RISC-V-specific hardening flags, stack-protector variants, or CFI/shadow-stack mechanisms are referenced anywhere in the build system for any architecture; this class of concern does not apply to this project.

**NaN / floating-point semantics issues:** None tied to RISC-V. The NaN-related issues present in the tracker (#243, #250, #784, #860, #903, #944, #1098) are all platform-agnostic complexity/statistics or `DoNotOptimize` issues, unrelated to RISC-V floating-point semantics.

## 7. CI/CD Infrastructure

No riscv64 CI exists anywhere in google/benchmark. This was independently confirmed three ways: direct API fetch of all 12 GitHub Actions workflow files, a full repository clone with a case-insensitive `riscv` grep across the entire working tree, and a live re-fetch of the PR #988 maintainer comment.

**Per-workflow verification (exact runner/trigger data):**

| Workflow | Trigger | Runners | riscv64? |
|---|---|---|---|
| bazel.yml | push, pull_request | ubuntu-latest, macos-latest, windows-latest | none |
| build-and-test.yml | push/PR to main | ubuntu-24.04, ubuntu-22.04, ubuntu-24.04-arm, macos-latest, MSVC windows-2025/windows-2022, MSYS2 windows-latest (x86_64 only) | none |
| build-and-test-min-cmake.yml | push, pull_request | ubuntu-latest, macos-latest | none |
| build-and-test-perfcounters.yml | push, pull_request | ubuntu-latest | none |
| clang-format-lint.yml | push, pull_request | ubuntu-latest | none |
| clang-tidy-lint.yml | push, pull_request | ubuntu-latest | none |
| doxygen.yml | push, pull_request | ubuntu-latest | none |
| ossf.yml | schedule, workflow_dispatch | ubuntu-latest | none |
| pre-commit.yml | push, pull_request | ubuntu-latest | none |
| sanitizer.yml | push, pull_request | ubuntu-latest (platform: x64) | none |
| test_bindings.yml | push, pull_request | ubuntu-latest, macos-latest, windows-latest (2 jobs) | none |
| wheels.yml | workflow_dispatch, release published | ubuntu-latest, ubuntu-24.04-arm, macos-15-intel, macos-latest, windows-latest via cibuildwheel, `CIBW_ARCHS: auto64` (host-arch autodetect: x86_64/arm64 only) | none |
| appveyor.yml (root) | - | Visual Studio 2017 image | none |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in this repository. There are no QEMU setup steps, no `docker/setup-qemu-action`, no cross-compilation toolchain steps, no riscv64 matrix entries, no self-hosted runner labels, and no conditional `if:` gates referencing riscv anywhere under `.github/`. `ubuntu-24.04-arm` gives arm64 a native CI runner; there is no riscv64 equivalent configured anywhere, on GitHub Actions or elsewhere.

**Maintainer confirmation:** google/benchmark PR #988 (closed, unmerged), maintainer dmah42: "our CI doesn't cover android or ppc or riscv, so we may need some followups to support these platforms." Verified verbatim via `gh pr view`.

**Comparison table:**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | Yes (ubuntu-24.04/22.04, macos-latest, windows) | Yes (ubuntu-24.04-arm, macos-latest is arm64) | None |
| QEMU/emulated CI | N/A (not needed) | N/A (not needed) | None (not even attempted) |
| RISE-provided runners used | No | No | No - RISE riscv64 runners exist for other projects (Section 8 wheel-builder) but google/benchmark does not use them |
| Release gating on CI | Implicit via required checks | Implicit via required checks | Not applicable - no job exists to gate on |

## 8. Distribution and Release Status

**GitHub releases:** google/benchmark ships source-only releases; the latest 5 tags (v1.9.5, v1.9.4, v1.9.3, v1.9.2, v1.9.1) all have empty `assets` arrays via the GitHub releases API. No prebuilt binary tarballs or wheels of any kind exist for any architecture, so riscv64 is not disadvantaged relative to amd64/arm64 here - this is simply not how the project distributes builds.

**PyPI:** The PyPI package literally named "benchmark" ([pypi.org/project/benchmark](https://pypi.org/project/benchmark/)) is NOT google/benchmark. It is an unrelated pure-Python benchmarking framework by Jeffrey R. Spies, last released as 0.1.5 in 2012, homepage http://jspi.es/benchmark. All 6 release files are `.tar.gz` sdists only, no wheels, no riscv64 relevance. Google's C++ library is not distributed on PyPI under this or any other identified name.

**RISE wheel builder:** The RISE GitLab wheel-builder package index for "benchmark" ([gitlab.com/api/v4/projects/56254198/packages/pypi/simple/benchmark/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/benchmark/)) redirects (302) straight to `pypi.org/simple/benchmark/`. RISE has no custom wheel for "benchmark"; it simply proxies to the unrelated plain-PyPI package.

**Ubuntu 24.04 (noble):** The relevant split packages, `libbenchmark-dev`, `libbenchmark1.8.3`, and `libbenchmark-tools`, are all at version 1.8.3-3. Ubuntu's package-search page does not show per-architecture availability directly; since noble's riscv64 port builds from the same Debian source, and Debian's build is riscv64-clean (below), these packages are expected to be available for riscv64 on Ubuntu too, though this was not independently re-verified against the Ubuntu riscv64 archive in this research pass [NEEDS VERIFICATION].

**Debian:** The Debian source package "benchmark" is at version 1.9.1-1 (matches Google's v1.9.1 release), homepage confirmed as github.com/google/benchmark. Per-architecture buildd status shows **riscv64 = "Installed"**, built successfully as 1.9.1-1+b2 on buildd `rv-osuosl-01` (OSU Open Source Lab), build time 00:24:48, last built 2026-05-03. riscv64 builds and installs cleanly with no gaps. For contrast, the only real failures in the Debian build matrix are sh4 (compile error: "You need to define CycleTimer for your OS and CPU") and sparc64 (5/77 tests failed); riscv64 is unaffected by either. No riscv64-specific FTBFS bugs exist in the Debian BTS for this package.

**Arch Linux RISC-V (archriscv):** No "benchmark" package exists in archriscv at all - checked via the archriscv package search, the archriscv status page, and the felixonmars/archriscv-packages GitHub repository tree (1,468 entries, none matching). The only "benchmark"-related hit on the archriscv status page is `python-pytest-benchmark` (marked "DEP OUTDATED"/"nochecked"), which is unrelated. Upstream Arch Linux has `extra/benchmark` 1.9.5-2, but it is currently built only for x86_64; it is not in Arch's any-arch set and has no corresponding riscv64 port entry, meaning it has not been ported/rebuilt for riscv64 at all.

**Gentoo:** `dev-cpp/benchmark` carries a `~riscv` (unstable/testing) keyword for versions 1.8.4 through the current 1.9.5. Gentoo's ebuild maintainers have verified it builds and installs on riscv64, but it has never been keyword-stabilized (plain `riscv`, without the tilde) on any version, meaning it is not yet considered production-ready by that distro's own QA bar.

**What a user must do to get a working binary:** On Debian trixie/sid or a Debian-derived riscv64 system, `apt install libbenchmark-dev` installs a working, distro-built binary directly - no source build required. On Gentoo, `emerge dev-cpp/benchmark` works if `~riscv` is unmasked (testing branch). On Arch Linux RISC-V or any system without a benchmark package, a user must build from source using the generic CMake path in Section 5; no prebuilt binary is available from upstream on any architecture, so this step is no worse for riscv64 than for amd64/arm64 in that specific respect.

**Bottom line for distribution:**
- Binary/prebuilt package artifacts (GitHub release assets, PyPI wheels): none exist for google/benchmark on any architecture. riscv64 is not disadvantaged here.
- Distro packages compiled from source: riscv64 is fully supported and green on Debian, and by inheritance likely fine on Ubuntu 24.04. Gentoo has it at `~riscv` (testing) since 1.8.4.
- Gap: Arch Linux RISC-V does not package benchmark at all, even though upstream Arch has it for x86_64. This is the one clear riscv64 availability gap found across all sources checked.
- The "benchmark" package on PyPI is an unrelated Python project, so PyPI/RISE-wheel availability is not a meaningful signal for google/benchmark's riscv64 support.

## 9. Dependencies

google/benchmark's own core code already has native RISC-V support (`src/cycleclock.h`, Section 4), and Debian trixie/sid plus Ubuntu 24.04 ship `libbenchmark-dev`/`libbenchmark1.x` for riscv64 (Section 8). The library itself has essentially zero mandatory third-party runtime dependencies beyond pthreads/libc - it has zero code-search hits for absl/Abseil, and being a lightweight microbenchmarking harness it contains no JIT, SIMD, crypto, or compression code of its own. Manifests checked: `CMakeLists.txt`, `MODULE.bazel`, `WORKSPACE`, `bazel/benchmark_deps.bzl`, `pyproject.toml`/`setup.py`, `bindings/rust/Cargo.toml`, `tools/requirements.txt`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| libpfm4 (wcohen/libpfm4) | Optional hardware PMU/perf-counter backend for `src/perf_counters.cc` (`BENCHMARK_ENABLE_LIBPFM`, default OFF; pinned to libpfm 4.11.0 in Bazel deps) | Builds - Debian sid and Ubuntu 24.04 ship riscv64 packages | No functional PMU support - zero RISC-V PMU event tables/backend upstream; `pfm_find_event()` returns empty on riscv64 | Distro packages ship but are non-functional for hardware counters on riscv64 | No RISC-V architecture port exists at all (config.mk, pfmlib_riscv.c, event tables all absent); see the separate libpfm4 report already tracked in project-reports/scope.yml |
| GoogleTest/GoogleMock (google/googletest) | Unit-test framework for benchmark's own test suite (`BENCHMARK_ENABLE_GTEST_TESTS`, default ON) | Builds - Debian/Ubuntu `libgtest-dev` ships riscv64 (1.17.0-1+b1 in sid) | Mostly passes; one open non-blocking failure, issue #3756 `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 - maintainer response: "we don't officially support riscv64," but the affected function only gates a death-test threading warning, so it is cosmetic | Upstream v1.18.0 released 2026-08-10; no riscv64-specific release gating | #3756 open since 2022, low severity, no fix planned; not in project-reports/scope.yml |
| nanobind (wjakob/nanobind) | C++/Python binding glue for the optional Python module `bindings/python/google_benchmark` | Builds - header/template-driven library; Debian ships `nanobind-dev`+`python3-nanobind` as arch "all" (no native per-arch binary) | Zero riscv-related issues found in the repo | Arch "all" - no per-architecture release gate applies | None found |
| cxx/cmake crates (Rust, via `bindings/rust/Cargo.toml`) | Rust-C++ FFI codegen for optional Rust bindings (`BENCHMARK_ENABLE_RUST_BINDINGS`, default OFF) | No riscv64 issues found in dtolnay/cxx | Not independently verified [NEEDS VERIFICATION] | crates.io publishes source-only crates; build is target-triple agnostic via the consumer's Rust toolchain | None found |
| NumPy/SciPy (`tools/requirements.txt`) | Python packages used only by the `tools/compare.py` benchmark-result comparison CLI; not linked into the C++ library | NumPy: riscv64 is Tier 3 (NEP 57), active CI on RISE runners, no PyPI wheels yet (issue #30216). SciPy has multiple open riscv64 bugs (#22839 hanging tests under QEMU, #22753 `sph_harm` NaN mismatch, #19378 cross-compile tracking open since 2023) | See notes | Neither NumPy nor SciPy publishes riscv64 wheels to PyPI yet; distro packages are available | See the separate NumPy report for full detail; SciPy is not in project-reports/scope.yml |
| pthreads/glibc (libc) | Hard runtime dependency for all platforms | Yes - riscv64 first-class in glibc/Debian/Ubuntu | Yes | Released | None |
| Bazel build-time deps (bazel_skylib, rules_python, rules_cc, platforms) | Starlark build rules only; not compiled into the output binary | Architecture-agnostic | N/A | N/A | None |

**Deep-dive - libpfm4 (the only dependency with a real riscv64 gap):** `BENCHMARK_ENABLE_LIBPFM` is OFF by default, so most riscv64 users never hit this gap. When enabled, `src/perf_counters.cc` calls into libpfm4 to read hardware PMU counters (cache misses, branch mispredicts, cycles-via-PMU, etc.) for the `--benchmark_perf_counters` flag. libpfm4 has no RISC-V architecture port upstream at all - no `pfmlib_riscv.c`, no RISC-V event tables, no `config.mk` entry. Distro packages for libpfm4 do build and install on riscv64 (Debian sid, Ubuntu 24.04), because the library degrades gracefully to "no events available" on unsupported architectures rather than failing to build, but `pfm_find_event()` returns nothing usable, so the feature is silently non-functional rather than a build failure. This gap sits entirely in libpfm4, not in google/benchmark's own code.

**Deep-dive - GoogleTest #3756:** The only riscv64-tagged issue found in a direct dependency's tracker. `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64; a GoogleTest maintainer stated "we don't officially support riscv64." The affected code path only gates a death-test threading warning message, so the practical impact on consuming google/benchmark's own test suite is cosmetic (a test failure in benchmark's own CI would show up here if benchmark ran CI on riscv64 at all, but since it doesn't, this has zero practical effect today).

**Summary:** benchmark's own riscv64 support is solid and has been upstream since 2019. The only real dependency-side riscv64 gap is the optional libpfm4 hardware-counter backend, off by default, with zero RISC-V PMU support upstream. Test and binding dependencies (GoogleTest, nanobind, cxx) build fine on riscv64 with at most one cosmetic, non-blocking known issue. Python-tooling dependencies (NumPy/SciPy) are not linked into the library and are relevant only to the `compare.py` developer utility.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No master RISC-V tracking issue exists | N/A | N/A | RISC-V work was tracked entirely through individual PRs, not issues |
| #312 | BogoMIPS usage incorrect for CPU frequency estimation | Closed | Was general/not RISC-V-specific (originally an ARM/Pixel-phone bug from 2016) | Closed as a side effect of PR #1549, which fixed the same underlying frequency-estimation code path for riscv64 |
| #988 | Add support for changing cpu affinity | Closed, unmerged | Not RISC-V-specific | Contains the maintainer admission that CI excludes android/ppc/riscv; discussion stalled on macOS's lack of a true CPU-affinity API; CPU-affinity binding remains unimplemented for any platform today |
| GoogleTest #3756 | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open (in a dependency, not in benchmark itself) | Low/cosmetic | Open since 2022; maintainer says GoogleTest does not officially support riscv64; affected function only gates a death-test threading warning |
| riscv/riscv-isa-manual#140 | ISA manual issue referenced for context in PR #1549 | Referenced, not tracked in benchmark's own tracker | N/A | Cited for background on counter semantics, not a benchmark bug |

**Correctness bugs (RISC-V-specific):** None open. All identified RISC-V correctness issues were found and fixed via the PRs described in Section 2 (#833, #955, #1549, #1727, plus the trivial #1802 fix). No NaN or floating-point-specific bugs tied to RISC-V were found; the NaN-related issues present in the tracker (#243, #250, #784, #860, #903, #944, #1098) are all platform-agnostic complexity/statistics or `DoNotOptimize` issues unrelated to RISC-V.

**Performance data:** No quantitative RISC-V performance benchmark data (ns/op, throughput comparisons) for google/benchmark itself exists in any searchable source - not in GitHub issues/PRs, not on riseproject.dev/blog, not in general web search, not in Phoronix (blocked, HTTP 403). This is expected: google/benchmark is a microbenchmarking harness, not a workload that itself gets "benchmarked" for RISC-V performance; no project publishes throughput numbers for it. The closest proxy is the Debian buildd riscv64 build time of 00:24:48 (builder `rv-osuosl-01`, last built 2026-05-03), with no riscv64-specific FTBFS bugs.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has ever raised an objection to RISC-V support in principle. The single technical pushback on record (PR #833: LebedevRI questioning why the RISC-V overflow-handling approach differed from LLVM's `READCYCLECOUNTER` lowering, and flagging the preprocessor structure as needing refactoring) was resolved through explanation, not rejection, and the PR merged within 3 days.

**Technical blockers:** None active. The one blocker that did exist historically, dmah42's inability to empirically validate PR #955 for lack of RISC-V hardware access ("i don't have access to either platform. maybe you do @luismarques?"), was worked around via Godbolt inspection and QEMU testing by the contributor rather than blocking the merge. No open technical blocker exists today for the current `RDTIME`-based implementation.

**Organizational blockers:** The Google CLA process caused a real, if minor, delay (PR #833 blocked ~3 days purely on CLA paperwork, resolved by a third party docusigning on the author's behalf). This is a standing structural friction for any external contributor without an existing corporate CLA on file, but it is not RISC-V-specific and has not recurred as a blocker in subsequent RISC-V PRs (#955, #1549, #1727, #1802 all merged in 1-3 days or same-day).

**The clearest structural gap is not an objection but an absence:** no maintainer has ever proposed adding riscv64 to CI, and the closed PR #988 shows CI expansion to non-x86 platforms (android, ppc, riscv) was explicitly deprioritized ("we may need some followups") rather than actively pursued. This is a resourcing/priority gap, not a technical or political blocker - nobody has said no, but nobody at Google has said yes either.

**Acceptance probability for future riscv64 contributions:** High. The unbroken 2019-2024 track record (5 PRs, 100% merge rate, 1-3 day median turnaround, zero rejections) indicates any well-formed, correctly-tested riscv64 PR (including a CI-addition PR) would very likely be accepted. The rate-limiting factor is not maintainer willingness but the absence of anyone driving a CI-addition PR to completion.

## 13. Investment Analysis

**What RISE has already done or funded relevant to google/benchmark specifically:** Nothing. RISE has never mentioned or engaged with google/benchmark by name in any blog post, GitHub org, or working-group issue (Section on RISE Project Involvement, in the research findings). RISE's "benchmark" activity is entirely about benchmarking-as-methodology (SPEC CPU2017/x264/xz-driven GCC/LLVM optimization work under the Compilers & Toolchains WG, ~25 issues; two brand-new July 2026 Kernel & Virtualization WG issues, #141 and #146, proposing a formal performance-benchmarking framework and CI lab; four blog posts citing benchmark results as evidence of unrelated optimization work; a merged llama.cpp fork PR adding RVV FP-kernel benchmarking support). None of this reduces the scope of work below, because none of it touches google/benchmark's own code, CI, or packaging.

### 13.1 Functional Enablement

No functional enablement work is required. The library already builds and runs correctly on riscv64 via distro packages (Debian, confirmed "Installed" on buildd) and from source (generic CMake path). All architecture-specific code (`src/cycleclock.h`) is complete, merged, and has been iteratively corrected over 5 years to its current, correct `RDTIME`-based state. There is no known open functional gap in google/benchmark's own code for riscv64.

### 13.2 Performance Optimization

Minimal scope exists because the project has no SIMD/vectorized kernels for any architecture to optimize. The only riscv64-specific performance-adjacent item is documentation/communication of the `RDTIME`-vs-`RDCYCLE` semantic change (Section 4/6): downstream users who interpret google/benchmark's raw "cycles" output as core cycles on riscv64 will get platform-timer-tick counts instead. A small documentation PR clarifying this distinction in the library's own docs (there is currently no mention of this caveat anywhere in project documentation) would close an accuracy-of-interpretation gap for downstream consumers, at low effort.

### 13.3 CI/CD Infrastructure

This is the one area with a real, well-defined gap: zero riscv64 CI coverage, confirmed by maintainer admission (PR #988). Closing it requires:
- Adding a riscv64 job to `build-and-test.yml` (or a new workflow), most likely via a QEMU-user cross-build-and-test step, since GitHub Actions has no native riscv64 hosted runner (unlike its native arm64 `ubuntu-24.04-arm` runner).
- Alternatively, using a RISE-provided riscv64 self-hosted runner if RISE's runner program (referenced in the `riscv-runner` GitHub repo issue #20 in the research findings) can be extended to non-RISE-member projects; this would need to be negotiated, as no such arrangement currently exists for google/benchmark.
- Wiring the assembly-codegen test gate is not needed (already correctly disabled off x86_64).

### 13.4 Ecosystem Enablement

Not applicable. Per the report scope instructions, Section 10 (Ecosystem Status) is omitted: google/benchmark is a standalone C++ microbenchmarking library with no dependent package ecosystem (no plugins, no extension marketplace, no downstream package registry of its own).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional enablement | None required (already complete and correct) | 0 | N/A | N/A |
| Performance optimization | Document RDTIME-vs-RDCYCLE semantic change in project docs for downstream users | 0.5 | Any contributor familiar with the codebase | Low |
| CI/CD infrastructure | Add riscv64 job to build-and-test.yml via QEMU-user cross-build-and-test | 1-2 | Contributor with GitHub Actions + QEMU cross-build experience | Medium |
| CI/CD infrastructure | Negotiate/onboard a RISE or other self-hosted riscv64 runner for native (non-QEMU) CI | 1-3 (mostly coordination, not engineering) | Contributor with RISE relationship | Low-Medium |
| Dependency: libpfm4 | Upstream a RISC-V PMU event-table/backend port in libpfm4 so `--benchmark_perf_counters` becomes functional on riscv64 | 4-8 (separate project, tracked in the libpfm4 report) | Not google/benchmark's responsibility; libpfm4 maintainers | Low (optional feature, default OFF) |
| Packaging | File an Arch Linux riscv64 package request for `extra/benchmark` (archriscv currently has none) | 0.5-1 | Any contributor with Arch packaging experience | Low |

**Total estimated effort directly attributable to google/benchmark's own repository: roughly 1.5 to 3.5 person-weeks**, almost entirely in CI infrastructure (13.3), since functional support is already complete and there is no ecosystem to enable. The libpfm4 PMU gap is real but sits in a separate upstream project and is optional (feature is OFF by default).

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/benchmark repository](https://github.com/google/benchmark)
- [PR #833 - Add RISC-V support in cycleclock::Now](https://github.com/google/benchmark/pull/833)
- [PR #955 - Fix cycleclock::Now for RISC-V and PPC](https://github.com/google/benchmark/pull/955)
- [PR #1549 - Fix CPU frequency estimation on riscv](https://github.com/google/benchmark/pull/1549)
- [PR #1727 - CycleClock: use RDTIME instead of RDCYCLE on RISC-V](https://github.com/google/benchmark/pull/1727)
- [PR #1802 - cycleclock: Fix type conversion to match function return type on riscv64](https://github.com/google/benchmark/pull/1802)
- [PR #988 - Add support for changing cpu affinity (closed, unmerged)](https://github.com/google/benchmark/pull/988)
- [Issue #312 - BogoMIPS usage (closed)](https://github.com/google/benchmark/issues/312)
- [Issue #1200 - Help wanted: Build support for Aarch64](https://github.com/google/benchmark/issues/1200)
- [Issue #351 - cross-compiling feature-check workaround](https://github.com/google/benchmark/issues/351)
- [riscv/riscv-isa-manual issue #140](https://github.com/riscv/riscv-isa-manual/issues/140)
- [GoogleTest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [google/googletest repository](https://github.com/google/googletest)
- [wjakob/nanobind repository](https://github.com/wjakob/nanobind)
- [dtolnay/cxx repository](https://github.com/dtolnay/cxx)
- [wcohen/libpfm4 repository](https://github.com/wcohen/libpfm4)
- [Debian package tracker - benchmark](https://tracker.debian.org/pkg/benchmark)
- [Debian buildd status - benchmark](https://buildd.debian.org/status/package.php?p=benchmark)
- [Ubuntu package search - benchmark](https://packages.ubuntu.com/search?keywords=benchmark)
- [Gentoo packages - dev-cpp/benchmark](https://packages.gentoo.org/packages/dev-cpp/benchmark)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/.status/status.htm)
- [felixonmars/archriscv-packages repository](https://github.com/felixonmars/archriscv-packages)
- [PyPI - benchmark (unrelated Python package)](https://pypi.org/project/benchmark/)
- [RISE wheel builder - benchmark package index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/benchmark/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE blog - Project RP009: LLVM SPEC Optimization](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [NumPy issue #30216 - riscv64 wheels](https://github.com/numpy/numpy/issues/30216)
- [SciPy issue #22839 - riscv64 QEMU hanging tests](https://github.com/scipy/scipy/issues/22839)
- [SciPy issue #22753 - riscv64 sph_harm NaN mismatch](https://github.com/scipy/scipy/issues/22753)
- [SciPy issue #19378 - riscv64 cross-compile tracking](https://github.com/scipy/scipy/issues/19378)