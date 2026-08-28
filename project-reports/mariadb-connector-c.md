---
title: MariaDB Connector/C
---

# MariaDB Connector/C

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for MariaDB Connector/C<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MariaDB Connector/C is a C client library for connecting to MariaDB and MySQL database servers, distributed under LGPL-2.1. The project is developed under the [mariadb-corporation](https://github.com/mariadb-corporation/mariadb-connector-c) GitHub organization, which is owned by MariaDB Corporation Ab, the commercial entity behind MariaDB - this is distinct from the nonprofit MariaDB Foundation, which governs MariaDB Server itself. No governance documentation specific to Connector/C was found: the repository contains no MAINTAINERS, OWNERS, or CODEOWNERS file.

Recent commit history is dominated by a single MariaDB Corporation engineer, Georg Richter, who accounts for the overwhelming majority of recent commits (bug fixes, CVE fixes such as CONC-838/842/843/846/847, TLS/PS protocol work). Other recent/active contributors include Michal Schorm, `rusher`, and `sunhaiyong1978`. All-time top contributors by commit count include `9EOR9`/`9E0R9` (MariaDB Corp), `vaintroub`/`vuvova` (Vladislav Vaintroub, MariaDB Corp), `dbart`, `dr-m` (Marko Makela, MariaDB Corp), `sanja-byelkin` (MariaDB Corp), `grooverdan` (Daniel Black, MariaDB Foundation), `kalebaran`, and `markus456` (MariaDB Corp, MaxScale). Employer affiliations beyond Georg Richter's public role were inferred from commit/handle patterns rather than independently confirmed via an official roster [NEEDS VERIFICATION].

No formal "supported architecture tier" policy exists for Connector/C: there is no PLATFORMS.md, SUPPORT.md, or docs/platforms/ directory in the repository. The project takes an informal stance - if it builds with standard C and CMake, it is considered supported - rather than an explicit tiered-platform RFC process. New architecture support in practice has been driven by downstream distro packagers filing small build-system fixes, not by an internal Connector/C architecture-enablement initiative.

Source: [mariadb-corporation/mariadb-connector-c](https://github.com/mariadb-corporation/mariadb-connector-c), [mariadb.com/kb/en/mariadb-connector-c](https://mariadb.com/kb/en/mariadb-connector-c/).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-12-01 | [PR #295](https://github.com/mariadb-corporation/mariadb-connector-c/pull/295) "mark RISC-V64 as 64-bit architecture" filed by `hrw` (Marcin Juszkiewicz, Red Hat) | GitHub |
| 2025-12-01 (7 min later) | [PR #296](https://github.com/mariadb-corporation/mariadb-connector-c/pull/296) "add riscv64 and loongarch64 to lib64 matches" filed by `zhangwenlong8911` (Wenlong Zhang, Loongson) | GitHub |
| 2026-01-25 | `ottok` comments on PR #295 that Fedora's `mariadb11.8` package had already carried this exact fix downstream since Dec 1, confirming distro-packager demand | GitHub |
| 2026-02-05 | `grooverdan` (MariaDB Foundation) comments on PR #296: "like #295" | GitHub |
| 2026-02-09 | PR #295 merged (merge commit `532350d`, base/head branch `3.4`) | GitHub API |
| 2026-02-16 | PR #296 closed unmerged by maintainer `9EOR9`: "Closing PR - it was merged with #295" | GitHub |
| 2026-06-10 | v3.4.9 released - first release tag containing PR #295's fix (verified via commit-ancestry compare: v3.4.8 does not contain it, v3.4.9 does) | GitHub releases |

Key contributors: Marcin Juszkiewicz (Red Hat) authored the merged fix; Wenlong Zhang (Loongson) authored the superseded duplicate that additionally covered `loongarch64`.

**Is it fully upstream?** Only partially. PR #295's riscv64 fix is merged and shipped in v3.4.9 on the `3.4` branch. However, verification against the live `3.4` branch tip shows the `loongarch64` addition from PR #296 was never actually merged despite the maintainer's closing comment claiming it was folded into #295 - the current `cmake/install.cmake` line lists only `x86_64, ppc64, ppc64le, aarch64, s390x, riscv64`, with no `loongarch64`. Additionally, the fix was never backported to the `3.3` maintenance branch, whose `cmake/install.cmake` still lists only `x86_64, ppc64, ppc64le, aarch64, s390x` with no riscv64 as of this research. No dedicated riscv64 tracking issue, CI job, or architecture-specific code path exists anywhere in the repository - the entire riscv64-specific footprint is this single one-line CMake regex fix.

Sources: [PR #295](https://github.com/mariadb-corporation/mariadb-connector-c/pull/295), [PR #296](https://github.com/mariadb-corporation/mariadb-connector-c/pull/296).

## 3. Upstream Support Tier

No formal tier policy document exists. Support for any architecture, including riscv64, is de facto defined by (a) whether the code compiles via the generic CMake/portable-C paths, and (b) whether a CI job exists to validate it. Neither the release process nor CI treats riscv64 as release-blocking.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI validated | Yes (`ubuntu-latest`, `windows-latest`, `macos-latest` matrix) | No dedicated arm64 CI runner found in `ci.yml`/`test-matrix.json` either | No |
| Release-blocking | Yes (default runner) | No | No |
| Official GitHub release binaries | None (repo ships tag/source only - `assets: []` on every checked release) | None | None |
| Hand-tuned architecture code | Yes (asm context switch, SSE4.2/PCLMUL CRC32, SSE2 chunk-copy in bundled zlib) | Yes (asm context switch, NEON CRC32, NEON chunk-copy) | No - falls through to generic scalar/`ucontext` fallback |

Sources: [.github/workflows/ci.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.github/workflows/ci.yml), [mariadb-corporation/connector-ci-build-matrix](https://github.com/mariadb-corporation/connector-ci-build-matrix), GitHub Releases API.

## 4. Technical Architecture and RISC-V-Specific Subsystems

A full recursive tree scan of the repository (529 files on branch `3.4`) plus targeted greps for `.S`/`.asm` files, `arch/` directories, and ISA keywords (`riscv`, `neon`, `avx`, `sse`, `simd`, `zbb`, `zba`, `vfloat`, `vector`, `crc32`) confirms no `arch/riscv/` directory and no RISC-V branches in any dispatch code exist anywhere in the source tree.

| Component | amd64 | arm64 | riscv64 | Quality on riscv64 |
|---|---|---|---|---|
| Async context switching (`libmariadb/ma_context.c`, `include/ma_context.h`) | Hand-written asm (`MY_CONTEXT_USE_X86_64_GCC_ASM`, 9 saved registers) | Hand-written asm (`MY_CONTEXT_USE_AARCH64_GCC_ASM`, 22 saved registers) | No `__riscv` branch in the `#elif` chain; falls through to `MY_CONTEXT_USE_UCONTEXT` (POSIX `ucontext.h`/`swapcontext()`) or Boost.Context if `WITH_BOOST_CONTEXT=ON` | Scalar/portable fallback - functional, unoptimized, not a stub of an attempted riscv64 path |
| zlib CRC32 (bundled, `external/zlib/crc32_simd.c`, `crc32.c`) | SSE4.2+PCLMUL intrinsics (`CRC32_SIMD_SSE42_PCLMUL`) | ARMv8 CRC32 intrinsics (`CRC32_ARMV8_CRC32`) | No RISC-V guard; dispatch is `#if defined(__x86_64__) \|\| defined(__aarch64__)` only | Scalar CRC table lookup |
| zlib Adler32 (`external/zlib/adler32_simd.c`) | x86 SSSE3 (`ADLER32_SIMD_SSSE3`) | ARM NEON (`ADLER32_SIMD_NEON`) | None | Scalar fallback |
| zlib inflate chunk-copy (`external/zlib/chunkcopy.h`) | SSE2 (`<emmintrin.h>`) | NEON (`<arm_neon.h>`) | Not built at all on riscv64 - file `#error`s if neither SSE2 nor NEON is defined, so it is excluded from the riscv64 build entirely (gated behind those flags) | N/A - excluded from build |
| Build-system arch classification (`cmake/install.cmake`, RPM `lib64` path) | Matched | Matched | Fixed by [PR #295](https://github.com/mariadb-corporation/mariadb-connector-c/pull/295), merged | Full, but trivial (one-line regex) |

No RVV intrinsics, no Zba/Zbb usage, and no RISC-V-specific `.S` assembly files exist anywhere in the tree. On riscv64 the library runs entirely through generic/portable C code, including the generic zlib fallback for checksums.

Sources: source inspection of [`include/ma_context.h`](https://github.com/mariadb-corporation/mariadb-connector-c), [`external/zlib/crc32_simd.c`](https://github.com/mariadb-corporation/mariadb-connector-c), [`external/zlib/adler32_simd.c`](https://github.com/mariadb-corporation/mariadb-connector-c), [`external/zlib/chunkcopy.h`](https://github.com/mariadb-corporation/mariadb-connector-c), GitHub code search (`riscv`, `riscv64`, `rvv`, `vfloat32m1_t` scoped to the repo - all zero results).

## 5. Build System, Cross-Compilation, and Toolchain

No riscv64-specific documentation, toolchain file, Dockerfile, or CI job exists in the repository. Files checked, all confirmed to contain no riscv64 reference: `README`, `CMakeLists.txt` (648 lines - `CMAKE_SYSTEM_PROCESSOR` is used only for package-filename labeling), `cmake/linux_x86_toolchain.cmake` (the only toolchain file in the repo, and it targets 32-bit x86, unrelated to riscv64), the project wiki (`prerequisites.md`, `install.md`, `compiling.md`, `configuration_options.md`), and `.github/workflows/ci.yml`. No `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `CROSS-COMPILING.md` exist. No Dockerfiles exist in the repository at all.

Generic build commands (apply to any Linux architecture including a native riscv64 build), from the wiki:
```
mkdir build && cd build
cmake ../mariadb-connector-c -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local
make
```
CI's actual Linux invocation (`.github/workflows/ci.yml`):
```
cmake . -DCMAKE_BUILD_TYPE=RelWithDebInfo -DWITH_EXTERNAL_ZLIB=On
make
```
Stated toolchain minimums (`prerequisites.md`): gcc 3.4.6 or newer, cmake 2.8.12+, OpenSSL 1.0.1+ or GnuTLS 3.4+. The repository's actual `CMAKE_MINIMUM_REQUIRED` is 3.12.0, so the wiki text is stale. No riscv-specific minimum GCC/Clang version is documented anywhere.

Relevant build flags with architecture relevance: `WITH_BOOST_CONTEXT=ON|OFF` is the only flag with documented arch relevance - the docs state that "on x86_64, i386, and aarch64, a native implementation is always used over `ucontext` or `boost::context`," implying riscv64 falls through to `ucontext` or Boost.Context. This is consistent with the code-level finding in Section 4 but is not itself documented as a riscv64 statement by the project.

No QEMU-based cross-compilation instructions exist anywhere in the repository's own documentation. No known riscv64 build failures were found in issues, PRs, or CI logs (there is no riscv64 CI to produce such logs - see Section 7).

Sources: [wiki: compiling.md, prerequisites.md, configuration_options.md](https://github.com/mariadb-corporation/mariadb-connector-c/wiki), [CMakeLists.txt](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/CMakeLists.txt).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature/Aspect | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Core client protocol / SQL functionality | Full | Full | Full (generic C, no arch dependency) | None |
| TLS (OpenSSL backend) | Full | Full | Full (riscv64 support exists in OpenSSL - see Section 9) | None |
| Compression (zlib/zstd) | SIMD-accelerated | SIMD-accelerated | Scalar fallback only | Performance gap, not functional |
| Non-blocking API context switch | Hand-tuned asm | Hand-tuned asm | `ucontext`/Boost.Context fallback | Performance gap, not functional |
| Official prebuilt binary | None (source/tag only) | None | None | Equal - no gap vs. amd64/arm64 (no arch has GitHub release binaries) |
| CI test coverage | Full (every push/PR/schedule) | None found | None | Missing entirely for riscv64 (and apparently for arm64) |

No functional gaps (i.e., features that cannot run at all on riscv64) were identified in the findings - riscv64 uses the same portable C code paths that every non-x86_64/non-aarch64 platform uses, and these paths are functionally complete. The only gaps identified are performance-related, stemming from the absence of SIMD/hand-tuned-asm paths for CRC32/Adler32 checksums (bundled zlib) and coroutine context switching (falls back to `ucontext` instead of hand-tuned asm). No NaN or floating-point semantics issues were found in the findings for this project. No security-hardening gaps specific to riscv64 were found in the findings.

Data not available: quantified performance delta between the SIMD paths (amd64/arm64) and the riscv64 scalar fallback - no benchmarks were found (see Section 11).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was verified by reading the actual CI configuration source directly, not by inference:

- `.github/workflows/ci.yml` (checked on branches `3.4`, `main`, `master`, `3.3`, `3.2`, `3.1`): `grep -i riscv` returns zero matches on every branch. The workflow defines jobs `setup`, `ci-server`, `ci-clang` (all `runs-on: ubuntu-latest`), and a matrix-driven `ci` job (`runs-on: ${{ matrix.os }}`). The inline `additional-matrix` JSON only adds Windows entries.
- External matrix generator `mariadb-corporation/connector-ci-build-matrix@main`, which actually produces the job matrix consumed by the `ci` job: `test-matrix.json` contains 17 entries, every one using `os` of `ubuntu-latest`, `macos-latest`, or `windows-latest`. `build.sh` and `action.yml` were also checked - zero riscv references in either.
- `.travis.yml` and `appveyor.yml`: zero riscv matches in both.
- No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` exist in the repository.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | GitHub-hosted `ubuntu-latest` (plus Travis, AppVeyor) | None found | None |
| QEMU emulation | N/A | Not found | Not found |
| RISE-provided runner | N/A | Not found | None - MariaDB is not a RISE member and no RISE-project involvement was found for this project (see Section 12) |
| Test execution tied to any riscv64 build | N/A | N/A | None |

Sources: [.github/workflows/ci.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.github/workflows/ci.yml), [.travis.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.travis.yml), [appveyor.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/appveyor.yml), [mariadb-corporation/connector-ci-build-matrix](https://github.com/mariadb-corporation/connector-ci-build-matrix).

## 8. Distribution and Release Status

| Channel | riscv64 status | Evidence |
|---|---|---|
| GitHub Releases | Not a valid channel for any architecture - zero binary assets on any of the last 5 release tags checked (v3.4.9, v3.3.19, v3.4.8, v3.3.18, v3.4.7) | `gh api repos/mariadb-corporation/mariadb-connector-c/releases` |
| PyPI | Not applicable - confirmed 404 for `mariadb-connector-c` and URL-encoded variants; this is a C library, not a Python package | Direct HTTP fetch |
| Debian | Package entirely absent - `tracker.debian.org` states "This package is not part of any Debian distribution," removed 2019-04-01, for every architecture, not specifically riscv64 | [Debian tracker](https://tracker.debian.org/pkg/mariadb-connector-c) |
| Arch Linux RISC-V | No standalone `mariadb-connector-c` entry found on the riscv port status page; `mariadb`/`mariadb-libs` appear only as build dependencies of unrelated packages | [archriscv.felixc.at status page](https://archriscv.felixc.at) |
| Ubuntu | **Available.** `libmariadb3`/`libmariadb-dev`/`libmariadb-dev-compat` confirmed for riscv64 via `rmadison`: `libmariadb3 \| 1:10.11.7-2ubuntu2 \| noble/universe \| amd64, arm64, armhf, ppc64el, riscv64, s390x`, also present in noble-updates, noble-security, jammy, focal, and newer series | Ubuntu ports archive / `rmadison` |

Note: the Ubuntu binary package is named `libmariadb3`/`libmariadb-dev`, not literally "mariadb-connector-c" - this is the standard mapping for this upstream library but is an inference on package-name correspondence, not a literal string match.

**What a user must do to get a working riscv64 binary today:** install from Ubuntu's `libmariadb3`/`libmariadb-dev` packages (noble or later). There is no other verified official or community binary channel for riscv64. Building from source via the generic CMake instructions in Section 5 is also viable, since Ubuntu's riscv64 package is itself built from this same upstream source with no riscv64-specific patches beyond PR #295.

Sources: GitHub Releases API, [PyPI](https://pypi.org/pypi/mariadb-connector-c/json), [Debian package tracker](https://tracker.debian.org/pkg/mariadb-connector-c), [archriscv.felixc.at](https://archriscv.felixc.at), Ubuntu `rmadison`/ports archive.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| OpenSSL | TLS/crypto backend (default on non-Windows) | Supported | Supported, intermittent CI flakiness | Supported | One open flaky-test issue (`test_lhash occasionally failing on linux-riscv64 CI`, #30880) and one constant-time-AES issue (#20980); neither blocks basic riscv64 builds. See `project-reports/openssl.md` |
| zlib (bundled by default) | Default/fallback compression codec | Supported (scalar fallback, no riscv64 SIMD) | Supported | Supported | No open riscv64 issues found. See `project-reports/zlib.md` |
| zstd | Optional/preferred compression codec | Supported | Supported | Supported | One open, unmerged perf-optimization PR (`huf_decompress: enable 4-way fast loop on riscv64`, facebook/zstd#4622), non-blocking. See `project-reports/zstd.md` |
| curl (libcurl) | Optional HTTP client (`WITH_CURL=ON` default) | Supported | Supported | Supported | No functional riscv64 blockers found; only compiler-warning noise. See `project-reports/libcurl.md` |
| GnuTLS | Alternate TLS backend (non-default) | [NEEDS VERIFICATION] - not independently checked in this pass | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Out of scope for this pass; not in `scope.yml` |
| Boost.Context | Optional coroutine backend (`WITH_BOOST_CONTEXT=ON`) on platforms lacking a native fcontext implementation | Supported - native riscv64 fcontext assembly merged upstream (boostorg/context#192, "Add support for building on riscv64 with Clang") | Supported (boostorg/context issue #306 closed as resolved) | Supported | Historical gap: issue #243 noted riscv64 asm silently not compiled for Boost 1.83, resolved in later releases; requires a sufficiently recent Boost version. Not in `scope.yml` |
| iconv | Character-set conversion (`WITH_ICONV`, non-Windows) | Not checked - inherits platform libc riscv64 status | Not checked | Not checked | Out of scope for this pass |

None of OpenSSL, zlib, zstd, or libcurl have open issues that would block a riscv64 build or test of MariaDB Connector/C today - all riscv64-tagged open items found are performance-optimization PRs or CI-flakiness reports, not correctness blockers. Version floors for these dependencies are not pinned in-tree; Connector/C uses whatever `find_package`/`find_library` resolves on the build host, so riscv64 readiness for any given build is a function of the system-provided library versions, not of Connector/C's own code.

## 11. Known Bugs and Active Issues

No riscv64-specific issues, PRs, or commits exist in the repository beyond the two build-system fixes already covered in Section 2. The repository has 21 open issues total (as of 2026-08-12); none reference RISC-V under any query variant tried (`riscv`, `riscv64`, `riscv64 performance`, `riscv64 bug`, `riscv nan floating`).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#295](https://github.com/mariadb-corporation/mariadb-connector-c/pull/295) | mark RISC-V64 as 64-bit architecture | Merged (v3.4.9) | Low (packaging path only) | Not backported to `3.3` branch |
| [#296](https://github.com/mariadb-corporation/mariadb-connector-c/pull/296) | add riscv64 and loongarch64 to lib64 matches | Closed, unmerged | Low | `loongarch64` portion was lost despite closing comment claiming it was merged with #295 |

No correctness bugs, performance benchmarks, or NaN/floating-point issues specific to riscv64 were found for this project via GitHub search (3 query variants) or the searches attempted in the RISE blog and Debian buildd status. Web-search-based verification of this specific finding was compromised: WebSearch calls in this research session returned empty result sets for all queries regardless of content, which is inconsistent with normal search behavior and suggests a tool malfunction rather than confirmed zero-hit queries [NEEDS VERIFICATION] - flagging that the "no benchmarks/bugs found" conclusion for this section rests more heavily on GitHub-native search than intended.

Data not available: riscv64 vs. arm64/amd64 performance benchmarks for MariaDB Connector/C - none found; WebSearch tool malfunction during this session prevents full confidence that none exist.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found in any PR or issue discussion - both PRs (#295, #296) were merged/closed without pushback, and #295's approval was expedited by evidence of real downstream (Fedora) demand.

**Technical blockers:** None identified. The library is pure portable C with no riscv64-specific gap beyond optimization (Section 6), and the one packaging fix needed has already been merged.

**Organizational blockers:**
- MariaDB is not a member of the RISE Project. Checked against [riseproject.dev/members](https://riseproject.dev/members/): Premier Members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General Members are Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip (BOSC), Canonical, Douyin, ISCAS, Microchip, NextSilicon, SpacemiT, ZTE. No database vendor is present.
- No RISE blog post, RISE-funded work, or `riseproject-dev` GitHub repository referencing MariaDB or MariaDB Connector/C was found (checked via `gh repo list riseproject-dev` - 49 repos reviewed, none related; `gh search code`/`gh search repos` against the org; and the RISE wheel-builder package list, which contains no MariaDB entry).
- No formal architecture-tier acceptance process exists to be blocked by (Section 3) - acceptance for the one relevant fix was informal and fast once filed.
- The fix was never backported to the `3.3` maintenance branch, and the `loongarch64` half of PR #296 was lost despite a maintainer comment claiming otherwise - this reflects light/inattentive maintenance follow-through rather than active resistance.

**Acceptance probability for further riscv64 work:** High. The precedent (PR #295) shows the maintainers merge riscv64 fixes readily when submitted, with no ideological or technical objection on record. The main risk is not rejection but simply lack of attention/follow-through (as evidenced by the lost `3.3` backport and lost `loongarch64` addition).

Sources: [riseproject.dev/members](https://riseproject.dev/members/), [riseproject.dev](https://riseproject.dev), [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), `gh repo list riseproject-dev`.

## 13. Investment Analysis

RISE has done zero work specific to MariaDB Connector/C - it is not a RISE member project, has no RISE blog coverage, no RISE-funded commits, and does not appear in the RISE wheel builder. All riscv64-relevant work found (the two build-system PRs) originated from Red Hat and Loongson contributors responding to their own distro-packaging needs, unrelated to RISE. Nothing here should be discounted as "already covered" by RISE.

### 13.1 Functional Enablement

Functionally, riscv64 already works: the library compiles cleanly through generic C/CMake paths, Ubuntu already ships working `libmariadb3`/`libmariadb-dev` riscv64 packages built from this exact upstream source, and the one required build-system fix (PR #295) is merged on the `3.4` branch. Remaining functional work is small and mechanical:
- Backport PR #295 to the `3.3` maintenance branch (currently missing the riscv64 regex entry).
- Re-submit or confirm the `loongarch64` portion lost from PR #296 if loongarch64 is in scope for other efforts (not the case for this report, riscv64 itself is unaffected).
- Restore/verify Debian packaging: the standalone `mariadb-connector-c` source package was removed from Debian in 2019; if a dedicated Debian package (vs. bundling into `mariadb-server`) is desired, this requires re-adding the package, which would then need riscv64 buildd verification.

### 13.2 Performance Optimization

The only performance gap identified is the absence of SIMD/hand-tuned-asm on riscv64 for (a) bundled-zlib CRC32/Adler32 checksums and (b) non-blocking-API coroutine context switching (falls back to `ucontext`). Both are lower-priority for a thin client library where these paths are not typically the throughput bottleneck (network I/O and server-side query execution dominate). No performance benchmarks quantifying the actual delta were found (Section 11), so the magnitude of this gap is unverified - initial investment should include benchmarking before committing to SIMD work.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists in any form (GitHub Actions, Travis, AppVeyor). Adding a riscv64 job to the existing `ubuntu-latest`-based matrix (either via QEMU emulation or a native riscv64 runner) is the highest-leverage infrastructure investment, since it would catch regressions the two current merged/closed PRs show can otherwise sit unbackported (the `3.3` branch gap) or lost (the `loongarch64` case) for months.

### 13.4 Ecosystem Enablement

Not applicable - MariaDB Connector/C has no dependent package ecosystem of the type addressed by this section (Python/npm/Maven/Kubernetes packages depending on it); it is a C client library consumed directly by applications and language-binding wrappers, none of which were surfaced in this research as riscv64-blocked by Connector/C itself.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Backport PR #295's riscv64 fix to the `3.3` maintenance branch | 0.5 | Upstream contributor / community PR | Medium |
| Functional | Verify/re-establish standalone Debian packaging for riscv64 (currently absent for all arches since 2019) | 1-2 | Debian maintainer coordination | Low |
| CI/CD | Add riscv64 job to `.github/workflows/ci.yml` (QEMU or native runner) | 1-2 | Upstream contributor / community PR | High |
| Performance | Benchmark riscv64 scalar fallback vs. amd64/arm64 SIMD paths for compression/context-switch to quantify the gap before further investment | 1 | Internal (chip company) | Medium |
| Performance | If benchmarking shows material impact, add RVV/Zbb-accelerated CRC32/Adler32 path in bundled zlib (mirrors existing SSE/NEON pattern) - note this overlaps with the separately tracked zlib project itself (see `project-reports/zlib.md`) rather than Connector/C-specific code | 2-4 | Upstream contributor | Low (contingent on benchmark results) | 

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [mariadb-corporation/mariadb-connector-c](https://github.com/mariadb-corporation/mariadb-connector-c) (repository)
- [MariaDB Connector/C homepage](https://mariadb.com/kb/en/mariadb-connector-c/)
- [PR #295: mark RISC-V64 as 64-bit architecture](https://github.com/mariadb-corporation/mariadb-connector-c/pull/295)
- [PR #296: add riscv64 and loongarch64 to lib64 matches](https://github.com/mariadb-corporation/mariadb-connector-c/pull/296)
- [.github/workflows/ci.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.github/workflows/ci.yml)
- [.travis.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.travis.yml)
- [appveyor.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/appveyor.yml)
- [mariadb-corporation/connector-ci-build-matrix](https://github.com/mariadb-corporation/connector-ci-build-matrix)
- [MariaDB Connector/C wiki](https://github.com/mariadb-corporation/mariadb-connector-c/wiki)
- [Debian package tracker: mariadb-connector-c](https://tracker.debian.org/pkg/mariadb-connector-c)
- [Debian buildd status](https://buildd.debian.org/status/package.php?p=mariadb-connector-c)
- [Arch Linux RISC-V porting status](https://archriscv.felixc.at)
- [RISE Project](https://riseproject.dev)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [boostorg/context PR #192: Add support for building on riscv64 with Clang](https://github.com/boostorg/context/pull/192)
- [facebook/zstd #4622: huf_decompress enable 4-way fast loop on riscv64](https://github.com/facebook/zstd/pull/4622)
- MariaDB Server RISC-V build issues (separate project, for contrast only): MDEV-35827, MDEV-36217, MDEV-34815, MDEV-23051 (referenced via jira.mariadb.org REST API)
- Ubuntu ports archive / `rmadison` output for `libmariadb3`/`libmariadb-dev`
- GitHub Releases API output for `mariadb-corporation/mariadb-connector-c`
- PyPI direct fetch (`pypi.org/pypi/mariadb-connector-c/json`)