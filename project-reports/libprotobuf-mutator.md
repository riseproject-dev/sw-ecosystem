---
title: libprotobuf-mutator
parent: Project Reports
---

# libprotobuf-mutator

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for libprotobuf-mutator<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libprotobuf-mutator is a C++ library that provides structure-aware mutation of Protocol Buffer messages for use with coverage-guided fuzz testing engines (libFuzzer, AFL++). It is used by OSS-Fuzz and Chromium as the primary mechanism for generating semantically valid protobuf inputs during fuzzing campaigns. The library is distributed as a source-only C++14 project built with CMake.

**Governance:** No formal foundation or governance body. The project lives under the `google` GitHub organization. No CLA, MAINTAINERS, or OWNERS file exists. Contribution norms follow the standard GitHub PR workflow.

**License:** Apache-2.0.

**Corporate maintainers:**
- Vitaly Buka (Google, GitHub: vitalybuka) -- 338 of approximately 430 total commits (~79%), active through 2026. Primary maintainer.
- Kostya Serebryany (Google, GitHub: kcc) -- founder and original author. Project created December 2016, repository opened January 2017.
- Sebastian Pipping (independent, GitHub: hartwork) -- 23 commits, most recent 2025-2026, CI and build improvements.
- Jonathan Metzman (Google, GitHub: jonathanmetzman) -- 4 commits.

The project is overwhelmingly Google-staffed. No organizational diversity exists among core maintainers. The project has 35 open issues and 2 open PRs as of August 2026, indicating light maintenance activity.

**Community stance on new ports:** No stated policy exists. The library is pure C++ with no architecture-specific code, so a RISC-V port would amount to adding riscv64 to the CI matrix. Given that arm64 is not in the CI matrix either (see Section 7), there is no precedent for architecture-specific CI expansion. No community discussion of RISC-V has occurred.

**RISE Project:** No involvement. libprotobuf-mutator does not appear on [riseproject.dev](https://riseproject.dev), is absent from all RISE working group trackers (security-software-wg, system-libraries-wg, compilers-and-toolchains-wg, language-runtimes-wg), and is not in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2016-10-19 | First commits by Vitaly Buka | [google/libprotobuf-mutator](https://github.com/google/libprotobuf-mutator) |
| 2017-01-11 | Repository opened on GitHub | [google/libprotobuf-mutator](https://github.com/google/libprotobuf-mutator) |
| -- | No RISC-V port initiated | GitHub issue/PR/code search: 0 results |

No RISC-V port history exists. Searches for "riscv", "riscv64", and "risc-v" across all commits, issues, PRs, and code in the repository returned zero results via every search path (gh CLI, GitHub API, GitHub UI, WebSearch).

The `port/` subdirectory in the repository is not a CPU architecture abstraction layer. It contains `gtest.h` and `protobuf.h` -- wrapper headers for test and protobuf library dependencies. It has no CPU architecture significance.

---

## 3. Upstream Support Tier

No formal platform tier policy exists. The project makes no architectural commitments in documentation or policy files.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI coverage | Yes (ubuntu-22.04, ubuntu-24.04) | No | No |
| Official binaries | No (source-only) | No (source-only) | No (source-only) |
| Release-blocking tests | Yes (x86 runners) | No | No |
| Architecture-specific code | None | None | None |
| Known build status | Passes CI | [NEEDS VERIFICATION] (issue #292 open: arm64 breakage with `-msse4.1` from bundled protobuf/absl) | Untested; expected to build from source |

The arm64 situation is directly relevant: [issue #292](https://github.com/google/libprotobuf-mutator/issues/292) is an open build failure on macOS arm64 caused by the bundled protobuf/absl passing `-msse4.1` flags to arm64 compilation. This demonstrates that non-x86 correctness is not validated by the project. No equivalent riscv64 issue exists, but no riscv64 build has been attempted in any tracked context.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libprotobuf-mutator is a pure portable C++14 library. It performs protobuf structure mutation entirely at the language level with no architecture-specific code paths.

| Component | Description | amd64 | arm64 | riscv64 |
|-----------|-------------|-------|-------|---------|
| Core mutation engine (mutator.cc) | Traverses protobuf message trees, applies random field mutations | scalar C++ | scalar C++ | scalar C++ |
| Binary format serializer (binary_format.cc) | Serializes/deserializes protobuf binary wire format | scalar C++ | scalar C++ | scalar C++ |
| Text format serializer (text_format.cc) | Serializes/deserializes protobuf text format | scalar C++ | scalar C++ | scalar C++ |
| UTF-8 fix (utf8_fix.cc) | Corrects invalid UTF-8 sequences in string fields | scalar C++ | scalar C++ | scalar C++ |
| libFuzzer integration (libfuzzer_macro.cc) | Hooks into libFuzzer's custom mutator interface | scalar C++ | scalar C++ | scalar C++ |
| Build system (CMakeLists.txt) | CMake build configuration | no arch flags | no arch flags | no arch flags |

No JIT backends. No SIMD dispatch. No assembly files. No `arch/riscv/` directory. No RVV, Zba, Zbb, or any RISC-V ISA extension intrinsics. No `#ifdef __riscv`, `#ifdef __x86_64__`, or `#ifdef __aarch64__` guards exist in the codebase (all three GitHub code searches returned zero results). `CMakeLists.txt` checks only MSVC vs non-MSVC, compiler version (Clang >= 12), and sanitizer flag availability -- no `CMAKE_SYSTEM_PROCESSOR` conditional, no architecture-specific compile flags.

This is intentional design. The library is architecture-neutral by construction. riscv64 receives identical scalar C++14 code as every other platform. No RISC-V-specific work is required or missing from a functional standpoint.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (minimum version 3.13; version 3.24 required when `LIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF=ON`).

**Standard native build (from README and CI workflow):**

```sh
mkdir build && cd build
cmake .. -GNinja \
  -DCMAKE_C_COMPILER=clang \
  -DCMAKE_CXX_COMPILER=clang++ \
  -DCMAKE_BUILD_TYPE=Debug
ninja check
```

**Build with bundled protobuf (downloads protobuf v29.3 + abseil-cpp):**

```sh
cmake .. -GNinja \
  -DCMAKE_C_COMPILER=clang \
  -DCMAKE_CXX_COMPILER=clang++ \
  -DCMAKE_BUILD_TYPE=Release \
  -DLIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF=ON
```

**Key CMake flags:**

| Flag | Default | Notes |
|------|---------|-------|
| `LIB_PROTO_MUTATOR_TESTING` | ON | Builds test targets |
| `LIB_PROTO_MUTATOR_EXAMPLES` | ON | Builds examples |
| `LIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF` | OFF | Downloads protobuf v29.3 + absl; requires CMake >= 3.24 |
| `LIB_PROTO_MUTATOR_WITH_ASAN` | OFF | Enables `-fsanitize=address` |
| `LIB_PROTO_MUTATOR_FUZZER_LIBRARIES` | "" | External fuzzing engine libs (e.g., AFL++) |
| `LIB_PROTO_MUTATOR_EXAMPLES_USE_LATEST` | OFF | Use latest libexpat/libxml2 versions |
| `LIB_PROTO_MUTATOR_MSVC_STATIC_RUNTIME` | ON (MSVC only) | Static MSVC runtime |

**Toolchain requirement -- libFuzzer:** CMakeLists.txt enforces Clang >= 12.0.0 for the libFuzzer integration. GCC is sufficient for building the core mutator library only (without fuzzer integration). On riscv64, Clang >= 13 is required for riscv64 sanitizer support [NEEDS VERIFICATION -- no upstream documentation confirms the minimum Clang version for riscv64 sanitizer support].

**riscv64 cross-compilation -- no first-party documentation.** No `cmake/riscv64.cmake` toolchain file, no Dockerfile, no cross-compilation guide exists in the repository. A cross-compilation invocation would follow standard CMake conventions:

```sh
cmake .. -GNinja \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DLIB_PROTO_MUTATOR_TESTING=OFF \
  -DLIB_PROTO_MUTATOR_EXAMPLES=OFF \
  -DLIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF=ON
```

The `LIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF=ON` path propagates `CMAKE_C_COMPILER`, `CMAKE_CXX_COMPILER`, `CMAKE_C_FLAGS`, and `CMAKE_CXX_FLAGS` through to protobuf's CMake build via ExternalProject, so a toolchain file would propagate correctly. The `--start-group`/`--end-group` linker wrapping used for absl is compatible with riscv64-linux-gnu-ld.

**QEMU:** No QEMU references anywhere in the repository.

**Known build failures relevant to riscv64:** The bundled absl/protobuf path has a known `__atomic_exchange_1` undefined reference error on some riscv64 cross-toolchains (abseil-cpp [issue #1702](https://github.com/abseil/abseil-cpp/issues/1702), open). This is a dependency issue, not a libprotobuf-mutator issue, but it blocks the `LIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF=ON` code path on affected toolchains.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Core mutation (all field types) | Full | Full (expected) | Full (expected) |
| Binary protobuf format | Full | Full (expected) | Full (expected) |
| Text protobuf format | Full | Full (expected) | Full (expected) |
| libFuzzer integration | Full (Clang >= 12) | Full (Clang >= 12) | Full (Clang >= 13) [NEEDS VERIFICATION] |
| AFL++ integration (via `LIB_PROTO_MUTATOR_FUZZER_LIBRARIES`) | Full | Full (expected) | Full (expected) |
| ASAN/MSAN/UBSAN | Supported | Supported | Supported via Clang [NEEDS VERIFICATION] |
| SIMD acceleration | None (not applicable) | None (not applicable) | None (not applicable) |

**Functional gaps:** None identified. The library has no features that are gated on architecture-specific code.

**Performance gaps:** No benchmark data exists comparing fuzzing throughput (executions/second) on riscv64 vs amd64 or arm64. Data not available: no published benchmarks searched across GitHub, RISE blog, or general web found riscv64 performance data for libprotobuf-mutator.

**Security hardening gaps:** No architecture-specific hardening exists for any platform. No gap.

**Floating-point/NaN issues:** Not applicable. libprotobuf-mutator handles `float` and `double` protobuf fields as opaque byte sequences during mutation; it does not perform arithmetic on them.

---

## 7. CI/CD Infrastructure

The sole CI configuration is `.github/workflows/cmake-multi-platform.yml`. No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` exist.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner | ubuntu-24.04, ubuntu-22.04 (GitHub-hosted x86_64) | None | None |
| Compiler tested | clang/clang++ | -- | -- |
| Build types tested | Release, Debug | -- | -- |
| Bundled protobuf tested | ON, OFF matrix | -- | -- |
| QEMU emulation | No | No | No |
| Cross-compilation | No | No | No |
| Trigger | push, pull_request, weekly (Fridays 02:00 UTC) | -- | -- |
| RISE runners | No | No | No |
| Release gate | Yes (x86 only) | No | No |

The string "riscv" does not appear anywhere in the CI YAML file. There is no riscv64 runner, no QEMU step, no cross-compile toolchain reference, and no architecture-conditional logic in the CI configuration.

---

## 8. Distribution and Release Status

**GitHub releases:** v1.1 through v1.5 (latest: [v1.5](https://github.com/google/libprotobuf-mutator/releases/tag/v1.5), published 2025-04-08). All releases have zero binary assets -- source tarball and zipball only. No riscv64 binaries are released.

**PyPI:** Not present. `pypi.org/pypi/libprotobuf-mutator/json` returns HTTP 404. libprotobuf-mutator is not a Python package.

**Debian:** Not packaged. `tracker.debian.org/pkg/libprotobuf-mutator` returns HTTP 404. No riscv64 build record exists.

**Ubuntu:** Not packaged in any Ubuntu release including Noble (24.04). No riscv64 package available.

**Arch Linux:** No official package. Available only via AUR (x86_64 only). Not in Arch RISC-V ports.

**Other distributions (from Repology):** ALT Sisyphus 1.5, ConanCenter 1.5, FreeBSD Ports 1.5, openSUSE Leap 15.5, Vcpkg 1.5. None provide riscv64 binary packages.

**To obtain a working binary on riscv64:** A user must build from source. The steps are: clone the repository, install a riscv64-capable C++ toolchain (Clang >= 13 for full fuzzer support, or GCC for core library only), obtain protobuf separately or use `LIB_PROTO_MUTATOR_DOWNLOAD_PROTOBUF=ON` (subject to the abseil atomic link issue on some toolchains), and run CMake with tests and examples disabled if cross-compiling.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| Protocol Buffers | Serialization/mutation schema engine (required) | Builds from source; no upstream CI | No upstream tests | No official protoc binary | Officially unsupported on riscv64 (issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206)); `__atomic_exchange_1` undefined reference via abseil-cpp (issue [#14549](https://github.com/protocolbuffers/protobuf/issues/14549)) |
| Abseil-cpp | Foundation library for protobuf (required, transitive) | Builds from source; community riscv64 support | No upstream CI; SEGFAULT in sampler/cordz tests on Debian riscv64 GCC 15.2 | Source-only | `__atomic_exchange_1` link error on some cross-toolchains (issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702), open); SEGFAULT (issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002), open); CRC32C RVV PR ([#1986](https://github.com/abseil/abseil-cpp/pull/1986)) stuck in Google internal review |
| GoogleTest | Unit test framework (test-only) | Builds on riscv64 | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (issue [#3756](https://github.com/google/googletest/issues/3756), open since 2022) | Source-only | Maintainer stated "we don't officially support risc-v64"; low severity for libprotobuf-mutator tests |
| libexpat | XML fuzzing example (example-only, not core) | Builds cleanly; no arch-specific code | No upstream riscv64 CI; distro testing only | Source-only | No open riscv64 issues |
| libxml2 | XML fuzzing example (example-only, not core) | Builds cleanly; pure portable C | No upstream riscv64 CI; distro testing only | Source-only | Double-checked locking unsafe on weakly-ordered architectures including riscv64 (GitLab issue [#971](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971), 2025-08-13); not a build blocker |
| zlib | Compression support (optional, via `find_package`) | Builds via pure-C path; OpenBSD/riscv64 CI merged 2026-01-28 | OpenBSD/riscv64 CI passes | Source-only | No open riscv64 issues; RVV Adler32 PR ([#1099](https://github.com/madler/zlib/pull/1099)) unmerged, not blocking |
| liblzma (xz-utils) | LZMA compression support (optional, via `find_package`) | Builds on riscv64; RISC-V BCJ filter added v5.5.1alpha (2024-01-26), stable since v5.8.0 | No upstream riscv64 CI; RISC-V filter has upstream test-vector coverage | Source-only | No open blocking issues; issue [#146](https://github.com/tukaani-project/xz/issues/146) closed |
| LLVM libFuzzer | Fuzzing engine (Clang toolchain, not a library dep) | Available in Clang >= 12 for riscv64 on Linux [NEEDS VERIFICATION on minimum version] | Toolchain-dependent | Part of LLVM/Clang releases | No riscv64-specific libFuzzer issues found |

### Blocking Dependency Analysis

**Protocol Buffers -- HIGH severity (required dependency).**
The protobuf maintainers explicitly state riscv64 is unsupported and not on the roadmap. No prebuilt `protoc` binary for riscv64 is released. Source builds may fail with `__atomic_exchange_1` undefined reference depending on toolchain (issue #14549). Full details in `project-reports/protocol-buffers.md`.

**Abseil-cpp -- MEDIUM severity (required, transitive through protobuf).**
Two open riscv64-specific bugs: `__atomic_exchange_1` undefined reference with certain cross-toolchains (issue #1702) and SEGFAULT in `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on Debian riscv64 with GCC 15.2 (issue #2002). Both are open with no fix committed. The `__atomic_exchange_1` issue is toolchain-dependent -- it fails on some configurations, not universally. Full details in `project-reports/abseil-cpp.md`.

**GoogleTest -- LOW severity (test-only dependency).**
`GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (issue #3756, open since 2022). This does not affect libprotobuf-mutator's mutation correctness tests. Full details in `project-reports/googletest.md`.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#292](https://github.com/google/libprotobuf-mutator/issues/292) | Build fails on macOS arm64: bundled protobuf/absl passes `-msse4.1` to arm64 compile | Open | High (arm64 build broken) | Architecture-specific build breakage; demonstrates project does not validate non-x86 builds. Not riscv64-specific but directly relevant to riscv64 risk assessment. |
| [#290](https://github.com/google/libprotobuf-mutator/issues/290) | build: Add/fix remaining bazel/bzlmod boilerplate | Open | Low | Build system completeness |
| [#288](https://github.com/google/libprotobuf-mutator/issues/288) | Compilation issue building "libxml2_example" on MacOS 26.1 | Open | Low | Example-only; not riscv64-related |
| [#287](https://github.com/google/libprotobuf-mutator/issues/287) | AddressSanitizer: heap-buffer-overflow when using repeated on bool type | Open | High (correctness/memory safety) | Architecture-neutral correctness bug in mutation engine |
| [#281](https://github.com/google/libprotobuf-mutator/issues/281) | Please consider publishing new versions to Bazel BCR | Open | Low | Distribution request |
| [#205](https://github.com/google/libprotobuf-mutator/issues/205) | ParsePartialFromString error not handled in mutator.cc | Open | Medium (correctness) | Parse errors silently ignored; affects mutation fidelity |

**Correctness bugs (architecture-neutral):**
- Issue #287: Heap buffer overflow on `repeated bool` fields -- active memory safety defect in the mutation engine. Not architecture-specific but present on all platforms including riscv64.
- Issue #205: Parse errors from `ParsePartialFromString` silently ignored in mutator.cc. Affects mutation correctness on any platform.

No riscv64-specific bugs exist in the upstream tracker. The zero-result RISC-V search reflects both that no port has been attempted and that no one has filed riscv64 issues.

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64.** The project has made no statement on RISC-V. Given the library is pure C++ with zero architecture-specific code, the project leadership would have no technical basis to object to riscv64 CI additions. The open arm64 build failure (issue #292) demonstrates that CI expansion to non-x86 is the main risk.

**Technical blockers:**

1. **Protocol Buffers officially unsupported on riscv64.** The required dependency protobuf has an explicit "not on roadmap" statement for riscv64. This is the primary blocker for any production deployment of libprotobuf-mutator on riscv64. Until protobuf resolves riscv64 support, libprotobuf-mutator on riscv64 requires source-building protobuf from HEAD with no upstream support commitment.

2. **Abseil-cpp riscv64 bugs open.** Issue #1702 (`__atomic_exchange_1`) and issue #2002 (SEGFAULT in sampler tests) are unresolved. Issue #1702 is toolchain-dependent and may not affect all build configurations.

3. **No riscv64 CI.** Adding riscv64 CI would require either QEMU-based emulation (slow) or native riscv64 runners (not currently available on GitHub Actions). Issue #292 demonstrates that even arm64 has unresolved build issues from the bundled protobuf/absl path.

**Organizational blockers:** The project is 79% Vitaly Buka (Google). External contributions are accepted but the pace of review for CI/infrastructure changes from non-Google contributors is unknown. No precedent exists for architecture CI expansion.

**Acceptance probability for a riscv64 CI PR:** Moderate. The library has no architectural objections, and the change would be a CI matrix addition. The arm64 issue #292 would need to be resolved first to avoid introducing a known-broken build. A clean riscv64 CI addition that also fixes #292 would have a stronger acceptance probability.

---

## 13. Investment Analysis

RISE has done no work on libprotobuf-mutator for riscv64. No RISE blog posts, working group issues, or wheel builder entries exist for this project.

### 13.1 Functional Enablement

The library itself requires no functional work for riscv64 -- it is pure portable C++14. The work is entirely in resolving dependency blockers (protobuf, abseil-cpp) and validating the build.

### 13.2 Performance Optimization

No performance optimization opportunity exists in libprotobuf-mutator itself -- there is no architecture-specific code to add. Fuzzing throughput on riscv64 will be limited by the fuzzing engine (libFuzzer/AFL++) and the protobuf serialization layer, not by libprotobuf-mutator's mutation logic.

### 13.3 CI/CD Infrastructure

Adding riscv64 to the upstream CI matrix is the primary investment item. This requires either QEMU emulation via GitHub Actions or coordination with RISE for native riscv64 runners.

### 13.4 Ecosystem Enablement

libprotobuf-mutator has no dependent package ecosystem requiring separate enablement (Section 10 omitted per scope rules). The downstream consumers (OSS-Fuzz, Chromium) would need separate assessment.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Resolve abseil-cpp `__atomic_exchange_1` link error on riscv64 cross-toolchains (issue #1702) | 1-2 | abseil-cpp maintainers / Qualcomm | High |
| Functional | Validate libprotobuf-mutator core library build and tests on riscv64 native hardware or QEMU | 0.5 | Qualcomm / RISE | High |
| Functional | Fix arm64 build breakage from bundled protobuf/absl `-msse4.1` issue (#292) as a precondition for riscv64 CI | 1-2 | Qualcomm / community | High |
| CI/CD | Add riscv64 QEMU or native runner to upstream GitHub Actions matrix | 1 | Qualcomm / RISE | Medium |
| CI/CD | Coordinate RISE native riscv64 runner availability for GitHub Actions | 2-4 (coordination) | RISE | Medium |
| Performance | No items -- library has no architecture-specific performance paths | -- | -- | -- |
| Functional | Resolve protobuf riscv64 upstream support (tracked separately in protobuf report) | See protobuf report | protobuf maintainers / Qualcomm | Critical (dependency) |

**Total libprotobuf-mutator-specific effort (excluding protobuf dependency):** 5-10 person-weeks. The critical path is the protobuf riscv64 support blocker, which is tracked in a separate report.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/libprotobuf-mutator repository](https://github.com/google/libprotobuf-mutator)
- [libprotobuf-mutator release v1.5](https://github.com/google/libprotobuf-mutator/releases/tag/v1.5)
- [.github/workflows/cmake-multi-platform.yml](https://github.com/google/libprotobuf-mutator/blob/master/.github/workflows/cmake-multi-platform.yml)
- [Issue #292: macOS arm64 build failure with -msse4.1 from bundled protobuf/absl](https://github.com/google/libprotobuf-mutator/issues/292)
- [Issue #287: heap-buffer-overflow on repeated bool type](https://github.com/google/libprotobuf-mutator/issues/287)
- [Issue #205: ParsePartialFromString error not handled in mutator.cc](https://github.com/google/libprotobuf-mutator/issues/205)
- [abseil-cpp issue #1702: __atomic_exchange_1 undefined reference on riscv64](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #2002: SEGFAULT in hashtablez/cordz tests on Debian riscv64 GCC 15.2](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp PR #1986: CRC32C RVV acceleration](https://github.com/abseil/abseil-cpp/pull/1986)
- [protobuf issue #17798: riscv64 support tracking](https://github.com/protocolbuffers/protobuf/issues/17798)
- [protobuf PR #23206: riscv64 support](https://github.com/protocolbuffers/protobuf/pull/23206)
- [protobuf issue #14549: __atomic_exchange_1 undefined reference via abseil-cpp](https://github.com/protocolbuffers/protobuf/issues/14549)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [libxml2 issue #971: double-checked locking unsafe on weakly-ordered architectures](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971)
- [zlib PR #1099: RVV-accelerated Adler32 from ZTE](https://github.com/madler/zlib/pull/1099)
- [xz-utils issue #146: TUKLIB_FAST_UNALIGNED_ACCESS for riscv64](https://github.com/tukaani-project/xz/issues/146)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)