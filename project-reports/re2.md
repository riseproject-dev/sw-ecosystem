---
title: re2
parent: Project Reports
---

# re2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for re2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

RE2 is a pure C++ regular expression engine developed at Google, designed to guarantee linear-time matching by using finite automata (NFA/DFA) rather than backtracking. It provides safe worst-case performance guarantees that PCRE2 cannot offer. The library is used pervasively inside Google and in the broader ecosystem anywhere input is untrusted.

**Governance:** The project is owned by Google and hosted at [github.com/google/re2](https://github.com/google/re2). It is not affiliated with any external foundation (Linux Foundation, CNCF, Apache). Security disclosures route through Google's [g.co/vulnz](https://g.co/vulnz) intake. There is no independent steering committee or TSC.

**Corporate maintainers:** Paul Wankadia (GitHub: `junyer`, 907 of approximately 1100 total commits) is the dominant active maintainer. Russ Cox (GitHub: `rsc`, Google, 152 commits) is the original designer and author. All other contributors have fewer than 10 commits. The project is effectively maintained by two people.

**Governance model:** Informal Google-led. Contributions require a Google CLA (individual or corporate). Patches are reviewed via GitHub PRs (migrated from Gerrit). Design changes require prior discussion on the `re2-dev` Google Group mailing list.

**Community culture on new ports:** Not directly applicable. RE2 has no architecture-specific code paths in any existing platform. Any C++17-capable toolchain on any architecture compiles it without modification. There is no formal tier policy and no process for "porting" - the concept does not apply.

**RISE membership:** RE2 is not listed as a RISE Project member or affiliate. The RISE Project's [Premier and General member list](https://riseproject.dev/members/) does not include Google in the context of RE2, and no RISE-funded work on RE2 has been found.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| (library inception) | RE2 implemented as pure portable C++ with no ISA-specific code for any architecture | [github.com/google/re2](https://github.com/google/re2) source tree, 139 files, zero `.S` files |
| Jul 2025 | ARM64 compatibility confirmed via manual builds (issues #519 and #527 closed) - not a CI addition, just manual confirmation | GitHub issues #519, #527 |
| 2025-11-05 | Version `20251105` released; Debian builds `20251105-1+b1` for riscv64 on `rv-osuosl-02` | [Debian buildd](https://buildd.debian.org/status/package.php?p=re2) |
| (ongoing) | Ubuntu 24.04 Noble ships `libre2-10` and `libre2-dev` with riscv64 listed as a supported architecture | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=re2&suite=noble) |

No upstream commits, pull requests, or issues referencing RISC-V exist in the google/re2 repository. All GitHub search vectors - Issues API (riscv, riscv64, risc-v), PRs CLI, Commits API, Code search, full issue list regex filter, and recent commit message filter - returned zero results. The absence of a tracking issue reflects that no upstream changes are required: the library compiles and runs on riscv64 from the generic C++ source.

Key contributors to riscv64 availability: Debian and Ubuntu package maintainers (downstream, not upstream). No individual upstream contributor has made riscv64-specific changes.

---

## 3. Upstream Support Tier

RE2 has no documented tier policy. The project makes no platform commitments beyond what the CI covers.

**Evidence:**

- CI tests: Linux x86_64, macOS x86_64, macOS arm64, Windows x86/x64/arm64. No riscv64 runner, no QEMU-based cross-compilation, no architecture matrix in any workflow.
- Release artifacts: source-only (`.tar.gz`, `.zip`, plus `.sigstore.json` signatures). No upstream binary packages for any architecture.
- ARM64 is not in the upstream CI either - its support status comes from manual confirmation (issues #519, #527, Jul 2025) rather than a CI pipeline.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Yes (ubuntu-latest, GCC 12/13/14, Clang 18/19/20) | No (macOS arm64 runner in ci.yml but under macOS, not Linux) | No |
| Release-blocking | Yes (failures block merge) | Not formally | Not formally |
| Official upstream binaries | No (source-only) | No | No |
| Distro packages | Yes | Yes | Yes (Debian, Ubuntu) |
| Confirmed builds | Yes | Yes (manual, Jul 2025) | Yes (Debian buildd) |

The practical support tier for riscv64 is equivalent to arm64: builds correctly from source, no upstream CI, no official binaries, distro-provided packages only.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RE2 is a pure portable C++ automata engine. The entire codebase (139 files) contains zero assembly files, zero SIMD intrinsics, zero JIT backends, and zero ISA detection macros (`#ifdef __riscv`, `#ifdef __x86_64__`, `#ifdef __aarch64__` are all absent). The codebase has no `arch/` directory and no SIMD dispatch infrastructure.

This is not a gap specific to RISC-V. It applies equally to x86 and ARM. Issue #383 (SIMD improvements for x86, referencing Intel Hyperscan) was closed without action.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Core NFA/DFA engine | scalar C++ | scalar C++ | scalar C++ |
| DFA state cache | scalar C++ | scalar C++ | scalar C++ |
| String matching | scalar C++ | scalar C++ | scalar C++ |
| SIMD acceleration | none | none | none |
| JIT backend | none | none | none |
| Assembly | none | none | none |
| ISA extension use | none | none | none |
| Thread synchronization | absl::Mutex (portable) | absl::Mutex (portable) | absl::Mutex (portable) |
| Atomics | std::atomic (C++17) | std::atomic (C++17) | std::atomic (C++17) |

RE2 uses `std::atomic<State*>` in the DFA engine (`dfa.cc`) and `absl::Mutex` for concurrency. No crypto, no custom allocator, no GC barriers. All architecture-sensitive behavior flows through Abseil.

The absence of ISA-specific optimizations is intentional and documented in the design. Performance on riscv64 relative to x86_64 or arm64 is entirely determined by the compiler's code generation quality from standard C++17.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems supported:** CMake (minimum 3.22), Bazel, and a standalone Makefile. All three enforce C++17.

**Compiler requirements:** C++17 is mandatory. The upstream CI tests GCC 12, 13, 14 and Clang 18, 19, 20. For riscv64, GCC 12 is the practical minimum (GCC 10/11 support C++17 but are not tested upstream). The only known toolchain issue specific to riscv64 is in Abseil (a dependency), not re2 itself: GCC 11 Bootlin cross-toolchain fails with `undefined reference to __atomic_compare_exchange_1` requiring explicit `-latomic`. GCC 12+ resolves this automatically.

**CMake cross-compilation for riscv64:**

No upstream-provided riscv64 toolchain file exists. A user-supplied toolchain file is required:

```cmake
# toolchain-riscv64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```bash
cmake -DCMAKE_TOOLCHAIN_FILE=toolchain-riscv64.cmake \
      -DCMAKE_BUILD_TYPE=Release \
      -DRE2_BUILD_TESTING=OFF \
      -DRE2_USE_ICU=OFF \
      -S . -B build-riscv64
cmake --build build-riscv64
```

Set `-DRE2_BUILD_TESTING=OFF` when cross-compiling to avoid requiring GTest and Google Benchmark in the sysroot, and to skip `ctest` which cannot natively execute riscv64 binaries.

**Make cross-compilation for riscv64:**

```bash
make CXX=riscv64-linux-gnu-g++ \
     AR=riscv64-linux-gnu-ar \
     NM=riscv64-linux-gnu-nm \
     CXXFLAGS="-O2 -g" \
     PKG_CONFIG=riscv64-linux-gnu-pkg-config
```

**QEMU usage:** RE2 has no QEMU CI configuration. To run tests after cross-compiling, install `qemu-user-static` and use transparent binfmt_misc emulation, or invoke the binary explicitly:

```bash
qemu-riscv64-static -L /usr/riscv64-linux-gnu ./build-riscv64/obj/test/re2_test
```

The upstream CMake CI script skips tests tagged "big" (`dfa`, `exhaustive`, `random`):

```bash
ctest -C Release --output-on-failure -E 'dfa|exhaustive|random'
```

**Native build on riscv64 Debian/Ubuntu:**

```bash
apt install libabsl-dev libgtest-dev libbenchmark-dev cmake
cmake -DRE2_TEST=ON -DRE2_BENCHMARK=ON -S . -B build
cd build && make && make test && make install
```

**Known build failures specific to riscv64:** None in re2 itself. The Abseil cross-compile atomics issue (Abseil issue #1702) requires `-latomic` with GCC 11 Bootlin toolchains; GCC 12+ is unaffected.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

RE2 has no features that are conditionally available per architecture. All regex features - NFA, DFA, filtered matching, submatch extraction, Unicode (with `-DRE2_USE_ICU=ON`), `RE2::Set`, `FilteredRE2` - are available identically on riscv64.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| NFA engine | Yes | Yes | Yes |
| DFA engine | Yes | Yes | Yes |
| Submatch extraction | Yes | Yes | Yes |
| RE2::Set (multi-pattern) | Yes | Yes | Yes |
| FilteredRE2 | Yes | Yes | Yes |
| Unicode properties (with ICU) | Yes | Yes | Yes |
| POSIX mode | Yes | Yes | Yes |
| SIMD acceleration | None | None | None |
| Thread-safe object sharing | Yes (with contention, see bug #569) | Yes (with contention) | Yes (with contention) |

**Functional gaps:** None relative to amd64 or arm64.

**Performance gaps:** No architecture-specific optimizations exist for any platform, so there is no performance gap introduced by riscv64 specifically. The gap relative to a hypothetical RVV-optimized implementation is identical to the gap on amd64 relative to a hypothetical AVX-512 implementation - neither exists.

**Security hardening:** RE2 uses no inline assembly on any platform, so there is no platform-specific security hardening gap.

**Floating-point and NaN semantics:** Not applicable. RE2 performs no floating-point operations. Issue #646 (open) addresses locale-dependent float capture parsing (`LC_NUMERIC` comma-decimal locales cause incorrect `double` captures via `strtod`), but this is a portability bug affecting all platforms equally, not a riscv64-specific issue.

---

## 7. CI/CD Infrastructure

RE2 has no riscv64 CI of any kind.

All seven `.github/workflows/` files were read directly from the repository and searched for "riscv" (case-insensitive). Zero matches in all seven files: `ci.yml`, `ci-bazel.yml`, `ci-cmake.yml`, `python.yml`, `pages.yml`, `release-bazel.yml`, `release.yml`.

| CI dimension | amd64 | arm64 (Linux) | riscv64 |
|---|---|---|---|
| Native runner | Yes (ubuntu-latest, GCC 12/13/14, Clang 18/19/20) | No | No |
| QEMU cross-compile | No | No | No |
| CMake build tested | Yes | No | No |
| Bazel build tested | Yes | No | No |
| Python wheel CI | Yes (manylinux_2_28_x86_64) | Yes (manylinux_2_28_aarch64) | No |
| Release blocking | Yes | No | No |
| RISE runner | No | No | No |

The only riscv64 build evidence comes from downstream distribution package builders: Debian buildd on `rv-osuosl-02` successfully builds `20251105-1+b1`. This is not under upstream control.

---

## 8. Distribution and Release Status

**Upstream releases:** Source-only. Each release ships four assets: `.tar.gz`, `.zip`, and `.sigstore.json` signatures for each. No upstream binary packages for any architecture. Five most recent releases confirmed (2025-07-17 through 2025-11-05).

**PyPI (`re2` package):** Version 0.2.24. Files present: `re2-0.2.24.linux-x86_64.tar.gz` and `re2-0.2.24.tar.gz` (source). No riscv64 wheel. Total files: 19, covering `linux-i686`, `linux-x86_64`, `macosx-10.10-intel`, and untagged source distributions. riscv64 is absent.

**RISE wheel builder:** re2 is not listed at [riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/). The RISE builder covers 80+ packages but re2 is absent. The RISE GitLab org has zero repos for re2.

**Ubuntu 24.04 Noble:** `libre2-10` and `libre2-dev` list riscv64 as a supported architecture, alongside amd64, arm64, armhf, ppc64el, and s390x. Additionally, `ruby-re2`, `node-re2`, `varnish-re2`, and `libre-engine-re2-perl` all list riscv64.

**Debian:** Package `re2` version `20251105-1+b1` has build status "Installed" on riscv64, built on `rv-osuosl-02`.

**Arch Linux RISC-V:** Inconclusive. `archriscv.felixc.at` did not return parseable data for re2.

**What a user must do to get a working binary:**

- On riscv64 Debian/Ubuntu: `apt install libre2-dev` - fully packaged, no source build required.
- For the Python `re2` package on riscv64: no pre-built wheel is available from PyPI or RISE. Users must build from source (requires Abseil and a C++17 toolchain).
- For Node.js `node-re2` on riscv64: available via Ubuntu 24.04 apt (`node-re2`).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Abseil-cpp (required) | String types, synchronization, hashing, logging | Builds with GCC 12+; GCC 11 Bootlin cross-toolchain fails with `__atomic_*` link error requiring `-latomic` | Two open failures on riscv64: SEGFAULT in hashtablez sampler (#2002), SwissTable collision count OOB on `kWidth==8` platforms including riscv64 (#2142) | Source-only upstream; distro packages available | #1702 (open): cross-compile atomics with GCC 11; #2002 (open): SEGFAULT on riscv64-linux-gnu; #2142 (open): SwissTable test failure on riscv64/aarch64/ppc64le/loongarch64 |
| pthreads / glibc (required) | DFA engine concurrency | Full riscv64 support | Full support | Ships in all riscv64 distro images | None specific to re2 |
| ICU (optional, `-DRE2_USE_ICU=ON`) | Full Unicode property syntax (`\p{...}`) | Builds on riscv64 | No riscv64-specific failures found | Packaged in Debian/Ubuntu riscv64 | None blocking |
| PCRE2 (optional, `-DUSEPCRE=ON`, test/bench only) | Comparison target in test suite and benchmarks | Builds on riscv64; one closed issue (#831) with `-march=rv64gcb_zicond` (combined B+Zicond) triggering JIT test failures with GCC 15 and Clang 21 | #831 closed/resolved | Packaged in distros | None open |
| GoogleTest (optional, test builds) | Unit test framework | Builds on riscv64 | No riscv64-specific failures found | Packaged | None |
| Google Benchmark (optional, bench builds) | `regexp_benchmark` micro-benchmarks | Builds on riscv64 | Benchmark's own test suite has one riscv64 failure (`GetThreadCountTest.ReturnsCorrectValue`) - does not block re2 benchmarks | Packaged | Minor: benchmark self-test failure on riscv64; does not block re2 benchmark execution |

**Abseil-cpp deep-dive (critical dependency):**

RE2's only architecture-sensitive dependency is Abseil. RE2 uses `flat_hash_map` and `flat_hash_set` for DFA state memoization caches. Abseil issue #2142 documents that SwissTable collision counting is incorrect on platforms where `Group::kWidth==8` (which includes riscv64, aarch64, ppc64le, and loongarch64). This is currently an open test failure in the Abseil test suite. Whether this affects RE2's use of `flat_hash_map`/`flat_hash_set` under adversarial hash inputs is not confirmed from the research findings.

Abseil issue #2002 is a SEGFAULT in `hashtablez_sampler` on riscv64-linux-gnu (Debian). This is in Abseil's telemetry/sampling subsystem. Whether it is triggered by normal RE2 operation is not confirmed from the research findings. [NEEDS VERIFICATION]

Cross-references to separate project-reports/scope.yml reports: `project-reports/abseil-cpp.md`, `project-reports/icu.md`, `project-reports/pcre2.md`, `project-reports/benchmark.md`, `project-reports/googletest.md`.

---

## 10. Ecosystem Status

RE2 has language binding packages on PyPI (`re2`), npm (`re2` via `node-re2`), Ruby gems, and Perl (`libre-engine-re2-perl`) that must each separately provide riscv64 support.

**Python (`re2` on PyPI):**

- Current version: 0.2.24
- riscv64 wheel: absent. Only `linux-x86_64` binary wheel and source distributions are published.
- RISE wheel builder: re2 is not listed. No RISE-funded riscv64 wheel work found.
- Users on riscv64 must build from source via `pip install re2 --no-binary re2`, which requires Abseil headers and a C++17 compiler.

**Node.js (`node-re2`):**

- Available in Ubuntu 24.04 as `node-re2` with riscv64 listed as a supported architecture.
- npm registry riscv64 wheel status: not checked directly from available research data.

**Ruby (`ruby-re2`):**

- Available in Ubuntu 24.04 with riscv64 listed as a supported architecture.
- Gem-level riscv64 binary status: not confirmed from research findings. [NEEDS VERIFICATION]

**Varnish (`varnish-re2`):**

- Available in Ubuntu 24.04 with riscv64 listed as a supported architecture.

**Perl (`libre-engine-re2-perl`):**

- Available in Ubuntu 24.04 with riscv64 listed as a supported architecture.

The primary gap is the Python PyPI wheel. All other language bindings have at least distro-level riscv64 packaging. The PyPI wheel gap means Python users on riscv64 cannot install a pre-built binary from PyPI and must compile from source.

---

## 11. Known Bugs and Active Issues

**riscv64-specific issues:** Zero open issues in google/re2 referencing RISC-V. All searches (GitHub Issues API, PRs CLI, Commits API, Code search, full issue list regex filter) returned zero results.

**Cross-platform open issues affecting riscv64:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #596 | Segfault in RE2 compiler compiling crafted regex `((([a-])))` - null read in `raw_hash_set` iterator during `CachedRuneByteSuffix` | Open (2026-03-30) | Critical (security-relevant, all platforms) | Triggered by crafted regex input; affects all architectures |
| #589 | Null-deref in RE2 DFA/hash-set teardown triggered by `max_mem=4096` - uninitialized `generation` pointer in abseil `flat_hash_*` containers | Open (2026-01-08) | Critical (security-relevant, all platforms) | Triggered by low `max_mem` setting; affects all architectures |
| #569 | Lock contention when `re2::RE2` object is shared between threads - `absl::Mutex` dominates runtime (80-90% CPU) | Open (2025-09-05) | High (performance, all platforms) | Affects all architectures including riscv64; single-threaded use faster than multi-threaded |
| #615 | Self-move-assignment in `RE2::Set` and `FilteredRE2` causes use-after-destroy | Open (2026-03-30) | High (correctness, all platforms) | Undefined behavior; affects all architectures |
| #613 | `FilteredRE2::AllMatches` and `AllPotentials` missing `compiled_` check | Open (2026-03-30) | Medium (correctness, all platforms) | All architectures |
| #611 | `Workq::mark()` sets `last_was_mark_` to false instead of true | Open (2026-03-30) | Medium (correctness, all platforms) | All architectures |
| #605 | `GlobalReplace` with patterns ending in `.*$` scans entire input via BitState unnecessarily | Open (2026-03-11) | Medium (performance, all platforms) | PR #607 proposes a fix; affects log-processing workloads on all platforms |
| #646 | `re2: parse float/double args with locale-independent from_chars` | Open (2026-07-01) | Medium (correctness, all platforms) | `LC_NUMERIC` comma-decimal locales cause incorrect captures; all platforms |

No bugs are specific to riscv64. The two security-relevant bugs (#589, #596) are the highest priority open issues and affect all platforms equally.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. The google/re2 issue tracker contains zero RISC-V discussions, which means no objections have been raised and no process has started.

**Technical blockers:** None. RE2 is pure portable C++17 with no architecture-specific code. It compiles on riscv64 without modification. Debian and Ubuntu have been shipping riscv64 packages without any upstream changes.

**Organizational blockers:** Contributions require a Google CLA. This is a standard barrier, not a RISC-V-specific one. The two-person maintainer pool (Wankadia, Cox) means review bandwidth is limited, but there is no stated policy against riscv64 CI additions.

**Acceptance probability for a riscv64 CI addition:** High [NEEDS VERIFICATION]. The ARM64 confirmation (issues #519, #527, Jul 2025) indicates the maintainers are receptive to architecture compatibility work. Adding a riscv64 QEMU-based CI job in `ci-cmake.yml` is a straightforward change that requires no code modifications to RE2 itself.

---

## 13. Investment Analysis

RISE has done no work on re2. No RISE blog posts, no RISE org repos, no RISE wheel builder entry for re2 were found. All riscv64 availability is from downstream distro packaging with no upstream involvement.

### 13.1 Functional Enablement

RE2 itself is already fully functional on riscv64. No upstream code changes are required. The C++ library builds and runs correctly.

The Python PyPI wheel is the only functional gap for end users. riscv64 users cannot `pip install re2` and get a binary; they must compile from source. Adding a riscv64 manylinux wheel to the upstream `python.yml` workflow requires adding `linux/riscv64` to the matrix, which requires either a QEMU-emulated build or a native riscv64 runner. The `python.yml` currently uses `quay.io/pypa/manylinux_2_28_<arch>` containers; a manylinux riscv64 container may not be available.

### 13.2 Performance Optimization

RE2 has no SIMD optimizations for any architecture. Adding RVV-accelerated string scanning would be novel work - it does not exist for x86 SSE/AVX or ARM NEON either (issue #383 was closed without action). This is a high-effort, high-risk investment with uncertain upstream acceptance given that the x86 request was rejected.

The highest-impact performance fix is the lock contention bug (#569), which affects all architectures. That is upstream work unrelated to riscv64 specifically.

### 13.3 CI/CD Infrastructure

Adding riscv64 to upstream CI requires:
- Adding a QEMU-based job to `ci-cmake.yml` or `ci.yml` using `ubuntu:24.04` with `qemu-user-static` and cross-compilation
- Or securing a native riscv64 GitHub Actions runner

This is low-effort, low-risk work. The main constraint is runner availability. RISE infrastructure (if a riscv64 GitHub Actions runner is available) would unblock this directly.

### 13.4 Ecosystem Enablement

The Python PyPI wheel gap is the most user-visible issue. Work items:
- Add riscv64 to `python.yml` wheel build matrix (requires manylinux riscv64 container)
- Submit wheel to PyPI

RISE wheel builder inclusion would provide the riscv64 Python wheel as a stopgap independent of upstream.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 QEMU cross-compile job to `ci-cmake.yml` | 0.5 | Contributor + RISE runner infra | High |
| Ecosystem | Add riscv64 manylinux Python wheel to `python.yml` | 1 | Contributor or RISE wheel builder | High |
| Ecosystem | Add re2 to RISE wheel builder index | 0.5 | RISE | High |
| Functional | Resolve open correctness bugs (#589, #596) - all platforms | 3-5 | Google maintainers (upstream) | Critical |
| Performance | Fix lock contention (#569) - all platforms | 2-4 | Google maintainers (upstream) | High |
| Performance | RVV-accelerated string scanning | 8-16 | riscv64 specialist | Low (upstream rejection risk) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/re2 GitHub repository](https://github.com/google/re2)
- [re2 releases page](https://github.com/google/re2/releases)
- [re2 CI workflow - ci.yml](https://github.com/google/re2/blob/main/.github/workflows/ci.yml)
- [re2 CI workflow - ci-cmake.yml](https://github.com/google/re2/blob/main/.github/workflows/ci-cmake.yml)
- [re2 CI workflow - ci-bazel.yml](https://github.com/google/re2/blob/main/.github/workflows/ci-bazel.yml)
- [re2 Python wheel CI - python.yml](https://github.com/google/re2/blob/main/.github/workflows/python.yml)
- [re2 issue #569 - lock contention](https://github.com/google/re2/issues/569)
- [re2 issue #589 - null-deref with max_mem=4096](https://github.com/google/re2/issues/589)
- [re2 issue #596 - segfault on crafted regex](https://github.com/google/re2/issues/596)
- [re2 issue #605 - GlobalReplace O(n) waste](https://github.com/google/re2/issues/605)
- [re2 issue #611 - Workq::mark() bug](https://github.com/google/re2/issues/611)
- [re2 issue #613 - FilteredRE2 missing compiled_ check](https://github.com/google/re2/issues/613)
- [re2 issue #615 - self-move-assignment use-after-destroy](https://github.com/google/re2/issues/615)
- [re2 issue #646 - locale-dependent float parsing](https://github.com/google/re2/issues/646)
- [re2 on PyPI](https://pypi.org/project/re2/)
- [Ubuntu 24.04 re2 packages](https://packages.ubuntu.com/search?keywords=re2&suite=noble)
- [Debian tracker for re2](https://tracker.debian.org/pkg/re2)
- [Debian buildd status for re2](https://buildd.debian.org/status/package.php?p=re2)
- [Abseil issue #1702 - cross-compile atomics link failure with GCC 11](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil issue #2002 - SEGFAULT in hashtablez sampler on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [Abseil issue #2142 - SwissTable collision test failure on kWidth==8 platforms](https://github.com/abseil/abseil-cpp/issues/2142)
- [PCRE2 issue #831 - JIT mis-compile with rv64gcb_zicond march flags (closed)](https://github.com/PCRE2Project/pcre2/issues/831)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)