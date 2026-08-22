---
title: fuzztest
---

# fuzztest

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for fuzztest<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[FuzzTest](https://github.com/google/fuzztest) is a C++ fuzzing framework developed by Google. It provides a unit-testing-style API for coverage-guided fuzzing, integrating with GoogleTest and supporting both a native Centipede backend (coverage-guided, in-process) and a libFuzzer compatibility mode. It ships a structured mutation system (domains) with support for custom types, protobuf inputs, FlatBuffers, and grammars via ANTLR4. The Centipede engine is the primary coverage-guided backend; it relies on LLVM SanitizerCoverage instrumentation hooks.

**Governance:** Corporate open-source under Google stewardship exclusively. All commits flow from Google's internal Piper monorepo via Copybara (`copybara-worker@google.com`). Every commit message carries a `PiperOrigin-RevId:` tag. External contributions require signing Google's CLA. There is no foundation affiliation (not Linux Foundation, CNCF, or Apache), no TSC, and no external maintainers.

**Top contributors (all Google employees):**
- Xinhao Yuan (`xinhaoyuan@google.com`) - 385 commits, most active maintainer
- Filip Niksic (`fniksic`) - 205 commits
- Sergey Shevchenko (`ussuri`) - 203 commits
- Kostya Serebryany (`kcc`, creator of AddressSanitizer and libFuzzer) - 85 commits
- Laszlo Szekeres (`lszekeres`) - 109 commits
- Shashank Sharma (`the-shank`) - 22+ commits (Rust port, most active in 2026)
- David Korczynski (Adalogics) - 9 commits (only notable non-Google contributor)

**RISE membership:** Google LLC is a Premier Member of the RISE project. FuzzTest itself is not a direct RISE member project. No RISE blog posts, funded work, or CI involvement with fuzztest was found via any search path.

**Community stance on new architecture ports:** No public policy document exists (no PLATFORMS.md, SUPPORT.md, or equivalent). The project has never publicly discussed a RISC-V port. No RISC-V tracking issue, proposal, or community thread exists anywhere in the repository. The project is developed primarily for internal Google use and open-sourced as-is.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V port work has ever been started | [github.com/google/fuzztest issues](https://github.com/google/fuzztest/issues) - 0 results for "riscv" or "riscv64" |
| - | No RISC-V PRs filed | [github.com/google/fuzztest pulls](https://github.com/google/fuzztest/pulls) - 0 results |
| - | No RISC-V commits in repo history | GitHub REST `search/commits?q=riscv+repo:google/fuzztest` - 0 results |

No port history exists. The only occurrence of the string "riscv64" in the entire repository is inside `Cargo.Bazel.lock`, where it appears as a platform specifier in metadata for the third-party Rust crate `rustix`. This is upstream dependency metadata, not fuzztest architecture code.

There are no contributors with documented RISC-V work, no external contributors working on a port, and no indication that any port effort is planned.

---

## 3. Upstream Support Tier

No formal tier policy document exists in the repository. The project is implicitly x86_64-primary with aarch64 as a secondary supported target (tested via macOS on Apple Silicon). Support status is inferred from CI coverage and binary availability.

| Tier criterion | amd64 | arm64 | riscv64 |
|----------------|-------|-------|---------|
| CI coverage | ubuntu-22.04 (all 4 workflows) | macos-15 (one workflow) | None |
| Release binary | Source tarball only | Source tarball only | None |
| Fuzzing mode compilable | Yes (Clang required) | Yes (Clang required) | No - hard `#error` at compile time |
| Unit test mode compilable | Yes (GCC or Clang) | Yes (GCC or Clang) | Untested; blocked by Centipede `#error` in fuzzing mode |
| Sanitizer instrumentation | Full (ASAN, SanitizerCoverage) | Full | Unknown; depends on Clang riscv64 sanitizer backend |
| Distro package | None upstream | None upstream | None |

**riscv64 is not a supported tier.** There is no stated tier policy; the architecture is simply absent from all CI, documentation, and release artifacts.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

FuzzTest consists of two layers: the user-facing domain/mutation API (architecture-neutral C++ templates) and the Centipede coverage engine (architecture-specific in one critical function).

### Hard compile blocker

`centipede/sancov_callbacks.cc` contains the following function called from `__sanitizer_cov_trace_pc()`:

```c
static uintptr_t ReturnAddressToCallerPc(uintptr_t return_address) {
#ifdef __x86_64__
  return return_address - 5;
#elif defined(__aarch64__)
  return return_address - 4;
#else
#error "unsupported architecture"
#endif
}
```

This is a hard compile-time failure for any architecture other than x86_64 and aarch64. Compiling Centipede (the fuzzing backend) on riscv64 will abort with `#error "unsupported architecture"`. This is not a runtime degradation; it is a build failure.

### Component-level assessment

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| `ReturnAddressToCallerPc` (sancov_callbacks.cc) | Full (hardcoded -5 byte offset) | Full (hardcoded -4 byte offset) | Missing - `#error` compile failure | Call instruction size differs per ISA; RISC-C compressed instructions make this non-trivial |
| `ForEachNonZeroByte` (centipede/foreach_nonzero.h) | Scalar C, word-size iteration | Scalar C, word-size iteration | Scalar C (RISC-V is LE; logic would run) | Comment: "assumes little-endianness." No arch guard. Compiles but not optimized for riscv64 |
| JIT backend | None | None | None | FuzzTest has no JIT; delegates to LLVM sanitizer |
| SIMD / RVV intrinsics | None | None | None | No SIMD in any source file |
| Assembly (.S files) | None | None | None | No assembly anywhere in the tree |
| SanitizerCoverage instrumentation | Full (ASAN, inline-8bit-counters, trace-cmp) | Full | Unknown | Depends on Clang riscv64 sanitizer backend availability |
| CMake architecture detection | None | None | None | No ISA extension detection in build system |

**Summary:** FuzzTest has no architecture-specific code except for the two hardcoded constants in `sancov_callbacks.cc`. The domain/mutation layer is portable C++17. The blocker is entirely in the Centipede SanitizerCoverage callback and is a one-function fix, but it requires knowledge of RISC-V call instruction encoding (which is variable-length due to the C extension).

---

## 5. Build System, Cross-Compilation, and Toolchain

### Supported build systems

FuzzTest supports CMake (primary) and Bazel. The Rust bindings use Cargo (Bazel-wrapped via `Cargo.Bazel.lock`).

### CMake build commands (from official documentation and CI)

**Unit test mode (GCC or Clang):**
```sh
CC=clang CXX=clang++ cmake \
  -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=RelWithDebug \
  -DFUZZTEST_BUILD_TESTING=on \
  -DFUZZTEST_BUILD_FLATBUFFERS=on
cmake --build build -j $(nproc)
ctest --test-dir build -j $(nproc) --output-on-failure
```

**Fuzzing mode (Clang only - GCC rejected with FATAL_ERROR):**
```sh
CC=clang CXX=clang++ cmake \
  -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=RelWithDebug \
  -DFUZZTEST_FUZZING_MODE=on \
  -DFUZZTEST_BUILD_TESTING=on \
  -DFUZZTEST_BUILD_FLATBUFFERS=on
cmake --build build -j $(nproc)
```

**Compatibility mode (libFuzzer, Clang only):**
```sh
CC=clang CXX=clang++ cmake \
  -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=RelWithDebug \
  -DFUZZTEST_COMPATIBILITY_MODE=libfuzzer
cmake --build build -j $(nproc)
```

### Toolchain requirements

- CMake minimum: 3.19
- C++ standard: C++17 required
- Clang: mandatory for fuzzing mode and libfuzzer compatibility mode. `CMakeLists.txt` issues `FATAL_ERROR` for GCC in those modes: `"Compilation with GCC is not yet supported for fuzztest mode. Please use Clang."`
- GCC: permitted only for unit test mode (no coverage instrumentation)
- Any compiler other than Clang/GCC/AppleClang triggers `FATAL_ERROR "Compiler ${CMAKE_CXX_COMPILER_ID} is not supported"`
- No explicit minimum Clang or GCC version is stated in CMake files [NEEDS VERIFICATION]; CI uses whatever ships with ubuntu-22.04

### Known CMake -D flags

| Flag | Values | Effect |
|------|--------|--------|
| `FUZZTEST_BUILD_TESTING` | on/off | Builds domain tests and e2e tests |
| `FUZZTEST_BUILD_FLATBUFFERS` | on/off | Builds FlatBuffers mutation support |
| `FUZZTEST_FUZZING_MODE` | on/off | Enables coverage + ASan instrumentation |
| `FUZZTEST_COMPATIBILITY_MODE` | "" or "libfuzzer" | Uses libFuzzer as external engine |

Fuzzing mode adds these flags automatically via `fuzztest_setup_fuzzing_flags()`: `-g -DFUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION -UNDEBUG -fsanitize=address -fsanitize-coverage=inline-8bit-counters -fsanitize-coverage=trace-cmp -DADDRESS_SANITIZER`.

### riscv64-specific build status

- No `cmake/toolchain-riscv64.cmake` or any cross-compilation toolchain file exists
- No `Dockerfile.riscv64` or riscv64 CI job exists
- No QEMU usage is documented anywhere
- `doc/quickstart-cmake.md` states "A Linux-based operating system" and "Clang" with no mention of cross-compilation or non-x86 architectures
- The only practical path to a riscv64 build today is native compilation on a riscv64 Linux host, which will fail at the `#error` in `sancov_callbacks.cc` when building Centipede in fuzzing mode

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Unit test mode (no fuzzing) | Full | Full | Blocked by Centipede `#error`; domain API itself is portable C++17 and would likely compile |
| Fuzzing mode (Centipede backend) | Full | Full | Does not compile - hard `#error` in `sancov_callbacks.cc` |
| libFuzzer compatibility mode | Full | Full | Blocked by same `#error`; depends on LLVM libFuzzer riscv64 support separately |
| SanitizerCoverage (ASAN, MSAN, TSAN) | Full | Full | Depends on Clang riscv64 sanitizer backend (available Clang 13+) [NEEDS VERIFICATION] |
| Structured fuzzing (proto, flatbuffers, antlr4 grammars) | Full | Full | Blocked (fuzzing mode prerequisite) |
| Corpus management (Centipede) | Full | Full | Blocked |
| Rust bindings | Full | Full | Rust target `riscv64gc-unknown-linux-gnu` is listed in `Cargo.Bazel.lock` as a supported platform for the `rustix` crate; the fuzztest Rust API availability on riscv64 is untested |
| Hardware CRC32C acceleration | Yes (SSE4.2) | Yes (ARMv8 CRC32) | No (abseil PR #1986 open, not merged) |
| NaN / floating-point semantics | No known issues | No known issues | No data available: not tested |

**Performance delta from missing SIMD:** FuzzTest itself has no SIMD paths. All SIMD exposure comes through abseil-cpp (CRC32C). The performance impact on fuzzing throughput from falling back to software CRC32C is expected to be negligible relative to the cost of executing fuzzing targets.

**Security hardening gaps:** ASan and SanitizerCoverage instrumentation for riscv64 depends on Clang's backend support. Data not available: no riscv64 ASan test results for the FuzzTest use case were found.

---

## 7. CI/CD Infrastructure

All CI is hosted on GitHub Actions. Four workflow files exist:

| Workflow file | Runners used | Tests |
|---------------|-------------|-------|
| `.github/workflows/bazel_test.yml` | ubuntu-22.04 only | Bazel build and test (Clang and GCC modes) |
| `.github/workflows/bazel_test_centipede.yml` | ubuntu-22.04, macos-15 | Centipede-specific Bazel tests |
| `.github/workflows/cmake_test.yml` | ubuntu-22.04 only | CMake build and CTest |
| `.github/workflows/cargo_test.yml` | ubuntu-22.04 only | Rust/Cargo build and test |

The string "riscv" does not appear in any of the four workflow files. No QEMU cross-compilation step exists. No riscv64 runner, emulated or hardware, is configured anywhere.

| CI criterion | amd64 (ubuntu-22.04) | arm64 (macos-15) | riscv64 |
|---|---|---|---|
| Build tested | Yes | Yes (macOS only) | No |
| Tests run | Yes | Yes | No |
| Fuzzing mode tested | Yes | No | No |
| RISE runner used | No | No | No |
| Hardware runner | GitHub-hosted x86_64 | GitHub-hosted Apple Silicon | None |

No RISE CI runner is configured. No RISC-V CI of any kind exists.

---

## 8. Distribution and Release Status

**GitHub Releases:** Source-only tarballs. The five most recent releases (2026-06-29, 2026-02-19, 2026-02-18, 2025-08-05, 2025-07-28) each contain exactly one asset: `fuzztest-<date>.tar.gz`. No binary packages, no architecture-specific assets, and no filenames containing "riscv64" or any architecture string.

| Distribution channel | riscv64 availability |
|---|---|
| GitHub Releases | Source tarball only - no binaries for any architecture |
| PyPI | HTTP 404 - fuzztest is not a Python package |
| Ubuntu 24.04 noble | Not packaged |
| Debian | HTTP 404 at tracker.debian.org/pkg/fuzztest - not packaged in any Debian suite |
| Arch Linux RISC-V (archriscv.felixc.at) | Not listed |
| RISE PyPI mirror (wheel builder) | Not listed |
| OCI / container images | Data not available: no search was performed for fuzztest container images |

**To get a working fuzztest binary on riscv64 today:** A user must build from source on a riscv64 Linux host. This will fail in fuzzing mode due to the `#error` in `sancov_callbacks.cc`. Unit test mode may compile if the `sancov_callbacks.cc` error is patched or the Centipede backend is excluded from the build, but this has not been tested.

---

## 9. Dependencies

### Summary table

| Dependency | Version (CMake FetchContent) | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| abseil-cpp | 20260526.0 | Core utilities (strings, hash, CRC, synchronization, stacktrace) | Builds (Debian sid, rv-osuosl-02) | 2 segfault failures (issues #2002, #1702) | Distro packages only | #1702 (cross-compile missing `-latomic`), #2002 (hashtablez + cordz sampler segfaults on riscv64 Debian GCC 15.2), PR #1986 (CRC32C Zbc/Zbkc acceleration not merged) |
| re2 | 2025-11-05 | Regex engine for mutation and corpus filtering | Builds (Debian sid) | No riscv64-specific issues | Distro packages only | None known; AVX2 path falls back gracefully |
| googletest | v1.17.0 | Unit test framework | Builds (Debian sid, v1.18.0 installed) | Issue #3756 open: `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Distro packages only | #3756 (open since 2022, not resolved; low severity for production use) |
| protobuf | v33.5 | Proto mutation support, structured fuzzing | Builds (Debian sid, v3.21.12-16) | No open riscv64 test issues | No `protoc-linux-riscv64` prebuilt binary | No official `protoc` riscv64 prebuilt; CI pipelines requiring binary protoc must build from source (#17798 closed without prebuilt; #23205/#23206 closed "not planned") |
| flatbuffers | v25.12.19 | Corpus serialization (flatbuffers mutation domain) | Builds (Debian sid, v23.5.26 installed) | No riscv64-specific issues | Distro packages only | None known |
| nlohmann_json | v3.12.0 | JSON config/corpus parsing (test-only) | arch:all header-only | No riscv64 issues | Not architecture-specific | None |
| antlr4 C++ runtime | 4.13.2 | Grammar-based structured fuzzing | Debian sid has v4.9.2 | No riscv64 issues tracked | No riscv64 prebuilt from upstream | Version mismatch: Debian 4.9.2 vs upstream 4.13.2 [NEEDS VERIFICATION] |
| riegeli | 0.0.0-20250822 (Bazel only) | Corpus record serialization and storage | Not in Debian; Bazel fetch only | No riscv64 issues filed | No distro packages | Effectively untested on riscv64; no CI coverage outside x86_64 |
| libfuzzer (LLVM) | System Clang | Compatibility mode engine | Builds as part of LLVM/Clang riscv64 | Tested via LLVM project | Part of LLVM releases | None known specific to riscv64 |

### Deep dive: abseil-cpp on riscv64

Abseil-cpp is the most critical dependency. Three open issues affect riscv64 directly:

1. **Issue #1702** (open): Cross-compilation of abseil targeting riscv64 fails with a link error due to missing `-latomic` for byte-sized atomic operations. Affects any toolchain that does not automatically inject `-latomic` (e.g., older GCC cross-toolchains). FuzzTest uses abseil synchronization primitives throughout.

2. **Issue #2002** (open): `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` segfault on Debian riscv64 with GCC 15.2. This is a sampling/profiling subsystem bug. FuzzTest's use of absl hash tables (for corpus deduplication and domain state) could trigger similar crashes in production use, not just tests.

3. **PR #1986** (open, not merged): Adds CRC32C hardware acceleration via RISC-V Zbc/Zbkc ISA extensions. Without this, corpus checksumming in Centipede falls back to software CRC32C. Performance impact is expected to be minor but measurable at high throughput.

### Note on `foreach_nonzero.h` and little-endianness

`centipede/foreach_nonzero.h` iterates word-by-word over coverage bitmaps. An inline comment states it assumes little-endian byte order. RISC-V is little-endian by default; this code would compile and run correctly on riscv64 without modification. No `__riscv` preprocessor guard is needed here.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in google/fuzztest itself (all searches returned 0 results). The following issues in upstream dependencies affect riscv64 use of fuzztest:

| ID | Project | Title | Status | Severity | Notes |
|----|---------|-------|--------|----------|-------|
| abseil #1702 | abseil-cpp | Cross-compile link failure: missing `-latomic` for byte atomics | Open | High (build blocker for cross-compile workflows) | Affects abseil on riscv64 with some toolchains |
| abseil #2002 | abseil-cpp | `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` segfault on riscv64 Debian GCC 15.2 | Open | Medium (test failure; production impact unquantified) | Two hash/sampling subsystem tests segfault |
| abseil PR #1986 | abseil-cpp | Add CRC32C hardware acceleration via Zbc/Zbkc | Open (not merged) | Low (performance only) | Software CRC32C fallback is functional |
| googletest #3756 | googletest | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open since 2022 | Low (test infrastructure bug, not API) | Thread count reporting broken on riscv64 hardware |
| protobuf #17798 | protobuf | No `protoc-linux-riscv64` prebuilt binary | Closed without resolution | Medium (CI toolchain gap) | Must build protoc from source on riscv64 |
| fuzztest (self) | fuzztest | `#error "unsupported architecture"` in `centipede/sancov_callbacks.cc` | No issue filed | Critical (compile-time blocker for fuzzing mode) | Hard failure; not a runtime degradation |

**Correctness bugs:** No floating-point or NaN correctness issues are filed in fuzztest or any of its dependencies for riscv64. Data not available: no riscv64 hardware testing of fuzztest has been performed by any party.

---

## 12. Objections and Upstream Blockers

### Technical blockers

1. **Hard compile failure in `centipede/sancov_callbacks.cc`:** The `ReturnAddressToCallerPc` function requires a hardcoded call instruction byte offset that differs per ISA. For RISC-V, the correct offset is 4 bytes for standard 32-bit instructions or 2 bytes for compressed (RVC) 16-bit instructions. Because RISC-V optionally uses the C extension (variable instruction length), a single hardcoded constant is incorrect; the implementation must either read the instruction encoding or assume a fixed offset and document the constraint. This is a small but non-trivial fix requiring RISC-V ISA knowledge.

2. **Clang riscv64 SanitizerCoverage:** Fuzzing mode requires Clang with `inline-8bit-counters` and `trace-cmp` SanitizerCoverage support for riscv64. Data not available: the minimum Clang version at which these are fully functional for riscv64 was not confirmed from the research findings. This is expected to be available from Clang 13+ but has not been tested within the fuzztest CI context.

3. **Abseil-cpp open issues on riscv64** (items #1702, #2002): These are in a critical dependency, not fuzztest itself, but must be resolved or worked around before a riscv64 fuzztest build is reliable.

### Organizational blockers

4. **No RISC-V port interest expressed upstream:** Zero issues, zero PRs, zero community discussion. Google engineers have not signaled any plans. External contributions require CLA signing and Copybara merge back through Google's internal Piper monorepo. Google's internal toolchain team would need to initiate or accept this work.

5. **Internal-first development model:** The project mirrors from Piper. Changes that are not useful to Google's internal fuzzing infrastructure are unlikely to be prioritized by the maintainers. A RISC-V port is not a Google datacenter priority.

### Acceptance probability

A minimal patch fixing `sancov_callbacks.cc` for riscv64 has moderate acceptance probability [NEEDS VERIFICATION] given the project's existing aarch64 support and the small size of the change. A full CI addition (riscv64 GitHub Actions runner) is lower probability because Google controls the CI configuration and no riscv64 GitHub-hosted runner exists in standard GitHub Actions.

---

## 13. Investment Analysis

RISE has no existing involvement with fuzztest. Google (RISE Premier Member) owns the project entirely. No work has been done or funded by RISE on this project.

### 13.1 Functional Enablement

The minimum viable work to enable fuzztest fuzzing mode on riscv64:

1. Fix `ReturnAddressToCallerPc` in `centipede/sancov_callbacks.cc` to handle riscv64. The fix requires determining the caller PC from a return address given RISC-V instruction encoding. Two approaches:
   - Hardcode the standard (non-compressed) 4-byte offset with a comment noting RVC instructions would give 2 bytes; this matches what Centipede currently does for aarch64 (hardcodes 4).
   - Read the preceding instruction bytes and determine length dynamically (more correct but higher complexity).
   Estimated effort: 1-2 person-weeks including testing on riscv64 hardware.

2. Verify that Clang SanitizerCoverage (`-fsanitize=address -fsanitize-coverage=inline-8bit-counters,trace-cmp`) works correctly on riscv64 for the Centipede use case. If gaps exist, they must be fixed in LLVM (a separate upstream dependency). Estimated effort for investigation: 1 person-week.

3. Upstream the `sancov_callbacks.cc` fix via a Google-reviewed PR. Given the project's internal-first model, this requires Google maintainer engagement. Estimated effort for upstreaming coordination: 1 person-week.

### 13.2 Performance Optimization

No performance optimization work is needed for fuzztest itself - it has no SIMD code to port. The one relevant optimization is in abseil-cpp (PR #1986: CRC32C via Zbc/Zbkc). That is tracked under abseil-cpp investment, not fuzztest.

Estimated effort: 0 person-weeks for fuzztest-specific performance work.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to fuzztest requires a riscv64 GitHub Actions runner. Standard GitHub-hosted runners do not include riscv64. Options:

1. Self-hosted riscv64 runner via RISE infrastructure - requires coordination with RISE CI team and Google maintainer acceptance of a self-hosted runner in their repo (non-trivial; Google has security policies on external runners in the `google` org).
2. QEMU-based emulated riscv64 job on ubuntu-22.04 - more acceptable to Google but slow.
3. Cross-compilation smoke test in existing ubuntu-22.04 jobs.

Estimated effort: 2-3 person-weeks for a QEMU-based CI job, assuming Google maintainer acceptance.

### 13.4 Ecosystem Enablement

FuzzTest has no distro packages. Packaging in Debian or Ubuntu would make riscv64 builds available via standard package managers, but this requires a Debian maintainer willing to adopt the package and is a separate workstream from the upstream port. Estimated effort: 3-5 person-weeks (Debian packaging, riscv64 build verification, archive upload). This is lower priority than the functional enablement work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `ReturnAddressToCallerPc` in `centipede/sancov_callbacks.cc` for riscv64 | 2 | RISC-V compiler/toolchain engineer | Critical |
| Functional | Verify Clang SanitizerCoverage (`-fsanitize-coverage`) correctness on riscv64 | 1 | RISC-V LLVM engineer | Critical |
| Functional | Resolve abseil-cpp #1702 (`-latomic` missing) | 1 | abseil-cpp contributor | High |
| Functional | Resolve abseil-cpp #2002 (hashtablez/cordz segfaults on riscv64) | 2 | abseil-cpp contributor | High |
| CI/CD | Add QEMU-based riscv64 CI job to fuzztest GitHub Actions | 2 | CI/infra engineer with Google maintainer buy-in | High |
| CI/CD | Coordinate with Google maintainers on runner acceptance | 1 | Community/RISE liaison | High |
| Performance | Merge abseil PR #1986 (CRC32C via Zbc/Zbkc) - tracked in abseil-cpp report | 0 (tracked elsewhere) | - | Medium |
| Distribution | Debian packaging of fuzztest | 4 | Debian maintainer | Low |

**Total for functional enablement and CI:** approximately 9 person-weeks, excluding the abseil-cpp work tracked in its own report.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/fuzztest repository](https://github.com/google/fuzztest)
- [fuzztest GitHub Actions: bazel_test.yml](https://github.com/google/fuzztest/blob/main/.github/workflows/bazel_test.yml)
- [fuzztest GitHub Actions: bazel_test_centipede.yml](https://github.com/google/fuzztest/blob/main/.github/workflows/bazel_test_centipede.yml)
- [fuzztest GitHub Actions: cmake_test.yml](https://github.com/google/fuzztest/blob/main/.github/workflows/cmake_test.yml)
- [fuzztest GitHub Actions: cargo_test.yml](https://github.com/google/fuzztest/blob/main/.github/workflows/cargo_test.yml)
- [fuzztest cmake/BuildDependencies.cmake](https://github.com/google/fuzztest/blob/main/cmake/BuildDependencies.cmake)
- [fuzztest centipede/sancov_callbacks.cc](https://github.com/google/fuzztest/blob/main/centipede/sancov_callbacks.cc)
- [fuzztest centipede/foreach_nonzero.h](https://github.com/google/fuzztest/blob/main/centipede/foreach_nonzero.h)
- [fuzztest doc/quickstart-cmake.md](https://github.com/google/fuzztest/blob/main/doc/quickstart-cmake.md)
- [abseil-cpp issue #1702: riscv64 cross-compile missing -latomic](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #2002: hashtablez and cordz sampler segfaults on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp PR #1986: CRC32C hardware acceleration via Zbc/Zbkc](https://github.com/abseil/abseil-cpp/pull/1986)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [protobuf issue #17798: no protoc-linux-riscv64 prebuilt binary](https://github.com/protocolbuffers/protobuf/issues/17798)
- [RISE project member list](https://riseproject.dev/members/)
- [Arch Linux RISC-V package repository](https://archriscv.felixc.at/)
- [fuzztest GitHub Releases](https://github.com/google/fuzztest/releases)