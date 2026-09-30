---
title: ICU
parent: Project Reports
color: yellow
dependencies:
  - name: HarfBuzz
    relation: runtime-dependency
    criticality: optional
  - name: double-conversion
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: optional
  - name: OpenJDK
    relation: runtime-dependency
    criticality: optional
  - name: Maven
    relation: build-dependency
    criticality: optional
  - name: JMH
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="icu" %}

# ICU

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for ICU<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ICU (International Components for Unicode) is a mature C/C++ and Java library providing Unicode and internationalization support: collation, normalization, date/number/message formatting, text boundary analysis, transliteration, regular expressions, and charset conversion. It is the de facto Unicode implementation used in Chrome, V8, Node.js, WebKit, Android, Java SE (via ICU4J integration), and most major server runtimes.

ICU is governed by the **ICU Technical Committee (ICU-TC)**, a body under the **Unicode Consortium** ([unicode.org](https://home.unicode.org/)). Before May 18, 2016, the project was under direct IBM stewardship; since 2016 it operates as a Unicode Consortium technical committee. The ICU-TC meets weekly. License: the Unicode License, a permissive open-source license compatible with GPL and commercial use.

Corporate maintainers identified from prior commit-history and GitHub-profile research (not re-verified this session; this session's GitHub API access to `unicode-org/icu` was scoped out, so MAINTAINERS/CODEOWNERS content could not be re-pulled):

| GitHub handle | Name | Company | Role |
|---|---|---|---|
| markusicu | Markus Scherer | Google | ICU-TC Chair |
| yoshitoumaoka | Yoshito Umaoka | IBM | ICU-TC Vice Chair |
| mihnita | Mihai Nita | Google | Committer |
| roubert | Fredrik Roubert | Google | Committer |
| catamorphism | Tim Chevalier | Igalia | Committer |

Google (chair plus multiple active committers) and IBM (vice-chair, historical origin, founded ICU in 1999 as "IBM Classes for Unicode," rooted in Taligent technology acquired 1996) dominate governance. Igalia is also active. Microsoft, Apple, and Adobe are heavy consumers but are not identified as active upstream committers. [NEEDS VERIFICATION: this maintainer/employer table could not be re-confirmed against `unicode-org/icu`'s own MAINTAINERS or CODEOWNERS file this session, since repository access was scoped to `riseproject-dev/sw-ecosystem` only.]

ICU is not a member of the [RISE Project](https://riseproject.dev/). Direct fetches of the RISE members page list 8 Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 General Members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE); neither ICU nor Unicode appears. A full scan of all 35 RISE Project blog posts (2024-05-15 through 2026-09-28) confirms zero post mentions ICU, PyICU, or Unicode/i18n work directly on the `unicode-org/icu` project. Separately, ICU-adjacent work does exist in a RISE-run downstream repository (`riseproject-dev/python-wheels`, see Sections 10-equivalent discussion under Section 9 and Section 13) building PyICU wheels for riscv64, but this is downstream Python-packaging engineering, not upstream ICU contribution or RISE membership by Unicode/ICU-TC.

Community posture toward new architecture ports is permissive by default. ICU uses standard GNU Autotools build infrastructure with no per-architecture approval gate, no tier policy, and no formal support matrix documented in `docs/userguide/icu4c/build.md`. New targets that compile and pass `make check` are accepted without ceremony, as demonstrated by the riscv64-motivated bug fix landing within a single day of a maintainer reimplementing it (see Section 2).

## 2. Port History and Upstreaming Timeline

There is no formal RISC-V port effort for ICU. The library is architecture-neutral C++/Java; riscv64 support arrived passively through distro packaging without upstream code changes. The single recorded upstream RISC-V event is a 2021 undefined-behavior bug, and it is fully resolved.

| Date | Event | Source |
|---|---|---|
| 2021-05-11 | [PR #1715](https://github.com/unicode-org/icu/pull/1715) opened by Andreas Schwab (openSUSE riscv64 packager) -- undefined behavior in `ComplexUnitsConverter::applyRounder()` discovered on openSUSE riscv64. The existing NaN unit-conversion test fails with garbage output `9,223,372,036,854,775,807 m` (INT64_MAX) instead of the expected `0 m`. | [PR #1715](https://github.com/unicode-org/icu/pull/1715) |
| 2021-05-17 | sffc (ICU maintainer) comments: "andreas-schwab sees the errors on openSUSE riscv64, which our CI currently does not cover." A contemporaneous maintainer admission that ICU's CI does not exercise riscv64. Same day, sffc notes the PR is technically approvable pending CLA: "As soon as you take steps to make @CLAassistant happy, we can merge this PR." | [PR #1715, comment thread](https://github.com/unicode-org/icu/pull/1715) |
| 2021-08-25 | hugovdm (ICU maintainer) proposes reimplementing the fix under his own CLA-signed authorship rather than continuing to wait on Andreas Schwab's CLA. | [PR #1715, comment thread](https://github.com/unicode-org/icu/pull/1715) |
| 2021-11-29 | [PR #1946](https://github.com/unicode-org/icu/pull/1946) opened by hugovdm: a CLA-compliant reimplementation of the identical one-line guard from PR #1715. | [PR #1946](https://github.com/unicode-org/icu/pull/1946) |
| 2021-11-30 | PR #1715 closed, not merged, labeled "duplicate" -- blocked throughout by Andreas Schwab's unsigned CLA, not by any technical objection. PR #1946 merged the same day (commit `54e4120`). | [PR #1715](https://github.com/unicode-org/icu/pull/1715), [PR #1946](https://github.com/unicode-org/icu/pull/1946) |
| 2022-03-30 / 2022-04-06 | Fix first ships in tag `release-71-1` (ICU 71). Verified directly via local git clone: `release-70-1` (tagged 2021-10-27) does not contain the merge commit; `release-71-1` does. ICU 70 does not have the fix. | Local clone of `unicode-org/icu`, tag comparison |
| ~2023-2024 | riscv64 packages for ICU appear in Debian trixie/sid without upstream patches. | [Debian buildd](https://buildd.debian.org/status/package.php?p=icu&suite=sid) |
| 2026-03-18 | `icu-78.3-1-riscv64.pkg.tar.zst` published in the Arch Linux RISC-V core repository. | [ISCAS Arch RISC-V mirror](https://mirror.iscas.ac.cn/archriscv/repo/core/) |
| 2026 (resolute cycle) | `libicu78` (78.2-2ubuntu1) and `python3-icu` confirmed built and published for riscv64 in Ubuntu 26.04 "resolute." | [packages.ubuntu.com, libicu78 riscv64](https://packages.ubuntu.com/resolute/riscv64/libicu78) |
| 2026-09-08 | Downstream (not upstream ICU): `pyicu-binary` v2.7.4 riscv64 wheel merged and published by `riseproject-dev/python-wheels`, built on RISE RISC-V Runners. | [PR #1508](https://github.com/riseproject-dev/python-wheels/pull/1508) |
| 2026-09-28 | Downstream: `pyicu-wheels` v2.15.2 (builds ICU4C 77.1 from source) riscv64 wheel merged and published by the same repo. | [PR #2454](https://github.com/riseproject-dev/python-wheels/pull/2454) |

**Root cause of the 2021 bug:** casting NaN to `int64_t` is undefined behavior in C++. On riscv64, `fcvt.l.d` with a NaN operand produces `INT64_MAX`; on x86_64, `cvttsd2si` happens to produce `INT64_MIN`, which kept the bug invisible on all of ICU's own CI. This is a genuine architecture-specific manifestation of pre-existing UB, not a riscv64-specific defect in ICU's logic.

**Fix (merged in PR #1946,** `icu4c/source/i18n/units_complexconverter.cpp`, verified directly against the current source tree**):**

```cpp
if (uprv_isInfinite(quantity) || uprv_isNaN(quantity)) {
    // Inf and NaN can't be rounded, and calculating `carry` below is known
    // to fail on Gentoo on HPPA and OpenSUSE on riscv64. Nothing to do.
    return;
}
```

The fix is fully upstream and shipped from ICU 71 onward. No downstream patches for riscv64 exist in Debian, Ubuntu, or Arch Linux RISC-V for the ICU package itself.

## 3. Upstream Support Tier

ICU has no formal architecture support tier policy. There is no published support matrix in `docs/userguide/icu4c/build.md`, no tier definitions, and no per-architecture approval process. The project does not ship official prebuilt binaries for riscv64. CI does not test riscv64 (verified against all 23 current GitHub Actions workflow files, see Section 7). There is no policy blocking riscv64 builds; the gap is purely one of upstream CI/release investment, not of stated project position.

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Upstream CI (build) | Yes | Windows MSVC cross-build; macOS Apple Silicon native | No |
| Upstream CI (test execution) | Yes (primary) | Yes on macOS Apple Silicon; no on Windows ARM64 cross | No |
| Official prebuilt binaries | Yes (Linux x64, Windows x64/x86) | Windows ARM64 (build only) | No |
| Distro packages available | Yes | Yes | Yes (Debian sid, Ubuntu 26.04 resolute, Arch Linux RISC-V) |
| Release-blocking test failures | Yes | Not applicable | Not applicable (no riscv64 gate exists) |
| Known architecture-specific code | None (ICU has no SIMD for any arch) | One MSVC-version compile guard | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

ICU4C is written entirely in portable C11/C++17. ICU4J is pure Java. Neither component contains a JIT compiler, hand-written SIMD intrinsics, crypto acceleration, inline assembly, or architecture-specific execution paths of any kind, on any architecture.

**Confirmed via direct GitHub code search this session** (search queries and hit counts):

| Search | Hits |
|---|---|
| `immintrin.h` (x86 AVX/SSE intrinsics) | 0 |
| `emmintrin.h` (x86 SSE2 intrinsics) | 0 |
| `__SSE2__` | 0 |
| `arm_neon.h` (ARM NEON intrinsics) | 0 |
| `__ARM_NEON` | 0 |
| `__aarch64__` | 1 (same shared macro list as below) |
| `__x86_64__` | 1 (same shared macro list as below) |
| `#if defined(__riscv` | 1 (`icu4c/source/i18n/double-conversion-utils.h`) |
| `vfloat32m1_t` / `rvv` (RVV intrinsics) | 0 genuine hits (all `rvv` hits are substring false positives: `rvVal`, `prvv`) |
| `path:arch/riscv` | 0 |
| `extension:S riscv` (assembly) | 0 |

The **only architecture-conditional code block in the entire repository** touching riscv64 is this vendored macro in `double-conversion-utils.h` (from Google's `double-conversion` library, not ICU-authored), which classifies ~27 architectures including `__riscv` identically for endianness purposes in float-to-string conversion:

```cpp
#if defined(_M_X64) || defined(__x86_64__) || defined(__ARMEL__) || defined(__avr32__) ||
    defined(_M_ARM) || defined(_M_ARM64) || defined(__hppa__) || defined(__ia64__) ||
    defined(__mips__) || defined(__sparc__) || defined(__sparc) || defined(__s390__) ||
    defined(__SH4__) || defined(__alpha__) || defined(_MIPS_ARCH_MIPS32R2) ||
    defined(__ARMEB__) || defined(__AARCH64EL__) || defined(__aarch64__) ||
    defined(__AARCH64EB__) || defined(__riscv) || defined(__e2k__) || defined(__or1k__) ||
    defined(__arc__) || defined(__ARC64__) || defined(__microblaze__) ||
    defined(__XTENSA__) || defined(__EMSCRIPTEN__) || defined(__wasm32__)
```

RISC-V receives exactly the same treatment as x86_64, aarch64, MIPS, SPARC, and s390 here; there is no separate riscv branch, `#else` stub, or TODO/FIXME tied to it anywhere in the codebase.

`icu4c/source/config.sub` and `icu4c/source/config.guess` list `riscv`, `riscv32`, `riscv32be`, `riscv64`, `riscv64be` purely as recognized GNU Autoconf target triplets -- generic upstream autotools boilerplate, not ICU-specific porting work.

The only other architecture-specific guard anywhere in the codebase, unrelated to riscv64, is in `normalizer2impl.cpp`:

```cpp
#if (defined(_MSC_VER) && defined(_M_ARM64) && (_MSC_VER < 1924))
```

This works around an old-MSVC ARM64 miscompilation and has no riscv64 counterpart or relevance.

**Assembly data generation (`genccode`/`pkg_genc.cpp`):** the `assemblyHeader[]` table defines named assembly targets for x86, IA64, SPARC, PPC64, AIX, PA-RISC, NASM, and MASM. No dedicated riscv64 entry exists; riscv64 Linux falls through to the generic GCC ELF assembly target (`.balign 16` / `.long` directives), which is valid and correct for riscv64 ELF without modification.

**Performance model:** ICU relies entirely on compiler auto-vectorization (`-O3`). There are no hand-tuned hot paths for any architecture.

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

**Summary:** there is no riscv64-specific implementation gap because ICU has no architecture-specific implementation for any architecture, on x86, ARM, or RISC-V. The riscv64 code path is the identical, full production implementation that runs on amd64 and arm64 -- rated **scalar (C fallback)** for all three architectures equally, with riscv64 not degraded relative to the others.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** ICU4C uses GNU Autotools (`configure`/`runConfigureICU`), not CMake. Confirmed directly: no top-level `CMakeLists.txt` exists; the only `CMakeLists.txt`/`.cmake` files in the repo are for small internal codegen tools (`tools/unicode/c/genuts46/`, `genprops/`, `genuca/`) and the vendored `vendor/double-conversion/upstream/` tree, none relevant to the main library build. ICU4J uses Maven. No riscv64-specific CMake toolchain file, Dockerfile, or `cmake/toolchain-riscv64.cmake` exists anywhere in the repository -- these paths simply do not exist.

**Language standard:** C11 and C++17, per `docs/userguide/icu4c/build.md:25` ("ICU4C requires C11 & C++17"). No riscv64-specific minimum compiler version is documented anywhere in the repo (verified by grepping all docs for version patterns like "gcc 7," "clang 10" -- zero hits). C++17 support implies practically GCC >= 7 / Clang >= 5, but ICU itself states no explicit minimum.

**Native build on riscv64 Linux:**

```sh
cd icu4c/source
./runConfigureICU Linux
make -j$(nproc)
make check
```

`runConfigureICU Linux/gcc` and `Linux/clang` profiles set `-O3` (with `-flto=auto` for GCC); neither is riscv64-specific.

**Cross-compilation** (per `docs/userguide/icu4c/build.md`, section "How To Cross Compile ICU," lines 495-527; the documented example literally uses `--host=i586-pc-haiku`, with `riscv64-linux-gnu` substituted here as the standard GNU triplet):

```sh
# Step 1: build a native ICU for the host -- needed to run ICU's own codegen tools
cd /buildA
sh /icu/source/runConfigureICU Linux/gcc
gnumake

# Step 2: cross-compile for riscv64, pointing at the host build
cd /buildB
sh /icu/source/configure --host=riscv64-linux-gnu --with-cross-build=/buildA
gnumake
```

`--with-cross-build` must be an absolute path and must contain `config/icucross.mk` from the host build; `configure` errors without it when cross-compiling is detected. Test data can be built with `gnumake tests`. This two-pass pattern is structurally identical to the WASM/WASI cross-build job already present in `.github/workflows/icu4c.yml`.

**QEMU:** no official QEMU CI job exists for ICU. Debian's riscv64 builder uses real riscv64 hardware, not emulation. ICU's cross-build design (codegen tools run on the host, not the target) means QEMU is not required to produce riscv64 binaries; it would only be needed to execute `make check` under emulation in CI.

**Known build failures on riscv64:** none documented upstream or in Debian. Debian buildd shows the ICU package as `Installed` on its riscv64 builder.

**Optional size-reduction flags** (none riscv64-specific): `--enable-static --disable-shared`; `--disable-tools --disable-tests --disable-samples --disable-extras`; `--with-data-packaging=static`; `-DU_CHARSET_IS_UTF8=1`; `-DUCONFIG_NO_*` feature-disable macros in `source/common/unicode/uconfig.h`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** none. All ICU4C and ICU4J features are available on riscv64. No feature present on amd64 or arm64 is absent or disabled on riscv64.

**Performance gaps from missing SIMD:** ICU has no hand-written SIMD on any architecture, so there is no "missing SIMD" gap specific to riscv64 -- all three architectures run the same auto-vectorized scalar C++. Data not available: no published benchmark comparing any ICU operation on riscv64 against arm64 or amd64 was found via GitHub search, web search, or the RISE blog. The closest available data points are not ICU-specific: (a) the `simdutf` project claims 3-10x speedups over ICU for non-ASCII strings and up to 20x for ASCII, but benchmarked only on x64/ARM, with no riscv64 figures; (b) an independent RVV-vs-scalar-RISC-V benchmark of UTF-8-to-UTF-16 conversion (unrelated to ICU's own code) measured 3-5x average RVV speedup on K230/BPI-F3/Milk-V Pioneer hardware, with no arm64/x86 comparison point populated. Neither substitutes for an ICU-specific riscv64 benchmark.

**Security hardening gaps:** data not available -- ICU upstream does not publish architecture-specific hardening status, and no riscv64-specific hardening issue was found in this session's searches.

**NaN and floating-point semantics:** the 2021 ICU-21613 bug (Section 2) demonstrated that riscv64's `fcvt.l.d` produces `INT64_MAX` for NaN-to-int64 conversion, versus x86_64's `INT64_MIN` from `cvttsd2si` -- a real, architecture-visible manifestation of C++ UB. This specific bug is fixed as of ICU 71 (2022). No other floating-point correctness issue specific to riscv64 is recorded.

**Open cross-architecture issues with riscv64 relevance (not riscv64-specific, still open as of 2026-09-30):**
- [PR #3919](https://github.com/unicode-org/icu/pull/3919) -- fixes unaligned-memory UB (`reinterpret_cast` to `char16_t*`) in `uregex_open_fuzzer`. ARM is explicitly named as affected in review; riscv64 has identical strict-alignment exposure. Still open, with maintainer review activity as recently as April 2026. Fuzzer/test infrastructure only, not a production code path.
- [PR #2505](https://github.com/unicode-org/icu/pull/2505) (ICU-22419) -- claims a 10x speedup for prefix-equal collated string comparison via 64-bit word comparisons; the alignment check is valid on riscv64. Open since June 2023 with no maintainer review since a June 2023 force-push.
- [PR #3961](https://github.com/unicode-org/icu/pull/3961) (ICU-23394) -- validates binary RBBI data offsets, an out-of-bounds-read fix relevant to any architecture loading ICU binary data. Open, with activity as recently as June 2026; spawned follow-up PRs #3962 and #3964 (Java port and tests).

## 7. CI/CD Infrastructure

**riscv64 CI exists: No.**

All 23 GitHub Actions workflow files in `.github/workflows/` were checked this session via GitHub code search (scoped to `path:.github/workflows`) and, independently, via direct raw-file fetch and `grep -i riscv` across every file: `icu4c.yml`, `icu4j.yml`, `icu_common.yml`, `icu_merge_ci.yml`, `icu_merge_ci_perf.yml`, `icu_exhaustive_tests.yml`, `icu_envtest.yml`, `icu_valgrind.yml`, `icu_docs.yml`, `cifuzz.yml`, `scorecard.yml`, `release-all.yml`, `release-check-sign.yml`, `release-icu4j-maven.yml`, `release-icu4c-fedora.yml`, `release-icu4c-ubuntu.yml`, `icu4c_msvcdistrelease.yml`, `icu4x_icuexportdata.yml`, `cache_retain.yml`, `update-gh-pages.yml`, `check_workflows.yml`, `wait-for-checks.yml`, `brs-commit-checker.yml`. **Zero matches for riscv/RISC-V/riscv64/qemu in any file**, in any `on:` trigger, `runs-on:` label, job name, matrix entry, or comment. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist in the repository (confirmed 0 results / 404 on all three paths).

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

No RISE CI runners are used by ICU's own upstream workflows. No QEMU emulation job exists in `unicode-org/icu`. The only automated riscv64 build validation is entirely downstream: Debian's riscv64 buildd builder (real hardware, not emulation) and, separately, RISE RISC-V Runners (`runs-on: ubuntu-24.04-riscv`, native RISC-V hardware) used by `riseproject-dev/python-wheels` to build the `pyicu-binary` and `pyicu-wheels` packages (Section 13). Neither feeds back into `unicode-org/icu`'s own CI or release process today.

## 8. Distribution and Release Status

**Upstream prebuilt binaries:** upstream ships prebuilt binaries only for Linux x64 and Windows x64/x86/ARM64. No riscv64 binary is provided by upstream for any release. GitHub release-asset data for `unicode-org/icu` could not be directly re-checked this session (repository access scoped to `riseproject-dev/sw-ecosystem` only); this is a documented access gap, not evidence of a riscv64 asset existing. Source tarballs build correctly on riscv64 without patches.

**Distro packages -- directly re-verified this session via live `packages.ubuntu.com` fetches:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libicu78` | 78.2-2ubuntu1 | Confirmed built for riscv64 (architecture row: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x). Direct download-page fetch confirms a real artifact: `libicu78_78.2-2ubuntu1_riscv64.deb`, 11,514,932 bytes. |
| Ubuntu 26.04 "resolute" | `python3-icu` | (resolute) | Confirmed built for riscv64 (architecture row: amd64, arm64, armhf, ppc64el, riscv64, s390x). |
| Debian sid | `libicu78`, `libicu-dev`, `icu-devtools` | 78.3-2 | Built and `Installed` on Debian's riscv64 hardware builder. |
| Arch Linux RISC-V | `icu` | 78.3-1 | `icu-78.3-1-riscv64.pkg.tar.zst` in the core repository, built 2026-03-18. |
| PyPI (`icu`) | -- | 0.0.1 | Not the real ICU bindings -- an unrelated stub package ("Integrated Cognitive User Assistance," GPLv3, DICE Lab). Not evidence against ICU riscv64 availability; simply the wrong package name. |
| PyPI (`PyICU`, canonical binding) | -- | -- | Not checked this session (only the unrelated `icu` stub was queried). [NEEDS VERIFICATION] |
| RISE wheel index (`pypi.riseproject.dev`) | `pyicu-binary` | 2.7.4 | Published, riscv64 wheels for cp312/cp313/cp314/cp314t. Downstream packaging, not upstream ICU or canonical PyPI. See Section 13. |
| RISE wheel index (`pypi.riseproject.dev`) | `pyicu-wheels` | 2.15.2 | Published, riscv64 wheels for cp312/cp313/cp314/cp314t, bundling ICU4C 77.1 built from source. See Section 13. |
| Fedora Rawhide | `libicu` | 78.3-3.fc45 | Reported available in prior research; Koji riscv64 architecture status not directly re-confirmed this session. [NEEDS VERIFICATION] |

**Getting a working binary on riscv64:** install the distro package (`apt install libicu-dev` on Debian sid or Ubuntu 26.04 resolute; `pacman -S icu` on Arch Linux RISC-V), or build from source with `./runConfigureICU Linux && make -j$(nproc) && make check`. No manual patches or workarounds are required for the C/C++ library. For Python users needing PyICU specifically on riscv64, `pyicu-binary` or `pyicu-wheels` from `pypi.riseproject.dev` avoids a from-source PyICU build (Section 13).

## 9. Dependencies

ICU4C has a small set of external dependencies; ICU4J adds a JVM and Java build-tooling dependency chain. The vendored `double-conversion` library ships bundled with ICU4C and requires no separate packaging.

| Dependency | Relation | Criticality | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|---|
| **HarfBuzz** | Runtime-dependency | Optional | Optional paragraph layout engine (`--enable-layoutex`, provides the `layoutex`/`icu-le-hb` library); disabled by default | Builds on riscv64 (Debian sid `12.3.2-2+b2`, installed) | Not tested by ICU's own upstream CI on any architecture, including riscv64 | Available as a Debian/Ubuntu riscv64 package | No genuine riscv64 issue found in `harfbuzz/harfbuzz` (search hits were unrelated ARMv7 and sparc64 reports). Depth-2: HarfBuzz's own optional FreeType and Cairo dependencies are both available on riscv64 in Debian. |
| **double-conversion** | Runtime-dependency | Optional | Google's float-to-string / string-to-float conversion library, vendored in `vendor/double-conversion/` | Builds as part of ICU4C; pure portable C++, no SIMD or arch-specific code (the `__riscv` macro entry in `double-conversion-utils.h` is a shared endianness classification, not special-cased logic) | Covered by the ICU4C test suite | Shipped bundled with ICU, no separate packaging | No known riscv64 issues. |
| **glibc** | Runtime-dependency | Critical | POSIX threading, locale (`nl_langinfo`), math functions, dynamic loading | riscv64 is a fully supported glibc target | Tested as part of glibc's own riscv64 port | Ships in all major riscv64 distros | Mature. `libmvec` vectorized math has limited riscv64 SIMD coverage, but the baseline `libm` functions ICU actually uses are complete. |
| **GCC** | Build-dependency | Optional | C++17 toolchain; also the source of the `libstdc++6`/`libgcc-s1` runtime libraries ICU links against | Riscv64 GCC toolchain is mature and available in Debian/Ubuntu/Arch | Tested | Available in all major riscv64 distros | No issues. Clang is a supported alternative (`runConfigureICU Linux/clang`), also mature on riscv64. |
| **OpenJDK** | Runtime-dependency | Optional | JVM required to run ICU4J; ICU4J is pure Java with no JNI | OpenJDK's riscv64 port (JEP 422) is available in Fedora and Debian | JVM-level tests pass wherever OpenJDK riscv64 is available | OpenJDK 21+ available for riscv64 | No ICU4J-specific riscv64 issues found. |
| **Maven** | Build-dependency | Optional | ICU4J build tooling (compiles and packages the Java library) | Architecture-agnostic; runs on the build host under any JVM, including riscv64 OpenJDK | N/A (build-time only) | N/A | No issues; not tracked as a separate riscv64-status project in this repository's scope. |
| **JMH** | Test-dependency | Optional | Java Microbenchmark Harness, used for ICU4J benchmarking | Architecture-agnostic; runs under any JVM | N/A (benchmarking harness, not a correctness gate) | N/A | No issues. |

All "graph" (project-graph SPARQL) queries against these dependency package names could not be run this session -- the `project-graph` MCP server returned `CONNECTION_CLOSED` for every attempt. This is a session connectivity failure, not evidence that the underlying data is absent; it should be retried once the server is reachable.

## 11. Known Bugs and Active Issues

**Correctness issue (riscv64-triggered, fixed):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| ICU-21613 / [PR #1946](https://github.com/unicode-org/icu/pull/1946) | Fix undefined behaviour in `ComplexUnitsConverter::applyRounder` | Merged 2021-11-30, shipped in ICU 71 | Was: correctness (wrong output for NaN meter-and-centimeter conversions on riscv64) | Root cause: NaN-to-`int64_t` cast is C++ UB; riscv64's `fcvt.l.d` yields `INT64_MAX` where x86_64's `cvttsd2si` yields `INT64_MIN`, masking the bug on all prior CI. Fixed by an early return on non-finite input. |

**Open cross-architecture issues with riscv64 relevance (not riscv64-specific), confirmed still open as of 2026-09-30:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #3919](https://github.com/unicode-org/icu/pull/3919) | Fix `uregex_open_fuzzer`: unaligned memory access | Open, active as recently as April 2026 | Low (fuzzer/test infrastructure) | Fixes UB from unaligned `reinterpret_cast` to `char16_t*`; ARM named explicitly, riscv64 equally exposed to the same alignment UB. Not a production code path. |
| [PR #2505](https://github.com/unicode-org/icu/pull/2505) (ICU-22419) | Performance improvements of collated string comparison | Open since June 2023, no review since a June 2023 force-push | Medium (performance) | Claims a 10x speedup for prefix-equal strings via 64-bit word comparisons; pure portable C++, alignment check valid on riscv64. Stalled on reviewer bandwidth, not on any technical objection. |
| [PR #3961](https://github.com/unicode-org/icu/pull/3961) (ICU-23394) | Validate binary RBBI data offsets | Open, active as recently as June 2026 | Low-medium (cross-arch data safety) | Fixes an out-of-bounds read in binary RBBI data deserialization, relevant to any architecture loading ICU binary data, riscv64 included. Spawned follow-ups #3962 and #3964. |

**No open riscv64-specific bugs exist** in `unicode-org/icu`. Exhaustive GitHub issue, PR, and commit search for "riscv," "riscv64," and "RISC-V," repeated independently in this session and cross-checked against the prior report, returns zero additional hits beyond the PR #1715/#1946 pair above. ICU tracks issues on Atlassian Jira rather than GitHub Issues, so there is no GitHub-native riscv64 tracking issue; the one riscv64-relevant Jira ticket (ICU-21613) is the single UB bug already fixed, not a platform-support tracking ticket.

## 12. Objections and Upstream Blockers

**Organizational blockers:** none identified. ICU-TC has no stated policy against riscv64 CI or support. The project accepted the riscv64-motivated UB fix (ICU-21613) without technical friction; the sole obstacle was the standard CLA requirement, which applies equally to all contributors and was resolved by a maintainer reimplementing the fix under CLA-compliant authorship.

**Technical blockers for riscv64 CI:** none. The project already has a QEMU-free cross-build pattern in production (the WASM/WASI job in `icu4c.yml`). A riscv64 CI job could be added either as a QEMU-based job on an existing x86_64 runner or via a native riscv64 runner (RISE RISC-V Runners already exist and are used successfully by the separate `riseproject-dev/python-wheels` project for PyICU wheel builds, demonstrating the infrastructure works for ICU-adjacent code today). ICU already builds and passes its test suite on real riscv64 hardware via Debian's buildd, so no test regressions are anticipated from adding CI.

**Acceptance probability for an upstream CI addition:** high. ICU-TC governance is pragmatic and responded to the one riscv64-motivated correctness report with a same-day merge once the CLA blocker was resolved. No prior upstream objection to riscv64 support, in any form, was found in this session's searches or the prior report's research.

**Performance-gap objection:** not applicable. ICU has no architecture-specific performance optimization for any architecture; a riscv64 performance gap relative to amd64 or arm64 would be a compiler auto-vectorization or hardware issue, not something attributable to missing ICU code.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** ICU has zero upstream riscv64 CI: all 23 GitHub Actions workflows in `unicode-org/icu` contain no riscv/RISC-V/riscv64/qemu reference, and no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist, and upstream itself publishes no riscv64 binaries -- which alone would be orange. However, Debian sid, Ubuntu 26.04 "resolute," and Arch Linux RISC-V all build and ship ICU (`libicu78`, `python3-icu`, etc.) for riscv64 from unmodified upstream source; the one riscv64-triggered bug (ICU-21613) was fixed upstream in ICU 71 ([PR #1946](https://github.com/unicode-org/icu/pull/1946)). This satisfies the clean-distro-build floor, yielding yellow rather than orange. ICU is a general-purpose i18n library with no SIMD/JIT on any architecture (identical scalar C++ on amd64/arm64/riscv64), so the optimization-purpose modifier does not apply and this is not graded as an optimization-purpose project.
- **Pending work that could change the grade:** no open riscv64-specific bugs or PRs exist against `unicode-org/icu` itself. Three cross-architecture PRs with riscv64 relevance remain open and stalled: [PR #2505](https://github.com/unicode-org/icu/pull/2505) (ICU-22419 collation speedup, open since June 2023, no review), [PR #3919](https://github.com/unicode-org/icu/pull/3919) (fuzzer unaligned-memory fix, ARM/riscv64-relevant, open), and [PR #3961](https://github.com/unicode-org/icu/pull/3961) (ICU-23394 RBBI data offset validation, open). Separately, RISE-adjacent work exists downstream in `riseproject-dev/python-wheels` (not upstream ICU): two actively maintained PyICU riscv64 wheel packages (`pyicu-binary` v2.7.4, `pyicu-wheels` v2.15.2) built on native RISE RISC-V Runners in 2026. This could eventually motivate upstream riscv64 CI but has not yet produced any change to `unicode-org/icu`'s own CI or release posture.

## 14. Investment Analysis

RISE has no prior investment in upstream `unicode-org/icu` itself. The only RISE-adjacent investment identified is downstream: `riseproject-dev/python-wheels` building and publishing `pyicu-binary` (v2.7.4, links the system ICU) and `pyicu-wheels` (v2.15.2, builds ICU4C 77.1 from source) as riscv64 wheels on RISE RISC-V Runners, both authored by Ludovic Henry as direct engineering within that repository's own porting playbook, not as a named RP-series funded project. Everything below excludes that already-completed downstream wheel work and sizes only upstream-ICU-facing gaps.

### 14.1 Functional Enablement

No functional work is required for ICU4C or ICU4J on riscv64; both run the full generic C++/Java code path. The only historical functional defect (ICU-21613) is fixed since ICU 71 (2022), and all current distro packages (Debian sid, Ubuntu 26.04 resolute, Arch Linux RISC-V) include the fix. [PR #3919](https://github.com/unicode-org/icu/pull/3919) (unaligned memory access in fuzzer infrastructure) is a minor correctness fix for test tooling, not a production blocker, but it is a good low-cost upstream contribution opportunity given riscv64's identical exposure to the underlying UB.

### 14.2 Performance Optimization

ICU has no SIMD implementation for any architecture, so there is no riscv64-specific SIMD gap to close relative to amd64/arm64. Two paths exist:

1. **Compiler auto-vectorization:** RVV auto-vectorization quality in GCC/Clang is the primary performance lever and is a toolchain investment, not an ICU-code investment.
2. **Hand-written RVV intrinsics:** ICU has no precedent for hand-written SIMD on x86 or ARM either; introducing RVV intrinsics for ICU hot paths (collation, normalization, string search) would be genuinely novel work with no existing upstream pattern to follow, and would likely require substantial performance justification before ICU-TC would accept it.

The stalled [PR #2505](https://github.com/unicode-org/icu/pull/2505) (ICU-22419, claimed 10x collation speedup via portable 64-bit word comparisons, no SIMD) has been open since June 2023 with no reviewer engagement; resurrecting and landing it would benefit riscv64 equally with all architectures at low incremental cost, since the code and alignment logic are already riscv64-valid.

### 14.3 CI/CD Infrastructure

The single largest investment gap is riscv64 CI in `unicode-org/icu` itself: no upstream regression detection for riscv64 exists today. Two implementation options:

- **QEMU-based job on an existing runner:** follows the WASM/WASI cross-build pattern already in `icu4c.yml`. Lower infrastructure cost, higher build/test latency.
- **Native riscv64 runner:** RISE RISC-V Runners already work for ICU-adjacent code (proven by the `pyicu-binary`/`pyicu-wheels` builds); the same infrastructure could plausibly back an upstream ICU job, giving faster feedback at comparable infrastructure cost to what RISE already operates.

### 14.4 Ecosystem Enablement

Not applicable as upstream investment: ICU is a system library consumed directly by other software (V8, Android, Java, etc.), and its own direct dependency set (Section 9) already builds cleanly on riscv64 across Debian, Ubuntu, and Arch. The one active ecosystem-adjacent gap, PyICU wheel availability on riscv64, has already been closed downstream by RISE's `python-wheels` project (`pyicu-binary`, `pyicu-wheels`), so no further PyICU-specific investment is required.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream [PR #3919](https://github.com/unicode-org/icu/pull/3919) (unaligned memory access in fuzzer) -- review, test on riscv64, push to merge | 0.5 | ICU contributor | Low |
| Functional | Resurrect and land [PR #2505](https://github.com/unicode-org/icu/pull/2505) (ICU-22419 collation 64-bit word optimization) -- portable C++, benefits all architectures | 1-2 | ICU contributor | Medium |
| CI/CD | Add a riscv64 CI job to `icu4c.yml` -- QEMU-based (WASM cross-build pattern) or native RISE RISC-V Runner | 1-2 | ICU contributor + RISE CI | High |
| Performance | Baseline ICU hot-path performance on riscv64 vs arm64 hardware (collation, normalization, conversion) before any SIMD investment decision | 2-3 | ICU contributor | Medium |
| Performance | Hand-written RVV intrinsics for collation or normalization hot paths | 8-16 | ICU contributor | Low (no upstream precedent for SIMD in ICU on any architecture; high upstreaming risk) |

## 15. References

- [unicode-org/icu GitHub repository](https://github.com/unicode-org/icu)
- [ICU homepage](https://icu.unicode.org/)
- [ICU4C build documentation, including cross-compilation instructions](https://unicode-org.github.io/icu/userguide/icu4c/build.html)
- [PR #1715 -- ICU-21613 undefined behaviour fix, openSUSE riscv64 reporter, closed without merge](https://github.com/unicode-org/icu/pull/1715)
- [PR #1946 -- ICU-21613 undefined behaviour fix, merged 2021-11-30, shipped ICU 71](https://github.com/unicode-org/icu/pull/1946)
- [PR #2505 -- ICU-22419 collated string comparison performance, open since June 2023](https://github.com/unicode-org/icu/pull/2505)
- [PR #3919 -- fix uregex_open_fuzzer unaligned memory access, open](https://github.com/unicode-org/icu/pull/3919)
- [PR #3961 -- ICU-23394 validate binary RBBI data offsets, open](https://github.com/unicode-org/icu/pull/3961)
- [Debian buildd riscv64 build status for icu](https://buildd.debian.org/status/package.php?p=icu&suite=sid)
- [Debian Package Tracker -- icu](https://tracker.debian.org/pkg/icu)
- [packages.ubuntu.com -- libicu78 in resolute (riscv64)](https://packages.ubuntu.com/resolute/riscv64/libicu78)
- [Arch Linux RISC-V core repository, ISCAS mirror](https://mirror.iscas.ac.cn/archriscv/repo/core/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [riseproject-dev/python-wheels -- pyicu-binary PR #1508](https://github.com/riseproject-dev/python-wheels/pull/1508)
- [riseproject-dev/python-wheels -- pyicu-wheels PR #2454](https://github.com/riseproject-dev/python-wheels/pull/2454)
- [RISE Project RISC-V wheel builder package list (superseded wheel_builder project)](https://riseproject.gitlab.io/python/wheel_builder/)
- [simdutf project (ICU speed comparison, no riscv64 figures)](https://github.com/simdutf/simdutf)
- [RVV vs scalar RISC-V Unicode conversion benchmark (not ICU-specific)](https://camel-cdr.github.io/rvv-bench-results/articles/vector-utf.html)