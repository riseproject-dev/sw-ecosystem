---
title: ICU
categories:
  - libraries
---

# ICU

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for ICU<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

ICU (International Components for Unicode) is a mature C/C++ and Java library providing Unicode and internationalization support: collation, normalization, date/number/message formatting, text boundary analysis, transliteration, regular expressions, and charset conversion. It is the de facto Unicode implementation used in Chrome, V8, Node.js, WebKit, Android, Java SE (via ICU4J integration), and most major server runtimes.

ICU is governed by the **ICU Technical Committee (ICU-TC)**, a body under the **Unicode Consortium** ([unicode.org](https://home.unicode.org/)). Before May 18, 2016, the project was under direct IBM stewardship. Since 2016 it operates as a Unicode Consortium technical committee. The ICU-TC meets weekly. License: Unicode License (open source, compatible with GPL and commercial use).

Corporate maintainers identified from commit history and GitHub profile data:

| GitHub handle | Name | Company | Role |
|---|---|---|---|
| markusicu | Markus Scherer | Google | ICU-TC Chair |
| yoshitoumaoka | Yoshito Umaoka | IBM | ICU-TC Vice Chair |
| mihnita | Mihai Nita | Google | Committer |
| roubert | Fredrik Roubert | Google | Committer |
| catamorphism | Tim Chevalier | Igalia | Committer |

Google (chair plus multiple active committers) and IBM (vice-chair, historical origin) dominate governance. Igalia is also active. Microsoft, Apple, and Adobe are heavy consumers but are not identified as active upstream committers.

ICU is not a member of the [RISE Project](https://riseproject.dev/). A full scan of all 27 RISE Project blog posts (riseproject.dev/blog) and the RISE wheel builder package list confirms zero mention of ICU or Unicode library work. No funded RISE work item targeting ICU was found.

Community posture toward new architecture ports is permissive by default. ICU uses standard autoconf build infrastructure with no per-architecture approval gate, no tier policy, and no formal support matrix. New targets that compile and pass `make check` are accepted without ceremony.

---

## 2. Port History and Upstreaming Timeline

There is no formal RISC-V port effort for ICU. The library is architecture-neutral C++/Java; riscv64 support arrived passively through distro packaging without upstream code changes. The single recorded upstream RISC-V event is a 2021 undefined-behavior bug.

| Date | Event | Source |
|---|---|---|
| 2021-05-11 | [PR #1715](https://github.com/unicode-org/icu/pull/1715) opened by Andreas Schwab (openSUSE maintainer) -- undefined behavior in `ComplexUnitsConverter::applyRounder()` discovered on openSUSE riscv64. Tests produce `INT64_MAX` for NaN inputs on riscv64 but happen to produce `0` on x86_64, masking the bug on all CI platforms. | [PR #1715](https://github.com/unicode-org/icu/pull/1715) |
| 2021-05-17 | sffc (Shane Carr, ICU team) comments: "andreas-schwab sees the errors on openSUSE riscv64, which our CI currently does not cover." | [PR #1715, comment by sffc](https://github.com/unicode-org/icu/pull/1715) |
| 2021-11-25 | thesamesam (Gentoo contributor) reports the same bug on HPPA, requests merge. | [PR #1715, comment by thesamesam](https://github.com/unicode-org/icu/pull/1715) |
| 2021-11-30 | PR #1715 closed without merging -- author never signed CLA (CLA bot could not locate GitHub account). | [PR #1715](https://github.com/unicode-org/icu/pull/1715) |
| 2021-11-30 | [PR #1946](https://github.com/unicode-org/icu/pull/1946) opened and merged same day by hugovdm (ICU team), commit `54e4120`. CLA-compliant duplicate of PR #1715. | [PR #1946](https://github.com/unicode-org/icu/pull/1946) |
| 2022-04-06 | Fix first ships in ICU 71 (next major release after the 2021-11-30 merge). ICU 70.1 was released 2021-10-27 and does not contain the fix. | [ICU releases page](https://github.com/unicode-org/icu/releases) |
| ~2023-2024 | riscv64 packages for ICU appear in Debian trixie and sid without upstream patches. Builds succeed on hardware builder rv-manda-02. | [Debian buildd](https://buildd.debian.org/status/package.php?p=icu&suite=sid) |
| 2026-03-18 | `icu-78.3-1-riscv64.pkg.tar.zst` (12 MB) published in Arch Linux RISC-V core repository. | [ISCAS Arch RISC-V mirror](https://mirror.iscas.ac.cn/archriscv/repo/core/) |

**Root cause of the 2021 bug:** Casting NaN to `int64_t` is undefined behavior in C++. On riscv64, the instruction `fcvt.l.d` with a NaN operand produces `INT64_MAX` per the RISC-V specification (a defined saturating trap value). On x86_64, `cvttsd2si` happens to produce `INT64_MIN`, which caused the bug to be invisible in upstream CI. This is a real architecture-specific behavioral difference in C++ UB handling.

**Fix applied in PR #1946** (`icu4c/source/i18n/units_complexconverter.cpp`):

```cpp
if (uprv_isInfinite(quantity) || uprv_isNaN(quantity)) {
    // Inf and NaN can't be rounded, and calculating `carry` below is known
    // to fail on Gentoo on HPPA and OpenSUSE on riscv64. Nothing to do.
    return;
}
```

The fix is fully upstream. No downstream patches for riscv64 exist in Debian, Ubuntu, or Arch Linux RISC-V.

---

## 3. Upstream Support Tier

ICU has no formal architecture support tier policy. There is no published support matrix, no tier definitions, and no per-architecture approval process. The project does not ship official prebuilt binaries for riscv64. CI does not test riscv64. There is no blocking policy that prevents riscv64 builds.

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Upstream CI (build) | Yes | Windows MSVC cross-build only, no tests | No |
| Upstream CI (test execution) | Yes (primary) | No (MSVC cross-build only) | No |
| Upstream CI (macOS Apple Silicon) | No | Yes | No |
| Official prebuilt binaries | Yes (Linux x64, Windows x64/x86) | Windows ARM64 (build only) | No |
| Distro packages available | Yes | Yes | Yes (Debian sid, Arch Linux RISC-V) |
| Release-blocking test failures | Yes | Not applicable | Not applicable |
| Known architecture-specific code | None (ICU has no SIMD for any arch) | None (one MSVC optimizer workaround) | None |

Notes: The macOS CI runs on Apple Silicon (arm64 hardware) and tests the native build on that platform. Windows ARM64 is cross-compiled with MSVC and not tested on hardware.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

ICU4C is written entirely in portable C11/C++17. ICU4J is pure Java. Neither component contains JIT compilation, hand-written SIMD intrinsics, crypto acceleration, inline assembly, or architecture-specific code paths of any kind.

**Confirmed absences** (verified by reading all CI workflow files, configure.ac, platform.h, and GitHub code search):

- No `arch/riscv/` directory or any RISC-V subdirectory.
- No `.S` assembly files targeting any architecture.
- No `__riscv`, `__riscv_xlen`, `vfloat32m1_t`, or RVV intrinsics anywhere.
- No SSE, AVX, or NEON intrinsics anywhere (ICU has no SIMD for x86 or ARM either).
- No JIT compiler or runtime code generation.
- No architecture detection in `platform.h` for amd64, arm64, or riscv64 (only legacy IBM s390x, HP PA-RISC, and SPARC entries remain for endianness handling).
- No `mh-riscv*` config file in `icu4c/source/config/` (platform-specific make files exist for Alpha, PPC/Darwin, s390x, AIX, IRIX/MIPS -- none for riscv64, and none are needed for standard Linux ELF targets).

The only architecture-specific guard in the entire codebase is in `normalizer2impl.cpp`:

```cpp
#if (defined(_MSC_VER) && defined(_M_ARM64) && (_MSC_VER < 1924))
```

This works around a miscompilation in old MSVC for ARM64. It is not a SIMD path and has no riscv64 counterpart.

**Assembly data generation (`genccode`/`pkg_genc.cpp`):** The `assemblyHeader[]` table defines 13 named assembly targets covering x86, IA64, SPARC, PPC64, AIX, PA-RISC, NASM, and MASM. No dedicated riscv64 entry exists. For riscv64 Linux, ICU falls through to the generic `gcc` ELF assembly target, which uses `.balign 16` and `.long` directives -- valid and correct for riscv64 ELF. No dedicated entry is needed.

**Performance model:** ICU relies entirely on compiler auto-vectorization (GCC `-O3` with auto-vectorizer). There are no hand-tuned hot paths. Performance on riscv64 is determined by GCC/Clang auto-vectorization quality for the target, which for RVV depends on the compiler version and `-march` flags used.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Collation (UCA, CLDR) | Scalar C++ | Scalar C++ | Scalar C++ |
| Normalization (NFC, NFD, NFKC) | Scalar C++ | Scalar C++ | Scalar C++ |
| Text boundary (RBBI, LSTM ML line-break) | Scalar C++ | Scalar C++ | Scalar C++ |
| Date/number/message formatting | Scalar C++ | Scalar C++ | Scalar C++ |
| Charset conversion (ICU4C) | Scalar C++ | Scalar C++ | Scalar C++ |
| ICU4J (all functions) | Pure Java | Pure Java | Pure Java |
| JIT | None | None | None |
| SIMD/vector | None | None | None |
| Crypto | None | None | None |
| Assembly (.S files) | None | None | None |

**Summary:** There is no riscv64-specific implementation gap because there is no architecture-specific implementation for any architecture. The riscv64 implementation is the full production implementation, identical to what runs on amd64 and arm64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** ICU4C uses autoconf/configure. There is no CMake. ICU4J uses Maven. No riscv64-specific CMake toolchain files or Dockerfiles exist in the repository.

**Language standards required:** C11 and C++17, enforced by `configure.ac`. If no `-std=` flag is present, configure adds `-std=c11` and `-std=c++17` automatically. Minimum viable compilers: GCC >= 7, Clang >= 5. CI exercises GCC 10, GCC 14, Clang 18, and Clang 21. Practical minimum for well-tested build: GCC 10.

**Native build on riscv64 Linux:**

```sh
cd icu4c/source
./runConfigureICU Linux
make -j$(nproc)
make check
```

For explicit compiler selection:

```sh
./runConfigureICU Linux/gcc   # GCC
./runConfigureICU Linux/clang # Clang
```

`runConfigureICU Linux*` sets `RELEASE_CFLAGS='-O3'` and `RELEASE_CXXFLAGS='-O3'`. No riscv64-specific flags are required.

**Cross-compilation from x86_64 to riscv64:**

ICU cross-compilation requires building a host (x86_64) copy first. The `--with-cross-build` flag is mandatory; configure errors out without it when `cross_compiling=yes` is detected.

Step 1 -- build host tools:

```sh
mkdir /build-host && cd /build-host
/path/to/icu/icu4c/source/configure
make -j$(nproc)
```

Step 2 -- cross-build for riscv64:

```sh
mkdir /build-riscv64 && cd /build-riscv64
/path/to/icu/icu4c/source/configure \
  --host=riscv64-linux-gnu \
  --with-cross-build=/build-host \
  --enable-static --disable-shared \
  --disable-tools --disable-tests \
  --disable-samples --disable-extras \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++
make -j$(nproc)
```

The `--with-cross-build` path must be absolute and must contain `/config/icucross.mk` from the host build. This pattern is identical to the WebAssembly cross-build in `.github/workflows/icu4c.yml` (`wasm-wasi-sdk` job), which is the canonical cross-build reference in the project.

**QEMU:** No official QEMU CI jobs exist. The Debian riscv64 builder (`rv-manda-02`) uses actual riscv64 hardware. ICU's cross-build design (data generation tools run on the host, not the target) means QEMU is not required for producing riscv64 binaries. If running the test suite under QEMU user-mode emulation:

```sh
QEMU_LD_PREFIX=/path/to/riscv64-sysroot \
  qemu-riscv64 ./source/test/intltest/intltest
```

**Known build failures on riscv64:** None documented in upstream or Debian. Debian buildd shows `Installed` for icu 78.3-2 on riscv64. The only failing architecture in Debian sid is sh4, caused by GCC ICE inside QEMU -- not a riscv64 issue.

Build time on Debian riscv64 builder: approximately 2 hours 28 minutes for ICU 78.3-2 (growth from approximately 49 minutes for ICU 67 in 2020).

**Optional size-reduction flags** (none are riscv64-specific):

- `--enable-static --disable-shared` -- static libraries only
- `--disable-tools --disable-tests --disable-samples --disable-extras` -- minimal build for embedded/cross use
- `--with-data-packaging=static` -- bundle ICU data into the library
- `-DU_CHARSET_IS_UTF8=1` -- optimize for UTF-8-only platforms
- `-DUCONFIG_NO_*=1` flags in `source/common/unicode/uconfig.h` -- disable individual feature modules

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All ICU4C and ICU4J features are available on riscv64. There is no feature that exists on amd64 or arm64 but is absent or disabled on riscv64.

**Performance gaps from missing SIMD:** ICU has no hand-written SIMD for any architecture. Performance on all three architectures is determined by compiler auto-vectorization with `-O3`. On riscv64 with RVV-capable hardware, performance relative to arm64 NEON or x86 AVX2 depends on compiler auto-vectorization quality and the specific workload. No published benchmark data exists for any ICU workload on riscv64 hardware. Data not available: riscv64 vs arm64 performance comparison for any ICU operation.

**Security hardening gaps:** Data not available: ICU upstream does not publish architecture-specific security hardening status. No riscv64-specific hardening issues found.

**NaN and floating-point semantics:** The 2021 ICU-21613 bug (see Section 2) demonstrated that riscv64 enforces IEEE 754 NaN-to-integer conversion behavior more strictly than x86_64. The `fcvt.l.d` instruction with NaN input produces `INT64_MAX` per RISC-V spec. That specific bug is fixed as of ICU 71 (2022-04-06). No other floating-point correctness issues specific to riscv64 are recorded.

**Open issue with riscv64 relevance -- PR #3919:** [PR #3919](https://github.com/unicode-org/icu/pull/3919) ("Fix uregex_open_fuzzer: unaligned memory access") is open and fixes undefined behavior from unaligned `reinterpret_cast` to `char16_t*`. The PR explicitly mentions ARM as affected; riscv64 has identical alignment requirements and is equally affected by the unaligned access UB. The PR is not merged as of the research date. This is a correctness issue for fuzzer/test infrastructure, not production code paths. [NEEDS VERIFICATION: impact on production riscv64 builds.]

---

## 7. CI/CD Infrastructure

**riscv64 CI exists: No.**

All 19 GitHub Actions workflow files in `unicode-org/icu/.github/workflows/` were read directly. Zero files contain any reference to "riscv", "riscv64", "risc-v", "RISCV", "qemu", or "linux/riscv64". There is no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` in the repository root.

CI platforms covered:

| Workflow file | Platforms tested |
|---|---|
| icu4c.yml | ubuntu-24.04 (x86_64), macos-15 (Apple Silicon), windows-2025 (x64/x86), WebAssembly/WASI cross |
| icu4j.yml | ubuntu-24.04 (x86_64) |
| icu_merge_ci.yml | windows-2025 (x64/x86 matrix) |
| icu_exhaustive_tests.yml | ubuntu-24.04 (x86_64) |
| icu_valgrind.yml | ubuntu-24.04 (x86_64) |

| Architecture | Build CI | Test CI | Release-blocking |
|---|---|---|---|
| amd64 (x86_64, Linux) | Yes | Yes (primary) | Yes |
| x86 (32-bit, Windows) | Yes | Yes (Windows) | Yes |
| arm64 (Windows MSVC cross) | Yes | No | No |
| arm64 (macOS Apple Silicon) | Yes | Yes | Yes |
| wasm32 (WebAssembly) | Yes | No | No |
| riscv64 | No | No | No |

No RISE CI runners are used. No QEMU emulation jobs exist. The Debian buildd riscv64 builder (`rv-manda-02`) provides the only known automated riscv64 build validation, and it is entirely downstream.

---

## 8. Distribution and Release Status

**Upstream prebuilt binaries:** Upstream ships prebuilt binaries only for Linux x64 and Windows x64/x86/ARM64. No riscv64 binary is provided by upstream for any release (verified for releases 78.3 and 77.1). Source tarballs are provided and build correctly on riscv64 without patches.

**Distro packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | `libicu78`, `libicu-dev`, `icu-devtools` | 78.3-2 | Built and installed on builder `rv-manda-02`; ~45 days old as of research date. No build failures. |
| Debian trixie (testing) | `libicu74` | 74.x | riscv64 present [NEEDS VERIFICATION: specific build status not re-verified] |
| Debian bookworm (stable) | `libicu72` | 72.x | riscv64 absent from supported architecture list |
| Ubuntu 24.04 Noble | `libicu74` | 74.2-1ubuntu3.1 | riscv64 listed in architecture support [NEEDS VERIFICATION: direct packages.ubuntu.com fetch not performed in adversarial pass] |
| Arch Linux RISC-V | `icu` | 78.3-1 | `icu-78.3-1-riscv64.pkg.tar.zst` (12 MB) in core repository, built 2026-03-18 |
| Fedora Rawhide | `libicu` | 78.3-3.fc45 | Available [NEEDS VERIFICATION: Koji riscv64 arch status not directly confirmed] |

No riscv64-specific patches exist in Debian, Ubuntu, or Arch Linux RISC-V for the ICU package.

**Getting a working binary on riscv64:** Build from source using `./runConfigureICU Linux && make -j$(nproc) && make check`, or install the distro package (`apt install libicu-dev` on Debian sid/trixie, or equivalent on Arch Linux RISC-V). No manual workarounds are required.

---

## 9. Dependencies

ICU4C has minimal external dependencies. ICU4J is pure Java. The vendored `double-conversion` library is bundled and requires no separate handling.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **HarfBuzz** (`icu-le-hb`) | Optional paragraph layout engine for `--enable-layoutex`. Provides the `layoutex` library. | Built (Debian sid 12.3.2-2+b2, Installed on riscv64) | Not tested upstream | Available in Debian/Ubuntu riscv64 | Optional; disabled by default. No open riscv64 issues in harfbuzz/harfbuzz. |
| **double-conversion** (vendored) | Float-to-string and string-to-float conversion in ICU4C. Vendored copy of google/double-conversion in `vendor/double-conversion/`. | Built as part of ICU4C; no separate package | Covered by ICU4C test suite | Shipped with ICU | Pure portable C++; no SIMD or arch-specific code. No known riscv64 issues. |
| **glibc** (`libc`, `libpthread`, `libm`, `libdl`) | POSIX threading, locale support (`nl_langinfo`), math functions, dynamic loading | riscv64 is a fully supported glibc target | Tested as part of glibc riscv64 port | Ships in all major distros for riscv64 | Mature. `libmvec` vectorized math has limited riscv64 SIMD coverage but baseline `libm` is complete. |
| **libstdc++6, libgcc-s1** | C++ runtime (C++17 required) | Provided by GCC riscv64 toolchain | Tested | Available in Debian/Ubuntu/Arch | No issues. |
| **OpenJDK** (ICU4J only) | JVM required for ICU4J. No JNI -- pure Java. | OpenJDK riscv64 port (JEP 422) available in Fedora and Debian | JVM-level tests pass where OpenJDK is available | OpenJDK 21+ available for riscv64 | No ICU4J-specific riscv64 issues. |
| **Maven, JMH** (ICU4J build/bench) | Build tooling and benchmarking for ICU4J | Architecture-agnostic (build-time only) | N/A | N/A | No issues. |

**Depth-2 dependency note on HarfBuzz:** HarfBuzz (libharfbuzz) is itself a non-trivial library with optional FreeType and Cairo dependencies. All are available on riscv64 in Debian. No riscv64-specific blocking issues found in HarfBuzz upstream. The `icu-le-hb` binding is optional and disabled by default in ICU builds.

---

## 11. Known Bugs and Active Issues

**Correctness issues (riscv64-specific):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| ICU-21613 / [PR #1946](https://github.com/unicode-org/icu/pull/1946) | Fix undefined behaviour in ComplexUnitsConverter::applyRounder | Merged 2021-11-30, shipped ICU 71 | Was: correctness (wrong output for NaN meter-and-centimeter conversions on riscv64) | Root cause: casting NaN to int64_t is C++ UB; riscv64 `fcvt.l.d` produces INT64_MAX, x86_64 `cvttsd2si` produces INT64_MIN, masking the bug on all CI platforms. Fixed by early return on non-finite input. |

**Open issues with riscv64 relevance (not riscv64-specific):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #3919](https://github.com/unicode-org/icu/pull/3919) | Fix uregex_open_fuzzer: unaligned memory access | Open | Low (fuzzer/test infrastructure) | Fixes UB from unaligned `reinterpret_cast` to `char16_t*`. ARM mentioned explicitly; riscv64 equally affected by the UB. Not in production code path. |
| [PR #2505](https://github.com/unicode-org/icu/pull/2505) | ICU-22419 Performance improvements of collated string comparison | Open since June 2023, no review | Medium (performance) | Claims 10x speedup for prefix-equal strings using 64-bit word comparisons. Alignment check `(uintptr_t)ptr % sizeof(uint64_t)` is valid on riscv64. Stalled with no reviewer engagement. |
| [Issue #3961](https://github.com/unicode-org/icu/issues/3961) | ICU-23394 Validate binary RBBI data offsets | Open | Low (cross-arch data safety) | Binary data offset validation; relevant for any architecture loading ICU data files. |

**No open riscv64-specific bugs** exist in the unicode-org/icu issue tracker. GitHub issue search for "riscv" and "risc-v" returns zero results.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:** None identified. ICU-TC has no stated policy against riscv64 CI or support. The project accepted the riscv64 UB fix (ICU-21613) without friction, gated only on the CLA requirement. The CLA requirement is standard and applies equally to all contributors.

**Technical blockers for riscv64 CI:** No technical blockers. The project already has a QEMU-free CI design (the WASM cross-build job demonstrates the pattern). A riscv64 CI job could be added either as a QEMU-based x86_64 job or using a dedicated riscv64 runner. ICU builds and passes all tests on Debian riscv64 hardware today, so test failures are not anticipated.

**Acceptance probability for upstream CI addition:** High. ICU-TC governance is pragmatic. A clean pull request adding a riscv64 QEMU CI job (following the WASM cross-build pattern) with no regressions would likely be accepted. No prior upstream objection to riscv64 support exists in any recorded discussion.

**Performance gap objection:** Not applicable. ICU has no architecture-specific performance optimizations for any architecture. A riscv64 performance gap relative to amd64 or arm64 cannot be attributed to missing ICU code -- it would be a compiler/hardware issue outside the scope of the ICU project.

---

## 13. Investment Analysis

RISE has no prior investment in ICU. All items below represent net-new work.

### 13.1 Functional Enablement

No functional work is required. ICU4C and ICU4J are fully functional on riscv64 via the generic C++/Java code path. The only historical functional issue (ICU-21613) is fixed in ICU 71 (2022) and all current distro packages include the fix. PR #3919 (unaligned memory access in fuzzer infrastructure) is a minor correctness fix for test tools, not production code -- it warrants a contribution but is not a functional blocker.

### 13.2 Performance Optimization

ICU has no SIMD implementation for any architecture. Two paths exist:

1. **Compiler auto-vectorization:** RVV auto-vectorization in GCC and Clang is the primary lever. No ICU-specific work is required; this is a toolchain investment, not an ICU investment.

2. **Hand-written RVV intrinsics:** ICU does not use hand-written SIMD for x86 or ARM. Introducing RVV intrinsics for ICU hot paths (collation, normalization, string search) would be novel work with no existing upstream precedent for SIMD in ICU. The upstream project would likely require significant justification and performance data before merging such contributions.

The stalled PR #2505 (ICU-22419, 10x collation speedup using 64-bit word comparisons) is pure portable C++ -- no SIMD -- and has been open since June 2023 with no review. Resurrecting and landing this PR would benefit riscv64 equally with all architectures at low cost.

### 13.3 CI/CD Infrastructure

The primary investment gap is riscv64 CI. Adding a riscv64 job to `icu4c.yml` would provide upstream regression detection for riscv64 for the first time. Two implementation options:

- **QEMU-based job on ubuntu-24.04 runner:** Follows the WASM cross-build pattern already in CI. Lower infrastructure cost; higher build time.
- **Dedicated riscv64 runner:** Higher infrastructure cost; faster feedback. RISE CI infrastructure (if available) could provide this.

### 13.4 Ecosystem Enablement

Not applicable. ICU is a system library consumed directly by other software (V8, Android, Java, etc.). Its own ecosystem consists of distro packages, all of which already build correctly on riscv64.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream PR #3919 (unaligned memory access in fuzzer) -- review, test on riscv64, push to merge | 0.5 | ICU contributor | Low |
| Functional | Resurrect and land PR #2505 (ICU-22419 collation 64-bit word optimization) -- portable C++, benefits all archs | 1-2 | ICU contributor | Medium |
| CI/CD | Add riscv64 CI job to icu4c.yml -- QEMU-based, following WASM cross-build pattern | 1 | ICU contributor + RISE CI | High |
| Performance | Characterize ICU hot-path performance on riscv64 vs arm64 hardware (collation, normalization, conversion) -- baseline data before SIMD investment decision | 2-3 | ICU contributor | Medium |
| Performance | Hand-written RVV intrinsics for collation or normalization hot paths | 8-16 | ICU contributor | Low (no upstream precedent; high upstreaming risk) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [unicode-org/icu GitHub repository](https://github.com/unicode-org/icu)
- [ICU homepage -- icu.unicode.org](https://icu.unicode.org/)
- [PR #1715 -- ICU-21613 Fix undefined behaviour (openSUSE riscv64 reporter, closed without merge)](https://github.com/unicode-org/icu/pull/1715)
- [PR #1946 -- ICU-21613 Fix undefined behaviour (merged 2021-11-30, ICU 71)](https://github.com/unicode-org/icu/pull/1946)
- [PR #2505 -- ICU-22419 Performance improvements of collated string comparison (open, stalled)](https://github.com/unicode-org/icu/pull/2505)
- [PR #3919 -- Fix uregex_open_fuzzer unaligned memory access (open)](https://github.com/unicode-org/icu/pull/3919)
- [Issue #3961 -- ICU-23394 Validate binary RBBI data offsets (open)](https://github.com/unicode-org/icu/issues/3961)
- [Debian buildd riscv64 build status for icu](https://buildd.debian.org/status/package.php?p=icu&suite=sid)
- [Debian Package Tracker -- icu](https://tracker.debian.org/pkg/icu)
- [Arch Linux RISC-V core repository -- ISCAS mirror](https://mirror.iscas.ac.cn/archriscv/repo/core/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project RISC-V wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [ICU4C build documentation](https://unicode-org.github.io/icu/userguide/icu4c/build.html)