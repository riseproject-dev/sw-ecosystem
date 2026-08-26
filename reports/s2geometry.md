---
title: s2geometry
---

# s2geometry

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for s2geometry<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

s2geometry is a C++ library for spherical geometry using the S2 cell decomposition. It provides spatial indexing, polygon operations, region covering, and geodesic math used in production mapping, routing, and geospatial query systems. The library is pure portable C++17 with no JIT, no SIMD, and no assembly outside two x86-64-specific arithmetic optimizations.

**Governance:** Google developed the library internally and open-sourced it in November 2015 under the [Apache 2.0 license](https://github.com/google/s2geometry/blob/master/LICENSE). There is no formal foundation, no steering committee, and no TSC. Contributions require a Google CLA. There is no MAINTAINERS, OWNERS, or CODEOWNERS file.

**Corporate maintainers:** Jesse Rosenstock (jmr@google.com, Google) holds approximately 519 of ~650 total commits (~80%). David Eustis (Aurora Innovation) is the second most active contributor with 14 commits, focused on Python pybind bindings. External CLA contributors include Dan Larkin-York (ArangoDB), Robert Coup (Koordinates Limited), Mike Playle (independent), and Zachary Burnett (STScI, Python packaging).

**Platform support policy:** The README states the project aims to support all platforms covered by the [Google foundational C++ support policy](https://opensource.google/documentation/policies/cplusplus-support). RISC-V is not on that policy's official tier list. No community stance on new architecture ports has been documented; no RISC-V issue or PR has ever been filed upstream.

**RISE membership:** Google LLC is a Premier member of RISE. s2geometry is not independently a RISE member. No RISE blog posts, funded work, or working group activity specific to s2geometry was found.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| November 2015 | Project open-sourced by Google | [GitHub](https://github.com/google/s2geometry) |
| (undated) | Debian adds s2geometry with `Architecture: any`; riscv64 builds automatically from generic C++ | [Debian tracker](https://tracker.debian.org/pkg/s2geometry) |
| (undated) | Debian riscv64 binary 0.10.0-6.1+b1 successfully built in sid | [Debian tracker](https://tracker.debian.org/pkg/s2geometry) |
| (current) | Debian riscv64 blocked from testing due to missing libabsl dependency (908 days outstanding) | [Debian tracker](https://tracker.debian.org/pkg/s2geometry) |
| 2026-08-14 | Zero riscv or riscv64 references in upstream issues, PRs, commits, or code | GitHub API search |

There is no upstream RISC-V port history. The Debian riscv64 binary was produced automatically because s2geometry has no architecture-specific build requirements; no contributor initiated it as a deliberate port effort.

**Key contributor for any potential riscv64 CI addition:** Jesse Rosenstock (Google) is the only practical decision-maker for CI changes.

**Fully upstream:** The library needs no patches for riscv64. It builds via the generic C++ path with no modification.

## 3. Upstream Support Tier

No formal tier policy exists. The project has never published a tier matrix.

**Evidence from CI and releases:**

- CI covers ubuntu-22.04 (x86-64), ubuntu-latest (x86-64), ubuntu-22.04-arm (arm64), ubuntu-24.04-arm (arm64), macOS 14/15/26 (arm64), macOS 15-intel/26-intel (x86-64), and one big-endian AArch64 cross-compile job via QEMU. riscv64 is absent.
- GitHub Releases (v0.11.1 through v0.14.0) have zero binary assets. No architecture-specific binaries are published for any platform. Distribution is source-only.
- riscv64 has never appeared in any CI matrix or release artifact.

**Tier comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner | Yes (ubuntu, macOS) | Yes (ubuntu-arm, macOS-M) | No |
| Release binary | No (source-only) | No (source-only) | No (source-only) |
| PyPI wheel | Yes (manylinux, musllinux) | No | No |
| Official Debian package | Blocked (testing migration) | Blocked (testing migration) | Blocked (testing migration, also not installable) |
| Explicitly listed in support policy | No formal policy | No formal policy | No formal policy |

## 4. Technical Architecture and RISC-V-Specific Subsystems

s2geometry is pure portable C++17. There is no JIT, no SIMD framework, no crypto engine, no GC, and no assembly infrastructure. The full source tree of 546 files contains no `.S` or `.asm` files, no `arch/riscv/` directory, and no `#ifdef __riscv` guards anywhere.

Two files contain x86-64-specific optimizations with complete portable fallbacks:

**`src/s2/util/coding/varint.cc` - varint parsing:**
- x86-64 path: inline assembly using `shldq` instruction for ~30% speedup on 64-bit varint parsing.
- All other platforms (arm64, riscv64, etc.): scalar C fallback `Parse64Fallback`. A comment in the file notes that arm64 lacks a SHLD equivalent and using the non-asm path on arm64 is a ~10% regression versus x86-64.

**`src/s2/util/math/exactfloat/bignum.cc` - extended precision arithmetic:**
- `AddBigit()`: x86-64 uses `_addcarry_u64` intrinsic (~30% speedup for carry-chain addition); all others use `absl::uint128` arithmetic.
- `SubBigit()`: x86-64 uses `_subborrow_u64` intrinsic; all others use plain C arithmetic.
- `MulAddBigit()`: no x86-64 intrinsic (GCC/Clang do not support `_addcarryx_u64` reliably); all platforms including x86-64 use `absl::uint128`.

The `#else` branches in both files are complete, tested, production-quality C implementations. No stubs, no TODO comments, no missing paths.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| varint ParseFast | Inline asm (shldq) | Scalar C (same as riscv64) | Scalar C |
| bignum AddBigit | `_addcarry_u64` intrinsic | absl::uint128 (same as riscv64) | absl::uint128 |
| bignum SubBigit | `_subborrow_u64` intrinsic | absl::uint128 (same as riscv64) | absl::uint128 |
| bignum MulAddBigit | absl::uint128 | absl::uint128 | absl::uint128 |
| All other code | Portable C++ | Portable C++ | Portable C++ |
| RVV / NEON / SSE | SSE paths: None | NEON paths: None | RVV paths: None |
| Assembly files | None | None | None |

CMakeLists.txt contains one AArch64-specific compiler flag: suppression of noisy ABI notes about parameter passing changes, applied to `s2edge_crosser.cc` and `s2edge_tessellator.cc` for the big-endian AArch64 cross-compile job only. This is a warning suppression, not an ISA-specific code path, and is irrelevant to riscv64.

**Endianness:** RISC-V is always little-endian. `src/s2/util/endian/endian.h` uses `absl::endian::native` at compile time with no byteswap overhead on riscv64. The known encoding failures on big-endian PPC (issue #316) do not affect riscv64.

**Unaligned access:** `src/s2/util/gtl/unaligned.h` uses `memcpy`-based `UnalignedLoad`/`UnalignedStore` - portable and safe on riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake only (plus Bazel for subset coverage). No Autoconf, no Meson.

**Required versions:**
- CMake: >= 3.22 [NEEDS VERIFICATION: CMakeLists.txt states 3.18 minimum; README states 3.22]
- GCC: >= 7.5 (README stated minimum); practical floor is >= 10 because abseil-cpp 20260526.0 requires GCC >= 10 or Clang >= 14 for full C++17/C++20 support
- Clang: >= 14.0.0
- Abseil-cpp: exactly `20260526.0` LTS - CMakeLists.txt enforces this exact version; no other version is supported
- OpenSSL: any version with bignum library (test-only; skippable)
- C++ standard: C++17, hard-enforced via `CMAKE_CXX_STANDARD_REQUIRED ON`

**Native riscv64 build (on a riscv64 host):**

```sh
# Option A: use FETCH_ABSEIL to pull the exact required version
git clone https://github.com/google/s2geometry
cd s2geometry && mkdir build && cd build
cmake \
  -DFETCH_ABSEIL=ON \
  -DBUILD_TESTS=yes \
  -DCMAKE_CXX_STANDARD=17 \
  ..
make -j$(nproc)
make test ARGS="-j$(nproc)"
```

**Cross-compilation for riscv64 (from x86-64 or arm64 host):**

The upstream CI `cmake-big-endian` job demonstrates the cross-compilation pattern for big-endian AArch64 and is directly adaptable. No riscv64 toolchain file exists in the repository; construct one manually:

```cmake
# toolchain-riscv64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER   riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```sh
cmake \
  -DCMAKE_TOOLCHAIN_FILE=../toolchain-riscv64.cmake \
  -DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64;-L;/usr/riscv64-linux-gnu" \
  -DWITH_PYTHON=OFF \
  -DFETCH_ABSEIL=ON \
  -DSKIP_OPENSSL_TESTS=ON \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  ..
```

**Key CMake flags for riscv64:**

| Flag | Default | Purpose for riscv64 |
|------|---------|---------------------|
| `-DSKIP_OPENSSL_TESTS=ON` | OFF | Skip bignum_test (OpenSSL dependency). Used in AArch64-BE CI job. Not needed if OpenSSL is in sysroot. |
| `-DFETCH_ABSEIL=ON` | OFF | Auto-download abseil-cpp 20260526.0 exactly. Avoids version mismatch on distros shipping older Abseil. |
| `-DBUILD_TESTS=no` | ON | Skip all tests. Use if cross-compiling without QEMU. |
| `-DBUILD_SHARED_LIBS=OFF` | ON | Static library only. Safer for cross-compiled sysroots. |
| `-DWITH_PYTHON=OFF` | OFF (default) | Required OFF for cross-compilation. SWIG/Python unavailable cross. |

**libatomic note:** Abseil issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702) documents that cross-compiling for riscv64 with certain toolchains (bootlin) requires explicit `-latomic` linkage because `__atomic_compare_exchange_1` and `__atomic_exchange_1` are not automatically resolved. Add `-DCMAKE_EXE_LINKER_FLAGS="-latomic" -DCMAKE_SHARED_LINKER_FLAGS="-latomic"` when using a bootlin-derived cross toolchain.

**No Dockerfiles exist** in the repository for any architecture.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All s2geometry features - spatial indexing, polygon operations, region covering, cell decomposition, geodesic predicates, exactfloat arithmetic - are fully implemented on riscv64 via the portable C++ paths. There is no functionality that requires x86-64 or arm64.

**Performance gaps:**

| Operation | riscv64 vs amd64 | riscv64 vs arm64 | Notes |
|-----------|-----------------|-----------------|-------|
| 64-bit varint parsing | ~30% slower (estimated) | ~0% delta | Both use identical scalar C fallback; the comment in varint.cc attributes ~10% arm64 regression vs x86, but arm64 and riscv64 use the same path |
| bignum add/sub (exactfloat) | ~30% slower (estimated) | ~0% delta | Both use absl::uint128; no RVV carry-less multiply path exists |
| All other operations | ~0% delta | ~0% delta | Pure portable C++; no SIMD anywhere |

No published benchmark data for s2geometry on riscv64 or arm64 exists in any checked source. The ~30% estimate for bignum and ~30% estimate for varint parsing are sourced from comments in the source files, not from measured benchmarks on riscv64 hardware.

**Floating-point semantics:**

Issue [#413](https://github.com/google/s2geometry/issues/413) documents that `S1Angle::SinCos` is broken on Ubuntu 22 with glibc because `sincos()` returns a cosine value differing at the last ULP from separate `sin()`/`cos()` calls. A workaround disabling `sincos()` on glibc is in place, but the root cause is unresolved. riscv64 Linux uses glibc and is exposed to this class of issue.

Issue [#598](https://github.com/google/s2geometry/issues/598) documents that `S2PaddedCell.ShrinkToFit` fails on AArch64 (Apple Silicon runner) with the result cell ID level differing by 3 digits from expected. This demonstrates architecture-dependent floating-point divergence in geometric predicates that could manifest on riscv64 hardware as well [NEEDS VERIFICATION: no riscv64 run data exists to confirm or deny].

Issue [#463](https://github.com/google/s2geometry/issues/463) documents that `S2Cell(S2CellId(p)).Contains(p)` has counterexamples, requiring approximately 1.5 eps expansion. Platform-dependent.

Issue [#523](https://github.com/google/s2geometry/issues/523) documents flaky `S2LatLngRect::GetCentroid` test failures where a 2e-15 threshold is insufficient on some runs (~4/3e-15 needed). Platform-dependent.

**Security hardening:** Data not available: no RISC-V-specific hardening analysis (stack canaries, CFI, pointer authentication) was searched.

## 7. CI/CD Infrastructure

**riscv64 CI: None.**

Full content of both workflow files was verified via GitHub MCP. Neither `.github/workflows/build.yml` nor `.github/workflows/lint.yml` contains any reference to "riscv", "riscv64", or "RISCV". No other CI files (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `appveyor.yml`) exist in the repository.

**CI matrix in `build.yml`:**

| Job | Runners |
|-----|---------|
| cmake | ubuntu-22.04, ubuntu-latest, ubuntu-22.04-arm, ubuntu-24.04-arm, macos-14, macos-15, macos-26, macos-15-intel, macos-26-intel |
| cmake-big-endian | ubuntu-24.04-arm + qemu-user (aarch64_be cross-compile only) |
| bazel | ubuntu-latest, macos-latest |
| python (cibuildwheel) | ubuntu-latest, ubuntu-24.04-arm, macos-15, macos-15-intel |

**CI comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Native runner | Yes | Yes | No |
| QEMU emulation | No | Yes (for big-endian AArch64 only) | No |
| Cross-compile job | No | Yes (big-endian AArch64 target) | No |
| Wheel build (cibuildwheel) | Yes | Yes (arm64 host, arm64 wheel) | No |
| RISE CI runners | No | No | No |
| Hardware used | GitHub-hosted | GitHub-hosted | None |

No RISE-provided riscv64 CI runners are in use. No community has filed a request to add riscv64 CI.

## 8. Distribution and Release Status

**GitHub Releases:** v0.11.1 (2024-02-03) through v0.14.0 (2026-04-23). All 12 releases have zero binary assets. No architecture-specific binaries are published. Source-only distribution for all platforms.

**PyPI:** Latest version 0.14.0. Wheels published:
- `s2geometry-0.14.0-cp310-abi3-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`
- `s2geometry-0.14.0-cp310-abi3-musllinux_1_2_x86_64.whl`
- `s2geometry-0.14.0-cp310-abi3-macosx_10_13_x86_64.whl`
- `s2geometry-0.14.0-cp310-abi3-macosx_11_0_arm64.whl`

No riscv64 wheel. No arm64 Linux wheel. The `cibuildwheel` config has no `archs` override to add riscv64.

**Debian:** Package `libs2-0t64`, `libs2-dev`, `python3-pywraps2` based on upstream 0.10.0-6.1. A binary NMU produced 0.10.0-6.1+b1 for riscv64 in sid (automatically built via `Architecture: any` - no deliberate porting effort). All three packages are blocked from migrating to Debian testing on riscv64 due to an unsatisfied `libabsl20220623t64 >= 0~20220623.0-1` dependency. The autopkgtest is skipped on riscv64 as "not installable." The blocker has been outstanding for 908 days. A fix updating the abseil dependency to `>= 20260526` is committed in the Debian VCS (version 0.14.0+git079611b-1) but not yet uploaded to the archive.

**Ubuntu 24.04 Noble:** s2geometry is not packaged. No results from packages.ubuntu.com for any architecture.

**Arch Linux RISC-V:** No listing at [archriscv.felixc.at](https://archriscv.felixc.at). Package not available.

**Fedora riscv64:** Data not available: src.fedoraproject.org returned an Anubis bot challenge during research; build status unknown.

**RISE wheel builder:** s2geometry is not listed in the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) package index.

**To obtain a working binary on riscv64:** Build from source using CMake with `-DFETCH_ABSEIL=ON`. No pre-built option exists from any verified distribution channel.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Risk |
|------------|------|--------------|-------------|----------------|---------------|
| abseil-cpp 20260526.0 | Runtime, mandatory - containers, hashing, logging, int128, synchronization | Builds (no dedicated CI; Debian/Ubuntu ship it; `stacktrace_riscv-inl.inc` upstream since 2021) | Two open failures: #2002 (hashtablez sampler + cordz SEGFAULT on riscv64, 20260107.0); #2142 (SwisstableCollisions.LowEntropyStrings fails on Group::kWidth==8 platforms including riscv64, 20260817.0) | Source-only; no riscv64 binary | Moderate: s2geometry uses `absl::flat_hash_map` and `absl::flat_hash_set` heavily; #2142 affects hashtable correctness |
| OpenSSL / libssl+libcrypto | Test-only (bignum_test.cc reference oracle only); skippable via -DSKIP_OPENSSL_TESTS=ON; not linked into the s2 library | Builds (dedicated riscv64 CI workflow exists upstream) | #30880: test_lhash intermittent failure on linux-riscv64 (open); #20980: AES not constant-time without Zkn (open); #30330: null-key check reversal in rv64i_zkne (open) | Source-only | Low: test-only dependency, skippable at configure time |
| google/benchmark | Test-only (FetchContent, BUILD_TESTS=ON only) | No riscv64 issues found; uses generic POSIX timing | No open riscv64 failures found | Source-only (FetchContent) | None |
| googletest | Test-only (FetchContent, BUILD_TESTS=ON only) | Builds on riscv64 | #3756: GetThreadCountTest.ReturnsCorrectValue fails on riscv64 (open since 2022; GetThreadCount returns 0 instead of expected value via /proc/self/task) | Source-only (FetchContent) | Low: the failing test is in googletest's own internal test suite, not in functionality used by s2geometry tests |
| SWIG 4.0+ / Python3 >= 3.10 | Optional Python bindings (-DWITH_PYTHON=ON); not needed for C++ builds | No riscv64-specific SWIG issues found; Python3 available on riscv64 | Not tested (no riscv64 CI) | No riscv64 wheel on PyPI | Medium: users requiring Python bindings on riscv64 must build from source |

**Abseil-cpp deep-dive (critical dependency):**

Abseil is the only runtime mandatory dependency. Issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702) requires explicit `-latomic` linkage when cross-compiling for riscv64 with bootlin toolchains due to unresolved `__atomic_compare_exchange_1` and `__atomic_exchange_1` symbols. Issue [#2142](https://github.com/abseil/abseil-cpp/issues/2142) documents `SwisstableCollisions.LowEntropyStrings` test failure on platforms where `Group::kWidth == 8` (which includes riscv64) as of abseil 20260817.0. This is a hashtable correctness test failure; whether it indicates a runtime data-structure bug or solely a test oracle issue is not determined from available research. s2geometry uses `absl::flat_hash_map` and `absl::flat_hash_set` as primary data structures throughout its index implementations.

## 11. Known Bugs and Active Issues

**Correctness bugs (architecture-relevant):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#463](https://github.com/google/s2geometry/issues/463) | S2Cell(S2CellId(p)).Contains(p) requires expansion of (1.125 + eps) * eps | Open | High | Fundamental invariant violated; counterexamples exist causing flaky test failures; error bound analysis incomplete |
| [#598](https://github.com/google/s2geometry/issues/598) | AArch64 test failure: S2PaddedCell.ShrinkToFit | Open | Medium | S2PaddedCell precision diverges on AArch64 (Apple Silicon); result cell ID level differs by 3 digits; demonstrates architecture-dependent FP behavior in geometric predicates |
| [#413](https://github.com/google/s2geometry/issues/413) | S1Angle::SinCos broken on ubuntu 22 | Open | Medium | glibc sincos() returns cosine differing at last ULP from separate sin()/cos() calls; workaround in place but root cause unresolved; riscv64 Linux uses glibc |
| [#523](https://github.com/google/s2geometry/issues/523) | S2LatLngRect::GetCentroid test failures | Open | Low | Threshold 2e-15 too tight; some runs need ~4/3e-15; flaky, platform-dependent |
| [#612](https://github.com/google/s2geometry/issues/612) | macOS test failure: SignTest.StressTest | Open | Low | points.size() = 5 vs expected >= 7; platform-dependent sign predicate behavior |
| [#316](https://github.com/google/s2geometry/issues/316) | Test errors on PowerPC (85% passed, 16 failed) | Open | Informational for riscv64 | Big-endian PPC failures; little-endian riscv64 would not reproduce the encoding failures, but the S2Cap/S2Polygon/S2Edge correctness failures may indicate FP precision sensitivity |

**Performance bugs:**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#190](https://github.com/google/s2geometry/issues/190) | Consider Eriksson's formula instead of L'Huilier's for spherical triangle area | Open since 2022 | L'Huilier uses 8 transcendentals, 4 square roots; Eriksson uses 1 transcendental, 0 square roots; unimplemented |
| [#438](https://github.com/google/s2geometry/issues/438) | S2Polygon InitToCellUnionBorder performance regression | Open | Significantly slower for large complex polygons in v0.12.0+ |

**Build bugs:**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#337](https://github.com/google/s2geometry/issues/337) | Failed tests with -flto=auto | Open | 5 tests abort or fail with GCC 13.2.1 -O2 -flto=auto; likely undefined behavior exposed by LTO; relevant to distros (Fedora, openSUSE) that enable LTO by default |

## 12. Objections and Upstream Blockers

**Stated objections:** None. No maintainer has objected to RISC-V support. No issue or PR requesting riscv64 CI has ever been filed, so no response exists.

**Technical blockers:** None. The library builds without modification on riscv64 via the portable C++ path. The Abseil hashtable test failures (#2002, #2142) represent an upstream Abseil issue, not an s2geometry issue.

**Organizational blockers:**

- Google's foundational C++ support policy does not list RISC-V. CI additions require maintainer (Jesse Rosenstock) approval. No indication of resistance exists, but no indication of interest exists either.
- The Debian packaging update (to 0.14.0, resolving the libabsl blocker) is staged in Debian VCS but not yet uploaded. This is a Debian packaging issue, not an upstream s2geometry issue.
- The `cibuildwheel` configuration would need an explicit `archs` override to produce a riscv64 Linux wheel; this is a two-line change but requires upstream maintainer merge.

**Acceptance probability:** High for a well-formed CI PR. The library is already known to build on riscv64 (Debian binary exists). The big-endian AArch64 cross-compile CI job demonstrates that the project accepts cross-compilation CI. A PR adding a QEMU riscv64 cross-compile job following the same pattern as `cmake-big-endian` is technically low-risk and precedented. The main uncertainty is maintainer bandwidth and prioritization.

## 13. Investment Analysis

RISE has done no funded work on s2geometry. The Debian riscv64 binary (0.10.0-6.1+b1) was produced automatically with no deliberate effort; the current blocker is a Debian packaging issue unrelated to s2geometry itself.

### 13.1 Functional Enablement

No functional enablement work is required. s2geometry builds and runs on riscv64 via portable C++ with no patches needed.

### 13.2 Performance Optimization

Two hot paths have x86-64-specific implementations with no riscv64 equivalent:
- `varint.cc`: SHLD-based varint parsing. An RVV implementation (RISC-V Vector extension) is possible but requires profiling to confirm varint parsing is a bottleneck in target workloads. The arm64 team has not implemented NEON for this path, suggesting the x86-64 gains are workload-specific.
- `bignum.cc`: Carry-chain add/sub using `_addcarry_u64`/`_subborrow_u64`. No equivalent intrinsics exist in standard RISC-V scalar ISA; a compiler-intrinsic approach would require Zbc or custom inline asm. Only relevant if exactfloat precision is on the critical path (it is used in sign predicate verification, not normal geometry operations).

Neither optimization is required for correctness. Both are medium-effort, low-priority unless benchmarking on target hardware demonstrates a regression.

### 13.3 CI/CD Infrastructure

The primary gap. A riscv64 CI job would:
- Validate that every commit builds and passes tests on riscv64.
- Catch any future arch-sensitive regressions (like #598 on AArch64).
- Produce a riscv64 Linux wheel via cibuildwheel.

The `cmake-big-endian` CI job is a direct template. Work involves: writing a QEMU riscv64 cross-compile job in `build.yml`, adding riscv64 to the `cibuildwheel` platform matrix, and adding `-DSKIP_OPENSSL_TESTS=ON` and explicit `-latomic` where needed.

### 13.4 Ecosystem Enablement

The primary user-facing gap is the absent riscv64 Python wheel on PyPI. Adding riscv64 to the `cibuildwheel` matrix resolves this. Requires upstream maintainer approval.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add QEMU riscv64 cross-compile job to `build.yml` | 0.5 | s2geometry maintainer (Google) + RISE contributor | High |
| CI/CD | Add riscv64 to `cibuildwheel` matrix for PyPI wheel | 0.5 | s2geometry maintainer (Google) + RISE contributor | High |
| Build | Document riscv64 toolchain file and `-latomic` requirement in README | 0.25 | RISE contributor | Medium |
| Performance | Profile varint.cc hot path on riscv64 hardware; implement RVV if warranted | 3-6 | RISE contributor | Low |
| Performance | Profile bignum.cc carry-chain on riscv64 hardware; implement inline asm if warranted | 2-4 | RISE contributor | Low |
| Packaging | Unblock Debian testing migration (libabsl dependency update) | Blocked on Debian maintainer upload | Debian maintainer | High (upstream Debian, not s2geometry) |
| Testing | Run full test suite on bare-metal riscv64 hardware; document any new FP precision failures | 1 | RISE contributor | Medium |

Total estimated effort for CI/CD and documentation: approximately 1.25 person-weeks. Performance optimization is discretionary and should be data-driven from profiling on target hardware before committing resources.

## 14. Updates

No updates yet - initial report dated 2026-06-17.

## 15. References

- [s2geometry GitHub repository](https://github.com/google/s2geometry)
- [s2geometry homepage](https://s2geometry.io/)
- [s2geometry GitHub Releases](https://github.com/google/s2geometry/releases)
- [s2geometry build workflow (.github/workflows/build.yml)](https://github.com/google/s2geometry/blob/master/.github/workflows/build.yml)
- [s2geometry lint workflow (.github/workflows/lint.yml)](https://github.com/google/s2geometry/blob/master/.github/workflows/lint.yml)
- [s2geometry PyPI package](https://pypi.org/project/s2geometry/)
- [Debian tracker: s2geometry](https://tracker.debian.org/pkg/s2geometry)
- [Abseil-cpp issue #1702: undefined reference to __atomic symbols on riscv64 cross-compile](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #2002: hashtablez sampler + cordz SEGFAULT on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [Abseil-cpp issue #2142: SwisstableCollisions.LowEntropyStrings fails on Group::kWidth==8 platforms](https://github.com/abseil/abseil-cpp/issues/2142)
- [s2geometry issue #190: Eriksson formula for spherical triangle area](https://github.com/google/s2geometry/issues/190)
- [s2geometry issue #316: Test errors on PowerPC](https://github.com/google/s2geometry/issues/316)
- [s2geometry issue #337: Failed tests with -flto=auto](https://github.com/google/s2geometry/issues/337)
- [s2geometry issue #413: S1Angle::SinCos broken on ubuntu 22](https://github.com/google/s2geometry/issues/413)
- [s2geometry issue #438: S2Polygon InitToCellUnionBorder performance](https://github.com/google/s2geometry/issues/438)
- [s2geometry issue #463: S2Cell(S2CellId(p)).Contains(p) correctness](https://github.com/google/s2geometry/issues/463)
- [s2geometry issue #523: S2LatLngRect::GetCentroid test failures](https://github.com/google/s2geometry/issues/523)
- [s2geometry issue #598: AArch64 test failure S2PaddedCell.ShrinkToFit](https://github.com/google/s2geometry/issues/598)
- [s2geometry issue #612: macOS test failure SignTest.StressTest](https://github.com/google/s2geometry/issues/612)
- [OpenSSL issue #30880: test_lhash intermittent failure on linux-riscv64](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL issue #20980: AES not constant-time without Zkn](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL issue #30330: reversed null-key check in rv64i_zkne](https://github.com/openssl/openssl/issues/30330)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Google foundational C++ support policy](https://opensource.google/documentation/policies/cplusplus-support)
- [RISE Project Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/)