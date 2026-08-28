---
title: double-conversion
---

# double-conversion

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for double-conversion<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

double-conversion is a C++ library implementing high-performance, correctly-rounded conversion between IEEE 754 floating-point numbers and their decimal string representations. The algorithms are derived from the Grisu and Bignum dtoa families, originally written for V8. The library was extracted from V8 and published as a standalone project under the `google` GitHub organization in 2014.

**License:** BSD-3-Clause.

**Governance:** Informal. No foundation membership, no CODEOWNERS file, no RISE membership, no formal tier policy. The effective maintainer is Florian Loitsch (GitHub: `floitschG`/`floitsch`), currently affiliated with Toitware ApS (a Danish IoT startup). He has 148 combined commits and sole merge authority. Day-to-day maintenance is no longer Google-internal despite the repository sitting in the `google` org.

A secondary active contributor as of 2026 is `Ramya-9353`, who has merged 10+ PRs covering correctness fixes; no public company affiliation is visible.

**Corporate sponsors:** Google (implicit org ownership). No sponsorship declarations exist.

**Community culture on new ports:** Ports are accepted pragmatically. The pattern established since [issue #4 (2014)](https://github.com/google/double-conversion/issues/4) is: contributor submits a 2-line change to `utils.h`, supplies QEMU emulation test evidence, maintainer merges. The test methodology is documented in [issue #73 (2018)](https://github.com/google/double-conversion/issues/73): compile a two-file division test, link separately, run under QEMU. QEMU evidence is explicitly accepted as sufficient. CLA is formally required but the maintainer has stated he will merge small arch-detection changes without it if the author is unresponsive. The LoongArch PR (#208, 2023) was not merged only because the author did not respond, not due to technical objection.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2016-11-17 | [PR #38](https://github.com/google/double-conversion/pull/38) opened by `sorear` - adds `defined(__riscv)` to `DOUBLE_CONVERSION_CORRECT_DOUBLE_OPERATIONS` macro in `utils.h` | GitHub PR #38 |
| 2016-11-18 | PR #38 merged by Florian Loitsch (< 24 hours from open to merge) | GitHub PR #38 merge record |
| 2017-08-05 | v3.0.0 released - first release containing PR #38 | GitHub release history |
| 2022-01-10 | [PR #172](https://github.com/google/double-conversion/pull/172) merges MIPS/PA-RISC NaN fix; RISC-V is confirmed unaffected (uses standard IEEE NaN) | GitHub PR #172 |
| 2025-12-08 | v3.4.0 released (current latest) - RISC-V support unchanged and present | GitHub releases |

**Key contributor:** Stefan O'Rear (`sorear`), no public company affiliation listed. The SpiderMonkey reference in PR #38 suggests Mozilla context. The port was tested under QEMU emulation in isolation and as part of SpiderMonkey.

**Upstreaming status:** Fully upstream since 2016. The change is two lines in `utils.h`. No outstanding patches, no downstream-only workarounds.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project has no documented architecture tiers, no release-blocking test matrix per architecture, and no official prebuilt binary distribution. All architectures are treated equivalently: they appear in the same preprocessor list in `utils.h` with no differentiation.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| `CORRECT_DOUBLE_OPERATIONS` macro | Yes (listed via `__x86_64__`, `__i386__`) | Yes (listed via `__AARCH64EL__`, `__aarch64__`, `__AARCH64EB__`) | Yes (listed via `__riscv` since PR #38, 2016) |
| CI runner in upstream GitHub Actions | Yes (`ubuntu-latest`, `macos-latest`, `windows-latest`) | Yes (implicit on `macos-latest` arm64 runners) | No |
| Release-blocking tests | No (no formal policy) | No | No |
| Official prebuilt binaries | No (source-only releases) | No | No |
| Debian sid package | Yes | Yes | Yes (ports archive, 3.4.0-1+b1) |

The riscv64 position is identical to every other non-x86/non-arm64 architecture: supported at source level, packaged by distributions, not tested upstream.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

double-conversion is a pure-algorithmic C++ library. It has no JIT compiler, no SIMD paths, no hand-tuned assembly, no cryptographic code, and no garbage collector barriers. The entire implementation (bignum.cc, bignum-dtoa.cc, cached-powers.cc, double-to-string.cc, fast-dtoa.cc, fixed-dtoa.cc, string-to-double.cc, strtod.cc, diy-fp.h, ieee.h) is portable scalar C++ with zero architecture-name references in any algorithm file.

The only architecture-sensitive layer is two preprocessor macros in `double-conversion/utils.h`:

1. `DOUBLE_CONVERSION_CORRECT_DOUBLE_OPERATIONS` - selects between two portable C++ code paths based on whether the target FPU uses strict 64-bit IEEE 754 double precision (no x87 80-bit extended precision). RISC-V is listed (`__riscv`) and gets value 1, enabling the fast code path.

2. NaN bit encoding in `ieee.h` - uses `BitCast<uint64_t>(double)` via `memmove`. The quiet NaN bit is `kQuietNanBit = 0x0008000000000000`. RISC-V uses standard IEEE 754 NaN bit ordering and is in the default branch, not in the MIPS/PA-RISC special-case `#if`.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Architecture detection (`utils.h`) | Full | Full | Full (PR #38, 2016) |
| Floating-point conversion algorithms | Scalar C++ | Scalar C++ | Scalar C++ |
| SIMD / vector intrinsics | None | None | None |
| Hand-tuned assembly | None | None | None |
| NaN encoding special case | No | No | No (standard IEEE path) |
| JIT backend | None | None | None |
| ISA extensions used | None | None | None |

The absence of riscv64-specific files is not a gap. No architecture has separate source files. The "scalar C++ only" classification is identical for amd64 and arm64.

---

## 5. Build System, Cross-Compilation, and Toolchain

The project supports CMake (primary) and SCons (alternative). No architecture-specific build flags are needed for riscv64.

**Native riscv64 build (CMake):**

```sh
mkdir build && cd build
cmake \
  -DBUILD_TESTING=ON \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/usr/local \
  -DBUILD_SHARED_LIBS=OFF \
  ..
cmake --build . --config Release
cmake --install . --config Release
```

Requires CMake >= 3.29.

**Cross-compilation for riscv64 (CMake):** No bundled riscv64 toolchain file exists in the repository. Supply a standard toolchain file externally:

```cmake
# toolchain-riscv64.cmake (user-supplied)
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```sh
cmake \
  -DCMAKE_TOOLCHAIN_FILE=../toolchain-riscv64.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_TESTING=OFF \
  ..
```

`BUILD_TESTING=OFF` is required for cross-compilation because the test binary cannot run on the host.

**SCons cross-compilation:**

```sh
scons CXX=riscv64-linux-gnu-g++ optimize=1
```

**Toolchain version minimums:** The repository does not document minimum GCC or Clang versions. The code uses C++11 features with a pre-C++11 compatibility shim. In practice, GCC 7+ (first release with riscv64 backend) or Clang 9+ (first release with full riscv64 codegen) is required. [NEEDS VERIFICATION - these are implicit toolchain constraints not documented in the repository.]

**QEMU:** No QEMU configuration exists in the repository. No Dockerfiles are present. The original PR #38 was validated under QEMU, but this is not automated anywhere in the upstream build system.

**Known build failures:** None on record. Debian buildd `rv-osuosl-03` built 3.4.0-1+b1 successfully.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| StringToDouble | Full | Full | Full |
| DoubleToString (Grisu) | Full | Full | Full |
| DoubleToString (Bignum fallback) | Full | Full | Full |
| StringToFloat | Full | Full | Full |
| Hex-float parsing | Full | Full | Full |
| QuietNaN / SignalingNaN detection | Full | Full | Full (standard IEEE path) |
| SIMD-accelerated paths | None | None | None |

**Functional gaps:** None. All conversion algorithms are portable C++ and execute identically on riscv64.

**Performance gaps:** No architecture-specific SIMD exists for any platform, so there is no riscv64-specific performance deficit relative to arm64 or amd64. Performance differences are a function of the scalar microarchitecture (integer multiply latency, branch prediction) and are not addressable within this library. No public benchmark data comparing double-conversion throughput on riscv64 vs x86-64 or aarch64 exists in any source reviewed.

**Security hardening gaps:** Data not available - no source reviewed discussed CFI, stack canaries, or sanitizer coverage specific to riscv64 in this library.

**NaN / floating-point semantics:** RISC-V uses standard IEEE 754 NaN bit ordering. The MIPS/PA-RISC reversal bug (issue #171, fixed in v3.1.7 via PR #172) does not affect RISC-V. The `ieee.h` file is correct for riscv64 without any special case.

**Open correctness bug relevant to all platforms including riscv64:**

[PR #304](https://github.com/google/double-conversion/pull/304) (open as of 2026-08-11): `StringToFloat("0x8a4.d047p-140")` returns a value off by one ULP from `strtof`. Affects subnormal hex-floats and those whose significand exceeds 53 bits. Fix uses round-to-odd in `RadixStringToIeee`. This is not riscv64-specific but affects any user of `StringToFloat` with the described inputs on all platforms.

---

## 7. CI/CD Infrastructure

All four GitHub Actions workflow files (`ci.yml`, `cifuzz.yml`, `scons.yml`, `scorecard.yml`) were read in full. Zero references to "riscv", "riscv64", "qemu", or cross-compilation exist in any file.

**CI comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream GitHub Actions runner | Yes (`ubuntu-latest`, `macos-latest`, `windows-latest`) | Partial (implicit on `macos-latest` arm64) | No |
| QEMU emulation in CI | No | No | No |
| Cross-compile job in CI | No | No | No |
| Fuzzing (cifuzz.yml) | Yes (`ubuntu-latest`) | No | No |
| SCons build job (scons.yml) | Yes | No | No |
| RISE native riscv64 runner | No | No | No |
| Distro buildd (external) | Yes | Yes | Yes (Debian ports `rv-osuosl-03`) |

riscv64 is tested only by Debian's external porter machines, not by anything in the upstream repository. The `__riscv` path in `utils.h` is compile-time dead code from the CI perspective - it is never exercised by any upstream CI job.

**RISE involvement:** None. double-conversion does not appear in any RISE working group tracker, no RISE blog post references it, and no RISE runner is configured in its CI.

---

## 8. Distribution and Release Status

**GitHub Releases:** Source-only. GitHub API confirms `assets: []` for v3.4.0, v3.3.1, and v3.3.0. No prebuilt binaries, no riscv64 archives, no wheels. The project distributes only auto-generated GitHub source tarballs (zip/tar.gz).

**PyPI:** No package. `https://pypi.org/pypi/double-conversion/json` returns HTTP 404. The RISE wheel builder redirects to the same 404. Not applicable.

**npm, Maven, OCI:** Data not available - not searched.

**Debian:** Available in the ports archive (not the main Debian archive). Version 3.4.0-1+b1, built on `rv-osuosl-03` (OSU Open Source Lab Debian porter machine), status "Installed". The `+b1` suffix denotes a BinNMU (binary-only NMU rebuild triggered for loong64 that included riscv64). The `arch: any` declaration means the package builds on all Debian-supported architectures. Debian riscv64 is a ports architecture, not a release-tier-1 architecture; packages are in `debian-ports`, not the main archive.

**Ubuntu:** `libdouble-conversion3 3.3.0-1build1` and `libdouble-conversion-dev 3.3.0-1build1` are listed for riscv64 in Ubuntu Noble (24.04) via `packages.ubuntu.com`. [NEEDS VERIFICATION - this was not re-verified against the Ubuntu API in the final pass.] Ubuntu riscv64 is also a ports architecture.

**Arch Linux RISC-V:** Unknown. The archriscv.felixc.at site returned no usable data for double-conversion. Upstream Arch Linux has `double-conversion 3.4.0-1` in the Extra repository for x86_64.

**What a user must do:** Build from source using the CMake commands in Section 5, or install via a distribution package manager on Debian/Ubuntu riscv64 ports. No prebuilt upstream artifact exists.

---

## 9. Dependencies

double-conversion has no external runtime dependencies. The CMakeLists.txt references only the C++ standard library. The test harness (`test/cctest`) is self-contained with no gtest or third-party frameworks.

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------|------|---------------|--------------|-----------------|-----------------|
| C++ standard library (libstdc++/libc++) | Integer types, `memmove`, `memcpy`, `assert` | Yes (ships with GCC/Clang for riscv64) | Passes (tested via glibc/libstdc++ CI) | Available in Debian riscv64 | None |
| CMake >= 3.29 | Build tool only | Yes (available in Debian riscv64) | N/A | Yes | None |

No dependencies with JIT, SIMD, cryptography, or non-trivial numerics exist. No recursion required.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#304](https://github.com/google/double-conversion/pull/304) | Fix double rounding of hex-floats in StringToFloat | Open PR (2026-08-11) | Correctness | `StringToFloat("0x8a4.d047p-140")` off by 1 ULP vs `strtof`. Affects subnormal hex-floats and those with significand > 53 bits. Fix uses round-to-odd. All platforms affected including riscv64. |
| [#153](https://github.com/google/double-conversion/issues/153) | StringToDouble ~25-30% slower than dtoa for multi-digit inputs | Open (since 2021-02-XX) | Performance | Benchmarked: `"1.1"` 402ms vs 318ms (dtoa) at 10M iterations; `"12345.678"` 513ms vs 385ms. Cause: per-call flag-checking overhead in `StringToIeee`. Platform not specified; not riscv64-specific. |
| [#83](https://github.com/google/double-conversion/issues/83) | ToPrecision has worse performance than sprintf for some numbers | Open (since 2018-11-XX) | Performance | `DigitGenCounted` in `fast-dtoa.cc` falls back to slow bignum for numbers of form `N * 10^M`. Not riscv64-specific. |

**Closed issues relevant to riscv64 context (resolved, not active):**

[Issue #171](https://github.com/google/double-conversion/issues/171) / [PR #172](https://github.com/google/double-conversion/pull/172) (closed 2022-01-10): Wrong QuietNaN bit on MIPS and PA-RISC. Fixed in v3.1.7. RISC-V uses standard IEEE NaN ordering and is not affected.

**No open RISC-V-specific bugs exist.** Searches across all ~295 issues and PRs returned zero results mentioning "riscv" or "riscv64" except for PR #38 (merged 2016).

---

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support exist in any upstream source. The port has been present since 2016 with no controversy.

**Technical blockers:** None. The library is pure portable C++ with correct IEEE 754 handling. No x87-style precision issue, no NaN encoding issue, no ABI concern.

**Organizational blockers:** None. The maintainer (Florian Loitsch at Toitware ApS) has demonstrated willingness to merge riscv64-relevant changes quickly and with minimal process.

**Acceptance probability for future changes:** High for correctness fixes and CI additions. The acceptance pattern for arch detection changes (2-line diff, QEMU evidence) is well established.

---

## 13. Investment Analysis

RISE has no current involvement in double-conversion. No RISE-funded work, runner, or blog coverage exists for this project.

### 13.1 Functional Enablement

No functional work is needed. The library is fully functional on riscv64. The `__riscv` macro has been in the codebase since November 2016 and covers all RISC-V targets (rv32 and rv64) with a single predefined compiler macro.

### 13.2 Performance Optimization

The library has no SIMD paths for any architecture. Adding RVV (RISC-V Vector extension) intrinsics would require algorithmic redesign, as the Grisu/Bignum algorithms are inherently scalar and branchy. There is no evidence that vectorization would materially improve throughput given the algorithm structure.

The open performance issues (#153, #83) are algorithmic in nature and affect all platforms equally. Fixing them upstream would benefit riscv64 as a side effect but are not riscv64-specific investments.

### 13.3 CI/CD Infrastructure

The sole actionable gap is the absence of riscv64 CI. Adding a QEMU-based cross-compile and test job to `.github/workflows/ci.yml` would close this gap. This is a low-effort mechanical change. Given the library is a 10-file pure C++ codebase with no architecture-specific algorithms, CI value is primarily regression detection for the `CORRECT_DOUBLE_OPERATIONS` macro path.

### 13.4 Ecosystem Enablement

Not applicable. double-conversion is a C++ source library with no Python, npm, or Maven distribution.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 QEMU cross-compile and test job to `ci.yml` | 0.5 | Any contributor | Low |
| Correctness | Upstream fix for hex-float double-rounding (PR #304) | 0 (PR already open, track and verify merge) | Track only | Medium |
| Performance | Fix StringToDouble per-call overhead (issue #153) | 3-5 (algorithmic refactor) | Upstream | Low |

**Overall assessment:** double-conversion requires no investment for functional riscv64 enablement - it is already complete. The only gap is upstream CI coverage, which is a cosmetic quality-of-life improvement rather than an enablement blocker. The open correctness bug (PR #304) is worth tracking to closure but does not require new engineering resources.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [PR #38 - Add support for the RISC-V ISA (merged 2016-11-18)](https://github.com/google/double-conversion/pull/38)
- [Issue #4 - Architecture detection in utils.h missing cases for non-GCC compilation (closed 2014-11-30)](https://github.com/google/double-conversion/issues/4)
- [Issue #73 - Support for Microblaze and OpenRISC (closed 2018-09-08)](https://github.com/google/double-conversion/issues/73)
- [Issue #83 - ToPrecision has worse performance than sprintf for some numbers (open)](https://github.com/google/double-conversion/issues/83)
- [Issue #153 - StringToDouble ~25-30% slower than dtoa for multi-digit inputs (open)](https://github.com/google/double-conversion/issues/153)
- [Issue #171 - Wrong QuietNaN bit check on mips* architectures (closed 2022-01-10)](https://github.com/google/double-conversion/issues/171)
- [PR #172 - Fix QuietNaN check for MIPS and PA-RISC (merged 2022-01-10)](https://github.com/google/double-conversion/pull/172)
- [PR #208 - Add loongarch support for ClickHouse (closed 2023-08-10, not merged)](https://github.com/google/double-conversion/pull/208)
- [PR #304 - Fix double rounding of hex-floats in StringToFloat (open 2026-08-11)](https://github.com/google/double-conversion/pull/304)
- [google/double-conversion GitHub repository](https://github.com/google/double-conversion)
- [double-conversion Debian tracker](https://tracker.debian.org/pkg/double-conversion)
- [Debian riscv64 buildd status for double-conversion](https://buildd.debian.org/status/package.php?p=double-conversion)
- [Ubuntu Noble packages - libdouble-conversion3 riscv64](https://packages.ubuntu.com/search?keywords=double-conversion&suite=noble&searchon=names&section=all&arch=riscv64)